/* 서버 v1(worker/v1, D1) 단위 점검: 가짜 D1(node:sqlite)로 플레이어 만들기·덱 등록·상대·결과(포인트·단계·맞대결·소식)·순위표·시즌 교체·관리자 집계·요청 제한·키 검사·DB 없을 때 503.
   node:sqlite가 없는 노드(20)에서는 DB가 필요한 점검을 건너뛴다(DB 없음·스키마 파일 점검은 돈다). */
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const root = path.resolve(__dirname, '../..');
const { makeD1, hasSqlite } = require('../lib/d1-shim.cjs');
const W = import(path.join(root, 'worker/index.js')), V = import(path.join(root, 'worker/v1/index.js')), RL = import(path.join(root, 'worker/v1/ratelimit.js')),
  SE = import(path.join(root, 'worker/v1/season.js')), SC = import(path.join(root, 'worker/v1/schema.js')), US = import(path.join(root, 'worker/v1/usage.js')), LD = import(path.join(root, 'worker/v1/ladder.js'));
const ORIGIN = 'https://fronttime.example.workers.dev', DAY = 86400e3;
function deck(o = {}) { const P = []; const POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'C', 'SS', 'LF', '1B'];
  POS.forEach((pos, i) => P.push({ id: i + 1, name: '타자' + i, age: 27, isP: false, pos, th: '우', bt: '우', r: { con: 50, pow: 50, eye: 50, spd: 50, def: 50, vit: 60 }, pot: 55, sal: 300 }));
  for (let i = 0; i < 12; i++) P.push({ id: 100 + i, name: '투수' + i, age: 28, isP: true, pos: 'P', th: '우', bt: '우', r: { stf: 50, ctl: 50, sta: i < 5 ? 60 : 40 }, pot: 55, role: i < 5 ? 'SP' : 'RP', sal: 300 });
  return Object.assign({ v: 1, kind: 'cup-entry', name: '와이', year: 2035, club: {}, mgr: {}, P, ln: [[1, 'C'], [2, '1B'], [3, '2B'], [4, '3B'], [5, 'SS'], [6, 'LF'], [7, 'CF'], [8, 'RF'], [10, 'DH']], bn: [9, 11, 12], rot: [100, 101, 102, 103, 104], pen: [105, 106, 107, 108, 109, 110, 111], bp: {}, ovr: { t: 60, p: 61, b: 59 }, payRef: 9000 }, o); } /* 연봉 300 × 24명 = 7200, 리그 평균 9000 → 0.8배(사용자 11-17 연봉 상한) */
