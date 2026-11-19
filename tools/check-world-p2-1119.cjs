/* 세계척도 P2·P3(11-19): 해외 리그 > 세계 선수 화면. 구단별 주목 선수·스카우트 지식·관찰 기록을 PC(1366·1920)와 휴대폰(390)에서 연다.
   PC는 페이지 스크롤이 없고(본문 안에서만 스크롤), 휴대폰은 가로 넘침이 없어야 한다. 관찰 등록·해제와 관찰 기록 탭, 지식 단계(기록만/대략/좁은 범위)도 본다.
   사용: node tools/check-world-p2-1119.cjs  (index.html 필요: bash build.sh). 스크린숏: WORLD_P2_OUT(기본 /tmp/world-p2-1119) */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const out=process.env.WORLD_P2_OUT||'/tmp/world-p2-1119';fs.mkdirSync(out,{recursive:true});const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
for(const [width,height] of [[1366,768],[1920,1080],[390,844]]){const phone=width<1000,ctx=await browser.newContext({viewport:{width,height},isMobile:phone,hasTouch:phone}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
try{await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await page.waitForFunction(()=>typeof newGame==='function'&&UI.title===true);
  await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.stops=[];G.evs=[];G.offers=[];UI.title=false;G.ovw=[];G.fwatch=[];
    G.day=KD(6,20);UI.it={...(UI.it||{}),ovlv:'world',wpsl:'MLB'};A.go('league:ovs');render();});
  const fit=async tag=>{const r=await page.evaluate(()=>{window.scrollTo(0,9999);const m=document.querySelector('.fmmain');return {sy:scrollY,h:document.documentElement.scrollHeight,vh:innerHeight,sw:document.documentElement.scrollWidth,vw:innerWidth,main:m?m.getBoundingClientRect().bottom:0};});
    if(phone)assert.ok(r.sw<=r.vw+1,tag+' 휴대폰 가로 넘침 '+JSON.stringify(r)); else assert.ok(r.sy===0&&r.h<=r.vh+2&&r.main<=r.vh+2,tag+' PC 페이지 스크롤 '+JSON.stringify(r)); await page.evaluate(()=>window.scrollTo(0,0)); };
  /* 1) 기본 지식(미국 해외망 1단계): MLB는 대략, 트리플A는 기록만 */
  const s0=await page.evaluate(()=>({mlb:wkKnow(G.user,'MLB'),aaa:wkKnow(G.user,'AAA'),n:G.wps.L.length,rows:document.querySelectorAll('.wp').length,est:document.querySelectorAll('.wps-est.rough').length}));
  assert.ok(s0.n>=380&&s0.rows>0&&s0.est>0&&s0.mlb>=45&&s0.aaa<45,'기본 화면 '+JSON.stringify(s0));
  await page.locator('details.wp>summary:visible').first().click();await fit('MLB');await page.screenshot({path:path.join(out,`${width}-mlb.png`)});
  await page.evaluate(()=>{UI.it.wpsl='AAA';render();});const aaa=await page.evaluate(()=>({stat:document.querySelectorAll('.wps-est.muted').length,rough:document.querySelectorAll('.wps-est.rough,.wps-est.tight').length}));assert.ok(aaa.stat>0&&aaa.rough===0,'트리플A 기록만 '+JSON.stringify(aaa));await fit('AAA');
  /* 2) 지식을 올리면(해외망 3단계 + 파견 200일) 좁은 범위와 심층 보고서 */
  await page.evaluate(()=>{G.intl.us=3;const s=G.scouts[0];s.role='intl';s.region='us';s.since=G.day-200;render();});
  const t=await page.evaluate(()=>({k:wkKnow(G.user,'AAA'),tight:document.querySelectorAll('.wps-est.tight').length}));assert.ok(t.k>=70&&t.tight>0,'지식 상승 '+JSON.stringify(t));
  const id=await page.evaluate(()=>{const d=document.querySelector('details.wp');d.open=true;return d.dataset.k.slice(3);});await page.waitForTimeout(50);
  assert.ok(await page.evaluate(id=>/심층 보고서/.test(document.querySelector(`details.wp[data-k="wp_${id}"]`).textContent),id),'심층 보고서 없음');
  await page.locator(`details.wp[data-k="wp_${id}"] [data-a="ovwT"]:visible`).first().click();assert.ok(await page.evaluate(id=>ovwOn(+id)&&G.ovw.find(w=>String(w.id)===id).y0===G.year,id),'관찰 등록 안 됨');
  await fit('AAA-tight');await page.screenshot({path:path.join(out,`${width}-aaa-tight.png`)});
  /* 3) 시즌을 넘기면 관찰 기록이 한 줄 쌓이고 관찰 탭에 보인다 */
  await page.evaluate(()=>{const W=G.wps;wpsSeasonEnd();G.year++;wpsNewYear();G.day=KD(7,1);UI.it.wpsl='watch';render();});
  const w=await page.evaluate(id=>({h:(G.ovw.find(x=>String(x.id)===id).h||[]).length,cards:document.querySelectorAll('.wpw').length,txt:document.querySelector('.wpw')?.textContent||''}),id);assert.ok(w.h>=1&&w.cards===1&&/관찰/.test(w.txt),'관찰 기록 '+JSON.stringify(w));
  await fit('watch');await page.screenshot({path:path.join(out,`${width}-watch.png`)});
  await page.evaluate(()=>{UI.it.wpsl='LMB';render();});await fit('LMB');await page.screenshot({path:path.join(out,`${width}-lmb.png`)});
  assert.deepEqual(errors,[],'페이지 오류');console.log('세계 선수 화면 통과',width);
}catch(e){try{await page.screenshot({path:path.join(out,width+'-failed.png')});}catch{}throw e;}finally{await ctx.close();}}
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
