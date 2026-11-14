/* ---------- 감독 요청 · 구단주 요청 ---------- */
const RST={ask:['답변 대기','warn'],open:['진행 중','acc'],done:['들어줌','good'],no:['거절','bad'],fail:['못 지킴','bad'],half:['매물 등록만',''],void:['종료(이직)',''],back:['반납','bad']}; /* 이직 등으로 끝난 건(검수 11-08) */
function reqLine(r){ const p=r.data&&r.data.pid!=null?G.players[r.data.pid]:r.data&&r.data.target!=null?G.players[r.data.target]:null; const st=RST[r.st]||['',''];
  const what=r.k==='fit'?`${MROLE[r.data.role]?MROLE[r.data.role].l:'선수'} 찾기 · 조건: ${MROLE[r.data.role]?crTxt(r.data.role):''}`:r.k==='slot'?`${SLOTK[r.data.sk]} 보강${p?` · 추천 ${p.name}`:''}`:r.k==='out'?`${p?p.name:'선수'} 정리`:r.k==='frep'?`외국인 ${p?p.name:''} 교체`:r.k==='fa'?`FA ${p?p.name:''} 영입`:`드래프트 ${DPOL[r.data.pol]}`;
  const act=r.st!=='open'?'':r.k==='fit'?`<button class="btn small primary" data-a="go" data-v="trade:find">선수 찾기</button>`:r.k==='slot'?`${p?`<button class="btn small primary" data-a="toTrade" data-v="${p.id}">트레이드 협상</button>`:''}<button class="btn small${p?'':' primary'}" data-a="rqSlot" data-v="${r.data.sk}">후보 찾기</button>`:r.k==='out'?`<button class="btn small" data-a="go" data-v="trade:offers">매물 보기</button>`:r.k==='frep'?`<button class="btn small primary" data-a="go" data-v="transfer:foreign">외국인 시장</button>`:r.k==='fa'&&p?`<button class="btn small primary" data-a="faOpen" data-v="${p.id}">협상실</button>`:r.k==='draft'?`<button class="btn small" data-a="go" data-v="scout:draft">드래프트</button>`:'';
  return `<div class="rq"><span class="pill ${st[1]}">${st[0]}</span><div><b>${MREQK[r.k]}</b><span>${esc(what)}</span><i>${dsh(r.day)}${r.st==='open'&&r.until?` · ${dmd(r.until)}까지 (D-${Math.max(0,r.until-G.day)})`:''}</i></div>${act}</div>`; }
function mreqView(){ const L=mreqs().slice(0,10); const m=G.mgr[G.user];
  return csec('감독의 요청',(L.length?`<div class="rql">${L.map(reqLine).join('')}</div>`:'<p class="small muted">아직 감독이 따로 요청한 일이 없습니다.</p>')+`<p class="small muted">감독은 시즌 중 약한 자리 보강, 부진한 선수 정리, 외국인 교체를 먼저 요청하고, 8월 말에는 드래프트 기조를, FA 기간에는 꼭 잡고 싶은 선수를 말합니다. 들어주면 관계가 오르고, 약속하고 못 지키면 크게 깎입니다.${m&&m.ego>=70?' 고집 센 감독이라 거절하면 더 서운해합니다.':''}</p>`); }
function grantLine(g){ const p=g.pur&&g.pur.pid!=null?G.players[g.pur.pid]:null; const st=g.ok?(RST[g.st]||['승인','good']):['반려','bad']; const st2=g.ok&&g.st==='done'&&!g.pur?['승인','good']:st;
  return `<div class="rq"><span class="pill ${st2[1]}">${st2[0]}</span><div><b>${g.by==='own'?'구단주 주문':'단장 요청'} · ${money(g.amt)}</b><span>${g.why&&OWN_WHY[g.why]?`사유: ${OWN_WHY[g.why].l} · `:''}${g.pur?g.pur.k==='fa'?`FA ${esc(p?p.name:'')} 영입`:g.pur.k==='frep'?'외국인 교체':g.pur.k==='fac'?'시설 투자':'전력 보강':'운영비 증액'}</span><i>${dsh(g.d)}${g.st==='open'&&g.until?` · ${dmd(g.until)}까지`:''}</i></div></div>`; }
