/* ===== 포지션 배치와 뎁스 ===== */
/* 서브 포지션: 주 포지션별로 함께 연습해 온 자리 (선수마다 고정) */
const SUBMAP={C:[['1B',.2]],'1B':[['LF',.35],['3B',.3],['RF',.25]],'2B':[['SS',.6],['3B',.45],['1B',.25]],'3B':[['1B',.6],['SS',.3],['2B',.35]],SS:[['2B',.85],['3B',.65]],LF:[['RF',.7],['1B',.35],['CF',.2]],CF:[['LF',.85],['RF',.8]],RF:[['LF',.7],['1B',.3],['CF',.3]]};
const _subC=new Map();
/* 할 수 있는 다른 자리: 숙련도 50 이상(78_positions.js) */
function subsOf(p){ if(p.isP)return []; const E=pexpOf(p); return Object.keys(E).filter(k=>k!==p.pos&&E[k]>=50).sort((a,b)=>E[b]-E[a]); }
function defAt(p,pos){ return pos==='DH'?0:defBase(p,pos)+dsubFit(p,pos); } /* 포지션 적합: 그 자리에서 중요한 세부 수비 능력(03b_def_sub)까지 본 수비력 */
function defBase(p,pos){
  if(pos==='DH')return 0; if(p.pos===pos)return p.r.def;
  const e=(pexpOf(p)[pos]||0)/100; return p.r.def-posRaw(p.pos,pos)*versF(p)*(1-e*.85);
}
/* 포지션 감안 가치(타자). 종합 능력(ovr)은 수비를 어느 자리든 같은 무게(0.2)로 센다. 그런데 경기에서는 유격·3루·2루·중견 수비가 실점에 훨씬 크게 작용하고,
   자리마다 그만한 선수가 드문 정도도 다르다. 그래서 값을 매길 때(트레이드·FA·연봉·WAR)는 이 둘을 종합 능력 단위로 바꿔 더한다.
   DWR: 그 자리 수비 1점이 시즌 실점을 몇 점 바꾸는가(엔진 식에서 계산: 인플레이 타구 안타 확률 + 자리별 실책). POS_ADJ: 자리 희소성(600타석당 득점).
   공격 종합 1점은 600타석당 약 1.56점. 자리는 그 선수가 가장 가치 있는 곳(1루·지명은 누구나 갈 수 있다) */
const DWR={SS:1.4,'2B':1.25,C:1.25, /* 포수: 리드(투수 결과) 0.7 + 도루 저지 0.5 */CF:1.05,'3B':.8,LF:.8,RF:.75,'1B':.55}, RUN_PER_OVR=1.56;
/* 11-15 수비 감사(세계 16개 × 2025시즌, 타구마다 '그 야수 대신 그 자리 보통 수비였다면' 안타·실책 기대를 빼서 잰 실점 ÷ 수비 1점, 144경기 기준.
   수비 범위·포구·자리별 타구 몫·실책 배수(06_game EPOS) 조정 뒤): 유격 1.41 · 2루 1.26 · 포수 약 1.25(리드 .7 + 도루 저지 .5) · 중견 1.08 · 3루 .81 · 우익 .77 · 좌익 .76 · 1루 .52.
   예전 값(유격 1.1·3루 .84·2루 .82·중견 .7·포수 .92·우익 .47·좌익 .43·1루 .39)은 엔진이 바뀐 뒤 다시 재지 않은 값이었다.
   WAR(02_records warRaw)만 새 값을 쓰고, 주전 고르기(makeLineup·posScore)·선수 가치(posValAt·posValLearn: 연봉·트레이드·FA)는 예전 무게(DWR0)를 그대로 쓴다(안정화 릴리스: AI 판단을 바꾸지 않는다) */
const DWR0={SS:1.1,'3B':.84,'2B':.82,CF:.7,C:.92,RF:.47,LF:.43,'1B':.39};
/* DAVG: 리그 주전의 자리별 평균 수비력(새 게임 5개에서 잰 값). 그 자리 평균보다 잘하면 플러스 */
const DAVG={SS:57.5,'2B':57.4,CF:56.7,C:54.5,'3B':53.8,'1B':48.2,RF:46.3,LF:46.3};
/* 수비 난이도: 같거나 쉬운 자리로는 옮길 수 있다고 본다(유격→3루·1루 쉬움, 1루→유격 안 됨). 포수는 포수만 */
const DSPEC={SS:6,C:6,CF:5,'2B':5,'3B':4,RF:3,LF:2,'1B':1,DH:0};
function posValAt(p,pos){ const d=pos==='DH'?0:(defAt(p,pos)-DAVG[pos])*DWR0[pos]; return ovr(p)-(p.r.def-50)*.2+((POS_ADJ[pos]||0)+d)/RUN_PER_OVR; }
const _pvC=new Map();
function posBest(p){ if(!p||p.isP)return {pos:'P',v:p?ovr(p):0}; const k=G.day+':'+p.pos+':'+p.r.def+':'+ovr(p).toFixed(2)+':'+JSON.stringify(p.pexp||'')+':'+(p.trt||''); const c=_pvC.get(p.id); if(c&&c.k===k)return c.b;
  let b={pos:'DH',v:posValAt(p,'DH')}; const lim=DSPEC[p.pos]??1; const sub=new Set(subsOf(p)); for(const q of ['C','SS','2B','CF','3B','RF','LF','1B']){ if(q===p.pos||sub.has(q)||(q!=='C'&&DSPEC[q]<=lim)){ /* 실제로 익힌 부 포지션(숙련 50 이상)도 후보: 유격수를 1루로 바꿔도 익힌 유격 가치는 그대로 */ const v=posValAt(p,q); if(v>b.v)b={pos:q,v}; } } if(_pvC.size>4000)_pvC.clear(); _pvC.set(p.id,{k,b}); return b; }
