'use strict';
function wOf(h,p){ return warPub(h,p); }
const SAVE='danjang-v4';
const UI={open:{},mail:null,mf:'all',talkMsg:null,tab:'home',sheet:null,posSheet:null,game:null,seg:'bat',lseg:'stand',lf:{team:'all',kind:'bat',sort:'war'},trade:{tid:null,give:[],get:[],msg:'',seg:'bat',side:'get',sort:'cur'},leagueTeam:null,confirmNew:false,offer:null,ext:null,fmsg:'',confirmRel:null};
/* ===== 저장소 층(SaveStore): 저장 본문·목록(META)·구형 세이브가 브라우저 저장소에 닿는 곳은 모두 여기를 지난다(docs/design/save-storage-adapter.md) =====
   기본 구현(web)은 예전과 똑같이 localStorage(동기)와 IndexedDB 'danjang-saves'/'slots'(비동기 보조 저장소)를 그대로 쓴다. 키·값·예외도 그대로라, 호출하는 쪽의 try/catch·되읽기 확인이 예전처럼 동작한다.
   - get/set/remove/keys/usage: 동기. set·remove는 저장소 예외(공간 부족 등)를 그대로 던진다. get은 없으면 null.
   - big.ok/put/read/drop: 슬롯 본문 보조 저장소. ok는 동기, 나머지는 Promise.
   나중에 Steam(Electron)·Android(Capacitor) 빌드가 파일 저장으로 바꿀 때는 부팅(99_boot) 전에 SaveStore.use(구현)을 부른다. 지금은 아무 데서도 부르지 않는다 */
const SaveStore=(()=>{
  let DB=null;
  const idb=()=>{ if(DB)return DB; DB=new Promise((res,rej)=>{ try{ const r=indexedDB.open('danjang-saves',1); r.onupgradeneeded=()=>{ try{ r.result.createObjectStore('slots'); }catch(e){} }; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); r.onblocked=()=>rej(new Error('blocked')); }catch(e){ rej(e); } }); DB.catch(()=>{ DB=null; }); return DB; };
  const tx=(mode,fn)=>idb().then(db=>new Promise((res,rej)=>{ let out; const t=db.transaction('slots',mode); const rq=fn(t.objectStore('slots')); if(rq)rq.onsuccess=()=>{ out=rq.result; }; t.oncomplete=()=>res(out); t.onerror=()=>rej(t.error); t.onabort=()=>rej(t.error||new Error('abort')); }));
  const web={ name:'web',
    get:k=>localStorage.getItem(k),
    set:(k,v)=>{ localStorage.setItem(k,v); },
    remove:k=>{ localStorage.removeItem(k); },
    keys:()=>{ const out=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k!=null)out.push(k); } return out; },
    usage:()=>{ let b=0; for(const k of web.keys()){ const v=localStorage.getItem(k); b+=(k.length+(v?v.length:0))*2; } return b; }, /* 대략의 바이트(UTF-16) */
    big:{ ok:()=>{ try{ return typeof indexedDB==='object'&&!!indexedDB&&typeof indexedDB.open==='function'; }catch(e){ return false; } },
      put:(n,d)=>tx('readwrite',st=>st.put(d,n)), read:n=>tx('readonly',st=>st.get(n)), drop:n=>tx('readwrite',st=>st.delete(n)), keys:()=>tx('readonly',st=>st.getAllKeys()) } };
  let impl=web;
  const NEED=['get','set','remove','keys','usage'], NEED_BIG=['ok','put','read','drop'];
  return { get:k=>impl.get(k), set:(k,v)=>impl.set(k,v), remove:k=>impl.remove(k), keys:()=>impl.keys(), usage:()=>impl.usage(),
    big:{ ok:()=>impl.big.ok(), put:(n,d)=>impl.big.put(n,d), read:n=>impl.big.read(n), drop:n=>impl.big.drop(n), keys:()=>typeof impl.big.keys==='function'?impl.big.keys():Promise.resolve(SLOT_IDS) },
    web, current:()=>impl.name||'',
    /* 다른 저장 구현으로 바꾼다(앞 구현을 돌려준다). 부팅 전에 한 번만 부르는 용도: 이미 읽은 메모리 사본(SB)은 옮기지 않는다 */
    use(next){ if(!next||NEED.some(f=>typeof next[f]!=='function')||!next.big||NEED_BIG.some(f=>typeof next.big[f]!=='function'))throw new Error('SaveStore.use: get/set/remove/keys/usage와 big.ok/put/read/drop이 모두 있어야 합니다'); const prev=impl; impl=next; return prev; } };
})();
/* 저장: 슬롯 10개, lz-string 압축. 브라우저 저장 공간(보통 5MB 안팎)을 넘으면 저장 오류를 띄우고 파일 내보내기를 권한다 */
const SLOTS=10, META='danjang-meta'; const SLOT_IDS=Array.from({length:SLOTS},(_,i)=>i+1);
function meta(){ try{ const m=JSON.parse(SaveStore.get(META)||'null'); if(m&&typeof m==='object'&&!Array.isArray(m)){ if(!m.slots||typeof m.slots!=='object'||Array.isArray(m.slots))m.slots={}; if(!SLOT_IDS.includes(m.active))m.active=1; return m; } }catch(e){} return {active:1,slots:{}}; } /* 구조가 빠진 목록({"active":1} 등)도 고쳐 읽는다(검수 11-09 #15: 부팅 멈춤) */
/* 본문을 꽉 채워도 비동기 저장의 임시 목록을 적을 여유는 남긴다. 실제 세이브가 아닌 예비 공간이다. */
const SAVE_RESERVE=SAVE+'-reserve';
function saveReserve(){try{if(SaveStore.get(SAVE_RESERVE)==null)SaveStore.set(SAVE_RESERVE,' '.repeat(2048));}catch(e){}}
function setMeta(m){const s=JSON.stringify(m);try{SaveStore.set(META,s);return SaveStore.get(META)===s;}catch(e){try{if(SaveStore.get(SAVE_RESERVE)==null)return false;SaveStore.remove(SAVE_RESERVE);SaveStore.set(META,s);return SaveStore.get(META)===s;}catch(x){return false;}}} /* 목록 갱신은 예비 공간을 먼저 비워 한 번 더 시도한다. */
const slotKey=n=>`${SAVE}-s${n}`;
/* ===== 슬롯 본문 보조 저장소: IndexedDB(사용자 11-12, 커뮤니티 "빈 슬롯인데 저장 공간 부족") =====
   브라우저 localStorage는 모든 슬롯을 합쳐 5~10MB 안팎이라, 오래 한 세이브 여러 개를 두면 저장이 막혔다.
   - 평소에는 지금처럼 localStorage에 쓴다(동기·즉시 확정). 저장 목록(META)·판번호(rev)·다른 탭 충돌 검사는 그대로 localStorage에 둔다.
   - localStorage가 가득 차서 본문을 못 쓰면 그 본문을 IndexedDB(용량이 훨씬 큼)에 쓰고, 목록 항목에 idb 표시를 남긴다.
     이어서 지금 진행 중이 아닌 다른 슬롯 본문도 IndexedDB로 옮겨 localStorage 공간을 비운다(복사를 확인한 뒤에만 지운다).
   - 이 탭에서 쓴 본문은 메모리(SB)에 두고 읽는다. 부팅 때 idb 표시 슬롯이 있으면 IndexedDB에서 먼저 읽어 온 뒤 이어하기를 연다.
   - localStorage 쓰기가 다시 성공하면 그 슬롯은 localStorage로 돌아오고 IndexedDB 사본과 표시를 지운다. */
const SB=new Map(), SB_REV=new Map(), SB_SEQ={}, SB_PEND=new Set(), SB_CTX=new Map(); /* 본문 사본은 읽은 판번호와 함께 보관한다. */
/* 다른 사이트(itch 껍데기 등) 안에 끼워 열린 화면인가(카페 11-13 쌉싸코: 휴대폰에서 저장해도 다시 켜면 이어하기가 없음).
   아이폰·아이패드(모든 브라우저가 WebKit)는 다른 사이트 안에서 쓴 저장을 그 사이트별로 따로 두고, 첫 화면으로 직접 방문한 기록이 없으면 7일 안에 지운다.
   그래서 끼워 연 화면에서는 저장이 사라질 수 있다고 알리고, 이 주소를 새 창으로 바로 열게 한다 */
