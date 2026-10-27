/* ---------- 감독 요청 · 구단주 요청 ---------- */
const RST={ask:['답변 대기','warn'],open:['진행 중','acc'],done:['들어줌','good'],no:['거절','bad'],fail:['못 지킴','bad'],half:['매물 등록만','']};
function reqLine(r){ const p=r.data&&r.data.pid!=null?G.players[r.data.pid]:r.data&&r.data.target!=null?G.players[r.data.target]:null; const st=RST[r.st]||['',''];
  const what=r.k==='slot'?`${SLOTK[r.data.sk]} 보강${p?` · 추천 ${p.name}`:''}`:r.k==='out'?`${p?p.name:'선수'} 정리`:r.k==='frep'?`외국인 ${p?p.name:''} 교체`:r.k==='fa'?`FA ${p?p.name:''} 영입`:`드래프트 ${DPOL[r.data.pol]}`;
  const act=r.st!=='open'?'':r.k==='slot'?`${p?`<button class="btn small primary" data-a="toTrade" data-v="${p.id}">트레이드 협상</button>`:''}<button class="btn small${p?'':' primary'}" data-a="rqSlot" data-v="${r.data.sk}">후보 찾기</button>`:r.k==='out'?`<button class="btn small" data-a="go" data-v="trade:offers">매물 보기</button>`:r.k==='frep'?`<button class="btn small primary" data-a="go" data-v="transfer:foreign">외국인 시장</button>`:r.k==='fa'&&p?`<button class="btn small primary" data-a="faOpen" data-v="${p.id}">협상실</button>`:r.k==='draft'?`<button class="btn small" data-a="go" data-v="scout:draft">드래프트</button>`:'';
  return `<div class="rq"><span class="pill ${st[1]}">${st[0]}</span><div><b>${MREQK[r.k]}</b><span>${esc(what)}</span><i>${dsh(r.day)}${r.st==='open'&&r.until?` · ${dmd(r.until)}까지 (D-${Math.max(0,r.until-G.day)})`:''}</i></div>${act}</div>`; }
function mreqView(){ const L=mreqs().slice(0,10); const m=G.mgr[G.user];
  return csec('감독의 요청',(L.length?`<div class="rql">${L.map(reqLine).join('')}</div>`:'<p class="small muted">아직 감독이 따로 요청한 일이 없습니다.</p>')+`<p class="small muted">감독은 시즌 중 약한 자리 보강, 부진한 선수 정리, 외국인 교체를 먼저 요청하고, 8월 말에는 드래프트 기조를, FA 기간에는 꼭 잡고 싶은 선수를 말합니다. 들어주면 관계가 오르고, 약속하고 못 지키면 크게 깎입니다.${m&&m.ego>=70?' 고집 센 감독이라 거절하면 더 서운해합니다.':''}</p>`); }
function grantLine(g){ const p=g.pur&&g.pur.pid!=null?G.players[g.pur.pid]:null; const st=g.ok?(RST[g.st]||['승인','good']):['반려','bad']; const st2=g.ok&&g.st==='done'&&!g.pur?['승인','good']:st;
  return `<div class="rq"><span class="pill ${st2[1]}">${st2[0]}</span><div><b>${g.by==='own'?'구단주 주문':'단장 요청'} · ${money(g.amt)}</b><span>${g.pur?g.pur.k==='fa'?`FA ${esc(p?p.name:'')} 영입`:g.pur.k==='frep'?'외국인 교체':'전력 보강':'운영비 증액'}</span><i>${dsh(g.d)}${g.st==='open'&&g.until?` · ${dmd(g.until)}까지`:''}</i></div></div>`; }
