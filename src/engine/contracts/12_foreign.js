/* ===== 외국인 선수 ===== */
/* KBO: 시즌 중 교체 외국인은 남은 기간 월 10만 달러까지. 지급은 남은 경기 비율(remainFrac)이라 연봉 기준 60만 달러(6개월)로 묶는다. shortcut: 시즌 6개월 고정 — 일정 길이가 바뀌면 남은 달 수로 */
const fNewCap=()=>period()==='season'?Math.min(F_NEW_CAP,60*USD):F_NEW_CAP;
function fAsk(p,o){ o=o??ovr(p); if(p.foreign==='아시아')return clamp(round5(100+(o-44)*16),100,ASIA_CAP); return clamp(round5(560+(o-46)*42),400,fNewCap()); } /* 신규 용병 요구액: 능력 55 약 67만, 60 약 82만, 64 이상은 상한 100만 달러 근처(실제 KBO 신규 외국인 계약 대부분이 상한 가까이) */
function wpick(ws){ let tot=0; for(const k in ws)tot+=ws[k]; let x=R()*tot; for(const k in ws){ x-=ws[k]; if(x<=0)return k; } return Object.keys(ws)[0]; }
/* 외국인 후보는 두 경로로 나온다.
   에이전트 제안: 리그 전체에 돌리는 공용 후보. 대부분 트리플A 출신(MLB 콜업 경력이 있는 선수가 많다)이고, 이름값 있는 선수는 이유(부상·나이·적응)가 있다.
   스카우트 발굴: 구단 스카우트가 직접 찾은 선수. 처음엔 찾은 구단만 알고, 시간이 지나면 소문이 나서 다른 구단도 알게 된다.
   해외 스카우트망과 파견 스카우트 수준이 높을수록 더 자주, 더 좋은 선수를 찾는다 */
const FFLAW={inj:'부상 이력',age:'나이 많음',adapt:'적응 우려'};
/* 직전 리그 수준 보정(KBO=0). [타자, 투수]: 양수면 KBO보다 쉬운 리그라 같은 선수도 성적이 좋게 나온다.
   KBO는 트리플A보다 살짝 아래로 본다. 기준(능력 60, 고치기 전 수치): 타자 OPS 트리플A .85 · 더블A .92 · MLB .72(MLE 더블A→MLB 약 0.78배),
   투수 ERA 트리플A 3.6 · 더블A 2.9 · MLB 5.2 안팎. 멕시코리그·CPBL은 타고투저, NPB 2군은 투고타저 */
const LG_ADJ={'MLB':[-12,-26],'트리플A':[-1,-2],'더블A':[7,13],'독립리그':[8,15],'멕시코리그':[8,-4],'도미니카 윈터리그':[3,5],'베네수엘라 윈터리그':[3,5],
  'NPB 1군':[-7,-12],'NPB 2군':[-1,6],'일본 독립리그':[8,14],'CPBL':[7,2],'ABL':[9,11]};
/* 화면에 보여 줄 리그 수준(KBO 기준). 같은 성적이라도 위쪽 리그 선수가 더 좋은 선수다 */
const LG_LV={'MLB':['우리 리그보다 훨씬 높음','같은 성적이면 훨씬 좋은 선수입니다. 다만 출전이 적어 표본이 작습니다.'],'트리플A':['우리 리그보다 살짝 높음','같은 성적이면 우리 리그에서 조금 더 잘합니다. 기록을 가장 믿을 만한 리그라 스카우트가 먼저 찾습니다.'],
  'NPB 1군':['우리 리그보다 높음','같은 성적이면 더 좋은 선수입니다. 투고타저 리그라 투수 성적은 조금 깎아서 보세요.'],'NPB 2군':['우리 리그와 비슷(투고타저)','타자 성적은 조금 얹어서, 투수 성적은 깎아서 보세요.'],
  '도미니카 윈터리그':['우리 리그보다 조금 낮음','성적을 조금 깎아서 보세요. 짧은 시즌에 구장·상대 차이가 커서 기록이 실력과 자주 어긋납니다.'],'베네수엘라 윈터리그':['우리 리그보다 조금 낮음','성적을 조금 깎아서 보세요. 짧은 시즌에 구장·상대 차이가 커서 기록이 실력과 자주 어긋납니다.'],
  'CPBL':['우리 리그보다 낮음(타고투저)','타자 성적은 크게 깎아서 보세요. 투수 성적은 리그 타고 탓에 덜 깎아도 됩니다.'],
  '더블A':['우리 리그보다 낮음','성적을 꽤 깎아서 보세요. 같은 성적이라도 트리플A·MLB 선수보다 약합니다.'],'멕시코리그':['우리 리그보다 낮음(극단적 타고투저)','타자 성적은 크게 깎아서 보세요. 투수는 ERA가 높아도 실력이 나쁘지 않을 수 있습니다. 고지대 구장이 많아 기록이 실력과 자주 어긋납니다.'],
  '독립리그':['우리 리그보다 많이 낮음','성적을 크게 깎아서 보세요. 상대 수준이 들쭉날쭉해 기록을 믿기 어렵습니다.'],'일본 독립리그':['우리 리그보다 많이 낮음','성적을 크게 깎아서 보세요.'],'ABL':['우리 리그보다 많이 낮음','성적을 크게 깎아서 보세요.']};
