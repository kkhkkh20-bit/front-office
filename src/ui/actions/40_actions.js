/* ---------- 동작 ---------- */
function roleLines(p){ const r=squadRole(p), k=keepWhy(p), o=oppSat(p); const L=[]; if(r)L.push(`<b>팀 내 역할</b> ${esc(r)}`); if(o)L.push(`<b>기회 만족</b> ${esc(o.lv)} · ${esc(o.why)}${o.gap?` <span class="muted">${esc(o.gap)}</span>`:''}`); if(k)L.push(`<b>보유 이유</b> ${esc(k)}`); return L.length?`<p class="small">${L.join('<br>')}</p>`:''; }
function bondCard(p){
  initPers(p); const m=p.mor;
  return `<section class="card"><div class="row between"><span class="eyebrow">선수와의 관계</span><span class="pill ${moodClass(m)}">기분 ${moodLabel(m)}</span></div>
  <p class="small">${esc(moraleWhy(p))}</p>${moraleBox(p)}${p.team===G.user?roleLines(p):''}
  <p class="small muted">성향: ${esc(mentalSum(p))}${p.promise?` · 출전 약속 ${dmd(p.promise.until)}까지`:''}${p.listed?' · 트레이드 명단':''}${G.med.hosp==='a'?` · 정밀 검진: 부상 체질 ${p.inj>.24?'취약':p.inj>.15?'보통':'튼튼'}`:''}</p>
  ${p.team===G.user?`<button class="btn small mt-go" data-a="meetOpen" data-v="pl:${p.id}">${avImg(p)}<span><b>개인 면담</b><i>${talkUsed(p,'praise')?'이번 주 칭찬·분발 촉구는 했습니다 · 고민은 언제든':'칭찬, 분발 촉구, 출전 기회, 계약, 고민'}</i></span></button>`:''}
  ${UI.talkMsg&&UI.talkMsg.id===p.id?`<div class="note ${UI.talkMsg.d>0?'good':UI.talkMsg.d<0?'bad':''}">${esc(UI.talkMsg.msg)}</div>${UI.talkMsg.ext?extTalkBtn(p,'btn small primary'):''}`:''}
  </section>`;
}
/* 면담에서 선수가 다년계약에 응하겠다고 하면: 연장 협상 버튼, 지금 열 수 없으면 그 이유(피드백 11-17 연장) */
function extTalkBtn(p,cls){ const why=extWhy(p); return why?`<p class="small muted ext-why">연장 협상은 지금 열 수 없습니다. ${esc(why)}</p>`:`<button class="${cls}" data-a="extNgt" data-v="${p.id}">연장 협상 시작</button>`; }
function devForm(p){const current=(G.ovs||[]).find(x=>x.pid===p.id);return `<section class="card"><div class="row between"><h2 class="sec">해외연수 · 목표와 결과</h2><button class="btn small" data-a="ovsCenter" data-v="${p.id}">해외 연수 화면에서 선수 고르기 ›</button></div>${current?`<p>${OVS[current.prog].l} · ${current.go?'참가 중':'출발 전 예약'}</p>${!current.go?`<button class="btn" data-a="ovsSet" data-v="${p.id}:">예약 취소</button>`:''}`:''}${overseasProgramDetails(p)}${UI.devMsg?`<p class="note" role="status">${esc(UI.devMsg)}</p>`:''}${(p.ovsH||[]).length?'<h3>귀국 후 실제 변화</h3>'+overseasHistory(p):''}</section>`;}

