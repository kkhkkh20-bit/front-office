/* 카페 11-19 화면 요청 네 가지를 390x844(터치)·1440x900에서 확인한다. 화면 사진은 UICAFE_OUT에 남긴다.
   1) 전체 화면·홈 화면 추가: 휴대폰 전체 메뉴·설정 › 표시에서 전체 화면 단추와 안내가 보이고, 사이트판에 manifest·아이콘이 올라간다(서비스 워커 없음)
   2) 플레잉코치: 33세 이상 우리 국내 선수는 시즌 중에도 '플레잉코치 제안'이 보이고 이유가 달린다. 33세 미만은 보이지 않는다
   3) 정리 모드: '잠재력 ★n 이하 선택'은 화면에 보이는 별 기준으로 고르기만 하고, 방출은 결재를 거친다
   4) 단장 일정 일괄 취소: 이달 목록에서 여러 건을 골라 결재 한 번으로 지운다 */
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs'),{buildSite,appManifest}=require('./build-site.cjs'),{startSiteServer}=require('./lib/site-server.cjs');
const root=path.join(__dirname,'..'),out=process.env.UICAFE_OUT||'/tmp/ui-cafe-1119';
const pngSize=b=>{assert.equal(b.subarray(1,4).toString(),'PNG');return [b.readUInt32BE(16),b.readUInt32BE(20)];};
async function siteCheck(){ /* 배포 묶음: manifest·아이콘·머리말·_headers */
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'uicafe-site-'));
  try{ const {release}=buildSite({root,out:path.join(dir,'site')}),site=path.join(dir,'site');
    const M=JSON.parse(fs.readFileSync(path.join(site,'manifest.webmanifest'),'utf8'));assert.deepEqual(M,appManifest());
    assert.equal(M.display,'standalone');assert.equal(M.name,'프런트야구');assert.equal(M.short_name,'프런트야구');assert.match(M.theme_color,/^#[0-9a-f]{6}$/);assert.equal(M.background_color,M.theme_color);
    const css=fs.readFileSync(path.join(root,'src/css/foundation/00_layout_shell.css'),'utf8');assert.ok(css.includes('--bg:'+M.background_color),'바탕색은 앱 어두운 테마 --bg');
    for(const n of [192,512]){const ic=M.icons.find(x=>x.sizes===n+'x'+n);assert.ok(ic,'아이콘 '+n);assert.equal(ic.type,'image/png');assert.deepEqual(pngSize(fs.readFileSync(path.join(site,ic.src))),[n,n]);assert.ok(release.files.some(f=>f.path===ic.src),'release.json 목록에 '+ic.src);}
    assert.ok(release.files.some(f=>f.path==='manifest.webmanifest'),'release.json 목록에 manifest');
    const html=fs.readFileSync(path.join(site,'index.html'),'utf8'),head=html.slice(0,html.indexOf('</head>'));
    assert.match(head,/<link rel="manifest" href="\.\/manifest\.webmanifest">/);assert.match(head,/<meta name="apple-mobile-web-app-capable" content="yes">/);assert.match(head,/<meta name="mobile-web-app-capable" content="yes">/);assert.match(head,/<link rel="apple-touch-icon" href="\.\/assets\/images\/[0-9a-f]+\.(jpg|png)">/);assert.match(head,/<meta name="theme-color" content="#0d1217">/);
    assert.ok(!/serviceWorker\.register/.test(html)&&!release.files.some(f=>/(^|\/)sw\.js$|service-worker/.test(f.path)),'서비스 워커는 두지 않는다');
    assert.match(fs.readFileSync(path.join(site,'_headers'),'utf8'),/\/manifest\.webmanifest\n  Content-Type: application\/manifest\+json/);
    const srv=await startSiteServer(site);try{const r=await fetch(srv.url+'manifest.webmanifest');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/^application\/manifest\+json/);assert.equal((await fetch(srv.url+'icons/icon-192.png')).headers.get('content-type'),'image/png');}finally{await srv.close();}
    /* 내려받는 한 파일(index.html)에는 manifest 링크를 넣지 않는다(파일로 열면 받을 곳이 없다) */
    assert.ok(!/rel="manifest"/.test(fs.readFileSync(path.join(root,'index.html'),'utf8').slice(0,200000)),'한 파일 판에는 manifest 링크 없음');
    console.log('사이트판 manifest·아이콘 192/512·머리말·_headers 통과');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
(async()=>{fs.mkdirSync(out,{recursive:true});await siteCheck();
const server=await startHtmlServer(process.env.UICAFE_HTML||path.join(root,'index.html')),browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
try{for(const [width,height] of [[390,844],[1440,900]]){const mob=width<1100,c=await browser.newContext({viewport:{width,height},isMobile:mob,hasTouch:mob}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
const hit=async sel=>{const l=p.locator(sel).first();if(mob)await l.tap();else await l.click();}; /* tap·click이 화면 안으로 옮기고, 다시 그려져도 스스로 다시 찾는다 */
const into=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'center'});},sel);
const shot=n=>p.screenshot({path:path.join(out,`${width}-${n}.png`)});
const noOver=async w=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),w+': 가로 넘침 없음');
const noPageScroll=async w=>{if(!mob)assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2),w+': PC 페이지 스크롤 없음');};
const minFont=async(sel,w)=>{if(mob){const f=await p.evaluate(s=>Math.min(...[...document.querySelectorAll(s+', '+s+' *')].filter(e=>e.offsetParent&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>parseFloat(getComputedStyle(e).fontSize))),sel);assert.ok(f>=10,`${w}: 글자 ${f}px`);}};
const fx=await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.fOkY=G.year;G.day=KD(7,31);G.res=null;G.stops=[];G.evs=[];G.offers=[];for(const m of G.mail){m.read=true;m.closed={text:'확인 완료'};}UI.title=false;
  G.gmPlan={};gmPlanBulk(KD(8,16),'영남','upto');const S=gmSchools(),sch=S.find(s=>s.reg==='영남')||S[0];gmPlanSet(KD(8,19),'school',sch.n);gmPlanBulk(KD(8,31),'all','fut');
  const L=domestic(G.user).filter(x=>!x.ys&&!(x.joinY>G.year)).sort((a,b)=>b.age-a.age),old=L[0],young=L[L.length-1];old.age=Math.max(old.age,34);young.age=Math.min(young.age,25);
  UI.tab='home';render();return {old:old.id,young:young.id,period:period(),full:fullOk(),school:sch.n,trip:Object.keys(G.gmPlan).map(Number).filter(d=>G.gmPlan[d].k==='scout').sort((a,b)=>a-b),fut:Object.keys(G.gmPlan).map(Number).filter(d=>G.gmPlan[d].k==='fut')};});