const lgLv=l=>(LG_LV[l]||['',''])[0];
/* 리그 환경 편차(기록이 실력에서 얼마나 흔들리는가, 능력 척도) */
const FENV={'MLB':1,'트리플A':1,'더블A':1.5,'독립리그':3,'멕시코리그':3.5,'도미니카 윈터리그':3.5,'베네수엘라 윈터리그':3.5,'NPB 1군':1.5,'NPB 2군':2,'일본 독립리그':2.5,'CPBL':2.5,'ABL':3};
function newForeign(kind,opts){
  opts=opts||{};
  const asia=kind==='아시아'; const src=opts.src||(opts.market?'agent':null); const flv=opts.flv||0; const mineFind=src==='scout'&&opts.finder===G.user;
  const reg=opts.reg||(asia?(mineFind?wpick({jp:.4+2*intlLv('jp'),tw:.3+2*intlLv('tw'),au:.3+2*intlLv('au')}):pick(['jp','jp','tw','au'])):(mineFind?wpick({us:.6+2*intlLv('us'),la:.4+2*intlLv('la')}):pick(['us','us','us','la'])));
  const nk=reg==='la'?pick(['la','la','ve']):reg;
  const isP=opts.isP??(R()<.65);
  let base=asia?clamp(N(48.5,4),40,60):reg==='la'?clamp(N(52,5),43,66):clamp(N(54,5),44,69); /* 중남미 리그(멕시코·윈터리그) 후보는 대개 트리플A에서 밀려난 선수라 평균이 조금 낮고 최상위가 드물다 */
  if(src==='scout')base=clamp(base+flv*1.3+(R()<.07*flv?ri(3,6):0),40,72);
  /* 리그 수준 보정은 LG_ADJ(타자·투수 따로). 일본은 1군·2군·독립리그로 나눈다 */
  const lvl=[asia?{jp:wpick({'NPB 1군':.1,'NPB 2군':.55,'일본 독립리그':.35}),tw:'CPBL',au:'ABL'}[reg]:reg==='la'?pick(['멕시코리그','도미니카 윈터리그','베네수엘라 윈터리그']):{AAA:'트리플A',AA:'더블A',IND:'독립리그',MLB:'MLB'}[wpick({AAA:6,AA:1.2,IND:.6,MLB:src==='scout'?.2:.45})]];
  lvl.push(...LG_ADJ[lvl[0]]);
  if(lvl[0]==='NPB 1군')base=clamp(base+5,40,66); if(lvl[0]==='일본 독립리그')base=clamp(base-1.5,40,60);
  if(lvl[0]==='더블A'||lvl[0]==='독립리그')base=clamp(base-2.5,40,72); if(lvl[0]==='MLB')base=clamp(base+2,44,72); /* KBO 시장 후보는 트리플A가 중심이고, 더블A·독립리그 출신은 드물고 한 수 아래다. MLB에서 뛰던 선수는 평균이 조금 높다 */
  if(asia&&base>54)base=54+(base-54)*.5; /* 아시아쿼터(연봉 상한 20만 달러): 대부분 평범하고 용병보다 센 선수는 아주 드물게(커뮤니티 제안 11-11) */
  if(base>59)base=59+(base-59)*.55; /* 최상위 꼬리를 눌러 '폰세급' 에이스가 해마다 나오지 않게: 화면 80 이상은 몇 해에 한 번(커뮤니티 피드백 11-08) */
  /* 좋아 보이는 선수일수록 이유가 있다 */
  const fp=lvl[0]==='MLB'||base>=61?.7:base>=57?.28:.1; const flaw=R()<fp?pick(['inj','inj','age','adapt']):null;
  const age=flaw==='age'?ri(33,35):ri(25,32);
  /* 포지션: KBO 외국인 타자는 거포 1루수·코너 외야수가 대부분이고, 2루·유격·포수는 드물다(2024~25 개막 명단 기준 1루·외야가 9할 안팎).
     아시아쿼터 타자는 내야·중견수 비중이 더 높다 */
  const fpos=isP?undefined:opts.pos||wpick(asia?{'1B':14,LF:14,RF:14,CF:15,'3B':12,'2B':13,SS:13,C:5}:{'1B':28,LF:21,RF:21,CF:13,'3B':10,'2B':4,SS:3,C:.5});
  const p=newPlayer({age,isP,base,pos:fpos,pot:base+(age<28?ri(0,3):0),team:opts.team??null,foreign:asia?'아시아':'용병',nat:FN[nk].nat,name:genFName(nk)});
  /* 외국인 타자는 장타로 뽑는다: 1루·코너 외야·3루는 더 거포 쪽, 중견·2루·유격·포수는 수비·컨택 쪽(거포가 드물다). 종합 능력은 거의 그대로 */
  if(!isP&&!asia){ const b=(k,d)=>p.r[k]=clamp(p.r[k]+d,20,80); if(['1B','LF','RF','3B'].includes(fpos)){ b('pow',5); b('con',-1); b('def',-3); b('spd',-2); } else { b('pow',-4); b('def',2); b('con',2); } roundR(p); }
  /* 실전 감각(숨은 값): 툴(능력치 측정)로는 안 보이고 경기 기록에만 묻어나는 부분. 스카우트는 툴을 보고, 기록은 실전을 보여 준다.
     그래서 스카우트 평가만 믿으면 '툴은 좋은데 실전에서 약한 선수'를 고르기도 하고, 기록을 잘 읽으면 스카우트가 낮게 본 진짜를 건진다 */
  { const sx=Math.round(clamp(N(0,3.2),-6,6)*10)/10; if(sx){ for(const k in p.r)p.r[k]=clamp(p.r[k]+sx,20,80); p.pot=clamp(p.pot+sx,20,80); roundR(p); } p.sx=sx; }
  p.orig=reg; p.adapt=Math.round(clamp(N(50,13),20,80)); if(flaw==='adapt')p.adapt=ri(16,30); if(flaw==='inj')p.inj=clamp(.3+R()*.12,.3,.42); if(flaw)p.flaw=flaw;
  p.prevLvl=lvl[0];
  /* MLB 출신은 대부분 백업·콜업 선수라 출전이 적다(경기 수와 타석·이닝을 맞춘다) */
  const mlb=lvl[0]==='MLB'; const mg=mlb?(isP?ri(10,32):ri(25,80)):0;
  /* 리그 환경 편차: 구장·공인구·상대 수준이 들쭉날쭉한 리그일수록 같은 실력이라도 기록이 크게 흔들린다(트리플A·MLB 기록이 가장 믿을 만하다) */
  const env=N(0,FENV[lvl[0]]??2), win=/윈터리그/.test(lvl[0]); /* 윈터리그는 시즌이 짧아 표본도 작다 */
  p.prev=isP?Object.assign({lvl:lvl[0]},simPit(p,mlb?Math.round(mg*rnd(2.6,4.2)):win?ri(90,200):ri(150,420),lvl[2]+env*1.6)):Object.assign({lvl:lvl[0]},simBat(p,mlb?Math.round(mg*rnd(2.4,3.6)):win?ri(150,260):ri(280,520),lvl[1]+env));
  p.prev.g=mlb?mg:isP?(win?ri(10,22):ri(18,40)):Math.round(p.prev.pa/4.1);
  /* 메이저 경력(통산 경기 수): 실력이 좋을수록 콜업 경험이 많다. KBO 구단이 MLB 경력을 반기는 데에는 이유가 있다 */
  { const o0=ovr(p); let g=0; if(mlb)g=mg+(R()<.5?ri(0,120):0);
    else if(!asia){ const ch=lvl[0]==='트리플A'?clamp(.12+(o0-52)*.045,.04,.75):lvl[0]==='더블A'?.04:clamp(.06+(o0-52)*.02,.02,.3); if(R()<ch)g=Math.round(ri(4,60)*(1+Math.max(0,o0-52)*.08)); }
    p.mlbG=g; }
  /* 몸값은 시장이 보는 가치(기록·경력·소문)라 실제 능력과 어긋난다. 몸값만 보고 실력을 알 수는 없다 */
  p.ask=fAsk(p,ovr(p)+N(0,3.5)+(p.mlbG>=30?1.5:p.mlbG>0?.7:0)); if(reg==='la')p.ask=round5(p.ask*.8); if(lvl[0]==='MLB')p.ask=round5(Math.min(fNewCap(),p.ask*1.2)); if(flaw)p.ask=round5(p.ask*.88); p.sal=p.ask;
  if(src){ p.fsrc=src; p.fday=G.day; if(src==='scout'){ p.fknow=[opts.finder]; p.fpub=G.day+ri(14,45)-(base>=60?10:0); } else p.fpub=G.day; }
  return p;
}
/* 우리 스카우트가 직접 찾은 후보인가 */
/* 외국인 후보 조사 단계: 무엇으로 얼마나 알고 있는가.
   추정 범위(화면 점수)는 실제 능력의 약 85%가 들어가게 맞췄다(시드 8개·후보 약 5천 건 측정: 단계마다 84~86%).
   평균 폭은 조사 전 약 21점, 기초 조사 15점, 정밀 조사 12점, 확인 완료 8점 */
