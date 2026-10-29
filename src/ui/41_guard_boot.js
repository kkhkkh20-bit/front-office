/* ===== 결재: 되돌릴 수 없는 결정은 결재 문서로 한 번 더 확인하고, 결과를 소식함에 남긴다 ===== */
function roomWith(mut){ const b0=budget(); const undo=mut(); let b1=b0; try{ b1=budget(); }finally{ undo(); } return [Math.round(b0.roomGoal),Math.round(b1.roomGoal)]; }
const pnm=id=>{ const p=G.players[id]; return p?`${p.name}(${posLabel(p)}, ${p.age}세, ${money(p.sal)})`:''; };
function tradeDoc(tid,give,get){ give=give.filter(id=>G.players[id]); get=get.filter(id=>G.players[id]); if(!give.length&&!get.length)return null;
  const inS=sum(get.map(id=>G.players[id].sal)), outS=sum(give.map(id=>G.players[id].sal)); const ra=roomAfter(give,get);
  const cp0=capPay(G.user), cp1=cp0+sum(get.map(id=>isRookie(G.players[id])?0:G.players[id].sal))-sum(give.map(id=>isRookie(G.players[id])?0:G.players[id].sal)), cap=capOf(G.year);
  return {subj:`${tshort(tid)}와(과) 트레이드`,kind:'트레이드',lines:[`보내는 선수: ${give.map(pnm).join(', ')||'없음'}`,`받는 선수: ${get.map(pnm).join(', ')||'없음'}`,`연봉 ${inS-outS>=0?'+':''}${money(inS-outS)}/년 · 예산 여유 ${money(ra.before)} → ${money(ra.after)}`,Math.abs(ra.dI)>=10?`예산 여유 변화 = 올해 지출 ${ra.dE>=0?'+':'-'}${money(Math.abs(ra.dE))}, 예상 수입 ${ra.dI>=0?'+':'-'}${money(Math.abs(ra.dI))} (전력이 바뀌면 관중·광고 수입 전망도 바뀝니다)`:'',cp1>cap&&cp1>cp0?`샐러리캡 초과: 상위 40명 연봉 ${money(cp1)} / 상한 ${money(cap)} (시즌 끝까지 넘으면 경쟁균형세)`:''],warn:'상대가 받아들이면 바로 성사되고 되돌릴 수 없습니다.',chk:()=>(G.trades||[]).length}; }
