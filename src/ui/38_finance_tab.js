/* ---------- 재정 탭 ---------- */
function moneyView(){
  const t=team(G.user); const ci=capInfo(G.user);
  const f=G.last&&G.last.fins?G.last.fins[G.user]:null; const hs=G.history.filter(h=>h.user);
  const it=inTabs('fin',[['bud','올해 예산'],['flow','수입·지출'],['lim','한도·캡'],['last','지난 결산']]);
  if(it.cur==='flow'||it.cur==='lim'){ const parts=budgetCards().split('<section class="card'); const pick=it.cur==='flow'?parts.find(x=>x.includes('어디에 쓰고 어디서 버나')):parts.find(x=>x.includes('용도별 한도')); return it.bar+(pick?'<section class="card'+pick:'')+(it.cur==='lim'?capCard(ci):''); }
  if(it.cur==='last')return it.bar+(f?`<section class="card"><h2 class="sec">${G.last.y} 결산</h2>${finTable(f)}</section>`:'<section class="card"><p class="small muted">첫 시즌을 마치면 결산이 올라옵니다.</p></section>')+`<section class="card"><h2 class="sec">재임 기록</h2>${hs.length?`<div class="tw"><table><thead><tr><th>시즌</th><th>성적</th><th>순위</th><th>순이익</th><th>신뢰</th></tr></thead><tbody>${hs.map(h=>`<tr><td>${h.y}</td><td>${h.user.w}-${h.user.l}${h.user.t?'-'+h.user.t:''}</td><td>${h.user.rank}</td><td>${money(h.user.net)}</td><td>${h.user.trust}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small muted">첫 시즌을 마치면 기록이 쌓입니다.</p>'}</section>`;
  { const parts=budgetCards().split('<section class="card'); return it.bar+finMonthCard()+parts.filter(x=>x&&!x.includes('어디에 쓰고 어디서 버나')&&!x.includes('용도별 한도')).map(x=>'<section class="card'+x).join('')+csec('마케팅 예산',period()==='pre'?marketingBody():`<p>올 시즌 마케팅 예산 <b class="num">${money(G.marketing)}</b></p><p class="small muted">마케팅 예산은 개막 전(스프링캠프 기간)에만 바꿀 수 있습니다.</p>`); }
}
function finMonthCard(){ const L=(G.finLog||[]).filter(x=>x.y===G.year); const x=L[L.length-1]; const p=G.finSnap; const now=p&&p.y===G.year?finSnapNow():null; const dr=now?now.room-p.room:null;
  const row=z=>`<div class="tsb-r"><span>${z.kind} · ${esc(z.l)}</span><span>${money(z.v0)} → ${money(z.v1)} <b class="${z.eff>=0?'good':'bad'}">${z.eff>=0?'+':''}${money(z.eff)}</b></span></div>`;
  if(!x&&dr==null)return '';
  const xr=x?x.room1-x.room0:0;
  return `<section class="card"><div class="row between"><h2 class="sec">예산 여유가 바뀐 이유</h2><span class="small muted">재무팀 월간 보고</span></div>
    ${x?`<p><b>${x.m}월</b> ${money(x.room0)} → <b class="${xr>=0?'good':'bad'}">${money(x.room1)}</b> (${xr>=0?'+':''}${money(xr)})</p>${x.top.length?`<div class="tsbox">${x.top.slice(0,5).map(row).join('')}</div>`:'<p class="small muted">크게 바뀐 항목이 없었습니다.</p>'}`:''}
    ${dr!=null&&Math.abs(dr)>=50?`<p class="small muted">${dsh(p.d)} 이후 ${dr>=0?'+':''}${money(dr)} 더 바뀌었습니다.</p>`:''}
    <p class="small muted">초록은 예산 여유를 늘린 변화, 빨강은 줄인 변화입니다.</p></section>`; }
function budgetCards(){ const b=budget(); const t=team(G.user); const m=G.mgr[G.user];
  const total=Math.max(b.E,b.I+b.cap+Math.max(0,b.cash))*1.04; const w=v=>Math.max(0,v/total*100).toFixed(2)+'%';
  const segs=[['in',b.I,'예상 수입'],['sup',Math.min(b.goalSup,b.cap),'지원(목표 안)'],['sup2',Math.max(0,b.cap-b.goalSup),'지원(목표 초과)'],['cash',Math.max(0,b.cash),'보유 현금']];
  const big=b.roomGoal>=0?`<b class="ok">${money(b.roomGoal)}</b>`:`<b class="bad">목표 초과 ${money(-b.roomGoal)}</b>`;
  const supTxt=b.indie?'독립구단이라 모기업 지원이 없습니다. 수입 안에서 운영해야 하고, 모자라면 보유 현금이 줄어듭니다.'
    :`모기업이 적자를 <b>${money(b.cap)}</b>까지 메워 줍니다(구단주 신뢰 ${b.trust}에 비례). 구단주 목표는 한도의 <b>${Math.round((b.goalFrac??.5)*100)}%(${money(b.goalSup)})</b> 이하만 쓰는 것입니다. 많이 받을수록 구단주 평가가 깎입니다.`;
  const yb=foreignOf(G.user).filter(p=>p.foreign==='용병'); const as=foreignOf(G.user).filter(p=>p.foreign==='아시아');
  const mm=(G.mmarket||[]).map(x=>x.sal); const pay=m&&!m.interim?Math.round(m.sal*Math.max(0,m.yrs-.5)):0;
  const row=(l,v,max,cls)=>`<div class="bud-r"><span>${l}</span><i><em class="${cls||''}" style="width:${Math.min(100,v/max*100).toFixed(1)}%"></em></i><b>${money(v)}</b></div>`;
  const emax=Math.max(...b.exp.map(x=>x[1]),1), imax=Math.max(...b.inc.map(x=>x[1]),1);
  return `<section class="card budc"><div class="row between"><span class="eyebrow">${G.last&&G.last.y>=G.year?G.year+1:G.year} 예산 · ${dmd(finYearEnd())} 결산까지 연간 예상</span><span class="small muted">보유 현금 ${money(b.cash)}</span></div>
    <div class="bud-big"><span>${b.indie?'적자 없이':'구단주 목표 안에서'} 예산 여유</span>${big}</div>
    <div class="bud-bar">${segs.map(([k,v,l])=>v>0?`<span class="sg ${k}" style="width:${w(v)}" title="${l} ${money(v)}"></span>`:'').join('')}<span class="mk" style="left:${w(b.E)}"><i>예상 지출 ${money(b.E)}</i></span></div>
    <div class="bud-lg">${segs.map(([k,v,l])=>v>0?`<span><i class="${k}"></i>${l} ${money(v)}</span>`:'').join('')}</div>
    <div class="bud-t"><div><span>예상 수입</span><b>${money(b.I)}</b></div><div><span>예상 지출</span><b>${money(b.E)}</b></div><div><span>모기업 지원 예상</span><b class="${!b.indie&&b.support>b.goalSup?'bad':''}">${b.indie?'없음':money(b.support)}</b>${b.indie?'':`<em>한도 ${money(b.cap)}</em>`}</div><div><span>결산 후 예상 현금</span><b class="${b.endCash<0?'bad':''}">${money(b.endCash)}</b></div></div>
    <p class="small expl">${supTxt}</p>
    <p class="small expl"><b>시즌 예산은 ${b.lockD!=null?dsh(b.lockD):'시즌 시작 때'} 확정됐습니다.</b> 구단주 지원과 예상 수입(입장·중계·광고·스폰서)을 그때 기준으로 정해 두고, 시즌 중에 성적이 좋아 신뢰나 수입이 늘어도 예산 여유는 늘지 않습니다. 더 쓰려면 구단주에게 추가 지원을 받아야 합니다(구단 → 구단주).${b.extra>0?` 지금까지 예상보다 수입이 <b class="ok">${money(b.extra)}</b> 더 들어왔습니다. 이 돈은 구단 몫이고, 구단주에게 요청할 때 근거가 됩니다(승인 가능성이 오릅니다).`:b.extra<0?` 수입이 예상보다 ${money(-b.extra)} 덜 들어오고 있습니다(결산 때 적자 보전이 그만큼 늘어납니다).`:''}</p>
    <p class="small muted">자금이 마이너스가 되면 구단주 신뢰가 크게 떨어집니다. 지원 한도와 보유 현금까지 모두 쓰면 최대 ${money(b.roomMax)}까지 더 쓸 수 있습니다. 새로 맺는 계약은 올해 남은 기간(${Math.round(b.rem*100)}%)만큼만 올해 예산에 잡힙니다.</p></section>
  <section class="card"><h2 class="sec">용도별 한도</h2><div class="bud-u">
    <div><span class="eyebrow">외국인 선수 (3명)</span><b>${b.fUsed?`${Math.round(b.fUsed/USD)}만 / ${Math.round(b.fCap/USD)}만 달러`:`계약 없음 · 한도 ${Math.round(b.fCap/USD)}만 달러`}</b><i class="bar"><em style="width:${Math.min(100,b.fUsed/b.fCap*100)}%"></em></i><span class="small muted">남은 총액 ${Math.round((b.fCap-b.fUsed)/USD)}만 달러(약 ${money(b.fCap-b.fUsed)}) · 새 계약 1명당 ${Math.round(F_NEW_CAP/USD)}만 달러 이하 · ${yb.length}/3명</span></div>
    <div><span class="eyebrow">아시아쿼터 (1명)</span><b>${as.length?`${Math.round(b.aUsed/USD)}만 달러`:'비어 있음'}</b><span class="small muted">1명당 ${Math.round(ASIA_CAP/USD)}만 달러 이하</span></div>
    <div><span class="eyebrow">감독</span><b>${m?`${esc(m.name)} 연 ${money(m.sal)}`:'빈자리'}</b><span class="small muted">${m&&!m.interim?`잔여 ${Math.max(0,m.yrs)}년 · 경질하면 정산금 ${money(pay)}`:'감독대행 체제'}${mm.length?` · 후보 연봉 ${money(Math.min(...mm))}~${money(Math.max(...mm))}`:''}</span></div>
    <div><span class="eyebrow">국내 선수 연봉 (샐러리캡)</span><b>${money(b.ci.pay)} / ${money(b.ci.cap)}</b><i class="bar"><em class="${b.ci.over?'bad':''}" style="width:${Math.min(100,b.ci.pay/b.ci.cap*100)}%"></em></i><span class="small muted">${b.ci.over?`초과 ${money(b.ci.over)} · 경쟁균형세 부과`:`여유 ${money(b.ci.cap-b.ci.pay)}`}</span></div>
  </div><p class="small muted">한도는 계약 규정입니다. 실제로 쓸 수 있는지는 위의 "예산 여유"로 판단하세요.</p></section>
  <section class="card"><h2 class="sec">어디에 쓰고 어디서 버나</h2><div class="eyebrow">지출 (연간 예상)</div>${[...b.exp].sort((x,y)=>y[1]-x[1]).map(x=>row(x[0],x[1],emax,'ex')).join('')}
    <div class="eyebrow">수입 (연간 예상, 포스트시즌 배당 제외)</div>${b.inc.map(x=>row(x[0],x[1],imax,'in')).join('')}</section>`;
}
function fBudgetTag(cost){ const b=budget(); if(cost<=b.fRoom)return '<span class="pill good" title="외국인 배정 예산(시즌 전에 따로 떼어 둔 돈) 안에서 씁니다. 그래서 홈의 예산 여유는 줄지 않습니다">배정 예산 안 · 예산 여유 그대로</span>'; const ex=cost-b.fRoom; return b.roomGoal>=ex?`<span class="pill warn" title="외국인 배정 예산을 넘는 ${money(ex)}은 일반 예산에서 씁니다">배정 예산 초과 ${money(ex)} · 일반 예산 사용</span>`:b.roomMax>=ex?`<span class="pill warn">예산 초과 ${money(ex)}</span>`:'<span class="pill bad">자금 부족</span>'; }
function budgetTag(cost){ const b=budget(); if(b.roomGoal>=cost)return `<span class="pill good">올해 부담 ${money(cost)} · 예산 안</span>`; if(b.roomCap>=cost||b.roomMax>=cost)return `<span class="pill warn">올해 부담 ${money(cost)} · 구단주 목표 초과</span>`; return `<span class="pill bad">올해 부담 ${money(cost)} · 자금 부족</span>`; }

