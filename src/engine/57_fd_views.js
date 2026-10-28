/* ===== 창단 드래프트: 스카우트는 툴, 데이터팀은 기록. 종합 판단은 단장 =====
   스카우트: 눈과 스피드건으로 보는 툴(구속·구위·체력, 파워·스피드·어깨/수비)과 체격. 눈에 잘 보이는 툴은 정확하고,
             컨택·선구안·제구처럼 경기 결과로만 드러나는 능력은 눈으로 판단하기 어려워 오차가 크다.
   데이터팀: 최근 3년 실제 기록을 같은 리그 후보와 비교한 백분위(삼진·볼넷·장타·생산력 / 탈삼진·볼넷·피홈런·실점 억제).
             표본이 작으면 믿지 말라고 표시하고, 타구 운(BABIP·ERA−FIP)도 짚는다. 수비와 발은 기록으로 잘 안 보인다.
   둘 다 '이 선수가 좋다'는 종합 점수는 내지 않는다 */
function bodyOf(p){ if(!p.ht){ p.ht=Math.round(clamp((p.isP?184:179)+hn('ht',p.id)*5+(p.isP?(p.r.stf-50)*.08:(p.r.pow-50)*.06),166,198)); p.wt=Math.round(clamp(p.ht-100+hn('wt',p.id)*6+(p.isP?0:(p.r.pow-50)*.2)-(p.isP?1:3),62,118)); } return {ht:p.ht,wt:p.wt}; }
const FD_TOOLS={B:[['pow','파워',1],['spd','스피드',1],['def','수비·어깨',1],['con','컨택',0],['eye','선구안',0]],P:[['stf','구위',1],['sta','체력',1],['ctl','제구',0]]};
function fdScoutSd(){ const sk=(G.scouts||[]).reduce((a,s)=>Math.max(a,s.skill||0),0); return [7,6,5,4,3.2,2.6][clamp(sk,0,5)]; }
function fdScoutTools(p){ const F=G.fd; const key=(F&&F.y)+':'+((G.scouts||[]).map(s=>s.id+s.skill).join(','));
  const base=fdScoutSd(); const L=(FD_TOOLS[p.isP?'P':'B']).map(([k,l,vis])=>{ const sd=base*(vis?.6:1.6); const v=clamp(Math.round((p.r[k]+hn('fst'+k+key,p.id)*sd)/5)*5,20,80); return {k,l,v,vis:!!vis}; });
  const b=bodyOf(p); const velo=p.isP?Math.round(veloOf(p)+hn('fsv'+key,p.id)*.8):null;
  return {L,velo,ht:b.ht,wt:b.wt,sd:base}; }
/* 툴 한 줄 의견: 좋은 툴·약한 툴만 말하고 종합 평가는 하지 않는다 */
function fdScoutLine(p){ const S=fdScoutTools(p); const vis=S.L.filter(t=>t.vis); const good=vis.filter(t=>t.v>=60).map(t=>t.l), bad=vis.filter(t=>t.v<=40).map(t=>t.l);
  const pre=p.isP?`${S.velo}km${S.velo>=150?'(강속구)':S.velo<=140?'(기교파)':''}`:'';
  return [pre,good.length?`${good.join('·')} 좋음`:'',bad.length?`${bad.join('·')} 약함`:''].filter(Boolean).join(' · ')||'눈에 띄는 툴 없음'; }
