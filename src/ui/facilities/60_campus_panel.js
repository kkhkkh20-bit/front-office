/* ---------- 훈련장 지도 정보 패널: 선수·시설을 누르면 바로 상세와 공사 버튼, 지도 범례 ----------
   지도 그림은 gfx/campus.js, 선수 배치는 33_scouting_train.js의 campData가 맡는다.
   여기서는 선택 상태(UI.cpSel = {t:'p',id} | {t:'f',k})와 패널·범례·강조 표시만 다룬다. */

/* 진행 중인 공사 전부: 시설 저장 구조를 읽는 곳은 이 함수 한 곳으로 모은다 */
function cpBuilds(){ facInit(); const bl=(G.fac&&G.fac.bld)||{}; const o={};
  for(const k of Object.keys(bl)){ const b=bl[k], D=FACI[k]; if(!b||!D)continue; const dur=D.days[b.lv]||1, left=Math.max(0,b.done-G.day);
    o[k]={lv:b.lv,done:b.done,left,pct:clamp(1-left/dur,0,1),cap:!!b.cap}; }
  return o; }

/* 선수가 지도에서 그 자리에 있는 이유: 실제 상태(real)인지 연출(stage)인지 */
function cpWhy(q,S){ const per=period(); const inSea=per==='season'||per==='post'||(per==='pre'&&!!(G.camp&&G.camp.done));
  if(q.where==='rehab')return {real:true,t:'부상으로 재활·회복 센터에서 재활 중'};
  if(q.where==='club')return {real:true,t:'1군 선수 · 피로가 쌓여 클럽하우스에서 휴식'};
  if(q.where==='main')return {real:true,t:`1군 엔트리 · 홈구장 ${S.mainNote}`};
  if(q.dev)return {real:true,t:`훈련 방향(${DEVP[q.dev]?DEVP[q.dev].l:'육성'}) · ${q.where==='lab'?'피칭·타격 랩':'실내 연습장'}에서 훈련`,note:'연수 배정은 실제, 랩과 실내 연습장 중 어디에 그리는지는 연출입니다.'};
  const place={fut:'2군 구장',indoor:'실내 연습장',weight:'웨이트·컨디셔닝',dorm:'선수 숙소·식당',lab:'피칭·타격 랩',road:'훈련장 도로'}[q.where]||'훈련장';
  return {real:false,t:`${inSea?'1군 엔트리 밖 선수':'비시즌 훈련'} · ${place}${q.where==='fut'?` (${S.futNote})`:''}`,note:'어느 시설에 있는지와 동작은 연출입니다. 머리 위 표시(부상·피로·상승세)는 실제입니다.'}; }

/* 시설과 관련된 운영 기록 한 줄: 지금 데이터로 셀 수 있는 것만 센다 */
function cpFacStat(k){ const ps=playersOf(G.user); const dev=(G.devProg||[]).length; const young=ps.filter(p=>p.age<=23).length;
  const inj30=ps.reduce((a,p)=>a+(p.injHist||[]).filter(h=>h.y===G.year&&h.d>G.day-30).length,0);
  if(k==='rehab'){ const R=ps.filter(p=>p.injOut>0); const avg=R.length?Math.round(sum(R.map(p=>p.injOut))/R.length):0; return `지금 재활 중 ${R.length}명${R.length?`(평균 ${avg}일 남음)`:''} · 최근 30일 새 부상 ${inj30}건`; }
  if(k==='weight')return `최근 30일 새 부상 ${inj30}건 · 30세 이상 선수 ${ps.filter(p=>p.age>=30).length}명`;
  if(k==='lab')return `훈련 방향 요청 ${Object.keys(G.trn||{}).length}명 · 23세 이하 선수 ${young}명`;
  if(k==='indoor')return `선수단 ${ps.length}명 · 해외 연수 ${(G.ovs||[]).length}명`;
  if(k==='fut'){ const n=ps.filter(p=>{ const f=seasonTotal(p,G.year,'퓨처스'); return f&&((f.pa||0)>0||(f.outs||0)>0); }).length; return `올해 2군 경기에 나선 선수 ${n}명`; }
  if(k==='dorm')return `23세 이하 선수 ${young}명`;
  return ''; }

function cpPips(lv,max,b){ return `<span class="fpip">${[...Array(max)].map((_,i)=>`<i class="${i+1<=lv?'on':''}${b&&i+1===b.lv?' bld':''}"></i>`).join('')}<em>${lv}/${max}</em></span>`; }
function cpBar(b){ return `<div class="cpbar"><i style="width:${Math.round(b.pct*100)}%"></i></div><div class="small">진행 <b class="num">${Math.round(b.pct*100)}%</b> · 남은 <b class="num">${b.left}일</b> · ${dmd(b.done)} 완공${b.cap?' · 모기업 투자':''}</div>`; }

