/* ===== 로스터 정리 ===== */
function fillRoster(tid,min){
  let n=playersOf(tid).length; const added=[];
  while(n<min){ const isP=playersOf(tid).filter(p=>p.isP).length<n*.52; const b=clamp(N(34,3),26,42);
    const p=newPlayer({age:ri(20,24),isP,base:b,pot:b+ri(0,12),team:tid,dev:true}); added.push(p); n++; }
  return added;
}
function trimRoster(tid,max){
  let ps=playersOf(tid).filter(p=>!p.foreign&&!p.ys); const out=[]; max=(max||ROSTER_MAX)-foreignOf(tid).length;
  const keep=p=>keepScore(p)+(team(tid).mode==='contend'?(p.age>=26?1:0):(p.age<=24?1:0));
  while(ps.length>max){ ps.sort((a,b)=>keep(a)-keep(b)); const p=ps.shift(); out.push(p); if(p.age<=24&&!p.faC&&p.pot-ovr(p)>=8&&ysN(tid)<YS_MAX){ p.ys=true; p.e1=false; p.sal=MIN_SAL; } else delete G.players[p.id]; }
  return out;
}
function mkScout(skill){ const region=pick(REG); return {id:'s'+Math.floor(R()*1e9),name:genName(),skill,region,role:'am',since:-999,sal:SCOUT_SAL[skill]}; }
/* 스카우트 업무: 아마추어(지역) · 프로(지역 연고 구단) · 해외(나라) 중 하나를 맡는다. 바꾸면 30일 적응 기간 동안 능력이 1 낮다. */
const SCOUT_MAX=6;
const SROLE={am:'아마추어',pro:'프로',intl:'해외'};
function effSkill(s){ return Math.max(1,s.skill-(G.day-(s.since??-999)<30?1:0)); }
function scoutOf(role,key){ const s=G.scouts.filter(x=>(x.role||'am')===role&&x.region===key).sort((a,b)=>effSkill(b)-effSkill(a))[0]; return s?Object.assign({},s,{skill:effSkill(s)}):null; }
function assignScout(id,role,key){ const s=G.scouts.find(x=>x.id===id); if(!s)return; if((s.role||'am')===role&&s.region===key)return; s.role=role; s.region=key; s.since=G.day; addLog(`${s.name} 스카우트를 ${SROLE[role]} ${role==='intl'?IREG[key].l:key} 담당으로 바꿨습니다.`); }
function scoutLoad(){ const c={}; for(const s of G.scouts)c[(s.role||'am')+':'+s.region]=(c[(s.role||'am')+':'+s.region]||0)+1; return c; }
function refreshScoutMarket(){ G.scoutMarket=[1,2,3,4].map(()=>mkScout(clamp(Math.round(N(2.8,1.1)),1,5))); try{ if(G.ob)G.scoutMarket=obCands('scout').slice(0,2).map(obScout).concat(G.scoutMarket); }catch(e){} }
function offerMailDone(oid){ for(const m of G.mail) if(m.oid===oid)m.read=true; }
function wire(kind,t,o){ o=o||{}; const w={d:G.day,k:kind,t,tid:o.tid??null,ref:o.ref??null}; if(o.x)w.x=o.x; (G.wire=G.wire||[]).unshift(w); if(G.wire.length>150)G.wire.length=150; }
function addLog(t){ G.log.unshift({y:G.year,d:G.day,t}); G.log=G.log.slice(0,80); }
function updateModes(){ const rs=G.teams.map(t=>({id:t.id,r:teamRating(t.id)})).sort((a,b)=>b.r-a.r); rs.forEach((x,i)=>team(x.id).mode=i<6?'contend':i<8&&R()<.5?'contend':'rebuild'); for(const t of G.teams){ if(G.user!=null&&t.id!==G.user&&t.cash<-5000)t.mode='rebuild'; } }
function supportCap(t){ return t.indie?0:Math.round(16000*(.5+t.trust/100))+(t.grant&&t.grant.y===G.year?t.grant.amt:0); }
/* 상한 초과 제재(2025년 개정 규정): 1회 초과분 30%, 2회 연속 50%, 3회 연속 100% + 다음 해 1라운드 지명권 9단계 하락. 하한 미달(2027년~)도 30%·50%·100% */
function capRate(n){ return n>=3?1:n===2?.5:.3; }
/* AI 구단은 상한을 지킨다: 가성비가 낮은 고액 선수부터 여유 있는 구단으로 넘기고(연봉 덜어내기 트레이드), 받을 곳이 없으면 방출한다 */
/* 야인일 때는 전 소속 구단도 AI가 운영한다 */
const ME=()=>G.unemp?-99:G.user;
function aiCapFix(tid,frac){ const t=team(tid); if(!t||tid===ME())return 0; const cap=capOf(G.year)*(frac||.985); let n=0, guard=0;
  while(capPay(tid)>cap&&guard++<12){
    const core=new Set(domestic(tid).sort((a,b)=>ovr(b)-ovr(a)).slice(0,4).map(p=>p.id));
    const c=domestic(tid).filter(p=>!core.has(p.id)&&!isRookie(p)&&p.sal>=150&&!(p.joinY>G.year)).sort((a,b)=>aiVal(t,a)/a.sal-aiVal(t,b)/b.sal)[0];
    if(!c)break;
    const rc=G.teams.filter(x=>x.id!==tid&&x.id!==ME()&&capPay(x.id)+c.sal<=capOf(G.year)*.95&&rosterN(x.id)<ROSTER_MAX-1&&aiVal(x,c)>=Math.max(.5,c.sal/400)).sort((a,b)=>(capPay(a.id))-(capPay(b.id)))[0];
    if(rc){ c.team=rc.id; c.listed=false; for(const k in G.lineup)if(G.lineup[k]===c.id)delete G.lineup[k]; story(c,`연봉 덜어내기 트레이드로 ${tname(rc.id)} 이적`,'move'); wire('트레이드',`${tname(tid)}, 샐러리캡 맞추려 ${c.name}(${money(c.sal)})을 ${tname(rc.id)}로 보냄`,{tid,ref:c.id}); }
    else { const cost=c.faC?Math.round(c.sal*Math.max(1,c.yrs)*.5):0; t.cash-=cost; story(c,`${tname(tid)}에서 방출`,'move'); wire('방출',`${tname(tid)}, 샐러리캡 때문에 ${c.name}(${money(c.sal)}) 방출`,{tid,ref:c.id}); delete G.players[c.id]; }
    n++; }
  return n; }
