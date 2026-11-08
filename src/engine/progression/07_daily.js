/* ===== 하루 진행 ===== */
function blocker(){
  if(G.demoEnd)return '체험판은 여기까지입니다.';
  if(G.gameOver)return '경질되었습니다.';
  if(G.live)return '경기를 먼저 끝까지 보세요.';
  if(G.res)return '방금 끝난 경기 결과를 확인하세요.';
  if(G.fdWait)return '창단 드래프트를 시작하세요.';
  if(G.fd&&!G.fd.done)return '창단 드래프트를 먼저 마치세요.';
  if(G.draft&&!G.draft.done)return '신인 드래프트를 먼저 마치세요.';
  const cp=(G.comp||[]).find(c=>((c.stage==='protect'&&c.to===G.user)||(c.stage==='pick'&&c.from===G.user))&&G.day>c.exp); /* 기한 전에는 진행할 수 있고, 기한 날 자동 처리(compDaily)된다 */
  if(cp)return cp.stage==='protect'?`${cp.name} 영입 보상: 보호선수 명단을 먼저 제출하세요.`:`${cp.name} 이적 보상: 보상선수(또는 보상금)를 먼저 고르세요.`;
  const per=period();
  if(per==='pre'&&G.day>=G.cal.open-1&&!G.mgr[G.user])return '감독이 없습니다. 스태프·육성 → 감독에서 감독을 선임해야 개막할 수 있습니다.';
  if(per==='season'||(per==='pre'&&G.day>=G.cal.open-1)||(per==='post'&&G.ps&&!G.ps.done&&((G.ps.seeds||[]).includes(G.user)||(G.ps.cur&&G.ps.cur.round==='tb'&&(G.ps.cur.hi===G.user||G.ps.cur.lo===G.user))||(G.ps.tbq||[]).some(q=>q[1]===G.user||q[2]===G.user))&&!Object.values(G.ps.res||{}).some(r=>r&&r[1]===G.user))){ const n=rosterN(G.user); /* 포스트시즌은 아직 남은 경기가 있는 팀만(탈락한 팀 정원 때문에 한국시리즈가 막히지 않게, 검수 11-07) */ /* 포스트시즌도 같은 등록 규정 */
    if(n>ROSTER_MAX){ const L=milReturns(7); return `로스터가 ${n}명입니다. ${ROSTER_MAX}명 이하로 줄여야 진행할 수 있습니다.${L.length?` 7일 안에 군 복귀 ${L.length}명(${milRetTxt(L)})이 더 있어, 복귀까지 고려하면 ${n+L.length-ROSTER_MAX}자리를 비워야 다시 막히지 않습니다.`:''}`; }
    if(ourGameOn(G.day+1)){ const L1=milReturns(1); if(L1.length&&n+L1.length>ROSTER_MAX)return `내일 ${milRetTxt(L1)}이(가) 전역해 로스터가 ${n+L1.length}명이 됩니다. 경기 전에 ${ROSTER_MAX}명 이하로 맞춰야 진행할 수 있습니다.`; } /* 전역일 경기도 등록 규정 안에서(검수 11-08) */
    if(!ourGameOn(G.day+1))return ''; /* 내일 우리 경기가 없으면 날짜는 넘긴다: 그동안 부상 회복·대표팀 복귀·말소 10일이 지나 부족이 풀린다(검수 11-06) */ const d1=G.day+1, NT=G.nt&&G.nt.y===G.year&&NT_EV[G.nt.k]&&KD(...NT_EV[G.nt.k].from)===d1?new Set(G.nt.ids||[]):null, lv=p=>(p.mil&&p.mil.from===d1)||!!(NT&&NT.has(p.id)); /* 내일 입대·대표 소집으로 빠지는 선수(검수 11-08) */ const d0=depth(G.user), d={start:d0.start.filter(p=>!lv(p)),sp:d0.sp.filter(p=>!lv(p)),pen:d0.pen.filter(p=>!lv(p))}, rt=p=>(p.ntAway===d1&&p.ntFrom<=G.day)||(milServing(p)&&p.mil.until===d1); /* 내일 대표팀·군에서 돌아오는 선수(검수 11-07) */ const tmr=p=>!p.ys&&!(p.joinY>G.year)&&(rt(p)?!(p.injOut>1):!isAway(p)&&p.injOut===1)&&!(p.susp>G.day+1)&&!p.frehab&&!p.hold&&psOk(p)&&(!entryOn()||p.e1||p.downDay==null||G.day+1-p.downDay>=10); /* 내일 복귀해 내일 등록할 수 있는 선수(말소 10일 규정 포함, 검수 11-07) */ const back=Object.values(G.players).filter(p=>p.team===G.user&&!lv(p)&&tmr(p));
    const can=Object.values(G.players).filter(p=>p.team===G.user&&!lv(p)&&!p.ys&&!(p.joinY>G.year)&&!p.frehab&&!p.hold&&psOk(p)&&(rt(p)?!(p.injOut>1):!isAway(p)&&!(p.injOut>1))&&!(p.susp>G.day+1)&&(!entryOn()||p.e1||p.downDay==null||G.day+1-p.downDay>=10)); /* 내일 뛸 수 있는 선수 전체: 감독이 2군에서 올릴 선수, 내일 말소 10일·출장정지가 풀리는 선수까지(검수 11-08: 콜업 가능한 선수가 있어도 진행이 막힘) */
    if(Math.max(d.start.length+back.filter(p=>!p.isP).length,can.filter(p=>!p.isP).length)<9)return '건강한 야수가 9명이 안 됩니다.'; if(Math.max(d.sp.length+d.pen.length+back.filter(p=>p.isP).length,can.filter(p=>p.isP).length)<8)return '건강한 투수가 부족합니다.'; } /* 내일 복귀하는 1군 투수는 내일 경기 인원에 넣는다(검수 11-07: 복귀일까지 갈 수 없었다) */
  return '';
}
function ourGameOn(day){return !G.unemp&&(!!(G.cal.sched[day]||[]).find(pair=>pair.includes(G.user))||psOursOn(day));}
function advance(mode,options={}){
  G.matchAwait=null; // 이전 버전에서 모든 경기마다 남긴 대기는 이어받지 않는다.
  const start=G.day; const o=dobj(start);
  let target=mode==='day'?start+1:mode==='week'?start+7:mode==='month'?dnum(o.m===12?o.y+1:o.y,o.m===12?1:o.m+1,1):start+400;
  if(mode==='month'&&target-start<2)target=start+30;
  if(mode==='next'&&!G.unemp&&(period()==='off'||period()==='pre'))target=Math.min(target,start+7); /* 비시즌·시즌 준비: 한 번에 최대 7일 */
  G.stops=[]; const r0=G.sea.rec[G.user]; const w0=r0.w,l0=r0.l, sea0=G.sea.y; let days=0;
  const weekly=mode==='event'||mode==='week';
  const gameBatch=mode==='event'&&!G.unemp&&(period()==='season'||Array.from({length:7},(_,i)=>start+i+1).some(ourGameOn));
  /* 기본 계속은 3경기. 휴식일은 세지 않고, 경기 없는 비시즌과 명시한 1주일 진행은 7일이다. */
  if(weekly){ G.dig={from:start+1,to:start,games:[],snap:digSnap(),rk:userRank(),ev0:(G.evs||[]).filter(e=>!e.done).length}; target=start+(gameBatch?21:7); } else if(mode!=='watch')G.dig=null; /* 예약한 중계로 넘어갈 때는 앞 경기 진행 요약을 남긴다(검수 11-06) */
  while(G.day<target){
    if(G.unemp)unempAuto();
    if(/^건강한/.test(blocker()))try{ entryManage(G.user,false); }catch(e){} /* 부족하면 감독이 먼저 2군에서 채운다 */
    if(blocker())break;
    /* 포스트시즌: 다른 팀 경기를 넘기다가 우리 경기까지 한 번에 지나치지 않게, 우리 경기 전날에 멈춘다(바로 다음 날이 우리 경기면 그 경기를 진행) */
    if(days>0&&(!weekly||period()==='post')&&mode!=='day'&&mode!=='watch'&&psOursOn(G.day+1)){ if(G.ps.cur.gi===0)stop('포스트시즌',`내일 ${psOursTxt()}입니다. 라인업과 선발을 확인한 뒤 진행하세요.`); break; }
    const planned=gmPlanAt(G.day+1); if(G.simPlanned&&G.simPlanned.day<=G.day)G.simPlanned=null;
    if(!options.skipMatchStop&&mode!=='watch'&&ourGameOn(G.day+1)&&(G.watchPlanned?.day===G.day+1||G.simPlanned?.day===G.day+1||(planned?.k==='attend'&&!planned.done)||(typeof document!=='undefined'&&!G.unemp&&psOursOn(G.day+1)))){G.matchAwait={day:G.day+1,mode,ps:psOursOn(G.day+1)};break;} /* 우리 가을야구 경기는 늘 중계로 본다. shortcut: 화면 없는 시뮬(점검 도구)에서는 멈추지 않게 document로 구분, 엔진에 화면 여부 플래그가 생기면 교체 */
    if(mode!=='watch'&&evLastWarn())break; /* 날짜를 넘기기 전에: 경기일이 겹쳐도 핵심 결정 마감 전 재알림이 빠지지 않게(검수 11-08) */
    processDay(); days=G.day-start;
    if(G.unemp){ unempAuto(); G.res=null; G.stops=G.stops.filter(x=>x.kind==='경력'); }
    if(weekly){ const D=G.dig; D.to=G.day;
      if(G.res){ const g=G.games[G.res.i]; D.games.push(g?g.day:G.day); G.res=null; }
      if(gameBatch&&D.games.length&&(period()==='post'||(G.ps&&G.ps.done&&G.ps.finDay>=G.day)||D.games.length>=3||seriesEnd(G.day)))break; /* 포스트시즌은 우리 경기마다 멈춘다(라인업·선발 확인). 정규시즌은 같은 상대와의 한 시리즈가 끝나면 멈춘다(검수 11-08: 다음 상대 경기까지 넘김) */
      if(G.stops.length||G.live||(G.draft&&!G.draft.done)||G.gameOver)break;
      { const op=(G.evs||[]).filter(e=>!e.done&&evStops(e)); if(op.some(e=>EV_KEY.has(e.k)&&e.day>start))break; /* 핵심 결정은 기한 하루 전에 한 번 더 멈춘다 */ if(evLastWarn())break; if(stopOn({kind:'트레이드'})&&(G.offers||[]).some(o=>o.day!=null?o.day>start:false))break; }
      if(D.games.length===0&&days>=7&&period()!=='season')break; /* 비시즌: 한 번에 최대 7일 */
      if(G.unemp&&days>=14)break;
      continue; }
    if(G.stops.length||G.live||G.res||(G.draft&&!G.draft.done)||G.gameOver)break;
    if(evLastWarn())break; /* 한 달 진행 등 다른 버튼도 핵심 결정 기한 하루 전에 멈춘다(검수 11-06) */
  }
  if(weekly&&G.dig&&!G.dig.games.length)G.dig=null;
  const r1=G.sea.rec[G.user];
  G.lastAdv={days,from:start,to:G.day,w:r1.w-(G.sea.y===sea0?w0:0),l:r1.l-(G.sea.y===sea0?l0:0)};
  return G.lastAdv;
}
/* 주간 요약용: 우리 선수 시즌 누적 기록 스냅숏 */
const DIGK=['pa','ab','h','bb','hr','rbi','d','tr','sb','outs','er','so','w','l','sv','hld','g','gs','sf','hbp'];
function digSnap(){ const o={}; for(const p of playersOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); o[p.id]=h?DIGK.map(k=>h[k]||0):DIGK.map(()=>0); } return o; }
/* 오늘 치른 우리 경기가 이 상대와의 시리즈 마지막인가: 다음 우리 경기 상대가 다르거나(휴식일 넘어도) 시즌이 끝나면 */
function seriesEnd(d){ const S=G.cal&&G.cal.sched; if(!S)return true; const op=x=>x?(x[0]===G.user?x[1]:x[0]):null; let cur=null; for(let k=d;k>=d-1&&cur==null;k--)cur=op((S[k]||[]).find(x=>x.includes(G.user))); if(cur==null)return true;
  for(let k=d+1;k<=d+5;k++){ const m=(S[k]||[]).find(x=>x.includes(G.user)); if(m)return op(m)!==cur; } return true; }
