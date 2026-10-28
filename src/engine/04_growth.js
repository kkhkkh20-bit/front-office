/* ===== 성장과 노화 ===== */
/* ===== 성장과 노화 =====
 성장 유형(숨김): norm 정상형, early 조기 완성형, late 대기만성형, stall 정체형, vet 기술형(신체는 늙어도 기술이 는다)
 성장 속도 = 남은 잠재력 × 유형별 나이 곡선 × 출전 시간 × 훈련 시설 × 감독 육성 성향 */
const DT={norm:{l:'정상 성장형',grow:27,peak:31,fall:32},early:{l:'조기 완성형',grow:24,peak:28,fall:30},late:{l:'대기만성형',grow:29,peak:33,fall:34},stall:{l:'정체형',grow:25,peak:29,fall:31},vet:{l:'기술형 베테랑',grow:27,peak:31,fall:32}};
const PHYS={vit:.9,con:.1,pow:.5,eye:-.3,spd:.9,def:.5,stf:.6,ctl:-.2,sta:.7}; // 나이 들 때 신체 의존도(높을수록 먼저 떨어짐)
function rollDT(){ const x=R(); return x<.52?'norm':x<.64?'early':x<.76?'late':x<.89?'stall':'vet'; }
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
    const env=play*fac.g*yf*(G.coach?coachDevMult(p):1)*mpickMult(p); base=gap*rate*rnd(.65,1.35)*(p.dt==='stall'?Math.pow(env,.3):env)+N(0,1); /* 정체형: 환경을 아무리 갖춰 줘도 효과가 작다 */
    // 잠재력 변화: 정체형은 해마다 깎이고, 많이 뛰고 좋은 시설이면 가끔 터진다
    if(p.dt==='stall')p.pot-=rnd(.5,2.5);
    if(R()<.05*play*fac.g)p.pot+=ri(3,7);
    if(R()<(p.dt==='stall'?.12:.05))p.pot-=ri(3,8);
    if(p.dt==='late'&&age>=25)p.pot+=rnd(0,1.5);
  } else if(age<=T.peak){ base=N(.15,1.1)+(p.dt==='late'?gap*.25*play*fac.g:0); }
  else { base=-(age-T.fall+1)*.6*fac.d*(G.coach?1.15-.15*coachDevMult(p):1)-.2+N(0,1.1); base=Math.max(base,age<=35?-2.4:-3.4); if(age<T.fall)base=N(-.2,1); }
  /* 해마다 같은 방향으로 크지 않는다: 11%는 퇴보(슬럼프·나쁜 습관·폼 붕괴), 6%는 각성. 정체형은 퇴보가 더 잦다.
     퇴보해도 잠재력은 남아 있어서 젊으면 다음 해에 일부 되찾는다 */
  if(age<=31&&!p.foreign){ const x=R(), st=p.dt==='stall'; const dn=st?.17:.11, up=st?.02:.06;
    if(x<dn){ const s=-rnd(1.5,4.5); base+=s; p.slumpY=G.year+1; } else if(x<dn+up){ base+=rnd(1.5,4); p.boomY=G.year+1; } }
  /* FA로이드: FA를 한 해 앞둔 첫 FA 후보는 동기부여로 한 번 더 큰다(대어가 시장에 나오게) */
  if(!p.foreign&&p.team!=null&&p.lastFA==null&&p.svc===faSvc(p)-1&&age>=23&&age<=31&&age>T.grow)base+=rnd(.4,1.8)*play;
  for(const k in p.r){
    let dk=base+N(0,(p.foreign?2.2:1.0)*(k==='eye'||k==='ctl'?.6:1));
    if(age>=T.fall-1){ // 노화: 신체 능력이 먼저 떨어진다
      dk-=PHYS[k]*(age-T.fall+2)*.24*fac.d;
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
