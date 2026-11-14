/* ---------- 이적시장 현황: 항상 볼 수 있는 요약과 전체 기록 ---------- */
const MV_TYPES=['FA','트레이드','외국인','방출','무적 영입','보상선수','웨이버 양수','2차 드래프트','해외 진출','해외 복귀'];
function mvTeam(t){ return t==null?'-':`${badge(t,14)} ${esc(tshort(t))}`; }
function mvDir(m){ return m.t==='방출'||m.t==='해외 진출'?`${mvTeam(m.from)} →`:m.from!=null&&m.to!=null&&m.from!==m.to?`${mvTeam(m.from)} → ${mvTeam(m.to)}`:`→ ${mvTeam(m.to)}`; }
function mvLine(m,brief){ const me=m.to===G.user||m.from===G.user; const dir=mvDir(m);
  return `<div class="mvl${me?' me':''}"${pAttr(m.pid)}><span class="ticker">${dsh(m.d)}</span><span class="pill mv-${MV_TYPES.indexOf(m.t)}">${esc(m.t)}</span><b>${esc(m.n)}</b><span class="small muted">${esc(m.pos)}·${m.age}세</span><span class="mvd">${dir}</span>${brief?'':`<span class="small">${esc(m.note)}</span>`}</div>`; }
function mvStatus(){ const per=period(); const L=[];
  if(G.fa&&!G.fa.closed&&(G.fa.pool||[]).length){ const pool=G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null).sort((a,b)=>ovr(b)-ovr(a)); L.push(`FA 시장 진행 중: 남은 FA ${pool.length}명${pool.length?` (최대어 ${pool.slice(0,3).map(p=>`${p.name} ${p.faGrade||''}`).join(', ')})`:''}`); }
  else if(per!=='season'&&per!=='post'&&!faLive()&&!(G.fa&&G.fa.closed))L.push('FA 시장은 한국시리즈가 끝난 뒤 열립니다.');
  if(per==='season'||(per==='pre'&&G.day>=KD(3,1))){ const dl=KD(7,31); if(G.day<=dl)L.push(`트레이드 마감 ${dmd(dl)} (D-${dl-G.day})`); else L.push('트레이드 마감이 지났습니다. 포스트시즌 뒤 다시 열립니다.'); const fd=foreignDL(); if(G.day<=fd)L.push(`외국인 등록 마감 ${dmd(fd)} (D-${fd-G.day})`); }
  return L; }
function mvHomeCard(){ const W=mvWindow(); const L=(G.moves||[]).slice(0,5); const st=mvStatus();
  const n=k=>W.filter(m=>m.t===k).length;
  return `<section class="card mvcard"><div class="row between"><h2 class="sec">이적시장</h2><button class="btn small" data-a="go" data-v="transfer:moves">전체 보기</button></div>
    <div class="small muted">${esc(mvWinLabel())} · FA ${n('FA')} · 트레이드 ${mvTrN(W)} · 외국인 ${n('외국인')} · 방출 ${n('방출')}</div>
    ${st.length?`<div class="small">${st.map(esc).join('<br>')}</div>`:''}
    ${L.length?L.map(m=>mvLine(m,true)).join(''):'<p class="small muted">아직 이적 소식이 없습니다.</p>'}</section>`; }
