/* 성능 점검(커뮤니티 11-18 "모바일 렉이 너무 심해졌다", "컴퓨터도 렉 심해졌어요"):
   1) 자동 저장은 몰아서 한 번: 버튼을 연달아 눌러 save()가 여러 번 불려도 세이브 전체 저장(saveStoreAsync)은 한 번
   2) 압축은 Worker에서: 결과는 화면 스레드 압축(packJ)과 같은 형식이고 그대로 풀린다
   3) 얼굴 자르기 캐시: 같은 얼굴을 다시 그릴 때 캔버스로 다시 자르지 않는다(받는 중인 더 선명한 시트가 있어도)
   사용: CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium node tools/check-perf-save-1118.cjs */
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));
const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});
const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\.g/,r=>r.abort());
await p.goto(server.url);await p.waitForFunction(()=>performance.getEntriesByName('fronttime-menu-ready').length>0);await p.waitForFunction(()=>typeof newGame==='function');
const r=await p.evaluate(async()=>{ localStorage.clear(); DEMO.on=false; newGame(4); try{ fdStart(); fdAdvance(false); let n=0; while(G.fd&&!G.fd.done&&n++<400)fdAdvance(true); }catch(e){} UI.title=false; CUR_SLOT=1; SLOT_REV=0; SLOT_NEW=true; saveNow(); render();
  const wait=ms=>new Promise(r=>setTimeout(r,ms)); let n=0; const s0=window.saveStoreAsync; window.saveStoreAsync=function(){ n++; return s0.apply(this,arguments); };
  for(let i=0;i<12;i++){ G.perfMark=i; save(); await wait(80); } await wait(4500); window.saveStoreAsync=s0;
  const disk=unpack(sbGet(1)); const j=prepG(); const a=await packJAsync(j); const w=!!zWorker();
  let cut=0; const c0=window.face6Cut; window.face6Cut=function(){ cut++; return c0.apply(this,arguments); };
  const q=Object.values(G.players).find(x=>x.team===G.user&&!x.foreign); for(let i=0;i<40&&!(F6IMG&&Object.values(F6IMG).some(im=>im.ok));i++){ faceSVG(q); await wait(250); }
  faceSVG(q); const c1=cut; faceSVG(q); faceSVG(q); window.face6Cut=c0;
  return {n,mark:disk&&disk.perfMark,w,same:!!a&&a[0]===ZMK&&JSON.stringify(unpack(a))===j,c1,c2:cut,loaded:Object.values(F6IMG).some(im=>im.ok)}; });
ok(r.n===1,'save() 12번(0.08초 간격)에 세이브 전체 저장 '+r.n+'번');
ok(r.mark===11,'몰아 저장한 세이브는 마지막 상태 '+r.mark);
ok(r.w&&r.same,'Worker 압축 결과가 그대로 풀린다 '+JSON.stringify({w:r.w,same:r.same}));
ok(!r.loaded||r.c2===r.c1,'같은 얼굴을 다시 그릴 때 다시 자르지 않음 '+JSON.stringify(r));
ok(errs.length===0,'페이지 오류 없음 '+errs.slice(0,3).join('|'));
await b.close();await server.close();})().catch(e=>{console.error(e);process.exit(1);});
