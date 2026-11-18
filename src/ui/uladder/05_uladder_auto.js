/* ===== 래더 v4 자동 등록 화면 쪽(구단주 11-18, docs/design/ladder-v4-2026-11-18.md §1) =====
   - 등록 단추 없이: 게임을 켜 두면 1분마다 살펴보고(그날 처음·날짜 넘김·시즌 종료·못 보낸 것) 지금 1군이 바뀌었으면 서버에 올린다. 플레이어(익명 토큰)는 클라우드 저장과 같은 것을 조용히 만든다.
   - 이름: 직접 정한 닉네임이 없으면 '구단명#4자리 태그'(태그는 기기마다 한 번 crypto로 정한다). 예전에 단장 이름으로 만든 플레이어는 처음 한 번 자동 이름으로 바꾼다.
   - 처음 한 번 안내. 설정 › 래더: '자동 참가 끄기'(끄면 서버 덱·진행 중 리그 지움), 닉네임 바꾸기(하루 1회), '지금 덱으로 다시 등록'(하루 1회).
   - 연결이 끊기면 기다렸다가(5분마다) 다시, 서버가 없으면(정적 호스팅·내려받은 게임·v1 꺼짐) 이 기기 덱만 바꾸고 아무 오류도 내지 않는다.
   - 자동화 점검(navigator.webdriver)에서는 UI.ulAutoTest를 켠 점검만 돈다(다른 점검의 '덱 없음' 화면을 바꾸지 않게). 본게임 난수(Math.random)는 쓰지 않는다 */
const UL_AUTO_K='fo-ul-auto', UL_SEEN_K='fo-ul-auto-seen', UL_TAG_K='fo-ul-tag', UL_NICK_K='fo-ul-nick', UL_OFFP_K='fo-ul-auto-offp', UL_ONP_K='fo-ul-auto-onp', UL_INTENT_K='fo-ul-auto-intent';
const UL_MAN_WAIT='직접 다시 등록은 하루에 한 번입니다. 내일 다시 하거나, 자동 갱신(하루 한 번)을 기다려 주세요.';
const UL_AUTO_NOTE='래더에 자동 참가합니다(구단 1군 스냅샷·구단명만 올라갑니다). 설정 › 래더에서 끌 수 있습니다.';
const ULA={busy:false,msg:'',bad:false,last:0,notice:0};
function ulLs(k,v){ try{ if(v===undefined)return localStorage.getItem(k); if(v===null)localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} return null; }
const ulAutoOn=()=>ulLs(UL_AUTO_K)!=='0';
/* 참가 의사는 기기 공통으로 보존합니다. 'deck'은 켜기 확인 뒤 덱 반영을 기다리는 상태입니다. */
const ulAutoPending=()=>ulAutoOn()?(ulLs(UL_ONP_K)?'on':''):(ulLs(UL_OFFP_K)==='1'?'off':'');
const ulAutoIntentKey=()=>String(ulLs(UL_INTENT_K)||'0')+':'+(ulAutoOn()?'1':'0');
function ulAutoIntent(on){ ulLs(UL_INTENT_K,String(Math.max(Date.now(),(+ulLs(UL_INTENT_K)||0)+1))); ulLs(UL_AUTO_K,on?null:'0'); ulLs(UL_OFFP_K,on?null:'1'); ulLs(UL_ONP_K,on?'1':null); UL.v1sync=''; }
function ulAutoOnDone(key){ if(ulAutoOn()&&key===ulAutoIntentKey())ulLs(UL_ONP_K,null); }
/* 옛 요청의 auto_off 응답은 새 켜기 의사를 뒤집지 않습니다. */
function ulAutoOffReply(key){ if(key!==ulAutoIntentKey()||!ulAutoOn())return false; if(ulAutoPending()==='on'){ ulLs(UL_ONP_K,'1'); return false; } ulAutoIntent(false); ulLs(UL_OFFP_K,null); return true; }
let ulOnWait=null;
async function ulAutoOnFlush(){ if(!ulAutoOn())return false; if(!ulLs(UL_ONP_K)||ulLs(UL_ONP_K)==='deck')return true;
  const key=ulAutoIntentKey(); if(ulOnWait&&ulOnWait.key===key)return ulOnWait.p;
  const valid=()=>ulAutoOn()&&key===ulAutoIntentKey(), wait={key,p:null}; ulOnWait=wait;
  wait.p=(async()=>{ try{ if(!xfAvail()||!FrontOfficeCore.netEnabled()||!await ulV1()||!valid()||!await ulV1Player()||!valid())return false;
    const r=await ulV1Call(()=>ulNet().autoSet(true)); if(!valid()){if(!ulAutoOn())ulLs(UL_OFFP_K,'1');return false;} if(r.ok){ulLs(UL_ONP_K,'deck');return true;} return false;
  }catch(e){return false;} })().finally(()=>{if(ulOnWait===wait)ulOnWait=null;}); return wait.p; }

