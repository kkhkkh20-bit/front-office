/* ===== 연봉 ===== */
function perfOf(h,isP){
  if(!h)return null;
  if(isP){ if(h.outs<75)return null; return clamp(35+(6.2-pRate(h).era)/3.2*33,20,80); }
  if(h.pa<120)return null; return clamp(35+(bRate(h).ops-.55)/.35*30,20,80);
}
/* 한 구단에서 낸 기록만(이적 전후를 나눈다) */
function seasonTotalT(p,y,lvl,tid){ const hs=p.hist.filter(h=>h.y===y&&!h.y2&&(!lvl||h.lvl===lvl)&&h.t===tid); if(!hs.length)return null; const tot=Object.assign({},hs[0]); for(const h of hs.slice(1))addTo(tot,h); tot.pos=hs[hs.length-1].pos; tot.t=tid; return tot; }
function seasonTotal(p,y,lvl){ const hs=p.hist.filter(h=>h.y===y&&!h.y2&&(!lvl||h.lvl===lvl)); if(!hs.length)return null; const tot=Object.assign({},hs[0]); for(const h of hs.slice(1))addTo(tot,h); tot.pos=hs[hs.length-1].pos; tot.t=hs[hs.length-1].t; return tot; }
function perfOvr(p,n){
  const ys=[...new Set(p.hist.filter(h=>h.lvl==='1군').map(h=>h.y))].slice(-n);
  /* 표본이 적은 시즌은 능력치 쪽으로 당긴다: 투수 이닝/(이닝+60), 타자 타석/(타석+250) */
  const vals=ys.map(y=>{ const h=seasonTotal(p,y,'1군'); const v=perfOf(h,p.isP); if(v==null)return null; const w=p.isP?h.outs/(h.outs+180):h.pa/(h.pa+250); return v*w+ovr(p)*(1-w); }).filter(v=>v!=null);
  if(!vals.length)return null; if(vals.length===1)return vals[0];
  const w=vals.map((_,i)=>i+1); return sum(vals.map((v,i)=>v*w[i]))/sum(w);
}
function newSalary(p){
  const pf=perfOvr(p,2); const base=(pf==null?ovr(p):pf)+(p.foreign?0:pvShift(p)); /* 국내 선수 연봉은 포지션 가치까지 */
  if(p.foreign&&p.kept&&p.kept.y===G.year)return p.kept.sal;
  if(p.foreign){ if(p.foreign==='아시아')return round5(clamp(100+(base-44)*16,p.sal*.8,p.sal+10*USD)); return round5(clamp(300+(base-46)*62,p.sal*.7,Math.max(p.sal,Math.min(p.sal*1.3,200*USD)))); }
  /* FA 전에는 보류권 때문에 시장가보다 훨씬 낮다(NONFA_F). 실제 KBO: 3년차 필승조 평균자책점 1점대 → 1억2천, 첫 주전 시즌 → 1억 안팎,
     4년차 MVP급(김도영) → 5억이 최고 기록. 연차별 상한(PRE_CAP)은 그 최고 기록 수준이다 */
  /* FA 자격이 있어도 신청하지 않고 남은 선수는 여전히 보류 선수다: 인상 50% 이내, 7억 상한 */
  const skip=p.svc>=faSvc(p)&&!p.faC&&!p.ext;
  const f=nonFaF(p,skip);
  /* 삭감 폭: KBO 규약의 삭감 제한은 2008년에 없어졌다. 구단 관행상 3억 이상은 최대 50%(김도영 5억→2.5억), 그 아래는 최대 40% */
  const lo=p.sal*(p.sal>=300?.5:.6);
  /* 올해 1군 표본이 적으면(120타석·25이닝 미만) 시장가가 아니라 올해 기여로 소폭만 움직인다 */
  const h=seasonTotal(p,G.year,'1군'); const enough=h&&(p.isP?h.outs>=75:h.pa>=120); const war=h?warOf(h,p):0;
  if(!enough){ const fu=seasonTotal(p,G.year,'퓨처스'); const fw=fu?warOf(fu,p):0; return round5(Math.max(MIN_SAL,clamp(p.sal*(1+clamp(war*.15+fw*.05,-.1,.15)),lo,p.sal*1.15))); }
  /* 인상 폭 상한은 올해 WAR로 정한다: WAR 0 이하 동결, 0.5면 +20%, 1이면 +40%, 3이면 +120%, 5 이상이면 +190% */
  const up=war<=0?1.0:1+clamp(war*.4,.03,1.9);
  /* 잘한 선수는 깎지 않고 올려 준다: WAR 3 이상 +15% 이상, 2 이상 +8% 이상, 1 이상 동결 이상, 0 이상 최대 -15% */
  const lo2=war>=3?p.sal*1.15:war>=2?p.sal*1.08:war>=1?p.sal:war>=0?p.sal*.85:lo;
  const v=round5(clamp(marketSal(base)*f,Math.max(lo,lo2),Math.max(p.sal*up,lo2)));
  if(skip)return round5(Math.min(v,Math.max(p.sal,Math.min(700,p.sal*1.5))));
  return p.svc<faSvc(p)&&!p.faC?Math.min(v,Math.max(p.sal,preCap(p))):v;
}
/* 보류권 선수 연봉 상한(다음 시즌 기준). FA 전에는 5억을 넘기 어렵다(김도영 4년차 5억이 최고 수준). 마지막 해만 6~7억까지 */
const PRE_CAP=[30,80,150,300,400,500,600,700];
/* 예비 FA: 다음 시즌을 마치면 FA 자격을 얻는 보류권 선수 */
function preFA(p){ return !!p&&!p.foreign&&!p.faC&&!p.ext&&(p.svc||0)===faSvc(p)-1; }
/* 예비 FA 프리미엄: 실제 KBO 구단들은 FA를 앞둔 핵심 선수의 마지막 보류 시즌 연봉을 크게 올린다.
   잡고 싶다는 신호이기도 하고, 떠나면 받는 보상금(직전 연봉의 150~300%)을 키워 다른 구단이 쉽게 데려가지 못하게 하려는 계산이다
   (2015년 오재원 1.7억→4억, 박정권 2.35억→4억, 김현수 7.5억 등). 연차 상한(7억)은 넘지 않는다 */
