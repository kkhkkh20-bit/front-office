/* 실제 화면의 글꼴 단계와 표·카드 정렬을 검사한다. */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const p=await browser.newPage(),errors=[],typeFailures=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;});
for(const [width,height]of [[1366,768],[1024,768],[390,844]]){
 await p.setViewportSize({width,height});await p.waitForTimeout(200);
 for(const route of ['home','roster','staff:coach','transfer:foreign','club:fin','inbox','player','pitcher','contract','match']){
  await p.evaluate(route=>{closeSheets();if(route==='player'||route==='pitcher')A.player(domestic(G.user).find(q=>route==='pitcher'?q.isP:!q.isP).id);else if(route==='contract')A.ngtOpen('ext:'+domestic(G.user).find(canExtend).id);else if(route==='match')A.matchOpen();else A.go(route);},route);
  const result=await p.evaluate(()=>{const root=document.querySelector('#sheet .sheet')||document.querySelector('#app'),sizes=new Set([12,13,16,20,24]),bad=[];
   for(const el of root.querySelectorAll('*')){if(el.closest('svg,script,style')||!el.getClientRects().length||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;const r=el.getBoundingClientRect(),s=getComputedStyle(el);if(!r.width||!r.height||r.top>=innerHeight||r.bottom<0||s.visibility==='hidden')continue;if(!sizes.has(parseFloat(s.fontSize)))bad.push([el.tagName,el.className,s.fontSize,el.textContent.slice(0,30)]);}
   const panels=[...root.querySelectorAll('.ws-panels>.ws-panel:not([hidden])')];const top=panels[0]?.getBoundingClientRect().top;
   return {bad,aligned:panels.every(e=>Math.abs(e.getBoundingClientRect().top-top)<1)};
  });if(result.bad.length)typeFailures.push({width,route,bad:result.bad});assert.ok(result.aligned,width+' '+route+' 패널 윗선');
  if(route==='roster'){const aligned=await p.evaluate(()=>{const h=document.querySelector('.roster-list h2'),first=document.querySelector('.roster-list tbody tr:not(.grp) td');return Math.abs(h.getBoundingClientRect().left-(first.getBoundingClientRect().left+parseFloat(getComputedStyle(first).paddingLeft)))<3;});assert.ok(aligned,'선수단 제목과 첫 열 시작점');}
  if(route==='staff:coach'&&width>=700){const lines=await p.evaluate(()=>{const cards=[...document.querySelectorAll('.cgrid>.csl:not(.empty)')].slice(0,2);if(cards.length<2||getComputedStyle(cards[0].parentElement).gridTemplateColumns.split(' ').length<2)return [];return ['.csl-h','.csl-n','.csl-s','.staff-primary-grid','.staff-bio'].filter(selector=>Math.abs(cards[0].querySelector(selector).getBoundingClientRect().top-cards[1].querySelector(selector).getBoundingClientRect().top)>1);});assert.deepEqual(lines,[],'코치 카드 이름·능력·설명 행 정렬');}
 }
 console.log('글꼴 5단계·패널·표·코치 카드 정렬',width,height,'검사 완료');
}assert.deepEqual(typeFailures,[],'공통 글꼴 단계');assert.deepEqual(errors,[]);console.log('전체 글꼴·정렬 검사 통과');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
