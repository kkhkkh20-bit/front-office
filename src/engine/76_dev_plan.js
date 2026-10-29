/* ===== 선수별 훈련 방향: 코치진이 짜고, 단장이 받아들이거나 바꾼다 =====
 선수마다 집중 항목 하나(또는 균형). 나머지는 기본 훈련. 지정하지 않은 선수는 담당 코치가 정한다(다른 구단도 같은 방식).
 - 효과는 몇 주~몇 달에 걸쳐 조금씩: 매주 집중 항목이 오른다. 속도는 선수 학습 능력(프로의식 + 숨은 값)·담당 코치 육성력·나이·그 항목에 남은 여력에 따라 다르다.
 - 비용: 집중한 만큼 다른 항목의 '성장 기회'가 줄어든다(겨울 성장 때 다른 항목의 오름폭에서 뺀다. 이미 하락기인 베테랑은 거의 비용이 없지만 효과도 작다).
 - 항목마다 여력(숨은 상한)이 달라서, 약점이 늘 정답은 아니다. 예: 구위는 좋고 제구가 나쁜 투수
   · 제구 집중: 선발로 쓸 가능성을 높인다. 다만 제구 여력이 작으면 거의 안 는다.
   · 구위 집중: 강점을 더 살려 불펜 자원으로 키운다. 제구 약점은 남는다.
 - 체력 집중은 부상 위험을 조금 줄인다(과한 보상·벌칙은 두지 않는다). 수비 집중은 포지션 전환과 별개다.
 경기 기록 변화와 능력 변화는 따로 보여 준다(볼넷이 줄었다고 꼭 제구가 오른 건 아니다). */
const TRN={P:{bal:{l:'균형',k:[]},stf:{l:'구위',k:['stf'],c:'pc'},ctl:{l:'제구',k:['ctl'],c:'cc'},sta:{l:'체력',k:['sta'],c:'pc'}},
  B:{bal:{l:'균형',k:[]},con:{l:'컨택',k:['con'],c:'bc'},pow:{l:'장타',k:['pow'],c:'bc'},eye:{l:'선구',k:['eye'],c:'bc'},def:{l:'수비',k:['def'],c:'dc'},spd:{l:'주루',k:['spd'],c:'rc'}}};