assert.equal(fx.period,'season');assert.ok(fx.trip.length>=12&&fx.fut.length>0,'일정 준비');

/* ---- 1) 전체 화면: 전체 메뉴(휴대폰)와 설정 › 표시 ---- */
assert.match(await p.evaluate(()=>document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.content||''),/yes/);
if(mob){assert.equal(await p.locator('.fullbtn').evaluateAll(L=>L.filter(e=>e.offsetParent).length),0,'휴대폰 위 줄에는 전체 화면 단추를 늘리지 않는다');
  await hit('.bnav [data-a="menu"]');await p.locator('#sheet [aria-label="전체 메뉴"]').waitFor();
  if(fx.full){const b=p.locator('#sheet .menu-full[data-a="fullTg"]');await into('#sheet .menu-full');assert.ok(await b.isVisible(),'전체 메뉴에 전체 화면 단추');const r=await b.boundingBox();assert.ok(r.height>=40&&r.x>=0&&r.x+r.width<=width+1,'전체 화면 단추 크기·위치 '+JSON.stringify(r));assert.match(await b.innerText(),/전체 화면/);await minFont('#sheet .menu-full','전체 메뉴');await shot('1-menu-fullscreen');}
  await p.evaluate(()=>{UI.menu=false;closeSheets();renderSheet();});}
