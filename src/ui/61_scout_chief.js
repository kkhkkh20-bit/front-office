/* 스카우트팀장 배치 제안 상자: 시기에 맞는 배치안, 한 번에 적용, 계속 맡기기 */
function scoutChiefBox(){ const c=scoutChief(); if(!c)return ''; const P=scoutPlan(); const mv=P.filter(x=>x.move); const sea=scoutDraftSea()?'드래프트 시즌(3월~신인 드래프트): 아마추어 관찰이 먼저입니다.':'외국인·FA 시즌(드래프트 뒤~2월): 해외와 프로 담당이 먼저입니다.';
  return `<div class="schief"><div class="row between"><b>스카우트팀장 ${esc(c.name)} ${'★'.repeat(effSkill(c))}</b><label class="small schief-auto"><input type="checkbox" data-a="scoutAuto" ${G.scoutAuto?'checked':''}> 팀장에게 맡기기(매달 1일 배치)</label></div>
    <p class="small">${sea}</p>
    ${mv.length?`<ul class="small">${mv.map(x=>`<li>${esc(x.s.name)}: ${esc(scoutSlotTxt(x.s.role||'am',x.s.region))} → <b>${esc(scoutSlotTxt(x.role,x.key))}</b> <span class="muted">${esc(x.why)}</span></li>`).join('')}</ul><button class="btn small primary" data-a="scoutPlanGo">제안대로 배치(${mv.length}명)</button> <span class="small muted">바꾼 스카우트는 30일 적응 기간</span>`:'<p class="small muted">지금 배치가 팀장 생각과 같습니다.</p>'}</div>`; }
Object.assign(A,{ scoutPlanGo(){ const n=scoutPlanApply(false); UI.toast&&0; save(); render(); }, scoutAuto(v,el){ G.scoutAuto=!G.scoutAuto; if(G.scoutAuto)scoutPlanApply(true); save(); render(); } });
