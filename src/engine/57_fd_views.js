/* ===== 창단 드래프트: 스카우트는 툴, 데이터팀은 기록. 종합 판단은 단장 =====
   스카우트: 눈과 스피드건으로 보는 툴(구속·구위·체력, 파워·스피드·어깨/수비)과 체격. 눈에 잘 보이는 툴은 정확하고,
             컨택·선구안·제구처럼 경기 결과로만 드러나는 능력은 눈으로 판단하기 어려워 오차가 크다.
   데이터팀: 최근 3년 실제 기록을 같은 리그 후보와 비교한 백분위(삼진·볼넷·장타·생산력 / 탈삼진·볼넷·피홈런·실점 억제).
             표본이 작으면 믿지 말라고 표시하고, 타구 운(BABIP·ERA−FIP)도 짚는다. 수비와 발은 기록으로 잘 안 보인다.
   둘 다 '이 선수가 좋다'는 종합 점수는 내지 않는다 */
function bodyOf(p){ if(!p.ht){ p.ht=Math.round(clamp((p.isP?184:179)+hn('ht',p.id)*5+(p.isP?(p.r.stf-50)*.08:(p.r.pow-50)*.06),166,198)); p.wt=Math.round(clamp(p.ht-100+hn('wt',p.id)*6+(p.isP?0:(p.r.pow-50)*.2)-(p.isP?1:3),62,118)); } return {ht:p.ht,wt:p.wt}; }
const FD_TOOLS={B:[['pow','파워',1],['con','컨택',0],['eye','선구',0],['spd','주력',1],['def','수비',1]],P:[['stf','구위',1],['ctl','제구',0],['sta','체력',1]]};
function fdScoutSd(){ const sk=(G.scouts||[]).reduce((a,s)=>Math.max(a,s.skill||0),0); return [11,10,9,8,7,6][clamp(sk,0,5)]; }
/* 스카우트 평가: 눈으로 본 툴(실전 감각은 못 봄) + 스카우트 버릇(툴마다 일정하게 후하거나 짠 정도) + 오차 → 등급(S·A·B·C·D·E·F) */
const FD_G=v=>v>=75?'S':v>=65?'A':v>=55?'B':v>=50?'C':v>=45?'D':v>=35?'E':'F'; /* 게임 공통 등급(GRD)과 같은 기준 */
function fdScoutTools(p){ const F=G.fd; const sc=[...(G.scouts||[])].sort((a,b)=>(b.skill||0)-(a.skill||0))[0]; const sid=sc?sc.id:'none'; const key=(F&&F.y)+':'+sid+':'+(sc?sc.skill:0);
  const base=fdScoutSd(); const R=fdToolRef(); const L=(FD_TOOLS[p.isP?'P':'B']).map(([k,l])=>{ const bias=clamp(hn('fsb'+k+sid,'x')*3.5,-5,5); /* 스카우트 버릇: 툴마다 최대 ±5 */ const raw=clamp(p.r[k]-(p.fsx||0)+bias+hn('fst'+k+key,p.id)*base,20,80);
    /* 등급은 툴마다 '1군 주전 평균이 C'가 되게 맞춘다(툴마다 분포가 달라서 그대로 쓰면 컨택은 모두 낮게 나온다) */ const r=R[(p.isP?'P':'B')+k]; const v=r?clamp(52.5+(raw-r.m)/r.sd*9,20,80):raw; return {k,l,v,raw,g:FD_G(v)}; });
  const b=bodyOf(p); const velo=p.isP?Math.round(veloOf(p)+hn('fsv'+key,p.id)*.8):null;
  return {L,velo,ht:b.ht,wt:b.wt,sd:base}; }
const FD_GL={S:6,A:5,B:4,C:3,D:2,E:1,F:0};
/* 실제 툴 등급: 스카우트 등급과 같은 기준(1군 주전 평균이 C)으로 매긴다. 지명 뒤 '추정 A → 실제 C'처럼 기준이 달라 비교가 틀어지던 문제 */
/* 스카우트 버릇 확인: 지금까지 우리가 지명해 실제 능력이 드러난 선수로 툴별 '추정 등급 − 실제 등급' 평균을 낸다(3명 이상, 반 등급 이상 차이만) */
function fdScoutHabit(){ const F=G.fd; if(!F)return []; const D={}; for(const pk of F.picks){ if(pk.tid!==G.user||!pk.pid)continue; const p=G.players[pk.pid]; if(!p||p.team!==G.user)continue; const S=fdScoutTools(p);
    for(const t of S.L){ const d=D[t.k]||(D[t.k]={l:t.l,s:0,n:0}); d.s+=FD_GL[t.g]-FD_GL[fdToolTrue(p,t.k).g]; d.n++; } }
  return Object.entries(D).map(([k,d])=>({k,l:d.l,n:d.n,m:d.s/d.n})).filter(x=>x.n>=3&&Math.abs(x.m)>=.5).sort((a,b)=>Math.abs(b.m)-Math.abs(a.m)); }
