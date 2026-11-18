const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const page=await browser.newPage();
 await page.goto(server.url);await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;});
 const results=await page.evaluate(()=>{const out=[],test=(n,f)=>{try{if(!f())throw Error('기대와 다른 표시');out.push([n,true]);}catch(e){out.push([n,false,e.message]);}};
 const b=G.teams.find(t=>t.id!==G.user).id,a=domestic(G.user)[0],p=domestic(b)[0],offer=()=>({id:'uirev',from:b,give:[p.id],get:[a.id],exp:G.day+3});
 test('#344 받은 제안 결재서 현금 조건',()=>{const o=offer();o.cash=-200;G.offers=[o];const d=GUARD.offerYes(o.id);return d.lines.some(x=>x.includes('현금')&&x.includes(money(200)));});
 test('#353 맞교환 표시는 거래 제한도 검사',()=>{a.listed=true;p.aiListed=true;p.aiUrg=false;G.trades=[{y:G.year,d:G.day-3,with:b,me:G.user}];const old=evalTrade;try{evalTrade=(...x)=>({...old(...x),ok:true});return !blockCenter().includes('맞교환 가능');}finally{evalTrade=old;G.trades=[];delete a.listed;delete p.aiListed;}});
 test('#363 재활 기간 변경 후 재검진',()=>{const o=offer();p.injOut=7;offerAdvise(o,'sc');p.injOut=60;return offerMedStale(o)&&offerAdvBox(o).includes('다시 검진');});
 test('#364 병원 변경 후 재검진',()=>{const o=offer();G.med.hosp='none';offerAdvise(o,'sc');G.med.hosp='a';return offerMedStale(o)&&offerAdvBox(o).includes('다시 검진');});
 test('#365 연봉 변경 후 분석 갱신',()=>{const o=offer();p.injOut=0;G.analysts=[{id:'uirev-ana',name:'분석원',skill:5,role:'data',sal:30,yrs:3}];const old=dataLv;try{dataLv=()=>2;a.sal=100;p.sal=120;offerAdvise(o,'ana');const first=o.adv.ana;p.sal=420;offerAdvise(o,'ana');return o.adv.ana!==first&&o.adv.ana.includes(money(320));}finally{dataLv=old;}});
 test('#366 감독 교체 후 의견 갱신',()=>{const o=offer();offerAdvise(o,'mgr');G.mgr[G.user]={...G.mgr[G.user],id:'uirev-newmgr',name:'새감독'};offerAdvise(o,'mgr');return o.adv.mgr.includes('새감독');});
 return out;});let fail=0;for(const [name,ok,msg]of results){console.log((ok?'통과 ':'실패 ')+name+(msg?' '+msg:''));if(!ok)fail++;}assert.equal(fail,0,fail+'개 화면 검수 실패');
 }finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