/* 아무것도 고르지 않았을 때: 진행 중인 공사 전부 */
function cpIdle(S){ const L=Object.entries(S.bmap);
  return `<div class="cpph"><b>정보 패널</b></div><p class="small muted">지도에서 선수나 시설을 누르세요.</p>
    <div class="eyebrow">진행 중인 공사 ${L.length}/2</div>
    ${L.length?L.map(([k,b])=>`<button class="cpbl" data-a="cpSel" data-v="f:${k}"><span><b>${esc(FACI[k].l)}</b> → ${esc(FACI[k].lv[b.lv])}</span>${cpBar(b)}</button>`).join(''):'<p class="small muted">진행 중인 공사가 없습니다.</p>'}`; }

function cpPlayerPanel(S,id){ const p=G.players[id]; const q=S.players.find(x=>x.id===id); if(!p||!q)return cpIdle(S);
  const w=cpWhy(q,S); const fat=Math.round(p.fat||0); const c=condOf(p); const dv=(G.devProg||[]).find(x=>x.pid===id); const ov=(G.ovs||[]).find(x=>x.pid===id);
  const prog=dv?`${DEVP[dv.prog]?DEVP[dv.prog].l:'2군 연수'} · ${Math.max(0,Math.floor((G.day-dv.since)/7))}주째`:ov&&OVS[ov.prog]?`${OVS[ov.prog].l}(예정)`:'없음';
  return `<div class="cpph"><span class="cpnm">${esc(p.name)}</span><button class="cpx" data-a="cpSel" data-v="" aria-label="선택 해제">닫기</button></div>
    <div class="small muted">${posLabel(p)} · ${p.age}세 · ${p.e1?'1군':'2군'}</div>
    <div class="cptag ${w.real?'real':'stage'}">${w.real?'실제 상태를 반영한 자리':'자리·동작은 연출'}</div>
    <dl class="cpdl"><div><dt>지금</dt><dd>${esc(w.t)}</dd></div>
      <div><dt>부상</dt><dd>${p.injOut>0?`<b class="bad">${esc(injNow(p))}</b> · ${p.injOut}일 남음`:'없음'}</dd></div>
      <div><dt>피로</dt><dd><span class="cpfat"><i class="${fat>=60?'hi':''}" style="width:${clamp(fat,0,100)}%"></i></span> <b class="num ${fat>=60?'warn':''}">${fat}</b>${fat>=60?' · 쉬어야 함':''}</dd></div>
      <div><dt>컨디션</dt><dd class="num">${c>0?'+':''}${c}${c>=3?' · 상승세':c<=-3?' · 하락세':''}</dd></div>
      <div><dt>육성 프로그램</dt><dd>${esc(prog)}</dd></div></dl>
    ${w.note?`<p class="small muted">${esc(w.note)}</p>`:''}
    <div class="row" style="gap:6px"><button class="btn small primary" data-a="player" data-v="${id}">선수 정보 열기</button></div>`; }

