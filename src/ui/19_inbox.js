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
function mailRow(m,cur){ const need=ibTask(m)&&!m.read; return `<button class="ibr${m.read?'':' unread'}${need?' need':''}${cur?' cur':''}" data-a="mailJump" data-v="${m.id}" data-mid="${m.id}">${senderAv(m)}<span class="ibr-m"><span class="ibr-top"><b class="ibr-from">${esc(m.from)}</b>${ibTask(m)?'<span class="ibr-tag">확인</span>':mailDoneShow(m)?'<span class="ibr-tag done">처리됨</span>':''}<span class="ibr-d">${dsh(m.day)}</span></span><span class="ibr-s">${esc(m.subj)}</span></span></button>`; }
function mailCard(m,nav){ const o=m.oid&&(G.offers||[]).find(x=>x.id===m.oid); const dup=(UI._ibDup||{})[m.id]; const {subj,L}=ibSplit(m);
  const dn=mailDoneShow(m); const acts=m.acts.filter(a=>!(o&&a.a==='goWork')&&!(dn&&/^(evPick|ivOpen|ivSkip|faOpen|faMatch)$/.test(a.a))); /* 끝난 결정·인터뷰·FA 건은 버튼 대신 '처리됨' */ /* 제안 카드가 붙은 메일은 '해당 화면으로' 대신 카드 안의 버튼을 쓴다 */
  return `<article class="ibm mfc${m.read?' rdm':' unread'}" id="m-${m.id}" data-mid="${m.id}">
    <header class="ibm-h">${senderAv(m)}<div class="ibm-t"><div class="ibm-from"><b>${esc(m.from)}</b><span class="pill">${IB_CATN[ibCat(m)]}</span>${ibTask(m)?'<span class="pill warn">확인할 소식</span>':mailDoneShow(m)?'<span class="pill">처리됨</span>':''}</div><h2 class="ibm-s">${lk(subj)}</h2><div class="ibm-d">${G.year===dobj(m.day).y?'':dobj(m.day).y+'년 '}${dmd(m.day)} ${WD[dobj(m.day).w]}요일${dup?` · 같은 소식 ${dup.length+1}건을 묶었습니다`:''}</div></div>${nav||''}</header>
    ${L.length?`<div class="mailbody">${(L.length>4?L.slice(0,2):L).map(t=>`<p>${lk(t)}</p>`).join('')}${L.length>4?`<details class="mfold"><summary>자세히 (${L.length-2}줄 더)</summary>${L.slice(2).map(t=>`<p>${lk(t)}</p>`).join('')}</details>`:''}</div>`:''}
    ${m.rv?rvActsH(m):''}${handOffBtns(m)}
    ${acts.length&&!(m.oid&&!o)?`<div class="ibm-acts">${acts.map(a=>`<button class="btn${a===acts[0]?' primary':''}" data-a="mailAct" data-v="${m.id}:${m.acts.indexOf(a)}">${esc(a.l)}</button>`).join('')}</div>`:''}
    ${o?offerOne(o):m.oid?'<p class="small muted"><span class="pill">끝난 제안</span> 이미 답했거나 기한이 지났습니다.</p>':''}</article>`; }
/* 처리할 메일: 안 읽었고 중요하거나 업무·버튼·제안이 있는 것. 상단 숫자는 이것만 센다 */
const mailNeeds=m=>!m.read&&(m.imp||m.kind==='업무'||(m.acts&&m.acts.length>0)||!!m.oid);
/* ===== 소식함(FM 수신함 방식) =====
 - 소식은 시간 순서로 아래에 계속 쌓인다(가장 새 소식이 맨 아래). 날짜별로 묶고, 날짜 머리를 누르면 그 날짜를 접고 편다.
 - 접기는 단장만 한다. 시간이 지났다고 저절로 접거나 읽음 처리하지 않는다. 접힌 날짜에 안 읽은 소식이 있으면 머리에 표시된다.
 - 저절로 소식을 골라 열지 않는다(고른 것만 읽음). 날짜가 바뀌어도 보던 위치를 지킨다.
 - 스페이스바(와 '계속' 버튼): 확인할 소식(안 읽은 중요·업무·버튼·제안 소식)이 있으면 가장 오래된 것부터 연다. 없으면 진행한다. */
