/* ===== 트레이드 매물과 FA 에이전트 협상 ===== */
const WANT={any:'가장 좋은 제안',prospect:'유망주',p:'투수',b:'야수',sal:'연봉 절감'};
function blockAdd(id,want){ const p=G.players[id]; if(!p||p.team!==G.user||p.foreign)return; p.listed=true; p.lw=want||p.lw||'any'; }
function blockRemove(id){ const p=G.players[id]; if(!p)return; delete p.listed; delete p.lw; G.offers=(G.offers||[]).filter(o=>!(o.blk&&o.get.includes(id))); }
function corePool(tid){ const t=team(tid); const ds=domestic(tid).filter(p=>!p.ys); const core=new Set(ds.map(p=>({p,v:tval(t,p,'out')})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.p.id)); return ds.filter(p=>!core.has(p.id)); }
function pickPackage(tid,budget,want,exclude){ const t=team(tid); exclude=exclude||[];
  let pool=corePool(tid).filter(p=>!exclude.includes(p.id)&&healthy(p)).map(p=>({p,v:tval(t,p,'out')*(p.aiListed?.85:1),u:tval(team(G.user),p,'in')})).filter(x=>x.v>0.3&&x.u>0.3);
  if(want==='prospect')pool=pool.filter(x=>x.p.age<=24&&x.p.pot-ovr(x.p)>=6); else if(want==='p')pool=pool.filter(x=>x.p.isP); else if(want==='b')pool=pool.filter(x=>!x.p.isP);
  let best=null,bs=-1; const sc=arr=>{ const v=sum(arr.map(x=>x.v)); if(v>budget)return -1; return want==='sal'?v*.4-sum(arr.map(x=>x.p.sal))/100:v; };
  for(let i=0;i<pool.length;i++){ const s=sc([pool[i]]); if(s>bs){bs=s;best=[pool[i]];} for(let j=i+1;j<pool.length;j++){ const s2=sc([pool[i],pool[j]])-.4; if(s2>bs){bs=s2;best=[pool[i],pool[j]];} } }
  if(!best||sum(best.map(x=>x.v))<budget*.45)return null; return best.map(x=>x.p.id); }
function blockDaily(){ if(!tradeOpen())return; const got=[];
  for(const p of domestic(G.user).filter(x=>x.listed)){ const n=(G.offers||[]).filter(o=>o.blk&&o.get.includes(p.id)).length; if(n>=3)continue;
    for(const t of G.teams){ if(t.id===G.user||(G.offers||[]).some(o=>o.from===t.id&&o.get.includes(p.id))||R()>(p.urgent?.5:.3))continue;
      const v=tval(t,p,'in'), need=tradeNeed(t,v*.6); const budget=(v-need)*(p.urgent?.82:1); if(budget<1)continue;
      const give=pickPackage(t.id,budget,p.lw||'any'); if(!give)continue;
      G.offers=(G.offers||[]).concat({id:'o'+Math.floor(R()*1e9),from:t.id,give,get:[p.id],exp:period()==='season'?Math.min(G.day+7,tradeDL()):G.day+7,blk:true,day:G.day}); got.push(`${t.city} ${t.nick} → ${p.name}`); break; } }
  if(got.length)note('트레이드',`트레이드 매물에 새 제안이 왔습니다: ${got.join(', ')}. 트레이드 → 트레이드 매물에서 확인하세요.`); }
function offerMore(id){ const o=(G.offers||[]).find(x=>x.id===id); if(!o)return '제안이 없습니다.'; const t=team(o.from); if(o.more)return `${t.city} ${t.nick} 단장: 이미 한 번 올렸습니다. 이게 마지막입니다.`;
  o.more=true; const x=R(); if(x<.33+(t.rel-50)/100){ const p=G.players[o.get[0]]; const add=pickPackage(t.id,Math.max(1.5,tval(t,p,'in')*.35),'any',o.give); if(add){ o.give=o.give.concat(add.slice(0,1)); o.exp=G.day+3; return `${t.city} ${t.nick} 단장: 좋습니다. ${G.players[add[0]].name}을(를) 더 얹겠습니다.`; } }
  if(x>.8){ G.offers=G.offers.filter(y=>y.id!==id); t.rel=clamp(t.rel-2,0,100); return `${t.city} ${t.nick} 단장: 그 조건이면 없던 일로 하겠습니다. (제안 철회)`; }
  return `${t.city} ${t.nick} 단장: 이게 저희가 낼 수 있는 최선입니다.`; }
