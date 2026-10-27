/* ===== 구단 캘린더 (FM 일정 화면 방식) =====
   한 달을 월~일 격자로 보여 준다. 칸마다 우리 경기(상대·홈원정·결과)와 마감·리그 행사·우리 일(결정 기한, 부상 복귀 등)을 표시하고,
   날짜를 누르면 아래에 그날의 자세한 내용과 '이 날까지 진행' 버튼이 나온다.
   진행 버튼을 누르면 지나간 날짜가 화면 위에서 하루씩 넘어가는 띠로 보인다(FM의 진행 표시처럼) */
const CAL_K={dl:{c:'#ff6b6b',l:'마감'},lg:{c:'#5aa9ff',l:'리그'},me:{c:'#ffb547',l:'우리 일'},pl:{c:'#9be27a',l:'선수'}};
/* 해마다 같은 날짜에 돌아오는 일정 */
const CAL_FIX=[[1,8,'연봉 미계약 점검','me'],[1,10,'연봉조정 신청 마감','dl'],[1,20,'연봉조정 결정 · 입대일','lg'],[1,24,'FA 시장 사실상 마감','dl'],[7,31,'트레이드 마감','dl'],[8,15,'외국인 등록 마감','dl'],[11,2,'FA 공시','lg'],[11,6,'FA 협상 시작','lg'],[12,1,'연봉 협상 시작','me']];
function calEvents(d){ const o=dobj(d); const out=[]; const c=G.cal;
  for(const [m,dd,l,k] of CAL_FIX)if(o.m===m&&o.d===dd)out.push({k,t:l});
  if(c&&c.y===o.y){ const L=[[c.camp,'스프링캠프 시작','lg'],[c.campEnd,'캠프 종료','lg'],[c.exh,'시범경기 시작','lg'],[c.open,'정규시즌 개막','lg'],[c.asg,'올스타전','lg'],[c.draft,'신인 드래프트','dl'],[c.end,'정규시즌 종료','lg']]; for(const [n,t,k] of L)if(n===d)out.push({k,t}); }
  /* 우리 일: 결정 기한, 트레이드 제안 기한, 우선 제안·라스트 룩 기한 */
  for(const e of (G.evs||[]))if(!e.done&&e.exp===d)out.push({k:'me',t:`결정 기한: ${e.title}`});
  for(const of of (G.offers||[]))if(of.exp===d)out.push({k:'me',t:`트레이드 제안 기한: ${tshort(of.from)}`});
  if(G.fa){ for(const id in (G.fa.pitch||{})){ const x=G.fa.pitch[id]; const p=G.players[id]; if(p&&x.until===d)out.push({k:'me',t:`우선 제안 기한: ${p.name}`}); }
    for(const id in (G.fa.mk||{})){ const x=G.fa.mk[id]; const p=G.players[id]; if(!p||p.team!=null)continue; if(x.ll&&x.ll.until===d)out.push({k:'dl',t:`라스트 룩 기한: ${p.name}`}); else if(!x.done&&x.next===d&&(G.fa.offers[id]||p.faFrom===G.user))out.push({k:'me',t:`시장 보고: ${p.name}`}); } }
  /* 우리 선수: 부상 복귀 예정, 전역 */
  if(d>G.day&&d-G.day<=120)for(const p of playersOf(G.user)){ if(p.injOut>0&&G.day+p.injOut===d)out.push({k:'pl',t:`${p.name} 부상 복귀 예정`}); }
  for(const p of Object.values(G.players)){ if(p.team!==G.user&&!(p.mil&&p.mil.tid===G.user))continue; if(p.mil&&p.mil.until===d)out.push({k:'pl',t:`${p.name} 전역`}); }
  return out; }
