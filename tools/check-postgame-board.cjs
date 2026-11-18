/* 경기 후 전광판(사용자 11-18): 9회 경기·연장 경기·홈팀 9회말 X 경기에서
   그래픽 중계 마지막 화면·박스스코어·경기 결과 카드에 전광판이 나오고, 이닝 점수·R/H/E/B·승패 투수가 기록과 맞으며,
   1366·1600·390 폭에서 가로 넘침이 없는지(이닝 칸은 판 안에서만 가로 이동, R/H/E/B는 늘 보임) 확인한다. SHOTS=폴더 를 주면 화면을 남긴다. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;const errors=[];const check=(yes,msg)=>{if(!yes)errors.push(msg);};const shots=process.env.SHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
 try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--disable-webgl']});const page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',r=>r.fulfill({body:'',contentType:'text/css'}));await page.goto(server.url,{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-a="tsGo"][data-v="mode"]');await page.waitForTimeout(300);
  /* 세 종류 경기를 찾을 때까지 실제 경기를 돌린다(엔진은 그대로, 기록만 남긴다) */
  const found=await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open;for(const t of G.teams)setEntry(t.id);const op=G.teams.find(t=>t.id!==G.user).id;G.games=[];
   const want={reg:null,extra:null,x:null};for(let i=0;i<160&&!(want.reg&&want.extra&&want.x);i++){G.day++;const home=i%2?G.user:op,away=home===G.user?op:G.user;const g=simGame(G.day,home,away,false);applyGame(G.day,home,away,g,false);const r=gameRecord(G.day,home,away,g,'');const len=Math.max(r.line.a.length,r.line.h.length);
    if(len>9&&r.hs!==r.as&&!want.extra)want.extra=r;else if(len===9&&r.line.h.includes('X')&&!want.x)want.x=r;else if(len===9&&!r.line.h.includes('X')&&r.hs!==r.as&&!want.reg)want.reg=r;for(const t of G.teams)setEntry(t.id);}
   G.games=[want.reg,want.extra,want.x].filter(Boolean);G.games.forEach(r=>r.att=r.att||12345);return {reg:!!want.reg,extra:!!want.extra,x:!!want.x,kinds:G.games.map(r=>r===want.reg?'reg':r===want.extra?'extra':'x')};});
  check(found.reg&&found.x,'9회 경기·9회말 X 경기를 만들지 못함 '+JSON.stringify(found));if(!found.extra)console.warn('연장 경기를 찾지 못해 연장 칸은 기록을 고쳐 확인합니다');
  if(!found.extra)await page.evaluate(()=>{const r=JSON.parse(JSON.stringify(G.games[0]));r.gid=99999;r.line.a.push(0,0,1);r.line.h.push(0,0,0);r.hits.a.push(0,1,1);r.hits.h.push(0,0,0);r.as+=1;r.hs=r.as-1;if(r.hs<0){r.hs=0;r.as=1;}G.games.splice(1,0,r);});
  const kinds=['reg','extra','x'];
  /* 기록과 맞는지: 이닝 점수·R/H·승패 */
  const data=await page.evaluate(()=>G.games.map((g,i)=>{const host=document.createElement('div');host.innerHTML=pgBoard(g);document.body.appendChild(host);const b=host.querySelector('.pgb');const cols=[...b.querySelectorAll('.pgb-inn .pgb-col')];const cellsOf=row=>cols.map(c=>c.children[row].textContent);
   const tot=[...b.querySelectorAll('.pgb-tot .pgb-col')].map(c=>[c.children[0].textContent,c.children[1].textContent,c.children[2].textContent]);const n=Math.max(9,g.line.a.length,g.line.h.length);
   const want=k=>Array.from({length:n},(_,j)=>g.line[k][j]==null?'':String(g.line[k][j]));const on=[...b.querySelectorAll('.pgb-inn i.pgb-on')].length,wantOn=[...g.line.a,...g.line.h].filter(v=>typeof v==='number'&&v>0).length;
   const r={i,cols:cols.length,n,a:JSON.stringify(cellsOf(1))===JSON.stringify(want('a')),h:JSON.stringify(cellsOf(2))===JSON.stringify(want('h')),R:tot[0]&&tot[0][1]===String(g.as)&&tot[0][2]===String(g.hs),H:tot[1]&&+tot[1][1]===g.hits.a.reduce((x,y)=>x+y,0),heads:tot.map(t=>t[0]).join(''),on:on===wantOn,x:!!b.querySelector('.pgb-inn i.pgb-x'),xWant:g.line.h.includes('X'),
    w:b.querySelector('.pgb-d.w b')?.textContent||'',l:b.querySelector('.pgb-d.l b')?.textContent||'',wRec:b.querySelector('.pgb-d.w small')?.textContent||'',wantW:[...g.box.h.pit,...g.box.a.pit].find(q=>q.d==='승')?.n||'',wantL:[...g.box.h.pit,...g.box.a.pit].find(q=>q.d==='패')?.n||'',led:b.querySelectorAll('.pgb-led').length,ex:b.querySelectorAll('.pgb-col.ex').length,gw:/결승타/.test(b.textContent),hr:b.querySelectorAll('.pgb-hr button').length,wantHr:g.box.h.bat.concat(g.box.a.bat).reduce((x,q)=>x+(q.hr||0),0),stad:/관중 12,345명/.test(b.querySelector('.pgb-meta')?.textContent||'')};host.remove();return r;}));
  data.forEach((r,j)=>{const k=kinds[j];check(r.a&&r.h&&r.R&&r.H&&r.on,`${k} 이닝 점수·R/H 불일치 `+JSON.stringify(r));check(/^RHE?B$/.test(r.heads),`${k} R/H/E/B 머리 `+r.heads);check(r.w&&r.w===r.wantW&&r.l===r.wantL&&/승 \d+패/.test(r.wRec),`${k} 승패 투수 `+JSON.stringify(r));check(r.led===2&&r.stad&&r.gw,`${k} 큰 점수·구장·관중·결승타 `+JSON.stringify(r));check(r.hr===r.wantHr,`${k} 홈런 수 `+JSON.stringify(r));});
  check(data[1].cols>9&&data[1].ex===data[1].cols-9,'연장 이닝 칸 '+JSON.stringify(data[1]));check(data[2].x&&data[2].xWant,'9회말 X 표시 '+JSON.stringify(data[2]));check(!data[0].x&&data[0].cols===9,'9회 경기 칸 '+JSON.stringify(data[0]));
  const fit=async(tag)=>page.evaluate(tag=>{const out=[];const vw=document.documentElement.clientWidth;if(document.documentElement.scrollWidth>vw+1)out.push(`${tag} 페이지 가로 넘침 ${document.documentElement.scrollWidth}>${vw}`);
   for(const b of document.querySelectorAll('.pgb')){if(!b.getClientRects().length)continue;const r=b.getBoundingClientRect(),t=b.querySelector('.pgb-tot').getBoundingClientRect(),tc=b.querySelector('.pgb-tcol').getBoundingClientRect();if(r.left<-1||r.right>vw+1)out.push(`${tag} 전광판이 화면 밖 ${r.left}-${r.right}`);if(t.right>r.right+1||t.left<r.left||t.width<60)out.push(`${tag} R/H/E/B가 가려짐`);if(tc.left<r.left-1)out.push(`${tag} 팀 칸 가려짐`);
    for(const e of b.querySelectorAll('.pgb-head,.pgb-decs,.pgb-info,.pgb-grid'))if(e.scrollWidth>e.clientWidth+1&&!e.classList.contains('pgb-inn'))out.push(`${tag} ${e.className} 안 넘침`);}return out;},tag);
  for(const size of [{width:1366,height:768},{width:1600,height:900},{width:390,height:844}]){await page.setViewportSize(size);
   for(let i=0;i<3;i++){const k=kinds[i];
    /* 1) 그래픽 중계 마지막 화면 */
    await page.evaluate(i=>{closeSheets();UI.title=false;UI.tab='home';render();A.cast(i);UI.cast.play=false;castJump(G.games[i].pbp.length,false);},i);await page.waitForTimeout(200);
    let r=await page.evaluate(()=>{const c=document.querySelector('#cs-endcard');const b=c&&c.querySelector('.cs-bcard .pgb');if(!b||c.hidden)return {ok:false};const cr=c.getBoundingClientRect(),br=b.getBoundingClientRect();const tab=document.querySelector('.cs-result')?.dataset.tab;return {ok:true,tab,inside:br.top>=cr.top-1&&br.bottom<=cr.bottom+1,vis:br.height>80,scroll:document.scrollingElement.scrollHeight>innerHeight+2&&innerWidth>1000};});
    check(r.ok&&r.tab==='board'&&r.inside&&r.vis&&!r.scroll,`${size.width} ${k} 중계 마지막 전광판 `+JSON.stringify(r));(await fit(`${size.width} ${k} 중계`)).forEach(e=>check(false,e));
    if(shots)await page.screenshot({path:path.join(shots,`cast-${k}-${size.width}.png`)});
    if(i===0){await page.evaluate(()=>A.castEndTab('box'));check(await page.locator('.cs-rcard').isVisible()&&!(await page.locator('.cs-bcard').isVisible()),'결과 탭 전환');await page.evaluate(()=>A.castEndTab('board'));check(await page.locator('.cs-bcard .pgb').isVisible(),'전광판 탭 복귀');}
    await page.evaluate(()=>A.castClose(true));
    /* 2) 박스스코어 맨 위 */
    await page.evaluate(i=>{UI.gtab='box';A.openGame(i);},i);await page.waitForTimeout(120);
    r=await page.evaluate(()=>{const s=document.querySelector('.sheet');const b=s&&s.querySelector('.pgb');const first=s&&[...s.children].find(e=>e.matches('.pgb'));return {ok:!!b,top:!!first};});check(r.ok&&r.top,`${size.width} ${k} 박스스코어 전광판 `+JSON.stringify(r));(await fit(`${size.width} ${k} 박스스코어`)).forEach(e=>check(false,e));
    if(shots&&(i===1||size.width===390))await page.screenshot({path:path.join(shots,`box-${k}-${size.width}.png`)});
    /* 문자 중계 끝 */
    await page.evaluate(i=>{UI.gtab='pbp';UI.pbp=UI.pbp||{};A.pbpGo&&A.pbpGo(`${i}:${G.games[i].pbp.length-1}`);renderSheet();},i);await page.waitForTimeout(80);
    r=await page.evaluate(()=>!!document.querySelector('.sheet .pbp-end .pgb'));check(r,`${size.width} ${k} 문자 중계 끝 전광판`);(await fit(`${size.width} ${k} 문자 중계`)).forEach(e=>check(false,e));
    await page.evaluate(()=>{UI.gtab='box';closeSheets();render();});
   }
   /* 3) 하루 진행 뒤 경기 결과 정리 창 · 홈 경기 결과 카드(이닝 진행 끝) */
   await page.evaluate(()=>{closeSheets();UI.tab='home';render();const d=G.games.slice(0,3).map(g=>g.day);A.wkOpen(`${Math.min(...d)}:${Math.max(...d)}:3`);});await page.waitForTimeout(150);
   let r=await page.evaluate(()=>document.querySelectorAll('.wkres .pgb').length);check(r===3,`${size.width} 경기 결과 정리 창 전광판 ${r}`);(await fit(`${size.width} 경기 결과 정리 창`)).forEach(e=>check(false,e));
   if(shots)await page.screenshot({path:path.join(shots,`results-${size.width}.png`)});
   await page.evaluate(()=>{A.wkClose();G.live={i:2,upto:999};UI.tab="home";UI.it=UI.it||{};UI.it.home="game";render();});await page.waitForTimeout(150);
   r=await page.evaluate(()=>!!document.querySelector('.card.hero .pgb'));check(r,`${size.width} 홈 경기 결과 카드 전광판 없음`);(await fit(`${size.width} 홈 결과 카드`)).forEach(e=>check(false,e));
   if(shots)await page.screenshot({path:path.join(shots,`home-${size.width}.png`)});
   await page.evaluate(()=>{G.live=null;render();});
  }
  /* 다른 구단끼리 경기 박스스코어 */
  await page.setViewportSize({width:1366,height:768});
  const ai=await page.evaluate(()=>{const ts=G.teams.filter(t=>t.id!==G.user);const g=simGame(G.day+1,ts[0].id,ts[1].id,false);const r=gameRecord(G.day+1,ts[0].id,ts[1].id,g,'');G.games.push(r);UI.gtab='box';A.openGame(G.games.length-1);const b=document.querySelector('.sheet .pgb');return {ok:!!b,names:b?b.querySelector('.pgb-tcol').textContent:''};});
  check(ai.ok,'다른 구단끼리 박스스코어 전광판 없음 '+JSON.stringify(ai));if(shots)await page.screenshot({path:path.join(shots,'box-ai-1366.png')});
  /* 휴대폰 이닝 칸 가로 이동: 판 안에서만 */
  await page.setViewportSize({width:390,height:844});const sc=await page.evaluate(()=>{closeSheets();UI.gtab='box';A.openGame(1);const inn=document.querySelector('.sheet .pgb-inn');return {ov:getComputedStyle(inn).overflowX,page:document.documentElement.scrollWidth<=innerWidth};});check(sc.ov==='auto'&&sc.page,'휴대폰 이닝 칸 가로 이동 '+JSON.stringify(sc));
 }finally{await browser?.close();await server.close();}
 if(errors.length){console.error(errors.slice(0,30).join('\n'));console.error('경기 후 전광판 검사 실패');process.exit(1);}console.log('경기 후 전광판: 9회·연장·9회말 X · 중계 끝·문자 중계 끝·박스스코어·결과 카드·다른 구단 경기 · 1366/1600/390 통과');})().catch(e=>{console.error(e);process.exit(1);});
