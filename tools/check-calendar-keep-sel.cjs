/* 달력 고른 날 유지(국사왕 11-18): 7/31을 고르고 '이 날까지 진행'을 눌렀다가 중간(사흘 뒤)에 멈춘 뒤
   오른쪽 위 달력 아이콘·F10(PC)이나 달력 버튼(휴대폰)으로 돌아와도 7/31이 그대로 골라져 있어야 한다. 왼쪽 일정 탭과 같다.
   고른 날이 지났거나 없으면 오늘을 보인다. 390·1366에서 확인하고 가로 넘침·PC 페이지 스크롤이 없는지 본다. */
const assert=require('node:assert/strict'),path=require('node:path');const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(process.env.CALENDAR_HTML||path.join(__dirname,'../index.html')),browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const results=[];
try{for(const [width,height] of [[390,844],[1366,768]]){const pc=width>=1100,c=await browser.newContext({viewport:{width,height},isMobile:!pc,hasTouch:!pc}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(120000);await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function'&&typeof UI!=='undefined'&&UI.title===true,null,{timeout:120000});
  const fx=await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.fOkY=G.year;
    const clear=()=>{G.res=null;G.stops=[];G.evs=[];G.offers=[];for(const m of G.mail){m.read=true;m.closed={text:'확인 완료'};}};G.day=KD(7,1);clear();UI.title=false;
    /* 진행 중 사흘째에 필수 소식으로 멈추게 한다(실제 진행 경로) */const T=KD(7,31),start=G.day;window._kp=processDay;processDay=function(){_kp();G.stops=[];for(const e of G.evs||[])e.done=true;G.offers=[];if(G.day===start+3)stop('연봉','진행 검사: 필수 결정');};
    A.go('cal');A.calDay(String(T));return {T,start};});
  const selOf=()=>p.evaluate(()=>{const e=document.querySelector('.cal-c.sel,.sch-d.sel,tr.sel[data-v]');return e?+e.dataset.v:null;});
  await p.waitForFunction(v=>!!document.querySelector('.cal-c.sel,.sch-d.sel,tr.sel[data-v]'),fx.T,{timeout:60000}).catch(async()=>{throw new Error('선택 칸 없음 '+width+' '+await p.evaluate(()=>JSON.stringify({tab:UI.tab,sel:UI.calSel,ym:UI.calYM,title:UI.title,d:G.day,sheet:!!document.querySelector('.sheet'),cal:!!document.querySelector('.cal-grid,.sch-d'),h:document.body.innerText.slice(0,200)})));});assert.equal(await selOf(),fx.T,'7/31 선택 준비');
  await p.evaluate(v=>A.advTo(String(v)),fx.T);await p.waitForFunction(()=>!UI.advRun,null,{timeout:120000});
  const day=await p.evaluate(()=>G.day);assert.ok(day>fx.start&&day<fx.T,'중간에 멈춤: '+day);
  const back=async how=>{await p.evaluate(()=>{closeSheets();A.tab('home');});
    if(how==='key'){await p.keyboard.press('F10');}else if(how==='icon'){await p.locator('.fm-r [data-a=calOpen]').first().click();}else{await p.evaluate(()=>A.calOpen());}
    await p.waitForFunction(()=>UI.tab==='cal');};
  for(const how of pc?['icon','key']:['btn']){await back(how);assert.equal(await selOf(),fx.T,how+': 진행 목표 7/31이 오늘로 바뀜');}
  /* 왼쪽 일정 탭도 그대로 */await p.evaluate(()=>{A.tab('home');A.tab('cal');});assert.equal(await selOf(),fx.T,'일정 탭');
  /* 고른 날이 지났으면 오늘 */await p.evaluate(v=>{A.calDay(String(G.day-2));},fx.T);await back(pc?'key':'btn');assert.equal(await selOf(),day,'지난 날을 골랐으면 오늘');
  /* 고른 날이 없어도 아직 남은 진행 목표일은 지킨다 */await p.evaluate(()=>{UI.calSel=null;});await back(pc?'icon':'btn');assert.equal(await selOf(),fx.T,'선택이 없으면 진행 목표일');
  await p.evaluate(()=>{UI.calSel=null;UI.calTgt=null;});await back(pc?'key':'btn');assert.equal(await selOf(),day,'아무것도 없으면 오늘');
  const fit=await p.evaluate(()=>({w:document.documentElement.scrollWidth<=innerWidth+2,h:document.scrollingElement.scrollHeight<=innerHeight+2}));assert.ok(fit.w,'가로 넘침');if(pc)assert.ok(fit.h,'PC 페이지 스크롤');
  assert.deepEqual(errors,[]);results.push({width,pass:true});await c.close();}
  console.log(JSON.stringify(results));console.log('달력 고른 날 유지: 통과');
}catch(e){console.error('실패',e.message);process.exitCode=1;}finally{await browser.close();await server.close();}})();
