/* Native Chromium regression checks for draft-board feedback 1033–1040.
   Run after build: node tools/check-draft-board-1033.cjs
   Optional: DRAFT_BOARD_HTML=/path/to/index.html SHOT_DIR=/path/to/captures */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const root=path.resolve(__dirname,'..'),out=process.env.SHOT_DIR;
(async()=>{
 const server=await startHtmlServer(process.env.DRAFT_BOARD_HTML||path.join(root,'index.html'));
 let browser;const results=[];
 const check=(ok,name,detail)=>{results.push({ok:!!ok,name,detail});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?' '+JSON.stringify(detail):''}`);};
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
  for(const width of [390,1366]){
   const context=await browser.newContext({viewport:{width,height:width===390?844:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
   await page.waitForFunction(()=>typeof newGame==='function'&&UI.title===true);
   await page.evaluate(()=>{localStorage.clear();DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;window.__draftBase=JSON.stringify(G);});
   const reset=()=>page.evaluate(()=>{G=JSON.parse(__draftBase);worldReset();closeSheets();UI.drv=null;UI.dview='list';UI.open={draftFilters:true,draftRest:true,dmock:false};UI.df={pos:'all',typ:'all',reg:'all',star:false,sort:'rk',seg:'mine',more:20};G.shortlist=[];G.amFw={};delete G.dbSort;window.__ids=draftRanked().slice(0,3).map(x=>x.p.id);for(const id of __ids.slice().reverse())amFollow(id,true);A.go('transfer:draft');});
   const click=async selector=>{await page.waitForFunction(()=>!UI._clk||performance.now()-UI._clk.t>=410);await page.locator(selector+':visible').first().click();};
   const has=async selector=>await page.locator(selector+':visible').count()>0;
   const order=()=>page.evaluate(()=>G.shortlist.slice());
   const shot=async name=>{if(out){fs.mkdirSync(out,{recursive:true});await page.waitForFunction(()=>{const t=document.getElementById('toast');return !t||getComputedStyle(t).opacity==='0';});await page.screenshot({path:path.join(out,`${width}-${name}.png`),fullPage:true});}};
   const scenario=async(name,fn)=>{try{await reset();await fn();}catch(e){check(false,width+' '+name+' runtime',e.message);}};
   await scenario('1033',async()=>{
    await page.evaluate(()=>{G.shortlist=[];G.amFw={};for(const id of __ids.slice(1))amFollow(id,true);render();});
    await click('[data-a="dbAuto"]');await click('[data-a="draftRest"][data-v="board:3"]');
    await page.evaluate(()=>{A.go('home');A.player(__ids[0]);});
    await click('#sheet [data-a="star"]');
    const r=await page.evaluate(()=>{closeSheets();const added=G.shortlist.includes(__ids[0]),snap=JSON.stringify(G),ids=__ids.slice();startDraft();G.draft.cur=G.draft.picks.findIndex(x=>x.tid===G.user);const pk=G.draft.picks[G.draft.cur];draftRestPick();const unopened=pk.pid;G=JSON.parse(snap);worldReset();draftBoard();startDraft();G.draft.cur=G.draft.picks.findIndex(x=>x.tid===G.user);const op=G.draft.picks[G.draft.cur];draftRestPick();return {added,expected:ids[0],unopened,opened:op.pid};});
    check(r.added&&r.unopened===r.expected&&r.opened===r.expected,width+' 1033 actual sheet interest and delegated recorded pick agree without opening board',r);
   });
   await scenario('1034',async()=>{
    await click('[data-a="dbAuto"]');
    const r=await page.evaluate(()=>{const a=G.user,b=G.teams.find(t=>t.id!==a).id;window.__clubs={a,b};G.user=b;draftClubLeave(a);const firstAuto=!!G.dbSort?.auto;A.go('transfer:draft');const firstShown=!!G.dbSort?.auto;G.user=a;draftClubLeave(b);const restoredA=!!G.dbSort?.auto;G.user=b;draftClubLeave(a);const restoredB=!!G.dbSort?.auto;return {firstAuto,firstShown,restoredA,restoredB};});
    check(!r.firstAuto&&!r.firstShown&&r.restoredA&&!r.restoredB,width+' 1034 auto is off on B first opening and restored separately per club',r);
   });
   await scenario('1035',async()=>{
    const aOrder=await order();await click('[data-a="dbSort"]');
    const expected=await page.evaluate(()=>{const a=G.user,b=G.teams.find(t=>t.id!==a).id;window.__clubs={a,b};const list=[__ids[2],__ids[0],__ids[1]];G.dClub=G.dClub||{};G.dClub[b]={shortlist:list.slice(),dmemo:{}};G.user=b;draftClubLeave(a);A.go('transfer:draft');return list;});
    const leaked=await has('[data-a="dbUndo"]');if(leaked)await click('[data-a="dbUndo"]');
    const bOrder=await order();await page.evaluate(()=>{const {a,b}=__clubs;G.user=a;draftClubLeave(b);A.go('transfer:draft');});
    const restored=await has('[data-a="dbUndo"]');if(restored)await click('[data-a="dbUndo"]');
    check(!leaked&&JSON.stringify(bOrder)===JSON.stringify(expected)&&restored&&JSON.stringify(await order())===JSON.stringify(aOrder),width+' 1035 A undo cannot change B shared candidates and restores on A return',{leaked,bOrder,expected,restored});
   });
   await scenario('1036',async()=>{
    await click('[data-a="dbAuto"]');await page.evaluate(()=>{for(const id of G.shortlist.slice())amFollow(id,false);render();});
    const control=await has('[data-a="dbAuto"]');await shot('1036-empty');if(control)await click('[data-a="dbAuto"]');
    check(control&&await page.evaluate(()=>G.shortlist.length===0&&!G.dbSort.auto),width+' 1036 empty auto board retains a working OFF control');
   });
   await scenario('1037',async()=>{
    await page.evaluate(()=>{const p=draftRanked().find(x=>x.p.isP).p;G.shortlist=[];G.amFw={};amFollow(p.id,true);UI.df.pos='C';render();});
    const filters=await has('.dfilt');if(filters){await page.locator('.dfilt').first().evaluate(el=>el.scrollIntoView({block:'center'}));if(!await has('[data-a="dreset"]')&&!await has('[data-a="dset"][data-v="pos:all"]')&&await has('.dfilt summary'))await click('.dfilt summary');}
    const resetSelector=await has('[data-a="dreset"]')?'[data-a="dreset"]':'[data-a="dset"][data-v="pos:all"]',resetButton=await has(resetSelector),active=await has('[data-a="dset"][data-v="pos:C"].on');await shot('1037-filter');
    if(resetButton)await click(resetSelector);
    check(filters&&active&&resetButton&&await page.evaluate(()=>UI.df.pos==='all'&&document.querySelectorAll('.draft-candidates tbody tr').length===1),width+' 1037 watch tab exposes active C filter and actual reset restores pitcher',{filters,active,resetButton});
   });
   await scenario('1038',async()=>{
    const r=await page.evaluate(()=>({expected:G.shortlist.slice(),top:[...document.querySelectorAll('.dboard .dbr-b > [data-a="player"]')].map(x=>+x.dataset.v),bottom:[...document.querySelectorAll('.draft-candidates tbody .candidate-name')].map(x=>+x.dataset.v)}));
    check(JSON.stringify(r.top)===JSON.stringify(r.expected)&&JSON.stringify(r.bottom)===JSON.stringify(r.expected),width+' 1038 manual board and watch table show identical order',r);await page.locator('.dboard .dbr').first().evaluate(el=>el.scrollIntoView({block:'start'}));await shot('1038-order');await page.locator('.draft-candidates').evaluate(el=>el.scrollIntoView({block:'end'}));await shot('1038-watch-table');
   });
   await scenario('1039',async()=>{
    const ids=await order();await click(`[data-a="drdB"][data-v="${ids[0]}:2"]`);await click(`[data-a="drdB"][data-v="${ids[1]}:1"]`);await click(`[data-a="drdB"][data-v="${ids[2]}:2"]`);
    const visual=()=>page.evaluate(()=>({ids:[...document.querySelectorAll('.dboard .dbr-b > [data-a="player"]')].map(x=>+x.dataset.v),numbers:[...document.querySelectorAll('.dboard .dbr-k')].map(x=>+x.textContent),rounds:[...document.querySelectorAll('.dboard .drd .on')].map(x=>x.textContent)}));
    const before=await visual();await page.locator('.dboard .dbr').first().evaluate(el=>el.scrollIntoView({block:'start'}));await shot('1039-rounds');await click(`[data-a="dmove"][data-v="${ids[1]}:-1"]`);const up=await visual();await click(`[data-a="dmove"][data-v="${ids[1]}:1"]`);const down=await visual();
    check(JSON.stringify(before.ids)===JSON.stringify(ids)&&before.numbers.join()==='1,2,3'&&before.rounds.join()==='2~3R,1R 목표,2~3R'&&JSON.stringify(up.ids)===JSON.stringify([ids[1],ids[0],ids[2]])&&JSON.stringify(down.ids)===JSON.stringify(ids)&&down.numbers.join()==='1,2,3',width+' 1039 mixed round labels keep global 1-2-3 and actual up/down follow visual neighbors',{ids,before,up,down});
   });
   await scenario('1040',async()=>{
    await click('[data-a="dbAuto"]');await page.evaluate(()=>{G.year++;makeDraftClass();G.shortlist=[];G.amFw={};for(const x of draftRanked().slice(0,3).reverse())amFollow(x.p.id,true);render();});const before=await order(),stale=await has('[data-a="dbUndo"]');if(stale)await click('[data-a="dbUndo"]');else await page.evaluate(()=>A.dbUndo());
    check(!stale&&await page.evaluate(()=>G.dbSort.auto===true)&&JSON.stringify(await order())===JSON.stringify(before),width+' 1040 previous-year undo is unavailable and cannot disable current auto',{stale});
   });
   await scenario('manual control',async()=>{
    const r=await page.evaluate(()=>{const p=Object.values(G.players).find(p=>p.team!=null&&!p.prospect),q=Object.values(G.players).find(q=>q.team!=null&&!q.prospect&&q.id!==p.id);G.shortlist.splice(1,0,p.id);G.shortlist.splice(3,0,q.id);render();return {p:p.id,q:q.id};});
    const ids=await order(),move=ids[4];await click(`[data-a="dmove"][data-v="${move}:-1"]`);const manual=await order();
    const result=await page.evaluate(()=>{UI.df.pos='C';UI.df.sort='press';render();UI.df.pos='all';UI.df.sort='rk';for(const id of __ids)obsAdd(G.players[id],G.user,3);for(const s of G.scouts||[])if((s.role||'am')==='am')s.skill=Math.max(0,(s.skill||0)-1);const day=G.day,advances=[];for(let i=0;i<3;i++)advances.push(advance('day',{skipMatchStop:true}).days);save();const saved=JSON.stringify(G);G=JSON.parse(saved);worldReset();migrateDraft();A.go('transfer:draft');return {elapsed:G.day-day,advances,order:G.shortlist.slice()};});
    check(result.elapsed===3&&result.advances.every(x=>x===1)&&JSON.stringify(result.order)===JSON.stringify(manual)&&manual[1]===r.p&&manual[3]===r.q&&await page.evaluate(()=>!G.dbSort?.auto),width+' manual OFF preserves order through filters, scout observations, three real days, JSON reload, and active-player fixed slots',{manual,result});
    const ranksSorted=await page.evaluate(()=>{const m=new Map(draftRanked().map(x=>[x.p.id,x.rk])),v=G.shortlist.filter(id=>m.has(id)).map(id=>m.get(id));return v.every((x,i)=>!i||v[i-1]<x);});if(ranksSorted)await click(`[data-a="dmove"][data-v="${(await order()).at(-1)}:-1"]`);
    const beforeSort=await order();await click('[data-a="dbSort"]');const sorted=await order();await click('[data-a="dbUndo"]');check(sorted[1]===r.p&&sorted[3]===r.q&&JSON.stringify(await order())===JSON.stringify(beforeSort),width+' native sort and valid same-year undo preserve active-player fixed slots',{sorted});
   });
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' no document horizontal overflow');check(!errors.length,width+' no browser runtime errors',errors);await context.close();
  }
 }finally{await browser?.close();await server.close();}
 if(out)fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 assert.equal(results.filter(x=>!x.ok).length,0,results.filter(x=>!x.ok).length+' draft-board checks failed');console.log('Draft board 1033–1040 native checks PASS ('+results.length+')');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
