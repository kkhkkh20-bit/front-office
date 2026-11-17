/* KV 아끼기: 공개 GET 응답을 짧게 담아 두는 두 겹 캐시와, KV를 쓰지 않는 요청 횟수 제한.
 *   1) 이 Worker 인스턴스(isolate) 메모리: 같은 인스턴스가 받은 요청끼리. 쓰기 직후 같은 인스턴스는 바로 비운다.
 *   2) Workers Cache API(caches.default): 같은 데이터센터끼리. 사용자 지정 도메인에서만 동작하고, workers.dev에서는 아무 일도 하지 않을 수 있다(그러면 1)만 남는다).
 * 둘 다 '최선' 캐시다. 다른 데이터센터·인스턴스는 TTL(60~120초)이 지나야 새 값을 본다. 정답 값은 언제나 KV에 있다. */
const MEMO = new WeakMap(); // kv → Map(key → {exp, v})
const MEMO_MAX = 256;
function memoOf(kv) { let m = MEMO.get(kv); if (!m) { m = new Map(); MEMO.set(kv, m); } return m; }
function edge() { try { return (globalThis.caches && globalThis.caches.default) || null; } catch (e) { return null; } }
const ckey = k => new Request(k, { method: 'GET' });

/* 메모리 → Cache API 순서로 찾는다. 값은 {status, body, headers}(문자열 본문) */
export async function cacheGet(kv, key, now) {
  const m = memoOf(kv), e = m.get(key);
  if (e && e.exp > now) return e.v;
  if (e) m.delete(key);
  const c = edge(); if (!c) return null;
  try {
    const r = await c.match(ckey(key)); if (!r) return null;
    let headers = {}; try { headers = JSON.parse(r.headers.get('X-FO-H') || '{}'); } catch (x) {}
    const v = { status: r.status, body: await r.text(), headers };
    const ttl = +r.headers.get('X-FO-TTL') || 30; m.set(key, { exp: now + Math.min(ttl, 30) * 1000, v });
    return v;
  } catch (x) { return null; }
}
export async function cachePut(kv, key, v, ttl, now) {
  const m = memoOf(kv); if (m.size >= MEMO_MAX) m.clear(); m.set(key, { exp: now + ttl * 1000, v });
  const c = edge(); if (!c) return;
  try {
    await c.put(ckey(key), new Response(v.body, { status: v.status || 200, headers: { 'Content-Type': (v.headers && v.headers['content-type']) || 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${ttl}`, 'X-FO-H': JSON.stringify(v.headers || {}), 'X-FO-TTL': String(ttl) } }));
  } catch (x) {}
}
/* 쓰기 뒤: 이 인스턴스 메모리와 이 데이터센터 캐시에서 지운다 */
export async function cacheBust(kv, keys) {
  const m = memoOf(kv), c = edge();
  for (const k of keys) { m.delete(k); if (c) { try { await c.delete(ckey(k)); } catch (x) {} } }
}
/* 200 응답만 담는다. 손님에게는 원래 헤더(Cache-Control 포함) 그대로, 캐시에서 꺼낸 것이면 X-FO-Cache: hit */
export async function cached(kv, key, ttl, now, make) {
  const hit = await cacheGet(kv, key, now);
  if (hit) return new Response(hit.body, { status: hit.status, headers: Object.assign({}, hit.headers, { 'X-FO-Cache': 'hit' }) });
  const res = await make();
  if (res.status !== 200) return res;
  const body = await res.text(), headers = Object.fromEntries(res.headers);
  await cachePut(kv, key, { status: 200, body, headers }, ttl, now);
  return new Response(body, { status: 200, headers });
}

/* 인스턴스 메모리 횟수 제한(KV를 쓰지 않음). 인스턴스마다 따로 세므로 대략적인 실수 방지용이다 */
const RL = new Map();
export function memLimited(key, max, windowMs, now) {
  if (!key) return false;
  let e = RL.get(key);
  if (!e || now - e.t0 >= windowMs) { if (RL.size > 5000) RL.clear(); e = { t0: now, n: 0 }; RL.set(key, e); }
  e.n++; return e.n > max;
}
export const utcDay = now => new Date(now).toISOString().slice(0, 10);
export async function shortHash(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d).slice(0, 8)].map(b => b.toString(16).padStart(2, '0')).join('');
}
