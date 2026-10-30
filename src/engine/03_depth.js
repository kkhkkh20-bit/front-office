/* ===== 포지션 배치와 뎁스 ===== */
/* 서브 포지션: 주 포지션별로 함께 연습해 온 자리 (선수마다 고정) */
const SUBMAP={C:[['1B',.2]],'1B':[['LF',.35],['3B',.3],['RF',.25]],'2B':[['SS',.6],['3B',.45],['1B',.25]],'3B':[['1B',.6],['SS',.3],['2B',.35]],SS:[['2B',.85],['3B',.65]],LF:[['RF',.7],['1B',.35],['CF',.2]],CF:[['LF',.85],['RF',.8]],RF:[['LF',.7],['1B',.3],['CF',.3]]};
const _subC=new Map();
/* 할 수 있는 다른 자리: 숙련도 50 이상(78_positions.js) */
function subsOf(p){ if(p.isP)return []; const E=pexpOf(p); return Object.keys(E).filter(k=>k!==p.pos&&E[k]>=50).sort((a,b)=>E[b]-E[a]); }
function defAt(p,pos){
  if(pos==='DH')return 0; if(p.pos===pos)return p.r.def;
  const e=(pexpOf(p)[pos]||0)/100; return p.r.def-posRaw(p.pos,pos)*versF(p)*(1-e*.85);
}
/* 포지션 감안 가치(타자). 종합 능력(ovr)은 수비를 어느 자리든 같은 무게(0.2)로 센다. 그런데 경기에서는 유격·3루·2루·중견 수비가 실점에 훨씬 크게 작용하고,
   자리마다 그만한 선수가 드문 정도도 다르다. 그래서 값을 매길 때(트레이드·FA·연봉·WAR)는 이 둘을 종합 능력 단위로 바꿔 더한다.
   DWR: 그 자리 수비 1점이 시즌 실점을 몇 점 바꾸는가(엔진 식에서 계산: 인플레이 타구 안타 확률 + 자리별 실책). POS_ADJ: 자리 희소성(600타석당 득점).
   공격 종합 1점은 600타석당 약 1.56점. 자리는 그 선수가 가장 가치 있는 곳(1루·지명은 누구나 갈 수 있다) */
const DWR={SS:1.1,'3B':.84,'2B':.82,CF:.7,C:.67,RF:.47,LF:.43,'1B':.39}, RUN_PER_OVR=1.56;
/* DAVG: 리그 주전의 자리별 평균 수비력(새 게임 5개에서 잰 값). 그 자리 평균보다 잘하면 플러스 */
const DAVG={SS:57.5,'2B':57.4,CF:56.7,C:54.5,'3B':53.8,'1B':48.2,RF:46.3,LF:46.3};
/* 수비 난이도: 같거나 쉬운 자리로는 옮길 수 있다고 본다(유격→3루·1루 쉬움, 1루→유격 안 됨). 포수는 포수만 */
const DSPEC={SS:6,C:6,CF:5,'2B':5,'3B':4,RF:3,LF:2,'1B':1,DH:0};
function posValAt(p,pos){ const d=pos==='DH'?0:(defAt(p,pos)-DAVG[pos])*DWR[pos]; return ovr(p)-(p.r.def-50)*.2+((POS_ADJ[pos]||0)+d)/RUN_PER_OVR; }
const _pvC=new Map();
function posBest(p){ if(!p||p.isP)return {pos:'P',v:p?ovr(p):0}; const k=G.day+':'+p.pos+':'+p.r.def+':'+ovr(p).toFixed(2)+':'+JSON.stringify(p.pexp||'')+':'+(p.trt||''); const c=_pvC.get(p.id); if(c&&c.k===k)return c.b;
  let b={pos:'DH',v:posValAt(p,'DH')}; const lim=DSPEC[p.pos]??1; for(const q of ['C','SS','2B','CF','3B','RF','LF','1B']){ if(q===p.pos||(q!=='C'&&DSPEC[q]<=lim)){ const v=posValAt(p,q); if(v>b.v)b={pos:q,v}; } } if(_pvC.size>4000)_pvC.clear(); _pvC.set(p.id,{k,b}); return b; }
