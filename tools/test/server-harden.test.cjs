/* 서버 v1 단단하게(2026-11-17 srv2, 외부 검토 36~65): 동점 순위·순위 자격·플랫폼 바꾸기·중복 결과 응답·정수 검사·바이트 한도·닉네임 길이,
   CSV 페이지, 동시 요청(결과 두 개·시즌 닫기 실패·시즌 칸 만들기·삭제와 결과·계정 연결), 캐시 무효화, CORS.
   가짜 D1(node:sqlite). 동시 요청은 Promise.all로 두 요청의 읽기가 서로 쓰기 전에 끼어들게 한다 */
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { makeD1, hasSqlite } = require('../lib/d1-shim.cjs');
const W = import(path.join(root, 'worker/index.js')), V = import(path.join(root, 'worker/v1/index.js')), RL = import(path.join(root, 'worker/v1/ratelimit.js')),
  SE = import(path.join(root, 'worker/v1/season.js')), US = import(path.join(root, 'worker/v1/usage.js')), LD = import(path.join(root, 'worker/v1/ladder.js')),
  AU = import(path.join(root, 'worker/v1/auth.js')), HT = import(path.join(root, 'worker/v1/http.js'));
const ORIGIN = 'https://fronttime.example.workers.dev', DAY = 86400e3;
function deck(o = {}) { const P = []; const POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'C', 'SS', 'LF', '1B'];
  POS.forEach((pos, i) => P.push({ id: i + 1, name: '타자' + i, age: 27, isP: false, pos, th: '우', bt: '우', r: { con: 50, pow: 50, eye: 50, spd: 50, def: 50, vit: 60 }, pot: 55, sal: 300 }));
  for (let i = 0; i < 12; i++) P.push({ id: 100 + i, name: '투수' + i, age: 28, isP: true, pos: 'P', th: '우', bt: '우', r: { stf: 50, ctl: 50, sta: i < 5 ? 60 : 40 }, pot: 55, role: i < 5 ? 'SP' : 'RP', sal: 300 });
  return Object.assign({ v: 1, kind: 'cup-entry', name: '와이', year: 2035, club: {}, mgr: {}, P, ln: [[1, 'C'], [2, '1B'], [3, '2B'], [4, '3B'], [5, 'SS'], [6, 'LF'], [7, 'CF'], [8, 'RF'], [10, 'DH']], bn: [9, 11, 12], rot: [100, 101, 102, 103, 104], pen: [105, 106, 107, 108, 109, 110, 111], bp: {}, ovr: { t: 60, p: 61, b: 59 }, payRef: 9000 }, o); }
/* 느린 D1: 문장마다 다음 차례(setImmediate)까지 기다린다 → 동시 요청 두 개의 읽기·쓰기가 실제처럼 섞인다. batch는 한 번에(트랜잭션) */
function slowD1(D) { const tick = () => new Promise(r => setImmediate(r));
  const wrap = s => ({ _s: s, _sql: s._sql, _params: s._params, bind: (...a) => wrap(s.bind(...a)), async all() { await tick(); return s.all(); }, async run() { await tick(); return s.run(); }, async first(c) { await tick(); return s.first(c); }, raw: o => s.raw(o) });
  return { _sqlite: D._sqlite, _real: D, prepare: q => wrap(D.prepare(q)), async batch(L) { await tick(); return D.batch(L.map(x => x._s || x)); }, exec: q => D.exec(q) }; }
