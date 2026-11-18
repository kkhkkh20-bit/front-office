/* 래더 관리자 대시보드·기록 세분화(구단주 11-18) 서버 점검: 가짜 D1(node:sqlite)로 실제 Worker를 돌린다.
   - admin/lstats: 관리자 키 필요, 실제 플레이어 수(익명 id·기기 묶음)·활성 1/7/30일·기기 수·자동/직접·끔, 깔때기·코호트·단계 흐름·OVR↔승률·균형·거절·상태
   - admin/lplayers: 검색·정렬·쪽, admin/lplayer: 한 명(덱 본문 없음)
   - 기록실: 세분화 칸(2루타·3루타·득점·삼진·패·선발·피안타·볼넷·피홈런·홀드)을 받아 적고, scope league·career 순위가 나온다. 예전 앱(칸 없음)도 받는다
   - /ladder/me career: 모든 시즌 리그 합 */
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { makeD1, hasSqlite } = require('../lib/d1-shim.cjs');
const W = import(path.join(root, 'worker/index.js')), V = import(path.join(root, 'worker/v1/index.js')), RL = import(path.join(root, 'worker/v1/ratelimit.js')),
  SE = import(path.join(root, 'worker/v1/season.js')), US = import(path.join(root, 'worker/v1/usage.js')), LD = import(path.join(root, 'worker/v1/ladder.js')), RC = import(path.join(root, 'worker/v1/records.js')), LA = import(path.join(root, 'worker/v1/ladauto.js'));
const ORIGIN = 'https://fronttime.example.workers.dev';
const dbTest = (name, fn) => test(name, { skip: hasSqlite ? false : 'node:sqlite 없음(노드 22.5 이상 필요)' }, fn);
function deck(o = {}) { const P = [], POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'C', 'SS', 'LF', '1B'];
  POS.forEach((pos, i) => P.push({ id: i + 1, name: '타자' + i, age: 27, isP: false, pos, th: '우', bt: '우', r: { con: 50, pow: 50, eye: 50, spd: 50, def: 50, vit: 60 }, pot: 55, sal: 300 }));
  for (let i = 0; i < 12; i++) P.push({ id: 100 + i, name: '투수' + i, age: 28, isP: true, pos: 'P', th: '우', bt: '우', r: { stf: 50, ctl: 50, sta: i < 5 ? 60 : 40 }, pot: 55, role: i < 5 ? 'SP' : 'RP', sal: 300 });
  return { v: 1, kind: 'cup-entry', name: o.name || '와이즈', year: 2035, club: {}, mgr: {}, payRef: 9000, P, ln: [[1, 'C'], [2, '1B'], [3, '2B'], [4, '3B'], [5, 'SS'], [6, 'LF'], [7, 'CF'], [8, 'RF'], [10, 'DH']], bn: [9, 11, 12], rot: [100, 101, 102, 103, 104], pen: [105, 106, 107, 108, 109, 110, 111], bp: {}, ovr: o.ovr || { t: 60, p: 61, b: 59 } }; }
async function setup() {
  const { handle } = await W; (await V)._v1Reset(); (await RL)._resetRL(); (await SE)._resetSeason(); (await US)._resetUsage(); (await LD)._metaReset(); (await LD)._genReset(); (await RC)._recReset(); (await LA)._autoReset();
  const DB = makeD1(), env = { DB, CUP_ADMIN: 's3cret' }, clock = { now: Date.UTC(2026, 10, 20, 3) };
  const J = async (m, p, b, h = {}) => { const r = await handle(new Request(ORIGIN + p, { method: m, body: b == null ? undefined : JSON.stringify(b), headers: Object.assign({ Origin: ORIGIN, 'CF-Connecting-IP': h.ip || '203.0.113.9' }, h) }), env, clock.now); clock.now += 1000; return Object.assign({ _s: r.status }, await r.json()); };
  const AK = { Authorization: 'Bearer s3cret' };
  assert.equal((await J('POST', '/api/v1/admin/migrate', null, AK))._s, 200);
  let ipn = 0; const mk = async nick => { const j = await J('POST', '/api/v1/player', { nickname: nick, platform: 'web' }, { ip: '10.8.0.' + (++ipn) }); assert.equal(j._s, 201, JSON.stringify(j)); return { id: j.player.id, A: { Authorization: 'Bearer ' + j.token } }; };
  return { DB, J, AK, mk, clock, sql: (q, ...a) => DB._sqlite.prepare(q).all(...a) };
}
const DEV = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
/* 기록 줄: 타자 [이름, g, pa, ab, h, tb, hr, rbi, sb, ob, sf, d2, d3, r, so] · 투수 [이름, g, outs, er, so, sv, w, wh, l, gs, ha, bb, hra, hld] */
const bat = (n, hr, d2 = 5, d3 = 1) => { const h = 30; return [n, 27, 110, 98, h, h + d2 + 2 * d3 + 3 * hr, hr, 20, 3, 11, 1, d2, d3, 15, 22]; };
const pit = (n, outs, er, so, hld = 0) => [n, Math.max(10, hld + 5), outs, er, so, 0, 3, 40, 2, 5, 30, 9, 3, hld];

