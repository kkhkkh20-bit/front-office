/* ===== 구단 캘린더 (FM 일정 화면 방식) =====
   한 달을 월~일 격자로 보여 준다. 칸마다 우리 경기(상대·홈원정·결과)와 마감·리그 행사·우리 일(결정 기한, 부상 복귀 등)을 표시하고,
   날짜를 누르면 아래에 그날의 자세한 내용과 '이 날까지 진행' 버튼이 나온다.
   진행 버튼을 누르면 지나간 날짜가 화면 위에서 하루씩 넘어가는 띠로 보인다(FM의 진행 표시처럼) */
const CAL_K={dl:{c:'#ff6b6b',l:'마감'},lg:{c:'#5aa9ff',l:'리그'},me:{c:'#ffb547',l:'우리 일'},pl:{c:'#9be27a',l:'선수'}};
/* 해마다 같은 날짜에 돌아오는 일정 */
const CAL_FIX=[[1,8,'연봉 미계약 점검','me'],[1,10,'연봉조정 신청 마감','dl'],[1,20,'연봉조정 결정 · 입대일','lg'],[1,24,'FA 시장 사실상 마감','dl'],[1,31,'연봉 계약 마감(미확정은 자동 확정)','dl'],[7,31,'트레이드 마감','dl'],[8,15,'외국인 등록 마감','dl'],[11,2,'FA 공시','lg'],[11,6,'FA 협상 시작','lg'],[12,1,'연봉 협상 시작','me'],[3,1,'상무 지원 시작(6월 입대)','me'],[4,14,'상무 지원 마감(6월 입대)','dl'],[9,1,'상무 지원 시작(12월 입대)','me'],[10,14,'상무 지원 마감(12월 입대)','dl']];
/* 시상식: 엔진이 이 날 발표한다(07_daily.js KD(11,24)·KD(12,9)). 발표 뒤에는 그날을 눌러 시상식 화면으로 */
const CAL_CER=[[11,24,'mvp',()=>`${ASSOC.s} 시상식(MVP·신인왕)`],[12,9,'gg',()=>'골든글러브 시상식']];
/* 기간 일정은 시작/종료일뿐 아니라 그 안의 매일에도 표시한다. */
function calPhases(d){ const o=dobj(d),c=G.cal,L=[], add=(a,b,t)=>{if(a!=null&&b!=null&&d>=a&&d<b)L.push({k:'lg',t,span:true});};
  if(c&&c.y===o.y){add(c.camp,c.campEnd,'스프링캠프 기간');add(c.exh,c.open,'시범경기 기간');add(c.asg-2,c.asg+2,'올스타 휴식기');}
  add(dnum(o.y,11,5),dnum(o.y,11,25),'마무리캠프 기간');
  if(o.m===12||o.m===1)L.push({k:'me',t:'연봉 협상 기간',span:true});
  const F=G.fa;if(F&&!F.closed&&F.openDay!=null)add(F.openDay,dnum((F.y0??G.year)+1,1,25),'FA 협상 기간');return L; }
function calEvents(d){ const o=dobj(d); const out=[]; const c=G.cal;
  const F=G.fa&&G.fa.y0===o.y&&(G.fa.annDay!=null||!G.fa.closed)?G.fa:null; /* 그해 FA 일정은 실제 날짜로: 결산이 늦어 공시·개장이 밀릴 수 있다(검수 11-08) */
  for(const [m,dd,l,k] of CAL_FIX)if(o.m===m&&o.d===dd&&!(F&&m===11&&(dd===2||dd===6)))out.push({k,t:l});
  if(F){ const ann=F.annDay??Math.max(dnum(o.y,11,2),G.day+1), op=F.open?F.openDay:Math.max(F.openDay,ann+1); if(d===ann)out.push({k:'lg',t:'FA 공시'}); if(d===op)out.push({k:'lg',t:'FA 협상 시작'}); }
  for(const [m,dd,ck,l] of CAL_CER){ const A=G.awards&&G.awards[o.y], cd=(A&&A.cd&&A.cd[ck])??(G.cerNew&&G.cerNew.y===o.y&&G.cerNew.k===ck?G.cerNew.d:null); if(cd!=null?d===cd:o.m===m&&o.d===dd)out.push({k:'lg',t:l(),cer:o.y+':'+ck}); } /* 시상식이 밀리면 실제로 연 날에(검수 11-09l) */
  if(c&&c.y===o.y){ const L=[[c.camp,'스프링캠프 시작','lg'],[c.campEnd,'캠프 종료','lg'],[c.exh,'시범경기 시작','lg'],[c.open,'정규시즌 개막','lg'],[c.asg,'올스타전','lg'],[c.draft,'신인 드래프트','dl'],[c.end,'정규시즌 종료','lg']]; for(const [n,t,k] of L)if(n===d)out.push({k,t}); }
  /* 국가대표 소집: 최종 명단 전에는 '소집 예정', 발표 뒤에는 우리 선수 이탈 수 */
  try{ for(const x of ntUpcoming(4)){ const e=NT_EV[x.k], D=a=>dnum(x.y,a[0],a[1]); const N=G.nt&&G.nt.k===x.k&&G.nt.y===x.y?G.nt:null; const n=N?N.ids.filter(id=>G.players[id]&&G.players[id].team===G.user).length:null;
      for(const [a,t] of [[e.pre,'예비 명단 발표'],[e.ann,'최종 명단 발표'],[e.res,'결과 발표']])if(a&&d===D(a))out.push({k:'lg',t:`${x.n} ${t}`}); if(d===x.to)out.push({k:'lg',t:`${x.n} 대표 복귀${N&&n?` · 우리 ${n}명`:''}`}); /* 대회별 주요 날짜(검수 11-09zj) */
      if(d<x.from||d>=x.to)continue; /* 복귀일은 소집 기간이 아니다(엔진과 같게, 검수 11-06) */
      out.push({k:'lg',span:d!==x.from,t:d===x.from?`${x.n} 소집${N?` · 우리 선수 ${n}명 이탈`:' 예정'}`:`${x.n} 대표 소집 중${N&&n?` · 우리 ${n}명 이탈`:''}`}); } }catch(e){}
  try{ out.push(...rainCalEv(d)); }catch(e){} /* 우천 취소·순연·더블헤더(93_rain) */
  if(typeof psRainAt==='function')for(const r of psRainAt(d))out.push({k:'lg',t:`${ROUNDK[r.round]||'포스트시즌'} ${r.n}차전 우천 취소 → ${rainWhere(r.rd)}`});
  { const y=o.m<=1?o.y-1:o.y; if(d===tryAnnD(y))out.push({k:'lg',t:'공개 트라이아웃 명단 공개'}); if(d===tryDayD(y))out.push({k:'lg',t:'KBO 공개 트라이아웃'}); if(d===tryCloseD(y))out.push({k:'dl',t:'트라이아웃·육성 계약 마감'}); } /* 94_tryout */
  /* 우리 일: 결정 기한, 트레이드 제안 기한, 우선 제안·라스트 룩 기한 */
  for(const e of (G.evs||[]))if(!e.done&&e.exp===d)out.push({k:'me',t:`결정 기한: ${e.title}`});
  for(const of of (G.offers||[]))if(of.exp===d)out.push({k:'me',t:`트레이드 제안 기한: ${tshort(of.from)}`});
  try{ for(const r of mreqOpen())if(r.until===d)out.push({k:'dl',t:`감독과 약속한 기한: ${MREQK[r.k]||'요청'}`}); }catch(e){}
  if(G.fac&&G.fac.build&&G.fac.build.done===d)out.push({k:'me',t:'훈련 시설 완공 예정'}); if(G.fac&&G.fac.bld)for(const k in G.fac.bld){ const b=G.fac.bld[k]; if(b&&b.done===d)out.push({k:'me',t:`${(FACI[k]||{}).l||'시설'} 완공 예정`}); } /* 시설별 공사(bld) */
  try{ const m=G.mgr[G.user]; const D=mgrDir(); for(const k of ['arm','rest']){ const x=D[k]; if(m&&x&&!x.ok&&x.mid===m.id&&x.day+30===d)out.push({k:'me',t:`감독 재논의 가능: ${k==='arm'?'투수 관리':'주전 휴식'}`}); } }catch(e){}
  if(G.fa){ for(const id in (G.fa.pitch||{})){ const x=G.fa.pitch[id]; const p=G.players[id]; if(p&&x.until===d)out.push({k:'me',t:`우선 제안 기한: ${p.name}`}); }
    for(const id in (G.fa.mk||{})){ const x=G.fa.mk[id]; const p=G.players[id]; if(!p||p.team!=null)continue; if(x.ll&&x.ll.until===d)out.push({k:'dl',t:`라스트 룩 기한: ${p.name}`}); else if(!x.done&&x.next===d&&(G.fa.offers[id]||p.faFrom===G.user))out.push({k:'me',t:`시장 보고: ${p.name}`}); } }
  /* 코치 구단 지원 연수: 원지원 구단의 실제 파견 기간과 귀국일을 표시한다. */
  { const S=G.sis||{},seen=new Set(); for(const T of [S.ct,...(S.ctq||[])]){ if(!T||T.tid!==G.user||seen.has(T.key||T.id+':'+T.to))continue; seen.add(T.key||T.id+':'+T.to); const n=T.name||'코치'; if(Number.isFinite(T.from)&&d===T.from)out.push({k:'me',t:`${n} 코치 연수 출발`}); if(d===T.to)out.push({k:'me',t:`${n} 코치 연수 복귀${T.done?'':' 예정'}`}); else if(Number.isFinite(T.from)&&d>T.from&&d<T.to)out.push({k:'me',span:true,t:`${n} 코치 연수 중`}); } }
  /* 우리 선수: 부상 복귀 예정, 전역 */
  if(d>G.day&&d-G.day<=120)for(const p of ownedOf(G.user)){ /* 대표팀 차출 중 재활 선수도(검수 11-09t) */ if(p.injOut>0&&G.day+p.injOut===d)out.push({k:'pl',t:`${p.name} 복귀 예정(${injNow(p)})`}); }
  for(const p of Object.values(G.players)){ if(p.team!==G.user&&!(p.mil&&p.mil.tid===G.user))continue; const m=p.mil; if(!m)continue; if(m.until&&m.from===d||m.pf===d)out.push({k:'pl',t:`${p.name} ${m.unit||'군'} 입대`}); if(m.until===d||m.pu===d)out.push({k:'pl',t:`${p.name} 전역${m.exempt?'(병역 특례 조기 전역)':''}`}); } /* 예약 입대와 지난 전역(특례 조기 전역 포함)도(검수 11-09zk) */
  try{ out.push(...promoCalEv(d)); }catch(e){} /* 프로모션 데이(44c_promotions) */
  return [...calPhases(d),...out]; }