const pvShift=p=>p&&!p.isP?posBest(p).v-ovr(p):0; /* 종합 능력에 더할 포지션 보정(투수 0) */
const posScore=(p,pos)=>{ if(pos==='DH')return offV(p); const w=DWR0[pos]!=null?.2+DWR0[pos]*.3:.38; return offV(p)*(1-w)+defAt(p,pos)*w; }; /* 수비가 중요한 자리일수록 수비를 더 본다: 유격 .53 · 3루·2루 .45 · 중견 .41 · 포수 .4 · 코너 외야 .33 · 1루 .32 */
const ORDER=['C','SS','CF','2B','3B','RF','LF','1B','DH'];
function makeLineup(tid,pool){
  const bats=(pool||actOf(tid)).filter(p=>!p.isP&&healthy(p));
  const used=new Set(); const ln={};
  const ov={}; const mg=G.mgr[tid]; const promo=()=>0; void mg; /* 약속 가산은 polBonus(promB)로 옮김: 등록·투수 기용에도 반영 */
  for(const pos of ORDER){ const id=ov[pos]; const p=id&&G.players[id]; if(p&&p.team===tid&&!p.isP&&healthy(p)&&!used.has(p.id)){ln[pos]=p;used.add(p.id);} }
  /* 감독은 이기는 배치를 찾는다: 공격(시즌 득점) + 그 자리 수비가 막는 실점(자리별 무게 DWR, 감독 수비 성향만큼)이 가장 큰 9명 조합.
     낯선 자리는 숙련도가 낮을수록 꺼린다(fitPen). 포수는 포수·지명 말고는 거의 옮기지 않는다 */
  const fitPen=(p,pos)=>{ if(pos==='DH')return p.pos==='C'?1:0; if(p.pos===pos)return 0; if(p.pos==='C')return 400; /* 포수는 포수·지명만(다른 자리는 대안이 아예 없을 때뿐). 40이면 방망이가 아주 좋은 포수가 코너 외야로 나갔다 */ const e=(pexpOf(p)[pos]||0)/100; const IF=['2B','SS','3B'], OF=['LF','CF','RF']; const cross=(IF.includes(p.pos)&&OF.includes(pos))||(OF.includes(p.pos)&&IF.includes(pos))||(p.pos==='1B'&&pos!=='DH'); const b=pos==='C'?40:pos==='1B'?3:cross?16:OF.includes(pos)?2:4; return e>=.5?Math.min(1,b):b-(b-1)*e/.5; }; /* 같은 무리(내야끼리·외야끼리) 이동은 쉽고, 내야↔외야는 경험 없이는 꺼린다 */
  const lean=teamLean(tid); const pb=p=>polBonus(tid,p,lean); const wD=mgrDefW(tid);
  const open=new Set(ORDER.filter(pos=>!ln[pos]));
  const mf=wD/.38; const SC=new Map(); for(const p of bats){ const o=offV(p)*1.25, ex=promo(p)+pb(p)+rpB(tid,p,'B'); const m={}; for(const pos of ORDER)m[pos]=(pos==='DH'?o:o+(defAt(p,pos)-DAVG[pos])*DWR0[pos]*mf)+ex-fitPen(p,pos)+(typeof posAskB==='function'?posAskB(tid,p,pos):0); /* 단장 포지션 기용 건의를 감독이 받아들이면 그 자리 쪽으로 */ SC.set(p.id,m); }
  while(open.size){ let bp=null,bq=null,bs=-1e9;
    for(const pos of open){ if(pos==='DH'&&open.size>1)continue; for(const p of bats){ if(used.has(p.id))continue; const s=SC.get(p.id)[pos]; if(s>bs){bs=s;bp=pos;bq=p;} } }
    if(!bq)break; ln[bp]=bq; used.add(bq.id); open.delete(bp); }
  /* 한 명씩 정하면 놓치는 배치를 바로잡는다: 두 선수 자리 맞바꾸기, 벤치 선수와 바꾸기를 더 나아지지 않을 때까지(예: 수비 좋은 우익수를 중견으로, 거포 3루수를 1루로) */
  const fixed=new Set(ORDER.filter(pos=>ov[pos]&&ln[pos]&&ln[pos].id===ov[pos])); const sc=(p,pos)=>SC.get(p.id)?SC.get(p.id)[pos]:-1e9;
  for(let it=0;it<6;it++){ let better=false; const P=ORDER.filter(pos=>ln[pos]&&!fixed.has(pos));
    for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){ const a=P[i], b=P[j], x=ln[a], y=ln[b]; if(sc(y,a)+sc(x,b)>sc(x,a)+sc(y,b)+.3){ ln[a]=y; ln[b]=x; better=true; } }
    for(const pos of P){ const x=ln[pos]; for(const q of bats){ if(used.has(q.id))continue; if(sc(q,pos)>sc(x,pos)+.3){ used.delete(x.id); used.add(q.id); ln[pos]=q; better=true; break; } } }
    if(!better)break; }
  promFloor(tid,ln,bats,used,sc);
  return ln;
}
/* 출전 기회 약속(사용자 제보 11-07): 약속 기간에는 가산(promB)만으로는 능력 차이가 큰 선수가 끝내 못 나간다.
   약속한 타석(타자 25)을 기간에 고르게 나눈 속도보다 뒤처지면 그날은 그 선수의 가장 맞는 자리에 선발로 넣는다(따라잡을 때까지).
   모든 구단 같은 규칙, 난수 없음, 저장 항목 없음. 이미 채웠거나 기간이 지난 약속·옛 약속(기준 없음)은 건드리지 않는다 */
function promFloor(tid,ln,bats,used,sc){ if(typeof playPromBase!=='function')return;
  for(const q of bats){ if(used.has(q.id)||q.isP)continue; const P=q.promise; if(!P||!P.b||!(P.until>=G.day)||(P.tid??q.team)!==tid||!(P.d<=G.day))continue;
    const b=playPromBase(q,P), now=playPromNow(q,b.y,b.tid), got=(now.pa||0)-(b.pa||0); if(got>=25)continue;
    const span=Math.max(1,P.until-P.d), pace=25*clamp((G.day-P.d+1)/span,0,1); if(got>=pace)continue;
    let bp=null,bs=-1e9; for(const pos of ORDER){ const x=ln[pos]; if(!x||x.id===q.id)continue; if(pos==='C'&&q.pos!=='C')continue; if(x.promise&&x.promise.until>=G.day&&(x.promise.tid??x.team)===tid)continue; const v=sc(q,pos)-sc(x,pos); if(v>bs){bs=v;bp=pos;} }
    if(!bp)continue; used.delete(ln[bp].id); ln[bp]=q; used.add(q.id); } }