const pvShift=p=>p&&!p.isP?posBest(p).v-ovr(p):0; /* 종합 능력에 더할 포지션 보정(투수 0) */
const posScore=(p,pos)=>{ if(pos==='DH')return offV(p); const w=DWR[pos]!=null?.2+DWR[pos]*.3:.38; return offV(p)*(1-w)+defAt(p,pos)*w; }; /* 수비가 중요한 자리일수록 수비를 더 본다: 유격 .53 · 3루·2루 .45 · 중견 .41 · 포수 .4 · 코너 외야 .33 · 1루 .32 */
const ORDER=['C','SS','CF','2B','3B','RF','LF','1B','DH'];
function makeLineup(tid,pool){
  const bats=(pool||actOf(tid)).filter(p=>!p.isP&&healthy(p));
  const used=new Set(); const ln={};
  const ov={}; const mg=G.mgr[tid]; const promo=p=>p.promise&&tid===G.user&&mg&&mg.disc<62?2:0;
  for(const pos of ORDER){ const id=ov[pos]; const p=id&&G.players[id]; if(p&&p.team===tid&&!p.isP&&healthy(p)&&!used.has(p.id)){ln[pos]=p;used.add(p.id);} }
  /* 감독은 이기는 배치를 찾는다: 공격(시즌 득점) + 그 자리 수비가 막는 실점(자리별 무게 DWR, 감독 수비 성향만큼)이 가장 큰 9명 조합.
     낯선 자리는 숙련도가 낮을수록 꺼린다(fitPen). 포수는 포수·지명 말고는 거의 옮기지 않는다 */
  const fitPen=(p,pos)=>{ if(pos==='DH')return p.pos==='C'?1:0; if(p.pos===pos)return 0; if(p.pos==='C')return 40; const e=(pexpOf(p)[pos]||0)/100; const IF=['2B','SS','3B'], OF=['LF','CF','RF']; const cross=(IF.includes(p.pos)&&OF.includes(pos))||(OF.includes(p.pos)&&IF.includes(pos))||(p.pos==='1B'&&pos!=='DH'); const b=pos==='C'?40:pos==='1B'?3:cross?16:6; return e>=.5?1:b-(b-1)*e/.5; }; /* 같은 무리(내야끼리·외야끼리) 이동은 쉽고, 내야↔외야는 경험 없이는 꺼린다 */
  const lean=teamLean(tid); const pb=p=>polBonus(tid,p,lean); const wD=mgrDefW(tid);
  const open=new Set(ORDER.filter(pos=>!ln[pos]));
  const mf=wD/.38; const SC=new Map(); for(const p of bats){ const o=offV(p)*1.25, ex=promo(p)+pb(p); const m={}; for(const pos of ORDER)m[pos]=(pos==='DH'?o:o+(defAt(p,pos)-DAVG[pos])*DWR[pos]*mf)+ex-fitPen(p,pos); SC.set(p.id,m); }
  while(open.size){ let bp=null,bq=null,bs=-1e9;
    for(const pos of open){ if(pos==='DH'&&open.size>1)continue; for(const p of bats){ if(used.has(p.id))continue; const s=SC.get(p.id)[pos]; if(s>bs){bs=s;bp=pos;bq=p;} } }
    if(!bq)break; ln[bp]=bq; used.add(bq.id); open.delete(bp); }
  /* 한 명씩 정하면 놓치는 배치를 바로잡는다: 두 선수 자리 맞바꾸기, 벤치 선수와 바꾸기를 더 나아지지 않을 때까지(예: 수비 좋은 우익수를 중견으로, 거포 3루수를 1루로) */
  const fixed=new Set(ORDER.filter(pos=>ov[pos]&&ln[pos]&&ln[pos].id===ov[pos])); const sc=(p,pos)=>SC.get(p.id)?SC.get(p.id)[pos]:-1e9;
  for(let it=0;it<6;it++){ let better=false; const P=ORDER.filter(pos=>ln[pos]&&!fixed.has(pos));
    for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){ const a=P[i], b=P[j], x=ln[a], y=ln[b]; if(sc(y,a)+sc(x,b)>sc(x,a)+sc(y,b)+.3){ ln[a]=y; ln[b]=x; better=true; } }
    for(const pos of P){ const x=ln[pos]; for(const q of bats){ if(used.has(q.id))continue; if(sc(q,pos)>sc(x,pos)+.3){ used.delete(x.id); used.add(q.id); ln[pos]=q; better=true; break; } } }
    if(!better)break; }
  return ln;
}
function entryLimit(){ return period()==='season'&&G.day>=KD(8,25)?ENTRY_BASE+ENTRY_EXP:ENTRY_BASE; }
function entryOn(){ if(!G.cal||G.entryY!==G.year)return false; const per=period(); return per==='season'||per==='post'||(per==='pre'&&G.day>=G.cal.open-1); }
function actOf(tid){ const ps=playersOf(tid); return entryOn()?ps.filter(p=>p.e1):ps.filter(p=>!p.ys&&!(p.isP&&rpPlanOf(tid,p)==='sp2')); }
/* 포스트시즌 출전 자격: 등록 마감(8월 15일) 뒤 데려온 선수는 그해 포스트시즌에 뛸 수 없다 */
const psOk=p=>!(period()==='post'&&p.acq&&p.acq.tid===p.team&&p.acq.y===G.year&&p.acq.k!=='fd'&&p.acq.k!=='draft'&&p.acq.d>foreignDL());
const canUp=p=>psOk(p)&&!p.e1&&!p.ys&&!(p.isP&&rpPlanOf(p.team,p)==='sp2')&&!isAway(p)&&healthy(p)&&!(p.joinY>G.year)&&(p.downDay==null||G.day-p.downDay>=10);
function entryVal(tid,p,lean){ const f=p.sf&&p.sf.y===G.year?(p.sf.v+(p.sf.m||0))*.6:0; const yb=tid===G.user&&p.age<=24&&mplOn('youth')&&!p.e1&&(()=>{ const h=seasonTotal(p,G.year,'퓨처스'); return h&&(p.isP?h.outs>=30&&pRate(h).era<=3.8:h.pa>=40&&bRate(h).ops>=.76); })()?3:0; return yb+(p.isP?(isSPr(p)?spV(p)+2:penV(p)):offV(p)*(1-mgrDefW(tid)*.74)+p.r.def*mgrDefW(tid)*.74)+polBonus(tid,p,lean)+f-(p.fat||0)/25; }
function setEntry(tid){ for(const p of playersOf(tid))p.e1=false; const lean=teamLean(tid);
  const ps=playersOf(tid).filter(p=>!p.ys&&healthy(p)&&!(p.isP&&rpPlanOf(tid,p)==='sp2')); const v=p=>entryVal(tid,p,lean);
  const bats=ps.filter(p=>!p.isP).sort((a,b)=>v(b)-v(a)), pits=ps.filter(p=>p.isP);
  const sp=[...pits].sort((a,b)=>(spV(b)+roleBias(tid,b))-(spV(a)+roleBias(tid,a))).slice(0,5);
  const rp=pits.filter(p=>!sp.includes(p)).sort((a,b)=>v(b)-v(a)).slice(0,10);
  const ln=makeLineupFrom(tid,bats); const st=new Set(Object.values(ln).map(p=>p.id));
  const bench=bats.filter(p=>!st.has(p.id)); const c=bench.find(p=>p.pos==='C');
  const bsel=(c?[c]:[]).concat(bench.filter(p=>p!==c)).slice(0,5);
  [...Object.values(ln),...bsel,...sp,...rp].forEach(p=>{p.e1=true;p.upDay=G.day;});
  entryManage(tid,false,true); }
