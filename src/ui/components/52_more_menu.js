/* ---------- ⋯ 더보기 메뉴(UI 2단계 2-1) ----------
   부가 동작을 화면에서 걷어 내고 ⋯ 하나에 모은다. 휴대폰(700px 이하)은 바텀시트, PC는 버튼 아래(화면 아래쪽이면 위) 펼침.
   항목은 보통 버튼과 같은 data-a/data-v를 쓰므로 누르면 원래 동작이 그대로 실행된다(중복 터치 보호 UI._clk 포함).
   열고 닫기는 다시 그리지 않고 DOM만 바꾼다. 다시 그려지면 닫힌 상태로 돌아온다.
   items: [{a, v, l, s, title, on, danger, disabled}] (거짓 값은 건너뜀, s는 항목 아래 작은 설명). o: {label, cls, bcls(버튼 class, 기본 'btn small'), ico(버튼 안 그림)} */
const MM_DOTS='<svg class="mmenu-ico" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="4" cy="10" r="1.9"/><circle cx="10" cy="10" r="1.9"/><circle cx="16" cy="10" r="1.9"/></svg>';
const MM_CHEV='<svg class="mmenu-ico" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function moreMenu(items,o){ o=o||{}; const L=(items||[]).filter(Boolean); if(!L.length)return ''; const lab=o.label||'더보기';
  return `<span class="mmenu${o.cls?' '+o.cls:''}"><button type="button" class="${o.bcls||'btn small'} mmenu-b" data-mmenu aria-haspopup="menu" aria-expanded="false" aria-label="${esc(lab)}" title="${esc(lab)}">${o.ico||MM_DOTS}</button><span class="mmenu-p" role="menu" aria-label="${esc(lab)}" hidden><span class="mmenu-h" aria-hidden="true">${esc(lab)}</span>${L.map(it=>`<button type="button" role="menuitem" tabindex="-1" class="mmenu-i${it.on?' on':''}${it.danger?' danger':''}" data-a="${esc(it.a)}" data-v="${esc(String(it.v??''))}"${it.title?` title="${esc(it.title)}"`:''}${it.disabled?' disabled':''}>${it.s?`<span class="mmenu-t"><b>${esc(it.l)}</b><small>${esc(it.s)}</small></span>`:esc(it.l)}</button>`).join('')}</span></span>`; }
/* 대표 동작 1개 + 나머지는 ⋯. 항목이 하나뿐이면 메뉴 없이 그 버튼만 */
function actionBar(main,rest,o){ const R=(rest||[]).filter(Boolean); if(!main&&R.length===1){ main=R[0]; R.length=0; } if(!main&&!R.length)return '';
  const b=main?`<button class="btn small${main.plain?'':' primary'} act-main" data-a="${esc(main.a)}" data-v="${esc(String(main.v??''))}"${main.title?` title="${esc(main.title)}"`:''}>${esc(main.l)}</button>`:'';
  return b+moreMenu(R,o); }
let _mmSeq=0;
function mmOpenNow(){ return document.querySelector('.mmenu.open'); }
function mmClose(m,focus){ m=m||mmOpenNow(); if(!m)return; m.classList.remove('open','up','left'); const b=m.querySelector('.mmenu-b'), p=m.querySelector('.mmenu-p'); if(b)b.setAttribute('aria-expanded','false'); if(p)p.hidden=true; document.documentElement.classList.remove('mmenu-sheet-open'); if(focus&&b&&b.isConnected)b.focus({preventScroll:true}); }
function mmOpen(m){ const cur=mmOpenNow(); if(cur&&cur!==m)mmClose(cur); const b=m.querySelector('.mmenu-b'), p=m.querySelector('.mmenu-p'); if(!b||!p)return;
  if(!p.id)p.id='mmenu-'+(++_mmSeq); b.setAttribute('aria-controls',p.id);
  const r=b.getBoundingClientRect(); m.classList.toggle('up',r.top>innerHeight*.55); m.classList.toggle('left',r.left+r.width/2<innerWidth/2); /* 화면 아래쪽 버튼(PC 오른쪽 아래 행동 줄)은 위로, 왼쪽 버튼은 왼쪽 맞춤 */
  m.classList.add('open'); p.hidden=false; b.setAttribute('aria-expanded','true'); if(innerWidth<=700)document.documentElement.classList.add('mmenu-sheet-open');
  const f=p.querySelector('.mmenu-i:not([disabled])'); if(f)f.focus({preventScroll:true}); }
document.addEventListener('click',e=>{ const t=e.target; if(!t||!t.closest)return;
  const b=t.closest('[data-mmenu]'); if(b){ e.preventDefault(); const m=b.closest('.mmenu'); if(m.classList.contains('open'))mmClose(m,true); else mmOpen(m); return; }
  const it=t.closest('.mmenu-i'); if(it&&!it.disabled){ mmClose(it.closest('.mmenu')); return; } /* 항목 동작은 data-a 처리기가 실행한다 */
});
/* 바깥을 누르면 닫는다(그 누름은 원래 대상에도 그대로 간다). 바텀시트 바깥(어두운 바탕)은 닫기만 한다 */
window.addEventListener('pointerdown',e=>{ const m=mmOpenNow(); if(!m)return; if(e.target&&e.target.closest&&e.target.closest('.mmenu.open'))return;
  const sheet=m.querySelector('.mmenu-p'), st=sheet&&getComputedStyle(sheet).position==='fixed'; mmClose(m);
  if(st){ e.preventDefault(); const stop=ev=>{ ev.stopPropagation(); ev.preventDefault(); }; window.addEventListener('click',stop,{capture:true,once:true}); setTimeout(()=>window.removeEventListener('click',stop,{capture:true}),500); } },true);
/* Esc는 메뉴만 닫는다(선수 화면은 그대로). 화살표·Home·End로 항목 이동, Tab은 닫고 다음으로 */
window.addEventListener('keydown',e=>{ const m=mmOpenNow(); if(!m)return;
  if(e.key==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); mmClose(m,true); return; }
  const I=[...m.querySelectorAll('.mmenu-i:not([disabled])')]; if(!I.length)return; const k=I.indexOf(document.activeElement);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); e.stopImmediatePropagation(); const n=e.key==='ArrowDown'?(k+1)%I.length:(k<=0?I.length-1:k-1); I[n].focus({preventScroll:true}); return; }
  if(e.key==='Home'||e.key==='End'){ e.preventDefault(); e.stopImmediatePropagation(); I[e.key==='Home'?0:I.length-1].focus({preventScroll:true}); return; }
  if(e.key==='Tab'){ mmClose(m); return; }
  if((e.key===' '||e.key==='Enter')&&k>=0){ e.stopImmediatePropagation(); } /* 항목 위 스페이스바·Enter는 그 항목만 누른다(화면 전체 스페이스바 진행으로 넘기지 않음) */ },true);
