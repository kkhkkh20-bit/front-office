/* 이름·얼굴 바꾸기 화면 점검(브라우저): 선수 화면 고치기 상자(능력 칸 없음·얼굴 고르기), 일괄 수정 창(이름 고치기·묶음·가져오기 미리보기·적용), PC 페이지 스크롤 없음, 390px 가로 넘침 없음.
 사용: bash build.sh && node tools/check-cosmetic-ui.cjs  (COSM_OUT=스크린샷 폴더, CHROMIUM_EXECUTABLE_PATH) */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'), OUT=process.env.COSM_OUT||'/tmp/cosmetic-ui'; fs.mkdirSync(OUT,{recursive:true});
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'};
const server=http.createServer((q,r)=>{ const u=decodeURIComponent(q.url.split('?')[0]), f=path.join(ROOT,u==='/'?'index.html':u); if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ r.writeHead(404); r.end(); return; } r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
const setup=()=>{ DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); let n=0; while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true); hireMgr(G.mmarket[0].id,3); G.tut={done:true,step:99}; UI.title=false; UI.patchClosed=true; render(); };
(async()=>{ await new Promise(r=>server.listen(0,'127.0.0.1',r)); const url=`http://127.0.0.1:${server.address().port}/`; let browser;
  try{ browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/opt/pw-browsers/chromium'});
    for(const [w,h] of [[1366,768],[390,844]]){ const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:w<1100,hasTouch:w<1100}), page=await ctx.newPage(), errs=[]; page.setDefaultTimeout(15000);
      page.on('pageerror',e=>errs.push(e.message)); await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'})); await page.goto(url); await page.waitForFunction(()=>typeof newGame==='function');
      await page.evaluate(setup);
      /* 1) 다른 구단 선수 화면: 고치기 상자 */
      const pid=await page.evaluate(()=>{ const t=G.teams.find(t=>t.id!==G.user).id, p=playersOf(t).find(x=>!x.foreign); UI.sheet=p.id; UI.ptab='sum'; renderSheet(); A.pEditOpen(p.id); return p.id; });
      await page.waitForSelector('#sheet .pe-box'); await page.waitForTimeout(1500); await page.evaluate(()=>renderSheet());
      const box=await page.evaluate(()=>({abil:!!document.querySelector('#pe-age,#pe-pot,[id^="pe-r-"]'),faces:document.querySelectorAll('#sheet .pe-box .pe-face').length,imgs:document.querySelectorAll('#sheet .pe-box .pe-face img').length,up:!!document.querySelector('#sheet .pe-box [data-a="phMenu"]')}));
      assert.equal(box.abil,false,'능력·나이 입력칸이 남아 있음'); assert.ok(box.faces>=12,'얼굴 후보 '+box.faces); assert.ok(box.up,'직접 사진 넣기 버튼');
      await page.screenshot({path:path.join(OUT,`${w}-player-edit.png`)});
      const pick=await page.evaluate(id=>{ const b=[...document.querySelectorAll('#sheet .pe-box .pe-face:not(.on)')][2]; const n=+b.dataset.v.split(':')[1]; b.click(); return {n,cur:face6Idx(G.players[id])}; },pid); assert.equal(pick.cur,pick.n,'고른 얼굴이 적용되지 않음');
      await page.fill('#pe-nm','바뀐이름'); await page.click('#sheet [data-a="pEditSave"]'); assert.equal(await page.evaluate(id=>G.players[id].name,pid),'바뀐이름');
      await page.fill('#pe-nm','x').catch(()=>{});
      await page.evaluate(id=>{ A.pEditOpen(id); },pid); await page.fill('#pe-nm','시발놈'); await page.click('#sheet [data-a="pEditSave"]'); assert.match(await page.locator('#sheet .pe-box .bad').innerText(),/쓸 수 없는 말/); assert.equal(await page.evaluate(id=>G.players[id].name,pid),'바뀐이름');
      /* 2) 설정 › 게임 설정 › 표시 카드 → 일괄 창 */
      await page.evaluate(()=>{ closeSheets(); UI.pEdit=null; UI.it=Object.assign(UI.it||{},{setg:'view'}); A.go('cfg:set'); });
      await page.waitForSelector('[data-a="cosmOpen"]'); await page.click('[data-a="cosmOpen"]'); await page.waitForSelector('#sheet .cosm-sheet'); await page.waitForTimeout(1200); await page.evaluate(()=>renderSheet());
      const n0=await page.locator('#sheet .cosm-nm').count(); assert.ok(n0>=20,'표 줄 '+n0);
      const first=page.locator('#sheet .cosm-nm').first(); await first.fill('일괄이름'); assert.match(await page.locator('#sheet [data-a="cosmSave"]').innerText(),/1명/);
      await page.screenshot({path:path.join(OUT,`${w}-bulk.png`)});
      const geo=await page.evaluate(()=>({doc:document.scrollingElement.scrollHeight-innerHeight,wide:document.documentElement.scrollWidth-innerWidth,sheet:(e=>e&&e.scrollWidth-e.clientWidth)(document.querySelector('#sheet .cosm-sheet'))}));
      if(w>=1100)assert.ok(geo.doc<=1,'PC 페이지 스크롤 '+geo.doc); assert.ok(geo.wide<=1,'가로 넘침 '+geo.wide);
      const fid=await page.evaluate(()=>+document.querySelector('#sheet .cosm-nm').dataset.id); await page.click('#sheet [data-a="cosmSave"]'); assert.equal(await page.evaluate(id=>G.players[id].name,fid),'일괄이름');
      /* 얼굴 고르기(줄의 얼굴 버튼) */
      await page.locator('#sheet .cosm-avb').nth(1).click(); await page.waitForSelector('#sheet .cosm-pick .pe-face'); await page.screenshot({path:path.join(OUT,`${w}-bulk-face.png`)});
      await page.click('#sheet .cosm-pick [data-a="cosmPick"]');
      /* 묶음 바꾸기: 드래프트 대상 · 은퇴 */
      await page.selectOption('#sheet select[data-cosm="sc"]','pro'); await page.waitForTimeout(200); assert.ok(await page.locator('#sheet .cosm-nm').count()>0,'드래프트 대상 줄');
      /* 3) 가져오기: 텍스트 → 미리보기 → 적용 */
      await page.selectOption('#sheet select[data-cosm="sc"]',await page.evaluate(()=>'t:'+G.user)); await page.click('#sheet [data-a="cosmIo"]'); await page.click('#sheet [data-a="cosmExp"][data-v="text"]');
      const txt=await page.locator('#sheet .cosm-txt').inputValue(); assert.match(txt.split('\n')[0],/^id,구단,현재 이름,새 이름,얼굴 번호$/);
      const L=txt.split('\n'); const c1=L[1].split(','); c1[3]='가져온선수'; L[1]=c1.join(','); L.push('999999,x,없음,누구,'); await page.fill('#sheet .cosm-txt',L.join('\n'));
      await page.click('#sheet [data-a="cosmPv"]'); await page.waitForSelector('#sheet .cosm-pv'); const pvT=await page.locator('#sheet .cosm-pv').innerText(); assert.match(pvT,/바뀜 1명/); assert.match(pvT,/문제 1줄/);
      await page.screenshot({path:path.join(OUT,`${w}-import-preview.png`)});
      const geo2=await page.evaluate(()=>({doc:document.scrollingElement.scrollHeight-innerHeight,wide:document.documentElement.scrollWidth-innerWidth})); if(w>=1100)assert.ok(geo2.doc<=1,'PC 페이지 스크롤(미리보기) '+geo2.doc); assert.ok(geo2.wide<=1,'가로 넘침(미리보기) '+geo2.wide);
      await page.click('#sheet [data-a="cosmApply"]'); assert.equal(await page.evaluate(id=>G.players[id].name,+c1[0]),'가져온선수'); assert.match(await page.locator('#sheet .cosm-sheet [role=status]').innerText(),/이름 1명/);
      await page.keyboard.press('Escape'); assert.equal(await page.locator('#sheet .cosm-sheet').count(),0,'Esc·뒤로로 닫히지 않음');
      /* 4) 사진 연필 창에 템플릿 칸 */
      await page.evaluate(id=>{ UI.sheet=id; UI.ptab='sum'; renderSheet(); A.phMenu('p:'+id); },pid); await page.waitForSelector('#phdlg .pe-face'); await page.screenshot({path:path.join(OUT,`${w}-photo-dialog.png`)}); await page.evaluate(()=>A.phClose());
      assert.deepEqual(errs,[],'페이지 오류: '+errs.join(' | ')); console.log(`통과  ${w}px: 고치기 상자(능력 칸 없음·얼굴 ${box.faces}장)·일괄 창(${n0}줄)·가져오기 미리보기·적용·사진 창 템플릿, 페이지 스크롤 ${geo.doc}·가로 ${geo.wide}`);
      await ctx.close(); }
  } finally { if(browser)await browser.close(); server.close(); }
  console.log('이름·얼굴 화면 점검: 모두 통과 · 스크린샷 '+OUT); })().catch(e=>{ console.error(e); process.exit(1); });
