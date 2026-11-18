/* Direct registration receipt, manual daily quota, and OFF/PUT interleavings through actual Worker + SQLite D1. */
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

dbTest('manual registration ACK includes authoritative request day and GET preserves receipt', async()=>{
  const {J,mk,clock}=await setup(),a=await mk('직접영수증');clock.now=Date.UTC(2026,10,18,14,59,59);const at=clock.now;
  const r=await J('PUT','/api/v1/ladder/deck',{e:deck(),man:1},a.A);assert.equal(r._s,200);assert.equal(r.at,at);assert.equal(r.man_day,'2026-11-18');
  const me=await J('GET','/api/v1/ladder/me',null,a.A);assert.equal(me._s,200);assert.equal(me.reg.man_day,r.man_day);assert.equal(me.deck.at,at);assert.equal(me.deck.h,r.h);
  assert.equal((await J('PUT','/api/v1/ladder/deck',{e:deck(),man:1},a.A))._s,200,'crossing midnight makes next server day available');
  assert.equal((await J('PUT','/api/v1/ladder/deck',{e:deck(),man:1},a.A))._s,429,'same new day still consumes quota once');
});
for(const kind of [{man:1},{auto:1},{}]) dbTest('OFF rejects all PUT kinds '+JSON.stringify(kind),async()=>{
  const {J,mk,sql}=await setup(),a=await mk('꺼진등록');await J('PUT','/api/v1/ladder/deck',{e:deck(),auto:1},a.A);await J('PUT','/api/v1/ladder/auto',{on:false},a.A);
  const r=await J('PUT','/api/v1/ladder/deck',{e:deck(),...kind},a.A);assert.equal(r._s,409);assert.equal(r.error,'auto_off');assert.equal(sql('SELECT COUNT(*) n FROM decks')[0].n,0);assert.equal(sql('SELECT COUNT(*) n FROM deck_meta')[0].n,0);
});
for(const kind of [{man:1},{auto:1},{}]) dbTest('OFF between precheck and atomic PUT batch stays closed '+JSON.stringify(kind),async()=>{
  const {J,mk,sql,DB}=await setup(),a=await mk('늦은등록');await J('PUT','/api/v1/ladder/deck',{e:deck(),auto:1},a.A);
  const realBatch=DB.batch;let interleaved=false;DB.batch=async L=>{if(!interleaved&&L.some(s=>/INSERT INTO decks/.test(s._sql))){interleaved=true;const stop=await J('PUT','/api/v1/ladder/auto',{on:false},a.A);assert.equal(stop._s,200);}return realBatch(L);};
  const r=await J('PUT','/api/v1/ladder/deck',{e:deck({name:'지연 덱'}),wid:'w1234567890abcdef',...kind},a.A);DB.batch=realBatch;
  assert.ok(interleaved,'actual endpoint OFF committed after regCheck and before PUT batch');assert.equal(r._s,409);assert.equal(r.error,'auto_off');assert.equal(sql('SELECT off FROM ladder_reg WHERE player_id=?',a.id)[0].off,1);assert.equal(sql('SELECT COUNT(*) n FROM decks')[0].n,0);assert.equal(sql('SELECT COUNT(*) n FROM deck_meta')[0].n,0);assert.notEqual(sql('SELECT wid FROM players WHERE id=?',a.id)[0].wid,'w1234567890abcdef');
});
dbTest('OFF after deck batch cannot resurrect late deck metadata',async()=>{
  const {J,mk,sql,DB}=await setup(),a=await mk('늦은요약');await J('PUT','/api/v1/ladder/deck',{e:deck(),auto:1},a.A);
  const realBatch=DB.batch;let interleaved=false;DB.batch=async L=>{const result=await realBatch(L);if(!interleaved&&L.some(s=>/INSERT INTO decks/.test(s._sql))){interleaved=true;assert.equal((await J('PUT','/api/v1/ladder/auto',{on:false},a.A))._s,200);}return result;};
  await J('PUT','/api/v1/ladder/deck',{e:deck({name:'요약 지연'}),auto:1},a.A);DB.batch=realBatch;assert.ok(interleaved);assert.equal(sql('SELECT COUNT(*) n FROM decks')[0].n,0);assert.equal(sql('SELECT COUNT(*) n FROM deck_meta')[0].n,0);
});
