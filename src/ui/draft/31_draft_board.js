/* ---------- 신인 드래프트 보드 ---------- */
let _dbO=null; /* 그리는 동안 쓰는 예상 확률(65_draft_odds), 저장 안 함 */
const DPOS={all:'전체',P:'투수',C:'포수',IF:'내야',OF:'외야'};
function dposOf(p){ return p.isP?'P':p.pos==='C'?'C':['1B','2B','3B','SS'].includes(p.pos)?'IF':'OF'; }
function dval(rp,p){ return draftVal(rp,p); }
function draftPool(){ return draftBoardPool(); }
/* 담당 스카우트 주장 표시: 정답 배지가 아니라 스카우트 의견. 틀릴 수 있다 */
function dclaimTag(p){ const c=draftClaim(p); if(!c)return ''; return `<b class="${c.k==='up'?'good':'warn'}" title="${esc(draftClaimTxt(c))}">${c.k==='up'?'강력 추천':'신중론'}(확신도 ${c.conf})</b> · `; }
/* 잠재력은 한 숫자 대신 스카우트 추정 범위로 */
function dpotChip(rp){ if(rp.ofp==null)return '<span class="small muted">?</span>'; const T=potTier(potVal(rp),rp.cur); const unsure=(rp.sd||6)>=7; return `<span class="ptier t${T.n}" data-tip="${esc(`스카우트 추정: ${T.l}${unsure?' · 관찰이 적어 오차가 큽니다':''}. 부상·출전 기회·훈련 환경에 따라 그렇게 크지 못할 수 있습니다.\n\n${POT_HELP}`)}">${potStars(T.st)}</span>`; }
/* 2대 선수: 아버지 OB 프로필로 가는 'OO의 아들'(11-09r) */
function sonTag(p){ const o=fatherOf(p); return o?`<button class="lnk" data-a="person" data-v="ob:${o.id}">${esc(o.name)}</button>의 아들`:''; }
function draftCandidateTable(list,mine){
  if(!list.length)return '<p class="small muted">조건에 맞는 후보가 없습니다.</p>';
  return `<div class="tw"><table class="sqt candidate-table"><thead><tr>${['선수','스카우트','언론','구분','학교','투타','아마 기록','잠재력 추정','남을 확률','관찰','행동'].map(l=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${list.map(({p,rp,rk})=>{const star=(G.shortlist||[]).includes(p.id);return `<tr${rowProxy()}><td><button class="candidate-name" data-rowgo data-a="player" data-v="${p.id}">${avImg(p)}<span>${esc(p.name)}<small>${posLabel(p)} · ${p.age}세${fatherOf(p)?` · ${esc(fatherOf(p).name)}의 아들`:''}${u18Of(p)?' · U-18 대표':''}</small></span></button></td><td>${rk}</td><td>${p.press||'-'}</td><td>${p.college?'대졸':'고졸'}</td><td>${esc(p.school||'-')}</td><td>${hand(p)}</td><td class="candidate-note">${esc(amShort(p))||'기록 없음'}${p.isP&&amVm(p)?`<small class="block">${esc(amVmTxt(p))}</small>`:''}<small class="block">${amTrendHtml(p,!!p.isP,!!p.college)}${amSlTag(p)}</small></td><td>${dpotChip(rp)}<small class="block ${rp.risk==='높음'?'bad':'muted'}">위험 ${esc(rp.risk||'미확인')}${p.amInj?' · 부상 이력':''}</small></td><td>${typeof doChip==='function'?doChip((_dbO||{P:{}}).P[p.id]):''}</td><td class="num">${obsCount(p)?obsCount(p)+'회':'<b class="bad">0회</b>'}</td><td>${mine?`${star?'<span class="pill acc">관심</span> ':''}<button class="tc-i go" data-a="pick" data-v="${p.id}">지명</button>`:`<button class="tc-i${star?' on':''}" data-a="star" data-v="${p.id}">${star?'관심 중':'관심'}</button>`}</td></tr>`;}).join('')}</tbody></table></div>`;
}
function dcard(p,rp,rk,mine){
  const star=(G.shortlist||[]).includes(p.id);
  const cl=draftClaim(p);
  const tags=`${draftFit(p,draftPolK())?'<span class="pill acc">감독 추천</span>':''}<span class="pill ${rk<=10?'good':''}">스카우트 #${rk}</span><span class="pill">언론 #${p.press||'-'}</span>${cl?`<span class="pill ${cl.k==='up'?'good':'warn'}">${esc(draftClaimWho(cl))} ${cl.k==='up'?'강력 추천':'신중론'}</span>`:''}${p.amInj?'<span class="pill bad">부상 이력</span>':''}${u18Of(p)?'<span class="pill acc">U-18 대표</span>':''}`;
  const sc=gmObsCount(p)>0?(rp.sc&&dcScoutObs(p,rp.sc)>0?'단장·'+esc(rp.sc.name):'단장 직접 관찰'):rp.sc?esc(rp.sc.name):'';
  const V=draftView(p,rp); const rw=riskWhy(p,rp);
  return `<div class="tcard dcard${star?' star':''}" data-a="player" data-v="${p.id}" role="button" tabindex="0">
    <div class="tc-top">${avImg(p)}<div class="tc-id"><b>${esc(p.name)}</b><span>${esc(p.school||'')} · ${p.college?'대학 4년':'고교 3년'}</span><span>${posLabel(p)} · ${p.ht||'-'}cm ${p.wt||'-'}kg · ${hand(p)}</span>${p.father?`<span>${sonTag(p)}</span>`:''}</div>
</div>
    <div class="tc-arch">${tags}</div>
    <div class="tc-arch">${posChips(p)}<span class="pill acc">${esc(rp.arch)}</span>${rp.role?`<span class="small muted">상한 전망 ${esc(rp.role)} · 확신 ${esc(V.conf)}</span>`:'<span class="small muted">잠재력 판단 불가</span>'}</div>
    ${statCells(p)}
    <div class="tc-st">${p.college?'대학 4년':'고교 3년'} ${p.am?p.am.g:0}경기 · ${p.isP?`${p.am?p.am.so:0}탈삼진 ${p.am?p.am.bb:0}볼넷`:`${p.am?p.am.pa:0}타석 ${p.am?p.am.bb:0}볼넷 ${p.am?p.am.so:0}삼진`} · ${p.ht||'-'}cm ${p.wt||'-'}kg</div>
    <p class="dnote st"><b>확인된 기록</b> ${esc(V.rec)}</p>
    ${(()=>{ const sp=amSplitLines(p,amRecYear()); const v=p.isP?amVmTxt(p):''; return sp.length||v?`<p class="dnote st"><b>대회별</b> ${esc([v,...sp.map(x=>x.n+' '+x.t)].filter(Boolean).join(' · '))}</p>`:''; })()}
    <p class="dnote st"><b>학년 흐름</b> ${amTrendHtml(p,!!p.isP,!!p.college)}${amSlTag(p)} · 관찰 ${obsCount(p)}회 ${doChip(_dbO&&_dbO.P[p.id])}</p>
    <p class="dnote"><b>관찰 의견${sc?` · ${sc}`:''}</b> ${esc(V.obs)}${p.amInj?` <span class="bad-t">${esc(p.amInj)}.</span>`:''}</p>
    <p class="dnote"><b>성장 전망</b> ${esc(V.fut)}</p>
    ${cl?`<p class="dnote"><b>${cl.k==='up'?'강력 추천':'신중론'}</b> ${esc(draftClaimTxt(cl))}. 관찰자의 의견이라 틀릴 수 있습니다.</p>`:''}
    <p class="small muted">잠재력 추정 ${dpotChip(rp)} · 확신도 ${esc(DC_CONF(rp.sd||9))}</p>
    <div class="tc-ft"><span class="pill ${rp.risk==='높음'?'bad':rp.risk==='낮음'?'good':''}" title="${esc(rw.join(' · ')||'특이 위험 없음')}">위험도 ${rp.risk}</span><span class="small">${esc(rw.length?rw.join(' · '):'건강 특이사항 없음')}</span><span>${p.region}</span>
      <button class="tc-i${star?' on':''}" data-a="star" data-v="${p.id}" aria-pressed="${star}">${star?'★ 관심':'☆ 관심'}</button>${mine?`<button class="tc-i go" data-a="pick" data-v="${p.id}">지명</button>`:''}</div>
  </div>`;
}
/* 스카우트 추천 자동 지명 기준(카페 피드백 11-09v: 접혀 있어 못 찾았다). pre: 드래프트 전 미리 정한 기준(있으면 표시) */
function drestBox(pre,sub){ const on=(m,n)=>pre&&pre.mode===m&&(m==='pass'||pre.min===n)?' primary':''; const S=draftCondSummary(pre?.min||4);
  return `<div class="drest drest-v"><div class="row between"><b>스카우트 추천으로 자동 지명</b><span class="small muted">${sub}</span></div><div class="row"><button class="btn small${on('cond',3)}" data-a="draftRest" data-v="cond:3">★2(1군 백업) 이상만</button><button class="btn small${on('cond',4)}" data-a="draftRest" data-v="cond:4">★3(주전감) 이상만</button><button class="btn small${on('board',3)}" data-a="draftRest" data-v="board:3" title="보드(관심 목록) 순서대로 남은 맨 위 후보를 지명합니다. 보드가 비면 ★2 이상 추천으로 이어 갑니다">우리 보드 순서대로</button><button class="btn small${on('pass')}" data-a="draftRest" data-v="pass:0">남은 지명 건너뛰기</button>${pre?'<button class="btn small" data-a="draftRest" data-v="off">해제</button>':''}</div><p class="small">현재 후보 ${S.total}명 · ${pre?.min===3?'★2':'★3'} 이상 확인 ${S.fit}명 · 잠재력 미확인 ${S.unknown}명${S.full?' · 로스터 한도 도달: 자동 지명은 건너뜁니다':''}</p><p class="small muted">${pre?`드래프트가 열리면 '${pre.mode==='pass'?'남은 지명 건너뛰기':pre.mode==='board'?'우리 보드 순서대로':pre.min>=4?'★3 이상만':'★2 이상만'}' 기준으로 우리 지명을 자동 처리합니다. `:''}스카우트 추천 순서대로 뽑고, 잠재력 추정이 기준에 못 미치면 그 지명을 건너뜁니다. ${hiI(`KBO 규약상 지명권 패스는 라운드 제한이 없어 1·2라운드도 같은 기준입니다. 로스터가 한도(${ROSTER_MAX}명)에 차면 더 뽑지 않습니다. 기준을 채운 후보가 없고 미확인 후보가 남으면 자동 진행을 멈추고 직접 확인을 요청합니다. 진행 중에 '그만두고 직접 고르기'로 멈출 수 있습니다.`)}</p></div>`; }
