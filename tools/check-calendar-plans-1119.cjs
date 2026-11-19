/* 카페 11-19 '단장 일정' 묶음 네 가지를 390x844(터치)·1440x900에서 확인한다. 화면 사진은 CALPLANS1119_OUT에 남긴다.
   1) 이달 단장 일정 줄마다 '취소': 여러 날 묶음은 결재를 거치고, 하루짜리는 바로 지운다. 다른 일정은 그대로
   2) 취소 범위 '시즌 끝까지': 일괄 취소에서 범위를 바꾸면 다음 달 일정까지 목록에 들어오고 한 번에 지운다
   3) 매주 자동 잡기: 토글을 켜면 앞으로 한 주가 손으로 '한꺼번에' 잡은 것과 똑같이 잡히고, 날이 넘어가면(gmPlanDaily) 다시 채운다. AI 구단 기록은 바뀌지 않는다
   4) 관심 선수(★)가 있는 학교는 방문 고르기·달력 칸·이달 목록에 별표로 보이고 학교 목록 앞에 온다 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const root=path.join(__dirname,'..'),out=process.env.CALPLANS1119_OUT||'/tmp/calendar-plans-1119';
(async()=>{fs.mkdirSync(out,{recursive:true});
const server=await startHtmlServer(process.env.CALENDAR_HTML||path.join(root,'index.html')),browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
try{for(const [width,height] of [[390,844],[1440,900]]){const mob=width<1100,c=await browser.newContext({viewport:{width,height},isMobile:mob,hasTouch:mob}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
const hit=async sel=>{const l=p.locator(sel).first();if(mob)await l.tap();else await l.click();};
const into=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'center'});},sel);
const shot=n=>p.screenshot({path:path.join(out,`${width}-${n}.png`)});
const noOver=async w=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),w+': 가로 넘침 없음');
const noPageScroll=async w=>{if(!mob)assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),w+': PC 페이지 스크롤 없음');};
const inView=async(sel,w)=>{for(const r of await p.locator(sel).evaluateAll(L=>L.filter(e=>e.offsetParent).map(e=>{const b=e.getBoundingClientRect();return {x:b.x,w:b.width,h:b.height};}))){assert.ok(r.x>=0&&r.x+r.w<=width+1,`${w}: 화면 안 ${JSON.stringify(r)}`);if(mob)assert.ok(r.h>=36,`${w}: 높이 ${r.h}`);}};
const tapAuto=async v=>{await p.evaluate(()=>{const t=document.getElementById('toast');if(t)t.classList.remove('on');});await into(`.gpl-auto [data-a="gmAuto"][data-v="${v}"]`);await hit(`.gpl-auto [data-a="gmAuto"][data-v="${v}"]`);await p.waitForTimeout(700);}; /* 앞 토글의 알림 띠가 다음 단추를 덮지 않게 */
const openList=async()=>{await p.evaluate(()=>{UI.calYM={y:G.year,m:8};A.go('cal');});if(mob){const tab=p.locator('button:not(.gpl-mr)',{hasText:/8월 단장 일정|이번 달 단장 일정/}).first();if(await tab.count())await tab.tap();}await p.locator('.gpl-mon').waitFor({state:'visible'});};
/* 준비: 7/31, 영남 출장 8/1~8/16, 관심 선수가 있는 영남 학교 방문 8/19, 2군 전 경기 관전 8월, 9월에도 수도권 출장(시즌 끝까지 범위용) */
const fx=await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.fOkY=G.year;G.day=KD(7,31);G.res=null;G.stops=[];G.evs=[];G.offers=[];for(const m of G.mail){m.read=true;m.closed={text:'확인 완료'};}UI.title=false;
  G.gmPlan={};delete G.gmAuto;const S=gmSchools().filter(s=>s.reg==='영남');const sch=S[S.length-1];/* 이름순 맨 뒤 학교에 관심 선수를 두면 앞으로 오는지 보인다 */const pid=sch.L[0].id;amFollow(pid,true);
  gmPlanBulk(KD(8,16),'영남','upto');gmPlanSet(KD(8,19),'school',sch.n);gmPlanBulk(KD(8,31),'all','fut');for(let d=KD(9,1);d<=KD(9,14);d++)if(gmTourn(d))gmPlanSet(d,'scout','수도권');
  const K=k=>Object.keys(G.gmPlan).map(Number).filter(d=>G.gmPlan[d].k===k).sort((a,b)=>a-b);UI.tab='home';render();
  return {school:sch.n,first:S[0].n,nSch:S.length,watched:[...gplWatchSch()],trip:K('scout').filter(d=>G.gmPlan[d].x==='영남'),trip9:K('scout').filter(d=>G.gmPlan[d].x==='수도권'),fut:K('fut'),follow:obsFollowSet(G.user).has(pid)};});
