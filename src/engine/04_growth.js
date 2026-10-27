/* ===== 성장과 노화 ===== */
/* ===== 성장과 노화 =====
 성장 유형(숨김): norm 정상형, early 조기 완성형, late 대기만성형, stall 정체형, vet 기술형(신체는 늙어도 기술이 는다)
 성장 속도 = 남은 잠재력 × 유형별 나이 곡선 × 출전 시간 × 훈련 시설 × 감독 육성 성향 */
const DT={norm:{l:'정상 성장형',grow:27,peak:30,fall:31},early:{l:'조기 완성형',grow:24,peak:27,fall:29},late:{l:'대기만성형',grow:29,peak:32,fall:33},stall:{l:'정체형',grow:25,peak:29,fall:30},vet:{l:'기술형 베테랑',grow:27,peak:30,fall:31}};
const PHYS={vit:.9,con:.1,pow:.5,eye:-.3,spd:.9,def:.5,stf:.6,ctl:-.2,sta:.7}; // 나이 들 때 신체 의존도(높을수록 먼저 떨어짐)
function rollDT(){ const x=R(); return x<.52?'norm':x<.64?'early':x<.76?'late':x<.89?'stall':'vet'; }
const FAC=[null,{l:'낡은 시설',g:.88,d:1.1},{l:'기본 시설',g:.94,d:1.05},{l:'중급 시설',g:1,d:1},{l:'최신 시설',g:1.06,d:.95},{l:'최고 수준 시설',g:1.12,d:.9}];
const FAC_COST=[0,0,1200,2500,4500,7000], FAC_UPKEEP=[0,80,160,280,450,700], FAC_DAYS=[0,0,120,150,180,210];
const facLv=tid=>tid===G.user?((G.fac&&G.fac.lv)||2):(G.teams[tid].fac||3);
/* 세부 시설: 실제 구단 2군 훈련장·재활센터·트래킹 장비 투자를 항목별로 나눈다. 단계 0~3 */
const FACI={
  indoor:{l:'실내 연습장',lv:['없음','간이 실내 연습장','실내 연습장','실내 훈련동'],c:[0,1500,4000,8000],days:[0,120,180,240],up:[0,40,90,160],d:'비·한겨울에도 훈련합니다. 모든 선수의 성장이 조금씩 빨라집니다.'},
  weight:{l:'웨이트·컨디셔닝',lv:['없음','기본 웨이트장','컨디셔닝 센터','퍼포먼스 센터'],c:[0,600,1500,3000],days:[0,60,90,120],up:[0,30,60,110],d:'근력·유연성을 관리합니다. 부상이 줄고 30대 선수의 하락이 느려집니다.'},
  rehab:{l:'재활·회복 센터',lv:['없음','물리치료실','재활센터(수중 치료)','회복 센터(냉각·수면 관리)'],c:[0,800,2000,4000],days:[0,60,90,150],up:[0,30,70,120],d:'부상 복귀가 빨라지고 시즌 중 피로가 더 빨리 풀립니다.'},
  lab:{l:'피칭·타격 랩',lv:['없음','랩소도·영상 장비','트래킹 랩(고속 카메라)','바이오메카닉스 랩'],c:[0,500,1500,3500],days:[0,30,60,90],up:[0,40,90,180],d:'투구·스윙을 측정해 고칩니다. 젊은 선수의 성장이 빨라지고, 트래킹 분석원이 있으면 효과가 커집니다.'},
  fut:{l:'2군 구장',lv:['낡은 공용 구장','천연잔디 교체','조명·불펜·라커룸 개선','2군 전용 구장'],c:[0,2000,5000,10000],days:[0,150,210,300],up:[0,50,100,180],d:'2군 경기 환경입니다. 2군에서 뛰는 시간이 성장에 더 많이 인정되고 2군 부상이 줄어듭니다.'},
  dorm:{l:'선수 숙소·식당',lv:['없음','기숙사','기숙사·영양 식당','선수촌'],c:[0,1000,2500,5000],days:[0,120,180,240],up:[0,30,60,100],d:'젊은 선수의 생활과 영양을 관리합니다. 23세 이하 선수 성장과 기분이 좋아집니다.'}};