const FSTEP=[{l:'조사 전',cls:'bad',d:'에이전트가 보낸 영상과 기록만 봤습니다. 추정이 크게 빗나갈 수 있으니 지난 리그 기록을 더 믿으세요.'},
  {l:'기초 조사',cls:'warn',d:'현지에서 경기를 몇 번 본 수준입니다. 대략적인 수준만 압니다.'},
  {l:'현지 조사',cls:'acc',d:'현지에서 여러 번 봤습니다. 지난 리그 기록과 합쳐 판단하세요.'},
  {l:'확인 완료',cls:'good',d:'거의 정확합니다. 실전 감각 같은 숨은 변수만 남았습니다.'}];
/* 기록 해석표: 리그·투타별로 지난 리그 기록(타자 OPS, 투수 WHIP·K-BB/9·HR/9)과 MLB 통산 경기 수로 실제 능력을 추정하는 식.
   [절편, 계수…, 남는 오차]. 후보 2만 7천 명을 만들어 최소제곱으로 맞췄다(node tools/fit-frec.js. 후보 생성을 바꾸면 다시 맞춘다). 트리플A·MLB 기록이 가장 덜 흔들린다 */
const FREC={'ABL':[[27.031, 25.306, 0, 3.36],[49.783, -5.356, 0.985, -0.063, 0, 3.29]],'CPBL':[[25.32, 28.196, 0, 3.31],[50.113, -3.766, 1.062, -0.321, 0, 3.36]],'MLB':[[38.639, 27.467, -0.322, 4.16],[58.179, -0.861, 0.981, -0.554, 0.028, 3.78]],'NPB 1군':[[33.265, 29.684, 0, 3.15],[55.522, -3.131, 1.244, -0.386, 0, 2.95]],'NPB 2군':[[27.354, 31.048, 0, 3.27],[47.961, -3.449, 1.217, -0.749, 0, 3.1]],'더블A':[[24.897, 29.487, -0.094, 3.64],[50.494, -7.252, 1.323, -0.395, 0.025, 3.28]],'도미니카 윈터리그':[[33.016, 21.761, 0.754, 4.13],[50.067, -2.641, 0.993, -0.868, 0.748, 3.93]],'독립리그':[[30.831, 22.172, 0.76, 3.59],[46.813, -5.254, 1.355, -0.515, 0.785, 3.58]],'멕시코리그':[[28.923, 24.212, 0.584, 4.01],[53.853, -3.904, 0.945, -0.102, 0.722, 3.76]],'베네수엘라 윈터리그':[[33.132, 21.823, 0.95, 4.21],[52.218, -4.521, 0.953, -0.242, 0.843, 4.09]],'일본 독립리그':[[25.343, 27.255, 0, 3.45],[44.652, -3.011, 1.199, -1.162, 0, 3.37]],'트리플A':[[29.3, 29.461, 0.628, 3.29],[55.057, -5.182, 1.199, -0.566, 0.561, 3.06]]};
function fRecEst(p){ const c=(FREC[p.prevLvl]||[])[p.isP?1:0], h=p.prev; if(!c||!h)return null; const g=Math.log1p(p.mlbG||0); let x;
  if(p.isP){ if(!h.outs)return null; x=[1,(h.h+h.bb)*3/h.outs,(h.so-h.bb)*27/h.outs,h.hr*27/h.outs,g]; } else { if(!h.pa)return null; x=[1,bRate(h).ops,g]; }
  return {m:x.reduce((s,v,i)=>s+v*c[i],0),sd:c[c.length-1]}; }
const fRelL=lg=>{ const e=FENV[lg]??2; return e<=1?'믿을 만함':e<=1.5?'보통':'흔들림 큼'; };
/* 조사 단계(스카우트가 얼마나 봤나)와 종합 추정(스카우트 평가 + 기록 해석). 종합 추정은 두 정보를 믿을 만한 만큼 섞는다.
   예상 능력순은 종합 추정 그대로 줄 세운다(화면에 보이는 숫자와 순서가 같게). 얼마나 믿을지는 조사 단계와 범위로 본다 */
