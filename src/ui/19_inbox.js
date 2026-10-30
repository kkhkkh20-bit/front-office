/* ---------- 소식함 페이지: 왼쪽 목록, 오른쪽 본문이 이어지는 피드 ---------- */
/* ---------- 소식함(FM 수신함 구조): 분류 탭 · 왼쪽 목록(보낸 사람/제목/날짜) · 오른쪽 본문 ----------
   목록은 한 줄 요약만, 본문은 한 통만 펼친다. 모바일은 목록 → 눌러서 본문 → '목록' 버튼으로 돌아온다 */
const IB_KIND={squad:'부상 복귀 회복 부하 선수 감독 엔트리 결정 육성 캠프 병역 의무 코치 연수 면담 경기 bat boost',move:'트레이드 FA fa 외국인 용병 아시아 연봉 드래프트 스카우트 스토브리그',club:'구단주 재정 시설 구장 스폰서 스태프 전력분석 분석 운영 결재 일정 월간 업무 결산 새해 취임 체험판 일반',media:'언론 기록 OB 경력 포스트시즌'};
const IB_CAT=[['all','전체'],['task','확인할 소식'],['squad','선수단'],['move','이적·계약'],['club','구단 운영'],['media','언론·기록']];
const IB_CATS={all:'전체',task:'확인',squad:'선수단',move:'이적',club:'운영',media:'언론'}; /* 휴대폰 탭 이름(한 줄에 다 들어가게) */
function ibCat(m){ for(const k in IB_KIND)if(IB_KIND[k].split(' ').includes(m.kind))return k; return 'club'; }
const IB_CATN={squad:'선수단',move:'이적·계약',club:'구단 운영',media:'언론·기록'};
/* 이미 처리된 일인가: 결정(이벤트)이 끝났거나, 소식이 알린 상황이 해결됐으면 '처리됨'. 안 읽음 표시는 그대로 두고 '확인할 소식'에서만 뺀다 */
const MAIL_DONE=[
  [/감독 자리가 비어/,()=>{ const m=G.mgr[G.user]; return !!(m&&!m.interim); }],
  [/코치 자리가 비어/,()=>!!G.coach&&!CKEYS.some(k=>!coachesOf(G.user)[k])],
  [/창단 드래프트(가 끝|: 모든)/,()=>!!(G.fd&&G.fd.done)],
  [/스폰서 제안/,()=>!(G.spon&&G.spon.off&&G.spon.off.length)],
  [/상무 지원 기간/,()=>!sangmuWave()],
  [/연봉 협상이 시작|연봉 미계약|연봉 계약 마감|연봉조정 신청/,()=>!G.contract||!!G.contract.done],
  [/신인 드래프트가 열립니다/,()=>!G.draft||!!G.draft.done],
  [/스프링캠프가 시작/,()=>!G.camp||!!G.camp.done||!!G.camp.seen],
  [/보호선수 명단|보상선수 지명/,()=>!(G.comp||[]).some(c=>(c.stage==='protect'&&c.to===G.user)||(c.stage==='pick'&&c.from===G.user))],
  [/FA 승인 선수|FA 협상이 열립니다|스토브리그가 시작/,()=>!faLive()],
  [/외국인 선수를 구성/,()=>foreignOf(G.user).length>=3||period()==='season'],
  [/트레이드 마감|마감 보강안/,()=>!tradeOpen()],
  [/참석 선수 확인/,()=>!G.md||!!G.md.res||G.day>=G.md.day],
  [/내일 직관|개막합니다/,(m)=>G.day>m.day+1]];
const mailDoneShow=m=>(m.imp||m.kind==='업무'||m.kind==='결정'||(m.acts&&m.acts.length>0)||!!m.oid)&&mailDone(m);
function mailDone(m){ if(m.done)return true;
  for(const a of (m.acts||[])){ if(a.a==='evPick'){ const id=String(a.v).split(':')[0]; const e=(G.evs||[]).find(x=>x.id===id); return !e||!!e.done; }
    if(a.a==='faOpen'||(a.a==='player'&&/관심 FA|우리 FA|시장 보고/.test(m.subj))){ const p=G.players[+a.v]; if(p&&(p.team!=null||!(G.fa&&!G.fa.closed)))return true; } }
  if(m.oid)return !(G.offers||[]).some(o=>o.id===m.oid);
  if(/^\[인터뷰 요청\]/.test(m.subj))return !(G.iv&&!G.iv.done&&m.day>=G.iv.day);
  for(const [re,f] of MAIL_DONE)if(re.test(m.subj)){ try{ return !!f(m); }catch(e){ return false; } }
  return false; }