/* 스카우트 추천 순위(#): 화면의 '스카우트 #n'과 같은 값(우리 스카우트 평가 draftVal 순). 숨은 실제 능력은 쓰지 않는다 */
function draftRanked(pool){ return draftBoardRanked(pool); }
/* 카페 11-18: 보드를 스카우트 추천순으로 한 번 정렬 · 되돌리기 · 자동 정렬 유지(기본 꺼짐). 보드에 없는 칸(현역 관심 선수 등)은 제자리 */
function dbSortOf(){ return draftBoardSortOf(); }
function dbRankOrder(all){ return draftBoardRankOrder(all); }
function dbAutoApply(all){ if(!(G.dbSort&&G.dbSort.auto))return; const nx=draftBoardOrder(all); if(nx.join()!==(G.shortlist||[]).join())G.shortlist=nx; }
function dbSortBtns(c){ const S=dbSortOf(), k=c?'tc-i':'btn small', ns=' style="white-space:nowrap"'; /* c: PC 오른쪽 좁은 칸(짧은 글자 한 줄) */
  return `<span class="row dbsort" style="gap:4px;flex-wrap:${c?'nowrap':'wrap'}"><button class="${k}"${ns} data-a="dbSort" title="관심 후보를 스카우트 추천 순위(#) 순서로 한 번 정렬합니다">${c?'추천순 정렬':'스카우트 추천순 정렬'}</button>${S.undo?`<button class="${k}"${ns} data-a="dbUndo" aria-label="되돌리기" title="되돌리기: 마지막 정렬 전 순서로 돌아갑니다">${c?'↶':'되돌리기'}</button>`:''}<button class="${k}${S.auto?(c?' on':' primary'):''}"${ns} data-a="dbAuto" aria-pressed="${!!S.auto}" title="자동 정렬 유지: 켜 두면 스카우트 보고가 바뀔 때마다 추천순으로 다시 맞춥니다. 끄면 직접 정한 순서를 그대로 둡니다">${c?'자동':'자동 정렬 유지'} ${S.auto?'켬':'끔'}</button></span>`; }
