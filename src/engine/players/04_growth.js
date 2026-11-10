/* ===== 성장과 노화 ===== */
/* ===== 성장과 노화 =====
 성장 유형(숨김): norm 정상형, early 조기 완성형, late 대기만성형, stall 정체형, vet 기술형(신체는 늙어도 기술이 는다)
 성장 속도 = 남은 잠재력 × 유형별 나이 곡선 × 출전 시간 × 훈련 시설 × 감독 육성 성향 */
const DT={norm:{l:'정상 성장형',grow:28,peak:31,fall:33},early:{l:'조기 완성형',grow:25,peak:29,fall:31},late:{l:'대기만성형',grow:30,peak:33,fall:35},stall:{l:'정체형',grow:26,peak:30,fall:32},vet:{l:'기술형 베테랑',grow:28,peak:32,fall:33}}; /* KBO 전성기는 29세 전후부터: 모든 유형을 2년 늦췄다(사용자 11-07) */
const PHYS={vit:.9,con:.1,pow:.5,eye:-.3,spd:.9,def:.5,stf:.6,ctl:-.2,sta:.7}; // 나이 들 때 신체 의존도(높을수록 먼저 떨어짐)
function rollDT(){ const x=R(); return x<.52?'norm':x<.64?'early':x<.76?'late':x<.89?'stall':'vet'; }
function playShare(p){ // 지난 시즌 출전 비중: 1군은 그대로, 2군는 60%만 인정
  const y=G.year; const a=seasonTotal(p,y,'1군'), f=seasonTotal(p,y,'퓨처스'); const fw=.6+(p.team===G.user?facImpact(facOf('fut'))*.05:facAiFut(p.team)); /* 2군 구장이 좋을수록 2군 출전을 더 인정 */
  if(p.isP){ const o=(a?a.outs:0)+(f?f.outs:0)*fw; return o>=420?1.15:o>=300?1.08:o>=180?1:o>=90?.92:.8; }
  const pa=(a?a.pa:0)+(f?f.pa:0)*fw; return pa>=450?1.15:pa>=320?1.08:pa>=200?1:pa>=100?.92:.8; }
/* 성격이 성장을 가른다: 시설·출전·코치는 바탕이고, 프로의식(자기 관리)과 야망(더 올라가려는 마음)이 같은 환경에서도 성장을 크게 벌린다.
   프로의식이 낮으면 덜 크고, 슬럼프가 잦고, 일찍 꺾인다. 그해 사고(늦은 귀가·지각 등)를 칠 때마다 더 깎인다 */
function persGrowF(p){ initPers(p); const pr=effPro(p), am=p.pers.amb; /* 리더들이 만든 선수단 문화가 반영된 프로의식 */ const bad=p.badY&&p.badY.y===G.year?p.badY.n:0; return clamp(.5+(pr-4)/16*.7+(am-4)/16*.25,.5,1.45)*(1-.08*Math.min(3,bad)); }
/* 성장 구간: 대기만성형 일부는 30대 초반에 터진다. 프로의식이 낮으면 일찍 꺾이고(초반 반짝 뒤 하락), 높으면 오래 버틴다 */
function dtSpan(p){ const T=DT[p.dt]||DT.norm; initPers(p); const pr=p.pers.pro; const vl=p.dt==='late'&&u01('vlate',p.id)<.35; const g=vl?32:T.grow, pk=vl?35:T.peak, fa=vl?36:T.fall;
  const adj=pr<=6?-3:pr<=9?-2:pr<=12?-1:pr>=17?1:0; return {grow:Math.min(g,fa+adj-1),peak:Math.min(pk,fa+adj-1),fall:fa+adj,vl}; }
/* 숨은 재능이 1군 기록으로 드러난다: 스카우트 평가가 바로잡히고, 우리 선수면 소식함에 알린다 */
function hidReveal(p){ if(!p.hidT||p.hidR||p.prospect)return; const L=(p.hist||[]).filter(h=>h.lvl==='1군'); const pa=sum(L.map(h=>h.pa||0)), outs=sum(L.map(h=>h.outs||0)); if(pa<150&&outs<180)return; p.hidR=G.year;
  const d=p.draft; story(p,`${G.year} 스카우트가 놓친 재능이 1군에서 드러남${d?`(${d.y} ${d.rd}라운드 지명)`:''}`);
  if(p.team===G.user)mail('스카우트팀',`스카우트가 놓친 선수: ${p.name}`,`${p.name}(${posLabel(p)}, ${p.age}세)${d?`은(는) ${d.y}년 ${d.rd}라운드 ${d.no}순위로 뽑힌 선수입니다.`:'은(는)'} 1군 기록이 쌓이면서 처음 평가보다 잠재력이 크다는 것이 드러났습니다. 스카우트 평가를 고쳤습니다.`,{kind:'선수',ref:p.id}); }
