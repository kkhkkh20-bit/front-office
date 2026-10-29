/* ===== 로스터 정리 ===== */
function fillRoster(tid,min){
  let n=rosterN(tid); const added=[]; /* 육성선수는 빼고 정식 선수 수로 센다 */
  while(n<min){ const isP=playersOf(tid).filter(p=>p.isP).length<n*.52; const b=clamp(N(34,3),26,42);
    const p=newPlayer({age:ri(20,24),isP,base:b,pot:b+ri(0,12),team:tid,dev:true}); added.push(p); n++; }
  return added;
}
/* AI 구단 육성선수 한도: 사용자는 규정 한도(YS_MAX)까지 쓸 수 있지만 AI는 해마다 쌓이지 않게 8명 안팎만 둔다 */
const AI_YS_MAX=8;
function trimRoster(tid,max){
  let ps=playersOf(tid).filter(p=>!p.foreign&&!p.ys); const out=[]; max=(max||ROSTER_MAX)-foreignOf(tid).length; const ysCap=tid===G.user?YS_MAX:AI_YS_MAX;
  const keep=p=>keepScore(p)+(team(tid).mode==='contend'?(p.age>=26?1:0):(p.age<=24?1:0));
  while(ps.length>max){ ps.sort((a,b)=>keep(a)-keep(b)); const p=ps.shift(); out.push(p); if(p.age<=24&&!p.faC&&p.pot-ovr(p)>=8&&ysN(tid)<ysCap){ p.ys=true; p.e1=false; p.sal=MIN_SAL; } else if(p.age<=35&&ovr(p)>=30)toFree(p,`${tname(tid)}에서 방출`); else delete G.players[p.id]; }
  return out;
}
/* AI 구단 겨울 정리: 육성선수는 25세가 넘거나 한도를 넘으면 내보낸다(실제 구단도 해마다 10명 안팎을 정리한다).
   정식 선수는 newYear에서 61명까지 줄이고, 시즌 중 군 제대·부상 대체로 늘어나는 몫을 남겨 둔다 */
function aiYsPrune(tid){ if(tid===ME())return 0; const ys=playersOf(tid).filter(p=>p.ys&&!p.foreign).sort((a,b)=>keepScore(b)-keepScore(a)); let n=0;
  ys.forEach((p,i)=>{ if(p.age>=26||i>=AI_YS_MAX||p.pot<=ovr(p)+2){ if(p.age<=33&&ovr(p)>=30)toFree(p,`${tname(tid)}에서 방출(육성선수 정리)`); else delete G.players[p.id]; n++; } }); return n; }
