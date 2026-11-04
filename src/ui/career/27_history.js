/* ---------- 역사·시상 ---------- */
function histView(){
  const ys=Object.keys(G.awards||{}).map(Number).sort((a,b)=>b-a); const y=UI.hy&&G.awards&&G.awards[UI.hy]?UI.hy:ys[0];
  const A=y?G.awards[y]:null;
  const who=x=>x?`<button class="lnk" ${G.players[x.id]||(G.arch&&G.arch[x.id])?`data-a="player" data-v="${x.id}"`:''}>${esc(x.name)}</button> <span class="small muted">${tshort(x.t)} · ${esc(x.line)}</span>`:'-';
  const ggName=k=>k.startsWith('OF')?'외야수':k==='P'?'투수':POSK[k];
  const aw=A?`<div class="chips">${ys.map(v=>`<button data-a="hy" data-v="${v}" class="${v===y?'on':''}">${v}</button>`).join('')}</div>
    <div class="awd"><div><span class="pill warn">MVP</span> ${awShown(A,'mvp')?who(A.mvp):`<span class="muted">${dmd(KD(11,24))} 시상식에서 발표</span>`}</div><div><span class="pill acc">신인왕</span> ${awShown(A,'mvp')?who(A.roy):'<span class="muted">발표 전</span>'}</div>${A.cand&&awShown(A,'mvp')?`<button class="btn small" data-a="cerOpen" data-v="${y}:mvp">시상식 다시 보기</button>`:''}</div>
    <div class="eyebrow">골든글러브</div>${awShown(A,'gg')?`<div class="list">${['P','C','1B','2B','3B','SS','OF0','OF1','OF2','DH'].filter(k=>A.gg[k]).map(k=>`<div class="item" style="cursor:default"><span class="nm">${ggName(k)}</span><span class="sub">${who(A.gg[k])}</span></div>`).join('')}</div>${A.cand?`<button class="btn small" data-a="cerOpen" data-v="${y}:gg">골든글러브 시상식 다시 보기</button>`:''}`:`<p class="small muted">${dmd(KD(12,9))} 골든글러브 시상식에서 발표합니다.</p>`}`
    :'<p class="small muted">첫 시즌이 끝나면 시상 결과가 쌓입니다.</p>';
  const actives=Object.values(G.players).filter(p=>p.team!=null&&p.hist.some(h=>h.lvl==='1군')).map(p=>{ const c=careerOf(p); return {name:p.name,id:p.id,t:p.team,isP:p.isP,war:c.war,h:c.h,hr:c.hr,w:c.w,sv:c.sv,act:true}; });
  const all=actives.concat((G.legends||[]).map(r=>({name:r.name,isP:r.isP,war:r.war,h:r.h,hr:r.hr,w:r.w,sv:r.sv,act:false,y:r.y})));
  const board=(label,f,fmt,flt)=>`<div class="ldr"><div class="eyebrow">${label}</div>${all.filter(flt||(()=>true)).sort((a,b)=>f(b)-f(a)).slice(0,8).map((x,i)=>`<div class="ldr-r"><i>${i+1}</i><span>${x.act&&G.players[x.id]?`<button class="lnk" data-a="player" data-v="${x.id}">${esc(x.name)}</button>`:esc(x.name)} <span class="small muted">${x.act?tshort(x.t):`${x.y} 은퇴`}</span></span><b class="num">${fmt(f(x))}</b></div>`).join('')}</div>`;
  const hof=(G.hof||[]);
  const champs=G.history.filter(h=>h.champ===G.user).map(h=>h.y);
  const hv=inTabs('histv',[['sum','지난 시즌'],['aw','시상'],['tro','우승 트로피'],['events','올스타·라이벌'],['ldr','통산 순위'],['hof','명예의 전당'],['abroad','해외파']],'sum');
  if(hv.cur==='abroad')return hv.bar+abroadView();
  if(hv.cur==='events')return hv.bar+leagueEventsView();
  if(hv.cur==='tro')return hv.bar+trophyRoom();
  if(hv.cur==='sum'&&fmOn()){ /* PC(FM식): 연도별 요약 표 | 역대 우승·우리 구단 연혁 | 최근 시상·통산 WAR */
    const me=G.user, HH=G.history.filter(h=>h.champ!=null), cnt=G.teams.map(t=>({t,c:HH.filter(h=>h.champ===t.id).map(h=>h.y),r:HH.filter(h=>h.runner===t.id).length})).filter(x=>x.c.length||x.r).sort((a,b)=>b.c.length-a.c.length||b.r-a.r), mx=Math.max(1,...cnt.map(x=>x.c.length));
    const champ=fxBox('fxh-ch',fxHead('역대 한국시리즈 우승',`${HH.length}시즌 · ${HH.length?HH[0].y+'~'+HH[HH.length-1].y:''}`),cnt.map((x,i)=>`<div class="fx-odd${x.t.id===me?' me':''}" title="${x.c.join(', ')}"><span>${i+1}</span>${badge(x.t.id,16)}<b>${esc(x.t.nick)}</b><p class="fx-bar"><i style="width:${x.c.length?Math.max(2,x.c.length/mx*100):0}%"></i></p><em>${x.c.length}회</em></div><p class="fx-none fx-yrs">${x.c.length?'우승 '+x.c.join(' · '):''}${x.r?`${x.c.length?' · ':''}준우승 ${x.r}회`:''}</p>`).join('')||'<p class="fx-none">아직 기록이 없습니다.</p>');
    const so=standOrder(), MY=G.history.filter(h=>G.startY==null||h.y>=G.startY).map(h=>{ const i=h.order.findIndex(o=>o.tid===me); return {y:h.y,rk:i+1,o:h.order[i],ps:h.champ===me?'우승':h.runner===me?'준우승':i>=0&&i<5?'가을야구':''}; }).filter(x=>x.rk>0);
    const cur=so.live?{y:G.year,rk:so.order.findIndex(o=>o.tid===me)+1,o:so.order.find(o=>o.tid===me),ps:'진행 중'}:null, ML=cur?[...MY,cur]:MY, n=G.teams.length;
    const mine=fxBox('fxh-me',fxHead(`${esc(tshort(me))} 연혁`,G.startY!=null?`${G.startY}년 창단`:''),(ML.length>=2?`<h4>정규시즌 순위 추이</h4>${fmArea(ML.map(x=>({v:n+1-x.rk,l:String(x.y)})),'var(--team-hi)',v=>Math.round(n+1-v)+'위')}`:'')+(ML.length?`<table class="fx-t fx-ntt"><thead><tr><th>연도</th><th>순위</th><th>승-패-무</th><th>가을야구</th></tr></thead><tbody>${[...ML].reverse().map(x=>`<tr><td>${x.y}</td><td>${x.rk}위</td><td>${x.o?`${x.o.w}-${x.o.l}-${x.o.t||0}`:'-'}</td><td>${x.ps||'-'}</td></tr>`).join('')}</tbody></table>`:'<p class="fx-none">첫 시즌을 마치면 순위가 쌓입니다.</p>'),fxBtn('go','club:chron','구단 연대기'));
    const sh=A&&awShown(A,'mvp'), face=(l,x)=>x?`<button class="fx-pl"${G.players[x.id]?` data-a="player" data-v="${x.id}"`:''}>${G.players[x.id]?avImg(G.players[x.id]):''}<span><i>${l}</i><b>${esc(x.name)}</b><em>${esc(tshort(x.t))} · ${esc(x.line)}</em></span></button>`:'';
    const awb=fxBox('fxh-aw',fxHead(y?`${y} 시상`:'시상',sh?'MVP·신인왕·골든글러브':y?'발표 전':'첫 시즌 뒤'),sh?`<div class="fx-pls">${face('MVP',A.mvp)}${face('신인왕',A.roy)}</div>${awShown(A,'gg')?`<h4>골든글러브</h4>${['P','C','1B','2B','3B','SS','OF0','OF1','OF2','DH'].filter(k=>A.gg[k]).map(k=>`<div class="fx-li${A.gg[k].t===me?' me':''}"><b>${ggName(k)}</b><span>${esc(A.gg[k].name)} · ${esc(tshort(A.gg[k].t))}</span></div>`).join('')}`:`<p class="fx-none">${dmd(KD(12,9))} 골든글러브 시상식에서 발표합니다.</p>`}`:`<p class="fx-none">${y?`${dmd(KD(11,24))} 시상식에서 발표합니다.`:'첫 시즌이 끝나면 시상 결과가 쌓입니다.'}</p>`,fxBtn('itab','histv:aw','시상'));
    const W=[...all].sort((a,b)=>b.war-a.war).slice(0,10);
    const ldr=fxBox('fxh-ld',fxHead('통산 WAR 순위','현역·은퇴 · 이 리그 1군'),W.map((x,i)=>{ const p=x.act&&G.players[x.id]; return `<${p?`button data-a="player" data-v="${x.id}"`:'div'} class="fx-rk${x.act&&x.t===me?' me':''}"><i>${i+1}</i><b>${esc(x.name)}</b><span>${x.act?esc(tshort(x.t)):`${x.y} 은퇴`}</span><em>${x.war.toFixed(1)}</em></${p?'button':'div'}>`; }).join('')||'<p class="fx-none">기록 없음</p>',fxBtn('itab','histv:ldr','통산 순위')+fxBtn('itab','histv:hof','명예의 전당'));
    return hv.bar+`<div class="fmx fmx-fit fmx-hi nolink ws-own">${fxBox('fxh-sm',fxHead('연도별 시즌 요약',`${G.history.length}시즌`),seasonSummary(true)?`<div class="fx-scr">${seasonSummary(true)}</div>`:'<p class="fx-none">기록 없음</p>')}${champ}${mine}${awb}${ldr}</div>`; }
  if(hv.cur==='sum')return hv.bar+seasonSummary();
  if(hv.cur==='aw')return hv.bar+ggVotingView(A)+csec('시즌 시상',aw);
  if(hv.cur==='ldr')return hv.bar+csec('통산 기록 순위',`<p class="small muted">현역과 은퇴 선수를 함께 비교합니다(1군 기록, 이 리그 기준).</p><div class="ldrs">${board('WAR',x=>x.war,v=>v.toFixed(1))}${board('안타',x=>x.h||0,v=>v,x=>!x.isP)}${board('홈런',x=>x.hr||0,v=>v,x=>!x.isP)}${board('승',x=>x.w||0,v=>v,x=>x.isP)}${board('세이브',x=>x.sv||0,v=>v,x=>x.isP)}</div>`);
  return hv.bar+csec(`명예의 전당 ${hof.length}명`,hof.length?`<div class="list">${hof.map(r=>`<div class="item" style="cursor:default"><span class="nm"><b>${esc(r.name)}</b> <span class="small muted">${r.pos} · ${r.y} 은퇴 · ${r.seasons}시즌</span></span><span class="sub">WAR ${r.war}${r.isP?` · ${r.w}승 ${r.sv}세이브 ${r.so}탈삼진`:` · ${r.h}안타 ${r.hr}홈런 ${r.rbi}타점`}${r.mvp?` · MVP ${r.mvp}회`:''}${r.gg?` · 골든글러브 ${r.gg}회`:''}</span></div>`).join('')}</div>`:'<p class="small muted">아직 헌액자가 없습니다. 통산 WAR 38 이상, MVP 2회, 골든글러브 6회 등을 남기고 은퇴한 선수가 오릅니다(게임 기준).</p>')
   +`<section class="card"><div class="row between"><span class="small">우리 구단 우승 ${champs.length}회 · 영구결번 ${(G.retNos||[]).length}명</span><button class="btn small" data-a="go" data-v="club:chron">우리 구단 연대기</button></div></section>`;
}