/* 다른 구단 트레이드 매물: 이유가 있는 선수를 올리고 6주까지 둔다. 압박받는 단장·연봉 초과 구단은 급매 */
const BLKWHY={reb:'리빌딩 정리',room:'자리 없음',dup:'중복 자원',sal:'연봉 정리'};
function aiBlockWeekly(){ if(!tradeOpen())return;
  for(const p of playersOf(G.user)){ delete p.aiListed; delete p.aiWhy; delete p.aiUrg; }
  for(const t of G.teams){ if(t.id===ME())continue; const ds=domestic(t.id).filter(p=>!p.ys&&healthy(p)&&!(p.joinY>G.year));
    for(const p of ds){ if(p.aiListed&&G.day-(p.aiLd||G.day)>42){ delete p.aiListed; delete p.aiWhy; delete p.aiUrg; delete p.aiLd; } }
    const cur=ds.filter(p=>p.aiListed); const heat=gmHeat(t.id); const ci=capInfo(t.id);
    if(cur.length<2&&R()<.55){ const top3=new Set([...ds].sort((x,y)=>ovr(y)-ovr(x)).slice(0,3).map(q=>q.id)); const d=depth(t.id); const st=new Set([...d.start,...d.sp,...d.pen.slice(0,3)].map(q=>q.id)); let pk=null, why=null;
      if(ci.pay>ci.cap*.97){ pk=ds.filter(p=>!top3.has(p.id)&&!p.aiListed).sort((x,y)=>y.sal-x.sal)[0]; why='sal'; }
      if(!pk&&t.mode==='rebuild'){ pk=ds.filter(p=>p.age>=29&&ovr(p)>=50&&!p.aiListed).sort((x,y)=>y.sal-x.sal)[0]; why='reb'; }
      if(!pk&&R()<.5){ pk=ds.filter(p=>p.age<=25&&!st.has(p.id)&&p.pot-ovr(p)>=6&&!p.aiListed).sort((x,y)=>ovr(y)-ovr(x))[0]; why='room'; }
      if(!pk){ const rk=slotRanks(t.id); pk=ds.filter(p=>!st.has(p.id)&&!top3.has(p.id)&&ovr(p)>=48&&!p.aiListed&&rk[pSlot(p)]&&rk[pSlot(p)].rank<=4).sort((x,y)=>ovr(y)-ovr(x))[0]; why='dup'; }
      if(pk){ pk.aiListed=true; pk.aiWhy=why; pk.aiLd=G.day; } }
    for(const p of ds.filter(q=>q.aiListed)){ p.aiUrg=p.aiWhy==='sal'&&ci.pay>ci.cap||heat>=.6||(G.day-(p.aiLd||G.day)>35); } } }
