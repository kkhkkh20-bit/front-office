/* 카페 11-18 미래 지명권: 트레이드 화면에서 다음·그다음 드래프트 지명권을 연도별로 고르고, 고른 지명권이 '(구단) 연도 N라운드'로 보이며, PC는 화면 스크롤 없이·휴대폰 390px은 가로 넘침 없이 보인다.
   구단 정보 창에도 받은·넘긴 지명권이 보인다. 사용: node tools/check-pick-trade-ui-1118.cjs (CHROMIUM_EXECUTABLE_PATH로 브라우저 지정) */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{buildSite}=require('./build-site.cjs'),{startSiteServer}=require('./lib/site-server.cjs');
(async()=>{const root=process.env.REVIEW_ROOT||path.resolve(__dirname,'..');buildSite({root});const server=await startSiteServer(path.join(root,'site'));let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function');
 const setup=()=>p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;
   const o=G.teams.find(t=>t.id!==G.user).id; const me=domestic(G.user).find(x=>!x.ys&&!x.foreign); window._pkO=o; window._pkMe=me.id; A.go('trade:table'); return {o,y:pkYear()};});
 const info=await setup(); await p.waitForTimeout(800);
 for(const [width,height] of [[1920,1080],[1366,768],[390,844]]){ await p.setViewportSize({width,height}); await p.waitForTimeout(250); await p.evaluate(()=>{ if(UI.trade.tid!==_pkO)UI.trade={tid:_pkO,give:[_pkMe],get:[],msg:'',seg:'bat',side:'get',sort:'cur'}; UI.trade.stage=innerWidth<700?'review':undefined; render(); }); await p.waitForTimeout(120);
  const y1=info.y+1; const btn=p.locator(`button[data-a="pkT"][data-v="get:1:${info.o}:${y1}"]`); assert.equal(await btn.count(),1,width+': 그다음 드래프트 상대 1라운드 칩이 없음');
  assert.ok(await p.locator(`button[data-a="pkT"][data-v="give:1:${await p.evaluate(()=>G.user)}"]`).count()===1,width+': 다음 드래프트 우리 1라운드 칩이 없음');
  const yl=await p.locator('.pk-y .small').allInnerTexts(); assert.ok(yl.includes(String(info.y))&&yl.includes(String(y1)),width+': 연도 구분이 없음 '+yl);
  if(!(await btn.getAttribute('class')||'').includes('on')){ await btn.scrollIntoViewIfNeeded(); await btn.click(); await p.waitForTimeout(120); }
  const txt=await p.locator('.tcash').allInnerTexts(); const want=await p.evaluate(([o,y])=>tshort(o)+' '+y+' 1라운드',[info.o,y1]); assert.ok(txt.join(' ').includes(want),width+': 고른 지명권 표시 없음 '+want);
  const m=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,sh:document.documentElement.scrollHeight,ch:document.documentElement.clientHeight,bw:document.body.scrollWidth}));
  assert.ok(m.sw<=m.cw+1&&m.bw<=m.cw+1,width+': 가로 넘침 '+JSON.stringify(m)); if(width>=1024)assert.ok(m.sh<=m.ch+1,width+': PC 화면 스크롤 '+JSON.stringify(m));
  const chipOver=await p.locator('.pk-y').evaluateAll(L=>L.filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).length); assert.equal(chipOver,0,width+': 지명권 줄이 화면 밖');
 }
 await p.evaluate(()=>{ pkSet('1:'+_pkO+':'+(pkYear()+1),G.user); });
 const sum=await p.evaluate(()=>pkSummary(_pkO)+' | '+pkSummary(G.user)); assert.ok(/넘김 .+ 1라운드\(→/.test(sum)&&/받음 .+ 1라운드/.test(sum),'구단 지명권 요약 '+sum); assert.ok(await p.evaluate(()=>teamSheet(_pkO).includes('신인 지명권')&&teamSheet(_pkO).includes(pkYear()+1+' 1라운드')),'구단 정보 창에 지명권 없음');
 assert.deepEqual(errors,[],'페이지 오류');
 console.log('지명권 트레이드 화면 점검: 1920·1366·390 통과 ('+sum+')');
}finally{ if(browser)await browser.close(); server.close(); } })().catch(e=>{ console.error(e); process.exit(1); });
