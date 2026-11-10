/* 연수의 모바일 진입·신청/환급·사진 배포·의료 기록·이미지 누락 시 동작을 실제 사이트 번들에서 확인한다. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{buildSite}=require('./build-site.cjs'),{startSiteServer}=require('./lib/site-server.cjs');
(async()=>{const root=path.resolve(__dirname,'..'),{release}=buildSite({root});
 const assets=release.files.filter(f=>f.path.startsWith('assets/design-review/2026-11-10/'));
 assert.equal(assets.length,16,'사진 두 크기만 배포, 시안·검수·문서는 제외');assert.ok(assets.every(f=>/photos\/(480|960)\/.+\.webp$/.test(f.path)));
 const server=await startSiteServer(path.join(root,'site'));let browser;
 try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const errors=[];
  for(const width of [1440,1024,390]){const context=await browser.newContext({viewport:{width,height:width===1024?768:width===390?844:900},isMobile:width<1100,hasTouch:width<1100});const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.goto(server.url);
   await page.evaluate(()=>{DEMO.on=false;newGame(1);fdStart();fdAdvance(false);let i=0;while(G.fd&&!G.fd.done&&i++<500)fdAdvance(true);G.tut={done:true,step:99};G.medSet=true;G.day=dnum(G.year,9,15);G.ovs=[];UI.title=false;A.go('staff:train');A.itab('mg_staff_train:dev');});
   const tab=page.locator('[data-a="itab"][data-v="devv:ovs"]');assert.ok(await tab.isVisible(),'해외 연수는 접힌 필터 밖에서 바로 보여야 함');assert.equal(await page.locator('details.ws-filter-controls [data-v="devv:ovs"]').count(),0);await tab.click();
   assert.equal(await page.locator('[data-a="ovsPick"]').count(),5);await page.locator('[data-a="ovsPick"][data-v="us"]').click();
   await page.locator('.ops-hero').evaluate(i=>i.decode());assert.ok(await page.locator('.ovs-detail-body>h3').evaluate(x=>[12,13,16,20,24].includes(parseFloat(getComputedStyle(x).fontSize))),'기존 공통 글꼴 단계 사용');assert.ok((await page.locator('.ovs-facts').innerText()).includes('5,000만'));
   if(width===390){await page.locator('[data-a="ovsList"]').click();assert.equal(await page.locator('.ovs-choice.on').getAttribute('data-v'),'us');await page.locator('.ovs-list').evaluate(x=>x.scrollTop=x.scrollHeight);const y=await page.locator('.ovs-list').evaluate(x=>x.scrollTop);await page.locator('[data-a="ovsPick"][data-v="kac"]').click();await page.locator('[data-a="ovsList"]').click();assert.ok(Math.abs(await page.locator('.ovs-list').evaluate(x=>x.scrollTop)-y)<2,'상세에서 목록으로 돌아와도 읽던 위치 유지');}
   await page.locator('[data-a="ovsPick"][data-v="abl"]').click();const enroll=page.locator('.ovs-candidates [data-a="ovsSet"]').first();assert.ok(await enroll.isVisible(),'실제 참가 조건을 만족하는 추천 선수가 있어야 함');const value=await enroll.getAttribute('data-v'),pid=+value.split(':')[0],before=await page.evaluate(()=>G.spend.dev||0);await enroll.click();
   assert.ok(await page.evaluate(id=>G.ovs.some(x=>x.pid===id&&x.prog==='abl'),pid));assert.equal(await page.evaluate(()=>G.spend.dev),before+30,'신청은 실제 참가비 한 번만 차감');
   await page.waitForTimeout(450);await page.locator(`[data-a="ovsSet"][data-v="${pid}:"]`).click();assert.equal(await page.evaluate(()=>G.ovs.length),0);assert.equal(await page.evaluate(()=>G.spend.dev),before,'취소하면 기존 환급 규칙 사용');
   if(width===390)await page.locator('[data-a="ovsList"]').click();await page.locator('[data-a="itab"][data-v="ovsMode:support"]').click();assert.ok((await page.locator('.ovs-support').innerText()).includes('가을 교육리그'));assert.ok((await page.locator('.ovs-support').innerText()).includes('특수 아카데미'));
   await page.evaluate(()=>{const a=domestic(G.user).filter(p=>p.injOut<=0).slice(0,2);const p=a[0];p.injOut=14;const q=a[1];q.injOut=0;q.injHist=[{y:G.year,d:G.day-15,days:14,bk:G.day-1,k:'ham1'}];A.go('staff:med');});
   await page.locator('.ops-photo').first().evaluate(i=>i.decode());assert.equal(await page.locator('.ops-photo').count(),3);assert.equal(await page.evaluate(()=>medRecentBack().filter(x=>x.x.bk===G.day-1).length),1,'실제 복귀일로 최근 복귀 판정');
   const layout=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,h:innerHeight,sh:document.documentElement.scrollHeight}));assert.ok(layout.sw<=layout.w+1&&layout.sh<=layout.h+1,'외부 페이지가 아닌 패널 내부에서 스크롤');await context.close();
  }
  const page=await browser.newPage();await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>errors.push(e.message));await page.route('**/assets/design-review/**',r=>r.fulfill({status:404,body:'missing'}));await page.goto(server.url);await page.evaluate(()=>{DEMO.on=false;newGame(1);UI.title=false;A.go('staff:train');A.itab('mg_staff_train:dev');A.itab('devv:ovs');});await page.locator('[data-a="ovsPick"][data-v="us"]').click();await page.waitForFunction(()=>document.querySelector('.ops-hero')?.hidden);assert.ok(await page.locator('.ovs-facts').isVisible(),'사진이 없어도 비용·선택은 유지');assert.deepEqual(errors,[]);
  console.log('운영 에셋: 16파일 실제 배포·PC/태블릿/모바일 탭 노출·신청/환급·최근 복귀·내부 스크롤·사진 누락 fallback 통과');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
