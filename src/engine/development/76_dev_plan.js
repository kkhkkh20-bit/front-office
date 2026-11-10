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
function trnPlan(p){ const T=G.trn&&G.trn[p.id]; return p.team===G.user&&T&&T.by==='gm'&&(T.tid==null||T.tid===G.user)?T.f:trnCoachPick(p); } /* 다른 구단에서 내린 지시는 되살아나지 않는다(검수 11-08) */
/* 단장 지정(또는 코치에게 돌려주기) */
/* 여러 선수 훈련 방향을 한꺼번에: 선수별 화면과 같은 뜻으로 적용한다(고른 집중 항목은 코치 추천과 같아도 단장 요청으로 고정. 코치진 계획으로 돌리려면 'coach') */
function trnSetMany(P){ const L=[]; for(const id in (P||{})){ const p=G.players[+id]; if(!p)continue; const t=trnSet(+id,P[id]); if(t)L.push(t); } return L; }
function trnSet(pid,f){ const p=G.players[pid]; if(!p||p.team!==G.user)return '우리 선수만 정할 수 있습니다.'; G.trn=G.trn||{};
  if(f==='coach'){ delete G.trn[pid]; try{ p.trnF=trnPlan(p); }catch(e){} /* 부상 배수도 바로 새 방향(검수 11-07) */ return `${p.name}의 훈련 방향을 감독·코치진 계획으로 돌렸습니다(${TRN[trnG(p)][trnCoachPick(p)].l}).`; }
  if(milServing(p))return `${p.name}은(는) 군 복무 중이라 구단 훈련 지시를 받지 않습니다.`; if(p.joinY>G.year)return `${p.name}은(는) ${p.joinY}년 합류 예정이라 아직 구단 훈련 지시를 받지 않습니다.`; /* 복무 중에는 상무·군 일정대로 지낸다 */
  if(!TRN[trnG(p)][f])return ''; const D=TRN[trnG(p)][f]; const old=G.trn[pid]; if(old&&old.f===f&&old.by==='gm')return '';
  p.trnF=f; G.trn[pid]={f,by:'gm',tid:G.user,since:G.day,y:G.year,base:Object.fromEntries(TRN_TOOLS[trnG(p)].map(k=>[k,p.r[k]])),snap:trnSnap(p),aw:0};
  const m=G.mgr[G.user]; const rec=trnCoachPick(p); let tail=m?`${m.name} 감독과 코치진이 그렇게 진행합니다.`:'코치진이 그렇게 진행합니다.';
  if(m&&f!==rec&&(m.ego??50)>=70&&!mplOn('listen')){ const wk=Math.floor(G.day/7), E=G.trnEgo=G.trnEgo||{}, ek=G.user+':'+(m.id??m.name); if(E[ek]!==wk){ E[ek]=wk; /* 한 주 한 번 제한은 구단·감독마다 따로(검수 11-09o) */ m.rel=clamp((m.rel??50)-1,0,100); } tail=`${m.name} 감독은 코치진 계획(${TRN[trnG(p)][rec].l})과 달라 썩 내켜하지 않지만 요청대로 진행합니다.`; }
  return `${p.name}: ${D.l}${f==='bal'?' 훈련으로 돌립니다':' 집중'}. ${tail}`; }
