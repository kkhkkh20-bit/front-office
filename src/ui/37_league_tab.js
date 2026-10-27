/* ---------- 리그 탭 ---------- */
/* 예전 하위 탭 이름 → 지금 자리 */
function lsegFix(s){ if(s==='board'||!s)return 'stand'; if(s==='sched'){ UI.it=UI.it||{}; UI.it.sres='cal'; return 'score'; } if(s==='games')return 'score'; if(s==='lead')return 'rec'; return s; }
function leagueView(){ UI.lseg=lsegFix(UI.lseg); UI.lseg=ALIAS.league[UI.lseg]||UI.lseg; if(!SUBS.league.some(x=>x[0]===UI.lseg))UI.lseg='stand';
  const s=UI.lseg;
  return subTabs('league')+mergedBody('league',s,{feat:featView,abroad:abroadView,hist:histView,stand:standView,score:scoreHub,news:newsView,teams:teamsView,rec:recView});
}
function findView(){
  const f=UI.lf;
  let ps=Object.values(G.players).filter(p=>p.team!=null&&!(p.joinY>G.year)&&(f.team==='all'?p.team!==G.user:p.team===+f.team)&&(f.kind==='bat'?!p.isP:p.isP));
  const val=p=>{ const h=curLine(p); if(f.sort==='war')return h?wOf(h,p):-9; if(f.sort==='stat')return h?(p.isP?(h.outs>=30?-pRate(h).era:-99):(h.pa>=50?bRate(h).ops:-1)):-99; if(f.sort==='ofp'){const r=scoutReport(p);return r.ofp??r.cur;} if(f.sort==='young')return -p.age; if(f.sort==='sal')return p.sal; return 0; };
  ps=ps.map(p=>({p,v:val(p)})).sort((a,b)=>b.v-a.v).slice(0,50).map(x=>x.p);
  const tc=`<select data-a="lfTeam" aria-label="구단"><option value="all" ${f.team==='all'?'selected':''}>다른 구단 전체</option>${G.teams.filter(t=>t.id!==G.user).map(t=>`<option value="${t.id}" ${+f.team===t.id&&f.team!=='all'?'selected':''}>${t.city} ${t.nick}</option>`).join('')}</select>`;
  const sc=`<select data-a="lfSort" aria-label="정렬">${[['war','WAR'],['stat',f.kind==='bat'?'OPS':'평균자책점'],['ofp','스카우트 잠재력'],['young','어린 순'],['sal','연봉']].map(([k,l])=>`<option value="${k}" ${f.sort===k?'selected':''}>${l}</option>`).join('')}</select>`;
  return `<section class="card"><h2 class="sec">선수 찾기</h2>
    <div class="row">${tc}${sc}</div>
    <div class="row between wrapr"><div class="seg" style="flex:1"><button data-a="lfKind" data-v="bat" class="${f.kind==='bat'?'on':''}">야수</button><button data-a="lfKind" data-v="pit" class="${f.kind==='pit'?'on':''}">투수</button></div><div class="seg sm"><button data-a="rview" data-v="card" class="${(UI.rview||'card')==='card'?'on':''}">상세</button><button data-a="rview" data-v="table" class="${UI.rview==='table'?'on':''}">목록</button></div></div>
    <p class="small muted">다른 구단 선수도 현재 능력은 정확히 보입니다. 잠재력은 그 지역 프로 담당 스카우트가 있어야 보입니다. 선수를 눌러 트레이드 대상에 올리세요.</p>
    ${(UI.rview||'card')==='card'?cgrid(ps.slice(0,30),p=>({sub:`${tshort(p.team)} · ${posLabel(p)} · ${p.age}세 · ${hand(p)}`,foot:`${rosterFoot(p)}<button class="tc-i go" data-a="toTrade" data-v="${p.id}">트레이드</button>`})):findTable(ps)}</section>`;
}
function findTable(ps){
  const pit=UI.lf.kind==='pit';
  return `<div class="tw"><table class="sqt"><thead><tr><th>선수</th><th>구단</th><th>${pit?'역할':'포지션'}</th><th>나이</th><th>현재</th><th>잠재력</th><th>${pit?'ERA':'OPS'}</th><th>WAR</th><th>연봉</th></tr></thead><tbody>${ps.map(p=>{ const rp=scoutReport(p); const h=curLine(p);
    return `<tr class="click" data-a="player" data-v="${p.id}"><td><span class="pn">${avImg(p)}<span>${esc(p.name)}${p.foreign?' <span class="pill">외</span>':''}</span></span></td><td>${badge(p.team,18)}</td><td>${posLabel(p)}</td><td>${p.age}</td><td>${rchip(rp.cur)}</td><td>${rchip(rp.ofp)}</td><td>${h?(pit?(h.outs?pRate(h).era.toFixed(2):'-'):(h.pa?fmt3(bRate(h).ops):'-')):'-'}</td><td>${h?wOf(h,p).toFixed(1):'-'}</td><td>${money(p.sal)}</td></tr>`; }).join('')}</tbody></table></div>`;
}
function teamsView(){
  const sel=UI.leagueTeam;
  const list=`<section class="card"><div class="row between"><h2 class="sec">10개 구단</h2><span class="small muted">구단을 누르면 선수단을 봅니다</span></div><div class="tgrid">${[...G.teams].sort((a,b)=>(a.id===G.user?-1:b.id===G.user?1:0)).map(teamCard).join('')}</div></section>`;
  if(sel==null)return list;
  const t=team(sel); const d=depth(sel);
  const grp=(title,arr)=>arr.length?`<div class="grp-h"><span>${title}</span><i>${arr.length}명</i></div>${cgrid(arr)}`:'';
  return `<section class="card"><div class="row between"><h2 class="sec">${tname(sel)}</h2><button class="x" data-a="lteam" data-v="" aria-label="닫기">×</button></div>
    <p class="small muted">${t.mode==='contend'?'우승 경쟁':'리빌딩'} · 구단주 ${OWNER[t.owner].label} · 관계 ${t.rel} · 캡 산정액 ${money(capPay(sel))}</p>
    ${(()=>{ const tt=inTabs('team',[['field','배치·라인업'],['cards','선수 목록']]); return tt.bar+(tt.cur==='field'?fieldSVG(sel,false)+lineupCard(sel):`${grp('주전',d.start)}${grp('선발 로테이션',d.sp)}${grp('불펜',d.pen)}${grp('백업',d.bench)}${grp('2군',d.futB.concat(d.futP))}${grp('부상',d.inj)}`); })()}
  </section>`+list;
}
function leaderBoard(){
  const y=period()==='pre'?G.year-1:G.year;
  const rows=[]; for(const p of Object.values(G.players)){ if(p.team==null)continue; const h=seasonTotal(p,y,'1군'); if(h)rows.push({p,h,w:wOf(h,p)}); }
  const li=(x,v)=>`<button class="item" data-a="player" data-v="${x.p.id}"><span class="nm">${esc(x.p.name)} <span class="small muted">${tshort(x.p.team)} · ${posLabel(x.p)}</span></span><span class="sub">${statLine(x.h,x.p)}</span><span class="rt num"><b>${v}</b></span></button>`;
  const b=rows.filter(x=>!x.p.isP), q=rows.filter(x=>x.p.isP);
  const blk=(title,arr,f,flt,asc)=>`<div class="eyebrow">${title}</div><div class="list">${arr.filter(flt).sort((a,c)=>asc?f(a)-f(c):f(c)-f(a)).slice(0,5).map(x=>li(x,typeof f(x)==='number'&&f(x)%1?f(x).toFixed(title.includes('OPS')||title.includes('타율')?3:title.includes('평균자책')?2:1).replace(/^0\./,'.'):f(x))).join('')}</div>`;
  const qb=x=>x.h.pa>=(period()==='season'?Math.max(30,(G.sea.rec[x.p.team]?.w+G.sea.rec[x.p.team]?.l)*3.1):446);
  const qp=x=>x.h.outs>=(period()==='season'?Math.max(30,(G.sea.rec[x.p.team]?.w+G.sea.rec[x.p.team]?.l)*3):432);
  return `<section class="card"><h2 class="sec">${y} 개인 기록</h2>
    ${blk('타자 WAR',b,x=>x.w,()=>true)}${blk('OPS',b,x=>bRate(x.h).ops,qb)}${blk('홈런',b,x=>x.h.hr,()=>true)}${blk('도루',b,x=>x.h.sb,()=>true)}
    ${blk('투수 WAR',q,x=>x.w,()=>true)}${blk('평균자책점',q,x=>pRate(x.h).era,qp,true)}${blk('탈삼진',q,x=>x.h.so,()=>true)}${blk('세이브',q,x=>x.h.sv,()=>true)}
    <p class="small muted">규정 타석·이닝은 경기 수에 맞춰 적용합니다.</p></section>`;
}

