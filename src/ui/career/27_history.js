/* ---------- 역사·시상 ---------- */
function histView(){
  const ys=Object.keys(G.awards||{}).map(Number).sort((a,b)=>b-a); const y=UI.hy&&G.awards&&G.awards[UI.hy]?UI.hy:ys[0];
  const A=y?G.awards[y]:null;
  const who=x=>x?`<button class="lnk" ${G.players[x.id]||(G.arch&&G.arch[x.id])?`data-a="player" data-v="${x.id}"`:''}>${esc(x.name)}</button> <span class="small muted">${tshort(x.t)} · ${esc(x.line)}</span>`:'-';
  const ggName=k=>k.startsWith('OF')?'외야수':k==='P'?'투수':POSK[k];
  const aw=A?`<div class="chips">${ys.map(v=>`<button data-a="hy" data-v="${v}" class="${v===y?'on':''}">${v}</button>`).join('')}</div>
    <div class="awd"><div><span class="pill warn">MVP</span> ${awShown(A,'mvp')?who(A.mvp):`<span class="muted">${dmd(KD(11,24))} 시상식에서 발표</span>`}</div><div><span class="pill acc">신인왕</span> ${awShown(A,'mvp')?who(A.roy):'<span class="muted">발표 전</span>'}</div>${A.cand&&awShown(A,'mvp')?`<button class="btn small" data-a="cerOpen" data-v="${y}:mvp">시상식 다시 보기</button>`:''}</div>
    <div class="eyebrow">골든글러브</div>${awShown(A,'gg')?`${ggField(A,true)}${A.cand?`<button class="btn small" data-a="cerOpen" data-v="${y}:gg">골든글러브 시상식 다시 보기</button>`:''}`:`<p class="small muted">${dmd(KD(12,9))} 골든글러브 시상식에서 발표합니다.</p>`}`
    :'<p class="small muted">첫 시즌이 끝나면 시상 결과가 쌓입니다.</p>';
  const all=careerBoard(); /* 현역·FA·무적·해외·은퇴를 한 기준으로(검수 11-09zp) */ const open=x=>G.players[x.id]||(G.arch&&G.arch[x.id]);
  const board=(label,f,fmt,flt)=>`<div class="ldr"><div class="eyebrow">${label}</div>${all.filter(flt||(()=>true)).sort((a,b)=>f(b)-f(a)).slice(0,8).map((x,i)=>`<div class="ldr-r"><i>${i+1}</i><span>${open(x)?`<button class="lnk" data-a="player" data-v="${x.id}">${esc(x.name)}</button>`:esc(x.name)} <span class="small muted">${x.act?tshort(x.t):x.lab}</span></span><b class="num">${fmt(f(x))}</b></div>`).join('')}</div>`;
  const hof=hofList();
  const champs=G.history.filter(h=>h.champ===G.user).map(h=>h.y);
  const hv=inTabs('histv',[['sum','지난 시즌'],['aw','시상'],['tro','우승 트로피'],['ret','영구결번'],['events','올스타·라이벌'],['ldr','통산 순위'],['hof','명예의 전당'],['teams','구단 역대'],['champs','우승팀'],['psrec','포스트시즌 기록'],['mgrs','역대 감독'],['mile','기록 도전'],['grec','한 경기 기록'],['abroad','해외파'],['book','리그 연감']],'sum');
  if(hv.cur==='book')return hv.bar+yearbookView();
  if(hv.cur==='teams')return hv.bar+teamAllTimeView();
  if(hv.cur==='champs')return hv.bar+champTeamsView();
  if(hv.cur==='psrec')return hv.bar+psRecView();
  if(hv.cur==='mgrs')return hv.bar+mgrHistView();
  if(hv.cur==='mile')return hv.bar+mileWatchView();
  if(hv.cur==='grec')return hv.bar+gameRecView();
  if(hv.cur==='abroad')return hv.bar+abroadView();
  if(hv.cur==='events')return hv.bar+leagueEventsView();
  if(hv.cur==='tro')return hv.bar+trophyRoom();
  if(hv.cur==='ret')return hv.bar+retiredNumberRoom();
  if(hv.cur==='sum'&&fmOn()){ /* PC(FM식): 연도별 요약 표 | 역대 우승·우리 구단 연혁 | 최근 시상·통산 WAR */
    const me=G.user, HH=G.history.filter(h=>h.champ!=null), cnt=G.teams.map(t=>({t,c:HH.filter(h=>h.champ===t.id).map(h=>h.y),r:HH.filter(h=>h.runner===t.id).length})).filter(x=>x.c.length||x.r).sort((a,b)=>b.c.length-a.c.length||b.r-a.r), mx=Math.max(1,...cnt.map(x=>x.c.length));
    const champ=fxBox('fxh-ch',fxHead('역대 한국시리즈 우승',`${HH.length}시즌 · ${HH.length?HH[0].y+'~'+HH[HH.length-1].y:''}`),cnt.map((x,i)=>`<div class="fx-odd${x.t.id===me?' me':''}" title="${x.c.join(', ')}"><span>${i+1}</span>${badge(x.t.id,16)}<b>${esc(x.t.nick)}</b><p class="fx-bar"><i style="width:${x.c.length?Math.max(2,x.c.length/mx*100):0}%"></i></p><em>${x.c.length}회</em></div><p class="fx-none fx-yrs">${x.c.length?'우승 '+x.c.join(' · '):''}${x.r?`${x.c.length?' · ':''}준우승 ${x.r}회`:''}</p>`).join('')||'<p class="fx-none">아직 기록이 없습니다.</p>');
    const so=standOrder(), MY=G.history.filter(h=>G.startY==null||h.y>=G.startY).map(h=>{ const i=h.order.findIndex(o=>o.tid===me); return {y:h.y,rk:i+1,o:h.order[i],ps:h.champ===me?'우승':h.runner===me?'준우승':i>=0&&i<5?'가을야구':''}; }).filter(x=>x.rk>0);
    const cur=so.live?{y:G.year,rk:so.order.findIndex(o=>o.tid===me)+1,o:so.order.find(o=>o.tid===me),ps:'진행 중'}:null, ML=cur?[...MY,cur]:MY, n=G.teams.length;
    const mine=fxBox('fxh-me',fxHead(`${esc(tshort(me))} 연혁`,G.startY!=null?`${G.startY}년 창단`:''),(ML.length>=2?`<h4>정규시즌 순위 추이</h4>${fmArea(ML.map(x=>({v:n+1-x.rk,l:String(x.y)})),'var(--team-hi)',v=>Math.round(n+1-v)+'위',null,null,{lo:1,hi:n})}`:'')+(ML.length?`<table class="fx-t fx-ntt"><thead><tr><th>연도</th><th>순위</th><th>승-패-무</th><th>가을야구</th></tr></thead><tbody>${[...ML].reverse().map(x=>`<tr><td>${x.y}</td><td>${x.rk}위</td><td>${x.o?`${x.o.w}-${x.o.l}-${x.o.t||0}`:'-'}</td><td>${x.ps||'-'}</td></tr>`).join('')}</tbody></table>`:'<p class="fx-none">첫 시즌을 마치면 순위가 쌓입니다.</p>'),fxBtn('go','club:chron','구단 연대기'));
    const sh=A&&awShown(A,'mvp'), face=(l,x)=>x?`<button class="fx-pl"${G.players[x.id]?` data-a="player" data-v="${x.id}"`:''}>${G.players[x.id]?avImg(G.players[x.id]):''}<span><i>${l}</i><b>${esc(x.name)}</b><em>${esc(tshort(x.t))} · ${esc(x.line)}</em></span></button>`:'';
    const awb=fxBox('fxh-aw',fxHead(y?`${y} 시상`:'시상',sh?'MVP·신인왕·골든글러브':y?'발표 전':'첫 시즌 뒤'),sh?`<div class="fx-pls">${face('MVP',A.mvp)}${face('신인왕',A.roy)}</div>${awShown(A,'gg')?`<h4>골든글러브</h4>${['P','C','1B','2B','3B','SS','OF0','OF1','OF2','DH'].filter(k=>A.gg[k]).map(k=>`<div class="fx-li${A.gg[k].t===me?' me':''}"><b>${ggName(k)}</b><span>${esc(A.gg[k].name)} · ${esc(tshort(A.gg[k].t))}</span></div>`).join('')}`:`<p class="fx-none">${dmd(KD(12,9))} 골든글러브 시상식에서 발표합니다.</p>`}`:`<p class="fx-none">${y?`${dmd(KD(11,24))} 시상식에서 발표합니다.`:'첫 시즌이 끝나면 시상 결과가 쌓입니다.'}</p>`,fxBtn('itab','histv:aw','시상'));
    const W=[...all].sort((a,b)=>b.war-a.war).slice(0,10);
    const ldr=fxBox('fxh-ld',fxHead('통산 WAR 순위'),W.map((x,i)=>{ const p=open(x); return `<${p?`button data-a="player" data-v="${x.id}"`:'div'} class="fx-rk${x.act&&x.t===me?' me':''}"><i>${i+1}</i><b>${esc(x.name)}</b><span>${x.act?esc(tshort(x.t)):x.lab}</span><em>${x.war.toFixed(1)}</em></${p?'button':'div'}>`; }).join('')||'<p class="fx-none">기록 없음</p>',fxBtn('itab','histv:ldr','통산 순위')+fxBtn('itab','histv:hof','명예의 전당'));
    /* 지난 시즌 최종 순위: 시즌이 적을 때 왼쪽 칸이 비지 않게 */
    const LH=G.history[G.history.length-1], lastOrd=LH&&LH.order&&LH.order[0]&&LH.order[0].w!=null?`<h4>${LH.y} 정규시즌 최종 순위</h4><table class="fx-t"><thead><tr><th>순위</th><th>구단</th><th>승-패-무</th><th>가을</th></tr></thead><tbody>${LH.order.map((o,i)=>`<tr class="${o.tid===me?'me':''}"><td>${i+1}</td><td>${badge(o.tid,14)} ${esc(tshort(o.tid,LH.y))}</td><td>${o.w}-${o.l}-${o.t||0}</td><td>${o.tid===LH.champ?'우승':o.tid===LH.runner?'준우승':i<5?'진출':'-'}</td></tr>`).join('')}</tbody></table>`:'';
    return hv.bar+`<div class="fmx fmx-fit fmx-hi nolink ws-own">${fxBox('fxh-sm',fxHead('연도별 시즌 요약',`${G.history.length}시즌`),(seasonSummary(true)?`<div class="fx-scr">${seasonSummary(true)}</div>`:'<p class="fx-none">기록 없음</p>')+lastOrd)}${champ}${mine}${awb}${ldr}</div>`; }
  if(hv.cur==='sum')return hv.bar+seasonSummary();
  if(hv.cur==='aw')return hv.bar+ggVotingView(A)+csec('시즌 시상',aw);
  if(hv.cur==='ldr')return hv.bar+csec('통산 기록 순위',`<p class="small muted">현역과 은퇴 선수를 함께 비교합니다(1군 기록, 이 리그 기준).</p><div class="ldrs">${board('WAR',x=>x.war,v=>v.toFixed(1))}${board('안타',x=>x.h||0,v=>v,x=>!x.isP)}${board('홈런',x=>x.hr||0,v=>v,x=>!x.isP)}${board('승',x=>x.w||0,v=>v,x=>x.isP)}${board('세이브',x=>x.sv||0,v=>v,x=>x.isP)}</div>`);
  return hv.bar+hofWatchView()+csec(`명예의 전당 ${hof.length}명`,hof.length?`<div class="list">${hof.map(r=>`<div class="item" style="cursor:default"><span class="nm">${v3Img('hall_of_fame_plaque',32,'hof-v3','명예의 전당 명패')}<b>${esc(r.name)}</b> <span class="small muted">${r.pos} · ${r.y} 은퇴 · ${r.seasons}시즌</span></span><span class="sub">WAR ${r.war}${r.isP?` · ${r.w}승 ${r.sv}세이브 ${r.so}탈삼진`:` · ${r.h}안타 ${r.hr}홈런 ${r.rbi}타점`}${r.mvp?` · MVP ${r.mvp}회`:''}${r.gg?` · 골든글러브 ${r.gg}회`:''}</span></div>`).join('')}</div>`:'<p class="small muted">아직 헌액자가 없습니다. 통산 WAR 38 이상, MVP 2회, 골든글러브 6회 등을 남기고 은퇴한 선수가 오릅니다(게임 기준).</p>')+gmHofSec()
   +`<section class="card"><div class="row between"><span class="small">우리 구단 우승 ${champs.length}회 · 영구결번 ${(G.retNos||[]).length}명</span><button class="btn small" data-a="go" data-v="club:chron">우리 구단 연대기</button></div></section>`;
}

