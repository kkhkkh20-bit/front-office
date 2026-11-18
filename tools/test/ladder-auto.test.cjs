/* 래더 v4(구단주 11-18, docs/design/ladder-v4-2026-11-18.md): 자동 등록·자동 참가 끄기·하루 1회 직접 재등록·우승팀 승격·관리자 한눈 보기(서버). 가짜 D1(node:sqlite).
   - 0005 SQL = ladauto.js AUTO_SQL, 표가 없어도 처음 쓸 때 만듦
   - 자동 등록: 상한을 넘어도 받되(cap_ok 0) 상대 목록에 안 나감, 직접 등록은 상한 넘으면 거절, 직접 다시 등록은 하루 1회(자동은 세지 않음), 기기 번호는 해시만
   - 자동 참가 끄기: 서버 덱·진행 중 리그 지움, 자동 등록 409, 다시 켜기
   - 관리자: 인증, 등록 현황(단계별 자동/직접·오늘·7일·상한 초과·끔), 진행 중 리그·끝난 리그(우승·준우승·정규 1위)·들여다보기, 시즌 판, 이상 감지(결과 불일치·비정상 승률·같은 기기 여러 덱), 덱 목록 검색·단계·진행 중 리그 수 */
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const root = path.resolve(__dirname, '../..');
const { makeD1, hasSqlite } = require('../lib/d1-shim.cjs');
const W = import(path.join(root, 'worker/index.js')), V = import(path.join(root, 'worker/v1/index.js')), RL = import(path.join(root, 'worker/v1/ratelimit.js')),
  SE = import(path.join(root, 'worker/v1/season.js')), US = import(path.join(root, 'worker/v1/usage.js')), LD = import(path.join(root, 'worker/v1/ladder.js')), RC = import(path.join(root, 'worker/v1/records.js')), LA = import(path.join(root, 'worker/v1/ladauto.js'));
const ORIGIN = 'https://fronttime.example.workers.dev';
const dbTest = (name, fn) => test(name, { skip: hasSqlite ? false : 'node:sqlite 없음(노드 22.5 이상 필요)' }, fn);
function deck(o = {}) { const P = [], POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'C', 'SS', 'LF', '1B'], sal = o.sal || 300;
  POS.forEach((pos, i) => P.push({ id: i + 1, name: '타자' + i, age: 27, isP: false, pos, th: '우', bt: '우', r: { con: 50, pow: 50, eye: 50, spd: 50, def: 50, vit: 60 }, pot: 55, sal }));
  for (let i = 0; i < 12; i++) P.push({ id: 100 + i, name: '투수' + i, age: 28, isP: true, pos: 'P', th: '우', bt: '우', r: { stf: 50, ctl: 50, sta: i < 5 ? 60 : 40 }, pot: 55, role: i < 5 ? 'SP' : 'RP', sal });
  const e = { v: 1, kind: 'cup-entry', name: o.name || '와이즈', year: 2035, club: {}, mgr: {}, payRef: 9000, P, ln: [[1, 'C'], [2, '1B'], [3, '2B'], [4, '3B'], [5, 'SS'], [6, 'LF'], [7, 'CF'], [8, 'RF'], [10, 'DH']], bn: [9, 11, 12], rot: [100, 101, 102, 103, 104], pen: [105, 106, 107, 108, 109, 110, 111], bp: {}, ovr: o.ovr || { t: 60, p: 61, b: 59 } };
  if (o.tag) e.P[0].name = '타자' + o.tag; return e; }