/* 구단주 자금 요청: 사유 → 대상·금액 → 가능성 확인 → 요청. 고르는 건 모두 버튼 */
function ownFundView(){ const t=team(G.user); if(t.indie||G.unemp)return ''; const left=ownAskLeft(); const S=UI.ow=UI.ow||{}; const B=bossOf(G.user);
  const chip=(a,v,l,on,dis,ti)=>`<button data-a="${a}" data-v="${v}" class="${on?'on':''}"${dis?' disabled':''}${ti?` title="${esc(ti)}"`:''}>${l}</button>`;
  let body=`<div class="small">요청 사유</div><div class="chips ow-why">${Object.entries(OWN_WHY).map(([k,W])=>chip('owWhy',k,esc(W.l),S.k===k)).join('')}</div>`;
  if(S.k){ const W=OWN_WHY[S.k]; let pick='';
    if(S.k==='fa'||S.k==='frep'){ const L=S.k==='fa'?ownWhyFA():ownWhyBadF(); if(L.length){ if(!L.some(p=>p.id===S.pid))S.pid=L[0].id; pick=`<div class="small">${S.k==='fa'?'영입할 FA':'바꿀 외국인'}</div><div class="chips">${L.map(p=>chip('owPid',p.id,`${esc(p.name)} · ${money(S.k==='fa'?p.ask.annual:frepAmtOf(p))}`,S.pid===p.id)).join('')}</div>`; } else S.pid=null; }
    if(!(S.k==='fa'&&S.pid!=null)&&S.k!=='frep'){ const A=OWN_AMT[S.k]; if(!A.includes(S.amt))S.amt=A[0]; pick+=`<div class="small">금액</div><div class="chips">${A.map(a=>chip('owAmt',a,money(a),S.amt===a)).join('')}</div>`; }
    const w=ownWhy(S.k,S.amt,S.pid); const F=w.f.filter(x=>x[0]).sort((a,b)=>Math.abs(b[0])-Math.abs(a[0])).slice(0,4);
    body+=pick+`<div class="ow-box">${w.block?`<p class="small warn">${esc(w.block)}</p>`:`<p class="ow-odds"><b>가능성: ${ownChance(w.p)}</b><span class="small muted">${esc(W.d)}</span></p>
      ${F.length?`<ul class="small ow-f">${F.map(x=>`<li class="${x[0]>0?'good':'bad'}">${x[0]>0?'+':'−'} ${esc(x[1])}</li>`).join('')}</ul>`:''}
      <p class="small ow-my">내 말: "${esc(w.my)}"</p><button class="btn primary block" data-a="owGo"${left?'':' disabled'}>${left?`${esc(W.l)} 자금 ${money(w.amt)} 요청하기`:'지금은 요청할 수 없습니다'}</button>`}</div>`; }
  const R0=S.res; if(R0)body+=`<div class="note ${R0.ok?'good':R0.said?'bad':''}" role="status">${R0.said?`${esc(B.own.name)} 회장: "${esc(R0.said)}"<br>`:''}${esc(R0.msg)}</div>`;
  return `<div class="ow-fund"><div class="eyebrow">자금 요청</div>${body}</div>`; }
