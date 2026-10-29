/* ---------- 구단 > 연대기 > 도전과제 ---------- */
function achTitleTag(){ const t=achTitle(); return t?`<span class="achtt">${esc(t)}</span>`:''; }
function achView(){ const T=achT(); const M=achMeta(); const N=ACH.length; const here=ACH.filter(a=>achHas(a.id)).length, all=ACH.filter(a=>achHasMeta(a.id)).length;
  const P=achPerks(); const ts=achTitles(); const cur=achTitle();
  const perk=[P.rep?`시작 명성 +${P.rep}`:'',P.trust?`첫 시즌 구단주 신뢰 +${P.trust}`:'',P.cash?`창단 자금 +${money(P.cash)}`:''].filter(Boolean).join(' · ')||'아직 없습니다';
  const head=csec('도전과제',`<div class="tiles"><div class="tile"><span class="g">${here}/${N}</span><span class="l">이 게임</span></div><div class="tile"><span class="g">${all}/${N}</span><span class="l">모든 게임</span></div><div class="tile"><span class="g">${Math.round(all/N*100)}%</span><span class="l">달성률</span></div></div>
    <p class="small"><b>새 게임 혜택</b>: ${perk}</p>
    <p class="small muted">보상은 새 게임을 시작할 때만 붙습니다. 상한: 시작 명성 +${ACH_CAP.rep}, 구단주 신뢰 +${ACH_CAP.trust}, 창단 자금 +${money(ACH_CAP.cash)}. 지금 게임의 혜택: ${G.achPerk&&(G.achPerk.rep||G.achPerk.trust||G.achPerk.cash)?`명성 +${G.achPerk.rep}, 신뢰 +${G.achPerk.trust}, 자금 +${money(G.achPerk.cash)}`:'없음'}.</p>
    <div class="achts"><span class="small muted">칭호</span>${ts.length?`<div class="chips"><button class="${cur?'':'on'}" data-a="achTitle" data-v="">표시 안 함</button>${ts.map(t=>`<button class="${cur===t?'on':''}" data-a="achTitle" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>`:'<span class="small">칭호가 있는 과제를 깨면 고를 수 있습니다. 고른 칭호는 단장 명성 옆에 붙습니다.</span>'}</div>`);
  const won=new Set(achTeamsWon(T)), wonM=new Set(achMetaTeamsWon());
  const allT=csec('전 구단 우승',`<p class="small">한 게임 안에서 10개 구단 모두 우승시키면 칭호 '전 구단 우승 단장'과 가장 큰 새 게임 혜택을 받습니다. 경질되거나 제의를 받아 구단을 옮기며 채워 갑니다.</p>
    <div class="achteams">${G.teams.map(t=>`<div class="achtm${won.has(t.id)?' on':''}">${badge(t.id,26)}<span>${esc(t.city)}</span><i>${won.has(t.id)?`${T.titles[t.id].length}회`:wonM.has(t.id)?'다른 게임':'-'}</i></div>`).join('')}</div>
    <p class="small muted">이 게임 ${won.size}/10 · 여러 게임 합산 ${wonM.size}/10</p>`);
  const cats=[...new Set(ACH.map(a=>a.c))];
  const item=a=>{ const h=G.ach&&G.ach[a.id], m=M.u[a.id]; let pr=''; if(a.p&&!h){ let v=null; try{ v=a.p(T); }catch(e){} if(v){ const w=Math.min(100,Math.round(v[0]/v[1]*100)); pr=`<div class="achbar"><i style="width:${w}%"></i></div><span class="small muted">${Math.min(v[0],v[1])}/${v[1]}</span>`; } }
    const st=h?`<span class="pill acc">${h.y}년 달성</span>`:m?`<span class="pill">다른 게임에서 달성</span>`:'';
    return `<div class="achit${h?' on':m?' half':''}"><div class="row between"><b>${esc(a.n)}</b>${st}</div><p class="small">${esc(a.d)}</p>${pr}<p class="small muted">보상: ${esc(achRewardTxt(a.r))}</p></div>`; };
  return head+allT+cats.map(c=>csec(c,`<div class="achlist">${ACH.filter(a=>a.c===c).map(item).join('')}</div>`)).join(''); }
Object.assign(A,{ achTitle(v){ achSetTitle(v||null); render(); } });
/* 구단 > 연대기 안쪽 탭에 붙인다 */
try{ if(!MERGE.club.chron.includes('ach'))MERGE.club.chron.push('ach'); ALIAS.club.ach='chron'; MLBL['club:ach']='도전과제'; }catch(e){}
/* 처음 화면: 모든 게임 합산 달성 수와 칭호 */
function achStartLine(){ try{ const n=ACH.filter(a=>achHasMeta(a.id)).length; if(!n)return ''; const t=achTitle(); return `<p class="small muted achstart">도전과제 ${n}/${ACH.length}${t?` · 칭호 ${esc(t)}`:''}</p>`; }catch(e){ return ''; } }
