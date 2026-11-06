/* ---------- 리그 집계 도우미 ---------- */
const tlOf=tid=>((G.sea&&G.sea.tl)||[])[tid]||[];
function wlOf(L){ return {w:L.filter(x=>x[0]>0).length,l:L.filter(x=>x[0]<0).length,t:L.filter(x=>x[0]===0).length}; }
function l10Of(tid){ const L=tlOf(tid).slice(-10); return Object.assign(wlOf(L),{n:L.length}); }
function streakOf(tid){ const L=tlOf(tid); if(!L.length)return ''; const s=L[L.length-1][0]; let n=0; for(let i=L.length-1;i>=0&&L[i][0]===s;i--)n++; return s>0?`${n}연승`:s<0?`${n}연패`:`${n}무`; }
function splitOf(tid){ const L=tlOf(tid); const f=h=>{ const r=wlOf(L.filter(x=>x[3]===h)); return `${r.w}-${r.l}${r.t?'-'+r.t:''}`; }; return {home:f(1),away:f(0),rs:sum(L.map(x=>x[1])),ra:sum(L.map(x=>x[2])),n:L.length}; }
function h2hOf(tid,opp){ return wlOf(tlOf(tid).filter(x=>x[4]===opp)); }
const wlStr=r=>`${r.w}-${r.l}${r.t?'-'+r.t:''}`;
const pctStr=o=>o.w+o.l?fmt3(o.w/(o.w+o.l)):'-';
function standOrder(){ const per=period(); if(per==='season'||per==='post'||preSettle())return {live:true,y:G.year,order:standingsNow()}; const lh=G.history[G.history.length-1]; return {live:false,y:lh?lh.y:G.year-1,order:lh?lh.order:standingsNow()}; }
const gbOf=(top,o)=>((top.w-o.w)-(top.l-o.l))/2;
const gbStr=v=>v<=0?'-':v.toFixed(1);
function strkPill(tid){ const s=streakOf(tid); if(!s)return ''; return `<span class="strk ${s.includes('승')?'w':s.includes('패')?'l':''}" data-a="go" data-v="league:stand">${s}</span>`; }
function blockNow(){ const r=G.res; G.res=null; const b=blocker(); G.res=r; return b; }

let _tsC=null;
function teamStats(y){ const key=y+':'+G.day+':'+G.games.length; if(_tsC&&_tsC.k===key&&_tsC.g===G)return _tsC.v; /* 다른 세이브면 날짜·경기 수가 같아도 다시 센다(검수 11-06) */
  { const A=G.tsArch&&G.tsArch[y]; if(A&&!(G.sea&&G.sea.y===y&&period()==='season')){ const T=A.map((x,i)=>{ const br=bRate(x.b), pr=pRate(x.p); return {tid:i,b:x.b,p:x.p,g:x.g,rs:x.rs,ra:x.ra,avg:br.avg,obp:br.obp,slg:br.slg,ops:br.ops,era:pr.era,whip:pr.whip,hr:x.b.hr,sb:x.b.sb,so:x.p.so,hra:x.p.hr}; }); _tsC={k:key,v:T,g:G}; return T; } }
  const T=G.teams.map(t=>({tid:t.id,b:Object.assign({},ZB),p:Object.assign({},ZP)}));
  for(const p of Object.values(G.players)) for(const h of p.hist){ if(h.y!==y||h.lvl!=='1군'||h.t==null||!T[h.t])continue; const X=p.isP?T[h.t].p:T[h.t].b; for(const k in X)X[k]+=h[k]||0; }
  for(const t of T){ const L=tlOf(t.tid); const cur=G.sea&&G.sea.y===y; t.g=L.length; t.rs=cur?sum(L.map(x=>x[1])):t.b.r; t.ra=cur?sum(L.map(x=>x[2])):null; const br=bRate(t.b), pr=pRate(t.p); Object.assign(t,{avg:br.avg,obp:br.obp,slg:br.slg,ops:br.ops,era:pr.era,whip:pr.whip,hr:t.b.hr,sb:t.b.sb,so:t.p.so,hra:t.p.hr}); }
  _tsC={k:key,v:T,g:G}; return T; }
function rankIn(T,tid,k,asc){ const s=[...T].sort((a,b)=>asc?a[k]-b[k]:b[k]-a[k]); return s.findIndex(x=>x.tid===tid)+1; }
const rkPill=(r)=>`<span class="rk ${r<=3?'hi':r>=8?'lo':''}">${r}위</span>`;

/* 시즌 개인 기록(리그 전체) */
let _prC=null;
function playerRows(y){ const key=y+':'+G.day+':'+G.games.length; if(_prC&&_prC.k===key&&_prC.g===G)return _prC.v;
  const rows=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(!h)continue; if(p.isP?!h.outs:!h.pa)continue; rows.push({p,h,w:wOf(h,p),r:p.isP?pRate(h):bRate(h)}); }
  for(const id in (G.arch||{})){ if(G.players[id])continue; const q=archP(G.arch[id]); const h=seasonTotal(q,y,'1군'); if(!h||(q.isP?!h.outs:!h.pa))continue; rows.push({p:q,h,w:wOf(h,q),r:q.isP?pRate(h):bRate(h)}); } /* 시즌 중 리그를 떠난 선수도 그해 기록에 남는다(시상 집계와 같은 대상, 검수 11-06) */
  _prC={k:key,v:rows,g:G}; return rows; }
function qualOf(tid){ const r=G.sea.rec[tid]; const g=r?r.w+r.l+(r.t||0):0; return g; }
function isQual(x,y){ const live=y===G.year&&(period()==='season'||period()==='post'); const g=live?qualOf(x.h.t??x.p.team):144; return x.p.isP?x.h.outs>=Math.max(3,g*3):x.h.pa>=Math.max(3,Math.round(g*3.1)); } /* 규정타석은 반올림(144경기 446), 시상·타이틀과 같은 기준(검수 11-06) */

