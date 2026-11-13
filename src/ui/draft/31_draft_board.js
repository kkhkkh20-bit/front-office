/* ---------- 신인 드래프트 보드 ---------- */
const DPOS={all:'전체',P:'투수',C:'포수',IF:'내야',OF:'외야'};
function dposOf(p){ return p.isP?'P':p.pos==='C'?'C':['1B','2B','3B','SS'].includes(p.pos)?'IF':'OF'; }
function dval(rp){ return draftVal(rp); }
function draftPool(){ const live=G.draft&&!G.draft.done; return ((live?G.draft.cls:G.draftClass)||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect); }
/* 담당 스카우트 주장 표시: 정답 배지가 아니라 스카우트 의견. 틀릴 수 있다 */
function dclaimTag(p){ const c=draftClaim(p); if(!c)return ''; return `<b class="${c.k==='up'?'good':'warn'}" title="${esc(draftClaimTxt(c))}">${c.k==='up'?'강력 추천':'신중론'}(확신도 ${c.conf})</b> · `; }
/* 잠재력은 한 숫자 대신 스카우트 추정 범위로 */
function dpotChip(rp){ if(rp.ofp==null)return '<span class="small muted">?</span>'; const T=potTier(potVal(rp),rp.cur); const unsure=(rp.sd||6)>=7; return `<span class="ptier t${T.n}" data-tip="${esc(`스카우트 추정: ${T.l}${unsure?' · 관찰이 적어 오차가 큽니다':''}. 부상·출전 기회·훈련 환경에 따라 그렇게 크지 못할 수 있습니다.\n\n${POT_HELP}`)}">${potStars(T.st)}</span>`; }
/* 2대 선수: 아버지 OB 프로필로 가는 'OO의 아들'(11-09r) */
function sonTag(p){ const o=fatherOf(p); return o?`<button class="lnk" data-a="person" data-v="ob:${o.id}">${esc(o.name)}</button>의 아들`:''; }
function drow(p,rp,rk,mine){ const star=(G.shortlist||[]).includes(p.id);
  const tag=dclaimTag(p); const fit=draftFit(p,draftPolK())?' · <b class="acc">감독 추천</b>':'';
  return `<div class="drw${star?' star':''}"><span class="drw-k num">${rk}</span><button class="mr-p" data-a="player" data-v="${p.id}">${avImg(p)}<span><b>${esc(p.name)} <small>${posLabel(p)} · ${p.college?'대졸':'고졸'}</small></b><i>${tag}${fatherOf(p)?`${esc(fatherOf(p).name)}의 아들 · `:''}${esc(p.school||'')} · ${p.region} · 언론 #${p.press||'-'}${fit}${rp.eta?` · 1군까지 약 ${rp.eta}년`:''}${p.amInj?' · <b class="bad">부상 이력</b>':''}</i></span></button><span class="trw-r">${rchip(rp.cur)}${dpotChip(rp)}</span><button class="tc-i drw-s${star?' on':''}" data-a="star" data-v="${p.id}" aria-pressed="${star}" aria-label="관심">${star?'★':'☆'}</button>${mine?`<button class="tc-i go drw-p" data-a="pick" data-v="${p.id}">지명</button>`:''}</div>`; }