function saveEmbedded(){ try{ return window.top!==window.self; }catch(e){ return true; } }
function isIOSLike(){ try{ const u=navigator.userAgent||''; return /iP(hone|ad|od)/.test(u)||(/Macintosh/.test(u)&&(navigator.maxTouchPoints||0)>1); }catch(e){ return false; } }
function saveEmbedBanner(){ if(!saveEmbedded())return ''; let url=''; try{ url=location.href.split('#')[0]; }catch(e){} return `<div class="note warn" role="alert" style="margin:0 0 12px">다른 사이트 안에서 열린 화면입니다. ${isIOSLike()?'아이폰·아이패드에서는':'일부 휴대폰 브라우저에서는'} 이 상태의 저장이 브라우저 정책으로 사라질 수 있습니다. 아래 버튼으로 게임 주소를 직접 열어 플레이하고, 중요한 진행은 설정의 '파일로 내보내기'로 백업하세요.<div class="row" style="margin-top:8px"><a class="btn small primary" href="${esc(url)}" target="_blank" rel="noopener">새 창에서 열기(저장 안전)</a></div></div>`; }
/* 앱 안 브라우저(카카오톡·네이버·인스타그램 등) 안내(GA 개선안 P1-2, 11-17): 저장이 그 앱의 브라우저에만 남고 앱이 정리하면 사라질 수 있어 Chrome·Safari로 열기를 권한다. 닫을 수 있고 플레이는 막지 않는다 */
const INAPP=[['kakaotalk',/KAKAOTALK/i],['naver',/NAVER\(inapp/i],['instagram',/Instagram/i],['facebook',/FBAN|FBAV|FB_IAB/],['line',/\bLine\//],['everytime',/everytime/i],['band',/\bBAND\//],['daum',/DaumApps/i]];
function inappKind(u){ try{ u=u==null?navigator.userAgent||'':u; for(const [k,r] of INAPP)if(r.test(u))return k; if(/Android/.test(u)&&/; wv\)/.test(u))return 'webview'; }catch(e){} return ''; }
function inappOs(){ try{ const u=navigator.userAgent||''; return isIOSLike()?'ios':/Android/.test(u)?'android':'other'; }catch(e){ return 'other'; } }
function inappIntent(){ try{ return `intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end`; }catch(e){ return ''; } }
function inappOff(){ try{ return sessionStorage.getItem('fo_inapp_x')==='1'; }catch(e){ return false; } }
function inappBanner(){ const k=inappKind(); if(!k||UI.inappX||inappOff())return ''; let web=false; try{ web=/^https?:$/.test(location.protocol); }catch(e){} if(!web)return ''; const os=inappOs();
  if(!UI.inappShown){ UI.inappShown=1; setTimeout(()=>{ try{ teleEv('inapp_notice_shown',{app:k,os}); }catch(e){} },0); }
  const how=os==='android'?`<a class="btn small primary" href="${esc(inappIntent())}" data-a="inappGo" data-v="chrome">Chrome으로 열기</a>`
    :`${os==='ios'?`<p class="small" style="margin:6px 0 0;flex-basis:100%">화면의 ··· 또는 공유 메뉴에서 'Safari로 열기'(기본 브라우저로 열기)를 눌러 주세요.</p>`:''}<button class="btn small${os==='ios'?'':' primary'}" data-a="inappGo" data-v="copy">주소 복사</button>`;
  return `<div class="note warn inapp" role="note" style="margin:0 0 12px">앱 안의 브라우저로 열었습니다. 이 상태의 저장은 이 앱 브라우저에만 남고, 앱이 정리하면 사라질 수 있습니다. Chrome이나 Safari에서 열어 플레이하시길 권합니다.<div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap;align-items:center">${how}<button class="btn small" data-a="inappGo" data-v="close">닫기</button></div></div>`; }
function inappCopy0(t){ try{ const x=document.createElement('textarea'); x.value=t; x.setAttribute('readonly',''); x.style.cssText='position:fixed;left:-9999px'; document.body.appendChild(x); x.select(); const ok=document.execCommand('copy'); x.remove(); return !!ok; }catch(e){ return false; } }
function inappCopy(t){ try{ if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t).then(()=>true,()=>inappCopy0(t)); }catch(e){} return Promise.resolve(inappCopy0(t)); }
/* 저장이 지워지지 않게 브라우저에 영구 보관을 요청한다(지원하는 브라우저만, 결과는 기록만) */
let SAVE_PERSIST=null; function savePersistAsk(){ try{ if(navigator.storage&&navigator.storage.persist&&!saveEmbedded())navigator.storage.persist().then(v=>{ SAVE_PERSIST=!!v; }).catch(()=>{}); }catch(e){} }
function sbOk(){ try{ return !!SaveStore.big.ok(); }catch(e){ return false; } }
const sbPut=(n,d)=>SaveStore.big.put(n,d), sbDrop=n=>SaveStore.big.drop(n);
const sbBodyKey=(n,it)=>it&&it.idbKey!=null?it.idbKey:n;
const sbRead=n=>SaveStore.big.read(sbBodyKey(n,meta().slots[n]));
const sbFlag=(m,n)=>!!(m&&m.slots&&m.slots[n]&&m.slots[n].idb);
const sbTag=it=>it?.writeKey||it?.idbKey||'';
const sbStamp=it=>JSON.stringify([it?.rev||0,sbTag(it)]);
const sbOwn=(c,m=meta())=>revOf(m,c.n)===c.rev&&sbTag(m.slots[c.n])===c.key;
function sbLsGet(n){ try{ return SaveStore.get(slotKey(n)); }catch(e){ return null; } }
/* 본문 읽기: 이 탭이 IndexedDB에서 읽었거나 쓴 본문(SB)이 먼저, 없으면 localStorage */
function sbForget(n){SB.delete(n);SB_REV.delete(n);}
function sbBaseGet(n,it){if(it&&it.idb)return SB_REV.get(n)===sbStamp(it)?SB.get(n)??null:null;return sbLsGet(n);}
function sbGet(n){const m=meta(),it=m.slots[n],ctx=SB_CTX.get(n);if(SB_PEND.has(n)&&ctx&&sbOwn(ctx,m))return SB.get(n)??null;if(it&&(it.pending||it.deleting))return null;if(it&&it.idb){if(SB_REV.get(n)!==sbStamp(it)){sbForget(n);return null;}return SB.get(n)??null;}const ls=sbLsGet(n);if(SB.has(n))sbForget(n);return ls;}
/* 다른 탭이 목록을 바꾸면 표시가 없는 슬롯의 메모리 사본을 버린다 */
try{ window.addEventListener('storage',e=>{ try{ if(e.key!==META&&!(e.key||'').startsWith(SAVE+'-s'))return; const m=meta(); for(const n of [...SB.keys()])if(!SB_PEND.has(n)&&(!sbFlag(m,n)||SB_REV.get(n)!==sbStamp(m.slots[n])))sbForget(n); }catch(x){} }); }catch(e){}
/* 목록의 idb 표시를 고친다(판번호가 그대로일 때만) */
function sbMark(n,on,rev){ try{ const m=meta(); const it=m.slots[n]; if(!it||(rev!=null&&it.rev!==rev))return false; if(!!it.idb===!!on)return true; if(on)it.idb=true; else delete it.idb; return setMeta(m); }catch(e){ return false; } }
/* 본문 쓰기: localStorage 우선, 공간이 없으면 IndexedDB. true면 이 탭에서는 바로 읽을 수 있다.
   IndexedDB로 쓰는 중(SB_PEND)에는 아직 확정이 아니다: sbSettle(n)이 확정(true)·실패(false)를 알려 준다(외부 검수 11-17 P1: 확정 전에 저장됨으로 기억해 다시 저장을 건너뜀).
   위치 표시(idb)는 본문보다 먼저 붙인다: 표시를 못 붙이면 새로고침 뒤 새 본문을 찾을 수 없으니 저장 실패로 돌려준다(외부 검수 11-17 P2: 표시만 실패해도 성공 안내).
   표시를 먼저 붙였다가 본문 쓰기가 실패하면 표시를 되돌려 localStorage에 남은 마지막 본문을 그대로 연다 */
const SB_WAIT=new Map();
async function sbSettle(n){ for(;;){ const w=SB_WAIT.get(n); if(!w)return true; const r=await w; if(r!==null||SB_WAIT.get(n)===w)return r===true; } } /* 마지막 쓰기의 결과. 더 새 쓰기에 밀린 쓰기(null)는 그 새 쓰기의 결과를 기다린다(localStorage로 확정되면 표가 지워져 true) */
/* 비동기 본문은 판마다 새 키에 쓴다. 늦은 옛 탭의 쓰기는 새 본문을 덮을 수 없다.
   본문·확정 기록을 확인한 뒤에만 목록과 활성 슬롯을 공개한다. */
let _sbNonce=0;
const sbToken=rev=>{try{if(typeof crypto!=='undefined'&&crypto.randomUUID)return crypto.randomUUID();}catch(e){}let clock='';try{clock=performance.timeOrigin+':'+performance.now();}catch(e){}return rev+':'+clock+':'+(++_sbNonce);};
const sbPrefix=n=>'slot:'+n+':';
function sbUndo(c,failed){const m=meta();if(!sbOwn(c,m))return false;
  try{if(c.lsTouched&&sbLsGet(c.n)===c.data){if(c.ls0!=null)SaveStore.set(slotKey(c.n),c.ls0);else SaveStore.remove(slotKey(c.n));}}catch(e){}
  if(c.old)m.slots[c.n]=Object.assign({},c.old,failed&&c.own?{fail:c.info.day}:{});else delete m.slots[c.n];
  if(c.activate&&m.active===c.n)m.active=c.active;const ok=setMeta(m)||setMeta(m);
  if(ok){if(c.old?.idb&&c.body0!=null){SB.set(c.n,c.body0);SB_REV.set(c.n,sbStamp(c.old));}else sbForget(c.n);if(c.own){SLOT_REV=c.old?.rev||0;SLOT_TAG=sbTag(c.old);}}return ok;}
function sbFinish(c,idb){const m=meta();if(!sbOwn(c,m))return false;const info={...c.info};delete info.pending;delete info.fail;
  if(idb){info.idb=true;info.idbKey=c.key;info.idbCommit=c.commit;}else{delete info.idb;delete info.idbKey;delete info.idbCommit;}
  m.slots[c.n]=info;if(c.activate)m.active=c.n;return setMeta(m);}
async function sbClean(n){if(!sbOk())return;try{const keys=await SaveStore.big.keys();for(const k of keys){if(k!==n&&!String(k).startsWith(sbPrefix(n)))continue;const it=meta().slots[n];if(!it)continue;const refs=[it.idbKey,it.idbCommit,it.pending?.key,it.pending?.commit,it.pending?.old?.idbKey,it.pending?.old?.idbCommit];if(it.idb&&!it.idbKey||it.pending?.old?.idb&&!it.pending.old.idbKey)refs.push(n);if(!refs.includes(k))await sbDrop(k);}}catch(e){}}
function sbSet(n,data,c){let ls=false;if(!c.options.forceIDB)try{c.lsTouched=true;SaveStore.set(slotKey(n),data);ls=sbLsGet(n)===data;}catch(e){}
  if(ls){if(!sbFinish(c,false)){sbUndo(c,true);return false;}sbForget(n);SB_WAIT.delete(n);SB_CTX.delete(n);saveReserve();sbClean(n);return true;}
  if(!sbOk()){sbUndo(c,true);return false;}
  const m=meta();if(!sbOwn(c,m))return false;m.slots[n].idb=true;
  if(!setMeta(m)&&!setMeta(m)){SAVE_ERR_SB='저장 목록에 보조 저장소(IndexedDB) 위치를 기록하지 못했습니다.';sbUndo(c,true);return false;}
  SB.set(n,data);SB_REV.set(n,sbStamp(c.info));SB_PEND.add(n);let done;SB_WAIT.set(n,new Promise(r=>{done=r;}));
  (async()=>{let ok=false;try{await sbPut(c.key,data);if(await SaveStore.big.read(c.key)!==data)throw Error('verify');if(!sbOwn(c))throw Error('changed');
      const finalInfo={...c.info,idb:true,idbKey:c.key,idbCommit:c.commit};
      await sbPut(c.commit,JSON.stringify({saveCommit:1,n,rev:c.rev,key:c.key,info:finalInfo}));
      const mark=JSON.parse(await SaveStore.big.read(c.commit));if(mark.rev!==c.rev||mark.key!==c.key)throw Error('commit');
      if(!sbFinish(c,true))throw Error('changed');try{SaveStore.remove(slotKey(n));}catch(e){}ok=true;
    }catch(e){sbUndo(c,true);try{await sbDrop(c.commit);}catch(x){}svDrop(n);SAVE_ERR='보조 저장소(IndexedDB)에 저장을 확정하지 못했습니다. 마지막으로 저장된 진행을 보존했습니다. 파일로 내보내기로 백업하세요.';try{toast(SAVE_ERR);}catch(x){}}
    finally{if(SB_CTX.get(n)===c){SB_PEND.delete(n);SB_CTX.delete(n);if(!ok&&SB_REV.get(n)===sbStamp(c.info))sbForget(n);}done(ok);if(ok){saveReserve();sbClean(n);if(!c.options.forceIDB)sbOffload(n);}}
  })();return true;}
let SAVE_ERR_SB='';
/* 진행 중이 아닌 슬롯도 동일한 확정 절차로 옮긴다. */
let _sbOff=false;async function sbOffload(keep){if(_sbOff||!sbOk())return;_sbOff=true;try{for(const n of SLOT_IDS){if(n===keep||n===CUR_SLOT)continue;const m=meta(),it=m.slots[n],b=sbLsGet(n);if(!it||it.lock||it.pending||b==null)continue;await writeSlotConfirmed(n,b,it,it.rev||0,{forceIDB:true,body:b});}}catch(e){}finally{_sbOff=false;}}
/* 현재 본문을 마지막에 지운다. 어느 삭제든 실패하면 본문·목록은 남기고 실패를 돌려준다. */
async function sbRemove(n,exp=revOf(meta(),n)){if(SB_PEND.has(n)&&!await sbSettle(n))return false;const m=meta(),it=m.slots[n],ls=sbLsGet(n);if(revOf(m,n)!==exp||it?.pending)return false;let savedBody=null,savedMark=null;
  try{if(it?.idb){savedBody=await SaveStore.big.read(sbBodyKey(n,it));if(typeof savedBody!=='string')return false;if(it.idbCommit)savedMark=await SaveStore.big.read(it.idbCommit);}}catch(e){return false;}
  try{const keys=sbOk()?await SaveStore.big.keys():[];if(revOf(meta(),n)!==exp)return false;SaveStore.remove(slotKey(n));if(sbLsGet(n)!=null)throw Error('remove');
    const current=it?.idb?sbBodyKey(n,it):null,owned=[...new Set([...keys.filter(k=>k===n||String(k).startsWith(sbPrefix(n))),...(current!=null?[current]:[]),...(it?.idbCommit?[it.idbCommit]:[])])];
    owned.sort((a,b)=>(a===current?1:0)-(b===current?1:0));for(const k of owned){if(revOf(meta(),n)!==exp)throw Error('changed');await sbDrop(k);}
    if(revOf(meta(),n)!==exp)return false;sbForget(n);SB_SEQ[n]=(SB_SEQ[n]||0)+1;return true;
  }catch(e){if(revOf(meta(),n)===exp){if(ls!=null)try{SaveStore.set(slotKey(n),ls);}catch(x){}if(savedBody!=null)try{await sbPut(sbBodyKey(n,it),savedBody);if(savedMark!=null)await sbPut(it.idbCommit,savedMark);}catch(x){}}return false;}}
async function sbCommitted(n){if(SB_PEND.has(n)&&!await sbSettle(n))return null;const m=meta(),it=m.slots[n],rev=revOf(m,n),stamp=sbStamp(it);if(it?.pending||it?.deleting)return null;try{const body=it?.idb?await SaveStore.big.read(sbBodyKey(n,it)):sbLsGet(n);if(it?.idbCommit){const z=JSON.parse(await SaveStore.big.read(it.idbCommit));if(z.saveCommit!==1||z.rev!==rev||z.key!==it.idbKey){sbForget(n);return null;}}const now=meta();if(sbStamp(now.slots[n])!==stamp||now.slots[n]?.pending||now.slots[n]?.deleting||typeof body!=='string')return null;if(it?.idb){SB.set(n,body);SB_REV.set(n,stamp);}return {body,rev,info:it?{...it}:null};}catch(e){sbForget(n);return null;}}
/* 旧一覧のない数値キーと、確定印のある版だけを発見する。 */
async function sbOrphan(n,keys){const found=[];for(const k of keys)if(String(k).startsWith(sbPrefix(n))&&String(k).endsWith(':commit'))try{const z=JSON.parse(await SaveStore.big.read(k));if(z.saveCommit!==1||z.n!==n||!z.info||z.info.pending||z.info.idbKey!==z.key||z.info.rev!==z.rev)continue;const body=await SaveStore.big.read(z.key);if(unpack(body))found.push({body,info:{...z.info,idb:true,idbCommit:k}});}catch(e){}
  found.sort((a,b)=>(b.info.rev||0)-(a.info.rev||0));if(found.length)return found[0];const body=await SaveStore.big.read(n),g=unpack(body);return g?{body,info:{...slotInfoOf(g),rev:revNext(0),idb:true}}:null;}
async function sbRefresh(ns){if(!sbOk())return !(ns||SLOT_IDS).some(n=>sbFlag(meta(),n));let all=true,keys=[];try{keys=await SaveStore.big.keys();}catch(e){}
  for(const n of ns||SLOT_IDS){if(SB_PEND.has(n)){if(!await sbSettle(n))all=false;continue;}let m=meta(),it=m.slots[n],rev=revOf(m,n);try{if(it?.deleting){all=false;continue;}
    if(it?.pending){const p=it.pending,old=p.old,body=old?.idb?await SaveStore.big.read(sbBodyKey(n,old)):sbLsGet(n);m=meta();if(sbStamp(m.slots[n])!==sbStamp(it)){all=false;continue;}
      if(old&&unpack(body)){m.slots[n]={...old,fail:it.day};if(!setMeta(m)){all=false;continue;}it=m.slots[n];rev=it.rev||0;if(it.idb){SB.set(n,body);SB_REV.set(n,sbStamp(it));}}
      else{delete m.slots[n];setMeta(m);sbForget(n);all=false;continue;}}
    if(!it){const o=await sbOrphan(n,keys);if(!o)continue;m=meta();if(m.slots[n]){all=false;continue;}m.slots[n]=o.info;if(!setMeta(m)){all=false;continue;}SB.set(n,o.body);SB_REV.set(n,sbStamp(o.info));continue;}
    if(!it.idb){sbForget(n);continue;}if(!await sbCommitted(n)){sbForget(n);all=false;continue;}
  }catch(e){sbForget(n);all=false;}}return all;}
function sbNeedBoot(){return sbOk();}
function backupMark(g,day){if(g&&Number.isFinite(day))g.bkAt=Math.max(Number.isFinite(g.bkAt)?g.bkAt:-Infinity,day);}
/* 이 탭이 연 슬롯: 저장은 늘 여기로. 다른 탭이 활성 슬롯 기록을 바꿔도 이 탭의 저장 대상은 바뀌지 않는다(검수 11-06) */
let CUR_SLOT=null; function curSlot(){ return CUR_SLOT??(meta().active||1); }
/* 슬롯 판번호(rev): 이 탭이 열거나 저장할 때 기억한 판번호와 지금 목록의 판번호가 다르면 다른 탭이 그사이 저장한 것. 늦게 쓴 탭이 앞선 진행을 덮지 않게 이 탭의 저장을 막는다(검수 11-07) */
let SLOT_REV=0, SLOT_TAG='', SAVE_CONFL=false, SLOT_NEW=false; function slotRevSync(n,m){ m=m||meta(); SLOT_REV=revOf(m,n);SLOT_TAG=sbTag(m.slots[n]);SAVE_CONFL=false;SLOT_NEW=false; } /* SLOT_NEW: 이 슬롯에 다른 게임(새 게임·가져온 백업)을 처음 쓰는 중 */
function revOf(m,n){ return (m.slots[n]&&m.slots[n].rev)||0; }
/* 새 판번호: 무작위 소수를 붙여, 슬롯을 지우고 같은 번호로 다시 만들어도 옛 탭의 판번호와 겹치지 않는다(검수 11-09 #1: 복사본 판번호가 늘 0이라 옛 탭이 새 복사본을 덮음) */
function revNext(r0){ return Math.max(Math.floor(r0)+1,Date.now())+Math.random(); }
function slotHas(n){ return sbGet(n)!=null; }
/* 이번 실행에서 열지 못한 슬롯(본문 손상·복원 실패): 이어하기 대상에서 뺀다(검수 11-09 #16) */
const SLOT_BAD={}, SLOT_BAD_AT={};
function slotBad(n,why){ SLOT_BAD[n]=why; try{ SLOT_BAD_AT[n]={body:sbGet(n),rev:revOf(meta(),n)}; }catch(e){ SLOT_BAD_AT[n]=null; } }
function slotBadCurrent(n,m){ if(!SLOT_BAD[n])return false; const old=SLOT_BAD_AT[n]; try{ if(old&&(old.rev!==revOf(m,n)||old.body!==sbGet(n))){ delete SLOT_BAD[n]; delete SLOT_BAD_AT[n]; return false; } }catch(e){} return true; }
/* 이어하기 대상: 활성 슬롯에 본문이 있으면 그것, 없으면(지워짐·첫 저장 실패·목록 유실) 본문이 남은 다른 슬롯(검수 11-09 #9·#11·#12) */
function contSlot(m){ m=m||meta(); return [m.active,...SLOT_IDS].find(n=>SLOT_IDS.includes(n)&&!slotBadCurrent(n,m)&&slotHas(n))??null; }
function setActive(n){ const m=meta(); m.active=n; return setMeta(m); } /* 목록을 새로 읽어 활성 번호만 바꾼다(검수 11-09 #4: 예전에 읽은 목록 전체를 다시 써 다른 탭 판번호를 되돌림) */
function slotInfoOf(g){ const t=(g.teams||[]).find(x=>x.id===g.user); return {tid:g.user,name:t?`${tfull(t)}`:'',date:Number.isFinite(g.day)?dstr(g.day):'',day:g.day,y:g.year,at:Date.now(),...(g.wid?{wid:g.wid}:{})}; }
/* 다른 탭과 겹쳐 저장하지 못한 진행을 버리기 전 한 번 묻는다(불러오기와 같은 방식). 같은 것을 다시 누르면 true(검수 11-09zr #5: 새 게임 준비만 열어도 진행이 사라짐) */
function confDrop(k){ if(!G||!SAVE_CONFL||UI.confDrop===k){ UI.confDrop=null; return true; } UI.confDrop=k; UI.slotMsg=`이 탭의 진행(${dstr(G.day)})은 다른 탭과 겹쳐 저장되지 않았습니다. 새 게임을 시작하면 이 진행은 사라집니다. 남기려면 먼저 "빈 슬롯에 따로 저장"을 누르세요. 그래도 시작하려면 한 번 더 누르세요.`; try{ toast(UI.slotMsg); }catch(e){} try{ render(); }catch(e){} return false; }
/* 화면을 옮기기 전 저장: 다른 탭과 겹쳐 저장을 막은 상태면 이미 안내했으니 그대로 옮긴다 */
function saveOK(){ return saveNow()||SAVE_CONFL; }
function slotUsed(n,m){ m=m||meta(); try{ return !!m.slots[n]||sbGet(n)!=null; }catch(e){ return !!m.slots[n]; } } /* 목록에 빠졌어도 본문이 있으면 빈 슬롯이 아니다 */
/* 저장 형식: '\u0001' + 원래 바이트 길이(15비트 두 글자) + deflate(raw) 바이트를 15비트씩 글자로 담는다(0xD800 아래 글자만 써서 브라우저 저장소에서 깨지지 않게).
   예전 LZ 저장('\u0001'로 시작하지 않음)과 아주 옛날 JSON 저장('{')도 그대로 읽는다. LZ는 시즌이 쌓이면 한 번에 0.8초 넘게 걸려 화면이 굳었다 */
const ZMK='\u0001';
function z15(u){ const n=u.length, out=new Uint16Array(Math.ceil(n*8/15)+3); out[0]=((n>>>15)&0x7fff)+32; out[1]=(n&0x7fff)+32; let acc=0,bits=0,o=2;
  for(let i=0;i<n;i++){ acc=(acc<<8)|u[i]; bits+=8; if(bits>=15){ bits-=15; out[o++]=((acc>>>bits)&0x7fff)+32; acc&=(1<<bits)-1; } } if(bits)out[o++]=((acc<<(15-bits))&0x7fff)+32;
  let s=ZMK; for(let i=0;i<o;i+=8192)s+=String.fromCharCode.apply(null,out.subarray(i,Math.min(o,i+8192))); return s; }
function unz15(s){ const n=((s.charCodeAt(1)-32)<<15)|(s.charCodeAt(2)-32), u=new Uint8Array(n); let acc=0,bits=0,k=0;
  for(let i=3;i<s.length&&k<n;i++){ acc=(acc<<15)|(s.charCodeAt(i)-32); bits+=15; while(bits>=8&&k<n){ bits-=8; u[k++]=(acc>>>bits)&255; } acc&=(1<<bits)-1; } return u; }
let ZERR=''; const ZOK=typeof fflate!=='undefined'&&typeof TextEncoder!=='undefined';
/* 저장본에서만 무적 선수의 최근 경기·기용 기록을 뺀다(지금 플레이 중인 데이터는 그대로: 검수 11-06) */
/* 결과를 숨긴 채 보던 중계 상태(로컬 저장·내보내기 공용): 장면·투구·재생/일시정지·배속·모드·경기 전 화면·동석 연결, 경기 전 선수 상태(가벼운 항목)까지(검수 11-09zzc #3~#8·#10) */
function castHoldSync(){ const c=UI.cast||UI.castRet, g=G&&c&&c.hold&&G.games[c.g]; if(!g)return; if(c.fin||(c.k||0)>=(g.pbp||[]).length){ delete G.castHold; return; }
  const H0=G.castHold, S=typeof SPOIL_SNAP!=='undefined'&&SPOIL_SNAP, ids=['h','a'].flatMap(sd=>['bat','pit'].flatMap(k=>((g.box&&g.box[sd]&&g.box[sd][k])||[]).map(x=>x.id)));
  const ps=S&&S.day===g.day&&S.y===dobj(g.day).y?Object.fromEntries(ids.filter(id=>S.P[id]).map(id=>[id,Object.fromEntries(SPOIL_K.filter(spoilLite).map(k=>[k,S.P[id][k]]))])):H0&&H0.gid===g.gid&&H0.ps||null;
  G.castHold={g:c.g,gid:g.gid,k:c.k||0,play:UI.cast===c?!!c.play:!!c.wasPlay,pre:c.pre?1:0,spd:c.spd||1,mode:c.mode==='all'?'all':'hl',...(c.pitch&&c.pitch.k===c.k&&c.pitch.shown>0?{pi:c.pitch.shown}:{}),...(UI.cwAfter?{cw:UI.cwAfter}:{}),...(ps?{ps}:{})}; }
/* 저장 전 화면 상태가 이 세이브(G) 것인지 먼저 맞춘다(검수 11-09zzc #1: 가져온 백업에 이전 게임의 중계 위치가 저장됨) */
let _saveGStage=false; /* 가져오기 저장 확인 전에는 현재 화면 상태를 건드리거나 새 게임에 섞지 않는다 */
function prepG(){ if(_saveGStage)return JSON.stringify(G); try{ if(typeof uiSaveSync==='function')uiSaveSync(); }catch(e){} castHoldSync(); if(G){ const w=UI.wkres; if(w)G.wkHold={from:w.from,to:w.to,rk0:w.rk0}; else delete G.wkHold; } return JSON.stringify(G); } /* 무적 선수의 기용 기록(use·l10)도 지우지 않는다: 시상·기록에 쓰인다(검수 11-06) */
function packJ(j){ if(ZOK){ try{ return z15(fflate.deflateSync(new TextEncoder().encode(j),{level:6})); }catch(e){ ZERR=String(e&&e.message||e); } } return LZString.compressToUTF16(j); } /* deflate가 실패하면 예전 LZ로 저장 */
async function packJAsync(j){ if(!ZOK||typeof CompressionStream==='undefined')return packJ(j); const cs=new Blob([j]).stream().pipeThrough(new CompressionStream('deflate-raw')); return z15(new Uint8Array(await new Response(cs).arrayBuffer())); }
function packG(){ return packJ(prepG()); }
function unpack(s){ if(!s)return null; try{ const txt=s[0]==='{'?s:s[0]===ZMK?new TextDecoder().decode(fflate.inflateSync(unz15(s))):LZString.decompressFromUTF16(s); const g=JSON.parse(txt); return g&&!saveCheck(g)?g:null; }catch(e){ return null; } }
let SAVE_ERR='';
/* 저장은 몰아서 한다: 저장 한 번에 압축(LZ)이 수백 ms 걸리고 시즌이 쌓일수록 길어져, 하루 진행·버튼마다 바로 저장하면 게임이 굼떠졌다.
   save()는 0.7초 안에 들어온 요청을 한 번으로 묶고, 슬롯 바꾸기·내보내기·처음 화면 같은 곳은 saveNow()로 바로 저장한다.
   탭을 닫거나 숨기면(pagehide·visibilitychange) 남은 저장을 바로 끝낸다 */
let _svT=null;
function save(){ if(G){ G.stops=G.stops||[]; tutTick(); try{ guideMailTick(); }catch(e){} } if(!G)return; if(_svT)clearTimeout(_svT); _svT=setTimeout(()=>{ _svT=null; saveStoreAsync(); },700); }
function saveNow(){ if(G&&!_saveGStage){ G.stops=G.stops||[]; tutTick(); } if(_svT){ clearTimeout(_svT); _svT=null; } return saveStore(); } /* 저장 성공 여부를 돌려준다 */
function saveFlush(){ const h0=G&&JSON.stringify(G.castHold||null); try{ castHoldSync(); }catch(e){} if(_svT||_svBusy||_svFail||(G&&JSON.stringify(G.castHold||null)!==h0)){ /* 자동 재생으로 지나간 중계 장면도 탭을 숨길 때 저장(검수 11-09zzc #4·#5) */ if(_svT)clearTimeout(_svT); _svT=null; saveStore(); } } /* 몰아 저장이 압축 중이어도 탭을 닫을 땐 바로 저장한다. 실패한 저장은 다음 마감 때 다시 시도한다(검수 11-09zr #8) */
try{ window.addEventListener('pagehide',saveFlush); document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden')saveFlush(); }); window.addEventListener('beforeunload',saveFlush); }catch(e){}
/* 저장 순번: 늦게 끝난 몰아 저장(비동기)이 그사이 바로 저장한 더 새 상태를 덮지 않게 한다 */
let _svSeq=0, _svBusy=false, _svFail=false;
function slotInfo(){ return Object.assign({tid:G.user,name:tname(G.user),date:dstr(G.day),day:G.day,y:G.year,at:Date.now(),over:!!G.gameOver},G.wid?{wid:G.wid}:{}); } /* day·wid: 기기 옮기기로 받은 저장이 같은 게임의 어느 슬롯보다 앞인지 비교(카페 11-17 계정 연동 문의) */
/* 성공(true)은 같은 슬롯을 다시 읽어 방금 쓴 내용과 같을 때만(검수 11-06: 저장 실패인데 성공 안내)
   exp: 쓰기 직전 기대하는 판번호. 이 탭이 연 슬롯이면 SLOT_REV, 빈 슬롯에 새로 쓰는 복사는 0.
   순서(검수 11-09 #3: 두 탭이 같은 판번호를 확인하고 둘 다 성공): 목록을 새로 읽어 판번호 확인 → 목록에 새 판번호를 먼저 적어 슬롯을 차지 → 본문 쓰기 → 목록·본문이 여전히 이 탭 것인지 다시 확인.
   차지한 뒤에는 다른 탭이 판번호가 달라 쓰지 않으므로 그 탭의 본문을 덮지 않는다. 본문 쓰기가 실패하면 목록을 되돌린다 */
function writeSlot(n,data,info,exp,options={}){ const own=n===curSlot()&&exp==null; if(own)exp=SLOT_REV;
  const confl=()=>{ if(own){ if(!SAVE_CONFL){ try{ toast('다른 탭(창)에서 이 슬롯을 더 최근에 저장했습니다. 이 탭의 진행은 저장하지 않습니다. 남기려면 설정의 "빈 슬롯에 따로 저장"을, 최신 저장을 보려면 처음 화면의 이어하기를 누르세요.'); }catch(e){} } SAVE_CONFL=true; SAVE_ERR='다른 탭(창)에서 이 슬롯을 더 최근에 저장해, 이 탭의 진행은 저장하지 않았습니다. 이 탭 진행을 남기려면 "빈 슬롯에 따로 저장"이나 파일로 내보내기를 하세요.'; } else SAVE_ERR=`슬롯 ${n}에 다른 탭(창)이 그사이 저장해 쓰지 않았습니다.`; return false; };
  const full=()=>{ let mb=''; try{ mb=` (지금 모든 슬롯 합계 약 ${(SLOT_IDS.reduce((x,k)=>x+slotSize(k),0)/1024).toFixed(1)}MB)`; }catch(e){} SAVE_ERR=`브라우저 저장 공간이 가득 차 저장하지 못했습니다${mb}. 저장 공간은 모든 슬롯이 함께 쓰므로, 빈 슬롯이 있어도 전체가 차면 저장되지 않습니다. 안 쓰는 슬롯을 지우거나 내보내기로 백업한 뒤 지우세요.`; return false; }; /* 커뮤니티 11-12: 빈 슬롯이 있는데 공간 부족이라 나와 헷갈림 */
  if(own&&SAVE_CONFL)return confl();
  try{ const m=meta(), old=m.slots[n]?{...m.slots[n]}:null, act0=m.active, b0=sbGet(n); if(old&&old.lock){ SAVE_ERR=`슬롯 ${n}은(는) 보관 슬롯이라 덮어쓰지 않습니다. 보관을 풀어야 쓸 수 있습니다.`; return false; } /* 보관 슬롯은 자동 저장·덮어쓰기가 절대 쓰지 않는다(플레이테스트 3) */ if(revOf(m,n)!==exp)return confl();
    if(old?.pending||old?.deleting||SB_PEND.has(n)){SAVE_ERR='이 슬롯의 이전 저장 또는 삭제가 아직 확정되지 않았습니다. 잠시 뒤 다시 시도하세요.';return false;}
    if(old?.idb&&b0==null){SAVE_ERR='보조 저장소에서 최신 본문을 읽지 못해 덮어쓰지 않았습니다.';return false;}
    if(own&&!SLOT_NEW&&SLOT_TAG!==sbTag(old))return confl();
    if(Object.prototype.hasOwnProperty.call(options,'body')&&options.body!==b0)return confl();
    info=Object.assign({},info,{rev:revNext(exp)});delete info.pending;delete info.fail;delete info.idb;delete info.idbKey;delete info.idbCommit;
    if(old&&old.memo!=null&&info.memo==null&&!options.replace&&!(own&&SLOT_NEW))info.memo=old.memo;
    const key=sbPrefix(n)+sbToken(info.rev);info.writeKey=key;const c={n,rev:info.rev,info,old,active:act0,activate:own||!!options.activate,own,body0:b0,ls0:sbLsGet(n),data,key,commit:key+':commit',options};
    m.slots[n]={...info,pending:{old,key,commit:c.commit}};SB_CTX.set(n,c);
    if(!setMeta(m)){ SB_CTX.delete(n);SAVE_ERR='저장 목록을 기록하지 못했습니다. 저장 공간을 확인한 뒤 다시 저장하세요.'; return false; }
    /* 판번호를 확인한 뒤 차지하기 전에 다른 탭이 저장을 끝냈으면 본문이 바뀌어 있다: 그 본문을 덮지 않고 충돌로 본다. 목록은 그 본문 기준으로 고치고 새 판번호를 남겨 옛 판번호 탭도 막는다(검수 11-09zr #1: 두 탭 모두 성공) */
    if(!sbOwn(c)){SB_CTX.delete(n);return confl();}
    if(sbBaseGet(n,old)!==b0||sbLsGet(n)!==c.ls0){slotFix(n,c.rev,sbLsGet(n)??sbBaseGet(n,old));SB_CTX.delete(n);return confl();}
    SAVE_ERR_SB=''; if(!sbSet(n,data,c)){sbUndo(c,true);SB_CTX.delete(n);if(SAVE_ERR_SB){ SAVE_ERR=SAVE_ERR_SB; return false; } return full(); }
    const mine=sbOwn(c);if(!mine)return confl();if(sbGet(n)!==data){sbUndo(c,true);return full();}
    if(own){SLOT_REV=info.rev;SLOT_TAG=key;SLOT_NEW=false;}SAVE_ERR='';return true;}catch(e){return full();}}
/* 외부에서 가져오기·복사·슬롯 변경은 이 약속이 true로 끝난 뒤에만 화면과 활성 게임을 바꾼다. */
async function writeSlotConfirmed(n,data,info,exp,options={}){n=+n;if(SB_PEND.has(n)&&!await sbSettle(n))return false;
  if(meta().slots[n]?.pending||meta().slots[n]?.deleting){SAVE_ERR='다른 탭의 저장 또는 삭제가 아직 확정되지 않아 덮어쓰지 않았습니다.';return false;}
  if(sbFlag(meta(),n)&&!await sbCommitted(n)){SAVE_ERR='최신 저장 본문을 읽지 못해 덮어쓰지 않았습니다.';return false;}
  if(!writeSlot(n,data,info,exp,options))return false;const stamp=sbStamp(meta().slots[n]);if(!await sbSettle(n))return false;
  const z=await sbCommitted(n);return !!(z&&sbStamp(z.info)===stamp&&z.body===data);}
async function saveCurrentConfirmed(){if(!G)return true;const g=G,n=curSlot();for(let attempt=0;attempt<2;attempt++){if(!saveNow())return false;const j=prepG();if(!await sbSettle(n)||G!==g||curSlot()!==n||prepG()!==j)return false;const z=await sbCommitted(n),disk=z&&unpack(z.body);if(disk&&JSON.stringify(disk)===j){_svJ=j;_svN=n;_svP=null;return true;}if(!z)return false;/* 불러오기 복원이 svMark한 내용도 실제 본문이 다르면 한 번 확정해 쓴다. */svDrop(n);}return false;}
/* 목록 항목을 지금 본문 기준으로 고친다(판번호 r이 그대로일 때만). 본문이 없으면 항목을 뺀다 */
function slotFix(n,r,body){try{const m=meta();if(revOf(m,n)!==r)return;const row=m.slots[n]||{},ls=sbLsGet(n),prior=row.pending?.old||row.deleting?.old||row,raw=body??ls??sbBaseGet(n,prior),h=unpack(raw),memo=row.memo;if(h){m.slots[n]=Object.assign(slotInfoOf(h),{rev:r},row.writeKey?{writeKey:row.writeKey}:{},memo!=null?{memo}:{},row.lock?{lock:true}:{},ls==null&&prior.idb?{idb:true,idbKey:prior.idbKey,idbCommit:prior.idbCommit}:{});if(prior.idb&&ls==null){SB.set(n,raw);SB_REV.set(n,sbStamp(m.slots[n]));}else sbForget(n);}else delete m.slots[n];setMeta(m);}catch(e){}}
/* 바뀐 것이 없으면 쓰지 않는다: 진행 없이 처음 화면으로 나간 탭이 판번호를 올려 다른 탭 저장을 막지 않게(검수 11-09 #7) */
/* 같은 상태 기억(_svJ)은 저장이 확정된 뒤에만 바꾼다. IndexedDB로 쓰는 중이면 _svP(확정 대기)로 두고, 실패하면 기억을 지워 같은 상태라도 다시 쓴다(외부 검수 11-17 P1) */
let _svJ=null, _svN=null, _svP=null, _svWarn=false; function svMark(){ _svJ=G?prepG():null; _svN=curSlot(); _svP=null; }
function svSame(n,j){ return (j===_svJ&&n===_svN&&slotHas(n))||(!!_svP&&_svP.n===n&&_svP.j===j&&SB_PEND.has(n)); } /* 같은 상태를 쓰는 중이면 겹쳐 쓰지 않는다(결과는 확정 대기가 알린다) */
function svDone(n,j){ if(!SB_PEND.has(n)){ _svJ=j; _svN=n; _svP=null; return; } const p=_svP={n,j}; sbSettle(n).then(ok=>{ if(_svP!==p)return; _svP=null; if(ok){ _svJ=j; _svN=n; } else svDrop(n); }); }
function svDrop(n){ if(_svN===n)_svJ=null; if(_svP&&_svP.n===n)_svP=null; if(n===curSlot())_svFail=true; } /* 확정 실패: 같은 상태라도 다시 쓰고, 탭을 숨길 때도 다시 시도한다 */
function savePend(){ return !!G&&!SAVE_CONFL&&SB_PEND.has(curSlot()); }
/* 처음 화면·슬롯 전환처럼 저장이 확정돼야 하는 곳: IndexedDB 쓰기가 끝나지 않았으면 기다렸다 fn을 다시 부른다(기다리면 true). 실패·무응답이면 넘어가지 않고 알린다 */
function saveHold(fn,what){ if(!savePend())return false; if(UI._svHold)return true; UI._svHold=true; const n=curSlot(); let fin=false;
  const end=ok=>{ if(fin)return; fin=true; UI._svHold=false; if(ok&&!SB_PEND.has(n)){ fn(); return; } if(!ok&&!SAVE_ERR)SAVE_ERR='보조 저장소(IndexedDB) 저장이 끝나지 않았습니다. 잠시 뒤 다시 시도하거나 파일로 내보내기로 백업하세요.'; const msg=`지금 게임(${G?dstr(G.day):''})의 저장이 확정되지 않아 ${what||'넘어가지'} 않았습니다. ${SAVE_ERR||''}`.trim(); UI.slotMsg=msg; try{ toast(msg); }catch(e){} try{ render(); }catch(e){} };
  sbSettle(n).then(end,()=>end(false)); setTimeout(()=>end(false),8000); return true; }
function saveStore(){ if(!G)return false; const n=curSlot(); ++_svSeq; _svBusy=false; const j=prepG(); if(svSame(n,j)){ _svFail=false; _svWarn=false; if(!SAVE_CONFL)SAVE_ERR=''; return true; } const ok=writeSlot(n,packJ(j),slotInfo()); if(ok)svDone(n,j); _svFail=!ok; return ok; }
async function saveStoreAsync(){ if(!G)return; const n=curSlot(), seq=++_svSeq, g=G, info=slotInfo(), j=prepG(); if(svSame(n,j)){ _svFail=false; _svWarn=false; if(!SAVE_CONFL)SAVE_ERR=''; return true; } _svBusy=true; let data=null;
  try{ data=await packJAsync(j); }catch(e){ data=null; }
  if(seq!==_svSeq||G!==g)return; _svBusy=false; let ok; if(data==null)ok=saveStore(); else if((ok=writeSlot(n,data,info)))svDone(n,j);
  _svFail=!ok; if(ok)_svWarn=false; else if(!SAVE_CONFL&&!_svWarn){ _svWarn=true; try{ toast(`자동 저장에 실패했습니다. ${SAVE_ERR}`); }catch(e){} } } /* 자동 저장 실패를 바로 알린다(검수 11-09 #10). 실패가 이어지는 동안은 한 번만 */
function slotRecover(n,g,body,m0){ if(m0.slots[n])return m0; try{ const m=meta(); if(m.slots[n]||sbGet(n)!==body)return m0;
  const r=revNext(0); m.slots[n]=Object.assign(slotInfoOf(g),{rev:r}); if(!slotHas(m.active))m.active=n;
  if(!setMeta(m))return m0;
  if(revOf(meta(),n)!==r)return m0;
  if(sbGet(n)!==body){ slotFix(n,r); return m0; }
  return m;
 }catch(e){ return m0; } }
function load(){ const m=meta();
  try{ const old=SaveStore.get(SAVE); if(old&&!SLOT_IDS.some(n=>m.slots[n]&&unpack(sbGet(n)))){ const g=unpack(old); if(g){ /* 목록에 본문 없는 항목만 남아 있어도 구형 세이브를 옮긴다(검수 11-09zr #11) */ /* 목록만 비고 슬롯 본문이 남아 있으면 그 본문을 목록에 다시 올리고, 구형 세이브는 빈 슬롯으로 옮긴다(검수 11-07: 슬롯 1을 덮어씀) */ let act=null; for(const n of SLOT_IDS){ if(!slotHas(n))continue; const h=unpack(sbGet(n)); if(h){ if(!m.slots[n])m.slots[n]=slotInfoOf(h); if(act==null)act=n; } }
    const to=SLOT_IDS.find(n=>!slotHas(n)); if(act!=null&&!slotHas(m.active))m.active=act; try{ if(to==null)throw 0; SaveStore.set(slotKey(to),old); /* 이미 압축된 형식이면 그대로 옮긴다(다시 압축하면 다음 실행에서 못 연다) */ if(unpack(sbGet(to))){ m.slots[to]=slotInfoOf(g); if(act==null)m.active=to; if(setMeta(m))SaveStore.remove(SAVE); } }catch(e){ if(act!=null)setMeta(m); }
    if(act==null){ CUR_SLOT=m.slots[m.active]?m.active:(to||1); slotRevSync(CUR_SLOT,m); return g; } } } }catch(e){} /* 새 슬롯을 읽을 수 있을 때만 원본을 지우고, 못 옮겨도 읽은 원본으로 이어서 시작한다(검수 11-06) */
  /* 활성 슬롯 본문이 없거나 손상됐으면 본문이 남은 다른 슬롯을 연다. 못 연 슬롯은 이유를 처음 화면에 보인다(검수 11-09 #9·#11·#12·#14) */
  CUR_SLOT=null; for(let n;(n=contSlot(m))!=null;){ let g=null,body=null; try{ body=sbGet(n); g=unpack(body); }catch(e){} if(g){ const fixed=slotRecover(n,g,body,m); CUR_SLOT=n; slotRevSync(n,fixed);slotRollbackNotice(n,g);return g; } slotBad(n,'저장 본문을 읽을 수 없습니다'); UI.slotMsg=`슬롯 ${n}을(를) 불러오지 못했습니다. 저장 본문이 손상됐습니다. 내보내기 백업이 있으면 그걸로 가져오세요.`; } return null; }
function slotRollbackNotice(n,g){if(meta().slots[n]?.fail){UI.slotMsg=`슬롯 ${n}의 최근 저장이 실패해 마지막으로 확정된 ${dstr(g.day)} 진행을 열었습니다.`;try{toast(UI.slotMsg);}catch(e){}return UI.slotMsg;}return '';}
function slotSize(n){ try{ const s=sbGet(n); return s?Math.round(s.length*2/1024):0; }catch(e){ return 0; } }
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=s=>document.querySelector(s);
const hand=p=>p.isP?`${p.th}투`:`${p.th}투${p.bt}타`;
const recStr=r=>`${r.w}승 ${r.l}패${r.t?` ${r.t}무`:''}`;
/* 결과를 먼저 계산해 둔 우리 경기: 실시간 진행 중이거나 중계를 끝까지 보기(또는 닫기) 전에는 그 경기를 돌려준다. 결과(전적·순위·날짜 띠 점수)는 그동안 감춘다 */
function spoilG(){ if(!G)return null; if(G.live){ const g=G.games[G.live.i]; return g&&G.live.upto<g.line.a.length+g.line.h.length?g:null; }
  if(G.castHold&&castHoldIdx(G.castHold)<0)delete G.castHold; /* 잘못된 중계 위치(음수·없는 경기)는 버린다(검수 11-09zzc #9) */
  if(!UI.cast&&!UI.castRet&&G.castHold&&!UI.title){ const H=G.castHold; UI.cast={g:castHoldIdx(H),k:H.k,play:H.play!==false,pre:H.pre?1:0,spd:[1,1.5,2,3].includes(H.spd)?H.spd:1,mode:H.mode==='all'||H.mode==='hl'?H.mode:UI.castMode==='all'?'all':'hl',hold:1,...(H.pi>0?{pitch:{k:H.k,shown:H.pi}}:{})}; if(H.cw&&G.cwS&&G.cwS.id===H.cw)UI.cwAfter=H.cw; setTimeout(()=>{ try{ render(); }catch(e){} },0); } /* 새로고침해도 보던 중계를 그 장면·재생 상태 그대로 다시 열어 결과를 숨긴다(검수 11-06, 11-09zzc #6·#7·#8·#10) */
  const c=UI.cast||UI.castRet||(G.castHold&&UI.title?{g:castHoldIdx(G.castHold),k:G.castHold.k,hold:1}:null), g=c&&G.games[c.g]; if(!g||!c.hold||c.fin)return null; if(c.k>=(g.pbp||[]).length){ c.fin=true; delete G.castHold; return null; } return g; } /* 끝 장면에 한 번 닿으면 되감아도 공개 상태 */
/* 저장된 중계 위치의 경기 번호: 경기 id(gid)로 찾는다(같은 날 두 경기). 장면 번호가 범위 밖이면 -1 */
function castHoldIdx(H){ const i=H&&H.gid!=null?(G.games||[]).findIndex(x=>x.gid===H.gid):H?H.g:-1, g=G.games&&G.games[i]; return g&&Number.isInteger(H.k)&&H.k>=0&&H.k<=(g.pbp||[]).length?i:-1; }
function liveHidden(){ return !!spoilG(); }
/* 중계로 볼 경기 날 기사(맞대결·기록·팬 글)는 중계를 마칠 때까지 따로 두었다가(G._nh, 저장에도 남는다) 끝나면 제자리로. render마다 확인 */
function spoilNews(){ if(!G||!G.news)return; const sg=spoilG();
  if(sg){ const h=G.news.filter(n=>n.d>=sg.day); if(h.length){ G._nh=[...(G._nh||[]),...h]; G.news=G.news.filter(n=>n.d<sg.day); } } /* 숨긴 뒤 새로 생긴 당일 기사도(검수 11-09zzc #12) */
  else if(!sg&&G._nh){ G.news=[...G._nh,...G.news].sort((a,b)=>(b.id||0)-(a.id||0)); G._nh=null; }
  /* 결과가 든 소식(동석 보고 등, sgid)도 같은 방식으로 따로 둔다(검수 11-09zzc #11) */
  if(sg&&G.mail){ const h=G.mail.filter(m=>m.sgid!=null&&m.sgid===sg.gid); if(h.length){ G._mh=[...(G._mh||[]),...h]; G.mail=G.mail.filter(m=>!h.includes(m)); } }
  else if(!sg&&G._mh){ G.mail=[...G._mh,...G.mail]; G._mh=null; } }
function myRec(){ const r=Object.assign({},G.sea.rec[G.user]); const g=spoilG(); if(g){ if(!/차전/.test(g.kind||'')){ if(g.res==='승')r.w--; else if(g.res==='패')r.l--; else r.t--; } } return r; }
function myRank(){ return liveHidden()?'-':userRank(); } /* 결정전 결과 반영(검수 11-09zn) */
/* 중계로 볼 정규시즌 경기는 순위표·일정표에서도 중계를 마칠 때까지 빼고 그린다(달력과 같게, 검수 11-09l). 그리는 동안만 전적·경기 목록을 바꿔 끼운다 */
function spoilStand(fn){ const g=spoilG(), S=G&&G.sea; if(!g||/차전/.test(g.kind||'')||!S||!S.rec||!S.rec[g.home]||!S.rec[g.away])return fn();
  const o={rec:S.rec,tl:S.tl,rh:S.rh,ulog:S.ulog}, h=g.home, a=g.away, sg=Math.sign(g.hs-g.as), cut=(L,f)=>{ let i=-1; L.forEach((x,j)=>{ if(f(x))i=j; }); return i<0?L:L.filter((_,j)=>j!==i); };
  S.rec=o.rec.map(x=>Object.assign({},x)); if(sg>0){ S.rec[h].w--; S.rec[a].l--; } else if(sg<0){ S.rec[a].w--; S.rec[h].l--; } else { S.rec[h].t--; S.rec[a].t--; }
  if(o.tl)S.tl=o.tl.map((L,t)=>t===h||t===a?cut(L||[],x=>x[5]===g.day&&x[4]===(t===h?a:h)&&x[1]===(t===h?g.hs:g.as)&&x[2]===(t===h?g.as:g.hs)):L);
  if(o.rh)S.rh=o.rh.filter(s=>s[0]<g.day); if(o.ulog)S.ulog=cut(o.ulog,x=>x.gid!=null&&g.gid!=null?x.gid===g.gid:x.d===g.day&&x.h===h&&x.a===a); /* 같은 날 두 경기는 경기 id로(검수 11-09zzc #17) */
  try{ return fn(); } finally{ for(const k in o)if(o[k]!==undefined)S[k]=o[k]; } }
const ICO={full:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',cal:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',mail:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',brief:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',users:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>',trophy:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"/><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"/><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/></svg>',wallet:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',ff:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>'};
const wide=()=>typeof matchMedia!=='undefined'&&matchMedia('(min-width:980px)').matches;
function rcol(v){ return v>=75?'var(--r75)':v>=65?'var(--r65)':v>=55?'var(--r55)':v>=50?'var(--r50)':v>=45?'var(--r45)':v>=35?'var(--r35)':'var(--r20)'; }
/* 글 속 선수·구단 이름을 누를 수 있게 */
let _lk={k:null};
function linkMap(){ const ps=Object.values(G.players); const k0=(typeof UI!=='undefined'?UI._rN:0)+':'+G.year+':'+G.day+':'+(G.mvN||0)+':'+ps.length+':'+G.user; if(_lk.g===G&&_lk.k0===k0)return _lk; /* 성능: 한 화면(UI._rN)에서 날짜·이동 기록·선수 수·구단이 같으면 전체 열쇠를 다시 만들지 않는다 */ const k=G.year+':'+G.day+':'+G.user+':'+JSON.stringify(G.teams.map(t=>[t.id,t.city,t.nick,t.disp||"",t.abbr||""]))+':'+JSON.stringify(ps.map(p=>[p.id,p.name,p.team,!!p.prospect])); if(_lk.g===G&&_lk.k===k){ _lk.k0=k0; return _lk; }
  const names={}; const sc=p=>(p.team===G.user?3:p.team!=null?2:p.foreign?1:0);
  for(const p of Object.values(G.players)){ if(!p.name||p.name.length<2||p.prospect&&!(G.draft&&!G.draft.done))continue; const c=names[p.name]; if(c==null||sc(p)>sc(G.players[c]))names[p.name]=p.id; }
  const teams={}; for(const t of G.teams){ teams[tfull(t)]=t.id; teams[t.nick]=t.id; teams[tnick(t)]=t.id; }
  const ppl={}, pplT={}; const addP=(n,a,v)=>{ if(n&&n.length>=2){ if(!pplT[n])pplT[n]={a,v}; if(names[n]==null&&!ppl[n])ppl[n]={a,v}; } }; /* pplT: 선수와 이름이 같아도 직함(단장·감독·코치…)이 붙으면 그 사람으로(일고회장 11-12) */
  try{ const B=bossOf(G.user); addP(B.own.name,'person','own'); addP(B.ceo.name,'person','ceo'); }catch(e){}
  for(const t of G.teams){ const m=G.mgr[t.id]; if(m&&m.name)addP(m.name,t.id===G.user?'person':'lteam',t.id===G.user?'mgr':t.id);
    if(t.id!==G.user&&t.gm&&!t.gm.interim)addP(t.gm.name,'person','gm:'+t.id);
    const C=G.coach&&G.coach[t.id]; if(C)for(const r of CKEYS)if(C[r])addP(C[r].name,t.id===G.user?'person':'lteam',t.id===G.user?'c:'+r:t.id); }
  for(const m of [...(G.mmarket||[]),...(G.exMgr||[])])addP(m.name,'person','xmgr:'+m.id); for(const a of G.abroad||[])if(!a.back)addP(a.name,'person','abr:'+a.id); for(const o of G.ob||[])addP(o.name,'person','ob:'+o.id); /* 떠난 사람도 소식 속 이름을 누르면 인물 창(현역 이름이 먼저) */
  const er=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); const tk=Object.keys(teams).sort((a,b)=>b.length-a.length).map(er); const pk=[...Object.keys(names),...Object.keys(ppl)].sort((a,b)=>b.length-a.length).map(er);
  const src=`(${tk.join('|')})|(^|[^가-힣A-Za-z])(${pk.join('|')})(\u2063[\u200b\u200c]+\u2064)?`; /* 뒤쪽 확인((?<!…))은 iOS 16.3 이하 사파리에서 문법 오류라 앞 글자를 잡아 그대로 돌려준다(모바일 접속 불가 제보 11-11) */ _lk={g:G,k,k0,names,teams,ppl,pplT,re:new RegExp(src,'g'),re1:new RegExp(src)}; return _lk; }
function linkify(h,pp,L){ if(!G||!h)return h; L=L||linkMap(); /* autoLink는 한 번 구한 표를 넘긴다 */ return h.replace(L.re,(m,t,pre,pn,mk,off,str)=>{ if(t)return `<a class="tl" data-a="lteam" data-v="${L.teams[t]}">${t}</a>`; pre=pre||''; if(pp&&L.names[pn]!=null&&L.pplT[pn]&&!mk){ const q=L.pplT[pn]; return `${pre}<a class="ml" data-a="${q.a}" data-v="${q.v}">${pn}</a>`; } /* 감독·코치 화면(또는 data-person 안)에서는 표시 없는 동명이인 이름을 사람 쪽으로(꺼끼꺼 11-12) */ if(L.names[pn]!=null&&!L.pplT[pn]&&!mk&&typeof off==='number'&&typeof str==='string'){ const after=str.slice(off+m.length,off+m.length+6), before=str.slice(Math.max(0,off-6),off+pre.length); if(/^\s?([가-힣]{0,3}코치|단장|감독|구단주|사장|스카우트|대행|기자|해설위원|캐스터)/.test(after)||/(단장|감독|코치|구단주|사장|스카우트|기자)\s?$/.test(before))return m; /* 기자 이름이 같은 이름의 선수로 이어지던 문제 */ } /* 직함이 붙었는데 인물 목록에 없는 사람(고교 감독 등)은 같은 이름 선수로 잇지 않는다(일고회장 11-12) */ if(L.names[pn]!=null&&L.pplT[pn]&&!mk&&typeof off==='number'&&typeof str==='string'){ const after=str.slice(off+m.length,off+m.length+6), before=str.slice(Math.max(0,off-6),off+pre.length); if(/^\s?([가-힣]{0,3}코치|단장|감독|구단주|사장|스카우트|대행|기자|해설위원|캐스터)/.test(after)||/(단장|감독|코치|구단주|사장|스카우트|기자)\s?$/.test(before)){ const q=L.pplT[pn]; return `${pre}<a class="ml" data-a="${q.a}" data-v="${q.v}">${pn}</a>`; } } { const id=pnmId(mk); if(id!=null&&G.players[id]&&G.players[id].name===pn)return `${pre}<a class="pl" data-a="player" data-v="${id}">${pn}</a>`; } if(L.names[pn]!=null)return `${pre}<a class="pl" data-a="player" data-v="${L.names[pn]}">${pn}</a>`; const q=L.ppl[pn]; return pre+(q?`<a class="ml" data-a="${q.a}" data-v="${q.v}">${pn}</a>`:pn); }); }
/* 조사 자동 맞춤: 화면에 "을(를)·이(가)·은(는)·와(과)·(으)로·(이)라"가 남으면 앞 글자 받침을 보고 고른다 */
const JOSA_RE=/을\(를\)|이\(가\)|은\(는\)|와\(과\)|과\(와\)|\(으\)로|\(이\)라/g;
/* 키보드 안내 '(Space)' 등은 터치 기기에서 숨긴다(플레이 테스트 11-13) */
const kbdHint=k=>typeof matchMedia==='function'&&matchMedia('(hover:none),(pointer:coarse)').matches?'':` (${k})`;
/* 안내 글의 키보드 표현을 기기에 맞춘다: 터치 기기에서는 스페이스바 대신 '진행하기' 버튼 */
const touchDev=()=>typeof matchMedia==='function'&&matchMedia('(hover:none),(pointer:coarse)').matches;
function devTxt(s){ s=String(s||'').replace(/한 경기씩 보려면 '1경기 진행'을 누르세요\./g,"하루씩 넘기려면 '진행하기' 옆의 '하루 진행'을, 시즌 중 우리 경기를 직접 보려면 그 자리의 '중계'를 누르세요.").replace(/'1경기 진행'/g,"'하루 진행'"); if(!touchDev())return s; return s.replace(/스페이스바\(또는 ([^)]*)\)/g,'$1').replace(/스페이스바로/g,"'진행하기' 버튼으로").replace(/스페이스바만/g,"'진행하기' 버튼만").replace(/스페이스바/g,"'진행하기' 버튼"); }
function josaTail(s){ for(let i=s.length-1;i>=0;i--){ const c=s[i]; if(c===')'){ let d=1; for(i--;i>=0;i--){ if(s[i]===')')d++; else if(s[i]==='('&&--d===0)break; } continue; } if(/["'”’」』\]\s.·\u2063\u2064\u200b\u200c]/.test(c))continue; return c; } return ''; } /* 이름 뒤 보이지 않는 선수 번호(pidName)는 건너뛴다 */
function josaPick(prev,j){ const c=josaTail(prev); let jong=-1; if(/[가-힣]/.test(c))jong=(c.charCodeAt(0)-0xAC00)%28; else if(/[0-9]/.test(c))jong=[1,1,0,1,0,0,1,1,1,0][+c]?8:0; else if(/[A-Za-z]/.test(c))jong=/[lmnr]/i.test(c)?4:0; else return null;
  const has=jong>0; switch(j){ case '을(를)':return has?'을':'를'; case '이(가)':return has?'이':'가'; case '은(는)':return has?'은':'는'; case '와(과)': case '과(와)':return has?'과':'와'; case '(으)로':return has&&jong!==8?'으로':'로'; case '(이)라':return has?'이라':'라'; } return null; }
function josaFix(root){ if(!root)return; const W=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let prev=''; let n;
  while((n=W.nextNode())){ const v=n.nodeValue; if(v&&JOSA_RE.test(v)){ JOSA_RE.lastIndex=0; let out='', last=0, m; while((m=JOSA_RE.exec(v))){ const before=prev+v.slice(0,m.index); const r=josaPick(before.slice(-40),m[0]); out+=v.slice(last,m.index)+(r??m[0]); last=m.index+m[0].length; } out+=v.slice(last); n.nodeValue=out; }
    if(v&&v.trim())prev=(prev+n.nodeValue).slice(-60); } }
/* 화면을 그린 뒤, 누를 수 없는 글자 속 이름을 찾아 링크로 바꾼다 */
const NOLINK='a,button,[data-a],select,option,textarea,input,svg,script,style,.nolink,.kbar,.seg,.chips,.bnav,.sbar,.cast,label,.tcd';
/* 표 머리 WAR·OPS에 용어 풀이(마우스를 올리면). 정렬 버튼을 막지 않게 title만 단다(플레이테스트 4 #14) */
function glossTh(root){ if(typeof GLOSS==='undefined')return; for(const th of root.querySelectorAll('th')){ if(th.title)continue; const t=th.textContent.trim(); if(t==='WAR'||t==='OPS')th.title=GLOSS[t]; } }
function autoLink(root){ try{ josaFix(root); }catch(e){} try{ glossTh(root); }catch(e){} if(!G||!root||UI.cast)return; const L=linkMap(); const W=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{ const v=n.nodeValue; if(!v||v.length<2||!/[가-힣A-Za-z]/.test(v))return NodeFilter.FILTER_REJECT; const pe=n.parentElement; if(!pe||pe.closest(NOLINK))return NodeFilter.FILTER_REJECT; return L.re1.test(v)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT; }});
  const list=[]; let n; while((n=W.nextNode()))list.push(n); for(const t of list){ const sp=document.createElement('span'); const pe=t.parentElement; sp.innerHTML=linkify(esc(t.nodeValue),!!(pe&&(pe.closest('[data-person]')||(UI.tab==='staff'&&!pe.closest('[data-player-ctx]')))),L); const f=document.createDocumentFragment(); while(sp.firstChild)f.appendChild(sp.firstChild); t.parentNode.replaceChild(f,t); } }
const lk=t=>linkify(esc(t));
/* 창단 드래프트 등급: 숫자 대신 색 구간만. 우리 스카우트 추정이라 틀릴 수 있다 */
const GCOL={S:'var(--r75)',A:'var(--r65)',B:'var(--r55)',C:'var(--r50)',D:'var(--r45)',E:'var(--r35)',F:'var(--r20)'}; const rcolG=v=>GCOL[GRD(v)]; /* 등급 글자와 같은 색 */
function fdGrade(p){ if(!G.fd||!p)return null; const S=fdSeenBy(G.user,p); return {g:GRD(S.o),c:rcolG(S.o),up:p.age<=26&&S.pot-S.o>=6,o:S.o}; }
const gchip=x=>x?`<b class="gch" style="--c:${x.c}" title="스카우트 추정 등급">${x.g}${x.up?'<i>↑</i>':''}</b>`:'';
const rchip=v=>v==null?'<b class="rc q" title="알 수 없음">-</b>':`<b class="rc" style="--c:${rcol(v)}">${dv(v)}</b>`;
/* 구단 엠블럼: 구단 상징을 직접 그린 오리지널 SVG */
const EMB={
  코메츠:'<circle cx="15.2" cy="8" r="2.7" fill="#fff"/><path d="M13.3 6.4 4.8 14.6l1.6 1.4 8.3-7.4Z" fill="#fff" opacity=".9"/><path d="M14.6 9.8 7.6 16.4l.9.9 7.4-6.3Z" fill="#fff" opacity=".55"/><path d="M12.2 5.6 6.4 10.2l.6.8 6.2-4.1Z" fill="#fff" opacity=".45"/>',
  하운즈:'<path d="M7.2 16.2V11L9 8l.6-3.4 2 2.6 2.6.3 3 2.4.2 1.8-2.8.6-1.7 2.2v2.7Z" fill="#fff"/><circle cx="12.6" cy="8.9" r=".7" fill="C3"/><path d="M9.6 4.6 8.6 9.2 10.6 7.4Z" fill="C3" opacity=".55"/>',
  시걸스:'<path d="M4.4 10.6Q8 6.4 12 10.2 16 6.4 19.6 10.6 16 9 12 12.6 8 9 4.4 10.6Z" fill="#fff"/><path d="M6 14.6Q9 13.2 12 15.2 15 13.2 18 14.6" fill="none" stroke="#fff" stroke-width="1.1" opacity=".6" stroke-linecap="round"/>',
  스파크스:'<path d="M12 3.8 13.5 9.4 19 11 13.5 12.6 12 18.2 10.5 12.6 5 11 10.5 9.4Z" fill="#fff"/><path d="M17.2 4.8 17.8 6.6 19.6 7.2 17.8 7.8 17.2 9.6 16.6 7.8 14.8 7.2 16.6 6.6Z" fill="#fff" opacity=".7"/>',
  스톰:'<path d="M7.4 11.6a3 3 0 0 1 1-5.8 3.7 3.7 0 0 1 7 1.1 2.4 2.4 0 0 1 .9 4.7Z" fill="#fff"/><path d="M12.4 11.6 10.2 15.4h2l-1.2 3 3.6-4.6h-2.1l1.3-2.2Z" fill="#ffe27a"/>',
  레드폭스:'<path d="M5.8 5.4 9.6 8.8h4.8l3.8-3.4-.9 6L12 16.8l-5.3-5.4Z" fill="#fff"/><path d="M8.2 11.6 12 15.2l3.8-3.6-1.8.2L12 13.4l-2-1.6Z" fill="C3" opacity=".55"/><circle cx="10" cy="10.8" r=".75" fill="C3"/><circle cx="14" cy="10.8" r=".75" fill="C3"/>',
  블레이즈:'<path d="M12 3.6c2.6 3.4 5.2 5.2 4.6 9.1-.4 3-2.5 4.6-4.6 4.6-2.5 0-4.6-1.9-4.6-4.5 0-2.3 1.4-3.5 2-4.9.8 1.6 1.4 2.2 2 2.4-.4-2.4-.2-4.5.6-6.7Z" fill="#fff"/><path d="M12 10.4c1 1.4 2 2.3 1.8 3.8-.2 1.2-1 1.9-1.8 1.9-1 0-1.9-.8-1.9-1.8 0-1 .7-1.6 1-2.3.4.6.6.8.8.9-.1-.9 0-1.6.1-2.5Z" fill="C1"/>',
  썬더스:'<path d="M13.8 3.6 7.4 12.2h3.9l-1.5 6.4 7-9h-4Z" fill="#fff"/>',
  웨이브스:'<path d="M5 16.4C5 10.6 10 6.6 14.8 7.4c-2.6 1-3.6 3-2.2 4.6 1.6 1.6 4 .6 6-.8-.6 3.6-3.2 5.2-6.6 5.2Z" fill="#fff"/><path d="M5.2 18.2q1.7-1.2 3.4 0t3.4 0 3.4 0 3.4 0" fill="none" stroke="#fff" stroke-width="1" opacity=".6" stroke-linecap="round"/>',
  앵커스:'<circle cx="12" cy="5.6" r="1.5" fill="none" stroke="#fff" stroke-width="1.2"/><path d="M12 7.1v9.4M9.2 9.4h5.6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M6.4 12.2c.4 2.8 2.8 4.6 5.6 4.6s5.2-1.8 5.6-4.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M5.2 13.4 6.4 11.4l1.6 1.6ZM18.8 13.4l-1.2-2-1.6 1.6Z" fill="#fff"/>',
  별:'<path d="M12 4.2l2.1 4.6 5 .5-3.8 3.3 1.1 4.9L12 14.9l-4.4 2.6 1.1-4.9-3.8-3.3 5-.5Z" fill="#fff"/>',
  왕관:'<path d="M5.4 15.2 4.6 7.8l3.9 3.1L12 5.6l3.5 5.3 3.9-3.1-.8 7.4Z" fill="#fff"/><path d="M5.6 17.2h12.8" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>',
  배트:'<path d="M6.2 18.2 16.2 6.4c.7-.8 1.9-.7 2.3.1.3.7 0 1.3-.6 1.9L7.6 19.4Z" fill="#fff"/><circle cx="7.8" cy="7.8" r="2.6" fill="none" stroke="#fff" stroke-width="1.2"/><path d="M6.2 6.6q1.6 1.2 3.2 2.4" stroke="#fff" stroke-width=".6" fill="none"/>',
  산:'<path d="M3.8 17.2 9.4 8.6l2.6 3.7 2.2-2.7 6 7.6Z" fill="#fff"/><path d="M8.2 10.4 9.4 8.6l1.2 1.7-1.2.7Z" fill="C1"/>'
};
function badge(tid,sz){ const t=(G&&G.teams[tid])||TEAM_DEF[tid]; if(!t)return ''; const P=tpal(t); const c1=P[0],c2=P[1]==='#ffffff'?'#e8ecf2':P[1],c3=P[2]; const LG=t.logo||{}; const code=LG.code||t.code;
  const big=sz>=34;
  { const B=!t.logo&&typeof BADGE_IMG!=='undefined'?BADGE_IMG[t.id!=null?t.id:tid]:null; /* 게임 전(구단 선택)은 TEAM_DEF라 id가 없어 번호로 찾는다 */ if(B)return `<img class="badge bimg${B.c?' bcrest':''}" data-bt="${t.id!=null?t.id:tid}" src="${B.c||(sz>32?B.l:B.s)}" width="${sz}" height="${sz}" alt="" decoding="async" draggable="false">`; } /* 구단 엠블럼은 크기와 관계없이 메인 로고(v2 crest)로 통일(사용자 11-07). 모자·유니폼 마크는 3D·사진 쪽에서 따로 쓴다. 예전 설명: 승인된 구단 원형 배지(assets/badges/v1): 이미지에 배경·테두리가 있어 효과를 더하지 않는다. 32px 이하는 64px, 그보다 크면 128px 원본. 플레이어가 로고를 바꾸면 그쪽이 우선 */
  if(LG.img&&/^data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+$/.test(LG.img))return `<img class="badge bimg bup" src="${LG.img}" width="${sz}" height="${sz}" alt="" decoding="async" draggable="false">`; /* 플레이어가 올린 로고 이미지: 방패에 넣어 자르지 않고 그림 그대로(contain, 투명 배경 유지. 마인2 11-16). 예전 96px 정사각형 저장도 그대로 보인다 */
  const ek=LG.emb||(TEAM_DEF[t.id]||t).nick; const g=ek==='글자'?null:(EMB[ek]||EMB[t.nick]); /* 구단 이름을 바꿔도 엠블럼은 원래 구단 것(로고를 따로 고르면 그것) */
  const inner=g?g.replace(/C1/g,c1).replace(/C3/g,c3):`<text x="12" y="14.4" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="${code.length>=3?6.6:8.2}" fill="#fff">${esc(code)}</text>`;
  return `<svg class="badge" width="${sz}" height="${sz}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.2 21.4 4.4V11c0 5.8-4 9.9-9.4 11.8C6.6 20.9 2.6 16.8 2.6 11V4.4Z" fill="${c3}"/><path d="M12 2.4 20.2 5.2V11c0 5-3.4 8.6-8.2 10.4C7.2 19.6 3.8 16 3.8 11V5.2Z" fill="${c1}" stroke="${c2}" stroke-width=".7"/>${big?`<path d="M3.8 15.2h16.4" stroke="${c2}" stroke-width=".35" opacity=".5"/>`:''}<g transform="translate(12 11.2) scale(${big?.86:.92}) translate(-12 -11)">${inner}</g>${big?`<text x="12" y="19.4" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="2.6" letter-spacing=".25" fill="#fff" opacity=".85">${esc(code)}</text>`:''}</svg>`; }
/* 큰 로고가 일부 브라우저에서 깨져 보이는 경우(테스터 11-07, 고양 스톰) 마크 이미지로 한 번만 바꾼다 */
if(typeof document!=='undefined')document.addEventListener('error',e=>{ const i=e.target; if(!i||!i.classList||!i.classList.contains('bimg')||i.dataset.fb)return; const B=BADGE_IMG[i.dataset.bt]; i.dataset.fb=1; if(B)i.src=i.width>32?B.l:B.s; },true);
const tb=(tid,label)=>`<span class="tname">${badge(tid,18)}${label??tname(tid)}</span>`;
/* 구단 고유색: 주색(헤더·강조), 밝은색(버튼·포인트), 어두운색(배경) */
const TCOL=new Proxy({},{get:(o,code)=>{ const p=TPAL[code]; return p?[p[0],p[3],p[2]]:undefined; }});
function setTeamVars(t){ const r=document.documentElement.style; const c=t&&(t.logo&&t.logo.c1?(P=>[P[0],P[3],P[2]])(tpal(t)):TCOL[t.code]); const h=t?t.hue:212;
  r.setProperty('--team',c?c[0]:hslHex(h,52,34)); r.setProperty('--team-hi',c?c[1]:hslHex(h,60,50)); r.setProperty('--team-dk',c?c[2]:hslHex(h,42,16)); }
const TITLE={cal:'캘린더',home:'홈',inbox:'소식함',roster:'선수단',trade:'트레이드',transfer:'영입·계약',scout:'스카우팅',train:'훈련',staff:'스태프·육성',cfg:'설정 · 권한',me:'단장 프로필',league:'리그',club:'구단·재정',uld:'래더'};
function metaChips(){ const t=team(G.user); const per=period(); const ci=capInfo(G.user); const r=myRec(); const c=[];
  if(per==='season'||per==='post')c.push(`<span class="chipn"><b>${r.w}-${r.l}${r.t?'-'+r.t:''}</b> · ${myRank()}위</span>`);
  if(!G.unemp){ const b=budget(); const R=G.roomSeen; if(!R||R.y!==G.year){ G.roomSeen={y:G.year,v:b.roomGoal,d:G.day,dv:0}; } else if(R.d!==G.day){ const dv=b.roomGoal-R.v; G.roomSeen={y:G.year,v:b.roomGoal,d:G.day,dv:Math.abs(dv)>=5000?dv:0}; } const dv=G.roomSeen.dv||0;
    c.push(`<button class="chipn lk" data-a="go" data-v="club:fin" title="${b.indie?'예산 여유 = 올해 예상 수입 - 올해 예상 지출(독립구단: 새 스폰서·관중 수입이 바로 반영). ':'예산 여유 = 시즌 시작 때 확정한 예상 수입 + 구단주 지원 목표 - 올해 예상 지출. 시즌 중 늘어난 수입(새 스폰서 등)은 모기업 몫이라 여기에 더해지지 않고, 구단주에게 추가 지원을 요청할 근거가 됩니다. '}음수면 구단주 목표를 넘겨 쓰는 중입니다(돈이 없다는 뜻은 아님). 0이면 예상 적자를 보유 현금으로 먼저 메운 상태입니다. 트레이드·영입 화면의 '선수 영입 자금'은 지금 쓸 수 있는 현금(보유 현금 기준)으로, 이 숫자와 다릅니다. 예상 수지(재정 화면)는 실제 수입·지출 전망이고, 구단주는 시즌 결산 때 실제 수지와 이 목표를 지켰는지로 평가합니다. 연봉 상한까지 남은 금액과는 다른 숫자입니다. 누르면 재정 화면.">예산 여유 <b style="color:${b.roomGoal>=0?'var(--good)':'var(--bad)'}">${b.roomGoal>=0?money(b.roomGoal):'-'+money(-b.roomGoal)}</b>${Math.abs(b.roomGoal)<50&&b.selfC>0?`<em class="small" style="font-style:normal" title="올해 예상 적자 ${money(b.selfC)}를 보유 현금(30억 초과분의 절반)으로 먼저 메워 여유가 0입니다"> 현금 충당</em>`:''}${dv?`<em class="small" style="font-style:normal;color:${dv>0?'var(--good)':'var(--bad)'}"> ${dv>0?'▲':'▼'}${money(Math.abs(dv))}</em>`:''}</button>`); } void ci;
  return c.join(''); }
function blkLink(b){ if(/^건강한/.test(b))return '<button data-a="rosterRecovery">국내 무적 선수 보충</button><button data-a="tab" data-v="roster">선수단·육성선수 확인</button>';if(b.includes('창단'))return '<button data-a="tab" data-v="home">드래프트로</button>'; if(G.draft&&!G.draft.done)return '<button data-a="goWork" data-v="신인드래프트">드래프트로</button>'; if(b.includes('감독'))return '<button data-a="goWork" data-v="감독">감독 후보</button>'; if(G.live)return '<button data-a="tab" data-v="home">경기 보기</button>'; if(b.includes('로스터'))return '<button data-a="tab" data-v="roster">선수단</button>'; if(b.includes('보상'))return '<button data-a="go" data-v="transfer:fa">FA 보상 처리</button>'; return ''; }

