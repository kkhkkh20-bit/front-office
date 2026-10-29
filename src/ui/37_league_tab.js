/* ---------- 리그 탭 ---------- */
/* 예전 하위 탭 이름 → 지금 자리 */
function lsegFix(s){ if(s==='board'||!s)return 'stand'; if(s==='sched'){ UI.it=UI.it||{}; UI.it.sres='cal'; return 'score'; } if(s==='games')return 'score'; if(s==='lead')return 'rec'; return s; }
function leagueView(){ UI.lseg=lsegFix(UI.lseg); UI.lseg=ALIAS.league[UI.lseg]||UI.lseg; if(!SUBS.league.some(x=>x[0]===UI.lseg))UI.lseg='stand';
  const s=UI.lseg;
  return subTabs('league')+mergedBody('league',s,{feat:featView,abroad:abroadView,hist:histView,stand:standView,score:scoreHub,news:newsView,teams:teamsView,rec:recView,assoc:assocView});
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