function ulTag(){ let t=ulLs(UL_TAG_K); if(t&&/^\d{4}$/.test(t))return t; try{ const a=new Uint16Array(1); crypto.getRandomValues(a); t=String(a[0]%10000).padStart(4,'0'); }catch(e){ t=String(Date.now()%10000).padStart(4,'0'); } ulLs(UL_TAG_K,t); return t; }
function ulClubName(){ try{ return G&&!G.unemp&&G.user!=null&&team(G.user)?tfull(G.user):''; }catch(e){ return ''; } }
function ulAutoNick(){ return FrontOfficeCore.ulAutoName(ulClubName(),ulTag()); }
const ulNickSet=()=>ulLs(UL_NICK_K)==='set';
function ulAutoSay(m,bad){ ULA.msg=m||''; ULA.bad=!!bad; try{ render(); }catch(e){} }
/* 예전 플레이어(단장 이름으로 만든 것)를 처음 한 번 자동 이름으로. 직접 정한 닉네임은 그대로 */
async function ulAutoRename(){ const N=ulNet(); if(!N.signedIn()||ulNickSet())return; const want=ulAutoNick(), p=N.player()||{}, now=Date.now();
  if(p.nickname===want){ ulLs(UL_NICK_K,'auto'); ULA.nickErr=''; return; }
  if(ULA.nickBusy||ULA.nickWant===want&&now-ULA.nickTry<300e3)return;
  const tk=ulTok(); ULA.nickBusy=true; ULA.nickWant=want; ULA.nickTry=now;
  try{ const r=await N.rename(want); if(!ulSame(tk)||ulNickSet()||ulAutoNick()!==want)return;
    if(r&&r.ok){ ulLs(UL_NICK_K,'auto'); ULA.nickErr=''; ULA.nickTry=0; ulSvStale(); }
    else ULA.nickErr=r&&r.status===429?'닉네임은 하루에 한 번 바꿀 수 있습니다. 변경 가능해지면 자동 이름을 다시 반영합니다.':r&&r.data&&r.data.message||'서버 닉네임 변경을 기다리고 있습니다. 연결되면 다시 시도합니다.';
  }catch(e){ if(ulSame(tk))ULA.nickErr='서버 닉네임 변경을 기다리고 있습니다. 연결되면 다시 시도합니다.'; }
  finally{ ULA.nickBusy=false; } }
