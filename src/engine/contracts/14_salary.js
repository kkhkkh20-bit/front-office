/* ===== 연봉 ===== */
function perfOf(h,isP){
  if(!h)return null;
  if(isP){ if(h.outs<75)return null; return clamp(35+(6.2-pRate(h).era)/3.2*33,20,80); }
  if(h.pa<120)return null; return clamp(35+(bRate(h).ops-.55)/.35*30,20,80);
}
/* 한 구단에서 낸 기록만(이적 전후를 나눈다) */
function seasonTotalT(p,y,lvl,tid){ const hs=p.hist.filter(h=>h.y===y&&!h.y2&&(!lvl||h.lvl===lvl)&&h.t===tid); if(!hs.length)return null; const tot=Object.assign({},hs[0]); for(const h of hs.slice(1))addTo(tot,h); tot.pp=hs.reduce((o,h)=>ppMerge(o,h.pp),undefined); tot.pos=tot.pp?ppTop(tot.pp):hs[hs.length-1].pos; tot.t=tid; return tot; }
function seasonTotal(p,y,lvl){ const hs=p.hist.filter(h=>h.y===y&&!h.y2&&(!lvl||h.lvl===lvl)); if(!hs.length)return null; const tot=Object.assign({},hs[0]); for(const h of hs.slice(1))addTo(tot,h); tot.pp=hs.reduce((o,h)=>ppMerge(o,h.pp),undefined); tot.pos=tot.pp?ppTop(tot.pp):hs[hs.length-1].pos; tot.t=hs[hs.length-1].t; if(lvl&&hs.length>1)Object.defineProperty(tot,'parts',{value:hs}); /* 구단별 줄: 시즌 WAR = 구단별 WAR 합(통산과 같게, 검수 11-09zf) */ return tot; }
function perfOvr(p,n){
  const ys=[...new Set(p.hist.filter(h=>h.lvl==='1군').map(h=>h.y))].slice(-n);
  /* 표본이 적은 시즌은 능력치 쪽으로 당긴다: 투수 이닝/(이닝+60), 타자 타석/(타석+250) */
  const vals=ys.map(y=>{ const h=seasonTotal(p,y,'1군'); const v=perfOf(h,p.isP); if(v==null)return null; const w=p.isP?h.outs/(h.outs+180):h.pa/(h.pa+250); return v*w+ovr(p)*(1-w); }).filter(v=>v!=null);
  if(!vals.length)return null; if(vals.length===1)return vals[0];
  const w=vals.map((_,i)=>i+1); return sum(vals.map((v,i)=>v*w[i]))/sum(w);
}
/* 감액 한도(제보 11-17 다년 감액): 보류 선수 연봉은 한 번에 2억 이상 40%, 1억~2억 30%, 1억 미만 25%까지만 깎는다(KBO 규약 연봉 감액 제한, 확인 필요).
   비FA 다년계약도 같은 한도다(보장 기간으로 더 깎아 주지 않음, 구단주 보충 11-17). FA·다년계약이 끝나는 선수(salReset·FA 계약 중)와 외국인은 시장가로 다시 매기므로 한도가 없다.
   연봉 협상(newSalary 산정안 하한·salAccepts·마감 확정), 비FA 다년계약(요구·판정·역제안), AI 구단 다년계약이 모두 이 함수를 쓴다 */
