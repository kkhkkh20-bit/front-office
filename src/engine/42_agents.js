/* ===== FA 에이전트: 리그에 고정된 에이전트 명단 =====
   실제 KBO도 대형 에이전시 몇 곳이 대어 FA 대부분을 맡는다. 에이전트는 해마다 같은 사람이라 단장과의 친분과 거래 실적이 쌓인다.
   - 규모: 대형(big)은 대어 고객이 많고 자존심이 세다. 함부로 대하면 친분이 크게 깎이고, 친하면 우선 제안과 라스트 룩을 준다
   - 스타일: 경매형(시장을 끝까지 돌린다) / 강경형(요구액을 잘 안 깎는다) / 실속형(조건이 맞으면 빨리 끝낸다) / 관계형(친분을 크게 본다)
   - 친분(rel, 0~100, 기본 50): 요구 기준, 협상 분위기, 동점일 때 선택, 정보를 얼마나 정확히 알려 주는지에 영향
   - 거래 실적(deals): 계약을 많이 한 구단에 먼저 연락한다 */
const AG_FIRMS=[
  {firm:'스타플러스',size:'big',style:'auction'},{firm:'리드매니지먼트',size:'big',style:'hard'},
  {firm:'한빛스포츠',size:'mid',style:'rel'},{firm:'넥스트에이전시',size:'mid',style:'fast'},{firm:'베이스라인',size:'mid',style:'auction'},
  {firm:'더그아웃파트너스',size:'small',style:'fast'},{firm:'다이아몬드스포츠',size:'small',style:'rel'},{firm:'원팀매니지먼트',size:'small',style:'hard'}];
const AG_SIZE={big:'대형 에이전시',mid:'중견 에이전시',small:'개인 에이전트'};
const AG_STYLE={
  auction:{l:'경매형',d:'시장을 끝까지 돌려 가장 높은 값을 찾습니다. 다른 구단 제안을 지렛대로 씁니다.',want:1.03,shop:1},
  hard:{l:'강경형',d:'요구액에서 잘 물러서지 않습니다. 낮은 제안에 크게 실망합니다.',want:1.06,shop:0},
  fast:{l:'실속형',d:'조건이 맞으면 오래 끌지 않고 빨리 끝냅니다.',want:.98,shop:-1},
  rel:{l:'관계형',d:'구단과의 친분과 그동안의 거래를 크게 봅니다.',want:1,shop:0}};
function agInit(){ if(G.agents&&G.agents.length)return G.agents;
  G.agents=AG_FIRMS.map((f,i)=>({id:i,name:genName(),firm:f.firm,size:f.size,style:f.style,rel:50,deals:{},since:G.year,female:u01('agf',i+77)>.8}));
  return G.agents; }
function agById(id){ return agInit()[id]||null; }
/* 선수에게 에이전트 배정: 대어일수록 대형 에이전시로 간다. 한 번 정하면 바뀌지 않는다 */
function agentOf(p){ const A=agInit(); if(p.agId!=null&&A[p.agId])return A[p.agId];
  const o=ovr(p); const w=A.map(a=>a.size==='big'?(o>=58?3.2:o>=52?1.1:.25):a.size==='mid'?1:(o<50?1.4:.45)); const tot=sum(w); let x=u01('agp',p.id)*tot, k=0;
  for(;k<A.length-1;k++){ x-=w[k]; if(x<0)break; } p.agId=k; delete p.agent; return A[k]; }
