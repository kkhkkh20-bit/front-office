/* 모바일 저장 점검(카페 11-13 쌉싸코: "빈 슬롯에 저장해도 다시 켜면 이어하기가 없다"):
   1) 휴대폰 화면에서 새 게임 → 창단 드래프트 진행 → 자동 저장 → 새로고침 뒤 이어하기
   2) 다른 사이트(itch 껍데기처럼) 안에 끼워 열면(iframe) 저장이 사라질 수 있다는 안내와 '새 창에서 열기'가 보이는지
   사용: CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium node tools/check-save-mobile.cjs */
const {chromium,devices}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');const http=require('http');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));
const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\.g/,r=>r.abort());
await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function');
const r=await p.evaluate(async()=>{ localStorage.clear(); DEMO.on=false; newGame(4); try{ if(typeof fdStart==='function')fdStart(); }catch(e){} UI.title=false; CUR_SLOT=1; SLOT_REV=0; SLOT_NEW=true; const ok1=saveNow(); const fd0=!!(G.fd&&!G.fd.done);
  try{ let n=0; if(typeof fdAdvance==='function'){ fdAdvance(false); while(G.fd&&!G.fd.done&&n++<400)fdAdvance(true); } }catch(e){} G.markT='after-draft'; save(); await new Promise(r=>setTimeout(r,2500)); return {ok1,fd0,done:G.fd?!!G.fd.done:null,err:SAVE_ERR,has:slotHas(1)}; });
ok(r.ok1&&r.has&&!r.err,'휴대폰 화면 첫 저장 '+JSON.stringify(r));
await p.reload();await p.waitForFunction(()=>typeof G!=='undefined',null,{timeout:15000});await p.waitForTimeout(1500);
const t=await p.evaluate(()=>({g:!!G,mark:G&&G.markT,done:G&&G.fd?!!G.fd.done:null,cont:/이어하기/.test(document.body.innerText)}));
ok(t.g&&t.mark==='after-draft'&&t.cont,'새로고침 뒤 창단 드래프트 이후 상태로 이어하기 '+JSON.stringify(t));
ok(errs.length===0,'페이지 오류 없음 '+errs.join('|'));
// 2) 다른 출처 페이지 안의 iframe
const outer=http.createServer((q,s)=>{ s.writeHead(200,{'content-type':'text/html; charset=utf-8'}); s.end(`<!doctype html><meta name=viewport content="width=device-width"><iframe id=g src="${server.url}" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>`); });
await new Promise(res=>outer.listen(0,'127.0.0.1',res)); const ou=`http://localhost:${outer.address().port}/`;
const p2=await ctx.newPage();await p2.route(/fonts\.g/,r=>r.abort());await p2.goto(ou);const fr=await (await p2.waitForSelector('#g')).contentFrame();await fr.waitForFunction(()=>typeof newGame==='function'&&typeof render==='function',null,{timeout:20000});await fr.waitForTimeout(1500);
const e2=await fr.evaluate(()=>({warn:/새 창에서 열기/.test(document.body.innerText),emb:typeof saveEmbedded==='function'?saveEmbedded():null}));
ok(e2.emb===true&&e2.warn,'다른 사이트 안에 끼워 열면 저장 안내와 새 창 열기 버튼 '+JSON.stringify(e2));
const e3=await p.evaluate(()=>({emb:typeof saveEmbedded==='function'?saveEmbedded():null,warn:/저장이 사라질 수/.test(document.body.innerText)}));
ok(e3.emb===false&&!e3.warn,'직접 연 주소에서는 안내 없음 '+JSON.stringify(e3));
await b.close();outer.close();await server.close();})().catch(e=>{console.error(e);process.exit(1);});
