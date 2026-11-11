/* PR #4(codex/fix-audit-47) 회귀 시나리오를 main 구조(legTrack·myC·leaveTeamState)에 맞춰 옮긴 검사.
   PR #4의 수정 가운데 main에 다른 방식으로 이미 들어간 것(야인 훈련 지시, 독립구단 제작비 예약, 포스트시즌 홍보 집계,
   위임 현금 평가, 영입 약속 이력 판정, 미디어데이 대체)도 같은 결과가 나오는지 함께 확인한다. --baseline이면 실패 수만 보고. */
const path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),baseline=process.argv.includes('--baseline');let seed=23;const old=Math.random;
Math.random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
try{const engine=require('./build.cjs').build({root,write:false}).engine;new Function('assert','baseline',engine+String.raw`
DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;for(const t of G.teams)depth(t.id);
const base=JSON.stringify(G);let failed=0;const results=[];
const reset=()=>{G=JSON.parse(base);worldReset();};
const test=(id,fn)=>{reset();try{fn();results.push({id,pass:true});console.log('PASS '+id);}catch(e){failed++;results.push({id,pass:false});console.log('FAIL '+id+': '+String(e&&e.message||e).split('\n')[0]);}};
const other=(k=0)=>G.teams.filter(t=>t.id!==G.user)[k].id;
const rows=tid=>legRec().L.filter(x=>x.t===tid);

test('단장 귀속: 부임 전 AI 단장과 부임 뒤 내 승패를 나누고, 정규시즌 뒤 부임하면 그해 우승은 전임 몫',()=>{
  const y=G.year,B=other(),g0=team(B).gm;G.day=G.cal.open+60;for(const t of G.teams)G.sea.rec[t.id]={w:0,l:0,t:0};
  G.sea.rec[B]={w:31,l:37,t:0};legTrack();switchTeam(B);G.sea.rec[B]={w:79,l:63,t:0};G.myC.seas.push({y,tid:B,rank:1,w:48,l:26,t:0,ch:1});
  G.last={y,order:G.teams.map(t=>({tid:t.id,w:G.sea.rec[t.id].w,l:G.sea.rec[t.id].l,t:0})),ps:{champ:B}};legSeason(legOwners());
  const me=rows(B).find(x=>x.u),ai=rows(B).find(x=>x.k===g0.id);assert.ok(me&&me.w===48&&me.l===26&&me.c===1,'내 기록 '+JSON.stringify(me));assert.ok(ai&&ai.w===31&&ai.l===37&&ai.c===0,'전임 기록 '+JSON.stringify(ai));
  reset();const C=other(),g1=team(C).gm;G.day=G.cal.end+20;for(const t of G.teams)G.sea.rec[t.id]={w:70,l:70,t:0};G.sea.rec[C]={w:79,l:63,t:0};legTrack();
  G.ps={done:true,finDay:G.day-1,champ:C,order:G.teams.map(t=>({tid:t.id}))};switchTeam(C);
  G.last={y,order:G.teams.map(t=>({tid:t.id,w:G.sea.rec[t.id].w,l:G.sea.rec[t.id].l,t:0})),ps:{champ:C}};legSeason(legOwners());
  assert.ok(!rows(C).some(x=>x.u&&x.s),'시즌이 끝난 뒤 부임한 단장에게 시즌');const ai2=rows(C).find(x=>x.k===g1.id);assert.ok(ai2&&ai2.c===1&&ai2.w===79&&ai2.s===1,'우승은 전임 '+JSON.stringify(ai2));});

test('한 해 두 번 이직: 구단별 승패를 담당 단장에게 한 번씩',()=>{
  const y=G.year,a=G.user,b=other(),gB=team(b).gm;G.day=G.cal.open+70;for(const t of G.teams)G.sea.rec[t.id]={w:0,l:0,t:0};
  G.sea.rec[a]={w:22,l:18,t:0};G.sea.rec[b]={w:14,l:26,t:0};legTrack();switchTeam(b);const aiA=team(a).gm;
  G.day+=30;G.sea.rec[a]={w:31,l:29,t:0};G.sea.rec[b]={w:26,l:34,t:0};legTrack();switchTeam(a);const aiB=team(b).gm;
  G.sea.rec[a]={w:80,l:62,t:0};G.sea.rec[b]={w:75,l:67,t:0};legTrack();G.myC.seas.push({y,tid:a,rank:1,w:71,l:51,t:0,ch:1});
  G.last={y,order:G.teams.map(t=>({tid:t.id,w:G.sea.rec[t.id].w,l:G.sea.rec[t.id].l,t:0})),ps:{champ:a}};legSeason(legOwners());
  const R=(tid,k)=>rows(tid).find(x=>x.k===k);const meA=legAt(legMeK(),a),midA=R(a,aiA.id),oldB=R(b,gB.id),newB=R(b,aiB.id);
  assert.ok(meA.w===71&&meA.l===51&&meA.c===1&&meA.s===1,'돌아온 구단 '+JSON.stringify(meA));assert.ok(midA&&midA.w===9&&midA.l===11&&!midA.s,'복귀 전 AI '+JSON.stringify(midA));
  assert.ok(oldB&&oldB.w===14&&oldB.l===26,'B 원래 단장 '+JSON.stringify(oldB));assert.ok(newB&&newB.w===49&&newB.l===33&&newB.s===1,'B 후임 '+JSON.stringify(newB));});

test('사장 제안: 시즌 뒤 복귀한 단장에게 옛 재임으로 제안하지 않고, 떠나면 미결 제안이 끝난다',()=>{
  const u=G.user;team(u).indie=false;team(u).trust=80;G.gmRec={y:G.year,L:[{k:legMeK(),u:1,n:'나',t:u,s:15,y0:G.year-14,y1:G.year,w:900,l:800,c:0}]};myCInit();
  G.gmJoin={tid:u,y:G.year,psDone:true};assert.equal(legOwnerOffer(),null,'시즌 뒤 복귀에 제안');G.gmJoin=null;
  const P=legOwnerOffer();assert.ok(P&&P.s===15,'15시즌 제안');const m=G.mail.find(x=>(x.acts||[]).some(a=>a.a==='legPres'));assert.ok(m,'제안 소식');
  myCClose('이직');G.unemp={k:'leave'};assert.ok(!(m.acts||[]).some(a=>a.a==='legPres')&&m.read,'미결 소식이 남음');assert.match(legPresAns(1),/끝난 제안|답할 수 없습니다/);assert.equal(P.ans,null);});

test('훈련: 야인은 지시 없음, 구단별 방침 보존, 이적 선수 지시 정리, 합류 전 신인 거절',()=>{
  const a=G.user,b=other(),p=domestic(a).find(q=>!q.prospect&&!q.ys&&!(q.injOut>0));trnPolSet('grow');trnISet(p.id,3);assert.equal(trnI(p),3,'준비');
  G.unemp={k:'resign'};assert.equal(trnI(p),1,'야인 지시');G.unemp=null;
  switchTeam(b);assert.equal(trnPol(),'bal','새 구단에 옛 방침');trnPolSet('rec');switchTeam(a);assert.equal(trnPol(),'grow','돌아온 구단 방침 손실');assert.equal(trnI(p),3,'돌아온 구단 선수 지시 손실');
  mvLog('트레이드',p,a,b);p.team=b;assert.equal((G.trnI||{})[p.id],undefined,'이적 선수 지시 남음');
  const q=domestic(a).find(x=>!x.ys&&x.id!==p.id);q.joinY=G.year+1;const r=trnISet(q.id,3);assert.ok(!(G.trnI||{})[q.id]||/합류|훈련/.test(r),'합류 전 신인 지시 '+r);});

test('위임: 현금 조건을 평가에 넣고, 거절한 제안의 메일은 미결로 남기지 않는다',()=>{
  const b=other(),p=domestic(G.user)[0],q=domestic(b)[0];G.auto={};const off={id:'pr4-off',from:b,give:[q.id],get:[p.id],cash:20000,exp:G.day+7};G.offers=[off];
  const m=mail('단장','위임 테스트','본문');m.oid=off.id;assert.ok(Math.abs(troDiff({...off,cash:0})-troDiff(off)-80)<1e-6,'현금 비용 미반영');
  autoSet('tro','good');assert.ok(!G.offers.length,'불리한 제안이 남음');assert.ok(m.read,'메일이 미결로 남음');});

test('독립구단: 예약된 유니폼 제작비를 다시 쓸 수 없다',()=>{
  const t=team(G.user),p=domestic(G.user)[0];t.indie=true;G.spend={};prInit();const cost=Math.round((MEMO_FIX+MEMO_Q[0]*MEMO_C)*ecoIdx());t.cash=cost;
  const memo={data:{pid:p.id,nm:'테스트 유니폼'}};assert.ok(!EVH.memo.can(memo,0),'첫 제작비를 낼 수 없음');EVH.memo.pick(memo,0);
  assert.ok(EVH.memo.can(memo,0),'예약한 제작비를 다시 씀');assert.ok(EVH.truck.can({data:{F:{cost:1}}},1),'간담회 비용이 예약금을 씀');});

console.log(JSON.stringify({checked:results.length,failed,fails:results.filter(r=>!r.pass).map(r=>r.id)}));if(failed&&!baseline)throw Error(failed+' failed');
`)(assert,baseline);}finally{Math.random=old;}
