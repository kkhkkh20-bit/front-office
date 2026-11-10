/* 읽고 있는 목록 안에서만 이동한다. 편집·결재·중계의 방향키는 그대로 둔다. */
function contextNavigationKey(e){
  if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
  if(!G||UI.title||UI.advRun||UI.cfm||UI.cast||G.live||UI.matchPreview||UI.menu||UI.fmKeys||UI.game!=null||UI.posSheet||UI.wkres||UI.cer||UI.ivSh||UI.cmpSh||UI.ngt||UI.negWin)return;
  const target=e.target;
  if(target?.closest?.('input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="spinbutton"],[role="combobox"],[role="listbox"],[role="tablist"],summary,video,audio'))return;
  if([...document.querySelectorAll('[aria-modal="true"],[role="dialog"],[role="alertdialog"]')].some(el=>el.getClientRects().length))return;
  const vertical=e.key==='ArrowUp'||e.key==='ArrowDown';
  if(vertical){
    if(UI.tab!=='inbox'||UI.sheet!=null||UI.person||UI.meet||!document.querySelector('main.inbox-workspace'))return;
    e.preventDefault();e.stopImmediatePropagation();ibStep(e.key==='ArrowDown'?1:-1);return;
  }
  if(UI.meet||!document.documentElement.classList.contains('detail-page-open')||!document.querySelector('#sheet .ps-nav [data-a="peopleStep"]'))return;
  const info=peopleInfo(peopleCurrent());if(!info||info.L.length<2)return;
  e.preventDefault();e.stopImmediatePropagation();A.peopleStep(e.key==='ArrowRight'?1:-1);
}
if(typeof document!=='undefined')document.addEventListener('keydown',contextNavigationKey,true);