/* 스카우트 특기: 투수 감별·타자 감별은 그 유형 선수를 볼 때 능력이 한 단계 높다. 경력은 성격 묘사용 */
const SC_SPEC={P:'투수 감별',B:'타자 감별'};
const SC_CAR=['전 프로 투수','전 프로 포수','전 프로 내야수','전 프로 외야수','고교 감독 출신','대학 코치 출신','전력분석원 출신','야구 기자 출신','해외 리그 코치 출신','독립리그 감독 출신'];
function mkScout(skill){ const region=pick(REG); const x=R(); const spec=x<.4?'P':x<.75?'B':null; return {id:'s'+Math.floor(R()*1e9),name:genName(),skill,region,role:'am',since:-999,sal:SCOUT_SAL[skill],spec,car:pick(SC_CAR),age:ri(31,63)}; }
function scSd(sc,p){ if(!sc)return SCOUT_SD[0]; const b=sc.spec&&p&&((sc.spec==='P')===!!p.isP)?1:0; return SCOUT_SD[clamp(sc.skill+b,0,5)]; }
/* 스카우트 업무: 아마추어(지역) · 프로(지역 연고 구단) · 해외(나라) 중 하나를 맡는다. 바꾸면 30일 적응 기간 동안 능력이 1 낮다. */
const SCOUT_MAX=6;
const SROLE={am:'아마추어',pro:'프로',intl:'해외'};
function effSkill(s){ return Math.max(1,s.skill-(G.day-(s.since??-999)<30?1:0)); }
function scoutOf(role,key){ const s=G.scouts.filter(x=>(x.role||'am')===role&&x.region===key).sort((a,b)=>effSkill(b)-effSkill(a))[0]; return s?Object.assign({},s,{skill:effSkill(s)}):null; }
function assignScout(id,role,key){ const s=G.scouts.find(x=>x.id===id); if(!s)return; if((s.role||'am')===role&&s.region===key)return; s.role=role; s.region=key; s.since=G.day; addLog(`${s.name} 스카우트를 ${SROLE[role]} ${role==='intl'?IREG[key].l:key} 담당으로 바꿨습니다.`); }
function scoutLoad(){ const c={}; for(const s of G.scouts)c[(s.role||'am')+':'+s.region]=(c[(s.role||'am')+':'+s.region]||0)+1; return c; }
/* 스카우트 후보 12명. 매달 일부가 다른 구단으로 가고 새 후보가 들어온다 */
const SC_MKT=12; function scSkillRoll(){ return clamp(Math.round(N(2.45,1.0)),1,5); }
function scoutMkt(){ const mk=G.year*100+dobj(G.day).m; if(!G.scoutMarket)G.scoutMarket=[]; if(G.scoutMarketM!==mk){ G.scoutMarket=G.scoutMarket.filter(s=>s.ob||R()<.6); while(G.scoutMarket.length<SC_MKT)G.scoutMarket.push(mkScout(scSkillRoll())); G.scoutMarketM=mk; } return G.scoutMarket; }
function refreshScoutMarket(){ G.scoutMarket=Array.from({length:SC_MKT},()=>mkScout(scSkillRoll())); G.scoutMarketM=G.year*100+dobj(G.day).m; try{ if(G.ob)G.scoutMarket=obCands('scout').slice(0,2).map(obScout).concat(G.scoutMarket); }catch(e){} }
function offerMailDone(oid){ for(const m of G.mail) if(m.oid===oid)m.read=true; }
function wire(kind,t,o){ o=o||{}; const w={d:G.day,k:kind,t,tid:o.tid??null,ref:o.ref??null}; if(o.x)w.x=o.x; (G.wire=G.wire||[]).unshift(w); if(G.wire.length>150)G.wire.length=150; }
function addLog(t){ G.log.unshift({y:G.year,d:G.day,t}); G.log=G.log.slice(0,80); }
function updateModes(){ const rs=G.teams.map(t=>({id:t.id,r:teamRating(t.id)})).sort((a,b)=>b.r-a.r); rs.forEach((x,i)=>team(x.id).mode=i<6?'contend':i<8&&R()<.5?'contend':'rebuild'); for(const t of G.teams){ if(G.user!=null&&t.id!==ME()&&t.cash<-5000)t.mode='rebuild'; } }
function supportCap(t){ return t.indie?0:Math.max(0,Math.round(16000*ecoIdx()*(.5+t.trust/100))-(t.supCut&&t.supCut.y===G.year?t.supCut.amt:0))+(t.grant&&t.grant.y===sponSeason()?t.grant.amt:0); } /* 지원금은 그 시즌 몫(결산 뒤 겨울에 받으면 다음 시즌) */ /* 쌓인 현금이 많으면 그만큼 지원 한도가 줄어든다(supCut) */
/* 상한 초과 제재(2025년 개정 규정): 1회 초과분 30%, 2회 연속 50%, 3회 연속 100% + 다음 해 1라운드 지명권 9단계 하락 */
function capRate(n){ return n>=3?1:n===2?.5:.3; }
/* 하한 미달(2027년~): 모자란 금액의 50%, 2회 연속 60%, 3회 연속부터 75%를 발전기금으로 낸다.
   상한 제재처럼 100%까지 오르면 하한을 못 맞춘 가난한 구단이 더 가난해지는 악순환이 생겨 완만하게 둔다 */
