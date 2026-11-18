/* 피드백 11-17 연장: 다년계약 요구를 받아들이면 연장 협상 창이 열리고 소식에 협상 버튼이 남는다. 면담 계약 이야기에서 선수가 다년계약에 응하면 '연장 협상 시작' 단추로 협상 창을 연다.
   협상할 수 없는 선수는 이유를 보인다. PC 1366 세로 스크롤 없음 · 폰 390 가로 넘침 없음 */
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
const p=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(server.url);
await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;
  G.day=G.cal.open+40;const L=domestic(G.user).filter(canExtend).sort((a,b)=>ovr(b)-ovr(a));const q=L[0];q.svc=faSvc(q)-1;q.faC=false;q.yrs=1;q.age=30;delete q.agentY;window._pid=q.id;render();});
const noOverflow=async(tag)=>{const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,w:innerWidth}));assert.ok(o.sw<=o.w+1,`${tag}: 가로 넘침 ${o.sw}>${o.w}`);};
/* 1) 연장 요구 결정: 받아들이면 협상 창 */
await p.evaluate(()=>{EVH.agent.make(G.players[_pid]);const e=G.evs.find(x=>x.k==='agent'&&!x.done);window._eid=e.id;A.evPick(e.id+':0');});
await p.waitForSelector('#sheet .sheet.ngt');assert.equal(await p.evaluate(()=>UI.ngt&&UI.ngt.k==='ext'&&UI.ngt.id===_pid),true,'요구를 받아들였는데 연장 협상 창이 아님');
await p.evaluate(()=>{A.ngtClose();});assert.equal(await p.evaluate(()=>UI.sheet===_pid),true,'협상 창을 닫으면 선수 화면으로 돌아와야 함');
await p.evaluate(()=>{closeSheets();const m=G.mail.find(x=>(x.acts||[]).some(a=>a.a==='extNgt'));UI.tab='inbox';UI.ibSel=m.id;UI.ibOpen=m.id;render();window._mid=m.id;});
const btn=p.locator(`#m-${await p.evaluate(()=>_mid)} [data-a="mailAct"]`).filter({hasText:'연장 협상 열기'});assert.equal(await btn.count(),1,'소식에 연장 협상 열기 버튼 없음');await btn.first().click();
await p.waitForSelector('#sheet .sheet.ngt');await p.evaluate(()=>{closeSheets();render();});
/* 2) 면담 계약 이야기 → 연장 협상 시작 */
for(const w of [1366,390]){await p.setViewportSize({width:w,height:w===390?844:768});
  await p.evaluate(()=>{closeSheets();const q=G.players[_pid];initPers(q);q.pers.loy=16;delete q.tk;meetOpen('pl',q.id);meetDo('contract');render();});
  const b=p.locator('.meet-page [data-a="extNgt"]');assert.equal(await b.count(),1,w+': 면담에 연장 협상 시작 버튼 없음');await noOverflow(w+' 면담');
  if(w===1366){const s=await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight);assert.ok(s<=1,'PC 면담 화면 세로 스크롤 '+s);}
  await b.click();await p.waitForSelector('#sheet .sheet.ngt');assert.equal(await p.evaluate(()=>UI.ngt.k==='ext'&&!!UI.meet),true,w+': 면담 위에 협상 창이 열리지 않음');await noOverflow(w+' 협상 창');
  await p.evaluate(()=>A.ngtClose());assert.equal(await p.locator('.meet-page').count(),1,w+': 협상 창을 닫으면 면담으로 돌아와야 함');}
/* 3) 협상할 수 없는 선수: 이유 */
await p.evaluate(()=>{closeSheets();const q=G.players[_pid];q.age=36;delete q.tk;meetOpen('pl',q.id);meetDo('contract');render();});
assert.equal(await p.locator('.meet-page [data-a="extNgt"]').count(),0,'36세에게 연장 협상 버튼');assert.ok((await p.locator('.meet-page .mt-sys').allTextContents()).some(t=>t.includes('34세까지')),'면담에 열 수 없는 이유가 없음');
await p.evaluate(()=>{closeSheets();A.extNgt(_pid);});assert.equal(await p.evaluate(()=>!UI.ngt),true,'열 수 없는 선수에게 협상 창');
assert.deepEqual(errors,[],'페이지 오류: '+errors.join(' | '));console.log('연장 요구·면담 연장 협상 화면 점검 통과');
}finally{if(browser)await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exit(1);});
