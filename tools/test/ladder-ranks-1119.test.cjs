/* 래더 순위표 50위 · 내 순위 둘레 · 덱 구경(구단주 11-19 "다른 일반 유저들 리그의 랭킹 리스트 … 상위 팀들 덱도 관전") 서버 점검.
   가짜 D1(node:sqlite). 순위표가 50명에서 끊기는지, 50위 밖 유저가 자기 위·아래를 받는지, 덱 구경이 한 팀만·공개 칸만 주는지,
   숨김·덱 없음·틀린 id는 404·400인지, 응답에 토큰·기기·세계 id·접속 주소가 없는지 본다 */
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { makeD1, hasSqlite } = require('../lib/d1-shim.cjs');
const W = import(path.join(root, 'worker/index.js')), V = import(path.join(root, 'worker/v1/index.js')), RL = import(path.join(root, 'worker/v1/ratelimit.js')),
  SE = import(path.join(root, 'worker/v1/season.js')), US = import(path.join(root, 'worker/v1/usage.js')), LD = import(path.join(root, 'worker/v1/ladder.js'));
const ORIGIN = 'https://fronttime.example.workers.dev';
function deck(o = {}) { const P = []; const POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'C', 'SS', 'LF', '1B'];
  POS.forEach((pos, i) => P.push({ id: i + 1, name: '타자' + i, age: 27, isP: false, pos, th: '우', bt: '우', r: { con: 50, pow: 50, eye: 50, spd: 50, def: 50, vit: 60 }, pot: 55, sal: 300 }));
  for (let i = 0; i < 12; i++) P.push({ id: 100 + i, name: '투수' + i, age: 28, isP: true, pos: 'P', th: '우', bt: '우', r: { stf: 50, ctl: 50, sta: i < 5 ? 60 : 40 }, pot: 55, role: i < 5 ? 'SP' : 'RP', sal: 300 });
  return Object.assign({ v: 1, kind: 'cup-entry', name: '와이', year: 2035, club: {}, mgr: { name: '김감독' }, P, ln: [[1, 'C'], [2, '1B'], [3, '2B'], [4, '3B'], [5, 'SS'], [6, 'LF'], [7, 'CF'], [8, 'RF'], [10, 'DH']], bn: [9, 11, 12], rot: [100, 101, 102, 103, 104], pen: [105, 106, 107, 108, 109, 110, 111], bp: {}, ovr: { t: 60, p: 61, b: 59 }, payRef: 9000 }, o); }