function ownerAskView(){ const t=team(G.user); if(t.indie)return csec('구단주에게 요청','<p class="small muted">독립구단이라 모기업 지원이 없습니다. 스폰서와 자체 수익으로 운영합니다.</p>');
  const left=ownAskLeft(); const b=budget(); const amts=[1000,2000,3000];
  const faL=G.fa&&G.fa.open&&!G.fa.closed?G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null).sort((a,c)=>ovr(c)-ovr(a)).slice(0,4):[];
  const bad=foreignOf(G.user).filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=60&&pRate(h).era>5):(h.pa>=100&&bRate(h).ops<.700)); });
  const btn=(l,v,amt,pur)=>{ const o=ownOdds(amt,pur); return `<button class="oa" data-a="ownAsk" data-v="${v}" ${left?'':'disabled'}><b>${l}</b><span>${money(amt)} · ${oddsTxt(o)}</span></button>`; };
  const H=grants().slice(0,8);
  return csec('구단주에게 요청',`<p class="small">지금 예산 여유 <b>${money(b.roomGoal)}</b> · 올해 추가 지원 ${money(grantAmt())} · 구단주 신뢰 ${t.trust}</p>
    <div class="oag">${amts.map(a=>btn(`운영비 증액`,`gen:${a}`,a,null)).join('')}
      ${faL.map(p=>btn(`FA ${esc(p.name)} 영입 자금`,`fa:${p.id}`,p.ask.annual,{k:'fa',pid:p.id})).join('')}
      ${bad.map(p=>btn(`외국인 ${esc(p.name)} 교체 자금`,`frep:${p.id}`,round5(Math.max(500,p.sal*.6)),{k:'frep',pid:p.id})).join('')}</div>
    <p class="small muted">${left?'한 달에 한 번 요청할 수 있습니다.':'이번 달에는 이미 요청했습니다.'} 승인 여부는 구단주 신뢰, 성향(${OWNER[t.owner].label}), 순위, 요청 금액과 목적에 따라 달라집니다. 반려되면 신뢰 -1, 한 해에 자주 요청할수록 승인이 어려워집니다. 목적을 정해 받은 돈은 그 목적을 이루면 신뢰가 오르고, 못 이루면 깎입니다. 구단주가 먼저 스타 FA 영입이나 7월 우승 보강을 주문하며 돈을 내놓기도 합니다.</p>
    ${H.length?`<div class="eyebrow" style="margin-top:8px">요청·지원 기록</div><div class="rql">${H.map(grantLine).join('')}</div>`:''}`); }
function reqHomeCard(){ const M=mreqs().filter(r=>r.st==='open'); const O=grants().filter(g=>g.st==='open'&&g.pur); if(!M.length&&!O.length)return '';
  return `<section class="card"><div class="row between"><h2 class="sec">약속한 일</h2><button class="btn small" data-a="go" data-v="staff:mgr">감독 요청</button></div><div class="rql">${M.map(reqLine).join('')}${O.map(grantLine).join('')}</div></section>`; }

/* ---------- 감독과의 공생 화면 ---------- */
function mgrUseStats(){ const ps=playersOf(G.user); const sp=ps.filter(p=>isSPr(p)); const pc=[]; for(const g of (G.games||[]).slice(0,10)){ const side=g.box&&(g.home===G.user?g.box.h:g.away===G.user?g.box.a:null); if(side&&side.pit&&side.pit[0])pc.push(side.pit[0].pc||0); }
  const tired=ps.filter(p=>(p.fat||0)>=60).length; const inj=ps.filter(p=>p.injOut>0).length; const injY=ps.reduce((a,p)=>a+(p.injHist||[]).filter(h=>h.y===G.year).length,0);
  return {avgPc:pc.length?Math.round(sum(pc)/pc.length):null,tired,inj,injY}; }
