/* ---------- 휴대폰 표: 가로 스크롤 대신 버튼으로 열 묶음을 넘긴다 ----------
   세로는 표·목록 패널 안에서 스크롤하고, 첫 열(이름)은 늘 보인다.
   열 폭을 재서 화면에 들어가는 만큼씩 묶고 '◀ 1/3 ▶'로 넘긴다. 넓은 화면도 표가 넘칠 때만 같은 방식 */
const TWP_W=600;
/* 휴대폰(한 칸): 여러 카드를 한 칸에 세로로 이어 붙인다. 칸마다 묶음 버튼 줄이 생기지 않게(UI 3단계 3-9). PC는 칸 그대로 */
function wsStack(h){ return typeof innerWidth!=='undefined'&&innerWidth<700?`<div class="ws-stack">${h}</div>`:h; }
/* 긴 화면 바로 가기(UI 3단계 3-9): 휴대폰에서 칸 맨 위에 붙어 있는 한 줄. 누르면 그 구역으로 내려간다. PC에서는 숨긴다(CSS) */
function jumpBar(L){ L=L.filter(Boolean); return L.length>1?`<nav class="jump-bar" aria-label="바로 가기">${L.map(([id,l])=>`<button type="button" data-a="jumpTo" data-v="${id}">${l}</button>`).join('')}</nav>`:''; }
function workspaceCompact(){return matchMedia('(max-width:699px), (max-height:599px), (max-width:1099px) and (pointer:coarse)').matches;}
function twPager(){ if(typeof document==='undefined')return; const narrow=innerWidth<=TWP_W; UI.twPg=UI.twPg||{};
  document.querySelectorAll('.tw,.fdt-w').forEach((tw,ix)=>{ if(tw.closest('.cs-bg,.pf-season-table'))return; /* 선수 상황판 시즌 통계는 열을 넘기지 않고 옆으로 스크롤 */ const tb=tw.querySelector(':scope > table'); if(!tb||!tb.tHead)return;
    tw.querySelectorAll(':scope > .twpg').forEach(x=>x.remove()); tw.closest('.roster-list')?.querySelectorAll('.roster-tools>.twpg').forEach(x=>x.remove()); if(tw.previousElementSibling&&tw.previousElementSibling.classList.contains('twpg'))tw.previousElementSibling.remove(); tb.querySelectorAll('.twh').forEach(c=>c.classList.remove('twh')); tb.querySelectorAll('[data-cs0]').forEach(c=>{ c.colSpan=+c.dataset.cs0; c.classList.remove('twspan'); delete c.dataset.cs0; }); tw.classList.remove('twp');
    if(!narrow&&tw.closest('.roster-list,.candidate-list,.fdl-main'))return;
    if(tb.scrollWidth<=tw.clientWidth+4)return; void narrow; /* 넓은 화면도 표가 넘치면 같은 방식으로 넘긴다 */
    const hr=tb.tHead.rows[tb.tHead.rows.length-1]; const H=[...hr.cells]; const n=H.length; if(n<3||H.some(c=>c.colSpan>1))return;
    tw.classList.add('twp'); /* 줄인 이름 칸 기준으로 폭을 잰다 */
    const rows=[...tb.rows].filter(r=>r.cells.length===n); /* 그룹 제목처럼 칸이 합쳐진 줄은 그대로 둔다 */
    const w=H.map(c=>c.getBoundingClientRect().width); const pin=H[n-1].textContent.trim()==='행동'?n-1:-1; /* 지명 같은 행동 버튼 열은 어느 쪽을 넘겨도 보이게 */ let avail=tw.clientWidth-w[0]-2-(pin>0?w[pin]:0), pages, key, pg;
    /* 열을 숨기면 남은 열이 넓어져 표가 칸보다 넓어질 수 있다(옆으로 밀림). 넘친 만큼 묶음을 다시 나눈다 */
    for(let k=0;k<=n;k++){ pages=[]; let cur=[],sum=0;
    for(let i=1;i<n;i++){ if(i===pin)continue; if(cur.length&&sum+w[i]>avail){ pages.push(cur); cur=[]; sum=0; } cur.push(i); sum+=w[i]; } if(cur.length)pages.push(cur);
    if(pages.length<2){ tw.classList.remove('twp'); return; }
    key=(UI.sheet!=null&&tw.closest('#sheet')?'s':UI.tab)+':'+ix+':'+n; pg=Math.min(UI.twPg[key]||0,pages.length-1);
    const show=new Set([0,...pages[pg],...(pin>0?[pin]:[])]);
    tb.querySelectorAll('.twh').forEach(c=>c.classList.remove('twh')); tb.querySelectorAll('[data-cs0]').forEach(c=>{ c.colSpan=+c.dataset.cs0; c.classList.remove('twspan'); delete c.dataset.cs0; });
    for(const r of rows)[...r.cells].forEach((c,i)=>{ if(!show.has(i))c.classList.add('twh'); });
    /* '빈자리'처럼 이름 칸 뒤를 한 칸으로 합친 줄: 지금 보이는 열 수만큼만 차지하고 줄바꿈한다(표 밖으로 삐져나가지 않게) */
    for(const r of tb.rows){ const c=r.cells; if(c.length===2&&c[0].colSpan===1&&c[1].colSpan===n-1){ c[1].dataset.cs0=c[1].colSpan; c[1].colSpan=pages[pg].length+(pin>0?1:0); c[1].classList.add('twspan'); } }
    const over=tb.getBoundingClientRect().width-tw.clientWidth; if(over<=2||pages[pg].length<2)break;
    /* 열을 숨긴 뒤 행동 버튼·고정 이름 열이 넓어진 실제 폭으로 다시 묶는다. 세 번의 추측만으로는 휴대폰에서 마지막 버튼이 잘렸다. */
    for(const i of show)w[i]=Math.max(w[i],H[i].getBoundingClientRect().width);
    avail=Math.min(avail-over,tw.clientWidth-w[0]-2-(pin>0?w[pin]:0)); }
    tw.classList.add('twp');
    const hn0=c=>{ const e=c.querySelector('button')||c; const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim(); return (t||e.innerText.split('\n')[0]).replace(/[▲▼]/g,'').trim(); };
    const lab=i=>{ const a=hn0(H[pages[i][0]]), b=hn0(H[pages[i][pages[i].length-1]]); return a===b||!b?a:`${a} ~ ${b}`; };
    const bar=document.createElement('div'); bar.className='twpg';
    bar.innerHTML=`<button type="button" ${pg>0?'':'disabled'} aria-label="앞 열">◀</button><span><b>${pg+1}/${pages.length}</b> ${esc(lab(pg))}</span><button type="button" ${pg<pages.length-1?'':'disabled'} aria-label="다음 열">▶</button>`;
    const [bp,bn]=bar.querySelectorAll('button'); tw._twpg=bar; const go=d=>{ const had=bar.contains(document.activeElement); UI.twPg[key]=pg+d; twPager(); if(had)twPagerFocus(tw,d); }; /* 버튼을 다시 만들어도 키보드 초점은 같은 쪽 버튼에(검수 11-17 #7) */
    bp.onclick=()=>go(-1); bn.onclick=()=>go(1); const rtools=matchMedia('(max-width:699px) and (min-height:600px)').matches?tw.closest('.roster-list')?.querySelector('.roster-tools'):null; /* 30_mobile_workspace.css의 세로 휴대폰 조건과 같게 */ if(tw.matches('.fdl-main .fdt-w')&&fdCompact())tw.before(bar); else if(rtools)rtools.append(bar); /* 선수 명단: 필터 줄 옆 */ else tw.insertBefore(bar,tb); /* 휴대폰 드래프트: 표 스크롤 밖에 두어 늘 보이게 */ tw._twGo=d=>{ if(pg+d>=0&&pg+d<pages.length)go(d); }; });
  document.documentElement.style.setProperty('--toph',(document.querySelector('.top')?.offsetHeight||56)+'px'); try{ tabRowHints(); }catch(e){} }
