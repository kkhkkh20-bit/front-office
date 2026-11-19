/* 카페 11-19 신인 드래프트 화면 점검: 건너뛰기는 확인 창 뒤에만 실행 · 표 위 회색 안내 글 없음 · 머리글 배경 동일 · 드래프트 집중 모드(하위 탭 숨김·표 폭 증가·나가기)
   사용: node tools/check-draft-screen-1119.cjs  (index.html 필요: bash build.sh)  SHOT_DIR=폴더 를 주면 화면 사진을 남긴다 */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;let fail=0;const log=(n,ok,m)=>{console.log((ok?'통과 ':'실패 ')+n+(ok||!m?'':' '+m));if(!ok)fail++;};try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const page=await browser.newPage({viewport:{width:1366,height:768}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.url);await page.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await page.waitForFunction(()=>typeof newGame==='function'&&UI.title===true);
 /* 드래프트가 열린 날: 창단 드래프트를 끝내고 신인 드래프트를 바로 시작해 우리 차례까지 순번을 옮긴다(엔진 호출 없이 cur만) */
 await page.evaluate(()=>{localStorage.clear();DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;startDraft();G.draft.cur=G.draft.picks.findIndex(x=>x.tid===G.user);UI.dview='list';UI.df={pos:'all',typ:'all',reg:'all',star:false,sort:'rk',seg:'board',more:20};A.go('transfer:draft');render();});
 const dialog=()=>page.evaluate(()=>!!document.querySelector('#cfm [role="dialog"]'));
 const state=()=>page.evaluate(()=>({cur:G.draft.cur,pass:!!G.draft.picks[G.draft.cur].pass,rest:G.draft.rest||null,mine:G.draft.picks[G.draft.cur].tid===G.user}));
 const shotDir=process.env.SHOT_DIR;const shot=async n=>{if(shotDir){fs.mkdirSync(shotDir,{recursive:true});await page.screenshot({path:path.join(shotDir,n+'.png')});}};
 /* 1) 집중 모드(PC FM): 제목 '신인 드래프트', 하위 탭 숨김, 왼쪽 메뉴 접힘, 나가기 버튼 */
 const f1=await page.evaluate(()=>({shell:!!document.querySelector('.shell.fmsh.dfocus'),sub:document.querySelectorAll('.fm-sub nav.subtabs button[data-a="sub"]').length,title:document.querySelector('.fm-context strong')?.textContent.trim(),exit:document.querySelectorAll('[data-a="dfocusOff"]').length,guide:document.querySelectorAll('.guide-bar').length,side:Math.round(document.querySelector('.fmside').getBoundingClientRect().width),main:Math.round(document.querySelector('.drf-main').getBoundingClientRect().width),sw:document.documentElement.scrollWidth,w:innerWidth,sh:document.documentElement.scrollHeight,h:innerHeight}));
 log('집중 모드: 제목·하위 탭 숨김·메뉴 접힘·나가기 버튼',f1.shell&&f1.sub===0&&f1.title==='신인 드래프트'&&f1.exit===1&&f1.guide===0&&f1.side<80,JSON.stringify(f1));
 log('집중 모드: PC 페이지 스크롤 없음',f1.sw<=f1.w+1&&f1.sh<=f1.h+2,JSON.stringify(f1));
 await shot('focus-1366');
 await page.locator('[data-a="dfocusOff"]').first().click();await page.waitForTimeout(150);
 const f2=await page.evaluate(()=>({shell:!!document.querySelector('.shell.fmsh.dfocus'),sub:document.querySelectorAll('.fm-sub nav.subtabs button[data-a="sub"]').length,title:document.querySelector('.fm-context strong')?.textContent.trim(),enter:document.querySelectorAll('[data-a="dfocusOn"]').length,side:Math.round(document.querySelector('.fmside').getBoundingClientRect().width),main:Math.round(document.querySelector('.drf-main').getBoundingClientRect().width)}));
 log('← 영입·계약: 하위 탭·메뉴 복귀, 다시 켜기 버튼',!f2.shell&&f2.sub>3&&f2.title==='영입·계약'&&f2.enter===1&&f2.side>=150,JSON.stringify(f2));
 log('집중 모드에서 후보 표 칸이 더 넓음',f1.main>f2.main+60,`${f1.main} vs ${f2.main}`);
 await page.locator('[data-a="dfocusOn"]').first().click();await page.waitForTimeout(150);
 log('집중 모드 다시 켜기',await page.evaluate(()=>!!document.querySelector('.shell.fmsh.dfocus')));
 /* 2) 표 위 회색 안내 글 없음(ⓘ 도움말만) */
 const g=await page.evaluate(()=>({txt:[...document.querySelectorAll('#app span,#app p')].filter(e=>/이름 · 아마 기록 · 평가 순위/.test(e.textContent||'')&&e.getBoundingClientRect().width>0).length,help:document.querySelectorAll('.dvt .hi-i').length}));
 log('표 위 회색 안내 글 없음 · ⓘ 도움말 있음',g.txt===0&&g.help===1,JSON.stringify(g));
 /* 3) 머리글 배경: '선수' 칸도 나머지와 같은 색(가로 스크롤 때도) */
 const thBg=()=>page.evaluate(()=>{const tw=document.querySelector('.draft-candidates .tw');if(tw)tw.scrollLeft=120;const L=[...document.querySelectorAll('.draft-candidates .candidate-table thead th')].map(t=>getComputedStyle(t).backgroundColor);return {n:L.length,same:L.every(c=>c===L[0]),first:L[0],mid:L[3]};});
 const b1=await thBg();log('PC 머리글 배경 동일(선수 칸 포함)',b1.n>5&&b1.same&&!/rgba\(0, 0, 0, 0\)/.test(b1.first),JSON.stringify(b1));
 /* 4) 건너뛰기: 확인 창 없이는 실행되지 않는다 */
 const s0=await state();log('우리 차례 준비',s0.mine&&!s0.pass,JSON.stringify(s0));
 log("'남은 지명 건너뛰기'는 자동 지명 버튼 묶음 밖 보조 버튼",await page.evaluate(()=>document.querySelectorAll('.drest .row [data-v="pass:0"]').length===0&&!!document.querySelector('.drest .drest-pass.danger')));
 await page.locator('[data-a="passPick"]').first().click();await page.waitForTimeout(100);
 const s1=await state();log('이번 지명 건너뛰기: 누르면 확인 창, 아직 실행 안 됨',await dialog()&&s1.cur===s0.cur&&!s1.pass,JSON.stringify(s1));
 log('확인 창에 되돌릴 수 없음 안내',await page.evaluate(()=>/되돌릴 수 없/.test(document.querySelector('#cfm .cfm').textContent)));
 await shot('cfm-pass-1366');
 await page.locator('[data-a="cfmNo"]').click();await page.waitForTimeout(100);
 const s2=await state();log('취소하면 그대로',!(await dialog())&&s2.cur===s0.cur&&!s2.pass);
 log('A.passPick 직접 호출도 확인 창부터',await page.evaluate(()=>{A.passPick();const d=!!document.querySelector('#cfm [role="dialog"]');const c=G.draft.cur;A.cfmNo();return d&&c===G.draft.cur;}));
 const rng=await page.evaluate(()=>{let n=0;const r0=FO_RNG;FO_RNG=()=>{n++;return r0();};try{A.passPick();A.cfmNo();}finally{FO_RNG=r0;}return n;});log('확인 창은 난수를 쓰지 않음',rng===0,String(rng));
 await page.locator('[data-a="passPick"]').first().click();await page.waitForTimeout(100);await page.locator('[data-a="cfmOk"]').click();await page.waitForTimeout(200);
 const s3=await page.evaluate(()=>({passed:!!G.draft.picks.find((x,i)=>x.tid===G.user&&x.pass),cur:G.draft.cur}));
 log('확인 뒤에는 이번 지명을 건너뜀(기존 저장·진행 로직)',s3.passed&&s3.cur===s0.cur+1,JSON.stringify(s3));
 /* 남은 지명 건너뛰기: 확인 버튼이 2초 뒤에 켜진다. 다음 우리 차례로 옮겨 다시 */
 await page.evaluate(()=>{G.draft.cur=G.draft.picks.findIndex((x,i)=>i>G.draft.cur&&x.tid===G.user);render();});
 await page.locator('.drest .drest-pass').first().click();await page.waitForTimeout(150);
 const r1=await page.evaluate(()=>({dlg:!!document.querySelector('#cfm [role="dialog"]'),dis:document.querySelector('#cfm [data-a="cfmOk"]')?.disabled,txt:document.querySelector('#cfm .cfm')?.textContent||'',rest:G.draft.rest||null,n:(document.querySelector('#cfm .cfm h3')?.textContent.match(/(\d+)번/)||[])[1]}));
 const myLeft=await page.evaluate(()=>G.draft.picks.slice(G.draft.cur).filter(x=>x.tid===G.user).length);
 log('남은 지명 건너뛰기: 확인 창 · 남은 지명 수 · 되돌릴 수 없음 · 확인 버튼 잠김',r1.dlg&&r1.dis===true&&/되돌릴 수 없/.test(r1.txt)&&+r1.n===myLeft&&!r1.rest,JSON.stringify({...r1,txt:undefined,myLeft}));
 await shot('cfm-rest-1366');
 await page.waitForTimeout(2300);
 const r2=await page.evaluate(()=>({dis:document.querySelector('#cfm [data-a="cfmOk"]')?.disabled,rest:G.draft.rest||null}));
 log('2초 뒤 확인 버튼 활성, 그때까지 실행 안 됨',r2.dis===false&&!r2.rest,JSON.stringify(r2));
 await page.locator('[data-a="cfmNo"]').click();await page.waitForTimeout(100);
 log('취소하면 일괄 처리 설정 없음',await page.evaluate(()=>!G.draft.rest&&!document.querySelector('#cfm [role="dialog"]')));
 /* 5) 휴대폰 390: 가로 넘침 없음, 나가기 줄, 머리글 배경 동일 */
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{A.go('transfer:draft');render();window.scrollTo(0,0);});await page.waitForTimeout(300);
 const m=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,w:innerWidth,bar:document.querySelectorAll('nav.dfocus-bar [data-a="dfocusOff"]').length,sub:document.querySelectorAll('nav.subtabs button[data-a="sub"]').length,h1:document.querySelectorAll('.subhead h1').length,tbl:Math.round((document.querySelector('.candidate-table')||{getBoundingClientRect:()=>({width:0})}).getBoundingClientRect().width)}));
 log('휴대폰 390: 가로 넘침 없음 · 하위 탭 숨김 · 나가기 줄 · 표 보임',m.sw<=m.w+1&&m.bar===1&&m.sub===0&&m.tbl>200,JSON.stringify(m));
 const b2=await thBg();log('휴대폰 머리글 배경 동일(선수 칸 포함)',b2.n>5&&b2.same,JSON.stringify(b2));
 await shot('focus-390');
 log('페이지 오류 없음',errors.length===0,errors.join(' | '));
 }finally{await browser?.close();await server.close();}
 assert.equal(fail,0,fail+'개 실패');console.log('신인 드래프트 화면(11-19) 점검 통과');})().catch(e=>{console.error(e);process.exitCode=1;});
