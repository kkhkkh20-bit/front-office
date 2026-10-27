/* ---------- 경기 결과 확인 ---------- */
/* 중계 시점 기록: 이 경기 시작 전 누적 + 지금 타석 직전까지의 오늘 기록. 경기 결과가 미리 새지 않게 한다 */
function seasonAt(g,k,id,isP){ const p=G.players[id]; if(!p)return null; const tot=seasonTotal(p,G.year,'1군'); const z=isP?{outs:0,er:0,h:0,bb:0,so:0,hr:0}:{pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0};
  const o=Object.assign({},z); if(tot)for(const key in z)o[key]=tot[key]||0;
  const gi=g?G.games.indexOf(g):-1; const yr=dobj(G.day).y;
  if(gi>=0)for(let i=0;i<=gi;i++){ const r=G.games[i]; if(!r||!r.box||/차전/.test(r.kind||'')||dobj(r.day).y!==yr)continue; for(const sd of ['h','a']){ const S=r.box[sd]; if(!S)continue;
      if(isP){ const q=(S.pit||[]).find(x=>x.id===id); if(q){ o.outs-=q.outs||0; o.er-=q.er||0; o.h-=q.h||0; o.bb-=q.bb||0; o.so-=q.so||0; o.hr-=q.hr||0; } }
      else { const q=(S.bat||[]).find(x=>x.id===id); if(q){ o.ab-=q.ab||0; o.h-=q.h||0; o.d-=q.d||0; o.tr-=q.tr||0; o.hr-=q.hr||0; o.bb-=q.bb||0; o.so-=q.so||0; o.pa-=(q.ab||0)+(q.bb||0); } } } }
  if(g&&g.pbp){ const L=g.pbp; let half=-1,o0=0; for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(x[0]!==half){ half=x[0]; o0=0; } if(x[1]==='SB'||x[1]==='CS'){ o0=x[3]; continue; } if(typeof x[1]!=='number')continue;
      if(isP&&x[2]===id){ o.outs+=Math.max(0,x[4]-o0); o.er+=x[6]||0; if(x[3]==='K')o.so++; if(x[3]==='BB')o.bb++; if(['1B','2B','3B','HR'].includes(x[3]))o.h++; if(x[3]==='HR')o.hr++; }
      if(!isP&&x[1]===id){ o.pa++; if(x[3]!=='BB')o.ab++; else o.bb++; if(['1B','2B','3B','HR'].includes(x[3]))o.h++; if(x[3]==='2B')o.d++; if(x[3]==='3B')o.tr++; if(x[3]==='HR')o.hr++; if(x[3]==='K')o.so++; }
      o0=x[4]; } }
  for(const key in o)o[key]=Math.max(0,o[key]); return o; }