function entryLimit(){ const per=period(); if(per==='post')return ENTRY_BASE+1; if(per!=='season')return ENTRY_BASE; const agY=typeof NT_EV!=='undefined'&&NT_EV.ag.yr(G.year), ag=agY&&G.cal&&G.cal.asg&&G.day>G.cal.asg?1:0; return ENTRY_BASE+ag+(G.day>=(agY?KD(8,25):KD(9,1))?ENTRY_EXP-ag:0); } /* 확대 엔트리: 평년 9월 1일 5명, 아시안게임 해는 8월 25일 4명(최대 34명, KBO 2026 제3차 실행위원회) */ /* 포스트시즌 30명(KBO 2026), AG 해 후반기 30명이면 확대 뒤 34명 */ /* KBO 2026: 아시안게임 해에는 올스타 휴식기 뒤 30명(대표 차출 대비), 8월 25일부터 4명 확대 */
function entryOn(){ if(!G.cal||G.entryY!==G.year)return false; const per=period(); return per==='season'||per==='post'||(per==='pre'&&G.day>=G.cal.open-1); }
function actOf(tid){ const ps=playersOf(tid).filter(p=>psOk(p)); return entryOn()?ps.filter(p=>p.e1):ps.filter(p=>!p.ys&&!(p.isP&&rpPlanOf(tid,p)==='sp2')); } /* 포스트시즌 자격 없는 선수는 라인업·마운드에 오르지 않는다(검수 11-07) */
/* 포스트시즌 출전 자격: 등록 마감(8월 15일) 뒤 데려온 선수는 그해 포스트시즌에 뛸 수 없다 */
const psOk=p=>!(period()==='post'&&p.acq&&p.acq.tid===p.team&&p.acq.y===G.year&&p.acq.k!=='fd'&&p.acq.k!=='draft'&&p.acq.d>foreignDL());
const entryEligible=(p,day=G.day)=>psOk(p)&&!p.ys&&!(p.isP&&rpPlanOf(p.team,p)==='sp2')&&healthyAt(p,day)&&!(p.joinY>G.year)&&(p.e1||p.downDay==null||day-p.downDay>=10);
const canUp=p=>!p.e1&&!isAway(p)&&entryEligible(p);
/* 성적 보기(11-12, AI도 유저처럼 1·2군을 성적으로 돌린다): 감독은 능력치만이 아니라 올해 기록도 본다.
   11-12 첫 판(2군 호성적 +2.5·1군 부진 -2 고정)은 작은 표본에 크게 흔들려 껐다. 안정화(11-14): 표본만큼만 믿는 보조 기준으로 다시 켠다.
   기록이 리그 평균에서 벗어난 정도 × 표본 비중(타석/(타석+150), 아웃/(아웃+120))이라 60타석 호성적은 1점 안팎, 시즌 내내 압도해도 +1.5까지.
   1군 부진은 -1까지만. 주간 교체 문턱(2.5)을 기록만으로는 넘기 어려워 능력 차가 작을 때 결정을 가른다. 모든 구단 같은 식 */
const EP_LG={'퓨처스':{ops:.765,era:4.8},'1군':{ops:.76,era:4.65}};
function entryPerfOf(p,h,lv){ if(!h)return 0; const L=EP_LG[lv];
  if(p.isP){ const n=h.outs||0; if(n<(lv==='1군'?45:24))return 0; return (L.era-pRate(h).era)/1.7*n/(n+120); }
  const n=h.pa||0; if(n<(lv==='1군'?60:30))return 0; return (bRate(h).ops-L.ops)/.12*n/(n+150); }
function entryPerf(tid,p){ if(period()!=='season')return 0; try{ if(!p.e1)return clamp(entryPerfOf(p,seasonTotalT(p,G.year,'퓨처스',tid),'퓨처스')*1.5,-.75,1.5);
  return clamp(entryPerfOf(p,seasonTotalT(p,G.year,'1군',tid),'1군')*1.2,-1,0); }catch(e){ return 0; } }
/* 확대 엔트리 첫 기회(11-17 드래프트 보정): 실제 KBO는 지명 선수 3분의 2가 1군 무대를 밟는다.
   - KCI 논문 "신인 드래프트 이후 프로야구선수의 1군 지위 성취가능성과 프로 지위 유지가능성 분석": 2010~2013 지명 320명 8년 추적, 66%가 1군 경험
   - yagoonara.com 드래프트 정리(확인 못 함): 2010~2020 지명 952명 중 607명(63.8%) 1군 데뷔, 1라운드 103명 중 98명(95.1%)
   - 한겨레 김양희 칼럼(2021): 2020 지명 110명 중 46명이 약 1.7시즌 안에 1군, 2019 지명은 47명
   게임은 1군 등록이 능력순이라 하위 지명은 1군을 거의 못 밟았다(지명 전체 약 32%). 확대 엔트리(9월) 동안 1군 경험이 없는 젊은 선수(지명·입단 6년 안, 26세 이하)에게
   1군 자리 DEBUT_N개를 먼저 준다(entryManage). 1군에 한 번 서면 다음 후보와 바꾼다. 주전·선발·필승조·포수 2명은 건드리지 않는다. 모든 구단 같은 식.
   (기용 점수에 가산 8을 더하는 첫 판은 2군 하위권과 차이가 커서 9월 1군 경험이 구단당 한 해 1명 늘어나는 데 그쳤다) */
const DEBUT_N=ENTRY_EXP; /* 확대 엔트리 인원만큼(KBO 9월 확대 5명) */
const debutOn=()=>period()==='season'&&entryLimit()>=ENTRY_BASE+ENTRY_EXP;
function debutDue(p){ if(p.d1g||p.foreign||p.age>26||p.ys)return false; const y0=p.draft?p.draft.y:p.tryS?p.tryS.y:p.joinY; if(y0==null||G.year-y0>6)return false;
  if((p.hist||[]).some(h=>h.lvl==='1군'&&(h.g||0)>0)){ p.d1g=1; return false; } return true; }
