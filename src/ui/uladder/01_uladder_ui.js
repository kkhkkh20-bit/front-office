/* ===== 유저 래더 화면: 구단 › 유저 래더 =====
   내 덱(지금 1군 또는 앨범 시즌을 등록·갱신, 서버에 올림) · 리그(순위·다음 연전·덱 고치기·연전 돌리기/끝까지) · 결과(승강·MVP) · 단계표(기록).
   리그를 시작할 때 서버에서 같은 단계 덱을 한 번 받는다. 모자라면 가져온 우승 덱, 그다음 단계 기준 AI 덱으로 채운다(엔진 src/engine/uladder).
   서버: 기본은 새 서버 v1(/api/v1, D1. 사용자 11-17 "화면도 새 서버로 바로 전환해"). probe가 'ok'가 아니면(꺼짐·D1 고장·오프라인) 예전 KV 래더(/api/ladder) 그대로.
     v1 흐름: probe → 덱이 있으면 플레이어 만들기(닉네임 = 단장 이름, 세계 id) → 덱 올리기(처음이면 지금 단계를 옮긴다: 서버가 KV에 올린 단계까지만 받는다)
     → 리그 시작에 상대(opponents, 상대 pid·닉네임을 팀에 붙임) → 리그 끝에 결과(result) → 단계는 서버 응답을 쓴다. 끊기면 결과는 기기에 줄 세웠다가 다음 연결 때 보낸다.
     '순위' 탭: 내 시즌 카드(포인트·순위·칭호·라이벌), 단계별 순위표 20위, 최근 소식. 상대 덱 칸에 그 유저와의 맞대결. 끄기: localStorage fo-net-v1=0 또는 ?net=kv.
   서버가 없거나 연결이 안 되면 이 기기에서 AI 덱으로 리그를 연다. 덱 고치기는 연전 사이 언제든, 다음 연전부터 적용된다 */
const UL={view:null,feed:[],tiers:null,tiersSt:'',busy:false,msg:'',bad:false,srv:'',me:null,edit:null,src:'now',name:'',prog:'',opp:null,
  v1:'',v1at:0,v1p:null,N:null,v1sync:'',sv:{me:null,meSt:'',board:{},bt:null,feed:null,feedSt:'',rv:null,h2h:{}}};
const ulApi=(p,o)=>fetch('/api/ladder'+p,Object.assign({cache:'no-store',credentials:'same-origin'},o||{})).then(async r=>{ const j=await cupJson(r); return {r,j}; });
function ulSay(m,bad){ UL.msg=m; UL.bad=!!bad; try{ render(); }catch(e){} }
/* ---- 서버 v1 연결(사용자 11-17) ---- */
function ulNet(){ return UL.N||(UL.N=FrontOfficeCore.netCreate({})); }
const ulV1On=()=>UL.v1==='ok';
/* probe 한 번(실패하면 1분 뒤 다시). → true면 v1, false면 KV 길 */
function ulV1(force){ if(!xfAvail()||!FrontOfficeCore.netEnabled()){ UL.v1='no'; return Promise.resolve(false); }
  if(UL.v1==='ok')return Promise.resolve(true); if(UL.v1==='probing'&&UL.v1p)return UL.v1p; if(!force&&UL.v1&&Date.now()-UL.v1at<60e3)return Promise.resolve(false);
  UL.v1='probing'; UL.v1at=Date.now(); return UL.v1p=ulNet().probe().then(s=>{ UL.v1=s==='ok'?'ok':'off'; return UL.v1==='ok'; },()=>{ UL.v1='off'; return false; }); }
/* 닉네임: 단장 이름 → 구단 별칭 → 덱 이름(2~12자, 금칙어 없음) */
function ulNick(){ const C=FrontOfficeCore, U=uld(); for(const n of [G&&G.gmP&&G.gmP.name,G&&team(G.user)&&team(G.user).nick,U&&U.deck&&U.deck.e.name]){ const x=C.cupName(n||''); if(x.length>=2&&!C.cupBadName(x))return x; } return '단장'+(1000+Math.floor(Math.random()*9000)); }
async function ulV1Player(){ const N=ulNet(); if(N.signedIn())return true; let r=await N.ensurePlayer(ulNick(),{wid:cupWid()}); if(!r.ok&&r.status===400)r=await N.ensurePlayer('단장'+(1000+Math.floor(Math.random()*9000)),{wid:cupWid()}); return !!r.ok; }
/* 토큰이 서버에 없으면(관리자 삭제 등) 버리고 한 번 새로 만든다 */
async function ulV1Call(f){ let r=await f(); if(r.status===401){ ulNet().forget(); if(await ulV1Player())r=await f(); } return r; }
/* 처음 연결(세계마다 한 번): 줄 세운 결과 보내기 → 덱이 있으면 플레이어·덱 올리기(지금 단계 옮기기) → 서버 단계로 맞추기 */
async function ulV1Sync(){ const U=uld(), N=ulNet(), C=FrontOfficeCore; if(!U)return; const wid=cupWid(); if(UL.v1sync===wid)return; UL.v1sync=wid;
  try{ if(N.signedIn()&&N.queue().length)await N.flush();
    if(!U.deck){ if(N.signedIn())await ulSvMe(true); return; }
    if(!(await ulV1Player())){ UL.v1sync=''; return; }
    let m=await ulV1Call(()=>N.me()); if(!m.ok){ UL.v1sync=''; return; } let d=m.data, moved=false;
    if(!d.deck||d.deck.h!==U.deck.e.h){ const r=await N.putDeck(U.deck.e,U.tier|0,wid); if(r.ok){ moved=!d.deck; const m2=await N.me(); if(m2.ok)d=m2.data; } }
    UL.sv.me=d; UL.sv.meSt='ok'; UL.sv.meAt=Date.now(); UL.me=d.deck?{registered:true,name:d.deck.name,tier:d.entry.tier,v1:1}:null;
    if(!U.league&&d.entry&&(d.entry.tier|0)!==(U.tier|0)){ const was=U.tier|0; U.tier=d.entry.tier|0; ulSay(`${moved?'새 래더 서버로 옮겼습니다. ':''}서버 단계 ${C.ulTierName(U.tier)}로 맞췄습니다(이 기기 ${C.ulTierName(was)}).`); }
    else if(moved)ulSay(`새 래더 서버로 옮겼습니다. ${C.ulTierName(U.tier)} 단계 그대로입니다.`);
  }catch(e){ UL.v1sync=''; } }
