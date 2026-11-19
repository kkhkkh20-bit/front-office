const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const page=await browser.newPage();
 await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);G.tut={done:true,step:99};G.medSet=true;UI.title=false;});
 const results=await page.evaluate(()=>{const out=[],test=(n,f)=>{try{if(!f())throw Error('기대와 다른 표시');out.push([n,true]);}catch(e){out.push([n,false,e.message]);}};
 test('#316 확장 리그 사전 순번 안내',()=>{const orig=G.teams;try{G.teams=[...orig,...orig.slice(0,2).map((t,i)=>({...t,id:10+i}))];return draftPlan().length===132&&draftBoard().includes('132개');}finally{G.teams=orig;}});
 test('#311 지명권 없는 잔류 확률',()=>doChip({av:null,noPick:'none'}).includes('지명권 없음')&&!doChip({av:null,noPick:'none'}).includes('1%'));
 test('#331 투수 재확인 항목',()=>{const p=G.draftClass.map(id=>G.players[id]).find(p=>p.isP);G.shortlist=[p.id];const html=myBoard([{p,rp:scoutReport(p),rk:1}],false);return !html.includes('data-v="'+p.id+':타격"')&&html.includes('data-v="'+p.id+':제구"');});
 return out;});let fail=0;for(const [name,ok,msg]of results){console.log((ok?'통과 ':'실패 ')+name+(msg?' '+msg:''));if(!ok)fail++;}
 if(process.env.CHECK_FIT){for(const size of [{width:1366,height:768},{width:390,height:844}]){await page.setViewportSize(size);for(const route of ['transfer:draft','roster:plan']){await page.evaluate(route=>{A.go(route);render();},route);const fit=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,h:innerHeight,sh:document.documentElement.scrollHeight}));assert.ok(fit.sw<=fit.w+1,'가로 넘침 '+JSON.stringify(fit));if(size.width>900)assert.ok(fit.sh<=fit.h+2,'PC 전체 세로 스크롤 '+JSON.stringify(fit));console.log(route+' 화면 맞춤',size.width,'통과');}}}
 assert.equal(fail,0,fail+'개 화면 검수 실패');
 }finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