/* 그날 우리 경기 */
function calGames(d){const log=(G.sea?.ulog||[]).filter(x=>x.d===d&&(x.h===G.user||x.a===G.user)).map(x=>({...x})),matched=new Set();
  for(const g of [...(G.games||[])].reverse().filter(x=>x.day===d&&(x.home===G.user||x.away===G.user))){const i=log.findIndex((x,j)=>!matched.has(j)&&(x.gid!=null&&g.gid!=null?x.gid===g.gid:x.h===g.home&&x.a===g.away&&x.hs===g.hs&&x.as===g.as));const x={gid:g.gid,d,h:g.home,a:g.away,hs:g.hs,as:g.as,res:g.res,k:g.kind||'',dh:g.dh,rmk:g.rmk,_gi:G.games.indexOf(g)};if(i>=0){log[i]={...log[i],...x};matched.add(i);}else log.push(x);}
  log.sort((a,b)=>(a.gid??0)-(b.gid??0));const sg=spoilG(),view=(m,x,i,kind='')=>{const home=m[0]===G.user,op=home?m[1]:m[0],hidden=!!(x&&sg&&sg.day===d&&(x.gid==null||sg.gid==null||x.gid>=sg.gid)),gi=x?(Number.isInteger(x._gi)?x._gi:G.games.findIndex(g=>x.gid!=null?g.gid===x.gid:g.day===d&&g.home===m[0]&&g.away===m[1]&&g.hs===x.hs&&g.as===x.as)):-1;let info={};if(!x)try{info=rainGameInfo(d,m[0],m[1],i);}catch(e){}const dh=x?.dh||info.dh||0;return {home,op,kind:x?.k||kind,dh,ordinal:i,played:!!x,tag:rainTag({dh,rmk:x?.rmk??info.mk}),res:x&&!hidden?{r:x.res,my:home?x.hs:x.as,op:home?x.as:x.hs}:null,gi:hidden?-1:gi};};
  if(log.length)return log.map((x,i)=>view([x.h,x.a],x,i+1));const L=dayGames(d).filter(x=>x.includes(G.user));if(L.length)return L.map((m,i)=>view(m,null,i+1));const q=typeof psOursAt==='function'?psOursAt(d):null;return q?[view(q.home?[G.user,q.op]:[q.op,G.user],null,1,`${ROUNDK[q.round]||'포스트시즌'} ${q.n}차전`)]:[];}