/* 순위 탭 자료: 내 시즌·라이벌(로그인), 순위표·소식(공개). 화면을 그릴 때 한 번씩만 받는다 */
async function ulSvMe(force){ const N=ulNet(), S=UL.sv; if(!N.signedIn()||S.meSt==='loading'||(!force&&S.meSt&&Date.now()-(S.meAt||0)<60e3))return; S.meSt='loading'; S.meAt=Date.now();
  try{ const [m,rv]=await Promise.all([ulV1Call(()=>N.me()),N.rivals()]); S.me=m.ok?m.data:null; S.rv=rv.ok?rv.data:null; S.meSt=m.ok?'ok':'err'; }catch(e){ S.meSt='err'; } try{ render(); }catch(e){} }
function ulSvBoard(t){ const S=UL.sv; if(S.board[t])return; S.board[t]={st:'loading'}; ulNet().leaderboard(t).then(r=>{ S.board[t]=r.ok?Object.assign({st:'ok'},r.data):{st:'err'}; },()=>{ S.board[t]={st:'err'}; }).finally(()=>{ try{ render(); }catch(e){} }); }
function ulSvFeed(){ const S=UL.sv; if(S.feedSt)return; S.feedSt='loading'; ulNet().feed().then(r=>{ S.feed=r.ok?r.data.items||[]:null; S.feedSt=r.ok?'ok':'err'; },()=>{ S.feedSt='err'; }).finally(()=>{ try{ render(); }catch(e){} }); }
function ulSvH2h(pid){ const S=UL.sv; if(!pid||S.h2h[pid]||!ulNet().signedIn())return; S.h2h[pid]={st:'loading'}; ulNet().h2h(pid).then(r=>{ S.h2h[pid]=r.ok?Object.assign({st:'ok'},r.data):{st:'err'}; },()=>{ S.h2h[pid]={st:'err'}; }).finally(()=>{ try{ render(); }catch(e){} }); }
function ulSvStale(){ Object.assign(UL.sv,{meSt:'',board:{},feedSt:'',h2h:{}}); }
/* 리그 결과 보내기: 상대 유저(pid 있는 팀)별 승패. 응답 단계를 내 단계로 쓴다. 끊기면 기기에 줄 세운다(연결부) */
async function ulV1Result(L,res){ const N=ulNet(), U=uld(); try{ if(!(await ulV1Player()))return;
    const opps=((res.rec&&res.rec.h2h)||[]).map(x=>({pid:L.teams[x.i]&&L.teams[x.i].pid,w:x.w,l:x.l,d:x.t})).filter(x=>x.pid);
    const r=await ulV1Call(()=>N.result({key:L.nk||(cupWid()+'.'+L.id),rank:res.rank,teams:L.teams.length,w:res.w,l:res.l,d:res.t,opps}));
    if(r.ok&&r.data){ const d=r.data; res.srv={tier:d.tier|0,delta:d.delta|0,points:d.points|0,move:d.move,dup:!!d.dup}; if(!U.league)U.tier=d.tier|0; ulSvStale(); }
    else if(r.queued)res.srv={queued:1};
  }catch(e){} try{ render(); }catch(e){} }
/* 내 등록 상태(서버): v1이면 v1, 아니면 KV */
function ulProbe(){ if(UL.srv||!xfAvail()||!G)return; UL.srv='loading';
  ulV1().then(async ok=>{ if(ok){ UL.srv='ok'; await ulV1Sync(); return; } if(!G.wid){ UL.srv='ok'; UL.me=null; return; } const {r,j}=await ulApi('/me/'+G.wid); UL.srv=r.ok?'ok':'off'; UL.me=r.ok&&j.registered?j:null; })
    .catch(()=>{ UL.srv='off'; }).finally(()=>{ try{ render(); }catch(e){} }); }
/* 서버에 올리기(실패해도 이 기기 리그는 된다). v1이 되면 v1, 안 되면(꺼짐·연결 안 됨) KV */
async function ulUpload(){ const U=uld(); if(!U||!U.deck||!xfAvail())return false;
  if(await ulV1()){ try{ if(await ulV1Player()){ const r=await ulV1Call(()=>ulNet().putDeck(U.deck.e,U.tier|0,cupWid()));
      if(r.ok){ const d=r.data; UL.me={registered:true,name:d.name,tier:d.tier|0,ovr:d.ovr,v1:1}; UL.srv='ok'; UL.v1sync=cupWid(); if(!U.league)U.tier=d.tier|0; UL.sv.meSt=''; return true; }
      if(r.status>=400&&r.status<500){ ulSay(`서버 등록은 하지 못했습니다(${(r.data&&((r.data.errors&&r.data.errors[0])||r.data.message||r.data.error))||r.status}). 이 기기 리그는 그대로 할 수 있습니다.`,true); return false; } } }catch(e){} }
  try{ const {r,j}=await ulApi('/deck',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({wid:cupWid(),tier:U.tier|0,e:U.deck.e})});
    if(r.ok){ UL.me=Object.assign({registered:true},j); UL.srv='ok'; return true; } ulSay(`서버 등록은 하지 못했습니다(${(j.errors&&j.errors[0])||j.message||r.status}). 이 기기 리그는 그대로 할 수 있습니다.`,true); }catch(e){ UL.srv='off'; } return false; }
function ulSrcEntry(src){ const name=FrontOfficeCore.cupName(UL.name||(uld()&&uld().deck&&uld().deck.e.name)||team(G.user).nick);
  if(src==='now'){ if(G.unemp)return null; return cupEntryNow({name}); }
  const x=cupAlbum().find(a=>'alb:'+a.id===src); if(!x)return null; const e=JSON.parse(JSON.stringify(x.e)); e.name=name; e.ovr=cupOvr(e); return e; }