/* FA 에이전트 */
function negOf(id){ const F=G.fa; F.neg=F.neg||{}; if(!F.neg[id]){ const ag=G.players[id]?agentOf(G.players[id]):null; F.neg[id]={rounds:0,mood:clamp(Math.round(50+(agRel(ag)-50)*.6),25,85),log:[],counter:null,closed:false,warned:false}; } return F.neg[id]; }
const offScore=o=>o.annual*(1+.06*(o.years-1));
function faNegotiate(id,o){ const F=G.fa; const p=G.players[id]; const ag=agentOf(p); const n=negOf(id);
  const T=o.terms?{...o.terms}:null; const D=T?termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years}):null; if(T)o={annual:Math.round(termsVal(T,D)),years:T.years,terms:T};
  if(faOutBlocked(G.user,p))return {msg:`이번 겨울 다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다(KBO 규약 제173조). 이미 ${faOutN(G.user)}명을 데려왔습니다.`};
  if(n.closed)return {msg:`${ag.name} 에이전트가 더 이상 우리와 협상하지 않습니다.`};
  const RM=agRoundsMax(p); if(n.rounds>=RM)return {msg:`협상 횟수(${RM}회)를 다 썼습니다. 지금 조건이 마지막입니다.`};
  /* 대형 에이전트의 역제안을 무시하고 더 낮게 부르면 기분이 상한다 */
  if(n.counter&&ag.size==='big'&&offScore(o)<offScore(n.counter)*.97){ n.mood=clamp(n.mood-6,0,100); agRelAdd(ag,-2,`${p.name} 역제안 무시`); }
  n.rounds++; n.log.push({d:G.day,w:'구단',a:o.annual,y:o.years,...(T?{tm:T}:{})});
  const ai=Object.values(F.ai[id]||{}); const bestAI=ai.length?Math.max(...ai.map(offScore)):0;
  const want=offScore(p.ask)*agWantMul(ag)*(1+.03*ai.length)*(p.faFrom===G.user?.95:1); const mk=agMk(p); const shop=mk&&!mk.done;
  /* 요구 기준과 다른 구단 최고 제안(원소속 정·친분까지 반영한 점수)을 모두 넘어야 한다 */
  const rv=faBestOf(p,Object.entries(F.ai[id]||{}).map(([tid,x])=>({tid:+tid,annual:x.annual,years:x.years}))); const r=Math.min(offScore(o)/(want*.97),rv?faScore(p,{tid:G.user,...o})/(faScore(p,rv)*1.01):9); void bestAI; let t;
  F.offers[id]={annual:o.annual,years:o.years,...(T?{terms:T}:{})};
  if(r>=1){ n.hot=true; n.counter=null; n.mood=clamp(n.mood+8,0,100); t=shop?`좋은 조건입니다. 다만 선수가 시장 반응을 끝까지 보고 싶어 합니다(시장 확인 ${mk.round}/${mk.need}라운드). 다른 구단 제안을 받아 보고 ${mk.next?dsh(mk.next):'며칠 뒤'}에 다시 말씀드리겠습니다.`:`좋은 조건입니다. 선수에게 바로 전하겠습니다. ${ai.length?'다른 구단 제안과 비교해 곧 답을 드리겠습니다.':'큰 변수가 없으면 사인할 것 같습니다.'}`;
    if(r<1.15)agRelAdd(ag,1,`${p.name} 성의 있는 제안`); }
  else if(r>=.9){ const k=1/r*rnd(.99,1.03); n.counter={annual:Math.min(round5(o.annual*k),round5(p.ask.annual*1.15)),years:Math.max(o.years,ag.style==='hard'||ag.size==='big'?p.ask.years:o.years)}; n.mood=clamp(n.mood-2,0,100);
    if(T)n.counter.terms=termsFit(T,D,n.counter.annual,n.counter.years);
    t=`조금만 더 맞춰 주시면 됩니다. ${T?termsTxt(n.counter.terms,true):`${n.counter.years}년 연 ${money(n.counter.annual)}`}이면 선수를 설득해 보겠습니다.${ai.length?` 다른 구단에서도 ${ai.length}곳이 제안을 넣었습니다.`:''}`; }
  else if(r>=.75){ n.counter=null; n.mood=clamp(n.mood-(ag.style==='hard'?13:10),0,100); agRelAdd(ag,-1,`${p.name} 낮은 제안`); t=`솔직히 차이가 큽니다. 선수 기대치는 ${T?termsTxt(D,true)+(D.role===0?` · ${roleSet(p)[0]}`:'')+(D.ntc?' · 트레이드 거부권':''):`${p.ask.years}년 연 ${money(p.ask.annual)}`} 수준입니다.`; }
  else { n.counter=null; n.mood=clamp(n.mood-(ag.style==='hard'?30:25),0,100); agRelAdd(ag,-4,`${p.name} 무리한 제안`); t=`선수가 실망했습니다. 이 조건으로는 이야기하기 어렵습니다.${ag.size==='big'?' 저희 회사 고객 전체를 이런 식으로 대하신다면 곤란합니다.':''}`; }
  if(T&&r<1){ if(T.role!=null&&D.role!=null&&T.role>D.role)t+=` 무엇보다 선수는 ${roleSet(p)[D.role]}을(를) 원합니다.`; if(D.ntc&&!T.ntc)t+=' 트레이드 거부권 조항도 빠져 있습니다.'; }
  if(n.mood<25){ n.closed=true; delete F.offers[id]; t+=' 우리 구단과의 협상을 접겠다고 합니다.'; p.mor=clamp((p.mor??60)-10,0,100); agRelAdd(ag,-6,`${p.name} 협상 결렬`); }
  n.log.push({d:G.day,w:'에이전트',t}); return {msg:`${ag.name}(${ag.firm}): ${t}`}; }
