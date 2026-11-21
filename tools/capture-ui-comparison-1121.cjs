// Capture both revisions against the same synthetic save; never use a live user save.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{buildSite}=require('./build-site.cjs'),{startSiteServer}=require('./lib/site-server.cjs');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.COMPARE_OUT||'/workspace/work/ui-comparison-1121'),phase=process.env.COMPARE_PHASE||'both';
const variants=[{key:'before',root:process.env.BEFORE_ROOT||'/workspace/front-office-ui-baseline-1121'},{key:'after',root}].filter(v=>phase==='both'||phase===v.key);
const routes=[['home','홈','home'],['inbox','소식함','inbox'],['finance','재정','club:fin'],['training','훈련','staff:dev'],['medical','의료','staff:med'],['facilities','시설 재원','club:inv']];
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
(async()=>{fs.mkdirSync(out,{recursive:true});const fixtureFile=path.join(out,'fixture.json');let browser;
 try{browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
  for(const variant of variants){const site=path.join(out,'site-'+variant.key),built=buildSite({root:variant.root,out:site}),server=await startSiteServer(site);const context=await browser.newContext(),page=await context.newPage(),errors=[],missing=[];
   try{page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url().replace(server.url,''));});await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
    if(!fs.existsSync(fixtureFile)){assert.equal(variant.key,'before','Generate the shared save from main first');const fixture=await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open+50;
      for(const p of playersOf(G.user)){p.injOut=0;p.inj=.08;p.fat=10;p.injHist=[];}const bats=domestic(G.user).filter(p=>!p.isP&&!p.ys&&!(p.joinY>G.year));bats[0].inj=.9;bats[0].fat=90;bats[1].injHist=[{d:G.day-20,days:10,bk:G.day-10}];
      G.iv={id:'ui-preview-iv',day:G.day,exp:G.day+3,done:false};G.mail.unshift(
       {id:'ui-preview-pending',day:G.day,from:'홍보팀',kind:'언론',cat:'press',subj:'[인터뷰 요청] 시즌 운영 방향',body:'이번 시즌 운영 방향에 대한 인터뷰 요청입니다.\n답변 여부를 선택해 주세요.',read:true,imp:true,ctx:{tid:G.user},acts:[{a:'ivOpen',v:'ui-preview-iv',l:'인터뷰 응하기'},{a:'ivSkip',v:'ui-preview-iv',l:'사양하기'}]},
       {id:'ui-preview-important',day:G.day,from:'운영팀',kind:'운영',cat:'must',subj:'구단 운영 보고',body:'운영 현황을 확인해 주세요.',read:false,imp:true,acts:[]},
       {id:'ui-preview-unread',day:G.day,from:'스카우트팀',kind:'스카우트',cat:'scout',subj:'주간 관찰 보고',body:'관찰 명단의 평가가 도착했습니다.',read:false,imp:false,acts:[]});
      return {game:JSON.stringify(G),riskId:bats[0].id,returnId:bats[1].id,trainingId:bats[2].id};});fs.writeFileSync(fixtureFile,JSON.stringify(fixture));}
    const fixture=JSON.parse(fs.readFileSync(fixtureFile,'utf8')),captures=[];fs.mkdirSync(path.join(out,variant.key),{recursive:true});
    for(const width of [390,1366]){await page.setViewportSize({width,height:width===390?844:900});
     for(const [key,label,route] of routes){await page.evaluate(({fixture,route,key})=>{saveFlush();G=JSON.parse(fixture.game);worldReset();DEMO.on=false;UI.title=false;UI.it={};UI.trnPend=key==='training'?{[fixture.trainingId]:'spd'}:{};UI.trnApplyMsg='';UI.sheet=null;UI.sheets=[];if(key==='inbox'){UI.mf='task';UI.mfFrom=null;UI.mfUnread=false;UI.mailFocus=null;UI.ibSel=null;UI.ibOpen=null;UI._ibStk=null;UI._ibFirst=true;}A.go(route);},{fixture,route,key});await page.waitForTimeout(220);
      if(key==='medical'&&width===390)await page.locator('.med-mobile-list').evaluateAll(L=>L.forEach(e=>e.open=true));
      if(key==='facilities'){const details=page.locator('.fac-funding-help').first();if(await details.count())await details.evaluate(e=>e.open=true);}
      const anchor=key==='training'?'.trn-policy, .trn-env':key==='facilities'?'.fac-funding-help':null;if(anchor){const el=page.locator(anchor).first();if(await el.count())await el.scrollIntoViewIfNeeded();}
      const file=width+'-'+key+'.png';await page.screenshot({path:path.join(out,variant.key,file),animations:'disabled'});
      const state=await page.evaluate(()=>({user:G.user,day:G.day,cash:team(G.user).cash,training:JSON.stringify(G.trn||{}),pending:{...UI.trnPend},budget:budgetSplit(),mailIds:(G.mail||[]).map(m=>m.id),overflow:document.documentElement.scrollWidth-innerWidth}));
      assert.equal(state.overflow,0,variant.key+' '+width+' '+key+' horizontal overflow');captures.push({width,key,label,file,state});console.log(variant.key+' '+width+' '+key);
     }
    }
    assert.deepEqual(errors,[],'JavaScript errors in '+variant.key);assert.deepEqual(missing,[],'Missing resources in '+variant.key);fs.writeFileSync(path.join(out,variant.key+'.json'),JSON.stringify({variant:variant.key,commit:built.release.commit,build:built.release.build,fixtureSha:sha(fixture.game),captures,errors,missing},null,2));
   }finally{await context.close();await server.close();}
  }
  if(fs.existsSync(path.join(out,'before.json'))&&fs.existsSync(path.join(out,'after.json'))){const a=JSON.parse(fs.readFileSync(path.join(out,'before.json'))),b=JSON.parse(fs.readFileSync(path.join(out,'after.json')));assert.equal(a.fixtureSha,b.fixtureSha);for(const p of a.captures){const q=b.captures.find(x=>x.width===p.width&&x.key===p.key);assert.ok(q);assert.deepEqual(q.state,p.state,'Same financial/training/mail state: '+p.width+' '+p.key);}console.log('Comparison state parity passed: 12 matching pairs');}
 }finally{await browser?.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