function floorRate(n){ return n>=3?.75:n===2?.6:.5; }
/* AI 구단은 상한을 지킨다: 가성비가 낮은 고액 선수부터 여유 있는 구단으로 넘기고(연봉 덜어내기 트레이드), 받을 곳이 없으면 방출한다 */
/* 야인일 때는 전 소속 구단도 AI가 운영한다 */
const ME=()=>G.unemp?-99:G.user;
function aiCapFix(tid,frac,noRel,maxN){ const t=team(tid); if(!t||tid===ME())return 0; const cap=capOf(G.year)*(frac||.985); let n=0, guard=0;
  while(capPay(tid)>cap&&guard++<12&&n<(maxN||99)){
    const core=new Set(domestic(tid).sort((a,b)=>ovr(b)-ovr(a)).slice(0,4).map(p=>p.id));
    const c=domestic(tid).filter(p=>!core.has(p.id)&&!isRookie(p)&&p.sal>=150&&!(p.joinY>G.year)).sort((a,b)=>aiVal(t,a)/a.sal-aiVal(t,b)/b.sal)[0];
    if(!c)break;
    const rc=G.teams.filter(x=>x.id!==tid&&x.id!==ME()&&(x.cash||0)>-2000&&capPay(x.id)+c.sal<=capOf(G.year)*.95&&rosterN(x.id)<ROSTER_MAX-1&&aiVal(x,c)>=Math.max(.5,c.sal/400)).sort((a,b)=>(capPay(a.id))-(capPay(b.id)))[0];
    if(rc){ termsClear(c); c.team=rc.id; c.listed=false; for(const k in G.lineup)if(G.lineup[k]===c.id)delete G.lineup[k]; story(c,`연봉 덜어내기 트레이드로 ${tname(rc.id)} 이적`,'move'); wire('트레이드',`${tname(tid)}, ${noRel?'적자를 줄이려':'샐러리캡 맞추려'} ${c.name}(${money(c.sal)})을 ${tname(rc.id)}로 보냄`,{tid,ref:c.id}); }
    else if(noRel)break;
    else { const cost=c.faC?Math.round(c.sal*Math.max(1,c.yrs)*.5):0; t.cash-=cost; wire('방출',`${tname(tid)}, 샐러리캡 때문에 ${c.name}(${money(c.sal)}) 방출`,{tid,ref:c.id}); if(c.age<=35&&ovr(c)>=30)toFree(c,`${tname(tid)}에서 방출(샐러리캡)`); else { story(c,`${tname(tid)}에서 방출`,'move'); delete G.players[c.id]; } } /* 로스터 정리와 같은 기준: 뛸 만한 선수는 무적 시장으로 */
    n++; }
  return n; }
function capWarnUser(){ const ci=capInfo(G.user); const t=team(G.user); if(ci.over<=0)return; const n=(t.capOver||0)+1;
  stop('재정',`연봉 재계약 기준으로 우리 상위 40명 연봉이 ${money(ci.pay)}으로 상한 ${money(ci.cap)}을 ${money(ci.over)} 넘습니다. 시즌 끝까지 넘으면 초과분의 ${Math.round(capRate(n)*100)}%를 야구발전기금으로 냅니다${n>=3?'. 3회 연속이라 다음 해 1라운드 지명 순서도 9단계 내려갑니다':''}. 트레이드나 방출로 줄일 수 있습니다.`); }
/* 하한(2027년~)에 못 미치는 AI 구단은 주축 선수 연봉을 올려(다년계약) 하한을 맞춘다 */
/* 군 입대·부상 이탈로 시즌 중 상위 40명 연봉이 줄어드므로 5% 여유를 두고 맞춘다. 시즌 막판(9월 1일·정규시즌 종료)에도 한 번 더 확인한다 */
function aiFloorFix(tid){ if(tid===ME()||G.year<2027)return; const fl=floorOf(G.year); let gap=fl*1.05-capPay(tid); if(gap<=0)return; const t=team(tid); if((t.cash||0)<-3000)return; /* 빚이 큰 구단은 연봉을 억지로 올리지 않고 하한 미달 발전기금을 낸다 */
  const ps=domestic(tid).filter(p=>!isRookie(p)&&!p.ys&&!(p.joinY>G.year)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,8); const tot=sum(ps.map(p=>ovr(p)));
  for(const p of ps){ const add=round5(gap*ovr(p)/tot); p.sal=round5(p.sal+add); if(!p.faC){ p.faC=true; p.ext=true; p.yrs=Math.max(p.yrs||0,2); p.cyrs=p.yrs; } }
  wire('구단',`${t.city} ${t.nick}, 연봉 하한 맞추려 주축 선수들과 다년계약`,{tid}); }
/* 빚이 깊은 AI 구단(현금 -40억 아래): 모기업이 허리띠를 졸라맨다. 고액 베테랑을 여유 있는 구단에 넘겨 상위 40명 연봉을 상한의 80%까지 낮춘다(방출 위약금은 빚을 늘리므로 트레이드만) */
function aiDebtDump(){ let n=0; for(const t of G.teams){ if(t.id===ME()||t.cash>=-4000)continue; t.mode='rebuild'; n+=aiCapFix(t.id,.8,true,3); } return n; }
function aiCapAll(frac){ for(const t of G.teams)if(t.id!==ME())try{ aiFloorFix(t.id); }catch(e){} let n=0; for(const t of G.teams)if(t.id!==ME())n+=aiCapFix(t.id,frac); return n; }
/* 경쟁균형세 상한 결정(capCouncil)은 68_assoc.js의 실행위원회·이사회로 옮겼다 */
function capInfo(tid){ const pay=capPay(tid), cap=capOf(G.year); return {pay,all:payroll(tid),cap,floor:floorOf(G.year),over:Math.max(0,pay-cap)}; }