function ibList(f){ let list=mailFilter(f); const seen={}; UI._ibDup={}; const keep=UI.mailFocus||UI.ibSel||UI.ibOpen;
  list=list.filter(m=>{ if(m.oid||(m.acts&&m.acts.length&&!m.read)||m.id===keep)return true; const k=m.from+'|'+m.subj; if(seen[k]!=null){ (UI._ibDup[seen[k]]=UI._ibDup[seen[k]]||[]).push(m.id); return false; } seen[k]=m.id; return true; });
  return list.slice().reverse(); } /* G.mail은 새 소식이 앞: 화면은 오래된 것부터 */
function contSub(def){ const n=ibNeedList().length; return n?`확인할 소식 ${n}건`:def; }
/* 반드시 확인할 소식: 안 읽었고, 답이 필요하거나(살아 있는 제안·인터뷰) 중요 표시·업무 소식. 단순히 '선수 보기' 버튼만 있는 소식은 넣지 않는다 */
const ibMust=m=>!m.read&&!mailDone(m)&&(ibTask(m)||m.kind==='업무');
function ibNeedList(){ return G.mail.filter(ibMust).slice().reverse(); }
function ibFolds(){ return G.ibFold=G.ibFold||{}; }
function inboxView(){
  if(!['all','task','squad','move','club','media'].includes(UI.mf))UI.mf='all'; const f=UI.mf;
  const list=ibList(f); const unread=G.mail.filter(m=>!m.read).length; const need=ibNeedList().length;
  const cnt=k=>mailFilter(k).filter(m=>!m.read).length; const F=ibFolds();
  const days=[...new Set(list.map(m=>m.day))]; const foldN=days.filter(d=>F[d]).length;
  const bar=`<div class="ibx-bar"><div class="ibx-tabs" role="tablist">${IB_CAT.map(([k,l])=>{ const n=k==='all'?0:cnt(k); return `<button role="tab" data-a="mf" data-v="${k}" class="${f===k?'on':''}${k==='task'&&n?' hot':''}"><span class="ibl">${l}</span><span class="ibs">${IB_CATS[k]}</span>${n?`<i>${n}</i>`:''}</button>`; }).join('')}</div>
    <div class="ibx-meta"><span>안 읽음 <b id="ib-unread">${unread}</b></span>${need?`<button class="lnk ibx-need" data-a="ibNeedGo">확인할 소식 ${need}건</button>`:''}${days.length>1?`<button class="lnk" data-a="ibFoldOld">${foldN?'모두 펼치기':'지난 날짜 접기'}</button>`:''}${unread?'<button class="lnk" data-a="readAll">모두 읽음</button>':''}${wide()?'<span class="ibx-key" title="스페이스바: 안 읽은 소식을 확인할 소식부터 차례로 열고, 다 읽었으면 진행 · J/K: 다음/이전">Space 다음 소식·진행</span>':''}</div></div>`;
  if(!list.length)return bar+`<section class="card ibx-empty"><p class="muted">${f==='task'?'확인할 소식이 없습니다.':'소식이 없습니다.'}</p></section>`;
  const ids=list.map(m=>m.id); const W=wide();
  let sel=[UI.mailFocus,UI.ibSel].find(v=>v&&ids.includes(v));
  if(UI.mailFocus&&!sel&&G.mail.some(m=>m.id===UI.mailFocus)){ UI.mf='all'; return inboxView(); }
  if(UI.mailFocus&&sel&&!W)UI.ibOpen=sel; UI.ibSel=sel||null;
  const si=sel?ids.indexOf(sel):-1;
  const nav=sel?`<div class="ibm-nav"><button class="btn small" data-a="mailJump" data-v="${ids[si-1]||''}" ${si>0?'':'disabled'} aria-label="이전 소식">◀</button><span>${si+1}/${ids.length}</span><button class="btn small" data-a="mailJump" data-v="${ids[si+1]||''}" ${si<ids.length-1?'':'disabled'} aria-label="다음 소식">▶</button></div>`:'';
  /* 오래된 소식은 더 보기로: 최근 lim건(고른 소식이 그보다 앞이면 거기까지) */
  const lim=UI.ibN||80; const from=Math.max(0,Math.min(list.length-lim,si>=0?si:list.length)); const shown=list.slice(from);
  const more=from>0?`<button class="btn small block ibx-more" data-a="ibMore">이전 소식 더 보기 (${from}건)</button>`:'';
  const groups=[]; for(const m of shown){ const g=groups[groups.length-1]; if(g&&g.d===m.day)g.L.push(m); else groups.push({d:m.day,L:[m]}); }
  const rows=more+groups.map(g=>{ const fold=!!F[g.d]&&!(sel&&g.L.some(m=>m.id===sel)); const u=g.L.filter(m=>!m.read).length, nd=g.L.filter(ibMust).length;
    return `<div class="ibx-g${fold?' fold':''}"><button class="ibx-day" data-a="ibFold" data-v="${g.d}" aria-expanded="${!fold}"><span class="ibx-car">${fold?'▸':'▾'}</span>${ibDay(g.d)}<span class="ibx-dn">${g.L.length}건${u?` · <b class="${nd?'warn':''}">안 읽음 ${u}</b>`:''}</span></button>${fold?'':g.L.map(m=>mailRow(m,m.id===sel)).join('')}</div>`; }).join('');
  if(!W){ if(UI.ibOpen&&ids.includes(UI.ibOpen)){ const m=list[ids.indexOf(UI.ibOpen)];
      return `<div class="ibx-mback"><button class="btn small" data-a="ibBack">◀ 목록</button><span class="small muted">${IB_CAT.find(c=>c[0]===f)[1]}</span></div>${mailCard(m,nav)}`; }
    UI.ibOpen=null; return bar+`<nav class="ibx-list m" aria-label="소식 목록">${rows}<div class="ibx-end">가장 최근 소식입니다 · ${ibDay(G.day)}</div></nav>`; }
  const pane=si>=0?mailCard(list[si],nav):`<section class="card ibx-guide"><p>${need?`확인할 소식이 <b>${need}건</b> 있습니다.`:'새로 확인할 소식이 없습니다.'}</p><p class="small muted">왼쪽 목록에서 소식을 고르세요. 스페이스바를 누르면 안 읽은 소식을 확인할 소식부터 차례로 열고, 다 읽었으면 진행합니다.</p>${need?'<button class="btn primary" data-a="ibNeedGo">확인할 소식 열기</button>':''}</section>`;
  const end=`<div class="ibx-end">가장 최근 소식입니다 · ${ibDay(G.day)}</div>`;
  return bar+`<div class="ibx"><div class="ibx-lw"><nav class="ibx-list" aria-label="소식 목록">${rows}${end}</nav><button class="ibx-down" data-a="ibDown" hidden>최신 소식으로 ↓</button></div><div class="ibx-read">${pane}</div></div>`;
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
/* 넓은 화면: 소식함이 창 아래 끝까지 딱 맞게(목록·본문이 각자 스크롤). 목록이 창 밖으로 잘려 보이지 않게 실제 위치로 높이를 잰다 */
function ibFit(){ const X=document.querySelector('.ibx'); if(!X)return; const top=X.getBoundingClientRect().top+window.scrollY; X.style.height=Math.max(320,window.innerHeight-top-14)+'px'; }
if(!window._ibFitOn){ window._ibFitOn=1; window.addEventListener('resize',()=>{ if(UI&&UI.tab==='inbox'&&wide())ibFit(); }); }
function inboxWire(){ document.documentElement.style.setProperty('--ibtop',(ibTop()+8)+'px'); const f=UI.mailFocus; UI.mailFocus=null;
  const L=document.querySelector('.ibx-list'); if(!L)return; const n=G.mail.length;
  if(wide()){ ibFit(); /* 목록 칸 스크롤: 처음 열면 맨 아래(최신), 그 뒤로는 보던 위치를 지키고, 맨 아래를 보던 중에 새 소식이 오면 따라 내려간다 */
    const atEnd=UI._ibEnd!==false; if(UI._ibFirst||(atEnd&&UI._ibCnt!==n)){ L.scrollTop=L.scrollHeight; } else if(UI._ibLS!=null)L.scrollTop=UI._ibLS;
    const c=L.querySelector('.ibr.cur'); if(c&&(f||UI._ibToCur)){ UI._ibToCur=false; const a=c.offsetTop, b=a+c.offsetHeight; if(a<L.scrollTop||b>L.scrollTop+L.clientHeight)L.scrollTop=a-L.clientHeight/3; }
    const dn=document.querySelector('.ibx-down'); const upd=()=>{ UI._ibLS=L.scrollTop; UI._ibEnd=L.scrollTop+L.clientHeight>=L.scrollHeight-24; if(dn)dn.hidden=UI._ibEnd; }; L.onscroll=upd; upd();
  } else if(!UI.ibOpen){ if(UI._ibFirst||(UI.ibY==null&&UI._ibCnt!==n))window.scrollTo(0,document.documentElement.scrollHeight); else if(UI.ibY!=null&&!f){ window.scrollTo(0,UI.ibY); UI.ibY=null; } }
  UI._ibFirst=false; UI._ibCnt=n; }
function ibStep(d){ const ids=ibList(UI.mf||'all').map(m=>m.id).filter(id=>document.querySelector(`.ibr[data-mid="${id}"]`)||id===UI.ibSel); const cur=wide()?UI.ibSel:UI.ibOpen; const i=ids.indexOf(cur); const n=ids[i<0?(d>0?0:ids.length-1):i+d]; if(n)A.mailJump(n); }
/* 스페이스바: 안 읽은 소식 → 하나씩 열기, 없으면 계속 버튼 */
function ibSpace(){ if(UI._spT&&Date.now()-UI._spT<500)return; UI._spT=Date.now(); /* 스페이스바: 안 읽은 소식이 있으면 차례로 연다(확인할 소식 먼저, 그다음 나머지, 오래된 것부터). 다 읽었으면 진행 */
  const n=ibNeedList(); const u=n.length?n:G.mail.filter(m=>!m.read).slice().reverse(); if(u.length){ const m=u[0]; UI.mf='all'; if(UI.tab!=='inbox')A.openMail(m.id); else A.mailJump(m.id); return; }
  if(G.live){ toast('경기를 먼저 끝까지 보세요.'); return; } const bl=blocker(); if(bl&&!G.res){ toast(bl); UI.tab='home'; render(); return; }
  const b=document.querySelector('button.continue:not([disabled])')||document.querySelector('button.continue'); advAsk(b?b.dataset.v:'next'); /* 진행 전에 어디까지 가는지 묻고, 스페이스바를 한 번 더 누르면 진행 */ }
/* 경기 정리를 소식으로(진행한 기간): 진행이 끝나면 소식함 맨 아래에 경기 결과와 잘한·부진한 선수를 남긴다(홈의 주간 정리와 같은 내용) */
function digestMail(){ const D=G.dig; if(!D||!D.games||!D.games.length)return;
  const gs=D.games.map(d=>G.games.find(g=>g.day===d&&(g.home===G.user||g.away===G.user))).filter(Boolean);
  const w=gs.filter(g=>g.res==='승').length, l=gs.filter(g=>g.res==='패').length; const rk=userRank();
  const L=gs.map(g=>{ const home=g.home===G.user; const ms=home?g.hs:g.as, os=home?g.as:g.hs; return `${dsh(g.day)} ${home?'vs':'@'} ${tshort(home?g.away:g.home)} ${g.res} ${ms}:${os}`; });
  const rows=[]; for(const p of playersOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); if(!h)continue; const a=D.snap[p.id]||DIGK.map(()=>0); const d={}; DIGK.forEach((k,i)=>d[k]=(h[k]||0)-a[i]);
    if(p.isP){ if(d.outs<3)continue; const era=d.er*27/d.outs; rows.push({p,sc:(d.outs/3)*(4.5-era)/9+d.w*.3+d.sv*.3,t:`${ipStr(d.outs)}이닝 ${d.er}자책`}); }
    else { if(d.pa<5)continue; const ops=d.ab?(d.h+d.bb)/Math.max(1,d.pa)+(d.h+d.d+2*d.tr+3*d.hr)/d.ab:0; rows.push({p,sc:(ops-.72)*d.pa/10+d.hr*.2,t:`${d.pa}타석 ${d.h}안타${d.hr?` ${d.hr}홈런`:''} OPS ${fmt3(ops)}`}); } }
  rows.sort((a,b)=>b.sc-a.sc); const hot=rows.filter(x=>x.sc>0).slice(0,3), cold=rows.filter(x=>x.sc<0).slice(-2).reverse();
  const m=mail('전력분석팀',`${dsh(D.from)}~${dsh(D.to)} 경기 정리: ${w}승 ${l}패 · 지금 ${rk}위`,[`${dmd(D.from)}~${dmd(D.to)} ${gs.length}경기 ${w}승 ${l}패. 지금 ${rk}위입니다.`,...L,hot.length?`잘한 선수: ${hot.map(x=>`${x.p.name}(${x.t})`).join(', ')}`:'',cold.length?`부진한 선수: ${cold.map(x=>`${x.p.name}(${x.t})`).join(', ')}`:''].filter(Boolean).join('\n'),{kind:'경기',acts:[{l:'홈에서 자세히',a:'tab',v:'home'},{l:'순위 보기',a:'go',v:'league:stand'}]});
  return m; }