await p.evaluate(()=>{UI.it=Object.assign(UI.it||{},{setg:'view'});A.go('cfg:set');});
{const card=p.locator('.set-full').first();await into('.set-full');assert.ok(await card.isVisible(),'설정에 전체 화면 칸');assert.match(await card.innerText(),/주소창 없이 쓰려면: 브라우저 메뉴 › 홈 화면에 추가/);
  if(fx.full){const b=card.locator('[data-a="fullTg"]');assert.ok(await b.isVisible(),'설정의 전체 화면 단추');if(mob)assert.ok((await b.boundingBox()).height>=40,'설정 전체 화면 단추 높이');
    /* 눌러서 실제로 전체 화면 요청이 나가는지(헤드리스에서도 requestFullscreen 호출은 확인할 수 있다) */
    await p.evaluate(()=>{window.__fs=0;const e=document.documentElement,o=e.requestFullscreen||e.webkitRequestFullscreen;e.requestFullscreen=e.webkitRequestFullscreen=function(){window.__fs++;return Promise.resolve();};window.__fsO=o;});await hit('.set-full [data-a="fullTg"]');assert.equal(await p.evaluate(()=>window.__fs),1,'전체 화면 요청');}
  await minFont('.set-full','설정 전체 화면 칸');await noOver('설정');await noPageScroll('설정');await shot('1-settings-fullscreen');}

/* ---- 2) 플레잉코치: 시즌 중 33세 이상은 보이고 이유가 달린다 ---- */
for(const compact of [false,true]){await p.evaluate(({id,compact})=>{try{localStorage.setItem('fo-act-mode',compact?'compact':'all');}catch(e){}A.player(id);},{id:fx.old,compact});
  await p.locator('[data-a="pcWhyTip"]').first().waitFor({state:'attached'});if(compact){await hit('.qacts [data-mmenu]:visible');}await p.waitForTimeout(400);/* 선수 화면은 열린 뒤 한 번 더 그린다 */await p.evaluate(()=>[...document.querySelectorAll('[data-a="pcWhyTip"]')].find(e=>e.offsetParent)?.scrollIntoView({block:'nearest',inline:'center'}));const b=p.locator('[data-a="pcWhyTip"]:visible').first();assert.ok(await b.isVisible(),'플레잉코치 제안 항목이 보임 '+(compact?'(⋯ 메뉴)':'(버튼)'));assert.equal(await b.getAttribute('aria-disabled'),'true');assert.match(await b.getAttribute('title'),/비시즌에만 제안할 수 있습니다/);assert.match(await b.innerText(),/플레잉코치 제안/);
  if(compact)assert.match(await b.innerText(),/비시즌에만 제안할 수 있습니다/,'⋯ 메뉴는 항목 아래에 이유 한 줄');
  if(mob){const r=await b.boundingBox();assert.ok(r.height>=40,'플레잉코치 항목 높이 '+r.height);}await minFont('[data-a="pcWhyTip"]','플레잉코치 항목');
  if(!compact){const before=await p.evaluate(()=>JSON.stringify(G.pcoach||{}));/* aria-disabled라 playwright는 '꺼짐'으로 보지만 실제 손가락·마우스는 누를 수 있다 */if(mob)await b.tap({force:true});else await b.click({force:true});await p.waitForFunction(()=>/플레잉코치 제안: .*비시즌/.test(document.getElementById('toast')?.textContent||''));assert.equal(await p.evaluate(()=>JSON.stringify(G.pcoach||{})),before,'이유만 알리고 아무것도 바꾸지 않는다');await noOver('선수 화면');await shot('2-playing-coach-season');await p.evaluate(()=>document.getElementById('toast')?.remove());}
  else await shot('2-playing-coach-compact');
  await p.evaluate(()=>{try{mmClose();}catch(e){}});}