/* ===== 훈련 강도(카페 건의 11-09, 설계 수정: 선수별 강도는 코치진 영역) =====
 FM은 선수마다 훈련 부하(Light/Average/Heavy)를 정하고, 부하가 높을수록 성장은 빠르지만 부상 위험·피로가 오른다. 부상 내성·체력이 위험 폭을 가른다.
 실제 구단에서 선수별 강도는 컨디셔닝·파트 코치가 정한다. 단장은 팀 '육성 방침'(회복 우선·균형·성장 우선) 하나만 정하고, 코치진이 그 안에서 내구성·나이·피로·최근 부상을 보고 선수마다 배분한다.
 특정 선수 강도는 단장이 코치에게 건의하는 예외(G.trnI)로만 둔다. AI 구단은 리그 균형을 위해 모두 보통.
 KBO 현실: 시즌 중 개인 고강도 훈련은 드물다(경기 피로 관리가 우선). 그래서 균형 방침에서 아주 강하게는 나오지 않는다.
 - 성장: 주간 집중 훈련 증가분 × g, 겨울 성장(잠재력 여지 몫)에 그 시즌 평균 g. 아주 강하게(×1.3) 한 시즌이면 겨울 순성장 약 +40%, 캠프 몫까지 합친 한 해 성장 약 +30~35%
 - 부상: 경기·2군 부상 확률(injMult) × 위험 배수. 증가분은 내구성(투수는 체력)이 낮을수록, 32세·34세 이상일수록 크고, 컨디셔닝코치가 좋으면 조금 작다. 내구성 80이면 아주 강하게도 +6%, 35면 +55%(피로가 덜 풀려 경기 부상이 더 붙는다)
 - 피로: 매일 피로 회복 속도(recoverAll)를 늦춘다. 1군 주전은 경기 피로가 덜 풀려 위험이 겹친다
 - 회복 위주: 성장 -15%, 부상 -15%, 피로 회복 +15%. 회복 우선 방침이거나 단장이 건의했으면 재활 중 한 주에 하루씩 복귀가 당겨진다 */
const TRNI=[{l:'회복 위주',s:'회복',g:.85,inj:-.15,fat:-.15},{l:'보통',s:'보통',g:1,inj:0,fat:0},{l:'강하게',s:'강하게',g:1.15,inj:.25,fat:.12},{l:'아주 강하게',s:'아주 강',g:1.3,inj:.55,fat:.25}];
const TRNPOL={rec:{l:'회복 우선',o:-2,d:'부상·피로 관리가 먼저입니다. 성장은 조금 느립니다.'},bal:{l:'균형',o:0,d:'몸이 받쳐 주는 젊은 선수만 강하게, 약한 선수는 회복 위주로 코치진이 나눕니다.'},grow:{l:'성장 우선',o:2,d:'튼튼한 선수는 아주 강하게까지 올립니다. 성장이 빠르지만 부상이 늘어납니다.'}};
const trnPol=()=>TRNPOL[G.trnPol]?G.trnPol:'bal'; /* 저장본에 없으면 균형 */
const trnDur=p=>(p.isP?p.r.sta:p.r.vit)??50; /* 투수는 내구성 대신 체력 */
function trnCn(tid){ try{ if(tid==null||!G.coach)return 55; const C=coachesOf(tid); return C.cn?effC(C.cn,tid,'sk'):C.cn===undefined?55:45; }catch(e){ return 55; } } /* 컨디셔닝코치 지도력(빈자리 45) */
const trnInjN=p=>(p.injHist||[]).filter(h=>h.d!=null&&G.day-h.d<=365).length; /* 최근 1년 부상 */
/* 코치진이 고르는 강도와 그 이유: 점수 = 내구성 + 젊음 + 컨디셔닝코치 - 나이 - 최근 부상 - 피로, 방침만큼 위아래로 */
function trnIAuto(p){ const pol=trnPol(), o=TRNPOL[pol].o; if(p.injOut>0)return {i:pol==='rec'?0:1,w:'재활 중'};
  const d=trnDur(p), n=trnInjN(p), f=p.fat||0; const W=[[(d-50)/10,d>=60?'내구성 높음':d<42?'내구성 낮음':''],[p.age<=24?1:0,'젊은 선수'],[-(p.age>=34?2:p.age>=31?1:0),'30대 체력 관리'],[-Math.min(3,n),'최근 부상'],[-(f>=60?2:f>=40?1:0),'피로 누적'],[(trnCn(p.team)-55)/20,'']];
  const s=W.reduce((a,x)=>a+x[0],0)+o; let i=s>=3?3:s>=1.2?2:s>=-2.5?1:0; /* 균형 방침에서 보통이 대부분이 되게(리그 기본과 비슷) */ if(pol==='bal')i=Math.min(i,2); if(pol==='rec')i=Math.min(i,1);
  const top=W.filter(x=>x[1]).sort((a,b)=>Math.abs(b[0])-Math.abs(a[0]))[0]; return {i,w:top&&Math.abs(top[0])>=.5?top[1]:'무난한 몸 상태'}; }