function eraAt(g,k,id){ const o=seasonAt(g,k,id,true); return o&&o.outs?(o.er*27/o.outs).toFixed(2):'-'; }
function batAt(g,k,id){ const o=seasonAt(g,k,id,false); if(!o||!o.pa)return null; const avg=o.ab?o.h/o.ab:0, obp=o.pa?(o.h+o.bb)/o.pa:0, slg=o.ab?(o.h+o.d+2*o.tr+3*o.hr)/o.ab:0; return {avg,ops:obp+slg,hr:o.hr}; }
function avgOpsAt(g,k,id){ const r=batAt(g,k,id); return r?`${fmt3(r.avg)} / ${fmt3(r.ops)}`:'-'; }
function seasonAvgOps(id){ const p=G.players[id]; if(!p)return ''; const h=seasonTotal(p,G.year,'1군'); if(!h||!h.pa)return '-'; const r=bRate(h); return `${fmt3(r.avg)} / ${fmt3(r.ops)}`; }
function seasonEra(id){ const p=G.players[id]; if(!p)return '-'; const h=seasonTotal(p,G.year,'1군'); return h&&h.outs?pRate(h).era.toFixed(2):'-'; }
function hBadge(id,isP){ const p=G.players[id]; if(!p)return ''; const h=isP?p.th:p.bt; if(!h)return ''; return `<em class="cc-h sm ${h==='좌'?'l':h==='양'?'s':'r'}">${h}${isP?'투':'타'}</em>`; }
function batBox(s,mine){
  const t=s.bat.reduce((a,x)=>{ for(const k of ['ab','h','d','tr','hr','rbi','r','bb','so','sb'])a[k]=(a[k]||0)+(x[k]||0); return a; },{});
  return `<div class="tw"><table class="box"><thead><tr><th class="opt">#</th><th class="stk">타자</th><th>타수</th><th class="key">안타</th><th class="opt">2루타</th><th class="opt">3루타</th><th>홈런</th><th class="key">타점</th><th>득점</th><th>볼넷</th><th>삼진</th><th class="opt">도루</th><th class="opt">시즌 타율/OPS</th></tr></thead><tbody>
    ${s.bat.map((x,i)=>`<tr class="${x.h>=3||x.hr?'hot':x.ab>=3&&!x.h?'cold':''}"><td class="opt">${i+1}</td><td class="stk"><button class="lnk" data-a="player" data-v="${x.id}">${esc(x.n)}</button> ${hBadge(x.id,false)} <span class="muted">${POSS[x.pos]||''}</span></td><td>${x.ab}</td><td class="key">${x.h}</td><td class="opt">${x.d||0}</td><td class="opt">${x.tr||0}</td><td class="${x.hr?'bhl':''}">${x.hr}</td><td class="key${x.rbi?' bhl':''}">${x.rbi}</td><td>${x.r}</td><td>${x.bb}</td><td>${x.so}</td><td class="opt">${x.sb||0}</td><td class="muted opt">${seasonAvgOps(x.id)}</td></tr>`).join('')}
    <tr class="tot"><td class="opt"></td><td class="stk">합계</td><td>${t.ab}</td><td class="key">${t.h}</td><td class="opt">${t.d}</td><td class="opt">${t.tr}</td><td>${t.hr}</td><td class="key">${t.rbi}</td><td>${t.r}</td><td>${t.bb}</td><td>${t.so}</td><td class="opt">${t.sb}</td><td class="opt"></td></tr></tbody></table></div>`;
}
function pitBox(s){
  return `<div class="tw"><table class="box"><thead><tr><th class="stk">투수</th><th></th><th class="key">이닝</th><th>투구수</th><th>피안타</th><th class="opt">피홈런</th><th>볼넷</th><th>삼진</th><th class="key">실점</th><th class="opt">시즌 ERA</th></tr></thead><tbody>
    ${s.pit.map(q=>`<tr><td class="stk"><button class="lnk" data-a="player" data-v="${q.id}">${esc(q.n)}</button> ${hBadge(q.id,true)}</td><td>${q.d?`<span class="pill ${q.d==='승'?'good':q.d==='패'?'bad':'acc'}">${q.d}</span>`:''}</td><td class="key">${ipStr(q.outs)}</td><td class="${q.pc>=100?'warn':''}">${q.pc}</td><td>${q.h}</td><td class="opt">${q.hr||0}</td><td>${q.bb}</td><td>${q.so}</td><td class="key">${q.er}</td><td class="muted opt">${seasonEra(q.id)}</td></tr>`).join('')}</tbody></table></div>`;
}
function fullBox(g,openOpp){
  const me=g.home===G.user?'h':g.away===G.user?'a':'h', op=me==='h'?'a':'h';
  const hl=[]; const ms=g.box[me];
  const star=[...ms.bat].sort((a,b)=>(b.h*2+b.hr*3+b.rbi*1.5)-(a.h*2+a.hr*3+a.rbi*1.5))[0];
  if(star&&star.h)hl.push(`${esc(star.n)} ${star.ab}타수 ${star.h}안타${star.hr?` ${star.hr}홈런`:''}${star.rbi?` ${star.rbi}타점`:''}`);
  const sp=ms.pit[0]; if(sp)hl.push(`선발 ${esc(sp.n)} ${ipStr(sp.outs)}이닝 ${sp.er}실점 ${sp.so}탈삼진${sp.d?` (${sp.d})`:''}`);
  const sv=ms.pit.find(q=>q.d==='세'); if(sv)hl.push(`${esc(sv.n)} 세이브`);
  return `${lineScore(g,null)}
    ${hl.length?`<div class="hl">${hl.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
    <details class="evs"><summary class="eyebrow">득점 상황 ${g.ev.filter(e=>e.run).length}건</summary><div class="log">${g.ev.filter(e=>e.run).map(e=>`<p><span class="ticker">${Math.floor(e.h/2)+1}회${e.h%2?'말':'초'}</span> ${esc(e.t)}</p>`).join('')||'<p class="small muted">득점이 없었습니다.</p>'}</div></details>
    <div class="eyebrow">${badge(ms.tid,16)} ${tname(ms.tid)} 타자</div>${batBox(ms,true)}
    <div class="eyebrow">${tname(ms.tid)} 투수</div>${pitBox(ms)}
    <details ${openOpp?'open':''}><summary class="eyebrow" style="cursor:pointer">${badge(g.box[op].tid,16)} ${tname(g.box[op].tid)} 기록 보기</summary>${batBox(g.box[op])}${pitBox(g.box[op])}</details>`;
}
function resultCard(){
  if(!G.res)return ''; const g=G.games[G.res.i]; if(!g){G.res=null;return '';}
  const me=g.home===G.user?'h':'a'; const ms=me==='h'?g.hs:g.as, os=me==='h'?g.as:g.hs; const opp=me==='h'?g.away:g.home;
  const r=G.sea.rec[G.user]; const rk=period()==='season'?standingsNow().findIndex(x=>x.tid===G.user)+1:null;
  const n=(G.sea.ulog||[]).filter(x=>!/차전/.test(x.k)).length;
  return `<section class="card hero rescard">
    <div class="row between"><span class="eyebrow">${g.kind?esc(g.kind)+' · ':''}${dstr(g.day)}${!/차전/.test(g.kind||'')&&period()==='season'?` · 시즌 ${n}/144경기`:''}</span><span class="pill ${g.res==='승'?'good':g.res==='패'?'bad':''}">${g.res}</span></div>
    <div class="scoreline">${badge(g.away,34)}<b>${tshort(g.away)}</b><span class="num">${g.as}</span><i>:</i><span class="num">${g.hs}</span><b>${tshort(g.home)}</b>${badge(g.home,34)}</div>
    <p class="small muted" style="text-align:center;margin:0">${me==='h'?'홈':'원정'} 경기${g.inn>9?` · 연장 ${g.inn}회`:''}${rk?` · 시즌 ${r.w}승 ${r.l}패${r.t?` ${r.t}무`:''} · ${rk}위`:''}</p>
    ${fullBox(g,false)}
    <div class="btns"><button class="btn primary" data-a="resNext">확인 · 다음 경기</button><button class="btn" data-a="resOk">확인</button></div>
  </section>`;
}
function schedView(){
  const c=G.cal; const ms=[3,4,5,6,7,8,9,10]; const cm=UI.smon||Math.min(10,Math.max(3,dobj(G.day).m));
  const log=new Map((G.sea.ulog||[]).filter(x=>!/차전/.test(x.k)).map(x=>[x.d,x]));
  const days=Object.keys(c.sched).map(Number).filter(d=>dobj(d).m===cm&&c.sched[d].some(m=>m.includes(G.user))).sort((a,b)=>a-b);
  const played=(G.sea.ulog||[]).filter(x=>!/차전/.test(x.k)); const w=played.filter(x=>x.res==='승').length,l=played.filter(x=>x.res==='패').length;
  const rows=days.map(d=>{ const m=c.sched[d].find(x=>x.includes(G.user)); const home=m[0]===G.user; const op=home?m[1]:m[0]; const r=log.get(d); const gi=G.games.findIndex(g=>g.day===d);
    const o=dobj(d); return `<div class="srow${d===G.day?' today':''}${r?'':' up'}" ${gi>=0?`data-a="openGame" data-v="${gi}" role="button" tabindex="0"`:''}><span class="sd">${o.m}/${o.d} <i>${WD[o.w]}</i></span><span class="so">${home?'vs':'@'} ${badge(op,20)} ${esc(tshort(op))}</span>${r?`<span class="sr"><span class="pill ${r.res==='승'?'good':r.res==='패'?'bad':''}">${r.res}</span> <b class="num">${home?r.hs:r.as}:${home?r.as:r.hs}</b></span>`:`<span class="sr muted">${d<G.day?'-':home?'홈':'원정'}</span>`}</div>`; }).join('');
  return csec(`${G.year} 정규시즌 일정`,`<p class="small">정규시즌 144경기 중 <b>${played.length}</b>경기 · ${w}승 ${l}패${played.length-w-l?` ${played.length-w-l}무`:''} · 남은 경기 ${144-played.length}</p>
    <div class="chips">${ms.map(m=>`<button data-a="smon" data-v="${m}" class="${cm===m?'on':''}">${m}월</button>`).join('')}</div>
    <div class="sched">${rows||'<p class="small muted">이 달에는 경기가 없습니다.</p>'}</div>
    <p class="small muted">월요일은 휴식일입니다. 결과를 누르면 최근 경기의 박스스코어를 볼 수 있습니다(최근 25경기 보관). 정규시즌 1~5위가 와일드카드·준플레이오프·플레이오프·한국시리즈로 이어지는 가을야구에 나갑니다.</p>`)
   +(G.ps?csec('포스트시즌',psBody()):'');
}
function busView(){ const t=team(G.user); return csec('구단 버스',`<div class="tgrid">${(()=>{ const bl=busLv(); return `<div class="tcard fci" id="fci-bus" style="cursor:default"><div class="row between" style="flex-wrap:nowrap"><div><b>구단 버스</b><div class="small muted">${BUS[bl].l}</div></div><span class="fpip">${[1,2].map(i=>`<i class="${i<=bl?'on':''}"></i>`).join('')}<em>${bl}/2</em></span></div><p class="dnote">원정 경기 이동 피로를 바꿉니다. 일반 버스는 원정 피로 +10%, 우등 +2%, 리무진 -6%(다른 구단은 우등 기준).</p><div class="tc-ft">${bl>=2?'<span class="pill good">최고 등급</span>':`<span class="small">${BUS[bl+1].l} 구입 <b class="num">${money(BUS[bl+1].c)}</b> · 운영비 연 ${money(BUS[bl+1].up)}</span><button class="btn small primary" data-a="buyBus" data-v="${bl+1}" ${t.cash<BUS[bl+1].c?'disabled':''}>구입 · ${money(BUS[bl+1].c)}</button>`}</div></div>`; })()}</div>${UI.facMsg?`<div class="note bad">${esc(UI.facMsg)}</div>`:''}`); }
function invView(){ const it=inTabs('inv',[['train','훈련 시설'],['bus','구단 버스'],['home','홈구장'],['new','신구장']],'train');
  if(it.cur==='bus')return it.bar+busView(); if(it.cur==='home')return it.bar+stadView('now')+stadView('fac')+`<details class="moreg"><summary><span>리그 관중 비교</span></summary><div class="moreb">${stadView('lg')}</div></details>`; if(it.cur==='new')return it.bar+stadView('new'); return it.bar+facView(); }
function facView(){ facInit(); const F=G.fac; const t=team(G.user); const nb=Object.keys(F.bld).length;
  const league=G.teams.map(x=>({x,lv:facLv(x.id)})); const rk=league.filter(q=>q.lv>F.lv).length+1;
  const card=k=>{ const D=FACI[k], lv=F.it[k], b=F.bld[k], nx=lv+1;
    const pips=[1,2,3].map(i=>`<i class="${i<=lv?'on':''}${b&&i===b.lv?' bld':''}"></i>`).join('');
    return `<div class="tcard fci" id="fci-${k}" style="cursor:default"><div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><div style="min-width:0"><b>${D.l}</b><div class="small muted">${D.lv[lv]}</div></div><span class="fpip" title="${lv}/3단계">${pips}<em>${lv}/3</em></span></div>
      <p class="dnote">${esc(D.d)}</p>
      <div class="tc-ft">${b?`<span class="pill warn">${D.lv[b.lv]} 공사 중 · ${dmd(b.done)} 완공</span>`:lv>=3?'<span class="pill good">최고 단계</span>':`<span class="small">다음: <b>${D.lv[nx]}</b> · 공사비 <b class="num">${money(D.c[nx])}</b> · ${D.days[nx]}일 · 유지비 연 ${money(D.up[nx])}</span><button class="btn small primary" data-a="buildFacItem" data-v="${k}" ${nb>=2||t.cash<D.c[nx]?'disabled':''}>착공 · ${money(D.c[nx])}</button>${nb>=2?'<span class="small muted">동시 공사는 2곳까지</span>':t.cash<D.c[nx]?`<span class="small bad">현금 부족(보유 ${money(t.cash)})</span>`:''}`}</div></div>`; };
  return csec('훈련·육성 시설',`<p class="small muted">실제 구단의 2군 훈련장·재활센터·트래킹 장비 투자를 항목별로 나눴습니다. 공사비는 구단 보유 현금에서 바로 나가고, 완공되면 유지비가 매년 듭니다. 공사는 동시에 2곳까지 할 수 있습니다. 성장 효과는 매년 겨울 성장 때 반영되고, 부상·회복 효과는 바로 적용됩니다.</p>
    <dl class="tsum"><div><dt>종합 등급</dt><dd>${F.lv}단계 · 리그 ${rk}위</dd></div><div><dt>연 유지비</dt><dd class="num">${money(facUpkeep())}</dd></div><div><dt>보유 현금</dt><dd class="num">${money(t.cash)}</dd></div><div><dt>공사 중</dt><dd>${nb}/2</dd></div></dl>
    ${UI.facMsg?`<div class="note bad">${esc(UI.facMsg)}</div>`:''}
    <div class="tgrid">${FACK.map(card).join('')}</div>
    <div class="eyebrow" style="margin-top:8px">성장에 영향을 주는 것</div>
    <p class="small muted">1) 출전 시간: 1군에서 많이 뛸수록 잘 큽니다(2군 출전은 2군 구장 수준에 따라 60~75% 인정). 2) 시설. 3) 감독의 육성 성향. 4) 2군 연수. 선수마다 숨은 성장 유형이 있습니다.</p>`); }