/* 처리할 일: 결재·제안처럼 답이 필요한 소식(이미 끝난 일은 뺀다) */
function ibTask(m){ if(mailDone(m))return false; if(m.oid)return (G.offers||[]).some(o=>o.id===m.oid); /* 살아 있는 트레이드 제안 */
  if(/^\[인터뷰 요청\]/.test(m.subj))return !!(G.iv&&!G.iv.done&&m.day>=G.iv.day); /* 아직 응하지 않은 인터뷰 */
  return m.imp&&!m.read&&!(m.kind==='트레이드'&&/원한다/.test(m.subj)); } /* 아직 확인하지 않은 결재·중요 소식 */
function mailFilter(f){ return G.mail.filter(m=>f==='all'||(f==='task'?(ibTask(m)||ibMust(m)):f==='unread'?!m.read:f==='player'?typeof m.face==='number':ibCat(m)===f)); }
function ibDay(d){ const k=G.day-d; if(k===0)return '오늘'; if(k===1)return '어제'; return `${dmd(d)} (${WD[dobj(d).w]})`; }
/* 제목이 본문 첫 문장을 그대로 잘라 만든 경우(stop·note) 본문에서 겹치는 부분을 덜어 낸다 */
function ibSplit(m){ let subj=m.subj, L=m.body.split('\n').filter(Boolean); const s0=subj.replace(/…$/,''); if(L.length&&L[0].startsWith(s0)){
    if(subj.endsWith('…')){ const i=L[0].search(/[.!?](\s|$)/); subj=i>0&&i<90?L[0].slice(0,i):L[0].length<=90?L[0].replace(/[.]$/,''):subj; }
    const rest=L[0].slice(subj.replace(/…$/,'').length).replace(/^[.!?]\s*/,'').trim(); if(L[0].startsWith(subj.replace(/…$/,''))){ if(rest)L[0]=rest; else L.shift(); } }
  return {subj,L}; }