function preFAPremium(p,base){ return round5(Math.max(base,Math.min(preCap(p),Math.max(base*1.5,p.sal*1.3)))); }
/* 보류권 연봉 비율: 시장가(marketSal) 대비. 3년 미만 18%, 6년 미만 30%, FA 직전 42%, FA 미신청 잔류 55% */
const NONFA_F=[.18,.3,.42,.55];
function nonFaF(p,skip){ if(p.faC||p.ext)return 1; if(skip)return NONFA_F[3]; return p.svc<3?NONFA_F[0]:p.svc<6?NONFA_F[1]:p.svc<faSvc(p)?NONFA_F[2]:1; }
function preCap(p){ return PRE_CAP[clamp(p.svc||0,0,PRE_CAP.length-1)]; }
function faAsk(p){
  const pf=perfOvr(p,3); const base=(pf==null?ovr(p):pf*.7+ovr(p)*.3)+(p.foreign?0:pvShift(p));
  const af=p.age<30?1.15:p.age<=31?1.05:p.age<=33?.9:p.age<=34?.8:.65;
  const years=p.age<=28&&base>=62?5:p.age<=31?4:p.age<=33?(base>=55?4:3):p.age<=35?(base>=55?3:2):1;
  /* 거품이 껴도 연평균은 30억(2026년 기준, 상한이 오르면 같이 오름) 안에서 멈춘다 */
  return {annual:round5(Math.min(marketSal(base)*1.05*af*faMktNow(),3000*capOf(G.year)/14397)),years};
}
/* FA 시장 분위기(겨울마다 다름): 지난해 분위기를 절반쯤 이어받고, 리그 구단들의 상한 여유가 클수록 과열된다. FA 요구액·구단 평가액에 함께 곱한다 */
function faMktOf(y){ G.faMkt=G.faMkt||{}; if(G.faMkt[y]!=null)return G.faMkt[y]; const prev=G.faMkt[y-1]!=null?G.faMkt[y-1]:1.08;
  const rooms=G.teams.map(t=>Math.max(0,capOf(y)-capPay(t.id))/capOf(y)); const room=sum(rooms)/rooms.length;
  return Math.round(clamp(1.08+(prev-1.08)*.35+((G.faMkR=G.faMkR||{})[y]??(G.faMkR[y]=clamp(N(0,1),-2.5,2.5)))*.045+clamp((room-.2)*.4,-.04,.04),.92,1.25)*1000)/1000; }
