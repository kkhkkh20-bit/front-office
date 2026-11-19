/* 중계 화면 얼굴 다시 그리기(11-19: 중계를 처음 열면 얼굴 시트를 받는 동안 선수단 얼굴이 실루엣이고, 다 받은 뒤에도 다른 조작을 할 때까지 실루엣으로 남던 문제).
   얼굴 시트 응답을 붙잡아 둔 채 중계를 열고(원정 구단은 파일로 받는 시트를 쓴다), 풀어 준 뒤 아무것도 누르지 않아도 얼굴이 나오는지 본다.
   1. 멈춘 중계(선수단 보기): 선수단 줄(원정)·미니 구장·좌우 카드·대결·경기 전 라인업에 실루엣이 있다 → 시트를 풀면 10초 안에 모두 실제 얼굴.
      그동안 장면 번호·재생 여부·재생 토큰·선택한 구단·선수단 줄 스크롤·열린 상자·중계 DOM(같은 노드)·castMount 호출 수가 그대로다(중계를 다시 만들지 않는다).
   2. 재생 중인 중계(다른 경기): 시트를 풀어도 재생이 끊기지 않는다(토큰·재생 상태 그대로, 장면이 뒤로 가지 않고 계속 나아간다). 얼굴은 실제 얼굴.
   3. 중계를 닫은 뒤에는 castFaceRefresh가 아무것도 바꾸지 않는다. PC 화면 세로 스크롤 없음, 390px 가로 넘침 없음, 페이지 오류 없음.
   CASTFACE_HTML로 다른 빌드를 지정할 수 있다(고치기 전 빌드는 1에서 실패한다). 사진은 CASTFACE_OUT(기본 /tmp/cast-face-1119). */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..'),HTML=process.env.CASTFACE_HTML||path.join(ROOT,'index.html'),OUT=process.env.CASTFACE_OUT||'/tmp/cast-face-1119';
const PW='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',CHROME=process.env.CHROMIUM_EXECUTABLE_PATH||(fs.existsSync(PW)?PW:'/usr/bin/chromium');
/* index.html과 assets/만 내준다(사이트 배포와 같은 경로로 얼굴 시트를 받게) */
function serve(){const s=http.createServer((q,r)=>{const u=decodeURIComponent((q.url||'/').split('?')[0]);const f=u==='/'?HTML:u.startsWith('/assets/')&&!u.includes('..')?path.join(ROOT,u):null;
  if(!f||q.method!=='GET'){r.writeHead(404);return r.end();}fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end();}r.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.webp')?'image/webp':'application/octet-stream','Cache-Control':'no-store'});r.end(d);});});
  return new Promise(res=>s.listen(0,'127.0.0.1',()=>res({url:`http://127.0.0.1:${s.address().port}/`,close:()=>new Promise(r=>s.close(r))})));}
/* 새 리그에서 상대 두 구단과 한 경기씩(내 구단이 홈, 상대가 원정). G.games[0]·[1] */
const BOOT=()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open+2;for(const t of G.teams)setEntry(t.id);
  for(const op of G.teams.filter(t=>t.id!==G.user).slice(0,2).map(t=>t.id)){G.day++;const g=simGame(G.day,G.user,op,false);applyGame(G.day,G.user,op,g,false);G.games.unshift(gameRecord(G.day,G.user,op,g,''));}
  try{localStorage.setItem('fo-cast-dugout','1');}catch(e){}
  UI.title=false;UI.tab='home';render();window.__mounts=0;const cm=castMount;castMount=function(){window.__mounts++;return cm.apply(this,arguments);};};
/* 중계 화면 얼굴: 자리마다 [전체, 실루엣] + 아직 안 그려진(깨진) 사진 수 */
const FACES=()=>{const o={},q=(k,s)=>{const L=[...document.querySelectorAll(s)];o[k]=[L.length,L.filter(i=>i.getAttribute('src')===F6WAIT).length];};
  q('all','.cast img.av');q('roster','#md-roster img.av');q('fieldA','#md-field-a img.av');q('fieldH','#md-field-h img.av');q('cards','#cs-faces img.av');q('duel','#cs-vs img.av');q('prep','.cast .cs-pc img.av,.cast .lf-ph img.av');
  o.shown=[...document.querySelectorAll('.cast .md-mini-field img.av')].filter(i=>i.getClientRects().length&&i.getBoundingClientRect().width>8).length;/* 화면에 보이는 선수단 얼굴 */
  o.broken=[...document.querySelectorAll('.cast img.av')].filter(i=>i.complete&&!i.naturalWidth).length;return o;};
