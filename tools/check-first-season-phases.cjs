/* 첫 시즌 안내 단계(55_guide_bar.js, 사용자 11-17): 시즌 준비 → 정규시즌 → 포스트시즌 → 스토브리그마다 홈 '이번 시즌 할 일' 카드가
   그 단계 할 일을 보여 주고(지금 할 일에 왜·하기·비서에게 맡기기), 비서 안내 소식이 단계마다 한 번 오며 소식함에서 '위임하기'로 맡길 수 있고,
   '쉬운 진행'이 맡길 수 있는 반복 업무를 모두 넘기고, 둘째 해 캠프부터는 카드·소식이 없고, 숨기면 소식도 오지 않는다.
   390·1366에서 페이지가 세로로 넘치지 않는다. 날짜는 직접 옮겨 화면만 본다(경기 진행 없음). */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const SHOT=process.env.GUIDE_SHOTS||'';
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;const errors=[];
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/usr/bin/chromium')});
 for(const [w,h] of [[1366,768],[390,844]]){const p=await browser.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
  await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.medSet=true;UI.title=false;UI.tab='home';UI.homePage=0;save();render();});
  const card=()=>p.evaluate(()=>{const c=document.querySelector('#app .hw-start');const sc=document.scrollingElement;if(!c)return {none:true,pageScroll:sc.scrollHeight>innerHeight+2};const now=c.querySelector('li.now');
   return {title:c.querySelector('h2').textContent,now:now&&now.querySelector('b').textContent,why:now&&!!now.querySelector('.hw-ck-why'),deleg:now&&!!now.querySelector('[data-a="guideDeleg"]'),go:c.querySelectorAll('[data-a="guideGo"]').length,easy:c.querySelectorAll('.hw-easy [data-a="easyMode"]').length===1,inView:c.getBoundingClientRect().top<innerHeight-40,fits:c.scrollHeight<=c.clientHeight+2||/(auto|scroll)/.test(getComputedStyle(c).overflowY),pageScroll:sc.scrollHeight>innerHeight+2};});
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,`phase-${n}-${w}.png`)});};
  const go=async js=>{await p.evaluate(js);await p.evaluate(()=>{UI.tab='home';UI.homePage=0;save();render();});await p.waitForTimeout(150);};
  /* 시즌 준비 */
  let c=await card();assert.match(c.title,/이번 시즌 할 일/);assert.match(c.title,/시즌 준비/);assert.ok(c.easy,w+' 쉬운 진행 줄');assert.equal(c.pageScroll,false,w+' 페이지 세로 넘침(준비)');await shot('pre');
  /* 정규시즌: 결정·요청이 지금 할 일, 비서에게 맡기기 */
  await go(()=>{G.day=G.cal.open+1;});c=await card();assert.match(c.title,/정규시즌/,w+' '+JSON.stringify(c));assert.equal(c.now,'결정·요청에 답하기');assert.ok(c.why&&c.deleg&&c.go>=3,w+' 지금 할 일 설명·맡기기·하기 '+JSON.stringify(c));assert.equal(c.pageScroll,false,w+' 페이지 세로 넘침(시즌)');assert.ok(c.inView&&c.fits);await shot('season');
  const sm=await p.evaluate(()=>G.mail.filter(m=>m.subj==='정규시즌은 이렇게 보내시면 됩니다'));assert.equal(sm.length,1,w+' 개막 안내 소식 한 통');assert.deepEqual(sm[0].auto,['ev','mgr','tro']);
  await p.evaluate(()=>{save();render();});assert.equal(await p.evaluate(()=>G.mail.filter(m=>m.subj==='정규시즌은 이렇게 보내시면 됩니다').length),1,w+' 다시 저장해도 한 통');
  /* 소식함에서 위임하기 버튼 */
  await p.evaluate(id=>{UI.mailFocus=id;A.tab('inbox');},sm[0].id);await p.waitForTimeout(200);
  const ib=await p.evaluate(()=>[...document.querySelectorAll('#app .ibm-acts [data-a]')].map(b=>b.dataset.a+':'+b.dataset.v));assert.ok(ib.includes('handOff:ev')||ib.some(x=>x.startsWith('handOff:')),w+' 소식에 위임하기 '+ib);assert.ok(await p.evaluate(()=>[...document.querySelectorAll('#app .ibm-acts [data-a="mailAct"]')].some(b=>/반복 업무 모두 맡기기/.test(b.textContent))),w+' 소식에 쉬운 진행 켜기');await shot('season-inbox');
  await p.locator('#app .ibm-acts [data-a="handOff"][data-v="ev"]').first().click();assert.ok(await p.evaluate(()=>autoOn('ev')),w+' 소식에서 맡기기');
  /* 홈 카드 '비서에게 맡기기' */
  await go(()=>{});await p.locator('#app .hw-start [data-a="guideDeleg"]').first().click();await p.waitForTimeout(100);assert.ok(await p.evaluate(()=>autoOn('ev')&&autoOn('mgr')),w+' 카드에서 맡기기');
  c=await card();assert.notEqual(c.now,'결정·요청에 답하기',w+' 맡긴 일은 끝으로');
  /* 드래프트 준비 소식(스카우트 배치) */
  await go(()=>{G.day=G.cal.draft-20;});assert.equal(await p.evaluate(()=>G.mail.filter(m=>m.subj==='신인 드래프트 준비').length),1,w+' 드래프트 준비 소식');
  /* 포스트시즌 */
  await go(()=>{G.day=G.cal.end+1;const s=standingsNow().map(x=>x.tid);G.ps={seeds:s.slice(0,5),order:standingsNow(),res:{},round:'wc',done:false};});c=await card();assert.match(c.title,/포스트시즌/,w+' '+JSON.stringify(c));assert.equal(c.pageScroll,false);await shot('post');
  /* 스토브리그: 연봉·재계약 맡기기 */
  await go(()=>{G.ps.done=true;G.day=KD(12,2);G.contract=G.contract&&!G.contract.done?G.contract:{y:G.year,done:false,neg:{},foreignEnd:[],foreignDrop:[]};});c=await card();assert.match(c.title,/스토브리그/,w+' '+JSON.stringify(c));assert.equal(c.pageScroll,false);await shot('off');
  const om=await p.evaluate(()=>G.mail.find(m=>m.subj==='연봉 협상과 재계약은 맡기셔도 됩니다'));assert.ok(om&&om.auto.includes('sal'),w+' 연봉 안내 소식');
  /* 쉬운 진행 */
  await p.locator('#app .hw-start .hw-easy [data-a="easyMode"][data-v="1"]').click();await p.waitForTimeout(100);assert.ok(await p.evaluate(()=>guideEasy()&&G.autoMode==='easy'&&autoOn('sal')&&autoOn('fre')&&autoOn('scout')),w+' 쉬운 진행 켜짐');
  c=await card();assert.ok(c.none||!/연봉/.test(c.now||''),w+' 맡긴 연봉은 할 일에서 빠짐');
  /* 둘째 해 캠프부터는 없음 */
  await go(()=>{G.year++;G.cal=buildCalendar(G.year);G.day=G.cal.camp+1;});c=await card();assert.ok(c.none,w+' 둘째 해에는 카드 없음');const n0=await p.evaluate(()=>G.mail.length);await go(()=>{G.day=G.cal.open+1;});assert.equal(await p.evaluate(()=>G.mail.length),n0,w+' 둘째 해에는 안내 소식 없음');
  console.log('첫 시즌 단계 안내',w,h,'준비·시즌·포스트·스토브·쉬운 진행·둘째 해 통과');await p.close();}
 /* 숨기면 소식도 없음 · 단장 취임(창단 드래프트 없음)도 첫해만 */
 {const p=await browser.newPage({viewport:{width:1366,height:768}});p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
  const r=await p.evaluate(()=>{DEMO.on=false;newGame(3);G.guideY=G.year;UI.title=false;UI.tab='home';G.cfg=G.cfg||{};G.cfg.guideOff=true;G.day=G.cal.open+1;save();render();const a=G.mail.filter(m=>/이렇게 보내시면/.test(m.subj)).length;
   G.cfg.guideOff=false;save();render();const b=G.mail.filter(m=>/이렇게 보내시면/.test(m.subj)).length;G.year++;G.cal=buildCalendar(G.year);G.day=G.cal.camp+2;render();return {a,b,card:!!document.querySelector('#app .hw-start'),on:guideOn()};});
  assert.equal(r.a,0,'숨기면 안내 소식 없음');assert.equal(r.b,1,'다시 켜면 그 단계 소식');assert.equal(r.card,false,'단장 취임 둘째 해 카드 없음');assert.equal(r.on,false);await p.close();}
 assert.deepEqual(errors,[]);console.log('첫 시즌 단계 안내 점검 통과');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
