/* ===== 연봉 협상(보류권 국내 선수): 구단 산정안 → 선수 요구 → 단장 제시 → 합의, 안 되면 연봉조정 =====
   기준은 직전 시즌 성적이다. 구단은 1군 WAR로 인상 폭 상한을 정하고(newSalary), 같은 연차·능력 보류권 선수의 기준액 쪽으로 맞춘다.
   실제 KBO 연봉조정: 1984년 이후 신청 98건 중 조정위원회까지 간 20건에서 선수가 이긴 것은 2번(2002 류지현, 2021 주권)뿐이다.
   조정위원회는 구단안과 선수안 중 하나만 고른다. 게임에서는 1월 10일 신청 마감, 1월 20일 결정으로 둔다 */
const ARB_SVC=3;
function salBasis(p){ const yh=G.contract&&G.contract.y!=null?G.contract.y:(dobj(G.day).m<=2?G.year-1:G.year);
  const hh=seasonTotal(p,yh,'1군'); const enough=hh&&(p.isP?hh.outs>=75:hh.pa>=120); const war=hh?warOf(hh,p):0;
  const cap=!enough?15:war<=0?0:Math.round(clamp(war*.4,.03,1.9)*100); /* 표본이 적으면 newSalary처럼 1군·2군 기여로 최대 +15%(사용자 피드백 11-05: 상한 +0%인데 인상) */
  const band=!enough?'1군 표본 부족 · 2군 기여 반영':war>=5?'리그 정상급':war>=3?'주전 핵심':war>=2?'주전급':war>=1?'쏠쏠한 활약':war>0?'기여 적음':'부진';
  return {h:hh,war,enough,band,cap,ref:round5(marketSal(ovr(p)+pvShift(p))*nonFaF(p,false))}; }
/* 선수 요구액: 깎는 안이면 동결 쪽을, 잘했으면 산정안보다 조금 더(야망이 클수록 더) 원한다 */
function salAsk(p,off){ const b=salBasis(p); initPers(p); const amb=p.pers.amb;
  if(off<p.sal)return round5(Math.max(off,p.sal*(b.war>=.5?1:.94)));
  const want=b.enough&&b.war>=1?.03+b.war*.045+(amb-12)*.007:(amb-12)*.003;
  /* 예비 FA는 시장을 알고 있어 조금 더 부른다 */
  const pf=preFA(p)&&b.war>=1?.05:0;
  const lim=!p.faC&&!p.ext&&(p.svc||0)<faSvc(p)?Math.max(off,preCap(p)):Infinity; return round5(Math.min(lim,Math.max(off,off*(1+clamp(want+pf,0,.45))*agSalMul(p)))); }
function salTalkInit(){ const C=G.contract; if(!C||C.neg)return; if(C.y==null)C.y=dobj(G.day).m<=2?G.year-1:G.year; C.neg={};
  for(const id of C.ended){ const p=G.players[id]; if(!p||p.newSal==null)continue; const off=p.newSal; const n=C.neg[id]={off,ask:salAsk(p,off),cur:null,st:'open',wk:-1}; const m=p.mil; if(m&&m.until&&!m.done&&!m.exempt&&m.until>G.day){ n.milPrev={st:'open',ns:off,has:true}; n.st='ok'; n.mil=true; p.newSal=p.sal; } } } /* 복무 중·입대 예정 선수는 협상 개설 전에 예약했어도 입대 처리(enlist)와 같게 지금 연봉으로 잠근다. 예약 취소·특례면 milNegBack이 되돌린다(검수 11-09g) */