async function setup() {
  const { handle } = await W; (await V)._v1Reset(); (await RL)._resetRL(); (await SE)._resetSeason(); (await US)._resetUsage(); (await LD)._metaReset(); (await LD)._genReset();
  const DB = makeD1(), env = { DB, CUP_ADMIN: 's3cret' }, clock = { now: Date.UTC(2026, 10, 20, 3) };
  const H = async (m, p, b, h = {}) => { const r = await handle(new Request(ORIGIN + p, { method: m, body: b == null ? undefined : JSON.stringify(b), headers: Object.assign({ Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.7' }, h) }), env, clock.now); clock.now += 1000; return r; };
  const J = async (...a) => { const r = await H(...a); return Object.assign({ _s: r.status }, await r.json()); };
  const AK = { Authorization: 'Bearer s3cret' };
  assert.equal((await J('POST', '/api/v1/admin/migrate', null, AK))._s, 200);
  const mk = async (nick, ip, wid) => { const j = await J('POST', '/api/v1/player', { nickname: nick, platform: 'web', wid }, { 'CF-Connecting-IP': ip }); assert.equal(j._s, 201, JSON.stringify(j)); return { id: j.player.id, token: j.token, ip, wid, A: { Authorization: 'Bearer ' + j.token, 'CF-Connecting-IP': ip } }; };
  return { env, DB, H, J, AK, mk, clock };
}
const dbTest = (name, fn) => test(name, { skip: hasSqlite ? false : 'node:sqlite 없음(노드 22.5 이상 필요)' }, fn);
const result = async (J, who, key, rank) => { const j = await J('POST', '/api/v1/ladder/result', { key, rank, teams: 10, w: 15, l: 12, d: 0, opps: [] }, who.A); assert.equal(j._s, 200, JSON.stringify(j)); return j; };
/* 응답 어디에도 없어야 하는 것: 토큰·세계 id·접속 주소·기기 표식·관리자 키 */
const HIDE = /s3cret|ft1\.|"wid"|"dev"|"ip"|"token"|"email"|"device|"platform"|"hidden"/;
function noSecrets(j, P, what) { const t = JSON.stringify(j);
  for (const p of P) { assert.ok(!t.includes(p.token), what + ': 토큰'); assert.ok(!t.includes(p.token.slice(4)), what + ': 토큰 뒷부분'); if (p.wid) assert.ok(!t.includes(p.wid), what + ': 세계 id'); assert.ok(!t.includes(p.ip), what + ': 접속 주소'); }
  assert.ok(!HIDE.test(t), what + ': 숨길 칸 이름 ' + (t.match(HIDE) || [])[0]); }

dbTest('순위표는 상위 50명, 50위 밖 유저는 자기 순위 둘레(위·아래 3명)를 받는다', async () => {
  const { J, mk } = await setup(), { BOARD_N, NEAR_N } = await LD; assert.equal(BOARD_N, 50); assert.equal(NEAR_N, 3);
  const P = [];
  /* 56명이 3부(단계 2)에서 리그를 하나씩 마친다. 5위(12점, 잔류)로 모두 같은 점수 → 먼저 마친 순 */
  for (let i = 1; i <= 56; i++) { const wid = 'w' + String(i).padStart(16, '0'), p = await mk('유저' + i, '10.2.' + (i >> 4) + '.' + (i & 15), wid); P.push(p);
    assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '팀' + i, ovr: { t: 50 + (i % 20), p: 60, b: 60 } }), tier: 2, wid, auto: 1, dev: 'ab'.repeat(16) }, p.A))._s, 200);
    await result(J, p, 'LGX-' + i, 5); }
  const lb = await J('GET', '/api/v1/ladder/leaderboard?tier=2'); assert.equal(lb._s, 200); assert.equal(lb.cap, 50); assert.equal(lb.rows.length, 50, '50명에서 끊는다');
  assert.deepEqual(lb.rows.slice(0, 3).map(x => [x.rank, x.nickname, x.team, x.points, x.leagues]), [[1, '유저1', '팀1', 12, 1], [2, '유저2', '팀2', 12, 1], [3, '유저3', '팀3', 12, 1]]);
  assert.equal(lb.rows[49].nickname, '유저50'); assert.deepEqual(Object.keys(lb.rows[0]).sort(), ['best_tier', 'leagues', 'nickname', 'ovr', 'pid', 'points', 'rank', 'team', 'wins'], '순위표 줄의 칸');
  noSecrets(lb, P, '순위표');
  const all = await J('GET', '/api/v1/ladder/leaderboard?tier=all'); assert.equal(all.rows.length, 50); assert.equal(all.cap, 50); noSecrets(all, P, '전체 순위표');
  /* 53위 유저: 위 3명(50~52위) · 나 · 아래 3명(54~56위) */
  assert.equal((await J('GET', '/api/v1/ladder/near'))._s, 401, '로그인 없이 내 순위 둘레');
  const nr = await J('GET', '/api/v1/ladder/near', null, P[52].A); assert.equal(nr._s, 200); assert.equal(nr.rank, 53); assert.equal(nr.tier, 2);
  assert.deepEqual(nr.rows.map(x => [x.rank, x.nickname]), [[50, '유저50'], [51, '유저51'], [52, '유저52'], [53, '유저53'], [54, '유저54'], [55, '유저55'], [56, '유저56']]);
  assert.deepEqual(Object.keys(nr.rows[0]).sort(), Object.keys(lb.rows[0]).sort(), '둘레 줄은 순위표 줄과 같은 칸'); noSecrets(nr, P, '내 순위 둘레');
  const last = await J('GET', '/api/v1/ladder/near', null, P[55].A); assert.deepEqual(last.rows.map(x => x.rank), [53, 54, 55, 56], '꼴찌는 아래가 없다');
  const top = await J('GET', '/api/v1/ladder/near', null, P[0].A); assert.deepEqual(top.rows.map(x => x.rank), [1, 2, 3, 4], '1위는 위가 없다');
  /* 리그를 안 마친 유저: 순위 자격 없음 → 빈 둘레 */
  const fresh = await mk('새내기', '10.9.9.9'); const fn = await J('GET', '/api/v1/ladder/near', null, fresh.A); assert.equal(fn._s, 200); assert.equal(fn.rank, null); assert.deepEqual(fn.rows, []);
  /* 점수가 달라지면 둘레도 순위 규칙대로: 유저56이 우승(30점)하면 승격한 단계에서 혼자 1위 */
  await result(J, P[55], 'LGX-56-b', 1); const up = await J('GET', '/api/v1/ladder/near', null, P[55].A); assert.equal(up.tier, 3, '승격한 단계 기준'); assert.equal(up.rank, 1); assert.deepEqual(up.rows.map(x => x.nickname), ['유저56']);
});

