/* ===== 결재: 되돌릴 수 없는 결정은 결재 문서로 한 번 더 확인하고, 결과를 소식함에 남긴다 ===== */
function roomWith(mut){ const b0=budget(); const undo=mut(); let b1=b0; try{ b1=budget(); }finally{ undo(); } return [Math.round(b0.roomGoal),Math.round(b1.roomGoal)]; }
const pnm=id=>{ const p=G.players[id]; return p?`${p.name}(${posLabel(p)}, ${p.age}세, ${money(p.sal)})`:''; };
function tradeDoc(tid,give,get,cash,pk){ cash=Math.round(cash||0); pk=pkNorm(pk); give=give.filter(id=>G.players[id]); get=get.filter(id=>G.players[id]); if(!give.length&&!get.length)return null;
  const inS=sum(get.map(id=>G.players[id].sal)), outS=sum(give.map(id=>G.players[id].sal)); const ra=roomAfter(give,get);
  const cp0=capPay(G.user), cp1=capPayAs(G.user,get,give), cap=capOf(sponSeason()); if(cash){ ra.after-=cash; } /* 얹는 현금도 예산 여유에서 나간다 */
  return {subj:`${tshort(tid)}와(과) 트레이드`,kind:'트레이드',lines:[`보내는 선수: ${give.map(pnm).join(', ')||'없음'}`,`받는 선수: ${get.map(pnm).join(', ')||'없음'}`,pk.give.length?`보내는 지명권: ${pk.give.map(pkName).join(', ')}`:'',pk.get.length?`받는 지명권: ${pk.get.map(pkName).join(', ')}`:'',`${cash>0?`현금 ${money(cash)} 얹음 · `:cash<0?`현금 ${money(-cash)} 받음 · `:''}연봉 ${inS-outS>=0?'+':''}${money(inS-outS)}/년 · 예산 여유 ${money(ra.before)} → ${money(ra.after)}`,Math.abs(ra.dI)>=10?`예산 여유 변화 = 올해 지출 ${ra.dE>=0?'+':'-'}${money(Math.abs(ra.dE))}, 예상 수입 ${ra.dI>=0?'+':'-'}${money(Math.abs(ra.dI))} (전력이 바뀌면 관중·광고 수입 전망도 바뀝니다)`:'',tradeRosterTxt(give,get),cp1>cap&&cp1>cp0?`샐러리캡 초과: 상위 40명 연봉 ${money(cp1)} / 상한 ${money(cap)} (시즌 끝까지 넘으면 경쟁균형세)`:''],warn:'상대가 받아들이면 바로 성사되고 되돌릴 수 없습니다.',chk:()=>(G.trades||[]).length}; }
