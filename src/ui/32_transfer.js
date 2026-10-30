/* 외국인 후보 카드의 계약 불가 사유를 짧게: 자리 없음 / 포지션 / 총액 한도 / 기간 */
function fErrShort(e){ e=e||''; return /3명까지|1명까지/.test(e)?'자리 없음 · 방출 필요':/모두 (투수|타자)/.test(e)?'투수·타자 한쪽만 3명 불가':/총액/.test(e)?'총액 한도 초과':/기간/.test(e)?'영입 기간 아님':'계약 불가'; }
/* ---------- 영입·계약 ---------- */
function transferView(){
  const s=curSub('transfer');
  return subTabs('transfer')+({foreign:foreignView,fa:faCenter,contract:contractPage,draft:draftPage,moves:movesView}[s]||faCenter)();
}
/* 외국인 후보 조사 단계: 추정 범위와 함께 한 칸에 */
function fsPill(p,rp,f){ f=f||fScout(p,rp); return `<span class="pill fsp ${f.cls}" title="${esc(f.d+' 근거: '+f.why.join(', '))}">${f.l}</span>`; } /* 예상·범위는 카드 왼쪽 숫자에, 여기는 조사 단계만 */
function netPill(r){ const lv=intlLv(r); return `<span class="pill net${lv}" title="${esc(INET[lv].d)}">${IREG[r].l} · ${INET[lv].l}</span>`; }
function foreignView(){
  const fs=foreignOf(G.user); const yb=fs.filter(p=>p.foreign==='용병'); const as=fs.filter(p=>p.foreign==='아시아'); const tot=sum(yb.map(fCommit));
  const per=period(); const mid=per==='season'; const used=G.sea.repl[G.user]||0; const open=foreignOpen();
  const ff=Object.assign({t:'yb',r:'all',s:'rk'},UI.ff||{}); const asia=ff.t==='asia';
  const regs=Object.keys(IREG).filter(r=>IREG[r].asia===asia);
  let market=(G.fmarket||[]).map(id=>G.players[id]).filter(p=>p&&p.team==null&&fKnows(G.user,p)&&(p.foreign==='아시아')===asia)
    .filter(p=>ff.r==='all'||(ff.r==='p'?p.isP:ff.r==='b'?!p.isP:ff.r==='mine'?fMineFind(p):origOf(p)===ff.r))
    .map(p=>{ const rp=scoutReport(p); return {p,rp,fs:fScout(p,rp)}; });
  market.sort(fSortBy(ff.s)); /* 고른 기준 하나로만 줄 세운다. 우리 발굴 후보는 '우리 발굴' 칩으로 따로 본다 */
  const tabs=`<div class="seg"><button data-a="ffset" data-v="t:yb" class="${!asia?'on':''}">외국인 선수 ${yb.length}/3</button><button data-a="ffset" data-v="t:asia" class="${asia?'on':''}">아시아쿼터 ${as.length}/1</button></div>`;
  const capT=fCap(G.user), rsyN=sum(yb.map(x=>x.rsy||0)); const pct=Math.min(100,tot/capT*100);
  const rule=asia
    ?`<dl class="tsum"><div><dt>아시아쿼터</dt><dd class="num" style="color:${as.length?'var(--good)':'var(--warn)'}">${as.length} / 1</dd></div><div><dt>연봉 상한</dt><dd class="num">20만 달러</dd></div><div><dt>대상</dt><dd>일본·대만·호주</dd></div></dl>
      <p class="small muted">아시아쿼터는 일반 외국인 3명과 별도로 1명을 더 쓸 수 있는 자리입니다. 연봉은 20만 달러(약 ${money(ASIA_CAP)})까지이고 외국인 연봉 총액 400만 달러에는 들어가지 않습니다.</p>`
    :`<dl class="tsum"><div><dt>외국인</dt><dd class="num" style="color:${yb.length<3?'var(--warn)':'var(--good)'}">${yb.length} / 3</dd></div><div><dt>투수 · 타자</dt><dd class="num">${yb.filter(p=>p.isP).length} · ${yb.filter(p=>!p.isP).length}</dd></div><div><dt>총액 / 한도</dt><dd class="num">${Math.round(tot/USD)}만 / ${Math.round(capT/USD)}만 달러</dd></div></dl>
      <div class="bar"><i class="${tot>capT?'over':''}" style="width:${pct}%"></i></div>
      <details class="frule"><summary class="small">외국인 선수 규정 보기</summary><p class="small muted">신규 계약은 1인 100만 달러(연봉·계약금·이적료·인센티브 포함)까지입니다. 재계약 선수는 개인 상한이 없습니다. 3명 총액 한도는 400만 달러이고, 재계약 선수의 재계약 연차 1년마다 10만 달러씩 늘어납니다(지금 연차 합 ${rsyN}년 → 한도 ${Math.round(capT/USD)}만 달러). 3명을 모두 투수나 모두 타자로 채울 수 없습니다. 보류권: 원소속 구단이 재계약을 제안했는데 선수가 받아들이지 않으면 5년 동안 국내 다른 구단에 입단할 수 없습니다(원소속 구단이 동의하면 예외). 그래서 다른 구단 외국인은 데려올 수 없고, 보류권이 풀린 선수만 시장에 나옵니다.</p>${(()=>{ const L=(G.fRes||[]).filter(x=>x.until>=G.year); return L.length?`<p class="small"><b>보류권으로 묶인 외국인</b></p><ul class="small muted">${L.slice(0,12).map(x=>`<li>${esc(x.name)}(${esc(x.nat||'')} ${esc(x.pos)}) · ${esc(tshort(x.tid))} 보류 · ${x.until}년까지</li>`).join('')}</ul>`:''; })()}</details>`;
  const summary=`<section class="card">${rule}
    <p class="small muted">${mid?`시즌 중 교체 ${used}/${F_REPL_MAX}회, 영입하면 남은 경기 비율만큼 연봉을 냅니다. `:''}${open?'후보는 매달 1일 일부 바뀝니다. 8월 15일 이후에는 영입할 수 없습니다.':'<b>지금은 영입 기간이 아닙니다.</b> (12월~8월 15일)'}</p>
    <div class="netrow">${regs.map(netPill).join('')}<button class="tc-i" data-a="itab" data-v="fview${asia?'a':''}:net">해외 스카우트망 관리</button></div>
    ${(()=>{ const b=budget(); if(!b.fR)return ''; const fsU=sum(foreignOf(G.user).map(p=>p.sal)); return `<p class="small"><b>외국인 배정 예산</b> ${money(b.fR)} 중 ${money(fsU)} 사용 · 남은 배정 ${money(b.fRoom)} <span class="muted">(배정 예산 안에서 영입하면 홈의 예산 여유는 그대로이고, 넘는 만큼만 줄어듭니다)</span>${G.gmSince===G.year?' <span class="muted">(첫 시즌: 규정 한도만큼 구단주가 미리 배정)</span>':' <span class="muted">(지난 시즌 리그 평균 외국인 지출 기준)</span>'}</p>`; })()}
    ${UI.fmsg2?`<div class="note bad">${esc(UI.fmsg2)}</div>`:''}</section>`;
  const mine=(asia?as:yb).map(p=>pcard(p,{sub:`${esc(p.nat)} · ${p.age}세 · ${hand(p)}`,tags:p.fy===G.year||p.fy===G.year+1?'<span class="pill">리그 첫 시즌</span>':'',foot:`<b class="num">${money(p.sal)}</b><span>${Math.round(p.sal/USD)}만 달러 · ${p.rsy?`재계약 ${p.rsy}년차`:'첫 계약'}</span><button class="tc-i" data-a="player" data-v="${p.id}">상세</button><button class="tc-i" data-a="relNow" data-v="${p.id}">방출</button>`})).join('');
  const cards=market.map(({p,rp,fs})=>{ const est=fs.mid!=null?{v:fs.mid,raw:fs.raw,lo:fs.lo,hi:fs.hi}:null; const err=open?foreignCheck(G.user,p):'영입 기간이 아닙니다.'; const repl=mid&&used>=F_REPL_MAX; const pay=mid?Math.round(p.ask*remainFrac()):p.ask;
    const srcP=p.fsrc==='scout'?((p.fknow||[]).includes(G.user)?(G.day<(p.fpub||0)?'<span class="pill good">우리 스카우트 발굴 · 아직 우리만 앎</span>':'<span class="pill">우리 발굴 · 소문 퍼짐</span>'):'<span class="pill">다른 구단 발굴 · 소문으로 앎</span>'):'<span class="pill">에이전트 제안</span>';
    const fn=fFindNote(p,rp); return pcard(p,{rp,est,stat:fn?`<span class="fnote">${esc(fn)}</span>`:'',sub:`${esc(p.nat)} · ${p.age}세 · ${hand(p)} · ${esc(p.prevLvl||'')}${lgLv(p.prevLvl)?`(${lgLv(p.prevLvl)})`:''}`,
      tags:fsPill(p,rp,fs)+(p.mlbG?`<span class="pill good" title="메이저리그 통산 출전 경기 수. 콜업 경험이 많을수록 실력이 검증된 선수입니다">MLB ${p.mlbG}경기</span>`:'')+(G.mgrWant&&G.mgrWant.y===G.year&&mgrFitF(p,{want:G.mgrWant})?`<span class="pill good" title="감독이 원한 유형: ${esc(G.mgrWant.style||'')}">감독 선호</span>`:'')+srcP+(p.flaw?`<span class="pill bad">${FFLAW[p.flaw]}</span>`:'')+(p.inj>.24&&rp.sd<=7.5&&p.flaw!=='inj'?'<span class="pill bad">부상 체질</span>':'')+(()=>{ const n=fInterest(p); return n>=2?`<span class="pill bad">인기 · ${n}개 구단 관심</span>`:n===1?'<span class="pill">1개 구단 관심</span>':''; })()+(p.ask0&&p.ask>p.ask0?`<span class="pill warn">몸값 +${Math.round((p.ask/p.ask0-1)*100)}%</span>`:''),
      foot:`<b class="num">${money(p.ask)}</b><span>${Math.round(p.ask/USD)}만 달러${mid?` · 실지급 ${money(pay)}`:''}</span>${err||repl?`<span class="pill bad" title="${esc(repl?'교체 횟수 소진':err)}">${repl?'교체 소진':fErrShort(err)}</span>`:''}${fBudgetTag(pay)}<span class="tc-bt"><button class="tc-i${fwatchOn(p.id)?' on':''}" data-a="fwatch" data-v="${p.id}">${fwatchOn(p.id)?`관찰 중 ${fwatchK(p.id)}%`:'관찰'}</button><button class="tc-i ${err||repl?'':'go'}" data-a="negOpen" data-v="fm:${p.id}" ${err||repl?'disabled':''}>협상</button></span>`}); });
  const nMine=(G.fmarket||[]).filter(id=>{ const q=G.players[id]; return q&&q.team==null&&(q.foreign==='아시아')===asia&&fMineFind(q); }).length;
  const fchips=[['all','전체'],...(!asia?[['p','투수'],['b','타자']]:[]),...regs.map(r=>[r,IREG[r].l]),...(nMine?[['mine',`우리 발굴 ${nMine}`]]:[])];
  const full=asia?as.length>=1:yb.length>=3; const ft=inTabs('fview'+(asia?'a':''),[['market',`후보 ${market.length}`],['mine',`우리 선수 ${asia?as.length+'/1':yb.length+'/3'}`],['watch','관찰 명단'],['net','스카우트망'],['rule','규정']],full?'mine':'market');
  const mineS=`<section class="card"><div class="row between"><h2 class="sec">우리 ${asia?'아시아쿼터':'외국인 선수'}</h2><span class="small muted">${asia?as.length+'/1':yb.length+'/3'}</span></div>${mine?`<div class="tgrid">${mine}</div>`:'<p class="small muted">아직 없습니다.</p>'}</section>`;
  const PG=pager('fm'+(asia?'a':'')+ff.r+ff.s,cards,6);
  const mkS=`<section class="card" data-pg="${'fm'+(asia?'a':'')+ff.r+ff.s}"><div class="row between"><h2 class="sec">${asia?'아시아쿼터 후보':'외국인 후보'}</h2><span class="small muted">${market.length}명</span></div>
    <div class="row between wrapr"><div class="chips">${fchips.map(([k,l])=>`<button data-a="ffset" data-v="r:${k}" class="${ff.r===k?'on':''}">${l}</button>`).join('')}</div>
    <div class="chips">${[['rk','예상 능력순'],['stat','지난 리그 기록순'],['ask','연봉 낮은순'],['age','어린 순']].map(([k,l])=>`<button data-a="ffset" data-v="s:${k}" class="${ff.s===k?'on':''}">${l}</button>`).join('')}</div></div>
    <p class="small muted">카드의 <b>예상</b>은 지난 리그 기록(리그 수준과 그 리그 기록이 믿을 만한지 감안)·MLB 경력·스카우트 평가를 합친 예상 능력이고, <b>예상 능력순</b>은 이 숫자 순서입니다. <b>범위</b>는 실제 능력이 10명 중 8명꼴로 들어가는 폭입니다. 조사 단계가 <b>조사 전 → 기초 조사 → 정밀 조사 → 확인 완료</b>로 오를수록 범위가 좁아집니다. 조사 전 후보는 추정보다 지난 리그 기록을 더 믿으세요(리그 수준 차이는 감안). <b>관찰</b>을 누르면 매주 조사가 쌓이고, 지역 스카우트망을 넓혀도 정확해집니다. 영입하면 코치진이 정확히 파악합니다.</p>
    <div class="tgrid">${PG.items.join('')||'<p class="small muted">조건에 맞는 후보가 없습니다.</p>'}</div>${PG.bar}</section>`;
  return tabs+ft.bar+(ft.cur==='net'?intlView():ft.cur==='market'?mkS:ft.cur==='mine'?mineS:ft.cur==='watch'?(fwatchBox(asia)||'<section class="card"><p class="small muted">관찰 명단이 비어 있습니다. 후보 목록에서 관찰을 눌러 두면 여기서 비교합니다.</p></section>'):summary);
}

