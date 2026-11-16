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
  G.agents=AG_FIRMS.map((f,i)=>({id:i,name:genName(),firm:f.firm,size:f.size,style:f.style,rels:{},deals:{},since:G.year,female:u01('agf',i+77)>.8}));
  return G.agents; }
function agById(id){ return agInit()[id]||null; }
/* 선수에게 에이전트 배정: 대어일수록 대형 에이전시로 간다. 한 번 정하면 바뀌지 않는다 */
function agentOf(p){ const A=agInit(); if(p.agId!=null&&A[p.agId])return A[p.agId];
  const o=ovr(p); const w=A.map(a=>a.size==='big'?(o>=58?3.2:o>=52?1.1:.25):a.size==='mid'?1:(o<50?1.4:.45)); const tot=sum(w); let x=u01('agp',p.id)*tot, k=0;
  for(;k<A.length-1;k++){ x-=w[k]; if(x<0)break; } p.agId=k; delete p.agent; return A[k]; }
/* 친분은 구단마다 따로 쌓인다(계약 1단계 AI 동등성): ag.rels[구단 번호]. 50(보통)은 저장하지 않는다.
   옛 저장의 ag.rel(값 하나)은 처음 읽을 때 지금 우리 구단 몫으로 옮긴다. AI 구단도 같은 규칙(제안 수준·계약·약속)으로 친분이 오르내린다 */
function agRels(ag){ if(!ag.rels)ag.rels={}; if(ag.rel!=null){ if(G.user!=null)ag.rels[G.user]=ag.rel; delete ag.rel; } return ag.rels; }
function agRel(ag,tid){ if(!ag)return 50; const v=agRels(ag)[tid??G.user]; return Math.round(v??50); }
function agRelAdd(ag,d,why,tid){ if(!ag||!d)return; tid=tid??G.user; if(tid==null)return; const big=ag.size==='big'; const v=d<0&&big?d*1.5:d; const R0=agRels(ag); const nv=clamp((R0[tid]??50)+v,0,100); if(Math.round(nv*10)===500)delete R0[tid]; else R0[tid]=Math.round(nv*10)/10;
  if(tid===G.user){ (ag.log=ag.log||[]).push({y:G.year,d:G.day,v:Math.round(v),t:why||''}); if(ag.log.length>30)ag.log.shift(); } } /* 기록(30건)은 우리 구단 것만 남긴다(저장 크기) */
/* 제안 수준에 따른 친분 변화: 사용자와 AI 구단이 같은 표를 쓴다. r = 제안 ÷ 요구 기준 */
function agOfferRel(ag,r,tid,name){ if(!ag)return; if(r>=1&&r<1.15)agRelAdd(ag,1,`${name} 성의 있는 제안`,tid); else if(r<.75)agRelAdd(ag,-4,`${name} 무리한 제안`,tid); else if(r<.9)agRelAdd(ag,-1,`${name} 낮은 제안`,tid); }
/* 협상 라운드(트레이드 역제안 왕복과 같은 방식, 16_trade TRADE_ROUNDS): 우리 제안 → 에이전트 답(수락·거절·역제안) 한 번이 1라운드.
   성향별 한도: 강경형 TRADE_ROUNDS-1, 경매형·실속형 TRADE_ROUNDS, 관계형 TRADE_ROUNDS+1. 첫 제안 뒤 CT_ROUND_DAYS(트레이드 역제안 유효 7일과 같음)가 지나도록 못 끝내면 접는다.
   접으면 CT_COOL_DAYS 동안 새 제안을 받지 않고 분위기가 떨어진다. 이미 걸어 둔 제안은 그대로 남는다. AI 구단의 입찰·인상도 같은 규칙(agShopTick) */
const CT_ROUND_DAYS=7, CT_COOL_DAYS=14;
function ctRoundsMax(ag){ const s=ag?ag.style:'fast'; return s==='hard'?TRADE_ROUNDS-1:s==='rel'?TRADE_ROUNDS+1:TRADE_ROUNDS; }
/* 라운드 상태 s: {rounds, d0(첫 제안 날), fold(다시 받는 날)}. 새 제안 전에 부른다: 'cool'(접은 뒤 대기) · 'days'(기간 초과) · 'rounds'(횟수 초과) · null(진행) */
function ctGate(s,RM){ if(s.fold!=null&&G.day<s.fold)return 'cool'; if(s.fold!=null){ delete s.fold; s.rounds=0; s.d0=null; }
  if(s.d0!=null&&G.day-s.d0>CT_ROUND_DAYS&&(s.rounds||0)>0)return 'days'; if((s.rounds||0)>=RM)return 'rounds'; return null; }
