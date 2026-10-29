/* ---------- 단장 카드: 나도 리그의 한 사람. 계약·통산 성적·경력 ---------- */
function gmCardView(){ if(G.unemp)return ''; const C=myCInit(); if(!C)return ''; const S=myCStats(); const left=C.y1-G.year;
  const stint=x=>`<div class="row between small"><span>${badge(x.tid,18)} ${esc(tshort(x.tid))} · ${x.y0}~${x.y1}</span><span class="muted">${money(x.sal)} · ${esc(x.how)}</span></div>`;
  const chT=S.chT.length?`<div class="small">우승한 구단: ${S.chT.map(t=>`${badge(t,16)} ${esc(tshort(t))}`).join(' · ')}</div>`:'';
  return `<section class="card gmcard"><div class="row between"><div><div class="eyebrow">단장 카드</div><h2 class="sec">${esc(tname(C.tid))} 단장</h2></div>${badge(C.tid,44)}</div>
    <div class="gmc-grid">
      <div><span class="muted">연봉</span><b>${money(C.sal)}</b></div>
      <div><span class="muted">계약</span><b>${C.y0}~${C.y1}</b><i class="small ${left<=0?'warn':'muted'}">${left<=0?'올해 만료':`${left}년 남음`}</i></div>
      <div><span class="muted">명성</span><b>${G.rep??50}</b><i class="small muted">${esc(repLabel(G.rep??50))}</i></div>
      <div><span class="muted">통산</span><b>${S.n}시즌</b><i class="small muted">${S.w}승 ${S.l}패 · 승률 ${fmt3(S.pct)}</i></div>
      <div><span class="muted">우승</span><b>${S.ch}회</b><i class="small muted">준우승 ${S.ru} · 가을야구 ${S.ps}</i></div>
      <div><span class="muted">통산 연봉</span><b>${money(C.earn)}</b><i class="small muted">맡은 구단 ${Math.max(1,S.teams)}곳</i></div>
    </div>${chT}
    <p class="small muted">계약 마지막 해 시즌이 끝나면 구단주가 재계약 여부를 정합니다(구단주 신뢰 45 이상이면 제안). 명성 58 이상이면 그때 다른 구단 제의도 올 수 있습니다. 경질되면 남은 기간 연봉은 구단이 정산합니다.</p>
    ${C.stints.length?`<details><summary class="small">지난 계약 ${C.stints.length}건</summary>${C.stints.map(stint).join('')}</details>`:''}</section>`; }
