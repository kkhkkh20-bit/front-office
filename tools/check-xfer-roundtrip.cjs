/* 기기 옮기기 왕복 점검(카페 11-17 "A기기 12/27 → B기기 1/10 → 다시 A기기면 12/27부터"): 저장은 기기마다 따로라 A에는 옛 슬롯이 남는다.
   브라우저 문맥(context) 셋을 서로 다른 기기로 보고, /api/transfer는 실제 worker/index.js를 가짜 KV 하나로 함께 쓴다.
   - A에서 새 게임(D1) → 코드 → B가 받아 14일 진행(D2) → 코드 → A가 받으면 같은 게임 슬롯과 날짜·저장 시각을 나란히 보이고 '바꾸기'가 먼저 → 바꾸면 그 슬롯이 이어하기(D2)
   - 반대로 B가 A의 옛 저장(D1)을 받으면 경고하고 '새 슬롯'이 먼저, '바꾸기'는 두 번 눌러야 하고 한 번으로는 B의 D2가 그대로
   - A2(같은 게임 D1)가 '새 슬롯에 넣기'를 고르면 이 기기 슬롯(D1)은 그대로 남는다
   - 세계 번호가 없는 옛 저장은 단장 이름·취임 해·시작 해로 '같은 게임으로 보이는' 슬롯을 찾는다
   사용: bash build.sh 뒤 node tools/check-xfer-roundtrip.cjs (CHROMIUM_EXECUTABLE_PATH로 브라우저 지정, CAPTURE=폴더면 390px 묻는 화면 저장) */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const root=path.resolve(__dirname,'..');
