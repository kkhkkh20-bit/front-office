/* 직원 카드의 실제 능력·보직·면담·관계도와 모바일 동작을 확인한다. */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
const {startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;const errors=[],check=(yes,msg)=>{if(!yes)errors.push(msg);};
try{browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});const page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>errors.push(e.message));await page.goto(server.url,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;render();});
for(const size of [{width:1366,height:768},{width:390,height:844}]){await page.setViewportSize(size);
  for(const [route,kind] of [['staff:coach','coach'],['staff:scouts','scout'],['staff:data','analyst']]){
    await page.evaluate(route=>{closeSheets();A.go(route);},route);await page.waitForTimeout(100);
    const card=page.locator('.staff-bio[data-staff-kind="'+kind+'"]').first();check(await card.count()>0,`${size.width} ${kind} 인물 카드 없음`);if(!await card.count())continue;
    await card.locator('summary').click();await page.waitForTimeout(100);
    const r=await page.evaluate(kind=>{const e=document.querySelector('.staff-bio[data-staff-kind="'+kind+'"]'),s=staffOwned(kind,e.dataset.staffId),P=staffProfile(s,kind);return {pref:e.querySelector('.staff-preference').textContent.includes(staffRoleLabel(kind,P.pref)),mental:e.querySelector('.staff-mental').textContent.includes(String(P.mental.pro)),network:!!e.querySelector('.staff-network'),overflow:document.documentElement.scrollWidth>innerWidth+2};},kind);
    check(r.pref&&r.mental&&r.network&&!r.overflow,`${size.width} ${kind} 보직·멘탈·관계·배치 오류 `+JSON.stringify(r));
    const id=await card.getAttribute('data-staff-id'),before=await page.evaluate(({kind,id})=>staffRel(staffOwned(kind,id),G.user,'gm'),{kind,id});
    const talk=card.locator('[data-a="staffTalk"]').first();if(!await talk.isDisabled()){await talk.click();await page.waitForTimeout(100);const after=await page.evaluate(({kind,id})=>staffRel(staffOwned(kind,id),G.user,'gm'),{kind,id});check(after===before+4,kind+' 면담이 실제 관계에 미반영');}
    if(process.env.CAPTURE)await page.screenshot({path:`/workspace/front-office-staff-${kind}-${size.width}.png`});
  }
  for(const k of ['coach','sc','an']){await page.evaluate(k=>A.smkGo(k),k);check(await page.locator('.staff-bio').count()>0,`${size.width} ${k} 후보 카드 세부 정보 없음`);check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${size.width} ${k} 후보 가로 넘침`);}
}
await page.setViewportSize({width:1366,height:768});const rel=await page.evaluate(()=>{const Gs=relPeople(),F=Gs.flatMap(x=>x[1]),C=Object.values(coachesOf(G.user)).filter(Boolean);return C.every(c=>F.some(x=>x.name===c.name&&x.rel===staffRel(c,G.user,'gm')))&&G.scouts.every(s=>F.some(x=>x.k==='sc:'+s.id))&&anaList().every(s=>F.some(x=>x.k==='an:'+s.id));});check(rel,'관계도에 코치·스카우트·분석원이 연결되지 않음');
await page.evaluate(()=>{A.go('staff:data');const a=anaList()[0];UI._staffTestPref=staffProfile(a,'analyst').pref;UI._staffTestId=a.id;});
const id=await page.evaluate(()=>UI._staffTestId),role=await page.evaluate(()=>{const a=anaList().find(x=>x.id===UI._staffTestId);return Object.keys(AROLE).find(r=>r!==a.role);});await page.locator('select[data-a="anaRole"][data-v="'+id+'"]').selectOption(role);check(await page.evaluate(()=>staffProfile(anaList().find(x=>x.id===UI._staffTestId),'analyst').pref===UI._staffTestPref),'현재 역할 변경으로 희망 보직도 바뀜');
await page.evaluate(()=>A.person('an:'+UI._staffTestId));check(await page.locator('#sheet .staff-mental').count()>0,'분석원 전체 인물 카드의 멘탈 정보 누락');await page.keyboard.press('Escape');
}finally{await browser?.close();await server.close();}
assert.equal(errors.length,0,errors.join('\n'));console.log('직원 카드: 분야 능력·멘탈·희망 보직·면담·관계도·PC/모바일 통과');})().catch(e=>{console.error(e.message);process.exitCode=1;});