function twPagerFocus(tw,d){ const bar=tw._twpg; if(!bar||!bar.isConnected)return; const B=[...bar.querySelectorAll('button')]; const t=B[d<0?0:1]; const f=t&&!t.disabled?t:B.find(b=>!b.disabled); if(f)try{ f.focus({preventScroll:true}); }catch(e){} }
if(typeof addEventListener!=='undefined'){ let t=0; addEventListener('resize',()=>{ clearTimeout(t); t=setTimeout(()=>{ try{ twPager(); }catch(e){} },150); }); }

/* 가로로 넘치는 탭·버튼 줄 전부(플레이 테스트 11-13: 휴대폰에서 넘침 표시가 없고, 연 탭이 화면 밖에 있어 '협상'을 눌러도 반응이 없는 것처럼 보였다):
   고른 탭을 보이는 자리로 옮기고, 옆에 더 있으면 가장자리를 흐린다 */
function tabRowHints(){ if(typeof document==='undefined')return; for(const row of document.querySelectorAll('.seg,.itabs,.ptabs,nav.subtabs,.tstrip,.ws-tab-row,.tabs,.chips')){ if(row.scrollWidth<=row.clientWidth+2)continue; const ox=getComputedStyle(row).overflowX; if(ox!=='auto'&&ox!=='scroll')continue; row.classList.add('hrow'); wsRowHint(row); } }
/* 한 줄 버튼 줄: 지금 고른 버튼을 보이는 자리로 옮기고, 옆에 더 있으면 가장자리를 흐리게 표시한다 */
function wsRowHint(row){ if(!row||!row.isConnected)return; const on=row.querySelector('button.on,button[aria-current="true"]');
  if(on&&row.scrollWidth>row.clientWidth+2){const r=row.getBoundingClientRect(),b=on.getBoundingClientRect();if(b.left<r.left||b.right>r.right)row.scrollLeft+=b.left-r.left-(r.width-b.width)/2;}
  const upd=()=>{row.classList.toggle('more-l',row.scrollLeft>2);row.classList.toggle('more-r',row.scrollLeft+row.clientWidth<row.scrollWidth-2);};
  upd(); if(!row._hint){row._hint=1;row.addEventListener('scroll',upd,{passive:true});} }

