/* 빈 사진 액자 점검(UI 3단계 3-6): 주요 화면에서 보이는 얼굴 칸 중 그림이 비었거나(한 가지 색만) 로드에 실패한 칸이 없어야 한다.
   사진을 받는 동안에도 빈 칸 대신 실루엣이, 받지 못하면 그림 얼굴이 보여야 한다. 사용: node tools/check-photo-frames.cjs */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;const fails=[],errors=[];
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const p=await browser.newPage({viewport:{width:1366,height:768}});p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);
 await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;render();});
 const routes=['home','inbox','roster','transfer:contract','transfer:fa','transfer:foreign','staff:mgr','staff:coach','player','person:mgr'];
 for(const [w,h] of [[1366,768],[390,844]]){await p.setViewportSize({width:w,height:h});
  for(const r of routes){
   for(const wait of [150,1800]){ /* 사진을 받는 중(바로)과 받은 뒤(또는 실패해 그림 얼굴로 바뀐 뒤) 모두 본다 */
    await p.evaluate(r=>{closeSheets();if(r==='player')A.player(domestic(G.user)[0].id);else if(r.startsWith('person:'))A.person(r.slice(7));else if(r.includes(':'))A.go(r);else A.tab(r);},r);await p.waitForTimeout(wait);
    const bad=await p.evaluate(async()=>{const out=[];const imgs=[...document.querySelectorAll('#app img.av,#sheet img.av,#app .pf-fm-face img,#sheet .pf-fm-face img')].filter(i=>{const b=i.getBoundingClientRect();return b.width>=20&&b.height>=20&&b.bottom>0&&b.top<innerHeight&&getComputedStyle(i).visibility!=='hidden';});
     const cv=document.createElement('canvas');cv.width=cv.height=16;const cx=cv.getContext('2d',{willReadFrequently:true});
     for(const i of imgs){ if(!i.complete){ try{ await i.decode(); }catch(e){} }
      if(i.complete&&i.naturalWidth===0){out.push('로드 실패 '+(i.alt||i.closest('[data-v]')?.dataset.v||''));continue;}
      try{cx.clearRect(0,0,16,16);cx.drawImage(i,0,0,16,16);const d=cx.getImageData(0,0,16,16).data;let mn=[255,255,255],mx=[0,0,0];for(let k=0;k<d.length;k+=4){if(d[k+3]<20)continue;for(let c=0;c<3;c++){mn[c]=Math.min(mn[c],d[k+c]);mx[c]=Math.max(mx[c],d[k+c]);}}
       const spread=Math.max(mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2]);if(spread<12)out.push('빈 액자 '+(i.closest('tr,li,.item,.flr,section')?.innerText||'').trim().slice(0,16));}catch(e){}}
     return {n:imgs.length,bad:out.slice(0,5)};});
    if(bad.bad.length)fails.push(`${w} ${r} ${wait}ms: ${bad.bad.join(' | ')}`);
   }
  }
  console.log('사진 칸',w,routes.length,'화면 확인');
 }
 assert.deepEqual(fails,[],'빈 사진 액자');assert.deepEqual(errors,[]);console.log('사진 칸 점검 통과: 빈 액자·로드 실패 0');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
