/* 저장 실패 뒤 다시 저장·IndexedDB 위치 표시 실패(외부 검수 11-17 P1 두 건): 브라우저 없이 Node에서 저장 코드를 직접 실행한다.
 localStorage(Map)와 보조 저장소(IndexedDB 대신 SaveStore.use로 끼운 가짜, Map)를 여러 "탭"이 공유하고, 쓰기 실패는 훅으로 넣는다.
 "새로고침"은 같은 저장소 위에 새 탭을 띄워 부팅(99_boot)을 다시 돌리는 것으로 본다. 사용: node tools/check-save-failure.cjs */
const fs=require('fs'), path=require('path');
const rd=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const SRC=[rd('src/ui/runtime/00_core.js'),'SaveStore.use(__impl);',rd('src/ui/shell/01_layout.js'),'render=function(){};',rd('src/ui/actions/40_actions.js'),rd('src/ui/runtime/99_boot.js')].join('\n;\n');
const store=new Map(), big=new Map();
const H={ lsFail:null, metaFail:null, putFail:false, putHold:null }; /* lsFail(k): 그 키 쓰기 실패, metaFail(v): 그 목록 값 쓰기 실패, putFail: 보조 저장소 쓰기 실패, putHold: 보조 저장소 쓰기를 붙잡아 둔다(배열에 풀기 함수를 넣음) */
const impl={ name:'test',
  get:k=>store.has(k)?store.get(k):null,
  set:(k,v)=>{ if(H.lsFail&&H.lsFail(k))throw new Error('quota'); if(k==='danjang-meta'&&H.metaFail&&H.metaFail(String(v)))throw new Error('quota'); store.set(k,String(v)); },
  remove:k=>{ store.delete(k); }, keys:()=>[...store.keys()], usage:()=>0,
  big:{ ok:()=>true,
    put:(n,d)=>new Promise((res,rej)=>{ const go=()=>{ if(H.putFail)rej(new Error('idb put')); else { big.set(n,d); res(); } }; if(H.putHold)H.putHold.push(go); else Promise.resolve().then(go); }),
    read:n=>Promise.resolve(big.has(n)?big.get(n):undefined), drop:n=>{ big.delete(n); return Promise.resolve(); } } };
function tab(){ const toasts=[];
  const own={ __impl:impl, localStorage:{getItem:impl.get,setItem:impl.set,removeItem:impl.remove,key:i=>[...store.keys()][i],get length(){ return store.size; },clear(){ store.clear(); }}, fflate:undefined, CompressionStream:undefined, LZString:{compressToUTF16:s=>s,decompressFromUTF16:s=>s,compressToBase64:s=>s},
    toast:t=>toasts.push(t), dstr:d=>'D'+d, tname:t=>'T'+t, render:()=>{}, closeSheets:()=>{}, tutTick:()=>{}, fdWelcome:()=>{},
    window:{scrollTo(){},addEventListener(){},self:1,top:1}, document:{addEventListener(){},querySelectorAll:()=>[]}, TEAM_DEF:Array.from({length:10},(_,i)=>({city:'C'+i,nick:'N'+i})), GAME_VER:'t', FEEDBACK_URL:'#', josaFix:()=>{} };
  const scope=new Proxy(own,{ has:(o,k)=>typeof k==='string'&&!(k in globalThis&&!(k in o)), get:(o,k)=>k in o?o[k]:k===Symbol.unscopables?undefined:(()=>'') });
  const env=new Function('env',`with(env){ let G=null; function migrateDraft(){} function newGame(t){ G={ver:4,user:t,day:1,year:2026,teams:[{id:t,city:'C',nick:'N'}],players:{1:{id:1}},cal:{sched:{1:[[0,0]]}},sea:{rec:[{w:0,l:0}]},stops:[]}; } ${SRC}\n; return { get G(){return G}, set G(v){G=v}, A, UI, meta, saveNow, saveStoreAsync, saveFlush, curSlot, sbSettle:typeof sbSettle==='function'?sbSettle:null, get SAVE_ERR(){return SAVE_ERR}, get SAVE_CONFL(){return SAVE_CONFL} }; }`)(scope);
  env.toasts=toasts; return env; }
