/* ---------- 리그 > 국가대표: 다가오는 대회 · 예비/최종 명단 · 상비군(지금 뽑는다면) · 차출 거부 · 지난 대회 ---------- */
function ntProj(k){ const key=G.day+':'+k+':'+G.year; if(UI._ntP&&UI._ntP.key===key&&UI._ntP.g===G)return UI._ntP.L; const L=ntSquad(k); UI._ntP={key,g:G,L}; return L; }
function ntRows(ids,o){ o=o||{}; const N=o.N; const BO={P:0,C:1,IF:2,OF:3}, BL={P:'투수',C:'포수',IF:'내야',OF:'외야'};
  const L=ids.map(id=>G.players[id]).filter(Boolean).sort((a,b)=>BO[ntBucket(a)]-BO[ntBucket(b)]||ovr(b)-ovr(a));
  const wild=new Set((N&&N.wild)||o.wild||[]);
  return `<div class="tw"><table class="sqt rt lst"><thead><tr><th>구분</th><th>선수</th><th>소속</th><th class="n">나이</th><th class="n">능력</th><th>비고</th>${o.act?'<th></th>':''}</tr></thead><tbody>${L.map(p=>`<tr class="click${p.team===G.user?' me':''}" data-a="player" data-v="${p.id}"><td>${BL[ntBucket(p)]}</td><td>${esc(p.name)} <span class="small muted">${posLabel(p)}</span></td><td>${esc(tshort(p.team))}</td><td class="n">${p.age}</td><td class="n">${dvo(p)}</td><td class="small">${[wild.has(p.id)?'와일드카드':'',milFree(p)?'미필':''].filter(Boolean).join(' · ')}</td>${o.act?`<td>${o.act(p)}</td>`:''}</tr>`).join('')}</tbody></table></div>`; }
function ntView(){ const M=ntMgr(); const N=ntState(); const up=ntUpcoming(4); const nx=up[0];
  const exL=k=>NT_EV[k].ex==='gold'?'금메달':NT_EV[k].ex==='top3'?'3위 이내':'없음';
  const live=N&&N.y===G.year&&!N.res?N:null; const e=live&&NT_EV[live.k]; const canRef=live&&G.day<KD(e.from[0],e.from[1]);
  const pre=!live&&G.ntPre&&G.ntPre.y===G.year&&nx&&G.ntPre.k===nx.k&&nx.y===G.year?G.ntPre:null;
  let h=csec('국가대표',`<dl class="tsum"><div><dt>감독</dt><dd>${esc(M.name)}</dd></div><div><dt>다음 대회</dt><dd>${nx?`${nx.y} ${nx.n}`:'없음'}</dd></div></dl>
    ${UI.ntMsg?`<div class="note">${esc(UI.ntMsg)}</div>`:''}
    <div class="tw"><table class="sqt rt lst"><thead><tr><th>대회</th><th>소집 기간</th><th>병역 특례</th></tr></thead><tbody>${up.map(x=>`<tr><td>${x.y} ${x.n}</td><td>${dmd(x.from)} ~ ${dmd(x.to)}</td><td>${exL(x.k)}</td></tr>`).join('')}</tbody></table></div>`);
  if(live){ const mine=live.ids.map(id=>G.players[id]).filter(p=>p&&p.team===G.user);
    h+=csec(`${ntTxt(live)} 최종 명단`,`<p class="small muted">우리 구단 ${mine.length}명${canRef?' · 소집 전까지 차출을 거부할 수 있습니다(여론 악화)':''}</p>${ntRows(live.ids,{N:live,act:canRef?p=>p.team===G.user?`<button class="btn small" data-a="ntRefuse" data-v="${p.id}">거부</button>`:'':null})}`); }
  else if(pre){ const mine=pre.ids.map(id=>G.players[id]).filter(p=>p&&p.team===G.user);
    h+=csec(`${G.year} ${NT_EV[pre.k].n} 예비 명단 · ${pre.ids.length}명`,`<p class="small muted">최종 발표 ${dmd(KD(NT_EV[pre.k].ann[0],NT_EV[pre.k].ann[1]))} · 우리 구단 ${mine.length}명</p>${ntRows(pre.ids)}`); }
  else if(nx){ const S=ntProj(nx.k); h+=csec(`상비군 · ${nx.y} ${nx.n} 지금 뽑는다면`,ntRows(S.map(x=>x.id),{wild:S.filter(x=>x.wild).map(x=>x.id)})); }
  const H=(G.ntHist||[]).slice().reverse();
  if(H.length)h+=csec('지난 대회',`<div class="tw"><table class="sqt rt lst"><thead><tr><th>대회</th><th>성적</th><th>대표팀 영웅</th></tr></thead><tbody>${H.map(x=>{ const p=x.hero&&G.players[x.hero]; return `<tr><td>${x.y} ${NT_EV[x.k]?NT_EV[x.k].n:x.k}</td><td>${esc(x.res)}</td><td>${p?`${esc(p.name)} <span class="small muted">${esc(tshort(p.team))}</span>`:'-'}</td></tr>`; }).join('')}</tbody></table></div>`);
  return h; }
Object.assign(A,{ ntRefuse(v){ UI.ntMsg=ntRefuse(+v); render(); } });
