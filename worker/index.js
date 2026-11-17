/* 기기 옮기기(저장 임시 보관) API. 나머지 요청은 정적 파일(./site)로 넘긴다.
 *   POST   /api/transfer          본문: 게임의 저장 코드(LZString base64) → 201 {code, expiresAt}
 *   GET    /api/transfer          기능 확인 → 200 {ok:true} | 503 {error:"not_configured"}
 *   GET    /api/transfer/CODE     → 200 {data, createdAt} 후 바로 삭제(한 번만) | 404
 *   DELETE /api/transfer/CODE     올린 사람이 미리 지우기 → 200 {ok:true}
 * 보관하는 것: 저장 본문과 올린 시각(metadata.t)뿐. 요청 횟수 제한 키에는 IP의 해시만 두고 1시간 뒤 사라진다.
 * SAVE_KV 바인딩이 없으면(아직 설정 전) 모든 API가 503 not_configured를 돌려준다. docs/save-transfer.md 참고.
 * 유저 대회(/api/cup/*)는 worker/cup.js, 유저 래더(/api/ladder/*)는 worker/uladder.js. 같은 KV를 쓰고, 관리자 호출에는 비밀값 CUP_ADMIN이 필요하다.
 *   GET /api/health        KV를 쓰지 않는 상태 확인 {ok, build, kv}
 *   GET /api/admin/usage   (CUP_ADMIN) 오늘 래더 쓰기 추정·단계별 덱 수. 운영 메모: docs/design/ladder-server-ops.md */
import { handleCup } from './cup.js';
import { handleLadder, ladderUsage } from './uladder.js';

/* /api/health에 내보내는 빌드 표시. 배포 버전 메타데이터(CF_VERSION_METADATA)나 BUILD 변수가 있으면 그것을 쓴다 */
export const WORKER_BUILD = 'kv2-2026-11-17';
import { handleV1, scheduledV1 } from './v1/index.js';
import { countKV } from './v1/usage.js';
import { readText } from './v1/http.js';

export const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 0·O·1·I·L 없음, 31자 → 8자리 약 39.6비트
export const CODE_LEN = 8;
export const TTL = 604800; // 7일
export const MAX_BYTES = 8 * 1024 * 1024;
export const MIN_CHARS = 64;
export const RL_MAX = 10; // IP당 시간당 올리기
export const RL_WINDOW = 3600;
/* 게임 저장은 {"ver":4,…}로 시작한다. LZString.compressToBase64는 앞부분이 같으면 앞 글자도 같다 */
export const SAVE_PREFIX = 'N4IgbgpgTiBcAs';
const B64 = /^[A-Za-z0-9+/]+={0,3}$/;
const KEY = c => 'x:' + c;

const MSG = {
  bad_json: '요청 본문(JSON)을 읽지 못했습니다.', /* 깨진 본문은 서버 오류(500)가 아니라 400(외부 검수 11-17) */
  not_configured: '기기 옮기기가 아직 준비되지 않았습니다. 파일로 내보내기를 써 주세요.',
  too_large: '저장이 너무 커서 올리지 못했습니다(8MB 이하). 파일로 내보내기를 써 주세요.',
  bad_format: '게임 저장 코드가 아니어서 받지 않았습니다.',
  rate_limited: '한 시간에 10번까지만 만들 수 있습니다. 잠시 뒤 다시 시도해 주세요.',
  not_found: '코드를 찾지 못했습니다. 이미 불러왔거나 7일이 지나 삭제됐을 수 있습니다.',
  bad_code: '코드는 8자리입니다. 다시 확인해 주세요.',
  cross_origin: '이 게임 화면에서만 쓸 수 있습니다.',
  method: '지원하지 않는 요청입니다.',
  server: '서버에서 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
};

function json(status, body, extra) {
  return new Response(JSON.stringify(body), { status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, extra || {}) });
}
const err = (status, error, extra) => json(status, { error, message: MSG[error] || '' }, extra);

export function newCode(rand) {
  const out = []; const buf = new Uint8Array(16);
  while (out.length < CODE_LEN) {
    (rand || (b => crypto.getRandomValues(b)))(buf);
    for (const x of buf) { if (x < 248 && out.length < CODE_LEN) out.push(ALPHABET[x % 31]); } // 248=31×8: 치우침 없이
  }
  return out.join('');
}
/* 사용자가 적은 코드: 띄어쓰기·하이픈·소문자를 정리한다. 맞지 않으면 '' */
export function normCode(s) {
  const c = String(s || '').toUpperCase().replace(/[\s-]/g, '');
  return c.length === CODE_LEN && [...c].every(ch => ALPHABET.includes(ch)) ? c : '';
}
export function looksLikeSave(t) {
  return typeof t === 'string' && t.length >= MIN_CHARS && t.length % 4 === 0 && t.startsWith(SAVE_PREFIX) && B64.test(t);
}

/* 같은 출처만: 브라우저가 보낸 Origin/Sec-Fetch-Site가 다른 사이트면 거절한다. CORS 헤더는 붙이지 않는다 */
function sameOrigin(req, url) {
  const o = req.headers.get('Origin');
  if (o && o !== url.origin) return false;
  const s = req.headers.get('Sec-Fetch-Site');
  if (s && s !== 'same-origin' && s !== 'none') return false;
  return true;
}

async function ipHash(req, env) {
  const ip = req.headers.get('CF-Connecting-IP') || '';
  if (!ip) return '';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((env.RL_SALT || 'fronttime-transfer') + '|' + ip));
  return [...new Uint8Array(d).slice(0, 12)].map(b => b.toString(16).padStart(2, '0')).join('');
}
/* 시간 단위 칸마다 횟수를 센다. KV는 원자적이지 않아 대략적인 제한이다(best effort) */
async function rateLimited(req, env, now) {
  const h = await ipHash(req, env); if (!h) return null;
  const key = `rl:${h}:${Math.floor(now / 1000 / RL_WINDOW)}`;
  const n = parseInt(await env.SAVE_KV.get(key), 10) || 0;
  if (n >= RL_MAX) return { limited: true };
  return { limited: false, key, n };
}

