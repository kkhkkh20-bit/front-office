/* 저장 슬롯 점검(검수 11-07): 새 게임이 기존 슬롯을 덮지 않음, 다른 탭 저장 충돌, 빈 슬롯 새 게임 취소, 구형 세이브 이전 */
const {chromium}=require('playwright');
(async()=>{ const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844}}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+require('path').resolve(__dirname,'../index.html')); await pg.waitForTimeout(800);
 const start=async()=>{ await pg.click('[data-a="tsGo"][data-v="mode"]'); await pg.click('[data-a="smode"][data-v="take"]',{timeout:120000}); await pg.waitForSelector('.tmk',{timeout:120000}); await pg.click('.tmk [data-a="start"].btn'); await pg.fill('#gp-name','점검'); await pg.click('[data-a="gpStart"]'); await pg.waitForTimeout(1500); };
 await start();
 const r={};
 r.a=await pg.evaluate(()=>{ G.day+=5; const d=G.day; const ok=saveNow(); return {cur:curSlot(),ok,d}; });
 await pg.evaluate(()=>A.toTitle()); await pg.waitForTimeout(300);
 await start();
 r.b=await pg.evaluate(()=>({cur:curSlot(),act:meta().active,s1:unpack(localStorage.getItem(slotKey(1))).day,s2:!!localStorage.getItem(slotKey(2))}));
 // 다른 탭 저장 흉내
 r.c=await pg.evaluate(()=>{ const m=meta(); m.slots[curSlot()].rev=(m.slots[curSlot()].rev||0)+1; setMeta(m); const ok=saveNow(); return {ok,confl:SAVE_CONFL}; });
 // #10: 빈 슬롯 새 게임 누르고 돌아오기
 r.d=await pg.evaluate(()=>{ const a0=meta().active; A.slotNew(5); UI.title=true; UI.sstep='main'; render(); return {a0,a1:meta().active,cont:!!document.querySelector('[data-a="tsCont"]')}; });
 // #7: 구형 세이브 + 목록 비고 슬롯 본문 존재
 r.e=await pg.evaluate(()=>{ const s1=localStorage.getItem(slotKey(1)); const g=unpack(s1); const old=packJ(JSON.stringify(Object.assign(g,{day:25}))); localStorage.clear(); localStorage.setItem(slotKey(1),s1); localStorage.setItem(SAVE,old); localStorage.setItem(META,JSON.stringify({active:1,slots:{}})); CUR_SLOT=null; const L=load(); const m=meta(); return {loadedDay:L&&L.day, s1:unpack(localStorage.getItem(slotKey(1))).day, s2:unpack(localStorage.getItem(slotKey(2))).day, slots:Object.keys(m.slots), act:m.active}; });
 const ok=r.a.ok&&r.b.cur===2&&r.b.s1===r.a.d&&r.c.ok===false&&r.d.a1===r.d.a0&&r.d.cont&&r.e.s1===r.a.d&&r.e.s2===25&&r.e.act===1&&!errs.length;
 console.log(ok?'저장 점검 통과':'저장 점검 실패 '+JSON.stringify(r)+' '+errs.join('|')); await b.close(); process.exit(ok?0:1); })();
