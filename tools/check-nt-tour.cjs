/* 국제대회 실제 경기 화면(11-12): 대회 현황 탭(일정·순위·한국 기록·참가국)·박스스코어·상대국 선수 카드·기록실·선수 프로필 국가대표 기록. 사용: node tools/check-nt-tour.cjs */
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
for(const [w,h] of [[1366,800],[390,844]]){ const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\.g/,r=>r.abort());
await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function');
const r=await p.evaluate(()=>{ localStorage.clear(); DEMO.on=false; newGame(0); try{hireMgr(G.mmarket[0].id,3);}catch(e){} G.tut={done:true,step:99}; G.medSet=true; UI.title=false;
  ntAnnounce('p12'); const N=G.nt; const T=ntTourInit(N); const e=NT_EV.p12; const res=KD(e.res[0],e.res[1]); for(let d=res-12;d<=res-5;d++)ntTourDay(N,d); /* 대회 중간 */
  return {n:T.games.length,done:T.games.filter(g=>g.done).length}; });
ok(r.done>0&&r.done<r.n,`대회 중간 상태 ${JSON.stringify(r)}`);
const go=async()=>{ await p.evaluate(()=>{ UI.tab='league'; try{ A.go('league:nt'); }catch(e){ try{ A.tab('league'); }catch(e2){} UI.sub='nt'; } render(); }); await p.waitForTimeout(300); };
await go(); let txt=await p.evaluate(()=>document.body.innerText);
ok(/대회/.test(txt)&&/일정·결과/.test(txt),'대회 현황 칸이 보임');
for(const t of ['grp','kr','nat','sch']){ await p.evaluate(v=>A.ntTab(v),t); await p.waitForTimeout(150); }
await p.evaluate(()=>A.ntTab('grp')); txt=await p.evaluate(()=>document.body.innerText); ok(/A조/.test(txt)&&/B조/.test(txt),'조별 순위 표');
await p.evaluate(()=>A.ntTab('kr')); txt=await p.evaluate(()=>document.body.innerText); ok(/OPS/.test(txt)&&/평균자책/.test(txt),'한국 기록 표');
const bx=await p.evaluate(()=>{ const g=G.nt.tour.games.find(x=>x.box); if(!g)return null; A.ntBox(String(g.n)); return g.n; }); txt=await p.evaluate(()=>document.body.innerText); ok(bx!=null&&/투수/.test(txt)&&/타자/.test(txt),'박스스코어');
await p.evaluate(()=>{ A.ntBox(''); A.ntNat('JP'); }); txt=await p.evaluate(()=>document.body.innerText); ok(/일본 대표팀 명단/.test(txt),'참가국 명단');
const cid=await p.evaluate(()=>{ const id=G.nt.tour.sq.JP[0]; A.ntCard(id); return id; }); txt=await p.evaluate(()=>document.body.innerText); ok(/일본 대표/.test(txt)&&/소속/.test(txt),'상대국 선수 카드 '+cid);
if(w>500&&process.env.SHOT_DIR)await p.screenshot({path:require('path').join(process.env.SHOT_DIR,'nt-card.png')});
/* 대회 끝까지 → 결과·기록실·프로필 */
await p.evaluate(()=>{ A.ntCard(''); A.ntNat(''); const N=G.nt; const e=NT_EV.p12; const res=KD(e.res[0],e.res[1]); for(let d=res-4;d<=res;d++)ntTourDay(N,d); ntResult('p12'); render(); });
txt=await p.evaluate(()=>document.body.innerText); ok(/대회 기록실/.test(txt)&&/최종 성적/.test(txt),'결과·기록실');
await p.evaluate(()=>A.ntArc('0')); txt=await p.evaluate(()=>document.body.innerText); ok(/명단/.test(txt),'기록실 명단 보기');
if(w>500&&process.env.SHOT_DIR)await p.screenshot({path:require('path').join(process.env.SHOT_DIR,'nt-arc.png')});
const pr=await p.evaluate(()=>{ const id=Object.keys(G.nt.tour.st).find(k=>/^\d+$/.test(k)); const pl=G.players[+id]; return {id,ntc:!!(pl&&pl.ntc),html:pl?ntCareerLine(pl):''}; }); ok(pr.ntc&&/국가대표/.test(pr.html),'선수 프로필 국가대표 통산');
const ov=await p.evaluate(()=>{ const el=document.scrollingElement; return el.scrollWidth-el.clientWidth; }); ok(ov<=2,`가로 넘침 없음(${w}px) ${ov}`);
ok(errs.length===0,`페이지 오류 없음(${w}px) `+errs.join('|')); await ctx.close(); }
await b.close();await server.close();})().catch(e=>{console.error(e);process.exit(1);});
