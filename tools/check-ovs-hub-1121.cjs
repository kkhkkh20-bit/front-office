/* 해외 리그 허브(11-21): 리그 > 리그별에서 MLB·트리플A·NPB·CPBL·멕시코리그마다 순위·주요 선수·기록 순위·우승 역대를 연다.
   PC(1280x900)는 페이지 스크롤이 없고, 휴대폰(390x844)은 가로 넘침이 없어야 한다. 기록 순위는 그 리그 선수만, 세계 주목 선수 이름은 선수 카드를 연다.
   사용: node tools/check-ovs-hub-1121.cjs  (index.html 필요: bash build.sh). 스크린숏: OVS_HUB_OUT(기본 /tmp/ovs-hub-1121) */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const out=process.env.OVS_HUB_OUT||'/tmp/ovs-hub-1121';fs.mkdirSync(out,{recursive:true});const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
for(const [width,height] of [[1280,900],[390,844]]){const phone=width<1000,ctx=await browser.newContext({viewport:{width,height},isMobile:phone,hasTouch:phone}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
try{await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await page.waitForFunction(()=>typeof newGame==='function'&&UI.title===true);
  await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.stops=[];G.evs=[];G.offers=[];UI.title=false;
    G.day=KD(7,1);UI.it={...(UI.it||{}),ovlv:'stand',ovls:'MLB',ovlh:'stand'};A.go('league:ovs');render();});
  const fit=async tag=>{const r=await page.evaluate(()=>{window.scrollTo(0,9999);const s=document.scrollingElement;return {sy:scrollY,h:s.scrollHeight,vh:innerHeight,sw:s.scrollWidth,vw:innerWidth};});
    if(phone)assert.ok(r.sw<=r.vw+1,tag+' 휴대폰 가로 넘침 '+JSON.stringify(r)); else assert.ok(r.sy===0&&r.h<=r.vh+2,tag+' PC 페이지 스크롤 '+JSON.stringify(r)); await page.evaluate(()=>window.scrollTo(0,0)); };
  const shot=new Set(['MLB:stand','MLB:pl','MLB:rec','MLB:hist','NPB:rec','AAA:stand','LMB:stand']);
  for(const lg of ['MLB','AAA','NPB','CPBL','LMB'])for(const h of ['stand','pl','rec','hist']){
    const s=await page.evaluate(({lg,h})=>{UI.it.ovls=lg;UI.it.ovlh=h;render();const m=document.querySelector('.fmmain')||document.body;return {txt:m.textContent,cards:m.querySelectorAll('.am-lc').length,rows:m.querySelectorAll('.am-lt tbody tr').length,ht:m.querySelectorAll('.ovh-ht tbody tr').length};},{lg,h});
    if(h==='stand')assert.equal(s.rows,await page.evaluate(lg=>OVL_C[lg].length,lg),lg+' 순위 구단 수');
    if(h==='pl'||h==='rec')assert.ok(s.cards>=2&&s.rows>0&&/기록이 있는 선수|기록을 집계합니다/.test(s.txt),lg+' '+h+' '+JSON.stringify({c:s.cards,r:s.rows}));
    if(h==='hist')assert.ok(s.ht>=1&&s.ht<=10,lg+' 역대 '+s.ht);
    await fit(lg+':'+h);if(shot.has(lg+':'+h))await page.screenshot({path:path.join(out,`${width}-${lg}-${h}.png`)});}
  /* 기록 순위는 그 리그 선수만: NPB 표의 세계 주목 선수는 모두 NPB 소속 */
  const world=await page.evaluate(()=>{UI.it.ovls='NPB';UI.it.ovlh='rec';render();return [...document.querySelectorAll('.ovh-lg [data-a="ovlPlayer"]')].map(b=>wpsGet(b.dataset.v)).filter(Boolean).map(e=>({id:e.i,lg:e.lg}));});
  assert.ok(world.length>0,'NPB 기록 순위에 세계 주목 선수 링크가 있어야 함');assert.ok(world.every(e=>e.lg==='NPB'),'NPB 기록 순위에 다른 리그 선수');
  const wp=page.locator(`.ovh-lg [data-a="ovlPlayer"][data-v="${world[0].id}"]`).first();await wp.click();assert.ok(await page.locator('.ov-player-card').isVisible(),'세계 주목 선수 카드 열기');assert.equal(await page.evaluate(()=>UI.person),'ovp:'+world[0].id);await page.locator('#sheet [data-a="detailBack"]').click();
  /* 예전 탭 이름(역대 우승)은 리그별 > 우승·역대로, 구단 순위 단추는 그 구단을 표시 */
  const old=await page.evaluate(()=>{UI.it.ovlv='champ';render();const a={v:UI.it.ovlv,h:UI.it.ovlh};A.ovlTeam('NPB:3');render();return {...a,hl:document.querySelectorAll('.ovh-st tr.hl').length,s:UI.it.ovls,h2:UI.it.ovlh};});
  assert.deepEqual(old,{v:'stand',h:'hist',hl:1,s:'NPB',h2:'stand'},'예전 탭 '+JSON.stringify(old));
  for(const v of ['alum','top','world','moves']){await page.evaluate(v=>{UI.it.ovlv=v;render();},v);await fit(v);}
  /* KBO 출신 시상은 그 리그 역대 화면에 */
  const aw=await page.evaluate(()=>{const a=G.abroad.find(a=>(a.lines||[]).length)||G.abroad[0];a.lines=a.lines||[];a.lines.push({y:G.year-1,lvl:'NPB',c:2,g:140,pa:600,ab:520,h:160,d:30,tr:2,hr:30,bb:70,so:100,aw:['MVP']});UI.it.ovlv='stand';UI.it.ovls='NPB';UI.it.ovlh='hist';render();const t=document.querySelector('.ovh-aw')?.textContent||'';a.lines.pop();return t;});
  assert.match(aw,/MVP/,'KBO 출신 시상');
  assert.deepEqual(errors,[],'페이지 오류');console.log('해외 리그 허브 통과',width);
}catch(e){try{await page.screenshot({path:path.join(out,width+'-failed.png')});}catch{}throw e;}finally{await ctx.close();}}
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
