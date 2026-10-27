/* ===== 하루 진행 ===== */
function blocker(){
  if(G.demoEnd)return '체험판은 여기까지입니다.';
  if(G.gameOver)return '경질되었습니다.';
  if(G.live)return '경기를 먼저 끝까지 보세요.';
  if(G.res)return '방금 끝난 경기 결과를 확인하세요.';
  if(G.fdWait)return '창단 드래프트를 시작하세요.';
  if(G.fd&&!G.fd.done)return '창단 드래프트를 먼저 마치세요.';
  if(G.draft&&!G.draft.done)return '신인 드래프트를 먼저 마치세요.';
  const cp=(G.comp||[]).find(c=>(c.stage==='protect'&&c.to===G.user)||(c.stage==='pick'&&c.from===G.user));
  if(cp)return cp.stage==='protect'?`${cp.name} 영입 보상: 보호선수 명단을 먼저 제출하세요.`:`${cp.name} 이적 보상: 보상선수(또는 보상금)를 먼저 고르세요.`;
  const per=period();
  if(per==='pre'&&G.day>=G.cal.open-1&&!G.mgr[G.user])return '감독이 없습니다. 스태프 → 감독에서 감독을 선임해야 개막할 수 있습니다.';
  if(per==='season'||(per==='pre'&&G.day>=G.cal.open-1)){ const n=rosterN(G.user);
    if(n>ROSTER_MAX)return `로스터가 ${n}명입니다. ${ROSTER_MAX}명 이하로 줄여야 진행할 수 있습니다.`;
    const d=depth(G.user); if(d.start.length<9)return '건강한 야수가 9명이 안 됩니다.'; if(d.sp.length+d.pen.length<8)return '건강한 투수가 부족합니다.'; }
  return '';
}
function advance(mode){
  const start=G.day; const o=dobj(start);
  let target=mode==='day'?start+1:mode==='week'?start+7:mode==='month'?dnum(o.m===12?o.y+1:o.y,o.m===12?1:o.m+1,1):start+400;
  if(mode==='month'&&target-start<2)target=start+30;
  G.stops=[]; const r0=G.sea.rec[G.user]; const w0=r0.w,l0=r0.l; let days=0;
  /* 다음 일까지(event): 경기 결과에서 멈추지 않고, 중요한 소식·결정·포스트시즌 경기·한 주가 끝날 때(월요일) 멈춘다 */
  if(mode==='event'){ G.dig={from:start+1,to:start,games:[],snap:digSnap(),rk:userRank(),ev0:(G.evs||[]).filter(e=>!e.done).length}; target=start+60; } else G.dig=null;
  while(G.day<target){
    if(G.unemp)unempAuto();
    if(blocker())break;
    processDay(); days++;
    if(G.unemp){ unempAuto(); G.res=null; G.stops=G.stops.filter(x=>x.kind==='경력'); }
    if(mode==='event'){ const D=G.dig; D.to=G.day;
      if(G.res){ const g=G.games[G.res.i]; D.games.push(g?g.day:G.day); if(g&&/차전/.test(g.kind||''))break; G.res=null; }
      if(G.stops.length||G.live||(G.draft&&!G.draft.done)||G.gameOver)break;
      { const op=(G.evs||[]).filter(e=>!e.done); if(op.some(e=>EV_KEY.has(e.k)&&e.day>start))break; if((G.offers||[]).some(o=>o.day!=null?o.day>start:false))break; }
      if(D.games.length&&dobj(G.day+1).w===1)break; /* 다음 날이 월요일(휴식일)이면 한 주 정리 */
      if(D.games.length===0&&days>=14&&period()!=='season')break;
      if(G.unemp&&days>=14)break;
      continue; }
    if(G.stops.length||G.live||G.res||(G.draft&&!G.draft.done)||G.gameOver)break;
  }
  if(mode==='event'&&G.dig&&!G.dig.games.length)G.dig=null;
  const r1=G.sea.rec[G.user];
  G.lastAdv={days,from:start,to:G.day,w:r1.w-w0,l:r1.l-l0};
  return G.lastAdv;
}
/* 주간 요약용: 우리 선수 시즌 누적 기록 스냅숏 */
const DIGK=['pa','ab','h','bb','hr','rbi','d','tr','sb','outs','er','so','w','l','sv','hld','g','gs'];
function digSnap(){ const o={}; for(const p of playersOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); o[p.id]=h?DIGK.map(k=>h[k]||0):DIGK.map(()=>0); } return o; }
function userRank(){ try{ const st=standingsNow(); return st.findIndex(x=>x.tid===G.user)+1; }catch(e){ return 0; } }
/* 시즌 제한(현재 꺼 둠): 켜면 첫 시즌을 마치고 스토브리그 직전에서 멈춘다 */
const GAME_VER='0.9'; const DEMO={on:false,seasons:1}; /* 무료 정식 공개: 시즌 제한 없음 */
function demoOver(){ return DEMO.on&&G.year>=(G.startY||2026)+DEMO.seasons-1&&!G.unemp; }
function processDay(){
  if(G.demoEnd)return;
  G.day++; const day=G.day, o=dobj(day);
  if(day===KD(11,1)&&demoOver()){ G.day--; G.demoEnd=true; stop('체험판',`${G.year}시즌을 모두 마쳤습니다. 체험판은 여기까지입니다. 홈 화면에서 한 시즌 기록을 확인하세요.`); return; }
  if(o.m===1&&o.d===1){ newYear(); planSup(); ovrSnap(); }
  else if(o.d===1&&foreignOpen())refreshFMarket(12,3);
  dailyCost(); try{ stadDaily(); newStadDaily(); }catch(e){} try{evDaily();}catch(e){} try{ ovsDaily(); }catch(e){} try{ compDaily(); }catch(e){} try{ marketDaily(); }catch(e){}
  milDaily();
  recoverAll(1);
  if(o.w===0)for(const p of Object.values(G.players)){ if(p.sf&&p.sf.y===G.year)p.sf.m=clamp((p.sf.m||0)*.65+N(0,p.foreign?.75:.55),-2.5,2.5); }
  for(const p of Object.values(G.players)) if(p.injOut>0){ p.injOut--; if(p.injOut===0&&p.team===G.user)note('복귀',`${p.name}이(가) 부상에서 돌아왔습니다.`,p.id); }
  const c=G.cal;
  if(day===KD(2,1))for(const t of G.teams)if(t.id!==G.user){aiForeignFill(t.id,false);aiForeignFill(t.id,false);aiForeignFill(t.id,false);aiForeignFill(t.id,false);}
  if(day===KD(1,10))faUnsignedNote();
  if(day===KD(1,24)&&G.fa&&!G.fa.closed)faClose();
  if(day===KD(1,31)&&G.contract&&!G.contract.done){ { let g=0; while(fReCapInfo().over>0&&g++<4){ const C=G.contract; const k=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id)).sort((a,b)=>b.newSal-a.newSal)[0]; if(!k)break; C.foreignDrop.push(k.id); } } confirmContracts(); stop('연봉','연봉 계약 마감일입니다. 남은 선수는 제시안대로 계약했습니다.'); }
  if(day===c.camp)campStart();
  if(day===c.campEnd)campEnd();
  if(day===c.exh)note('일정','시범경기가 시작됩니다. 개막까지 2주 남았습니다.');
  if(day===c.open-1){ G.entryY=G.year; for(const t of G.teams){ setEntry(t.id); t.rot=0; } for(const p of Object.values(G.players))if(p.isP)delete p.lastStart; stop('일정',`내일(${dmd(c.open)}) ${G.year} 시즌이 개막합니다. 개막 엔트리가 정해졌습니다. 선수단 구성은 오늘까지 점검하세요.`); }
  if(day===c.open){ openingDay(); G.fut0={y:G.year,m:Object.fromEntries(playersOf(G.user).map(p=>[p.id,ovr(p)]))}; }
  if(day===KD(7,17)&&!G.unemp&&G.sea&&G.sea.y===G.year){ try{ deadlineDecision(); }catch(e){} }
  if(day===KD(7,24)||day===KD(7,28)){ try{ deadlineRumors(day===KD(7,28)); }catch(e){} }
  if(day===KD(7,24))stop('일정','트레이드 마감까지 7일 남았습니다. 7월 31일 이후 포스트시즌이 끝날 때까지 트레이드할 수 없습니다. 다른 구단 제안이 몰리는 시기입니다.');
  if(day===tradeDL())stop('일정','오늘 자정 트레이드가 마감됩니다. 남은 제안과 협상을 오늘 안에 정리하세요.');
  if(day===KD(8,8)){ const n=foreignOf(G.user).filter(p=>p.foreign==='용병'&&healthy(p)).length; (n<3?stop:note)('일정',`외국인 선수 포스트시즌 등록 마감(8월 15일)까지 7일 남았습니다. 건강한 외국인 선수 ${n}명.`); }
  if(o.d===1&&o.m>=5&&o.m<=9&&period()==='season'){ try{ futuresReport(); }catch(e){} }
  if(o.d===1){ try{ growSnap(); }catch(e){} }
  if(day===c.asg)note('일정','올스타전이 열렸습니다. 후반기가 곧 시작됩니다.');
  if(day===c.draft)startDraft();
  if(entryOn()&&period()==='season'){ const wk=o.w===1; for(const t of G.teams)entryManage(t.id,wk&&(t.id!==G.user||R()<.7)); }
  if(c.sched[day])playDay(day);
  if(day===c.end+1)seasonEnd();
  if(G.ps&&!G.ps.done)psDay(day);
  if(G.ps&&G.ps.done&&G.ps.finDay===day){ settlement(); try{ stadSeasonNote(); }catch(e){} try{ draftRetro(); }catch(e){} }
  if(day===KD(11,1)){ offseason(); offseasonMgr(); try{ stadAI(); }catch(e){} }
  if(day===KD(11,2))faAnnounce();
  if(G.fa&&G.fa.open&&!G.fa.closed&&day>=G.fa.openDay)faDay(day);
  if(day===KD(12,1)){ contractStart(); aiCapAll(); capWarnUser(); }
  try{ salTalkDaily(day); }catch(e){}
  if(day===KD(12,10)){ try{ capCouncil(); }catch(e){} }
  if(day===KD(12,15)){ try{ milWarn(); }catch(e){} }
  if(day===KD(1,31)||day===G.cal.open-2)aiCapAll();
  if(o.w===0){ for(const t of G.teams){ if(t.id!==G.user&&rosterN(t.id)>ROSTER_MAX)trimRoster(t.id,ROSTER_MAX); } for(const m of G.mail){ if(!m.read&&!m.imp&&G.day-m.day>(m.kind==='업무'||(m.acts&&m.acts.length)?14:5))m.read=true; if(m.imp&&m.kind==='일정'&&G.day-m.day>=3){ m.imp=false; m.read=true; } } /* 날짜가 지난 일정 안내는 읽음 처리 */ futuresWeek(); aiWeekly(); moraleWeek(); try{roleWeek();}catch(e){} try{relSnap();}catch(e){} if(G.coach)try{coachMarketMonth();}catch(e){} try{evWeek();}catch(e){} devWeek(); if(period()==='season')updateLg(G.year); }
  tutTick();
  const nx=dobj(day+1); if(nx.d===1&&day>=c.open&&day<=c.end+1)monthReport(o.m); if(nx.d===1){ try{ finMonth(o.m); }catch(e){} }
  if(day===c.end){ const S=G.sea, r=S.rec[G.user], mk=S.mark||{w:0,l:0,t:0}; if(r&&r.w+r.l+(r.t||0)>mk.w+mk.l+(mk.t||0)){ S.months.push({m:dobj(c.end).m+'월',w:r.w-mk.w,l:r.l-mk.l,t:(r.t||0)-(mk.t||0)}); S.mark={w:r.w,l:r.l,t:r.t}; } } /* 정규시즌 마지막 날 남은 달을 바로 마감 */
  G.offers=(G.offers||[]).filter(x=>{ if(x.exp<day){ addLog(`${tname(x.from)}의 트레이드 제안이 만료되었습니다.`); offerMailDone(x.id); return false;} return true; });
}
function specialKind(day,hid,aid){
  if(hid!==G.user&&aid!==G.user)return null;
  if(day===G.cal.open)return '개막전';
  const o=dobj(day);
  if(o.m>=9){ const st=standingsNow(); const ia=st.findIndex(x=>x.tid===hid), ib=st.findIndex(x=>x.tid===aid); const gb=(a,b)=>Math.abs((a.w-a.l)-(b.w-b.l))/2;
    if(Math.max(ia,ib)<=6&&gb(st[ia],st[ib])<=1.5&&Math.min(ia,ib)<=4)return '순위 경쟁'; }
  return null;
}
function playDay(day){
  let userRec=null;
  for(const [h,a] of G.cal.sched[day]){
    const kind=specialKind(day,h,a);
    const g=simGame(day,h,a,false); applyGame(day,h,a,g,false); let st=null; try{ st=stadGame(day,h,a); }catch(e){}
    if(h===G.user||a===G.user){ userRec=gameRecord(day,h,a,g,kind); if(st){ userRec.att=st.att; userRec.so=st.so; } milestones(g,h===G.user?'h':'a'); }
  }
  if(userRec){
    const me=userRec.home===G.user?'h':'a', op=me==='h'?'a':'h';
    // 노히트 도전: 7회까지 상대 무안타
    if(!userRec.kind&&userRec.hits[op].slice(0,7).reduce((s,x)=>s+x,0)===0&&userRec.hits[op].length>=7){ userRec.kind='노히트 도전'; userRec.from=14; }
    keepGame(userRec); ulog(userRec); G.res={i:0}; prAfterGame(userRec);
  }
  rankSnap(day);
}
function milestones(g,me){
  const s=g.S[me];
  for(const [id,x] of s.box){ const p=G.players[id]; if(!p)continue;
    if(!p.isP&&x.hr>=3){ note('기록',`${p.name}이(가) 한 경기 홈런 ${x.hr}개를 쳤습니다.`,id); if(G.S_me===s.tid||s.tid===G.user)news('선수',`${p.name}, 한 경기 ${x.hr}홈런 폭발`,`${p.name}이(가) 한 경기에 홈런 ${x.hr}개를 몰아쳤습니다.`,1,{ref:id}); }
    if(p.isP&&x.so>=12)note('기록',`${p.name}이(가) 탈삼진 ${x.so}개를 잡았습니다.`,id);
    if(p.isP&&id===s.sp?.id&&x.outs>=27&&x.h===0){ stop('기록',`${p.name}이(가) 노히트노런을 달성했습니다.`,id); if(s.tid===G.user)news('선수',`${p.name} 노히트노런 대기록`,`${p.name}이(가) 9이닝 동안 안타를 하나도 내주지 않았습니다.`,4,{ref:id,fanW:2}); } }
}
function futuresWeek(){
  if(period()!=='season')return;
  for(const t of G.teams){ const d=depth(t.id);
    for(const p of d.futB){ const h=lineFor(p,G.year,t.id,'퓨처스'); addTo(h,Object.assign({g:3},simBat(p,ri(9,14),7))); if(!h.pos)h.pos=p.pos; }
    for(const p of d.futP){ const o=simPit(p,isSPr(p)?ri(12,18):ri(4,8),7); o.g=isSPr(p)?1:2; o.gs=isSPr(p)?1:0; addTo(lineFor(p,G.year,t.id,'퓨처스'),o); }
  }
}
/* 월간 재정 보고: 한 달 사이 올해 예산 여유가 왜 바뀌었는지 항목별로 알려 준다 */
function finSnapNow(){ const b=budget(); const rows={}; for(const [l,v] of b.exp)rows['지출:'+l]=v; for(const [l,v] of b.inc)rows['수입:'+l]=v; rows['지원:구단주 지원 목표']=b.goalSup; return {d:G.day,y:G.year,room:b.roomGoal,cash:b.cash,rows}; }
function finDiff(a,b){ const keys=new Set([...Object.keys(a.rows),...Object.keys(b.rows)]); const out=[];
  for(const k of keys){ const v0=a.rows[k]||0, v1=b.rows[k]||0; const d=v1-v0; if(Math.abs(d)<50)continue; const [kind,l]=k.split(':'); const eff=kind==='지출'?-d:d; out.push({kind,l,v0,v1,d,eff}); }
  return out.sort((x,y)=>Math.abs(y.eff)-Math.abs(x.eff)); }
