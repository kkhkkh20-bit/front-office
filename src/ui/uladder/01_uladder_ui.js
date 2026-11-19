/* ===== 유저 래더 화면: 주 메뉴 '래더'(래더 v2, 사용자 11-17. 예전 자리 구단 › 유저 래더는 로비로 보낸다) =====
   내 덱(지금 1군 또는 앨범 시즌을 등록·갱신, 서버에 올림) · 리그(순위·다음 연전·덱 고치기·연전 돌리기/끝까지) · 결과(승강·MVP) · 단계표(기록).
   리그를 시작할 때 서버에서 같은 단계 덱을 한 번 받는다. 모자라면 가져온 우승 덱, 그다음 단계 기준 AI 덱으로 채운다(엔진 src/engine/uladder).
   서버: 기본은 새 서버 v1(/api/v1, D1. 사용자 11-17 "화면도 새 서버로 바로 전환해"). probe가 'ok'가 아니면(꺼짐·D1 고장·오프라인) 예전 KV 래더(/api/ladder) 그대로.
     v1 흐름: probe → 덱이 있으면 플레이어 만들기(닉네임 = 단장 이름, 세계 id) → 덱 올리기(처음이면 지금 단계를 옮긴다: 서버가 KV에 올린 단계까지만 받는다)
     → 리그 시작에 상대(opponents, 상대 pid·닉네임을 팀에 붙임) → 리그 끝에 결과(result) → 단계는 서버 응답을 쓴다. 끊기면 결과는 기기에 줄 세웠다가 다음 연결 때 보낸다.
     '순위' 탭: 내 시즌 카드(포인트·순위·칭호·라이벌), 단계별 순위표 50위(이름을 누르면 덱 구경, 구단주 11-19), 최근 소식. 상대 덱 칸에 그 유저와의 맞대결. 끄기: localStorage fo-net-v1=0 또는 ?net=kv.
   서버가 없거나 연결이 안 되면 이 기기에서 AI 덱으로 리그를 연다. 덱 고치기는 연전 사이 언제든, 다음 연전부터 적용된다 */
const UL={view:null,feed:[],tiers:null,tiersSt:'',busy:false,msg:'',bad:false,srv:'',me:null,edit:null,src:'now',name:'',prog:'',opp:null,
  v1:'',v1at:0,v1p:null,N:null,v1sync:'',sv:{me:null,meSt:'',board:{},bt:null,feed:null,feedSt:'',rv:null,h2h:{},near:null,dk:{},dv:null}};
const ulApi=(p,o)=>cupFetchT('/api/ladder'+p,Object.assign({cache:'no-store',credentials:'same-origin'},o||{})).then(async r=>{ const j=await cupJson(r); return {r,j}; }); /* 12초 시간 제한(외부 검수 11-17) */
/* 예전 KV 래더 단계 맞추기(외부 검수 11-17 #10): 결과에 상태를 적고, 실패하면 결과 카드에서 '다시 보내기' */
function ulKvTier(res){ res.kv='sending'; return ulApi('/tier',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({wid:cupWid(),tier:res.to})}).then(({r})=>{ res.kv=r.ok?'ok':'fail'; },()=>{ res.kv='fail'; }).finally(()=>{ try{ ulSave(); render(); }catch(e){} }); }
function ulSay(m,bad){ UL.msg=m; UL.bad=!!bad; try{ render(); }catch(e){} }
/* 저장 칸(게임)이 바뀌면 비동기 응답을 버린다(외부 검수 11-17 P1: 칸 A의 상대 응답이 칸 B 리그로 들어가던 것). 요청을 시작할 때 표를 받고, 응답을 쓰기 전에 같은 게임인지 본다 */
const ulTok=()=>({g:G,n:UL.gen|0}), ulSame=t=>!!t&&t.g===G&&t.n===(UL.gen|0);
function ulGameSwitch(){ UL.gen=(UL.gen|0)+1;ulRunClear(); if(typeof ULA!=='undefined')Object.assign(ULA,{busy:false,work:null,msg:'',bad:false}); Object.assign(UL,{me:null,srv:'',busy:false,msg:'',bad:false,prog:'',edit:null,feed:[],view:null,opp:null,drop:null,bx:null,tmT:'st',rec:null,src:'now',name:'',v1sync:'',ex:null,rv:null,reveal:null,meta:null,tiers:null,tiersSt:'',pick:false});
  Object.assign(UL.sv,{me:null,meSt:'',board:{},feedSt:'',rv:null,h2h:{},near:null,dk:{},dv:null}); if(typeof CUP!=='undefined')Object.assign(CUP,{st:'',my:null,drop:null,mineOpen:false,msg:'',bad:false,busy:false,ents:null,entsSt:'',view:null,name:''}); }
/* 래더·앨범이 G를 바꾸면 저장을 건다(외부 검수 11-17 P1: 저장을 걸지 않아 새로 고침하면 사라지던 것). 실패는 저장 쪽이 알린다 */
const ulSave=()=>{ try{ save(); }catch(e){} };
/* 진행 표는 서버 응답의 세계 표와 분리한다. 같은 세계에서 리그를 버려도 옛 계산은 멈춘다. */
const ulRunSame=r=>!!r&&UL.runToken===r&&ulSame(r.tk)&&uld()===r.u&&(r.u.league===r.l||r.finished&&r.u.league==null&&r.u.last===r.finished);
function ulRunClear(){UL.runToken=null;UL.pending=null;UL.busy=false;UL.prog='';UL.bx=null;UL.opp=null;UL.rv=null;}
function ulDisplayState(U){const p=UL.pending;return p&&ulRunSame(p.run)&&p.run.u===U?p.u:U;}
function ulLeagueRestore(L,old){for(const k of Object.keys(L))delete L[k];Object.assign(L,old);}
async function ulRunWrite(r){if(!ulRunSame(r))return false;const ok=await saveCurrentConfirmed();if(!ulRunSame(r))return false;if(ok)return true;
  /* 자동 참가 등 다른 상태가 같은 순간 바뀌었어도, 이 연전이 실제 본문에 확정됐으면 다시 돌리지 않는다. */
  const z=await sbCommitted(curSlot());if(!ulRunSame(r))return false;const d=z&&unpack(z.body)?.uld;if(d&&(r.finished?!d.league&&JSON.stringify(d.last)===JSON.stringify(r.finished):JSON.stringify(d.league)===JSON.stringify(r.l)))return true;
  const e=new Error('리그 진행을 저장하지 못해 멈췄습니다. 저장 공간을 확인한 뒤 다시 진행하세요.');e.ulSave=true;throw e;}
async function ulRunStep(r,fn){if(!ulRunSame(r))return null;const L=r.l,old=JSON.parse(JSON.stringify(L)),next=L.next,post=L.post?.next;UL.pending={run:r,u:{...r.u,league:old}};let value,error;
  try{value=fn();}catch(e){error=e;}if(!ulRunSame(r))return null;
  /* 기사만 실패한 완료 연전은 먼저 저장한다. 경기 전 오류의 불완전 계산은 남기지 않는다. */
  if(error&&!(L.next>next||(L.post?.next??-1)>(post??-1))){ulLeagueRestore(L,old);UL.pending=null;throw error;}
  try{if(!await ulRunWrite(r))return null;}catch(e){if(ulRunSame(r)){ulLeagueRestore(L,old);UL.pending=null;}throw e;}
  if(!ulRunSame(r))return null;UL.pending=null;if(error)throw error;return value;}
/* ---- 서버 v1 연결(사용자 11-17) ---- */
/* 편집된 저장이면 래더·대회·서버 기록을 막는 이유(엔진 22d_edited editedBlock). 화면 파일만 읽는 점검(vm)에서도 멈추지 않게 */
function ulEdited(){ try{ return typeof editedBlock==='function'?editedBlock():''; }catch(e){ return ''; } }
function ulNet(){ return UL.N||(UL.N=FrontOfficeCore.netCreate({edited:()=>!!ulEdited()})); }
const ulV1On=()=>UL.v1==='ok';
/* probe 한 번(실패하면 1분 뒤 다시). → true면 v1, false면 KV 길 */
function ulV1(force){ if(!xfAvail()||!FrontOfficeCore.netEnabled()){ UL.v1='no'; return Promise.resolve(false); }
  if(UL.v1==='ok')return Promise.resolve(true); if(UL.v1==='probing'&&UL.v1p)return UL.v1p; if(!force&&UL.v1&&Date.now()-UL.v1at<60e3)return Promise.resolve(false);
  UL.v1='probing'; UL.v1at=Date.now(); return UL.v1p=ulNet().probe().then(s=>{ UL.v1=s==='ok'?'ok':'off'; return UL.v1==='ok'; },()=>{ UL.v1='off'; return false; }); }