function fakeKV(){ const m=new Map(); return { m, async get(k){ return m.has(k)?m.get(k).v:null; }, async getWithMetadata(k){ const e=m.get(k); return {value:e?e.v:null,metadata:e?e.meta:null}; }, async put(k,v,o={}){ m.set(k,{v:String(v),meta:o.metadata||null}); }, async delete(k){ m.delete(k); } }; }
(async()=>{ const {handle}=await import(path.join(root,'worker/index.js')); const server=await startHtmlServer(path.join(root,'index.html')); let b; const env={SAVE_KV:fakeKV()}; let ip=1;
 try{ b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
  const errs=[];
  async function device(name){ const ctx=await b.newContext({viewport:{width:1280,height:900}}), pg=await ctx.newPage(); pg.on('pageerror',e=>errs.push(name+': '+e.message));
   await pg.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
   const myIp='203.0.113.'+(ip++); /* 기기마다 다른 IP: 시간당 올리기 제한(10번)에 걸리지 않게 */
   await pg.route('**/api/transfer**',async route=>{ const r=route.request(); const h=Object.assign({},r.headers(),{'cf-connecting-ip':myIp}); const body=r.method()==='POST'?r.postDataBuffer():undefined;
    const res=await handle(new Request(r.url(),{method:r.method(),headers:h,body}),env); await route.fulfill({status:res.status,headers:Object.fromEntries(res.headers),body:Buffer.from(await res.arrayBuffer())}); });
   await pg.goto(server.url); await pg.waitForTimeout(500); return pg; }
  const state=pg=>pg.evaluate(()=>{ const m=meta(), used=SLOT_IDS.filter(n=>slotHas(n)); return {title:!!UI.title,cur:G?curSlot():null,day:G?G.day:null,wid:G?G.wid||null:null,active:m.active,cont:contSlot(m),
    slots:Object.fromEntries(used.map(n=>{ const h=unpack(sbGet(n)); return [n,{day:h.day,wid:h.wid||null,metaDay:(m.slots[n]||{}).day}]; }))}; });
  /* 화면으로 코드 만들기(세계 번호를 붙이는 길) */
  async function codeUI(pg){ await pg.evaluate(()=>{ closeSheets(); XF.out=null; A.go('cfg:save'); }); await pg.waitForSelector('[data-a="xfUp"]'); await pg.click('[data-a="xfUp"]'); await pg.waitForSelector('.xf-code'); return (await pg.locator('.xf-code').innerText()).trim(); }
  /* 같은 상태로 코드를 하나 더(받는 쪽 점검용) */
  const codeApi=pg=>pg.evaluate(async()=>{ const r=await fetch('/api/transfer',{method:'POST',body:LZString.compressToBase64(prepG()),headers:{'Content-Type':'text/plain'}}); return (await r.json()).code; });
  async function receiveFromTitle(pg,code){ await pg.goto(server.url); await pg.waitForTimeout(500); await pg.click('[data-a="tsGo"][data-v="slots"]'); await pg.waitForSelector('#xfIn'); await pg.fill('#xfIn',code); await pg.click('[data-a="xfGet"]'); }
  const dlabel=(pg,d)=>pg.evaluate(d=>xfD(d),d);

  /* A: 새 게임(D1) */
  const A=await device('A');
  await A.click('[data-a="tsGo"][data-v="mode"]'); await A.click('[data-a="smode"][data-v="take"]',{timeout:120000}); await A.waitForSelector('.tmk',{timeout:120000}); await A.click('.tmk [data-a="start"].btn'); await A.fill('#gp-name','왕복점검'); await A.click('[data-a="gpStart"]'); await A.waitForTimeout(1500);
  await A.evaluate(()=>{ G.tut={done:true,step:99}; saveNow(); });
  const a0=await state(A); const D1=a0.day, aSlot=a0.cur; assert.equal(a0.wid,null,'새 게임에는 아직 세계 번호가 없다(대회·래더를 쓰기 전)');
  const c1=await codeUI(A); const a1=await state(A); assert.match(a1.wid||'',/^w[0-9a-f]{16}$/,'코드를 만들 때 세계 번호를 붙인다');
  await A.evaluate(()=>saveNow()); assert.equal((await state(A)).slots[aSlot].wid,a1.wid,'A 슬롯에도 세계 번호 저장');
  const c1b=await codeApi(A);
  console.log('A: 새 게임',await dlabel(A,D1),'· 코드',c1,'(세계 번호',a1.wid+')');

  /* B: 받아서(빈 기기라 묻지 않고 빈 슬롯) 14일 진행 */
  const B=await device('B'); await receiveFromTitle(B,c1); await B.waitForFunction(()=>!UI.title,{},{timeout:30000});
  assert.equal(await B.locator('.xf-ask').count(),0,'같은 게임 슬롯이 없으면 묻지 않음');
  const D2=D1+14; await B.evaluate(d=>{ G.tut={done:true,step:99}; G.day=d; saveNow(); },D2); const b1=await state(B); assert.equal(b1.wid,a1.wid); assert.equal(b1.slots[b1.cur].day,D2);
  const c2=await codeApi(B), c2b=await codeApi(B);
  console.log('B: 받아서',await dlabel(B,D2),'까지 진행 · 코드',c2,c2b);

  /* B가 A의 옛 저장(D1)을 받는 경우: 경고, 새 슬롯이 기본, 한 번 눌러서는 덮지 않는다 */
  const c3=await codeApi(A); await receiveFromTitle(B,c3); await B.waitForSelector('.xf-ask',{timeout:30000});
  { const t=await B.locator('.xf-ask').innerText(); assert.match(t,/앞 날짜입니다/); assert.match(t,/사라집니다/); assert.ok(t.includes(await dlabel(B,D1))&&t.includes(await dlabel(B,D2)),'두 날짜'); assert.match(t,/다른 기기에서 보낸 시각/);
    assert.equal(await B.locator('.xf-ask .btn.primary').getAttribute('data-v'),'empty','옛 저장이면 새 슬롯이 기본'); }
  await B.click('.xf-ask [data-a="xfImp"][data-v="rep"]'); await B.waitForSelector('text=한 번 더 눌러 바꾸기');
  { const s=await state(B); assert.equal(s.slots[b1.cur].day,D2,'한 번 눌러서는 B의 더 최근 저장을 덮지 않는다'); assert.equal(Object.keys(s.slots).length,1); }
  await B.reload(); await B.waitForTimeout(500); { const s=await state(B); assert.equal(s.slots[b1.cur].day,D2); assert.equal(s.cont,b1.cur); }
  console.log('B: A의 옛 저장을 받으면 경고·새 슬롯 기본·두 번 눌러야 바꿈 → B의 최근 저장 그대로 통과');

  /* A로 돌아오기: 새로고침하면 이어하기는 A의 옛 슬롯(D1). 코드를 받으면 같은 게임으로 알아보고 바꾸기가 먼저 */
  await A.goto(server.url); await A.waitForTimeout(500);
  assert.match(await A.locator('[data-a="tsCont"]').innerText(),new RegExp((await A.evaluate(d=>dstr(d),D1)).split(' ').slice(1,3).join(' ')),'돌아온 A의 이어하기는 옛 날짜(제보 상황 재현)');
  await receiveFromTitle(A,c2); await A.waitForSelector('.xf-ask',{timeout:30000});
  { const t=await A.locator('.xf-ask').innerText(); assert.match(t,/더 나중 날짜입니다/); const L=await dlabel(A,D1), R=await dlabel(A,D2); assert.ok(t.includes(`이 슬롯(${L})을 받은 저장(${R})으로 바꾸기`),'바꾸기 버튼에 두 날짜'); assert.match(t,/저장 \d/); assert.match(t,/다른 기기에서 보낸 시각/);
    assert.equal(await A.locator('.xf-ask .btn.primary').getAttribute('data-v'),'rep','더 최근이면 바꾸기가 기본'); }
  if(process.env.CAPTURE){ require('node:fs').mkdirSync(process.env.CAPTURE,{recursive:true}); await A.setViewportSize({width:390,height:844}); await A.locator('.xf-ask').scrollIntoViewIfNeeded(); await A.screenshot({path:path.join(process.env.CAPTURE,'xfer-ask-390.png')}); await A.setViewportSize({width:1280,height:900}); }
  await A.click('.xf-ask [data-a="xfImp"][data-v="rep"]'); await A.waitForFunction(()=>!UI.title,{},{timeout:30000});
  { const s=await state(A); assert.equal(s.cur,aSlot,'같은 슬롯을 바꿈'); assert.equal(s.day,D2); assert.equal(s.slots[aSlot].day,D2); assert.equal(s.active,aSlot); assert.equal(Object.keys(s.slots).length,1,'슬롯이 늘지 않음'); assert.equal(s.slots[aSlot].metaDay,D2); }
  await A.goto(server.url); await A.waitForTimeout(500); { const s=await state(A); assert.equal(s.cont,aSlot); assert.equal(s.slots[aSlot].day,D2); }
  await A.click('[data-a="tsCont"]'); await A.waitForFunction(()=>!UI.title,{},{timeout:30000}); assert.equal(await A.evaluate(()=>G.day),D2,'이어하기가 B에서 진행한 날짜부터');
  assert.equal(env.SAVE_KV.m.has('x:'+c2),false,'받은 코드는 서버에서 삭제');
  console.log('A: 돌아와 받은 저장으로 바꾸기 →',await dlabel(A,D2),'부터 이어하기 통과');

  /* 게임 중(그 슬롯을 열어 둔 채)에 B의 더 최근 저장을 받아도 같은 슬롯을 바꾸고 계속 그 슬롯에서 */
  { const D3=D2+7; await B.evaluate(d=>{ G.day=d; saveNow(); },D3); const c4=await codeApi(B);
    await A.evaluate(()=>{ closeSheets(); A.go('cfg:save'); }); await A.waitForSelector('#xfIn'); await A.fill('#xfIn',c4); await A.click('[data-a="xfGet"]'); await A.waitForSelector('.xf-ask',{timeout:30000});
    await A.click('.xf-ask [data-a="xfImp"][data-v="rep"]'); await A.waitForFunction(d=>G&&G.day===d,D3,{timeout:30000});
    const s=await state(A); assert.equal(s.cur,aSlot); assert.equal(s.slots[aSlot].day,D3); assert.equal(s.active,aSlot); assert.equal(Object.keys(s.slots).length,1);
    console.log('A: 게임 중 받기 → 지금 슬롯을',await dlabel(A,D3),'로 바꾸기 통과'); }

  /* A2: 같은 게임(D1)을 가진 다른 기기가 '새 슬롯에 넣기'를 고르면 이 기기 슬롯은 그대로 */
  const A2=await device('A2'); await receiveFromTitle(A2,c1b); await A2.waitForFunction(()=>!UI.title,{},{timeout:30000}); const x0=await state(A2);
  await receiveFromTitle(A2,c2b); await A2.waitForSelector('.xf-ask',{timeout:30000}); await A2.click('.xf-ask [data-a="xfImp"][data-v="empty"]'); await A2.waitForFunction(()=>!UI.title,{},{timeout:30000});
  { const s=await state(A2); assert.equal(s.slots[x0.cur].day,D1,'이 기기 저장 그대로'); assert.notEqual(s.cur,x0.cur); assert.equal(s.slots[s.cur].day,D2); assert.equal(Object.keys(s.slots).length,2); }
  console.log('A2: 새 슬롯에 넣기를 고르면 이 기기 저장(',await dlabel(A2,D1),') 그대로 통과');

  /* 세계 번호가 없는 옛 저장: 단장 이름·취임 해·시작 해로 같은 게임으로 보이는 슬롯 */
  { const r=await A2.evaluate(()=>{ const g=JSON.parse(prepG()); delete g.wid; g.day+=3; const k=xfMatch(LZString.compressToBase64(JSON.stringify(g))); g.gmP=Object.assign({},g.gmP,{name:'다른단장'}); const k2=xfMatch(LZString.compressToBase64(JSON.stringify(g))); return {k,k2}; });
    assert.ok(r.k&&r.k.guess&&r.k.newer,'번호 없는 옛 저장도 같은 게임으로 봄'); assert.equal(r.k2,null,'단장이 다르면 다른 게임'); }
  console.log('세계 번호 없는 옛 저장: 단장·해로 맞추기 통과');
  assert.deepEqual(errs,[]);
 }finally{ await b?.close(); await server.close(); } })().catch(e=>{ console.error(e.stack||e); process.exitCode=1; });
