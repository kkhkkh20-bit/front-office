/* Real list clicks, public scouting limits, card navigation and optional artwork. */
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {chromium}=require('playwright'),{buildSite}=require('./build-site.cjs'),{startSiteServer}=require('./lib/site-server.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'fronttime-overseas-'));
 let server,browser;
 try{
  buildSite({root,out});server=await startSiteServer(out);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
  for(const width of [1440,1024,390]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width<1100,hasTouch:width<1100}),page=await context.newPage(),errors=[],photos=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/assets\/(design-review|scenes)\//.test(r.url()))photos.push(r.url());});
   await page.route('https://**/*',r=>r.abort());await page.goto(server.url);
   await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
   const data=await page.evaluate(()=>{
    DEMO.on=false;newGame(1);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);
    hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;ovlInit();wpsMigrate();UI.title=false;
    A.go('league:ovs');A.itab('ovlv:world');A.itab('wpsl:MLB');
    const w=G.wps.L.find(e=>e.lg==='MLB'&&e.c===0&&wkView(G.user,e).s!=='hide');
    const p=G.ovp.L.find(e=>e.l==='트리플A'&&Number.isInteger(e.c));
    if(!w||!p)throw Error('Missing real overseas fixtures');
    return {world:w.i,name:w.n,club:ovlNm(w.lg,w.c),pool:p.i,poolName:p.n,hidden:G.wps.L.filter(e=>wkView(G.user,e).s==='hide').map(e=>e.i)};
   });
   await page.locator(`.wps-player-link[data-v="${data.world}"]`).click();
   assert.ok(await page.locator('.ov-player-card').isVisible(),`${width}: world list opens player card`);
   assert.equal(await page.locator('.ov-player-card h2').innerText(),data.name);
   assert.equal(await page.locator('.ov-player-card [data-a="ovqAsk"]').count(),0,'World players remain watch-only');
   const expected=await page.evaluate(id=>{const d=ovPlayerData(id);return {year:G.year,years:d.lines.map(l=>l.y).reverse(),state:d.v.s,source:JSON.stringify(G.wps.L)};},data.world);
   const years=await page.locator('.ov-player-card .wps-ht tbody tr td:first-child').allTextContents();
   assert.deepEqual(years.map(y=>parseInt(y)),expected.years,'Only public season lines are shown');
   if(await page.evaluate(()=>ovlFrac(G.year)===0))assert.ok(expected.years.every(y=>y<expected.year),'No preseason forecast is presented as a played season');
   if(process.env.SHOT){fs.mkdirSync(process.env.SHOT,{recursive:true});await page.screenshot({path:path.join(process.env.SHOT,`overseas-player-${width}.png`)});}
   const oldest=page.locator('.wps-ht [data-a="ovlClub"]').last(),oldestValue=await oldest.getAttribute('data-v');
   await oldest.click();assert.ok((await page.locator('.ov-club-card').innerText()).includes(oldestValue.split(':')[2]),'Player history keeps its year even without saved club standings');
   await page.locator('#sheet [data-a="detailBack"]').click();
   if(expected.state==='stat')assert.ok((await page.locator('.ov-card-report').innerText()).includes('기록만'));
   await page.locator('.ov-player-card [data-a="ovwT"]').click();
   assert.ok(await page.evaluate(id=>G.ovw.some(w=>String(w.id)===String(id)),data.world),'Watch action uses the real watch list');
   await page.locator('.ov-card-facts [data-a="ovlClub"]').click();
   assert.equal(await page.locator('.ov-club-card h2').innerText(),data.club);
   assert.ok(await page.locator(`.ov-club-card [data-a="ovlPlayer"][data-v="${data.world}"]`).isVisible(),'Known current roster is available before opening day');
   if(process.env.SHOT)await page.screenshot({path:path.join(process.env.SHOT,`overseas-club-${width}.png`)});
   const rosterIds=await page.locator('.ov-club-card [data-a="ovlPlayer"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.v));
   assert.ok(!data.hidden.some(id=>rosterIds.includes(String(id))),'Club roster does not expose hidden players');
   await page.locator(`.ov-club-card [data-a="ovlPlayer"][data-v="${data.world}"]`).click();
   await page.locator('#sheet [data-a="detailBack"]').click();assert.ok(await page.locator('.ov-club-card').isVisible());
   await page.locator('#sheet [data-a="detailBack"]').click();assert.ok(await page.locator('.ov-player-card').isVisible());
   await page.locator('#sheet [data-a="detailBack"]').click();assert.equal(await page.locator('#sheet .sheet').count(),0);
   assert.equal(await page.evaluate(()=>JSON.stringify(G.wps.L)),expected.source,'Reading cards does not alter source abilities or records');
   await page.evaluate(()=>{A.itab('ovlv:stand');A.itab('ovls:AAA');A.itab('ovlh:pl');});
   Object.assign(data,await page.evaluate(()=>{const ids=[...document.querySelectorAll('#app [data-a="ovlPlayer"]')].map(e=>e.dataset.v),p=G.ovp.L.find(e=>e.l==='트리플A'&&ids.includes(String(e.i)));if(!p)throw Error('No candidate in main-player list');return {pool:p.i,poolName:p.n};}));
   const poolLink=page.locator(`#app [data-a="ovlPlayer"][data-v="${data.pool}"]`).first();
   assert.ok(await poolLink.isVisible(),'Overseas candidates have clickable names');await poolLink.click();
   assert.equal(await page.locator('.ov-player-card h2').innerText(),data.poolName);
   assert.equal(await page.locator('.ov-player-card [data-a="ovqAsk"]').count(),1,'Candidate inquiry remains available');
   await page.locator('.ov-card-facts [data-a="ovlClub"]').click();
   assert.match(await page.locator('.ov-club-card').innerText(),/MLB.*산하/s);
   await page.locator('.ov-club-card p [data-a="ovlClub"]').first().click();assert.match(await page.locator('.ov-club-card .eyebrow').innerText(),/MLB/);
   await page.locator('.ov-card-actions [data-a="ovlTeam"]').click();assert.equal(await page.locator('#sheet .sheet').count(),0);
   assert.equal(await page.evaluate(()=>UI.it.ovlh),'stand');
   await page.locator('#app [data-a="ovlClub"]').first().click();assert.ok(await page.locator('.ov-club-card').isVisible(),'Standings open club card');
   await page.evaluate(()=>closeSheets());await page.evaluate(()=>A.itab('ovlh:hist'));
   const history=page.locator('#app [data-a="ovlClub"]').first(),value=await history.getAttribute('data-v');await history.click();
   assert.ok((await page.locator('.ov-club-card').innerText()).includes(value.split(':')[2]),'Historical link keeps the selected year');
   const dimensions=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert.ok(dimensions.sw<=dimensions.w+1,`${width}: no horizontal page overflow`);
   await page.evaluate(()=>{closeSheets();A.go('staff:med');});
   assert.equal(await page.locator('.ops-photo,.scene-im').count(),0,'Decorative photos are hidden by default');assert.equal(photos.length,0,'Hidden decorations do not request photo assets');
   await page.evaluate(()=>{A.go('cfg:set');A.itab('setg:view');});await page.locator('[data-a="decorPhotos"]').check();
   await page.evaluate(()=>A.go('staff:med'));assert.equal(await page.locator('.ops-photo').count(),3,'Opting in restores medical photos');
   await page.locator('.ops-photo').first().evaluate(i=>i.decode());assert.equal(await page.evaluate(()=>localStorage.getItem('fronttime-decor-photos')),'1');
   assert.ok(await page.evaluate(()=>!!avImg(Object.values(G.players).find(p=>p.team===G.user),36)),'Player portraits remain enabled');
   await page.evaluate(()=>{A.go('cfg:set');A.itab('setg:view');});await page.locator('[data-a="decorPhotos"]').uncheck();await page.evaluate(()=>A.go('staff:med'));
   assert.equal(await page.locator('.ops-photo').count(),0);assert.deepEqual(errors,[]);await context.close();
   console.log(`${width}: 해외 선수·후보·구단·과거 시즌·뒤로 이동·정보 제한·장식 사진 설정 통과`);
  }
 }finally{await browser?.close();await server?.close();fs.rmSync(out,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