/* 한 번 살펴보기. force: 날짜와 상관없이(다시 켜기). → 'ok'|'same'|'local'|'fail'|'reject'|건너뜀 이유 */
async function ulAutoTick(force){ if(ULA.busy||!G||UI.title)return ''; try{ if(navigator.webdriver&&!UI.ulAutoTest)return ''; }catch(e){}
  const start=ulTok(); if(ulLs(UL_OFFP_K)==='1')await ulAutoOffFlush();
  try{ if(typeof ulLiveFlush==='function')await ulLiveFlush(); }catch(e){}
  if(!ulSame(start)||ULA.busy||!ulAutoOn())return ''; const intent=ulAutoIntentKey(), now=Date.now(), U=uld(); if(!U)return '';
  if(ulAutoPending()==='on'&&!await ulAutoOnFlush())return 'fail'; if(!ulSame(start)||intent!==ulAutoIntentKey()||ULA.busy)return '';
  const rename=async()=>{if(xfAvail()&&FrontOfficeCore.netEnabled()&&ulNet().signedIn())await ulAutoRename();return ulSame(start)&&intent===ulAutoIntentKey()&&!ULA.busy;};
  if(U.ar&&U.ar.manual&&typeof ulManualRetry==='function'){if(!await rename())return '';return await ulManualRetry();}
  /* 앨범은 자동으로 바꾸지 않고, 다시 켜기로 지웠던 동일 덱만 복원합니다. 실패하면 다음 갱신 때 재시도합니다. */
  if(ulAutoPending()==='on'&&U.deck&&U.deck.src&&U.deck.src!=='now'){ if(!await rename())return '';if(ulManualBlocked(U)){ulAutoOnDone(intent);return 'reject';}await ulV1Sync(); return ulSame(start)&&!ulAutoPending()?'ok':'fail'; }
  if(G.unemp)return '';
  if(U.ar&&U.ar.pend&&!force&&now-ULA.last<300e3)return 'wait';
  const p=ulAutoPlan(now,force); if(!p||p.skip||!p.due){if(p&&p.skip==='roster')ulSave();if(!await rename())return '';return (p&&p.skip)||'';}
  ULA.last=now; if(!ulLs(UL_SEEN_K)){ ulLs(UL_SEEN_K,'1'); ULA.notice=1; try{ toast(UL_AUTO_NOTE); }catch(e){} }
  if(!p.upload){ if(!await rename())return '';ulAutoDone(p,'same'); ulSave(); return 'same'; }
  if(!xfAvail()||!FrontOfficeCore.netEnabled()){ ulAutoDone(p,'same'); ulSave(); return 'local'; }
  const work={tk:start,u:U}; ULA.work=work; ULA.busy=true; const tk=start, wid=cupWid(), payload=JSON.parse(JSON.stringify(p.x)), ack=ulV1DeckKey(U,payload);
  const valid=()=>ulSame(tk)&&uld()===U&&intent===ulAutoIntentKey()&&ulAutoOn()&&ULA.work===work; let res='fail', msg='';
  try{ const ok=await ulV1();
    if(!valid()){}
    else if(!ok)res=ulNet().status==='off'?'same':'fail';
    else if(!(await ulV1Player()))res='fail';
    else if(valid()){ await ulAutoRename(); if(valid()&&await ulAutoOnFlush()&&valid()){ const r=await ulV1Call(()=>ulNet().putDeck(payload,U.tier|0,wid,{auto:1}));
      if(!valid()){}
      else if(r.ok){ res='ok'; ulAutoOnDone(intent); const d=r.data; UL.me={registered:true,name:d.name,tier:d.tier|0,ovr:d.ovr,v1:1}; UL.srv='ok'; UL.v1sync=ack; UL.sv.meSt=''; if(!U.league&&(U.tier|0)!==(d.tier|0))U.tier=d.tier|0; }
      else if(r.status===409&&r.data&&r.data.error==='auto_off'){ const off=ulAutoOffReply(intent); res=off?'reject':'fail'; msg=off?'다른 기기에서 자동 참가를 껐습니다.':''; }
      else if(r.status>=400&&r.status<500&&![401,403,408,429].includes(r.status)){ res='reject'; msg=(r.data&&((r.data.errors&&r.data.errors[0])||r.data.message))||('HTTP '+r.status); }
      else res='fail'; } } }
  catch(e){ res='fail'; }
  if(ULA.work!==work||!ulSame(tk))return res; ULA.work=null; ULA.busy=false; if(intent!==ulAutoIntentKey()&&res!=='reject')return res;
  ulAutoDone(p,res,msg); ulSave(); try{ render(); }catch(e){} return res; }
