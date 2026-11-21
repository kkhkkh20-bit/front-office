/* 새 게임 구단 고르기 점검(구단주 11-21 "창단 드래프트 고르는 화면이 너무 느리다", "순번을 먼저 안 누르면 구단을 눌러도 아무 일이 없다"):
   1) 리그는 Worker에서 만든다: '새 게임'·시작 방식·구단 카드가 바로 뜨고 눌린다(화면 스레드가 오래 멈추지 않음). 진행률이 보인다
   2) 창단: 순번보다 구단을 먼저 눌러도 고른 것으로 남고 순번을 묻는다. '다음: 단장 소개'는 둘 다 골라야 켜지고, 꺼진 이유를 적는다
   3) 단장 소개에서 시작을 먼저 눌러 두면 리그를 다 만든 뒤 바로 시작한다(단장 취임·창단 둘 다)
   4) 같은 씨앗이면 Worker로 만든 세계·시작 결과가 화면 스레드로 만든 것과 같다(난수 흐름 그대로)
   5) 390px 가로 넘침 없음, 1366px 페이지 스크롤 없음
   사용: CHROMIUM_EXECUTABLE_PATH=... node tools/check-fd-setup-1121.cjs  (THR=4: CPU 4배 느리게, 시간 예산도 4배) */
const path=require('path'),crypto=require('crypto');const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
const THR=+(process.env.THR||1);
/* 시간 예산(ms, CPU 1배). 고치기 전: 새 게임 뒤 카드까지 12.0초(화면 멈춤 11.3초), CPU 4배 38~46초. 고친 뒤: 0.5초 안팎(멈춤 0.2초) */
const B={cards:2500*THR,block:1500*THR,click:1200*THR,game:4000*THR};
const PRNG=`self.__rs=12345;self.__rc=0;Math.random=function(){self.__rc++;var a=self.__rs=(self.__rs+0x6D2B79F5)|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};`;
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));
const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
const open=async(W,init)=>{ const ctx=await b.newContext({viewport:{width:W,height:W===390?844:768}}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ window.__lt=0; try{ new PerformanceObserver(l=>{ for(const e of l.getEntries())window.__lt=Math.max(window.__lt,e.duration); }).observe({type:'longtask'}); }catch(e){} });
  if(init)await p.addInitScript(init); await p.route(/fonts\.g|googletagmanager/,r=>r.abort());
  await p.goto(server.url); await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0,null,{timeout:180000}); await p.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
  if(THR>1){ const c=await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate',{rate:THR}); } return {ctx,p,errs}; };
const timed=async(p,fn,cond)=>{ const t=Date.now(); await p.evaluate(()=>{ window.__lt=0; }); await fn(); await p.waitForFunction(cond,null,{timeout:600000,polling:50}); await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)))); return Date.now()-t; };
const fit=async(p,W,where)=>{ const m=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,sh:document.scrollingElement.scrollHeight,ih:innerHeight}));
  if(W===390)ok(m.sw<=m.cw+1,`390 ${where}: 가로 넘침 없음 ${JSON.stringify(m)}`); else ok(m.sh<=m.ih+1,`1366 ${where}: 페이지 스크롤 없음 ${JSON.stringify(m)}`); };