const FACK=Object.keys(FACI);
/* 구단 버스: 원정 경기 피로. 다른 구단은 우등 버스 기준 */
const BUS=[{l:'일반 버스',f:.10,c:0,up:0},{l:'우등 버스',f:.02,c:250,up:40},{l:'리무진 버스',f:-.06,c:600,up:100}];
function busLv(tid){ if(tid!=null&&tid!==G.user)return 1; return G.bus!=null?G.bus:1; }
function buyBus(lv){ lv=+lv; if(!BUS[lv]||lv<=busLv())return '지금보다 좋은 버스만 살 수 있습니다.'; const t=team(G.user); const c=BUS[lv].c; if(t.cash<c)return `보유 현금이 부족합니다(${money(c)} 필요).`; t.cash-=c; G.bus=lv; addLog(`구단 버스를 ${BUS[lv].l}(으)로 바꿨습니다(${money(c)}).`); return ''; }
function facInit(){ G.fac=G.fac||{lv:2,build:null}; if(!G.fac.it){ const b=clamp(Math.round(((G.fac.lv||2)-1)*.75),0,3); G.fac.it={}; for(const k of FACK)G.fac.it[k]=k==='lab'?Math.max(0,b-1):b; if(G.fac.build){ for(const k of FACK)G.fac.it[k]=Math.min(3,G.fac.it[k]+1); G.fac.build=null; } G.fac.bld={}; } G.fac.bld=G.fac.bld||{}; facRecalc(); }
function facRecalc(){ const it=G.fac.it; const avg=sum(FACK.map(k=>it[k]))/FACK.length; G.fac.lv=clamp(Math.round(1+avg*4/3),1,5); }
function facUpkeep(){ const bu=BUS[busLv()].up; if(!G.fac||!G.fac.it)return FAC_UPKEEP[facLv(G.user)]+bu; return sum(FACK.map(k=>FACI[k].up[G.fac.it[k]]))+bu; } /* 버스 운영비 포함 */
function facOf(k){ return G.fac&&G.fac.it?G.fac.it[k]||0:1; }
/* 성장·노화 배수: 우리 팀은 세부 시설, 다른 구단은 종합 등급 */
function facEff(p){ if(p.team!==G.user||!G.fac||!G.fac.it)return FAC[p.team!=null?facLv(p.team):2];
  const young=p.age<=23; const futP=(()=>{ const a=seasonTotal(p,G.year,'1군'), f=seasonTotal(p,G.year,'퓨처스'); return f&&(!a||(p.isP?(f.outs||0)>(a.outs||0):(f.pa||0)>(a.pa||0))); })();
  const g=.94+facOf('indoor')*.012+facOf('lab')*.015*(1+anaPow('trk')*.08)+(young?facOf('dorm')*.015:0)+(futP?facOf('fut')*.02:0);
  const d=1.05-facOf('weight')*.03-facOf('rehab')*.015;
  return {l:`세부 시설(종합 ${G.fac.lv}단계)`,g:Math.round(g*1000)/1000,d:Math.round(d*1000)/1000}; }
function buildFacItem(k){ facInit(); const F=FACI[k]; if(!F)return '없는 시설입니다.'; const lv=G.fac.it[k]; if(lv>=3)return '이미 최고 단계입니다.'; if(G.fac.bld[k])return '이미 공사 중입니다.'; if(Object.keys(G.fac.bld).length>=2)return '공사는 동시에 2곳까지만 할 수 있습니다.';
  const c=F.c[lv+1]; const t=team(G.user); if(t.cash<c)return `보유 현금이 부족합니다. 공사비 ${money(c)}가 필요합니다(보유 ${money(t.cash)}).`;
  t.cash-=c; G.spend.facB=(G.spend.facB||0); G.fac.bld[k]={lv:lv+1,done:G.day+F.days[lv+1],c}; addLog(`${F.l} ${F.lv[lv+1]} 공사를 시작했습니다(공사비 ${money(c)}, ${F.days[lv+1]}일).`); t.trust=clamp(t.trust+1,0,100); return ''; }
function facDaily(){ if(!G.fac||!G.fac.bld)return; for(const k of Object.keys(G.fac.bld)){ const b=G.fac.bld[k]; if(G.day>=b.done){ G.fac.it[k]=b.lv; delete G.fac.bld[k]; facRecalc(); mail('육성팀',`${FACI[k].l} 완공: ${FACI[k].lv[b.lv]}`,`${FACI[k].l}이(가) ${b.lv}단계(${FACI[k].lv[b.lv]})로 완공됐습니다. ${FACI[k].d} 연 유지비는 ${money(FACI[k].up[b.lv])}입니다.`,{kind:'시설',acts:[{l:'시설 보기',a:'go',v:'staff:fac'}]}); } } }
function playShare(p){ // 지난 시즌 출전 비중: 1군은 그대로, 2군는 60%만 인정
  const y=G.year; const a=seasonTotal(p,y,'1군'), f=seasonTotal(p,y,'퓨처스'); const fw=.6+(p.team===G.user?facOf('fut')*.05:0); /* 2군 구장이 좋을수록 2군 출전을 더 인정 */
  if(p.isP){ const o=(a?a.outs:0)+(f?f.outs:0)*fw; return o>=420?1.15:o>=300?1.08:o>=180?1:o>=90?.92:.8; }
  const pa=(a?a.pa:0)+(f?f.pa:0)*fw; return pa>=450?1.15:pa>=320?1.08:pa>=200?1:pa>=100?.92:.8; }