function intlView(){
  const tot=sum(Object.keys(IREG).map(r=>INET[intlLv(r)].c));
  const cnt=r=>(G.fmarket||[]).filter(id=>G.players[id]&&G.players[id].team==null&&origOf(G.players[id])===r).length;
  const card=r=>{ const lv=intlLv(r); return `<div class="tcard" style="cursor:default"><div class="row between" style="flex-wrap:nowrap;align-items:flex-start;gap:8px"><div style="min-width:0"><b style="font-size:16px">${IREG[r].l}</b><div class="small muted">${IREG[r].lg} · ${IREG[r].asia?'아시아쿼터':'외국인'} 후보</div></div><span class="pill net${lv}" style="flex:none">${INET[lv].l}</span></div>
    <div class="seg">${INET.map((x,i)=>`<button data-a="setIntl" data-v="${r}:${i}" class="${lv===i?'on':''}">${i}</button>`).join('')}</div>
    <p class="dnote">${esc(INET[lv].d)}</p>
    <div class="tc-ft"><b class="num">${INET[lv].c?'연 '+money(INET[lv].c):'무료'}</b><span>현재 후보 ${cnt(r)}명</span>${G.scouts.some(s=>s.role==='intl'&&s.region===r)?'<span class="pill good">스카우트 파견 +1단계</span>':''}</div></div>`; };
  return csec('해외 스카우트망',`<p class="small muted">외국인 후보는 그 나라에 우리 정보망이 얼마나 있느냐에 따라 보이는 정도가 다릅니다. 단계를 올리면 그 지역 후보의 리포트가 바로 정확해지고, 다음 달 1일 후보 교체부터 그 지역에서 더 많고 좋은 후보가 들어옵니다. 비용은 하루 단위로 쌓여 시즌 결산 때 나갑니다.</p>
    <dl class="tsum"><div><dt>연간 비용</dt><dd class="num">${money(tot)}</dd></div><div><dt>지난 결산 이후</dt><dd class="num">${money(G.spend.intl||0)}</dd></div><div><dt>외국인 후보</dt><dd class="num">${(G.fmarket||[]).length}명</dd></div></dl>
    <div class="eyebrow">외국인 시장</div><div class="tgrid">${['us','la'].map(card).join('')}</div>
    <div class="eyebrow">아시아쿼터 시장</div><div class="tgrid">${['jp','tw','au'].map(card).join('')}</div>
    <p class="small muted">단계: 0 에이전트 자료 · 1 현지 통신원 · 2 전담 스카우트(적응력 확인) · 3 현지 사무소. 스카우트 팀에서 스카우트를 해외 담당으로 보내면 그 나라 정보 수준이 한 단계 더 올라갑니다(최대 3).</p>`);
}
function contractPage(){
  return (G.contract&&!G.contract.done?contractView():'')+csec('비FA 다년계약',extBody())+(G.contract&&!G.contract.done?'':'<p class="small muted keep" style="margin:4px 2px">연봉 협상은 시즌이 끝난 뒤 12월~1월에 이곳에서 열립니다.</p>');
}