function finMonth(m){ if(G.unemp||G.gameOver||(G.fd&&!G.fd.done))return; const now=finSnapNow(); const p=G.finSnap; G.finSnap=now;
  if(!p||p.y!==now.y){ return; }
  const D=finDiff(p,now); const dr=now.room-p.room; G.finLog=(G.finLog||[]).concat([{m,y:now.y,room0:p.room,room1:now.room,cash0:p.cash,cash1:now.cash,top:D.slice(0,6)}]).slice(-14);
  if(!D.length&&Math.abs(dr)<50&&Math.abs(now.cash-p.cash)<50)return;
  const ln=D.slice(0,5).map(x=>`${x.kind==='지출'?'지출':x.kind==='수입'?'수입':'지원'} · ${x.l}: ${money(x.v0)} → ${money(x.v1)} (예산 여유 ${x.eff>=0?'+':''}${money(x.eff)})`);
  mail('재무팀',`${m}월 재정 보고: 예산 여유 ${dr>=0?'+':''}${money(dr)}`,`지난달 대비 올해 예산 여유가 ${money(p.room)}에서 ${money(now.room)}(으)로 ${dr>=0?'늘었':'줄었'}습니다. 보유 현금은 ${money(p.cash)} → ${money(now.cash)}입니다.\n\n${ln.length?'바뀐 항목\n'+ln.join('\n'):'항목별 변화는 크지 않습니다.'}\n\n예산 여유는 올해 예상 수입과 구단주 지원 목표에서 올해 예상 지출을 뺀 값입니다. 선수 영입·코치 고용·시설 공사가 지출 예상을 늘리고, 성적과 관중이 수입 예상을 바꿉니다.`,{kind:'재정',acts:[{l:'재정 보기',a:'go',v:'club:fin'}]}); }
