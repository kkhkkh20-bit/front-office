/* 기기 옮기기 실서버 점검: 배포된 사이트에서 PC 브라우저가 코드를 만들고, 따로 띄운 휴대폰 브라우저가 그 코드로 같은 게임을 옮겨 온다.
   두 브라우저는 저장소(localStorage)를 나누지 않으므로 실제로 다른 기기와 같다. 받은 뒤 같은 코드는 서버에서 지워졌는지도 확인한다.
   사용: node tools/check-save-transfer-live.cjs  (주소를 바꾸려면 BASE=https://... , 화면 저장은 CAPTURE=폴더)
   실서버에 저장 1건을 올렸다가 바로 받아서 지우므로 남는 데이터는 없다. 실패하면 만든 코드를 지우고 끝낸다. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium,devices}=require('playwright');
const BASE=(process.env.BASE||'https://fronttime.kkhkkh-20.workers.dev').replace(/\/$/,''), cap=process.env.CAPTURE;
const proxy=process.env.HTTPS_PROXY||process.env.https_proxy;
(async()=>{ let b, code=null, pc;
 try{
  b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,...(proxy?{proxy:{server:proxy}}:{})});
  if(cap)fs.mkdirSync(cap,{recursive:true});
  const errs=[];
  /* 0) 서버 상태: GET /api/transfer 가 ok */
  const pcCtx=await b.newContext({viewport:{width:1366,height:768},ignoreHTTPSErrors:!!proxy}); pc=await pcCtx.newPage(); pc.on('pageerror',e=>errs.push('PC: '+e.message));
  await pc.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:120000});
  const st=await pc.evaluate(async()=>{ const r=await fetch('/api/transfer',{cache:'no-store'}); return {s:r.status,j:await r.json().catch(()=>null)}; });
  assert.equal(st.s,200,'GET /api/transfer 상태 '+st.s); assert.ok(st.j&&st.j.ok,'API 상태 ok 아님: '+JSON.stringify(st.j));
  const rel=await pc.evaluate(async()=>{ try{ return (await (await fetch('/release.json',{cache:'no-store'})).json()).build; }catch(e){ return null; } });
  console.log('서버 상태 ok · 빌드',rel);
  /* 1) PC: 새 게임 → 설정의 기기 옮기기 → 코드 만들기 */
  await pc.waitForSelector('[data-a="tsGo"][data-v="mode"]',{timeout:120000});
  await pc.click('[data-a="tsGo"][data-v="mode"]'); await pc.click('[data-a="smode"][data-v="take"]',{timeout:120000}); await pc.waitForSelector('.tmk',{timeout:120000});
  await pc.click('.tmk [data-a="start"].btn'); await pc.fill('#gp-name','옮기기점검'); await pc.click('[data-a="gpStart"]'); await pc.waitForFunction(()=>typeof G!=='undefined'&&G&&!UI.title,{},{timeout:180000});
  const before=await pc.evaluate(()=>{ saveNow(); G.tut={done:true,step:99}; closeSheets(); A.go('club:set'); return {user:G.user,day:G.day,year:G.year,n:Object.keys(G.players).length,gm:(G.gmP&&G.gmP.name)||null,team:tfull(team(G.user))}; });
  await pc.waitForSelector('[data-a="xfUp"]',{timeout:60000}); await pc.click('[data-a="xfUp"]'); await pc.waitForSelector('.xf-code',{timeout:60000});
  const shown=(await pc.locator('.xf-code').innerText()).trim(); assert.match(shown,/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/,'코드 형식 '+shown); code=shown.replace('-','');
  if(cap){ await pc.locator('.xf').scrollIntoViewIfNeeded(); await pc.screenshot({path:path.join(cap,'live-pc-upload.png')}); }
  console.log('PC: 코드',shown,'만들기 통과 ·',before.team,before.year+'년');
  /* 2) 휴대폰(다른 저장소): 처음 화면 → 불러오기 → 코드 입력 → 옮겨 오기 */
  const phCtx=await b.newContext({...devices['iPhone 13'],ignoreHTTPSErrors:!!proxy}); const ph=await phCtx.newPage(); ph.on('pageerror',e=>errs.push('폰: '+e.message));
  await ph.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:120000}); await ph.waitForSelector('[data-a="tsGo"][data-v="slots"]',{timeout:120000});
  assert.equal(await ph.evaluate(()=>typeof SLOT_IDS!=='undefined'?SLOT_IDS.filter(n=>slotUsed(n,meta())).length:-1),0,'폰 브라우저에 이미 저장이 있음(다른 기기가 아님)');
  await ph.click('[data-a="tsGo"][data-v="slots"]'); await ph.waitForSelector('#xfIn',{timeout:60000});
  await ph.fill('#xfIn',shown.toLowerCase()); if(cap)await ph.screenshot({path:path.join(cap,'live-phone-download.png')});
  await ph.click('[data-a="xfGet"]'); await ph.waitForFunction(()=>typeof G!=='undefined'&&G&&!UI.title,{},{timeout:60000});
  const after=await ph.evaluate(()=>({user:G.user,day:G.day,year:G.year,n:Object.keys(G.players).length,gm:(G.gmP&&G.gmP.name)||null,team:tfull(team(G.user)),slots:SLOT_IDS.filter(n=>slotUsed(n,meta())).length}));
  assert.deepEqual([after.user,after.day,after.year,after.n,after.gm],[before.user,before.day,before.year,before.n,before.gm],'옮겨 온 게임이 다름');
  assert.equal(after.slots,1,'휴대폰 슬롯에 들어가지 않음');
  if(cap)await ph.screenshot({path:path.join(cap,'live-phone-loaded.png')});
  console.log('휴대폰: 같은 게임 옮겨 오기 통과 ·',after.team,'선수',after.n+'명');
  /* 3) 같은 코드는 서버에서 지워졌다 */
  const again=await ph.evaluate(async c=>{ const r=await fetch('/api/transfer/'+c,{cache:'no-store'}); return r.status; },code);
  assert.equal(again,404,'한 번 받은 코드가 서버에 남음 '+again); code=null;
  console.log('한 번 받은 코드 삭제 확인 통과');
  assert.deepEqual(errs,[],'화면 오류');
  console.log('기기 옮기기 실서버 점검: 모두 통과');
 }finally{
  if(code&&pc){ try{ await pc.evaluate(async c=>{ await fetch('/api/transfer/'+c,{method:'DELETE',cache:'no-store'}); },code); console.log('정리: 남은 코드 삭제'); }catch(e){} }
  await b?.close(); } })().catch(e=>{ console.error(e.stack||e); process.exitCode=1; });