function faAcceptCounter(id){ const n=negOf(id); if(!n.counter)return '역제안이 없습니다.'; const c=n.counter; const p=G.players[id]; G.fa.offers[id]={annual:c.annual,years:c.years,...(c.terms?{terms:c.terms}:{})}; n.log.push({d:G.day,w:'구단',a:c.annual,y:c.years,acc:true,...(c.terms?{tm:c.terms}:{})}); n.counter=null; n.deal=true; n.hot=true; agRelAdd(agentOf(p),2,`${p.name} 역제안 수용`);
  /* 에이전트가 낸 조건을 받아들였고 지금 우리가 가장 앞서면 그 자리에서 사인한다(약속을 지킨다) */
  const ai=Object.entries(G.fa.ai[id]||{}).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})); const rival=faBestOf(p,ai); const mine={tid:G.user,annual:c.annual,years:c.years,...(c.terms?{terms:c.terms}:{})};
  if(!rival||faScore(p,mine)>=faScore(p,rival)){ n.log.push({d:G.day,w:'에이전트',t:'감사합니다. 선수가 바로 사인하겠다고 합니다.'}); if(G.fa.mk&&G.fa.mk[id])G.fa.mk[id].done=true; faSign(p,[mine]); return `역제안을 받아들였습니다. ${p.name}이(가) 바로 계약서에 사인했습니다.`; }
  n.log.push({d:G.day,w:'에이전트',t:`감사합니다. 다만 ${rival.tid===p.faFrom?'원소속 구단':'다른 구단'} 조건과 비교해 최종 결정하겠습니다.`}); return `역제안을 받아들였습니다. 다만 ${p.name} 측은 다른 구단 조건과 비교해 최종 결정하겠다고 합니다.`; }
function faAgentPing(id){ const n=negOf(id); const p=G.players[id]; if(n.warned||!G.fa.offers[id]||n.closed||agShopN(p))return; /* 대어는 시장 보고 라운드로 알린다 */ const ai=Object.values(G.fa.ai[id]||{}); if(!ai.length)return; const b=ai.sort((a,c)=>offScore(c)-offScore(a))[0];
  if(offScore(b)>offScore(G.fa.offers[id])){ n.warned=true; const ag=agentOf(p); const mo=G.fa.offers[id]; const ea=round5(b.annual*rnd(.97,1.03)); const why=b.years>mo.years&&b.annual<=mo.annual?'연봉은 비슷하지만 계약 기간이 더 깁니다':'조건이 더 좋습니다'; const cmp=`다른 구단 약 ${b.years}년 총 ${money(ea*b.years)}(연 ${money(ea)}) / 우리 ${mo.years}년 총 ${money(mo.annual*mo.years)}(연 ${money(mo.annual)})`;
    n.log.push({d:G.day,w:'에이전트',t:`다른 구단 제안이 ${why}. ${cmp}.`});
    mail(`${ag.name} 에이전트`,`${p.name} 건: 경쟁 제안이 들어왔습니다`,`${ag.firm} ${ag.name}입니다. ${p.name}에게 들어온 다른 구단 제안이 ${why}.\n${cmp}\n\n조건을 올리실지 알려 주십시오.`,{imp:true,kind:'FA',ref:id,acts:[{l:'선수 보기',a:'player',v:id}]}); } }