/* 끄기를 서버에 알리기(끊겨 있었으면 다음에). 토큰이 없으면 서버에 덱도 없다 */
async function ulAutoOffFlush(){ if(ulAutoOn()||ulLs(UL_OFFP_K)!=='1')return !ulAutoOn(); const N=ulNet(), key=ulAutoIntentKey(), tk=ulTok();
  const valid=()=>!ulAutoOn()&&key===ulAutoIntentKey(); if(!N.signedIn()){ if(valid())ulLs(UL_OFFP_K,null); return valid(); } if(!xfAvail())return false;
  const r=await N.autoSet(false); if(!valid()){if(ulAutoOn()){ulLs(UL_ONP_K,'1');UL.v1sync='';}return false;} if(r.ok||r.status===401||r.off){ ulLs(UL_OFFP_K,null); if(r.ok&&ulSame(tk)){ UL.me=null; UL.sv.meSt=''; } return true; } return false; }
/* 진행 중 리그 한 줄(관리자 한눈 보기): 라운드·포스트시즌마다 덮어쓴다. 실패해도 그만 */
/* 진행 보고는 리그를 처음 보낸 플레이어에 고정합니다. 종료 대기는 저장 칸과 별도로 남겨 연결 복구 때 보냅니다. */
const UL_LIVE_END_K='fo-ul-live-end';
const ULL={mem:null,busy:null,rev:0};
function ulLiveQueue(){ try{ const q=ULL.mem||JSON.parse(ulLs(UL_LIVE_END_K)||'[]'); return Array.isArray(q)?q.filter(x=>x&&typeof x.pid==='string'&&/^[\w.:-]{4,64}$/.test(x.key)):[]; }catch(e){ return []; } }
function ulLiveQueueSet(f){ const q=f(ulLiveQueue()).slice(-60); try{ if(q.length)localStorage.setItem(UL_LIVE_END_K,JSON.stringify(q)); else localStorage.removeItem(UL_LIVE_END_K); ULL.mem=null; }catch(e){ ULL.mem=q; } }
const ulLiveRevision=()=>ULL.rev=Math.max(Date.now()*1024,ULL.rev+1);
function ulLivePhase(L){ const post=!!L.post, done=post?Math.max(0,Math.min(3,L.post.next|0)):0;
  return {stage:post?['semi-ready','semi-one-done','final-ready','complete'][done]:L.next>=L.sched.length?'regular-done':'regular',postDone:done,postTotal:3}; }
function ulLive(L){ try{ const N=ulNet(), U=uld(), pid=(N.player()||{}).id;
  if(!L||!L.net||!L.nk||!U||U.league!==L||!ulV1On()||!N.signedIn()||!pid||!ulAutoOn()||L.livePid&&L.livePid!==pid||ulLiveQueue().some(x=>x.pid===pid&&x.key===L.nk))return;
  if(!L.livePid)L.livePid=pid; if(!L.liveOpened){ const n=parseInt(String(L.nk).split('.').pop(),36); L.liveOpened=Number.isSafeInteger(n)&&n>1e12&&n<=Date.now()+300e3?n:Date.now(); }
  const st=ulStand(L), done=L.next>0&&L.sched[L.next-1]?L.sched[L.next-1].r:0;
  N.live(Object.assign({key:L.nk,tier:L.tier|0,round:done,post:L.post?1:0,opened:L.liveOpened,revision:ulLiveRevision(),teams:L.teams.map(t=>[t.name,t.pid||null,t.kind]),st:st.map(x=>[L.teams[x.key].name,x.w,x.l,x.t,L.teams[x.key].kind])},ulLivePhase(L))).catch(()=>{});
  }catch(e){} }
function ulLiveEnd(L){ try{ if(!L||!L.net||!L.nk)return false; const pid=L.livePid||(ulNet().player()||{}).id; if(!pid)return false;
  ulLiveQueueSet(q=>q.some(x=>x.pid===pid&&x.key===L.nk)?q:q.concat([{pid,key:L.nk}])); ulLiveFlush().catch(()=>{}); return true;
  }catch(e){ return false; } }
function ulLiveFlush(){ if(ULL.busy)return ULL.busy; const p=(async()=>{ try{ const N=ulNet(); if(!xfAvail()||!FrontOfficeCore.netEnabled()||!N.signedIn())return;
    const pid=(N.player()||{}).id; if(!pid)return; for(const x of ulLiveQueue().filter(x=>x.pid===pid)){
      if(!N.signedIn()||(N.player()||{}).id!==pid)return; const r=await N.live({key:x.key,ended:1});
      if(r&&r.ok)ulLiveQueueSet(q=>q.filter(a=>a.pid!==x.pid||a.key!==x.key)); else return;
    } }catch(e){} })(); ULL.busy=p; p.finally(()=>{ if(ULL.busy===p)ULL.busy=null; }); return p; }
