/* ===== 스토브리그 ===== */
function offseason(){ try{ if(G.startY&&G.year>=G.startY+2&&!G.fdRev&&!G.unemp)fdReview(); }catch(e){} for(const t of G.teams){ if(t.id!==G.user&&t.cash<-5000)t.mode='rebuild'; }
  const retired=[], declared=[], obs=[];
  for(const p of Object.values(G.players)){
    /* 외국인 선수도 나이가 들면 은퇴한다(40세, 또는 37세 이상에 기량이 떨어지면) */
    if(p.foreign&&p.team!=null&&(p.age>=40||(p.age>=37&&ovr(p)<52))){ retired.push({name:p.name,team:p.team,age:p.age}); try{ story(p,`${p.age}세로 은퇴`,'move'); }catch(e){} for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; p.team=null; p.fleft=true; p.retY=G.year; continue; }
    if(p.team==null||p.foreign||p.joinY>G.year)continue;
    const o=ovr(p);
    if(p.age>=40||(p.age>=35&&o<44)||(p.age>=32&&o<34&&!p.faC)){ try{ legendRetire(p); }catch(e){} retired.push({name:p.name,team:p.team,age:p.age}); const rec=retireRecord(p); try{ obs.push(obFromPlayer(p,rec)); }catch(e){} for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; delete G.players[p.id]; }
  }
  const all=Object.values(G.players).filter(p=>p.team!=null&&!(p.joinY>G.year));
  /* FA 등록일수(실제는 시즌 145일 이상 1군 등록): 게임에서는 1군에서 시즌 대부분을 보낸 해를 인정(야수 85경기·260타석, 투수 40경기·90이닝·선발 16경기 중 하나). 팀당 한 해 16명 안팎이 채운다 */
  const svcOk=p=>{ const h=seasonTotal(p,G.year,'1군'); if(!h)return false; return p.isP?((h.g||0)>=40||(h.outs||0)>=270||(h.gs||0)>=16):((h.g||0)>=85||(h.pa||0)>=260); };
  all.forEach(p=>{ if(p.foreign||svcOk(p))p.svc++; delete p.extTried; delete p.extOk;});
  for(const p of all){ if(p.foreign)continue; p.salH=(p.salH||[]).filter(x=>x.y!==G.year); p.salH.push({y:G.year,s:p.sal}); if(p.salH.length>4)p.salH.shift(); }
  try{ aiExtensions(all); }catch(e){}
  const pool=[];
  for(const p of all){
    if(p.foreign)continue;
    if(p.extNext){ termsClear(p); if(p.extNext.terms)termsApply(p,p.extNext.terms,'ext',G.year+1,true); p.sal=p.extNext.annual; p.yrs=p.extNext.years; p.cyrs=p.extNext.years; p.faC=true; p.ext=true; delete p.extNext; continue; }
    if(p.faC){ p.yrs--; if(p.yrs>0)continue; p.faC=false; p.ext=false; delete p.cyrs; }
    const elig=p.svc>=faSvc(p)&&(p.lastFA==null||G.year-p.lastFA>=4)&&p.age<=37;
    /* 자격이 있어도 신청은 선수 몫: 시장 가치가 낮거나 나이가 많으면 신청하지 않고 남는다 */
    const o2=ovr(p); let dp=o2>=58?.97:o2>=52?.8:o2>=48?.34:o2>=44?.1:.03; /* 애매한 선수는 시장에 나가 봐야 헐값 1년이라 대부분 신청하지 않는다 */ if(p.age>=35)dp*=.5; if(p.faSkip)dp+=.1;
    if(elig&&R()>=dp){ p.faSkip=G.year; if(p.team===G.user)(G._faSkip=G._faSkip||[]).push(p.name); continue; }
    if(elig){ delete p.faSkip; const grade=faGradeOf(p,all);
      p.faFrom=p.team; p.faGrade=grade; p.faPrevSal=p.sal; faMktFix(G.year); p.ask=faAsk(p); p.ask0=p.ask.annual; try{ agentOf(p); }catch(e){} p.team=null; pool.push(p.id);
      for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k];
      if(p.faFrom===G.user)declared.push(p.id); }
  }
  try{ ovsFA(pool); }catch(e){}
  G.fa={pool,offers:{},ai:{},open:false,openDay:KD(11,6),closed:false,results:[],cap:pool.length<=20?2:3,outN:{},y0:G.year};
  if(G._faSkip&&G._faSkip.length){ note('FA',`FA 자격이 있지만 신청하지 않고 남은 우리 선수: ${G._faSkip.join(', ')}. 내년에도 자격은 유지됩니다.`); } G._faSkip=null;
  G.retired=retired; G.rolled=G.year; try{ obRetireEvents(obs); }catch(e){} try{ abroadYear(); }catch(e){} try{ fOverseas(); }catch(e){} try{ postingSeason(); }catch(e){}
  const mine=retired.filter(r=>r.team===G.user);
  stop('스토브리그',`스토브리그가 시작되었습니다. 은퇴 ${retired.length}명(우리 ${mine.length}명), FA 자격 ${pool.length}명(우리 ${declared.length}명). 11월 2일 FA 공시, 6일부터 협상, 12월 1일 연봉 협상이 시작됩니다.`);
}
function faAnnounce(){ if(!G.fa)return; G.fa.open=true; try{ agYear(); agPitch(); }catch(e){} const mine=G.fa.pool.filter(id=>G.players[id]&&G.players[id].faFrom===G.user).length;
  stop('FA',`FA 승인 선수 ${G.fa.pool.length}명이 공시되었습니다. 우리 구단 ${mine}명. 다른 구단 FA는 구단마다 ${faCapN()}명까지 영입할 수 있습니다(${ASSOC.s} 규약 제173조). 11월 6일부터 모든 구단과 협상합니다. 영입·계약 → FA 시장에서 조건을 제시하세요.`); }
function faCapN(){ const F=G.fa; return F&&F.cap?F.cap:(F&&F.pool&&F.pool.length>20?3:2); }
function faOutN(tid){ const F=G.fa; return F&&F.outN?(F.outN[tid]||0):0; }
function faOutBlocked(tid,p){ return tid!==p.faFrom&&faOutN(tid)>=faCapN(); }
/* AI 구단이 매기는 FA의 값: 요구액이 아니라 능력·나이로 정한다(인플레이션 억제) */
/* AI 구단의 비FA 다년계약: 상한 여유가 있으면 FA를 앞둔(또는 막 자격을 얻은) 핵심 선수를 미리 묶는다(실제 KBO의 비FA 다년계약 흐름).
   선수풀이 작아 시장에 내보내면 잡기 어렵다는 계산이다. 새 계약은 다음 시즌부터(extNext) */
