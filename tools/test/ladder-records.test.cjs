/* 래더 기록실(서버 v1, 사용자 11-18): 리그 결과에 붙은 rec(팀 요약 + 우리 선수 상위 기록 줄)가 ladder_teams·ladder_lines에 들어가고,
   GET /api/v1/ladder/records 가 시즌 홈런·타율(규정 타석)·OPS·ERA(규정 이닝)·탈삼진·세이브·팀 승리·최다 우승·최근 우승을 준다. 가짜 D1(node:sqlite).
   또: 0004 SQL = records.js REC_SQL, 표가 없어도 처음 요청 때 만듦, 같은 리그 두 번은 한 번만, 틀린 줄은 버림, 숨김·삭제 플레이어는 빠짐, 우승·준우승 포인트 보너스(단계는 정규 순위 그대로), 캐시·요청 제한 */
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const root = path.resolve(__dirname, '../..');
const { makeD1, hasSqlite } = require('../lib/d1-shim.cjs');
const W = import(path.join(root, 'worker/index.js')), V = import(path.join(root, 'worker/v1/index.js')), RL = import(path.join(root, 'worker/v1/ratelimit.js')),
  SE = import(path.join(root, 'worker/v1/season.js')), US = import(path.join(root, 'worker/v1/usage.js')), LD = import(path.join(root, 'worker/v1/ladder.js')), RC = import(path.join(root, 'worker/v1/records.js'));
const ORIGIN = 'https://fronttime.example.workers.dev';
const dbTest = (name, fn) => test(name, { skip: hasSqlite ? false : 'node:sqlite 없음(노드 22.5 이상 필요)' }, fn);
async function setup(o = {}) {
  const { handle } = await W; (await V)._v1Reset(); (await RL)._resetRL(); (await SE)._resetSeason(); (await US)._resetUsage(); (await LD)._metaReset(); (await LD)._genReset(); (await RC)._recReset();
  const DB = makeD1(), env = { DB, CUP_ADMIN: 's3cret' }, clock = { now: Date.UTC(2026, 10, 20, 3) };
  const J = async (m, p, b, h = {}) => { const r = await handle(new Request(ORIGIN + p, { method: m, body: b == null ? undefined : JSON.stringify(b), headers: Object.assign({ Origin: ORIGIN, 'CF-Connecting-IP': h.ip || '203.0.113.9' }, h) }), env, clock.now); clock.now += 1000; return Object.assign({ _s: r.status }, await r.json()); };
  const AK = { Authorization: 'Bearer s3cret' };
  if (!o.noRec) assert.equal((await J('POST', '/api/v1/admin/migrate', null, AK))._s, 200);
  else { const { schemaStatements } = await import(path.join(root, 'worker/v1/schema.js')); for (const q of schemaStatements()) DB._sqlite.exec(q); }
  const mk = async (nick, ip) => { const j = await J('POST', '/api/v1/player', { nickname: nick, platform: 'web' }, { ip }); assert.equal(j._s, 201, JSON.stringify(j)); return { id: j.player.id, A: { Authorization: 'Bearer ' + j.token } }; };
  return { DB, J, AK, mk, clock, sql: (q, ...a) => DB._sqlite.prepare(q).all(...a) };
}
/* 타자 줄 [이름, g, pa, ab, h, tb, hr, rbi, sb, ob, sf], 투수 줄 [이름, g, outs, er, so, sv, w, wh] */
const bat = (n, hr, pa = 110, h = 34) => [n, 27, pa, pa - 12, h, h + hr * 3 + 6, hr, hr * 3, 2, 11, 1];
const pit = (n, outs, er, so, sv = 0, w = 0) => [n, sv ? 20 : 9, outs, er, so, sv, w, Math.round(outs / 3)];
const res = (key, rank, o = {}) => Object.assign({ key, rank, teams: 10, w: 18, l: 9, d: 0, opps: [], ps: o.ps, rec: { team: { n: o.team || '와이즈', rs: 140, ra: 101, hr: 30 }, b: o.b || [bat('강타자', 9), bat('교타자', 2, 120, 48)], p: o.p || [pit('에이스', 150, 30, 60, 0, 6), pit('마무리', 30, 2, 25, 11)] } }, o.x || {});