/* 닉네임(래더 v4, 구단주 11-18 §1): 단장 이름(실명일 수 있음)은 쓰지 않는다. 직접 정한 닉네임이 없으면 '구단명#4자리 태그'(05_uladder_auto.js ulAutoNick) */
function ulNick(){ return ulAutoNick(); }
async function ulV1Player(){ const N=ulNet(); if(N.signedIn())return true; let r=await N.ensurePlayer(ulNick(),{wid:cupWid()}); if(!r.ok&&r.status===400)r=await N.ensurePlayer(FrontOfficeCore.ulAutoName('구단',ulTag()),{wid:cupWid()}); if(r.ok&&r.data&&r.data.token)ulLs(UL_NICK_K,ulLs(UL_NICK_K)||'auto'); return !!r.ok; }
/* 토큰이 서버에 없으면(관리자 삭제 등) 버리고 한 번 새로 만든다 */
async function ulV1Call(f){ let r=await f(); if(r.status===401){ ulNet().forget(); if(await ulV1Player())r=await f(); } return r; } /* 토큰만 버린다(못 보낸 결과 줄은 남김) */
/* 서버 확인 표는 세계·실제 전송 덱·자동 참가 상태를 함께 기억한다. 편집한 덱은 같은 접속에서도 다시 맞춘다. */
function ulV1DeckKey(U,e){ const d=U&&U.deck; e=e||(d&&d.e); return JSON.stringify([cupWid(),e?FrontOfficeCore.cupEntryHash(e):'',!!(d&&d.auto),!ulAutoOn(),ulAutoIntentKey()]); }
async function ulV1Sync(){ const U=uld(), N=ulNet(), C=FrontOfficeCore, tk=ulTok(); if(!U)return; if(ulEdited())return; /* 편집된 저장은 서버에 덱·결과를 보내지 않는다(22d_edited) */
  if(ulManualBlocked(U))return;
  if(ulAutoOn()&&U.ar&&U.ar.manual&&typeof ulManualRetry==='function')return await ulManualRetry();
  const key=ulV1DeckKey(U), intent=ulAutoIntentKey(); if(UL.v1sync===key)return;
  const prev=UL.v1wait; if(prev&&ulSame(prev.tk)){ await prev.p; if(ulSame(tk))return ulV1Sync(); return; } /* 같은 세계의 덱 쓰기를 순서대로 끝낸다 */
  const payload=U.deck?JSON.parse(JSON.stringify(U.deck.e)):null, auto=!!(U.deck&&U.deck.auto), wid=cupWid(); if(payload)payload.h=C.cupEntryHash(payload);
  const valid=()=>ulSame(tk)&&uld()===U&&ulV1DeckKey(U)===key, wait={tk,key,p:null}; UL.v1wait=wait;
  wait.p=(async()=>{ try{
    if(N.queue().length&&await ulV1Player()){ const f=await N.flush(); if(f.stop==='auth'){ N.forget(); N.authNeeded=false; if(await ulV1Player())await N.flush(); } }
    if(!valid())return;
    if(!ulAutoOn()){ if(ulLs(UL_OFFP_K)==='1')await ulAutoOffFlush(); if(valid()){UL.v1sync=key;UL.syncSt='done';} return; }
    if(U.ar&&U.ar.manual)return; /* 직접 재시도는 이 동기화가 끝난 뒤 man 표로 보냅니다. */
    if(!payload){ if(N.signedIn())await ulSvMe(true); if(valid())UL.v1sync=key; return; }
    if(!await ulAutoOnFlush()||!valid()||!(await ulV1Player())||!valid())return;
    let m=await ulV1Call(()=>N.me()); if(!valid()||!m.ok)return; let d=m.data, moved=false;
    if(!d.deck||d.deck.h!==payload.h){
      if(ulManualBlocked(U)||U.ar&&U.ar.manual)return; /* GET 중 추가된 직접 등록도 man 표 재시도를 기다립니다. */
      if(!ulAutoOn()){ UL.v1sync=key; UL.syncSt='done'; UL.sv.me=d; UL.sv.meSt='ok'; UL.sv.meAt=Date.now(); return; } /* 자동 참가를 끄면 서버 덱을 다시 만들지 않는다 */
      const r=await N.putDeck(payload,U.tier|0,wid,auto?{auto:1}:null); if(!valid())return;
      if(r.ok){ ulAutoOnDone(intent); if(auto){ const A=U.ar||(U.ar={}); A.h=payload.h; A.at=Date.now(); A.pend=0; } moved=!d.deck; const m2=await N.me(); if(!valid())return; if(m2.ok)d=m2.data; }
      else { if(r.status===409&&r.data&&r.data.error==='auto_off')ulAutoOffReply(intent); UL.syncSt='failed'; UL.syncErr=(r.data&&((r.data.errors&&r.data.errors[0])||r.data.message))||(r.offline?'연결 끊김':'HTTP '+r.status); return; }
    }
    if(!valid())return; ulAutoOnDone(intent); UL.v1sync=key; UL.syncSt='done'; UL.syncErr=''; UL.sv.me=d; UL.sv.meSt='ok'; UL.sv.meAt=Date.now(); UL.me=d.deck?{registered:true,name:d.deck.name,tier:d.entry.tier,v1:1}:null;
    if(!U.league&&d.entry&&(d.entry.tier|0)!==(U.tier|0)){ const was=U.tier|0; U.tier=d.entry.tier|0; ulSave(); ulSay(`${moved?'새 래더 서버로 옮겼습니다. ':''}서버 단계 ${C.ulTierName(U.tier)}로 맞췄습니다(이 기기 ${C.ulTierName(was)}).`); }
    else if(moved)ulSay(`새 래더 서버로 옮겼습니다. ${C.ulTierName(U.tier)} 단계 그대로입니다.`);
  }catch(e){} })().finally(()=>{ if(UL.v1wait===wait)UL.v1wait=null; });
  return wait.p; }
/* 순위 탭 자료: 내 시즌·라이벌(로그인), 순위표·소식(공개). 화면을 그릴 때 한 번씩만 받는다 */
async function ulSvMe(force){ const N=ulNet(), S=UL.sv, tk=ulTok(); if(!N.signedIn()||S.meSt==='loading'||(!force&&S.meSt&&Date.now()-(S.meAt||0)<60e3))return; S.meSt='loading'; S.meAt=Date.now();
  try{ const [m,rv]=await Promise.all([ulV1Call(()=>N.me()),N.rivals()]); if(!ulSame(tk))return; S.me=m.ok?m.data:null; S.rv=rv.ok?rv.data:null; S.meSt=m.ok?'ok':'err'; }catch(e){ S.meSt='err'; } try{ render(); }catch(e){} }
function ulSvBoard(t){ const S=UL.sv; if(S.board[t])return; S.board[t]={st:'loading'}; const sid=(S.me&&S.me.season&&S.me.season.id)||(ulNet().season&&ulNet().season.id)||0; if(t==='prev'&&sid<=1){ S.board[t]={st:'ok',rows:[],none:1}; return; } (t==='prev'?ulNet().leaderboard('all',sid-1):ulNet().leaderboard(t)).then(r=>{ S.board[t]=r.ok?Object.assign({st:'ok'},r.data):{st:'err'}; },()=>{ S.board[t]={st:'err'}; }).finally(()=>{ try{ render(); }catch(e){} }); }
function ulSvFeed(){ const S=UL.sv; if(S.feedSt)return; S.feedSt='loading'; ulNet().feed().then(r=>{ S.feed=r.ok?r.data.items||[]:null; S.feedSt=r.ok?'ok':'err'; },()=>{ S.feedSt='err'; }).finally(()=>{ try{ render(); }catch(e){} }); }
function ulSvH2h(pid){ const S=UL.sv; if(!pid||S.h2h[pid]||!ulNet().signedIn())return; S.h2h[pid]={st:'loading'}; ulNet().h2h(pid).then(r=>{ S.h2h[pid]=r.ok?Object.assign({st:'ok'},r.data):{st:'err'}; },()=>{ S.h2h[pid]={st:'err'}; }).finally(()=>{ try{ render(); }catch(e){} }); }
function ulSvStale(){ Object.assign(UL.sv,{meSt:'',board:{},feedSt:'',h2h:{},near:null,dk:{}}); }
/* 덱 구경(구단주 11-19 "랭킹에 뜬 상위 팀들 덱도 관전"): 순위표에서 고른 한 팀의 덱을 그때 한 번 받는다(서버 120초 캐시). 이 화면에서는 최근 UL_DK_MAX팀만 들고 있는다.
   예전 서버(덱 구경 없음)는 404·401 → '받지 못했습니다' 안내. 덱을 내렸거나 숨긴 유저도 404(not_found). 자기 단계 상위 50위 밖이면 404 not_top(구단주 11-19) */
const UL_DK_MAX=6;
function ulSvDeck(pid){ const S=UL.sv, D=S.dk||(S.dk={}); if(!pid||D[pid])return; const ks=Object.keys(D); if(ks.length>=UL_DK_MAX)delete D[ks[0]]; D[pid]={st:'loading'}; const tk=ulTok();
  ulNet().deckOf(pid).then(r=>{ if(!ulSame(tk))return; const d=r.ok&&r.data; D[pid]=d&&d.e&&Array.isArray(d.e.P)?Object.assign({st:'ok'},d):{st:'err',code:r.offline||!r.status?'off':r.status===404?(r.data&&r.data.error==='not_found'?'none':r.data&&r.data.error==='not_top'?'top':'old'):r.status===429?'busy':r.ok||r.status===401||r.status===405?'old':'err'}; },()=>{ if(ulSame(tk))D[pid]={st:'err',code:'off'}; }).finally(()=>{ if(ulSame(tk))try{ render(); }catch(e){} }); }
/* 내 순위 둘레: 내 단계 순위표(상위)에 내가 없을 때만 한 번 받는다. 예전 서버는 404 → 아무것도 안 보인다 */
function ulSvNear(){ const S=UL.sv; if(S.near||!ulNet().signedIn())return; S.near={st:'loading'}; const tk=ulTok(); ulNet().near().then(r=>{ if(!ulSame(tk))return; S.near=r.ok&&r.data&&Array.isArray(r.data.rows)?Object.assign({st:'ok'},r.data):{st:'err'}; },()=>{ if(ulSame(tk))S.near={st:'err'}; }).finally(()=>{ if(ulSame(tk))try{ render(); }catch(e){} }); }
const UL_DK_ERR={top:'상위 50위 안의 팀만 볼 수 있습니다. 이 팀은 지금 자기 단계 순위표(상위 50명) 밖입니다.',off:'연결이 끊겨 덱을 받지 못했습니다. 연결을 확인한 뒤 다시 눌러 주세요.',none:'이 팀은 지금 서버에 덱이 없습니다. 덱을 내렸거나 자동 참가를 끈 유저입니다.',old:'서버가 아직 덱 구경을 지원하지 않습니다. 잠시 뒤 새로 고친 다음 다시 눌러 주세요.',busy:'요청이 잦습니다. 잠시 뒤 다시 눌러 주세요.',err:'덱을 받지 못했습니다. 잠시 뒤 다시 눌러 주세요.'};
/* 덱 구경 칸: 닉네임·팀·단계·시즌 기록·OVR + 타순·선발·불펜·벤치(내 덱 화면과 같은 두 줄 칸 .ulp: 이름·OVR / 나이·손·주요 능력). 보기만 한다.
   nolink: 남의 덱 선수 이름이 내 세계의 같은 이름 선수 카드로 이어지지 않게(이름 자동 연결 끔) */