dbTest('덱 구경: 한 팀의 공개 덱만, 숨김·덱 없음·틀린 id는 못 본다, 개인 정보 없음', async () => {
  const { J, H, mk, AK, DB } = await setup();
  const a = await mk('에이스', '10.3.0.1', 'w00000000000000a1'), b = await mk('비숍', '10.3.0.2', 'w00000000000000b2'), c = await mk('덱없음', '10.3.0.3');
  const ea = deck({ name: '에이스팀', wid: a.wid, ts: 12345, flags: ['x'], cup: 'c1', secret: '몰래', payRef: 9000, ovr: { t: 71, p: 72, b: 70 } }); ea.P[0].f = 'data:image/png;base64,AAAA';
  assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: ea, tier: 1, wid: a.wid, man: 1, dev: 'cd'.repeat(16) }, a.A))._s, 200);
  assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '비숍팀' }), tier: 1, wid: b.wid }, b.A))._s, 200);
  await result(J, a, 'LGX-a', 3);
  const d = await J('GET', '/api/v1/ladder/deck/' + a.id); assert.equal(d._s, 200, JSON.stringify(d).slice(0, 200));
  assert.deepEqual([d.pid, d.nickname, d.name, d.tier, d.ovr.t, d.year], [a.id, '에이스', '에이스팀', 1, 71, 2035]); assert.deepEqual(d.entry, { points: 19, leagues: 1, wins: 0, best_tier: 1 });
  assert.deepEqual(Object.keys(d).filter(k => k !== '_s').sort(), ['at', 'e', 'entry', 'name', 'nickname', 'ok', 'ovr', 'pid', 'season', 'tier', 'year'], '덱 구경 응답의 칸');
  assert.deepEqual(Object.keys(d.e).sort(), ['P', 'bn', 'bp', 'club', 'kind', 'ln', 'mgr', 'name', 'ovr', 'pen', 'rot', 'v', 'year'], '덱 본문은 아는 칸만(세계 id·대회·시각·표시·모르는 칸 없음)');
  assert.equal(d.e.P.length, 24); assert.equal(d.e.ln.length, 9); assert.equal(d.e.rot.length, 5); assert.equal(d.e.pen.length, 7); assert.equal(d.e.mgr.name, '김감독'); assert.ok(d.e.P.every(p => p.f === undefined), '사진 없음');
  noSecrets(d, [a, b], '덱 구경'); assert.ok(!JSON.stringify(d).includes('몰래')); assert.ok(!JSON.stringify(d).includes('cd'.repeat(16)), '기기 표식');
  /* 로그인 없이 공개로 읽는다. 캐시 머리글 */
  const raw = await H('GET', '/api/v1/ladder/deck/' + a.id); assert.equal(raw.status, 200); assert.match(raw.headers.get('Cache-Control'), /public.*s-maxage=120/);
  /* 리그를 안 마친 유저: 순위표에 없다 → 덱도 못 본다(404 not_top). 리그를 하나 마치면 순위표에 올라 보인다 */
  { const d0 = await J('GET', '/api/v1/ladder/deck/' + b.id); assert.equal(d0._s, 404); assert.equal(d0.error, 'not_top'); assert.match(d0.message, /상위 50위 안의 팀만/); assert.ok(!d0.e && !d0.nickname && !d0.name, '못 보는 응답에 덱·이름 없음'); noSecrets(d0, [a, b], '순위 밖 응답'); }
  await result(J, b, 'LGX-b', 6);
  const d2 = await J('GET', '/api/v1/ladder/deck/' + b.id); assert.equal(d2._s, 200); assert.equal(d2.name, '비숍팀'); assert.equal(d2.entry.leagues, 1);
  /* 못 보는 경우 */
  { const n = await J('GET', '/api/v1/ladder/deck/' + c.id); assert.equal(n._s, 404, '덱이 없는 플레이어'); assert.equal(n.error, 'not_found'); } assert.equal((await J('GET', '/api/v1/ladder/deck/p0000000000000000'))._s, 404, '없는 플레이어');
  for (const bad of ['abc', a.wid, a.token, "p1' OR 1=1 --", '%E0%A4%A']) assert.equal((await J('GET', '/api/v1/ladder/deck/' + encodeURIComponent(bad)))._s, 400, '틀린 id ' + bad);
  assert.equal((await J('PUT', '/api/v1/admin/hide', { pid: a.id, hide: 1 }, AK))._s, 200); (await LD)._genReset();
  { const h = await J('GET', '/api/v1/ladder/deck/' + a.id); assert.equal(h._s, 404, '숨긴 플레이어의 덱'); assert.equal(h.error, 'not_found', '숨김은 순위 밖과 구분되지 않게 not_found'); }
  assert.equal((await J('PUT', '/api/v1/admin/hide', { pid: a.id, hide: 0 }, AK))._s, 200); (await LD)._genReset(); assert.equal((await J('GET', '/api/v1/ladder/deck/' + a.id))._s, 200);
  /* 자동 참가를 끄면 서버 덱이 지워진다 → 덱 구경도 404 */
  assert.equal((await J('PUT', '/api/v1/ladder/auto', { on: false }, b.A))._s, 200); assert.equal((await J('GET', '/api/v1/ladder/deck/' + b.id))._s, 404, '자동 참가를 끈 유저');
  /* 덱 쓰기·지우기 길은 그대로(로그인 필요) */
  assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck() }))._s, 401); assert.equal((await J('DELETE', '/api/v1/ladder/deck'))._s, 401);
  assert.equal(DB._sqlite.prepare('SELECT COUNT(*) AS n FROM decks').all()[0].n, 1);
});