function calGame(d){const L=calGames(d);return (L.some(g=>g.played)?L.at(-1):L[0])||null;} /* 월 요약은 마지막 결과, 날짜 상세는 모든 경기를 표시한다. */
function calView(){ if(fmOn())return calFM(); /* PC: FM식 주요 일정 */ const now=dobj(G.day); const ym=UI.calYM||{y:now.y,m:now.m}; UI.calYM=ym;
  const first=dnum(ym.y,ym.m,1); const w0=(dobj(first).w+6)%7; /* 월요일 시작 */ const last=dnum(ym.m===12?ym.y+1:ym.y,ym.m===12?1:ym.m+1,1)-1;
  const sel=UI.calSel!=null&&dobj(UI.calSel).m===ym.m&&dobj(UI.calSel).y===ym.y?UI.calSel:(now.y===ym.y&&now.m===ym.m?G.day:first);
  /* 단장 일정: 하루짜리는 칸 안 표시, 여러 날 묶음(출장·2군 관전)은 칸 아래 띠로 주를 건너 잇는다(카페 '한눈에') */
  const PL=gplGrid(first,last,w0);
  let cells=''; for(let i=0;i<w0;i++)cells+=`<div class="cal-c nil" style="grid-area:1/${i+1}"></div>`;
  for(let d=first;d<=last;d++){ const o=dobj(d); const ev=calEvents(d); const g=calGame(d); const gi=w0+d-first, gr=Math.floor(gi/7)+1, gc=gi%7+1; const pin=PL.inSpan[d], ps=gmPlanAt(d), pc=ps&&!ps.miss&&!ps.cancelled&&!(pin&&pin.key&&pin.days.includes(d))?ps:null;
    /* 경기 있는 날: 상대 구단 로고를 크게, 홈·원정 표시, 지난 경기는 점수와 승패 */
    const gch=g?`<span class="cal-gm${g.res?(g.res.r==='승'?' w':g.res.r==='패'?' l':' t'):''}"><span class="cal-lg">${badge(g.op,34)}</span><b class="cal-nm">${esc(tnick(g.op))}</b>${g.res?`<span class="cal-sc"><em>${g.res.r}</em>${g.res.my}:${g.res.op}</span>`:''}</span>`:'';
    const ha=g?`<span class="cal-ha ${g.home?'h':'a'}">${g.home?'홈':'원정'}</span>`:'';
    const evh=ev.slice(0,2).map(e=>`<span class="cal-e" style="--ec:${CAL_K[e.k].c}">${esc(e.t)}</span>`).join('')+(ev.length>2?`<span class="cal-more">외 ${ev.length-2}건</span>`:'');
    cells+=`<button class="cal-c${g?' hasg':''}${d===G.day?' today':''}${d<G.day?' past':''}${d===sel?' sel':''}${o.w===1?' mon':''}" style="grid-area:${gr}/${gc};--ln:${PL.rowLn[gr]||0}" data-a="calDay" data-v="${d}" aria-label="${o.m}월 ${o.d}일${g?` ${g.home?'홈':'원정'} ${tnick(g.op)}${g.res?` ${g.res.r} ${g.res.my}대${g.res.op}`:''}`:''}${PL.aria[d]?` · 단장 일정 ${esc(PL.aria[d])}`:''}"><span class="cal-top"><span class="cal-n">${o.d}${d===G.day?'<i>오늘</i>':''}</span>${ha}</span>${gch}${evh}${pc?`<span class="cal-plan k-${pc.k}${pc.done?' done':''}" style="--pc:${GPL_K[pc.k].c}">${esc(gplShort(pc))}</span>`:''}</button>`; }
  const pm=ym.m===1?{y:ym.y-1,m:12}:{y:ym.y,m:ym.m-1}, nm=ym.m===12?{y:ym.y+1,m:1}:{y:ym.y,m:ym.m+1};
  const nav=`<div class="row between cal-nav"><button class="btn small" data-a="calMon" data-v="${pm.y}:${pm.m}">◀ ${pm.m}월</button><b class="cal-ttl">${ym.y}년 ${ym.m}월</b><span class="row"><button class="btn small" data-a="calMon" data-v="${now.y}:${now.m}">오늘</button><button class="btn small" data-a="calMon" data-v="${nm.y}:${nm.m}">${nm.m}월 ▶</button></span></div>`;
  const leg=`<div class="cal-leg">${Object.values(CAL_K).map(x=>`<span><i style="background:${x.c}"></i>${x.l}</span>`).join('')}<span><i class="g"></i>우리 경기</span></div>`;
  const ug=upcomingGames(10).replace('<button class="btn small" data-a="calOpen">캘린더</button>','');
  return `<section class="card">${nav}<div class="cal-w">${['월','화','수','목','금','토','일'].map(x=>`<span>${x}</span>`).join('')}</div><div class="cal-grid">${cells}${PL.bars}</div>${leg}</section>${calDetail(sel)}${gplMonth(ym.y,ym.m)}${ug}${calUpcoming()}`; }
function calDetail(d,fm){ const o=dobj(d); const ev=calEvents(d); const games=calGames(d),g=calGame(d); const dd=d-G.day;
  const gh=games.map(g=>{const sp=d>G.day&&d-G.day<=6?(()=>{try{const L=projStarters(G.user,8).filter(x=>x.d===d&&x.op===g.op&&x.home===g.home),s=L[g.ordinal-1]?.sp||L[0]?.sp;return s?` · 예상 선발 ${esc(s.name)}`:'';}catch(e){return '';}})():'';
    return `<div class="cal-dg">${badge(g.op,28)}<div><b>${g.kind?esc(g.kind)+' · ':''}${g.tag?esc(g.tag)+' · ':''}${g.home?'홈':'원정'} ${g.home?'vs':'@'} ${esc(tname(g.op))}</b><span class="small muted">${g.res?`${g.res.r} ${g.res.my}:${g.res.op}`:d<G.day?'결과 기록 없음':`예정${sp}`}</span></div>${g.gi>=0&&G.games[g.gi]?`<button class="btn small" data-a="openGame" data-v="${g.gi}" aria-label="${esc(g.tag?g.tag+' 박스스코어':'박스스코어')}">박스스코어</button>`:''}</div>`;}).join('');
  return `<section class="card cal-detail"><div class="row between"><h2 class="sec">${o.m}월 ${o.d}일 ${WD[o.w]}요일</h2><span class="small muted">${dd===0?'오늘':dd>0?`D-${dd}`:`${-dd}일 전`}</span></div>
    ${gh}${ev.length?`<ul class="cal-dl">${ev.map(e=>`<li><i style="background:${CAL_K[e.k].c}"></i>${esc(e.t)}${e.cer&&(()=>{ const [y,k]=e.cer.split(':'); return G.awards&&awShown(G.awards[+y],k); })()?` <button class="btn small primary" data-a="cerOpen" data-v="${e.cer}">시상식 보기</button>`:''}</li>`).join('')}</ul>`:(g?'':'<p class="small muted">일정이 없습니다.</p>')}
    ${d>G.day?`<div class="row cal-adv"><button class="btn primary" data-a="advTo" data-v="${d}" ${blockNow()?'disabled':''}>이 날까지 진행</button><span class="small muted">중요한 소식이나 결정할 일이 생기면 그 전에 멈춥니다.</span></div>`:''}
    ${d>G.day?gmPlanBox(d,g):''}${g&&g.home&&!fm?promoBox(d):''}</section>`; } /* 진행 버튼을 위로(카페 11-17: 프로모션 데이 칸이 버튼을 아래로 밀었다). PC(fm)는 프로모션을 오른쪽 맨 아래 카드로 */
/* 다가오는 주요 일정 30일: 마감은 빨간 D-day */
function calUpcomingList(n,days){ const L=[]; for(let d=G.day+1;d<=G.day+(days||60)&&L.length<(n||10);d++){ for(const e of calEvents(d))if(!e.span&&(e.k==='dl'||e.k==='lg'||e.k==='me')&&L.length<(n||10))L.push({d,...e}); } return L; }
function calUpRows(L){ return L.length?`<div class="cal-up">${L.map(x=>`<button class="cal-ur" data-a="calJump" data-v="${x.d}"><span class="ticker" style="${x.k==='dl'?'color:#ff6b6b':''}">D-${x.d-G.day}</span><span>${dmd(x.d)}</span><b>${esc(x.t)}</b></button>`).join('')}</div>`:''; }
function calUpcoming(days){ const L=calUpcomingList(10,days);
  return L.length?`<section class="card"><h2 class="sec">다가오는 일정</h2>${calUpRows(L)}</section>`:''; }