function ulBdDeckHtml(pid){ const C=FrontOfficeCore, S=UL.sv, D=(S.dk||{})[pid], back='<button class="btn small" data-a="ulBdDeck" data-v="">← 순위표로</button>';
  if(!D||D.st==='loading')return `<div class="ul-dv"><div class="btns">${back}</div><p class="small">덱을 받는 중입니다.</p></div>`;
  if(D.st!=='ok')return `<div class="ul-dv"><div class="btns">${back}<button class="btn small" data-a="ulBdDeckRe" data-v="${esc(pid)}">다시 받기</button></div><div class="note bad">${UL_DK_ERR[D.code]||UL_DK_ERR.err}</div></div>`;
  const E=D.entry, e=D.e, t=Math.max(0,Math.min(C.UL_TIERS.length-1,D.tier|0)), P=new Map(e.P.map(p=>[p.id,p])), O=D.ovr&&D.ovr.p!=null?D.ovr:e.ovr||D.ovr||null;
  const rv=(p,k)=>{ const v=p.r&&p.r[k]; return typeof v==='number'&&isFinite(v)?C.dv(v):'-'; };
  const rat=p=>p.isP?`구위 <b>${rv(p,'stf')}</b> · 제구 <b>${rv(p,'ctl')}</b> · 체력 <b>${rv(p,'sta')}</b>`:`컨택 <b>${rv(p,'con')}</b> · 파워 <b>${rv(p,'pow')}</b> · 선구 <b>${rv(p,'eye')}</b> · 주루 <b>${rv(p,'spd')}</b> · 수비 <b>${rv(p,'def')}</b>`;
  const row=(p,lab)=>{ if(!p)return ''; const f=cupFaceOf(p,e); return `<div class="ulp">${f?`<img class="dk-f" src="${esc(f)}" alt="" loading="lazy">`:'<span class="dk-f dk-f0"></span>'}<span class="ulp-l">${esc(lab)}</span><b class="ulp-n">${esc(p.name)}${p.foreign?' <span class="ul-k">외</span>':''}${p.injOut>0?' <span class="dk-x">부상</span>':''}</b><span class="dk-o num">${cupPOvr(p)}</span><span class="ulp-s small">${p.age?`${p.age|0}세 · `:''}${p.isP?`${esc(p.th||'우')}투`:`${esc(p.bt||'우')}타`} · ${rat(p)}</span></div>`; };
  const sec=(k,title,rows)=>rows.length?`<p class="dk-t">${title} <small>${rows.length}</small></p><div class="ulps" data-k="${k}">${rows.join('')}</div>`:'';
  const ln=(e.ln||[]).map(([id,pos],i)=>row(P.get(id),`${i+1} ${CUP_POSK[pos]||pos}`)).filter(Boolean), rot=(e.rot||[]).map((id,i)=>row(P.get(id),`선발${i+1}`)).filter(Boolean), pen=(e.pen||[]).map((id,i)=>row(P.get(id),cupPenRole(e,id,i))).filter(Boolean), bn=(e.bn||[]).map(id=>{ const q=P.get(id); return q?row(q,CUP_POSK[q.pos]||q.pos||'벤치'):''; }).filter(Boolean);
  return `<div class="ul-dv nolink"><div class="btns">${back}</div>
    <p class="ul-dv-h">${ulEmblem(t,26)}<b>${esc(D.name||e.name||'')}</b> <span class="ul-k ul-k-user">${esc(D.nickname||'')}</span></p>
    <div class="ul-sc ul-dv-sc"><div><span>OVR 총</span><b class="num">${O&&O.t!=null?O.t|0:'-'}</b></div><div><span>투수</span><b class="num">${O&&O.p!=null?O.p|0:'-'}</b></div><div><span>타자</span><b class="num">${O&&O.b!=null?O.b|0:'-'}</b></div><div><span>시즌 포인트</span><b class="num">${E&&E.leagues?E.points|0:'-'}</b></div></div>
    <p class="small ul-dv-s">${esc(C.ulTierName(t))}${E&&E.leagues?` · 이번 시즌 리그 <b class="num">${E.leagues|0}</b> · 우승 <b class="num">${E.wins|0}</b>`:' · 이번 시즌 마친 리그 없음'}${e.mgr&&e.mgr.name?` · 감독 ${esc(e.mgr.name)}`:''}${D.year?` · ${D.year|0}년 로스터`:''}${D.at?` · ${ulAgo(D.at)} 등록`:''}</p>
    ${sec('ln','타순',ln)}${sec('rot','선발',rot)}${sec('pen','불펜',pen)}${sec('bn','벤치',bn)}
    <p class="small muted">이 유저가 래더에 올린 덱입니다. 보기만 할 수 있습니다. 오른쪽 숫자는 선수 능력(OVR), 아래 줄은 주요 능력입니다.</p></div>`; }
/* 리그 결과 보내기: 상대 유저(pid 있는 팀)별 승패. 응답 단계를 내 단계로 쓴다. 끊기면 기기에 줄 세운다(연결부) */
/* 결과 보내기(외부 검수 11-17 P1): 먼저 기기 줄에 넣고(플레이어 만들기가 실패해도 남는다) → 플레이어·토큰 확인 → 앞 결과부터 차례로. 401이면 토큰을 다시 만들고 한 번 더 */
async function ulV1Result(L,res){ const N=ulNet(), U=uld(), tk=ulTok(); if(ulEdited())return; /* 편집된 저장의 리그 결과·기록실은 서버로 보내지 않는다 */ try{
    const opps=((res.rec&&res.rec.h2h)||[]).map(x=>({pid:L.teams[x.i]&&L.teams[x.i].pid,w:x.w,l:x.l,d:x.t})).filter(x=>x.pid), sum={key:L.nk||(cupWid()+'.'+L.id),rank:res.rank,teams:L.teams.length,w:res.w,l:res.l,d:res.t,opps}; if(res.ps&&res.ps.my)sum.ps=res.ps.my; try{ Object.assign(sum,ulLiveSt(L,res)); }catch(e){} /* 래더 v4 관리자 한눈 보기: 순위표·우승·준우승(결과 대조) */ try{ sum.rec=ulRecUp(L,res); }catch(e){} /* 3연전 리그(사용자 11-18): 포스트시즌 결과(우승·준우승 포인트) · 기록실 줄(팀 요약 + 우리 선수 상위, 1~2KB) */
    const stored=N.enqueue(sum);
    if(!(await ulV1Player())){ res.srv={queued:1,mem:stored?0:1}; if(ulSame(tk)){ ulSave(); render(); } return; }
    let r=await N.result(sum); if(!r.ok&&N.authNeeded){ N.forget(); N.authNeeded=false; if(await ulV1Player())r=await N.result(sum); }
    if(r.ok&&r.data){ const d=r.data; res.srv={tier:d.tier|0,delta:d.delta|0,points:d.points!=null?+d.points:(res.srv&&res.srv.points)||null,move:d.move,dup:!!d.dup}; if(d.points==null&&ulSame(tk))ulSvMe(true); /* 서버 값이 없으면 0으로 덮지 않고 다시 받는다(#39) */ if(!ulSame(tk))return; if(!U.league)U.tier=d.tier|0; ulSvStale(); ulSave(); }
    else if(r.queued){ res.srv={queued:1,mem:r.memOnly?1:0}; if(ulSame(tk))ulSave(); }
  }catch(e){} if(ulSame(tk))try{ render(); }catch(e){} }
/* 내 등록 상태(서버): v1이면 v1, 아니면 KV */
function ulProbe(){ if(UL.srv||!xfAvail()||!G)return; UL.srv='loading'; const tk=ulTok();
  ulV1().then(async ok=>{ if(!ulSame(tk))return; if(ok){ UL.srv='ok'; await ulV1Sync(); return; } if(!G.wid){ UL.srv='ok'; UL.me=null; return; } const {r,j}=await ulApi('/me/'+G.wid); if(!ulSame(tk))return; UL.srv=r.ok?'ok':'off'; UL.me=r.ok&&j.registered?j:null; })
    .catch(()=>{ if(ulSame(tk))UL.srv='off'; }).finally(()=>{ if(ulSame(tk))try{ render(); }catch(e){} }); }
