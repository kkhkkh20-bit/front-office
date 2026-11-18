/* ===== 래더 v4 자동 등록 화면 쪽(구단주 11-18, docs/design/ladder-v4-2026-11-18.md §1) =====
   - 등록 단추 없이: 게임을 켜 두면 1분마다 살펴보고(그날 처음·날짜 넘김·시즌 종료·못 보낸 것) 지금 1군이 바뀌었으면 서버에 올린다. 플레이어(익명 토큰)는 클라우드 저장과 같은 것을 조용히 만든다.
   - 이름: 직접 정한 닉네임이 없으면 '구단명#4자리 태그'(태그는 기기마다 한 번 crypto로 정한다). 예전에 단장 이름으로 만든 플레이어는 처음 한 번 자동 이름으로 바꾼다.
   - 처음 한 번 안내. 설정 › 래더: '자동 참가 끄기'(끄면 서버 덱·진행 중 리그 지움), 닉네임 바꾸기(하루 1회), '지금 덱으로 다시 등록'(하루 1회).
   - 연결이 끊기면 기다렸다가(5분마다) 다시, 서버가 없으면(정적 호스팅·내려받은 게임·v1 꺼짐) 이 기기 덱만 바꾸고 아무 오류도 내지 않는다.
   - 자동화 점검(navigator.webdriver)에서는 UI.ulAutoTest를 켠 점검만 돈다(다른 점검의 '덱 없음' 화면을 바꾸지 않게). 본게임 난수(Math.random)는 쓰지 않는다 */
const UL_AUTO_K='fo-ul-auto', UL_SEEN_K='fo-ul-auto-seen', UL_TAG_K='fo-ul-tag', UL_NICK_K='fo-ul-nick', UL_OFFP_K='fo-ul-auto-offp';
const UL_MAN_WAIT='직접 다시 등록은 하루에 한 번입니다. 내일 다시 하거나, 자동 갱신(하루 한 번)을 기다려 주세요.';
const UL_AUTO_NOTE='래더에 자동 참가합니다(구단 1군 스냅샷·구단명만 올라갑니다). 설정 › 래더에서 끌 수 있습니다.';
const ULA={busy:false,msg:'',bad:false,last:0,notice:0};
function ulLs(k,v){ try{ if(v===undefined)return localStorage.getItem(k); if(v===null)localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} return null; }
const ulAutoOn=()=>ulLs(UL_AUTO_K)!=='0';
function ulTag(){ let t=ulLs(UL_TAG_K); if(t&&/^\d{4}$/.test(t))return t; try{ const a=new Uint16Array(1); crypto.getRandomValues(a); t=String(a[0]%10000).padStart(4,'0'); }catch(e){ t=String(Date.now()%10000).padStart(4,'0'); } ulLs(UL_TAG_K,t); return t; }
function ulClubName(){ try{ return G&&!G.unemp&&G.user!=null&&team(G.user)?tfull(G.user):''; }catch(e){ return ''; } }
function ulAutoNick(){ return FrontOfficeCore.ulAutoName(ulClubName(),ulTag()); }
const ulNickSet=()=>ulLs(UL_NICK_K)==='set';
function ulAutoSay(m,bad){ ULA.msg=m||''; ULA.bad=!!bad; try{ render(); }catch(e){} }
/* 예전 플레이어(단장 이름으로 만든 것)를 처음 한 번 자동 이름으로. 직접 정한 닉네임은 그대로 */
async function ulAutoRename(){ const N=ulNet(); if(!N.signedIn()||ulLs(UL_NICK_K))return; const want=ulAutoNick(), p=N.player()||{};
  if(p.nickname===want){ ulLs(UL_NICK_K,'auto'); return; } const r=await N.rename(want); if(r.ok||r.status===400)ulLs(UL_NICK_K,'auto'); }
