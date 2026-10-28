/* ===== 단장 일정: 경기 직관·스카우팅 출장·2군 방문 =====
   단장은 모든 경기를 보지 않는다. 결과는 보고로 받고, 볼 경기를 골라 경기장에 간다(혼자, 구단주와, 사장과).
   경기가 없는 날이나 시즌 중 다른 날에는 고교 대회를 보러 가거나 2군을 찾는다.
   - 직관: 혼자면 선수단 기분·감독 관계가 조금 오르고, 구단주와 보면 이기면 신뢰가 오르고 크게 지면 떨어진다. 사장과 보면 예산 이야기를 나눌 수 있다
   - 스카우팅 출장: 그 지역 드래프트 후보를 단장이 직접 본다. 평가 오차가 줄고(스카우트가 없어도 잠재력 판단 가능), 가끔 숨은 원석을 찾는다
   - 2군 방문: 2군 선수 기분이 오르고 유망주 성장 보고를 받는다 */
const GM_TOURN=[[3,25,4,10,'이마트배 전국고교야구'],[4,25,5,15,'황금사자기 전국고교야구'],[6,5,6,20,'대통령배 전국고교야구'],[7,5,7,22,'청룡기 전국고교야구'],[8,5,8,25,'봉황대기 전국고교야구']];
function gmTourn(d){ const o=dobj(d); for(const t of GM_TOURN){ const a=dnum(o.y,t[0],t[1]), b=dnum(o.y,t[2],t[3]); if(d>=a&&d<=b)return t[4]; } const w=o.w; if(o.m>=3&&o.m<=10&&(w===0||w===6))return '고교야구 주말리그'; return null; }
function gmPlans(){ return G.gmPlan=G.gmPlan||{}; }
function gmPlanAt(d){ return gmPlans()[d]||null; }
function gmPlanSet(d,k,x){ if(d<=G.day)return '지난 날짜입니다.'; const P=gmPlans(); if(!k){ delete P[d]; return '일정을 지웠습니다.'; }
  const g=(G.cal&&G.cal.sched[d]||[]).find(m=>m.includes(G.user));
  if(k==='attend'&&!g){ const ps=G.ps&&G.ps.cur; if(!(ps&&(ps.hi===G.user||ps.lo===G.user)&&ps.days&&ps.days.includes(d)))return '그날은 우리 경기가 없습니다.'; }
  if(k==='scout'&&!gmTourn(d))return '그날은 고교 대회가 없습니다.';
  if(k==='scout'&&!REG.includes(x))return '지역을 고르세요.';
  if(k==='farm'&&!(dobj(d).m>=4&&dobj(d).m<=9))return '2군 경기가 없는 시기입니다.';
  if(k==='attend'&&x==='owner'){ const n=Object.values(P).filter(p=>p.k==='attend'&&p.x==='owner'&&!p.done).length; if(n>=2)return '구단주와의 직관은 한 번에 두 경기까지만 잡을 수 있습니다.'; }
  P[d]={k,x:x||null,done:false};
  return k==='attend'?`${dmd(d)} 경기 직관을 잡았습니다${x==='owner'?'(구단주 동행)':x==='ceo'?'(사장 동행)':''}. 전날 알려 드립니다.`:k==='scout'?`${dmd(d)} ${x} ${gmTourn(d)} 관전 출장을 잡았습니다.`:`${dmd(d)} 2군 방문을 잡았습니다.`; }
/* 전날: 직관 알림(진행을 멈춘다). 당일: 출장·방문 결과 */
function gmPlanDaily(){ if(G.unemp)return; const P=gmPlans(); const tm=P[G.day+1];
  if(tm&&tm.k==='attend'&&!tm.warned){ tm.warned=true; mail('비서실',`내일 직관: ${(()=>{ const g=(G.cal.sched[G.day+1]||[]).find(m=>m.includes(G.user)); return g?`${g[0]===G.user?'vs':'@'} ${tname(g[0]===G.user?g[1]:g[0])}`:'우리 경기'; })()}`,`내일 경기장에 가는 일정입니다${tm.x==='owner'?'. 구단주께서 함께 보십니다':tm.x==='ceo'?'. 사장께서 함께 보십니다':''}. '경기장으로 가기'를 누르면 경기를 처음부터 봅니다.`,{imp:true,kind:'일정',acts:[{l:'경기장으로 가기',a:'watchNext'}]}); }
  const p=P[G.day]; if(!p||p.done)return;
  if(p.k==='scout'){ p.done=true; gmScoutTrip(p.x); }
  else if(p.k==='farm'){ p.done=true; gmFarmVisit(); }
  /* 우천 순연 등으로 열리지 않은 직관 일정은 취소한다(구단주 동행 한도를 계속 차지하지 않게) */
  for(const d in P){ const q=P[d]; if(+d<G.day&&!q.done&&q.k==='attend'){ q.done=true; q.miss=true; note('일정',`${dmd(+d)} 직관하려던 경기가 열리지 않아 일정을 취소했습니다.`); } }
  for(const d in P)if(+d<G.day-40)delete P[d]; }