function salCutRate(sal){ return sal>=200?.4:sal>=100?.3:.25; }
function salCutFloor(p,multi){ if(!p||p.foreign||p.faC||salReset(p))return 0; return Math.max(MIN_SAL,round5(p.sal*(1-salCutRate(p.sal)))); } /* multi(다년계약)도 같은 한도: 보장 기간으로 더 깎아 주지 않는다(구단주 보충 11-17) */
function newSalary(p){
  const pf=perfOvr(p,2); const base=(pf==null?ovr(p):pf)+(p.foreign?0:pvShift(p)); /* 국내 선수 연봉은 포지션 가치까지 */
  if(p.foreign&&p.kept&&p.kept.y===G.year)return p.kept.sal;
  if(p.foreign){ if(p.foreign==='아시아')return round5(clamp(100+(base-44)*16,p.sal*.8,p.sal+10*USD)); /* 지난 시즌 WAR이 좋으면 능력 기준 금액보다 더 달라고 한다(사용자 11-11: WAR 2~4 용병이 동결·삭감 수준을 요구).
     현재 연봉 대비 최소 인상률: WAR 2 +4%, 3 +12%, 4 +20%, 5 이상 +28~35%. WAR 4 이상은 인상 상한을 1.3배에서 1.4배로 */
    const wy=(G.contract&&G.contract.y)??(period()==='pre'?G.year-1:G.year); let w=0; try{ const h=seasonTotal(p,wy,'1군'); w=h?warOf(h,p):0; }catch(e){}
    const up=Math.max(p.sal,Math.min(p.sal*(w>=4?1.4:1.3),200*USD)), fl=w>=1.5?p.sal*(1+clamp((w-1.5)*.08,0,.35)):0;
    return round5(clamp(Math.max((700+(base-46)*70)*fEcoK(),Math.min(fl,up)),p.sal*.7,up)); }
  /* FA 전에는 보류권 때문에 시장가보다 훨씬 낮다(NONFA_F). 실제 KBO: 3년차 필승조 평균자책점 1점대 → 1억2천, 첫 주전 시즌 → 1억 안팎,
     4년차 MVP급 → 5억이 최고 기록. 연차별 상한(PRE_CAP)은 그 최고 기록 수준이다 */
  /* FA 자격이 있어도 신청하지 않고 남은 선수는 여전히 보류 선수다: 인상 50% 이내, 7억 상한 */
  const skip=p.svc>=faSvc(p)&&!p.faC&&!p.ext;
  const f=nonFaF(p,skip);
  /* FA·다년계약이 끝난 뒤 첫 연봉은 계약 연봉이 아니라 지금 시장가(성적·나이, faAsk)로 다시 매긴다. 올리지는 않는다(실제 FA 종료 뒤 84% 삭감 사례가 있다) */
  if(salReset(p))return round5(Math.max(MIN_SAL,Math.min(p.sal,faAsk(p).annual)));
  /* 삭감 폭: 감액 한도(salCutFloor, 연봉 협상·비FA 다년계약·AI 같은 함수) */
  const lo=salCutFloor(p);
  /* 올해 1군 표본이 적으면(120타석·25이닝 미만) 시장가가 아니라 올해 기여로 소폭만 움직인다 */
  const h=seasonTotal(p,G.year,'1군'); const enough=h&&(p.isP?h.outs>=75:h.pa>=120); const war=h?warOf(h,p):0;
  if(!enough){ const fu=seasonTotal(p,G.year,'퓨처스'); const fw=fu?warOf(fu,p):0; return round5(Math.max(MIN_SAL,clamp(p.sal*(1+clamp(war*.15+fw*.05,-.1,.15)),lo,p.sal*1.15))); }
  /* 인상 폭 상한은 올해 WAR로 정한다: WAR 0 이하 동결, 0.5면 +20%, 1이면 +40%, 3이면 +120%, 5 이상이면 +190% */
  const up=war<=0?1.0:1+clamp(war*.4,.03,1.9);
  /* 잘한 선수는 깎지 않고 올려 준다: WAR 3 이상 +15% 이상, 2 이상 +8% 이상, 1 이상 동결 이상, 0 이상 최대 -15% */
  const lo2=war>=3?p.sal*1.15:war>=2?p.sal*1.08:war>=1?p.sal:war>=0?p.sal*.85:lo;
  const v=round5(clamp(marketSal(base)*f,Math.max(lo,lo2),Math.max(p.sal*up,lo2))*(war>=1?domPrem(p.team):1)); /* 우승 프리미엄: 독주 구단에서 잘한 선수는 더 오른다 */
  if(skip)return round5(Math.min(v,Math.max(p.sal,Math.min(700,p.sal*1.5))));
  return p.svc<faSvc(p)&&!p.faC?Math.min(v,Math.max(p.sal,preCap(p))):v;
}
/* 보류권 선수 연봉 상한(다음 시즌 기준). FA 전에는 5억을 넘기 어렵다(4년차 5억이 최고 수준). 마지막 해만 6~7억까지 */
const PRE_CAP=[30,80,150,300,400,500,600,700];
/* 예비 FA: 다음 시즌을 마치면 FA 자격을 얻는 보류권 선수 */
/* FA·다년계약이 이번 겨울 끝난 보류 선수(카페 11-09c: 30억 FA가 끝나도 27억으로 남았다). 예전 저장본은 FA 이력(lastFA)으로 한 번 인정 */
function salReset(p){ if(!p||p.foreign||p.faC||p.ext)return false; const y=G.contract&&!G.contract.done&&G.contract.y!=null?G.contract.y:G.year; return p.ctEnd===y; }
function preFA(p){ return !!p&&!p.foreign&&!p.faC&&!p.ext&&(p.svc||0)===faSvc(p)-1; }
/* 예비 FA 프리미엄: 실제 KBO 구단들은 FA를 앞둔 핵심 선수의 마지막 보류 시즌 연봉을 크게 올린다.
   잡고 싶다는 신호이기도 하고, 떠나면 받는 보상금(직전 연봉의 150~300%)을 키워 다른 구단이 쉽게 데려가지 못하게 하려는 계산이다
   (2015년 1.7억→4억, 2.35억→4억 사례 등). 연차 상한(7억)은 넘지 않는다 */
