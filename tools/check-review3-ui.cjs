/* 외부 검수 11-17(ui3r) 회귀: 계약 금액 칸을 제출 때 함께 읽기 · 결재 창 초점 가두기/돌려주기·제목 연결 ·
   휴대폰 표 열 넘김 초점 유지 · 창단 드래프트 관심 별 aria-pressed · 제보용 정보 빌드 ID */
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const exe=process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium';
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;try{
browser=await chromium.launch({executablePath:exe});const p=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(server.url);
const active=()=>p.evaluate(()=>{const a=document.activeElement;return a?{tag:a.tagName,a:a.dataset?.a||'',label:a.getAttribute('aria-label')||'',inCfm:!!a.closest('#cfm'),id:a.id||''}:null;});

/* 20. 창단 드래프트 관심 별: aria-pressed가 표시와 같이 바뀐다 */
await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();G.tut={done:true,step:99};G.medSet=true;UI.title=false;render();});
const star=p.locator('button.fds[data-a="star"]').first();await star.waitFor();const sid=await star.getAttribute('data-v');
const pressed=async want=>{const ok=await p.waitForFunction(([id,want])=>{const b=document.querySelector(`button.fds[data-a="star"][data-v="${id}"]`);return b&&b.getAttribute('aria-pressed')===want&&(G.shortlist||[]).includes(+id)===(want==='true');},[sid,want],{timeout:3000}).then(()=>true,()=>false);assert.ok(ok,'관심 별 aria-pressed='+want+' 표시·관심 목록과 일치');};
await pressed('false');await star.click();await pressed('true');
await p.waitForTimeout(600);await p.locator(`button.fds[data-a="star"][data-v="${sid}"]`).click();await pressed('false');

await p.evaluate(()=>{fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;render();});

/* 1 [P1]. 외국인: 보장 8.40억(상한 초과로 거절) → 인센티브 5.60억으로 낮추면 결재 창과 실제 제안이 8.40억 */
await p.evaluate(()=>{closeSheets();const q=G.players[G.fmarket.find(id=>G.players[id]?.team==null&&G.players[id]?.foreign==='용병')];window._fid=q.id;UI.fo={id:q.id,g:700,i:700,msg:''};A.negOpen('fm:'+q.id);});
const g=p.locator('[data-money="fo:g"]'),inc=p.locator('[data-money="fo:i"]');await g.waitFor();
assert.deepEqual([await g.inputValue(),await inc.inputValue()],['7.00','7.00']);
await g.fill('8.40');assert.equal(await g.getAttribute('aria-invalid'),'true','합계 상한 초과는 거절');assert.equal(await p.evaluate(()=>UI.fo.g),700);
await inc.fill('5.60');assert.equal(await g.getAttribute('aria-invalid'),'false','인센티브를 낮추면 보장 칸도 다시 유효');assert.equal(await inc.getAttribute('aria-invalid'),'false');
assert.deepEqual(await p.evaluate(()=>[UI.fo.g,UI.fo.i]),[840,560],'두 칸 모두 계약안에 반영');
await p.evaluate(()=>A.foGo(String(window._fid)));
const lines=await p.evaluate(()=>UI.cfm&&UI.cfm.doc.lines.join('\n'));const m840=await p.evaluate(()=>money(840));assert.ok(lines&&lines.includes(m840),'결재 창 보장액 '+m840+': '+lines);
assert.ok(!lines.includes(await p.evaluate(()=>money(700))),'옛 7억이 남지 않음');
await p.evaluate(()=>A.cfmNo());
/* 화면 값과 저장값이 어긋난 상태(입력 이벤트 없이 바뀐 칸)도 제출 때 다시 읽는다 */
await p.evaluate(()=>{document.querySelector('[data-money="fo:g"]').value='8.00';document.querySelector('[data-money="fo:i"]').value='6.00';A.foGo(String(window._fid));});
assert.deepEqual(await p.evaluate(()=>[UI.fo.g,UI.fo.i]),[800,600],'제출 때 모든 칸을 함께 읽어 반영');assert.ok(await p.evaluate(()=>UI.cfm.doc.lines[0].includes(money(800))));await p.evaluate(()=>A.cfmNo());
await p.evaluate(()=>{document.querySelector('[data-money="fo:g"]').value='9.00';A.foGo(String(window._fid));});
assert.equal(await p.evaluate(()=>!!UI.cfm),false,'합계 초과면 결재 창을 띄우지 않음');assert.deepEqual(await p.evaluate(()=>[UI.fo.g,UI.fo.i]),[800,600],'거절된 조합은 반영하지 않음');

/* 같은 방식의 협상 테이블(연봉 협상·FA·비FA 다년): 잘못 입력했다 고친 금액, 입력 이벤트 없이 바뀐 칸 모두 제출값과 같다 */
await p.evaluate(()=>{closeSheets();UI.fo=null;const q=domestic(G.user).find(canExtend);window._eid=q.id;A.ngtOpen('ext:'+q.id);A.ngtSet('years:=4');window._ea=Math.ceil(ngtExtDem(q,4)*3)+3;});
const an=p.locator('[data-money="ngt:annual"]');await an.fill('abc');assert.equal(await an.getAttribute('aria-invalid'),'true');
await p.locator('[data-money="ngt:opt"]').fill('0.02');await p.evaluate(()=>{document.querySelector('[data-money="ngt:annual"]').value=(window._ea/100).toFixed(2);A.ngtSubmit();});
assert.deepEqual(await p.evaluate(()=>{const q=G.players[_eid],T=q.extNext?.terms;return [q.extNext?.annual??q.sal,T?.opt??q.opt?.a];}),await p.evaluate(()=>[_ea,2]),'비FA 다년 실제 반영 금액');
await p.evaluate(()=>{closeSheets();const q=domestic(G.user).find(x=>x.id!==_eid&&!x.extNext);window._sid=q.id;q.newSal=120;G.contract={y:G.year,done:false,ended:[q.id],neg:{[q.id]:{off:120,ask:120,cur:null,st:'open',wk:-1}}};A.ngtOpen('sal:'+q.id);});
await an.fill('-1');assert.equal(await an.getAttribute('aria-invalid'),'true');await p.evaluate(()=>{document.querySelector('[data-money="ngt:annual"]').value='1.23';A.ngtSubmit();});
assert.equal(await p.evaluate(()=>G.players[_sid].newSal),123,'연봉 협상: 화면 금액 그대로 합의');