function mailRow(m,cur){ const need=ibTask(m)&&!m.read; return `<button class="ibr${m.read?'':' unread'}${need?' need':''}${cur?' cur':''}" data-a="mailJump" data-v="${m.id}" data-mid="${m.id}">${senderAv(m)}<span class="ibr-m"><span class="ibr-top"><b class="ibr-from">${esc(m.from)}</b>${m.warn&&!mailDone(m)?'<span class="ibr-tag">기한 내일</span>':ibTask(m)?'<span class="ibr-tag">확인</span>':mailDoneShow(m)?'<span class="ibr-tag done">처리됨</span>':''}<span class="ibr-d">${dsh(m.day)}</span></span><span class="ibr-s">${esc(m.subj)}</span></span></button>`; }
function mailCard(m,nav){ const o=m.oid&&(G.offers||[]).find(x=>x.id===m.oid); const dup=(UI._ibDup||{})[m.id]; const {subj,L:L0}=ibSplit(m);
  let fth=null; if(m.fth){ try{ fth=fanThreads().find(t=>t.id===m.fth)||null; }catch(e){} }
  /* 팬 게시판 소식: 댓글은 아래 게시판 블록에만 보여 준다(본문에 같은 댓글을 글로 한 번 더 쓰지 않는다) */
  const L=fth?L0.filter(t=>!/^댓글 분위기:/.test(t)&&!/\(추천 [\d,]+\)$/.test(t)):L0;
  const dn=mailDoneShow(m); const doneA=m.acts.filter(a=>a.done&&a.res); const acts=m.acts.filter(a=>!a.done&&!(o&&a.a==='goWork')&&!(dn&&/^(evPick|ivOpen|ivSkip|faOpen|faMatch)$/.test(a.a))); /* 끝난 결정·인터뷰·FA 건은 버튼 대신 '처리됨' */ /* 제안 카드가 붙은 메일은 '해당 화면으로' 대신 카드 안의 버튼을 쓴다 */
  return `<article class="ibm mfc${m.read?' rdm':' unread'}" id="m-${m.id}" data-mid="${m.id}">
    <header class="ibm-h">${senderAv(m)}<div class="ibm-t"><div class="ibm-from"><b>${esc(m.from)}</b><span class="pill">${IB_CATN[ibCat(m)]}</span>${ibTask(m)?'<span class="pill warn">확인할 소식</span>':mailDoneShow(m)?'<span class="pill">처리됨</span>':''}</div><h2 class="ibm-s">${lk(subj)}</h2><div class="ibm-d">${G.year===dobj(m.day).y?'':dobj(m.day).y+'년 '}${dmd(m.day)} ${WD[dobj(m.day).w]}요일${m.day0!=null&&m.day0!==m.day?` · 처음 받은 날 ${dmd(m.day0)}`:''}${dup?` · 같은 소식 ${dup.length+1}건을 묶었습니다`:''}</div></div>${nav||''}</header>
    ${m.warn&&!mailDone(m)?`<div class="note warn ibm-warn">기한 임박: ${esc(m.warn)}</div>`:''}
    ${L.length?`<div class="mailbody">${(L.length>4?L.slice(0,2):L).map(t=>`<p>${lk(t)}</p>`).join('')}${L.length>4?`<details class="mfold"><summary>자세히 (${L.length-2}줄 더)</summary>${L.slice(2).map(t=>`<p>${lk(t)}</p>`).join('')}</details>`:''}</div>`:''}
    ${fth?`<div class="ibm-fth"><div class="small muted">댓글 ${fth.cm.length}개${(()=>{ try{ return ` · 분위기: ${fpMood(fth.cm)}`; }catch(e){ return ''; } })()}</div><div class="fcms">${fth.cm.map(cmtRow).join('')}</div></div>`:''}
    ${m.rv?rvActsH(m):''}${handOffBtns(m)}
    ${doneA.length?`<div class="ibm-res">${doneA.map(a=>`<p class="note good small">${esc(a.res)}</p>`).join('')}</div>`:''}${acts.length&&!(m.oid&&!o)?`<div class="ibm-acts">${acts.map(a=>`<button class="btn${a===acts[0]?' primary':''}" data-a="mailAct" data-v="${m.id}:${m.acts.indexOf(a)}">${esc(a.l)}</button>`).join('')}</div>`:''}
    ${o?offerOne(o):m.oid?'<p class="small muted"><span class="pill">끝난 제안</span> 이미 답했거나 기한이 지났습니다.</p>':''}</article>`; }
/* 처리할 메일: 안 읽었고 중요하거나 업무·버튼·제안이 있는 것. 상단 숫자는 이것만 센다 */
const mailNeeds=m=>!m.read&&(m.imp||m.kind==='업무'||(m.acts&&m.acts.length>0)||!!m.oid);
/* ===== 소식함 =====
 - 맨 위 '안 읽은 소식' 묶음: 안 읽은 소식을 확인할 소식부터, 같은 종류 안에서는 최신부터. 읽어도 그날(또는 소식함을 다시 열 때)까지는 그 자리에 둔다(읽는 중에 목록이 움직이지 않게).
 - 그 아래는 최신 날짜부터 날짜별로 묶는다. 날짜 머리를 누르면 그 날짜를 접고 편다.
 - 접기는 단장만 한다. 시간이 지났다고 저절로 접거나 읽음 처리하지 않는다. 접힌 날짜에 안 읽은 소식이 있으면 머리에 표시된다.
 - 저절로 소식을 골라 열지 않는다(고른 것만 읽음). 날짜가 바뀌어도 보던 위치를 지킨다.
 - 스페이스바(와 '계속' 버튼): 화면 위에서부터 안 읽은 소식을 연다(확인할 소식 먼저). 다 읽었으면 진행한다. */
