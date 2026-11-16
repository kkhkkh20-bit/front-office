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
  const groups=await page.locator('.ws-pages [data-ws-page]').count()||1;
  for(let group=0;group<groups;group++){
   if(groups>1)await page.locator('.ws-pages [data-ws-page="'+String(group)+'"]').click();
   const fit=await page.evaluate(()=>{const main=document.querySelector('main.content'),parent=document.querySelector('.fmmain');if(parent)parent.scrollTop=1000;return {ready:main.classList.contains('ws-frame'),outer:document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2,overflow:main.scrollHeight>main.clientHeight+2,parent:parent?.scrollTop||0,panels:[...main.querySelectorAll('.ws-panel:not([hidden])')].map(el=>{const s=el.querySelector('.ws-scroll'),r=el.getBoundingClientRect();return {bottom:r.bottom,height:r.height,scroll:s?.clientHeight,overflow:el.scrollHeight>el.clientHeight+3};})};});
   assert.ok(fit.ready&&!fit.outer&&!fit.overflow&&!fit.parent&&!fit.panels.some(p=>p.bottom>height+2||p.height<40||p.scroll<30||p.overflow),width+' '+route+' group '+group+' '+JSON.stringify(fit));
  }
 }
 console.log('고정 작업 화면',width,height,routes.length,'개 메뉴 및 모든 보고 묶음 통과');
}
await page.setViewportSize({width:1366,height:768});await page.waitForTimeout(200);await page.evaluate(()=>{UI.rscope='all';A.tab('roster');});
const table=page.locator('.roster-list .ws-scroll.tw'),box=await table.boundingBox();assert.ok(box&&box.height>100,'선수 명단 스크롤 영역 확보 '+JSON.stringify(box));const heading=await page.locator('.roster-heading').boundingBox();/* PC는 상자 안 스크롤 대신 쪽으로 넘긴다(UI 3단계 3-0, 구단주 11-16 "드래그 없게"): 들어가는 줄만 보이고 '‹ 1/N ›' */
const firstRow=()=>table.evaluate(el=>[...el.querySelectorAll('tbody tr')].find(r=>r.getClientRects().length)?.innerText.slice(0,20));
const row0=await firstRow();assert.ok(await table.locator('.fp-bar').count(),'명단 쪽 넘김 막대');assert.equal(await table.evaluate(el=>el.scrollHeight<=el.clientHeight+2),true,'명단 칸 안 스크롤바 없음');
await table.locator('.fp-bar button').last().click();await page.waitForTimeout(150);assert.notEqual(await firstRow(),row0,'다음 쪽 명단');
let scrolled=await table.evaluate(el=>({y:el.scrollTop,head:el.querySelector('thead').getBoundingClientRect().top,top:el.getBoundingClientRect().top}));assert.ok(Math.abs(scrolled.head-scrolled.top)<3,'열 제목은 칸 맨 위');assert.equal((await page.locator('.roster-heading').boundingBox()).y,heading.y,'선수단 필터와 제목은 움직이지 않음');assert.equal(await page.evaluate(()=>document.querySelector('.fmmain').scrollTop),0,'본문 전체로 스크롤 전파 없음');
await page.evaluate(()=>{const p=domestic(G.user).find(p=>p.hist?.length);const h=p.hist[0];p.hist.push(...Array.from({length:35},(_,i)=>({...h,y:G.year-4-i})));A.player(p.id);A.ptab('rec');});
const pages=page.locator('.ws-detail-body .ws-pages [data-ws-page]');if(await pages.count())await pages.last().click();
const record=page.locator('.ws-detail-body .ws-panel:not([hidden]) .ws-scroll.tw');assert.ok(await record.count(),'선수 기록 표');const recFirst=()=>record.evaluate(el=>[...el.querySelectorAll('tbody tr')].find(r=>r.getClientRects().length)?.innerText.slice(0,12));const rec0=await recFirst();assert.ok(await record.locator('.fp-bar').count(),'오래된 기록은 쪽으로 넘김');await record.locator('.fp-bar button').last().click();await page.waitForTimeout(100);assert.notEqual(await recFirst(),rec0,'기록표 다음 쪽');assert.ok(await page.locator('.pf-topnav').isVisible()||await page.locator('.fm-sub .pf-subtabs').first().isVisible().catch(()=>false),'신상과 탭 유지'); /* PC(1100px 이상)는 선수 탭이 위 하위 탭 줄로 올라간다 */await page.keyboard.press('Escape');assert.notEqual(await firstRow(),row0,'선수 상세에서 돌아온 명단 쪽 보존');
await page.evaluate(()=>{newGame(6);fdStart();UI.title=false;UI.tab='home';render();});
for(const [width,height]of [[1366,768],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(200);const draft=await page.locator('.fdt-w').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,root:document.documentElement.scrollHeight,viewport:innerHeight,body:document.querySelector('.dshell>.gut').scrollHeight>document.querySelector('.dshell>.gut').clientHeight+2}));assert.ok(draft.height>=60&&draft.scroll>draft.height&&draft.root<=draft.viewport+2&&!draft.body,'드래프트 후보 표 '+width+' '+JSON.stringify(draft));}
assert.deepEqual(errors,[]);console.log('실제 휠·표 머리글·필터 고정·선수 기록·PC/모바일 드래프트 통과');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
