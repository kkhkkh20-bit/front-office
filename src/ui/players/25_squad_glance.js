/* ---------- 선수단 한눈에: 1군·2군 라인업, 성장 표시 ---------- */
const GPOS=['C','SS','2B','CF','3B','RF','LF','1B','DH'];
function futLineup(list){ const used=new Set(), ln={}; for(const k of GPOS){ const free=list.filter(p=>!used.has(p.id)); const ok=k==='DH'?free:free.filter(p=>p.pos===k||(subsOf(p)||[]).includes(k)); const c=(ok.length?ok:free).sort((a,b)=>posScore(b,k)-posScore(a,k))[0]; if(c){ ln[k]=c; used.add(c.id); } } return ln; }
function growDelta(p){ const g=G.ovr0&&G.ovr0.y===G.year?G.ovr0.m[p.id]:null; return g==null?null:ovr(p)-g; }
/* 우리 팀에 어떻게 왔나: 쌓아 온 과정이 보이게 */
function originOf(p){ if(!p||p.team!==G.user)return ''; if(p.foreign)return '외국인'; const nm=tname(G.user);
  const S=(p.story||[]).slice().reverse().find(x=>x.t&&x.t.includes(nm)&&(x.k==='move'||x.k==='draft'));
  if(S){ const m=S.t.match(/(\d+)라운드/); if(S.t.includes('창단 드래프트'))return `창단 ${m?m[1]:''}R`; if(S.t.includes('신인 드래프트'))return `${String(S.y).slice(2)}신인 ${m?m[1]:''}R`; if(S.t.includes('트레이드'))return `${String(S.y).slice(2)} 트레이드`; if(S.t.includes('FA'))return `${String(S.y).slice(2)} FA`; }
  if(p.draft&&p.draft.tid===G.user)return `${String(p.draft.y).slice(2)}신인 ${p.draft.rd}R`;
  if(G.fd&&(G.fd.all||[]).includes(p.id))return '창단 배분'; return '자체 영입'; }
/* 앞으로 몇 년의 예상 능력: 어리면 잠재 쪽으로, 31세부터 하락 */
/* 선수별 장기 연봉표(OOTP식): 선수와 시즌을 교차해 확정액·협상 예상·FA·미계약을 구분한다. 복무 중 시즌은 지급하지 않는 게임 규칙을 따른다 */
function cgCell(p,k,Y){ const y=Y+k; const m=p.mil; const srv=m&&m.until&&dobj(m.from).y<=y&&dobj(m.until).y>=y; const due=!p.foreign&&milFree(p)&&G.year+Math.max(0,27-p.age)===y;
  const tag=srv?' <i class="cg-m">복무</i>':due?' <i class="cg-m">입대 기한</i>':''; const fr=s=>s<3?.35:s<6?.55:s<faSvc(p)?.78:1;
  if(p.foreign)return k===0?{t:'fix',v:p.sal,h:`${money(p.sal)}`}:{t:'neg',v:0,h:'재계약 협상'};
  if(p.extNext){ if(k===0)return {t:'fix',v:Math.round(p.sal*payFrac(p,y)),h:`${money(p.sal)}${tag}`}; if(k<=p.extNext.years)return {t:'fix',v:Math.round(p.extNext.annual*payFrac(p,y)),h:`${money(p.extNext.annual)}${tag}`}; return k===p.extNext.years+1?{t:'fa',v:0,h:'FA'}:{t:'none',v:0,h:'미계약'}; }
  if(p.faC){ const n=Math.max(1,p.yrs||1); if(k<n)return {t:'fix',v:Math.round(p.sal*payFrac(p,y)),h:`${money(p.sal)}${tag}`}; return k===n?{t:'fa',v:0,h:'FA'}:{t:'none',v:0,h:'미계약'}; }
  const cy=ctrlYears(p); if(k===0)return {t:'fix',v:Math.round(p.sal*payFrac(p,y)),h:`${money(p.sal)}${tag}`};
  if(k<cy){ const e=round5(marketSal(projPlan(p,k))*Math.min(1,fr((p.svc||0)+k))); const v=Math.max(MIN_SAL,e); return {t:'est',v:Math.round(v*payFrac(p,y)),h:`~${money(v)}${tag}`}; }
  return k===cy?{t:'fa',v:0,h:`FA 예상${tag}`}:{t:'none',v:0,h:'미계약'}; }