function trnI(p){
  if(G.unemp||p.team==null||p.team!==G.user)return 1;
  const v=G.trnI?.[p.id];
  return TRNI[v]&&(!(p.injOut>0)||v===0)?v:trnIAuto(p).i;
}
const trnActive=()=>['pre','season'].includes(period());
const trnIByGm=p=>p.team===G.user&&!!(G.trnI&&TRNI[G.trnI[p.id]]);
function trnIF(p){ const vf=clamp((85-trnDur(p))/50,.1,1.3), af=p.age>=34?1.5:p.age>=32?1.2:1, cq=clamp(1.1-(trnCn(p.team)-55)/150,.9,1.2); return vf*af*cq; } /* 위험 증가분 배율 */
function trnIRisk(p,i){ i=i??trnI(p); const T=TRNI[i]; return T.inj<=0?1+T.inj:1+T.inj*trnIF(p); }
function trnIFat(p,i){ i=i??trnI(p); const T=TRNI[i]; return T.fat<=0?1-T.fat:1/(1+T.fat*trnIF(p)); } /* 피로 회복 속도 배수 */
/* 팀 육성 방침(단장) */
function trnPolSet(k){ if(G.unemp||!TRNPOL[k]||trnPol()===k)return ''; G.trnPol=k; return `육성 방침을 ${TRNPOL[k].l}(으)로 정했습니다. 코치진이 선수마다 강도를 다시 나눕니다. ${trnIMgr(k==='grow'?2:k==='rec'?0:1,domestic(G.user).filter(p=>trnI(p)>=2))}`; }
/* 특정 선수 강도 건의(예외). 'coach'면 코치진 판단으로 돌린다 */
function trnISet(pid,i){ const p=G.players[pid]; if(!p||G.unemp||p.team!==G.user)return '우리 선수만 건의할 수 있습니다.'; G.trnI=G.trnI||{};
  if(i==='coach'){ if(!trnIByGm(p))return ''; delete G.trnI[pid]; const a=trnIAuto(p); return `${p.name}의 훈련 강도를 코치진 판단으로 돌렸습니다(${TRNI[a.i].l}, ${a.w}).`; }
  i=+i; if(!TRNI[i])return ''; if(p.joinY>G.year)return `${p.name}은(는) ${p.joinY}년 합류 예정이라 아직 구단 훈련 지시를 받지 않습니다.`;
  if(isAway(p)||ovsAbroad(p))return `${p.name}은(는) 현재 구단 훈련에 참여하지 않습니다.`; if(trnIByGm(p)&&G.trnI[pid]===i)return '';
  G.trnI[pid]=i; const r=trnIRisk(p,i); return `${p.name}: 코치진에 훈련 강도 ${TRNI[i].l}을(를) 건의했습니다(성장 ×${TRNI[i].g.toFixed(2)}, 부상 위험 ×${r.toFixed(2)}). ${trnIMgr(i,[p])}`; }
/* 감독 반응: 메모만(관계 변화 없음). 규율형은 강훈련을 반기고 회복 위주를 못마땅해한다. 관리형(휴식 중시)은 강훈련을 걱정한다 */
function trnIMgr(i,ps){ const m=G.mgr[G.user]; if(!m||m.interim)return '코치진이 그렇게 진행합니다.'; mgrAttr(m); const d=m.disc??45, rs=m.rest??50; const weak=ps.filter(p=>trnIRisk(p,i)>=1.45);
  if(i>=2&&rs>=65)return `${m.name} 감독은 관리형이라 걱정합니다. "경기 뛰는 선수는 피로를 보면서 조절하겠습니다."${weak.length?` 특히 ${weak.slice(0,3).map(p=>p.name).join(', ')}은(는) 몸이 버틸지 모르겠다고 합니다.`:''}`;
  if(i>=2&&d>=62)return `${m.name} 감독이 반깁니다. "땀은 거짓말을 안 합니다."${weak.length?` 다만 코치진은 ${weak.slice(0,3).map(p=>p.name).join(', ')}의 몸 상태를 걱정합니다.`:''}`;
  if(i===0&&d>=62)return `${m.name} 감독은 썩 내켜하지 않습니다. "너무 풀어 주면 감이 떨어집니다." 그래도 그렇게 하겠답니다.`;
  return weak.length?`코치진이 ${weak.slice(0,3).map(p=>p.name).join(', ')}의 부상 위험을 걱정하지만 그렇게 진행합니다.`:`${m.name} 감독과 코치진이 그렇게 진행합니다.`; }
