/* v1 공용: JSON 응답·오류 문구·CORS·본문 읽기·Cache API. 게임 화면과 앱(안드로이드·스팀 포장)이 같이 쓴다 */
export const MSG = {
  not_configured: '서버 데이터베이스가 아직 연결되지 않았습니다.',
  schema_missing: '데이터베이스 표가 아직 없습니다. 설정 안내(docs/server-setup.md)의 SQL을 실행해 주세요.',
  auth: '로그인 정보가 없거나 맞지 않습니다.',
  admin: '관리자 인증이 필요합니다.',
  bad_json: '요청 형식이 올바르지 않습니다.',
  bad_name: '닉네임은 2~12자, 쓸 수 없는 말 없이 적어 주세요.',
  name_wait: '닉네임은 하루에 한 번만 바꿀 수 있습니다.',
  bad_deck: '덱 형식이 아닙니다.',
  over_cap: '덱 연봉이 이 단계 상한을 넘습니다.',
  no_pay: '연봉 기록이 없는 덱입니다. 게임을 새로 고친 뒤 다시 등록해 주세요.',
  no_deck: '먼저 덱을 등록해 주세요.',
  bad_result: '리그 결과 형식이 올바르지 않습니다.',
  too_large: '요청이 너무 큽니다.',
  rate_limited: '요청이 너무 잦습니다. 잠시 뒤 다시 시도해 주세요.',
  cross_origin: '허용되지 않은 곳에서 온 요청입니다.',
  not_found: '찾지 못했습니다.',
  not_implemented: '아직 준비 중인 기능입니다.',
  link_failed: '계정 확인에 실패했습니다.',
  linked_other: '이 계정은 이미 다른 플레이어에 연결되어 있습니다.',
  method: '지원하지 않는 요청입니다.',
  server: '서버에서 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
  busy: '같은 기록을 동시에 고치는 요청이 많습니다. 잠시 뒤 다시 보냅니다.',
  /* 클라우드 저장(worker/v1/cloud.js) */
  conflict: '다른 기기가 이 슬롯을 더 최근에 저장했습니다. 덮어쓰지 않았습니다.',
  precondition_required: '저장 판번호(If-Match)가 없는 요청은 받지 않습니다.',
  bad_rev: '저장 판번호 형식이 올바르지 않습니다.',
  bad_format: '게임 클라우드 저장 형식이 아닙니다.',
  bad_slot: '슬롯 이름이 올바르지 않습니다.',
  slot_limit: '클라우드 슬롯은 3개까지입니다. 안 쓰는 클라우드 슬롯을 지운 뒤 다시 올려 주세요.',
  daily_limit: '오늘 클라우드에 올릴 수 있는 횟수를 다 썼습니다. 내일 다시 올립니다. 이 기기 저장은 그대로입니다.',
  bad_code: '코드가 맞지 않거나 시간이 지났습니다. 다시 확인해 주세요.',
  bad_device: '기기 번호가 올바르지 않습니다.',
};
const BASE = { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' };
export function json(status, body, extra) {
  return new Response(JSON.stringify(body), { status, headers: Object.assign({}, BASE, { 'Cache-Control': 'no-store' }, extra || {}) });
}
export const err = (status, error, extra, headers) => json(status, Object.assign({ ok: false, error, message: MSG[error] || '' }, extra || {}), headers);
/* 공개 GET(순위표·소식): 짧게 캐시한다. 브라우저 max-age는 짧게, 엣지(Cache API)는 s-maxage */
export const pub = (body, sec) => json(200, body, { 'Cache-Control': `public, max-age=${Math.min(30, sec)}, s-maxage=${sec}` });

/* CORS: 같은 출처 + env.V1_ORIGINS(쉼표로 여러 개: 앱 포장의 출처, 예 'capacitor://localhost,http://tauri.localhost').
   로그인은 쿠키가 아니라 Authorization 토큰이라 다른 사이트가 남의 이름으로 요청할 수 없다. 그래도 모르는 출처의 쓰기는 막는다 */
export function originOk(req, url, env) {
  const o = req.headers.get('Origin');
  if (!o || o === url.origin) return true;
  return String(env.V1_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean).includes(o);
}
export function cors(req, url, env, res) {
  const o = req.headers.get('Origin');
  if (!o || o === url.origin || !originOk(req, url, env)) return res;
  const h = new Headers(res.headers);
  h.set('Access-Control-Allow-Origin', o); h.append('Vary', 'Origin');
  h.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-FT-Client, If-Match, If-None-Match, X-Save-Day, X-Save-Wid, X-Save-Date, X-Save-Team, X-Save-Ver, X-Save-At');
  h.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); h.set('Access-Control-Max-Age', '86400');
  h.set('Access-Control-Expose-Headers', 'Retry-After, ETag, X-Save-Rev, X-Save-Current, X-Save-Day, X-Save-Wid'); /* 429의 기다릴 시간을 앱이 읽게(srv2) */
  return new Response(res.body, { status: res.status, headers: h });
}