function salNeg(id){ const C=G.contract; if(!C)return null; salTalkInit(); return C.neg&&C.neg[id]||null; }
/* 단장이 금액을 제시한다. 한 선수에게는 한 주에 한 번. 요구액에 가까우면 받아들이고, 아니면 요구액을 조금 낮춰 답한다 */
function salOffer(id,amt,force){ const C=G.contract; const p=G.players[id]; const n=salNeg(id); if(!C||C.done||!p||!n)return '협상 대상이 아닙니다.'; if(n.st!=='open')return `${p.name}와(과)는 이미 ${n.st==='ok'?'합의했습니다':'연봉조정 중입니다'}.`;
  amt=Math.max(MIN_SAL,Math.round(+amt)); if(!Number.isSafeInteger(amt))return '올바른 연봉을 입력하세요.'; const wk=Math.floor(G.day/7); if(!force&&n.wk===wk&&amt<n.ask)return `${agWho(p)}: 이번 주에는 더 이야기하지 않겠습니다. 다음 주에 다시 만나시죠.`;
  n.wk=wk; n.cur=amt; initPers(p); const ag=hasAgent(p)?agentOf(p):null; const tol=.01+(p.pers.loy-4)*.002+(ag?(agRel(ag)-50)/2000:0);
  if(amt>=n.ask||amt>=n.ask*(1-Math.max(0,tol))){ n.st='ok'; /* 요구액을 그대로 주면 친분과 상관없이 합의(검수 11-06) */ p.newSal=amt; if(amt>=n.ask)p.mor=clamp((p.mor??60)+2,0,100); if(preFA(p)&&amt>=preFAPremium(p,n.off)*.98){ p.prem=G.year; p.mor=clamp((p.mor??60)+3,0,100); } if(ag&&amt>=n.ask)agRelAdd(ag,1,`${p.name} 연봉 합의`); return `${ag?agWho(p):p.name}: ${money(amt)}에 합의했습니다.`; }
  const prev=n.ask; n.ask=round5(Math.max(amt,n.ask-(n.ask-amt)*.25)); return `${agWho(p)}: ${money(amt)}으로는 어렵습니다. ${n.ask<prev?`${money(n.ask)}이면 사인하겠습니다.`:`${money(n.ask)}을 원합니다.`}`; }
/* 산정안 일괄 제시: 아직 한 번도 제시하지 않은 선수에게 구단 산정안을 낸다 */
function salOfferAll(){ salTalkInit(); const C=G.contract; let ok=0, no=0; for(const id of Object.keys(C.neg)){ const n=C.neg[id]; if(n.st!=='open'||n.cur!=null)continue; const r=salOffer(+id,n.off,true); if(C.neg[id].st==='ok')ok++; else no++; void r; }
  return `산정안을 제시했습니다. ${ok}명 합의${no?`, ${no}명은 더 원합니다`:''}.`; }
/* 1월 10일: 조건이 맞지 않는 3년차 이상 선수는 연봉조정을 신청할 수 있다 */
function salArbFile(){ const C=G.contract; if(!C||C.done||!C.neg)return; const L=[];
  for(const id of Object.keys(C.neg)){ const n=C.neg[id]; const p=G.players[id]; if(!p||p.team!==(C.tid??G.user)||n.st!=='open'||(p.svc||0)<ARB_SVC)continue; const club=n.cur??n.off; initPers(p);
    if(n.ask/club-1>=.05&&R()<.35+(p.pers.amb-10)*.03+(hasAgent(p)&&agentOf(p).style==='hard'?.12:0)){ n.st='arb'; n.arb={club,player:n.ask}; L.push(p); } }
  if(L.length)mail('운영팀',`연봉조정 신청 ${L.length}명`,`${L.map(p=>`${p.name}: 구단 ${money(C.neg[p.id].arb.club)} / 선수 ${money(C.neg[p.id].arb.player)}`).join('\n')}\n\n${ASSOC.s} 연봉조정위원회는 두 금액 중 하나만 고릅니다. 1월 20일에 결정이 나옵니다. 그 전에 선수안을 받아들이면 신청은 취하됩니다. 실제 리그에서 선수가 이긴 경우는 20번 중 2번입니다.`,{kind:'연봉',imp:true,acts:[{l:'연봉 협상 보기',a:'go',v:'transfer:contract'}]}); }