/* 한 번 살펴보기. force: 날짜와 상관없이(다시 켜기). → 'ok'|'same'|'local'|'fail'|'reject'|건너뜀 이유 */
async function ulAutoTick(force){ if(ULA.busy||!G||UI.title)return ''; try{ if(navigator.webdriver&&!UI.ulAutoTest)return ''; }catch(e){}
  if(ulLs(UL_OFFP_K)==='1')await ulAutoOffFlush();
  if(!ulAutoOn()||G.unemp)return ''; const now=Date.now(), U=uld(); if(!U)return '';
  if(U.ar&&U.ar.pend&&!force&&now-ULA.last<300e3)return 'wait'; /* 연결이 끊겨 못 보낸 것: 5분마다 다시 */
  const p=ulAutoPlan(now,force); if(!p||p.skip||!p.due)return (p&&p.skip)||'';
  ULA.last=now; if(!ulLs(UL_SEEN_K)){ ulLs(UL_SEEN_K,'1'); ULA.notice=1; try{ toast(UL_AUTO_NOTE); }catch(e){} }
  if(!p.upload){ ulAutoDone(p,'same'); ulSave(); return 'same'; }
  if(!xfAvail()||!FrontOfficeCore.netEnabled()){ ulAutoDone(p,'same'); ulSave(); return 'local'; } /* 서버 없는 판·이 기기에서 서버 래더를 끔: 이 기기 덱만 */
  ULA.busy=true; const tk=ulTok(); let res='fail', msg='';
  try{ const ok=await ulV1();
    if(!ok)res=ulNet().status==='off'?'same':'fail'; /* v1이 꺼진 서버(503 not_configured)는 오류 없이 오늘은 끝 */
    else if(!(await ulV1Player()))res='fail';
    else { await ulAutoRename(); const r=await ulV1Call(()=>ulNet().putDeck(p.x,U.tier|0,cupWid(),{auto:1}));
      if(r.ok){ res='ok'; const d=r.data; if(ulSame(tk)){ UL.me={registered:true,name:d.name,tier:d.tier|0,ovr:d.ovr,v1:1}; UL.srv='ok'; UL.v1sync=cupWid(); UL.sv.meSt=''; if(!U.league&&(U.tier|0)!==(d.tier|0))U.tier=d.tier|0; } }
      else if(r.status===409&&r.data&&r.data.error==='auto_off'){ ulLs(UL_AUTO_K,'0'); res='reject'; msg='다른 기기에서 자동 참가를 껐습니다.'; }
      else if(r.status>=400&&r.status<500&&![401,403,408,429].includes(r.status)){ res='reject'; msg=(r.data&&((r.data.errors&&r.data.errors[0])||r.data.message))||('HTTP '+r.status); }
      else res='fail'; } }
  catch(e){ res='fail'; }
  ULA.busy=false; if(!ulSame(tk))return res; ulAutoDone(p,res,msg); ulSave(); try{ render(); }catch(e){} return res; }
/* 끄기를 서버에 알리기(끊겨 있었으면 다음에). 토큰이 없으면 서버에 덱도 없다 */
async function ulAutoOffFlush(){ const N=ulNet(); if(!N.signedIn()){ ulLs(UL_OFFP_K,null); return true; } if(!xfAvail())return false;
  const r=await N.autoSet(false); if(r.ok||r.status===401||r.off){ ulLs(UL_OFFP_K,null); if(r.ok){ UL.me=null; UL.sv.meSt=''; } return true; } ulLs(UL_OFFP_K,'1'); return false; }
/* 진행 중 리그 한 줄(관리자 한눈 보기): 라운드·포스트시즌마다 덮어쓴다. 실패해도 그만 */
function ulLive(L){ try{ if(!L||!L.net||!L.nk||!ulV1On()||!ulNet().signedIn())return; const st=ulStand(L), done=L.next>0&&L.sched[L.next-1]?L.sched[L.next-1].r:0;
  ulNet().live({key:L.nk,tier:L.tier|0,round:done,post:L.post?1:0,teams:L.teams.map(t=>[t.name,t.pid||null,t.kind]),st:st.map(x=>[L.teams[x.key].name,x.w,x.l,x.t,L.teams[x.key].kind])}).catch(()=>{}); }catch(e){} }