/* 화면에 보여 줄 종합 능력: 계약 전 외국인 후보는 목록·상세·협상 창 모두 같은 '예상'(스카우트+기록 종합)과 범위를 쓴다 */
function curView(p,rp){ rp=rp||scoutReport(p); if(p&&p.foreign&&p.team==null){ const f=fScout(p,rp); if(f.raw!=null)return {v:f.raw,est:true,lo:f.lo,hi:f.hi,sd:f.ms}; } return {v:rp?rp.cur:null,est:false,sd:rp&&!rp.exact?rp.sd:0}; }
/* 종합 평가 신뢰도: 스카우트 평가와 기록을 합친 최종 범위의 폭으로(관찰 진행률과 별개) */
function fRel(f){ const b=f&&f.band; return b==null?'판단 불가':b<=5?'매우 높음':b<=7?'높음':b<=10?'보통':'낮음'; }
function fUnknown(p,f){ const L=[]; if(f.n<3)L.push('실전 감각(현지 경기 감각)'); const lv=intlLv(origOf(p)); if(lv<2||p.adapt==null)L.push('한국 생활·리그 적응'); if(!p.prev)L.push('지난 리그 기록'); return L; }
function fScout(p,rp){ rp=rp||scoutReport(p); const sd=rp.sd||0; const n=sd>=8?0:sd>=5.5?1:sd>=3.5?2:3; const S=FSTEP[n];
  const r=origOf(p), lv=intlLv(r), isc=(G.scouts||[]).find(s=>s.role==='intl'&&s.region===r), k=fwatchK(p.id), mine=fMineFind(p);
  const bf=(lv>=3?.6:1)*(1-k/100*.6)*(mine?.6:1); const ss=Math.sqrt((sd*.55)**2+(3.2*bf)**2+2.2), sc=rp.cur, rc=fRecEst(p);
  let m=null, ms=null; if(sc!=null&&rc){ const ws=1/ss**2, wr=1/rc.sd**2; m=(sc*ws+rc.m*wr)/(ws+wr); ms=1/Math.sqrt(ws+wr); } else if(sc!=null){ m=sc; ms=ss; } else if(rc){ m=rc.m; ms=rc.sd; }
  /* 조사 전 흐림(사용자 피드백 11-09f: 처음부터 예상이 거의 정확해 하위 후보를 안 봄): 선수마다 고정된 착시를 얹고 범위도 넓힌다. 관찰 파악도·스카우트망·파견 스카우트 능력·직접 발굴로 줄어든다. 드물게 '예상 60인데 실제 70'(또는 그 반대)이 나온다 */
  const m0=m, fog=3.5*(1-k/100*.8)*(lv>=3?.5:lv>=2?.75:1)*(isc?1-(isc.skill||0)*.08:1)*(mine?.6:1); if(m!=null&&fog>.3){ m+=clamp(hn('fblur',p.id),-2.5,2.5)*fog; ms=Math.sqrt(ms**2+fog**2); }
  const mid=m==null?null:dv(m), band=m==null?null:dvSd(m,ms*1.3);
  const h=p.prev, rec=h?(p.isP?`${p.prevLvl} ${ipStr(h.outs||0)}이닝`:`${p.prevLvl} ${h.pa||0}타석`):'';
  const why=[]; if(rec)why.push(`기록: ${rec}(리그 기록 ${fRelL(p.prevLvl)})`); if(p.mlbG)why.push(`MLB 통산 ${p.mlbG}경기`);
  why.push(`스카우트: ${IREG[r].l} ${INET[lv].l}${isc?` · ${isc.name} 파견`:''}${fwatchOn(p.id)?` · 관찰 파악도 ${k}%`:''}${mine?' · 직접 발굴':''}`);
  let tip=''; if(n<3){ if(!fwatchOn(p.id))tip='관찰 명단에 올리면 매주 보고가 쌓여 범위가 좁아집니다.'; else if(k<100)tip=`관찰 중입니다. 파악도가 오를수록 범위가 좁아집니다(이 지역은 주당 약 ${3+lv*3+(isc?isc.skill*2:0)}%).`; if(lv<3)tip+=(tip?' ':'')+`${IREG[r].l} 스카우트망을 넓히거나 스카우트를 파견해도 정확해집니다.`; }
  return {n,l:S.l,cls:S.cls,d:S.d,mid,lo:mid==null?null:Math.max(20,mid-band),hi:mid==null?null:Math.min(100,mid+band),band,why,tip,
    sc:sc==null?null:dv(sc),rec:rc?dv(rc.m):null,raw:m,m0,ms,score:m==null?-99:m}; }
/* 외국인 후보 목록 정렬: {p,rp,fs} 목록에 쓴다. 예상 능력순(rk)은 종합 추정만 본다 */
function fSortBy(k){ const st=p=>{ const h=p.prev; if(!h)return -9; return p.isP?(h.outs?1.6-(h.er*27/h.outs)/5:-9):bRate(h).ops; };
  return ({stat:(a,b)=>st(b.p)-st(a.p),ask:(a,b)=>a.p.ask-b.p.ask,age:(a,b)=>a.p.age-b.p.age})[k]||((a,b)=>b.fs.score-a.fs.score); }
/* 우리만 아는 발굴 후보가 곧 다른 구단에 알려질 때·알려졌을 때 알린다(기다리는 동안 기회가 어떻게 바뀌는지) */
function fPubDaily(){ if(G.unemp)return; for(const id of (G.fmarket||[])){ const p=G.players[id]; if(!p||p.team!=null||!fMineFind(p)||p.fpub==null||!fNewsOk(p))continue; const d=p.fpub-G.day;
    if(d===3)mail('스카우트팀',`독점 발굴 후보 공개 임박: ${p.name}`,`우리 스카우트가 찾은 ${p.name}(${posLabel(p)}, ${p.age}세)을 다른 구단도 3일쯤 뒤(${dmd(p.fpub)})에 알게 됩니다. 그 전에 계약하면 경쟁 없이 협상할 수 있습니다.`,{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]});
    if(d===0)mail('스카우트팀',`${p.name} 정보가 경쟁 구단에 퍼졌습니다`,`이제 다른 구단도 ${p.name}을(를) 압니다. 관심 구단이 생기면 몸값이 오를 수 있습니다.`,{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); } }
/* 예상 종합 65 이하 후보는 소식함에 알리지 않는다: 좋은 선수가 나와야 소식(사용자 11-08) */
const fNewsOk=p=>{ try{ return (fScout(p).mid??0)>65; }catch(e){ return false; } };
function fMineFind(p){ return !!(p&&p.fsrc==='scout'&&(p.fknow||[]).includes(G.user)&&p.fknow[0]===G.user); }
/* 우리가 찾은 후보의 관찰 메모(외국인 시장 카드): 언제 찾았는지, 강점·약점, 한국 적응, 몸 상태, 다른 구단이 알게 되는 때 */
function fFindNote(p,rp){ if(!fMineFind(p))return ''; const T=(rp&&rp.tools||[]).slice().sort((a,b)=>b.cur-a.cur); const nm=k=>TOOLK[k]||k;
  const good=T.slice(0,2).filter(t=>t.cur>=55).map(t=>nm(t.k)), bad=T.slice(-1).filter(t=>t.cur<=45).map(t=>nm(t.k));
  const ad=p.adapt>=62?'적응 빠를 성격':p.adapt<=35?'적응 우려':'적응 보통'; const body=p.inj>=.3?'부상 이력 있음':p.inj>.24?'부상 체질':'몸 상태 양호'; /* 카드의 '부상 체질' 표시와 같은 기준 */
  const sec=G.day<(p.fpub||0)?`다른 구단은 ${dmd(p.fpub)}쯤 알게 됩니다`:'소문이 퍼져 다른 구단도 압니다';
  return `${p.fday!=null?dmd(p.fday)+' 발굴':'우리 발굴'} · 강점 ${good.join('·')||'두드러진 툴 없음'}${bad.length?` · 약점 ${bad.join('·')}`:''} · ${ad} · ${body} · ${sec}`; }
