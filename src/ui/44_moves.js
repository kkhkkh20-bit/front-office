/* ---------- 이적시장 현황: 항상 볼 수 있는 요약과 전체 기록 ---------- */
const MV_TYPES=['FA','트레이드','외국인','방출','무적 영입','보상선수','해외 진출','해외 복귀'];
function mvTeam(t){ return t==null?'-':`${badge(t,14)} ${esc(tshort(t))}`; }
function mvLine(m,brief){ const me=m.to===G.user||m.from===G.user;
  const dir=m.t==='방출'||m.t==='해외 진출'?`${mvTeam(m.from)} →`:m.from!=null&&m.to!=null&&m.from!==m.to?`${mvTeam(m.from)} → ${mvTeam(m.to)}`:`→ ${mvTeam(m.to)}`;
  return `<div class="mvl${me?' me':''}"${G.players[m.pid]?` data-a="player" data-v="${m.pid}" role="button"`:''}><span class="ticker">${dsh(m.d)}</span><span class="pill mv-${MV_TYPES.indexOf(m.t)}">${esc(m.t)}</span><b>${esc(m.n)}</b><span class="small muted">${esc(m.pos)}·${m.age}세</span><span class="mvd">${dir}</span>${brief?'':`<span class="small">${esc(m.note)}</span>`}</div>`; }
function mvStatus(){ const per=period(); const L=[];
  if(G.fa&&!G.fa.closed&&(G.fa.pool||[]).length){ const pool=G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null).sort((a,b)=>ovr(b)-ovr(a)); L.push(`FA 시장 진행 중: 남은 FA ${pool.length}명${pool.length?` (최대어 ${pool.slice(0,3).map(p=>`${p.name} ${p.faGrade||''}`).join(', ')})`:''}`); }
  else if(per!=='season'&&per!=='post'&&G.day<KD(11,1))L.push('FA 시장은 한국시리즈가 끝난 뒤 열립니다.');
  if(per==='season'||(per==='pre'&&G.day>=KD(3,1))){ const dl=KD(7,31); if(G.day<=dl)L.push(`트레이드 마감 ${dmd(dl)} (D-${dl-G.day})`); else L.push('트레이드 마감이 지났습니다. 포스트시즌 뒤 다시 열립니다.'); const fd=foreignDL(); if(G.day<=fd)L.push(`외국인 등록 마감 ${dmd(fd)} (D-${fd-G.day})`); }
  return L; }
function mvHomeCard(){ const W=mvWindow(); const L=(G.moves||[]).slice(0,5); const st=mvStatus();
  const n=k=>W.filter(m=>m.t===k).length;
  return `<section class="card mvcard"><div class="row between"><h2 class="sec">이적시장</h2><button class="btn small" data-a="go" data-v="transfer:moves">전체 보기</button></div>
    <div class="small muted">${esc(mvWinLabel())} · FA ${n('FA')} · 트레이드 ${new Set(W.filter(m=>m.t==='트레이드').map(m=>m.d+':'+Math.min(m.from,m.to))).size} · 외국인 ${n('외국인')} · 방출 ${n('방출')}</div>
    ${st.length?`<div class="small">${st.map(esc).join('<br>')}</div>`:''}
    ${L.length?L.map(m=>mvLine(m,true)).join(''):'<p class="small muted">아직 이적 소식이 없습니다.</p>'}</section>`; }
function movesView(){ const W=mvWindow(); const st=mvStatus(); UI.mvf=UI.mvf||{}; const f=UI.mvf;
  const cnt=MV_TYPES.map(k=>[k,W.filter(m=>m.t===k).length]).filter(x=>x[1]);
  const big=W.filter(m=>m.amt>0&&m.t!=='외국인').sort((a,b)=>b.amt-a.amt).slice(0,6);
  /* 구단별 영입·이탈 */
  const led=G.teams.map(t=>({t:t.id,in:W.filter(m=>m.to===t.id&&m.from!==t.id),out:W.filter(m=>m.from===t.id&&m.to!==t.id),stay:W.filter(m=>m.t==='FA'&&m.from===t.id&&m.to===t.id)}));
  const nm=a=>a.map(m=>`<button class="lnk" data-a="player" data-v="${m.pid}">${esc(m.n)}</button>`).join(', ');
  const all=(G.moves||[]).filter(m=>(!f.t||m.t===f.t)&&(f.tm==null||m.to===f.tm||m.from===f.tm)).slice(0,60);
  return csec(`이적 현황 · ${mvWinLabel()}`,`${st.length?`<div class="mv-st">${st.map(t=>`<p class="small">${esc(t)}</p>`).join('')}</div>`:''}
      <div class="chips">${cnt.map(([k,n])=>`<span class="pill">${k} ${n}</span>`).join('')||'<span class="small muted">이번 구간 이동 없음</span>'}</div>
      ${big.length?`<div class="eyebrow" style="margin-top:8px">큰 계약</div>${big.map(m=>mvLine(m)).join('')}`:''}`)
    +csec('구단별 영입·이탈',`<div class="tw"><table class="mvt"><thead><tr><th>구단</th><th>영입</th><th>이탈</th><th>FA 잔류</th></tr></thead><tbody>${led.map(r=>`<tr class="${r.t===G.user?'me':''}"><td>${mvTeam(r.t)}</td><td class="small">${nm(r.in)||'-'}</td><td class="small">${nm(r.out)||'-'}</td><td class="small">${nm(r.stay)||'-'}</td></tr>`).join('')}</tbody></table></div>`)
    +csec('전체 기록',`<div class="chips"><button data-a="mvF" data-v="t:" class="${!f.t?'on':''}">전체</button>${MV_TYPES.map(k=>`<button data-a="mvF" data-v="t:${k}" class="${f.t===k?'on':''}">${k}</button>`).join('')}</div>
      <div class="chips"><button data-a="mvF" data-v="tm:" class="${f.tm==null?'on':''}">모든 구단</button>${G.teams.map(t=>`<button data-a="mvF" data-v="tm:${t.id}" class="${f.tm===t.id?'on':''}">${esc(tshort(t.id))}</button>`).join('')}</div>
      ${all.length?all.map(m=>mvLine(m)).join(''):'<p class="small muted">기록이 없습니다.</p>'}`); }