function entryManage(tid,weekly,quiet){ if(!entryOn())return; const lim=entryLimit(); const lean=teamLean(tid); const v=p=>entryVal(tid,p,lean); const moves=[];
  for(const p of playersOf(tid))if(p.e1&&(p.injOut>3||p.ys||(p.isP&&rpPlanOf(tid,p)==='sp2')||!psOk(p))){ p.e1=false; p.downDay=G.day; moves.push(`${p.name} 말소(${p.injOut>3?'부상':p.ys?'육성':!psOk(p)?'포스트시즌 등록 마감 뒤 영입':'2군 선발 수업'})`); }
  let ent=playersOf(tid).filter(p=>p.e1);
  if(ent.length>lim){ const d=depth(tid); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); ent.filter(p=>!core.has(p.id)).sort((a,b)=>v(a)-v(b)).slice(0,ent.length-lim).forEach(p=>{p.e1=false;p.downDay=G.day;moves.push(`${p.name} 말소`);}); ent=playersOf(tid).filter(p=>p.e1); }
  while(ent.length<lim){ const np=ent.filter(p=>p.isP).length; const needP=np<Math.round(lim*.5); const pool=playersOf(tid).filter(canUp);
    const c=pool.filter(p=>p.isP===needP).sort((a,b)=>v(b)-v(a))[0]||pool.sort((a,b)=>v(b)-v(a))[0]; if(!c)break; c.e1=true; c.upDay=G.day; ent.push(c); moves.push(`${c.name} 콜업`); }
  if(weekly){ const d=depth(tid); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id));
    for(const isP of [false,true]){ const out=ent.filter(p=>p.isP===isP&&!core.has(p.id)&&G.day-(p.upDay||0)>=7).sort((a,b)=>v(a)-v(b))[0]; const inn=playersOf(tid).filter(p=>canUp(p)&&p.isP===isP).sort((a,b)=>v(b)-v(a))[0];
      if(out&&inn&&v(inn)>v(out)+2.5){ out.e1=false; out.downDay=G.day; inn.e1=true; inn.upDay=G.day; moves.push(`${out.name} 말소 · ${inn.name} 콜업`); } } }
  if(tid===G.user&&moves.length&&!quiet)note('엔트리',`감독이 1군 엔트리를 조정했습니다: ${moves.join(', ')}.`); }
