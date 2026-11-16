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
function contractMoneyValid(){
  const fields=[...document.querySelectorAll('[data-money]')];
  for(const el of fields)contractMoneyEdit(el,false,false);
  const invalid=fields.find(el=>!el.checkValidity());
  if(invalid){invalid.focus();invalid.reportValidity();return false;}return true;
}
function contractMoneyEdit(el,preview=true,commit=true){
  const [scope,field]=el.dataset.money.split(':');let draft,min=0,max;
  if(scope==='ngt'){draft=UI.ngt?.T;if(!['annual','bonus','opt'].includes(field))return;if(field==='annual')min=MIN_SAL;}
  else {draft=UI.fo;if(!['g','i'].includes(field)||!draft)return;const p=G.players[draft.id];if(!p)return;min=field==='g'?MIN_SAL:0;const top=draft.re&&Number.isFinite(p.newSal)?Math.round(p.newSal*2):foCap(p);max=top-(draft[field==='g'?'i':'g']||0);} /* 재계약 기준액이 없으면 NaN 상한으로 검증이 통째로 빠졌다 */
  if(!draft)return;const result=contractMoneyRead(el.value,min,max);
  el.setCustomValidity(result.error||'');el.setAttribute('aria-invalid',String(!!result.error));const error=document.getElementById(el.id+'-error');if(error)error.textContent=result.error||'';
  if(result.error)return false;
  if(!commit)return true;draft[field]=result.value;
  if(scope==='ngt'){UI.ngt.ed=true;UI.ngt.kept=false;}else draft.msg='';
  if(preview)contractMoneyPreview(scope);return true;
}
/* Replace calculated sections only: typing and Tab must keep their native focus. */
function contractMoneyPreview(scope){
  const host=document.querySelector(scope==='ngt'?'.sheet.ngt':'.negw .fo');if(!host)return;
  const template=document.createElement('template');template.innerHTML=scope==='ngt'?ngtSheet():(UI.fo.re?foRePanel(G.players[UI.fo.id]):foPanel(G.players[UI.fo.id]));
  const replace=selector=>{const old=host.querySelector(selector),next=template.content.querySelector(selector);if(old&&next)old.replaceWith(next);};
  if(scope==='ngt'){
    replace('.ng-sum');const fresh=[...template.content.querySelectorAll('.ngr')];host.querySelectorAll('.ngr').forEach((row,i)=>{if(!fresh[i])return;row.className=fresh[i].className;const old=row.querySelector('.ngd'),next=fresh[i].querySelector('.ngd');if(old&&next)old.replaceWith(next);});
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
