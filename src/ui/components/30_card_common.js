/* 포지션별 리그 순위 칸: click이면 누르면 전력 비교로 간다 */
/* 리그 주전 평균과 우리 주전 비교(화면 100점 척도) */
function startAvgBox(tid){ tid=tid??G.user; let A; try{ A=lgStartAvg(); }catch(e){ return ''; } const cell=(k,l)=>{ const lg=A[k], me=teamStartAvg(tid,k==='BAT'?'BAT':k); if(lg==null)return ''; const d=me==null?null:dv(me)-dv(lg); return `<span class="sa-c" title="${esc(l)}: 리그 주전 평균 ${dv(lg)}${me!=null?` · 우리 ${dv(me)}`:''}"><i>${esc(l)}</i><b>${dv(lg)}</b>${d==null?'':`<em class="${d>=0?'up':'dn'}">${d>=0?'+':''}${d}</em>`}</span>`; };
  return `<div class="eyebrow">리그 주전 평균 능력 <span class="muted">(${G.teams.length}개 구단 주전 · 초록/빨강은 우리 주전과의 차이)</span></div><div class="sa-box">${cell('BAT','야수 전체')}${PSLOTS.map(k=>cell(k,SLOTS_S[k]||SLOTK[k])).join('')}</div>`; }
function slotBar(rk,click){ return `<div class="slotbar">${PSLOTS.map(k=>click?`<button class="sl ${rkCls(rk[k].rank)}" data-a="cmpGo" data-v="${k}"><span>${SLOTS_S[k]}</span><b>${rk[k].rank}위</b></button>`:`<span class="sl ${rkCls(rk[k].rank)}"><span>${SLOTS_S[k]}</span><b>${rk[k].rank}위</b></span>`).join('')}</div>`; }
/* ---------- 카드 공용 ---------- */
function rosterFoot(p){ const m=p.mor??60; const own=p.team===G.user;
  return `<span class="pc-sal"><b class="num">${money(p.sal)}</b> ${p.foreign?(p.foreign==='아시아'?'아시아쿼터':'외국인'):tContract(p)}</span>${p.injOut>0?`<span class="pill bad">부상 ${p.injOut}일</span>`:''}${p.listed?'<span class="pill warn">매물</span>':''}${own?`<span class="mood" style="--c:${m>=65?'var(--good)':m>=45?'var(--r50)':m>=30?'var(--warn)':'var(--bad)'}" title="기분: ${moodLabel(m)}"></span>`:''}`; }
