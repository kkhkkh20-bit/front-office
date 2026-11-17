/* 카페 UI 제안 8건(11-17) 확인: 데이터 분석 왼쪽 아래 칸 · 능력 탭 성격 · 시즌 통계 단추 아래·포스트시즌 탭 · 래더 아이콘 · F10 캘린더 ·
   외국인 후보 '관찰' 단추 · 캘린더 오른쪽 칸 순서·폭. PC(1920×1080·1440×900)와 휴대폰(390×844)에서 화면 전체 스크롤·가로 넘침·오류가 없는지도 본다.
   화면 사진은 UIFB_OUT(기본 /tmp/uifb-1117)에 남긴다. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const BOOT=()=>{DEMO.on=false;newGame(6);G.tut={done:true,step:99};G.medSet=true;UI.title=false;render();};
(async()=>{const out=process.env.UIFB_OUT||'/tmp/uifb-1117';fs.mkdirSync(out,{recursive:true});
const server=await startHtmlServer(process.env.UIFB_HTML||path.join(__dirname,'../index.html')),browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
try{for(const [W,H] of [[1920,1080],[1440,900],[390,844]]){const pc=W>=1100,c=await browser.newContext({viewport:{width:W,height:H},isMobile:!pc,hasTouch:!pc}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.evaluate(BOOT);
  const shot=n=>p.screenshot({path:path.join(out,`${W}-${n}.png`)});
  const fit=async(what)=>{const r=await p.evaluate(()=>({v:document.scrollingElement.scrollHeight-innerHeight,h:document.documentElement.scrollWidth-innerWidth}));assert.ok(r.h<=1,`${W} ${what}: 가로 넘침 ${r.h}`);if(pc)assert.ok(r.v<=1,`${W} ${what}: PC 화면 전체 세로 스크롤 ${r.v}`);};
  /* 1. 데이터 분석: 분석원 9명이어도 주요 발견·승패 마진 추이가 화면 안에 보인다 */
  await p.evaluate(()=>{anaList();while(G.analysts.length<ANA_MAX)G.analysts.push(mkAnalyst(3));A.go('staff:data');});await p.waitForTimeout(200);
  if(pc){const r=await p.evaluate(()=>{const v=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,h:b.height};};return {n:G.analysts.length,find:v('.dh-find'),trend:v('.dh-trend'),al:(e=>e&&{sh:e.scrollHeight,ch:e.clientHeight})(document.querySelector('.dh-al')),vh:innerHeight};});
    assert.equal(r.n,9);for(const k of ['find','trend']){assert.ok(r[k]&&r[k].h>=120&&r[k].bottom<=r.vh+1&&r[k].top<r.vh-120,`${W} 데이터 분석 ${k} 보임 ${JSON.stringify(r[k])}`);}
    assert.ok(r.al.sh>r.al.ch,'분석원 목록은 칸 안에서 스크롤');await fit('데이터 분석');await shot('1-data');}
  /* 2·3·4. 선수 능력 탭: 보고서 아래 성격, 기록 표 다음 1군/2군 단추, 정규시즌·포스트시즌 탭 */
  const pid=await p.evaluate(()=>{const q=playersOf(G.user).find(x=>!x.isP&&x.hist&&x.hist.some(h=>h.lvl==='퓨처스')&&x.hist.some(h=>h.lvl!=='퓨처스'))||playersOf(G.user).find(x=>!x.isP&&(x.hist||[]).length);
    q.psY={[G.year-1]:{t:G.user,g:5,isP:false,pa:21,ab:18,h:6,d:1,tr:0,hr:1,bb:3,hbp:0,so:4,r:2,rbi:3,sb:0}}; /* 검사용 포스트시즌 기록 */
    UI.cSea=null;UI.cLvl=null;UI.ptab='abil';UI.sheet=q.id;renderSheet();return q.id;});await p.waitForTimeout(250);
  if(pc){const r=await p.evaluate(()=>{const rp=document.querySelector('#sheet .pf-report'),pe=rp&&rp.querySelector('.pf-rp-pers');const st=document.querySelector('#sheet .pf-season-table');const tw=st&&st.querySelector('.tw'),lv=st&&st.querySelector('.st-lvl'),sea=st&&st.querySelector('.st-sea');
      return {pers:pe&&pe.innerText,mg:(()=>{UI.ptab='mgmt';renderSheet();const t=[...document.querySelectorAll('#sheet [data-tip]')].map(e=>e.dataset.tip).join('\n')+'\n'+(document.querySelector('#sheet')?.innerText||'');UI.ptab='abil';renderSheet();return t;})() /* 관리 탭 '선수와의 관계' 성향(설명 i 안) */,lvAfter:!!(tw&&lv&&(tw.compareDocumentPosition(lv)&Node.DOCUMENT_POSITION_FOLLOWING)),sea:sea&&sea.innerText,lvN:lv?lv.querySelectorAll('button').length:0};});
    assert.match(r.pers||'',/프로의식[\s\S]*야망[\s\S]*예민도/,'보고서 아래 성격');const m=r.mg.match(/프로의식 ([^·\n]+?) · 야망 ([^·\n]+?) · 예민도 ([^·\n]+?)(?: · |\n|$)/);assert.ok(m,'관리 탭 성향');for(const w of m.slice(1))assert.ok(r.pers.includes(w),`관리 탭과 같은 평(${w})`);
    if(r.lvN){assert.ok(r.lvAfter,'1군만/2군 단추는 표 아래');}assert.match(r.sea||'',/정규시즌[\s\S]*포스트시즌/,'정규시즌·포스트시즌 탭');
    await fit('선수 능력');await shot('2-player-abil');
    if(r.lvN){await p.click('#sheet .st-lvl [data-v="2"]');assert.equal(await p.evaluate(()=>UI.cLvl),'2','2군만 단추 동작');await p.click('#sheet .st-lvl [data-v="1"]');}
    await p.click('#sheet .st-sea [data-v="ps"]');const ps=await p.evaluate(()=>({t:document.querySelector('#sheet .pf-season-table .tw').innerText,lv:!!document.querySelector('#sheet .pf-season-table .st-lvl'),y:G.year-1}));
    assert.ok(ps.t.includes(String(ps.y))&&/타석/.test(ps.t),'포스트시즌 탭 표');assert.equal(ps.lv,false,'포스트시즌에는 1군/2군 단추 없음');await shot('3-player-ps');
    /* 다른 구단 선수는 성격을 보이지 않는다(관리 탭이 없는 선수) */
    const other=await p.evaluate(()=>{const q=G.players[Object.keys(G.players).find(k=>{const x=G.players[k];return x.team!=null&&x.team!==G.user&&!x.prospect;})];UI.sheet=q.id;renderSheet();return !!document.querySelector('#sheet .pf-rp-pers');});assert.equal(other,false,'다른 구단 선수는 성격 숨김');
    await p.evaluate(()=>{UI.cSea=null;closeSheets();});}
  else{await p.evaluate(()=>{UI.ptab='rec';renderSheet();});const r=await p.evaluate(()=>{const tw=document.querySelector('#sheet .tw'),lv=document.querySelector('#sheet .st-lvl');return {after:!lv||!!(tw.compareDocumentPosition(lv)&Node.DOCUMENT_POSITION_FOLLOWING),sea:!!document.querySelector('#sheet .st-sea')};});assert.ok(r.after&&r.sea,'휴대폰 기록 탭: 단추 아래·시즌 탭');await fit('선수 기록');await shot('2-player-rec');await p.evaluate(()=>closeSheets());}
  /* 5. 래더: PC 왼쪽 메뉴에서 빠지고 위 오른쪽 아이콘(설정 옆), 휴대폰은 메뉴에서 */
  if(pc){const r=await p.evaluate(()=>({side:!!document.querySelector('.fmside [data-v="uld"]'),ico:!!document.querySelector('.fm-r .fm-i[data-a="tab"][data-v="uld"]'),next:document.querySelector('.fm-r .fm-i[data-v="uld"]')?.nextElementSibling?.dataset.v}));
    assert.equal(r.side,false,'왼쪽 메뉴에 래더 없음');assert.ok(r.ico,'위 오른쪽 래더 아이콘');assert.equal(r.next,'cfg:set','설정 바로 옆');
    await p.click('.fm-r .fm-i[data-v="uld"]');await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>UI.tab),'uld');assert.ok(await p.evaluate(()=>!!document.querySelector('.fm-r .fm-i[data-v="uld"].on')&&document.querySelectorAll('.fm-sub [data-v^="uld:"]').length===5),'래더 열림·하위 탭');
    await fit('래더');await shot('5-ladder');await p.evaluate(()=>A.go('uld:rank'));assert.equal(await p.evaluate(()=>UI.tab+':'+curSub('uld')),'uld:rank','래더 하위 경로');
    await p.evaluate(()=>A.go('club:uld'));assert.equal(await p.evaluate(()=>UI.tab),'uld','예전 경로(구단 › 래더)');}
  else{await p.evaluate(()=>A.tab('home'));await p.tap('.bnav [data-a="menu"]');await p.waitForTimeout(200);const b=p.locator('.menu-grid [data-a="tab"][data-v="uld"]');assert.equal(await b.count(),1,'휴대폰 메뉴에 래더');await shot('5-menu');await b.tap();await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>UI.tab),'uld');await fit('래더');}
  /* 6. F10 → 캘린더 */
  if(pc){await p.evaluate(()=>A.tab('home'));await p.keyboard.press('F10');await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>UI.tab),'cal','F10은 캘린더');assert.ok(await p.evaluate(()=>FM_KEYS.find(x=>x[0]==='F10')[1].includes('캘린더')),'단축키 목록');}
  /* 7. 외국인 후보 줄: 협상 왼쪽 '관찰' 단추 */
  await p.evaluate(()=>{(G.fwatch||[]).length=0;A.go('transfer:foreign');});await p.waitForTimeout(250);
  const sel=pc?'.foreign-candidates .fo-act':'.fr-act';const fr=await p.evaluate(s=>{const a=document.querySelector(s);if(!a)return null;const bs=[...a.querySelectorAll('button')];return {txt:bs.map(b=>b.textContent),wi:bs.findIndex(b=>b.dataset.a==='fwatch'),ni:bs.findIndex(b=>b.dataset.a==='negOpen'),id:+bs.find(b=>b.dataset.a==='fwatch').dataset.v};},sel);
  assert.ok(fr&&fr.wi>=0,'관찰 단추');if(fr.ni>=0)assert.ok(fr.wi<fr.ni,'관찰은 협상 왼쪽');
  await fit('외국인');await shot('7-foreign');
  await p.locator(sel+' [data-a="fwatch"]').first().click();await p.waitForTimeout(200);assert.ok(await p.evaluate(id=>fwatchOn(id)&&UI.sheet==null,fr.id),'눌러서 관찰 명단에 올림(선수 화면은 안 열림)');
  if(pc){const vis=await p.evaluate(s=>{const b=document.querySelector(s+' [data-a="fwatch"]').getBoundingClientRect(),t=document.querySelector('.foreign-candidates .sf-tw').getBoundingClientRect();return b.right<=t.right+1;},sel);assert.ok(vis,'관찰 단추가 표 안에 보임');}
  await p.locator(sel+' [data-a="fwatch"]').first().click();await p.waitForTimeout(200);assert.equal(await p.evaluate(id=>fwatchOn(id),fr.id),false,'다시 누르면 뺌');
  /* 8. 캘린더: 오른쪽 순서와 폭 */
  const d=await p.evaluate(()=>{const c=G.cal;for(let d=G.day+1;d<G.day+400;d++){const g=calGame(d);if(g&&g.home&&!g.kind)return d;}return null;});assert.ok(d,'홈경기 날');
  await p.evaluate(d=>{G.day=d-20;UI.calSel=d;A.tab('cal');UI.calSel=d;render();},d);await p.waitForTimeout(250);
  if(pc){const r=await p.evaluate(()=>{const side=document.querySelector('.sch-side'),list=document.querySelector('.sch-list');const idx=s=>{const e=side.querySelector(s);if(!e)return -1;return [...side.querySelectorAll('*')].indexOf(e);};
      return {adv:idx('[data-a="advTo"]'),plan:idx('.gpl-mon'),up:idx('.cal-up'),opp:idx('.sch-op'),promo:idx('.sch-promo'),sw:side.getBoundingClientRect().width,lw:list.getBoundingClientRect().width,advTop:side.querySelector('[data-a="advTo"]').getBoundingClientRect().top,vh:innerHeight};});
    const o=[r.adv,r.plan,r.up,r.opp,r.promo].filter(x=>x>=0);assert.ok(r.adv>=0&&r.promo>=0,'진행 버튼·프로모션 데이 '+JSON.stringify(r));assert.deepEqual(o,[...o].sort((a,b)=>a-b),'오른쪽 순서 '+JSON.stringify(r));
    assert.ok(r.sw>=(W>=1900?700:500),`오른쪽 칸 넓힘 ${r.sw}`);assert.ok(r.advTop<r.vh-60,'진행 버튼이 첫 화면에');await fit('캘린더');await shot('8-calendar');}
  else{const r=await p.evaluate(()=>{const det=document.querySelector('.cal-detail');const adv=det&&det.querySelector('[data-a="advTo"]'),pr=det&&det.querySelector('.promo');return {ok:!!adv&&(!pr||!!(adv.compareDocumentPosition(pr)&Node.DOCUMENT_POSITION_FOLLOWING))};});assert.ok(r.ok,'휴대폰: 진행 버튼이 프로모션보다 위');await fit('캘린더');await shot('8-calendar');}
  assert.deepEqual(errors,[],`${W} 페이지 오류`);console.log(`${W}×${H} 통과`);await c.close();}}
finally{await browser.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
