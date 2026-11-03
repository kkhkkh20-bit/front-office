/* 작업 화면은 고정, 휠과 키보드 스크롤은 표·목록 안에서만 움직인다. */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(server.url);
await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;});
const routes=await page.evaluate(()=>['roster','trade','transfer','staff','league','club','cfg'].flatMap(k=>SUBS[k]?.length?SUBS[k].map(s=>k+':'+s[0]):[k]));
for(const [width,height]of [[1366,768],[1920,1080],[1024,768],[390,844]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(180);
 for(const route of routes){
  await page.evaluate(route=>{closeSheets();A.go(route);},route);
  const groups=await page.locator('.ws-pages select option').count()||1;
  for(let group=0;group<groups;group++){
   if(groups>1)await page.locator('.ws-pages select').selectOption(String(group));
   const fit=await page.evaluate(()=>{const main=document.querySelector('main.content'),parent=document.querySelector('.fmmain');if(parent)parent.scrollTop=1000;return {ready:main.classList.contains('ws-frame'),outer:document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2,overflow:main.scrollHeight>main.clientHeight+2,parent:parent?.scrollTop||0,panels:[...main.querySelectorAll('.ws-panel:not([hidden])')].map(el=>{const s=el.querySelector('.ws-scroll'),r=el.getBoundingClientRect();return {bottom:r.bottom,height:r.height,scroll:s?.clientHeight,overflow:el.scrollHeight>el.clientHeight+3};})};});
   assert.ok(fit.ready&&!fit.outer&&!fit.overflow&&!fit.parent&&!fit.panels.some(p=>p.bottom>height+2||p.height<40||p.scroll<30||p.overflow),width+' '+route+' group '+group+' '+JSON.stringify(fit));
  }
 }
 console.log('고정 작업 화면',width,height,routes.length,'개 메뉴 및 모든 보고 묶음 통과');
}
await page.setViewportSize({width:1366,height:768});await page.waitForTimeout(200);await page.evaluate(()=>{UI.rscope='all';A.tab('roster');});
const table=page.locator('.roster-list .ws-scroll.tw'),box=await table.boundingBox();assert.ok(box&&box.height>100,'선수 명단 스크롤 영역 확보 '+JSON.stringify(box));const heading=await page.locator('.roster-heading').boundingBox();await table.hover();await page.mouse.wheel(0,1000);await page.waitForTimeout(150);
let scrolled=await table.evaluate(el=>({y:el.scrollTop,head:el.querySelector('thead').getBoundingClientRect().top,top:el.getBoundingClientRect().top}));assert.ok(scrolled.y>0,'실제 휠로 명단 스크롤');assert.ok(Math.abs(scrolled.head-scrolled.top)<3,'열 제목 고정');assert.equal((await page.locator('.roster-heading').boundingBox()).y,heading.y,'선수단 필터와 제목은 움직이지 않음');assert.equal(await page.evaluate(()=>document.querySelector('.fmmain').scrollTop),0,'본문 전체로 스크롤 전파 없음');
await page.evaluate(()=>{const p=domestic(G.user).find(p=>p.hist?.length);const h=p.hist[0];p.hist.push(...Array.from({length:35},(_,i)=>({...h,y:G.year-4-i})));A.player(p.id);A.ptab('rec');});
const select=page.locator('.ws-detail-body .ws-pages select');if(await select.count())await select.selectOption(String((await select.locator('option').count())-1));
const record=page.locator('.ws-detail-body .ws-panel:not([hidden]) .ws-scroll.tw');assert.ok(await record.count(),'선수 기록도 표 내부 스크롤');assert.ok(await record.evaluate(el=>el.scrollHeight>el.clientHeight),'오래된 기록이 들어갈 스크롤 영역');await record.hover();await page.mouse.wheel(0,1200);await page.waitForTimeout(100);assert.ok(await record.evaluate(el=>el.scrollTop>0),'기록표 휠 이동');assert.ok(await page.locator('.pf-topnav').isVisible(),'신상과 탭 유지');await page.keyboard.press('Escape');assert.ok(await page.locator('.roster-list .ws-scroll.tw').evaluate(el=>el.scrollTop>0),'선수 상세에서 돌아온 명단 위치 보존');
await page.evaluate(()=>{newGame(6);fdStart();UI.title=false;UI.tab='home';render();});
for(const [width,height]of [[1366,768],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(200);const draft=await page.locator('.fdt-w').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,root:document.documentElement.scrollHeight,viewport:innerHeight,body:document.querySelector('.dshell>.gut').scrollHeight>document.querySelector('.dshell>.gut').clientHeight+2}));assert.ok(draft.height>=60&&draft.scroll>draft.height&&draft.root<=draft.viewport+2&&!draft.body,'드래프트 후보 표 '+width+' '+JSON.stringify(draft));}
assert.deepEqual(errors,[]);console.log('실제 휠·표 머리글·필터 고정·선수 기록·PC/모바일 드래프트 통과');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