function draftCandidateTable(list,mine){
  if(!list.length)return '<p class="small muted">조건에 맞는 후보가 없습니다.</p>';
  return `<div class="tw"><table class="sqt candidate-table"><thead><tr>${['선수','스카우트','언론','구분','학교','투타','아마 기록','잠재력 추정','위험도','행동'].map(l=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${list.map(({p,rp,rk})=>{const star=(G.shortlist||[]).includes(p.id);return `<tr><td><button class="candidate-name" data-a="player" data-v="${p.id}">${avImg(p)}<span>${esc(p.name)}<small>${posLabel(p)} · ${p.age}세${fatherOf(p)?` · ${esc(fatherOf(p).name)}의 아들`:''}</small></span></button></td><td>${rk}</td><td>${p.press||'-'}</td><td>${p.college?'대졸':'고졸'}</td><td>${esc(p.school||'-')}</td><td>${hand(p)}</td><td class="candidate-note">${esc(amShort(p))||'기록 없음'}</td><td>${dpotChip(rp)}</td><td><span class="${rp.risk==='높음'?'bad':''}">${esc(rp.risk||'미확인')}</span>${p.amInj?' · 부상 이력':''}</td><td><button class="tc-i${star?' on':''}" data-a="star" data-v="${p.id}">${star?'관심 중':'관심'}</button>${mine?`<button class="tc-i go" data-a="pick" data-v="${p.id}">지명</button>`:''}</td></tr>`;}).join('')}</tbody></table></div>`;
}
function dcard(p,rp,rk,mine){
  const star=(G.shortlist||[]).includes(p.id);
  const cl=draftClaim(p);
  const tags=`${draftFit(p,draftPolK())?'<span class="pill acc">감독 추천</span>':''}<span class="pill ${rk<=10?'good':''}">스카우트 #${rk}</span><span class="pill">언론 #${p.press||'-'}</span>${cl?`<span class="pill ${cl.k==='up'?'good':'warn'}">${esc(draftClaimWho(cl))} ${cl.k==='up'?'강력 추천':'신중론'}</span>`:''}${p.amInj?'<span class="pill bad">부상 이력</span>':''}`;
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
  return `<div class="drest drest-v"><div class="row between"><b>스카우트 추천으로 자동 지명</b><span class="small muted">${sub}</span></div><div class="row"><button class="btn small${on('cond',3)}" data-a="draftRest" data-v="cond:3">★2(1군 백업) 이상만</button><button class="btn small${on('cond',4)}" data-a="draftRest" data-v="cond:4">★3(주전감) 이상만</button><button class="btn small${on('pass')}" data-a="draftRest" data-v="pass:0">남은 지명 건너뛰기</button>${pre?'<button class="btn small" data-a="draftRest" data-v="off">해제</button>':''}</div><p class="small">현재 후보 ${S.total}명 · ${pre?.min===3?'★2':'★3'} 이상 확인 ${S.fit}명 · 잠재력 미확인 ${S.unknown}명${S.full?' · 로스터 한도 도달: 자동 지명은 건너뜁니다':''}</p><p class="small muted">${pre?`드래프트가 열리면 '${pre.mode==='pass'?'남은 지명 건너뛰기':pre.min>=4?'★3 이상만':'★2 이상만'}' 기준으로 우리 지명을 자동 처리합니다. `:''}스카우트 추천 순서대로 뽑되, 잠재력 추정이 기준에 못 미치는 선수는 뽑지 않고 그 지명을 건너뜁니다. KBO 규약상 지명권 패스는 라운드 제한이 없어 1·2라운드도 같은 기준입니다. 로스터가 한도(${ROSTER_MAX}명)에 차면 더 뽑지 않습니다. 기준 충족 후보가 없고 미확인 후보가 남으면 자동 진행을 멈추고 직접 확인을 요청합니다. 진행 중에 '그만두고 직접 고르기'로 멈출 수 있습니다.</p></div>`; }