const tick=(n=4)=>new Promise(r=>{ let k=0; const f=()=>++k>=n?r():setTimeout(f,0); f(); });
const reload=async()=>{ const t=tab(); await tick(); return t; }; /* 부팅이 보조 저장소를 읽고 여는 것까지 기다린다 */
const body=n=>{ const s=store.get(`danjang-v4-s${n}`); return s?JSON.parse(s):null; };
const fails=[]; let pass=0; const ok=(c,m)=>{ if(c)pass++; else fails.push(m); };
const fresh=()=>{ store.clear(); big.clear(); H.lsFail=null; H.metaFail=null; H.putFail=false; H.putHold=null; };
const startIn=(t,slot,day)=>{ t.UI.smode='take'; t.UI.newSlot=slot; t.UI.newSlotRev=0; t.UI.newSlotUsed=false; t.A.startGo(0); t.G.day=day; return t.saveNow(); };
const S1=k=>k==='danjang-v4-s1';
(async()=>{
/* 정상 1: localStorage에 바로 저장 → 새로고침 뒤 이어하기 */
{ fresh(); const a=tab(); ok(startIn(a,1,3),'정상: 첫 저장 실패'); a.G.day=4; ok(a.saveNow()&&!a.SAVE_ERR,'정상: 저장 실패'); ok(body(1).day===4,'정상: 본문이 기록되지 않음');
  const b=await reload(); b.A.tsCont&&0; ok(b.G&&b.G.day===4,'정상: 새로고침 뒤 진행이 다름 '+(b.G&&b.G.day)); }
/* 정상 2: localStorage 본문 쓰기가 막혀 IndexedDB로 → 새로고침 뒤 IndexedDB 본문으로 이어하기 */
{ fresh(); const a=tab(); startIn(a,1,3); a.G.day=4; H.lsFail=S1; ok(a.saveNow(),'정상 IDB: 저장 실패'); await tick(); ok(!a.SAVE_ERR,'정상 IDB: 오류 표시 '+a.SAVE_ERR);
  ok(a.meta().slots[1].idb===true,'정상 IDB: 위치 표시 없음'); const b=await reload(); ok(b.G&&b.G.day===4,'정상 IDB: 새로고침 뒤 진행이 다름 '+(b.G&&b.G.day)); }
/* P1: localStorage·IndexedDB 본문 쓰기가 모두 실패 → 저장소가 돌아온 뒤 같은 상태를 다시 저장하면 실제로 써야 한다 */
{ fresh(); const a=tab(); startIn(a,1,3); a.G.day=4; H.lsFail=S1; H.putFail=true; a.saveNow(); await tick(); ok(!!a.SAVE_ERR,'P1: 둘 다 실패했는데 오류 안내 없음');
  H.lsFail=null; H.putFail=false; const r=a.saveNow(); await tick(); ok(r&&!a.SAVE_ERR,'P1: 저장소가 돌아왔는데 다시 저장 실패 '+a.SAVE_ERR); ok(body(1)&&body(1).day===4,'P1: 다시 저장이 "바뀐 것 없음"으로 건너뜀(저장본 D'+(body(1)&&body(1).day)+')');
  const b=await reload(); ok(b.G&&b.G.day===4,'P1: 새로고침 뒤 진행이 사라짐 '+(b.G&&b.G.day)); }
/* P1 몰아 저장(비동기)도 같게: 실패 뒤 같은 상태의 자동 저장·탭 숨김 저장이 다시 쓴다 */
{ fresh(); const a=tab(); startIn(a,1,3); a.G.day=4; H.lsFail=S1; H.putFail=true; await a.saveStoreAsync(); await tick(); ok(!!a.SAVE_ERR,'P1 자동: 오류 안내 없음');
  H.lsFail=null; H.putFail=false; await a.saveStoreAsync(); await tick(); ok(body(1)&&body(1).day===4,'P1 자동: 다시 저장을 건너뜀'); }
{ fresh(); const a=tab(); startIn(a,1,3); a.G.day=4; H.lsFail=S1; H.putFail=true; a.saveNow(); await tick(); H.lsFail=null; H.putFail=false; a.saveFlush(); ok(body(1)&&body(1).day===4,'P1 탭 숨김: 실패한 저장을 다시 시도하지 않음'); }
/* P1: 확정 전(보조 저장소 쓰는 중) 저장을 성공으로 보고 처음 화면·다른 슬롯으로 넘어가지 않는다. 실패로 끝나면 머문다 */
{ fresh(); const a=tab(); startIn(a,1,3); a.A.slotCopy(); a.G.day=4; H.lsFail=S1; H.putFail=true; H.putHold=[]; a.A.toTitle(); ok(!a.UI.title,'P1 처음 화면: 확정 전 저장을 성공으로 보고 넘어감');
  H.putHold.splice(0).forEach(f=>f()); await tick(); ok(!a.UI.title&&a.G&&a.G.day===4,'P1 처음 화면: 실패한 저장 뒤 넘어감'); ok(a.toasts.some(t=>/확정되지 않아|저장하지 못/.test(t)),'P1 처음 화면: 실패 안내 없음');
  H.putFail=false; a.A.slotLoad(2); ok(a.curSlot()===1,'P1 슬롯 전환: 확정 전에 옮김'); H.putHold.splice(0).forEach(f=>f()); await tick(); ok(a.curSlot()===2,'P1 슬롯 전환: 저장이 확정됐는데 옮기지 않음 '+a.curSlot());
  H.lsFail=null; H.putHold=null; const b=await reload(); ok(b.meta().active===2,'P1 슬롯 전환: 활성 슬롯 기록'); b.A.slotLoad(1); await tick(); ok(b.curSlot()===1&&b.G.day===4,'P1 슬롯 전환: 옮기기 전 진행이 저장되지 않음 '+(b.G&&b.G.day)); }
/* P2: localStorage 본문 실패, IndexedDB 본문 성공, 위치 표시(idb)만 실패 → 성공이라 하지 않거나, 새로고침 뒤 새 본문을 찾아야 한다 */
{ fresh(); const a=tab(); startIn(a,1,3); a.G.day=4; H.lsFail=S1; H.metaFail=v=>/"idb":true/.test(v); const r=a.saveNow(); await tick(); const said=r&&!a.SAVE_ERR;
  H.metaFail=null; const b=await reload(); const got=b.G&&b.G.day;
  ok(!said||got===4,`P2: 성공이라 했는데 새로고침 뒤 옛 진행(D${got})`); ok(!said,'P2: 위치 표시 실패를 성공으로 안내');
  /* 표시가 돌아오면 다시 저장해 새로고침 뒤 이어진다 */ a.saveNow(); await tick(); ok(!a.SAVE_ERR,'P2: 표시가 돌아왔는데 다시 저장 실패 '+a.SAVE_ERR); H.lsFail=null; const c=await reload(); ok(c.G&&c.G.day===4,'P2: 다시 저장 뒤에도 새로고침에서 옛 진행 '+(c.G&&c.G.day)); }
/* P2 + 실패: 표시를 먼저 붙였는데 본문 쓰기가 실패하면 표시를 되돌려 localStorage의 마지막 본문을 연다 */
{ fresh(); const a=tab(); startIn(a,1,3); big.set(1,JSON.stringify(Object.assign({},body(1),{day:1}))); /* 오래전 옮겼다 돌아온 낡은 보조 사본 */ a.G.day=4; H.lsFail=S1; H.putFail=true; a.saveNow(); await tick();
  H.lsFail=null; H.putFail=false; ok(!a.meta().slots[1].idb,'P2 실패: 위치 표시가 남음'); const b=await reload(); ok(b.G&&b.G.day===3,'P2 실패: 마지막 정상 본문 대신 다른 본문을 엶 '+(b.G&&b.G.day)); }
/* 여러 탭: 다른 탭이 더 새로 저장한 슬롯은 덮지 않는다(IndexedDB 경로에서도) */
{ fresh(); const a=tab(); startIn(a,1,3); const b=tab(); b.G.day=8; ok(b.saveNow(),'탭: B 저장 실패'); a.G.day=5; H.lsFail=S1; ok(!a.saveNow()&&a.SAVE_CONFL,'탭: A가 B 저장을 덮음'); await tick(); H.lsFail=null; ok(body(1).day===8,'탭: B 본문이 바뀜'); }
console.log(fails.length?`저장 실패 점검 실패(${fails.length})\n- `+fails.join('\n- '):`저장 실패 점검 통과(${pass}개 확인)`); process.exit(fails.length?1:0); })().catch(e=>{ console.error(e); process.exit(1); });