function userRank(){ try{ return tieRank(standingsNow(),G.user); }catch(e){ return 0; } } /* 공동 순위 기준(검수 11-08: 같은 순위인데 3위 → 1위로 보임) */
/* 시즌 제한(현재 꺼 둠): 켜면 첫 시즌을 마치고 스토브리그 직전에서 멈춘다 */
const GAME_VER='0.9'; const DEMO={on:false,seasons:1}; /* 무료 정식 공개: 시즌 제한 없음 */
function demoOver(){ return DEMO.on&&G.year>=(G.startY||2026)+DEMO.seasons-1&&!G.unemp; }
function processDay(){ syncMinSal(); try{ leaveSweep(); }catch(e){}
  if(G.demoEnd)return;
  G.day++; const day=G.day, o=dobj(day);
  if(day===KD(11,1)&&demoOver()){ G.day--; G.demoEnd=true; stop('체험판',`${G.year}시즌을 모두 마쳤습니다. 체험판은 여기까지입니다. 홈 화면에서 한 시즌 기록을 확인하세요.`); return; }
  if(o.m===9&&o.d===1){ try{ coachExpNote(); }catch(e){} }
  if(o.d===1&&o.m!==1)try{ rmSnap(); }catch(e){} /* 우리 선수 월별 능력치 기록(1월은 겨울 성장 뒤에) */
  if(o.m===1&&o.d===1){ newYear(); planSup(); ovrSnap(); try{ rhSnap(); rmSnap(); }catch(e){} try{ gmTenYear(); }catch(e){} try{ myCNewYear(); }catch(e){} try{ freeYear(); }catch(e){} try{ stYear(); }catch(e){} try{ gmAgeYear(); }catch(e){} try{ awardsCompact(); }catch(e){} }
  else if(o.d===1&&foreignOpen())refreshFMarket(12,3);
  if(o.d===1)try{ freeAiMonthly(); sponMonthly(); }catch(e){}
  if(o.d===1)try{ scoutAutoMonthly(); }catch(e){}
  if(o.d===1)try{ stAiStaff(); }catch(e){}
  if(o.d===1)try{ posReqMonth(); }catch(e){}
  if(o.d===1)try{ misbehaveMonth(); }catch(e){}
  if(o.d===1)try{ rSnapAll(); starCheck(); }catch(e){}
  if(o.d===1)try{ fanMonthly(); }catch(e){} /* 팬 마케팅 운영비·채널 수입 */
  if(o.d===15)try{ smNews(); }catch(e){} /* 스타 마케팅 캠페인 기사 */ /* 능력치 변화 표시(약 6개월 전과 비교) */
  if(o.d===1&&o.m>=6&&o.m<=9&&period()==='season')try{ titleRaceNews(); }catch(e){}
  if(day===KD(11,5))try{ fcampStart(); }catch(e){} if(day===KD(11,25))try{ fcampEnd(); }catch(e){}
  try{ draftPressNews(day); }catch(e){}
  try{ sponDaily(); if(o.w===1)mvWeekly(); }catch(e){}
  if(o.w===1)try{ tbWeek(); }catch(e){} if(G.cal&&day===G.cal.end+1)try{ tbWeek(true); }catch(e){}
  try{ stDaily(); }catch(e){}
  try{ ivDaily(); }catch(e){}
  try{ fanPulseDaily(); }catch(e){} try{ truckWeekly(); }catch(e){}
  try{ cwDaily(); }catch(e){} try{ aiPlanDaily(); }catch(e){} try{ achFirstDaily(); }catch(e){} try{ gmPlanDaily(); }catch(e){} try{ champDaily(); }catch(e){} try{ mgrVisit(); }catch(e){} try{ fdEvalDaily(); }catch(e){}
  if(day>=KD(11,24)&&day<=KD(12,31))try{ awardCeremony('mvp'); }catch(e){} /* 결산이 늦어 후보가 늦게 나와도 놓치지 않게 그 뒤 첫날 발표(검수 11-08) */
  if(day>=KD(12,9)&&day<=KD(12,31))try{ awardCeremony('gg'); }catch(e){}
  dailyCost(); try{ stadDaily(); newStadDaily(); }catch(e){} try{evDaily();}catch(e){} try{ fTmpDaily(); }catch(e){} try{ fPubDaily(); }catch(e){} try{ ovsDaily(); }catch(e){} try{ compDaily(); }catch(e){} try{ wvDaily(); }catch(e){} try{ sd2Daily(day); }catch(e){} try{ gameRulesMail(day); }catch(e){} try{ marketDaily(); }catch(e){}
  milDaily();
  recoverAll(1);
  if(o.w===0)for(const p of Object.values(G.players)){ if(p.sf&&p.sf.y===G.year)p.sf.m=clamp((p.sf.m||0)*.65+N(0,(p.foreign?.75:.55)*volF(p)),-2.5,2.5); /* 기복이 큰 선수는 슬럼프·상승세 폭도 크다 */ }
  for(const p of Object.values(G.players)) if(p.injOut>0){ p.injOut--; if(p.injOut===0){ { const h=(p.injHist||[]).slice(-1)[0]; if(h&&h.bk==null)h.bk=G.day; } /* 실제 복귀일(조기 복귀 포함, 검수 11-08) */ const I=INJ[p.injK]; if(I&&I.re)p.reInj={k:p.injK,left:I.re[1],m:I.re[0],d:G.day}; if(p.team===G.user){ const fx=injFxNow(p); const hd=((p.injHist||[]).slice(-1)[0]||{}).days||0; (hd>=10?(k,t,r)=>mail(FROM[k],headline(t),t,{ref:r,kind:k,acts:kindActs(k,r),imp:true}):note)('복귀',`${p.name}이(가) ${I?I.n+'에서':'부상에서'} 돌아왔습니다.${fx.length?' 실전 감각과 몸 상태는 경기를 뛰면서 되찾아야 합니다.':''}${(()=>{ const f=(p.injFx||[]).slice(-1)[0]; if(!f||f.k!==p.injK)return ''; return (f.v?` 복귀 후 측정한 직구 구속은 수술 전보다 ${f.v>0?f.v+'km/h 빨라졌습니다':(-f.v)+'km/h 느려졌습니다'}.`:'')+(f.fail?' 의무팀은 예전 구위를 완전히 되찾기는 어렵다고 봅니다.':''); })()}${I&&I.re?` 복귀 후 ${I.re[1]}일 동안은 재발 위험이 높습니다.`:''}`,p.id); } delete p.injK; } }
  try{ injDaily(); loadDaily(); if(o.w===1&&G.day>G.cal.open)loadWeekly(); }catch(e){}
  const c=G.cal;
  if(day===KD(2,1)||day===KD(6,1))try{ posPlanAll(); }catch(e){}
  if(day===KD(2,1))for(const t of G.teams)if(t.id!==ME()){aiForeignFill(t.id,false);aiForeignFill(t.id,false);aiForeignFill(t.id,false);aiForeignFill(t.id,false);}
  if(day===KD(1,10))faUnsignedNote();
  if(day===KD(1,24)&&G.fa&&!G.fa.closed)faClose();
  if(day===KD(1,31)&&G.contract&&!G.contract.done){ { let g=0; while(fReCapInfo().over>0&&g++<4){ const C=G.contract; const k=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id)).sort((a,b)=>b.newSal-a.newSal)[0]; if(!k)break; C.foreignDrop.push(k.id); (G._fDropAuto=G._fDropAuto||[]).push(k.name); } } confirmContracts(true); { const L=G._fDropAuto||[]; delete G._fDropAuto; if(L.length)mail('운영팀','연봉 마감: 외국인 총액 한도로 결별',`외국인 재계약 합계가 총액 한도를 넘어 연봉이 가장 높은 선수부터 결별했습니다: ${L.join(', ')}. 나머지 선수는 합의한 조건으로 계약했습니다.`,{imp:true,kind:'연봉'}); } { const h=Object.values(G.players).filter(p=>p.hold&&p.team===G.user).length; stop('연봉',`연봉 계약 마감일입니다. 남은 선수는 제시안대로 계약했습니다.${h?` 요구액과 차이가 큰 ${h}명은 사인하지 않아 미계약입니다.`:''}`); } }
  if(day===c.camp)campStart();
  if(day===c.campEnd)campEnd();
  if(day===c.exh)note('일정','시범경기가 시작됩니다. 개막까지 2주 남았습니다.');
  if(day===c.open-1){ G.entryY=G.year; for(const t of G.teams){ setEntry(t.id); t.rot=0; } for(const p of Object.values(G.players))if(p.isP)delete p.lastStart; stop('일정',`내일(${dmd(c.open)}) ${G.year} 시즌이 개막합니다. 개막 엔트리가 정해졌습니다. 선수단 구성은 오늘까지 점검하세요.`); }
  if(day===c.open){ openingDay(); G.fut0={y:G.year,m:Object.fromEntries(playersOf(G.user).map(p=>[p.id,ovr(p)]))}; }
  if(day===KD(7,17)&&!G.unemp&&G.sea&&G.sea.y===G.year){ try{ deadlineDecision(); }catch(e){} }
  if(day===KD(7,24)||day===KD(7,28)){ try{ deadlineRumors(day===KD(7,28)); }catch(e){} }
  if(day===KD(7,24))stop('일정','트레이드 마감까지 7일 남았습니다. 7월 31일 이후 포스트시즌이 끝날 때까지 트레이드할 수 없습니다. 다른 구단 제안이 몰리는 시기입니다.');
  if(day===tradeDL())stop('일정','오늘 자정 트레이드가 마감됩니다. 남은 제안과 협상을 오늘 안에 정리하세요.');
  if(day===KD(6,1))try{ declApply(); }catch(e){} if(day===KD(8,8)){ const n=foreignOf(G.user).filter(p=>p.foreign==='용병'&&healthy(p)).length; (n<3?stop:note)('일정',`외국인 선수 포스트시즌 등록 마감(8월 15일)까지 7일 남았습니다. 건강한 외국인 선수 ${n}명.`); }
  if(o.d===1&&o.m>=5&&o.m<=9&&period()==='season'){ try{ futuresReport(); }catch(e){} }
  if(o.d===1){ try{ personalMonthlyPay(); }catch(e){} try{ growSnap(); }catch(e){} }
  allStarDaily(); ggVotingDaily();
  if(day===KD(3,1)&&day<c.draft)try{ draftSeasonMail(); }catch(e){}
  if(day===c.draft)startDraft();
  if(entryOn()&&(period()==='season'||period()==='post')){ const wk=o.w===1&&period()==='season'; for(const t of G.teams)entryManage(t.id,wk&&(t.id!==ME()||R()<.7)); } try{ regDaily(); }catch(e){} /* 포스트시즌에 들어가면 확장 엔트리(33명)를 기본 한도로 줄인다 */
  if(c.sched[day]||(G.makeup||[]).length&&period()==='season')playDay(day);
  if(day===KD(9,1)||day===c.end+1){ for(const t of G.teams)if(t.id!==ME())try{ aiFloorFix(t.id); }catch(e){} } /* AI 구단은 시즌 막판 하한을 다시 확인해 주축과 연장계약으로 맞춘다 */
  if(day===c.end+1)seasonEnd();
  if(G.ps&&!G.ps.done)psDay(day);
  if(G.ps&&G.ps.done&&G.ps.finDay===day){ settlement(); try{ stadSeasonNote(); }catch(e){} try{ draftRetro(); }catch(e){} }
  /* 스토브리그는 결산이 끝난 뒤에만 연다(포스트시즌이 길어져 결산이 11월로 밀려도 순서가 뒤집히지 않게) */
  if(day>=KD(11,1)&&dobj(day).m>=11&&G.rolled!==G.year&&G.last&&G.last.y===G.year){ offseason(); offseasonMgr(); try{ stadAI(); }catch(e){} }
  if(day>=KD(11,2)&&G.rolled===G.year&&G.fa&&!G.fa.open&&!G.fa.closed&&G.faAnnY!==G.year){ G.faAnnY=G.year; faAnnounce(); } /* 결산(스토브리그 시작)이 11월 2일보다 늦어도 공시한다 */
  if(G.fa&&G.fa.open&&!G.fa.closed&&day>=G.fa.openDay)faDay(day);
  if(day===KD(12,1)){ contractStart(); aiCapAll(); try{ aiDebtDump(); }catch(e){} capWarnUser(); }
  try{ salTalkDaily(day); }catch(e){} try{ holdDaily(day); }catch(e){}
  if(day===KD(12,10)){ try{ capCouncil(); }catch(e){} }
  try{ assocDaily(day); }catch(e){} try{ tabDaily(day); }catch(e){} try{ ppDaily(); }catch(e){} { const od=dobj(day); if(od.d===1&&od.m>=6&&od.m<=8)try{ mgrMidSeason(); }catch(e){} if(od.d===1)try{ unempStaff(); }catch(e){} if(od.d===1)try{ mplMonth(); }catch(e){} } try{ autoDaily(day); }catch(e){} /* 업무 맡기기 */ /* 협회: 협회장 선거 후보 발표(11/10)·실행위원회 소집(12/3)·이사회 선거(12/15) */
  if(day===KD(12,15)){ try{ milWarn(); }catch(e){} }
  if(day===KD(1,31)||day===G.cal.open-2)aiCapAll();
  if(o.w===0){ for(const t of G.teams){ if(t.id!==ME()&&rosterN(t.id)>ROSTER_MAX-3)trimRoster(t.id,ROSTER_MAX-3); } /* AI는 군 제대·부상 대체 자리를 남기려고 한도보다 3명 적게 운영한다 */ for(const m of G.mail){ if(m.imp&&m.kind==='일정'&&G.day-m.day>=3)m.imp=false; } /* 날짜가 지난 일정 안내는 '중요'만 내린다. 소식을 저절로 읽음 처리하지 않는다(단장이 읽거나 '모두 읽음'을 눌러야 읽음) */ futuresWeek(); aiWeekly(); moraleWeek(); try{roleWeek();}catch(e){} try{ rpWeek(); }catch(e){} try{ posWeek(); }catch(e){} try{ callWishWeek(); }catch(e){} try{relSnap();}catch(e){} if(G.coach)try{coachMarketMonth();}catch(e){} try{evWeek();}catch(e){} devWeek(); try{ trnBase(); }catch(e){} try{ trnWeek(); }catch(e){} if(period()==='season')updateLg(G.year); }
  tutTick();
  const nx=dobj(day+1); if(nx.d===1&&day>=c.open&&day<=c.end+1)monthReport(o.m); if(nx.d===1){ try{ finMonth(o.m); }catch(e){} }
  if(day===c.end){ const S=G.sea, r=S.rec[G.user], mk=S.mark||{w:0,l:0,t:0}; if(r&&r.w+r.l+(r.t||0)>mk.w+mk.l+(mk.t||0)){ S.months.push({m:dobj(c.end).m+'월',w:r.w-mk.w,l:r.l-mk.l,t:(r.t||0)-(mk.t||0)}); S.mark={w:r.w,l:r.l,t:r.t}; } } /* 정규시즌 마지막 날 남은 달을 바로 마감 */
  G.offers=(G.offers||[]).filter(x=>{ if(x.exp<day||!tradeOpen()){ addLog(`${tname(x.from)}의 트레이드 제안이 ${x.exp<day?'만료':'트레이드 마감으로 무효가'}되었습니다.`); offerMailDone(x.id); return false;}
    const why=offerBlockMsg(x); if(why){ note('트레이드',`${tname(x.from)}이(가) 트레이드 제안을 철회했습니다. ${why}`); offerMailDone(x.id); return false; } /* 그사이 성사될 수 없게 된 제안은 자동 철회 */ return true; });
}
function specialKind(day,hid,aid){
  if(hid!==G.user&&aid!==G.user)return null;
  if(day===G.cal.open)return '개막전';
  const o=dobj(day);
  if(o.m>=9){ const st=standingsNow(); const ia=st.findIndex(x=>x.tid===hid), ib=st.findIndex(x=>x.tid===aid); const gb=(a,b)=>Math.abs((a.w-a.l)-(b.w-b.l))/2;
    if(Math.max(ia,ib)<=6&&gb(st[ia],st[ib])<=1.5&&Math.min(ia,ib)<=4)return '순위 경쟁'; }
  return null;
}
/* 중계로 볼 우리 경기 직전 선수 기록(저장하지 않는 메모리 사본): 중계 중 선수 화면에서 그 경기 결과(투구 수·세이브·좌우·타구 분포)가 먼저 보이지 않게(검수 11-08) */
let SPOIL_SNAP=null; const SPOIL_K=['gl','ld','lastApp','lastPc','lastStart','prevApp','lsD','lsS','spl','spr','fat','l10','hist'];
function spoilSnapTake(day,tids){ const P={}; for(const t of tids)for(const p of playersOf(t)){ const o={}; for(const k of SPOIL_K)o[k]=p[k]===undefined?undefined:JSON.parse(JSON.stringify(p[k])); P[p.id]=o; } SPOIL_SNAP={day,y:G.year,P}; }
function playDay(day){ if(!G.cal.sched[day]&&!(G.makeup||[]).length)return;
  let userRec=null; const mk=(G.makeup||[]).filter(x=>x.y===G.year); G.makeup=[];
  for(const [h,a] of [...mk.map(x=>[x.h,x.a]),...(G.cal.sched[day]||[])]){
    const kind=specialKind(day,h,a); if(h===G.user||a===G.user)try{ spoilSnapTake(day,[h,a]); }catch(e){}
    let g; try{ g=simGame(day,h,a,false); }catch(e){ try{ for(const t of [h,a])entryManage(t,false); g=simGame(day,h,a,false); }catch(e2){ G.makeup.push({y:G.year,h,a,d:day}); try{ console.error('경기 처리 실패, 다음 경기일로 미룸',dmd(day),h,a,e2); }catch(x){} continue; } } /* 한 경기 오류로 같은 날 다른 경기·날짜만 반영되고 이 경기가 사라지지 않게: 등록을 다시 맞춰 한 번 더, 그래도 안 되면 다음 경기일에 치른다(검수 11-08) */ applyGame(day,h,a,g,false); try{ gtAdd(gameMin(g)); }catch(e){} rivalAfterGame(day,h,a,g,false); let st=null; try{ st=stadGame(day,h,a); }catch(e){}
    if(h===G.user||a===G.user){ if(userRec){ keepGame(userRec); ulog(userRec); } /* 미룬 경기와 같은 날: 앞 경기도 기록 */ userRec=gameRecord(day,h,a,g,kind); try{ gmTenTick(); }catch(e){} if(st){ userRec.att=st.att; userRec.so=st.so; } milestones(g,h===G.user?'h':'a'); }
  }
  if(userRec){
    const me=userRec.home===G.user?'h':'a', op=me==='h'?'a':'h';
    // 노히트 도전: 7회까지 상대 무안타
    if(!userRec.kind&&userRec.hits[op].slice(0,7).reduce((s,x)=>s+x,0)===0&&userRec.hits[op].length>=7){ userRec.kind='노히트 도전'; userRec.from=14; }
    keepGame(userRec); ulog(userRec); G.res={i:0}; prAfterGame(userRec); try{ campPitchHit(userRec); }catch(e){} try{ gmAttendResult(userRec); }catch(e){}
  }
  rankSnap(day);
}
function milestones(g,me){
  const s=g.S[me];
  for(const [id,x] of s.box){ const p=G.players[id]; if(!p)continue;
    if(!p.isP&&x.hr>=3){ note('기록',`${p.name}이(가) 한 경기 홈런 ${x.hr}개를 쳤습니다.`,id); if(G.S_me===s.tid||s.tid===G.user)news('선수',`${p.name}, 한 경기 ${x.hr}홈런 폭발`,`${p.name}이(가) 한 경기에 홈런 ${x.hr}개를 몰아쳤습니다.`,1,{ref:id}); }
    if(p.isP&&x.so>=12)note('기록',`${p.name}이(가) 탈삼진 ${x.so}개를 잡았습니다.`,id);
    if(p.isP&&id===s.sp?.id&&x.outs>=27&&x.h===0&&g.score[me==='h'?'a':'h']===0&&sum([...g.S[me==='h'?'a':'h'].box.values()].map(b=>b.h||0))===0&&[...s.box].filter(([pid,b])=>pid!==id&&G.players[pid]?.isP&&((b.outs||0)+(b.bf||0)+(b.h||0))>0).length===0){ /* 노히트노런: 혼자 끝까지 던지고(완투) 팀이 안타·실점을 하나도 내주지 않아야. 연장에 구원이 안타를 맞으면 아님(검수 11-08) */ stop('기록',`${p.name}이(가) 노히트노런을 달성했습니다.`,id); if(s.tid===G.user)news('선수',`${p.name} 노히트노런 대기록`,`${p.name}이(가) 9이닝 동안 안타를 하나도 내주지 않았습니다.`,4,{ref:id,fanW:2}); } }
}
function futuresWeek(){
  if(period()!=='season')return;
  G.futLn=G.futLn||{};
  for(const t of G.teams){ const d=depth(t.id); const B=d.futB.filter(healthy); const ln=futLineupE(t.id,B); const st=new Set(Object.values(ln).map(p=>p.id));
    G.futLn[t.id]={d:G.day,ln:Object.fromEntries(Object.entries(ln).map(([k,p])=>[k,p.id]))};
    for(const k in ln)futBat(ln[k],t.id,k,3); for(const p of B)if(!st.has(p.id))futBat(p,t.id,null,1);
    { const FP=d.futP.filter(healthy); const rot=FP.slice().sort((a,b)=>(rpPlanOf(t.id,b)==='sp2')-(rpPlanOf(t.id,a)==='sp2')||(spV(b)+roleBias(t.id,b))-(spV(a)+roleBias(t.id,a))).slice(0,clamp(FP.filter(p=>rpPlanOf(t.id,p)==='sp2').length,5,8)); /* 선발 수업 투수가 많으면 2군 로테이션을 7명까지 늘린다: 수업 표기인데 구원만 나가지 않게(검수 11-06) */ for(const p of FP)p.role=rot.includes(p)?'SP':'RP'; } /* 2군도 선발 5명(2군 선발 수업 투수 먼저)과 불펜으로 나눈다 */
    for(const p of d.futP)if(healthy(p))futPit(p,t.id);
  }
  /* 상무 복무 선수: 상무 야구단으로 퓨처스리그에 나간다(기록은 원소속 구단 퓨처스 기록에 합쳐 남는다). 현역은 야구를 못 한다 */
  for(const p of Object.values(G.players)){ if(p.team==null||!milServing(p)||p.mil.unit!=='상무'||!healthy(p)||(p.ntAway>G.day&&p.ntFrom<=G.day))continue; /* 대표팀 소집 중이면 상무 경기에 나가지 않는다(검수 11-07) */ if(p.isP)futPit(p,p.team); else futBat(p,p.team,p.pos,3); }
}
/* 월간 재정 보고: 한 달 사이 올해 예산 여유가 왜 바뀌었는지 항목별로 알려 준다 */
function finSnapNow(){ const b=budget(); const rows={}; for(const [l,v] of b.exp)rows['지출:'+l]=v; for(const [l,v] of b.inc)rows['수입:'+l]=v; rows['지원:구단주 지원 목표']=b.goalSup; return {d:G.day,y:G.year,tid:G.user,st:!!(G.last&&G.last.y>=G.year),room:b.roomGoal,cash:b.cash,rows}; }
function finDiff(a,b){ const keys=new Set([...Object.keys(a.rows),...Object.keys(b.rows)]); const out=[];
  for(const k of keys){ const v0=a.rows[k]||0, v1=b.rows[k]||0; const d=v1-v0; if(Math.abs(d)<50)continue; const [kind,l]=k.split(':'); const eff=kind==='지출'?-d:d; out.push({kind,l,v0,v1,d,eff}); }
  return out.sort((x,y)=>Math.abs(y.eff)-Math.abs(x.eff)); }
