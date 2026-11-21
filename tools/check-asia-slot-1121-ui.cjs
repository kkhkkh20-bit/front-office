/* 카페 11-21(전자포): 아시아쿼터 후보 협상 창의 영입 슬롯 선택("아시아쿼터로 영입" / "외국인 슬롯으로 영입")을 390·1366 화면에서 확인한다 */
const path=require('path'),assert=require('node:assert/strict'),root=path.resolve(__dirname,'..'),{chromium}=require(root+'/tools/node_modules/playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const FIXTURE=`function A1121(){ _achMem=achMetaFix(null); _achChamp0={}; buildWorld({lite:true}); claimTeam(6); G.day=G.cal.open+30; G.entryY=G.year; G.contract=null; G.evs=[]; G.mail=[]; G.stops=[];
  const t=G.user; for(const p of Object.values(G.players))if(p.team===t&&p.foreign)p.team=null; G.sea.repl=G.sea.repl||{}; G.sea.asiaRepl=G.sea.asiaRepl||{}; G.sea.repl[t]=0; G.sea.asiaRepl[t]=0; G.sea.fspend[t]=0;
  const mk=(k,isP,tm)=>{ const p=newForeign(k,{isP,market:tm==null}); p.team=tm; p.sal=Math.min(p.ask,k==='아시아'?ASIA_CAP:300); p.yrs=1; p.fy=G.year; p.rsy=0; delete p.opt; delete p.prev; delete p.prev2; delete p.now; p.fsrc='agent'; p.fpub=0; setOvr(p,55); return p; };
  mk('용병',true,t); mk('용병',false,t); mk('아시아',false,t); const q=mk('아시아',true,null); G.fmarket=[q.id]; G.tut={done:true,step:99}; G.medSet=true; UI.title=false; return q.id; }`;
(async()=>{ const server=await startHtmlServer(process.env.ASIA_1121_UI_HTML||path.join(root,'index.html')); let b, n=0; const check=(v,m)=>{ assert.ok(v,m); n++; console.log('PASS '+m); };
  try{ b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
    for(const width of [390,1366]){ const ctx=await b.newContext({viewport:{width,height:width===390?844:900}}), p=await ctx.newPage(), errors=[]; p.on('pageerror',e=>errors.push(e.message));
      await p.goto(server.url); await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0); await p.waitForFunction(()=>typeof newGame==='function'&&UI.title===true&&UI.sstep==='main');
      const id=await p.evaluate('(()=>{ localStorage.clear(); DEMO.on=false; '+FIXTURE+' const id=A1121(); render(); UI.negWin={k:"fm",id}; renderSheet(); return id; })()');
      const slot=p.locator('.negw .fo-slot'); await slot.waitFor({state:'visible'});
      const btn=k=>p.locator(`.negw [data-a="foSlot"][data-v="${k}"]`);
      check((await btn('asia').innerText()).includes('아시아쿼터로 영입')&&(await btn('yb').innerText()).includes('외국인 슬롯으로 영입'),width+': 두 영입 슬롯 버튼');
      check(await btn('yb').getAttribute('aria-pressed')==='true',width+': 아시아쿼터 자리가 차 있으면 외국인 슬롯이 기본 선택');
      const txt=async()=>p.locator('.negw .fo').innerText();
      
      check(/일반 외국인 규정/.test(await txt())&&/상한 60만 달러/.test(await txt())&&!(await p.locator('.negw .fo-error .note').count()),width+': 외국인 슬롯은 일반 외국인 상한·규정, 막힘 없음');
      const noOver=async w=>check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),w+': 가로 넘침 없음');
      const inView=async w=>check(await p.evaluate(()=>[...document.querySelectorAll('.negw .fo-slot .btn')].every(e=>{ const r=e.getBoundingClientRect(); return r.left>=-1&&r.right<=innerWidth+1&&r.width>40; })),w+': 슬롯 버튼이 화면 안');
      await noOver(width); await inView(width);
      if(width>=1366)check(await p.evaluate(()=>document.scrollingElement.scrollHeight<=innerHeight+2),width+': PC 페이지 세로 스크롤 없음');
      await btn('asia').click(); await p.waitForFunction(()=>document.querySelector('.negw [data-a="foSlot"][data-v="asia"]')?.getAttribute('aria-pressed')==='true');
      check(/아시아쿼터는 1명/.test(await p.locator('.negw .fo-error').innerText())&&/신규 상한 20만 달러/.test(await txt()),width+': 아시아쿼터로 바꾸면 아시아쿼터 상한과 자리 없음 안내');
      await noOver(width+' 아시아쿼터');
      await btn('yb').click(); await p.waitForFunction(()=>document.querySelector('.negw [data-a="foSlot"][data-v="yb"]')?.getAttribute('aria-pressed')==='true');
      const r=await p.evaluate(id=>{ UI.fo.g=fNewCap(); UI.fo.i=0; renderSheet(); UI._cfmPass=true; try{ A.foGo(String(id)); } finally{ UI._cfmPass=false; } const q=G.players[id]; return {team:q.team,u:G.user,k:q.foreign,a:q.fAsia,yb:foreignOf(G.user).filter(x=>x.foreign==='용병').length,as:foreignOf(G.user).filter(x=>x.foreign==='아시아').length,repl:G.sea.repl[G.user],arepl:G.sea.asiaRepl[G.user]||0}; },id);
      check(r.team===r.u&&r.k==='용병'&&r.a===1&&r.yb===3&&r.as===1,width+': 외국인 슬롯으로 계약하면 일반 3명 + 아시아쿼터 1명 '+JSON.stringify(r));
      check(r.repl===1&&r.arepl===0,width+': 시즌 중 교체는 일반 외국인 횟수로 '+JSON.stringify(r));
      /* 재계약: 우리 아시아쿼터 선수를 외국인 슬롯으로(일반 3명이면 막힘, 자리가 나면 전환) */
      const aid=await p.evaluate(()=>{ const a=foreignOf(G.user).find(x=>x.foreign==='아시아'); a.newSal=newSalary(a); G.contract={y:G.year,tid:G.user,ended:[],foreignEnd:[a.id],foreignDrop:[],released:[],fre:{},done:false}; UI.fo=null; UI.negWin={k:'fre',id:a.id}; renderSheet(); return a.id; });
      const rb=p.locator('.negw [data-a="foReYB"]'); await rb.waitFor({state:'visible'});
      check(await rb.isDisabled()&&/3명/.test(await p.locator('.negw .fo-re-slot + .fo-slot-d').innerText()),width+': 재계약 외국인 슬롯 전환은 일반 3명이면 막힘');
      await p.evaluate(id=>{ const x=foreignOf(G.user).find(y=>y.foreign==='용병'&&y.id!==id&&!y.fAsia)||foreignOf(G.user).find(y=>y.foreign==='용병'); releaseForeign(x.id); UI.negWin={k:'fre',id}; renderSheet(); },aid);
      await p.waitForFunction(()=>{ const b=document.querySelector('.negw [data-a="foReYB"]'); return b&&!b.disabled; }); await noOver(width+' 재계약'); await inView(width+' 재계약');
      await rb.click(); await p.waitForFunction(()=>document.querySelector('.negw [data-a="foReYB"]')?.getAttribute('aria-pressed')==='true');
      const rr=await p.evaluate(id=>{ const a=G.players[id]; return {k:a.foreign,ns:a.newSal,cap:asiaCap(),n:fReCapInfo().n}; },aid);
      check(rr.k==='용병'&&rr.ns>rr.cap&&rr.n===3,width+': 재계약 외국인 슬롯 전환 '+JSON.stringify(rr)); await noOver(width+' 재계약 전환 뒤');
      if(width>=1366)check(await p.evaluate(()=>document.scrollingElement.scrollHeight<=innerHeight+2),width+': 재계약 창 PC 페이지 세로 스크롤 없음');
      check(!errors.length,width+': 페이지 오류 없음 '+errors.join(' | '));
      await ctx.close(); }
    console.log(`아시아 선수 외국인 슬롯 화면 점검 ${n}개 통과`);
  } finally{ if(b)await b.close(); await server.close(); } })().catch(e=>{ console.error(e); process.exit(1); });
