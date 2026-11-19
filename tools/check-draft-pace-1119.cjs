/* 카페 11-19 '지명할 때 한 팀마다 느림': 다른 구단 지명 간격은 지명에서 다음 지명까지로 잰다(그리는 시간만큼 기다림을 줄인다) · 지명은 바로 화면에 반영 · 남을 확률 계산은 등록 인원 전망을 한 번만 센다
   사용: node tools/check-draft-pace-1119.cjs  (index.html 필요: bash build.sh) */
const path=require('node:path'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;let fail=0;const log=(n,ok,m)=>{console.log((ok?'통과 ':'실패 ')+n+(ok||!m?'':' '+m));if(!ok)fail++;};try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const page=await browser.newPage({viewport:{width:1366,height:768}});const errs=[];page.on('pageerror',e=>errs.push(String(e)));
 await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await page.waitForSelector('[data-a="tsGo"][data-v="mode"]');await page.waitForTimeout(300);
 const r=await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);G.tut={done:true,step:99};G.medSet=true;UI.title=false;startDraft();
   const d=G.draft;if(d.picks[0].tid===G.user){const id=userAutoPick();userPick(id);} /* 다른 구단 차례에서 시작 */
   const st0=window.setTimeout,r0=render;const waits=[];window.setTimeout=(f,ms)=>{waits.push(ms);return 0;}; /* 예약만 적고 실행하지 않는다 */
   const burn=ms=>{const t=performance.now();while(performance.now()-t<ms);};const out={};
   try{ UI.df={pos:'all',typ:'all',reg:'all',star:false,sort:'rk',seg:'board',more:20};A.go('transfer:draft');r0();waits.length=0;
     const one=(sp,ms)=>{UI.dl=null;UI.dspeed=sp;render=()=>{r0();burn(ms);};const c0=d.cur;waits.length=0;dliveStart('am');render=r0;const pk=d.picks[c0];const w=waits.filter(x=>x!==800&&x!==30); /* 800: 자동 시작 예약, 30: 얼굴 그림 */
       return {w:w[w.length-1],moved:d.cur===c0+1,feed:UI.dl.feed[0]&&UI.dl.feed[0].pid===pk.pid,gone:pk.pid>0?!document.querySelector('.draft-candidates [data-a="player"][data-v="'+pk.pid+'"]'):true,shown:pk.pid>0?document.body.textContent.includes(G.players[pk.pid].name):true};};
     out.fast=one('fast',200);out.slow=one('slow',300);out.wait=[dlWait(550,0),dlWait(550,300),dlWait(180,900),dlWait(1100,-5)];
     let nP=0;const p0=rosterProj;rosterProj=(...a)=>{nP++;return p0(...a);};try{_doc=null;draftOdds(G.user);}finally{rosterProj=p0;}out.nP=nP;
   }finally{window.setTimeout=st0;render=r0;if(UI.dl){UI.dl.on=false;}}return out;});
 log('기다림 계산: 그린 시간만큼 줄이고 최소 60ms',JSON.stringify(r.wait)===JSON.stringify([550,250,60,1100]),JSON.stringify(r.wait));
 log('빠르게(180ms): 그리는 데 200ms 넘게 걸리면 다음 지명은 최소 간격 뒤',r.fast.w===60,JSON.stringify(r.fast));
 log('느리게(1100ms): 그린 시간(300ms 이상)을 뺀 만큼만 기다림',r.slow.w>=60&&r.slow.w<=800,JSON.stringify(r.slow));
 log('지명은 바로 반영: 순번 넘어감 · 지명 소식 맨 위 · 후보 표에서 빠짐',r.fast.moved&&r.fast.feed&&r.fast.gone&&r.fast.shown&&r.slow.moved&&r.slow.feed&&r.slow.gone,JSON.stringify([r.fast,r.slow]));
 log('남을 확률 한 번 계산에 등록 인원 전망은 두 번 이하(예전 241번)',r.nP<=2,String(r.nP));
 log('화면 오류 없음',errs.length===0,errs.join(' | ').slice(0,300));
}finally{if(browser)await browser.close();await server.close();}if(fail){console.log(`드래프트 지명 간격 점검: ${fail}건 실패`);process.exit(1);}console.log('드래프트 지명 간격 점검: 모두 통과');})().catch(e=>{console.error(e);process.exit(1);});
