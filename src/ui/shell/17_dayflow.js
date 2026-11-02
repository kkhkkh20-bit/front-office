/* ---------- A: 하루 흐름 ---------- */
function nextLabel(){ // 계속 버튼 아래 작은 글씨: 다음에 일어날 일
  if(blockNow())return '막힌 일 먼저';
  const per=period();
  if(per==='season'||per==='post'){ const n=nextGames(1)[0]; if(n)return `${dsh(n.d)} ${n.home?'vs':'@'} ${tshort(n.op)}`; }
  if(per==='post'&&G.ps&&G.ps.cur){ const c=G.ps.cur; return `${ROUNDK[c.round]} ${tshort(c.hi)}·${tshort(c.lo)} 진행 · 우리 경기 전날 멈춤`; }
  const u=upcoming()[0]; return u?`${dsh(u[0])} ${u[1]}`:'';
}
function spLine(p){ if(!p)return '미정'; const h=seasonTotal(p,G.year,'1군'); return h&&h.outs?`${h.w||0}승 ${h.l||0}패 · ${pRate(h).era.toFixed(2)}`:'올해 기록 없음'; }
function oppSP(op,d){ const x=projStarters(op,4).find(y=>y.d===d); return x?x.sp:null; }
function stripBar(){ // 지난 3경기 + 다음 2경기
  const per=period(); if(per!=='season'&&per!=='post'&&per!=='pre')return '';
  const past=(G.sea.ulog||[]).slice(-3); const nx=per==='post'?nextGames(2):projStarters(G.user,2);
  if(!past.length&&!nx.length)return '';
  const pc=x=>{ const home=x.h===G.user; const op=home?x.a:x.h; const ms=home?x.hs:x.as, os=home?x.as:x.hs; const gi=G.games.findIndex(g=>g.day===x.d&&(g.home===G.user||g.away===G.user));
    return `<button class="sb-i ${x.res==='승'?'w':x.res==='패'?'l':''}"${tkAt(x.d)} ${gi>=0?`data-a="openGame" data-v="${gi}"`:''}><span class="sb-d">${dsh(x.d)}</span><b>${x.res}</b><span class="num">${ms}:${os}</span><span>${home?'vs':'@'} ${tshort(op)}</span></button>`; };
  const nc=x=>{ const os=x.sp!==undefined?oppSP(x.op,x.d):null; return `<div class="sb-i nx"><span class="sb-d">${dsh(x.d)} ${WD[dobj(x.d).w]}</span><span>${x.home?'vs':'@'} ${badge(x.op,14)}${tshort(x.op)}</span>${x.sp!==undefined?`<span class="sb-sp">${x.sp?esc(x.sp.name):'미정'} <i>vs</i> ${os?esc(os.name):'미정'}</span>`:''}</div>`; };
  return `<div class="sbar" aria-label="지난 경기와 다음 경기">${past.map(pc).join('')}${nx.length?'<span class="sb-sep"></span>':''}${nx.map(nc).join('')}</div>`;
}
function nextCard(){
  const per=period(); if(per!=='season'&&per!=='post'&&per!=='pre')return '';
  const L=nextGames(6); if(!L.length)return '';
  const x=L[0]; const {order,live}=standOrder(); const ri=order.findIndex(o=>o.tid===x.op)+1; const r=G.sea.rec[x.op];
  const hh=h2hOf(G.user,x.op); const l10=l10Of(x.op); const dd=x.d-G.day;
  const mySP=x.ps?null:(projStarters(G.user,1)[0]||{}).sp, thSP=x.ps?null:oppSP(x.op,x.d);
  const spc=(p,tid)=>`<button class="nsp" ${p?`data-a="player" data-v="${p.id}"`:''}>${p?avImg(p):'<span class="av ini">?</span>'}<span><i>${badge(tid,14)} ${tshort(tid)} 예상 선발</i><b>${p?esc(p.name):'미정'}</b><em>${spLine(p)}</em></span></button>`;
  const cv=coverOf(x.op); let weak='';
  { const ps=posStrength(rosterList(x.op)); const ks=FIELDK.concat(['SP','RP']).filter(k=>ps[k]!=null).sort((a,b)=>ps[a]-ps[b]); if(ks.length){ const k=ks[0]; weak=`<p class="small">상대 약점: <b>${k==='SP'?'선발진':k==='RP'?'불펜':POSK[k]}</b> ${dv(ps[k])}</p>`; } }
  return `<section class="card nextc"><div class="row between"><h2 class="sec">다음 경기</h2><span class="row"><span class="small muted">${dd<=1?'내일':`${dd}일 뒤`}</span>${per==='season'||per==='post'||(per==='pre'&&x.d===G.cal.open&&dd<=1)?`<button class="btn small primary" data-a="watchNext" ${blockNow()?'disabled':''} title="결과를 먼저 보지 않고 경기장에서 처음부터 봅니다">직관 가기</button>`:''}</span></div>
    <div class="nx">${badge(x.op,44)}<div><span class="eyebrow">${x.ps?esc(x.ps)+' · ':''}${dmd(x.d)} ${WD[dobj(x.d).w]} · ${x.home?'홈':'원정'}${(()=>{ const pl=gmPlanAt(x.d); return pl&&pl.k==='attend'?` · <b class="acc">직관 예정${pl.x==='owner'?'(구단주 동행)':pl.x==='ceo'?'(사장 동행)':''}</b>`:''; })()}</span><b>${x.home?'vs':'@'} ${tname(x.op)}</b>
      <span class="small muted">${live&&per!=='pre'?`상대 ${ri}위 · ${wlStr(r)} · 최근 10경기 ${wlStr(l10)}${streakOf(x.op)?' · '+streakOf(x.op):''}`:'개막전'}${hh.w+hh.l+hh.t?` · 상대 전적 ${hh.w}승 ${hh.l}패${hh.t?` ${hh.t}무`:''}`:''}</span></div></div>
    ${x.ps?'':`<div class="nsps">${spc(mySP,G.user)}${spc(thSP,x.op)}</div><p class="small muted">로테이션 순번과 휴식일로 본 예상입니다. 부상·피로로 바뀔 수 있습니다.</p>`}
    ${weak}
    ${(()=>{ const o=UI.open.nxCmp??wide(); return `<details class="moreg" data-k="nxCmp" ${o?'open':''}><summary><span>전력 비교</span><i>자리별 주전 비교 · 누르면 상세</i></summary><div class="moreb">${cmpView(x.op,true)}<button class="btn small" data-a="cmpT" data-v="${x.op}">자세히 · 다른 구단과 비교</button></div></details>`; })()}

  </section>`;
}
/* ---------- 실시간 드래프트: 다른 구단 지명을 한 명씩 보여 준다 ---------- */
const DSPD={slow:1100,norm:550,fast:180};
function dliveStart(kind){ if(UI.dl&&UI.dl.on)return; const o=UI.dl&&UI.dl.kind===kind?UI.dl:null; UI.dl={on:true,kind,feed:(o?o.feed:[])||[],stolen:o?o.stolen||[]:[],stN:o?o.stN||0:0}; dliveTick(); }
/* 우리가 노리던 선수: 관심 표시 + 지금 우리 보드 상위 3명 */
function dlTargets(kind){ const m=new Map(); (G.shortlist||[]).forEach(id=>m.set(id,'관심 선수')); return m; }
function dliveTick(){ const L=UI.dl; if(!L||!L.on||!G)return; const T=dlTargets(L.kind); let r=L.kind==='fd'?fdStep():amStep();
  if(r==='user'&&L.kind==='am'){ const x=draftRestPick(); if(x)r=x; }
  if(!r||r==='user'){ L.on=false; L.just=null; save(); render(); return; }
  L.just=r.pid||null; if(r.pid){ const p=G.players[r.pid]; const tg=T.get(r.pid)||null; L.feed.unshift({me:!!r.me,tid:r.pk.tid,rd:r.pk.rd,no:r.pk.no,pid:r.pid,nm:p?p.name:'',pos:p?(L.kind==='fd'&&p.isP?'투수':posLabel(p)):'',age:p?p.age:null,tg,o:L.kind==='fd'&&p?fdEstOf(p):null}); L.feed=L.feed.slice(0,12);
    if(tg){ (L.stolen=L.stolen||[]).unshift({nm:p?p.name:'',tid:r.pk.tid,rd:r.pk.rd,no:r.pk.no,tg,pid:r.pid}); L.stolen=L.stolen.slice(0,20); L.stN=(L.stN||0)+1; } }
  render(); L.t=setTimeout(dliveTick,DSPD[UI.dspeed||'norm']); }
