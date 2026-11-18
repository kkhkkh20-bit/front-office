/* 검수 1019~1020: 실제 Worker + SQLite D1. 종료·재시도·역순 보고·단계·구형 호환을 확인합니다. */
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const root = path.resolve(__dirname, '../..');
const { makeD1, hasSqlite } = require('../lib/d1-shim.cjs');
const W = import(path.join(root, 'worker/index.js')), V = import(path.join(root, 'worker/v1/index.js')), RL = import(path.join(root, 'worker/v1/ratelimit.js')),
  SE = import(path.join(root, 'worker/v1/season.js')), US = import(path.join(root, 'worker/v1/usage.js')), LD = import(path.join(root, 'worker/v1/ladder.js')), RC = import(path.join(root, 'worker/v1/records.js')), LA = import(path.join(root, 'worker/v1/ladauto.js'));
const ORIGIN = 'https://fronttime.example.workers.dev';
const dbTest = (name, fn) => test(name, { skip: hasSqlite ? false : 'node:sqlite 없음(노드 22.5 이상 필요)' }, fn);
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

const report=(a,key,more={})=>({key,tier:0,round:9,post:1,stage:'semi-ready',postDone:0,postTotal:3,revision:100,opened:Date.UTC(2026,10,20,3),teams:[['우리',a.id,'me'],['상대',null,'ai']],st:[['우리',1,0,0,'me']],...more});
test('1019~1020 additive schema matches migration; original migration stays immutable',async()=>{const {LIVE_SQL,AUTO_SQL}=await LA;assert.equal(LIVE_SQL,fs.readFileSync(path.join(root,'migrations/0006_ladder_live.sql'),'utf8'));assert.equal(AUTO_SQL,fs.readFileSync(path.join(root,'migrations/0005_ladder_auto.sql'),'utf8'));});
dbTest('1019 authenticated exact-key close is idempotent, preserves other leagues and completed records, and rejects late resurrection',async()=>{
 const {J,mk,AK,sql,clock}=await setup(),a=await mk('종료 점검'),b=await mk('다른 구단');
 assert.equal((await J('POST','/api/v1/ladder/live',report(a,'world.old'),a.A))._s,200);
 assert.equal((await J('POST','/api/v1/ladder/live',report(b,'world.old'),b.A))._s,200);
 assert.equal((await J('POST','/api/v1/ladder/live',{key:'world.old',ended:1},a.A))._s,200);
 assert.equal((await J('POST','/api/v1/ladder/live',report(a,'world.old',{revision:200}),a.A))._s,200);
 assert.equal((await J('GET','/api/v1/admin/league?live='+a.id,null,AK))._s,404);
 assert.equal((await J('GET','/api/v1/admin/league?live='+b.id,null,AK))._s,200,'different authenticated player is untouched');
 const newer=report(a,'world.new',{opened:clock.now,revision:300});await J('POST','/api/v1/ladder/live',newer,a.A);
 await J('POST','/api/v1/ladder/live',{key:'world.old',ended:1},a.A);
 assert.equal((await J('GET','/api/v1/admin/league?live='+a.id,null,AK)).league.key,'world.new');
 assert.equal((await J('POST','/api/v1/ladder/result',{key:'world.old',rank:3,teams:10,w:15,l:12,d:0,opps:[]},a.A))._s,200);
 assert.equal((await J('GET','/api/v1/admin/league?live='+a.id,null,AK)).league.key,'world.new','late old result cannot clear new current league');
 assert.equal(sql('SELECT COUNT(*) n FROM ladder_leagues WHERE player_id=?',a.id)[0].n,1);
 assert.equal((await J('POST','/api/v1/ladder/live',{key:'world.new',ended:1}))._s,401,'close requires authentication');
});
dbTest('1019 opt-out suppresses in-flight active reports but does not permanently close continued local league',async()=>{
 const {J,mk,AK}=await setup(),a=await mk('일시 중단'),b=report(a,'world.continues');await J('POST','/api/v1/ladder/live',b,a.A);
 await J('PUT','/api/v1/ladder/auto',{on:false},a.A);
 const late=await J('POST','/api/v1/ladder/live',{...b,revision:101},a.A);assert.equal(late._s,409);assert.equal(late.error,'auto_off');
 assert.equal((await J('GET','/api/v1/admin/league?live='+a.id,null,AK))._s,404);
 await J('PUT','/api/v1/ladder/auto',{on:true},a.A);await J('POST','/api/v1/ladder/live',{...b,revision:102},a.A);
 assert.equal((await J('GET','/api/v1/admin/league?live='+a.id,null,AK))._s,200);
 await J('PUT','/api/v1/ladder/auto',{on:false},a.A);assert.equal((await J('POST','/api/v1/ladder/live',{key:b.key,ended:1},a.A))._s,200,'terminal is allowed while off');
});
dbTest('1020 dashboard and detail distinguish each completed series; delayed lower revision/progress cannot regress stage',async()=>{
 const {J,mk,AK,clock}=await setup(),a=await mk('단계 점검'),stages=['semi-ready','semi-one-done','final-ready','complete'];
 for(let done=0;done<4;done++){ const body=report(a,'world.stages',{stage:stages[done],postDone:done,revision:100+done});assert.equal((await J('POST','/api/v1/ladder/live',body,a.A))._s,200);
 const D=await J('GET','/api/v1/admin/dash',null,AK),L=await J('GET','/api/v1/admin/league?live='+a.id,null,AK);assert.deepEqual([D.live[0].stage,D.live[0].postDone,D.live[0].postTotal],[stages[done],done,3]);assert.equal(L.league.stage,stages[done]); }
 await J('POST','/api/v1/ladder/live',report(a,'world.stages',{revision:999}),a.A);assert.equal((await J('GET','/api/v1/admin/league?live='+a.id,null,AK)).league.stage,'complete','even later request cannot reduce finished progress');
 const newer=report(a,'world.new-stage',{opened:clock.now,revision:1000});await J('POST','/api/v1/ladder/live',newer,a.A);await J('POST','/api/v1/ladder/live',report(a,'world.stages',{stage:'complete',postDone:3,revision:999}),a.A);
 assert.equal((await J('GET','/api/v1/admin/league?live='+a.id,null,AK)).league.key,newer.key,'delayed earlier revision cannot replace newer request');
 await J('POST','/api/v1/ladder/live',report(a,'world.stages',{stage:'complete',postDone:3,revision:1001}),a.A);assert.equal((await J('GET','/api/v1/admin/league?live='+a.id,null,AK)).league.key,'world.stages','intentional later resume of older save is accepted');
});
dbTest('1020 legacy reports remain accepted with unknown stage; malformed claimed stage is rejected',async()=>{
 const {J,mk,AK}=await setup(),a=await mk('예전 보고'),body=report(a,'legacy.report');delete body.stage;delete body.postDone;delete body.postTotal;delete body.revision;delete body.opened;
 assert.equal((await J('POST','/api/v1/ladder/live',body,a.A))._s,200);const L=await J('GET','/api/v1/admin/league?live='+a.id,null,AK);assert.equal(L.league.stage,null);assert.equal(L.league.postDone,null);
 for(const bad of [{stage:'final-ready',postDone:0},{stage:'future-secret',postDone:2},{postDone:4},{postTotal:999},{revision:-1},{opened:Number.MAX_SAFE_INTEGER}])assert.equal((await J('POST','/api/v1/ladder/live',report(a,'bad.report',bad),a.A))._s,400);
});
