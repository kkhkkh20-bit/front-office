/* 기기 옮기기 Worker(worker/index.js) 단위 점검: 가짜 KV(만료 시간이 있는 Map)로 올리기·한 번만 받기·만료·크기·횟수 제한·설정 전 상태를 본다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const W=import(path.join(root,'worker/index.js'));
const LZ=(()=>{const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'vendor/lz-string.min.js'),'utf8')+';this.L=LZString',c);return c.L;})();
function fakeKV(clock){ const m=new Map(), ops={get:0,put:0,del:0};
 const live=k=>{ const e=m.get(k); if(e&&e.exp&&e.exp<=clock.now){ m.delete(k); return null; } return e||null; };
 return { m, ops,
  async get(k){ ops.get++; const e=live(k); return e?e.v:null; },
  async getWithMetadata(k){ ops.get++; const e=live(k); return {value:e?e.v:null,metadata:e?e.meta:null}; },
  async put(k,v,o={}){ ops.put++; if(o.expirationTtl!=null&&o.expirationTtl<60)throw Error('KV 최소 TTL 60초'); m.set(k,{v:String(v),meta:o.metadata||null,exp:o.expirationTtl?clock.now+o.expirationTtl*1000:0}); },
  async delete(k){ ops.del++; m.delete(k); } }; }
const ORIGIN='https://fronttime.example.workers.dev';
const req=(method,p,body,h={})=>new Request(ORIGIN+p,{method,body,headers:Object.assign({'CF-Connecting-IP':'203.0.113.7','Origin':ORIGIN},h)});
const save=(n=3000)=>LZ.compressToBase64(JSON.stringify({ver:4,year:2027,day:10,user:3,teams:[{id:0}],players:{1:{n:'가'.repeat(n)}},cal:{},sea:{rec:[]}}));

test('올린 저장은 8자리 코드로 한 번만 받을 수 있다',async()=>{
 const {handle,ALPHABET,normCode}=await W; const clock={now:Date.UTC(2026,10,16)}; const env={SAVE_KV:fakeKV(clock)}; const body=save();
 const up=await handle(req('POST','/api/transfer',body),env,clock.now); assert.equal(up.status,201); const j=await up.json();
 assert.match(j.code,new RegExp(`^[${ALPHABET}]{8}$`)); assert.ok(!/[0O1IL]/.test(j.code)); assert.equal(j.expiresAt,clock.now+604800e3);
 assert.equal(up.headers.get('Access-Control-Allow-Origin'),null,'CORS 헤더 없음(같은 출처만)'); assert.equal(up.headers.get('Cache-Control'),'no-store');
 const keys=[...env.SAVE_KV.m.keys()]; assert.deepEqual(keys.filter(k=>k.startsWith('x:')),['x:'+j.code]);
 const stored=env.SAVE_KV.m.get('x:'+j.code); assert.equal(stored.v,body); assert.deepEqual(stored.meta,{t:clock.now},'본문과 시각만 보관');
 assert.ok(!keys.some(k=>k.includes('203.0.113.7'))&&![...env.SAVE_KV.m.values()].some(e=>e.v.includes('203.0.113.7')||JSON.stringify(e.meta||{}).includes('203.0.113')),'IP 원문을 남기지 않는다');
 const pretty=j.code.slice(0,4).toLowerCase()+'-'+j.code.slice(4); assert.equal(normCode(pretty),j.code);
 const got=await handle(req('GET','/api/transfer/'+pretty),env,clock.now); assert.equal(got.status,200); const g=await got.json(); assert.equal(g.data,body); assert.equal(g.createdAt,clock.now);
 assert.equal(JSON.parse(LZ.decompressFromBase64(g.data)).ver,4);
 const again=await handle(req('GET','/api/transfer/'+j.code),env,clock.now); assert.equal(again.status,404); assert.equal((await again.json()).error,'not_found');
});
test('7일이 지나면 사라지고, 올린 사람이 먼저 지울 수 있다',async()=>{
 const {handle}=await W; const clock={now:1e12}; const env={SAVE_KV:fakeKV(clock)};
 const a=(await (await handle(req('POST','/api/transfer',save()),env,clock.now)).json()).code;
 clock.now+=604800e3-1000; assert.equal((await handle(req('GET','/api/transfer/'+a),env,clock.now)).status,200,'7일 직전까지 남음');
 const b=(await (await handle(req('POST','/api/transfer',save()),env,clock.now)).json()).code; clock.now+=604800e3+1;
 assert.equal((await handle(req('GET','/api/transfer/'+b),env,clock.now)).status,404,'7일 뒤 만료');
 const c=(await (await handle(req('POST','/api/transfer',save()),env,clock.now)).json()).code;
 const d=await handle(req('DELETE','/api/transfer/'+c),env,clock.now); assert.equal(d.status,200);
 assert.equal((await handle(req('GET','/api/transfer/'+c),env,clock.now)).status,404,'지운 코드는 못 받음');
 assert.equal((await handle(req('GET','/api/transfer/ABC'),env,clock.now)).status,400,'형식이 틀린 코드');
 assert.equal((await handle(req('GET','/api/transfer/AAAA0000'),env,clock.now)).status,400,'0은 쓰지 않는 글자');
});
test('크기·형식·같은 출처를 확인한다',async()=>{
 const {handle,MAX_BYTES}=await W; const clock={now:1e12}; const env={SAVE_KV:fakeKV(clock)};
 const big=save(); const huge='N4IgbgpgTiBcAs'+'A'.repeat(MAX_BYTES-12);
 const r1=await handle(req('POST','/api/transfer',huge),env,clock.now); assert.equal(r1.status,413); assert.match((await r1.json()).message,/8MB/);
 const r1b=await handle(req('POST','/api/transfer','x',{'Content-Length':String(MAX_BYTES+1)}),env,clock.now); assert.equal(r1b.status,413,'Content-Length만 보고도 거절');
 for(const bad of ['','hello world',LZ.compressToBase64(JSON.stringify({not:'a save',x:'y'.repeat(200)})),big.slice(0,-1),'<html>'+big])
  assert.equal((await handle(req('POST','/api/transfer',bad),env,clock.now)).status,400,'저장 형식 아님: '+bad.slice(0,20));
 assert.equal([...env.SAVE_KV.m.keys()].filter(k=>k.startsWith('x:')).length,0,'거절한 것은 보관하지 않음');
 assert.equal((await handle(req('POST','/api/transfer',big,{Origin:'https://evil.example'}),env,clock.now)).status,403);
 assert.equal((await handle(req('GET','/api/transfer/ABCDEFGH',undefined,{Origin:'https://evil.example'}),env,clock.now)).status,403);
 assert.equal((await handle(req('POST','/api/transfer',big,{Origin:'','Sec-Fetch-Site':'cross-site'}),env,clock.now)).status,403);
 assert.equal((await handle(req('PUT','/api/transfer',big),env,clock.now)).status,405);
});
test('IP마다 한 시간에 10번까지 올릴 수 있다',async()=>{
 const {handle}=await W; const clock={now:Date.UTC(2026,10,16,5,0,1)}; const env={SAVE_KV:fakeKV(clock)};
 for(let i=0;i<10;i++)assert.equal((await handle(req('POST','/api/transfer',save(10)),env,clock.now)).status,201,'올리기 '+(i+1));
 const r=await handle(req('POST','/api/transfer',save(10)),env,clock.now); assert.equal(r.status,429); const j=await r.json(); assert.equal(j.error,'rate_limited'); assert.match(j.message,/한 시간에 10번/); assert.ok(r.headers.get('Retry-After'));
 assert.equal((await handle(req('POST','/api/transfer',save(10),{'CF-Connecting-IP':'198.51.100.2'}),env,clock.now)).status,201,'다른 IP는 따로 센다');
 const rl=[...env.SAVE_KV.m.entries()].filter(([k])=>k.startsWith('rl:')); assert.equal(rl.length,2); for(const [k,e] of rl){ assert.match(k,/^rl:[0-9a-f]{24}:\d+$/); assert.ok(e.exp-clock.now<=3660e3,'횟수 기록은 금방 사라진다'); }
 clock.now+=3600e3; assert.equal((await handle(req('POST','/api/transfer',save(10)),env,clock.now)).status,201,'다음 시간에는 다시 가능');
 const before=env.SAVE_KV.ops.put; await handle(req('POST','/api/transfer',save(10),{'CF-Connecting-IP':'192.0.2.9'}),env,clock.now); assert.equal(env.SAVE_KV.ops.put-before,2,'올리기 1번 = 본문 1 + 횟수 1 쓰기');
 const g0=env.SAVE_KV.ops; const code=(await (await handle(req('POST','/api/transfer',save(10),{'CF-Connecting-IP':'192.0.2.10'}),env,clock.now)).json()).code; const d0=g0.del; await handle(req('GET','/api/transfer/'+code),env,clock.now); assert.equal(g0.del-d0,1,'받기 1번 = 읽기 + 삭제 1');
});
test('SAVE_KV가 없으면 503 not_configured, 나머지 요청은 정적 파일로',async()=>{
 const {handle,default:worker}=await W; const seen=[]; const env={ASSETS:{fetch:r=>{ seen.push(new URL(r.url).pathname); return new Response('asset'); }}};
 for(const [m,p] of [['GET','/api/transfer'],['POST','/api/transfer'],['GET','/api/transfer/ABCDEFGH'],['DELETE','/api/transfer/ABCDEFGH']]){ const r=await handle(req(m,p,m==='POST'?save():undefined),env); assert.equal(r.status,503,m+' '+p); assert.deepEqual(await r.json(),{error:'not_configured',message:'기기 옮기기가 아직 준비되지 않았습니다. 파일로 내보내기를 써 주세요.'}); }
 const a=await worker.fetch(req('GET','/index.html'),env); assert.equal(await a.text(),'asset'); assert.deepEqual(seen,['/index.html']);
 assert.equal((await handle(req('GET','/api/other'),env)).status,404);
 const ok=await handle(req('GET','/api/transfer'),{SAVE_KV:fakeKV({now:0})}); assert.equal(ok.status,200); assert.equal((await ok.json()).ok,true);
});
test('코드는 고르게 섞인 31글자에서 뽑는다',async()=>{
 const {newCode,ALPHABET}=await W; assert.equal(ALPHABET.length,31); assert.ok(![...'0O1IL'].some(c=>ALPHABET.includes(c)));
 const seen=new Set(), cnt={}; for(let i=0;i<4000;i++){ const c=newCode(); seen.add(c); for(const ch of c)cnt[ch]=(cnt[ch]||0)+1; }
 assert.equal(seen.size,4000); const v=Object.values(cnt); assert.equal(v.length,31); assert.ok(Math.min(...v)>Math.max(...v)*0.7,'치우침 없음');
});
test('wrangler 설정: Worker는 /api/*만 먼저 받고 정적 파일은 ./site에서',()=>{
 const t=fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8'); const cfg=JSON.parse(t.replace(/^\s*\/\/.*$/gm,''));
 assert.equal(cfg.main,'worker/index.js'); assert.deepEqual(cfg.assets,{directory:'./site',binding:'ASSETS',run_worker_first:['/api/*']});
 assert.ok(!cfg.kv_namespaces||cfg.kv_namespaces.every(k=>k.binding==='SAVE_KV'&&/^[0-9a-f]{32}$/.test(k.id)),'가짜 KV id를 넣지 않는다');
});