/* ===== 우승 트로피 진열장: 리그 역사(G.history)의 한국시리즈 우승·준우승·정규시즌 1위를 연도별 트로피로 =====
   옛 저장도 G.history만 있으면 그대로 그린다. 우리 구단과 상대 구단을 같은 모양으로 보여 준다 */
function trophyOf(tid){ const H=(G.history||[]).filter(h=>h.order); const ys=f=>H.filter(f).map(h=>h.y);
  return {c:ys(h=>h.champ===tid),r:ys(h=>h.runner===tid),f:ys(h=>h.order[0]&&h.order[0].tid===tid),y0:H.length?H[0].y:null,y1:H.length?H[H.length-1].y:null}; }
function retiredNumbers(tid){ const L=[...retNosOf(tid)].sort((a,b)=>a.no-b.no); return `<section class="retired-numbers" aria-label="${esc(tname(tid))} 영구결번"><h3>영구결번 <span class="small muted">${L.length}명</span></h3>${L.length?`<div class="row wrapr">${L.map(r=>`<div class="retired-number"><b>${r.no}</b><span>${esc(r.name)}</span><small>${r.y}년 지정</small></div>`).join('')}</div>`:'<p class="small muted">아직 지정된 영구결번이 없습니다.</p>'}</section>`; }
function trophyCase(tid,compact){ const T=trophyOf(tid), last=T.c.length?T.c[T.c.length-1]:null;
  let streak=0; if(last!=null&&last===T.y1)for(let y=last;T.c.includes(y);y--)streak++;
  const note=T.y0==null?'아직 끝난 시즌이 없습니다.':last==null?`${T.y0}년 기록 이후 아직 우승이 없습니다.`:last===T.y1?(streak>=2?`${streak}년 연속 우승 · 디펜딩 챔피언`:'디펜딩 챔피언'):`마지막 우승 ${last}년 · ${T.y1-last}시즌째 무관`;
  const shelf=[...T.c.map(y=>[y,'c']),...T.r.map(y=>[y,'r']),...T.f.map(y=>[y,'f'])].sort((a,b)=>b[0]-a[0]||'cfr'.indexOf(a[1])-'cfr'.indexOf(b[1]));
  const ic=k=>cupImg(k,compact?30:38), lab={c:'우승',r:'준우승',f:'정규 1위'};
  return `<div class="trc${tid===G.user?' me':''}${compact?' sm':''}"><div class="trc-h">${badge(tid,compact?22:28)}<b>${esc(tname(tid))}</b><span class="num">우승 ${T.c.length} · 준우승 ${T.r.length} · 정규 1위 ${T.f.length}</span></div><p class="trc-n">${note}</p>${compact?'':trophyYears(tid)}<div class="trc-s">${shelf.length?shelf.map(([y,k])=>`<span class="trc-t ${k}" title="${y} ${k==='f'?'정규시즌 1위':'한국시리즈 '+lab[k]}">${ic(k)}<i>${y}</i><em>${lab[k]}</em></span>`).join(''):'<span class="trc-e">진열장이 비어 있습니다</span>'}</div>${retiredNumbers(tid)}</div>`; }