/* 전체 화면 대신 표·목록 내부를 스크롤하는 공통 작업 틀. */
function workspaceFit(host){
  const main=host||document.querySelector('#app main.content');
  if(!main||UI.title||(!host&&(UI.meet||['home','inbox'].includes(UI.tab)||main.classList.contains('dcontent')))||main.dataset.workspaceReady)return;
  if(!host&&(main.dataset.tab!==UI.tab||main.classList.contains('inbox-workspace')))return; /* 탭을 바꾼 직후(closeSheets→renderSheet)에는 아직 이전 탭 화면이다. 그 화면을 새 탭 기준으로 감싸면 소식함이 '보고·보고' 두 칸으로 나뉘고 목록 칸이 숨었다(제보 11-15) */
  main.dataset.workspaceReady='1';main.classList.add('ws-frame');
  const own=!!main.querySelector(':scope > .ws-own,:scope > .fmd'); /* 직접 높이를 나누는 화면은 패널 재포장을 생략한다(탭 줄 접기는 한다: 11-17 가로 휴대폰 568×320에서 리그 역사 트로피·영구결번·올스타 칸이 탭 세 줄에 밀려 26px만 남았다) */
  const root=own?main:main.querySelector(':scope > .roster-page,:scope > .trade-workspace')||main;
  if(root!==main)root.classList.add('ws-page');
  // 좁거나 낮은 화면에서는 여러 줄 탭을 한 줄 버튼 줄로 접는다. 넘치면 옆으로 밀고(선택 상자처럼 아래 창을 가리지 않음) 지금 화면 버튼을 가운데로.
  const filters=root.querySelector('.roster-filter-body'); // 열 묶음·열 설정도 접힌 필터 안으로(PC·휴대폰 같은 구조)
  if(filters)root.querySelectorAll('.roster-list>.rcp-bar,.roster-list>.rcp').forEach(el=>filters.append(el));
  if(workspaceCompact()){
    root.querySelectorAll(own?':scope > :is(.seg.itabs,nav.subtabs,.trade-modes)':'.seg.itabs,nav.subtabs,.trade-modes').forEach(tabs=>{ /* 직접 나누는 화면은 맨 위 탭 줄만 */
      if([...tabs.querySelectorAll('button[data-a]')].some(b=>['itab','go','sub','tab','lseg'].includes(b.dataset.a)))tabs.classList.add('ws-tab-row');
    });
    const rows=[...root.querySelectorAll(':scope > .ws-tab-row')];
    if(rows.length){const nav=document.createElement('nav');nav.className='ws-navigation';nav.setAttribute('aria-label','업무 화면 선택');rows[0].before(nav);rows.forEach(row=>nav.append(row));}
    root.querySelector(':scope > .roster-navigation')?.classList.add('ws-navigation');
  }
  if(own)return;
  const fixed='.fahero,.dlb,.vsb,.seg,.subtabs,.ws-tab-select,.ws-navigation,.roster-heading,.roster-navigation,.note,.hi-i,.fabtn,.pgr,.trade-modes,.trade-back,.trade-partner,.trade-steps,.trade-basket,.trade-extra,button[data-a=tradePick]';
  const panels=[];
  for(const node of [...root.children]){
    if(node.matches(fixed)||node.matches('p')||getComputedStyle(node).position==='fixed')continue;
    if(node.matches('.fmcols,.tlay')){panels.push(...node.children);node.replaceWith(...node.children);}
    else panels.push(node);
  }
  if(!panels.length){
    const body=document.createElement('div');body.className='ws-scroll';
    while(root.firstChild)body.append(root.firstChild);root.append(body);return;
  }
  const deck=document.createElement('div');deck.className='ws-panels';root.insertBefore(deck,panels[0]);
  const innerTabs=[...root.querySelectorAll('.itabs button.on')].map(b=>b.dataset.v).join('|');
  const key=(host?'detail:'+UI.sheet+':'+UI.ptab:fmKey())+':'+innerTabs;
  const positions=UI.workspaceScroll=UI.workspaceScroll||{};
  const scrollSelectors='.tw,.fdt-w,.tgrid,.cgrid,.cgr,.fl,.feed,.dealg,.sched,.stop-l,.tn-l,.slots,.bud-t,.cpwrap,.ltiles,.covm';
  const label=el=>{if(el.dataset&&el.dataset.wsl)return el.dataset.wsl; /* 칸이 직접 짧은 이름을 주면 그것으로(전력 구성 묶음 탭, 11-17) */const h=el.querySelector('h2,h3,.sec,.eyebrow,summary');if(!h)return '보고';const c=h.cloneNode(true);c.querySelectorAll('.hi-i,button,.tc-i').forEach(x=>x.remove());return c.textContent.replace(/\s+/g,' ').trim()||'보고';};
  panels.forEach((panel,index)=>{
    deck.append(panel);panel.classList.add('ws-panel');
    if(innerHeight<500){const heading=panel.querySelector(':scope > .row:first-child:has(h2,h3)'),pager=panel.querySelector(':scope > .pgr');if(heading&&pager){heading.append(pager);heading.classList.add('ws-panel-heading');pager.classList.add('ws-inline-pager');}}
    const children=[...panel.children],regions=children.filter(el=>el.matches(scrollSelectors));
    let scroller;
    if(regions.length===1){
      const region=regions[0],tail=children.slice(children.indexOf(region)+1);
      // Identity blocks, illustrations and explanatory text belong to the content, even before their images load.
      const leading=children.slice(0,children.indexOf(region)).filter(el=>!el.matches('h1,h2,h3,header,.row,.seg,.chips,.fbar,.roster-caption,.roster-filters,.roster-tools,.trade-search-main,.trade-pool-options,label:has(input,select),input,select'));
      if(matchMedia('(max-width:699px), (max-height:599px)').matches&&region.matches('.tw,.fdt-w'))tail.filter(el=>el.matches('p.small')).forEach(el=>region.append(el));
      const extra=tail.filter(el=>!el.matches('.pgr,.row,.btn,p.small'));
      if(extra.length||leading.length){
        scroller=document.createElement('div');panel.insertBefore(scroller,leading[0]||region);scroller.append(...leading,region);region.classList.add('ws-flow');
        tail.filter(el=>!el.matches('.pgr,.row,.btn')).forEach(el=>scroller.append(el));
      }else scroller=region;
    }
    else{
      scroller=document.createElement('div');
      const first=regions[0]||children.find(el=>!el.matches('h1,h2,h3,header,.row:first-child,.seg,.chips,.fbar,.roster-caption,.roster-filters,.roster-tools'));
      if(first){panel.insertBefore(scroller,first);let el=first;while(el){const next=el.nextSibling;scroller.append(el);el=next;}}
      else panel.append(scroller);
    }
    scroller.classList.add('ws-scroll');scroller.tabIndex=0;scroller.setAttribute('role','region');scroller.setAttribute('aria-label',label(panel)+' 내용');
    scroller.addEventListener('scroll',()=>{if(!panel.hidden&&!document.querySelector('#sheet .sheet'))positions[key+':'+index]=[scroller.scrollTop,scroller.scrollLeft];},{passive:true}); /* 상세 창이 떠 있는 동안 뒤 목록이 다시 그려지며 생긴 스크롤(0으로 줄어듦)은 기억하지 않는다: 뒤로 오면 보던 자리로(터치 점검 큰 태블릿 가로) */
    if(workspaceCompact()&&!panel.matches('.roster-list')){
      const before=[...panel.children].slice(0,[...panel.children].indexOf(scroller));
      const controls=before.filter(el=>!el.matches('h1,h2,h3,header,.row:first-child,.itabs,.ws-tab-row,nav,.staff-market-modes')&&el.matches('.chips,.seg,.row:has(input,select,button),label:has(input,select),input,select,.rcp,.trade-search-main,.trade-pool-options'));
      if(controls.length){const disclosure=document.createElement('details'),summary=document.createElement('summary'),options=document.createElement('div');disclosure.className='ws-filter-controls';disclosure.dataset.k='workspace-filter:'+key+':'+index;disclosure.open=!!UI.open[disclosure.dataset.k];summary.textContent='검색·필터 설정';options.className='ws-filter-options';controls[0].before(disclosure);controls.forEach(el=>options.append(el));disclosure.append(summary,options);}
    }
  });
  if(innerHeight<500){const panel=panels[0],scroll=panel?.querySelector(':scope > .ws-scroll'),notes=[...root.querySelectorAll(':scope > .note')];if(scroll&&notes.length){const body=document.createElement('div');body.className='ws-scroll';body.tabIndex=0;body.setAttribute('role','region');body.setAttribute('aria-label',label(panel)+' 내용');scroll.before(body);scroll.classList.remove('ws-scroll');scroll.classList.add('ws-flow');body.append(...notes,scroll);body.addEventListener('scroll',()=>{positions[key+':0']=[body.scrollTop,body.scrollLeft];},{passive:true});}}
  const columns=Math.min(panels.length,innerWidth>=1600?3:innerWidth>=700?2:1) /* 넓은 PC는 세 칸까지 한 화면에 */;
  /* 넓은 칸(data-wsw="2", 예: 선수 기록 탭 연도별 기록 표 — 국사왕 11-17): 칸 몇 개를 함께 쓴다. 쪽 나눔은 칸 너비를 더해 채운다 */
  const pageOf=[];{ let pg=0,used=0; panels.forEach((panel,i)=>{ const w=Math.max(1,Math.min(columns,+(panel.dataset&&panel.dataset.wsw)||1)); if(used&&used+w>columns){ pg++; used=0; } pageOf[i]=pg; used+=w; panel._wsPage=pg; panel._wsW=w; panel.style.gridColumn=w>1?`span ${w}`:''; }); }
  /* 넓은 칸이 쪽에 남는 칸이 있으면 그 칸까지 넓힌다(연도별 기록 표가 혼자 남은 쪽에서 가로 스크롤 없이 — 카페 11-18) */
  { const used={}; panels.forEach((panel,i)=>{ used[pageOf[i]]=(used[pageOf[i]]||0)+panel._wsW; }); panels.forEach((panel,i)=>{ const left=columns-used[pageOf[i]]; if(panel._wsW>1&&left>0){ panel.style.gridColumn=`span ${panel._wsW+left}`; used[pageOf[i]]=columns; } }); }
  const pages=(pageOf.length?pageOf[pageOf.length-1]:0)+1;
  deck.style.setProperty('--ws-columns',columns);
  UI.workspacePages=UI.workspacePages||{};
  let page=clamp(UI.workspacePages[key]||0,0,pages-1);
  // 패널을 넘길 때도 다시 측정한다. 처음 숨겨진 보고는 크기가 0이라 미리 판단할 수 없다.
  function fitPanel(panel,index){
    const scroll=panel.querySelector(':scope > .ws-scroll'),need=wsMobile()?panel.clientHeight*.75:Math.min(160,panel.clientHeight*.55);
    if(!scroll||scroll.clientHeight>=need||panel.clientHeight<60||panel.matches('.roster-list'))return; /* 휴대폰은 큰 필터·설명을 목록과 함께 읽어 실제 후보 공간을 확보한다. */
    const footer=[...panel.children].filter(el=>el.matches('.pgr')).reduce((n,el)=>n+el.offsetHeight,0);
    const headerRoom=panel.clientHeight-footer-16-Math.min(120,panel.clientHeight*.5);
    const keep=el=>el.matches('.pgr')||(el.matches('h1,h2,h3,header')||el===panel.firstElementChild&&el.querySelector('h2,h3,.sec'))&&el.offsetHeight<=headerRoom;
    const content=[...panel.children].filter(el=>el!==scroll&&!keep(el));if(!content.length)return;
    const body=document.createElement('div');body.className='ws-scroll';body.tabIndex=0;body.setAttribute('role','region');body.setAttribute('aria-label',label(panel)+' 내용');
    const ordered=[...panel.children].filter(el=>el===scroll||content.includes(el));ordered[0].before(body);
    scroll.classList.remove('ws-scroll');scroll.classList.add('ws-flow');ordered.forEach(el=>body.append(el));
    body.addEventListener('scroll',()=>{if(!document.querySelector('#sheet .sheet'))positions[key+':'+index]=[body.scrollTop,body.scrollLeft];},{passive:true});
  }
  panels.forEach((panel,index)=>panel._workspaceFit=()=>fitPanel(panel,index));
  const show=()=>{panels.forEach((panel,i)=>{panel.hidden=pageOf[i]!==page;if(panel.hidden)return;fitPanel(panel,i);const pos=positions[key+':'+i],scroll=panel.querySelector('.ws-scroll');if(pos){scroll.scrollTop=pos[0];scroll.scrollLeft=pos[1];}});UI.workspacePages[key]=page;};show();

  if(pages>1){
    /* 표·보고 묶음도 버튼 줄로: 묶음마다 제목 버튼 하나(한 번 눌러 바로 이동) */
    const bar=document.createElement('nav');bar.className='ws-pages ws-tab-row';bar.setAttribute('aria-label','표·보고 묶음');
    const buttons=[...Array(pages)].map((_,i)=>{const b=document.createElement('button');b.type='button';b.className='ws-page';b.dataset.wsPage=i;b.textContent=panels.filter((_,k)=>pageOf[k]===i).map(label).join(' · ');b.onclick=()=>{page=i;sync();try{ fitPages(); }catch(e){}};return b;}); /* 새로 보인 칸의 목록도 쪽으로 나눈다(UI 3단계 3-0) */
    const sync=()=>{show();buttons.forEach((b,i)=>{b.classList.toggle('on',i===page);b.setAttribute('aria-current',i===page?'true':'false');});wsRowHint(bar);};
    bar.append(...buttons);const navigation=root.querySelector(':scope > .ws-navigation');
    const rh=fmOn()&&!workspaceCompact()&&root.querySelector(':scope > .roster-heading>div:first-child'); /* PC 선수단: 묶음 버튼 줄은 본문 첫 줄 왼쪽 빈자리로(사용자 11-18) */
    if(navigation&&innerHeight<500&&innerWidth>=500)navigation.append(bar);else if(rh)rh.append(bar);else root.insertBefore(bar,deck);sync();
  }
  root.querySelectorAll('.ws-tab-row').forEach(wsRowHint);
  workspaceObserve();
}