/* 내 드래프트 보드: 관심 목록 순서가 곧 내 순위. 메모·고려 라운드·확인할 것을 남긴다 */
const DCHK=['타격','제구','구위','수비','주루','건강','성격'];
function dmemoOf(id){ G.dmemo=G.dmemo||{}; return G.dmemo[id]||(G.dmemo[id]={t:'',rd:0,chk:[]}); }
function myBoard(all,mine){ const L=(G.shortlist||[]).map(id=>all.find(x=>x.p.id===id)).filter(Boolean); if(!L.length)return `<section class="card"><h2 class="sec">내 드래프트 보드</h2>${dbSortBtns()}<p class="small muted">관심 후보가 없습니다. 후보 목록에서 관심 선수를 담을 수 있습니다.</p></section>`;
  const row=(x,i)=>{ const p=x.p, rp=x.rp, m=dmemoOf(p.id); const rw=riskWhy(p,rp); const tr=dtierOf(m.rd||0); const o=_dbO&&_dbO.P[p.id];
    const chk=k=>{ const q=rchkOf(p.id,k), a=p.rchkA&&p.rchkA[k]; return `<button data-a="dchk" data-v="${p.id}:${k}" class="${q?'on':a?'done':''}" title="${esc(a?`${dmd(a.d)} ${a.who}: ${a.t}`:q?`${q.who} 스카우트가 보는 중 · 답 ${dmd(q.due)} 무렵`:'누르면 담당 스카우트가 다시 보고 1~2주 뒤 답합니다')}">${k}${q?` 확인 중 D-${Math.max(0,q.due-G.day)}`:a?' ✓':' 재확인'}</button>`; };
    const ans=DCHK.filter(k=>rchkApplies(p,k)).map(k=>p.rchkA&&p.rchkA[k]?`<p class="small dbr-a"><b>${k}</b> ${esc(p.rchkA[k].t)}</p>`:'').join('');
    return `<div class="dbr"><span class="num dbr-k">${i+1}</span><div class="dbr-mv"><button class="tc-i" data-a="dmove" data-v="${p.id}:-1" aria-label="위로" ${i?'':'disabled'}>▲</button><button class="tc-i" data-a="dmove" data-v="${p.id}:1" aria-label="아래로" ${i<L.length-1?'':'disabled'}>▼</button></div>
      <div class="dbr-b"><button class="lnk" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b></button> <span class="pill">${tr?(DTIER.find(x=>x[0]===tr)||[,'미정'])[1]:'구간 미정'}</span> <span class="small muted">${posLabel(p)} · 스카우트 #${x.rk} · ${rp.ofp!=null?potTier(potVal(rp),rp.cur).s:'잠재력 ?'} · 관찰 ${obsCount(p)}회${rw.length?` · ${esc(rw.join(' · '))}`:''}</span> ${doChip(o)}${amSlTag(p)}
      <div class="small">${amTrendHtml(p,!!p.isP,!!p.college)}${p.isP&&amVm(p)?` · ${esc(amVmTxt(p))}`:''}</div>
      <div class="row wrapr" style="gap:6px"><span class="chips drd" role="group" aria-label="구간">${[[0,'미정'],...DTIER].map(([r,l])=>`<button data-a="drdB" data-v="${p.id}:${r}" class="${tr===r?'on':''}">${l}</button>`).join('')}</span><input type="text" data-a="dmemo" data-v="${p.id}" value="${esc(m.t)}" maxlength="40" placeholder="관심 이유·메모" aria-label="메모" style="min-width:120px;flex:1"></div>
      <div class="chips">${DCHK.filter(k=>rchkApplies(p,k)).map(chk).join('')}</div>${ans}</div>
      ${mine?`<button class="tc-i go" data-a="pick" data-v="${p.id}">지명</button>`:''}</div>`; };
  const P=dplanOf(), ck=dplanCheck();
  const plan=`<div class="dplan"><div class="row wrapr"><b class="small">라운드 목표</b>${DPLAN_G.map(([g,l])=>`<span class="chips" role="group" aria-label="${l} 목표"><i class="small">${l}</i>${[[0,'-'],[1,'1R'],[3,'3R까지'],[5,'5R까지']].map(([r,t])=>`<button data-a="dplan" data-v="${g}:${r}" class="${(P[g]||0)===r?'on':''}">${t}</button>`).join('')}</span>`).join('')}</div>
    <p class="small">${ck.length?ck.map(c=>`<span class="${c.ok?'good':'warn'}">${c.r===1?'1R':c.r+'R까지'} ${c.l} ${c.ok?`✓ 보드에 ${c.n}명`:'✗ 보드 그 구간에 없음'}</span>`).join(' · '):'<span class="muted">목표를 고르면 자동 지명도 그 라운드 안에서 그 자리를 먼저 찾습니다.</span>'}</p></div>`;
  const rq=rchkQ().length;
  return `<section class="card"><div class="row between"><h2 class="sec">내 드래프트 보드</h2><span class="small muted">관심 ${L.length}명 · 재확인 ${rq}/${rchkCap()}건 진행</span></div><div class="row wrapr">${dbSortBtns()}</div>${plan}${dmockHtml()}<div class="dboard">${L.map(row).join('')}</div><p class="small muted">▲▼ 순서가 지명 때 관심 순위입니다(직접 정한 순서는 날짜가 지나도 그대로 둡니다).${(G.dbSort||{}).auto?' 자동 정렬 유지 중: 스카우트 추천순으로 맞춥니다.':''} 재확인은 담당 스카우트가 1~2주 뒤 답합니다(한 번에 아마추어 스카우트 수만큼).</p></section>`; }
