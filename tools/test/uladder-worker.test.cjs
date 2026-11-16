/* 유저 래더 Worker(worker/uladder.js) 단위 점검: 가짜 KV로 덱 등록·덮어쓰기·단계 색인·상대 고르기(가까운 OVR, 나 빼기)·단계 바꾸기·관리자 숨김/삭제. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'); const W=import(path.join(root,'worker/index.js'));
function fakeKV(){ const m=new Map(); return { m,
  async get(k){ const e=m.get(k); return e?e.v:null; }, async getWithMetadata(k){ const e=m.get(k); return {value:e?e.v:null,metadata:e?e.meta:null}; },
  async put(k,v,o={}){ m.set(k,{v:String(v),meta:o.metadata||null}); }, async delete(k){ m.delete(k); },
  async list({prefix}){ return {keys:[...m.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name,metadata:m.get(name).meta})),list_complete:true}; } }; }
const ORIGIN='https://fronttime.example.workers.dev';
const req=(method,p,body,h={})=>new Request(ORIGIN+p,{method,body,headers:Object.assign({'Origin':ORIGIN},h)});
const wid=i=>'w'+String(i).padStart(16,'0');
function deck(o={}){ const P=[]; const POS=['C','1B','2B','3B','SS','LF','CF','RF','C','SS','LF','1B'];
 POS.forEach((pos,i)=>P.push({id:i+1,name:'타자'+i,age:27,isP:false,pos,th:'우',bt:'우',r:{con:50,pow:50,eye:50,spd:50,def:50,vit:60},pot:55,f:'data:image/webp;base64,'+'A'.repeat(3000)}));
 for(let i=0;i<12;i++)P.push({id:100+i,name:'투수'+i,age:28,isP:true,pos:'P',th:'우',bt:'우',r:{stf:50,ctl:50,sta:i<5?60:40},pot:55,role:i<5?'SP':'RP'});
 return Object.assign({v:1,kind:'cup-entry',name:'와이',year:2035,club:{},mgr:{},P,ln:[[1,'C'],[2,'1B'],[3,'2B'],[4,'3B'],[5,'SS'],[6,'LF'],[7,'CF'],[8,'RF'],[10,'DH']],bn:[9,11,12],rot:[100,101,102,103,104],pen:[105,106,107,108,109,110,111],bp:{},ovr:{t:60,p:61,b:59}},o); }
async function setup(){ const {handle}=await W; const env={SAVE_KV:fakeKV(),CUP_ADMIN:'s3cret'}; let now=Date.UTC(2026,10,20); return {env,H:(m,p,b,h)=>handle(req(m,p,b==null?undefined:JSON.stringify(b),h),env,now++)}; }
test('덱 등록: 세계 id당 하나, 덮어쓰기, 사진은 빼고 작게, 금칙어·형식 거절',async()=>{ const {env,H}=await setup();
 const r=await H('PUT','/api/ladder/deck',{wid:wid(1),tier:2,e:deck()}); assert.equal(r.status,200); const j=await r.json(); assert.equal(j.tier,2); assert.ok(j.bytes<12000,'덱 크기 '+j.bytes);
 assert.ok(!env.SAVE_KV.m.get('ulD:'+wid(1)).v.includes('data:image'),'사진이 남음'); assert.ok(env.SAVE_KV.m.has('ulT:2:'+wid(1)));
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
 assert.equal((await H('PUT','/api/ladder/tier',{wid:wid(5),tier:4})).status,200); assert.ok(!env.SAVE_KV.m.has('ulT:3:'+wid(5))&&env.SAVE_KV.m.has('ulT:4:'+wid(5)),'단계 색인 이동');
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
 assert.equal((await H('DELETE','/api/ladder/admin/deck/'+wid(2),null,AK)).status,200); assert.ok(!env.SAVE_KV.m.has('ulD:'+wid(2))&&!env.SAVE_KV.m.has('ulT:2:'+wid(2)));
});