/* 중요한 소식으로 멈추면 홈이 아니라 소식함에서 그 소식을 연다(일반 진행·달력 진행·관전 공용) */
function stopsOpen(){ const sm=G.stops.find(s=>s&&s.id&&G.mail.some(m=>m.id===s.id)); UI.mail=null; UI.mf='all'; UI.tab='inbox'; if(sm){ UI.ibSel=sm.id; UI._ibToCur=true; sm.read=true; if(!wide())UI.ibOpen=sm.id; } }
function closeSheets(){ UI.cw=null;UI.relK=null;UI.matchPreview=false; const kw=UI.wkres&&(UI.game!=null||UI.sheet!=null); /* 결과 창 위에 연 박스스코어·선수 정보만 닫을 때는 결과 창을 남긴다 */ UI.ngt=null; UI.negWin=null; meetKeep(); UI.meet=null; UI.mgrCandidate=null; UI.fmKeys=false; if(UI.cfm){ UI.cfm=null; try{ cfmRender(); }catch(e){} } UI.cer=null;UI.cmpSh=null;UI.pcmpSh=null;UI.ivSh=null;UI.teamSh=null;UI.myRos=false;UI.person=null;UI.personMsg=null;const pk=UI.castRet&&UI.castRet.parked?UI.castRet:null; if(UI.cast||(UI.castRet&&!pk)){CT.tok++;CT.run=false;}UI.cast=null;UI.castRet=pk; /* 다른 화면으로 잠시 나간 중계(parked)는 남긴다 */UI.drawer=false;UI.menu=false;UI.sheet=null;UI.posSheet=null;UI.game=null;UI.mail=null;UI.confirmRel=null;UI.talkMsg=null;UI.devMsg=null;if(!kw)UI.wkres=null;renderSheet();spoilFlush();}
/* 대화 창(면담·인물·동석 관람·인터뷰) 위에 연 선수·인물 창만 닫고 그 대화로 돌아간다(카페 11-09d) */
/* 중계 도중 다른 화면(탭·메뉴·소식)으로 가면 중계를 닫지 않고 그 자리에 멈춰 둔다: 결과는 계속 가리고, '중계 이어 보기'로 돌아온다(플레이테스트 4 #1·#3) */
function castPark(){ const c=UI.cast, g=c&&G.games[c.g]; if(!c||!c.hold||c.fin||!g||(c.k||0)>=(g.pbp||[]).length)return false; try{ sndStopAll(); }catch(e){} c.wasPlay=!!c.play&&!c.pre; c.play=false; CT.tok++; CT.run=false; c.parked=1; UI.castRet=c; UI.cast=null; try{ save(); }catch(e){} return true; }
function closeTop(){ if(meetOver()){ UI.sheet=null; UI.person=null; renderSheet(); return true; } if(UI.sheet!=null&&(UI.person||UI.cw||UI.ivSh)){ UI.sheet=null; renderSheet(); return true; } return false; }
const A={
  teamInspect(v){ const tid=Number(v); if(!G.teams.some(t=>t.id===tid))return; if(tid===G.user&&!G.unemp){ UI.clubInspect=null; return A.go('club:info'); } if(UI.clubInspect!==tid)UI.clubInspectTab=UI.clubInspectTabs?.[tid]||'overview'; closeSheets(); UI.fromMail=null; UI.clubInspect=tid; UI.tab='club'; render(); window.scrollTo(0,0); },
  teamInspectTab(v){ if(!CLUB_PROFILE_TABS.some(x=>x[0]===v)||UI.clubInspect==null)return; UI.clubInspectTab=v; UI.clubInspectTabs=UI.clubInspectTabs||{}; UI.clubInspectTabs[UI.clubInspect]=v; closeSheets(); render(); },
  teamInspectExit(){ UI.clubInspect=null; A.go('league:stand'); },
  clubRecordSort(v){ const [tid,kind,sort]=String(v).split(':'); const allowed=kind==='bat'?['war','h','hr','rbi','sb']:kind==='pit'?['war','w','sv','so','outs']:[]; if(!allowed.includes(sort))return; UI.clubRecordViews=UI.clubRecordViews||{}; const view=UI.clubRecordViews[tid]=UI.clubRecordViews[tid]||{}; view[kind]={sort,page:0}; const y=document.querySelector('.club-profile-body')?.scrollTop||0; render(); const el=document.querySelector('.club-profile-body'); if(el)el.scrollTop=y; },
  clubRecordPage(v){ const [tid,kind,page]=String(v).split(':'); if(!['bat','pit'].includes(kind))return; UI.clubRecordViews=UI.clubRecordViews||{}; const view=UI.clubRecordViews[tid]=UI.clubRecordViews[tid]||{}; view[kind]=Object.assign({sort:'war'},view[kind],{page:Math.max(0,+page||0)}); const y=document.querySelector('.club-profile-body')?.scrollTop||0; render(); const el=document.querySelector('.club-profile-body'); if(el)el.scrollTop=y; },
  clubChronFilter(v){ const [tid,key,val]=String(v).split(':'); if(!['year','kind'].includes(key))return; UI.clubArchive=UI.clubArchive||{}; UI.clubArchive[tid]=Object.assign({},clubArchiveState(+tid),{[key]:val,page:0}); render(); },
  clubChronPage(v){ const [tid,page]=String(v).split(':'); UI.clubArchive=UI.clubArchive||{}; UI.clubArchive[tid]=Object.assign({},clubArchiveState(+tid),{page:Math.max(0,+page||0)}); render(); },
  staffTalk(v){const [kind,id,topic]=v.split(':');UI.staffMsgs=UI.staffMsgs||{};UI.staffMsgs[id]=staffTalk(kind,id,topic);save();if(UI.person)renderSheet();else render();},
homePage(v){UI.homePage=Math.max(0,(UI.homePage||0)+(+v));UI.homeFocus=null;render();},homeOpenCard(v){UI.homeFocus={view:UI.homePanel||'overview',index:+v};render();},homeCloseCard(){UI.homeFocus=null;render();},
homeTasks(){UI.homePanel='work';UI.homePage=0;UI.homeFocus={view:'work',index:0};render();},

 matchOpen(){UI.matchPreview=true;renderSheet();},
 matchLater(){UI.matchPreview=false;renderSheet();},
 matchWatch(){UI.matchPreview=false;A.watchNext();},
 matchSim(){const next=nextGames(1)[0],request=gmWatchChoose(next,G.simPlanned||G.watchPlanned);if(!request){toast('남은 우리 경기가 없습니다.');G.matchAwait=null;render();return;}G.simPlanned=request;UI.matchPreview=false;G.watchPlanned=null;G.matchAwait=null;if(G.res&&!G.live)G.res=null;if(blocker()){save();render();return;}const day=G.day;advance('next',{skipMatchStop:true});G.res=gmWatchResult(G.simPlanned||request);if(G.res)G.simPlanned=null;closeSheets();UI.tab='home';save();render();setTimeout(()=>dayTick(day),30);}
,
  prepSide(v,el,e,auto){const [sd,d]=v.split(':');if(!auto)UI.prepManual=true;UI.prepAt=Date.now();UI.prepSide=sd;UI.prepSideG=+d;document.querySelectorAll('.cs-pcard').forEach(e=>{e.hidden=e.dataset.side!==sd;});document.querySelectorAll('.cs-prep-side button').forEach(b=>{const on=b.dataset.v.startsWith(sd+':');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});},
  prepPage(){const el=document.querySelector('.cs-prep');if(!el)return;el.dataset.page=el.dataset.page==='0'?'1':'0';const b=el.querySelector('[data-a="prepPage"]');if(b)b.textContent=el.dataset.page==='0'?'6~9번 보기':'1~5번 보기';},
  homePanel(v){UI.homePanel=v;UI.homePage=0;UI.homeFocus=null;render();},
  homeNews(v){UI.homeNews=+v;render();},
  detailBack(){if(UI.fmKeys){UI.fmKeys=false;render();return;}if(UI.cosm&&UI.sheet==null&&typeof A.cosmClose==='function'){A.cosmClose();return;} /* 이름·얼굴 일괄 수정 창(72_cosmetic.js): 뒤로·Esc로 닫는다 */if(closeTop())return;if(UI.meet){A.meetClose();return;}if(UI.ngt){UI.ngt=null;renderSheet();render();return;}if(UI.negWin){UI.negWin=null;renderSheet();render();return;}if(UI.castRet&&!UI.castRet.parked&&UI.sheet!=null){const c=UI.castRet;UI.sheet=null;UI.castRet=null;UI.cast=c;c.play=!!c.wasPlay&&c.k<G.games[c.g].pbp.length;renderSheet();return;}closeSheets();},
  mgrCandidate(v){UI.mgrCandidate=v;UI.mgrMsg=null;renderSheet();},
  analysisY(v){ UI.analysisY=+v; renderSheet(); },
  smkGo(v){ UI.smkK=v; UI.smkSrc='free'; A.go('staff:smkt'); }, smkK(v){ UI.smkK=v; render(); }, smkSrc(v){ UI.smkSrc=v; render(); }, /* 스태프 시장 */
  dlSpd(v){ UI.dspeed=v; render(); },
  dlStop(){ dliveStop(); },
  dlSkip(){ const L=UI.dl; if(L){ L.on=false; clearTimeout(L.t); } if(G.fd&&!G.fd.done)fdAdvance(true); else if(G.draft&&!G.draft.done)advanceDraft(true); save(); render(); },
  sdiff(v){ UI.diff=v==='hard'?'hard':'norm'; render(); },
  seasy(v){ UI.easy=v==='1'; render(); }, sguide(v){ UI.guideNo=v==='0'; render(); }, /* 새 게임 진행 방식(첫 시즌 안내, 55_guide_bar.js) */
  hardOff(){ if(G&&G.cfg&&G.cfg.hard){ G.cfg.hard=false; G.cfg.hardOffY=G.year; toast('난이도를 보통으로 낮췄습니다. 이 게임에서는 다시 하드로 올릴 수 없습니다.'); save(); render(); } },
  smode(v){ UI.smode=v; UI.sstep='team'; render(); window.scrollTo(0,0); },
  tsGo(v){ UI.sstep=v; if(v==='main'){ UI.newSlot=null; UI.slotMsg=''; } render(); window.scrollTo(0,0); },
  toTitle(){ if(G&&!saveOK()){ toast(`지금 게임(${dstr(G.day)})을 저장하지 못해 처음 화면으로 가지 않았습니다. 그대로 닫으면 마지막 저장 이후 진행이 사라집니다. ${SAVE_ERR||''}`.trim()); return; } if(saveHold(()=>A.toTitle(),'처음 화면으로 가지'))return; /* 보조 저장소에 쓰는 중이면 확정을 기다린다(외부 검수 11-17) */ /* 검수 11-07 */ closeSheets(); UI.slotMsg=''; UI.title=true; UI.sstep='main'; render(); window.scrollTo(0,0); },
  async tsCont(){const n=G?(slotHas(curSlot())?curSlot():contSlot()):contSlot();if(n==null){UI.slotMsg='이어 할 저장이 없습니다.';render();return false;}if(meta().slots[n]?.lock)return A.slotLoadNew(n);if(G&&!SAVE_CONFL&&n===curSlot()&&slotHas(n)&&revOf(meta(),n)===SLOT_REV){UI.title=false;render();return true;}return A.slotLoad(n);},
  fdPick(v){ const pk0=G.fd&&G.fd.picks[G.fd.cur]; const id=+v; const n0=G.fd?G.fd.cur+1:0; const g0=fdGrade(G.players[id]); const r=fdPick(id); UI.sheet=null; renderSheet(); if(!r&&pk0){ dlFeedAdd('fd',pk0,id); UI.rev=revMake(id,pk0,n0); if(UI.rev&&g0)UI.rev.g0=g0.g; } UI.fdMsg=r; save(); render(); },
  fdBegin(){ if(!G.fdWait)return; G.fdWait=false; G.mail.forEach(m=>{ if(m.from==='구단주실'&&(m.acts||[]).some(a=>a.a==='fdBegin')){ m.read=true; } }); fdStart(); UI.mail=null; UI.tab='home'; save(); render(); window.scrollTo(0,0); },
  fdOpen(){ if(G.fd){ G.fd.open=true; G.stops=(G.stops||[]).filter(m=>!String(m.subj||'').startsWith('창단 드래프트: 모든')); G.mail.forEach(m=>{ if(String(m.subj||'').startsWith('창단 드래프트: 모든'))m.read=true; }); closeSheets(); save(); render(); window.scrollTo(0,0); const pk=G.fd.picks[G.fd.cur]; if(pk&&pk.tid!==G.user)setTimeout(()=>dliveStart('fd'),300); /* 시작하면 다른 구단 지명이 바로 흐른다 */ } },
  fdHide(){ UI.fdHide=!(UI.fdHide==null?true:UI.fdHide); UI.fdMore=60; render(); },
  dlSpdC(){ const o=['slow','norm','fast']; const i=o.indexOf(UI.dspeed||'norm'); A.dlSpd(o[(i+1)%3]); },
  fdTab(v){ UI.fdTab=v; render(); window.scrollTo(0,0); },
  fdSlot(v){ UI.fdTab='list'; if(v==='P'){ UI.fdG='P'; UI.fdF='all'; } else { UI.fdG='B'; UI.fdF=v==='DH'?'all':v; } UI.fdSub=1; UI.fdMore=60; UI.fdS=''; UI.fdAb=[]; render(); const el=document.querySelector('.fdt-w'); if(el)el.closest('.card').scrollIntoView({behavior:'smooth',block:'start'}); },
  revClose(){ UI.fdJust=UI.rev?UI.rev.pid:null; UI.rev=null; render(); if(G.fd&&!G.fd.done&&G.fd.picks[G.fd.cur]&&G.fd.picks[G.fd.cur].tid!==G.user)setTimeout(()=>dliveStart('fd'),250); },
  fdAdv(){ dliveStart('fd'); },
  fdListMore(){ UI.fdMore=(UI.fdMore||60)+60; render(); },
  fdPlus(){ const F=G.fd; if(!F||F.done)return; F.man=Math.min(FD_ROUNDS,(F.man||FD_MAN)+FD_MORE); save(); render(); dliveStart('fd'); },
  fdAuto(){ fdAdvance(false,true); save(); render(); window.scrollTo(0,0); },
  fdV(v){ UI.fdV=v; render(); }, fdY3(v){ UI.fdY3=v==='1'; render(); }, /* 성적 탭: 지난 시즌 ↔ 최근 3년(1군 합산) */ /* 탭은 보이는 열만 바꾼다. 정렬·필터·선수 순서는 그대로 */
  meetOpen(v){ const [h,ask]=String(v).split('|'); const [k,id]=h.split(':'); meetOpen(k,id!=null?+id:null,{ask}); },
  meetDo(v){ if(UI.meet){UI.meet.optsY=document.querySelector('.mt-opts')?.scrollTop||0;UI.meet.topic=v;}meetDo(v);render(); },
  ngtOpen(v){ const [k,id]=String(v).split(':'); UI._ngtY=0; ngtOpen(k,+id); },
  ngtSet(v){ const s=document.querySelector('#sheet .sheet.ngt'); UI._ngtY=sheetScrollY(); ngtSet(v); renderSheet(); },
  ngtDemand(){ const N=UI.ngt; if(!N)return; const s=document.querySelector('#sheet .sheet.ngt'); UI._ngtY=sheetScrollY(); const D=ngtDemand(N); N.T=ngtClean({...D,years:N.T.years===D.years||N.k==='fa'?D.years:N.T.years,optC:N.T.optC}); if(N.k==='ext')N.T.role=null; N.ed='dem'; N.kept=false; renderSheet(); },
  ngtSubmit(){ if(!contractMoneyValid())return; const s=document.querySelector('#sheet .sheet.ngt'); UI._ngtY=0; ngtSubmit(); save(); render(); renderSheet(); },
  ngtCounter(){ UI._ngtY=0; ngtCounter(); save(); render(); renderSheet(); },
  ngtLock(v){ UI._ngtY=sheetScrollY(); ngtLock(v); renderSheet(); },
  ngtCtrNo(){ ngtCtrNo(); save(); renderSheet(); },
  ngtCtrEdit(){ ngtCtrEdit(); renderSheet(); },
  ngtChat(){ const N=UI.ngt; if(!N)return; N.chatOpen=!N.chatOpen; renderSheet(); },
  ngtTab(v){ const N=UI.ngt; if(!N)return; N.tab=v==='prom'?'prom':'terms'; renderSheet(); }, /* 협상 조건 · 약속 탭(계약 2단계) */
  ngtWithdraw(){ const N=UI.ngt; if(!N)return; delete G.fa.offers[N.id]; N.msg='제안을 거둬들였습니다.'; save(); render(); renderSheet(); },
  ngtClose(v,el,e){ if(el&&el.classList.contains('scrim')&&e&&e.target.closest('[data-stop]'))return; UI.ngt=null; renderSheet(); render(); },
  meetClose(){ const M=UI.meet,y=M?.returnY||0;meetKeep();UI.meet=null;if(M){UI.sheet=M.bs;UI.person=M.bp;}render();if(M?.returnDetail&&document.documentElement.classList.contains('detail-page-open'))sheetScrollTo(y);else scrollTo(0,y); },
  annClose(){ (UI.annQ||[]).shift(); annRender(); },
  annPlayer(v){ (UI.annQ||[]).shift(); annRender(); A.player(+v); },
  pactSel(v){ const id=+v; let L=UI.pactSel||[]; L=L.includes(id)?L.filter(x=>x!==id):L.concat(id).slice(-2); UI.pactSel=L; render(); },
  pactGo(){ UI.pactMsg=pactPropose(UI.pactSel||[]); UI.pactSel=[]; save(); render(); },
  pactKeep(){ try{ toast('유망주 기회 합의를 그대로 이어갑니다.'); }catch(e){} render(); },
  pactEnd(){ if(G.pact)G.pact.on=false; UI.pactMsg='합의를 끝냈습니다. 감독은 본래 판단대로 기용합니다.'; save(); render(); },
  rqSlot(v){ const k=v==='SP'||v==='RP'?v:v==='DH'?'1B':v; UI.rec=Object.assign({type:'now',age:'',sal:''},UI.rec||{},{k}); A.rqGo(); A.go('trade:req'); },
  rqGo(){ const c=Object.assign({k:'SS',type:'now',age:'',sal:''},UI.rec||{}); const R=recruitReport({k:c.k,type:c.type,age:+c.age||0,sal:+c.sal||0}); UI._rec=Object.assign(R,{k:c.k,type:c.type}); render(); },
  plEx(v){ const id=+v; if(!G.plEx||G.plEx.y!==G.year)G.plEx={y:G.year,ids:[]}; if(!G.plEx.ids.includes(id))G.plEx.ids.push(id); save(); render(); },
  plExClear(){ if(G.plEx)G.plEx.ids=[]; save(); render(); },
  planPick(v){ const [k,p]=String(v).split(':'); if(k!=='')UI.planK=+k; if(p)UI.planPos=p; render(); },
  evDelegOff(){ G.deleg={}; save(); render(); try{ toast('일상 결정도 다시 직접 정합니다.'); }catch(err){} },
  fdAutoN(v){ const F=G.fd; if(!F||F.done)return; const c0=fdAutoRun(+v||5); if(c0==null)return;
    for(const x of F.picks.slice(c0,F.cur))if(x.pid)dlFeedAdd('fd',x,x.pid); /* 상황판 최근 지명도 맡긴 지명까지(검수 11-09zd) */
    UI.rev=null; save(); render(); const M=F.done?null:fdMoney(); try{ toast(F.done?'창단 드래프트가 끝났습니다.':fdManDone()?`${F.man}라운드 직접 지명을 마쳤습니다. 나머지를 맡기거나 더 뽑을지 고르세요.`:`자동 지명을 마쳤습니다. 다시 우리 차례입니다.${M&&M.room<0?` 연봉 한도를 ${money(-M.room)} 넘었습니다.`:''}`); }catch(e){} },
  fdF(v){ UI.fdF=v; UI.fdSub=0; UI.fdMore=60; render(); }, fdPos(v){ const [g,k]=String(v).split(':'); UI.fdSub=0; if(UI.fdG!==g){ UI.fdG=g; UI.fdS=''; UI.fdD=0; UI.fdAb=[]; } UI.fdF=k; UI.fdMore=60; render(); }, fdAb(v){ const a=new Set(UI.fdAb||[]); a.has(v)?a.delete(v):a.add(v); UI.fdAb=[...a]; UI.fdMore=60; render(); }, fdS(v){ if(UI.fdS===v&&v!=='rec')UI.fdD=UI.fdD?0:1; else { UI.fdS=v; UI.fdD=0; } UI.fdMore=60; render(); },
  fdG(v){ UI.fdG=v; UI.fdF='all'; UI.fdSub=0; UI.fdS=''; UI.fdAb=[]; UI.fdMore=60; render(); }, fdY(){ UI.fdY=!UI.fdY; render(); }, fdLog(){ UI.fdLog=!UI.fdLog; render(); }, fdLogT(v,el){ UI.fdLogT=el&&el.value!=null?el.value:v; render(); }, fdFilt(){ UI.fdFiltOpen=!UI.fdFiltOpen; render(); }, fdNeed(){ UI.fdNeed=!UI.fdNeed; render(); }, fdQ(){ UI.fdQ=!UI.fdQ; UI.fdMore=60; render(); }, fdPol(v){ G.fdPol=v; save(); render(); }, fdPolB(v){ A.fdPol(v); }, fdAgeR(v){ const [x,y]=String(v).split('-').map(Number); UI.fdA0=x; UI.fdA1=y; UI.fdMore=60; render(); }, fdLogTB(v){ UI.fdLogT=v; render(); }, drdB(v){ const [id,r]=String(v).split(':').map(Number); dmemoOf(id).rd=r; save(); render(); }, fdO(){ UI.fdO=!UI.fdO; render(); }, fdMore(){ UI.fdMore=(UI.fdMore||60)+60; render(); },
  nsTalk(){ UI.stadMsg=newStadTalk(); save(); render(); },
  stadXpTalk(v){ UI.stadMsg=stadXpTalk(G.user,v); save(); render(); },
  stadXpStart(){ UI.stadMsg=stadXpStart(G.user); save(); render(); },
  nsPick(v){ UI.stadMsg=newStadPick(v); save(); render(); },
  nsDrop(){ UI.stadMsg=newStadDrop(); save(); render(); },
  retireGM(){ retireGM(); save(); render(); },
  dhy(v){ UI.dhy=+v; render(); },
  dealOpen(v){ UI.dealOpen=+v; render(); },
  stadPrice(v){ stadOf(G.user).price=+v; save(); render(); },
  stadBuild(v){ UI.stadMsg=stadStart(v); save(); render(); },
  openMail(v){ if(!v)return; const m=G.mail.find(x=>x.id===v); if(!m)return; m.read=true; ibReadDup(v); if(!mailFilter(UI.mf||'all').some(x=>x.id===v))UI.mf='all'; UI.mailFocus=v; UI.tab='inbox'; closeSheets(); save(); render(); },
  mailJump(v){ if(!v)return;if(UI.cast&&!castPark())A.castClose(true); /* 중계 위에서 다른 화면·진행을 누르면 중계를 닫고 간다(사용자 제보 11-06: 경기 끝난 중계에서 '계속'을 눌러도 화면이 그대로) */  const m=G.mail.find(x=>x.id===v); if(!m)return; m.read=true; ibReadDup(v); UI.ibSel=v; UI._ibToCur=true; UI._ibDay=G.day; if(!wide()){ if(!UI.ibOpen)UI.ibY=window.scrollY; UI.ibOpen=v; } UI.tab='inbox'; save(); render(); if(!wide())window.scrollTo(0,0); },
  ibBack(){ UI.ibOpen=null; render(); },
  ibMore(){ UI.ibN=(UI.ibN||80)+80; UI._ibLS=0; UI._ibEnd=false; render(); },
  ibDecideGo(){ const m=ibDecideList()[0]; if(!m)return toast('결정할 일이 없습니다.'); UI.mf='all'; const F=ibFolds(); if(F[m.day])delete F[m.day]; A.mailJump(m.id); },
  ibUnreadGo(){ const m=ibUnreadOrder()[0]; if(!m)return toast('안 읽은 소식이 없습니다.'); UI.mf='all'; const F=ibFolds(); if(F[m.day])delete F[m.day]; A.mailJump(m.id); },
  ibReturn(){ const id=UI.fromMail; UI.fromMail=null; UI.tab='inbox'; UI.mf='all'; if(id&&G.mail.some(m=>m.id===id)){ UI.ibSel=id; UI._ibToCur=true; if(!wide())UI.ibOpen=id; } closeSheets(); render(); },
  inbox(){ UI.fromMail=null; UI.tab='inbox'; UI._ibFirst=true; UI.ibOpen=null; closeSheets(); render(); },
  ibFold(v){ const F=ibFolds(); const d=+v; if(F[d])delete F[d]; else F[d]=true; save(); render(); },
  ibFoldOld(){ const F=ibFolds(); if(Object.keys(F).length){ G.ibFold={}; } else { const days=[...new Set(ibList(UI.mf||'all').map(m=>m.day))]; days.slice(1).forEach(d=>F[d]=true); /* 최신 날짜만 펴 둔다 */ } save(); render(); },
  ibTop(){ const L=document.querySelector('.ibx-list'); if(L)L.scrollTo({top:0,behavior:'smooth'}); },
  ibNeedGo(){ const n=ibNeedList(); if(!n.length)return; UI.mf='all'; A.mailJump(n[0].id); },
  psSel(v){ UI.psSel=v; render(); },
  franSet(v){ toast(franSet(v===''||v==null?null:+v)); save(); render(); }, /* 프랜차이즈 예외 지정(38_finance_tab) */
  itab(v){ const [k,t]=v.split(':'); UI.it=UI.it||{}; UI.it[k]=t; render(); },
  pgGo(v){ const i=v.lastIndexOf(':'); const k=v.slice(0,i), n=+v.slice(i+1); UI.pg=UI.pg||{}; UI.pg[k]=Math.max(0,n); render(); const el=document.querySelector(`[data-pg="${k}"]`); if(el)el.scrollIntoView({block:'start'}); else window.scrollTo(0,0); },
  help(){ const on=!helpOn(); try{ localStorage.setItem('danjang-help',on?'1':'0'); }catch(e){} render(); try{ toast(on?'설명을 화면에 펼쳐 보입니다.':'설명을 접었습니다. 제목 옆 i를 누르면 볼 수 있습니다.'); }catch(e){} },
  nk(v){ UI.nk=v; A.go('club:news'); },
  recGo(v){ const [seg,k]=v.split(':'); UI.lrec=seg; UI.ls=UI.ls||{}; UI.ls[seg]={k,dir:['era','whip','bb9'].includes(k)?1:-1}; A.go('league:rec'); },
  pmgmt(v){ A.player(v); UI.ptab='mgmt'; renderSheet(); },
  mailAct(v){ const [id,i]=v.split(':'); const m=G.mail.find(x=>x.id===id); if(!m)return; const a=m.acts[+i]; m.read=true; if(!a)return; if(a.a==='meetOpen'&&a.v==='mgr'&&m.ref!=null&&/약속은 어디 갔습니까/.test(m.subj))a.v=`mgr|use:${m.ref}`; /* 예전 저장의 약속 위반 메일도 그 선수 건의로(카페 11-09) */const status=mailButtonStatus(m,a);if(status){toast(status.text);render();return;} UI.actRes=null; UI.actFail=null; if(a.a==='meetOpen'&&m.subj.includes('감독이 단장실에 들렀습니다'))meetOpen('mgr',null,{visit:true}); else if(a&&A[a.a])A[a.a](a.v); else render(); if(UI.actFail&&UI.actRes)try{ toast(UI.actRes); }catch(e){} if(a&&(MAIL_ONCE.test(a.a)||a.a==='pactKeep'||a.a==='tripPlanGo')&&!UI.actFail){ a.done=true; a.res=UI.actRes||'처리했습니다.'; if(a.a==='pactKeep')m.closed=mailEnd('유망주 기회 합의를 유지하기로 했습니다.'); if(a.a==='tripPlanGo')m.closed=mailEnd(a.res); /* 보낸 출장 안 메일은 세 버튼 모두 완료로(리뷰② 11-17) */ if(/^(posReq|fcampSet)/.test(a.a)){ const g=a.a.startsWith('posReq')?/^posReq/:/^fcampSet$/; m.acts.forEach(x=>{ if(g.test(x.a))x.done=x.done||x!==a&&'skip'; }); } save(); render(); } if(UI.tab!=='inbox'){ UI.fromMail=id; render(); } }, /* 소식의 버튼으로 다른 화면에 가면 '소식함으로' 돌아오는 버튼을 띄운다 */
  expGmCancel(){ const r=expGmCancel(); save(); toast(r); render(); }, /* 창단 단장 수락 취소(11월 20일 부임 전까지) */
  evPick(v){ const [id,i]=v.split(':'); const e=(G.evs||[]).find(x=>x.id===id); const r=evPick(id,+i); save(); if(e&&!e.done){ if(r)toast(r); render(); return; } /* 고를 수 없는 선택이면 이유만 알린다(검수 11-09z) */ sfx('confirm',.6); if(e&&e.res)toast(e.res.split('\n')[0].slice(0,140)); /* 결정 결과를 바로 알린다(본문도 전부 펼침) */ if(e&&e.k==='agent'&&+i===0&&G.players[e.data.pid]){ A.extNgt(e.data.pid); return; } /* 다년계약 요구를 받아들이면 바로 연장 협상 창을 연다. 열 수 없으면 이유를 알리고 선수 화면만(피드백 11-17 연장) */ if(e&&e.k==='fx'&&+i===0){ const fp=G.players[e.data&&e.data.pid]; UI.ff=Object.assign({t:'yb',r:'all',s:'cur'},UI.ff||{}); UI.ff.t=fp&&fp.foreign==='아시아'?'asia':'yb'; UI.ff.r='all'; A.go('transfer:foreign'); return; } /* 그 선수 종류의 후보 탭으로(플레이 테스트 11-13: 일반 외국인인데 아시아쿼터 탭이 열림) */ if(e&&e.k==='ret'&&/코치 우선 협상/.test((e.opts[+i]||{}).l||'')){ A.go('staff:coach'); return; } /* 은퇴 선수를 코치 후보로: 바로 코치진 계약 화면으로 */ render(); },
  readAll(){ G.mail.forEach(m=>m.read=true); save(); render(); },
  mf(v){ UI.mf=v; UI.ibSel=null; UI.ibOpen=null; UI._ibFirst=true; render(); },
  goWork(v){ const g=GW[v]||['home']; A.go(g.join(':')); },
  go(v){ UI.clubInspect=null; v=String(v);if(UI.cast&&!castPark())A.castClose(true); /* 중계 위에서 다른 화면·진행을 누르면 중계를 닫고 간다(사용자 제보 11-06: 경기 끝난 중계에서 '계속'을 눌러도 화면이 그대로) */  UI.it=UI.it||{}; if(v==='club:uld'||v==='uld')v='uld:lobby'; /* 예전 자리(구단 › 유저 래더) → 래더 로비(사용자 11-17) */ if(v==='league:news')v='club:news'; if(v==='league:fans')v='club:fans'; if(v==='staff:mil'||v==='roster:mil'){ UI.it.roster='mil'; UI.rosterTeam=null; return A.tab('roster'); } if(v==='club:set'||v==='club:auth')v='cfg:'+v.split(':')[1]; if(v==='train'||v==='train:camp'||v==='train:dev'||v==='train:lead')v='staff:'+(v.split(':')[1]||'camp'); else if(v==='staff:fac'||v==='train:fac'){ UI.it.inv='train'; v='club:inv'; } else if(v==='club:stad'){ UI.it.inv='home'; v='club:inv'; } else if(v==='club:bus'){ UI.it.inv='bus'; v='club:inv'; } if(v==='scout'||v==='scout:draft')v='transfer:draft'; else if(v==='scout:scouts')v='staff:scouts'; else if(v==='scout:intl'){ UI.it=UI.it||{}; UI.it.fview='net'; v='transfer:foreign'; }
    { const [t0,s0]=String(v).split(':'); const par=ALIAS[t0]&&ALIAS[t0][s0]; UI.it=UI.it||{}; if(par){ if(par===s0)delete UI.it['mg_'+t0+'_'+par]; else UI.it['mg_'+t0+'_'+par]=s0; } } /* 묶음 탭 자체로 가면 그 탭의 기본 안쪽 화면(PC 구단 정보는 개요) */
    { const IG={'club:mkt':['club:fin','fin','bud'],'club:cap':['club:fin','fin','lim'] /* 샐러리캡·프랜차이즈 지정 */,'league:abroad':['league:hist','histv','abroad'],'league:teams':['league:stand','stand','map'],'trade:find':['trade:market','mkv','find'],'trade:req':['trade:market','mkv','req'],'transfer:watch':['transfer:foreign','fview','watch'],'transfer:net':['transfer:foreign','fview','net'],'league:find':['trade:market','mkv','find']}; if(IG[v]){ UI.it=UI.it||{}; UI.it[IG[v][1]]=IG[v][2]; v=IG[v][0]; } }
    if(v==='roster:plan')UI.rosterTeam=null; /* 선수단 계획은 우리 구단만 */
    if(v==='staff:pact'||v==='staff:mreq'){ UI.it=UI.it||{}; UI.it.mgrv='rel'; v='staff:mgr'; }
    if(v==='league:find')v='trade:find'; if(v==='trade:fa')v='transfer:fa'; if(v==='transfer:trade')v='trade:table'; if(v==='transfer:block')v='trade:offers'; const [t,s]=v.split(':'); closeSheets(); UI.tab=t; if(t==='roster'&&s){ UI.it=UI.it||{}; UI.it.roster=s; } if(s){ if(t==='league')UI.lseg=s; else {UI.sub=UI.sub||{}; UI.sub[t]=s;} } render(); window.scrollTo(0,0); },
  sub(v){ A.go(v); },
  menu(){ UI.sheet=null;UI.mail=null;UI.game=null;UI.posSheet=null; UI.menu=true; renderSheet(); },
  ffset(v){ const [k,x]=v.split(':'); UI.ff=Object.assign({t:'yb',r:'all',s:'cur'},UI.ff||{}); UI.ff[k]=x; if(k==='t'){ UI.ff.r='all'; const on=document.querySelector('[data-a="itab"][data-v^="fview:"].on'); if(on)(UI.it=UI.it||{}).fview=on.dataset.v.split(':')[1]; } /* 외국인↔아시아쿼터를 바꿔도 보던 탭(후보·우리 선수 등)을 그대로(카페 11-09b) */ UI.fmsg2=''; render(); },
  setIntl(v){ const [r,l]=v.split(':'); G.intl[r]=+l; addLog(`${IREG[r].l} 스카우트망을 ${INET[+l].l} 단계로 조정했습니다.`); save(); render(); },
  tutSkip(){ tutSkip(); save(); render(); },
  hireMgr(v){ const [id,y,c]=v.split(':'); { const blk=mgrHireBlk(); if(blk){ UI.mgrMsg=blk; toast(blk); render(); return; } } /* 현 감독 경질을 뜻하는 선임은 구단주 동의가 먼저(검수 11-17 #244) */ const err=hireMgr(id,+y,c==='1',UI.mplSel||[]); if(err){ UI.mgrMsg=err; toast(err); render(); return; } UI.mplSel=[]; UI.mgrCandidate=null; UI.confirmFire=false; save(); render(); const m=G.mgr[G.user]; if(m&&m.id===id&&!m.interim)meetOpen('mgr',null,{first:true}); },
  fireAsk(){ const r=mgrFireAsk(); if(r.k==='ok')UI.confirmFire=true; else { UI.confirmFire=false; try{ toast(r.msg); }catch(e){} } save(); render(); }, fireCancel(){ UI.confirmFire=false; render(); }, /* 감독 경질은 구단주 동의가 먼저(11-12) */
  fireMgr(){ if(!mgrFireOk()){ UI.confirmFire=false; try{ toast('구단주 동의가 있어야 경질할 수 있습니다.'); }catch(e){} render(); return; } fireMgr(); if(G.mcf)G.mcf.fire=null; UI.confirmFire=false; save(); render(); },
  renewMgr(v){ const [y,tid,mid]=String(v||2).split(':'); const r=renewMgr(+y,tid,mid); if(r)toast(r); save(); render(); },
  setPrev(v){ G.med.prev=+v; G.medSet=true; save(); render(); },
  setHosp(v){ const L=setHospital(v); if(L&&L.length)note('의무',`재활 중인 선수 남은 기간: ${L.join(', ')}`); save(); render(); },
  medOk(){ G.medSet=true; save(); render(); },
  talk(v){ const [id,k]=v.split(':'); const r=talk(+id,k); UI.talkMsg={id:+id,msg:r.msg,d:r.d||0,ext:!!r.ext}; save(); render(); },
  ovsSet(v){ const [id,k]=v.split(':'); UI.devOk=false; UI.devMsg=setOvs(+id,k||null); save(); if(UI.sheet!=null)renderSheet(); render(); },
  fallSet(v){ UI.devMsg=setFall(v||null); save(); render(); },
  fallGo(){ UI.it=Object.assign(UI.it||{},{devv:'ovs',ovsMode:'support'}); closeSheets(); A.go('staff:dev'); }, /* 소식·안내의 '가을 교육리그 신청하기': 육성 > 해외연수 > 교육리그·지원으로 바로 */
  listP(v){ listPlayer(+v); save(); render(); },
  tsugGo(v){ const [src,i]=v.split(':'); const s=(src==='k'?UI._tsugK:src==='f'?UI._find:src==='r'?((UI._rec&&UI._rec.list)||[]):UI._tsug||[])[+i]; if(!s||!tsugValid(s)){ UI.deskMsg='상황이 바뀌어 다시 찾아야 합니다.'; UI.deskOk=false; render(); return; }
    const r=proposeTrade(s.tid,s.give,[s.id]); UI.deskMsg=r.msg; UI.deskOk=r.ok; if(r.ok){ sfx('cheer_hit',.5); UI.stamp={fans:(()=>{ try{ return tradeFanLines(); }catch(e){ return []; } })(),msg:r.msg,grade:r.grade}; G.tsug=null; UI.cmpK=null; if(src==='f')UI.findT=null; } save(); render(); },
  tsugEdit(v){ const [src,i]=v.split(':'); const s=(src==='k'?UI._tsugK:src==='f'?UI._find:src==='r'?((UI._rec&&UI._rec.list)||[]):UI._tsug||[])[+i]; if(!s)return; const p=G.players[s.id]; UI.trade={tid:s.tid,give:[...s.give],get:[s.id],msg:'',seg:p&&p.isP?'pit':'bat',side:'give',sort:'cur'}; A.go('trade:table'); },
  tsugMore(){ tradeSuggest(true); UI.deskMsg=null; UI.dealOpen=null; render(); },
  cmpT(v){ if(v!=='')UI.cmpT=+v; UI.cmpSh=true; renderSheet(); return; },
  cmpGo(v){ UI.cmpK=v; A.cmpT(''); },
  cmpK(v){ UI.cmpK=UI.cmpK===v?null:v; render(); },
  keepP(v){ keepPlayer(+v); save(); render(); },
  tab(v){ UI.clubInspect=null; if(v==='roster'&&UI.tab==='roster'&&(UI.trimOn||document.querySelector('.trimc')))return A.trimClose();if(UI.cast&&!castPark())A.castClose(true); /* 중계 위에서 다른 화면·진행을 누르면 중계를 닫고 간다(사용자 제보 11-06: 경기 끝난 중계에서 '계속'을 눌러도 화면이 그대로) */ if(v==='inbox'){ A.inbox(); return; } if(v==='train'){ A.go('staff:camp'); return; } if(v==='scout'){ A.go('transfer:draft'); return; } if(v==='roster'&&UI.tab!=='roster')UI.rosterTeam=null; UI.tab=v;closeSheets();render();window.scrollTo(0,0);},
  startGo(v){ const m=meta(); const to=UI.newSlot||SLOT_IDS.find(n=>!slotUsed(n,m)); if(UI.newSlot&&(((m.slots[UI.newSlot]||{}).rev||0)!==UI.newSlotRev||slotUsed(UI.newSlot,m)!==UI.newSlotUsed)){ UI.slotMsg=`슬롯 ${UI.newSlot}에 다른 탭(창)이 그사이 저장했습니다. 덮어쓰지 않았습니다. 처음 화면에서 슬롯을 다시 고르세요.`; UI.newSlot=null; UI.sstep='main'; render(); window.scrollTo(0,0); return false; } if(!to){ UI.slotMsg=`슬롯 ${SLOTS}개가 모두 찼습니다.`+' 덮어쓸 슬롯의 "덮어쓰고 새 게임"을 먼저 누르세요.'; render(); window.scrollTo(0,0); return false; } CUR_SLOT=to; slotRevSync(to,m); SLOT_NEW=true; /* 실제 저장 대상도 새 슬롯으로(검수 11-07: 활성 표시만 바뀌고 기존 슬롯을 덮어씀). 활성 슬롯은 첫 저장이 성공할 때 writeSlot이 바꾼다(검수 11-09 #9) */ UI.newSlot=null; UI.slotMsg=''; UI.title=false; UI.sstep='main'; if(UI.world){ G=JSON.parse(JSON.stringify(UI.world)); UI.world=null; if(UI.smode!=='take'&&UI.fdStr)G.fdStraight=true; claimTeam(+v,UI.smode==='take'?0:UI.fdPk); try{ lgTopBase(lgTopDom()); }catch(e){} try{ ovsWorldStart(); }catch(e){} } /* 미리 보기(구단별 창단 지명 순서)를 계산한 것과 같은 저장 형태에서 시작해야 순서가 똑같다 */ else newGame(+v); if(UI.diff==='hard'){ G.cfg=G.cfg||{}; G.cfg.hard=true; } /* 새 게임 난이도 */ if(G){ if(G.startY==null)G.guideY=G.year; if(UI.guideNo){ G.cfg=G.cfg||{}; G.cfg.guideOff=true; } if(UI.easy)try{ autoAll(true); }catch(e){} } /* 진행 방식: 첫 시즌 안내 해·쉬운 진행(반복 업무 위임) */ if(UI.dr1Pk&&G){ G.dr1={y:G.year,slot:UI.dr1Pk,tid:G.user}; } UI.dr1Pk=0; const tk=UI.smode==='take'; UI.fdPk=0; UI.fdStr=0; if(!tk)fdWelcome(); UI.smode=null; UI.tab='inbox'; UI._ibFirst=true; if(!saveNow()){ try{ toast(`새 게임을 슬롯 ${to}에 저장하지 못했습니다. 기존 세이브의 이어하기는 그대로입니다. ${SAVE_ERR||''}`.trim()); }catch(e){} } render();window.scrollTo(0,0); return true;}, /* 소식함이 게임의 중심: 시작하면 소식함 */
  rosterRecovery(){closeSheets();A.go('transfer:free');workspaceReveal('[data-a=signFree]');},
  advStop(){if(UI.advRun)advRunEnd(UI.advRun,true);},
  adv(v,el){ if(UI.advRun){A.advStop();return;}if(UI.cast){toast('중계를 보는 중입니다. 위의 "나가기"를 누른 뒤 진행하세요.');return;}if(UI.castRet&&UI.castRet.parked){toast('멈춰 둔 중계가 있습니다. "중계 이어 보기"로 마저 보거나 "결과 보기"로 끝낸 뒤 진행하세요.');return;}
    if(el&&!UI._cfmPass){const nd=ibNeedList(),sig=nd.map(m=>m.id).join('|');if(nd.length&&UI._ibJumpSig!==sig){UI._ibJumpSig=sig;UI.mf='all';A.mailJump(nd[nd.length-1].id);toast(`확인할 소식 ${nd.length}건: 가장 오래된 것부터 엽니다. 한 번 더 누르면 그대로 진행합니다`);return;}}
    const nw=Date.now();if(el){if(UI._advT&&nw-UI._advT<450)return;UI._advT=nw;}if(G.res&&!G.live)G.res=null;if(blocker())return;
    const ev0=(G.evs||[]).filter(e=>!e.done&&evStops(e)).length;
    return advRunStart(advanceSteps(v),(paused)=>{if(G.dig&&G.dig.games?.length&&!G.dig.mailed){try{digestMail();}catch(e){}G.dig.mailed=true;}if(G.matchAwait&&!paused){A.awaitGo();return;}if(paused)G.matchAwait=null;
      if((G.evs||[]).filter(e=>!e.done&&evStops(e)).length>ev0)sfx('alert',.7);else if(G.res&&G.games[G.res.i]?.res==='승')sfx('cheer_hit',.45);
      if(G.res||G.live){closeSheets();UI.tab='home';UI.mail=null;}else if(G.stops.length){closeSheets();stopsOpen();}else{closeSheets();UI.mail=null;UI.fromMail=null;UI.tab='inbox';UI.mf='all';UI._ibEnd=true;UI.ibSel=null;UI.ibOpen=null;}
      if(G.dig&&G.dig.games?.length&&!G.res&&!G.live)UI.wkres={from:G.dig.from,to:G.dig.to,rk0:G.dig.rk};save();render();window.scrollTo(0,0);});},
  fullTg(){ const d=document,e=d.documentElement; try{ const r=fullOn()?(d.exitFullscreen||d.webkitExitFullscreen).call(d):(e.requestFullscreen||e.webkitRequestFullscreen).call(e); if(r&&r.catch)r.catch(()=>toast('이 브라우저에서는 전체 화면을 켤 수 없습니다.')); }catch(x){ toast('이 브라우저에서는 전체 화면을 켤 수 없습니다.'); } },
  calOpen(){ const s=calKeepSel(); UI.calSel=s; UI.calYM=s!=null?(o=>({y:o.y,m:o.m}))(dobj(s)):null; closeSheets(); A.tab('cal'); workspaceReveal(s!=null?'.cal-detail':'.cal-grid'); }, /* 오른쪽 위 달력·F10도 왼쪽 일정 탭처럼 고른 날(또는 '이 날까지 진행' 목표일)을 지킨다. 지났거나 없으면 오늘(국사왕 11-18) */
  calMon(v){ const [y,m]=v.split(':').map(Number); UI.calYM={y,m}; UI.calSel=null; render(); },
  calWk(v){ UI.calSel=(UI.calSel??G.day)+(+v); const o=dobj(UI.calSel); UI.calYM={y:o.y,m:o.m}; render(); }, calAll(){ UI.calAll=!UI.calAll; render(); },
  calDay(v){ UI.calSel=+v; render(); workspaceReveal('.cal-detail'); },
  calJump(v){ const o=dobj(+v); closeSheets(); UI.tab='cal'; UI.calYM={y:o.y,m:o.m}; UI.calSel=+v; render(); workspaceReveal('.cal-detail'); },
  /* 이 날까지 진행: FM의 '~까지 진행'처럼 하루씩 넘기다가 중요한 소식·결정이 생기면 멈춘다 */
  advTo(v){if(UI.advRun){A.advStop();return;}const T=+v;if(!(T>G.day))return;UI.calTgt=T;if(G.res&&!G.live)G.res=null;const d0=G.day,rk0=userRank();return advRunStart(advToSteps(T),(paused)=>{if(G.matchAwait&&!paused){A.awaitGo();return;}if(paused)G.matchAwait=null;const stp=!G.live&&G.stops.length>0;if(stp){closeSheets();stopsOpen();}if(!G.live&&!stp&&wkGames(d0+1,G.day).length){G.res=null;closeSheets();UI.wkres={from:d0+1,to:G.day,rk0};}save();render();if(!paused&&G.day<T){const b=blocker();toast(G.day-d0>=200?`한 번에 200일까지 진행합니다. ${dmd(G.day)}에 멈췄습니다.`:b?`${dmd(G.day)}에 멈췄습니다. ${b}`:`${dmd(G.day)}에 멈췄습니다. 확인할 소식이 있습니다.`);}});},
  /* 경기 직전 멈춤: 직관·직접 관전 예약이 없고 '결과만 보기'를 고른 경기면 포스트시즌이어도 결과만(검수 11-08) */
  awaitGo(){ const d=G.matchAwait.day, P=gmPlanAt(d); closeSheets(); UI.tab='home'; if(G.simPlanned?.day===d&&G.watchPlanned?.day!==d&&!(P&&P.k==='attend'&&!P.done)){ A.matchSim(); return; } A.watchNext(); },
  /* 결과를 먼저 보지 않고 다음 경기를 그래픽 중계로 본다 */
  watchPlan(v){ const d=+v, P=gmPlanAt(d), nx=nextGames(1)[0]; if(!P||P.k!=='attend'||P.done||!nx||nx.d!==d||!gmPlanLive(d,P)){ toast('이 직관 일정은 취소됐거나 이미 지난 경기입니다.'); render(); return; } G.watchPlanned={day:d,op:P.op,...(P.gk?{gk:P.gk}:{})}; A.watchNext(); }, /* 직관 알림 버튼: 그 예약이 아직 유효하고 다음 경기가 그 날일 때만(검수 11-06) */
  watchNext(){ const next=nextGames(1)[0],request=gmWatchChoose(next,G.watchPlanned||G.simPlanned); if(!request){ toast('남은 우리 경기가 없습니다.'); G.matchAwait=null; G.watchPlanned=null; render(); return; } G.simPlanned=null; /* 탈락 뒤 버튼: 다른 팀 경기를 끝까지 넘기지 않는다(검수 11-08) */G.watchPlanned=request;UI.matchPreview=false; if(G.res&&!G.live)G.res=null; if(blocker()){ save();render(); return; } const d0=G.day; advance('watch'); G.res=gmWatchResult(G.watchPlanned||request); if(G.res&&G.games[G.res.i]?.pbp?.length)UI._castHold=1; /* 아래 render가 중계를 열기 전에 우승 장면을 먼저 띄우지 않게(사용자 11-09) */ if(!G.res&&!G.live&&G.stops.length){ closeSheets(); stopsOpen(); save(); render(); return; } /* 경기 전에 핵심 결정 마감 재알림으로 멈춤(검수 11-09z) */ { const g0=G.res&&G.games[G.res.i]; if(G.cwS&&!G.cwS.done&&g0&&G.cwS.day===g0.day&&g0.pbp&&g0.pbp.length)UI.cwAuto=G.cwS.id; } /* 함께 본 경기: 중계를 먼저 보고, 닫을 때 동석 결과(사용자 피드백 11-05: 결과가 중계보다 먼저 떴다) */ setTimeout(()=>dayTick(d0),30); closeSheets(); UI.tab='home'; UI.mail=null; save(); render(); window.scrollTo(0,0); const g=G.res&&G.games[G.res.i];if(g){G.watchPlanned=null;G.matchAwait=null;save();} if(G.cwS&&!G.cwS.done&&g&&G.cwS.day===g.day){ if(g.pbp&&g.pbp.length){ UI.cwAfter=G.cwS.id; UI._castHold=1; A.cast(G.res.i); return; } A.cwOpen(); return; } if(g&&g.pbp&&g.pbp.length){ UI._castHold=1; A.cast(G.res.i); } }, /* hold: 방금 계산한 우리 경기라 중계를 마칠 때까지 결과를 감춘다(spoilG) */
  smon(v){ UI.smon=+v; render(); },
  liveNext(){ if(!G.live)return; G.live.upto+=2; save(); render(); },
  liveEnd(){ if(!G.live)return; G.live.upto=999; save(); render(); },
  liveDone(){ G.live=null; save(); render(); },
  openGame(v){ const sg=spoilG(); if(sg&&G.games[+v]===sg){ if(UI.cast&&G.games[UI.cast.g]===sg){ A.castView('data'); return; } toast('중계를 마친 뒤에 박스스코어를 볼 수 있습니다.'); return; } /* 중계 중에는 어느 화면에서도 최종 박스스코어를 열지 않는다(검수 11-06) */ UI.sheet=null; UI.posSheet=null; UI.game=+v; UI.gtab='box'; renderSheet(); },
  offerYes(v){ const r=answerOffer(v,true); if(!(G.offers||[]).some(x=>x.id===v))offerMailDone(v); /* 불발돼 받은 목록에 남은 제안은 메일도 그대로(검수 11-09v) */ if(!r.ok)UI._cfmWhy=r.msg; note('트레이드',r.msg); G.stops=G.stops.filter(s=>s.oid!==v); /* 이 제안 알림만 정리 */ save(); render(); },
  offerNo(v){ offerMailDone(v); answerOffer(v,false); G.stops=G.stops.filter(s=>s.oid!==v); save(); render(); },
  buildFacItem(v){ UI.facMsg=buildFacItem(v)||null; save(); render(); },
  invSel(v){ UI.invSel=v; UI.facMsg=null; UI.stadMsg=null; render(); },
  campZoom(v){ campZoomTo(null); },
  buyBus(v){ UI.facMsg=buyBus(v)||null; save(); render(); },
  anaHire(v){ const [aid,rz]=String(v).split(':'); const res=stOffer('an',aid,+rz||0); toast(res.msg); save(); render(); }, /* 명단 반영·기록은 stOffer. 정원이 차 있으면 수락 순간 누구 대신 데려올지 고르는 창이 뜬다(stAccSheet) */
  stAccOut(v){ toast(stAccDecide(v)); save(); render(); }, stAccNo(){ toast(stAccDecide(null)); save(); render(); }, stAccSel(v){ UI.stAccSel=v; render(); },
  stPo(v){ const [k,t,id,r]=String(v).split(':'); toast(stPoach(k,+t,id,+r||.25)); save(); render(); },
  stKeep(v){ const [id,f]=String(v).split(':'); toast(stKeep(id,f==='1')); save(); render(); },
  stBidDrop(v){ toast(stBidDrop(v)); save(); render(); },
  stLet(v){ const r=stRaidFind(v); toast(r?stLeave(r):'이미 끝난 일입니다.'); save(); render(); },
  cmKeep(v){ const f=String(v).split(':')[1]; toast(cmKeep(String(v),f==='1')); save(); render(); }, cmLet(v){ toast(cmLet(String(v))); save(); render(); }, /* 제안 전체 식별값을 검증한다(#502) */
  anaFire(v){ fireAna(v); save(); render(); },
  camp(v){ if(G.camp){G.camp.focus=v; G.camp.seen=true; save(); render();} },
  confirmContracts(){ const r=confirmContracts(); UI.ctMsg=r||''; save(); render(); },
  salOff(v){ const [id,a]=v.split(':'); UI.ctMsg=salOffer(+id,+a); save(); render(); },
  salOffAll(){ UI.ctMsg=salOfferAll(); save(); render(); },
  salArbAccept(v){ const C=G.contract; const n=C&&C.neg&&C.neg[+v]; const p=G.players[+v]; if(p&&p.team!==G.user){ toast(`${p.name}은(는) 이제 우리 선수가 아닙니다.`); render(); return; } if(n&&p&&n.st==='arb'){ n.st='ok'; p.newSal=n.arb.player; p.mor=clamp((p.mor??60)+2,0,100); UI.ctMsg=`${p.name}: 선수안 ${money(n.arb.player)}을 받아들여 연봉조정 신청이 취하됐습니다.`; } save(); render(); },
  fneg(v){ UI.ctMsg=fReNeg(+v); save(); render(); },
  ffree(v){ const id=+v; const C=G.contract; if(!C)return; const a=C.fFree=C.fFree||[]; const i=a.indexOf(id); i>=0?a.splice(i,1):a.push(id); save(); render(); },
  fdrop(v){const id=+v; const C=G.contract; const a=C.foreignDrop; const i=a.indexOf(id); const p=G.players[id]; if(!p)return;
    if(i>=0){ if(p.fleft){ toast('선수가 재계약을 거절하고 떠나기로 했습니다.'); return; } const fs=foreignOf(G.user).filter(x=>x.id!==id&&!a.includes(x.id)); const full=p.foreign==='아시아'?fs.filter(x=>x.foreign==='아시아').length>=1:fs.filter(x=>x.foreign==='용병').length>=fMaxYB(G.user,C.y+1);
      if(full){ toast('그 사이 새 외국인과 계약해 자리가 없습니다. 재계약으로 되돌릴 수 없습니다.'); return; } a.splice(i,1); if(fReMixBad()){ a.splice(i,0,id); toast(`되돌리면 ${fReCapInfo().mix}. 재계약으로 되돌릴 수 없습니다.`); return; } } else a.push(id); save(); render();},
  relAsk(v){UI.confirmRel=+v;renderSheet();},
  relCancel(){UI.confirmRel=null;renderSheet();},
  release(v){releasePlayer(+v);UI.sheet=null;UI.confirmRel=null;save();render();},
  advDraft(){ dliveStart('am'); },
  draftMore(){ UI.open=UI.open||{}; UI.open.draftMore=!UI.open.draftMore; render(); if(UI.open.draftMore)document.querySelector('.dhead-pop')?.scrollIntoView({block:'nearest'}); },
  passPick(){passPick();save();render();},
  draftRest(v){ if(v==='off'){ draftRestSet(null); save(); render(); return; } const [m,n]=String(v).split(':'); draftRestSet(m,+n||3); save(); if(G.draft&&!G.draft.done)dliveStart('am'); else render(); },
  dmove(v){ const [id,d]=v.split(':').map(Number); dbAutoApply(draftRanked()); const L=G.shortlist||[], on=new Set(draftPool().map(p=>p.id)); const i=L.indexOf(id); let j=i+d; while(j>=0&&j<L.length&&!on.has(L[j]))j+=d; /* 보드에 보이는 이웃과 바꾼다(사이의 현역 관심 선수는 제자리) */ if(i<0||j<0||j>=L.length)return; [L[i],L[j]]=[L[j],L[i]]; const S=dbSortOf(); if(S.auto){ S.auto=false; toast('직접 순서를 바꿔 자동 정렬 유지를 껐습니다.'); } save(); render(); },
  dbSort(){ const S=dbSortOf(), nx=dbRankOrder(draftRanked()); if(nx.join()===(G.shortlist||[]).join()){ toast('이미 스카우트 추천순입니다.'); return; } draftBoardRemember(S,G.shortlist||[]); G.shortlist=nx; toast('스카우트 추천순으로 정렬했습니다. 되돌리기로 이전 순서로 돌아갈 수 있습니다.'); save(); render(); },
  dbUndo(){ const S=dbSortOf(); if(!S.undo)return; const cur=G.shortlist||[], has=new Set(cur), U=S.undo.filter(id=>has.has(id)), u=new Set(U); G.shortlist=[...U,...cur.filter(id=>!u.has(id))]; S.undo=null; delete S.undoTid; delete S.undoY; if(S.auto)S.auto=false; toast('정렬 전 순서로 되돌렸습니다.'); save(); render(); },
  dbAuto(){ const S=dbSortOf(); if(S.auto)dbAutoApply(draftRanked()); S.auto=!S.auto; if(S.auto){ const nx=dbRankOrder(draftRanked()); if(nx.join()!==(G.shortlist||[]).join()){ draftBoardRemember(S,G.shortlist||[]); G.shortlist=nx; } } toast(S.auto?'자동 정렬 유지를 켰습니다. 스카우트 추천순을 계속 따릅니다.':'자동 정렬 유지를 껐습니다. 지금 순서를 그대로 둡니다.'); save(); render(); },
  dchk(v){ const [id,k]=v.split(':'); const m=dmemoOf(+id); const r=rchkAsk(+id,k); const q=rchkOf(+id,k), i=m.chk.indexOf(k); if(q&&i<0)m.chk.push(k); if(!q&&i>=0)m.chk.splice(i,1); toast(r); save(); render(); }, /* 재확인 칩: 실제 요청(64_scout_obs rchkAsk) */
  dplan(v){ const [g,r]=String(v).split(':'); const P=dplanOf(); if(+r)P[g]=+r; else delete P[g]; save(); render(); },
  star(v){G.shortlist=G.shortlist||[]; const id=+v,p=G.players[id]; if(p&&p.prospect&&p.team==null)amFollow(id,!obsFollowSet(G.user).has(id)); else {const i=G.shortlist.indexOf(id); i>=0?G.shortlist.splice(i,1):G.shortlist.push(id); if(i>=0&&amFollowing(G.user,id))amFollow(id,false);} save(); render(); renderSheet();}, /* 후보 관심은 아마추어 명단과 같은 80명을 쓴다 */
  dset(v){const [k,x]=v.split(':'); UI.df=UI.df||{pos:'all',typ:'all',reg:'all',sort:'rk',seg:'board',more:20}; UI.df[k]=k==='more'?+x:x; if(k!=='more')UI.df.more=30; render();},
  dreset(){UI.df=Object.assign(UI.df||{seg:'board',sort:'rk'},{pos:'all',typ:'all',reg:'all',unseen:false,more:20});render();},
  autoPick(){const id=userAutoPick(); if(id)return A.pick(id); save();render();},
  pick(v){ const id=+v; const pk0=G.draft&&G.draft.picks[G.draft.cur]; { const e=userPick(id); if(e){ toast(e); return; } } if(pk0)dlFeedAdd('am',pk0,id); UI.sheet=null; const p=G.players[id]; if(p&&p.team===G.user&&p.draft&&p.draft.rd<=3){ const f=draftFan(p); UI.stamp={title:f.bank==='drSteal'?'스틸 지명':'지명',msg:`${p.draft.rd}라운드 ${p.draft.no}순위 · ${p.name} (${posLabel(p)}, ${p.school||''}) · 언론 순위 ${p.press||'-'}위`,fans:f.lines}; } save(); render(); if(G.draft&&!G.draft.done&&G.draft.picks[G.draft.cur]&&G.draft.picks[G.draft.cur].tid!==G.user)setTimeout(()=>dliveStart('am'),UI.stamp?1600:350); },
  player(v,el){peopleCapture('p:'+v,el);UI.myRos=false;UI.drawer=false;UI.mail=null;UI.posSheet=null;if(UI.fpos){ UI.fpos=null; document.querySelectorAll('.fdd').forEach(e=>e.remove()); } /* 전력 구성의 포지션 펼침도 닫는다. 선수 창은 화면 위에만 그려 아래 펼침이 남으므로 바로 지운다(유저 제보 11-07: 선수 창 위에 떠서 닫히지 않음) */UI.game=null;if(UI.sheet!==+v)UI.ptab=(UI.tab==='staff'&&curSub('staff')==='train'&&(UI.it||{}).mg_staff_train==='dev'&&G.players[+v]&&G.players[+v].team===G.user)?'dev':(G.fa&&G.fa.open&&!G.fa.closed&&G.fa.pool.includes(+v)&&G.players[+v]&&G.players[+v].team==null)?'sum':G.players[+v]&&!G.players[+v].prospect&&!G.players[+v].fdPool?'abil':'sum';UI.sheet=+v;UI.talkMsg=null;UI.devMsg=null;UI.offer=null;UI.fmsg='';UI.confirmRel=null;if(!UI.ext||UI.ext.id!==+v)UI.ext=null;renderSheet();},
  fpos(v){ UI.fpos=(v&&UI.fpos!==v)?v:null; render(); if(UI.fpos){ const el=document.querySelector('.fdd'); if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'}); } },
  posSheet(v){UI.sheet=null;UI.game=null;UI.posSheet=v;renderSheet();},
  tposSheet(v){UI.sheet=null;UI.game=null;UI.posSheet=v;renderSheet();},
  seg(v){UI.seg=v;render();},
  rviewMode(v){UI.rlayout=v;render();},
  fview2(v){ UI.fview2=v; render(); }, cmkView(v){ UI.cmkView=v; render(); }, cmkOpen(v){ v=String(v); UI.cmkOpen=String(UI.cmkOpen)===v?null:v; render(); }, cslotOpen(v){ UI.cslotOpen=UI.cslotOpen===v?null:v; render(); },
  sfCards(){ UI.coachCards=!UI.coachCards; render(); }, sfCoach(v){ UI.coachCards=1; A.coachSlot(v); },
  coachSlot(v){const C=coachesOf(G.user),slots=[...CKEYS.filter(k=>C[k]),...CKEYS.filter(k=>!C[k])];if(!slots.includes(v))return;UI.cslot=v;UI.pg=UI.pg||{};UI.pg.coachSlots=Math.floor(slots.indexOf(v)/cardPageSize());render();},
  coachFind(v){ UI.crole=v; UI.coachRet=true; UI.cMsg=null; UI.cfire=null; UI.smkK='coach'; UI.smkSrc='free'; A.go('staff:smkt'); }, /* 빈자리 채용은 스태프 시장(코치)으로 */
  crole(v){ UI.crole=v; render(); },
  cfireAsk(v){ UI.cfire=v; render(); },
  wk(v){ UI.wk=v||null; render(); },
  stRenew(v){ const r=staffRenewOffer(v); toast(r.msg); save(); render(); }, /* 계약 만료 알림의 재계약 제안(24_coaches staffExpNote) */
  stRenewAll(v){ const r=staffRenewAll(v?String(v).split(','):null); toast(r.msg); save(); render(); },
  extCoachAll(){ const n=extendCoachesAll(); toast(n?`코치 ${n}명과 1년씩 연장했습니다.`:'연장할 코치가 없습니다.'); save(); render(); },
  extCoach(v){ const [k,a]=v.split(':'); const r=extendCoach(k,+a); toast(r||`${CROLE[k].l} 계약을 ${a}년 연장했습니다.`); save(); render(); },
  cpromAsk(v){ UI.cprom=v; render(); }, cpromCancel(){ UI.cprom=null; render(); },
  promoteCoach(v){ const r=promoteCoach(v); UI.cprom=null; UI.cMsg=typeof r==='string'?r:r.msg; toast(UI.cMsg); save(); render(); },
  extMgr(v){ const r=extendMgr(+v); toast(r||`감독 계약을 ${v}년 연장했습니다.`); save(); render(); },
  hireAsst(v){ const [id,y]=v.split(':'); const e=hireAsst(id,+y); UI.cMsg=e||'보조 코치를 영입했습니다.'; save(); render(); },
  fireAsst(v){ const e=fireAsst(v); UI.cMsg=e||'보조 코치를 내보냈습니다.'; save(); render(); },
  homeRos(v){ const [sc,seg]=String(v).split(':'); UI.rscope=sc; UI.seg=seg; A.tab('roster'); }, /* 홈 선수단 현황 칸을 누르면 그 묶음(1군·2군 투수·야수) 선수단으로(사용자 11-07) */
  postGM(v){ toast(postGM(+v)); save(); render(); },
  fireCoach(v){ fireCoach(v); UI.cfire=null; UI.cMsg=`${CROLE[v].l} 자리를 비웠습니다.`; save(); render(); },
  hireCoach(v){ const [id,y]=v.split(':'); const c=(G.cmarket||[]).find(x=>x.id===id); const e=hireCoach(id,+y); UI.cMsg=e||(c?`${CROLE[c.role].l} ${c.name} 영입 (${y}년)`:''); if(!e&&c){ UI.it=UI.it||{}; UI.it.coach=CROLE[c.role].g===2?'g2':'g1'; if(UI.coachRet){ UI.coachRet=null; save(); A.go('staff:coach'); return; } } save(); render(); }, /* 보직의 '교체'로 시장에 왔으면 영입 뒤 코치 보직 화면으로 돌아간다(사용자 피드백 11-07) */
  hy(v){UI.hy=+v;render();},
  fmBack(){ fmBack(); }, fmFwd(){ fmFwd(); }, fmKeysX(){ UI.fmKeys=false; render(); }, fmKeysOpen(){ UI.fmKeys=true; render(); }, fmPlan(){ UI.tab='roster'; UI.rosterTeam=null; UI.it=UI.it||{}; UI.it.roster='depth'; UI.it.rdepth='glance'; closeSheets(); render(); },
  retNo(v){ note('기록',retireNumber(v)); save(); render(); },
  pEditOpen(v){ UI.pEdit=v===''||v==null?null:+v; UI.pEditErr=''; UI.pEditD=null; renderSheet(); },
  noEditOpen(){ UI.noEdit=true; UI.noDraft={}; UI.noErr=''; render(); },
  noEditClose(){ UI.noEdit=false; UI.noDraft=null; UI.noErr=''; render(); },
  noEditSave(){ const M={}; document.querySelectorAll('.ne-in').forEach(el=>{ M[el.dataset.pid]=el.value; }); UI.noDraft=M; const r=setPlayerNos(M); if(r.err){ UI.noErr=r.err; render(); return; } UI.noEdit=false; UI.noDraft=null; UI.noErr=''; note('선수',`등번호 ${r.n}명을 바꿨습니다.`); save(); render(); },
  pEditSave(v){ const id=+v, p=G.players[id]||(G.arch&&G.arch[id]); if(!p)return; const nm=$('#pe-nm'), no=$('#pe-no'); /* 이름·등번호만(능력 에디터 없음, 구단주 결정 11-17). 얼굴은 고르는 즉시 저장(cosmFace) */
    /* 모두 먼저 검사하고, 통과하면 한꺼번에 바꾼다: 등번호가 틀렸는데 이름만 바뀌던 문제(외부 검수 11-17) */
    const noCh=!!(no&&G.players[id]&&String(no.value).trim()!==String(jno(p))), nmCh=!!(nm&&cosmNameClean(nm.value)!==p.name);
    let e=(nmCh?cosmNameErr(nm.value):'')||(noCh?playerNoErr(id,no.value):'');
    if(!e&&noCh)e=setPlayerNo(id,no.value); if(!e&&nmCh)e=setPlayerName(id,nm.value);
    if(e){ pEditGrab(); UI.pEditErr=e; renderSheet(); return; } UI.pEdit=null; UI.pEditErr=''; UI.pEditD=null; note('선수',`${p.name}${G.players[id]&&p.team!=null?' · '+jno(p)+'번':''} 저장했습니다.`); save(); render(); },
  noTrade(v){ const p=G.players[+v]; if(!p||p.team!==G.user)return; p.noTrade=!p.noTrade; if(p.noTrade&&p.listed){ try{ blockRemove(p.id); }catch(e){ p.listed=false; } } toast(p.noTrade?`${p.name}을(를) 트레이드 불가로 지정했습니다. 다른 구단이 묻지 않습니다.`:`${p.name} 트레이드 불가를 풀었습니다.`); save(); render(); try{ if(UI.sheet!=null)renderSheet(); }catch(e){} },
  blkOn(v){ const q=G.players[+v]; if(q&&hasNtc(q)){ toast(`${q.name}은(는) 트레이드 거부권이 있어 매물로 올릴 수 없습니다(${q.ntc}년까지).`); return; } blockAdd(+v,'any'); UI.sheet=null; save(); A.go('trade:block'); },
  blkOff(v){ blockRemove(+v); save(); render(); },
  blkUrg(v){ const p=G.players[+v]; if(p){ p.urgent=!p.urgent; save(); render(); } },
  blkF(v){ UI.blkF=v; render(); },
  mktEdit(v){ const x=(UI._mkt||[])[+v], m=UI.findM; if(!x||m==null)return; const q=G.players[x.give[0]]; UI.trade={tid:x.tid,give:[m],get:[...x.give],cash:0,msg:'시장 가치 조건을 담았습니다. 선수·현금·지명권을 바꿔 제안해 보세요.',seg:q&&q.isP?'pit':'bat',side:'give',sort:'cur'}; A.go('trade:table'); }, /* 시장 가치 조건을 출발점으로 협상(사용자 요청 11-09) */
  blkSwap(v){ const [a,b]=v.split(':').map(Number); const q=G.players[a], m=G.players[b]; if(!q||!m)return; UI.trade={tid:q.team,give:[m.id],get:[q.id],msg:'',seg:q.isP?'pit':'bat',side:'give',sort:'cur'}; A.go('trade:table'); },
  offerMore(v){ UI.blkMsg={id:v,t:offerMore(v)}; save(); render(); },
  offerRevert(v){ UI.blkMsg={id:v,t:offerRevert(v)}; save(); render(); },
  sangmu(v){ UI.milMsgD=G.day; UI.milMsg=sangmuApply(+v)||`${G.players[+v].name} 상무 지원을 마쳤습니다. 합격자는 ${sangmuWave()==='dec'?'10월 15일':'4월 15일'}에 발표됩니다.`; save(); render(); },
  enlist(v){ UI.milMsgD=G.day; UI.milMsg=enlistNow(+v)||`${G.players[+v].name} 현역 입대를 예약했습니다(2주 뒤 입대, 그 전까지 취소 가능).`; save(); render(); },
  enlistCancel(v){ UI.milMsgD=G.day; UI.milMsg=enlistCancel(+v)||`${G.players[+v].name} 입대 예약을 취소했습니다.`; save(); render(); },
  entSort(v){ const [k,c]=String(v).split(':'); UI.entSort=UI.entSort||{bat:'ops',pit:'era'}; UI.entSort[k]=c; render(); },
  reqUp(v){ UI.entMsg={id:+v,t:reqEntry(+v,true)}; save(); render(); },
  reqDown(v){ UI.entMsg={id:+v,t:reqEntry(+v,false)}; save(); render(); },
  toYS(v){ UI.entMsg={id:+v,t:toYS(+v)||'육성선수로 돌렸습니다.'}; save(); render(); },
  fromYS(v){ UI.entMsg={id:+v,t:fromYS(+v)||'정식 선수로 등록했습니다.'}; save(); render(); },
  ysNow(v){ const r=toYS(+v); if(r)UI.trimMsg=r; save(); render(); },
  blkBatch(){ const ok=[], bad=[]; for(const id of (UI.trimSel||[])){ const q=G.players[id]; if(!q||q.team!==G.user)continue; if(hasNtc(q)){ bad.push(`${q.name}: 트레이드 거부권`); continue; } if(q.foreign){ bad.push(`${q.name}: 외국인 선수는 트레이드 대상이 아님`); continue; } try{ blockAdd(id,'any'); ok.push(q.name); }catch(e){ bad.push(q.name); } } UI.trimMsg=[ok.length?`트레이드 매물로 올림: ${ok.join(', ')} (트레이드 > 매물에서 확인)`:'',...bad].filter(Boolean).join(' / '); save(); render(); }, /* 여러 명 한 번에 매물 등록(커뮤니티 11-12) */
  ysBatch(){ const ids=(UI.trimSel||[]).slice(); const ok=[], bad=[]; for(const id of ids){ const p=G.players[id]; if(!p||p.ys||p.foreign||p.faC||p.sal>100)continue; const r=toYS(id); if(r)bad.push(`${p.name}: ${r}`); else ok.push(p.name); } UI.trimSel=(UI.trimSel||[]).filter(id=>!ok.includes((G.players[id]||{}).name)); UI.trimMsg=[ok.length?`육성선수로 전환: ${ok.join(', ')}`:'',...bad].filter(Boolean).join(' / '); save(); render(); }, /* 고른 선수 한 번에 육성 전환(커뮤니티 11-12) */
  setPol(v){ const r=setPolicy(v); UI.polMsg=r.msg; save(); render(); },
  rcolCfg(){ UI.rcolOpen=!UI.rcolOpen; render(); },
  cgSort(v){ UI.cgS=v; render(); }, splP(){ UI.splP=!UI.splP; renderSheet(); }, sprP(){ UI.sprP=!UI.sprP; renderSheet(); },
  dsPick(v){ const id=+v; UI.dsSel=UI.dsSel===id?null:id; render(); }, dsCmp(v){ const id=+v; const p=G.players[id]; UI.pcmp=(UI.pcmp||[]).filter(x=>G.players[x]&&!!G.players[x].isP===!!(p&&p.isP)); const i=UI.pcmp.indexOf(id); if(i>=0)UI.pcmp.splice(i,1); else { if(UI.pcmp.length>=3)UI.pcmp.shift(); UI.pcmp.push(id); } render(); },
  dsSave(v){ const els=document.querySelectorAll('#dsName'); const el=els[els.length-1]; const C=G.dsCharts=G.dsCharts||[]; const cfg=dsCfg();
    if(v==='over'){ const c=C.find(x=>x.name===UI.dsOver); if(c){ Object.assign(c,cfg,{used:(G.dsSeq=(G.dsSeq||0)+1)}); UI.dsCur=c.id; UI.dsCurG=G; save(); toast(`'${c.name}' 차트를 덮어썼습니다.`); } UI.dsOver=null; UI.dsSaveOn=false; render(); return; }
    const nm=(el&&el.value||'').trim().slice(0,30); if(!nm){ toast('차트 이름을 적어 주세요.'); return; } if(C.some(x=>x.name===nm)){ UI.dsOver=nm; render(); return; }
    if(C.length>=20){ toast('내 차트는 20개까지입니다. 하나를 지운 뒤 저장해 주세요.'); return; } const seq=(G.dsSeq=(G.dsSeq||0)+1); const c=Object.assign({v:1,id:'c'+seq,name:nm},cfg,{at:G.day,used:seq}); C.push(c); UI.dsCur=c.id; UI.dsCurG=G; UI.dsOver=null; UI.dsSaveOn=false; save(); /* 안내 전에 실제 저장 예약: 예약이 있어야 탭 종료 때도 남는다(검수 11-09zg) */ toast(`'${nm}' 차트를 저장했습니다.`); render(); },
  dsOverNo(){ UI.dsOver=null; render(); },
  dsLoad(v){ const c=(G.dsCharts||[]).find(x=>x.id===v); if(!c)return; const g=c.g==='P'?'P':'B'; UI.dsG=g; UI.dsAx=null; UI.dsSel=null; UI.dsCur=c.id; UI.dsCurG=G; c.used=(G.dsSeq=(G.dsSeq||0)+1); UI.dsY=c.sea==='prev'?'prev':null;
    if(!DS_M[g].includes(c.x)||!DS_M[g].includes(c.y)||c.x===c.y){ UI.dsX=null; UI.dsYk=null; toast(`'${c.name}'에 지금 없는 지표가 있어 기본 차트로 엽니다.`); } else { UI.dsX=c.x; UI.dsYk=c.y; }
    UI.dsPos=c.pos||null; UI.dsMin=c.min!=null?+c.min:null; UI.dsLv=c.lv==='퓨처스'?'퓨처스':null; render(); },
  dsDel(v){ G.dsCharts=(G.dsCharts||[]).filter(x=>x.id!==v); if(UI.dsCur===v)UI.dsCur=null; save(); render(); },
  dsAx(v){ UI.dsAx=v||null; UI.dsX=null; UI.dsYk=null; UI.dsSel=null; render(); },
  dsSaveOpen(){ UI.dsSaveOn=!UI.dsSaveOn; render(); if(UI.dsSaveOn){ const e=document.getElementById('dsName'); if(e)e.focus(); } },
  dsNamesTg(){ UI.dsNames=!UI.dsNames; render(); },
  dsCmpOpen(){ UI.pcSea=UI.dsY==='prev'?'prev':null; UI.pcLvl=UI.dsLv==='퓨처스'?'퓨처스':'1군'; A.pcmpOpen(); }, /* 차트에서 보던 시즌·1/2군 그대로 비교(리뷰 2026-11-01) */
  dsLoosen(){ UI.dsMin=0; UI.dsPos=null; render(); },
  dsSet(v){ const [k,x]=v.split(':'); if(k==='G'){ UI.dsG=x; UI.dsAx=null; UI.dsX=null; UI.dsYk=null; UI.dsPos=null; UI.dsSel=null; UI.dsMin=null; } else if(k==='Y')UI.dsY=x==='prev'?'prev':null; else if(k==='L')UI.dsLv=x; else if(k==='M')UI.dsMin=+x; render(); },
  pcmpTg(v){ const id=+v; UI.pcmp=UI.pcmp||[]; const i=UI.pcmp.indexOf(id); if(i>=0)UI.pcmp.splice(i,1); else { if(UI.pcmp.length>=3)UI.pcmp.shift(); UI.pcmp.push(id); } renderSheet(); },
  pcmpOpen(){ UI.sheet=null; UI.pcmpSh=true; renderSheet(); }, pcOpt(v){ const [k,x]=v.split(':'); if(k==='sea')UI.pcSea=x==='prev'?'prev':null; else UI.pcLvl=x; renderSheet(); },
  rvSave(){ const el=document.getElementById('rvName'); const nm=(el&&el.value||'').trim().slice(0,12); if(!nm){ toast('보기 이름을 적어 주세요.'); return; } const pit=UI.seg==='pit'; const U=rvUser(); (U[pit?'pit':'bat']=U[pit?'pit':'bat']||{})[nm]=rcolKeys(pit).slice(); rvUserSave(U); toast(`'${nm}' 보기를 저장했습니다.`); render(); },
  rvUse(v){ const pit=UI.seg==='pit'; const k=pit?'pit':'bat'; const L=(rvUser()[k]||{})[v]; if(!L)return; rcolLoad(); UI.rcols[k]=L.slice(); rcolSave(); UI.rview=UI.rview||{}; UI.rview[k]='u:'+v; render(); },
  rvDel(v){ const k=UI.seg==='pit'?'pit':'bat'; const U=rvUser(); if(U[k])delete U[k][v]; rvUserSave(U); render(); },
  rscope(v){ UI.rscope=v; render(); }, rsea(v){ UI.rsea=v==='cur'?null:v; render(); },
  rcolReset(){ const k=UI.seg==='pit'?'pit':'bat'; rcolLoad(); delete UI.rcols[k]; rcolSave(); render(); },
  sponAcc(v){ toast(sponAccept(+v)); save(); render(); },
  sponRej(v){ toast(sponReject(+v)); save(); render(); },
  sponCnt(v){ const [id,p]=String(v).split(':'); toast(sponCounter(+id,+p)); save(); render(); },
  mvF(v){ const [k,x]=String(v).split(':'); UI.mvf=UI.mvf||{}; if(k==='t')UI.mvf.t=x||null; else UI.mvf.tm=x===''?null:+x; render(); },
  cerOpen(v){ const [y,k]=String(v).split(':'); if(!G.awards||!G.awards[+y]||!awShown(G.awards[+y],k))return toast('아직 발표 전입니다.'); if(G.cerNew&&G.cerNew.y===+y&&G.cerNew.k===k)G.cerNew.seen=true; UI.cer={y:+y,k,i:0,rev:false}; renderSheet(); },
  cerRev(){ if(UI.cer){ UI.cer.rev=true; renderSheet(); } },
  cerNext(){ if(UI.cer){ UI.cer.i++; UI.cer.rev=false; renderSheet(); } },
  cerAll(){ if(UI.cer){ UI.cer.i=99; renderSheet(); } },
  sponPitch(v){ toast(sponPitch(v)); save(); render(); },
  ivOpen(v){ const iv=G.iv; if(!iv||iv.id!==+v)return toast('지난 인터뷰 요청입니다.'); if(iv.done&&!iv.ans.length)return toast('이미 거절한 인터뷰입니다.'); if(iv.exp<G.day&&!iv.done)return toast('기한이 지났습니다.'); UI.ivSh=true; renderSheet(); },
  mdRep(v){ toast(mdSuggest(v)); save(); render(); },
  mdGoal(v){ const t=mdGoalPick(String(v)); if(t)toast(t); save(); render(); },
  ivSkip(v){ if(G.iv&&G.iv.id===+v&&!G.iv.done){ ivSkip(); toast('인터뷰를 거절했습니다. 단장 침묵 기사가 나갑니다.'); save(); render(); } },
  ivAns(v){ ivAnswer(+v); save(); if(G.iv&&G.iv.done){ try{ render(); }catch(e){} } /* 마치면 바로 소식 상태·확인할 소식 수를 갱신(플레이테스트 4 #15) */ renderSheet(); try{ const sh=document.querySelector('#sheet .sheet'), q=document.querySelector('#sheet .iv-q.now,#sheet .iv-end'); if(sh&&q){if(document.documentElement.classList.contains('detail-page-open'))sheetScrollTo(Math.max(0,sheetScrollY()+q.getBoundingClientRect().top-$('#sheet').getBoundingClientRect().top-12));else sh.scrollTop=Math.max(0,q.offsetTop-sh.offsetTop-12);} }catch(e){} }, /* 다시 그리면 창이 맨 위로 튀던 것: 새 질문(또는 끝 안내)이 보이게 */
  gmPlan(v){ const [d,k,x]=String(v).split(':'); toast(gmPlanSet(+d,k||null,x||null)); save(); render(); },
  gmSchR(v){ UI.gmSchR=UI.gmSchR===v?null:v; render(); }, /* 고교 방문: 지역을 고르면 그 지역 학교 버튼이 열린다 */
  gmPlanBulk(v){ const [d,x,m]=String(v).split(':'); toast(gmPlanBulk(+d,x,m)); save(); render(); },
  capex(v){ const [k,x]=String(v).split(':'); const r=capexAsk(k,x); toast(r||'공사를 시작했습니다.'); save(); render(); },
  offerAsk(v){ const [id,k]=String(v).split(':'); const o=(G.offers||[]).find(x=>String(x.id)===id); if(!o)return toast('끝난 제안입니다.'); offerAdvise(o,k); save(); render(); },
  offerCounter(v){ const o=(G.offers||[]).find(x=>String(x.id)===String(v)); if(!o)return toast('끝난 제안입니다.'); UI.trade={tid:o.from,give:[...o.get],get:[...o.give],cash:0,msg:'',seg:'bat',side:'give',sort:'cur'}; A.go('trade:table'); },
  champSeen(){ if(G.champNew)G.champNew.seen=true; save(); render(); },
  devPS(){ toast('정규시즌을 끝까지 치르는 중입니다…'); setTimeout(()=>{ const r=devToPostseason(); UI.devMsg=r; save(); render(); toast(r); },60); },
  devSeed(){ const r=devSeedUser(); UI.devMsg=r; save(); render(); toast(r); },
  rcolTg(v){ const pit=UI.seg==='pit'; const k=pit?'pit':'bat'; const L=rcolKeys(pit).slice(); const i=L.indexOf(v); if(i>=0){ if(L.length<=1)return; L.splice(i,1); } else L.push(v); rcolLoad()[k]=L; rcolSave(); render(); },
  rcolMv(v){ const pit=UI.seg==='pit'; const k=pit?'pit':'bat'; const [c,d]=v.split(':'); const L=rcolKeys(pit).slice(); const i=L.indexOf(c), j=i+(+d); if(i<0||j<0||j>=L.length)return; [L[i],L[j]]=[L[j],L[i]]; rcolLoad()[k]=L; rcolSave(); render(); },
  salSort(v){ const c=UI.salSort; UI.salSort={k:v,d:c&&c.k===v?-c.d:(v==='name'?1:-1)}; render(); },
  rsort(v){ const k=UI.seg==='pit'?'pit':'bat'; UI.rs=UI.rs||{}; if(!v){UI.rs[k]=null;} else { const c=UI.rs[k]; UI.rs[k]={k:v,dir:c&&c.k===v?-c.dir:-1}; } render(); },
  rpos(v){ UI.rpos=UI.rpos||{bat:'all',pit:'all'}; UI.rpos[UI.seg==='pit'?'pit':'bat']=v; render(); },
  relNow(v){releasePlayer(+v);save();render();},
  autoTrim(){const n=rosterN(G.user)-ROSTER_MAX; trimCands(n).forEach(p=>releasePlayer(p.id)); save(); render();},
  trimOn(){ UI.trimOn=!UI.trimOn; UI.trimHidden=!UI.trimOn; UI.trimSel=[]; UI.trimN=0; render(); if(UI.trimOn)workspaceReveal('.trimc'); },
  trimClose(){ UI.trimOn=false;UI.trimHidden=true;UI.trimSel=[];UI.trimN=0;UI.it=UI.it||{};UI.it.roster='list';UI.tab='roster';UI.rosterTeam=null;closeSheets();render();window.scrollTo(0,0); },
  trimSel(v){ const id=+v, S=UI.trimSel=UI.trimSel||[]; const i=S.indexOf(id); if(i>=0)S.splice(i,1); else S.push(id); render(); },
  trimMore(){ UI.trimN=(UI.trimN||10)+10; render(); },
  trimClr(){ UI.trimSel=[]; UI.trimYsSel=[]; render(); },
  trimYsSel(v){ const id=+v, S=UI.trimYsSel=UI.trimYsSel||[]; const i=S.indexOf(id); if(i>=0)S.splice(i,1); else S.push(id); render(); }, /* 정리 모드 육성선수 고르기(카페 11-18) */
  trimYsUp(v){ const p=G.players[+v]; const r=fromYS(+v); UI.trimMsg=r||`${p?p.name:'선수'}을(를) 정식 선수로 등록했습니다.`; if(!r)UI.trimYsSel=(UI.trimYsSel||[]).filter(id=>id!==+v); save(); render(); },
  ysRelBatch(){ const L=(UI.trimYsSel||[]).map(id=>G.players[id]).filter(p=>p&&p.ys&&p.team===G.user); L.forEach(p=>releasePlayer(p.id)); UI.trimYsSel=[]; UI.trimMsg=L.length?`육성선수 ${L.length}명을 방출했습니다.`:''; save(); render(); },
  relBatch(){ releaseMany(UI.trimSel||[]); UI.trimSel=[]; save(); render(); },
  tpartnerGo(v){UI.trade={tid:+v,give:(UI.trade&&UI.trade.give)||[],get:[],msg:'',seg:'bat',side:'get',sort:'cur'}; A.go('trade:table');},
  lseg(v){ if(v==='find'){ A.go('trade:find'); return; } UI.lseg=lsegFix(v);render();window.scrollTo(0,0);},
  gtab(v){ UI.gtab=v; renderSheet(); },
  pbpGo(v){ const [g,k]=v.split(':').map(Number); UI.pbp={g,k:Math.max(0,k)}; UI.gtab='pbp'; renderSheet(); },
  /* 휴대폰 중계: 덜 쓰는 버튼(박스스코어·화면 전환)을 접었다 편다. */
  castMore(v){const el=document.querySelector('.match-dashboard');if(!el)return;const on=v==='0'?false:v==='1'?true:!el.hasAttribute('data-more');el.toggleAttribute('data-more',on);el.querySelector('.md-more-btn')?.setAttribute('aria-expanded',on);
    /* 더보기 바깥(경기장 등)을 누르면 닫는다(사용자 'ddddddd' 11-17: 더보기·기록이 안 꺼짐) */ if(on)setTimeout(()=>{ const off=e=>{ const d=document.querySelector('.match-dashboard'); if(!d||!d.hasAttribute('data-more')){ document.removeEventListener('pointerdown',off,true); return; } if(e.target.closest&&e.target.closest('.cs-top'))return; document.removeEventListener('pointerdown',off,true); A.castMore('0'); }; document.addEventListener('pointerdown',off,true); },0);},
  /* 기록·선수단 화면은 뒤로 가기(휴대폰 뒤로 제스처·Esc·'중계 화면' 버튼)로 경기 화면에 돌아온다 */
  castView(v,fromPop){if(UI.cast&&['field','data','teams'].includes(v)){const prev=UI.cast.view||'field';UI.cast.view=v;const el=document.querySelector('.match-dashboard');if(el)el.dataset.view=v;el?.removeAttribute('data-more');el?.querySelector('.md-more-btn')?.setAttribute('aria-expanded','false');document.querySelectorAll('[data-a="castView"]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
    try{ if(v!=='field'&&prev==='field'&&!(history.state&&history.state.foCastView))history.pushState({...(history.state||{}),foCastView:1},''); else if(v==='field'&&!fromPop&&history.state&&history.state.foCastView)history.back(); }catch(e){} }},
  castTeam(v){if(UI.cast&&['a','h'].includes(v)){UI.cast.team=v;castDashboardUpdate(G.games[UI.cast.g],UI.cast.k);cPitchReset(G.games[UI.cast.g],UI.cast.k);}},
  castSeek(v){if(UI.cast)castJump(+v,false);},
  castEvent(v){if(UI.cast&&+v<UI.cast.k)castJump(+v,true);},
  cast(v){ const gi=+v; const g=G.games[gi]; if(!g||!g.pbp||!g.pbp.length)return; if(UI.castRet&&UI.castRet.parked&&UI.castRet.g===gi)return A.castResume(); UI.sheet=null;UI.posSheet=null;UI.game=null;UI.menu=false;UI.castRet=null; UI.cast={g:gi,k:0,play:true,pre:1,spd:UI.castSpd||1, /* 배속은 마지막에 고른 값을 이어 쓴다(사용자 요청 11-07: 다시 넣음) */mode:UI.castMode==='all'?'all':'hl',hold:UI._castHold?1:0}; UI._castHold=0; render(); }, /* 상단 위치·하위 탭도 '경기 중계'로 바꾼다 */
  castExit(){ const c=UI.cast||UI.castRet, g=c&&G.games[c.g]; if(c&&c.hold&&!c.fin&&g&&(c.k||0)<(g.pbp||[]).length){ UI.cfm={k:'castClose',v:'',doc:{head:'중계',subj:'중계를 끝내고 결과를 볼까요?',lines:['나가면 이 경기의 최종 결과가 홈·순위·일정·소식에 바로 반영됩니다.','다른 화면만 잠깐 보려면 아래 메뉴를 누르세요. 중계는 그 자리에서 멈췄다가 \'중계 이어 보기\'로 다시 볼 수 있습니다.'],ok:'결과 보고 나가기',no:'계속 보기',noMail:true}}; cfmRender(); return; } A.castClose(); }, /* 끝나지 않은 중계는 나가기 전에 묻는다(플레이테스트 4 #3) */
  castResume(){ const c=UI.castRet; if(!c||!c.parked||!G.games[c.g])return; delete c.parked; UI.sheet=null;UI.posSheet=null;UI.game=null;UI.menu=false;UI.mail=null; UI.castRet=null; UI.cast=c; c.play=!!c.wasPlay&&c.k<G.games[c.g].pbp.length; renderSheet(); render(); window.scrollTo(0,0); },
  castClose(noCw){ sndStopAll(); CT.tok++; CT.run=false; UI.cast=null; try{ if(history.state&&history.state.foCastView)history.back(); }catch(e){} /* 기록 화면에서 나가면 넣어 둔 뒤로 가기 한 칸도 지운다 */ UI.castRet=null; if(G&&G.castHold){ delete G.castHold; save(); } /* 닫은 중계가 새로고침 뒤 다시 열리지 않게 저장(검수 11-07) */ render(); spoilFlush(); const cw=UI.cwAfter; UI.cwAfter=null; if(!noCw&&cw&&G.cwS&&G.cwS.id===cw)A.cwOpen(); }, /* 함께 본 경기: 중계를 닫으면 동석 결과 */
  castStart(){ const c=UI.cast; if(!c||!c.pre)return; cPrepClose(c); c.play=true; const pb=document.getElementById('cs-play'); if(pb)pb.textContent='일시정지'; castResumePitch(); castLoop(); }, /* 경기 전 화면의 '경기 시작'(3D 준비 뒤 활성) */
  castDugout(){const open=!castPref('dugout');try{localStorage.setItem('fo-cast-dugout',open?'1':'0');}catch(e){}const d=document.querySelector('.match-dashboard');if(d)d.dataset.dugout=open?'open':'closed';const b=document.querySelector('.md-dugout-toggle');if(b){b.setAttribute('aria-expanded',String(open));b.textContent=open?'선수단 ▾':'선수단 ▴';}},
  castMgr(){const open=!castPref('mgr');try{localStorage.setItem('fo-cast-mgr',open?'1':'0');}catch(e){}const d=document.querySelector('.match-dashboard');if(d)d.dataset.mgr=open?'open':'closed';const b=document.querySelector('.cs-mgr-h');if(b){b.setAttribute('aria-expanded',String(open));b.textContent='감독 운영 '+(open?'▾':'▴');}},
  castEndTab(v){const r=document.querySelector('.cs-result');if(!r)return;r.dataset.tab=v==='num'?'num':v==='board'?'board':'box';r.querySelectorAll('.cs-rtabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===r.dataset.tab));},
  castFaces(){const open=!castPref('faces');try{localStorage.setItem('fo-cast-faces',open?'1':'0');}catch(e){}const d=document.querySelector('.match-dashboard');if(d)d.dataset.faces=open?'open':'closed';const b=document.querySelector('.cs-faces-view');if(b){b.textContent=open?'선수 카드 접기':'선수 카드 보기';b.setAttribute('aria-pressed',String(open));}},
  castLineups(){const open=!castLineupsOpen();try{localStorage.setItem('fo-cast-lineups',open?'1':'0');}catch(e){}const d=document.querySelector('.match-dashboard');if(d)d.dataset.lineups=open?'open':'closed';const b=document.querySelector('.cs-lineup-view');if(b){b.textContent=open?'라인업 접기':'라인업 보기';b.setAttribute('aria-pressed',String(open));}},
  castBoard(){const c=UI.cast;if(!c||!c3DActive())return;const on=Match3D.info().camera!=='scoreboard';if(c.play)A.castPlay();Match3D.viewBoard(on);const b=document.querySelector('.cs-board-view');if(b)b.textContent=on?'경기로 돌아가기':'전광판 보기';const st=document.getElementById('cs-stage');if(st)st.dataset.board=on?'1':'';}, /* 전광판을 볼 때는 감독 운영·선수 카드를 숨긴다: 왼쪽 상자가 전광판 글자를 가렸다(사용자 11-16) */
  /* 3D 다시 시도: 기본 중계(재생 중이면 그대로)를 보여 주며 뒤에서 다시 받는다. 준비되면 같은 장면에서 3D로 넘어간다(사용자 11-17) */
  async castRetry3d(){const c=UI.cast,host=document.getElementById('cs-3d');if(!c||!host||typeof Match3D==='undefined'||host.dataset.bg)return;try{const f=globalThis.__fo3d;if(f)f.tries=(f.tries||0)+1;}catch(e){}const ok=await Match3D.mount(host,{day:[0,6].includes(dobj(G.games[c.g].day).w),background:true});if(UI.cast!==c||!host.isConnected||!ok)return;if(c.play){CT.tok++;CT.run=false;cBallHide();castResumePitch();cDraw(c.k,0);castLoop();}else cDraw(c.k,0);},
  castReload3d(){try{saveNow();}catch(e){}location.reload();},
  castPlay(){ const c=UI.cast; if(!c)return; if(c.pre){ if(document.querySelector('.cs-prep-start')?.disabled===false)A.castStart(); else castStart2D(c); return; } /* 3D 준비 중에 재생을 누르면 기본 중계로 바로 시작 */ const L=G.games[c.g].pbp; if(c.k>=L.length)c.k=0; c.play=!c.play; CT.tok++; CT.run=false; cBallHide(); if(c.play){castResumePitch();castLoop();} else { cDraw(c.k,250); sndStop('amb'); sndStop('chant'); } const pb=document.getElementById('cs-play'); if(pb)pb.textContent=c.play?'일시정지':'재생'; },
  castStep(v){ const c=UI.cast; if(!c)return; const L=G.games[c.g].pbp, pa=i=>i>=0&&i<L.length&&typeof L[i][1]==='number'; let i=c.k; if(+v>0){ i++; while(i<L.length&&!pa(i))i++; } else { i--; while(i>0&&!pa(i))i--; } castJump(i); }, /* 다음·이전 '타석'으로(도루·교체 줄은 건너뜀), 재생 상태는 그대로(검수 11-07) */
  castWin(){ const c=UI.cast; if(!c)return; const L=G.games[c.g].pbp, sc=i=>typeof L[i][7]==='number'&&typeof L[i][8]==='number'?L[i][7]+':'+L[i][8]:null; let prev='0:0'; for(let i=0;i<c.k&&i<L.length;i++){ const v=sc(i); if(v)prev=v; } let to=-1; for(let i=c.k;i<L.length;i++){ const v=sc(i); if(v&&v!==prev){ to=i; break; } } if(to<0)return toast('지금 장면 뒤로는 건너뛸 득점 장면이 없습니다.'); castJump(to,true); }, /* '결승 장면'은 승패를 미리 알려 줘서 '다음 득점'으로 바꿨다(플레이테스트 4 #2) */
  cmkFold(v,el){ const d=el&&el.closest('details'); UI.cmkFoldOpen=d?!d.open:!UI.cmkFoldOpen; render(); document.querySelectorAll(".cmk-det").forEach(x=>x.open=UI.cmkFoldOpen); }, /* 휴대폰에서 펼친 상태를 다시 그려도 유지 */
  attrCmp(v){ UI.attrCmp=v; render(); },
  champSceneClose(){ const C=G.champScene; if(C){ C.seen=true; save(); } document.getElementById('champScene')?.remove(); if(C)A.champMoment(C.y); }, /* 우승 장면을 닫으면 우승 순간 사진(사이트에서만) */
  psOpen(){ UI.it=UI.it||{}; UI.it.stand='ps'; A.go('league:stand'); },
  castSnd(){ const on=!sndPref(); try{ localStorage.setItem('fo_snd',on?'1':'0'); }catch(e){} if(!on)sndStopAll(); else { sndInit(); if(UI.cast&&UI.cast.play)sndLoop('amb','amb',.4,1.2); } const b=document.getElementById('cs-snd'); if(b){ b.textContent=on?'소리 켬':'소리 끔'; b.setAttribute('aria-pressed',on); } },
  castSpd(){ const c=UI.cast; if(!c)return; const L=[1,1.5,2,3]; c.spd=L[(L.indexOf(c.spd)+1)%L.length]; UI.castSpd=c.spd; const b=document.getElementById('cs-spd'); if(b)b.textContent=c.spd+'배속'; if(c.play)castRestart(); },
  castMode(v){ const c=UI.cast; if(!c)return; c.mode=v; UI.castMode=v; document.querySelectorAll('.cs-mode button').forEach(b=>{ b.classList.toggle('on',b.dataset.v===v); b.setAttribute('aria-pressed',b.dataset.v===v); }); if(c.play)castRestart(); },
  castEnd(){ const c=UI.cast; if(c)castJump(G.games[c.g].pbp.length,false); },
  castBox(){ const c=UI.cast, g=c&&G.games[c.g]; if(g&&g.pbp&&c.k<g.pbp.length){ A.castView('data'); return; } /* 중계 도중에는 지금까지 기록만(전체 박스스코어는 최종 결과를 미리 보여 줌) */ const gi=c?c.g:null, cw=UI.cwAfter; A.castClose(true); if(gi!=null)A.openGame(gi); if(cw&&G.cwS&&G.cwS.id===cw){ UI.cwAfter=null; A.cwOpen(); } }, /* 함께 본 경기는 박스스코어로 나가도 동석 결과 창(검수 11-07) */
  castPlayer(v){ const c=UI.cast; if(!c)return; c.wasPlay=!!c.play&&!c.pre; c.play=false; CT.tok++; CT.run=false; UI.castRet=c; UI.cast=null; A.player(v); },
  watch(v){ UI.sheet=null; UI.posSheet=null; UI.game=+v; UI.gtab='pbp'; UI.pbp={g:+v,k:0}; renderSheet(); },
  async slotCopy(){if(!G)return false;const source=saveActionSource(),m=meta(),to=SLOT_IDS.find(n=>!slotUsed(n,m));if(!to){UI.slotMsg='빈 슬롯이 없습니다. 슬롯 하나를 지운 뒤 다시 누르세요.';render();return false;}const info=slotInfo(),memo=m.slots[source.slot]?.memo;if(memo!=null)info.memo=memo;UI.slotMsg='빈 슬롯에 저장하는 중입니다.';render();const ok=await writeSlotConfirmed(to,packJ(source.j),info,0,{replace:true,body:null});if(!ok){UI.slotMsg=`따로 저장하지 못했습니다. ${SAVE_ERR||''}`.trim();render();return false;}UI.slotMsg=`슬롯 ${to}에 지금 상황(${info.date})을 따로 저장했습니다. 계속 진행하는 곳은 슬롯 ${source.slot}입니다.`;render();return true;},
  /* 지금 진행을 이미 쓰는 다른 슬롯에 덮어 저장(커뮤니티 제보 11-11): 한 번 더 눌러야 덮는다. 계속 진행하는 곳은 지금 슬롯 */
  async slotOver(v){if(!G)return false;const n=+v;if(n===curSlot()||!SLOT_IDS.includes(n))return false;if(sbFlag(meta(),n)&&!await sbRefresh([n])){UI.slotMsg=`슬롯 ${n}의 최신 저장을 읽지 못해 덮어쓰지 않았습니다.`;render();return false;}const m=meta(),source=saveActionSource(),old=UI.overAsk,body=sbGet(n);if(m.slots[n]?.lock){UI.slotMsg=`슬롯 ${n}은(는) 보관 중입니다.`;render();return false;}
    if(!old||old.n!==n||!saveActionSame(old.source)){const info=slotInfo(),memo=m.slots[source.slot]?.memo;if(memo!=null)info.memo=memo;UI.overAsk={n,rev:revOf(m,n),body,source,data:packJ(source.j),info};UI.slotMsg=`슬롯 ${n}의 저장(${m.slots[n]?.name||''})을 지우고 지금 진행(${dstr(G.day)})으로 덮어씁니다. 되돌릴 수 없습니다. 한 번 더 누르면 덮어씁니다.`;render();return false;}
    UI.overAsk=null;if(revOf(m,n)!==old.rev||body!==old.body){UI.slotMsg=`슬롯 ${n}에 다른 탭(창)이 그사이 저장해 덮어쓰지 않았습니다. 다시 확인해 주세요.`;render();return false;}const ok=await writeSlotConfirmed(n,old.data,old.info,old.rev,{replace:true,body:old.body});UI.slotMsg=ok?`슬롯 ${n}에 지금 상황(${old.info.date})을 덮어 저장했습니다. 계속 진행하는 곳은 슬롯 ${old.source.slot}입니다.`:`덮어쓰지 못했습니다. ${SAVE_ERR||''}`.trim();render();return ok;},
  slotAll(){ UI.slotAll=!UI.slotAll; render(); },
  dpick(v){ UI.open=UI.open||{}; UI.open.dviewMenu=false; if(v==='hist'||v==='fd'){ UI.drv=v; render(); return; } UI.drv=null; UI.df=UI.df||{pos:'all',typ:'all',reg:'all',sort:'rk',seg:'board',more:20}; UI.df.seg=v==='card'?'board':v; if(v==='card'||v==='board')UI.dview=v==='card'?'card':'list'; render(); }, /* 드래프트 '보기 ▾'(33_scouting_train draftViewMenu) */
  jumpTo(v){ const e=document.getElementById(v); if(e)e.scrollIntoView({block:'start',behavior:'smooth'}); }, /* 긴 화면 바로 가기(jumpBar) */
  tpOpen(v,el){ const c=el&&el.closest('.tmk'); if(c){ c.classList.toggle('open');const open=c.classList.contains('open');(UI.teamOpen=UI.teamOpen||{})[v]=open;el.textContent=open?'접기':'자세히';el.setAttribute('aria-expanded',String(open)); } },
  lrAll(){ UI.lrAll=!UI.lrAll; render(); },
  extOpen(v){ A.player(v); A.jump('ext'); },
  /* 연장 협상 창 바로 열기(연장 요구 소식·면담 계약 이야기·소식 버튼): 열 수 없으면 이유를 알린다(피드백 11-17 연장) */
  extNgt(v){ const p=G.players[+v]; const why=extWhy(p); if(why){ toast(`연장 협상을 열 수 없습니다. ${why}`); if(p&&p.team===G.user&&!UI.meet){ A.player(p.id); UI.ptab='mgmt'; renderSheet(); } render(); return; } if(!UI.meet&&UI.sheet!==p.id)A.player(p.id); UI.ptab='mgmt'; UI._ngtY=0; ngtOpen('ext',p.id); render(); },
  jump(v){ UI.ptab='mgmt'; renderSheet(); const el=document.getElementById('s-'+v); if(el)el.scrollIntoView({block:'start'}); },
  ptab(v){ UI.ptab=v; renderSheet(); const sh=document.querySelector('#sheet .sheet'); if(sh)sheetScrollTo(0); },
  lsort(v){ const [id,k]=v.split(':'); UI.ls=UI.ls||{}; const c=UI.ls[id]; const asc=['era','whip','ra','hra','bb','so','name','tm','pos','role'].includes(k)&&!(id==='bat'&&k==='bb')&&!(id==='pit'&&k==='so')&&!(id==='team'&&k==='so'); UI.ls[id]={k,dir:c&&c.k===k?-c.dir:(asc?1:-1)}; render(); },
  lrec(v){ UI.lrec=v; render(); },
  fuF(v){ UI.fuF=v; render(); }, fuAll(){ UI.fuAll=!UI.fuAll; render(); },
  lrfQ(){ UI.lrf=Object.assign({q:true,t:'all'},UI.lrf); UI.lrf.q=!UI.lrf.q; render(); },
  sbd(v){ if(v==='')return; UI.sbd=+v; render(); },
  nseg(v){ UI.nseg=v; UI.fbo=null; render(); },
  milAll(){ UI.milAll=!UI.milAll; render(); },
  fbOpen(v){ UI.fbo=v; UI.fbf='all'; A.go('club:fans'); },
  fbo(v){ UI.fbo=UI.fbo===v?null:v; render(); },
  fbf(v){ UI.fbf=v; UI.fbo=null; render(); },
  nco(v){ UI.nco=UI.nco||{}; UI.nco[v]=!UI.nco[v]; render(); },
  lteam(v){ UI.clubInspect=null; if(v===''){UI.leagueTeam=null;render();return;} UI.rosterTeam=+v; closeSheets(); UI.tab='roster'; render(); window.scrollTo(0,0); },
  lteamGo(v){ if(+v===G.user){ UI.rosterTeam=null; UI.tab='roster'; closeSheets(); render(); window.scrollTo(0,0); return; } closeSheets(); UI.teamSh=+v; renderSheet(); },
  tradeNews(){UI.it=UI.it||{};UI.it.mkv='news';A.go('trade:market');},
  tradeReview(){UI.trade.stage='review';render();window.scrollTo(0,0);},
  tradePick(){UI.trade.stage='pick';render();window.scrollTo(0,0);},
  tradeGm(){const ts=G.teams.filter(t=>t.id!==G.user),i=ts.findIndex(t=>t.id===UI.trade.tid);UI.pg=UI.pg||{};UI.pg.gms=Math.max(0,Math.floor(i/(innerWidth<700?1:3)));A.go('trade:gms');},
  tpartner(v){ if(UI.trade.tid===+v)return; const o=UI.trade, P=pkNorm(o.pk), cs=(o.cash||0)>0?o.cash:0; const lost=(o.cash||0)<0||P.get.length; /* 우리 쪽 자산(선수·주는 현금·우리 지명권)은 그대로, 상대에게 받기로 한 현금·지명권만 뺀다(검수 11-09v) */
    UI.trade={tid:+v,give:o.give||[],get:[],cash:cs,pk:P.give.length?{give:P.give,get:[],y:P.y}:null,msg:lost&&o.tid!=null?'상대 구단을 바꿔 받기로 한 현금·지명권은 뺐습니다. 보낼 선수·현금·지명권은 그대로입니다.':'',seg:o.seg||'bat',side:'get',sort:o.sort||'cur'};render();},
  tseg(v){UI.trade.seg=v;render();},
  tside(v){UI.trade.side=v;render();},
  tpool(v){const [a,b]=String(v).split(':');UI.trade.side=a;UI.trade.seg=b;render();}, /* 상대/우리 × 야수/투수를 한 줄로(UI 3단계 3-9) */
  tsideGo(v){ UI.trade.side=v;if(innerWidth<700)UI.trade.stage='pick'; render(); requestAnimationFrame(()=>{ const e=document.getElementById('tpick'); if(e)e.scrollIntoView({behavior:'smooth',block:'start'}); }); },
  tsort(v){UI.tsortBy=Object.assign({},UI.tsortBy,{[UI.trade.side||'get']:v});UI.trade.sort=v;render();}, /* 상대·우리 선수 정렬을 따로 기억(제보 11-17) */
  tpick(v){const [side,id]=v.split(':');const arr=UI.trade[side];const i=arr.indexOf(+id);i>=0?arr.splice(i,1):arr.push(+id);UI.trade.msg='';UI.trade.want=null;render();},
  pkT(v){ const tr=UI.trade; const i=v.indexOf(':'), side=v.slice(0,i), k=v.slice(i+1); tr.pk=pkNorm(tr.pk); const L=tr.pk[side]; const j=L.indexOf(k); if(j>=0)L.splice(j,1); else L.push(k); render(); },
  treset(){UI.trade.give=[];UI.trade.get=[];UI.trade.pk=null;UI.trade.cash=0;UI.trade.counters=null; /* 현금·지난 역제안도 비운다(검수 11-08c) */UI.trade.msg='';UI.trade.want=null;render();},
  tcash(v){ UI.trade.cash=+v||0; render(); },
  ntcAsk(v){ const [id,tid,b]=String(v).split(':'); const r=ntcAsk(+id,+tid,b==='1'); toast(r); if(UI.trade)UI.trade.msg=r; save(); render(); },
  tpropose(){const tr=UI.trade;const r=proposeTrade(tr.tid,tr.give,tr.get,tr.cash||0,tr.pk);tr.msg=r.msg;tr.ok=r.ok;tr.counters=r.counters||null;if(r.ok){tr.give=[];tr.get=[];tr.cash=0;tr.pk=null;UI.stamp={fans:(()=>{ try{ return tradeFanLines(); }catch(e){ return []; } })(),msg:r.msg,grade:r.grade};sfx('cheer_hit',.5);sfx('confirm',.7);G.tsug=null;} else sfx('mitt',.4); save();render();},
  tctrNo(){ const tr=UI.trade; tr.counters=null; tr.ok=false; tr.msg=`${tshort(tr.tid)} 단장의 수정 제안을 거절했습니다. 조건을 바꿔 다시 제안할 수 있습니다.`; render(); },
  tctrEdit(v){ const tr=UI.trade; const c=(tr.counters||[])[+v]; if(!c)return; tr.give=[...c.give]; tr.get=[...c.get]; tr.cash=c.cash||0; tr.pk=c.pk||null; tr.counters=null; tr.ok=false; tr.msg='상대 단장의 수정 제안을 불러왔습니다. 고쳐서 다시 제안하세요(그대로 내면 그 조건을 수락하는 것과 같습니다).'; render(); }, /* 상대 조건을 출발점으로 다시 짠다 */
  tcounter(v){ const tr=UI.trade; const c=(tr.counters||[])[+v]; if(!c)return; const bk={give:[...tr.give],get:[...tr.get],cash:tr.cash,pk:tr.pk,counters:tr.counters,msg:tr.msg,ok:tr.ok,want:tr.want}; tr.give=[...c.give]; tr.get=[...c.get]; if(c.cash!=null)tr.cash=c.cash; if(c.pk)tr.pk=c.pk; tr.counters=null; A.tpropose();
    if(UI.cfm&&UI.cfm.k==='tpropose')UI.cfm.doc.noGo=()=>{ Object.assign(UI.trade,bk); render(); }; }, /* 상대가 낸 조건 그대로(현금·지명권 포함). 결재를 취소하면 작성하던 안과 역제안 카드로 돌아간다(검수 11-09v) */
  stampOff(){ UI.stamp=null; render(); },
  faSel(v){ UI.faSel=UI.faSel===+v?null:+v; UI.offer=null; render(); if(UI.faSel){ const el=document.querySelector('.faroom'); if(el)el.scrollIntoView({block:'start'}); } },
  faPos(v){ UI.faPos=v; render(); },
  agSel(v){ UI.agSel=+v; if(UI.tab==='transfer'&&curSub('transfer')==='agents'){ render(); return; } A.go('transfer:agents'); }, /* 에이전트 명단에서 담당자 고르기 */
  agPitchOk(v){ const r=agPitchOk(+v); note('FA',r); UI.faMsg={id:+v,t:r}; save(); render(); },
  faLL(v){ const r=agLastLook(+v); note('FA',r); UI.faMsg={id:+v,t:r}; save(); render(); },
  faMatch(v){ const id=+v; const o=agMatchOffer(id); UI.faSel=id; if(!o){ UI.faMsg={id,t:'맞출 다른 구단 제안이 없습니다.'}; A.go('transfer:fa'); return; } const r=faNegotiate(id,o); UI.faMsg={id,t:r.msg}; save(); A.go('transfer:fa'); },
  faOpen(v){ UI.faSel=+v; UI.offer=null; A.go('transfer:fa'); },
  myRos(){ UI.myRos=true; renderSheet(); },
  csort(v){ UI.csort=v; render(); },
  protTog(v){ const [cid,pid]=String(v).split(':'); const c=(G.comp||[]).find(x=>x.id===cid); if(!c)return; const L=protOf(c), i=L.indexOf(+pid); if(i>=0)L.splice(i,1); else L.push(+pid); render(); }, /* 명단은 카드별(검수 11-09r) */
  protAuto(v){ const [cid,k]=String(v).split(':'); const c=(G.comp||[]).find(x=>x.id===cid); if(!c)return; protOf(c); UI.prot[c.id]=k==='ovr'?protByOvr(c):aiProtect(G.user,COMP[c.grade].prot); render(); },
  protSubmit(v){ if(G.unemp){ toast('지금은 맡은 구단이 없습니다.'); return; } const c=(G.comp||[]).find(x=>x.id===v); if(!c)return; const g=COMP[c.grade]; const ids=protOf(c); if(ids.length>g.prot)return; const r=compSubmit(v,ids); if(c.stage==='protect'){ toast(r); render(); return; } /* 제출이 안 됐으면 완료 도장 대신 안내만(검수 11-08) */ delete UI.prot[c.id]; UI.stamp={title:'보호명단 제출',msg:r}; save(); render(); },
  cpOpt(v){ const [k,x]=String(v).split(':'); UI['cp'+k]=x; render(); },
  cpPos(v){ UI.cpPos=v||'all'; render(); }, /* 구단 프로필 선수단 포지션 칩 */
  protOpt(v){ const [k,x]=String(v).split(':'); UI[k==='s'?'prS':'prF']=x; render(); }, /* 보호명단 정렬·필터 칩 */ /* 보상선수 후보 정렬·필터 칩 */
  compPick(v){ if(G.unemp){ toast('지금은 맡은 구단이 없습니다.'); return; } /* 야인은 전 구단 보상선수를 고를 수 없다 */ const [id,pid]=v.split(':'); const c=(G.comp||[]).find(x=>x.id===id); if(!c||c.stage!=='pick'||c.from!==G.user)return; if(+pid&&!compCands(c).some(q=>q.id===+pid)){ toast('지명할 수 없는 선수입니다(보호선수이거나 소속이 바뀜).'); return; } const check=compPickCheck(c,+pid||null); if(!check.ok){ toast(check.msg); render(); return; } if(!compResolve(c,+pid||null)||c.stage!=='done'||(+pid&&G.players[+pid].team!==G.user)){ toast('지명하지 못했습니다. 보호 대상이거나 지명할 수 없는 선수입니다.'); render(); return; } /* 실제로 끝났을 때만 완료 화면(검수 11-06) */ UI.stamp={title:+pid?'보상선수 지명':'보상금 선택',msg:+pid?`${G.players[+pid].name}을(를) 보상선수로 데려옵니다. 보상금 ${money(c.cash)}.`:`선수 대신 보상금 ${money(c.cash)}을(를) 받습니다.`}; save(); render(); },
  cmode(v){ UI.cmode=v; UI.it=UI.it||{}; UI.it.coach=v==='other'?'po':'mk'; UI.poachMsg=null; render(); },
  poach(v){ const [t,k,to]=v.split(':'); UI.poachMsg=poachCoach(+t,k,to); note('감독',UI.poachMsg); save(); render(); },
  mgrDir(v){ const [k,on]=v.split(':'); UI.dirMsg=setMgrDir(k,on==='1'); note('감독',UI.dirMsg); save(); render(); },
  pitchArg(v){ const st=UI.pitch; if(!st)return; const i=st.args.indexOf(v); if(i>=0)st.args.splice(i,1); else { st.args.push(v); if(st.args.length>2)st.args.shift(); } renderSheet(); },
  pitchCmt(v){ const st=UI.pitch; if(!st)return; const i=st.cmts.indexOf(v); if(i>=0)st.cmts.splice(i,1); else st.cmts.push(v); renderSheet(); },
  pitchGo(v){ const st=UI.pitch; const r=ownerPitch(+v,st?st.args:[],st?st.cmts:[]); UI.pitchMsg={id:+v,t:r}; save(); renderSheet(); },
  owWhy(v){ const S=UI.ow=UI.ow||{}; S.k=S.k===v?null:v; S.amt=null; S.pid=null; S.res=null; render(); }, owAmt(v){ UI.ow.amt=+v; UI.ow.res=null; render(); }, owPid(v){ UI.ow.pid=+v; UI.ow.res=null; render(); },
  owGo(){ const S=UI.ow; if(!S||!S.k)return; const r=ownerAskWhy(S.k,S.amt,S.pid); S.res={ok:r.ok,said:r.said,msg:r.msg}; note('구단주',r.msg); save(); render(); }, /* 사유를 고르는 구단주 자금 요청 */
  ownAsk(v){ const [k,x]=v.split(':'); let r; if(k==='gen')r=ownerAsk(+x,null); else if(k==='fa'){ const p=G.players[+x]; r=ownerAsk(p.ask.annual,{k:'fa',pid:+x}); } else { const p=G.players[+x]; r=ownerAsk(round5(Math.max(500,p.sal*.6)),{k:'frep',pid:+x}); } UI.ownMsg=r; note('구단주',r); save(); render(); },
  featF(v){ UI.ftf=v; render(); },
  abf(v){ UI.abf=v; render(); },
  fwatch(v){ UI.fmsg2=null; const r=fwatchToggle(+v); UI.fwMsg=r; save(); render(); if(r&&typeof toast==='function')toast(r); }, /* 후보 줄 '관찰' 단추(카페 11-17)도 결과를 바로 알린다 */
  featY(v){ UI.fy=v==='all'?'all':+v; render(); },
  retWar(v){ G.cfg=G.cfg||{}; G.cfg.retWar=+v; save(); render(); },
  goalTalk(v){ const r=goalTalk(v); if(r)toast(r); save(); render(); },
  ivFolNow(){ if(G.iv&&G.iv.k==='follow'&&!G.iv.done){ ivAuto(); toast('홍보팀이 후속 질문에 대신 답했습니다.'); save(); try{ renderSheet(); }catch(e){} render(); } },
  psNoCast(v){ G.cfg=G.cfg||{}; G.cfg.psNoCast=v==='1'; save(); render(); },
  ivFolDel(v){ G.cfg=G.cfg||{}; G.cfg.ivFolDel=v==='1'; if(v==='1'&&G.iv&&G.iv.k==='follow'&&!G.iv.done)ivAuto(); save(); render(); try{ if(UI.sheet!=null)renderSheet(); }catch(e){} },
  actMode(v){ try{ localStorage.setItem(ACT_MODE_KEY,v==='compact'?'compact':'all'); }catch(e){} render(); if(UI.sheet!=null)try{ renderSheet(); }catch(e){} }, /* 선수 화면 버튼 표시(기기마다) */
  ratScale(v){ G.cfg=G.cfg||{}; G.cfg.scale=v==='2080'?'2080':'100'; save(); render(); if(UI.sheet!=null)try{ renderSheet(); }catch(e){} }, /* 능력치 표기 */
  obCer(v){ const ob=obOf(v); if(!ob)return; const r=obLateCer(ob.id); save(); toast(r); render(); },
  obAct(v){ const [id,k]=v.split(':'); const ob=obOf(id); if(!ob)return; G.obFace=G.obFace||{};
    if(k==='coach'){ let c=(G.cmarket||[]).find(x=>x.ob===id); if(!c){ c=obCoach(ob); G.cmarket.unshift(c); } UI.crole=c.role; UI.smkK='coach'; UI.smkSrc='free'; A.go('staff:smkt'); return; }
    if(k==='mgr'){ if(!(G.mmarket||[]).some(m=>m.ob===id))G.mmarket.unshift(obMgr(ob)); A.go('staff:mgr'); return; }
    if(k==='scout'){ if(G.scouts.length>=scoutMax())return; const s=(G.scoutMarket||[]).find(x=>x.ob===id)||obScout(ob); G.scoutMarket=(G.scoutMarket||[]).filter(x=>x.ob!==id); s.since=G.day; G.scouts.push(s); staffHistory('scout',s,'선임',G.user,'OB 출신 영입 · 연 '+money(s.sal)); obHireBonus(id,'스카우트'); addLog(`OB ${ob.name}을(를) 스카우트로 영입했습니다.`); save(); render(); return; }
    if(k==='front'){ ob.alt={k:'front',tid:G.user,t:`${tshort(G.user)} 프런트`}; ob.bond+=5; obHireBonus(id,'프런트'); addLog(`OB ${ob.name}이(가) 우리 프런트에 합류했습니다.`); save(); render(); } },
  reroll(){ UI.world=null; render(); },
  psTab(v){ UI.psTab=v; renderSheet(); }, /* 인물 카드 구역 탭(UI 3단계 3-0) */
  tsTab(v){ UI.tsTab=v; renderSheet(); }, /* 구단 정보 창 구역 탭(UI 3단계 3-0) */
  ownView(v){ UI.ownView=v; render(); }, /* 구단주 화면 구역(UI 3단계 3-0) */
  person(v,el){ peopleCapture(v,el);UI.sheet=null; UI.person=v; UI.personMsg=null; UI.teamSh=null; renderSheet(); }, /* 선수 정보 안의 인물 링크(11-09r)와 구단 정보 창의 감독·코치(카페 11-09c)도 인물 창으로 */
  peopleStep(v){peopleStep(v);},
  relGo(v){ peopleCapture(v);const [a,id]=relKey({k:v}); UI.relK=v; A[a](id); }, /* 관계도 인물·선수 이전/다음(카페 11-10) */
  gmCall(v){ const r=gmContact(+v,'call'); UI.gmRes={t:+v,m:r.msg,ok:r.ok}; UI.personMsg=r.msg; if(r.ok)sfx('confirm',.5); save(); render(); },
  gmMeal(v){ const r=gmContact(+v,'meal'); UI.gmRes={t:+v,m:r.msg,ok:r.ok}; UI.personMsg=r.msg; if(r.ok)sfx('confirm',.5); save(); render(); },
  findT(v){ UI.findT=v===''?null:+v; UI.deskMsg=null; A.go('trade:find'); },
  findMine(v){ UI.findM=v===''?null:+v; UI.deskMsg=null; UI.it=UI.it||{}; UI.it.mkv='sell'; A.go('trade:find'); }, /* 가치 보기는 '보낼 선수' 탭에서 바로 결과를(플레이 테스트 11-13: 선수 검색 탭으로 튕겼다) */
  findPos(v){ UI.findPos=v; render(); },
  gmFix(v){ UI.findPos=v; UI.findT=null; UI.castRet=null; delete G.castHold; if(UI.cast){ UI.cast.play=false; CT.tok++; CT.run=false; UI.cast=null; } A.go('trade:find'); spoilFlush(); },
  pwatch(v){ pwatchToggle(+v); save(); const c=UI.cast; if(c&&G.games[c.g]){ cSide(G.games[c.g],c.k); } else { render(); renderSheet(); } },
  mktGo(v){ const x=(UI._mkt||[])[+v]; const m=UI.findM; if(!x||m==null)return; const r=proposeTrade(x.tid,[m],x.give); UI.deskMsg=r.msg; UI.deskOk=r.ok; if(r.ok){ UI.stamp={fans:(()=>{ try{ return tradeFanLines(); }catch(e){ return []; } })(),msg:r.msg,grade:r.grade}; sfx('cheer_hit',.5); UI.findM=null; G.tsug=null; } save(); render(); },
  jobYes(v){ const r=jobAnswer(v,true); UI.tab='home'; closeSheets(); UI.calSel=null; UI.calTgt=null; UI.calYM=null; UI.mail=null; UI.game=null; /* 옛 구단 화면 상태(달력 선택·열린 경기)를 남기지 않는다 */ UI.gmMsg=r; save(); render(); window.scrollTo(0,0); },
  jobNo(v){ jobAnswer(v,false); save(); render(); },
  toTrade(v,el){const p=G.players[+v]; if(UI.trade.tid!==p.team)UI.trade={tid:p.team,give:UI.trade.give||[],get:[],msg:'',sort:UI.trade.sort||'cur'}; else if(el&&el.closest&&el.closest('.bk-c'))UI.trade.get=[]; /* 매물 목록에서 누르면 새로 시작 */ if(!UI.trade.get.includes(p.id))UI.trade.get.push(p.id); UI.trade.seg=p.isP?'pit':'bat'; UI.trade.side='give'; UI.trade.msg=''; closeSheets(); A.go('trade:table');},
  toTradeGive(v){const p=G.players[+v]; if(p&&hasNtc(p))toast(`${p.name}은(는) 트레이드 거부권이 있습니다(${p.ntc}년까지). 상대 구단을 고른 뒤 선수에게 동의를 구해야 보낼 수 있습니다.`); if(!UI.trade.give.includes(p.id))UI.trade.give.push(p.id);UI.trade.seg=p.isP?'pit':'bat';UI.trade.side='get';closeSheets(); A.go('trade:table');},
  anF(v){ UI.anF=v; render(); },
  ctF(v){ UI.ctF=v; render(); },
  signFree(v){ const r=signFree(+v); if(r){ try{ toast(r); }catch(e){} } save(); render(); },
  trySign(v){ const [id,ys]=String(v).split(':'); const r=trySign(+id,G.user,ys==='1'); try{ toast(r||'계약했습니다.'); }catch(e){} save(); render(); },
  tryF(v){ UI.tryF=v; render(); },
  scF(v){ UI.scF=v; render(); },
  hireScout(v){ const [sid,rz]=String(v).split(':'); const res=stOffer('sc',sid,+rz||0); toast(res.msg); save(); render(); }, /* 명단 반영·기록은 stOffer가 한다(화면에서 넣다가 빠뜨려 후보가 사라졌다, 카페 11-15) */
  fireScout(v){ scoutFire(v); save();render();},
  signF(v){const p=G.players[+v]; const err=foreignCheck(G.user,p); if(err){UI.fmsg=err;renderSheet();return;} signForeign(G.user,p.id); UI.sheet=null; save(); render();},
  offA(v,el){UI.offer={id:+v,annual:+el.value,years:(UI.offer&&UI.offer.id===+v?UI.offer.years:(G.fa.offers[+v]||G.players[+v].ask).years)};
    const a=document.getElementById('offAv'), t=document.getElementById('offTot'); if(a)a.textContent=money(UI.offer.annual); if(t)t.textContent='총액 '+money(UI.offer.annual*UI.offer.years);},
  offY(v){const [id,y]=v.split(':').map(Number);const base=UI.offer&&UI.offer.id===id?UI.offer:(G.fa.offers[id]||G.players[id].ask);UI.offer={id,annual:base.annual,years:y};render();},
  offer(v){const id=+v;const o=UI.offer&&UI.offer.id===id?UI.offer:(G.fa.offers[id]||G.players[id].ask); if(faOutBlocked(G.user,G.players[id])){ UI.faMsg={id,t:`이번 겨울 다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다(${ASSOC.s} 규약 제173조).`}; render(); return; } if(G.day<G.fa.openDay){G.fa.offers[id]={annual:o.annual,years:o.years}; UI.faMsg={id,t:dmd(G.fa.openDay)+' 협상이 열리면 에이전트가 답합니다.'};} else { const r=faNegotiate(id,{annual:o.annual,years:o.years}); UI.faMsg={id,t:r.msg}; } UI.offer=null; save(); render();},
  faAccept(v){ UI.faMsg={id:+v,t:faAcceptCounter(+v)}; save(); render(); },
  unoffer(v){delete G.fa.offers[+v];UI.offer=null;UI.sheet=null;save();render();},
  extA(v,el){ if(!UI.ext)return; UI.ext.annual=+el.value; UI.ext.msg=''; const a=document.getElementById('extAv'), t=document.getElementById('extTot'); if(a)a.textContent=money(UI.ext.annual); if(t)t.textContent='총액 '+money(UI.ext.annual*UI.ext.years); },
  extY(v){ const [,y]=v.split(':').map(Number); if(UI.ext){UI.ext.years=y;UI.ext.msg='';} renderSheet(); },
  extAcc(v){ const p=G.players[+v]; const c=p&&p.extCounter; if(!c)return; const r=offerExtension(+v,c.annual,c.years,true,c.terms||null); if(UI.ext){ UI.ext.msg=r.msg; UI.ext.ok=r.ok; } save(); render(); },
  extOffer(v){ const e=UI.ext; if(!e)return; const r=offerExtension(+v,e.annual,e.years); e.msg=r.msg; e.ok=r.ok; save(); render(); },
  mkt(v,el){G.marketing=+el.value;save();render();}, mktStep(v){ if(period()!=='pre')return; G.marketing=clamp((G.marketing||2000)+(+v||0),500,6000); save(); render(); }, /* 1억 단위 조정(플레이 테스트 11-13: 트랙을 누르면 한 번에 12억씩 바뀌었다) */
  askNew(){UI.confirmNew=true;render();},
  newgame(){ if(G&&!saveOK()){ toast(`지금 게임(${dstr(G.day)})을 저장하지 못해 새 구단을 시작하지 않았습니다. ${SAVE_ERR||''}`.trim()); return; } if(saveHold(()=>A.newgame(),'새 구단을 시작하지'))return; if(!confDrop('new'))return; /* 저장 실패면 현재 게임을 닫지 않는다(검수 11-06) */ G=null; UI.confirmNew=false; UI.newSlot=null; UI.tab='home'; closeSheets(); render(); window.scrollTo(0,0); },
  /* 보관(읽기 전용) 표시: 자동 저장과 덮어쓰기가 이 슬롯에 쓰지 않는다. 진행 중 슬롯은 보관할 수 없다(플레이테스트 3) */
  slotLock(v){ const n=+v, m=meta(), s=m.slots[n]; if(!s)return; if(G&&n===curSlot()){ UI.slotMsg=`슬롯 ${n}은(는) 지금 진행 중이라 보관할 수 없습니다. "빈 슬롯에 따로 저장"으로 사본을 만든 뒤 그 사본을 보관하세요.`; render(); return; } s.lock=!s.lock; if(!setMeta(m)){ UI.slotMsg='저장 공간이 가득 차 보관 표시를 바꾸지 못했습니다.'; render(); return; } UI.slotMsg=s.lock?`슬롯 ${n}을(를) 보관했습니다. 이 슬롯은 덮어쓰지 않으며, 불러오면 빈 슬롯에 사본을 만들어 이어 합니다.`:`슬롯 ${n}의 보관을 풀었습니다.`; render(); },
  /* 새 슬롯에 이어하기: 고른 슬롯의 본문을 빈 슬롯에 복사한 뒤 그 사본을 연다. 원본은 그대로 남는다(플레이테스트 3) */
  async slotLoadNew(v){const n=+v,source=saveActionSource();if(!SLOT_IDS.includes(n))return false;if(!await saveCanLeave(source,'copy:'+n))return false;if(sbFlag(meta(),n)&&!await sbRefresh([n])){UI.slotMsg=`슬롯 ${n}의 최신 저장을 읽지 못해 복사하지 않았습니다.`;render();return false;}if(!saveActionSame(source,false))return false;const m=meta(),body=sbGet(n),src=m.slots[n],g=unpack(body);if(!g||!src){slotBad(n,'저장 본문을 읽을 수 없습니다');UI.slotMsg=`슬롯 ${n}을(를) 불러오지 못했습니다. 저장 본문이 비었거나 손상됐습니다.`;render();return false;}let prepared;try{prepared=savePrepareGame(g);}catch(e){UI.slotMsg=`슬롯 ${n}의 데이터를 복원하지 못해 복사하지 않았습니다.`;render();return false;}const to=SLOT_IDS.find(k=>!slotUsed(k,m));if(!to){UI.slotMsg='빈 슬롯이 없어 새 슬롯에 이어 할 수 없습니다. 슬롯 하나를 지운 뒤 다시 누르세요.';render();return false;}if(src.memo!=null)prepared.info.memo=src.memo;if(revOf(meta(),n)!==revOf(m,n)||sbGet(n)!==body){UI.slotMsg=`슬롯 ${n}이(가) 그사이 다시 저장돼 복사하지 않았습니다.`;render();return false;}UI.slotMsg='새 슬롯에 저장하는 중입니다.';render();const liveBeforeWrite=JSON.stringify(G);const ok=await writeSlotConfirmed(to,prepared.data,prepared.info,0,{replace:true,body:null,activate:true});if(!ok){UI.slotMsg=`새 슬롯에 복사하지 못했습니다. ${SAVE_ERR||''}`.trim();render();return false;}if(source.g!==G||source.slot!==curSlot()||source.title!==!!UI.title||JSON.stringify(G)!==liveBeforeWrite){if(meta().active===to&&curSlot()!==to&&slotHas(curSlot()))setActive(curSlot());UI.slotMsg=`슬롯 ${to}에 사본을 저장했지만 게임이 바뀌어 자동으로 열지 않았습니다.`;render();return false;}saveOpenGame(g,to,meta());UI.slotMsg=`슬롯 ${n}의 저장을 슬롯 ${to}에 복사해 이어 합니다. 슬롯 ${n}은(는) 그대로 남습니다.`;render();window.scrollTo(0,0);return true;},
  async slotLoad(v){const n=+v;if(!SLOT_IDS.includes(n))return false;if(meta().slots[n]?.lock)return A.slotLoadNew(n);const source=saveActionSource();if(!await saveCanLeave(source,'open:'+n))return false;if(sbFlag(meta(),n)&&!await sbRefresh([n])){UI.slotMsg=`슬롯 ${n}의 최신 저장을 읽지 못해 열지 않았습니다.`;render();return false;}if(!saveActionSame(source,false))return false;const m=meta(),g=unpack(sbGet(n));if(!g){slotBad(n,'저장 본문을 읽을 수 없습니다');UI.slotMsg=`슬롯 ${n}을(를) 불러오지 못했습니다. 저장 본문이 비었거나 손상됐습니다. 내보내기 백업이 있으면 그걸로 가져오세요.`;render();return false;}try{savePrepareGame(g);}catch(e){slotBad(n,'복원 오류');UI.slotMsg=`슬롯 ${n}의 데이터를 복원하다 오류가 나 열지 않았습니다(${String(e?.message||e).slice(0,60)}).`;render();return false;}if(!setActive(n)){UI.slotMsg=`슬롯 ${n}(으)로 바꾸는 기록을 저장하지 못해 열지 않았습니다. 지금 게임은 그대로입니다.`;render();return false;}saveOpenGame(g,n,m);UI.slotMsg=slotRollbackNotice(n,g);render();window.scrollTo(0,0);return true;},
  slotNew(v){ if(G&&!saveOK()){ UI.slotMsg=`지금 게임을 저장하지 못해 새 게임을 시작하지 않았습니다. ${SAVE_ERR||''}`.trim(); render(); return; } if(saveHold(()=>A.slotNew(v),'새 게임을 시작하지'))return; if(!confDrop('new'+v))return; UI.newSlot=+v; UI.newSlotRev=(meta().slots[+v]||{}).rev||0; UI.newSlotUsed=slotUsed(+v,meta()); /* 고른 뒤 다른 탭이 이 슬롯에 저장하면 시작 때 알린다(검수 11-08) */ /* 활성 슬롯·저장 대상은 구단을 골라 시작할 때 바꾼다(검수 11-07: 고르기 전에 돌아오면 이어하기가 사라짐) */ G=null; UI.slotMsg=''; UI.title=true; UI.sstep='mode'; render(); window.scrollTo(0,0); },
  async slotDel(v){ v=+v; if((meta().slots[v]||{}).lock){ UI.slotMsg=`슬롯 ${v}은(는) 보관 중입니다. 보관을 푼 뒤 지우세요.`; render(); return false; } if(G&&v===curSlot()){ UI.slotMsg=`슬롯 ${v}은(는) 이 탭에서 진행 중이라 지울 수 없습니다.`; render(); return false; } let claimed=null;const body=()=>{ try{ return claimed?sbBaseGet(v,claimed):sbGet(v); }catch(e){ return undefined; } };
    if(!UI.delAsk||UI.delAsk.n!==v){ UI.delAsk={n:v,rev:revOf(meta(),v),body:body()}; UI.slotMsg=`슬롯 ${v}을(를) 지우려면 삭제를 한 번 더 누르세요.`; render(); return; }
    const ask=UI.delAsk; UI.delAsk=null; const busy=()=>{ UI.slotMsg=`슬롯 ${v}에 다른 탭(창)이 그사이 저장해 지우지 않았습니다. 목록을 확인하고 다시 누르세요.`; render(); };
    /* 본문 전체와 판번호를 지우기 직전에 다시 확인하고, 목록에 새 판번호를 먼저 적어 슬롯을 차지한 뒤 지운다: 그 뒤 다른 탭 저장은 충돌로 막힌다(검수 11-09 #2, 11-09zr #2: 본문 길이만 비교, 확인과 삭제 사이 저장) */
    const m0=meta(); if(revOf(m0,v)!==ask.rev||body()!==ask.body)return busy(); const oldInfo=m0.slots[v], r=revNext(ask.rev); m0.slots[v]=Object.assign({},m0.slots[v]||{name:''},{rev:r,deleting:{old:oldInfo}}); if(!setMeta(m0)){ UI.slotMsg=`슬롯 ${v}을(를) 지우지 못했습니다. 저장 목록을 기록하지 못했습니다.`; render(); return false; }claimed=oldInfo||{rev:ask.rev};
    if(body()!==ask.body){ slotFix(v,r); return busy(); }
    let gone=false; try{ gone=await sbRemove(v,r)&&sbGet(v)==null; }catch(e){} if(!gone){ try{ const m=meta(); if(revOf(m,v)===r&&body()===ask.body){ if(oldInfo)m.slots[v]=oldInfo; else delete m.slots[v]; setMeta(m); } }catch(e){} UI.slotMsg=`슬롯 ${v}을(를) 지우지 못했습니다. 브라우저 저장소가 삭제를 막았습니다.`; render(); return false; } /* 실제로 지워졌을 때만 목록에서 뺀다(검수 11-06) */
    const m=meta(); if(revOf(m,v)===r)delete m.slots[v]; delete SLOT_BAD[v]; if(m.active===v){ const k=contSlot(m); if(k!=null)m.active=k; } /* 다른 탭이 활성으로 만든 슬롯을 지우면 남은 슬롯으로(검수 11-09 #11) */ UI.slotMsg=setMeta(m)?`슬롯 ${v}을(를) 지웠습니다.`:`슬롯 ${v}의 저장 내용은 지웠지만 저장 목록을 갱신하지 못했습니다. 목록 정보만 남은 칸은 삭제를 다시 눌러 정리하세요.`; render(); },
  async expFile(){ if(!G)return; const g0=G, n0=curSlot(), d0=G.day, bk0=G.bkAt; G.bkAt=d0; let code; try{ code=LZString.compressToBase64(prepG()); }finally{ G.bkAt=bk0; } /* 파일에는 백업일을 넣어 두고, 게임에는 내려받기가 끝난 뒤에만 적는다(검수 11-09zr #16) */ /* 로컬 저장과 같은 내용(중계 재개 위치 포함, 검수 11-06) */
    const done=()=>{ backupMark(g0,d0); if(G===g0&&curSlot()===n0){ try{ saveNow(); }catch(e){} } }; /* 완료 순서가 뒤집혀도 더 최근 파일의 백업일을 보존한다. */
    if(!DL){ try{ const blob=new Blob([code],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`danjang-${g0.year}.txt`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000); done(); UI.impMsg='파일을 내려받았습니다. 내려받기가 막혀 있으면 "코드 만들기"를 쓰세요.'; }catch(err){ UI.impMsg='이 화면에서는 파일 저장을 쓸 수 없습니다. "코드 만들기"를 쓰세요.'; } render(); return; }
    try{ await DL.save({filename:`danjang-${tshort(g0.user)}-${g0.year}.txt`,data:code}); done(); UI.impMsg='파일을 저장했습니다.'; }catch(err){ UI.impMsg=err&&err.code==='declined'?'파일 저장을 취소했습니다.':err&&err.code==='rate_limited'?'잠시 뒤 다시 눌러 주세요.':'파일로 저장하지 못했습니다. "코드 만들기"를 쓰세요.'; } render(); },
  expCode(){ if(G)G.bkAt=G.day; UI.expCode=LZString.compressToBase64(prepG()); saveNow(); render(); A.expCopy(true); }, /* 만들자마자 자동 복사도 시도 */
  async expCopy(auto){ const t=UI.expCode||''; if(!t)return; let ok=false; try{ if(navigator.clipboard&&navigator.clipboard.writeText){ await navigator.clipboard.writeText(t); ok=true; } }catch(e){ ok=false; /* 권한이 막힌 곳(일부 iframe)은 아래 방식으로 */ }
    if(!ok){ const el=document.getElementById('expCodeBox'); if(el){ el.focus(); el.select(); try{ ok=document.execCommand('copy'); }catch(e){ ok=false; } } }
    toast(ok?'코드를 복사했습니다. 메모장이나 메신저에 붙여 넣어 보관하세요.':(auto?'코드를 만들었습니다. 코드 복사하기를 눌러 주세요.':'자동 복사가 막혀 있습니다. 코드 칸이 선택돼 있으니 Ctrl+C(휴대폰은 길게 눌러 복사)로 복사하세요.')); },
  async impPaste(){ const el=document.getElementById('impCode'); let t=''; try{ if(navigator.clipboard&&navigator.clipboard.readText)t=await navigator.clipboard.readText(); }catch(e){ t=''; } if(t&&el){ el.value=t.trim(); toast('붙여 넣었습니다. 코드로 불러오기를 누르세요.'); } else { if(el)el.focus(); toast('브라우저가 붙여넣기를 막았습니다. 칸을 눌러 Ctrl+V(휴대폰은 길게 눌러 붙여넣기)로 넣어 주세요.'); } },
  bkLater(){ if(G){ G.bkAt=G.day-30; save(); } render(); },
  lgOpen(v){ const id=+v; UI.lgEdit=UI.lgEdit===id?null:id; UI.lgMsg=''; render(); },
  lgEmb(v){ const i=v.indexOf(':'); const tid=+v.slice(0,i), k=v.slice(i+1); lgApply(tid,{emb:k},''); },
  lgImgDel(v){ lgApply(+v,{img:null},'로고 이미지를 지웠습니다.'); },
  lgReset(v){ lgApply(+v,null,'기본 로고로 되돌렸습니다.'); },
  stopTg(v){ if(!STOP_DEF.hasOwnProperty(v))return; G.stopCfg=G.stopCfg||{}; const cur=G.stopCfg[v]!=null?!!G.stopCfg[v]:STOP_DEF[v]; G.stopCfg[v]=!cur; save(); render(); },
  tnSave(){ const r=applyTeamNames(tnRead()); UI.tnMsg=r||'구단 이름을 바꿨습니다.'; if(!r){ let on=false; try{ const o=JSON.parse(localStorage.getItem(TN_KEY)||'null'); on=!!(o&&o.on); }catch(e){} if(on)tnStore(true); save(); } render(); },
  tnReset(){ resetTeamNames(); UI.tnMsg='기본 이름으로 되돌렸습니다.'; let on=false; try{ const o=JSON.parse(localStorage.getItem(TN_KEY)||'null'); on=!!(o&&o.on); }catch(e){} if(on)tnStore(true); save(); render(); },
  tnPre(){ let on=false; try{ const o=JSON.parse(localStorage.getItem(TN_KEY)||'null'); on=!!(o&&o.on); }catch(e){} if(on){ tnStore(false); UI.tnMsg='새 게임에는 기본 이름을 씁니다.'; } else { tnStore(true); UI.tnMsg='새 게임에도 지금 이름을 씁니다.'; } render(); },
  impCode(){ const el=document.getElementById('impCode'); const t=(el&&el.value||'').trim(); return importText(t); },
};

Object.assign(A,{ psy(v){ UI.psy=+v; render(); } }); /* 리그 역사 > 포스트시즌 기록 연도 */

/* 능력치 설명 펼치기(선수 상세 i) */
Object.assign(A,{attrHelp(){ UI.attrHelpOpen=!UI.attrHelpOpen; render(); try{ if(UI.sheet!=null)renderSheet(); }catch(e){} }});
