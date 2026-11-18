/* GA 개선안(11-17) 점검: gtag 설정·페이지뷰 한 번 · boot_start/title_view(load_s)/boot_fail · ver · gm_created 시작 옵션 · team_list/team_pick · draft_begin 한 번 · 실제로 바뀐 때만 train_set · 앱 안 브라우저 안내.
   사이트판(site/)을 가짜 주소(https://fronttime.test)로 띄우고 gtag 대신 window.dataLayer를 읽는다(googletagmanager는 빈 스크립트로 막는다).
   자동 점검(navigator.webdriver)·localhost에서는 기록을 보내지 않으므로 둘 다 피한다. 사용: node tools/check-telemetry-1117.cjs [--no-build] */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),site=path.join(root,'site'),HOST='https://fronttime.test';
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.txt':'text/plain'};
const UA={
 chrome:'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
 kakaoAnd:'Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36;KAKAOTALK 2410560',
 wv:'Mozilla/5.0 (Linux; Android 13; SM-A536N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.146 Mobile Safari/537.36',
 kakaoIos:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.8.5',
 naverIos:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NAVER(inapp; search; 2000; 12.6.3; 15PRO)'};
async function open(browser,{ua=UA.chrome,fail=null,mobile=false}={}){
 const ctx=await browser.newContext({userAgent:ua,viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
 await ctx.addInitScript(()=>{ try{ Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false,configurable:true}); }catch(e){} });
 await ctx.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 await ctx.route('https://fonts.gstatic.com/**',r=>r.fulfill({status:404,body:''}));
 await ctx.route('https://www.googletagmanager.com/**',r=>r.fulfill({body:'/* mock */',contentType:'text/javascript'}));
 await ctx.route(HOST+'/**',r=>{ const u=new URL(r.request().url()); let f=decodeURIComponent(u.pathname); if(f.endsWith('/'))f+='index.html'; if(fail&&fail.test(f))return r.fulfill({status:404,body:'not found'});
  const fp=path.join(site,f); if(!fp.startsWith(site)||!fs.existsSync(fp))return r.fulfill({status:404,body:'not found'}); return r.fulfill({body:fs.readFileSync(fp),contentType:TYPES[path.extname(fp)]||'application/octet-stream'}); });
 await ctx.route(/^https?:\/\/(?!fronttime\.test|fonts\.|www\.googletagmanager\.com)/,r=>r.fulfill({status:204,body:''}));
 const page=await ctx.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message)); return {ctx,page,errors}; }
