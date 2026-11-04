/* ===== 구단 캘린더 (FM 일정 화면 방식) =====
   한 달을 월~일 격자로 보여 준다. 칸마다 우리 경기(상대·홈원정·결과)와 마감·리그 행사·우리 일(결정 기한, 부상 복귀 등)을 표시하고,
   날짜를 누르면 아래에 그날의 자세한 내용과 '이 날까지 진행' 버튼이 나온다.
   진행 버튼을 누르면 지나간 날짜가 화면 위에서 하루씩 넘어가는 띠로 보인다(FM의 진행 표시처럼) */
const CAL_K={dl:{c:'#ff6b6b',l:'마감'},lg:{c:'#5aa9ff',l:'리그'},me:{c:'#ffb547',l:'우리 일'},pl:{c:'#9be27a',l:'선수'}};
/* 해마다 같은 날짜에 돌아오는 일정 */
const CAL_FIX=[[1,8,'연봉 미계약 점검','me'],[1,10,'연봉조정 신청 마감','dl'],[1,20,'연봉조정 결정 · 입대일','lg'],[1,24,'FA 시장 사실상 마감','dl'],[7,31,'트레이드 마감','dl'],[8,15,'외국인 등록 마감','dl'],[11,2,'FA 공시','lg'],[11,6,'FA 협상 시작','lg'],[12,1,'연봉 협상 시작','me'],[3,1,'상무 지원 시작(6월 입대)','me'],[4,14,'상무 지원 마감(6월 입대)','dl'],[9,1,'상무 지원 시작(12월 입대)','me'],[10,14,'상무 지원 마감(12월 입대)','dl']];
function calEvents(d){ const o=dobj(d); const out=[]; const c=G.cal;
  for(const [m,dd,l,k] of CAL_FIX)if(o.m===m&&o.d===dd)out.push({k,t:l});
  if(c&&c.y===o.y){ const L=[[c.camp,'스프링캠프 시작','lg'],[c.campEnd,'캠프 종료','lg'],[c.exh,'시범경기 시작','lg'],[c.open,'정규시즌 개막','lg'],[c.asg,'올스타전','lg'],[c.draft,'신인 드래프트','dl'],[c.end,'정규시즌 종료','lg']]; for(const [n,t,k] of L)if(n===d)out.push({k,t}); }
  /* 국가대표 소집: 최종 명단 전에는 '소집 예정', 발표 뒤에는 우리 선수 이탈 수 */
  try{ for(const x of ntUpcoming(4)){ if(d<x.from||d>x.to)continue; const N=G.nt&&G.nt.k===x.k&&G.nt.y===x.y?G.nt:null; const n=N?N.ids.filter(id=>G.players[id]&&G.players[id].team===G.user).length:null;
      out.push({k:'lg',t:d===x.from?`${x.n} 소집${N?` · 우리 선수 ${n}명 이탈`:' 예정'}`:`${x.n} 대표 소집 중${N&&n?` · 우리 ${n}명 이탈`:''}`}); } }catch(e){}
  /* 우리 일: 결정 기한, 트레이드 제안 기한, 우선 제안·라스트 룩 기한 */
  for(const e of (G.evs||[]))if(!e.done&&e.exp===d)out.push({k:'me',t:`결정 기한: ${e.title}`});
  for(const of of (G.offers||[]))if(of.exp===d)out.push({k:'me',t:`트레이드 제안 기한: ${tshort(of.from)}`});
  try{ for(const r of mreqOpen())if(r.until===d)out.push({k:'dl',t:`감독과 약속한 기한: ${MREQK[r.k]||'요청'}`}); }catch(e){}
  if(G.fac&&G.fac.build&&G.fac.build.done===d)out.push({k:'me',t:'훈련 시설 완공 예정'});
  try{ const m=G.mgr[G.user]; const D=mgrDir(); for(const k of ['arm','rest']){ const x=D[k]; if(m&&x&&!x.ok&&x.mid===m.id&&x.day+30===d)out.push({k:'me',t:`감독 재논의 가능: ${k==='arm'?'투수 관리':'주전 휴식'}`}); } }catch(e){}
  if(G.fa){ for(const id in (G.fa.pitch||{})){ const x=G.fa.pitch[id]; const p=G.players[id]; if(p&&x.until===d)out.push({k:'me',t:`우선 제안 기한: ${p.name}`}); }
    for(const id in (G.fa.mk||{})){ const x=G.fa.mk[id]; const p=G.players[id]; if(!p||p.team!=null)continue; if(x.ll&&x.ll.until===d)out.push({k:'dl',t:`라스트 룩 기한: ${p.name}`}); else if(!x.done&&x.next===d&&(G.fa.offers[id]||p.faFrom===G.user))out.push({k:'me',t:`시장 보고: ${p.name}`}); } }
  /* 우리 선수: 부상 복귀 예정, 전역 */
  if(d>G.day&&d-G.day<=120)for(const p of playersOf(G.user)){ if(p.injOut>0&&G.day+p.injOut===d)out.push({k:'pl',t:`${p.name} 복귀 예정(${injNow(p)})`}); }
  for(const p of Object.values(G.players)){ if(p.team!==G.user&&!(p.mil&&p.mil.tid===G.user))continue; if(p.mil&&p.mil.until===d)out.push({k:'pl',t:`${p.name} 전역`}); }
  return out; }