function ibList(f){ let list=mailFilter(f); const seen={}; UI._ibDup={}; const keep=UI.mailFocus||UI.ibSel||UI.ibOpen;
  list=list.filter(m=>{ if(m.oid||(m.acts&&m.acts.length&&!m.read)||m.id===keep)return true; const k=m.from+'|'+m.subj; if(seen[k]!=null){ (UI._ibDup[seen[k]]=UI._ibDup[seen[k]]||[]).push(m.id); return false; } seen[k]=m.id; return true; });
  return list; } /* G.mail은 새 소식이 앞: 화면도 최신부터 */
function contSub(def){ const n=ibNeedList().length; return n?`확인할 소식 ${n}건`:def; }
/* 반드시 확인할 소식: 안 읽었고, 답이 필요하거나(살아 있는 제안·인터뷰) 중요 표시·업무 소식. 단순히 '선수 보기' 버튼만 있는 소식은 넣지 않는다 */
const ibMust=m=>!m.read&&!mailDone(m)&&(ibTask(m)||m.kind==='업무');
function ibNeedList(){ return G.mail.filter(ibMust); } /* 최신부터(화면 순서) */
/* 스페이스바·'안 읽음'이 여는 순서: 확인할 소식 먼저, 그다음 나머지 안 읽은 소식(각각 최신부터) = 화면 맨 위 묶음 순서 */
function ibUnreadOrder(){ const u=G.mail.filter(m=>!m.read); return u.filter(ibMust).concat(u.filter(m=>!ibMust(m))); }
/* 맨 위 묶음에 고정할 소식: 지금 안 읽은 소식 + 이번에 소식함을 연 뒤(같은 날) 읽은 소식 */
function ibPinned(list){ let S=UI._ibStk; if(!S||S.day!==G.day||UI._ibFirst)S=UI._ibStk={day:G.day,g:{}};
  for(const m of list)if(!m.read&&S.g[m.id]==null)S.g[m.id]=ibMust(m)?0:1;
  const P=list.filter(m=>S.g[m.id]!=null); return P.filter(m=>S.g[m.id]===0).concat(P.filter(m=>S.g[m.id]===1)); }