function fakeCaches() { const c = new Map(); globalThis.caches = { default: { c, async match(q) { const e = c.get(q.url); return e ? new Response(e.b, { status: e.s, headers: e.h }) : undefined; }, async put(q, r) { c.set(q.url, { b: await r.text(), s: r.status, h: Object.fromEntries(r.headers) }); }, async delete(q) { return c.delete(q.url); } } }; return c; }
async function setup(o = {}) {
  const { handle } = await W; (await V)._v1Reset(); (await RL)._resetRL(); (await SE)._resetSeason(); (await US)._resetUsage(); (await LD)._metaReset(); (await LD)._genReset();
  delete globalThis.caches;
  const DB = o.noDb ? undefined : o.slow ? slowD1(makeD1()) : makeD1(), env = Object.assign({ DB, CUP_ADMIN: 's3cret' }, o.env || {});
  if (o.kv) { const m = o.kv; env.SAVE_KV = { async get(k) { return m.has(k) ? m.get(k).v : null; }, async getWithMetadata(k) { const e = m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; },
    async put(k, v, x = {}) { m.set(k, { v: String(v), meta: x.metadata || null }); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).meta })), list_complete: true }; } }; }
  const clock = { now: o.now || Date.UTC(2026, 10, 20, 3) };
  const req = (m, p, b, h = {}) => new Request(ORIGIN + p, { method: m, body: b == null ? undefined : typeof b === 'string' ? b : JSON.stringify(b), headers: Object.assign({ Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.7' }, h) });
  const H = async (m, p, b, h = {}) => { const r = await handle(req(m, p, b, h), env, clock.now); clock.now += 1000; return r; };
  const J = async (...a) => { const r = await H(...a); return Object.assign({ _s: r.status }, await r.json()); };
  const AK = { Authorization: 'Bearer s3cret' };
  if (DB) assert.equal((await J('POST', '/api/v1/admin/migrate', null, AK))._s, 200);
  let ipn = 0; const mk = async (nick, extra = {}) => { const j = await J('POST', '/api/v1/player', Object.assign({ nickname: nick, platform: 'web' }, extra), { 'CF-Connecting-IP': '10.77.' + (ipn++) + '.1' }); assert.equal(j._s, 201, JSON.stringify(j)); return { id: j.player.id, A: { Authorization: 'Bearer ' + j.token } }; };
  return { env, H, J, AK, mk, clock, handle, req, sq: DB && DB._sqlite };
}
const dbTest = (name, fn) => test(name, { skip: hasSqlite ? false : 'node:sqlite 없음(노드 22.5 이상 필요)' }, fn);
const result = (J, p, key, rank, extra = {}) => J('POST', '/api/v1/ladder/result', Object.assign({ key, rank, teams: 10, w: 10, l: 10, d: 0 }, extra), p.A);

/* 36·37 */
dbTest('36·37 동점·자격: 순위표와 내 순위가 같은 규칙(포인트→우승→먼저 도달), 리그를 안 마친 플레이어는 순위 없음', async () => {
  const { J, mk, clock, AK } = await setup(); const a = await mk('동점일'), b = await mk('동점이'), c = await mk('미출전');
  for (const p of [a, b, c]) assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0 }, p.A))._s, 200);
  assert.equal((await result(J, a, 'tie-a', 5))._s, 200); assert.equal((await result(J, b, 'tie-b', 5))._s, 200); /* 둘 다 12점, a가 먼저 */
  const lb = await J('GET', '/api/v1/ladder/leaderboard?tier=0'); assert.deepEqual(lb.rows.map(x => [x.nickname, x.rank, x.points]), [['동점일', 1, 12], ['동점이', 2, 12]]);
  const ma = await J('GET', '/api/v1/ladder/me', null, a.A), mb = await J('GET', '/api/v1/ladder/me', null, b.A);
  assert.equal(ma.entry.rank, 1); assert.equal(mb.entry.rank, 2, '순위표 2위면 내 화면도 2위');
  const mc = await J('GET', '/api/v1/ladder/me', null, c.A); assert.equal(mc.entry.rank, null, '리그를 안 마치면 순위 없음'); assert.equal(mc.entry.ranked, false);
  assert.ok(!lb.rows.some(x => x.nickname === '미출전'));
  /* 포인트가 같으면 우승(리그 1위) 많은 쪽이 먼저: 레전드(맨 위, 1위도 그대로)에서 4위 두 번(15+15) 대 나중에 1위 한 번(30) */
  clock.now += DAY; const e = await mk('꾸준왕'), d = await mk('우승왕');
  for (const p of [e, d]) await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 4 }, p.A);
  await result(J, e, 'w-e1', 4); await result(J, e, 'w-e2', 4); await result(J, d, 'w-d1', 1);
  const lb4 = await J('GET', '/api/v1/ladder/leaderboard?tier=4'); assert.deepEqual(lb4.rows.map(x => [x.nickname, x.points, x.wins, x.rank]), [['우승왕', 30, 1, 1], ['꾸준왕', 30, 0, 2]]);
  assert.equal((await J('GET', '/api/v1/ladder/me', null, d.A)).entry.rank, 1); assert.equal((await J('GET', '/api/v1/ladder/me', null, e.A)).entry.rank, 2);
  /* 숨김이면 내 순위 없음 */
  await J('PUT', '/api/v1/admin/hide', { pid: a.id, hide: 1 }, AK);
  assert.equal((await J('GET', '/api/v1/ladder/me', null, a.A)).entry.rank, null); assert.equal((await J('GET', '/api/v1/ladder/me', null, b.A)).entry.rank, 1, '숨긴 사람은 세지 않음');
});
dbTest('36 전체 순위(tier=all)도 같은 규칙이고 내 화면에 전체 순위(rank_all)를 준다', async () => {
  const { J, mk } = await setup(); const a = await mk('전체가'), b = await mk('전체나');
  for (const p of [a, b]) await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 2 }, p.A);
  await result(J, a, 'all-a', 6); await result(J, b, 'all-b', 6);
  const all = await J('GET', '/api/v1/ladder/leaderboard?tier=all'); assert.deepEqual(all.rows.map(x => [x.nickname, x.rank]), [['전체가', 1], ['전체나', 2]]);
  assert.equal((await J('GET', '/api/v1/ladder/me', null, b.A)).entry.rank_all, 2);
});
/* 38 */
dbTest('38 플랫폼만 바꿔도 반영된다(닉네임은 그대로)', async () => {
  const { J, mk, sq } = await setup(); const a = await mk('플랫폼');
  const j = await J('POST', '/api/v1/player', { platform: 'android' }, a.A); assert.equal(j._s, 200); assert.equal(j.player.platform, 'android');
  assert.equal(sq.prepare('SELECT platform FROM players WHERE id = ?').get(a.id).platform, 'android');
  const k = await J('POST', '/api/v1/player', { nickname: '플랫폼' }, a.A); assert.equal(k.player.platform, 'android', '플랫폼을 안 보내면 그대로');
});
/* 39 */
dbTest('39 같은 결과를 다시 보내면 지금 칸(포인트·단계·순위)을 함께 준다', async () => {
  const { J, mk } = await setup(); const a = await mk('재전송');
  await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0 }, a.A);
  const r1 = await result(J, a, 'dup-1', 2); const r2 = await result(J, a, 'dup-2', 5);
  const d = await result(J, a, 'dup-1', 2); assert.equal(d.dup, true); assert.equal(d.points, r2.points, '지금 포인트'); assert.equal(d.delta, r1.delta);
  assert.ok(d.entry && d.entry.points === r2.points && d.entry.tier === r2.tier && d.entry.rank === 1 && d.entry.leagues === 2, JSON.stringify(d));
  assert.ok(r2.entry && r2.entry.rank === 1 && r2.entry.leagues === 2, '보통 응답에도 entry');
});
/* 40 */
dbTest('40 정수가 아닌 개수(?n=1.2)는 500이 아니라 맞춰서 처리', async () => {
  const { J, mk, AK } = await setup(); const a = await mk('정수');
  await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0 }, a.A);
  for (const q of ['n=1.2', 'n=abc', 'n=-5', 'n=1e9', 'ovr=6.5&n=2.7', 'tier=1.5']) { const o = await J('GET', '/api/v1/ladder/opponents?' + q, null, a.A); assert.equal(o._s, 200, q + ' ' + JSON.stringify(o)); }
  for (const q of ['n=1.2', 'n=x', 'kind=results&n=0.5']) assert.equal((await J('GET', '/api/v1/admin/export?' + q, null, AK))._s, 200, q);
  assert.equal((await J('GET', '/api/v1/ladder/feed?n=2.5'))._s, 200);
});
/* 43 */
dbTest('43 본문 한도는 바이트로(한글·Content-Length 없음)', async () => {
  const { readJson } = await HT;
  const big = JSON.stringify({ s: '가'.repeat(2000) }); /* 글자 2009, 바이트 6009 */
  assert.equal((await readJson(new Request('http://x/', { method: 'POST', body: big }), 4096)).error, 'too_large');
  const stream = new ReadableStream({ start(c) { for (let i = 0; i < 10; i++) c.enqueue(new TextEncoder().encode('"' + '나'.repeat(300) + '",')); c.close(); } });
  const r = await readJson(new Request('http://x/', { method: 'POST', body: stream, duplex: 'half' }), 4096); assert.equal(r.error, 'too_large', '길이 머리글 없는 스트림');
  assert.deepEqual((await readJson(new Request('http://x/', { method: 'POST', body: JSON.stringify({ s: '가'.repeat(100) }) }), 4096)).body, { s: '가'.repeat(100) });
  const { J } = await setup(); assert.equal((await J('POST', '/api/v1/player', JSON.stringify({ nickname: '바이트', pad: '가'.repeat(1500) })))._s, 400);
  /* 예전 KV 래더 덱(120KB): 글자 수로는 안이지만 바이트로는 넘는 본문 */
  const kv = new Map(), K = await setup({ kv, noDb: true }); const pad = '가'.repeat(50 * 1024); /* 글자 약 51K, 바이트 약 150K */
  assert.equal((await K.J('PUT', '/api/ladder/deck', JSON.stringify({ wid: 'w' + '1'.repeat(16), pad, e: deck() })))._s, 413);
});
/* 44 */
test('44 닉네임 최소 길이는 글자(그래핌) 수로: 이모지 하나는 안 됨', async () => {
  const { nickOk } = await AU;
  assert.equal(nickOk('😀'), ''); assert.equal(nickOk('❤️'), '', '이모지+변형 선택자'); assert.equal(nickOk('👍🏽'), '', '피부색'); assert.equal(nickOk('가​'), '', '보이지 않는 글자');
  assert.equal(nickOk('😀😀'), '😀😀'); assert.equal(nickOk('가나'), '가나'); assert.equal(nickOk('가'), '');
  assert.equal([...nickOk('가'.repeat(20))].length, 12, '최대 12자');
});
/* 52 */
dbTest('52 CSV 내보내기: 전체 수·잘림·다음 페이지(커서)·날짜 범위', async () => {
  const { J, mk, AK, clock } = await setup(); const P = [];
  const t0 = clock.now;
  for (let i = 0; i < 5; i++) { const p = await mk('씨에스' + i); P.push(p); await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '팀' + i }), tier: 0 }, p.A); await result(J, p, 'csv-' + i, 5); clock.now += DAY; }
  let d = await J('GET', '/api/v1/admin/export?kind=decks&n=2', null, AK); assert.equal(d.total, 5); assert.equal(d.returned, 2); assert.equal(d.truncated, true); assert.ok(d.next);
  const seen = d.rows.map(x => x.name);
  while (d.next) { d = await J('GET', '/api/v1/admin/export?kind=decks&n=2&cursor=' + encodeURIComponent(d.next), null, AK); seen.push(...d.rows.map(x => x.name)); }
  assert.deepEqual(seen, ['팀4', '팀3', '팀2', '팀1', '팀0'], '겹치지도 빠지지도 않음'); assert.equal(d.truncated, false);
  let r = await J('GET', '/api/v1/admin/export?kind=results&n=3', null, AK); assert.equal(r.total, 5); assert.equal(r.returned, 3); assert.ok(r.next);
  r = await J('GET', '/api/v1/admin/export?kind=results&n=3&cursor=' + r.next, null, AK); assert.equal(r.returned, 2); assert.equal(r.next, null);
  const f = await J('GET', `/api/v1/admin/export?kind=results&from=${t0 + DAY}&to=${t0 + 3 * DAY}`, null, AK); assert.equal(f.total, 2); assert.equal(f.returned, 2);
  const day = new Date(t0 + 9 * 3600e3 + DAY).toISOString().slice(0, 10); assert.equal((await J('GET', `/api/v1/admin/export?kind=decks&from=${day}&to=${day}`, null, AK)).total, 1, 'YYYY-MM-DD(한국시간 하루)');
});
/* 58 */
dbTest('58 같은 플레이어 결과 두 개가 동시에 와도 차례로 반영(승격 두 번)', async () => {
  const { J, mk, sq } = await setup({ slow: true }); const a = await mk('동시왕');
  await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0 }, a.A);
  const [x, y] = await Promise.all([result(J, a, 'cc-1', 1), result(J, a, 'cc-2', 1)]);
  assert.equal(x._s, 200, JSON.stringify(x)); assert.equal(y._s, 200, JSON.stringify(y));
  const en = sq.prepare('SELECT tier, points, leagues, ups FROM ladder_entries WHERE player_id = ?').get(a.id);
  assert.deepEqual([en.tier, en.points, en.leagues, en.ups], [2, 60, 2, 2], '루키 1위 → 마이너, 마이너 1위 → 1부');
  const rs = sq.prepare('SELECT tier, to_tier FROM league_results WHERE player_id = ? ORDER BY id').all(a.id).map(r => [r.tier, r.to_tier]); assert.deepEqual(rs, [[0, 1], [1, 2]]);
  assert.deepEqual([x.tier_from, y.tier_from].sort(), [0, 1]);
  /* 같은 key 두 번이 동시에: 한 번만 센다 */
  const [p, q] = await Promise.all([result(J, a, 'cc-3', 5), result(J, a, 'cc-3', 5)]); assert.equal(p._s, 200); assert.equal(q._s, 200); assert.ok(p.dup || q.dup, '하나는 중복');
  assert.equal(sq.prepare('SELECT leagues FROM ladder_entries WHERE player_id = ?').get(a.id).leagues, 3);
});
/* 59 */
dbTest('59 시즌 닫기 중 시상 쓰기가 실패하면 다음 요청이 시상까지 다시 한다(한 번만)', async () => {
  const { J, mk, env, clock } = await setup(); const a = await mk('시상왕');
  await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 2 }, a.A); await result(J, a, 'aw-1', 4);
  const s1 = (await J('GET', '/api/v1/health')).season; clock.now = s1.ends + 3600e3; (await SE)._resetSeason();
  const real = env.DB.batch; let fail = 1; env.DB.batch = async L => { if (fail && L.some(s => /season_top/.test(s._sql))) { fail--; throw new Error('D1_ERROR: network'); } return real(L); };
  const h1 = await J('GET', '/api/v1/health'); assert.equal(h1._s, 500, '이번 요청은 실패');
  const h2 = await J('GET', '/api/v1/health'); assert.equal(h2.season.id, 2, '다음 요청이 닫기·시상');
  await Promise.all([J('GET', '/api/v1/health'), J('GET', '/api/v1/health')]);
  const me = await J('GET', '/api/v1/ladder/me', null, a.A); assert.deepEqual(me.titles.map(t => [t.s, t.tier, t.rank]), [[1, 2, 1]], '칭호 한 번');
  assert.equal(env.DB._sqlite.prepare("SELECT COUNT(*) AS n FROM events WHERE kind = 'season_top'").get().n, 1);
  assert.equal(env.DB._sqlite.prepare("SELECT COUNT(*) AS n FROM ladder_seasons").get().n, 2);
});
/* 60 */
dbTest('60 첫 시즌 칸을 덱 등록과 결과가 동시에 만들어도 시작 단계·포인트·덱 단계가 하나', async () => {
  const kv = new Map(); const { J, mk, sq } = await setup({ slow: true, kv }); const WID = 'w' + '6'.repeat(16);
  assert.equal((await J('PUT', '/api/ladder/deck', { wid: WID, tier: 3, e: deck({ name: '옛팀' }) }))._s, 200); /* 예전 KV 래더 3부 */
  const ticks = n => new Promise(async r => { for (let i = 0; i < n; i++) await new Promise(q => setImmediate(q)); r(); });
  for (let lag = 0; lag < 24; lag += 2) { /* 결과를 조금씩 늦게 보내 두 요청이 칸을 만드는 순서를 여러 가지로 섞는다 */
    const a = await mk('동시칸' + lag);
    const [d, r] = await Promise.all([J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '새덱' }), tier: 3, wid: WID }, a.A), ticks(lag).then(() => result(J, a, 'ns-' + lag, 5))]);
    assert.equal(d._s, 200, JSON.stringify(d)); assert.equal(r._s, 200, JSON.stringify(r));
    const en = sq.prepare('SELECT * FROM ladder_entries WHERE player_id = ?').all(a.id); assert.equal(en.length, 1);
    const dk = sq.prepare('SELECT tier FROM decks WHERE player_id = ?').get(a.id), m = 'lag ' + lag + ' ' + JSON.stringify([d.tier, r.tier_from, en[0], dk]);
    assert.equal(r.tier_from, en[0].start_tier, '결과가 본 시작 단계 = 저장된 시작 단계 ' + m); assert.equal(d.tier, en[0].start_tier, '덱 응답 단계 = 저장된 단계 ' + m);
    assert.equal(en[0].points, r.points, m); assert.equal(en[0].leagues, 1, m);
  }
  /* 새 시즌: 지난 시즌 레전드 → 이번 3부, 덱·결과 동시 */
  const b = await mk('새시즌'); await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0 }, b.A); sq.prepare('DELETE FROM ladder_entries WHERE player_id = ?').run(b.id);
  sq.prepare("INSERT INTO ladder_entries (season, player_id, tier, start_tier, best_tier, updated) VALUES (0, ?, 4, 4, 4, 0)").run(b.id);
  const [d2, r2] = await Promise.all([J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '새덱2' }) }, b.A), result(J, b, 'ns-2', 5)]);
  assert.equal(d2._s, 200); assert.equal(r2.tier_from, 3); const e2 = sq.prepare('SELECT * FROM ladder_entries WHERE player_id = ? AND season > 0').all(b.id); assert.equal(e2.length, 1); assert.equal(e2[0].start_tier, 3); assert.equal(e2[0].points, r2.points);
});
/* 61 */
dbTest('61 삭제와 결과 저장이 겹쳐도 남는 줄이 없다', async () => {
  const { J, mk, sq } = await setup({ slow: true }); const a = await mk('지울이'), b = await mk('상대');
  await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0 }, a.A); await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0 }, b.A);
  const [r, del] = await Promise.all([result(J, a, 'del-1', 1, { opps: [{ pid: b.id, w: 2 }] }), J('DELETE', '/api/v1/player', null, a.A)]);
  assert.equal(del._s, 200); assert.ok([200, 401].includes(r._s), JSON.stringify(r));
  for (const [t, c] of [['players', 'id'], ['decks', 'player_id'], ['ladder_entries', 'player_id'], ['league_results', 'player_id'], ['h2h', 'player_id'], ['events', 'player_id'], ['deck_meta', 'player_id'], ['devices', 'player_id']])
    assert.equal(sq.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE ${c} = ?`).get(a.id).n, 0, t);
  assert.equal(sq.prepare('SELECT COUNT(*) AS n FROM h2h WHERE opp_id = ?').get(a.id).n, 0);
  /* 덱 등록과 삭제가 겹쳐도 */
  const c = await mk('또지울'); await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0 }, c.A);
  await Promise.all([J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '다시' }) }, c.A), J('DELETE', '/api/v1/player', null, c.A)]);
  for (const t of ['decks', 'ladder_entries', 'deck_meta']) assert.equal(sq.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE player_id = ?`).get(c.id).n, 0, t);
});
/* 62 */
dbTest('62 숨김·삭제 뒤 공개 캐시(순위표·소식·메타)를 바로 바꾼다', async () => {
  const { J, mk, AK } = await setup(); fakeCaches();
  try {
    const a = await mk('캐시왕'); await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0 }, a.A); await result(J, a, 'ca-1', 1);
    const lb = () => J('GET', '/api/v1/ladder/leaderboard?tier=1'), fd = () => J('GET', '/api/v1/ladder/feed'), mt = () => J('GET', '/api/v1/ladder/meta?tier=1');
    assert.equal((await lb()).rows.length, 1); assert.equal((await fd()).items.length, 1); assert.equal((await mt()).n, 1);
    assert.equal((await J('PUT', '/api/v1/admin/hide', { pid: a.id, hide: 1 }, AK))._s, 200);
    assert.equal((await lb()).rows.length, 0, '순위표'); assert.equal((await fd()).items.length, 0, '소식'); assert.equal((await mt()).n, 0, '메타');
    assert.equal((await J('GET', '/api/v1/ladder/feed?n=3')).items.length, 0);
    await J('PUT', '/api/v1/admin/hide', { pid: a.id, hide: 0 }, AK); assert.equal((await lb()).rows.length, 1);
    await J('DELETE', '/api/v1/player', null, a.A); assert.equal((await lb()).rows.length, 0, '본인 삭제도');
  } finally { delete globalThis.caches; }
});
/* 63 */
dbTest('63 같은 스팀 계정을 두 플레이어가 동시에 연결: 하나는 성공, 하나는 409(500 아님)', async () => {
  const { J, mk, env } = await setup({ slow: true }); const a = await mk('연결가'), b = await mk('연결나'); const v = await V;
  env.STEAM_WEB_API_KEY = 'k'; env.STEAM_APP_ID = '480';
  v._setFetch(async () => new Response(JSON.stringify({ response: { params: { result: 'OK', steamid: '76561198000000009', vacbanned: false, publisherbanned: false } } })));
  try {
    const [x, y] = await Promise.all([J('POST', '/api/v1/player/link', { provider: 'steam', ticket: 'ab'.repeat(20) }, a.A), J('POST', '/api/v1/player/link', { provider: 'steam', ticket: 'ab'.repeat(20) }, b.A)]);
    assert.deepEqual([x._s, y._s].sort(), [200, 409], JSON.stringify([x, y]));
    /* 64: 연결 뒤에도 원래 익명 토큰과 로그인 토큰이 같은 플레이어 */
    const owner = x._s === 200 ? a : b;
    const lg = await J('POST', '/api/v1/player/login', { provider: 'steam', ticket: 'cd'.repeat(20) }); assert.equal(lg.player.id, owner.id);
    assert.equal((await J('GET', '/api/v1/player/me', null, owner.A)).player.id, owner.id, '예전 기기 토큰');
    assert.equal((await J('GET', '/api/v1/player/me', null, { Authorization: 'Bearer ' + lg.token })).player.id, owner.id, '새 토큰');
    assert.equal((await J('POST', '/api/v1/player/link', { provider: 'steam', ticket: 'ab'.repeat(20) }, owner.A))._s, 200, '같은 사람이 다시 연결해도 됨');
  } finally { v._setFetch(null); }
});
/* 65 */
dbTest('65 허용한 앱 출처: 401·429·503·OPTIONS·500에도 CORS 머리글', async () => {
  const APP = 'capacitor://localhost';
  const { H, mk } = await setup({ env: { V1_ORIGINS: APP } }); const a = await mk('코르스');
  const chk = (r, s) => { assert.equal(r.status, s); assert.equal(r.headers.get('Access-Control-Allow-Origin'), APP, 'ACAO ' + s); assert.match(r.headers.get('Access-Control-Expose-Headers') || '', /Retry-After/); };
  chk(await H('OPTIONS', '/api/v1/ladder/result', null, { Origin: APP, 'Access-Control-Request-Method': 'POST' }), 204);
  chk(await H('GET', '/api/v1/ladder/me', null, { Origin: APP }), 401);
  let last; for (let i = 0; i < 245; i++) last = await H('GET', '/api/v1/ladder/rivals', null, Object.assign({ Origin: APP }, a.A)); chk(last, 429);
  const nd = await setup({ noDb: true, env: { V1_ORIGINS: APP } }); chk(await nd.H('GET', '/api/v1/health', null, { Origin: APP }), 503);
  const bad = await setup({ env: { V1_ORIGINS: APP } }); Object.defineProperty(bad.env, 'DB', { get() { throw new Error('binding boom'); } }); chk(await bad.H('GET', '/api/v1/health', null, { Origin: APP }), 500);
  const ev = (await H('OPTIONS', '/api/v1/ladder/result', null, { Origin: 'https://evil.example' })); assert.equal(ev.headers.get('Access-Control-Allow-Origin'), null);
});
test('36 시즌 시상 순서(worker/v1/season.js)가 순위표 RANK_ORDER와 같다', async () => {
  const fs = require('node:fs'); const { RANK_ORDER } = await LD; const src = fs.readFileSync(path.join(root, 'worker/v1/season.js'), 'utf8');
  assert.ok(src.includes(`const ORDER = '${RANK_ORDER}'`), '시상 순서가 다름');
});