/* 직관 경기가 끝난 뒤(applyGame 이후 호출) */
function gmAttendResult(rec){ const p=gmPlanAt(rec.day); if(!p||p.k!=='attend'||p.done)return; p.done=true; const t=team(G.user); const ms=rec.home===G.user?rec.hs-rec.as:rec.as-rec.hs; const L=[];
  const m=G.mgr[G.user]; if(m&&!m.interim){ m.rel=clamp(m.rel+1,0,100); L.push('감독 관계 +1'); } for(const q of playersOf(G.user).filter(q=>q.e1))q.mor=clamp((q.mor??60)+1,0,100); L.push('1군 선수단 기분 +1');
  if(p.x==='owner'){ const d=ms>0?1.5:ms<=-5?-1.5:0; t.trust=clamp(t.trust+d,0,100); L.push(d?`구단주 신뢰 ${d>0?'+':''}${d}`:'구단주 신뢰 변화 없음');
    const B=bossOf(G.user); mail('구단주실',`구단주와 함께 본 경기: ${ms>0?'승리':ms<0?'패배':'무승부'}`,`${ms>0?'"오늘 같은 경기를 자주 보고 싶군요. 수고했습니다."':ms<=-5?'"이런 경기를 보여 주려고 날 부른 겁니까?"':'"쉽지 않은 경기였군요. 계속 지켜보겠습니다."'}\n\n${L.join(' · ')}`,{kind:'구단주'}); void B; }
  else if(p.x==='ceo'){ L.push('사장과 예산 이야기를 나눴습니다'); const b=budget(); if(b.roomGoal<0&&R()<.5){ t.trust=clamp(t.trust+.5,0,100); L.push('사장이 구단주에게 현장 사정을 잘 전해 주기로 했습니다(신뢰 +0.5)'); } mail('사장실','사장과 함께 본 경기',L.join(' · '),{kind:'구단주'}); }
  else note('일정',`직관을 마쳤습니다. ${L.join(' · ')}.`); }
function gmScoutTrip(reg){ const tn=gmTourn(G.day)||'고교 대회'; const C=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&p.region===reg&&!p.college);
  if(!C.length){ note('스카우트',`${reg} ${tn}을(를) 보고 왔지만 올해 드래프트 후보가 눈에 띄지 않았습니다.`); return; }
  const seen=C.sort(()=>R()-.5).slice(0,Math.min(C.length,ri(5,9))); for(const p of seen)p.gmSeen=G.year;
  /* 단장 눈에 들어온 선수도 실제 잠재력이 아니라 직접 본 평가(오차 포함)로 고른다 */ const ev=new Map(seen.map(p=>{ const rp=scoutReport(p); return [p.id,rp.ofp??rp.cur]; })); const top=[...seen].sort((a,b)=>ev.get(b.id)-ev.get(a.id)).slice(0,3); const gem=seen.find(p=>ev.get(p.id)>=58&&(p.press==null||p.press>30)&&R()<.5);
  if(gem){ gem.gmGem=G.year; (G.shortlist=G.shortlist||[]); if(!G.shortlist.includes(gem.id))G.shortlist.push(gem.id); }
  mail('단장 노트',`${reg} ${tn} 관전`,`직접 본 후보 ${seen.length}명. 이 선수들은 평가 오차가 줄었습니다.\n눈에 들어온 선수: ${top.map(p=>`${p.name}(${posLabel(p)}, ${p.school||p.region})`).join(', ')}${gem?`\n\n눈여겨본 선수: ${gem.name}(${posLabel(gem)}) — 언론 순위는 낮지만 직접 보니 그릇이 커 보입니다. 한두 번 본 인상이라 틀릴 수 있습니다. 관심 명단에 넣었습니다.`:''}`,{kind:'스카우트',acts:[{l:'드래프트 후보',a:'go',v:'transfer:draft'}],ref:gem?gem.id:top[0]&&top[0].id}); }
function gmFarmVisit(){ const d=depth(G.user); const F=[...d.futB,...d.futP].filter(p=>!p.ys); for(const p of F)p.mor=clamp((p.mor??60)+2,0,100);
  const best=F.filter(p=>p.age<=24).map(p=>({p,g:potGapEst(p)})).sort((a,b)=>b.g-a.g).slice(0,3).map(x=>x.p);
  mail('단장 노트','2군 방문',`2군 선수 ${F.length}명의 기분이 올랐습니다(+2).\n코치진이 가장 크게 볼 만하다고 보는 선수: ${best.map(p=>`${p.name}(${posLabel(p)}, ${p.age}세, 현재 ${dvo(p)})`).join(', ')||'-'}\n2군 감독: "단장님이 직접 오시니 선수들 눈빛이 다릅니다."`,{kind:'육성'}); }