function ulLiveSt(L,res){ return {st:(res.stand||[]).map(x=>[x.name,x.w,x.l,x.t,x.kind]),champ:res.ps?res.ps.champN:undefined,runner:res.ps?res.ps.runnerN:undefined}; }
const ulAgoS=ms=>!ms?'':typeof ulAgo==='function'?ulAgo(ms):'';
/* 설정 › 래더 */
function ulAutoCard(){ const U=G&&uld(), A=(U&&U.ar)||{}, on=ulAutoOn(), pending=ulAutoPending(), C=FrontOfficeCore, cg=U&&U.deck?C.ulCapGate(U.deck.e,U.tier|0,Date.now()):null;
  const roster=on&&!(G&&G.unemp)&&U&&(!U.deck||U.deck.src==='now')&&A.rosterErr;
  const st=pending==='off'?'꺼져 있습니다. 서버 참가 중지·덱 삭제를 기다리고 있습니다.':pending==='on'?'서버 참가 설정·덱 반영을 기다리고 있습니다.':!on?'꺼져 있습니다. 서버 참가 중지와 덱 삭제를 반영했습니다. 이 기기 래더 리그는 그대로 할 수 있습니다.':G&&G.unemp?'지금은 맡은 구단이 없어 자동 등록을 쉽니다.':U&&U.deck&&U.deck.src!=='now'?'앨범 시즌 덱을 직접 등록해 자동 갱신을 멈췄습니다. 아래 \'지금 덱으로 다시 등록\'을 누르면 다시 이어집니다.':roster?`현재 1군 자동 갱신을 보류했습니다. ${U.deck?'기존 등록 덱을 유지합니다.':'1군 명단을 확인해 주세요.'}`:A.pend?'연결이 끊겨 기다리는 중입니다. 연결되면 바로 올립니다.':A.localAt&&A.localAt>=(A.at||0)?`이 기기 덱으로 등록했습니다 · ${ulAgoS(A.localAt)}(서버에 올릴 수 없는 판이거나 바뀐 것이 없습니다).`:A.at?`마지막 갱신 ${ulAgoS(A.at)} · ${U&&U.deck?esc(U.deck.e.name)+' OVR '+C.cupOvrTxt(U.deck.e.ovr):''}`:A.day?'이 기기 덱으로 등록했습니다(서버에 올릴 수 없는 판이거나 바뀐 것이 없습니다).':'곧 등록합니다(게임을 켜 두면 1분 안에).';
  return `<section class="card ul-auto"><h2 class="sec">래더 자동 참가</h2><div class="chips">${[['1','켜기'],['0','자동 참가 끄기']].map(([v,l])=>`<button data-a="ulAutoSet" data-v="${v}" class="${(on?'1':'0')===v?'on':''}" aria-pressed="${(on?'1':'0')===v}"${ULA.busy?' disabled':''}>${l}</button>`).join('')}</div>
    <p class="small keep">${st}</p>${on&&cg&&!cg.ok?`<div class="note bad">상한 초과: ${esc(cg.msg)} 덱은 등록되지만 이 단계 리그에는 나가지 못합니다. 래더 › 덱에서 선수를 빼 맞출 수 있습니다.</div>`:''}${roster?`<div class="note bad">${esc(roster)}</div>`:on&&!pending&&A.err?`<div class="note bad">${esc(A.err)}</div>`:''}
    <p class="small muted">커리어 구단 1군 26명을 래더 덱으로 자동 등록합니다. 하루 한 번(그날 처음 켜거나 날짜를 넘길 때)과 시즌이 끝날 때, 바뀐 경우에만 올립니다. 올라가는 것은 구단 1군 스냅샷(선수 이름·능력치·연봉)과 구단명·닉네임뿐이며 단장 이름은 올리지 않습니다. 끄면 서버의 내 덱을 지웁니다.</p>${ULA.notice?`<p class="small ul-auto-new">${esc(UL_AUTO_NOTE)}</p>`:''}${ULA.msg&&ULA.msg!==roster?`<div class="note${ULA.bad?' bad':''}" role="status">${esc(ULA.msg)}</div>`:''}</section>`; }