function aiExtensions(all){ const done=[];
  for(const t of G.teams){ if(t.id===G.user||t.cash<-3000)continue; let room=capOf(G.year+1)*(t.mode==='contend'?1.0:.96)-capPay(t.id); let n=0;
    const C=all.filter(p=>p.team===t.id&&!p.foreign&&!p.extNext&&!p.faC&&!p.ext&&p.age<=33&&ovr(p)>=56&&faSvc(p)-(p.svc||0)<=1&&faSvc(p)-(p.svc||0)>=0).sort((a,b)=>ovr(b)-ovr(a));
    for(const p of C){ if(n>=2)break; const ytf=faSvc(p)-(p.svc||0); const years=p.age<=29?4:p.age<=32?3:2; const d=round5(extDemand(p,years)*(hasAgent(p)?agExtMul(p):1));
      if(d-p.sal>room)continue; if(R()>(ytf===0?.4:.28)*(t.mode==='contend'?1.2:1))continue;
      p.extNext={annual:d,years}; room-=d-p.sal; n++; story(p,`비FA 다년계약 ${years}년 연 ${money(d)} (${tshort(t.id)})`,'move'); done.push({p,t,d,years}); } }
  for(const x of done.filter(x=>x.d>=800).slice(0,4))wire('계약',`${tname(x.t.id)}, ${x.p.name}와(과) 비FA 다년계약 ${x.years}년 총 ${money(x.d*x.years)}`,{tid:x.t.id,ref:x.p.id});
  return done.length; }
