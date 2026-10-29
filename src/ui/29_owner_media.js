/* ---------- 구단주·목표, 언론·여론 ---------- */
function gauge(v,lo,hi){ const c=v>=hi?'var(--good)':v<=lo?'var(--bad)':'var(--warn)'; return `<span class="gauge"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></span>`; }
function milView(){
  const mine=domestic(G.user); const free=mine.filter(p=>milFree(p)).sort((a,b)=>b.age-a.age); const serving=awayOf(G.user).filter(p=>p.mil&&p.mil.until>G.day);
  const pending=Object.values(G.players).filter(p=>p.team===G.user&&p.mil&&p.mil.until&&p.mil.from>G.day);
  const w=sangmuWave();
  const card=p=>pcard(p,{sub:`${p.age}세 · ${esc(milText(p))}`,tags:p.age>=27&&milFree(p)?'<span class="pill bad">올해 입대해야 함</span>':'',foot:`${rosterFoot(p)}${milFree(p)&&!(p.mil&&p.mil.app)?`${w&&p.age<=27?`<button class="tc-i go" data-a="sangmu" data-v="${p.id}">상무 지원</button>`:''}<button class="tc-i" data-a="enlist" data-v="${p.id}">현역 입대</button>`:''}`});
  const oy=[0,1,2,3,4].map(k=>G.year+k).find(olyYear);
  return csec('병역 관리',`<p class="small muted">국내 선수는 군 복무를 해야 합니다. 상무(국군체육부대)는 1년 6개월 동안 퓨처스리그에서 뛰며 기량을 유지하고, 현역은 야구를 거의 못 해 기량이 떨어집니다. 상무는 지원자 중 기량 순으로 한 번에 ${SANGMU_SLOTS}명만 합격합니다. 28세가 되는 해까지 입대하지 않으면 현역으로 갑니다(게임 규칙). 복무 중인 선수는 로스터에서 빠졌다가 전역하면 돌아옵니다.</p>
    <dl class="tsum"><div><dt>미필</dt><dd class="num">${free.length}명</dd></div><div><dt>복무 중</dt><dd class="num">${serving.length}명</dd></div><div><dt>상무 지원</dt><dd>${w?(w==='dec'?'지금 가능 · 12월 입대':'지금 가능 · 6월 입대'):'3~4월, 9~10월'}</dd></div></dl>
    ${UI.milMsg?`<div class="note">${esc(UI.milMsg)}</div>`:''}`)
   +(serving.length||pending.length?csec('복무 중 · 입대 예정',`<div class="tgrid">${serving.concat(pending).map(p=>pcard(p,{sub:`${p.age}세`,tags:`<span class="pill ${p.mil.unit==='상무'?'good':'warn'}">${p.mil.unit}</span>`,stat:esc(milText(p)),foot:rosterFoot(p)})).join('')}</div>`):'')
   +csec('미필 선수',free.length?`<div class="tgrid">${(UI.milAll?free:free.slice(0,8)).map(card).join('')}</div>${free.length>8?`<button class="btn block" data-a="milAll" style="margin-top:8px">${UI.milAll?'접기':`나머지 ${free.length-8}명 더 보기 (나이 어린 순)`}</button>`:''}`:'<p class="small muted">미필 선수가 없습니다.</p>')
   +csec('올림픽',`<p class="small expl">${oy?`다음 올림픽 야구: <b>${oy}년 7월</b>${oy===2028?' (LA, 다저스타디움, 6개국)':' (게임 가정)'}`:'예정 없음'}. 6월 10일에 리그 선수 24명이 대표로 뽑히고, 7월 13~22일 팀을 떠납니다. 동메달 이상이면 대표팀의 미필 선수는 체육요원으로 병역 특례를 받습니다. 아시안게임 특례는 넣지 않았습니다.</p>${G.oly&&G.oly.res?`<p class="small muted">${G.oly.y} 결과: ${G.oly.res}</p>`:''}`);
}
function ownerView(){
  prInit(); const t=team(G.user); const s=goalStatus(); const g=G.goals; const ow=OWNER[t.owner];
  const row=(label,cur,tgt,ok,pct,note)=>`<div class="goal ${ok==null?'':ok?'ok':'ng'}"><div class="row between"><b>${label}</b><span class="pill ${ok==null?'':ok?'good':'bad'}">${ok==null?'시즌 전':ok?'달성 중':'미달'}</span></div><div class="row between small"><span>현재 ${cur}</span><span class="muted">목표 ${tgt}</span></div>${pct!=null?`<span class="gauge"><i style="width:${clamp(pct,2,100)}%;background:${ok?'var(--good)':'var(--warn)'}"></i></span>`:''}${note?`<p class="small muted">${note}</p>`:''}</div>`;
  const goals=s?`${row('정규시즌 순위',s.rank.cur?s.rank.cur+'위':'-',s.rank.t+'위 이내',s.rank.cur?s.rank.ok:null,s.rank.cur?(11-s.rank.cur)/(11-s.rank.t)*100:null,'')}
    ${row('재정(모기업 적자 보전)',Math.round(s.sup.cur*100)+'% 예상',Math.round(s.sup.t*100)+'% 이하',s.sup.ok,s.sup.t/Math.max(.01,s.sup.cur)*100,'연봉·운영비와 예상 관중·광고 수입으로 추정한 값입니다. 결산 때 실제 금액으로 다시 평가합니다.')}
    ${row('팬 여론',s.fan.cur,s.fan.t+' 이상',s.fan.ok,s.fan.cur/s.fan.t*100,'')}
    ${s.youth?row('육성',`${s.youth.cur}명`,'24세 이하 주전급 1명 이상',s.youth.ok,s.youth.cur*100,'규정 타석의 절반(223타석) 또는 80이닝 이상'):''}`
    :'<p class="small muted">시즌 목표는 개막일에 구단주가 정합니다.</p>';
  const log=(G.ownerLog||[]).map(x=>`<div class="olog"><span class="pill ${x.mood==='만족'?'good':x.mood==='관망'?'':'bad'}">${x.m}월 ${x.mood}</span><p class="small">${esc(x.txt)}</p><span class="small muted">신뢰 ${x.trust} (${x.delta>=0?'+':''}${x.delta})</span></div>`).join('');
  return csec('구단주와 시즌 목표',`<div class="row between"><div><b>구단주 성향: ${ow.label}</b><p class="small muted">${ow.msg}</p></div><div class="trustbox"><span class="small muted">구단주 신뢰</span><b class="num">${t.trust}</b>${gauge(t.trust,25,60)}</div></div>
    ${t.trust<25?'<div class="note bad">신뢰가 매우 낮습니다. 시즌이 끝날 때 12 아래로 떨어지면 경질됩니다.</div>':''}
    <div class="goals">${goals}</div>
    <p class="small muted">구단주는 매달 말 보고를 받고 순위·여론·언론·재정을 함께 봅니다. 시즌이 끝나면 목표 달성 여부와 언론 논조가 신뢰에 크게 반영됩니다. 성향에 따라 무엇을 더 중시하는지가 다릅니다.</p>`)
   +(log?csec('월간 보고 기록',`<div class="ologs">${log}</div>`):'');
}
function mediaView(){
  prInit(); const P=G.pr; const f=Math.round(P.fan), pr=Math.round(P.press);
  const hist=P.hist.slice(-12);
  const chart=hist.length?`<div class="prchart">${hist.map(x=>`<div><i class="f" style="height:${x.fan*.8}px"></i><i class="p" style="height:${x.press*.8}px"></i><span>${x.m.split('.')[1]}</span></div>`).join('')}</div><p class="small muted"><span class="lg f"></span>팬 여론 <span class="lg p"></span>언론 논조 (월말 기준)</p>`:'';
  const items=(G.news||[]).slice(0,3).map(n=>`<div class="news ${n.v>=2?'pos':n.v<=-2?'neg':''}"${n.ref!=null&&G.players[n.ref]?` data-a="player" data-v="${n.ref}" role="button" tabindex="0"`:''}><div class="row between"><span class="small muted">${esc(n.o)}${n.by?` ${esc(n.by)} 기자`:''} · ${dsh(n.d)}</span><span class="tone">${n.v>=2?'호평':n.v>0?'우호':n.v<=-2?'혹평':n.v<0?'비판':'중립'}</span></div><b>${lk(n.t)}</b><p class="small">${lk(n.b)}</p></div>`).join('');
  return csec('여론 현황',`<dl class="tsum"><div><dt>팬 여론</dt><dd class="num">${f}</dd>${gauge(f,40,60)}</div><div><dt>언론 논조</dt><dd class="num">${pr}</dd>${gauge(pr,40,60)}</div><div><dt>구단 인기</dt><dd class="num">${Math.round(team(G.user).pop*100)}</dd></div></dl>
    ${chart}<p class="small muted">팬 여론은 관중 수입과 광고·상품 수입을 움직이고, 언론 논조는 스폰서와 구단주 평가에 영향을 줍니다. 승패, 연승·연패, 트레이드·FA 평가, 신인 활약, 외국인 부진, 감독·선수의 불만 표출이 기사가 됩니다.</p>`)
   +pressCards();
}