function faMktNow(){ return G.fa&&!G.fa.closed&&G.fa.y0!=null?faMktOf(G.fa.y0):faMktOf(G.year); }
function faMktFix(y){ G.faMkt=G.faMkt||{}; G.faMkt[y]=faMktOf(y); return G.faMkt[y]; }
function faMktLabel(v){ return v>=1.15?'과열':v>=1.06?'뜨거움':v>.99?'보통':v>.95?'차가움':'냉각'; }
/* 비FA 다년계약 요구의 근거: 예상 FA 시장가 × 다년 할인(안정을 사는 값). 초특급은 할인 대신 웃돈(시장 과열을 기대) */
function extParts(p,years){ const ytf=Math.max(0,faSvc(p)-(p.svc||0)); const ageF=p.age+ytf; initPers(p);
  const pf=perfOvr(p,3), pf1=perfOvr(p,1); const self=p.age<=27?ovr(p)+(p.pot-ovr(p))*.4:ovr(p)-Math.max(0,p.age-31); const base=(pf==null?self:self*.6+pf*.4)+(p.foreign?0:pvShift(p));
  const af=ageF<30?1.15:ageF<=32?1:ageF<=34?.8:.6; const mkt=faMktNow(); const expFA=marketSal(base)*1.05*af*mkt;
  const elite=ovr(p)>=65&&p.age<=31; const why=[];
  let disc;
  if(elite&&ytf<=1){ disc=1.04+Math.max(0,mkt-1); why.push(`초특급이라 시장에 나가면 몸값이 더 뛴다고 봅니다(+${Math.round((disc-1)*100)}%)`); }
  else { disc=elite?.95:.9; why.push(`다년 보장을 받는 대신 깎아 줌 ${Math.round((1-disc)*100)}%`);
    if(ytf>=2){ const k=.03*Math.min(ytf-1,3); disc-=k; why.push(`FA까지 ${ytf}시즌 남음 -${Math.round(k*100)}%`); }
    if(p.age>=31){ disc-=.04; why.push('나이 31세 이상, 안정 선호 -4%'); }
    if(p.inj>.2){ disc-=.04; why.push('부상 이력, 안정 선호 -4%'); }
    if(pf!=null&&pf1!=null&&Math.abs(pf1-pf)>=2){ disc-=.03; why.push('기복이 커서 내년 폼을 장담 못 함 -3%'); }
    const pa=(p.pers.amb-12)*.006, pl=-(p.pers.loy-10)*.004; disc+=pa+pl; if(Math.abs(pa+pl)>=.015)why.push(pa+pl>0?'야망이 커서 덜 깎음':'구단 애착이 커서 더 깎음');
    disc=clamp(disc,.72,1); }
  const yadj=p.age<=29?1+.025*(years-1):1-.035*(years-1); const mood=1-((p.mor??60)-60)/400;
  return {ytf,mkt,expFA:round5(expFA),disc,elite,yadj,mood,why}; }
function extDemand(p,years){ const x=extParts(p,years); const d=x.expFA*x.disc*x.yadj*x.mood; return round5(x.elite?d:Math.min(d,faAsk(p).annual*1.1)); }
function canExtend(p){ return p&&p.team===G.user&&!p.foreign&&!p.extNext&&!(p.joinY>G.year)&&(!p.faC||p.yrs<=1)&&p.age<=34&&!p.prospect; } /* 연봉 협상 기간에도 다년계약은 따로 제안할 수 있다 */
/* 다년계약 제안 결과: st = ok(합의) · counter(역제안, 7일 안에 수락 가능) · no(거절) · market(FA 시장을 보겠다며 거절) · locked(이번 주 협상 끝) · na(대상 아님).
   결과는 선수에게 남겨(p.extLast) 협상 창을 닫았다 열어도, 선수 정보에서도 볼 수 있게 한다 */
function offerExtension(id,annual,years,acc,T){ const r=offerExtension0(id,annual,years,acc,T); const p=G.players[id];
  if(p&&r.st&&r.st!=='na'&&r.st!=='locked')p.extLast={d:G.day,st:r.st,t:r.msg.replace(/^[^:]+: /,''),next:r.st==='ok'||r.st==='counter'?null:(Math.floor(G.day/7)+1)*7};
  if(r.st==='locked'&&p)r.next=(Math.floor(G.day/7)+1)*7; return r; }