function declApply(){ for(const p of Object.values(G.players)){ const D=p.declP; if(!D)continue; for(const k in D)if(p.r[k]!=null)p.r[k]=clamp(p.r[k]+D[k],20,80); delete p.declP; roundR(p); } } /* 6월 1일: 미뤄 둔 노화 하락 나머지 */
function develop(p){
  try{ proDrift(p); }catch(e){} try{ hidReveal(p); }catch(e){}
  if(!p.dt)p.dt=rollDT(); const T=dtSpan(p); const o=ovr(p),potBefore=p.pot; const age=p.age; const pg=p.foreign?1:persGrowF(p); const potCap=()=>Math.max(p.pot,o); /* 잠재력은 넘을 수 없다(원래 능력이 더 높으면 그대로) */
  const svc=p.mil&&p.mil.until&&p.mil.from<=G.day&&p.mil.until>G.day?p.mil.unit:null;
  /* 군 복무 중에는 우리 구단 시설·코치·감독이 아니라 상무 야구단(또는 군) 환경에서 지낸다. 현역은 야구 훈련을 하지 못한다 */
  const play=svc==='현역'?.55:svc==='상무'?1:p.team!=null?playShare(p):.85, fac=svc?MIL_FAC[svc]||MIL_FAC['현역']:p.team!=null?facEff(p):FAC[2];
  const club=p.team!=null&&!svc; const ti=club&&p.trI&&p.trI.n&&(p.trI.y===G.year||p.trI.y===G.year-1)?p.trI.s/p.trI.n:1; delete p.trI; /* 그 시즌 평균 훈련 강도(76_dev_plan) */ const devMgr=club&&G.mgr?mgrOf(p.team):null,yf=devMgr?1+(devMgr.youth-50)/150:1;
  p.devLog={y:G.year,tid:p.team,play,fac:fac.l,manager:devMgr&&devMgr.name?{id:devMgr.id??null,name:devMgr.name,youth:devMgr.youth}:null,reasons:[]};
  const gap=Math.max(0,p.pot-o); let base=0;
  if(age<=T.grow){
    const rate=clamp((p.dt==='early'?1.25:p.dt==='late'?(T.vl&&age<=28?.35:.85):p.dt==='stall'?.35:1)/(T.grow-age+1.5),.04,.65); /* 남은 성장 연수에 맞춰 조금씩: 18세 1순위도 20대 중반에 정점(예전엔 남은 잠재력의 20~34%를 해마다 채워 20~21세에 리그 정상급이 됐다) */
    const env=play*fac.g*yf*(club&&G.coach?coachDevMult(p):1)*(club?mpickMult(p):1)*pg*ti; base=gap*rate*WINTER_F*rnd(.65,1.35)*(p.dt==='stall'?Math.pow(env,.3):env)+N(0,1); /* 겨울(1월 1일) 성장. 일부는 스프링·마무리캠프로 옮겼다(WINTER_F) */ /* 정체형: 환경을 아무리 갖춰 줘도 효과가 작다 */
    // 잠재력 변화: 정체형은 해마다 깎이고, 많이 뛰고 좋은 시설이면 가끔 터진다
    if(p.dt==='stall')p.pot-=rnd(.5,2.5);
    if(R()<.05*play*fac.g)p.pot+=ri(3,7);
    if(!p.foreign&&age<=24&&p.pot<54&&p.draft&&p.draft.rd>=3&&R()<.07*play*pg){ const up=ri(4,9); p.pot+=up; if(p.team===G.user)story(p,`${G.year} 하위 지명의 반란: 잠재력이 눈에 띄게 올랐다`); } /* 하위 지명 선수도 기대 이상으로 크는 사례(커뮤니티 피드백 11-07) */
    if(R()<(p.dt==='stall'?.12:.05))p.pot-=ri(3,8);
    if(p.dt==='late'&&age>=27)p.pot+=rnd(0,1.5);
    if(T.vl&&svc!=='현역'&&age>=30&&gap>=3&&R()<.22*pg){ base+=gap*rnd(.35,.7); p.boomY=G.year+1; story(p,`${G.year} ${age}세에 늦깎이로 터짐`); } /* 30대 초반에 터지는 대기만성형 */
  } else if(age<=T.peak){ base=N(.15,1.1)+(p.dt==='late'?gap*.25*play*fac.g*pg:0); }
  else { base=-(age-T.fall+1)*.6*fac.d*(club&&G.coach?1.15-.15*coachDevMult(p):1)-.2+N(0,1.1); base=Math.max(base,age<=36?-2.4:-3.6)-(age>=37?.8:0); if(age<T.fall)base=N(-.2,1); }
  /* 해마다 같은 방향으로 크지 않는다: 11%는 퇴보(슬럼프·나쁜 습관·폼 붕괴), 6%는 각성. 정체형은 퇴보가 더 잦다.
     퇴보해도 잠재력은 남아 있어서 젊으면 다음 해에 일부 되찾는다 */
  if(age<=33&&!p.foreign){ const x=R(), st=p.dt==='stall'; const pr=p.pers.pro; const dn=(st?.17:.11)+Math.max(0,10-pr)*.012, up=(st?.02:.06)*(pr>=14?1.3:pr<=7?.6:1); /* 프로의식이 낮으면 퇴보가 잦고 각성은 드물다 */
    if(x<dn){ const s=-rnd(1.5,4.5); base+=s; p.slumpY=G.year+1; p.devLog.reasons.push('slump'); } else if(x<dn+up){ base+=rnd(1.5,4); p.boomY=G.year+1; } }
  /* FA로이드: FA를 한 해 앞둔 첫 FA 후보는 동기부여로 한 번 더 큰다(대어가 시장에 나오게) */
  if(!p.foreign&&p.team!=null&&p.lastFA==null&&p.svc===faSvc(p)-1&&age>=23&&age<=33&&age>T.grow)base+=rnd(.4,1.8)*play;
  const tc=svc?(delete p.trD,null):typeof trnCost==='function'?trnCost(p):null; /* 복무 중 겨울에는 입대 전 집중 훈련 비용을 매기지 않는다(검수 11-09zy) */ /* 훈련 방향 비용: 한 항목에 집중한 만큼 다른 항목의 성장 기회가 준다 */
  const stam0=(p.isP?p.r.sta:p.r.vit)??50; initPers(p); const agK=clamp(1-(stam0-50)*.012-((p.pers.pro??10)-10)*.025,.55,1.4); /* 노화 하락 폭: 체력이 높고 프로의식이 강하면 덜 떨어진다(사용자 11-08). 부상 후유증 하락은 따로(injury) */
  for(const k in p.r){
    let dk=base+N(0,(p.foreign?2.2:1.0)*(k==='eye'||k==='ctl'?.6:1));
    if(age>=T.fall-1){ // 노화: 신체 능력이 먼저 떨어진다
      dk-=PHYS[k]*(age-T.fall+2)*.24*fac.d;
      if(p.dt==='vet'&&PHYS[k]<=0&&age<=36)dk=Math.abs(dk)*.5+rnd(.3,1.3); // 기술형: 컨택·선구안·제구는 오히려 는다
    }
    if(dk>0&&club)dk*=coachToolMult(p,k);
    if(svc==='현역')dk=Math.min(dk,0); /* 현역: 야구를 하지 못해 늘지 않는다(아래에서 조금씩 떨어진다) */
    if(tc&&tc[k]&&dk>0){dk=Math.max(0,dk-tc[k]);if(!p.devLog.reasons.includes('training-opportunity'))p.devLog.reasons.push('training-opportunity');} /* 성장 기회만 줄인다. 이미 퇴보 중인 능력은 더 깎지 않는다. */
    if(dk<0&&age>=T.fall-1&&svc!=='현역'){dk*=agK;if(!p.devLog.reasons.includes('aging'))p.devLog.reasons.push('aging');}
    if(dk<0&&age>=T.fall-1&&svc!=='현역'&&!p.foreign){ const h=dk*.5; dk-=h; (p.declP=p.declP||{})[k]=(p.declP[k]||0)+h; } /* 노화 하락은 절반만 새해에, 나머지는 6월 1일에: 겨울에 영입한 베테랑이 계약 직후 한꺼번에 무너지지 않게(커뮤니티 피드백 11-08) */
    p.r[k]=clamp(p.r[k]+dk,20,80);
  }
  if(svc==='현역')p.devLog.reasons.push('military');
  if(svc==='현역')for(const k in p.r)p.r[k]=clamp(p.r[k]-rnd(.5,2.2),20,80);
  roundR(p);
  if(ovr(p)>potCap()+.05)setOvr(p,potCap()); /* 잠재력 돌파는 없다 */
  const no=ovr(p);
  // 성장 구간이 끝나면 터지지 않은 잠재력은 사라진다
  if(age>=T.grow)p.pot=Math.min(p.pot,no+Math.max(0,(T.grow+3-age))*1.5+1+(T.vl?2:0));
  p.pot=clamp(Math.max(p.pot,no),20,80);if(p.pot<potBefore)p.devLog.reasons.push('potential-reassessment');
  if(p.isP&&base>0&&svc!=='현역')p.velo+=N(.2,.4); if(age>=T.fall)p.velo-=.4+(p.dt==='vet'?.2:0);
  (p.oh=p.oh||[]).push({y:G.year,o:Math.round(no)}); if(p.oh.length>12)p.oh.shift();
  p.age++;
}
function dtHint(p,sd){ // 스카우트·코치진이 보는 성장 유형 (정확도는 평가 오차에 따름)
  if(!p.dt||sd>6.5)return null;
  const wrong=hn('dt'+p.id,G.year)*sd>5.2; const k=wrong?rollDTfix(p):p.dt;
  return {early:'일찍 완성되는 유형으로 봅니다. 20대 후반부터 하락에 대비해야 합니다.',late:'늦게 꽃피는 대기만성형으로 봅니다. 20대 중반 이후에도 기다릴 가치가 있습니다.',stall:'성장이 정체될 우려가 있습니다. 재능만큼 크지 못할 수 있습니다.',vet:'신체 능력은 떨어져도 기술로 버티는 유형입니다. 30대에도 경쟁력을 유지할 것으로 봅니다.',norm:null}[k]; }
function rollDTfix(p){ return ['norm','early','late','stall','vet'][Math.floor(u01('dtw',p.id)*5)]; }