function ibFolds(){ return G.ibFold=G.ibFold||{}; }
function inboxView(){
  if(!['all','task','squad','move','club','media'].includes(UI.mf))UI.mf='all'; const f=UI.mf;
  const list=ibList(f); const unread=G.mail.filter(m=>!m.read).length; const need=ibNeedList().length;
  const cnt=k=>mailFilter(k).filter(m=>!m.read).length; const F=ibFolds();
  const days=[...new Set(list.map(m=>m.day))]; const foldN=days.filter(d=>F[d]).length;
  const bar=`<div class="ibx-bar"><div class="ibx-tabs" role="tablist">${IB_CAT.map(([k,l])=>{ const n=k==='all'?0:cnt(k); return `<button role="tab" data-a="mf" data-v="${k}" class="${f===k?'on':''}${k==='task'&&n?' hot':''}"><span class="ibl">${l}</span><span class="ibs">${IB_CATS[k]}</span>${n?`<i>${n}</i>`:''}</button>`; }).join('')}</div>
    <div class="ibx-meta">${unread?`<button class="lnk ibx-ur" data-a="ibUnreadGo" title="가장 오래된 안 읽은 소식으로">안 읽음 <b id="ib-unread">${unread}</b></button>`:`<span>안 읽음 <b id="ib-unread">0</b></span>`}${need?`<button class="lnk ibx-need" data-a="ibNeedGo">확인할 소식 ${need}건</button>`:''}${days.length>1?`<button class="lnk" data-a="ibFoldOld">${foldN?'모두 펼치기':'지난 날짜 접기'}</button>`:''}${unread?'<button class="lnk" data-a="readAll">모두 읽음</button>':''}${wide()?'<span class="ibx-key" title="스페이스바: 안 읽은 소식을 확인할 소식부터 차례로 열고, 다 읽었으면 진행 · J/K: 다음/이전">Space 다음 소식·진행</span>':''}</div></div>`;
  if(!list.length)return bar+`<section class="card ibx-empty"><p class="muted">${f==='task'?'확인할 소식이 없습니다.':'소식이 없습니다.'}</p></section>`;
  const pin=ibPinned(list); const pinS=new Set(pin.map(m=>m.id)); const rest=list.filter(m=>!pinS.has(m.id));
  const all0=pin.concat(rest).map(m=>m.id); const W=wide();
  let sel=[UI.mailFocus,UI.ibSel].find(v=>v&&all0.includes(v));
  if(UI.mailFocus&&!sel&&G.mail.some(m=>m.id===UI.mailFocus)){ UI.mf='all'; return inboxView(); }
  if(UI.mailFocus&&sel&&!W)UI.ibOpen=sel; UI.ibSel=sel||null;
  /* 지난 소식은 최근 lim건까지(고른 소식이 그보다 뒤면 거기까지), 나머지는 맨 아래 '더 보기' */
  const lim=UI.ibN||80; const ri=sel?rest.findIndex(m=>m.id===sel):-1; const cut=Math.max(lim,ri+1); const shown=rest.slice(0,cut);
  const more=rest.length>cut?`<button class="btn small block ibx-more" data-a="ibMore">이전 소식 더 보기 (${rest.length-cut}건)</button>`:'';
  const order=pin.concat(shown); const ids=order.map(m=>m.id); UI._ibOrder=ids; const si=sel?ids.indexOf(sel):-1;
  const nav=sel?`<div class="ibm-nav"><button class="btn small" data-a="mailJump" data-v="${ids[si-1]||''}" ${si>0?'':'disabled'} aria-label="이전 소식">◀</button><span>${si+1}/${ids.length}</span><button class="btn small" data-a="mailJump" data-v="${ids[si+1]||''}" ${si<ids.length-1?'':'disabled'} aria-label="다음 소식">▶</button></div>`:'';
  const groups=[]; for(const m of shown){ const g=groups[groups.length-1]; if(g&&g.d===m.day)g.L.push(m); else groups.push({d:m.day,L:[m]}); }
  const pu=pin.filter(m=>!m.read).length, pn=pin.filter(ibMust).length;
  const pinH=pin.length?`<div class="ibx-g ibx-new"><div class="ibx-day ibx-pinh">안 읽은 소식<span class="ibx-dn">${pu?`<b class="${pn?'warn':''}">${pu}건</b>${pn?` · 확인할 소식 ${pn}`:''}`:'모두 읽음'}</span></div>${pin.map(m=>mailRow(m,m.id===sel).replace('<button ',`<button ${tkAt(m.day)} `)).join('')}</div>`:'';
  const rows=pinH+groups.map(g=>{ const fold=!!F[g.d]&&!(sel&&g.L.some(m=>m.id===sel)); const u=g.L.filter(m=>!m.read).length, nd=g.L.filter(ibMust).length;
    return `<div class="ibx-g${fold?' fold':''}"${sel&&g.L.some(m=>m.id===sel)?'':tkAt(g.d)}><button class="ibx-day" data-a="ibFold" data-v="${g.d}" aria-expanded="${!fold}"><span class="ibx-car">${fold?'▸':'▾'}</span>${ibDay(g.d)}<span class="ibx-dn">${g.L.length}건${u?` · <b class="${nd?'warn':''}">안 읽음 ${u}</b>`:''}</span></button>${fold?'':g.L.map(m=>mailRow(m,m.id===sel)).join('')}</div>`; }).join('')+more;
  if(!W){ if(UI.ibOpen&&ids.includes(UI.ibOpen)){ const m=order[ids.indexOf(UI.ibOpen)];
      return `<div class="ibx-mback"><button class="btn small" data-a="ibBack">◀ 목록</button><span class="small muted">${IB_CAT.find(c=>c[0]===f)[1]}</span></div>${mailCard(m,nav)}`; }
    UI.ibOpen=null; return bar+`<nav class="ibx-list m" aria-label="소식 목록">${rows}</nav>`; }
  const pane=si>=0?mailCard(order[si],nav):`<section class="card ibx-guide"><p>${need?`확인할 소식이 <b>${need}건</b> 있습니다.`:'새로 확인할 소식이 없습니다.'}</p><p class="small muted">왼쪽 목록에서 소식을 고르세요. 스페이스바를 누르면 안 읽은 소식을 확인할 소식부터 차례로 열고, 다 읽었으면 진행합니다.</p>${need?'<button class="btn primary" data-a="ibNeedGo">확인할 소식 열기</button>':''}</section>`;
  return bar+`<div class="ibx"><div class="ibx-lw"><nav class="ibx-list" aria-label="소식 목록">${rows}</nav><button class="ibx-up" data-a="ibTop" hidden>맨 위로 ↑</button></div><div class="ibx-read">${pane}</div></div>`;
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
/* 고른 소식을 목록에서 보이게: 칸 밖이면 가운데 쯤으로 옮기고 잠깐 빛낸다 */
function ibShowCur(L,c,flash){ const lr=L.getBoundingClientRect(), cr=c.getBoundingClientRect(); const a=cr.top-lr.top+L.scrollTop, b=a+cr.height; if(a<L.scrollTop+4||b>L.scrollTop+L.clientHeight-4)L.scrollTop=Math.max(0,a-L.clientHeight/3); if(flash){ c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); } }
function ibTop(){ const t=document.querySelector('.top'); return t?t.offsetHeight:60; }
/* 넓은 화면: 소식함이 창 아래 끝까지 딱 맞게(목록·본문이 각자 스크롤). 목록이 창 밖으로 잘려 보이지 않게 실제 위치로 높이를 잰다 */
function ibFit(){ const X=document.querySelector('.ibx'); if(!X)return; const top=X.getBoundingClientRect().top+window.scrollY; X.style.height=Math.max(320,window.innerHeight-top-14)+'px'; }
if(!window._ibFitOn){ window._ibFitOn=1; window.addEventListener('resize',()=>{ if(UI&&UI.tab==='inbox'&&wide())ibFit(); }); }
function inboxWire(){ document.documentElement.style.setProperty('--ibtop',(ibTop()+8)+'px'); const f=UI.mailFocus; UI.mailFocus=null;
  const L=document.querySelector('.ibx-list'); if(!L)return; const n=G.mail.length;
  if(wide()){ ibFit(); /* 목록 칸 스크롤: 처음 열면 맨 위(안 읽은 소식·최신), 그 뒤로는 보던 위치를 지키고, 맨 위를 보던 중에 새 소식이 오면 맨 위에 머문다 */
    const atTop=UI._ibAtTop!==false; if(UI._ibFirst||(atTop&&UI._ibCnt!==n)){ L.scrollTop=0; } else if(UI._ibLS!=null)L.scrollTop=UI._ibLS;
    const c=L.querySelector('.ibr.cur'); if(c&&(f||UI._ibToCur)){ UI._ibToCur=false; ibShowCur(L,c,true); }
    const up=document.querySelector('.ibx-up'); const upd=()=>{ UI._ibLS=L.scrollTop; UI._ibAtTop=L.scrollTop<=24; if(up){ const lt=L.getBoundingClientRect().top; const k=[...L.querySelectorAll('.ibr.unread')].filter(r=>r.getBoundingClientRect().bottom<lt+4).length; up.hidden=L.scrollTop<200&&!k; up.textContent=k?`안 읽은 소식 ${k}건 ↑`:'맨 위로 ↑'; } }; L.onscroll=upd; upd();
  } else if(!UI.ibOpen){ if(UI._ibFirst||(UI.ibY==null&&UI._ibCnt!==n))window.scrollTo(0,0); else if(UI.ibY!=null&&!f){ window.scrollTo(0,UI.ibY); UI.ibY=null; } }
  UI._ibFirst=false; UI._ibCnt=n; }