function faWorth(t,p){ const pf=perfOvr(p,3); const base=pf==null?ovr(p):pf*.6+ovr(p)*.4; const af=p.age<30?1.12:p.age<=32?1:p.age<=34?.75:.55; return round5(Math.max(MIN_SAL,marketSal(base)*af*(t.id===p.faFrom?1.05:1)*(t.mode==='contend'?1.04:.94)*faMktNow()*(ovr(p)>=60?1.12:ovr(p)>=54?1.06:1))); } /* 선수풀이 작아 쓸 만한 FA에는 웃돈이 붙는다 */
function faInterest(t,p){
  const room=capOf(G.year)-capPay(t.id); const po=ovr(p)+hn('o'+t.id,p.id)*3;
  if(faOutBlocked(t.id,p))return 0;
  if(t.id!==ME()&&capPay(t.id)+p.ask.annual*.9>capOf(G.year)*((t.id===p.faFrom?1.02:1)+(t.mode==='contend'&&t.cash>3000?.04:0)))return 0;
  if(t.id!==p.faFrom&&t.cash<-3000)return 0;
  if(t.id!==p.faFrom&&ovr(p)<47)return 0;
  /* 보상 비용(보상금)을 계약 총액과 견준다: 몸값보다 보상금이 크면 외부 구단은 거의 손대지 않는다 */
  let compF=1; if(t.id!==p.faFrom){ const ps=p.faPrevSal||p.sal||0; const cc=p.faGrade==='A'?ps*2:p.faGrade==='B'?ps:ps*1.5; compF=clamp(1-cc/Math.max(1,p.ask.annual*p.ask.years*.8),.08,1);
    if(t.id!==ME()&&t.cash-cc<-2500)return 0; } /* 보상금을 내면 현금이 크게 마이너스가 되는 AI 구단은 외부 FA를 포기한다 */
  const debt=t.id===p.faFrom&&t.id!==ME()&&(t.cash<-5000||capPay(t.id)>capOf(G.year)*1.1)?.35:1;
  if(t.cash<-8000&&t.id!==p.faFrom)return 0;
  if(p.ask.annual>room*1.15&&t.owner==='profit')return 0;
  if(p.ask.annual>room*1.5)return 0;
  /* 연봉 총액이 낮은 구단(하한 근처)은 돈을 쓸 이유가 있다 */
  const low=(capPay(t.id)<capOf(G.year)*.5?.22:capPay(t.id)<capOf(G.year)*.65?.1:0)+(t.cash>6000?.08:0);
  return compF*clamp(.12+low+agDealBonus(agentOf(p),t.id)+(po-50)*.03+(t.mode==='contend'?.12:0)+needScore(t.id,p)*.18+(t.id===p.faFrom?.45:0)-(t.id!==p.faFrom&&p.faGrade==='A'?.12:0)-(playersOf(t.id).length>=39?.25:0),0,1)*debt;
}
function faDay(day){
  const F=G.fa; const since=day-F.openDay;
  /* 협상 시작일: 미리 낸 제안에 에이전트가 답한다 */
  if(day===F.openDay&&!G.unemp){ const pre=Object.keys(F.offers||{}).filter(id=>!(F.neg&&F.neg[id])); const L=[]; for(const id of pre){ const p=G.players[id]; if(!p||p.team!=null)continue; const o=F.offers[id]; try{ const r=faNegotiate(+id,{annual:o.annual,years:o.years,...(o.terms?{terms:o.terms}:{})}); L.push(`${p.name}: ${r.msg}`); }catch(e){} }
    if(L.length)mail('운영팀',`미리 낸 FA 제안 ${L.length}건에 답이 왔습니다`,L.join('\n\n'),{kind:'FA',imp:true,acts:[{l:'FA 시장',a:'go',v:'transfer:fa'}]}); }
  if(day===F.openDay){ const mine=F.pool.filter(id=>G.players[id]&&G.players[id].faFrom===G.user&&G.players[id].team==null); stop('FA',`오늘부터 모든 구단과 FA 협상이 열립니다.${mine.length?` 우리 FA ${mine.length}명(${mine.slice(0,4).map(id=>G.players[id].name).join(', ')}${mine.length>4?' 등':''})에게 다른 구단도 제안할 수 있습니다.`:''} 영입·계약 → FA 시장에서 조건을 제시하세요.`); }
  F.warned=F.warned||{};
  if(day===F.openDay&&!G.unemp){ const top=F.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.faFrom!==G.user).sort((a,b)=>ovr(b)-ovr(a)).slice(0,5);
    if(top.length)mail('스카우트팀장','FA 시장 개장: 주요 선수 5명',top.map((p,i)=>`${i+1}. ${p.name} (${posLabel(p)}, ${p.age}세, ${p.faGrade}등급, 원소속 ${tshort(p.faFrom)}) · 요구 연 ${money(p.ask.annual)} ${p.ask.years}년`).join('\n')+'\n\n관심 선수로 별표를 해 두면 다른 구단이 제안할 때 바로 알려 드립니다.',{kind:'FA',acts:[{l:'FA 시장',a:'goWork',v:'FA시장'}]}); }
  /* 찾는 구단이 없으면 요구액이 매주 내려간다(최초 요구의 40%까지) */
  if(since>0&&since%7===0)for(const id of F.pool){ const p=G.players[id]; if(!p||p.team!=null)continue; const ai=F.ai[id]||{}; if(Object.keys(ai).length||F.offers[id])continue; const a0=p.ask0||p.ask.annual; const na=round5(Math.max(a0*.4,MIN_SAL,p.ask.annual*.9)); if(na<p.ask.annual){ p.ask.annual=na; if(since>=35)p.ask.years=Math.min(p.ask.years,since>=50&&p.age>=33?1:2); } }
  for(const id of [...F.pool]){
    const p=G.players[id]; if(!p||p.team!=null)continue;
    const ai=F.ai[id]||(F.ai[id]={});
    const po=ovr(p);
    for(const t of G.teams){ if((t.id===G.user&&!G.unemp)||ai[t.id])continue; const own=t.id===p.faFrom;
      /* 애매한 선수는 원소속 구단도 서두르지 않는다: 시장 반응을 본 뒤(협상 50일 이후) 낮춰 부른다 */
      if(own&&po<50&&since<50)continue;
      let it=faInterest(t,p); if(!own)it*=po<52?.35:.7; if(it>0&&R()<it*.1){ const w=faWorth(t,p)*(own&&po<50?.65:1); ai[t.id]={annual:round5(Math.min(p.ask.annual*rnd(.92,1.15),w)),years:own&&po<50?(p.age<=30?2:1):clamp(p.ask.years+ri(-1,0)+(p.age<=28&&po>=62&&R()<.3?1:0),p.age<=31?2:1,p.age<=28&&po>=62?5:4)}; } } /* 서른 안팎까지는 보통 2년 이상 보장한다(1+1 포함) */
    if(p.faFrom!==G.user&&!G.unemp&&!F.offers[id]&&!F.warned[id]&&((G.shortlist||[]).includes(id)||mreqOpen('fa').some(r=>r.data&&r.data.pid===id))&&Object.keys(ai).some(k=>+k!==G.user)){ F.warned[id]=1; const k0=Object.keys(ai).find(k=>+k!==G.user); stop('FA',`관심 FA ${p.name}에게 ${tname(+k0)}이(가) 제안했습니다(연 ${money(ai[k0].annual)} · ${ai[k0].years}년). 잡으려면 서둘러 조건을 제시하세요.`,id); }
    if(p.faFrom===G.user&&!F.offers[id]&&!F.warned[id]&&Object.keys(ai).some(k=>+k!==G.user)){ F.warned[id]=1; const k0=Object.keys(ai).find(k=>+k!==G.user); stop('FA',`우리 FA ${p.name}에게 ${tname(+k0)}이(가) 먼저 제안했습니다. 잡으려면 FA 시장에서 조건을 제시하세요.`,id); }
    const offers=Object.entries(ai).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years}));
    const uo=F.offers[id]; if(uo){ offers.push({tid:G.user,annual:uo.annual,years:uo.years,...(uo.terms?{terms:uo.terms}:{})}); faAgentPing(id); }
    if(!offers.length)continue;
    /* 대어: 시장 확인 라운드를 다 돌기 전에는 사인하지 않는다 */
    const mk=agMk(p); if(mk&&!mk.done){ agShopTick(p,mk,ai,day); if(!mk.done)continue; }
    const ng=F.neg&&F.neg[id];
    const pr=mk&&mk.done?1:(.04+since*.006+(offers.length>=2?.04:0)+(p.ask.annual<500?.03:0))*(ovr(p)>=52||offers.length>=2?1:.45)+(ng&&ng.deal?.35:ng&&ng.hot?.08:0);
    if(R()<pr)faSign(p,offers);
  }
}
/* 선수가 제안을 비교하는 점수: 연봉·기간, 원소속 구단 정(애착·기분), 우리 구단과의 협상 분위기·에이전트 친분, 에이전트 거래 실적.
   에이전트 시장 보고도 이 점수로 '누가 앞서는지'를 말한다(보고와 결과가 어긋나지 않게) */
function faScore(p,o){ const home=1.08+((p.pers?p.pers.loy:10)-10)/100+((p.mor??60)-60)/300; const ng=G.fa&&G.fa.neg&&G.fa.neg[p.id]; const ag=agentOf(p);
  const relK=(agRel(ag)-50)/1000*(ag.size==='big'?2:1)*(ag.style==='rel'?2:1);
  if(o.tid===G.user&&ng&&ng.closed)return -1;
  return o.annual*(1+.06*(o.years-1))*(o.tid===p.faFrom?home:1)*(o.tid===G.user&&ng?(ng.deal?1.06:ng.hot?1.02:1)*(.9+ng.mood/500):1)*(o.tid===G.user?1+relK:1)*(1+agDealBonus(ag,o.tid)*.25)*faAppeal(p,o.tid).f; /* 구단 매력: 명성·우승 가능성·출전 기회·연고 */ }