/* 휴대폰 세로: 목록 칸(작업 공간의 ws-scroll·스스로 스크롤하는 ws-own, 소식함 목록·본문)을 내려 보면 위쪽 제목·탭 줄이 밀려 올라간다(아래 wsSet).
   접으면 칸이 커져 스크롤 범위가 줄어든다. 실제로 접어 본 뒤(같은 이벤트 안이라 깜박임 없음) 스크롤할 거리가 조금(6px 넘게)이라도 남을 때만 유지한다(남아야 맨 위로 올려 다시 펼 수 있다)(접기·펴기 반복, 펼 수 없는 상태 방지). render가 main을 새로 만들면 저절로 풀린다 */
/* 휴대폰: 목록을 내리면 위쪽 제목·탭이 손가락이 움직인 만큼 부드럽게 밀려 올라가고, 맨 위에서 아래로 끌면 다시 내려온다(사용자 11-07: 갑자기 사라지지 않게).
   목록 안 스크롤 양을 위쪽 머리가 밀려 올라가는 양으로 옮겨 쓴다(내용은 손가락만큼만 움직인다). 다 접히면 그때부터 목록이 스크롤된다 */
const wsMain=el=>el&&el.classList&&(el.matches('.ws-scroll,.ws-own')&&el.closest('#app main.ws-frame')||el.matches('.ibx-list,article.ibm')&&el.closest('#app main.inbox-workspace'));
const wsMobile=()=>matchMedia('(max-width:699px) and (min-height:600px)').matches;
function wsMax(main,el){ const w=main.parentElement; if(!w)return 0; const y=main._wsy||0, pan=el.closest('.ws-panel')||el; const top=w.getBoundingClientRect().top; return Math.max(0,Math.round(pan.getBoundingClientRect().top+y-top)); }
function wsSet(main,y){ main._wsy=y; main.style.marginTop=y?(-y)+'px':''; main.style.height=y?`calc(100% + ${y}px)`:''; /* 위로 밀린 만큼 아래도 늘려 바닥에 빈칸이 생기지 않게(사용자 11-08 소식함) */ main.classList.toggle('ws-slid',y>0); if(y===0||y>=(main._wsMx||1e9))main._wsHold=false; }
if(typeof addEventListener!=='undefined'){
  addEventListener('scroll',e=>{ const el=e.target, main=wsMain(el); if(!main||!wsMobile())return; const st=el.scrollTop, last=el._wsLast??st; el._wsLast=st; let y=main._wsy||0;
    if(!y)main._wsMx=wsMax(main,el); const mx=main._wsMx||0;
    const dlt=st-last; if(dlt>0&&st>0&&y<mx){ const d=Math.min(mx-y,dlt); y+=d; wsSet(main,y); el.scrollTop=Math.max(0,st-d); el._wsLast=el.scrollTop; } /* 이번에 움직인 만큼만(누적 위치가 아니라 변화량): 휴대폰이 스크롤 위치 되돌리기를 무시해도 손가락 속도와 같게(사용자 11-08: 너무 빨리 밀려 들어감) */
    else if(st<=0&&st<last&&y>0){ wsSet(main,0); } /* 목록 맨 위에 닿으면 위 줄을 모두 펼친다: 올라온 거리만큼만 내리면 짧은 목록·관성 스크롤에서 반쯤 접힌 채 남았다(검수 11-11) */ },{capture:true,passive:true});
  let tY=null, tEl=null;
  addEventListener('touchstart',e=>{ const el=e.target.closest&&e.target.closest('.ws-scroll,.ws-own,.ibx-list,article.ibm'); tEl=el&&wsMain(el)?el:null; tY=e.touches[0].clientY; },{passive:true});
  addEventListener('touchmove',e=>{ if(!tEl||tY==null||!wsMobile())return; const cy=e.touches[0].clientY, dy=cy-tY; tY=cy; const main=wsMain(tEl); if(!main)return; const y=main._wsy||0;
    if(dy>0&&tEl.scrollTop<=0&&y>0)wsSet(main,Math.max(0,y-dy)); },{passive:true}); }

