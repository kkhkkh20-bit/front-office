/* ---------- 소식함 페이지: 왼쪽 목록, 오른쪽 본문이 이어지는 피드 ---------- */
/* ---------- 소식함(FM 수신함 구조): 분류 탭 · 왼쪽 목록(보낸 사람/제목/날짜) · 오른쪽 본문 ----------
   목록은 한 줄 요약만, 본문은 한 통만 펼친다. 모바일은 목록 → 눌러서 본문 → '목록' 버튼으로 돌아온다 */
const IB_KIND={squad:'부상 복귀 회복 부하 선수 감독 엔트리 결정 육성 캠프 병역 의무 코치 연수 면담 경기 bat boost',move:'트레이드 FA fa 외국인 용병 아시아 연봉 드래프트 스카우트 스토브리그',club:'구단주 재정 시설 구장 스폰서 스태프 전력분석 분석 운영 결재 일정 월간 업무 결산 새해 취임 체험판 일반',media:'언론 기록 OB 경력 포스트시즌'};
const IB_CAT=[['all','전체'],['task','확인할 소식'],['squad','선수단'],['move','이적·계약'],['club','구단 운영'],['media','언론·기록']];
const IB_CATS={all:'전체',task:'확인',squad:'선수단',move:'이적',club:'운영',media:'언론'}; /* 휴대폰 탭 이름(한 줄에 다 들어가게) */
function ibCat(m){ for(const k in IB_KIND)if(IB_KIND[k].split(' ').includes(m.kind))return k; return 'club'; }
const IB_CATN={squad:'선수단',move:'이적·계약',club:'구단 운영',media:'언론·기록'};
/* 이미 처리된 일인가: 결정(이벤트)이 끝났거나, 소식이 알린 상황이 해결됐으면 '처리됨'. 안 읽음 표시는 그대로 두고 '확인할 소식'에서만 뺀다 */
const mailDoneShow=m=>(m.imp||m.kind==='업무'||m.kind==='결정'||(m.acts&&m.acts.length>0)||!!m.oid)&&mailDone(m);
/* 완료는 구단/시즌의 새 업무와 분리해 보존한다. 읽음 처리는 기존 인터뷰 규칙만 따른다. */
function ibAutoRead(){ for(const m of (G.mail||[])){const st=mailStatus(m);if(st&&!m.closed)m.closed=st;if(!m.read&&/^\[인터뷰 요청\]/.test(m.subj)&&st)m.read=true;} }
function mailDone(m){return !!mailStatus(m);}
/* 결정할 일: 읽었어도 수락·거절·선택하기 전까지 남는 일(트레이드 제안·결정 이벤트·인터뷰). 마감일 */
function ibDecide(m){ if(mailDone(m))return false; if(m.oid)return (G.offers||[]).some(o=>o.id===m.oid); if(/^\[인터뷰 요청\]/.test(m.subj))return !!(G.iv&&!G.iv.done&&m.day>=G.iv.day); return (m.acts||[]).some(a=>a.a==='evPick'); }
function ibDue(m){ if(m.oid){ const o=(G.offers||[]).find(x=>x.id===m.oid); return o&&o.exp!=null?o.exp:null; } if(/^\[인터뷰 요청\]/.test(m.subj))return G.iv?G.iv.exp:null; const a=(m.acts||[]).find(x=>x.a==='evPick'); if(a){ const e=(G.evs||[]).find(x=>x.id===String(a.v).split(':')[0]); return e?e.exp:null; } return null; }
function ibDecideList(){ return G.mail.filter(ibDecide).sort((a,b)=>(ibDue(a)??1e9)-(ibDue(b)??1e9)); } /* 마감 빠른 순 */
function mailEvPick(m){ const a=(m.acts||[]).find(x=>x.a==='evPick'); const e=a&&(G.evs||[]).find(x=>x.id===String(a.v).split(':')[0]); return e&&e.pick!=null&&e.opts[e.pick]?` · "${e.opts[e.pick].l}"${e.auto?'(기본안)':''}`:''; }
/* 처리할 일: 결재·제안처럼 답이 필요한 소식(이미 끝난 일은 뺀다) */
function ibTask(m){ if(mailDone(m))return false; if(m.oid)return (G.offers||[]).some(o=>o.id===m.oid); /* 살아 있는 트레이드 제안 */
  if(/^\[인터뷰 요청\]/.test(m.subj))return !!(G.iv&&!G.iv.done&&m.day>=G.iv.day); /* 아직 응하지 않은 인터뷰 */
  return m.imp&&!m.read&&stopOn(m)&&!(m.kind==='트레이드'&&/원한다/.test(m.subj)); } /* 현재 중단 설정에 해당하는 결재·중요 소식 */