await p.evaluate(id=>{try{localStorage.setItem('fo-act-mode','all');}catch(e){}A.player(id);},fx.young);await p.waitForFunction(id=>UI.sheet===id||document.querySelector('.qacts'),fx.young);
assert.equal(await p.locator('[data-a="pcWhyTip"],[data-a="pcOffer"]').count(),0,'33세 미만은 항목을 늘리지 않는다');
/* 비시즌이고 조건이 맞으면 원래 제안 버튼 */
const off=await p.evaluate(id=>{const d0=G.day;G.day=KD(12,20);const per=period(),pl=G.players[id],why=pcWhy(pl,G.user);A.player(id);const el=document.querySelector('[data-a="pcOffer"],[data-a="pcWhyTip"]');const r={per,why,a:el&&el.dataset.a,t:el&&el.title};G.day=d0;closeSheets();render();renderSheet();return r;},fx.old);
if(off.per!=='season'){assert.equal(off.a,off.why?'pcWhyTip':'pcOffer','비시즌: 이유가 없으면 제안, 있으면 그 이유');if(off.why)assert.ok(off.t.startsWith(off.why)&&!/스토브리그/.test(off.t),'비시즌에는 다른 이유를 그대로');}
/* 코치진 화면 안내(axSec, 설명을 접어 둔 화면은 i 말풍선 안) */
assert.match(await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=axSec();return d.textContent;}),/플레잉코치는 33세 이상 우리 선수의 선수 화면에서 '플레잉코치 제안'으로 맡깁니다/,'코치진 화면 안내 한 줄');

/* ---- 3) 정리 모드: 잠재력 별로 고르기 → 결재 ---- */
await p.evaluate(()=>{closeSheets();UI.tab='roster';UI.rosterTeam=null;render();A.trimOn();});await p.locator('.trimc .trim-q').waitFor();
const pot=await p.evaluate(()=>{const st=x=>{const rp=scoutReport(x);return rp.ofp==null?null:potTierP(rp,x).st;};const P=trimPool();return {n:rosterN(G.user),all:P.length,s1:P.filter(x=>st(x)!=null&&st(x)<=1).map(x=>x.id).sort(),s2:P.filter(x=>st(x)!=null&&st(x)<=2).map(x=>x.id).sort(),hid:P.filter(x=>x.pot!=null).length,non:domestic(G.user).filter(x=>x.ys).map(x=>x.id).concat(Object.values(G.players).filter(x=>x.team===G.user&&x.foreign).map(x=>x.id))};});
assert.ok(pot.s2.length>0,'별 2개 이하 선수가 있는 준비 상태');assert.ok(pot.s2.length<pot.all,'전원이 대상은 아님');
for(const n of [1,2]){const b=p.locator(`.trimc [data-a="trimPot"][data-v="${n}"]`);assert.match(await b.innerText(),new RegExp(`잠재력 ★${n} 이하 선택 · ${pot['s'+n].length}명`));if(mob){const r=await b.boundingBox();assert.ok(r&&r.height>=40,'고르기 단추 높이 '+JSON.stringify(r)+await p.evaluate(()=>{const e=document.querySelector('.trim-q .btn'),c=getComputedStyle(e);return ' '+c.minHeight+' '+c.display+' '+e.parentElement.parentElement.className+' '+getComputedStyle(e.parentElement).display;}));}}
await hit('.trimc [data-a="trimPot"][data-v="2"]');
assert.deepEqual(await p.evaluate(()=>[...UI.trimSel].sort()),pot.s2,'별 2개 이하만 고름(화면 별 기준)');assert.ok(!pot.s2.some(id=>pot.non.includes(id)),'외국인·육성선수는 고르지 않음');
assert.equal(await p.evaluate(()=>rosterN(G.user)),pot.n,'고르기만 하고 방출하지 않음');
assert.equal(await p.locator('.trimc .tgrid .on[data-a="trimSel"], .trimc .tgrid [data-a="trimSel"].on').count(),pot.s2.length,'고른 선수 카드가 모두 화면에 있음');
assert.match(await p.locator('.trimc [data-a="relBatch"]').innerText(),new RegExp(`고른 ${pot.s2.length}명 방출`));await minFont('.trimc .trim-q','잠재력 고르기 줄');await noOver('정리 모드');await noPageScroll('정리 모드');
await into('.trimc .trim-q');await shot('3-trim-potential');
await hit('.trimc [data-a="relBatch"]');await p.locator('#cfm [role="dialog"]').waitFor();const doc=await p.locator('#cfm [role="dialog"]').innerText();assert.match(doc,new RegExp(`선수 ${pot.s2.length}명 방출`));assert.match(doc,/방출 정산금 합계/);assert.match(doc,/되돌릴 수 없습니다/);
assert.equal(await p.evaluate(()=>rosterN(G.user)),pot.n,'결재 전에는 그대로');await shot('3-trim-confirm');await hit('#cfm [data-a="cfmNo"]');assert.equal(await p.evaluate(()=>rosterN(G.user)),pot.n,'결재를 닫으면 그대로');
if(pot.s1.length!==pot.s2.length){await hit('.trimc [data-a="trimPot"][data-v="1"]');assert.deepEqual(await p.evaluate(()=>[...UI.trimSel].sort()),pot.s1,'별 1개 이하로 다시 고르면 그만큼만');}
await p.evaluate(()=>A.trimClose());

