/* 제보 11-15(안드로이드): "새로 시작하고 트레이드 하려는데 버튼이 눌리지 않고, 계속 누르면 소식함이 '보고·보고' 두 칸에 목록이 빈 화면이 된다".
   원인 1: 트레이드 작업안(UI.trade)이 이전 게임 것으로 남아, 새 게임에서 고른 우리 구단이 '상대 구단'이 되면 tradeView가 gmOf(우리 구단)=null에서 오류를 냈다.
   원인 2: 탭을 누르면 closeSheets→renderSheet→workspaceFit이 render보다 먼저 돌며 아직 남은 소식함 화면을 새 탭 기준으로 감쌌다. render가 실패하면 그 감싼 소식함이 그대로 남았다.
   실제 휴대폰 크기·터치로 하단 메뉴 '트레이드'를 눌러 확인한다. */
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),html=require('./build.cjs').build({root,write:false}).html;
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html;charset=utf-8');r.end(html);});
 await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});let browser;
 const out=process.env.TRADE_TAP_OUT||'';if(out)fs.mkdirSync(out,{recursive:true});
 try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
  const ctx=await browser.newContext({viewport:{width:390,height:780},isMobile:true,hasTouch:true}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(8000);await p.route('https://**/*',r=>r.abort());
  await p.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await p.waitForFunction(()=>typeof newGame==='function'&&typeof A==='object');
  const look=()=>p.evaluate(()=>{const main=document.querySelector('#app main.content'),list=document.querySelector('.ibx-list');return {tab:UI.tab,main:main&&main.className,pages:[...document.querySelectorAll('.ws-page')].map(b=>b.textContent),fail:!!document.querySelector('.tab-fail'),partner:!!document.querySelector('.tp-grid'),listShown:!!(list&&!list.closest('[hidden]')&&list.getBoundingClientRect().height>0),rows:list?list.querySelectorAll('[data-a=mailJump]').length:0,toast:(document.getElementById('toast')||{}).textContent||''};});
  const tapTrade=async()=>{await p.locator('nav.bnav button[data-a=tab][data-v=trade]').tap();await p.waitForTimeout(350);};
  const tapInbox=async()=>{await p.locator('nav.bnav button[data-a=tab][data-v=inbox]').tap();await p.waitForTimeout(350);};

  /* 1) 이전 게임에서 X 구단과 협상하던 작업안이 남은 채 '새 게임'으로 X 구단 단장이 된다 */
  const s1=await p.evaluate(()=>{DEMO.on=false;newGame(6);G.tut={done:true,step:99};UI.title=false;UI.patchClosed=true;UI.tab='inbox';render();
   const x=G.teams.find(t=>t.id!==G.user).id,them=playersOf(x)[0],mine=playersOf(G.user)[0];UI.trade={tid:x,give:[mine.id],get:[them.id],msg:'',seg:'bat',side:'get',sort:'cur'};UI.sub=UI.sub||{};UI.sub.trade='table';
   newGame(x);G.tut={done:true,step:99};UI.title=false;UI.tab='inbox';UI._ibFirst=true;render();return {x,user:G.user,tid:UI.trade.tid};});
  assert.equal(s1.user,s1.x);assert.equal(s1.tid,null,'새 게임을 시작하면 이전 게임의 트레이드 작업안을 비워야 한다');
  await tapTrade();let s=await look();if(out)await p.screenshot({path:path.join(out,'after-new-game-trade.png')});
  assert.equal(s.tab,'trade');assert.ok(s.partner,'협상하기 화면에 상대 구단 고르기가 보여야 한다');assert.ok(!s.pages.includes('보고'),'트레이드 화면에 빈 보고 칸: '+s.pages);

  /* 2) 작업안이 어떻게든 우리 구단을 상대로 가리켜도(옛 저장 등) 트레이드 화면은 열린다 */
  await tapInbox();await p.evaluate(()=>{UI.trade.tid=G.user;});await tapTrade();s=await look();
  assert.equal(s.tab,'trade');assert.ok(s.partner&&!s.fail,'상대가 우리 구단인 작업안은 비우고 상대 고르기로 가야 한다');

  /* 3) 화면 하나가 오류를 내도 탭은 반응하고(안내 카드·토스트), 소식함은 감싸이지 않는다 */
  await tapInbox();s=await look();assert.ok(s.listShown&&s.rows>0,'소식함 전체 목록이 보여야 한다');
  await p.evaluate(()=>{window.__tc=tradeCenter;tradeCenter=()=>{throw new TypeError('검수용 오류');};});
  for(let k=0;k<3;k++){await tapTrade();s=await look();assert.equal(s.tab,'trade');assert.ok(s.fail,'오류 안내 카드가 보여야 한다');assert.ok(s.toast.includes('트레이드'),'토스트로 알려야 한다: '+s.toast);assert.ok(!(s.main||'').includes('inbox-workspace'),'소식함 화면이 남으면 안 된다');assert.ok(!s.pages.includes('보고'),'보고 칸이 생기면 안 된다');}
  if(out)await p.screenshot({path:path.join(out,'forced-error-card.png')});
  await p.evaluate(()=>{tradeCenter=window.__tc;});await tapInbox();s=await look();
  assert.equal(s.tab,'inbox');assert.deepEqual(s.pages,[]);assert.ok(s.listShown&&s.rows>0,'오류 뒤 소식함 목록이 비면 안 된다');
  /* 소식함에서 탭을 바꾸는 순간(render 전) 소식함이 새 탭 기준으로 감싸이지 않는다 */
  const wrapped=await p.evaluate(()=>{UI.tab='trade';closeSheets();const m=document.querySelector('#app main.content');const r=m.classList.contains('ws-frame')||!!m.querySelector('.ws-panels');UI.tab='inbox';render();return r;});
  assert.equal(wrapped,false,'탭 전환 중 이전 소식함 화면을 workspaceFit이 감쌌다');

  /* 4) 날짜 진행 중에 누른 버튼은 말없이 무시하지 않고 이유를 알린다 */
  const t4=await p.evaluate(()=>{UI.advRun={};const t0=UI.tab;try{document.querySelector('nav.bnav button[data-a=tab][data-v=trade]').click();return {tab:UI.tab,t0,toast:document.getElementById('toast').textContent};}finally{UI.advRun=null;UI._advTapT=0;}});
  assert.equal(t4.tab,t4.t0);assert.ok(t4.toast.includes('진행 멈추기'),'진행 중 안내 토스트: '+t4.toast);
  assert.ok(errors.filter(m=>m.includes('검수용 오류')).length>=1,'화면 오류는 감추지 않고 다시 던져 기록돼야 한다');
  assert.deepEqual(errors.filter(m=>!m.includes('검수용 오류')),[]);
  console.log('PASS 제보 11-15 트레이드 무반응·소식함 보고 두 칸: 새 게임 작업안 초기화, 우리 구단 상대 방지, 화면 오류 안내, 소식함 감싸기 방지, 진행 중 안내 (390px 터치)');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