function ibStep(d){ const ids=(UI._ibOrder||ibList(UI.mf||'all').map(m=>m.id)).filter(id=>document.querySelector(`.ibr[data-mid="${id}"]`)||id===UI.ibSel); const cur=wide()?UI.ibSel:UI.ibOpen; const i=ids.indexOf(cur); const n=ids[i<0?(d>0?0:ids.length-1):i+d]; if(n)A.mailJump(n); }
/* 스페이스바: 안 읽은 소식 → 하나씩 열기, 없으면 계속 버튼 */
function ibSpace(){ if(UI._spT&&Date.now()-UI._spT<500)return; UI._spT=Date.now(); /* 스페이스바: 안 읽은 소식이 있으면 차례로 연다(확인할 소식 먼저, 그다음 나머지, 오래된 것부터). 다 읽었으면 진행 */
  const u=ibUnreadOrder(); if(u.length){ const m=u[0]; UI.mf='all'; if(UI.tab!=='inbox')A.openMail(m.id); else A.mailJump(m.id); return; }
  if(G.live){ toast('경기를 먼저 끝까지 보세요.'); return; } const bl=blocker(); if(bl&&!G.res){ toast(bl); UI.tab='home'; render(); return; }
  const b=document.querySelector('button.continue:not([disabled])')||document.querySelector('button.continue'); const v=b?b.dataset.v:'next';
  /* 특별한 소식(남은 결정·제안·중요 소식)이 없으면 묻지 않고 바로 진행한다. 설정에서 '진행 전에 묻기'를 켜면 매번 묻는다 */
  let P=[]; try{ P=pendItems(); }catch(e){} if(G.advAsk||P.length){ advAsk(v); return; } A.adv(v); }
