/* 클라우드 저장(worker/v1/cloud.js) 단위 점검: 가짜 D1(node:sqlite)과 가짜 R2(Map)로
   R2 없을 때 503 · 조건부 쓰기(If-Match 필수·409·덮지 않음) · 최근 3판 · 슬롯 3개 · 하루 상한 · 기기 연결 코드(10분·한 번) · 복구 코드(해시만·한 번) · 기기 목록·끊기 · DELETE /player가 R2까지 지움 · 스키마 파일 같음 */
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const root = path.resolve(__dirname, '../..');
const { makeD1, hasSqlite } = require('../lib/d1-shim.cjs');
const W = import(path.join(root, 'worker/index.js')), V = import(path.join(root, 'worker/v1/index.js')), RL = import(path.join(root, 'worker/v1/ratelimit.js')),
  SE = import(path.join(root, 'worker/v1/season.js')), US = import(path.join(root, 'worker/v1/usage.js')), LD = import(path.join(root, 'worker/v1/ladder.js')), CL = import(path.join(root, 'worker/v1/cloud.js'));
const ORIGIN = 'https://fronttime.example.workers.dev', MIN = 86400e3 / 1440;
function fakeR2() {
  const m = new Map(); let fail = false;
  return { m, failNext() { fail = true; },
    async put(k, v, o = {}) { if (fail) { fail = false; throw new Error('r2 down'); } const b = v instanceof Uint8Array ? v : new Uint8Array(await new Response(v).arrayBuffer()); m.set(k, { b: Buffer.from(b), meta: o.customMetadata || {} }); return { key: k }; },
    async get(k) { const e = m.get(k); if (!e) return null; return { key: k, body: new Response(e.b).body, customMetadata: e.meta, async arrayBuffer() { return e.b.buffer.slice(e.b.byteOffset, e.b.byteOffset + e.b.byteLength); } }; },
    async delete(k) { for (const x of [].concat(k)) m.delete(x); },
    async list({ prefix = '', cursor } = {}) { const all = [...m.keys()].filter(k => k.startsWith(prefix)).sort(), i = cursor ? +cursor : 0, page = all.slice(i, i + 2); return { objects: page.map(key => ({ key })), truncated: i + 2 < all.length, cursor: String(i + 2) }; } };
}
const body = (n, fill = 7) => { const u = new Uint8Array(n); u.set([0x46, 0x54, 0x53, 0x31]); u.fill(fill, 4); return u; };
async function setup(o = {}) {
  const { handle } = await W; (await V)._v1Reset(); (await RL)._resetRL(); (await SE)._resetSeason(); (await US)._resetUsage(); (await LD)._metaReset(); (await LD)._genReset();
  const DB = makeD1(), R2 = o.noR2 ? undefined : fakeR2(), env = { DB, SAVES: R2, CUP_ADMIN: 's3cret' }, clock = { now: o.now || Date.UTC(2026, 10, 20, 3) };
  const H = async (m, p, b, h = {}) => { const r = await handle(new Request(ORIGIN + p, { method: m, body: b == null ? undefined : b instanceof Uint8Array || typeof b === 'string' ? b : JSON.stringify(b), headers: Object.assign({ Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.7' }, h) }), env, clock.now); clock.now += 1000; return r; };
  const J = async (...a) => { const r = await H(...a); let j = {}; try { j = await r.json(); } catch (e) {} return Object.assign({ _s: r.status }, j); };
  assert.equal((await J('POST', '/api/v1/admin/migrate', null, { Authorization: 'Bearer s3cret' }))._s, 200);
  const mk = async (nick, ip) => { const j = await J('POST', '/api/v1/player', { nickname: nick, platform: 'web' }, ip ? { 'CF-Connecting-IP': ip } : {}); assert.equal(j._s, 201, JSON.stringify(j)); return { id: j.player.id, A: { Authorization: 'Bearer ' + j.token } }; };
  const put = (who, slot, b, rev, extra = {}) => J('PUT', '/api/v1/saves/' + slot, b, Object.assign({ 'Content-Type': 'application/octet-stream' }, rev ? { 'If-Match': `"${rev}"` } : { 'If-None-Match': '*' }, who.A, extra));
  return { env, R2, H, J, mk, put, clock };
}
const dbTest = (name, fn) => test(name, { skip: hasSqlite ? false : 'node:sqlite 없음(노드 22.5 이상 필요)' }, fn);
const W1 = 'w0123456789abcdef', W2 = 'w1111111111111111';

test('스키마: migrations/0003_cloud_saves.sql과 worker/v1/cloud.js CLOUD_SQL이 같다', async () => {
  const { CLOUD_SQL, cloudStatements } = await CL;
  assert.equal(CLOUD_SQL, fs.readFileSync(path.join(root, 'migrations/0003_cloud_saves.sql'), 'utf8'));
  assert.equal(cloudStatements().length, 6); assert.ok(cloudStatements().every(s => /^CREATE (TABLE|INDEX) IF NOT EXISTS/.test(s)));
  const wr = fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8'); assert.match(wr, /\/\/\s*"r2_buckets": \[\{ "binding": "SAVES", "bucket_name": "fronttime-saves" \}\]/, 'R2 바인딩은 주석으로(버킷을 만들기 전 배포가 깨지지 않게)');
});
test('코드: 글자표·길이·정리', async () => {
  const { newCode, normCode, ALPHABET } = await CL;
  for (let i = 0; i < 50; i++) { const c = newCode(8); assert.equal(c.length, 8); assert.ok([...c].every(x => ALPHABET.includes(x))); }
  assert.equal(newCode(24).length, 24); assert.equal(normCode('abcd-ef23', 8), 'ABCDEF23'); assert.equal(normCode('ABCD EF2O', 8), ''); assert.equal(normCode('ABC', 8), '');
});
dbTest('R2(SAVES)가 없으면 클라우드 API는 모두 503 not_configured, 다른 v1은 그대로', async () => {
  const { J, mk, put } = await setup({ noR2: true }); const a = await mk('클라우드');
  assert.equal((await J('GET', '/api/v1/cloud')).error, 'not_configured');
  for (const [m, p] of [['GET', '/api/v1/saves'], ['GET', '/api/v1/saves/' + W1], ['POST', '/api/v1/player/link-code'], ['POST', '/api/v1/player/recovery'], ['GET', '/api/v1/player/devices']]) { const j = await J(m, p, null, a.A); assert.equal(j._s, 503, p); assert.equal(j.error, 'not_configured'); }
  assert.equal((await put(a, W1, body(100))).error, 'not_configured');
  assert.equal((await J('POST', '/api/v1/player/link-code/redeem', { code: 'ABCDEFGH' }))._s, 503);
  assert.equal((await J('GET', '/api/v1/player/me', null, a.A))._s, 200); assert.equal((await J('GET', '/api/v1/health'))._s, 200);
});
dbTest('올리기·받기: If-Match 필수(428)·409 충돌은 덮지 않음·형식 검사·최근 3판만', async () => {
  const { J, H, mk, put, R2, clock } = await setup(); const a = await mk('클라우드');
  assert.equal((await J('GET', '/api/v1/cloud'))._s, 200);
  assert.equal((await J('GET', '/api/v1/saves'))._s, 401, '토큰 필요');
  assert.equal((await J('PUT', '/api/v1/saves/' + W1, body(100), a.A))._s, 428, 'If-Match 없으면 받지 않음');
  assert.equal((await put(a, W1, new Uint8Array(100).fill(1))).error, 'bad_format'); assert.equal((await put(a, 'Bad/Slot', body(100)))._s, 404); assert.equal((await put(a, 'BAD', body(100))).error, 'bad_slot');
  const r1 = await put(a, W1, body(100, 1), 0, { 'X-Save-Day': '120', 'X-Save-Wid': W1, 'X-Save-Date': encodeURIComponent('2027년 1월 10일'), 'X-Save-Team': encodeURIComponent('서울 와이번스'), 'X-Save-At': '1700000000000', 'X-Save-Ver': '11.18a' });
  assert.equal(r1._s, 200, JSON.stringify(r1)); assert.equal(r1.rev, 1);
  assert.equal((await put(a, W1, body(100, 2))).error, 'conflict', '새 슬롯 요청(If-None-Match: *)인데 이미 있음');
  const c = await put(a, W1, body(100, 3), 5); assert.equal(c._s, 409); assert.equal(c.current.rev, 1); assert.equal(c.current.day, 120); assert.equal(c.current.date, '2027년 1월 10일'); assert.equal(c.current.team, '서울 와이번스');
  clock.now += 61e3; for (let r = 1; r <= 4; r++) assert.equal((await put(a, W1, body(100, 10 + r), r)).rev, r + 1);
  assert.deepEqual([...R2.m.keys()].sort(), [3, 4, 5].map(r => `saves/${a.id}/${W1}/${r}.bin`), '최근 3판만 남김');
  const l = await J('GET', '/api/v1/saves', null, a.A); assert.equal(l.slots.length, 1); assert.equal(l.slots[0].rev, 5); assert.equal(l.slots[0].bytes, 100); assert.equal(l.daily.used, 5); assert.equal(l.max_slots, 3);
  assert.equal(l.slots[0].day, null, '머리글 없이 올린 판은 날짜 없음');
  const g = await H('GET', '/api/v1/saves/' + W1, null, a.A); assert.equal(g.status, 200); assert.equal(g.headers.get('ETag'), '"5"'); const gb = new Uint8Array(await g.arrayBuffer()); assert.equal(gb[5], 14, '마지막 판 본문');
  const g3 = await H('GET', '/api/v1/saves/' + W1 + '?rev=3', null, a.A); assert.equal(g3.status, 200); assert.equal(new Uint8Array(await g3.arrayBuffer())[5], 12, '이전 판 받기');
  assert.equal((await H('GET', '/api/v1/saves/' + W1 + '?rev=2', null, a.A)).status, 404, '지운 판');
  const b = await mk('다른사람', '10.9.9.9'); assert.equal((await J('GET', '/api/v1/saves', null, b.A)).slots.length, 0, '남의 저장은 보이지 않음'); assert.equal((await H('GET', '/api/v1/saves/' + W1, null, b.A)).status, 404);
  assert.equal((await put(b, W1, body(100))).rev, 1, '같은 슬롯 이름이라도 플레이어마다 따로');
});
dbTest('R2 쓰기 실패: 판번호를 올리지 않고 차지를 풀어 다시 올릴 수 있다', async () => {
  const { mk, put, R2, J } = await setup(); const a = await mk('클라우드');
  assert.equal((await put(a, W1, body(80), 0))._s, 200); R2.failNext();
  assert.equal((await put(a, W1, body(80), 1))._s, 500); const l = await J('GET', '/api/v1/saves', null, a.A); assert.equal(l.slots[0].rev, 1);
  assert.equal((await put(a, W1, body(80), 1)).rev, 2, '차지가 풀림');
  R2.failNext(); assert.equal((await put(a, W2, body(80)))._s, 500); assert.equal((await J('GET', '/api/v1/saves', null, a.A)).slots.length, 1, '실패한 새 슬롯은 목록에 없음');
  assert.equal((await put(a, W2, body(80))).rev, 1);
});
dbTest('슬롯 3개·하루 200번·분당 6번', async () => {
  const { mk, put, clock, J } = await setup(); const a = await mk('클라우드');
  for (const s of ['s1', 's2', 's3']) { assert.equal((await put(a, s, body(70)))._s, 200); clock.now += 20e3; }
  const x = await put(a, 's4', body(70)); assert.equal(x._s, 403); assert.equal(x.error, 'slot_limit');
  assert.equal((await J('DELETE', '/api/v1/saves/s3', null, a.A))._s, 428, '지우기도 If-Match 필요');
  assert.equal((await J('DELETE', '/api/v1/saves/s3', null, Object.assign({ 'If-Match': '"9"' }, a.A)))._s, 409);
  assert.equal((await J('DELETE', '/api/v1/saves/s3', null, Object.assign({ 'If-Match': '"1"' }, a.A)))._s, 200); clock.now += 20e3;
  assert.equal((await put(a, 's4', body(70)))._s, 200, '지운 뒤에는 새 슬롯');
  clock.now = Math.ceil(clock.now / 60e3) * 60e3 + 1; let rv = 1; const codes = [];
  for (let i = 0; i < 7; i++) { const x = await put(a, 's1', body(70), rv); codes.push(x._s); if (x._s === 200) rv = x.rev; }
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 200, 429], '분당 6번');
  const b = await mk('많이올림', '10.8.8.8'); let r = 0, res;
  for (let i = 0; i < 205; i++) { clock.now += 11e3; res = await put(b, 'w', body(70), r || 0); if (res._s !== 200) break; r = res.rev; }
  assert.equal(r, 200); assert.equal(res._s, 429); assert.equal(res.error, 'daily_limit');
  clock.now += 86400e3; assert.equal((await put(b, 'w', body(70), r))._s, 200, '다음 날');
});
dbTest('기기 연결 코드: 10분·한 번·같은 플레이어 새 토큰·목록에 같은 슬롯·기기 목록·끊기', async () => {
  const { J, mk, put, clock } = await setup(); const a = await mk('첫기기');
  assert.equal((await J('PUT', '/api/v1/player/devices/me', { name: 'Windows · Chrome' }, a.A)).name, 'Windows · Chrome');
  assert.equal((await put(a, W1, body(90), 0, { 'X-Save-Day': '30' }))._s, 200);
  const lc = await J('POST', '/api/v1/player/link-code', null, a.A); assert.equal(lc._s, 201); assert.match(lc.code, /^[A-HJKMNP-Z2-9]{8}$/); assert.equal(lc.expiresAt - clock.now, 600e3 - 1000);
  assert.equal((await J('POST', '/api/v1/player/link-code/redeem', { code: 'ZZZZZZZZ' }))._s, 404);
  assert.equal((await J('POST', '/api/v1/player/link-code/redeem', { code: 'abc' })).error, 'bad_code');
  const rd = await J('POST', '/api/v1/player/link-code/redeem', { code: lc.code.slice(0, 4).toLowerCase() + '-' + lc.code.slice(4), platform: 'android', name: '휴대폰 · Chrome' }, { 'CF-Connecting-IP': '10.5.5.5' });
  assert.equal(rd._s, 200, JSON.stringify(rd)); assert.equal(rd.player.id, a.id); assert.match(rd.token, /^ft1\.[0-9a-f]{32}$/);
  assert.equal((await J('POST', '/api/v1/player/link-code/redeem', { code: lc.code }))._s, 404, '한 번만');
  const B = { Authorization: 'Bearer ' + rd.token }; const l = await J('GET', '/api/v1/saves', null, B); assert.deepEqual(l.slots.map(s => [s.slot, s.rev, s.day]), [[W1, 1, 30]], '새 기기에서 같은 슬롯');
  const r2 = await put({ A: B }, W1, body(90), 1); assert.equal(r2.rev, 2); assert.equal((await J('GET', '/api/v1/saves', null, a.A)).slots[0].device_name, '휴대폰 · Chrome');
  assert.equal((await put(a, W1, body(90), 1))._s, 409, '첫 기기가 옛 판으로 올리면 충돌');
  const lc2 = await J('POST', '/api/v1/player/link-code', null, a.A); clock.now += 601e3;
  assert.equal((await J('POST', '/api/v1/player/link-code/redeem', { code: lc2.code }))._s, 404, '10분 지나면 무효');
  const dv = await J('GET', '/api/v1/player/devices', null, a.A); assert.equal(dv.devices.length, 2); assert.equal(dv.devices.filter(d => d.current).length, 1);
  const other = dv.devices.find(d => !d.current); assert.match(other.id, /^d[0-9a-f]{16}$/); assert.equal(other.name, '휴대폰 · Chrome'); assert.equal(other.platform, 'android');
  const o2 = await mk('남의기기', '10.4.4.4'); assert.equal((await J('DELETE', '/api/v1/player/devices/' + other.id, null, o2.A))._s, 404, '남의 기기는 못 끊음');
  assert.equal((await J('DELETE', '/api/v1/player/devices/' + other.id, null, a.A))._s, 200);
  assert.equal((await J('GET', '/api/v1/saves', null, B))._s, 401, '끊긴 토큰은 바로 401');
  let last; for (let i = 0; i < 11; i++) last = await J('POST', '/api/v1/player/link-code/redeem', { code: 'ZZZZZZZZ' }, { 'CF-Connecting-IP': '10.6.6.6' }); assert.equal(last._s, 429, 'IP당 시간당 10번');
});
dbTest('복구 코드: 한 번만 보여 주고 해시만 저장·새로 만들면 예전 것 무효·쓰면 무효', async () => {
  const { J, mk, env } = await setup(); const a = await mk('복구');
  assert.equal((await J('GET', '/api/v1/player/recovery', null, a.A)).has, false);
  const r1 = await J('POST', '/api/v1/player/recovery', null, a.A); assert.equal(r1._s, 201); assert.match(r1.code, /^[A-HJKMNP-Z2-9]{24}$/);
  const g = await J('GET', '/api/v1/player/recovery', null, a.A); assert.equal(g.has, true); assert.equal(g.code, undefined, '다시 보여 주지 않음');
  const rows = env.DB._sqlite.prepare('SELECT * FROM cloud_codes').all(); assert.ok(rows.length === 1 && !JSON.stringify(rows).includes(r1.code), '서버에는 해시만');
  const r2 = await J('POST', '/api/v1/player/recovery', null, a.A);
  assert.equal((await J('POST', '/api/v1/player/recovery/redeem', { code: r1.code }))._s, 404, '예전 복구 코드 무효');
  const rd = await J('POST', '/api/v1/player/recovery/redeem', { code: r2.code.match(/.{4}/g).join('-'), name: '새 PC' }); assert.equal(rd._s, 200); assert.equal(rd.player.id, a.id); assert.equal(rd.via, 'recovery');
  assert.equal((await J('POST', '/api/v1/player/recovery/redeem', { code: r2.code }))._s, 404, '쓰면 무효');
  assert.equal((await J('POST', '/api/v1/player/link-code/redeem', { code: r2.code.slice(0, 8) }))._s, 404, '연결 코드와 섞이지 않음');
});
dbTest('DELETE /player·관리자 삭제는 R2 본문까지 지우고, 관리자 현황에는 숫자만', async () => {
  const { J, mk, put, R2 } = await setup(); const a = await mk('지우기'), b = await mk('남기기', '10.7.7.7');
  for (const s of ['s1', 's2']) { await put(a, s, body(70)); await put(a, s, body(70), 1); }
  await put(b, 's1', body(70)); assert.equal(R2.m.size, 5);
  const st = await J('GET', '/api/v1/admin/stats', null, { Authorization: 'Bearer s3cret' }); assert.deepEqual([st.cloud.slots, st.cloud.players, st.cloud.bytes], [3, 2, 210]); assert.ok(!JSON.stringify(st).includes('saves/'));
  assert.equal((await J('DELETE', '/api/v1/player', null, a.A))._s, 200);
  assert.deepEqual([...R2.m.keys()], [`saves/${b.id}/s1/1.bin`], '내 R2 판만 지움(여러 장 목록도 끝까지)');
  assert.equal((await J('DELETE', '/api/v1/admin/player/' + b.id, null, { Authorization: 'Bearer s3cret' }))._s, 200); assert.equal(R2.m.size, 0);
});
dbTest('표가 없어도(0003을 안 돌린 서버) 처음 요청 때 만든다', async () => {
  const { J, mk, put, env } = await setup(); env.DB._sqlite.exec('DROP TABLE cloud_saves; DROP TABLE cloud_usage; DROP TABLE cloud_codes; DROP TABLE cloud_devices;'); (await CL)._cloudReset();
  const a = await mk('늦은표'); assert.equal((await put(a, W1, body(70)))._s, 200); assert.equal((await J('GET', '/api/v1/saves', null, a.A)).slots.length, 1);
});