function reqEntry(id,up){ const p=G.players[id]; const m=G.mgr[G.user]; if(!p||p.team!==G.user)return '대상이 아닙니다.'; if(!entryOn())return '시즌 중에만 엔트리를 바꿀 수 있습니다.'; if(!m)return '감독이 없습니다.';
  if(up&&!canUp(p))return p.isP&&rpPlanOf(p.team,p)==='sp2'?'2군 선발 수업 중입니다. 보직을 먼저 바꿔 주세요.':p.ys?'육성선수는 정식 선수로 등록해야 1군에 올릴 수 있습니다.':!healthy(p)?'부상 중입니다.':`말소 후 10일이 지나야 다시 등록할 수 있습니다(${dmd(p.downDay+10)}부터).`;
  if(!up&&!p.e1)return '이미 1군에 없습니다.';
  { const br=mplBreakListen(`${p.name} ${up?'콜업':'말소'}`); if(br){ m.rel=clamp(m.rel,0,100); return br; } }
  mgrFix(m); const a=clamp(.78-(m.ego-50)/70+(m.rel-60)/120+(mplOn('listen')?.3:0),.15,mplOn('listen')?.98:.95); /* 영입 면담에서 '단장 건의 존중'을 약속받았으면 거의 받아들인다 */ const ok=hn('req'+G.day,id)>-1.2&&R()<a;
  if(!ok){ m.rel=clamp(m.rel-2,0,100); mail('감독실',`${p.name} ${up?'콜업':'말소'} 요청 거절`,`${m.name} 감독: ${up?`${p.name}은(는) 아직 1군에 올릴 때가 아니라고 봅니다.`:`${p.name}은(는) 지금 팀에 필요한 선수입니다.`} 엔트리는 제가 판단하겠습니다.`,{kind:'감독'}); return `${m.name} 감독이 요청을 받아들이지 않았습니다.`; }
  if(up){ const ent=playersOf(G.user).filter(x=>x.e1); if(ent.length>=entryLimit()){ const d=depth(G.user); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); const lean=teamLean(G.user); const out=ent.filter(x=>x.isP===p.isP&&!core.has(x.id)).sort((a,b)=>entryVal(G.user,a,lean)-entryVal(G.user,b,lean))[0]||ent.filter(x=>!core.has(x.id))[0]; if(out){ out.e1=false; out.downDay=G.day; } }
    p.e1=true; p.upDay=G.day; addLog(`${p.name}이(가) 단장 요청으로 1군에 등록되었습니다.`); return `${m.name} 감독이 받아들였습니다. ${p.name} 1군 등록.`; }
  p.e1=false; p.downDay=G.day; entryManage(G.user,false,true); addLog(`${p.name}이(가) 단장 요청으로 1군에서 말소되었습니다.`); return `${m.name} 감독이 받아들였습니다. ${p.name} 말소(${dmd(G.day+10)}부터 재등록 가능).`; }
