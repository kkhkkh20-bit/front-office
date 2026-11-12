/* 선수 인격체(11-12): 언론 플레이·트레이드 요구·훈련 불참 결정 메일이 소식함에 뜨고, 고르면 결과가 남는다. 사용: node tools/check-player-drama.cjs */
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
for(const [w,h] of [[1366,800],[390,844]]){ const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\.g/,r=>r.abort());
await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function');
const r=await p.evaluate(()=>{ localStorage.clear(); DEMO.on=false; newGame(0); try{hireMgr(G.mmarket[0].id,3);}catch(e){} G.tut={done:true,step:99}; G.medSet=true; UI.title=false; G.day=G.cal.open+40;
  const q=depth(G.user).start.find(x=>!x.foreign); initPers(q); Object.assign(q.pers,{amb:17,temp:16,loy:5}); grvAdd(q,'pt',10); G.evs=[]; pdStatement(q); const e=G.evs.find(x=>x.k==='pmed'); UI.tab='inbox'; render(); return {name:q.name,eid:e&&e.id,mid:e&&e.mid}; });
ok(!!r.eid,`언론 플레이 결정 생성 (${w})`);
const txt=await p.evaluate(()=>document.body.innerText);
ok(txt.includes(r.name),`소식함에 선수 이름 표시 (${w})`);
const res=await p.evaluate(id=>{ const e=G.evs.find(x=>x.id===id); const out=evPick(id,e.data.ks.indexOf('talk')); render(); return out; },r.eid);
ok(typeof res==='string'&&res.length>5,`면담 결과 문구: ${String(res).slice(0,40)} (${w})`);
const r2=await p.evaluate(()=>{ const q=depth(G.user).start.find(x=>!x.foreign); grvAdd(q,'pt',12); q.pd={st:1,d:G.day-30}; G.evs=[]; pdDemand(q); const e=G.evs.find(x=>x.k==='pdem'); evPick(e.id,e.data.ks.indexOf('wait')); const f=G.evf.find(x=>x.k==='pdem'); EVH.pdem.follow(f.data,G.user); render(); return {boy:q.boy>G.day,ev:!!G.evs.find(x=>x.k==='pboy'&&!x.done)}; });
ok(r2.boy&&r2.ev,`트레이드 요구 묵살 → 훈련 불참 결정 (${w})`);
await p.screenshot({path:require('path').resolve(__dirname,`.pd_${w}.png`)});
ok(!errs.length,`페이지 오류 없음 (${w}) ${errs.slice(0,2).join(' | ')}`);
await ctx.close(); }
await b.close(); server.close&&server.close(); })().catch(e=>{ console.log('실패 '+e.message); process.exitCode=1; });