/* 중계 상태: 다시 만들거나 재생을 건드리면 달라지는 값들 */
const STATE=()=>{const c=UI.cast,el=document.querySelector('.cast'),ro=document.getElementById('md-roster');return {g:c.g,k:c.k,play:!!c.play,pre:!!c.pre,team:c.team,tok:CT.tok,run:!!CT.run,mounts:window.__mounts,same:el===window.__cast&&ro===window.__roster,
  left:ro?ro.scrollLeft:0,dugout:el?.dataset.dugout,view:el?.dataset.view,seek:document.getElementById('md-seek')?.value};};
(async()=>{fs.mkdirSync(OUT,{recursive:true});const server=await serve(),browser=await chromium.launch({executablePath:CHROME,args:['--disable-webgl']});
try{for(const [W,H] of [[1440,900],[390,844]]){const pc=W>=1100,tag=`${W}x${H}`,c=await browser.newContext({viewport:{width:W,height:H},isMobile:!pc,hasTouch:!pc}),p=await c.newPage(),errors=[];p.setDefaultTimeout(300000);
  p.on('pageerror',e=>errors.push(e.message));await p.route('https://**',r=>r.fulfill({body:'',contentType:'text/css'}));
  /* 얼굴 시트(assets 아래 webp)는 문을 열 때까지 붙잡아 둔다 */
  let gate=true;const held=[];await p.route('**/assets/**/*.webp*',r=>{if(gate)held.push(r);else r.continue();});
  const release=async()=>{gate=false;const n=held.length;for(const r of held.splice(0))await r.continue();return n;};
  const fit=async what=>{const r=await p.evaluate(()=>({v:document.scrollingElement.scrollHeight-innerHeight,h:document.documentElement.scrollWidth-innerWidth}));assert.ok(r.h<=1,`${tag} ${what}: 가로 넘침 ${r.h}`);if(pc)assert.ok(r.v<=1,`${tag} ${what}: 화면 세로 스크롤 ${r.v}`);};
  const settle=async()=>{let f;for(let i=0;i<50;i++){await p.waitForTimeout(200);f=await p.evaluate(FACES);if(!f.all[1]&&!f.broken)break;}return f;};
  await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function'&&typeof DEMO!=='undefined');await p.waitForTimeout(1800);/* 앱 비동기 부팅이 끝난 뒤 새 게임 */
  await p.evaluate(BOOT);

  /* 1. 멈춘 중계 */
  await p.evaluate(()=>{A.cast(0);const g=G.games[UI.cast.g],L=g.pbp;let k=L.findIndex((x,i)=>i>=6&&typeof x[1]==='number');castJump(k<0?0:k,false);A.castTeam('a');A.castView('teams');/* 선수단 보기: 두 구단 얼굴(미니 구장) */
    window.__cast=document.querySelector('.cast');window.__roster=document.getElementById('md-roster');const ro=window.__roster;if(ro&&ro.scrollWidth>ro.clientWidth+30)ro.scrollLeft=30;});
  await p.waitForTimeout(2500);/* HTML에 든 시트는 이 사이에 다 읽힌다: 남는 실루엣은 붙잡아 둔 시트 몫 */
  const f0=await p.evaluate(FACES),s0=await p.evaluate(STATE);
  assert.ok(held.length>=1,`${tag}: 붙잡아 둔 얼굴 시트 요청이 없다`);
  assert.ok(f0.roster[0]>=9&&f0.roster[1]>=1,`${tag}: 시트를 받기 전 선수단 줄에 실루엣이 있어야 한다 ${JSON.stringify(f0)}`);
  assert.equal(s0.play,false,`${tag}: 멈춘 중계`);assert.equal(s0.team,'a');assert.equal(s0.view,'teams');assert.ok(s0.same);assert.ok(f0.shown>=9,`${tag}: 선수단 보기에 보이는 얼굴 ${f0.shown}`);
  await p.screenshot({path:path.join(OUT,`${W}-1-wait.png`)});
  const n1=await release(),f1=await settle(),s1=await p.evaluate(STATE);
  await p.screenshot({path:path.join(OUT,`${W}-2-loaded.png`)});
  for(const k of ['roster','fieldA','fieldH','cards','duel','prep','all'])assert.equal(f1[k][1],0,`${tag} 멈춘 중계: 시트 ${n1}장을 받은 뒤에도 실루엣 — ${k} ${f1[k][1]}/${f1[k][0]}칸 ${JSON.stringify(f1)}`);
  assert.equal(f1.broken,0,`${tag}: 깨진 얼굴 사진`);assert.deepEqual(f1.roster[0],f0.roster[0]);assert.equal(f1.shown,f0.shown);
  assert.deepEqual(s1,s0,`${tag}: 얼굴만 바뀌고 중계 상태는 그대로여야 한다`);
  await fit('멈춘 중계');

  /* 2. 재생 중인 중계(다른 상대: 새 시트가 필요하다) */
  gate=true;
  await p.evaluate(()=>{A.castClose(true);A.cast(1);const c=UI.cast;c.spd=3;A.castTeam('a');window.__cast=document.querySelector('.cast');window.__roster=document.getElementById('md-roster');});
  await p.waitForFunction(()=>UI.cast&&!UI.cast.pre,null,{timeout:60000});
  await p.evaluate(()=>{const c=UI.cast;if(c.k>=G.games[c.g].pbp.length-30)castJump(0,false);if(!c.play)A.castPlay();});
  await p.waitForFunction(()=>UI.cast.play&&CT.run&&UI.cast.k>=1,null,{timeout:120000});
  assert.ok(held.length>=1,`${tag} 재생: 붙잡아 둔 얼굴 시트 요청이 없다`);
  const p0=await p.evaluate(STATE);const n2=await release(),f2=await settle(),p1=await p.evaluate(STATE);
  assert.equal(f2.all[1],0,`${tag} 재생 중: 시트 ${n2}장을 받은 뒤에도 실루엣 ${JSON.stringify(f2)}`);assert.equal(f2.broken,0);
  assert.equal(p1.tok,p0.tok,`${tag}: 재생 토큰이 바뀌었다(재생을 다시 시작함)`);assert.equal(p1.play,true,`${tag}: 재생이 멈췄다`);assert.equal(p1.mounts,p0.mounts,`${tag}: 중계를 다시 만들었다`);
  assert.ok(p1.same,`${tag}: 중계 DOM이 바뀌었다`);assert.ok(p1.k>=p0.k,`${tag}: 장면이 뒤로 갔다 ${p0.k} → ${p1.k}`);assert.equal(p1.team,'a');assert.equal(p1.g,p0.g);
  await p.waitForFunction(k=>UI.cast&&UI.cast.play&&UI.cast.k>k,p1.k,{timeout:120000});/* 그 뒤로도 계속 나아간다 */
  const p2=await p.evaluate(STATE);assert.equal(p2.tok,p0.tok);assert.equal((await p.evaluate(FACES)).all[1],0,`${tag}: 다음 장면에서 실루엣으로 돌아갔다`);
  await fit('재생 중인 중계');

  /* 3. 닫은 뒤에는 아무것도 하지 않는다 */
  const closed=await p.evaluate(()=>{A.castClose(true);return {cast:!!UI.cast,n:typeof castFaceRefresh==='function'?castFaceRefresh():0};});
  assert.deepEqual(closed,{cast:false,n:0},`${tag}: 닫힌 중계`);
  assert.deepEqual(errors,[],`${tag} 페이지 오류`);console.log(`${tag} 통과 (멈춘 중계 실루엣 ${f0.all[1]}칸 → 0, 시트 ${n1}+${n2}장)`);await c.close();}}
finally{await browser.close();await server.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
