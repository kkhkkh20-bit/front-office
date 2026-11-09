/* 저장 슬롯·여러 탭 점검(검수 11-09 #1~#16, 11-09zr #1~#11·#14~#17): 브라우저 없이 Node에서 저장·슬롯 코드를 직접 실행한다.
 두 "탭"은 같은 저장소(Map)를 공유하는 별도 실행 환경이고, 저장 공간 부족과 쓰기 순서는 훅으로 제어한다.
 게임 엔진 대신 작은 가짜 G를 쓴다(저장 코드는 G의 내용과 무관). 사용: node tools/check-save-slots.cjs */
const fs=require('fs'), path=require('path');
const rd=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const SRC=[rd('src/ui/runtime/00_core.js'),rd('src/ui/shell/01_layout.js'),'render=function(){};',rd('src/ui/actions/40_actions.js'),rd('src/ui/runtime/99_boot.js')].join('\n;\n'); /* 화면 그리기는 빼고 처음 화면·슬롯 목록 HTML만 직접 만든다 */
const store=new Map();
function tab(name){ const hk={get:null,set:null,quota:null,rm:null}, toasts=[];
  const ls={ getItem(k){ if(hk.get)hk.get(k); return store.has(k)?store.get(k):null; }, setItem(k,v){ if(hk.quota&&hk.quota(k))throw new Error('quota'); if(hk.set)hk.set(k); store.set(k,String(v)); }, removeItem(k){ if(hk.rm)hk.rm(k); store.delete(k); }, key(i){ return [...store.keys()][i]; }, get length(){ return store.size; }, clear(){ store.clear(); } };
  const own={ localStorage:ls, fflate:undefined, CompressionStream:undefined, LZString:{compressToUTF16:s=>s,decompressFromUTF16:s=>s,compressToBase64:s=>s},
    toast:t=>toasts.push(t), dstr:d=>'D'+d, tname:t=>'T'+t, render:()=>{}, closeSheets:()=>{}, tutTick:()=>{}, fdWelcome:()=>{},
    window:{scrollTo(){},addEventListener(){},self:1,top:1}, document:{addEventListener(){},querySelectorAll:()=>[]}, TEAM_DEF:Array.from({length:10},(_,i)=>({city:'C'+i,nick:'N'+i})), GAME_VER:'t', FEEDBACK_URL:'#', josaFix:()=>{} };
  const scope=new Proxy(own,{ has:(o,k)=>typeof k==='string'&&!(k in globalThis&&!(k in o)), get:(o,k)=>k in o?o[k]:k===Symbol.unscopables?undefined:(()=>'') });
  const env=new Function('env',`with(env){ let G=null; function migrateDraft(){ if(G&&G.broken)throw new Error('재정 없음'); } function newGame(t){ G={ver:4,user:t,day:1,year:2026,teams:[{id:t,city:'C',nick:'N'}],stops:[]}; } ${SRC}\n; return { get G(){return G}, set G(v){G=v}, A, UI, meta, setMeta, saveNow, saveStoreAsync, slotKey, contSlot, curSlot, startScreen, slotsCard, load, save, saveFlush, importText, setDL(v){ DL=v; }, get SAVE_CONFL(){return SAVE_CONFL}, get SLOT_REV(){return SLOT_REV} }; }`)(scope);
  env.hk=hk; env.toasts=toasts; env.name=name; return env; }
const mk=(user,day,extra)=>Object.assign({ver:4,user,day,year:2026,teams:[{id:user,city:'C',nick:'N'}],stops:[],players:{1:{id:1}},cal:{sched:{1:[[0,0]]}},sea:{rec:[{w:0,l:0}]}},extra||{}); /* 가져오기 검사를 통과하는 최소 백업(user 0) */
const body=n=>{ const s=store.get(`danjang-v4-s${n}`); return s?JSON.parse(s):null; };
const fails=[]; const ok=(c,m)=>{ if(!c)fails.push(m); };
const fresh=()=>{ store.clear(); };
/* 탭 t에서 슬롯 slot에 새 게임을 시작하고 day일로 저장 */
const startIn=(t,slot,day)=>{ t.UI.smode='take'; t.UI.newSlot=slot; t.UI.newSlotRev=0; t.UI.newSlotUsed=false; t.A.startGo(0); t.G.day=day; return t.saveNow(); };

