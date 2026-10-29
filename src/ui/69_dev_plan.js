/* ===== 훈련 방향(선수 화면 능력 탭, 운영 > 육성 > 훈련 방향) ===== */
function trnCoachOf(p,f){ const c=trnCoach(p.team,f==='bal'?(p.isP?'stf':'con'):f); return c; }
function trnCard(p){ if(p.team!==G.user||p.foreign||p.prospect||(p.joinY>G.year))return '';
  if(p.age>33)return `<section class="card"><span class="eyebrow">훈련 방향</span><p class="small muted">34세 이상은 코치진이 몸 관리 위주로 운영합니다.</p></section>`;
  const T=G.trn&&G.trn[p.id]; const mine=T&&T.by==='gm'; const rec=trnCoachPick(p); const f=mine?T.f:rec; const D=TRN[trnG(p)];
  const c=trnCoachOf(p,f); const role=(D[f]&&D[f].c)||(p.isP?'pc':'bc');
  const chips=Object.entries(D).map(([k,v])=>`<button class="btn small ${f===k?'on':''}" data-a="trnSet" data-v="${p.id}:${k}">${v.l}${k===rec?'<i class="trn-rec">코치안</i>':''}</button>`).join('');
  const o=trnObs(p); const dvp=(G.devProg||[]).find(x=>x.pid===p.id);
  return `<section class="card trn"><div class="row between"><span class="eyebrow">훈련 방향</span><span class="small muted">${mine?'단장 지정':'코치진 계획'}</span></div>
  <div class="talk">${chips}${mine?`<button class="btn small" data-a="trnSet" data-v="${p.id}:coach">코치에게 맡기기</button>`:''}</div>
  <p class="small">담당: ${c?`<b>${esc(c.name)}</b> ${CROLE[role]?CROLE[role].l:''} · 육성력 ${c.dv}`:`${CROLE[role]?CROLE[role].l:'코치'} 공석`}</p>
  <div class="mop"><b>코치 의견</b><span>${esc(trnOpinion(p))}</span>${!mine&&rec!=='bal'?`<span class="small muted">따로 정하지 않으면 코치진 계획(${D[rec].l} 집중)대로 갑니다.</span>`:''}</div>
  ${o?`<div class="trn-rep"><b>최근 보고</b><div class="small">${D[T.f].l} 집중 ${o.w}주 · ${esc(o.lv)}</div>${o.stat?`<div class="small muted">경기 기록: ${esc(o.stat)}</div>`:''}<div class="small muted">능력 변화는 코치 관찰이고, 경기 기록은 운과 상대에 따라 따로 움직입니다.</div></div>`:''}
  ${dvp?`<p class="small muted">2군 연수(${DEVP[dvp.prog].l})는 이와 별도로 진행됩니다.</p>`:''}
  <p class="small muted">한 항목에 집중하면 몇 주~몇 달에 걸쳐 그 항목이 오르고, 겨울 성장 때 다른 항목의 오름폭이 그만큼 줄어듭니다. 항목마다 늘 수 있는 여력이 달라 약점 보완이 늘 정답은 아닙니다.${p.isP?' 체력 집중은 부상 위험을 조금 낮추고, 구위 집중은 조금 높입니다.':' 수비 집중은 포지션 전환과 별개입니다.'}</p>
  ${UI.trnMsg&&UI.trnMsg.id===p.id?`<div class="note">${esc(UI.trnMsg.t)}</div>`:''}</section>`; }
/* 운영 > 육성: 우리 선수 훈련 방향 한눈에 */
function trnListBody(){ const ps=domestic(G.user).filter(p=>p.age<=33&&!(p.joinY>G.year)).sort((a,b)=>(a.isP-b.isP)||(ovr(b)-ovr(a)));
  const row=p=>{ const T=G.trn&&G.trn[p.id]; const mine=T&&T.by==='gm'; const f=mine?T.f:trnCoachPick(p); const D=TRN[trnG(p)][f]; const o=mine?trnObs(p):null;
    return `<button class="item" data-a="trnOpen" data-v="${p.id}"><span class="nm">${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세</span></span><span class="sub">${mine?'<span class="pill good">단장</span> ':'<span class="pill">코치</span> '}${D.l}${f==='bal'?'':' 집중'}${o?` · ${o.w}주 · ${esc(o.lv)}`:''}</span></button>`; };
  const n=Object.keys(G.trn||{}).length;
  return `<p class="small muted">선수마다 집중 항목을 하나 정합니다. 정하지 않은 선수는 담당 코치가 정한 계획대로 갑니다(다른 구단도 같은 방식). 지금 단장이 정한 선수 ${n}명. 선수를 누르면 능력 탭에서 코치 의견과 최근 보고를 볼 수 있습니다.</p>
  <div class="eyebrow">야수</div><div class="list">${ps.filter(p=>!p.isP).map(row).join('')}</div>
  <div class="eyebrow">투수</div><div class="list">${ps.filter(p=>p.isP).map(row).join('')}</div>`; }
Object.assign(A,{ trnSet(v){ const [id,f]=v.split(':'); const t=trnSet(+id,f); UI.trnMsg=t?{id:+id,t}:null; save(); if(UI.sheet!=null)renderSheet(); render(); },
  trnOpen(v){ UI.ptab='abil'; A.player(v); } });
