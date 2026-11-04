/* ---------- 휴대폰 표: 가로 스크롤 대신 버튼으로 열 묶음을 넘긴다 ----------
   세로는 표·목록 패널 안에서 스크롤하고, 첫 열(이름)은 늘 보인다.
   열 폭을 재서 화면에 들어가는 만큼씩 묶고 '◀ 1/3 ▶'로 넘긴다. 넓은 화면도 표가 넘칠 때만 같은 방식 */
const TWP_W=600;
function workspaceCompact(){return matchMedia('(max-width:699px), (max-height:599px), (max-width:1099px) and (pointer:coarse)').matches;}
function twPager(){ if(typeof document==='undefined')return; const narrow=innerWidth<=TWP_W; UI.twPg=UI.twPg||{};
  document.querySelectorAll('.tw,.fdt-w').forEach((tw,ix)=>{ if(tw.closest('.cs-bg,.pf-season-table'))return; /* 선수 상황판 시즌 통계는 열을 넘기지 않고 옆으로 스크롤 */ const tb=tw.querySelector(':scope > table'); if(!tb||!tb.tHead)return;
    tw.querySelectorAll(':scope > .twpg').forEach(x=>x.remove()); tw.closest('.roster-list')?.querySelectorAll('.roster-tools>.twpg').forEach(x=>x.remove()); if(tw.previousElementSibling&&tw.previousElementSibling.classList.contains('twpg'))tw.previousElementSibling.remove(); tb.querySelectorAll('.twh').forEach(c=>c.classList.remove('twh')); tb.querySelectorAll('[data-cs0]').forEach(c=>{ c.colSpan=+c.dataset.cs0; c.classList.remove('twspan'); delete c.dataset.cs0; }); tw.classList.remove('twp');
    if(!narrow&&tw.closest('.roster-list,.candidate-list,.fdl-main'))return;
    if(tb.scrollWidth<=tw.clientWidth+4)return; void narrow; /* 넓은 화면도 표가 넘치면 같은 방식으로 넘긴다 */
    const hr=tb.tHead.rows[tb.tHead.rows.length-1]; const H=[...hr.cells]; const n=H.length; if(n<3||H.some(c=>c.colSpan>1))return;
    tw.classList.add('twp'); /* 줄인 이름 칸 기준으로 폭을 잰다 */
    const rows=[...tb.rows].filter(r=>r.cells.length===n); /* 그룹 제목처럼 칸이 합쳐진 줄은 그대로 둔다 */
    const w=H.map(c=>c.getBoundingClientRect().width); const avail=tw.clientWidth-w[0]-2; const pages=[]; let cur=[],sum=0;
    for(let i=1;i<n;i++){ if(cur.length&&sum+w[i]>avail){ pages.push(cur); cur=[]; sum=0; } cur.push(i); sum+=w[i]; } if(cur.length)pages.push(cur);
    if(pages.length<2){ tw.classList.remove('twp'); return; }
    const key=(UI.sheet!=null&&tw.closest('#sheet')?'s':UI.tab)+':'+ix+':'+n; let pg=Math.min(UI.twPg[key]||0,pages.length-1);
    const show=new Set([0,...pages[pg]]);
    for(const r of rows)[...r.cells].forEach((c,i)=>{ if(!show.has(i))c.classList.add('twh'); });
    /* '빈자리'처럼 이름 칸 뒤를 한 칸으로 합친 줄: 지금 보이는 열 수만큼만 차지하고 줄바꿈한다(표 밖으로 삐져나가지 않게) */
    for(const r of tb.rows){ const c=r.cells; if(c.length===2&&c[0].colSpan===1&&c[1].colSpan===n-1){ c[1].dataset.cs0=c[1].colSpan; c[1].colSpan=pages[pg].length; c[1].classList.add('twspan'); } }
    tw.classList.add('twp');
    const hn0=c=>{ const e=c.querySelector('button')||c; const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim(); return (t||e.innerText.split('\n')[0]).replace(/[▲▼]/g,'').trim(); };
    const lab=i=>{ const a=hn0(H[pages[i][0]]), b=hn0(H[pages[i][pages[i].length-1]]); return a===b||!b?a:`${a} ~ ${b}`; };
    const bar=document.createElement('div'); bar.className='twpg';
    bar.innerHTML=`<button type="button" ${pg>0?'':'disabled'} aria-label="앞 열">◀</button><span><b>${pg+1}/${pages.length}</b> ${esc(lab(pg))}</span><button type="button" ${pg<pages.length-1?'':'disabled'} aria-label="다음 열">▶</button>`;
    const [bp,bn]=bar.querySelectorAll('button'); const go=d=>{ UI.twPg[key]=pg+d; twPager(); };
    bp.onclick=()=>go(-1); bn.onclick=()=>go(1); const rtools=matchMedia('(max-width:699px) and (min-height:600px)').matches?tw.closest('.roster-list')?.querySelector('.roster-tools'):null; /* 30_mobile_workspace.css의 세로 휴대폰 조건과 같게 */ if(tw.matches('.fdl-main .fdt-w')&&fdCompact())tw.before(bar); else if(rtools)rtools.append(bar); /* 선수 명단: 필터 줄 옆 */ else tw.insertBefore(bar,tb); /* 휴대폰 드래프트: 표 스크롤 밖에 두어 늘 보이게 */ tw._twGo=d=>{ if(pg+d>=0&&pg+d<pages.length)go(d); }; });
  document.documentElement.style.setProperty('--toph',(document.querySelector('.top')?.offsetHeight||56)+'px'); }