/* 모의 지명(사용자 11-17 드래프트 전 전략): 우리 정보로 다른 구단이 고를 만한 선수를 순번마다(draftOdds 240번 모의, 65_draft_odds). 우리 차례는 보드 맨 위 남은 후보 */
function dmockHtml(){ let M=[], O=null; try{ O=_dbO||draftOdds(G.user); M=mockDraft(12); }catch(e){ return ''; } if(!M.length)return '';
  const row=x=>{ const p=G.players[x.id]; if(!p)return ''; const ob=(G.shortlist||[]).indexOf(p.id); return `<li class="${x.mine?'me':''}"><span class="num">${x.pk.rd}-${x.pk.no}</span>${badge(x.pk.tid,16)}<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><i class="small muted">${posLabel(p)} · ${p.college?'대졸':'고졸'}${ob>=0?` · 우리 보드 ${ob+1}위`:''}</i><b class="small">${x.mine?'우리 차례':doPct(x.s)}</b></li>`; };
  const nb=(G.shortlist||[]).filter(id=>O.P[id]).length; const me=M.find(x=>x.mine);
  return `<details class="dmock" data-k="dmock" ${UI.open&&UI.open.dmock===false?'':'open'}><summary class="small"><b>모의 지명</b> · ${O.pick?`우리 ${O.pick.rd}라운드 ${O.pick.no}순위까지`:'1라운드'} · 우리 정보로만 짐작${me&&G.players[me.id]?` · 우리 차례 예상 ${esc(G.players[me.id].name)}`:''}</summary><ol class="dmock-l">${M.map(row).join('')}</ol><p class="small muted">순번마다 240번 모의에서 가장 자주 나온 이름과 그 비율입니다. 다른 구단은 공개 정보(언론 순위·아마 기록·자리 필요·운영 방향)와 소문, 우리 평가로 짐작하고, 우리 차례는 보드 순서(보드 ${nb}명)대로 고릅니다. AI 구단의 실제 평가는 보지 않습니다.</p></details>`; }