/* 매주: 모든 구단 국내 선수(부상·군 복무·대표팀·미계약·합류 전 제외) */
function trnWeek(){ const per=period(); if(per!=='pre'&&per!=='season')return;
  for(const p of Object.values(G.players)){ if(p.team==null||p.prospect||p.joinY>G.year||p.hold||isAway(p)||ovsAbroad(p))continue;
    if(p.injOut>0){ if(p.injOut>1&&trnI(p)===0)p.injOut--; continue; }
    const ti=trnI(p); if(p.team===G.user&&!G.unemp){ if(!p.trI||p.trI.y!==G.year)p.trI={y:G.year,s:0,n:0}; p.trI.s+=TRNI[ti].g; p.trI.n++; } /* 그 시즌 훈련한 주의 평균 강도 → 겨울 성장(develop). 우리 구단 선수만 */
    const f=trnPlan(p); p.trnF=f; if(f==='bal')continue; { const T=G.trn&&G.trn[p.id]; if(T&&T.by==='gm'&&T.f===f&&T.aw!=null)T.aw++; } /* 회고·보고의 훈련 주수: 비시즌·부상·연수 주는 빼고 실제 훈련한 주만(검수 11-09o) */ const D=TRN[trnG(p)][f]; if(!D||!D.k.length)continue; const k=D.k[0];
    const room=trnRoom(p,k); if(room<=0)continue; const cf=.85+(coachToolV(p,k)-50)/100*.8; /* 그 항목 지도 능력(제구 훈련이면 제구 지도) */ const af=p.age<=24?1.3:p.age<=28?1:p.age<=31?.6:p.age<=33?.35:.2; /* 34세 이상도 지시를 받아들였으면 실제로 한다(효과는 작다) */
    const add=.06*trnLearn(p)*clamp(cf,.7,1.3)*af*clamp(room/8,.15,1.2)*rnd(.6,1.4)*TRNI[ti].g; const got=addR(p,k,add);
    if(!p.trD||p.trD.y!==G.year)p.trD={y:G.year,f:k,s:0,by:{}}; p.trD.s+=got; p.trD.by[k]=(p.trD.by[k]||0)+got; } }
/* 겨울 성장 때 비용: 집중하느라 쌓인 만큼 다른 항목의 오름폭을 줄인다(develop에서 부른다) */
/* 겨울 기회비용: 집중 훈련으로 얻은 만큼(×1.1) 같은 묶음의 다른 항목 성장이 준다.
   항목마다 '다른 항목이 얻은 양'에 비례해 깎으므로, 여러 항목을 돌아가며 집중해도 전체 비용은 같다(돌려 막기로 비용을 피할 수 없음) */
function trnCost(p){ const D=p.trD; if(!D||(D.y!==G.year&&D.y!==G.year-1))return null; const ks=TRN_TOOLS[trnG(p)].filter(k=>k in p.r); if(ks.length<2||!(D.s>0))return null;
  const o={}; for(const k of ks){ const v=D.s*1.1*(D.s-(D.by[k]||0))/D.s/(ks.length-1); if(v>0)o[k]=v; } delete p.trD; return Object.keys(o).length?o:null; }