/* 6·9. 결재 창: 제목 연결, 열면 초점이 창 안, Tab/Shift+Tab은 창 안에서만, 닫으면 연 버튼으로 */
await p.evaluate(()=>{closeSheets();render();const b=document.createElement('button');b.id='cfmTrig';b.textContent='결재 열기';b.dataset.a='cfmTrigTest';b.style.cssText='position:fixed;left:40%;bottom:40%;z-index:99999';document.body.append(b);A.cfmTrigTest=()=>{};b.addEventListener('click',()=>{UI.cfm={k:'cfmTrigTest',v:'',doc:{subj:'초점 확인',lines:['한 줄'],noMail:true}};cfmRender();});});
await p.locator('#cfmTrig').focus();await p.keyboard.press('Enter');
assert.equal(await p.evaluate(()=>{const d=document.querySelector('#cfm [role="dialog"]');const id=d.getAttribute('aria-labelledby');return id&&document.getElementById(id)?.textContent;}),'초점 확인','aria-labelledby가 제목을 가리킴');
assert.equal((await active()).inCfm,true,'열면 초점이 창 안');
const seen=[];for(let i=0;i<5;i++){await p.keyboard.press('Tab');const a=await active();assert.equal(a.inCfm,true,'Tab '+i+' 창 밖으로 나가지 않음');seen.push(a.a);}
assert.ok(seen.includes('cfmOk')&&seen.includes('cfmNo'),'두 버튼을 돈다 '+seen);
for(let i=0;i<3;i++){await p.keyboard.press('Shift+Tab');assert.equal((await active()).inCfm,true,'Shift+Tab 창 안');}
await p.keyboard.press('Escape');await p.waitForTimeout(30);assert.equal(await p.evaluate(()=>!!UI.cfm),false);assert.equal((await active()).id,'cfmTrig','닫으면 연 버튼으로 초점 복귀');
await p.locator('#cfmTrig').click();await p.locator('#cfm [data-a="cfmNo"]').click();await p.waitForTimeout(30);assert.equal((await active()).id,'cfmTrig','취소 버튼으로 닫아도 복귀');
await p.evaluate(()=>{document.getElementById('cfmTrig').remove();delete A.cfmTrigTest;});
/* 길게 진행 창도 같은 초점 규칙 */
await p.evaluate(()=>A.advMore());assert.equal((await active()).inCfm,true,'길게 진행 창 초점');for(let i=0;i<9;i++){await p.keyboard.press('Tab');assert.equal((await active()).inCfm,true);}await p.evaluate(()=>A.advMoreX());

/* 19. 제보용 정보: 사이트 빌드 ID·커밋 */
assert.match(await p.evaluate(()=>fbInfoText()),/버전 \S+ · 빌드 정보 없음/,'단독 파일은 빌드 정보 없음 표기');
await p.evaluate(()=>{for(const [n,c] of [['fronttime-build','0123456789abcdef'],['fronttime-commit','fedcba987654']]){const m=document.createElement('meta');m.name=n;m.content=c;document.head.append(m);}});
assert.match(await p.evaluate(()=>fbInfoText()),/버전 \S+ · 빌드 0123456789abcdef · 커밋 fedcba9 · /,'사이트 빌드 ID와 커밋');

/* 7. 휴대폰 선수 명단 '다음 열': Enter 뒤 초점이 BODY로 빠지지 않는다 */
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{closeSheets();A.tab('roster');});await p.waitForTimeout(300);
const next=p.locator('.twpg button[aria-label="다음 열"]:not([disabled])').first();await next.waitFor({timeout:5000});
const pg0=await p.locator('.twpg b').first().innerText();await next.focus();await p.keyboard.press('Enter');
let a=await active();assert.notEqual(a.tag,'BODY','Enter 뒤 초점 유지');assert.match(a.label,/다음 열|앞 열/);
assert.notEqual(await p.locator('.twpg b').first().innerText(),pg0,'열 묶음이 넘어감');
const last=await p.evaluate(()=>document.activeElement.getAttribute('aria-label'));if(last==='다음 열'){await p.keyboard.press('Enter');a=await active();assert.notEqual(a.tag,'BODY');}
await p.keyboard.press('Shift+Tab');await p.keyboard.press('Tab');
const prev=p.locator('.twpg button[aria-label="앞 열"]:not([disabled])').first();await prev.focus();await p.keyboard.press('Enter');a=await active();assert.notEqual(a.tag,'BODY','앞 열 Enter 뒤 초점 유지');assert.match(a.label,/앞 열|다음 열/);
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'390px 가로 넘침 없음');

assert.deepEqual(errors,[]);console.log('검수 11-17 ui3r: 외국인 보장·인센티브 동시 검증·결재 금액 일치 · 협상 테이블 제출값 일치 · 결재 창 초점 가두기/복귀·제목 연결 · 표 열 넘김 초점 · 관심 별 aria-pressed · 제보 빌드 ID');
}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