const TRN_TOOLS={P:['stf','ctl','sta'],B:['con','pow','eye','spd','def']};
const trnG=p=>p.isP?'P':'B';
function trnLearn(p){ initPers(p); return clamp(.7+(p.pers.pro-4)/16*.5+hn('lrn',p.id)*.12,.6,1.4); }
function trnCap(p,k){ return clamp(Math.max(p.pot,ovr(p))+hn('tc'+k,p.id)*6+(k==='ctl'||k==='eye'?-1:0),25,80); }
function trnRoom(p,k){ return trnCap(p,k)-p.r[k]; }
function trnCoach(tid,k){ const role=(TRN.P[k]||TRN.B[k]||{}).c; try{ const C=G.coach&&G.coach[tid]; return role&&C?C[role]||null:null; }catch(e){ return null; } }
/* 코치진 기본안과 의견: 같은 판단에서 나온다. 선수 역할·강약점·항목별 여력·감독 성향을 보고, 정답이 하나로 보이지 않게 다른 길도 함께 말한다 */
function trnAdvice(p){ const r=p.r; const rm=k=>trnRoom(p,k); const m=p.team!=null&&G.mgr?mgrAttr(G.mgr[p.team]):null;
  if(p.isP){ if(p.team!=null&&rpPlanOf(p.team,p)==='sp2')return {f:'sta',t:`2군에서 선발 수업 중입니다. 선발로 등판하며 체력을 키워 긴 이닝을 던지게 하겠습니다.`};
    const sp=isSPr(p); const rc=rm('ctl'), rs=rm('stf'), ra=rm('sta');
    if(r.ctl<r.stf-5){
      if(sp&&rc>=3)return {f:'ctl',t:`제구가 선발 정착의 걸림돌입니다. 아직 고칠 여지가 있어 제구부터 잡겠습니다. 구위를 더 키워 불펜에서 쓰는 길도 있습니다.`};
      if(rc<2.5&&rs>=2)return {f:'stf',t:`제구가 약점이지만 개선 여력이 크지 않습니다. 구위를 더 살려 불펜 자원으로 키우는 쪽이 낫다고 봅니다. 그래도 제구를 잡아 보겠다면 시간이 오래 걸립니다.`};
      if(!sp&&rc>=5)return {f:'ctl',t:`불펜에서 볼넷이 많습니다. 제구를 잡을 여지가 커서 제구부터 하겠습니다. 구위를 키우면 짧은 이닝에서 더 강해질 수는 있습니다.`};
      if(!sp)return {f:'stf',t:`불펜형이고 구위가 강점입니다. 강점을 더 키우겠습니다. 제구는 조금씩만 나아질 겁니다.`};
      return {f:'bal',t:`제구가 약하지만 고칠 여지도, 구위를 더 올릴 여지도 크지 않습니다. 고르게 훈련하겠습니다.`}; }
    if(r.stf<r.ctl-5){
      if(rs>=3)return {f:'stf',t:`구위보다 제구가 나은 투수입니다. 구위를 끌어올릴 여지가 있어 구위부터 하겠습니다. 제구를 더 다듬어 맞혀 잡는 쪽으로 가는 길도 있습니다.`};
      if(ra>=3)return {f:'sta',t:`구위는 크게 늘기 어렵습니다. 체력을 키워 긴 이닝을 맡기는 쪽으로 가겠습니다.`};
      return {f:'bal',t:`구위가 약하지만 더 늘 여지가 크지 않습니다. 지금 가진 제구로 승부하도록 고르게 훈련하겠습니다.`}; }
    if(!sp&&r.sta<47){
      if(p.age<=25&&ra>=4&&r.stf>=50)return {f:'sta',t:`불펜에서 던지지만 체력을 키우면 선발로 돌려볼 만합니다. 그동안 구위 성장은 조금 늦어집니다.`};
      if(rs>=2)return {f:'stf',t:`짧게 던지는 게 맞는 투수입니다. 구위를 다듬겠습니다.`}; }
    return {f:'bal',t:`고르게 갖춘 투수입니다. 굳이 한쪽에 몰기보다 균형 훈련이 무난합니다.`}; }
  const bat=(r.con+r.pow)/2; const dw=m&&m.dfn>=65; /* 수비를 중시하는 감독은 수비 약점을 더 일찍 메우려 한다 */
  if(r.def<(dw?50:45)&&bat>=(dw?48:52)){
    if(rm('def')>=3)return {f:'def',t:`방망이 때문에 계속 쓰고 싶은데 수비가 불안합니다.${dw?' 감독님도 수비를 중시합니다.':''} 수비 훈련으로 메우겠습니다. 대신 타격 훈련 시간이 줄어듭니다.`};
    return {f:pow0(p)?'pow':'con',t:`수비는 크게 늘기 어렵습니다. 타격을 더 살리고 지명타자나 1루로 쓰는 방법이 낫다고 봅니다.`}; }
  if(p.age<=25&&r.pow<r.con-6){
    if(rm('pow')>=5)return {f:'pow',t:`맞히는 재주는 있는데 힘이 아직입니다. 장타를 키워 중심 타자로 키우겠습니다. 당장 타율은 조금 손해 볼 수 있습니다.`};
    return {f:r.eye<50&&rm('eye')>=2?'eye':'con',t:`장타 여력은 크지 않습니다. 컨택과 선구로 출루형 타자를 만드는 쪽이 현실적입니다.`}; }
  if(r.eye<45){
    if(rm('eye')>=3)return {f:'eye',t:`공을 고르는 눈이 부족합니다. 선구를 잡으면 출루가 오를 겁니다. 선구는 원래 천천히 느는 항목입니다.`};
    return {f:'bal',t:`선구가 약하지만 잘 안 느는 유형입니다. 장점인 타격을 고르게 살리겠습니다.`}; }
  if(r.con<45&&rm('con')>=3)return {f:'con',t:`삼진이 많습니다. 컨택부터 잡겠습니다. 장타를 키워 한 방이 있는 타자로 가는 길도 있습니다.`};
  return {f:'bal',t:`특별한 약점이 없습니다. 당장 생산성을 높일지(컨택), 장기적으로 타격 유형을 만들지(장타·선구) 정하시면 됩니다.`}; }
