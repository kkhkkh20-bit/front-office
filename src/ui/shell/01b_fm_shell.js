/* PC: 왼쪽은 업무 이동, 위는 현재 위치·하위 탭·날짜·진행. */
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
/* FM처럼 자주 가는 화면을 왼쪽에 바로 둔다(2026-11-04 사용자 결정: 15개 안팎). 'go:탭:하위'는 그 하위 화면으로 바로 간다. */
const FM_SIDE=[[['tab:home','홈','home'],['tab:inbox','소식함','mail'],['tab:roster','선수단','users']],
  [['tab:trade','트레이드','swap'],['tab:transfer','영입·계약','brief'],['go:staff:scouts','스카우트','target']],
  [['go:staff:coach','스태프','clip',1],['go:staff:train','훈련·육성','act'],['go:staff:med','의료','med'],['go:staff:data','데이터 분석','chart']],
  [['tab:cal','일정','clock'],['tab:league','리그','trophy']],
  [['go:club:owner','구단주·목표','flag'],['go:club:fin','재정','coin'],['go:club:fans','구단 정보','club'],['go:club:inv','시설','grid']]];
const fmPlanOn=()=>UI.tab==='roster'&&UI.it&&UI.it.roster==='depth'&&UI.it.rdepth==='glance';
function fmSideOn(k){ const [a,t,s]=k.split(':'); if(a==='x')return fmPlanOn(); if(a==='tab')return UI.tab===t;
  if(a==='go'){ if(UI.tab!==t||!SUBS[t])return false; const cur=curSub(t); if(cur===s)return true; const items=FM_SIDE.flat().filter(([x])=>x.startsWith('go:'+t+':')),mine=items.map(([x])=>x.split(':')[2]),home=(items.find(x=>x[3])||items[0])[0].split(':')[2]; return !mine.includes(cur)&&home===s; } /* 네 번째 값 1 = 그 탭의 대표 항목 */ /* 왼쪽에 없는 하위 화면(감독·스태프 시장 등)은 그 탭의 첫 항목에 불을 켠다 */
  return false; }
function fmSide(unread){ const ic=i=>ICO[i]||ICO2[i]||ICO3[i]||'';
  const groups=FM_SIDE.map(g=>{
    const items=g.filter(([k])=>!G.unemp||['home','inbox','league','cal'].includes(k.split(':')[1]));
    if(!items.length)return '';
    return `<div class="fms-g">${items.map(([k,l,i])=>{const t=k.split(':')[1],on=fmSideOn(k);
      const [a,,s]=k.split(':');
      return `<button data-a="${a==='go'?'go':'tab'}" data-v="${a==='go'?t+':'+s:t}" class="${on?'on':''}"${on?' aria-current="page"':''}>${ic(i)}<span>${esc(l)}</span>${t==='inbox'&&unread?`<i class="cnt">${unread>99?'99+':unread}</i>`:(a==='go'?subAlert(t,s):tabAlert(t))?'<i class="sdot"></i>':''}</button>`;
    }).join('')}</div>`;
  }).join('');
  return `<aside class="fmside" aria-label="주 메뉴">${groups}</aside>`;
}
/* 뒤로·앞으로: 메뉴와 하위 탭 이동을 기억한다(최근 40개) */
function fmKey(){ const t=UI.tab; return SUBS[t]?t+':'+curSub(t):t; }
function fmNavRec(){ const H=UI.navH=UI.navH||[]; if(UI.navI==null)UI.navI=-1; const k=fmKey(); if(UI._navSkip){ UI._navSkip=false; return; } if(H[UI.navI]===k)return; H.length=UI.navI+1; H.push(k); if(H.length>40)H.shift(); UI.navI=H.length-1; }
function fmGoKey(k){ const [t,s]=k.split(':'); UI.tab=t; if(s){ if(t==='league')UI.lseg=s; else { UI.sub=UI.sub||{}; UI.sub[t]=s; } } UI._navSkip=true; closeSheets(); render(); try{ scrollTo(0,0); }catch(e){} }
function fmBack(){ if(UI.meet){A.meetClose();return;}if(document.documentElement.classList.contains('detail-page-open')){ A.detailBack(); return; } const H=UI.navH||[]; if(!(UI.navI>0))return; UI.navI--; fmGoKey(H[UI.navI]); }
function fmFwd(){ const H=UI.navH||[]; if(UI.navI==null||UI.navI>=H.length-1)return; UI.navI++; fmGoKey(H[UI.navI]); }
/* 카드가 세로로 길게 쌓이는 화면은 PC에서 두 칸으로(FM 대시보드처럼). 표가 넓은 화면에는 쓰지 않는다 */
function fmCols(h){ return fmOn()?`<div class="fmcols">${h}</div>`:h; }
function fmSubRow(){ if(UI.meet)return `<button class="fm-ib" data-a="meetClose">‹ 이전 화면으로</button><span class="fm-ttl">${esc(meetWho(UI.meet)?.place||'면담')} · 대화</span>`;if(UI.cast)return '<span class="fm-ttl">경기 중계</span>'; /* 중계 중에는 홈 하위 탭(눌러도 중계가 그대로)을 숨긴다 */ const tab=UI.tab; const back=UI.fromMail&&tab!=='inbox'?'<button class="fm-ib" data-a="ibReturn">◀ 소식함으로</button>':'';
  if(SUBS[tab])return back+subTabsRaw(tab);
  if(tab==='home'&&!G.unemp)return back+`<nav class="subtabs" aria-label="홈 화면">${[['overview','구단 현황'],['work','업무·보고'],['team','선수단']].map(([k,l])=>`<button class="${(UI.homePanel||'overview')===k?'on':''}" data-a="homePanel" data-v="${k}">${l}</button>`).join('')}</nav>`;
  return back+`<span class="fm-ttl">${esc(TITLE[tab]||'')}</span>`; }
