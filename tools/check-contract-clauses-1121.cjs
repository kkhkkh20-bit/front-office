/* 조항 점검 11-21: 다년계약 약속 탭의 포스팅 허용 조항, 트레이드 화면의 '끝나는 약속 / 이어지는 조항', 선수 상세의 계약 조항 줄.
   PC 1366 페이지 세로 스크롤 없음 · 폰 390 가로 넘침 없음 */
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
const p=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;
  G.day=G.cal.open+40;const L=domestic(G.user).filter(canExtend).sort((a,b)=>ovr(b)-ovr(a));const q=L[0];q.svc=5;q.faC=false;q.yrs=1;q.age=27;q.mlb=75;delete q.lastFA;delete q.ovsY;delete q.retFrom;q.faN=0;delete q.agentY;window._pid=q.id;
  const r=domestic(G.user).find(z=>z!==q&&!z.foreign);r.faC=true;r.ext=true;r.yrs=3;r.ctT=G.user;const y=ctSeason();r.ntc=y+2;r.pOut={y:y+1};r.cOpt={y:1,a:r.sal,at:y+2};r.roleProm={k:0,t:'B',until:y+1,l:'주전 보장',from:'ext'};r.postPromise=y+1;r.postPromiseT=G.user;r.postPromiseC=y+1;window._rid=r.id;render();});
const noOverflow=async(tag)=>{const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,w:innerWidth}));assert.ok(o.sw<=o.w+1,`${tag}: 가로 넘침 ${o.sw}>${o.w}`);};
const noPageScroll=async(tag)=>{const s=await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight);assert.ok(s<=1,`${tag}: PC 페이지 세로 스크롤 ${s}`);};
let checks=0;
for(const w of [1366,390]){await p.setViewportSize({width:w,height:w===390?844:768});
  /* 1) 다년계약 협상 약속 탭: 포스팅 허용 조항 */
  await p.evaluate(()=>{closeSheets();ngtOpen('ext',_pid);UI.ngt.tab='prom';render();});await p.waitForSelector('#sheet .sheet.ngt');
  const row=await p.evaluate(()=>{const el=[...document.querySelectorAll('#sheet .ngr')].find(x=>x.textContent.includes('포스팅 허용 조항'));if(!el)return null;const b=el.getBoundingClientRect();return {t:el.textContent,w:b.width,r:b.right,iw:innerWidth};});
  assert.ok(row,w+': 약속 탭에 포스팅 허용 조항 줄이 없음');assert.ok(row.t.includes('거절·연기 불가'),w+': 조항 안내 문구 없음');assert.ok(row.r<=row.iw+1,w+': 조항 줄이 화면 밖으로 나감');checks++;
  await noOverflow(w+' 협상 약속 탭');if(w===1366)await noPageScroll('협상 약속 탭');
  await p.evaluate(()=>{A.ngtClose();closeSheets();render();});
  /* 2) 트레이드 화면: 끝나는 약속 / 이어지는 조항 */
  await p.evaluate(()=>{const tid=G.teams.find(t=>t.id!==G.user).id;const g=domestic(tid).find(z=>!z.foreign);UI.tab='trade';UI.trade={tid,give:[_rid],get:[g.id],msg:'',seg:'bat',side:'give',sort:'cur'};render();});
  const tt=await p.evaluate(()=>{const H=tradeInsight(UI.trade.tid,UI.trade.give,UI.trade.get);return H;});
  assert.ok(tt.includes('새 구단이 잇는 계약 조항')&&tt.includes('트레이드 거부권')&&tt.includes('포스팅 허용'),w+': 트레이드 비교에 이어지는 조항 안내 없음');assert.ok(tt.includes('이적하면 끝나는 약속')&&tt.includes('역할 약속'),w+': 끝나는 약속 안내 없음');checks++;
  await noOverflow(w+' 트레이드');if(w===1366)await noPageScroll('트레이드');
  /* 3) 선수 상세: 계약 조항 줄 */
  await p.evaluate(()=>{UI.tab='home';UI.trade=null;UI.sheet=_rid;render();});await p.waitForTimeout(150);
  const prof=await p.evaluate(()=>document.querySelector('#sheet')?.textContent||'');assert.ok(prof.includes('계약 조항')&&prof.includes('구단 연장 옵션')&&prof.includes('선수 옵트아웃'),w+': 선수 상세에 계약 조항이 없음');checks++;
  await noOverflow(w+' 선수 상세');if(w===1366)await noPageScroll('선수 상세');
  await p.evaluate(()=>{closeSheets();render();});
}
assert.deepEqual(errors,[],'페이지 오류: '+errors.join(' | '));console.log(`계약 조항 화면 점검 통과 (${checks}건)`);}
finally{if(browser)await browser.close();await server.close();}})().catch(e=>{console.error(e);process.exit(1);});