function faBestOf(p,offers){ let b=null,bs=-1; for(const o of offers){ const s=faScore(p,o); if(s>bs){bs=s;b=o;} } return b; }
function faSign(p,offers){
  offers=offers.filter(o=>!faOutBlocked(o.tid,p)); if(!offers.length)return;
  let best=null,bs=-1; const shop=agShopN(p)>0; const ng=G.fa&&G.fa.neg&&G.fa.neg[p.id];
  for(const o of offers){ if(o.tid===G.user&&ng&&ng.closed)continue; const sc=faScore(p,o)*(shop?1:rnd(.96,1.04)); if(sc>bs){bs=sc;best=o;} } /* 대어는 시장 보고 결과대로 결정한다 */
  if(!best)best=offers.find(o=>o.tid!==G.user)||offers[0];
  try{ agDealAdd(p,best.tid); const ag=agentOf(p); if(best.tid===G.user)agRelAdd(ag,5,`${p.name} 계약`); else if(G.fa.offers[p.id])agRelAdd(ag,1,`${p.name} 끝까지 경쟁`); }catch(e){}
  if(best.tid===G.user&&p.faFrom!==G.user&&G.faFund&&!G.faFund.done)G.faFund.used=true;
  const from=p.faFrom; p.team=best.tid; p.sal=Math.max(MIN_SAL,best.annual); p.yrs=best.years; p.cyrs=best.years; p.faC=true; p.ext=false; p.lastFA=G.year; p.faN=(p.faN||0)+1; p.faPrevGrade=p.faGrade;
  termsClear(p); const BT=best.tid===G.user&&best.terms?best.terms:null; if(BT){ p.sal=Math.max(MIN_SAL,BT.annual); termsApply(p,BT,'fa',ctSeason()); }
  const rec={id:p.id,name:p.name,from,to:best.tid,annual:BT?BT.annual+Math.round((BT.bonus||0)/best.years):best.annual,years:best.years,grade:p.faGrade,kind:p.ask0&&best.annual<p.ask0*.6?'cheap':'sign',day:G.day,ask0:p.ask0||null,...(BT?{terms:BT}:{})};
  story(p,best.tid===from?`FA 잔류 · ${tname(best.tid)} ${best.years}년 연 ${money(p.sal)}`:`FA 이적 · ${tname(best.tid)} ${best.years}년 연 ${money(p.sal)}`,'move');
  if(best.tid!==from){ try{ gmInc(best.tid,'fa'); if(rec.annual*best.years>=6000)gmInc(best.tid,'faBig'); }catch(e){} /* 단장 프로필: 외부 FA, 총액 60억 이상은 대형 */ if(G.fa){ G.fa.outN=G.fa.outN||{}; G.fa.outN[best.tid]=(G.fa.outN[best.tid]||0)+1; }
    try{ compStart(p,from,best.tid,rec); }catch(e){}
  }
  if(best.tid===G.user&&!G.unemp)chron('fa',from===G.user?`FA ${p.name} 잔류 (${ctRecShort(rec)})`:`FA ${p.name} 영입 (${ctRecShort(rec)})`,p.id); else if(from===G.user&&best.tid!==G.user&&!G.unemp)chron('fa',`FA ${p.name}, ${tshort(best.tid)}로 이적`,p.id);
  const userOffered=!!G.fa.offers[p.id];
  delete G.fa.offers[p.id]; G.fa.pool=G.fa.pool.filter(x=>x!==p.id); G.fa.results.unshift(rec); prFA(rec); try{ if(rec.to===G.user&&from!==G.user&&rec.annual>=700)ivRequest('fa_sign',{pid:p.id}); else if(from===G.user&&rec.to!==G.user&&rec.annual>=500)ivRequest('fa_lost',{pid:p.id}); }catch(e){} mvLog('FA',p,from,rec.to,`${from===rec.to?'잔류 ':''}${ctRecShort(rec)}`,rec.terms?ctRecMoney(rec).tot:rec.annual*rec.years);
  const tx=rec.terms?`${termsTxt(rec.terms,true)} · ${ctRecMoney(rec).txt}`:`${rec.years}년 연 ${money(rec.annual)}`;
  const t=rec.to===G.user?(from===G.user?`${p.name}와(과) 잔류 계약했습니다. ${tx}.`:`FA ${p.name}을(를) 영입했습니다. ${tx}.${rec.compPlayer?` 보상선수로 ${rec.compPlayer}이(가) 떠났습니다.`:''}${rec.compCash?` 보상금 ${money(rec.compCash)}.`:''}`)
    :from===G.user?`${p.name}이(가) ${tname(rec.to)}와(과) 계약했습니다(${rec.years}년 연 ${money(rec.annual)}).${rec.compPlayer?` 보상선수로 ${rec.compPlayer}을(를) 받았습니다.`:''}`
    :`${tname(rec.to)}이(가) FA ${p.name}(${p.faGrade}등급)을 ${rec.years}년 연 ${money(rec.annual)}에 잡았습니다.${userOffered?' 우리 제안은 밀렸습니다.':''}`;
  if(rec.to===G.user)addLog(t);
  if(rec.to===G.user||from===G.user||userOffered)stop('FA',t,p.id); else if(rec.grade!=='C'||rec.annual>=500)wire('FA',t,{ref:p.id,tid:rec.to});
  delete p.faFrom; delete p.ask;
}
function faClose(){
  const F=G.fa; let cheap=0, gone=0;
  for(const id of [...F.pool]){ const p=G.players[id]; if(!p||p.team!=null)continue;
    const ai=F.ai[id]||{}; const offers=Object.entries(ai).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})).filter(o=>!faOutBlocked(o.tid,p));
    if(F.offers[id])offers.push(Object.assign({tid:G.user},F.offers[id]));
    if(offers.length){ faSign(p,offers); continue; }
    const from=p.faFrom, t=team(from); const low=round5(Math.max(MIN_SAL,Math.min((p.faPrevSal||p.sal)*.5,marketSal(ovr(p))*.45)));
    /* 원소속 AI 구단이 쓸모를 인정하면 헐값 계약으로 붙잡는다(실제 2025년 하주석 1년 1억1천만원 등). 20대는 1+1처럼 2년으로 묶는 경우가 많다 */
    if(from!==G.user&&t&&p.age<=35&&aiVal(t,p)>=1&&capPay(from)+low<=capOf(G.year)&&rosterN(from)<ROSTER_MAX){ faSign(p,[{tid:from,annual:low,years:p.age<=28?2:1}]); const r=F.results[0]; if(r&&r.id===p.id){ r.kind='cheap'; } cheap++; wire('FA',`${p.name}, 원소속 ${tname(from)}와(과) ${p.yrs}년 연 ${money(low)} 헐값 계약`,{tid:from,ref:p.id}); continue; }
    /* 연봉 하한에 못 미치는 구단은 남은 FA로 채운다 */
    { const fl=floorOf(G.year); const lt=G.teams.filter(x=>x.id!==ME()&&x.id!==from&&capPay(x.id)<fl&&rosterN(x.id)<ROSTER_MAX&&!faOutBlocked(x.id,p)).sort((a,b)=>capPay(a.id)-capPay(b.id))[0];
      if(lt&&p.age<=35&&ovr(p)>=42){ const an=round5(Math.max(low,Math.min(p.ask.annual,(fl-capPay(lt.id))*.6))); faSign(p,[{tid:lt.id,annual:an,years:p.age<=31?2:1}]); continue; } }
    /* 아무도 찾지 않은 선수: 유니폼을 벗는다 */
    F.pool=F.pool.filter(x=>x!==id);
    if(p.age<=35&&ovr(p)>=33){ toFree(p,'FA 미계약 · 무적 선수'); gone++; continue; } /* 2년 동안 다른 구단을 기다린다 */
    wire('FA',`${p.name}(${p.age}세)이(가) 새 팀을 찾지 못하고 은퇴했습니다.`,{ref:p.id}); if(from===G.user)note('FA',`우리 구단 출신 FA ${p.name}이(가) 계약하지 못하고 은퇴했습니다.`);
    try{ p.team=from; obFromPlayer(p,null); p.team=null; }catch(e){} delete G.players[id]; gone++; }
  F.closed=true; F.cheapN=cheap; F.retN=gone;
  note('FA',`FA 시장이 사실상 끝났습니다. 스프링캠프 전까지 계약하지 못한 선수 중 ${cheap}명은 원소속 구단과 헐값 계약했고, ${gone}명은 무적 선수로 남거나 은퇴했습니다. 무적 선수는 2년 안에 계약하지 못하면 은퇴합니다.`); }