assert.ok(fx.follow,'관심 선수 등록');assert.deepEqual(fx.watched,[fx.school],'관심 선수가 있는 학교');assert.ok(fx.nSch>=2&&fx.trip.length>=12&&fx.fut.length>0&&fx.trip9.length>0,'일정 준비 '+JSON.stringify(fx));

/* ---- 4) 관심 선수 학교: 방문 고르기에서 별표·맨 앞, 달력 칸·목록에도 별표 ---- */
await p.evaluate(()=>{UI.calYM={y:G.year,m:8};UI.calSel=KD(8,20);UI.gmSchR=null;A.go('cal');});await p.locator('.gpl [data-a="gmSchR"][data-v="영남"]').waitFor({state:'attached'});if(mob){const tab=p.locator('button:not(.gpl-mr)',{hasText:/8월 20일/}).first();if(await tab.count())await tab.tap();} /* 휴대폰은 카드가 탭으로 묶인다 */
{const reg=p.locator('.gpl [data-a="gmSchR"][data-v="영남"]');assert.match(await reg.innerText(),/^★ 영남/,'권역 단추에 별표');await hit('.gpl [data-a="gmSchR"][data-v="영남"]');
  const L=await p.locator('.gpl .gpl-sch').allInnerTexts();assert.equal(L.length,fx.nSch,'영남 학교 목록');assert.equal(L[0],'★ '+fx.school,'관심 선수 학교가 맨 앞에 별표로: '+L.join('|'));assert.ok(!L.slice(1).some(t=>t.startsWith('★')),'다른 학교는 별표 없음');
  assert.equal(await p.locator('.gpl .gpl-sch.watch').count(),1);await into('.gpl .gpl-sch');await inView('.gpl .gpl-sch','학교 단추');await noOver('방문 고르기');await noPageScroll('방문 고르기');await shot('4-watch-school-pick');}
if(mob){const chip=await p.evaluate(d=>document.querySelector('.cal-c[data-v="'+d+'"] .cal-plan')?.textContent,await p.evaluate(()=>KD(8,19)));assert.equal(chip,'★ '+fx.school,'달력 칸 별표');}
await openList();assert.ok(await p.locator('.gpl-mon .gpl-mr',{hasText:'★ '+fx.school+' 방문'}).count()>0,'목록에 별표');

/* ---- 1) 줄마다 취소 ---- */
{const n0=await p.evaluate(()=>Object.keys(G.gmPlan).length);const xs=p.locator('.gpl-mon .gpl-x');assert.equal(await xs.count(),4,'8월 줄마다 취소 단추(출장·방문·2군 관전 둘: 하루짜리와 여러 경기 묶음)');await into('.gpl-mon .gpl-x');await inView('.gpl-mon .gpl-x','줄 취소 단추');await noOver('줄 취소');await noPageScroll('줄 취소');await shot('1-row-cancel');
  await hit('.gpl-mon .gpl-mw:has-text("2군 경기 관전") .gpl-x');await p.locator('#cfm [role="dialog"]').waitFor();assert.match(await p.locator('#cfm [role="dialog"]').innerText(),new RegExp(`2군 경기 관전 · ${fx.fut.length-1}경기 취소`));assert.equal(await p.evaluate(()=>Object.keys(G.gmPlan).length),n0,'결재 전에는 그대로');await shot('1-row-cancel-confirm');
  await hit('#cfm [data-a="cfmOk"]');let K=await p.evaluate(()=>Object.values(G.gmPlan).map(x=>x.k));assert.ok(K.filter(k=>k==='fut').length===1&&K.filter(k=>k==='scout').length===fx.trip.length+fx.trip9.length&&K.includes('school'),'2군 관전 묶음만 지움(하루짜리 관전은 남음): '+K.join(','));
  await hit(`.gpl-mon .gpl-mw:has-text("${fx.school} 방문") .gpl-x`);assert.equal(await p.locator('#cfm [role="dialog"]').count(),0,'하루짜리는 결재 없이');K=await p.evaluate(()=>Object.values(G.gmPlan).map(x=>x.k));assert.ok(!K.includes('school')&&K.length===fx.trip.length+fx.trip9.length+1,'방문만 지움');
  assert.equal(await p.locator('.gpl-mon .gpl-x').count(),2,'남은 줄 둘(출장·하루 관전)');}

