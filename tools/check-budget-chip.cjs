/* 예산 여유 칩(카페 11-18 "코치·훈련에 돈 쓸 때 남은 예산이 늘 보이게"): 돈을 쓰는 화면마다 같은 자리에 보이고 눌리는지,
   휴대폰에서는 짧은 꼴('여유 ○억')로 탭 줄 오른쪽 위에 있고 가로로 넘치지 않는지, 코치 영입·코치 연수(창만 다시 그림)·시설 공사 뒤 다시 불러오지 않아도 바로 바뀌는지 본다. */
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const SCREENS=['staff:coach','staff:train','staff:smkt','staff:scouts','staff:data','staff:med','club:inv','club:fin','club:spon','roster:depth','roster:list','transfer:fa','transfer:foreign','transfer:contract','trade:market','trade:block'];
const SIZES=[[1600,900],[1366,768],[1024,768],[390,844]];
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let b;const errors=[];
try{b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});const p=await b.newPage({viewport:{width:1366,height:768}});p.on('pageerror',e=>errors.push(e.message));await p.goto(server.url);
await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;A.go('home');});
const go=s=>p.evaluate(s=>{closeSheets();UI.cfm=null;cfmRender();const [t,x]=s.split(':');if(t==='roster'){UI.tab='roster';UI.rosterTeam=null;UI.it=UI.it||{};UI.it.roster=x;render();}else A.go(s);},s);
const chip=()=>p.evaluate(()=>{const c=[...document.querySelectorAll('#app .chipn.bud')].filter(e=>e.offsetParent&&getComputedStyle(e).visibility!=='hidden');const e=c[0];if(!e)return {n:0};const r=e.getBoundingClientRect(),at=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  const shown=[...e.querySelectorAll(':scope>span')].find(s=>getComputedStyle(s).display!=='none');const row=document.querySelector('#app main.content :is(.ws-tab-row,.subtabs,.ibx-tabs)');const rr=row&&row.getBoundingClientRect();
  return {n:c.length,r:[r.left,r.top,r.right,r.bottom].map(Math.round),hit:!!(at&&e.contains(at)),txt:(shown&&shown.querySelector('b')||{}).textContent||'',mini:!!(shown&&shown.classList.contains('bud-m')),inFm:!!e.closest('.fm2'),inSub:!!e.closest('.subhead'),
    full:money(budget().roomGoal),short:moneyShort(budget().roomGoal),over:document.documentElement.scrollWidth>innerWidth+1,W:innerWidth,H:innerHeight,rowR:rr&&rr.top<r.bottom&&rr.bottom>r.top?Math.round(rr.right):null};});
for(const [w,h] of SIZES){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(200);let pos=null;
 for(const s of SCREENS){await go(s);await p.waitForTimeout(60);const c=await chip(),m=w+' '+s+' '+JSON.stringify(c);
  assert.equal(c.n,1,'예산 여유 칩 하나가 보여야 함 '+m);assert.ok(c.hit,'칩이 가려지지 않고 눌림 '+m);assert.ok(c.r[0]>=0&&c.r[2]<=c.W&&c.r[1]>=0&&c.r[3]<=c.H,'칩이 화면 안 '+m);assert.ok(!c.over,'가로 넘침 없음 '+m);
  if(w>=1100)assert.ok(c.inFm&&!c.mini&&c.txt.replace(/^-/,'')===c.full.replace(/^-/,''),'PC는 하위 탭 줄 오른쪽 긴 꼴 '+m);
  else if(w<980){assert.ok(c.inSub&&c.mini&&c.txt.replace(/^-/,'')===c.short.replace(/^-/,''),'휴대폰은 짧은 꼴 '+m);if(c.rowR!=null)assert.ok(c.rowR<=c.r[0]+1,'탭 줄이 칩 밑으로 들어가지 않음 '+m);}
  else assert.ok(c.inSub&&!c.mini,'태블릿 가로는 제목 줄 오른쪽 '+m);
  const k=c.r[0]+','+c.r[1];if(pos==null)pos=k;assert.equal(k,pos,'모든 화면에서 같은 자리 '+m);}
 console.log('예산 여유 칩',w+'x'+h,SCREENS.length,'개 화면 같은 자리 · 보임 통과');}