function mgrBondView(){ const m=G.mgr[G.user]; if(!m||m.interim)return ''; mgrAttr(m); const d=mgrDir(); const u=mgrUseStats(); const bo=mgrRelBoost({team:G.user});
  const dirBox=(k,l,desc,cur)=>{ const x=d[k]; const st=!x?'지시 없음':x.mid!==m.id?'지시 없음':x.ok?'따르는 중':'거부함'; return `<div class="mdir"><div><b>${l}</b><span class="small muted">${desc} · 감독 본래 ${cur}</span></div><span class="pill ${x&&x.mid===m.id?(x.ok?'good':'bad'):''}">${st}</span><button class="btn small ${x&&x.mid===m.id&&x.ok?'':'primary'}" data-a="mgrDir" data-v="${k}:${x&&x.mid===m.id&&x.ok?0:1}">${x&&x.mid===m.id&&x.ok?'지시 해제':'지시하기'}</button></div>`; };
  const P=G.mpick&&G.mpick.y===G.year&&G.mpick.mid===m.id?G.mpick:null; const picks=P?P.ids.map(id=>G.players[id]).filter(Boolean):[];
  const log=(G.mpickLog||[]).filter(x=>x.mid===m.id).slice(0,4);
  return csec('감독과의 호흡',`<div class="mbond"><div><span class="small muted">관계</span><b class="num" style="color:${relCol(m.rel)}">${m.rel}</b><i>${relLabel(m.rel)}</i></div><div><span class="small muted">선수단 경기력</span><b class="num" style="color:${bo>=0?'var(--good)':'var(--bad)'}">${bo>=0?'+':''}${bo.toFixed(2)}</b><i>관계에서 오는 보정</i></div><div><span class="small muted">선수 보는 눈</span><b class="num" style="color:${rcol(m.eye)}">${m.eye}</b><i>잠재력 예측 오차 ±${Math.max(1.5,9.5-m.eye/10).toFixed(1)}</i></div></div>
    <p class="small muted">관계가 좋을수록 선수단이 더 잘 뛰고(최대 +0.4), 지시를 잘 따르고, 선수 정보에서 감독의 솔직한 잠재력 예측을 볼 수 있습니다(관계 30 미만이면 말을 아낍니다). 관계 78 이상이면 언론에 "호흡 최고" 기사가 나고, 25 이하면 불화설이 돌며 고집 센 감독은 스스로 물러나기도 합니다.</p>
    <div class="eyebrow" style="margin-top:8px">감독이 미는 선수</div>${picks.length?`<div class="intl">${picks.map(p=>`<button class="pill ${P.back?'good':''}" data-a="player" data-v="${p.id}">${esc(p.name)} · ${posLabel(p)} ${p.age}세</button>`).join('')}</div><p class="small">${P.back?'함께 밀어주는 중 · 올해 성장 속도 +30%':P.back===false?'단장이 성적을 우선했습니다':'답변 대기'}</p>`:'<p class="small muted">시즌이 시작되면 감독이 올해 키우고 싶은 젊은 선수를 고릅니다.</p>'}
    ${log.length?`<p class="small muted">지난 안목 기록: ${log.map(x=>`${x.y} ${esc(x.txt)}${x.back?' (함께 밀어줌)':''}`).join(' / ')} (겨울 종합 능력 변화)</p>`:''}
    <div class="eyebrow" style="margin-top:8px">운용 성향과 단장 지시</div>
    ${dirBox('rest','주전 휴식 보장','피로한 주전을 일찍 쉬게 해 부상을 줄입니다. 대신 쉬는 날은 벤치가 나갑니다',`휴식 관리 ${m.rest}`)}
    ${dirBox('arm','투수 관리(혹사 금지)','선발 투구 수와 불펜 연투를 줄여 투수 부상을 막습니다. 접전에서 필승조를 덜 씁니다',`투수 혹사 ${m.arm}`)}
    <p class="small">최근 10경기 선발 평균 투구 수 <b>${u.avgPc??'-'}</b> · 피로 60 이상 ${u.tired}명 · 지금 부상 ${u.inj}명 · 올해 부상 ${u.injY}건</p>
    <p class="small muted">휴식 관리가 낮은 감독은 주전을 끝까지 써서 전력이 안정적이지만 피로와 부상이 쌓입니다. 투수 혹사가 높은 감독은 선발을 길게 끌고 필승조를 연투시켜 접전에 강하지만 투수 부상이 늘어납니다. 지시는 관계와 감독 고집에 따라 거부될 수 있고, 그래도 안 되면 시즌 중에도 감독을 교체할 수 있습니다(감독대행 체제 후 새 감독 선임).</p>
    ${UI.dirMsg?`<div class="note">${esc(UI.dirMsg)}</div>`:''}`); }