/* 이 구단이 이 후보를 아는가 */
function fKnows(tid,p){ return !p||p.fsrc!=='scout'||G.day>=(p.fpub||0)||(p.fknow||[]).includes(tid); }
function fScoutLv(tid){ if(tid===G.user)return null; const sd=team(tid).scoutSd||6; return clamp((9-sd)/1.6,0,3); }
/* 매주 스카우트 발굴: 우리는 스카우트망 지역에서, 다른 구단은 스카우트 수준에 따라 */
function scoutFindWeek(silent){ const o=dobj(G.day); if(!(foreignOpen()||o.m===10||o.m===11))return; G.fmarket=G.fmarket||[]; if(G.fmarket.length>=70)return; const found=[];
  if(!G.unemp){ for(const r of Object.keys(IREG)){ const lv=intlLv(r); const isc=(G.scouts||[]).find(s=>s.role==='intl'&&s.region===r); const ch=lv>=1?.13*lv+(isc?isc.skill*.04:0):.03; if(R()<ch){ const asia=IREG[r].asia; const q=newForeign(asia?'아시아':'용병',{src:'scout',finder:G.user,flv:lv+(isc?isc.skill/3:0),reg:r}); G.fmarket.push(q.id); found.push(q); } } try{ sisLeadWeek(found); }catch(e){} }
  for(const t of G.teams){ if(t.id===G.user)continue; const lv=fScoutLv(t.id); if(R()<.12+lv*.05){ const q=newForeign(R()<.25?'아시아':'용병',{src:'scout',finder:t.id,flv:lv}); G.fmarket.push(q.id); } }
  void silent; /* 발굴 소식은 보내지 않는다: 외국인 시장에서 '우리 스카우트 발굴'로 표시하고 관찰 메모를 자세히 보여 준다 */
  return found; }
