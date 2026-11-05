/* ---------- 재정 탭 ---------- */
function moneyView(){
  const t=team(G.user); const ci=capInfo(G.user);
  const f=G.last&&G.last.fins?G.last.fins[G.user]:null; const hs=G.history.filter(h=>h.user);
  const it=inTabs('fin',[['bud','올해 예산'],['flow','수입·지출'],['lim','한도·캡'],['last','지난 결산'],...(fmOn()?[['star','선수 홍보']]:[])]); /* PC 구단주 화면은 FM식 한 화면이라 선수 홍보 카드는 재정 쪽 탭으로 */
  if(it.cur==='star')return it.bar+starPanel();
  if(it.cur==='bud'&&fmOn())return it.bar+finDash();
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
  const mm=(G.mmarket||[]).map(x=>x.sal); const pay=m&&!m.interim?mgrSevPay(m).pay:0;
  const row=(l,v,max,cls)=>`<div class="bud-r"><span>${l}</span><i><em class="${cls||''}" style="width:${Math.min(100,v/max*100).toFixed(1)}%"></em></i><b>${money(v)}</b></div>`;
  const emax=Math.max(...b.exp.map(x=>x[1]),1), imax=Math.max(...b.inc.map(x=>x[1]),1);
  return `<section class="card budc"><div class="row between"><span class="eyebrow">${G.last&&G.last.y>=G.year?G.year+1:G.year} 예산 · ${dmd(finYearEnd())} 결산까지 연간 예상</span><span class="small muted">보유 현금 ${money(b.cash)}</span></div>
    <div class="bud-big"><span>${b.indie?'적자 없이':'구단주 목표 안에서'} 예산 여유</span>${big}</div>
    <div class="bud-bar">${segs.map(([k,v,l])=>v>0?`<span class="sg ${k}" style="width:${w(v)}" title="${l} ${money(v)}"></span>`:'').join('')}<span class="mk" style="left:${w(b.E)}"><i>예상 지출 ${money(b.E)}</i></span></div>
    <div class="bud-lg">${segs.map(([k,v,l])=>v>0?`<span><i class="${k}"></i>${l} ${money(v)}</span>`:'').join('')}</div>
    <div class="bud-t"><div><span>예상 수입</span><b>${money(b.I)}</b></div><div><span>예상 지출</span><b>${money(b.E)}</b></div><div><span>모기업 지원 예상</span><b class="${!b.indie&&b.support>b.goalSup?'bad':''}">${b.indie?'없음':money(b.support)}</b>${b.indie?'':`<em>한도 ${money(b.cap)}${(()=>{ const a=austOn(team(G.user)); return a&&a.d?` · ${austTxt(a)}(${a.y1}년까지)`:''; })()}</em>`}</div><div><span>결산 후 예상 현금</span><b class="${b.endCash<0?'bad':''}">${money(b.endCash)}</b></div></div>
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
/* PC 그래프: 0을 기준선으로 한 면적 그래프(인라인 SVG). p:1인 끝 점들은 예상이라 점선 */
/* 추이 선 그래프: 면을 채우지 않고 선과 점만. 세로 범위는 값 주변으로(0을 지나면 0선 표시), 점선은 결산까지 예상 */
function fmArea(P,col,fmt=money,Q,col2,o){ /* o.nodot: 점 없이 선만(마지막 값 표시는 남김) */ if(P.length<2){ P=[P[0],{...P[0],l:''}]; if(Q)Q=[Q[0],Q[0]]; } const V=[...P,...(Q||[])].map(p=>p.v), n=P.length;
  let hi=Math.max(...V), lo=Math.min(...V); const pad=Math.max((hi-lo)*.15,Math.abs(hi)*.05,1); hi+=pad; lo-=pad; if(lo>0&&lo<hi*.35)lo=0; if(o&&o.lo!=null)lo=o.lo; if(o&&o.hi!=null)hi=o.hi; /* 순위 그래프처럼 범위가 정해진 값(0위·11위 눈금이 생기지 않게) */ const rg=hi-lo||1;
  const X=i=>i/(n-1)*100, Y=v=>(hi-v)/rg*100, k=P.filter(p=>!p.p).length||1;
  const pts=(L,o)=>L.map((p,i)=>`${X(i+o).toFixed(2)},${Y(p.v).toFixed(2)}`).join(' ');
  const grid=[0,1,2,3].map(i=>lo+rg*i/3), zero=lo<0&&hi>0;
  return `<div class="fmc"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${grid.map(v=>`<line x1="0" x2="100" y1="${Y(v).toFixed(2)}" y2="${Y(v).toFixed(2)}" stroke="var(--line)" stroke-opacity=".6" vector-effect="non-scaling-stroke"/>`).join('')}${zero?`<line x1="0" x2="100" y1="${Y(0).toFixed(2)}" y2="${Y(0).toFixed(2)}" stroke="var(--muted)" vector-effect="non-scaling-stroke"/>`:''}<polyline points="${pts(P.slice(0,k),0)}" fill="none" stroke="${col}" stroke-width="2.5" vector-effect="non-scaling-stroke"/>${k<n?`<polyline points="${pts(P.slice(k-1),k-1)}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>`:''}${Q?`<polyline points="${pts(Q,0)}" fill="none" stroke="${col2}" stroke-width="2" vector-effect="non-scaling-stroke"/>`:''}</svg>${o&&o.nodot?'':P.map((p,i)=>`<i class="fmc-p${p.p?' est':''}" style="left:${X(i).toFixed(1)}%;top:${Y(p.v).toFixed(1)}%;--c:${col}" title="${esc(p.l||'')} ${fmt(p.v)}"></i>`).join('')}${(()=>{ const p=P[k-1]; return `<span class="fmc-v" style="left:${X(k-1).toFixed(1)}%;top:${Y(p.v).toFixed(1)}%">${fmt(p.v)}</span>`; })()}${[grid[3],grid[0]].map(v=>`<span class="fmc-y" style="top:${Y(v).toFixed(1)}%">${fmt(v)}</span>`).join('')}${zero?`<span class="fmc-y" style="top:${Y(0).toFixed(1)}%">${fmt(0)}</span>`:''}${P.map((p,i)=>p.l&&(n<=9||i%2===0||i===n-1)?`<span class="fmc-x" style="left:${X(i).toFixed(1)}%">${esc(p.l)}</span>`:'').join('')}</div>`; }
function fmBar(v,mx,bad){ return `<svg class="fmd-bar" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="6" fill="var(--panel2)"/><rect width="${clamp(v/Math.max(1,mx)*100,0,100).toFixed(1)}" height="6" fill="var(${bad?'--bad':'--good'})"/></svg>`; }
function fmBox(cls,h,big,stats,body){ return `<section class="card ${cls}"><div class="fmd-top"><div><h3 class="fmd-h">${h}</h3><b class="fmd-big">${big}</b></div>${stats.map(([k,v])=>`<div class="fmd-st"><span>${k}</span><b>${v}</b></div>`).join('')}</div>${body}</section>`; }
/* PC 재정(FM 재정 화면처럼): 위 보유 현금 추이 · 예산 여유 추이, 아래 수입·지출, 오른쪽 예산 칸, 맨 아래 규정 준수 띠.
   추이는 월말 재무팀 기록(G.finLog·G.finSnap)과 오늘 값, 결산 예상 현금(점선)으로 그린다 */
function finDash(){ const b=budget(), t=team(G.user), ci=b.ci, L=G.finLog||[], s=G.finSnap, last=L[L.length-1], st=!!(G.last&&G.last.y>=G.year);
  const f=G.last&&G.last.fins?G.last.fins[G.user]:null, ml=m=>((m+10)%12+1)+'월', same=!!(s&&last&&s.cash===last.cash1&&s.room===last.room1);
  const sg=v=>`<span class="${v>=0?'good':'bad'}">${v>=0?'+':''}${money(v)}</span>`;
  const cash=[...(L.length?[{l:ml(L[0].m),v:L[0].cash0}]:[]),...L.map(x=>({l:x.m+'월',v:x.cash1})),...(s&&!same?[{l:dsh(s.d),v:s.cash}]:[]),{l:'오늘',v:t.cash},{l:dsh(finYearEnd())+' 결산',v:b.endCash,p:1}];
  const room=[]; if(s&&s.y===G.year&&s.st===st){ let v=s.room,k=L.length-1; if(same){ while(k>=0&&L[k].y===s.y&&L[k].room1===v){ room.unshift({l:L[k].m+'월',v}); v=L[k].room0; k--; } room.unshift({l:ml(L[k+1].m),v}); } else room.push({l:dsh(s.d),v}); } /* 결산을 사이에 두면 다른 해 예산이라 이어 그리지 않는다 */
  room.push({l:'오늘',v:b.roomGoal});
  const chg=last&&last.y===G.year?last.top.slice(0,5):[];
  const li=(A,c)=>{ const mx=Math.max(1,...A.map(x=>x[1])); return A.map(x=>`<div class="fmd-li"><span>${esc(x[0])}</span>${`<svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><rect width="${(x[1]/mx*100).toFixed(1)}" height="8" fill="var(${c})"/></svg>`}<b>${money(x[1])}</b></div>`).join(''); };
  const R=[['샐러리캡',!ci.over,ci.over?`상한을 ${money(ci.over)} 넘었습니다. 결산 때 경쟁균형세를 냅니다.`:`국내 선수 연봉 ${money(ci.pay)}이 상한 ${money(ci.cap)} 안입니다.`],
    ...(G.year>=2027?[['샐러리캡 하한',ci.pay>=ci.floor,ci.pay>=ci.floor?`하한 ${money(ci.floor)} 이상입니다.`:`하한 ${money(ci.floor)}에 ${money(ci.floor-ci.pay)} 모자랍니다. 발전기금을 냅니다.`]]:[]),
    ['외국인 선수 총액',b.fUsed<=b.fCap,`${foreignOf(G.user).filter(p=>p.foreign==='용병').length}명 총액 ${Math.round(b.fUsed/USD)}만 달러 · 한도 ${Math.round(b.fCap/USD)}만 달러`],
    ...(b.indie?[]:[['구단주 지원 목표',b.support<=b.goalSup,`적자 보전 예상 ${money(b.support)} · 목표 ${money(b.goalSup)} 이하`]])];
  const bud=`<section class="card fmd-bud"><h3 class="fmd-h">예산</h3>
    <div class="fmd-s"><span class="fmd-k">구단주 목표 안 예산 여유</span><b class="fmd-big ${b.roomGoal<0?'bad':''}">${money(b.roomGoal)}</b>${b.indie?'<p>독립구단 · 모기업 지원 없음</p>':`<p>모기업 지원 예상 ${money(b.support)} · 목표 ${money(b.goalSup)}(한도의 ${Math.round(b.goalFrac*100)}%) · 한도 ${money(b.cap)}</p>${fmBar(b.support,b.cap,b.support>b.goalSup)}`}<p>${b.lockD!=null?dsh(b.lockD)+'에 시즌 예산 확정':'시즌 시작 때 예산 확정'}${b.extra?` · 예상보다 수입 ${b.extra>0?'+':''}${money(b.extra)}`:''}</p></div>
    <div class="fmd-s"><span class="fmd-k">국내 선수 연봉 (샐러리캡)</span><b>${money(ci.pay)} / ${money(ci.cap)}</b>${fmBar(ci.pay,ci.cap,ci.over)}<p>${ci.over?`초과 ${money(ci.over)} · 경쟁균형세 부과`:`여유 ${money(ci.cap-ci.pay)}`}</p></div>
    <div class="fmd-s"><span class="fmd-k">외국인 선수 (3명)</span><b>${Math.round(b.fUsed/USD)}만 / ${Math.round(b.fCap/USD)}만 달러</b>${fmBar(b.fUsed,b.fCap,b.fUsed>b.fCap)}<p>배정 예산 남음 ${money(b.fRoom)}${b.aUsed?` · 아시아쿼터 ${Math.round(b.aUsed/USD)}만 달러`:''}</p></div>
    <div class="fmd-s"><span class="fmd-k">마케팅 예산</span>${period()==='pre'?marketingBody():`<b>${money(G.marketing)}</b><p>개막 전(스프링캠프 기간)에만 바꿀 수 있습니다.</p>`}</div>
    <div class="fmd-s"><span class="fmd-k">예산 조정</span><div class="fmd-acts"><button class="btn small" data-a="go" data-v="club:owner">구단주에게 요청</button><button class="btn small" data-a="itab" data-v="fin:lim">한도·캡 자세히</button><button class="btn small" data-a="itab" data-v="fin:star">선수 홍보</button></div></div></section>`;
  return `<div class="fmd fin-d">${fmBox('fmd-cash','보유 현금',`<span class="${t.cash<0?'bad':''}">${money(t.cash)}</span>`,[['결산 후 예상 현금',money(b.endCash)],['결산일',dmd(finYearEnd())],['지난 결산 후 현금',f?money(f.cash):'기록 없음']],fmArea(cash,'var(--team-hi)')+'<p class="fmd-note">월말 재무팀 기록과 오늘 값 · 점선은 결산까지의 예상</p>')}
    ${fmBox('fmd-room','예산 여유',`<span class="${b.roomGoal<0?'bad':''}">${money(b.roomGoal)}</span>`,[['올해 예상 수지',sg(b.I-b.E)],['모기업 지원 예상',b.indie?'없음':money(b.support)],['지난 시즌 순이익',f?sg(f.net):'기록 없음']],`<div class="fmd-row">${fmArea(room,'var(--warn)')}<div class="fmd-chg"><span class="fmd-k">${chg.length?last.m+'월에 바뀐 항목':'바뀐 항목'}</span>${chg.map(z=>`<div class="fmd-li2"><span>${z.kind} · ${esc(z.l)}</span>${sg(z.eff)}</div>`).join('')||'<p class="fmd-note">월말 재무팀 보고가 오면 예산 여유를 바꾼 항목이 여기에 쌓입니다.</p>'}</div></div>`)}
    ${fmBox('fmd-inc','올해 예상 수입',money(b.I),[],`<div class="fmd-l">${li(b.inc,'--good')}</div><p class="fmd-note">${dmd(finYearEnd())} 결산까지 연간 예상 · 포스트시즌 배당 제외</p>`)}
    ${fmBox('fmd-exp','올해 예상 지출',money(b.E),[],`<div class="fmd-l">${li([...b.exp].sort((x,y)=>y[1]-x[1]),'--warn')}</div>`)}
    ${bud}<section class="card fmd-rule"><h3 class="fmd-h">규정 준수</h3><div class="fmd-rl">${R.map(([l,ok,d])=>`<div class="${ok?'ok':'ng'}"><b>${l} <span class="pill ${ok?'good':'bad'}">${ok?'준수':/하한/.test(l)?'미달':'초과'}</span></b><p>${d}</p></div>`).join('')}</div></section></div>`; }
function fBudgetTag(cost){ const b=budget(); if(cost<=b.fRoom)return '<span class="pill good" title="보장액(계약금+연봉)은 외국인 배정 예산(시즌 전에 따로 떼어 둔 돈) 안에서 씁니다. 인센티브는 달성할 것으로 보고 일반 예산의 계약 옵션(예상) 항목에 잡혀서, 계약하면 홈의 예산 여유가 그만큼 줄어듭니다">보장액은 배정 예산 안 · 인센티브는 일반 예산</span>'; const ex=cost-b.fRoom; return b.roomGoal>=ex?`<span class="pill warn" title="외국인 배정 예산을 넘는 ${money(ex)}은 일반 예산에서 씁니다">배정 예산 초과 ${money(ex)} · 일반 예산 사용</span>`:b.roomMax>=ex?`<span class="pill warn">예산 초과 ${money(ex)}</span>`:'<span class="pill bad">자금 부족</span>'; }
function budgetTag(cost){ const b=budget(); if(b.roomGoal>=cost)return `<span class="pill good">올해 부담 ${money(cost)} · 예산 안</span>`; if(b.roomCap>=cost||b.roomMax>=cost)return `<span class="pill warn">올해 부담 ${money(cost)} · 구단주 목표 초과</span>`; return `<span class="pill bad">올해 부담 ${money(cost)} · 자금 부족</span>`; }