/* 그날 우리 경기 */
function calGame(d){ const c=G.cal; let m=null, kind='';
  if(c&&c.sched[d])m=c.sched[d].find(x=>x.includes(G.user));
  const log=(G.sea&&G.sea.ulog||[]).find(x=>x.d===d);
  if(!m&&log){ m=[log.h,log.a]; kind=log.k||''; }
  if(!m)return null; const home=m[0]===G.user; const op=home?m[1]:m[0];
  return {home,op,kind,res:log?{r:log.res,my:home?log.hs:log.as,op:home?log.as:log.hs}:null,gi:G.games.findIndex(g=>g.day===d&&(g.home===G.user||g.away===G.user))}; }
function calView(){ if(fmOn())return calFM(); /* PC: FM식 주요 일정 */ const now=dobj(G.day); const ym=UI.calYM||{y:now.y,m:now.m}; UI.calYM=ym;
  const first=dnum(ym.y,ym.m,1); const w0=(dobj(first).w+6)%7; /* 월요일 시작 */ const last=dnum(ym.m===12?ym.y+1:ym.y,ym.m===12?1:ym.m+1,1)-1;
  const sel=UI.calSel!=null&&dobj(UI.calSel).m===ym.m&&dobj(UI.calSel).y===ym.y?UI.calSel:(now.y===ym.y&&now.m===ym.m?G.day:first);
  let cells=''; for(let i=0;i<w0;i++)cells+='<div class="cal-c nil"></div>';
  for(let d=first;d<=last;d++){ const o=dobj(d); const ev=calEvents(d); const g=calGame(d);
    /* 경기 있는 날: 상대 구단 로고를 크게, 홈·원정 표시, 지난 경기는 점수와 승패 */
    const gch=g?`<span class="cal-gm${g.res?(g.res.r==='승'?' w':g.res.r==='패'?' l':' t'):''}"><span class="cal-lg">${badge(g.op,34)}</span><b class="cal-nm">${esc(team(g.op).nick)}</b>${g.res?`<span class="cal-sc"><em>${g.res.r}</em>${g.res.my}:${g.res.op}</span>`:''}</span>`:'';
    const ha=g?`<span class="cal-ha ${g.home?'h':'a'}">${g.home?'홈':'원정'}</span>`:'';
    const evh=ev.slice(0,2).map(e=>`<span class="cal-e" style="--ec:${CAL_K[e.k].c}">${esc(e.t)}</span>`).join('')+(ev.length>2?`<span class="cal-more">외 ${ev.length-2}건</span>`:'');
    cells+=`<button class="cal-c${g?' hasg':''}${d===G.day?' today':''}${d<G.day?' past':''}${d===sel?' sel':''}${o.w===1?' mon':''}" data-a="calDay" data-v="${d}" aria-label="${o.m}월 ${o.d}일${g?` ${g.home?'홈':'원정'} ${team(g.op).nick}${g.res?` ${g.res.r} ${g.res.my}대${g.res.op}`:''}`:''}"><span class="cal-top"><span class="cal-n">${o.d}${d===G.day?'<i>오늘</i>':''}</span>${ha}</span>${gch}${evh}${(()=>{ const pl=gmPlanAt(d); return pl?`<span class="cal-plan k-${pl.k}">${pl.k==='attend'?(pl.x==='owner'?'직관·구단주':pl.x==='ceo'?'직관·사장':'직관'):pl.k==='scout'?'출장':'2군'}</span>`:''; })()}</button>`; }
  const pm=ym.m===1?{y:ym.y-1,m:12}:{y:ym.y,m:ym.m-1}, nm=ym.m===12?{y:ym.y+1,m:1}:{y:ym.y,m:ym.m+1};
  const nav=`<div class="row between cal-nav"><button class="btn small" data-a="calMon" data-v="${pm.y}:${pm.m}">◀ ${pm.m}월</button><b class="cal-ttl">${ym.y}년 ${ym.m}월</b><span class="row"><button class="btn small" data-a="calMon" data-v="${now.y}:${now.m}">오늘</button><button class="btn small" data-a="calMon" data-v="${nm.y}:${nm.m}">${nm.m}월 ▶</button></span></div>`;
  const leg=`<div class="cal-leg">${Object.values(CAL_K).map(x=>`<span><i style="background:${x.c}"></i>${x.l}</span>`).join('')}<span><i class="g"></i>우리 경기</span></div>`;
  const ug=upcomingGames(10).replace('<button class="btn small" data-a="calOpen">캘린더</button>','');
  return `<section class="card">${nav}<div class="cal-w">${['월','화','수','목','금','토','일'].map(x=>`<span>${x}</span>`).join('')}</div><div class="cal-grid">${cells}</div>${leg}</section>${calDetail(sel)}${ug}${calUpcoming()}`; }
