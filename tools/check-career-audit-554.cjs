/* #567 제의/계약 일치, #573 실제 두 탭 칭호, #560 야인 후임 양식의 브라우저 회귀. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
async function boot(p){await p.evaluate(()=>{DEMO.on=false;newGame(6);G.gmP={...gpDefault(),name:'검수단장',y0:G.year,d0:G.day,bgDone:true};fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);uiSaveSync();G.tut={done:true,step:99};G.medSet=true;UI.title=false;G.stops=[];UI._clk=null;render();});}
async function reveal(p,selector){await p.evaluate(s=>{workspaceReveal(s);UI._clk=null;},selector);const closed=p.locator('details:not([open]):has('+selector+')>summary');while(await closed.count())await closed.first().click();await p.locator(selector).first().scrollIntoViewIfNeeded();}
(async()=>{const out=process.env.CAREER_AUDIT_OUT||'/tmp/career-audit-554';fs.mkdirSync(out,{recursive:true});const server=await startHtmlServer(path.join(__dirname,'../index.html')),browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'}),errors=[];
const page=async c=>{const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await boot(p);return p;};
try{
  const tabs=await browser.newContext({viewport:{width:1366,height:900}}),a=await page(tabs);
  await a.evaluate(()=>{localStorage.setItem(ACH_KEY,JSON.stringify({u:{dynasty:{at:1},firstYr:{at:2}},champ:{},title:'왕조 설계자'}));_achMem=null;achMeta();A.go('club:ach');});
  const b=await page(tabs);await b.evaluate(()=>A.go('club:ach'));await reveal(b,'[data-a="achTitle"][data-v="첫해의 기적"]');await b.locator('[data-a="achTitle"][data-v="첫해의 기적"]').click();
  await a.evaluate(()=>{achUnlock('fWin');render();});assert.equal(await a.evaluate(()=>JSON.parse(localStorage.getItem(ACH_KEY)).title),'첫해의 기적','옛 탭 업적이 새 탭의 칭호를 덮지 않음');
  await reveal(b,'[data-a="achTitle"][data-v=""]');await b.locator('[data-a="achTitle"][data-v=""]').click();await a.evaluate(()=>{achUnlock('fDebut');render();});assert.equal(await a.evaluate(()=>JSON.parse(localStorage.getItem(ACH_KEY)).title),null,'다른 탭의 표시 해제 유지');
  await reveal(a,'[data-a="achTitle"][data-v="왕조 설계자"]');await a.locator('[data-a="achTitle"][data-v="왕조 설계자"]').click();assert.equal(await a.evaluate(()=>JSON.parse(localStorage.getItem(ACH_KEY)).title),'왕조 설계자','명시적인 새 선택 반영');await a.screenshot({path:path.join(out,'two-tabs-title.png')});console.log('두 실제 탭의 칭호 선택·해제·업적 합집합 통과');await tabs.close();
  for(const [width,height] of [[390,844],[1366,900]]){
    const c=await browser.newContext({viewport:{width,height},isMobile:width<1100,hasTouch:width<1100}),p=await page(c);
    const old=await p.evaluate(()=>{G.day=KD(7,1);G.jobs=[];const tid=G.teams.find(t=>t.id!==G.user).id,j=jobOffer(tid,false,{sal:300,yrs:3}),m=G.mail.find(m=>m.ctx?.jobId===j.id);A.mailJump(m.id);return {id:j.id,mid:m.id,tid,user:G.user};});
    const stale=p.locator('[data-a="mailAct"][data-v="'+old.mid+':0"]');assert.equal(await stale.count(),1,'원래 제안의 실제 수락 버튼');await reveal(p,'[data-a="mailAct"][data-v="'+old.mid+':0"]');
    const next=await p.evaluate(id=>{const j=G.jobs.find(j=>j.id===id);G.day=j.exp+1;jobsDaily();const n=jobOffer(j.tid,false,{sal:195,yrs:2}),m=G.mail.find(m=>m.ctx?.jobId===n.id);UI._clk=null;return {id:n.id,mid:m.id};},old.id);
    /* 상태만 바꾸고 다시 그리지 않아, 사용자가 열어 둔 옛 메일 버튼을 그대로 누른다. */
    await stale.click();assert.equal(await p.evaluate(()=>G.user),old.user,'옛 버튼으로 새 제안 수락 금지');assert.equal(await p.evaluate(id=>G.jobs.find(j=>j.id===id).done,next.id),false,'새 제안은 미결로 유지');
    await p.evaluate(mid=>A.mailJump(mid),next.mid);await reveal(p,'[data-a="mailAct"][data-v="'+next.mid+':0"]');await p.locator('[data-a="mailAct"][data-v="'+next.mid+':0"]').click();assert.match(await p.locator('#cfm').innerText(),/1\.95억[\s\S]*2년/,'확인창은 해당 제안 조건');await p.screenshot({path:path.join(out,width+'-offer-confirm.png')});await p.evaluate(()=>UI._clk=null);await p.locator('#cfm [data-a="cfmOk"]').click();
    const hired=await p.evaluate(()=>({tid:G.user,sal:G.myC.sal,yrs:G.myC.y1-G.myC.y0+1}));assert.deepEqual(hired,{tid:old.tid,sal:195,yrs:2},'화면에 보인 제안과 실제 계약 일치');
    await p.evaluate(()=>{G.day=KD(11,10);resignGM();A.go('me');});await reveal(p,'[data-a="gmSuccAsk"]');await p.locator('[data-a="gmSuccAsk"]').click();await reveal(p,'#gp-name');await p.locator('#gp-name').fill('새단장');await reveal(p,'[data-a="gmSuccGo"]');await p.locator('[data-a="gmSuccGo"]').click();if(await p.locator('#cfm [data-a="cfmOk"]:visible').count()){await p.evaluate(()=>UI._clk=null);await p.locator('#cfm [data-a="cfmOk"]').click();}
    assert.equal(await p.evaluate(()=>G.gmP.name),'새단장');assert.ok(await p.evaluate(()=>!!G.unemp&&G.myC.tid==null),'야인 후임은 소속 구단 없이 시작');await p.evaluate(()=>A.go('me'));assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'가로 넘침 없음');if(width>=1100)assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),'PC 페이지 전체 스크롤 없음');await p.screenshot({path:path.join(out,width+'-unemployed-successor.png'),fullPage:width<1100});console.log(width+' 옛 제안 차단·새 조건 확인/체결·야인 후임 양식 통과');await c.close();
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