const DL=page=>page.evaluate(()=>(window.dataLayer||[]).map(a=>Array.from(a).map(x=>x instanceof Date?'date':x)));
const evs=(dl,n)=>dl.filter(a=>a[0]==='event'&&a[1]===n).map(a=>a[2]);
const ready=page=>page.waitForFunction(()=>typeof UI!=='undefined'&&UI.title&&!document.getElementById('boot-message'),null,{timeout:60000});
(async()=>{
 if(!process.argv.includes('--no-build')){ const {buildSite}=require('./build-site.cjs'); buildSite({root}); }
 assert.ok(fs.existsSync(path.join(site,'index.html')),'site/index.html 없음: node tools/build-site.cjs 먼저');
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/opt/pw-browsers/chromium',args:['--enable-unsafe-swiftshader']}); const R={};
 try{
  console.error('· 1단계'); /* 1) 일반 Chrome: 첫 페이지 head에서 GA 설정 한 번(js·config·page_view 각 한 번), boot_start, title_view(load_s), 앱 안 안내 없음, ver */
  { const {ctx,page,errors}=await open(browser); await page.goto(HOST+'/'); await ready(page); await page.waitForTimeout(300); let dl=await DL(page);
   const cfg=dl.filter(a=>a[0]==='config'); assert.equal(cfg.length,1,'gtag config는 한 번: '+cfg.length); assert.equal(dl.filter(a=>a[0]==='js').length,1,"gtag('js') 한 번");
   const pv=cfg.filter(a=>!a[2]||a[2].send_page_view!==false).length+evs(dl,'page_view').length; assert.equal(pv,1,'페이지뷰 한 번(config 자동 + page_view 이벤트 합계) '+pv);
   assert.equal(evs(dl,'boot_start').length,1,'boot_start 한 번'); for(const n of ['boot_fail','boot_error','boot_slow','boot_leave'])assert.equal(evs(dl,n).length,0,'성공한 불러오기에 '+n+' 없음');
   assert.equal(dl.findIndex(a=>a[0]==='config'),1,'config가 게임 기록보다 먼저(첫 페이지 head)'); assert.equal(await page.evaluate(()=>document.querySelectorAll('script[src*="googletagmanager"]').length),1,'gtag.js 한 번만 불러옴');
   const ok=evs(dl,'title_view'); assert.equal(ok.length,1,'title_view 한 번'); assert.ok(typeof ok[0].load_s==='number'&&ok[0].load_s>0&&ok[0].load_s<60,'title_view load_s '+ok[0].load_s); assert.match(ok[0].ver,/^0\.\d+-[0-9a-f]{7,8}$/,'ver에 배포 번호 '+ok[0].ver);
   assert.equal(await page.locator('.inapp').count(),0,'일반 Chrome에는 앱 안 안내 없음'); assert.equal(evs(dl,'inapp_notice_shown').length,0);
   R.title_load_s=ok[0].load_s; R.ver=ok[0].ver;
   /* 2) 단장 취임 · 하드 · 쉬운 진행 · 안내 끔 */
   await page.evaluate(()=>{ A.tsGo('mode'); A.sdiff('hard'); A.seasy('1'); A.sguide('0'); A.smode('take'); A.start(3); }); assert.equal(await page.evaluate(()=>UI.sstep+':'+UI.pickT).then(x=>x.split(':')[0]),'prof','단장 만들기 단계'); await page.evaluate(()=>{ UI.gp=UI.gp||gpDefault(); UI.gp.name='점검단장'; const n=document.getElementById('gp-name'); if(n)n.value='점검단장'; A.gpStart(); }); await page.waitForTimeout(200);
   dl=await DL(page); let gc=evs(dl,'gm_created'); assert.equal(gc.length,1,'gm_created 한 번'); assert.deepEqual({mode:gc[0].mode,diff:gc[0].diff,easy:gc[0].easy,guide:gc[0].guide},{mode:'take',diff:'hard',easy:true,guide:false},'gm_created 취임 옵션 '+JSON.stringify(gc[0]));
   assert.ok(!('name' in gc[0])&&!JSON.stringify(gc[0]).includes('점검단장'),'단장 이름은 보내지 않음'); R.gm_take=gc[0];
   const tl=evs(dl,'team_list'), tp=evs(dl,'team_pick'); assert.equal(tl.length,1,'team_list 한 번'); assert.equal(tl[0].mode,'take'); assert.equal(tp.length,1,'team_pick 한 번'); assert.equal(tp[0].pick,3);
   /* 같은 훈련을 두 번 눌러도 train_set 한 번 */
   const t=await page.evaluate(()=>{ const p=playersOf(G.user).find(x=>!x.isP&&x.age<30&&!milServing(x)&&!(x.joinY>G.year)); const k=Object.keys(TRN[trnG(p)])[0]; A.trnSet(p.id+':'+k); A.trnSet(p.id+':'+k); return {id:p.id,k}; });
   dl=await DL(page); assert.equal(evs(dl,'train_set').length,1,'같은 훈련 두 번 → train_set 한 번 '+JSON.stringify(t));
   await page.evaluate(id=>{ A.trnSet(id+':coach'); A.trnSet(id+':coach'); },t.id); dl=await DL(page); assert.equal(evs(dl,'train_set').length,2,'코치진 계획으로 돌리기 한 번만 추가');
   assert.equal(errors.length,0,'페이지 오류: '+errors.join(' | ')); await ctx.close(); }
  console.error('· 3단계'); /* 3) 창단 드래프트 · 보통 · 직접 하기 · 안내 켬 → draft_begin은 실제로 연 한 번만 */
  { const {ctx,page,errors}=await open(browser); await page.goto(HOST+'/'); await ready(page);
   await page.evaluate(()=>{ A.tsGo('mode'); A.smode('fd'); if(UI.world&&UI.world.fdOrd)A.fdPk(1); A.start(5); }); assert.equal(await page.evaluate(()=>UI.sstep+':'+UI.pickT).then(x=>x.split(':')[0]),'prof','단장 만들기 단계'); await page.evaluate(()=>{ UI.gp=UI.gp||gpDefault(); UI.gp.name='점검단장'; const n=document.getElementById('gp-name'); if(n)n.value='점검단장'; A.gpStart(); }); await page.waitForTimeout(200);
   let dl=await DL(page); const gc=evs(dl,'gm_created'); assert.equal(gc.length,1); assert.deepEqual({mode:gc[0].mode,diff:gc[0].diff,easy:gc[0].easy,guide:gc[0].guide},{mode:'fd',diff:'norm',easy:false,guide:true},'gm_created 창단 옵션 '+JSON.stringify(gc[0])); R.gm_fd=gc[0];
   const st=await page.evaluate(()=>{ const w=!!G.fdWait; const m=G.mail.find(x=>(x.acts||[]).some(a=>a.a==='fdBegin')); A.fdBegin(); A.fdBegin(); A.fdBegin(); if(m){ const i=m.acts.findIndex(a=>a.a==='fdBegin'); try{ A.mailAct(m.id+':'+i); }catch(e){} } A.fdBegin(); return {w,fd:!!G.fd,wait:!!G.fdWait}; });
   assert.ok(st.w&&st.fd&&!st.wait,'창단 드래프트 대기→시작 '+JSON.stringify(st)); dl=await DL(page); assert.equal(evs(dl,'draft_begin').length,1,'draft_begin 한 번(반복 눌러도) '+evs(dl,'draft_begin').length); R.draft_begin=1;
   assert.equal(errors.length,0,'페이지 오류: '+errors.join(' | ')); await ctx.close(); }
  console.error('· 4단계'); /* 4) 게임 파일 404 → 실패 화면 + boot_fail(msg에 파일 이름) */
  { const {ctx,page}=await open(browser,{fail:/\/assets\/app\/ui\.[0-9a-f]+\.js$/}); await page.goto(HOST+'/'); await page.locator('#boot-retry').waitFor({state:'visible',timeout:30000}); await page.waitForTimeout(300);
   const dl=await DL(page); const bf=evs(dl,'boot_fail'); assert.equal(bf.length,1,'boot_fail 한 번 '+bf.length); assert.match(bf[0].msg,/^ui 파일 받기 실패/); assert.ok(bf[0].msg.length<=100&&typeof bf[0].load_s==='number');
   assert.equal(evs(dl,'boot_start').length,1,'실패해도 boot_start는 남음'); assert.equal(dl.filter(a=>a[0]==='config').length,1,'GA 설정 한 번'); assert.equal(evs(dl,'title_view').length,0); R.boot_fail=bf[0]; await ctx.close(); }
  console.error('· 5단계'); /* 5) 플레이 기록 끄기면 첫 페이지에서도 GA를 켜지 않는다 */
  { const {ctx,page}=await open(browser); await ctx.addInitScript(()=>{ try{ if(!sessionStorage.getItem('x')){ localStorage.setItem('danjang-meta',JSON.stringify({active:1,slots:{},tele:false})); sessionStorage.setItem('x','1'); } }catch(e){} });
   await page.goto(HOST+'/'); await ready(page); const n=await page.evaluate(()=>({dl:(window.dataLayer||[]).length,s:document.querySelectorAll('script[src*="googletagmanager"]').length})); assert.deepEqual(n,{dl:0,s:0},'기록 끔: GA 없음'); await ctx.close(); }
  console.error('· 6단계'); /* 6) 앱 안 브라우저 안내 */
  for(const [k,ua,app,os] of [['kakaoAnd',UA.kakaoAnd,'kakaotalk','android'],['wv',UA.wv,'webview','android'],['kakaoIos',UA.kakaoIos,'kakaotalk','ios'],['naverIos',UA.naverIos,'naver','ios']]){
   const {ctx,page,errors}=await open(browser,{ua,mobile:true}); await page.goto(HOST+'/'); await ready(page); await page.locator('.inapp').waitFor({timeout:5000}); await page.waitForTimeout(100);
   let dl=await DL(page); const sh=evs(dl,'inapp_notice_shown'); assert.equal(sh.length,1,k+' inapp_notice_shown 한 번'); assert.equal(sh[0].app,app); assert.equal(sh[0].os,os);
   const txt=await page.locator('.inapp').innerText(); assert.match(txt,/앱 안의 브라우저/); assert.match(txt,/Chrome이나 Safari/);
   if(os==='android'){ const href=await page.locator('.inapp a[data-v="chrome"]').getAttribute('href'); assert.equal(href,'intent://fronttime.test/#Intent;scheme=https;package=com.android.chrome;end',k+' intent 링크'); R.intent=href; }
   else { assert.match(txt,/Safari로 열기/); assert.equal(await page.locator('.inapp button[data-v="copy"]').count(),1,'주소 복사 버튼'); await page.locator('.inapp button[data-v="copy"]').click(); await page.waitForTimeout(200); dl=await DL(page); assert.equal(evs(dl,'inapp_notice_click').filter(e=>e.act==='copy'&&e.app===app).length,1,'복사 클릭 기록'); }
   const box=await page.locator('.inapp').boundingBox(); assert.ok(box&&box.x>=0&&box.x+box.width<=391,k+' 안내가 화면 안 '+JSON.stringify(box)); assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'가로 스크롤 없음');
   if(process.env.CAPTURE)await page.screenshot({path:process.env.CAPTURE+'/inapp-'+k+'.png'});
   await page.locator('.inapp button[data-v="close"]').click(); await page.waitForTimeout(100); assert.equal(await page.locator('.inapp').count(),0,'닫기'); dl=await DL(page); assert.equal(evs(dl,'inapp_notice_click').filter(e=>e.act==='close'&&e.app===app).length,1,'닫기 클릭 기록');
   await page.evaluate(()=>{ A.tsGo('mode'); A.tsGo('main'); }); assert.equal(await page.locator('.inapp').count(),0,'닫은 뒤 다시 안 뜸'); assert.equal(await page.locator('[data-a="tsGo"][data-v="mode"]').count(),1,'플레이는 막지 않음');
   assert.equal(errors.length,0,k+' 페이지 오류: '+errors.join(' | ')); await ctx.close(); }
  R.inapp='kakaotalk(android/ios)·webview·naver 표시, chrome 미표시';
  console.log(JSON.stringify(R,null,1)); console.log('텔레메트리 11-17 점검 통과');
 }finally{ await browser.close(); }
})().catch(e=>{ console.error(e.stack||e); process.exitCode=1; });