function entryVal(tid,p,lean){ const f=p.sf&&p.sf.y===G.year?(p.sf.v+(p.sf.m||0))*.6:0; const yb=tid===G.user&&p.age<=24&&mplOn('youth')&&!p.e1&&(()=>{ const h=seasonTotalT(p,G.year,'퓨처스',tid); /* 이 구단 퓨처스 기록만(검수 11-09zx) */ return h&&(p.isP?h.outs>=30&&pRate(h).era<=3.8:h.pa>=40&&bRate(h).ops>=.76); })()?3:0; return yb+entryPerf(tid,p)+(p.isP?(isSPr(p)?spV(p)+2:penV(p)):offV(p)*(1-mgrDefW(tid)*.74)+p.r.def*mgrDefW(tid)*.74)+polBonus(tid,p,lean)+(p.roleProm&&rpromK(tid,p)?30:0)+f-(p.fat||0)/25 }
function setEntry(tid){ for(const p of playersOf(tid))p.e1=false; const lean=teamLean(tid);
  const ps=playersOf(tid).filter(p=>!p.ys&&healthy(p)&&psOk(p)&&!(p.joinY>G.year)&&!(p.isP&&rpPlanOf(tid,p)==='sp2')); const v=p=>entryVal(tid,p,lean); /* 개막 엔트리도 등록 가능 선수만(검수 11-07) */
  const bats=ps.filter(p=>!p.isP).sort((a,b)=>v(b)-v(a)), pits=ps.filter(p=>p.isP);
  const sp=[...pits].sort((a,b)=>(spV(b)+roleBias(tid,b)+roleKeepSP(b))-(spV(a)+roleBias(tid,a)+roleKeepSP(a))).slice(0,5);
  const rp=pits.filter(p=>!sp.includes(p)).sort((a,b)=>v(b)-v(a)).slice(0,10);
  const ln=makeLineupFrom(tid,bats); const st=new Set(Object.values(ln).map(p=>p.id));
  const bench=bats.filter(p=>!st.has(p.id)); const c=bench.find(p=>p.pos==='C');
  const bsel=(c?[c]:[]).concat(bench.filter(p=>p!==c)).slice(0,5);
  [...Object.values(ln),...bsel,...sp,...rp].forEach(p=>{p.e1=true;p.upDay=G.day;});
  entryManage(tid,false,true); }