function monthReport(m){
  const S=G.sea; const r=S.rec[G.user]; const prev=S.mark||{w:0,l:0,t:0};
  try{ pactMonth(m); }catch(e){}
  try{ dataReport(m); }catch(e){}
  const mw=r.w-prev.w, ml=r.l-prev.l; S.months.push({m:m+'월',w:mw,l:ml,t:(r.t||0)-(prev.t||0)}); S.mark={w:r.w,l:r.l,t:r.t};
  const best=domestic(G.user).concat(foreignOf(G.user)).map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h).sort((a,b)=>warOf(b.h,b.p)-warOf(a.h,a.p))[0];
  prMonth(m);
  try{ const mg=G.mgr[G.user]; if(mg&&!mg.interim&&!G.unemp){ const w0=G.mgrTalkW; G.mgrTalkW=Math.floor(G.day/7); const a1=mgrTalk('now').a, a2=mgrTalk('need').a; G.mgrTalkW=w0;
    mail(`${mg.name} 감독`,`${m}월 감독 면담`,`${a1.replace(/^.*?감독: /,'')}\n\n급한 자리: ${a2.replace(/^.*?감독: /,'')}`,{kind:'감독',acts:[{l:'감독실로',a:'goWork',v:'감독'}]}); } }catch(e){}
  note('월간',`${m}월 ${mw}승 ${ml}패. 시즌 ${r.w}승 ${r.l}패 ${standingsNow().findIndex(x=>x.tid===G.user)+1}위.${best?` 팀 내 WAR 1위 ${best.p.name}.`:''}`);
}
function standingsNow(){ const r=G.sea.rec; return G.teams.map(t=>({tid:t.id,w:r[t.id].w,l:r[t.id].l,t:r[t.id].t||0})).sort((a,b)=>((b.w/Math.max(1,b.w+b.l))-(a.w/Math.max(1,a.w+a.l)))||b.w-a.w); }

