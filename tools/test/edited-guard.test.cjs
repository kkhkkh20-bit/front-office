/* 편집된 저장·덱 이상치 거절(에디터 기획 1단계, 구단주 11-18 §8) 점검: 공용 cupAnomaly와 래더 v1(/api/v1/ladder/deck)·예전 KV 래더(/api/ladder/deck)·프런트컵(/api/cup/entry).
   - edited 표시(본문 위쪽 또는 엔트리 안)는 403 edited, 능력치 20~80 밖은 400 bad_rating, 정상급(화면 OVR 80+) 과다는 400 bad_ovr, 연봉 합 불일치는 400 bad_pay — 이 둘은 프런트컵만(래더는 구단주 11-18 '상한 없이 자유롭게'로 strict:false)
   - 한도(CUP_ELITE_MAX 10·CUP_TOP_MAX 3)는 장기 시뮬(시드 7, 2026→2032, 10구단 1군 덱을 60일마다) 측정 최대(덱당 정상급 4명·화면 95+ 0명)보다 넉넉히 잡았다.
     능력치 여유 0.5: 같은 시뮬에서 엔진이 체력(vit)을 80.05까지 올린 적이 있다
   - 정상 덱은 받고, 받은 덱 본문에는 edited가 남지 않는다(화면 해시와 같게). 거절은 daily_stats(rej_코드)에 센다 */
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { makeD1, hasSqlite } = require('../lib/d1-shim.cjs');
const W = import(path.join(root, 'worker/index.js')), V = import(path.join(root, 'worker/v1/index.js')), RL = import(path.join(root, 'worker/v1/ratelimit.js')),
  SE = import(path.join(root, 'worker/v1/season.js')), US = import(path.join(root, 'worker/v1/usage.js')), LD = import(path.join(root, 'worker/v1/ladder.js')),
  CUP = import(path.join(root, 'src/core/cup.mjs')), NET = import(path.join(root, 'src/core/net.mjs'));
const ORIGIN = 'https://fronttime.example.workers.dev';
function deck(o = {}) { const P = []; const POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'C', 'SS', 'LF', '1B'];
  POS.forEach((pos, i) => P.push({ id: i + 1, name: '타자' + i, age: 27, isP: false, pos, th: '우', bt: '우', r: { con: 50, pow: 50, eye: 50, spd: 50, def: 50, vit: 60 }, pot: 55, sal: 300 }));
  for (let i = 0; i < 12; i++) P.push({ id: 100 + i, name: '투수' + i, age: 28, isP: true, pos: 'P', th: '우', bt: '우', r: { stf: 50, ctl: 50, sta: i < 5 ? 60 : 40 }, pot: 55, role: i < 5 ? 'SP' : 'RP', sal: 300 });
  return Object.assign({ v: 1, kind: 'cup-entry', name: '와이', year: 2035, seasons: 3, club: {}, mgr: {}, P, ln: [[1, 'C'], [2, '1B'], [3, '2B'], [4, '3B'], [5, 'SS'], [6, 'LF'], [7, 'CF'], [8, 'RF'], [10, 'DH']], bn: [9, 11, 12], rot: [100, 101, 102, 103, 104], pen: [105, 106, 107, 108, 109, 110, 111], bp: {}, ovr: { t: 60, p: 61, b: 59 }, pay: 7200 }, o); }
const star = p => { for (const k in p.r) p.r[k] = 66; return p; }; /* 화면 OVR 약 86: 정상급(80+)이지만 95 미만 */
function fakeKV() { const m = new Map(); return { m,
  async get(k) { return m.has(k) ? m.get(k).v : null; }, async getWithMetadata(k) { const e = m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; },
  async put(k, v, x = {}) { m.set(k, { v: String(v), meta: x.metadata || null }); }, async delete(k) { m.delete(k); },
  async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).meta })), list_complete: true }; } }; }