const extNextDay=p=>p&&p.extTried===Math.floor(G.day/7)?(Math.floor(G.day/7)+1)*7:null; /* 이번 주에 이미 거절당했으면 다시 제안할 수 있는 날 */
function offerExtension0(id,annual,years,acc,T){
  const p=G.players[id]; if(!canExtend(p))return {ok:false,st:'na',msg:'다년계약을 제안할 수 없는 선수입니다.'};
  const wk=Math.floor(G.day/7);
  const who=agWho(p); const ag=hasAgent(p)?agentOf(p):null;
  if(acc&&p.extCounter&&p.extCounter.until>=G.day&&annual>=p.extCounter.annual&&years===p.extCounter.years){ delete p.extCounter; p.extTried=null; annual=Math.max(annual,0); }
  else if((acc=false)||p.extTried===wk)return /* 유효한 역제안이 아니면 일반 제안으로 본다 */ {ok:false,st:'locked',msg:`${who}: 이번 주에는 더 이야기하지 않겠습니다. 다음 주에 다시 제안해 주세요.`};
  const d=round5(extDemand(p,years)*agExtMul(p));
  let D=null; if(T){ T={...T,years,role:null}; D=termsDemand(p,'ext',{annual:d,years}); annual=Math.round(termsVal(T,D)); }
  /* 강경형·대형 에이전트는 원하는 기간보다 짧으면 받지 않는다 */
  const wantY=p.age<=29?4:p.age<=32?3:2; if(ag&&(ag.style==='hard'||ag.size==='big')&&years<wantY-1){ p.extTried=wk; return {ok:false,st:'no',msg:`${who}: ${years}년으로는 이야기가 안 됩니다. 최소 ${wantY-1}년은 보장해 주셔야 합니다.`}; }
  /* FA를 1년 앞둔 대어: 시장 평가를 받아 보겠다며 요구보다 확실히 높아야 움직인다 */
  const mkt=agExtTestMarket(p); if(mkt&&annual<d*1.08){ p.extTried=wk; if(annual<d*.85)agRelAdd(ag,-1,`${p.name} 다년계약 낮은 제안`); return {ok:false,st:'market',msg:`${who}: 선수가 FA 시장 평가를 받아 보고 싶어 합니다. 연 ${money(round5(d*1.08))} 이상이 아니면 시즌 뒤 시장에 나가겠습니다.`}; }
  /* 에이전트는 첫 제안을 그대로 받지 않는다: 요구에 가까우면 조금 올린 역제안을 낸다(그 자리에서 수락 가능) */
  if(ag&&!acc&&annual>=d*.9&&annual<d*(ag.style==='fast'?1:1.04)&&!(p.extCounter&&p.extCounter.y===G.year)){ const c=round5(d*(ag.style==='hard'?1.06:ag.style==='fast'?1.01:1.04)); p.extCounter={annual:c,years,until:G.day+7,y:G.year,...(T?{terms:termsFit(T,D,c,years)}:{})}; return {ok:false,counter:true,st:'counter',msg:`${who}: 거의 다 왔습니다. ${T?termsTxt(p.extCounter.terms,false):`${years}년 연 ${money(c)}(총 ${money(c*years)})`}이면 바로 사인하겠습니다.`}; }
  if(annual>=d*.98||acc){ delete p.extCounter; const now=(G.rolled===G.year&&G.day>=KD(11,1))||period()==='pre'; /* 시즌이 끝난 뒤~개막 전 합의는 다가오는 시즌부터 */
    if(G.contract&&!G.contract.done&&G.contract.ended.includes(p.id)){ G.contract.ended=G.contract.ended.filter(x=>x!==p.id); if(G.contract.neg)delete G.contract.neg[p.id]; delete p.newSal; }
    const pay=T?T.annual:annual; const tx=T?termsTxt(T,false):`${years}년 연 ${money(annual)}(총 ${money(annual*years)})`;
    if(now){ p.sal=pay; p.yrs=years; p.cyrs=years; p.faC=true; p.ext=true; } else p.extNext={annual:pay,years,...(T?{terms:T}:{})};
    if(T&&now)termsApply(p,T,'ext',ctSeason()); else if(T&&T.bonus>0){ G.spend=G.spend||{}; G.spend.faB=(G.spend.faB||0)+T.bonus; } /* 다음 시즌 계약: 계약금만 지금 주고 나머지 조건은 새 계약이 시작될 때 반영 */
    if(now&&!T)termsClear(p); story(p,`비FA 다년계약 ${T?termsTxt(T,true):`${years}년 연 ${money(annual)}`}`,'move');
    addLog(`${p.name}와(과) 비FA 다년계약에 합의했습니다. ${tx}.`);
    if(ag){ agRelAdd(ag,3,`${p.name} 다년계약`); agDealAdd(p,G.user); }
    return {ok:true,st:'ok',now,msg:`${who}: ${T?termsTxt(T,true):`${years}년 연 ${money(annual)}`}에 합의했습니다. ${now?'바로 적용됩니다.':'다음 시즌부터 적용됩니다.'}`}; }
  p.extTried=wk; if(ag&&annual<d*.8)agRelAdd(ag,-2,`${p.name} 다년계약 무리한 제안`);
  /* 에이전트는 정확한 하한 대신 조금 높여 부른다(친하면 더 정확히) */
  const pad=ag?(agRel(ag)>=60?.01:agRel(ag)>=40?.03:.06):.02; const hint=round5(d*(1+pad+hn('x'+G.year,p.id)*.03));
  return {ok:false,st:'no',msg:`${who}: ${T?`${years}년이면 ${termsTxt(termsDemand(p,'ext',{annual:hint,years}),true)}${D&&D.ntc?' · 트레이드 거부권':''} 안팎`:`${years}년이면 연 ${money(hint)} 안팎`}은 되어야 생각해 보겠습니다.${ag&&ag.style==='hard'?' 그 아래로는 내려가지 않습니다.':''}`};
}
function keepScore(p){ return ovr(p)+Math.max(0,p.pot-ovr(p))*(p.age<=22?.4:p.age<=24?.28:.1)+(p.faC?3:0)+(p.age>=26&&p.age<=33?1.2:0); }
function trimCands(n){ return domestic(G.user).filter(p=>!p.ys&&!(G.contract&&!G.contract.done&&G.contract.ended.includes(p.id))).sort((a,b)=>keepScore(a)-keepScore(b)).slice(0,n); }
function releasePlayer(id){
  const p=G.players[id]; if(!p||p.team!==G.user)return;
  if(p.foreign){ releaseForeign(id); return; }
  const cost=p.faC?Math.round(p.sal*p.yrs*.5):0; payOut(G.user,cost,'rel');
  addLog(`${p.name}을(를) 방출했습니다.${cost?` 남은 계약 정산금 ${money(cost)}.`:''} 다른 구단과 계약할 때까지 무적 선수로 남습니다.`);
  if(G.contract){ G.contract.ended=G.contract.ended.filter(x=>x!==id); }
  for(const k in G.lineup) if(G.lineup[k]===id)delete G.lineup[k];
  toFree(p,`${tname(G.user)}에서 방출`); /* 바로 은퇴하지 않고 무적 선수로 남는다 */
}
function needScore(tid,p){ const d=depth(tid); const o=ovr(p);
  if(p.isP){ const arr=isSPr(p)?d.sp.map(spV):d.pen.map(penV); return arr.length&&o>Math.min(...arr)+2?1:0; }
  return d.start.length&&o>Math.min(...d.start.map(x=>ovr(x)))+2?1:0; }