function agRel(ag){ return ag?Math.round(ag.rel??50):50; }
function agRelAdd(ag,d,why){ if(!ag||!d)return; const big=ag.size==='big'; const v=d<0&&big?d*1.5:d; ag.rel=clamp((ag.rel??50)+v,0,100); (ag.log=ag.log||[]).push({y:G.year,d:G.day,v:Math.round(v),t:why||''}); if(ag.log.length>30)ag.log.shift(); }
function agRelLab(r){ return r>=75?'각별함':r>=60?'친함':r>=40?'보통':r>=25?'서먹함':'불편함'; }
/* 친분이 요구 기준에 주는 영향: 친하면 덜 부르고, 불편하면 더 부른다. 관계형은 두 배, 대형은 1.5배 */
function agWantMul(ag){ const r=agRel(ag); const k=(ag.style==='rel'?2:1)*(ag.size==='big'?1.5:1); return (AG_STYLE[ag.style]||AG_STYLE.rel).want*(1-(r-50)/50*.035*k); }
/* 시장 확인 라운드 수: 대어일수록 많다(타구단 제시를 받아 보고 다시 묻는 과정) */
function agTier(p){ const o=ovr(p), a=(p.ask0||(p.ask&&p.ask.annual)||0); return o>=60||a>=1200?'star':o>=55||a>=600?'big':'normal'; }
function agShopN(p){ const t=agTier(p); if(t==='normal')return 0; const ag=agentOf(p); return Math.max(1,(t==='star'?3:2)+(AG_STYLE[ag.style]||{}).shop); }
function agRoundsMax(p){ const t=agTier(p); return t==='star'?6:t==='big'?5:4; }
/* 거래 실적: 계약을 많이 한 구단일수록 그 에이전트 고객에게 관심을 먼저 받는다(AI 관심도 가산) */
function agDealBonus(ag,tid){ return Math.min(3,(ag&&ag.deals&&ag.deals[tid])||0)*.04; }
function agDealAdd(p,tid){ const ag=agentOf(p); ag.deals=ag.deals||{}; ag.deals[tid]=(ag.deals[tid]||0)+1; }
/* 해마다 FA 공시 때 친분은 조금씩 보통으로 돌아온다 */
function agYear(){ for(const a of agInit()){ a.rel=Math.round(50+((a.rel??50)-50)*.85); } }
/* 우선 제안: 친하거나 거래를 많이 한 에이전트는 협상 시작 전에 고객 한 명을 먼저 보여 준다. 경매형은 하지 않는다 */
function agPitch(){ const F=G.fa; if(!F||G.unemp)return; F.pitch={};
  for(const ag of agInit()){ if(ag.style==='auction')continue; const r=agRel(ag), dl=(ag.deals&&ag.deals[G.user])||0; if(r<65&&!(dl>=2&&r>=50))continue;
    const c=F.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.faFrom!==G.user&&agentOf(p)===ag&&!faOutBlocked(G.user,p)&&ovr(p)>=50).sort((a,b)=>ovr(b)-ovr(a))[0]; if(!c)continue;
    const disc=r>=80?.94:r>=65?.97:1; const o={annual:round5(c.ask.annual*disc),years:c.ask.years,until:F.openDay+1,ag:ag.id}; F.pitch[c.id]=o;
    mail(`${ag.name} 에이전트`,`[우선 제안] ${c.name} 건`,`${ag.firm} ${ag.name}입니다. 협상이 열리기 전에 단장님께 먼저 말씀드립니다.\n\n${c.name}(${posLabel(c)}, ${c.age}세, ${c.faGrade}등급, 원소속 ${tshort(c.faFrom)})\n${o.years}년 연 ${money(o.annual)}이면 시장에 내놓지 않고 바로 사인하겠습니다. ${disc<1?`요구액(연 ${money(c.ask.annual)})보다 낮춘 조건입니다. `:''}${dstr(o.until)}까지만 유효합니다.\n\n${r>=65?'그동안의 관계를 생각해서 드리는 기회입니다.':'저희와 거래를 많이 해 주셔서 먼저 연락드립니다.'}`,{imp:true,kind:'FA',ref:c.id,face:null,acts:[{l:'이 조건으로 계약',a:'agPitchOk',v:c.id},{l:'선수 보기',a:'player',v:c.id}]}); } }
function agPitchOk(id){ const F=G.fa; const p=G.players[id]; const o=F&&F.pitch&&F.pitch[id]; if(!p||!o||p.team!=null)return '이미 끝난 제안입니다.'; if(G.day>o.until)return '우선 제안 기한이 지났습니다.'; if(faOutBlocked(G.user,p))return `다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다.`;
  delete F.pitch[id]; faSign(p,[{tid:G.user,annual:o.annual,years:o.years}]); agRelAdd(agById(o.ag),3,'우선 제안 수락'); return `${p.name}과(와) ${o.years}년 연 ${money(o.annual)}에 계약했습니다.`; }
