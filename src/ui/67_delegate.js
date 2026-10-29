/* ---------- 권한 탭(비서와 단장) · 알림의 '비서에게 넘기기' 버튼 · 협상 추천 조건 ---------- */
function authView(){ const evK=Object.keys(EV_NAME); const dl=evK.filter(k=>G.deleg&&G.deleg[k]);
  const row=([k,l,d])=>{ const on=autoOn(k); return `<div class="item authi"><div><b>${l}</b> <span class="pill ${on?'acc':''}">${on?`${AUTO_WHO[k]||'비서'} 담당`:'단장 직접'}</span><span class="small muted" style="display:block">${d}</span></div><button class="btn small ${on?'':'primary'}" data-a="${on?'takeBack':'handOff'}" data-v="${k}">${on?'가져오기':'넘기기'}</button></div>`; };
  return `<section class="card"><div class="row between"><h2 class="sec">권한: 비서와 단장</h2><span class="small muted">${AUTO_AREAS.filter(([k])=>autoOn(k)).length}/${AUTO_AREAS.length} 넘김</span></div>
    <p class="small">모든 알림은 그대로 옵니다. 알림마다 있는 '비서에게 넘기기'를 누르면 그 업무를 비서·팀장이 맡고, 여기서 언제든 다시 가져올 수 있습니다. 넘기면 무난하게 처리하고, 직접 하면 더 좋은 결과를 낼 수 있습니다. 드래프트·트레이드 협상·FA·외국인 영입·단장 계약·협회 표결은 항상 단장이 합니다.</p>
    <div class="list">${AUTO_AREAS.map(row).join('')}</div></section>
    ${dl.length&&!autoOn('ev')?`<section class="card"><h2 class="sec">종류별로 넘긴 일상 결정</h2><div class="list">${dl.map(k=>`<div class="item authi"><b>${esc(EV_NAME[k])}</b><button class="btn small" data-a="evTake" data-v="${k}">가져오기</button></div>`).join('')}</div></section>`:''}
    ${(G.autoLog||[]).length?`<section class="card"><h2 class="sec">비서가 처리한 일</h2><div class="list">${G.autoLog.slice(0,12).map(x=>`<div class="item"><span class="small"><b>${esc(x.t)}</b> · ${esc(x.c)}${x.r?` <span class="muted">${esc(String(x.r).slice(0,80))}</span>`:''}</span><span class="small muted">${dsh(x.d)}</span></div>`).join('')}</div></section>`:''}`; }
/* 메일 아래 버튼: 이 알림이 속한 업무를 비서에게 넘긴다(아직 직접 하는 업무만) */
function handOffBtns(m){ if(G.unemp)return ''; let h='';
  if(m.kind==='결정'){ const e=(G.evs||[]).find(x=>x.mid===m.id&&!x.done); if(e)h+=`<button class="btn small" data-a="evHand" data-v="${e.id}">비서에게 넘기기(이번 건)</button>`; }
  for(const k of (m.auto||[])){ if(autoOn(k))continue; if(k==='tro'&&m.oid&&!(G.offers||[]).some(o=>o.id===m.oid))continue; const a=AUTO_AREAS.find(x=>x[0]===k); if(a)h+=`<button class="btn small" data-a="handOff" data-v="${k}">${a[1]}: ${AUTO_WHO[k]||'비서'}에게 넘기기</button>`; }
  return h?`<div class="ibm-acts hand">${h}</div>`:''; }
Object.assign(A,{ handOff(v){ toast(handOff(v)); save(); render(); }, takeBack(v){ toast(takeBack(v)); save(); render(); },
  evHand(v){ toast(handOffEv(v)); save(); render(); }, evTake(v){ if(G.deleg)delete G.deleg[v]; save(); render(); },
  foRec(v){ const F=UI.fo; const p=G.players[+v]; if(!F||!p)return; if(F.re){ const t=foReFloor(p), f=foReComfort(p); F.g=Math.max(MIN_SAL,Math.ceil((t/f-F.i*FO_INC_W)/USD)*USD); F.msg='사인 가능한 최소 보장액으로 맞췄습니다.'; renderSheet(); return; }
    const me=foAppeal(p,G.user), Rv=foRivals(p), best=Rv[0]; const known=!!p.fneg||!best; const cap=foCap(p);
    if(!known){ F.g=Math.min(cap,Math.round(p.ask*.85/USD)*USD); F.i=Math.max(0,Math.min(cap-F.g,p.ask-F.g)); F.msg='경쟁 구단 조건을 아직 모릅니다. 요구액 기준(보장 85% + 인센티브 15%)으로 맞췄습니다. 한 번 제안하면 정확한 조건을 알려 줍니다.'; renderSheet(); return; }
    const tgt=Math.max(foFloor(p),best?best.v*1.01:0); let g=foNeedG(p,F.i,tgt,me.f); if(g==null){ F.i=0; g=foNeedG(p,0,tgt,me.f); }
    if(g==null){ F.msg='상한 안에서는 사인시킬 수 있는 조건이 없습니다.'; } else { F.g=g; F.msg='사인 가능한 최소 보장액으로 맞췄습니다.'; } renderSheet(); } });
