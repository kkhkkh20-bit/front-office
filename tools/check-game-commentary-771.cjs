/* Native cast controls, commentary and recorded-play animation paths at phone/desktop sizes. */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {startHtmlServer}=require('./lib/ui-server.cjs');
const {runPanels}=require('./lib/game-panels-776-browser.cjs');
(async()=>{
 const out=process.env.GAME_AUDIT_OUT||'/tmp/game-commentary-771';fs.mkdirSync(out,{recursive:true});
 const server=await startHtmlServer(process.env.GAME_AUDIT_HTML||path.resolve(__dirname,'../index.html'));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--disable-webgl']});
 let n=0;const check=(v,m)=>{if(!v)throw Error(m);console.log('PASS '+m);n++;};
 try{for(const width of [390,1366]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(180000);
  await page.route('https://**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await page.waitForSelector('[data-a="tsGo"][data-v="mode"]');
  await page.evaluate(()=>{
   DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.fdWait=false;G.day=G.cal.open+2;for(const t of G.teams)setEntry(t.id);
   const h=G.user,a=G.teams.find(t=>t.id!==h).id,sim=simGame(G.day,h,a,false),base=gameRecord(G.day,h,a,sim,'');window.__gcBase=base;
   UI.title=false;UI.tab='home';UI.menu=false;render();
   window.__gcShow=mode=>{
    CT.tok++;CT.run=false;UI.cast=null;UI.castRet=null;UI.game=null;UI.sheet=null;G.live=null;G.res=null;delete G.castHold;SPOIL_SNAP=null;
    const g=JSON.parse(JSON.stringify(__gcBase)),bat=g.box.a.bat[0].id,r1=g.box.a.bat[1].id,r2=g.box.a.bat[2].id,pit=g.box.h.pit[0].id,
    pre=[0,r1,pit,'BB',0,[r1,mode==='force'?r2:0,0],0,0,0],x=[0,bat,pit,mode==='hit'?'1B':'OUT',mode==='hit'?0:1,mode==='out'?[r1,0,0]:mode==='force'?[bat,r1,0]:[bat,0,0],0,0,0];
    x[17]='GB:SS';
    if(mode==='fc'){x[14]=[{id:r1,from:1,to:2,result:'out'}];x[18]={fc:true,error:false,fielder:'SS',bipType:'GB',outBase:2,outRunner:r1,ab:1};}
    else if(mode==='gb'){x[5]=[r1,0,0];x[18]={fc:false,error:false,fielder:'SS',bipType:'GB',outBase:1,outRunner:bat,ab:1};}
    else{x[15]={v:1,pitches:[{t:'직구',v:140,x:.5,y:.5,b:0,s:0,res:'번트'}]};x[18]={bunt:mode==='force'?'fc':mode==='hit'?'hit':'out',fc:mode==='force',error:false,fielder:'3B',bipType:'GB',outBase:mode==='hit'?null:mode==='force'?3:1,outRunner:mode==='hit'?null:mode==='force'?r2:bat,ab:1};if(mode==='force'){x[14]=[{id:r2,from:2,to:3,result:'out'}];x[16]=r2;}}
    const end=[2,g.box.a.bat[3].id,pit,'K',1,[0,0,0],0,0,0];g.pbp=[pre,x,end];g.hs=0;g.as=0;G.games=[g];A.cast(0);castJump(1,false);UI.cast.spd=100;
    const plan=cContactPlan(g,1,cBefore(g,1)),fielder=cFielders(g,0,1).find(f=>f.pos===plan.opos);
    return {base:pbpCallBase(g,1).c,live:pbpCall(g,1).c,chip:paK(x)[0],plan,target:cOutTarget(g,1),fielderKey:fielder?'d'+fielder.id:null};
   };
   window.__gcAnimate=async()=>{
    const oldBall=cBall,oldSleep=cSleep,oldPlace=cPlace,calls=[],places=[];
    cBall=async(a,z)=>{calls.push(z);};cSleep=async()=>{};cPlace=(el,pt)=>{places.push({k:el.dataset.k,pt});return oldPlace(el,pt,0);};
    try{await cAnim(1);return {calls,places,cap:document.querySelector('#cs-cap')?.textContent,comment:document.querySelector('#md-comment')?.textContent,chip:document.querySelector('#cs-abr')?.textContent,sw:[...document.querySelectorAll('.cc.sw')].length};}
    finally{cBall=oldBall;cSleep=oldSleep;cPlace=oldPlace;}
   };
  });
  for(const mode of ['fc','hit','out','force','gb']){
   const r=await page.evaluate(mode=>__gcShow(mode),mode);
   if(mode==='fc')check(!/실책|실수/.test(r.base+' '+r.live)&&!r.plan.errPos,'771 '+width+' FC is not error');
   if(mode==='hit')check(/번트/.test(r.base+' '+r.live)&&r.plan.gb&&!r.plan.arc,'772 '+width+' bunt hit has rolling bunt geometry');
   if(mode==='out')check(/번트 실패/.test(r.chip)&&/번트/.test(r.base),'773 '+width+' batter-out bunt typed in native chip');
   if(mode==='gb')check(/유격수/.test(r.base)&&r.plan.opos==='SS'&&r.plan.gb,'775 '+width+' stored SS groundball remains SS');
   const a=await page.evaluate(()=>__gcAnimate());
   if(mode==='force'||mode==='gb')check(a.places.some(p=>p.k===r.fielderKey&&Math.abs(p.pt[0]-r.plan.spot[0])<.01&&Math.abs(p.pt[1]-r.plan.spot[1])<.01),'actual canonical fielder moves '+width+' '+mode);
   if(mode==='out')check(/번트 실패/.test(a.chip),'773 '+width+' actual result chip shows failed bunt');
   if(mode==='force')check(a.calls.some(p=>p[0]===32&&p[1]===73)&&!a.calls.some(p=>p[0]===68&&p[1]===73),'774 '+width+' actual2D animation resolves3B only');
   if(mode==='hit')check(a.sw===0&&/번트/.test(a.comment||a.cap),'772 '+width+' actual animation avoids full swing and renders bunt call');
   if(mode==='fc')check(!/실책/.test(a.comment||a.cap),'771 '+width+' native rendered FC call has noerror');
   await page.evaluate(()=>cCap(pbpCall(G.games[UI.cast.g],1).c));
   await page.locator('#cs-stage').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'commentary-'+mode+'-'+width+'.png'),scale:'css'});
   await page.locator('[data-a="castStep"][data-v="1"]').click();
   check(await page.locator('.match-dashboard').isVisible(),'native next-PA control '+width+' '+mode);
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal overflow '+width+' '+mode);
  }
  await runPanels({page,width,out,check});
  check(errors.length===0,'no browser errors '+width+' '+errors.slice(0,2).join(';'));await page.close();
 }
 console.log('GAME commentary/panels UI: '+n+' checks PASS');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