function ulNickCard(){ const N=ulNet(), p=N.signedIn()?N.player():null, set=ulNickSet(), want=ulAutoNick(), show=p&&p.nickname||want, pending=!set&&p&&p.nickname!==want;
  return `<section class="card ul-nick"><h2 class="sec">래더 닉네임</h2><p class="ul-nick-now"><b>${esc(show)}</b> <span class="small muted">${set?'직접 정한 닉네임':p?'서버에 반영된 자동 이름':'자동 이름(구단명#태그)'}</span></p>
    ${pending?`<p class="small keep" role="status">자동 이름 ${esc(want)}의 서버 반영을 기다리고 있습니다.${ULA.nickErr?' '+esc(ULA.nickErr):''}</p>`:''}
    <label class="cup-in"><span>새 닉네임(2~12자)</span><input id="ulNickIn" maxlength="12" autocomplete="off" placeholder="${esc(want)}"></label>
    <div class="btns"><button class="btn small" data-a="ulNickSave"${ULA.busy?' disabled':''}>닉네임 저장</button>${set?`<button class="btn small" data-a="ulNickAuto"${ULA.busy?' disabled':''}>자동 이름으로</button>`:''}</div>
    <p class="small muted">닉네임을 정하지 않으면 '구단명#4자리 태그'로 보입니다. 순위표·소식·상대 목록에 나오며, 하루에 한 번 바꿀 수 있습니다.</p></section>`; }
function ulAutoNowCard(){ const U=G&&uld(), ok=FrontOfficeCore.ulManOk(U&&U.ar,Date.now());
  return `<section class="card"><h2 class="sec">지금 덱으로 다시 등록</h2><p class="small">자동 갱신을 기다리지 않고 지금 1군을 바로 올립니다. 하루에 한 번 할 수 있습니다.</p>
    <div class="btns"><button class="btn small primary" data-a="ulAutoNow"${ULA.busy||!ok||(G&&G.unemp)?' disabled':''}>${ok?'지금 덱으로 다시 등록':'오늘은 이미 다시 등록했습니다'}</button><button class="btn small" data-a="go" data-v="uld:deck">래더 › 덱 보기</button></div>
    <p class="small muted">서버에 있는 래더 기록 전부(닉네임·덱·시즌 기록)를 지우려면 래더 › 순위의 '서버 기록 지우기'를 씁니다. 처리 방침: 개인정보 처리방침의 '래더 자동 참가'.</p></section>`; }
