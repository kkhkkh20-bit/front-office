/* 웹 배포 빌드를 터치 기기로 조작한다. 해상도 변경만 하는 검사와 구분한다. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,devices}=require('playwright'),{buildSite}=require('./build-site.cjs'),{startSiteServer}=require('./lib/site-server.cjs');
const output=process.env.REVIEW_OUT,results=[];
async function prepare(page){
 await page.waitForFunction(()=>typeof newGame==='function');
 return page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.fOkY=G.year;G.scoutAuto=true;
  for(const m of [...ibNeedList()]){A.openMail(m.id);const i=(m.acts||[]).findIndex(a=>a.a==='ivSkip');if(i>=0)A.mailAct(m.id+':'+i);}closeSheets();return JSON.stringify(G);});
}
async function restore(page,base,route='home'){await page.evaluate(({base,route})=>{DEMO.on=false;G=JSON.parse(base);UI.title=false;closeSheets();A.go(route);},{base,route});}
async function capture(page,name){if(output)await page.screenshot({path:path.join(output,name+'.png'),scale:'css'});}
async function assertTick(page,label){
 if(await page.evaluate(()=>!!UI.advRun||(!dayTick._until&&G.lastAdv?.days>0))){
  const active=await page.evaluate(()=>!!UI.advRun);if(active){await page.waitForSelector('#adv-progress');await capture(page,label+'-date');const box=await page.locator('#adv-progress').boundingBox(),v=page.viewportSize();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=v.width+1&&box.y+box.height<=v.height+1,label+' 실제 진행판 위치');await page.waitForFunction(()=>!UI.advRun);}
  const text=await page.locator('.fmtop .fm-date,.top .tbar .club>div>span').first().innerText();assert.ok(text.includes(await page.evaluate(()=>{const o=dobj(G.day);return (fmOn()||wide())?o.m+'월 '+o.d+'일':o.m+'/'+o.d;})),label+' 진행 후 실제 날짜');return {mode:'live',active,final:text};
 }

 if(await page.evaluate(()=>fmOn()||!!document.querySelector('.top .goset'))){
  const date='.fmtop .fm-date,.top .tbar .club>div>span',busy='.goset button.fm-busy';
  await page.waitForSelector(busy,{timeout:5000});
  const first=await page.locator(date).first().evaluate(el=>{const r=el.getBoundingClientRect();return {text:el.innerText,top:r.top,bottom:r.bottom,left:r.left,right:r.right,animations:el.getAnimations({subtree:true}).length+[...document.querySelectorAll('.goset .fm-busy')].reduce((n,b)=>n+b.getAnimations({subtree:true}).length,0),busy:!!document.querySelector('.fm-busy')};});
  const view=page.viewportSize();assert.ok(first.top>=0&&first.left>=0&&first.right<=view.width+1&&first.bottom<=view.height+1&&first.busy,label+' 상단 날짜·진행 막대 '+JSON.stringify(first));
  if(!(await page.evaluate(()=>matchMedia('(prefers-reduced-motion:reduce)').matches)))assert.ok(first.animations>0,label+' 날짜 전환 애니메이션');
  await capture(page,label+'-date');const refreshed=await page.evaluate(()=>{render();return {active:dayTick._until>Date.now(),busy:!!document.querySelector('.goset .fm-busy')};});assert.ok(!refreshed.active||refreshed.busy,label+' 날짜 진행 중 다시 그려도 진행 막대 유지');await page.waitForFunction(()=>!document.querySelector('.goset .fm-busy'));
  const final=await page.locator(date).first().innerText();assert.ok(final.includes(await page.evaluate(()=>{const o=dobj(G.day);return fmOn()?o.m+'월 '+o.d+'일':o.m+'/'+o.d;})),label+' 최종 날짜 '+final);
  return {mode:'header',first,final};
 }
 await page.waitForSelector('#dtick.on',{state:'visible',timeout:5000});await page.waitForTimeout(280);
 const first=await page.locator('#dtick').evaluate(el=>{const r=el.getBoundingClientRect(),v=visualViewport;return {top:r.top,left:r.left,right:r.right,bottom:r.bottom,width:v.width,height:v.height,opacity:+getComputedStyle(el).opacity,cur:el.querySelector('.cur')?.innerText,flip:el.querySelector('#dtFlip').innerText,final:el.querySelector('.dt-c:last-child').innerText,count:el.querySelectorAll('.dt-c').length,animations:el.getAnimations({subtree:true}).length};});
 assert.ok(first.top>=0&&first.left>=0&&first.right<=first.width+1&&first.bottom<=first.height+1&&first.opacity>.8,label+' '+JSON.stringify(first));
 await capture(page,label+'-date');
 await page.waitForFunction(()=>{const el=document.querySelector('#dtick');return el?.classList.contains('on')&&el.querySelector('.dt-c:last-child')?.classList.contains('cur');});
 const last=await page.locator('#dtFlip').innerText();assert.ok(last.includes(await page.evaluate(()=>dobj(G.day).d+'일')),label+' 마지막 날짜');
 if(first.count>2&&!(await page.evaluate(()=>matchMedia('(prefers-reduced-motion:reduce)').matches))){assert.notEqual(first.flip,last,label+' 실제 날짜 프레임 변화');assert.ok(first.animations>0,label+' 실제 CSS 애니메이션');}
 await page.waitForFunction(()=>!document.querySelector('#dtick.on'));return first;
}
async function swipe(page,selector){const loc=page.locator(selector).first(),box=await loc.boundingBox();assert.ok(box&&box.height>=60,selector+' 터치 영역 '+JSON.stringify(box));const cdp=await page.context().newCDPSession(page);try{
 const x=box.x+box.width*.75,from=box.y+box.height*.8,to=box.y+box.height*.15;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:from}]});
 for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:from+(to-from)*i/12}]});await page.waitForTimeout(24);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(180);
}finally{await cdp.detach();}}

async function drag(page,x,y,dx,dy,mid){const cdp=await page.context().newCDPSession(page);try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/10,y:y+dy*i/10}]});if(i===5&&mid)await page.evaluate(mid);await page.waitForTimeout(20);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);}finally{await cdp.detach();}}
/* 끌기 축 잠금(41_guard_boot.js): Chromium은 스스로 한 축으로 잠그므로, iOS처럼 다른 축이 같이 밀린 상황을 끌기 중간에 직접 만들고 되돌려지는지 본다.
   또 끝에서 더 당기는 세로 끌기는 막고(튕김), 움직일 수 있는 쪽은 그대로 두는지, 휴대폰 세로에서 목록을 내리면 위 줄이 접히는지(ws-up) 본다 */
