/* 사용량 세기(관리자 '래더 현황'의 서버 사용량 추정): D1 결과의 meta.rows_read/rows_written과 KV 쓰기 횟수를 이 isolate 메모리에 모았다가,
   다음 v1 쓰기 요청 때 daily_stats(하루 단위 집계)에 함께 더한다. 다른 isolate·모은 뒤 쓰기 전에 사라진 몫은 빠지므로 '추정'이다.
   집계 쓰기 자체도 D1 쓰기다(요청마다 몇 줄). */
import { kstDay } from './http.js';
const U = { r: 0, w: 0, kv: 0 };
export function _resetUsage() { U.r = 0; U.w = 0; U.kv = 0; }
export const usageNow = () => Object.assign({}, U);
function add(res) { const m = res && res.meta; if (m) { U.r += +m.rows_read || 0; U.w += +m.rows_written || 0; } return res; }
function wrapStmt(s) {
  return {
    _s: s,
    bind(...a) { return wrapStmt(s.bind(...a)); },
    async run() { return add(await s.run()); },
    async all() { return add(await s.all()); },
    async first(c) { const r = await s.all(); add(r); const row = (r.results || [])[0]; return row == null ? null : c != null ? row[c] : row; },
    async raw(o) { return s.raw(o); },
  };
}
export function countDB(db) {
  if (!db || db._counted) return db;
  return { _counted: true, _db: db,
    prepare(q) { return wrapStmt(db.prepare(q)); },
    async batch(L) { const r = await db.batch(L.map(x => x._s || x)); for (const x of r || []) add(x); return r; },
    exec(q) { return db.exec(q); } };
}
export function countKV(kv) {
  if (!kv || kv._counted) return kv;
  return new Proxy(kv, { get(t, k) {
    if (k === '_counted') return true;
    const v = t[k]; if (typeof v !== 'function') return v;
    if (k === 'put' || k === 'delete') return (...a) => { U.kv++; return v.apply(t, a); };
    return v.bind(t);
  } });
}
/* daily_stats에 더하기: {k: n} → 문장 목록(batch에 넣는다) */
export function statStmts(db, now, inc) {
  const day = kstDay(now), out = [];
  for (const [k, n] of Object.entries(inc)) if (n) out.push(db.prepare('INSERT INTO daily_stats (day, k, v) VALUES (?, ?, ?) ON CONFLICT (day, k) DO UPDATE SET v = v + excluded.v').bind(day, k, n | 0));
  return out;
}
/* 모은 사용량을 꺼낸다(꺼내면 0으로) */
export function takeUsage() { const x = { d1_r: U.r, d1_w: U.w, kv_w: U.kv }; U.r = 0; U.w = 0; U.kv = 0; return x; }
/* 꺼냈는데 쓰지 못한 몫(batch를 되돌림)을 다시 넣는다 */
export function addUsage(x) { if (!x) return; U.r += x.d1_r || 0; U.w += x.d1_w || 0; U.kv += x.kv_w || 0; }