export async function handle(req, env, now = Date.now()) {
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(req) : new Response('Not found', { status: 404 });
  if (url.pathname === '/api/health') return json(200, { ok: true, build: (env.CF_VERSION_METADATA && env.CF_VERSION_METADATA.id) || env.BUILD || WORKER_BUILD, kv: !!env.SAVE_KV });
  if (url.pathname.replace(/\/+$/, '') === '/api/admin/usage') {
    if (!env.SAVE_KV) return err(503, 'not_configured');
    if (!env.CUP_ADMIN || (req.headers.get('Authorization') || '') !== 'Bearer ' + env.CUP_ADMIN) return json(401, { error: 'auth', message: '관리자 인증이 필요합니다.' });
    if (req.method !== 'GET') return err(405, 'method', { Allow: 'GET' });
    try { return json(200, Object.assign(await ladderUsage(env, url, now), { build: (env.CF_VERSION_METADATA && env.CF_VERSION_METADATA.id) || env.BUILD || WORKER_BUILD })); } catch (e) { return err(500, 'server'); }
  }
  /* 서버 v1(D1): env.DB가 없으면 503 not_configured. 있으면 KV 쓰기 횟수도 세어 관리자 '래더 현황'에 보인다(worker/v1/usage.js) */
  if (/^\/api\/v1(\/|$)/.test(url.pathname)) { try { return await handleV1(req, env, url, now); } catch (e) { return e instanceof SyntaxError ? err(400, 'bad_json') : err(500, 'server'); } }
  if (env.DB && env.SAVE_KV) { const kv = countKV(env.SAVE_KV), raw = env; env = new Proxy(raw, { get: (t, k) => k === 'SAVE_KV' ? kv : t[k] }); }
  if (/^\/api\/cup(\/|$)/.test(url.pathname)) {
    if (!env.SAVE_KV) return err(503, 'not_configured');
    if (req.method !== 'GET' && !sameOrigin(req, url) && !(req.headers.get('Authorization') || '').startsWith('Bearer ')) return err(403, 'cross_origin');
    try { return await handleCup(req, env, url, now, rateLimited); } catch (e) { return e instanceof SyntaxError ? err(400, 'bad_json') : err(500, 'server'); }
  }
  if (/^\/api\/ladder(\/|$)/.test(url.pathname)) {
    if (!env.SAVE_KV) return err(503, 'not_configured');
    if (req.method !== 'GET' && !sameOrigin(req, url) && !(req.headers.get('Authorization') || '').startsWith('Bearer ')) return err(403, 'cross_origin');
    try { return await handleLadder(req, env, url, now); } catch (e) { return e instanceof SyntaxError ? err(400, 'bad_json') : err(500, 'server'); }
  }
  const m = url.pathname.match(/^\/api\/transfer(?:\/([^/]*))?\/?$/);
  if (!m) return json(404, { error: 'not_found', message: '' });
  if (!env.SAVE_KV) return err(503, 'not_configured');
  if (!sameOrigin(req, url)) return err(403, 'cross_origin');
  const kv = env.SAVE_KV, raw = m[1];
  try {
    if (raw == null) {
      if (req.method === 'GET') return json(200, { ok: true, ttl: TTL, maxBytes: MAX_BYTES });
      if (req.method !== 'POST') return err(405, 'method', { Allow: 'GET, POST' });
      const len = +req.headers.get('Content-Length');
      if (len > MAX_BYTES) return err(413, 'too_large');
      const rl = await rateLimited(req, env, now);
      if (rl && rl.limited) return err(429, 'rate_limited', { 'Retry-After': String(RL_WINDOW) });
      const rt = await readText(req, MAX_BYTES); if (rt.error) return err(413, 'too_large'); /* 바이트로, 길이 머리글이 없어도 읽는 중에 멈춘다(srv2 #43) */
      const body = rt.text.trim();
      if (!looksLikeSave(body)) return err(400, 'bad_format');
      let code = '';
      for (let i = 0; i < 4 && !code; i++) { const c = newCode(); if (await kv.get(KEY(c)) == null) code = c; }
      if (!code) return err(500, 'server');
      await kv.put(KEY(code), body, { expirationTtl: TTL, metadata: { t: now } });
      if (rl) await kv.put(rl.key, String(rl.n + 1), { expirationTtl: RL_WINDOW + 60 });
      return json(201, { code, expiresAt: now + TTL * 1000 });
    }
    const code = normCode(decodeURIComponent(raw));
    if (!code) return err(400, 'bad_code');
    if (req.method === 'GET') {
      const r = await kv.getWithMetadata(KEY(code));
      if (r.value == null) return err(404, 'not_found');
      await kv.delete(KEY(code)); // 한 번 불러오면 바로 삭제
      return json(200, { data: r.value, createdAt: (r.metadata && r.metadata.t) || null });
    }
    if (req.method === 'DELETE') { await kv.delete(KEY(code)); return json(200, { ok: true }); }
    return err(405, 'method', { Allow: 'GET, DELETE' });
  } catch (e) {
    return err(500, 'server');
  }
}

export default {
  fetch: (req, env) => handle(req, env),
  /* Cron Trigger를 켰을 때만 불린다(wrangler.jsonc 주석). 없으면 요청 때 시즌을 바꾼다 */
  scheduled: (ev, env, ctx) => ctx.waitUntil(scheduledV1(env, Date.now()).catch(() => {})),
};