/* 실제 하루 진행 사이에 브라우저로 돌아와 사용자 중단을 받는다. */
function advProgressPaint(){ const R=UI.advRun;if(!R||R.game!==G)return;let el=document.getElementById('adv-progress');if(!el){el=document.createElement('section');el.id='adv-progress';el.setAttribute('aria-label','날짜 진행과 일정');document.body.appendChild(el);}
  const cols=innerWidth>=1100?7:innerWidth>=700?5:3, first=G.day-1, ds=Array.from({length:cols},(_,i)=>first+i);
  el.style.setProperty('--ap-cols',cols);const h=document.querySelector('#app .fmtop,#app .top,#app .dtop');el.style.top=((h?.getBoundingClientRect().bottom||56)/uiZ())+'px';
  el.innerHTML=`<div class="ap-top"><div><b>일정 진행 중</b><span role="status" aria-live="polite">${esc(dstr(G.day))}</span></div><button class="btn" data-a="advStop">진행 멈추기</button></div><div class="ap-days">${ds.map(d=>{const o=dobj(d),g=calGame(d),ev=calEvents(d);return `<div class="ap-day${d===G.day?' cur':''}${d<G.day?' past':''}"><div class="ap-date"><b>${o.m}/${o.d}</b><span>${WD[o.w]}${d===G.day?' · 오늘':''}</span></div>${g?`<div class="ap-game">${badge(g.op,22)}<span>${esc(tshort(g.op))}<small>${g.home?'홈':'원정'}${g.kind?' · '+esc(g.kind):''}</small>${g.res&&d<=G.day?`<small class="ap-score ${g.res.r==='승'?'good':g.res.r==='패'?'bad':''}">${esc(g.res.r)} ${g.res.my}:${g.res.op}</small>`:''}</span></div>`:''}${ev.slice(0,4).map(e=>`<div class="ap-event" style="--ec:${CAL_K[e.k].c}">${esc(e.t)}</div>`).join('')}${ev.length>4?`<small>외 ${ev.length-4}건</small>`:''}${!g&&!ev.length?'<span class="small muted">예정된 일정 없음</span>':''}</div>`;}).join('')}</div><p class="ap-note">진행 버튼을 다시 누르거나 Space·Esc를 누르면 현재 날짜에서 멈춥니다.</p>`;
  document.querySelectorAll('.goset [data-a=advStop] .cl i').forEach(e=>e.textContent=dmd(G.day)+' · 일정 진행 중');
  const date=document.querySelector('.fmtop .fm-date,.top .tbar .club>div>span');if(date){const o=dobj(G.day),g=calGame(G.day);if(fmOn()){const b=date.querySelector('b');if(b)b.textContent=`${WD[o.w]} ${o.m}월 ${o.d}일`;}else date.innerHTML=`<b class="ap-date-label">${o.m}/${o.d} ${WD[o.w]}</b>`;let result=date.querySelector('.fm-dres');if(g&&g.res){if(!result){result=document.createElement('i');result.className='fm-dres ap-dres';date.appendChild(result);}result.innerHTML=`${fmOn()?badge(g.op,14)+' ':''}<em class="${g.res.r==='승'?'w':g.res.r==='패'?'l':''}">${esc(g.res.r)} ${g.res.my}:${g.res.op}</em>`;}else result?.remove();}if(h)el.style.top=(h.getBoundingClientRect().bottom/uiZ())+'px';
}
function advRunEnd(R,paused=false,error=null){if(UI.advRun!==R)return;clearTimeout(R.timer);if(paused||error)R.it.return();UI.advRun=null;document.getElementById('adv-progress')?.remove();tkDone();try{R.finish(paused);}catch(e){console.error(e);save();render();}if(error){console.error(error);toast('진행 중 오류가 발생해 현재 날짜에서 멈췄습니다.');}else if(paused)toast(`${dmd(G.day)}에서 진행을 멈췄습니다.`);R.resolve(G.lastAdv);}
function advRunPulse(R){if(UI.advRun!==R)return;if(R.game!==G){clearTimeout(R.timer);UI.advRun=null;document.getElementById('adv-progress')?.remove();R.resolve(null);return;}try{const before=G.day,r=R.it.next();save();advProgressPaint();tkShow(G.day);if(r.done){if(G.day===before)advRunEnd(R);else R.timer=setTimeout(()=>advRunEnd(R),220);}else R.timer=setTimeout(()=>advRunPulse(R),260);}catch(e){advRunEnd(R,false,e);}}
function advRunStart(it,finish){if(UI.advRun){advRunEnd(UI.advRun,true);return Promise.resolve(null);}(dayTick._steps||[]).forEach(clearTimeout);clearTimeout(dayTick._t);clearTimeout(dayTick._t2);dayTick._until=0;document.getElementById('fmadv')?.classList.remove('on');document.getElementById('dtick')?.classList.remove('on');tkDone();closeSheets();return new Promise(resolve=>{const R=UI.advRun={it,finish,resolve,game:G,timer:null};render();advProgressPaint();advRunPulse(R);});}
function* advToSteps(T){const d0=G.day,r0=G.sea.rec[G.user],w0=r0.w,l0=r0.l,sea0=G.sea.y;let n=0;const ev0=(G.evs||[]).filter(e=>!e.done&&evStops(e)).length;try{while(G.day<T&&n++<200){if(blocker())break;const d=G.day;advance('day');if(G.matchAwait||G.stops.length||(G.evs||[]).filter(e=>!e.done&&evStops(e)).length>ev0||G.live)break;if(G.res)G.res=null;if(G.day===d)break;if(G.day<T&&n<200)yield G.day;}}finally{const r=G.sea.rec[G.user];G.lastAdv={from:d0,to:G.day,days:G.day-d0,w:r.w-(G.sea.y===sea0?w0:0),l:r.l-(G.sea.y===sea0?l0:0)};}}

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
/* 중계로 감춘 날의 날짜 띠는 중계를 닫은 뒤 그날만 다시 띄워 결과를 알린다 */
function spoilFlush(){ const d=UI._spoilD; if(d==null||spoilG())return; UI._spoilD=null; setTimeout(()=>dayTick(d-1),30); }