async function axisLock(page,base,label,phone){
 await restore(page,base,'roster');
 await page.evaluate(()=>{const d=document.createElement('div');d.id='axt';d.style.cssText='position:fixed;left:40px;top:140px;width:200px;height:200px;overflow:auto;z-index:99;background:#222';d.innerHTML='<div style="width:900px;height:900px"></div>';document.body.append(d);d.scrollLeft=300;d.scrollTop=300;
  window.__pv=[];addEventListener('touchmove',e=>window.__pv.push(e.defaultPrevented),{passive:true});});
 await drag(page,140,240,-12,-120,()=>{document.querySelector('#axt').scrollLeft+=40;});
 let r=await page.evaluate(()=>{const d=document.querySelector('#axt');return {l:d.scrollLeft,t:d.scrollTop};});assert.ok(r.l===300&&r.t>330,label+' 세로 끌기 중 가로 밀림 되돌림 '+JSON.stringify(r));
 await page.waitForTimeout(1000);await page.evaluate(()=>{const d=document.querySelector('#axt');d.scrollLeft=300;d.scrollTop=300;});
 await drag(page,140,240,-120,-12,()=>{document.querySelector('#axt').scrollTop+=40;});
 r=await page.evaluate(()=>{const d=document.querySelector('#axt');return {l:d.scrollLeft,t:d.scrollTop};});assert.ok(r.t===300&&r.l>330,label+' 가로 끌기 중 세로 밀림 되돌림 '+JSON.stringify(r));
 await page.waitForTimeout(1000);/* 손을 뗀 뒤 관성 잠금(0.9초)이 풀린 다음 */await page.evaluate(()=>{const d=document.querySelector('#axt');d.scrollTop=0;window.__pv=[];});await drag(page,140,200,0,120);
 r=await page.evaluate(()=>window.__pv);assert.ok(r.length&&r.at(-1)===true,label+' 위 끝에서 더 당기면 막음 '+JSON.stringify(r));
 await page.evaluate(()=>{window.__pv=[];});await drag(page,140,300,0,-120);r=await page.evaluate(()=>({pv:window.__pv,t:document.querySelector('#axt').scrollTop}));assert.ok(!r.pv.some(Boolean)&&r.t>60,label+' 움직일 수 있는 쪽은 그대로 '+JSON.stringify(r));
 await page.evaluate(()=>document.querySelector('#axt').remove());
 /* 휴대폰은 두 축으로 스크롤되는 칸이 없어야 한다. 태블릿의 넓은 명단 표는 일부러 두 축(위 축 잠금이 처리) */
 for(const route of ['roster','league:stand','trade:market','transfer:fa','league:score']){await restore(page,base,route);const o=await page.evaluate(()=>({sx:scrollX,w:document.documentElement.scrollWidth,iw:innerWidth,two:[...document.querySelectorAll('main .ws-scroll,main .ws-filter-options,main .tw')].filter(e=>e.scrollWidth>e.clientWidth+1&&e.scrollHeight>e.clientHeight+1&&/auto|scroll/.test(getComputedStyle(e).overflowX)).map(e=>e.className)}));assert.ok(o.sx===0&&o.w<=o.iw+1&&(!phone||!o.two.length),label+' '+route+' 화면·목록이 옆으로 밀리지 않음 '+JSON.stringify(o));}
 if(phone){await restore(page,base,'transfer:fa');const sc=page.locator('main .ws-scroll').first();const before=await sc.evaluate(e=>e.getBoundingClientRect().height/innerHeight);for(let i=0;i<3;i++)await swipe(page,'main .ws-scroll');await page.waitForTimeout(120);
  const up=await sc.evaluate(e=>({on:e.closest('main').classList.contains('ws-slid'),ratio:e.getBoundingClientRect().height/innerHeight}));assert.ok(up.on&&up.ratio>=.7&&up.ratio>before,label+' 목록을 내리면 위 줄을 접어 목록 70% 이상 '+before.toFixed(2)+' '+JSON.stringify(up));
  await sc.evaluate(e=>{e.scrollTop=0;});await page.waitForTimeout(120);assert.ok(await sc.evaluate(e=>!e.closest('main').classList.contains('ws-slid')),label+' 맨 위로 오면 다시 펼침');}
}
(async()=>{buildSite();const server=await startSiteServer(path.resolve(__dirname,'../site'));let browser;
try{if(output)fs.mkdirSync(output,{recursive:true});browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 const seed=await browser.newPage();await seed.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await seed.goto(server.url);const base=await prepare(seed);await seed.close();
 const specs=[['small',{...devices['iPhone SE'],viewport:{width:320,height:568}}],['phone',devices['iPhone 13']],['android',devices['Pixel 7']],['tablet',devices['iPad Mini']],['large-tablet',devices['iPad Pro 11']]];
 for(const [name,config]of specs){if(process.env.TOUCH_DEVICES&&!process.env.TOUCH_DEVICES.split(',').includes(name))continue;const context=await browser.newContext(config),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await page.goto(server.url);await page.waitForFunction(()=>typeof newGame==='function');
  for(const landscape of [false,true]){const viewport=landscape?{width:config.viewport.height,height:config.viewport.width}:config.viewport;await page.setViewportSize(viewport);await page.waitForTimeout(200);await restore(page,base);const label=name+(landscape?'-landscape':'-portrait');await page.waitForTimeout(180);
   assert.ok(await page.evaluate(()=>navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches),'터치 기기 설정');
   for(const view of ['overview']){
    const fit=await page.locator('.home-workspace').evaluate(el=>({overflow:el.scrollHeight>el.clientHeight+2,outer:document.documentElement.scrollHeight>innerHeight+2,cards:[...el.querySelectorAll('.home-grid>.hw-panel,.hw-work>.hw-panel')].map(c=>c.clientHeight)}));assert.ok(!fit.overflow&&!fit.outer&&fit.cards.every(h=>h>=80),label+' '+view+' '+JSON.stringify(fit));
    const next=page.locator('[data-a="homePage"][data-v="1"]');if(await next.isEnabled()){const before=await page.locator('.hw-pager').innerText();await next.tap();assert.notEqual(await page.locator('.hw-pager').innerText(),before);}
   }
   await capture(page,label+'-home');const before=await page.evaluate(()=>G.day);await page.locator('button.continue').tap();if(await page.locator('#cfm [data-a="cfmOk"]').count())await page.locator('#cfm [data-a="cfmOk"]').tap();assert.ok(await page.evaluate(d=>G.day>d,before),label+' 실제 계속');const tick=await assertTick(page,label);
   for(const route of ['roster','staff:scouts','cal','cfg:set']){await page.evaluate(route=>A.go(route),route);const groups=await page.locator('.ws-pages [data-ws-page]').count()||1;
    for(let group=0;group<groups;group++){if(groups>1)await page.locator('.ws-pages [data-ws-page="'+String(group)+'"]').click();
     const fit=await page.evaluate(()=>{const main=document.querySelector('main.content');return {outer:document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2,overflow:main.scrollHeight>main.clientHeight+2,panels:[...main.querySelectorAll('.ws-panel:not([hidden])')].map(panel=>{const s=panel.querySelector('.ws-scroll');return {height:panel.clientHeight,overflow:panel.scrollHeight>panel.clientHeight+3,body:s.clientHeight,content:s.scrollHeight,text:s.innerText.length};})};});
     assert.ok(!fit.outer&&!fit.overflow&&!fit.panels.some(p=>p.overflow||(p.text>0&&p.content>p.body&&p.body<48)),label+' '+route+' '+group+' '+JSON.stringify(fit));
    }
   }
   await page.evaluate(()=>A.go('roster'));await capture(page,label+'-roster');const table='.roster-list .ws-scroll';const canScroll=await page.locator(table).evaluate(el=>el.scrollHeight>el.clientHeight+4);await swipe(page,table);assert.ok(!canScroll||await page.locator(table).evaluate(el=>el.scrollTop>0),label+' 실제 터치로 명단 스크롤 '+JSON.stringify(await page.locator(table).evaluate(el=>({cls:el.className,y:el.scrollTop,h:el.clientHeight,sh:el.scrollHeight,overflow:getComputedStyle(el).overflow,rect:el.getBoundingClientRect().toJSON(),inner:[...el.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight).slice(0,5).map(e=>({cls:e.className,h:e.clientHeight,sh:e.scrollHeight,y:e.scrollTop})),anc:[el,...(()=>{let a=[],p=el.parentElement;while(p){a.push(p);p=p.parentElement;}return a;})()].map(e=>({cls:e.className,touch:getComputedStyle(e).touchAction,overflow:getComputedStyle(e).overflow,y:e.scrollTop}))}))));assert.equal(await page.evaluate(()=>scrollY),0,'페이지 전체는 이동하지 않음');
   const visible=await page.locator(table).evaluate(el=>{const r=el.getBoundingClientRect(),head=el.querySelector('thead')?.getBoundingClientRect().bottom||r.top;return [...el.querySelectorAll('tr[data-a="player"] .pn')].filter(p=>{const b=p.getBoundingClientRect(),cy=b.top+b.height/2,cx=b.left+b.width/2;return cy>=Math.max(r.top,head)+2&&cy<=r.bottom-2&&cx>=r.left&&cx<=r.right;}).map(p=>p.closest('[data-a="player"]').dataset.v)[0];});assert.ok(visible,label+' 화면 안 선수 접근');
   const scrollBefore=await page.locator(table).evaluate(el=>el.scrollTop);await page.waitForTimeout(450);await page.locator('.roster-list [data-a="player"][data-v="'+visible+'"]:visible').first().locator('.pn').tap();assert.ok(await page.locator('#sheet [data-a="detailBack"]').isVisible(),'선수 상세 뒤로 접근 '+JSON.stringify(await page.evaluate(()=>({sheet:UI.sheet,title:UI.title,markup:document.querySelector('#sheet').innerHTML.slice(0,500),touch:window.__ax}))));await page.locator('#sheet [data-a="detailBack"]').tap();const scrollAfter=await page.locator(table).evaluate(el=>el.scrollTop);assert.ok(Math.abs(scrollAfter-scrollBefore)<3,label+' 상세에서 이전 명단 위치 복원 '+scrollBefore+' → '+scrollAfter);

   results.push({device:label,viewport,tick,errors});assert.deepEqual(errors,[]);console.log(label,'홈·전체 보고·계속/실제 날짜 프레임·터치 스크롤·선수 복귀 통과');
  }
  // 좁은 세로 화면과 태블릿에서 필터·메뉴·확인창·동작 줄이기·저장 복원을 직접 조작한다.
  if(['phone','tablet'].includes(name)){await page.setViewportSize(config.viewport);await page.waitForTimeout(200);await restore(page,base,'roster');const summary=page.locator('.roster-filters>summary');if(await summary.isVisible()){await summary.tap();await page.locator('[data-a="rscope"][data-v="all"]').tap();assert.equal(await page.evaluate(()=>UI.rscope),'all');await page.locator('.roster-filters>summary').tap();assert.ok(await page.locator('.roster-list .ws-scroll').evaluate(el=>el.clientHeight>=80));}
   await page.locator('.bnav [data-a="menu"]').tap();assert.ok(await page.evaluate(()=>UI.menu));await page.locator('#sheet [data-a="go"][data-v="staff:scouts"]').tap();assert.ok(await page.evaluate(()=>!UI.menu&&UI.tab==='staff'));
   await restore(page,base);await page.emulateMedia({reducedMotion:'reduce'});await page.locator('button.continue').tap();if(await page.locator('#cfm [data-a="cfmOk"]').count())await page.locator('#cfm [data-a="cfmOk"]').tap();await assertTick(page,name+'-reduced-motion');await page.emulateMedia({reducedMotion:'no-preference'});
   await restore(page,base);await page.evaluate(()=>{UI.homePage=0;render();});for(let i=0;i<6&&!await page.locator('.hw-sched [data-a="calJump"]').count();i++){const next=page.locator('[data-a="homePage"][data-v="1"]');if(!await next.isEnabled())break;await next.tap();}const jump=page.locator('.hw-sched [data-a="calJump"]').first();assert.ok(await jump.count(),name+' 홈 일정 카드 접근');const target=+(await jump.getAttribute('data-v'));await jump.tap();assert.ok(await page.evaluate(d=>UI.tab==='cal'&&UI.calSel===d,target),name+' 홈 일정에서 달력 이동');assert.ok(await page.locator('.cal-detail [data-a="advTo"]').isVisible(),name+' 바로간 날짜 상세 접근');
   await restore(page,base);const start=await page.evaluate(()=>G.day);await page.locator('.top [data-a="calOpen"]').tap();await page.locator('[data-a="calDay"][data-v="'+(start+2)+'"]').tap();assert.ok(await page.locator('.cal-detail [data-a="advTo"]').isVisible(),name+' 탭한 날짜의 상세 보고가 보임');await page.locator('.cal-detail [data-a="advTo"]').tap();if(await page.locator('#cfm [data-a="cfmOk"]').count())await page.locator('#cfm [data-a="cfmOk"]').tap();assert.ok(await page.evaluate(d=>G.day>d,start),name+' 달력에서 실제 진행');await assertTick(page,name+'-calendar');
   await restore(page,base);const again=await page.evaluate(()=>G.day);await page.evaluate(()=>A.adv('day'));await page.evaluate(()=>A.adv('day'));assert.equal(await page.evaluate(()=>G.day),again+2,name+' 실제 연속 하루 진행');await page.setViewportSize({width:config.viewport.height,height:config.viewport.width});await page.waitForTimeout(180);await assertTick(page,name+'-repeat-rotate');await page.setViewportSize(config.viewport);await page.waitForTimeout(180);
   await restore(page,base);await page.evaluate(()=>{G.day=G.cal.open-1;G.stopCfg={trade:false,inj:false,mgr:false,squad:false,owner:false,spon:false,press:false,info:false};for(const t of G.teams)setEntry(t.id);G.entryY=G.year;for(const m of G.mail)m.read=true;render();});await page.locator('button.continue').tap();await page.waitForFunction(()=>!UI.advRun);const batch=await page.evaluate(()=>({games:G.dig?.games.length,seriesEnd:seriesEnd(G.day),must:G.stops.some(m=>stopCat(m)==='must'),stops:G.stops.map(m=>[m.kind,m.subj])}));assert.ok(batch.games>=1&&batch.games<=3&&(batch.games===3||batch.seriesEnd||batch.must),name+' 최대 3경기·필수 계약 결정에서 먼저 중단 '+JSON.stringify(batch));assert.ok(await page.evaluate(()=>UI.wkres&&!UI.cast),name+' 개별 경기 대신 결과 묶음');await assertTick(page,name+'-three-games');
   const day=await page.evaluate(()=>{saveNow();return G.day;});await page.reload();await page.waitForSelector('[data-a="tsCont"]');assert.equal(await page.locator('#sheet [aria-label="경기 결과"]').count(),0,name+' 저장된 경기 요약이 시작 화면을 가리지 않음');await page.locator('[data-a="tsCont"]').tap();assert.equal(await page.evaluate(()=>G.day),day,name+' 재접속 후 날짜 복원');assert.ok(await page.locator('#sheet [aria-label="경기 결과"]').isVisible(),name+' 이어하기 뒤 미확인 결과 요약 복원');console.log(name,'필터·메뉴·동작 줄이기·홈 일정 바로가기·달력 진행·연속 진행 중 회전·최대 3경기/필수 결정 중단·결과 묶음·재접속 저장 복원 통과');
  }
  if(['phone','tablet','android'].includes(name)){await page.setViewportSize(config.viewport);await page.waitForTimeout(200);await axisLock(page,base,name,name!=='tablet');console.log(name,'끌기 축 잠금·끝 당김 막기·화면 옆 밀림 없음'+(name!=='tablet'?'·목록 내리면 위 줄 접기':'')+' 통과');}
  await context.close();
 }
 if(output)fs.writeFileSync(path.join(output,process.env.TOUCH_DEVICES?'results-'+process.env.TOUCH_DEVICES.replace(/,/g,'-')+'.json':'results.json'),JSON.stringify(results,null,2));
 console.log('웹 배포 빌드의 터치 기기 리뷰 통과 (Chromium 기기 모사; 실물 Safari 검증은 포함하지 않음)');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
