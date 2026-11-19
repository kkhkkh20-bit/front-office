/* 사진 고치기·자르기(71b_photo_edit.js): 사진 옆 연필 → 고르기 창 → 파일 → 자르기(끌기·휠·두 손가락·막대) → 적용 → 384px 정사각형 저장,
   자르기 다시(원본 보관), Esc 닫기·창 하나만, 소식함 비서 사진 옆 연필과 템플릿 고르기. PC(마우스)·휴대폰(터치) 두 크기 */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{startHtmlServer}=require('./lib/ui-server.cjs');
/* 위 절반 빨강·아래 절반 초록인 세로 사진(600×1200) */
const tall=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1200"><rect width="600" height="600" fill="#ee1111"/><rect y="600" width="600" height="600" fill="#11dd11"/><circle cx="300" cy="600" r="90" fill="#1144ee"/></svg>');
const upload={name:'tall.svg',mimeType:'image/svg+xml',buffer:tall};
(async()=>{const server=await startHtmlServer(path.resolve(__dirname,'../index.html'));let browser;
try{browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
for(const [width,height,touch] of [[1366,768,false],[390,844,true]]){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);
 const press=async q=>touch?q.tap():q.click();
 await p.evaluate(()=>{DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.tut={done:true,step:99};G.medSet=true;UI.title=false;A.go('home');A.player(domestic(G.user).find(p=>!p.isP).id);});
 const key=await p.evaluate(()=>'p:'+UI.sheet), pen=p.locator(`[data-a="phMenu"][data-v="${key}"]:visible`).first();
 assert.ok(await pen.count(),'선수 사진 옆 연필 버튼');
 const near=await pen.evaluate(b=>{ const im=b.parentElement.querySelector('img,.av'), r=im.getBoundingClientRect(), q=b.getBoundingClientRect(); return q.left<r.right+12&&q.right>r.left-12&&q.top<r.bottom+12&&q.bottom>r.top-12; });assert.ok(near,'연필 버튼이 사진에 붙어 있음');
 // 창 열기 → Esc 닫기(뒤 선수 창은 그대로)
 await press(pen);await p.waitForSelector('#phdlg .ph-box');await p.keyboard.press('Escape');assert.equal(await p.locator('#phdlg').count(),0,'Esc로 닫힘');assert.ok(await p.evaluate(()=>UI.sheet!=null),'뒤 선수 창 유지');
 // 파일 → 자르기
 await press(pen);await p.locator('#phdlg input[data-cimg]').setInputFiles(upload);await p.waitForSelector('#phdlg .phc-stage canvas');
 assert.equal(await p.locator('.ph-scrim').count(),1,'창은 하나만');assert.equal(await p.evaluate(k=>G.cimg?.[k]??null,key),null,'적용 전에는 저장하지 않음');
 const s0=await p.evaluate(()=>({x:PH.c.x,y:PH.c.y,s:PH.c.s,V:PH.c.V}));const box=await p.locator('#phdlg .phc-stage').boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
 if(!touch){ await p.mouse.move(cx,cy);await p.mouse.down();await p.mouse.move(cx+10,cy+40,{steps:4});await p.mouse.move(cx+10,cy+90,{steps:4});await p.mouse.up();
   const s1=await p.evaluate(()=>({y:PH.c.y,s:PH.c.s}));assert.ok(s1.y>s0.y+30,'마우스로 끌어 옮김');
   await p.mouse.move(cx,cy);await p.mouse.wheel(0,-300);await p.waitForTimeout(50);assert.ok(await p.evaluate(s=>PH.c.s>s*1.2,s1.s),'휠로 확대');await p.mouse.wheel(0,600);await p.waitForTimeout(50); }
 else { // 터치: 한 손가락 끌기, 두 손가락 벌리기(포인터 이벤트)
   const ev=(type,id,x,y)=>p.locator('#phdlg .phc-stage').dispatchEvent(type,{pointerId:id,pointerType:'touch',isPrimary:id===1,clientX:x,clientY:y,bubbles:true,cancelable:true});
   await ev('pointerdown',1,cx,cy);for(let i=1;i<=6;i++)await ev('pointermove',1,cx,cy+i*15);await ev('pointerup',1,cx,cy+90);
   const s1=await p.evaluate(()=>({y:PH.c.y,s:PH.c.s}));assert.ok(s1.y>s0.y+30,'손가락으로 끌어 옮김');
   await ev('pointerdown',1,cx-20,cy);await ev('pointerdown',2,cx+20,cy);for(let i=1;i<=5;i++){ await ev('pointermove',1,cx-20-i*10,cy);await ev('pointermove',2,cx+20+i*10,cy); }await ev('pointerup',1,cx-70,cy);await ev('pointerup',2,cx+70,cy);
   assert.ok(await p.evaluate(s=>PH.c.s>s*1.5,s1.s),'두 손가락으로 확대'); }
 // 막대: 처음 크기(덮기)로 되돌린 뒤 위쪽(빨강)이 보이게 끌어 둔 상태에서 적용
 await p.evaluate(()=>{ const c=PH.c; c.rg.value=String(Math.round(1000*Math.log(c.cov/c.min)/Math.log(c.max/c.min))); c.rg.dispatchEvent(new Event('input',{bubbles:true})); c.y=0; phClamp(); phDraw(); });
 await press(p.locator('#phdlg [data-a="phCropOk"]'));await p.waitForFunction(k=>!!G.cimg?.[k],key);assert.equal(await p.locator('#phdlg').count(),0,'적용하면 창 닫힘');
 const px=async k=>p.evaluate(async k=>{ const im=new Image(); im.src=G.cimg[k]; await im.decode(); const N=im.width,c=document.createElement('canvas'); c.width=c.height=N; const g=c.getContext('2d'); g.drawImage(im,0,0); const at=(x,y)=>[...g.getImageData(Math.round(N*x),Math.round(N*y),1,1).data]; return {w:im.width,h:im.height,top:at(.5,.05),left:at(.02,.5),mid:at(.5,.5)}; },k);
 let im=await px(key);assert.equal(im.w,384);assert.equal(im.h,384);assert.ok(im.top[0]>150&&im.top[1]<80,'끌어 둔 위쪽(빨강)이 잘린 사진 위에 있음 '+im.top);
 assert.ok(await p.evaluate(k=>!!G.cimgO?.[k],key),'자르기 다시용 원본 보관');assert.equal(await p.evaluate(k=>document.querySelector('#sheet img.av')?.getAttribute('src')===G.cimg[k],key),true,'화면 사진이 바로 바뀜');
 // 자르기 다시: 막대를 가장 작게(사진 전체) → 양옆이 어두운 배경
 const first=await p.evaluate(k=>G.cimg[k],key);await press(p.locator(`[data-a="phMenu"][data-v="${key}"]:visible`).first());await press(p.locator('#phdlg [data-a="phRecrop"]'));await p.waitForSelector('#phdlg .phc-stage canvas');
 await p.keyboard.press('Escape');await p.waitForSelector('#phdlg [data-a="phRecrop"]');assert.equal(await p.evaluate(()=>PH.mode),'menu','자르기에서 Esc는 고르기 창으로');
 await press(p.locator('#phdlg [data-a="phRecrop"]'));await p.waitForSelector('#phdlg .phc-stage canvas');await p.locator('#phdlg .phc-zoom input').fill('0');await press(p.locator('#phdlg [data-a="phCropOk"]'));await p.waitForFunction(([k,f])=>G.cimg?.[k]&&G.cimg[k]!==f,[key,first]);
 im=await px(key);assert.equal(im.w,384);assert.ok(im.left[0]<40&&im.left[1]<40,'사진 전체를 넣으면 양옆은 어두운 배경 '+im.left);assert.ok(im.mid[2]>150,'가운데 사진 유지 '+im.mid);
 // 원래대로
 await press(p.locator(`[data-a="phMenu"][data-v="${key}"]:visible`).first());await press(p.locator('#phdlg [data-a="cimgDel"]'));assert.equal(await p.evaluate(k=>G.cimg?.[k]??null,key),null,'원래대로');assert.equal(await p.evaluate(k=>G.cimgO?.[k]??null,key),null,'원본도 지움');assert.equal(await p.locator('#phdlg [data-a="cimgDel"]').count(),0,'창 안 버튼도 바로 갱신');await p.keyboard.press('Escape');
 // 소식함 비서: 사진 옆 연필, 오른쪽의 따로 떨어진 사진 버튼 없음, 템플릿 고르기
 await p.evaluate(()=>{closeSheets();mail('비서','사진 설정 확인','본문',{kind:'구단',face:'sec'});A.go('inbox');A.mailJump(G.mail[0].id);});await p.waitForTimeout(300);
 assert.equal(await p.locator('.ibm-photo').count(),0,'오른쪽 사진 버튼 제거');const sk=await p.evaluate(()=>senderPhotoKey(G.mail[0]));const sp=p.locator(`[data-a="phMenu"][data-v="${sk}"]:visible`).first();assert.ok(await sp.count(),'비서 사진 옆 연필');
 await press(sp);await p.waitForSelector('#phdlg .sec-pick[open]');const t=p.locator('#phdlg [data-a="secPh"]').nth(3);const tv=await t.getAttribute('data-v');await press(t);assert.equal(await p.evaluate(()=>Object.values(G.secPh||{})[0]),tv.split('|')[1],'템플릿 사진 고름');assert.equal(await p.locator('#phdlg').count(),1,'템플릿을 골라도 창 유지');
 await p.locator('#phdlg input[data-cimg]').setInputFiles(upload);await p.waitForSelector('#phdlg .phc-stage canvas');await press(p.locator('#phdlg [data-a="phCropOk"]'));await p.waitForFunction(k=>!!G.cimg?.[k],sk);
 assert.equal(await p.locator(`[data-a="phMenu"][data-v="${sk}"]:visible`).first().evaluate((b,k)=>b.parentElement.querySelector('img').getAttribute('src')===G.cimg[k],sk),true,'비서 사진 바로 바뀜');
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'가로 넘침 없음');assert.deepEqual(errors,[]);console.log(width+'×'+height+' 사진 자르기·연필 버튼·소식함 비서 통과');await ctx.close();
}
}finally{await browser?.close();await server.close();}console.log('사진 자르기 검사 통과');})().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