/* 엔트리 사유에 붙일 2군 기록 한 줄 */
function futLn(p){ const h=seasonTotal(p,G.year,'퓨처스'); if(!h)return ''; return p.isP?(h.outs>=9?` · 2군 ERA ${pRate(h).era.toFixed(2)}`:''):(h.pa>=15?` · 2군 ${h.pa}타석 OPS ${fmt3(bRate(h).ops)}`:''); }
const isC=p=>!p.isP&&p.pos==='C', cN=L=>L.filter(p=>isC(p)&&healthy(p)).length; /* 포수 보호는 뛸 수 있는 포수만 센다(검수 11-09zh) */
/* 포수가 아닌 선수를 올리려고 1군 포수를 2명 아래로 내리지 않는다(자동 등록·단장 콜업 공통, 검수 11-09) */
const cProt=(x,c,L)=>isC(x)&&!isC(c)&&cN(L)<=2;
function entryManage(tid,weekly,quiet){ if(!entryOn())return; const lim=entryLimit(); const lean=teamLean(tid); const VM=[new Map(),new Map()]; const v=p=>{ const M=VM[p.e1?1:0]; let x=M.get(p.id); if(x===undefined){ x=entryVal(tid,p,lean); M.set(p.id,x); } return x; }; /* 성능: 기용 점수는 한 번 호출 안에서 선수·1군 여부마다 한 번만(entryVal이 1군 여부를 본다) */ const PS=playersOf(tid); /* 이 안에서는 소속이 바뀌지 않는다: 명단은 한 번만 */ const moves=[];
  for(const p of PS)if(p.e1&&(p.injOut>3||p.ys||p.hold||p.susp>G.day||p.boy>G.day||(p.isP&&rpPlanOf(tid,p)==='sp2')||!psOk(p))){ p.e1=false; p.downDay=G.day; moves.push(`${p.name} 말소(${p.injOut>3?'부상':p.ys?'육성':p.boy>G.day?'훈련 불참':p.hold?'연봉 미계약':p.susp>G.day?'출장 정지':!psOk(p)?'포스트시즌 등록 마감 뒤 영입':'2군 선발 수업'})`); } /* 미계약·출장 정지 선수가 1군 자리를 차지하지 않게(검수 11-07) */
  let ent=PS.filter(p=>p.e1);
  if(ent.length>lim){ const d=depth(tid); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); ent.filter(p=>!core.has(p.id)&&!(isC(p)&&cN(ent)<=2)).sort((a,b)=>v(a)-v(b)).slice(0,ent.length-lim).forEach(p=>{p.e1=false;p.downDay=G.day;moves.push(`${p.name} 말소(엔트리 인원 초과 · 기용 순위 낮음)`);}); ent=PS.filter(p=>p.e1); }
  /* 건강한 야수가 9명이 안 되면 다친 야수를 2군의 건강한 야수로 바꾼다: 8인 타순 경기 방지(검수 11-09zh) */
  for(let g=0;g<9&&ent.filter(p=>!p.isP&&healthy(p)).length<9;g++){ const c=PS.filter(p=>canUp(p)&&!p.isP).sort((a,b)=>v(b)-v(a))[0]; if(!c)break;
    if(ent.length>=lim){ const d=depth(tid); const out=ent.filter(p=>!p.isP&&!healthy(p)).sort((a,b)=>v(a)-v(b))[0]||ent.filter(p=>p.isP&&!d.sp.includes(p)&&!d.pen.slice(0,4).includes(p)).sort((a,b)=>v(a)-v(b))[0]; if(!out)break; out.e1=false; out.downDay=G.day; ent=ent.filter(p=>p!==out); moves.push(`${out.name} 말소(${healthy(out)?'야수 자리 확보':'부상'})`); }
    c.e1=true; c.upDay=G.day; ent.push(c); moves.push(`${c.name} 콜업(건강한 야수 9명 채우기${futLn(c)})`); }
  while(ent.length<lim){ const np=ent.filter(p=>p.isP).length; const needP=np<Math.round(lim*.5); const pool=PS.filter(canUp);
    const c=pool.filter(p=>p.isP===needP).sort((a,b)=>v(b)-v(a))[0]||pool.sort((a,b)=>v(b)-v(a))[0]; if(!c)break; c.e1=true; c.upDay=G.day; ent.push(c); moves.push(`${c.name} 콜업(${c.isP?'투수':'야수'} 빈자리 보충${futLn(c)})`); }
  if(debutOn()){ const due=PS.filter(p=>p.e1&&debutDue(p)).length; if(due<DEBUT_N){ const d=depth(tid); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); /* 확대 엔트리 첫 기회(위 DEBUT_N) */
      const C=PS.filter(p=>canUp(p)&&debutDue(p)).sort((a,b)=>v(b)-v(a)).slice(0,DEBUT_N-due);
      for(const c of C){ ent=PS.filter(p=>p.e1); const out=ent.filter(p=>!core.has(p.id)&&!debutDue(p)&&!cProt(p,c,ent)&&G.day-(p.upDay||0)>=3).sort((a,b)=>v(a)-v(b))[0]; if(!out)break;
        out.e1=false; out.downDay=G.day; c.e1=true; c.upDay=G.day; moves.push(`${out.name} 말소 · ${c.name} 콜업(확대 엔트리 첫 1군 기회${futLn(c)})`); } ent=PS.filter(p=>p.e1); } }
  if(weekly){ const d=depth(tid); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id));
    for(const isP of [false,true]){ const out=ent.filter(p=>p.isP===isP&&!core.has(p.id)&&G.day-(p.upDay||0)>=7&&!(isC(p)&&cN(ent)<=2)&&!(debutOn()&&debutDue(p))).sort((a,b)=>v(a)-v(b))[0]; const inn=PS.filter(p=>canUp(p)&&p.isP===isP).sort((a,b)=>v(b)-v(a))[0];
      if(out&&inn&&v(inn)>v(out)+2.5){ out.e1=false; out.downDay=G.day; inn.e1=true; inn.upDay=G.day; moves.push(`${out.name} 말소(주전·필승조 밖, 최근 1주 넘게 쓰임 적음) · ${inn.name} 콜업(2군에서 더 나은 선수${futLn(inn)})`); } } }
  /* 포수는 1군에 2명 이상: 주전이 지치면 쉬게 할 백업이 있어야 한다(카페 피드백 11-08: 백업 포수를 2군으로 내려 지친 주전이 계속 나옴) */
  for(let g=0;g<3&&(ent=PS.filter(p=>p.e1)).filter(p=>isC(p)&&healthy(p)).length<2;g++){ /* 다친 포수는 세지 않는다(검수 11-09t) */ const c=PS.filter(p=>canUp(p)&&isC(p)).sort((a,b)=>v(b)-v(a))[0]; if(!c)break;
    if(ent.length>=lim){ const d=depth(tid); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); const out=ent.filter(p=>isC(p)&&!healthy(p)).sort((a,b)=>v(a)-v(b))[0]||ent.filter(p=>!p.isP&&!isC(p)&&!core.has(p.id)).sort((a,b)=>v(a)-v(b))[0]||ent.filter(p=>!core.has(p.id)&&!isC(p)).sort((a,b)=>v(a)-v(b))[0]; if(!out)break; out.e1=false; out.downDay=G.day; moves.push(`${out.name} 말소(백업 포수 자리)`); }
    c.e1=true; c.upDay=G.day; moves.push(`${c.name} 콜업(1군 포수 2명 유지${futLn(c)})`); }
  /* AI 구단은 건강한 1군 야수 9명 유지: 단기 부상 야수가 자리를 차지해 8명 타순으로 치르지 않게 2군에서 올린다(검수 11-09zn) */
  if(tid!==G.user)for(let g=0;g<9&&(ent=PS.filter(p=>p.e1)).filter(p=>!p.isP&&healthy(p)).length<9;g++){ const c=PS.filter(p=>canUp(p)&&!p.isP).sort((a,b)=>v(b)-v(a))[0]; if(!c)break;
    if(ent.length>=lim){ const d=depth(tid); const core=new Set([...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); const out=ent.filter(p=>!p.isP&&!healthy(p)).sort((a,b)=>v(a)-v(b))[0]||ent.filter(p=>p.isP&&!core.has(p.id)).sort((a,b)=>v(a)-v(b))[0]; if(!out)break; out.e1=false; out.downDay=G.day; }
    c.e1=true; c.upDay=G.day; }
  /* 사전검사가 센 콜업 가능 투수를 실제 엔트리에도 채운다. 가득 찬 엔트리의 단기 부상·야수 여분 때문에 7명으로 치르지 않게 한다(검수 11-18 #450~451). */
  for(let g=0;g<8&&(ent=PS.filter(p=>p.e1)).filter(p=>p.isP&&healthy(p)).length<8;g++){ const c=PS.filter(p=>canUp(p)&&p.isP).sort((a,b)=>v(b)-v(a))[0]; if(!c)break;
    if(ent.length>=lim){ const d=depth(tid), core=new Set(d.start.map(p=>p.id)); const out=ent.filter(p=>!healthy(p)).sort((a,b)=>v(a)-v(b))[0]||ent.filter(p=>!p.isP&&!core.has(p.id)&&!cProt(p,c,ent)).sort((a,b)=>v(a)-v(b))[0]; if(!out)break; out.e1=false; out.downDay=G.day; moves.push(`${out.name} 말소(건강한 투수 자리)`); }
    c.e1=true; c.upDay=G.day; moves.push(`${c.name} 콜업(건강한 투수 8명 채우기${futLn(c)})`); }
  if(tid===G.user&&moves.length&&!quiet)note('엔트리',`감독이 1군 엔트리를 조정했습니다: ${moves.join(', ')}.`); }
/* 돌아온 주축을 다시 1군에(사용자 피드백 11-05: 대표팀에서 돌아온 핵심 3명이 한국시리즈 1차전까지 2군에 남음).
 후보마다 같은 투수·야수 중 기용 순위가 가장 낮은 1군 선수보다 확실히 나으면 바꾼다. 자리가 비면 그냥 올린다 */
function entryUpgrade(tid,cands,why){ if(!entryOn())return []; const lean=teamLean(tid), v=p=>entryVal(tid,p,lean), lim=entryLimit(), moves=[];
  for(const c of cands.filter(p=>p&&p.team===tid&&canUp(p)) /* 10일 재등록 규칙·입단 예정·차출 중도 같은 기준(검수 11-07) */ /* 2군 선발 수업 투수는 올리지 않는다(바로 말소됨) */.sort((a,b)=>v(b)-v(a))){ const ent=playersOf(tid).filter(p=>p.e1);
    if(ent.length<lim){ c.e1=true; c.upDay=G.day; moves.push(`${c.name} 등록`); continue; }
    const out=ent.filter(p=>p.isP===c.isP&&!cands.includes(p)&&!cProt(p,c,ent)).sort((a,b)=>(isC(c)?Number(isC(b)&&!healthy(b))-Number(isC(a)&&!healthy(a)):0)||v(a)-v(b))[0]; if(out&&(!healthy(out)||v(c)>v(out)+1)){ out.e1=false; out.downDay=G.day; c.e1=true; c.upDay=G.day; moves.push(`${c.name} 등록 · ${out.name} 말소`); } }
  if(tid===G.user&&moves.length)note('엔트리',`감독이 1군 엔트리를 조정했습니다${why?`(${why})`:''}: ${moves.join(', ')}.`); return moves; }