const pow0=p=>p.r.pow>=p.r.con;
function trnCoachPick(p){ return trnAdvice(p).f; }
function trnPlan(p){ const T=G.trn&&G.trn[p.id]; return p.team===G.user&&T&&T.by==='gm'?T.f:trnCoachPick(p); }
/* 단장 지정(또는 코치에게 돌려주기) */
function trnSet(pid,f){ const p=G.players[pid]; if(!p||p.team!==G.user)return '우리 선수만 정할 수 있습니다.'; G.trn=G.trn||{};
  if(f==='coach'){ delete G.trn[pid]; return `${p.name}의 훈련 방향을 감독·코치진 계획으로 돌렸습니다(${TRN[trnG(p)][trnCoachPick(p)].l}).`; }
  if(!TRN[trnG(p)][f])return ''; const D=TRN[trnG(p)][f]; const old=G.trn[pid]; if(old&&old.f===f&&old.by==='gm')return '';
  G.trn[pid]={f,by:'gm',since:G.day,y:G.year,base:Object.fromEntries(TRN_TOOLS[trnG(p)].map(k=>[k,p.r[k]])),snap:trnTot(p)};
  const m=G.mgr[G.user]; const rec=trnCoachPick(p); let tail=m?`${m.name} 감독과 코치진이 그렇게 진행합니다.`:'코치진이 그렇게 진행합니다.';
  if(m&&f!==rec&&(m.ego||50)>=70){ const wk=Math.floor(G.day/7); if(G.trnEgoWk!==wk){ G.trnEgoWk=wk; m.rel=clamp((m.rel||50)-1,0,100); } tail=`${m.name} 감독은 코치진 계획(${TRN[trnG(p)][rec].l})과 달라 썩 내켜하지 않지만 요청대로 진행합니다.`; }
  return `${p.name}: ${D.l}${f==='bal'?' 훈련으로 돌립니다':' 집중'}. ${tail}`; }
/* 매주: 모든 구단 국내 선수(부상·군 복무 제외, 33세 이하) */
function trnWeek(){ const per=period(); if(per!=='pre'&&per!=='season')return;
  for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.prospect||p.age>33||p.injOut>0||(p.mil&&p.mil.from<=G.day&&p.mil.until>G.day))continue;
    const f=trnPlan(p); p.trnF=f; if(f==='bal')continue; const D=TRN[trnG(p)][f]; if(!D||!D.k.length)continue; const k=D.k[0];
    const room=trnRoom(p,k); if(room<=0)continue; const c=trnCoach(p.team,f); const cf=.85+((c?c.dv:50)-50)/100*.8; const af=p.age<=24?1.3:p.age<=28?1:p.age<=31?.6:.35;
    const add=.06*trnLearn(p)*clamp(cf,.7,1.3)*af*clamp(room/8,.15,1.2)*rnd(.6,1.4); const got=addR(p,k,add);
    if(!p.trD||p.trD.y!==G.year)p.trD={y:G.year,f:k,s:0,by:{}}; p.trD.s+=got; p.trD.by[k]=(p.trD.by[k]||0)+got; } }