function ctStep(s){ if(s.d0==null)s.d0=G.day; s.rounds=(s.rounds||0)+1; }
function ctFold(s){ s.fold=G.day+CT_COOL_DAYS; s.rounds=0; s.d0=null; }
function ctReset(s){ s.rounds=0; s.d0=null; }
function ctFoldTxt(g){ return g==='days'?'협상을 너무 오래 끌었습니다. 이번 건은 여기서 접겠습니다.':'이미 여러 번 오갔습니다. 이번 건은 여기서 접겠습니다.'; }
function ctLastTxt(s,RM){ const n=s.rounds||0; return n>=RM?' 이번이 마지막 조건입니다.':n===RM-1?' 다음 제안이 마지막 라운드입니다.':''; }
/* 에이전트 선호: 수수료는 선수가 낸다(KBO 선수대리인 규정, 연봉·계약금의 5% 이내). 구단 비용이 아니고, 에이전트가 무엇을 먼저 챙기는지만 정한다.
   tot: 총액(수수료가 총액에 비례) · bonus: 계약금(수수료를 바로 받음) · years: 기간(고객을 오래 지킴). 역제안은 선호 항목부터 채운다 */
const AG_PREF={auction:'tot',hard:'tot',fast:'bonus',rel:'years'};
const AG_PREF_L={tot:'총액',bonus:'계약금',years:'계약 기간'};
const AG_FEE={big:3,mid:4,small:5};
function agPref(ag){ return ag?AG_PREF[ag.style]||'tot':'tot'; }
/* 옵션을 보장액보다 얼마나 낮게 보나(성향): 강경형이 가장 낮게, 관계형·실속형은 덜 깎는다 */
const AG_OPTV={hard:.8,auction:.9,fast:1,rel:1};
function agOptV(ag){ return ag?AG_OPTV[ag.style]??1:1; }
function agRelLab(r){ return r>=75?'각별함':r>=60?'친함':r>=40?'보통':r>=25?'서먹함':'불편함'; }
/* 친분이 요구 기준에 주는 영향: 친하면 덜 부르고, 불편하면 더 부른다. 관계형은 두 배, 대형은 1.5배 */
function agWantMul(ag,tid){ const r=agRel(ag,tid); const k=(ag.style==='rel'?2:1)*(ag.size==='big'?1.5:1); return (AG_STYLE[ag.style]||AG_STYLE.rel).want*(1-(r-50)/50*.035*k); }
/* 시장 확인 라운드 수: 대어일수록 많다(타구단 제시를 받아 보고 다시 묻는 과정) */
function agTier(p){ const o=ovr(p), a=(p.ask0||(p.ask&&p.ask.annual)||0); return o>=60||a>=1200?'star':o>=55||a>=600?'big':'normal'; }
function agShopN(p){ const t=agTier(p); if(t==='normal')return 0; const ag=agentOf(p); return Math.max(1,(t==='star'?3:2)+(AG_STYLE[ag.style]||{}).shop); }
function agRoundsMax(p){ return ctRoundsMax(agentOf(p)); } /* 예전: 대어 등급별 4~6회. 계약 1단계부터 성향별 라운드 한도 */
/* 거래 실적: 계약을 많이 한 구단일수록 그 에이전트 고객에게 관심을 먼저 받는다(AI 관심도 가산) */
function agDealBonus(ag,tid){ return Math.min(3,(ag&&ag.deals&&ag.deals[tid])||0)*.04; }
function agDealAdd(p,tid){ const ag=agentOf(p); ag.deals=ag.deals||{}; ag.deals[tid]=(ag.deals[tid]||0)+1; }
/* 해마다 FA 공시 때 친분은 조금씩 보통으로 돌아온다 */
function agYear(){ for(const a of agInit()){ const R0=agRels(a); for(const k of Object.keys(R0)){ const v=Math.round(50+(R0[k]-50)*.85); if(v===50)delete R0[k]; else R0[k]=v; } } } /* 모든 구단 친분이 같은 속도로 보통으로 돌아온다 */
/* 우선 제안: 친하거나 거래를 많이 한 에이전트는 협상 시작 전에 고객 한 명을 먼저 보여 준다. 경매형은 하지 않는다 */
function agPitch(){ const F=G.fa; if(!F||G.unemp)return; F.pitch={};
  for(const ag of agInit()){ if(ag.style==='auction')continue; const r=agRel(ag), dl=(ag.deals&&ag.deals[G.user])||0; if(r<65&&!(dl>=2&&r>=50))continue;
    const c=F.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.faFrom!==G.user&&agentOf(p)===ag&&!faOutBlocked(G.user,p)&&ovr(p)>=50).sort((a,b)=>ovr(b)-ovr(a))[0]; if(!c)continue;
    const disc=r>=80?.94:r>=65?.97:1; const o={annual:round5(c.ask.annual*disc),years:c.ask.years,until:F.openDay+1,ag:ag.id,tid:G.user}; F.pitch[c.id]=o;
    mail(`${ag.name} 에이전트`,`[우선 제안] ${c.name} 건`,`${ag.firm} ${ag.name}입니다. 협상이 열리기 전에 단장님께 먼저 말씀드립니다.\n\n${c.name}(${posLabel(c)}, ${c.age}세, ${c.faGrade}등급, 원소속 ${tshort(c.faFrom)})\n${o.years}년 연 ${money(o.annual)}이면 시장에 내놓지 않고 바로 사인하겠습니다. ${disc<1?`요구액(연 ${money(c.ask.annual)})보다 낮춘 조건입니다. `:''}${dstr(o.until)}까지만 유효합니다.\n\n${r>=65?'그동안의 관계를 생각해서 드리는 기회입니다.':'저희와 거래를 많이 해 주셔서 먼저 연락드립니다.'}`,{imp:true,kind:'FA',ref:c.id,face:null,acts:[{l:'이 조건으로 계약',a:'agPitchOk',v:c.id},{l:'선수 보기',a:'player',v:c.id}]}); } }