/* 서버에 올리기(실패해도 이 기기 리그는 된다). v1이 되면 v1, 안 되면(꺼짐·연결 안 됨) KV */
/* 직접 등록은 전송 결과와 요청 날짜를 함께 돌려준다. 저장 칸·덱·참가 의사가 바뀐 응답은 아무 상태도 쓰지 않는다. */
function ulManualDay(d,at){ const t=d&&d.man_day; if(typeof t==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t)){ const n=Date.parse(t+'T00:00:00+09:00'); if(Number.isFinite(n))return FrontOfficeCore.ulDayId(n); } return FrontOfficeCore.ulDayId(at); }
async function ulUploadResult(now){ const U=uld(), tk=ulTok(), C=FrontOfficeCore; now=now??Date.now(); const result=(status,msg='',d=null)=>{const at=d&&Number.isFinite(+d.at)?+d.at:now;return {status,msg,at,day:ulManualDay(d,at)};};
  if(!U||!U.deck)return result('stale'); { const ed=ulEdited(); if(ed)return {...result('reject',ed),code:'edited'}; } if(!xfAvail()||!C.netEnabled())return result('offline');
  const payload=JSON.parse(JSON.stringify(U.deck.e)), key=ulV1DeckKey(U,payload), wid=cupWid(), tier=U.tier|0, N=ulNet(), intent=ulAutoIntentKey(); payload.h=C.cupEntryHash(payload);
  const valid=()=>ulSame(tk)&&uld()===U&&ulV1DeckKey(U)===key&&ulAutoIntentKey()===intent;
  if(!ulAutoOn())return result('localoff','자동 참가가 꺼져 있어 이 기기 덱만 등록했습니다.');
  const accept=d=>{ UL.me={registered:true,name:d.name||payload.name,tier:d.tier==null?tier:d.tier|0,ovr:d.ovr||payload.ovr,v1:1}; UL.srv='ok';UL.v1sync=key;UL.sv.meSt='';if(!U.league&&d.tier!=null)U.tier=d.tier|0;ulAutoOnDone(intent);return result('ok','',d); };
  try{ const v1=await ulV1(); if(!valid())return result('stale');
    if(v1){ if(!await ulAutoOnFlush())return valid()?result('fail'):result('stale');if(!valid())return result('stale');
      if(!await ulV1Player())return valid()?result('fail'):result('stale');if(!valid())return result('stale');
      const pending=UL.v1wait;if(pending&&ulSame(pending.tk))await pending.p;if(!valid())return result('stale');
      /* 응답 전에 저장 칸을 떠났거나 연결이 끊겼던 성공은 서버의 날짜·해시로 되찾는다. */
      const M=U.ar&&U.ar.manual;if(M&&M.h===payload.h){const m=await N.me();if(!valid())return result('stale');const d=m.data;
        if(m.ok&&d&&d.deck&&d.deck.h===M.h&&d.reg&&d.reg.man_day){const receipt=ulManualDay(d.reg,M.at),at=+(d.deck.at??d.reg.at);if(receipt===C.ulDayId(M.at)||Number.isFinite(at)&&at>=M.at&&receipt===C.ulDayId(at))return accept({...d.deck,man_day:d.reg.man_day,at:d.deck.at??d.reg.at});}}
      let q=await N.putDeck(payload,tier,wid,{man:1});if(!valid())return result('stale');
      if(q.status===401){N.forget();if(!await ulV1Player())return valid()?result('fail'):result('stale');if(!valid())return result('stale');q=await N.putDeck(payload,tier,wid,{man:1});if(!valid())return result('stale');}
      if(q.ok)return accept(q.data||{});
      const msg=(q.data&&((q.data.errors&&q.data.errors[0])||q.data.message||q.data.error))||('HTTP '+q.status);
      if(q.status>=400&&q.status<500&&![401,403,408].includes(q.status))return {...result('reject',msg,q.data),code:q.data&&q.data.error};
      UL.srv='off';return result('fail',msg);
    }
    if(!await ulAutoOnFlush())return valid()?result('fail'):result('stale');if(!valid())return result('stale');
    const {r,j}=await ulApi('/deck',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({wid,tier,e:payload,edited:!!ulEdited()})});if(!valid())return result('stale');
    if(r.ok){UL.me=Object.assign({registered:true},j);UL.srv='ok';ulAutoOnDone(intent);return result('ok','',j);}
    return result(r.status>=400&&r.status<500?'reject':'fail',(j&&((j.errors&&j.errors[0])||j.message))||('HTTP '+r.status),j);
  }catch(e){if(!valid())return result('stale');UL.srv='off';return result('fail');}
}
async function ulUpload(){return (await ulUploadResult()).status==='ok';}
function ulManualBlocked(U){const M=U&&U.ar&&U.ar.manualReject;return !!(M&&U.deck&&M.h===FrontOfficeCore.cupEntryHash(U.deck.e));}
function ulManualRemember(U,src,drop,at){const A=U.ar||(U.ar={});delete A.manualReject;A.drop=src==='now'?drop.slice(0,26):[];U.deck.auto=src==='now'?1:0;return A.manual={at,h:FrontOfficeCore.cupEntryHash(U.deck.e),src,drop:A.drop.slice()};}
function ulManualFinish(U,M,r){if(!U||!U.deck||!M||r.status==='stale')return;const A=U.ar||(U.ar={}),p={day:r.day,alb:ulAutoAlb(),x:U.deck.e};
  if(r.status==='ok'||r.status==='offline'){ulAutoManual(M.src,M.drop,r.at);A.man=r.day;ulAutoDone(p,r.status==='ok'?'ok':'same','',r.at,U);delete A.manual;delete A.manualReject;}
  else if(r.status==='localoff'){ulAutoDone(p,'same','',r.at,U);delete A.manual;delete A.manualReject;}
  else if(r.status==='fail'){ulAutoDone(p,'fail','',r.at,U);A.manual=M;}
  else{ulAutoDone(p,'reject',r.msg,r.at,U);delete A.manual;A.manualReject={h:M.h,day:r.day,msg:r.msg,code:r.code||''};if(r.code==='reg_wait')A.man=r.day;}
}
async function ulManualRetry(){const U=uld(),M=U&&U.ar&&U.ar.manual;if(!M||!U.deck)return '';if(M.h!==FrontOfficeCore.cupEntryHash(U.deck.e)){delete U.ar.manual;U.ar.pend=0;ulSave();return '';}
  if(ULA.busy||UL.busy)return 'wait';const tk=ulTok(),intent=ulAutoIntentKey(),work={tk,u:U};ULA.work=work;ULA.busy=true;ULA.last=Date.now();const r=await ulUploadResult();
  if(!ulSame(tk)||uld()!==U||ULA.work!==work)return 'stale';ULA.work=null;ULA.busy=false;if(intent!==ulAutoIntentKey()||r.status==='stale')return 'stale';ulManualFinish(U,M,r);ulSave();try{render();}catch(e){}return r.status;
}
function ulSrcEntry(src){ const name=FrontOfficeCore.cupName(UL.name||(uld()&&uld().deck&&uld().deck.e.name)||team(G.user).nick);
  if(src==='now'){ if(G.unemp)return null; return cupEntryNow({name}); }
  const x=cupAlbum().find(a=>'alb:'+a.id===src); if(!x)return null; const e=JSON.parse(JSON.stringify(x.e)); e.name=name; e.ovr=cupOvr(e); return e; }
/* 등록할 덱 = 고른 로스터 그대로(래더 연봉 상한 없음, 구단주 11-18: 예전 '선수 빼기'는 없앴다). {e, err} */
function ulRegEntry(){ const e=ulSrcEntry(UL.src); return e?{e,err:''}:{e:null,err:''}; }
const ulSrcOpts=()=>[['now','지금 1군'],...cupAlbum().slice().reverse().map(a=>['alb:'+a.id,`${a.y} ${a.k==='auto'?'시즌 종료':'직접 저장'}${a.e.res&&a.e.res.rank?` ${a.e.res.rank}위`:''} · OVR ${FrontOfficeCore.cupOvrTxt(a.e.ovr)}`])];
/* 리그 시작: 서버에서 같은 단계 덱 받기(한 번) → 가져온 우승 덱(이 기기·명예의 전당) → AI */
async function ulStart(){ const U=uld(), C=FrontOfficeCore, tk=ulTok(); if(!U||!U.deck||UL.busy)return; UL.busy=true; ulSay('같은 단계 덱을 받는 중입니다.');
  let fetched=[], avg=0, count=0, from='이 기기', net=false, kvn=0, srvOk=false; /* srvOk: 서버가 답했는지(채운 AI가 '덱 모자람'인지 '연결 안 됨'인지 나눈다, 외부 검수 11-17 #13) */
  if(await ulV1()){ try{ if(await ulV1Player()){ await ulV1Sync(); const r=await ulV1Call(()=>ulNet().opponents({n:9}));
      if(!ulSame(tk))return; if(r.ok&&r.data&&r.data.ok){ srvOk=true; const d=r.data; fetched=(d.decks||[]).map(x=>({e:x.e,pid:x.pid,nick:x.nickname})); avg=d.avg; count=d.near; kvn=d.kv|0; from='서버'; net=true; if(!U.league&&d.tier!=null)U.tier=d.tier|0; } } }catch(e){} }
  if(!net&&xfAvail()){ try{ const me=U.deck.e; const {r,j}=await ulApi(`/opp?wid=${encodeURIComponent(cupWid())}&tier=${U.tier|0}&ovr=${me.ovr?me.ovr.t:0}&n=9`); if(r.ok&&j.ok){ srvOk=true; fetched=(j.decks||[]).map(d=>d.e); avg=j.avg; count=j.count; from='서버'; } }catch(e){} }
  if(!ulSame(tk)||uld()!==U)return; /* 그사이 다른 저장 칸을 열었으면 버린다 */
  const cup=[...ulDecks().map(x=>x.e),...((HOF.data&&HOF.data.cups)||[]).map(c=>c.champ&&c.champ.deck).filter(Boolean)];
  UL.prog='AI 덱을 만드는 중입니다.'; render(); await new Promise(r=>setTimeout(r,20)); if(!ulSame(tk)||uld()!==U)return;
  try{ const r=ulMakeLeague({fetched,cup,avg,count}); UL.busy=false; UL.prog=''; if(!r.ok)return ulSay(r.msg,true); const s=r.league.src;
    if(net){ r.league.net=1; r.league.nk=`${cupWid()}.${r.league.id}.${Date.now().toString(36)}`; r.league.kvn=kvn; ulLive(r.league); } ulSave();
    ulRunClear();UL.feed=[]; ulGo('league'); ulSay(`${C.ulTierName(r.league.tier)} 리그를 시작했습니다. 상대: ${s.user?`${from} 유저 덱 ${s.user}개`:'유저 덱 없음'}${s.cup?` · 우승 덱 ${s.cup}개`:''}${s.ai?(srvOk||!xfAvail()?` · 등록 덱이 모자라 AI 구단 ${s.ai}팀이 채웠습니다`:` · 래더 서버에 연결하지 못해(오프라인·서버 오류) AI 구단 ${s.ai}팀이 채웠습니다`):''}.`); }
  catch(e){ console.error(e); UL.busy=false; UL.prog=''; ulSay('리그를 만들지 못했습니다.',true); } }