function preFAPremium(p,base){ return round5(Math.max(base,Math.min(preCap(p),Math.max(base*1.5,p.sal*1.3)))); }
/* 보류권 연봉 비율: 시장가(marketSal) 대비. 3년 미만 18%, 6년 미만 30%, FA 직전 42%, FA 미신청 잔류 55% */
const NONFA_F=[.16,.21,.34,.5];
function nonFaF(p,skip){ if(p.faC||p.ext)return 1; if(skip)return NONFA_F[3]; return p.svc<3?NONFA_F[0]:p.svc<6?NONFA_F[1]:p.svc<faSvc(p)?NONFA_F[2]:1; }
function preCap(p){ return PRE_CAP[clamp(p.svc||0,0,PRE_CAP.length-1)]; }
function faAsk(p){
  const pf=perfOvr(p,3); const base=(pf==null?ovr(p):pf*.7+ovr(p)*.3)+(p.foreign?0:pvShift(p));
  const af=p.age<30?1.15:p.age<=30?1.05:p.age<=31?.97:p.age<=33?.9:p.age<=34?.8:.65; /* 31세는 전성기 끝 해라 30세보다 낮게(커뮤니티 피드백 11-08) */
  const tier=base>=62?1:clamp(.7+(base-50)*.025,.7,1); /* 특급(화면 80 안팎) 아래 중간층 FA는 요구액을 덜 부풀린다: 화면 70대가 총액 100억을 넘지 않게(커뮤니티 피드백 11-08) */
  const years=p.age<=28&&base>=62?5:p.age<=31?4:p.age<=33?(base>=55?4:3):p.age<=35?(base>=55?3:2):1;
  /* 거품이 껴도 연평균은 30억(2026년 기준, 상한이 오르면 같이 오름) 안에서 멈춘다 */
  /* 성적이 한 해 꺾였어도 능력 기준 요구액의 70% 아래로는 내려가지 않는다(카페 11-13 beeseo: 화면 60후반~70대 FA 요구액이 연 1~3억으로 나왔다) */
  const b2=ovr(p)+(p.foreign?0:pvShift(p)); const t2=b2>=62?1:clamp(.7+(b2-50)*.025,.7,1); const fl=marketSal(b2)*1.05*af*t2*faMktNow()*.7;
  const tab=Math.max(marketSal(base)*1.05*af*tier*faMktNow(),fl);
  /* 요구액은 시장가에서 시작한다(시장 엔진: 두 번째로 높은 지불 의사). 표 기준 금액은 하한(45%)·상한(2배)으로만 남겨 이상값을 막는다 */
  let ann=tab; if(!p.foreign&&typeof mktPrice==='function'){ try{ ann=clamp(mktPrice(p),tab*.45,tab*2); }catch(e){ ann=tab; } }
  ann*=domPrem(p.team??p.faFrom); /* 우승 프리미엄: 독주 구단 선수는 시장에서 더 부른다 */
  return {annual:round5(Math.min(ann,3000*ecoCap(G.year)/14397,typeof faTop==='function'?Math.max(tab,faTop()):1e9)),years};
}
/* FA 시장 분위기(겨울마다 다름): 지난해 분위기를 절반쯤 이어받고, 리그 구단들의 상한 여유가 클수록 과열된다. FA 요구액·구단 평가액에 함께 곱한다 */
function faMktOf(y){ G.faMkt=G.faMkt||{}; if(G.faMkt[y]!=null)return G.faMkt[y]; const prev=G.faMkt[y-1]!=null?G.faMkt[y-1]:1.08;
  const rooms=G.teams.map(t=>Math.max(0,capOf(y)-capPay(t.id))/capOf(y)); const room=sum(rooms)/rooms.length;
  return Math.round(clamp(1.08+(prev-1.08)*.35+((G.faMkR=G.faMkR||{})[y]??(G.faMkR[y]=clamp(N(0,1),-2.5,2.5)))*.045+clamp((room-.2)*.4,-.04,.04),.92,1.18)*1000)/1000; } /* 과열 상한 1.25 → 1.18(커뮤니티 피드백 11-08) */
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
  else { /* 구단주 보충(11-17): 선수는 길게 받기보다 빨리 많이 받기를 원한다. 다년 보장을 이유로 연봉을 깎아 주지 않는 것이 기본이고,
       30대 중반·부상 이력·하락세만 안정을 조금 더 원한다(각 -3~4%). 에이전트 성향: 경매형·강경형은 연봉 극대화 +2%, 관계형·실속형은 기간을 조금 봐 -2% */
    disc=1; why.push('다년 보장을 이유로 연봉을 깎아 주지 않습니다');
    if(ytf>=2){ const k=.015*Math.min(ytf-1,3); disc-=k; why.push(`FA까지 ${ytf}시즌 남음 -${(k*100).toFixed(1).replace(/\.0$/,'')}%`); }
    if(p.age>=34){ disc-=.04; why.push('30대 중반, 안정 선호 -4%'); }
    if(p.inj>.2){ disc-=.03; why.push('부상 이력, 안정 선호 -3%'); }
    if(pf!=null&&pf1!=null&&pf1<=pf-2){ disc-=.03; why.push('하락세라 안정 선호 -3%'); }
    { const ag=hasAgent(p)?agentOf(p):null; const s=ag?ag.style:null; if(s==='auction'||s==='hard'){ disc+=.02; why.push('에이전트가 연봉 극대화를 노림 +2%'); } else if(s==='rel'||s==='fast'){ disc-=.02; why.push('에이전트가 기간도 봄 -2%'); } }
    const pa=(p.pers.amb-12)*.006, pl=-(p.pers.loy-10)*.004; disc+=pa+pl; if(Math.abs(pa+pl)>=.015)why.push(pa+pl>0?'야망이 커서 덜 깎음':'구단 애착이 커서 더 깎음');
    disc=clamp(disc,.86,1.06); }
  const yadj=p.age<=29?1+.025*(years-1):p.age>=34?1-.025*(years-1):1-.01*(years-1); /* 젊은 선수는 같은 총액이면 짧고 높은 연봉을 원해 길수록 연평균을 더 부른다. 30대 초반은 거의 중립, 30대 중반부터 기간을 조금 쳐 준다 */ const mood=1-((p.mor??60)-60)/400;
  return {ytf,mkt,expFA:round5(expFA),disc,elite,yadj,mood,why}; }
