/* 유저 래더 Worker(worker/uladder.js) 단위 점검: 가짜 KV로 덱 등록·덮어쓰기·단계 색인·상대 고르기(가까운 OVR, 나 빼기)·단계 바꾸기·관리자 숨김/삭제.
   KV 아끼기: 색인 한 키(ulIdx) 유지·없을 때 다시 만들기·캐시(쓰기 뒤 바로 비움)·그대로인 덱은 쓰지 않기·하루 횟수 제한·KV 연산 수. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'); const W=import(path.join(root,'worker/index.js'));
function fakeKV(){ const m=new Map(), ops={read:0,write:0,del:0,list:0}; return { m, ops,
  async get(k){ ops.read++; const e=m.get(k); return e?e.v:null; }, async getWithMetadata(k){ ops.read++; const e=m.get(k); return {value:e?e.v:null,metadata:e?e.meta:null}; },
  async put(k,v,o={}){ ops.write++; m.set(k,{v:String(v),meta:o.metadata||null}); }, async delete(k){ ops.del++; m.delete(k); },
  async list({prefix}){ ops.list++; return {keys:[...m.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name,metadata:m.get(name).meta})),list_complete:true}; } }; }
/* 가짜 Cache API(caches.default): 테스트마다 새로 */
function fakeCaches(){ const c=new Map(); globalThis.caches={default:{ c, async match(q){ const e=c.get(q.url); return e?new Response(e.b,{status:e.s,headers:e.h}):undefined; }, async put(q,r){ c.set(q.url,{b:await r.text(),s:r.status,h:Object.fromEntries(r.headers)}); }, async delete(q){ return c.delete(q.url); } }}; return c; }
const ops=env=>Object.assign({},env.SAVE_KV.ops); const dOps=(a,b)=>({read:b.read-a.read,write:b.write-a.write,del:b.del-a.del,list:b.list-a.list});
const idx=env=>JSON.parse(env.SAVE_KV.m.get('ulIdx').v); const inTier=(env,t,w)=>idx(env).T[t].some(x=>x.wid===w);
const ORIGIN='https://fronttime.example.workers.dev';
const req=(method,p,body,h={})=>new Request(ORIGIN+p,{method,body,headers:Object.assign({'Origin':ORIGIN},h)});
const wid=i=>'w'+String(i).padStart(16,'0');
function deck(o={}){ const P=[]; const POS=['C','1B','2B','3B','SS','LF','CF','RF','C','SS','LF','1B'];
 POS.forEach((pos,i)=>P.push({id:i+1,name:'타자'+i,age:27,isP:false,pos,th:'우',bt:'우',r:{con:50,pow:50,eye:50,spd:50,def:50,vit:60},pot:55,sal:300,f:'data:image/webp;base64,'+'A'.repeat(3000)}));
 for(let i=0;i<12;i++)P.push({id:100+i,name:'투수'+i,age:28,isP:true,pos:'P',th:'우',bt:'우',r:{stf:50,ctl:50,sta:i<5?60:40},pot:55,role:i<5?'SP':'RP',sal:300});
 return Object.assign({v:1,kind:'cup-entry',name:'와이',year:2035,club:{},mgr:{},P,ln:[[1,'C'],[2,'1B'],[3,'2B'],[4,'3B'],[5,'SS'],[6,'LF'],[7,'CF'],[8,'RF'],[10,'DH']],bn:[9,11,12],rot:[100,101,102,103,104],pen:[105,106,107,108,109,110,111],bp:{},ovr:{t:60,p:61,b:59},payRef:9000},o); } /* 0.8배(사용자 11-17 연봉 상한) */