function refreshFMarket(n,drop){
  /* 에이전트 공용 후보를 최소 인원으로 유지하고, 오래 팔리지 않은 후보는 시장을 떠난다(관찰 중이면 남김) */
  G.fmarket=(G.fmarket||[]).filter(id=>G.players[id]&&G.players[id].team==null); const W=new Set((G.fwatch||[]).concat(...Object.values(G.fwatchT||{})).map(w=>w&&w.id)); /* 이직 전 구단에 남겨 둔 관찰 명단도 보호(검수 11-09b) */ for(const id of G.fmarket){ const q=G.players[id]; if(q&&q.fneg&&q.fneg.dl)W.add(id); } /* 우리 답을 기다리는(협상 기한이 남았거나, 지났지만 아직 결과를 처리하지 않은) 후보도 정리·교체에서 뺀다(검수 11-09zl: 월초 정리가 마감 처리보다 먼저 돌아 삭제) */
  for(const id of [...G.fmarket]){ const q=G.players[id]; if(q.fday==null)q.fday=G.day; if(!W.has(id)&&G.day-q.fday>80){ G.fmarket=G.fmarket.filter(x=>x!==id); dropP(id); } }
  const ag=()=>G.fmarket.map(id=>G.players[id]).filter(q=>q&&q.fsrc!=='scout');
  for(let i=0;i<(drop||0);i++){ const old=ag().filter(q=>!W.has(q.id)).sort((a,b)=>a.fday-b.fday)[0]; if(!old)break; G.fmarket=G.fmarket.filter(x=>x!==old.id); dropP(old.id); }
  /* 비시즌에는 후보가 넉넉해야 고르는 재미가 있다. 창단 첫해 겨울은 10개 구단이 한꺼번에 찾으므로 더 많이 */
  const fd0=G.startY===G.year&&period()!=='season'; const min=period()==='season'?12:fd0?54:32; /* 풀을 넉넉히(사용자 피드백 11-09f) */ let g=0;
  while(ag().length<min&&g++<40){ const ps=ag(); const asiaN=ps.filter(p=>p.foreign==='아시아').length; const yb=ps.filter(p=>p.foreign==='용병'); const batN=yb.filter(p=>!p.isP).length, pitN=yb.filter(p=>p.isP).length;
    const aMin=Math.round(min*.2), bMin=Math.round(min*.3), pMin=Math.round(min*.42);
    if(asiaN<aMin)G.fmarket.push(newForeign('아시아',{market:true}).id); else if(pitN<pMin)G.fmarket.push(newForeign('용병',{isP:true,market:true}).id); else if(batN<bMin)G.fmarket.push(newForeign('용병',{isP:false,market:true}).id); else G.fmarket.push(newForeign('용병',{market:true}).id); }
}
function foreignOpen(){ const per=period(); if(per==='post')return false; if(per==='season')return G.day<=foreignDL(); return G.day>=KD(12,1)||per==='pre'; }
/* 재계약 기간에 결별하기로 한 선수는 자리를 비운 것으로 본다(계약 확정 때 떠난다). 영입 검사·영입 화면·재정 표시가 같은 기준(검수 11-09c: 결별 선수까지 4명으로 셈) */
const fDropIds=tid=>{ const C=G.contract; return tid===G.user&&C&&!C.done?(C.foreignDrop||[]):[]; };
const fStayOf=tid=>{ const d=fDropIds(tid); return foreignOf(tid).filter(x=>!d.includes(x.id)); };
function foreignCheck(tid,p,excludeId,tmp){
  if(!p||!p.foreign)return '외국인 계약 대상이 아닙니다.';
  if(p.team!=null)return '이미 소속 구단이 있는 선수입니다.';
  const held=foResFor(p); if(held&&held.tid!==tid)return `${tname(held.tid)}의 보류권이 남아 있어 계약할 수 없습니다(${held.until}년까지).`;
  if(!tmp&&period()==='season'&&fReplLeft(tid,p.foreign)<=0)return `이번 시즌 ${p.foreign==='아시아'?'아시아쿼터':'일반 외국인'} 교체 ${fReplMax(p.foreign)}회를 다 썼습니다.`;
  if(!excludeId&&rosterN(tid)-(foreignOf(tid).length-fStayOf(tid).length)>=ROSTER_MAX)return `선수단이 ${ROSTER_MAX}명이라 더 등록할 수 없습니다. 먼저 한 명을 정리하세요.`; /* 교체가 아니면 한 자리가 늘어난다. 결별하기로 한 외국인 자리는 비는 것으로 본다(검수 11-09zl) */
  const fs=fStayOf(tid).filter(x=>x.id!==excludeId);
  if(p.foreign==='아시아'){ if(fs.filter(x=>x.foreign==='아시아').length>=1)return '아시아쿼터는 1명까지입니다. 먼저 한 명을 방출하세요.'; if((p.ask||0)>ASIA_CAP)return `아시아쿼터 연봉은 ${money(ASIA_CAP)}까지입니다.`; /* 기본 계약 경로도 상한(검수 11-06) */ return ''; }
  const yb=fs.filter(x=>x.foreign==='용병');
  if(yb.length>=3)return '외국인 선수(아시아쿼터 제외)는 3명까지입니다. 먼저 한 명을 방출하세요.';
  if(yb.length===2&&yb.every(x=>x.isP===p.isP))return `외국인 3명을 모두 ${p.isP?'투수':'타자'}로 채울 수 없습니다.`;
  if(tid===G.user&&G.contract&&!G.contract.done&&p.foreign==='용병'){ const f=fReCapInfo(); if(f&&f.tot+p.ask>f.cap)return `재계약 중인 선수 조건까지 합치면 외국인 총액이 한도를 ${money(f.tot+p.ask-f.cap)} 넘습니다.`; return ''; } /* 재계약 확정 검사와 같은 기준(재계약 연봉으로 본다. 아래 옛 연봉 검사는 하지 않음) */
  const cap=fCap(tid,tmp?null:excludeId); const tot=sum(yb.map(fCommit))+p.ask; /* 교체는 기존 선수를 뺀 한도로(부상 대체는 원 선수가 재활 명단에 남아 가산 유지) */ if(tot>cap)return `외국인 3명 연봉 총액이 한도 ${Math.round(cap/USD)}만 달러(약 ${money(cap)})를 넘습니다.`;
  return '';
}
function remainFrac(){ const c=G.cal; if(G.day<c.open)return 1; if(G.day>c.end)return 0; const left=Object.keys(c.sched).filter(d=>+d>G.day).length; return left/144; }
function signForeign(tid,id){
  const p=G.players[id];
  if(p&&(period()==='post'||(period()==='season'&&G.day>foreignDL())))return '8월 15일이 지나 이번 시즌에는 외국인 선수를 새로 등록할 수 없습니다.'; if(p&&!foreignOpen())return '지금은 외국인 선수 영입 기간이 아닙니다(12월부터).'; /* 시장이 닫힌 11월(검수 11-06) */ /* 기본 계약 함수도 등록 마감을 지킨다(검수 11-06) */
  const ask0=p&&p.ask; if(period()==='season'&&p&&p.foreign!=='아시아'&&p.ask>fNewCap())p.ask=fNewCap(); /* 시즌 중 교체는 KBO 상한(월 10만 달러)으로 계약 */
  const err=foreignCheck(tid,p); if(err){ if(p)p.ask=ask0; return err; } /* 실패한 시도는 시장 요구액을 바꾸지 않는다 */
  const mid=period()==='season';
  { const h=foResFor(p); if(!(h&&h.tid===tid))p.rsy=0; } /* 재계약 연차는 그 구단에서 쌓은 것만: 다른 구단이 새로 데려오면 한도 가산 없음(검수 11-06) */
  story(p,`${tname(tid)} 입단 (${p.foreign==='아시아'?'아시아쿼터':'외국인 선수'}, ${money(p.ask)})`,'move'); p.team=tid; p.sal=p.ask; p.yrs=1; delete p.fMulti; /* 새 구단 계약은 1년부터. shortcut: 2년 계약 도중 방출해도 다음 해 보장분은 따로 물리지 않는다, 방출 정산을 다년으로 넓힐 때 함께 */ if(G.formY===G.year&&!(p.sf&&p.sf.y===G.year))p.sf={y:G.year,v:clamp(N(0,3),-5,5),m:0}; p.fy=dobj(G.day).m>=10?G.year+1:G.year; if(p.adapt==null)p.adapt=Math.round(clamp(N(50,13),20,80));
  const cost=Math.round(p.ask*remainFrac());
  if(mid||G.day>=G.cal.open){ G.sea.fspend[tid]=(G.sea.fspend[tid]||0)+cost; }
  if(mid){ const key=p.foreign==='아시아'?'asiaRepl':'repl'; G.sea[key]=G.sea[key]||{}; G.sea[key][tid]=(G.sea[key][tid]||0)+1; try{ gmInc(tid,'fRep'); }catch(e){} }
  G.fmarket=(G.fmarket||[]).filter(x=>x!==id); mvLog('외국인',p,null,tid,`${p.nat||''} ${money(p.ask)}${mid?' · 시즌 중 교체':''}`,p.ask);
  if(tid===G.user)addLog(`외국인 선수 ${p.name}(${p.nat}·${posLabel(p)})와(과) 연 ${money(p.ask)}에 계약했습니다.${mid?` 남은 기간분 ${money(cost)} 지급.`:''}`);
  return '';
}
/* 방출해도 남은 보장 연봉은 낸다: 개막 전(또는 결산 뒤 다음 시즌 계약)에 방출하면 그 시즌 외국인 지출에 따로 남겨 개막 때 더한다. 개막 뒤 방출은 이미 시즌 지출에 들어 있다 */
function fDeadOf(tid,y){ const D=G.fDead; return D&&D.y===y?(D.by[tid]||0):0; }
function fDeadAdd(tid,amt){ const y=sponSeason(); if(G.sea&&G.sea.y===y&&G.cal&&G.day>=G.cal.open)return; if(!G.fDead||G.fDead.y!==y)G.fDead={y,by:{}}; G.fDead.by[tid]=(G.fDead.by[tid]||0)+amt; }
function fNextOwed(p){ if(sponSeason()===G.year)return true; /* 결산 뒤 겨울: 다음 시즌 계약(재계약 확정·이번 겨울 신규 계약)이 있는 선수만 연봉을 낸다 */ const C=G.contract; if(p.fy===sponSeason()||Math.max(p.fMulti||0,p.fCtY||0)>=sponSeason())return true; /* 2년 계약 둘째 해·확정된 재계약(AI 포함)도 보장(검수 11-09a) */ if(C&&C.y===G.year&&C.done&&(C.foreignEnd||[]).includes(p.id)&&!(C.foreignDrop||[]).includes(p.id))return true; return false; }
function releaseForeign(id){ const p=G.players[id]; if(!p)return; if(p.team!=null&&!(p.joinY>sponSeason())&&fNextOwed(p))fDeadAdd(p.team,p.sal||0); { let oa=0; try{ if(p.team!=null&&G.sea&&G.sea.fspend&&optEarned(p)&&p.opt.paidY!==G.year)oa=p.opt.a; /* 결산에서 이미 준 옵션은 다시 주지 않는다(검수 11-08) */ }catch(e){} if(oa){ optPaid(p.team,oa); p.opt.paidY=G.year; /* 기본 연봉이 아니라 계약 옵션 지급으로(검수 11-09zzb) */ if(p.team===G.user)addLog(`${p.name}이(가) 이미 달성한 성과 옵션 ${money(oa)}도 지급합니다.`); } } /* 방출해도 달성한 옵션은 준다(검수 11-06) */ termsClear(p); mvLog('방출',p,p.team,null,'외국인 선수'); if(p.team===G.user)addLog(`외국인 선수 ${p.name}을(를) 방출했습니다. 남은 연봉은 그대로 지급합니다.`); for(const k in G.lineup)if(G.lineup[k]===id)delete G.lineup[k]; dropP(id); }
/* 외국인 시장은 10개 구단이 함께 쓴다. 구단마다 스카우트 오차를 안고 후보를 평가한다 */
function fNeed(tid){ const fs=foreignOf(tid); const yb=fs.filter(x=>x.foreign==='용병'); if(yb.length<3&&fReplLeft(tid)>0){ const needP=yb.filter(x=>x.isP).length<2, needB=yb.filter(x=>!x.isP).length<1; return {kind:'용병',isP:needP?true:needB?false:null}; } if(!fs.some(x=>x.foreign==='아시아')&&fReplLeft(tid,'아시아')>0)return {kind:'아시아',isP:null};
  /* 겨울 교체(사용자 피드백 11-05: AI가 약한 외국인을 그대로 두고, 시장 상위 후보는 경쟁 없이 우리에게 왔다): 자리가 다 찼어도 가장 약한 선수가 54 미만이면 더 나은 후보를 노린다 */
  if(tid!==ME()&&period()!=='season'&&period()!=='post'&&yb.length>=3&&team(tid).cash>-2000){ const w=yb.slice().sort((a,b)=>ovr(a)-ovr(b))[0]; if(w&&ovr(w)<54)return {kind:'용병',isP:w.isP,up:w.id,upO:ovr(w)}; }
  return null; }