function extDemand(p,years){ const x=extParts(p,years); const d=x.expFA*x.disc*x.yadj*x.mood; return round5(x.elite?d:Math.min(d,faAsk(p).annual*1.1)); }
function canExtend(p){ return p&&p.team===G.user&&!p.foreign&&!p.ys&&!p.extNext&&!(p.joinY>G.year)&&(!p.faC||p.yrs<=1)&&p.age<=34&&!p.prospect; } /* 연봉 협상 기간에도 다년계약은 따로 제안할 수 있다 */
/* 다년계약(연장 협상)을 지금 열 수 없는 이유. 열 수 있으면 ''(canExtend와 같은 조건). 연장 요구 결정·면담 계약 이야기에서 버튼 대신 이유를 보여 준다(피드백 11-17 연장) */
function extWhy(p){ if(!p)return '선수가 없습니다.'; if(G.unemp||p.team!==G.user)return `${p.name}은(는) 우리 구단 선수가 아닙니다.`;
  if(p.foreign)return '외국인 선수는 비FA 다년계약 대상이 아닙니다. 재계약은 시즌 뒤 외국인 재계약에서 정합니다.';
  if(p.prospect||p.joinY>G.year)return '아직 입단하지 않은 선수입니다. 입단한 뒤 협상할 수 있습니다.';
  if(p.ys)return '육성선수는 다년계약을 맺을 수 없습니다. 정식 선수로 등록한 뒤 제안하세요.';
  if(p.extNext)return `이미 다음 시즌부터 ${p.extNext.years}년 연 ${money(p.extNext.annual)} 다년계약에 합의했습니다.`;
  if(p.faC&&p.yrs>1)return `FA 계약이 ${p.yrs}년 남아 있습니다. 계약 마지막 해부터 연장 협상을 할 수 있습니다.`;
  if(p.age>34)return `${p.age}세 선수는 비FA 다년계약 대상이 아닙니다(34세까지). 계약이 끝나면 시즌 뒤 FA·재계약 협상에서 정합니다.`;
  return canExtend(p)?'':'지금은 다년계약을 제안할 수 없는 선수입니다.'; }
/* 다년계약 제안 결과: st = ok(합의) · counter(역제안, 7일 안에 수락 가능) · no(거절) · market(FA 시장을 보겠다며 거절) · locked(이번 주 협상 끝) · na(대상 아님).
   결과는 선수에게 남겨(p.extLast) 협상 창을 닫았다 열어도, 선수 정보에서도 볼 수 있게 한다 */
function offerExtension(id,annual,years,acc,T,lock){ const r=offerExtension0(id,annual,years,acc,T,lock); const p=G.players[id];
  if(p&&!r.ok&&r.st&&r.st!=='na'&&r.st!=='owner'&&p.team===G.user){ const S=extNgOf(p); const L=S.log=S.log||[]; L.push({d:G.day,w:'구단',...(T?{tm:{...T,years}}:{a:annual,y:years}),...(acc?{acc:true}:{})},{d:G.day,w:'에이전트',t:r.msg.replace(/^[^:]+: /,'')}); if(L.length>12)L.splice(0,L.length-12); } /* 협상 대화 기록(계약 1단계): 합의하면 extNg째로 지운다 */
  if(p&&r.st&&r.st!=='na'&&r.st!=='locked'&&r.st!=='owner')p.extLast={d:G.day,st:r.st,t:r.msg.replace(/^[^:]+: /,''),next:r.st==='ok'||r.st==='counter'?null:extNextDay(p)};
  if(r.st==='locked'&&p)r.next=extNextDay(p); return r; }
/* 강경형·대형 에이전트가 요구하는 최소 기간(없으면 0). 협상 화면의 '요구 조건 충족' 표시도 같은 기준(검수 11-09s) */
/* 다년계약 요구(연평균): 에이전트 배수와, FA 시장 평가를 원하는 선수의 웃돈(8%)까지 — 협상 화면의 요구와 판정이 같은 값을 쓴다 */
/* 비FA 다년계약 실제화(구단주 11-17, 확인 필요: 나무위키 '비FA 다년계약'·구단 발표): 선수는 '길게 + 많이'를 원한다. 기간은 연봉을 깎는 대가가 아니라 높은 연봉을 길게 보장받는 것.
   - 연 연봉은 지금 연봉 이상이어야 한다(extFloor). 하락세 베테랑(35세 이상, 또는 33세 이상이면서 최근 성적이 3년 평균보다 처짐)만 연봉 협상 감액 한도(salCutFloor) 안에서 예외
   - 요구 총액은 예상 FA 시장가(남은 FA까지 연수 할인)에 맞추고, 기간이 길면 총액이 커진다(연 연봉을 깎아 주지 않음)
   - 계약금은 없다(KBO 규약 제81조: 신인·자유계약선수 외 계약금 불가). 옵션은 보통 총액의 10~30%. 베테랑은 1+1·2+1(구단 연장 옵션)
   - 사용자·AI 구단 같은 함수(extJudge·extDemandAll). 이미 맺은 계약은 그대로 */
function extFloor(p){ if(!p||p.foreign||p.faC||salReset(p))return 0; let pf=null,pf1=null; try{ pf=perfOvr(p,3); pf1=perfOvr(p,1); }catch(e){} const dec=p.age>=35||(p.age>=33&&pf!=null&&pf1!=null&&pf1<=pf-2); return dec?salCutFloor(p,true):p.sal; }
function extDemandAll(p,years,tid){ return round5(Math.max(extFloor(p),extDemand(p,years)*(hasAgent(p)?agExtMul(p,tid):1)*(agExtTestMarket(p,tid)?1.08:1))); } /* 요구는 감액 한도 아래로 내려가지 않는다(제보 11-17: 예상 FA 시장가 × 다년 할인만 보고 4억 선수가 3,500만 원을 요구했다) */
/* 다년계약 판정(계약 2단계: 사용자·AI 구단이 같은 함수). annual: 환산 연평균(조건 묶음이면 termsVal). 순서도 사용자 판정과 같다:
   최소 기간 → 감액 한도(eq: 연봉+계약금 연평균, 제보 11-17) → FA 시장 확인(요구의 98% 미만이면 거절) → 에이전트 역제안(요구의 90~98%) → 합의(98% 이상 또는 보여 준 역제안 수락) → 거절 */