/* 경기 정리를 소식으로(진행한 기간): 진행이 끝나면 소식함 맨 아래에 경기 결과와 잘한·부진한 선수를 남긴다(홈의 주간 정리와 같은 내용) */
function digestMail(){ const D=G.dig; if(!D||!D.games||!D.games.length)return;
  const gs=D.games.map(d=>G.games.find(g=>g.day===d&&(g.home===G.user||g.away===G.user))).filter(Boolean);
  const w=gs.filter(g=>g.res==='승').length, l=gs.filter(g=>g.res==='패').length; const rk=userRank();
  const L=gs.map(g=>{ const home=g.home===G.user; const ms=home?g.hs:g.as, os=home?g.as:g.hs; return `${dsh(g.day)} ${home?'vs':'@'} ${tshort(home?g.away:g.home)} ${g.res} ${ms}:${os}`; });
  const rows=[]; for(const p of playersOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); if(!h)continue; const a=D.snap[p.id]||DIGK.map(()=>0); const d={}; DIGK.forEach((k,i)=>d[k]=(h[k]||0)-(a[i]||0));
    if(p.isP){ if(d.outs<3)continue; const era=d.er*27/d.outs; rows.push({p,sc:(d.outs/3)*(4.5-era)/9+d.w*.3+d.sv*.3,t:`${ipStr(d.outs)}이닝 ${d.er}자책`}); }
    else { if(d.pa<5)continue; const ops=d.ab?obpOf(d)+(d.h+d.d+2*d.tr+3*d.hr)/d.ab:0; rows.push({p,sc:(ops-.72)*d.pa/10+d.hr*.2,t:`${d.pa}타석 ${d.h}안타${d.hr?` ${d.hr}홈런`:''} OPS ${fmt3(ops)}`}); } }
  rows.sort((a,b)=>b.sc-a.sc); const hot=rows.filter(x=>x.sc>0).slice(0,3), cold=rows.filter(x=>x.sc<0).slice(-2).reverse();
  const m=mail('전력분석팀',`${dsh(D.from)}~${dsh(D.to)} 경기 정리: ${w}승 ${l}패 · 지금 ${rk}위`,[`${dmd(D.from)}~${dmd(D.to)} ${gs.length}경기 ${w}승 ${l}패. 지금 ${rk}위입니다.`,...L,hot.length?`잘한 선수: ${hot.map(x=>`${x.p.name}(${x.t})`).join(', ')}`:'',cold.length?`부진한 선수: ${cold.map(x=>`${x.p.name}(${x.t})`).join(', ')}`:''].filter(Boolean).join('\n'),{kind:'경기',acts:[{l:'홈에서 자세히',a:'tab',v:'home'},{l:'순위 보기',a:'go',v:'league:stand'}]});
  return m; }