const ulSrcOpts=()=>[['now','지금 1군'],...cupAlbum().slice().reverse().map(a=>['alb:'+a.id,`${a.y} ${a.k==='auto'?'시즌 종료':'직접 저장'}${a.e.res&&a.e.res.rank?` ${a.e.res.rank}위`:''} · OVR ${FrontOfficeCore.cupOvrTxt(a.e.ovr)}`])];
/* 리그 시작: 서버에서 같은 단계 덱 받기(한 번) → 가져온 우승 덱(이 기기·명예의 전당) → AI */
async function ulStart(){ const U=uld(), C=FrontOfficeCore; if(!U||!U.deck||UL.busy)return; UL.busy=true; ulSay('같은 단계 덱을 받는 중입니다.');
  let fetched=[], avg=0, count=0, from='이 기기', net=false, kvn=0;
  if(await ulV1()){ try{ if(await ulV1Player()){ await ulV1Sync(); const r=await ulV1Call(()=>ulNet().opponents({n:9}));
      if(r.ok&&r.data&&r.data.ok){ const d=r.data; fetched=(d.decks||[]).map(x=>({e:x.e,pid:x.pid,nick:x.nickname})); avg=d.avg; count=d.near; kvn=d.kv|0; from='서버'; net=true; if(!U.league&&d.tier!=null)U.tier=d.tier|0; } } }catch(e){} }
  if(!net&&xfAvail()){ try{ const me=U.deck.e; const {r,j}=await ulApi(`/opp?wid=${encodeURIComponent(cupWid())}&tier=${U.tier|0}&ovr=${me.ovr?me.ovr.t:0}&n=9`); if(r.ok&&j.ok){ fetched=(j.decks||[]).map(d=>d.e); avg=j.avg; count=j.count; from='서버'; } }catch(e){} }
  const cup=[...ulDecks().map(x=>x.e),...((HOF.data&&HOF.data.cups)||[]).map(c=>c.champ&&c.champ.deck).filter(Boolean)];
  UL.prog='AI 덱을 만드는 중입니다.'; render(); await new Promise(r=>setTimeout(r,20));
  try{ const r=ulMakeLeague({fetched,cup,avg,count}); UL.busy=false; UL.prog=''; if(!r.ok)return ulSay(r.msg,true); const s=r.league.src;
    if(net){ r.league.net=1; r.league.nk=`${cupWid()}.${r.league.id}.${Date.now().toString(36)}`; r.league.kvn=kvn; }
    UL.feed=[]; (UI.it=UI.it||{}).uld='lg'; ulSay(`${C.ulTierName(r.league.tier)} 리그를 시작했습니다. 상대: ${s.user?`${from} 유저 덱 ${s.user}개`:'유저 덱 없음'}${s.cup?` · 우승 덱 ${s.cup}개`:''}${s.ai?` · 등록 덱이 모자라 AI 구단 ${s.ai}팀이 채웠습니다`:''}.`); }
  catch(e){ console.error(e); UL.busy=false; UL.prog=''; ulSay('리그를 만들지 못했습니다.',true); } }
/* 연전 돌리기: 한 라운드 또는 끝까지(연전마다 화면을 돌려준다) */
/* 연전 결과 한 줄(진행 표시) */
function ulFeedLine(L,x){ const A=L.teams[x.a], B=L.teams[x.b], wa=x.g.filter(g=>g[0]>g[1]).length, wb=x.g.filter(g=>g[1]>g[0]).length, me=x.a===0||x.b===0;
  const hot=me?x.g.map(g=>g[3]?'끝내기':g[2]>9?`${g[2]}회 연장`:'').filter(Boolean)[0]:'';
  return {me,t:`${x.r}R ${A.name} ${wa}-${wb}${x.g.length-wa-wb?`(${x.g.length-wa-wb}무)`:''} ${B.name} · ${x.g.map(g=>g[0]+':'+g[1]).join(' ')}${hot?` · ${hot}!`:''}`}; }
async function ulSim(all){ const U=uld(), L=U&&U.league; if(!L||UL.busy)return; UL.busy=true; UL.edit=null; if(UL.view&&UL.view.k==='lg')UL.view=null; const tick=()=>new Promise(r=>setTimeout(r,all?0:140));
  try{ const r0=L.sched[L.next]&&L.sched[L.next].r; while(L.next<L.sched.length){ const r=L.sched[L.next].r; if(!all&&r!==r0)break; const x=ulRunSeries(L); const f=ulFeedLine(L,x); if(!all||f.me){ UL.feed.unshift(f); UL.feed.length=Math.min(UL.feed.length,8); } UL.prog=`${r}/9라운드 · ${L.next}/${L.sched.length}연전`; render(); await tick(); }
    UL.prog=''; UL.busy=false; if(L.next>=L.sched.length){ const res=ulFinish(); (UI.it=UI.it||{}).uld='res'; ulSay(`리그가 끝났습니다. ${res.rank}위 · ${res.move==='up'?`${FrontOfficeCore.ulTierName(res.to)} 승격`:res.move==='down'?`${FrontOfficeCore.ulTierName(res.to)} 강등`:`${FrontOfficeCore.ulTierName(res.to)} 잔류`}.`);
      if(L.net||ulV1On())ulV1Result(L,res); else if(xfAvail()&&UL.me)ulApi('/tier',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({wid:cupWid(),tier:res.to})}).catch(()=>{}); }
    else render(); }
  catch(e){ console.error(e); UL.busy=false; UL.prog=''; ulSay('경기를 돌리지 못했습니다.',true); } }