/* PC 진행하기(FM처럼): 위쪽에 다음 경기·일정 요약과 날짜 칸 띠를 띄우고, 지나간 날짜를 하루씩 밀어 보여 준다(사용자 11-08) */
const FMADV_W=150;
function fmAdvPanel(d0,d1,st){ let el=document.getElementById('fmadv'); if(!el){ el=document.createElement('div'); el.id='fmadv'; el.setAttribute('aria-hidden','true'); el.addEventListener('click',()=>el.classList.remove('on')); document.body.appendChild(el); }
  const days=[]; for(let d=d0-1;d<=d1+6;d++)days.push(d);
  const col=d=>{ const o=dobj(d), g=calGame(d), ev=calEvents(d).slice(0,2), per=period();
    const gm=g?`<div class="fa-g${g.res?' has':''}">${badge(g.op,18)}<span><b>${esc(tshort(g.op))}</b><i>${g.home?'홈':'원정'}${g.kind?' · '+esc(g.kind):''}</i></span>${g.res?`<em class="${g.res.r==='승'?'w':g.res.r==='패'?'l':''}">${g.res.r} ${g.res.my}:${g.res.op}</em>`:''}</div>`:(per==='season'?'<div class="fa-rest">휴식</div>':'');
    return `<div class="fa-c${d<=d0?' done':''}${d===d0?' cur':''}" data-d="${d}"><div class="fa-h"><b>${o.d}</b><i>${WD[o.w]}${o.d===1||d===days[0]?` · ${o.m}월`:''}</i></div>${gm}${ev.map(e=>`<div class="fa-e">${esc(e.t)}</div>`).join('')}</div>`; };
  const nx=(()=>{ for(let d=d1;d<=d1+30;d++){ const g=calGame(d); if(g&&!g.res)return {d,g}; } return null; })();
  const host=nx?(nx.g.home?G.user:nx.g.op):null;
  const up=[]; for(let d=d0+1;d<=d1+40&&up.length<4;d++){ const g=calGame(d); if(g)up.push({d,g}); } /* 띠가 출발하는 날 다음부터. 결과는 띠가 그날을 지날 때 드러난다(검수 11-08: 마지막 경기 점수가 먼저 뜸) */
  el.innerHTML=`<div class="fa-top"><div class="fa-today"><i>${nx&&nx.d===d1?'오늘':nx?dsh(nx.d):''}</i>${nx?`<b>${esc(tshort(nx.g.home?G.user:nx.g.op))} vs ${esc(tshort(nx.g.home?nx.g.op:G.user))}</b><span>${esc(nx.g.kind||'정규시즌')}${host!=null?' · '+esc(stadNameAt(host,nx.d)):''}</span>`:'<b>예정된 경기 없음</b>'}</div>
    ${nx?`<div class="fa-vs">${badge(nx.g.home?G.user:nx.g.op,64)}<b>vs</b>${badge(nx.g.home?nx.g.op:G.user,64)}</div>`:''}
    <div class="fa-list">${up.map(x=>`<div><span>${dsh(x.d)}</span><span>${x.g.home?'홈':'원정'}</span><span>${badge(x.g.op,14)} ${esc(tshort(x.g.op))}</span><em class="fa-r ${x.g.res?(x.g.res.r==='승'?'w':x.g.res.r==='패'?'l':''):''}" data-d="${x.d}" data-r="${x.g.res?`${x.g.res.my}-${x.g.res.op}`:'-'}">-</em></div>`).join('')}</div></div>
    <div class="fa-strip"><div class="fa-in" style="--faw:${FMADV_W}px;transition-duration:${Math.round(st*.85)}ms">${days.map(col).join('')}</div></div>`;
  el._n=0; el._d0=d0; el.className='on'; clearTimeout(fmAdvPanel._t); fmAdvPanel._t=setTimeout(()=>el.classList.remove('on'),st*(d1-d0)+1400); }