const GUARD={
  enlist(v){ const p=G.players[+v]; if(!p||!milFree(p))return null; const d=depth(G.user); const role=[...d.start].some(x=>x.id===p.id)?'주전':d.sp.some(x=>x.id===p.id)?'선발 로테이션':d.pen.slice(0,4).some(x=>x.id===p.id)?'필승조':p.e1?'1군 백업':'2군';
    const from=G.day+14, to=from+MIL_DAYS; return {subj:`${p.name} 현역 입대`,kind:'병역',lines:[`${posLabel(p)} · ${p.age}세 · 지금 ${role}`,`입대 ${dmd(from)} · 전역 예정 ${dmd(to)}(1년 6개월)`,'복무 중에는 로스터·연봉 총액에서 빠지고, 1군 기록이 없어 FA 연차로 치지 않습니다.','입대일 전까지는 병역 화면에서 예약을 취소할 수 있습니다.']}; },
  signFc(v){ const p=G.players[+v]; if(!p||foreignCheck(G.user,p))return null; const [a,b]=roomWith(()=>{ const t0=p.team,s0=p.sal; const S=G.sea&&G.sea.fspend; const f0=S?S[G.user]:undefined; p.team=G.user; p.sal=p.ask; if(S&&(period()==='season'||G.day>=G.cal.open))S[G.user]=(f0||0)+Math.round(p.ask*remainFrac()); return ()=>{p.team=t0;p.sal=s0; if(S){ if(f0===undefined)delete S[G.user]; else S[G.user]=f0; } }; }); const bb=budget();
    return {subj:`외국인 선수 ${p.name} 계약`,kind:'외국인',lines:[`${p.nat||''} · ${posLabel(p)} · ${p.age}세`,`연봉 ${money(p.ask)} (${Math.round(p.ask/USD)}만 달러)`,`외국인 배정 예산 남은 ${money(bb.fRoom)} → ${money(Math.max(0,bb.fRoom-p.ask))}`,`예산 여유 ${money(a)} → ${money(b)}`],warn:'계약하면 되돌릴 수 없습니다. 방출해도 계약은 정리해야 합니다.'}; },
  signF(v){ return GUARD.signFc(v); },
  tsugGo(v){ const [src,i]=v.split(':'); const x=(src==='k'?UI._tsugK:src==='f'?UI._find:src==='r'?((UI._rec&&UI._rec.list)||[]):UI._tsug||[])[+i]; if(!x||!tsugValid(x))return null; return tradeDoc(x.tid,x.give,[x.id]); },
  mktGo(v){ const x=(UI._mkt||[])[+v]; const m=UI.findM; if(!x||m==null)return null; return tradeDoc(x.tid,[m],x.give); },
  tpropose(){ const tr=UI.trade; if(!tr||(!tr.give.length&&!tr.get.length))return null; return tradeDoc(tr.tid,tr.give,tr.get,tr.cash,tr.pk); },
  offerYes(v){ const o=(G.offers||[]).find(x=>x.id===v); if(!o)return null; const d=tradeDoc(o.from,o.get,o.give); if(d){ d.subj=`${tshort(o.from)} 제안 수락`; d.warn='수락하면 바로 성사되고 되돌릴 수 없습니다.'; } return d; },
  confirmContracts(){ const C=G.contract; if(!C)return null; { const f=fReCapInfo(); if(f&&f.over>0)return null; } const V=confirmPreview(); if(!V)return null; /* 실제 확정과 같은 계산(confirmPreview) */
    return {subj:'연봉 계약 일괄 확정',kind:'연봉',lines:[`계약 확정 ${V.fix.length}명 · 연봉 합계 ${V.dFix>=0?'+':''}${money(V.dFix)}`,...V.fix.sort((a,b)=>Math.abs(b.to-b.from)-Math.abs(a.to-a.from)).slice(0,5).map(x=>`${x.p.name}: ${money(x.from)} → ${money(x.to)}`),
      ...(V.hold.length?[`사인 거부 예상 ${V.hold.length}명(요구와 차이가 커서 미계약으로 남고, 계약 전까지 훈련·경기에 나갈 수 없습니다)`,...V.hold.map(x=>`${x.p.name}: 제시 ${money(x.to)} / 요구 ${money(x.ask)}`)]:[]),...(V.arb.length?[`연봉조정 중 ${V.arb.length}명(지금 확정하면 조정 결과도 함께 결정됩니다): 합계 ${V.dArbLo>=0?'+':''}${money(V.dArbLo)} ~ ${V.dArbHi>=0?'+':''}${money(V.dArbHi)}`,...V.arb.map(x=>`${x.p.name}: 구단안 ${money(x.club)} / 선수안 ${money(x.player)}`)]:[])],warn:'확정하면 올해 연봉이 정해지고 되돌릴 수 없습니다.'}; },
  hireMgr(v){ const [id,y,c]=v.split(':'); const m=(G.mmarket||[]).find(x=>x.id===id); if(!m)return null; const cur=G.mgr[G.user]; const cl=c==='1'&&m.clan&&m.clan.length?m.clan:null; const b=budget();
    return {subj:`${m.name} 감독 선임`,kind:'감독',lines:[`계약 ${y}년 · 연봉 ${money(m.sal)}`,cl?`사단 코치 ${cl.length}명 함께 영입 · 연봉 합계 ${money(sum(cl.map(x=>x.sal)))}`:'',`지금 예산 여유 ${money(b.roomGoal)} (올해 남은 기간 연봉 약 ${money(Math.round((m.sal+(cl?sum(cl.map(x=>x.sal)):0))*b.rem))}${cl?` + 밀려나는 코치 정산금 ${money(clanSev(m))}`:''} 추가)`,cur&&!cur.interim?`현 ${cur.name} 감독은 경질되고 잔여 연봉 약 ${money(mgrSevPay(cur).pay)}${mgrSevPay(cur).brk?`(약속 위반 ${cur.plv.length}회로 계약 위반 조항 적용, 절반)`:''}을 냅니다.${(()=>{ const C=G.coach&&G.coach[G.user]; const L=C?CKEYS.map(k=>C[k]).filter(x=>x&&x.clan===cur.id):[]; return L.length?` 현 감독 사단 코치 ${L.length}명이 함께 떠날 수 있고, 떠나면 1명당 잔여 연봉 절반을 정산합니다(최대 ${money(sum(L.map(coachSev)))}).`:''; })()}`:'감독 자리가 비어 있습니다.'],warn:'선임하면 되돌릴 수 없습니다.'}; },
  extAcc(v){ const p=G.players[+v]; const c=p&&p.extCounter; if(!c)return null; return {subj:`${p.name} 비FA 다년계약 역제안 수락`,kind:'연봉',lines:[`${c.years}년 · 연 ${money(c.annual)} · 총 ${money(c.annual*c.years)}`,`지금 연봉 ${money(p.sal)}`],warn:'수락하면 바로 확정되고 되돌릴 수 없습니다.'}; },
  extOffer(v){ const e=UI.ext; const p=G.players[+v]; if(!e||!p)return null; return {subj:`${p.name} 비FA 다년계약 제안`,kind:'연봉',lines:[`${e.years}년 · 연 ${money(e.annual)} · 총 ${money(e.annual*e.years)}`,`지금 연봉 ${money(p.sal)}`],warn:'선수가 받아들이면 바로 확정되고 되돌릴 수 없습니다.'}; },
  agPitchOk(v){ const id=+v; const p=G.players[id]; const o=G.fa&&G.fa.pitch&&G.fa.pitch[id]; if(!p||!o||p.team!=null)return null; const g=COMP[p.faGrade]; const ps=p.faPrevSal||0;
    const comp=p.faGrade==='C'?`보상금 ${money(Math.round(ps*1.5))}`:`보호 ${g.prot}명 밖 선수 1명 + ${money(ps*g.withP)}, 또는 선수 없이 ${money(ps*g.cash)} (상대 구단 선택)`;
    return {subj:`FA ${p.name} 우선 제안 수락`,kind:'FA',lines:[`${posLabel(p)} · ${p.age}세 · ${p.faGrade}등급 · 원소속 ${tshort(p.faFrom)}`,`${o.years}년 · 연 ${money(o.annual)} · 총 ${money(o.annual*o.years)}`,`보상: ${comp}`],warn:'결재하면 바로 계약되고 되돌릴 수 없습니다.'}; },
  faLL(v){ const id=+v; const p=G.players[id]; const mk=G.fa&&G.fa.mk&&G.fa.mk[id]; if(!p||!mk||!mk.ll)return null; return {subj:`${p.name} 라스트 룩`,kind:'FA',lines:[`${mk.ll.years}년 · 연 ${money(mk.ll.annual)} · 총 ${money(mk.ll.annual*mk.ll.years)}`,p.faFrom===G.user?'우리 구단 FA 잔류':`보상 대상: ${p.faGrade}등급 · 원소속 ${tshort(p.faFrom)}`],warn:'결재하면 바로 계약됩니다.'}; },
  signFree(v){ const p=G.players[+v]; if(!p||!isFree(p))return null; return {subj:`무적 선수 ${p.name} 계약`,kind:'선수',lines:[`${posLabel(p)} · ${p.age}세 · 능력 ${dvo(p)}`,`1년 · 연 ${money(freeAsk(p))}`,`정식 선수 ${rosterN(G.user)+1}/${ROSTER_MAX}명이 됩니다.`],warn:'계약하면 바로 등록됩니다.'}; },
  offer(v){ const id=+v; const p=G.players[id]; if(!p||!G.fa||p.faFrom===G.user||G.fa.offers[id]||faOutBlocked(G.user,p))return null; const o=UI.offer&&UI.offer.id===id?UI.offer:p.ask; const g=COMP[p.faGrade]; const ps=p.faPrevSal||0;
    const comp=p.faGrade==='C'?`보상금 ${money(Math.round(ps*1.5))}`:`보호 ${g.prot}명 밖 선수 1명 + ${money(ps*g.withP)}, 또는 선수 없이 ${money(ps*g.cash)} (상대 구단 선택)`;
    return {subj:`FA ${p.name} 영입 제안`,kind:'FA',lines:[`${posLabel(p)} · ${p.age}세 · ${p.faGrade}등급 · 원소속 ${tshort(p.faFrom)}`,`제시 ${o.years}년 · 연 ${money(o.annual)} · 총 ${money(o.annual*o.years)}`,`계약하면 보상: ${comp}`,'보상금은 올해 결산 지출로 잡혀 예산 여유가 그만큼 줄어듭니다.'],warn:'선수가 받아들이면 바로 계약되고 되돌릴 수 없습니다. 첫 제안 때만 묻습니다.'}; },
  buildFacItem(v){ facInit(); const D=FACI[v]; if(!D)return null; const lv=G.fac.it[v]; if(lv>=FAC_MAX||G.fac.bld[v])return null; const c=D.c[lv+1]; return {subj:`${D.l} 공사: ${D.lv[lv+1]}`,kind:'시설',lines:[`공사비 ${money(c)} (보유 현금 ${money(team(G.user).cash)}에서 바로 지출)`,`공사 기간 ${D.days[lv+1]}일 · 완공 후 유지비 연 ${money(D.up[lv+1])}`,D.d],warn:'시작하면 되돌릴 수 없습니다.'}; },
  stadBuild(v){ const S=stadOf(G.user); const it=STAD_ITEMS.find(x=>x.k===v); if(!it)return null; const lv=S.lv[v]; if(lv>=STAD_MAX||(S.build||[]).some(b=>b.k===v))return null; const per=period(); if(per==='season'||per==='post')return null;
    const c=STAD_COST[lv+1]; if(team(G.user).cash<c)return null; return {subj:`${it.l} ${lv+1}단계 공사`,kind:'구장',lines:[`공사비 ${money(c)} (보유 현금 ${money(team(G.user).cash)} → ${money(team(G.user).cash-c)})`,`공사 ${STAD_DAYS[lv+1]}일 · 유지비 연 +${money(STAD_UP[lv+1]-STAD_UP[lv])}`],warn:'공사비는 바로 나가고 되돌릴 수 없습니다.'}; },
  protSubmit(v){ const c=(G.comp||[]).find(x=>x.id===v); if(!c||!UI.prot)return null; const g=COMP[c.grade]; const ids=UI.prot.ids||[]; if(ids.length>g.prot)return null; const out=compPool(G.user).filter(q=>!ids.includes(q.id)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,4);
    return {subj:`보호선수 ${ids.length}명 명단 제출`,kind:'FA',lines:[`${tshort(c.from)}이(가) 명단 밖에서 1명을 데려가거나 보상금을 받습니다.`,`명단 밖 주요 선수: ${out.map(q=>`${q.name}(${posLabel(q)}, ${dvo(q)})`).join(', ')||'없음'}`],warn:'제출하면 바꿀 수 없습니다.'}; },
  jobYes(v){ const tid=+v; const t=team(tid); const o=G.last&&G.last.order?G.last.order.findIndex(x=>x.tid===tid)+1:0; return {subj:`${t.city} ${t.nick} 단장 취임`,kind:'경력',lines:[`지난 시즌 ${o||'-'}위 · ${needText(tid)}`,...jobBrief(tid),'선수단·감독·코치진·재정은 이 구단 것을 그대로 이어받습니다.'],warn:'취임하면 되돌릴 수 없습니다.'}; },
  /* 단장 재계약: 거절(구단을 떠남)과, 신뢰가 낮을 때 인상 요구(제안을 거둘 수 있음)는 결재로 한 번 더 묻는다. 버튼이 밀려 잘못 누르는 일이 있었다 */
  evPick(v){ const [id,i0]=String(v).split(':'); const i=+i0; const e=(G.evs||[]).find(x=>String(x.id)===id); if(!e||e.done||e.k!=='gmRenew')return null; const tr=team(G.user)?team(G.user).trust:50;
    if(i===2)return {subj:'단장 재계약 거절',kind:'경력',lines:[`${tname(G.user)}과(와)의 계약이 이번 시즌으로 끝납니다.`,'구단을 떠나 야인이 되고, 명성에 따라 다른 구단 제의를 기다립니다.'],warn:'거절하면 되돌릴 수 없습니다.'};
    if(i===1&&tr<55)return {subj:'단장 연봉 인상 요구',kind:'경력',lines:[`구단주 신뢰 ${tr}: 신뢰가 낮으면 구단주가 제안을 거두고 계약이 끝날 수 있습니다.`],warn:'제안이 거둬지면 구단을 떠나게 됩니다.'};
    return null; },
  retireGM(){ return G.unemp?{subj:'단장 경력 마치기',kind:'경력',lines:[`명성 ${G.rep} · 야인 ${Math.floor((G.day-(G.unemp.since??G.day))/30)}개월`],warn:'경력을 마치면 이 게임은 끝납니다. 새 게임은 시작 화면에서 할 수 있습니다.'}:null; },
  nsPick(v){ const o=NEWSTAD.find(x=>x.k===v); if(!o)return null; return {subj:`신구장 ${o.l}(${o.cap.toLocaleString('ko-KR')}석) 착공`,kind:'구장',lines:[`분담금 ${money(o.cost)}을 3년간 결산 때 나눠 냅니다(연 ${money(Math.round(o.cost/3))}, 그중 70%는 모기업 출자).`,'공사 3년 · 개장 후 시설 4단계 이상 · 개장 초 관중 크게 증가'],warn:'착공하면 되돌릴 수 없습니다.'}; },
  relNow(v){ const p=G.players[+v]; if(!p)return null; const rc=relCost(p), cost=rc.tot; return {subj:`${p.name} 방출`,kind:'선수',lines:[pnm(p.id),...(p.foreign&&period()==='season'?[G.day>foreignDL()?`대체 외국인 등록 마감(${dsh(foreignDL())})이 지나 올해는 대체 선수를 데려올 수 없습니다.`:fReplLeft(G.user,p.foreign)<=0?`이번 시즌 ${p.foreign==='아시아'?'아시아쿼터':'일반 외국인'} 교체 ${fReplMax(p.foreign)}회를 다 써서 대체 선수를 데려올 수 없습니다.`:`대체 외국인을 데려올 수 있습니다(남은 교체 ${fReplLeft(G.user,p.foreign)}회, ${dsh(foreignDL())}까지).`]:[]),...(p.foreign?['올해 연봉은 이미 지출로 잡혀 있어 돌려받지 못합니다.']:cost?[`현재 계약 정산금 ${money(rc.cur)}`,...(rc.next?[`다음 시즌 확정 계약 정산금 ${money(rc.next)}(${p.extNext.years}년 연 ${money(p.extNext.annual)}의 50%)`]:[]),`총 방출 비용 ${money(cost)}`]:['정산금 없음'])],warn:'방출하면 되돌릴 수 없습니다.'}; },
  adv(v){ const pd=pendDoc(); if(pd)return pd; if(G.fOkY===G.year||period()!=='pre'||G.day<G.cal.open-35||blocker()||!G.mgr[G.user])return null; const f=foreignOf(G.user); const m=f.filter(p=>p.foreign==='용병').length, as=f.filter(p=>p.foreign==='아시아').length; if(m>=3&&as>=1)return null;
    UI._advT=0; return {subj:'외국인 선수 자리가 비어 있습니다',kind:'외국인',lines:[`외국인 ${m}/3 · 아시아쿼터 ${as}/1`,'빈 자리는 시즌 중에도 채울 수 있지만, 좋은 후보는 다른 구단이 먼저 데려갑니다.','그대로 진행하려면 진행, 먼저 채우려면 취소 후 영입 → 외국인 시장으로 가세요.'],warn:'이번 시즌에는 다시 묻지 않습니다.'}; },
  fdAuto(){ const F=G.fd; if(!F||F.done)return null; const n=F.picks.slice(F.cur).filter(x=>x.tid===G.user).length; if(n<2||fdManDone())return null;
    return {subj:`남은 ${n}번 지명을 자동으로`,kind:'드래프트',lines:[`우리 남은 지명 ${n}번을 스카우트 추천대로 뽑습니다.`,'관심 선수(★)가 남아 있으면 먼저 고릅니다.','끝나면 지명 결과를 소식함으로 보고합니다.'],warn:'자동 지명은 되돌릴 수 없습니다.'}; },
  fdPick(v){ const p=G.players[+v]; const M=fdMoney(); if(!p||!M||p.sal<=M.room-M.W)return null;
    return {subj:`${p.name} 지명: 연봉 한도 확인`,kind:'드래프트',lines:[`${p.name} 연봉 ${money(p.sal)} · ${tContract(p)}`,`지명 후 국내 연봉 ${money(M.spent+p.sal)} / 한도 ${money(M.lim)}`,`남은 지명 ${Math.max(0,M.left-1)}번과 자동 배분 ${M.autoN}명(약 ${money(M.W)})을 더하면 한도를 넘을 수 있습니다.`,M.capBound?'샐러리캡을 넘기면 시즌 끝에 초과분의 30%를 경쟁균형세로 냅니다. 구단주 신뢰도 초과 폭만큼 떨어지고(최대 -10), 다음 시즌 모기업 지원 한도가 초과분의 절반만큼 줄어듭니다.':'재정 여력을 넘기면 적자가 나고 구단주 신뢰가 떨어집니다.',...(M.spent+p.sal>capOf(G.year)*1.1?[`지명하면 상한을 ${money(M.spent+p.sal-capOf(G.year))} 넘습니다(상한의 ${Math.round((M.spent+p.sal)/capOf(G.year)*100)}%).`]:[])],warn:'그래도 지명하려면 결재하세요.'}; },
  hireCoach(v){ const [id,y]=v.split(':'); const c=(G.cmarket||[]).find(x=>x.id===id); if(!c)return null; const old=(G.coach[G.user]||{})[c.role]; const b=budget();
    return {subj:`${CROLE[c.role].l} ${c.name} 영입`,kind:'코치',lines:[`계약 ${y}년 · 연봉 ${money(c.sal)}`,old?`지금 ${CROLE[c.role].l} ${old.name}은(는) 계약을 끝내고 나갑니다. 잔여 연봉 정산 ${money(coachSev(old))}.`:'빈자리를 채웁니다.',`예산 여유 ${money(b.roomGoal)}`],warn:'계약하면 기간 동안 연봉이 나갑니다.'}; },
  hireScout(v){ const s=scoutMkt().find(x=>x.id===v); if(!s)return null; return {subj:`스카우트 ${s.name} 영입`,kind:'스카우트',lines:[`능력 ${s.skill} · ${s.region} 출신`,`연봉 ${money(s.sal||0)}`,`고용 ${G.scouts.length+1}/${scoutMax()}명`,'아직 아무도 맡지 않은 업무가 있으면 그 자리에 먼저 배치합니다.'],warn:'처음 30일은 적응 기간입니다.'}; },
  anaHire(v){ const a=anaMarket().find(x=>x.id===v); if(!a)return null; return {subj:`분석원 ${a.name} 영입`,kind:'전력분석',lines:[`${AROLE[a.role].l} · 능력 ${a.skill}`,`연봉 ${money(a.sal)}`,`고용 ${anaList().length+1}/${ANA_MAX}명`],warn:'처음 30일은 적응 기간이라 효과가 절반입니다.'}; },
  buyBus(v){ const B=BUS[+v]; if(!B||+v<=busLv())return null; const t=team(G.user); return {subj:`구단 버스 교체: ${B.l}`,kind:'시설',lines:[`구입비 ${money(B.c)} (보유 현금 ${money(t.cash)} → ${money(t.cash-B.c)})`,`유지비 연 ${money(B.up)}`,`원정 경기 피로 ${B.f>0?'+':''}${Math.round(B.f*100)}%`],warn:'구입비는 현금에서 바로 나갑니다.'}; },
  setPrev(v){ const n=PREV[+v], o=PREV[G.med.prev]; if(!n||+v===G.med.prev)return null; return {subj:`부상 방지 프로그램: ${n.l}`,kind:'의무',lines:[`연 비용 ${money(o.c)} → ${money(n.c)}`,`부상 위험 ${Math.round((1-n.m)*100)}% 감소`],warn:'바꾼 비용은 올해 예산에 바로 반영됩니다.'}; },
  setHosp(v){ const n=HOSP[v], o=HOSP[G.med.hosp]; if(!n||v===G.med.hosp)return null; return {subj:`제휴 병원: ${n.name}`,kind:'의무',lines:[`연 비용 ${money(o?o.c:0)} → ${money(n.c)}`,n.d],warn:'바꾼 비용은 올해 예산에 바로 반영됩니다.'}; },
  fireScout(v){ const s=(G.scouts||[]).find(x=>x.id===v); if(!s)return null; return {subj:`스카우트 ${s.name} 계약 해지`,kind:'스카우트',lines:[`${s.region} 담당 · 능력 ${s.skill}`],warn:'해지하면 그 지역 정보가 줄어듭니다.'}; },
  anaFire(v){ const a=anaList().find(x=>x.id===v); if(!a)return null; return {subj:`분석원 ${a.name} 계약 해지`,kind:'전력분석',lines:[`${AROLE[a.role].l} · 능력 ${a.skill}`],warn:'해지하면 되돌릴 수 없습니다.'}; },
  autoTrim(){ const n=rosterN(G.user)-ROSTER_MAX; if(n<=0)return null; const L=trimCands(n); return {subj:`로스터 정리 ${L.length}명`,kind:'선수',lines:L.slice(0,12).map(p=>pnm(p.id)),warn:'정리 대상은 방출되거나 육성선수로 돌아갑니다. 되돌릴 수 없습니다.'}; },
};
/* 영입 발표: 새로 온 선수가 왜 필요한지, 무엇을 맡고, 무엇을 감수하는지 한 장으로 */
function annCheck(){ if(!G||G.gameOver||G.unemp||G.fdWait||(G.fd&&!G.fd.done))return; if(navigator.webdriver&&!UI.annTest)return; /* 자동화 테스트에서는 끈다 */ const ids=[]; for(const p of Object.values(G.players))if(p.team===G.user)ids.push(p.id);
  if(!UI._annPrev||UI._annY!==G.user){ UI._annPrev=new Set(ids); UI._annY=G.user; return; } const nw=ids.filter(id=>!UI._annPrev.has(id)); UI._annPrev=new Set(ids); if(!nw.length)return;
  for(const id of nw){ const p=G.players[id]; const st=(p.story||[]).filter(x=>x.k==='move').slice(-1)[0]; if(!st||st.y!==G.year||st.d<G.day-14)continue; if(/드래프트|지명/.test(st.t)&&!/트레이드|FA/.test(st.t))continue; (UI.annQ=UI.annQ||[]).push(id); }
  if(UI.annQ&&UI.annQ.length)annRender(); }