function cpFacPanel(S,k){ const t=team(G.user);
  if(k==='main'){ const n=S.players.filter(p=>p.where==='main').length+S.players.filter(p=>p.where==='club').length;
    return `<div class="cpph"><span class="cpnm sm">${esc(S.stadName||'홈구장')}</span><button class="cpx" data-a="cpSel" data-v="">닫기</button></div>
      <p class="small">1군 엔트리 선수가 훈련하는 곳입니다. 지금: ${esc(S.mainNote)}.</p><div class="cpstat"><span>운영 기록</span>1군 ${n}명 · 그중 피로 60 이상 ${S.players.filter(p=>p.where==='club').length}명</div>
      <div class="row" style="gap:6px"><button class="btn small" data-a="cpFacGo" data-v="main">홈구장 시설 보기</button></div>`; }
  if(k==='stadfac'){ const SL=S.stLv||{}; const L2=S.lv||{};
    return `<div class="cpph"><span class="cpnm sm">구장·1군 시설</span><button class="cpx" data-a="cpSel" data-v="">닫기</button></div>
      <p class="small">홈구장 투자(관람석·식음료·프리미엄석·전광판·그라운드)는 관중·수입·홈경기 부상에 쓰이고, 웨이트·재활·랩은 훈련 단지에 있지만 1군도 함께 씁니다.</p>
      <div class="cpstat"><span>홈구장</span>${STAD_ITEMS.map(x=>`${x.l} ${SL[x.k]||0}/5`).join(' · ')}</div>
      <div class="cpstat"><span>함께 쓰는 훈련 시설</span>웨이트 ${L2.weight||0}/3 · 재활 ${L2.rehab||0}/3 · 랩 ${L2.lab||0}/3</div>
      <div class="row" style="gap:6px"><button class="btn small" data-a="cpFacGo" data-v="main">홈구장 시설 투자</button><button class="btn small" data-a="itab" data-v="cmap:farm">훈련 단지 보기</button></div>`; }
  if(k==='club'){ const C=S.players.filter(p=>p.where==='club');
    return `<div class="cpph"><span class="cpnm sm">클럽하우스</span><button class="cpx" data-a="cpSel" data-v="">닫기</button></div>
      <p class="small">시즌 중 피로가 60 이상 쌓인 1군 선수가 쉬는 곳입니다(실제 피로 수치 기준).</p>
      <div class="cpstat"><span>운영 기록</span>지금 쉬는 1군 선수 ${C.length}명</div>
      ${C.length?`<div class="cpchipl">${C.map(q=>`<button class="chip" data-a="cpSel" data-v="p:${q.id}">${esc(G.players[q.id].name)}</button>`).join('')}</div>`:''}`; }
  if(k==='bus'){ const lv=busLv(), B=BUS[lv], nx=BUS[lv+1];
    return `<div class="cpph"><span class="cpnm sm">구단 버스</span><button class="cpx" data-a="cpSel" data-v="">닫기</button></div>
      <div class="cplv">${cpPips(lv,2,null)} <span>${esc(B.l)}</span></div>
      <p class="small">원정 경기 피로 ${B.f>=0?'+':''}${Math.round(B.f*100)}%. 연 운영비 ${money(B.up)}.</p>
      ${nx?`<p class="small">다음: <b>${esc(nx.l)}</b> · ${money(nx.c)} · 원정 피로 ${nx.f>=0?'+':''}${Math.round(nx.f*100)}%</p>`:'<p class="small good">가장 좋은 버스입니다.</p>'}
      <div class="row" style="gap:6px"><button class="btn small" data-a="cpFacGo" data-v="bus">구단 버스 화면</button></div>`; }
  const D=FACI[k]; if(!D)return cpIdle(S); const lv=facOf(k), b=S.bmap[k], nx=lv+1; const nb=Object.keys(S.bmap).length; const st=cpFacStat(k);
  const act=b?`<div class="eyebrow">공사 중: ${esc(D.lv[b.lv])}</div>${cpBar(b)}`
    :lv>=3?'<p class="small good">최고 단계입니다.</p>'
    :`<dl class="cpdl"><div><dt>다음 단계</dt><dd><b>${esc(D.lv[nx])}</b></dd></div><div><dt>공사비</dt><dd class="num">${money(D.c[nx])}</dd></div><div><dt>기간</dt><dd>${D.days[nx]}일</dd></div><div><dt>유지비</dt><dd>연 ${money(D.up[nx])}</dd></div></dl>
      <div class="cpbtns"><button class="btn small primary" data-a="buildFacItem" data-v="${k}" ${nb>=2||t.cash<D.c[nx]?'disabled':''}>구단 현금으로 · ${money(D.c[nx])}</button>${t.indie?'':`<button class="btn small" data-a="capex" data-v="fac:${k}" ${nb>=2?'disabled':''}>모기업 투자 요청 · ${Math.round(capexOdds('fac',D.c[nx])*100)}%</button>`}</div>
      ${nb>=2?'<p class="small muted">동시 공사는 2곳까지입니다.</p>':t.cash<D.c[nx]?`<p class="small bad">현금 부족(보유 ${money(t.cash)})</p>`:''}`;
  return `<div class="cpph"><span class="cpnm sm">${esc(D.l)}</span><button class="cpx" data-a="cpSel" data-v="">닫기</button></div>
    <div class="cplv">${cpPips(lv,3,b)} <span>${esc(D.lv[lv])}</span></div>
    <p class="small">${esc(D.d)}</p>
    ${UI.facMsg?`<div class="note bad">${esc(UI.facMsg)}</div>`:''}
    ${act}
    ${st?`<div class="cpstat"><span>운영 기록</span>${esc(st)}</div><p class="small muted cpfn">지금 기록을 센 숫자입니다. 성장·부상 변화가 이 시설 때문이라고 단정할 수는 없습니다.</p>`:''}
    <div class="row" style="gap:6px"><button class="btn small" data-a="cpFacGo" data-v="${k}">시설 투자 화면</button></div>`; }