/* 조정위원회: 직전 성적이 좋고 요구가 크지 않을수록 선수가 이길 가능성이 조금 오른다(그래도 대부분 구단이 이긴다) */
function salArbDecide(){ const C=G.contract; if(!C||!C.neg)return; const out=[];
  for(const id of Object.keys(C.neg)){ const n=C.neg[id]; const p=G.players[id]; if(!p||p.team!==(C.tid??G.user)||n.st!=='arb')continue; const b=salBasis(p);
    const pw=clamp(.06+(b.war>=3?.07:0)+(n.arb.player<=n.arb.club*1.12+.5?.05:0) /* 정확히 12%가 부동소수 오차로 빠지지 않게 */,.04,.22); const win=R()<pw; const v=win?n.arb.player:n.arb.club;
    n.st='ok'; p.newSal=v; p.mor=clamp((p.mor??60)+(win?3:-8),0,100); out.push(`${p.name}: ${win?'선수 승리':'구단 승리'} ${money(v)}`); story(p,`연봉조정 ${win?'승리':'패배'} (${money(v)})`,'move'); }
  if(out.length)mail('운영팀','연봉조정위원회 결정',`${out.join('\n')}\n\n조정에서 진 선수는 서운함이 남아 기분이 크게 떨어집니다.`,{kind:'연봉',acts:[{l:'연봉 협상 보기',a:'go',v:'transfer:contract'}]}); }
/* 일괄 확정 미리보기: 실제 확정(confirmContracts→salTalkClose)과 같은 규칙. 합의·제시액으로 정해지는 선수(fix)와 연봉조정 중이라 확정 순간 결과가 갈리는 선수(arb: 구단안/선수안)를 나눈다 */
function confirmPreview(){ const C=G.contract; if(!C)return null; const own=id=>{ const p=G.players[id]; return p&&p.team===G.user; }; const fix=[], arb=[], hold=[];
  for(const id of (C.ended||[]).filter(own)){ const p=G.players[id]; const n=C.neg&&C.neg[id]; if(n&&n.st==='arb'&&n.arb){ arb.push({p,from:p.sal,club:n.arb.club,player:n.arb.player}); continue; } const to=n&&n.st==='open'?(n.cur??n.off):p.newSal; if(to==null)continue; if(n&&n.st==='open'&&n.ask>to*HOLD_GAP){ hold.push({p,from:p.sal,to:Math.max(MIN_SAL,to),ask:n.ask}); continue; } /* 확정 때 사인을 거부할 선수(salTalkClose와 같은 기준) */ fix.push({p,from:p.sal,to:Math.max(MIN_SAL,to)}); }
  const dFix=sum(fix.map(x=>x.to-x.from)); return {fix,arb,hold,dFix,dArbLo:sum(arb.map(x=>x.club-x.from)),dArbHi:sum(arb.map(x=>x.player-x.from))}; }
/* 마감(확정): 남은 선수는 구단의 마지막 제시액에 사인한다. 조정 중이면 바로 결정한다 */
function salTalkClose(){ const C=G.contract; if(!C||!C.neg)return; if(Object.values(C.neg).some(n=>n.st==='arb'))salArbDecide();
  for(const id of Object.keys(C.neg)){ const n=C.neg[id]; const p=G.players[id]; if(!p||p.team!==(C.tid??G.user)||n.st!=='open')continue; const v=n.cur??n.off;
    if(n.ask>v*HOLD_GAP&&(C.tid??G.user)===G.user){ holdStart(p,v,n.ask); n.st='hold'; continue; } /* 요구와 차이가 크면 사인하지 않고 미계약으로 버틴다(KBO: 미계약 선수는 참가활동 불가) */
    p.newSal=v; n.st='ok'; if(n.ask>v*1.03)p.mor=clamp((p.mor??60)-4,0,100); } }
/* 연봉 미계약(홀드아웃): 구단 제시액과 선수 요구액 차이가 15% 넘게 남은 채 마감되면 사인하지 않는다. 미계약 선수는 훈련·경기 등 참가활동을 못 한다(healthy). 협상은 개막 전까지 이어진다 */
const HOLD_GAP=1.15;
function holdStart(p,off,ask){ p.hold={off:Math.max(MIN_SAL,off),ask,d:G.day}; delete p.newSal;
  mail('운영팀',`${p.name} 연봉 미계약`,`${p.name}(${posLabel(p)})이(가) 구단 제시액 ${money(p.hold.off)}에 사인하지 않았습니다. 요구액은 ${money(ask)}입니다.\n미계약 선수는 계약할 때까지 훈련과 경기에 참가할 수 없고, 시간이 갈수록 기분이 떨어집니다. 개막 직전까지 계약하지 못하면 중간 금액으로 계약합니다.`,{imp:true,kind:'연봉',acts:[{l:`요구액 ${money(ask)}으로 계약`,a:'holdPay',v:p.id},{l:`중간 금액 ${money(holdMidAmt(p))} 제시`,a:'holdMid',v:p.id}]}); }