function extJudge(p,annual,years,tid,acc,eq){ const ag=hasAgent(p)?agentOf(p):null; const d=extDemandAll(p,years,tid);
  if(years<extMinY(p))return {st:'min',d};
  { const fl=extFloor(p); if(fl&&(eq??annual)<fl)return {st:'cut',d,fl}; }
  if(agExtTestMarket(p,tid)&&annual<d*.98&&!acc)return {st:'market',d,low:annual<d*.85};
  if(ag&&!acc&&annual>=d*.9&&annual<d*.98)return {st:'counter',d,c:round5(d*(ag.style==='hard'?1.06:ag.style==='fast'?1.01:1.04))};
  if(annual>=d*.98||acc)return {st:'ok',d};
  return {st:'no',d,low:annual<d*.8}; }
/* 감액 한도 판정용 환산 연봉: 연봉 + 계약금 연평균(옵션·약속은 못 받을 수도 있어 넣지 않는다) */
const extCutEq=(T,years,annual)=>T?(T.annual||0)+(T.bonus||0)*CT_BON/Math.max(1,years||T.years||1):annual;
/* 역제안 묶음이 감액 한도 아래면 잠기지 않은 금액(연봉→계약금)으로 메운다. 둘 다 잠겼으면 null */
function extCutFit(ft,fl,years,lk){ if(!ft||!fl)return ft; const gap=fl-extCutEq(ft,years); if(gap<=0)return ft; const L=lk||[];
  if(!L.includes('annual'))return {...ft,annual:Math.ceil((ft.annual+gap)/5)*5}; if(!L.includes('bonus'))return {...ft,bonus:Math.ceil(((ft.bonus||0)+gap*years/CT_BON)/5)*5}; return null; }
