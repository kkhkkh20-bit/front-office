/* ---------- B: 중계 ---------- */
const OUTK={'1B':'안타','2B':'2루타','3B':'3루타',HR:'홈런',BB:'볼넷',K:'삼진',OUT:'범타',DP:'병살타',SAC:'희생번트'};
const PBPOS={C:[50,93],'1B':[71,63],'2B':[61,47],SS:[39,47],'3B':[29,63],LF:[17,27],CF:[50,13],RF:[83,27],P:[50,67]};
function pbpState(g,k){ // k번째 기록까지 반영한 상태
  const L=g.pbp; let sa=0,sh=0,outs=0,bases=[0,0,0],cur={h:null,a:null}; let half=0;
  for(let i=0;i<=k&&i<L.length;i++){ const x=L[i]; if(x[0]!==half){ half=x[0]; outs=0; bases=[0,0,0]; }
    if(x[1]==='PC'){ cur[x[0]%2?'a':'h']=x[2]; continue; }
    if(x[1]==='SB'||x[1]==='CS'){ outs=x[3]; bases=x[4]; continue; }
    outs=x[4]; bases=x[5]; sa=x[7]; sh=x[8]; cur[x[0]%2?'a':'h']=x[2]; }
  if(outs>=3)bases=[0,0,0];
  return {sa,sh,outs,bases,half,cur}; }
function pbpText(x){ const nm=id=>{ const p=G.players[id]; return p?p.name:'?'; };
  if(x[1]==='PC')return `투수 교체: ${nm(x[2])}`;
  if(x[1]==='SB')return `${nm(x[2])} 도루 성공`; if(x[1]==='CS')return `${nm(x[2])} 도루 실패`;
  return `${nm(x[1])} ${OUTK[x[3]]||x[3]}${x[6]?` · ${x[6]}점`:''}`; }