function holdMidAmt(p){ return round5((p.hold.off+p.hold.ask)/2); }
function holdSign(p,sal,why){ if(!p||!p.hold)return '미계약 선수가 아닙니다.'; p.sal=Math.max(MIN_SAL,sal); delete p.hold; addLog(`${p.name} 연봉 ${money(p.sal)}에 계약(${why})`); return `${p.name}과(와) 연봉 ${money(p.sal)}에 계약했습니다.`; }
function holdPay(id){ const p=G.players[id]; if(!p||!p.hold||p.team!==G.user)return '미계약 선수가 아닙니다.'; return holdSign(p,p.hold.ask,'요구액 수용'); }
function holdMid(id){ const p=G.players[id]; if(!p||!p.hold||p.team!==G.user)return '미계약 선수가 아닙니다.'; if(p.hold.midNo!=null&&G.day<p.hold.midNo)return `${dmd(p.hold.midNo)}부터 다시 제시할 수 있습니다.`;
  const wk=Math.floor((G.day-p.hold.d)/7); if(R()<.45+wk*.1)return holdSign(p,holdMidAmt(p),'중간 금액 합의'); p.hold.midNo=G.day+3; p.mor=clamp((p.mor??60)-2,0,100); return `${p.name}이(가) 중간 금액을 거절했습니다. ${dmd(p.hold.midNo)}부터 다시 제시할 수 있습니다.`; }
function holdDaily(day){ for(const p of Object.values(G.players)){ if(!p.hold)continue; if(p.team!==G.user){ delete p.hold; continue; }
    if((day-p.hold.d)%7===6)p.mor=clamp((p.mor??60)-3,0,100);
    if(day>=G.cal.open-2){ const r=holdSign(p,holdMidAmt(p),'개막 전 합의'); mail('운영팀',`${p.name} 연봉 계약`,`${r} 개막을 앞두고 중간 금액으로 합의했습니다.`,{kind:'연봉'}); continue; } /* 개막 이틀 전: 개막 엔트리(개막 전날)를 정하기 전에 계약 */ /* shortcut: 개막 뒤까지 버티는 경우·임의해지는 다루지 않음, 실제 사례가 생기면 확장 */
    if(R()<.015+.01*Math.floor((day-p.hold.d)/7)){ const r=holdSign(p,p.hold.off,'구단 제시액 수용'); mail('운영팀',`${p.name} 연봉 계약`,`${r} 선수가 구단 제시액을 받아들였습니다.`,{kind:'연봉'}); } } }
function salTalkDaily(day){ const C=G.contract; if(!C||C.done||!C.neg)return; if(day===KD(1,8)){ const n=Object.values(C.neg).filter(x=>x.st==='open').length; if(n){ stop('연봉',`연봉 미계약 국내 선수 ${n}명. 1월 10일이 지나면 3년차 이상 선수는 연봉조정을 신청할 수 있습니다.`); if(G.mail[0])G.mail[0].auto=['sal']; } }
  if(day===KD(1,10))salArbFile(); if(day===KD(1,20))salArbDecide(); }
/* 예비 FA 보상금 미리 보기: 지금 연봉 순위로 등급을 어림하고, 이 금액을 내년 연봉으로 주면 떠날 때 받는 보상금을 계산한다 */
function preFAComp(p,amt){ let g='C'; try{ g=faGradeOf(p,Object.values(G.players).filter(q=>q.team!=null)); }catch(e){} const c=COMP[g]; return {g,cash:Math.round(amt*c.cash),withP:Math.round(amt*c.withP)}; }
