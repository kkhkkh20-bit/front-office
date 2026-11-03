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

(async()=>{buildSite();const server=await startSiteServer(path.resolve(__dirname,'../site'));let browser;
try{if(output)fs.mkdirSync(output,{recursive:true});browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 const seed=await browser.newPage();await seed.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await seed.goto(server.url);const base=await prepare(seed);await seed.close();
 const specs=[['small',{...devices['iPhone SE'],viewport:{width:320,height:568}}],['phone',devices['iPhone 13']],['android',devices['Pixel 7']],['tablet',devices['iPad Mini']],['large-tablet',devices['iPad Pro 11']]];
 for(const [name,config]of specs){if(process.env.TOUCH_DEVICES&&!process.env.TOUCH_DEVICES.split(',').includes(name))continue;const context=await browser.newContext(config),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await page.goto(server.url);await page.waitForFunction(()=>typeof newGame==='function');
  for(const landscape of [false,true]){const viewport=landscape?{width:config.viewport.height,height:config.viewport.width}:config.viewport;await page.setViewportSize(viewport);await page.waitForTimeout(200);await restore(page,base);const label=name+(landscape?'-landscape':'-portrait');
   assert.ok(await page.evaluate(()=>navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches),'터치 기기 설정');
   for(const view of ['overview','work','team']){await page.locator('nav [data-a="homePanel"][data-v="'+view+'"]:visible').tap();
    const fit=await page.locator('.home-workspace').evaluate(el=>({overflow:el.scrollHeight>el.clientHeight+2,outer:document.documentElement.scrollHeight>innerHeight+2,cards:[...el.querySelectorAll('.home-grid>.hw-panel,.hw-work>.hw-panel')].map(c=>c.clientHeight)}));assert.ok(!fit.overflow&&!fit.outer&&fit.cards.every(h=>h>=80),label+' '+view+' '+JSON.stringify(fit));
    const next=page.locator('[data-a="homePage"][data-v="1"]');if(await next.isEnabled()){const before=await page.locator('.hw-pager').innerText();await next.tap();assert.notEqual(await page.locator('.hw-pager').innerText(),before);}
   }
   await page.locator('nav [data-a="homePanel"][data-v="overview"]:visible').tap();await capture(page,label+'-home');const before=await page.evaluate(()=>G.day);await page.locator('button.continue').tap();if(await page.locator('#cfm [data-a="cfmOk"]').count())await page.locator('#cfm [data-a="cfmOk"]').tap();assert.ok(await page.evaluate(d=>G.day>d,before),label+' 실제 계속');const tick=await assertTick(page,label);
   for(const route of ['roster','staff:scouts','cal','cfg:set']){await page.evaluate(route=>A.go(route),route);const groups=await page.locator('.ws-pages select option').count()||1;
    for(let group=0;group<groups;group++){if(groups>1)await page.locator('.ws-pages select').selectOption(String(group));
     const fit=await page.evaluate(()=>{const main=document.querySelector('main.content');return {outer:document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2,overflow:main.scrollHeight>main.clientHeight+2,panels:[...main.querySelectorAll('.ws-panel:not([hidden])')].map(panel=>{const s=panel.querySelector('.ws-scroll');return {height:panel.clientHeight,overflow:panel.scrollHeight>panel.clientHeight+3,body:s.clientHeight,content:s.scrollHeight,text:s.innerText.length};})};});
     assert.ok(!fit.outer&&!fit.overflow&&!fit.panels.some(p=>p.overflow||(p.text>0&&p.content>p.body&&p.body<48)),label+' '+route+' '+group+' '+JSON.stringify(fit));
    }
   }
   await page.evaluate(()=>A.go('roster'));await capture(page,label+'-roster');const table='.roster-list .ws-scroll';await swipe(page,table);assert.ok(await page.locator(table).evaluate(el=>el.scrollTop>0),label+' 실제 터치로 명단 스크롤 '+JSON.stringify(await page.locator(table).evaluate(el=>({cls:el.className,y:el.scrollTop,h:el.clientHeight,sh:el.scrollHeight,overflow:getComputedStyle(el).overflow,rect:el.getBoundingClientRect().toJSON(),inner:[...el.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight).slice(0,5).map(e=>({cls:e.className,h:e.clientHeight,sh:e.scrollHeight,y:e.scrollTop})),anc:[el,...(()=>{let a=[],p=el.parentElement;while(p){a.push(p);p=p.parentElement;}return a;})()].map(e=>({cls:e.className,touch:getComputedStyle(e).touchAction,overflow:getComputedStyle(e).overflow,y:e.scrollTop}))}))));assert.equal(await page.evaluate(()=>scrollY),0,'페이지 전체는 이동하지 않음');
   const visible=await page.locator(table).evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('[data-a="player"]')].filter(p=>{const b=p.getBoundingClientRect();return b.top>=r.top+35&&b.bottom<=r.bottom;}).map(p=>p.dataset.v)[0];});assert.ok(visible,label+' 화면 안 선수 접근');
   const scrollBefore=await page.locator(table).evaluate(el=>el.scrollTop);await page.locator('.roster-list [data-a="player"][data-v="'+visible+'"]:visible').first().tap();assert.ok(await page.locator('#sheet [data-a="detailBack"]').isVisible(),'선수 상세 뒤로 접근');await page.locator('#sheet [data-a="detailBack"]').tap();const scrollAfter=await page.locator(table).evaluate(el=>el.scrollTop);assert.ok(Math.abs(scrollAfter-scrollBefore)<3,label+' 상세에서 이전 명단 위치 복원 '+scrollBefore+' → '+scrollAfter);

   results.push({device:label,viewport,tick,errors});assert.deepEqual(errors,[]);console.log(label,'홈·전체 보고·계속/실제 날짜 프레임·터치 스크롤·선수 복귀 통과');
  }
  // 좁은 세로 화면과 태블릿에서 필터·메뉴·확인창·동작 줄이기·저장 복원을 직접 조작한다.
  if(['phone','tablet'].includes(name)){await page.setViewportSize(config.viewport);await page.waitForTimeout(200);await restore(page,base,'roster');const summary=page.locator('.roster-filters>summary');if(await summary.isVisible()){await summary.tap();await page.locator('[data-a="rscope"][data-v="all"]').tap();assert.equal(await page.evaluate(()=>UI.rscope),'all');await page.locator('.roster-filters>summary').tap();assert.ok(await page.locator('.roster-list .ws-scroll').evaluate(el=>el.clientHeight>=80));}
   await page.locator('.bnav [data-a="menu"]').tap();assert.ok(await page.evaluate(()=>UI.menu));await page.locator('#sheet [data-a="go"][data-v="staff:scouts"]').tap();assert.ok(await page.evaluate(()=>!UI.menu&&UI.tab==='staff'));
   await restore(page,base);await page.emulateMedia({reducedMotion:'reduce'});await page.locator('button.continue').tap();if(await page.locator('#cfm [data-a="cfmOk"]').count())await page.locator('#cfm [data-a="cfmOk"]').tap();await assertTick(page,name+'-reduced-motion');await page.emulateMedia({reducedMotion:'no-preference'});
   await restore(page,base);for(let i=0;i<6&&!await page.locator('.hw-upcoming [data-a="calJump"]').count();i++){const next=page.locator('[data-a="homePage"][data-v="1"]');if(!await next.isEnabled())break;await next.tap();}const jump=page.locator('.hw-upcoming [data-a="calJump"]').first();assert.ok(await jump.count(),name+' 홈 일정 카드 접근');const target=+(await jump.getAttribute('data-v'));await jump.tap();assert.ok(await page.evaluate(d=>UI.tab==='cal'&&UI.calSel===d,target),name+' 홈 일정에서 달력 이동');assert.ok(await page.locator('.cal-detail [data-a="advTo"]').isVisible(),name+' 바로간 날짜 상세 접근');
   await restore(page,base);const start=await page.evaluate(()=>G.day);await page.locator('.top [data-a="calOpen"]').tap();await page.locator('[data-a="calDay"][data-v="'+(start+2)+'"]').tap();assert.ok(await page.locator('.cal-detail [data-a="advTo"]').isVisible(),name+' 탭한 날짜의 상세 보고가 보임');await page.locator('.cal-detail [data-a="advTo"]').tap();if(await page.locator('#cfm [data-a="cfmOk"]').count())await page.locator('#cfm [data-a="cfmOk"]').tap();assert.ok(await page.evaluate(d=>G.day>d,start),name+' 달력에서 실제 진행');await assertTick(page,name+'-calendar');
   await restore(page,base);const again=await page.evaluate(()=>G.day);await page.locator('.top [data-a="adv"][data-v="day"]').tap();await page.waitForSelector('#dtick.on');await page.waitForTimeout(480);await page.locator('.top [data-a="adv"][data-v="day"]').tap();assert.equal(await page.evaluate(()=>G.day),again+2,name+' 실제 연속 하루 진행');await page.setViewportSize({width:config.viewport.height,height:config.viewport.width});await page.waitForTimeout(180);await assertTick(page,name+'-repeat-rotate');await page.setViewportSize(config.viewport);await page.waitForTimeout(180);
   await restore(page,base);await page.evaluate(()=>{G.day=G.cal.open-1;G.stopCfg={trade:false,inj:false,mgr:false,squad:false,owner:false,spon:false,press:false,info:false};for(const t of G.teams)setEntry(t.id);G.entryY=G.year;for(const m of G.mail)m.read=true;render();});await page.locator('button.continue').tap();assert.equal(await page.evaluate(()=>G.dig?.games.length),3,name+' 실제 터치로 3경기 진행');assert.ok(await page.evaluate(()=>UI.wkres&&!UI.cast),name+' 개별 경기 대신 결과 묶음');await assertTick(page,name+'-three-games');
   const day=await page.evaluate(()=>{saveNow();return G.day;});await page.reload();await page.waitForSelector('[data-a="tsCont"]');await page.locator('[data-a="tsCont"]').tap();assert.equal(await page.evaluate(()=>G.day),day,name+' 재접속 후 날짜 복원');console.log(name,'필터·메뉴·동작 줄이기·홈 일정 바로가기·달력 진행·연속 진행 중 회전·3경기 결과 묶음·재접속 저장 복원 통과');
  }
  await context.close();
 }
 if(output)fs.writeFileSync(path.join(output,process.env.TOUCH_DEVICES?'results-'+process.env.TOUCH_DEVICES.replace(/,/g,'-')+'.json':'results.json'),JSON.stringify(results,null,2));
 console.log('웹 배포 빌드의 터치 기기 리뷰 통과 (Chromium 기기 모사; 실물 Safari 검증은 포함하지 않음)');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