function fmShell(t,per,unread,b){ const ic=i=>ICO[i]||ICO2[i]; const H=UI.navH||[];
  const location=UI.cast?'경기 중계':TITLE[UI.tab]||NAV.find(x=>x[0]===UI.tab)?.[1]||'단장실';
  const ico=(a,v,i,l,on,n)=>`<button class="fm-i${on?' on':''}" data-a="${a}"${v?` data-v="${v}"`:''} aria-label="${l}" title="${l}">${ic(i)}${n?`<i>${n>99?'99+':n}</i>`:''}</button>`;
  const d=dobj(G.day);
  return `<div class="shell fmsh${UI.tab==='home'&&!UI.meet&&!G.unemp&&!G.gameOver&&!G.demoEnd&&!G.live?' fm-home':''}">
  <header class="fmtop"><div class="fm1">
    <div class="fm-nav"><button class="fm-a" data-a="fmBack" ${UI.meet||UI.navI>0?'':'disabled'} aria-label="뒤로">‹</button><button class="fm-a" data-a="fmFwd" ${UI.navI!=null&&UI.navI<H.length-1?'':'disabled'} aria-label="앞으로">›</button></div>
    <button class="fm-club" ${G.unemp?'':'data-a="myRos" title="우리 팀 현황"'}>${G.unemp?'<span class="tdi">야</span>':badge(G.user,36)}</button>
    <div class="fm-context" data-club="${esc(G.unemp?'자유 계약 단장':tshort(G.user))}" data-loc="${esc(location)}"><small>${esc(G.unemp?'자유 계약 단장':tshort(G.user))}</small><strong>${esc(location)}</strong></div>
    <div class="fm-r">${G.unemp?'':ico('calOpen','','cal','캘린더 · 마감과 일정')}${ico('tab','inbox','mail','소식함'+(unread?` 안 읽음 ${unread}`:''),UI.tab==='inbox',unread)}${ico('tab','me','users','단장 프로필',UI.tab==='me')}${ico('go','cfg:set','cog','설정 · 권한 (Shift+P)',UI.tab==='cfg')}<button class="fm-i fm-k" data-a="fmKeysOpen" aria-label="단축키 (F1)" title="단축키 (F1)">F1</button>
      <div class="fm-date"><b>${WD[d.w]} ${d.m}월 ${d.d}일</b><span>${d.y} · ${esc(G.unemp?`야인 · 명성 ${G.rep}`:PERIOD[per])}</span></div>${goSet(per,b)}</div>
  </div><div class="fm2"><div class="fm-sub">${fmSubRow()}</div><div class="fm-meta">${metaChips()}<button class="helpbtn${helpOn()?' on':''}" data-a="help" aria-label="설명 ${helpOn()?'숨기기':'보기'}" title="설명 ${helpOn()?'숨기기':'보기'}">?</button></div></div></header>
  <div class="fmbody">${fmSide(unread)}<div class="fmmain">${UI.meet?'':topBlocks(b)}
  <div class="gut"><div class="wrap fmwrap"><main class="content">${tabBody()}</main>${UI.stamp?stampView():''}${patchPop()}</div></div></div></div>
  </div>`; }