function finMonth(m){ if(G.unemp||G.gameOver||(G.fd&&!G.fd.done))return; const now=finSnapNow(); const p=G.finSnap; G.finSnap=now;
  if(!p||p.y!==now.y||p.st!==now.st||(p.tid??now.tid)!==now.tid){ return; } /* 이직하면 다른 구단이라 비교하지 않는다(검수 11-08) */ /* 결산을 사이에 두면 다른 시즌 예산이라 비교하지 않는다 */
  const D=finDiff(p,now); const dr=now.room-p.room; G.finLog=(G.finLog||[]).concat([{m,y:now.y,room0:p.room,room1:now.room,cash0:p.cash,cash1:now.cash,top:D.slice(0,6)}]).slice(-14);
  if(!D.length&&Math.abs(dr)<50&&Math.abs(now.cash-p.cash)<50)return;
  const ln=D.slice(0,5).map(x=>`${x.kind==='지출'?'지출':x.kind==='수입'?'수입':'지원'} · ${x.l}: ${money(x.v0)} → ${money(x.v1)} (전망 ${x.eff>=0?'+':''}${money(x.eff)})`); /* 항목 전망 변화: 확정 예산(잠긴 수입)과 다를 수 있어 '예산 여유'로 부르지 않는다(검수 11-08) */
  const flat=Math.abs(dr)<50; mail('재무팀',`${m}월 재정 보고: 예산 여유 ${money(now.room)} · ${flat?'전월과 같음':`전월 대비 ${money(Math.abs(dr))} ${dr>=0?'증가':'감소'}`}`,`${flat?`올해 예산 여유는 지난달과 같은 ${money(now.room)}입니다.`:`지난달 대비 올해 예산 여유가 ${money(p.room)}에서 ${money(now.room)}(으)로 ${dr>=0?'늘었':'줄었'}습니다.`} 보유 현금은 ${money(p.cash)} → ${money(now.cash)}입니다(올해 수입·지출은 시즌 결산 때 현금에 반영됩니다). /* 변화 0을 '증가'로 적지 않는다(리뷰 11-08) */\n\n${ln.length?'바뀐 항목\n'+ln.join('\n'):'항목별 변화는 크지 않습니다.'}\n\n항목별 숫자는 전망 변화이고, 확정된 수입은 예산 여유에 바로 더해지지 않을 수 있습니다. 예산 여유는 올해 예상 수입과 구단주 지원 목표에서 올해 예상 지출을 뺀 값입니다. 선수 영입·코치 고용·시설 공사가 지출 예상을 늘리고, 성적과 관중이 수입 예상을 바꿉니다.`,{kind:'재정',acts:[{l:'재정 보기',a:'go',v:'club:fin'}]}); }
