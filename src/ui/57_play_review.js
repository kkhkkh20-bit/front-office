/* ---------- 플레이 리뷰 반영: 보고서가 '다음 행동'으로 이어지게 ----------
   1) 전력 공백 카드: 주축이 장기 이탈하면 내부 대체 · 트레이드 후보 · 외국인 교체로 바로 간다
   2) 자동 처리 보고: 계속 버튼으로 넘기는 사이 기본안으로 처리된 결정을 무엇을 왜 처리했는지 모아 보여 준다
   3) 리빌딩 목표: 마감 때 정리 쪽을 고르면 홈의 목표가 유망주 출전·계약 정리·내년 공백·연봉 여력으로 바뀐다
   4) 주간 요약 진단: 부진한 쪽(선발·불펜·타선)을 기록으로 짚고, 대체·영입·감독 의견으로 연결한다
   5) 선수단 목적별 보기: 전력 보강 · 리빌딩 · 연봉 정리 · 부상 대응 */

/* 자리 안에서 몇 번째 선수인지(능력 기준): 선발 5명·불펜 4명·야수 주전 1명까지를 주축으로 본다 */
function rvCore(p){ if(!p||p.team!==G.user)return false; const k=p.isP?(isSPr(p)?'SP':'RP'):p.pos; const L=domestic(G.user).concat(foreignOf(G.user)).filter(q=>q.isP===p.isP&&(p.isP?(isSPr(q)===isSPr(p)):q.pos===p.pos)).sort((a,b)=>ovr(b)-ovr(a));
  const i=L.findIndex(q=>q.id===p.id); return i>=0&&i<(k==='SP'?5:k==='RP'?4:1); }
function gapCard(){ if(period()!=='season'&&period()!=='pre')return ''; const L=playersOf(G.user).filter(p=>p.injOut>=21&&rvCore(p)).sort((a,b)=>b.injOut-a.injOut).slice(0,2); if(!L.length)return '';
  return `<section class="card gapc"><div class="row between"><h2 class="sec">전력 공백</h2><span class="small muted">주축 장기 이탈 ${L.length}명</span></div>${L.map(p=>{ const slot=p.isP?(isSPr(p)?'선발':'불펜'):POSK[p.pos]||p.pos; const back=G.day+p.injOut;
    return `<div class="gap-r">${avImg(p)}<div class="gap-m"><b>${esc(p.name)}</b> <span class="small muted">${slot} · ${esc(p.injK?injName(p.injK):'부상')} · ${p.injOut}일(${dmd(back)} 복귀 예상)</span>
      <div class="gap-a"><button class="btn small" data-a="posSheet" data-v="${p.isP?'P':p.pos}">내부 대체 확인</button><button class="btn small" data-a="go" data-v="trade:market">트레이드 후보 비교</button>${p.foreign?'<button class="btn small" data-a="go" data-v="transfer:foreign">외국인 교체 검토</button>':''}<button class="btn small" data-a="meetOpen" data-v="mgr">감독과 상의</button></div></div></div>`; }).join('')}</section>`; }

function autoCard(){ const seen=G.autoSeen??-1; const A=(G.autoLog||[]).filter(x=>x.d>seen); if(!A.length)return '';
  return `<section class="card autoc"><div class="row between"><h2 class="sec">자동 처리된 일 ${A.length}건</h2><button class="tc-i" data-a="autoSeen">확인</button></div>
    <ul class="rec-w">${A.slice(0,5).map(x=>`<li><b>${esc(x.t)}</b> → ${esc(x.c)} <span class="small muted">${dmd(x.d)} · 기한이 지나 기본안으로 처리${x.r?` · ${esc(String(x.r).replace(/\n/g,' ').slice(0,80))}`:''}</span></li>`).join('')}</ul>
    <p class="small muted keep">시즌 방향·핵심 선수 처분 같은 핵심 결정은 나타날 때와 기한 하루 전에 진행을 멈춥니다. 일상 결정은 메일의 '앞으로 맡기기'로 비서에게 넘길 수 있습니다.</p></section>`; }

