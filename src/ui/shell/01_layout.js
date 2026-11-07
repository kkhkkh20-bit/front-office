/* ---------- 화면 조립 ---------- */
/* 대형 화면: 1920×1080 기준 배치를 통째로 확대한다(게임처럼 비율 고정). 확대 중에는 CSS의 vh·vw를 --z로 나누고,
   화면 좌표(getBoundingClientRect)를 스타일 px로 옮길 때도 uiZ()로 나눈다 */
/* 전체 화면(PC·태블릿): 브라우저 주소창·탭을 숨긴다. 아이폰 사파리는 지원하지 않아 버튼을 감춘다 */
function fullOk(){ if(typeof document==='undefined')return false; const e=document.documentElement; return !!(e.requestFullscreen||e.webkitRequestFullscreen)&&(document.fullscreenEnabled!==false); }
function fullOn(){ return typeof document!=='undefined'&&!!(document.fullscreenElement||document.webkitFullscreenElement); }
if(typeof document!=='undefined'){ const fs=()=>{ document.querySelectorAll('[data-a="fullTg"]').forEach(b=>b.classList.toggle('on',fullOn())); }; document.addEventListener('fullscreenchange',fs); document.addEventListener('webkitfullscreenchange',fs); }
function uiZ(){ return typeof document==='undefined'?1:(+document.documentElement.dataset.z||1); }
function appZoom(){ if(typeof document==='undefined')return false; const r=document.documentElement,z=Math.min(innerWidth/1920,innerHeight/1080),v=z>1.05?Math.round(z*100)/100:1; if(uiZ()===v)return false; r.dataset.z=v; r.style.zoom=v>1?String(v):''; r.style.setProperty('--z',String(v)); return true; }
function render(){const app=document.getElementById('app');try{spoilNews();}catch(e){}rememberReading(app);try{return render0();}finally{restoreReading(app);workspaceRefit();}}
function render0(){appZoom();document.documentElement.classList.toggle('meeting-page-open',!!(G&&!UI.title&&UI.meet)); UI._rN=(UI._rN||0)+1;
  const app=$('#app');
  if(!G||UI.title){ setTeamVars(null); app.innerHTML=startScreen(); renderSheet(); return; }
  try{ annCheck(); }catch(e){} try{ ibAutoRead(); }catch(e){}
  setTimeout(()=>{ try{ document.querySelectorAll('nav.subtabs,.itabs,.tstrip').forEach(n=>{ const ov=n.scrollWidth>n.clientWidth+2; n.classList.toggle('ovx',ov); const b=n.querySelector('button.on'); if(ov&&b)n.scrollLeft=Math.max(0,b.offsetLeft-n.clientWidth/2+b.offsetWidth/2); }); }catch(e){} },0);
  setTimeout(()=>{ try{ campAfter(); if(UI.facFocus){ const el=document.getElementById('fci-'+UI.facFocus); UI.facFocus=null; if(el){ el.scrollIntoView({block:'center'}); el.classList.add('flash'); } } }catch(e){} try{ document.querySelectorAll('.chips').forEach(el=>el.classList.toggle('ovf',el.scrollWidth>el.clientWidth+2)); }catch(e){} try{ document.querySelectorAll('[data-snap]').forEach(w=>{ const r=w.querySelector('tr.now'); if(r&&!w.scrollTop)w.scrollTop=Math.max(0,r.offsetTop-w.clientHeight/3); }); }catch(e){} },0); /* data-snap: PC 시즌 일정 표를 다음 경기 근처로 */
  if(UI.tab==='roster'){ G.tutFlags=G.tutFlags||{}; G.tutFlags.roster=true; } if(G.tut&&!G.tut.done){ try{ tutTick(); }catch(e){} }
  const t=team(G.user); setTeamVars(t);
  const per=perShown(); const unread=G.mail.filter(mailNeeds).length; const b=blockNow();
  /* 창단 드래프트 동안은 드래프트만: 날짜 진행·메뉴·예산 표시를 숨긴다 */
  if(((G.fd&&!G.fd.done)||G.fdWait)&&UI.tab!=='inbox'){ const F=G.fd; const pk=F&&F.picks[F.cur];
    const KS=['.fdt-w','#sheet .sheet']; const keep=KS.map(q=>{ const e=document.querySelector(q); return e?[e.scrollTop,e.scrollLeft]:null; });
    app.innerHTML=`<div class="dshell"><header class="dtop"><div class="gut"><div class="wrap dtbar">${badge(G.user,30)}<div class="dti"><b>${esc(t.city)} ${esc(t.nick)}</b><span>창단 드래프트${F?(F.open===false?' · 탐색 시간':pk?` · ${pk.rd}/${FD_ROUNDS}라운드`:''):' · 준비'}</span></div>
      <button class="mailbtn" data-a="inbox" aria-label="소식함">${ICO.mail}${unread?`<i>${unread>99?'99+':unread}</i>`:''}</button><button class="btn small" data-a="toTitle">처음 화면</button></div>${F&&!G.fdWait?`<div class="wrap">${fdTicker()}</div>`:''}</div></header>
      <div class="gut"><div class="wrap"><main class="content dcontent">${G.fdWait?fdWaitView():fdView()}</main></div></div></div>${patchPop()}`;
    document.body.classList.toggle('help',helpOn()); markHints(app); renderSheet(); KS.forEach((q,i)=>{ const e=document.querySelector(q); if(e&&keep[i]){ e.scrollTop=keep[i][0]; e.scrollLeft=keep[i][1]; } }); const fw=document.querySelector('.fdt-w'); if(fw&&fdCompact())fw.onscroll=()=>{ if(fw.scrollTop+fw.clientHeight>=fw.scrollHeight-200&&document.querySelector('.fdmore')&&!UI._fdMoreT){ UI._fdMoreT=1; A.fdListMore(); setTimeout(()=>{ UI._fdMoreT=0; },500); } }; const pc=document.querySelector('.fpcs-m'), on=pc&&pc.querySelector('.fpc.on'); if(on){ const x=on.getBoundingClientRect().left-pc.getBoundingClientRect().left; if(x<0||x+on.offsetWidth>pc.clientWidth)pc.scrollLeft+=x-8; } /* 휴대폰: 끝까지 내리면 다음 60명 */ if(fw&&fdCompact())fdNoBounce(fw); return; }
  if(fmOn()){ fmNavRec(); app.innerHTML=fmShell(t,per,unread,b); document.body.classList.toggle('help',helpOn()); document.body.classList.add('fm'); markHints(app); renderSheet(); try{ autoLink($('#app')); }catch(e){} if(UI.tab==='inbox')inboxWire(); if(UI.stamp&&!UI.stamp._t){ const st=UI.stamp; st._t=setTimeout(()=>{ if(UI.stamp===st){ UI.stamp=null; render(); } },4000); } return; }
  document.body.classList.remove('fm');
  const dk=draftTopOn(); const nav=NAV; const ic=i=>ICO[i]||ICO2[i]; const inMenu=!BNAV.includes(UI.tab); const menuAlert=NAV.some(([k])=>!BNAV.includes(k)&&tabAlert(k));
  app.innerHTML=`<div class="shell">
  <aside class="rail" aria-label="메뉴"><div class="brand" data-a="tab" data-v="home" role="button" tabindex="0" title="홈으로">${badge(G.user,38)}<b>${esc(t.city)}<br>${esc(t.nick)}</b></div>${nav.map(([k,l,i])=>`<button data-a="tab" data-v="${k}" class="${UI.tab===k?'on':''}">${ic(i)}${l}${k==='inbox'&&unread?`<span class="cnt">${unread}</span>`:tabAlert(k)?'<i class="sdot"></i>':''}</button>`).join('')}<button class="railme ${UI.tab==='me'?'on':''}" data-a="tab" data-v="me">${avImg(meAv())}<span>${esc(meName()||'단장 프로필')}</span></button><button class="railset" data-a="go" data-v="cfg:set">${ICO2.cog}설정 · 권한</button></aside>
  <div class="mainc">
   <header class="top"><div class="gut"><div class="tbar wrap">
     ${dk?draftTop():`<div class="club${G.unemp?'':' clubbtn'}" ${G.unemp?'':'data-a="myRos" role="button" tabindex="0" title="우리 팀 현황"'}>${G.unemp?'<span class="tdi">야</span>':`<span class="cb-logo" data-a="tab" data-v="home" role="button" tabindex="0" title="홈으로" aria-label="홈으로">${badge(G.user,30)}</span>`}<div><b>${G.unemp?`야인 · 명성 ${G.rep}`:(!wide()&&UI.tab!=='home'&&TITLE[UI.tab]?`${esc(TITLE[UI.tab])}<i class="cb-v">▾</i>`:`<i class="cb-c${UI.tab==='home'?' cb-hm':''}">${esc(t.city)} </i>${esc(t.nick)}<i class="cb-v">▾</i>`)}</b><span>${wide()?dstr(G.day):`<i class="cb-y">${dobj(G.day).y}.</i>${dsh(G.day)} ${WD[dobj(G.day).w]}`}<i class="cb-p"> · ${PERIOD[per]}</i></span></div></div>`}
     ${fullOk()?`<button class="mailbtn fullbtn${fullOn()?' on':''}" data-a="fullTg" aria-label="전체 화면" title="전체 화면 켜기·끄기">${ICO.full}</button>`:''}${dk&&!UI.fromMail?`<button class="mailbtn tophelp${helpOn()?' on':''}" data-a="help" aria-label="설명 ${helpOn()?'숨기기':'보기'}" title="설명 ${helpOn()?'숨기기':'보기'}">?</button>`:''}${G.unemp?'':`<button class="mailbtn calbtn" data-a="calOpen" aria-label="캘린더" title="캘린더 · 마감과 일정">${ICO.cal}</button>`}${`<button class="mailbtn" data-a="inbox" aria-label="소식함${unread?` · 확인할 중요 소식 ${unread}건`:''}" title="소식함${unread?` · 확인할 중요 소식 ${unread}건`:''}">${ICO.mail}${unread?`<i>${unread>99?'99+':unread}</i>`:''}</button>`}${dk?draftGo():goSet(per,b)}
   </div></div>${topBlocks(b)}</header>
   <div class="gut"><div class="wrap">
     ${dk&&!UI.fromMail?'':`<div class="subhead${!wide()&&UI.tab!=='home'&&!UI.fromMail?' notitle':''}">${UI.fromMail&&UI.tab!=='inbox'?'<button class="btn small back2ib" data-a="ibReturn">◀ 소식함으로</button>':''}<h1>${TITLE[UI.tab]}</h1><div class="meta">${metaChips()}<button class="helpbtn${helpOn()?' on':''}" data-a="help" aria-label="설명 ${helpOn()?'숨기기':'보기'}" title="설명 ${helpOn()?'숨기기':'보기'}">?</button></div></div>`}
     <main class="content">${tabBody()}</main>${UI.stamp?stampView():''}${patchPop()} <!-- 도장(합의·거래 성사)은 어느 화면에서든 맨 위에 뜬다 -->
   </div></div>
  </div>
  <nav class="bnav" aria-label="메뉴"><div class="in">${nav.filter(([k])=>BNAV.includes(k)).map(([k,l,i])=>`<button data-a="tab" data-v="${k}" class="${UI.tab===k?'on':''}">${ic(i)}<span>${l}</span>${(k==='inbox'&&unread)||(k!=='inbox'&&tabAlert(k))?'<span class="dot"></span>':''}</button>`).join('')}<button data-a="menu" class="${inMenu?'on':''}">${ICO2.menu}<span>메뉴</span>${menuAlert?'<span class="dot"></span>':''}</button></div></nav>
  </div>`;
  document.body.classList.toggle('help',helpOn()); markHints(app);
  renderSheet(); try{ autoLink($('#app')); }catch(e){}
  if(UI.tab==='inbox')inboxWire();
  /* 도장(거래 성사·지명)은 4초 뒤 저절로 닫혀 아래 버튼을 가리지 않는다 */
  if(UI.stamp&&!UI.stamp._t){ const st=UI.stamp; st._t=setTimeout(()=>{ if(UI.stamp===st){ UI.stamp=null; render(); } },4000); }
}
/* 화면에 보이는 시즌 단계: 경기는 중계보다 먼저 계산돼 한국시리즈 마지막 경기 중계 중에도 엔진은 이미 시리즈 종료(스토브리그)다.
   그 중계를 보는 동안에는 결과를 먼저 알리지 않게 '포스트시즌'으로 둔다 */