function toYS(id){ const p=G.players[id]; if(!p||p.team!==G.user||p.foreign||p.ys)return '대상이 아닙니다.'; if(p.faC||p.sal>100)return '연봉 1억 원 이하이고 FA·다년계약이 아닌 선수만 육성선수로 돌릴 수 있습니다.'; if(ysN(G.user)>=YS_MAX)return `육성선수는 ${YS_MAX}명까지입니다(게임 규칙).`;
  p.ys=true; p.e1=false; p.ysSal0=p.sal; p.sal=Math.min(p.sal,MIN_SAL); addLog(`${p.name}을(를) 육성선수로 돌렸습니다. 정식 로스터에서 빠집니다.`); return ''; }
function fromYS(id){ const p=G.players[id]; if(!p||!p.ys||p.team!==G.user||G.unemp)return '대상이 아닙니다.'; if(period()==='season'&&G.day<KD(5,1))return '육성선수는 5월 1일부터 정식 선수로 등록할 수 있습니다.'; if((period()==='season'&&G.day>foreignDL())||period()==='post')return '8월 15일 이후에는 시즌이 끝날 때까지 정식 선수로 등록할 수 없습니다.'; if(rosterN(G.user)>=ROSTER_MAX)return `정식 로스터가 ${ROSTER_MAX}명으로 꽉 찼습니다.`;
  p.ys=false; if(p.ysSal0!=null){ p.sal=Math.max(p.sal,p.ysSal0); delete p.ysSal0; } /* 육성으로 돌릴 때 깎인 연봉을 되돌린다 */ addLog(`${p.name}을(를) 정식 선수로 등록했습니다.`); return ''; }
function makeLineupFrom(tid,bats){ const save=G.entryY; G.entryY=-1; const ln=makeLineup(tid,bats); G.entryY=save; return ln; }
function depth(tid){
  const ps=playersOf(tid); const act=actOf(tid); const actIds=new Set(act.map(p=>p.id));
  const ln=makeLineup(tid); const startIds=new Set(Object.values(ln).map(p=>p.id));
  const lean=teamLean(tid); const PB=new Map(); const pb=p=>{ let v=PB.get(p.id); if(v==null){ v=polBonus(tid,p,lean); PB.set(p.id,v); } return v; };
  const by=(arr,f)=>arr.map(p=>[f(p),p]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
  const bat=by(act.filter(p=>!p.isP&&healthy(p)&&!startIds.has(p.id)),p=>ovr(p)+pb(p));
  const futB0=by(ps.filter(p=>!p.isP&&healthy(p)&&!actIds.has(p.id)),ovr), futP0=by(ps.filter(p=>p.isP&&healthy(p)&&!actIds.has(p.id)),ovr);
  const pit=act.filter(p=>p.isP&&healthy(p));
  const sp=by(pit,p=>spV(p)+roleBias(tid,p)+pb(p)).slice(0,5); for(const p of pit)p.role=sp.includes(p)?'SP':'RP';
  const rest=by(pit.filter(p=>!sp.includes(p)),p=>penV(p)+pb(p)*.6);
  const start=ORDER.filter(k=>ln[k]).map(k=>ln[k]);
  const on=entryOn();
  return {ln,start,bench:on?bat:bat.slice(0,5),futB:on?futB0:bat.slice(5).concat(futB0),sp,pen:on?rest:rest.slice(0,7),futP:on?futP0:rest.slice(7).concat(futP0),inj:ps.filter(p=>!healthy(p))};
}
function teamRating(tid){
  const d=depth(tid);
  const off=avg(d.start.map(offV))*(Math.min(9,d.start.length)/9);
  const def=avg(FIELD.filter(k=>d.ln[k]).map(k=>defAt(d.ln[k],k)));
  const sp=avg(d.sp.map(spV))*(Math.min(5,d.sp.length)/5), pen=avg(d.pen.map(penV));
  return off*.4+(sp*.65+pen*.35)*.45+def*.15;
}