function extMinY(p){ const ag=hasAgent(p)?agentOf(p):null; return ag&&(ag.style==='hard'||ag.size==='big')?(p.age<=29?4:p.age<=32?3:2)-1:0; }
const extNextDay=p=>p&&p.extNg&&p.extNg.fold!=null&&p.extNg.fold>G.day?p.extNg.fold:null; /* 에이전트가 협상을 접었으면 다시 제안할 수 있는 날(계약 1단계: 한 주 한 번 대신 라운드 한도) */
const extNgOf=p=>{ if(p.extNg&&p.extNg.tid!=null&&p.extNg.tid!==p.team){delete p.extNg;delete p.extCounter;} const S=p.extNg||(p.extNg={}); S.tid=p.team;return S; };
/* 다년계약의 상한 결재(13_roster capOwnerCheck): 계약이 시작하는 시즌 기준, 계약금은 연평균 */
function extCapCheck(p,pay,bonus,years){ const now=(G.rolled===G.year&&G.day>=KD(11,1))||period()==='pre'; const s=now?ctSeason():G.year+1; const a=pay+Math.round((bonus||0)/Math.max(1,years||1)); return capOwnerCheck(capPayWith(G.user,p.id,a,s).tot,capPayWith(G.user,null,null,s).tot,s,'ext'+p.id); }
function offerExtension0(id,annual,years,acc,T,lock){
  const p=G.players[id]; if(p&&p.ys)return {ok:false,st:'na',msg:'육성선수는 다년계약을 맺을 수 없습니다(연봉 1억 이하, FA·다년계약이 아닌 선수만 육성선수). 정식 선수로 등록한 뒤 제안하세요.'}; if(!canExtend(p))return {ok:false,st:'na',msg:'다년계약을 제안할 수 없는 선수입니다.'};
  const lk=Array.isArray(lock)?lock.filter(k=>typeof k==='string').slice(0,8):[]; if(T){ T={...T}; delete T.ov; }
  const cc=extCapCheck(p,T?T.annual:annual,T?T.bonus:0,years); if(cc&&!cc.ok)return {ok:false,st:'owner',msg:cc.msg}; /* 결재가 안 나면 선수에게 내밀지 못한다(라운드·역제안 그대로) */
  const who=agWho(p); const ag=hasAgent(p)?agentOf(p):null; const S=extNgOf(p); const RM=ctRoundsMax(ag);
  const ec=p.extCounter&&p.extCounter.until>=G.day?p.extCounter:null;
  if(!acc&&ec&&T&&ec.terms&&termsSame({...T,years},ec.terms))acc=true; /* 역제안을 그대로 다시 내면 수락과 같다(라운드를 쓰지 않음) */
  if(acc&&ec&&annual>=ec.annual&&years===ec.years){ delete p.extCounter; annual=Math.max(annual,0); }
  else { acc=false; const g=ctGate(S,RM); /* 유효한 역제안이 아니면 일반 제안으로 본다 */
    if(g==='cool')return {ok:false,st:'locked',msg:`${who}: 지금은 더 이야기하지 않겠습니다. ${dsh(S.fold)}부터 다시 제안해 주십시오.`};
    if(g){ ctFold(S); delete p.extCounter; if(ag){ agRelAdd(ag,-1,`${p.name} 다년계약 협상 지연`); agMemSet(ag,G.user,'fold',p.id); } return {ok:false,st:'fold',msg:`${who}: ${ctFoldTxt(g)} ${dsh(S.fold)}부터 다시 제안해 주십시오.`}; }
    ctStep(S); }
  const d=extDemandAll(p,years); /* 화면 '요구 조건'과 같은 값: 시장 평가를 원하는 선수는 그 웃돈까지 요구에 들어 있다(플레이 테스트 11-13: 요구대로 채웠는데 거절) */
  let D=null; if(T){ T={...T,years,role:T.role===0?0:null}; /* 다년계약은 '보장' 약속만(약속 탭, 계약 2단계) */ D=termsDemand(p,'ext',{annual:d,years}); annual=Math.round(termsVal(T,D)); }
  const fin=(r)=>{ if(r.st==='counter')r.msg+=ctLastTxt(S,RM); else if((S.rounds||0)>=RM){ ctFold(S); if(ag)agMemSet(ag,G.user,'fold',p.id); r.st=r.st==='market'?'market':'fold'; r.msg+=` 정해 둔 협상 횟수(${RM}회)를 다 썼습니다. ${dsh(S.fold)}부터 다시 제안해 주십시오.`; } else r.msg+=ctLastTxt(S,RM); return r; };
  /* 강경형·대형 에이전트는 원하는 기간보다 짧으면 받지 않는다 */
  if(T)T={...T,bonus:0}; /* 비FA 다년계약은 계약금이 없다(실제화) */ const J=extJudge(p,annual,years,G.user,acc,extCutEq(T,years,annual)); /* AI 다년계약과 같은 판정(계약 2단계) · 감액 한도(제보 11-17) */
  if(J.st==='min')return fin({ok:false,st:'no',msg:`${who}: ${years}년으로는 이야기가 안 됩니다. 최소 ${extMinY(p)}년은 보장해 주셔야 합니다.`});
  /* 감액 한도(제보 11-17): 보장 기간이 있어도 지금 연봉에서 한도 넘게 깎는 다년계약은 받지 않는다. 역제안을 받아들인 경우도 같다 */
  if(J.st==='cut'){ if(ag)agRelAdd(ag,-1,`${p.name} 다년계약 감액 한도 초과 제안`); return fin({ok:false,st:'no',cut:true,msg:`${who}: 지금 연봉이 ${money(p.sal)}입니다. ${J.fl>=p.sal?`다년계약은 연봉이 지금보다 올라야 합니다. 연 ${money(J.fl)} 이상이어야 이야기가 됩니다.`:`다년계약이라도 연 ${money(J.fl)} 아래로는 받을 수 없습니다(감액 한도).`}`});  }
  /* FA를 1년 앞둔 대어: 시장 평가를 받아 보겠다며 요구보다 확실히 높아야 움직인다 */
  if(J.st==='market'){ if(J.low)agRelAdd(ag,-1,`${p.name} 다년계약 낮은 제안`); return fin({ok:false,st:'market',msg:`${who}: 선수가 FA 시장 평가를 받아 보고 싶어 합니다. 연 ${money(d)} 이상이 아니면 시즌 뒤 시장에 나가겠습니다.`}); }
  /* 에이전트는 첫 제안을 그대로 받지 않는다: 요구에 가까우면 조금 올린 역제안을 낸다(카드에서 수락 가능, 그대로 다시 내도 수락) */
  if(J.st==='counter'){ const c=J.c; let ft=null; if(T){ ft=extCutFit(termsFit(T,D,c,years,[...lk,'bonus'],agPref(ag)),extFloor(p),years,[...lk,'bonus']); /* 계약금 없이 연봉으로 맞춘다 */ if(!ft)return fin({ok:false,st:'no',msg:`${who}: 거의 다 왔지만 잠그신 조건만으로는 차이를 메울 수 없습니다. ${ctUnlockTip(ag,lk)}`}); }
    p.extCounter={annual:ft?Math.ceil(termsVal(ft,D)):c,years,until:G.day+7,y:G.year,...(ft?{terms:ft}:{})}; return fin({ok:false,counter:true,st:'counter',msg:`${who}: ${agSay(ag,'ctr',p.id*7+(S.rounds||0))} ${ft?termsTxt(ft,false):`${years}년 연 ${money(c)}(총 ${money(c*years)})`}이면 바로 사인하겠습니다.`}); }
  if(J.st==='ok'){ delete p.extCounter; ctReset(S); delete p.extNg; const now=(G.rolled===G.year&&G.day>=KD(11,1))||period()==='pre'; /* 시즌이 끝난 뒤~개막 전 합의는 다가오는 시즌부터 */
    if(G.contract&&!G.contract.done&&G.contract.ended.includes(p.id)){ G.contract.ended=G.contract.ended.filter(x=>x!==p.id); if(G.contract.neg)delete G.contract.neg[p.id]; delete p.newSal; }
    if(T&&T.pm)T={...T,pm:{...T.pm,d:G.day}}; /* 보강 약속은 합의한 날부터의 영입을 센다 */
    const pay=T?T.annual:annual; const tx=T?termsTxt(T,false):`${years}년 연 ${money(annual)}(총 ${money(annual*years)})`;
    if(now){ p.sal=pay; p.yrs=years; p.cyrs=years; p.faC=true; p.ext=true; { const C=G.contract; if(C&&C.neg)delete C.neg[p.id]; if(C&&C.ended)C.ended=C.ended.filter(x=>x!==p.id); delete p.newSal; delete p.hold; } } /* 다년계약을 맺었으면 연봉 미계약 협상은 끝(개막 직전 자동 합의가 덮어쓰지 않게) */ else p.extNext={annual:pay,years,...(T?{terms:T.opt>0?{...T,optC:T.optC||optCrit(p)}:T}:{})};
    if(T&&now)termsApply(p,T,'ext',ctSeason()); else if(T&&T.bonus>0){ G.spend=G.spend||{}; G.spend.faB=(G.spend.faB||0)+T.bonus; } /* 다음 시즌 계약: 계약금만 지금 주고 나머지 조건은 새 계약이 시작될 때 반영 */
    if(now&&!T)termsClear(p); story(p,`비FA 다년계약 ${T?termsTxt(T,true):`${years}년 연 ${money(annual)}`}`,'move');
    addLog(`${p.name}와(과) 비FA 다년계약에 합의했습니다. ${tx}.`);
    if(ag){ agRelAdd(ag,3,`${p.name} 다년계약`); agDealAdd(p,G.user); agMemSet(ag,G.user,'ok',p.id); }
    capOwnerOk(cc,`${p.name} 다년계약`);
    return {ok:true,st:'ok',now,msg:`${who}: ${T?termsTxt(T,true):`${years}년 연 ${money(annual)}`}에 합의했습니다. ${now?'바로 적용됩니다.':'다음 시즌부터 적용됩니다.'}${p.postPromise?` 앞서 한 ${p.postPromise}년 포스팅 허락 약속은 그대로 남습니다(그해 포스팅 요청 때 지키거나 어겨야 합니다).`:''}`}; }
  if(ag&&J.low){ agRelAdd(ag,-2,`${p.name} 다년계약 무리한 제안`); agMemSet(ag,G.user,'low',p.id); }
  /* 에이전트는 정확한 하한 대신 조금 높여 부른다(친하면 더 정확히) */
  const pad=ag?(agRel(ag)>=60?.01:agRel(ag)>=40?.03:.06):.02; const hint=round5(d*(1+pad+hn('x'+G.year,p.id)*.03));
  return fin({ok:false,st:'no',msg:`${who}: ${T?`${years}년이면 ${termsTxt(termsDemand(p,'ext',{annual:hint,years}),true)}${D&&D.ntc?' · 트레이드 거부권':''} 안팎`:`${years}년이면 연 ${money(hint)} 안팎`}은 되어야 생각해 보겠습니다.${ag&&ag.style==='hard'?' 그 아래로는 내려가지 않습니다.':''}`});
}
function keepScore(p){ return ovr(p)+Math.max(0,p.pot-ovr(p))*(p.age<=22?.4:p.age<=24?.28:.1)+(p.faC?3:0)+(p.age>=26&&p.age<=33?1.2:0); }
/* 방출 후보 풀: 육성선수는 빼고, 남길 가치가 낮은 순. 연봉 협상 중(미계약) 선수도 넣는다: 겨울에는 재계약 대상 대부분이 미계약이라 빼면 신입·주력만 남는다(커뮤니티 제보 11-11). 방출하면 협상 목록에서도 빠진다(toFree) */
function trimPool(){ return domestic(G.user).filter(p=>!p.ys).sort((a,b)=>keepScore(a)-keepScore(b)); }
const trimUnsigned=p=>!!(G.contract&&!G.contract.done&&(G.contract.ended||[]).includes(p.id));
function trimCands(n){ return n>0?trimPool().slice(0,n):[]; } /* 한도 이하(음수)면 아무도 고르지 않는다: slice(0,-k)는 거의 전원을 돌려준다 */
/* 일괄 방출(카페 피드백 11-09v): 후보 풀 안의 선수만, 한 명씩 방출과 같은 releasePlayer로(정산금·웨이버 그대로) */
function relPick(ids){ const S=new Set((ids||[]).map(Number)); return trimPool().filter(p=>S.has(p.id)); }
function releaseMany(ids){ const L=relPick(ids), cost=L.reduce((s,p)=>s+relCost(p).tot,0); L.forEach(p=>releasePlayer(p.id)); return {n:L.length,cost}; }
/* 방출 정산금(KBO: 웨이버 공시한 선수의 그 시즌 잔여 연봉은 구단이 준다, 다년·FA 보장액도 남는다. 공략 방지 11-14):
   그 시즌 남은 연봉 100%(시즌 중이면 남은 기간 몫, 개막 전이면 계약한 연봉 전부) + 그 뒤 보장 연수 80% + 이미 합의한 다음 시즌 다년계약 80%.
   결산 뒤 겨울에는 올해 연봉을 다 줬고, 해마다 협상하는 연봉은 아직 계약 전이라 보장이 아니다. 우리·AI 같은 식 */