/* 연전 돌리기: 한 라운드 또는 끝까지(연전마다 화면을 돌려준다) */
/* 연전 결과 한 줄(진행 표시) */
function ulFeedLine(L,x){ const A=L.teams[x.a], B=L.teams[x.b], wa=x.g.filter(g=>g[0]>g[1]).length, wb=x.g.filter(g=>g[1]>g[0]).length, me=x.a===0||x.b===0;
  const hot=me?x.g.map(g=>g[3]?'끝내기':g[2]>9?`${g[2]}회 연장`:'').filter(Boolean)[0]:'';
  return {me,t:`${x.r}R ${A.name} ${wa}-${wb}${x.g.length-wa-wb?`(${x.g.length-wa-wb}무)`:''} ${B.name} · ${x.g.map(g=>g[0]+':'+g[1]).join(' ')}${hot?` · ${hot}!`:''}`}; }
/* all: true(끝까지) · 숫자 n(n라운드, 래더 v3 '3라운드') · 없으면 한 라운드 */
async function ulSim(all){ const U=uld(), L=U&&U.league, tk=ulTok(); if(!L||UL.busy)return;const run={u:U,l:L,tk};UL.runToken=run;UL.busy=true; UL.edit=null; if(UL.view&&UL.view.k==='lg')UL.view=null; const many=all===true||all>1, tick=()=>new Promise(r=>setTimeout(r,all===true?0:many?40:140));
  try{ const reg0=L.next<L.sched.length, r0=L.sched[L.next]&&L.sched[L.next].r, rEnd=all===true?99:r0+Math.max(1,all|0)-1; while(L.next<L.sched.length){if(!ulRunSame(run))return; const r=L.sched[L.next].r; if(r>rEnd)break; const x=await ulRunStep(run,()=>ulRunSeries(L));if(!ulRunSame(run))return; const f=ulFeedLine(L,x); if(f.me)UL.rv=x.id; if(!many||f.me){ UL.feed.unshift(f); UL.feed.length=Math.min(UL.feed.length,8); } UL.prog=`${r}/9라운드 · ${L.next}/${L.sched.length}연전`; render(); await tick(); if(!ulRunSame(run))return; }
    if(L.next>=L.sched.length){ /* 포스트시즌(사용자 11-18): 정규가 이번에 끝났으면 대진만 보여 주고 멈춘다('끝까지'는 그대로 이어서). 그 뒤 '다음 3연전'은 시리즈 하나씩 */
      if(reg0&&all!==true){await ulRunStep(run,()=>ulPostInit(L));if(!ulRunSame(run))return; ulLive(L); UL.prog=''; UL.busy=false; UI.it=UI.it||{}; UI.it[UL_LGK]='ps'; ulSay('정규 시즌이 끝났습니다. 1~4위가 포스트시즌에 나갑니다. 승강은 정규 순위로 정하고, 우승팀은 순위와 무관하게 승격합니다.'); return; }
      while(ulPostLeft(L)){if(!ulRunSame(run))return; const s=await ulRunStep(run,()=>ulRunPost(L));if(!ulRunSame(run))return;const f=ulPsFeed(L,s); UL.feed.unshift(f); UL.feed.length=Math.min(UL.feed.length,8); if(f.me)UL.rv=null; UL.prog=`포스트시즌 · ${L.post.next}/3시리즈`; if(all!==true)ulSay(f.t); render(); await tick(); if(!ulRunSame(run))return; if(all!==true)break; } }
    UL.prog=''; if(L.next>=L.sched.length&&!ulPostLeft(L)){const old=JSON.parse(JSON.stringify(U));UL.pending={run,u:old};let res;try{res=ulFinish();run.finished=res;if(!await ulRunWrite(run))return;}catch(e){if(ulRunSame(run)){for(const k of ['seas','seasons','hist','car','gl','tier','best','last','league','ps','opp']){if(Object.hasOwn(old,k))U[k]=old[k];else delete U[k];}U.league=L;delete run.finished;UL.pending=null;}throw e;}if(!ulRunSame(run))return;UL.pending=null;UL.busy=false; UL.opp=null; UL.bx=null; UL.reveal=res.id; setTimeout(()=>{ if(ulSame(tk)&&UL.reveal===res.id)UL.reveal=null; },2600); ulGo('league'); ulSay(`리그가 끝났습니다. ${res.rank}위 · ${res.move==='up'?`${FrontOfficeCore.ulTierName(res.to)} 승격`:res.move==='down'?`${FrontOfficeCore.ulTierName(res.to)} 강등`:`${FrontOfficeCore.ulTierName(res.to)} 잔류`}.`);
      if(L.net)ulLiveEnd(L); if(L.net||ulV1On())ulV1Result(L,res); else if(xfAvail()&&UL.me)ulKvTier(res); }
    else { UL.busy=false;ulLive(L); const id=UL.rv; render(); setTimeout(()=>{ if(ulSame(tk)&&U.league===L&&UL.rv===id)UL.rv=null; },1800); } }
  catch(e){ console.error(e); if(!ulRunSame(run))return;UL.pending=null; UL.busy=false; UL.prog='';ulSay(e.ulSave?e.message:'경기를 돌리지 못했습니다.',true); }finally{if(UL.runToken===run){UL.runToken=null;UL.pending=null;}} }
/* 포스트시즌 시리즈 한 줄 */
function ulPsFeed(L,s){ const A=L.teams[s.a], B=L.teams[s.b], wa=s.g.filter(g=>g[0]>g[1]).length, wb=s.g.filter(g=>g[1]>g[0]).length, lab=s.k==='f'?'결승':s.id==='SF1'?'준결승 1':'준결승 2';
  return {me:s.a===0||s.b===0,t:`${lab} ${A.name} ${wa}-${wb} ${B.name} · ${s.g.map(g=>g[0]+':'+g[1]).join(' ')} → ${L.teams[s.w].name} ${s.k==='f'?'우승!':'결승 진출'}`}; }
