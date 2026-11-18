/* 카페 국사왕 UI 제안 2건(11-17) 확인:
   1. 선수단 → 전력 구성 묶음 탭: [포지션 배치도 · 1군 야수·투수진 · 부상·재활] [2군 야수 · 2군 투수 · 육성선수] — 2군 유망주를 한 탭에서.
   2. 선수 능력 탭(PC): 1군만·2군 포함·2군만 단추는 시즌 통계 제목 줄(정규시즌·포스트시즌 왼쪽), 계약은 왼쪽 인물 카드 아래,
      오른쪽 열은 신분 → 경력(경력 아래 성격 없음), 아래 줄을 높여 시즌 통계 표가 더 길게, 표 줄 중복 없음.
   1920×1080·1440×900·1366×768·390×844에서 화면 전체 스크롤(PC)·가로 넘침·오류가 없는지도 본다. 사진은 UIFB2_OUT(기본 /tmp/uifb2-1117). */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const BOOT=()=>{DEMO.on=false;newGame(6);G.tut={done:true,step:99};G.medSet=true;UI.title=false;render();};
(async()=>{const out=process.env.UIFB2_OUT||'/tmp/uifb2-1117';fs.mkdirSync(out,{recursive:true});
const server=await startHtmlServer(process.env.UIFB_HTML||path.join(__dirname,'../index.html')),browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
try{for(const [W,H] of [[1920,1080],[1440,900],[1366,768],[390,844]]){const pc=W>=1100,c=await browser.newContext({viewport:{width:W,height:H},isMobile:!pc,hasTouch:!pc}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.evaluate(BOOT);
  const shot=n=>p.screenshot({path:path.join(out,`${W}-${n}.png`)});
  const fit=async(what)=>{const r=await p.evaluate(()=>({v:document.scrollingElement.scrollHeight-innerHeight,h:document.documentElement.scrollWidth-innerWidth}));assert.ok(r.h<=1,`${W} ${what}: 가로 넘침 ${r.h}`);if(pc)assert.ok(r.v<=1,`${W} ${what}: PC 화면 전체 세로 스크롤 ${r.v}`);};
  /* 1. 전력 구성: 육성선수 한 명을 두고(2군 투수 한 명을 육성으로) 묶음 탭 이름·순서와 2군 선수가 모두 2군 묶음에 있는지 */
  const farm=await p.evaluate(()=>{const d0=depth(G.user);const q=d0.futP[d0.futP.length-1];q.ys=true;A.go('roster');A.itab('roster:depth');const d=depth(G.user);return {ids:d.futB.concat(d.futP).map(x=>x.id),ys:q.id};});await p.waitForTimeout(300);
  const R=await p.evaluate(()=>{const lab=el=>el.dataset.wsl;const panels=[...document.querySelectorAll('#app .ws-panels>.ws-panel')];
    return {tabs:[...document.querySelectorAll('#app .ws-pages .ws-page')].map(b=>b.textContent),order:panels.map(lab),cols:+document.querySelector('#app .ws-panels').style.getPropertyValue('--ws-columns'),
      farmIds:panels.filter(e=>['2군 야수','2군 투수','육성선수'].includes(lab(e))).flatMap(e=>[...e.querySelectorAll('[data-a="player"]')].map(b=>+b.dataset.v))};});
  assert.deepEqual(R.order,['포지션 배치도','1군 야수·투수진','부상·재활','2군 야수','2군 투수','육성선수'],'전력 구성 칸 순서 '+JSON.stringify(R.order));
  /* [검수 11-17 #179] 1군에 등록된 채 다친 선수(1군 야수 부상 5일)도 '부상·재활' 칸에 나온다 */
  const inj=await p.evaluate(()=>{const q=playersOf(G.user).find(x=>!x.isP&&!(x.injOut>0));const o=q.injOut,e=q.e1;q.injOut=5;q.e1=true;const h=futSquadView(G.user).injC;q.injOut=o;q.e1=e;return {h,name:q.name};});
  assert.ok(inj.h.includes(inj.name+'(')&&/부상·재활 \d+명/.test(inj.h),'[검수 11-17 #179] 1군 등록 부상 선수가 부상·재활 칸에 없음');
  for(const id of farm.ids)assert.ok(R.farmIds.includes(id),`2군 선수 ${id}가 2군 묶음에 있음`);assert.ok(R.farmIds.includes(farm.ys),'육성선수도 2군 묶음에');
  if(W>=1600)assert.deepEqual(R.tabs,['포지션 배치도 · 1군 야수·투수진 · 부상·재활','2군 야수 · 2군 투수 · 육성선수'],'PC 묶음 탭 이름 '+JSON.stringify(R.tabs));
  if(W>=1600){const up=await p.evaluate(()=>({tools:!!document.querySelector('#app .fm2>.rh-tools [data-a=noEditOpen]'),pages:!!document.querySelector('#app .roster-heading .ws-pages')}));assert.ok(up.tools&&up.pages,'[사용자 11-18] 수·버튼은 하위 탭 줄 빈자리, 묶음 버튼은 본문 첫 줄 '+JSON.stringify(up));} /* 넓은 PC: 위 빈공간에 한 줄씩 올린다 */
  await fit('전력 구성 1');await shot('1-depth');
  if(R.tabs.length>1){await p.locator('#app .ws-pages .ws-page').last().click();await p.waitForTimeout(150);await fit('전력 구성 2');await shot('1-depth-2');
    if(W>=1600){const vis=await p.evaluate(()=>[...document.querySelectorAll('#app .ws-panels>.ws-panel:not([hidden])')].map(e=>e.dataset.wsl));assert.deepEqual(vis,['2군 야수','2군 투수','육성선수'],'2군 탭 한 화면');}}
  /* 2. 선수 능력 탭 */
  await p.evaluate(()=>{const q=playersOf(G.user).filter(x=>!x.isP&&(x.hist||[]).length).sort((a,b)=>b.hist.length-a.hist.length)[0];
    if(!q.hist.some(h=>h.lvl==='퓨처스'))q.hist.push(Object.assign({},q.hist[0],{lvl:'퓨처스',y:q.hist[0].y-1})); /* 2군 기록이 있어야 1군만·2군 단추가 보인다 */
    UI.cSea=null;UI.cLvl=null;UI.ptab='abil';A.player(q.id);});await p.waitForTimeout(350);
  if(pc){const r=await p.evaluate(()=>{const o=document.querySelector('#sheet .pf-overview'),B=s=>{const e=o.querySelector(s);if(!e||!e.getClientRects().length)return null;const b=e.getBoundingClientRect();return {l:b.left,r:b.right,t:b.top,b:b.bottom,h:b.height};};
      const st=o.querySelector('.pf-season-table'),hd=st.querySelector('.st-head'),lv=hd&&hd.querySelector('.st-lvl'),sea=hd&&hd.querySelector('.st-sea');
      const rows=[...st.querySelectorAll('.tw tbody tr')].map(tr=>[...tr.cells].slice(0,2).map(td=>td.textContent).join('|'));
      return {lvHead:!!lv,lvBefore:!!(lv&&sea&&(lv.compareDocumentPosition(sea)&Node.DOCUMENT_POSITION_FOLLOWING)),lvBelow:!!st.querySelector(':scope>.st-lvl'),rows,
        fm:B('.pf-fmcard'),ct:B('.pf-ctc'),id:B('.pf-ident'),car:B('.pf-career'),st:B('.pf-season-table'),idTxt:o.querySelector('.pf-ident')?.innerText||'',ctTxt:o.querySelector('.pf-ctc')?.innerText||'',carTxt:o.querySelector('.pf-career')?.innerText||'',vh:innerHeight,off:[...o.querySelectorAll('.pf-off')].map(e=>e.className)};});
    assert.ok(r.lvHead&&r.lvBefore&&!r.lvBelow,'1군만·2군 단추는 제목 줄, 정규시즌 탭 왼쪽 '+JSON.stringify({h:r.lvHead,b:r.lvBefore,u:r.lvBelow}));
    assert.equal(new Set(r.rows).size,r.rows.length,'시즌 통계 줄 중복 없음 '+r.rows.join(','));
    assert.doesNotMatch(r.carTxt,/성격/,'경력 아래 성격 없음');
    if(W>=1600){assert.ok(r.ct&&r.fm&&Math.abs(r.ct.l-r.fm.l)<2&&r.ct.t>=r.fm.b-1,'계약은 인물 카드 아래 '+JSON.stringify({fm:r.fm,ct:r.ct}));assert.match(r.ctTxt,/^계약/);
      assert.ok(r.id&&r.car&&Math.abs(r.id.l-r.car.l)<2&&r.car.b<=r.id.t+1&&r.id.l>r.st.r&&r.car.h>r.id.h,'오른쪽 열: 위 경력(큰 칸) → 아래 신분(카페 11-18) '+JSON.stringify({id:r.id,car:r.car}));assert.match(r.idTxt,/^신분/);assert.doesNotMatch(r.idTxt,/연봉|FA 자격/,'신분 칸에 계약 없음');
      if(H>=1000)assert.ok(r.st.h>=H*.29,`시즌 통계 칸 높이 ${Math.round(r.st.h)}`);}
    await fit('선수 능력');await shot('2-player-abil');
    await p.click('#sheet .st-head .st-lvl [data-v="2"]');assert.equal(await p.evaluate(()=>UI.cLvl),'2','2군만 단추 동작');assert.ok(await p.evaluate(()=>!!document.querySelector('#sheet .st-head .st-lvl')),'다시 그려도 제목 줄');await p.click('#sheet .st-head .st-lvl [data-v="1"]');
    await p.click('#sheet .st-sea [data-v="ps"]');assert.equal(await p.evaluate(()=>!!document.querySelector('#sheet .pf-season-table .st-lvl')),false,'포스트시즌에는 범위 단추 없음');await p.evaluate(()=>{UI.cSea=null;renderSheet();});
    /* 투수도 같은 배치 */
    await p.evaluate(()=>{const q=playersOf(G.user).filter(x=>x.isP&&(x.hist||[]).length).sort((a,b)=>b.hist.length-a.hist.length)[0];UI.ptab='abil';A.player(q.id);});await p.waitForTimeout(300);await fit('투수 능력');await shot('3-pitcher-abil');
    /* 기록 탭은 예전처럼 표 아래 단추 */
    await p.evaluate(()=>{UI.ptab='rec';renderSheet();});await p.waitForTimeout(150);await fit('선수 기록');}
  else{await fit('선수 능력');await shot('2-player-abil');await p.evaluate(()=>{UI.ptab='rec';renderSheet();});await p.waitForTimeout(150);
    const r=await p.evaluate(()=>{const tw=document.querySelector('#sheet .tw'),lv=document.querySelector('#sheet .st-lvl');return !lv||!!(tw.compareDocumentPosition(lv)&Node.DOCUMENT_POSITION_FOLLOWING);});assert.ok(r,'휴대폰 기록 탭: 단추는 표 아래');await fit('선수 기록');await shot('3-player-rec');}
  await p.evaluate(()=>closeSheets());
  assert.deepEqual(errors,[],`${W} 페이지 오류`);console.log(`${W}×${H} 통과`);await c.close();}}
finally{await browser.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