/* 1월 10일: 우리 구단 출신 미계약 FA가 있으면 알린다 */
function faUnsignedNote(){ const F=G.fa; if(!F||F.closed)return; const L=F.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.faFrom===G.user); if(!L.length)return;
  stop('FA',`우리 구단 출신 미계약 FA ${L.length}명: ${L.map(p=>`${p.name}(요구 ${p.ask.years}년 연 ${money(p.ask.annual)})`).join(', ')}. 스프링캠프 전날(1월 24일)까지 아무 데서도 계약하지 못하면 은퇴합니다. 잡으려면 FA 시장에서 제안하세요.`); }
/* 다른 구단의 예비 FA 대우: 팀 연봉 상위 핵심이고 붙잡을 생각이 있으면 프리미엄을 얹는다(돈 사정이 나쁘면 못 한다) */
function aiPreFA(p){ if(!preFA(p)||p.newSal==null)return; const t=team(p.team); if(!t||t.cash<-3000||p.age>=33)return;
  const ps=domestic(p.team).filter(q=>!q.ys); const rk=ps.filter(q=>ovr(q)>ovr(p)).length+1; if(rk>8||ovr(p)<52)return;
  if(p.newSal<preCap(p)&&R()<(t.mode==='contend'?.75:.5)){ p.newSal=preFAPremium(p,p.newSal); p.mor=clamp((p.mor??60)+3,0,100); p.prem=G.year; } }
function contractStart(){
  const ended=[], foreignEnd=[];
  for(const p of Object.values(G.players)){
    if(p.team==null||p.joinY>G.year)continue;
    if(p.foreign){ p.newSal=newSalary(p); if(p.team===G.user)foreignEnd.push(p.id); else { const pf=perfOf(seasonTotal(p,G.year,'1군'),p.isP); if(p.age>=35||pf==null||pf<50)delete G.players[p.id]; else { p.sal=p.newSal; p.rsy=(p.rsy||0)+1; if(p.foreign==='용병'){ const yb=foreignOf(p.team).filter(x=>x.foreign==='용병'); if(sum(yb.map(x=>x.sal))>fCap(p.team)){ const w=[...yb].sort((a,b)=>ovr(a)-ovr(b))[0]; if(ovr(w)>=55&&w.age<=33&&R()<.5){ const ot=w.team; w.team=null; w.fsrc='agent'; w.fday=G.day; w.fpub=G.day; w.ask=round5(fAsk(w)); w.ask0=w.ask; G.fmarket=(G.fmarket||[]).concat(w.id); wire('외국인',`${tshort(ot)}, 외국인 ${w.name} 보류권 해제. 다른 구단과 계약 가능`,{tid:ot,ref:w.id}); } else { try{ foResAdd(w,w.team); }catch(e){} delete G.players[w.id]; } } } } } continue; }
    if(p.faC)continue;
    p.newSal=newSalary(p); if(p.team===G.user)ended.push(p.id); else { aiPreFA(p); p.sal=p.newSal; delete p.newSal; }
  }
  G.contract={y:G.year,ended,foreignEnd,foreignDrop:[],released:[],done:false}; for(const id of foreignEnd)initPers(G.players[id]); salTalkInit();
  /* AI 구단: 기량이 크게 떨어진 고액 연봉 베테랑은 정리한다 */
  for(const t of G.teams){ if(t.id===G.user)continue; for(const p of domestic(t.id)){ if(p.age>=32&&ovr(p)<44&&p.sal>=800&&!p.ys){ story(p,`${tname(t.id)}에서 방출`,'move'); wire('방출',`${tname(t.id)}, 베테랑 ${p.name} 방출`,{tid:t.id,ref:p.id}); delete G.players[p.id]; } } }
  for(const t of G.teams) if(t.id!==ME()) trimRoster(t.id,60);
  refreshFMarket(12,99);
  stop('연봉',`연봉 협상이 시작되었습니다. 국내 선수 ${ended.length}명의 구단 산정안(직전 시즌 성적 기준)과 외국인 선수 ${foreignEnd.length}명의 재계약안이 올라왔습니다. 1월 31일까지 계약하세요.`); if(G.mail[0])G.mail[0].auto=foreignEnd.length?['sal','fre']:['sal'];
}
/* 외국인 재계약: 잘한 선수는 더 달라고 한다. 3명 총액 한도(400만 달러 + 재계약 연차당 10만 달러)를 넘으면 확정할 수 없다 */
function fReCapInfo(){ const C=G.contract; if(!C)return null; const keep=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id));
  const others=foreignOf(G.user).filter(x=>x.foreign==='용병'&&!C.foreignEnd.includes(x.id)); const tot=sum(keep.map(p=>p.newSal+(p.fInc||0)))+sum(others.map(p=>p.sal+(p.opt&&p.ctT===p.team&&p.opt.until>=G.year?p.opt.a:0))); /* 총액 한도에는 인센티브도 들어간다 */
  const cap=F_TOTAL_CAP+10*USD*sum(keep.map(p=>(p.rsy||0)+1))+10*USD*sum(others.map(p=>p.rsy||0)); return {tot,cap,over:Math.max(0,tot-cap)}; }