/* ---- 4) 단장 일정 일괄 취소 ---- */
await p.evaluate(()=>{UI.calYM={y:G.year,m:8};UI.calSel=KD(8,1);A.go('cal');});
if(mob){const tab=p.locator('button:not(.gpl-mr)',{hasText:/8월 단장 일정|이번 달 단장 일정/}).first();if(await tab.count())await tab.tap();}
await p.locator('.gpl-mon').waitFor({state:'visible'});const plans0=await p.evaluate(()=>Object.keys(G.gmPlan).length);
assert.equal(await p.locator('.gpl-mon .gpl-pk').count(),0,'평소에는 고르기 칸이 없다');await hit('.gpl-mon [data-a="gplEdit"]');
const rows=p.locator('.gpl-mon .gpl-pk');assert.ok(await rows.count()>=3,'고를 줄');
for(const r of await rows.all()){const b=await r.boundingBox();assert.ok(b.height>=40,'줄 높이 '+b.height);assert.ok(b.x>=0&&b.x+b.width<=width+1,'줄이 화면 안');}
{const g=await p.locator('.gpl-mon .gpl-go').boundingBox();assert.ok(g.height>=40&&g.x>=0&&g.x+g.width<=width+1,'취소 단추 크기·위치');}assert.ok(await p.locator('.gpl-mon .gpl-go').isDisabled(),'고르기 전에는 꺼짐');
const nRow=await rows.count();await hit('.gpl-mon [data-a="gplAll"]');assert.equal(await p.locator('.gpl-mon .gpl-pk.on').count(),nRow,'모두 고르기');await hit(`.gpl-mon .gpl-pk:has-text("${fx.school} 방문")`);const nPick=nRow-1;
assert.match(await p.locator('.gpl-mon .gpl-go').innerText(),new RegExp(`고른 ${nPick}건 취소 · ${fx.trip.length+fx.fut.length}일`));await minFont('.gpl-mon','이달 단장 일정');await noOver('일괄 취소');await noPageScroll('일괄 취소');
await into('.gpl-mon .gpl-go');await shot('4-bulk-cancel-pick');
await hit('.gpl-mon .gpl-go');await p.locator('#cfm [role="dialog"]').waitFor();assert.match(await p.locator('#cfm [role="dialog"]').innerText(),new RegExp(`단장 일정 ${nPick}건 취소`));assert.equal(await p.evaluate(()=>Object.keys(G.gmPlan).length),plans0,'결재 전에는 그대로');await shot('4-bulk-cancel-confirm');
await hit('#cfm [data-a="cfmOk"]');const left=await p.evaluate(()=>({k:Object.values(G.gmPlan).map(x=>x.k),ed:!!UI.gplEdit}));
assert.deepEqual(left.k,['school'],`출장 ${fx.trip.length}일·2군 관전 ${fx.fut.length}일을 누름 5번(일괄 취소·모두 고르기·남길 줄 빼기·취소·결재)으로 지우고 고교 방문은 남는다`);assert.equal(left.ed,false,'끝나면 고르기 모드를 닫는다');
assert.ok(await p.locator('.gpl-mon .gpl-mr',{hasText:fx.school+' 방문'}).count()>0,'남은 일정은 목록에 그대로');await noOver('일괄 취소 뒤');await shot('4-bulk-cancel-done');
assert.deepEqual(errors,[]);console.log(width+' 전체 화면 안내·플레잉코치 항목·잠재력 고르기·일정 일괄 취소 통과');await c.close();}}finally{await browser.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
