/* ===== 데이터: 구단 득실점·피타고리안, 선수 리그 백분위, 전력분석팀 월간 데이터 보고 =====
 정규시즌 경기 기록(G.sea.tl: [승패 부호, 득점, 실점, 홈, 상대, 날짜])과 선수 시즌 기록·공개 트래킹만 쓴다(숨은 능력은 쓰지 않음) */
function teamRuns(tid){ const L=((G.sea&&G.sea.tl)||[])[tid]||[]; const rs=sum(L.map(x=>x[1])), ra=sum(L.map(x=>x[2])); const w=L.filter(x=>x[0]>0).length, l=L.filter(x=>x[0]<0).length, t=L.length-w-l;
  const py=rs+ra?Math.pow(rs,1.83)/(Math.pow(rs,1.83)+Math.pow(ra,1.83)):.5; return {L,g:L.length,rs,ra,w,l,t,py,exW:py*(w+l)}; }
const PCT_B=[['ops','OPS',1],['obp','출루율',1],['iso','순수 장타(ISO)',1],['bbp','볼넷%',1],['kp','삼진%',-1],['ev','평균 타구속도',1,1],['hh','강한 타구%',1,1],['whiff','헛스윙%',-1,1],['chase','볼 스윙%',-1,1],['run','1루 도달(초)',-1,1]];
const PCT_P=[['era','ERA',-1],['whip','WHIP',-1],['kpp','K%',1],['bbpp','BB%',-1],['k9','K/9',1],['bb9','BB/9',-1],['hr9','HR/9',-1],['velo','직구 평균',1,1]];
function pctVals(p,h){ const T=(p.arch?null:trackOf(p))||{}; if(p.isP){ const r=h&&h.outs?pRate(h):null; return {era:r&&r.era,whip:r&&r.whip,kpp:h&&h.bf?h.so/h.bf*100:null,bbpp:h&&h.bf?h.bb/h.bf*100:null,k9:r&&r.k9,bb9:r&&r.bb9,hr9:h&&h.outs?(h.hr||0)*27/h.outs:null,velo:T.velo,rpm:T.rpm,whiff:T.whiff,csw:T.csw,gb:T.gb}; }
  const r=h&&h.pa?bRate(h):null; return {ops:r&&r.ops,obp:r&&r.obp,iso:r&&r.slg-r.avg,bbp:h&&h.pa?h.bb/h.pa*100:null,kp:h&&h.pa?h.so/h.pa*100:null,ev:T.ev,hh:T.hh,whiff:T.whiff,chase:T.chase,run:T.run}; }
let _pctC={k:null};
const pctQual=(isP,h)=>!!h&&(isP?(h.outs||0)>=60:(h.pa||0)>=50);
/* 비교 집단: 그 시즌 1군 기준을 채운 선수(지금 소속·현역 여부와 상관없이). 리그를 떠난 선수는 보관 기록으로 넣는다(기록 항목만, 측정값 없음) */
function pctPool(isP,y){ const k=G.day+':'+y+':'+isP+':'+(G.games||[]).length+':'+Object.keys(G.players).length+':'+Object.keys(G.arch||{}).length; if(_pctC.k===k&&_pctC.g===G)return _pctC.v; /* 다른 세이브의 분포를 쓰지 않게 세계(G)도 맞춰 본다(검수 11-08) */ const L=[];
  for(const q of Object.values(G.players)){ if(!!q.isP!==isP||q.fdPool)continue; const h=seasonTotal(q,y,'1군'); if(!pctQual(isP,h))continue; L.push(pctVals(q,h)); }
  for(const id in (G.arch||{})){ if(G.players[id])continue; const a=G.arch[id]; if(!a||!!a.isP!==isP)continue; const h=archSeason(a,y); if(!pctQual(isP,h))continue; L.push(pctVals({isP:a.isP,arch:a},h)); }
  _pctC={k,v:L,g:G}; return L; }
function pctOf(p,k,v,y){ const M=(p.isP?PCT_P:PCT_B).find(x=>x[0]===k); if(!M||v==null||!isFinite(v))return null; const all=pctPool(!!p.isP,y).map(x=>x[k]).filter(x=>x!=null&&isFinite(x)); if(!all.length)return null; const below=all.filter(x=>M[2]>0?x<v:x>v).length, eq=all.filter(x=>x===v).length; return Math.round((below+eq/2)/all.length*100); } /* 같은 값은 절반씩 나눠 가진다(모두 0이면 전원 50, 검수 11-06) */
/* 월간 전력 분석 보고(40_analysts dataReport)에 붙는 데이터 줄: 득실·피타고리안·최근 흐름·백분위 상하위 */
function dataLines(){ const me=teamRuns(G.user); if(me.g<10)return [];
  const T=G.teams.map(t=>({t:t.id,s:teamRuns(t.id)})); const rk=(f,desc)=>[...T].sort((a,b)=>desc?f(b.s)-f(a.s):f(a.s)-f(b.s)).findIndex(x=>x.t===G.user)+1;
  const rs=me.rs/me.g, ra=me.ra/me.g, d=me.w-me.exW; const L10=me.L.slice(-10); const w10=L10.filter(x=>x[0]>0).length, l10=L10.filter(x=>x[0]<0).length, t10=L10.length-w10-l10;
  const y=G.year; const hits=[], lows=[];
  for(const p of playersOf(G.user)){ const h=seasonTotal(p,y,'1군'); if(!pctQual(!!p.isP,h))continue; const V=pctVals(p,h); for(const [k,l,,trk] of (p.isP?PCT_P:PCT_B)){ if(trk)continue; const pc=pctOf(p,k,V[k],y); if(pc==null)continue; if(pc>=90)hits.push({p,l,pc}); if(pc<=10)lows.push({p,l,pc}); } }
  hits.sort((a,b)=>b.pc-a.pc); lows.sort((a,b)=>a.pc-b.pc);
  return [`득실(정규시즌 ${me.g}경기): 경기당 득점 ${rs.toFixed(2)}(리그 ${rk(s=>s.rs/s.g,true)}위) · 실점 ${ra.toFixed(2)}(${rk(s=>s.ra/s.g,false)}위) · 득실차 ${me.rs-me.ra>0?'+':''}${me.rs-me.ra}`,
    `피타고리안 기대 승수 ${me.exW.toFixed(1)}승, 실제 ${me.w}승(${d>=0?'+':''}${d.toFixed(1)}). ${Math.abs(d)<1.5?'득실점만큼 이기고 있습니다.':d>0?'득실점보다 더 이기고 있습니다. 접전 승패가 한쪽으로 쏠렸습니다. 불펜·작전 영향과 함께 봐야 합니다. 시즌이 길어지면 득실차 쪽으로 돌아오는 경우가 많지만 확정할 수는 없습니다.':'득실점보다 덜 이기고 있습니다. 접전에서 진 경기가 많았습니다. 불펜·작전 영향과 함께 봐야 합니다.'}`,
    `최근 10경기 ${w10}승 ${l10}패${t10?` ${t10}무`:''}`,
    `리그 백분위 상위 10%: ${hits.length?hits.slice(0,5).map(x=>`${x.p.name} ${x.l} ${x.pc}`).join(', '):'없음'}`,
    `리그 백분위 하위 10%: ${lows.length?lows.slice(0,5).map(x=>`${x.p.name} ${x.l} ${x.pc}`).join(', '):'없음'} (1군 기준 이상 선수 중. 시즌 초에는 크게 움직입니다)`]; }