function mgrOpinion(p){ const v=mgrView(p); if(!v)return ''; const m=G.mgr[G.user]; if(v.mute)return `<div class="mop"><b>감독 의견</b><span class="small muted">${esc(m.name)} 감독이 말을 아낍니다(관계 30 미만).</span></div>`;
  const pk=G.mpick&&G.mpick.y===G.year&&G.mpick.ids.includes(p.id);
  return `<div class="mop"><b>감독 의견${pk?' · <span class="pill good">감독이 미는 선수</span>':''}</b><span>"${esc(v.line)}." 잠재력 예상 <b style="color:${rcol(v.fut)}">${v.fut}</b></span><span class="small muted">${esc(m.name)} 감독 · 안목 ${v.eye} (오차 ±${v.sd.toFixed(1)}). 스카우트 평가와 다르면 안목이 높은 쪽을 믿는 편이 낫습니다.</span></div>`; }
function starPanel(){ const T=teamStar(G.user); const L=T.L;
  return csec('스타 파워와 마케팅',`<p class="small">우리 팀 스타 파워 <b>${T.v}</b> · 올해 스타 마케팅 수입 예상 <b>${money(starIncome(G.user))}</b></p>${L.length?`<div class="intl">${L.map(x=>`<button class="pill good" data-a="player" data-v="${x.p.id}">${esc(x.p.name)} · ${x.s}</button>`).join('')}</div>`:''}
    <p class="small muted">최근 3년 수상(MVP 40, 신인왕 20, 골든글러브 15), 올해·작년 대기록, 올해 WAR 4 이상 활약이 스타 파워가 됩니다. 상위 3명 합계가 유니폼·광고 수입으로 이어지고, 홍보를 중시하는 구단주는 스타가 생기면 신뢰를 더 줍니다. 외국인은 60%만 반영됩니다.</p>`); }