function fmAdvStep(i){ const el=document.getElementById('fmadv'); if(!el||!el.classList.contains('on'))return; const inn=el.querySelector('.fa-in'); if(!inn)return; inn.style.transform=`translateX(${-i*FMADV_W}px)`; const cs=[...inn.children]; cs.forEach((c,k)=>{ c.classList.toggle('cur',k===i+1); if(k<=i+1)c.classList.add('done'); }); el.querySelectorAll('.fa-r').forEach(r=>{ if(+r.dataset.d<=el._d0+i)r.textContent=r.dataset.r; }); }
function dayTick(d0){ if(UI.advRun)return;const d1=G.day; if(!(d1>d0)){ tkDone(); return; } { const sg=spoilG(); if(sg&&sg.day>d0&&sg.day<=d1)UI._spoilD=sg.day; } let still=false; try{ still=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){}
  (dayTick._steps||[]).forEach(clearTimeout);clearTimeout(dayTick._t);clearTimeout(dayTick._t2);
  /* '동작 줄이기'를 켠 기기(아이폰 설정 등)도 날짜가 넘어간 것은 보여 준다: 움직임 없이 지나간 날짜 띠를 잠깐 띄운다 */
  /* PC(FM처럼): 화면 가운데 띠 대신 오른쪽 위 날짜가 하루씩 넘어가고 '진행하기' 버튼에 진행 막대가 찬다. 경기한 날은 날짜 아래에 상대와 결과가 잠깐 */
  if(fmOn()||document.querySelector('.top .goset')){ /* 윈도우 '애니메이션 효과 끄기'(동작 줄이기)여도 PC는 FM식으로(사용자 11-08: 가운데 날짜 띠가 뜸). 휴대폰도 같은 방식: 위 날짜가 넘어가고 진행하기 버튼에 막대(사용자 11-09) */ const mob=!fmOn(), bt=mob?(document.querySelector('.top .goset>button.continue')||document.querySelector('.top .goset>button:last-child')):(document.querySelector('.fmtop .goset>button.continue')||document.querySelector('.fmtop .goset>button:last-child')); const L=[]; for(let d=d0+1;d<=d1;d++)L.push(d);
    const st=Math.max(180,Math.min(420,2400/L.length)), tot=st*L.length; /* 날짜 칸이 지나가는 게 보이게 하루 0.18~0.42초 */
    dayTick._until=Date.now()+tot; if(bt){ bt.classList.add('fm-busy'); bt.style.setProperty('--fmdur',tot+'ms'); }
    const put=d=>{ const mob=!fmOn(),de=mob?document.querySelector('.top .tbar .club>div>span'):document.querySelector('.fmtop .fm-date'); if(!de)return; /* 다시 그리거나 회전하면 현재 화면의 날짜 요소와 형식을 쓴다 */ const o=dobj(d), g=calGame(d); de.classList.remove('fm-flip'); void de.offsetWidth; de.classList.add('fm-flip'); if(mob){ de.innerHTML=`<b>${o.m}/${o.d} ${WD[o.w]}</b>`; } else { const b=de.querySelector('b'); if(b)b.textContent=`${WD[o.w]} ${o.m}월 ${o.d}일`; } let r=de.querySelector('.fm-dres'); if(!r){ r=document.createElement('i'); r.className='fm-dres'; de.appendChild(r); } r.innerHTML=g&&g.res?`${badge(g.op,14)} <em class="${g.res.r==='승'?'w':g.res.r==='패'?'l':''}">${g.res.r} ${g.res.my}:${g.res.op}</em>`:''; };
    put(d0); if(!mob)try{ fmAdvPanel(d0,d1,st); }catch(e){} dayTick._steps=L.map((d,i)=>setTimeout(()=>{ put(d); tkShow(d); if(!mob)fmAdvStep(i+1); },(i+1)*st));
    if(UI._tk)UI._tk.until=Date.now()+tot+200; dayTick._t2=setTimeout(tkDone,tot+50);
    dayTick._t=setTimeout(()=>{ dayTick._until=0; /* 진행 중 render로 교체된 버튼도 마친 상태로 정리한다. */ document.querySelectorAll('.goset .fm-busy').forEach(b=>{b.classList.remove('fm-busy');b.style.removeProperty('--fmdur');}); const r=document.querySelector('.fmtop .fm-date .fm-dres,.top .tbar .club>div>span .fm-dres'); if(r)setTimeout(()=>r.remove(),900); },tot+250); return; }
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
  const rows=L.map((x,i)=>{ const o=dobj(x.d); const rk=tieRank(order,x.op); const r=st&&st[x.op]; const s=sp[i]&&sp[i].sp;
    return `<button class="ug-r${i===0?' ug-nx':''}" data-a="calJump" data-v="${x.d}"><span class="ug-d"><b>${o.m}/${o.d}</b><i>${WD[o.w]}</i></span><span class="ug-o">${x.home?'vs':'@'} ${badge(x.op,18)} <b>${esc(tshort(x.op))}</b>${x.ps?` <span class="pill acc">${esc(x.ps)}</span>`:x.run.n>1?` <i class="muted">${x.run.n}연전 ${x.si}</i>`:''}</span><span class="ug-m small muted">${rk&&per!=='pre'?`${rk}위${r?` · ${r.w}-${r.l}`:''}`:''}</span><span class="ug-s small">${s?`선발 ${esc(s.name)}`:''}</span></button>`; }).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">앞으로의 경기</h2><button class="btn small" data-a="calOpen">캘린더</button></div><div class="ug">${rows}</div><p class="small muted">선발은 로테이션 순번과 휴식일로 본 예상입니다. 줄을 누르면 캘린더에서 그날을 엽니다.</p></section>`; }

/* 단장 일정 잡기: 직관(혼자·구단주·사장), 고교 대회 출장(지역), 고교 방문(학교), 2군 경기 관전, 2군 훈련장 방문 */
function gmPlanBox(d,g){ const pl=gmPlanAt(d); const T=gmTourn(d); const B=[]; const fg=flGameOn(G.user,d);
  const lab=pl?(pl.k==='attend'?`직관${pl.x==='owner'?' · 구단주 동행':pl.x==='ceo'?' · 사장 동행':''}`:pl.k==='scout'?`${pl.x} ${T||'고교 대회'} 출장`:pl.k==='school'?`${pl.x} 방문`:pl.k==='tryout'?'공개 트라이아웃 참관':pl.k==='fut'?`2군 ${pl.op!=null?flName(pl.op)+'전 ':''}관전`:'2군 훈련장 방문'):'';
  if(g)B.push(`<div class="gpl-r"><span class="small">경기 직관</span>${[['solo','혼자'],['owner','구단주와'],['ceo','사장과']].map(([x,l])=>`<button class="btn small${pl&&pl.k==='attend'&&pl.x===x?' primary':''}" ${x!=='solo'&&!gmCompanion(x)?'disabled title="현재 동행할 인물이 없습니다."':''} data-a="gmPlan" data-v="${d}:attend:${x}">${l}</button>`).join('')}</div>`);
  if(T)B.push(`<div class="gpl-r"><span class="small">${esc(T)} 출장</span>${REG.map(r=>`<button class="btn small${pl&&pl.k==='scout'&&pl.x===r?' primary':''}" data-a="gmPlan" data-v="${d}:scout:${r}">${r}</button>`).join('')}</div>`);
  if(T&&pl&&pl.k==='scout')B.push(`<div class="gpl-r"><span class="small">한꺼번에</span><button class="btn small" data-a="gmPlanBulk" data-v="${d}:${pl.x}:upto">오늘부터 이 날까지 ${esc(pl.x)}</button>${gmTournSpan(d)?`<button class="btn small" data-a="gmPlanBulk" data-v="${d}:${pl.x}:tourn">${esc(T)} 기간 전체</button>`:''}</div>`);
  if(gmSchSeason(d)){ const S=gmSchools(); if(S.length){ const regs=REG.filter(r=>S.some(s=>s.reg===r)); const cur=UI.gmSchR&&regs.includes(UI.gmSchR)?UI.gmSchR:pl&&pl.k==='school'?(S.find(s=>s.n===pl.x)||{}).reg:null; const F=gmFld();
    B.push(`<div class="gpl-r"><span class="small">고교 방문</span>${regs.map(r=>`<button class="btn small${cur===r?' primary':''}" data-a="gmSchR" data-v="${r}" aria-expanded="${cur===r}">${r}</button>`).join('')}</div>`);
    if(cur)B.push(`<div class="gpl-r"><span class="small">${esc(cur)} 학교</span>${S.filter(s=>s.reg===cur).map(s=>`<button class="btn small${pl&&pl.k==='school'&&pl.x===s.n?' primary':''}" data-a="gmPlan" data-v="${d}:school:${esc(s.n)}"${F.sch[s.n]?' title="올해 다녀온 학교입니다. 다시 가면 새로 알게 되는 것이 적습니다."':''}>${esc(s.n)}${F.sch[s.n]?' · 다녀옴':''}</button>`).join('')}<button class="btn small" data-a="gmPlanBulk" data-v="${d}:${cur}:school">이 날까지 주 한 곳씩</button></div>`); } }
  if(fg)B.push(`<div class="gpl-r"><span class="small">2군 경기 관전</span><button class="btn small${pl&&pl.k==='fut'?' primary':''}" data-a="gmPlan" data-v="${d}:fut:">${fg.home?'vs':'@'} ${esc(flName(fg.op))}</button><button class="btn small" data-a="gmPlanBulk" data-v="${d}:home:fut">이 날까지 홈 경기</button><button class="btn small" data-a="gmPlanBulk" data-v="${d}:all:fut">이 날까지 전 경기</button></div>`);
  else if(dobj(d).m>=4&&dobj(d).m<=9)B.push(`<div class="gpl-r"><span class="small">2군 훈련장 방문</span><button class="btn small${pl&&pl.k==='farm'?' primary':''}" data-a="gmPlan" data-v="${d}:farm:">훈련장 방문</button></div>`);
  if(tryIsDay(d))B.push(`<div class="gpl-r"><span class="small">KBO 공개 트라이아웃</span><button class="btn small${pl&&pl.k==='tryout'?' primary':''}" data-a="gmPlan" data-v="${d}:tryout:">직접 참관</button></div>`); /* 94_tryout: 직접 보면 평가 오차가 준다 */
  if(!B.length)return '';
  return `<div class="gpl"><div class="row between"><span class="eyebrow">단장 일정</span>${pl?`<span class="row"><span class="pill acc">${esc(lab)}</span><button class="btn small" data-a="gmPlan" data-v="${d}:">취소</button></span>`:'<span class="small muted">경기는 결과 보고로 받습니다. 볼 경기나 출장, 방문을 잡아 두세요.</span>'}</div>${B.join('')}<p class="small muted">2군 선수단 기분은 한 달에 두 번까지만 오릅니다. 학교 방문은 한 주에 한 번입니다.</p></div>`; }
/* 단장 일정 한눈에 보기: 종류별 색·짧은 이름, 여러 날 묶음은 띠(gmPlanSpans), 이달 목록 */
const GPL_K={scout:{c:'#d99a2b',l:'출장'},school:{c:'#d9667c',l:'고교 방문'},fut:{c:'#2fa878',l:'2군 관전'},farm:{c:'#4f97ad',l:'2군 시설'},attend:{c:'#8577e6',l:'직관'},tryout:{c:'#7a8f3a',l:'트라이아웃'}}; /* tryout: 12월 공개 트라이아웃 참관(94_tryout) */
function gplShort(p){ return p.k==='attend'?(p.x==='owner'?'직관·구단주':p.x==='ceo'?'직관·사장':'직관'):p.k==='scout'?`${p.x} 출장`:p.k==='school'?String(p.x||'고교 방문'):p.k==='fut'?'2군 관전':p.k==='tryout'?'트라이아웃':'2군 시설'; }
function gplLong(s){ const p=s.p, n=s.days.length; return p.k==='scout'?`${p.x} 고교 대회 출장${n>1?` · ${n}일`:''}`:p.k==='school'?`${p.x} 방문`:p.k==='fut'?(n>1?`2군 경기 관전 · ${n}경기`:`2군 ${p.op!=null?flName(p.op)+'전 ':''}관전`):p.k==='farm'?'2군 훈련장 방문':p.k==='tryout'?'공개 트라이아웃 참관':`경기 직관${p.op!=null?` · ${tshort(p.op)}전`:''}${p.x==='owner'?' · 구단주 동행':p.x==='ceo'?' · 사장 동행':''}`; }
const gplMD=d=>{ const o=dobj(d); return o.m+'/'+o.d; };
function gplBarLbl(s){ return `${gplShort(s.p)} ~${gplMD(s.b)}`; }
/* 겹치는 묶음은 줄(lane)을 나눈다 */
function gplLanes(M){ const end=[]; for(const s of [...M].sort((x,y)=>x.a-y.a||y.b-x.b)){ let i=0; while(end[i]!=null&&end[i]>=s.a)i++; end[i]=s.b; s.lane=i; } return M; }
/* 월 달력용: 칸 위치(w0=첫 칸 앞 빈칸 수)로 주마다 띠 조각을 만든다. 잡은 날은 굵은 띠, 사이 빈 날은 가는 선, 이름은 시작에 한 번 */
function gplGrid(first,last,w0){ const S=gmPlanSpans(first,last), M=gplLanes(S.filter(s=>s.multi)), pos=d=>{ const i=w0+d-first; return [Math.floor(i/7)+1,i%7+1]; }; const R={inSpan:{},rowLn:{},aria:{},bars:''};
  for(const s of S)for(const d of s.multi?s.days:[s.a])R.aria[d]=s.multi?`${gplLong(s)} ${dmd(s.a)}~${dmd(s.b)}`:gplLong(s);
  for(const s of M){ const c=GPL_K[s.k].c, own=new Set(s.days), a=Math.max(s.a,first), b=Math.min(s.b,last); let lab=false;
    for(let d=a;d<=b;d++)if(!R.inSpan[d]||own.has(d))R.inSpan[d]=s;
    for(let d=a;d<=b;){ const [r,c0]=pos(d), solid=own.has(d); let e=d; while(e<b&&pos(e+1)[0]===r&&own.has(e+1)===solid)e++; const c1=pos(e)[1]; R.rowLn[r]=Math.max(R.rowLn[r]||0,s.lane+1);
      R.bars+=`<span class="cal-bar${solid?'':' cb-gap'}${e<G.day?' cb-past':''}${d===s.a?' cb-s':''}${e===s.b?' cb-e':''}${e<s.b&&c1<7?' cb-x':''}" style="grid-area:${r}/${c0}/${r+1}/${c1+1};--pc:${c};--lane:${s.lane}" aria-hidden="true" data-span="${s.a}"></span>`;
      /* 이름: 시작 줄에서 그 주 끝(또는 묶음 끝)까지 쓴다. 시작이 주 끝이라 좁으면 다음 줄 첫머리에 한 번 더 */
      if(!lab||(c0===1&&d>a&&lab==='narrow')){ let z=d; while(z<b&&pos(z+1)[0]===r)z++; const w=pos(z)[1]-c0+1; R.bars+=`<span class="cal-bl" style="grid-area:${r}/${c0}/${r+1}/${pos(z)[1]+1};--lane:${s.lane}" aria-hidden="true">${esc(lab?gplShort(s.p):gplBarLbl(s))}</span>`; lab=lab?true:w<3?'narrow':true; }
      d=e+1; } }
  return R; }
/* 이달 단장 일정 목록: 기간과 할 일, 누르면 그날을 연다 */
function gplMonth(y,m){ const a=dnum(y,m,1), b=dnum(m===12?y+1:y,m===12?1:m+1,1)-1, now=dobj(G.day), S=gmPlanSpans(a,b);
  const rows=S.map(s=>{ const st=s.b<G.day?'지남':s.a<=G.day?'진행 중':'', v=Math.max(s.a,a), o=dobj(s.a);
    return `<button class="gpl-mr${st==='지남'?' past':''}" data-a="calJump" data-v="${v}"><span class="gpl-md">${s.multi?`${gplMD(s.a)}~${gplMD(s.b)}`:`${gplMD(s.a)} (${WD[o.w]})`}</span><span class="gpl-mt"><i style="background:${GPL_K[s.k].c}"></i><b>${esc(gplLong(s))}</b></span>${st?`<em>${st}</em>`:''}</button>`; }).join('');
  const leg=`<div class="cal-leg gpl-leg">${Object.values(GPL_K).map(x=>`<span><i style="background:${x.c}"></i>${x.l}</span>`).join('')}</div>`;
  return `<section class="card gpl-mon"><div class="row between"><h2 class="sec">${now.y===y&&now.m===m?'이번 달':`${m}월`} 단장 일정</h2><span class="small muted">${S.length?`${S.length}건`:''}</span></div>${rows?`<div class="gpl-ml">${rows}</div>`:'<p class="small muted">잡은 일정이 없습니다. 앞으로의 날짜를 누르면 출장·고교 방문·2군 관전을 잡을 수 있습니다.</p>'}${gplSchBulk(a)}${leg}</section>`; }
/* 고교 방문 한꺼번에(국사왕 제안): 권역별로 이달 또는 시즌 끝까지. 규칙은 하루씩 잡을 때와 같다(주 1회, 같은 학교는 효과 감소) */
function gplSchBulk(a){ if(G.unemp)return ''; let S=[]; try{ S=gmSchools(); }catch(e){ return ''; } const regs=REG.filter(r=>S.some(s=>s.reg===r)); if(!regs.length)return '';
  const RM=gmSchRange(a,'schm'), RS=gmSchRange(G.day,'schs'); if(!RM&&!RS)return ''; const m=dobj(a).m;
  return `<div class="gpl-r gpl-bulk"><span class="small">고교 방문 한꺼번에</span>${regs.map(r=>`<span class="row gpl-bk"><b class="small">${esc(r)}</b>${RM?`<button class="btn small" data-a="gmPlanBulk" data-v="${a}:${esc(r)}:schm">${m}월</button>`:''}${RS?`<button class="btn small" data-a="gmPlanBulk" data-v="${G.day}:${esc(r)}:schs">시즌 끝까지</button>`:''}</span>`).join('')}</div><p class="small muted">학교 방문은 한 주에 한 번입니다. 덜 가 본 학교부터 잡고, 이미 잡은 일정은 그대로 둡니다.</p>`; }
/* PC 한 주 띠: 묶음은 칸 위쪽 같은 줄에 이어 그리고, 하루짜리는 일정 아래 칩으로 */
function gplWeek(days){ const S=gmPlanSpans(days[0],days[6]), M=gplLanes(S.filter(s=>s.multi)), n=M.reduce((x,s)=>Math.max(x,s.lane+1),0);
  return d=>{ const own=s=>s.days.includes(d); let h=''; if(n){ h='<span class="sch-pbw">'; for(let i=0;i<n;i++){ const s=M.find(z=>z.lane===i&&d>=z.a&&d<=z.b); if(!s){ h+='<span class="sch-pb pb-nil"></span>'; continue; } const st=d===s.a||d===days[0];
      h+=`<span class="sch-pb${own(s)?'':' pb-gap'}${d===s.a?' pb-s':''}${d===s.b?' pb-e':''}" style="--pc:${GPL_K[s.k].c}" title="${esc(gplLong(s))} ${dmd(s.a)}~${dmd(s.b)}">${st?esc(d===s.a?gplBarLbl(s):gplShort(s.p)):''}</span>`; } h+='</span>'; }
    const p=gmPlanAt(d), one=p&&!p.miss&&!p.cancelled&&!M.some(s=>s.days.includes(d))?p:null;
    return {top:h,chip:one?`<span class="sch-e sch-pl${one.done?' done':''}" style="--ec:${GPL_K[one.k].c}">${esc(gplShort(one))}</span>`:''}; }; }
/* PC 일정(FM '주요 일정'처럼): 위 한 주 띠(경기·마감·리그 일정), 아래 왼쪽 시즌 경기 목록(지난 경기 결과·선발, 앞으로 경기 D-day·예상 선발), 오른쪽 고른 날 상세 */
function calFM(){ const c=G.cal; const sel=UI.calSel??G.day; const so=dobj(sel), mon=sel-((so.w+6)%7);
  const days=Array.from({length:7},(_,i)=>mon+i);
  const wk=gplWeek(days);
  const nx=nextGames(1)[0];
  const strip=`<section class="card sch-wk"><div class="row between sch-nav"><b>${so.y}년 ${so.m}월</b><span class="row">${nx?`<span class="small muted">다음 경기 ${dmd(nx.d)} ${nx.home?'홈':'원정'} vs ${esc(tshort(nx.op))}</span>`:''}<button class="btn small" data-a="calWk" data-v="${G.day-sel}">오늘</button><button class="btn small" data-a="calWk" data-v="-7" aria-label="지난주">◀</button><button class="btn small" data-a="calWk" data-v="7" aria-label="다음 주">▶</button></span></div>
    <div class="sch-days">${days.map(d=>{ const o=dobj(d), g=calGame(d), ev=calEvents(d), pw=wk(d);
      return `<button class="sch-d${d===G.day?' today':''}${d===sel?' sel':''}${d<G.day?' past':''}" data-a="calDay" data-v="${d}"><span class="sch-n"><b>${o.d}</b>${WD[o.w]}${d===G.day?' · 오늘':''}</span>${pw.top}${g?`<span class="sch-g${g.res?' '+({승:'w',패:'l'}[g.res.r]||'t'):''}${g.home?' h':''}">${badge(g.op,26)}<span><i>${g.kind?esc(g.kind):'정규시즌'} · ${g.home?'홈':'원정'}</i><b>${esc(tshort(g.op))}</b>${g.res?`<em>${g.res.r} ${g.res.my}:${g.res.op}</em>`:''}</span></span>`:''}${ev.slice(0,3).map(e=>`<span class="sch-e" style="--ec:${CAL_K[e.k].c}">${esc(e.t)}</span>`).join('')}${ev.length>3?`<span class="sch-e more">외 ${ev.length-3}건</span>`:''}${pw.chip}</button>`; }).join('')}</div></section>`;
  /* 시즌 경기 목록: 지난 경기는 최근 8경기(전체 보기로 펼침), 앞으로는 끝까지 */
  const all=[]; const start=(c&&c.open)||G.day, end=Math.max((c&&c.end)||G.day,G.day+60); for(let d=start;d<=end;d++){ const g=calGame(d); if(g)all.push({d,g}); }
  const past=all.filter(x=>x.d<G.day||(x.d===G.day&&x.g.res)), fut=all.filter(x=>!past.includes(x)); const nP=Math.max(8,20-fut.length), showP=UI.calAll?past:past.slice(-nP); /* 남은 경기가 적으면(시즌 끝) 지난 경기를 더 보여 칸을 채운다 */
  let proj=[]; try{ proj=projStarters(G.user,6)||[]; }catch(e){} const nxL=nextGames(8);
  const st=(x)=>{ const r=x.g.gi>=0?G.games[x.g.gi]:null; if(r&&r.box){ const me=r.home===G.user?'h':'a', op=me==='h'?'a':'h'; const a=(r.box[me].pit[0]||{}).n, b=(r.box[op].pit[0]||{}).n; return `${a?esc(a):'-'} <i>vs</i> ${b?esc(b):'-'}`; } if(x.d>G.day){ const k=nxL.findIndex(y=>y.d===x.d); const s=k>=0&&proj[k]?proj[k].sp:null; return s?`<i>예상</i> ${esc(s.name)}`:''; } return ''; };
  let lastM=null; const rows=[...showP,...fut].map(x=>{ const o=dobj(x.d), g=x.g, mh=o.m!==lastM?`<tr class="sch-mh"><td colspan="8">${o.y}년 ${o.m}월</td></tr>`:''; lastM=o.m; const dd=x.d-G.day, rk=(()=>{ const S=standOrder(), L=S.order||[]; const i=L.findIndex(y=>(y.tid??y)===g.op); return i<0?'':S.live?tieRank(L,g.op):i+1; })();
    return mh+`<tr class="${x.d===sel?'sel':''}${x.d===G.day?' today':''}" data-a="calDay" data-v="${x.d}"><td>${o.m}/${o.d} ${WD[o.w]}</td><td class="muted">${dd===0?'오늘':dd>0?dd+'일 뒤':-dd+'일 전'}</td><td class="muted">${g.kind?esc(g.kind):'정규시즌'}</td><td>${g.home?'홈':'원정'}</td><td class="muted">${rk?rk+'위':''}</td><td>${g.res?`<span class="sch-r ${({승:'w',패:'l'}[g.res.r]||'t')}">${g.res.r}</span> <b>${g.res.my}-${g.res.op}</b>`:''}</td><td>${badge(g.op,18)} ${esc(tshort(g.op))}</td><td class="sch-sp">${st(x)}</td></tr>`; }).join('');
  const list=`<section class="card sch-list"><div class="row between"><h3>경기 일정·결과 <em>${past.length}경기 치름 · ${fut.length}경기 남음</em></h3>${past.length>nP?`<button class="btn small" data-a="calAll">${UI.calAll?`최근 ${nP}경기만`:'지난 경기 모두 보기'}</button>`:''}</div><div class="sf-tw"><table class="sf-t sch-t"><thead><tr><th>날짜</th><th></th><th>대회</th><th>장소</th><th>상대 순위</th><th>결과</th><th>상대</th><th>선발 맞대결</th></tr></thead><tbody>${rows||'<tr><td colspan="8" class="muted">경기 일정이 없습니다.</td></tr>'}</tbody></table></div></section>`;
  return `<div class="sch ws-own">${strip}${list}<div class="sch-side">${calDetail(sel,1)}${gplMonth(so.y,so.m)}${calUpcoming(120)}${(()=>{ const g=calGame(sel); if(!g)return ''; const pr=g.home?promoBox(sel):''; return `<section class="card sch-op">${ibdOpp(g.op,'상대 전력')}</section><section class="card sch-op">${ibdForm(g.op,'상대 수비 배치')}</section>${pr?`<section class="card sch-promo">${pr}</section>`:''}`; })()}</div></div>`; } /* 오른쪽 순서(카페 11-17): 날짜·진행 · 단장 일정 · 다가오는 일정 · 상대 전력 · 상대 수비 배치 · 프로모션 데이 */