const REL_FUT=.8;
const relSettled=()=>!!(G.last&&G.last.y>=G.year); /* 올해 결산을 마쳤다(올해 연봉은 다 줬다) */
function relCurFrac(p){ if(relSettled())return 0; const per=period(); if(per==='pre'&&(trimUnsigned(p)||p.hold))return 0; if(per==='season'||per==='pre'){ const [a,b]=payWin(G.year), start=per==='season'?Math.max(a,G.day):a, m=milPeriod(p); const away=m?Math.max(0,Math.min(b,m.until)-Math.max(start,m.from)):0; return clamp((b-start-away)/(b-a),0,1); } return 0; }
function relCost(p){ if(!p||p.foreign)return {cur:0,next:0,fut:0,tot:0}; const c0=Math.round((p.sal||0)*relCurFrac(p)); const left=(p.yrs||1)-(relSettled()&&G.rolled===G.year?0:1); /* 계약 넘김(rolled) 뒤 겨울에는 남은 연수가 모두 다음 시즌부터 */ const fut=p.faC?Math.round(p.sal*Math.max(0,left)*REL_FUT):0, next=p.extNext?Math.round(p.extNext.annual*p.extNext.years*REL_FUT):0; const cur=c0+fut; return {cur,next,fut,tot:cur+next}; }
function releasePlayer(id){
  const p=G.players[id]; if(!p||p.team!==G.user)return;
  if(p.foreign){ releaseForeign(id); return; }
  const c=relCost(p), cost=c.tot, cd=capDeadAmt(p,G.user); payOut(G.user,cost,'rel'); /* 상한에 남는 금액은 방출 전 계약으로 미리 잰다 */
  addLog(`${p.name}을(를) 방출했습니다.${cost?` 정산금 ${money(cost)}${c.next?`(다음 시즌 확정 계약 ${money(c.next)} 포함)`:''}.`:''}${cd?` ${cd.y}시즌 경쟁균형세 상한 합계에는 연봉 ${money(cd.a)}이 그대로 남습니다.`:''} ${wvNeed(p)?`${WV_DAYS}일 동안 웨이버 공시되고, 다른 구단이 데려가면 남은 계약을 이어받아 정산금은 돌려받습니다.`:'다른 구단과 계약할 때까지 무적 선수로 남습니다.'}`);
  /* 연봉 협상 명단(ended)은 toFree의 mvLog가 합의액을 연봉으로 확정한 뒤 정리한다(검수 11-09g: 먼저 빼서 합의 연봉을 잃고 옛 연봉으로 승계) */
  for(const k in G.lineup) if(G.lineup[k]===id)delete G.lineup[k];
  toFree(p,`${tname(G.user)}에서 방출`,cost); /* 웨이버 공시 뒤 아무도 데려가지 않으면 무적 선수로 남는다 */
}
function needScore(tid,p){ const C=faPC(); let d=C&&C.dep.get(tid); if(!d){ d=depth(tid); if(C)C.dep.set(tid,d); } const o=ovr(p); /* FA 하루 입찰 중에는 구단별 뎁스를 한 번만(01_rules faPC) */
  if(p.isP){ const arr=isSPr(p)?d.sp.map(spV):d.pen.map(penV); return arr.length&&o>Math.min(...arr)+2?1:0; }
  return d.start.length&&o>Math.min(...d.start.map(x=>ovr(x)))+2?1:0; }