dbTest('관리자 대시보드 lstats: 키 필요, 실제 플레이어(익명 id·기기 묶음)·활성·기기 수·자동/직접·끔·깔때기·코호트·흐름·균형·상태', async () => {
  const { J, AK, mk, clock } = await setup();
  assert.equal((await J('GET', '/api/v1/admin/lstats'))._s, 401, '키 없으면 401');
  const P = []; for (const n of ['하나별', '둘째별', '셋째별', '넷째별', '다섯별']) P.push(await mk(n));
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '하나팀', ovr: { t: 70, p: 70, b: 70 } }), auto: 1, dev: DEV }, P[0].A);
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '둘팀', ovr: { t: 60, p: 60, b: 60 } }), auto: 1, dev: DEV }, P[1].A); /* 같은 기기 = 한 묶음 */
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '셋팀', ovr: { t: 65, p: 65, b: 65 } }), man: 1 }, P[2].A);
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '넷팀' }), auto: 1 }, P[3].A);
  await J('PUT', '/api/v1/ladder/auto', { on: false }, P[4].A);
  const r = (pl, key, rank, w, l, o = {}) => J('POST', '/api/v1/ladder/result', Object.assign({ key, rank, teams: 10, w, l, d: 0, opps: [] }, o), pl.A);
  assert.equal((await r(P[0], 'lg-a1', 1, 20, 7, { ps: 'c', opps: [{ pid: P[1].id, w: 3, l: 0 }] }))._s, 200);
  await r(P[0], 'lg-a2', 2, 18, 9); await r(P[0], 'lg-a3', 5, 13, 14); await r(P[1], 'lg-b1', 9, 10, 17, { opps: [{ pid: P[0].id, w: 0, l: 3 }] });
  const S = await J('GET', '/api/v1/admin/lstats?range=7d', null, AK); assert.equal(S._s, 200, JSON.stringify(S));
  assert.equal(S.people.decks, 4); assert.equal(S.people.players, 4); assert.equal(S.people.all_players, 5); assert.equal(S.people.dev_groups, 3, '같은 기기 두 덱은 한 묶음');
  assert.equal(S.people.auto, 3); assert.equal(S.people.manual, 1); assert.equal(S.people.off, 1); assert.equal(S.people.active.d1, 4); assert.equal(S.people.active.d30, 4);
  assert.equal(S.people.devices.reduce((a, b) => a + b, 0), 4); assert.equal(S.people.devices[1], 4, '플레이어마다 기기 1개');
  assert.deepEqual(S.funnel.map(x => x.n), [4, 2, 1, 1, 1], '깔때기: 등록 → 첫 리그 → 3개 → 승격 → 우승');
  assert.equal(S.cur.leagues, 4); assert.ok(S.trend.length === 30 && S.heat.length === 14 && S.heat[0].h.length === 24);
  assert.equal(S.cohort.length, 14); assert.equal(S.cohort[13].n, 4, '오늘 등록 4덱');
  assert.equal(S.tiers.length, 5); assert.equal(S.tiers.reduce((a, t) => a + t.n, 0), 4); assert.ok(S.flow.some(f => f.to_tier > f.tier), '승강 흐름');
  assert.ok(S.scatter.length === 2 && S.scatter.every(x => x.ovr > 0 && x.wp > 0 && x.wp < 1));
  assert.equal(S.balance.titles, 1); assert.equal(S.balance.top10_share, 1); assert.equal(S.balance.upset_n, 2); assert.equal(S.balance.upset, 0, 'OVR 높은 쪽이 이김');
  assert.ok(S.health.free.d1_w > 0 && S.health.season.id >= 1 && S.health.last_league > 0);
  assert.ok(S.top.ovr[0].ovr === 70 && S.top.res.length >= 2);
  for (const rg of ['today', '30d', 'season', 'zzz']) assert.equal((await J('GET', '/api/v1/admin/lstats?range=' + rg, null, AK))._s, 200, rg);
  /* 다음 날: 직전 기간 비교·활성 1일 */
  clock.now += 86400e3; const T = await J('GET', '/api/v1/admin/lstats?range=today', null, AK); assert.equal(T.people.active.d1, 0); assert.equal(T.people.active_prev.d1, 4); assert.equal(T.prev.leagues, 4);
  /* 플레이어 표 */
  let L = await J('GET', '/api/v1/admin/lplayers?sort=leagues', null, AK); assert.equal(L._s, 200, JSON.stringify(L)); assert.equal(L.total, 4); assert.equal(L.players[0].pid, P[0].id); assert.equal(L.players[0].leagues, 3); assert.equal(L.players[0].titles, 1);
  assert.equal(L.players[0].same_dev, 2, '같은 기기 덱 수'); assert.equal(L.players[0].devs, 1);
  L = await J('GET', '/api/v1/admin/lplayers?sort=ovr&desc=0&n=2', null, AK); assert.equal(L.returned, 2, JSON.stringify(L)); assert.ok(L.players[0].ovr <= L.players[1].ovr);
  L = await J('GET', '/api/v1/admin/lplayers?q=셋', null, AK); assert.equal(L.total, 1); assert.equal(L.players[0].name, '셋팀');
  L = await J('GET', '/api/v1/admin/lplayers?off=3', null, AK); assert.equal(L.returned, 1);
  const one = await J('GET', '/api/v1/admin/lplayer?pid=' + P[0].id, null, AK); assert.equal(one._s, 200); assert.equal(one.recent.length, 3); assert.equal(one.recent[2].ps, 'c'); assert.equal(one.deck.name, '하나팀'); assert.ok(!('body' in one.deck), '덱 본문은 보내지 않음');
  assert.equal(one.same_dev, 2); assert.ok(!JSON.stringify(one).includes(DEV), '기기 번호 원문 없음'); assert.equal(one.h2h[0].pid, P[1].id);
  assert.equal((await J('GET', '/api/v1/admin/lplayer?pid=nope', null, AK))._s, 400);
});