function perShown(){ const P=G.ps, g=UI.cast&&G.games[UI.cast.g]; return P&&P.done&&g&&P.resD&&g.day===P.resD.ks&&G.day<(P.finDay??G.day+1)?'post':period(); }
function goSet(per,b){ if(UI.cast)return ''; /* 중계를 보는 동안 날짜 진행 버튼은 숨긴다(중계는 '나가기'로 닫는다, 사용자 피드백 11-07) */ const hint=!G.unemp&&(per==='season'||nextGames(1).some(x=>x.d<=G.day+7))?'한 시리즈씩 · 예약한 경기만 관전':'최대 7일 · 중요한 소식까지'; return `<div class="goset">${G.unemp?`<button class="continue" data-a="adv" data-v="event" ${b?'disabled':''}><span class="cl"><b>진행하기</b><i>제의가 오거나 1주일이 지날 때까지</i></span>${ICO.ff}</button>`:per==='season'?`<button class="step" data-a="matchOpen" ${b?'disabled':''} aria-label="경기 중계 선택" title="중계로 보거나 결과만 보기를 선택합니다"><span class="st-l">중계</span></button><button class="continue${!b&&ibNeedList().length?' need':''}" data-a="adv" data-v="event" ${b?'disabled':''}><span class="cl" title="같은 팀과 치르는 한 시리즈(보통 3연전)를 이어서 진행합니다. 예약한 관전 경기와 설정한 멈춤 조건에서 멈추고, 확인할 소식이 있으면 먼저 엽니다"><b>진행하기</b><i>${esc(b?nextLabel():contSub(hint))}</i></span>${ICO.ff}</button>`:`<button class="step" data-a="adv" data-v="day" ${b?'disabled':''} aria-label="하루 진행" title="하루만 진행"><span class="st-l">하루</span><span class="st-x"> 진행</span></button><button class="continue${!b&&ibNeedList().length?' need':''}" data-a="adv" data-v="event" ${b?'disabled':''}><span class="cl"><b>진행하기</b><i>${esc(b?nextLabel():contSub(hint))}</i></span>${ICO.ff}</button>`}</div>`; }
/* 휴대폰·태블릿 신인 드래프트 진행 중: 선수 프로필 화면처럼 제목 줄 없이, 상단 바 구단명·날짜 자리에 지명 순서를 굵게, 아래 작게 로스터·지명 중인 구단.
   배지는 구단 메뉴, 드래프트 정보는 더보기(건너뛰기·일괄 처리·지명 소식), '진행하기' 자리는 우리 차례면 추천 지명, 아니면 다른 구단 지명 보기 */