test('스키마: migrations/0004_ladder_records.sql과 worker/v1/records.js REC_SQL이 같다', async () => {
  const { REC_SQL, recStatements } = await RC;
  assert.equal(REC_SQL, fs.readFileSync(path.join(root, 'migrations/0004_ladder_records.sql'), 'utf8'));
  assert.equal(recStatements().length, 6); assert.ok(recStatements().every(s => /^CREATE (TABLE|INDEX) IF NOT EXISTS/.test(s)));
});
test('rec 검사: 틀린 줄(안타 > 타수, 홈런 > 안타, 경기 0, 금칙어 이름)은 버리고 팀이 틀리면 전체를 버린다', async () => {
  const { recParse, REC_B } = await RC;
  assert.equal(recParse(null), null); assert.equal(recParse({ b: [] }), null); assert.equal(recParse({ team: { n: 'x', rs: -1 } }), null);
  const r = recParse({ team: { n: '팀<b>', rs: 10, ra: 9, hr: 2 }, b: [bat('정상', 3), ['안타초과', 27, 10, 5, 6, 6, 0, 0, 0, 0, 0], ['홈런초과', 27, 10, 9, 1, 4, 2, 0, 0, 0, 0], ['영경기', 0, 4, 4, 1, 1, 0, 0, 0, 0, 0], ['시1발', 27, 10, 9, 1, 1, 0, 0, 0, 0, 0], bat('정상', 1)],
    p: [pit('투수', 30, 3, 10), ['삼진초과', 3, 3, 0, 9, 0, 0, 1], 'x'] });
  assert.equal(r.team.n, '팀b'); assert.deepEqual(r.b.map(x => x.name), ['정상']); assert.deepEqual(r.p.map(x => x.name), ['투수']);
  assert.equal(recParse({ team: { n: 'a', rs: 1, ra: 1, hr: 0 }, b: Array.from({ length: 30 }, (_, i) => bat('타' + i, 1)) }).b.length, REC_B, '줄 수 한도');
});
dbTest('결과에 붙은 기록: 시즌 홈런·타율(규정 타석)·OPS·ERA(규정 이닝)·탈삼진·세이브·팀 승리·최다 우승·최근 우승. 중복은 한 번, 숨김·삭제는 빠짐', async () => {
  const { J, AK, mk, sql } = await setup();
  const a = await mk('새벽별', '10.1.0.1'), b = await mk('달빛', '10.1.0.2'), c = await mk('은하수', '10.1.0.3');
  /* a: 두 리그(우승 2번, 강타자 9 + 9 = 18홈런), b: 홈런 14 한 리그(준우승), c: 짧은 타석 고타율(규정 미달) */
  let j = await J('POST', '/api/v1/ladder/result', res('lg-a1', 1, { ps: 'c' }), a.A); assert.equal(j._s, 200, JSON.stringify(j)); assert.equal(j.rec, 4); assert.equal(j.ps, 'c');
  assert.equal(j.delta, 30 + 3, '우승 보너스 3점'); assert.equal(j.tier, 1, '단계는 정규 순위(1위 승격) 그대로');
  j = await J('POST', '/api/v1/ladder/result', res('lg-a1', 1, { ps: 'c' }), a.A); assert.equal(j.dup, true); assert.equal(sql('SELECT COUNT(*) AS n FROM ladder_lines')[0].n, 4, '같은 리그 두 번');
  j = await J('POST', '/api/v1/ladder/result', res('lg-a2', 3, { ps: 'c' }), a.A); assert.equal(j.delta, 19 + 3); assert.equal(j.tier, 2, '래더 v4(구단주 11-18 §3): 정규 3위라도 우승팀은 승격'); assert.equal(j.move, 'up');
  j = await J('POST', '/api/v1/ladder/result', res('lg-b1', 2, { ps: 'r', team: '달빛팀', b: [bat('홈런왕', 14)], p: [pit('철완', 170, 25, 80, 0, 7)] }), b.A); assert.equal(j.delta, 24 + 1, '준우승 보너스 1점');
  j = await J('POST', '/api/v1/ladder/result', res('lg-c1', 7, { team: '은하팀', b: [['교타왕', 8, 40, 36, 20, 24, 0, 3, 0, 4, 0]], p: [pit('짧은투수', 30, 0, 20)], x: { ps: 'z' } }), c.A); assert.equal(j.delta, 7, '알 수 없는 포스트시즌 값은 보너스 없음');
  const R = await J('GET', '/api/v1/ladder/records'); assert.equal(R._s, 200, JSON.stringify(R));
  assert.equal(R.leagues, 4); assert.deepEqual(R.min, { pa: 84, ip: 27 });
  assert.deepEqual(R.boards.hr.map(x => [x.nick, x.name, x.v]), [['새벽별', '강타자', 18], ['달빛', '홈런왕', 14], ['새벽별', '교타자', 4]], '홈런: 시즌 합');
  assert.ok(R.boards.avg.length >= 1 && !R.boards.avg.some(x => x.name === '교타왕'), '규정 타석 미달은 타율 순위 밖'); assert.equal(R.boards.avg[0].name, '교타자');
  assert.ok(R.boards.ops[0].v > 0.7); assert.ok(!R.boards.era.some(x => x.name === '짧은투수' || x.name === '마무리'), '규정 이닝(27) 미달은 ERA 밖');
  assert.equal(R.boards.era[0].name, '철완'); assert.equal(R.boards.so[0].name, '에이스'); assert.equal(R.boards.so[0].v, 120); assert.equal(R.boards.sv[0].v, 22);
  assert.deepEqual(R.boards.titles.map(x => [x.nick, x.v]), [['새벽별', 2]]); assert.equal(R.champs.length, 2); assert.equal(R.champs[0].nick, '새벽별');
  assert.equal(R.boards.tw.length, 4); assert.ok(R.boards.tw.every(x => x.v === 18));
  assert.ok(!JSON.stringify(R).includes('wid') && !JSON.stringify(R).includes('secret'), '닉네임 말고 개인 정보 없음');
  /* 단계 거르기: a의 둘째 리그만 마이너(단계 1), 나머지 셋은 루키(0) */
  const T0 = await J('GET', '/api/v1/ladder/records?tier=0'); assert.ok(T0.boards.hr.every(x => x.tier === 0)); assert.equal(T0.leagues, 3); assert.equal(T0.boards.hr[0].v, 14, '단계 안 합');
  assert.equal((await J('GET', '/api/v1/ladder/records?tier=9')).tier, 4, '단계는 0~4로 자름'); assert.equal((await J('GET', '/api/v1/ladder/records?season=abc'))._s, 400);
  /* 숨김 → 캐시 세대가 바뀌어 바로 빠진다. 삭제하면 줄도 지운다 */
  assert.equal((await J('PUT', '/api/v1/admin/hide', { pid: b.id, hide: true }, AK))._s, 200);
  const R2 = await J('GET', '/api/v1/ladder/records'); assert.ok(!R2.boards.hr.some(x => x.nick === '달빛'), '숨긴 플레이어');
  assert.equal((await J('DELETE', '/api/v1/player', null, a.A))._s, 200); assert.equal(sql('SELECT COUNT(*) AS n FROM ladder_lines WHERE player_id = ?', a.id)[0].n, 0, '삭제한 플레이어 줄'); assert.equal(sql('SELECT COUNT(*) AS n FROM ladder_teams WHERE player_id = ?', a.id)[0].n, 0);
});
dbTest('표가 없어도(0004를 안 돌린 서버) 결과를 받을 때·읽을 때 만든다. rec가 없는 예전 결과도 그대로 받는다', async () => {
  const { J, mk, sql } = await setup({ noRec: true });
  assert.equal(sql("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'ladder_lines'")[0].n, 0);
  const a = await mk('새벽별', '10.2.0.1');
  const R0 = await J('GET', '/api/v1/ladder/records'); assert.equal(R0._s, 200); assert.equal(R0.boards.hr.length, 0); assert.equal(R0.champs.length, 0);
  const j = await J('POST', '/api/v1/ladder/result', { key: 'old-1', rank: 4, teams: 10, w: 14, l: 13, d: 0 }, a.A); assert.equal(j._s, 200); assert.equal(j.rec, 0); assert.equal(j.delta, 15);
  assert.equal((await J('POST', '/api/v1/ladder/result', res('new-1', 2, { ps: 's' }), a.A)).rec, 4); assert.equal(sql('SELECT ps FROM ladder_teams')[0].ps, 's');
});
dbTest('기록실 읽기는 요청 제한(read)을 받는다', async () => {
  const { J } = await setup(); const { LIMITS } = await RL; let last = null;
  for (let i = 0; i <= LIMITS.read[0]; i++) last = await J('GET', '/api/v1/ladder/records', null, { ip: '198.51.100.4' });
  assert.equal(last._s, 429);
});
