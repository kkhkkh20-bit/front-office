/* ---------- 화면 조립 ---------- */
function render(){
  const app=$('#app');
  if(!G||UI.title){ setTeamVars(null); app.innerHTML=startScreen(); renderSheet(); return; }
  try{ annCheck(); }catch(e){}
  setTimeout(()=>{ try{ document.querySelectorAll('nav.subtabs,.itabs,.tstrip').forEach(n=>{ const ov=n.scrollWidth>n.clientWidth+2; n.classList.toggle('ovx',ov); const b=n.querySelector('button.on'); if(ov&&b)n.scrollLeft=Math.max(0,b.offsetLeft-n.clientWidth/2+b.offsetWidth/2); }); }catch(e){} },0);
  setTimeout(()=>{ try{ campAfter(); if(UI.facFocus){ const el=document.getElementById('fci-'+UI.facFocus); UI.facFocus=null; if(el){ el.scrollIntoView({block:'center'}); el.classList.add('flash'); } } }catch(e){} try{ document.querySelectorAll('.chips').forEach(el=>el.classList.toggle('ovf',el.scrollWidth>el.clientWidth+2)); }catch(e){} },0);
  if(UI.tab==='roster'){ G.tutFlags=G.tutFlags||{}; G.tutFlags.roster=true; } if(G.tut&&!G.tut.done){ try{ tutTick(); }catch(e){} }
  const t=team(G.user); setTeamVars(t);
  const per=period(); const unread=G.mail.filter(mailNeeds).length; const b=blockNow();
  /* 창단 드래프트 동안은 드래프트만: 날짜 진행·메뉴·예산 표시를 숨긴다 */
  if(((G.fd&&!G.fd.done)||G.fdWait)&&UI.tab!=='inbox'){ const F=G.fd; const pk=F&&F.picks[F.cur];
    const KS=['.fdt-w','#sheet .sheet']; const keep=KS.map(q=>{ const e=document.querySelector(q); return e?[e.scrollTop,e.scrollLeft]:null; });
    app.innerHTML=`<div class="dshell"><header class="dtop"><div class="gut"><div class="wrap dtbar">${badge(G.user,30)}<div class="dti"><b>${esc(t.city)} ${esc(t.nick)}</b><span>창단 드래프트${F?(F.open===false?' · 탐색 시간':pk?` · ${pk.rd}/${FD_ROUNDS}라운드`:''):' · 준비'}</span></div>
      <button class="mailbtn" data-a="inbox" aria-label="소식함">${ICO.mail}${unread?`<i>${unread>99?'99+':unread}</i>`:''}</button><button class="btn small" data-a="toTitle">처음 화면</button></div>${F&&!G.fdWait?`<div class="wrap">${fdTicker()}</div>`:''}</div></header>
      <div class="gut"><div class="wrap"><main class="content dcontent">${G.fdWait?fdWaitView():fdView()}</main></div></div></div>`;
    document.body.classList.toggle('help',helpOn()); markHints(app); renderSheet(); KS.forEach((q,i)=>{ const e=document.querySelector(q); if(e&&keep[i]){ e.scrollTop=keep[i][0]; e.scrollLeft=keep[i][1]; } }); return; }
  const nav=NAV; const ic=i=>ICO[i]||ICO2[i]; const inMenu=!BNAV.includes(UI.tab); const menuAlert=NAV.some(([k])=>!BNAV.includes(k)&&tabAlert(k));
  app.innerHTML=`<div class="shell">
  <aside class="rail" aria-label="메뉴"><div class="brand">${badge(G.user,38)}<b>${esc(t.city)}<br>${esc(t.nick)}</b></div>${nav.map(([k,l,i])=>`<button data-a="tab" data-v="${k}" class="${UI.tab===k?'on':''}">${ic(i)}${l}${k==='inbox'&&unread?`<span class="cnt">${unread}</span>`:tabAlert(k)?'<i class="sdot"></i>':''}</button>`).join('')}<button class="railme ${UI.tab==='me'?'on':''}" data-a="tab" data-v="me">${avImg(meAv())}<span>${esc(meName()||'단장 프로필')}</span></button><button class="railset" data-a="go" data-v="cfg:set">${ICO2.cog}설정 · 권한</button></aside>
  <div class="mainc">
   <header class="top"><div class="gut"><div class="tbar wrap">
     <div class="club${G.unemp?'':' clubbtn'}" ${G.unemp?'':'data-a="myRos" role="button" tabindex="0" title="우리 팀 현황"'}>${G.unemp?'<span class="tdi">야</span>':badge(G.user,30)}<div><b>${G.unemp?`야인 · 명성 ${G.rep}`:`<i class="cb-c">${esc(t.city)} </i>${esc(t.nick)}<i class="cb-v">▾</i>`}</b><span>${wide()?dstr(G.day):`<i class="cb-y">${dobj(G.day).y}.</i>${dsh(G.day)} ${WD[dobj(G.day).w]}`}<i class="cb-p"> · ${PERIOD[per]}</i></span></div></div>
     ${G.unemp?'':`<button class="mailbtn calbtn" data-a="calOpen" aria-label="캘린더" title="캘린더 · 마감과 일정">${ICO.cal}</button>`}${`<button class="mailbtn" data-a="inbox" aria-label="소식함${unread?` 안 읽음 ${unread}`:''}">${ICO.mail}${unread?`<i>${unread>99?'99+':unread}</i>`:''}</button>`}<div class="goset">${G.unemp?`<button class="continue" data-a="adv" data-v="event" ${b?'disabled':''}><span class="cl"><b>계속</b><i>제의가 오거나 2주가 지날 때까지</i></span>${ICO.ff}</button>`:per==='season'?`<button class="step" data-a="adv" data-v="next" ${b?'disabled':''} aria-label="한 경기 진행" title="다음 경기 하나만 진행"><span class="st-l">1경기</span><span class="st-x"> 진행</span></button><button class="continue${!b&&ibNeedList().length?' need':''}" data-a="adv" data-v="event" ${b?'disabled':''}><span class="cl" title="다음 소식이 올 때까지, 최대 한 주 진행합니다. 확인할 소식이 있으면 그 소식부터 엽니다"><b>계속</b><i>${esc(b?nextLabel():contSub('다음 소식까지'))}</i></span>${ICO.ff}</button>`:`<button class="step" data-a="adv" data-v="day" ${b?'disabled':''} aria-label="하루 진행" title="하루만 진행"><span class="st-l">하루</span><span class="st-x"> 진행</span></button><button class="continue${!b&&ibNeedList().length?' need':''}" data-a="adv" data-v="next" ${b?'disabled':''}><span class="cl"><b>${per==='post'?'다음 경기':'계속'}</b><i>${esc(b?nextLabel():contSub(nextLabel()))}</i></span>${ICO.ff}</button>`}</div>
   </div></div>${wide()&&UI.tab!=='home'?`<div class="gut sbwrap"><div class="wrap">${stripBar()}</div></div>`:''}${b?`<div class="blk gut"><div class="wrap">${esc(b)}${blkLink(b)}</div></div>`:''}</header>
   <div class="gut"><div class="wrap">
     <div class="subhead">${UI.fromMail&&UI.tab!=='inbox'?'<button class="btn small back2ib" data-a="ibReturn">◀ 소식함으로</button>':''}<h1>${TITLE[UI.tab]}</h1><div class="meta">${metaChips()}<button class="helpbtn${helpOn()?' on':''}" data-a="help" aria-label="설명 ${helpOn()?'숨기기':'보기'}" title="설명 ${helpOn()?'숨기기':'보기'}">?</button></div></div>
     <main class="content">${tabBody()}</main>${UI.stamp?stampView():''} <!-- 도장(합의·거래 성사)은 어느 화면에서든 맨 위에 뜬다 -->
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
function tabBody(){
  if(G.gameOver&&(UI.tab==='inbox'||UI.tab==='home'))return gameOverView();
  if(UI.tab==='roster')G.tutFlags.roster=true;
  if(!TITLE[UI.tab])UI.tab='home';
  if(G.unemp&&!['home','inbox','league'].includes(UI.tab))return csec('야인입니다',`<p>지금은 맡은 구단이 없습니다. 리그 탭에서 판도를 보고, 제의가 오면 홈에서 답하세요.</p><button class="btn primary" data-a="tab" data-v="home">홈으로</button>`);
  return {cal:calView,home:homeView,inbox:inboxView,roster:rosterView,trade:tradeCenter,transfer:transferView,scout:scoutView,train:trainView,staff:staffView,cfg:cfgView,me:meView,league:leagueView,club:clubView}[UI.tab]();
}
function anySave(){ try{ const m=meta(); return SLOT_IDS.some(n=>m.slots&&m.slots[n]); }catch(e){ return false; } }
function slotsCard(start){ const m=meta(); const used=SLOT_IDS.reduce((a,n)=>a+(m.slots[n]?slotSize(n):0),0); const rows=SLOT_IDS.filter(n=>m.slots[n]||n===SLOT_IDS.find(k=>!m.slots[k])||UI.slotAll).map(n=>{ const s=m.slots[n]; const cur=G&&m.active===n;
    return `<div class="slot ${cur?'on':''}"><div><b>슬롯 ${n}${cur?' · 진행 중':''}</b><div class="small muted">${s?`${esc(s.name||'')} · ${esc(s.date||s.y+'년')}${s.over?' · 경질됨':''} · ${slotSize(n)}KB`:'비어 있음'}</div></div>
      <div class="row">${s&&cur?`<button class="btn small" data-a="slotCopy" title="지금 진행 상황을 빈 슬롯에 따로 저장해 둡니다. 계속 진행하는 곳은 이 슬롯입니다">빈 슬롯에 따로 저장</button>`:''}${s&&!cur?`<button class="btn small primary" data-a="slotLoad" data-v="${n}">이어하기</button>`:''}${start?`<button class="btn small" data-a="slotNew" data-v="${n}">${s?'덮어쓰고 새 게임':'새 게임'}</button>`:''}${s&&!cur?`<button class="btn small danger" data-a="slotDel" data-v="${n}">삭제</button>`:''}</div></div>`; }).join('');
  const filled=SLOT_IDS.filter(n=>m.slots[n]).length;
  return `<section class="card"><div class="row between"><h2 class="sec">저장 슬롯</h2><span class="small muted">${filled}/${SLOTS} 사용 · 약 ${(used/1024).toFixed(1)}MB</span></div><div class="slots">${rows}</div>${filled+1<SLOTS?`<button class="btn small" data-a="slotAll">${UI.slotAll?'빈 슬롯 숨기기':'빈 슬롯 모두 보기'}</button>`:''}<p class="small muted">슬롯은 ${SLOTS}개까지입니다. 브라우저 저장 공간은 보통 5MB 안팎이라, 오래 진행한 게임을 여러 개 두면 공간이 모자랄 수 있습니다. 그때는 설정의 "파일로 내보내기"로 보관하세요.</p>${UI.slotMsg?`<div class="note">${esc(UI.slotMsg)}</div>`:''}</section>`; }
function exportCard(){ return `<section class="card"><h2 class="sec">내보내기 · 불러오기</h2>
  <p class="small muted">진행 상황은 이 브라우저에만 저장됩니다. 브라우저 데이터를 지우면 사라지니, 가끔 내보내 두세요. 다른 기기에서는 내보낸 코드를 붙여 넣어 이어 할 수 있습니다.</p>
  <div class="row"><button class="btn" data-a="expFile">파일로 내보내기</button><button class="btn" data-a="expCode">코드 만들기</button><label class="btn">파일 불러오기<input type="file" accept=".txt,.json" data-a="impFile" style="display:none"></label></div>
  ${UI.expCode?`<textarea class="code" readonly>${UI.expCode}</textarea><p class="small muted">이 코드를 복사해 보관하세요. 길이 ${Math.round(UI.expCode.length/1024)}KB.</p>`:''}
  <textarea class="code" id="impCode" placeholder="내보낸 코드를 여기에 붙여 넣으세요"></textarea>
  <button class="btn primary" data-a="impCode">코드로 불러오기 (현재 슬롯에 덮어씀)</button>
  ${UI.impMsg?`<div class="note">${esc(UI.impMsg)}</div>`:''}${SAVE_ERR?`<div class="note bad">${esc(SAVE_ERR)}</div>`:''}</section>`; }
function importText(t){ let g=null; try{ g=JSON.parse(t[0]==='{'?t:LZString.decompressFromBase64(t)); }catch(e){} if(!g||g.ver!==4){ UI.impMsg='코드를 읽지 못했습니다. 내보낸 코드 전체를 붙여 넣었는지 확인하세요.'; render(); return; } G=g; try{migrateDraft();}catch(e){} save(); UI.impMsg='불러왔습니다.'; UI.tab='home'; render(); }
function ensureWorld(){ if(UI.world||UI.worldBusy)return; UI.worldBusy=true; setTimeout(()=>{ const G0=G; try{ buildWorld(); UI.world=G;
    /* 구단마다 취임 첫날 예산을 미리 계산해 재정 압박 구단을 표시한다 */
    try{ const js=JSON.stringify(UI.world); for(const x of UI.world.preview){ G=JSON.parse(js); claimTeam(x.tid); x.room=Math.round(budget().roomGoal); try{ x.fin=fdFin(x.tid); x.ownN=bossOf(x.tid).own.name; }catch(e){} } }catch(e){ console.error(e); }
  }catch(e){ console.error(e); UI.worldErr=true; } finally{ G=G0; UI.worldBusy=false; render(); } },60); }
const SLK={C:'포수','1B':'1루','2B':'2루','3B':'3루',SS:'유격',LF:'좌익',CF:'중견',RF:'우익',DH:'지명',SP:'선발',RP:'불펜',P:'투수'};
const G0Y=()=>2026; const eok=v=>`${Math.round(v/100)}억`;
function pickTeams(){ if(UI.worldErr)return `<div class="list">${TEAM_DEF.map((d,i)=>`<button class="item wa" data-a="start" data-v="${i}">${badge(i,34)}<span class="nm"><b>${d.city} ${d.nick}</b></span><span class="rt small muted">선택</span></button>`).join('')}</div>`;
  if(!UI.world){ ensureWorld(); return `<div class="worldload"><span class="spin"></span><p>리그를 만드는 중입니다. 10개 구단 선수단을 만들고 지난 시즌 144경기를 치르고 있습니다.</p></div>`; }
  const P=[...UI.world.preview].sort((a,b)=>a.proj-b.proj); const OL={win:'성적 우선',profit:'수익 우선',pr:'홍보 우선'};
  const card=x=>{ const d=TEAM_DEF[x.tid]; const over=x.pay>x.cap; const mv=x.prev-x.proj; const tight=over||(x.room!=null&&x.room<0);
    return `<div class="tmk" role="button" tabindex="0" data-a="start" data-v="${x.tid}"><div class="tp-h">${badge(x.tid,38)}<div><b>${d.city} ${d.nick}</b><span>${d.indie?'독립구단':'모기업 구단'} · ${d.region} · 시장 ${Math.round(d.market*100)}</span></div>
      <div class="tp-r ${x.proj<=3?'hi':x.proj<=6?'mid':'lo'}"><i>예상</i><b>${x.proj}<em>위</em></b><span>${x.mode}</span></div></div>
      <div class="tp-g"><span><i>지난 시즌</i><b>${x.prev}위 · ${x.w}승 ${x.l}패</b>${mv?`<em class="${mv<0?'dn':'up'}">${mv>0?'▲':'▼'}${Math.abs(mv)}</em>`:''}</span><span><i>구단주</i><b>${OL[x.owner]}</b></span>
        <span><i>강점</i><b>${x.best.map(([k,r])=>`${SLK[k]} ${r}위`).join(' · ')}</b></span><span><i>약점</i><b class="wk">${x.worst.map(([k,r])=>`${SLK[k]} ${r}위`).join(' · ')}</b></span>
        <span><i>간판</i><b>${x.top.map(p=>`${esc(p.name)}(${p.pos} ${dv(p.o)})`).join(', ')}</b></span><span><i>연봉 총액</i><b class="${over?'wk':''}">${money(x.pay)} / 캡 ${money(x.cap)}${over?' 초과':''}</b></span><span><i>첫해 예산</i><b class="${tight?'wk':''}">${x.room==null?'-':x.room<0?`지원 한도 ${money(-x.room)} 초과`:`여유 ${money(x.room)}`}</b></span></div>
      <div class="tp-t">${tight?'<span class="pill bad">재정 압박 구단</span>':''}${[x.age<=27.8?'젊은 선수단':x.age>=28.8?'노장 위주':'', x.young?`24세 이하 1군급 ${x.young}명`:'', x.vets>=2?`33세 이상 주전급 ${x.vets}명`:'', x.faSoon?`FA 앞둔 주전 ${x.faSoon}명`:'', d.indie?'모기업 지원 없음':''].filter(Boolean).map(t=>`<span class="pill">${t}</span>`).join('')}<button class="lnk tp-more" data-a="tpOpen" data-v="${x.tid}">자세히</button></div></div>`; };
  if(UI.smode==='fd'){ const OLV={win:'성적 우선',profit:'수익 우선',pr:'홍보 우선'};
    const P2=[...UI.world.preview].sort((a,b)=>((b.fin||{}).avail||0)-((a.fin||{}).avail||0));
    const ORD=[...UI.world.preview].map(x=>({tid:x.tid,v:((x.fin||{}).avail||0)+hn('fdo'+G0Y(),x.tid)*30})).sort((a,b)=>a.v-b.v).map(x=>x.tid);
    const fcard=x=>{ const d=TEAM_DEF[x.tid]; const f=x.fin||{}; const ok=f.avail>=f.cap, mid=f.avail>=f.cap*.75; const age=G0Y()-(STAD_BUILT[x.tid]||2000);
      return `<div class="tmk" role="button" tabindex="0" data-a="start" data-v="${x.tid}"><div class="tp-h">${badge(x.tid,38)}<div><b>${d.city} ${d.nick}</b><span>${d.indie?'독립구단':'모기업 구단'} · ${d.region} · 시장 ${Math.round(d.market*100)}</span></div>
        <div class="tp-r ${ok?'hi':mid?'mid':'lo'}"><i>캡까지 쓰면</i><b style="font-size:18px">${(f.avail||0)>=(f.cap||0)?'+':'-'}${eok(Math.abs((f.avail||0)-(f.cap||0)))}</b><span>선수 연봉에 쓸 수 있는 돈 ${eok(Math.max(0,f.avail||0))}</span></div></div>
        <p class="tp-sum">${(()=>{ const o=ORD.indexOf(x.tid)+1; return [ok?'자금 넉넉':mid?'자금 보통':'자금 빠듯', o<=3?'지명 빠름':o>=8?'지명 늦음':'지명 중간', d.market>=1.15?'큰 시장':d.market<=.9?'작은 시장':'', d.indie?'모기업 없음':OLV[x.owner]+' 구단주'].filter(Boolean).join(' · '); })()}</p>
        <div class="tp-g"><span><i>창단 지명 순서</i><b>1라운드 ${ORD.indexOf(x.tid)+1}번째</b></span><span><i>구단주</i><b>${esc(x.ownN||'')} 회장 · ${OLV[x.owner]}</b></span><span><i>예상 수입</i><b>${eok(f.I||0)}</b></span>
          <span><i>모기업 지원 한도</i><b class="${d.indie?'wk':''}">${d.indie?'없음':eok(f.sup||0)}</b></span><span><i>선수 연봉 외 지출</i><b>${eok(f.other||0)}</b></span>
          <span><i>보유 현금</i><b>${eok(f.cash||0)}</b></span><span><i>홈구장</i><b>${(STAD_NM&&STAD_NM[x.tid])?esc(STAD_NM[x.tid])+' · ':''}${(STAD_CAP[x.tid]||0).toLocaleString()}석 · ${age}년 된 구장</b></span></div>
        <div class="tp-t"><span class="pill ${ok?'good':mid?'':'bad'}">난이도 ${ok?'쉬움':mid?'보통':'어려움'}</span><span class="pill">1라운드 ${ORD.indexOf(x.tid)+1}번째 지명</span>${d.indie?'<span class="pill">모기업 지원 없음</span>':''}<button class="lnk tp-more" data-a="tpOpen" data-v="${x.tid}">자세히</button></div></div>`; };
    return `<p class="small muted">선수는 드래프트로 새로 뽑으므로 전력은 같은 출발선입니다. 차이는 돈과 시장입니다.</p><details class="frule"><summary class="small">예산 여유와 지명 순서 설명</summary><p class="small muted">예산 여유가 적은 구단일수록 먼저 지명하고, 라운드마다 순서가 뒤집힙니다. 예산 여유는 예상 수입과 모기업 지원 한도에서 선수 연봉 외 지출을 뺀 값으로, 국내 선수 연봉에 쓸 수 있는 돈입니다. 큰 숫자는 샐러리캡(${eok((P2[0]&&P2[0].fin&&P2[0].fin.cap)||0)})까지 채웠을 때 남거나 모자라는 돈입니다. 예산 여유는 모기업 지원을 한도까지 받는다고 가정한 최대치입니다. 창단 뒤 화면 위 <b>예산 여유</b>는 구단주가 정한 지원 목표 기준이라 이보다 훨씬 작게 나옵니다.</p></details>
    <div class="tpg cmp">${P2.map(fcard).join('')}</div><div class="row" style="margin-top:10px"><button class="btn" data-a="reroll">다른 리그로 다시 만들기</button></div>`; }
  return `<p class="small muted">예상 순위는 전력분석팀 추정치입니다. 외국인 선수는 취임 후 새로 뽑아야 하며, 예상은 비슷한 수준의 외국인을 데려온다고 보고 계산했습니다. 감독도 취임 후 새로 선임합니다.</p>
    <div class="tpg cmp">${P.map(card).join('')}</div><div class="row" style="margin-top:10px"><button class="btn" data-a="reroll">다른 리그로 다시 만들기</button><span class="small muted">선수단은 새 게임마다 무작위로 만들어집니다.</span></div>`; }
function inFrame(){ try{ return window.self!==window.top; }catch(e){ return true; } }
function creditsLine(){ return `<details class="credits"><summary class="small muted">크레딧·라이선스</summary><p class="small muted keep" style="text-align:center;margin-top:6px">크레딧: 선수 얼굴 faces.js (ZenGM, Apache License 2.0) · 경기장 선수 그림 Kenney Sports Pack (CC0) · 저장 압축 lz-string (MIT) · 글꼴 Noto Sans KR, Black Han Sans, Barlow Condensed (SIL OFL) · 구단·선수·인물은 모두 가상입니다.</p></details>`; }
function startScreen(){ const st=UI.sstep||'main'; const m=meta(); const act=m.slots&&m.slots[m.active]; const canCont=!!(G||act);
  const foot=`<p class="small muted" style="margin-top:14px">구단과 선수는 모두 가상입니다. 일정 흐름, 샐러리캡, FA 등급과 보상, 외국인 선수 한도, 트레이드 마감, 포스트시즌 배당은 실제 한국 프로야구 규정을 단순화해 반영했습니다.</p>`;
  const back=(v,l)=>`<button class="lnk tsback" data-a="tsGo" data-v="${v}">← ${l}</button>`;
  if(st==='main'){ const tn=act&&act.tid!=null&&TEAM_DEF[act.tid]?`${TEAM_DEF[act.tid].city} ${TEAM_DEF[act.tid].nick}`:(act&&act.name)||'';
    return `<div class="gut"><div class="wrap ts-wrap"><div class="ts">
      <div class="ts-bg" aria-hidden="true">${TEAM_DEF.map((d,i)=>badge(i,30)).join('')}</div>
      <div class="kicker">한국 프로야구형 가상 리그 · 단장 시뮬레이션</div><h1>프런트타임</h1>
      <p class="ts-sub">경기는 감독이 합니다. 단장은 선수를 모으고, 팀을 만들고, 돈을 지킵니다.</p>${achStartLine()}
      <div class="ts-menu">
        ${canCont?`<button class="tsb primary" data-a="tsCont"><b>이어하기</b><span>슬롯 ${m.active}${tn?` · ${esc(tn)}`:''}${act&&(act.date||act.y)?` · ${esc(act.date||act.y+'년')}`:''}</span></button>`:''}
        <button class="tsb ${canCont?'':'primary'}" data-a="tsGo" data-v="team"><b>새 게임</b><span>창단 드래프트로 처음부터 팀을 만듭니다</span></button>
        ${anySave()?`<button class="tsb" data-a="tsGo" data-v="slots"><b>저장 슬롯</b><span>불러오기 · 덮어쓰기 · 삭제</span></button>`:''}
      </div><p class="ts-ver">버전 ${GAME_VER} · 무료 게임</p>${typeof TELE!=='undefined'&&TELE&&(TELE.ph||TELE.ga)&&teleOn()?'<p class="small muted">게임 개선을 위해 익명 플레이 기록을 수집합니다. 설정 > 게임 설정에서 끌 수 있습니다.</p>':''}
      ${inFrame()?`<p class="small ts-warn">iPhone·iPad의 Safari는 이 화면 안에서 저장이 지워질 수 있습니다. <a href="${esc(location.href)}" target="_blank" rel="noopener">새 탭에서 열기</a>를 권하고, 가끔 설정의 "파일로 내보내기"로 백업하세요.</p>`:''}</div>${foot}${creditsLine()}</div></div>`; }
  if(st==='slots')return `<div class="gut"><div class="wrap" style="max-width:760px">${back('main','처음 화면')}${slotsCard(true)}</div></div>`;
  if(st==='mode'&&false){ ensureWorld();
    return `<div class="gut"><div class="wrap" style="max-width:760px">${back('main','처음 화면')}
    <h2 class="ts-h">${UI.newSlot?`슬롯 ${UI.newSlot} · `:''}어떻게 시작할까요</h2><div class="mbg">
      <button class="mbig" data-a="smode" data-v="take"><em>현실적인 시작</em><b>단장 취임</b><span>10개 구단 중 하나의 단장으로 부임합니다. 지금 선수단과 계약, 재정을 그대로 이어받아 고쳐 나갑니다.</span></button>
      <button class="mbig mfd" data-a="smode" data-v="fd"><em>드래프트 게임</em><b>창단 드래프트</b><span>리그 국내 선수 전원을 한데 모아 10개 구단이 25라운드에 걸쳐 새로 뽑습니다. 단장은 주전급을 뽑는 앞 10라운드를 직접 지명하고, 나머지는 스카우트에게 맡기거나 더 뽑을 수 있습니다. 능력치는 숨겨져 있고 기록으로 고릅니다. 빈 포지션을 채워 가며 처음부터 내 팀을 만듭니다.</span></button>
    </div>${foot}</div></div>`; }
  if(st==='prof'&&UI.pickT!=null)return gpStartView();
  UI.smode='fd'; const fd=true;
  return `<div class="gut"><div class="wrap" style="max-width:760px">${back('main','처음 화면')}
  ${fdSteps(1)}<h2 class="ts-h">${fd?'창단 드래프트 · 함께할 구단을 고르세요':'단장 취임 · 맡을 구단을 고르세요'}</h2>

  ${UI.slotMsg?`<div class="note">${esc(UI.slotMsg)} <button class="lnk" data-a="tsGo" data-v="slots">저장 슬롯 보기</button></div>`:''}<section class="card">${pickTeams()}</section>${foot}</div></div>`;
}
function gameOverView(){
  return `<div class="card hero"><div class="eyebrow">${G.gameOver.y}시즌 종료</div><h2 class="sec">경질 통보</h2><p>${esc(G.gameOver.msg)}</p>
  <p class="small muted">재임 ${G.history.filter(h=>h.user).length}시즌. 재정 탭에서 시즌별 기록을 볼 수 있습니다.</p>
  <button class="btn primary" data-a="newgame">새 구단 맡기</button></div>`;
}


/* 창단 진행 표시: 구단 선택 → 창단 드래프트 → 시즌 준비 */
function fdSteps(cur){ const S=['구단 선택','드래프트','시즌 준비']; return `<ol class="fdsteps">${S.map((l,i)=>`<li class="${i+1<cur?'done':i+1===cur?'on':''}"><b>${i+1}</b><span>${l}</span></li>`).join('')}</ol>`; }
