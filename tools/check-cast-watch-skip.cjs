/* '3D 중계로 보기'를 눌렀는데 중계 없이 경기만 지나간 제보(카페 11-19, 휴대폰 세로).
   원인: 비로 밀린 경기의 관전 예약이 몇 주 뒤 새 날짜로 옮겨진 채 남아, 누를 때마다 '다음 경기' 대신 그 예약을 요청으로 삼았다.
   다음 경기를 치르고도 예약 날짜의 기록만 찾아 결과를 비워, 화면 없이 다음 경기로 넘어갔다(3D 파일·WebGL과 무관).
   여기서는 사이트판을 390x844로 열고 3D 프로그램 파일을 막은 채(기본 중계로 바뀌어야 한다) 다음을 본다.
   A) 뒤 날짜 예약이 남아 있어도 버튼은 다음 경기를 1회부터 중계하고 예약은 남는다. 3D 파일은 캐시를 피해 한 번 더 받는다.
   B) 고른 경기가 비로 밀리면 그 사이 치른 경기를 화면 없이 넘기지 않고 중계하며 이유를 알린다. 다음에 누르면 다음 경기를 중계한다.
   C) 배포가 바뀌어 해시가 달라졌으면 release.json의 새 파일 이름으로 한 번 다시 받는다.
   D) 중계 화면을 여는 데서 오류가 나도 같은 경기의 문자 중계가 열린다.
   CAPTURE=폴더 를 주면 화면을 PNG로 남긴다. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright'),{buildSite}=require('./build-site.cjs'),{startSiteServer}=require('./lib/site-server.cjs');
const shot=async(page,name)=>{if(process.env.CAPTURE)await page.screenshot({path:path.join(process.env.CAPTURE,name+'.png')});};
(async()=>{const root=path.resolve(__dirname,'..');if(!process.env.SKIP_SITE_BUILD)buildSite({root});const server=await startSiteServer(path.join(root,'site'));let browser;const errors=[];try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 async function open(viewport,setup){const ctx=await browser.newContext({viewport}),page=await ctx.newPage(),bundle=[];
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await page.route('https://www.googletagmanager.com/**',r=>r.fulfill({body:'',contentType:'text/javascript'}));
  page.on('pageerror',e=>errors.push(e.message));
  /* 3D 프로그램 파일은 늘 404: 실제 3D 그리기 없이 '못 받음 → 기본 중계' 길만 본다 */
  await page.route('**/assets/app/match3d.*.js*',r=>{if(r.request().resourceType()==='script')bundle.push(new URL(r.request().url()).pathname+new URL(r.request().url()).search);return r.fulfill({status:404,body:'missing'});});
  if(setup)await setup(page);
  await page.goto(server.url);await page.waitForFunction(()=>typeof newGame==='function'&&typeof A!=='undefined',{},{timeout:120000});
  await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open+2;G.fOkY=G.year;for(const t of G.teams)setEntry(t.id);G.entryY=G.year;G.res=null;G.stops=[];G.evs=[];G.offers=[];G.noRain=true;
   /* 실제 경기 계산은 그대로 쓰고, 무작위 업무 중단만 없앤다(check-match-entry와 같은 방식) */
   const base=processDay;processDay=function(){base();G.stops=[];for(const e of G.evs||[])e.done=true;G.offers=[];};UI.title=false;UI.tab='home';render();});
  return {ctx,page,bundle};}
 const press=async page=>{await page.evaluate(()=>A.matchOpen());const b=page.locator('[data-a="matchWatch"]');await b.waitFor({state:'visible',timeout:60000});await b.click();};
 const state=page=>page.evaluate(()=>{const c=UI.cast,g=c&&G.games[c.g],h=document.querySelector('#cs-3d'),el=document.querySelector('.cast');
  return {day:G.day,cast:!!c,hold:c&&c.hold,gday:g&&g.day,castEl:!!el&&el.getClientRects().length>0,entry:!!document.querySelector('.match-entry'),toast:document.getElementById('toast')?.textContent||'',plan:G.watchPlanned,res:G.res,
   host:h&&{state:h.dataset.state,fail:h.dataset.fail||'',renderer:h.parentElement.dataset.renderer,text:h.querySelector('.cs-3d-status')?.textContent||''},sw:document.documentElement.scrollWidth,sh:document.scrollingElement.scrollHeight,ih:innerHeight,retry:globalThis.__fo3d?.bundleRetry||''};});
 const ours=(page,d0)=>page.evaluate(d0=>G.games.filter(g=>g.day>d0&&(g.home===G.user||g.away===G.user)).map(g=>g.day),d0);
 /* 스크립트 요청 순서: 원래 이름 뒤에 다시 받기가 한 번만 온다(다시 받기가 연달아 오지 않는다). 중계 화면이 소리 등으로 다시 시도해도 시도마다 한 번 */
 const once=L=>L.length>=2&&L[1]!==L[0]&&L.every((u,i)=>u===L[0]||(i>0&&L[i-1]===L[0]));
 const waitFallback=page=>page.waitForFunction(()=>{const h=document.querySelector('#cs-3d');return h?.dataset.state==='fallback'&&h.dataset.fail&&!h.dataset.bg;},{},{timeout:90000});

 /* A) 뒤 날짜로 옮겨진 관전 예약이 남아 있는 저장(제보 상황): 버튼은 다음 경기를 중계한다 */
 {const {ctx,page,bundle}=await open({width:390,height:844});
  const pre=await page.evaluate(()=>{const N=nextGames(10),later=N.find(x=>x.d>N[0].d+3);G.watchPlanned=gmWatchBooking(later);return {d0:G.day,next:N[0].d,later:later.d,live:gmPlanLive(later.d,G.watchPlanned),blk:blocker()};});
  assert.ok(pre.live&&!pre.blk,'준비: 뒤 날짜 예약이 유효하고 진행을 막는 일이 없음 '+JSON.stringify(pre));
  await press(page);let s=await state(page);const played=await ours(page,pre.d0);
  assert.deepEqual(played,[pre.next],'누른 뒤 치른 우리 경기는 다음 경기 하나');
  assert.ok(s.cast&&s.castEl&&!s.entry,'중계 화면이 열린다(경기만 치르고 홈으로 넘어가지 않음) '+JSON.stringify(s));
  assert.equal(s.gday,pre.next,'다음 경기를 중계');assert.ok(s.hold,'결과를 숨긴 채(hold) 1회부터');
  assert.equal(s.plan&&s.plan.day,pre.later,'뒤 날짜 예약은 그대로 남는다');
  await waitFallback(page);s=await state(page);
  assert.equal(s.host.renderer,'fallback');assert.match(s.host.text,/기본 중계로 표시 중/,'3D를 못 받은 이유와 기본 중계 안내: '+s.host.text);
  assert.ok(once(bundle),'3D 프로그램 파일은 받기 시도마다 한 번만 다시 받는다 '+JSON.stringify(bundle));assert.match(bundle[1],/\?r=\d+$/,'같은 배포면 캐시를 피해 다시 받는다');assert.equal(s.retry,'same');
  assert.ok(s.cast&&s.gday===pre.next,'3D 실패 뒤에도 같은 경기 중계가 이어진다');assert.ok(s.sw<=390,'390px에서 가로로 넘치지 않음 '+s.sw);await shot(page,'a-phone-fallback');
  console.log('A) 뒤 날짜 예약이 남아 있어도 다음 경기 중계 · 3D 파일 실패 → 한 번 다시 받고 기본 중계 통과');await ctx.close();}

 /* B) 고른 경기가 비로 밀림(중요 소식 외 멈춤은 기본 꺼짐): 그 사이 치른 경기를 중계하고 이유를 알린다. 예약은 새 날짜로 */
 {const {ctx,page}=await open({width:390,height:844});
  const pre=await page.evaluate(()=>{G.noRain=false;const N=nextGames(1)[0],h=N.home?G.user:N.op,D=N.d;rainOut=(home,day)=>day===D&&home===h;return {d0:G.day,next:D,blk:blocker(),info:stopOn({kind:'일정'})};});
  assert.ok(!pre.blk&&!pre.info,'준비 '+JSON.stringify(pre));
  await press(page);let s=await state(page);let played=await ours(page,pre.d0);
  assert.equal(played.length,1,'누른 뒤 치른 우리 경기는 하나 '+JSON.stringify(played));assert.ok(played[0]>pre.next,'고른 날 경기는 비로 열리지 않음');
  assert.ok(s.cast&&s.castEl,'치른 경기를 화면 없이 넘기지 않는다 '+JSON.stringify(s));assert.equal(s.gday,played[0],'방금 치른 경기를 중계');assert.ok(s.hold);
  assert.match(s.toast,/미뤄져.*1회부터 중계합니다/,'이유 안내: '+s.toast);assert.ok(s.plan&&s.plan.day>s.day,'밀린 경기의 관전 예약은 새 날짜로 남는다 '+JSON.stringify(s.plan));
  assert.ok(s.sw<=390,'390px에서 가로로 넘치지 않음 '+s.sw);await shot(page,'b-phone-rain');
  const moved=s.plan.day,d1=s.day,nx=await page.evaluate(()=>{A.castClose(true);rainOut=()=>false;return nextGames(1)[0].d;});
  await press(page);s=await state(page);played=await ours(page,d1);
  assert.deepEqual(played,[nx],'다음에 누르면 다음 경기 하나만');assert.ok(s.cast&&s.gday===nx,'다음 경기를 중계(옮겨진 예약 날짜의 기록을 찾지 않음) '+JSON.stringify(s));assert.equal(s.plan&&s.plan.day,moved,'옮겨진 예약은 유지');
  console.log('B) 우천 순연 → 치른 경기 중계·이유 안내·예약 유지, 다음 누름은 다음 경기 통과');await ctx.close();}

 /* C) 배포가 바뀌어 3D 프로그램 파일 이름(해시)이 달라짐: release.json의 새 이름으로 한 번 다시 받는다. PC에서 화면이 세로로 넘치지 않는다 */
 {const rel=JSON.parse(fs.readFileSync(path.join(root,'site/release.json'),'utf8')),fresh='assets/app/match3d.000000000000.js';
  const {ctx,page,bundle}=await open({width:1366,height:768},page=>page.route('**/release.json*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...rel,lazy3d:fresh})})));
  const pre=await page.evaluate(()=>({d0:G.day,next:nextGames(1)[0].d}));await press(page);await waitFallback(page);const s=await state(page);
  assert.ok(once(bundle),JSON.stringify(bundle));assert.equal(bundle[0],'/'+rel.lazy3d);assert.equal(bundle[1],'/'+fresh,'새 배포의 파일 이름으로 다시 받는다');assert.equal(s.retry,'new');
  assert.ok(s.cast&&s.gday===pre.next&&s.host.renderer==='fallback','다시 받기도 실패하면 기본 중계 '+JSON.stringify(s));assert.match(s.host.text,/기본 중계로 표시 중/);
  assert.ok(s.sh<=s.ih+1,'PC에서 페이지가 세로로 스크롤되지 않음 '+s.sh+'/'+s.ih);await shot(page,'c-pc-stale');
  console.log('C) 해시가 바뀐 3D 파일 → release.json의 새 이름으로 한 번 다시 받고, 실패하면 기본 중계 통과');await ctx.close();}

 /* D) 중계 화면을 여는 데서 오류: 같은 경기의 문자 중계로 */
 {const {ctx,page}=await open({width:390,height:844});
  const pre=await page.evaluate(()=>{A.cast=()=>{throw new Error('cast open failed (test)');};return {d0:G.day,next:nextGames(1)[0].d};});
  await press(page);const s=await page.evaluate(()=>({game:UI.game,gday:UI.game!=null&&G.games[UI.game]?.day,tab:UI.gtab,pbp:UI.pbp,toast:document.getElementById('toast')?.textContent||'',sheet:!!document.querySelector('#sheet .sheet'),sw:document.documentElement.scrollWidth}));
  assert.equal(s.gday,pre.next,'같은 경기 '+JSON.stringify(s));assert.equal(s.tab,'pbp');assert.equal(s.pbp&&s.pbp.k,0,'1회부터');assert.ok(s.sheet,'문자 중계 창이 열림');assert.match(s.toast,/문자 중계로 보여 드립니다/);assert.ok(s.sw<=390);
  console.log('D) 중계 화면 오류 → 문자 중계 통과');await ctx.close();}
 assert.deepEqual(errors,[]);console.log('3D 중계로 보기: 경기만 지나가는 문제 점검 통과');
 }finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
