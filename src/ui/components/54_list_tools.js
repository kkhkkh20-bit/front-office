/* ---------- 목록 공통(UI 2단계 2-3·2-4): 줄 누르기와 필터 바 ----------
   줄 누르기: 줄 전체가 상세(보통 선수 화면)를 연다. 줄 안의 버튼·링크는 자기 동작이 먼저다(클릭 처리기가 가장 가까운 data-a를 고른다).
   키보드: 줄에 초점이 가고 Enter·Space로 연다. 줄마다 남기는 버튼은 그 목록의 대표 동작 하나만.
   필터 바: [검색][필터 n] 한 줄 + 고른 조건 칩(하나씩 지우기). 나머지 조건은 '필터'를 누르면 열리는 칸(PC 펼침, 휴대폰 바텀시트) 안에 둔다.
   조건 버튼은 화면이 쓰던 그대로(optRow의 opt, 화면별 data-a, select)라 UI 상태 이름과 저장된 값이 바뀌지 않는다. */
function rowTap(a,v,label){ return ` data-rowtap data-a="${esc(a)}" data-v="${esc(String(v??''))}" tabindex="0" role="button"${label?` aria-label="${esc(label)}"`:''}`; }
/* 줄 안의 선수 이름 버튼(pMini 등)은 줄과 같은 동작이면 겉모양만 남긴다: 버튼 안에 버튼이 겹치지 않게 */
function rowQuiet(html){ return String(html).replace(/^<button class="([^"]*)" data-a="player" data-v="[^"]*">([\s\S]*)<\/button>$/,'<span class="$1">$2</span>'); }
/* 줄 안에 대표 버튼(data-rowgo)이 있는 줄: 줄의 빈 곳을 눌러도 그 버튼을 누른 것과 같다. 키보드 초점은 그 버튼 하나(줄마다 한 번) */
function rowProxy(){ return ' data-rowtap="proxy"'; }
document.addEventListener('click',e=>{ const t=e.target; if(!t||!t.closest)return; const row=t.closest('[data-rowtap="proxy"]'); if(!row)return; const c=t.closest('button,a,input,select,textarea,label,summary,details,[data-a],[data-tip],[tabindex]'); if(c&&row.contains(c)&&c!==row)return; const go=row.querySelector('[data-rowgo]'); if(!go||go.disabled)return; e.preventDefault(); e.stopPropagation(); go.click(); },true);
document.addEventListener('keydown',e=>{ if(e.key!=='Enter'&&e.key!==' ')return; const t=e.target; if(!t||!t.matches||!t.matches('[data-rowtap]:not([data-rowtap="proxy"])'))return; e.preventDefault(); e.stopImmediatePropagation(); if(!e.repeat)t.click(); },true);

/* o: {id, q:{k|a, v, ph, label, html}, groups:[{l, k(optRow)|a(data-a), x, vp, cur, def, opts:[[v,l]], html, chip:{l, a, k, v, x}}], side, extra, reset:{a,v}, cls}
   그룹 cur!==def면 적용 중: 칩으로 보이고 칩을 누르면 def로 돌아간다. html 그룹은 chip을 직접 준다(없으면 칩 없음) */