/* #1 복사본 판번호: 지우고 다시 복사한 같은 번호 슬롯을 옛 탭이 덮지 않는다 */
{ fresh(); const a=tab('A'); ok(startIn(a,1,3),'#1 준비: 슬롯 1 저장 실패'); a.A.slotCopy(); ok(body(2)&&body(2).day===3,'#1 첫 복사 실패');
  const b=tab('B'); b.A.slotLoad(2); ok(b.G&&b.curSlot()===2,'#1 B가 슬롯 2를 못 엶');
  a.A.slotDel(2); a.A.slotDel(2); ok(!body(2),'#1 삭제 실패'); a.G.day=7; a.A.slotCopy(); ok(body(2)&&body(2).day===7,'#1 다시 복사 실패');
  b.G.day=5; const r=b.saveNow(); ok(r===false&&b.SAVE_CONFL,'#1 옛 탭 저장이 충돌로 막히지 않음'); ok(body(2).day===7,'#1 옛 탭이 새 복사본을 덮어씀'); }
/* #2 삭제 확인 뒤 다른 탭 저장 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); const b=tab('B'); b.A.slotLoad(2);
  a.A.slotDel(2); b.G.day=9; ok(b.saveNow(),'#2 B 저장 실패'); a.A.slotDel(2); ok(body(2)&&body(2).day===9,'#2 확인 뒤 다른 탭이 저장한 진행이 지워짐'); }
/* #3 확인과 쓰기 사이 다른 탭 저장: 둘 다 성공하지 않는다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); const b=tab('B'); ok(b.G&&b.curSlot()===1,'#3 B 부팅 실패');
  a.G.day=4; b.G.day=8; let n=0; a.hk.get=k=>{ if(k==='danjang-meta'&&++n===1){ a.hk.get=null; b.saveNow(); } };
  const ra=a.saveNow(); a.hk.get=null; ok(!ra,'#3 앞서 확인한 A도 성공'); ok(body(1).day===8,'#3 최종 본문이 B가 아님');
  /* 차지한 뒤 본문 쓰기 직전에 B가 끼어드는 순서 */
  const c=tab('C'), d=tab('D'); c.G.day=20; d.G.day=21; c.hk.set=k=>{ if(k==='danjang-v4-s1'){ c.hk.set=null; d.saveNow(); } }; const rc=c.saveNow(), rd=d.saveNow();
  ok(!(rc&&rd),'#3 두 탭이 모두 성공'); ok(body(1).day===(rc?20:21),'#3 성공한 탭과 최종 본문이 다름'); }
/* #4 슬롯을 열 때 예전 목록으로 다른 탭 판번호를 되돌리지 않는다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); const b=tab('B'); b.A.slotLoad(2); a.A.toTitle();
  let n=0; a.hk.get=k=>{ if(k==='danjang-v4-s2'&&++n===1){ a.hk.get=null; b.G.day=30; b.saveNow(); } }; a.A.slotLoad(2); a.hk.get=null;
  ok(a.curSlot()===2,'#4 A가 슬롯 2를 못 엶'); a.G.day=31; ok(a.saveNow()===false,'#4 B의 새 저장 뒤 A 저장이 통과'); ok(body(2).day===30,'#4 B의 새 본문이 덮임'); }
/* #5·#6 충돌 뒤 이어하기는 최신본, 충돌 진행은 빈 슬롯에 복사 가능 */
{ fresh(); const a=tab('A'); startIn(a,1,3); const b=tab('B'); b.G.day=10; b.saveNow(); a.G.day=6; ok(!a.saveNow()&&a.SAVE_CONFL,'#5 충돌 감지 실패');
  a.A.slotCopy(); ok(body(2)&&body(2).day===6,'#6 충돌한 진행을 빈 슬롯에 복사하지 못함'); ok(body(1).day===10,'#6 복사가 원래 슬롯을 덮음');
  a.A.toTitle(); ok(a.UI.title,'#5 처음 화면으로 못 감'); ok(/D10/.test(a.startScreen()),'#5 이어하기 표시가 최신 저장이 아님');
  a.A.tsCont(); ok(a.G.day===6,'#5 확인 없이 미저장 진행을 버림'); a.A.tsCont(); ok(a.G&&a.G.day===10&&!a.SAVE_CONFL,'#5 이어하기가 저장소 최신본을 열지 않음'); }