const GUARD={
  signFc(v){ const p=G.players[+v]; if(!p||foreignCheck(G.user,p))return null; const [a,b]=roomWith(()=>{ const t0=p.team,s0=p.sal; const S=G.sea&&G.sea.fspend; const f0=S?S[G.user]:undefined; p.team=G.user; p.sal=p.ask; if(S&&(period()==='season'||G.day>=G.cal.open))S[G.user]=(f0||0)+Math.round(p.ask*remainFrac()); return ()=>{p.team=t0;p.sal=s0; if(S){ if(f0===undefined)delete S[G.user]; else S[G.user]=f0; } }; }); const bb=budget();
    return {subj:`외국인 선수 ${p.name} 계약`,kind:'외국인',lines:[`${p.nat||''} · ${posLabel(p)} · ${p.age}세`,`연봉 ${money(p.ask)} (${Math.round(p.ask/USD)}만 달러)`,`외국인 배정 예산 남은 ${money(bb.fRoom)} → ${money(Math.max(0,bb.fRoom-p.ask))}`,`예산 여유 ${money(a)} → ${money(b)}`],warn:'계약하면 되돌릴 수 없습니다. 방출해도 계약은 정리해야 합니다.'}; },
  signF(v){ return GUARD.signFc(v); },
  tsugGo(v){ const [src,i]=v.split(':'); const x=(src==='k'?UI._tsugK:src==='f'?UI._find:src==='r'?((UI._rec&&UI._rec.list)||[]):UI._tsug||[])[+i]; if(!x||!tsugValid(x))return null; return tradeDoc(x.tid,x.give,[x.id]); },
  mktGo(v){ const x=(UI._mkt||[])[+v]; const m=UI.findM; if(!x||m==null)return null; return tradeDoc(x.tid,[m],x.give); },
  tpropose(){ const tr=UI.trade; if(!tr||(!tr.give.length&&!tr.get.length))return null; return tradeDoc(tr.tid,tr.give,tr.get); },
  offerYes(v){ const o=(G.offers||[]).find(x=>x.id===v); if(!o)return null; const d=tradeDoc(o.from,o.get,o.give); if(d){ d.subj=`${tshort(o.from)} 제안 수락`; d.warn='수락하면 바로 성사되고 되돌릴 수 없습니다.'; } return d; },
  confirmContracts(){ const C=G.contract; if(!C)return null; { const f=fReCapInfo(); if(f&&f.over>0)return null; } const fin=p=>{ const n=C.neg&&C.neg[p.id]; return n&&n.st==='open'?(n.cur??n.off):p.newSal; }; const L=(C.ended||[]).map(id=>G.players[id]).filter(p=>p&&p.newSal!=null); const d=sum(L.map(p=>fin(p)-p.sal));
    return {subj:'연봉 계약 일괄 확정',kind:'연봉',lines:[`대상 ${L.length}명 · 연봉 합계 ${d>=0?'+':''}${money(d)}`,...L.sort((a,b)=>Math.abs(fin(b)-b.sal)-Math.abs(fin(a)-a.sal)).slice(0,5).map(p=>`${p.name}: ${money(p.sal)} → ${money(fin(p))}`)],warn:'확정하면 올해 연봉이 정해지고 되돌릴 수 없습니다.'}; },
  hireMgr(v){ const [id,y,c]=v.split(':'); const m=(G.mmarket||[]).find(x=>x.id===id); if(!m)return null; const cur=G.mgr[G.user]; const cl=c==='1'&&m.clan&&m.clan.length?m.clan:null; const b=budget();
    return {subj:`${m.name} 감독 선임`,kind:'감독',lines:[`계약 ${y}년 · 연봉 ${money(m.sal)}`,cl?`사단 코치 ${cl.length}명 함께 영입 · 연봉 합계 ${money(sum(cl.map(x=>x.sal)))}`:'',`지금 예산 여유 ${money(b.roomGoal)} (올해 남은 기간 연봉 약 ${money(Math.round((m.sal+(cl?sum(cl.map(x=>x.sal)):0))*b.rem))}${cl?` + 밀려나는 코치 정산금 ${money(clanSev(m))}`:''} 추가)`,cur&&!cur.interim?`현 ${cur.name} 감독은 경질되고 잔여 연봉 약 ${money(Math.round(cur.sal*Math.max(0,cur.yrs-.5)))}을 냅니다.`:'감독 자리가 비어 있습니다.'],warn:'선임하면 되돌릴 수 없습니다.'}; },
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
  buildFacItem(v){ facInit(); const D=FACI[v]; if(!D)return null; const lv=G.fac.it[v]; if(lv>=3||G.fac.bld[v])return null; const c=D.c[lv+1]; return {subj:`${D.l} 공사: ${D.lv[lv+1]}`,kind:'시설',lines:[`공사비 ${money(c)} (보유 현금 ${money(team(G.user).cash)}에서 바로 지출)`,`공사 기간 ${D.days[lv+1]}일 · 완공 후 유지비 연 ${money(D.up[lv+1])}`,D.d],warn:'시작하면 되돌릴 수 없습니다.'}; },
  stadBuild(v){ const S=stadOf(G.user); const it=STAD_ITEMS.find(x=>x.k===v); if(!it)return null; const lv=S.lv[v]; if(lv>=5||(S.build||[]).some(b=>b.k===v))return null; const per=period(); if(per==='season'||per==='post')return null;
    const c=STAD_COST[lv+1]; if(team(G.user).cash<c)return null; return {subj:`${it.l} ${lv+1}단계 공사`,kind:'구장',lines:[`공사비 ${money(c)} (보유 현금 ${money(team(G.user).cash)} → ${money(team(G.user).cash-c)})`,`공사 ${STAD_DAYS[lv+1]}일 · 유지비 연 +${money(STAD_UP[lv+1]-STAD_UP[lv])}`],warn:'공사비는 바로 나가고 되돌릴 수 없습니다.'}; },
  protSubmit(v){ const c=(G.comp||[]).find(x=>x.id===v); if(!c||!UI.prot)return null; const g=COMP[c.grade]; const ids=UI.prot.ids||[]; if(ids.length>g.prot)return null; const out=compPool(G.user).filter(q=>!ids.includes(q.id)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,4);
    return {subj:`보호선수 ${ids.length}명 명단 제출`,kind:'FA',lines:[`${tshort(c.from)}이(가) 명단 밖에서 1명을 데려가거나 보상금을 받습니다.`,`명단 밖 주요 선수: ${out.map(q=>`${q.name}(${posLabel(q)}, ${dvo(q)})`).join(', ')||'없음'}`],warn:'제출하면 바꿀 수 없습니다.'}; },
  jobYes(v){ const tid=+v; const t=team(tid); const o=G.last&&G.last.order?G.last.order.findIndex(x=>x.tid===tid)+1:0; return {subj:`${t.city} ${t.nick} 단장 취임`,kind:'경력',lines:[`지난 시즌 ${o||'-'}위 · ${needText(tid)}`,'선수단·감독·코치진·재정은 이 구단 것을 그대로 이어받습니다.'],warn:'취임하면 되돌릴 수 없습니다.'}; },
  retireGM(){ return G.unemp?{subj:'단장 경력 마치기',kind:'경력',lines:[`명성 ${G.rep} · 야인 ${Math.floor((G.day-(G.unemp.since??G.day))/30)}개월`],warn:'경력을 마치면 이 게임은 끝납니다. 새 게임은 시작 화면에서 할 수 있습니다.'}:null; },
  nsPick(v){ const o=NEWSTAD.find(x=>x.k===v); if(!o)return null; return {subj:`신구장 ${o.l}(${o.cap.toLocaleString('ko-KR')}석) 착공`,kind:'구장',lines:[`분담금 ${money(o.cost)}을 3년간 결산 때 나눠 냅니다(연 ${money(Math.round(o.cost/3))}, 그중 70%는 모기업 출자).`,'공사 3년 · 개장 후 시설 4단계 이상 · 개장 초 관중 크게 증가'],warn:'착공하면 되돌릴 수 없습니다.'}; },
  relNow(v){ const p=G.players[+v]; if(!p)return null; const cost=p.faC?Math.round(p.sal*p.yrs*.5):0; return {subj:`${p.name} 방출`,kind:'선수',lines:[pnm(p.id),p.foreign?'올해 연봉은 이미 지출로 잡혀 있어 돌려받지 못합니다.':cost?`남은 계약 정산금 ${money(cost)}`:'정산금 없음'],warn:'방출하면 되돌릴 수 없습니다.'}; },
  adv(v){ const pd=pendDoc(); if(pd)return pd; if(G.fOkY===G.year||period()!=='pre'||G.day<G.cal.open-35||blocker()||!G.mgr[G.user])return null; const f=foreignOf(G.user); const m=f.filter(p=>p.foreign==='용병').length, as=f.filter(p=>p.foreign==='아시아').length; if(m>=3&&as>=1)return null;
    UI._advT=0; return {subj:'외국인 선수 자리가 비어 있습니다',kind:'외국인',lines:[`외국인 ${m}/3 · 아시아쿼터 ${as}/1`,'빈 자리는 시즌 중에도 채울 수 있지만, 좋은 후보는 다른 구단이 먼저 데려갑니다.','그대로 진행하려면 진행, 먼저 채우려면 취소 후 영입 → 외국인 시장으로 가세요.'],warn:'이번 시즌에는 다시 묻지 않습니다.'}; },
  fdAuto(){ const F=G.fd; if(!F||F.done)return null; const n=F.picks.slice(F.cur).filter(x=>x.tid===G.user).length; if(n<2||fdManDone())return null;
    return {subj:`남은 ${n}번 지명을 자동으로`,kind:'드래프트',lines:[`우리 남은 지명 ${n}번을 스카우트 추천대로 뽑습니다.`,'관심 선수(★)가 남아 있으면 먼저 고릅니다.','끝나면 지명 결과를 소식함으로 보고합니다.'],warn:'자동 지명은 되돌릴 수 없습니다.'}; },
  fdPick(v){ const p=G.players[+v]; const M=fdMoney(); if(!p||!M||p.sal<=M.room-M.W)return null;
    return {subj:`${p.name} 지명: 연봉 한도 확인`,kind:'드래프트',lines:[`${p.name} 연봉 ${money(p.sal)} · ${tContract(p)}`,`지명 후 국내 연봉 ${money(M.spent+p.sal)} / 한도 ${money(M.lim)}`,`남은 지명 ${Math.max(0,M.left-1)}번과 자동 배분 ${M.autoN}명(약 ${money(M.W)})을 더하면 한도를 넘을 수 있습니다.`,M.capBound?'샐러리캡을 넘기면 시즌 끝에 초과분의 30%를 경쟁균형세로 냅니다.':'재정 여력을 넘기면 적자가 나고 구단주 신뢰가 떨어집니다.'],warn:'그래도 지명하려면 결재하세요.'}; },
  hireCoach(v){ const [id,y]=v.split(':'); const c=(G.cmarket||[]).find(x=>x.id===id); if(!c)return null; const old=(G.coach[G.user]||{})[c.role]; const b=budget();
    return {subj:`${CROLE[c.role].l} ${c.name} 영입`,kind:'코치',lines:[`계약 ${y}년 · 연봉 ${money(c.sal)}`,old?`지금 ${CROLE[c.role].l} ${old.name}은(는) 계약을 끝내고 나갑니다.`:'빈자리를 채웁니다.',`예산 여유 ${money(b.roomGoal)}`],warn:'계약하면 기간 동안 연봉이 나갑니다.'}; },
  hireScout(v){ const s=scoutMkt().find(x=>x.id===v); if(!s)return null; return {subj:`스카우트 ${s.name} 영입`,kind:'스카우트',lines:[`능력 ${s.skill} · ${s.region} 출신`,`연봉 ${money(s.sal||0)}`,`고용 ${G.scouts.length+1}/${SCOUT_MAX}명`,'아직 아무도 맡지 않은 업무가 있으면 그 자리에 먼저 배치합니다.'],warn:'처음 30일은 적응 기간입니다.'}; },
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
  const h=curLine(p); const stat=h?(p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:''):(h.pa?`OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'')):'';
  el.innerHTML=`<div class="cfm-w"><div class="cfm ann" role="dialog" aria-modal="true"><div class="cfm-h"><span>영입 발표</span><span>${dsh(G.day)}</span></div>
    <div class="row" style="flex-wrap:nowrap;gap:12px">${avImg(p,true)}<div><h3 style="margin:0">${esc(p.name)}</h3><p class="small muted" style="margin:2px 0">${posLabel(p)} · ${p.age}세 · ${hand(p)}${st?` · ${esc(st.t)}`:''}</p>${rchip(scoutReport(p).cur)}${stat?` <span class="small">${stat}</span>`:''}</div></div>
    <ul class="rec-w"><li><b>예상 역할</b> 감독은 ${esc(role)}(으)로 볼 것 같습니다.</li><li><b>보강 이유</b> ${esc(why)}</li><li><b>비용</b> 연봉 ${money(p.sal)} · ${ctText(p)}</li>${risk.length?`<li class="warn"><b>위험</b> ${risk.join(' · ')}</li>`:''}${blk.length?`<li><b>미래 경로</b> 같은 자리 유망주 ${blk.map(q=>`${esc(q.name)}(${posLabel(q)}, ${q.age}세)`).join(', ')}의 기회가 줄 수 있습니다.</li>`:''}</ul>
    <div class="cfm-b"><button class="btn" data-a="annPlayer" data-v="${p.id}">선수 보기</button><button class="btn primary" data-a="annClose">확인${UI.annQ.length>1?` (${UI.annQ.length-1}명 더)`:''}</button></div></div></div>`;
  try{ josaFix(el); }catch(e){} }
/* 계속을 누를 때 아직 보지 않은 결정·중요 소식·트레이드 제안이 있으면 한 번 알려 준다(같은 목록이면 다시 묻지 않는다) */
function pendItems(){ const L=[]; const ev=(G.evs||[]).filter(e=>!e.done); const key=ev.filter(e=>EV_KEY.has(e.k)), oth=ev.filter(e=>!EV_KEY.has(e.k));
  if(key.length)L.push({id:'k'+key.map(e=>e.id).join(','),t:`핵심 결정 ${key.length}건: ${key.slice(0,2).map(e=>`${e.title}(~${dmd(e.exp)})`).join(', ')}${key.length>2?' 외':''}`});
  if(oth.length)L.push({id:'e'+oth.map(e=>e.id).join(','),t:`결정 ${oth.length}건: ${oth.slice(0,2).map(e=>e.title).join(', ')}${oth.length>2?' 외':''}`});
  const of=(G.offers||[]).filter(o=>!o.blk); if(of.length)L.push({id:'o'+of.map(o=>o.id).join(','),t:`트레이드 제안 ${of.length}건(답하지 않으면 만료)`});
  const im=(G.mail||[]).filter(m=>m.imp&&!m.read&&G.day-(m.day||0)<=14); if(im.length)L.push({id:'m'+im.map(m=>m.id).join(','),t:`읽지 않은 중요 소식 ${im.length}건: ${im.slice(0,2).map(m=>m.subj).join(', ')}${im.length>2?' 외':''}`});
  return L; }
function pendDoc(){ if(G.unemp||blocker())return null; const L=pendItems(); if(!L.length)return null; const sig=L.map(x=>x.id).join('|'); if(UI._pendAck===sig)return null;
  UI._advT=0; return {subj:'확인하지 않은 일이 있습니다',kind:'진행',head:'진행 전 확인',lines:[...L.map(x=>x.t),'그대로 진행하면 기한이 지난 결정은 기본안으로 처리됩니다.'],ok:'그대로 진행',no:'확인하러 가기',noGo:()=>{ UI.pendGo=1; UI.tab='home'; UI.mail=null; render(); setTimeout(()=>{ const el=document.getElementById('todoCard'); if(el)el.scrollIntoView({block:'start'}); },60); },onOk:()=>{ UI._pendAck=sig; },noMail:true}; }
function cfmRender(){ let el=document.getElementById('cfm'); if(!el){ el=document.createElement('div'); el.id='cfm'; document.body.appendChild(el); }
  const c=UI.cfm; if(!c){ el.innerHTML=''; return; } const d=c.doc;
  el.innerHTML=`<div class="cfm-w"><div class="cfm" role="dialog" aria-modal="true"><div class="cfm-h"><span>${esc(d.head||'결재 요청')}</span><span>${d.head?'':'운영팀 · '}${dsh(G.day)}</span></div><h3>${esc(d.subj)}</h3><ul>${d.lines.filter(Boolean).map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${d.warn?`<p class="cfm-x">${esc(d.warn)}</p>`:''}<div class="cfm-b"><button class="btn" data-a="cfmNo">${esc(d.no||'취소')}</button><button class="btn primary" data-a="cfmOk">${esc(d.ok||'진행(결재)')}</button></div></div></div>`;
  try{ josaFix(el); }catch(e){} }
for(const k of Object.keys(GUARD)){ const f=A[k]; if(!f)continue; A[k]=function(v,el,e){ if(UI._cfmPass)return f.call(A,v,el,e); let d=null; try{ d=GUARD[k](v); }catch(err){ d=null; } if(!d)return f.call(A,v,el,e); UI.cfm={k,v,doc:d}; cfmRender(); }; }
A.cfmNo=function(){ const c=UI.cfm; UI.cfm=null; cfmRender(); if(c&&c.doc&&c.doc.noGo)c.doc.noGo(); };
A.cfmOk=function(){ const c=UI.cfm; if(!c)return; UI.cfm=null; cfmRender(); if(c.doc.onOk)c.doc.onOk(); const n0=c.doc.chk?c.doc.chk():null; UI._cfmWhy=null; UI._cfmPass=true; try{ A[c.k](c.v); }finally{ UI._cfmPass=false; }
  if(c.doc.noMail){ save(); return; } const done=c.doc.chk?c.doc.chk()>n0:true; const m=mail('운영팀',`결재 ${done?'완료':'(불발)'}: ${c.doc.subj}`,c.doc.lines.filter(Boolean).join('\n')+(c.doc.chk&&!done?`\n\n${UI._cfmWhy||'상대 구단이 받아들이지 않아 성사되지 않았습니다.'}`:''),{kind:'결재'}); m.read=true; save(); };
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]'); if(!el)return;
  const a=el.dataset.a;
  if(['tsel','mkt','offA','extA','lfTeam','lrfT','lfSort','rosterTeam','sAssign','blkWant','impFile','recF','anaRole','fdPol','fdSsel','fdLogT','ppRep','ppPid'].includes(a))return;
  if(a==='closeSheet'){ if(e.target.closest('.x')||!e.target.closest('[data-stop]')){ const back=UI.sheet!=null&&UI.castRet; closeSheets(); if(back){ UI.cast=back; back.play=back.k<G.games[back.g].pbp.length; renderSheet(); } /* 일시정지 버튼이 없으니 돌아오면 이어서 재생 */ } return; }
  if(A[a]){ e.preventDefault(); A[a](el.dataset.v,el,e); }
});
document.addEventListener('change',e=>{ const el=e.target.closest('[data-a]'); if(!el)return; const a=el.dataset.a;
  if(a==='tsel'||a==='mkt')A[a](el.dataset.v,el,e);
  if(a==='lfTeam'){UI.lf.team=el.value;render();}
  if(a==='anaRole'){ setAnaRole(el.dataset.v,el.value); save(); render(); return; }
  if(a==='recF'){ UI.rec=Object.assign({k:'SS',type:'now',age:'',sal:''},UI.rec||{}); UI.rec[el.dataset.v]=el.value; UI._rec=null; render(); }
  if(a==='findTeam'){UI.findTeam=el.value;render();}
  if(a==='findSort'){UI.findSort=el.value;render();}
  if(a==='lrfT'){UI.lrf=Object.assign({q:true,t:'all'},UI.lrf,{t:el.value});render();}
  if(a==='impFile'){ const f=el.files&&el.files[0]; if(f){ const r=new FileReader(); r.onload=()=>importText(String(r.result).trim()); r.readAsText(f); } }
  if(a==='blkWant'){ const p=G.players[+el.dataset.v]; if(p){p.lw=el.value; save(); render();} }
  if(a==='sAssign'){ const [r,k]=el.value.split(':'); assignScout(el.dataset.v,r,k); save(); render(); }
  if(a==='rosterTeam'){UI.rosterTeam=+el.value;render();window.scrollTo(0,0);}
  if(a==='fdPol'){ A.fdPol(el.value); }
  if(a==='fdSsel'){ UI.fdS=el.value; UI.fdD=0; UI.fdMore=60; render(); }
  if(a==='fdLogT'){ UI.fdLogT=el.value; render(); }
  if(a==='ppRep'||a==='ppPid'){ UI.pp=UI.pp||{}; if(a==='ppRep')UI.pp.rep=el.value; else UI.pp.pid=el.value; UI.ppMsg=''; render(); }
  if(a==='lfSort'){UI.lf.sort=el.value;render();} });
document.addEventListener('input',e=>{ const el=e.target.closest('[data-a]'); if(!el)return;
  if(el.dataset.a==='offA')A.offA(el.dataset.v,el);
  if(el.dataset.a==='extA')A.extA(el.dataset.v,el);
  if(el.dataset.a==='mkt'){ const o=document.getElementById('mktv'); if(o)o.textContent=money(+el.value); } });
window.addEventListener('resize',()=>{ clearTimeout(window.__rz); window.__rz=setTimeout(()=>{ if(G)render(); },150); });
document.addEventListener('toggle',e=>{ const d=e.target; if(d&&d.matches&&d.matches('details[data-k]')){ UI.open[d.dataset.k]=d.open; if(d.open&&d.dataset.lazy==='1'){ const y=window.scrollY; render(); window.scrollTo(0,y); } } },true);
document.addEventListener('keydown',e=>{
  if(UI.cast&&UI.sheet==null){ if(e.key==='Escape'){ A.castClose(); return; } if(e.key===' '){ e.preventDefault(); A.castPlay(); return; } if(e.key==='ArrowRight'){ A.castStep('1'); return; } if(e.key==='ArrowLeft'){ A.castStep('-1'); return; } }
  if(e.key==='Escape'&&UI.negWin&&!UI.ngt&&!UI.meet){ UI.negWin=null; renderSheet(); render(); return; }
  if(e.key==='Escape'&&(UI.ngt||UI.meet)){ UI.ngt=null; UI.meet=null; renderSheet(); render(); return; }
  if(e.key==='Escape'&&(UI.sheet!=null||UI.posSheet||UI.game!=null||UI.menu))closeSheets();
  if(UI.tab==='inbox'&&UI.sheet==null&&!UI.menu&&!UI.game&&!(e.target.matches&&e.target.matches('input,select,textarea'))&&(e.key==='j'||e.key==='k')){ e.preventDefault(); ibStep(e.key==='j'?1:-1); }
  /* 소식함: 스페이스바로 안 읽은 소식을 하나씩 열고, 다 읽었으면 계속 진행 */
  if(e.key===' '&&UI.tab==='inbox'&&UI.sheet==null&&!UI.menu&&UI.game==null&&!UI.cer&&!UI.ivSh&&!UI.cmpSh&&!(e.target.matches&&e.target.matches('input,select,textarea,button'))){ e.preventDefault(); ibSpace(); return; }
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('g.pos[data-a],.tcard[data-a]')){ e.preventDefault(); const a=e.target.dataset.a; A[a](e.target.dataset.v); }
});

G=load(); if(G){ try{migrateDraft();}catch(e){} } UI.title=true; UI.sstep='main';
let DL=null; try{ if(window.claude&&window.claude.use)window.claude.use('downloads').then(d=>{ DL=d; if(G&&UI.tab==='club')render(); }).catch(()=>{}); }catch(e){}
render();