function agPitchOk(id){ const F=G.fa; const p=G.players[id]; const o=F&&F.pitch&&F.pitch[id]; if(!p||!o||p.team!=null)return '이미 끝난 제안입니다.'; if(G.day>o.until)return '우선 제안 기한이 지났습니다.'; if(o.tid!=null&&o.tid!==G.user){ delete F.pitch[id]; return '전 구단에 온 우선 제안이라 지금 구단에서는 쓸 수 없습니다.'; } if(faOutBlocked(G.user,p))return `다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다.`;
  faSign(p,[{tid:G.user,annual:o.annual,years:o.years}]); if(p.team!==G.user)return `${p.name}과(와) 계약이 성사되지 않았습니다. 우선 제안은 그대로 남아 있습니다.`; /* 협상 결렬 등으로 faSign이 사인하지 않으면 제안·보상 유지 */
  delete F.pitch[id]; agRelAdd(agById(o.ag),3,'우선 제안 수락'); return `${p.name}과(와) ${o.years}년 연 ${money(o.annual)}에 계약했습니다.`; }
/* 시장 확인 라운드: 대어는 바로 사인하지 않는다. 4~6일마다 다른 구단 제안을 모아 다시 묻고, 라운드를 다 돌면 가장 좋은 조건과 계약한다 */
function agMk(p){ const F=G.fa; F.mk=F.mk||{}; const need=agShopN(p); if(!need)return null; return F.mk[p.id]||(F.mk[p.id]={round:0,need,next:null,done:false}); }
/* 다른 구단 제안이 얼마나 정확히 전달되는지는 친분에 달렸다 */
function agTell(ag,b){ const r=agRel(ag); if(!b)return '아직 다른 구단 제안은 없습니다.';
  if(r>=60)return `${tname(b.tid)}이(가) ${b.years}년 총 ${money(b.annual*b.years)}(연 ${money(b.annual)})을 제시했습니다.`;
  if(r>=40)return `다른 구단 한 곳이 ${b.years}년 연 ${money(round5(b.annual*rnd(.97,1.03)))} 안팎을 제시했습니다.`;
  return '다른 구단에서 더 나은 조건이 들어왔다고만 말씀드리겠습니다.'; }