/* 리빌딩: 마감 방향을 '정리'로 고른 해 */
function rebuildOn(){ return !!(G.dline&&G.dline.y===G.year&&G.dline.mode==='sell'); }
function rebuildCard(){ if(!rebuildOn()||!(period()==='season'||period()==='post'))return ''; const y=G.year;
  const young=playersOf(G.user).filter(p=>!p.foreign&&p.age<=24).map(p=>{ const h=seasonTotal(p,y,'1군'); return {p,h,n:h?(p.isP?h.outs/3:h.pa):0}; }).filter(x=>x.n>0).sort((a,b)=>b.n-a.n).slice(0,4);
  const pact=G.pact&&G.pact.y===y&&G.pact.on?G.pact.t.map(t=>G.players[t.id]).filter(Boolean):[];
  const ending=playersOf(G.user).filter(p=>p.foreign||(p.faC&&(p.yrs||0)<=1)||(!p.faC&&(p.svc||0)>=faSvc(p)-1&&!p.extNext));
  const keep=playersOf(G.user).filter(p=>!ending.includes(p)); const committed=sum(keep.filter(p=>!p.foreign).map(p=>p.extNext?p.extNext.annual:p.sal));
  const room=capOf(y+1)-committed; const d=depth(G.user);
  const holes=PSLOTS.filter(k=>k!=='DH'&&k!=='SP'&&k!=='RP').filter(k=>{ const p=d.ln[k]; return !p||ending.includes(p)||p.age>=34; });
  const spOut=d.sp.filter(p=>ending.includes(p)||p.age>=34).length;
  return `<section class="card rebc"><div class="row between"><h2 class="sec">리빌딩 목표</h2><span class="pill">${y} 정리 시즌</span></div>
    <div class="reb-g"><div><span class="eyebrow">유망주 출전</span>${young.length?young.map(x=>`<button class="lnk" data-a="player" data-v="${x.p.id}">${esc(x.p.name)}</button> <span class="small muted">${x.p.age}세 · ${x.p.isP?`${ipStr(x.h.outs)}이닝`:`${x.h.pa}타석`}${pact.includes(x.p)?' · 합의 대상':''}</span>`).join('<br>'):'<span class="small muted">1군에서 뛴 24세 이하 선수가 없습니다.</span>'}</div>
    <div><span class="eyebrow">계약 끝나는 선수</span><b>${ending.length}명</b> <span class="small muted">${ending.slice(0,4).map(p=>esc(p.name)).join(', ')}${ending.length>4?' 외':''}</span></div>
    <div><span class="eyebrow">내년 비는 자리</span>${holes.length||spOut?`<b>${[...holes.map(k=>POSK[k]||k),spOut?`선발 ${spOut}자리`:''].filter(Boolean).join(', ')}</b>`:'<span class="small muted">없음</span>'}</div>
    <div><span class="eyebrow">내년 연봉 여력</span><b class="num">${money(Math.max(0,Math.round(room)))}</b> <span class="small muted">상한 ${money(capOf(y+1))} 기준 · 남는 선수 연봉 ${money(committed)}</span></div></div>
    <div class="row"><button class="btn small" data-a="go" data-v="staff:mgr">유망주 기회 합의</button><button class="btn small" data-a="go" data-v="trade:block">베테랑 매물 정리</button><button class="btn small" data-a="go" data-v="transfer:contract">계약 현황</button></div></section>`; }

/* 구단주 신뢰: 왜 이 숫자인지 한 줄로(목표별 달성 여부) */
function trustWhy(){ let g=null; try{ g=goalStatus(); }catch(e){} if(!g)return ''; const L=[];
  if(g.rank.cur!=null)L.push(g.rank.ok?'성적 목표 안':'성적 목표 미달'); L.push(g.sup.ok?'지원 목표 지킴':'지원 목표 초과'); L.push(g.fan.ok?'여론 목표 안':'여론 목표 미달'); return L.join(' · '); }

