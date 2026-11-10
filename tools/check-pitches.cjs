/* 3D 구장·동작은 check-match3d.cjs에서, 이 검사는 WebGL 대체 중계와 기록 UI를 확인한다. */
/* 실제 저장된 공을 DOM·애니메이션·일시정지·이전 저장에서 검증한다. */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
(async()=>{const server=await startHtmlServer(process.env.PITCHES_HTML||path.resolve(__dirname,'../index.html'));let browser;const errors=[];
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--disable-webgl']});const page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>errors.push(e.message));
await page.goto(server.url);await page.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;G.day=G.cal.open;for(const t of G.teams)setEntry(t.id);const other=G.teams.find(t=>t.id!==G.user).id,g=simGame(G.day,G.user,other,false);applyGame(G.day,G.user,other,g,false);G.games=[gameRecord(G.day,G.user,other,g,'')];UI.title=false;UI.tab='home';render();A.cast(0);castJump(0,false);});
const k=await page.evaluate(()=>G.games[0].pbp.findIndex(x=>typeof x[1]==='number'&&x[15].pitches.length>=6));assert.ok(k>=0,'긴 타석 준비');
for(const size of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080},{width:390,height:844}]){
 await page.setViewportSize(size);await page.evaluate(k=>{render();castJump(k,false);},k);
 assert.equal(await page.locator('.md-zone-grid>i').count(),9,'9칸 존');assert.equal(await page.locator('.md-pitch-dot').count(),0,'첫 공 전에 미래 투구 노출');
 const result=await page.evaluate(k=>{const g=G.games[0],seq=cPitchSeq(g,k);let b=0,s=0;const failures=[];for(let i=0;i<seq.length;i++){
   const q=seq[i];cShowPitch(g,k,seq,i);if(i<seq.length-1){if(q.res==='볼')b++;else if(q.res==='파울')s=Math.min(2,s+1);else if(q.res==='스트라이크'||q.res==='헛스윙')s++;}
   const last=document.querySelector('.md-pitch-dot.latest'),box=document.querySelector('.md-zone-grid').getBoundingClientRect(),dot=last.getBoundingClientRect(),inside=dot.x+dot.width/2>=box.left&&dot.x+dot.width/2<=box.right&&dot.y+dot.height/2>=box.top&&dot.y+dot.height/2<=box.bottom;
   /* 휴대폰은 존 그림을 접고 한 줄 문구(코스)로 보여 주므로 존 안팎은 그림이 보일 때만 본다. */
   if(box.width>0){if((q.res==='볼'||q.res==='볼넷')&&inside)failures.push('볼 위치');if((q.res==='스트라이크'||q.res==='루킹 삼진')&&!inside)failures.push('루킹 위치');}else if(!document.querySelector('.md-pitch-location')?.textContent)failures.push('코스 문구');
   if(document.querySelectorAll('#cs-B .on').length!==b||document.querySelectorAll('#cs-S .on').length!==s)failures.push('카운트');
   if(+last.dataset.index!==i+1||+last.dataset.x!==q.x||+last.dataset.y!==q.y)failures.push('순서·좌표');
   if(!document.querySelector('#cs-pitch').textContent.includes(q.t)||!document.querySelector('#cs-pitch').textContent.includes(String(q.v)))failures.push('구종·구속');
   if(document.querySelectorAll('.md-pitch-dot').length!==Math.min(6,i+1)||document.querySelectorAll('.md-pitch-history li').length!==Math.min(4,i+1))failures.push('공개 범위');
 }
 const dock=document.querySelector('.md-pitch-dock').getBoundingClientRect(),bso=document.querySelector('#cs-bso').getBoundingClientRect(),field=document.querySelector('#cs-stage').getBoundingClientRect(),duel=document.querySelector('#cs-vs').getBoundingClientRect(),host=document.querySelector('.cast').getBoundingClientRect();
 const bases=[...document.querySelectorAll('#cs-bases .md-base-pill')],state=cBefore(g,k);if(bases.length!==3||bases.some((e,i)=>e.classList.contains('occupied')!==!!state.bases[i]))failures.push('현재 주자 표시');
 /* mdBug moves the mobile count panel into the field; desktop keeps it in the pitch dock. */
 const countPanel=document.querySelector('#cs-bso').closest('.md-count-panel'),count=countPanel.getBoundingClientRect(),floating=countPanel.parentElement?.id==='cs-stage';
 if(!bso.width||!bso.height||bso.left<count.left-1||bso.right>count.right+1||bso.top<count.top-1||bso.bottom>count.bottom+1)failures.push('카운트 패널 내부 표시');
 if(floating){if(count.left<field.left-1||count.right>field.right+1||count.top<field.top-1||count.bottom>field.bottom+1)failures.push('구장 내 모바일 카운트');}
 else if(bso.bottom>dock.bottom+1||bso.right>dock.right+1||bso.top<dock.top+dock.height/2)failures.push('우측 하단 카운트');
 if(field.height<160||field.width<200||duel.bottom>innerHeight||host.right>innerWidth+1)failures.push('구장·카드 배치');
 return {failures,record:document.querySelector('#cs-pitch-source').textContent,pitcher:document.querySelector('#cs-pitcher-count').textContent};},k);
 assert.deepEqual(result.failures,[],size.width+' 투구판');assert.equal(result.record,'투구 기록');assert.match(result.pitcher,/구$/);
 if(process.env.CAPTURE)await page.screenshot({path:`/workspace/front-office-pitches-${size.width}.png`});
 const more=async()=>{if(await page.locator('.md-more-btn').isVisible())await page.locator('.md-more-btn').click();};await more();await page.locator('[data-a="castView"][data-v="data"]').click();const statsFit=await page.evaluate(()=>{const rows=document.querySelectorAll('#md-stats .md-stat-row'),panel=document.querySelector('#md-stats').closest('.md-panel');return rows[rows.length-1].getBoundingClientRect().bottom<=panel.getBoundingClientRect().bottom;});assert.equal(statsFit,true,size.width+' 기록 보기의 마지막 통계 행 가림');await more();await page.locator('[data-a="castView"][data-v="field"]').click();
}
await page.setViewportSize({width:1366,height:768});await page.evaluate(k=>{render();castJump(k,false);UI.cast.mode='all';UI.cast.spd=4;A.castPlay();},k);
await page.waitForFunction(()=>UI.cast?.pitch?.shown>=1,{},{timeout:10000});await page.locator('#cs-play').click();
const paused=await page.evaluate(()=>({state:JSON.stringify(UI.cast.pitch),info:document.querySelector('#cs-pitch').textContent}));await page.waitForTimeout(500);
assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(UI.cast.pitch),info:document.querySelector('#cs-pitch').textContent})),paused,'일시정지 후 늦은 공 표시');
const teamStable=await page.evaluate(()=>{const a=document.querySelector('#cs-pitcher-count').textContent;A.castTeam('h');return a===document.querySelector('#cs-pitcher-count').textContent;});assert.equal(teamStable,true,'팀 전환으로 투구 수 소실');
await page.evaluate(k=>A.castPlayer(G.games[0].pbp[k][1]),k);await page.locator('.detail-back').click();await page.waitForTimeout(100);assert.equal(await page.locator('#cs-pitch').textContent(),paused.info,'선수 상세 복귀로 투구 정보 소실');
const shown=await page.evaluate(()=>UI.cast.pitch.shown);await page.locator('#cs-play').click();await page.waitForFunction(n=>UI.cast?.pitch?.shown>n,shown,{timeout:10000});
await page.evaluate(k=>castJump(k+1,false),k);await page.waitForTimeout(500);assert.equal(await page.locator('.md-pitch-dot').count(),0,'이동 후 이전 공 표시');
const stable=await page.evaluate(k=>{const g=G.games[0],row=g.pbp[k],before=JSON.stringify(row[15]),p=G.players[row[2]],r={...p.r},velo=p.velo;G.games[0]=JSON.parse(JSON.stringify(g));p.r.stf=80;p.velo=161;const same=JSON.stringify(cPitchSeq(G.games[0],k))===JSON.stringify(row[15].pitches);p.r=r;if(velo==null)delete p.velo;else p.velo=velo;return same&&JSON.stringify(row[15])===before;},k);assert.equal(stable,true,'저장·선수 변경으로 과거 투구 변동');
const legacy=await page.evaluate(k=>{const g=G.games[0],row=g.pbp[k];delete row[15];const before=JSON.stringify(row),a=JSON.stringify(cPitchSeq(g,k)),b=JSON.stringify(cPitchSeq(g,k));castJump(k,false);const seq=cPitchSeq(g,k);cShowPitch(g,k,seq,0);return {same:a===b&&JSON.stringify(row)===before,label:document.querySelector('#cs-pitch-source').textContent,count:document.querySelector('#cs-pitcher-count').textContent};},k);assert.equal(legacy.same,true);assert.equal(legacy.label,'투구 재현');
await page.evaluate(()=>A.castClose(true));assert.equal(await page.locator('.cast').count(),0);
}finally{await browser?.close();await server.close();}assert.equal(errors.length,0,errors.join('\n'));console.log('공별 중계: 9칸·좌표·구종/구속·B/S/O·4개 배치·재생/일시정지·저장/옛 기록 통과');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