function draftTopOn(){ const d=G.draft; return !wide()&&!G.unemp&&!!d&&!d.done&&!!d.picks[d.cur]&&UI.tab==='transfer'&&curSub('transfer')==='draft'&&!UI.meet; }
function draftTop(){ const d=G.draft, pk=d.picks[d.cur], mine=pk.tid===G.user, op=!!UI.open?.draftMore;
  return `<div class="club dclub"><button class="dc-b" data-a="myRos" aria-label="우리 팀 현황" title="우리 팀 현황">${badge(G.user,30)}</button><button class="dc-i" data-a="draftMore" aria-expanded="${op}" title="건너뛰기·일괄 처리·지명 소식"><b>${pk.rd}라운드 ${pk.no}순위<i class="cb-v">${op?'▴':'▾'}</i></b><span>${mine?`<i class="dc-me">우리 차례</i> · <i class="dc-rl">로스터 </i>${rosterProj(G.user)}/${ROSTER_MAX}`:`${esc(team(pk.tid).nick)} 지명<i class="dc-rl"> 중</i> · <i class="dc-rl">로스터 </i>${rosterProj(G.user)}/${ROSTER_MAX}`}</span></button></div>`; }
function draftGo(){ const mine=G.draft.picks[G.draft.cur].tid===G.user, on=!!(UI.dl&&UI.dl.on);
  return `<div class="goset">${mine?'<button class="continue" data-a="autoPick" title="스카우트 추천 지명"><span class="cl"><b>추천 지명</b><i>스카우트 추천</i></span></button>':`<button class="continue" data-a="advDraft" ${on?'disabled':''}><span class="cl"><b>${on?'지명 중…':'지명 보기'}</b><i>다른 구단</i></span></button>`}</div>`; }
function topBlocks(b){ return `${wide()&&!fmOn()&&UI.tab!=='home'?`<div class="gut sbwrap"><div class="wrap">${stripBar()}</div></div>`:''}${b&&!(G.draft&&!G.draft.done&&UI.tab==='transfer'&&curSub('transfer')==='draft')?`<div class="blk gut"><div class="wrap">${esc(b)}${blkLink(b)}</div></div>`:''}${needBackup()?`<div class="blk bkn gut"><div class="wrap">itch처럼 다른 사이트 안에서 하면 브라우저 정리나 게임 업데이트로 저장이 지워질 수 있습니다. 가끔 파일로 내보내 두세요.<button data-a="expFile">파일로 내보내기</button><button data-a="bkLater">나중에</button></div></div>`:''}`; }
function tabBody(){
  if(UI.meet)return meetPage();
  if(G.gameOver&&(UI.tab==='inbox'||UI.tab==='home'))return gameOverView();
  if(UI.tab==='roster')G.tutFlags.roster=true;
  if(!TITLE[UI.tab])UI.tab='home';
  if(G.unemp&&UI.tab==='cfg')return unempCfg(); /* 야인이어도 저장·불러오기·내보내기는 쓸 수 있어야 한다 */
  if(G.unemp&&!['home','inbox','league','me'].includes(UI.tab))return csec('야인입니다',`<p>지금은 맡은 구단이 없습니다. 리그 탭에서 판도를 보고, 제의가 오면 홈에서 답하세요. 내 경력과 재임 구단의 마지막 결산은 단장 탭에서 볼 수 있습니다.</p><div class="row"><button class="btn small" data-a="tab" data-v="me">내 경력·재임 결산</button><button class="btn small" data-a="tab" data-v="cfg">게임 설정(저장·불러오기)</button></div><button class="btn primary" data-a="tab" data-v="home">홈으로</button>`);
  return {cal:calView,home:homeView,inbox:inboxView,roster:rosterView,trade:tradeCenter,transfer:transferView,scout:scoutView,train:trainView,staff:staffView,cfg:cfgView,me:meView,league:leagueView,club:clubView}[UI.tab]();
}
function unempCfg(){ return patchCard()+`<section class="card"><div class="row between"><span class="small muted">버전 ${GAME_VER} · 진행 상황은 자동 저장됩니다.</span><button class="btn small" data-a="toTitle">처음 화면으로</button></div></section>`+slotsCard(false)+exportCard(); }
function anySave(){ try{ const m=meta(); return SLOT_IDS.some(n=>m.slots&&m.slots[n]); }catch(e){ return false; } }
function slotsCard(start){ const m=meta(); const used=SLOT_IDS.reduce((a,n)=>a+slotSize(n),0); const has={}; for(const n of SLOT_IDS)has[n]=slotHas(n); const sv=n=>has[n]?(m.slots[n]||{name:'(목록 정보 없음)',y:''}):null; /* 목록과 본문이 어긋나면 본문 기준(검수 11-07) */
  const rows=SLOT_IDS.filter(n=>sv(n)||n===SLOT_IDS.find(k=>!sv(k))||UI.slotAll).map(n=>{ const s=sv(n); const cur=G&&curSlot()===n; /* 이 탭이 연 슬롯만 진행 중(검수 11-07: 다른 탭이 바꾼 활성 기록을 따르면 진행 중 슬롯에 삭제 버튼) */
    return `<div class="slot ${cur?'on':''}"><div><b>슬롯 ${n}${cur?' · 진행 중':''}</b><div class="small muted">${s?`${esc(s.name||'')} · ${esc(s.date||s.y+'년')}${s.over?' · 경질됨':''} · ${slotSize(n)}KB${s.at?` · 저장 ${new Date(s.at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}`:''}`:'비어 있음'}</div>${s?`<input class="slot-memo" data-a="slotMemo" data-v="${n}" maxlength="30" placeholder="메모(예: 외국인 교체 전)" value="${esc(s.memo||'')}" aria-label="슬롯 ${n} 메모">`:''}</div>
      <div class="row">${s&&cur?`<button class="btn small" data-a="slotCopy" title="지금 진행 상황을 빈 슬롯에 따로 저장해 둡니다. 계속 진행하는 곳은 이 슬롯입니다">빈 슬롯에 따로 저장</button>`:''}${s&&!cur?`<button class="btn small primary" data-a="slotLoad" data-v="${n}">이어하기</button>`:''}${start?`<button class="btn small" data-a="slotNew" data-v="${n}">${s?'덮어쓰고 새 게임':'새 게임'}</button>`:''}${s&&!cur?`<button class="btn small danger" data-a="slotDel" data-v="${n}">삭제</button>`:''}</div></div>`; }).join('');
  const filled=SLOT_IDS.filter(n=>sv(n)).length;
  return `<section class="card"><div class="row between"><h2 class="sec">저장 슬롯</h2><span class="small muted">${filled}/${SLOTS} 사용 · 약 ${(used/1024).toFixed(1)}MB</span></div><div class="slots">${rows}</div>${filled+1<SLOTS?`<button class="btn small" data-a="slotAll">${UI.slotAll?'빈 슬롯 숨기기':'빈 슬롯 모두 보기'}</button>`:''}<p class="small muted">슬롯은 ${SLOTS}개까지입니다. 브라우저 저장 공간은 보통 5MB 안팎이라, 오래 진행한 게임을 여러 개 두면 공간이 모자랄 수 있습니다. 그때는 설정의 "파일로 내보내기"로 보관하세요.</p>${UI.slotMsg?`<div class="note">${esc(UI.slotMsg)}</div>`:''}</section>`; }