function annRender(){ let el=document.getElementById('ann'); if(!el){ el=document.createElement('div'); el.id='ann'; document.body.appendChild(el); }
  const id=(UI.annQ||[])[0]; const p=id!=null&&G.players[id]; if(!p||p.team!==G.user){ if(UI.annQ&&UI.annQ.length){ UI.annQ.shift(); return annRender(); } el.innerHTML=''; return; }
  const st=(p.story||[]).filter(x=>x.k==='move').slice(-1)[0]; const k=pSlot(p); let role='엔트리 경쟁', why='', blk=[];
  try{ const d=depth(G.user); const inS=d.start.some(x=>x.id===p.id), inSP=d.sp.some(x=>x.id===p.id), inP=d.pen.slice(0,4).some(x=>x.id===p.id);
    role=inS?`주전 ${posLabel(p)}`:inSP?'선발 로테이션':inP?'필승조':p.isP?'불펜 경쟁':'백업·대타'; const kk=p.isP?(inSP?'SP':'RP'):k; /* 보강 이유는 실제로 맡을 자리 기준(선발로 쓰면 선발진 순위) */
    const rk=slotRanks(G.user)[kk]; const others=kk==='SP'?d.sp.filter(x=>x.id!==p.id):kk==='RP'?d.pen.filter(x=>x.id!==p.id):[d.ln[kk],...d.bench.filter(x=>x.pos===kk)].filter(x=>x&&x.id!==p.id); const o2=others[0];
    why=`우리 ${SLOTK[kk]||posLabel(p)} 리그 ${rk.rank}위.${o2?` 기존 ${o2.name}(${dvo(o2)})${ovr(p)>ovr(o2)+1?'보다 낫습니다':ovr(p)<ovr(o2)-1?'의 뒤를 받칩니다':'와 비슷한 수준으로 경쟁합니다'}.`:''}`;
    blk=playersOf(G.user).filter(q=>q.id!==p.id&&!q.foreign&&q.age<=24&&q.isP===!!p.isP&&(q.isP?(kk==='SP'?isSPr(q):!isSPr(q)):pSlot(q)===kk)&&(potVal(scoutReport(q))||0)>=53).slice(0,2); }catch(e){}
  const risk=[medInj(p)>=.2?'메디컬: 부상이 잦은 편':'',p.foreign&&p.adapt!=null&&p.adapt<45?'한국 적응 변수':'',p.age>=33?`${p.age}세, 하락 시작 나이`:''].filter(Boolean);
  const h=curLine(p); const stat=h?yrTag(h)+' '+(p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:''):(h.pa?`OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'')):'';
  el.innerHTML=`<div class="cfm-w"><div class="cfm ann" role="dialog" aria-modal="true"><div class="cfm-h"><span>영입 발표</span><span>${dsh(G.day)}</span></div>
    <div class="row" style="flex-wrap:nowrap;gap:12px">${avImg(p,true)}<div><h3 style="margin:0">${esc(p.name)}</h3><p class="small muted" style="margin:2px 0">${posLabel(p)} · ${p.age}세 · ${hand(p)}${st?` · ${esc(st.t)}`:''}</p>${(()=>{ const cv=curView(p); return (cv.est?'<span class="small muted">예상</span> ':'')+rchip(cv.v); })()}${stat?` <span class="small">${stat}</span>`:''}</div></div>
    <ul class="rec-w"><li><b>예상 역할</b> 감독은 ${esc(role)}(으)로 볼 것 같습니다.</li><li><b>보강 이유</b> ${esc(why)}</li><li><b>비용</b> 연봉 ${money(p.sal)} · ${ctText(p)}</li>${risk.length?`<li class="warn"><b>위험</b> ${risk.join(' · ')}</li>`:''}${blk.length?`<li><b>미래 경로</b> 같은 자리 유망주 ${blk.map(q=>`${esc(q.name)}(${posLabel(q)}, ${q.age}세)`).join(', ')}의 기회가 줄 수 있습니다.</li>`:''}</ul>
    <div class="cfm-b"><button class="btn" data-a="annPlayer" data-v="${p.id}">선수 보기</button><button class="btn primary" data-a="annClose">확인${UI.annQ.length>1?` (${UI.annQ.length-1}명 더)`:''}</button></div></div></div>`;
  try{ josaFix(el); }catch(e){} }
/* 계속을 누를 때 아직 보지 않은 결정·중요 소식·트레이드 제안이 있으면 한 번 알려 준다(같은 목록이면 다시 묻지 않는다) */
function pendEvents(){return (G.evs||[]).filter(e=>!e.done&&evStops(e)&&(e.exp==null||e.exp>=G.day)&&!G.mail.some(m=>m.id===e.mid&&mailDone(m)));}
function pendOffers(){return stopOn({kind:'트레이드'})?(G.offers||[]).filter(o=>!o.blk&&(o.exp==null||o.exp>=G.day)):[];}
function pendItems(){ const L=[]; const ev=pendEvents(); const key=ev.filter(e=>EV_KEY.has(e.k)), oth=ev.filter(e=>!EV_KEY.has(e.k));
  if(key.length)L.push({id:'k'+key.map(e=>e.id).join(','),t:`핵심 결정 ${key.length}건: ${key.slice(0,2).map(e=>`${e.title}(~${dmd(e.exp)})`).join(', ')}${key.length>2?' 외':''}`});
  if(oth.length)L.push({id:'e'+oth.map(e=>e.id).join(','),t:`결정 ${oth.length}건: ${oth.slice(0,2).map(e=>e.title).join(', ')}${oth.length>2?' 외':''}`});
  const of=pendOffers(); if(of.length)L.push({id:'o'+of.map(o=>o.id).join(','),t:`트레이드 제안 ${of.length}건(답하지 않으면 만료)`});
  const im=ibNeedList(); if(im.length)L.push({id:'m'+im.map(m=>m.id).join(','),t:`확인할 중요 소식 ${im.length}건: ${im.slice(0,2).map(m=>m.subj).join(', ')}${im.length>2?' 외':''}`});
  return L; }
function pendDoc(){ if(G.unemp||blocker())return null; const L=pendItems(); if(!L.length)return null; const sig=L.map(x=>x.id).join('|'); if(UI._pendAck===sig)return null;
  UI._advT=0; return {subj:'확인하지 않은 일이 있습니다',kind:'진행',head:'진행 전 확인',lines:[...L.map(x=>x.t),'그대로 진행하면 기한이 지난 결정은 기본안으로 처리됩니다.'],ok:'그대로 진행',no:'확인하러 가기',noGo:()=>{ const id=pendMailId(); if(id){ UI.mf='all'; A.openMail(id); return; } UI.pendGo=1; UI.tab='home'; UI.mail=null; render(); setTimeout(()=>{ const el=document.getElementById('todoCard'); if(el)el.scrollIntoView({block:'start'}); },60); } /* 확인하러 가기: 그 소식을 소식함에서 연다 */,onOk:()=>{ UI._pendAck=sig; },noMail:true}; }
/* 확인할 일이 담긴 소식: 안 읽은 확인할 소식 → 끝나지 않은 결정 → 살아 있는 트레이드 제안 순 */
function pendMailId(){ const n=ibNeedList(); if(n.length)return n[0].id;
  const ev=pendEvents(); for(const e of ev){ const m=G.mail.find(m=>(m.acts||[]).some(a=>a.a==='evPick'&&String(a.v).split(':')[0]===String(e.id))&&!mailDone(m)); if(m)return m.id; }
  const of=pendOffers(); for(const o of of){ const m=G.mail.find(m=>m.oid===o.id&&!mailDone(m)); if(m)return m.id; } return null; }
/* 스페이스바로 진행할 때 묻는 창: 어디까지 가는지 */
function advTargetTxt(v){ const per=period();
  if(G.unemp)return '제의가 오거나 1주일이 지날 때까지 진행합니다.';
  if(v==='event'&&(per==='off'||per==='pre')&&!nextGames(1).some(x=>x.d<=G.day+7))return `${dmd(G.day+7)}까지 최대 7일 진행합니다. 중요한 소식이나 결정이 생기면 그 전에 멈춥니다.`;
  if(v==='event'&&!G.unemp)return '최대 3경기를 자동 진행합니다. 휴식일은 경기 수에 포함하지 않으며 예약한 직관과 설정한 중단 조건에서 먼저 멈춥니다. 경기가 없는 비시즌에는 최대 7일 진행합니다.';
  if(v==='week')return `${dmd(G.day+7)}까지 최대 1주일 자동 진행합니다. 직접 예약한 경기만 관전하며 중요한 소식이나 결정이 생기면 먼저 멈춥니다.`;
  if(v==='day')return `${dmd(G.day+1)}(${WD[dobj(G.day+1).w]}) 하루를 진행합니다.`;
  const nl=nextLabel(); return `${nl?`다음 일정(${nl})까지`:'다음 소식이 올 때까지'} 진행합니다. 중요한 소식이 오면 그 전에 멈춥니다.${per==='off'||per==='pre'?` 비시즌·시즌 준비 기간에는 한 번에 최대 7일(${dmd(G.day+7)})까지 진행합니다.`:''}`; }
function advAsk(v){ const L=[advTargetTxt(v),`지금: ${dstr(G.day)}`]; let P=[]; try{ P=pendItems(); for(const x of P)L.push(x.t); }catch(e){}
  if(P.length)UI._pendAck=P.map(x=>x.id).join('|'); /* 여기서 보여 줬으니 진행 전 확인을 다시 묻지 않는다 */
  UI.cfm={k:'advSpace',v,doc:{subj:'진행할까요?',head:'진행',kind:'진행',lines:L,ok:'진행 (Space)',no:'취소 (Esc)',noMail:true}}; cfmRender(); }
function cfmRender(){ let el=document.getElementById('cfm'); if(!el){ el=document.createElement('div'); el.id='cfm'; document.body.appendChild(el); }
  const c=UI.cfm; if(!c){ el.innerHTML=''; return; } const d=c.doc;
  el.innerHTML=`<div class="cfm-w"><div class="cfm" role="dialog" aria-modal="true"><div class="cfm-h"><span>${esc(d.head||'결재 요청')}</span><span>${d.head?'':'운영팀 · '}${dsh(G.day)}</span></div><h3>${esc(d.subj)}</h3><ul>${d.lines.filter(Boolean).map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${d.warn?`<p class="cfm-x">${esc(d.warn)}</p>`:''}<div class="cfm-b"><button class="btn" data-a="cfmNo">${esc(d.no||'취소')}</button><button class="btn primary" data-a="cfmOk">${esc(d.ok||'진행(결재)')}</button></div></div></div>`;
  try{ josaFix(el); }catch(e){} }
for(const k of Object.keys(GUARD)){ const f=A[k]; if(!f)continue; A[k]=function(v,el,e){ if(UI._cfmPass)return f.call(A,v,el,e); let d=null; try{ d=GUARD[k](v); }catch(err){ d=null; } if(!d)return f.call(A,v,el,e); UI.cfm={k,v,doc:d}; cfmRender(); }; }
A.advSpace=function(v){ setTimeout(()=>{ A.adv(v); },0); }; /* 진행 확인 뒤 실제 진행은 버튼과 같은 경로(외국인 자리 결재 등)를 거친다 */
A.cfmNo=function(){ const c=UI.cfm; UI.cfm=null; cfmRender(); if(c&&c.doc&&c.doc.noGo)c.doc.noGo(); };
A.cfmOk=function(){ const c=UI.cfm; if(!c)return; UI.cfm=null; cfmRender(); if(c.doc.onOk)c.doc.onOk(); const n0=c.doc.chk?c.doc.chk():null; UI._cfmWhy=null; UI._cfmPass=true; const s0=G.mailSeq||0; try{ A[c.k](c.v); }finally{ UI._cfmPass=false; }
  if(c.doc.noMail){ save(); return; } const done=c.doc.chk?c.doc.chk()>n0:true; const B=cfmBundle(s0);
  const m=mail('운영팀',`결재 ${done?'완료':'(불발)'}: ${c.doc.subj}`,c.doc.lines.filter(Boolean).join('\n')+(c.doc.chk&&!done?`\n\n${UI._cfmWhy||'상대 구단이 받아들이지 않아 성사되지 않았습니다.'}`:'')+B.txt,{kind:'결재',acts:B.acts}); m.read=!B.n; save(); };
/* 결재 한 번으로 여러 부서가 따로 보낸 소식(선임 안내·사단 합류·인기 상승 등)은 결재 완료 소식 하나로 묶는다.
   답이 필요한 소식(인터뷰 요청·중요 표시)은 따로 두고, 묶은 소식에 한 줄로 알린다 */
function cfmBundle(s0){ const nw=(G.mail||[]).filter(m=>+String(m.id).slice(1)>s0); const keep=nw.filter(m=>m.imp||/^\[인터뷰 요청\]/.test(m.subj)), mv=nw.filter(m=>!keep.includes(m));
  if(!nw.length)return {txt:'',acts:[],n:0}; const ids=new Set(mv.map(m=>m.id)); G.mail=G.mail.filter(m=>!ids.has(m.id)); G.stops=(G.stops||[]).filter(m=>!ids.has(m.id));
  const acts=[]; for(const m of mv)for(const x of (m.acts||[]))if(!acts.some(y=>y.l===x.l))acts.push(x);
  const L=mv.map(m=>`- ${m.from}: ${m.body.split('\n')[0]}`).concat(keep.map(m=>`- ${m.from}: ${/인터뷰/.test(m.subj)?'인터뷰 답변이 필요합니다':m.subj} (소식함에 따로 있음)`));
  return {txt:'\n\n'+L.join('\n'),acts:acts.slice(0,3),n:mv.length+keep.length}; }
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]'); if(!el)return;
  const a=el.dataset.a;
  if(a==='start'&&el.matches('.tmk.open')&&!e.target.closest('.tp-h'))return;
  if(['playerTab','castSeek','analysisY','tsel','mkt','offA','extA','lfTeam','lrfT','lfSort','rosterTeam','blkWant','impFile','recF','fdPol','fdSsel','fdLogT','ppRep','ppPid'].includes(a))return;
  if(el.matches('select,input[type=range],input[type=file],textarea'))return;
  if(a==='closeSheet'){ if(e.target.closest('.x')||e.target.closest('button[data-a="closeSheet"]')||!e.target.closest('[data-stop]')){ /* 시트 안의 '닫기' 버튼도 닫는다(바깥 여백·× 말고) */ const back=UI.sheet!=null&&UI.castRet; closeSheets(); if(back){ UI.cast=back; back.play=!!back.wasPlay&&back.k<G.games[back.g].pbp.length; renderSheet(); } /* 선수 창을 열기 전 재생 상태로 돌아간다(×·뒤로·Esc 같게, 검수 11-07) */ } return; }
  /* 연속 터치 보호: 방금 누른 자리(30px 안)에 0.4초 안에 다른 내용의 버튼이 새로 그려졌는데 또 눌리면 무시한다.
     예) 인터뷰 답을 누르고 손가락을 한 번 더 대면 다음 질문의 같은 자리 답이 나가던 문제(커뮤니티 제보 2026-10-31). 같은 버튼(＋/− 등)의 빠른 연타는 그대로 */
  { const now=performance.now(), L=UI._clk, sig=a+'|'+(el.dataset.v||'')+'|'+(el.textContent||'').trim().slice(0,40);
    const navigation=['tab','sub','go','itab','pgGo','ptab','cardFlip','cardNext','cardPrev','cardHome','stopTg','advAskTog','crole','csort','coachSlot','coachFind','smkGo','smkK','smkSrc','findPos','findTeam','findSort','tside','tsideGo','tradePick','tradeReview','tpartner','tradeGm','toTrade','toTradeGive'].includes(a);
    if(!navigation&&L&&now-L.t<400&&Math.hypot((e.clientX||0)-L.x,(e.clientY||0)-L.y)<30&&L.r!==UI._rN&&L.sig!==sig){ e.preventDefault(); return; }
    UI._clk={t:now,x:e.clientX||0,y:e.clientY||0,r:UI._rN,sig}; }
  if(A[a]){ e.preventDefault(); A[a](el.dataset.v,el,e); }
});
/* 선택 상자 대신 버튼 줄(optRow): 버튼을 누르면 같은 값을 고른 것처럼 아래 change 처리를 그대로 탄다 */
function optRow(a,cur,opts,x,cls){ return `<span class="chips optrow${cls?' '+cls:''}" role="group">${opts.map(([v,l])=>`<button type="button" data-a="opt" data-k="${a}"${x!=null?` data-x="${x}"`:''} data-v="${esc(String(v))}" class="${String(cur)===String(v)?'on':''}" aria-pressed="${String(cur)===String(v)}">${l}</button>`).join('')}</span>`; }
A.opt=(v,el,e)=>selApply({dataset:{a:el.dataset.k,v:el.dataset.x},value:v,tagName:'SELECT',files:null},e);
document.addEventListener('change',e=>{ const el=e.target.closest('[data-a]'); if(!el)return; selApply(el,e); });
function selApply(el,e){ const a=el.dataset.a;
  if(a==='playerTab'){A.ptab(el.value);return;}
  if(a==='psY'){UI.psY=+el.value;UI.psSel=null;render();return;}
  if(a==='personalTarget'||a==='personalGmTarget'){UI[a]=+el.value;render();return;}
  if(el.tagName==='SELECT'&&['crole','csort','coachSlot','findPos','tpartner','tcash','tseg','tsort'].includes(a)){if(A[a])A[a](el.value,el,e);return;}
  if(a==='castSeek'){A.castSeek(el.value);return;}
  if(a==='analysisY'){ A.analysisY(el.value); return; }
  if(a==='tsel'||a==='mkt')A[a](el.dataset.v,el,e);
  if(a==='lfTeam'){UI.lf.team=el.value;render();}
  if(a==='anaRole'){ setAnaRole(el.dataset.v,el.value); save(); render(); return; }
  if(a==='recF'){ UI.rec=Object.assign({k:'SS',type:'now',age:'',sal:''},UI.rec||{}); UI.rec[el.dataset.v]=el.value; UI._rec=null; render(); }
  if(a==='findTeam'){UI.findTeam=el.value;render();}
  if(a==='findSort'){UI.findSort=el.value;render();}
  if(a==='lrfT'){UI.lrf=Object.assign({q:true,t:'all'},UI.lrf,{t:el.value});render();}
  if(a==='impFile'){ const f=el.files&&el.files[0]; if(f){ const r=new FileReader(); r.onload=()=>importText(String(r.result).trim());r.onerror=()=>{UI.impMsg='파일을 읽지 못했습니다. 다시 선택해 주세요.';render();};r.readAsText(f); } }
  if(a==='blkWant'){ const p=G.players[+el.dataset.v]; if(p){p.lw=el.value; save(); render();} }
  if(a==='sAssign'){ const [r,k]=el.value.split(':'); assignScout(el.dataset.v,r,k); save(); render(); }
  if(a==='rosterTeam'){UI.rosterTeam=+el.value;render();window.scrollTo(0,0);}
  if(a==='fdPol'){ A.fdPol(el.value); }
  if(a==='fdSsel'){ UI.fdS=el.value; UI.fdD=0; UI.fdMore=60; render(); }
  if(a==='fdLogT'){ UI.fdLogT=el.value; render(); }
  if(a==='fdAge'){ UI[el.dataset.v==='1'?'fdA1':'fdA0']=+el.value; UI.fdMore=60; render(); }
  if(a==='ppRep'||a==='ppPid'){ UI.pp=UI.pp||{}; if(a==='ppRep')UI.pp.rep=el.value; else UI.pp.pid=el.value; UI.ppMsg=''; render(); }
  if(a==='lfSort'){UI.lf.sort=el.value;render();}
  if(a==='dsAx'){ UI.dsAx=el.value||null; if(el.value){ UI.dsX=null; UI.dsYk=null; } render(); }
  if(a==='dsX'||a==='dsYk'){ UI[a]=el.value; render(); }
  if(a==='dsPos'){ UI.dsPos=el.value||null; UI.dsSel=null; render(); }
  if(a==='dsMinS'){ UI.dsMin=+el.value; render(); }
  if(a==='tdT'){ UI.tdT=+el.value; render(); }
  if(a==='dmemo'){ dmemoOf(+el.dataset.v).t=el.value.slice(0,40); save(); }
  if(a==='drd'){ dmemoOf(+el.dataset.v).rd=+el.value; save(); render(); }
  if(a==='findName'||a==='findAge'||a==='findSal'||a==='findMil'){ UI[a]=el.value; render(); }
  if(a==='slotMemo'){ const m=meta(); const n=+el.dataset.v; if(m.slots[n]){ m.slots[n].memo=el.value.slice(0,30); setMeta(m); } } }
document.addEventListener('input',e=>{ const el=e.target.closest('[data-a]'); if(!el)return;
  if(el.dataset.a==='offA')A.offA(el.dataset.v,el);
  if(el.dataset.a==='extA')A.extA(el.dataset.v,el);
  if(el.dataset.a==='mkt'){ const o=document.getElementById('mktv'); if(o)o.textContent=money(+el.value); } });
window.__readingWidth=innerWidth;
window.addEventListener('resize',()=>{const zoomed=appZoom();const widthChanged=zoomed||Math.abs(innerWidth-window.__readingWidth)>1;window.__readingWidth=innerWidth;const touch=matchMedia('(pointer:coarse)').matches;window.__readingRedraw=window.__readingRedraw||widthChanged||!touch;clearTimeout(window.__rz);window.__rz=setTimeout(()=>{const redraw=window.__readingRedraw;window.__readingRedraw=false;if(!G)return;if(redraw||(!UI.title&&UI.tab==='home'&&!UI.homeFocus&&UI.sheet==null&&!document.querySelector('details[open]')))render();else{appFrameSync();workspaceRefit();if(UI.tab==='inbox')ibFit();if(UI.meet)meetWire();dayTickPosition(document.getElementById('dtick'));}},150);});
document.addEventListener('toggle',e=>{ const d=e.target; if(d&&d.matches&&d.matches('details')){if(d.dataset.readingKey)(UI.readingOpen=UI.readingOpen||{})[d.dataset.readingKey]=d.open;if(d.dataset.k)UI.open[d.dataset.k]=d.open; if(d.open&&d.dataset.lazy==='1'){ const y=window.scrollY; render(); window.scrollTo(0,y); }else workspaceRefit(); } },true);
document.addEventListener('keydown',e=>{
  /* 결재가 떠 있으면 뒤의 협상·면담·중계·소식함으로 키를 전달하지 않는다. */
  if(UI.cfm){
    if(e.key==='Escape'){e.preventDefault();A.cfmNo();return;}
    if((e.key===' '||e.key==='Enter')&&!(e.target.matches&&e.target.matches('input,select,textarea'))){e.preventDefault();if(!e.repeat){if(e.target.closest&&e.target.closest('#cfm [data-a="cfmNo"]'))A.cfmNo();else A.cfmOk();}}
    return;
  }
  if(UI.matchPreview&&e.key==='Escape'){e.preventDefault();A.matchLater();return;}
  if(UI.fmKeys&&e.key==='Escape'){ UI.fmKeys=false; render(); return; }
  try{ if(fmHotkey(e))return; }catch(x){} /* PC 단축키(FM식) */
  if(UI.cast&&UI.sheet==null){ if(e.key==='Escape'){ A.castClose(); return; }if(e.target.matches&&e.target.matches('input,select,textarea'))return; if(e.key===' '){ e.preventDefault(); A.castPlay(); return; } if(e.key==='ArrowRight'){ A.castStep('1'); return; } if(e.key==='ArrowLeft'){ A.castStep('-1'); return; } }
  if(e.key==='Escape'&&UI.negWin&&!UI.ngt&&!UI.meet){ UI.negWin=null; renderSheet(); render(); return; }
  if(e.key==='Escape'&&UI.meet){e.preventDefault();A.meetClose();return;}
  if(e.key==='Escape'&&UI.ngt){ UI.ngt=null; UI.meet=null; renderSheet(); render(); return; }
  if(e.key==='Escape'&&(document.documentElement.classList.contains('detail-page-open')||UI.sheet!=null||UI.posSheet||UI.game!=null||UI.menu||UI.wkres)){A.detailBack();return;}
  if(e.key===' '&&UI.wkres&&UI.sheet==null&&UI.game==null&&!UI.menu&&!UI.cast&&!UI.cfm&&!(e.target.matches&&e.target.matches('input,select,textarea'))){ e.preventDefault(); if(!e.repeat)A.wkClose(); return; } /* 경기 결과 창: 스페이스바 = 확인 */
  if(UI.tab==='inbox'&&!UI.meet&&UI.sheet==null&&!UI.menu&&!UI.game&&!(e.target.matches&&e.target.matches('input,select,textarea'))&&(e.key==='j'||e.key==='k')){ e.preventDefault(); ibStep(e.key==='j'?1:-1); }
  /* 소식함: 스페이스바로 안 읽은 소식을 하나씩 열고, 다 읽었으면 계속 진행 */
  if(e.key===' '&&UI.ivSh&&G.iv&&G.iv.done){ e.preventDefault(); closeSheets(); render(); return; } /* 끝난 인터뷰는 스페이스바로 닫기 */
  /* 스페이스바(어느 화면에서나): 안 읽은 소식이 있으면 차례로 열고, 없으면 어디까지 진행할지 묻는다 */
  if(e.key===' '&&!document.documentElement.classList.contains('detail-page-open')&&UI.sheet==null&&!UI.menu&&UI.game==null&&!UI.cer&&!UI.ivSh&&!UI.cmpSh&&!UI.ngt&&!UI.meet&&!UI.negWin&&!UI.cast&&!UI.title&&!(e.target.matches&&e.target.matches('input,select,textarea,summary,[contenteditable]'))){ e.preventDefault(); if(e.repeat)return; /* 누르고 있어도 한 번만. 포커스된 버튼(계속 등)을 스페이스바가 직접 누르지 않게 막는다 */ if(e.target.blur&&e.target.matches&&e.target.matches('button'))e.target.blur(); ibSpace(); return; }
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('g.pos[data-a],.tcard[data-a]')){ e.preventDefault(); const a=e.target.dataset.a; A[a](e.target.dataset.v); }
});

/* 부팅(저장 불러오기·첫 화면)은 모든 화면 파일이 읽힌 뒤 실행되도록 99_boot.js로 옮겼다 */

/* ===== itch 껍데기에서 옛 저장 옮겨 오기 =====
   게임 본체를 고정 주소(Cloudflare)로 옮기면서, itch에 올리는 zip은 본체를 띄우는 껍데기만 남는다.
   껍데기는 예전 게임과 같은 itch 주소에서 열리므로, 그쪽 브라우저 저장(danjang-로 시작하는 항목)을 읽어 한 번 보내 준다.
   이 게임에 저장이 하나도 없을 때만 받아들인다(이미 여기서 하던 저장을 덮어쓰지 않는다) */
function ftMigrateAccept(e){ try{ const d=e&&e.data; if(!d||d.type!=='ft-migrate'||!d.items)return false; if(e.source&&e.source!==window.parent)return false;
    if(!/(^|\.)itch\.(zone|io)$/.test(String(e.origin||'').replace(/^https?:\/\//,'')))return false;
    const it=d.items; const m0=meta(); if(Object.keys(m0.slots||{}).length)return false; let mm=null; try{ mm=JSON.parse(it[META]||'null'); }catch(x){} if(!mm||!mm.slots||!Object.keys(mm.slots).length)return false;
    { const ks=Object.keys(it).filter(k=>/^danjang-/.test(k)&&typeof it[k]==='string'&&k!==META), done=[]; try{ for(const k of ks){ localStorage.setItem(k,it[k]); if(localStorage.getItem(k)!==it[k])throw new Error('read-back'); done.push(k); } localStorage.setItem(META,it[META]); if(localStorage.getItem(META)!==it[META])throw new Error('meta'); }catch(x){ for(const k of done.concat([META]))try{ localStorage.removeItem(k); }catch(y){} try{ toast('itch 저장을 옮기다 저장 공간이 부족해 멈췄습니다. 옮기던 내용은 지웠습니다.'); }catch(y){} return false; } } /* 슬롯 본문을 모두 쓴 뒤 목록을 마지막에: 도중에 실패하면 되돌려 열 수 없는 슬롯이 목록에 남지 않게(검수 11-06) */
    try{ window.parent.postMessage({type:'ft-migrated'},e.origin); }catch(x){}
    try{ toast('itch에서 하던 저장을 옮겨 왔습니다. 처음 화면에서 이어하기를 누르세요.'); }catch(x){} try{ if(!G)UI.title=true; render(); }catch(x){} return true; }catch(err){ return false; } }
window.addEventListener('message',ftMigrateAccept);

/* 휴대폰: 화면을 옆으로 끌면 전체나 칸이 통째로 밀려 빈칸이 드러나던 문제(iOS 웹뷰는 overscroll-behavior를 무시). 가로로 끄는 동작은 실제로 옆으로 움직일 수 있는 칸이 있을 때만 허용하고 나머지는 막는다.
   축 잠금: 첫 8px로 정한 방향만 움직인다. iOS는 가로·세로 둘 다 스크롤되는 칸을 대각선으로 끌면 두 축이 같이 움직이므로, 그 끌기(와 손을 뗀 뒤 관성) 동안 다른 축은 시작 위치로 되돌린다.
   세로로 끌 때 위·아래 끝에서 더 당기면(움직일 칸이 없으면) 막아 화면이 튕기며 밀리지 않게 한다 */
if(typeof addEventListener!=='undefined'&&typeof document!=='undefined'){ let x0=0,y0=0,ax=null,lock=[],lockT=0;
  const can=(el,a)=>{ const s=getComputedStyle(el), o=a==='x'?s.overflowX:s.overflowY; return (o==='auto'||o==='scroll')&&(a==='x'?el.scrollWidth>el.clientWidth+1:el.scrollHeight>el.clientHeight+1); };
  const free=(el,a,d)=>a==='x'?(d>0?el.scrollLeft>0:el.scrollLeft+el.clientWidth<el.scrollWidth-1):(d>0?el.scrollTop>0:el.scrollTop+el.clientHeight<el.scrollHeight-1);
  addEventListener('touchstart',e=>{ const t=e.touches[0]; if(!t)return; x0=t.clientX; y0=t.clientY; ax=null; clearTimeout(lockT); lock=[];
    for(let el=e.target;el&&el.nodeType===1&&el!==document.documentElement;el=el.parentElement)if(can(el,'x')&&can(el,'y'))lock.push([el,el.scrollLeft,el.scrollTop]); },{passive:true});
  addEventListener('touchend',()=>{ clearTimeout(lockT); lockT=setTimeout(()=>{ lock=[]; },900); },{passive:true}); /* 관성 스크롤이 끝날 때까지 잠금 유지 */
  addEventListener('scroll',e=>{ if(!ax)return; for(const [el,l,t] of lock)if(el===e.target){ if(ax==='y'&&el.scrollLeft!==l)el.scrollLeft=l; else if(ax==='x'&&el.scrollTop!==t)el.scrollTop=t; } },{capture:true,passive:true});
  addEventListener('touchmove',e=>{ if(e.touches.length>1||!e.cancelable)return; const t=e.touches[0], dx=t.clientX-x0, dy=t.clientY-y0;
    if(!ax){ if(Math.abs(dx)<8&&Math.abs(dy)<8)return; ax=Math.abs(dx)>Math.abs(dy)?'x':'y'; }
    if(e.target.closest&&e.target.closest('input,textarea,canvas,.fdt-w'))return; /* 슬라이더·3D·드래프트 표(자체 처리)는 그대로 */
    const d=ax==='x'?dx:dy;
    for(let el=e.target;el&&el.nodeType===1&&el!==document.documentElement;el=el.parentElement)if(can(el,ax)&&free(el,ax,d))return;
    if(ax==='y'){ const se=document.scrollingElement, hid=el=>/hidden|clip/.test(getComputedStyle(el).overflowY); if(se&&!hid(document.documentElement)&&!hid(document.body)&&free(se,'y',d))return; } /* 화면 전체 스크롤(막혀 있지 않을 때) */
    e.preventDefault(); },{passive:false}); }