/* 데이터팀: 최근 3년(없으면 지난해, 1군 우선) 기록 백분위 */
function fdDataAll(){ const F=G.fd; if(!F)return {}; const k=F.y+':'+F.pool.length; if(F._dv&&F._dv.k===k)return F._dv.m; const y=F.y-1; const m={};
  const P=(F.all||F.pool).map(id=>G.players[id]).filter(Boolean); const G2={};
  for(const p of P){ let t=fdThree(p,y), lv=1; if(!t||(p.isP?t.outs<45:t.pa<120)){ const h=seasonTotal(p,y,'퓨처스'); if(h&&(p.isP?h.outs>=45:h.pa>=120)){ t=h; lv=2; } } if(!t)continue; const gk=(p.isP?'P':'B')+lv; (G2[gk]=G2[gk]||[]).push({p,t,lv}); }
  const pct=(A,f,hi)=>{ const v=A.map(f).sort((a,b)=>a-b); return x=>{ const z=f(x); let i=0; while(i<v.length&&v[i]<z)i++; const q=i/Math.max(1,v.length-1); return Math.round((hi?q:1-q)*100); }; };
  for(const gk in G2){ const A=G2[gk]; const isP=gk[0]==='P';
    if(isP){ const bf=x=>x.t.outs+x.t.h+x.t.bb; const fk=pct(A,x=>x.t.so/bf(x),1), fb=pct(A,x=>x.t.bb/bf(x),0), fh=pct(A,x=>(x.t.hr||0)*27/x.t.outs,0), ff=pct(A,x=>(13*(x.t.hr||0)+3*x.t.bb-2*x.t.so)/(x.t.outs/3),0);
      A.forEach(x=>{ const n=x.t.outs/3; m[x.p.id]={isP,lv:x.lv,n,ys:x.t.ys||1,small:n<60,it:[['탈삼진',fk(x)],['볼넷 억제',fb(x)],['피홈런 억제',fh(x)],['실점 억제(FIP)',ff(x)]]}; }); }
    else { const fk=pct(A,x=>x.t.so/x.t.pa,0), fb=pct(A,x=>x.t.bb/x.t.pa,1), fi=pct(A,x=>{ const r=bRate(x.t); return r.slg-r.avg; },1), fo=pct(A,x=>bRate(x.t).obp*1.2+bRate(x.t).slg,1);
      A.forEach(x=>{ m[x.p.id]={isP,lv:x.lv,n:x.t.pa,ys:x.t.ys||1,small:x.t.pa<250,it:[['삼진 적음',fk(x)],['볼넷',fb(x)],['장타력',fi(x)],['생산력',fo(x)]]}; }); } }
  /* 지난해 운: BABIP(타자) · ERA−FIP(투수) */
  for(const p of P){ const d=m[p.id]; if(!d)continue; const L=fdStatLine(p,y); if(!L)continue; if(p.isP){ const g=L.era-L.fip; d.luck=g<=-.7?['지난해 운 좋았음',`ERA가 FIP보다 ${(-g).toFixed(1)} 낮음`]:g>=.7?['지난해 불운',`ERA가 FIP보다 ${g.toFixed(1)} 높음`]:null; }
    else { const b=L.babip; d.luck=b>=.345?['지난해 운 좋았음',`BABIP ${fmt3(b)}`]:b<=.265?['지난해 불운',`BABIP ${fmt3(b)}`]:null; } }
  F._dv={k,m}; return m; }
function fdData(p){ if(dataLv(G.user)<1)return null; return fdDataAll()[p.id]||null; }
const pctW=v=>v>=80?'상':v>=60?'중상':v>=40?'중':v>=20?'중하':'하';
const pctC=v=>v>=80?'var(--good)':v>=60?'#9ccc65':v>=40?'var(--ink)':v>=20?'#f0a35a':'var(--bad)';
/* 포지션 현황: 포지션마다 남은 후보, 툴 좋은 선수, 기록 좋은 선수, 다음 우리 차례 전 빠질 예상 인원 */
function fdPosBoard(){ const F=G.fd; if(!F)return []; const RK=fdRisk(); const out=[]; const keys=['C','1B','2B','3B','SS','LF','CF','RF','SP','RP'];
  const pool=F.pool.map(id=>G.players[id]).filter(p=>p&&p.fdPool);
  for(const k of keys){ const L=pool.filter(p=>k==='SP'?p.isP&&isSPr(p):k==='RP'?p.isP&&!isSPr(p):!p.isP&&p.pos===k);
    const tool=L.filter(p=>{ const S=fdScoutTools(p); return S.L.filter(t=>t.vis).some(t=>t.v>=65)||(p.isP&&S.velo>=150); }).length;
    const dat=dataLv(G.user)>=1?L.filter(p=>{ const d=fdData(p); return d&&d.lv===1&&!d.small&&d.it[3][1]>=75; }).length:null;
    const exp=L.reduce((a,p)=>a+(RK[p.id]||0),0); out.push({k,n:L.length,tool,dat,exp}); }
  return out; }
