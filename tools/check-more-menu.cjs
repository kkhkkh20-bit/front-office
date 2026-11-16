/* 선수 화면 위 행동(UI 2단계 2-2)과 ⋯ 더보기 메뉴(2-1): 상황별 대표 동작 1개, 나머지는 ⋯ 안에서 두 번 안에 닿는다.
   메뉴는 aria-haspopup/aria-expanded, 44px 누르는 곳, 바깥 누르기·Esc로 닫힘(선수 화면은 그대로), 화살표로 이동. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'..',process.argv[2]||'index.html'));let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
for(const [width,height,touch] of [[390,844,true],[1366,768,false]]){
 const c=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);
 const fx=await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open+30;UI.title=false;A.go('home');
  const dom=domestic(G.user).filter(q=>!q.isP&&!q.prospect&&canExtend(q)).sort((a,b)=>a.age-b.age);const young=dom[0],ext=dom[dom.length-1];young.svc=0;ext.svc=Math.max(0,faSvc(ext)-1);
  const other=domestic((G.user+1)%10).find(q=>!q.prospect&&!(q.joinY>G.year));return {young:young.id,ext:ext.id,other:other.id,trade:tradeOpen()};});
 assert.ok(fx.trade,'트레이드 기간');
 const bar=width>=1100?'.detail-navigation .detail-acts':'.pf-toolbar .qacts';
 const open=async id=>{await p.evaluate(id=>{closeSheets();A.player(id);},id);await p.waitForTimeout(150);};
 const tap=async loc=>touch?loc.tap():loc.click();
 // 1) 우리 선수(계약 여유): 대표 동작 면담, 나머지는 ⋯
 await open(fx.young);
 assert.equal(await p.locator(bar+' .act-main').innerText(),'면담','우리 선수 대표 동작은 면담');
 assert.equal(await p.locator(bar+' > .btn, '+bar+' > .mmenu').count(),2,'행동 줄은 대표 동작과 ⋯ 두 개');
 const b=p.locator(bar+' .mmenu-b');assert.equal(await b.getAttribute('aria-haspopup'),'menu');assert.equal(await b.getAttribute('aria-expanded'),'false');assert.ok(await b.getAttribute('aria-label'));
 if(touch){for(const s of [bar+' .act-main',bar+' .mmenu-b']){const r=await p.locator(s).boundingBox();assert.ok(r.width>=44&&r.height>=44,s+' 44px '+JSON.stringify(r));}}
 await tap(b);assert.equal(await b.getAttribute('aria-expanded'),'true','열림');assert.ok(await p.locator(bar+' .mmenu-p').isVisible());
 assert.ok(await p.locator(bar+' .mmenu-p').getAttribute('id')===await b.getAttribute('aria-controls'),'aria-controls');
 const labels=await p.locator(bar+' .mmenu-i').allInnerTexts();
 for(const l of ['시장 가치','트레이드 협상','매물 목록에 올리기','트레이드 불가로 지정','연장 협상'])assert.ok(labels.includes(l),'메뉴에 '+l+' / '+labels.join(','));
 assert.ok(!labels.includes('면담'),'대표 동작은 메뉴에 다시 넣지 않음');
 for(const r of await p.locator(bar+' .mmenu-i').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON())))assert.ok(r.height>=44&&r.x>=-1&&r.x+r.width<=width+1&&r.y>=0&&r.y+r.height<=height+1,'항목 44px·화면 안 '+JSON.stringify(r));
 // 키보드: 첫 항목에 초점, 화살표로 이동, Esc는 메뉴만 닫고 초점은 ⋯로
 assert.equal(await p.evaluate(()=>document.activeElement.classList.contains('mmenu-i')),true,'열면 첫 항목 초점');
 await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>document.activeElement.textContent),labels[1]);await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowUp');assert.equal(await p.evaluate(()=>document.activeElement.textContent),labels[labels.length-1],'위 화살표 순환');
 await p.keyboard.press('Escape');assert.equal(await b.getAttribute('aria-expanded'),'false','Esc로 닫힘');assert.equal(await p.evaluate(()=>UI.sheet),fx.young,'Esc는 선수 화면을 닫지 않음');assert.equal(await p.evaluate(()=>document.activeElement.classList.contains('mmenu-b')),true,'초점이 ⋯로 돌아옴');
 await p.keyboard.press('Escape');await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>UI.sheet),null,'메뉴가 닫혀 있으면 Esc는 원래대로 선수 화면을 닫음');
 // 바깥 누르기로 닫힘(휴대폰 바텀시트 바깥 누르기는 아래 버튼을 누르지 않음)
 await open(fx.young);await tap(p.locator(bar+' .mmenu-b'));const tab0=await p.evaluate(()=>UI.ptab||'abil');
 if(touch)await p.touchscreen.tap(width/2,40);else await p.mouse.click(width/2,height-40);
 await p.waitForTimeout(80);assert.equal(await p.locator(bar+' .mmenu-b').getAttribute('aria-expanded'),'false','바깥 누르면 닫힘');assert.equal(await p.evaluate(()=>UI.sheet),fx.young);if(touch)assert.equal(await p.evaluate(()=>UI.ptab||'abil'),tab0);
 // 두 번 안에: ⋯ → 매물 목록에 올리기
 await tap(p.locator(bar+' .mmenu-b'));await tap(p.locator(bar+' .mmenu-i',{hasText:'매물 목록에 올리기'}));await p.waitForTimeout(120);assert.equal(await p.evaluate(id=>!!G.players[id].listed,fx.young),true,'⋯ → 매물 올리기 두 번에');
 await open(fx.young);await tap(p.locator(bar+' .mmenu-b'));await tap(p.locator(bar+' .mmenu-i',{hasText:'트레이드 불가로 지정'}));await p.waitForTimeout(120);assert.equal(await p.evaluate(id=>!!G.players[id].noTrade,fx.young),true,'⋯ → 트레이드 불가 두 번에');
 await open(fx.young);await tap(p.locator(bar+' .mmenu-b'));assert.ok(await p.locator(bar+' .mmenu-i.on',{hasText:'트레이드 불가 해제'}).count(),'지정 상태 표시');await p.keyboard.press('Escape');
 // 2) 계약이 곧 끝나는 선수: 대표 동작 연장 협상, 누르면 관리 탭의 연장 협상
 await open(fx.ext);assert.equal(await p.locator(bar+' .act-main').innerText(),'연장 협상');await tap(p.locator(bar+' .act-main'));await p.waitForTimeout(120);assert.equal(await p.evaluate(()=>UI.ptab),'mgmt');assert.ok(await p.locator('#s-ext').count(),'연장 협상 칸');
 await tap(p.locator(bar+' .mmenu-b'));assert.ok((await p.locator(bar+' .mmenu-i').allInnerTexts()).includes('면담'),'면담은 ⋯ 안');await p.keyboard.press('Escape');
 // 3) 다른 구단 선수: 대표 동작 트레이드 협상, ⋯에 얻을 조건 보기·관심 선수
 await open(fx.other);assert.equal(await p.locator(bar+' .act-main').innerText(),'트레이드 협상');await tap(p.locator(bar+' .mmenu-b'));const o=await p.locator(bar+' .mmenu-i').allInnerTexts();assert.deepEqual(o,['얻을 조건 보기','관심 선수']);
 await tap(p.locator(bar+' .mmenu-i',{hasText:'관심 선수'}));await p.waitForTimeout(100);assert.ok(await p.evaluate(id=>(G.pwatch||[]).includes(id),fx.other),'⋯ → 관심 선수');
 await open(fx.other);await tap(p.locator(bar+' .act-main'));await p.waitForTimeout(150);assert.ok(await p.evaluate(id=>UI.trade&&UI.trade.get.includes(id),fx.other),'트레이드 협상으로 연결');
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'가로 넘침 없음');
 if(process.env.REVIEW_OUT){fs.mkdirSync(process.env.REVIEW_OUT,{recursive:true});await p.screenshot({path:path.join(process.env.REVIEW_OUT,'more-menu-'+width+'.png'),scale:'css'});}
 assert.deepEqual(errors,[]);console.log(width+'×'+height+' 대표 동작(면담·연장 협상·트레이드 협상)·⋯ 메뉴 aria·44px·Esc·바깥 누르기·화살표·두 번 안에 닿기 통과');await c.close();
}
}finally{await browser?.close();await server.close();}console.log('더보기 메뉴 검사 통과');})().catch(e=>{console.error(e.stack);process.exitCode=1;});