function movesView(){ if(fmOn())return movesFM(); const W=mvWindow(); const st=mvStatus(); UI.mvf=UI.mvf||{}; const f=UI.mvf;
  const cnt=MV_TYPES.map(k=>[k,W.filter(m=>m.t===k).length]).filter(x=>x[1]);
  const big=W.filter(m=>m.amt>0&&m.t!=='외국인').sort((a,b)=>b.amt-a.amt).slice(0,6);
  /* 구단별 영입·이탈 */
  const led=G.teams.map(t=>({t:t.id,in:W.filter(m=>m.to===t.id&&m.from!==t.id),out:W.filter(m=>m.from===t.id&&m.to!==t.id),stay:W.filter(m=>m.t==='FA'&&m.from===t.id&&m.to===t.id)}));
  const nm=a=>a.map(m=>pAttr(m.pid)?`<button class="lnk"${pAttr(m.pid)}>${esc(m.n)}</button>`:esc(m.n)).join(', ');
  const all=(G.moves||[]).filter(m=>(!f.t||m.t===f.t)&&(f.tm==null||m.to===f.tm||m.from===f.tm)).slice(0,120); const AP=pager('mv'+(f.t||'')+(f.tm??''),all,15);
  const it=inTabs('mvv',[['sum','요약'],['team','구단별'],['all','전체 기록']],'sum'); const PARTS=[csec(`이적 현황 · ${mvWinLabel()}`,`${st.length?`<div class="mv-st">${st.map(t=>`<p class="small">${esc(t)}</p>`).join('')}</div>`:''}
      <div class="chips">${cnt.map(([k,n])=>`<span class="pill">${k} ${n}</span>`).join('')||'<span class="small muted">이번 구간 이동 없음</span>'}</div>
      ${big.length?`<div class="eyebrow" style="margin-top:8px">큰 계약</div>${big.map(m=>mvLine(m)).join('')}`:''}`),
    csec('구단별 영입·이탈',`<div class="tw"><table class="mvt"><thead><tr><th>구단</th><th>영입</th><th>이탈</th><th>FA 잔류</th></tr></thead><tbody>${led.filter(r=>r.in.length||r.out.length||r.stay.length||r.t===G.user).map(r=>`<tr class="${r.t===G.user?'me':''}"><td>${mvTeam(r.t)}</td><td class="small">${nm(r.in)||'-'}</td><td class="small">${nm(r.out)||'-'}</td><td class="small">${nm(r.stay)||'-'}</td></tr>`).join('')}</tbody></table></div>`),
    csec('전체 기록',`<div class="chips"><button data-a="mvF" data-v="t:" class="${!f.t?'on':''}">전체</button>${MV_TYPES.map(k=>`<button data-a="mvF" data-v="t:${k}" class="${f.t===k?'on':''}">${k}</button>`).join('')}</div>
      <div class="chips"><button data-a="mvF" data-v="tm:" class="${f.tm==null?'on':''}">모든 구단</button>${G.teams.map(t=>`<button data-a="mvF" data-v="tm:${t.id}" class="${f.tm===t.id?'on':''}">${esc(tshort(t.id))}</button>`).join('')}</div>
      ${all.length?AP.items.map(m=>mvLine(m)).join('')+AP.bar:'<p class="small muted">기록이 없습니다.</p>'}`)]; return it.bar+PARTS[{sum:0,team:1,all:2}[it.cur]]; }