/* 시장 확인 라운드: 대어는 바로 사인하지 않는다. 4~6일마다 다른 구단 제안을 모아 다시 묻고, 라운드를 다 돌면 가장 좋은 조건과 계약한다 */
function agMk(p){ const F=G.fa; F.mk=F.mk||{}; const need=agShopN(p); if(!need)return null; return F.mk[p.id]||(F.mk[p.id]={round:0,need,next:null,done:false}); }
/* 다른 구단 제안이 얼마나 정확히 전달되는지는 친분에 달렸다 */
function agTell(ag,b){ const r=agRel(ag); if(!b)return '아직 다른 구단 제안은 없습니다.';
  if(r>=60)return `${tname(b.tid)}이(가) ${b.years}년 총 ${money(b.annual*b.years)}(연 ${money(b.annual)})을 제시했습니다.`;
  if(r>=40)return `다른 구단 한 곳이 ${b.years}년 연 ${money(round5(b.annual*rnd(.97,1.03)))} 안팎을 제시했습니다.`;
  return '다른 구단에서 더 나은 조건이 들어왔다고만 말씀드리겠습니다.'; }
function agShopTick(p,mk,ai,day){ const F=G.fa; const id=p.id; if(mk.next==null){ mk.next=day+ri(3,5); return; } if(day<mk.next)return;
  const offs=Object.entries(ai).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})); const uo=F.offers[id];
  if(!offs.length&&!uo){ mk.next=day+3; return; } /* 제안이 하나도 없으면 라운드를 세지 않는다 */
  const ag=agentOf(p); mk.round++; mk.next=day+ri(4,6);
  /* 다른 구단은 경쟁을 보고 조건을 올리기도 한다(자기 평가액의 112%까지) */
  const top0=[...offs,...(uo?[{tid:G.user,...uo}]:[])].sort((a,b)=>offScore(b)-offScore(a))[0];
  for(const o of offs){ const t=team(o.tid); if(!t||top0.tid===o.tid)continue; if(R()<(ag.style==='auction'?.6:.45)){ const cap=faWorth(t,p)*1.12; const na=round5(Math.min(cap,Math.max(o.annual,top0.annual*(top0.years>o.years?1.04:1.01)*rnd(1,1.05)))); if(na>o.annual){ ai[o.tid].annual=na; if(top0.years>o.years&&R()<.5)ai[o.tid].years=Math.min(o.years+1,top0.years); } } }
  const best=faBestOf(p,Object.entries(ai).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})))||null;
  const last=mk.round>=mk.need; const mine=uo||p.faFrom===G.user;
  const myO=uo?{tid:G.user,...uo}:null; const ahead=!!myO&&(!best||faScore(p,myO)>=faScore(p,best)); const tell=agTell(ag,best)+(best&&best.tid===p.faFrom?' 원소속 구단이라 선수 마음도 그쪽으로 조금 기웁니다.':'');
  if(mine&&!G.unemp){
    const n=negOf(id); const body=`${ag.firm} ${ag.name}입니다. ${p.name} 건 시장 보고(${mk.round}/${mk.need}라운드)입니다.\n\n${ahead?'지금은 단장님 제안이 가장 좋습니다.':tell}\n${uo?`우리 구단 제안: ${uo.years}년 총 ${money(uo.annual*uo.years)}(연 ${money(uo.annual)})`:'우리 구단은 아직 제안하지 않았습니다.'}\n\n${last?(ahead?'선수와 상의해 곧 결정하겠습니다.':'이번이 마지막 라운드입니다. 곧 결정합니다.'):(ahead?'다른 구단 반응을 한 번 더 보겠습니다. 조건을 지키시면 유리합니다.':`다음 보고는 ${dsh(mk.next)}입니다. 조건을 올리실지 알려 주십시오.`)}`;
    n.log.push({d:day,w:'에이전트',t:`시장 보고 ${mk.round}/${mk.need}: ${ahead?'우리 제안이 가장 좋음':tell}`});
    const acts=[{l:'협상실 열기',a:'faOpen',v:id}]; if(!ahead&&best&&agRel(ag)>=40)acts.push({l:'최고 조건에 맞추기',a:'faMatch',v:id});
    mail(`${ag.name} 에이전트`,`${p.name} 건: 시장 보고 ${mk.round}/${mk.need}`,body,{imp:!ahead,kind:'FA',ref:id,acts}); }
  if(!last)return;
  /* 라스트 룩: 친한 에이전트는 마지막에 우리에게 같은 조건을 맞출 기회를 준다(대형은 친분 60, 그 외 55 이상) */
  if(myO&&best&&!mk.ll&&!ahead&&faScore(p,myO)>=faScore(p,best)*.9&&agRel(ag)>=(ag.size==='big'?56:48)&&!G.unemp){
    mk.ll={until:day+2,annual:round5(best.annual*faScore(p,best)/Math.max(1,faScore(p,{tid:G.user,annual:best.annual,years:best.years}))*1.01),years:best.years}; mk.next=day+2;
    mail(`${ag.name} 에이전트`,`[라스트 룩] ${p.name} 건`,`${ag.firm} ${ag.name}입니다. 그동안의 관계를 생각해 마지막 기회를 드립니다.\n${dsh(mk.ll.until)}까지 ${mk.ll.years}년 연 ${money(mk.ll.annual)}(총 ${money(mk.ll.annual*mk.ll.years)})을 맞춰 주시면 단장님 구단과 사인하겠습니다.`,{imp:true,kind:'FA',ref:id,acts:[{l:'이 조건으로 맞추기',a:'faLL',v:id},{l:'협상실 열기',a:'faOpen',v:id}]}); return; }
  mk.done=true; }