/* ---------- PC 단축키(FM 기본 단축키를 우리 화면에 맞춤) ----------
   FM24 기본: F1 도움말 · F2 홈 · F3 선수단 · F4 받은 편지함 · F5 선수 검색 · F6 관심 명단 · F7 스카우트 · F8 스태프 · F9 이적 · F10 일정, Space 계속, Backspace·←/→ 뒤로/앞으로,
   Ctrl+S 저장 · Ctrl+T 전술 · Ctrl+R 훈련 · Ctrl+J 스태프 업무 · Ctrl+M 구단 정보 · Ctrl+L 팀 분위기, Shift+C 달력 · Shift+O 재정 · Shift+V 의료 · Shift+D 육성 · Shift+P 설정 · Shift+G 상태.
   브라우저가 막는 키(F11 전체 화면·F12 개발 도구·Ctrl+W/N/T/Q 등)는 쓰지 않는다 */
const FM_KEYS=[
  ['F1','단축키 목록','keys'],['F2','홈','tab:home'],['F3','선수단','tab:roster'],['F4','소식함','tab:inbox'],['Shift+F4','리그 소식','go:league:wire'],['F5','선수 찾기','go:trade:market'],['F6','트레이드 매물','go:trade:block'],
  ['F7','스카우트','go:staff:scouts'],['F8','스태프(코치진)','go:staff:coach'],['F9','이적 현황','go:transfer:moves'],['Ctrl+F9','FA 시장','go:transfer:fa'],['F10','일정·결과','go:league:score'],
  ['Space','계속(안 읽은 소식이 있으면 먼저 열기)',''],['Backspace · Alt+←','뒤로','back'],['Alt+→','앞으로','fwd'],['Esc','창 닫기',''],
  ['Ctrl+S','저장','save'],['Ctrl+T','전력 구성(라인업·배치)','x:depth'],['Ctrl+R','훈련·육성','go:staff:train'],['Ctrl+J','업무 권한(위임)','go:cfg:auth'],['Ctrl+M','구단 정보(구단주·목표)','go:club:owner'],['Ctrl+L','관계도','go:club:rel'],
  ['Shift+C','달력','cal'],['Shift+O','재정','go:club:fin'],['Shift+W','계약(연봉)','go:transfer:contract'],['Shift+V','의료(부상 관리)','go:staff:med'],['Shift+D','육성','go:staff:train'],['Shift+P','설정','go:cfg:set'],['Shift+G','단장 프로필','tab:me'],
  ['Ctrl+Shift+K','순위','go:league:stand'],['Ctrl+Shift+E','일정·결과','go:league:score'],['Ctrl+Shift+G','선수 기록','go:league:rec'],['Ctrl+Shift+D','구단 지표·통계','go:league:stat'],['Ctrl+Shift+B','구단 비전','go:club:owner']];
function fmKeyName(e){ const k=e.key==='ArrowLeft'?'←':e.key==='ArrowRight'?'→':e.key.length===1?e.key.toUpperCase():e.key; return (e.ctrlKey||e.metaKey?'Ctrl+':'')+(e.shiftKey?'Shift+':'')+(e.altKey?'Alt+':'')+k; }
function fmRun(act){ if(!act)return false; const [a,t,s]=act.split(':');
  if(a==='keys'){ UI.fmKeys=!UI.fmKeys; render(); return true; }
  if(a==='back'){ fmBack(); return true; } if(a==='fwd'){ fmFwd(); return true; }
  if(a==='save'){ try{ saveNow(); note('저장','지금까지 진행을 저장했습니다.'); }catch(e){} return true; }
  if(a==='cal'){ if(!G.unemp)A.calOpen(); return true; }
  if(a==='x'){ UI.tab='roster'; UI.rosterTeam=null; UI.it=UI.it||{}; UI.it.roster='depth'; closeSheets(); render(); return true; }
  if(G.unemp&&!['home','inbox','league','me'].includes(t))return true;
  if(a==='tab'){ closeSheets(); A.tab(t); return true; } if(a==='go'){ closeSheets(); A.go(t+':'+s); return true; } return false; }