/* 경기 기록 합(1군 + 2군) */
function trnTot(p,y){ y=y??G.year; const a=seasonTotal(p,y,'1군')||{}, b=seasonTotal(p,y,'퓨처스')||{}; const o={}; for(const k of new Set([...Object.keys(a),...Object.keys(b)]))if(typeof (a[k]??b[k])==='number')o[k]=(a[k]||0)+(b[k]||0); return o; }
/* 집중 항목과 관련된 기록: 이전(시즌 시작~집중 시작) → 이후(집중 시작~지금) */
const TRN_STAT={ctl:['볼넷/9이닝',h=>h.outs>=30?h.bb*27/h.outs:null,'이닝'],stf:['삼진/9이닝',h=>h.outs>=30?h.so*27/h.outs:null,'이닝'],sta:['경기당 이닝',h=>(h.g||0)>=4?h.outs/3/h.g:null,'경기'],
  con:['삼진율',h=>h.pa>=40?h.so/h.pa*100:null,'타석'],pow:['순장타율',h=>h.ab>=40?((h.d||0)+2*(h.tr||0)+3*(h.hr||0))/h.ab:null,'타석'],eye:['볼넷률',h=>h.pa>=40?h.bb/h.pa*100:null,'타석'],
  def:['경기당 실책',h=>(h.g||0)>=10?(h.e||0)/h.g:null,'경기'],spd:['경기당 도루',h=>(h.g||0)>=10?(h.sb||0)/h.g:null,'경기']};
/* 1군·2군을 따로 남긴 기준점: 승격·강등으로 상대 수준이 바뀌면 합산 기록만으로는 훈련 효과를 읽기 어렵다 */
function trnNum(h){ const o={}; for(const k in (h||{}))if(typeof h[k]==='number')o[k]=h[k]; return o; }
function trnSnap(p){ return {lv:1,a:trnNum(seasonTotal(p,G.year,'1군')),b:trnNum(seasonTotal(p,G.year,'퓨처스'))}; }
function trnStatLine(p,f,snap,yy){ yy=yy??G.year; /* yy: 어느 시즌 기록으로 볼지(새해 회고는 지난 시즌) */ const S=TRN_STAT[f]; if(!S||!snap)return '';
  const fmt=v=>v==null?'표본 부족':f==='pow'?v.toFixed(3):f==='def'||f==='spd'?v.toFixed(2):v.toFixed(1)+(f==='con'||f==='eye'?'%':'');
  const nOf=h=>S[2]==='이닝'?`${Math.floor((h.outs||0)/3)}이닝`:S[2]==='타석'?`${h.pa||0}타석`:`${h.g||0}경기`;
  const one=(lab,now,base,ly)=>{ const aft={}; for(const k in now)aft[k]=now[k]-(base[k]||0); if(!(S[2]==='이닝'?aft.outs:S[2]==='타석'?aft.pa:aft.g))return null;
    let b=S[1](base), bl='집중 전'; if(b==null){ b=S[1](ly); bl='작년'; } return `${lab} ${bl} ${b==null?'기록 없음':fmt(b)} → 집중 이후 ${fmt(S[1](aft))} (${nOf(aft)})`; };
  if(snap.lv||!Object.keys(snap).length){ const A=snap.a||{}, B=snap.b||{};
    const L=[one('1군',trnNum(seasonTotal(p,yy,'1군')),A,trnNum(seasonTotal(p,yy-1,'1군'))),one('2군',trnNum(seasonTotal(p,yy,'퓨처스')),B,trnNum(seasonTotal(p,yy-1,'퓨처스')))].filter(Boolean);
    return L.length?`${S[0]} · ${L.join(' / ')}`:`${S[0]}: 집중 이후 아직 경기 기록이 없습니다.`; }
  /* 예전 저장: 1·2군 합산 기준점 */
  const now=trnTot(p,yy); const aft={}; for(const k in now)aft[k]=now[k]-(snap[k]||0);
  if(!(S[2]==='이닝'?aft.outs:S[2]==='타석'?aft.pa:aft.g))return `${S[0]}: 집중 이후 아직 경기 기록이 없습니다.`;
  let b=S[1](snap), bl='집중 전'; if(b==null){ const ly=trnTot(p,yy-1); b=S[1](ly); bl='작년'; }
  return `${S[0]} ${bl} ${b==null?'기록 없음':fmt(b)} → 집중 이후 ${fmt(S[1](aft))} (${nOf(aft)}, 1·2군 합산)`; }