dbTest('덱 구경은 요청 제한(read)에 든다', async () => {
  const { H, mk, J } = await setup(); const a = await mk('제한', '10.4.0.1'); await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '제한팀' }), tier: 0 }, a.A); await result(J, a, 'LGX-rl', 5);
  let s429 = 0, s200 = 0; for (let i = 0; i < 400; i++) { const r = await H('GET', '/api/v1/ladder/deck/' + a.id, null, { 'CF-Connecting-IP': '198.51.100.9' }); if (r.status === 429) { s429++; break; } if (r.status === 200) s200++; }
  assert.ok(s200 > 0 && s429 === 1, `같은 주소에서 계속 부르면 429 (200 ${s200}번)`);
});

dbTest('덱 구경은 자기 단계 상위 50위까지: 50위는 보이고 51위·숨긴 플레이어는 안 보인다(순위표와 같은 기준)', async () => {
  const { J, mk, AK } = await setup(), { BOARD_N, boardTop } = await LD; assert.equal(BOARD_N, 50); assert.equal(typeof boardTop, 'function');
  const P = [];
  for (let i = 1; i <= 53; i++) { const wid = 'w' + String(i).padStart(16, '0'), p = await mk('유저' + i, '10.5.' + (i >> 4) + '.' + (i & 15), wid); P.push(p);
    assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '팀' + i }), tier: 2, wid, auto: 1 }, p.A))._s, 200); await result(J, p, 'LGT-' + i, 5); }
  const board = async () => (await J('GET', '/api/v1/ladder/leaderboard?tier=2')).rows, see = async p => J('GET', '/api/v1/ladder/deck/' + p.id);
  let lb = await board(); assert.equal(lb.length, 50); assert.equal(lb[49].pid, P[49].id, '50위 = 유저50');
  const d50 = await see(P[49]); assert.equal(d50._s, 200, '50위 덱은 보인다'); assert.equal(d50.name, '팀50'); assert.equal(d50.nickname, '유저50');
  const d51 = await see(P[50]); assert.equal(d51._s, 404, '51위 덱은 안 보인다'); assert.equal(d51.error, 'not_top'); assert.match(d51.message, /상위 50위 안의 팀만 볼 수 있습니다/);
  assert.deepEqual(Object.keys(d51).filter(k => k !== '_s').sort(), ['error', 'message', 'ok'], '못 보는 응답은 이유뿐'); noSecrets(d51, P, '51위 응답');
  assert.equal((await see(P[52]))._s, 404, '53위');
  /* 순위표의 모든 줄은 보이고, 순위표에 없는 플레이어는 하나도 안 보인다(둘이 어긋나지 않는다) */
  const inb = new Set(lb.map(x => x.pid)); for (const p of [P[0], P[24], P[48], P[49], P[50], P[51], P[52]]) assert.equal((await see(p))._s, inb.has(p.id) ? 200 : 404, '순위표와 덱 구경 자격이 같다');
  /* 숨긴 플레이어(1위): 덱은 not_found, 순위표에서 빠지고 51위가 50위로 올라와 보인다 */
  assert.equal((await J('PUT', '/api/v1/admin/hide', { pid: P[0].id, hide: 1 }, AK))._s, 200); (await LD)._genReset();
  { const h = await see(P[0]); assert.equal(h._s, 404, '숨긴 플레이어'); assert.equal(h.error, 'not_found'); }
  lb = await board(); assert.ok(!lb.some(x => x.pid === P[0].id)); assert.equal(lb[49].pid, P[50].id, '숨김 뒤 50위 = 유저51');
  assert.equal((await see(P[50]))._s, 200, '50위로 올라온 유저51'); assert.equal((await see(P[51]))._s, 404, '이제 51위인 유저52');
  assert.equal((await J('PUT', '/api/v1/admin/hide', { pid: P[0].id, hide: 0 }, AK))._s, 200); (await LD)._genReset();
  /* 다른 단계로 올라가면 그 단계 순위표 기준: 유저53이 우승 → 승격한 단계에서 1위 → 보인다 */
  await result(J, P[52], 'LGT-53-b', 1); const up = await see(P[52]); assert.equal(up._s, 200, '승격한 단계 1위'); assert.equal(up.entry.points, 42);
  /* 로그인해도 같다(내 덱이라도 이 길로는 순위 밖이면 못 본다. 내 덱은 덱 화면에서 본다) */
  assert.equal((await J('GET', '/api/v1/ladder/deck/' + P[51].id, null, P[51].A))._s, 404);
});
