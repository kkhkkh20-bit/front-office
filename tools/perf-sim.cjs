/* Engine speed probe: time advance('day') per day and per period (season / post / offseason) with no UI.
 Usage: node tools/perf-sim.cjs [end year=2027]  env SEED(7) TEAM(6) TOP(15)  PROF=1 -> also per-function self time via node --cpu-prof (run with: node --cpu-prof --cpu-prof-dir=DIR tools/perf-sim.cjs)
 Needs dist/engine.js (bash build.sh --engine-out dist/engine.js). Auto GM: same default answers as check-sim.js (no ACT). */
const fs=require('fs'), path=require('path'); const {performance}=require('perf_hooks');
const ENGINE=process.env.ENGINE||path.join(__dirname,'..','dist','engine.js'); if(!fs.existsSync(ENGINE)){ console.error('missing dist/engine.js'); process.exit(2); }
const END=+process.argv[2]||2027, SEED=+process.env.SEED||7, TEAM=+process.env.TEAM||6, TOP=+process.env.TOP||15;
{ let a=SEED; Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const errs=[]; console.error=(...a)=>errs.push(a.map(String).join(' ').slice(0,200));
const run=new Function('errs','END','TEAM','now','require',fs.readFileSync(ENGINE,'utf8')+`
const t0=now(); DEMO.on=false; newGame(TEAM); fdStart(); fdAdvance(false); let g0=0; while(G.fd&&!G.fd.done&&g0++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true;
for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; try{ if(p&&!foreignCheck(G.user,p))signForeign(G.user,id); }catch(e){} }
const tNew=now()-t0; const days=[]; let gm=0;
const step=()=>{ G.live=null; G.res=null; G.stops=[]; const a=now();
  if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(e){ errs.push('draft '+e.message); }
  if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,false); }catch(e){ errs.push('offer '+e.message); }
  for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; }
  for(const j of (G.jobs||[]))if(!j.done)try{ jobAnswer(j.tid,false,true); }catch(e){}
  if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); }
  (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(e){} });
  if(G.contract&&!G.contract.done&&G.day>=KD(12,10))try{ confirmContracts(); }catch(e){}
  try{ const n=rosterN(G.user), up=Math.max(0,rosterN(G.user,G.day+1)-n); if(n+up>ROSTER_MAX)trimRoster(G.user,ROSTER_MAX-up); }catch(e){}
  try{ if(!G.unemp&&!G.mgr[G.user]){ if(!G.mmarket||!G.mmarket.length)refreshMgrMarket(); hireMgr(G.mmarket[0].id,2); } }catch(e){}
  gm+=now()-a; const d=G.day, y=G.year, per=period(); const b=now();
  try{ advance('day'); }catch(e){ errs.push('advance '+dstr(G.day)+' '+e.message); G.day++; }
  days.push({y,d:dstr(d),per,ms:now()-b,ny:G.year!==y}); };
let g=0, lastD=G.day, same=0; while(G.year<END&&g++<90000){ step(); if(G.day===lastD){ if(++same>=40)break; } else { lastD=G.day; same=0; } }
if(process.env.DUMP)require('fs').writeFileSync(process.env.DUMP,JSON.stringify(G)); return {tNew,gm,days,end:dstr(G.day),save:(()=>{ try{ const j=JSON.stringify(G,(k,v)=>k==='amBootMs'?undefined:v); return [j.length,require('crypto').createHash('sha1').update(j).digest('hex').slice(0,12)]; }catch(e){ return [-1,'']; } })()};`);
const r=run(errs,END,TEAM,()=>performance.now(),require);
const D=r.days, sum=L=>L.reduce((s,x)=>s+x.ms,0), f=x=>x.toFixed(0);
const by={}; for(const x of D){ const k=x.y+' '+x.per; (by[k]=by[k]||[]).push(x); }
console.log(`SEED ${SEED} TEAM ${TEAM} -> ${r.end} · newGame ${f(r.tNew)}ms · auto-GM ${f(r.gm)}ms · advance total ${f(sum(D))}ms over ${D.length} steps · save ${(r.save[0]/1e6).toFixed(1)}MB hash ${r.save[1]}`);
for(const k in by){ const L=by[k].map(x=>x.ms).sort((a,b)=>a-b); console.log(`  ${k.padEnd(16)} n=${String(L.length).padStart(3)} total ${f(sum(by[k])).padStart(6)}ms  avg ${(sum(by[k])/L.length).toFixed(1).padStart(6)}  p50 ${L[L.length>>1].toFixed(1).padStart(6)}  max ${L[L.length-1].toFixed(0).padStart(5)}`); }
console.log(`slowest ${TOP} days:`); for(const x of [...D].sort((a,b)=>b.ms-a.ms).slice(0,TOP))console.log(`  ${x.d} ${x.per}${x.ny?' (new year)':''} ${f(x.ms)}ms`);
if(errs.length)console.log('errors '+errs.length+': '+errs.slice(0,5).join(' | '));
