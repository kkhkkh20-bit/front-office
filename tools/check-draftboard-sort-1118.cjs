/* 카페 11-18: 내 드래프트 보드 수동 순서 유지 · '스카우트 추천순 정렬' · 되돌리기 · 자동 정렬 유지(기본 꺼짐) 화면 점검
   사용: node tools/check-draftboard-sort-1118.cjs  (index.html 필요: bash build.sh)  SHOT_DIR=폴더 를 주면 화면 사진을 남긴다 */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;let fail=0;const log=(n,ok,m)=>{console.log((ok?'통과 ':'실패 ')+n+(ok||!m?'':' '+m));if(!ok)fail++;};try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const page=await browser.newPage({viewport:{width:1366,height:768}});
 await page.goto(server.url);await page.waitForSelector('[data-a="tsGo"][data-v="mode"]');await page.waitForTimeout(300);
 const ids=await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);G.tut={done:true,step:99};G.medSet=true;UI.title=false;
   const all=draftRanked();const pick=[all[9],all[2],all[6],all[0],all[4]].map(x=>x.p.id);for(const id of pick)amFollow(id,true);UI.df={pos:'all',typ:'all',reg:'all',star:false,sort:'rk',seg:'mine',more:20};A.go('transfer:draft');render();return pick;});
 const order=()=>page.evaluate(()=>(G.shortlist||[]).filter(id=>G.players[id]&&G.players[id].prospect).slice());
 const rkOf=()=>page.evaluate(()=>{const m=new Map(draftRanked().map(x=>[x.p.id,x.rk]));return (G.shortlist||[]).filter(id=>m.has(id)).map(id=>m.get(id));});
 log('관심 등록 순서대로 보드',JSON.stringify(await order())===JSON.stringify(ids));
 log('자동 정렬 유지는 기본 꺼짐',await page.evaluate(()=>!(G.dbSort&&G.dbSort.auto)&&!!document.querySelector('[data-a="dbAuto"][aria-pressed="false"]')));
 /* 1) 직접 ▲ 버튼으로 바꾼 순서가 3일 진행 · 저장/불러오기 뒤에도 그대로 */
 await page.evaluate(()=>{UI.df.seg='mine';render();});
 await page.locator(`[data-a="dmove"][data-v="${ids[3]}:-1"]`).first().click();
 await page.locator(`[data-a="dmove"][data-v="${ids[3]}:-1"]`).first().click();
 const manual=await order();log('▲로 순서 바꾸기',JSON.stringify(manual)===JSON.stringify([ids[0],ids[3],ids[1],ids[2],ids[4]]),JSON.stringify(manual));
 await page.evaluate(()=>{for(let i=0;i<3;i++)processDay();save();G=JSON.parse(JSON.stringify(G));migrateDraft();render();});
 log('3일 진행·저장/불러오기 뒤 직접 정한 순서 유지',JSON.stringify(await order())===JSON.stringify(manual),JSON.stringify(await order()));
 /* 2) 스카우트 추천순 정렬: 화면의 '스카우트 #n'과 같은 값 · 난수 없음 */
 const rngCalls=fn=>page.evaluate(fn=>{let n=0;const o=Math.random,r0=render,s0=save;Math.random=()=>{n++;return o();};render=()=>{};save=()=>{};try{A[fn]();}finally{Math.random=o;render=r0;save=s0;}render();return n;},fn);
 log('정렬 버튼 표시',await page.locator('[data-a="dbSort"]').count()>0);
 const r1=await rngCalls('dbSort');const rk=await rkOf();log('스카우트 추천순 정렬',rk.every((v,i)=>!i||rk[i-1]<v),JSON.stringify(rk));log('정렬은 난수를 쓰지 않음',r1===0,String(r1));
 const shown=await page.evaluate(()=>[...document.querySelectorAll('.dboard .dbr .dbr-b .muted')].map(e=>+((e.textContent.match(/스카우트 #(\d+)/)||[])[1])).filter(Boolean));
 log('화면에 보이는 스카우트 #도 오름차순',shown.length===5&&shown.every((v,i)=>!i||shown[i-1]<v),JSON.stringify(shown));
 log('되돌리기 버튼 표시',await page.locator('[data-a="dbUndo"]').count()>0);
 const dir=process.env.SHOT_DIR;if(dir){fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:path.join(dir,'draftboard-pc.png')});}
 await page.locator('[data-a="dbUndo"]').first().click();
 log('되돌리기로 정렬 전 순서',JSON.stringify(await order())===JSON.stringify(manual),JSON.stringify(await order()));
 log('되돌리기 뒤 순서 하루 지나도 유지',await page.evaluate(m=>{processDay();render();return JSON.stringify((G.shortlist||[]).filter(id=>G.players[id]&&G.players[id].prospect))===JSON.stringify(m);},manual));
 /* 3) 자동 정렬 유지: 켜면 정렬, 새 후보는 그 순위 자리, 수동 이동하면 꺼짐 */
 await page.waitForTimeout(600);await page.locator(`[data-a="dbAuto"]`).first().click();
 let rk2=await rkOf();log('자동 정렬 켜면 추천순',rk2.every((v,i)=>!i||rk2[i-1]<v)&&await page.evaluate(()=>G.dbSort.auto===true));
 await page.evaluate(()=>{const all=draftRanked();amFollow(all[1].p.id,true);render();});
 rk2=await rkOf();log('자동 정렬 중 새 후보는 순위 자리',rk2.length===6&&rk2.every((v,i)=>!i||rk2[i-1]<v),JSON.stringify(rk2));
 const last=(await order()).slice(-1)[0];await page.locator(`[data-a="dmove"][data-v="${last}:-1"]`).first().click();
 log('직접 옮기면 자동 정렬 꺼짐',await page.evaluate(()=>G.dbSort.auto===false));
 const off=await order();await page.evaluate(()=>{const all=draftRanked();amFollow(all[3].p.id,true);render();});
 const o2=await order();log('자동 꺼짐: 새 후보는 끝에',JSON.stringify(o2.slice(0,-1))===JSON.stringify(off)&&o2.length===off.length+1);
 const before=await order();await page.evaluate(id=>{amFollow(id,false);render();},before[2]);
 log('뺀 후보만 빠지고 나머지 순서 유지',JSON.stringify(await order())===JSON.stringify(before.filter((_,i)=>i!==2)));
 /* 4) AI 구단은 영향 없음 */
 log('AI 구단 보드 상태 무관',await page.evaluate(()=>Object.keys(G.dbSort||{}).every(k=>k==='auto'||k==='undo')));
 /* 5) 화면 맞춤: PC 전체 스크롤 없음, 휴대폰 390 가로 넘침 없음 */
 for(const size of [{width:1366,height:768},{width:1920,height:1080},{width:390,height:844}]){await page.setViewportSize(size);await page.evaluate(()=>{UI.df.seg='mine';A.go('transfer:draft');render();window.scrollTo(0,0);});
   const fit=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,h:innerHeight,sh:document.documentElement.scrollHeight,btn:(()=>{const b=document.querySelector('[data-a="dbSort"]');if(!b)return null;const r=b.getBoundingClientRect();return {l:r.left,r:r.right};})()}));
   log(`화면 맞춤 ${size.width}`,fit.sw<=fit.w+1&&(size.width<900||fit.sh<=fit.h+2)&&fit.btn&&fit.btn.l>=0&&fit.btn.r<=fit.w+1,JSON.stringify(fit));
   if(dir&&size.width===390)await page.screenshot({path:path.join(dir,'draftboard-390.png'),fullPage:true});}
 }finally{await browser?.close();await server.close();}
 assert.equal(fail,0,fail+'개 실패');console.log('드래프트 보드 정렬 점검 통과');})().catch(e=>{console.error(e);process.exitCode=1;});