function pbpView(gi){
  const g=G.games[gi]; if(!g||!g.pbp||!g.pbp.length)return '<p class="small muted">이 경기는 중계 기록이 없습니다(최근 8경기만 보관).</p>';
  const L=g.pbp; let k=UI.pbp&&UI.pbp.g===gi?UI.pbp.k:0; k=clamp(k,0,L.length-1);
  const x=L[k]; const s=pbpState(g,k); const half=x[0]; const inn=Math.floor(half/2)+1, top=half%2===0;
  const defK=top?'h':'a', atK=top?'a':'h'; const def=g.box[defK];
  const pid=x[1]==='PC'?x[2]:(typeof x[1]==='number'?x[2]:s.cur[defK]);
  const fielders=def.bat.filter(b=>PBPOS[b.pos]).map(b=>({pos:b.pos,n:b.n}));
  const pn=G.players[pid]; if(pn)fielders.push({pos:'P',n:pn.name});
  const runner=i=>{ const id=s.bases[i]; const p=G.players[id]; return p?p.name:''; };
  const bpos=[[64,71],[50,57],[36,71]];
  const svg=`<svg class="pbpf" viewBox="0 0 100 100" role="img" aria-label="수비 위치와 주자">
    <path d="M50 96 L4 50 Q50 -4 96 50 Z" class="grass"/><path d="M50 88 L68 70 L50 52 L32 70 Z" class="dirt"/>
    ${bpos.map((b,i)=>`<rect x="${b[0]-3}" y="${b[1]-3}" width="6" height="6" transform="rotate(45 ${b[0]} ${b[1]})" class="base${s.bases[i]?' on':''}"/>`).join('')}<rect x="47.5" y="85.5" width="5" height="5" class="base home"/>
    ${fielders.map(f=>{ const c=PBPOS[f.pos]; return `<text x="${c[0]}" y="${c[1]}" class="fn">${esc(f.n)}</text><text x="${c[0]}" y="${c[1]+4}" class="fp">${POSS[f.pos]||'투'}</text>`; }).join('')}
    ${[0,1,2].map(i=>s.bases[i]?`<text x="${bpos[i][0]}" y="${bpos[i][1]-5}" class="rn">${esc(runner(i))}</text>`:'').join('')}
  </svg>`;
  const bat=typeof x[1]==='number'?G.players[x[1]]:null;
  const nxtInn=L.findIndex((y,i)=>i>k&&y[0]!==half);
  const recent=L.slice(Math.max(0,k-5),k+1).reverse();
  return `<div class="pbp">
    <div class="pbp-top"><span class="pill ${top?'':'acc'}">${inn}회${top?'초':'말'}</span><span class="num pbp-sc">${tshort(g.away)} ${s.sa} : ${s.sh} ${tshort(g.home)}</span><span class="outs">${[0,1,2].map(i=>`<i class="${i<s.outs?'on':''}"></i>`).join('')} ${s.outs}아웃</span></div>
    <div class="pbp-main">${svg}<div class="pbp-side">
      ${(()=>{ const cl=pbpCall(g,k); return `<div class="pbp-now ${x[6]?'run':''}"><span class="pc-who">캐스터</span><b>${esc(cl.c)}</b>${cl.a?`<div class="pc-an"><span class="pc-who">해설</span>${esc(cl.a)}</div>`:''}</div>`; })()}
      ${bat?`<div class="pbp-vs"><button data-a="player" data-v="${bat.id}">${avImg(bat)}<span><i>타자 · ${tshort(g[atK==='h'?'home':'away'])}</i><b>${esc(bat.name)}</b><em>${avgOpsAt(g,k,bat.id)}</em></span></button>${pn?`<button data-a="player" data-v="${pn.id}">${avImg(pn)}<span><i>투수 · ${tshort(g[defK==='h'?'home':'away'])}</i><b>${esc(pn.name)}</b><em>시즌 ERA ${eraAt(g,k,pn.id)}</em></span></button>`:''}</div>`:''}
      <div class="log">${recent.map((y,i)=>`<p class="${i===0?'cur':''}"><span class="ticker">${Math.floor(y[0]/2)+1}${y[0]%2?'말':'초'}</span> ${esc(pbpCall(g,k-i).c)}</p>`).join('')}</div>
    </div></div>
    ${(()=>{ const sc=top?s.sa:s.sh; const prev=L.slice(0,k+1).reverse().find(y=>y[0]<half&&typeof y[7]==='number'); const before=prev?(top?prev[7]:prev[8]):0; const hh=L.slice(0,k+1).filter(y=>y[0]===half&&['1B','2B','3B','HR'].includes(y[3])).length; return lineScore(g,half,{half,r:sc-before,h:hh}); })()}
    <div class="pbp-ctl"><button class="btn" data-a="pbpGo" data-v="${gi}:0">처음</button><button class="btn" data-a="pbpGo" data-v="${gi}:${k-1}" ${k<=0?'disabled':''}>◀ 이전</button><button class="btn primary" data-a="pbpGo" data-v="${gi}:${k+1}" ${k>=L.length-1?'disabled':''}>다음 타석 ▶</button><button class="btn" data-a="pbpGo" data-v="${gi}:${nxtInn<0?L.length-1:nxtInn}" ${k>=L.length-1?'disabled':''}>다음 이닝</button><button class="btn" data-a="pbpGo" data-v="${gi}:${L.length-1}">끝</button></div>
    <p class="small muted">${k+1} / ${L.length} · 수비 위치는 선발 라인업 기준입니다.</p>
  </div>`;
}
function gameSheet(i){
  const g=G.games[i]; if(!g)return '';
  const tab=UI.gtab||'box'; const has=!!(g.pbp&&g.pbp.length);
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="경기 기록">
    <div class="sheet-head"><div><div class="eyebrow">${dstr(g.day)}${g.kind?' · '+esc(g.kind):''}</div><h2 class="sec">${tname(g.away)} ${g.as} : ${g.hs} ${tname(g.home)}</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    ${has?`<div class="row"><div class="seg" style="flex:1"><button data-a="gtab" data-v="pbp" class="${tab==='pbp'?'on':''}">문자 중계</button><button data-a="gtab" data-v="box" class="${tab!=='pbp'?'on':''}">박스스코어</button></div><button class="btn primary" data-a="cast" data-v="${i}">그래픽 중계</button></div>`:''}
    ${has&&tab==='pbp'?pbpView(i):fullBox(g,true)}
  </div></div>`;
}

/* 순위 변동 그래프 */
function rankChart(compact){
  const R=(G.sea&&G.sea.rh)||[]; if(R.length<3)return '';
  const W=600,H=compact?90:220,pl=compact?6:26,pr=compact?6:52,pt=8,pb=compact?6:20; const n=R.length;
  const x=i=>pl+(W-pl-pr)*i/(n-1), y=r=>pt+(H-pt-pb)*(r-1)/9;
  const tids=compact?[G.user]:G.teams.map(t=>t.id).sort((a,b)=>(a===G.user)-(b===G.user));
  const lines=tids.map(tid=>{ const t=team(tid); const me=tid===G.user; const d=R.map((s,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(s[1][tid]).toFixed(1)}`).join(' ');
    return `<path d="${d}" fill="none" stroke="${me?'var(--team-hi)':tpal(t)[3]}" stroke-width="${me?3:1.2}" stroke-opacity="${me?1:.55}" stroke-linejoin="round"/>`+(compact?'':`<text x="${W-pr+4}" y="${y(R[n-1][1][tid])+3}" class="rc-l${me?' me':''}">${esc(tshort(tid))}</text>`); }).join('');
  const months=[]; let lm=null; R.forEach((s,i)=>{ const m=dobj(s[0]).m; if(m!==lm){ lm=m; months.push([i,m]); } });
  return `<div class="rcw"><svg class="rchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="날짜별 순위 변화">
    ${compact?'':[1,5,10].map(r=>`<text x="2" y="${y(r)+3}" class="rc-a">${r}위</text>`).join('')}
    <line x1="${pl}" x2="${W-pr}" y1="${(y(5)+y(6))/2}" y2="${(y(5)+y(6))/2}" class="rc-cut"/>
    ${compact?'':months.map(([i,m])=>`<line x1="${x(i)}" x2="${x(i)}" y1="${pt}" y2="${H-pb}" class="rc-g"/><text x="${x(i)+2}" y="${H-6}" class="rc-a">${m}월</text>`).join('')}
    ${lines}</svg></div>`;
}

