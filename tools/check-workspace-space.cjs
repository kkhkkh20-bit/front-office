/* Every work route, its nested modes and panel pages must leave room for actual content. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright'),{buildSite}=require('./build-site.cjs'),{startSiteServer}=require('./lib/site-server.cjs');
(async()=>{if(process.env.REVIEW_OUT)fs.mkdirSync(process.env.REVIEW_OUT,{recursive:true});buildSite();const server=await startSiteServer(path.resolve(__dirname,'../site'));let browser;const failures=[],errors=[],report=[];
try{browser=await (process.env.WEBKIT?webkit:chromium).launch(process.env.WEBKIT?{}:{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
const p=await browser.newPage({viewport:{width:390,height:664},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);
await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;});
const routes=await p.evaluate(()=>['roster','trade','transfer','staff','league','club','cfg'].flatMap(k=>SUBS[k]?.length?SUBS[k].map(s=>k+':'+s[0]):[k]).concat('me','info','staff:fac','staff:mil','club:stad','club:mkt'));
for(const [width,height]of [[320,568],[390,664],[430,740],[768,1024],[1024,768],[1366,768],[568,320]].filter(([width])=>!process.env.GESTURES_ONLY&&(!process.env.REVIEW_WIDTHS||process.env.REVIEW_WIDTHS.split(',').includes(String(width))))){
 await p.setViewportSize({width,height});await p.waitForTimeout(180);let cases=0;
 for(const route of routes.concat(['market:coach','market:mgr','market:sc','market:an'])){
  const open=()=>p.evaluate(route=>{closeSheets();UI.open={};if(route.startsWith('market:'))A.smkGo(route.split(':')[1]);else A.go(route);},route);
  await open();const modes=await p.locator('.trade-modes button,.itabs button[data-a=itab]').evaluateAll(es=>[...new Set(es.map(e=>e.dataset.v))]);
  for(const mode of [null,...modes]){
   if(mode){await open();await p.evaluate(v=>A.itab(v),mode);}
   const groups=await p.locator('.ws-pages [data-ws-page]').count()||1;
   for(let group=0;group<groups;group++){
    if(groups>1)await p.locator('.ws-pages [data-ws-page="'+String(group)+'"]').click();await p.waitForTimeout(50);
    const inspect=()=>p.evaluate(()=>{const main=document.querySelector('main.content');return {outer:document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2,main:main.clientHeight,overflow:main.scrollHeight>main.clientHeight+2,selectors:[...main.querySelectorAll('.ws-tab-row')].map(el=>({height:el.getBoundingClientRect().height,panel:el.classList.contains('ws-panel')})),panels:[...main.querySelectorAll('.ws-panel:not([hidden])')].map(el=>{const s=el.querySelector('.ws-scroll');return {label:el.querySelector('h2,h3,summary')?.textContent,height:el.clientHeight,body:s?.clientHeight,content:s?.scrollHeight,overflow:el.scrollHeight>el.clientHeight+2};})};});
    const state=await inspect(),label=[width,height,route,mode,group].filter(x=>x!=null).join(' ');
    const bad=state.outer||state.overflow||state.selectors.some(q=>q.height>48||q.panel)||state.panels.some(q=>q.overflow||(q.content>10&&q.body+2<Math.min(120,Math.max(32,(q.height-16)*.5))));
    if(bad){failures.push({label,state});console.log('공간 부족',label,JSON.stringify(state));console.log('공간 진단',JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('.ws-panel:not([hidden])')].map(el=>({bound:!!el._workspaceFit,children:[...el.children].map(e=>({cls:e.className,height:e.clientHeight,open:e.open,flex:getComputedStyle(e).flex})),scroll:el.querySelector(':scope > .ws-scroll')?.className})))));}
    // Expanded filters must scroll within their own box rather than consuming the list.
    const filter=p.locator('.ws-panel:not([hidden]) .ws-filter-controls:not([open])>summary').first();
    if(await filter.isVisible()){await filter.click({timeout:1500});await p.waitForTimeout(50);const expanded=await inspect();if(expanded.overflow||expanded.panels.some(q=>q.content>10&&q.body<Math.min(90,Math.max(30,q.height*.3)))){failures.push({label:label+' filters',state:expanded});console.log('필터 공간 부족',label,JSON.stringify(expanded));}await p.locator('.ws-panel:not([hidden]) .ws-filter-controls[open]>summary').first().click({timeout:1500});await p.waitForTimeout(50);}
    if(process.env.REVIEW_OUT&&(bad||width===390&&['trade:market','trade:block','transfer:fa','transfer:foreign','staff:coach','staff:fac','league:rec','cfg:set'].includes(route)&&!mode&&group===0)){fs.mkdirSync(process.env.REVIEW_OUT,{recursive:true});await p.screenshot({path:path.join(process.env.REVIEW_OUT,label.replace(/[^\w-]+/g,'-')+'.png'),scale:'css'});}
    report.push({label,...state});cases++;
   }
  }
 }
 console.log('화면 공간',width,height,cases,'개 경로·모드·보고 묶음 검사');
}
if(!process.env.WEBKIT){
 await p.setViewportSize({width:390,height:664});await p.waitForTimeout(200);
 for(const route of ['trade:market','transfer:foreign','staff:coach']){
  await p.evaluate(v=>{UI.open={};UI.readingOpen={};UI.it={};UI.workspacePages={};UI.pg={};UI.ff={t:'yb',r:'all',s:'rk'};A.go(v);},route);await p.waitForTimeout(100);
  if(route==='transfer:foreign'){ const h=p.locator('.ws-panel:not([hidden]) .candidate-help>summary'); if(await h.isVisible())await h.click(); } /* 휴대폰(700px 이하)에서는 읽는 법 안내를 숨기는 설계(10_fa_and_patches.css) */
  const list=p.locator('.ws-panel:not([hidden])>.ws-scroll').first(),box=await list.boundingBox();
  const scrollable=await list.evaluate(el=>el.scrollHeight>el.clientHeight+10);assert.ok(scrollable,route+' 실제 터치로 확인할 긴 목록');
  const session=await p.context().newCDPSession(p),x=box.x+box.width*.8,y=box.y+box.height-12;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let step=1;step<=6;step++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*Math.min(22,(box.height-30)/6)}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();await p.waitForTimeout(100);
  assert.ok(await list.evaluate(el=>el.scrollTop>0),route+' 목록 내부에서 실제 스와이프');assert.ok(await p.evaluate(()=>scrollY===0&&document.documentElement.scrollHeight<=innerHeight+2),route+' 전체 페이지로 스크롤 전파 없음');
 }
 console.log('선수 검색·외국인·코치 목록 실제 터치 스크롤 통과');
}
for(const width of [390,1366]){
 await p.setViewportSize({width,height:768});await p.waitForTimeout(180);await p.evaluate(()=>{UI.workspacePages={};A.go('league:nt');});await p.waitForTimeout(100);
 const list=p.locator('.ws-panel:not([hidden])>.ws-scroll, main .fmx .fx-scr:has(table thead)').first(); /* PC는 FM식 배치(.fmx)의 표 스크롤 칸 */
 // A long report fixture exercises the heading after the illustration has scrolled away.
 await list.evaluate(el=>{const body=el.querySelector('table tbody'),row=body.rows[0];while(body.rows.length<30)body.append(row.cloneNode(true));el.scrollTop=600;});
 const heading=await list.evaluate(el=>({top:el.getBoundingClientRect().top,head:el.querySelector('thead th').getBoundingClientRect().top,y:el.scrollTop}));
 assert.ok(heading.y>0&&Math.abs(heading.top-heading.head)<3,width+' 설명 뒤 표 머리글 고정 '+JSON.stringify(heading));
 console.log(width,'소개·그림을 포함한 보고의 표 머리글 고정 통과');
}
if(process.env.REVIEW_OUT)fs.writeFileSync(path.join(process.env.REVIEW_OUT,'space-report.json'),JSON.stringify({report,failures,errors},null,2));assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);console.log('화면 선택 한 줄·목록 공간·필터 펼침·페이지 고정 검사 통과');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