/* 돈을 쓰면 바로 바뀐다: 코치 영입(전체 다시 그림), 코치 연수(창만 다시 그림), 시설 공사 */
for(const [w,h] of [[1366,768],[390,844]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(200);
 await go('staff:smkt');const c0=await chip();
 const hired=await p.evaluate(()=>{const r0=budget().roomGoal;const c=(G.cmarket||[]).filter(x=>x.sal>0).sort((a,b)=>b.sal-a.sal)[0];if(!c)return null;A.hireCoach(c.id+':3');if(UI.cfm)A.cfmOk();return {r0,r1:budget().roomGoal,name:c.name,ok:!(G.cmarket||[]).some(x=>x.id===c.id)};});
 assert.ok(hired&&hired.ok&&hired.r1!==hired.r0,w+' 코치 영입으로 예산 여유가 바뀜 '+JSON.stringify(hired));
 const c1=await chip();assert.notEqual(c1.txt,c0.txt,w+' 코치 영입 뒤 칩이 바로 바뀜 '+JSON.stringify([c0.txt,c1.txt]));assert.equal(c1.txt,w>=1100?c1.full:c1.short,w+' 칩 = 새 예산 여유');
 await go('club:inv');const f=await p.evaluate(()=>{const k=STAD_ITEMS[0].k;const r0=budget().roomGoal;const c0=document.querySelector('#app .chipn.bud').textContent;try{A.stadBuild(k);}catch(e){return {err:e.message};}if(UI.cfm)A.cfmOk();return {k,r0,r1:budget().roomGoal,c0};});
 const c3=await chip();assert.equal(c3.txt,w>=1100?c3.full:c3.short,w+' 시설 공사 뒤 칩 = 예산 여유 '+JSON.stringify(f));
 console.log(w,'코치 영입 뒤 칩',c0.txt,'→',c1.txt,'· 시설 공사',JSON.stringify(f),'→',c3.txt);
 await p.evaluate(()=>{closeSheets();UI.cfm=null;cfmRender();A.go('home');});}
/* 코치 연수는 11월 1일~12월 15일에만 보낼 수 있어 날짜를 옮겨 따로 본다(창만 다시 그리는 지출) */
await p.evaluate(()=>{G.day=dnum(G.year,11,1);G.ps=null;G.res=null;closeSheets();render();});
for(const [w,h] of [[1366,768],[390,844]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(200);
 await p.evaluate(()=>{const d=G.day;for(const T of coachStudyTickets().filter(T=>T.tid===G.user)){G.day=T.to;sisCtBack(T);}G.day=d;}); /* 앞 크기에서 보낸 코치를 돌려받는다(동시에 한 명만) */
 await go('staff:coach');const st=await p.evaluate(()=>{const C=coachesOf(G.user);const role=Object.keys(C).find(k=>C[k]&&!coachStudyOf(C[k].id)&&coachStudyOptions(k)?.fields.length&&coachStudyOptions(k).programs.some(x=>!coachStudyCheck(C[k].id,x.k,coachStudyOptions(k).fields[0].k)));if(!role)return {why:Object.keys(C).filter(k=>C[k]).map(k=>coachStudyCheck(C[k].id,'dom',coachStudyOptions(k)?.fields[0]?.k)).filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i)};A.coachStudyOpen(role);const s=UI.coachStudy,O=coachStudyOptions(role),P=O.programs.filter(x=>!coachStudyCheck(s.id,x.k,s.focus)).sort((a,b)=>b.cost-a.cost)[0];const r0=budget().roomGoal,n0=UI._rN;UI._cfmPass=true;try{A.coachStudySend([G.user,s.id,P.k,s.focus].join(':'));}finally{UI._cfmPass=false;}return {r0,r1:budget().roomGoal,cost:P.cost,sheetOnly:!!document.querySelector('#sheet [id^="coach-study-"]'),msg:UI.coachStudyMsg&&UI.coachStudyMsg[s.id]};});
 assert.ok(st&&st.r1!==st.r0,w+' 코치 연수 비용이 예산 여유에 잡힘 '+JSON.stringify(st));
 { const c2=await chip();assert.equal(c2.txt,w>=1100?c2.full:c2.short,w+' 코치 연수(창만 다시 그림) 뒤에도 칩이 바로 바뀜 '+JSON.stringify(st)+' '+c2.txt);console.log(w,'코치 연수 뒤 칩 갱신',JSON.stringify(st),'→',c2.txt);}}
}finally{await b?.close();await server.close();}assert.equal(errors.length,0,errors.join('\n'));console.log('예산 여유 칩: 4개 크기 · 돈 쓰는 화면 같은 자리 · 지출 뒤 바로 갱신 통과');})().catch(e=>{console.error(e.message);process.exitCode=1;});