export const BODY_MAX = 120 * 1024;
/* 본문을 바이트로 센다(srv2: 글자 수가 아니라). Content-Length가 크면 읽지 않고, 없거나 거짓이어도 읽는 동안 max를 넘으면 멈춘다 → {text} | {error:'too_large'} */
export async function readText(req, max = BODY_MAX) {
  const r = await readBytes(req, max); return r.error ? r : { text: new TextDecoder().decode(r.bytes) };
}
/* 같은 규칙으로 바이트 그대로(클라우드 저장 본문) → {bytes: Uint8Array} | {error:'too_large'} */
export async function readBytes(req, max = BODY_MAX) {
  const len = +req.headers.get('Content-Length'); if (len > max) return { error: 'too_large' };
  if (!req.body) return { bytes: new Uint8Array(0) };
  const rd = req.body.getReader(), parts = []; let n = 0;
  for (;;) {
    const { done, value } = await rd.read(); if (done) break;
    n += value.byteLength; if (n > max) { try { await rd.cancel(); } catch (e) {} return { error: 'too_large' }; }
    parts.push(value);
  }
  const buf = new Uint8Array(n); let o = 0; for (const p of parts) { buf.set(p, o); o += p.byteLength; }
  return { bytes: buf };
}
export const byteLen = s => new TextEncoder().encode(s).length;
export async function readJson(req, max = BODY_MAX) {
  const { text: t, error } = await readText(req, max); if (error) return { error };
  if (!t.trim()) return { body: {} };
  try { const b = JSON.parse(t); return b && typeof b === 'object' && !Array.isArray(b) ? { body: b } : { error: 'bad_json' }; } catch (e) { return { error: 'bad_json' }; }
}
/* 주소의 정수 값(srv2: ?n=1.2 → 500이던 것): 숫자가 아니면 def, 소수는 버림, lo~hi로 맞춘다 */
export function qInt(v, def, lo, hi) { if (v == null || v === '') return def; const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def; }

/* Cache API(caches.default): 무료. 같은 데이터센터 안에서만 공유된다. 노드 점검에는 caches가 없어서 그냥 건너뛴다 */
export async function cached(url, key, sec, make) {
  const C = typeof caches !== 'undefined' && caches.default;
  const ck = C ? new Request(url.origin + '/api/v1/_cache/' + key) : null;
  if (C) { try { const hit = await C.match(ck); if (hit) return hit; } catch (e) {} }
  const res = await make();
  if (C && res.status === 200) { try { await C.put(ck, res.clone()); } catch (e) {} }
  return res;
}
export const KST = 9 * 3600e3;
export const kstDay = ms => new Date(ms + KST).toISOString().slice(0, 10);
export const kstHour = ms => new Date(ms + KST).getUTCHours();
