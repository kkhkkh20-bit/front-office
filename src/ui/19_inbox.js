/* ---------- 소식함 페이지: 왼쪽 목록, 오른쪽 본문이 이어지는 피드 ---------- */
function mailCard(m){
  const o=m.oid&&(G.offers||[]).find(x=>x.id===m.oid);
  const dup=(UI._ibDup||{})[m.id];
  return `<article class="mfc${m.read?' rd':' unread'}" id="m-${m.id}" data-mid="${m.id}">${dup?`<span class="mfc-dup">같은 소식 ${dup.length}건 더</span>`:''}
    <header class="mfc-h">${senderAv(m)}<div class="mfc-t"><div class="mfc-s">${m.imp?'<span class="pill acc">중요</span> ':''}<b>${lk(m.subj)}</b></div><span class="small muted">${esc(m.from)} · ${dsh(m.day)}</span></div></header>
    <div class="mailbody"${m.read?` data-a="mfcShow" data-v="${m.id}"`:''}>${m.body.split('\n').filter(Boolean).map(t=>`<p>${lk(t)}</p>`).join('')}</div>${m.read&&(m.body.length>60||m.body.includes('\n'))?`<button class="lnk mfc-more" data-a="mfcOpen" data-v="${m.id}">전체 보기</button>`:''}
    ${m.acts.length&&!(m.oid&&!o)?`<div class="btns mact">${m.acts.map((a,i)=>`<button class="btn ${i===0?'primary':''}" data-a="mailAct" data-v="${m.id}:${i}">${esc(a.l)}</button>`).join('')}</div>`:''}
    ${o?offerOne(o):m.oid?'<p class="small muted"><span class="pill">끝난 제안</span> 이미 답했거나 기한이 지났습니다.</p>':''}</article>`; }
