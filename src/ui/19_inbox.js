/* ---------- 소식함 페이지: 왼쪽 목록, 오른쪽 본문이 이어지는 피드 ---------- */
function mailCard(m){
  const o=m.oid&&(G.offers||[]).find(x=>x.id===m.oid);
  const dup=(UI._ibDup||{})[m.id];
  return `<article class="mfc${m.read?' rdm':' unread'}" id="m-${m.id}" data-mid="${m.id}">${dup?`<span class="mfc-dup">같은 소식 ${dup.length}건 더</span>`:''}
    <header class="mfc-h">${senderAv(m)}<div class="mfc-t"><div class="mfc-s">${m.imp?'<span class="pill acc">중요</span> ':''}<b>${lk(m.subj)}</b></div><span class="small muted">${esc(m.from)} · ${dsh(m.day)}</span></div></header>
    <div class="mailbody"${m.read?` data-a="mfcShow" data-v="${m.id}"`:''}>${m.body.split('\n').filter(Boolean).map(t=>`<p>${lk(t)}</p>`).join('')}</div>${m.read&&(m.body.length>60||m.body.includes('\n'))?`<button class="lnk mfc-more" data-a="mfcOpen" data-v="${m.id}">전체 보기</button>`:''}
    ${m.acts.length&&!(m.oid&&!o)?`<div class="btns mact">${m.acts.map((a,i)=>`<button class="btn ${i===0?'primary':''}" data-a="mailAct" data-v="${m.id}:${i}">${esc(a.l)}</button>`).join('')}</div>`:''}
    ${o?offerOne(o):m.oid?'<p class="small muted"><span class="pill">끝난 제안</span> 이미 답했거나 기한이 지났습니다.</p>':''}</article>`; }
/* ---------- 소식함(FM 수신함 구조): 분류 탭 · 왼쪽 목록(보낸 사람/제목/날짜) · 오른쪽 본문 ----------
   목록은 한 줄 요약만, 본문은 한 통만 펼친다. 모바일은 목록 → 눌러서 본문 → '목록' 버튼으로 돌아온다 */
const IB_KIND={squad:'부상 복귀 회복 부하 선수 감독 엔트리 결정 육성 캠프 병역 의무 코치 연수 면담 경기 bat boost',move:'트레이드 FA fa 외국인 용병 아시아 연봉 드래프트 스카우트 스토브리그',club:'구단주 재정 시설 구장 스폰서 스태프 전력분석 분석 운영 결재 일정 월간 업무 결산 새해 취임 체험판 일반',media:'언론 기록 OB 경력 포스트시즌'};
const IB_CAT=[['all','전체'],['task','처리할 일'],['squad','선수단'],['move','이적·계약'],['club','구단 운영'],['media','언론·기록']];
const IB_CATS={all:'전체',task:'처리',squad:'선수단',move:'이적',club:'운영',media:'언론'}; /* 휴대폰 탭 이름(한 줄에 다 들어가게) */
function ibCat(m){ for(const k in IB_KIND)if(IB_KIND[k].split(' ').includes(m.kind))return k; return 'club'; }
const IB_CATN={squad:'선수단',move:'이적·계약',club:'구단 운영',media:'언론·기록'};
/* 처리할 일: 결재·제안처럼 답이 필요한 소식(이미 끝난 트레이드 제안은 뺀다) */
function ibTask(m){ if(m.oid)return (G.offers||[]).some(o=>o.id===m.oid); /* 살아 있는 트레이드 제안 */
  if(/^\[인터뷰 요청\]/.test(m.subj))return !!(G.iv&&!G.iv.done&&m.day>=G.iv.day); /* 아직 응하지 않은 인터뷰 */
  return m.imp&&!m.read&&!(m.kind==='트레이드'&&/원한다/.test(m.subj)); } /* 아직 확인하지 않은 결재·중요 소식 */
function mailFilter(f){ return G.mail.filter(m=>f==='all'||(f==='task'?ibTask(m):f==='unread'?!m.read:f==='player'?typeof m.face==='number':ibCat(m)===f)); }
function ibDay(d){ const k=G.day-d; if(k===0)return '오늘'; if(k===1)return '어제'; return `${dmd(d)} (${WD[dobj(d).w]})`; }
/* 제목이 본문 첫 문장을 그대로 잘라 만든 경우(stop·note) 본문에서 겹치는 부분을 덜어 낸다 */
function ibSplit(m){ let subj=m.subj, L=m.body.split('\n').filter(Boolean); const s0=subj.replace(/…$/,''); if(L.length&&L[0].startsWith(s0)){
    if(subj.endsWith('…')){ const i=L[0].search(/[.!?](\s|$)/); subj=i>0&&i<90?L[0].slice(0,i):L[0].length<=90?L[0].replace(/[.]$/,''):subj; }
    const rest=L[0].slice(subj.replace(/…$/,'').length).replace(/^[.!?]\s*/,'').trim(); if(L[0].startsWith(subj.replace(/…$/,''))){ if(rest)L[0]=rest; else L.shift(); } }
  return {subj,L}; }
