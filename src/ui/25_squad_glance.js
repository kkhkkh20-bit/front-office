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
function projPlan(p,k){ let o=ovr(p), a=p.age; const pot=Math.max(p.pot||o,o); for(let i=0;i<k;i++){ a++; o+=a<=24?(pot-o)*.3:a<=27?(pot-o)*.22:a<=30?0:a<=33?-1.5:-3; } return o; }
function plannerCard(){ const Y=G.year; const ps=Object.values(G.players).filter(p=>p.team===G.user);
  if(!G.plEx||G.plEx.y!==Y)G.plEx={y:Y,ids:[]}; const EX=new Set(G.plEx.ids);
  const col=k=>{ const av=ps.filter(p=>k>0||!(p.joinY>Y)).filter(p=>!(p.joinY>Y+k)).filter(p=>k===0||!EX.has(p.id));
    const leave=p=>p.foreign?(k>=1?'재계약':''):k>=ctrlYears(p)?'FA':''; const v=p=>projPlan(p,k);
    const bats=av.filter(p=>!p.isP), pits=av.filter(p=>p.isP); const used=new Set(), ln={}, bk={};
    for(const pos of ['C','SS','2B','CF','3B','RF','LF','1B']){ const el=bats.filter(p=>!used.has(p.id)&&(p.pos===pos||(subsOf(p)||[]).includes(pos))).sort((a,b)=>(v(b)-(b.pos===pos?0:2))-(v(a)-(a.pos===pos?0:2))); if(el[0]){ ln[pos]=el[0]; used.add(el[0].id); } }
    { const r=bats.filter(p=>!used.has(p.id)).sort((a,b)=>v(b)-v(a)); if(r[0]){ ln.DH=r[0]; used.add(r[0].id); } }
    for(const pos of ['C','1B','2B','3B','SS','LF','CF','RF']){ const el=bats.filter(p=>!used.has(p.id)&&(p.pos===pos||(subsOf(p)||[]).includes(pos))).sort((a,b)=>v(b)-v(a)); if(el[0])bk[pos]=el[0]; }
    const sp=[...pits].sort((a,b)=>(v(b)+roleBias(G.user,b))-(v(a)+roleBias(G.user,a))).slice(0,5); const rp=pits.filter(p=>!sp.includes(p)).sort((a,b)=>v(b)-v(a)).slice(0,7);
    return {ln,bk,sp,rp,v,leave}; };
  const C=[0,1].map(col);
  const cls=o=>o==null?'gap':o<45?'weak':o<52?'mid':o>=60?'top':'ok';
  /* 내년 예상은 젊은 선수일수록 범위로 보여 준다(코치진 추정) */
  const rng=(p,k)=>{ const v=projPlan(p,k); if(k===0||p.age+k>27)return rchip(Math.round(v)); const w=clamp((28-p.age-k)*.8,1.5,5); const m=v+hn('plr'+Y,p.id)*w*.4; return `<span class="pl-r" style="--c:${rcol(Math.round(m))}">${Math.round(m-w)}~${Math.round(m+w)}</span>`; };
  const nm=(c,p,k)=>{ const lv=c.leave(p); return `<span class="pl-pw"><button class="pl-p" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b>${rng(p,k||0)}${lv?`<em class="pl-f">${lv}</em>`:''}${p.joinY>Y?'<em class="pl-n">신인</em>':''}</button>${k?`<button class="pl-x" data-a="plEx" data-v="${p.id}" title="내년 계획에서 빼기" aria-label="${esc(p.name)} 내년 계획에서 빼기">×</button>`:''}</span>`; };
  const cell=(c,k,ci)=>{ if(k==='SP'||k==='RP'){ const L=k==='SP'?c.sp:c.rp; if(!L.length)return `<td class="gap"><span class="pl-g">빈자리</span></td>`; const a=L.reduce((t,p)=>t+c.v(p),0)/L.length; return `<td class="${cls(a)}">${nm(c,L[0],ci)}<i class="pl-s">${L.length}명 평균 ${Math.round(a)}${L.length<(k==='SP'?5:6)?' · 부족':''}</i></td>`; }
    const p=c.ln[k], b=c.bk[k]; if(!p)return `<td class="gap"><span class="pl-g">빈자리</span></td>`; return `<td class="${cls(c.v(p))}">${nm(c,p,ci)}${b?`<i class="pl-s">백업 ${esc(b.name)} ${Math.round(c.v(b))}</i>`:''}</td>`; };
  const rows=PSLOTS.map(k=>`<tr><th>${SLOTS_S[k]}</th>${C.map((c,ci)=>cell(c,k,ci)).join('')}</tr>`).join('');
  /* 내년 빈자리 요약 */
  const nx=C[1]; const holes=PSLOTS.filter(k=>{ if(k==='SP'||k==='RP'){ const L=k==='SP'?nx.sp:nx.rp; return L.length<(k==='SP'?5:6)||L.reduce((t,p)=>t+nx.v(p),0)/Math.max(1,L.length)<46; } const p=nx.ln[k]; return !p||nx.v(p)<45||nx.leave(p); }).map(k=>{ const p=nx.ln[k]; return `${SLOTS_S[k]}${p&&nx.leave(p)?`(${nx.leave(p)==='FA'?'FA 예정':'외국인 재계약'})`:''}`; });
  /* 2년 뒤 위험: 노화·계약 만료·고액 장기 부담, 그리고 내부 후계 후보 */
  const succ=k=>{ const L=ps.filter(p=>!p.foreign&&p.age<=24&&projPlan(p,2)>=45&&!EX.has(p.id)&&(k==='SP'?p.isP&&isSPr(p):k==='RP'?p.isP:!p.isP&&(p.pos===k||(subsOf(p)||[]).includes(k)))).filter(p=>!(nx.ln[k]&&nx.ln[k].id===p.id)).sort((a,b)=>projPlan(b,2)-projPlan(a,2)); return L[0]||null; };
  const risk=[]; for(const k of PSLOTS){ if(k==='DH')continue; const p=k==='SP'?nx.sp[0]:k==='RP'?nx.rp[0]:nx.ln[k]; if(!p)continue; const r=[];
    if(p.age+2>=33)r.push(`${p.age+2}세가 됨`); if(!p.foreign&&ctrlYears(p)===2)r.push('2년 뒤 FA'); if(p.sal>=1500&&p.age>=31&&(p.faC&&p.yrs>=3))r.push(`연 ${money(p.sal)} 계약이 남음`);
    if(!r.length)continue; const s2=succ(k); risk.push(`<li><b>${SLOTS_S[k]}</b> ${esc(p.name)}: ${r.join(' · ')} → ${s2?`후계 후보 ${esc(s2.name)}(${s2.age}세, 2년 뒤 ${rng(s2,2)})`:'<span class="bad">내부 후계자 없음</span>'}</li>`); }
  /* 연봉 전망: 확정(남은 다년·FA 계약)과 예상(보류권 선수 연봉 협상)을 나눈다 */
  const fr=p=>p.svc<3?.35:p.svc<6?.55:p.svc<faSvc(p)?.78:1;
  const pay=k=>{ const D=ps.filter(p=>!p.foreign&&!p.prospect&&!(p.joinY>Y+k)&&!(k>0&&EX.has(p.id))); let fix=0,est=0,fa=0,faN=0;
    for(const p of D){ if(k===0){ fix+=p.sal; continue; } const cy=ctrlYears(p); if(p.faC&&p.yrs>k){ fix+=p.sal; continue; } if(!p.faC&&cy>k){ est+=round5(marketSal(projPlan(p,k))*Math.min(1,fr({svc:(p.svc||0)+k,college:p.college}))); continue; } if(projPlan(p,k)>=50){ fa+=round5(marketSal(projPlan(p,k))); faN++; } }
    return {fix,est,fa,faN,cap:capOf(Y+k)}; };
  const PY=[0,1,2].map(pay);
  const payT=`<div class="tw"><table class="pl-pay"><thead><tr><th></th>${PY.map((_,k)=>`<th>${Y+k}</th>`).join('')}</tr></thead><tbody>
    <tr><th>확정 연봉</th>${PY.map(x=>`<td>${money(x.fix)}</td>`).join('')}</tr>
    <tr><th>예상(연봉 협상)</th>${PY.map((x,k)=>`<td>${k?money(x.est):'-'}</td>`).join('')}</tr>
    <tr><th>FA 재계약 시</th>${PY.map((x,k)=>`<td>${k&&x.faN?`${money(x.fa)} <i class="muted">(${x.faN}명)</i>`:'-'}</td>`).join('')}</tr>
    <tr><th>샐러리캡</th>${PY.map(x=>`<td>${money(x.cap)}</td>`).join('')}</tr></tbody></table></div>`;
  const exL=G.plEx.ids.map(id=>G.players[id]).filter(Boolean);
  /* 세대 구성 */
  const dom=ps.filter(p=>!p.foreign&&!(p.joinY>Y)); const st=[['성장기','~23세',p=>p.age<=23],['도약기','24~26세',p=>p.age>=24&&p.age<=26],['전성기','27~31세',p=>p.age>=27&&p.age<=31],['노장','32세~',p=>p.age>=32]];
  const gen=st.map(([l,a,f])=>{ const L=dom.filter(f); const g=L.filter(p=>ovr(p)>=52).length; return `<div class="gen-c"><b>${l}</b><i>${a}</i><span>${L.length}명</span><em>1군급 ${g}</em></div>`; }).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">선수단 계획</h2><span class="small muted">숫자는 그해 예상 능력</span></div>
    <div class="tw"><table class="pl-t"><thead><tr><th></th>${[0,1].map(k=>`<th>${Y+k} ${k===0?'(올해)':'(내년)'}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small ${holes.length?'':'good'} keep">${holes.length?`내년 보강이 필요한 자리: <b>${holes.join(' · ')}</b>`:'내년까지 모든 자리가 채워져 있습니다.'}</p>
    ${exL.length?`<p class="small keep">내년 계획에서 뺀 선수: ${exL.map(p=>esc(p.name)).join(', ')} <button class="tc-i" data-a="plExClear">되돌리기</button></p>`:''}
    <p class="small muted keep">FA는 계약이 끝나 그해 떠날 수 있는 선수, 재계약은 1년 계약 외국인입니다. 젊은 선수의 내년 값은 코치진 추정 범위입니다. 내년 칸의 ×로 계획에서 빼면 빈자리와 연봉 전망이 다시 계산됩니다. 실제 기용이나 선수 기분에는 영향이 없습니다.</p>
    ${risk.length?`<div class="eyebrow" style="margin-top:6px">2년 뒤 위험</div><ul class="pl-risk">${risk.slice(0,6).join('')}</ul>`:''}
    <div class="eyebrow" style="margin-top:6px">국내 선수 연봉 전망</div>${payT}<p class="small muted keep">확정은 남은 다년·FA 계약, 예상은 보류권 선수의 연봉 협상 추정, FA 재계약 시는 계약이 끝나는 주축(예상 능력 50 이상)을 시장가로 잡을 때입니다.</p>
    <div class="eyebrow" style="margin-top:6px">세대 구성 (국내 선수)</div><div class="gen">${gen}</div></section>`; }
function glanceRow(p,lab,own,lvl){ const rp=scoutReport(p); const y=G.year; const h=lvl==='2'?seasonTotal(p,y,'퓨처스'):curLine(p);
  const st=!h?'기록 없음':p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:'-'):(h.pa?`OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'-');
  const gd=own?growDelta(p):null; const gt=gd==null||Math.abs(gd)<.5?'':`<em class="gr ${gd>0?'up':'dn'}">${gd>0?'▲':'▼'}${Math.abs(gd).toFixed(1)}</em>`;
  const tag=(team(p.team).cap===p.id?'<em class="capb">C</em>':'')+(p.fr&&p.fr.tid===p.team?'<em class="frb">프</em>':'')+(p.age<=24&&(rp.ofp??0)>=(rp.cur??0)+6?`<em class="potb">잠재 ${rp.ofp}</em>`:'');
  const org=own?originOf(p):'';
  return `<button class="gl-r" data-a="player" data-v="${p.id}"><span class="gl-l">${lab}</span>${avImg(p)}<span class="gl-m"><b>${esc(p.name)}${tag}</b><i>${posLabel(p)} · ${p.age}세 · ${money(p.sal)} · ${st}${org?` · <span class="org">${org}</span>`:''}</i></span><span class="gl-o">${rchip(rp.cur)}${gt}</span></button>`; }
function glanceView(tid){ const own=tid===G.user; if(own&&!G.ovr0)try{ ovrSnap(); growSnap(); }catch(e){} const d=depth(tid); const order=orderList(d.start); const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k;
  const R=(p,lab,l)=>glanceRow(p,lab,own,l);
  const roles=['마무리','필승조','필승조','추격조','추격조','롱릴리프','롱릴리프'];
  const one=`<div class="gl-g"><div><div class="eyebrow">타순</div>${order.map((p,i)=>R(p,`${i+1} ${SLK[posOf[p.id]]||''}`,'1')).join('')}</div>
    <div><div class="eyebrow">선발 로테이션</div>${d.sp.map((p,i)=>R(p,`${i+1}선발`,'1')).join('')}<div class="eyebrow">불펜</div>${d.pen.slice(0,7).map((p,i)=>R(p,roles[i]||'불펜','1')).join('')}</div></div>
    ${d.bench.length?`<div class="eyebrow">벤치</div><div class="gl-chips">${d.bench.map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}<i>${SLK[pSlot(p)]||posLabel(p)} ${rchip(scoutReport(p).cur)}</i></button>`).join('')}</div>`:''}`;
  const fb=d.futB.filter(p=>!p.ys||own), fp=d.futP; const fl=futLineup(fb); const fstart=GPOS.filter(k=>fl[k]).map(k=>fl[k]); const forder=orderList(fstart); const fpo={}; for(const k in fl)fpo[fl[k].id]=k;
  const fsp=[...fp].sort((a,b)=>(spV(b)+roleBias(G.user,b))-(spV(a)+roleBias(G.user,a))).slice(0,5); const fpen=fp.filter(p=>!fsp.includes(p)).sort((a,b)=>penV(b)-penV(a)).slice(0,5);
  const two=`<div class="gl-g"><div><div class="eyebrow">2군 타순</div>${forder.map((p,i)=>R(p,`${i+1} ${SLK[fpo[p.id]]||''}`,'2')).join('')||'<p class="small muted">야수가 없습니다.</p>'}</div>
    <div><div class="eyebrow">2군 선발</div>${fsp.map((p,i)=>R(p,`${i+1}선발`,'2')).join('')}<div class="eyebrow">2군 불펜</div>${fpen.map(p=>R(p,'불펜','2')).join('')}</div></div>`;
  const away=playersOf(tid).filter(p=>!healthy(p)||isAway(p)); const awayT=away.length?`<p class="small">${away.map(p=>`${esc(p.name)}(${outTxt(p)})`).join(', ')}</p>`:'';
  const gN=own?playersOf(tid).filter(p=>(growDelta(p)||0)>=1).length:0;
  const glt=inTabs('gl'+(own?'':'o'),[...(own?[['st','현황']]:[]),['one','1군'],['two','2군'],...(own?[['plan','선수단 계획']]:[])],own?'st':'one');
  if(own&&glt.cur==='st')return glt.bar+`<section class="card"><h2 class="sec">우리 팀 현황</h2>${teamStatusBox()}</section>`+(awayT?csec('빠진 선수',awayT):'')+teamGrowCard();
  if(own&&glt.cur==='plan')return glt.bar+plannerCard();
  if(glt.cur==='two')return glt.bar+csec('2군',two+`<p class="small sdesc">2군 라인업은 1군에 없는 선수 중 자리별로 가장 나은 선수로 짠 예상입니다.</p>`);
  return glt.bar+csec(`1군 ${own?'감독 라인업':'예상 라인업'} <span class="small muted">${G.mgr[tid]?esc(G.mgr[tid].name)+' 감독 · ':''}${entryOn()?playersOf(tid).filter(p=>p.e1).length+'명':''}</span>`,one,own?`<span class="small muted">▲▼ 올해 들어 능력 변화</span>`:''); }
/* 팀 성장 추이: 매달 1군 전력과 유망주 잠재를 기록 */
function teamGrowCard(){ const T=(G.tgrow||[]).slice(-24); if(T.length<2)return '';
  const W=320,H=70; const xs=i=>8+i*(W-16)/(T.length-1); const r1=T.map(x=>x.r1), r2=T.map(x=>x.pot); const lo=Math.min(...r1,...r2)-1, hi=Math.max(...r1,...r2)+1; const yv=v=>H-6-(v-lo)/(hi-lo)*(H-12);
  const line=(arr,c)=>`<polyline fill="none" stroke="${c}" stroke-width="2" points="${arr.map((v,i)=>`${xs(i).toFixed(1)},${yv(v).toFixed(1)}`).join(' ')}"/>`;
  const a=T[0], b=T[T.length-1];
  return csec('팀 성장 추이',`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="팀 전력과 유망주 잠재 추이">${line(r1,'var(--tc,#e0564f)')}${line(r2,'var(--good)')}</svg>
    <div class="row between small"><span>${a.y}.${a.m}</span><span>${b.y}.${b.m}</span></div>
    <p class="small"><b style="color:var(--tc,#e0564f)">1군 전력</b> ${a.r1.toFixed(1)} → <b>${b.r1.toFixed(1)}</b> · <b style="color:var(--good)">유망주 상위 10명 잠재</b> ${a.pot.toFixed(1)} → <b>${b.pot.toFixed(1)}</b></p>`); }
function lineupCard(tid){
  const d=depth(tid); const order=orderList(d.start); const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k; const m=G.mgr[tid];
  const row=(p,i)=>{ const pos=posOf[p.id]; const off=pos!=='DH'&&pos!==p.pos;
    return `<div class="lu" data-a="player" data-v="${p.id}" role="button" tabindex="0"><span class="lu-n">${i+1}</span>${avImg(p)}<div class="lu-m"><b>${esc(p.name)}${condChip(p)}</b><span class="lu-p"><span class="pp main${off?' off':''}">${POSS[pos]}</span>${off?`<i>본래 ${POSS[p.pos]}</i>`:''} <i>${hand(p)}</i></span><span class="lu-s">${bLine(p)}</span><span class="lu-u">${l10Text(p)?l10Text(p)+' · ':''}${useText(p)}</span></div>${tid===G.user?fatBar(p):(()=>{const r=scoutReport(p); return r.cur!=null?rchip(r.cur):'<span></span>';})()}</div>`; };
  const bench=d.bench.map(p=>`<div class="lu sm" data-a="player" data-v="${p.id}" role="button" tabindex="0">${avImg(p)}<div class="lu-m"><b>${esc(p.name)}${condChip(p)}</b><span class="lu-p">${posChips(p)}</span><span class="lu-s">${bLine(p)}</span><span class="lu-u">${useText(p)}</span></div></div>`).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">${tid===G.user?'감독 라인업':'예상 라인업'}</h2><span class="small muted">${m?esc(m.name)+' 감독 · ':''}${tid===G.user&&G.policy?POL[G.policy.k].l+' 지시 · ':''}다음 경기 기준</span></div>
    <div class="lus">${order.map(row).join('')}</div>
    ${bench?`<div class="eyebrow">벤치 (대타·대수비·휴식일 선발)</div><div class="lus two">${bench}</div>`:''}
    <p class="small muted">타순과 수비 위치는 감독이 타격·수비 적합도로 정합니다. 노란 위치는 본래 포지션이 아닌 자리입니다. 출장 기록은 이번 시즌 실제 선발 기록입니다.</p></section>`;
}
function staffCard(tid){
  const d=depth(tid); const t=team(tid); const next=d.sp.length?d.sp[(t.rot||0)%d.sp.length]:null;
  const row=(p,label,hl)=>`<div class="lu${hl?' nx':''}" data-a="player" data-v="${p.id}" role="button" tabindex="0"><span class="lu-n sm">${label}</span>${avImg(p)}<div class="lu-m"><b>${esc(p.name)}${condChip(p)}</b><span class="lu-p"><i>${p.th}투</i> <i>${p.age}세</i>${hl?' <span class="pp main">다음 선발</span>':''}</span><span class="lu-s">${pLine(p)}</span>${l10Text(p)?`<span class="lu-u">${l10Text(p)}</span>`:''}</div>${tid===G.user?fatBar(p):(()=>{const r=scoutReport(p); return r.cur!=null?rchip(r.cur):'<span></span>';})()}</div>`;
  return `<section class="card"><div class="row between"><h2 class="sec">감독의 투수 운용</h2><span class="small muted">선발은 5일 간격</span></div>
    <div class="eyebrow">선발 로테이션</div><div class="lus">${d.sp.map((p,i)=>row(p,(i+1)+'선발',next&&p.id===next.id)).join('')}</div>
    <div class="eyebrow">불펜</div><div class="lus two">${d.pen.map((p,i)=>row(p,i===0?'마무리':i<4?'필승조':'추격조')).join('')}</div></section>`;
}