function fmHotkey(e){ if(!G||UI.title||!fmOn())return false; if((G.fd&&!G.fd.done)||G.fdWait)return false; if(UI.cast||UI.cfm||UI.ngt||UI.negWin||UI.game!=null)return false;
  if(e.target&&e.target.matches&&e.target.matches('input,select,textarea,[contenteditable]'))return false;
  const nm=fmKeyName(e); let act=null;
  if(nm==='Backspace'||nm==='Alt+←')act='back'; else if(nm==='Alt+→')act='fwd'; else { const r=FM_KEYS.find(x=>x[0]===nm); act=r&&r[2]; }
  if(!act)return false; e.preventDefault(); if(e.repeat)return true; return fmRun(act); }
function fmKeysSheet(){ if(!UI.fmKeys)return ''; return `<div class="scrim" data-a="fmKeysX"><div class="sheet gut fmkeys" data-stop="1" role="dialog" aria-label="단축키"><div class="sheet-head"><h2 class="sec">단축키(FM 기본 배치)</h2><button class="x" data-a="fmKeysX" aria-label="닫기">×</button></div>
  <p class="small muted">Football Manager의 기본 단축키를 이 게임 화면에 맞췄습니다. 글자를 입력하는 칸에서는 동작하지 않고, 브라우저가 쓰는 키(F11 전체 화면·F12·Ctrl+W 등)는 그대로 둡니다.</p>
  <div class="fmk-l">${FM_KEYS.map(([k,l])=>`<div class="fmk"><kbd>${esc(k)}</kbd><span>${esc(l)}</span></div>`).join('')}</div></div></div>`; }
/* 마우스 뒤로·앞으로 버튼(FM처럼 화면 기록 이동) */
if(typeof document!=='undefined')document.addEventListener('mouseup',e=>{ try{ if(!G||UI.title||!fmOn())return; if(e.button===3){ e.preventDefault(); fmBack(); } else if(e.button===4){ e.preventDefault(); fmFwd(); } }catch(x){} });

/* FM처럼 선수 정보를 열면 상단 제목이 '등번호. 이름', 작은 줄이 '포지션 - 소속'이 된다(상세는 renderSheet만 다시 그리므로 여기서 맞춘다) */
function fmTitleSync(){ const ctx=typeof document!=='undefined'&&document.querySelector('#app .fm-context'); if(!ctx)return; const st=ctx.querySelector('strong'),sm=ctx.querySelector('small'),p=UI.sheet!=null&&!UI.cast?G.players[UI.sheet]:null;
  if(p){ st.textContent=(p.team!=null?jno(p)+'. ':'')+p.name; sm.textContent=posLabel(p)+' - '+(p.team!=null?tshort(p.team):p.prospect?'드래프트 대상':'소속 없음'); }
  else { st.textContent=ctx.dataset.loc||''; sm.textContent=ctx.dataset.club||''; }
  /* 상단 하위 탭 줄도 선수 탭(능력·육성·요약…)으로 바꾼다. 원래 줄은 보관했다가 닫으면 되돌린다 */
  const sub=document.querySelector('#app .fm-sub'),tabs=p&&fmOn()?document.querySelector('#sheet .pf-topnav .ptabs'):null; if(!sub)return;
  if(sub.dataset.orig==null)sub.dataset.orig=sub.innerHTML;
  if(tabs){ sub.innerHTML=`<nav class="subtabs pf-subtabs" aria-label="선수 화면">${[...tabs.querySelectorAll('button')].map(b=>`<button data-a="ptab" data-v="${b.dataset.v}" class="${b.classList.contains('on')?'on':''}">${esc(b.textContent)}</button>`).join('')}</nav>`; document.documentElement.classList.add('fm-ptabs'); }
  else { if(sub.querySelector('.pf-subtabs'))sub.innerHTML=sub.dataset.orig; document.documentElement.classList.remove('fm-ptabs'); } }