/* 그날 우리 경기 */
function calGame(d){ const c=G.cal; let m=null, kind='';
  if(c&&c.sched[d])m=c.sched[d].find(x=>x.includes(G.user));
  const log=(G.sea&&G.sea.ulog||[]).find(x=>x.d===d);
  if(!m&&log){ m=[log.h,log.a]; kind=log.k||''; }
  if(!m)return null; const home=m[0]===G.user; const op=home?m[1]:m[0];
  return {home,op,kind,res:log?{r:log.res,my:home?log.hs:log.as,op:home?log.as:log.hs}:null,gi:G.games.findIndex(g=>g.day===d&&(g.home===G.user||g.away===G.user))}; }
function calView(){ const now=dobj(G.day); const ym=UI.calYM||{y:now.y,m:now.m}; UI.calYM=ym;
  const first=dnum(ym.y,ym.m,1); const w0=(dobj(first).w+6)%7; /* 월요일 시작 */ const last=dnum(ym.m===12?ym.y+1:ym.y,ym.m===12?1:ym.m+1,1)-1;
  const sel=UI.calSel!=null&&dobj(UI.calSel).m===ym.m&&dobj(UI.calSel).y===ym.y?UI.calSel:(now.y===ym.y&&now.m===ym.m?G.day:first);
  let cells=''; for(let i=0;i<w0;i++)cells+='<div class="cal-c nil"></div>';
  for(let d=first;d<=last;d++){ const o=dobj(d); const ev=calEvents(d); const g=calGame(d);
    const gch=g?`<span class="cal-g${g.res?(g.res.r==='승'?' w':g.res.r==='패'?' l':' t'):''}">${badge(g.op,14)}<i>${g.home?'vs':'@'} ${esc(tshort(g.op))}</i>${g.res?`<b>${g.res.my}:${g.res.op}</b>`:''}</span>`:'';
    const evh=ev.slice(0,2).map(e=>`<span class="cal-e" style="--ec:${CAL_K[e.k].c}">${esc(e.t)}</span>`).join('')+(ev.length>2?`<span class="cal-more">+${ev.length-2}</span>`:'');
    cells+=`<button class="cal-c${d===G.day?' today':''}${d<G.day?' past':''}${d===sel?' sel':''}${o.w===1?' mon':''}" data-a="calDay" data-v="${d}" aria-label="${o.m}월 ${o.d}일"><span class="cal-n">${o.d}</span>${gch}${evh}</button>`; }
  const pm=ym.m===1?{y:ym.y-1,m:12}:{y:ym.y,m:ym.m-1}, nm=ym.m===12?{y:ym.y+1,m:1}:{y:ym.y,m:ym.m+1};
  const nav=`<div class="row between cal-nav"><button class="btn small" data-a="calMon" data-v="${pm.y}:${pm.m}">◀ ${pm.m}월</button><b class="cal-ttl">${ym.y}년 ${ym.m}월</b><span class="row"><button class="btn small" data-a="calMon" data-v="${now.y}:${now.m}">오늘</button><button class="btn small" data-a="calMon" data-v="${nm.y}:${nm.m}">${nm.m}월 ▶</button></span></div>`;
  const leg=`<div class="cal-leg">${Object.values(CAL_K).map(x=>`<span><i style="background:${x.c}"></i>${x.l}</span>`).join('')}<span><i class="g"></i>우리 경기</span></div>`;
  return `<section class="card">${nav}<div class="cal-w">${['월','화','수','목','금','토','일'].map(x=>`<span>${x}</span>`).join('')}</div><div class="cal-grid">${cells}</div>${leg}</section>${calDetail(sel)}${calUpcoming()}`; }