function filterBar(o){ const id=o.id, open=UI.fbarOpen===id, G0=(o.groups||[]).filter(Boolean);
  const lab=(g,v)=>{ const x=(g.opts||[]).find(([k])=>String(k)===String(v)); return x?String(x[1]).replace(/<i class="cnt">[^<]*<\/i>/g,'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim():String(v); };
  const ctl=g=>g.html!=null?g.html:g.k?optRow(g.k,g.cur,g.opts,g.x):`<span class="chips optrow${g.cls?' '+g.cls:''}" role="group">${g.opts.map(([v,l])=>{ const on=String(g.cur)===String(v); return `<button type="button" data-a="${g.a}" data-v="${esc((g.vp||'')+v)}" class="${on?'on':''}" aria-pressed="${on}">${l}</button>`; }).join('')}</span>`;
  const clr=c=>c.k?`data-a="opt" data-k="${esc(c.k)}"${c.x!=null?` data-x="${esc(String(c.x))}"`:''} data-v="${esc(String(c.v??''))}"`:`data-a="${esc(c.a)}" data-v="${esc(String(c.v??''))}"`;
  const chips=[]; const q=o.q;
  if(q&&q.v)chips.push({l:`‘${q.v}’`,c:q.clear||(q.a?{k:q.a,v:''}:{a:'fbqClear',v:q.k})});
  for(const g of G0){ if(g.chip){ chips.push({l:g.chip.l,c:g.chip}); continue; } if(g.html!=null||g.nochip||String(g.cur)===String(g.def))continue; chips.push({l:`${g.l} ${lab(g,g.cur)}`,c:g.k?{k:g.k,x:g.x,v:g.def}:{a:g.a,v:(g.vp||'')+g.def}}); }
  const n=chips.length-(q&&q.v?1:0); (UI._fbar=UI._fbar||{})[id]=chips.map(x=>x.c);
  const search=!q?'':q.html!=null?q.html:`<input type="search" class="fbar-q" ${q.a?`data-a="${esc(q.a)}"`:`data-fbq="${esc(q.k)}"`} value="${esc(q.v||'')}" placeholder="${esc(q.ph||'이름 검색')}" aria-label="${esc(q.label||q.ph||'이름 검색')}" enterkeyhint="search" autocomplete="off">`;
  const pos=UI._fbPos&&UI._fbPos[id]; const st=open&&pos&&innerWidth>700?` style="top:${pos.t}px;left:${pos.l}px"`:'';
  if(open)setTimeout(()=>fbarPlace(id),0);
  return `<div class="fbar${o.cls?' '+o.cls:''}" data-fbar="${esc(id)}"><div class="fbar-row">${search}<button type="button" class="btn small fbar-b${n?' on':''}" data-a="fbarTog" data-v="${esc(id)}" aria-haspopup="dialog" aria-expanded="${open}" aria-controls="fbp-${esc(id)}">필터${n?` <b class="fbar-n">${n}</b>`:''}</button>${o.side||''}${chips.length?`<span class="fbar-chips" role="group" aria-label="적용 중인 조건">${chips.map(x=>`<button type="button" class="fbar-chip" ${clr(x.c)} aria-label="${esc(x.l)} 조건 지우기" title="조건 지우기">${esc(x.l)}<i aria-hidden="true">✕</i></button>`).join('')}</span>`:''}</div>
    <div class="fbar-p" id="fbp-${esc(id)}" role="dialog" aria-label="필터"${open?'':' hidden'}${st}><div class="fbar-ph"><b>필터</b>${chips.length&&o.reset!==false?`<button type="button" class="fbar-clr" ${o.reset?clr(o.reset):`data-a="fbarReset" data-v="${esc(id)}"`}>모두 지우기</button>`:''}<button type="button" class="btn small fbar-x" data-a="fbarTog" data-v="${esc(id)}">닫기</button></div><div class="fbar-body">${G0.map(g=>`<div class="fbar-g"><span class="fbar-gl">${g.l}</span>${ctl(g)}</div>`).join('')}${o.extra||''}</div></div></div>`; }
function fbarPlace(id){ const b=document.querySelector(`[data-fbar="${CSS.escape(id)}"] .fbar-b`), p=b&&b.closest('.fbar').querySelector('.fbar-p'); if(!p||p.hidden)return;
  if(innerWidth<=700){ p.style.top=''; p.style.left=''; document.documentElement.classList.add('fbar-sheet-open'); return; }
  const r=b.getBoundingClientRect(), w=p.offsetWidth||320, t=Math.round(r.bottom+4), l=Math.round(Math.max(8,Math.min(r.left,innerWidth-w-8)));
  p.style.top=t+'px'; p.style.left=l+'px'; p.style.maxHeight=Math.max(160,innerHeight-t-12)+'px'; (UI._fbPos=UI._fbPos||{})[id]={t,l}; }
function fbarClose(focus){ const id=UI.fbarOpen; if(id==null)return; UI.fbarOpen=null; document.documentElement.classList.remove('fbar-sheet-open');
  const f=document.querySelector(`[data-fbar="${CSS.escape(id)}"]`); if(!f)return; const p=f.querySelector('.fbar-p'), b=f.querySelector('.fbar-b'); if(p)p.hidden=true; if(b){ b.setAttribute('aria-expanded','false'); if(focus)b.focus({preventScroll:true}); } }
A.fbarTog=id=>{ if(UI.fbarOpen===id){ fbarClose(true); return; } fbarClose(); UI.fbarOpen=id; const f=document.querySelector(`[data-fbar="${CSS.escape(id)}"]`); if(!f){ render(); return; }
  const p=f.querySelector('.fbar-p'), b=f.querySelector('.fbar-b'); p.hidden=false; b.setAttribute('aria-expanded','true'); fbarPlace(id); const x=p.querySelector('button.on,select,input,button:not(.fbar-x)'); if(x)x.focus({preventScroll:true}); };
/* 모두 지우기: 칩마다 지우기 동작을 차례로(화면은 마지막에 한 번 다시 그린다) */
A.fbarReset=id=>{ const L=(UI._fbar||{})[id]||[]; const r0=render; let n=0; render=()=>{ n++; }; try{ for(const c of L){ if(c.k)selApply({dataset:{a:c.k,v:c.x},value:c.v,tagName:'SELECT',files:null}); else if(A[c.a])A[c.a](c.v,{dataset:{v:c.v}}); } }finally{ render=r0; } render(); };
A.fbqClear=k=>{ UI[k]=''; render(); }; /* 검색어 칩 */
document.addEventListener('change',e=>{ const el=e.target.closest&&e.target.closest('[data-fbq]'); if(!el)return; UI[el.dataset.fbq]=el.value.trim(); render(); });
document.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.matches&&e.target.matches('.fbar-q')&&!e.target.form){ e.preventDefault(); e.target.blur(); } });
/* 바깥을 누르면 닫는다(그 누름은 원래 대상에 그대로 간다). 휴대폰 바텀시트 바깥(어두운 바탕)은 닫기만 */
window.addEventListener('pointerdown',e=>{ if(UI.fbarOpen==null)return; if(!document.querySelector('[data-fbar="'+CSS.escape(UI.fbarOpen)+'"] .fbar-p:not([hidden])')){ UI.fbarOpen=null; document.documentElement.classList.remove('fbar-sheet-open'); return; } /* 다른 화면으로 옮겨 칸이 없어졌으면 상태만 정리 */ const t=e.target; if(t&&t.closest&&(t.closest('.fbar-p')||t.closest('.fbar-b')))return;
  const sheet=innerWidth<=700; fbarClose();
  if(sheet){ e.preventDefault(); const stop=ev=>{ ev.stopPropagation(); ev.preventDefault(); }; window.addEventListener('click',stop,{capture:true,once:true}); setTimeout(()=>window.removeEventListener('click',stop,{capture:true}),500); } },true);
