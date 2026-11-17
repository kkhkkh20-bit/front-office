/* 유저 대회 Worker(worker/cup.js) 단위 점검: 가짜 KV로 신청·덮어쓰기·하루 1회·마감·금칙어·자격·명단·주최자 인증을 본다. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const W=import(path.join(root,'worker/index.js'));
function fakeKV(clock){ const m=new Map();
 const live=k=>{ const e=m.get(k); if(e&&e.exp&&e.exp<=clock.now){ m.delete(k); return null; } return e||null; };
 return { m,
  async get(k){ const e=live(k); return e?e.v:null; },
  async getWithMetadata(k){ const e=live(k); return {value:e?e.v:null,metadata:e?e.meta:null}; },
  async put(k,v,o={}){ m.set(k,{v:String(v),meta:o.metadata||null,exp:o.expirationTtl?clock.now+o.expirationTtl*1000:0}); },
  async delete(k){ m.delete(k); },
  async list({prefix}){ return {keys:[...m.keys()].filter(k=>k.startsWith(prefix)&&live(k)).map(name=>({name,metadata:m.get(name).meta})),list_complete:true}; } }; }
const ORIGIN='https://fronttime.example.workers.dev';
const req=(method,p,body,h={})=>new Request(ORIGIN+p,{method,body,headers:Object.assign({'CF-Connecting-IP':'203.0.113.7','Origin':ORIGIN},h)});
const WID='w0123456789abcdef', WID2='wfedcba9876543210';
function entry(o={}){ const P=[]; const POS=['C','1B','2B','3B','SS','LF','CF','RF','C','SS','LF','1B'];
 POS.forEach((pos,i)=>P.push({id:i+1,name:'타자'+i,age:27,isP:false,pos,th:'우',bt:'우',r:{con:50,pow:50,eye:50,spd:50,def:50,vit:60},pot:55}));
 for(let i=0;i<12;i++)P.push({id:100+i,name:'투수'+i,age:28,isP:true,pos:'P',th:'우',bt:'우',r:{stf:50,ctl:50,sta:i<5?60:40},pot:55,role:i<5?'SP':'RP'});
 return Object.assign({v:1,kind:'cup-entry',wid:WID,name:'와이',year:2035,seasons:3,pay:9000,club:{},mgr:{},P,
  ln:[[1,'C'],[2,'1B'],[3,'2B'],[4,'3B'],[5,'SS'],[6,'LF'],[7,'CF'],[8,'RF'],[10,'DH']],bn:[9,11,12],rot:[100,101,102,103,104],pen:[105,106,107,108,109,110,111],bp:{},ovr:{t:60,p:61,b:59}},o); }
const cfg={id:'cup1',title:'제1회 프런트컵',deadline:'2026-11-30 21:00',minSeasons:2,payCap:20000};
async function setup(clock){ const {handle}=await W; const env={SAVE_KV:fakeKV(clock),CUP_ADMIN:'s3cret'}; const H=(m,p,b,h)=>handle(req(m,p,b,h),env,clock.now);
 assert.equal((await H('PUT','/api/cup/admin/config',JSON.stringify(cfg))).status,401,'비밀값 없이 설정 못 바꿈');
 assert.equal((await H('PUT','/api/cup/admin/config',JSON.stringify(cfg),{Authorization:'Bearer s3cret',Origin:''})).status,200); return {env,H}; }
test('신청: 세계 id마다 하나, 다시 내면 덮어쓰기, 하루 1회, 상태 조회',async()=>{
 const clock={now:Date.UTC(2026,10,20,3)}; const {env,H}=await setup(clock);
 const r=await H('POST','/api/cup/entry',JSON.stringify(entry())); assert.equal(r.status,201); const j=await r.json(); assert.equal(j.name,'와이'); assert.deepEqual(j.ovr,{t:60,p:61,b:59});
 const again=await H('POST','/api/cup/entry',JSON.stringify(entry({name:'와이2'}))); assert.equal(again.status,429,'같은 날 두 번째');
 clock.now+=86400e3; assert.equal((await H('POST','/api/cup/entry',JSON.stringify(entry({name:'와이 리턴즈'})))).status,201,'다음 날은 덮어쓰기');
 const st=await (await H('GET','/api/cup/entry/'+WID)).json(); assert.equal(st.entered,true); assert.equal(st.name,'와이 리턴즈');
 assert.equal([...env.SAVE_KV.m.keys()].filter(k=>k.startsWith('cupE:')).length,1,'세계 id당 하나');
 assert.equal((await (await H('GET','/api/cup/entry/'+WID2)).json()).entered,false);
 assert.equal((await H('GET','/api/cup/entry/xyz')).status,400);
});
test('거절: 마감 뒤·금칙어·12자 넘는 이름은 잘라 받음·자격(시즌 수·연봉 합)·형식',async()=>{
 const clock={now:Date.UTC(2026,10,20,3)}; const {H}=await setup(clock);
 assert.equal((await H('POST','/api/cup/entry',JSON.stringify(entry({name:'시1발 야구단'})))).status,400);
 const e1=await H('POST','/api/cup/entry',JSON.stringify(entry({seasons:1}))); assert.equal(e1.status,403); assert.match((await e1.json()).errors[0],/최소 2시즌/);
 const e2=await H('POST','/api/cup/entry',JSON.stringify(entry({pay:99999}))); assert.equal(e2.status,403); assert.match((await e2.json()).errors[0],/연봉 합/);
 const bad=entry(); bad.ln=bad.ln.slice(0,8); assert.equal((await H('POST','/api/cup/entry',JSON.stringify(bad))).status,400);
 const ok=await H('POST','/api/cup/entry',JSON.stringify(entry({name:'아주아주아주긴팀이름입니다요'}))); assert.equal(ok.status,201); assert.equal([...(await ok.json()).name].length,12);
 clock.now=Date.UTC(2026,10,30,12,1); /* 21:01 KST */
 const late=await H('POST','/api/cup/entry',JSON.stringify(entry({wid:WID2}))); assert.equal(late.status,403); assert.equal((await late.json()).error,'closed');
});
test('명단: 시드 순(OVR), 세계 id는 공개하지 않음, HTML 페이지, 주최자는 전체 엔트리',async()=>{
 const clock={now:Date.UTC(2026,10,20,3)}; const {H}=await setup(clock);
 await H('POST','/api/cup/entry',JSON.stringify(entry()));
 await H('POST','/api/cup/entry',JSON.stringify(entry({wid:WID2,name:'제이지',year:2031,ovr:{t:66,p:60,b:70}})));
 const L=await (await H('GET','/api/cup/entries',null,{Origin:'https://cafe.example'})).json(); assert.equal(L.n,2); assert.equal(L.entries[0].name,'제이지'); assert.equal(L.entries[0].seed,1);
 assert.ok(!JSON.stringify(L).includes(WID)&&!JSON.stringify(L).includes(WID2),'세계 id 비공개');
 const h=await H('GET','/api/cup/entries.html'); assert.equal(h.status,200); assert.match(await h.text(),/제이지 2031[\s\S]*66\|60 70/);
 assert.equal((await H('GET','/api/cup/admin/entries')).status,401);
 const A=await (await H('GET','/api/cup/admin/entries',null,{Authorization:'Bearer s3cret',Origin:''})).json(); assert.equal(A.entries.length,2); assert.ok(A.entries[0].P.length>=20);
 assert.equal((await H('PUT','/api/cup/admin/results',JSON.stringify({v:1,cups:[]}),{Authorization:'Bearer s3cret',Origin:''})).status,200);
 assert.deepEqual(await (await H('GET','/api/cup/results')).json(),{v:1,cups:[]});
});
test('관리자 끝점: 틀린 키·키 없음은 401, 맞는 키로 확인·제외/복구·파일 올리기·결과 전체(비공개)·연재 공개',async()=>{
 const clock={now:Date.UTC(2026,10,20,3)}; const {env,H}=await setup(clock); const AK={Authorization:'Bearer s3cret',Origin:''}, BAD={Authorization:'Bearer wrong',Origin:''};
 for(const [m,p,b] of [['GET','/api/cup/admin/check'],['PUT','/api/cup/admin/drop','{"h":"0000abcd"}'],['POST','/api/cup/admin/entry',JSON.stringify(entry())],['GET','/api/cup/admin/run'],['PUT','/api/cup/admin/run','{"v":1}'],['PUT','/api/cup/admin/pub','{"v":1}'],['PUT','/api/cup/admin/results','{"v":1,"cups":[]}'],['PUT','/api/cup/admin/game/x','{}'],['GET','/api/cup/admin/entries']]){
  assert.equal((await H(m,p,b,BAD)).status,401,'틀린 키 '+m+' '+p); assert.equal((await H(m,p,b,{Origin:''})).status,401,'키 없음 '+m+' '+p); }
 const ck=await (await H('GET','/api/cup/admin/check',null,AK)).json(); assert.equal(ck.ok,true); assert.equal(ck.cup.id,'cup1');
 const up=await H('POST','/api/cup/admin/entry',JSON.stringify(entry({wid:'',name:'파일팀'})),AK); assert.equal(up.status,201); const uj=await up.json(); assert.equal(uj.file,1);
 assert.ok([...env.SAVE_KV.m.keys()].includes('cupE:cup1:f'+uj.h),'파일 엔트리 키');
 const bad=entry(); bad.ln=bad.ln.slice(0,8); assert.equal((await H('POST','/api/cup/admin/entry',JSON.stringify(bad),AK)).status,400);
 let d=await (await H('PUT','/api/cup/admin/drop',JSON.stringify({h:uj.h}),AK)).json(); assert.deepEqual(d.drop,[uj.h]);
 const L=await (await H('GET','/api/cup/admin/entries',null,AK)).json(); assert.deepEqual(L.drop,[uj.h]); assert.equal(L.entries.length,1);
 d=await (await H('PUT','/api/cup/admin/drop',JSON.stringify({h:uj.h,undo:true}),AK)).json(); assert.deepEqual(d.drop,[]);
 assert.equal((await H('GET','/api/cup/admin/run',null,AK)).status,404); assert.equal((await H('PUT','/api/cup/admin/run',JSON.stringify({v:1,day:0,secret:'KS 결과'}),AK)).status,200);
 assert.equal((await (await H('GET','/api/cup/admin/run',null,AK)).json()).secret,'KS 결과'); assert.equal((await H('GET','/api/cup/run')).status,404,'결과 전체는 공개 길이 없다');
 assert.equal((await H('GET','/api/cup/pub')).status,404); assert.equal((await H('PUT','/api/cup/admin/pub',JSON.stringify({v:1,day:2}),AK)).status,200); assert.equal((await (await H('GET','/api/cup/pub')).json()).day,2);
});
test('공개 GET 캐시: 결과·연재·명단은 두 번째부터 KV를 읽지 않고, 주최자·신청 쓰기 뒤에는 바로 새 값',async()=>{
 const clock={now:Date.UTC(2026,10,20,3)}; const {env,H}=await setup(clock); const AK={Authorization:'Bearer s3cret',Origin:''}; const kv=env.SAVE_KV;
 let reads=0, lists=0; const g=kv.get.bind(kv), l=kv.list.bind(kv); kv.get=async k=>{ reads++; return g(k); }; kv.list=async o=>{ lists++; return l(o); };
 await H('PUT','/api/cup/admin/results',JSON.stringify({v:1,cups:[1]}),AK); await H('GET','/api/cup/results'); reads=0;
 const r2=await H('GET','/api/cup/results'); assert.equal(reads,0,'두 번째 결과 읽기'); assert.equal(r2.headers.get('X-FO-Cache'),'hit'); assert.equal(r2.headers.get('Cache-Control'),'public, max-age=300');
 await H('PUT','/api/cup/admin/results',JSON.stringify({v:1,cups:[1,2]}),AK); assert.deepEqual((await (await H('GET','/api/cup/results')).json()).cups,[1,2],'쓰기 뒤 새 값');
 await H('PUT','/api/cup/admin/pub',JSON.stringify({v:1,day:1}),AK); await H('GET','/api/cup/pub'); await H('PUT','/api/cup/admin/pub',JSON.stringify({v:1,day:2}),AK); const p=await H('GET','/api/cup/pub'); assert.equal((await p.json()).day,2); assert.equal(p.headers.get('Cache-Control'),'no-store');
 await H('GET','/api/cup/entries'); lists=0; assert.equal((await (await H('GET','/api/cup/entries')).json()).n,0); assert.equal(lists,0,'명단 캐시');
 assert.equal((await H('POST','/api/cup/entry',JSON.stringify(entry()))).status,201); assert.equal((await (await H('GET','/api/cup/entries')).json()).n,1,'신청 뒤 명단');
 await H('GET','/api/cup'); reads=0; await H('GET','/api/cup'); assert.equal(reads,0,'대회 설정 캐시');
});
test('대회 연봉 상한(사용자 11-17 "대회마다 연봉에 제약… 공평하게"): payCapX(리그 평균 배수)를 공개 설정에 싣고, 넘는 신청·연봉 기준 없는 신청은 403 not_eligible, 안이면 받는다',async()=>{
 const clock={now:Date.UTC(2026,10,20,3)}; const {H}=await setup(clock); const AK={Authorization:'Bearer s3cret',Origin:''};
 assert.equal((await H('PUT','/api/cup/admin/config',JSON.stringify(Object.assign({},cfg,{payCap:0,payCapX:1.25})),AK)).status,200);
 const pub=await (await H('GET','/api/cup')).json(); assert.equal((pub.cup||pub).payCapX,1.25,JSON.stringify(pub));
 const sal=o=>{ const e=entry(o); for(const p of e.P)p.sal=300; return e; }; /* 24명 × 300 = 7200 */
 let r=await H('POST','/api/cup/entry',JSON.stringify(sal({payRef:5000}))); assert.equal(r.status,403); let j=await r.json(); assert.ok(/상한/.test(j.errors[0])&&/1\.44배/.test(j.errors[0]),j.errors[0]);
 r=await H('POST','/api/cup/entry',JSON.stringify(entry())); assert.equal(r.status,403,'리그 평균(payRef)이 없는 예전 엔트리'); assert.ok(/연봉 기준/.test((await r.json()).errors[0]));
 assert.equal((await H('POST','/api/cup/entry',JSON.stringify(sal({payRef:9000})))).status,201,'0.8배는 받는다');
});