function contractGrid(){ const Y=sponSeason(); const K=[0,1,2,3]; const ps=Object.values(G.players).filter(p=>p.team===G.user&&!(p.joinY>Y));
  const R=ps.map(p=>({p,c:K.map(k=>cgCell(p,k,Y))})); const exp=x=>{ const i=x.c.findIndex(c=>c.t==='fa'||c.t==='none'||c.t==='neg'); return i<0?9:i; };
  const so=UI.cgS||'exp'; R.sort((a,b)=>so==='sal'?b.p.sal-a.p.sal:so==='name'?a.p.name.localeCompare(b.p.name):(exp(a)-exp(b))||(b.p.sal-a.p.sal));
  const L={fix:'확정',est:'협상 예상',fa:'',none:'',neg:''};
  const fix=K.map(k=>sum(R.map(x=>x.c[k].t==='fix'?x.c[k].v:0))), est=K.map(k=>sum(R.map(x=>x.c[k].t==='est'?x.c[k].v:0)));
  const th=(k,l)=>`<th><button class="lnk" data-a="cgSort" data-v="${k}">${l}${so===k?' ▾':''}</button></th>`;
  return `<div class="row between"><span class="small muted">눌러서 정렬 · 선수를 누르면 계약 상세</span><span class="small"><span class="cg-k fix">확정</span> <span class="cg-k est">협상 예상</span> <span class="cg-k fa">FA</span></span></div>
  <div class="tw cg-w"><table class="cg"><thead><tr>${th('name','선수')}${th('exp','계약 만료')}${K.map(k=>`<th>${Y+k}${k===0?'':''}</th>`).join('')}</tr></thead>
  <tfoot><tr><th>확정 합계</th><td></td>${fix.map(v=>`<td class="num">${money(v)}</td>`).join('')}</tr><tr><th>협상 예상 포함</th><td></td>${K.map(k=>`<td class="num">${money(fix[k]+est[k])}</td>`).join('')}</tr><tr><th>샐러리캡</th><td></td>${K.map(k=>`<td class="num">${money(capOf(Y+k))}</td>`).join('')}</tr></tfoot>
  <tbody>${R.map(x=>`<tr class="click" data-a="player" data-v="${x.p.id}"><th><span class="pn">${esc(x.p.name)}</span> <i class="f">${esc(posLabel(x.p))} · ${x.p.age}세${x.p.foreign?' · 외국인':''}</i></th><td class="small">${(()=>{ const i=exp(x); return i>=9?`${Y+3} 이후`:`${Y+i-1}년까지`; })()}</td>${x.c.map(c=>`<td class="cg-c ${c.t}" title="${L[c.t]||''}">${c.h}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="small muted keep">확정은 이미 정해진 연봉(다년·FA 계약, 올해 연봉), 협상 예상(~)은 보류권 선수의 연봉 협상 추정(코치진 예상 능력 기준)입니다. FA 뒤는 0원이 아니라 미계약입니다. 복무 중인 시즌은 연봉이 예산·상한에서 빠지는 게임 규칙대로 합계에서 뺍니다. 외국인은 1년 계약이라 내년부터 재계약 협상입니다.</p>`; }
function projPlan(p,k){ let o=ovr(p), a=p.age; const pot=Math.max(scoutReport(p).ofp??o,o); /* 진짜 잠재력이 아니라 스카우트 추정으로 내다본다 */ for(let i=0;i<k;i++){ a++; o+=a<=24?(pot-o)*.3:a<=27?(pot-o)*.22:a<=30?0:a<=33?-1.5:-3; } return o; }
/* 선수단 계획(모바일 plannerCard·PC planFM 공용). KBO 병역: 만 28세가 되는 해까지 입대(게임 규칙), 복무 1년 6개월.
   그해 7월(시즌 한가운데)에 복무 중이면 그 시즌 계획에서 뺀다. 아직 입대 일정이 없는 미필 선수는 기한 다음 해를 복무로 본다 */
const planDueY=p=>milFree(p)?G.year+Math.max(0,27-p.age):null;
function milOut(p,y){ const m=p.mil; if(m&&m.until){ const pre=o=>o.y<y||(o.y===y&&o.m<7); return pre(dobj(m.from))&&!pre(dobj(m.until)); } const d=planDueY(p); return d!=null&&y===d+1; }
function planCol(k){ const Y=G.year, EX=new Set(G.plEx&&G.plEx.y===Y?G.plEx.ids:[]); const av=Object.values(G.players).filter(p=>p.team===G.user&&!(p.joinY>Y+k)&&(k===0||!EX.has(p.id))&&!milOut(p,Y+k));
    const leave=p=>p.foreign?(k>=1?'재계약':''):k>=ctrlYears(p)?'FA':planDueY(p)===Y+k?'입대 기한':''; const v=p=>projPlan(p,k);
    const bats=av.filter(p=>!p.isP), pits=av.filter(p=>p.isP); const used=new Set(), ln={}, bk={};
    for(const pos of ['C','SS','2B','CF','3B','RF','LF','1B']){ const el=bats.filter(p=>!used.has(p.id)&&(p.pos===pos||(subsOf(p)||[]).includes(pos))).sort((a,b)=>(v(b)-(b.pos===pos?0:2))-(v(a)-(a.pos===pos?0:2))); if(el[0]){ ln[pos]=el[0]; used.add(el[0].id); } }
    { const r=bats.filter(p=>!used.has(p.id)).sort((a,b)=>v(b)-v(a)); if(r[0]){ ln.DH=r[0]; used.add(r[0].id); } }
    for(const pos of ['C','1B','2B','3B','SS','LF','CF','RF']){ const el=bats.filter(p=>!used.has(p.id)&&(p.pos===pos||(subsOf(p)||[]).includes(pos))).sort((a,b)=>v(b)-v(a)); if(el[0])bk[pos]=el[0]; }
    const sp=[...pits].sort((a,b)=>(v(b)+roleBias(G.user,b))-(v(a)+roleBias(G.user,a))).slice(0,5); const rp=pits.filter(p=>!sp.includes(p)).sort((a,b)=>v(b)-v(a)).slice(0,7);
    return {ln,bk,sp,rp,v,leave,bats,pits}; }
/* 연봉 전망: 확정(남은 다년·FA 계약)과 예상(보류권 선수 연봉 협상)을 나눈다 */
function planPay(k){ const Y=G.year, EX=new Set(G.plEx&&G.plEx.y===Y?G.plEx.ids:[]), ps=Object.values(G.players).filter(p=>p.team===G.user); const fr=p=>p.svc<3?.35:p.svc<6?.55:p.svc<faSvc(p)?.78:1; const D=ps.filter(p=>!p.foreign&&!p.prospect&&!(p.joinY>Y+k)&&!(k>0&&EX.has(p.id))); let fix=0,est=0,fa=0,faN=0;
    for(const p of D){ if(k===0){ fix+=p.sal; continue; } const cy=ctrlYears(p); if(p.faC&&p.yrs>k){ fix+=p.sal; continue; } if(!p.faC&&cy>k){ est+=round5(marketSal(projPlan(p,k))*Math.min(1,fr({svc:(p.svc||0)+k,college:p.college}))); continue; } if(projPlan(p,k)>=50){ fa+=round5(marketSal(projPlan(p,k))); faN++; } }
    return {fix,est,fa,faN,cap:capOf(Y+k)}; }
/* 내년 예상은 젊은 선수일수록 범위로 보여 준다(코치진 추정) */
function planRng(p,k){ const Y=G.year, v=projPlan(p,k); if(k===0||p.age+k>27)return rchip(Math.round(v)); const w=clamp((28-p.age-k)*.8,1.5,5); const m=v+hn('plr'+Y,p.id)*w*.4; return `<span class="pl-r" style="--c:${rcol(Math.round(m))}">${dv(m-w)}~${dv(m+w)}</span>`; }
function plannerCard(){ const Y=G.year; const ps=Object.values(G.players).filter(p=>p.team===G.user);
  if(!G.plEx||G.plEx.y!==Y)G.plEx={y:Y,ids:[]}; const EX=new Set(G.plEx.ids);
  const col=planCol;
  const C=[0,1].map(col);
  const cls=o=>o==null?'gap':o<45?'weak':o<52?'mid':o>=60?'top':'ok';
  const rng=planRng;
  const nm=(c,p,k)=>{ const lv=c.leave(p); return `<span class="pl-pw"><button class="pl-p" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b>${rng(p,k||0)}${lv?`<em class="pl-f">${lv}</em>`:''}${p.joinY>Y?'<em class="pl-n">신인</em>':''}</button>${k?`<button class="pl-x" data-a="plEx" data-v="${p.id}" title="내년 계획에서 빼기" aria-label="${esc(p.name)} 내년 계획에서 빼기">×</button>`:''}</span>`; };
  const cell=(c,k,ci)=>{ if(k==='SP'||k==='RP'){ const L=k==='SP'?c.sp:c.rp; if(!L.length)return `<td class="gap"><span class="pl-g">빈자리</span></td>`; const a=L.reduce((t,p)=>t+c.v(p),0)/L.length; return `<td class="${cls(a)}">${nm(c,L[0],ci)}<i class="pl-s">${L.length}명 평균 ${Math.round(a)}${L.length<(k==='SP'?5:6)?' · 부족':''}</i></td>`; }
    const p=c.ln[k], b=c.bk[k]; if(!p)return `<td class="gap"><span class="pl-g">빈자리</span></td>`; return `<td class="${cls(c.v(p))}">${nm(c,p,ci)}${b?`<i class="pl-s">백업 ${esc(b.name)} ${Math.round(c.v(b))}</i>`:''}</td>`; };
  const rows=PSLOTS.map(k=>`<tr><th>${SLOTS_S[k]}</th>${C.map((c,ci)=>cell(c,k,ci)).join('')}</tr>`).join('');
  /* 내년 빈자리 요약 */
  const nx=C[1]; const holes=PSLOTS.filter(k=>{ if(k==='SP'||k==='RP'){ const L=k==='SP'?nx.sp:nx.rp; return L.length<(k==='SP'?5:6)||L.reduce((t,p)=>t+nx.v(p),0)/Math.max(1,L.length)<46; } const p=nx.ln[k]; return !p||nx.v(p)<45||nx.leave(p); }).map(k=>{ const p=nx.ln[k]; return `${SLOTS_S[k]}${p&&nx.leave(p)?`(${({FA:'FA 예정','재계약':'외국인 재계약'})[nx.leave(p)]||nx.leave(p)})`:''}`; });
  /* 2년 뒤 위험: 노화·계약 만료·고액 장기 부담, 그리고 내부 후계 후보 */
  const succ=k=>{ const L=ps.filter(p=>!p.foreign&&p.age<=24&&projPlan(p,2)>=45&&!EX.has(p.id)&&(k==='SP'?p.isP&&isSPr(p):k==='RP'?p.isP:!p.isP&&(p.pos===k||(subsOf(p)||[]).includes(k)))).filter(p=>!(nx.ln[k]&&nx.ln[k].id===p.id)).sort((a,b)=>projPlan(b,2)-projPlan(a,2)); return L[0]||null; };
  const risk=[]; for(const k of PSLOTS){ if(k==='DH')continue; const p=k==='SP'?nx.sp[0]:k==='RP'?nx.rp[0]:nx.ln[k]; if(!p)continue; const r=[];
    if(p.age+2>=33)r.push(`${p.age+2}세가 됨`); if(!p.foreign&&ctrlYears(p)===2)r.push('2년 뒤 FA'); if(p.sal>=1500&&p.age>=31&&(p.faC&&p.yrs>=3))r.push(`연 ${money(p.sal)} 계약이 남음`);
    if(!r.length)continue; const s2=succ(k); risk.push(`<li><b>${SLOTS_S[k]}</b> ${esc(p.name)}: ${r.join(' · ')} → ${s2?`후계 후보 ${esc(s2.name)}(${s2.age}세, 2년 뒤 ${rng(s2,2)})`:'<span class="bad">내부 후계자 없음</span>'}</li>`); }
  /* 연봉 전망: 확정(남은 다년·FA 계약)과 예상(보류권 선수 연봉 협상)을 나눈다 */
  const PY=[0,1,2].map(planPay);
  const payT=`<div class="tw"><table class="pl-pay"><thead><tr><th></th>${PY.map((_,k)=>`<th>${Y+k}</th>`).join('')}</tr></thead><tbody>
    <tr><th>확정 연봉</th>${PY.map(x=>`<td>${money(x.fix)}</td>`).join('')}</tr>
    <tr><th>예상(연봉 협상)</th>${PY.map((x,k)=>`<td>${k?money(x.est):'-'}</td>`).join('')}</tr>
    <tr><th>FA 재계약 시</th>${PY.map((x,k)=>`<td>${k&&x.faN?`${money(x.fa)} <i class="muted">(${x.faN}명)</i>`:'-'}</td>`).join('')}</tr>
    <tr><th>샐러리캡</th>${PY.map(x=>`<td>${money(x.cap)}</td>`).join('')}</tr>
    <tr><th>예상 합계 · 캡 여유</th>${PY.map((x,k)=>{ const t=x.fix+(k?x.est:0); const r=x.cap-t; return `<td>${money(t)} · <b class="${r<0?'bad':''}">${r>=0?'여유 ':'초과 '}${money(Math.abs(r))}</b></td>`; }).join('')}</tr></tbody></table></div><p class="small muted">예상 합계 = 확정 + 연봉 협상 예상(FA 재계약은 뺌). 캡 산입 예외(신인 등)는 반영하지 않은 대략값입니다.</p>`;
  const exL=G.plEx.ids.map(id=>G.players[id]).filter(Boolean);
  /* 세대 구성 */
  const dom=ps.filter(p=>!p.foreign&&!(p.joinY>Y)); const st=[['성장기','~23세',p=>p.age<=23],['도약기','24~26세',p=>p.age>=24&&p.age<=26],['전성기','27~31세',p=>p.age>=27&&p.age<=31],['노장','32세~',p=>p.age>=32]];
  const gen=st.map(([l,a,f])=>{ const L=dom.filter(f); const g=L.filter(p=>ovr(p)>=52).length; return `<div class="gen-c"><b>${l}</b><i>${a}</i><span>${L.length}명</span><em>1군급 ${g}</em></div>`; }).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">선수단 계획</h2><span class="small muted">프런트 예상 배치(감독 실제 기용과 다를 수 있음) · 숫자는 그해 예상 능력</span></div>
    <div class="tw"><table class="pl-t"><thead><tr><th></th>${[0,1].map(k=>`<th>${Y+k} ${k===0?'(올해)':'(내년)'}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small ${holes.length?'':'good'} keep">${holes.length?`내년 보강이 필요한 자리: <b>${holes.join(' · ')}</b>`:'내년까지 모든 자리가 채워져 있습니다.'}</p>
    ${exL.length?`<p class="small keep">내년 계획에서 뺀 선수: ${exL.map(p=>esc(p.name)).join(', ')} <button class="tc-i" data-a="plExClear">되돌리기</button></p>`:''}
    <p class="small muted keep">FA는 계약이 끝나 그해 떠날 수 있는 선수, 재계약은 1년 계약 외국인입니다. 젊은 선수의 내년 값은 코치진 추정 범위입니다. 내년 칸의 ×로 계획에서 빼면 빈자리와 연봉 전망이 다시 계산됩니다. 실제 기용이나 선수 기분에는 영향이 없습니다.</p>
    ${risk.length?`<div class="eyebrow" style="margin-top:6px">2년 뒤 위험</div><ul class="pl-risk">${risk.slice(0,6).join('')}</ul>`:''}
    <div class="eyebrow" style="margin-top:6px">국내 선수 연봉 전망</div>${payT}<details class="cg-d" data-k="cgrid"${UI.open&&UI.open.cgrid?' open':''}><summary class="small"><b>선수별 장기 연봉표</b> · 합계가 왜 바뀌는지 선수·시즌별로</summary>${UI.open&&UI.open.cgrid?contractGrid():'<p class="small muted">펼치면 계산합니다.</p>'}</details><p class="small muted keep">확정은 남은 다년·FA 계약, 예상은 보류권 선수의 연봉 협상 추정, FA 재계약 시는 계약이 끝나는 주축(예상 능력 62 이상)을 시장가로 잡을 때입니다.</p>
    <div class="eyebrow" style="margin-top:6px">세대 구성 (국내 선수)</div><div class="gen">${gen}</div></section>`; }
/* PC 선수단 계획(FM '선수단 계획표'처럼): 왼쪽 포지션 배치도(고른 시즌), 가운데 포지션 × 3시즌 주전·백업 칸, 오른쪽 고른 포지션 후보 명단,
   아래 보강 경고 · 유망주 · 계약 만료·병역 · 연봉 전망. 계산은 휴대폰 plannerCard와 같은 planCol·planPay */
/* 병역 한 줄: 표 칸에 맞춘 짧은 말(자세한 문장은 title) */
function milShort(p){ const m=p.mil; if(p.foreign)return '-'; if(!m||m.app)return m&&m.app?'상무 지원 중':`미필 · ${planDueY(p)} 기한`; if(m.exempt)return '면제'; if(m.done)return '군필'; if(m.until)return m.from<=G.day?`복무 · ${dobj(m.until).y} 전역`:`${dobj(m.from).y} 입대 예정`; return '미필'; }
function planFM(){ const Y=G.year; if(!G.plEx||G.plEx.y!==Y)G.plEx={y:Y,ids:[]};
  const C=[0,1,2].map(planCol), sk=[0,1,2].includes(UI.planK)?UI.planK:0, pos=PSLOTS.includes(UI.planPos)?UI.planPos:'C', c=C[sk], YL=['올해','내년','내후년'];
  const mine=Object.values(G.players).filter(p=>p.team===G.user);
  const grp=(c,k)=>k==='SP'?c.sp:k==='RP'?c.rp:[c.ln[k],c.bk[k]].filter(Boolean);
  const val=(c,k)=>{ if(k==='SP'||k==='RP'){ const L=grp(c,k); return L.length?L.reduce((t,p)=>t+c.v(p),0)/L.length:null; } return c.ln[k]?c.v(c.ln[k]):null; };
  const LVT={FA:'FA 예정','재계약':'외국인 재계약','입대 기한':'입대 기한'};
  const warn=(c,k)=>{ const W=[]; if(k==='SP'||k==='RP'){ const L=grp(c,k), need=k==='SP'?5:6; if(L.length<need)W.push(['bad',`${need-L.length}명 부족`]); else if(val(c,k)<46)W.push(['warn','평균 약함']); const n=L.filter(p=>c.leave(p)).length; if(n)W.push(['warn',`${n}명 이탈 가능`]); return W; }
    const p=c.ln[k]; if(!p)return [['bad','빈자리']]; if(c.leave(p))W.push([c.leave(p)==='재계약'?'warn':'bad',LVT[c.leave(p)]]); if(c.v(p)<45)W.push(['warn','주전 약함']); return W; };
  const wcls=W=>W.some(w=>w[0]==='bad')?'bad':W.length?'warn':'';
  const wtag=W=>W.map(([t,l])=>`<em class="spn-t ${t}">${l}</em>`).join('');
  const pro=p=>{ if(p.foreign||p.age>24)return ''; const T=potTierP(scoutReport(p),p); return T&&!T.done&&T.n>=4?`<em class="spn-t pro" title="${esc(T.l)}">유망</em>`:''; };
  const tag=(c,p)=>{ const l=c.leave(p); return (l?`<em class="spn-t ${l==='재계약'?'warn':'bad'}">${l==='입대 기한'?'입대':l}</em>`:'')+(p.joinY>Y?'<em class="spn-t new">신인</em>':'')+pro(p); };
  /* 왼쪽: 배치도 */
  const XY={CF:[50,12],LF:[18,25],RF:[82,25],SS:[34,43],'2B':[66,43],'3B':[18,61],'1B':[82,61],SP:[50,61],C:[50,84],RP:[16,85],DH:[84,85]};
  const node=k=>{ const v=val(c,k), W=warn(c,k), p=k==='SP'?c.sp[0]:k==='RP'?c.rp[0]:c.ln[k];
    return `<button class="spn-n ${wcls(W)}${k===pos?' on':''}" style="left:${XY[k][0]}%;top:${XY[k][1]}%" data-a="planPick" data-v="${sk}:${k}" title="${esc(SLOTS_S[k]+(W.length?' · '+W.map(w=>w[1]).join(' · '):''))}"><span style="--c:${v==null?'var(--muted)':rcol(Math.round(v))}"><b>${SLOTS_S[k]}</b>${v==null?'-':dv(v)}</span><i>${p?esc(p.name):'빈자리'}</i>${W.length?'<u>!</u>':''}</button>`; };
  const fv=GPOS.map(k=>val(c,k)).filter(v=>v!=null), nW=PSLOTS.filter(k=>warn(c,k).length).length;
  const dom=mine.filter(p=>!p.foreign&&!(p.joinY>Y)), gst=[['성장기','~23세',p=>p.age<=23],['도약기','24~26세',p=>p.age>=24&&p.age<=26],['전성기','27~31세',p=>p.age>=27&&p.age<=31],['노장','32세~',p=>p.age>=32]];
  const fld=`<section class="card spn-fld"><h3>포지션 배치 <em>${Y+sk} ${YL[sk]}</em></h3><div class="seg spn-yr">${[0,1,2].map(k=>`<button data-a="planPick" data-v="${k}:" class="${k===sk?'on':''}">${Y+k} ${YL[k]}</button>`).join('')}</div>
    <div class="spn-sum"><span>야수 평균 예상 <b>${fv.length?dv(avg(fv)):'-'}</b></span><span>선발 평균 <b>${val(c,'SP')==null?'-':dv(val(c,'SP'))}</b></span><span class="${nW?'warn':'good'}">점검할 자리 <b>${nW}</b></span></div>
    <div class="spn-dia"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 97 L3 50 Q50 -4 97 50 Z" class="of"/><path d="M50 90 L27 66 L50 42 L73 66 Z" class="inf"/></svg>${PSLOTS.map(node).join('')}</div>
    <div class="spn-gen">${gst.map(([l,a,f])=>{ const L=dom.filter(f); return `<div><b>${l}</b><i>${a}</i><span>${L.length}명</span><em>1군급 ${L.filter(p=>ovr(p)>=52).length}</em></div>`; }).join('')}</div>
    <p class="spn-leg">숫자는 그해 예상 능력(코치진 추정). 자리를 누르면 오른쪽에 후보가 나옵니다. 국내 선수 세대 구성은 지금 나이 기준입니다.</p></section>`;
  /* 가운데: 포지션 × 3시즌 */
  const cell=(k,y)=>{ const cc=C[y], W=warn(cc,k); let h;
    if(k==='SP'||k==='RP'){ const L=grp(cc,k); h=L.length?`<span class="spn-p"><b>${esc(L[0].name)}</b>${rchip(Math.round(cc.v(L[0])))}${tag(cc,L[0])}</span><i>${k==='SP'?'1선발':'불펜 1순위'} · ${L.length}명 평균 ${dv(val(cc,k))}${W.length?' · '+W.map(w=>w[1]).join(' · '):''}</i>`:'<span class="spn-p"><b class="bad">빈자리</b></span><i>투수 없음</i>'; }
    else { const p=cc.ln[k], b=cc.bk[k]; h=p?`<span class="spn-p"><b>${esc(p.name)}</b>${planRng(p,y)}${tag(cc,p)}</span><i>${b?`백업 ${esc(b.name)} ${dv(cc.v(b))}`:k==='DH'?'지명 타자':'백업 없음'}</i>`:'<span class="spn-p"><b class="bad">빈자리</b></span><i>이 자리를 볼 선수 없음</i>'; }
    return `<td class="${y===sk?'sel ':''}${wcls(W)}"><button class="spn-c" data-a="planPick" data-v="${y}:${k}">${h}</button></td>`; };
  const grid=`<section class="card spn-g"><h3>3년 계획 <em>포지션별 주전 · 백업</em><span class="spn-lg"><em class="spn-t bad">FA·입대</em><em class="spn-t warn">재계약</em><em class="spn-t pro">유망</em><em class="spn-t new">신인</em></span></h3>
    <div class="sf-tw"><table class="spn-tb"><thead><tr><th></th>${[0,1,2].map(y=>`<th class="${y===sk?'sel':''}">${Y+y} <i>${YL[y]}</i></th>`).join('')}</tr></thead><tbody>${PSLOTS.map(k=>`<tr class="${k===pos?'on':''}"><th><button data-a="planPick" data-v="${sk}:${k}">${SLOTS_S[k]}</button></th>${[0,1,2].map(y=>cell(k,y)).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  /* 오른쪽: 고른 포지션 후보 */
  const posOf={}; for(const k in c.ln)posOf[c.ln[k].id]=k; let R=[];
  if(pos==='SP'){ R=c.sp.map((p,i)=>[p,`${i+1}선발`,1]); R.push(...c.pits.filter(p=>!c.sp.includes(p)).sort((a,b)=>c.v(b)-c.v(a)).slice(0,6).map(p=>[p,c.rp.includes(p)?'불펜':'후보',0])); }
  else if(pos==='RP'){ R=c.rp.map((p,i)=>[p,`불펜 ${i+1}`,1]); R.push(...c.pits.filter(p=>!c.rp.includes(p)&&!c.sp.includes(p)).sort((a,b)=>c.v(b)-c.v(a)).slice(0,6).map(p=>[p,'후보',0])); }
  else { const can=p=>pos==='DH'||p.pos===pos||(subsOf(p)||[]).includes(pos), st=c.ln[pos], b=c.bk[pos]; if(st)R.push([st,'주전',1]); if(b)R.push([b,'백업',1]);
    R.push(...c.bats.filter(p=>p!==st&&p!==b&&can(p)).sort((x,z)=>(c.v(z)-(z.pos===pos?0:2))-(c.v(x)-(x.pos===pos?0:2))).slice(0,8).map(p=>[p,posOf[p.id]?`${SLOTS_S[posOf[p.id]]} 주전`:'후보',0])); }
  const W0=warn(c,pos), exL=G.plEx.ids.map(id=>G.players[id]).filter(Boolean);
  const row=([p,r,on])=>{ const T=potTierP(scoutReport(p),p);
    return `<tr class="${on?'':'sub'}"><td><span class="spn-role${on?' on':''}">${r}</span></td><td><div class="md-p">${avImg(p)}<div><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><span>${esc(posLabel(p))} · ${p.age+sk}세${p.foreign?' · 외국인':''}</span></div></div></td>
      <td>${planRng(p,sk)} ${tag(c,p)}</td><td>${T?esc(T.s):'-'}</td><td title="${esc(ctText(p))}">${money(p.sal)} · ${p.foreign?`${Y} 뒤 재계약`:`${Y+ctrlYears(p)-1} 뒤 FA`}</td><td title="${esc(milText(p))}">${milShort(p)}</td>
      <td>${sk?`<button class="pl-x" data-a="plEx" data-v="${p.id}" title="${Y+1}년 이후 계획에서 빼기" aria-label="${esc(p.name)} 계획에서 빼기">×</button>`:''}</td></tr>`; };
  /* 리그 비교: 포지션 진단(posDiag)과 같은 기준, 지금 주전 능력으로 10개 구단 순위 */
  const LD=G.teams.map(t=>depth(t.id)), lgv=(d,k)=>k==='SP'?avg(d.sp.slice(0,5).map(spV)):k==='RP'?avg(d.pen.slice(0,5).map(penV)):d.ln[k]?posScore(d.ln[k],k):0;
  const lg=sfChart('지금 주전 전력 · 리그 10개 구단',PSLOTS.map(k=>({l:SLOTS_S[k]+(k===pos?' ◀':''),v:lgv(LD[G.teams.findIndex(t=>t.id===G.user)],k),all:LD.map(d=>lgv(d,k))})),0,0,v=>dv(v));
  const det=`<section class="card spn-pos"><h3 title="프런트 예상 배치입니다. 감독의 실제 기용과 다를 수 있습니다.${sk?' ×로 내년 이후 계획에서 빼면 빈자리와 연봉 전망이 다시 계산됩니다(실제 기용·기분에는 영향 없음).':''}">${SLOTS_S[pos]} 후보 <em>${Y+sk} ${YL[sk]}</em>${wtag(W0)}</h3>
    <div class="sf-tw"><table class="sf-t spn-dt"><thead><tr><th>역할</th><th>선수</th><th>그해 예상</th><th>잠재력</th><th>연봉 · FA</th><th>병역</th><th></th></tr></thead><tbody>${R.length?R.map(row).join(''):'<tr><td colspan="7" class="muted">이 자리를 볼 선수가 없습니다.</td></tr>'}</tbody></table></div>
    ${exL.length?`<p class="spn-leg">${Y+1}년 이후 계획에서 뺀 선수: ${exL.map(p=>esc(p.name)).join(', ')} <button class="tc-i" data-a="plExClear">되돌리기</button></p>`:''}${lg}</section>`;
  /* 아래: 보강 경고 · 유망주 · 계약 만료·병역 · 연봉 전망 */
  const holes=[0,1,2].flatMap(y=>PSLOTS.map(k=>[y,k,warn(C[y],k)]).filter(x=>x[2].length));
  const b1=`<section class="card"><h3>보강이 필요한 자리 <em>${Y}~${Y+2}</em></h3><div class="sf-tw">${holes.length?holes.map(([y,k,W])=>{ const cc=C[y], p=k==='SP'||k==='RP'?null:cc.ln[k]; return `<div class="spn-w"><b>${Y+y}</b><button class="lnk" data-a="planPick" data-v="${y}:${k}">${SLOTS_S[k]}</button><span>${p?esc(p.name):''}</span>${wtag(W)}</div>`; }).join(''):'<p class="good">세 시즌 모두 자리가 채워져 있습니다.</p>'}</div><div class="row spn-act"><button class="btn small" data-a="go" data-v="transfer:fa">FA 시장</button><button class="btn small" data-a="go" data-v="trade:market">선수 찾기</button></div></section>`;
  const yp=mine.filter(p=>!p.foreign&&p.age<=24).map(p=>{ const rp=scoutReport(p); return {p,pv:potVal(rp),T:potTierP(rp,p),cur:rp.cur}; }).filter(x=>x.T&&!x.T.done&&x.T.n>=3).sort((a,b)=>b.pv-a.pv).slice(0,12);
  const b2=`<section class="card"><h3>유망주 · 후계 후보 <em>${yp.length}명</em></h3><div class="sf-tw"><table class="sf-t"><thead><tr><th>선수</th><th>지금</th><th>${Y+2}</th><th>잠재력</th></tr></thead><tbody>${yp.length?yp.map(x=>`<tr><td><button class="lnk" data-a="player" data-v="${x.p.id}">${esc(x.p.name)}</button> <span class="muted">${esc(posLabel(x.p))} · ${x.p.age}세</span></td><td>${rchip(x.cur)}</td><td>${planRng(x.p,2)}</td><td>${esc(x.T.s)}</td></tr>`).join(''):'<tr><td colspan="4" class="muted">1군 자원 이상으로 보는 24세 이하 선수가 없습니다.</td></tr>'}</tbody></table></div></section>`;
  const ev=[]; for(const p of mine){ if(p.joinY>Y)continue; if(p.foreign){ ev.push([Y,p,'외국인 1년 계약 · 재계약 협상','warn']); continue; }
    const fy=Y+ctrlYears(p)-1; if(fy<=Y+2&&projPlan(p,0)>=45)ev.push([fy,p,'시즌 뒤 FA','bad']);
    const d=planDueY(p); if(d!=null&&d<=Y+2)ev.push([d,p,'입대 기한','warn']);
    if(p.mil&&p.mil.until&&p.mil.until>G.day)ev.push([dobj(p.mil.until).y,p,milText(p),'']); }
  ev.sort((a,b)=>a[0]-b[0]||ovr(b[1])-ovr(a[1]));
  const b3=`<section class="card"><h3>계약 만료 · 병역 <em>${Y}~${Y+2}</em></h3><div class="sf-tw"><table class="sf-t"><tbody>${ev.length?ev.map(([y,p,t,k])=>`<tr><td>${y}</td><td><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button> ${rchip(Math.round(projPlan(p,0)))}</td><td class="${k}" title="${k==='warn'&&t==='입대 기한'?'만 28세가 되는 해까지 입대해야 합니다(게임 규칙).':''}">${esc(t)}</td></tr>`).join(''):'<tr><td class="muted">3년 안에 계약이 끝나거나 입대할 선수가 없습니다.</td></tr>'}</tbody></table></div></section>`;
  const PY=[0,1,2].map(planPay);
  const b4=`<section class="card" title="캡 여유 = 캡 − (확정 + 협상 예상). FA 재계약은 빼고, 캡 산입 예외는 반영하지 않은 대략값입니다."><h3>국내 선수 연봉 전망 <em class="spn-t">대략값</em></h3><div class="sf-tw"><table class="sf-t spn-pay"><thead><tr><th></th>${PY.map((_,k)=>`<th>${Y+k}</th>`).join('')}</tr></thead><tbody>
    <tr><td>확정</td>${PY.map(x=>`<td>${money(x.fix)}</td>`).join('')}</tr><tr><td>협상 예상</td>${PY.map((x,k)=>`<td>${k?money(x.est):'-'}</td>`).join('')}</tr>
    <tr><td>FA 재계약</td>${PY.map((x,k)=>`<td title="${x.faN}명">${k&&x.faN?money(x.fa):'-'}</td>`).join('')}</tr><tr><td>샐러리캡</td>${PY.map(x=>`<td>${money(x.cap)}</td>`).join('')}</tr>
    <tr><td>캡 여유</td>${PY.map((x,k)=>{ const r=x.cap-x.fix-(k?x.est:0); return `<td class="${r<0?'bad':'good'}">${r<0?'초과 ':''}${money(Math.abs(r))}</td>`; }).join('')}</tr></tbody></table></div></section>`;
  return `<div class="spn ws-own">${fld}${grid}${det}<div class="spn-bt">${b1}${b2}${b3}${b4}</div></div>`; }
function glanceRow(p,lab,own,lvl){ const rp=scoutReport(p); const y=G.year; const h1=lvl==='2'?null:seasonTotal(p,y,'1군'); const h=lvl==='2'?seasonTotal(p,y,'퓨처스'):(h1&&(p.isP?h1.outs:h1.pa)&&period()!=='pre'?h1:curLine(p)); /* 올해 1군 기록이 있으면 표본이 적어도 올해 것을 */
  const fu=lvl==='2'&&!p.isP&&p.fuse&&p.fuse.y===y?Object.entries(p.fuse.pos).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,n])=>`${POSS[k]||k} ${n}`).join('·'):''; const st=(!h?'기록 없음':(lvl==='2'?'':yrTag(h)+' ')+(p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:'-'):(h.pa?`OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'-')))+(fu?` · ${fu}`:'');
  const gd=own?growDelta(p):null; const gt=gd==null||Math.abs(gd)<.5?'':`<em class="gr ${gd>0?'up':'dn'}" title="올해 들어 능력 ${gd>0?'상승':'하락'}">${gd>0?'▲':'▼'}</em>`;
  const tag=(team(p.team).cap===p.id?'<em class="capb">C</em>':'')+(p.fr&&p.fr.tid===p.team?'<em class="frb">프</em>':'')+(p.age<=24&&(rp.ofp??0)>=(rp.cur??0)+6?`<em class="potb">${potTier(potVal(rp),rp.cur).s}</em>`:'');
  const org=own?originOf(p):'';
  return `<button class="gl-r" data-a="player" data-v="${p.id}"><span class="gl-l">${lab}</span><span class="gl-a">${gt}</span>${avImg(p)}<span class="gl-m"><b>${esc(p.name)}${tag}</b><i>${posLabel(p)} · ${p.age}세 · ${money(p.sal)} · ${st}${org?` · <span class="org">${org}</span>`:''}</i></span><span class="gl-o">${rchip(rp.cur)}</span></button>`; }
/* 1군 투수진(선발 로테이션·불펜 보직)과 벤치: 전력 구성 화면에서 배치도 옆에 붙인다 */
function glancePitch(tid){ const own=tid===G.user; const d=depth(tid); const R=(p,lab)=>glanceRow(p,lab,own,'1'); const roles=['마무리','필승조','필승조','추격조','추격조','롱릴리프','롱릴리프'];
  const order=orderList(d.start,tid), posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k; /* 1군 야수도 목록으로(사용자 피드백 11-07: 전력 구성에 1군 야수가 안 보임) */
  return `<div class="eyebrow">1군 타순</div>${order.map((p,i)=>R(p,`${i+1} ${SLK[posOf[p.id]]||''}`)).join('')}<div class="eyebrow">선발 로테이션</div>${d.sp.map((p,i)=>R(p,`${i+1}선발`)).join('')}<div class="eyebrow">불펜</div>${d.pen.slice(0,7).map((p,i)=>R(p,roles[i]||'불펜')).join('')}${d.bench.length?`<div class="eyebrow">벤치</div><div class="gl-chips">${d.bench.map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}<i>${SLK[pSlot(p)]||posLabel(p)} ${rchip(scoutReport(p).cur)}</i></button>`).join('')}</div>`:''}`; }
/* 빠진 선수: 부상·징계와 대표팀 차출(playersOf는 차출 선수를 빼므로 따로 더한다, 검수 11-09zi) */
const outList=tid=>playersOf(tid).filter(p=>!healthy(p)).concat(awayOf(tid).filter(p=>!milServing(p)));
/* 2군 화면이 읽는 실제 2군 라인업: 올해 것만, 지금 1군·부상·차출·이적 선수는 뺀다(검수 11-09zi) */
const futLnOf=tid=>{ const F=G.futLn&&G.futLn[tid]; return F&&period()==='season'&&dobj(F.d).y===G.year?F:null; };
const futLnPlayers=(FL,tid)=>Object.fromEntries(Object.entries(FL.ln).map(([k,id])=>[k,G.players[id]]).filter(([k,p])=>p&&p.team===tid&&!p.e1&&healthy(p)&&!isAway(p)));
/* 우리 팀 현황(선수단 → 현황): 팀 상태 · 빠진 선수 · 올해 성장 */
function teamStatusView(){ if(!G.ovr0)try{ ovrSnap(); growSnap(); }catch(e){} const away=outList(G.user); const awayT=away.length?`<p class="small">${away.map(p=>`${esc(p.name)}(${outTxt(p)})`).join(', ')}</p>`:'';
  return `<section class="card"><h2 class="sec">우리 팀 현황</h2>${teamStatusBox()}</section>`+(awayT?csec('빠진 선수',awayT):'')+teamGrowCard(); }
function glanceView(tid){ const own=tid===G.user; if(own&&!G.ovr0)try{ ovrSnap(); growSnap(); }catch(e){} const d=depth(tid); const order=orderList(d.start,tid); const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k;
  const R=(p,lab,l)=>glanceRow(p,lab,own,l);
  const roles=['마무리','필승조','필승조','추격조','추격조','롱릴리프','롱릴리프'];
  const one=`<div class="gl-g"><div><div class="eyebrow">타순</div>${order.map((p,i)=>R(p,`${i+1} ${SLK[posOf[p.id]]||''}`,'1')).join('')}</div>
    <div><div class="eyebrow">선발 로테이션</div>${d.sp.map((p,i)=>R(p,`${i+1}선발`,'1')).join('')}<div class="eyebrow">불펜</div>${d.pen.slice(0,7).map((p,i)=>R(p,roles[i]||'불펜','1')).join('')}</div></div>
    ${d.bench.length?`<div class="eyebrow">벤치</div><div class="gl-chips">${d.bench.map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}<i>${SLK[pSlot(p)]||posLabel(p)} ${rchip(scoutReport(p).cur)}</i></button>`).join('')}</div>`:''}`;
  const fb=d.futB.filter(p=>!p.ys||own), fp=d.futP; const FL=futLnOf(tid); const fl=FL?futLnPlayers(FL,tid):futLineup(fb); const fstart=GPOS.filter(k=>fl[k]).map(k=>fl[k]); const forder=orderList(fstart); const fpo={}; for(const k in fl)fpo[fl[k].id]=k;
  const fsp=FL&&FL.rot?fp.filter(p=>FL.rot.includes(p.id)):[...fp].sort((a,b)=>(spV(b)+roleBias(G.user,b))-(spV(a)+roleBias(G.user,a))).slice(0,5); /* 정규시즌에는 실제 2군 선발 배정(검수 11-09zi) */ const fpen=fp.filter(p=>!fsp.includes(p)).sort((a,b)=>penV(b)-penV(a)).slice(0,5);
  const two=`<div class="gl-g"><div><div class="eyebrow">2군 타순</div>${forder.map((p,i)=>R(p,`${i+1} ${SLK[fpo[p.id]]||''}`,'2')).join('')||'<p class="small muted">야수가 없습니다.</p>'}</div>
    <div><div class="eyebrow">2군 선발</div>${fsp.map((p,i)=>R(p,`${i+1}선발`,'2')).join('')}<div class="eyebrow">2군 불펜</div>${fpen.map(p=>R(p,'불펜','2')).join('')}</div></div>`;
  const away=outList(tid); const awayT=away.length?`<p class="small">${away.map(p=>`${esc(p.name)}(${outTxt(p)})`).join(', ')}</p>`:'';
  const gN=own?playersOf(tid).filter(p=>(growDelta(p)||0)>=1).length:0;
  const glt=inTabs('gl'+(own?'':'o'),[...(own?[['st','현황']]:[]),['one','1군'],['two','2군'],...(own?[['plan','선수단 계획']]:[])],own?'st':'one');
  if(own&&glt.cur==='st')return glt.bar+`<section class="card"><h2 class="sec">우리 팀 현황</h2>${teamStatusBox()}</section>`+(awayT?csec('빠진 선수',awayT):'')+teamGrowCard();
  if(own&&glt.cur==='plan')return glt.bar+plannerCard();
  if(glt.cur==='two')return glt.bar+csec('2군',two+`<p class="small sdesc">${FL?`${dobj(FL.d).y}년 ${dmd(FL.d)} 2군 라인업입니다. 2군 감독이 매주 짭니다: 전환 훈련 중인 선수는 그 자리에 먼저 넣고, 24세 이하에게 기회를 더 주며 조금씩 돌려 씁니다. 라인업에 든 선수는 한 주 3경기, 나머지는 1경기 정도 나갑니다.`:'2군 라인업은 1군에 없는 선수 중 자리별로 가장 나은 선수로 짠 예상입니다(정규시즌에는 실제 2군 라인업).'}</p>`);
  return glt.bar+csec(`1군 ${own?'감독 라인업':'예상 라인업'} <span class="small muted">${G.mgr[tid]?esc(G.mgr[tid].name)+' 감독 · ':''}${entryOn()?playersOf(tid).filter(p=>p.e1).length+'명':''}</span>`,one,own?`<span class="small muted">왼쪽 ▲▼: 올해 들어 능력 변화</span>`:''); }
/* 팀 성장 추이: 매달 1군 전력과 유망주 잠재를 기록 */
function teamGrowCard(){ const T=(G.tgrow||[]).slice(-24); if(T.length<2)return '';
  const W=320,H=70; const xs=i=>8+i*(W-16)/(T.length-1); const r1=T.map(x=>x.r1), r2=T.map(x=>x.pot); const lo=Math.min(...r1,...r2)-1, hi=Math.max(...r1,...r2)+1; const yv=v=>H-6-(v-lo)/(hi-lo)*(H-12);
  const line=(arr,c)=>`<polyline fill="none" stroke="${c}" stroke-width="2" points="${arr.map((v,i)=>`${xs(i).toFixed(1)},${yv(v).toFixed(1)}`).join(' ')}"/>`;
  const a=T[0], b=T[T.length-1];
  return csec('팀 성장 추이',`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="팀 전력과 유망주 잠재 추이">${line(r1,'var(--tc,#e0564f)')}${line(r2,'var(--good)')}</svg>
    <div class="row between small"><span>${a.y}.${a.m}</span><span>${b.y}.${b.m}</span></div>
    <p class="small"><b style="color:var(--tc,#e0564f)">1군 전력</b> ${dvRaw(a.r1).toFixed(1)} → <b>${dvRaw(b.r1).toFixed(1)}</b> · <b style="color:var(--good)">유망주 상위 10명 잠재</b> ${dvRaw(a.pot).toFixed(1)} → <b>${dvRaw(b.pot).toFixed(1)}</b></p>`); }
function lineupCard(tid){
  const d=depth(tid); const order=orderList(d.start,tid); const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k; const m=G.mgr[tid];
  const row=(p,i)=>{ const pos=posOf[p.id]; const off=pos!=='DH'&&pos!==p.pos;
    return `<div class="lu" data-a="player" data-v="${p.id}" role="button" tabindex="0"><span class="lu-n">${i+1}</span>${avImg(p)}<div class="lu-m"><b>${esc(p.name)}${condChip(p)}</b><span class="lu-p"><span class="pp main${off?' off':''}">${POSS[pos]}</span>${off?`<i>본래 ${POSS[p.pos]}</i>`:''} <i>${hand(p)}</i></span><span class="lu-s">${bLine(p)}</span><span class="lu-u">${l10Text(p)?l10Text(p)+' · ':''}${useText(p)}</span></div>${tid===G.user?fatBar(p):(()=>{const r=scoutReport(p); return r.cur!=null?rchip(r.cur):'<span></span>';})()}</div>`; };
  const bench=d.bench.map(p=>`<div class="lu sm" data-a="player" data-v="${p.id}" role="button" tabindex="0">${avImg(p)}<div class="lu-m"><b>${esc(p.name)}${condChip(p)}</b><span class="lu-p">${posChips(p)}</span><span class="lu-s">${bLine(p)}</span><span class="lu-u">${useText(p)}</span></div></div>`).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">${tid===G.user?'감독 라인업':'예상 라인업'}</h2><span class="small muted">${m?esc(m.name)+' 감독 · ':''}${tid===G.user&&G.policy?POL[G.policy.k].l+' 지시 · ':''}다음 경기 기준</span></div>
    <div class="lus">${order.map(row).join('')}</div>
    ${bench?`<div class="eyebrow">벤치 (대타·대수비·휴식일 선발)</div><div class="lus two">${bench}</div>`:''}
    <p class="small muted">타순과 수비 위치는 감독이 타격·수비 적합도로 정합니다. 노란 위치는 본래 포지션이 아닌 자리입니다. 출장 기록은 이번 시즌 실제 선발 기록입니다.</p></section>`;
}
function staffCard(tid){
  const d=depth(tid); const t=team(tid); const next=(projStarters(tid,1)[0]||{}).sp||null; /* 실제 선발 선택과 같은 예상(검수 11-09zh) */
  const row=(p,label,hl)=>`<div class="lu${hl?' nx':''}" data-a="player" data-v="${p.id}" role="button" tabindex="0"><span class="lu-n sm">${label}</span>${avImg(p)}<div class="lu-m"><b>${esc(p.name)}${condChip(p)}</b><span class="lu-p"><i>${p.th}투</i> <i>${p.age}세</i>${hl?' <span class="pp main">다음 선발</span>':''}</span><span class="lu-s">${pLine(p)}</span>${l10Text(p)?`<span class="lu-u">${l10Text(p)}</span>`:''}</div>${tid===G.user?fatBar(p):(()=>{const r=scoutReport(p); return r.cur!=null?rchip(r.cur):'<span></span>';})()}</div>`;
  return `<section class="card"><div class="row between"><h2 class="sec">감독의 투수 운용</h2><span class="small muted">선발은 5일 간격</span></div>
    <div class="eyebrow">선발 로테이션</div><div class="lus">${d.sp.map((p,i)=>row(p,(i+1)+'선발',next&&p.id===next.id)).join('')}</div>
    <div class="eyebrow">불펜</div><div class="lus two">${d.pen.map((p,i)=>row(p,i===0?'마무리':i<4?'필승조':'추격조')).join('')}</div></section>`;
}