function monthReport(m){
  const S=G.sea; const r=S.rec[G.user]; const prev=S.mark||{w:0,l:0,t:0};
  try{ pactMonth(m); }catch(e){} try{ rolePromCheck(m); }catch(e){}
  try{ dataReport(m); }catch(e){}
  const mw=r.w-prev.w, ml=r.l-prev.l; S.months.push({m:m+'월',w:mw,l:ml,t:(r.t||0)-(prev.t||0)}); S.mark={w:r.w,l:r.l,t:r.t};
  const best=domestic(G.user).concat(foreignOf(G.user)).map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h).sort((a,b)=>warOf(b.h,b.p)-warOf(a.h,a.p))[0];
  prMonth(m);
  try{ const mg=G.mgr[G.user]; if(mg&&!mg.interim&&!G.unemp){ const w0=G.mgrTalkW; G.mgrTalkW=Math.floor(G.day/7); const a1=mgrTalk('now').a, a2=mgrTalk('need').a; G.mgrTalkW=w0;
    mail(`${mg.name} 감독`,`${m}월 감독 면담`,`${a1.replace(/^.*?감독: /,'')}\n\n급한 자리: ${a2.replace(/^.*?감독: /,'')}`,{kind:'감독',acts:[{l:'감독실로',a:'goWork',v:'감독'}]}); } }catch(e){}
  note('월간',`${m}월 ${mw}승 ${ml}패. 시즌 ${r.w}승 ${r.l}패 ${standingsNow().findIndex(x=>x.tid===G.user)+1}위.${best?` 팀 내 WAR 1위 ${best.p.name}.`:''}`);
}
/* 순위(KBO): 승률(무승부 제외) → 같으면 상대 전적 → 다득점 → 전년도 순위. 1위·5위 동률은 시즌 뒤 결정전(seasonEnd) */
function h2hPct(a,b){ const L=((G.sea&&G.sea.tl)||[])[a]||[]; let w=0,l=0; for(const x of L)if(x[4]===b){ if(x[0]>0)w++; else if(x[0]<0)l++; } return w+l?w/(w+l):.5; }
function rsOf(a){ const L=((G.sea&&G.sea.tl)||[])[a]||[]; let s=0; for(const x of L)s+=x[1]||0; return s; }
/* 동률이면 같은 순위(공동 n위): 홈·일정·카드·리그 화면과 구단주 목표가 같은 기준을 쓴다 */
const tieOf=(a,b)=>a&&b&&a.w*Math.max(1,b.w+b.l)===b.w*Math.max(1,a.w+a.l); /* KBO 순위는 승률(무승부 제외)이 같으면 공동: 결정전 판정과 같은 기준(검수 11-07) */
function tieRank(order,tid){ const i=order.findIndex(o=>(o.tid??o)===tid); if(i<0)return 0; let j=i; while(j>0&&tieOf(order[j-1],order[i]))j--; return j+1; }
function standingsNow(){ const r=G.sea.rec; const pct=x=>x.w/Math.max(1,x.w+x.l); const prev=(G.last&&G.last.order)||[]; const pr=t=>{ const i=prev.findIndex(x=>(x.tid??x)===t); return i<0?99:i; };
  const L=G.teams.map(t=>({tid:t.id,w:r[t.id].w,l:r[t.id].l,t:r[t.id].t||0})).sort((a,b)=>pct(b)-pct(a)); const out=[];
  /* 같은 승률 묶음은 묶음 안 상대 전적 합계로(3팀 이상 순환 우세에도 팀 배열 순서와 무관, 검수 11-07) → 득실 → 지난 순위 */
  for(let i=0;i<L.length;){ let j=i; while(j<L.length&&Math.abs(pct(L[j])-pct(L[i]))<1e-12)j++; const grp=L.slice(i,j); const ids=new Set(grp.map(x=>x.tid));
    const gp=x=>{ let w=0,l=0; for(const g of ((G.sea&&G.sea.tl)||[])[x.tid]||[])if(ids.has(g[4])&&g[4]!==x.tid){ if(g[0]>0)w++; else if(g[0]<0)l++; } return w+l?w/(w+l):.5; };
    const gr=x=>{ let r=0; for(const g of ((G.sea&&G.sea.tl)||[])[x.tid]||[])if(ids.has(g[4])&&g[4]!==x.tid)r+=g[1]||0; return r; }; /* KBO: 상대 경기 다득점(맞대결에서 낸 점수, 검수 11-08) */
    out.push(...grp.sort((a,b)=>(gp(b)-gp(a))||(gr(b)-gr(a))||(pr(a.tid)-pr(b.tid))||(a.tid-b.tid))); i=j; }
  return out; }
const pctEq=(a,b)=>Math.abs(a.w/Math.max(1,a.w+a.l)-b.w/Math.max(1,b.w+b.l))<1e-12;


/* 핵심 결정 기한 하루 전 한 번 더 알림: 알렸으면 true(진행을 멈춘다) */
function evLastWarn(){ const last=(G.evs||[]).find(e=>!e.done&&evStops(e)&&EV_KEY.has(e.k)&&!e.warn&&e.exp-G.day<=1); if(!last)return false; last.warn=true; const wt=`${last.exp<=G.day?'오늘':'내일'}까지 정하지 않으면 "${last.opts[last.def].l}"(으)로 처리됩니다.`; /* 마감 당일이면 '오늘'(검수 11-08) */ const em=G.mail.find(m=>m.id===last.mid)||G.mail.find(m=>(m.acts||[]).some(a=>a.a==='evPick'&&String(a.v).split(':')[0]===String(last.id))); if(em)mailBump(em,wt); else stop('결정',`${wt.slice(0,-1)}: ${last.title}`); return true; }
