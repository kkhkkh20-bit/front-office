// Render the real guide/home functions with fixed tasks, then exercise the unchanged UI action contracts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const tasks=[
 {k:'trade',t:'트레이드 마감 전 보강',why:'7월 31일 이후에는 시즌이 끝날 때까지 트레이드할 수 없습니다.',ok:false,go:['goWork','트레이드'],prog:'7월 31일까지',deleg:['tro']},
 {k:'fdl',t:'외국인 교체 마감',why:'8월 15일 전에 확인합니다.',ok:false,go:['goWork','외국인선수'],prog:'8월 15일까지'},
 {k:'draft',t:'신인 드래프트',why:'선수 지명은 단장이 직접 합니다.',ok:false,go:['goWork','신인드래프트'],prog:'9월 16일',deleg:['scout']},
 {k:'ev',t:'결정·요청에 답하기',ok:true,go:['tab','inbox']}
];
let active=new Set(),calls=[],failed=0;
const ctx=vm.createContext({G:{year:2026,startY:2026,day:150,cal:{open:100},tut:{done:true},cfg:{}},UI:{tab:'home'},A:{goWork:v=>calls.push(['goWork',v]),tab:v=>calls.push(['tab',v])},
 AUTO_AREAS:[['sal','국내 연봉 협상'],['fre','외국인 재계약'],['ev','일상 결정'],['mgr','감독 요청'],['scout','스카우트 배치'],['tro','받은 트레이드 제안'],['cvac','코치 빈자리'],['fall','교육리그']],AUTO_OPTIN:new Set(['fall']),AUTO_WHO:{tro:'부단장',scout:'스카우트팀장'},
 autoOn:k=>active.has(k),autoAll:on=>calls.push(['autoAll',on]),handOff:k=>{calls.push(['handOff',k]);return '위임했습니다.';},period:()=> 'season',dmd:d=>'3월 28일',curSub:()=>'',save:()=>{},render:()=>{},toast:()=>{},R:()=>{throw Error('Home display must not consume main RNG');},esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')});
vm.runInContext(read('src/ui/components/55_guide_bar.js'),ctx);
ctx.guideItems=()=>tasks;
const home=read('src/ui/home/06_home_workspace.js');vm.runInContext(home.slice(home.indexOf('function homeStartPanel()'),home.indexOf('function homeWorkspace()')),ctx);
const run=code=>vm.runInContext(code,ctx),test=(name,fn)=>{try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}};
test('Home tasks show action names while keeping their exact destinations and deadlines',()=>{const html=run('homeStartPanel()');
 for(const [key,label] of [['trade','트레이드 열기'],['fdl','외국인 확인'],['draft','드래프트 열기']])assert.match(html,new RegExp('data-a="guideGo" data-v="'+key+'">'+label+'<'));
 assert.doesNotMatch(html,/>하기<|>쉬운 진행<|>쉬운 진행 켜기</);assert.match(html,/7월 31일까지/);assert.match(html,/8월 15일까지/);assert.match(html,/시즌이 끝날 때까지 트레이드할 수 없습니다/);
 run("A.guideGo('trade')");assert.deepEqual(calls.pop(),['goWork','트레이드']);
});
test('Delegation is shown once, with scope and an honest partial state',()=>{const before=JSON.stringify(ctx.G);active=new Set(['sal']);const html=run('homeStartPanel()');
 assert.equal((html.match(/data-a="easyMode"/g)||[]).length,1,'there is one bulk delegation control');assert.match(html,/반복 업무 위임/);assert.match(html,/일부 위임/);assert.match(html,/data-a="easyMode" data-v="1"/);
 assert.ok(html.indexOf('class="hw-easy')<html.indexOf('<ol class="hw-ck"'),'delegation stays before the scrolling task list');
 assert.match(html,/드래프트·FA·외국인 영입·트레이드 협상은 직접/);assert.match(html,/<details[^>]*>\s*<summary[^>]*>위임 범위/);assert.equal(JSON.stringify(ctx.G),before,'display does not alter the game');
 assert.match(html,/data-a="guideDeleg" data-v="trade"/);assert.match(html,/부단장에게 맡기기/);
});
test('Bulk and per-task delegation retain their existing action payloads',()=>{calls=[];run("A.easyMode('1'); A.easyMode('0'); A.guideDeleg('trade')");assert.deepEqual(calls,[['autoAll',true],['autoAll',false],['handOff','tro']]);
 active=new Set(['sal','fre','ev','mgr','scout','tro','cvac']);const html=run('guideEasyLine()');assert.match(html,/켜짐/);assert.match(html,/data-a="easyMode" data-v="0"/);active=new Set();assert.match(run('guideEasyLine()'),/꺼짐/);
});
if(failed)process.exitCode=1;
(async()=>{const {chromium}=require('playwright'),{startSiteServer}=require('./lib/site-server.cjs'),os=require('node:os');const tmp=process.env.HOME_LAYOUT_SITE?null:fs.mkdtempSync(path.join(os.tmpdir(),'front-home-layout-'));const site=process.env.HOME_LAYOUT_SITE||path.join(tmp,'site');if(tmp)require('./build-site.cjs').buildSite({root:path.resolve(__dirname,'..'),out:site});const server=await startSiteServer(path.resolve(site));let browser;
 try{browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
  await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open+50;G.mail=[];G.stops=[];UI.title=false;UI.tab='home';UI.homePage=0;render();});
  for(const [width,height] of [[320,844],[390,844],[768,844],[1366,768]]){await page.setViewportSize({width,height});await page.evaluate(()=>{UI.homePage=0;A.go('home');});await page.waitForTimeout(200);const card=page.locator('.hw-start');await card.evaluate(e=>e.scrollTop=0);const inside=()=>page.evaluate(()=>{const c=document.querySelector('.hw-start'),b=c.querySelector('[data-a="easyMode"]'),r=c.getBoundingClientRect(),q=b.getBoundingClientRect();return q.top>=r.top&&q.bottom<=r.bottom&&q.left>=r.left&&q.right<=r.right;});assert.ok(await inside(),width+' delegation control visible without scrolling');
   const task=card.locator('.hw-ck li.now');assert.ok(await task.count(),width+' current task remains available');const list=card.locator('.hw-ck');assert.deepEqual(await list.evaluate(e=>[...e.children].filter(li=>[...li.children].some(c=>{const a=c.getBoundingClientRect(),b=li.getBoundingClientRect();return a.top<b.top-1||a.bottom>b.bottom+1;})).map(li=>li.textContent.trim().slice(0,40))),[],width+' task contents stay inside their own row');assert.ok(await list.evaluate(e=>/auto|scroll/.test(getComputedStyle(e).overflowY)),width+' tasks have their own scrolling area');const last=list.locator('[data-a="guideGo"]').last();await last.scrollIntoViewIfNeeded();assert.ok(await last.evaluate(e=>{const r=e.getBoundingClientRect(),c=e.closest('.hw-start').getBoundingClientRect(),l=e.closest('.hw-ck').getBoundingClientRect();return r.top>=Math.max(c.top,l.top)&&r.bottom<=Math.min(c.bottom,l.bottom);}),width+' last future task can be reached inside the list');await list.evaluate(e=>e.scrollTop=0);await card.evaluate(e=>e.scrollTop=0);await card.locator('.hw-easy details summary').click();assert.ok(await card.evaluate(e=>/auto|scroll/.test(getComputedStyle(e).overflowY)),width+' expanded scope can scroll in the card');assert.ok(await list.evaluate(e=>getComputedStyle(e).overflowY==='visible'),width+' expanded scope uses one card scrolling area');assert.ok(await card.locator('[data-a="guideGo"][data-v="trade"]').count(),width+' critical task action retained');await card.locator('.hw-easy details summary').click();assert.ok(await inside(),width+' delegation remains visible after closing scope');
   if(process.env.HOME_LAYOUT_SHOTS){fs.mkdirSync(process.env.HOME_LAYOUT_SHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.HOME_LAYOUT_SHOTS,width+'-home.png')});}console.log('PASS Home layout '+width);
  }assert.deepEqual(errors,[],'browser page errors');
 }finally{await browser?.close();await server.close();if(tmp)fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
