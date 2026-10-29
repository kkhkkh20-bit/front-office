/* ---------- 구단 > 언론·여론: 언론사와 기자, 친분 쌓기, 언론 플레이 ---------- */
function pressCards(){ if(G.unemp)return ''; const L=pressInit(); const c=G.repc||{};
  const rep=r=>{ const cc=c[r.id]||{}; const callOk=!(cc.call!=null&&cc.call>G.day-14), mealOk=!(cc.meal!=null&&cc.meal>G.day-30);
    return `<div class="prrep"><div><b>${esc(r.name)}</b> <span class="small muted">${PR_STYLE[r.style].l} · ${esc(r.field)} · 영향력 ${'★'.repeat(r.inf)}</span><span class="small" style="display:block">친분 <b>${r.rel}</b>${r.rel>=PP_MIN_REL?' · 언론 플레이 가능':''}${r.last?` <span class="muted">(${esc(r.last.why)} ${r.last.dv>0?'+':''}${r.last.dv})</span>`:''}</span></div>
      <div class="row" style="gap:4px;flex:none"><button class="btn small" data-a="repCall" data-v="${r.id}" ${callOk?'':'disabled'}>전화</button><button class="btn small" data-a="repMeal" data-v="${r.id}" ${mealOk?'':'disabled'}>식사</button></div></div>`; };
  const outs=Object.keys(OUTLET_DEF).map(n=>{ const O=OUTLET_DEF[n]; return `<div class="prout"><div class="row between"><b>${esc(n)}</b><span class="small muted">${OUTLET_LEAN[O.lean]} · ${esc(O.field)} · 영향력 ${'★'.repeat(O.reach)}</span></div><p class="small muted">${esc(O.d)}</p>${L.filter(r=>r.outlet===n).map(rep).join('')}</div>`; }).join('');
  const ok=L.filter(r=>r.rel>=PP_MIN_REL); const S=UI.pp||(UI.pp={k:'sign',rep:ok[0]?ok[0].id:'',pid:''}); const T=ppTargets(); const ready=ppReady();
  const pl=(G.pledges||[]).slice(0,5).map(g=>{ const p=g.pid!=null?G.players[g.pid]:null; const st=g.done?(g.ok?'<span class="pill good">지킴</span>':'<span class="pill bad">못 지킴</span>'):`<span class="pill">${dmd(g.until)}까지</span>`; return `<div class="row between small"><span>${g.k==='sign'?`영입 의지: ${p?esc(p.name):'-'}`:'투자 선언'}</span>${st}</div>`; }).join('');
  const play=`<p class="small">친분 ${PP_MIN_REL} 이상인 기자를 통해 단장의 메시지를 기사로 낼 수 있습니다. 30일에 한 번. 기자의 성향과 친분, 언론사 논조에 따라 호의적으로 실리기도, 비꼬듯 실리기도 합니다.</p>
    ${ok.length?`<div class="ppf"><label class="small">기자<select data-a="ppRep">${ok.map(r=>`<option value="${r.id}" ${S.rep===r.id?'selected':''}>${esc(r.outlet)} ${esc(r.name)} (친분 ${r.rel})</option>`).join('')}</select></label>
      <div class="chips"><button data-a="ppK" data-v="sign" class="${S.k==='sign'?'on':''}">"○○를 데려오겠다"</button><button data-a="ppK" data-v="invest" class="${S.k==='invest'?'on':''}">"올해 투자하겠다"</button></div>
      ${S.k==='sign'?`<label class="small">선수<select data-a="ppPid"><option value="">고르세요</option>${T.map(p=>`<option value="${p.id}" ${String(S.pid)===String(p.id)?'selected':''}>${esc(p.name)} · ${posLabel(p)} · ${p.team!=null?esc(tshort(p.team)):'FA'}</option>`).join('')}</select></label>
        <p class="small muted">팬 기대가 오르고, 지목된 선수가 우리에게 호감을 갖습니다(FA 때 유리). 다른 구단 소속이면 그 구단 단장이 불쾌해하고 트레이드 값을 더 부릅니다. 기한 안에 못 데려오면 팬과 언론이 돌아섭니다.</p>`
        :`<p class="small muted">팬 여론이 오르지만 구단주가 지적할 수 있습니다(수익형 구단주는 신뢰 -4). 다음 개막까지 연봉 규모를 5% 이상 늘리지 못하면 팬이 실망하고 구단주 신뢰도 깎입니다.</p>`}
      <button class="btn primary block" data-a="ppGo" ${ready?'':'disabled'}>${ready?'기사 내기':`${dmd(G.ppLast+PP_COOL)}부터 가능`}</button></div>`:`<p class="small muted">아직 친분 ${PP_MIN_REL} 이상인 기자가 없습니다. 위에서 전화·식사로 먼저 가까워지세요.</p>`}
    ${UI.ppMsg?`<div class="note">${esc(UI.ppMsg)}</div>`:''}${pl?`<div class="list" style="margin-top:6px">${pl}</div>`:''}`;
  return csec('언론사와 기자',`<p class="small muted">기사는 언론사 소속 기자 이름으로 나갑니다. 비판적인 매체는 나쁜 소식을, 우호적인 매체는 좋은 소식을 더 크게 키웁니다. 전화(2주에 한 번)와 식사(한 달에 한 번, 1천만 원)로 기자와 가까워질 수 있습니다.</p>${outs}`)+csec('언론 플레이',play); }
Object.assign(A,{ repCall(v){ toast(repContact(v,'call')); save(); render(); }, repMeal(v){ toast(repContact(v,'meal')); save(); render(); },
  ppK(v){ UI.pp=UI.pp||{}; UI.pp.k=v; UI.ppMsg=''; render(); },
  ppGo(){ const S=UI.pp||{}; if(S.k==='sign'&&!S.pid){ UI.ppMsg='데려오겠다고 밝힐 선수를 고르세요.'; render(); return; } UI.ppMsg=pressPlay(S.rep,S.k,+S.pid); save(); render(); } });