function develop(p){
  if(!p.dt)p.dt=rollDT(); const T=DT[p.dt]; const o=ovr(p); const age=p.age;
  const svc=p.mil&&p.mil.until&&p.mil.from<=G.day&&p.mil.until>G.day?p.mil.unit:null;
  const play=svc==='현역'?.55:svc==='상무'?1:p.team!=null?playShare(p):.85, fac=p.team!=null?facEff(p):FAC[2];
  const yf=p.team!=null&&G.mgr?1+(mgrOf(p.team).youth-50)/150:1;
  p.devLog={y:G.year,play,fac:fac.l};
  const gap=Math.max(0,p.pot-o); let base=0;
  if(age<=T.grow){
    const rate=p.dt==='early'?(age<=22?.34:.24):p.dt==='late'?(age<=24?.08:.26):p.dt==='stall'?.07:.2;
    base=gap*rate*rnd(.65,1.35)*play*fac.g*yf*(G.coach?coachDevMult(p):1)*mpickMult(p)+N(0,1);
    // 잠재력 변화: 정체형은 해마다 깎이고, 많이 뛰고 좋은 시설이면 가끔 터진다
    if(p.dt==='stall')p.pot-=rnd(.5,2.5);
    if(R()<.05*play*fac.g)p.pot+=ri(3,7);
    if(R()<(p.dt==='stall'?.12:.05))p.pot-=ri(3,8);
    if(p.dt==='late'&&age>=25)p.pot+=rnd(0,1.5);
  } else if(age<=T.peak){ base=N(.15,1.1)+(p.dt==='late'?gap*.25*play*fac.g:0); }
  else { base=-(age-T.fall+1)*.85*fac.d*(G.coach?1.15-.15*coachDevMult(p):1)-.2+N(0,1.1); if(age<T.fall)base=N(-.2,1); }
  /* FA로이드: FA를 한 해 앞둔 첫 FA 후보는 동기부여로 한 번 더 큰다(대어가 시장에 나오게) */
  if(!p.foreign&&p.team!=null&&p.lastFA==null&&p.svc===faSvc(p)-1&&age>=23&&age<=31&&age>T.grow)base+=rnd(.4,1.8)*play;
  for(const k in p.r){
    let dk=base+N(0,(p.foreign?2.2:1.0)*(k==='eye'||k==='ctl'?.6:1));
    if(age>=T.fall-1){ // 노화: 신체 능력이 먼저 떨어진다
      dk-=PHYS[k]*(age-T.fall+2)*.35*fac.d;
      if(p.dt==='vet'&&PHYS[k]<=0&&age<=34)dk=Math.abs(dk)*.5+rnd(.3,1.3); // 기술형: 컨택·선구안·제구는 오히려 는다
    }
    p.r[k]=clamp(p.r[k]+dk,20,80);
  }
  if(svc==='현역')for(const k in p.r)p.r[k]=clamp(p.r[k]-rnd(.5,2.2),20,80);
  roundR(p);
  const no=ovr(p);
  // 성장 구간이 끝나면 터지지 않은 잠재력은 사라진다
  if(age>=T.grow)p.pot=Math.min(p.pot,no+Math.max(0,(T.grow+3-age))*1.5+1);
  p.pot=clamp(Math.max(p.pot,no),20,80);
  if(p.isP&&base>0)p.velo+=N(.2,.4); if(age>=T.fall)p.velo-=.4+(p.dt==='vet'?.2:0);
  (p.oh=p.oh||[]).push({y:G.year,o:Math.round(no)}); if(p.oh.length>12)p.oh.shift();
  p.age++;
}
function dtHint(p,sd){ // 스카우트·코치진이 보는 성장 유형 (정확도는 평가 오차에 따름)
  if(!p.dt||sd>6.5)return null;
  const wrong=hn('dt'+p.id,G.year)*sd>5.2; const k=wrong?rollDTfix(p):p.dt;
  return {early:'일찍 완성되는 유형으로 봅니다. 20대 후반부터 하락에 대비해야 합니다.',late:'늦게 꽃피는 대기만성형으로 봅니다. 20대 중반 이후에도 기다릴 가치가 있습니다.',stall:'성장이 정체될 우려가 있습니다. 재능만큼 크지 못할 수 있습니다.',vet:'신체 능력은 떨어져도 기술로 버티는 유형입니다. 30대에도 경쟁력을 유지할 것으로 봅니다.',norm:null}[k]; }
function rollDTfix(p){ return ['norm','early','late','stall','vet'][Math.floor(u01('dtw',p.id)*5)]; }