/* 라스트 룩 수락 */
function agLastLook(id){ const F=G.fa; const p=G.players[id]; const mk=F&&F.mk&&F.mk[id]; if(!p||p.team!=null||!mk||!mk.ll)return '이미 끝난 제안입니다.'; if(G.day>mk.ll.until)return '기한이 지났습니다.';
  const o={annual:mk.ll.annual,years:mk.ll.years}; F.offers[id]=o; delete mk.ll; mk.done=true; faSign(p,[{tid:G.user,...o}]); agRelAdd(agentOf(p),2,'라스트 룩 수용'); return `${p.name}과(와) ${o.years}년 연 ${money(o.annual)}에 계약했습니다.`; }
/* 지금 최고 조건에 맞추기: 다른 구단 최고 제안보다 조금 높게(같은 기간) 다시 제시한다 */
function agMatchOffer(id){ const p=G.players[id]; const L=Object.entries(G.fa.ai[id]||{}).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})); const rv=faBestOf(p,L); if(!p||!rv)return null;
  /* 같은 기간으로 점수가 앞서는 최소 연봉(원소속 정까지 감안), 에이전트 역제안이 있으면 그 이상 */
  const unit=faScore(p,{tid:G.user,annual:100,years:rv.years})/100; const need=round5(faScore(p,rv)*1.02/Math.max(.01,unit)+2); const n=G.fa.neg&&G.fa.neg[id];
  return {annual:Math.max(need,n&&n.counter&&n.counter.years===rv.years?n.counter.annual:0),years:rv.years}; }

/* 에이전트가 있는 선수: 이미 배정됐거나, 1군급(능력 48+)·연봉 1억 이상·등록 4년차 이상. 그 밖의 어린 선수는 본인이 직접 협상한다 */
function hasAgent(p){ if(!p||p.foreign)return false; return p.agId!=null||ovr(p)>=48||(p.sal||0)>=100||(p.svc||0)>=4; }
function agWho(p){ if(!hasAgent(p))return `${p.name} 본인`; const ag=agentOf(p); return `${ag.name} 에이전트(${ag.firm})`; }
/* 연봉 협상은 순탄하다: 스타일·친분 효과를 40%만 반영 */
function agSalMul(p){ return hasAgent(p)?1+(agWantMul(agentOf(p))-1)*.4:1; }
/* 다년계약은 까다롭다: 스타일·친분을 그대로 반영하고, FA가 1년 남은 대어는 경매형·대형 에이전트가 시장을 보자고 버틴다 */
function agExtMul(p){ if(!hasAgent(p))return 1; const ag=agentOf(p); let m=agWantMul(ag); const near=(p.svc||0)>=faSvc(p)-1&&!p.faC; if(near&&ovr(p)>=54)m*=ag.style==='auction'?1.08:ag.size==='big'?1.05:1.02; return m; }
function agExtTestMarket(p){ if(!hasAgent(p))return false; const ag=agentOf(p); return (p.svc||0)>=faSvc(p)-1&&!p.faC&&ovr(p)>=56&&(ag.style==='auction'||ag.size==='big')&&agRel(ag)<65; }
