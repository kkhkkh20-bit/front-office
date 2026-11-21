/* 카페 11-21 신인 드래프트 후보 표: '현재·잠재력 추정' 칸에 현재 능력 스카우트 추정(선수 정보 '현재' 값과 같음)이 행마다 보인다 · 390 가로 넘침 없음 · 1366 페이지 스크롤 없음
   사용: node tools/check-draft-cur-1121.cjs  (index.html 필요: bash build.sh)  SHOT_DIR=폴더 를 주면 화면 사진을 남긴다 */
const path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;let fail=0;const log=(n,ok,m)=>{console.log((ok?'통과 ':'실패 ')+n+(ok||!m?'':' '+m));if(!ok)fail++;};try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const shotDir=process.env.SHOT_DIR;
 for(const [w,h] of [[390,844],[1366,768]]){
  const page=await browser.newPage({viewport:{width:w,height:h}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await page.waitForFunction(()=>typeof newGame==='function'&&UI.title===true);
  /* 우리 차례의 신인 드래프트(엔진 호출 없이 cur만 옮김), 보기: 후보 목록 · 스카우트 순위 */
  await page.evaluate(()=>{localStorage.clear();DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;startDraft();G.draft.cur=G.draft.picks.findIndex(x=>x.tid===G.user);UI.dview='list';UI.df={pos:'all',typ:'all',reg:'all',star:false,sort:'rk',seg:'board',more:20};A.go('transfer:draft');render();});
  await page.waitForTimeout(200);
  /* 휴대폰: 열 묶음을 '현재·잠재력 추정'이 보이는 쪽으로 넘긴다 */
  for(let i=0;i<12;i++){ const vis=await page.evaluate(()=>{const th=[...document.querySelectorAll('.draft-candidates .candidate-table thead th')].find(t=>/현재·잠재력 추정/.test(t.textContent));return !!th&&!th.classList.contains('twh')&&th.getBoundingClientRect().width>0;}); if(vis)break; const nx=page.locator('.draft-candidates .twpg button[aria-label="다음 열"]').first(); if(!(await nx.count())||await nx.isDisabled())break; await nx.click();await page.waitForTimeout(120); }
  const r=await page.evaluate(()=>{const tb=document.querySelector('.draft-candidates .candidate-table');const H=[...tb.tHead.rows[0].cells];const ci=H.findIndex(t=>/현재·잠재력 추정/.test(t.textContent));
   const rows=[...tb.tBodies[0].rows].filter(tr=>tr.cells.length===H.length);const cells=rows.map(tr=>tr.cells[ci]);
   const vals=cells.map(c=>{const b=c.querySelector('.cn-cur b');return b?b.textContent.trim():null;});
   const ids=rows.map(tr=>+tr.querySelector('[data-a="player"]').dataset.v);
   const vis=cells.slice(0,5).every(c=>{const e=c.querySelector('.cn-cur');const q=e&&e.getBoundingClientRect();return q&&q.width>0&&q.right<=innerWidth+1;});
   const rh=Math.max(...rows.slice(0,8).map(tr=>tr.getBoundingClientRect().height));
   return {ci,n:rows.length,vals,ids,vis,rh,sw:document.documentElement.scrollWidth,w:innerWidth,sh:document.documentElement.scrollHeight,h:innerHeight,lab:document.querySelector('.draft-candidates .twpg span')?.textContent||''};});
  log(`${w}: 칸 '현재·잠재력 추정' 보임`,r.ci>=0&&r.vis,JSON.stringify({ci:r.ci,vis:r.vis,lab:r.lab}));
  log(`${w}: 행마다 현재 추정 숫자 또는 ?`,r.n>5&&r.vals.every(v=>v!=null&&/^(\d{2,3}|\?)$/.test(v)),JSON.stringify(r.vals.slice(0,10)));
  log(`${w}: 행 높이 적당(≤64px)`,r.rh<=64,String(r.rh));
  log(`${w}: 가로 넘침 없음`,r.sw<=r.w+1,`${r.sw}>${r.w}`);
  if(w>=1100)log(`${w}: PC 페이지 스크롤 없음`,r.sh<=r.h+2,`${r.sh}>${r.h}`);
  /* 세 명을 골라 선수 정보 '현재' 값과 비교 */
  const pick=[0,Math.floor(r.n/2),r.n-1];
  for(const k of pick){ const id=r.ids[k]; const sv=await page.evaluate(id=>{UI.sheet=id;renderSheet();const e=document.querySelector('#sheet .pf-current-score')||document.querySelector('#sheet .kbar .kb b');const t=e?e.textContent.trim():null;UI.sheet=null;renderSheet();return t;},id);
   log(`${w}: 후보 #${k+1} 표 ${r.vals[k]} = 선수 정보 ${sv}`,sv!=null&&String(sv).replace(/\s.*$/,'')===r.vals[k],`${r.vals[k]} vs ${sv}`); }
  /* 실제 능력이 아니라 추정값: 표 값은 scoutReport(p).cur 기준이어야 한다 */
  const ex=await page.evaluate(ids=>ids.slice(0,10).map(id=>{const p=G.players[id];const rp=scoutReport(p);return typeof rp.cur==='number'?String(dvG(rp.cur,rp.exact)):'?';}),r.ids);
  log(`${w}: 표 값 = 스카우트 추정(scoutReport)`,JSON.stringify(ex)===JSON.stringify(r.vals.slice(0,10)),JSON.stringify({ex,got:r.vals.slice(0,10)}));
  if(shotDir){fs.mkdirSync(shotDir,{recursive:true});await page.evaluate(()=>render());await page.waitForTimeout(150);await page.screenshot({path:path.join(shotDir,`draft-cur-${w}.png`)});}
  log(`${w}: 페이지 오류 없음`,!errors.length,errors.join(' | '));
  await page.close();
 }
}catch(e){console.log('실패 예외 '+(e&&e.stack||e));fail++;}finally{if(browser)await browser.close();await server.close();}
console.log(fail?`실패 ${fail}건`:'모두 통과');process.exit(fail?1:0);})();
