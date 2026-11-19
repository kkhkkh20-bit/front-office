/* 국사왕 11-18 화면: 해외연수 화면의 가을 교육리그 신청 기간 안내·바로가기, 권한 화면의 멘토 제안 비서 기준·면담 방식 고르기.
   390(가로 넘침 없음)·1366(페이지 스크롤 없음)에서 실제로 눌러 본다 */
const assert=require('node:assert/strict'),path=require('node:path');const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(process.env.UI_HTML||path.join(__dirname,'../index.html')),browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const results=[];
try{for(const [width,height] of [[390,844],[1366,768]]){const pc=width>=1100,c=await browser.newContext({viewport:{width,height},isMobile:!pc,hasTouch:!pc}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(120000);await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
  await p.waitForFunction(()=>typeof newGame==='function'&&typeof UI!=='undefined'&&UI.title===true);
  await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.fOkY=G.year;G.day=KD(9,5);G.fall=null;G.res=null;G.stops=[];G.evs=[];for(const m of G.mail){m.read=true;m.closed={text:'확인 완료'};}UI.title=false;UI.it=Object.assign(UI.it||{},{devv:'ovs',ovsMode:'program'});A.go('staff:dev');});
  const fit=async nm=>{const f=await p.evaluate(()=>({w:document.documentElement.scrollWidth<=innerWidth+2,h:document.scrollingElement.scrollHeight<=innerHeight+2}));assert.ok(f.w,nm+': 가로 넘침');if(pc)assert.ok(f.h,nm+': PC 페이지 스크롤');};
  await p.waitForSelector('.fall-ban');assert.match(await p.locator('.fall-ban').innerText(),/10월 10일까지 · D-35/);await fit('연수 화면 안내');
  await p.locator('.fall-ban [data-a=fallGo]').click();await p.waitForSelector('.fall-card.fall-open');assert.match(await p.locator('.fall-card').innerText(),/신청 기간 9월 1일~10월 10일 · 마감 D-35/);await fit('교육리그 카드');
  await p.locator('.fall-card [data-a=fallSet][data-v=ul]').click();await p.waitForFunction(()=>G.fall&&G.fall.k==='ul');
  await p.evaluate(()=>A.go('cfg:auth'));await p.waitForSelector('[data-a=evPol]');await fit('권한 화면');
  await p.locator('[data-a=evPol][data-v="vet:no"]').click();await p.waitForFunction(()=>G.evPol&&G.evPol.vet==='no');assert.equal(await p.locator('[data-a=evPol][data-v="vet:no"]').getAttribute('aria-pressed'),'true');
  await p.locator('select[data-a=stalkT]').selectOption('auto');await p.waitForFunction(()=>G.auto&&G.auto.stalkT==='auto');
  assert.ok(await p.locator('[data-a=handOff][data-v=fall]').count(),'가을 교육리그 자동 신청 켜기 버튼 없음');await fit('권한 화면 바꾼 뒤');
  assert.deepEqual(errors,[]);results.push({width,pass:true});await c.close();}
  console.log(JSON.stringify(results));console.log('위임·교육리그 화면: 통과');
}catch(e){console.error('실패',e.message);process.exitCode=1;}finally{await browser.close();await server.close();}})();
