/* ---------- 구단주·목표, 언론·여론 ---------- */
function gauge(v,lo,hi){ const c=v>=hi?'var(--good)':v<=lo?'var(--bad)':'var(--warn)'; return `<span class="gauge"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></span>`; }
function milView(){
  const mine=domestic(G.user); const free=mine.filter(p=>milFree(p)).sort((a,b)=>b.age-a.age); const serving=awayOf(G.user).filter(milServing);
  const pending=Object.values(G.players).filter(p=>p.team===G.user&&p.mil&&p.mil.until&&p.mil.from>G.day);
  const w=sangmuWave();
  const MA={last:['bad','마지막 기회'],go:['good','상무 추천'],hold:['warn','보류 의견'],wait:['','여유 있음']};
  const card=p=>{ const a=milFree(p)?milAdvice(p):null; const t=a&&MA[a.k]; return pcard(p,{sub:`${p.age}세 · ${esc(milText(p))}`,tags:(p.age>=27&&milFree(p)?'<span class="pill bad">올해 입대해야 함</span>':'')+(t&&a.k!=='last'?`<span class="pill ${t[0]}" title="${esc(a.who+': '+a.why)}">${t[1]}</span>`:''),stat:a&&a.why?`<span class="small muted">${esc(a.who)}: ${esc(a.why)}</span>`:undefined,foot:`${rosterFoot(p)}${milFree(p)&&!(p.mil&&p.mil.app)?`${w&&p.age<=27?`<button class="tc-i go" data-a="sangmu" data-v="${p.id}">상무 지원</button>`:''}<button class="tc-i" data-a="enlist" data-v="${p.id}">현역 입대</button>`:''}`}); };
  return csec('병역 관리',`<p class="small muted">국내 선수는 군 복무를 해야 합니다. 상무(국군체육부대)는 1년 6개월 동안 퓨처스리그에서 뛰며 기량을 유지하고, 현역은 야구를 거의 못 해 기량이 떨어집니다. 상무는 지원자 중 기량 순으로 한 번에 ${SANGMU_SLOTS}명만 합격합니다. 28세가 되는 해까지 입대하지 않으면 현역으로 갑니다(게임 규칙). 복무 중인 선수는 로스터에서 빠졌다가 전역하면 돌아옵니다.</p>
    <dl class="tsum"><div><dt>미필</dt><dd class="num">${free.length}명</dd></div><div><dt>복무 중</dt><dd class="num">${serving.length}명</dd></div><div><dt>상무 지원</dt><dd>${w?(w==='dec'?'지금 가능 · 12월 입대':'지금 가능 · 6월 입대'):'3~4월, 9~10월'}</dd></div></dl>
    ${UI.milMsg?`<div class="note">${esc(UI.milMsg)}</div>`:''}`)
   +(serving.length||pending.length?csec('복무 중 · 입대 예정',`<div class="tgrid">${serving.concat(pending).map(p=>pcard(p,{sub:`${p.age}세`,tags:`<span class="pill ${p.mil.unit==='상무'?'good':'warn'}">${p.mil.unit}</span>`,stat:esc(milText(p)),foot:rosterFoot(p)+(p.mil.byGM&&p.mil.from>G.day?`<button class="tc-i" data-a="enlistCancel" data-v="${p.id}">입대 취소</button>`:'')})).join('')}</div>`):'')
   +csec('미필 선수',free.length?`<div class="tgrid">${(UI.milAll?free:free.slice(0,8)).map(card).join('')}</div>${free.length>8?`<button class="btn block" data-a="milAll" style="margin-top:8px">${UI.milAll?'접기':`나머지 ${free.length-8}명 더 보기 (나이 어린 순)`}</button>`:''}`:'<p class="small muted">미필 선수가 없습니다.</p>')
   +csec('국가대표',`<p class="small muted">아시안게임 금메달·올림픽 3위 이내면 대표팀의 미필 선수는 병역 특례를 받습니다.</p><button class="btn small" data-a="go" data-v="league:nt">국가대표 보기</button>`);
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
/* PC 구단주·목표(FM 구단 비전처럼): 왼쪽 목표 줄·평가 기록, 오른쪽 구단주 피드백, 아래 재정·요청 기록·요청 통계·예산 조정 */
function ownerDash(){ prInit(); const t=team(G.user), ow=OWNER[t.owner], w=ow.w, s=goalStatus(), b=budget(), OL=G.ownerLog||[];
  const pill=ok=>ok==null?'<span class="pill">시즌 전</span>':`<span class="pill ${ok?'good':'bad'}">${ok?'달성 중':'미달'}</span>`, pct=v=>Math.round(v*100)+'%';
  const gr=(l,cat,wt,ok,cur)=>{ const [il,ik]=wt>=1.3?['필수 사항','must']:wt>=.8?['선호 사항','pref']:['희망 사항','hope']; return `<div class="og-r ${ik}"><b>${l}</b><span>${il}</span><span>${cat}</span><span>${cur}</span>${pill(ok)}</div>`; }; /* 중요도 = 구단주 성향의 평가 가중치 */
  const hd=l=>`<div class="og-r og-h"><span>${l}</span><span>중요도</span><span>분류</span><span>현재</span><span>상태</span></div>`;
  const goals=s?hd('올 시즌 목표')+gr(`정규시즌 ${s.rank.t}위 안에 들어라`,'성적',w[0],s.rank.cur?s.rank.ok:null,s.rank.cur?s.rank.cur+'위':'-')+gr(`모기업 적자 보전을 ${pct(s.sup.t)} 이하로 줄여라`,'재정',w[2],s.sup.ok,'예상 '+pct(s.sup.cur))+gr(`팬 여론을 ${s.fan.t} 이상으로 지켜라`,'여론',w[3],s.fan.ok,s.fan.cur)+(s.youth?gr('24세 이하 주전급을 1명 이상 키워라','육성',.8,s.youth.ok,s.youth.cur+'명'):''):'<p class="small muted">시즌 목표는 개막일에 구단주가 정합니다.</p>';
  const info=hd('월간 보고 때 함께 보는 것')+gr('언론 논조를 38 아래로 떨어뜨리지 마라','언론',w[3]*.6+.4,G.pr.press>=38,Math.round(G.pr.press));
  const H=(G.history||[]).filter(h=>h.user).slice(-4).reverse(), it=inTabs('own5',[['cur','현재 시즌'],...H.map(h=>[String(h.y),h.y+'년'])]);
  const olog=L=>L.map(x=>`<div class="olog"><span class="pill ${x.mood==='만족'?'good':x.mood==='관망'?'':'bad'}">${x.m}월 ${x.mood}</span><p class="small">${esc(x.txt)}</p><span class="small muted">신뢰 ${x.trust} (${x.delta>=0?'+':''}${x.delta})</span></div>`).join('');
  const kv=R=>`<dl class="fmd-kv">${R.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const plan=(()=>{ if(it.cur==='cur'){ const cy=OL.filter(x=>dobj(x.d).y===G.year); return fmArea([...cy.slice().reverse().map(x=>({l:x.m+'월',v:x.trust})),{l:'오늘',v:t.trust}],'var(--good)',v=>v)+`<div class="ologs">${olog(cy)||'<p class="small muted">구단주는 매달 말 보고를 받습니다. 첫 보고가 오면 여기에 쌓입니다.</p>'}</div>`; }
    const h=H.find(x=>String(x.y)===it.cur), Ls=G.last&&G.last.y===h.y?G.last:null, u=h.user;
    return kv([['정규시즌',`${u.w}승 ${u.l}패${u.t?` ${u.t}무`:''} · ${u.rank}위`],['순이익',money(u.net)],['시즌 말 구단주 신뢰',u.trust],...(Ls?[['신뢰 변화',`${Ls.trust.before} → ${Ls.trust.after} (${Ls.trust.delta>=0?'+':''}${Ls.trust.delta})`]]:[])])+(Ls&&Ls.goals&&Ls.goals.length?`<div class="ologs">${Ls.goals.map(g=>`<p class="small">${esc(g)}</p>`).join('')}</div>`:'')+`<div class="ologs">${olog(OL.filter(x=>dobj(x.d).y===h.y))}</div>`; })();
  const band=t.trust>=60?['안정','good']:t.trust>=35?['보통','warn']:t.trust>=20?['불안','bad']:['위험','bad'];
  const pv=clubPrestige(G.user), PL=G.teams.map(x=>clubPrestige(x.id)).sort((a,c)=>c-a), parts=clubPrestigeParts(G.user).filter(x=>x[0]!=='기본'&&Math.abs(x[1])>=.5);
  const ev=(L,c,m)=>L.length?L.map(x=>`<p class="own-ev ${c}"><i>${m}</i>${esc(x)}</p>`).join(''):'<p class="small muted">아직 없습니다.</p>';
  const LG=G.last&&G.last.y>=G.year-1&&G.last.goals||[];
  const good=[...OL.filter(x=>x.mood==='만족').slice(0,4).map(x=>`${x.m}월 보고: ${x.txt}`),...LG.filter(g=>/달성/.test(g)&&!/미달/.test(g))], bad=[...OL.filter(x=>x.mood==='불만'||x.mood==='격노').slice(0,4).map(x=>`${x.m}월 보고: ${x.txt}`),...LG.filter(g=>/미달/.test(g))];
  const GM=grants().filter(g=>g.by==='gm'), ok=GM.filter(g=>g.ok).length, n=GM.length||1, GR=grants().slice(0,10);
  return `<div class="fmd own-d"><section class="card own-goal"><h3 class="fmd-h">구단주 목표</h3><p class="fmd-note">구단주가 정한 올 시즌 목표 · 매달 말 보고와 시즌 결산 때 평가합니다</p>${goals}${info}</section>
    <section class="card own-plan"><h3 class="fmd-h">구단주 평가 기록</h3>${it.bar}${plan}</section>
    <section class="card own-fb"><div class="fmd-top"><div><h3 class="fmd-h">구단주 피드백</h3><p class="small">구단주 성향 <b>${ow.label}</b> · ${esc(ow.msg)}</p></div><div class="fmd-st"><span>구단주 신뢰</span><b class="fmd-big">${t.trust}</b>${gauge(t.trust,25,60)}</div></div>
      <div class="own-sum ${band[1]}">요약하자면, 구단주 신뢰는 <b>${band[0]}</b> 단계입니다.${OL[0]?` 최근 ${OL[0].m}월 보고는 '${OL[0].mood}'였습니다.`:''}${t.trust<25?' 시즌이 끝날 때 12 아래로 떨어지면 경질됩니다.':''}</div>
      <h4 class="fmd-k">구단 명성 <span class="stars-t">${starTxt(prestigeStars(pv))}</span> ${pv}점 · 리그 ${PL.indexOf(pv)+1}위</h4><div class="own-pr">${parts.map(x=>`<span><i>${esc(x[0])}</i><b class="${x[1]>=0?'good':'bad'}">${x[1]>=0?'+':''}${Math.round(x[1])}</b></span>`).join('')||'<p class="small muted">기본 점수 외 요인이 없습니다.</p>'}</div>
      <h4 class="fmd-k">주요 사건</h4>${ev(good,'good','▲')}<h4 class="fmd-k">주요 비판점</h4>${ev(bad,'bad','▼')}
      <h4 class="fmd-k">구단주가 평가에 두는 비중 (${ow.label})</h4><div class="own-w">${[['정규시즌 순위',w[0]],['재정(적자 보전)',w[2]],['팬 여론',w[3]],['언론 논조',w[3]*.6+.4]].map(([l,v])=>`<span>${l}</span>${fmBar(v,1.8)}<b>${v.toFixed(1)}</b>`).join('')}</div>
      <h4 class="fmd-k">팬 여론·언론 논조 추이 <span class="own-lg"><i class="f"></i>팬 여론 <i class="p"></i>언론 논조</span></h4>${(()=>{ const PH=[...(G.pr.hist||[]).slice(-12),{m:'오늘',fan:Math.round(G.pr.fan),press:Math.round(G.pr.press)}]; return fmArea(PH.map(x=>({l:x.m==='오늘'?x.m:x.m.split('.')[1]+'월',v:x.fan})),'var(--good)',v=>v,PH.map(x=>({v:x.press})),'var(--warn)'); })()}</section>
    <section class="card own-fin"><h3 class="fmd-h">재정</h3>${kv([['보유 현금',money(t.cash)],['올해 예상 수입',money(b.I)],['올해 예상 지출',money(b.E)],['예상 수지',`<span class="${b.I-b.E>=0?'good':'bad'}">${money(b.I-b.E)}</span>`],...(b.indie?[]:[['모기업 지원 예상',money(b.support)],['지원 목표 · 한도',`${money(b.goalSup)} · ${money(b.cap)}`]]),['예산 여유',`<span class="${b.roomGoal<0?'bad':''}">${money(b.roomGoal)}</span>`],['국내 선수 연봉',`${money(b.ci.pay)} / ${money(b.ci.cap)}`]])}<button class="btn small" data-a="go" data-v="club:fin">재정 화면</button></section>
    <section class="card own-req"><h3 class="fmd-h">구단주 요청 기록</h3>${GR.length?`<div class="rql">${GR.map(grantLine).join('')}</div>`:'<p class="small muted">아직 구단주에게 요청하거나 구단주가 주문한 지원이 없습니다.</p>'}</section>
    <section class="card own-dat"><h3 class="fmd-h">요청 통계</h3><p class="small">역대 단장 요청</p><svg class="fmd-bar big" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="8" fill="var(--panel2)"/><rect width="${(ok/n*100).toFixed(1)}" height="8" fill="var(--good)"/><rect x="${(ok/n*100).toFixed(1)}" width="${((GM.length-ok)/n*100).toFixed(1)}" height="8" fill="var(--bad)"/></svg>
      <p class="small"><b class="good">승인 ${ok}건(${Math.round(ok/n*100)}%)</b> · <b class="bad">반려 ${GM.length-ok}건(${Math.round((GM.length-ok)/n*100)}%)</b></p>${kv([['올해 단장 요청',GM.filter(g=>g.y===G.year).length+'건'],['재임 기간 단장 요청',GM.length+'건'],['구단주 먼저 주문',grants().filter(g=>g.by!=='gm').length+'건'],['올해 추가 지원',money(grantAmt())],['이번 달 요청',ownAskLeft()?'가능':'이미 함']])}</section>
    <section class="card own-adj"><h3 class="fmd-h">예산 조정</h3>${t.indie?'<p class="small muted">독립구단이라 모기업 지원이 없습니다. 스폰서와 자체 수익으로 운영합니다.</p>':`${meetDoor('own')}<p class="small">지금 예산 여유 <b>${money(b.roomGoal)}</b>${b.extra>0?` · 예상보다 더 들어온 수입 <b class="good">${money(b.extra)}</b>(요청 근거)`:''}</p><p class="fmd-note">한 달에 한 번 요청할 수 있습니다 ${hiI(`승인 여부는 구단주 신뢰, 성향(${ow.label}), 순위, 요청 금액과 목적에 따라 달라지고, 반려되면 신뢰 -1입니다.`)}</p>`}</section></div>`; }
function mediaView(){
  prInit(); const P=G.pr; const f=Math.round(P.fan), pr=Math.round(P.press);
  const hist=P.hist.slice(-12);
  const chart=hist.length?`<div class="prchart">${hist.map(x=>`<div><i class="f" style="height:${x.fan*.8}px"></i><i class="p" style="height:${x.press*.8}px"></i><span>${x.m.split('.')[1]}</span></div>`).join('')}</div><p class="small muted"><span class="lg f"></span>팬 여론 <span class="lg p"></span>언론 논조 (월말 기준)</p>`:'';
  const items=(G.news||[]).slice(0,3).map(n=>`<div class="news ${n.v>=2?'pos':n.v<=-2?'neg':''}"${n.ref!=null&&G.players[n.ref]?` data-a="player" data-v="${n.ref}" role="button" tabindex="0"`:''}><div class="row between"><span class="small muted">${esc(n.o)}${n.by?` ${esc(n.by)} 기자`:''} · ${dsh(n.d)}</span><span class="tone">${n.v>=2?'호평':n.v>0?'우호':n.v<=-2?'혹평':n.v<0?'비판':'중립'}</span></div><b>${lk(n.t)}</b><p class="small">${lk(n.b)}</p></div>`).join('');
  return csec('여론 현황',`<dl class="tsum"><div><dt>팬 여론</dt><dd class="num">${f}</dd>${gauge(f,40,60)}</div><div><dt>언론 논조</dt><dd class="num">${pr}</dd>${gauge(pr,40,60)}</div><div><dt>구단 인기</dt><dd class="num">${Math.round(team(G.user).pop*100)}</dd></div></dl>
    ${chart}<p class="small muted">팬 여론은 관중 수입과 광고·상품 수입을 움직이고, 언론 논조는 스폰서와 구단주 평가에 영향을 줍니다. 승패, 연승·연패, 트레이드·FA 평가, 신인 활약, 외국인 부진, 감독·선수의 불만 표출이 기사가 됩니다.</p>`)
   +pressCards();
}