function ownerAskView(){ const t=team(G.user); if(t.indie)return csec('구단주에게 요청','<p class="small muted">독립구단이라 모기업 지원이 없습니다. 스폰서와 자체 수익으로 운영합니다.</p>');
  const left=ownAskLeft(); const b=budget(); const amts=[1000,2000,3000];
  const faL=G.fa&&G.fa.open&&!G.fa.closed?G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null).sort((a,c)=>ovr(c)-ovr(a)).slice(0,4):[];
  const bad=foreignOf(G.user).filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=60&&pRate(h).era>5):(h.pa>=100&&bRate(h).ops<.700)); });
  const btn=(l,v,amt,pur)=>{ const o=ownOdds(amt,pur); return `<button class="oa" data-a="ownAsk" data-v="${v}" ${left?'':'disabled'}><b>${l}</b><span>${money(amt)} · ${oddsTxt(o)}</span></button>`; };
  const H=grants().slice(0,8);
  return csec(`구단주에게 요청 ${hiI(`승인 여부는 구단주 신뢰, 성향(${OWNER[t.owner].label}), 순위, 요청 금액과 목적에 따라 달라집니다. 반려되면 신뢰 조금 하락, 한 해에 자주 요청할수록 승인이 어려워집니다. 목적을 정해 받은 돈은 그 목적을 이루면 신뢰가 오르고, 못 이루면 깎입니다. 구단주가 먼저 스타 FA 영입이나 7월 우승 보강을 주문하며 돈을 내놓기도 합니다.`)}`,`<p class="small">지금 예산 여유 <b>${money(b.roomGoal)}</b> · 올해 추가 지원 ${money(grantAmt())}${b.extra>0?` · 예상보다 더 들어온 수입 <b class="ok">${money(b.extra)}</b>(요청 근거)`:''} · 구단주 신뢰 ${t.trust}</p>
    ${ownFundView()}${meetDoor('own')}
    <p class="small muted keep">${left?'한 시즌 세 번까지, 시간을 두고 요청할 수 있습니다.':ownAskNote()}</p>
    ${H.length?`<div class="eyebrow" style="margin-top:8px">요청·지원 기록</div><div class="rql">${H.map(grantLine).join('')}</div>`:''}`); }
function reqHomeCard(){ const M=mreqs().filter(r=>r.st==='open'); const O=grants().filter(g=>g.st==='open'&&g.pur); if(!M.length&&!O.length)return '';
  return `<section class="card"><div class="row between"><h2 class="sec">약속한 일</h2><button class="btn small" data-a="go" data-v="staff:mgr">감독 요청</button></div><div class="rql">${M.map(reqLine).join('')}${O.map(grantLine).join('')}</div></section>`; }

/* ---------- 감독과의 공생 화면 ---------- */
function mgrUseStats(){ const ps=playersOf(G.user); const sp=ps.filter(p=>isSPr(p)); const pc=[]; for(const g of (G.games||[]).slice(0,10)){ const side=g.box&&(g.home===G.user?g.box.h:g.away===G.user?g.box.a:null); if(side&&side.pit&&side.pit[0])pc.push(side.pit[0].pc||0); }
  const tired=ps.filter(p=>(p.fat||0)>=60).length; const inj=ps.filter(p=>p.injOut>0).length; const injY=ps.reduce((a,p)=>a+(p.injHist||[]).filter(h=>h.y===G.year).length,0);
  const heavy=ps.filter(p=>p.isP&&healthy(p)).map(p=>({p,w:pc7(p,G.day),c:consecDays(p,G.day),a:armRatio(p)})).filter(x=>x.w>=60||x.c>=2||x.a>=.8).sort((a,b)=>(b.a-a.a)||(b.w-a.w)).slice(0,4);
  return {avgPc:pc.length?Math.round(sum(pc)/pc.length):null,n:pc.length,tired,inj,injY,heavy}; }