/* 15% 깎아 협상의 합의 확률: 구단 충성심·적응력이 높을수록 받아들이고, 지난 시즌 WAR 3 이상 스타는 잘 받아들이지 않는다.
   성적은 계약 협상이 열린 시즌(C.y) 기준. 1월 1일이 지나도 지난 시즌 성적으로 본다 */
function fReNegChance(p){ const C=G.contract; initPers(p); const y=(C&&C.y)??(period()==='pre'?G.year-1:G.year); const h=seasonTotal(p,y,'1군'); const star=!!(h&&warOf(h,p)>=3);
  return {ch:clamp(.62+(p.pers.loy-10)*.03+((p.adapt||50)-50)/150-(star?.2:0),.1,.9),star}; }
function fReNeg(id){ const C=G.contract; const p=G.players[id]; if(!C||!p||C.done)return ''; C.fneg=C.fneg||{}; if(C.fneg[id])return '이미 한 번 협상했습니다.'; C.fneg[id]=true;
  const ask=p.newSal; const off=round5(ask*.85); const {ch,star}=fReNegChance(p);
  if(R()<ch){ p.newSal=off; return `${p.name} 측이 ${money(off)}에 동의했습니다. (요구액 ${money(ask)})`; }
  C.foreignDrop.includes(id)||C.foreignDrop.push(id); p.fleft=true; return `${p.name} 측이 거절했습니다. ${star?'일본 구단에서 더 좋은 조건을 받았다고 합니다.':'다른 리그를 알아보겠다고 합니다.'} 결별로 처리됩니다. 보류권은 우리에게 있어 국내 다른 구단에는 갈 수 없습니다.`; }
function confirmContracts(){
  const C=G.contract; if(!C||C.done)return; { const f=fReCapInfo(); if(f&&f.over>0)return `외국인 3명 연봉 총액이 한도를 ${money(f.over)} 넘습니다. 한 명과 결별하거나 금액을 낮춰 협상하세요.`; }
  salTalkClose();
  for(const id of C.ended){ const p=G.players[id]; if(p&&p.newSal!=null){p.sal=Math.max(MIN_SAL,p.newSal); delete p.newSal;} }
  for(const id of C.foreignEnd){ const p=G.players[id]; if(!p)continue; if(C.foreignDrop.includes(id)){ const free=(C.fFree||[]).includes(id)&&!p.fleft; addLog(`외국인 선수 ${p.name}와(과) 재계약하지 않았습니다(${free?'보류권 해제: 다른 구단과 계약 가능':'보류권 유지: 5년간 국내 다른 구단 입단 불가'}).`);
      if(free&&ovr(p)>=50&&p.age<=34){ delete p.newSal; delete p.fInc; p.team=null; p.fsrc='agent'; p.fday=G.day; p.fpub=G.day; p.ask=round5(fAsk(p)); p.ask0=p.ask; G.fmarket=(G.fmarket||[]).concat(p.id); wire('외국인',`${tshort(G.user)}, ${p.name} 보류권 해제. 다른 구단과 계약 가능`,{tid:G.user}); } else { if(!free)try{ foResAdd(p,G.user); }catch(e){} delete G.players[id]; } }
    else { p.sal=p.newSal; delete p.newSal; p.rsy=(p.rsy||0)+1; if(p.fInc){ p.ctT=p.team; p.opt={a:p.fInc,until:C.y+1}; delete p.fInc; } } }
  C.done=true; addLog('연봉 계약을 마쳤습니다.');
}
/* 저장 용량: 3시즌 전 2군 기록은 구단별 한 줄로 합치고, 프로 3년차 이상의 아마추어 연도별 기록은 지운다(1군 기록·이야기는 그대로) */
function compactPlayers(){ const y=G.year; let n=0;
  for(const p of Object.values(G.players)){
    if(p.hist&&p.hist.length>3){ const old=p.hist.filter(h=>h.lvl==='퓨처스'&&!h.y2&&h.y<y-2); if(old.length>=2){ const by={};
        for(const h of old){ const k=h.t; const m=by[k]=by[k]||Object.assign({},p.isP?ZP:ZB,{y:h.y,y2:h.y,t:h.t,lvl:'퓨처스'}); for(const f in (p.isP?ZP:ZB))m[f]=(m[f]||0)+(h[f]||0); m.y=Math.min(m.y,h.y); m.y2=Math.max(m.y2,h.y); }
        const prevAgg=p.hist.filter(h=>h.lvl==='퓨처스'&&h.y2); for(const a of prevAgg){ const m=by[a.t]; if(m){ for(const f in (p.isP?ZP:ZB))m[f]+=(a[f]||0); m.y=Math.min(m.y,a.y); m.y2=Math.max(m.y2,a.y2); } }
        p.hist=p.hist.filter(h=>!(h.lvl==='퓨처스'&&(old.includes(h)||(h.y2&&by[h.t])))).concat(Object.values(by)); n++; } }
    if(p.amY&&!p.prospect&&p.draft&&p.draft.y<y-2){ delete p.amY; n++; }
    if(p.story&&p.story.length>45)p.story.splice(1,p.story.length-45);
  }
  return n; }