function mailRow(m,cur){ const need=ibTask(m)&&!m.read; return `<button class="ibr${m.read?'':' unread'}${need?' need':''}${cur?' cur':''}" data-a="mailJump" data-v="${m.id}" data-mid="${m.id}">${senderAv(m)}<span class="ibr-m"><span class="ibr-top"><b class="ibr-from">${esc(m.from)}</b>${ibTask(m)?'<span class="ibr-tag">처리</span>':''}<span class="ibr-d">${dsh(m.day)}</span></span><span class="ibr-s">${esc(m.subj)}</span></span></button>`; }
function mailCard(m,nav){ const o=m.oid&&(G.offers||[]).find(x=>x.id===m.oid); const dup=(UI._ibDup||{})[m.id]; const {subj,L}=ibSplit(m);
  const acts=m.acts.filter(a=>!(o&&a.a==='goWork')); /* 제안 카드가 붙은 메일은 '해당 화면으로' 대신 카드 안의 버튼을 쓴다 */
  return `<article class="ibm mfc${m.read?' rdm':' unread'}" id="m-${m.id}" data-mid="${m.id}">
    <header class="ibm-h">${senderAv(m)}<div class="ibm-t"><div class="ibm-from"><b>${esc(m.from)}</b><span class="pill">${IB_CATN[ibCat(m)]}</span>${ibTask(m)?'<span class="pill warn">처리할 일</span>':''}</div><h2 class="ibm-s">${lk(subj)}</h2><div class="ibm-d">${G.year===dobj(m.day).y?'':dobj(m.day).y+'년 '}${dmd(m.day)} ${WD[dobj(m.day).w]}요일${dup?` · 같은 소식 ${dup.length+1}건을 묶었습니다`:''}</div></div>${nav||''}</header>
    ${L.length?`<div class="mailbody">${L.map(t=>`<p>${lk(t)}</p>`).join('')}</div>`:''}
    ${m.rv?rvActsH(m):''}
    ${acts.length&&!(m.oid&&!o)?`<div class="ibm-acts">${acts.map(a=>`<button class="btn${a===acts[0]?' primary':''}" data-a="mailAct" data-v="${m.id}:${m.acts.indexOf(a)}">${esc(a.l)}</button>`).join('')}</div>`:''}
    ${o?offerOne(o):m.oid?'<p class="small muted"><span class="pill">끝난 제안</span> 이미 답했거나 기한이 지났습니다.</p>':''}</article>`; }