/* 1군에 올릴 수 없는 사유(canUp이 거짓일 때). 엔트리 관리 화면이 버튼 옆에 같은 문구를 보여 준다(카페 피드백 11-09v) */
function upWhy(p){ return p.isP&&rpPlanOf(p.team,p)==='sp2'?'2군 선발 수업 중입니다. 보직을 먼저 바꿔 주세요.':p.ys?'육성선수는 정식 선수로 등록해야 1군에 올릴 수 있습니다.':p.susp>G.day?`출장 정지 중입니다(${dmd(p.susp)}부터 출장 가능).`:p.hold?'연봉 미계약 상태입니다. 계약을 먼저 마쳐야 합니다.':p.boy>G.day?`훈련 불참 중입니다(${dmd(p.boy)}부터 복귀 가능).`:p.fLeave>G.day?`귀국 휴가·결장 요청 중입니다(${dmd(p.fLeave)}부터 복귀 가능).`:p.injOut>0?'부상 중입니다.':p.frehab?'부상 대체 외국인을 둔 재활 명단에 있습니다.':p.e1?'이미 1군에 있습니다.':!psOk(p)?'8월 15일 이후 영입한 선수는 포스트시즌 엔트리에 넣을 수 없습니다.':isAway(p)?'대표팀 차출·군 복무 중입니다.':p.joinY>G.year?'다음 시즌 입단 선수입니다.':p.downDay!=null&&G.day-p.downDay<10?`말소 후 10일이 지나야 다시 등록할 수 있습니다(${dmd(p.downDay+10)}부터).`:'지금은 등록할 수 없습니다.'; }
/* 직접 건의·감독 메일·회의가 실행 직전 같은 인원 보호를 사용한다. */
function entryDownWhy(p,tid=G.user){ if(!p||p.team!==tid)return '대상이 아닙니다.'; if(!p.e1)return '이미 1군에 없습니다.';
  if(!p.isP&&healthy(p)&&playersOf(tid).filter(x=>x.e1&&!x.isP&&healthy(x)).length<=9&&!playersOf(tid).some(x=>!x.isP&&canUp(x)))return '1군의 건강한 야수가 9명뿐이고 2군에서 바로 올릴 야수가 없어(재등록 대기·부상) 말소하면 타순을 채울 수 없습니다.';return ''; }
function entryUpPlan(p,tid=G.user,cross=false){ if(!p||p.team!==tid)return {why:'선수가 우리 구단에 없습니다.'};if(!canUp(p))return {why:upWhy(p)};const ent=playersOf(tid).filter(x=>x.e1);if(ent.length<entryLimit())return {out:null};
  const d=depth(tid),core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)),lean=teamLean(tid);
  const out=ent.find(x=>isC(p)&&isC(x)&&!healthy(x))||ent.filter(x=>x.isP===p.isP&&!core.has(x.id)&&!cProt(x,p,ent)).sort((a,b)=>ovr(a)-ovr(b))[0]||(cross?ent.find(x=>!core.has(x.id)&&!cProt(x,p,ent)):null);
  return out?{out}:{why:`1군 엔트리에 자리가 없어 ${p.name}을(를) 올리지 못했습니다(내릴 비핵심 선수가 없음).`}; }
function reqEntry(id,up){ const p=G.players[id]; const m=G.mgr[G.user]; if(!p||p.team!==G.user)return '대상이 아닙니다.'; if(!entryOn())return '시즌 중에만 엔트리를 바꿀 수 있습니다.'; if(!m)return '감독이 없습니다.';
  if(up&&!canUp(p))return upWhy(p);
  if(!up){const why=entryDownWhy(p);if(why)return why;} /* 검수 11-09zx */
  if(!up&&mgrOutReq(p)){ mgrOutGrant(p,'down'); p.e1=false; p.downDay=G.day; entryManage(G.user,false,true); addLog(`${p.name}이(가) 단장 요청으로 1군에서 말소되었습니다.`); return `${m.name} 감독이 정리를 요청했던 선수라 바로 받아들였습니다. ${p.name} 말소(${dmd(G.day+10)}부터 재등록 가능). 감독 관계 조금 개선.`; } /* 감독 스스로 정리해 달라던 선수를 '필요한 선수'라며 거절하지 않게(카페 11-08) */
  { const br=mplBreakListen(`${p.name} ${up?'콜업':'말소'}`); if(br){ m.rel=clamp(m.rel,0,100); return br; } }
  mgrFix(m); const a=clamp(.78-(m.ego-50)/70+(m.rel-60)/120+(mplOn('listen')?.3:0),.15,mplOn('listen')?.98:.95); /* 영입 면담에서 '단장 건의 존중'을 약속받았으면 거의 받아들인다 */ const ok=hn('req'+G.day,id)>-1.2&&R()<a;
  if(!ok){ m.rel=clamp(m.rel-2,0,100); mail('감독실',`${p.name} ${up?'콜업':'말소'} 요청 거절`,`${m.name} 감독: ${up?`${p.name}은(는) 아직 1군에 올릴 때가 아니라고 봅니다.`:`${p.name}은(는) 지금 팀에 필요한 선수입니다.`} 엔트리는 제가 판단하겠습니다.`,{kind:'감독'}); return `${m.name} 감독이 요청을 받아들이지 않았습니다.`; }
  if(up){ const ent=playersOf(G.user).filter(x=>x.e1); if(ent.length>=entryLimit()){ const d=depth(G.user); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); const lean=teamLean(G.user); const out=ent.filter(x=>isC(p)&&isC(x)&&!healthy(x))[0]||ent.filter(x=>x.isP===p.isP&&!core.has(x.id)&&!cProt(x,p,ent)).sort((a,b)=>entryVal(G.user,a,lean)-entryVal(G.user,b,lean))[0]||ent.filter(x=>!core.has(x.id)&&!cProt(x,p,ent))[0]; if(out){ out.e1=false; out.downDay=G.day; } }
    p.e1=true; p.upDay=G.day; addLog(`${p.name}이(가) 단장 요청으로 1군에 등록되었습니다.`); return `${m.name} 감독이 받아들였습니다. ${p.name} 1군 등록.`; }
  p.e1=false; p.downDay=G.day; entryManage(G.user,false,true); addLog(`${p.name}이(가) 단장 요청으로 1군에서 말소되었습니다.`); return `${m.name} 감독이 받아들였습니다. ${p.name} 말소(${dmd(G.day+10)}부터 재등록 가능).`; }
