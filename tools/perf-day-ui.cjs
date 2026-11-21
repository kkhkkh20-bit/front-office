/* Browser probe: per simulated day, time engine advance('day') vs render() vs save packing (prepG+pack) in the real page.
 Usage: CHROMIUM_EXECUTABLE_PATH=... node tools/perf-day-ui.cjs [days=40]  env W=1280 H=900 (390 for phone), CPU=4 (CDP CPU throttle, ~mid phone) */
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const DAYS=+process.argv[2]||40, W=+process.env.W||1280, H=+process.env.H||900, CPU=+process.env.CPU||1;
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));
const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
const ctx=await b.newContext({viewport:{width:W,height:H}}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.route(/fonts\.g/,r=>r.abort());
await p.goto(server.url); await p.waitForFunction(()=>typeof newGame==='function');
if(CPU>1){ const c=await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate',{rate:CPU}); }
const r=await p.evaluate(async(DAYS)=>{ localStorage.clear(); DEMO.on=false; newGame(4); try{ fdStart(); fdAdvance(false); let n=0; while(G.fd&&!G.fd.done&&n++<400)fdAdvance(true); }catch(e){} G.tut={done:true,step:99}; try{ hireMgr(G.mmarket[0].id,3); }catch(e){} G.medSet=true; UI.title=false; render();
  const now=()=>performance.now(), wait=ms=>new Promise(r=>setTimeout(r,ms)); const rows=[];
  /* jump to opening day so the sample is regular-season days */
  let k=0; while(period()!=='season'&&k++<200){ G.stops=[]; for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; } if(G.iv&&!G.iv.done){ let j=0; while(!G.iv.done&&j++<9)ivAnswer(0); } try{ advance('day'); }catch(e){ G.day++; } G.live=null; G.res=null; }
  render(); await wait(300);
  for(let i=0;i<DAYS;i++){ G.stops=[]; G.live=null; G.res=null; for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; } if(G.iv&&!G.iv.done){ let j=0; while(!G.iv.done&&j++<9)ivAnswer(0); }
    const a=now(); try{ advance('day'); }catch(e){} const b1=now(); G.live=null; G.res=null; render(); const c=now(); let pk=0; try{ const t=now(); const j=prepG(); packJ(j); pk=now()-t; }catch(e){ pk=-1; } await wait(0); rows.push({adv:b1-a,ren:c-b1,pack:pk}); }
  return {rows,players:Object.keys(G.players).length};
},DAYS);
const L=k=>r.rows.map(x=>x[k]).sort((a,b)=>a-b), st=k=>{ const v=L(k); return `${k} avg ${(v.reduce((s,x)=>s+x,0)/v.length).toFixed(0)} p50 ${v[v.length>>1].toFixed(0)} max ${v[v.length-1].toFixed(0)}`; };
console.log(`UI ${W}x${H} CPUx${CPU} · ${r.rows.length} season days · ${st('adv')}ms · ${st('ren')}ms · ${st('pack')}ms`);
if(errs.length)console.log('page errors: '+errs.slice(0,3).join(' | '));
await b.close(); server.close&&server.close(); })().catch(e=>{ console.error(e); process.exit(1); });