function exportCard(){ return `<section class="card"><h2 class="sec">내보내기 · 불러오기</h2>
  <p class="small muted">진행 상황은 이 브라우저에만 저장됩니다. 브라우저 데이터를 지우면 사라지니, 가끔 내보내 두세요. 다른 기기에서는 내보낸 코드를 붙여 넣어 이어 할 수 있습니다.</p>
  <div class="row"><button class="btn" data-a="expFile">파일로 내보내기</button><button class="btn" data-a="expCode">코드 만들기</button><label class="btn">파일 불러오기<input type="file" accept=".txt,.json" data-a="impFile" style="display:none"></label></div>
  ${UI.expCode?`<textarea class="code" id="expCodeBox" readonly>${UI.expCode}</textarea><div class="row"><button class="btn primary" data-a="expCopy">코드 복사하기</button><span class="small muted">길이 ${Math.round(UI.expCode.length/1024)}KB · 복사해서 메모장·메신저 '나에게 보내기' 등에 보관하세요.</span></div>`:''}
  <textarea class="code" id="impCode" placeholder="내보낸 코드를 여기에 붙여 넣으세요"></textarea>
  <div class="row"><button class="btn" data-a="impPaste">붙여넣기</button><button class="btn primary" data-a="impCode">코드로 불러오기 (현재 슬롯에 덮어씀)</button></div>
  ${UI.impMsg?`<div class="note">${esc(UI.impMsg)}</div>`:''}${SAVE_ERR?`<div class="note bad">${esc(SAVE_ERR)}</div>`:''}</section>`; }
function importText(t){
 let g=null;t=String(t||'').trim().replace(/^\uFEFF/,'');
 /* 메신저·메모 앱이 긴 코드에 줄바꿈·띄어쓰기를 넣거나 '+'를 띄어쓰기로 바꾸는 경우가 있다: 차례로 고쳐 본다 */
 if(t[0]==='{'){try{g=JSON.parse(t);}catch(e){}}
 else for(const v of [t,t.replace(/[\r\n\t]/g,''),t.replace(/\s+/g,''),t.replace(/[\r\n\t]/g,'').replace(/ /g,'+')]){ try{ const j=LZString.decompressFromBase64(v); if(j){ g=JSON.parse(j); break; } }catch(e){} }
 if(!g||g.ver!==4||!Array.isArray(g.teams)||!g.teams.length||!g.players||!g.cal||!Number.isFinite(g.day)||!Number.isFinite(g.year)){UI.impMsg=t&&t[0]!=='{'&&t.length>100?`코드를 읽지 못했습니다(붙여 넣은 길이 ${t.length.toLocaleString()}자). 코드가 끝까지 복사되지 않았을 가능성이 큽니다. 저장 코드는 수십만 자라 메신저로 보내면 잘리기 쉽습니다. 기기를 옮길 때는 '파일로 내보내기'로 받은 .txt 파일을 불러오기에 넣어 주세요.`:'저장 파일을 읽지 못했습니다. 게임에서 내보낸 .txt 또는 .json 파일인지 확인해 주세요.';render();return;}
 const m=meta(),fromTitle=UI.title,slot=fromTitle?SLOT_IDS.find(n=>!slotUsed(n,m)):curSlot();
 if(fromTitle&&!slot){UI.impMsg='빈 저장 슬롯이 없습니다. 보관할 저장을 내보내고 슬롯을 비운 뒤 불러와 주세요.';render();return;}
 const old=G;try{G=g;migrateDraft();}catch(e){G=old;UI.impMsg='저장 데이터를 복원하지 못했습니다. 기존 게임은 유지했습니다.';render();return;}
 const cur0=CUR_SLOT, rev0=SLOT_REV; CUR_SLOT=slot; if(fromTitle)slotRevSync(slot,m); /* 가져온 게임은 새 슬롯에만 쓴다. 활성 슬롯은 저장이 성공한 뒤에만 바꾼다(검수 11-07: 실패하면 빈 슬롯이 활성으로 남아 이어하기가 사라짐) */
 const ok=saveNow(), body=!ok&&(()=>{ try{ const h=unpack(localStorage.getItem(slotKey(slot))); return !!h&&h.year===G.year&&h.day===G.day&&h.user===G.user; }catch(e){ return false; } })(); /* 본문은 쓰이고 목록만 실패한 경우 */
 if(fromTitle){ if(ok||body){ const m2=meta(); m2.active=slot; setMeta(m2); } else { G=old; CUR_SLOT=cur0; SLOT_REV=rev0; try{ if(G)migrateDraft(); }catch(e){} UI.impMsg=`슬롯 ${slot}에 저장하지 못해 가져오지 않았습니다. 기존 세이브는 그대로입니다. ${SAVE_ERR||''}`.trim(); render(); return; } } /* 가져온 게임은 새 슬롯에만 쓴다(검수 11-06: 활성 기록 실패 때 기존 슬롯을 덮어씀) */ closeSheets();UI.title=false;UI.sstep='main';UI.tab='home';UI.readingOpen={};UI.readingScroll={};UI.impMsg=ok?'불러왔습니다.':body?'불러와 슬롯에 저장했지만 저장 목록을 갱신하지 못했습니다. 다시 열어도 가져온 백업이 열립니다.':'불러왔지만 저장 공간이 부족해 슬롯에 저장하지 못했습니다. 이대로 닫으면 이전 세이브가 열립니다. 다른 슬롯을 지운 뒤 다시 가져오세요.'; /* 본문이 실제로 바뀌었는지 보고 안내(검수 11-07) */render(); /* 저장까지 확인한 뒤 성공 안내(검수 11-06) */
}

function ensureWorld(){ if(UI.world||UI.worldBusy)return; UI.worldBusy=true; setTimeout(()=>{ const G0=G; try{ buildWorld(); UI.world=G; try{ G.fdOrd=fdOrder(); }catch(e){} /* 창단 드래프트 순서는 구단을 고르기 전에 한 번 정해 두고(구단 카드와 실제가 같고 겹치지 않게) 시작 때 그대로 쓴다 */
    /* 구단마다 취임 첫날 예산을 미리 계산해 재정 압박 구단을 표시한다 */
    try{ const js=JSON.stringify(UI.world); for(const x of UI.world.preview){ G=JSON.parse(js); claimTeam(x.tid); x.room=Math.round(budget().roomGoal); try{ x.fin=fdFin(x.tid); x.ownN=bossOf(x.tid).own.name; }catch(e){} } }catch(e){ console.error(e); }
  }catch(e){ console.error(e); UI.worldErr=true; } finally{ G=G0; UI.worldBusy=false; render(); } },60); }
