/* 경기장 라인업(사용자 11-18): 골든글러브 보드처럼 포지션마다 얼굴·이름·타순·OVR.
   ① 중계 경기 전 라인업 소개(경기장 보기 기본 ↔ 목록 보기) ② 선수단 → 전력 구성(목록 보기 ↔ 경기장 보기, 우리 팀·다음 상대)
   양 팀 9자리 + 선발투수 채움, OVR 칩(scoutReport 공개 범위와 같음), 1366·1600·390 가로 넘침 없음·카드가 그림 밖으로 나가지 않음 */
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const POS=['C','1B','2B','3B','SS','LF','CF','RF','DH','P'];
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let b;const errors=[];try{
 b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});const p=await b.newPage({viewport:{width:1366,height:768}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(server.url);await p.waitForSelector('[data-a="tsGo"][data-v="mode"]');
 await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open+2;for(const t of G.teams)setEntry(t.id);const op=G.teams.find(t=>t.id!==G.user).id;G.games=[];const g=simGame(G.day,G.user,op,false);G.games.push(gameRecord(G.day,G.user,op,g,''));UI.title=false;UI.tab='home';render();
  /* 경기 전 화면을 붙잡아 둔다: 3D 준비·늦은 3D 대체로 경기가 시작되지 않게(검사 전용) */ cPrepDone=function(){};castStart2D=function(){};A.castStart=function(){};if(typeof Match3D!=="undefined")window.Match3D=Object.assign({},Match3D,{mount:()=>new Promise(()=>{})}); /* 3D 로딩 중 상태 유지 */});
 /* 보드 하나 검사: 10자리·이름·OVR(공개 범위)·카드가 보드 안 */
 const board=(sel,visible)=>p.evaluate(({sel,visible})=>{const out=[];for(const lf of document.querySelectorAll(sel)){const box=lf.querySelector('.lf-box').getBoundingClientRect();if(visible&&!box.width)continue;
   const cards=[...lf.querySelectorAll('.lf-m')].map(m=>{const r=m.getBoundingClientRect(),id=m.dataset.v||m.closest('[data-a="player"]')?.dataset.v;return {pos:m.dataset.pos,name:m.querySelector('.lf-nb b').textContent.trim(),ov:m.querySelector('.lf-ov .rc')?.textContent.trim(),q:!!m.querySelector('.lf-ov .rc.q'),face:!!m.querySelector('.lf-ph .av'),r:{l:r.left,t:r.top,rr:r.right,b:r.bottom}};});
   out.push({w:box.width,h:box.height,box:{l:box.left,t:box.top,r:box.right,b:box.bottom},cards});}return out;},{sel,visible});
 const inside=(B,label)=>{for(const c of B.cards){assert.ok(c.r.l>=B.box.l-2&&c.r.rr<=B.box.r+2&&c.r.t>=B.box.t-2&&c.r.b<=B.box.b+2,label+' 카드가 그림 밖 '+c.pos+' '+JSON.stringify(c.r)+' '+JSON.stringify(B.box));}};
 const full=(B,label)=>{assert.deepEqual(B.cards.map(c=>c.pos).sort(),[...POS].sort(),label+' 9자리+선발투수');for(const c of B.cards){assert.ok(c.name,label+' 이름 '+c.pos);assert.ok(c.face,label+' 얼굴 '+c.pos);assert.ok(c.ov,label+' OVR 칩 '+c.pos);}};
 const noOverflow=async label=>{const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,w:innerWidth,sh:document.documentElement.scrollHeight,h:innerHeight}));assert.ok(r.sw<=r.w+1,label+' 가로 넘침 '+JSON.stringify(r));if(r.w>=1000)assert.ok(r.sh<=r.h+2,label+' PC 세로 스크롤 '+JSON.stringify(r));};
 for(const [w,h] of [[1366,768],[1600,900],[390,844]]){await p.setViewportSize({width:w,height:h});
  /* ① 경기 전 라인업 소개 */
  await p.evaluate(()=>{closeSheets();UI.cast=null;UI.prepView=null;UI.prepManual=true;render();A.cast(0);});await p.waitForSelector('.cs-prep[data-view="field"] .lf',{state:'attached'});
  const all=await board('.cs-prep .lf',false);assert.equal(all.length,2,'양 팀 경기장 보드');all.forEach((B,i)=>full(B,w+' 경기 전 '+(i?'홈':'원정')));
  const ovs=await p.evaluate(()=>{const g=G.games[0];return ['a','h'].map(sd=>{const ids=castLineup(g,sd,0).slice(0,9).map(r=>r.id).concat(g.box[sd].pit[0].id);return ids.map(id=>scoutReport(G.players[id]).cur==null);});});
  all.forEach((B,i)=>{const q=B.cards.filter(c=>c.q).length;assert.equal(q,ovs[i].filter(Boolean).length,'OVR 공개 범위 = scoutReport '+w+' '+i);});
  const userSide=await p.evaluate(()=>G.games[0].home===G.user?1:0);assert.ok(all[userSide].cards.every(c=>!c.q),'우리 팀은 OVR 모두 표시');
  const vis=await board('.cs-prep .lf',true);assert.equal(vis.length,w>700?2:1,'보이는 보드 수(PC 나란히, 휴대폰 한 팀씩) '+w);vis.forEach(B=>inside(B,w+' 경기 전'));
  /* 얼굴 사진: 경기 전 화면은 다시 그리지 않으므로, 사진이 도착하면 실루엣(F6WAIT)이 제자리에서 실제 얼굴로 바뀌어야 한다(경기장·목록 보기 모두) */
  const faceState=()=>p.evaluate(()=>{const L=[...document.querySelectorAll('.cs-prep .lf-ph>.av,.cs-prep .cs-pc>.av')];return {n:L.length,wait:L.filter(e=>e.tagName!=='IMG'||e.getAttribute('src')===F6WAIT||!e.complete||!e.naturalWidth).length};});
  const f0=await faceState();if(w===1366)console.log('경기 전 얼굴 처음 실루엣',f0.wait+'/'+f0.n);
  await p.waitForFunction(()=>{const L=[...document.querySelectorAll('.cs-prep .lf-ph>.av,.cs-prep .cs-pc>.av')];return L.length>=40&&L.every(e=>e.tagName==='IMG'&&e.getAttribute('src')!==F6WAIT&&e.complete&&e.naturalWidth>0);},null,{timeout:60000}).catch(async()=>assert.fail('경기 전 얼굴이 실루엣으로 남음 '+JSON.stringify(await faceState())));
  if(process.env.SHOTS)await p.screenshot({path:path.join(process.env.SHOTS,`prep-field-${w}.png`)});if(w>700)for(const B of vis){const face=await p.evaluate(()=>document.querySelector('.cs-prep .lf-m .av').getBoundingClientRect().width);assert.ok(face>=44,'PC 얼굴 크기 '+face);}
  await noOverflow(w+' 경기 전');
  if(process.env.SHOTS)await p.screenshot({path:path.join(process.env.SHOTS,`prep-field-${w}.png`)});
  await p.locator('.cs-prep-view button[data-v="list"]').click();assert.equal(await p.evaluate(()=>document.querySelector('.cs-prep').dataset.view),'list');assert.equal(await board('.cs-prep .lf',true).then(x=>x.length),0,'목록 보기에서는 경기장 보드 숨김');
  assert.ok(await p.locator('.cs-pl li').count()>=9,'목록 보기 타순 표 유지');await noOverflow(w+' 목록 보기');
  await p.locator('.cs-prep-view button[data-v="field"]').click();assert.equal(await board('.cs-prep .lf',true).then(x=>x.length),w>700?2:1,'경기장 보기로 돌아옴');
  /* ② 선수단 → 전력 구성: 경기장 보기 + 다음 상대 탭 */
  await p.evaluate(()=>{UI.cast=null;closeSheets();UI.lufView='list';UI.lufTeam=null;UI.it=UI.it||{};UI.it.roster='depth';A.tab('roster');});
  if(await p.locator('[data-a="lufView"][data-v="field"]').count()===0||!(await p.locator('[data-a="lufView"][data-v="field"]').isVisible())){const t=p.locator('button',{hasText:'1군 야수·투수진'}).first();if(await t.count())await t.click();}
  await p.locator('[data-a="lufView"][data-v="field"]').click();await p.waitForSelector('.lf-panel .lf');
  let R=await board('.lf-panel .lf',true);assert.equal(R.length,1);full(R[0],w+' 전력 구성 우리 팀');inside(R[0],w+' 전력 구성');assert.ok(R[0].cards.every(c=>!c.q),'우리 팀 OVR');
  assert.ok(await p.locator('.lf-sum .eyebrow',{hasText:'불펜'}).count(),'벤치·투수진 요약');await noOverflow(w+' 전력 구성');
  if(process.env.SHOTS)await p.screenshot({path:path.join(process.env.SHOTS,`roster-field-${w}.png`)});
  const op=await p.evaluate(()=>nextGames(1)[0]?.op);if(op!=null){await p.locator(`[data-a="lufTeam"][data-v="${op}"]`).click();await p.waitForSelector('.lf-panel .lf');R=await board('.lf-panel .lf',true);full(R[0],w+' 다음 상대');inside(R[0],w+' 다음 상대');
   const q=await p.evaluate(op=>{const d=depth(op),L=orderList(d.start,op);let sp=null;try{sp=(projStarters(op,1)[0]||{}).sp;}catch(e){}return L.concat(sp?[sp]:[]).filter(x=>scoutReport(x).cur==null).map(x=>x.name);},op);assert.deepEqual(R[0].cards.filter(c=>c.q).map(c=>c.name).sort(),q.sort(),w+' 상대 OVR 공개 범위 '+R[0].cards.map(c=>c.pos+c.name+c.ov).join(","));await noOverflow(w+' 다음 상대');}
  await p.locator('[data-a="lufView"][data-v="list"]').click();assert.equal(await p.locator('.lf-panel').count(),0,'목록 보기로 돌아옴');
  console.log('경기장 라인업',w,'통과');}
 assert.deepEqual(errors,[],'페이지 오류 '+errors.join(' / '));
}finally{await b?.close();await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