/* 진행 중 칸을 바꾸면 그 리그는 거기서 멈춘다(바뀐 칸은 이미 저장 쪽이 마무리, 여기서는 아무것도 쓰지 않는다) */
function ulSave0(){}
Object.assign(A,{
  ulSrc(v){ UL.src=v; render(); },
  ulPick(){ UL.pick=!UL.pick; render(); },
  async ulReg(){if(UL.busy||ULA.busy)return;const U=uld(),now=Date.now();if(!U)return;const el=document.getElementById('ulName');if(el)UL.name=el.value;const n=FrontOfficeCore.cupName(UL.name||team(G.user).nick);if(FrontOfficeCore.cupBadName(n))return ulSay('팀명에 쓸 수 없는 말이 들어 있습니다.',true);
    if(!FrontOfficeCore.ulManOk(U.ar,now))return ulSay(UL_MAN_WAIT,true);const R=ulRegEntry(),e=R.e;if(!e)return ulSay(R.err||'이 덱을 만들 수 없습니다(구단을 맡고 있을 때 지금 1군을 등록합니다).',true);
    const src=UL.src,drop=[],m=ulSetDeck(e,src);if(m)return ulSay(m,true);const M=ulManualRemember(U,src,drop,now),tk=ulTok(),intent=ulAutoIntentKey(),key=ulV1DeckKey(U);let tail='';
    if(U.league){ulEditDeck(U.deck.e);tail=' 진행 중인 리그에는 다음 연전부터 이 덱으로 나갑니다.';}ulSave();UL.busy=true;render();const r=await ulUploadResult(now);
    if(!ulSame(tk)||uld()!==U)return;UL.busy=false;if(key!==ulV1DeckKey(U)||intent!==ulAutoIntentKey()||r.status==='stale')return;ulManualFinish(U,M,r);ulSave();
    if(r.status==='ok'||r.status==='offline')ulSay(`${U.deck.e.name} 덱을 등록했습니다(OVR ${FrontOfficeCore.cupOvrTxt(U.deck.e.ovr)}).${r.status==='ok'?' 같은 단계 유저들이 이 덱을 상대로 만납니다.':''}${tail}`);
    else if(r.status==='localoff')ulSay(r.msg);else ulSay(r.status==='reject'?r.msg:'이 기기 덱은 등록했습니다. 서버에 연결되면 다시 올립니다.',true); },
  ulStart(){ return ulStart(); }, ulNext(){ return ulSim(false); }, ulAll(){ return ulSim(true); },
  ulEditOpen(){ const L=uld()&&uld().league; if(!L)return; UL.edit=JSON.parse(JSON.stringify(L.teams[0].e)); render(); },
  ulEditClose(){ UL.edit=null; render(); },
  ulLn(v,el){ const E=UL.edit; if(!E)return; const i=+el.dataset.i, id=+v, j=E.ln.findIndex(x=>x[0]===id); if(j>=0){ const t=E.ln[j][0]; E.ln[j][0]=E.ln[i][0]; E.ln[i][0]=t; } else { const old=E.ln[i][0]; E.ln[i][0]=id; E.bn=E.bn.filter(x=>x!==id); E.bn.push(old); } render(); },
  ulUp(v){ const E=UL.edit, i=+v; if(!E||i<=0)return; [E.ln[i-1],E.ln[i]]=[E.ln[i],E.ln[i-1]]; render(); },
  ulRot(v,el){ const E=UL.edit; if(!E)return; const i=+el.dataset.i, id=+v, j=E.rot.indexOf(id);
    if(j>=0){ [E.rot[i],E.rot[j]]=[E.rot[j],E.rot[i]]; } else { const old=E.rot[i]; E.rot[i]=id; E.pen=E.pen.filter(x=>x!==id); if(old!=null)E.pen.push(old); } render(); },
  ulBp(v,el){ const E=UL.edit; if(!E)return; const id=+el.dataset.i; E.bp=E.bp||{}; if(v==='auto')delete E.bp[id]; else { if(v==='cl')for(const k in E.bp)if(E.bp[k]==='cl')E.bp[k]='su'; E.bp[id]=v; } render(); },
  ulEditSave(){ const E=UL.edit; if(!E)return; const m=ulEditDeck(E); if(m)return ulSay(m,true); UL.edit=null; ulSave(); ulSay('덱을 고쳤습니다. 다음 연전부터 이 덱으로 나갑니다.'); },
  ulSwap(v){ const e=ulSrcEntry(v||UL.src); if(!e)return ulSay('이 덱을 만들 수 없습니다.',true); const L=uld().league; e.name=L.teams[0].name; UL.edit=JSON.parse(JSON.stringify(FrontOfficeCore.ulSlim(e))); ulSay(`${v==='now'?'지금 1군':'앨범 시즌'}을 불러왔습니다. '저장'을 누르면 다음 연전부터 나갑니다.`); },
  ulOpp(v){ UL.opp=UL.opp===+v?null:+v; render(); },
  ulKey(v,el){ const k=el&&el.dataset.k||'lg', i=+v; UL.view=UL.view&&UL.view.k===k&&UL.view.i===i?null:{k,i,tab:'log'}; render(); },
  ulKeyT(v){ if(UL.view){ UL.view.tab=v; render(); } },
  ulBoardT(v){ UL.sv.bt=v==='all'||v==='prev'?v:+v|0; UL.sv.dv=null; render(); },
  ulBdDeck(v){ const pid=/^p[0-9a-f]{16}$/.test(String(v||''))?String(v):null; UL.sv.dv=pid; if(pid)ulSvDeck(pid); render(); try{ const el=document.querySelector('.ul-bd'); if(el&&el.scrollIntoView)el.scrollIntoView({block:'nearest'}); }catch(e){} },
  ulBdDeckRe(v){ const D=UL.sv.dk||{}; delete D[v]; A.ulBdDeck(v); },
  ulSvRe(){ ulSvStale(); render(); },
  /* 서버 기록 지우기(개인정보: docs/privacy.md, 사용자 11-17): v1 플레이어 전부 + 이 세계의 예전 KV 덱. 이 기기에서는 서버 래더를 끈다(자동으로 다시 만들지 않게) */
  /* 두 서버(새 래더 서버 v1 · 예전 덱 서버 KV)를 따로 확인한다. 하나라도 실패하면 어느 쪽인지 알리고, 남은 지우기를 저장(uld().svDel)해 '남은 것 다시 지우기'로 이어 한다(외부 검수 11-17: 예전 서버가 503이어도 '지웠습니다'라고 하던 문제) */
  async ulSvDel(v){ if(UL.busy)return; const U=uld(), P0=U&&U.svDel, retry=v==='retry'&&P0;
    if(!retry&&!confirm('서버에 있는 내 래더 기록(닉네임·덱·시즌 기록·맞대결)을 지웁니다.'+(typeof clOn==='function'&&clOn()?' 클라우드 저장(올린 저장 본문)과 연결된 기기도 함께 지워집니다.':'')+' 되돌릴 수 없습니다. 이 기기의 리그 기록과 저장은 그대로 남습니다.'))return;
    const P=retry?{v1:!!P0.v1,kv:P0.kv||null}:{v1:true,kv:G&&G.wid?G.wid:null}; if(U){ U.svDel=Object.assign({},P); ulSave(); } /* 시작 전에 남겨 둔다: 도중에 창을 닫아도 다음에 이어 지운다 */
    UL.busy=true; render(); const C=FrontOfficeCore;
    if(P.v1){ try{ const r=await ulNet().deleteMe(); if(r&&(r.ok||r.status===401))P.v1=false; }catch(e){} }
    if(P.kv){ try{ const {r}=await ulApi('/deck/'+encodeURIComponent(P.kv),{method:'DELETE'}); if(r&&(r.ok||r.status===404))P.kv=null; }catch(e){} }
    UL.busy=false; const U2=uld();
    if(!P.v1){ try{ if(typeof clForgetAll==='function')clForgetAll(); }catch(e){} C.netSetEnabled(false); Object.assign(UL,{v1:'no',me:null,srv:'',v1sync:''}); ulSvStale(); UL.sv.me=null; UL.sv.rv=null; }
    if(!P.v1&&!P.kv){ if(U2){ delete U2.svDel; ulSave(); } return ulSay('서버 기록을 지웠습니다. 이 기기에서는 서버 래더를 껐습니다. 리그는 이 기기에서 그대로 할 수 있습니다.'); }
    if(U2){ U2.svDel=P; ulSave(); }
    ulSay(`서버 기록을 다 지우지 못했습니다. ${P.v1&&P.kv?'새 래더 서버와 예전 덱 서버 모두':P.v1?'새 래더 서버(닉네임·시즌 기록)':'예전 덱 서버(등록 덱)'}에 아직 남아 있습니다.${!P.v1?' 새 래더 서버 기록은 지웠습니다.':!P.kv&&G&&G.wid?' 예전 덱 서버 기록은 지웠습니다.':''} 잠시 뒤 '남은 서버 기록 다시 지우기'를 눌러 주세요.`,true); },
  ulReconnect(){ Object.assign(UL,{v1:'',v1at:0,srv:'',v1sync:'',tiersSt:'',meta:null,msg:''}); ulSvStale(); render(); }, /* 다시 연결(외부 검수 11-17 #12: 실패를 계속 들고 있지 않게) */
  ulKvRetry(){ const R=uld()&&uld().last; if(R)ulKvTier(R); },
  ulSvOn(){ FrontOfficeCore.netSetEnabled(true); Object.assign(UL,{v1:'',srv:'',v1sync:''}); ulSvStale(); ulSay('서버 래더를 다시 켰습니다. 덱이 있으면 서버에 올립니다.'); },
  ulQuit(){ const U=uld(); if(!U||!U.league)return; if(!confirm('이 리그를 그만둡니다. 기록과 승강 없이 지워집니다.'))return;const pending=ulLiveEnd(U.league);U.league=null;ulRunClear();UL.edit=null;UL.feed=[];ulSave();ulSay('리그를 그만두었습니다.'+(pending?' 서버의 진행 표시는 연결되면 종료됩니다.':'')); },
});
const UL_KIND={me:'내 덱',user:'유저',cup:'우승 덱',ai:'AI 구단'};
const ulKind=t=>t.nick?esc(t.nick):UL_KIND[t.kind]; /* 서버 v1 상대는 닉네임 */
/* 상대 유저와의 맞대결(서버 v1, 사용자 11-17): 우리가 그 덱에 도전한 기록 + 그 유저가 우리 덱에 도전한 기록 */
function ulH2hHtml(t){ if(!t||!t.pid||!ulV1On()||!ulNet().signedIn())return ''; ulSvH2h(t.pid); const H=UL.sv.h2h[t.pid];
  if(!H||H.st!=='ok')return `<p class="small muted">맞대결 기록을 ${H&&H.st==='err'?'받지 못했습니다':'받는 중입니다'}.</p>`;
  const f=x=>x&&x.n?`${x.n}경기 ${x.w}승 ${x.l}패${x.d?` ${x.d}무`:''}`:'아직 없음';
  return `<p class="small ul-hh">맞대결 · <b>${esc(H.nickname)}</b> · 우리가 도전 ${f(H.attack)} · 상대가 도전 ${f(H.defense)}</p>`; }