function dlFeedAdd(kind,pk,pid){ if(!UI.dl||UI.dl.kind!==kind)UI.dl={on:false,kind,feed:[]}; const p=G.players[pid]; UI.dl.feed.unshift({tid:pk.tid,rd:pk.rd,no:pk.no,pid,nm:p?p.name:'',pos:p?posLabel(p):'',age:p?p.age:null,tg:null,me:true}); UI.dl.feed=UI.dl.feed.slice(0,12); }
function dliveStop(){ const L=UI.dl; if(L){ L.on=false; clearTimeout(L.t); } save(); render(); }
function dliveBox(kind){ if(!(UI.dl&&UI.dl.kind===kind)&&!UI.dlAuto&&!UI.rev&&!(kind==='fd'&&G.fd&&G.fd.open===false)){ UI.dlAuto=1; setTimeout(()=>{ UI.dlAuto=0; const d=kind==='fd'?G.fd:G.draft; if(d&&!d.done&&d.picks[d.cur]&&d.picks[d.cur].tid!==G.user&&!(UI.dl&&UI.dl.kind===kind))dliveStart(kind); },800); } const L=UI.dl&&UI.dl.kind===kind?UI.dl:null; const on=L&&L.on; const sp=UI.dspeed||'norm';
  const f=L&&L.feed&&L.feed.length?L.feed:[]; const top=f[0];
  return `<div class="dlive ${on?'on':''}">${on?'<span class="dl-dot"></span>':''}<div class="dl-h"><b>${on?'지명 진행 중':'다른 구단 지명'}</b><span class="chips">${[['slow','느리게'],['norm','보통'],['fast','빠르게']].map(([k,l])=>`<button data-a="dlSpd" data-v="${k}" class="${sp===k?'on':''}">${l}</button>`).join('')}${on?'<button data-a="dlStop">멈춤</button><button data-a="dlSkip">우리 차례로</button>':''}</span></div>
    ${top?`<div class="dl-now ${on?'flash':''}">${badge(top.tid,30)}<div><i>${top.rd}-${top.no} · ${esc(tshort(top.tid))}</i><b>${esc(top.nm)}</b><span>${esc(top.pos)}${top.age!=null?` · ${top.age}세`:''}${top.me?' · <em class="good">우리 지명</em>':''}</span></div>${top.o!=null&&!top.me?`<div class="dl-o"><i>우리 추정</i>${fdEstChip(top.o)}</div>`:''}</div>`:''}
    ${L&&L.stolen&&L.stolen.length?(()=>{ const x=L.stolen[0]; const fresh=top&&top.pid===x.pid; return `<div class="dl-steal ${fresh?'fresh':''}"><b>${fresh?'뺏겼습니다':'최근 놓친 선수'}</b><span>${esc(x.tg)} <button class="lnk" data-a="player" data-v="${x.pid}">${esc(x.nm)}</button>을(를) ${esc(tshort(x.tid))}이(가) ${x.rd}라운드 ${x.no}번째로 지명</span><i>이번 드래프트에서 노리던 선수 ${L.stN}명을 놓쳤습니다</i></div>`; })():''}
    ${f.length>1?`<div class="dl-feed">${f.slice(1,8).map(x=>`<span class="${x.tg?'tg':''}${x.me?' me':''}">${badge(x.tid,14)}<i>${x.rd}-${x.no}</i>${esc(x.nm)}<em>${esc(x.pos)}</em>${x.o!=null&&!x.me?fdEstChip(x.o):''}</span>`).join('')}</div>`:''}</div>`; }
/* 지명 직후 카드(revMake·revView)는 55_fd_eval.js: 실제 능력 대신 스카우트 추정만 보여 준다 */