const SLK={C:'포수','1B':'1루','2B':'2루','3B':'3루',SS:'유격',LF:'좌익',CF:'중견',RF:'우익',DH:'지명',SP:'선발',RP:'불펜',P:'투수'};
const G0Y=()=>2026; const eok=v=>`${Math.round(v/100)}억`;
/* 창단 지명 순번 고르기(구단 고르기 전). 조건은 FD_SLOT(11_founding_draft.js) */
function fdSlotPick(){ if(typeof FD_SLOT==='undefined')return ''; const cur=UI.fdPk||0, pc=d=>d<0?`${Math.round(-d*100)}% 감액`:d>0?`${Math.round(d*100)}% 증액`:'그대로';
  return `<section class="card fdpk${UI.fdNeed?' need':''}"><h2 class="sec">창단 지명 순번</h2><p class="small">${UI.fdNeed?'<b class="bad">먼저 순번을 고르세요.</b> ':''}라운드마다 순서가 뒤집힙니다: 1R 1→10, 2R 10→1, 3R 1→10 … 앞 순번은 긴축, 뒤 순번은 지원 보너스(${FD_AUST_Y}시즌) ${hiI('1순위는 전체 1번을 갖는 대신 2라운드는 맨 끝(전체 20번)입니다. 10순위는 10번과 11번을 연달아 뽑습니다. '+'1~3순위는 구단주가 수익 우선으로 바뀌고 시설·추가 지원 승인 가능성이 낮아집니다. 독립구단(고양)은 모기업 지원이 없어 시작 현금만 달라집니다. 나머지 구단은 예산 여유가 적은 구단부터 남은 자리를 채웁니다.')}</p>
    <div class="chips optrow" role="group">${Object.keys(FD_SLOT).map(k=>`<button type="button" data-a="fdPk" data-v="${k}" class="${+k===cur?'on':''}" aria-pressed="${+k===cur}">${k}순위</button>`).join('')}</div>
    ${cur?(()=>{ const A=FD_SLOT[cur], s0=((UI.world.preview.find(x=>!TEAM_DEF[x.tid].indie)||{}).fin||{}).sup||0, ds=Math.round(s0*A.d), dc=A.cash-4000, sg=v=>v>0?`+${eok(v)}`:v<0?`-${eok(-v)}`:'변화 없음';
      return `<div class="fdpk-now"><b>${cur}순위 선택</b><span>모기업 지원 한도 <b>${eok(s0)} → ${eok(s0+ds)}</b> <em class="${ds<0?'bad':ds>0?'ok':''}">${sg(ds)}</em> · 해마다, ${FD_AUST_Y}시즌</span><span>시작 현금 <b>40억 → ${eok(A.cash)}</b> <em class="${dc<0?'bad':dc>0?'ok':''}">${sg(dc)}</em></span><span>${FD_AUST_Y}시즌 합계 <b class="${ds<0?'bad':ds>0?'ok':''}">${sg(ds*FD_AUST_Y+dc)}</b>${A.strict?' · 구단주 수익 우선':''}</span><span class="fdpk-seq">우리 지명: ${[0,1,2,3,4].map(r=>{ const pos=r%2?11-cur:cur; return `${r+1}R <b>${pos}번째</b>(전체 ${r*10+pos})`; }).join(' · ')} …</span></div>`; })():''}<details class="frule"><summary class="small">순번별 조건 전체</summary><div class="tw"><table><thead><tr><th>순번</th><th>모기업 지원 한도(${FD_AUST_Y}시즌)</th><th>시작 현금</th></tr></thead><tbody>${Object.entries(FD_SLOT).map(([k,A])=>`<tr${+k===cur?' class="on"':''}><td>${k}순위${A.strict?' · 긴축':''}</td><td>${pc(A.d)}</td><td>${eok(A.cash)}</td></tr>`).join('')}</tbody></table></div></details></section>`; }