function newYear(){
  try{ compactPlayers(); }catch(e){}
  try{ gmRelYear(); }catch(e){}
  for(const p of Object.values(G.players))p.fat=0; /* 겨울을 지나면 피로는 모두 풀린다 */
  if(G.mgr[G.user]&&G.mgr[G.user].yrs<=0&&!G.mgr[G.user].interim){ const m=G.mgr[G.user]; G.mgr[G.user]=null; mail('운영팀','감독 계약 종료',`${m.name} 감독과의 계약이 끝났습니다. 개막 전까지 새 감독을 선임해야 합니다.`,{imp:true,kind:'감독',acts:[{l:'감독 후보 보기',a:'goWork',v:'감독'}]}); }
  if(G.mgr[G.user]&&G.mgr[G.user].interim){ G.mgr[G.user]=null; mail('운영팀','감독대행 체제 종료','감독대행 체제가 끝났습니다. 개막 전까지 새 감독을 선임해야 합니다.',{imp:true,kind:'감독',acts:[{l:'감독 후보 보기',a:'goWork',v:'감독'}]}); }
  if(G.tut&&!G.tut.done)G.tut.done=true; /* 비서 업무 안내는 창단 첫해에만 */
  try{ warFreeze(G.year); }catch(e){} /* 능력치가 바뀌기 전에 올해 WAR을 고정 */
  const before={}; for(const p of domestic(G.user))before[p.id]=ovr(p);
  for(const p of Object.values(G.players)) if(p.team!=null||(!p.prospect&&!p.foreign&&!p.fdPool)) develop(p); /* 소속 없는 FA·무적 선수도 나이를 먹는다 */
  if(G.draftClass)for(const id of G.draftClass){ const p=G.players[id]; if(p&&p.prospect)delete G.players[id]; }
  G.year++; try{ trnNewYear(); }catch(e){} syncMinSal(); for(const p of Object.values(G.players))if(!p.foreign&&p.sal>0&&p.sal<MIN_SAL)p.sal=MIN_SAL; /* 군 복무·해외 등 소속이 잠시 비어 있는 선수도 함께 올린다 */
  milNewYear();
  for(const p of Object.values(G.players)){ if(!(p.injOut>45)){ p.injOut=0; delete p.injK; } delete p.lastStart; delete p.lastApp; delete p.prevApp; }
  for(const t of G.teams){ if(t.id!==ME()){ try{ aiYsPrune(t.id); }catch(e){} trimRoster(t.id,61); fillRoster(t.id,56);} t.rot=0; }
  const added=fillRoster(G.user,ROSTER_MIN); if(added.length)addLog(`로스터 최소 인원을 맞추려고 육성선수 ${added.length}명을 등록했습니다.`);
  for(const k in G.lineup){ const p=G.players[G.lineup[k]]; if(!p||p.team!==G.user)delete G.lineup[k]; }
  G.cal=buildCalendar(G.year); G.ps=null; G.camp=null; G.campInj=1; G.form=null; G.draft=null;
  G.sea={y:G.year,rec:G.teams.map(()=>({w:0,l:0,t:0})),months:[],fspend:{},repl:{},mark:null};
  refreshScoutMarket(); if(!G.fmarket||G.fmarket.length<4)refreshFMarket(8); updateModes();
  makeDraftClass();
  if(G.fa&&G.fa.closed)G.fa=null;
  const ch=domestic(G.user).filter(p=>before[p.id]!=null).map(p=>({p,d:ovr(p)-before[p.id]})).sort((a,b)=>b.d-a.d);
  const up=ch.filter(x=>x.d>=2.5).slice(0,3), dn=ch.filter(x=>x.d<=-2.5).slice(-3);
  { const n=rosterN(G.user); if(n>ROSTER_MAX)mail('운영팀','로스터 정원 초과',`신인 합류로 로스터가 ${n}명입니다. 개막 전까지 ${ROSTER_MAX}명 이하로 줄여야 합니다. 선수단 화면의 로스터 정리에서 방출 후보를 볼 수 있습니다.`,{imp:false,kind:'일반',acts:[{l:'로스터 정리',a:'tab',v:'roster'}]}); }
  stop('새해',`${G.year}년이 밝았습니다. 모든 선수가 한 살 먹었습니다.${up.length?` 코치진이 성장을 확인한 선수: ${up.map(x=>x.p.name).join(', ')}.`:''}${dn.length?` 기량이 떨어진 선수: ${dn.map(x=>x.p.name).join(', ')}.`:''} 신인 ${domestic(G.user).filter(isRookie).length}명이 합류했습니다.`);
}
function aiWeekly(){
  const per=period();
  if(per==='season'&&G.day<=foreignDL()) for(const t of G.teams) if(t.id!==ME()) aiForeignReview(t.id);
  blockDaily(); aiBlockWeekly(); try{ marketWeek(); }catch(e){} try{ fBidWeek(); }catch(e){} try{ mlbHype(); }catch(e){} try{ fwatchWeek(); }catch(e){} try{ facWeek(); }catch(e){} try{ climateWeek(); }catch(e){} try{ mreqWeek(); }catch(e){} try{ mgrRelWeek(); if(period()==='season'&&G.day>=G.cal.open+7)mpickPlan(); }catch(e){} try{ grantCheck(); ownerPush(); }catch(e){}
  const dl=per==='season'&&G.day>=KD(7,1)&&G.day<=tradeDL(); if(tradeOpen()&&per!=='post'&&!G.unemp){ const pr=domestic(G.user).some(p=>p.listed)?.65:dl?.7:per==='season'?.45:.25; for(let i=0;i<(dl?2:1);i++)if(R()<pr&&(G.offers||[]).length<3)aiOffer(); }
}
/* 단장의 압박: 예상보다 성적이 나쁘거나 승부사 기질이면 트레이드로 살길을 찾는다 (0~1) */
function gmHeat(tid){ const t=team(tid); let h=gmTrait(tid)==='gambler'?.25:0; const per=period();
  if(per==='season'&&G.cal&&G.day>G.cal.open+20&&G.proj){ const st=standingsNow(); const rk=st.findIndex(x=>x.tid===tid)+1; const pr=G.proj.indexOf(tid)+1; if(pr>0)h+=clamp((rk-pr)/5,0,.6); if(rk>=8)h+=.15; }
  const g=t.gm; if(g&&G.year-g.since>=3)h+=.1; return clamp(h,0,1); }
function aiOffer(){ const ts=G.teams.filter(x=>x.id!==G.user).map(t=>({t,w:gmHeat(t.id)+R()*.8})).sort((a,b)=>b.w-a.w).slice(0,3);
  for(const x of ts){ if(aiOfferFrom(x.t))return true; } return false; }