function mailFilter(f){ return G.mail.filter(m=>f==='all'||(f==='task'?(ibTask(m)||ibMust(m)):f==='unread'?!m.read:f==='player'?typeof m.face==='number':ibCat(m)===f)); }
function ibDay(d){ const k=G.day-d; if(k===0)return '오늘'; if(k===1)return '어제'; return `${dmd(d)} (${WD[dobj(d).w]})`; }
/* 제목이 본문 첫 문장을 그대로 잘라 만든 경우(stop·note) 본문에서 겹치는 부분을 덜어 낸다 */
function ibSplit(m){ let subj=m.subj, L=m.body.split('\n').filter(Boolean); const s0=subj.replace(/…$/,''); if(L.length&&L[0].startsWith(s0)){
    if(subj.endsWith('…')){ const i=L[0].search(/[.!?](\s|$)/); subj=i>0&&i<90?L[0].slice(0,i):L[0].length<=90?L[0].replace(/[.]$/,''):subj; }
    const rest=L[0].slice(subj.replace(/…$/,'').length).replace(/^[.!?]\s*/,'').trim(); if(L[0].startsWith(subj.replace(/…$/,''))){ if(rest)L[0]=rest; else L.shift(); } }
  return {subj,L}; }
const warnLive=m=>!!m.warn&&!mailDone(m)&&G.day<=m.day+1; /* '내일까지' 경고는 그날·다음 날만. 이미 처리됐으면 지운다 */
function mailRow(m,cur){ const fin=mailDone(m)&&((m.acts||[]).length>0||!!m.oid||/^\[인터뷰 요청\]/.test(m.subj)); /* 끝난 인터뷰·결정: 참여한 일이라 강조하지 않는다 */ const need=!fin&&ibTask(m)&&!m.read; return `<button class="ibr${m.read||fin?'':' unread'}${need?' need':''}${fin?' fin':''}${cur?' cur':''}" data-a="mailJump" data-v="${m.id}" data-mid="${m.id}">${senderAv(m)}<span class="ibr-m"><span class="ibr-top"><b class="ibr-from">${esc(m.from)}</b>${warnLive(m)?'<span class="ibr-tag">기한 내일</span>':ibDecide(m)&&m.read?`<span class="ibr-tag">검토 중${ibDue(m)!=null?' · D-'+Math.max(0,ibDue(m)-G.day):''}</span>`:ibTask(m)?'<span class="ibr-tag">확인</span>':mailDoneShow(m)?`<span class="ibr-tag done">${mailStatus(m).label}</span>`:''}<span class="ibr-d">${dsh(m.day)}</span></span><span class="ibr-s">${esc(m.subj)}</span></span></button>`; }
function mailCard(m,nav){
  /* 이전 저장의 방문 소식도 장소 이동을 요구하지 않는 안내로 표시한다. 원본·행동 인덱스는 유지한다. */
  if(m.subj.includes('감독이 단장실에 들렀습니다'))m={...m,body:m.body.replace('더 이야기하려면 감독실로 가세요.','더 이야기를 나누려면 감독과 면담하세요.'),acts:(m.acts||[]).map(a=>a.a==='meetOpen'&&a.l==='감독실 들어가기'?{...a,l:'감독과 면담하기'}:a)};
  const o=m.oid&&(G.offers||[]).find(x=>x.id===m.oid); const dup=(UI._ibDup||{})[m.id]; const {subj,L:L0}=ibSplit(m);
  let fth=null; if(m.fth){ try{ fth=fanThreads().find(t=>t.id===m.fth)||null; }catch(e){} }
  /* 팬 게시판 소식: 댓글은 아래 게시판 블록에만 보여 준다(본문에 같은 댓글을 글로 한 번 더 쓰지 않는다) */
  const L=fth?L0.filter(t=>!/^댓글 분위기:/.test(t)&&!/\(추천 [\d,]+\)$/.test(t)):L0;
  const status=mailStatus(m); const doneA=(m.acts||[]).filter(a=>a.done&&a.res); const acts=(m.acts||[]).filter(a=>!(o&&!status&&a.a==='goWork'));
  const finM=mailDone(m)&&((m.acts||[]).length>0||!!m.oid||/^\[인터뷰 요청\]/.test(m.subj)); return `<article class="ibm mfc${m.read||finM?' rdm':' unread'}" id="m-${m.id}" data-mid="${m.id}">
    <header class="ibm-h">${senderAv(m)}<div class="ibm-t"><div class="ibm-from"><b>${esc(m.from)}</b><span class="pill">${IB_CATN[ibCat(m)]}</span>${ibTask(m)?'<span class="pill warn">확인할 소식</span>':mailDoneShow(m)?`<span class="pill">${esc(status.label)}</span>`:''}</div><h2 class="ibm-s">${lk(subj)}</h2><div class="ibm-d">${G.year===dobj(m.day).y?'':dobj(m.day).y+'년 '}${dmd(m.day)} ${WD[dobj(m.day).w]}요일${m.day0!=null&&m.day0!==m.day?` · 처음 받은 날 ${dmd(m.day0)}`:''}${dup?` · 같은 소식 ${dup.length+1}건을 묶었습니다`:''}</div></div>${nav||''}</header>
    ${status?`<div class="note ibm-status" role="status"><b>${esc(status.label)}</b><span>${esc(status.text)}${mailEvPick(m)} 아래는 받았던 당시 내용입니다.</span></div>`:warnLive(m)?`<div class="note warn ibm-warn">기한 임박: ${esc(m.warn)}</div>`:''}
    ${L.length?`<div class="mailbody">${(L.length>4?L.slice(0,2):L).map(t=>`<p>${lk(t)}</p>`).join('')}${L.length>4?`<details class="mfold" data-k="mf:${m.id}" ${UI.open['mf:'+m.id]?'open':''}><summary>자세히 (${L.length-2}줄 더)</summary>${L.slice(2).map(t=>`<p>${lk(t)}</p>`).join('')}</details>`:''}</div>`:''}
    ${fth?`<div class="ibm-fth"><div class="small muted">댓글 ${fth.cm.length}개${(()=>{ try{ return ` · 분위기: ${fpMood(fth.cm)}`; }catch(e){ return ''; } })()}</div><div class="fcms">${fth.cm.map(cmtRow).join('')}</div></div>`:''}
    ${m.rv?rvActsH(m):''}${handOffBtns(m)}
    ${doneA.length?`<div class="ibm-res">${doneA.map(a=>`<p class="note good small">${esc(a.res)}</p>`).join('')}</div>`:''}${acts.length?`<div class="ibm-acts">${acts.map(a=>mailActionHTML(m,a,m.acts.indexOf(a))).join('')}</div>`:''}
    ${o&&!status?offerOne(o):m.oid?'<p class="small muted"><span class="pill">끝난 제안</span> 이미 답했거나 기한이 지났습니다.</p>':''}</article>`; }
