/* 저장 공간이 가득 찼을 때 IndexedDB로 넘어가는 저장(사용자 11-12): 가득 찬 상태 저장·다른 슬롯 옮기기·새로고침 뒤 이어하기·슬롯 열기·공간이 나면 복귀·삭제. 사용: node tools/check-save-idb.cjs */
const {chromium}=require('playwright');const {startHtmlServer}=require('./lib/ui-server.cjs');
const ok=(c,m)=>{ console.log((c?'통과':'실패')+' '+m); if(!c)process.exitCode=1; };
(async()=>{const server=await startHtmlServer(require('path').resolve(__dirname,'../index.html'));const b=await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{});const ctx=await b.newContext({viewport:{width:1366,height:800}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/fonts\.g/,r=>r.abort());
await p.goto(server.url);await p.waitForFunction(()=>typeof newGame==='function');
// 1) 새 게임 두 개(슬롯 1, 2) 저장
await p.evaluate(()=>{ localStorage.clear(); DEMO.on=false; newGame(6); try{hireMgr(G.mmarket[0].id,3);}catch(e){} G.tut={done:true,step:99}; G.medSet=true; UI.title=false; CUR_SLOT=1; SLOT_REV=0; SLOT_NEW=true; saveNow(); });
const s1=await p.evaluate(()=>({has:slotHas(1),ls:sbLsGet(1)!=null,day:G.day}));ok(s1.has&&s1.ls,'평소 저장은 localStorage');
await p.evaluate(()=>{ A.slotCopy(); });
const c=await p.evaluate(()=>SLOT_IDS.filter(n=>slotHas(n)));ok(c.length===2,'빈 슬롯에 복사 '+c);
// 2) localStorage를 거의 가득 채운 뒤 진행·저장
const filled=await p.evaluate(()=>{ let k=0; for(const sz of [262144,16384,1024,64]){ const chunk='x'.repeat(sz); try{ for(;k<4000;k++)localStorage.setItem('junk'+k,chunk); }catch(e){} } return k; });
const r2=await p.evaluate(async()=>{ G.day+=1; G.memoTest='after-full'; G.pad=Array.from({length:40000},()=>Math.random().toString(36).slice(2)).join(''); const okSave=saveNow(); await new Promise(r=>setTimeout(r,800)); const m=meta(); return {okSave,err:SAVE_ERR,flag:!!(m.slots[1]&&m.slots[1].idb),ls:sbLsGet(1)!=null,sb:SB.has(1)}; });
ok(r2.okSave&&!r2.err,'가득 찬 상태에서도 저장 성공 '+JSON.stringify(r2)); ok(r2.flag&&!r2.ls,'본문이 IndexedDB로 옮겨지고 localStorage 사본은 지워짐');
const r3=await p.evaluate(async()=>{ await new Promise(r=>setTimeout(r,1500)); const m=meta(); return {f2:!!(m.slots[2]&&m.slots[2].idb),ls2:sbLsGet(2)!=null}; });
ok(r3.f2&&!r3.ls2,'다른 슬롯도 IndexedDB로 옮겨 공간 확보 '+JSON.stringify(r3));
// 3) 새로고침 뒤 이어하기
await p.reload();await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.memoTest!==undefined,null,{timeout:15000}).catch(()=>{});
const r4=await p.evaluate(()=>({g:!!G,memo:G&&G.memoTest,slot:curSlot(),has2:slotHas(2),size1:slotSize(1)}));ok(r4.g&&r4.memo==='after-full'&&r4.slot===1,'새로고침 뒤 IndexedDB 본문으로 이어하기 '+JSON.stringify(r4));ok(r4.has2,'슬롯 2도 목록에 남음');
// 4) 슬롯 2 열기 → 저장 → 다시 슬롯 1
await p.evaluate(()=>{ UI.title=false; A.slotLoad(2); });await p.waitForTimeout(800);
const r5=await p.evaluate(()=>({slot:curSlot(),g:!!G}));ok(r5.slot===2&&r5.g,'IndexedDB 슬롯 열기 '+JSON.stringify(r5));
// 5) 공간 비운 뒤 저장하면 localStorage로 돌아옴
const r6=await p.evaluate(async()=>{ for(let k=0;k<4000;k++)localStorage.removeItem('junk'+k); G.day+=1; saveNow(); await new Promise(r=>setTimeout(r,500)); const m=meta(); return {flag:!!m.slots[2].idb,ls:sbLsGet(2)!=null,sb:SB.has(2)}; });
ok(!r6.flag&&r6.ls&&!r6.sb,'공간이 나면 localStorage로 복귀 '+JSON.stringify(r6));
// 6) 슬롯 1(IndexedDB) 삭제
const r7=await p.evaluate(async()=>{ A.slotDel(1); A.slotDel(1); await new Promise(r=>setTimeout(r,500)); const m=meta(); const idb=await sbRead(1); return {list:!!m.slots[1],has:slotHas(1),idb:idb==null,msg:UI.slotMsg}; });
ok(!r7.list&&!r7.has&&r7.idb,'IndexedDB 슬롯 삭제 '+JSON.stringify(r7));
ok(errs.length===0,'페이지 오류 없음 '+errs.join('|'));
await b.close();await server.close();})().catch(e=>{console.error(e);process.exit(1);});