Object.assign(A,{
  ulSrc(v){ UL.src=v; render(); },
  ulPick(){ UL.pick=!UL.pick; render(); },
  async ulReg(){ if(UL.busy)return; const el=document.getElementById('ulName'); if(el)UL.name=el.value; const n=FrontOfficeCore.cupName(UL.name||team(G.user).nick); if(FrontOfficeCore.cupBadName(n))return ulSay('팀명에 쓸 수 없는 말이 들어 있습니다.',true);
    const e=ulSrcEntry(UL.src); if(!e)return ulSay('이 덱을 만들 수 없습니다(구단을 맡고 있을 때 지금 1군을 등록합니다).',true); const m=ulSetDeck(e,UL.src); if(m)return ulSay(m,true);
    const U=uld(); let tail=''; if(U.league){ ulEditDeck(U.deck.e); tail=' 진행 중인 리그에는 다음 연전부터 이 덱으로 나갑니다.'; }
    UL.busy=true; render(); const up=await ulUpload(); UL.busy=false; if(up||!xfAvail())ulSay(`${U.deck.e.name} 덱을 등록했습니다(OVR ${FrontOfficeCore.cupOvrTxt(U.deck.e.ovr)}).${up?' 같은 단계 유저들이 이 덱을 상대로 만납니다.':''}${tail}`); },
  ulStart(){ return ulStart(); }, ulNext(){ return ulSim(false); }, ulAll(){ return ulSim(true); },
  ulEditOpen(){ const L=uld()&&uld().league; if(!L)return; UL.edit=JSON.parse(JSON.stringify(L.teams[0].e)); render(); },
  ulEditClose(){ UL.edit=null; render(); },
  ulLn(v,el){ const E=UL.edit; if(!E)return; const i=+el.dataset.i, id=+v, j=E.ln.findIndex(x=>x[0]===id); if(j>=0){ const t=E.ln[j][0]; E.ln[j][0]=E.ln[i][0]; E.ln[i][0]=t; } else { const old=E.ln[i][0]; E.ln[i][0]=id; E.bn=E.bn.filter(x=>x!==id); E.bn.push(old); } render(); },
  ulUp(v){ const E=UL.edit, i=+v; if(!E||i<=0)return; [E.ln[i-1],E.ln[i]]=[E.ln[i],E.ln[i-1]]; render(); },
  ulRot(v,el){ const E=UL.edit; if(!E)return; const i=+el.dataset.i, id=+v, j=E.rot.indexOf(id);
    if(j>=0){ [E.rot[i],E.rot[j]]=[E.rot[j],E.rot[i]]; } else { const old=E.rot[i]; E.rot[i]=id; E.pen=E.pen.filter(x=>x!==id); if(old!=null)E.pen.push(old); } render(); },
  ulBp(v,el){ const E=UL.edit; if(!E)return; const id=+el.dataset.i; E.bp=E.bp||{}; if(v==='auto')delete E.bp[id]; else { if(v==='cl')for(const k in E.bp)if(E.bp[k]==='cl')E.bp[k]='su'; E.bp[id]=v; } render(); },
  ulEditSave(){ const E=UL.edit; if(!E)return; const m=ulEditDeck(E); if(m)return ulSay(m,true); UL.edit=null; ulSay('덱을 고쳤습니다. 다음 연전부터 이 덱으로 나갑니다.'); },
  ulSwap(v){ const e=ulSrcEntry(v||UL.src); if(!e)return ulSay('이 덱을 만들 수 없습니다.',true); const L=uld().league; e.name=L.teams[0].name; UL.edit=JSON.parse(JSON.stringify(FrontOfficeCore.ulSlim(e))); ulSay(`${v==='now'?'지금 1군':'앨범 시즌'}을 불러왔습니다. '저장'을 누르면 다음 연전부터 나갑니다.`); },
  ulOpp(v){ UL.opp=UL.opp===+v?null:+v; render(); },
  ulKey(v,el){ const k=el&&el.dataset.k||'lg', i=+v; UL.view=UL.view&&UL.view.k===k&&UL.view.i===i?null:{k,i,tab:'log'}; render(); },
  ulKeyT(v){ if(UL.view){ UL.view.tab=v; render(); } },
  ulBoardT(v){ UL.sv.bt=+v|0; render(); },
  ulSvRe(){ ulSvStale(); render(); },
  /* 서버 기록 지우기(개인정보: docs/privacy.md, 사용자 11-17): v1 플레이어 전부 + 이 세계의 예전 KV 덱. 이 기기에서는 서버 래더를 끈다(자동으로 다시 만들지 않게) */
  async ulSvDel(){ if(UL.busy)return; if(!confirm('서버에 있는 내 래더 기록(닉네임·덱·시즌 기록·맞대결)을 지웁니다. 되돌릴 수 없습니다. 이 기기의 리그 기록은 그대로 남습니다.'))return;
    UL.busy=true; render(); const C=FrontOfficeCore; let ok=true;
    try{ const r=await ulNet().deleteMe(); ok=r.ok||r.status===401; }catch(e){ ok=false; }
    if(ok&&G&&G.wid)await ulApi('/deck/'+encodeURIComponent(G.wid),{method:'DELETE'}).catch(()=>{});
    UL.busy=false; if(!ok)return ulSay('서버 기록을 지우지 못했습니다. 잠시 뒤 다시 해 주세요.',true);
    C.netSetEnabled(false); Object.assign(UL,{v1:'no',me:null,srv:'',v1sync:''}); ulSvStale(); UL.sv.me=null; UL.sv.rv=null; ulSay('서버 기록을 지웠습니다. 이 기기에서는 서버 래더를 껐습니다. 리그는 이 기기에서 그대로 할 수 있습니다.'); },
  ulSvOn(){ FrontOfficeCore.netSetEnabled(true); Object.assign(UL,{v1:'',srv:'',v1sync:''}); ulSvStale(); ulSay('서버 래더를 다시 켰습니다. 덱이 있으면 서버에 올립니다.'); },
  ulQuit(){ const U=uld(); if(!U||!U.league)return; if(!confirm('이 리그를 그만둡니다. 기록과 승강 없이 지워집니다.'))return; U.league=null; UL.edit=null; ulSay('리그를 그만두었습니다.'); },
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
/* 순위 탭(서버 v1, 사용자 11-17): 내 시즌 카드 · 단계별 순위표(20위) · 최근 소식. v1에 연결되지 않으면 안내 한 칸 */
function ulRankHtml(U,msg){ const C=FrontOfficeCore, S=UL.sv;
  if(!ulV1On()){ const off=xfAvail()&&!C.netEnabled(); return `<div class="setc"><section class="card"><h2 class="sec">순위</h2><p class="small muted">${!xfAvail()?'내려받은 게임에서는 서버 순위를 볼 수 없습니다.':off?'이 기기에서 새 래더 서버를 껐습니다. 리그는 그대로 할 수 있습니다.':UL.v1==='probing'?'래더 서버에 연결하는 중입니다.':'지금은 새 래더 서버에 연결할 수 없습니다. 리그는 이 기기에서 그대로 할 수 있습니다.'}</p>${off?'<div class="btns"><button class="btn" data-a="ulSvOn">서버 래더 다시 켜기</button></div>':''}${msg}</section></div>`; }
  const N=ulNet(); ulSvMe(); ulSvFeed(); const bt=S.bt!=null?S.bt:(U.tier|0); ulSvBoard(bt); const M=S.me, E=M&&M.entry, mypid=(N.player()||{}).id;
  const rvL=(L,who)=>L&&L.length?`<p class="dk-t">${who}</p>${L.map(x=>`<p class="small">${esc(x.nickname)} <span class="muted">${x.n}경기</span> <b>${x.w}승 ${x.l}패${x.d?` ${x.d}무`:''}</b></p>`).join('')}`:'';
  const me=!N.signedIn()?'<p class="small muted">덱을 등록하면 서버 시즌 기록이 생깁니다.</p>':!E?`<p class="small muted">${S.meSt==='err'?'내 기록을 받지 못했습니다.':'내 기록을 받는 중입니다.'}</p>`:
    `<p class="ul-head"><span class="ul-tier ul-t${E.tier|0}">${C.ulTierName(E.tier)}</span> <b>${esc(M.player.nickname)}</b>${M.player.hidden?' <span class="pill">숨김</span>':''}</p>
    <div class="ul-sc"><div><span>시즌 포인트</span><b class="num">${E.points}</b></div><div><span>단계 순위</span><b class="num">${E.rank?E.rank+'위':'-'}</b></div><div><span>리그</span><b class="num">${E.leagues}</b></div><div><span>우승</span><b class="num">${E.wins}</b></div></div>
    <p class="small">시즌 ${M.season.id} · ${ulDay(M.season.starts)}~${ulDay(M.season.ends-1)} · 최고 ${C.ulTierName(E.best_tier)} · 승격 ${E.ups} · 강등 ${E.downs}</p>
    <p class="dk-t">칭호 <small>${(M.titles||[]).length}</small></p><div class="ul-bgs">${(M.titles||[]).map(t=>`<span class="ul-bg on">시즌 ${t.s} ${esc(C.ulTierName(t.tier))} ${t.rank}위</span>`).join('')||'<span class="small muted">시즌이 끝날 때 단계별 1~3위가 칭호를 받습니다.</span>'}</div>
    ${rvL(S.rv&&S.rv.attack,'라이벌 · 우리가 많이 만난 덱')}${rvL(S.rv&&S.rv.defense,'라이벌 · 우리 덱을 많이 만난 유저')}`;
  const card=`<section class="card"><h2 class="sec">내 시즌</h2>${me}<p class="small muted">시즌 포인트: 리그 1위 30 · 2위 24 … 10위 1. 많이 할수록 오릅니다. 단계 순위는 같은 단계 유저끼리 셉니다.</p>${msg}
    <div class="btns"><button class="btn small" data-a="ulSvRe">새로고침</button>${N.signedIn()?`<button class="btn small" data-a="ulSvDel"${UL.busy?' disabled':''}>서버 기록 지우기</button>`:''}</div></section>`;
  const B=S.board[bt], rows=B&&B.st==='ok'?B.rows||[]:null;
  const board=`<section class="card"><h2 class="sec">순위표</h2><div class="chips ul-bt">${C.UL_TIERS.map((n,i)=>`<button data-a="ulBoardT" data-v="${i}" class="${i===bt?'on':''}" aria-pressed="${i===bt}">${n}</button>`).join('')}</div>
    ${rows?rows.length?`<table class="ul-st ul-lb"><tr><th>순위</th><th>유저 · 팀</th><th>포인트</th><th>리그</th></tr>${rows.map(x=>`<tr class="${x.pid===mypid?'me':''}"><td class="num">${x.rank}</td><td><b>${esc(x.nickname)}</b> <span class="small muted">${esc(x.team||'')}${x.best_tier>bt?` · 최고 ${C.ulTierName(x.best_tier)}`:''}</span></td><td class="num">${x.points}</td><td class="num">${x.leagues}</td></tr>`).join('')}</table>`:'<p class="small muted">이번 시즌 이 단계에서 리그를 마친 유저가 아직 없습니다.</p>':`<p class="small muted">${B&&B.st==='err'?'순위표를 받지 못했습니다.':'순위표를 받는 중입니다.'}</p>`}
    <p class="small muted">이번 시즌 ${C.ulTierName(bt)} 단계 상위 20명(시즌 포인트 순).</p></section>`;
  const F=S.feed;
  const feed=`<section class="card"><h2 class="sec">최근 소식</h2>${F?F.length?`<div class="ul-news">${F.map(x=>`<p class="small"><b>${esc(x.nickname)}</b> ${x.kind==='season_top'?`시즌 ${x.season} ${esc(C.ulTierName(x.tier_to))} ${(x.info&&x.info.rank)||''}위`:x.kind==='crown'?'레전드 리그 우승!':`${esc(C.ulTierName(x.tier_from))} → <b class="ul-up">${esc(C.ulTierName(x.tier_to))}</b> 승격`} <span class="muted">${ulAgo(x.at)}</span></p>`).join('')}</div>`:'<p class="small muted">아직 소식이 없습니다.</p>':`<p class="small muted">${S.feedSt==='err'?'소식을 받지 못했습니다.':'소식을 받는 중입니다.'}</p>`}
    <p class="small muted">승격·레전드 우승·시즌 상위 소식입니다.</p></section>`;
  return `<div class="setc">${card}</div><div class="setc">${board}</div><div class="setc">${feed}</div>`; }
function ulStandHtml(L,st){ const n=L.teams.length; return `<table class="ul-st"><tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>차</th></tr>${st.map(x=>{ const t=L.teams[x.key]; return `${x.rank===n-1?'<tr class="ul-line dn"><td colspan="7">강등선 ▼ 9·10위</td></tr>':''}<tr class="${x.key===0?'me':''}${x.rank<=2?' up':x.rank>=L.teams.length-1?' dn':''}"><td class="num">${x.rank}</td><td><button class="lnk" data-a="ulOpp" data-v="${x.key}">${esc(t.name)}</button> <span class="ul-k ul-k-${t.kind}">${ulKind(t)}</span></td><td class="num">${x.w}</td><td class="num">${x.l}</td><td class="num">${x.t}</td><td class="num">${(x.w+x.l?x.w/(x.w+x.l):0).toFixed(3).replace(/^0/,'')}</td><td class="num">${x.gb?x.gb.toFixed(1):'-'}</td></tr>${x.rank===2?'<tr class="ul-line up"><td colspan="7">승격선 ▲ 1·2위</td></tr>':''}`; }).join('')}</table>
  <p class="small muted">1·2위 승격 · 9·10위 강등. 팀 이름을 누르면 덱을 봅니다.</p>`; }
/* 단계별 등록 덱 수(서버) */
function ulTiersLoad(){ if(UL.tiersSt||!xfAvail())return; UL.tiersSt='loading'; ulApi('/tiers').then(({r,j})=>{ UL.tiers=r.ok&&Array.isArray(j.counts)?j.counts:null; UL.tiersSt='ok'; },()=>{ UL.tiersSt='off'; }).finally(()=>{ try{ render(); }catch(e){} }); }
const UL_GUIDE=`<ol class="ul-guide"><li><b>내 덱 등록</b> 지금 1군이나 앨범의 지난 시즌 로스터를 덱으로 올립니다.</li><li><b>리그 시작</b> 같은 단계 덱 9개와 짝마다 3연전, 팀당 27경기를 치릅니다.</li><li><b>승격</b> 1·2위는 한 단계 위로, 9·10위는 아래로. 루키에서 레전드까지 올라갑니다.</li></ol>`;
/* 상대 덱 미리보기: 여섯 갈래 비교 막대(가운데 기준, 오른쪽이 상대 우위) + 한 줄 요약 */
function ulVsHtml(me,op){ const V=ulVs(me,op); if(!V)return ''; const bar=x=>{ const w=Math.min(50,Math.abs(x.d)*5); return `<div class="ul-vr"><span>${x.n}</span><b class="num">${x.me}</b><i class="ul-vb"><em class="${x.d>0?'op':'me'}" style="${x.d>0?'left:50%':'right:50%'};width:${w}%"></em></i><b class="num">${x.op}</b></div>`; };
  const t=(L,who)=>L.length?`${who} ${L.map(x=>`${x.n} +${Math.abs(x.d)}`).join(' · ')}`:'';
  const sum=[t(V.opBest,'상대 우위'),t(V.meBest,'우리 우위')].filter(Boolean).join(' / ')||'두 덱이 고르게 비슷합니다.';
  return `<div class="ul-vs"><div class="ul-vr ul-vh"><span></span><b>우리</b><i></i><b>상대</b></div>${V.rows.map(bar).join('')}<p class="small">${esc(sum)}</p></div>`; }
/* 명경기 칩 + 고른 경기 중계·박스·줄 점수(이 기기에 남긴 기록을 그대로 보여 준다) */
function ulKeysHtml(K,k){ if(!K||!K.length)return ''; const V=UL.view&&UL.view.k===k?UL.view:null, g=V&&K[V.i];
  const chip=(x,i)=>`<button data-a="ulKey" data-k="${k}" data-v="${i}" class="${V&&V.i===i?'on':''}" aria-pressed="${!!(V&&V.i===i)}"><b>${esc(x.tag)}</b> ${x.sa}:${x.sb} vs ${esc(x.opp)} <span class="muted">${x.r}R</span></button>`;
  return `<div class="ul-keys"><p class="dk-t">명경기 · 이 경기 보기</p><div class="chips">${K.map(chip).join('')}</div>${g?`<div class="ul-gv">${g.mvp?`<p class="small">경기 MVP ${esc(g.mvp)}</p>`:''}<div class="chips">${[['log','중계'],['line','점수'],['bat','타자'],['pit','투수']].map(([a,b])=>`<button data-a="ulKeyT" data-v="${a}" class="${V.tab===a?'on':''}">${b}</button>`).join('')}<button data-a="ulKey" data-k="${k}" data-v="${V.i}">닫기</button></div><pre class="ul-pre">${esc(g[V.tab]||'')}</pre></div>`:''}</div>`; }
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
function ulBadgeHtml(U){ const B=FrontOfficeCore.ulBadges(U.hist); return `<p class="dk-t">배지 <small>${B.filter(x=>x.on).length}/${B.length}</small></p><div class="ul-bgs">${B.map(x=>`<span class="ul-bg${x.on?' on':''}" title="${esc(x.d)}">${esc(x.n)}</span>`).join('')}</div>`; }
/* 이번 리그로 새로 받은 배지(결과 화면) */
function ulNewBadges(U){ const C=FrontOfficeCore, a=C.ulBadges(U.hist), b=C.ulBadges(U.hist.slice(0,-1)), n=a.filter((x,i)=>x.on&&!b[i].on); return n.length?`<p class="ul-newb">새 배지 ${n.map(x=>`<span class="ul-bg on" title="${esc(x.d)}">${esc(x.n)}</span>`).join(' ')}</p>`:''; }
function ulSeasonsHtml(U){ const C=FrontOfficeCore, L=[...(U.seasons||[]),...(U.seas?[U.seas]:[])].slice(-6).reverse(); if(!L.length)return '';
  return `<p class="dk-t">시즌 기록</p>${L.map(x=>`<p class="small">${esc(x.label)} · 최고 <b>${C.ulTierName(x.best)}</b> · 최고 점수 <b class="num">${x.top}</b> · ${x.n}리그${x.win?` · 우승 ${x.win}`:''}${x.up?` · 승격 ${x.up}`:''}</p>`).join('')}`; }
function ulView(){ if(!G)return ''; ulProbe(); const C=FrontOfficeCore, U=uld(), L=U.league, S=C.ulSummary(U.hist,U.tier), T=C.ulTierName(U.tier);
  const it=inTabs('uld',[['deck','내 덱'],['lg','리그'],['res','결과'],['rank','순위'],['tier','단계표']],L?'lg':'deck');
  const msg=(UL.msg?`<div class="note${UL.bad?' bad':''}">${esc(UL.msg)}</div>`:'')+(UL.prog?`<p class="small">${esc(UL.prog)}</p>`:'');
  const se=C.ulSeason(Date.now()), SS=U.seas&&U.seas.id===se.id?U.seas:null;
  const head=`<p class="ul-head"><span class="ul-tier ul-t${U.tier|0}">${T}</span> <span class="small muted">최고 ${C.ulTierName(S.best)} · ${S.leagues}리그${S.stay&&S.stay.n>1?` · 이 덱 ${C.ulTierName(S.stay.tier)} ${S.stay.n}리그째`:''}</span></p>
    <p class="small ul-seas">시즌 ${se.label} · ${SS?`시즌 최고 <b>${C.ulTierName(SS.best)}</b> · 최고 점수 <b class="num">${SS.top}</b> · ${SS.n}리그`:'이번 시즌 기록 없음'}</p>`;
  let body='';
  if(it.cur==='deck'){ const cur=U.deck; const src=ulSrcOpts(); const pre=(()=>{ try{ return ulSrcEntry(UL.src); }catch(e){ return null; } })();
    const pickF=`<label class="cup-in"><span>팀명(12자)</span><input id="ulName" maxlength="12" value="${esc(UL.name||(cur&&cur.e.name)||team(G.user).nick)}" autocomplete="off"></label>
      <label class="cup-in"><span>로스터</span><select data-a="ulSrc">${src.map(([k,l])=>`<option value="${esc(k)}"${k===UL.src?' selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
    if(!cur){ body=`<div class="setc"><section class="card ul-first"><h2 class="sec">유저 래더</h2>${UL_GUIDE}<div class="btns"><button class="btn primary ul-big" data-a="ulReg"${UL.busy?' disabled':''}>${UL.src==='now'?'지금 1군으로 덱 등록':'고른 로스터로 덱 등록'}</button></div>
        ${pre?`<p class="small muted">${UL.src==='now'?'지금 1군':'고른 로스터'} OVR ${C.cupOvrTxt(pre.ovr)} (총|투수 타자)</p>`:''}<p class="small"><button class="lnk small" data-a="ulPick">${UL.pick?'접기':'팀명·다른 로스터 고르기'}</button></p>${UL.pick?pickF:''}${msg}</section></div>`; }
    const reg=`<section class="card"><h2 class="sec">내 덱 등록</h2>${head}<p class="small muted">지금 1군이나 앨범의 지난 시즌 로스터를 덱으로 등록합니다. 언제든 다시 등록할 수 있고, 같은 단계 유저들이 이 덱을 상대로 만납니다.</p>
      <label class="cup-in"><span>팀명(12자)</span><input id="ulName" maxlength="12" value="${esc(UL.name||(cur&&cur.e.name)||team(G.user).nick)}" autocomplete="off"></label>
      <label class="cup-in"><span>로스터</span><select data-a="ulSrc">${src.map(([k,l])=>`<option value="${esc(k)}"${k===UL.src?' selected':''}>${esc(l)}</option>`).join('')}</select></label>
      ${pre?`<p class="small">고른 로스터 OVR <b class="num">${C.cupOvrTxt(pre.ovr)}</b> <span class="muted">(총|투수 타자)</span></p>`:''}
      <div class="btns"><button class="btn primary" data-a="ulReg"${UL.busy?' disabled':''}>${cur?'덱 갱신':'내 덱으로 등록'}</button></div>
      <p class="small muted">${!xfAvail()?'내려받은 게임에서는 이 기기에서만 리그를 엽니다(상대는 AI·가져온 덱).':UL.srv==='off'?'지금은 래더 서버에 연결할 수 없습니다. 이 기기 리그는 할 수 있습니다.':UL.me?`서버 등록: ${esc(UL.me.name)} · ${C.ulTierName(UL.me.tier)}${UL.me.v1?' · 새 래더 서버':''}`:'아직 서버에 등록하지 않았습니다.'}${ulV1On()&&ulNet().signedIn()?' <button class="lnk small muted" data-a="ulSvDel">서버 기록 지우기</button>':''}</p>${msg}</section>`;
    const mine=cur?`<section class="card"><h2 class="sec">내 덱</h2>${cupDeckHtml(cur.e,{head:`<b>${esc(cur.e.name)} ${esc(cur.e.year)}</b>`})}</section>`:'<section class="card"><h2 class="sec">내 덱</h2><p class="small muted">아직 등록한 덱이 없습니다.</p></section>';
    const DK=ulDecks(); const ch=`<section class="card"><h2 class="sec">도전 덱</h2><p class="small muted">명예의 전당에서 가져온 우승 덱입니다. 리그 상대로 나오고, 내 덱으로는 등록할 수 없습니다.</p>${DK.map(x=>`<details class="hof-d"><summary class="small"><b>${esc(x.name)} ${esc(x.year)}</b> <span class="ul-k ul-k-cup">도전 덱</span> ${esc(x.src)} · OVR ${esc(C.cupOvrTxt(x.ovr))}</summary>${cupDeckHtml(x.e)}</details>`).join('')||'<p class="small muted">가져온 덱이 없습니다.</p>'}</section>`;
    if(cur)body=`<div class="setc">${reg}</div><div class="setc">${mine}</div><div class="setc">${ch}</div>`; }
  else if(it.cur==='lg'){
    if(!L){ body=`<div class="setc"><section class="card"><h2 class="sec">리그</h2>${head}${UL_GUIDE}<p class="small muted">같은 단계 등록 덱이 모자라면 가져온 우승 덱과 'AI 구단'(이 단계 평균 전력)이 채웁니다.</p>
      <div class="btns"><button class="btn primary ul-big" data-a="ulStart"${UL.busy||!U.deck?' disabled':''}>${T} 리그 시작</button></div>${U.deck?'':'<p class="small muted">먼저 \'내 덱\'에서 덱을 등록해 주세요.</p>'}${msg}</section></div>`; }
    else { const st=ulStand(L), s=L.sched[L.next], me=st.find(x=>x.key===0); const myNext=L.sched.slice(L.next).find(x=>x.a===0||x.b===0);
      const recent=L.series.filter(x=>x.a===0||x.b===0).slice(-4).reverse().map(x=>{ const op=L.teams[x.a===0?x.b:x.a], mine=x.a===0; const w=x.g.filter(g=>mine?g[0]>g[1]:g[1]>g[0]).length, l=x.g.filter(g=>mine?g[1]>g[0]:g[0]>g[1]).length;
        return `<p class="small">${x.r}R vs ${esc(op.name)} <b>${w}승 ${l}패${x.g.length-w-l?` ${x.g.length-w-l}무`:''}</b> <span class="muted">(${x.g.map(g=>mine?g[0]+':'+g[1]:g[1]+':'+g[0]).join(', ')})</span></p>`; }).join('');
      const left=L.sched.slice(L.next).filter(x=>x.a===0||x.b===0).length, st2=st[1], st8=st[L.teams.length-3];
      const gap=(a,b)=>((a.w-b.w)+(b.l-a.l))/2; const line=me.rank<=2?`승격권 · 3위와 ${gap(me,st[2]).toFixed(1)}경기 차`:me.rank>=L.teams.length-1?`강등권 · 잔류까지 ${gap(st8,me).toFixed(1)}경기`:`승격권까지 ${gap(st2,me).toFixed(1)}경기 · 강등권과 ${gap(me,st[L.teams.length-2]).toFixed(1)}경기`;
      const opI=myNext?(myNext.a===0?myNext.b:myNext.a):null, op=opI!=null?L.teams[opI]:null, opS=op?st.find(x=>x.key===opI):null;
      const prevw=op?`<div class="ul-next"><p class="dk-t">다음 상대 · ${myNext.r}라운드</p><p><b>${esc(op.name)}</b> <span class="ul-k ul-k-${op.kind}">${ulKind(op)}</span></p><p class="small">${opS.rank}위 · ${opS.w}승 ${opS.l}패 ${opS.t}무 · OVR <b class="num">${C.cupOvrTxt(op.e.ovr)}</b> <span class="muted">(우리 ${C.cupOvrTxt(L.teams[0].e.ovr)})</span></p>${ulVsHtml(L.teams[0].e,op.e)}${ulH2hHtml(op)}<p class="small"><button class="lnk small" data-a="ulOpp" data-v="${opI}">상대 덱 보기</button></p></div>`:'';
      const feed=UL.feed.length?`<div class="ul-feed">${UL.feed.map((f,i)=>`<p class="${f.me?'me':''}${i===0?' new':''}">${esc(f.t)}</p>`).join('')}</div>`:'';
      const nx=`<section class="card ul-lg"><div class="ul-act"><div class="ul-sum"><span class="ul-tier ul-t${L.tier}">${C.ulTierName(L.tier)}</span> <b class="ul-rank">${me.rank}위</b> <span class="small">${me.w}승 ${me.l}패 ${me.t}무 · 남은 연전 ${left} · ${s?`${s.r}/9라운드`:'끝'}</span></div>
        <p class="small ul-lineinfo ${me.rank<=2?'ul-up':me.rank>=L.teams.length-1?'ul-dn':''}">${line}</p>
        <div class="btns"><button class="btn primary" data-a="ulNext"${UL.busy?' disabled':''}>다음 연전</button><button class="btn" data-a="ulAll"${UL.busy?' disabled':''}>끝까지</button><button class="btn" data-a="ulEditOpen"${UL.busy?' disabled':''}>덱 고치기</button></div></div>
        ${msg}${feed}${prevw}${recent?`<p class="dk-t">최근 우리 연전</p>${recent}`:''}${ulKeysHtml(L.keys,'lg')}${L.edits.length?`<p class="small muted">이 리그에서 덱을 ${L.edits.length}번 고쳤습니다.</p>`:''}<p class="small"><button class="lnk small muted" data-a="ulQuit">리그 그만두기</button></p></section>`;
      const o=UL.opp!=null&&L.teams[UL.opp]?L.teams[UL.opp]:L.teams[myNext?(myNext.a===0?myNext.b:myNext.a):0];
      const side=UL.edit?ulEditHtml():`<section class="card"><h2 class="sec">${o.key===UL_ME?'내 덱':'상대 덱'}</h2>${ulH2hHtml(o)}${cupDeckHtml(o.e,{head:`<b>${esc(o.name)}</b> <span class="ul-k ul-k-${o.kind}">${ulKind(o)}</span>`})}</section>`;
      body=`<div class="setc">${nx}</div><div class="setc"><section class="card"><h2 class="sec">순위</h2>${ulStandHtml(L,st)}</section></div><div class="setc">${side}</div>`; } }
  else if(it.cur==='res'){ const R=U.last;
    if(!R)body=`<div class="setc"><section class="card"><h2 class="sec">결과</h2><p class="small muted">아직 끝난 리그가 없습니다.</p>${msg}</section></div>`;
    else { const mv=R.move==='up'?`<b class="ul-up">${C.ulTierName(R.to)} 승격</b>`:R.move==='down'?`<b class="ul-dn">${C.ulTierName(R.to)} 강등</b>`:`${C.ulTierName(R.to)} 잔류`;
      const badge=`<div class="ul-badge ul-b-${R.move}"><span class="ul-tier ul-t${R.tier}">${C.ulTierName(R.tier)}</span><b>${R.move==='up'?'승격!':R.move==='down'?'강등':'잔류'}</b>${R.move!=='stay'?`<span class="ul-arrow">${R.move==='up'?'▲':'▼'}</span><span class="ul-tier ul-t${R.to}">${C.ulTierName(R.to)}</span>`:''}</div>`;
      body=`<div class="setc"><section class="card"><h2 class="sec">${C.ulTierName(R.tier)} 리그 결과</h2>${badge}<p class="ul-res"><b>${R.rank}위</b> · ${R.w}승 ${R.l}패 ${R.t}무 · ${mv}${R.rank===1?' · <b>리그 우승</b>':''}</p>${R.pts!=null?`<p class="ul-pts">리그 점수 <b class="num">${R.pts}</b>${SS&&R.season===SS.id?` <span class="small muted">시즌 최고 ${SS.top} · 시즌 합 ${SS.sum}</span>`:''}</p>`:''}${ulNewBadges(U)}
        ${R.srv?`<p class="small ul-srv">${R.srv.queued?'서버에 연결되지 않아 결과를 이 기기에 두었습니다. 다음 연결 때 보냅니다.':`서버 시즌 포인트 <b class="num">+${R.srv.delta}</b>${R.srv.points?` (이번 시즌 ${R.srv.points})`:''} · 서버 단계 <b>${C.ulTierName(R.srv.tier)}</b> <button class="lnk small" data-a="itab" data-v="uld:rank">순위 보기</button>`}</p>`:''}
        <p class="small">내 최고 단계 <b>${C.ulTierName(S.best)}</b>${S.stay?` · 이 덱 ${C.ulTierName(S.stay.tier)} ${S.stay.n}리그째`:''} · 지금까지 ${S.leagues}리그</p>
        ${R.mvp?`<p class="small">시즌 MVP <b>${esc(R.mvp.name)}</b>(${esc(R.mvp.team)}) ${esc(R.mvp.txt)}</p>`:''}${R.myMvp?`<p class="small">우리 MVP <b>${esc(R.myMvp.name)}</b> ${esc(R.myMvp.txt)}</p>`:''}
        <p class="small muted">상대: 유저 ${R.src.user} · 우승 덱 ${R.src.cup} · AI 구단 ${R.src.ai}${R.edits?` · 덱 고침 ${R.edits}번`:''}</p>${msg}
        <div class="btns"><button class="btn primary" data-a="ulStart"${UL.busy||!U.deck||L?' disabled':''}>${T} 리그 시작</button></div></section></div>
        <div class="setc"><section class="card"><h2 class="sec">최종 순위</h2><table class="ul-st"><tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>무</th><th>OVR</th></tr>${R.stand.map(x=>`<tr class="${x.kind==='me'?'me':''}${x.rank<=2?' up':x.rank>=R.stand.length-1?' dn':''}"><td class="num">${x.rank}</td><td>${esc(x.name)} <span class="ul-k ul-k-${x.kind}">${UL_KIND[x.kind]}</span></td><td class="num">${x.w}</td><td class="num">${x.l}</td><td class="num">${x.t}</td><td class="num">${esc(C.cupOvrTxt(x.ovr))}</td></tr>`).join('')}</table></section></div>${R.rec?`<div class="setc">${ulRecHtml(R)}</div>`:''}`; } }
  else if(it.cur==='rank')body=ulRankHtml(U,msg);
  else { ulTiersLoad(); const TC=UL.tiers; const rows=C.UL_TIERS.map((n,i)=>({n,i})).reverse().map(({n,i})=>{ const b=S.by[i]; return `<div class="ul-trow${i===(U.tier|0)?' on':''}"><span class="ul-tier ul-t${i}">${n}</span><span class="small">등록 덱 <b class="num">${TC?TC[i]:'-'}</b>개 · 내 기록 ${b.n}리그 · 우승 ${b.win} · 승격 ${b.up} · 강등 ${b.down}</span>${i===(U.tier|0)?'<b class="small ul-here">◀ 내 위치</b>':''}</div>`; }).join('');
    const hist=U.hist.slice(-30).reverse().map(x=>`<p class="small">${x.y}년 ${C.ulTierName(x.tier)} ${x.rank}위 → ${x.move==='up'?'<b class="ul-up">승격</b>':x.move==='down'?'<b class="ul-dn">강등</b>':'잔류'} <span class="muted">${esc(x.name||'')}</span></p>`).join('');
    body=`<div class="setc"><section class="card"><h2 class="sec">단계표</h2>${head}<div class="ul-tiers">${rows}</div><p class="small muted">1·2위 승격 · 9·10위 강등 · 나머지 잔류. 높은 단계일수록 강한 덱을 만납니다.${TC?'':UL.tiersSt==='loading'?' 단계별 등록 덱 수를 받는 중입니다.':' 등록 덱 수는 래더 서버에 연결될 때 보입니다.'}</p></section></div>
      <div class="setc"><section class="card"><h2 class="sec">내 기록</h2><p class="small">치른 리그 <b>${S.leagues}</b> · 최고 단계 <b>${C.ulTierName(S.best)}</b> · 우승 <b>${S.by.reduce((a,b)=>a+b.win,0)}</b></p>${S.stay?`<p class="small">이 덱(${esc(S.stay.name||'')})은 ${C.ulTierName(S.stay.tier)}에서 ${S.stay.n}리그를 치렀습니다.</p>`:''}${ulBadgeHtml(U)}${ulSeasonsHtml(U)}<p class="dk-t">지난 리그</p>${hist||'<p class="small muted">아직 기록이 없습니다.</p>'}</section></div>`; }
  return `${it.bar}<div class="setx ws-own ulx">${body}</div>`; }