// Refit after a filter opens or browser chrome changes height, without replacing the reading DOM.
let _workspaceObserver=null;
function workspaceRefit(){wsViewport();document.querySelectorAll('.ws-panel:not([hidden])').forEach(panel=>panel._workspaceFit?.());workspaceObserve();}
/* 휴대폰 작업 화면 높이는 실제로 보이는 높이(--app-h)와 실제 하단 탭 높이(--bnav-real)로 잡는다(30_mobile_workspace.css).
   안드로이드 3버튼 내비·주소창·삼성 인터넷 아래 도구 막대에서는 100vh·100dvh가 보이는 영역보다 커져 목록 끝과 페이지 넘김 버튼이
   하단 탭 밑에 깔려 끝까지 내려도 안 보였다(카페 11-16 낙하산·마스터쉐프). 글자 입력 중(키보드)·확대 중에는 바꾸지 않는다 */
function wsViewport(){ if(typeof document==='undefined')return; const r=document.documentElement,v=window.visualViewport,ae=document.activeElement;
  if(ae&&ae.matches&&ae.matches('input:not([type=button],[type=checkbox],[type=radio],[type=range]),textarea,select,[contenteditable=true]'))return;
  const zoomed=v&&Math.abs((v.scale||1)-1)>.01, h=Math.round(v&&!zoomed?Math.min(innerHeight,v.offsetTop+v.height):innerHeight), gap=Math.max(0,innerHeight-h);
  const set=(k,val)=>{ if(r.style.getPropertyValue(k)!==val)r.style.setProperty(k,val); };
  set('--app-h',h+'px'); set('--vv-gap',gap+'px');
  const nav=document.querySelector('#app .bnav'), bh=nav&&nav.offsetHeight; if(bh)set('--bnav-real',bh+'px'); }