/* 우리 구단이 관찰(fwatch) 중인 후보는 소문이 나서 다른 구단도 더 눈여겨본다(경쟁) */
function fScoreBy(tid,q){ const t=team(tid); return ovr(q)-(q.team==null?(q.sx||0)*.9:0)+hn('fv'+tid,q.id)*(t.scoutSd||6)*.6-q.ask/600+(q.team==null&&tid!==G.user&&fwatchOn(q.id)?2:0); }
/* 이 구단이 노리는 후보 상위 3명: 계약할 수 있는 후보만(보류권·총액 한도·교체 기준), 우리와 협상 중인 다른 후보는 뺀다. AI 영입·경쟁 구단·관심 집계가 같은 목록을 쓴다(검수 11-09zl: 계약 불가 후보가 상위 칸을 차지) */
function fTop3(tid,nd,q){ const L=(G.fmarket||[]).map(id=>G.players[id]).filter(x=>x&&x.team==null&&(x===q||!foHeld(x))&&fKnows(tid,x)&&x.foreign===nd.kind&&(nd.isP==null||x.isP===nd.isP)&&(!nd.up||ovr(x)>=nd.upO+6)).sort((a,b)=>fScoreBy(tid,b)-fScoreBy(tid,a));
  const out=[]; for(const x of L){ if(!foreignCheck(tid,x,nd.up))out.push(x); if(out.length>=3)break; } return out; }
