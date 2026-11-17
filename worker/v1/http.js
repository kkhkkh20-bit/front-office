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
  h.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-FT-Client');
  h.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); h.set('Access-Control-Max-Age', '86400');
  return new Response(res.body, { status: res.status, headers: h });
}

export const BODY_MAX = 120 * 1024;
export async function readJson(req, max = BODY_MAX) {
  const len = +req.headers.get('Content-Length'); if (len > max) return { error: 'too_large' };
  const t = await req.text(); if (t.length > max) return { error: 'too_large' };
  if (!t.trim()) return { body: {} };
  try { const b = JSON.parse(t); return b && typeof b === 'object' && !Array.isArray(b) ? { body: b } : { error: 'bad_json' }; } catch (e) { return { error: 'bad_json' }; }
}

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
