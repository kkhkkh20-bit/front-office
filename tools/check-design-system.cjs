/* 실제 화면의 글꼴 단계와 표·카드 정렬을 검사한다. */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const p=await browser.newPage(),errors=[],typeFailures=[],btnFailures=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;});
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
 /* 12px 하한(UI 3단계 3-2): 측정 화면 목록 전체에서 12px 미만 글이 없다(그림 SVG 안 글자와 경기 중계는 3-5에서 따로) */
 for(const route of ['inbox','cal','roster','me','league:stand','league:score','league:rec','league:stat','league:wire','league:nt','league:hist','club:info','club:owner','club:fans','club:spon','club:inv','club:chron','cfg:set','transfer:fa','transfer:draft','transfer:kbo','transfer:contract','trade:market','trade:block','staff:mgr','staff:train','staff:scouts','staff:anl','staff:smkt']){
  await p.evaluate(route=>{closeSheets();A.go(route);},route);
  const tiny=await p.evaluate(()=>{const root=document.querySelector('#sheet .sheet')||document.querySelector('#app'),bad=[];for(const el of root.querySelectorAll('*')){if(el.closest('svg,script,style,.cast,.match-dashboard')||!el.getClientRects().length||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;const r=el.getBoundingClientRect(),s=getComputedStyle(el);if(!r.width||!r.height||s.visibility==='hidden')continue;if(parseFloat(s.fontSize)<12)bad.push([el.tagName,el.className,s.fontSize,el.textContent.trim().slice(0,20)]);}return bad.slice(0,6);});
  if(tiny.length)typeFailures.push({width,route,tiny});
 }
 /* 강조 버튼은 본문·시트마다 하나, 고른 상태(.on)는 채운 색이 아니다(UI 3단계 3-3) */
 for(const route of ['home','me','cfg:set','club:inv','club:fans','staff:scouts','staff:anl','trade:block','league:stat','player','contract']){
  await p.evaluate(route=>{closeSheets();if(route==='player')A.player(domestic(G.user)[0].id);else if(route==='contract')A.ngtOpen('ext:'+domestic(G.user).find(canExtend).id);else A.go(route);},route);
  const b=await p.evaluate(()=>{const root=document.querySelector('#sheet .sheet')||document.querySelector('#app'),vis=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('header.top,.bnav,.fm-top,.fmh,.fm-nav,.fm-side,.fm-subs,.fmbar,.tbar,.talk');
   const prim=[...root.querySelectorAll('.btn.primary')].filter(vis).map(e=>e.innerText.trim().slice(0,16));
   const filled=[...root.querySelectorAll('button.on,.btn.on,.tc-i.on')].filter(e=>vis(e)&&!e.matches('.btn.primary')).filter(e=>{const m=getComputedStyle(e).backgroundColor.match(/rgba?\(([^)]+)\)/);if(!m)return false;const v=m[1].split(',').map(Number);if(v.length>3&&v[3]<.6)return false;return Math.max(...v.slice(0,3))-Math.min(...v.slice(0,3))>60&&Math.max(...v.slice(0,3))>110;}).map(e=>(e.dataset.a||'')+':'+e.innerText.trim().slice(0,12));
   return {prim,filled};});
  if(b.prim.length>1||b.filled.length)btnFailures.push({width,route,...b});
 }
 console.log('글꼴 5단계·패널·표·코치 카드 정렬',width,height,'검사 완료');
}assert.deepEqual(btnFailures,[],'강조 버튼 하나·선택 상태 채움 없음');assert.deepEqual(typeFailures,[],'공통 글꼴 단계');assert.deepEqual(errors,[]);console.log('전체 글꼴·정렬 검사 통과');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