function fakeCaches() { const c = new Map(); globalThis.caches = { default: { async match(q) { const e = c.get(q.url); return e ? new Response(e.b, { status: e.s, headers: e.h }) : undefined; }, async put(q, r) { c.set(q.url, { b: await r.text(), s: r.status, h: [...r.headers] }); }, async delete(q) { return c.delete(q.url); } } }; }
async function setup(o = {}) {
  const { handle } = await W; (await V)._v1Reset(); (await RL)._resetRL(); (await SE)._resetSeason(); (await US)._resetUsage(); (await LD)._metaReset(); (await LD)._genReset(); fakeCaches();
  const env = { DB: o.db ? makeD1() : undefined, SAVE_KV: fakeKV(), CUP_ADMIN: 's3cret' }, clock = { now: Date.UTC(2026, 10, 20, 3) };
  const J = async (m, p, b, h = {}) => { const r = await handle(new Request(ORIGIN + p, { method: m, body: b == null ? undefined : typeof b === 'string' ? b : JSON.stringify(b), headers: Object.assign({ Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.7' }, h) }), env, clock.now); clock.now += 1000; return Object.assign({ _s: r.status }, await r.json()); };
  const AK = { Authorization: 'Bearer s3cret' };
  if (env.DB) assert.equal((await J('POST', '/api/v1/admin/migrate', null, AK))._s, 200);
  return { env, J, AK, clock };
}
const quiet = async f => { const w = console.warn, L = []; console.warn = (...a) => L.push(a.join(' ')); try { await f(); } finally { console.warn = w; } return L; };

test('공용 cupAnomaly: 정상 덱 통과, 편집 표시·능력치 범위·잠재력·정상급 과다·화면 95+ 과다·연봉 합 불일치·헐값 정상급 거절', async () => {
  const C = await CUP;
  assert.equal(C.cupAnomaly(deck()).ok, true);
  assert.equal(C.cupAnomaly(deck(), { edited: true }).code, 'edited'); assert.equal(C.cupAnomaly(deck({ edited: 1 })).code, 'edited');
  for (const v of [80.05, 80.1, 80.5, 19.96, 20, 80]) { const d = deck(); d.P[0].r.con = v; assert.equal(C.cupAnomaly(d).ok, true, '경계 안 ' + v); }
  for (const v of [81, 19, 99, -5, '70', null]) { const d = deck(); d.P[0].r.con = v; const a = C.cupAnomaly(d); assert.equal(a.code, 'bad_rating', String(v)); assert.match(a.errors[0], /20~80/); }
  { const d = deck(); d.P[3].pot = 85; assert.equal(C.cupAnomaly(d).code, 'bad_rating', '잠재력 85'); }
  { const d = deck(); for (let i = 0; i < C.CUP_ELITE_MAX; i++) star(d.P[i]); const a = C.cupAnomaly(d); assert.equal(a.ok, true, '정상급 한도까지는 받음 ' + a.errors); assert.equal(a.n.elite, C.CUP_ELITE_MAX); }
  { const d = deck(); for (let i = 0; i <= C.CUP_ELITE_MAX; i++) star(d.P[i]); assert.equal(C.cupAnomaly(d).code, 'bad_ovr', '정상급 한도 + 1'); }
  { const d = deck(); for (let i = 0; i <= C.CUP_TOP_MAX; i++) for (const k in d.P[i].r) d.P[i].r[k] = 80; const a = C.cupAnomaly(d); assert.equal(a.code, 'bad_ovr', '능력 상한 선수 과다'); assert.equal(a.n.top, C.CUP_TOP_MAX + 1); }
  assert.equal(C.cupAnomaly(deck({ pay: 100 })).code, 'bad_pay'); assert.equal(C.cupAnomaly(deck({ pay: 7201 })).ok, true, '반올림 1 차이는 받음');
  { const d = deck(); delete d.pay; assert.equal(C.cupAnomaly(d).ok, true, 'pay 없는 덱'); }
  { const d = deck(); for (let i = 0; i <= C.CUP_CHEAP_MAX; i++) { star(d.P[i]); d.P[i].sal = 0; } d.pay = d.P.reduce((a, p) => a + p.sal, 0); assert.equal(C.cupAnomaly(d).code, 'bad_pay', '연봉 0인 정상급 다수'); }
  /* 래더(strict:false, 구단주 11-18 "래더는 일단 상한을 두지 말고 자유롭게"): OVR 분포·연봉 일관성은 보지 않고 편집 표시·능력치 범위만 */
  { const d = deck({ pay: 100 }); for (let i = 0; i <= C.CUP_ELITE_MAX; i++) star(d.P[i]); assert.equal(C.cupAnomaly(d, { strict: false }).ok, true, '래더: bad_ovr·bad_pay 없음'); assert.equal(C.cupAnomaly(d).code, 'bad_ovr', '대회(기본)는 그대로'); }
  { const d = deck(); d.P[0].r.con = 95; assert.equal(C.cupAnomaly(d, { strict: false }).code, 'bad_rating', '래더도 능력치 범위는 거절'); assert.equal(C.cupAnomaly(deck(), { strict: false, edited: true }).code, 'edited'); }
  /* 엔진 ovr()와 같은 식 */
  assert.equal(C.cupPOvr({ isP: true, r: { stf: 60, ctl: 50, sta: 40 } }), 60 * .44 + 50 * .44 + 40 * .12);
  assert.equal(C.cupPOvr({ isP: false, r: { con: 60, pow: 50, eye: 40, spd: 30, def: 70 } }), 60 * .3 + 50 * .25 + 40 * .15 + 30 * .1 + 70 * .2);
});

test('클라이언트 연결부: putDeck 본문에 edited 표시를 싣는다', async () => {
  const { netCreate } = await NET; const sent = []; let ed = false;
  const mem = new Map([['fo-net-token', 'ft1.' + 'a'.repeat(32)]]);
  const N = netCreate({ edited: () => ed, storage: { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: k => mem.delete(k) }, fetch: async (u, o) => { sent.push(JSON.parse(o.body)); return new Response('{"ok":true}', { status: 200 }); }, retries: 0 });
  await N.putDeck(deck(), 0, 'w0123456789abcdef'); ed = true; await N.putDeck(deck(), 0, 'w0123456789abcdef', { man: 1 });
  assert.equal(sent[0].edited, false); assert.equal(sent[1].edited, true); assert.equal(sent[1].man, 1);
});

test('v1 래더 덱: edited 403·능력치 범위 400(코드·문장·로그·집계), bad_ovr·bad_pay는 래더에서 없앰, 정상 덱은 받고 본문에 edited 없음', { skip: hasSqlite ? false : 'node:sqlite 없음' }, async () => {
  const { env, J } = await setup({ db: true });
  const p = await J('POST', '/api/v1/player', { nickname: '편집검사', platform: 'web' }); assert.equal(p._s, 201); const A = { Authorization: 'Bearer ' + p.token };
  let r; const log = await quiet(async () => {
    r = await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0, edited: true }, A); assert.equal(r._s, 403); assert.equal(r.error, 'edited'); assert.match(r.message, /편집/);
    r = await J('PUT', '/api/v1/ladder/deck', { e: deck({ edited: true }), tier: 0 }, A); assert.equal(r._s, 403); assert.equal(r.error, 'edited');
    const b = deck(); b.P[2].r.pow = 95; r = await J('PUT', '/api/v1/ladder/deck', { e: b, tier: 0 }, A); assert.equal(r._s, 400); assert.equal(r.error, 'bad_rating'); assert.match(r.errors[0], /타자2 pow 95/);
  });
  assert.equal(log.filter(x => x.startsWith('[deck_reject]')).length, 3, '거절마다 로그 한 줄'); assert.match(log[0], /"code":"edited"/);
  assert.equal((await J('GET', '/api/v1/ladder/me', null, A)).deck, null, '거절한 덱이 들어감');
  /* 래더 상한 없음(구단주 11-18): 정상급 과다(예전 bad_ovr)·연봉 합 불일치(예전 bad_pay) 덱도 받는다 */
  { const o = deck(); for (let i = 0; i < 16; i++) star(o.P[i]); r = await J('PUT', '/api/v1/ladder/deck', { e: o, tier: 0 }, A); assert.equal(r._s, 200, '정상급 16명 덱도 받음 ' + JSON.stringify(r)); }
  r = await J('PUT', '/api/v1/ladder/deck', { e: deck({ pay: 1 }), tier: 0 }, A); assert.equal(r._s, 200, '연봉 합이 안 맞아도 받음');
  r = await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0, edited: false }, A); assert.equal(r._s, 200, JSON.stringify(r));
  const row = await env.DB.prepare('SELECT body FROM decks').first(); assert.ok(row && !('edited' in JSON.parse(row.body)), '받은 덱 본문에 edited가 남음');
  const st = (await env.DB.prepare("SELECT k, v FROM daily_stats WHERE k LIKE 'rej_%'").all()).results; const M = Object.fromEntries(st.map(x => [x.k, x.v]));
  assert.deepEqual(M, { rej_edited: 2, rej_bad_rating: 1 });
});

test('예전 KV 래더·프런트컵: edited 403, 능력치 범위 400, 프런트컵만 bad_ovr(같은 코드 경로, strict 깃발), 정상은 그대로', async () => {
  const { env, J, AK } = await setup();
  await quiet(async () => {
    const w = 'w0123456789abcdef';
    assert.equal((await J('PUT', '/api/ladder/deck', { wid: w, tier: 0, e: deck(), edited: true })).error, 'edited');
    const b = deck(); b.P[0].r.con = 0; assert.equal((await J('PUT', '/api/ladder/deck', { wid: w, tier: 0, e: b })).error, 'bad_rating');
    { const o = deck(); for (let i = 0; i < 16; i++) star(o.P[i]); assert.equal((await J('PUT', '/api/ladder/deck', { wid: 'w0123456789abcdee', tier: 0, e: o }))._s, 200, '예전 KV 래더도 정상급 과다를 받음(상한 없음)'); }
    assert.equal((await J('PUT', '/api/ladder/deck', { wid: w, tier: 0, e: deck() }))._s, 200);
    assert.ok(!('edited' in JSON.parse(env.SAVE_KV.m.get('ulD:' + w).v)));
    assert.equal((await J('PUT', '/api/cup/admin/config', { id: 'cup1', title: '제1회 프런트컵', deadline: '2026-11-30 21:00' }, Object.assign({ Origin: '' }, AK)))._s, 200);
    let r = await J('POST', '/api/cup/entry', deck({ wid: w, edited: true })); assert.equal(r._s, 403); assert.equal(r.error, 'edited');
    const c = deck({ wid: w }); for (let i = 0; i < 16; i++) star(c.P[i]); r = await J('POST', '/api/cup/entry', c); assert.equal(r._s, 400); assert.equal(r.error, 'bad_ovr');
    r = await J('POST', '/api/cup/entry', deck({ wid: w })); assert.equal(r._s, 201, JSON.stringify(r));
  });
});