/* 뉴스: 얼굴과 종류 */
const NKC={이적:'good',선수:'acc',경기:'',분석:'warn',트레이드:'good',FA:'good',팬:'',구단:'bad'};
function newsItem(n,full){ const nw=(n.id||0)>newsSeen(); const p=n.ref!=null?G.players[n.ref]:null;
  return `<div class="news ${n.v>=2?'pos':n.v<=-2?'neg':''}${full?'':' sm'}${p?' wf':''}"${p?` data-a="player" data-v="${p.id}" role="button" tabindex="0"`:''}>${p?avImg(p):''}<div><span class="small muted">${nw?'<i class="nwdot"></i>':''}${n.k?`<span class="pill tag ${NKC[n.k]||''}" data-a="nk" data-v="${esc(n.k)}">${esc(n.k)}</span> `:''}${esc(n.o)} · ${dsh(n.d)}</span><b>${lk(n.t)}</b>${n.b?`<p class="small">${lk(n.b)}</p>`:''}${full?(()=>{ const C=newsComments(n); const o=(UI.nco||{})[n.id]; return `<button class="ncm-b" data-a="nco" data-v="${n.id}">댓글 ${C.length}${o?' 접기':''}</button>${o?`<div class="fcms">${C.map(cmtRow).join('')}</div>`:C[0]?`<p class="ncm1"><b>${esc(C[0].nick)}</b> ${lk(C[0].t)}</p>`:''}`; })():''}</div></div>`; }

/* 연도별 시즌 요약 */
function seasonSummary(){
  const H=[...G.history].reverse(); if(!H.length)return '';
  const who=x=>x?`${esc(x.name)} <span class="muted">${tshort(x.t)}</span>`:'-';
  return csec('연도별 시즌 요약',`<div class="tw"><table class="ssum"><thead><tr><th>연도</th><th>우승</th><th>준우승</th><th>정규 1위</th><th>MVP</th><th>신인왕</th><th>우리 팀</th></tr></thead><tbody>${H.map(h=>{ const A=(G.awards||{})[h.y]; const ui=h.order.findIndex(o=>o.tid===G.user); const uo=h.order[ui];
    return `<tr class="${h.champ===G.user?'me':''}"><td>${h.y}</td><td>${badge(h.champ,16)} ${tshort(h.champ)}</td><td>${h.runner!=null?tshort(h.runner):'-'}</td><td>${tshort(h.order[0].tid)}</td><td>${A&&awShown(A,'mvp')?who(A.mvp):A?'발표 전':'-'}</td><td>${A&&awShown(A,'mvp')?who(A.roy):A?'발표 전':'-'}</td><td>${G.startY!=null&&h.y<G.startY?'<span class="muted">창단 전</span>':`${ui+1}위${uo?` · ${uo.w}-${uo.l}`:''}${h.champ===G.user?' · 우승':''}`}</td></tr>`; }).join('')}</tbody></table></div>`); }