/* #7 바뀐 것 없는 탭이 처음 화면으로 나가도 판번호를 올리지 않는다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); const b=tab('B'), c=tab('C'); b.G.day=8; c.A.toTitle(); ok(b.saveNow(),'#7 바뀐 것 없는 탭이 나간 뒤 B 저장이 막힘'); ok(body(1).day===8,'#7 B 진행이 저장되지 않음'); }
/* #8 이어하기 표시와 실제 대상 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); const b=tab('B'); b.A.slotLoad(2); b.G.day=8; b.saveNow(); a.A.toTitle();
  ok(/D3/.test(a.startScreen())&&!/D8/.test(a.startScreen()),'#8 다른 탭 슬롯 날짜를 표시'); a.A.tsCont(); ok(a.G.day===3&&a.curSlot()===1,'#8 표시와 다른 게임이 열림'); }
/* #9 새 게임 첫 저장 실패: 기존 이어하기 유지 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.toTitle(); a.A.newgame(); a.hk.quota=k=>k==='danjang-v4-s3'; const r=startIn(a,3,1); a.hk.quota=null;
  ok(!r,'#9 준비: 저장 실패가 아님'); ok(a.meta().active===1,'#9 실패한 새 슬롯이 활성이 됨'); const c=tab('C'); ok(c.G&&c.G.day===3,'#9 재실행 시 기존 세이브가 열리지 않음'); }

/* 검수 11-09zr #1: 판번호를 확인한 뒤 목록에 쓰기 직전 다른 탭이 저장을 끝내도 둘 다 성공하지 않는다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); const b=tab('B'); a.G.day=4; b.G.day=8; let rb=null; a.hk.set=k=>{ if(k==='danjang-meta'){ a.hk.set=null; rb=b.saveNow(); } };
  const ra=a.saveNow(); a.hk.set=null; ok(!(ra&&rb),'zr#1 두 탭이 모두 성공'); ok(body(1).day===(ra?4:8),'zr#1 성공한 탭과 최종 본문이 다름'); ok(!ra&&rb&&body(1).day===8,'zr#1 먼저 끝난 B의 저장이 덮임');
  ok(/D8/.test(a.startScreen())||a.meta().slots[1].y===2026,'zr#1 목록 정보 손상'); const c=tab('C'); c.G.day=9; ok(c.saveNow(),'zr#1 새로 연 탭이 저장하지 못함'); }
/* #2: 삭제 확인을 통과한 뒤 실제 삭제 직전 다른 탭 저장 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); const b=tab('B'); b.A.slotLoad(2); a.A.slotDel(2); b.G.day=9; let rb=null;
  a.hk.set=k=>{ if(k==='danjang-meta'){ a.hk.set=null; rb=b.saveNow(); } }; a.A.slotDel(2); a.hk.set=null; ok(rb,'zr#2 준비: B 저장 실패'); ok(body(2)&&body(2).day===9,'zr#2 삭제 직전 다른 탭이 저장한 진행을 지움');
}
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); const b=tab('B'); b.A.slotLoad(2); a.A.slotDel(2); b.G.day=10; let rb=null;
  a.hk.rm=k=>{ if(k==='danjang-v4-s2'){ a.hk.rm=null; rb=b.saveNow(); } }; a.A.slotDel(2); a.hk.rm=null; ok(!(rb&&!body(2)),'zr#2 지우는 순간 저장한 탭에 성공을 알리고 본문은 지움'); }
/* #3: 기다리던 자동 저장이 끝난 뒤 백업 복원이 실패해도 같은 탭의 다음 저장은 막히지 않는다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.G.day=5; a.save(); a.importText(JSON.stringify(mk(0,40,{broken:1}))); ok(body(1).day===5,'zr#3 기다리던 저장이 끝나지 않음'); ok(a.G.day===5,'zr#3 실패한 복원이 게임을 바꿈');
  a.G.day=6; ok(a.saveNow()&&!a.SAVE_CONFL,'zr#3 자기 저장을 다른 탭 충돌로 오인'); ok(body(1).day===6,'zr#3 다음 저장이 기록되지 않음'); }
/* #4·#7: 충돌 중 백업 가져오기는 슬롯에 못 쓰면 진행 중 게임을 바꾸지 않고, 바로 알린다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); const b=tab('B'); b.G.day=10; b.saveNow(); a.G.day=6; ok(!a.saveNow()&&a.SAVE_CONFL,'zr#4 준비: 충돌 아님'); a.toasts.length=0;
  a.importText(JSON.stringify(mk(0,50))); ok(a.G&&a.G.day===6,'zr#4 슬롯에 못 썼는데 가져온 백업으로 바뀜'); ok(body(1).day===10,'zr#4 다른 탭 저장이 덮임'); ok(/가져오지 않았습니다/.test(a.UI.impMsg||''),'zr#4 실패 안내 없음'); ok(a.toasts.length>0,'zr#7 실패 알림이 설정 화면에만');
  a.A.slotCopy(); ok(body(2)&&body(2).day===6,'zr#4 남은 진행을 빈 슬롯에 복사하지 못함');
  fresh(); const c=tab('C'); startIn(c,1,3); c.G.day=7; c.hk.quota=k=>k==='danjang-v4-s1'; c.toasts.length=0; c.importText(JSON.stringify(mk(0,50))); c.hk.quota=null; ok(c.G.day===7&&body(1).day===3,'zr#7 용량 부족인데 백업이 메모리에만 열림'); ok(c.toasts.length>0,'zr#7 용량 부족 알림 없음'); }
/* #5: 충돌 상태에서 다른 슬롯 새 게임·새 구단은 한 번 묻는다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); const b=tab('B'); b.G.day=10; b.saveNow(); a.G.day=6; a.saveNow(); a.A.toTitle(); a.A.slotNew(3); ok(a.G&&a.G.day===6,'zr#5 확인 없이 진행을 버림'); ok(/한 번 더/.test(a.UI.slotMsg),'zr#5 확인 안내 없음');
  a.A.slotNew(3); ok(!a.G,'zr#5 두 번째 누름에도 시작 안 함'); }
{ fresh(); const a=tab('A'); startIn(a,1,3); const b=tab('B'); b.G.day=10; b.saveNow(); a.G.day=6; a.saveNow(); a.A.newgame(); ok(a.G&&a.G.day===6,'zr#5 새 구단 맡기가 확인 없이 진행을 버림'); a.A.newgame(); ok(!a.G,'zr#5 새 구단 맡기 두 번째 누름'); }
/* #6: 바뀐 것 없는 탭의 이어하기는 다른 탭의 최신 저장·삭제를 확인한다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); const b=tab('B'); a.A.toTitle(); b.G.day=8; b.saveNow(); ok(/D8/.test(a.startScreen()),'zr#6 이어하기 표시가 옛 진행'); a.A.tsCont(); ok(a.G&&a.G.day===8&&!a.UI.title,'zr#6 이어하기가 옛 진행을 엶'); }
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); const b=tab('B'); b.A.slotLoad(2); b.G.day=9; b.saveNow(); a.A.toTitle(); b.A.slotDel(1); b.A.slotDel(1); ok(!body(1),'zr#6 준비: 슬롯 1 삭제 실패');
  ok(/D9/.test(a.startScreen())&&!/D3/.test(a.startScreen()),'zr#6 지운 슬롯을 이어하기로 표시'); a.A.tsCont(); ok(a.G&&a.curSlot()===2&&a.G.day===9,'zr#6 지운 슬롯 대신 남은 슬롯을 열지 않음'); }
/* #9: 본문 쓰기와 목록 되돌리기가 연달아 실패해도 저장소가 돌아오면 다시 저장된다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.G.day=4; let mc=0; a.hk.quota=k=>k==='danjang-v4-s1'||(k==='danjang-meta'&&++mc===2); ok(!a.saveNow(),'zr#9 준비: 저장 실패가 아님'); ok(mc>=2,'zr#9 준비: 되돌리기 실패를 만들지 못함'); a.hk.quota=null;
  a.G.day=5; ok(a.saveNow()&&!a.SAVE_CONFL,'zr#9 저장소가 돌아와도 충돌로 막힘'); ok(body(1).day===5,'zr#9 본문이 기록되지 않음'); }
/* #10: 활성 슬롯 복원 오류면 정상인 다음 슬롯을 연다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); a.G.broken=1; a.G.day=4; a.saveNow(); const c=tab('C'); ok(c.G&&c.curSlot()===2&&c.G.day===3,'zr#10 정상 슬롯으로 넘어가지 않음'); ok(/슬롯 1/.test(c.UI.slotMsg||''),'zr#10 실패한 슬롯 안내 없음'); }
/* #11: 목록에 본문 없는 항목만 있어도 구형 세이브를 찾는다 */
{ fresh(); store.set('danjang-v4',JSON.stringify(mk(0,12))); store.set('danjang-meta',JSON.stringify({active:1,slots:{1:{name:'옛',y:2026,rev:5}}})); const c=tab('C'); ok(c.G&&c.G.day===12,'zr#11 구형 세이브를 이어하기에서 못 찾음'); ok(body(c.curSlot())&&body(c.curSlot()).day===12,'zr#11 구형 세이브를 슬롯으로 옮기지 않음'); }
/* #17: 슬롯을 덮어쓰면 이전 메모를 지우고, 같은 게임 저장은 메모를 남긴다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); let m=a.meta(); m.slots[1].memo='이전 시즌 중요한 세이브'; a.setMeta(m); a.G.day=4; a.saveNow(); ok(a.meta().slots[1].memo==='이전 시즌 중요한 세이브','zr#17 같은 게임 저장에 메모가 사라짐');
  a.importText(JSON.stringify(mk(0,30))); ok(a.G.day===30&&a.meta().slots[1].memo==null,'zr#17 가져온 백업에 이전 메모가 남음');
  m=a.meta(); m.slots[1].memo='옛 메모'; a.setMeta(m); a.A.toTitle(); a.A.slotNew(1); a.UI.smode='take'; a.A.startGo(0); ok(a.curSlot()===1&&a.meta().slots[1].memo==null,'zr#17 새 게임에 이전 메모가 남음'); }
/* #10 자동 저장 실패 즉시 알림 */
(async()=>{
{ fresh(); const a=tab('A'); startIn(a,1,3); a.G.day=4; a.hk.quota=k=>k==='danjang-v4-s1'; await a.saveStoreAsync(); a.hk.quota=null; ok(a.toasts.some(t=>t.includes('자동 저장에 실패')),'#10 자동 저장 실패 알림 없음'); ok(body(1).day===3,'#10 실패했는데 본문이 바뀜'); }

/* 검수 11-09zr #8: 숨김 처리 저장이 실패하면 다음 마감 때 다시 시도한다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.G.day=4; a.save(); a.hk.quota=k=>k==='danjang-v4-s1'; a.saveFlush(); a.hk.quota=null; ok(body(1).day===3,'zr#8 준비: 실패가 아님'); a.saveFlush(); ok(body(1).day===4,'zr#8 실패한 저장을 다시 시도하지 않음'); }
/* #14·#15·#16: 파일 내보내기 백업일은 시작한 슬롯·날짜로, 성공한 뒤에만 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); let go; a.setDL({save:()=>new Promise(r=>{ go=r; })}); const p=a.A.expFile(); a.A.slotLoad(2); go(); await p; ok(a.curSlot()===2&&a.G.bkAt==null&&body(2).bkAt==null,'zr#14 다른 슬롯에 백업일을 기록');
  a.setDL({save:()=>new Promise(r=>{ go=r; })}); const d0=a.G.day; const p2=a.A.expFile(); a.G.day+=6; go(); await p2; ok(a.G.bkAt===d0,'zr#15 완료 시점 날짜로 백업일을 기록');
  a.setDL(null); a.G.bkAt=a.G.day-61; const bk=a.G.bkAt; await a.A.expFile(); ok(a.G.bkAt===bk,'zr#16 내려받기가 막혔는데 백업일 갱신'); ok(/쓸 수 없습니다/.test(a.UI.impMsg||''),'zr#16 준비: 내려받기 실패가 아님'); }
/* #11 다른 탭이 활성으로 만든 슬롯을 지우면 남은 슬롯으로 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); const b=tab('B'); b.A.slotLoad(2); a.A.slotDel(2); a.A.slotDel(2); const c=tab('C'); ok(c.G&&c.curSlot()===1,'#11 지운 슬롯만 바라봄'); }
/* #12 목록 정보가 없어도 본문으로 찾는다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); store.delete('danjang-v4-s1'); store.delete('danjang-meta'); const c=tab('C'); ok(c.G&&c.curSlot()===2,'#12 목록 없는 세이브를 놓침'); }
/* #13 목록 정보만 남은 칸: 사용 중으로 세고 지울 수 있다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.A.slotCopy(); const m=a.meta(); for(let n=3;n<=10;n++)m.slots[n]={name:'옛',y:2026,rev:1}; a.setMeta(m); const h=a.slotsCard(true);
  ok(/10\/10 사용/.test(h),'#13 사용 수가 내부 판정과 다름'); ok((h.match(/data-a="slotDel"/g)||[]).length>=9,'#13 목록만 남은 칸에 삭제 버튼 없음'); a.A.slotDel(5); a.A.slotDel(5); ok(!a.meta().slots[5],'#13 목록만 남은 칸을 지우지 못함'); }
/* #14·#15 손상된 활성 슬롯 이유 표시, 구조 빠진 목록 */
{ fresh(); const a=tab('A'); startIn(a,1,3); store.set('danjang-v4-s1','망가짐'); const c=tab('C'); ok(!c.G,'#14 손상 본문을 엶'); ok(/불러오지 못했습니다/.test(c.startScreen()),'#14 처음 화면에 실패 이유 없음'); }
{ fresh(); const a=tab('A'); startIn(a,1,3); store.set('danjang-meta','{"active":1}'); let c=null; try{ c=tab('C'); }catch(e){ ok(0,'#15 부팅 예외: '+e.message); } ok(c&&c.G&&c.G.day===3,'#15 정상 슬롯 1을 열지 못함'); }
/* #16 부팅 복원 실패 세이브는 이어하기 대상이 아니다 */
{ fresh(); const a=tab('A'); startIn(a,1,3); a.G.broken=1; a.G.day=4; a.saveNow(); const c=tab('C'); ok(!c.G,'#16 복원 실패 세이브를 메모리에 유지'); ok(!/data-a="tsCont"/.test(c.startScreen())&&/복원하다 오류/.test(c.startScreen()),'#16 복원 실패 세이브가 이어하기 대상'); }
console.log(fails.length?'저장 슬롯 점검 실패\n- '+fails.join('\n- '):'저장 슬롯 점검 통과(16개 항목 + 검수 11-09zr #1~#11·#14~#17)'); process.exit(fails.length?1:0); })();
