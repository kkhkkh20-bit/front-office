/* ---------- 스폰서 화면 ---------- */
function sponView(){ sponInit(); const S=G.spon, t=team(G.user); const y=sponSeason(); const v=sponVal();
  const parts=sponValParts().filter(x=>Math.abs(x[1])>=.005).map(([l,d])=>`<span class="pill ${d>0?'good':'bad'}">${l} ${d>0?'+':''}${Math.round(d*100)}</span>`).join('');
  const slots=Object.keys(SPON_SLOT).filter(k=>!SPON_SLOT[k].indie||t.indie);
  const row=k=>{ const c=S.c[k]; const live=c&&c.until>=y; const nOff=S.off.filter(x=>x.slot===k).length;
    return `<tr><td><b>${SPON_SLOT[k].l}</b><div class="small muted">기준 ${money(Math.round(SPON_SLOT[k].b*v))}</div></td>${live?`<td>${esc(c.co)} <span class="small muted">${esc(c.ind)}</span>${c.img?' <span class="pill warn" title="언론 논조가 30 밑이면 다음 해 20% 감액">이미지 조항</span>':''}</td><td class="num">${money(c.amt)}</td><td>${c.until}년까지${c.until===y?' <span class="pill warn">올해 만료</span>':''}</td><td class="small">${c.ps?`가을야구 +${money(c.ps)}`:''}${c.champ?`<br>우승 +${money(c.champ)}`:''}</td>`:`<td colspan="4" class="muted">빈자리${nOff?` · 제안 ${nOff}건 도착`:''} ${(S.pitch||[]).some(x=>x.slot===k&&!x.done)?'<span class="pill">영업 중</span>':`<button class="btn small" data-a="sponPitch" data-v="${k}">영업 지시 · 3천만</button>`}</td>`}</tr>`; };
  const tot=sponIncome(y);
  const offers=S.off.slice().sort((a,b)=>a.slot.localeCompare(b.slot)||b.amt-a.amt);
  const card=o=>{ const cur=S.c[o.slot]; const tag={bonus:'성과형',safe:'안정형',long:'장기형',std:'표준'}[o.style];
    return `<div class="spo"><div class="row between"><b>${esc(o.co)} <span class="small muted">${esc(o.ind)}</span></b><span class="pill">${tag}</span></div>
      <div class="small">${SPON_SLOT[o.slot].l}${o.renew?' · 재계약 제안':''}${cur&&cur.until>=y?' · <span class="warn">계약 중인 자리</span>':''}</div>
      <div class="spo-n"><span><i>연 금액</i><b class="num">${money(o.amt)}</b></span><span><i>기간</i><b>${o.yrs}년</b></span><span><i>가을야구</i><b class="num">+${money(o.ps)}</b></span><span><i>우승</i><b class="num">+${money(o.champ)}</b></span></div>
      ${o.img?'<div class="small warn">이미지 조항: 언론 논조가 30 밑으로 떨어지면 다음 해 금액 20% 감액</div>':''}
      <div class="small muted">${o.exp-G.day}일 안에 답해야 합니다.</div>
      <div class="row"><button class="btn primary small" data-a="sponAcc" data-v="${o.id}">수락</button>${o.cnt?'':`<button class="btn small" data-a="sponCnt" data-v="${o.id}:0.1">10% 올려 요청</button><button class="btn small" data-a="sponCnt" data-v="${o.id}:0.2">20% 올려 요청</button>`}<button class="btn small" data-a="sponRej" data-v="${o.id}">거절</button></div></div>`; };
  return csec(`스폰서 · ${y} 시즌`,`<div class="spo-top"><div><i>스폰서 수입(기본)</i><b class="num">${money(tot)}</b></div><div><i>구단 가치 지수</i><b class="num">${Math.round(v*100)}</b></div><div><i>제안 대기</i><b class="num">${S.off.length}건</b></div></div>
    <div class="chips">${parts||'<span class="small muted">평균 수준</span>'}</div>
    <p class="small muted">빈자리는 기업 제안을 기다리거나, 마케팅팀에 영업을 지시해 먼저 찾아갈 수 있습니다(성공률은 가치 지수와 단장 평판에 따라 다름). 가치 지수 100이 리그 평균입니다. 시장 규모·구단 인기·지난 시즌 성적·팬 여론·언론 논조·스타 선수가 제안 금액을 정합니다. 경쟁 제안이 많고 가치가 높을수록 조건 상향 요청이 잘 통합니다.</p>
    <div class="tw"><table class="spt"><thead><tr><th>자리</th><th>스폰서</th><th>연 금액</th><th>기간</th><th>보너스</th></tr></thead><tbody>${slots.map(row).join('')}</tbody></table></div>`)
   +csec(`받은 제안 ${offers.length}건`,offers.length?`<div class="spo-l">${offers.map(card).join('')}</div>`:'<p class="small muted">지금 받은 제안이 없습니다.</p>')
   +(S.hist.length?csec('지난 계약',`<div class="log">${S.hist.slice().reverse().slice(0,12).map(h=>`<p><span class="ticker">${h.y0}~${h.until}</span> ${esc(h.co)} · ${SPON_SLOT[h.slot].l} · 연 ${money(h.amt)}</p>`).join('')}</div>`):''); }