if(typeof addEventListener!=='undefined'){ let t=0; addEventListener('resize',()=>{ clearTimeout(t); t=setTimeout(()=>{ try{ twPager(); }catch(e){} },150); }); }

/* 한 줄 버튼 줄: 지금 고른 버튼을 보이는 자리로 옮기고, 옆에 더 있으면 가장자리를 흐리게 표시한다 */
function wsRowHint(row){ if(!row||!row.isConnected)return; const on=row.querySelector('button.on,button[aria-current="true"]');
  if(on&&row.scrollWidth>row.clientWidth+2){const r=row.getBoundingClientRect(),b=on.getBoundingClientRect();if(b.left<r.left||b.right>r.right)row.scrollLeft+=b.left-r.left-(r.width-b.width)/2;}
  const upd=()=>{row.classList.toggle('more-l',row.scrollLeft>2);row.classList.toggle('more-r',row.scrollLeft+row.clientWidth<row.scrollWidth-2);};
  upd(); if(!row._hint){row._hint=1;row.addEventListener('scroll',upd,{passive:true});} }

/* 전체 화면 대신 표·목록 내부를 스크롤하는 공통 작업 틀. */
function workspaceFit(host){
  const main=host||document.querySelector('#app main.content');
  if(!main||UI.title||(!host&&(UI.meet||['home','inbox'].includes(UI.tab)||main.classList.contains('dcontent')))||main.dataset.workspaceReady)return;
  main.dataset.workspaceReady='1';main.classList.add('ws-frame');
  if(main.querySelector(':scope > .ws-own,:scope > .fmd'))return; /* 화면이 스스로 칸을 나눠 높이를 채우는 경우(PC FM식 스태프·의료·일정·재정·구단주): 틀 높이만 주고 패널로 다시 묶지 않는다 */
  const root=main.querySelector(':scope > .roster-page,:scope > .trade-workspace')||main;
  if(root!==main)root.classList.add('ws-page');
  // 좁거나 낮은 화면에서는 여러 줄 탭을 한 줄 버튼 줄로 접는다. 넘치면 옆으로 밀고(선택 상자처럼 아래 창을 가리지 않음) 지금 화면 버튼을 가운데로.
  const filters=root.querySelector('.roster-filter-body'); // 열 묶음·열 설정도 접힌 필터 안으로(PC·휴대폰 같은 구조)
  if(filters)root.querySelectorAll('.roster-list>.rcp-bar,.roster-list>.rcp').forEach(el=>filters.append(el));
  if(workspaceCompact()){
    root.querySelectorAll('.seg.itabs,nav.subtabs,.trade-modes').forEach(tabs=>{
      if([...tabs.querySelectorAll('button[data-a]')].some(b=>['itab','go','sub','tab','lseg'].includes(b.dataset.a)))tabs.classList.add('ws-tab-row');
    });
    const rows=[...root.querySelectorAll(':scope > .ws-tab-row')];
    if(rows.length){const nav=document.createElement('nav');nav.className='ws-navigation';nav.setAttribute('aria-label','업무 화면 선택');rows[0].before(nav);rows.forEach(row=>nav.append(row));}
    root.querySelector(':scope > .roster-navigation')?.classList.add('ws-navigation');
  }
  const fixed='.seg,.subtabs,.ws-tab-select,.ws-navigation,.roster-heading,.roster-navigation,.note,.hi-i,.fabtn,.pgr,.trade-modes,.trade-back,.trade-partner,.trade-steps,.trade-basket,.trade-extra,button[data-a=tradePick]';
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
  const label=el=>{const h=el.querySelector('h2,h3,.sec,.eyebrow,summary');if(!h)return '보고';const c=h.cloneNode(true);c.querySelectorAll('.hi-i,button,.tc-i').forEach(x=>x.remove());return c.textContent.replace(/\s+/g,' ').trim()||'보고';};
  panels.forEach((panel,index)=>{
    deck.append(panel);panel.classList.add('ws-panel');
    if(innerHeight<500){const heading=panel.querySelector(':scope > .row:first-child:has(h2,h3)'),pager=panel.querySelector(':scope > .pgr');if(heading&&pager){heading.append(pager);heading.classList.add('ws-panel-heading');pager.classList.add('ws-inline-pager');}}
    const children=[...panel.children],regions=children.filter(el=>el.matches(scrollSelectors));
    let scroller;
    if(regions.length===1){
      const region=regions[0],tail=children.slice(children.indexOf(region)+1);
      // Identity blocks, illustrations and explanatory text belong to the content, even before their images load.
      const leading=children.slice(0,children.indexOf(region)).filter(el=>!el.matches('h1,h2,h3,header,.row,.seg,.chips,.roster-caption,.roster-filters,.roster-tools,.trade-search-main,.trade-pool-options,label:has(input,select),input,select'));
      if(matchMedia('(max-width:699px), (max-height:599px)').matches&&region.matches('.tw,.fdt-w'))tail.filter(el=>el.matches('p.small')).forEach(el=>region.append(el));
      const extra=tail.filter(el=>!el.matches('.pgr,.row,.btn,p.small'));
      if(extra.length||leading.length){
        scroller=document.createElement('div');panel.insertBefore(scroller,leading[0]||region);scroller.append(...leading,region);region.classList.add('ws-flow');
        tail.filter(el=>!el.matches('.pgr,.row,.btn')).forEach(el=>scroller.append(el));
      }else scroller=region;
    }
    else{
      scroller=document.createElement('div');
      const first=regions[0]||children.find(el=>!el.matches('h1,h2,h3,header,.row:first-child,.seg,.chips,.roster-caption,.roster-filters,.roster-tools'));
      if(first){panel.insertBefore(scroller,first);let el=first;while(el){const next=el.nextSibling;scroller.append(el);el=next;}}
      else panel.append(scroller);
    }
    scroller.classList.add('ws-scroll');scroller.tabIndex=0;scroller.setAttribute('role','region');scroller.setAttribute('aria-label',label(panel)+' 내용');
    scroller.addEventListener('scroll',()=>{if(!panel.hidden)positions[key+':'+index]=[scroller.scrollTop,scroller.scrollLeft];},{passive:true});
    if(workspaceCompact()&&!panel.matches('.roster-list')){
      const before=[...panel.children].slice(0,[...panel.children].indexOf(scroller));
      const controls=before.filter(el=>!el.matches('h1,h2,h3,header,.row:first-child')&&el.matches('.chips,.seg,.row:has(input,select,button),label:has(input,select),input,select,.rcp,.trade-search-main,.trade-pool-options'));
      if(controls.length){const disclosure=document.createElement('details'),summary=document.createElement('summary'),options=document.createElement('div');disclosure.className='ws-filter-controls';disclosure.dataset.k='workspace-filter:'+key+':'+index;disclosure.open=!!UI.open[disclosure.dataset.k];summary.textContent='검색·필터 설정';options.className='ws-filter-options';controls[0].before(disclosure);controls.forEach(el=>options.append(el));disclosure.append(summary,options);}
    }
  });
  if(innerHeight<500){const panel=panels[0],scroll=panel?.querySelector(':scope > .ws-scroll'),notes=[...root.querySelectorAll(':scope > .note')];if(scroll&&notes.length){const body=document.createElement('div');body.className='ws-scroll';body.tabIndex=0;body.setAttribute('role','region');body.setAttribute('aria-label',label(panel)+' 내용');scroll.before(body);scroll.classList.remove('ws-scroll');scroll.classList.add('ws-flow');body.append(...notes,scroll);body.addEventListener('scroll',()=>{positions[key+':0']=[body.scrollTop,body.scrollLeft];},{passive:true});}}
  const columns=Math.min(panels.length,innerWidth>=1600?3:innerWidth>=700?2:1) /* 넓은 PC는 세 칸까지 한 화면에 */,pages=Math.ceil(panels.length/columns);
  deck.style.setProperty('--ws-columns',columns);
  UI.workspacePages=UI.workspacePages||{};
  let page=clamp(UI.workspacePages[key]||0,0,pages-1);
  // 패널을 넘길 때도 다시 측정한다. 처음 숨겨진 보고는 크기가 0이라 미리 판단할 수 없다.
  function fitPanel(panel,index){
    const scroll=panel.querySelector(':scope > .ws-scroll');if(!scroll||scroll.clientHeight>=Math.min(160,panel.clientHeight*.55)||panel.clientHeight<60||panel.matches('.roster-list'))return;
    const footer=[...panel.children].filter(el=>el.matches('.pgr')).reduce((n,el)=>n+el.offsetHeight,0);
    const headerRoom=panel.clientHeight-footer-16-Math.min(120,panel.clientHeight*.5);
    const keep=el=>el.matches('.pgr')||(el.matches('h1,h2,h3,header')||el===panel.firstElementChild&&el.querySelector('h2,h3,.sec'))&&el.offsetHeight<=headerRoom;
    const content=[...panel.children].filter(el=>el!==scroll&&!keep(el));if(!content.length)return;
    const body=document.createElement('div');body.className='ws-scroll';body.tabIndex=0;body.setAttribute('role','region');body.setAttribute('aria-label',label(panel)+' 내용');
    const ordered=[...panel.children].filter(el=>el===scroll||content.includes(el));ordered[0].before(body);
    scroll.classList.remove('ws-scroll');scroll.classList.add('ws-flow');ordered.forEach(el=>body.append(el));
    body.addEventListener('scroll',()=>{positions[key+':'+index]=[body.scrollTop,body.scrollLeft];},{passive:true});
  }
  panels.forEach((panel,index)=>panel._workspaceFit=()=>fitPanel(panel,index));
  const show=()=>{panels.forEach((panel,i)=>{panel.hidden=Math.floor(i/columns)!==page;if(panel.hidden)return;fitPanel(panel,i);const pos=positions[key+':'+i],scroll=panel.querySelector('.ws-scroll');if(pos){scroll.scrollTop=pos[0];scroll.scrollLeft=pos[1];}});UI.workspacePages[key]=page;};show();

  if(pages>1){
    /* 표·보고 묶음도 버튼 줄로: 묶음마다 제목 버튼 하나(한 번 눌러 바로 이동) */
    const bar=document.createElement('nav');bar.className='ws-pages ws-tab-row';bar.setAttribute('aria-label','표·보고 묶음');
    const buttons=[...Array(pages)].map((_,i)=>{const b=document.createElement('button');b.type='button';b.className='ws-page';b.dataset.wsPage=i;b.textContent=panels.slice(i*columns,(i+1)*columns).map(label).join(' · ');b.onclick=()=>{page=i;sync();};return b;});
    const sync=()=>{show();buttons.forEach((b,i)=>{b.classList.toggle('on',i===page);b.setAttribute('aria-current',i===page?'true':'false');});wsRowHint(bar);};
    bar.append(...buttons);const navigation=root.querySelector(':scope > .ws-navigation');
    if(navigation&&innerHeight<500&&innerWidth>=500)navigation.append(bar);else root.insertBefore(bar,deck);sync();
  }
  root.querySelectorAll('.ws-tab-row').forEach(wsRowHint);
  workspaceObserve();
}

