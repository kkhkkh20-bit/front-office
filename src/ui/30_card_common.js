/* 포지션별 리그 순위 칸: click이면 누르면 전력 비교로 간다 */
function slotBar(rk,click){ return `<div class="slotbar">${PSLOTS.map(k=>click?`<button class="sl ${rkCls(rk[k].rank)}" data-a="cmpGo" data-v="${k}"><span>${SLOTS_S[k]}</span><b>${rk[k].rank}위</b></button>`:`<span class="sl ${rkCls(rk[k].rank)}"><span>${SLOTS_S[k]}</span><b>${rk[k].rank}위</b></span>`).join('')}</div>`; }
/* ---------- 카드 공용 ---------- */
function rosterFoot(p){ const m=p.mor??60; const own=p.team===G.user;
  return `<span class="pc-sal"><b class="num">${money(p.sal)}</b> ${p.foreign?(p.foreign==='아시아'?'아시아쿼터':'외국인'):tContract(p)}</span>${p.injOut>0?`<span class="pill bad">부상 ${p.injOut}일</span>`:''}${p.listed?'<span class="pill warn">매물</span>':''}${own?`<span class="mood" style="--c:${m>=65?'var(--good)':m>=45?'var(--r50)':m>=30?'var(--warn)':'var(--bad)'}" title="기분: ${moodLabel(m)}"></span>`:''}`; }