async function setup(o = {}) {
  const { handle } = await W; (await V)._v1Reset(); (await RL)._resetRL(); (await SE)._resetSeason(); (await US)._resetUsage(); (await LD)._metaReset(); (await LD)._genReset();
  const DB = o.noDb ? undefined : makeD1(), env = { DB, CUP_ADMIN: 's3cret' };
  if (o.kv) { const m = o.kv; env.SAVE_KV = { async get(k) { return m.has(k) ? m.get(k).v : null; }, async getWithMetadata(k) { const e = m.get(k); return { value: e ? e.v : null, metadata: e ? e.meta : null }; },
    async put(k, v, x = {}) { m.set(k, { v: String(v), meta: x.metadata || null }); }, async delete(k) { m.delete(k); }, async list({ prefix }) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name, metadata: m.get(name).meta })), list_complete: true }; } }; }
  const clock = { now: o.now || Date.UTC(2026, 10, 20, 3) };
  const H = async (m, p, b, h = {}) => { const r = await handle(new Request(ORIGIN + p, { method: m, body: b == null ? undefined : typeof b === 'string' ? b : JSON.stringify(b), headers: Object.assign({ Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.7' }, h) }), env, clock.now); clock.now += 1000; return r; };
  const J = async (...a) => { const r = await H(...a); return Object.assign({ _s: r.status }, await r.json()); };
  const AK = { Authorization: 'Bearer s3cret' };
  if (DB && !o.noSchema) assert.equal((await J('POST', '/api/v1/admin/migrate', null, AK))._s, 200);
  const mk = async (nick, ip) => { const j = await J('POST', '/api/v1/player', { nickname: nick, platform: 'web' }, ip ? { 'CF-Connecting-IP': ip } : {}); assert.equal(j._s, 201, JSON.stringify(j)); return { id: j.player.id, A: { Authorization: 'Bearer ' + j.token } }; };
  return { env, H, J, AK, mk, clock };
}
const dbTest = (name, fn) => test(name, { skip: hasSqlite ? false : 'node:sqlite 없음(노드 22.5 이상 필요)' }, fn);

test('스키마: migrations/0001_init.sql과 worker/v1/schema.js가 같다', async () => {
  const { SCHEMA_SQL, schemaStatements } = await SC;
  assert.equal(SCHEMA_SQL, fs.readFileSync(path.join(root, 'migrations/0001_init.sql'), 'utf8'));
  const doc = fs.readFileSync(path.join(root, 'docs/server-setup.md'), 'utf8').match(/```sql\n([\s\S]*?)```/); assert.ok(doc, '설정 안내의 SQL'); assert.equal(doc[1], SCHEMA_SQL, '설정 안내(docs/server-setup.md)의 SQL이 migrations와 다름');
  assert.ok(schemaStatements().length >= 20); assert.ok(schemaStatements().every(s => !/^--/.test(s)));
});
test('DB 바인딩이 없으면 v1은 503 not_configured, 기존 API는 그대로', async () => {
  const { H, J } = await setup({ noDb: true });
  for (const p of ['/api/v1/health', '/api/v1/ladder/leaderboard?tier=0']) { const j = await J('GET', p); assert.equal(j._s, 503); assert.equal(j.error, 'not_configured'); assert.equal(j.fallback, 'kv'); }
  assert.equal((await J('POST', '/api/v1/player', { nickname: '테스트' }))._s, 503);
  assert.equal((await H('GET', '/api/ladder/tiers')).status, 503, '기존 래더(SAVE_KV 없음)도 원래대로 503');
});
dbTest('표가 없으면 503 schema_missing, 관리자 migrate는 키가 있어야 하고 여러 번 해도 안전', async () => {
  const { J, AK } = await setup({ noSchema: true });
  assert.equal((await J('GET', '/api/v1/health')).error, 'schema_missing');
  assert.equal((await J('POST', '/api/v1/admin/migrate'))._s, 401); assert.equal((await J('POST', '/api/v1/admin/migrate', null, { Authorization: 'Bearer nope' }))._s, 401);
  assert.equal((await J('POST', '/api/v1/admin/migrate', null, AK))._s, 200); assert.equal((await J('POST', '/api/v1/admin/migrate', null, AK))._s, 200);
  const h = await J('GET', '/api/v1/health'); assert.equal(h._s, 200); assert.equal(h.schema, 1); assert.equal(h.season.id, 1);
  assert.equal(h.season.ends - h.season.starts, 14 * DAY); assert.equal(new Date(h.season.starts + 9 * 3600e3).getUTCDay(), 1, '시즌은 월요일 00:00 KST 시작');
});
dbTest('플레이어: 만들기·토큰·닉네임 검사·바꾸기(하루 1번)·인증 실패·다른 출처 쓰기 거절', async () => {
  const { J, mk, clock } = await setup();
  const a = await mk('새벽별');
  assert.match(a.id, /^p[0-9a-f]{16}$/); assert.match(a.A.Authorization, /^Bearer ft1\.[0-9a-f]{32}$/);
  assert.equal((await J('GET', '/api/v1/player/me', null, a.A)).player.nickname, '새벽별');
  assert.equal((await J('GET', '/api/v1/player/me', null, { Authorization: 'Bearer ft1.' + '0'.repeat(32) }))._s, 401);
  assert.equal((await J('GET', '/api/v1/ladder/me'))._s, 401);
  for (const bad of ['시1발', 'a', '관리자님']) assert.equal((await J('POST', '/api/v1/player', { nickname: bad }))._s, 400, bad);
  assert.equal((await J('POST', '/api/v1/player', { nickname: '바뀐별' }, a.A)).player.nickname, '바뀐별', '첫 이름 바꾸기');
  assert.equal((await J('POST', '/api/v1/player', { nickname: '또바뀜' }, a.A)).error, 'name_wait'); clock.now += DAY;
  assert.equal((await J('POST', '/api/v1/player', { nickname: '또바뀜' }, a.A)).player.nickname, '또바뀜');
  assert.equal((await J('POST', '/api/v1/player', { nickname: '남의사이트' }, { Origin: 'https://evil.example' }))._s, 403);
});
dbTest('요청 제한: 같은 IP에서 새 플레이어 10명까지, 플레이어당 쓰기 60번/10분', async () => {
  const { J, mk } = await setup();
  for (let i = 0; i < 10; i++) await mk('유저' + i, '198.51.100.1');
  const r = await J('POST', '/api/v1/player', { nickname: '열한번째' }, { 'CF-Connecting-IP': '198.51.100.1' }); assert.equal(r._s, 429); assert.equal(r.error, 'rate_limited');
  await mk('다른IP', '198.51.100.2');
  const a = await mk('쓰기왕', '198.51.100.3'); let last;
  for (let i = 0; i < 61; i++) last = await J('POST', '/api/v1/ladder/result', { key: 'lg-' + i, rank: 5, teams: 10 }, a.A);
  assert.equal(last._s, 429);
});
async function league(J, who, key, rank, opps) { const j = await J('POST', '/api/v1/ladder/result', { key, rank, teams: 10, w: 15, l: 12, d: 0, opps: opps || [] }, who.A); assert.equal(j._s, 200, JSON.stringify(j)); return j; }
dbTest('덱 등록·상대: 같은 단계에서 OVR 가까운 순, 나·숨긴 플레이어 제외, 사진 없이', async () => {
  const { J, mk, AK } = await setup(); const P = [];
  for (let i = 1; i <= 12; i++) { const p = await mk('감독' + i, '10.0.0.' + i); P.push(p); const j = await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '팀' + i, ovr: { t: 60 + i, p: 60, b: 60 } }), tier: i <= 11 ? 2 : 0 }, p.A); assert.equal(j._s, 200, JSON.stringify(j)); assert.equal(j.tier, i <= 11 ? 2 : 0, '처음 옮겨 올 때 단계'); }
  const bad = deck(); bad.ln = bad.ln.slice(0, 8); assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: bad }, P[0].A))._s, 400);
  assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '시1발' }) }, P[0].A)).error, 'bad_name');
  const o = await J('GET', '/api/v1/ladder/opponents?n=9', null, P[4].A); // 팀5, OVR 65, 단계 2
  assert.equal(o.tier, 2); assert.equal(o.decks.length, 9); assert.ok(!o.decks.some(d => d.pid === P[4].id), '나를 상대로 줌'); assert.ok(!o.decks.some(d => d.name === '팀12'), '다른 단계');
  assert.deepEqual(o.decks.slice(0, 2).map(d => d.ovr.t).sort(), [64, 66]); assert.ok(o.decks.every(d => d.e.P.length === 24 && d.nickname));
  assert.equal((await J('PUT', '/api/v1/admin/hide', { pid: P[3].id, hide: 1 }, AK))._s, 200);
  const o2 = await J('GET', '/api/v1/ladder/opponents?n=9', null, P[4].A); assert.ok(!o2.decks.some(d => d.pid === P[3].id), '숨긴 플레이어');
});
dbTest('리그 결과: 포인트·승격·강등·맞대결·소식·같은 key는 한 번만·순위표·내 순위·라이벌', async () => {
  const { J, mk } = await setup(); const a = await mk('에이스'), b = await mk('비숍', '10.1.1.1'), c = await mk('찰리', '10.1.1.2');
  for (const [p, n] of [[a, '에이스팀'], [b, '비숍팀'], [c, '찰리팀']]) await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: n }), tier: 1 }, p.A);
  const r1 = await league(J, a, 'L-a-1', 1, [{ pid: b.id, w: 2, l: 1 }, { pid: c.id, w: 3 }, { pid: 'p0000000000000000', w: 1 }, { pid: a.id, w: 3 }]);
  assert.deepEqual([r1.tier_from, r1.tier, r1.move, r1.delta, r1.points], [1, 2, 'up', 30, 30]);
  const dup = await J('POST', '/api/v1/ladder/result', { key: 'L-a-1', rank: 10, teams: 10 }, a.A); assert.equal(dup.dup, true); assert.equal(dup.tier, 2, '같은 리그를 두 번 셈');
  const r2 = await league(J, a, 'L-a-2', 10, [{ pid: b.id, l: 3 }]); assert.deepEqual([r2.tier, r2.move, r2.delta, r2.points], [1, 'down', 1, 31]);
  await league(J, b, 'L-b-1', 2, [{ pid: a.id, w: 2, l: 1 }]); await league(J, c, 'L-c-1', 5);
  assert.equal((await J('POST', '/api/v1/ladder/result', { key: 'x', rank: 1 }, a.A))._s, 400); assert.equal((await J('POST', '/api/v1/ladder/result', { key: 'L-bad', rank: 11, teams: 10 }, a.A))._s, 400);
  const lb1 = await J('GET', '/api/v1/ladder/leaderboard?tier=1'); assert.deepEqual(lb1.rows.map(x => [x.nickname, x.points]), [['에이스', 31], ['찰리', 12]]);
  const lb2 = await J('GET', '/api/v1/ladder/leaderboard?tier=2'); assert.deepEqual(lb2.rows.map(x => x.nickname), ['비숍']);
  const f = await J('GET', '/api/v1/ladder/feed'); assert.deepEqual(f.items.map(x => [x.kind, x.nickname, x.tier_to]), [['promo', '비숍', 2], ['promo', '에이스', 2]], '강등은 소식에 안 나옴');
  const me = await J('GET', '/api/v1/ladder/me', null, a.A); assert.equal(me.entry.points, 31); assert.equal(me.entry.rank, 1); assert.equal(me.entry.best_tier, 2); assert.equal(me.entry.ups, 1); assert.equal(me.recent.length, 2);
  const rv = await J('GET', '/api/v1/ladder/rivals', null, a.A); assert.deepEqual(rv.attack.map(x => [x.nickname, x.n, x.w, x.l]), [['비숍', 6, 2, 4], ['찰리', 3, 3, 0]]);
  assert.deepEqual(rv.defense.map(x => [x.nickname, x.n, x.w, x.l]), [['비숍', 3, 1, 2]], '수비 기록은 내 쪽으로 뒤집음');
  const hh = await J('GET', '/api/v1/ladder/h2h/' + b.id, null, a.A); assert.equal(hh.attack.n, 6); assert.equal(hh.defense.w, 1);
});
dbTest('시즌: 14일 지나면 요청 때 교체, 단계별 1~3위 칭호·소식, 새 시즌 단계 -1·포인트 0, 관리자 즉시 교체', async () => {
  const { J, mk, AK, clock } = await setup(); const a = await mk('에이스'), b = await mk('비숍', '10.2.0.1');
  await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 3 }, a.A); await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0 }, b.A);
  await league(J, a, 'S1-a', 4); await league(J, b, 'S1-b', 6);
  const s1 = (await J('GET', '/api/v1/health')).season; clock.now = s1.ends + 3600e3;
  const h = await J('GET', '/api/v1/health'); assert.equal(h.season.id, 2); assert.equal(h.season.starts, s1.ends);
  const me = await J('GET', '/api/v1/ladder/me', null, a.A); assert.equal(me.entry.tier, 2, '지난 시즌 3 → 2'); assert.equal(me.entry.points, 0); assert.deepEqual(me.titles.map(t => [t.s, t.tier, t.rank]), [[1, 3, 1]]);
  assert.equal((await J('GET', '/api/v1/ladder/me', null, b.A)).entry.tier, 0, '루키는 그대로');
  const f = await J('GET', '/api/v1/ladder/feed'); assert.equal(f.items.filter(x => x.kind === 'season_top').length, 2);
  const lbOld = await J('GET', '/api/v1/ladder/leaderboard?tier=3&season=1'); assert.equal(lbOld.rows[0].nickname, '에이스'); assert.equal(lbOld.current, false);
  const r = await league(J, a, 'S2-a', 3); assert.equal(r.season, 2); assert.equal(r.tier_from, 2);
  assert.equal((await J('POST', '/api/v1/admin/season/roll'))._s, 401);
  const roll = await J('POST', '/api/v1/admin/season/roll', null, AK); assert.equal(roll.closed, 2); assert.equal(roll.season.id, 3); assert.equal(roll.season.ends - roll.season.starts, 14 * DAY);
  clock.now = s1.ends + 100 * DAY; assert.ok((await J('GET', '/api/v1/health')).season.id >= 4, '오래 비어도 지금 칸으로 건너뜀');
});
dbTest('관리자 현황: 키 검사, 오늘/7일 집계·단계 분포·시간대·플랫폼·상위·최근 덱·사용량', async () => {
  const { J, mk, AK, clock } = await setup(); const a = await mk('에이스'), b = await mk('비숍', '10.3.0.1');
  for (const k of [null, { Authorization: 'Bearer wrong' }]) assert.equal((await J('GET', '/api/v1/admin/stats', null, k || {}))._s, 401);
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '에이스팀' }), tier: 1 }, a.A); await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '비숍팀' }), tier: 1 }, b.A);
  await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '에이스팀2' }) }, a.A);
  await league(J, a, 'lg-A1', 1); await league(J, a, 'lg-A2', 9); await league(J, b, 'lg-B1', 10);
  clock.now += 3 * DAY; const c = await mk('찰리', '10.3.0.2'); await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '찰리팀' }) }, c.A); await league(J, c, 'lg-C1', 2);
  await J('GET', '/api/v1/ladder/me', null, a.A);
  const s = await J('GET', '/api/v1/admin/stats', null, AK); assert.equal(s._s, 200);
  assert.equal(s.windows.today.leagues, 1); assert.equal(s.windows.d7.leagues, 4); assert.equal(s.windows.d7.promos, 2); assert.equal(s.windows.d7.demos, 2);
  assert.equal(s.windows.today.decks_new, 1); assert.equal(s.windows.d7.decks_new, 3); assert.equal(s.windows.d7.decks_upd, 1);
  assert.equal(s.windows.today.active, 2, '오늘 활동: 찰리·에이스'); assert.equal(s.windows.d7.active, 3); assert.equal(s.windows.d7.players_new, 3);
  assert.deepEqual(s.tiers.map(t => t.players), [1, 2, 0, 0, 0]); assert.deepEqual(s.tiers.map(t => t.decks), [1, 2, 0, 0, 0]);
  assert.equal(s.hours.d7.reduce((x, y) => x + y, 0), 4); assert.equal(s.hours.d7.length, 24); assert.equal(s.trend.length, 14); assert.equal(s.trend[13].leagues, 1);
  assert.ok(s.platforms.web >= 3); assert.equal(s.platforms.android, 0); assert.deepEqual(s.top.map(x => [x.nickname, x.points]), [['에이스', 33], ['찰리', 24], ['비숍', 1]]); assert.equal(s.decks.length, 3); assert.equal(s.totals.players, 3);
  assert.ok(s.usage.d1_w > 0 && s.usage.d1_r > 0, '사용량 추정 ' + JSON.stringify(s.usage)); assert.equal(s.usage.free.d1_w, 1e5);
  assert.equal((await J('DELETE', '/api/v1/admin/deck/' + b.id, null, AK))._s, 200); assert.equal((await J('GET', '/api/v1/admin/stats', null, AK)).totals.decks, 2);
  const pl = await J('GET', '/api/v1/admin/players?q=' + encodeURIComponent('비숍'), null, AK); assert.equal(pl.players.length, 1);
});
dbTest('지우기: 본인 삭제(DELETE /player)는 기록·맞대결까지, 계정 연결은 비밀값 없으면 501, 스팀 확인은 가짜 응답으로', async () => {
  const { J, mk, env } = await setup(); const a = await mk('에이스'), b = await mk('비숍', '10.4.0.1');
  await J('PUT', '/api/v1/ladder/deck', { e: deck() }, a.A); await league(J, a, 'lg-D1', 1, [{ pid: b.id, w: 3 }]);
  assert.equal((await J('POST', '/api/v1/player/link', { provider: 'steam', ticket: 'ab'.repeat(20) }, a.A))._s, 501);
  const v = await V; env.STEAM_WEB_API_KEY = 'k'; env.STEAM_APP_ID = '480'; let asked = '';
  v._setFetch(async u => { asked = String(u); return new Response(JSON.stringify({ response: { params: { result: 'OK', steamid: '76561198000000001', ownersteamid: '76561198000000001', vacbanned: false, publisherbanned: false } } })); });
  try {
    assert.equal((await J('POST', '/api/v1/player/link', { provider: 'steam', ticket: 'ab'.repeat(20) }, a.A)).linked, true); assert.match(asked, /AuthenticateUserTicket\/v1\/\?key=k&appid=480&ticket=/);
    assert.equal((await J('POST', '/api/v1/player/link', { provider: 'steam', ticket: 'ab'.repeat(20) }, b.A))._s, 409, '다른 플레이어에 이미 연결');
    const lg = await J('POST', '/api/v1/player/login', { provider: 'steam', ticket: 'cd'.repeat(20), platform: 'steam' }); assert.equal(lg.player.id, a.id); assert.match(lg.token, /^ft1\./);
    assert.equal((await J('GET', '/api/v1/player/me', null, { Authorization: 'Bearer ' + lg.token })).player.id, a.id, '새 기기 토큰으로 같은 플레이어');
  } finally { v._setFetch(null); }
  assert.equal((await J('DELETE', '/api/v1/player', null, a.A))._s, 200); assert.equal((await J('GET', '/api/v1/player/me', null, a.A))._s, 401);
  const db = env.DB._sqlite; for (const t of ['players', 'decks', 'ladder_entries', 'league_results', 'h2h', 'identities', 'devices']) assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE ${t === 'players' ? 'id' : 'player_id'} = ?`).get(a.id).n, 0, t);
});
dbTest('클라이언트 연결부(src/core/net.mjs): 플레이어 만들기·토큰 보관·덱·결과, 끊기면 줄 세웠다가 다시 보냄, v1 꺼져 있으면 off', async () => {
  const { netCreate, netEnabled, netPlatform } = await import(path.join(root, 'src/core/net.mjs'));
  const { handle } = await W; const { env, clock } = await setup(); let down = false;
  const mem = new Map(), storage = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  const fetch = async (u, o) => { if (down) throw new TypeError('offline'); clock.now += 1000; return handle(new Request(ORIGIN + u, Object.assign({}, o, { signal: undefined })), env, clock.now); };
  const N = netCreate({ fetch, storage, platform: 'web', sleep: async () => {} });
  assert.equal(await N.probe(), 'ok'); assert.equal((await N.ensurePlayer('연결부')).status, 201); assert.ok(N.signedIn()); assert.equal(N.player().nickname, '연결부');
  assert.equal((await N.putDeck(deck(), 1)).data.tier, 1);
  down = true; const r = await N.result({ key: 'net-1', rank: 1, teams: 10 }); assert.equal(r.queued, true); assert.equal(N.queue().length, 1); assert.equal(N.status, 'offline');
  down = false; const r2 = await N.result({ key: 'net-2', rank: 5, teams: 10 }); assert.ok(r2.ok); assert.equal(N.queue().length, 0, '줄 세운 결과를 보냄');
  const me = (await N.me()).data; assert.equal(me.entry.leagues, 2); assert.equal(me.entry.tier, 2);
  assert.equal((await N.leaderboard(2)).data.rows[0].nickname, '연결부');
  /* 사용자 11-17: 기본으로 켠다. 끄기 = fo-net-v1 '0' 또는 ?net=kv, ?net=v1은 '0'이어도 켠다 */
  assert.equal(netEnabled(storage, ''), true, '기본 켜짐'); assert.equal(netEnabled(storage, '?a=1&net=kv'), false); assert.equal(netEnabled(storage, '?net=off'), false);
  storage.setItem('fo-net-v1', '0'); assert.equal(netEnabled(storage, ''), false, '끄기 스위치'); assert.equal(netEnabled(storage, '?a=1&net=v1'), true); storage.setItem('fo-net-v1', '1'); assert.equal(netEnabled(storage, ''), true);
  const { netSetEnabled } = await import(path.join(root, 'src/core/net.mjs')); netSetEnabled(false, storage); assert.equal(netEnabled(storage, ''), false); netSetEnabled(true, storage); assert.equal(netEnabled(storage, ''), true);
  const pid = N.player().id; const del = await N.deleteMe(); assert.ok(del.ok); assert.equal(N.signedIn(), false, '지우면 토큰을 버림'); assert.equal(env.DB._sqlite.prepare('SELECT COUNT(*) AS n FROM players WHERE id = ?').get(pid).n, 0);
  assert.equal(netPlatform({ FT_PLATFORM: 'steam' }), 'steam'); assert.equal(netPlatform({ Capacitor: { getPlatform: () => 'android' } }), 'android'); assert.equal(netPlatform({ navigator: { userAgent: 'Mozilla Chrome' } }), 'web');
  const off = netCreate({ fetch: async (u, o) => handle(new Request(ORIGIN + u, o), {}, Date.now()), storage: { getItem: () => null, setItem() {}, removeItem() {} } });
  assert.equal(await off.probe(), 'off');
});


/* 외부 검수 11-17 P1(결과 줄): 보내는 사이 들어온 결과 지키기 · 401은 줄에 두고 다시 로그인 · 429는 Retry-After까지 기다림 · 늘 오래된 결과부터 · 플레이어 만들기 실패해도 줄에 남음 · 같은 key는 서버가 한 번만 센다 */
dbTest('결과 줄(src/core/net.mjs): 한 줄로 차례대로, 지금 줄을 읽고 고쳐 쓰기, 401·429·연결 실패는 남기고 확정·영구 거절만 뺀다', async () => {
  const { netCreate, netResultKind } = await import(path.join(root, 'src/core/net.mjs'));
  const { handle } = await W; const { env, clock } = await setup();
  const mem = new Map(), storage = { getItem: k => mem.has(k) ? mem.get(k) : null, setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
  let mode = '', gate = null, seen = [], t = 0; const sent = () => seen.filter(x => x.p === '/api/v1/ladder/result').map(x => x.key);
  const fetch = async (u, o) => { const b = o.body ? JSON.parse(o.body) : null; seen.push({ p: u.split('?')[0], key: b && b.key });
    if (gate && u.endsWith('/ladder/result')) { const g = gate; gate = null; await g; }
    if (mode === 'down' && u.endsWith('/ladder/result')) throw new TypeError('offline');
    if (mode === '429' && u.endsWith('/ladder/result')) return new Response('{"error":"rate"}', { status: 429, headers: { 'Retry-After': '20' } });
    if (mode === '401' && u.endsWith('/ladder/result')) { mode = ''; return new Response('{"error":"auth"}', { status: 401 }); }
    clock.now += 1000; return handle(new Request(ORIGIN + u, Object.assign({}, o, { signal: undefined })), env, clock.now); };
  const N = netCreate({ fetch, storage, platform: 'web', sleep: async () => {}, now: () => t });
  assert.equal((await N.ensurePlayer('줄왕')).status, 201); await N.putDeck(deck(), 0);
  /* 1) 보내는 중에 새 결과 B가 들어와도 지워지지 않는다(예전: [A,B] → []) */
  let open; gate = new Promise(r => { open = r; }); const pa = N.result({ key: 'qq-A', rank: 1, teams: 10, w: 15, l: 12, d: 0 }); await new Promise(r => setTimeout(r, 5));
  N.enqueue({ key: 'qq-B', rank: 1, teams: 10, w: 15, l: 12, d: 0 }); assert.deepEqual(N.queue().map(x => x.key), ['qq-A', 'qq-B']); open(); const ra = await pa; assert.ok(ra.ok, 'A 받음 ' + JSON.stringify(ra));
  await N.flush(); assert.deepEqual(N.queue(), [], 'B도 보냄'); assert.deepEqual(sent(), ['qq-A', 'qq-B'], '차례대로');
  assert.equal((await N.me()).data.entry.tier, 2, '루키 1위 → 마이너 1위 → 1부(A 다음 B 순서)');
  /* 2) 순서: 밀린 A가 있으면 새 B는 그 뒤 */
  seen = []; mode = 'down'; const r1 = await N.result({ key: 'qq-C', rank: 10, teams: 10, w: 15, l: 12, d: 0 }); assert.equal(r1.queued, true); mode = '';
  const r2 = await N.result({ key: 'qq-D', rank: 1, teams: 10, w: 15, l: 12, d: 0 }); assert.ok(r2.ok, 'D 응답이 D의 것 ' + JSON.stringify(r2) + JSON.stringify(N.queue())); assert.deepEqual(sent().filter(k => k !== 'qq-C' || true), ['qq-C', 'qq-C', 'qq-D'], '밀린 C 먼저(첫 시도는 끊김)'); assert.equal(r2.data.tier, 2, '1부 10위 강등(마이너) → 마이너 1위 승격(1부)');
  /* 3) 401: 줄에 남고 authNeeded, 다시 로그인하면 보냄(예전: 성공으로 세고 버림) */
  mode = '401'; const r3 = await N.result({ key: 'qq-E', rank: 5, teams: 10, w: 15, l: 12, d: 0 }); assert.equal(r3.queued, true); assert.equal(N.authNeeded, true); assert.deepEqual(N.queue().map(x => x.key), ['qq-E']);
  N.authNeeded = false; await N.flush(); assert.deepEqual(N.queue(), [], '다시 보내면 들어감');
  /* 4) 429: 줄에 남기고 Retry-After(20초)까지 보내지 않음 */
  mode = '429'; seen = []; const r4 = await N.result({ key: 'qq-F', rank: 5, teams: 10, w: 15, l: 12, d: 0 }); assert.equal(r4.queued, true); assert.equal(N.waitUntil, t + 20000); mode = '';
  await N.flush(); assert.deepEqual(sent(), ['qq-F'], '기다리는 동안 다시 보내지 않음'); t += 21000; await N.flush(); assert.deepEqual(N.queue(), [], '시간이 지나면 보냄');
  /* 5) 토큰이 없으면(플레이어 만들기 실패) 줄에만 남고, 나중에 로그인하면 보냄 */
  N.forget(); N.enqueue({ key: 'qq-G', rank: 3, teams: 10, w: 15, l: 12, d: 0 }); const f5 = await N.flush(); assert.equal(f5.stop, 'auth'); assert.deepEqual(N.queue().map(x => x.key), ['qq-G'], '토큰만 버려도 줄은 남음');
  assert.equal((await N.ensurePlayer('새토큰')).status, 201); N.authNeeded = false; await N.flush(); assert.deepEqual(N.queue(), []);
  /* 6) 같은 key 두 번: 줄에도 한 번, 서버도 한 번만 센다 */
  N.enqueue({ key: 'qq-H', rank: 4, teams: 10, w: 15, l: 12, d: 0 }); N.enqueue({ key: 'qq-H', rank: 4, teams: 10, w: 15, l: 12, d: 0 }); assert.equal(N.queue().length, 1); await N.flush();
  const again = await N.call('POST', '/ladder/result', { key: 'qq-H', rank: 4, teams: 10, w: 15, l: 12, d: 0 }); assert.ok(again.ok && again.data.dup, '서버 dup ' + JSON.stringify(again.data)); assert.equal((await N.me()).data.entry.leagues, 2, '새 플레이어 리그 2(G·H)');
  /* 나누기 */
  assert.deepEqual([{ ok: true }, { status: 400 }, { status: 409 }, { status: 401 }, { status: 429 }, { status: 503 }, { offline: true }, { status: 0 }].map(netResultKind), ['ok', 'drop', 'drop', 'auth', 'wait', 'retry', 'retry', 'retry']);
});
/* 사용자 11-17 "화면도 새 서버로 바로 전환해": 예전 KV 래더 유저 옮기기 */
dbTest('KV에서 옮겨 오기: 첫 덱 시작 단계는 같은 세계 id의 KV 단계까지만, KV 기록이 없으면 루키, 두 번째부터는 보낸 단계 무시', async () => {
  const kv = new Map(); const { J, mk } = await setup({ kv }); const W1 = 'w' + '1'.repeat(16), W2 = 'w' + '2'.repeat(16), W3 = 'w' + '3'.repeat(16);
  for (const [w, t] of [[W1, 3], [W2, 1]]) assert.equal((await J('PUT', '/api/ladder/deck', { wid: w, tier: t, e: deck({ name: '옛' + t }) }))._s, 200);
  const a = await mk('옮김왕', '10.7.0.1'), b = await mk('부풀림', '10.7.0.2'), c = await mk('새내기', '10.7.0.3');
  assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '에이' }), tier: 3, wid: W1 }, a.A)).tier, 3, 'KV 단계 그대로');
  assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '비' }), tier: 4, wid: W2 }, b.A)).tier, 1, 'KV보다 높게 보내면 KV 단계까지');
  assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '씨' }), tier: 2, wid: W3 }, c.A)).tier, 0, 'KV 기록 없음 → 루키');
  assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '씨2' }), tier: 4, wid: W3 }, c.A)).tier, 0, '두 번째 등록은 단계를 안 바꿈');
});
dbTest('상대 채우기: D1 덱이 모자라면 같은 단계 KV 덱으로(pid 없음, kv 수), 이미 옮겨 온 세계 id와 나는 빼고, D1이 충분하면 KV를 안 씀', async () => {
  const kv = new Map(); const { J, mk } = await setup({ kv }); const w = i => 'w' + String(i).padStart(16, '0');
  for (let i = 1; i <= 6; i++) await J('PUT', '/api/ladder/deck', { wid: w(i), tier: 1, e: deck({ name: 'KV팀' + i, ovr: { t: 60 + i, p: 60, b: 60 } }) });
  await J('PUT', '/api/ladder/deck', { wid: w(9), tier: 2, e: deck({ name: '다른단계' }) });
  const me = await mk('나야나', '10.8.0.1'); await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: 'KV팀1', ovr: { t: 61, p: 60, b: 60 } }), tier: 1, wid: w(1) }, me.A); // 내 KV 덱(w1)을 옮김
  const mv = await mk('옮긴이', '10.8.0.2'); assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '새이름', ovr: { t: 62, p: 60, b: 60 } }), tier: 1, wid: w(2) }, mv.A)).tier, 1); // w2는 v1으로 옮겨 옴
  const o = await J('GET', '/api/v1/ladder/opponents?n=9', null, me.A); assert.equal(o._s, 200, JSON.stringify(o)); assert.equal(o.tier, 1);
  const names = o.decks.map(d => d.name).sort(); assert.deepEqual(names, ['KV팀3', 'KV팀4', 'KV팀5', 'KV팀6', '새이름'], '내 KV 덱·옮겨 온 KV 덱·다른 단계 빼기 ' + names);
  assert.equal(o.kv, 4); assert.ok(o.decks.filter(d => d.kv).every(d => d.pid === null && d.e.P.length === 24)); assert.equal(o.decks.find(d => d.name === '새이름').pid, mv.id);
  const r = await J('POST', '/api/v1/ladder/result', { key: 'kvmix-1', rank: 3, teams: 10, opps: [{ pid: mv.id, w: 2, l: 1 }] }, me.A); assert.equal(r._s, 200);
  for (let i = 0; i < 9; i++) { const p = await mk('찐유저' + i, '10.8.1.' + i); await J('PUT', '/api/ladder/deck', { wid: w(100 + i), tier: 1, e: deck({ name: 'D1팀' + i, ovr: { t: 60 + i, p: 60, b: 60 } }) }); await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: 'D1팀' + i, ovr: { t: 60 + i, p: 60, b: 60 } }), tier: 1, wid: w(100 + i) }, p.A); }
  const o2 = await J('GET', '/api/v1/ladder/opponents?n=9', null, me.A); assert.equal(o2.kv, 0, 'D1이 충분하면 KV 안 씀'); assert.equal(o2.decks.length, 9); assert.ok(o2.decks.every(d => d.pid));
});

/* ===== 래더 v2(사용자 11-17): 덱 구성 집계(메타)·전체 순위·관리자 내보내기 ===== */
test('래더 v2 스키마: migrations/0002_deck_meta.sql 문장이 worker/v1/ladder.js META_SQL과 같다', async () => {
  const { META_SQL } = await LD; const sql = fs.readFileSync(path.join(root, 'migrations/0002_deck_meta.sql'), 'utf8').split('\n').filter(l => !/^\s*--/.test(l)).join('\n').trim().replace(/;$/, '');
  assert.equal(sql, META_SQL);
});
dbTest('래더 v2 메타: 덱 등록 때 요약을 적고, 단계별·전체 집계(포지션 OVR·외국인·나이·성향·단계 평균)를 10분 캐시로 준다. 숨김·예전 덱(요약 없음)도 맞게', async () => {
  const { env, J, AK, mk } = await setup(); const sq = env.DB._sqlite;
  const P = []; for (let i = 0; i < 5; i++) P.push(await mk('메타' + i, '198.51.100.' + (i + 1)));
  for (let i = 0; i < 5; i++) { const e = deck({ name: '메타팀' + i, ovr: { t: 58 + i, p: 60, b: 60 } }); if (i === 2) e.P[0].foreign = 1; if (i === 3) e.P.forEach(p => { if (!p.isP) p.r.pow = 80; });
    assert.equal((await J('PUT', '/api/v1/ladder/deck', { e, tier: i < 3 ? 0 : 0 }, P[i].A))._s, 200); }
  assert.equal(sq.prepare('SELECT COUNT(*) AS n FROM deck_meta').get().n, 5, '덱마다 요약 한 줄');
  sq.prepare('DELETE FROM deck_meta WHERE player_id = ?').run(P[4].id); /* 예전 덱(요약 없음) → 요청 때 본문에서 채운다 */
  const m = await J('GET', '/api/v1/ladder/meta?tier=0'); assert.equal(m._s, 200, JSON.stringify(m)); assert.equal(m.n, 5); assert.equal(m.agg.n, 5);
  assert.equal(sq.prepare('SELECT COUNT(*) AS n FROM deck_meta').get().n, 5, '빠진 요약을 채움');
  assert.equal(m.agg.t.avg, 60); assert.ok(m.agg.pos.C.avg > 0 && m.agg.pos.SS.h.reduce((a, b) => a + b, 0) === 5, '포지션 분포'); assert.equal(m.agg.frDeck, 0.2); assert.equal(m.agg.age.reduce((a, b) => a + b, 0), 5 * 24);
  assert.equal(m.agg.arch.pow, 1, '거포형 1 ' + JSON.stringify(m.agg.arch)); assert.equal(m.tiers[0].n, 5); assert.equal(m.tiers[0].avg, 60);
  const all = await J('GET', '/api/v1/ladder/meta'); assert.equal(all.tier, 'all'); assert.equal(all.n, 5);
  assert.equal((await J('PUT', '/api/v1/admin/hide', { pid: P[0].id, hide: true }, AK))._s, 200);
  const m2 = await J('GET', '/api/v1/ladder/meta?tier=1'); assert.equal(m2.n, 0); assert.equal(m2.agg.n, 0, '빈 단계');
  /* 탈퇴하면 요약도 지운다 */
  assert.equal((await J('DELETE', '/api/v1/player', null, P[1].A))._s, 200); assert.equal(sq.prepare('SELECT COUNT(*) AS n FROM deck_meta WHERE player_id = ?').get(P[1].id).n, 0);
});
dbTest('래더 v2: 전체 순위(높은 단계 먼저)와 관리자 내보내기(덱·리그 결과 줄)', async () => {
  const { J, AK, mk } = await setup(); const a = await mk('전체일', '198.51.100.21'), b = await mk('전체이', '198.51.100.22');
  for (const [p, t] of [[a, 0], [b, 0]]) assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: t }, p.A))._s, 200);
  assert.equal((await J('POST', '/api/v1/ladder/result', { key: 'v2-a1', rank: 1, teams: 10, w: 20, l: 7 }, a.A)).tier, 1);
  assert.equal((await J('POST', '/api/v1/ladder/result', { key: 'v2-b1', rank: 5, teams: 10, w: 14, l: 13 }, b.A)).tier, 0);
  const all = await J('GET', '/api/v1/ladder/leaderboard?tier=all'); assert.equal(all.tier, 'all'); assert.deepEqual(all.rows.map(x => x.nickname), ['전체일', '전체이']); assert.equal(all.rows[0].tier, 1);
  assert.equal((await J('GET', '/api/v1/admin/export?kind=decks'))._s, 401);
  const d = await J('GET', '/api/v1/admin/export?kind=decks', null, AK); assert.equal(d.rows.length, 2); assert.ok(d.rows[0].meta && d.rows[0].meta.v === 1, '덱 요약');
  const r = await J('GET', '/api/v1/admin/export?kind=results', null, AK); assert.equal(r.rows.length, 2); assert.ok(r.rows.every(x => x.nickname && x.lkey));
});
dbTest('래더 연봉 상한 없음(구단주 11-18 "래더는 일단 상한을 두지 말고 자유롭게"): 비싼 덱·연봉 기록 없는 덱·합이 안 맞는 덱도 받고, 상대 목록에도 나온다. 능력치 범위·편집 표시는 그대로 거절', async () => {
  const { J, mk, env, clock } = await setup(); const C = await import(path.join(root, 'src/core/uladder.mjs'));
  assert.equal(C.UL_CAP_ON, false); assert.ok(C.ulCapGate({ P: [] }, 4, Date.now()).ok, '공용 규칙도 언제나 통과');
  const a = await mk('상한일', '10.1.0.1'), b = await mk('상한이', '10.1.0.2'), c = await mk('상한삼', '10.1.0.3'), d = await mk('상한사', '10.1.0.4');
  const pricey = o => { const e = deck(o); for (const p of e.P) p.sal = 700; return e; }; /* 700 × 24 = 168억: 예전 상한(143.97억)을 넘는다 */
  let j = await J('PUT', '/api/v1/ladder/deck', { e: pricey({ name: '넘침' }), tier: 0 }, a.A); assert.equal(j._s, 200, JSON.stringify(j)); assert.equal(j.cap_ok, true); assert.equal(j.pay_x, null);
  const nosal = deck({ name: '예전' }); delete nosal.P[3].sal; j = await J('PUT', '/api/v1/ladder/deck', { e: nosal, tier: 0 }, b.A); assert.equal(j._s, 200, '연봉 기록이 빠져도 받음(no_pay 없음)');
  const fake = deck({ name: '합틀림' }); fake.P[0].sal = 9000; fake.pay = 100; j = await J('PUT', '/api/v1/ladder/deck', { e: fake, tier: 0 }, c.A); assert.equal(j._s, 200, '연봉 합 불일치(bad_pay)도 래더에서는 받음');
  { const w = console.warn; console.warn = () => {}; try { const bad = deck({ name: '범위밖' }); bad.P[0].r.con = 95; assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: bad, tier: 0 }, d.A)).error, 'bad_rating', '능력치 20~80 밖은 그대로 거절');
    assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck(), tier: 0, edited: true }, d.A)).error, 'edited', '편집 표시는 그대로 거절'); } finally { console.warn = w; } }
  assert.equal((await J('PUT', '/api/v1/ladder/deck', { e: deck({ name: '나' }), tier: 0 }, d.A))._s, 200);
  let o = await J('GET', '/api/v1/ladder/opponents?n=9', null, d.A); let names = o.decks.map(x => x.name);
  assert.ok(['넘침', '예전', '합틀림'].every(n => names.includes(n)), '모든 덱이 상대로 나옴 ' + names);
  clock.now = C.UL_CAP_FROM + 1000; o = await J('GET', '/api/v1/ladder/opponents?tier=0&n=9', null, d.A); names = o.decks.map(x => x.name);
  assert.ok(names.includes('예전'), '예전 유예 기간이 끝나도 연봉 기록 없는 덱이 나옴 ' + names);
});