/* 육성선수 전환: 연봉 1억 이하·FA·다년계약(다음 시즌 계약 포함) 아님. 깎인 연봉은 전환일부터만(그 전 기간은 원래 연봉, payYear의 ysAdj) */
const ysOk=p=>!p.foreign&&!p.ys&&!p.faC&&!p.ext&&!p.extNext&&p.sal<=100;
function ysSet(p){ { const C=G.contract; if(C&&!C.done&&(C.ended||[]).includes(p.id)){ C.ended=C.ended.filter(x=>x!==p.id); if(C.neg)delete C.neg[p.id]; delete p.newSal; } } /* 연봉 협상 중 육성 전환: 협상은 끝나고 육성 연봉으로(확정이 합의 연봉으로 덮어쓰지 않게, 검수 11-09x) */ delete p.hold; /* 미계약 협상도 육성 연봉으로 끝난다(검수 11-09zx) */ if(p.e1)p.downDay=G.day; p.ys=true; p.e1=false; const s0=p.sal; p.ysSal0=s0; p.sal=Math.min(s0,MIN_SAL); if(s0>p.sal)p.ysCut={y:G.year,d:G.day,s0,t:p.team,low:p.sal}; }
/* 연봉 산정 기간(정규시즌, payWin) 중 [a,b) 비율: 이적·복무 일할과 같은 기준(검수 11-08: 달력 1년으로 나눔) */
function ysWinF(y,a,b,p){ const [w0,w1]=payWin(y); const s=Math.max(a,w0), e=Math.min(b,w1); if(e<=s)return 0; const m=p&&p.mil, mf=m&&(m.from??m.pf), mu=m&&(m.until||m.pu), sv=mf==null||!mu?0:Math.max(0,Math.min(e,mu)-Math.max(s,mf)); return clamp((e-s-sv)/(w1-w0),0,1); } /* 군 복무한 날은 원래 연봉도 0이라 보정에서 뺀다(payFrac와 같은 기준, 검수 11-09x) */
function ysAdj(p,y,tid){ tid=tid??p.team; let v=0; const c=p.ysCut; if(c&&c.y===y&&(c.t??p.team)===tid&&(p.ys||p.team!==tid))v+=(c.s0-(c.low??p.sal))*ysWinF(y,-1e9,c.d,p); /* 방출돼도 전환 전 기간은 원래 연봉(검수 11-08) */
  for(const g of (p.ysGap||[]))if(g.y===y&&(g.t??tid)===tid)v-=(g.s0-g.s)*ysWinF(y,g.d0,g.d1,p); /* 육성으로 있던 기간은 깎인 연봉(정식 복귀 뒤에도, 검수 11-08) */ return v; }
function toYS(id){ const p=G.players[id]; if(!p||p.team!==G.user||p.foreign||p.ys)return '대상이 아닙니다.'; if(!ysOk(p))return '연봉 1억 원 이하이고 FA·다년계약이 아닌 선수만 육성선수로 돌릴 수 있습니다.'; if(ysN(G.user)>=YS_MAX)return `육성선수는 ${YS_MAX}명까지입니다.`;
  ysSet(p); /* 1군에서 빠지는 모든 길은 같은 말소 규칙(10일 뒤 재등록) */ addLog(`${p.name}을(를) 육성선수로 돌렸습니다. 정식 로스터에서 빠집니다.`); return ''; }
function ysUnset(p){ p.ys=false; if(p.ysCut){ const c=p.ysCut; p.ysGap=(p.ysGap||[]).filter(g=>g.y>=G.year-1); p.ysGap.push({y:G.year,d0:c.y===G.year?c.d:dnum(G.year,1,1),d1:G.day,s0:p.ysSal0??c.s0,s:p.sal,t:p.team}); } delete p.ysCut; if(p.ysSal0!=null){ p.sal=Math.max(p.sal,p.ysSal0); delete p.ysSal0; } /* 육성으로 돌릴 때 깎인 연봉을 되돌린다 */ }
/* fromYS와 같은 조건(5월 1일부터, 포스트시즌·결산 전 아님, 정원)으로 AI도 육성선수를 정식으로 올린다(11-17 드래프트 보정).
   예전에는 AI 구단에 이 길이 없어 미지명·트라이아웃 육성선수가 AI 구단에서는 1군을 밟을 수 없었다(사람 단장만 fromYS).
   주 1회, 가장 나은 육성선수가 정식 2군 하위(정식 국내 선수 keepScore 하위 10명 평균)보다 3 이상 나으면 올린다. 정원이 차 있으면 그중 가장 낮은 선수를 육성으로 돌릴 수 있을 때만(toYS와 같은 조건) 맞바꾼다 */
function aiYsUp(tid){ if(tid===ME()||period()!=='season'||G.day<KD(5,1)||preSettle())return 0;
  const c=ysList(tid).filter(p=>!p.foreign&&healthy(p)&&!(p.joinY>G.year)).sort((a,b)=>keepScore(b)-keepScore(a))[0]; if(!c)return 0;
  const reg=domestic(tid).filter(p=>!p.ys&&!p.e1&&!(p.joinY>G.year)&&!milServing(p)).sort((a,b)=>keepScore(a)-keepScore(b)); if(reg.length<10)return 0;
  const bar=reg.slice(0,10).reduce((a,p)=>a+keepScore(p),0)/10; if(keepScore(c)<bar+3)return 0;
  if(rosterN(tid)>=ROSTER_MAX){ const w=reg.find(p=>ysOk(p)); if(!w||keepScore(c)<keepScore(w)+3)return 0; ysSet(w); }
  if(rosterN(tid)>=ROSTER_MAX)return 0; ysUnset(c); return 1; }
