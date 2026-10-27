/* ===== 연봉 ===== */
function perfOf(h,isP){
  if(!h)return null;
  if(isP){ if(h.outs<75)return null; return clamp(35+(6.2-pRate(h).era)/3.2*33,20,80); }
  if(h.pa<120)return null; return clamp(35+(bRate(h).ops-.55)/.35*30,20,80);
}
function seasonTotal(p,y,lvl){ const hs=p.hist.filter(h=>h.y===y&&!h.y2&&(!lvl||h.lvl===lvl)); if(!hs.length)return null; const tot=Object.assign({},hs[0]); for(const h of hs.slice(1))addTo(tot,h); tot.pos=hs[hs.length-1].pos; tot.t=hs[hs.length-1].t; return tot; }
function perfOvr(p,n){
  const ys=[...new Set(p.hist.filter(h=>h.lvl==='1군').map(h=>h.y))].slice(-n);
  /* 표본이 적은 시즌은 능력치 쪽으로 당긴다: 투수 이닝/(이닝+60), 타자 타석/(타석+250) */
  const vals=ys.map(y=>{ const h=seasonTotal(p,y,'1군'); const v=perfOf(h,p.isP); if(v==null)return null; const w=p.isP?h.outs/(h.outs+180):h.pa/(h.pa+250); return v*w+ovr(p)*(1-w); }).filter(v=>v!=null);
  if(!vals.length)return null; if(vals.length===1)return vals[0];
  const w=vals.map((_,i)=>i+1); return sum(vals.map((v,i)=>v*w[i]))/sum(w);
}
function newSalary(p){
  const pf=perfOvr(p,2); const base=pf==null?ovr(p):pf;
  if(p.foreign&&p.kept&&p.kept.y===G.year)return p.kept.sal;
  if(p.foreign){ if(p.foreign==='아시아')return round5(clamp(100+(base-44)*16,p.sal*.8,p.sal+10*USD)); return round5(clamp(300+(base-46)*62,p.sal*.7,p.sal*1.7)); }
  /* FA 전에는 보류권 때문에 시장가보다 훨씬 낮다: 3년 미만 35%, 6년 미만 50%, FA 직전 60%. 연차별 상한은 KBO 최고 기록 수준(4년차 5억 등) */
  /* FA 자격이 있어도 신청하지 않고 남은 선수는 여전히 보류 선수다: 시장가의 55%, 인상 50% 이내, 7억 상한 */
  const skip=p.svc>=faSvc(p)&&!p.faC&&!p.ext;
  const f=p.svc<3?.3:p.svc<6?.4:p.svc<faSvc(p)?.5:skip?.55:1;
  /* 연봉 삭감 한도: 3억 이상 40%, 그 아래 30%까지 깎을 수 있다 */
  const lo=p.sal*(p.sal>=300?.6:.7);
  /* 올해 1군 표본이 적으면(120타석·25이닝 미만) 시장가가 아니라 올해 기여로 소폭만 움직인다 */
  const h=seasonTotal(p,G.year,'1군'); const enough=h&&(p.isP?h.outs>=75:h.pa>=120); const war=h?warOf(h,p):0;
  if(!enough){ const fu=seasonTotal(p,G.year,'퓨처스'); const fw=fu?warOf(fu,p):0; return round5(Math.max(MIN_SAL,clamp(p.sal*(1+clamp(war*.15+fw*.05,-.1,.15)),lo,p.sal*1.15))); }
  /* 인상 폭 상한은 올해 WAR로 정한다: WAR 0이면 +10%, 1이면 +45%, 3이면 +115%, 5 이상이면 +190% */
  const up=war<=0?1.0:1+clamp(.1+war*.35,.1,1.9);
  /* 잘한 선수는 깎지 않는다: WAR 3 이상 +5% 이상, 2 이상 동결 이상, 1 이상 최대 -10%, 0 이상 최대 -20% */
  const lo2=war>=3?p.sal*1.05:war>=2?p.sal:war>=1?p.sal*.9:war>=0?p.sal*.8:lo;
  const v=round5(clamp(marketSal(base)*f,Math.max(lo,lo2),Math.max(p.sal*up,lo2)));
  if(skip)return round5(Math.min(v,Math.max(p.sal,Math.min(700,p.sal*1.5))));
  return p.svc<faSvc(p)&&!p.faC?Math.min(v,Math.max(p.sal,preCap(p))):v;
}
/* 보류권 선수 연봉 상한(다음 시즌 기준). FA 전에는 5억을 넘기 어렵다(김도영 4년차 5억이 최고 수준). 마지막 해만 6~7억까지 */
const PRE_CAP=[30,80,150,300,400,500,600,700];
function preCap(p){ return PRE_CAP[clamp(p.svc||0,0,PRE_CAP.length-1)]; }
function faAsk(p){
  const pf=perfOvr(p,3); const base=pf==null?ovr(p):pf*.7+ovr(p)*.3;
  const af=p.age<30?1.15:p.age<=32?1:p.age<=34?.8:.6;
  const years=p.age<=30?4:p.age<=32?3:p.age<=34?2:1;
  return {annual:round5(marketSal(base)*1.05*af),years};
}
function extDemand(p,years){
  const pf=perfOvr(p,2); const self=p.age<=27?ovr(p)+(p.pot-ovr(p))*.5:ovr(p)-Math.max(0,p.age-31);
  const base=pf==null?self:self*.6+pf*.4;
  const near=p.svc>=faSvc(p)-2?1.12:p.svc>=faSvc(p)-4?1:.88;
  const yadj=p.age<=29?1+.025*(years-1):1-.035*(years-1);
  return round5(marketSal(base)*near*yadj*(1-((p.mor??60)-60)/400)*(p.pers&&p.pers.loy>=15?.95:1));
}
function canExtend(p){ return p&&p.team===G.user&&!p.foreign&&!p.extNext&&!(p.joinY>G.year)&&(!p.faC||p.yrs<=1)&&p.age<=34&&!p.prospect&&!(G.contract&&!G.contract.done&&G.contract.ended.includes(p.id)); }
function offerExtension(id,annual,years){
  const p=G.players[id]; if(!canExtend(p))return {ok:false,msg:'다년계약을 제안할 수 없는 선수입니다.'};
  const wk=Math.floor(G.day/7);
  if(p.extTried===wk)return {ok:false,msg:`${p.name} 측: 이번 주에는 더 이야기하지 않겠습니다. 다음 주에 다시 제안해 주세요.`};
  const d=extDemand(p,years);
  if(annual>=d*.98){ const now=G.rolled===G.year&&G.day>=KD(11,1);
    if(now){ p.sal=annual; p.yrs=years; p.faC=true; p.ext=true; } else p.extNext={annual,years}; story(p,`비FA 다년계약 ${years}년 연 ${money(annual)}`,'move');
    addLog(`${p.name}와(과) 비FA 다년계약 ${years}년 연 ${money(annual)}(총 ${money(annual*years)})에 합의했습니다.`);
    return {ok:true,msg:`${p.name} 측이 ${years}년 연 ${money(annual)}에 합의했습니다. ${now?'바로 적용됩니다.':'다음 시즌부터 적용됩니다.'}`}; }
  p.extTried=wk;
  const hint=round5(d*(1+hn('x'+G.year,p.id)*.04));
  return {ok:false,msg:`${p.name} 측: 연 ${money(hint)} 안팎은 되어야 생각해 보겠다는 반응입니다.`};
}
function keepScore(p){ return ovr(p)+Math.max(0,p.pot-ovr(p))*(p.age<=22?.4:p.age<=24?.28:.1)+(p.faC?3:0)+(p.age>=26&&p.age<=33?1.2:0); }
function trimCands(n){ return domestic(G.user).filter(p=>!p.ys&&!(G.contract&&!G.contract.done&&G.contract.ended.includes(p.id))).sort((a,b)=>keepScore(a)-keepScore(b)).slice(0,n); }
function releasePlayer(id){
  const p=G.players[id]; if(!p||p.team!==G.user)return;
  if(p.foreign){ releaseForeign(id); return; }
  const cost=p.faC?Math.round(p.sal*p.yrs*.5):0; payOut(G.user,cost,'rel');
  addLog(`${p.name}을(를) 방출했습니다.${cost?` 남은 계약 정산금 ${money(cost)}.`:''}`); story(p,`${tname(p.team)}에서 방출`,'move');
  if(G.contract){ G.contract.ended=G.contract.ended.filter(x=>x!==id); }
  for(const k in G.lineup) if(G.lineup[k]===id)delete G.lineup[k];
  delete G.players[id];
}
function needScore(tid,p){ const d=depth(tid); const o=ovr(p);
  if(p.isP){ const arr=isSPr(p)?d.sp.map(spV):d.pen.map(penV); return arr.length&&o>Math.min(...arr)+2?1:0; }
  return d.start.length&&o>Math.min(...d.start.map(x=>ovr(x)))+2?1:0; }