const R={};
try{
 /* 1·2·3) 창단: 실제 클릭 */
 for(const W of [1366,390]){ const {ctx,p,errs}=await open(W);
  const t1=await timed(p,()=>p.click('[data-a="tsGo"][data-v="mode"]'),()=>!!document.querySelector('[data-a="smode"][data-v="fd"]'));
  const t2=await timed(p,()=>p.click('[data-a="smode"][data-v="fd"]'),()=>!!document.querySelector('.tpg [data-a="start"].btn'));
  const busy=await p.evaluate(()=>({busy:!!UI.worldBusy,w:!!UI.worldW,world:!!UI.world,pct:!!document.querySelector('[data-wpct="txt"]')}));
  R['fd'+W]={newGame:t1,cards:t2};
  ok(t1+t2<B.cards,`${W} 창단: 새 게임→구단 카드 ${t1+t2}ms < ${B.cards}`); ok(busy.busy&&busy.w&&!busy.world&&busy.pct,`${W} 리그는 Worker에서 만드는 중이고 진행률이 보임 ${JSON.stringify(busy)}`);
  ok(await p.locator('.fdgo-b[aria-disabled="true"]').count()===1&&/구단과 지명 순번을 고르면/.test(await p.locator('.fdgo').innerText()),`${W} 처음엔 '다음' 꺼짐 + 이유`);
  await fit(p,W,'창단 구단 고르기(만드는 중)');
  await p.click('.fdgo-b',{force:true}); /* aria-disabled: 눌러도 되지만 넘어가지 않고 이유를 보여 준다 */ await p.waitForTimeout(200); ok(await p.evaluate(()=>UI.sstep)==='team',`${W} 꺼진 '다음'은 넘어가지 않음`);
  const tc=await timed(p,()=>p.locator('.tpg [data-a="start"].btn').nth(3).click(),()=>UI.fdTid!=null);
  const s1=await p.evaluate(()=>({tid:UI.fdTid,sel:document.querySelectorAll('.tpg .sel').length,need:!!document.querySelector('.fdpk.need'),why:(document.querySelector('.fdgo-why')||{}).textContent||'',step:UI.sstep,bar:(document.querySelector('.fdgo-s')||{}).textContent||''}));
  R['fd'+W].club=tc; ok(tc<B.click,`${W} 순번 전 구단 클릭 반응 ${tc}ms`);
  ok(s1.tid!=null&&s1.sel===1&&s1.need&&/지명 순번/.test(s1.why)&&s1.step==='team'&&!/구단 미선택/.test(s1.bar),`${W} 순번보다 구단을 먼저 눌러도 고른 것으로 남고 순번을 물음 ${JSON.stringify(s1)}`);
  const tk=await timed(p,()=>p.click('[data-a="fdPk"][data-v="4"]'),()=>UI.fdPk===4); R['fd'+W].order=tk; ok(tk<B.click,`${W} 순번 클릭 반응 ${tk}ms`);
  ok(await p.locator('.fdgo-b[aria-disabled="false"]').count()===1&&await p.locator('.fdgo-why').count()===0,`${W} 구단·순번을 다 고르면 '다음' 켜짐`);
  const sel=await p.evaluate(()=>UI.fdTid);
  const tg=await timed(p,()=>p.click('.fdgo-b'),()=>UI.sstep==='prof'); R['fd'+W].next=tg; ok(tg<B.click*1.5&&await p.evaluate(s=>UI.pickT===s,sel),`${W} '다음'으로 단장 소개(고른 구단) ${tg}ms`);
  await fit(p,W,'단장 소개');
  const early=await p.evaluate(()=>!UI.world);
  await p.fill('#gp-name','점검단장'); await p.click('[data-a="gpStart"]');
  if(early){ await p.waitForTimeout(200); ok(await p.evaluate(()=>UI.gpWait&&UI.title&&/대기/.test(document.querySelector('[data-a="gpStart"]').textContent)),`${W} 리그를 만드는 중 시작을 누르면 대기 표시`); }
  await p.waitForFunction(()=>!UI.title,null,{timeout:600000});
  const g=await p.evaluate(()=>({user:G.user,pk:G.fdSlot??null,fd:!!G.fdWait,gm:G.gmP&&G.gmP.name}));
  ok(g.user===sel&&g.fd&&g.gm==='점검단장',`${W} 다 만든 뒤 고른 구단으로 바로 시작 ${JSON.stringify(g)}`);
  ok(errs.length===0,`${W} 창단 페이지 오류 없음 ${errs.slice(0,2).join('|')}`); await ctx.close(); }
 /* 1366: 리그를 다 만든 뒤 카드 화면·클릭·시작 시간과 화면 스레드 최대 멈춤 */
 for(const mode of ['fd','take']){ const {ctx,p,errs}=await open(1366);
  await p.click('[data-a="tsGo"][data-v="mode"]'); await p.click(`[data-a="smode"][data-v="${mode}"]`);
  await p.evaluate(()=>{ window.__lt=0; }); await p.waitForFunction(()=>UI.world&&!UI.worldBusy,null,{timeout:600000,polling:200}); await p.waitForTimeout(300);
  const blk=await p.evaluate(()=>Math.round(window.__lt)); R[mode+'Block']=blk; ok(blk<B.block,`${mode}: 리그를 만드는 동안 화면 스레드 최대 멈춤 ${blk}ms < ${B.block}(고치기 전 11초)`);
  await p.waitForSelector('[data-a="tpOpen"]'); await fit(p,1366,mode+' 구단 고르기(완성)');
  if(mode==='fd'){ const t=await timed(p,()=>p.click('[data-a="fdPk"][data-v="7"]'),()=>UI.fdPk===7); ok(t<B.click,`fd 완성 후 순번 클릭 ${t}ms`); }
  const tc=await timed(p,()=>p.locator('.tpg [data-a="start"].btn').first().click(),()=>UI.sstep==='prof'); R[mode+'Club']=tc; ok(tc<B.click*1.5,`${mode}: 구단 클릭→단장 소개 ${tc}ms`);
  await p.fill('#gp-name','점검단장');
  const tg=await timed(p,()=>p.click('[data-a="gpStart"]'),()=>!UI.title&&!document.querySelector('[data-a="gpStart"]')&&!!document.querySelector('#app *')); R[mode+'Game']=tg;
  ok(tg<B.game,`${mode}: 시작→첫 게임 화면 ${tg}ms < ${B.game}`);
  await p.waitForTimeout(600); ok(await p.evaluate(()=>{ const m=meta(); return m.active===curSlot()&&!!m.slots[curSlot()]&&!!sbGet(curSlot()); }),`${mode}: 첫 화면 뒤 새 슬롯에 저장됨`);
  ok(errs.length===0,`${mode} 페이지 오류 없음 ${errs.slice(0,2).join('|')}`); await ctx.close(); }
 /* 단장 취임 390: 만드는 중에도 카드 클릭이 바로 단장 소개로 */
 { const {ctx,p,errs}=await open(390); await p.click('[data-a="tsGo"][data-v="mode"]'); await p.click('[data-a="smode"][data-v="take"]');
  await fit(p,390,'취임 구단 고르기(만드는 중)'); ok(await p.locator('.fdset').count()===1,'취임: 순서 표시');
  const tc=await timed(p,()=>p.locator('.tpg [data-a="start"].btn').nth(1).click(),()=>UI.sstep==='prof'); ok(tc<B.click*1.5&&await p.evaluate(()=>!UI.world&&UI.pickT===1),`390 취임: 만드는 중 구단 클릭→단장 소개 ${tc}ms`);
  await fit(p,390,'취임 단장 소개'); await p.click('[data-a="gpStart"]'); await p.waitForFunction(()=>!UI.title,null,{timeout:600000});
  ok(await p.evaluate(()=>G.user===1&&!G.fdWait),'390 취임: 다 만든 뒤 바로 시작'); ok(errs.length===0,'취임 390 페이지 오류 없음 '+errs.slice(0,2).join('|')); await ctx.close(); }
 /* 4) 같은 씨앗: Worker 세계 = 화면 스레드 세계, 시작 결과도 같다 */
 const run=async(noWorker)=>{ const {ctx,p}=await open(1366,PRNG+(noWorker?'self.Worker=undefined;':''));
  await p.evaluate(PRNG=>{ window.__wbPre=PRNG.replace('__rs=12345','__rs='+self.__rs)+'function __wbPost(){return {rs:self.__rs,rc:self.__rc};}'; window.__wbDone=x=>{ if(x){ self.__rs=x.rs; self.__rc+=x.rc; } }; A.tsGo('mode'); },PRNG);
  await p.waitForFunction(()=>UI.world&&!UI.worldBusy,null,{timeout:600000,polling:200});
  const r=await p.evaluate(()=>{ const sk=(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((o,x)=>(o[x]=v[x],o),{}):v;
   const w=JSON.stringify(Object.assign({},UI.world,{amBootMs:0}),sk), rs=self.__rs, rc=self.__rc, used=!!UI.worldJ; self.__rs=4242;
   A.smode('fd'); A.fdPk(3); A.start(2); const n=document.getElementById('gp-name'); if(n)n.value='씨앗단장'; A.gpStart(); return {w,rs,rc,used}; });
  await p.waitForFunction(()=>!UI.title,null,{timeout:60000});
  const g=await p.evaluate(()=>{ const sk=(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((o,x)=>(o[x]=v[x],o),{}):v; return {g:JSON.stringify(Object.assign({},G,{amBootMs:0}),sk),rs:self.__rs}; });
  await ctx.close(); const h=x=>crypto.createHash('sha1').update(x).digest('hex').slice(0,12); return {w:h(r.w),rs:r.rs,rc:r.rc,used:r.used,g:h(g.g),grs:g.rs}; };
 const A1=await run(false), A2=await run(true); R.seed={worker:A1,main:A2};
 ok(A1.used&&!A2.used,'씨앗 비교: 한쪽은 Worker, 한쪽은 화면 스레드로 만듦');
 ok(A1.w===A2.w&&A1.rs===A2.rs&&A1.rc===A2.rc,`같은 씨앗이면 Worker 세계·난수 흐름이 화면 스레드와 같음 ${JSON.stringify([A1,A2])}`);
 ok(A1.g===A2.g&&A1.grs===A2.grs,`같은 씨앗이면 시작 뒤 게임 상태도 같음 ${A1.g} ${A2.g}`);
}catch(e){ ok(false,'진행 실패: '+(e&&e.stack||e)); }
console.log(JSON.stringify(R)); await b.close(); await server.close(); })();