function calDetail(d){ const o=dobj(d); const ev=calEvents(d); const g=calGame(d); const dd=d-G.day;
  let gh=''; if(g){ const sp=d>G.day&&d-G.day<=6?(()=>{ try{ const L=projStarters(G.user,6); const k=nextGames(8).findIndex(x=>x.d===d); const s=k>=0&&L[k]?L[k].sp:null; return s?` · 예상 선발 ${esc(s.name)}`:''; }catch(e){ return ''; } })():'';
    gh=`<div class="cal-dg">${badge(g.op,28)}<div><b>${g.kind?esc(g.kind)+' · ':''}${g.home?'홈':'원정'} ${g.home?'vs':'@'} ${esc(tname(g.op))}</b><span class="small muted">${g.res?`${g.res.r} ${g.res.my}:${g.res.op}`:d<G.day?'결과 기록 없음':`예정${sp}`}</span></div>${g.gi>=0&&G.games[g.gi]?`<button class="btn small" data-a="openGame" data-v="${g.gi}">박스스코어</button>`:''}</div>`; }
  return `<section class="card"><div class="row between"><h2 class="sec">${o.m}월 ${o.d}일 ${WD[o.w]}요일</h2><span class="small muted">${dd===0?'오늘':dd>0?`D-${dd}`:`${-dd}일 전`}</span></div>
    ${gh}${ev.length?`<ul class="cal-dl">${ev.map(e=>`<li><i style="background:${CAL_K[e.k].c}"></i>${esc(e.t)}</li>`).join('')}</ul>`:(g?'':'<p class="small muted">일정이 없습니다.</p>')}
    ${d>G.day?`<div class="row"><button class="btn primary" data-a="advTo" data-v="${d}" ${blocker()?'disabled':''}>이 날까지 진행</button><span class="small muted">중요한 소식이나 결정할 일이 생기면 그 전에 멈춥니다.</span></div>`:''}</section>`; }
/* 다가오는 주요 일정 30일: 마감은 빨간 D-day */
function calUpcoming(){ const L=[]; for(let d=G.day+1;d<=G.day+45&&L.length<10;d++){ for(const e of calEvents(d))if(e.k==='dl'||e.k==='lg'||e.k==='me')L.push({d,...e}); }
  return L.length?`<section class="card"><h2 class="sec">다가오는 일정</h2><div class="cal-up">${L.slice(0,10).map(x=>`<button class="cal-ur" data-a="calJump" data-v="${x.d}"><span class="ticker" style="${x.k==='dl'?'color:#ff6b6b':''}">D-${x.d-G.day}</span><span>${dmd(x.d)}</span><b>${esc(x.t)}</b></button>`).join('')}</div></section>`:''; }
/* 진행 표시: 지나간 날짜를 하루씩 넘기는 띠(FM의 날짜 진행처럼). 화면을 막지 않고 1초쯤 뒤 사라진다 */
function dayTick(d0){ const d1=G.day; if(!(d1>d0))return; try{ if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return; }catch(e){}
  let el=document.getElementById('dtick'); if(!el){ el=document.createElement('div'); el.id='dtick'; el.setAttribute('aria-hidden','true'); document.body.appendChild(el); }
  let days=[]; for(let d=d0+1;d<=d1;d++)days.push(d); if(days.length>14)days=days.slice(0,6).concat([null],days.slice(-6));
  el.innerHTML=`<div class="dt-in">${days.map(d=>{ if(d==null)return '<span class="dt-c gap">…</span>'; const o=dobj(d); const g=calGame(d); const ev=calEvents(d).filter(e=>e.k==='dl'||e.k==='lg'); return `<span class="dt-c"><i>${WD[o.w]}</i><b>${o.m}/${o.d}</b>${g&&g.res?`<em class="${g.res.r==='승'?'w':g.res.r==='패'?'l':''}">${g.res.r}</em>`:ev.length?'<em class="ev">●</em>':'<em></em>'}</span>`; }).join('')}</div>`;
  el.className='on'; const cs=[...el.querySelectorAll('.dt-c')]; const step=Math.max(45,Math.min(110,700/cs.length));
  cs.forEach((c,i)=>setTimeout(()=>{ cs.forEach(x=>x.classList.remove('cur')); c.classList.add('cur','done'); },i*step));
  clearTimeout(dayTick._t); dayTick._t=setTimeout(()=>{ el.className=''; },cs.length*step+900); }