function mgrBondView(){ const m=G.mgr[G.user]; if(!m||m.interim)return ''; mgrAttr(m); const d=mgrDir(); const u=mgrUseStats(); const bo=mgrRelBoost({team:G.user});
  const dirBox=(k,l,desc,cur)=>{ const x=d[k]; const st=!x?'지시 없음':x.mid!==m.id?'지시 없음':x.ok?'따르는 중':'거부함'; return `<div class="mdir"><div><b>${l} ${hiI(desc+'.')}</b><span class="small muted">감독 본래 ${cur}</span></div><span class="pill ${x&&x.mid===m.id?(x.ok?'good':'bad'):''}">${st}</span>${(()=>{ const w=mgrDirWait(k); return w?`<button class="btn small" disabled title="${esc(w)}">${esc(w)}</button>`:`<button class="btn small ${x&&x.mid===m.id&&x.ok?'':'primary'}" data-a="mgrDir" data-v="${k}:${x&&x.mid===m.id&&x.ok?0:1}">${x&&x.mid===m.id&&x.ok?'지시 해제':'지시하기'}</button>`; })()}</div>`; };
  const P=G.mpick&&G.mpick.y===G.year&&G.mpick.mid===m.id?G.mpick:null; const picks=P?P.ids.map(id=>G.players[id]).filter(Boolean):[];
  const log=(G.mpickLog||[]).filter(x=>x.mid===m.id).slice(0,4);
  return csec('감독과의 호흡',`<div class="mbond"><div><span class="small muted">관계</span><b class="num" style="color:${relCol(m.rel)}">${relLabel(m.rel)}</b><i></i></div><div><span class="small muted">선수단 경기력</span><b class="num" style="color:${bo>=0?'var(--good)':'var(--bad)'}">${bo>=0?'+':''}${bo.toFixed(2)}</b><i>관계에서 오는 보정</i></div><div><span class="small muted">안목(선수 보는 눈)</span><b class="num" style="color:${rcol(m.eye)}">${dv(m.eye)}</b><i>잠재력 예측 오차 ±${Math.max(1.5,9.5-m.eye/10).toFixed(1)}</i></div></div>
    <p class="small muted">관계가 좋을수록 선수단이 더 잘 뛰고(최대 +0.4), 지시를 잘 따르고, 선수 정보에서 감독의 솔직한 잠재력 예측을 볼 수 있습니다(사이가 껄끄러우면 말을 아낍니다). 관계가 "막역한 사이"면 언론에 "호흡 최고" 기사가 나고, "껄끄러운 사이"면 불화설이 돌며 고집 센 감독은 스스로 물러나기도 합니다.</p>
    <div class="eyebrow" style="margin-top:8px">감독이 미는 선수</div>${picks.length?`<div class="intl">${picks.map(p=>`<button class="pill ${P.back?'good':''}" data-a="player" data-v="${p.id}">${esc(p.name)} · ${posLabel(p)} ${p.age}세</button>`).join('')}</div><p class="small">${P.back?'함께 밀어주는 중 · 올해 성장이 빨라집니다':P.back===false?'단장이 성적을 우선했습니다':'답변 대기'}</p>`:'<p class="small muted">시즌이 시작되면 감독이 올해 키우고 싶은 젊은 선수를 고릅니다.</p>'}
    ${log.length?`<p class="small muted">지난 안목 기록: ${log.map(x=>`${x.y} ${esc(x.txt)}${x.back?' (함께 밀어줌)':''}`).join(' / ')} (겨울 종합 능력 변화)</p>`:''}
    <div class="eyebrow" style="margin-top:8px">운용 성향과 단장 지시</div>
    ${dirBox('rest','주전 휴식 보장','피로한 주전을 일찍 쉬게 해 부상을 줄입니다. 대신 쉬는 날은 벤치가 나갑니다',m.rest>=65?"휴식을 잘 챙김":m.rest<=40?"주전을 잘 쉬게 하지 않음":"휴식 관리 보통")}
    ${dirBox('arm','투수 관리(혹사 금지)','선발 투구 수와 불펜 연투를 줄여 투수 부상을 막습니다. 접전에서 필승조를 덜 씁니다',m.arm>=65?"투수를 많이 씀":m.arm<=40?"투수를 아끼는 편":"투수 운용 보통")}
    <p class="small">${u.n?`최근 ${u.n}경기 선발 평균 투구 수 <b>${u.avgPc}</b>${u.n<5?' (경기 수가 적어 참고만)':''}`:'아직 집계할 경기가 없습니다'} · 피로 60 이상 ${u.tired}명 · 지금 부상 ${u.inj}명 · 올해 부상 ${u.injY}건</p>
    <p class="small"><b>최근 부담 큰 투수</b> ${hiI('최근 7일 60구 이상·연투·누적 부하 80% 이상인 투수를 보여 줍니다.')} ${u.heavy.length?u.heavy.map(x=>`<button class="lnk" data-a="player" data-v="${x.p.id}">${esc(x.p.name)}</button>(${posLabel(x.p)} · 최근 7일 ${x.w}구${x.c>=2?` · ${x.c}연투`:''} · 누적 부하 ${Math.round(x.a*100)}%)`).join(', '):'없음'}</p>
    <p class="small muted">휴식 관리가 낮은 감독은 주전을 끝까지 써서 전력이 안정적이지만 피로와 부상이 쌓입니다. 투수 혹사가 높은 감독은 선발을 길게 끌고 필승조를 연투시켜 접전에 강하지만 투수 부상이 늘어납니다. 지시는 관계와 감독 고집에 따라 거부될 수 있고, 그래도 안 되면 시즌 중에도 감독을 교체할 수 있습니다(감독대행 체제 후 새 감독 선임).</p>
    ${UI.dirMsg?`<div class="note">${esc(UI.dirMsg)}</div>`:''}`); }
