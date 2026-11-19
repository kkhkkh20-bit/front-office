/* 사진 바꾸기 창(71b_photo_edit.js) 회귀 점검(브라우저)
   1) 파일을 고른 뒤 사진을 다 읽기 전에 창을 닫으면, 읽기가 끝나도 자르기 창이 다시 뜨지 않는다(닫았다 다시 연 고르기 창도 덮지 않는다)
   2) 읽지 못한 사진은 안내만 하고 창은 그대로 둔다
   3) 키보드: Tab이 창 안에서만 돌고, '갤러리에서 고르기' 버튼에 닿아 Enter·Space로 파일 고르기가 열린다. 템플릿 얼굴도 Tab으로 닿는다. 닫으면 연필 버튼으로 초점이 돌아간다
   사용: bash build.sh && node tools/check-photo-edit-ui.cjs  (CHROMIUM_EXECUTABLE_PATH) */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#ee1111"/></svg>');
const upload={name:'face.svg',mimeType:'image/svg+xml',buffer:svg}, broken={name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')};
/* 페이지의 Image를 감싸 src 넣기를 붙잡아 둔다(__phHold 동안, 고른 파일의 blob: 주소만). __phRelease()로 그때 넣는다 = 사진 읽기를 늦춘다 */
const holdImage=()=>{ const I=window.Image; window.__phHeld=[]; window.__phHold=false;
  window.__phRelease=()=>{ const L=window.__phHeld.splice(0); for(const [im,v] of L)im.src=v; return L.length; };
  window.Image=function(w,h){ const im=new I(w,h); const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
    Object.defineProperty(im,'src',{configurable:true,get(){ return d.get.call(im); },set(v){ if(window.__phHold&&/^blob:/.test(String(v))){ window.__phHeld.push([{set src(x){ d.set.call(im,x); }},v]); return; } d.set.call(im,v); }}); return im; };
  window.Image.prototype=I.prototype; };
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;
try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/opt/pw-browsers/chromium'});
 const ctx=await browser.newContext({viewport:{width:1366,height:768}}),p=await ctx.newPage(),errors=[];p.on('filechooser',()=>{}); /* 파일 고르기 가로채기를 처음부터 켜 둔다(waitForEvent와 키 누르기가 겨루면 놓친다) */p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.addInitScript(holdImage);await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await p.waitForFunction(()=>typeof newGame==='function');
 await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;UI.patchClosed=true;A.go('home');A.player(domestic(G.user).find(p=>!p.isP).id);});
 const key=await p.evaluate(()=>'p:'+UI.sheet), pen=()=>p.locator(`[data-a="phMenu"][data-v="${key}"]:visible`).first();
 const held=()=>p.evaluate(()=>window.__phHeld.length), release=async()=>{ const n=await p.evaluate(()=>window.__phRelease()); await p.waitForTimeout(300); return n; };

 // 1) 읽는 중에 닫기(× 버튼) → 읽기 끝나도 창 없음
 await p.evaluate(()=>{window.__phHold=true;});
 await pen().click();await p.waitForSelector('#phdlg .ph-box');await p.locator('#phdlg input[data-cimg]').setInputFiles(upload);
 assert.equal(await held(),1,'사진 읽기를 붙잡음');await p.locator('#phdlg [data-a="phClose"]').click();assert.equal(await p.locator('#phdlg').count(),0,'닫힘');
 assert.equal(await release(),1);assert.equal(await p.locator('#phdlg').count(),0,'읽기가 끝나도 닫은 창이 다시 뜨지 않음');assert.equal(await p.evaluate(k=>G.cimg?.[k]??null,key),null,'저장도 안 함');
 // Esc로 닫은 뒤 다시 연 고르기 창: 옛 읽기 결과가 자르기로 덮지 않음
 await pen().click();await p.waitForSelector('#phdlg .ph-box');await p.locator('#phdlg input[data-cimg]').setInputFiles(upload);await p.keyboard.press('Escape');assert.equal(await p.locator('#phdlg').count(),0,'Esc로 닫힘');
 await pen().click();await p.waitForSelector('#phdlg .ph-acts');await release();assert.equal(await p.evaluate(()=>PH.mode),'menu','새로 연 고르기 창 그대로');assert.equal(await p.locator('#phdlg .phc-stage').count(),0,'자르기로 바뀌지 않음');
 // 같은 창에서 그대로 기다리면 자르기로 넘어간다(정상 경로)
 await p.locator('#phdlg input[data-cimg]').setInputFiles(upload);await release();await p.waitForSelector('#phdlg .phc-stage canvas');assert.equal(await p.evaluate(()=>PH.mode),'crop','기다리면 자르기');
 await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>PH.mode),'menu','자르기 Esc → 고르기');
 // 2) 깨진 파일: 안내만, 창 유지, 오류 없음
 await p.evaluate(()=>{window.__phHold=false;});await p.locator('#phdlg input[data-cimg]').setInputFiles(broken);await p.waitForTimeout(400);
 assert.equal(await p.evaluate(()=>PH.mode),'menu','읽지 못해도 고르기 창 유지');assert.ok(await p.evaluate(()=>/사진을 읽지 못했습니다/.test(document.body.innerText)),'읽지 못함 안내');
 await p.keyboard.press('Escape');assert.equal(await p.locator('#phdlg').count(),0);

 // 3) 키보드
 await pen().focus();await p.keyboard.press('Enter');await p.waitForSelector('#phdlg .ph-acts');await p.waitForTimeout(50);
 const inDlg=()=>p.evaluate(()=>{ const d=document.getElementById('phdlg'), a=document.activeElement; return !!d&&d.contains(a)&&a!==d; });
 const focusDesc=()=>p.evaluate(()=>{ const a=document.activeElement; return a?(a.dataset.a||a.tagName)+'|'+(a.textContent||'').trim().slice(0,20):''; });
 assert.ok(await inDlg(),'열면 창 안에 초점');
 const nf=await p.locator('#phdlg [data-a="cosmFace"]').count();assert.ok(nf>0,'템플릿 얼굴 칸');await p.waitForTimeout(1500);assert.equal(await p.locator('#phdlg [data-a="cosmFace"]').count(),nf,'사진을 받는 동안 다시 그려도 템플릿 얼굴 칸이 비지 않음');
 const seen=[];let pick=-1,face=-1;
 for(let i=0;i<60;i++){ const f=await focusDesc(); seen.push(f); assert.ok(await inDlg(),'Tab이 창 밖으로 나가지 않음: '+i+' '+f); if(f.startsWith('phPick')&&pick<0)pick=i; if(f.startsWith('cosmFace')&&face<0)face=i; await p.keyboard.press('Tab'); }
 assert.ok(pick>=0,'Tab으로 갤러리에서 고르기 버튼에 닿음 '+seen.slice(0,6).join(','));assert.ok(face>=0,'Tab으로 템플릿 얼굴에 닿음');
 for(let i=0;i<5;i++){ await p.keyboard.press('Shift+Tab'); assert.ok(await inDlg(),'Shift+Tab도 창 안'); }
 // Enter·Space로 파일 고르기
 for(const k of ['Enter',' ']){ await p.locator('#phdlg [data-a="phPick"]').focus();const [fc]=await Promise.all([p.waitForEvent('filechooser',{timeout:3000}),p.keyboard.press(k)]);
   await fc.setFiles(upload);await p.waitForSelector('#phdlg .phc-stage canvas');assert.equal(await p.evaluate(()=>PH.mode),'crop',k+'로 고른 사진이 자르기로');assert.ok(await inDlg(),'자르기 창에도 초점');
   for(let i=0;i<12;i++){ await p.keyboard.press('Tab'); assert.ok(await inDlg(),'자르기 창 Tab도 창 안'); }
   await p.keyboard.press('Escape');await p.waitForSelector('#phdlg .ph-acts'); }
 // 템플릿 얼굴을 Enter로 고르면 창이 다시 그려져도 초점은 창 안
 const f2=p.locator('#phdlg [data-a="cosmFace"]').nth(1);const fv=await f2.getAttribute('data-v');await f2.focus();await p.keyboard.press('Enter');await p.waitForTimeout(200);
 assert.ok(await inDlg(),'템플릿 고른 뒤에도 창 안에 초점');assert.equal(await p.evaluate(()=>document.activeElement.dataset.v),fv,'고른 얼굴 버튼에 초점 유지');
 // 닫으면 연필 버튼으로 초점
 await p.keyboard.press('Escape');await p.waitForTimeout(500);assert.equal(await p.locator('#phdlg').count(),0);assert.equal(await p.evaluate(k=>{ const a=document.activeElement; return a&&a.dataset.a==='phMenu'&&a.dataset.v===k; },key),true,'닫으면 연 버튼으로 초점 '+await p.evaluate(()=>document.activeElement.outerHTML.slice(0,150)));
 assert.deepEqual(errors,[]);await ctx.close();
}finally{await browser?.close();await server.close();}console.log('사진 바꾸기 창(닫은 뒤 읽기·키보드) 검사 통과');})().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
