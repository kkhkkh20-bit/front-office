/* ---------- PC 화면(FM식): 위 두 줄 메뉴 + 넓은 카드 화면 ----------
   1줄: 뒤로·앞으로, 구단 배지, 큰 메뉴(내려 펼치면 하위 화면), 캘린더·소식함·단장·설정, 날짜, 계속
   2줄: 지금 메뉴의 하위 탭(왼쪽)과 성적·예산 칩(오른쪽). 휴대폰·좁은 화면은 예전 배치 그대로 */
const fmOn=()=>typeof matchMedia!=='undefined'&&matchMedia('(min-width:1100px)').matches;
const FM_MENU=['home','roster','trade','transfer','staff','league','club'];
/* 뒤로·앞으로: 메뉴와 하위 탭 이동을 기억한다(최근 40개) */
function fmKey(){ const t=UI.tab; return SUBS[t]?t+':'+curSub(t):t; }
function fmNavRec(){ const H=UI.navH=UI.navH||[]; if(UI.navI==null)UI.navI=-1; const k=fmKey(); if(UI._navSkip){ UI._navSkip=false; return; } if(H[UI.navI]===k)return; H.length=UI.navI+1; H.push(k); if(H.length>40)H.shift(); UI.navI=H.length-1; }
function fmGoKey(k){ const [t,s]=k.split(':'); UI.tab=t; if(s){ if(t==='league')UI.lseg=s; else { UI.sub=UI.sub||{}; UI.sub[t]=s; } } UI._navSkip=true; closeSheets(); render(); try{ scrollTo(0,0); }catch(e){} }
function fmBack(){ const H=UI.navH||[]; if(!(UI.navI>0))return; UI.navI--; fmGoKey(H[UI.navI]); }
function fmFwd(){ const H=UI.navH||[]; if(UI.navI==null||UI.navI>=H.length-1)return; UI.navI++; fmGoKey(H[UI.navI]); }
/* 카드가 세로로 길게 쌓이는 화면은 PC에서 두 칸으로(FM 대시보드처럼). 표가 넓은 화면에는 쓰지 않는다 */
function fmCols(h){ return fmOn()?`<div class="fmcols">${h}</div>`:h; }
function fmSubRow(){ const tab=UI.tab; const back=UI.fromMail&&tab!=='inbox'?'<button class="fm-ib" data-a="ibReturn">◀ 소식함으로</button>':'';
  if(SUBS[tab])return back+subTabsRaw(tab);
  if(tab==='home'&&!G.unemp)return back+`<nav class="subtabs" aria-label="바로 가기"><button class="on" data-a="tab" data-v="home">개요</button><button data-a="tab" data-v="inbox">소식함</button><button data-a="calOpen">캘린더</button><button data-a="go" data-v="league:stand">순위</button><button data-a="go" data-v="league:score">일정·결과</button><button data-a="go" data-v="club:fin">재정</button><button data-a="go" data-v="club:owner">구단주·목표</button></nav>`; /* FM 포털처럼 홈에서 자주 가는 곳 */
  return back+`<span class="fm-ttl">${esc(TITLE[tab]||'')}</span>`; }
function fmShell(t,per,unread,b){ const ic=i=>ICO[i]||ICO2[i]; const H=UI.navH||[];
  const menu=FM_MENU.map(k=>{ const it=NAV.find(x=>x[0]===k); if(!it)return ''; const subs=SUBS[k]; const al=tabAlert(k);
    return `<div class="fmm${UI.tab===k?' on':''}"><button class="fmm-b" data-a="tab" data-v="${k}">${esc(it[1])}${al?'<i class="sdot"></i>':''}${subs?'<i class="fmm-c">▾</i>':''}</button>${subs?`<div class="fmdd" role="menu">${subs.map(([s,l])=>`<button data-a="go" data-v="${k}:${s}">${esc(l)}${subAlert(k,s)?'<i class="sdot"></i>':''}</button>`).join('')}</div>`:''}</div>`; }).join('');
  const ico=(a,v,i,l,on,n)=>`<button class="fm-i${on?' on':''}" data-a="${a}"${v?` data-v="${v}"`:''} aria-label="${l}" title="${l}">${ic(i)}${n?`<i>${n>99?'99+':n}</i>`:''}</button>`;
  const d=dobj(G.day);
  return `<div class="shell fmsh">
  <header class="fmtop"><div class="fm1">
    <div class="fm-nav"><button class="fm-a" data-a="fmBack" ${UI.navI>0?'':'disabled'} aria-label="뒤로">‹</button><button class="fm-a" data-a="fmFwd" ${UI.navI!=null&&UI.navI<H.length-1?'':'disabled'} aria-label="앞으로">›</button></div>
    <button class="fm-club" ${G.unemp?'':'data-a="myRos" title="우리 팀 현황"'}>${G.unemp?'<span class="tdi">야</span>':badge(G.user,36)}</button>
    <nav class="fm-menu" aria-label="메뉴">${menu}</nav>
    <div class="fm-r">${G.unemp?'':ico('calOpen','','cal','캘린더 · 마감과 일정')}${ico('tab','inbox','mail','소식함'+(unread?` 안 읽음 ${unread}`:''),UI.tab==='inbox',unread)}${ico('tab','me','users','단장 프로필',UI.tab==='me')}${ico('go','cfg:set','cog','설정 · 권한',UI.tab==='cfg')}
      <div class="fm-date"><b>${WD[d.w]} ${d.m}월 ${d.d}일</b><span>${d.y} · ${esc(G.unemp?`야인 · 명성 ${G.rep}`:PERIOD[per])}</span></div>${goSet(per,b)}</div>
  </div><div class="fm2"><div class="fm-sub">${fmSubRow()}</div><div class="fm-meta">${metaChips()}<button class="helpbtn${helpOn()?' on':''}" data-a="help" aria-label="설명 ${helpOn()?'숨기기':'보기'}" title="설명 ${helpOn()?'숨기기':'보기'}">?</button></div></div></header>
  ${topBlocks(b)}
  <div class="gut"><div class="wrap fmwrap"><main class="content">${tabBody()}</main>${UI.stamp?stampView():''}${patchPop()}</div></div>
  </div>`; }
