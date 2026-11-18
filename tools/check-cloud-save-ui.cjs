/* 클라우드 저장 화면 점검: 실제 Worker(worker/index.js)를 가짜 D1(node:sqlite)·가짜 R2와 함께 page.route로 돌린다.
   1) R2 없음(503 not_configured): 켜기 버튼·카드 없이 설정에 '준비 중' 한 줄
   2) 켜기 → 지금 게임 올리기(R2 1판) · PC 설정 › 저장 페이지 스크롤 없음
   3) 기기 연결 코드 → 두 번째 기기(휴대폰 390)에서 입력 → 목록에 같은 슬롯 → 받기 · 가로 넘침 없음
   4) 두 번째 기기가 더 올린 뒤 첫 기기가 옛 판으로 올리면 409 → 두 저장을 나란히 묻는 화면(덮지 않음)
   5) 복구 코드는 한 번만 보이고 서버에는 해시만
   사용: bash build.sh 뒤 node tools/check-cloud-save-ui.cjs (CHROMIUM_EXECUTABLE_PATH로 브라우저 지정, CAPTURE=폴더 를 주면 화면을 저장) */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs'),{makeD1,hasSqlite}=require('./lib/d1-shim.cjs');
const root=path.resolve(__dirname,'..'), cap=process.env.CAPTURE, shot=async(pg,name,sel)=>{ if(!cap)return; require('node:fs').mkdirSync(cap,{recursive:true}); if(sel)await pg.locator(sel).first().scrollIntoViewIfNeeded(); await pg.screenshot({path:path.join(cap,name+'.png')}); };
function fakeR2(){ const m=new Map(); return { m,
  async put(k,v){ const b=v instanceof Uint8Array?v:new Uint8Array(await new Response(v).arrayBuffer()); m.set(k,Buffer.from(b)); return {key:k}; },
  async get(k){ const b=m.get(k); return b?{key:k,body:new Response(b).body}:null; },
  async delete(k){ for(const x of [].concat(k))m.delete(x); },
  async list({prefix=''}={}){ return {objects:[...m.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false}; } }; }
(async()=>{ if(!hasSqlite){ console.log('node:sqlite 없음(노드 22.5 이상 필요): 건너뜀'); return; }
 const {handle}=await import(path.join(root,'worker/index.js')); const server=await startHtmlServer(path.join(root,'index.html')); let b;
 const env={DB:makeD1(),CUP_ADMIN:'s3cret'}, calls=[]; let ipN=1;
 const route=ip=>async r=>{ const q=r.request(), h=Object.assign({},q.headers(),{'cf-connecting-ip':ip}), body=['POST','PUT','DELETE'].includes(q.method())?q.postDataBuffer()||undefined:undefined;
   const res=await handle(new Request(q.url(),{method:q.method(),headers:h,body}),env); calls.push(q.method()+' '+new URL(q.url()).pathname+' '+res.status); await r.fulfill({status:res.status,headers:Object.fromEntries(res.headers),body:Buffer.from(await res.arrayBuffer())}); };
 const prep=async pg=>{ await pg.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'})); await pg.route('**/api/**',route('203.0.113.'+(ipN++))); };
 const errs=[];
 try{ b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
  { const r=await handle(new Request('http://x/api/v1/admin/migrate',{method:'POST',headers:{Authorization:'Bearer s3cret'}}),env); assert.equal(r.status,200); }
  /* 첫 기기(PC) */
  const ca=await b.newContext({viewport:{width:1366,height:768}}), pa=await ca.newPage(); pa.on('pageerror',e=>errs.push('A '+e.message)); await prep(pa);
  await pa.goto(server.url); await pa.waitForTimeout(500);
  await pa.click('[data-a="tsGo"][data-v="mode"]'); await pa.click('[data-a="smode"][data-v="take"]',{timeout:120000}); await pa.waitForSelector('.tmk',{timeout:120000}); await pa.click('.tmk [data-a="start"].btn'); await pa.fill('#gp-name','클라우드'); await pa.click('[data-a="gpStart"]'); await pa.waitForTimeout(1500);
  await pa.evaluate(()=>{ saveNow(); G.tut={done:true,step:99}; closeSheets(); A.go('cfg:save'); });
  /* 1) R2 없음 */
  await pa.waitForFunction(()=>CL.st==='off',{},{timeout:20000}); await pa.evaluate(()=>render());
  assert.equal(await pa.locator('.cld,[data-a="clOn"]').count(),0,'R2가 없으면 클라우드 카드·켜기 버튼 없음');
  assert.match(await pa.locator('.cl-off').innerText(),/준비 중/); assert.ok(await pa.locator('.xf').count()>0,'기기 옮기기는 그대로');
  console.log('R2 없음(503 not_configured): 켜기 숨김·준비 중 안내 통과');
  /* 2) R2 연결 → 켜기 → 올리기 */
  env.SAVES=fakeR2(); await pa.evaluate(()=>{ CL.st=''; render(); }); await pa.waitForSelector('[data-a="clOn"]',{timeout:20000});
  assert.match(await pa.locator('.cld').innerText(),/단장 이름·메모 포함/,'켜기 전에 무엇을 올리는지 알림');
  assert.equal(env.SAVES.m.size,0,'켜기 전에는 올리지 않음');
  await pa.click('[data-a="clOn"]'); await pa.waitForFunction(()=>/올렸습니다/.test(CL.msg),{},{timeout:30000});
  const wid=await pa.evaluate(()=>G.wid), pid=await pa.evaluate(()=>FrontOfficeCore.netCreate({}).player().id);
  assert.deepEqual([...env.SAVES.m.keys()],[`saves/${pid}/${wid}/1.bin`],'R2에 1판');
  assert.equal(await pa.locator('.cl-slot').count(),1); assert.equal(await pa.locator('.cl-slot').getAttribute('data-slot'),wid);
  { const f=await pa.evaluate(()=>{ window.scrollTo(0,9999); return {scroll:scrollY,h:document.documentElement.scrollHeight,vh:innerHeight}; }); assert.ok(f.scroll===0&&f.h<=f.vh+2,'PC 설정 › 저장 페이지 스크롤 없음 '+JSON.stringify(f)); }
  await shot(pa,'pc-on','.cld');
  console.log('켜기 → 지금 게임 올리기 통과(PC 페이지 스크롤 없음)',wid);
  /* 3) 기기 연결 코드 → 두 번째 기기 */
  await pa.click('[data-a="clLink"]'); await pa.waitForSelector('.cl-link'); const code=(await pa.locator('.cl-link').innerText()).trim(); assert.match(code,/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
  const cb=await b.newContext({viewport:{width:390,height:844}}), pb=await cb.newPage(); pb.on('pageerror',e=>errs.push('B '+e.message)); await prep(pb);
  await pb.goto(server.url); await pb.waitForTimeout(500); await pb.click('[data-a="tsGo"][data-v="slots"]'); await pb.waitForSelector('#clIn',{timeout:20000});
  assert.equal(await pb.evaluate(()=>clOn()),false,'두 번째 기기는 아직 꺼짐');
  await pb.fill('#clIn',code.toLowerCase()); await pb.click('[data-a="clJoin"]'); await pb.waitForSelector('.cl-slot',{timeout:30000});
  assert.equal(await pb.locator('.cl-slot').getAttribute('data-slot'),wid,'두 번째 기기 목록에 같은 슬롯'); assert.equal(await pb.evaluate(()=>FrontOfficeCore.netCreate({}).player().id),pid,'같은 플레이어');
  { const w=await pb.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,cards:[...document.querySelectorAll('.cld')].map(e=>e.getBoundingClientRect().right)})); assert.ok(w.sw<=w.cw+1&&w.cards.every(x=>x<=391),'390 가로 넘침 없음 '+JSON.stringify(w)); }
  await shot(pb,'phone-linked','.cl-slot'); await pb.click('.cl-slot [data-a="clGet"]'); await pb.waitForFunction(()=>!UI.title&&G,{},{timeout:30000});
  const bState=await pb.evaluate(()=>({wid:G.wid,base:JSON.parse(localStorage.getItem('fo-cloud-base'))[G.wid]}));
  assert.equal(bState.wid,wid); assert.equal(bState.base.rev,1); console.log('연결 코드',code,'→ 두 번째 기기 목록·받기 통과(390 가로 넘침 없음)');
  /* 4) 충돌: 두 번째 기기가 2판을 올린 뒤, 첫 기기가 1판 기준으로 올리면 409 → 묻는 화면 */
  await pb.evaluate(()=>{ G.tut={done:true,step:99}; G.cfg=G.cfg||{}; G.cfg.clProbe=2; saveNow(); closeSheets(); A.go('cfg:save'); }); await pb.waitForSelector('[data-a="clUp"]');
  { const w=await pb.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})); assert.ok(w.sw<=w.cw+1,'390 설정 › 저장 가로 넘침 없음 '+JSON.stringify(w)); } await shot(pb,'phone-settings','.cld');
  await pb.click('[data-a="clUp"]'); await pb.waitForFunction(()=>/저장했습니다/.test(CL.msg),{},{timeout:30000}); assert.ok(env.SAVES.m.has(`saves/${pid}/${wid}/2.bin`));
  await pa.evaluate(()=>{ G.cfg=G.cfg||{}; G.cfg.clProbe=1; saveNow(); render(); }); await pa.click('[data-a="clUp"]'); await pa.waitForSelector('.cl-ask',{timeout:30000});
  { const t=await pa.locator('.cl-ask').innerText(); assert.match(t,/클라우드:/); assert.match(t,/이 기기 슬롯/); assert.match(t,/클라우드 저장으로 이어 하기/); assert.match(t,/이 기기 저장으로 이어 하기/); assert.match(t,/저장/); }
  await shot(pa,'pc-conflict','.cl-ask'); assert.ok(!env.SAVES.m.has(`saves/${pid}/${wid}/3.bin`),'충돌이면 덮지 않음'); assert.ok(calls.some(c=>/^PUT \/api\/v1\/saves\/.* 409$/.test(c)));
  assert.equal(await pa.locator('[data-a="clUp"][disabled]').count(),1,'고르기 전에는 올리지 않음');
  await pa.click('.cl-ask [data-a="clUse"][data-v="cloud"]'); await pa.waitForFunction(()=>!document.querySelector('.cl-ask')&&G&&G.cfg&&G.cfg.clProbe===2,{},{timeout:30000});
  console.log('충돌(409): 두 저장 비교·고르기 → 클라우드로 이어 하기 통과');
  /* 5) 복구 코드: 한 번만 */
  await pa.evaluate(()=>{ closeSheets(); A.go('cfg:save'); }); await pa.click('[data-a="clRec"]'); await pa.waitForSelector('.cl-rec');
  await shot(pa,'pc-recovery','.cl-rec'); const rec=(await pa.locator('.cl-rec').innerText()).trim(); assert.match(rec,/^([A-HJKMNP-Z2-9]{4}-){5}[A-HJKMNP-Z2-9]{4}$/);
  assert.ok(!JSON.stringify(env.DB._sqlite.prepare('SELECT * FROM cloud_codes').all()).includes(rec.replace(/-/g,'')),'서버에는 해시만');
  await pa.click('[data-a="clRecDone"]'); await pa.evaluate(()=>{ closeSheets(); A.go('cfg:save'); });
  assert.equal(await pa.locator('.cl-rec').count(),0,'닫으면 다시 보이지 않음'); assert.ok(!(await pa.locator('#app').innerText()).includes(rec),'화면 어디에도 남지 않음');
  assert.match(await pa.locator('.cld').innerText(),/복구 코드를 만들어 두었습니다/);
  console.log('복구 코드 한 번만 보이기 통과');
  /* 기기 목록 */
  await pa.click('[data-a="clDevs"]'); await pa.waitForSelector('.cl-devs'); assert.equal(await pa.locator('.cl-devs .slot').count(),2);
  assert.deepEqual(errs,[]); console.log('기기 목록 2대 통과 ·',calls.length,'번 요청');
 }finally{ await b?.close(); await server.close(); } })().catch(e=>{ console.error(e.stack||e); process.exitCode=1; });