/* 연도별 정규시즌 순위와 가을야구 결과(최근 8시즌) */
function trophyYears(tid){ const H=(G.history||[]).filter(h=>h.order).slice(-8).reverse(); if(!H.length)return '';
  return `<div class="trc-y">${H.map(h=>{ const i=h.order.findIndex(o=>o.tid===tid), r=clubSeasonResult(h,tid); return `<span class="${h.champ===tid?'c':r?'p':''}"><i>${h.y}</i><b>${i+1}위</b><em>${r||'-'}</em></span>`; }).join('')}</div>`; }
function trophyRoom(){ const L=G.teams.map(t=>({t,T:trophyOf(t.id)})).sort((a,b)=>(b.t.id===G.user)-(a.t.id===G.user)||b.T.c.length-a.T.c.length||b.T.r.length-a.T.r.length||b.T.f.length-a.T.f.length);
  return `<div class="trc-page ws-own"><p class="small muted">이 리그에서 치른 시즌만 집계합니다. 금색 트로피는 한국시리즈 우승, 은색 트로피는 준우승, 야구공 방패 트로피는 정규시즌 1위입니다.</p><div class="trc-room">${L.map(x=>trophyCase(x.t.id)).join('')}</div></div>`; }

/* 전체 구단 결번은 트로피 진열장과 별도로, 기록이 있는 구단부터 바로 보여 준다. */
function retiredNumberRoom(){ const L=G.teams.map(t=>({t,n:retNosOf(t.id).length})).sort((a,b)=>Number(b.n>0)-Number(a.n>0)||(b.t.id===G.user)-(a.t.id===G.user)||a.t.id-b.t.id), total=sum(L.map(x=>x.n));
  return `<div class="rn-page ws-own"><div class="rn-intro"><h2 class="sec">전체 구단 영구결번</h2><p class="small muted keep">${L.length}개 구단 · 총 ${total}명. 이직 전 구단의 기록도 함께 표시합니다.</p></div><div class="rn-teams">${L.map(({t,n})=>`<article class="rn-team${t.id===G.user?' me':''}" data-team="${t.id}"><div class="row wrapr">${badge(t.id,22)}<b>${esc(tname(t.id))}</b>${t.id===G.user?'<span class="pill">우리 구단</span>':''}<span class="small muted">${n}명</span></div>${n?retiredNumbers(t.id):'<p class="small muted">아직 지정된 영구결번이 없습니다.</p>'}</article>`).join('')}</div></div>`; }