/* 계약 표기: "FA 4년 중 2년차", 보류권은 "3시즌 뒤 FA". 전체 연수(p.cyrs)는 계약 때 기록하고, 예전 저장은 FA 체결 연도로 거꾸로 계산한다 */
function ctSeason(){ return G.rolled===G.year?G.year+1:G.year; }
function ctInfo(p){ if(!p||!p.faC)return null; const left=Math.max(1,p.yrs||1); let tot=p.cyrs;
  if(!tot)tot=!p.ext&&p.lastFA!=null?left+Math.max(1,ctSeason()-p.lastFA)-1:left;
  tot=Math.max(tot,left); return {tot,k:tot-left+1,left,last:left===1}; }
function ctText(p){ const c=ctInfo(p); if(c){ const kind=p.ext?'다년':'FA'; return c.tot===1?`${kind} 1년 계약`:c.last?`${kind} ${c.tot}년 중 마지막 해`:`${kind} ${c.tot}년 중 ${c.k}년차`; }
  if(p.extNext)return `다년 ${p.extNext.years}년 합의`; if(p.foreign)return '1년 계약';
  const n=Math.max(0,faSvc(p)-(p.svc||0)); const off=G.rolled===G.year;
  /* 등록 연수를 채운 선수: 재자격(직전 FA 후 4시즌)이 남았으면 그만큼, 아니면 이번(다음) 시즌 뒤 */
  const m=n>0?n:p.lastFA!=null?Math.max(1,p.lastFA+4-ctSeason()+1):1;
  if(n===0&&p.age>37)return '단년 계약';
  return m>=2?`${m}시즌 뒤 FA`:off?'다음 시즌 뒤 FA':'올 시즌 뒤 FA'; }