/* 처리할 메일: 안 읽었고 중요하거나 업무·버튼·제안이 있는 것. 상단 숫자는 이것만 센다 */
const mailNeeds=m=>!m.read&&(m.imp||m.kind==='업무'||(m.acts&&m.acts.length>0)||!!m.oid);
function inboxView(){
  if(!['all','task','squad','move','club','media'].includes(UI.mf))UI.mf='all'; const f=UI.mf;
  let list=mailFilter(f);
  /* 같은 곳에서 온 같은 제목 소식은 가장 최근 것 하나로 묶는다(처리할 소식은 묶지 않는다) */
  { const seen={}; UI._ibDup={}; list=list.filter(m=>{ if(m.oid||(m.acts&&m.acts.length&&!m.read))return true; const k=m.from+'|'+m.subj; if(seen[k]!=null){ (UI._ibDup[seen[k]]=UI._ibDup[seen[k]]||[]).push(m.id); return false; } seen[k]=m.id; return true; }); }
  const unread=G.mail.filter(m=>!m.read).length;
  const cnt=k=>mailFilter(k).filter(m=>!m.read).length;
  const bar=`<div class="ibx-bar"><div class="ibx-tabs" role="tablist">${IB_CAT.map(([k,l])=>{ const n=k==='all'?0:cnt(k); return `<button role="tab" data-a="mf" data-v="${k}" class="${f===k?'on':''}${k==='task'&&n?' hot':''}"><span class="ibl">${l}</span><span class="ibs">${IB_CATS[k]}</span>${n?`<i>${n}</i>`:''}</button>`; }).join('')}</div>
    <div class="ibx-meta"><span>안 읽음 <b id="ib-unread">${unread}</b></span>${unread?'<button class="lnk" data-a="readAll">모두 읽음</button>':''}${wide()?'<span class="ibx-key" title="스페이스바: 안 읽은 소식을 차례로 열고, 다 읽으면 계속 진행 · J/K: 다음/이전">Space 다음 소식</span>':''}</div></div>`;
  if(!list.length)return bar+`<section class="card ibx-empty"><p class="muted">${f==='task'?'처리할 일이 없습니다.':'소식이 없습니다.'}</p></section>`;
  const ids=list.map(m=>m.id);
  /* 고른 메일: 다른 화면에서 연 메일 > 목록에서 고른 메일 > (넓은 화면) 가장 위의 안 읽은 소식 */
  /* 날짜가 바뀌면 지난번에 보던 메일 대신 새 소식부터 보여 준다 */
  if(UI._ibDay!==G.day){ UI._ibDay=G.day; if(!UI.mailFocus){ UI.ibSel=null; UI.ibOpen=null; } }
  let sel=[UI.mailFocus,UI.ibSel].find(v=>v&&ids.includes(v));
  if(UI.mailFocus&&!sel&&G.mail.some(m=>m.id===UI.mailFocus)){ UI.mf='all'; return inboxView(); }
  if(UI.mailFocus&&sel&&!wide())UI.ibOpen=sel;
  const W=wide(); if(!sel&&W){ const u=list.find(m=>!m.read); sel=(u||list[0]).id; } UI.ibSel=sel||null;
  const si=ids.indexOf(sel);
  const nav=sel?`<div class="ibm-nav"><button class="btn small" data-a="mailJump" data-v="${ids[si-1]||''}" ${si>0?'':'disabled'} aria-label="이전 소식">◀</button><span>${si+1}/${ids.length}</span><button class="btn small" data-a="mailJump" data-v="${ids[si+1]||''}" ${si<ids.length-1?'':'disabled'} aria-label="다음 소식">▶</button></div>`:'';
  const lim=UI.ibN||40; const more=list.length>lim?`<button class="btn small block ibx-more" data-a="ibMore">이전 소식 더 보기 (${list.length-lim}건)</button>`:''; let last=null; const rows=list.slice(0,Math.max(lim,ids.indexOf(sel)+1)).map(m=>{ let h=''; if(m.day!==last){ last=m.day; h=`<div class="ibx-day">${ibDay(m.day)}</div>`; } return h+mailRow(m,m.id===sel); }).join('')+more;
  if(!W){ if(UI.ibOpen&&ids.includes(UI.ibOpen)){ const m=list[ids.indexOf(UI.ibOpen)]; setTimeout(()=>ibMark(m.id),50);
      return `<div class="ibx-mback"><button class="btn small" data-a="ibBack">◀ 목록</button><span class="small muted">${IB_CAT.find(c=>c[0]===f)[1]}</span></div>${mailCard(m,nav)}`; }
    UI.ibOpen=null; return bar+`<nav class="ibx-list m" aria-label="소식 목록">${rows}</nav>`; }
  setTimeout(()=>ibMark(sel),400);
  return bar+`<div class="ibx"><nav class="ibx-list" aria-label="소식 목록">${rows}</nav><div class="ibx-read">${mailCard(list[si],nav)}</div></div>`;
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
function inboxWire(){ document.documentElement.style.setProperty('--ibtop',(ibTop()+8)+'px'); const f=UI.mailFocus; UI.mailFocus=null;
  const L=document.querySelector('.ibx-list'); if(!L)return;
  if(!wide()&&UI.ibY!=null&&!f){ window.scrollTo(0,UI.ibY); UI.ibY=null; }
  const c=L.querySelector('.ibr.cur'); if(c&&wide()){ const a=c.offsetTop, b=a+c.offsetHeight; if(a<L.scrollTop||b>L.scrollTop+L.clientHeight)L.scrollTop=a-L.clientHeight/3; } }
function ibStep(d){ const ids=mailFilter(UI.mf||'all').map(m=>m.id).filter(id=>document.querySelector(`.ibr[data-mid="${id}"]`)||id===UI.ibSel); const cur=wide()?UI.ibSel:UI.ibOpen; const i=ids.indexOf(cur); const n=ids[i<0?(d>0?0:ids.length-1):i+d]; if(n)A.mailJump(n); }
/* 스페이스바: 안 읽은 소식 → 하나씩 열기, 없으면 계속 버튼 */
function ibSpace(){ const L=mailFilter(UI.mf||'all'); const u=L.find(m=>!m.read)||(UI.mf&&UI.mf!=='all'?mailFilter('all').find(m=>!m.read):null);
  if(u){ if(UI.mf&&UI.mf!=='all'&&!L.includes(u))UI.mf='all'; if(UI.tab!=='inbox')A.openMail(u.id); else A.mailJump(u.id); return; }
  const b=document.querySelector('button.continue:not([disabled])'); if(b){ b.click(); return; } const bl=blocker(); if(bl)toast(bl); }