function draftBoard(){
  const live=G.draft&&!G.draft.done; const d=G.draft; const pk=live?d.picks[d.cur]:null; const mine=!!(pk&&pk.tid===G.user);
  const pool=draftPool();
  if(!pool.length&&!live)return `<p class="small muted keep"><b>신인 드래프트</b> 올해 드래프트는 끝났습니다. 다음 해 참가 선수 명단은 새해에 나옵니다.</p>`+(d&&d.done?draftResults():''); /* 안내는 패널 밖 한 줄, 칸은 지명 결과에 */
  const all=draftRanked(pool); dbAutoApply(all); /* 자동 정렬 유지(사용자가 켰을 때만) */
  try{ _dbO=draftOdds(G.user); }catch(e){ _dbO=null; }
  const f=UI.df||(UI.df={pos:'all',typ:'all',reg:'all',star:false,sort:'rk',seg:'board',more:20});
  const noScout=REG.filter(r=>!scoutOf('am',r)); /* 아마추어 담당 기준(프로 담당만 있으면 신인 잠재력은 ?, 검수 11-07) */
  const gmN=r=>pool.filter(p=>p.region===r&&p.gmSeen===G.year).length; /* 단장이 직접 본 후보는 담당이 없어도 잠재력을 본다(검수 11-09ze) */
  let head;
  if(live){
    const rest=draftRestOf(); /* 이 구단에서 설정한 일괄 처리만 */
    const myLeft=d.picks.slice(d.cur).filter(x=>x.tid===G.user).length;
    const recent=d.picks.slice(Math.max(0,d.cur-8),d.cur).reverse();
    const firstStar=(G.shortlist||[]).map(id=>G.players[id]).find(p=>p&&p.prospect&&p.team==null);
    const proj=rosterProj(G.user); const cut=trimCands(1)[0]; const crp=cut?scoutReport(cut):null;
    const capLine=`<div class="cap-line"><span>현재 정식 ${rosterN(G.user)}명 · 다음 개막 예상 <b style="color:${proj>=ROSTER_MAX?'var(--bad)':proj>=ROSTER_MAX-3?'var(--warn)':'var(--good)'}">${proj}</b> / ${ROSTER_MAX}</span>${proj>=ROSTER_MAX&&cut?`<span class="small">더 뽑으면 개막 전 방출이 필요합니다. 1순위 정리 후보: <button class="lnk" data-a="player" data-v="${cut.id}">${esc(cut.name)}</button> (${posLabel(cut)} · ${cut.age}세 · 현재 ${dv(crp.cur)} / ${crp.ofp!=null?potTier(potVal(crp),crp.cur).s:'잠재력 ?'})</span>`:''}</div>`;
    const restBox=rest||!myLeft?'':drestBox(null,`남은 우리 지명 ${myLeft}번`);
    const feed=`${dliveBox('am')}${recent.length&&!(dlSame('am')&&UI.dl.feed&&UI.dl.feed.length)?`<div class="dlog">${recent.map(x=>{const q=G.players[x.pid]; return `<span>${badge(x.tid,18)}<i>${x.rd}-${x.no}</i>${x.pass?'<em>건너뜀</em>':q?`<b>${esc(q.name)}</b> <em>${posLabel(q)}</em>`:''}</span>`}).join('')}</div>`:''}`;
    /* 휴대폰·태블릿: 순위·우리 차례·추천 지명은 상단 바(draftTop)로 옮기고, 여기에는 일괄 처리 중 안내와 다른 구단 지명 소식만. 나머지는 상단 바 드래프트 정보를 누르면 펼친다 */
    const fold=!wide(), more=fold&&!!UI.open?.draftMore;
    const btns=`${mine?`${firstStar?`<button class="btn primary" data-a="pick" data-v="${firstStar.id}" title="관심 1순위 지명">관심 1순위 ${esc(firstStar.name)} 지명</button>`:''}${fold?'':'<button class="btn" data-a="autoPick">스카우트 추천 지명</button>'}<button class="btn" data-a="passPick">이번 지명 건너뛰기</button>`:fold?'':`<button class="btn primary" data-a="advDraft" ${UI.dl&&UI.dl.on?'disabled':''}>${UI.dl&&UI.dl.on?'다른 구단 지명 중…':'다른 구단 지명 보기'}</button>`}`;
    const eyeRow=`<span class="eyebrow">${d.y||G.year} 신인 드래프트 · ${DRAFT_ROUNDS}라운드 순번 ${d.picks.length}개 · 지명 ${d.picks.filter(x=>x.pid>0).length}명</span><span class="small muted">우리 남은 지명 ${myLeft}번</span>`;
    const restOn=rest?`<p class="small drest-on">일괄 처리 중: ${rest.mode==='pass'?'남은 지명 건너뛰기':rest.mode==='board'?`우리 보드 순서대로(보드 남은 후보 ${(G.shortlist||[]).filter(id=>G.players[id]&&G.players[id].prospect).length}명)`:`'${rest.min>=4?'주전감(★3)':'1군 백업(★2)'}' 이상만 추천 지명`} <button class="btn small" data-a="draftRest" data-v="off">그만두고 직접 고르기</button></p>`:'';
    head=fold?(more||!mine||rest||restBox?`<section class="dhead dhead-pop${more?' card':''}">${more?`${btns?`<div class="row">${btns}</div>`:''}<div class="row between">${eyeRow}</div>${capLine}`:''}${mine?restBox:''}${restOn}${more||!mine?feed:''}</section>`:'')
      :`<section class="card hero dhead"><div class="row between">${eyeRow}</div>${capLine}
      <div class="row">${badge(pk.tid,40)}<div><div class="dnow">${pk.rd}라운드 ${pk.no}순위</div><div class="small ${mine?'':'muted'}">${mine?'<b>우리 차례입니다.</b> 후보 옆 지명 버튼으로 고르세요.':tname(pk.tid)+' 차례'}</div></div></div>
      <div class="row">${btns}</div>
      ${restBox}${restOn}${feed}
    </section>`;
    if(!(G.scouts||[]).some(s=>(s.role||'am')==='am'))head=`<p class="note warn" role="status">아마추어 스카우트가 없어 후보 잠재력이 모두 '?'입니다. <button class="btn small" data-a="go" data-v="staff:scouts">스카우트 배치</button></p>`+head; /* 플레이 테스트 11-13 */
    if(d.ruleMsg)head=`<p class="note warn" role="status">${esc(d.ruleMsg)}</p>`+head;
  } else {
    const left=Math.max(0,G.cal.draft-G.day);
    const dn=draftNo(G.user);
    head=`<section class="card hero dhead"><div class="row between"><span class="eyebrow">${G.year} 신인 드래프트 · ${dmd(G.cal.draft)}</span><span class="pill">D-${left}</span></div>
      <p class="dpre-no">${dn?`우리 첫 지명은 <b>${draftFirstTxt(dn)}</b>${dn.first&&(dn.first.rd!==1||dn.first.no!==dn.r1)?` (원래 1라운드 ${dn.r1}순위 · 지명권 거래 반영)`:dn.r2!==dn.r1?`, 2라운드부터 ${dn.r2}순위`:''}`:`참가 ${pool.length}명`} ${hiI(`참가 선수 ${pool.length}명 중 ${DRAFT_ROUNDS}라운드 순번 ${(draftPlan()||[]).length}개만큼 지명합니다. 구단은 어느 라운드든 지명을 건너뛸(패스) 수 있어 실제 지명 인원은 더 적을 수 있습니다. 지명 순서는 지난 시즌 성적의 역순입니다.`)}</p>
      ${(()=>{ const T=(draftPlan()||[]).filter(k=>k.from!=null); return T.length?`<p class="small muted">지명권 거래 반영: ${esc(T.map(k=>`${tshort(k.from)} ${G.year} ${k.rd}라운드(${k.no}순위) → ${tshort(k.tid)}`).join(' · '))}</p>`:''; })()}
      ${dn?(fmOn()?drestBox(draftRestPre(),'드래프트 전에 미리 정해 두기'):`<details class="dpre-rest" data-k="draftRest" ${UI.open?.draftRest?'open':''}><summary class="small">자동 지명 기준 · 미리 정해 두기</summary>${drestBox(draftRestPre(),'드래프트 전에 미리 정해 두기')}</details>`):''}
      <details class="frule"><summary class="small">로스터·순위 안내</summary><p class="small">지금 정식 로스터는 ${rosterN(G.user)}/${ROSTER_MAX}명입니다. 지명한 신인은 내년 1월에 합류하므로, 그만큼 기존 선수를 방출해야 합니다. 지명은 어느 라운드든 건너뛸 수 있고, 다른 구단도 로스터가 차면 건너뜁니다.</p>
      <p class="small muted">언론 순위는 성적과 체격만 본 평가이고, 우리 순위는 담당 스카우트·단장 관찰을 더한 평가입니다. 스카우트도 틀립니다. ${hiI("우리 순위에는 관찰 전 임시 현재능력 추정도 들어갑니다. 관찰 0회 후보의 잠재력은 첫 관찰 전까지 ?로 표시합니다. 관찰이 쌓일수록 정확해지지만, 스카우트마다 좋아하는 유형이 있어 그 버릇은 남습니다. '강력 추천'은 스카우트가 언론보다 훨씬 높게 보는 후보입니다.")}${noScout.length?` <b>${noScout.join(', ')}</b> 지역은 담당 스카우트가 없어 잠재력이 ?로 나옵니다${noScout.some(gmN)?`(단장이 직접 본 후보 ${noScout.map(gmN).reduce((a,b)=>a+b,0)}명은 평가됨)`:''}.`:''} 관심 표시한 선수는 지명 때 바로 고를 수 있습니다.</p>
      </details>
    </section>`;
  }
  { const T30=all.slice(0,30), z=T30.filter(x=>!obsCount(x.p)).length, lw=T30.filter(x=>x.rp.ofp==null||(x.rp.sd||9)>=8).length; if(z||lw)head+=`<p class="note warn small dunseen" role="status">우리 상위 30명 중 관찰 0회 ${z}명 · 신뢰도 낮음 ${lw}명 <button class="btn small" data-a="dset" data-v="unseen:${f.unseen?'':'1'}">${f.unseen?'모두 보기':'이 선수들만'}</button></p>`; }
  const seg=draftViewMenu(); /* 후보·상세·관심·지명 현황·요약 보기 전환(33_scouting_train.js, UI 3단계 3-9) */
  const frame=content=>fmOn()?draftFM(head,seg,content,all,mine,live):`<div class="draft-page"><aside class="draft-context">${head}</aside><div class="draft-candidate-body">${seg}${content}</div></div>`;
  if(f.seg==='res')return frame(draftResults());
  if(f.seg==='sum')return frame(draftCenter(all,mine));
  const center='';
  let list=all.filter(({p,rp,rk})=>(!f.unseen||rk<=30&&(!obsCount(p)||rp.ofp==null||(rp.sd||9)>=8))&&(f.pos==='all'||dposOf(p)===f.pos)&&(f.typ==='all'||(f.typ==='hs')!==p.college)&&(f.reg==='all'||p.region===f.reg)&&(f.seg!=='mine'||(G.shortlist||[]).includes(p.id)));
  const sorts={rk:(a,b)=>a.rk-b.rk,press:(a,b)=>(a.p.press||999)-(b.p.press||999),stat:(a,b)=>amScore(b.p)-amScore(a.p),fut:(a,b)=>(b.rp.ofp??0)-(a.rp.ofp??0),cur:(a,b)=>b.rp.cur-a.rp.cur};
  if(f.seg==='mine'){const order=new Map((G.shortlist||[]).map((id,i)=>[id,i]));list.sort((a,b)=>order.get(a.p.id)-order.get(b.p.id));}else list.sort(sorts[f.sort]||sorts.rk);
  const chips=(k,opts)=>`<div class="chips">${opts.map(([v,l])=>`<button data-a="dset" data-v="${k}:${v}" class="${f[k]===v?'on':''}">${l}</button>`).join('')}</div>`;
  const filt=`<section class="card dfilt">
    ${chips('pos',Object.entries(DPOS))}
    <div class="row wrapr">${chips('typ',[['all','고졸·대졸'],['hs','고졸'],['col','대졸']])}${chips('reg',[['all','전 지역'],...REG.map(r=>[r,r])])}</div>
    <div class="row between wrapr"><span class="small muted">${f.seg==='mine'?'정렬: 내 보드 순서':'정렬'}</span>${f.seg==='mine'?'':chips('sort',[['rk','스카우트 순위'],['press','언론 순위'],['stat','아마 성적']])}<button class="btn small" data-a="dreset">필터 초기화</button></div>
    <p class="small muted">${list.length}명 표시 · 남은 참가자 ${pool.length}명</p></section>`;
  /* 휴대폰·태블릿: 필터 칩이 첫 화면을 다 차지하지 않게 요약 한 줄로 접는다(PC는 그대로) */
  const lab=(k,opts)=>(opts.find(o=>o[0]===f[k])||[,''])[1];
  const filtM=fmOn()?filt:`<details class="card dfilt dfilt-d" data-k="draftFilters" ${UI.open?.draftFilters?'open':''}><summary class="small">필터 · ${[lab('pos',Object.entries(DPOS)),f.typ==='all'?'':lab('typ',[['hs','고졸'],['col','대졸']]),f.reg==='all'?'':f.reg,f.seg==='mine'?'내 보드 순서':lab('sort',[['rk','스카우트 순위'],['press','언론 순위'],['stat','아마 성적']])].filter(Boolean).join(' · ')} · ${list.length}/${f.seg==='mine'?(G.shortlist||[]).filter(id=>all.some(x=>x.p.id===id)).length:pool.length}명</summary>${filt.replace(/^<section class="card dfilt">|<\/section>$/g,'')}</details>`;
  const dvw=UI.dview||'list'; const pk2='dr'+f.seg+f.pos+f.typ+f.reg+f.sort+dvw; const PG=pager(pk2,list,dvw==='list'?15:(wide()?6:4));
  const vt=`<div class="row between"><span></span>${wide()?`<span class="small muted">이름 · 아마 기록 · 평가 순위 · 잠재력 추정 · 관심${mine?' · 지명':''}</span>`:hiI(`목록 칸: 이름 · 아마 기록 · 평가 순위 · 잠재력 추정 · 관심${mine?' · 지명':''}`)}</div>`;
  const empty=f.seg==='mine'&&!(G.shortlist||[]).some(id=>G.players[id]&&G.players[id].prospect)?'<p class="small muted">관심 선수가 없습니다. 후보 목록에서 ☆를 눌러 담으세요.</p>':'<p class="small muted">조건에 맞는 선수가 없습니다.</p>';
  return frame((f.seg==='mine'?myBoard(all,mine)+filtM+vt:`<div class="dtools">${filtM}${vt}</div>`)+(dvw==='list'?`<section class="card candidate-list draft-candidates" data-pg="${pk2}">${draftCandidateTable(PG.items,mine)}${PG.bar}</section>`:`<div class="tgrid dgrid" data-pg="${pk2}">${PG.items.map(x=>dcard(x.p,x.rp,x.rk,mine)).join('')||empty}</div>${PG.bar}`));
}
function draftResults(){
  const d=G.draft; if(!d)return csec('지명 현황','<p class="small muted">드래프트가 시작되면 라운드별 지명 결과가 여기에 쌓입니다.</p>');
  const order=d.picks.filter(x=>x.rd===1).map(x=>x.from??x.tid); /* 열은 원래 구단 순번(지명권 트레이드로 넘긴 칸은 → 새 구단 표시) */
  const rows=[]; for(let r=1;r<=DRAFT_ROUNDS;r++){ rows.push(`<tr><th>${r}R</th>${order.map(tid=>{ const x=d.picks.find(q=>q.rd===r&&(q.from??q.tid)===tid); const q=x&&x.pid>0?G.players[x.pid]:null;
    return `<td class="${x&&x.tid===G.user?'me':''}">${x?`<small class="muted">${x.no}순위</small> `:''}${x&&x.pass?`<span class="muted">건너뜀${x.passReason?` · ${esc(x.passReason)}`:''}</span>`:q?`<button class="lnk" data-a="player" data-v="${q.id}">${esc(q.name)}</button><i>${posLabel(q)}</i>`:'<span class="muted">-</span>'}${x&&x.from!=null?`<i title="${esc(`${tshort(x.from)} ${d.y} ${r}라운드 지명권 → ${tshort(x.tid)}(트레이드)`)}">→${esc(tshort(x.tid))}</i>`:''}</td>`; }).join('')}</tr>`); }
  const mine=d.picks.filter(x=>x.tid===G.user&&x.pid>0).map(x=>G.players[x.pid]).filter(Boolean);
  return `${mine.length?`<section class="card"><div class="row between"><h2 class="sec">우리 지명 선수</h2><span class="small muted">${mine.length}명 · 내년 1월 합류</span></div><div class="tw"><table class="sqt candidate-table"><thead><tr>${['선수','순번','학교','능력','잠재력 추정','아마 기록','계약금'].map(l=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${mine.map(p=>{ const rp=scoutReport(p); return `<tr><td><button class="candidate-name" data-a="player" data-v="${p.id}">${avImg(p)}<span>${esc(p.name)}<small>${posLabel(p)} · ${p.age}세</small></span></button></td><td>${p.draft.rd}R ${p.draft.no}순위</td><td>${esc(p.school||'-')}</td><td>${hideOvr(p)?'?':rchip(rp.cur)}</td><td>${dpotChip(rp)}</td><td class="candidate-note">${esc(amLine(p))}</td><td class="num">${money(p.draft.bonus??bonusOf(p.draft.rd,p.draft.no,p))}</td></tr>`; }).join('')}</tbody></table></div></section>`:''}
  <section class="card"><h2 class="sec">라운드별 지명</h2><p class="small muted">열은 1라운드 순서입니다. 2라운드부터는 칸의 순위 숫자가 실제 지명 순서입니다.</p><div class="tw"><table class="dres"><thead><tr><th></th>${order.map(t=>`<th>${badge(t,18)}<br>${esc(tshort(t))}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div></section>`;
}


/* PC(FM식) 신인 드래프트: 왼쪽 큰 칸 후보 표(필터·정렬은 버튼 줄), 오른쪽 드래프트 상황 · 내 드래프트 보드 · 지역 스카우트(진행 중에는 우리 지명) */
function draftFM(head,seg,content,all,mine,live){ const d=G.draft, SL=(G.shortlist||[]).map(id=>all.find(x=>x.p.id===id)).filter(Boolean);
  const board=tfBox('drf-sl','내 드래프트 보드',`관심 ${SL.length}명`,tfT(['#','선수','스카우트','잠재력','남을 확률',''],SL.map((x,i)=>`<tr><td>${i+1}</td><td>${tfP(x.p,`${esc(posLabel(x.p))} · ${x.p.age}세 · ${esc(x.p.region||'')}`)}</td><td>#${x.rk}</td><td>${dpotChip(x.rp)}</td><td>${doChip(_dbO&&_dbO.P[x.p.id])}</td><td>${mine?`<button class="tc-i go" data-a="pick" data-v="${x.p.id}">지명</button>`:`<button class="tc-i" data-a="star" data-v="${x.p.id}">빼기</button>`}</td></tr>`),'관심 후보가 없습니다.'),dbSortBtns(1));
  let third;
  if(live){ const P=d.picks.filter(x=>x.tid===G.user&&(x.pid||x.pass));
    third=tfBox('drf-my','우리 지명',`${P.filter(x=>x.pid>0).length}명`,tfT(['순번','선수','잠재력'],P.map(x=>{ const q=x.pid>0?G.players[x.pid]:null; return `<tr><td>${x.rd}-${x.no}</td><td>${q?tfP(q,`${esc(posLabel(q))} · ${esc(q.school||'')}`):`<span class="muted">건너뜀${x.passReason?` · ${esc(x.passReason)}`:''}</span>`}</td><td>${q?dpotChip(scoutReport(q)):''}</td></tr>`; }),'아직 지명하지 않았습니다.')); }
  else third=tfBox('drf-reg','지역별 담당 스카우트',`${REG.length}개 지역`,tfT(['지역','담당 스카우트','후보','상위 30위 안'],REG.map(r=>{ const sc=scoutOf('am',r), L=all.filter(x=>x.p.region===r), gm=L.filter(x=>x.p.gmSeen===G.year).length;
      return `<tr class="${sc?'':'miss'}"><td>${esc(r)}</td><td>${sc?`${esc(sc.name)} ${sfStars(sc.skill||0)}`:`없음 · 잠재력 ?${gm?` (단장 관찰 ${gm}명은 평가)`:''}`}</td><td>${L.length}명</td><td>${L.filter(x=>x.rk<=30).length}명</td></tr>`; }))+'<p class="small muted tipme">담당 스카우트가 없는 지역 후보는 단장이 직접 본 선수만 잠재력을 판단합니다.</p>',`<button class="btn small" data-a="go" data-v="staff:scouts">스카우트 배치</button>`);
  return `<div class="drf ws-own"><section class="card drf-main draft-candidate-body">${seg}<div class="drf-c">${content}</div></section><div class="tf-r" style="grid-template-rows:minmax(0,auto) minmax(110px,1fr) minmax(110px,1fr)"><div class="drf-hd">${head}</div>${board}${third}</div></div>`; }