/* ---------- FA 보상 절차: 보호선수 명단 · 보상선수 지명 ---------- */
function gradeWhy(p){ const n=p.faN||(p.lastFA!=null?1:0); if(p.age>=35)return '만 35세 이상'; if(n>=2)return `${n+1}번째 FA`; if(n===1)return `두 번째 FA (지난 FA ${p.faPrevGrade||'A·B'}등급)`; return p.faRank?`3년 평균 연봉 구단 ${p.faRank.tm}위 · 리그 ${p.faRank.lg}위`:''; }
function compRuleTxt(){ return `A등급(3년 평균 연봉 구단 3위·리그 30위 이내): 보호선수 외 1명 + 직전 연봉 200%, 또는 선수 없이 300%. B등급(구단 10위·리그 60위 이내, 또는 두 번째 FA): 보호선수 외 1명 + 100%, 또는 200%. 보호선수는 A 20명, B 25명입니다(소속선수 한도 ${ROSTER_MAX}명).`+'  C등급(그 밖, 만 35세 이상, 세 번째 이상 FA): 선수 없이 150%. 외국인, 올해 신인, 군 복무 중인 선수, 이번 겨울 FA 계약 선수는 저절로 보호됩니다. FA 자격은 고졸 8시즌, 대졸 7시즌입니다.'; }
function compView(){ const L=(G.comp||[]).filter(c=>c.from===G.user||c.to===G.user); if(!L.length)return '';
  const open=L.filter(c=>c.stage!=='done'); const done=L.filter(c=>c.stage==='done').slice(0,6);
  const one=c=>{ const g=COMP[c.grade];
    if(c.stage==='protect'&&c.to===G.user){ const pool=compPool(G.user).sort((a,b)=>ovr(b)-ovr(a)); UI.prot=UI.prot&&UI.prot.id===c.id?UI.prot:{id:c.id,ids:aiProtect(G.user,g.prot)}; const S=new Set(UI.prot.ids);
      const auto=domestic(G.user).concat(awayOf(G.user)).filter(q=>!q.foreign&&autoProt(q)&&q.id!==c.pid);
      return `<section class="card cpbox"><div class="row between"><h2 class="sec">보호선수 명단 · ${esc(c.name)} 영입 보상</h2><span class="small muted">${dmd(c.exp)}까지</span></div>
        <p class="small">${tname(c.from)}에 보상해야 합니다(${c.grade}등급). 보호할 선수 <b>${S.size}/${g.prot}</b>명. 누르면 보호·해제됩니다. 명단 밖에서 상대가 1명을 데려가거나 돈으로 받습니다.</p>
        <div class="prl">${pool.map(q=>`<button class="pr ${S.has(q.id)?'on':''}" data-a="protTog" data-v="${q.id}">${avImg(q)}<span><b>${esc(q.name)}</b><i>${posLabel(q)} · ${q.age}세 · ${money(q.sal)}</i></span>${rchip(Math.round(ovr(q)))}<em>${S.has(q.id)?'보호':'노출'}</em></button>`).join('')}</div>
        ${auto.length?`<p class="small muted">저절로 보호: ${auto.map(q=>esc(q.name)).join(', ')}</p>`:''}
        <div class="btns"><button class="btn primary" data-a="protSubmit" data-v="${c.id}" ${S.size>g.prot?'disabled':''}>명단 제출 (${S.size}/${g.prot})</button><button class="btn" data-a="protAuto" data-v="${c.id}">능력 순으로 다시 채우기</button></div></section>`; }
    if(c.stage==='pick'&&c.from===G.user){ const ft=team(G.user); const cand=compPool(c.to).filter(q=>!c.prot.includes(q.id)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,24);
      return `<section class="card cpbox"><div class="row between"><h2 class="sec">보상선수 지명 · ${esc(c.name)} 이적 보상</h2><span class="small muted">${dmd(c.exp)}까지</span></div>
        <p class="small">${tname(c.to)} 보호명단 밖 선수입니다(${c.grade}등급, 보호 ${g.prot}명). 선수 1명 + 직전 연봉 ${g.withP*100}% <b>${money(c.prev*g.withP)}</b>, 또는 선수 없이 ${g.cash*100}% <b>${money(c.prev*g.cash)}</b>.</p>
        ${cand.length?'':'<p class="small muted">보호명단 밖에 데려올 만한 선수가 없습니다.</p>'}<div class="tgrid">${cand.map(q=>pcard(q,{sub:`${posLabel(q)} · ${q.age}세 · ${hand(q)}`,foot:`<b class="num">${money(q.sal)}</b><span>${q.faC?`FA계약 ${q.yrs}년`:`FA까지 ${Math.max(0,faSvc(q)-q.svc)}년`}</span><button class="tc-i go" data-a="compPick" data-v="${c.id}:${q.id}">지명</button>`})).join('')}</div>
        <div class="btns"><button class="btn" data-a="compPick" data-v="${c.id}:0">선수 없이 ${money(c.prev*g.cash)} 받기</button></div></section>`; }
    return ''; };
  return open.map(one).join('')+(done.length?csec('FA 보상 기록',`<div class="rql">${done.map(c=>`<div class="rq"><span class="pill ${c.from===G.user?'good':'warn'}">${c.from===G.user?'받음':'내줌'}</span><div><b>${esc(c.name)} (${c.grade}등급) ${c.from===G.user?`→ ${tshort(c.to)}`:`← ${tshort(c.from)}`}</b><span>${c.player?`보상선수 ${esc(c.player)} + `:'선수 없이 '}${money(c.cash||0)}</span><i>${dsh(c.done||c.day)}</i></div></div>`).join('')}</div>`):''); }