function fromYS(id){ const p=G.players[id]; if(!p||!p.ys||p.team!==G.user||G.unemp)return '대상이 아닙니다.'; if(period()==='season'&&G.day<KD(5,1))return '육성선수는 5월 1일부터 정식 선수로 등록할 수 있습니다.'; if(period()==='post'||preSettle())return '포스트시즌과 결산 전에는 정식 선수로 새로 등록할 수 없습니다.'; const d=milServing(p)?p.mil.until:G.day; if(milRosterAt(G.user,d)>=ROSTER_MAX||(!milOn(p,rosterOpenDay())&&rosterProj(G.user)>=ROSTER_MAX))return `정식 로스터가 전역·합류 예정 인원을 포함해 ${ROSTER_MAX}명으로 꽉 찼습니다.`;
  ysUnset(p); addLog(`${p.name}을(를) 정식 선수로 등록했습니다.`); return ''; }
function makeLineupFrom(tid,bats){ const save=G.entryY; G.entryY=-1; const ln=makeLineup(tid,bats); G.entryY=save; return ln; }
function depth(tid){
  const ps=playersOf(tid); const act=actOf(tid); const actIds=new Set(act.map(p=>p.id));
  const ln=makeLineup(tid); const startIds=new Set(Object.values(ln).map(p=>p.id));
  const lean=teamLean(tid); const PB=new Map(); const pb=p=>{ let v=PB.get(p.id); if(v==null){ v=polBonus(tid,p,lean); PB.set(p.id,v); } return v; };
  const by=(arr,f)=>arr.map(p=>[f(p),p]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
  const bat=by(act.filter(p=>!p.isP&&healthy(p)&&!startIds.has(p.id)),p=>ovr(p)+pb(p));
  const futB0=by(ps.filter(p=>!p.isP&&healthy(p)&&!actIds.has(p.id)),ovr), futP0=by(ps.filter(p=>p.isP&&healthy(p)&&!actIds.has(p.id)),ovr);
  const pit=act.filter(p=>p.isP&&healthy(p));
  const spF=p=>spV(p)+roleBias(tid,p)+roleKeepSP(p)+pb(p)+rpB(tid,p,'SP')-rpB(tid,p,'RP'), sp=[...by(pit.filter(p=>rpPlanOf(tid,p)!=='rp'),spF),...by(pit.filter(p=>rpPlanOf(tid,p)==='rp'),spF)].slice(0,5); /* 계투로 정한 투수는 선발 자리가 남을 때만(검수 11-08: 계투 요청을 받아들였는데 선발 등판) */ /* 보직 저장은 roleSync에서만: 화면 조회가 보직·부하 한도를 바꾸지 않게(검수 11-09zh) */
  const rest=penArrange(tid,by(pit.filter(p=>!sp.includes(p)),p=>penV(p)+roleKeepPen(p)+pb(p)*.6+rpB(tid,p,'RP'))); /* 단장이 정한 불펜 역할(마무리·필승조·추격조·롱릴리프) 순서 반영 */ /* 감독이 받아들인 역할 약속(61_contract_terms mgrUseAsk) */
  const start=ORDER.filter(k=>ln[k]).map(k=>ln[k]);
  const on=entryOn();
  return {ln,start,bench:on?bat:bat.slice(0,5),futB:on?futB0:bat.slice(5).concat(futB0),sp,pen:on?rest:rest.slice(0,7),futP:on?futP0:rest.slice(7).concat(futP0),inj:ps.filter(p=>!healthy(p))};
}
function roleSync(tid){ const d=depth(tid); for(const p of actOf(tid))if(p.isP&&healthy(p))p.role=d.sp.includes(p)?'SP':'RP'; return d; }
/* 전력 예상용 전력(사용자 11-11): 시즌 준비 기간에는 AI 구단이 외국인을 아직 다 채우지 않아 우리 예상 순위가 높게 나왔다.
   정규시즌·포스트시즌이 아니면 일반 외국인(fMaxYB)·아시아쿼터(1명) 빈자리를 채운다고 보고 한 자리마다 FSLOT_V를 더한다.
   FSLOT_V: 개막일 구단별 '외국인 4명 있을 때 - 뺐을 때' 전력 차이 평균 약 1.8(0.8~2.9, 시드 3개 30구단) ÷ 4 */
const FSLOT_V=.45;
const FNEW_W=.5; /* KBO 실적 없는 외국인은 평균 외국인 한 자리(FSLOT_V)와의 차이를 절반만 센다(커뮤니티 11-14: 10위 전력이 고오버롤 용병만으로 예상 4위가 되어 경질 압박). 실적 있는 외국인은 그대로 */
function projRating(tid,open){ const per=period(); if(!open&&(per==='season'||per==='post'))return teamRating(tid); /* open: 개막일 예상·기대 승률(08_season_events). 렌즈 없이 지금 명단, 외국인 보정만 */
  let mx=3; try{ mx=fMaxYB(tid,per==='off'&&G.last&&G.last.y>=G.year?G.year+1:G.year); }catch(e){}
  const rate=fx=>{ let r,F; PROJ_LENS=open?0:1; PROJ_FX=fx; try{ r=teamRating(tid); F=foreignOf(tid); } finally { PROJ_LENS=0; PROJ_FX=0; } /* 개막 전 예상은 대표팀 차출·짧은 부상으로 잠시 빠진 선수까지 넣는다. 외국인 빈자리도 같은 기준으로 센다(내년 합류 외국인을 전력에 넣고 빈자리로도 채우면 두 번 셈) */
    const yb=F.filter(x=>x.foreign==='용병').length, as=F.filter(x=>x.foreign==='아시아').length; return r+(Math.max(0,mx-yb)+Math.max(0,1-as))*FSLOT_V; };
  const full=rate(0); let any=false; PROJ_LENS=open?0:1; try{ any=foreignOf(tid).some(fUnproven); } finally { PROJ_LENS=0; } if(!any)return full;
  const empty=rate(1); return empty+(full-empty)*FNEW_W; } /* empty: 새 외국인 자리를 평균(FSLOT_V)으로 본 전력 */
function teamRating(tid){
  const d=depth(tid);
  const off=avg(d.start.map(offV))*(Math.min(9,d.start.length)/9);
  const def=avg(FIELD.filter(k=>d.ln[k]).map(k=>defAt(d.ln[k],k)));
  const sp=avg(d.sp.map(spV))*(Math.min(5,d.sp.length)/5), pen=avg(d.pen.map(penV));
  return off*.4+(sp*.65+pen*.35)*.45+def*.15;
}