/* PC 이적 현황(FM 이적 소식처럼): 위 유형별 건수, 왼쪽 전체 기록 표(유형·구단 버튼 줄), 오른쪽 시장 일정 · 구단별 영입·이탈 · 큰 계약 */
function movesFM(){ const W=mvWindow(), st=mvStatus(); UI.mvf=UI.mvf||{}; const f=UI.mvf;
  const top=tfKpi([['기간',esc(mvWinLabel()),'',`이동 ${W.length}건`],...MV_TYPES.map(k=>[k,`${W.filter(m=>m.t===k).length}건`])]);
  const all=(G.moves||[]).filter(m=>(!f.t||m.t===f.t)&&(f.tm==null||m.to===f.tm||m.from===f.tm)).slice(0,200);
  const pl=m=>pAttr(m.pid)?`<button class="lnk"${pAttr(m.pid)}>${esc(m.n)}</button>`:esc(m.n);
  const tbl=tfBox('tf-mv','전체 기록',`${all.length}건${all.length>=200?' · 최근 200건':''}`,tfChips('mvF',`t:${f.t||''}`,[['t:','전체'],...MV_TYPES.map(k=>[`t:${k}`,k])])+tfChips('mvF',`tm:${f.tm??''}`,[['tm:','모든 구단'],...G.teams.map(t=>[`tm:${t.id}`,esc(tshort(t.id))])])
    +tfT(['날짜','유형','선수','포지션 · 나이','이동','내용'],all.map(m=>`<tr class="${m.to===G.user||m.from===G.user?'me':''}"><td>${dsh(m.d)}</td><td><span class="pill mv-${MV_TYPES.indexOf(m.t)}">${esc(m.t)}</span></td><td>${pl(m)}</td><td>${esc(m.pos)} · ${m.age}세</td><td>${mvDir(m)}</td><td class="wrap small">${esc(m.note||'')}</td></tr>`),'기록이 없습니다.'));
  const sch=tfBox('tf-mvst','시장 일정',esc(mvWinLabel()),st.length?`<ul class="tf-ul">${st.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<p class="small muted">지금 열린 시장이 없습니다.</p>');
  const led=G.teams.map(t=>({t:t.id,in:W.filter(m=>m.to===t.id&&m.from!==t.id),out:W.filter(m=>m.from===t.id&&m.to!==t.id),stay:W.filter(m=>m.t==='FA'&&m.from===t.id&&m.to===t.id)}));
  const nm=a=>esc(a.map(m=>m.n).join(', '));
  const team=tfBox('tf-mvt','구단별 영입·이탈',esc(mvWinLabel()),tfT(['구단','영입','이탈','FA 잔류'],led.map(r=>`<tr class="${r.t===G.user?'me':''}"><td><button class="lnk" data-a="mvF" data-v="tm:${r.t}">${badge(r.t,16)} ${esc(tshort(r.t))}</button></td><td title="${nm(r.in)}">${r.in.length}</td><td title="${nm(r.out)}">${r.out.length}</td><td title="${nm(r.stay)}">${r.stay.length}</td></tr>`))+'<p class="small muted tipme">구단 이름을 누르면 왼쪽 기록이 그 구단으로 좁혀집니다. 숫자에 마우스를 올리면 선수 이름이 보입니다.</p>');
  const big=W.filter(m=>m.amt>0&&m.t!=='외국인').sort((a,c)=>c.amt-a.amt).slice(0,10);
  const bigB=tfBox('tf-big','큰 계약',`${big.length}건`,tfT(['선수','이동','내용'],big.map(m=>`<tr><td>${pl(m)}<span class="scn-s">${esc(m.t)} · ${dsh(m.d)}</span></td><td>${mvDir(m)}</td><td class="wrap small">${esc(m.note||'')}</td></tr>`),'이번 구간에 큰 계약이 없습니다.'));
  return tfWrap(top,tbl,sch+team+bigB,'','minmax(0,auto) minmax(0,1.2fr) minmax(0,1fr)'); }
/* ---------- 웨이버·2차 드래프트(KBO 선수 이동 제도): 영입·계약 → 웨이버·2차 ---------- */
function kboView(){ return wvBox()+sdBox(); }
function wvBox(){ const L=wvList().sort((a,b)=>ovr(b)-ovr(a));
  const row=p=>{ const w=p.wv, on=w.cl.includes(G.user);
    const btn=w.from===G.user?'<span class="pill">우리가 공시</span>':!w.ok?'<span class="pill">양수 신청 불가(기간 밖)</span>':G.unemp?'':`<button class="btn small ${on?'':'primary'}" data-a="wvClaim" data-v="${p.id}">${on?'신청 취소':'양수 신청'}</button>`;
    return `<div class="market-player-row"><span class="market-player-info"><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button>${potChipP(p)} <span class="small muted">${esc(posLabel(p))} · ${p.age}세 · 능력 ${dvo(p)} · 연 ${money(w.c.sal)}${w.c.yrs>1?` · ${w.c.yrs}년 남음`:''} · 전 ${esc(tshort(w.from))}${w.ok?` · ${dsh(w.end-1)}까지 신청`:''}</span></span><span class="market-player-actions">${btn}</span></div>`; };
  const log=(G.wvLog||[]).slice(0,8).map(r=>`<p class="small">${dsh(r.d)} <button class="lnk" data-a="player" data-v="${r.pid}">${esc(r.n)}</button> ${esc(tshort(r.from))} → ${r.to!=null?esc(tshort(r.to))+' (계약 승계)':'자유계약'}</p>`).join('');
  const rule=`리그 규약: 시즌 중·겨울에 방출한 등록 선수는 ${WV_DAYS}일 동안 웨이버 공시됩니다. 양수를 신청한 구단 중 지금 성적이 낮은 구단이 남은 계약을 그대로 이어받고, 방출한 구단은 낸 정산금을 돌려받습니다. 아무도 신청하지 않으면 자유계약 선수가 됩니다. 7월 25일 이후 공시는 양수 신청을 받지 않고, 11월 보류선수 정리는 웨이버 없이 바로 자유계약입니다.`;
  const PR=G.unemp?[]:wvPri(); /* 같은 날 정하는데 빈자리가 모자라면 이 순서대로 받는다(검수 11-09g) */
  const pri=PR.length>=2?`<div class="eyebrow" style="margin-top:8px">우리 신청 순위</div><p class="small muted">같은 날 정해지는 선수 중 정원이 모자라면 위 순위부터 받습니다. 기본은 신청한 순서입니다.</p>${PR.map((id,i)=>`<div class="market-player-row"><span class="small">${i+1}. ${esc(G.players[id].name)} <span class="muted">${dsh(G.players[id].wv.end)} 결정</span></span><span class="btns market-player-actions"><button class="btn small" data-a="wvPri" data-v="${id}:-1" ${i?'':'disabled'}>위로</button><button class="btn small" data-a="wvPri" data-v="${id}:1" ${i<PR.length-1?'':'disabled'}>아래로</button></span></div>`).join('')}`:'';
  if(!L.length&&!log)return `<p class="small muted"><b>웨이버 공시</b> 지금 공시 중인 선수가 없습니다.${hiI(rule)}</p>`; /* 비어 있으면 칸 대신 한 줄 */
  return csec('웨이버 공시',`<p class="small muted">방출 선수는 ${WV_DAYS}일 동안 공시되고, 신청 구단 중 지금 성적이 낮은 구단이 계약을 이어받습니다. ${hiI(rule)}</p>
    ${L.length?L.map(row).join(''):'<p class="small muted">지금 공시 중인 선수가 없습니다.</p>'}${pri}${log?`<div class="eyebrow" style="margin-top:8px">최근 결과</div>${log}`:''}`); }
function sdBox(){ const S=G.sd2&&G.sd2.y===G.year&&G.sd2.stage!=='done'?G.sd2:null; /* 진행 중인 회차만. 끝난 회차는 대기 화면에서 해마다 따로 본다(검수 11-09ze) */
  const rule=hiI(`2차 드래프트는 홀수 해 11월에 열립니다. 구단마다 보호선수 최대 ${SD_PROT}명을 내고, 다른 구단이 지난 시즌 성적 역순으로 명단 밖 선수를 ${SD_RD}라운드까지(하위 3개 구단은 5라운드) 지명합니다. 한 구단에서 최대 ${SD_LOSS}명. 양도금 1라운드 4억·2라운드 3억·3라운드 2억·4라운드 이하 1억. 1·2라운드 지명자는 두 시즌 안에 1군 ${SD_REG[0]}일·${SD_REG[1]}일을 채우지 못하면 원소속 구단으로 돌아갑니다. 외국인·입단 1~3년 차·육성선수·군 보류·이번 겨울 FA 계약 선수는 대상이 아닙니다.`);
  const ob=(S,s)=>{ if(s.rd>SD_REG.length)return ''; const need=SD_REG[s.rd-1]; if(s.ob)return ` · 의무 등록${s.obN!=null?` 1군 ${s.obN}/${need}일`:''} ${{ok:'충족',back:'미달 · 원소속 복귀',free:'미달 · 자유계약',wait:'미달 · 원소속 복귀 결정 대기',rel:'방출로 의무 종료',home:'원소속 구단 복귀로 의무 종료',moved:'결정 전 재이적으로 복귀 결정 종료'}[s.ob]||''}`; const q=G.players[s.pid], o=q&&q.sd2; if(!o||o.y!==S.y)return ''; const n=Math.min(o.need,o.reg+(G.year>o.y&&o.ly!==G.year&&q.team!=null?sdRegN(q,o):0)); return ` · 의무 등록 1군 ${n}/${o.need}일(${o.y+2}시즌까지)`; }; /* 지명 선수별 의무 진행(검수 11-09f) */
  const resOf=S=>{ const done=S.seq.filter(s=>s.pid); return done.length?done.map(s=>`<p class="small">${s.rd}라운드 ${esc(tshort(s.tid))}: <button class="lnk" data-a="player" data-v="${s.pid}">${esc(s.nm)}</button> (전 ${esc(tshort(s.from))}, 양도금 ${money(s.fee)}${ob(S,s)})</p>`).join(''):'<p class="small muted">지명된 선수가 없습니다.</p>'; };
  if(!S){ let y=G.year+(G.sd2&&G.sd2.y===G.year?1:0); while(!sdYear(y))y++; /* 대기 중: 지금 운영팀 추천 기준으로 보호 명단 밖이 될 선수를 미리 보여 준다(지난 결과가 있어도, 검수 11-09ze) */
    const pool=sdPool(G.user), prot=new Set(sdProtAI(G.user)), out=pool.filter(p=>!prot.has(p.id)).sort((a,b)=>ovr(b)-ovr(a));
    const row=p=>`<div class="market-player-row"><span class="market-player-info"><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button> <span class="small muted">${esc(posLabel(p))} · ${p.age}세 · 능력 ${dvo(p)} · 연 ${money(p.sal)}</span></span></div>`;
    const R=sdRounds(), ys=Object.keys(R).map(Number).sort((a,b)=>b-a), sel=ys.includes(UI.sd2Y)?UI.sd2Y:ys[0]; /* 지난 회차 결과: 해마다 따로 */
    const past=ys.length?`<div class="eyebrow" style="margin-top:8px">지난 2차 드래프트 결과</div>${ys.length>1?`<div class="chips">${ys.map(y=>`<button data-a="sd2Y" data-v="${y}" class="${y===sel?'on':''}">${y}년</button>`).join('')}</div>`:''}<p class="small muted">${sel}년 지명</p>${resOf(R[sel])}`:'';
    return csec('2차 드래프트'+rule,`<p class="small">다음 2차 드래프트: ${y}년 11월 · 지금 보호 대상 ${pool.length}명 중 ${prot.size}명 보호</p><div class="eyebrow" style="margin-top:8px">지금이라면 명단 밖이 될 선수 ${out.length}명</div>${out.map(row).join('')||'<p class="small muted">없습니다.</p>'}${past}`); }
  if(S.stage==='protect'){ if(G.unemp)return csec('2차 드래프트'+rule,`<p class="small">보호선수 명단 제출 중(${dsh(S.exp-1)}까지)</p>`);
    const pool=sdPool(G.user).sort((a,b)=>ovr(b)-ovr(a)); { const key=S.y+':'+G.user, K=UI.sdProtM=UI.sdProtM||{}; if(UI.sdProt&&UI.sdProtY)K[UI.sdProtY]=UI.sdProt; if(!UI.sdProt||UI.sdProtY!==key){ UI.sdProt=K[key]||[...(S.prot[G.user]||sdProtAI(G.user))]; UI.sdProtY=key; } } /* 구단별: 이직하면 새 구단 명단으로(검수 11-08d), 돌아오면 그 구단에서 고치던 명단 그대로(검수 11-09ze) */
    const P=new Set(UI.sdProt.filter(id=>pool.some(p=>p.id===id))); const PG=pager('sdp',pool,15);
    const row=p=>`<div class="market-player-row"><span class="market-player-info"><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button> <span class="small muted">${esc(posLabel(p))} · ${p.age}세 · 능력 ${dvo(p)} · 연 ${money(p.sal)}</span></span><span class="market-player-actions"><button class="btn small ${P.has(p.id)?'primary':''}" data-a="sdTog" data-v="${p.id}">${P.has(p.id)?'보호':'명단 밖'}</button></span></div>`;
    return csec('2차 드래프트 · 보호선수 명단'+rule,`<p class="small"><b>보호 ${P.size} / ${SD_PROT}명</b> · 대상 ${pool.length}명 · ${dsh(S.exp-1)}까지 제출${sdSubd(G.user)?(()=>{ const L=(S.prot[G.user]||[]).filter(id=>pool.some(p=>p.id===id)); return L.length===P.size&&L.every(id=>P.has(id))?' · <span class="pill good">제출함</span>':' · <span class="pill warn">수정함 · 다시 제출해야 반영</span>'; })():''}</p>
      <div class="btns"><button class="btn primary" data-a="sdSubmit">명단 제출</button><button class="btn" data-a="sdAuto">운영팀 추천으로 채우기</button></div><p class="small muted">최소 1명(대상이 없으면 0명), 최대 ${SD_PROT}명까지 제출할 수 있습니다. 적게 제출한 빈자리는 자동으로 채우지 않아 나머지는 명단 밖에 남습니다. 미제출은 운영팀이 대신 정합니다.<br>운영팀 추천은 현재 능력만이 아니라 성장 여지·나이·계약까지 따진 순서라, 능력이 더 낮은 유망주를 먼저 보호할 수 있습니다.</p>${PG.items.map(row).join('')}${PG.bar}`); }
  const res=resOf(S);
  const s=S.seq[S.cur]; let turn='';
  if(S.stage==='pick'&&s&&s.tid===G.user&&S.wait===S.cur){ const E=new Map(sdCands(G.user).map(p=>[p,scoutReport(p).cur])), C=[...E.keys()].sort((a,b)=>(E.get(b)??-1)-(E.get(a)??-1)); const PG=pager('sdc',C,15); /* 우리 스카우트 평가로 보이고 정렬한다: 못 본 선수의 실제 능력을 드러내지 않는다(검수 11-09f) */
    const W0=sdWhy(G.user,s.rd); /* 정원·현금: 모든 후보에 같은 이유 */ const W=p=>W0||sdWhy(G.user,s.rd,p.id);
    turn=`<div class="note"><b>${s.rd}라운드 우리 차례</b> · 양도금 ${money(sdFee(s.rd))} · ${dsh(S.exp)}까지 정하지 않으면 건너뜁니다.${W0?`<br><b class="bad">지금은 지명할 수 없습니다.</b> ${esc(W0.t)} 건너뛰거나 조건을 맞춘 뒤 고르세요.`:''}</div><div class="btns"><button class="btn" data-a="sdPick" data-v="skip">이번 라운드 건너뛰기</button></div>
      ${PG.items.map(p=>{ const w=W(p); return `<div class="market-player-row"><span class="market-player-info"><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button> <span class="small muted">${esc(tshort(p.team))} · ${esc(posLabel(p))} · ${p.age}세 · 능력 ${E.get(p)==null?'미확인':dv(E.get(p))} · 연 ${money(p.sal)}</span>${w&&!W0?`<span class="small bad" style="display:block">${esc(w.t)}</span>`:''}</span><span class="market-player-actions"><button class="btn small ${w&&!w.soft?'':'primary'}" data-a="sdPick" data-v="${p.id}" ${w&&!w.soft?`disabled aria-label="지명 불가: ${esc(w.t)}"`:''}>${w&&!w.soft?esc(w.k):w?'지명(상한 초과)':'지명'}</button></span></div>`; }).join('')}${PG.bar}`; }
  return csec(`${S.y} 2차 드래프트 · 지명 중${rule}`,`${turn}<div class="eyebrow" style="margin-top:8px">지명 결과</div>${res}`); }
Object.assign(A,{
  wvClaim(v){ toast(wvClaim(+v)); save(); render(); },
  wvPri(v){ const [id,d]=String(v).split(':').map(Number); wvPriMove(id,d); save(); render(); },
  sdTog(v){ const id=+v; if(UI.sdProt){ const pool=new Set(sdPool(G.user).map(q=>q.id)); UI.sdProt=UI.sdProt.filter(x=>pool.has(x)); } /* 입대 등으로 대상에서 빠진 선수도 뺀다: 화면 인원과 같은 기준(검수 11-08) */ /* 그사이 떠난 선수는 명단에서 뺀다(검수 11-07: 34/35인데 추가가 막힘) */ const L=UI.sdProt||[]; const i=L.indexOf(id); if(i>=0)L.splice(i,1); else if(L.length<SD_PROT)L.push(id); else { toast(`보호선수는 ${SD_PROT}명까지입니다. 먼저 한 명을 빼세요.`); return; } UI.sdProt=L; render(); },
  sdAuto(){ UI.sdProt=sdProtAI(G.user); render(); },
  sd2Y(v){ UI.sd2Y=+v; render(); },
  sdSubmit(){ toast(sdSubmit(UI.sdProt||[])); save(); render(); },
  sdPick(v){ toast(sdPick(v==='skip'?null:+v)); save(); render(); },
});

/* 무적 선수 전용 목록의 화면 조작(A 로드 뒤 등록). */
Object.assign(A,{freePage(v){UI.freeMarket={...freeWorkspaceState(),page:Math.max(0,+v||0)};render();},freeSort(k){const f=freeWorkspaceState();UI.freeMarket={...f,sort:k,dir:f.sort===k?-f.dir:(k==='age'||k==='salary'||k==='name'?1:-1),page:0};render();},freeReset(){UI.freeMarket={};render();}});
document.addEventListener('submit',e=>{if(!e.target.matches('[data-free-search-form]'))return;e.preventDefault();UI.freeMarket={...freeWorkspaceState(),q:e.target.elements.q.value.trim(),page:0};render();});
document.addEventListener('change',e=>{const el=e.target.closest('[data-free-option]');if(!el)return;const f=freeWorkspaceState(),key=el.dataset.freeOption;UI.freeMarket={...f,[key]:key==='size'?+el.value:el.value,page:0};if(key==='sort')UI.freeMarket.dir=['age','salary','name'].includes(el.value)?1:-1;if(key==='type')UI.freeMarket.pos='all';render();});