/* 계약 표기: "FA 4년 중 2년차", 보류권은 "3시즌 뒤 FA". 전체 연수(p.cyrs)는 계약 때 기록하고, 예전 저장은 FA 체결 연도로 거꾸로 계산한다 */
function ctSeason(){ return G.rolled===G.year?G.year+1:G.year; }
function ctInfo(p){ if(!p||!p.faC)return null; const left=Math.max(1,p.yrs||1); let tot=p.cyrs;
  if(!tot)tot=!p.ext&&p.lastFA!=null?left+Math.max(1,ctSeason()-p.lastFA)-1:left;
  tot=Math.max(tot,left); return {tot,k:tot-left+1,left,last:left===1}; }
/* FA 자격까지 남은 시즌 수(이번 시즌 포함): 등록 연수와 재자격(직전 FA 회차 후 4시즌) 중 늦은 쪽. 계약 만료와는 다르다(FA 계약은 ctInfo) */
function faLeft(p){ const n=Math.max(0,faSvc(p)-(p.svc||0)); const re=p.lastFA!=null?p.lastFA+4-ctSeason()+1:0; return Math.max(1,n,re); }
function ctText(p){ if(G.fa&&(G.fa.pool||[]).includes(p.id)&&!p.faC&&!p.ext&&(p.team==null||!G.fa.closed))return p.team==null?'FA 미계약':'FA 신분 · 협상 중'; /* 지금 FA인 선수를 다음·올 시즌 뒤 FA로 보이던 것(사용자 피드백 11-05) */ const c=ctInfo(p); if(c){ const kind=p.ext?'다년':'FA'; const ox=(ctOn(p)&&p.cOpt&&!p.cOpt.used?` · 구단 옵션 ${p.cOpt.y}년`:'')+(ctOn(p)&&p.pOut&&!p.pOut.used?` · ${p.pOut.y}시즌 뒤 옵트아웃`:''); return (c.tot===1?`${kind} 1년 계약`:c.last?`${kind} ${c.tot}년 중 마지막 해`:`${kind} ${c.tot}년 중 ${c.k}년차`)+ox; }
  if(p.retAsk&&p.retFrom!=null&&p.team==null)return `해외 복귀 · ${tshort(p.retFrom)} ${typeof ovsRetPost==='function'&&ovsRetPost(p)?'보류(원소속 구단과만 계약, FA 아님)':'우선협상 중'}`; /* 포스팅 복귀 선수는 FA가 아니다(카페 11-17) */
  if(p.extNext)return `다년 ${p.extNext.years}년 합의`; if(p.foreign)return '1년 계약';
  if(typeof milServing==='function'&&milServing(p)){ const m=milPeriod(p); return `군 복무 중(FA 연차 정지${m&&m.until?` · ${dmdY(m.until)} 전역`:''})`; } /* 복무 중에는 FA 연차가 쌓이지 않고 FA 신청도 못 한다(플레이 테스트 11-13) */
  const n=Math.max(0,faSvc(p)-(p.svc||0)); const off=G.rolled===G.year;
  /* 등록 연수를 채운 선수: 재자격(직전 FA 후 4시즌)이 남았으면 그만큼, 아니면 이번(다음) 시즌 뒤 */
  const m=faLeft(p);
  if(n===0&&p.age>37)return '단년 계약';
  return m>=2?`${m}시즌 뒤 FA`:off?'다음 시즌 뒤 FA':'올 시즌 뒤 FA'; }