/* 주간 요약 진단: 기간 안 우리 경기 기록으로 가장 부진한 쪽을 찾는다 */
function digestDiag(D){ const me=G.user; const gs=(G.games||[]).filter(g=>g.box&&g.day>=D.from&&g.day<=D.to); if(gs.length<2)return '';
  let spO=0,spE=0,rpO=0,rpE=0,pa=0,ob=0,tb=0,ab=0;
  for(const g of gs){ const s=g.box[g.home===me?'h':'a']; s.pit.forEach((x,i)=>{ if(i===0){ spO+=x.outs; spE+=x.er; } else { rpO+=x.outs; rpE+=x.er; } }); for(const b of s.bat){ const bpa=(b.ab||0)+(b.bb||0); pa+=bpa; ab+=b.ab||0; ob+=(b.h||0)+(b.bb||0); tb+=(b.h||0)+(b.d||0)+2*(b.tr||0)+3*(b.hr||0); } }
  const spEra=spO?spE*27/spO:0, rpEra=rpO?rpE*27/rpO:0, ops=(pa?ob/pa:0)+(ab?tb/ab:0);
  const C=[]; if(spO>=27&&spEra>=5.2)C.push({k:'sp',v:(spEra-4.4)/4.4,t:`최근 선발진이 버티지 못하고 있습니다. 선발 평균자책점 ${spEra.toFixed(2)}, 경기당 ${ipStr(Math.round(spO/gs.length))}이닝.`,a:[['내부 대체 선발','posSheet','P'],['선발 트레이드 후보','go','trade:market'],['감독 의견','meetOpen','mgr']]});
  if(rpO>=15&&rpEra>=5.5)C.push({k:'rp',v:(rpEra-4.6)/4.6,t:`불펜이 흔들립니다. 불펜 평균자책점 ${rpEra.toFixed(2)}.`,a:[['불펜 자원 보기','posSheet','P'],['불펜 트레이드 후보','go','trade:market'],['감독 의견','meetOpen','mgr']]});
  if(pa>=60&&ops<.67)C.push({k:'bat',v:(.74-ops)/.74,t:`타선이 터지지 않습니다. 팀 OPS ${fmt3(ops)}.`,a:[['타순·주전 보기','go','roster'],['타자 트레이드 후보','go','trade:market'],['감독 의견','meetOpen','mgr']]});
  if(!C.length)return ''; C.sort((a,b)=>b.v-a.v); const c=C[0];
  return `<div class="dg-diag"><p class="small"><b>진단</b> ${esc(c.t)}${gs.length<4?' <span class="muted">(경기 수가 적어 추정)</span>':''}</p><div class="row">${c.a.map(([l,a,v])=>`<button class="btn small" data-a="${a}" data-v="${v}">${l}</button>`).join('')}</div></div>`; }

/* 선수단 목적별 보기: 열 구성을 한 번에 바꾼다 */
const RVIEW={base:['기본',null],add:['전력 보강',{bat:['cur','pos','war','ops','pa','sal'],pit:['cur','pos','war','era','ip','sal']}],reb:['리빌딩',{bat:['age','fut','cur','pos','pa','ct'],pit:['age','fut','cur','pos','ip','ct']}],pay:['연봉 정리',{bat:['sal','ct','war','age','cur'],pit:['sal','ct','war','age','cur']}],inj:['부상 대응',{bat:['inj','cur','pos','fat','war'],pit:['inj','cur','pos','fat','war']}]};
function rviewBar(pit){ const cur=UI.rview&&UI.rview[pit?'pit':'bat']||'base'; return `<div class="chips rview">${Object.entries(RVIEW).map(([k,[l]])=>`<button data-a="rview" data-v="${k}" class="${cur===k?'on':''}">${l}</button>`).join('')}</div>`; }
Object.assign(A,{
  autoSeen(){ G.autoSeen=G.day; save(); render(); },
  rview(v){ const pit=UI.seg==='pit'; const k=pit?'pit':'bat'; UI.rview=UI.rview||{}; UI.rview[k]=v; rcolLoad(); const P=RVIEW[v]&&RVIEW[v][1]; if(P)UI.rcols[k]=P[k].slice(); else delete UI.rcols[k]; rcolSave(); render(); }
});
/* 창단 직후 예산 설명: 구단 선택 화면(모기업 지원 한도), 드래프트(연봉 상한), 창단 후(지원 목표 안 여유)의 숫자가 서로 다른 기준이라는 것을 한 번 이어 준다 */
function fdBudgetCard(){ if(!(G.fd&&G.fd.done)||G.fdBud||G.startY!==G.year||period()==='season')return ''; let b=null; try{ b=budget(); }catch(e){} if(!b)return ''; const ci=capInfo(G.user); const fsU=sum(foreignOf(G.user).map(p=>p.sal));
  return `<section class="card"><div class="row between"><h2 class="sec">창단 예산 정리</h2><button class="tc-i" data-a="fdBudOk">확인</button></div>
    <p class="small keep">국내 선수 연봉 ${money(ci.all)}(연봉 상한 ${money(ci.cap)}과는 별개인 실제 지출), 운영비, 외국인 배정액 ${money(Math.max(b.fR||0,fsU))}을 반영했습니다. 구단주의 지원 목표 기준으로 올해 추가로 쓸 수 있는 금액은 <b>${money(b.roomGoal)}</b>입니다.</p>
    <p class="small muted keep">구단 선택 화면의 큰 금액은 모기업이 메워 줄 수 있는 적자 한도이고, 드래프트 화면의 금액은 리그 연봉 상한(경쟁균형세 기준)입니다. 홈의 '예산 여유'는 이 지원 목표 안에서 남은 금액입니다.</p>
    <div class="row"><button class="btn small" data-a="go" data-v="club:fin">재정 자세히</button></div></section>`; }
Object.assign(A,{ fdBudOk(){ G.fdBud=true; save(); render(); } });
