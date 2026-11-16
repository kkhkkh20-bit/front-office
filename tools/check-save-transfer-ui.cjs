/* 기기 옮기기 화면 점검: API가 없으면(정적 호스팅 404·file://) 기능을 감추고, API가 있으면 설정에서 코드를 만들어 처음 화면 불러오기에서 새 슬롯으로 가져온다.
   API는 page.route로 실제 worker/index.js를 가짜 KV와 함께 돌린다. 사용: bash build.sh 뒤 node tools/check-save-transfer-ui.cjs
   CAPTURE=폴더 를 주면 390px 화면을 저장한다 */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const root=path.resolve(__dirname,'..'), cap=process.env.CAPTURE;
function fakeKV(){ const m=new Map(); return { m, async get(k){ return m.has(k)?m.get(k).v:null; }, async getWithMetadata(k){ const e=m.get(k); return {value:e?e.v:null,metadata:e?e.meta:null}; }, async put(k,v,o={}){ m.set(k,{v:String(v),meta:o.metadata||null}); }, async delete(k){ m.delete(k); } }; }
(async()=>{ const {handle}=await import(path.join(root,'worker/index.js')); const server=await startHtmlServer(path.join(root,'index.html')); let b;
 try{ b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'}); if(cap)fs.mkdirSync(cap,{recursive:true});
  const ctx=await b.newContext({viewport:{width:390,height:844}}), pg=await ctx.newPage(), errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  /* 1) API 없음(지금의 정적 호스팅처럼 404): 버튼 없이 짧은 안내만 */
  await pg.goto(server.url); await pg.waitForTimeout(500);
  await pg.click('[data-a="tsGo"][data-v="slots"]'); await pg.waitForSelector('.xf');
  assert.match(await pg.locator('.xf').innerText(),/쓸 수 없습니다/); assert.equal(await pg.locator('[data-a="xfGet"],[data-a="xfUp"],#xfIn').count(),0,'API가 없으면 입력·버튼 없음');
  console.log('API 없음(404): 기기 옮기기 감춤·짧은 안내 통과');
  /* 2) API 연결: 실제 Worker 처리기를 가짜 KV로 */
  const env={SAVE_KV:fakeKV()}, calls=[];
  await pg.route('**/api/transfer**',async route=>{ const r=route.request(); const h=Object.assign({},r.headers(),{'cf-connecting-ip':'203.0.113.1'}); const body=r.method()==='POST'?r.postDataBuffer():undefined;
   const res=await handle(new Request(r.url(),{method:r.method(),headers:h,body}),env); calls.push(r.method()+' '+new URL(r.url()).pathname+' '+res.status); await route.fulfill({status:res.status,headers:Object.fromEntries(res.headers),body:Buffer.from(await res.arrayBuffer())}); });
  await pg.goto(server.url); await pg.waitForTimeout(500);
  await pg.click('[data-a="tsGo"][data-v="mode"]'); await pg.click('[data-a="smode"][data-v="take"]',{timeout:120000}); await pg.waitForSelector('.tmk',{timeout:120000}); await pg.click('.tmk [data-a="start"].btn'); await pg.fill('#gp-name','점검'); await pg.click('[data-a="gpStart"]'); await pg.waitForTimeout(1500);
  const before=await pg.evaluate(()=>{ saveNow(); G.tut={done:true,step:99}; closeSheets(); UI.it=Object.assign(UI.it||{},{setg:'save'}); /* 휴대폰 설정은 4탭(저장) */ A.go('club:set'); return {slot:curSlot(),user:G.user,day:G.day,year:G.year,n:Object.keys(G.players).length,used:SLOT_IDS.filter(n=>slotUsed(n,meta())).length}; });
  await pg.waitForSelector('[data-a="xfUp"]'); await pg.click('[data-a="xfUp"]'); await pg.waitForSelector('.xf-code');
  const shown=(await pg.locator('.xf-code').innerText()).trim(); assert.match(shown,/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/,'XXXX-XXXX 표시'); const xfText=await pg.locator('.xf').innerText();
  assert.match(xfText,/7일 뒤 자동 삭제 · 한 번 불러오면 바로 삭제/); assert.match(xfText,/게임 서버에 잠시 보관/);
  assert.equal(env.SAVE_KV.m.size,2,'저장 1 + 횟수 기록 1'); const stored=env.SAVE_KV.m.get('x:'+shown.replace('-','')).v; assert.equal(stored,await pg.evaluate(()=>LZString.compressToBase64(prepG())),'코드 만들기와 같은 압축 형식');
  if(cap){ await pg.locator('.xf').scrollIntoViewIfNeeded(); await pg.screenshot({path:path.join(cap,'upload-390.png')}); }
  console.log('설정 → 저장: 기기 옮기기 코드',shown,'만들기 통과');
  /* 3) 틀린 코드: 다시 시도 대기 안내 */
  await pg.evaluate(()=>{ A.toTitle?A.toTitle():null; }); if(await pg.locator('[data-a="tsGo"][data-v="slots"]').count()===0)await pg.evaluate(()=>{ UI.title=true; UI.sstep='main'; render(); });
  await pg.click('[data-a="tsGo"][data-v="slots"]'); await pg.waitForSelector('#xfIn');
  assert.equal(await pg.locator('[data-a="xfUp"]').count(),0,'처음 화면에는 받기만');
  await pg.fill('#xfIn','2222-2222'); await pg.click('[data-a="xfGet"]'); await pg.waitForFunction(()=>/초 뒤 다시 시도/.test(document.querySelector('.xf').innerText));
  await pg.fill('#xfIn','ab'); await pg.click('[data-a="xfGet"]'); assert.match(await pg.locator('.xf .note').innerText(),/초 뒤 다시 시도/,'대기 중에는 다시 묻지 않음');
  await pg.waitForTimeout(2200);
  await pg.fill('#xfIn','0000-0000'); await pg.click('[data-a="xfGet"]'); assert.match(await pg.locator('.xf .note').innerText(),/8자리/,'쓰지 않는 글자 안내');
  console.log('틀린 코드: 대기 안내·형식 안내 통과');
  /* 4) 받기: 빈 슬롯에 들어가고 서버에서 지워진다 */
  await pg.fill('#xfIn',shown.toLowerCase()); if(cap){ await pg.locator('.xf').scrollIntoViewIfNeeded(); await pg.screenshot({path:path.join(cap,'download-390.png')}); }
  await pg.click('[data-a="xfGet"]'); await pg.waitForFunction(()=>!UI.title,{},{timeout:30000});
  const after=await pg.evaluate(()=>({slot:curSlot(),user:G.user,day:G.day,year:G.year,n:Object.keys(G.players).length,used:SLOT_IDS.filter(n=>slotUsed(n,meta())).length,active:meta().active,tab:UI.tab}));
  assert.notEqual(after.slot,before.slot,'새 슬롯'); assert.deepEqual([after.user,after.day,after.year,after.n],[before.user,before.day,before.year,before.n],'같은 게임'); assert.equal(after.used,before.used+1); assert.equal(after.active,after.slot); assert.equal(after.tab,'home');
  assert.ok(![...env.SAVE_KV.m.keys()].some(k=>k.startsWith('x:')),'한 번 받으면 서버에서 삭제');
  console.log('처음 화면 불러오기 → 슬롯',after.slot,'에 옮겨 오기 통과');
  /* 5) 게임 중 받기: 빈 슬롯이 있으면 지금 슬롯을 덮지 않고 빈 슬롯으로. 지우기도 확인 */
  await pg.evaluate(()=>{ closeSheets(); UI.it=Object.assign(UI.it||{},{setg:'save'}); A.go('club:set'); }); await pg.click('[data-a="xfUp"]'); await pg.waitForSelector('.xf-code'); const c2=(await pg.locator('.xf-code').innerText()).trim();
  await pg.click('[data-a="xfDel"]'); await pg.waitForFunction(()=>/지웠습니다/.test(document.querySelector('.xf').innerText)); assert.ok(![...env.SAVE_KV.m.keys()].some(k=>k.startsWith('x:')),'미리 지우기');
  await pg.click('[data-a="xfUp"]'); await pg.waitForSelector('.xf-code'); const c3=(await pg.locator('.xf-code').innerText()).trim(); assert.notEqual(c3,c2);
  const s0=await pg.evaluate(()=>curSlot()); await pg.fill('#xfIn',c3); await pg.click('[data-a="xfGet"]'); await pg.waitForFunction(s=>curSlot()!==s,s0,{timeout:30000});
  assert.equal(await pg.evaluate(()=>SLOT_IDS.filter(n=>slotUsed(n,meta())).length),before.used+2,'게임 중에도 빈 슬롯으로');
  console.log('게임 중 옮겨 오기(빈 슬롯)·코드 지우기 통과', calls.length,'번 요청');
  assert.deepEqual(errs,[]);
  /* 6) 내려받은 index.html(file://): 카드 자체가 없다 */
  const p2=await ctx.newPage(); await p2.goto('file://'+path.join(root,'index.html')); await p2.waitForTimeout(800); await p2.click('[data-a="tsGo"][data-v="slots"]'); await p2.waitForSelector('[data-a="expFile"],[data-a="impFile"]',{state:'attached'});
  assert.equal(await p2.locator('.xf').count(),0,'file://에서는 기기 옮기기 숨김'); console.log('file:// 단독 파일: 기기 옮기기 숨김 통과');
 }finally{ await b?.close(); await server.close(); } })().catch(e=>{ console.error(e.stack||e); process.exitCode=1; });