const ulDay=ms=>{ const d=new Date(ms+9*3600e3); return `${d.getUTCMonth()+1}.${d.getUTCDate()}`; };
const ulAgo=ms=>{ const m=Math.round((Date.now()-ms)/60000); return m<1?'방금':m<60?m+'분 전':m<1440?Math.round(m/60)+'시간 전':Math.round(m/1440)+'일 전'; };
/* 순위 탭(서버 v1, 사용자 11-17): 내 시즌 카드 · 단계별 순위표(50위, 유저 이름 → 덱 구경, 50위 밖이면 내 순위 둘레) · 최근 소식. v1에 연결되지 않으면 안내 한 칸 */
/* 서버 기록 지우기가 일부 실패해 남은 것(uld().svDel): 어느 서버인지 + 다시 지우기 */
function ulSvDelPendHtml(U){ const P=U&&U.svDel; if(!P||(!P.v1&&!P.kv))return ''; return `<div class="note bad ul-svdel">서버 기록 지우기가 끝나지 않았습니다: ${[P.v1?'새 래더 서버(닉네임·시즌 기록)':'',P.kv?'예전 덱 서버(등록 덱)':''].filter(Boolean).join(' · ')}에 남아 있습니다. <button class="btn small" data-a="ulSvDel" data-v="retry"${UL.busy?' disabled':''}>남은 서버 기록 다시 지우기</button></div>`; }
function ulRankHtml(U,msg){ const C=FrontOfficeCore, S=UL.sv; msg=ulSvDelPendHtml(U)+msg;
  if(!ulV1On()){ const off=xfAvail()&&!C.netEnabled(); return [`<section class="card"><h2 class="sec">순위</h2><p class="small muted">${!xfAvail()?'내려받은 게임에서는 서버 순위를 볼 수 없습니다.':off?'이 기기에서 새 래더 서버를 껐습니다. 리그는 그대로 할 수 있습니다.':UL.v1==='probing'?'래더 서버에 연결하는 중입니다.':'지금은 새 래더 서버에 연결할 수 없습니다. 리그는 이 기기에서 그대로 할 수 있습니다.'}</p>${off?'<div class="btns"><button class="btn" data-a="ulSvOn">서버 래더 다시 켜기</button></div>':xfAvail()&&UL.v1!=='probing'?'<div class="btns"><button class="btn" data-a="ulReconnect">다시 연결</button></div>':''}${msg}</section>`]; }
  const N=ulNet(); ulSvMe(); ulSvFeed(); const bt=S.bt!=null?S.bt:(U.tier|0); ulSvBoard(bt); const multi=bt==='all'||bt==='prev'; const M=S.me, E=M&&M.entry, mypid=(N.player()||{}).id;
  const rvL=(L,who)=>L&&L.length?`<p class="dk-t">${who}</p>${L.map(x=>`<p class="small">${esc(x.nickname)} <span class="muted">${x.n}경기</span> <b>${x.w}승 ${x.l}패${x.d?` ${x.d}무`:''}</b></p>`).join('')}`:'';
  const me=!N.signedIn()?'<p class="small muted">덱을 등록하면 서버 시즌 기록이 생깁니다.</p>':!E?`<p class="small muted">${S.meSt==='err'?'내 기록을 받지 못했습니다.':'내 기록을 받는 중입니다.'}</p>`:
    `<p class="ul-head"><span class="ul-tier ul-t${E.tier|0}">${C.ulTierName(E.tier)}</span> <b>${esc(M.player.nickname)}</b>${M.player.hidden?' <span class="pill">숨김</span>':''}</p>
    <div class="ul-sc"><div><span>시즌 포인트</span><b class="num">${E.points}</b></div><div><span>단계 순위</span><b class="num">${E.rank?E.rank+'위':'-'}</b></div><div><span>리그</span><b class="num">${E.leagues}</b></div><div><span>우승</span><b class="num">${E.wins}</b></div></div>
    <p class="small">시즌 ${M.season.id} · ${ulDay(M.season.starts)}~${ulDay(M.season.ends-1)} · 최고 ${C.ulTierName(E.best_tier)} · 승격 ${E.ups} · 강등 ${E.downs}</p>
    <p class="dk-t">칭호 <small>${(M.titles||[]).length}</small></p><div class="ul-bgs">${(M.titles||[]).map(t=>`<span class="ul-bg on">시즌 ${t.s} ${esc(C.ulTierName(t.tier))} ${t.rank}위</span>`).join('')||'<span class="small muted">시즌이 끝날 때 단계별 1~3위가 칭호를 받습니다.</span>'}</div>
    ${rvL(S.rv&&S.rv.attack,'라이벌 · 우리가 많이 만난 덱')}${rvL(S.rv&&S.rv.defense,'라이벌 · 우리 덱을 많이 만난 유저')}`;
  const card=`<section class="card"><h2 class="sec">내 시즌</h2>${me}<p class="small muted">시즌 포인트: 리그 1위 30 · 2위 24 … 10위 1. 많이 할수록 오릅니다. 단계 순위는 같은 단계 유저끼리 셉니다.</p>${msg}
    <div class="btns"><button class="btn small" data-a="ulSvRe">새로고침</button>${N.signedIn()?`<button class="btn small" data-a="ulSvDel"${UL.busy?' disabled':''}>서버 기록 지우기</button>`:''}</div></section>`;
  const B=S.board[bt], rows=B&&B.st==='ok'?B.rows||[]:null, cap=(B&&B.cap)|0||20; /* cap: 서버가 주는 순위표 길이(예전 서버는 20) */
  const ch=[...C.UL_TIERS.map((n,i)=>[i,n]),['all','전체'],['prev','지난 시즌']];
  const nkd=typeof ulNickDefault==='function'&&ulNickDefault(); /* 내 닉네임이 아직 자동 이름: 내 줄에 '닉네임 정하기'(05_uladder_auto.js) */
  /* 덱 보기 단추는 지금 시즌 순위표의 상위 cap위 안만(서버도 그 밖은 404 not_top). 내 순위 둘레의 cap위 밖·지난 시즌 줄은 그냥 글자 */
  const brow=x=>`<tr class="${x.pid===mypid?'me':''}"><td class="num">${x.rank}</td>${multi?`<td>${ulEmblem(x.tier,18)}</td>`:''}<td class="ul-lbn">${x.team&&x.pid&&bt!=='prev'&&x.rank<=cap?`<button class="lnk ul-bdn" data-a="ulBdDeck" data-v="${esc(x.pid)}" title="이 팀 덱 보기"><b>${esc(x.nickname)}</b></button>`:`<b>${esc(x.nickname)}</b>`}${x.pid===mypid?` <span class="ul-k ul-k-me">나</span>${nkd?' <button class="lnk ul-nkb" data-a="ulNickGo" title="순위표에 보일 닉네임을 정합니다">닉네임 정하기</button>':''}`:''} <span class="small muted">${esc(x.team||'덱 없음')}${x.ovr?` · OVR ${x.ovr|0}`:''}${!multi&&x.best_tier>bt?` · 최고 ${C.ulTierName(x.best_tier)}`:''}</span></td><td class="num">${x.points}</td><td class="num">${x.leagues}</td><td class="num">${x.wins|0}</td></tr>`;
  const bhead=`<tr><th>순위</th>${multi?'<th>단계</th>':''}<th class="ul-lbn">유저 · 팀${bt==='prev'?'':' <small class="muted">이름을 누르면 덱</small>'}</th><th>포인트</th><th>리그</th><th>우승</th></tr>`;
  /* 내 순위 둘레: 내 단계 순위표가 꽉 찼는데 내가 없으면(상위 밖) 내 위·아래 유저를 따로 보여 준다 */
  let nearH=''; if(rows&&!multi&&E&&E.rank&&bt===(E.tier|0)&&rows.length>=cap&&!rows.some(x=>x.pid===mypid)){ ulSvNear(); const NR=S.near; if(NR&&NR.st==='ok'&&NR.rows.length&&(NR.tier|0)===bt)nearH=`<p class="dk-t">내 순위 둘레 <small class="muted">덱은 상위 ${cap}위까지</small></p><table class="ul-st ul-lb">${bhead}${NR.rows.map(brow).join('')}</table>`; }
  const list=rows?rows.length?`<div class="ul-lbw"><table class="ul-st ul-lb">${bhead}${rows.map(brow).join('')}</table></div>${nearH}${rows.length<5&&bt!=='prev'?'<p class="small muted">아직 순위에 오른 유저가 적습니다. 리그를 하나 마치면 순위표에 오릅니다.</p>':''}`:`<p class="small muted">${bt==='prev'?'지난 시즌 기록이 없습니다.':'이번 시즌 여기에서 리그를 마친 유저가 아직 없습니다.'}</p>`:B&&B.st==='err'?'<div class="note bad">순위표를 받지 못했습니다. 연결을 확인한 뒤 새로고침을 눌러 주세요.</div><div class="btns"><button class="btn small" data-a="ulSvRe">새로고침</button></div>':'<p class="small">순위표를 받는 중입니다.</p>';
  const board=`<section class="card ul-bd"><h2 class="sec">순위표${S.dv?' <small>덱 구경</small>':''}</h2>${S.dv?ulBdDeckHtml(S.dv):`<div class="chips ul-bt">${ch.map(([k,n])=>`<button data-a="ulBoardT" data-v="${k}" class="${k===bt?'on':''}" aria-pressed="${k===bt}">${n}</button>`).join('')}</div>
    ${list}
    <p class="small muted">${bt==='all'?`이번 시즌 전체 상위 ${cap}명(높은 단계 먼저, 같은 단계는 포인트 순).`:bt==='prev'?`지난 시즌 최종 상위 ${cap}명.`:`이번 시즌 ${C.ulTierName(bt)} 단계 상위 ${cap}명(시즌 포인트 순).`}${bt==='prev'?'':` 유저 이름을 누르면 그 팀의 덱을 봅니다. 덱은 자기 단계 상위 ${cap}위 안의 팀만 볼 수 있습니다.`}</p>`}</section>`;
  const F=S.feed;
  const feed=`<section class="card"><h2 class="sec">최근 소식</h2>${F?F.length?`<div class="ul-news">${F.map(x=>`<p class="small"><b>${esc(x.nickname)}</b> ${x.kind==='season_top'?`시즌 ${x.season} ${esc(C.ulTierName(x.tier_to))} ${(x.info&&x.info.rank)||''}위`:x.kind==='crown'?'레전드 리그 우승!':`${esc(C.ulTierName(x.tier_from))} → <b class="ul-up">${esc(C.ulTierName(x.tier_to))}</b> 승격`} <span class="muted">${ulAgo(x.at)}</span></p>`).join('')}</div>`:'<p class="small muted">아직 소식이 없습니다.</p>':`<p class="small muted">${S.feedSt==='err'?'소식을 받지 못했습니다.':'소식을 받는 중입니다.'}</p>`}
    <p class="small muted">승격·레전드 우승·시즌 상위 소식입니다.</p></section>`;
  return [card,board,feed]; }
function ulStandHtml(L,st){ const n=L.teams.length; return `<table class="ul-st"><tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>차</th></tr>${st.map(x=>{ const t=L.teams[x.key]; return `${x.rank===n-1?'<tr class="ul-line dn"><td colspan="7">강등선 ▼ 9·10위</td></tr>':''}<tr class="${x.key===0?'me':''}${x.rank<=2?' up':x.rank>=L.teams.length-1?' dn':''}"><td class="num">${x.rank}</td><td><button class="lnk" data-a="ulOpp" data-v="${x.key}">${esc(t.name)}</button> <span class="ul-k ul-k-${t.kind}">${ulKind(t)}</span></td><td class="num">${x.w}</td><td class="num">${x.l}</td><td class="num">${x.t}</td><td class="num">${(x.w+x.l?x.w/(x.w+x.l):0).toFixed(3).replace(/^0/,'')}</td><td class="num">${x.gb?x.gb.toFixed(1):'-'}</td></tr>${x.rank===2?'<tr class="ul-line up"><td colspan="7">승격선 ▲ 1·2위</td></tr>':''}`; }).join('')}</table>
  <p class="small muted">1·2위 승격 · 9·10위 강등. 팀 이름을 누르면 덱을 봅니다.</p>`; }