function pickTeams(){ if(UI.worldErr)return `<div class="list">${TEAM_DEF.map((d,i)=>`<button class="item wa" data-a="start" data-v="${i}">${badge(i,34)}<span class="nm"><b>${d.city} ${d.nick}</b></span><span class="rt small muted">선택</span></button>`).join('')}</div>`;
  if(!UI.world){ ensureWorld(); return `<div class="worldload"><span class="spin"></span><p>리그를 만드는 중입니다. 10개 구단 선수단을 만들고 지난 시즌 144경기를 치르고 있습니다.</p></div>`; }
  const P=[...UI.world.preview].sort((a,b)=>a.proj-b.proj); const OL={win:'성적 우선',profit:'수익 우선',pr:'홍보 우선'};
  const card=x=>{ const d=TEAM_DEF[x.tid]; const over=x.pay>x.cap; const mv=x.prev-x.proj; const tight=over||(x.room!=null&&x.room<0);
    return `<div class="tmk${UI.teamOpen?.[x.tid]?' open':''}" role="button" tabindex="0" data-a="start" data-v="${x.tid}"><div class="tp-h">${badge(x.tid,38)}<div><b>${d.city} ${d.nick}</b><span>${d.indie?'독립구단':'모기업 구단'} · ${d.region} · 시장 ${Math.round(d.market*100)}</span></div>
      <div class="tp-r ${x.proj<=3?'hi':x.proj<=7?'mid':'lo'}"><i>예상</i><b>${x.proj}<em>위</em></b><span>난이도 ${x.proj<=3?'쉬움':x.proj<=7?'보통':'어려움'} · ${x.mode}</span></div></div>
      <div class="tp-g"><span><i>지난 시즌</i><b>${x.prev}위 · ${x.w}승 ${x.l}패</b>${mv?`<em class="${mv<0?'dn':'up'}">${mv>0?'▲':'▼'}${Math.abs(mv)}</em>`:''}</span><span><i>구단주</i><b>${OL[x.owner]}</b></span><span><i>시작 자금·시설</i><b>${eok(mktCash(x.tid))} · ${d.market>=1.15?'개발된 구장·시설':d.market<=.9||d.indie?'낡은 구장·시설':'보통'}</b></span>
        <span><i>강점</i><b>${x.best.map(([k,r])=>`${SLK[k]} ${r}위`).join(' · ')}</b></span><span><i>약점</i><b class="wk">${x.worst.map(([k,r])=>`${SLK[k]} ${r}위`).join(' · ')}</b></span>
        <span><i>간판</i><b>${x.top.map(p=>`${esc(p.name)}(${p.pos} ${dv(p.o)})`).join(', ')}</b></span><span><i>연봉 총액</i><b class="${over?'wk':''}">${money(x.pay)} / 캡 ${money(x.cap)}${over?' 초과':''}</b></span><span><i>첫해 예산 여유</i><b class="${tight?'wk':''}">${x.room==null?'-':x.room<0?`지원 한도 ${money(-x.room)} 초과`:`여유 ${money(x.room)}`}</b></span></div>
      <div class="tp-t">${tight?'<span class="pill bad">재정 압박 구단</span>':''}${[x.age<=27.8?'젊은 선수단':x.age>=28.8?'노장 위주':'', x.young?`24세 이하 1군급 ${x.young}명`:'', x.vets>=2?`33세 이상 주전급 ${x.vets}명`:'', x.faSoon?`FA 앞둔 주전 ${x.faSoon}명`:'', d.indie?'모기업 지원 없음':''].filter(Boolean).map(t=>`<span class="pill">${t}</span>`).join('')}<button class="lnk tp-more" data-a="tpOpen" data-v="${x.tid}" aria-expanded="${!!UI.teamOpen?.[x.tid]}">${UI.teamOpen?.[x.tid]?'접기':'자세히'}</button><button class="btn small" data-a="start" data-v="${x.tid}">이 구단 선택</button></div></div>`; };
  if(UI.smode==='fd'){ const OLV={win:'성적 우선',profit:'수익 우선',pr:'홍보 우선'};
    /* 고른 지명 순번의 조건(지원 한도 증감·시작 현금)을 구단 카드 숫자에 바로 반영한다 */
    const fdAdj=x=>{ const f=x.fin||{}, A=UI.fdPk&&typeof FD_SLOT!=='undefined'?FD_SLOT[UI.fdPk]:null; if(!A)return f; const ds=TEAM_DEF[x.tid].indie?0:Math.round((f.sup||0)*A.d); return {...f,sup:(f.sup||0)+ds,avail:(f.avail||0)+ds,cash:A.cash}; };
    const P2=[...UI.world.preview].sort((a,b)=>(fdAdj(b).avail||0)-(fdAdj(a).avail||0));
    const fcard=x=>{ const d=TEAM_DEF[x.tid]; const f=fdAdj(x); const ri=P2.indexOf(x), ok=ri<3, mid=ri<7; /* 난이도는 10개 구단 안에서 자금 여유 순위로(모두 캡을 넘겨 다 '쉬움'으로 보이던 문제) */ const age=G0Y()-(STAD_BUILT[x.tid]||2000);
      return `<div class="tmk${UI.teamOpen?.[x.tid]?' open':''}" role="button" tabindex="0" data-a="start" data-v="${x.tid}"><div class="tp-h">${badge(x.tid,38)}<div><b>${d.city} ${d.nick}</b><span>${d.indie?'독립구단':'모기업 구단'} · ${d.region} · 시장 ${Math.round(d.market*100)}</span></div>
        <div class="tp-r tp-rf ${ok?'hi':mid?'mid':'lo'}"><i>샐러리캡 대비 여유</i><b>${(f.avail||0)>=(f.cap||0)?'+':'-'}${eok(Math.abs((f.avail||0)-(f.cap||0)))}</b><span>연봉 예산 ${eok(Math.max(0,f.avail||0))} · 자금 ${ri+1}위</span></div></div>
        <p class="tp-sum">${(()=>{ return [ok?'자금 넉넉':mid?'자금 보통':'자금 빠듯', d.market>=1.15?'큰 시장':d.market<=.9?'작은 시장':'', d.indie?'모기업 없음':OLV[x.owner]+' 구단주'].filter(Boolean).join(' · '); })()}</p>
        <div class="tp-g"><span><i>구단주</i><b>${esc(x.ownN||'')} 회장 · ${OLV[x.owner]}</b></span><span><i>예상 수입</i><b>${eok(f.I||0)}</b></span>
          <span><i>모기업 지원 한도</i><b class="${d.indie?'wk':''}">${d.indie?'없음':eok(f.sup||0)}</b></span><span><i>선수 연봉 외 지출</i><b>${eok(f.other||0)}</b></span>
          <span><i>보유 현금</i><b>${eok(f.cash||0)}</b></span><span><i>홈구장</i><b>${(STAD_NM&&STAD_NM[x.tid])?esc(STAD_NM[x.tid])+' · ':''}${(STAD_CAP[x.tid]||0).toLocaleString()}석 · ${age}년 된 구장</b></span></div>${typeof uniRow==='function'?`<div class="tp-uni">${uniRow(x.tid,{sz:64})}</div>`:''}
        <div class="tp-t">${d.indie?'<span class="pill">모기업 지원 없음</span>':''}<button class="lnk tp-more" data-a="tpOpen" data-v="${x.tid}" aria-expanded="${!!UI.teamOpen?.[x.tid]}">${UI.teamOpen?.[x.tid]?'접기':'자세히'}</button><button class="btn small" data-a="start" data-v="${x.tid}">이 구단 선택</button></div></div>`; };
    return `<p class="small muted">선수는 드래프트로 새로 뽑으므로 전력은 같은 출발선입니다. 구단마다 다른 것은 시장 크기와 구장(입장·광고 수입)이고, 고양은 모기업 지원이 없습니다. 카드의 돈은 고른 순번 조건을 반영한 값입니다. 먼저 창단 지명 순번을 고르고, 그다음 구단을 고릅니다.</p>${fdSlotPick()}<details class="frule"><summary class="small">예산 여유와 지명 순서 설명</summary><p class="small muted">우리 순번은 위에서 고르고, 나머지 구단은 예산 여유가 적은 구단부터 남은 자리를 채웁니다. 라운드마다 순서가 뒤집힙니다. 예산 여유는 예상 수입과 모기업 지원 한도에서 선수 연봉 외 지출을 뺀 값으로, 국내 선수 연봉에 쓸 수 있는 돈입니다. 큰 숫자는 샐러리캡(${eok((P2[0]&&P2[0].fin&&P2[0].fin.cap)||0)})까지 채웠을 때 남거나 모자라는 돈입니다. 예산 여유는 모기업 지원을 한도까지 받는다고 가정한 최대치입니다. 창단 뒤 화면 위 <b>예산 여유</b>는 구단주가 정한 지원 목표 기준이라 이보다 훨씬 작게 나옵니다.</p></details>
    <div class="tpg cmp">${P2.map(fcard).join('')}</div><div class="row" style="margin-top:10px"><button class="btn" data-a="reroll">다른 리그로 다시 만들기</button></div>`; }
  return `<p class="small muted">구단마다 전력이 달라 난이도가 됩니다(예상 1~3위 쉬움, 4~7위 보통, 8~10위 어려움). 예상 순위는 전력분석팀 추정치입니다. 외국인 선수는 취임 후 새로 뽑아야 하며, 예상은 비슷한 수준의 외국인을 데려온다고 보고 계산했습니다. 감독도 취임 후 새로 선임합니다.</p>
    <div class="tpg cmp">${P.map(card).join('')}</div><div class="row" style="margin-top:10px"><button class="btn" data-a="reroll">다른 리그로 다시 만들기</button><span class="small muted">선수단은 새 게임마다 무작위로 만들어집니다.</span></div>`; }
