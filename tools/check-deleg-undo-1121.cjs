/* 맡긴 일 되돌리기(카페 11-21 야구화이팅: '비서가 처리하기'를 잘못 눌러 1년 동안 감독 요청을 비서가 답했고 되돌리는 곳을 몰랐음) 화면 점검.
   PC(1366)·휴대폰(390)에서
   1) 감독 요청 소식의 '위임하기 · 감독 요청'을 누르면 알림에 되돌릴 곳(설정 › 업무 권한 또는 스태프 화면)이 나온다
   2) 그 소식에 '직접 처리로 되돌리기'가 보이고, 누르면 autoOn('mgr')가 꺼진다
   3) 다시 맡기면 스태프 › 감독 › 지시·요청에 '비서에게 맡긴 일 N개' 카드가 보이고, 감독 관계를 낮춘 기록을 그 줄에 적으며, 가져오기로 꺼진다
   4) 아무것도 맡기지 않았으면 카드는 없다. 가로 넘침·페이지 오류 없음
   사용: node tools/check-deleg-undo-1121.cjs  (index.html 필요: bash build.sh). CHROMIUM_EXECUTABLE_PATH로 브라우저 지정 */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const HTML=process.env.DU_HTML||path.join(__dirname,'..','index.html');
const OUT=process.env.DU_OUT||'';
(async()=>{ const server=await startHtmlServer(HTML); let browser; try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined});
  for(const [w,h] of [[1366,768],[390,844]]){ const mob=w<1100;
    const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:mob,hasTouch:mob}), page=await ctx.newPage(), errors=[];
    page.setDefaultTimeout(15000); page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
    await page.goto(server.url); await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0); await page.waitForFunction(()=>typeof newGame==='function');
    await page.evaluate(()=>{ DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); let n=0; while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true; UI.title=false; UI.patchClosed=true; G.auto={}; G.deleg={}; render(); });
    const noOverflow=async tag=>{ const r=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,sh:document.documentElement.scrollHeight,ih:innerHeight})); assert.ok(r.sw<=r.iw+2,`${w} ${tag}: 가로 넘침 ${JSON.stringify(r)}`); if(!mob)assert.ok(r.sh<=r.ih+2,`${w} ${tag}: PC 페이지 세로 스크롤 ${JSON.stringify(r)}`); };
    /* 4) 맡긴 일이 없으면 카드 없음 */
    await page.evaluate(()=>{ UI.it=Object.assign(UI.it||{},{mgrv:'rel'}); A.go('staff:mgr'); render(); });
    assert.equal(await page.locator('#delegUndo').count(),0,`${w}: 맡긴 일이 없는데 카드가 보임`);
    /* 1) 감독 요청 소식에서 위임 */
    const mid=await page.evaluate(()=>{ mreqMake('draft',{}); const e=G.evs.find(x=>x.k==='mreq'&&!x.done); return e&&e.mid; });
    assert.ok(mid,`${w}: 감독 요청을 만들지 못함`);
    await page.evaluate(m=>{ A.go('inbox'); UI.ibF='all'; render(); A.mailJump(m); render(); },mid);
    await page.waitForTimeout(400);
    const hb=page.locator('button[data-a="handOff"][data-v="mgr"]').first(); await hb.waitFor({state:'visible'}).catch(()=>{});
    assert.ok(await hb.isVisible(),`${w}: 감독 요청 소식에 위임하기 버튼이 없음`);
    await hb.scrollIntoViewIfNeeded(); await hb.click();
    const toast=await page.evaluate(()=>{ const t=document.getElementById('toast'); return t?t.textContent:''; });
    assert.match(toast,/설정 › 업무 권한 또는 스태프 화면에서 되돌릴 수 있습니다/,`${w}: 위임 알림에 되돌릴 곳 안내 없음: ${toast.slice(0,120)}`);
    assert.ok(await page.evaluate(()=>autoOn('mgr')),`${w}: 위임이 켜지지 않음`);
    /* 2) 소식함 되돌리기 */
    await page.evaluate(m=>{ render(); if(!document.querySelector('#m-'+m+' .ibm-undo')){ A.go('inbox'); UI.ibF='all'; render(); A.mailJump(m); render(); } },mid); await page.waitForTimeout(300);
    const ub=page.locator(`#m-${mid} .ibm-undo button[data-a="takeBack"][data-v="mgr"]`);
    await ub.waitFor({state:'visible'}).catch(()=>{}); assert.ok(await ub.isVisible(),`${w}: 처리된 소식에 '직접 처리로 되돌리기'가 없음`);
    assert.match(await ub.innerText(),/직접 처리로 되돌리기/);
    await ub.scrollIntoViewIfNeeded(); if(OUT)await page.screenshot({path:path.join(OUT,`undo-mail-${w}.png`)});
    await noOverflow('소식함'); await page.waitForTimeout(800); await ub.click();
    assert.equal(await page.evaluate(()=>autoOn('mgr')),false,`${w}: 소식함 되돌리기 뒤에도 감독 요청 위임 유지`);
    assert.equal(await page.locator(`#m-${mid} .ibm-undo`).count(),0,`${w}: 되돌린 뒤에도 링크가 남음`);
    /* 3) 스태프 › 감독 카드 */
    await page.evaluate(()=>{ handOff('mgr'); const e=G.evs.find(x=>x.k==='mreq'&&x.deleg&&x.done); e.pick=1; /* 감독 관계를 낮춘 기본안을 비서가 고른 기록 */ UI.it=Object.assign(UI.it||{},{mgrv:'rel'}); A.go('staff:mgr'); render(); });
    const card=page.locator('#delegUndo'); await card.waitFor({state:'visible'}).catch(()=>{});
    assert.ok(await card.isVisible(),`${w}: 스태프 › 감독에 맡긴 일 카드가 없음`);
    const ct=await card.innerText(); assert.match(ct,/비서에게 맡긴 일 1개/,`${w}: 카드 제목 ${ct.slice(0,80)}`); assert.match(ct,/감독 요청/); assert.match(ct,/감독 관계를 낮췄습니다/,`${w}: 감독 관계 악화 안내 없음`);
    assert.equal(await card.locator('button[data-a="go"][data-v="cfg:auth"]').count(),1,`${w}: 업무 권한 링크 없음`);
    const bb=await card.boundingBox(); assert.ok(bb&&bb.x>=-1&&bb.x+bb.width<=w+2,`${w}: 카드 위치 ${JSON.stringify(bb)}`);
    await card.scrollIntoViewIfNeeded(); if(OUT)await page.screenshot({path:path.join(OUT,`undo-staff-${w}.png`)});
    await noOverflow('스태프');
    /* 현재 감독 탭에서도 바로 가는 한 줄 */
    await page.evaluate(()=>{ UI.it.mgrv='cur'; render(); }); assert.ok(await page.locator('.deleg-n').count()===1,`${w}: 현재 감독 탭에 맡긴 일 안내가 없음`); await noOverflow('현재 감독');
    await page.evaluate(()=>{ UI.it.mgrv='rel'; render(); });
    await page.waitForTimeout(800); await page.locator('#delegUndo button[data-a="takeBack"][data-v="mgr"]').click();
    assert.equal(await page.evaluate(()=>autoOn('mgr')),false,`${w}: 스태프 가져오기 뒤에도 위임 유지`);
    assert.equal(await page.locator('#delegUndo').count(),0,`${w}: 모두 가져왔는데 카드가 남음`);
    /* 일상 결정 종류 하나만 맡긴 경우도 같은 카드에서 가져온다 */
    await page.evaluate(()=>{ G.deleg={fan:true}; render(); });
    const fb=page.locator('#delegUndo button[data-a="evTake"][data-v="fan"]'); assert.ok(await fb.isVisible(),`${w}: 일상 결정 종류 줄 없음`); await page.waitForTimeout(800); await fb.click();
    assert.equal(await page.evaluate(()=>evDelegOn('fan')),false,`${w}: 일상 결정 가져오기 실패 `+await page.evaluate(()=>JSON.stringify({d:G.deleg,p:G.evPol,t:document.getElementById('toast')?.textContent,ui:UI.tab})));
    assert.deepEqual(errors,[],`${w}: 페이지 오류`);
    console.log(`PASS deleg undo UI ${w}`); await ctx.close(); }
  console.log('맡긴 일 되돌리기: 위임 알림·소식함 되돌리기·스태프 카드 1366/390 통과');
} finally { await browser?.close(); await server.close(); } })().catch(e=>{ console.error(e.stack||e); process.exitCode=1; });