function fdScoutHabitTxt(){ const H=fdScoutHabit(); if(!H.length)return ''; return H.map(x=>`${x.l} ${x.m>0?'후하게':'짜게'} 봄(평균 ${x.m>0?'+':''}${x.m.toFixed(1)}등급, ${x.n}명)`).join(' · '); }
function fdToolTrue(p,k){ const R=fdToolRef(); const r=R[(p.isP?'P':'B')+k]; const raw=p.r[k]||0; const v=r?clamp(52.5+(raw-r.m)/r.sd*9,20,80):raw; return {v,g:FD_G(v)}; }
let _ftr=null; /* 저장하지 않는 계산 캐시 */
/* 툴 기준: 1군 주전급(지난해 1군 기록이 충분한 선수)의 툴 평균·편차 */
function fdToolRef(){ const F=G.fd; const k0=F?F.y:G.year; if(_ftr&&_ftr.k===k0)return _ftr.m; const m={}; const ly=k0-1;
  const P=Object.values(G.players).filter(p=>!p.foreign&&!p.prospect&&(p.team!=null||p.fdPool)).filter(p=>{ const h=seasonTotal(p,ly,'1군'); return h&&(p.isP?h.outs>=90:h.pa>=250); });
  for(const isP of [false,true]){ const A=P.filter(p=>p.isP===isP); if(A.length<10)continue; for(const [k] of FD_TOOLS[isP?'P':'B']){ const v=A.map(p=>p.r[k]); const mu=v.reduce((a,b)=>a+b,0)/v.length; const sd=Math.sqrt(v.reduce((a,b)=>a+(b-mu)**2,0)/v.length)||6; m[(isP?'P':'B')+k]={m:mu,sd:Math.max(4,sd)}; } }
  _ftr={k:k0,m}; return m; }
/* 툴 한 줄 의견: 좋은 툴·약한 툴만 말하고 종합 평가는 하지 않는다 */
function fdScoutLine(p){ const S=fdScoutTools(p); const good=S.L.filter(t=>FD_GL[t.g]>=5).map(t=>t.l), bad=S.L.filter(t=>FD_GL[t.g]<=2).map(t=>t.l);
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
    const tool=L.filter(p=>{ const S=fdScoutTools(p); return S.L.some(t=>FD_GL[t.g]>=5)||(p.isP&&S.velo>=150); }).length;
    const dat=dataLv(G.user)>=1?L.filter(p=>{ const d=fdData(p); return d&&d.lv===1&&!d.small&&d.it[3][1]>=75; }).length:null;
    const exp=L.reduce((a,p)=>a+(RK[p.id]||0),0); out.push({k,n:L.length,tool,dat,exp}); }
  return out; }

/* 데이터팀 세부 지표: 최근 3년 1군 합산(부족하면 지난해 1·2군), 지난해 운 */
function fdDetail(p,y){ let t=fdThree(p,y); if(!t||(p.isP?t.outs<30:t.pa<60)){ const h=seasonTotal(p,y,'1군')||seasonTotal(p,y,'퓨처스'); if(h&&(p.isP?h.outs>=15:h.pa>=30))t=Object.assign({ys:1},h); else return null; }
  const L=fdStatLine(p,y);
  if(p.isP){ const bf=t.outs+t.h+t.bb, ip=t.outs/3; return {k:t.so/bf*100,bb:t.bb/bf*100,hr9:(t.hr||0)*9/ip,fip:(13*(t.hr||0)+3*t.bb-2*t.so)/ip+3.2,gap:L&&L.n>=15?L.era-L.fip:null,n:ip,ys:t.ys||1}; }
  const r=bRate(t); return {k:t.so/t.pa*100,bb:t.bb/t.pa*100,iso:r.slg-r.avg,babip:L&&L.n>=60?L.babip:null,n:t.pa,ys:t.ys||1}; }
/* 데이터팀 한 줄 의견: 세부 데이터에서 눈에 띄는 것 두세 가지와 운 */
function fdDataLine(p,y){ const d=fdDetail(p,y); if(!d)return '기록이 부족해 판단하기 어렵습니다'; const T=trackOf(p); const ana=dataLv(G.user)>=1; const out=[];
  if(p.isP){ if(d.k>=24)out.push('삼진을 잘 잡음'); else if(d.k<=15)out.push('삼진이 적음'); if(d.bb<=6.5)out.push('볼넷 적음'); else if(d.bb>=11)out.push('볼넷 많음'); if(d.hr9>=1.3)out.push('홈런 허용 많음'); if(ana&&T.whiff>=29)out.push('헛스윙 유도 좋음');
    if(d.gap!=null&&d.gap<=-.7)out.push(`${y} ERA가 FIP보다 ${(-d.gap).toFixed(1)} 낮아 운이 따름`); else if(d.gap!=null&&d.gap>=.7)out.push(`${y} ERA가 FIP보다 ${d.gap.toFixed(1)} 높아 불운, 반등 여지`); }
  else { if(ana&&T.ev>=141)out.push('타구가 강함'); else if(ana&&T.ev<=131)out.push('타구가 약함'); if(d.k<=14)out.push('삼진 적음'); else if(d.k>=24)out.push('삼진 많음'); if(d.bb>=11)out.push('볼넷 잘 고름'); if(d.iso>=.2)out.push('장타 힘 있음');
    if(d.babip!=null&&d.babip>=.345)out.push(`${y} BABIP ${fmt3(d.babip)}로 높아 타율에 운이 섞임`); else if(d.babip!=null&&d.babip<=.265)out.push(`${y} BABIP ${fmt3(d.babip)}로 낮아 불운, 반등 여지`); }
  if(d.n<(p.isP?60:250))out.push('표본 적음'); return out.slice(0,4).join(' · ')||'특별히 튀는 데이터 없음'; }