function inFrame(){ try{ return window.self!==window.top; }catch(e){ return true; } }
/* 백업 권유: 다른 사이트 안(itch 등)에서 실행 중이면, 마지막 백업(파일·코드 내보내기)에서 게임 날짜로 60일이 지날 때마다 상단에 띄운다. '나중에'는 30일 뒤 */
function needBackup(){ try{ if(!G||!inFrame())return false; if(G.bkAt==null){ G.bkAt=G.day; return false; } return G.day-G.bkAt>=60; }catch(e){ return false; } }
/* 아이폰·아이패드(새 아이패드는 Mac으로 표시되므로 터치 여부로 구분) */
function isIOS(){ try{ const u=navigator.userAgent||''; return /iPhone|iPad|iPod/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1); }catch(e){ return false; } }
function creditsLine(){ return `<details class="credits"><summary class="small muted">크레딧·라이선스</summary><p class="small muted keep" style="text-align:center;margin-top:6px">크레딧: 선수 얼굴 faces.js (ZenGM, Apache License 2.0) · 경기장 선수 그림 Kenney Sports Pack (CC0) · 저장 압축 lz-string (MIT) · 글꼴 Noto Sans KR, Black Han Sans, Barlow Condensed (SIL OFL) · 구단·선수·인물은 모두 가상입니다.</p></details>`; }
function startScreen(){ const st=UI.sstep||'main'; const m=meta(); const act=m.slots&&m.slots[m.active]; const canCont=!!(G||act);
  const foot=`<p class="small muted" style="margin-top:14px">구단과 선수는 모두 가상입니다. 일정 흐름, 샐러리캡, FA 등급과 보상, 외국인 선수 한도, 트레이드 마감, 포스트시즌 배당은 실제 한국 프로야구 규정을 단순화해 반영했습니다.</p>`;
  const back=(v,l)=>`<button class="lnk tsback" data-a="tsGo" data-v="${v}">← ${l}</button>`;
  if(st==='main'){ const tn=act&&act.tid!=null&&TEAM_DEF[act.tid]?`${TEAM_DEF[act.tid].city} ${TEAM_DEF[act.tid].nick}`:(act&&act.name)||'';
    return `<main class="fb-title" aria-label="프런트야구 시작 화면"><div class="fb-title-content">
      <div class="fb-brand"><h1 class="fb-wordmark"><span class="fb-sr">프런트야구</span></h1></div>
      <nav class="fb-menu" aria-label="시작 메뉴">
        ${canCont?`<button class="fb-button primary" data-a="tsCont"><b>이어하기</b><span>${tn?esc(tn):`슬롯 ${m.active}`}${act&&(act.date||act.y)?` · ${esc(act.date||act.y+'년')}`:''}</span></button>`:''}
        <button class="fb-button ${canCont?'':'primary'}" data-a="tsGo" data-v="mode"><b>새 게임</b>${canCont?'':'<span>단장 취임 또는 창단 드래프트로 시작합니다</span>'}</button>
        <button class="fb-button" data-a="tsGo" data-v="slots"><b>불러오기</b></button>
        <button class="fb-button" data-a="tsGo" data-v="settings"><b>설정</b></button>
      </nav>
      ${inFrame()&&isIOS()?`<p class="small ts-warn">Safari에서는 가끔 설정의 파일로 내보내기로 저장을 백업하세요. <a href="${esc(location.href)}" target="_blank" rel="noopener">새 탭에서 열기</a></p>`:''}
      </div><footer class="fb-footer"><span>프런트야구 <i>v${GAME_VER}</i></span><button class="lnk" data-a="tsGo" data-v="patch">패치 노트</button><a class="lnk" href="${FEEDBACK_URL}" target="_blank" rel="noopener">공식 카페 · 질문·피드백</a></footer></main>`; }
  if(st==='settings')return `<div class="gut"><div class="wrap" style="max-width:760px">${back('main','처음 화면')}<h2 class="ts-h">설정</h2><section class="card"><div class="row between"><h3 class="sec">화면 설명</h3><button class="btn" data-a="help">${helpOn()?'설명 접기':'설명 펼치기'}</button></div><p class="small muted">화면에서 기능 설명을 펼쳐 보일지 정합니다. 진행 방식과 구단 설정은 게임 안의 설정에서 바꿀 수 있습니다.</p></section>${teleCard()}${achStartLine()}<section class="card">${foot}${creditsLine()}</section></div></div>`;
  if(st==='patch')return `<div class="gut"><div class="wrap" style="max-width:760px">${back('main','처음 화면')}${patchCard()}</div></div>`;
  if(st==='slots')return `<div class="gut"><div class="wrap" style="max-width:760px">${back('main','처음 화면')}${slotsCard(true)}${exportCard()}</div></div>`;
  if(st==='mode'){ ensureWorld();
    return `<div class="gut"><div class="wrap" style="max-width:760px">${back('main','처음 화면')}
    <h2 class="ts-h">${UI.newSlot?`슬롯 ${UI.newSlot} · `:''}어떻게 시작할까요</h2><div class="mbg">
      <button class="mbig" data-a="smode" data-v="take"><em>바로 시작 · 난이도 선택</em><b>단장 취임</b><span>10개 구단 중 하나의 단장으로 부임합니다. 지금 선수단과 계약, 재정을 그대로 이어받아 고쳐 나갑니다. 구단마다 전력이 달라 강팀은 쉽고 약팀은 어렵습니다. 드래프트 없이 바로 시즌 준비에 들어갑니다.</span></button>
      <button class="mbig mfd" data-a="smode" data-v="fd"><em>드래프트 게임</em><b>창단 드래프트</b><span>리그 국내 선수 전원을 한데 모아 10개 구단이 25라운드에 걸쳐 새로 뽑습니다. 단장은 주전급을 뽑는 앞 10라운드를 직접 지명하고, 나머지는 스카우트에게 맡기거나 더 뽑을 수 있습니다. 능력치는 숨겨져 있고 기록으로 고릅니다. 빈 포지션을 채워 가며 처음부터 내 팀을 만듭니다.</span></button>
    </div>${foot}</div></div>`; }
  if(st==='prof'&&UI.pickT!=null)return gpStartView();
  if(UI.smode!=='take')UI.smode='fd'; const fd=UI.smode==='fd';
  return `<div class="gut"><div class="wrap" style="max-width:760px">${back('mode','시작 방식')}
  ${fd?fdSteps(1):''}<h2 class="ts-h">${fd?'창단 드래프트 · 함께할 구단을 고르세요':'단장 취임 · 맡을 구단을 고르세요'}</h2>

  ${UI.slotMsg?`<div class="note">${esc(UI.slotMsg)} <button class="lnk" data-a="tsGo" data-v="slots">저장 슬롯 보기</button></div>`:''}<section class="card">${pickTeams()}</section>${foot}</div></div>`;
}
function gameOverView(){
  return `<div class="card hero"><div class="eyebrow">${G.gameOver.y}시즌 종료</div><h2 class="sec">경질 통보</h2><p>${esc(G.gameOver.msg)}</p>
  <p class="small muted">재임 ${G.history.filter(h=>h.user).length}시즌. 재정 탭에서 시즌별 기록을 볼 수 있습니다.</p>
  <button class="btn primary" data-a="newgame">새 구단 맡기</button></div>`;
}


/* 창단 진행 표시: 구단 선택 → 창단 드래프트 → 시즌 준비 */
function fdSteps(cur){ const S=['구단 선택','드래프트','시즌 준비']; return `<ol class="fdsteps">${S.map((l,i)=>`<li class="${i+1<cur?'done':i+1===cur?'on':''}"><b>${i+1}</b><span>${l}</span></li>`).join('')}</ol>`; }

/* ===== 구단 이름 바꾸기(설정) ===== 기본은 가상 구단. 원하면 연고지·별칭을 직접 바꾼다. '새 게임에도 쓰기'를 켜면 이 브라우저에 저장해 새 게임에도 적용 */
const TN_KEY='fronttime-teamnames';
function teamNamesPreset(){ try{ const o=JSON.parse(localStorage.getItem(TN_KEY)||'null'); return o&&o.on&&Array.isArray(o.L)?o.L:null; }catch(e){ return null; } }
function teamNameCard(){ if(!G||!G.teams)return ''; let pre=null; try{ pre=JSON.parse(localStorage.getItem(TN_KEY)||'null'); }catch(e){}
  return `<section class="card"><h2 class="sec">구단 이름·로고 바꾸기</h2><p class="small muted">기본은 가상 구단입니다. 별칭을 원하는 대로 바꿀 수 있습니다(10자까지). 연고지는 지역·시장 규모와 묶여 있어 바꿀 수 없습니다. 로고는 구단마다 '로고'를 눌러 상징·색·글자를 고르거나 이미지를 올립니다(색을 바꾸면 그 구단의 화면 강조색도 바뀝니다). 이미 나온 기사·기록의 이름은 바뀌지 않습니다.</p>
  <div class="tn-l">${G.teams.map(t=>`<div class="tn-r">${badge(t.id,24)}<b class="tn-c">${esc(t.city)}</b><input class="tn-n" data-tn="${t.id}" data-k="nick" value="${esc(t.nick)}" maxlength="10" aria-label="별칭"><span class="small muted">${esc(TEAM_DEF[t.id].city+' '+TEAM_DEF[t.id].nick)}</span><button class="tc-i${UI.lgEdit===t.id?' on':''}" data-a="lgOpen" data-v="${t.id}">로고</button></div>${UI.lgEdit===t.id?lgEditor(t):''}`).join('')}</div>
  <label class="chk"><input type="checkbox" data-a="tnPre" ${pre&&pre.on?'checked':''}> 새 게임에도 이 이름 쓰기(이 브라우저에 저장)</label>
  <div class="row"><button class="btn primary" data-a="tnSave">이름 저장</button><button class="btn" data-a="tnReset">기본 이름으로</button></div>${UI.tnMsg?`<p class="small">${esc(UI.tnMsg)}</p>`:''}</section>`; }