/* ===== 우승 트로피 진열장: 리그 역사(G.history)의 한국시리즈 우승·준우승·정규시즌 1위를 연도별 트로피로 =====
   옛 저장도 G.history만 있으면 그대로 그린다. 우리 구단과 상대 구단을 같은 모양으로 보여 준다 */
function trophyOf(tid){ const H=(G.history||[]).filter(h=>h.order); const ys=f=>H.filter(f).map(h=>h.y);
  return {c:ys(h=>h.champ===tid),r:ys(h=>h.runner===tid),f:ys(h=>h.order[0]&&h.order[0].tid===tid),y0:H.length?H[0].y:null,y1:H.length?H[H.length-1].y:null}; }
function trophyCase(tid,compact){ const T=trophyOf(tid), last=T.c.length?T.c[T.c.length-1]:null;
  let streak=0; if(last!=null&&last===T.y1)for(let y=last;T.c.includes(y);y--)streak++;
  const note=T.y0==null?'아직 끝난 시즌이 없습니다.':last==null?`${T.y0}년 기록 이후 아직 우승이 없습니다.`:last===T.y1?(streak>=2?`${streak}년 연속 우승 · 디펜딩 챔피언`:'디펜딩 챔피언'):`마지막 우승 ${last}년 · ${T.y1-last}시즌째 무관`;
  const shelf=[...T.c.map(y=>[y,'c']),...T.r.map(y=>[y,'r']),...T.f.map(y=>[y,'f'])].sort((a,b)=>b[0]-a[0]||'cfr'.indexOf(a[1])-'cfr'.indexOf(b[1]));
  const ic=k=>k==='c'?trophyImg(compact?30:38):ART.trophy(compact?26:32), lab={c:'우승',r:'준우승',f:'정규 1위'};
  return `<div class="trc${tid===G.user?' me':''}${compact?' sm':''}"><div class="trc-h">${badge(tid,compact?22:28)}<b>${esc(tname(tid))}</b><span class="num">우승 ${T.c.length} · 준우승 ${T.r.length} · 정규 1위 ${T.f.length}</span></div><p class="trc-n">${note}</p>${compact?'':trophyYears(tid)}<div class="trc-s">${shelf.length?shelf.map(([y,k])=>`<span class="trc-t ${k}" title="${y} ${k==='f'?'정규시즌 1위':'한국시리즈 '+lab[k]}">${ic(k)}<i>${y}</i><em>${lab[k]}</em></span>`).join(''):'<span class="trc-e">진열장이 비어 있습니다</span>'}</div></div>`; }