/* 코치 의견 */
function trnOpinion(p){ const L=trnLearn(p); const lr=L>=1.15?' 배우는 속도가 빠른 선수입니다.':L<=.82?' 새로 익히는 데 시간이 걸리는 선수입니다.':''; return `"${trnAdvice(p).t}${lr}"`; }
/* 관찰 보고: 능력 변화(코치 관찰, 정확한 숫자 대신 정도) */
function trnObs(p,yy){ const T=G.trn&&G.trn[p.id]; if(!T||T.f==='bal')return null; const D=TRN[trnG(p)][T.f]; const k=D.k[0]; const d=p.r[k]-(T.base[k]??p.r[k]); const w=T.aw??Math.floor((G.day-T.since)/7);
  const lv=d<=-.3?'오히려 조금 떨어졌습니다':d<.3?(w<4?'아직 판단하기 이릅니다':'변화가 거의 관찰되지 않습니다'):d<1?'작은 개선이 관찰됩니다':d<2?'눈에 띄게 좋아졌습니다':'확실히 달라졌습니다';
  const g0=dvGrade(T.base[k]??p.r[k]), g1=dvGrade(p.r[k]); const th=[40,50,60,70].find(x=>p.r[k]<x); const next=th==null?null:Math.max(0,th-p.r[k]); /* 등급은 훈련 목록과 같은 기준 */
  const prog=g1!==g0?(d>0?`${g0} → ${g1}로 한 단계 올랐습니다`:`${g0} → ${g1}로 한 단계 내려갔습니다`):d<=-.3?`${g1} 안에서 조금 떨어짐`:d<.3?`${g1} 그대로`:next!=null&&next<=1.5?`${g1} 안에서 개선 · 다음 등급에 근접`:`${g1} 안에서 소폭 개선`;
  const stat=trnStatLine(p,T.f,T.snap,yy); const none=!stat||/아직 경기 기록이 없습니다/.test(stat);
  return {w,lv,d,stat,since:T.since,k,g0,g1,next,prog,real:none?'기록 없음(1군·2군 정규 경기 기준, 시범경기 제외)':'기록 있음(아래 경기 기록 참고)'}; }
/* 새 시즌: 단장이 정한 방향은 이어 가되, 관찰 기준(능력·기록)은 새로 잡는다 */
/* 새해에 관찰 기준을 새로 잡기 전, 작년 훈련 방향·기간·코치 관찰을 그 시즌 회고(연대기)에 한 줄씩 남긴다 */
function trnYearNote(y0){ const y=y0??G.year-1; if(G.trnNoteY===y)return; G.trnNoteY=y; /* 겨울 성장·노화 전에 쓴다(검수 11-07) */ const L=[]; for(const id in (G.trn||{})){ const p=G.players[id], T=G.trn[id]; if(!p||p.team!==G.user||!T||T.f==='bal'||(T.tid!=null&&T.tid!==G.user)||T.since>=payWin(y)[1])continue; /* 시즌이 끝난 뒤 내린 지시는 그 시즌 회고에 넣지 않는다(검수 11-08) */ const o=trnObs(p,y); if(!o)continue; const D=TRN[trnG(p)][T.f];
    L.push(`${p.name}(${posLabel(p)}) ${D.l} ${o.w}주 · ${o.lv}${o.stat?` · ${o.stat}`:''}`); }
  if(!L.length)return; G.reviews=G.reviews||{}; const R=G.reviews[y]=G.reviews[y]||{tid:G.user,L:[]}; R.L=R.L.filter(x=>!/^\[훈련 방향\]/.test(x)); R.L.push('[훈련 방향] '+L.slice(0,12).join(' / ')+(L.length>12?` 외 ${L.length-12}명`:'')); }
function trnNewYear(){ try{ trnYearNote(); }catch(e){} for(const id in (G.trn||{})){ const p=G.players[id], T=G.trn[id]; if(!p||p.team!==G.user){ delete G.trn[id]; continue; }
  T.base=Object.fromEntries(TRN_TOOLS[trnG(p)].map(k=>[k,p.r[k]])); T.snap={lv:1,a:{},b:{}}; T.since=G.day; T.aw=0; T.y=G.year; T.yrs=(T.yrs||0)+1; } for(const id in (G.trnI||{})){ const p=G.players[id]; if(!p||p.team!==G.user)delete G.trnI[id]; } }