function calDetail(d){ const o=dobj(d); const ev=calEvents(d); const g=calGame(d); const dd=d-G.day;
  let gh=''; if(g){ const sp=d>G.day&&d-G.day<=6?(()=>{ try{ const L=projStarters(G.user,6); const k=nextGames(8).findIndex(x=>x.d===d); const s=k>=0&&L[k]?L[k].sp:null; return s?` · 예상 선발 ${esc(s.name)}`:''; }catch(e){ return ''; } })():'';
    gh=`<div class="cal-dg">${badge(g.op,28)}<div><b>${g.kind?esc(g.kind)+' · ':''}${g.home?'홈':'원정'} ${g.home?'vs':'@'} ${esc(tname(g.op))}</b><span class="small muted">${g.res?`${g.res.r} ${g.res.my}:${g.res.op}`:d<G.day?'결과 기록 없음':`예정${sp}`}</span></div>${g.gi>=0&&G.games[g.gi]?`<button class="btn small" data-a="openGame" data-v="${g.gi}">박스스코어</button>`:''}</div>`; }
  return `<section class="card cal-detail"><div class="row between"><h2 class="sec">${o.m}월 ${o.d}일 ${WD[o.w]}요일</h2><span class="small muted">${dd===0?'오늘':dd>0?`D-${dd}`:`${-dd}일 전`}</span></div>
    ${gh}${ev.length?`<ul class="cal-dl">${ev.map(e=>`<li><i style="background:${CAL_K[e.k].c}"></i>${esc(e.t)}</li>`).join('')}</ul>`:(g?'':'<p class="small muted">일정이 없습니다.</p>')}
    ${d>G.day?gmPlanBox(d,g):''}
    ${d>G.day?`<div class="row"><button class="btn primary" data-a="advTo" data-v="${d}" ${blockNow()?'disabled':''}>이 날까지 진행</button><span class="small muted">중요한 소식이나 결정할 일이 생기면 그 전에 멈춥니다.</span></div>`:''}</section>`; }
/* 다가오는 주요 일정 30일: 마감은 빨간 D-day */
function calUpcomingList(n){ const L=[]; for(let d=G.day+1;d<=G.day+60&&L.length<(n||10);d++){ for(const e of calEvents(d))if(e.k==='dl'||e.k==='lg'||e.k==='me')L.push({d,...e}); } return L; }
function calUpcoming(){ const L=calUpcomingList(10);
  return L.length?`<section class="card"><h2 class="sec">다가오는 일정</h2><div class="cal-up">${L.slice(0,10).map(x=>`<button class="cal-ur" data-a="calJump" data-v="${x.d}"><span class="ticker" style="${x.k==='dl'?'color:#ff6b6b':''}">D-${x.d-G.day}</span><span>${dmd(x.d)}</span><b>${esc(x.t)}</b></button>`).join('')}</div></section>`:''; }
