/* 식사·모임 초대 위임(카페 11-17 ddddddd '단장식사 업무권한 넘기기 안생겼네요') 화면 점검.
   PC(1440)·휴대폰(390)에서
   1) 설정 › 업무 권한 탭에 [식사·모임 초대] 줄이 실제로 보이고(숨김·0 크기 아님, 칸 안 스크롤로 닿음) 위임/가져오기 버튼이 있다
   2) 다른 구단 단장의 식사 초대(gmInv) 소식을 열면 '위임하기 · 식사·모임 초대' 버튼이 결정 버튼 옆에 있다
   3) 그 버튼을 누르면 이번 초대는 기본안(정중히 거절)으로 끝나고, 권한 줄이 '비서 담당'으로 바뀌며
   4) 다음 초대는 진행을 멈추지 않고(G.stops에 남지 않음) 비서가 바로 답한다
   사용: node tools/check-meal-deleg-ui.cjs  (index.html 필요: bash build.sh). CHROMIUM_EXECUTABLE_PATH로 브라우저 지정 */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const HTML=process.env.MEAL_HTML||path.join(__dirname,'..','index.html');
const OUT=process.env.MEAL_OUT||'';
(async()=>{ const server=await startHtmlServer(HTML); let browser; try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});
  for(const [w,h] of [[1440,900],[390,844]]){ const mob=w<1100;
    const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:mob,hasTouch:mob}), page=await ctx.newPage(), errors=[];
    page.setDefaultTimeout(15000); page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
    await page.goto(server.url); await page.waitForFunction(()=>typeof newGame==='function');
    await page.evaluate(()=>{ DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); let n=0; while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true; UI.title=false; UI.patchClosed=true; G.auto=G.auto||{}; delete G.auto.inv; G.deleg={}; A.go('cfg:auth'); render(); });
    /* 1) 업무 권한 줄 */
    const row=page.locator('.authi',{hasText:'식사·모임 초대'});
    assert.equal(await row.count(),1,`${w}: 업무 권한에 식사·모임 초대 줄이 없음`);
    await row.scrollIntoViewIfNeeded(); assert.ok(await row.isVisible(),`${w}: 식사·모임 초대 줄이 보이지 않음`);
    const bb=await row.boundingBox(); assert.ok(bb&&bb.height>20&&bb.width>200&&bb.x>=-1&&bb.x+bb.width<=w+2,`${w}: 줄 크기·위치 이상 `+JSON.stringify(bb));
    assert.match(await row.innerText(),/단장 직접/,`${w}: 기본 상태가 단장 직접이 아님`);
    assert.ok(await row.locator('button').count()>=1,`${w}: 권한 줄에 버튼이 없음`);
    if(OUT)await page.screenshot({path:path.join(OUT,`meal-auth-${w}.png`)});
    /* 2) 식사 초대 소식의 위임 버튼 */
    const mid=await page.evaluate(()=>{ const tid=G.teams.find(t=>t.id!==G.user&&t.gm&&!t.gm.interim).id; const e=gmInvite(tid,'meal',false); return e&&e.mid; });
    assert.ok(mid,`${w}: 식사 초대를 만들지 못함`);
    await page.evaluate(m=>{ A.go('inbox'); UI.ibF='all'; render(); A.mailJump(m); render(); },mid);
    const btn=page.locator('button[data-a="handOff"][data-v="inv"]',{hasText:'위임하기 · 식사·모임 초대'}).first();
    await page.waitForTimeout(400); /* 휴대폰은 본문을 연 뒤 한 번 더 그린다: 다시 그린 뒤의 버튼을 본다 */
    await btn.waitFor({state:'visible'}).catch(()=>{}); assert.ok(await btn.isVisible(),`${w}: 식사 초대 소식에 위임하기 버튼이 없음`);
    await page.evaluate(()=>document.querySelector('button[data-a="handOff"][data-v="inv"]').scrollIntoView({block:'center'}));
    const dec=page.locator(`button[data-a="mailAct"][data-v^="${mid}:"]`); assert.ok(await dec.count()>=2&&await dec.first().isVisible(),`${w}: 결정 버튼(식사 자리에 나간다·정중히 거절)이 없음`);
    const same=await page.evaluate(m=>{ const d=document.querySelector(`button[data-a="mailAct"][data-v^="${m}:"]`), h=document.querySelector('button[data-a="handOff"][data-v="inv"]'); return !!(d&&h&&d.closest('.ibm-acts,.ibm-body,.ibm, article, section')===h.closest('.ibm-acts,.ibm-body,.ibm, article, section')); },mid); assert.ok(same,`${w}: 위임 버튼이 결정 버튼과 다른 곳에 있음`);
    if(OUT)await page.screenshot({path:path.join(OUT,`meal-mail-${w}.png`)});
    await page.locator('button[data-a="handOff"][data-v="inv"]').first().click();
    const after=await page.evaluate(m=>{ const e=G.evs.find(x=>x.mid===m); return {done:!!(e&&e.done),pick:e&&e.pick,on:autoOn('inv'),stop:(G.stops||[]).some(x=>x.id===m)}; },mid);
    assert.ok(after.done&&after.pick===1&&after.on&&!after.stop,`${w}: 위임 뒤 이번 초대 처리 이상 `+JSON.stringify(after));
    /* 3) 권한 줄 상태 */
    await page.evaluate(()=>{ A.go('cfg:auth'); render(); });
    assert.match(await page.locator('.authi',{hasText:'식사·모임 초대'}).innerText(),/비서 담당/,`${w}: 위임 뒤 권한 줄이 바뀌지 않음`);
    /* 4) 다음 초대는 진행을 멈추지 않는다 */
    const nx=await page.evaluate(()=>{ const tid=G.teams.filter(t=>t.id!==G.user&&t.gm&&!t.gm.interim)[1].id; const e=gmInvite(tid,'meal',true); return {done:!!(e&&e.done),deleg:!!(e&&e.deleg),stop:(G.stops||[]).some(x=>x.id===(e&&e.mid)),open:gmInvOpen()}; });
    assert.ok(nx.done&&nx.deleg&&!nx.stop&&!nx.open,`${w}: 위임 뒤 새 초대가 진행을 멈춤 `+JSON.stringify(nx));
    const ow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2); assert.ok(ow,`${w}: 가로 넘침`);
    assert.deepEqual(errors,[],`${w}: 페이지 오류`);
    console.log(`PASS meal delegation UI ${w}`); await ctx.close(); }
  console.log('식사·모임 초대 위임: 권한 줄·소식 버튼·위임 뒤 진행 1440/390 통과');
} finally { await browser?.close(); await server.close(); } })().catch(e=>{ console.error(e.stack||e); process.exitCode=1; });