/* 겨울 성장 때 비용: 집중하느라 쌓인 만큼 다른 항목의 오름폭을 줄인다(develop에서 부른다) */
function trnCost(p){ const D=p.trD; if(!D||(D.y!==G.year&&D.y!==G.year-1))return null; const ks=TRN_TOOLS[trnG(p)].filter(k=>!(k in D.by)&&k in p.r); if(!ks.length)return null; const per=D.s*1.1/ks.length; const o={}; ks.forEach(k=>o[k]=per); delete p.trD; return o; }
/* 경기 기록 합(1군 + 2군) */
function trnTot(p,y){ y=y??G.year; const a=seasonTotal(p,y,'1군')||{}, b=seasonTotal(p,y,'퓨처스')||{}; const o={}; for(const k of new Set([...Object.keys(a),...Object.keys(b)]))if(typeof (a[k]??b[k])==='number')o[k]=(a[k]||0)+(b[k]||0); return o; }
/* 집중 항목과 관련된 기록: 이전(시즌 시작~집중 시작) → 이후(집중 시작~지금) */
const TRN_STAT={ctl:['볼넷/9이닝',h=>h.outs>=30?h.bb*27/h.outs:null,'이닝'],stf:['삼진/9이닝',h=>h.outs>=30?h.so*27/h.outs:null,'이닝'],sta:['경기당 이닝',h=>(h.g||0)>=4?h.outs/3/h.g:null,'경기'],
  con:['삼진율',h=>h.pa>=40?h.so/h.pa*100:null,'타석'],pow:['순장타율',h=>h.ab>=40?((h.d||0)+2*(h.tr||0)+3*(h.hr||0))/h.ab:null,'타석'],eye:['볼넷률',h=>h.pa>=40?h.bb/h.pa*100:null,'타석'],
  def:['경기당 실책',h=>(h.g||0)>=10?(h.e||0)/h.g:null,'경기'],spd:['경기당 도루',h=>(h.g||0)>=10?(h.sb||0)/h.g:null,'경기']};
function trnStatLine(p,f,snap){ const S=TRN_STAT[f]; if(!S||!snap)return ''; const now=trnTot(p); const aft={}; for(const k in now)aft[k]=now[k]-(snap[k]||0);
  const fmt=v=>v==null?'표본 부족':f==='pow'?v.toFixed(3):f==='def'||f==='spd'?v.toFixed(2):v.toFixed(1)+(f==='con'||f==='eye'?'%':'');
  const n=S[2]==='이닝'?`${Math.floor((aft.outs||0)/3)}이닝`:S[2]==='타석'?`${aft.pa||0}타석`:`${aft.g||0}경기`;
  if(!(S[2]==='이닝'?aft.outs:S[2]==='타석'?aft.pa:aft.g))return `${S[0]}: 집중 이후 아직 경기 기록이 없습니다.`;
  let b=S[1](snap), bl='집중 전'; if(b==null){ const ly=trnTot(p,G.year-1); b=S[1](ly); bl='작년'; }
  return `${S[0]} ${bl} ${b==null?'기록 없음':fmt(b)} → 집중 이후 ${fmt(S[1](aft))} (${n}, 1·2군 합산)`; }
/* 코치 의견 */
function trnOpinion(p){ const L=trnLearn(p); const lr=L>=1.15?' 배우는 속도가 빠른 선수입니다.':L<=.82?' 새로 익히는 데 시간이 걸리는 선수입니다.':''; return `"${trnAdvice(p).t}${lr}"`; }
/* 관찰 보고: 능력 변화(코치 관찰, 정확한 숫자 대신 정도) */
function trnObs(p){ const T=G.trn&&G.trn[p.id]; if(!T||T.f==='bal')return null; const D=TRN[trnG(p)][T.f]; const k=D.k[0]; const d=p.r[k]-(T.base[k]??p.r[k]); const w=Math.floor((G.day-T.since)/7);
  const lv=d<.3?(w<4?'아직 판단하기 이릅니다':'변화가 거의 관찰되지 않습니다'):d<1?'작은 개선이 관찰됩니다':d<2?'눈에 띄게 좋아졌습니다':'확실히 달라졌습니다';
  return {w,lv,d,stat:trnStatLine(p,T.f,T.snap)}; }
/* 새 시즌: 단장이 정한 방향은 이어 가되, 관찰 기준(능력·기록)은 새로 잡는다 */
function trnNewYear(){ for(const id in (G.trn||{})){ const p=G.players[id], T=G.trn[id]; if(!p||p.team!==G.user){ delete G.trn[id]; continue; }
  T.base=Object.fromEntries(TRN_TOOLS[trnG(p)].map(k=>[k,p.r[k]])); T.snap={}; T.since=G.day; T.y=G.year; T.yrs=(T.yrs||0)+1; } }