async function setup(o = {}) {
  const { handle } = await W; (await V)._v1Reset(); (await RL)._resetRL(); (await SE)._resetSeason(); (await US)._resetUsage(); (await LD)._metaReset(); (await LD)._genReset(); (await RC)._recReset(); (await LA)._autoReset();
  const DB = makeD1(), env = { DB, CUP_ADMIN: 's3cret' }, clock = { now: Date.UTC(2026, 10, 20, 3) };
  const J = async (m, p, b, h = {}) => { const r = await handle(new Request(ORIGIN + p, { method: m, body: b == null ? undefined : JSON.stringify(b), headers: Object.assign({ Origin: ORIGIN, 'CF-Connecting-IP': h.ip || '203.0.113.9' }, h) }), env, clock.now); clock.now += 1000; return Object.assign({ _s: r.status }, await r.json()); };
  const AK = { Authorization: 'Bearer s3cret' };
  if (o.noAuto) { const { schemaStatements } = await import(path.join(root, 'worker/v1/schema.js')); for (const q of schemaStatements()) DB._sqlite.exec(q); }
  else assert.equal((await J('POST', '/api/v1/admin/migrate', null, AK))._s, 200);
  let ipn = 0; const mk = async nick => { const j = await J('POST', '/api/v1/player', { nickname: nick, platform: 'web' }, { ip: '10.7.0.' + (++ipn) }); assert.equal(j._s, 201, JSON.stringify(j)); return { id: j.player.id, A: { Authorization: 'Bearer ' + j.token } }; };
  return { DB, J, AK, mk, clock, sql: (q, ...a) => DB._sqlite.prepare(q).all(...a) };
}
const DEV = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