function agShopTick(p,mk,ai,day){ const F=G.fa; const id=p.id; if(mk.next==null){ mk.next=day+ri(3,5); return; } if(day<mk.next)return;
  const offs=Object.entries(ai).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})); const uo=faOfferLive(id)?F.offers[id]:null; /* 선수가 거절한 조건·한도에 걸린 제안은 비교 대상이 아니다 */
  if(!offs.length&&!uo){ mk.next=day+3; return; } /* 제안이 하나도 없으면 라운드를 세지 않는다 */
  const ag=agentOf(p); mk.round++; mk.next=day+ri(4,6);
  /* 다른 구단은 경쟁을 보고 조건을 올리기도 한다(자기 평가액의 112%까지) */
  const top0=[...offs,...(uo?[{tid:G.user,...uo}]:[])].sort((a,b)=>offScore(b)-offScore(a))[0];
  for(const o of offs){ const t=team(o.tid); if(!t||top0.tid===o.tid)continue; if(R()<(faTgt(t,p)?.9:ag.style==='auction'?.6:.45)){ const A0=ai[o.tid]; if(offScore(A0)>=faWantFor(p,o.tid)*.97)ctReset(A0); /* 요구를 채운 제안은 사용자처럼 라운드가 끝난 것으로 본다 */ const g=ctGate(A0,ctRoundsMax(ag)); if(g){ if(g!=='cool')ctFold(A0); continue; } /* AI 구단의 인상도 사용자와 같은 라운드·기간 한도(계약 1단계): 한도를 넘기면 접고, 걸어 둔 제안만 남는다 */ const cap=faWorth(t,p)*1.12; /* 구단주가 찍은 선수는 거의 늘 따라 올린다 */ const na=round5(Math.min(cap,Math.max(o.annual,top0.annual*(top0.years>o.years?1.04:1.01)*rnd(1,1.05)))); if(na>o.annual){ ctStep(A0); ai[o.tid].annual=na; if(top0.years>o.years&&R()<.5)ai[o.tid].years=Math.min(o.years+1,top0.years); } } }
  const best=faBestOf(p,Object.entries(ai).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})))||null;
  const last=mk.round>=mk.need; const uoRaw=F.offers[id]; const mine=uoRaw||p.faFrom===G.user;
  const myO=uo?{tid:G.user,...uo}:null; const ahead=!!myO&&(!best||faScore(p,myO)>=faScore(p,best)); const tell=agTell(ag,best)+(best&&best.tid===p.faFrom?' 원소속 구단이라 선수 마음도 그쪽으로 조금 기웁니다.':'');
  if(mine&&!G.unemp){
    const n=negOf(id); const body=`${ag.firm} ${ag.name}입니다. ${p.name} 건 시장 보고(${mk.round}/${mk.need}라운드)입니다.\n\n${ahead?'지금은 단장님 제안이 가장 좋습니다.':tell}\n${uo?`우리 구단 제안: ${uo.terms?termsTxt(uo.terms):`${uo.years}년 총 ${money(uo.annual*uo.years)}(연 ${money(uo.annual)})`}`:uoRaw?(uoRaw.rej?'단장님 제안은 선수가 이미 거절한 조건이라 비교에서 뺐습니다. 조건을 올려 다시 제안해 주십시오.':'단장님 구단은 외부 FA 영입 한도를 채워 제안이 효력이 없습니다.'):'우리 구단은 아직 제안하지 않았습니다.'}\n\n${last?(ahead?'선수와 상의해 곧 결정하겠습니다.':'이번이 마지막 라운드입니다. 곧 결정합니다.'):(ahead?'다른 구단 반응을 한 번 더 보겠습니다. 조건을 지키시면 유리합니다.':`다음 보고는 ${dsh(mk.next)}입니다. 조건을 올리실지 알려 주십시오.`)}`;
    n.log.push({d:day,w:'에이전트',t:`시장 보고 ${mk.round}/${mk.need}: ${ahead?'우리 제안이 가장 좋음':tell}`});
    const acts=[{l:'협상실 열기',a:'faOpen',v:id}]; if(!ahead&&best&&agRel(ag)>=40)acts.push({l:'최고 조건에 맞추기',a:'faMatch',v:id});
    mail(`${ag.name} 에이전트`,`${p.name} 건: 시장 보고 ${mk.round}/${mk.need}`,body,{imp:!ahead,kind:'FA',ref:id,acts}); }
  if(!last)return;
  /* 라스트 룩: 친한 에이전트는 마지막에 우리에게 같은 조건을 맞출 기회를 준다(대형은 친분 60, 그 외 55 이상) */
  if(myO&&best&&!mk.ll&&!ahead&&faScore(p,myO)>=faScore(p,best)*.9&&agRel(ag)>=(ag.size==='big'?56:48)&&!G.unemp){
    mk.ll={tid:G.user,until:Math.min(day+2,(day<=KD(1,24)?KD(1,24):dnum(G.year+1,1,24))-1), /* FA 마감(1/24) 전날까지만: 안내한 기한 전에 시장이 닫히지 않게(검수 11-08) */annual:round5(best.annual*faScore(p,best)/Math.max(1,faScore(p,{tid:G.user,annual:best.annual,years:best.years}))*1.01),years:best.years}; mk.next=day+3; /* 안내한 마감일 하루 내내 수락할 수 있게 그다음 날 결정(검수 11-08) */
    mail(`${ag.name} 에이전트`,`[라스트 룩] ${p.name} 건`,`${ag.firm} ${ag.name}입니다. 그동안의 관계를 생각해 마지막 기회를 드립니다.\n${dsh(mk.ll.until)}까지 ${mk.ll.years}년 연 ${money(mk.ll.annual)}(총 ${money(mk.ll.annual*mk.ll.years)})을 맞춰 주시면 단장님 구단과 사인하겠습니다.`,{imp:true,kind:'FA',ref:id,acts:[{l:'이 조건으로 맞추기',a:'faLL',v:id},{l:'협상실 열기',a:'faOpen',v:id}]}); return; }
  mk.done=true; }
