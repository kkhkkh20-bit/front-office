/* ---------- 업무 맡기기 설정 · 새 게임 업무 방식 · 협상 추천 조건 ---------- */
function autoCard(){ const on=k=>autoOn(k); const n=AUTO_AREAS.filter(([k])=>on(k)).length;
  return `<section class="card"><div class="row between"><h2 class="sec">업무 맡기기</h2><span class="small muted">${n}/${AUTO_AREAS.length} 맡김</span></div>
    <p class="small">반복 업무를 비서·팀장에게 맡길 수 있습니다. 맡기면 무난하게 처리하고, 직접 하면 더 좋은 결과를 낼 수 있습니다. 큰 결정(드래프트·트레이드 협상·FA·외국인 영입·단장 계약·협회 표결)은 항상 직접 합니다.</p>
    <div class="row" style="gap:6px;margin:6px 0"><button class="btn small" data-a="autoAllSet" data-v="1">모두 맡기기(입문)</button><button class="btn small" data-a="autoAllSet" data-v="0">모두 직접</button></div>
    <div class="list">${AUTO_AREAS.map(([k,l,d])=>`<label class="item autoi"><input type="checkbox" data-a="autoTog" data-v="${k}" ${on(k)?'checked':''}><span><b>${l}</b><span class="small muted" style="display:block">${d}</span></span></label>`).join('')}</div></section>`; }
Object.assign(A,{ autoTog(v){ autoSet(v,!autoOn(v)); save(); render(); }, autoAllSet(v){ autoAll(v==='1'); save(); render(); toast(v==='1'?'반복 업무를 모두 맡겼습니다.':'모든 업무를 직접 합니다.'); },
  easyPick(v){ UI.easyPick=v==='1'; render(); },
  foRec(v){ const F=UI.fo; const p=G.players[+v]; if(!F||!p)return; if(F.re){ const t=foReFloor(p), f=foReComfort(p); F.g=Math.max(MIN_SAL,Math.ceil((t/f-F.i*FO_INC_W)/USD)*USD); F.msg='사인 가능한 최소 보장액으로 맞췄습니다.'; renderSheet(); return; }
    const me=foAppeal(p,G.user), Rv=foRivals(p), best=Rv[0]; const known=!!p.fneg||!best; const cap=foCap(p);
    if(!known){ F.g=Math.min(cap,Math.round(p.ask*.85/USD)*USD); F.i=Math.max(0,Math.min(cap-F.g,p.ask-F.g)); F.msg='경쟁 구단 조건을 아직 모릅니다. 요구액 기준(보장 85% + 인센티브 15%)으로 맞췄습니다. 한 번 제안하면 정확한 조건을 알려 줍니다.'; renderSheet(); return; }
    const tgt=Math.max(foFloor(p),best?best.v*1.01:0); let g=foNeedG(p,F.i,tgt,me.f); if(g==null){ F.i=0; g=foNeedG(p,0,tgt,me.f); }
    if(g==null){ F.msg='상한 안에서는 사인시킬 수 있는 조건이 없습니다.'; } else { F.g=g; F.msg='사인 가능한 최소 보장액으로 맞췄습니다.'; } renderSheet(); } });
/* 새 게임 구단 선택 화면 위: 업무 방식 */
const _pickTeams0=pickTeams;
pickTeams=function(){ const e=UI.easyPick!==false; return `<div class="card easyp"><b>업무 방식</b><div class="chips"><button data-a="easyPick" data-v="1" class="${e?'on':''}">입문: 반복 업무는 비서에게</button><button data-a="easyPick" data-v="0" class="${e?'':'on'}">직접: 모든 업무를 내가</button></div><p class="small muted">연봉 협상·외국인 재계약·일상 결정·감독 요청·스카우트 배치·받은 트레이드 제안·스태프 빼가기 대응을 맡길지 정합니다. 게임 중에도 구단 > 설정에서 하나씩 바꿀 수 있습니다.</p></div>`+_pickTeams0.apply(this,arguments); };
