/* 3D를 못 띄운 이유 안내(사용자 11-17): 사이트판에서 파일 받기 실패·시간 초과·업데이트 직후(404)를 재현해
   기본 중계 안내에 이유 한 줄·받은 양이 보이고, 다시 시도가 진짜로 다시 받으며, 업데이트 직후엔 새로고침 버튼이 뜨는지 본다.
   CAPTURE=폴더 를 주면 안내 화면을 PNG로 남긴다. */
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright'),{buildSite}=require('./build-site.cjs'),{startSiteServer}=require('./lib/site-server.cjs');
const shot=async(page,name)=>{if(process.env.CAPTURE)await page.screenshot({path:path.join(process.env.CAPTURE,name+'.png')});};
(async()=>{const root=path.resolve(__dirname,'..');if(!process.env.SKIP_SITE_BUILD)buildSite({root});const server=await startSiteServer(path.join(root,'site'));let browser;const errors=[];try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--enable-unsafe-swiftshader']});
 async function open(viewport,setup){const ctx=await browser.newContext({viewport});const page=await ctx.newPage();const models=[];await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await page.route('https://www.googletagmanager.com/**',r=>r.fulfill({body:'',contentType:'text/javascript'}));page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('.glb'))models.push(r.url());});if(setup)await setup(page);
  await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await page.waitForFunction(()=>typeof newGame==='function'&&typeof A!=='undefined');
  await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open+2;for(const t of G.teams)setEntry(t.id);const op=G.teams.find(t=>t.id!==G.user).id,g=simGame(G.day,G.user,op,false);applyGame(G.day,G.user,op,g,false);G.games=[gameRecord(G.day,G.user,op,g,'')];UI.title=false;UI.tab='home';render();});
  return {ctx,page,models};}
 const cast=page=>page.evaluate(()=>{A.cast(0);castJump(G.games[0].pbp.findIndex(x=>typeof x[1]==='number'),false);});
 const waitFail=page=>page.waitForFunction(()=>{const h=document.querySelector('#cs-3d');return h?.dataset.state==='fallback'&&h.dataset.fail&&!h.dataset.bg;},{},{timeout:60000});
 const notice=page=>page.evaluate(()=>{const h=document.querySelector('#cs-3d'),vis=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).display!=='none';return {text:h.querySelector('.cs-3d-status').textContent,fail:h.dataset.fail,renderer:h.parentElement.dataset.renderer,retry:vis(h.querySelector('.cs-3d-retry')),reload:vis(h.querySelector('.cs-3d-reload')),rec:globalThis.__fo3d?.fail||null,info:fbInfoText()};});

 /* (a) 모델 하나가 연결 끊김: '받지 못했습니다' + 다시 시도. 풀고 다시 시도하면 기본 중계를 둔 채 다시 받아 3D로 넘어간다 */
 {let blocked=true;const {ctx,page,models}=await open({width:1366,height:768},page=>page.route('**/assets/match3d/stadium.*.glb',r=>blocked?r.abort('connectionreset'):r.continue()));
  await cast(page);await waitFail(page);const n=await notice(page);
  assert.match(n.text,/받지 못했습니다/,n.text);assert.match(n.text,/새로고침 권장/);assert.equal(n.fail,'network');assert.ok(n.retry,'다시 시도 버튼');assert.ok(!n.reload,'연결 끊김만으론 새로고침 버튼 없음');assert.equal(n.renderer,'fallback');
  assert.equal(n.rec?.stage,'download');assert.match(n.info,/3D 실패 network\/download/,'제보용 정보에 실패 이유');await shot(page,'a-network-pc');
  const before=models.length,pos=await page.evaluate(()=>({g:UI.cast.g,k:UI.cast.k}));blocked=false;await page.locator('[data-a="castRetry3d"]').click();
  const bg=await page.evaluate(()=>{const h=document.querySelector('#cs-3d');return {state:h.dataset.state,bg:h.dataset.bg,renderer:h.parentElement.dataset.renderer,text:h.querySelector('.cs-3d-status').textContent};});
  assert.equal(bg.state,'fallback','다시 시도 중에도 기본 중계를 보인다');assert.equal(bg.renderer,'fallback');assert.equal(bg.bg,'1');
  await page.waitForFunction(()=>Match3D.ready(),{},{timeout:150000});const after=models.slice(before);
  assert.ok(after.some(u=>u.includes('/stadium.')),'다시 시도는 실패한 파일을 다시 받는다');assert.ok(after.length>=5,'캐시를 비우고 다섯 파일을 다시 받는다 '+after.length);
  assert.deepEqual(await page.evaluate(()=>({g:UI.cast.g,k:UI.cast.k})),pos,'같은 경기·장면');assert.equal(await page.evaluate(()=>document.querySelector('#cs-3d').dataset.state),'ready');
  assert.equal(await page.evaluate(()=>globalThis.__fo3d.tries),1);console.log('a) 연결 끊김 → 이유·다시 시도·다시 받아 3D 준비 통과');await ctx.close();}

 /* (b) 시간 초과(점검용 __FO3D_LOAD_MS로 2초): '오래 걸려(2초)' + 받은 양 */
 {const {ctx,page}=await open({width:1366,height:768},async page=>{await page.addInitScript(()=>{window.__FO3D_LOAD_MS=2000;});await page.route('**/assets/match3d/player.*.glb',async r=>{await new Promise(ok=>setTimeout(ok,6000));await r.continue().catch(()=>{});});});
  await cast(page);await waitFail(page);const n=await notice(page);
  assert.match(n.text,/오래 걸려\(2초\) 멈췄습니다 — 느린 연결/,n.text);assert.match(n.text,/MB 받음/,'받은 양');assert.equal(n.fail,'timeout');assert.ok(n.retry);assert.equal(n.rec.stage,'download');await shot(page,'b-timeout-pc');
  console.log('b) 시간 초과 → 이유·받은 양 통과:',n.text);await ctx.close();}

 /* (c) 해시 파일 404(업데이트 직후): 새로고침 권장 + 새로고침 버튼. release.json의 빌드가 다르면 '새 버전' 안내 */
 {const {ctx,page}=await open({width:1366,height:768},page=>page.route('**/assets/match3d/field.*.glb',r=>r.fulfill({status:404,body:'missing'})));
  await cast(page);await waitFail(page);const n=await notice(page);
  assert.match(n.text,/응답 404/,n.text);assert.match(n.text,/새로고침/);assert.equal(n.fail,'http');assert.ok(n.reload&&n.retry,'404면 새로고침·다시 시도 둘 다');await ctx.close();}
 {const {ctx,page}=await open({width:1366,height:768},async page=>{await page.route('**/assets/match3d/field.*.glb',r=>r.fulfill({status:404,body:'missing'}));await page.route('**/release.json*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({build:'0000000000000000'})}));});
  await cast(page);await page.waitForFunction(()=>document.querySelector('#cs-3d')?.dataset.fail==='stale',{},{timeout:60000});const n=await notice(page);
  assert.match(n.text,/새 버전으로 업데이트/,n.text);assert.ok(n.reload);assert.match(n.info,/3D 실패 stale\/download 404/);await shot(page,'c-stale-pc');
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(400);const land=await page.evaluate(()=>{const h=document.querySelector('#cs-3d'),r=e=>e.getBoundingClientRect(),st=r(h.querySelector('.cs-3d-status')),ac=r(h.querySelector('.cs-3d-acts')),stage=r(h);return {st:[st.left,st.top,st.right,st.bottom],ac:[ac.left,ac.top,ac.right,ac.bottom],stage:[stage.left,stage.top,stage.right,stage.bottom],cls:document.documentElement.className};});
  assert.ok(land.ac[1]>=land.st[3]-1,'가로 화면: 버튼은 안내 상자 아래(겹치지 않음) '+JSON.stringify(land));assert.ok(land.ac[3]<=land.stage[3]+1&&land.ac[2]<=land.stage[2]+1,'가로 화면: 버튼이 경기장 안');
  assert.ok((land.st[2]-land.st[0])<(land.stage[2]-land.stage[0])*.5,'가로 화면: 안내 상자는 작게');await shot(page,'c-stale-landscape');
  /* 새로고침은 저장 후 페이지를 다시 연다 */const nav=page.waitForEvent('framenavigated');await page.locator('[data-a="castReload3d"]').click();await nav;console.log('c) 404 → 새로고침 권장·버튼, 새 배포 감지 → 새 버전 안내·가로 작은 상자 통과');await ctx.close();}

 /* (d) 지연 로드 3D 프로그램(assets/app/match3d.*.js) 404: 같은 분류·새로고침 버튼 */
 {const {ctx,page}=await open({width:1366,height:768},page=>page.route('**/assets/app/match3d.*.js*',r=>r.fulfill({status:404,body:'missing'})));
  await cast(page);await waitFail(page);const n=await notice(page);
  assert.match(n.text,/받지 못했습니다.*응답 404/,n.text);assert.equal(n.fail,'http');assert.equal(n.rec.stage,'bundle');assert.ok(n.reload&&n.retry);console.log('d) 3D 프로그램 404 → 이유·새로고침 통과');await ctx.close();}
 assert.deepEqual(errors,[]);console.log('3D 실패 이유 안내 점검 통과');
 }finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