/* 연도별 정규시즌 순위와 가을야구 결과(최근 8시즌) */
function trophyYears(tid){ const H=(G.history||[]).filter(h=>h.order).slice(-8).reverse(); if(!H.length)return '';
  return `<div class="trc-y">${H.map(h=>{ const i=h.order.findIndex(o=>o.tid===tid), r=h.champ===tid?'우승':h.runner===tid?'준우승':i>=0&&i<5?'가을야구':''; return `<span class="${h.champ===tid?'c':r?'p':''}"><i>${h.y}</i><b>${i+1}위</b><em>${r||'-'}</em></span>`; }).join('')}</div>`; }
function trophyRoom(){ const L=G.teams.map(t=>({t,T:trophyOf(t.id)})).sort((a,b)=>(b.t.id===G.user)-(a.t.id===G.user)||b.T.c.length-a.T.c.length||b.T.r.length-a.T.r.length||b.T.f.length-a.T.f.length);
  return `<div class="trc-page ws-own"><p class="small muted">이 리그에서 치른 시즌만 집계합니다. 금색 트로피는 한국시리즈 우승, 은색은 준우승, 동색은 정규시즌 1위입니다.</p><div class="trc-room">${L.map(x=>trophyCase(x.t.id)).join('')}</div></div>`; }