/* 라스트 룩 수락 */
function agLastLook(id){ const F=G.fa; const p=G.players[id]; const mk=F&&F.mk&&F.mk[id]; if(!p||p.team!=null||!mk||!mk.ll)return '이미 끝난 제안입니다.'; if(mk.ll.tid!=null&&mk.ll.tid!==G.user)return '이전 구단에서 받은 라스트 룩입니다. 지금 구단에는 효력이 없습니다.'; /* 검수 11-08 */ if(G.day>mk.ll.until)return '기한이 지났습니다.';
  if(faOutBlocked(G.user,p))return `다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다.`;
  const o={annual:mk.ll.annual,years:mk.ll.years}, o0=F.offers[id]; F.offers[id]=o; faSign(p,[{tid:G.user,...o}]); if(p.team!==G.user){ if(o0)F.offers[id]=o0; else delete F.offers[id]; return `${p.name}과(와) 계약이 성사되지 않았습니다. 라스트 룩 조건은 그대로 남아 있습니다.`; } delete mk.ll; mk.done=true; agRelAdd(agentOf(p),2,'라스트 룩 수용'); return `${p.name}과(와) ${o.years}년 연 ${money(o.annual)}에 계약했습니다.`; }
/* 지금 최고 조건에 맞추기: 다른 구단 최고 제안보다 조금 높게(같은 기간) 다시 제시한다 */
function agMatchOffer(id){ const p=G.players[id]; { const n0=G.fa&&G.fa.neg&&G.fa.neg[id]; if(n0&&n0.closed)return null; } /* 결렬된 협상은 맞출 수 없다(점수 음수로 터무니없는 금액, 검수 11-08) */ const L=p?Object.entries(G.fa.ai[id]||{}).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})).filter(o=>faAiOk(o.tid,p)):[]; const rv=faBestOf(p,L); /* 정원·한도로 더 계약할 수 없는 구단 제안은 맞출 대상이 아니다(검수 11-09r) */ if(!p||!rv)return null;
  /* 같은 기간으로 점수가 앞서는 최소 연봉(원소속 정까지 감안), 에이전트 역제안이 있으면 그 이상 */
  const unit=faScore(p,{tid:G.user,annual:100,years:rv.years})/100; const need=round5(faScore(p,rv)*1.02/Math.max(.01,unit)+2); const n=G.fa.neg&&G.fa.neg[id];
  if(!(unit>0)||!isFinite(need))return null; return {annual:Math.max(need,n&&n.counter&&n.counter.years===rv.years?n.counter.annual:0),years:rv.years}; }