/* 상단 숫자와 계속 버튼은 동일한 현재 미처리 업무만 센다. 단순 안내·보고는 제외한다. */
const mailNeeds=m=>ibMust(m);
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
/* 반드시 확인할 소식: 살아 있는 결정·제안·인터뷰와 중단 설정에 해당하는 중요 소식. 안내 버튼만 있는 소식은 넣지 않는다. */
const ibMust=m=>!m.read&&!mailDone(m)&&stopOn(m)&&(ibTask(m)||ibDecide(m));
function ibNeedList(){ return G.mail.filter(ibMust); } /* 최신부터(화면 순서) */
/* 스페이스바·'안 읽음'이 여는 순서: 확인할 소식 먼저, 그다음 나머지 안 읽은 소식(각각 최신부터) = 화면 맨 위 묶음 순서 */
function ibUnreadOrder(){ const u=G.mail.filter(m=>!m.read); return u.filter(ibMust).concat(u.filter(m=>!ibMust(m))).reverse(); } /* 화면 맨 위 묶음의 맨 아래(가장 오래된)부터 위로 올라가며 연다 */
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
    <div class="ibx-meta">${unread?`<button class="lnk ibx-ur" data-a="ibUnreadGo" title="가장 오래된 안 읽은 소식으로">안 읽음 <b id="ib-unread">${unread}</b></button>`:`<span>안 읽음 <b id="ib-unread">0</b></span>`}${need?`<button class="lnk ibx-need" data-a="ibNeedGo">확인할 소식 ${need}건</button>`:''}${(()=>{ const D=ibDecideList(); return D.length?`<button class="lnk ibx-need" data-a="ibDecideGo" title="읽었어도 아직 답하지 않은 일(마감 빠른 순)">결정할 일 ${D.length}건${ibDue(D[0])!=null?` · 가장 빠른 마감 D-${Math.max(0,ibDue(D[0])-G.day)}`:''}</button>`:''; })()}${days.length>1?`<button class="lnk" data-a="ibFoldOld">${foldN?'모두 펼치기':'지난 날짜 접기'}</button>`:''}${unread?'<button class="lnk" data-a="readAll">모두 읽음</button>':''}${wide()?'<span class="ibx-key" title="스페이스바: 안 읽은 소식을 확인할 소식부터 차례로 열고, 다 읽었으면 진행 · J/K: 다음/이전">Space 다음 소식·진행</span>':''}</div></div>`;
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
  const pane=si>=0?(fmOn()?`<div class="ibx-fm">${mailCard(order[si],nav)}${ibAtt(order[si])}</div>`:mailCard(order[si],nav)):fmOn()?ibDash(need):`<section class="card ibx-guide"><p>${need?`확인할 소식이 <b>${need}건</b> 있습니다.`:'새로 확인할 소식이 없습니다.'}</p><p class="small muted">왼쪽 목록에서 소식을 고르세요. 스페이스바를 누르면 안 읽은 소식을 확인할 소식부터 차례로 열고, 다 읽었으면 진행합니다.</p>${need?'<button class="btn primary" data-a="ibNeedGo">확인할 소식 열기</button>':''}</section>`;
  return bar+`<div class="ibx"><div class="ibx-lw">${fmOn()&&si>=0?ibFrom(order[si]):''}<nav class="ibx-list" aria-label="소식 목록">${rows}</nav><button class="ibx-up" data-a="ibTop" hidden>맨 위로 ↑</button></div><div class="ibx-read">${pane}</div></div>`;
}
/* PC(FM식): 목록 칸 위에 보낸 사람 큰 얼굴, 소식 본문 아래에 첨부 자료 상자들(관련 선수·능력·기록·같은 사람의 소식) */
function ibPid(m){ return typeof m.face==='number'&&G.players[m.face]?m.face:m.ref!=null&&G.players[m.ref]?m.ref:null; }
function ibFrom(m){ return `<div class="ibs-from"><div class="ibs-face">${senderAv(m)}</div><b>${esc(m.from)}</b><span>${IB_CATN[ibCat(m)]||'소식'} · ${dmd(m.day)} ${WD[dobj(m.day).w]}요일</span></div>`; }
function ibAtt(m){ const pid=ibPid(m), p=pid!=null?G.players[pid]:null, row=(l,v)=>`<div class="pf-fact"><span>${l}</span><b>${v}</b></div>`, T=[];
  if(p){ const rp=scoutReport(p), h=seasonTotal(p,G.year,'1군'), cur=rp.cur==null?'?':dv(rp.cur), pot=rp.ofp==null?'미확인':potTierP(rp,p).s;
    T.push(`<section class="card ibs-box ibs-pl"><h3>관련 선수</h3><div class="ibs-plh">${avImg(p,true)}<div><b>${esc(p.name)}</b><span>${esc(posLabel(p))} · ${p.age}세${p.team!=null?' · '+esc(tshort(p.team)):''}</span></div></div><div class="ibs-key"><div><span>현재 종합</span><b style="color:${rp.cur!=null?rcol(rp.cur):'var(--muted)'}">${cur}</b></div><div><span>잠재력</span><b class="t">${esc(pot)}</b></div></div><button class="btn small block" data-a="player" data-v="${p.id}">선수 정보 보기</button></section>`);
    const keys=p.isP?['stf','ctl','sta']:['con','pow','eye','spd','def','vit'], tl=keys.map(k=>{ const t=(rp.tools||[]).find(t=>t.k===k); return t?{k,v:rp.exact?p.r[k]:t.cur}:null; }).filter(Boolean);
    if(tl.length)T.push(`<section class="card ibs-box"><h3>핵심 능력</h3><div class="ibs-core">${tl.map(t=>`<div><span>${TOOLK[t.k]}</span><b style="color:${rcol(t.v)}">${dv(t.v)}</b></div>`).join('')}</div>${l10Text(p)?`<p class="ibs-form">${l10Text(p)}</p>`:''}</section>`);
    T.push(`<section class="card ibs-box"><h3>기록·계약</h3>${row('올해 1군',esc(statLine(h,p)))}${row('연봉',money(p.sal||0))}${row('계약',esc(ctText(p)))}${row('병역',esc(milText(p)))}${p.injOut>0?row('부상','약 '+p.injOut+'일 이탈'):row('컨디션','피로 '+Math.round(p.fat||0))}</section>`); }
  const same=G.mail.filter(x=>x.from===m.from&&x.id!==m.id).slice(0,6), cat=G.mail.filter(x=>x.id!==m.id&&x.from!==m.from&&ibCat(x)===ibCat(m)).slice(0,6);
  const li=x=>`<button class="ibs-li" data-a="mailJump" data-v="${x.id}"><span>${dmd(x.day)}${x.from!==m.from?' · '+esc(x.from):''}</span><b>${esc(x.subj)}</b></button>`;
  T.push(`<section class="card ibs-box"><h3>${esc(m.from)}의 다른 소식</h3>${same.length?same.map(li).join(''):'<p class="small muted">다른 소식이 없습니다.</p>'}</section>`);
  if(!p)T.push(`<section class="card ibs-box"><h3>같은 분류 최근 소식 · ${IB_CATN[ibCat(m)]||''}</h3>${cat.length?cat.map(li).join(''):'<p class="small muted">다른 소식이 없습니다.</p>'}</section>`);
  return `<div class="ibx-att" data-n="${T.length}">${T.join('')}</div>`; }
/* PC(FM식): 소식을 고르기 전 오른쪽은 빈 안내 대신 요약 상자들 */
function ibDash(need){ const N=ibNeedList().slice(0,6), D=ibDecideList().slice(0,6), cats=IB_CAT.filter(c=>!['all','task'].includes(c[0]));
  const li=x=>`<button class="ibs-li" data-a="mailJump" data-v="${x.id}"><span>${dmd(x.day)} · ${esc(x.from)}</span><b>${esc(x.subj)}</b></button>`;
  const latest=G.mail.slice(0,8);
  return `<div class="ibx-dash"><section class="card ibs-box"><h3>확인할 소식 <em>${need}건</em></h3>${N.length?N.map(li).join(''):'<p class="small muted">새로 확인할 소식이 없습니다.</p>'}${need?'<button class="btn primary small block" data-a="ibNeedGo">확인할 소식 차례로 열기</button>':''}</section>
    <section class="card ibs-box"><h3>결정할 일 <em>${D.length}건</em></h3>${D.length?D.map(x=>li(x).replace('</span>',ibDue(x)!=null?` · D-${Math.max(0,ibDue(x)-G.day)}</span>`:'</span>')).join(''):'<p class="small muted">답을 기다리는 일이 없습니다.</p>'}</section>
    <section class="card ibs-box"><h3>분류별 안 읽음</h3><div class="ibs-cats">${cats.map(([k,l])=>{ const n=mailFilter(k).filter(m=>!m.read).length; return `<button data-a="mf" data-v="${k}"><span>${l}</span><b>${n}</b></button>`; }).join('')}</div><p class="small muted">스페이스바를 누르면 안 읽은 소식을 확인할 소식부터 차례로 열고, 다 읽었으면 진행합니다.</p></section>
    <section class="card ibs-box"><h3>최근 소식</h3>${latest.map(li).join('')}</section></div>`; }
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
function ibFit(){ const main=document.querySelector('#app main.content');if(UI.tab!=='inbox'||!main)return;main.classList.add('inbox-workspace');const X=main.querySelector('.ibx');if(X)X.style.height=''; }
if(!window._ibFitOn){ window._ibFitOn=1; window.addEventListener('resize',()=>{ if(UI&&UI.tab==='inbox'&&wide())ibFit(); }); }
function inboxWire(){ ibFit();document.documentElement.style.setProperty('--ibtop',(ibTop()+8)+'px'); const f=UI.mailFocus; UI.mailFocus=null;
  const L=document.querySelector('.ibx-list'); if(!L)return; const n=G.mail.length;
  { /* 목록 칸 스크롤: 휴대폰도 페이지 대신 목록 안에서 이동하고 돌아오면 그 위치를 지킨다. */
    const atTop=UI._ibAtTop!==false; if(UI._ibFirst||(atTop&&UI._ibCnt!==n)){ L.scrollTop=0; } else if(UI._ibLS!=null)L.scrollTop=UI._ibLS;
    const c=L.querySelector('.ibr.cur'); if(c&&(f||UI._ibToCur)){ UI._ibToCur=false; ibShowCur(L,c,true); }
    const up=document.querySelector('.ibx-up'); const upd=()=>{ UI._ibLS=L.scrollTop; UI._ibAtTop=L.scrollTop<=24; if(up){ const lt=L.getBoundingClientRect().top; const k=[...L.querySelectorAll('.ibr.unread')].filter(r=>r.getBoundingClientRect().bottom<lt+4).length; up.hidden=L.scrollTop<200&&!k; up.textContent=k?`안 읽은 소식 ${k}건 ↑`:'맨 위로 ↑'; } }; L.onscroll=upd; upd();
  }
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
/* 분석팀 해석: 선발·불펜 자책, 실점이 몰린 투수, 득점력. 판단 강도(관찰·점검·보강 검토)는 경기 후 보고와 같은 기준 */
function digAnalysis(gs){ let so=0,se=0,ro=0,re=0,rs=0; const by={}; for(const g of gs){ const k=g.home===G.user?'h':'a'; const P=(g.box&&g.box[k]&&g.box[k].pit)||[]; P.forEach((q,i)=>{ if(i===0){ so+=q.outs; se+=q.er; } else { ro+=q.outs; re+=q.er; const b=by[q.id]=by[q.id]||{n:q.n,er:0,o:0}; b.er+=q.er; b.o+=q.outs; } }); rs+=k==='h'?g.hs:g.as; }
  const era=(e,o)=>o?e*27/o:0; const sE=era(se,so), rE=era(re,ro); const top=Object.values(by).sort((a,b)=>b.er-a.er)[0]; const share=top&&re?top.er/re:0; const rpg=gs.length?rs/gs.length:0;
  let core, act='', base=`선발 ${ipStr(so)}이닝 ERA ${sE.toFixed(2)} · 불펜 ${ipStr(ro)}이닝 ERA ${rE.toFixed(2)} · 경기당 ${rpg.toFixed(1)}득점`;
  let rk=null; try{ rk=slotRanks(G.user).RP.rank; }catch(e){} const n=(G.games||[]).filter(g=>g.box&&(g.home===G.user||g.away===G.user)&&dobj(g.day).y===G.year).length;
  if(rE>=5.5&&rE>sE+1.5){ core='선발은 버텼는데 불펜에서 실점이 많았습니다.'; const st=typeof gmStage==='function'?gmStage(Math.min(n,10),rk):{s:'점검'};
    act=share>=.4&&top?`${st.s} · 불펜 전체 교체보다 ${top.n} 점검을 먼저 권합니다(이 기간 불펜 자책의 ${Math.round(share*100)}%).`:`${st.s} · 실점이 여러 투수에 퍼져 있어 한 명 문제라기보다 불펜 운용을 지켜볼 때입니다.`; }
  else if(sE>=5.5){ core='선발이 일찍 무너진 경기가 많았습니다.'; act='선발 로테이션의 최근 투구를 점검할 때입니다(표본이 적으면 관찰).'; }
  else if(rpg<3){ core='마운드는 버텼지만 점수를 내지 못했습니다.'; act='타선 부진이 일시적인지 지켜볼 때입니다(관찰).'; }
  else core=digWin(gs)?'투타가 고르게 제 몫을 했습니다.':'뚜렷하게 한쪽이 무너지지는 않았습니다.';
  return {core,act,base}; }
const digWin=gs=>gs.filter(g=>g.res==='승').length>gs.length/2;
function digestMail(){ const D=G.dig; if(!D||!D.games||!D.games.length)return;
  const gs=D.games.map(d=>G.games.find(g=>g.day===d&&(g.home===G.user||g.away===G.user))).filter(Boolean);
  const w=gs.filter(g=>g.res==='승').length, l=gs.filter(g=>g.res==='패').length; const rk=userRank();
  const L=gs.map(g=>{ const home=g.home===G.user; const ms=home?g.hs:g.as, os=home?g.as:g.hs; let k=null; try{ k=gmKey(g); }catch(e){} return `${dsh(g.day)} ${home?'vs':'@'} ${tshort(home?g.away:g.home)} ${g.res} ${ms}:${os}${k&&k.gw?` · 결승 ${k.gw}`:''}${k&&k.dec?` · ${k.dec}`:''}`; });
  const rows=[]; for(const p of playersOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); if(!h)continue; const a=D.snap[p.id]||DIGK.map(()=>0); const d={}; DIGK.forEach((k,i)=>d[k]=(h[k]||0)-(a[i]||0));
    if(p.isP){ if(d.outs<3)continue; const era=d.er*27/d.outs; rows.push({p,sc:(d.outs/3)*(4.5-era)/9+d.w*.3+d.sv*.3,t:`${ipStr(d.outs)}이닝 ${d.er}자책`}); }
    else { if(d.pa<5)continue; const ops=d.ab?obpOf(d)+(d.h+d.d+2*d.tr+3*d.hr)/d.ab:0; rows.push({p,sc:(ops-.72)*d.pa/10+d.hr*.2,t:`${d.pa}타석 ${d.h}안타${d.hr?` ${d.hr}홈런`:''} OPS ${fmt3(ops)}`}); } }
  rows.sort((a,b)=>b.sc-a.sc); const hot=rows.filter(x=>x.sc>0).slice(0,3), cold=rows.filter(x=>x.sc<0).slice(-2).reverse();
  const A=digAnalysis(gs);
  const body=[`[진행 결과] ${gs.length}경기 ${w}승 ${l}패 · 지금 ${rk}위. ${A.core}`, A.act?`[검토할 행동] ${A.act}`:'', `[판단 근거] ${A.base}`, hot.length?`잘한 선수: ${hot.map(x=>`${x.p.name}(${x.t})`).join(', ')}`:'', cold.length?`부진한 선수: ${cold.map(x=>`${x.p.name}(${x.t})`).join(', ')}`:'', '[경기별 상세]',...L].filter(Boolean).join('\n');
  const m=mail('전력분석팀',`${dsh(D.from)}~${dsh(D.to)} 경기 정리: ${w}승 ${l}패 · 지금 ${rk}위`,body,{kind:'경기',acts:[{l:'경기 결과 보기',a:'wkOpen',v:`${D.from}:${D.to}`},{l:'순위 보기',a:'go',v:'league:stand'}]});
  return m; }