function mailRow(m){ return `<button class="mrow${m.read?'':' unread'}" data-a="mailJump" data-v="${m.id}" data-mid="${m.id}">${senderAv(m)}<span class="mrow-t">${m.imp?'<i class="mrow-imp"></i>':''}${esc(m.subj)}</span><span class="mrow-d">${dsh(m.day)}</span></button>`; }
/* 처리할 메일: 안 읽었고 중요하거나 업무·버튼·제안이 있는 것. 상단 숫자는 이것만 센다 */
const mailNeeds=m=>!m.read&&(m.imp||m.kind==='업무'||(m.acts&&m.acts.length>0)||!!m.oid);
function inboxView(){
  const f=UI.mf||'all'; const all=mailFilter(f).slice(0,150);
  /* 지난 정보: 7일이 지났고 이미 읽은 메일은 접어 둔다 */
  const isOld=m=>m.read&&G.day-m.day>7&&m.id!==UI.ibSel&&m.id!==UI.mailFocus; /* 지금 열어 본 메일은 읽음 처리돼도 접지 않는다 */ const oldN=f==='all'?all.filter(isOld).length:0; let list=f==='all'&&!UI.ibOld?all.filter(m=>!isOld(m)):all;
  /* 같은 곳에서 온 같은 제목 소식은 가장 최근 것 하나로 묶는다 */
  { const seen={}; UI._ibDup={}; list=list.filter(m=>{ if(m.oid||(m.acts&&m.acts.length&&!m.read))return true; const k=m.from+'|'+m.subj; if(seen[k]!=null){ (UI._ibDup[seen[k]]=UI._ibDup[seen[k]]||[]).push(m.id); return false; } seen[k]=m.id; return true; }); }
  const oldBtn=oldN?`<button class="btn block ib-old" data-a="ibOld">${UI.ibOld?'지난 소식 접기':`지난 소식 ${oldN}건 펼치기 (일주일 지난 읽은 소식)`}</button>`:'';
  const unread=G.mail.filter(m=>!m.read).length, tasks=mailFilter('task').filter(m=>!m.read).length;
  const chips=(wide()?'<p class="small muted ib-key">스페이스바: 안 읽은 소식을 하나씩 열고, 다 읽으면 계속 진행합니다</p>':'')+`<div class="chips ib-chips">${[['all','전체'],['task',`업무${tasks?` ${tasks}`:''}`],['unread','안 읽음'],['player','선수']].map(([k,l])=>`<button data-a="mf" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div><div class="row between" style="margin:4px 0 6px"><span class="ib-n small muted">안 읽음 <b id="ib-unread">${unread}</b></span>${unread?'<button class="btn small" data-a="readAll">모두 읽음</button>':''}</div>`;
  if(!list.length)return chips+`<section class="card"><p class="muted">${oldN?'새 소식이 없습니다.':'소식이 없습니다.'}</p></section>`+oldBtn;
  if(UI.mailFocus){ const ix=list.findIndex(m=>m.id===UI.mailFocus); if(ix<0&&f==='all'&&!UI.ibOld&&all.some(m=>m.id===UI.mailFocus)){ UI.ibOld=true; return inboxView(); } if(ix>=0){ UI.pg=UI.pg||{}; UI.pg['ib'+f+(UI.ibOld?'o':'')]=Math.floor(ix/(wide()?12:5)); } }
  const PG=pager('ib'+f+(UI.ibOld?'o':''),list,wide()?12:5); const list0=list; void list0;
  let last=null; const feed=PG.items.map(m=>{ let h=''; if(m.day!==last){ last=m.day; h=`<div class="mday">${dmd(m.day)} ${WD[dobj(m.day).w]}</div>`; } return h+mailCard(m); }).join('');
  if(!wide())return chips+`<div class="mfeed" data-pg="${'ib'+f+(UI.ibOld?'o':'')}">${feed}</div>`+PG.bar+oldBtn;
  /* 데스크톱: 왼쪽 목록에서 고른 메일 한 통만 오른쪽에 펼친다(세로로 길게 늘어놓지 않는다) */
  const ids=PG.items.map(m=>m.id); let sel=[UI.mailFocus,UI.ibSel].find(v=>v&&ids.includes(v)); if(!sel){ const u=PG.items.find(m=>!m.read); sel=(u||PG.items[0]).id; } UI.ibSel=sel;
  const si=ids.indexOf(sel), sm=PG.items[si]; setTimeout(()=>ibMark(sel),400);
  last=null; const rows=PG.items.map(m=>{ let h=''; if(m.day!==last){ last=m.day; h=`<div class="mday">${dmd(m.day)} ${WD[dobj(m.day).w]}</div>`; } return h+mailRow(m).replace('class="mrow',`class="mrow${m.id===sel?' cur':''}`); }).join('');
  const nav=`<div class="row between ib-nav"><button class="btn small" data-a="mailJump" data-v="${ids[si-1]||''}" ${si>0?'':'disabled'}>◀ 이전 소식</button><span class="small muted">${si+1} / ${ids.length}</span><button class="btn small" data-a="mailJump" data-v="${ids[si+1]||''}" ${si<ids.length-1?'':'disabled'}>다음 소식 ▶</button></div>`;
  return chips+`<div class="ib2"><nav class="ib-list" aria-label="소식 목록">${rows}${PG.bar}${oldBtn}</nav><div class="mfeed one">${nav}${mailCard(sm)}</div></div>`;
}
/* 화면에 보인 메일은 읽음으로. 다시 그리지 않고 표시만 바꾼다 */
let _ibSave=null, _ibOn=false, _ibRaf=0;
function ibMark(id){ const m=G.mail.find(x=>x.id===id); if(!m||m.read)return; m.read=true; for(const d of ((UI._ibDup||{})[id]||[])){ const q=G.mail.find(x=>x.id===d); if(q)q.read=true; }
  document.querySelectorAll(`[data-mid="${id}"]`).forEach(el=>el.classList.remove('unread'));
  const n=G.mail.filter(x=>!x.read).length; const u=document.getElementById('ib-unread'); if(u)u.textContent=n;
  const nb=G.mail.filter(mailNeeds).length; const mb=document.querySelector('.mailbtn i'); if(mb){ if(nb)mb.textContent=nb>99?'99+':nb; else mb.remove(); }
  const rc=document.querySelector('.rail [data-v=inbox] .cnt'); if(rc){ if(nb)rc.textContent=nb; else rc.remove(); }
  if(!nb){ const d=document.querySelector('.bnav [data-v=inbox] .dot'); if(d)d.remove(); }
  clearTimeout(_ibSave); _ibSave=setTimeout(()=>save(),700); }