function capWarnUser(){ const ci=capInfo(G.user); const t=team(G.user); if(ci.over<=0)return; const n=(t.capOver||0)+1;
  stop('재정',`연봉 재계약 기준으로 우리 상위 40명 연봉이 ${money(ci.pay)}로 상한 ${money(ci.cap)}을 ${money(ci.over)} 넘습니다. 시즌 끝까지 넘으면 초과분의 ${Math.round(capRate(n)*100)}%를 야구발전기금으로 냅니다${n>=3?'. 3회 연속이라 다음 해 1라운드 지명 순서도 9단계 내려갑니다':''}. 트레이드나 방출로 줄일 수 있습니다.`); }
/* 하한(2027년~)에 못 미치는 AI 구단은 주축 선수 연봉을 올려(다년계약) 하한을 맞춘다 */
function aiFloorFix(tid){ if(tid===ME()||G.year<2027)return; const fl=floorOf(G.year); let gap=fl*1.02-capPay(tid); if(gap<=0)return; const t=team(tid);
  const ps=domestic(tid).filter(p=>!isRookie(p)&&!p.ys&&!(p.joinY>G.year)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,8); const tot=sum(ps.map(p=>ovr(p)));
  for(const p of ps){ const add=round5(gap*ovr(p)/tot); p.sal=round5(p.sal+add); if(!p.faC){ p.faC=true; p.ext=true; p.yrs=Math.max(p.yrs||0,2); } }
  wire('구단',`${t.city} ${t.nick}, 연봉 하한 맞추려 주축 선수들과 다년계약`,{tid}); }
function aiCapAll(frac){ for(const t of G.teams)if(t.id!==ME())try{ aiFloorFix(t.id); }catch(e){} let n=0; for(const t of G.teams)if(t.id!==ME())n+=aiCapFix(t.id,frac); return n; }
/* 12월 이사회: 다음 해 상한을 정한다. 상한 가까이 붙은 구단이 많으면(연봉 인플레이션) 크게 올린다 */
function capCouncil(){ const y=G.year+1; if(y<=2028)return; G.capY=G.capY||{}; if(G.capY[y])return;
  const cap=capOf(G.year); const near=G.teams.filter(t=>capPay(t.id)>=cap*.97).length; const over=G.teams.filter(t=>(t.capOver||0)>0).length;
  const up=near+over>=5?.08:near+over>=3?.05:.03; G.capY[y]=Math.round(cap*(1+up));
  const why=up>=.08?`상한에 붙은 구단이 ${near}곳, 지난 시즌 초과 구단이 ${over}곳으로 연봉 인플레이션이 커 크게 올렸습니다`:up>=.05?`상한 가까이 붙은 구단이 늘어 인상 폭을 키웠습니다`:'물가 수준만 반영했습니다';
  news('리그',`KBO 이사회, ${y}년 경쟁균형세 상한 ${money(G.capY[y])}로 ${Math.round(up*100)}% 상향`,`${why}. 하한은 ${money(floorOf(y))}입니다.`,0);
  note('일정',`KBO 이사회가 ${y}년 경쟁균형세 상한을 ${money(G.capY[y])}(${Math.round(up*100)}% 상향)로 정했습니다. ${why}.`); }
function capInfo(tid){ const pay=capPay(tid), cap=capOf(G.year); return {pay,all:payroll(tid),cap,floor:floorOf(G.year),over:Math.max(0,pay-cap)}; }