function aiOfferFrom(t){ const U=team(G.user);
  const mine=domestic(G.user).filter(p=>!(p.joinY>G.year)&&healthy(p)&&!hasNtc(p)).map(p=>({p,v:tval(t,p,'in')})).filter(x=>x.v>(x.p.listed?1.5:3)).sort((a,b)=>b.v-a.v).slice(0,8);
  if(!mine.length)return false; const listed=mine.filter(x=>x.p.listed); const tg=listed.length&&R()<.7?pick(listed):pick(mine);
  const tgU=tval(U,tg.p,'out'); // 우리가 그 선수를 내줄 때 느끼는 가치
  const core=new Set(domestic(t.id).map(p=>({p,v:tval(t,p,'out')})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.p.id));
  const pool=domestic(t.id).filter(p=>!core.has(p.id)&&healthy(p)&&!p.ys).map(p=>({p,v:tval(t,p,'out'),u:tval(U,p,'in')})).filter(x=>x.v>0&&x.u>.3).sort((a,b)=>a.v-b.v);
  const need=tradeNeed(t,0); const cap=tg.v-need; let best=null,bu=-1;
  for(let i=0;i<pool.length;i++){ const a=pool[i]; if(a.v<=cap&&a.u>=tgU*.75&&a.u>bu){ best=[a]; bu=a.u; }
    for(let j=i+1;j<pool.length;j++){ const b=pool[j]; const tv=a.v+b.v; const uv=Math.max(a.u,b.u)+.72*Math.min(a.u,b.u); if(tv<=cap&&uv>=tgU*.8&&uv>bu){ best=[a,b]; bu=uv; } } }
  if(!best)return false;
  const off={id:'o'+Math.floor(R()*1e9),from:t.id,give:best.map(x=>x.p.id),get:[tg.p.id],exp:period()==='season'?Math.min(G.day+3,tradeDL()):G.day+3,day:G.day};
  { const key=off.from+':'+[...off.give].sort().join(',')+':'+off.get.join(','); G.offSeen=G.offSeen||{}; if(G.offSeen[key]!=null&&G.day-G.offSeen[key]<40)return false; G.offSeen[key]=G.day; } /* 같은 제안을 한 달 안에 되풀이하지 않는다 */
  try{ off.pot=offScoutNote(off); }catch(e){}
  G.offers=(G.offers||[]).concat(off);
  if(autoTradeOffer(off))return true; /* 업무 맡기기: 부단장이 거절. 맡기지 않았으면 진행을 멈추지 않는 소식으로 보낸다(할 일 목록·만료 임박 알림에 뜬다) */
  note('트레이드',`${tname(t.id)} 단장이 ${best.map(x=>x.p.name).join(', ')}을(를) 주고 ${tg.p.name}을(를) 원한다는 트레이드를 제안했습니다. ${off.exp<G.day+3?'트레이드 마감일까지':'3일 안에'} 답해야 합니다.${gmHeat(t.id)>=.4?' 성적 압박을 받는 단장이라 적극적입니다.':''}${off.pot?`\n\n[잠재력 추정 보고]\n${off.pot}`:''}`); if(G.mail[0]){ G.mail[0].oid=off.id; G.mail[0].auto=['tro']; } return true;
}
function answerOffer(id,yes){
  const o=(G.offers||[]).find(x=>x.id===id); if(!o)return {ok:false,msg:'제안이 없습니다.'};
  G.offers=G.offers.filter(x=>x.id!==id);
  if(!yes){ addLog(`${tname(o.from)}의 트레이드 제안을 거절했습니다.`); return {ok:true,msg:'거절했습니다.'}; }
  if(!tradeOpen())return {ok:false,msg:'트레이드 기간이 아닙니다.'};
  { const nt=ntcOf(o.get); if(nt)return {ok:false,msg:`${nt.name}은(는) 트레이드 거부권이 있어 보낼 수 없습니다.`}; }
  if([...o.give,...o.get].some(id=>!G.players[id]))return {ok:false,msg:'선수 상황이 바뀌어 성사되지 않았습니다.'};
  if(o.give.some(id=>G.players[id].team!==o.from)||o.get.some(id=>G.players[id].team!==G.user))return {ok:false,msg:'선수 상황이 바뀌어 성사되지 않았습니다.'};
  const t=team(o.from); const mv=mgrTradeView(o.from,o.get,o.give); const snap=tradeSnap([...o.give,...o.get]); const grade=tradeGrade(o.from,o.get,o.give);
  o.give.forEach(id=>{ G.players[id].team=G.user; story(G.players[id],`트레이드로 ${tname(G.user)} 이적`,'move'); }); o.get.forEach(id=>{G.players[id].team=o.from; delete G.players[id].listed; story(G.players[id],`트레이드로 ${tname(o.from)} 이적`,'move');});
  for(const k in G.lineup) if(o.get.includes(G.lineup[k]))delete G.lineup[k];
  const diff=sum(o.give.map(id=>trueVal(G.players[id])))-sum(o.get.map(id=>trueVal(G.players[id])));
  try{ frBacklash(o.get); }catch(e){}
  chron('trade',`${tshort(o.from)}와(과) 트레이드: ${o.get.map(id=>G.players[id]?G.players[id].name:'').join('·')} 보내고 ${o.give.map(id=>G.players[id]?G.players[id].name:'').join('·')} 받음`);
  G.trades.push({y:G.year,d:G.day,with:o.from,give:o.get.map(id=>G.players[id].name),get:o.give.map(id=>G.players[id].name),diff,revealed:false,gi:[...o.give],go:[...o.get],snap,grade});
  t.rel=clamp(t.rel+3,0,100); prTrade(o.get,o.give,o.from); o.give.forEach(id=>mvLog('트레이드',G.players[id],o.from,G.user)); try{ if(o.get.some(id=>ovr(G.players[id])>=55))ivRequest('trade',{}); }catch(e){} o.get.forEach(id=>mvLog('트레이드',G.players[id],G.user,o.from)); G.offers=(G.offers||[]).filter(x=>!x.get.some(id=>o.get.includes(id))&&!x.give.some(id=>o.give.includes(id)));
  mgrTradeApply(mv); churnCheck(); mpickTraded(o.get); addLog(`${tname(o.from)}의 제안을 받아들였습니다: ${o.get.map(id=>G.players[id].name).join(', ')} ↔ ${o.give.map(id=>G.players[id].name).join(', ')}`);
  return {ok:true,grade,msg:'트레이드가 성사되었습니다.'};
}