/* ---- 2) 취소 범위: 시즌 끝까지 ---- */
{await hit('.gpl-mon [data-a="gplEdit"]');assert.equal(await p.locator('.gpl-mon .gpl-pk').count(),2,'이번 달까지: 8월 출장·하루 관전');const sc=p.locator('.gpl-mon [data-a="gplScope"][data-v="season"]');assert.ok(await sc.isVisible(),'범위 단추');await inView('.gpl-mon [data-a="gplScope"]','범위 단추');
  await hit('.gpl-mon [data-a="gplScope"][data-v="season"]');assert.equal(await p.locator('.gpl-mon .gpl-pk').count(),3,'시즌 끝까지: 9월 수도권 출장도');assert.match(await p.locator('.gpl-mon h2').innerText(),/시즌 끝까지/);
  await hit('.gpl-mon [data-a="gplAll"]');assert.match(await p.locator('.gpl-mon .gpl-go').innerText(),new RegExp(`고른 3건 취소 · ${fx.trip.length+fx.trip9.length+1}일`));await into('.gpl-mon .gpl-go');await noOver('시즌 끝까지');await noPageScroll('시즌 끝까지');await shot('2-season-scope');
  await hit('.gpl-mon .gpl-go');await p.locator('#cfm [role="dialog"]').waitFor();await hit('#cfm [data-a="cfmOk"]');assert.deepEqual(await p.evaluate(()=>Object.keys(G.gmPlan)),[],'시즌 끝까지 모두 지움');assert.equal(await p.locator('.gpl-mon .gpl-pk').count(),0);}

/* ---- 3) 매주 자동 잡기 ---- */
{await p.evaluate(()=>{UI.gplScope=null;});await openList();const ai0=await p.evaluate(()=>JSON.stringify([G.areaVisitT||null,(G.teams||[]).map(t=>t.gm&&t.gm.id)]));
  assert.equal(await p.locator('.gpl-auto .gpl-at.primary').count(),0,'처음엔 모두 꺼짐');await into('.gpl-auto');await inView('.gpl-auto .gpl-at','자동 잡기 단추');
  await tapAuto('sch:영남');const a1=await p.evaluate(()=>({A:G.gmAuto,P:JSON.stringify(G.gmPlan)}));assert.deepEqual(a1.A,{sch:'영남'});
  /* 손으로 '한꺼번에' 잡은 것과 같은지: 같은 날짜에서 같은 함수로 다시 잡아 비교 */
  const man=await p.evaluate(()=>{const keep=G.gmPlan,A=G.gmAuto;G.gmPlan={};delete G.gmAuto;gmPlanBulkSch(G.day+7,'영남');const r=JSON.stringify(G.gmPlan);G.gmPlan=keep;G.gmAuto=A;return r;});assert.equal(a1.P,man,'자동 = 손으로 한꺼번에');assert.ok(Object.keys(JSON.parse(a1.P)).length===1,'한 주에 한 곳');
  await tapAuto('fut:all');await tapAuto('scout:영남');assert.deepEqual(await p.evaluate(()=>G.gmAuto),{sch:'영남',fut:'all',scout:'영남'});assert.equal(await p.locator('.gpl-auto .gpl-at.primary').count(),3,'켜진 단추 셋');
  await into('.gpl-auto');await noOver('자동 잡기');await noPageScroll('자동 잡기');await shot('3-auto-weekly');
  /* 날이 넘어가면(gmPlanDaily) 다음 주가 채워진다. 손으로 한 것과 같은 함수·같은 순서 */
  const day=await p.evaluate(()=>{const P0=JSON.stringify(G.gmPlan);G.day+=3;gmPlanDaily();const P1=JSON.stringify(G.gmPlan);const K=Object.keys(G.gmPlan).map(Number).sort((a,b)=>a-b);
    const keep=G.gmPlan,A=G.gmAuto;G.gmPlan=JSON.parse(P0);delete G.gmAuto;gmPlanBulkSch(G.day+7,'영남');gmPlanBulk(G.day+7,'영남','upto');gmPlanBulkFut(G.day+7,'all');const man=JSON.stringify(G.gmPlan);G.gmPlan=keep;G.gmAuto=A;
    return {grew:P1.length>P0.length,same:P1===man,maxD:K[K.length-1]-G.day,kinds:[...new Set(Object.values(G.gmPlan).map(x=>x.k))].sort()};});
  assert.ok(day.grew&&day.same&&day.maxD<=7,'날이 넘어가면 한 주를 같은 규칙으로 채움 '+JSON.stringify(day));assert.ok(day.kinds.includes('scout')&&day.kinds.includes('school'),'출장·방문이 잡힘 '+day.kinds.join(','));
  assert.equal(await p.evaluate(()=>JSON.stringify([G.areaVisitT||null,(G.teams||[]).map(t=>t.gm&&t.gm.id)])),ai0,'AI 구단 현장 기록은 그대로');
  await openList();await tapAuto('sch:영남');const off=await p.evaluate(()=>({A:G.gmAuto,n:Object.keys(G.gmPlan).length}));assert.deepEqual(off.A,{fut:'all',scout:'영남'},'끄기');assert.ok(off.n>0,'끄면 잡힌 일정은 남는다');
  /* 옛 저장(G.gmAuto 없음)은 아무것도 잡지 않는다 */
  assert.equal(await p.evaluate(()=>{delete G.gmAuto;G.gmPlan={};gmPlanDaily();return Object.keys(G.gmPlan).length;}),0,'설정 없으면 그대로');}
assert.deepEqual(errors,[]);console.log(width+' 줄마다 취소·시즌 끝까지·매주 자동 잡기·관심 선수 학교 통과');await c.close();}}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