async function setup(){ const {handle}=await W; fakeCaches(); const env={SAVE_KV:fakeKV(),CUP_ADMIN:'s3cret'}; const clock={now:Date.UTC(2026,10,20)}; return {env,clock,H:(m,p,b,h)=>handle(req(m,p,b==null?undefined:JSON.stringify(b),h),env,clock.now++)}; }
test('덱 등록: 세계 id당 하나, 덮어쓰기, 사진은 빼고 작게, 금칙어·형식 거절',async()=>{ const {env,H}=await setup();
 const r=await H('PUT','/api/ladder/deck',{wid:wid(1),tier:2,e:deck()}); assert.equal(r.status,200); const j=await r.json(); assert.equal(j.tier,2); assert.ok(j.bytes<12000,'덱 크기 '+j.bytes);
 assert.ok(!env.SAVE_KV.m.get('ulD:'+wid(1)).v.includes('data:image'),'사진이 남음'); assert.ok(inTier(env,2,wid(1)),'색인'); assert.ok(![...env.SAVE_KV.m.keys()].some(k=>k.startsWith('ulT:')),'옛 단계 키를 씀');
 assert.equal((await H('PUT','/api/ladder/deck',{wid:wid(1),tier:2,e:deck({name:'새 이름'})})).status,200); assert.equal((await (await H('GET','/api/ladder/me/'+wid(1))).json()).name,'새 이름');
 assert.equal([...env.SAVE_KV.m.keys()].filter(k=>k.startsWith('ulD:')).length,1);
 assert.equal((await H('PUT','/api/ladder/deck',{wid:wid(2),tier:0,e:deck({name:'시1발'})})).status,400); const bad=deck(); bad.ln=bad.ln.slice(0,8); assert.equal((await H('PUT','/api/ladder/deck',{wid:wid(2),tier:0,e:bad})).status,400);
 assert.equal((await H('PUT','/api/ladder/deck',{wid:'nope',tier:0,e:deck()})).status,400); assert.equal((await H('PUT','/api/ladder/deck',{wid:wid(3),e:deck()},{Origin:'https://evil.example'})).status,403,'다른 사이트에서 등록');
});
test('상대 고르기: 같은 단계에서 내 OVR과 가까운 순, 나는 빼고, 평균·개수, 단계 바꾸면 색인도 옮김',async()=>{ const {env,H}=await setup();
 for(let i=1;i<=14;i++)await H('PUT','/api/ladder/deck',{wid:wid(i),tier:i<=12?3:1,e:deck({name:'팀'+i,ovr:{t:60+i,p:60,b:60}})});
 const o=await (await H('GET',`/api/ladder/opp?wid=${wid(5)}&tier=3&ovr=65&n=9`)).json(); assert.equal(o.count,11); assert.equal(o.decks.length,9); assert.ok(!o.decks.some(d=>d.name==='팀5'),'나를 상대로 줌');
 assert.deepEqual(o.decks.slice(0,2).map(d=>d.ovr.t).sort(),[64,66]); assert.ok(!o.decks.some(d=>d.name==='팀13'),'다른 단계 덱'); assert.ok(o.decks.every(d=>d.e&&d.e.P.length===24));
 assert.ok(Math.abs(o.avg-(66+5/11))<.2,'평균 '+o.avg);
 assert.equal((await H('PUT','/api/ladder/tier',{wid:wid(5),tier:4})).status,200); assert.ok(!inTier(env,3,wid(5))&&inTier(env,4,wid(5)),'단계 색인 이동'); assert.equal(JSON.parse(env.SAVE_KV.m.get('ulD:'+wid(5)).v).name,'팀5');
 assert.deepEqual((await (await H('GET','/api/ladder/tiers')).json()).counts,[0,2,0,11,1],'단계별 등록 덱 수');
 const e=await (await H('GET',`/api/ladder/opp?wid=${wid(99)}&tier=0&ovr=60`)).json(); assert.equal(e.decks.length,0); assert.equal(e.count,0);
});
test('관리자: 키 검사(틀린 키 401), 검색, 숨김(상대에서 빠짐)·복구, 삭제',async()=>{ const {env,H}=await setup(); const AK={Authorization:'Bearer s3cret',Origin:''};
 await H('PUT','/api/ladder/deck',{wid:wid(1),tier:2,e:deck({name:'멀쩡한팀'})}); await H('PUT','/api/ladder/deck',{wid:wid(2),tier:2,e:deck({name:'이상한팀'})});
 for(const [m,p,b] of [['GET','/api/ladder/admin/list'],['PUT','/api/ladder/admin/hide',{wid:wid(2),hide:1}],['DELETE','/api/ladder/admin/deck/'+wid(2)]])assert.equal((await H(m,p,b,{Authorization:'Bearer x',Origin:''})).status,401);
 const L=await (await H('GET','/api/ladder/admin/list?q='+encodeURIComponent('이상'),null,AK)).json(); assert.equal(L.n,1); assert.equal(L.decks[0].wid,wid(2));
 assert.equal((await H('PUT','/api/ladder/admin/hide',{wid:wid(2),hide:1},AK)).status,200); let o=await (await H('GET',`/api/ladder/opp?wid=${wid(9)}&tier=2&ovr=60`)).json(); assert.deepEqual(o.decks.map(d=>d.name),['멀쩡한팀']);
 await H('PUT','/api/ladder/deck',{wid:wid(2),tier:2,e:deck({name:'이상한팀'})}); o=await (await H('GET',`/api/ladder/opp?wid=${wid(9)}&tier=2&ovr=60`)).json(); assert.equal(o.decks.length,1,'숨긴 덱이 다시 올려서 풀림');
 assert.equal((await H('PUT','/api/ladder/admin/hide',{wid:wid(2),hide:0},AK)).status,200); o=await (await H('GET',`/api/ladder/opp?wid=${wid(9)}&tier=2&ovr=60`)).json(); assert.equal(o.decks.length,2);
 assert.equal((await H('DELETE','/api/ladder/admin/deck/'+wid(2),null,AK)).status,200); assert.ok(!env.SAVE_KV.m.has('ulD:'+wid(2))&&!inTier(env,2,wid(2)));
 const u=await (await H('GET','/api/admin/usage',null,AK)).json(); assert.equal(u.decks,1); assert.deepEqual(u.counts,[0,0,1,0,0]); assert.ok(u.writes>0,'오늘 쓰기 '+u.writes);
 assert.equal((await H('GET','/api/admin/usage',null,{Authorization:'Bearer x',Origin:''})).status,401); assert.equal((await H('GET','/api/ladder/admin/usage',null,AK)).status,200);
});
test('색인: 없으면 ulD: 목록에서 다시 만들고(숨김 제외), 하루가 지나면 다시 만들며, 단계마다 상한을 넘으면 오래된 등록부터 뺀다',async()=>{ const {env,H,clock}=await setup(); const AK={Authorization:'Bearer s3cret',Origin:''};
 for(let i=1;i<=4;i++)await H('PUT','/api/ladder/deck',{wid:wid(i),tier:i%2,e:deck({name:'팀'+i})}); await H('PUT','/api/ladder/admin/hide',{wid:wid(3),hide:1},AK);
 const before=idx(env).T; env.SAVE_KV.m.delete('ulIdx'); fakeCaches(); clock.now+=120e3; /* 다른 인스턴스·색인 유실 */
 const o0=ops(env); const c=await (await H('GET','/api/ladder/tiers')).json(); const d=dOps(o0,ops(env)); assert.deepEqual(c.counts,[2,1,0,0,0]); assert.equal(d.list,1,'목록 1회'); assert.equal(d.write,1,'색인 1회 쓰기');
 assert.deepEqual(idx(env).T.map(L=>L.map(x=>x.wid).sort()),before.map(L=>L.map(x=>x.wid).sort()));
 clock.now+=86400e3+1; fakeCaches(); const o1=ops(env); await H('GET','/api/ladder/tiers'); assert.equal(dOps(o1,ops(env)).list,1,'하루 지나 다시 만들기');
 const UL=await import(path.join(root,'worker/uladder.js')); const cap=UL.UL_IDX_CAP; const big={v:1,rb:clock.now,T:[Array.from({length:cap},(_,i)=>({wid:wid(1000+i),name:'x',year:2030,ovr:{t:60},at:i})),[],[],[],[]],wd:'',wn:0};
 env.SAVE_KV.m.set('ulIdx',{v:JSON.stringify(big),meta:null}); await H('PUT','/api/ladder/deck',{wid:wid(7),tier:0,e:deck({name:'새팀'})});
 const T0=idx(env).T[0]; assert.equal(T0.length,cap); assert.equal(T0[0].wid,wid(7),'새 등록이 맨 앞'); assert.ok(!T0.some(x=>x.wid===wid(1000+cap-1)),'가장 오래된 것을 빼야 함');
});
test('KV 아끼기: 그대로인 덱은 쓰지 않고, 잔류는 쓰지 않으며, 단계별 수·상대 색인은 캐시(쓰기 뒤 바로 새 값)',async()=>{ const {env,H}=await setup();
 let o=ops(env); await H('PUT','/api/ladder/deck',{wid:wid(1),tier:0,e:deck()}); let d=dOps(o,ops(env)); assert.equal(d.list,1,'첫 등록: 색인 만들기 목록'); 
 o=ops(env); const r=await (await H('PUT','/api/ladder/deck',{wid:wid(1),tier:0,e:deck()})).json(); d=dOps(o,ops(env)); assert.equal(r.same,true); assert.equal(r.ok,true); assert.equal(d.write+d.del+d.list,0,'그대로인 덱인데 씀 '+JSON.stringify(d));
 o=ops(env); await H('PUT','/api/ladder/deck',{wid:wid(1),tier:0,e:deck({name:'바뀐팀'})}); d=dOps(o,ops(env)); assert.deepEqual([d.write,d.del,d.list],[2,0,0],'바뀐 덱: 덱+색인 '+JSON.stringify(d));
 o=ops(env); await H('PUT','/api/ladder/tier',{wid:wid(1),tier:0}); d=dOps(o,ops(env)); assert.equal(d.write+d.del,0,'잔류인데 씀');
 o=ops(env); await H('PUT','/api/ladder/tier',{wid:wid(1),tier:1}); d=dOps(o,ops(env)); assert.deepEqual([d.write,d.del,d.list],[2,0,0],'승격: 덱 메타+색인 '+JSON.stringify(d));
 await H('GET','/api/ladder/tiers'); o=ops(env); const t1=await H('GET','/api/ladder/tiers'); d=dOps(o,ops(env)); assert.equal(d.read+d.list,0,'두 번째 단계별 수는 캐시'); assert.equal(t1.headers.get('X-FO-Cache'),'hit'); assert.deepEqual((await t1.json()).counts,[0,1,0,0,0]);
 assert.equal(t1.headers.get('Cache-Control'),'public, max-age=60');
 await H('PUT','/api/ladder/deck',{wid:wid(2),tier:1,e:deck({name:'둘째'})}); const t2=await H('GET','/api/ladder/tiers'); assert.equal(t2.headers.get('X-FO-Cache'),null,'쓰기 뒤 캐시를 비워야 함'); assert.deepEqual((await t2.json()).counts,[0,2,0,0,0]);
 o=ops(env); const op=await (await H('GET',`/api/ladder/opp?wid=${wid(9)}&tier=1&ovr=60`)).json(); d=dOps(o,ops(env)); assert.equal(op.decks.length,2); assert.equal(d.list,0,'상대 고르기에 목록'); assert.equal(d.read,2,'덱 2개만 읽기 '+JSON.stringify(d));
 /* 색인이 늦어도 숨김·다른 단계 덱은 상대로 주지 않는다 */
 const m=env.SAVE_KV.m.get('ulD:'+wid(2)); m.meta=Object.assign({},m.meta,{hide:1}); const op2=await (await H('GET',`/api/ladder/opp?wid=${wid(9)}&tier=1&ovr=60`)).json(); assert.deepEqual(op2.decks.map(x=>x.name),['바뀐팀']);
 const me=await (await H('GET','/api/ladder/me/'+wid(1))).json(); assert.equal(me.registered,true); assert.equal(me.tier,1); assert.ok(!('bh' in me)&&!('rn' in me),'내부 값 노출');
});
test('횟수 제한: 세계 id당 하루 등록 수, 다음 날 풀림, IP당 짧은 시간 쓰기 요청(인스턴스 메모리), 상태 확인은 KV를 안 씀',async()=>{ const {env,H,clock}=await setup(); const UL=await import(path.join(root,'worker/uladder.js'));
 for(let i=0;i<UL.UL_REG_DAY;i++)assert.equal((await H('PUT','/api/ladder/deck',{wid:wid(1),tier:0,e:deck({name:'팀'+i})})).status,200);
 const x=await H('PUT','/api/ladder/deck',{wid:wid(1),tier:0,e:deck({name:'하나더'})}); assert.equal(x.status,429); assert.equal((await x.json()).error,'rate_limited');
 assert.equal((await (await H('PUT','/api/ladder/deck',{wid:wid(1),tier:0,e:deck({name:'팀'+(UL.UL_REG_DAY-1)})})).json()).same,true,'그대로면 제한과 상관없이 200');
 clock.now+=86400e3; assert.equal((await H('PUT','/api/ladder/deck',{wid:wid(1),tier:0,e:deck({name:'하나더'})})).status,200,'다음 날');
 let lim=0; for(let i=0;i<UL.UL_IP_MAX+5;i++){ const r=await H('PUT','/api/ladder/tier',{wid:wid(1),tier:0},{'CF-Connecting-IP':'198.51.100.9'}); if(r.status===429)lim++; } assert.equal(lim,5,'IP 제한');
 assert.equal((await H('PUT','/api/ladder/tier',{wid:wid(1),tier:0},{'CF-Connecting-IP':'198.51.100.10'})).status,200,'다른 IP');
 const o=ops(env); const h=await H('GET','/api/health'); assert.equal(h.status,200); const j=await h.json(); assert.equal(j.ok,true); assert.ok(j.build); assert.deepEqual(dOps(o,ops(env)),{read:0,write:0,del:0,list:0});
 const {handle}=await W; assert.equal((await (await handle(req('GET','/api/health'),{},clock.now)).json()).kv,false);
});
test('연봉 상한(사용자 11-17 "공평하게"): KV 덱 등록도 같은 규칙(넘으면 over_cap, 연봉 없으면 no_pay), 상대 고르기는 넘는 덱·유예 끝난 예전 덱을 뺀다',async()=>{ const {env,H,clock}=await setup(); const C=await import(path.join(root,'src/core/uladder.mjs'));
 let r=await H('PUT','/api/ladder/deck',{wid:wid(1),tier:3,e:deck({payRef:5000})}); assert.equal(r.status,400); let j=await r.json(); assert.equal(j.error,'over_cap'); assert.ok(/챔피언스 상한/.test(j.errors[0]),j.errors[0]);
 const nosal=deck(); for(const p of nosal.P)delete p.sal; r=await H('PUT','/api/ladder/deck',{wid:wid(1),tier:0,e:nosal}); assert.equal((await r.json()).error,'no_pay');
 assert.ok(![...env.SAVE_KV.m.keys()].some(k=>k.startsWith('ulD:')),'거절한 덱은 쓰지 않는다');
 assert.equal((await H('PUT','/api/ladder/deck',{wid:wid(1),tier:3,e:deck({name:'알뜰',payRef:6000})})).status,200);
 assert.equal((await H('PUT','/api/ladder/deck',{wid:wid(2),tier:3,e:deck({name:'예전',ovr:{t:61,p:60,b:60}})})).status,200);
 const k='ulD:'+wid(2), was=env.SAVE_KV.m.get(k), old=JSON.parse(was.v); for(const p of old.P)delete p.sal; delete old.payRef; env.SAVE_KV.m.set(k,{v:JSON.stringify(old),meta:was.meta}); /* 상한 전에 올린 예전 덱 */
 let o=await (await H('GET',`/api/ladder/opp?wid=${wid(9)}&tier=3&ovr=60&n=9`)).json(); assert.deepEqual(o.decks.map(x=>x.name).sort(),['알뜰','예전'],'유예 중에는 예전 덱도');
 clock.now=C.UL_CAP_FROM+1000; o=await (await H('GET',`/api/ladder/opp?wid=${wid(9)}&tier=3&ovr=60&n=9`)).json(); assert.deepEqual(o.decks.map(x=>x.name),['알뜰'],'유예가 끝나면 예전 덱은 빠짐');
});