Object.assign(A,{
  async ulAutoSet(v){ if(ULA.busy)return; const on=v==='1'; if(on===ulAutoOn())return;
    if(!on&&!confirm('래더 자동 참가를 끕니다. 서버에 있는 내 래더 덱을 지우고, 다른 유저의 리그 상대로 나가지 않습니다. 이 기기 래더 리그와 시즌 기록은 그대로입니다.'))return;
    ulAutoIntent(on); const key=ulAutoIntentKey(), tk=ulTok(), U=uld(), work={tk,u:U}; ULA.work=work; ULA.busy=true; render(); let ok=false;
    try{ok=on?await ulAutoOnFlush():await ulAutoOffFlush();}catch(e){}
    if(!ulSame(tk)||ULA.work!==work)return; ULA.work=null; ULA.busy=false; if(key!==ulAutoIntentKey())return;
    if(!on)return ulAutoSay(ok?'자동 참가를 껐습니다. 서버의 래더 덱을 지웠습니다.':'자동 참가를 껐습니다. 서버에 연결되면 래더 덱을 지웁니다.');
    if(!ok)return ulAutoSay('자동 참가 켜기를 예약했습니다. 서버에 연결되면 참가 설정을 확인한 뒤 덱을 올립니다.');
    if(U&&U.ar)U.ar.h=''; const r=await ulAutoTick(true); if(!ulSame(tk)||key!==ulAutoIntentKey())return;
    return ulAutoSay(r==='reject'&&U&&U.ar&&U.ar.manualReject?'자동 참가를 켰습니다. 서버 덱 등록은 보류합니다: '+U.ar.manualReject.msg:r==='ok'?'자동 참가를 켰습니다. 등록한 덱을 서버에 올렸습니다.':ulAutoPending()?'자동 참가를 켰습니다. 서버에 연결되면 등록한 덱을 올립니다.':'자동 참가를 켰습니다.'); },
  async ulNickSave(){ if(ULA.busy)return; const el=document.getElementById('ulNickIn'), C=FrontOfficeCore, n=C.cupName((el&&el.value)||'');
    if([...n].length<2||C.cupBadName(n))return ulAutoSay('닉네임은 2~12자, 쓸 수 없는 말 없이 적어 주세요.',true);
    if(!xfAvail())return ulAutoSay('내려받은 게임에서는 서버 닉네임을 바꿀 수 없습니다.',true);
    ULA.busy=true; render(); let r=null; try{ if(await ulV1()&&await ulV1Player())r=await ulNet().rename(n); }catch(e){} ULA.busy=false;
    if(r&&r.ok){ ulLs(UL_NICK_K,'set'); ulSvStale(); return ulAutoSay(`닉네임을 ${n}(으)로 바꿨습니다.`); }
    ulAutoSay(r&&r.data&&r.data.message?r.data.message:'지금은 래더 서버에 연결할 수 없습니다. 잠시 뒤 다시 해 주세요.',true); },
  async ulNickAuto(){ if(ULA.busy)return; ULA.busy=true; render(); let r=null; try{ if(await ulV1()&&await ulV1Player())r=await ulNet().rename(ulAutoNick()); }catch(e){} ULA.busy=false;
    if(r&&r.ok){ ulLs(UL_NICK_K,'auto'); ulSvStale(); return ulAutoSay(`자동 이름 ${ulAutoNick()}(으)로 되돌렸습니다.`); } ulAutoSay(r&&r.data&&r.data.message?r.data.message:'지금은 래더 서버에 연결할 수 없습니다.',true); },
  async ulAutoNow(){if(ULA.busy||UL.busy||!G||G.unemp)return;const U=uld(),now=Date.now();if(!FrontOfficeCore.ulManOk(U.ar,now))return ulAutoSay(UL_MAN_WAIT,true);
    const p=ulAutoPlan(now,true,{src:'now'});if(!p||p.skip)return ulAutoSay(p&&p.msg||'구단을 맡고 있을 때 지금 1군을 등록합니다.',true);
    const M=ulManualRemember(U,'now',(U.ar&&U.ar.drop)||[],now),tk=ulTok(),intent=ulAutoIntentKey(),key=ulV1DeckKey(U),work={tk,u:U};ULA.work=work;ULA.busy=true;UL.msg='';UL.bad=false;ulSave();render();const r=await ulUploadResult(now);
    if(!ulSame(tk)||uld()!==U||ULA.work!==work)return;ULA.work=null;ULA.busy=false;if(key!==ulV1DeckKey(U)||intent!==ulAutoIntentKey()||r.status==='stale')return;ulManualFinish(U,M,r);ulSave();
    if(r.status==='ok'||r.status==='offline')return ulAutoSay(`${U.deck.e.name} 덱을 다시 등록했습니다(OVR ${FrontOfficeCore.cupOvrTxt(U.deck.e.ovr)}).${p.cap?' 연봉 상한을 넘어 이 단계 리그에는 나가지 못합니다.':''}`,!!p.cap);
    if(r.status==='localoff')return ulAutoSay(r.msg);ulAutoSay(r.status==='reject'?r.msg:'서버에 올리지 못했습니다. 연결되면 자동으로 다시 올립니다.',true); },
});
try{ setInterval(()=>{ ulAutoTick().catch(()=>{}); },60e3); setTimeout(()=>{ ulAutoTick().catch(()=>{}); },5e3);
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible')ulAutoTick().catch(()=>{}); }); }catch(e){}