function cpPanelBody(S){ const s=UI.cpSel; return !s?cpIdle(S):s.t==='p'?cpPlayerPanel(S,s.id):cpFacPanel(S,s.k); }
function cpPanel(S){ return `<aside class="cppanel" id="cppanel" aria-live="polite">${cpPanelBody(S)}</aside>`; }

/* 지도 아래 범례: 어떤 위치가 실제 상태인지 */
function cpLegend(view){ const mk=(c,t)=>`<i class="cpmk ${c}">${t}</i>`;
  return `<div class="cpleg"><div class="cplh">지도 읽는 법</div><ul>
    <li><span class="cptag real">실제</span>${view==='farm'?'재활·회복 센터 = 지금 부상 중인 선수 · '+mk('dev','')+' 표시 = 해외 연수 신청 선수':'홈구장 = 1군 엔트리 · 클럽하우스 = 1군 중 피로 60 이상'}</li>
    <li><span class="cptag real">실제</span>머리 위 표시: ${mk('inj','+')} 부상 ${mk('tir','z')} 피로 60 이상 ${mk('hot','')} 상승세 · 공사 막대 = 진행률과 남은 일수</li>
    <li><span class="cptag stage">연출</span>${view==='farm'?'그 밖의 선수가 2군 구장·웨이트장·실내 연습장·숙소 중 어디에 있는지, 수비 위치와 동작':'누가 던지고 치는지, 수비 위치, 외야를 뛰는 투수, 벤치 자리'}</li></ul></div>`; }

/* 선택 강조: 고른 선수 이름을 화면 기준 15px 정도로 키우고 맨 앞으로, 고른 시설은 테두리 */
function cpMark(){ const svg=document.querySelector('#campst svg.campus'); if(!svg)return;
  svg.querySelectorAll('.cpp.sel').forEach(el=>{ el.classList.remove('sel'); const n=el.querySelector('.cpn'); if(n){ n.style.fontSize=''; n.style.strokeWidth=''; if(n.dataset.y0)n.setAttribute('y',n.dataset.y0); } const r=el.querySelector('.cpring'); if(r)r.remove(); });
  svg.querySelectorAll('.plot.sel').forEach(el=>el.classList.remove('sel'));
  const s=UI.cpSel; if(!s)return;
  if(s.t==='f'){ const g=svg.querySelector(`.plot[data-k="${s.k}"]`); if(g)g.classList.add('sel'); return; }
  const el=svg.querySelector(`.cpp[data-pid="${s.id}"]`); if(!el)return;
  const vb=svg.viewBox.baseVal; const sc=(svg.clientWidth||svg.getBoundingClientRect().width||1000)/(vb&&vb.width||1000);
  const fs=clamp(15/sc,10,44); const n=el.querySelector('.cpn');
  if(n){ n.dataset.y0=n.dataset.y0||n.getAttribute('y'); n.style.fontSize=fs.toFixed(1)+'px'; n.style.strokeWidth=(3.5/sc).toFixed(1)+'px'; n.setAttribute('y',(10+fs*.95).toFixed(1)); }
  el.insertAdjacentHTML('afterbegin',`<circle class="cpring" r="${clamp(9/sc,12,26).toFixed(1)}" stroke-width="${(2.2/sc).toFixed(1)}"/>`);
  el.classList.add('sel'); svg.appendChild(el); }

/* 확대한 상태에서는 손가락이 조금 빗나가도 가장 가까운 선수를 고른다(화면 22px 안) */
function cpNear(svg,e){ let best=null, bd=22*22;
  svg.querySelectorAll('.cpp').forEach(el=>{ const g=el.querySelector('g')||el; const r=g.getBoundingClientRect(); const dx=r.left+r.width/2-e.clientX, dy=r.top+r.height/2-e.clientY, d=dx*dx+dy*dy; if(d<bd){ bd=d; best=el; } });
  return best; }

/* 패널만 다시 그린다(지도 애니메이션은 그대로) */
function cpPick(sel){ UI.cpSel=sel; UI.facMsg=null; const el=document.getElementById('cppanel'); if(!el){ render(); return; }
  el.innerHTML=cpPanelBody(campData()); cpMark();
  try{ const r=el.getBoundingClientRect(); if(r.top>window.innerHeight-120||r.bottom<0)el.scrollIntoView({block:'nearest',behavior:'smooth'}); }catch(e){} }

Object.assign(A,{
  cpSel(v){ v=String(v||''); if(!v)return cpPick(null); const [t,x]=v.split(':'); cpPick(t==='p'?{t:'p',id:+x}:{t:'f',k:x}); },
  cpFacGo(v){ if(v==='main')return A.go('club:stad'); if(v==='bus')return A.go('club:bus'); UI.facFocus=v; A.go('train:fac'); }
});
