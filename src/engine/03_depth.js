/* ===== 포지션 배치와 뎁스 ===== */
/* 서브 포지션: 주 포지션별로 함께 연습해 온 자리 (선수마다 고정) */
const SUBMAP={C:[['1B',.45]],'1B':[['LF',.35],['3B',.3],['RF',.25]],'2B':[['SS',.6],['3B',.45],['1B',.25]],'3B':[['1B',.6],['SS',.3],['2B',.35]],SS:[['2B',.85],['3B',.65]],LF:[['RF',.7],['1B',.35],['CF',.2]],CF:[['LF',.85],['RF',.8]],RF:[['LF',.7],['1B',.3],['CF',.3]]};
const _subC=new Map();
/* 할 수 있는 다른 자리: 숙련도 50 이상(78_positions.js) */
function subsOf(p){ if(p.isP)return []; const E=pexpOf(p); return Object.keys(E).filter(k=>k!==p.pos&&E[k]>=50).sort((a,b)=>E[b]-E[a]); }
function defAt(p,pos){
  if(pos==='DH')return 0; if(p.pos===pos)return p.r.def;
  const e=(pexpOf(p)[pos]||0)/100; return p.r.def-posRaw(p.pos,pos)*versF(p)*(1-e*.85);
}
const posScore=(p,pos)=>pos==='DH'?offV(p):offV(p)*.62+defAt(p,pos)*.38;
const ORDER=['C','SS','CF','2B','3B','RF','LF','1B','DH'];
function makeLineup(tid,pool){
  const bats=(pool||actOf(tid)).filter(p=>!p.isP&&healthy(p));
  const used=new Set(); const ln={};
  const ov={}; const mg=G.mgr[tid]; const promo=p=>p.promise&&tid===G.user&&mg&&mg.disc<62?2:0;
  for(const pos of ORDER){ const id=ov[pos]; const p=id&&G.players[id]; if(p&&p.team===tid&&!p.isP&&healthy(p)&&!used.has(p.id)){ln[pos]=p;used.add(p.id);} }
  // 감독은 본래 포지션과 서브 포지션을 우선한다: 전체에서 가장 잘 맞는 (자리, 선수) 쌍부터 채운다
  const fitPen=(p,pos)=>{ if(pos==='DH')return p.pos==='C'?1:0; if(p.pos===pos)return 0; const e=(pexpOf(p)[pos]||0)/100; const b=pos==='C'?40:pos==='1B'?6:11; return e>=.5?1.5:b-(b-1.5)*e/.5; };
  const lean=teamLean(tid); const pb=p=>polBonus(tid,p,lean); const wD=mgrDefW(tid);
  const open=new Set(ORDER.filter(pos=>!ln[pos]));
  const SC=new Map(); for(const p of bats){ const o=offV(p), ex=promo(p)+pb(p); const m={}; for(const pos of ORDER)m[pos]=(pos==='DH'?o:o*(1-wD)+defAt(p,pos)*wD)+ex-fitPen(p,pos); SC.set(p.id,m); }
  while(open.size){ let bp=null,bq=null,bs=-1e9;
    for(const pos of open){ if(pos==='DH'&&open.size>1)continue; for(const p of bats){ if(used.has(p.id))continue; const s=SC.get(p.id)[pos]; if(s>bs){bs=s;bp=pos;bq=p;} } }
    if(!bq)break; ln[bp]=bq; used.add(bq.id); open.delete(bp); }
  return ln;
}
function entryLimit(){ return period()==='season'&&G.day>=KD(8,25)?ENTRY_BASE+ENTRY_EXP:ENTRY_BASE; }
function entryOn(){ if(!G.cal||G.entryY!==G.year)return false; const per=period(); return per==='season'||per==='post'||(per==='pre'&&G.day>=G.cal.open-1); }
function actOf(tid){ const ps=playersOf(tid); return entryOn()?ps.filter(p=>p.e1):ps.filter(p=>!p.ys&&!(p.isP&&rpPlanOf(tid,p)==='sp2')); }
const canUp=p=>!p.e1&&!p.ys&&!(p.isP&&rpPlanOf(p.team,p)==='sp2')&&!isAway(p)&&healthy(p)&&!(p.joinY>G.year)&&(p.downDay==null||G.day-p.downDay>=10);
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
  for(const p of playersOf(tid))if(p.e1&&(p.injOut>3||p.ys||(p.isP&&rpPlanOf(tid,p)==='sp2'))){ p.e1=false; p.downDay=G.day; moves.push(`${p.name} 말소(${p.injOut>3?'부상':p.ys?'육성':'2군 선발 수업'})`); }
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
  mgrFix(m); const a=clamp(.78-(m.ego-50)/70+(m.rel-60)/120+(mplOn('listen')?.3:0),.15,mplOn('listen')?.98:.95); /* 영입 면담에서 '단장 건의 존중'을 약속받았으면 거의 받아들인다 */ const ok=hn('req'+G.day,id)>-1.2&&R()<a;
  if(!ok){ m.rel=clamp(m.rel-2,0,100); mail('감독실',`${p.name} ${up?'콜업':'말소'} 요청 거절`,`${m.name} 감독: ${up?`${p.name}은(는) 아직 1군에 올릴 때가 아니라고 봅니다.`:`${p.name}은(는) 지금 팀에 필요한 선수입니다.`} 엔트리는 제가 판단하겠습니다.`,{kind:'감독'}); return `${m.name} 감독이 요청을 받아들이지 않았습니다.`; }
  if(up){ const ent=playersOf(G.user).filter(x=>x.e1); if(ent.length>=entryLimit()){ const d=depth(G.user); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); const lean=teamLean(G.user); const out=ent.filter(x=>x.isP===p.isP&&!core.has(x.id)).sort((a,b)=>entryVal(G.user,a,lean)-entryVal(G.user,b,lean))[0]||ent.filter(x=>!core.has(x.id))[0]; if(out){ out.e1=false; out.downDay=G.day; } }
    p.e1=true; p.upDay=G.day; addLog(`${p.name}이(가) 단장 요청으로 1군에 등록되었습니다.`); return `${m.name} 감독이 받아들였습니다. ${p.name} 1군 등록.`; }
  p.e1=false; p.downDay=G.day; entryManage(G.user,false,true); addLog(`${p.name}이(가) 단장 요청으로 1군에서 말소되었습니다.`); return `${m.name} 감독이 받아들였습니다. ${p.name} 말소(${dmd(G.day+10)}부터 재등록 가능).`; }
function toYS(id){ const p=G.players[id]; if(!p||p.team!==G.user||p.foreign||p.ys)return '대상이 아닙니다.'; if(p.faC||p.sal>100)return '연봉 1억 원 이하이고 FA·다년계약이 아닌 선수만 육성선수로 돌릴 수 있습니다.'; if(ysN(G.user)>=YS_MAX)return `육성선수는 ${YS_MAX}명까지입니다(게임 규칙).`;
  p.ys=true; p.e1=false; p.sal=Math.min(p.sal,MIN_SAL); addLog(`${p.name}을(를) 육성선수로 돌렸습니다. 정식 로스터에서 빠집니다.`); return ''; }
function fromYS(id){ const p=G.players[id]; if(!p||!p.ys)return '대상이 아닙니다.'; if(period()==='season'&&G.day<KD(5,1))return '육성선수는 5월 1일부터 정식 선수로 등록할 수 있습니다.'; if(rosterN(G.user)>=ROSTER_MAX)return `정식 로스터가 ${ROSTER_MAX}명으로 꽉 찼습니다.`;
  p.ys=false; addLog(`${p.name}을(를) 정식 선수로 등록했습니다.`); return ''; }
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

