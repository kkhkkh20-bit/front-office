/* 첫 시즌 가이드 틀(UI 3단계 3-7, src/ui/components/55_guide_bar.js):
   새 게임 390/1366에서 홈 맨 위 '이번 시즌 할 일' 카드가 잘리지 않고(넘치면 카드 안 스크롤), '하기'로 간 화면에 띠가 하나,
   띠가 진행 버튼을 가리지 않고 덮개·결재창이 아니며, '다음'으로 다음 할 일로 가고, 숨기기로 꺼진다. 홍보·카페 안내는 없다. */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;const errors=[];
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 for(const [w,h] of [[390,844],[1366,768]]){const p=await browser.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
  await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);UI.title=false;UI.tab='home';UI.homePage=0;render();});await p.waitForTimeout(200);
  const card=await p.evaluate(()=>{const c=document.querySelector('#app .hw-start');if(!c)return null;const panels=[...document.querySelectorAll('#app .home-workspace .hw-panel')].filter(e=>e.getClientRects().length);const ov=getComputedStyle(c).overflowY;
   return {first:panels[0]===c,title:c.querySelector('h2').textContent,fits:c.scrollHeight<=c.clientHeight+2,scrolls:/(auto|scroll)/.test(ov),inView:c.getBoundingClientRect().bottom<=innerHeight+1,todo:c.querySelectorAll('[data-a="guideGo"]').length,promo:/카페|홍보|이벤트/.test(c.textContent)};});
  assert.ok(card,w+' 이번 시즌 할 일 카드');assert.ok(card.first,w+' 홈 맨 위 카드');assert.match(card.title,/이번 시즌 할 일/);assert.ok(card.fits||card.scrolls,w+' 카드가 잘리지 않음(넘치면 카드 안 스크롤) '+JSON.stringify(card));assert.ok(card.inView,w+' 카드가 첫 화면 안');assert.ok(card.todo>=2,w+' 할 일 하기 버튼');assert.equal(card.promo,false,w+' 홍보·카페 안내 없음');
  /* 하기 → 띠 */
  const firstK=await p.locator('#app .hw-start [data-a="guideGo"]').first().getAttribute('data-v');await p.locator('#app .hw-start [data-a="guideGo"]').first().click();await p.waitForTimeout(250);
  const bar=await p.evaluate(()=>{const b=[...document.querySelectorAll('#app .guide-bar')];const g=document.querySelector('.goset')||document.querySelector('button.continue');const r=b[0]?.getBoundingClientRect(),q=g?.getBoundingClientRect();
   return {n:b.length,text:b[0]?.innerText||'',tab:UI.tab,overlap:!!(r&&q&&!(r.bottom<=q.top||r.top>=q.bottom||r.right<=q.left||r.left>=q.right)),modal:!!document.querySelector('#cfm .cfm,#sheet .scrim'),promo:/카페|홍보/.test(b[0]?.innerText||''),top:r?Math.round(r.top):null,inView:r?r.bottom<=innerHeight:false};});
  assert.equal(bar.n,1,w+' 도착한 화면에 띠 하나 '+JSON.stringify(bar));assert.ok(bar.inView,w+' 띠가 첫 화면 안');assert.equal(bar.overlap,false,w+' 띠가 진행 버튼을 가리지 않음');assert.equal(bar.modal,false,w+' 덮개·결재창이 아님');assert.equal(bar.promo,false,w+' 띠에 홍보 없음');assert.notEqual(bar.tab,'home',w+' 할 일 화면으로 이동');
  /* 진행을 막지 않는다: 띠가 있어도 진행 버튼은 눌린다 */
  assert.ok(await p.evaluate(()=>{const g=document.querySelector('.goset button.continue,button.continue');return !!g&&!g.disabled;}),w+' 진행 버튼 사용 가능');
  /* 다음 › */
  const next=p.locator('#app .guide-bar [data-a="guideGo"]');if(await next.count()){const nk=await next.getAttribute('data-v');await next.click();await p.waitForTimeout(250);const after=await p.evaluate(()=>({n:document.querySelectorAll('#app .guide-bar').length,k:UI.guide&&UI.guide.k}));assert.equal(after.n,1,w+' 다음 화면에도 띠 하나');assert.equal(after.k,nk);assert.notEqual(nk,firstK);}
  /* 다른 곳으로 가면 띠가 사라진다 */
  await p.evaluate(()=>A.tab('inbox'));await p.waitForTimeout(150);assert.equal(await p.locator('#app .guide-bar').count(),0,w+' 다른 화면에서는 띠 없음');
  /* 숨기기 */
  await p.evaluate(()=>A.tab('home'));await p.waitForTimeout(150);await p.locator('#app .hw-start [data-a="guideOff"]').click();await p.waitForTimeout(150);assert.equal(await p.locator('#app .hw-start').count(),0,w+' 숨기기 뒤 카드 없음');assert.ok(await p.evaluate(()=>G.cfg.guideOff===true));
  await p.evaluate(()=>{A.guideOff('0');});assert.equal(await p.locator('#app .hw-start').count(),1,w+' 설정에서 다시 켜기');
  console.log('첫 시즌 가이드',w,h,'카드·띠·다음·숨기기 통과');await p.close();}
 assert.deepEqual(errors,[]);console.log('첫 시즌 가이드 점검 통과');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