/* 결과에 붙일 순위표·우승·준우승(서버 결과 대조) */
function ulLiveSt(L,res){ return {st:(res.stand||[]).map(x=>[x.name,x.w,x.l,x.t,x.kind]),champ:res.ps?res.ps.champN:undefined,runner:res.ps?res.ps.runnerN:undefined}; }
const ulAgoS=ms=>!ms?'':typeof ulAgo==='function'?ulAgo(ms):'';
/* 설정 › 래더 */
function ulAutoCard(){ const U=G&&uld(), A=(U&&U.ar)||{}, on=ulAutoOn(), C=FrontOfficeCore, cg=U&&U.deck?C.ulCapGate(U.deck.e,U.tier|0,Date.now()):null;
  const st=!on?'꺼져 있습니다. 서버의 래더 덱은 지웠고, 이 기기 래더 리그는 그대로 할 수 있습니다.':G.unemp?'지금은 맡은 구단이 없어 자동 등록을 쉽니다.':U&&U.deck&&U.deck.src!=='now'?'앨범 시즌 덱을 직접 등록해 자동 갱신을 멈췄습니다. 아래 \'지금 덱으로 다시 등록\'을 누르면 다시 이어집니다.':A.pend?'연결이 끊겨 기다리는 중입니다. 연결되면 바로 올립니다.':A.at?`마지막 갱신 ${ulAgoS(A.at)} · ${U&&U.deck?esc(U.deck.e.name)+' OVR '+C.cupOvrTxt(U.deck.e.ovr):''}`:A.day?'이 기기 덱으로 등록했습니다(서버에 올릴 수 없는 판이거나 바뀐 것이 없습니다).':'곧 등록합니다(게임을 켜 두면 1분 안에).';
  return `<section class="card ul-auto"><h2 class="sec">래더 자동 참가</h2><div class="chips">${[['1','켜기'],['0','자동 참가 끄기']].map(([v,l])=>`<button data-a="ulAutoSet" data-v="${v}" class="${(on?'1':'0')===v?'on':''}" aria-pressed="${(on?'1':'0')===v}"${ULA.busy?' disabled':''}>${l}</button>`).join('')}</div>
    <p class="small">${st}</p>${on&&cg&&!cg.ok?`<div class="note bad">상한 초과: ${esc(cg.msg)} 덱은 등록되지만 이 단계 리그에는 나가지 못합니다. 래더 › 덱에서 선수를 빼 맞출 수 있습니다.</div>`:''}${on&&A.err?`<div class="note bad">${esc(A.err)}</div>`:''}
    <p class="small muted">커리어 구단 1군 26명을 래더 덱으로 자동 등록합니다. 하루 한 번(그날 처음 켜거나 날짜를 넘길 때)과 시즌이 끝날 때, 바뀐 경우에만 올립니다. 올라가는 것은 구단 1군 스냅샷(선수 이름·능력치·연봉)과 구단명·닉네임뿐이며 단장 이름은 올리지 않습니다. 끄면 서버의 내 덱을 지웁니다.</p>${ULA.notice?`<p class="small ul-auto-new">${esc(UL_AUTO_NOTE)}</p>`:''}${ULA.msg?`<div class="note${ULA.bad?' bad':''}" role="status">${esc(ULA.msg)}</div>`:''}</section>`; }
function ulNickCard(){ const N=ulNet(), p=N.signedIn()?N.player():null, set=ulNickSet(), show=set&&p?p.nickname:ulAutoNick();
  return `<section class="card ul-nick"><h2 class="sec">래더 닉네임</h2><p class="ul-nick-now"><b>${esc(show)}</b> <span class="small muted">${set?'직접 정한 닉네임':'자동 이름(구단명#태그)'}</span></p>
    <label class="cup-in"><span>새 닉네임(2~12자)</span><input id="ulNickIn" maxlength="12" autocomplete="off" placeholder="${esc(ulAutoNick())}"></label>
    <div class="btns"><button class="btn small" data-a="ulNickSave"${ULA.busy?' disabled':''}>닉네임 저장</button>${set?`<button class="btn small" data-a="ulNickAuto"${ULA.busy?' disabled':''}>자동 이름으로</button>`:''}</div>
    <p class="small muted">닉네임을 정하지 않으면 '구단명#4자리 태그'로 보입니다. 순위표·소식·상대 목록에 나오며, 하루에 한 번 바꿀 수 있습니다.</p></section>`; }
function ulAutoNowCard(){ const U=G&&uld(), ok=FrontOfficeCore.ulManOk(U&&U.ar,Date.now());
  return `<section class="card"><h2 class="sec">지금 덱으로 다시 등록</h2><p class="small">자동 갱신을 기다리지 않고 지금 1군을 바로 올립니다. 하루에 한 번 할 수 있습니다.</p>
    <div class="btns"><button class="btn small primary" data-a="ulAutoNow"${ULA.busy||!ok||(G&&G.unemp)?' disabled':''}>${ok?'지금 덱으로 다시 등록':'오늘은 이미 다시 등록했습니다'}</button><button class="btn small" data-a="go" data-v="uld:deck">래더 › 덱 보기</button></div>
    <p class="small muted">서버에 있는 래더 기록 전부(닉네임·덱·시즌 기록)를 지우려면 래더 › 순위의 '서버 기록 지우기'를 씁니다. 처리 방침: 개인정보 처리방침의 '래더 자동 참가'.</p></section>`; }