test('스키마: migrations/0005_ladder_auto.sql과 worker/v1/ladauto.js AUTO_SQL이 같다', async () => {
  const { AUTO_SQL, autoStatements } = await LA;
  assert.equal(AUTO_SQL, fs.readFileSync(path.join(root, 'migrations/0005_ladder_auto.sql'), 'utf8'));
  assert.ok(autoStatements().length >= 5 && autoStatements().every(s => /^CREATE (TABLE|INDEX) IF NOT EXISTS/.test(s)));
});
test('결과 대조: 순위표와 결과 줄이 다르면 mismatch, 27전 27승은 winrate', async () => {
  const { leagueFlags } = await LA; const st = [['가', 18, 9, 0, 'me'], ['나', 9, 18, 0, 'ai']];
  assert.equal(leagueFlags({ rank: 1, teams: 2, w: 18, l: 9, d: 0, ps: '', st }), '');
  assert.equal(leagueFlags({ rank: 1, teams: 2, w: 20, l: 7, d: 0, ps: '', st }), 'mismatch', '내 줄 승패가 다름');
  assert.equal(leagueFlags({ rank: 2, teams: 2, w: 18, l: 9, d: 0, ps: '', st }), 'mismatch', '순위가 다름');
  assert.equal(leagueFlags({ rank: 6, teams: 10, w: 13, l: 14, d: 0, ps: 'c', st: [] }), 'mismatch', '4위 밖 우승');
  assert.equal(leagueFlags({ rank: 1, teams: 10, w: 27, l: 0, d: 0, ps: 'c', st: [] }), 'winrate');
  assert.equal(leagueFlags({ rank: 1, teams: 10, w: 20, l: 6, d: 0, ps: '', st: [] }), 'mismatch', '10팀인데 27경기가 아님');
});
dbTest('자동 등록: 상한을 넘어도 받되 상대 목록에는 안 나간다. 직접 등록은 상한을 넘으면 거절, 직접 다시 등록은 하루 1회(자동은 세지 않음). 기기 번호는 해시만', async () => {
  const { J, mk, sql, clock } = await setup();
  const a = await mk('부산 자이언츠#3812'), b = await mk('달빛#0001'), c = await mk('새벽별');
  let j = await J('PUT', '/api/v1/ladder/deck', { e: deck({ sal: 1000 }), auto: 1, dev: DEV }, a.A); assert.equal(j._s, 200, JSON.stringify(j)); assert.equal(j.auto, 1); assert.equal(j.cap_ok, false, '상한 초과 표시'); assert.ok(j.pay_x > 1);
  j = await J('PUT', '/api/v1/ladder/deck', { e: deck({ sal: 1000 }), man: 1 }, b.A); assert.equal(j._s, 400); assert.equal(j.error, 'over_cap', '직접 등록은 지금처럼 거절');
  j = await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '달빛팀' }), man: 1, dev: DEV }, b.A); assert.equal(j._s, 200); assert.equal(j.auto, 0);
  j = await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '달빛팀', tag: 2 }), man: 1 }, b.A); assert.equal(j._s, 429); assert.equal(j.error, 'reg_wait'); assert.match(j.message, /하루에 한 번/);
  j = await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '달빛팀', tag: 3 }), auto: 1 }, b.A); assert.equal(j._s, 200, '자동 갱신은 하루 1회 직접 등록과 따로'); assert.equal(sql('SELECT auto FROM ladder_reg WHERE player_id = ?', b.id)[0].auto, 1);
  j = await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '새벽팀' }) }, c.A); assert.equal(j._s, 200, '맞추기(자동·직접 표시 없음)는 그대로'); assert.equal(sql('SELECT auto, man_day FROM ladder_reg WHERE player_id = ?', c.id)[0].man_day, null);
  const r = sql('SELECT * FROM ladder_reg WHERE player_id = ?', a.id)[0]; assert.equal(r.cap_ok, 0); assert.equal(r.auto, 1); assert.equal(r.dev.length, 16); assert.notEqual(r.dev, DEV.slice(0, 16), '기기 번호 그대로 두지 않음');
  assert.ok(!JSON.stringify(sql('SELECT * FROM ladder_reg')).includes(DEV), '기기 번호 원문 없음');
  const o = await J('GET', '/api/v1/ladder/opponents?n=9', null, c.A); assert.equal(o._s, 200); assert.ok(!o.decks.some(d => d.pid === a.id), '상한 초과 덱은 상대로 안 나감'); assert.ok(o.decks.some(d => d.pid === b.id));
  clock.now += 86400e3; j = await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '달빛팀', tag: 4 }), man: 1 }, b.A); assert.equal(j._s, 200, '다음 날 다시 직접 등록');
});
dbTest('자동 참가 끄기: 서버 덱·진행 중 리그를 지우고, 끈 동안 자동 등록은 409. 다시 켜면 받는다. 표가 없던 서버도 처음 쓸 때 만든다', async () => {
  const { J, mk, sql } = await setup({ noAuto: true });
  const a = await mk('하늘#1234');
  let j = await J('PUT', '/api/v1/ladder/deck', { e: deck(), auto: 1 }, a.A); assert.equal(j._s, 200, JSON.stringify(j));
  j = await J('POST', '/api/v1/ladder/live', { key: 'w1.1.abc', tier: 0, round: 3, post: 0, teams: [['하늘', a.id, 'me'], ['AI 스톰', null, 'ai']], st: [['하늘', 6, 3, 0, 'me'], ['AI 스톰', 3, 6, 0, 'ai']] }, a.A); assert.equal(j._s, 200);
  assert.equal(sql('SELECT COUNT(*) AS n FROM ladder_live')[0].n, 1);
  j = await J('PUT', '/api/v1/ladder/auto', { on: false }, a.A); assert.equal(j._s, 200); assert.equal(j.on, false);
  assert.equal(sql('SELECT COUNT(*) AS n FROM decks')[0].n, 0, '서버 덱 지움'); assert.equal(sql('SELECT COUNT(*) AS n FROM ladder_live')[0].n, 0); assert.equal(sql('SELECT off FROM ladder_reg WHERE player_id = ?', a.id)[0].off, 1);
  j = await J('PUT', '/api/v1/ladder/deck', { e: deck(), auto: 1 }, a.A); assert.equal(j._s, 409); assert.equal(j.error, 'auto_off');
  j = await J('PUT', '/api/v1/ladder/auto', { on: true }, a.A); assert.equal(j._s, 200);
  j = await J('PUT', '/api/v1/ladder/deck', { e: deck(), auto: 1 }, a.A); assert.equal(j._s, 200); assert.equal(sql('SELECT off FROM ladder_reg WHERE player_id = ?', a.id)[0].off, 0);
  assert.equal((await J('PUT', '/api/v1/ladder/auto', { on: false }))._s, 401, '로그인 필요');
});
dbTest('우승팀 승격: 정규 3위라도 우승하면 한 단계 승격, 정규 1위 우승은 한 단계만(추가 효과 없음), 준우승 3위는 잔류', async () => {
  const { J, mk } = await setup();
  const a = await mk('우승팀#0003');
  await J('PUT', '/api/v1/ladder/deck', { e: deck(), auto: 1 }, a.A);
  const R = (key, rank, ps, w = 15, l = 12) => ({ key, rank, teams: 10, w, l, d: 0, opps: [], ps });
  let j = await J('POST', '/api/v1/ladder/result', R('lg-k1', 3, 'c'), a.A); assert.equal(j._s, 200, JSON.stringify(j)); assert.equal(j.tier, 1); assert.equal(j.move, 'up');
  j = await J('POST', '/api/v1/ladder/result', R('lg-k2', 1, 'c', 20, 7), a.A); assert.equal(j.tier, 2, '1위 우승은 한 단계'); assert.equal(j.move, 'up');
  j = await J('POST', '/api/v1/ladder/result', R('lg-k3', 3, 'r'), a.A); assert.equal(j.tier, 2); assert.equal(j.move, 'stay');
  j = await J('POST', '/api/v1/ladder/result', R('lg-k3', 3, 'r'), a.A); assert.equal(j.dup, true);
});
dbTest('관리자 한눈 보기: 인증, 등록 현황, 진행 중·끝난 리그와 들여다보기, 시즌 판, 이상 감지, 덱 목록 검색·단계·진행 중 리그 수, 삭제하면 같이 지움', async () => {
  const { J, AK, mk, sql } = await setup();
  assert.equal((await J('GET', '/api/v1/admin/dash'))._s, 401); assert.equal((await J('GET', '/api/v1/admin/decks', null, { Authorization: 'Bearer nope' }))._s, 401);
  const P = []; for (const n of ['부산 자이언츠#3812', '서울 베어스#1111', '대구 라이온즈#2222', '광주 타이거즈#3333', '인천 랜더스#4444']) P.push(await mk(n));
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '자이언츠', sal: 1000 }), auto: 1, dev: DEV }, P[0].A);
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '베어스' }), auto: 1, dev: DEV }, P[1].A);
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '라이온즈' }), man: 1 }, P[2].A);
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '타이거즈' }), auto: 1 }, P[3].A);
  await J('PUT', '/api/v1/ladder/auto', { on: false }, P[4].A);
  /* 진행 중 리그: 베어스가 리그 3라운드, 상대에 라이온즈 */
  await J('POST', '/api/v1/ladder/live', { key: 'w2.5.x', tier: 0, round: 3, teams: [['베어스', P[1].id, 'me'], ['라이온즈', P[2].id, 'user'], ['AI 스톰', null, 'ai']], st: [['베어스', 6, 3, 0, 'me'], ['라이온즈', 5, 4, 0, 'user'], ['AI 스톰', 2, 7, 0, 'ai']] }, P[1].A);
  /* 끝난 리그: 타이거즈 정상(우승), 라이온즈 27전 27승(+ 순위표 불일치) */
  const st10 = me => Array.from({ length: 10 }, (_, i) => [i === 0 ? '타이거즈' : '팀' + i, 18 - i, 9 + i, 0, i === 0 ? 'me' : 'ai']);
  let j = await J('POST', '/api/v1/ladder/result', { key: 'lg-t1', rank: 1, teams: 10, w: 18, l: 9, d: 0, opps: [], ps: 'c', st: st10(), champ: '타이거즈', runner: '팀2' }, P[3].A); assert.equal(j._s, 200, JSON.stringify(j));
  j = await J('POST', '/api/v1/ladder/result', { key: 'lg-l1', rank: 1, teams: 10, w: 27, l: 0, d: 0, opps: [], ps: 'c', st: [['라이온즈', 20, 7, 0, 'me']], champ: '라이온즈', runner: '팀3' }, P[2].A); assert.equal(j._s, 200);
  j = await J('POST', '/api/v1/ladder/result', { key: 'lg-l2', rank: 1, teams: 10, w: 26, l: 1, d: 0, opps: [], ps: 'c' }, P[2].A); assert.equal(j._s, 200);
  const D = await J('GET', '/api/v1/admin/dash', null, AK); assert.equal(D._s, 200, JSON.stringify(D));
  assert.equal(D.reg.total, 4); assert.equal(D.reg.auto, 3); assert.equal(D.reg.manual, 1); assert.equal(D.reg.over, 1); assert.equal(D.reg.off, 1); assert.equal(D.reg.new_today, 4); assert.equal(D.reg.new_7d, 4);
  assert.ok(D.reg.tiers.length === 5 && D.reg.tiers.some(t => t.auto > 0));
  assert.equal(D.live.length, 1); assert.deepEqual([D.live[0].tier, D.live[0].round, D.live[0].decks, D.live[0].post], [0, 3, 3, 0]);
  assert.equal(D.recent.length, 3); const t1 = D.recent.find(x => x.lkey === 'lg-t1'); assert.deepEqual([t1.champ, t1.runner, t1.top, t1.flag], ['타이거즈', '팀2', '타이거즈', '']);
  const fl = D.recent.find(x => x.lkey === 'lg-l1'); assert.match(fl.flag, /mismatch/); assert.match(fl.flag, /winrate/);
  assert.ok(D.flags.results.some(x => x.pid === P[2].id)); assert.ok(D.flags.winrate.some(x => x.pid === P[2].id), '시즌 비정상 승률'); assert.equal(D.flags.dev.length, 1); assert.equal(D.flags.dev[0].n, 2, '같은 기기에서 덱 2개');
  assert.ok(D.board.length === 5 && D.board.flatMap(b => b.rows).length === 2, '시즌 판(리그를 마친 2명)'); assert.ok(D.season.days_left >= 0 && D.season.days_left <= 14);
  assert.ok(!JSON.stringify(D).includes(DEV), '기기 번호 원문 없음');
  /* 들여다보기 */
  const G1 = await J('GET', '/api/v1/admin/league?id=' + t1.id, null, AK); assert.equal(G1._s, 200); assert.equal(G1.league.st.length, 10); assert.equal(G1.league.champ, '타이거즈');
  const GL = await J('GET', '/api/v1/admin/league?live=' + P[1].id, null, AK); assert.equal(GL.live, true); assert.equal(GL.league.st[0][0], '베어스');
  assert.equal((await J('GET', '/api/v1/admin/league?id=999', null, AK))._s, 404);
  /* 덱 목록 */
  let K = await J('GET', '/api/v1/admin/decks', null, AK); assert.equal(K.total, 4); const rl = K.decks.find(x => x.pid === P[2].id); assert.equal(rl.active, 1, '상대로 나간 진행 중 리그'); assert.equal(K.decks.find(x => x.pid === P[1].id).active, 1);
  assert.equal(K.decks.find(x => x.pid === P[0].id).cap_ok, 0); assert.ok(K.decks.find(x => x.pid === P[0].id).pay_x > 1);
  K = await J('GET', '/api/v1/admin/decks?q=' + encodeURIComponent('베어'), null, AK); assert.deepEqual(K.decks.map(x => x.name), ['베어스']);
  K = await J('GET', '/api/v1/admin/decks?tier=1', null, AK); assert.ok(K.decks.every(x => x.tier === 1)); assert.ok(K.decks.length >= 1, '우승으로 마이너 승격한 덱');
  /* 플레이어 삭제는 자동 등록 줄도 지운다 */
  assert.equal((await J('DELETE', '/api/v1/admin/player/' + P[2].id, null, AK))._s, 200);
  assert.equal(sql('SELECT COUNT(*) AS n FROM ladder_reg WHERE player_id = ?', P[2].id)[0].n, 0); assert.equal(sql('SELECT COUNT(*) AS n FROM ladder_leagues WHERE player_id = ?', P[2].id)[0].n, 0);
});
