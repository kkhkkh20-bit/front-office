const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),engine=require('./build.cjs').build({root,write:false}).engine;
const hireMethod=fs.readFileSync(path.join(root,'src/ui/actions/40_actions.js'),'utf8').split('\n').find(l=>l.trimStart().startsWith('anaHire(v)'));
assert.ok(hireMethod);
new Function('assert','toast','save','render',engine+'\nconst hireUi=({'+hireMethod+'}).anaHire;\n'+`
{
DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let guard=0;while(G.fd&&!G.fd.done&&guard++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);stInit();const base=JSON.stringify(G),reset=()=>{G=JSON.parse(base);worldReset();},roles=Object.keys(AROLE),fill=(n,skill=2)=>{G.analysts=Array.from({length:n},(_,i)=>Object.assign(mkAnalyst(skill,roles[i%roles.length]),{since:G.day-60}));},candidate=(role='opp')=>{const a=mkAnalyst(1,role);G.amarket=[a];G.amarketM=G.year*100+dobj(G.day).m;return a;};
assert.equal(ANA_MAX,9);fill(6);let m=G.mgr[G.user];m.rel=60;delete G.mgrReq;mgrScnFx(m,{req:'an'},{});assert.equal(G.mgrReq.n0,6);const first=candidate('opp'),salary=anaSal();hireUi(first.id+':0.5');assert.equal(anaList().length,7);assert.equal(anaSal(),salary+first.sal);assert.equal(first.sal,round5(ANA_SAL[1]*1.5));mgrReqDaily();assert.equal(G.mgrReq,undefined);assert.equal(m.rel,66);assert.equal(anaList().filter(a=>a.id===first.id).length,1);assert.ok(!G.amarket.some(a=>a.id===first.id));
console.log('실제 UI 제안·채용 6→7명, 감독 요청 완료·연봉·중복 인원 없음 통과');
for(let n=8;n<=9;n++){const a=candidate(roles[(n-1)%3]);hireUi(a.id+':0');assert.equal(anaList().length,n);}const blocked=candidate(),before=anaSal();hireUi(blocked.id+':0');assert.equal(anaList().length,9);assert.equal(anaSal(),before);assert.ok(G.amarket.some(a=>a.id===blocked.id));assert.match(hireAna(blocked.id),/9명/);
console.log('실제 UI 8·9명 허용, 10번째 제안/직접채용 차단·시장/급여 유지 통과');
reset();fill(6);for(let n=7;n<=9;n++){const a=candidate();assert.equal(hireAna(a.id),'');assert.equal(anaList().length,n);}const d0=G.spend.data||0,annual=anaSal();dailyCost();assert.ok(Math.abs(G.spend.data-d0-annual/365)<1e-9);
console.log('직접 채용 6→9명·모든 추가 분석원 실제 일일 연봉 비용 반영 통과');
reset();fill(9,5);const ai=G.teams.find(t=>t.id!==G.user).id,S=stTeamL(ai);S.sc=[];S.an=G.analysts.map(a=>JSON.parse(JSON.stringify(a)));for(const role of roles){assert.equal(anaPow(role),9.5);assert.equal(stAnaPow(ai,role),9.5);}const e0=anaEff();assert.ok(e0.sdm>=.65&&e0.bab<=.007&&e0.bat<=.005&&e0.rep<=3);G.analysts.push(Object.assign(mkAnalyst(5,'opp'),{since:G.day-60}));assert.equal(anaPow('opp'),9.5);assert.deepEqual(anaEff(),e0);
console.log('AI/유저 역할 상위3명 100/60/30% 동일·4번째 무효·기존 효과 상한 유지 통과');
reset();const tid=G.teams.find(t=>t.id!==G.user).id,L=stTeamL(tid);L.sc=[];L.an=Array.from({length:6},()=>Object.assign(mkAnalyst(1,'opp'),{since:G.day-60}));for(let n=7;n<=9;n++){const a=candidate();assert.equal(stJoin('an',a,tid,a.sal,true),true);assert.equal(L.an.length,n);}const tenth=candidate();assert.equal(stJoin('an',tenth,tid,tenth.sal,true),true);assert.equal(L.an.length,9,'AI도 10번째 증원은 불가, 기존 교체 정책 유지');assert.ok(stAiPay(L)<=stAiPlan(team(tid)).payMax);const tooCostly=candidate();assert.equal(stJoin('an',tooCostly,tid,1e6,true),false);assert.equal(L.an.length,9);
console.log('AI도 6→9명·10명 증원 금지, 만석 교체와 스태프 예산 한도 유지 통과');
reset();fill(9);m=G.mgr[G.user];m.rel=60;delete G.mgrReq;const out=mgrScnFx(m,{req:'an'},{});assert.equal(G.mgrReq,undefined);assert.ok(out.some(s=>s.includes('정원')));const budgetReply=MSQ.find(x=>x.id==='budget').a({room:100})[0];assert.equal(budgetReply.fx.req,undefined);assert.ok(budgetReply.r[0].includes('정원'));assert.equal(MSCN.find(x=>x.id==='data_lose').w({season:true,st:-4}),0);G.mgrReq={k:'an',mid:m.id,d:G.day-35,until:G.day-5,n0:9,ids:[]};mgrReqDaily();assert.equal(G.mgrReq,undefined);assert.equal(m.rel,60);
console.log('만석에서 불가능한 추가 요청 차단·옛 불가능 요청 무벌점 종료 통과');
}
`)(assert,()=>{},()=>{},()=>{});
console.log('분석원 정원 검사 통과');