Object.assign(A,{
  async ulAutoSet(v){ if(ULA.busy)return; const on=v==='1'; if(on===ulAutoOn())return;
    if(on){ ulLs(UL_AUTO_K,null); ulLs(UL_OFFP_K,null); ULA.busy=true; render(); try{ if(xfAvail()&&ulNet().signedIn()&&FrontOfficeCore.netEnabled())await ulNet().autoSet(true); }catch(e){} ULA.busy=false; const U=uld(); if(U&&U.ar)U.ar.h=''; const r=await ulAutoTick(true);
      return ulAutoSay(r==='ok'?'자동 참가를 켰습니다. 지금 1군을 래더 덱으로 올렸습니다.':r==='fail'?'자동 참가를 켰습니다. 연결되면 지금 1군을 올립니다.':'자동 참가를 켰습니다.'); }
    if(!confirm('래더 자동 참가를 끕니다. 서버에 있는 내 래더 덱을 지우고, 다른 유저의 리그 상대로 나가지 않습니다. 이 기기 래더 리그와 시즌 기록은 그대로입니다.'))return;
    ulLs(UL_AUTO_K,'0'); ulLs(UL_OFFP_K,'1'); ULA.busy=true; render(); let ok=false; try{ ok=await ulAutoOffFlush(); }catch(e){} ULA.busy=false;
    ulAutoSay(ok?'자동 참가를 껐습니다. 서버의 래더 덱을 지웠습니다.':'자동 참가를 껐습니다. 서버에 연결되면 래더 덱을 지웁니다.'); },
  async ulNickSave(){ if(ULA.busy)return; const el=document.getElementById('ulNickIn'), C=FrontOfficeCore, n=C.cupName((el&&el.value)||'');
    if([...n].length<2||C.cupBadName(n))return ulAutoSay('닉네임은 2~12자, 쓸 수 없는 말 없이 적어 주세요.',true);
    if(!xfAvail())return ulAutoSay('내려받은 게임에서는 서버 닉네임을 바꿀 수 없습니다.',true);
    ULA.busy=true; render(); let r=null; try{ if(await ulV1()&&await ulV1Player())r=await ulNet().rename(n); }catch(e){} ULA.busy=false;
    if(r&&r.ok){ ulLs(UL_NICK_K,'set'); ulSvStale(); return ulAutoSay(`닉네임을 ${n}(으)로 바꿨습니다.`); }
    ulAutoSay(r&&r.data&&r.data.message?r.data.message:'지금은 래더 서버에 연결할 수 없습니다. 잠시 뒤 다시 해 주세요.',true); },
  async ulNickAuto(){ if(ULA.busy)return; ULA.busy=true; render(); let r=null; try{ if(await ulV1()&&await ulV1Player())r=await ulNet().rename(ulAutoNick()); }catch(e){} ULA.busy=false;
    if(r&&r.ok){ ulLs(UL_NICK_K,'auto'); ulSvStale(); return ulAutoSay(`자동 이름 ${ulAutoNick()}(으)로 되돌렸습니다.`); } ulAutoSay(r&&r.data&&r.data.message?r.data.message:'지금은 래더 서버에 연결할 수 없습니다.',true); },
  async ulAutoNow(){ if(ULA.busy||!G||G.unemp)return; const U=uld(), now=Date.now(); if(!FrontOfficeCore.ulManOk(U.ar,now))return ulAutoSay(UL_MAN_WAIT,true);
    if(U.deck&&U.deck.src!=='now')U.deck.src='now'; const p=ulAutoPlan(now,true); if(!p||p.skip)return ulAutoSay('구단을 맡고 있을 때 지금 1군을 등록합니다.',true);
    ULA.busy=true; UL.msg=''; UL.bad=false; render(); let up=false; try{ up=await ulUpload(); }catch(e){} ULA.busy=false;
    if(up||!xfAvail()){ ulAutoManual('now',(U.ar&&U.ar.drop)||[]); ulAutoDone(p,up?'ok':'same'); ulSave(); return ulAutoSay(`${U.deck.e.name} 덱을 다시 등록했습니다(OVR ${FrontOfficeCore.cupOvrTxt(U.deck.e.ovr)}).${p.cap?' 연봉 상한을 넘어 이 단계 리그에는 나가지 못합니다.':''}`,!!p.cap); }
    const rej=!!(UL.msg&&UL.bad); ulAutoDone(p,rej?'reject':'fail',rej?UL.msg:''); ulSave(); ulAutoSay(rej?UL.msg:'서버에 올리지 못했습니다. 연결되면 자동으로 다시 올립니다.',true); }, /* 서버가 거절(하루 1회 등)하면 다시 보내지 않는다 */
});
try{ setInterval(()=>{ ulAutoTick().catch(()=>{}); },60e3); setTimeout(()=>{ ulAutoTick().catch(()=>{}); },5e3);
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible')ulAutoTick().catch(()=>{}); }); }catch(e){}