/* 내 드래프트 보드: 관심 목록 순서가 곧 내 순위. 메모·고려 라운드·확인할 것을 남긴다 */
const DCHK=['타격','제구','구위','수비','주루','건강','성격'];
function dmemoOf(id){ G.dmemo=G.dmemo||{}; return G.dmemo[id]||(G.dmemo[id]={t:'',rd:0,chk:[]}); }
function myBoard(all,mine){ const L=(G.shortlist||[]).map(id=>all.find(x=>x.p.id===id)).filter(Boolean); if(!L.length)return '';
  const row=(x,i)=>{ const p=x.p, rp=x.rp, m=dmemoOf(p.id); const rw=riskWhy(p,rp);
    return `<div class="dbr"><span class="num dbr-k">${i+1}</span><div class="dbr-mv"><button class="tc-i" data-a="dmove" data-v="${p.id}:-1" aria-label="위로" ${i?'':'disabled'}>▲</button><button class="tc-i" data-a="dmove" data-v="${p.id}:1" aria-label="아래로" ${i<L.length-1?'':'disabled'}>▼</button></div>
      <div class="dbr-b"><button class="lnk" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b></button> <span class="small muted">${posLabel(p)} · 스카우트 #${x.rk} · ${rp.ofp!=null?potTier(potVal(rp),rp.cur).s:'잠재력 ?'}${rp.eta?` · 1군까지 약 ${rp.eta}년`:''}${rw.length?` · ${esc(rw.join(' · '))}`:''}</span>
      <div class="row wrapr" style="gap:6px"><span class="chips drd" role="group" aria-label="고려 라운드">${[0,...Array.from({length:DRAFT_ROUNDS},(_,k)=>k+1)].map(r=>`<button data-a="drdB" data-v="${p.id}:${r}" class="${(m.rd||0)===r?'on':''}">${r?r+'R':'미정'}</button>`).join('')}</span><input type="text" data-a="dmemo" data-v="${p.id}" value="${esc(m.t)}" maxlength="40" placeholder="관심 이유·메모" aria-label="메모" style="min-width:140px;flex:1"></div>
      <div class="chips">${DCHK.map(k=>`<button data-a="dchk" data-v="${p.id}:${k}" class="${m.chk.includes(k)?'on':''}">${k} 재확인</button>`).join('')}</div></div>
      ${mine?`<button class="tc-i go" data-a="pick" data-v="${p.id}">지명</button>`:''}</div>`; };
  return `<section class="card"><div class="row between"><h2 class="sec">내 드래프트 보드</h2><span class="small muted">관심 ${L.length}명 · ▲▼로 내 순위</span></div><p class="small muted">순서가 지명 때 '관심 1순위'가 됩니다. 스카우트 순위와 달라도 됩니다. 메모와 고려 라운드, 다시 확인할 것을 남겨 두세요.</p><div class="dboard">${L.map(row).join('')}</div></section>`; }