function mgrOpinion(p){ const v=mgrView(p); if(!v)return ''; const m=G.mgr[G.user]; if(v.mute)return `<div class="mop"><b>감독 의견</b><span class="small muted">${esc(m.name)} 감독이 말을 아낍니다(껄끄러운 사이).</span></div>`;
  const pk=G.mpick&&G.mpick.y===G.year&&G.mpick.ids.includes(p.id);
  return `<div class="mop"><b>감독 의견${pk?' · <span class="pill good">감독이 미는 선수</span>':''}</b><span>"${esc(v.line)}." 잠재력 예상 <b>${potTier(v.fut,Math.round(ovr(p))).s}</b></span><span class="small muted">${esc(m.name)} 감독 · 안목 ${dv(v.eye)} (오차 ±${dvSd(v.fut,v.sd)}점) ${hiI('스카우트 평가와 다르면 안목이 높은 쪽을 믿는 편이 낫습니다.')}</span></div>`; }
function starPanel(){
  const T=teamStar(G.user),L=T.L,f=clamp((finYearEnd()-G.day)/365,0,1),bonus=smBonus(G.user),total=starIncome(G.user);
  const C=[...new Set([...L.map(x=>x.p),...playersOf(G.user).filter(smActive),...playersOf(G.user).map(p=>({p,s:starPower(p)})).filter(x=>x.s>=10).sort((a,b)=>b.s-a.s).slice(0,5).map(x=>x.p)])].slice(0,6);
  const signed=v=>(v>=0?'+':'−')+money(Math.abs(v));
  const offer=(p,K)=>{const income=Math.round(smEst(p,K.k)*f),net=income-K.c;return `<button class="btn small sm-offer" data-a="smGo" data-v="${p.id}:${K.k}" title="${K.l} 홍보 시작"><b>${K.l} 홍보</b><span>비용 ${money(K.c)}</span><span>추가 수입 예상 ${money(income)}</span><strong class="sm-net ${net>=0?'good':'bad'}">예상 순이익 ${signed(net)}</strong></button>`;};
  const row=p=>{const s=starPower(p),active=smActive(p),K=active?SMK.find(x=>x.k===p.smk.k):null;
    return `<div class="smr"><div class="sm-player"><button class="lnk" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b></button><span class="small muted">이름값 ${s}점${p.hype&&p.hype.until>=G.day&&p.hype.v>0?' · 언론 관심 상승 중':''}</span></div>${active?`<div class="sm-active"><span class="pill good">${K.l} 홍보 중</span><span class="small">비용 ${money(K.c)} · 캠페인 수입 예상 ${money(Math.round(smEst(p,K.k)*(p.smk.f??1)))}</span><b class="small ${Math.round(smEst(p,K.k)*(p.smk.f??1))-K.c>=0?'good':'bad'}">예상 순이익 ${signed(Math.round(smEst(p,K.k)*(p.smk.f??1))-K.c)}</b></div>`:`<div class="smb">${SMK.map(K=>offer(p,K)).join('')}</div>`}</div>`;};
  return csec('선수 이름값과 홍보 수입',`<div class="star-marketing"><p class="small tipme"><b>스타파워 = 선수의 이름값.</b> 수상·기록·활약으로 쌓이는 게임 속 홍보 지수입니다. 이름값이 높은 선수의 유니폼·굿즈·광고 수요가 수입으로 이어집니다.</p>
    <dl class="sm-summary"><div><dt>자동 수입 예상</dt><dd>${money(total-bonus)}</dd><small>상위 3명 이름값 합계 ${T.v}점</small></div><div><dt>진행·종료한 홍보의 추가 수입</dt><dd>${money(bonus)}</dd><small>이번 결산에 반영할 예상액</small></div><div><dt>수입 합계 · 비용 차감 전</dt><dd>${money(total)}</dd><small>시즌 결산 때 정산</small></div></dl>
    <p class="small tipme"><b>기본 수입은 별도 조작 없이 들어옵니다.</b> 아래 홍보는 돈을 더 써서 추가 수입을 얻는 선택입니다. 매년 정하는 구단 전체 마케팅 예산과는 별도입니다.</p>
    ${C.length?`<div class="eyebrow">선수별 추가 홍보 · 선택 사항</div><p class="small muted">예상 순이익 = 추가 수입 − 홍보 비용. 예를 들어 1억을 써서 1.4억이 들어오면 순이익은 +4천만입니다. 결산까지 남은 기간이 짧으면 수입도 줄어듭니다.</p><div class="sml">${C.map(row).join('')}</div><p class="small muted">비용은 시작할 때 올해 지출에 반영됩니다. 수입은 선수 이름값과 잔여 기간에 따라 달라지며 확정액이 아닙니다. 홍보를 시작하면 팬 관심과 선수 기분도 오릅니다.</p>`:'<p class="small muted keep">지금은 홍보할 선수가 없습니다.</p>'}
    ${UI.smMsg?`<div class="note">${esc(UI.smMsg)}</div>`:''}
    <details class="candidate-help"><summary class="small muted">이름값은 어떻게 정해지나요?</summary><p class="small muted">최근 3년 수상, 올해·작년 대기록, 올해 WAR 4 이상 활약과 언론 홍보를 반영합니다. 오래된 수상 효과는 줄어들고, 외국인 선수는 60%를 반영합니다. 구단 자동 수입에는 상위 3명의 합계를 사용하고, 추가 홍보는 대상 선수의 점수를 사용합니다.</p></details></div>`);
}
/* ---------- FA 보상 절차: 보호선수 명단 · 보상선수 지명 ---------- */
function compRuleTxt(){ return `A등급(3년 평균 연봉 구단 3위·리그 30위 이내): 보호선수 외 1명 + 직전 연봉 200%, 또는 선수 없이 300%. B등급(구단 10위·리그 60위 이내, 또는 두 번째 FA): 보호선수 외 1명 + 100%, 또는 200%. 보호선수는 A 20명, B 25명입니다(소속선수 한도 ${ROSTER_MAX}명).`+'  C등급(그 밖, 만 35세 이상, 세 번째 이상 FA): 선수 없이 150%. 외국인, 올해 신인, 군 복무 중인 선수, 이번 겨울 FA 계약 선수는 저절로 보호됩니다. FA 자격은 고졸 8시즌, 대졸 7시즌입니다.'; }
/* 보호명단은 보상 건(카드)마다 따로 든다: 두 건을 함께 열어도 다른 카드 명단이 제출되지 않게(검수 11-09r) */
function protOf(c){ const M=UI.prot&&!UI.prot.ids?UI.prot:(UI.prot={}); if(M[c.id])return M[c.id]; const n=COMP[c.grade].prot, pool=new Set(compPool(G.user).map(q=>q.id)); const last=(G.protLast&&G.protLast.y===stoveY()?G.protLast.ids:[]).filter(id=>pool.has(id)).slice(0,n); /* 같은 겨울 앞서 낸 보호명단을 먼저 채운다(플레이 테스트 11-13: FA마다 25명을 처음부터) */ const fill=aiProtect(G.user,n+last.length).filter(id=>!last.includes(id)); return M[c.id]=[...last,...fill].slice(0,n); }
function protByOvr(c){ return compPool(G.user).sort((a,b)=>ovr(b)-ovr(a)).slice(0,COMP[c.grade].prot).map(q=>q.id); }
function compView(){ const L=(G.comp||[]).filter(c=>c.from===G.user||c.to===G.user); if(!L.length)return '';
  const open=L.filter(c=>c.stage!=='done'); const done=L.filter(c=>c.stage==='done').slice(0,6);
  const one=c=>{ const g=COMP[c.grade];
    if(c.stage==='protect'&&c.to===G.user){ const S=new Set(protOf(c)); /* 정렬·필터(리아네트 11-11: 잠재력 별을 보기 편하게) */
      const RPm=new Map(compPool(G.user).map(q=>[q.id,(()=>{ try{ return scoutReport(q); }catch(e){ return null; } })()])); const stOf=q=>{ const rp=RPm.get(q.id); try{ return rp&&rp.ofp!=null?potTierP(rp,q).st:-1; }catch(e){ return -1; } };
      const sk=UI.prS||'ovr', fk=UI.prF||'all'; const SRT={ovr:(a,b)=>ovr(b)-ovr(a),pot:(a,b)=>stOf(b)-stOf(a)||ovr(b)-ovr(a),age:(a,b)=>a.age-b.age||ovr(b)-ovr(a),sal:(a,b)=>b.sal-a.sal};
      const all=compPool(G.user); const pool=all.filter(q=>fk==='all'||(fk==='P'?q.isP:fk==='B'?!q.isP:fk==='on'?S.has(q.id):!S.has(q.id))).sort(SRT[sk]||SRT.ovr);
      const chip=(k,cur,L)=>`<div class="chips">${L.map(([v,l])=>`<button class="${cur===v?'on':''}" data-a="protOpt" data-v="${k}:${v}">${l}</button>`).join('')}</div>`;
      const ctl=`<div class="pr-ctl">${chip('s',sk,[['ovr','종합 능력순'],['pot','잠재력순'],['age','나이 어린순'],['sal','연봉순']])}${chip('f',fk,[['all',`전체 ${all.length}`],['P','투수'],['B','타자'],['on',`보호 ${S.size}`],['off',`노출 ${all.length-S.size}`]])}</div>`;
      const auto=domestic(G.user).concat(awayOf(G.user)).filter(q=>!q.foreign&&autoProt(q)&&q.id!==c.pid);
      return `<section class="card cpbox"><div class="row between"><h2 class="sec">보호선수 명단 · ${esc(c.name)} 영입 보상</h2><span class="small muted">${dmd(c.exp)}까지</span></div>
        <p class="small">${tname(c.from)}에 보상해야 합니다(${c.grade}등급). 보호할 선수 <b>${S.size}/${g.prot}</b>명. 누르면 보호·해제됩니다. 명단 밖에서 상대가 1명을 데려가거나 돈으로 받습니다.</p>
        ${ctl}<div class="prl">${pool.map(q=>`<button class="pr ${S.has(q.id)?'on':''}" data-a="protTog" data-v="${c.id}:${q.id}">${avImg(q)}<span><b>${esc(q.name)}</b><i>${posLabel(q)} · ${q.age}세 · ${money(q.sal)}</i></span><span class="pr-v"><small>현재</small>${rchip(Math.round(ovr(q)))}</span><span class="pr-v pr-pot"><small>잠재</small>${potChip(RPm.get(q.id),q)}</span><em>${S.has(q.id)?'보호':'노출'}</em></button>`).join('')||'<p class="small muted">이 조건에 맞는 선수가 없습니다.</p>'}</div>
        ${auto.length?`<p class="small muted">저절로 보호: ${auto.map(q=>esc(q.name)).join(', ')}</p>`:''}
        <div class="btns"><button class="btn primary" data-a="protSubmit" data-v="${c.id}" ${S.size>g.prot?'disabled':''}>명단 제출 (${S.size}/${g.prot})</button><button class="btn" data-a="protAuto" data-v="${c.id}">운영팀 추천 순으로 다시 채우기</button><button class="btn" data-a="protAuto" data-v="${c.id}:ovr">종합 능력 순으로 다시 채우기</button></div>
        <p class="small muted">운영팀 추천은 능력에 나이·잠재력·연봉을 함께 따진 순서이고, 기한까지 내지 않으면 이 순서로 제출됩니다.</p></section>`; }
    if(c.stage==='pick'&&c.from===G.user){ const ft=team(G.user); const sk=UI.cpS||'ovr', fk=UI.cpF||'all'; const RP=new Map(compCands(c).map(q=>[q.id,scoutReport(q)])); /* 후보는 모두 보여 주고 정렬·필터는 칩으로(검수 11-09r) */
      const pv=q=>RP.get(q.id).ofp??RP.get(q.id).cur; const cand=compCands(c).filter(q=>fk==='all'||(fk==='P'?q.isP:!q.isP)).sort(sk==='pot'?(a,b)=>pv(b)-pv(a):sk==='sal'?(a,b)=>a.sal-b.sal:sk==='age'?(a,b)=>a.age-b.age:(a,b)=>ovr(b)-ovr(a));
      const chips=(k,cur,L)=>`<div class="chips">${L.map(([v,l])=>`<button class="${cur===v?'on':''}" data-a="cpOpt" data-v="${k}:${v}">${l}</button>`).join('')}</div>`;
      return `<section class="card cpbox"><div class="row between"><h2 class="sec">보상선수 지명 · ${esc(c.name)} 이적 보상</h2><span class="small muted">${dmd(c.exp)}까지</span></div>
        <p class="small">${tname(c.to)} 보호명단 밖 선수입니다(${c.grade}등급, 보호 ${g.prot}명). 선수 1명 + 직전 연봉 ${g.withP*100}% <b>${money(c.prev*g.withP)}</b>, 또는 선수 없이 ${g.cash*100}% <b>${money(c.prev*g.cash)}</b>.</p>
        <div class="btns"><button class="btn" data-a="compPick" data-v="${c.id}:0">선수 없이 ${money(c.prev*g.cash)} 받기</button></div>
        ${RP.size?chips('S',sk,[['ovr','종합 능력'],['pot','잠재력'],['sal','연봉 낮은 순'],['age','나이 어린 순']])+chips('F',fk,[['all',`전체 ${RP.size}`],['P','투수'],['H','야수']]):''}
        ${cand.length?'':`<p class="small muted">${RP.size?'이 조건에 맞는 후보가 없습니다.':'보호명단 밖에 데려올 만한 선수가 없습니다.'}</p>`}<div class="cp-list">${cand.map(q=>{ const rp=RP.get(q.id); return `<div class="cp-r"><button class="lnk cp-n" data-a="player" data-v="${q.id}">${esc(q.name)}</button><span class="small muted">${posLabel(q)} · ${q.age}세 · ${money(q.sal)}</span>${rchip(rp.cur)}${rp.ofp!=null?potChip(rp,q):'<span></span>'}<button class="btn small primary" data-a="compPick" data-v="${c.id}:${q.id}">지명</button></div>`; }).join('')}</div></section>`; }
    return ''; };
  return open.map(one).join('')+(done.length?`<details class="cp-done"><summary class="small">FA 보상 기록 ${done.length}건</summary><div class="rql">${done.slice(0,20).map(c=>`<div class="rq"><span class="pill ${c.from===G.user?'good':'warn'}">${c.from===G.user?'받음':'내줌'}</span><div><b>${esc(c.name)} (${c.grade}등급) ${c.from===G.user?`→ ${tshort(c.to)}`:`← ${tshort(c.from)}`}</b><span>${c.player?`보상선수 ${esc(c.player)} + `:'선수 없이 '}${money(c.cash||0)}</span><i>${dsh(c.done||c.day)}</i></div></div>`).join('')}</div></details>`:''); } /* 기록은 접어서: 펼친 채 화면을 차지해 FA 계약 칸이 아래로 밀리던 문제 */