dbTest('기록 세분화: 새 칸을 받아 적고 한 리그·통산 순위가 나온다. 예전 앱 줄(칸 없음)도 받는다. 내 통산(career)', async () => {
  const { J, AK, mk, sql, clock } = await setup();
  const a = await mk('기록왕'), b = await mk('옛앱');
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '기록팀' }), auto: 1 }, a.A); await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '옛팀' }), auto: 1 }, b.A);
  const rec = (bs, ps) => ({ team: { n: '기록팀', rs: 150, ra: 100, hr: 30 }, b: bs, p: ps });
  let j = await J('POST', '/api/v1/ladder/result', { key: 'lg-r1', rank: 1, teams: 10, w: 20, l: 7, d: 0, ps: 'c', rec: rec([bat('홍길동', 12), bat('2루타왕', 2, 14, 0)], [pit('선발왕', 100, 20, 90), pit('홀드왕', 40, 5, 40, 12)]) }, a.A); assert.equal(j._s, 200, JSON.stringify(j)); assert.equal(j.rec, 4);
  const row = sql("SELECT d2, d3, r, so, hld, l, gs, ha, bb, hra FROM ladder_lines WHERE name = '2루타왕' OR name = '홀드왕' ORDER BY name");
  assert.deepEqual(row.map(x => [x.d2, x.so, x.hld]), [[14, 22, 0], [0, 40, 12]]);
  /* 예전 앱: 짧은 줄 */
  j = await J('POST', '/api/v1/ladder/result', { key: 'lg-o1', rank: 3, teams: 10, w: 15, l: 12, d: 0, rec: { team: { n: '옛팀', rs: 120, ra: 110, hr: 20 }, b: [['옛타자', 27, 110, 98, 33, 50, 5, 18, 2, 11, 1]], p: [['옛투수', 9, 90, 30, 60, 0, 4, 40]] } }, b.A); assert.equal(j.rec, 2, '예전 줄도 받음');
  /* 틀린 세분화 칸(2루타 + 홈런 > 안타)은 그 줄만 버림 */
  j = await J('POST', '/api/v1/ladder/result', { key: 'lg-r2', rank: 2, teams: 10, w: 18, l: 9, d: 0, rec: rec([bat('홍길동', 12), ['엉터리', 27, 110, 98, 10, 60, 5, 1, 1, 1, 1, 9, 0, 1, 1]], [pit('선발왕', 90, 30, 80)]) }, a.A); assert.equal(j.rec, 2);
  let R = await J('GET', '/api/v1/ladder/records?tier=all', null, {}); assert.equal(R._s, 200); assert.equal(R.scope, 'season');
  for (const k of ['obp', 'slg', 'h', 'r', 'd2', 'd3', 'tb', 'bb', 'whip', 'k9', 'hld', 'ip', 'trs', 'tra', 'thr', 'trd']) assert.ok(Array.isArray(R.boards[k]), k);
  assert.equal(R.boards.d2[0].name, '2루타왕'); assert.equal(R.boards.hld[0].name, '홀드왕'); assert.equal(R.boards.hr[0].name, '홍길동'); assert.equal(R.boards.hr[0].v, 24, '시즌 합');
  R = await J('GET', '/api/v1/ladder/records?tier=all&scope=league', null, {}); assert.equal(R.scope, 'league'); assert.equal(R.boards.hr[0].v, 12, '한 리그 최고'); assert.equal(R.boards.hr[0].season, R.season);
  R = await J('GET', '/api/v1/ladder/records?tier=all&scope=career', null, {}); assert.equal(R.scope, 'career'); assert.equal(R.boards.hr[0].v, 24); assert.equal(R.boards.trs[0].v, 150);
  const me = await J('GET', '/api/v1/ladder/me', null, a.A); assert.deepEqual([me.career.leagues, me.career.w, me.career.l, me.career.titles, me.career.firsts], [2, 38, 16, 1, 1]); assert.equal(me.career.best_rank, 2, '최고 단계(승격 뒤 1단계)에서 2위'); assert.equal(me.career.best_tier, 1);
});
