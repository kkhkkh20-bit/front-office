/* ---------- 구단 > 연대기 > 내가 꾸린 팀 ---------- */
const TB_CAT=['창단 지명','신인 지명','트레이드','외부 FA','외국인','보상선수','무적 선수','해외 복귀','물려받음'];
const TB_COL={'창단 지명':'#e2434b','신인 지명':'#f0a020','트레이드':'#4fa3ff','외부 FA':'#3fd07f','외국인':'#b07cff','보상선수':'#2ec4c4','무적 선수':'#9aa6b2','해외 복귀':'#c9a24a','물려받음':'#5a6672'};
function teamBuildView(){ if(G.unemp)return csec('내가 꾸린 팀','<p class="small muted">지금은 맡은 구단이 없습니다.</p>');
  const y0=meSince(); const S=((G.myC&&G.myC.seas)||[]).filter(x=>x.tid===G.user&&x.y>=y0);
  /* 1) 순위 변화 */
  let live=null; try{ if(period()==='season'||period()==='post'){ const st=standingsNow(); const r=G.sea.rec[G.user]; live={y:G.year,rank:st.findIndex(x=>x.tid===G.user)+1,w:r.w,l:r.l,live:true}; } }catch(e){}
  const R=S.concat(live?[live]:[]); const n=G.teams.length;
  const chart=R.length?(()=>{ const w=Math.max(300,R.length*84), h=150, px=i=>44+i*((w-100)/Math.max(1,R.length-1||1)), py=r=>16+(r-1)*((h-40)/(n-1));
    const pts=R.map((x,i)=>`${R.length===1?w/2:px(i)},${py(x.rank)}`).join(' ');
    return `<div class="tbc-w"><svg class="tbc" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="시즌별 순위">
      <line x1="20" y1="${py(5)+((h-40)/(n-1))/2}" x2="${w-10}" y2="${py(5)+((h-40)/(n-1))/2}" stroke="#ffffff30" stroke-dasharray="4 3"/><text x="${w-12}" y="${py(5)+((h-40)/(n-1))/2-4}" text-anchor="end" class="tbc-l">가을야구</text>
      <polyline points="${pts}" fill="none" stroke="var(--team-hi,#4fa3ff)" stroke-width="2.5"/>
      ${R.map((x,i)=>{ const cx=R.length===1?w/2:px(i), cy=py(x.rank); return `<circle cx="${cx}" cy="${cy}" r="${x.ch===1?7:5}" fill="${x.ch===1?'#f0c040':x.live?'#0c1117':'var(--team-hi,#4fa3ff)'}" stroke="var(--team-hi,#4fa3ff)" stroke-width="2"/><text x="${cx}" y="${cy-10}" text-anchor="middle" class="tbc-r">${x.rank}위${x.ch===1?' 우승':''}</text><text x="${cx}" y="${h-6}" text-anchor="middle" class="tbc-l">${x.y}${x.live?' 진행 중':''}</text>`; }).join('')}</svg></div>`; })():'<p class="small muted">첫 시즌을 마치면 순위 변화가 그려집니다.</p>';
  /* 2) 지금 선수단은 어디서 왔나 + 올 시즌 WAR 비중 */
  const ps=playersOf(G.user).filter(p=>!p.prospect); const by={}; const wy=period()==='season'||period()==='post'?G.year:G.year-1;
  for(const p of ps){ const c=originCat(p); const h=seasonTotal(p,wy,'1군'); const w=h&&h.t===G.user?Math.max(0,warOf(h,p)):0; (by[c]=by[c]||{n:0,w:0,L:[]}); by[c].n++; by[c].w+=w; by[c].L.push(p); }
  const tw=Object.values(by).reduce((a,x)=>a+x.w,0); const cats=TB_CAT.filter(c=>by[c]);
  const bar=tw>0?`<div class="tbbar">${cats.filter(c=>by[c].w>0).map(c=>`<i style="width:${by[c].w/tw*100}%;background:${TB_COL[c]}" title="${c} WAR ${by[c].w.toFixed(1)}"></i>`).join('')}</div>`:'';
  const legend=`<div class="tbleg">${cats.map(c=>`<span><i style="background:${TB_COL[c]}"></i>${c} <b>${by[c].n}명</b>${tw>0?` · WAR ${Math.round(by[c].w/tw*100)}%`:''}</span>`).join('')}</div>`;
  const mineN=ps.filter(mineOf).length;
  /* 3) 핵심 선수: 내가 꾸린 선수, 우리 팀에서 쌓은 WAR 순 */
  const core=ps.filter(mineOf).map(p=>({p,o:tbOrigin(p),W:warWithUs(p)})).sort((a,b)=>b.W.sum-a.W.sum).slice(0,12);
  const rows=core.map(x=>`<tr><td><button class="lnk" data-a="player" data-v="${x.p.id}">${esc(x.p.name)}</button> <span class="muted small">${posLabel(x.p)} · ${x.p.age}세</span></td><td><span class="tbdot" style="background:${TB_COL[ACQ_K[x.o.k]]||'#888'}"></span>${esc(originLabel(x.o))}</td><td class="num">${x.o.o0!=null?`${dv(x.o.o0)} → ${dv(Math.round(ovr(x.p)))}`:dv(Math.round(ovr(x.p)))}</td><td class="num">${x.W.sum.toFixed(1)}</td><td class="num small muted">${x.W.best&&x.W.best.w>=.5?`${x.W.best.y} ${x.W.best.w.toFixed(1)}`:'-'}</td></tr>`).join('');
  /* 4) 기록 연표 */
  const log=(G.tbLog||[]).slice(0,20).map(e=>`<div class="tbl"><span class="muted small">${e.y} ${dsh(e.d)}</span> ${e.pid!=null&&G.players[e.pid]?`<button class="lnk" data-a="player" data-v="${e.pid}">${esc(e.t)}</button>`:esc(e.t)}</div>`).join('');
  return csec('순위 변화',`<p class="small muted">${y0}년부터 단장 · ${S.length}시즌 마침</p>${chart}`)
    +csec('지금 선수단은 어디서 왔나',`<p class="small">${ps.length}명 중 <b>${mineN}명</b>이 단장님이 데려온 선수입니다${tw>0?` (${wy} 시즌 WAR 기준 비중)`:''}.</p>${bar}${legend}`)
    +csec('내가 꾸린 핵심 선수',core.length?`<div class="tw"><table class="mst tbt"><thead><tr><th>선수</th><th>데려온 길</th><th>그때 → 지금</th><th>우리 팀 WAR</th><th>최고 시즌</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="small muted">아직 데려온 선수가 없습니다. 드래프트·트레이드·FA로 선수를 데려오면 여기에 쌓입니다.</p>')
    +csec('자란 순간',log||'<p class="small muted">내가 꾸린 선수가 10승·20홈런·20세이브를 하거나 처음 주전이 되면 여기에 남습니다.</p>'); }