/* 에이전트가 있는 선수: 이미 배정됐거나, 1군급(능력 48+)·연봉 1억 이상·등록 4년차 이상. 그 밖의 어린 선수는 본인이 직접 협상한다 */
function hasAgent(p){ if(!p||p.foreign)return false; return p.agId!=null||ovr(p)>=48||(p.sal||0)>=100||(p.svc||0)>=4; }
function agWho(p){ if(!hasAgent(p))return `${p.name} 본인`; const ag=agentOf(p); return `${ag.name} 에이전트(${ag.firm})`; }
/* 연봉 협상은 순탄하다: 스타일·친분 효과를 40%만 반영 */
function agSalMul(p){ return hasAgent(p)?1+(agWantMul(agentOf(p))-1)*.4:1; }
/* 다년계약은 까다롭다: 스타일·친분을 그대로 반영하고, FA가 1년 남은 대어는 경매형·대형 에이전트가 시장을 보자고 버틴다 */
function agExtMul(p,tid){ if(!hasAgent(p))return 1; const ag=agentOf(p); let m=agWantMul(ag,tid); const near=(p.svc||0)>=faSvc(p)-1&&!p.faC; if(near&&ovr(p)>=54)m*=ag.style==='auction'?1.08:ag.size==='big'?1.05:1.02; return m; }
function agExtTestMarket(p){ if(!hasAgent(p))return false; const ag=agentOf(p); return (p.svc||0)>=faSvc(p)-1&&!p.faC&&ovr(p)>=56&&(ag.style==='auction'||ag.size==='big')&&agRel(ag)<65; }
/* 에이전트 말투(계약 1단계): 성향 × 상황별 짧은 합니다체. 같은 협상·같은 라운드면 늘 같은 문장(저장하지 않고 다시 만들어도 같다) */
const AG_SAY={
  ok:{auction:['좋은 조건입니다. 시장 반응과 함께 선수에게 전하겠습니다.','이 정도면 경쟁력이 있습니다. 비교해 보고 답을 드리겠습니다.'],hard:['요구를 맞춰 주셨습니다. 선수에게 그대로 전하겠습니다.','이 선이면 이야기가 됩니다.'],fast:['좋습니다. 선수도 반길 조건입니다.','깔끔한 조건입니다. 빨리 정리하겠습니다.'],rel:['신경 써 주셔서 감사합니다. 선수에게 잘 전하겠습니다.','단장님다운 제안입니다. 좋게 보고 있습니다.']},
  ctr:{auction:['시장 눈높이에는 조금 못 미칩니다. 저희 조건을 드립니다.','조금만 더 올려 주시면 됩니다. 이 조건이면 설득하겠습니다.'],hard:['이 선 아래로는 어렵습니다. 저희 조건은 이렇습니다.','양보할 수 있는 건 여기까지입니다.'],fast:['거의 다 왔습니다. 이렇게 맞추면 바로 정리하겠습니다.','차이가 크지 않습니다. 이 조건이면 됩니다.'],rel:['조금만 더 맞춰 주시면 좋겠습니다. 이 조건을 드립니다.','관계를 생각해 이 선에서 맞춰 보겠습니다.']},
  far:{auction:['차이가 큽니다. 시장에서 더 좋은 평가를 기대하고 있습니다.','이 조건으로는 다른 구단과 비교가 안 됩니다.'],hard:['솔직히 차이가 큽니다. 선수 평가와 거리가 멉니다.','이 금액은 받아들이기 어렵습니다.'],fast:['차이가 꽤 납니다. 조금 더 현실적인 조건을 부탁드립니다.','이대로는 정리가 어렵습니다.'],rel:['아쉽습니다. 단장님께 기대한 조건과 차이가 납니다.','선수가 서운해할 조건입니다.']},
  bad:{auction:['이 조건으로는 시장에 내놓는 편이 낫습니다.','진지한 제안으로 보기 어렵습니다.'],hard:['선수가 실망했습니다. 이야기하기 어렵습니다.','이런 제안이면 더 만날 이유가 없습니다.'],fast:['시간 낭비가 될 것 같습니다.','이 조건은 받기 어렵습니다.'],rel:['솔직히 섭섭합니다.','이런 제안은 관계에도 좋지 않습니다.']}};
function agSay(ag,k,seed){ const T=AG_SAY[k]; if(!T)return ''; const L=T[(ag&&ag.style)||'fast']||T.fast; return L[Math.floor(u01('ags'+k,seed||0)*L.length)%L.length]; }
/* 상황 한 줄: 경쟁 구단·마감 */
function agCtxTxt(p,nAI,dl){ const L=[]; if(nAI)L.push(nAI>=2?`다른 구단 ${nAI}곳도 관심을 보이고 있습니다.`:'다른 구단도 관심을 보이고 있습니다.'); if(dl!=null&&dl-G.day<=7&&dl>=G.day)L.push(`마감(${dsh(dl)})이 얼마 남지 않았습니다.`); return L.join(' '); }
