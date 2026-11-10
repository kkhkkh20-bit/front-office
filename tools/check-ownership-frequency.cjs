/* Synthetic ownership lifecycle frequency test. No baseball, income/expense, roster growth or manager turnover is simulated. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const root=path.resolve(__dirname,'..'),engine=require('./build.cjs').build({root,write:false}).engine;let state=7,calls=0;const old=Math.random,reseed=n=>{state=n;calls=0;};Math.random=()=>{calls++;state|=0;state=state+0x6D2B79F5|0;let t=Math.imul(state^state>>>15,1|state);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
try{const result=new Function('assert','reseed','rngCalls',engine+`
DEMO.on=false;newGame(6);G.players={};G.unemp={since:G.day};G.last=null;G.mail=[];G.stops=[];G.gameOver=null;delete G.ownership;const base=JSON.stringify(G),all=[];
const initYear=y=>{G.year=y;G.day=dnum(y,12,1);G.cal={open:dnum(y,3,28),end:dnum(y,10,5),sched:{}};};
for(const scenario of ['normal','all-clubs-financial-stress'])for(let seed=1;seed<=100;seed++){
 G=JSON.parse(base);worldReset();reseed(seed);initYear(2026);ownershipInit();for(const t of G.teams)t.cash=0;let maxPending=0;const events=[],stages=[];
 for(let y=2026;y<2126;y++){
  initYear(y);if(scenario==='all-clubs-financial-stress')for(const t of G.teams)t.cash=-5000*ecoIdx();
  clubRescue(y);const seq=G.ownership.seq,rc=rngCalls();clubRescue(y);assert.equal(G.ownership.seq,seq);assert.equal(rngCalls(),rc,'same-year annual tick must not consume RNG');
  let n=0;while(Object.values(G.ownership.clubs).some(s=>s.pending)){
   const pending=Object.entries(G.ownership.clubs).filter(([,s])=>s.pending);maxPending=Math.max(maxPending,pending.length);assert.equal(pending.length,1);assert.ok(n++<10,'event must resolve without bankruptcy or endless same-day loop');
   const [tid,s]=pending[0],q=s.pending;assert.ok(q.nextD>G.day);stages.push({tid:+tid,y:G.year,stage:q.stage,day:G.day,nextD:q.nextD});G.day=q.nextD;G.year=dobj(G.day).y;G.cal={open:dnum(G.year,3,28),end:dnum(G.year,10,5),sched:{}};ownershipDaily();assert.equal(G.gameOver,null);assert.ok(G.teams.every(t=>Number.isFinite(t.cash)));
  }
 }
 for(const [tid,s] of Object.entries(G.ownership.clubs))for(const e of s.history)if(['succession','acquisition','crisis'].includes(e.kind))events.push({tid:+tid,y:e.y,kind:e.kind});events.sort((a,b)=>a.y-b.y||a.tid-b.tid);
 const gap=(L,min)=>{for(let i=1;i<L.length;i++)assert.ok(L[i].y-L[i-1].y>=min,'cooldown '+JSON.stringify(L.slice(i-1,i+1)));};
 for(const tid of G.teams.map(t=>t.id))gap(events.filter(e=>e.tid===tid),15);gap(events.filter(e=>e.kind==='crisis'),20);gap(events.filter(e=>e.kind==='acquisition'),10);gap(events.filter(e=>e.kind!=='succession'),4);gap(events.filter(e=>e.kind==='succession'),2);
 assert.equal(Object.keys(G.players).length,0);assert.equal(new Set(G.ownership.capital.map(x=>x.id)).size,G.ownership.capital.length);
 for(const c of G.ownership.capital){assert.equal(c.cashAfter-c.cashBefore,c.amount);assert.ok(c.amount>0&&Number.isFinite(c.amount));}
 const counts=Object.fromEntries(['succession','acquisition','crisis'].map(k=>[k,events.filter(e=>e.kind===k).length]));const outcomes={acquired:0,succeeded:0,recovery:0,bridge:0};for(const s of Object.values(G.ownership.clubs))for(const e of s.history)if(e.kind in outcomes)outcomes[e.kind]++;
 all.push({scenario,seed,years:100,counts,outcomes,maxPending,capitalEntries:G.ownership.capital.length,events});
}
const summary={};for(const scenario of ['normal','all-clubs-financial-stress']){const L=all.filter(x=>x.scenario===scenario),tot=k=>L.reduce((s,x)=>s+x.counts[k],0),avg=k=>tot(k)/100;summary[scenario]={seeds:100,yearsPerSeed:100,leagueYears:10000,events:Object.fromEntries(['succession','acquisition','crisis'].map(k=>[k,{total:tot(k),per100LeagueYears:avg(k),seedsWithEvent:L.filter(x=>x.counts[k]>0).length,minPerSeed:Math.min(...L.map(x=>x.counts[k])),maxPerSeed:Math.max(...L.map(x=>x.counts[k]))}])),maxConcurrent:Math.max(...L.map(x=>x.maxPending)),outcomes:Object.fromEntries(['acquired','succeeded','recovery','bridge'].map(k=>[k,L.reduce((n,x)=>n+x.outcomes[k],0)]))};}
return {summary,runs:all};
`)(assert,reseed,()=>calls);const out={method:'Synthetic ownership annual/lifecycle tick; identical initial league snapshot with 100 independent annual-event RNG seeds × 100 years per scenario; 20000 league-years total. Normal: initial team cash=0, no generated financial stress, event capital retained. Stress: all teams assigned cash=-5000×ecoIdx each annual tick. No baseball, roster dynamics, income/expense settlement or full financial model simulated. Counts exclude ordinary CEO retirements (kind ceo).',engineSHA256:crypto.createHash('sha256').update(engine).digest('hex'),...result};const target=process.env.OWNERSHIP_FREQUENCY_OUT||path.join(root,'docs/reviews/2026-11-10-ownership-frequency.json');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out.summary,null,2));console.log('All lifecycle/cooldown/capital invariants passed; '+target);}finally{Math.random=old;}