if(typeof addEventListener!=='undefined'){ const sync=()=>requestAnimationFrame(wsViewport); addEventListener('resize',sync); addEventListener('orientationchange',sync); addEventListener('focusout',()=>setTimeout(sync,350)); window.visualViewport?.addEventListener('resize',sync); }
function workspaceObserve(){if(typeof ResizeObserver==='undefined')return;
 if(!_workspaceObserver)_workspaceObserver=new ResizeObserver(entries=>{requestAnimationFrame(()=>entries.forEach(({target})=>{if(!target.isConnected)return;const panel=target.parentElement;if(!panel.matches('.ws-panel')||panel.hidden)return;panel._workspaceFit?.();const next=panel.querySelector(':scope > .ws-scroll');if(next!==target){_workspaceObserver.unobserve(target);if(next)_workspaceObserver.observe(next);}}));});
 _workspaceObserver.disconnect();document.querySelectorAll('.ws-panel > .ws-scroll').forEach(scroll=>_workspaceObserver.observe(scroll));
}

function workspaceReveal(selector){
  const panel=document.querySelector(selector)?.closest('.ws-panel');
  if(panel&&panel.hidden){ const deck=panel.parentElement,bar=deck.parentElement.querySelector(':scope > .ws-pages,:scope > .ws-navigation > .ws-pages,:scope > .roster-heading .ws-pages');
    const columns=+deck.style.getPropertyValue('--ws-columns')||1;
    bar?.querySelector(`[data-ws-page="${panel._wsPage??Math.floor([...deck.children].indexOf(panel)/columns)}"]`)?.click(); }
  const fb=document.querySelector(selector)?.closest('.fbar-p[hidden]')?.closest('[data-fbar]'); if(fb)A.fbarTog(fb.dataset.fbar); /* 필터 바 칸 안의 조건이면 칸을 연다 */
  try{ fitPagesReveal(document.querySelector(selector)); }catch(e){} /* PC 목록 쪽 나눔의 다른 쪽에 있으면 그 쪽으로(UI 3단계 3-0) */
}

function workspaceDetail(){
  const sheet=document.querySelector('#sheet .psh'),nav=sheet?.querySelector(':scope > .pf-topnav');
  if(!nav||UI.ptab!=='rec'||sheet.classList.contains('ws-detail'))return;
  if(matchMedia('(max-width:699px) and (min-height:600px)').matches)return; /* 휴대폰 세로: 프로필·버튼 아래 고정 칸에 기록이 2~3줄만 보였다. 다른 탭처럼 창 전체를 스크롤한다 */
  sheet.classList.add('ws-detail');
  const body=document.createElement('div');body.className='ws-detail-body';
  let node=nav.nextSibling;while(node){const next=node.nextSibling;body.append(node);node=next;}
  sheet.append(body);workspaceFit(body);
}
