/* ---------- 단장 카드: 나도 리그의 한 사람. 계약·통산 성적·경력 ---------- */
function gmCardView(){ if(G.unemp)return ''; const C=myCInit(); if(!C)return ''; const S=myCStats(); const left=C.y1-G.year;
  const stint=x=>`<div class="row between small"><span>${badge(x.tid,18)} ${esc(tshort(x.tid))} · ${x.y0}~${x.y1}</span><span class="muted">${money(x.sal)} · ${esc(x.how)}</span></div>`;
  const chT=S.chT.length?`<div class="small">우승한 구단: ${S.chT.map(t=>`${badge(t,16)} ${esc(tshort(t))}`).join(' · ')}</div>`:'';
  return `<section class="card gmcard"><div class="row between"><div><div class="eyebrow">단장 카드</div><h2 class="sec">${esc(tname(C.tid))} 단장${(()=>{ const n=meNick(); return n?` <span class="pill acc">${esc(n)}</span>`:''; })()}</h2></div>${badge(C.tid,44)}</div>
    <div class="gmc-grid">
      <div><span class="muted">연봉</span><b>${money(C.sal)}</b></div>
      <div><span class="muted">계약</span><b>${C.y0}~${C.y1}</b><i class="small ${left<=0?'warn':'muted'}">${left<=0?'올해 만료':`${left}년 남음`}</i></div>
      <div><span class="muted">명성</span><b>${G.rep??50}</b><i class="small muted">${esc(repLabel(G.rep??50))}</i></div>
      <div><span class="muted">통산</span><b>${S.n}시즌</b><i class="small muted">${S.w}승 ${S.l}패 · 승률 ${fmt3(S.pct)}</i></div>
      <div><span class="muted">우승</span><b>${S.ch}회</b><i class="small muted">준우승 ${S.ru} · 가을야구 ${S.ps}</i></div>
      <div><span class="muted">통산 연봉</span><b>${money(C.earn)}</b><i class="small muted">맡은 구단 ${Math.max(1,S.teams)}곳</i></div>
    </div>${chT}
    <p class="small muted">계약 마지막 해 시즌이 끝나면 구단주가 재계약 여부를 정합니다(구단주 신뢰 45 이상이면 제안). 명성 58 이상이면 그때 다른 구단 제의도 올 수 있습니다. 경질되면 남은 기간 연봉은 구단이 정산합니다.</p>
    ${C.stints.length?`<details><summary class="small">지난 계약 ${C.stints.length}건</summary>${C.stints.map(stint).join('')}</details>`:''}</section>${gmProfileView()}`; }

/* 단장 프로필: 행동으로 쌓인 스타일, 행동 기록, 트레이드 성적, 시즌별 팀 성적 */
function gmProfileView(){ const s=meStats(), M=s.M, T=s.T; const tags=meTags(); const nick=meNick();
  const tg=tags.length?`<div class="chips">${tags.map(x=>`<span class="pill ${x.k==='trl'||x.k==='quiet'||x.k==='mgrF'?'warn':'acc'}" title="${esc(x.d)}">${esc(x.l)}</span>`).join('')}</div><ul class="small muted gmpl">${tags.map(x=>`<li><b>${esc(x.l)}</b> · ${esc(x.d)}</li>`).join('')}</ul>`:'<p class="small muted">아직 뚜렷한 스타일이 없습니다. 트레이드·언론 플레이·인터뷰·FA·감독 교체 같은 행동이 쌓이면 스타일과 별명이 붙습니다.</p>';
  const st=(l,v,sub)=>`<div><span class="muted">${l}</span><b>${v}</b>${sub?`<i class="small muted">${sub}</i>`:''}</div>`;
  const grid=`<div class="gmc-grid">${st('트레이드',`${T.n}건`,T.n?`WAR 차 ${T.net>=0?'+':''}${T.net.toFixed(1)}`:'')}${st('언론 플레이',`${M.pp||0}회`,'')}${st('인터뷰',`${M.iv||0}회`,`거절 ${M.ivSkip||0}`)}${st('외부 FA 영입',`${M.fa||0}명`,M.faBig?`대형 ${M.faBig}건`:'')}${st('감독 경질',`${M.mgrFire||0}회`,'')}${st('외국인 시즌 중 교체',`${M.fRep||0}회`,'')}</div>`;
  const tr=(G.trades||[]).filter(t=>t.gi).slice().reverse().slice(0,8).map(t=>{ const r=tradeReport(t); return `<div class="trr"><div><b>${t.y} · ${badge(t.with,14)} ${esc(tshort(t.with))}</b><span>받음 ${esc(t.get.join(', ')||'-')} · 보냄 ${esc(t.give.join(', ')||'-')}</span></div>${r?`<span class="trw ${r.net>=.5?'up':r.net<=-.5?'dn':''}">${r.net>=0?'+':''}${r.net.toFixed(1)} WAR</span>`:''}</div>`; }).join('');
  const seas=(G.myC&&G.myC.seas||[]).slice().reverse().slice(0,12).map(x=>`<div class="row between small"><span>${x.y} · ${badge(x.tid,14)} ${esc(tshort(x.tid))}</span><span>${x.w}승 ${x.l}패 · ${x.rank}위${x.ch===1?' · <b class="good">우승</b>':x.ch===2?' · 준우승':''}</span></div>`).join('');
  return `<section class="card gmcard"><div class="row between"><h2 class="sec">단장 프로필</h2>${nick?`<span class="small muted">언론이 부르는 별명: <b>${esc(nick)}</b></span>`:''}</div>
    <div class="eyebrow">스타일</div>${tg}
    <div class="eyebrow" style="margin-top:8px">행동 기록</div>${grid}
    <details class="mfold"><summary>트레이드 성적(받은 선수 − 보낸 선수, 이후 WAR)</summary>${tr||'<p class="small muted">아직 트레이드가 없습니다.</p>'}${T.best&&T.n>1?`<p class="small">최고: ${T.best.t.y} ${esc(tshort(T.best.t.with))} (${T.best.r.net>=0?'+':''}${T.best.r.net.toFixed(1)}) · 최악: ${T.worst.t.y} ${esc(tshort(T.worst.t.with))} (${T.worst.r.net.toFixed(1)})</p>`:''}</details>
    <details class="mfold"><summary>시즌별 팀 성적</summary>${seas||'<p class="small muted">아직 마친 시즌이 없습니다.</p>'}</details></section>`; }
