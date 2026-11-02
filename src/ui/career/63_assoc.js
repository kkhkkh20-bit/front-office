/* ---------- 리그 > 협회: 협회장, 실행위원회 상한 표결, 선거 기록 ---------- */
function assocView(){ const A=asInit(); const H=A.head; const S=AS_STANCE[H.stance]; const cap=capOf(G.year); const near=cmtNear();
  const head=csec(`${ASSOC.name}(${ASSOC.s})`,`<div class="aslist">
    <div><span class="muted">${ASSOC.head}</span><b>${esc(H.name)}</b> · ${H.age}세 · ${esc(H.car)}</div>
    <div><span class="muted">성향</span><b>${S.l}</b> · ${S.d}</div>
    <div><span class="muted">임기</span>${H.since}~${H.until}년${H.terms>1?` (${H.terms}선)`:''}</div>
    ${G.unemp?'':`<div><span class="muted">우리 구단과</span>${asRelLabel()}</div>`}</div>
    <p class="small muted">협회장은 이사회(10개 구단 사장)가 재적 4분의 3 이상으로 추천하고 구단주 총회가 선출합니다. 임기 3년. ${H.until===G.year?'올해 선거가 있습니다: 11월 10일 후보 발표, 12월 15일 이사회 추천.':`다음 선거는 ${H.until}년 12월입니다.`}</p>`);
  const rule=csec('실행위원회(단장 회의)',`<p class="small">10개 구단 단장이 안건을 먼저 심의합니다. 과반이 지지한 안만 이사회(사장단)에 올라가고, 이사회는 대부분 그대로 의결합니다.</p>
    <p class="small">경쟁균형세 상한은 ${G.year+1<=2028?'2028년까지 매년 5%로 정해져 있고, 2029년부터':''} 시즌을 마친 시점에 연봉이 상한의 90% 이상인(또는 상한을 넘긴) 구단이 <b>5곳 이상</b>일 때만 회의가 열려 조정됩니다(동결·3%·5%·8%). 요건이 안 되면 동결입니다.</p>
    <div class="tiles"><div class="tile"><span class="g">${near.length}곳</span><span class="l">${asInit().snap&&asInit().snap.y===G.year?'올 시즌':'지금'} 상한 90% 이상</span></div><div class="tile"><span class="g">${money(cap)}</span><span class="l">${G.year}년 상한</span></div><div class="tile"><span class="g">${money(floorOf(G.year))}</span><span class="l">하한</span></div></div>
    ${near.length?`<p class="small muted">${near.map(t=>`${tshort(t.id)} ${Math.round(cmtRatio(t)*100)}%`).join(' · ')}</p>`:''}`);
  const rows=A.cmt.map(r=>!r.held?`<div class="item"><b>${r.y}년</b> 동결 <span class="small muted">· 소집 요건 미달(90% 이상 ${r.n}곳)</span></div>`:
    `<details class="item"><summary><b>${r.y}년</b> ${pctTxt(r.fin)} <span class="small muted">· 90% 이상 ${r.n}곳 · 1차 ${CMT_OPT.filter(o=>r.t1[o]).map(o=>`${pctTxt(o)} ${r.t1[o]}`).join(' / ')}${r.run?` · 결선 ${pctTxt(r.run.a)} ${r.run.ca} : ${pctTxt(r.run.b)} ${r.run.cb}`:''}${r.adj?` · 이사회 ${r.adj==='down'?'하향':'상향'} 조정(${esc(r.head)})`:''}</span></summary>
      <div class="list">${G.teams.map(t=>{ const v=r.vote[t.id]; return `<div class="row between small"><span>${badge(t.id,18)} ${tshort(t.id)}${t.id===G.user?' (우리)':''}</span><span>${v==null?'기권':pctTxt(v)}${(r.sw||[]).includes(t.id)?' · 우리 안에 동조':''}</span></div>`; }).join('')}</div></details>`).join('');
  const hist=csec('상한 결정 기록',rows||'<p class="small muted">2028년 12월 첫 회의 전입니다. 2026~2028년 상한은 이미 정해져 있습니다.</p>');
  const els=A.els.map(E=>`<details class="item"><summary><b>${E.y}년 선거</b> ${E.win!=null?`${esc(E.c[E.win].name)} 당선(${AS_STANCE[E.c[E.win].stance].l})`:'추천 무산'}${E.uv!=null?` <span class="small muted">· 우리 지지: ${esc(E.c[E.uv].name)}</span>`:''}</summary>
    <p class="small">${E.rounds.map(r=>`${r.l}: ${E.c.map((c,j)=>`${esc(c.name)} ${r.cn[j]}`).join(' / ')}`).join('<br>')} · 추천 기준 ${Math.ceil(G.teams.length*.75)}표</p></details>`).join('');
  return head+rule+hist+csec('협회장 선거 기록',els||'<p class="small muted">아직 선거가 없었습니다.</p>');
}