function cgrid(ps,o){ o=o||{}; return `<div class="tgrid">${ps.map(p=>pcard(p,Object.assign({foot:rosterFoot(p)},typeof o==='function'?o(p):o))).join('')}</div>`; }
function sqCards(groups){
  return groups.filter(g=>g[1].length).map(([g,arr,posf])=>`<div class="grp-h"><span>${g}</span><i>${arr.length}명</i></div>${cgrid(arr,p=>({sub:`${posf&&p.isP?posf(p)+' · ':''}${p.age}세 · ${hand(p)}`}))}`).join('');
}
function trimCard(){
  const n=rosterN(G.user); if(n<=ROSTER_MAX)return '';
  const over=n-ROSTER_MAX; const c=trimCands(over+4);
  return `<section class="card hero"><div class="row between"><h2 class="sec">로스터 정리</h2><span class="pill bad">${n}/${ROSTER_MAX} · ${over}명 초과</span></div>
    <p class="small">개막 전까지 ${ROSTER_MAX}명 이하로 줄여야 합니다. 아래는 코치진이 꼽은 방출 후보(현재 기량과 성장 여지가 낮은 순)입니다. FA·다년계약 선수를 방출하면 남은 계약의 절반을 정산합니다. 연봉 1억 원 이하 선수는 방출 대신 육성선수(정식 로스터 밖, 최대 15명)로 돌릴 수 있습니다.</p>
    <div class="tgrid">${c.map(p=>pcard(p,{foot:`${rosterFoot(p)}${!p.faC&&p.sal<=100&&ysN(G.user)<YS_MAX?`<button class="tc-i" data-a="ysNow" data-v="${p.id}">육성 전환</button>`:''}<button class="tc-i" data-a="relNow" data-v="${p.id}">방출${p.faC?` (정산 ${money(Math.round(p.sal*p.yrs*.5))})`:''}</button>`})).join('')}</div>
    <button class="btn danger" data-a="autoTrim">추천대로 ${over}명 방출</button></section>`;
}
/* 다른 구단 요약: 리그 화면을 벗어나지 않고 본다 */
function teamSheet(tid){ const t=team(tid); if(!t)return ''; const g=gmOf(tid); const m=G.mgr[tid]; const rk=slotRanks(tid);
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="${esc(tname(tid))}">
    <div class="sheet-head"><div><div class="eyebrow">구단 정보</div><h2 class="sec">${esc(tname(tid))}</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    ${teamCard(t).replace(/ data-a="[a-zA-Z]+" data-v="[^"]*" role="button" tabindex="0"/,'').replace(/<button[^>]*data-a="tpartnerGo"[^>]*>[^<]*<\/button>/g,'')}
    <dl class="kv"><dt>단장</dt><dd>${g?`${esc(g.name)} · ${GMT[g.trait].l} · 친분 ${t.rel}`:'-'}</dd><dt>구단 사정</dt><dd>${esc(needText(tid))}</dd></dl>
    <div class="eyebrow">포지션별 리그 순위</div>${slotBar(rk)}
    <div class="row" style="margin-top:10px"><button class="btn primary" data-a="lteam" data-v="${tid}">선수단 보기</button>${tradeOpen()?`<button class="btn" data-a="tpartnerGo" data-v="${tid}">트레이드 협상</button>`:''}</div>
  </div></div>`; }
function teamCard(t){
  const live=period()==='season'||period()==='post'; const st=live?standingsNow():(G.history[G.history.length-1]||{}).order||[];
  const rk=st.findIndex(o=>o.tid===t.id)+1; const rec=st.find(o=>o.tid===t.id);
  const top=playersOf(t.id).map(p=>({p,v:ovr(p)})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.p);
  const m=G.mgr[t.id]; const ci=capInfo(t.id); const me=t.id===G.user;
  return `<div class="tcard teamc${me?' me':''}" data-a="${me?'tab':'lteam'}" data-v="${me?'roster':t.id}" role="button" tabindex="0" style="--th:${tpal(t)[0]}">
    <div class="tc-top">${badge(t.id,46)}<div class="tc-id"><b>${esc(t.city)} ${esc(t.nick)}</b><span>${rk?`${live?'현재':'지난 시즌'} ${rk}위 · ${rec.w}승 ${rec.l}패${rec.t?` ${rec.t}무`:''}`:''}</span></div>
      <div class="tc-rt"><div><span>전력</span>${(()=>{const k=[...G.teams].sort((x,y)=>teamRating(y.id)-teamRating(x.id)).findIndex(x=>x.id===t.id)+1; return `<b class="rc" style="--c:${k<=2?'var(--r65)':k<=5?'var(--r55)':k<=8?'var(--r45)':'var(--r35)'}">${k}위</b>`;})()}</div></div></div>
    <div class="tc-arch"><span class="pill ${t.mode==='contend'?'good':'warn'}">${t.mode==='contend'?'우승 경쟁':'리빌딩'}</span><span class="pill">구단주 ${OWNER[t.owner].label}</span>${me?'<span class="pill acc">우리 구단</span>':''}</div>
    <div class="teamc-top">${top.map(p=>`<span>${avImg(p)}<b>${esc(p.name)}</b><i>${posLabel(p)}</i></span>`).join('')}</div>
    <dl class="tsum"><div><dt>감독</dt><dd>${m?esc(m.name):'빈자리'}</dd></div><div><dt>캡 산정액</dt><dd class="num" style="color:${ci.over?'var(--bad)':'inherit'}">${money(ci.pay)}</dd></div><div><dt>${me?'현금':'단장 관계'}</dt><dd class="num">${me?money(t.cash):t.rel}</dd></div></dl>
    ${me?'':`<div class="tc-ft"><span class="relbar"><i style="width:${t.rel}%"></i></span><button class="tc-i go" data-a="tpartnerGo" data-v="${t.id}">트레이드</button></div>`}
  </div>`;
}
function scoutCard(s,btn){
  return `<div class="tcard" style="cursor:default"><div class="tc-top">${avImg({id:s.fid??s.id,name:s.name,team:null,mor:66})}<div class="tc-id"><b>${esc(s.name)}${obTag(s.ob)}</b><span>${SROLE[s.role||'am']} · ${(s.role==='intl'?IREG[s.region].l:s.region)} 담당 · 연봉 ${money(s.sal)}</span></div>
    <div class="tc-rt"><div><span>능력</span><b class="stars">${'★'.repeat(s.skill)}<i>${'★'.repeat(5-s.skill)}</i></b></div></div></div>
    <p class="dnote">${['','오차가 매우 큽니다.','오차가 큰 편입니다.','평균적인 눈썰미입니다.','정확한 편입니다. 면담 평가도 가능합니다.','리그 최고 수준의 눈입니다.'][s.skill]}${s.skill>=3?' 담당 지역 선수 면담 평가를 받을 수 있습니다.':''}</p>
    <div class="tc-ft">${btn}</div></div>`;
}