/* 진행 표시(모션): 계속을 누르면 상단 날짜가 하루씩 넘어가고(달력 넘기듯), 아래에 지나간 날짜 띠가 하루씩 불이 켜진다.
   경기한 날은 상대 로고와 승패가 함께 지나간다. 화면을 막지 않고 끝나면 사라진다 */
/* 날짜가 넘어가는 동안: 아직 지나가지 않은 날의 경기 결과·소식은 숨겼다가 그날이 지나갈 때 하나씩 보여 준다 */
function tkHide(){ const T=UI._tk; return T&&Date.now()<T.until?T.show:Infinity; }
function tkAt(d){ return d>tkHide()?` data-tkd="${d}"`:''; }
function tkShow(d){ if(UI._tk)UI._tk.show=d; const L=document.querySelector('.ibx-list'); const top=L&&L.scrollTop<=40;
  let any=false; document.querySelectorAll('[data-tkd]').forEach(el=>{ if(+el.dataset.tkd<=d){ el.removeAttribute('data-tkd'); el.classList.add('tk-in'); any=true; } });
  if(any&&L){ const c=L.querySelector('.ibr.cur'); if(c)ibShowCur(L,c,false); else if(top)L.scrollTop=0; } }
function tkDone(){ UI._tk=null; tkShow(1e9); }
function dayTickPosition(el){
  if(!el?.classList.contains('on'))return;
  const v=window.visualViewport,w=v?.width||innerWidth,h=v?.height||innerHeight,x=v?.offsetLeft||0,y=v?.offsetTop||0;
  const count=el.querySelectorAll('.dt-c').length,z=uiZ();
  el.style.width=Math.min(w/z-24,Math.max(196,count*52+Math.max(0,count-1)*4+12))+'px';
  el.style.maxWidth=Math.max(0,w/z-24)+'px';el.style.left=(x+w/2)/z+'px';
  const head=document.querySelector('#app .fmtop,#app .top,#app .dtop'),after=head?head.getBoundingClientRect().bottom+8:y+8;
  el.style.top=Math.max(y+8,Math.min(after,y+h-el.getBoundingClientRect().height-12))/z+'px';
}
function dayTick(d0){ const d1=G.day; if(!(d1>d0)){ tkDone(); return; } let still=false; try{ still=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){}
  (dayTick._steps||[]).forEach(clearTimeout);clearTimeout(dayTick._t);clearTimeout(dayTick._t2);
  /* '동작 줄이기'를 켠 기기(아이폰 설정 등)도 날짜가 넘어간 것은 보여 준다: 움직임 없이 지나간 날짜 띠를 잠깐 띄운다 */
  let el=document.getElementById('dtick'); if(!el){ el=document.createElement('div'); el.id='dtick'; el.setAttribute('aria-hidden','true'); document.body.appendChild(el); }
  let days=[]; for(let d=d0+1;d<=d1;d++)days.push(d); if(days.length>10)days=days.slice(0,4).concat([null],days.slice(-5));
  el.innerHTML=`<div class="dt-big"><span class="dt-flip" id="dtFlip"></span></div><div class="dt-in">${days.map(d=>{ if(d==null)return '<span class="dt-c gap">…</span>'; const o=dobj(d); const g=calGame(d); const ev=calEvents(d).filter(e=>e.k==='dl'||e.k==='lg');
    return `<span class="dt-c"><i>${WD[o.w]}</i><b>${o.m}/${o.d}</b>${g?`<span class="dt-g">${badge(g.op,18)}</span>${g.res?`<em class="rs ${g.res.r==='승'?'w':g.res.r==='패'?'l':''}">${g.res.r} ${g.res.my}:${g.res.op}</em>`:'<em></em>'}`:ev.length?`<em class="ev">${esc(ev[0].t.slice(0,6))}</em>`:'<em></em>'}</span>`; }).join('')}</div>`;
  el.className='on'; const cs=[...el.querySelectorAll('.dt-c')]; const fl=el.querySelector('#dtFlip'); const step=Math.max(110,Math.min(220,1300/cs.length));
  if(still){ const o=dobj(d1); fl.innerHTML=`<i>${o.y}년</i><b>${o.m}월 ${o.d}일</b><i>${WD[o.w]}요일</i>`; cs.forEach(c=>c.classList.add('done')); if(cs.length)cs[cs.length-1].classList.add('cur'); tkDone();
    dayTickPosition(el);dayTick._t=setTimeout(()=>{ el.className=''; },1600); return; }
  const show=d=>{ const o=dobj(d); fl.classList.remove('go'); void fl.offsetWidth; fl.innerHTML=`<i>${o.y}년</i><b>${o.m}월 ${o.d}일</b><i>${WD[o.w]}요일</i>`; fl.classList.add('go'); };
  show(d0);dayTickPosition(el);dayTick._steps=cs.map((c,i)=>setTimeout(()=>{ cs.forEach(x=>x.classList.remove('cur')); c.classList.add('cur','done'); const dd=days[i]; if(dd!=null){ show(dd); tkShow(dd); } else if(days[i+1]!=null)tkShow(days[i+1]-1); },(i+1)*step));
  const hd=document.querySelector('.tbar .club span'); if(hd){ hd.classList.remove('dchg'); void hd.offsetWidth; hd.classList.add('dchg'); }
  if(UI._tk)UI._tk.until=Date.now()+(cs.length+1)*step+200; clearTimeout(dayTick._t2); dayTick._t2=setTimeout(tkDone,(cs.length+1)*step+50);
  clearTimeout(dayTick._t); dayTick._t=setTimeout(()=>{ el.className=''; },(cs.length+1)*step+600); }