function draftBoard(){
  const live=G.draft&&!G.draft.done; const d=G.draft; const pk=live?d.picks[d.cur]:null; const mine=!!(pk&&pk.tid===G.user);
  const pool=draftPool();
  if(!pool.length&&!live)return `<p class="small muted keep"><b>신인 드래프트</b> 올해 드래프트는 끝났습니다. 다음 해 참가 선수 명단은 새해에 나옵니다.</p>`+(d&&d.done?draftResults():''); /* 안내는 패널 밖 한 줄, 칸은 지명 결과에 */
  const all=pool.map(p=>({p,rp:scoutReport(p)})).sort((a,b)=>dval(b.rp)-dval(a.rp)); all.forEach((x,i)=>x.rk=i+1);
  const f=UI.df||(UI.df={pos:'all',typ:'all',reg:'all',star:false,sort:'rk',seg:'board',more:20});
  const noScout=REG.filter(r=>!scoutOf('am',r)); /* 아마추어 담당 기준(프로 담당만 있으면 신인 잠재력은 ?, 검수 11-07) */
  const gmN=r=>pool.filter(p=>p.region===r&&p.gmSeen===G.year).length; /* 단장이 직접 본 후보는 담당이 없어도 잠재력을 본다(검수 11-09ze) */
  let head;
  if(live){
    const rest=draftRestOf(); /* 이 구단에서 설정한 일괄 처리만 */
    const myLeft=d.picks.slice(d.cur).filter(x=>x.tid===G.user).length;
    const recent=d.picks.slice(Math.max(0,d.cur-8),d.cur).reverse();
    const firstStar=(G.shortlist||[]).map(id=>G.players[id]).find(p=>p&&p.prospect);
    const proj=rosterProj(G.user); const cut=trimCands(1)[0]; const crp=cut?scoutReport(cut):null;
    const capLine=`<div class="cap-line"><span>정식 로스터 ${rosterN(G.user)}명 + 이번 지명 ${draftedBy(G.user)}명${milBackBy(G.user)?` + 개막 전 전역 ${milBackBy(G.user)}명`:''} = <b style="color:${proj>=ROSTER_MAX?'var(--bad)':proj>=ROSTER_MAX-3?'var(--warn)':'var(--good)'}">${proj}</b> / ${ROSTER_MAX}</span>${proj>=ROSTER_MAX&&cut?`<span class="small">더 뽑으면 개막 전 방출이 필요합니다. 1순위 정리 후보: <button class="lnk" data-a="player" data-v="${cut.id}">${esc(cut.name)}</button> (${posLabel(cut)} · ${cut.age}세 · 현재 ${dv(crp.cur)} / ${crp.ofp!=null?potTier(potVal(crp),crp.cur).s:'잠재력 ?'})</span>`:''}</div>`;
    const restBox=rest||!myLeft?'':drestBox(null,`남은 우리 지명 ${myLeft}번`);
    const feed=`${dliveBox('am')}${recent.length&&!(dlSame('am')&&UI.dl.feed&&UI.dl.feed.length)?`<div class="dlog">${recent.map(x=>{const q=G.players[x.pid]; return `<span>${badge(x.tid,18)}<i>${x.rd}-${x.no}</i>${x.pass?'<em>건너뜀</em>':q?`<b>${esc(q.name)}</b> <em>${posLabel(q)}</em>`:''}</span>`}).join('')}</div>`:''}`;
    /* 휴대폰·태블릿: 순위·우리 차례·추천 지명은 상단 바(draftTop)로 옮기고, 여기에는 일괄 처리 중 안내와 다른 구단 지명 소식만. 나머지는 상단 바 드래프트 정보를 누르면 펼친다 */
    const fold=!wide(), more=fold&&!!UI.open?.draftMore;
    const btns=`${mine?`${firstStar?`<button class="btn primary" data-a="pick" data-v="${firstStar.id}" title="관심 1순위 지명">관심 1순위 ${esc(firstStar.name)} 지명</button>`:''}${fold?'':'<button class="btn" data-a="autoPick">스카우트 추천 지명</button>'}<button class="btn" data-a="passPick">이번 지명 건너뛰기</button>`:fold?'':`<button class="btn primary" data-a="advDraft" ${UI.dl&&UI.dl.on?'disabled':''}>${UI.dl&&UI.dl.on?'다른 구단 지명 중…':'다른 구단 지명 보기'}</button>`}`;
    const eyeRow=`<span class="eyebrow">${d.y||G.year} 신인 드래프트 · ${DRAFT_ROUNDS}라운드 순번 ${d.picks.length}개 · 지명 ${d.picks.filter(x=>x.pid>0).length}명</span><span class="small muted">우리 남은 지명 ${myLeft}번</span>`;
    const restOn=rest?`<p class="small drest-on">일괄 처리 중: ${rest.mode==='pass'?'남은 지명 건너뛰기':`'${rest.min>=4?'주전감(★3)':'1군 백업(★2)'}' 이상만 추천 지명`} <button class="btn small" data-a="draftRest" data-v="off">그만두고 직접 고르기</button></p>`:'';
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
      <p class="dpre-no">${dn?`우리 첫 지명은 <b>${draftFirstTxt(dn)}</b>${dn.first&&(dn.first.rd!==1||dn.first.no!==dn.r1)?` (원래 1라운드 ${dn.r1}순위 · 지명권 거래 반영)`:dn.r2!==dn.r1?`, 2라운드부터 ${dn.r2}순위`:''}`:`참가 ${pool.length}명`} ${hiI(`참가 선수 ${pool.length}명 중 ${DRAFT_ROUNDS}라운드 순번 ${DRAFT_ROUNDS*10}개만큼 지명합니다. 구단은 어느 라운드든 지명을 건너뛸(패스) 수 있어 실제 지명 인원은 더 적을 수 있습니다. 지명 순서는 지난 시즌 성적의 역순입니다.`)}</p>
      ${dn?drestBox(draftRestPre(),'드래프트 전에 미리 정해 두기'):''}
      <details class="frule"><summary class="small">로스터·순위 안내</summary><p class="small">지금 정식 로스터는 ${rosterN(G.user)}/${ROSTER_MAX}명입니다. 지명한 신인은 내년 1월에 합류하므로, 그만큼 기존 선수를 방출해야 합니다. 지명은 어느 라운드든 건너뛸 수 있고, 다른 구단도 로스터가 차면 건너뜁니다.</p>
      <p class="small muted">언론 순위는 성적과 체격만 본 평가이고, 우리 순위는 담당 스카우트·단장 관찰과 관찰 전 임시 현재능력 추정을 포함합니다. 관찰 0회 후보의 잠재력은 첫 관찰 전까지 ?로 표시합니다. 스카우트도 틀립니다. 관찰이 쌓일수록 정확해지지만, 스카우트마다 좋아하는 유형이 있어 그 버릇은 남습니다. '강력 추천'은 언론보다 훨씬 높게 보는 후보에 대한 스카우트의 주장입니다.${noScout.length?` <b>${noScout.join(', ')}</b> 지역은 담당 스카우트가 없어 잠재력이 ?로 나옵니다${noScout.some(gmN)?`(단장이 직접 본 후보 ${noScout.map(gmN).reduce((a,b)=>a+b,0)}명은 평가됨)`:''}.`:''} 관심 표시한 선수는 지명 때 바로 고를 수 있습니다.</p>
      </details>
    </section>`;
  }
  const seg=`<div class="seg"><button data-a="dset" data-v="seg:board" class="${f.seg==='board'?'on':''}">후보 목록</button><button data-a="dset" data-v="seg:sum" class="${f.seg==='sum'?'on':''}">스카우트 요약</button><button data-a="dset" data-v="seg:res" class="${f.seg==='res'?'on':''}">지명 현황</button><button data-a="dset" data-v="seg:mine" class="${f.seg==='mine'?'on':''}">관심 목록 (${(G.shortlist||[]).filter(id=>G.players[id]&&G.players[id].prospect).length})</button></div>`;
  const frame=content=>fmOn()?draftFM(head,seg,content,all,mine,live):`<div class="draft-page"><aside class="draft-context">${head}</aside><div class="draft-candidate-body">${seg}${content}</div></div>`;
  if(f.seg==='res')return frame(draftResults());
  if(f.seg==='sum')return frame(draftCenter(all,mine));
  const center='';
  let list=all.filter(({p})=>(f.pos==='all'||dposOf(p)===f.pos)&&(f.typ==='all'||(f.typ==='hs')!==p.college)&&(f.reg==='all'||p.region===f.reg)&&(f.seg!=='mine'||(G.shortlist||[]).includes(p.id)));
  const sorts={rk:(a,b)=>a.rk-b.rk,press:(a,b)=>(a.p.press||999)-(b.p.press||999),stat:(a,b)=>amScore(b.p)-amScore(a.p),fut:(a,b)=>(b.rp.ofp??0)-(a.rp.ofp??0),cur:(a,b)=>b.rp.cur-a.rp.cur};
  list.sort(sorts[f.sort]||sorts.rk);
  const chips=(k,opts)=>`<div class="chips">${opts.map(([v,l])=>`<button data-a="dset" data-v="${k}:${v}" class="${f[k]===v?'on':''}">${l}</button>`).join('')}</div>`;
  const filt=`<section class="card dfilt">
    ${chips('pos',Object.entries(DPOS))}
    <div class="row wrapr">${chips('typ',[['all','고졸·대졸'],['hs','고졸'],['col','대졸']])}${chips('reg',[['all','전 지역'],...REG.map(r=>[r,r])])}</div>
    <div class="row between wrapr"><span class="small muted">정렬</span>${chips('sort',[['rk','스카우트 순위'],['press','언론 순위'],['stat','아마 성적']])}</div>
    <p class="small muted">${list.length}명 표시 · 남은 참가자 ${pool.length}명</p></section>`;
  /* 휴대폰·태블릿: 필터 칩이 첫 화면을 다 차지하지 않게 요약 한 줄로 접는다(PC는 그대로) */
  const lab=(k,opts)=>(opts.find(o=>o[0]===f[k])||[,''])[1];
  const filtM=fmOn()?filt:`<details class="card dfilt dfilt-d" data-k="draftFilters" ${UI.open?.draftFilters?'open':''}><summary class="small">필터 · ${[lab('pos',Object.entries(DPOS)),f.typ==='all'?'':lab('typ',[['hs','고졸'],['col','대졸']]),f.reg==='all'?'':f.reg,lab('sort',[['rk','스카우트 순위'],['press','언론 순위'],['stat','아마 성적']])].filter(Boolean).join(' · ')} · ${list.length}/${pool.length}명</summary>${filt.replace(/^<section class="card dfilt">|<\/section>$/g,'')}</details>`;
  const dvw=UI.dview||'list'; const pk2='dr'+f.seg+f.pos+f.typ+f.reg+f.sort+dvw; const PG=pager(pk2,list,dvw==='list'?15:(wide()?6:4));
  const vt=`<div class="row between"><div class="seg sm"><button data-a="dview" data-v="list" class="${dvw==='list'?'on':''}">목록</button><button data-a="dview" data-v="card" class="${dvw==='card'?'on':''}">상세</button></div>${wide()?`<span class="small muted">이름 · 아마 기록 · 평가 순위 · 잠재력 추정 · 관심${mine?' · 지명':''}</span>`:hiI(`목록 칸: 이름 · 아마 기록 · 평가 순위 · 잠재력 추정 · 관심${mine?' · 지명':''}`)}</div>`;
  const empty=f.seg==='mine'&&!(G.shortlist||[]).some(id=>G.players[id]&&G.players[id].prospect)?'<p class="small muted">관심 선수가 없습니다. 후보 목록에서 ☆를 눌러 담으세요.</p>':'<p class="small muted">조건에 맞는 선수가 없습니다.</p>';
  return frame((f.seg==='mine'?myBoard(all,mine)+vt:`<div class="dtools">${filtM}${vt}</div>`)+(dvw==='list'?`<section class="card candidate-list draft-candidates" data-pg="${pk2}">${draftCandidateTable(PG.items,mine)}${PG.bar}</section>`:`<div class="tgrid dgrid" data-pg="${pk2}">${PG.items.map(x=>dcard(x.p,x.rp,x.rk,mine)).join('')||empty}</div>${PG.bar}`));
}
function draftResults(){
  const d=G.draft; if(!d)return csec('지명 현황','<p class="small muted">드래프트가 시작되면 라운드별 지명 결과가 여기에 쌓입니다.</p>');
  const order=d.picks.filter(x=>x.rd===1).map(x=>x.from??x.tid); /* 열은 원래 구단 순번(지명권 트레이드로 넘긴 칸은 → 새 구단 표시) */
  const rows=[]; for(let r=1;r<=DRAFT_ROUNDS;r++){ rows.push(`<tr><th>${r}R</th>${order.map(tid=>{ const x=d.picks.find(q=>q.rd===r&&(q.from??q.tid)===tid); const q=x&&x.pid>0?G.players[x.pid]:null;
    return `<td class="${x&&x.tid===G.user?'me':''}">${x?`<small class="muted">${x.no}순위</small> `:''}${x&&x.pass?`<span class="muted">건너뜀${x.passReason?` · ${esc(x.passReason)}`:''}</span>`:q?`<button class="lnk" data-a="player" data-v="${q.id}">${esc(q.name)}</button><i>${posLabel(q)}</i>`:'<span class="muted">-</span>'}${x&&x.from!=null?`<i>→${esc(tshort(x.tid))}</i>`:''}</td>`; }).join('')}</tr>`); }
  const mine=d.picks.filter(x=>x.tid===G.user&&x.pid>0).map(x=>G.players[x.pid]).filter(Boolean);
  return `${mine.length?`<section class="card"><div class="row between"><h2 class="sec">우리 지명 선수</h2><span class="small muted">${mine.length}명 · 내년 1월 합류</span></div><div class="tw"><table class="sqt candidate-table"><thead><tr>${['선수','순번','학교','능력','잠재력 추정','아마 기록','계약금'].map(l=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${mine.map(p=>{ const rp=scoutReport(p); return `<tr><td><button class="candidate-name" data-a="player" data-v="${p.id}">${avImg(p)}<span>${esc(p.name)}<small>${posLabel(p)} · ${p.age}세</small></span></button></td><td>${p.draft.rd}R ${p.draft.no}순위</td><td>${esc(p.school||'-')}</td><td>${hideOvr(p)?'?':rchip(rp.cur)}</td><td>${dpotChip(rp)}</td><td class="candidate-note">${esc(amLine(p))}</td><td class="num">${money(p.draft.bonus??bonusOf(p.draft.rd,p.draft.no,p))}</td></tr>`; }).join('')}</tbody></table></div></section>`:''}
  <section class="card"><h2 class="sec">라운드별 지명</h2><p class="small muted">열은 1라운드 순서입니다. 2라운드부터는 칸의 순위 숫자가 실제 지명 순서입니다.</p><div class="tw"><table class="dres"><thead><tr><th></th>${order.map(t=>`<th>${badge(t,18)}<br>${esc(tshort(t))}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div></section>`;
}


/* PC(FM식) 신인 드래프트: 왼쪽 큰 칸 후보 표(필터·정렬은 버튼 줄), 오른쪽 드래프트 상황 · 내 드래프트 보드 · 지역 스카우트(진행 중에는 우리 지명) */
function draftFM(head,seg,content,all,mine,live){ const d=G.draft, SL=(G.shortlist||[]).map(id=>all.find(x=>x.p.id===id)).filter(Boolean);
  const board=tfBox('drf-sl','내 드래프트 보드',`관심 ${SL.length}명`,tfT(['#','선수','스카우트','잠재력','위험',''],SL.map((x,i)=>`<tr><td>${i+1}</td><td>${tfP(x.p,`${esc(posLabel(x.p))} · ${x.p.age}세 · ${esc(x.p.region||'')}`)}</td><td>#${x.rk}</td><td>${dpotChip(x.rp)}</td><td class="${x.rp.risk==='높음'?'bad':x.rp.risk==='낮음'?'good':''}">${esc(x.rp.risk||'-')}</td><td>${mine?`<button class="tc-i go" data-a="pick" data-v="${x.p.id}">지명</button>`:`<button class="tc-i" data-a="star" data-v="${x.p.id}">빼기</button>`}</td></tr>`),'후보 표에서 관심을 누르면 여기 모입니다. 순서는 관심 목록 탭에서 ▲▼로 바꿉니다.'));
  let third;
  if(live){ const P=d.picks.filter(x=>x.tid===G.user&&(x.pid||x.pass));
    third=tfBox('drf-my','우리 지명',`${P.filter(x=>x.pid>0).length}명`,tfT(['순번','선수','잠재력'],P.map(x=>{ const q=x.pid>0?G.players[x.pid]:null; return `<tr><td>${x.rd}-${x.no}</td><td>${q?tfP(q,`${esc(posLabel(q))} · ${esc(q.school||'')}`):`<span class="muted">건너뜀${x.passReason?` · ${esc(x.passReason)}`:''}</span>`}</td><td>${q?dpotChip(scoutReport(q)):''}</td></tr>`; }),'아직 지명하지 않았습니다.')); }
  else third=tfBox('drf-reg','지역별 담당 스카우트',`${REG.length}개 지역`,tfT(['지역','담당 스카우트','후보','상위 30위 안'],REG.map(r=>{ const sc=scoutOf('am',r), L=all.filter(x=>x.p.region===r), gm=L.filter(x=>x.p.gmSeen===G.year).length;
      return `<tr class="${sc?'':'miss'}"><td>${esc(r)}</td><td>${sc?`${esc(sc.name)} ${sfStars(sc.skill||0)}`:`없음 · 잠재력 ?${gm?` (단장 관찰 ${gm}명은 평가)`:''}`}</td><td>${L.length}명</td><td>${L.filter(x=>x.rk<=30).length}명</td></tr>`; }))+'<p class="small muted tipme">담당 스카우트가 없는 지역 후보는 단장이 직접 본 선수만 잠재력을 판단합니다.</p>',`<button class="btn small" data-a="go" data-v="staff:scouts">스카우트 배치</button>`);
  return `<div class="drf ws-own"><section class="card drf-main draft-candidate-body">${seg}<div class="drf-c">${content}</div></section><div class="tf-r" style="grid-template-rows:minmax(0,auto) minmax(0,1fr) minmax(0,1fr)">${head}${board}${third}</div></div>`; }