/* ===== 리그 연감(장기 기획 11-11): 해마다 우승·1위·시상·규정 변화·구단 변화(이름·연고·구장)·라이벌 탄생을 한 장에 =====
   이름은 그해 이름(tshort(id,y))으로 보인다 */
function yearbookView(){ const H=[...(G.history||[])].filter(h=>h.y!=null).sort((a,b)=>b.y-a.y); if(!H.length)return csec('리그 연감','<p class="small muted">첫 시즌이 끝나면 연감이 쌓입니다.</p>');
  const ev=y=>{ const L=[]; for(const t of G.teams){ let C=[]; try{ C=clubChron(t.id); }catch(e){} for(const x of C)if(x.y===y&&['rebrand','honor','retNo'].includes(x.k))L.push(`${badge(t.id,14)} ${esc(x.t)}`); }
    for(const r of Object.values((G.rivalries&&G.rivalries.pairs)||{}))if(r.emerged!=null&&dobj(r.emerged).y===y)L.push(`라이벌 탄생: ${esc(r.label)}`);
    for(const x of (G.lgr&&G.lgr.hist)||[])if(x.y===y+1)L.push(`${y+1}시즌 규정: ${esc(x.why.join(' · '))}`); return L; };
  return csec('리그 연감',`<p class="small muted">시즌마다 우승 구단·정규시즌 1위·MVP·신인왕과 리그의 큰 변화(구단 이름·연고·구장, 라이벌, 협회 규정)를 모았습니다. 구단 이름은 그해 이름입니다.</p>`+H.map(h=>{ const y=h.y, A=G.awards&&G.awards[y], top=h.order&&h.order[0], L=ev(y), sh=A&&awShown(A,'mvp');
    return `<div class="yb-y"><h3>${y}</h3><div class="yb-g">${h.champ!=null?`<span><i>우승</i>${badge(h.champ,16)} ${esc(tshort(h.champ,y))}</span>`:''}${h.runner!=null?`<span><i>준우승</i>${esc(tshort(h.runner,y))}</span>`:''}${top?`<span><i>정규시즌 1위</i>${esc(tshort(top.tid,y))}${top.w!=null?` (${top.w}승 ${top.l}패)`:''}</span>`:''}${sh&&A.mvp?`<span><i>MVP</i>${esc(A.mvp.name)}</span>`:''}${sh&&A.roy?`<span><i>신인왕</i>${esc(A.roy.name)}</span>`:''}</div>${L.length?`<ul class="yb-ev">${L.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}</div>`; }).join('')); }

/* 단장 명예의 전당(91_person_ledger) */
function gmHofSec(){ const H=(G.gmHof||[]).slice().sort((a,b)=>b.y-a.y||b.c-a.c); const M=G.gmMerit&&G.gmMerit[legMeK()];
  return csec(`단장 명예의 전당 ${H.length}명`,(M?`<p class="small">현역 공로상: ${esc(legMeName())} 단장 (${M.y}년 · ${M.s}시즌 · 우승 ${M.c}회)</p>`:'')+(H.length?`<div class="list">${H.map(h=>`<div class="item" style="cursor:default"><span class="nm"><b>${esc(h.n)}</b>${h.u?' <span class="pill acc">우리 계보</span>':''}</span><span class="sub">${h.y}년 헌액 · ${h.y0}~${h.y1} · ${h.ts.map(t=>esc(tshort(t,h.y1))).join('·')} · ${h.s}시즌 ${h.w}승 ${h.l}패 · 우승 ${h.c}회</span></div>`).join('')}</div>`:'<p class="small muted">아직 헌액된 단장이 없습니다. 물러난 단장 가운데 우승 3회, 또는 15시즌·우승 1회, 또는 10시즌·승률 .560을 넘긴 사람이 해마다 12월에 오릅니다(게임 기준).</p>')); }

/* ===== 구단 역대 기록(OOTP Team History 참고): 리그 역사(G.history)의 연도별 순위로 구단마다 통산 성적·가을야구·우승을 모은다.
   가을야구는 그해 순위 5위 안(실제 와일드카드 결정전 포함 KBO 방식), 우승·준우승은 한국시리즈 결과. 옛 저장도 G.history만 있으면 그린다 */
function teamAllTimeView(){ const T=teamAllTime(); if(!T.n)return csec('구단 역대 기록','<p class="small muted">첫 시즌을 마치면 구단별 통산 기록이 쌓입니다.</p>');
  const pct=r=>(r.w/Math.max(1,r.w+r.l)).toFixed(3).replace(/^0/,'');
  const rows=T.rows.map((r,i)=>`<tr class="${r.tid===G.user?'me':''}"><td>${i+1}</td><td class="stk">${badge(r.tid,14)} ${esc(tshort(r.tid))}</td><td>${r.ys}</td><td>${r.w}-${r.l}-${r.t}</td><td>${pct(r)}</td><td>${r.ps}</td><td title="${r.ch.join(', ')}">${r.ch.length}${r.ch.length?` <span class="small muted">(${r.ch[r.ch.length-1]})</span>`:''}</td><td>${r.ru}</td><td>${r.best?`${r.best.y} ${r.best.w}-${r.best.l}-${r.best.t} (${r.best.rk}위)`:'-'}</td></tr>`).join('');
  return csec('구단 역대 기록',`<p class="small muted">이 리그 ${T.n}시즌(정규시즌) 기준. 가을야구는 정규시즌 5위 안, 우승·준우승은 한국시리즈 결과입니다. 괄호는 마지막 우승 연도.</p><div class="tw"><table class="sqt"><thead><tr><th>#</th><th class="stk">구단</th><th>시즌</th><th>통산 승-패-무</th><th>승률</th><th>가을야구</th><th>우승</th><th>준우승</th><th>최고 시즌</th></tr></thead><tbody>${rows}</tbody></table></div>`); }

/* ===== 기록 도전(OOTP Milestone Watch 참고): KBO에서 의미 있게 보는 통산 이정표에 가까운 현역 선수.
   이정표까지 남은 양이 '가까움' 기준 안이면 올린다(1군 통산, 이 리그 기준). 달성은 대기록(feats)에 남는다 */
function mileWatchView(){ const L=mileWatch(); const byK={}; for(const x of L)(byK[x.l]=byK[x.l]||[]).push(x);
  const blk=Object.entries(byK).map(([l,xs])=>`<div class="ldr"><div class="eyebrow">${l}</div>${xs.slice(0,8).map(x=>`<div class="ldr-r mile-r${x.p.team===G.user?' me':''}"><i>${x.g.toLocaleString()}</i><span><button class="lnk" data-a="player" data-v="${x.p.id}">${esc(x.p.name)}</button> <span class="small muted">${esc(tshort(x.p.team))} · ${x.v.toLocaleString()}</span><span class="mile-bar"><b style="width:${Math.round(x.v/x.g*100)}%"></b></span></span><b class="num">${x.left}</b></div>`).join('')}</div>`).join('');
  return csec('기록 도전',`<p class="small muted">통산 이정표(1군, 이 리그 기준)에 가까운 현역 선수입니다. 오른쪽 숫자는 남은 개수, 왼쪽은 도전하는 기록입니다.</p>${blk?`<div class="ldrs">${blk}</div>`:'<p class="small muted">지금 이정표에 가까운 선수가 없습니다.</p>'}`); }
function gameRecView(){ const B=G.gbest||{}; const ks=Object.keys(GBK).filter(k=>B[k]);
  const rows=ks.map(k=>{ const r=B[k], p=G.players[r.pid]||(G.arch&&G.arch[r.pid]); return `<tr class="${r.tid===G.user?'me':''}"><td>${GBK[k][0]}</td><td class="num"><b>${r.v}</b></td><td>${p?`<button class="lnk" data-a="player" data-v="${r.pid}">${esc(r.name)}</button>`:esc(r.name)}</td><td>${r.tid!=null&&G.teams[r.tid]?esc(tshort(r.tid,r.y)):'-'}</td><td>${r.y} · ${esc(r.vs||dmd(r.d))}</td><td>${r.tie?`${r.tie}번`:'-'}</td></tr>`; }).join('');
  return csec('한 경기 최다 기록',`<p class="small muted">1군 정규시즌 한 경기 최고 기록입니다. 같은 기록은 먼저 세운 선수를 남기고 타이 횟수를 셉니다. 이 기능이 들어간 뒤(2026-11-12 업데이트) 치른 경기부터 집계합니다.</p>${rows?`<div class="tw"><table class="sqt"><thead><tr><th>부문</th><th>기록</th><th>선수</th><th>당시 구단</th><th>경기</th><th>타이</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="small muted">아직 집계된 경기가 없습니다. 경기를 치르면 쌓입니다.</p>'}`); }
/* 우승팀(OOTP Playoff History 참고) */
function champTeamsView(){ const H=[...(G.history||[])].filter(h=>h.champ!=null).reverse(); if(!H.length)return csec('역대 우승팀','<p class="small muted">첫 한국시리즈가 끝나면 우승팀 기록이 쌓입니다.</p>');
  const pl=x=>`<div class="fx-li"><b>${G.players[x.id]?`<button class="lnk" data-a="player" data-v="${x.id}">${esc(x.name)}</button>`:esc(x.name)}</b><span class="small muted">${esc(x.pos)} · WAR ${x.w.toFixed(1)} · ${esc(x.l)}</span></div>`;
  return H.map(h=>{ const c=h.cr; const head=`${h.y} ${badge(h.champ,16)} ${esc(tshort(h.champ,h.y))}`; const ks=h.ps&&h.ps.ks; const sub=`${c&&c.w!=null?`정규시즌 ${c.w}-${c.l}-${c.t} (${c.rk}위)`:''}${h.runner!=null?` · 상대 ${esc(tshort(h.runner,h.y))}`:''}${ks&&ks[2]!=null?` ${ks[2]}승 ${ks[3]}패`:''}${c&&c.mg?` · 감독 ${esc(c.mg)}`:''}`;
    return csec(head,`<p class="small muted">${sub}${c&&c.mvp?` · 한국시리즈 MVP ${esc(c.mvp.n)}(${esc(c.mvp.line)})`:''}</p>${c?`<div class="ldrs"><div class="ldr"><div class="eyebrow">주요 타자</div>${c.b.map(pl).join('')}</div><div class="ldr"><div class="eyebrow">주요 투수</div>${c.p.map(pl).join('')}</div></div>`:'<p class="small muted">이 시즌은 우승 명단 기록이 남기 전(2026-11-12 업데이트 이전)에 끝났습니다.</p>'}`); }).join(''); }
/* 역대 감독(OOTP Managers 참고) */
function mgrHistView(){ const M=G.mgrH||{}; const tids=G.teams.map(t=>t.id).filter(t=>(M[t]||[]).length); if(!tids.length)return csec('역대 감독','<p class="small muted">시즌을 마치면 구단별 감독 재임 기록이 쌓입니다(이 업데이트 이후 시즌부터).</p>');
  return tids.map(tid=>{ const L=[...M[tid]].reverse(); return csec(`${badge(tid,16)} ${esc(tshort(tid))} 역대 감독`,`<div class="tw"><table class="sqt"><thead><tr><th class="stk">감독</th><th>재임</th><th>승-패-무</th><th>승률</th><th>가을야구</th><th>우승</th><th>최고 순위</th></tr></thead><tbody>${L.map(s=>`<tr class="${tid===G.user?'me':''}"><td class="stk">${esc(s.name)}${s.act?' <span class="small muted">대행</span>':''}</td><td>${s.y0===s.y1?s.y0:`${s.y0}~${s.y1}`}</td><td>${s.w}-${s.l}-${s.t}</td><td>${(s.w/Math.max(1,s.w+s.l)).toFixed(3).replace(/^0/,'')}</td><td>${s.ps}</td><td>${s.ch}</td><td>${s.best?`${s.best.y} ${s.best.rk}위`:'-'}</td></tr>`).join('')}</tbody></table></div>`); }).join('')+'<p class="small muted">시즌 중 감독이 바뀌면 그 시즌을 마친 감독에게 한 시즌 성적을 붙입니다.</p>'; }
/* 명예의 전당 예정(OOTP Upcoming Eligible 참고) */
function hofWatchView(){ const L=hofWatch(); if(!L.length)return ''; const row=x=>`<div class="ldr-r${x.p.team===G.user?' me':''}"><i>${x.met?'✓':''}</i><span><button class="lnk" data-a="player" data-v="${x.p.id}">${esc(x.p.name)}</button> <span class="small muted">${esc(tshort(x.p.team))} · ${x.age}세 · ${x.seasons}시즌${x.mvp?` · MVP ${x.mvp}`:''}${x.gg?` · 골든글러브 ${x.gg}`:''}</span></span><b class="num">${x.war.toFixed(1)}</b></div>`;
  const met=L.filter(x=>x.met), near=L.filter(x=>!x.met);
  return csec('명예의 전당 예정',`<p class="small muted">은퇴하면 바로 헌액되는 기준(통산 WAR 38, MVP 2회, 골든글러브 6회, WAR 30+MVP 1회)을 이미 채운 현역(✓)과 가까운 현역입니다. 오른쪽은 통산 WAR(이 리그 1군).</p><div class="ldrs">${met.length?`<div class="ldr"><div class="eyebrow">기준 충족 ${met.length}명</div>${met.slice(0,12).map(row).join('')}</div>`:''}${near.length?`<div class="ldr"><div class="eyebrow">근접 ${near.length}명</div>${near.slice(0,12).map(row).join('')}</div>`:''}</div>`); }
/* 포스트시즌 기록(모든 구단): 해마다 라운드별 타자·투수 상위 */
function psRecView(){ const P=G.psSer||{}; const ys=Object.keys(P).map(Number).sort((a,b)=>b-a); if(!ys.length)return csec('포스트시즌 기록','<p class="small muted">이 업데이트(2026-11-12) 이후 가을야구부터 모든 구단 선수의 포스트시즌 기록이 쌓입니다.</p>');
  const y=UI.psy&&P[UI.psy]?UI.psy:ys[0]; const R=P[y]; const ord=['ks','po','spo','wc','tb'].filter(r=>R[r]);
  const chips=`<div class="chips">${ys.map(v=>`<button data-a="psy" data-v="${v}" class="${v===y?'on':''}">${v}</button>`).join('')}</div>`;
  const ops=o=>{ const ob=((o.h||0)+(o.bb||0)+(o.hbp||0))/Math.max(1,(o.ab||0)+(o.bb||0)+(o.hbp||0)), sl=o.ab?((o.h||0)+(o.d||0)+2*(o.tr||0)+3*(o.hr||0))/o.ab:0; return ob+sl; };
  const nm=(id,o)=>G.players[id]?`<button class="lnk" data-a="player" data-v="${id}">${esc(o.n)}</button>`:esc(o.n);
  const blk=r=>{ const E=Object.entries(R[r]); const B=E.filter(([,o])=>!o.isP&&(o.pa||0)>=6).sort((a,b)=>ops(b[1])-ops(a[1])).slice(0,5), Pp=E.filter(([,o])=>o.isP&&(o.outs||0)>=6).sort((a,b)=>((b[1].outs||0)/3-(b[1].er||0)*2)-((a[1].outs||0)/3-(a[1].er||0)*2)).slice(0,5);
    return `<div class="ldr"><div class="eyebrow">${ROUNDK[r]||r} · 타자</div>${B.map(([id,o])=>`<div class="ldr-r${o.t===G.user?' me':''}"><i>${esc(tshort(o.t))}</i><span>${nm(id,o)} <span class="small muted">${o.ab||0}타수 ${o.h||0}안타 ${o.hr||0}홈런 ${o.rbi||0}타점</span></span><b class="num">${ops(o).toFixed(3).replace(/^0/,'')}</b></div>`).join('')||'<p class="small muted">기록 없음</p>'}<div class="eyebrow">${ROUNDK[r]||r} · 투수</div>${Pp.map(([id,o])=>`<div class="ldr-r${o.t===G.user?' me':''}"><i>${esc(tshort(o.t))}</i><span>${nm(id,o)} <span class="small muted">${ipStr(o.outs||0)}이닝 ${o.so||0}탈삼진${o.w?` ${o.w}승`:''}${o.sv?` ${o.sv}세`:''}</span></span><b class="num">${((o.er||0)*27/Math.max(1,o.outs||0)).toFixed(2)}</b></div>`).join('')||'<p class="small muted">기록 없음</p>'}</div>`; };
  return csec('포스트시즌 기록',`${chips}<p class="small muted">${y} 가을야구 라운드별 상위 기록입니다(타자 6타석·투수 2이닝 이상, 모든 구단). 오른쪽은 OPS·평균자책점.</p><div class="ldrs">${ord.map(blk).join('')}</div>`); }