/* 로고 편집: 상징(원래 10개 구단 엠블럼 + 별·왕관·배트·산 + 글자), 주색·보조색·바탕색, 글자(3자), 이미지 올리기(96px로 줄여 저장) */
function lgPrev(t,k){ const keep=t.logo; t.logo=Object.assign({},keep||{},{emb:k}); delete t.logo.img; const h=badge(t.id,30); if(keep)t.logo=keep; else delete t.logo; return h; }
function lgEditor(t){ const P=tpal(t); const L=t.logo||{}; const cur=L.emb||(TEAM_DEF[t.id]||t).nick;
  return `<div class="lg-ed"><div class="row" style="gap:10px;align-items:center">${badge(t.id,56)}<div class="small muted">${L.img?'올린 이미지를 쓰는 중입니다. 상징을 고르려면 이미지를 지우세요.':'상징을 고르고 색을 바꾸면 바로 반영됩니다.'}</div></div>
    <div class="lg-emb" role="group" aria-label="상징">${LOGO_EMB.map(k=>`<button class="lg-e${cur===k&&!L.img?' on':''}" data-a="lgEmb" data-v="${t.id}:${esc(k)}" title="${esc(k)}">${lgPrev(t,k)}<i>${esc(k)}</i></button>`).join('')}</div>
    <div class="row wrapr lg-col"><label>주색 <input type="color" data-lg="${t.id}:c1" value="${P[0]}"></label><label>보조색 <input type="color" data-lg="${t.id}:c2" value="${P[1]}"></label><label>바탕색 <input type="color" data-lg="${t.id}:c3" value="${P[2]}"></label><label>글자 <input type="text" data-lg="${t.id}:code" value="${esc(L.code||t.code)}" maxlength="3" style="width:4.5em" aria-label="로고 글자"></label></div>
    <div class="row wrapr lg-col"><label class="btn small">이미지 올리기<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-lgimg="${t.id}" hidden></label>${L.img?`<button class="btn small" data-a="lgImgDel" data-v="${t.id}">이미지 지우기</button>`:''}<button class="btn small" data-a="lgReset" data-v="${t.id}">기본 로고로</button></div>
    ${UI.lgMsg?`<p class="small">${esc(UI.lgMsg)}</p>`:''}<p class="small muted">이미지는 정사각형에 가까운 그림이 잘 맞습니다. 올리면 96px로 줄여 저장 파일에 넣습니다.</p></div>`; }
function lgApply(tid,patch,msg){ const r=setTeamLogo(tid,patch); UI.lgMsg=r||msg||''; if(!r){ if(tid===G.user)setTeamVars(team(G.user)); let on=false; try{ const o=JSON.parse(localStorage.getItem(TN_KEY)||'null'); on=!!(o&&o.on); }catch(e){} if(on)tnStore(true); save(); } render(); }
function lgImgFile(tid,file){ if(!file)return; if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)){ UI.lgMsg='png·jpg·webp·gif 이미지만 올릴 수 있습니다.'; render(); return; }
  const rd=new FileReader(); rd.onload=()=>{ const im=new Image(); im.onload=()=>{ const S=96, c=document.createElement('canvas'); c.width=S; c.height=S; const x=c.getContext('2d'); const s=Math.max(S/im.width,S/im.height); const w=im.width*s, h=im.height*s; x.drawImage(im,(S-w)/2,(S-h)/2,w,h);
      let u=''; try{ u=c.toDataURL('image/webp',.85); if(!/^data:image\/webp/.test(u))u=c.toDataURL('image/png'); }catch(e){ u=''; } if(!u){ UI.lgMsg='이미지를 읽지 못했습니다.'; render(); return; } lgApply(tid,{img:u},'로고 이미지를 바꿨습니다.'); };
    im.onerror=()=>{ UI.lgMsg='이미지를 읽지 못했습니다.'; render(); }; im.src=rd.result; }; rd.readAsDataURL(file); }
if(typeof document!=='undefined')document.addEventListener('change',e=>{ const el=e.target; if(!el||!el.dataset)return;
  if(el.dataset.lg){ const [tid,k]=el.dataset.lg.split(':'); lgApply(+tid,{[k]:el.value},k==='code'?'로고 글자를 바꿨습니다.':'로고 색을 바꿨습니다.'); }
  else if(el.dataset.lgimg){ lgImgFile(+el.dataset.lgimg,el.files&&el.files[0]); } });
function tnRead(){ const L={}; document.querySelectorAll('input[data-tn]').forEach(el=>{ const id=+el.dataset.tn; (L[id]=L[id]||{id})[el.dataset.k]=el.value; }); return Object.values(L); }
function tnStore(on){ try{ if(on===false){ const o=JSON.parse(localStorage.getItem(TN_KEY)||'null')||{}; o.on=false; localStorage.setItem(TN_KEY,JSON.stringify(o)); return; } localStorage.setItem(TN_KEY,JSON.stringify({on:true,L:G.teams.map(t=>({id:t.id,city:t.city,nick:t.nick,logo:t.logo||null}))})); }catch(e){} }

/* 휴대폰 창단 드래프트 표: iOS에서 끝 너머로 당기면 표가 통째로 밀려 빈칸이 드러난다(overscroll-behavior가 안 먹는 웹뷰가 있음).
   세로만 스크롤(touch-action:pan-y)하고 위·아래 끝에서 더 당기는 움직임을 막는다. 가로로 쓸면 열 묶음을 넘긴다(대각선으로 흔들리지 않게) */
function fdNoBounce(el){ let x0=0,y0=0,ax=null;
  el.addEventListener('touchstart',e=>{ const t=e.touches[0]; x0=t.clientX; y0=t.clientY; ax=null; el._sw=0; },{passive:true});
  el.addEventListener('touchmove',e=>{ if(e.touches.length>1)return; const t=e.touches[0], dx=t.clientX-x0, dy=t.clientY-y0;
    if(!ax){ if(Math.abs(dx)<6&&Math.abs(dy)<6)return; ax=Math.abs(dx)>Math.abs(dy)?'x':'y'; }
    if(ax==='x'){ if(e.cancelable)e.preventDefault(); if(!el._sw&&Math.abs(dx)>50&&el._twGo){ el._sw=1; el._twGo(dx<0?1:-1); } return; }
    const top=el.scrollTop<=0, bot=el.scrollTop+el.clientHeight>=el.scrollHeight-1; if(((dy>0&&top)||(dy<0&&bot))&&e.cancelable)e.preventDefault(); },{passive:false}); }