window.addEventListener('keydown',e=>{ if(UI.fbarOpen==null||e.key!=='Escape')return; if(!document.querySelector(`[data-fbar="${CSS.escape(UI.fbarOpen)}"] .fbar-p:not([hidden])`))return; e.preventDefault(); e.stopImmediatePropagation(); fbarClose(true); },true);
window.addEventListener('scroll',()=>{ if(UI.fbarOpen!=null&&innerWidth>700)fbarPlace(UI.fbarOpen); },{capture:true,passive:true});
/* 목록 안 ⋯(mm-fixed): 칸(ws-panel)이 넘침을 잘라 PC 펼침이 가려지지 않게 화면 기준으로 띄운다 */
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('.mm-fixed>[data-mmenu]'); if(!b||innerWidth<=700)return; const m=b.closest('.mmenu'), p=m.querySelector('.mmenu-p'); if(!m.classList.contains('open')||!p)return;
  const r=b.getBoundingClientRect(), w=p.offsetWidth, h=p.offsetHeight, up=r.bottom+h+8>innerHeight; p.style.position='fixed'; p.style.top=Math.round(up?Math.max(8,r.top-h-4):r.bottom+4)+'px'; p.style.bottom='auto'; p.style.left=Math.round(Math.max(8,Math.min(r.right-w,innerWidth-w-8)))+'px'; p.style.right='auto'; });