/* 단계별 등록 덱 수(서버) */
function ulTiersLoad(){ if(UL.tiersSt||!xfAvail())return; UL.tiersSt='loading'; ulApi('/tiers').then(({r,j})=>{ UL.tiers=r.ok&&Array.isArray(j.counts)?j.counts:null; UL.tiersSt='ok'; },()=>{ UL.tiersSt='off'; }).finally(()=>{ try{ render(); }catch(e){} }); }
const UL_GUIDE=`<ol class="ul-guide"><li><b>내 덱 등록</b> 지금 1군이나 앨범의 지난 시즌 로스터를 덱으로 올립니다.</li><li><b>리그 시작</b> 같은 단계 덱 9개와 짝마다 3연전, 팀당 27경기를 치릅니다.</li><li><b>승격</b> 1·2위는 한 단계 위로, 9·10위는 아래로. 루키에서 레전드까지 올라갑니다.</li></ol>`;
/* 상대 덱 미리보기: 여섯 갈래 비교 막대(가운데 기준, 오른쪽이 상대 우위) + 한 줄 요약 */
function ulVsHtml(me,op,meSecond){ const V=ulVs(me,op,meSecond); if(!V)return ''; const bar=x=>{ const w=Math.min(50,Math.abs(x.d)*5); return `<div class="ul-vr"><span>${x.n}</span><b class="num">${x.me}</b><i class="ul-vb"><em class="${x.d>0?'op':'me'}" style="${x.d>0?'left:50%':'right:50%'};width:${w}%"></em></i><b class="num">${x.op}</b></div>`; };
  const t=(L,who)=>L.length?`${who} ${L.map(x=>`${x.n} +${Math.abs(x.d)}`).join(' · ')}`:'';
  const sum=[t(V.opBest,'상대 우위'),t(V.meBest,'우리 우위')].filter(Boolean).join(' / ')||'두 덱이 고르게 비슷합니다.';
  return `<div class="ul-vs"><div class="ul-vr ul-vh"><span></span><b>우리</b><i></i><b>상대</b></div>${V.rows.map(bar).join('')}<p class="small">${esc(sum)}</p></div>`; }
/* 명경기 칩 + 고른 경기 중계·박스·줄 점수(이 기기에 남긴 기록을 그대로 보여 준다) */
function ulKeysHtml(K,k){ if(!K||!K.length)return ''; const V=UL.view&&UL.view.k===k?UL.view:null, g=V&&K[V.i];
  const chip=(x,i)=>`<button data-a="ulKey" data-k="${k}" data-v="${i}" class="${V&&V.i===i?'on':''}" aria-pressed="${!!(V&&V.i===i)}"><b>${esc(x.tag)}</b> ${x.sa}:${x.sb} vs ${esc(x.opp)} <span class="muted">${x.r}R</span></button>`;
  return `<div class="ul-keys"><p class="dk-t">명경기 · 이 경기 보기</p><div class="chips">${K.map(chip).join('')}</div>${g?`<div class="ul-gv">${g.mvp?`<p class="small">경기 MVP ${esc(g.mvp)}</p>`:''}<div class="chips">${[['log','중계'],['line','점수'],['bat','타자'],['pit','투수']].map(([a,b])=>`<button data-a="ulKeyT" data-v="${a}" class="${V.tab===a?'on':''}">${b}</button>`).join('')}<button data-a="ulKey" data-k="${k}" data-v="${V.i}">닫기</button></div>${V.tab==='log'?`<pre class="ul-pre">${esc(g.log||'')}</pre>`:ulTabTbl(g[V.tab])}</div>`:''}</div>`; } /* 점수·타자·투수는 표로(래더 v3, 사용자 11-17) */
/* 리그 기록 카드(결과) */
function ulRecHtml(R){ const X=R.rec; if(!X)return ''; const C=FrontOfficeCore;
  const lead=X.lead.map(x=>`<div class="ul-rc${x.me?' me':''}"><span>${esc(x.k)}</span><b>${esc(x.name)}</b><em class="num">${esc(String(x.v))}</em><span class="small muted">${esc(x.team)}</span></div>`).join('');
  const h2h=X.h2h.slice().sort((a,b)=>(b.w-b.l)-(a.w-a.l)).map(x=>`<span class="ul-h2${x.w>x.l?' w':x.l>x.w?' l':''}">${esc(x.name)} ${x.w}-${x.l}${x.t?`-${x.t}`:''}</span>`).join('');
  const more=[X.streak>=3?`최다 연승 <b>${X.streak}</b>`:'',X.big?`최다 점수 차 승 <b>${X.big.sa}:${X.big.sb}</b> vs ${esc(X.big.opp)}`:'',X.nem?`천적 <b class="ul-dn">${esc(X.nem.name)}</b> ${X.nem.w}-${X.nem.l}`:'',X.prey?`싹쓸이 <b class="ul-up">${esc(X.prey.name)}</b> 3-0`:''].filter(Boolean).join(' · ');
  return `<section class="card"><h2 class="sec">리그 하이라이트</h2><p class="dk-t">리그 1위 기록</p><div class="ul-rcs">${lead}</div>
    ${more?`<p class="small">${more}</p>`:''}<p class="dk-t">상대별 전적(승-패)</p><div class="ul-h2s">${h2h}</div>${ulKeysHtml(R.keys,'res')}
    <p class="small muted">리그 점수 = 단계 × 100 + 아래에 둔 팀 수 × 10. ${C.ulTierName(R.tier)} ${R.rank}위는 ${R.pts}점입니다.</p></section>`; }
/* 덱 고치기: 타순(선수·순서), 선발 5, 불펜 역할 */
function ulEditHtml(){ const E=UL.edit, P=new Map(E.P.map(p=>[p.id,p])), C=FrontOfficeCore; const bats=E.P.filter(p=>!p.isP), pits=E.P.filter(p=>p.isP), O=p=>cupPOvr(p);
  const v=C.cupValidate(Object.assign({},E,{h:undefined}),{}); const ov=cupOvr(E);
  const ln=E.ln.map(([id,pos],i)=>`<div class="ul-er"><span class="dk-l">${i+1} ${CUP_POSK[pos]||pos}</span><select data-a="ulLn" data-i="${i}">${bats.map(p=>`<option value="${p.id}"${p.id===id?' selected':''}>${esc(p.name)} ${CUP_POSK[p.pos]||p.pos} ${O(p)}${p.injOut>0?' 부상':''}</option>`).join('')}</select>${i?`<button class="btn small" data-a="ulUp" data-v="${i}" title="한 칸 위로">▲</button>`:'<span></span>'}</div>`).join('');
  const rot=E.rot.map((id,i)=>`<div class="ul-er"><span class="dk-l">선발${i+1}</span><select data-a="ulRot" data-i="${i}">${pits.map(p=>`<option value="${p.id}"${p.id===id?' selected':''}>${esc(p.name)} ${O(p)}</option>`).join('')}</select><span></span></div>`).join('');
  const pen=E.pen.map((id,i)=>{ const p=P.get(id); if(!p)return ''; const k=(E.bp||{})[id]||'auto'; return `<div class="ul-er"><span class="dk-n">${esc(p.name)} ${O(p)}</span><select data-a="ulBp" data-i="${id}">${[['auto',`자동(${cupPenRole(Object.assign({},E,{bp:{}}),id,i)})`],['cl','마무리'],['su','필승조'],['mr','추격조'],['lr','롱릴리프']].map(([a,b])=>`<option value="${a}"${a===k?' selected':''}>${b}</option>`).join('')}</select><span></span></div>`; }).join('');
  return `<section class="card ul-edit"><h2 class="sec">덱 고치기</h2><p class="small">OVR 총 <b>${ov.t}</b> | 투 <b>${ov.p}</b> | 타 <b>${ov.b}</b> · 다음 연전부터 적용됩니다.</p>
    ${v.ok?'':`<div class="note bad">${esc(v.errors[0].msg)}</div>`}
    <div class="ul-ec"><div><p class="dk-t">타순</p>${ln}</div><div><p class="dk-t">선발</p>${rot}<p class="dk-t">불펜 역할</p>${pen}</div></div>
    <div class="btns"><button class="btn primary" data-a="ulEditSave"${v.ok?'':' disabled'}>저장</button><button class="btn" data-a="ulEditClose">취소</button></div>
    <p class="small muted">통째로 바꾸기</p><div class="btns">${ulSrcOpts().slice(0,6).map(([k,l])=>`<button class="btn small" data-a="ulSwap" data-v="${esc(k)}">${esc(l)}</button>`).join('')}</div></section>`; }
/* 배지: 기록으로 정해지는 칭호(본게임 영향 없음). 받은 배지는 밝게 */
function ulBadgeHtml(U){ const B=FrontOfficeCore.ulBadges(U.hist,U.car); return `<p class="dk-t">배지 <small>${B.filter(x=>x.on).length}/${B.length}</small></p><div class="ul-bgs">${B.map(x=>`<span class="ul-bg${x.on?' on':''}" title="${esc(x.d)}">${esc(x.n)}</span>`).join('')}</div>`; }
/* 이번 리그로 새로 받은 배지(결과 화면) */
function ulNewBadges(U){ const C=FrontOfficeCore, a=C.ulBadges(U.hist,U.car), nb=U.last&&U.last.nbg, b=nb?null:C.ulBadges(U.hist.slice(0,-1)), n=a.filter((x,i)=>x.on&&(nb?nb.includes(x.k):!b[i].on)); return n.length?`<p class="ul-newb">새 배지 ${n.map(x=>`<span class="ul-bg on" title="${esc(x.d)}">${esc(x.n)}</span>`).join(' ')}</p>`:''; }
function ulSeasonsHtml(U){ const C=FrontOfficeCore, L=[...(U.seasons||[]),...(U.seas?[U.seas]:[])].slice(-6).reverse(); if(!L.length)return '';
  return `<p class="dk-t">시즌 기록</p>${L.map(x=>`<p class="small">${esc(x.label)} · 최고 <b>${C.ulTierName(x.best)}</b> · 최고 점수 <b class="num">${x.top}</b> · ${x.n}리그${x.win?` · 우승 ${x.win}`:''}${x.up?` · 승격 ${x.up}`:''}</p>`).join('')}`; }
/* 화면(페이지 짜기)은 02_uladder_pages.js의 ulView(래더 v2, 사용자 11-17) */