// Refit after a filter opens or browser chrome changes height, without replacing the reading DOM.
let _workspaceObserver=null;
function workspaceRefit(){document.querySelectorAll('.ws-panel:not([hidden])').forEach(panel=>panel._workspaceFit?.());workspaceObserve();}
function workspaceObserve(){if(typeof ResizeObserver==='undefined')return;
 if(!_workspaceObserver)_workspaceObserver=new ResizeObserver(entries=>{requestAnimationFrame(()=>entries.forEach(({target})=>{if(!target.isConnected)return;const panel=target.parentElement;if(!panel.matches('.ws-panel')||panel.hidden)return;panel._workspaceFit?.();const next=panel.querySelector(':scope > .ws-scroll');if(next!==target){_workspaceObserver.unobserve(target);if(next)_workspaceObserver.observe(next);}}));});
 _workspaceObserver.disconnect();document.querySelectorAll('.ws-panel > .ws-scroll').forEach(scroll=>_workspaceObserver.observe(scroll));
}

function workspaceReveal(selector){
  const panel=document.querySelector(selector)?.closest('.ws-panel');if(!panel||!panel.hidden)return;
  const deck=panel.parentElement,bar=deck.parentElement.querySelector(':scope > .ws-pages,:scope > .ws-navigation > .ws-pages');if(!bar)return;
  const columns=+deck.style.getPropertyValue('--ws-columns')||1;
  bar.querySelector(`[data-ws-page="${Math.floor([...deck.children].indexOf(panel)/columns)}"]`)?.click();
}

function workspaceDetail(){
  const sheet=document.querySelector('#sheet .psh'),nav=sheet?.querySelector(':scope > .pf-topnav');
  if(!nav||UI.ptab!=='rec'||sheet.classList.contains('ws-detail'))return;
  sheet.classList.add('ws-detail');
  const body=document.createElement('div');body.className='ws-detail-body';
  let node=nav.nextSibling;while(node){const next=node.nextSibling;body.append(node);node=next;}
  sheet.append(body);workspaceFit(body);
}