function cgrid(ps,o){ o=o||{}; return `<div class="tgrid">${ps.map(p=>pcard(p,Object.assign({foot:rosterFoot(p)},typeof o==='function'?o(p):o))).join('')}</div>`; }
function sqCards(groups){
  return groups.filter(g=>g[1].length).map(([g,arr,posf])=>`<div class="grp-h"><span>${g}</span><i>${arr.length}명</i></div>${cgrid(arr,p=>({sub:`${posf&&p.isP?posf(p)+' · ':''}${p.age}세 · ${hand(p)}`}))}`).join('');
}
/* 로스터 정리: 한도를 넘으면 늘 보이고, 아니면 '정리 모드'를 켰을 때. 카드를 눌러 여러 명 고른 뒤 한 번에 방출(카페 피드백 11-09v) */
function trimNeed(){ const n=rosterN(G.user); return n>ROSTER_MAX||n+milReturns(7).length>ROSTER_MAX; }
function trimCard(){
  const need=trimNeed(); if(UI.trimHidden&&!UI.trimOn||!need&&!UI.trimOn)return '';
  const n=rosterN(G.user), over=n-ROSTER_MAX; const ret=milReturns(14); const overAll=over+ret.length; const inSea=period()==='season';
  const pool=trimPool(), show=Math.max(need?overAll+4:10,UI.trimN||0), c=pool.slice(0,show);
  const sel=relPick(UI.trimSel); UI.trimSel=sel.map(p=>p.id); const cost=sel.reduce((s,p)=>s+relCost(p).tot,0);
  const foot=p=>`${trimUnsigned(p)?'<span class="small muted">연봉 미계약 · 방출하면 재계약하지 않음</span>':''}${rosterFoot(p)}<button class="tc-i" data-a="player" data-v="${p.id}">상세</button>${!p.ys&&!p.foreign&&!p.faC&&p.sal<=100&&ysN(G.user)<YS_MAX?`<button class="tc-i" data-a="ysNow" data-v="${p.id}">육성 전환</button>`:''}${relCost(p).tot?`<span class="small warn">정산 ${money(relCost(p).tot)}</span>`:''}`;
  return `<section class="card${need?' hero':''} trimc"><header class="trim-h"><h2 class="sec">${need?'로스터 정리':'정리 모드'}</h2><button class="btn small" data-a="trimClose">‹ 선수단으로 · 정리 종료</button><span class="pill${need?' bad':''}">${n}/${ROSTER_MAX}${need?` · ${over>0?`${over}명 초과`:`복귀 후 ${overAll}명 초과`}`:''}</span></header>
    ${ret.length&&need?`<p class="small warn"><b>군 복귀 예정 ${ret.length}명</b>: ${esc(milRetTxt(ret))}. 복귀까지 고려하면 <b>${overAll}자리</b>를 비워야 다시 막히지 않습니다.</p>`:''}<p class="small">${need?`${inSea?'지금':'개막 전까지'} ${ROSTER_MAX}명 이하로 줄여야 ${inSea?'진행할 수 있습니다':'합니다'}. `:''}코치진이 꼽은 방출 추천 후보입니다(현재 기량과 성장 여지가 낮은 순). <b>카드를 눌러 여러 명 고른 뒤 한 번에 방출</b>하세요. FA·다년계약 선수는 남은 계약의 절반을 정산합니다.${need?' 연봉 1억 원 이하 선수는 방출 대신 육성선수(정식 로스터 밖, 최대 15명)로 돌릴 수 있습니다.':''} ${hiI('육성선수는 후보에서 빠집니다. 연봉 협상 중인 선수를 방출하면 재계약하지 않고 내보냅니다.')}</p>
    <div class="tgrid">${c.map(p=>pcard(p,{act:'trimSel',on:UI.trimSel.includes(p.id),foot:foot(p)})).join('')}</div>
    <div class="pgr trim-a" aria-label="로스터 정리 실행"><button class="btn danger" data-a="relBatch" ${sel.length?'':'disabled'}>고른 ${sel.length}명 방출${cost?` · 정산 ${money(cost)}`:''}</button>${over>0?`<button class="btn" data-a="autoTrim">추천대로 ${over}명 방출</button>`:''}${pool.length>show?`<button class="btn small" data-a="trimMore">후보 더 보기</button>`:''}${(()=>{ const ys=sel.filter(p=>!p.ys&&!p.foreign&&!p.faC&&p.sal<=100); const room=Math.max(0,YS_MAX-ysN(G.user)); return ys.length&&room?`<button class="btn" data-a="ysBatch">고른 ${Math.min(ys.length,room)}명 육성선수 전환</button>`:''; })()}${sel.length?`<button class="btn" data-a="blkBatch">고른 ${sel.length}명 트레이드 매물 등록</button>`:''}${sel.length?'<button class="btn small" data-a="trimClr">선택 해제</button>':''}<button class="btn small" data-a="trimClose">정리 종료</button></div>${UI.trimMsg?`<div class="note">${esc(UI.trimMsg)}</div>`:''}</section>`;
}
/* 다른 구단 요약: 리그 화면을 벗어나지 않고 본다 */
function teamSheet(tid){ const t=team(tid); if(!t)return ''; const g=gmOf(tid); const m=G.mgr[tid]; const rk=slotRanks(tid);
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="${esc(tname(tid))}">
    <div class="sheet-head"><div><div class="eyebrow">구단 정보</div><h2 class="sec">${esc(tname(tid))}</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    ${teamCard(t).replace(/ data-a="[a-zA-Z]+" data-v="[^"]*" role="button" tabindex="0"/,'').replace(/<button[^>]*data-a="tpartnerGo"[^>]*>[^<]*<\/button>/g,'')}
    <dl class="kv"><dt>단장</dt><dd>${g?`${esc(g.name)}${g.age?` (${g.age}세)`:''} · ${GMT[g.trait].l} · 친분 ${relLabel(t.rel)}`:'-'}</dd><dt>구단 사정</dt><dd>${esc(needText(tid))}</dd></dl>
    ${teamPeople(tid)}
    <div class="eyebrow">포지션별 리그 순위</div>${slotBar(rk)}${startAvgBox(tid)}
    <div class="eyebrow" style="margin-top:10px">우승 트로피</div>${trophyCase(tid,true)}
    <div class="row" style="margin-top:10px"><button class="btn primary" data-a="teamInspect" data-v="${tid}">구단 정보·연대기</button><button class="btn" data-a="lteam" data-v="${tid}">선수단 보기</button>${tradeOpen()?`<button class="btn" data-a="tpartnerGo" data-v="${tid}">트레이드 협상</button>`:''}</div>
  </div></div>`; }
/* 다른 구단 사람들(카페 11-09c): 구단주 성향·시즌 목표, 감독, 코치진. 감독·OB 출신 코치는 누르면 인물 창 */
function teamPeople(tid){ const t=team(tid); if(!t||tid===G.user)return ''; const B=bossOf(tid), m=G.mgr[tid], C=coachesOf(tid), ow=OWNER[t.owner];
  const it=(av,nm,sub,rt,at)=>`<div class="item wa"${at||' style="cursor:default"'}>${av}<span class="nm">${nm}</span><span class="sub">${sub}</span>${rt?`<span class="rt">${rt}</span>`:''}</div>`;
  const own=it(avImg({persona:'own',pid:B.own.id,team:tid,age:B.own.age,name:B.own.name}),`구단주 ${esc(B.own.name)} <span class="pill">${esc(ow.label)}</span>`,esc(OWNTRAIT[t.owner]||ow.msg),`<span class="small">목표 ${goalRankOf(tid)}위 이내</span><br><span class="small muted">${modeLabel(t)}</span>`,` data-a="person" data-v="oown:${tid}" role="button" tabindex="0"`)+it(avImg({persona:'staff',pid:B.ceo.id,team:tid,age:B.ceo.age,name:B.ceo.name}),`사장 ${esc(B.ceo.name)}`,esc(B.ceo.car||''),'',` data-a="person" data-v="oceo:${tid}" role="button" tabindex="0"`);
  const mg=m?(mgrFix(m),it(avImg({persona:'mgr',pid:m.id,team:tid,age:m.age,name:m.name}),`감독 ${esc(m.name)} <span class="small muted">${m.age}세</span>${obTag(m.ob)}`,esc(mgrType(m).n+(m.career?' · '+m.career:'')),'',` data-a="person" data-v="omgr:${tid}" role="button" tabindex="0"`)):it('','감독 빈자리','','');
  const cs=CKEYS.filter(k=>C[k]).map(k=>{ const c=C[k]; return it(avImg({persona:'coach',pid:c.id,name:c.name,age:c.age,team:tid}),`${esc(c.name)} <span class="small muted">${c.age}세</span>${obTag(c.ob)}`,`${esc(CROLE[k].l)} · 기본 지도 ${dv(c.sk)} · 기본 육성 ${dv(c.dv)}`,'',` data-a="person" data-v="oc:${tid}:${k}" role="button" tabindex="0"`); }); /* 모든 코치를 카드로(카드 안에 OB면 선수 시절 버튼) */
  return `<div class="eyebrow" style="margin-top:10px">구단주 · 감독</div><div class="list">${own}${mg}</div><div class="eyebrow" style="margin-top:10px">코치진 ${cs.length}명</div>${cs.length?`<div class="list">${cs.join('')}</div>`:'<p class="small muted">코치가 없습니다.</p>'}`; }
function teamCard(t){
  const live=period()==='season'||period()==='post'; const st=live?standingsNow():(G.history[G.history.length-1]||{}).order||[];
  const rk=tieRank(st,t.id); const rec=st.find(o=>o.tid===t.id);
  const top=playersOf(t.id).map(p=>({p,v:ovr(p)})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.p);
  const m=G.mgr[t.id]; const ci=capInfo(t.id); const me=t.id===G.user;
  return `<div class="tcard teamc${me?' me':''}" data-a="${me?'tab':'lteam'}" data-v="${me?'roster':t.id}" role="button" tabindex="0" style="--th:${tpal(t)[0]}">
    <div class="tc-top">${badge(t.id,46)}<div class="tc-id"><b>${esc(t.city)} ${esc(t.nick)}</b><span>${rk?`${live?'현재':'지난 시즌'} ${rk}위 · ${rec.w}승 ${rec.l}패${rec.t?` ${rec.t}무`:''}`:''}</span></div>
      <div class="tc-rt"><div><span>전력</span>${(()=>{const k=preSeasonY()?projNow().findIndex(x=>x.tid===t.id)+1:(()=>{ const PR=new Map(G.teams.map(x=>[x.id,projRating(x.id)])); return [...G.teams].sort((x,y)=>PR.get(y.id)-PR.get(x.id)).findIndex(x=>x.id===t.id)+1; })(); /* 개막 전에는 홈·구단주 목표 예상 순위와 같은 값(검수 11-14) */ return `<b class="rc" style="--c:${k<=2?'var(--r65)':k<=5?'var(--r55)':k<=8?'var(--r45)':'var(--r35)'}">${k}위</b>`;})()}</div></div></div>
    <div class="tc-arch"><span class="pill ${t.mode==='contend'?'good':'warn'}">${modeLabel(t)}</span><span class="pill">구단주 ${OWNER[t.owner].label}</span>${me?'<span class="pill acc">우리 구단</span>':''}</div>
    <div class="teamc-top">${top.map(p=>`<span>${avImg(p)}<b>${esc(p.name)}</b><i>${posLabel(p)}</i></span>`).join('')}</div>
    <dl class="tsum"><div><dt>감독</dt><dd>${m?esc(m.name):'빈자리'}</dd></div><div><dt>캡 산정액</dt><dd class="num" style="color:${ci.over?'var(--bad)':'inherit'}">${money(ci.pay)}</dd></div><div><dt>${me?'현금':'단장 관계'}</dt><dd class="num">${me?money(t.cash):t.rel}</dd></div></dl>
    ${me?'':`<div class="tc-ft"><span class="relbar"><i style="width:${t.rel}%"></i></span><button class="tc-i go" data-a="tpartnerGo" data-v="${t.id}">트레이드</button></div>`}
  </div>`;
}
function scoutCard(s,btn){
  return `<div class="tcard" style="cursor:default"><div class="tc-top">${avImg({id:s.fid??s.id,name:s.name,team:null,mor:66})}<div class="tc-id"><b>${esc(s.name)}${obTag(s.ob)}</b><span>${SROLE[s.role||'am']} · ${(s.role==='intl'?IREG[s.region].l:s.region)} 담당${s.role!=='intl'&&typeof scHomeTxt==='function'?` · 고향 ${esc(scHomeTxt(s))}${typeof scHomeReg==='function'&&scHomeReg(s)===s.region?' · 고향 권역 인맥 보너스':''}`:''} · 연봉 ${money(s.sal)}</span>${s.car||s.spec?`<span class="small muted">${s.age?`${s.age}세 · `:''}${esc(s.car||'')}${s.spec?` <span class="pill acc">${SC_SPEC[s.spec]}</span>`:''}</span>`:''}</div>
    <div class="tc-rt"><div><span>능력</span><b class="stars">${'★'.repeat(s.skill)}<i>${'★'.repeat(5-s.skill)}</i></b></div></div></div>
    <p class="dnote">${['','오차가 매우 큽니다.','오차가 큰 편입니다.','평균적인 눈썰미입니다.','정확한 편입니다. 면담 평가도 가능합니다.','리그 최고 수준의 눈입니다.'][s.skill]}${s.skill>=3?' 담당 지역 선수 면담 평가를 받을 수 있습니다.':''}</p>
    ${staffBioBox(s,'scout',staffOwned('scout',s.id)===s?G.user:null)}<div class="tc-ft">${btn}</div></div>`;
}