if(typeof window!=='undefined'){
  const reposition=()=>dayTickPosition(document.getElementById('dtick'));
  window.addEventListener('resize',reposition);
  window.visualViewport?.addEventListener('resize',reposition);
  window.visualViewport?.addEventListener('scroll',reposition);
}
/* 앞으로의 경기: 일정표 순서대로 다음 10경기(같은 상대 연전은 묶어서 몇 번째 경기인지 표시) */
function upcomingGames(n){ const per=period(); if(per!=='season'&&per!=='post'&&per!=='pre')return ''; const L=nextGames(n||10); if(!L.length)return '';
  let sp=[]; try{ sp=projStarters(G.user,5)||[]; }catch(e){}
  const st=G.sea&&G.sea.rec; let order=[]; try{ order=standingsNow(); }catch(e){}
  /* 연전 계산: 이미 치른 같은 상대 경기도 센다 */
  const prev=[]; for(let d=G.day;d>=G.day-6&&G.cal&&G.cal.sched;d--){ const gs=G.cal.sched[d]; if(!gs)continue; const m=gs.find(z=>z.includes(G.user)); if(!m)continue; prev.unshift({d,home:m[0]===G.user,op:m[0]===G.user?m[1]:m[0],old:true}); }
  const runs=[]; for(const x of prev.concat(L)){ const r=runs[runs.length-1]; if(r&&r.op===x.op&&r.home===x.home&&!x.ps&&x.d-r.last<=2){ r.n++; r.last=x.d; x.si=r.n; x.run=r; } else { const nr={op:x.op,home:x.home,n:1,last:x.d}; runs.push(nr); x.si=1; x.run=nr; } }
  /* 연전 길이는 앞으로 남은 경기까지 포함해 계산된다 */
  const rows=L.map((x,i)=>{ const o=dobj(x.d); const rk=order.findIndex(q=>q.tid===x.op)+1; const r=st&&st[x.op]; const s=sp[i]&&sp[i].sp;
    return `<button class="ug-r${i===0?' ug-nx':''}" data-a="calJump" data-v="${x.d}"><span class="ug-d"><b>${o.m}/${o.d}</b><i>${WD[o.w]}</i></span><span class="ug-o">${x.home?'vs':'@'} ${badge(x.op,18)} <b>${esc(tshort(x.op))}</b>${x.ps?` <span class="pill acc">${esc(x.ps)}</span>`:x.run.n>1?` <i class="muted">${x.run.n}연전 ${x.si}</i>`:''}</span><span class="ug-m small muted">${rk&&per!=='pre'?`${rk}위${r?` · ${r.w}-${r.l}`:''}`:''}</span><span class="ug-s small">${s?`선발 ${esc(s.name)}`:''}</span></button>`; }).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">앞으로의 경기</h2><button class="btn small" data-a="calOpen">캘린더</button></div><div class="ug">${rows}</div><p class="small muted">선발은 로테이션 순번과 휴식일로 본 예상입니다. 줄을 누르면 캘린더에서 그날을 엽니다.</p></section>`; }

/* 단장 일정 잡기: 직관(혼자·구단주·사장), 고교 대회 출장(지역), 2군 방문 */
function gmPlanBox(d,g){ const pl=gmPlanAt(d); const T=gmTourn(d); const per=period(); const B=[];
  const lab=pl?(pl.k==='attend'?`직관${pl.x==='owner'?' · 구단주 동행':pl.x==='ceo'?' · 사장 동행':''}`:pl.k==='scout'?`${pl.x} ${T||'고교 대회'} 출장`:'2군 방문'):'';
  if(g)B.push(`<div class="gpl-r"><span class="small">경기 직관</span>${[['solo','혼자'],['owner','구단주와'],['ceo','사장과']].map(([x,l])=>`<button class="btn small${pl&&pl.k==='attend'&&pl.x===x?' primary':''}" data-a="gmPlan" data-v="${d}:attend:${x}">${l}</button>`).join('')}</div>`);
  if(T)B.push(`<div class="gpl-r"><span class="small">${esc(T)} 출장</span>${REG.map(r=>`<button class="btn small${pl&&pl.k==='scout'&&pl.x===r?' primary':''}" data-a="gmPlan" data-v="${d}:scout:${r}">${r}</button>`).join('')}</div>`);
  if(per==='season'||(dobj(d).m>=4&&dobj(d).m<=9))B.push(`<div class="gpl-r"><span class="small">2군 방문</span><button class="btn small${pl&&pl.k==='farm'?' primary':''}" data-a="gmPlan" data-v="${d}:farm:">2군 경기장</button></div>`);
  if(!B.length)return '';
  return `<div class="gpl"><div class="row between"><span class="eyebrow">단장 일정</span>${pl?`<span class="row"><span class="pill acc">${esc(lab)}</span><button class="btn small" data-a="gmPlan" data-v="${d}:">취소</button></span>`:'<span class="small muted">경기는 결과 보고로 받습니다. 볼 경기나 출장을 잡아 두세요.</span>'}</div>${B.join('')}</div>`; }
/* PC 일정(FM '주요 일정'처럼): 위 한 주 띠(경기·마감·리그 일정), 아래 왼쪽 시즌 경기 목록(지난 경기 결과·선발, 앞으로 경기 D-day·예상 선발), 오른쪽 고른 날 상세 */
function calFM(){ const c=G.cal; const sel=UI.calSel??G.day; const so=dobj(sel), mon=sel-((so.w+6)%7);
  const days=Array.from({length:7},(_,i)=>mon+i);
  const nx=nextGames(1)[0];
  const strip=`<section class="card sch-wk"><div class="row between sch-nav"><b>${so.y}년 ${so.m}월</b><span class="row">${nx?`<span class="small muted">다음 경기 ${dmd(nx.d)} ${nx.home?'홈':'원정'} vs ${esc(tshort(nx.op))}</span>`:''}<button class="btn small" data-a="calWk" data-v="${G.day-sel}">오늘</button><button class="btn small" data-a="calWk" data-v="-7" aria-label="지난주">◀</button><button class="btn small" data-a="calWk" data-v="7" aria-label="다음 주">▶</button></span></div>
    <div class="sch-days">${days.map(d=>{ const o=dobj(d), g=calGame(d), ev=calEvents(d);
      return `<button class="sch-d${d===G.day?' today':''}${d===sel?' sel':''}${d<G.day?' past':''}" data-a="calDay" data-v="${d}"><span class="sch-n"><b>${o.d}</b>${WD[o.w]}${d===G.day?' · 오늘':''}</span>${g?`<span class="sch-g${g.res?' '+({승:'w',패:'l'}[g.res.r]||'t'):''}${g.home?' h':''}">${badge(g.op,26)}<span><i>${g.kind?esc(g.kind):'정규시즌'} · ${g.home?'홈':'원정'}</i><b>${esc(tshort(g.op))}</b>${g.res?`<em>${g.res.r} ${g.res.my}:${g.res.op}</em>`:''}</span></span>`:''}${ev.slice(0,3).map(e=>`<span class="sch-e" style="--ec:${CAL_K[e.k].c}">${esc(e.t)}</span>`).join('')}${ev.length>3?`<span class="sch-e more">외 ${ev.length-3}건</span>`:''}</button>`; }).join('')}</div></section>`;
  /* 시즌 경기 목록: 지난 경기는 최근 8경기(전체 보기로 펼침), 앞으로는 끝까지 */
  const all=[]; const start=(c&&c.open)||G.day, end=Math.max((c&&c.end)||G.day,G.day+60); for(let d=start;d<=end;d++){ const g=calGame(d); if(g)all.push({d,g}); }
  const past=all.filter(x=>x.d<G.day||(x.d===G.day&&x.g.res)), fut=all.filter(x=>!past.includes(x)); const showP=UI.calAll?past:past.slice(-8);
  let proj=[]; try{ proj=projStarters(G.user,6)||[]; }catch(e){} const nxL=nextGames(8);
  const st=(x)=>{ const r=x.g.gi>=0?G.games[x.g.gi]:null; if(r&&r.box){ const me=r.home===G.user?'h':'a', op=me==='h'?'a':'h'; const a=(r.box[me].pit[0]||{}).n, b=(r.box[op].pit[0]||{}).n; return `${a?esc(a):'-'} <i>vs</i> ${b?esc(b):'-'}`; } if(x.d>G.day){ const k=nxL.findIndex(y=>y.d===x.d); const s=k>=0&&proj[k]?proj[k].sp:null; return s?`<i>예상</i> ${esc(s.name)}`:''; } return ''; };
  let lastM=null; const rows=[...showP,...fut].map(x=>{ const o=dobj(x.d), g=x.g, mh=o.m!==lastM?`<tr class="sch-mh"><td colspan="8">${o.y}년 ${o.m}월</td></tr>`:''; lastM=o.m; const dd=x.d-G.day, rk=(()=>{ const L=standOrder().order||[]; const i=L.findIndex(y=>(y.tid??y)===g.op); return i<0?'':i+1; })();
    return mh+`<tr class="${x.d===sel?'sel':''}${x.d===G.day?' today':''}" data-a="calDay" data-v="${x.d}"><td>${o.m}/${o.d} ${WD[o.w]}</td><td class="muted">${dd===0?'오늘':dd>0?dd+'일 뒤':-dd+'일 전'}</td><td class="muted">${g.kind?esc(g.kind):'정규시즌'}</td><td>${g.home?'홈':'원정'}</td><td class="muted">${rk?rk+'위':''}</td><td>${g.res?`<span class="sch-r ${({승:'w',패:'l'}[g.res.r]||'t')}">${g.res.r}</span> <b>${g.res.my}-${g.res.op}</b>`:''}</td><td>${badge(g.op,18)} ${esc(tshort(g.op))}</td><td class="sch-sp">${st(x)}</td></tr>`; }).join('');
  const list=`<section class="card sch-list"><div class="row between"><h3>경기 일정·결과 <em>${past.length}경기 치름 · ${fut.length}경기 남음</em></h3>${past.length>8?`<button class="btn small" data-a="calAll">${UI.calAll?'최근 8경기만':'지난 경기 모두 보기'}</button>`:''}</div><div class="sf-tw"><table class="sf-t sch-t"><thead><tr><th>날짜</th><th></th><th>대회</th><th>장소</th><th>상대 순위</th><th>결과</th><th>상대</th><th>선발 (우리 vs 상대)</th></tr></thead><tbody>${rows||'<tr><td colspan="8" class="muted">경기 일정이 없습니다.</td></tr>'}</tbody></table></div></section>`;
  return `<div class="sch ws-own">${strip}${list}<div class="sch-side">${calDetail(sel)}${(()=>{ const g=calGame(sel); return g?`<section class="card sch-op">${ibdOpp(g.op,'상대 전력')}</section><section class="card sch-op">${ibdForm(g.op,'상대 수비 배치')}</section>`:''; })()}${calUpcoming()}</div></div>`; }