function ibTop(){ const t=document.querySelector('.top'); return t?t.offsetHeight:60; }
function ibScan(){ _ibRaf=0; if(!G||UI.tab!=='inbox')return; const H=innerHeight, T=ibTop(); let cur=null;
  for(const el of document.querySelectorAll('.mfeed .mfc')){ const r=el.getBoundingClientRect(); if(r.bottom<T)continue; if(r.top>H)break;
    if(!cur&&r.bottom>T+50)cur=el.dataset.mid;
    if(r.top<H*.72&&r.bottom>T+20)ibMark(el.dataset.mid); }
  if(cur&&cur!==UI.ibCur){ UI.ibCur=cur; const L=document.querySelector('.ib-list'); if(L){ L.querySelectorAll('.mrow.cur').forEach(x=>x.classList.remove('cur')); const it=L.querySelector(`.mrow[data-mid="${cur}"]`); if(it){ it.classList.add('cur'); const a=it.offsetTop, b=a+it.offsetHeight; if(a<L.scrollTop+30||b>L.scrollTop+L.clientHeight-10)L.scrollTop=a-L.clientHeight/3; } } } }
function inboxWire(){ if(!_ibOn){ _ibOn=true; addEventListener('scroll',()=>{ if(UI.tab==='inbox'&&!_ibRaf)_ibRaf=requestAnimationFrame(ibScan); },{passive:true}); }
  UI.ibCur=null; document.documentElement.style.setProperty('--ibtop',(ibTop()+8)+'px'); const f=UI.mailFocus; UI.mailFocus=null;
  if(f){ const el=document.getElementById('m-'+f); if(el){ el.scrollIntoView({block:'start'}); el.classList.add('flash'); } }
  setTimeout(ibScan,60); }
function ibStep(d){ if(wide()&&document.querySelector('.mfeed.one')){ const ids=[...document.querySelectorAll('.ib-list .mrow')].map(e=>e.dataset.mid); const i=ids.indexOf(UI.ibSel); const n=ids[i+d]; if(n)A.mailJump(n); return; } const cards=[...document.querySelectorAll('.mfeed .mfc')]; if(!cards.length)return; const T=ibTop(); let i=cards.findIndex(el=>el.getBoundingClientRect().bottom>T+50); if(i<0)i=0; const r=cards[i].getBoundingClientRect(); const al=Math.abs(r.top-T-8)<30; const n=d>0?(r.top>T+40?i:i+1):(al?i-1:i); const el=cards[Math.max(0,Math.min(cards.length-1,n))]; el.scrollIntoView({block:'start',behavior:'smooth'}); }


/* 스페이스바: 안 읽은 소식 → 하나씩 열기, 없으면 계속 버튼 */
function ibSpace(){ const L=mailFilter(UI.mf||'all'); const u=L.find(m=>!m.read)||(UI.mf&&UI.mf!=='all'?mailFilter('all').find(m=>!m.read):null);
  if(u){ if(UI.mf&&UI.mf!=='all'&&!L.includes(u))UI.mf='all'; if(wide())A.mailJump(u.id); else { A.openMail(u.id); setTimeout(()=>{ const el=document.getElementById('m-'+u.id); if(el)el.scrollIntoView({block:'start'}); },60); } return; }
  const b=document.querySelector('button.continue:not([disabled])'); if(b){ b.click(); return; } const bl=blocker(); if(bl)toast(bl); }