function aiForeignPick(tid){ const nd=fNeed(tid); return nd&&fTop3(tid,nd)[0]||null; }
function fInterest(q){ return !q||q.team!=null?0:foRivalTeams(q).length; } /* 보류권으로 다른 구단이 못 데려가는 선수는 관심도 0이라 몸값이 오르지 않는다 */
function aiForeignSign(tid,q,why,T){ const c=q.fneg&&q.fneg.cut, nd=fNeed(tid); const up=c&&c.tid===tid?foUp(tid,q):nd&&nd.up&&ovr(q)>=nd.upO+6?nd.up:null; /* 끼어들기를 일으킨 구단은 그때 바꾸려던 선수를 내보낸다(검수 11-09zl) */ if(up&&G.players[up]){ const w=G.players[up]; { const a0=q.ask; if(T)q.ask=T.g+T.i; const e=foreignCheck(tid,q,w.id); q.ask=a0; if(e)return e; } /* 교체 계약이 성립하는지(총액 한도 등) 먼저 보고 나서 기존 선수를 내보낸다(검수 11-06) */ releaseForeign(w.id); wire('외국인',`${tshort(tid)}, 외국인 ${w.name} 대신 ${q.name} 영입 추진`,{tid,ref:q.id}); } const err=T?signForeignT(tid,q.id,T.g,T.i):signForeign(tid,q.id); /* T: 경쟁 구단이 실제로 제시한 보장·인센티브(검수 11-05: 협상을 압박한 조건과 실제 계약이 달랐다) */ if(err)return err; if(fwatchOn(q.id))mail('스카우트팀장',`관찰 후보 ${q.name}, ${tshort(tid)}와(과) 계약`,`관찰 명단에 있던 ${q.name}(${posLabel(q)})을(를) ${tname(tid)}이(가) ${T?`보장 ${money(T.g)}${T.i?` + 인센티브 ${money(T.i)}`:''}`:`연 ${money(q.sal)}`}에 먼저 데려갔습니다.${why||''}`,{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); else if(ovr(q)>=60)wire('외국인',`${tshort(tid)}, 외국인 ${posLabel(q)} ${q.name} 영입 (${money(q.sal)})`,{tid,ref:q.id}); }
/* 스토브리그·캠프 기간: 구단들이 하루하루 시장에서 데려간다. 인기 선수는 몸값이 오른다 */
function aiForeignDaily(){ if(!foreignOpen()||period()==='season')return; const o=dobj(G.day); const pr=G.startY===G.year&&o.m===1?.45:o.m===1||o.m===2?.12:.06; /* 창단 첫 1월: 모든 구단이 외국인 선수단을 새로 꾸리므로 각 구단이 자기 판단으로 바로 움직인다(순번 없이). 평소 겨울은 띄엄띄엄 */
  for(const t of G.teams){ if(t.id===ME()||!fNeed(t.id))continue; const q=aiForeignPick(t.id); if(q&&R()<pr*(fwatchOn(q.id)?1.8:1)&&!foCutIn(t.id,q))aiForeignSign(t.id,q); } } /* 우리가 관찰 중인 후보를 노리는 구단은 서두른다 */
/* 매주 한국행에 새로 관심을 보인 후보가 시장에 들어온다(사용자 피드백 11-09f: 첫 주에 안 잡으면 남은 선수만 고르게 됨). 겨울 주 3~5명·시즌 중 2~3명, 에이전트 공용 후보는 겨울 48명·시즌 중 18명까지. 좋은 후보(예상 65 초과)만 소식 */
function fNewWeek(){ G.fmarket=G.fmarket||[]; const ag=G.fmarket.filter(id=>{ const q=G.players[id]; return q&&q.team==null&&q.fsrc!=='scout'; }).length; const n=Math.min(Math.max(0,(period()==='season'?18:48)-ag),period()==='season'?ri(2,3):ri(3,5)); const hot=[];
  for(let i=0;i<n;i++){ const k=R()<.22?'아시아':'용병'; let q=newForeign(k,{market:true}); if(dv(ovr(q))>65&&R()<.45){ delete G.players[q.id]; q=newForeign(k,{market:true}); } /* 시즌 준비가 한창일 때 새로 한국행을 알아보는 선수는 대체로 중하위권: 상위권은 일부만 다시 뽑아 줄인다 */ G.fmarket.push(q.id); if(fNewsOk(q))hot.push(q); }
  if(hot.length&&!G.unemp)mail('스카우트팀',`새 외국인 후보: ${hot.map(q=>q.name).join(', ')}`,`이번 주 한국행에 관심을 보인 선수가 시장에 나왔습니다.\n${hot.map(q=>`${q.name}(${posLabel(q)}, ${q.nat||''}, ${q.age}세 · ${q.prevLvl} · 요구 ${Math.round(q.ask/USD)}만 달러)`).join('\n')}`,{kind:'외국인',acts:[...hot.slice(0,2).map(q=>({l:`${q.name} 보기`,a:'player',v:q.id})),{l:'외국인 시장',a:'go',v:'transfer:foreign'}]});
  return n; }
function fBidWeek(){ try{ scoutFindWeek(); }catch(err){} if(!foreignOpen())return; fNewWeek(); for(const id of (G.fmarket||[])){ const q=G.players[id]; if(!q||q.team!=null)continue; const n=fInterest(q); q.fint=n; if(q.ask0==null)q.ask0=q.ask; if(q.ask>foCap(q))q.ask=foCap(q); /* 요구액도 지금 제안 상한 안에서: 우리는 막히고 AI는 상한액으로 잘려 계약하던 차이(검수 11-08) */ if((n>=2||(n>=1&&fwatchOn(id)))&&q.ask<q.ask0*1.3)q.ask=round5(Math.min(q.ask*1.04,foCap(q))); /* 시즌 중 줄어든 신규 상한까지만(검수 11-08) */ } }
function aiForeignFill(tid){
  { const q=aiForeignPick(tid); if(q){ aiForeignSign(tid,q); return; } }
  const fs=foreignOf(tid); const yb=fs.filter(x=>x.foreign==='용병');
  if(yb.length<3&&fReplLeft(tid)>0){ const needP=yb.filter(x=>x.isP).length<2, needB=yb.filter(x=>!x.isP).length<1;
    const want=needP?true:needB?false:R()<.6;
    const p=newForeign('용병',{isP:want}); while(foreignCheck(tid,p)&&p.ask>300)p.ask=round5(p.ask*.85);
    if(!foreignCheck(tid,p))signForeign(tid,p.id); else dropP(p.id); return; }
  if(!fs.some(x=>x.foreign==='아시아')&&fReplLeft(tid,'아시아')>0){ const p=newForeign('아시아'); if(signForeign(tid,p.id))dropP(p.id); }
}
function aiForeignReview(tid){
  try{ if(aiForeignTemp(tid))return; }catch(e){} /* 시즌 안에 돌아올 부상은 교체 횟수를 쓰지 않는 부상 대체로 */
  { const a=foreignOf(tid).find(x=>x.foreign==='아시아'&&x.injOut>45); /* 아시아쿼터 장기 부상도 별도 교체권으로 바꾼다(검수 11-09c: 일반 외국인만 검토) */
    const q=a&&fReplLeft(tid,'아시아')>0?(G.fmarket||[]).map(id=>G.players[id]).filter(x=>x&&x.team==null&&x.foreign==='아시아'&&fKnows(tid,x)&&!foHeld(x)&&!foreignCheck(tid,x,a.id)).sort((x,y)=>fScoreBy(tid,y)-fScoreBy(tid,x))[0]:null;
    if(q){ if(foCutIn(tid,q,a.id))return; const nm=a.name; releaseForeign(a.id); if(!signForeign(tid,q.id)){ wire('외국인',`${tname(tid)}이(가) 부상 중인 아시아쿼터 ${nm}을(를) ${q.name}(으)로 교체했습니다.`,{tid,ref:q.id}); return; } } }
  if((G.sea.repl[tid]||0)>=F_REPL_MAX)return;
  for(const p of foreignOf(tid).filter(x=>x.foreign==='용병')){
    const h=seasonTotal(p,G.year,'1군');
    const bad=p.injOut>45||(G.day>G.cal.open+40&&h&&(p.isP?(h.outs>=120&&pRate(h).era>4.9):(h.pa>=160&&bRate(h).ops<.730)));
    /* 기록이 아직 나쁘지 않아도 시장에 확실히 나은 후보가 있으면 바꾼다(교체 한도 안에서) */
    const q=G.day>G.cal.open+30?(G.fmarket||[]).map(id=>G.players[id]).filter(x=>x&&x.team==null&&x.foreign==='용병'&&x.isP===p.isP&&fKnows(tid,x)&&!foHeld(x)).sort((a,b)=>fScoreBy(tid,b)-fScoreBy(tid,a))[0]:null; const up=!bad&&q&&fScoreBy(tid,q)>ovr(p)+6;
    if((bad&&R()<.7)||(up&&R()<.1)){ const nm=p.name; const qOk=q&&!foreignCheck(tid,Object.assign({},q,{ask:Math.min(q.ask,fNewCap())}),p.id); if(!qOk&&!bad)continue; if(!qOk&&fReplLeft(tid)<=0)continue; if(!qOk&&fCap(tid,p.id)-sum(foreignOf(tid).filter(x=>x.foreign==='용병'&&x!==p).map(fCommit))<300)continue; /* 내보낸 뒤 줄어든 총액 한도로 대체 선수를 구할 여지가 없으면 방출하지 않는다(검수 11-09zl) */ if(qOk&&foCutIn(tid,q,p.id))return; /* 우리 관찰 후보면 바로 데려가지 않고 끼어들 기한부터 */ /* 새 선수를 데려올 수 있는지 먼저 본다(검수 11-06: 보류권 후보 때문에 기존 선수만 잃음) */
      const n0=foreignOf(tid).filter(x=>x.foreign==='용병').length; releaseForeign(p.id); if(!qOk||signForeign(tid,q.id))aiForeignFill(tid); const n1=foreignOf(tid).filter(x=>x.foreign==='용병').length; wire('외국인',n1>=n0?`${tname(tid)}이(가) 외국인 선수 ${nm}을(를) 교체했습니다.`:`${tname(tid)}이(가) 외국인 선수 ${nm}을(를) 방출했습니다.`,{tid}); return; }
  }
}

