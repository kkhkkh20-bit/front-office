/* ---------- PC 화면(FM식): 위 두 줄 메뉴 + 넓은 카드 화면 ----------
   1줄: 뒤로·앞으로, 구단 배지, 큰 메뉴(내려 펼치면 하위 화면), 캘린더·소식함·단장·설정, 날짜, 계속
   2줄: 지금 메뉴의 하위 탭(왼쪽)과 성적·예산 칩(오른쪽). 휴대폰·좁은 화면은 예전 배치 그대로 */
const fmOn=()=>typeof matchMedia!=='undefined'&&matchMedia('(min-width:1100px)').matches;
/* 왼쪽 바로 가기 줄(FM 측면 사이드바): 자주 가는 화면을 묶음별로 */
const SV=(d)=>`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICO3={list:SV('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),med:SV('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>'),
 star:SV('<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>'),coin:SV('<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>'),
 chart:SV('<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16v-8"/>'),flag:SV('<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/>'),user:SV('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
 target:SV('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),globe:SV('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
 file:SV('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),act:SV('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
 net:SV('<circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M8.5 7.5 10.5 16M15.5 7.5 13.5 16M9 6h6"/>'),clock:SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
 grid:SV('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>'),news:SV('<path d="M4 4h13v16H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3"/>')};
const FM_SIDE=[[['tab:home','홈','home'],['tab:inbox','소식함','mail'],['tab:roster','선수단','users'],['x:plan','선수단 계획표','grid'],['go:staff:train','훈련·육성','act'],['go:staff:coach','스태프','clip'],['go:league:score','주요 일정','clock'],['cal','달력','cal']],
  [['go:staff:mgr','감독','user'],['go:club:rel','관계도','net'],['go:staff:med','의료','med']],
  [['go:trade:market','선수 찾기','search'],['go:trade:block','트레이드','swap'],['go:transfer:fa','FA 시장','brief'],['go:transfer:foreign','외국인','globe'],['go:transfer:draft','드래프트','target'],['go:transfer:contract','계약','file'],['go:club:fin','재정','coin']],
  [['go:league:stand','리그','trophy'],['go:league:stat','데이터 허브','chart'],['go:club:owner','구단 비전','flag'],['go:club:fans','팬·언론','news'],['tab:me','내 프로필','star']]];
const fmPlanOn=()=>UI.tab==='roster'&&UI.it&&UI.it.roster==='depth'&&UI.it.rdepth==='glance';
function fmSideOn(k){ const [a,t,s]=k.split(':'); if(a==='x')return fmPlanOn(); if(a==='tab')return UI.tab===t&&!(t==='roster'&&fmPlanOn()); if(a==='go')return UI.tab===t&&SUBS[t]&&curSub(t)===s; return false; }
function fmSide(unread){ const ic=i=>ICO[i]||ICO2[i]||ICO3[i]||'';
  return `<aside class="fmside" aria-label="바로 가기">${FM_SIDE.map(g=>`<div class="fms-g">${g.map(([k,l,i])=>{ const [a,t,s]=k.split(':'); const da=a==='x'?'data-a="fmPlan"':a==='cal'?'data-a="calOpen"':a==='tab'?`data-a="tab" data-v="${t}"`:`data-a="go" data-v="${t}:${s}"`; if(G.unemp&&(a==='x'||!['home','inbox','league','me'].includes(t)))return '';
    return `<button ${da} class="${fmSideOn(k)?'on':''}">${ic(i)}<span>${esc(l)}</span>${t==='inbox'&&unread?`<i class="cnt">${unread>99?'99+':unread}</i>`:''}</button>`; }).join('')}</div>`).join('')}</aside>`; }
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
  <div class="fmbody">${fmSide(unread)}<div class="fmmain">${topBlocks(b)}
  <div class="gut"><div class="wrap fmwrap"><main class="content">${tabBody()}</main>${UI.stamp?stampView():''}${patchPop()}</div></div></div></div>
  </div>`; }
