/* Contract drafts use integer millions of won; 0.01억 is exactly one unit. */
function contractMoneyInput(scope,field,label,value,foreign=false){
  const id=`money-${scope}-${field}`;
  return `<span class="money-edit"><span class="money-box"><input id="${id}" class="num" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${(value/100).toFixed(2)}" data-money="${scope}:${field}" aria-label="${label} (억 원)" aria-describedby="${id}-hint ${id}-error" aria-invalid="false"><span>억 원</span></span><span id="${id}-hint" class="small muted">${foreign?`<output data-money-convert="${field}">${usdT(value)}</output> · `:''}0.01억 = 100만원</span><span id="${id}-error" class="money-error small" aria-live="polite"></span></span>`;
}
function contractMoneyRead(text,min,max=Number.MAX_SAFE_INTEGER/16){
  const raw=String(text).trim().replace(/,/g,'');
  if(!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(raw))return {error:'금액을 소수점 둘째 자리까지 입력하세요.'};
  const value=Math.round(Number(raw)*100);
  if(!Number.isSafeInteger(value)||value>max)return {error:'입력할 수 있는 금액을 넘었습니다.'};
  if(value<min)return {error:`최소 ${money(min)}부터 입력하세요.`};
  return {value};
}
/* 제출 직전: 화면의 모든 금액 칸을 함께 읽어 검증하고 그대로 계약안에 쓴다.
   한 칸이 상한 때문에 거절된 뒤 다른 칸을 낮춰 둘 다 유효해져도, 거절됐던 칸의 옛 값이 제안에 남지 않게(검수 11-17 P1) */
function contractMoneyValid(){
  const scopes=[...new Set([...document.querySelectorAll('[data-money]')].map(el=>el.dataset.money.split(':')[0]))];let ok=true;
  for(const scope of scopes)if(!contractMoneyGroup(scope,null,false,true))ok=false;
  if(ok)return true;const invalid=[...document.querySelectorAll('[data-money]')].find(el=>!el.checkValidity());
  if(invalid){invalid.focus();invalid.reportValidity();}return false;
}
function contractMoneyDraft(scope){
  if(scope==='ngt')return UI.ngt?.T?{draft:UI.ngt.T,fields:['annual','bonus','opt']}:null;
  const draft=UI.fo,p=draft&&G.players[draft.id];if(!p)return null;
  const top=draft.re&&Number.isFinite(p.newSal)?Math.round(p.newSal*2):foSlotRun(p,()=>foCap(p)); /* 재계약 기준액이 없으면 NaN 상한으로 검증이 통째로 빠졌다 */
  return {draft,fields:['g','i'],top};
}
/* 한 범위(ngt·fo)의 금액 칸을 모두 같이 읽는다. 외국인은 보장+인센티브 합계가 상한 안이어야 해서,
   상대 칸은 저장된 값이 아니라 지금 화면에 적힌 값으로 비교하고, 모든 칸이 유효할 때만 함께 반영한다 */
function contractMoneyGroup(scope,focus,preview=true,commit=true){
  const ctx=contractMoneyDraft(scope);if(!ctx)return true;const {draft,fields,top}=ctx;
  const els={};for(const f of fields){const el=document.querySelector(`[data-money="${scope}:${f}"]`);if(el)els[f]=el;}
  const raw={};for(const f in els){const r=contractMoneyRead(els[f].value,0);raw[f]=r.error?draft[f]||0:r.value;}
  const res={};
  for(const f in els){let min=0,max,over;
    if(scope==='ngt'){if(f==='annual')min=MIN_SAL;}
    else {min=f==='g'?MIN_SAL:0;const other=f==='g'?'i':'g';max=top-(raw[other]??draft[other]??0);over=`보장과 인센티브를 합쳐 ${usdT(top)}(${money(top)})까지입니다.`;}
    const r=contractMoneyRead(els[f].value,min,max);if(r.error&&over&&r.error==='입력할 수 있는 금액을 넘었습니다.'&&Number.isFinite(max))r.error=over;res[f]=r;
    els[f].setCustomValidity(r.error||'');els[f].setAttribute('aria-invalid',String(!!r.error));const error=document.getElementById(els[f].id+'-error');if(error)error.textContent=r.error||'';}
  const okAll=Object.values(res).every(r=>!r.error);
  if(!commit)return focus?!res[focus]?.error:okAll;
  /* 연봉·계약금·옵션은 서로 묶인 상한이 없어 유효한 칸만 반영, 외국인 보장·인센티브는 둘 다 유효할 때만 */
  let changed=false;for(const f in res){if(res[f].error||(scope==='fo'&&!okAll))continue;if(draft[f]!==res[f].value){draft[f]=res[f].value;changed=true;}}
  if(changed){if(scope==='ngt'){UI.ngt.ed=true;UI.ngt.kept=false;}else draft.msg='';}
  if(preview&&changed)contractMoneyPreview(scope);
  return focus?!res[focus]?.error:okAll;
}
function contractMoneyEdit(el,preview=true,commit=true){
  const [scope,field]=el.dataset.money.split(':');if(!contractMoneyDraft(scope))return false;return contractMoneyGroup(scope,field,preview,commit);
}
/* Replace calculated sections only: typing and Tab must keep their native focus. */
function contractMoneyPreview(scope){
  const host=document.querySelector(scope==='ngt'?'.sheet.ngt':'.negw .fo');if(!host)return;
  const template=document.createElement('template');template.innerHTML=scope==='ngt'?ngtSheet():(UI.fo.re?foRePanel(G.players[UI.fo.id]):foPanel(G.players[UI.fo.id]));
  const replace=selector=>{const old=host.querySelector(selector),next=template.content.querySelector(selector);if(old&&next)old.replaceWith(next);};
  if(scope==='ngt'){
    replace('.ng-sum');replace('.ng-tot');const fresh=[...template.content.querySelectorAll('.ngr')];host.querySelectorAll('.ngr').forEach((row,i)=>{if(!fresh[i])return;row.className=fresh[i].className;const old=row.querySelector('.ngd'),next=fresh[i].querySelector('.ngd');if(old&&next)old.replaceWith(next);});
    host.querySelectorAll('[data-ngr]').forEach(el=>{const v=UI.ngt.T[el.dataset.ngr];el.max=Math.max(+el.max,v);el.value=v;});
  }else {
    for(const selector of ['.fo-total','.fo-cmp','.fo-error'])replace(selector);
    host.querySelectorAll('[data-money-convert]').forEach(el=>el.textContent=usdT(UI.fo[el.dataset.moneyConvert]));
    const next=template.content.querySelector('[data-a="foGo"]'),old=host.querySelector('[data-a="foGo"]');if(old&&next)old.disabled=next.disabled;
  }
}
document.addEventListener('input',e=>{const el=e.target.closest('[data-money]');if(el)contractMoneyEdit(el);});
document.addEventListener('focusout',e=>{const el=e.target.closest('[data-money]');if(el&&contractMoneyEdit(el,false))el.value=(contractMoneyRead(el.value,0).value/100).toFixed(2);});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'||!e.target.matches('[data-money]'))return;e.preventDefault();if(contractMoneyEdit(e.target))e.target.blur();else e.target.reportValidity();});
