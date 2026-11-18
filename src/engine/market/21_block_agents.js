/* ===== 트레이드 매물과 FA 에이전트 협상 ===== */
const WANT={any:'가장 좋은 제안',prospect:'유망주',p:'투수',b:'야수',sal:'연봉 절감'};
function blockAdd(id,want){ const p=G.players[id]; if(!p||p.team!==G.user||p.foreign||hasNtc(p))return; if(p.noTrade)delete p.noTrade; /* 매물로 올리면 트레이드 불가 지정은 풀린다 */ if(!p.listed)delete p.urgent; /* 새로 올리면 일반 매물(지난 급매 설정이 남지 않게, 검수 11-09w) */ p.listed=true; p.lw=want||p.lw||'any'; }
function blockRemove(id){ const p=G.players[id]; if(!p)return; delete p.listed; delete p.lw; delete p.urgent; G.offers=(G.offers||[]).filter(o=>{ if(!(o.blk&&o.get.includes(id)))return true; offerMailDone(o.id); return false; }); }
function corePool(tid){ const t=team(tid); const ds=domestic(tid).filter(p=>!p.ys&&!(hasNtc(p)||faLock(p))); /* 거부권 선수는 트레이드 카드로 내놓지 않는다 */ const core=new Set(ds.map(p=>({p,v:tval(t,p,'out')})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.p.id)); return ds.filter(p=>!core.has(p.id)); }
function pickPackage(tid,budget,want,exclude){ const t=team(tid); exclude=exclude||[];
  let pool=corePool(tid).filter(p=>!exclude.includes(p.id)&&healthy(p)).map(p=>({p,v:tval(t,p,'out')*(p.aiListed?.85:1),u:tval(team(G.user),p,'in')})).filter(x=>x.v>0.3&&x.u>0.3);
  if(want==='prospect')pool=pool.filter(x=>x.p.age<=24&&x.p.pot-ovr(x.p)>=6); else if(want==='p')pool=pool.filter(x=>x.p.isP); else if(want==='b')pool=pool.filter(x=>!x.p.isP);
  let best=null,bs=-1; const sc=arr=>{ const v=sum(arr.map(x=>x.v)); if(v>budget)return -1; return want==='sal'?v*.4-sum(arr.map(x=>x.p.sal))/100:v; };
  for(let i=0;i<pool.length;i++){ const s=sc([pool[i]]); if(s>bs){bs=s;best=[pool[i]];} for(let j=i+1;j<pool.length;j++){ const s2=sc([pool[i],pool[j]])-.4; if(s2>bs){bs=s2;best=[pool[i],pool[j]];} } }
  if(!best||sum(best.map(x=>x.v))<budget*.45)return null; return best.map(x=>x.p.id); }
function blockDaily(){ if(!tradeOpen())return; const got=[];
  for(const p of domestic(G.user).filter(x=>x.listed)){ const n=(G.offers||[]).filter(o=>o.blk&&o.get.includes(p.id)).length; if(n>=3)continue;
    for(const t of G.teams){ if(t.id===G.user||(G.offers||[]).some(o=>o.from===t.id&&o.get.includes(p.id))||tradeCool(t.id)||R()>(p.urgent?.5:.3))continue; /* 거래 간격 중인 구단은 수락할 수 없는 제안을 보내지 않는다(검수 11-08c) */
      const v=tval(t,p,'in'), need=tradeNeed(t,v*.6); const budget=(v-need)*(p.urgent?.82:1); if(budget<1)continue;
      const give=pickPackage(t.id,budget,p.lw||'any'); if(!give)continue;
      { const bo={id:'o'+Math.floor(R()*1e9),from:t.id,give,get:[p.id],exp:period()==='season'?Math.min(G.day+7,tradeDL()):G.day+7,blk:true,day:G.day}; if(offerBlockMsg(bo))continue; /* 수락 때 막힐 제안(상대 정원·샐러리캡)은 보내지 않는다 */ try{ bo.pot=offScoutNote(bo); }catch(e){} G.offers=(G.offers||[]).concat(bo); if(autoTradeOffer(bo))break; } /* 받은 제안을 부단장에게 맡겼으면 매물 제안도 같은 기준으로(검수 11-09w) */ got.push(`${tfull(t)} → ${p.name}`); break; } }
  if(got.length)note('트레이드',`트레이드 매물에 새 제안이 왔습니다: ${got.join(', ')}. 트레이드 → 트레이드 매물에서 확인하세요.`); }
function offerMore(id){ const o=(G.offers||[]).find(x=>x.id===id); if(!o)return '제안이 없습니다.'; const t=team(o.from); if(o.more)return `${tfull(t)} 단장: 이미 한 번 올렸습니다. 이게 마지막입니다.`;
  o.more=true; const x=R(); if(x<.33+(t.rel-50)/100){ const p=G.players[o.get[0]]; const add=pickPackage(t.id,Math.max(1.5,tval(t,p,'in')*.35),'any',o.give); const ng=add&&o.give.concat(add.slice(0,1)); if(add&&!offerBlockMsg({...o,give:ng})){ o.prev={give:o.give.slice(),adv:o.adv,pot:o.pot,exp:o.exp}; /* 얹기 전 조건(되돌리기, 카페 11-11 리아네트) */ o.give=ng; delete o.adv; delete o.pot; /* 정원 등으로 막히는 조건이면 얹지 않고 원래 제안을 둔다. 받는 선수가 바뀌었으니 의견·메디컬은 다시 받는다(검수 11-08c) */ o.exp=period()==="season"?Math.min(G.day+3,tradeDL()):G.day+3; /* 거래 마감을 넘기지 않는다(검수 11-05) */ return `${tfull(t)} 단장: 좋습니다. ${G.players[add[0]].name}을(를) 더 얹겠습니다.`; } }
  if(x>.8){ offerMailDone(o.id); G.offers=G.offers.filter(y=>y.id!==id); t.rel=clamp(t.rel-2,0,100); return `${tfull(t)} 단장: 그 조건이면 없던 일로 하겠습니다. (제안 철회)`; }
  return `${tfull(t)} 단장: 이게 저희가 낼 수 있는 최선입니다.`; }
/* '더 올려 달라'로 얹은 선수가 마음에 들지 않으면 처음 제안으로 되돌린다: 상대가 먼저 낸 조건이라 그대로 유효하다 */
function offerRevert(id){ const o=(G.offers||[]).find(x=>x.id===id); if(!o||!o.prev)return '되돌릴 이전 조건이 없습니다.'; const t=team(o.from); const exp=o.prev.exp??o.exp; if(exp<G.day)return '이전 제안은 기한이 지났습니다.'; const back={...o,give:o.prev.give,exp};
  if(offerBlockMsg(back))return `이전 조건은 지금 성립하지 않습니다: ${offerBlockMsg(back)}`;
  o.exp=exp; o.give=o.prev.give; if(o.prev.adv!==undefined)o.adv=o.prev.adv; else delete o.adv; if(o.prev.pot!==undefined)o.pot=o.prev.pot; else delete o.pot; delete o.prev;
  return `${tfull(t)} 단장: 알겠습니다. 처음 제안한 조건대로 하죠.`; }
/* 다른 구단 트레이드 매물: 이유가 있는 선수를 올리고 6주까지 둔다. 압박받는 단장·연봉 초과 구단은 급매 */
const BLKWHY={deadline:'마감 정리',reb:'리빌딩 정리',room:'자리 없음',dup:'중복 자원',sal:'연봉 정리',fa:'FA 앞둔 주전',cut:'백업 정리'};
/* FA를 앞둔 주전의 처리(11-12, 사용자 "AI도 유저처럼 머리를 쓰게"): 재계약할 수 있으면 지키고, FA 보상(A·B등급 보상선수·보상금)이 쏠쏠하면 기다리고,
   가을야구가 멀고 재계약도 어려우면 시즌 중에 제값 받고 판다. 예전에는 연봉 정리 때 FA 직전 고액 주전을 급매로 내놓아 다른 구단이 싸게 데려갔다 */
function aiCY(p){ return !!p&&!p.foreign&&(preFA(p)||(p.faC&&(p.yrs||0)<=1&&!p.extNext)); }
function aiFaPlan(t,p){ if(!aiCY(p)||ovr(p)<52)return null; if(teamCtx(t).contend)return 'keep';
  const loy=((p.pers&&p.pers.loy)??10)-10; const rs=clamp(.55+((t.cash||0)>3000?.15:(t.cash||0)<0?-.25:0)+(t.owner==='profit'?-.15:0)-Math.max(0,p.age-30)*.06+loy/100,.05,.9);
  const comp=p.age<=32&&ovr(p)>=54; if(rs>=.55||(comp&&rs>=.35))return 'keep'; return 'sell'; }
/* 날짜 없이 등록하던 경로는 마감 주간 소식이었다. 옛 매물은 가장 최근 마감 주간으로 연결하고, 원인이 있는 미상 날짜는 불러온 날부터 유효 기간을 제한한다. */
function aiBlockDates(){ if(!G||!G.players)return 0; let n=0; const drop=p=>{delete p.aiListed;delete p.aiWhy;delete p.aiUrg;delete p.aiLd;}; for(const p of Object.values(G.players)){if(!p.aiListed)continue; if(!Number.isFinite(p.aiLd)){let y=G.year;if(G.day<dnum(y,7,24))y--;p.aiLd=p.aiWhy?G.day:dnum(y,7,24);if(!p.aiWhy)p.aiWhy='deadline';n++;} if(G.day-p.aiLd>42){drop(p);n++;}} return n; }
function aiBlockWeekly(){ aiBlockDates(); if(!tradeOpen())return;
  for(const p of playersOf(G.user)){ delete p.aiListed; delete p.aiWhy; delete p.aiUrg; }
  for(const t of G.teams){ if(t.id===ME())continue; const ds=domestic(t.id).filter(p=>!p.ys&&healthy(p)&&!(p.joinY>G.year)&&!(hasNtc(p)||faLock(p))&&!mvRecent(p)); /* 거부권 선수는 동의 절차가 없어 데려갈 수 없으니 매물로 내놓지 않는다 */ for(const p of domestic(t.id))if(p.aiListed&&(hasNtc(p)||faLock(p))){ delete p.aiListed; delete p.aiWhy; delete p.aiUrg; delete p.aiLd; }
    for(const p of domestic(t.id))if(p.aiListed&&mvRecent(p)&&p.aiWhy!=='mood'){ delete p.aiListed; delete p.aiWhy; delete p.aiUrg; delete p.aiLd; } for(const p of ds){ if(p.aiListed&&G.day-(p.aiLd??G.day)>42){ delete p.aiListed; delete p.aiWhy; delete p.aiUrg; delete p.aiLd; } }
    const cur=ds.filter(p=>p.aiListed); const heat=gmHeat(t.id); const ci=capInfo(t.id);
    const pl=planOf(t); if(cur.length<(pl==='build'?3:2)&&R()<.55){ const top3=new Set([...ds].sort((x,y)=>ovr(y)-ovr(x)).slice(0,3).map(q=>q.id)); const d=depth(t.id); const st=new Set([...d.start,...d.sp,...d.pen.slice(0,3)].map(q=>q.id)); let pk=null, why=null;
      /* 정리 대상은 '연봉이 높은 선수'가 아니라 '받는 돈만큼 못 하는 선수'다: 몸값(시장 연봉) 대비 초과분이 큰 순, 나이가 많을수록 먼저.
         실력 좋은 고액 선수는 성적을 원하는 팀이 오히려 비싸게 사 가는 자원이라 내놓지 않는다 */
      const mk=p=>Math.max(MIN_SAL*3,marketSal(projO(p,0))); const over=p=>p.sal/mk(p)+(p.age>=32?(p.age-31)*.15:0); /* 몸값(시장 연봉) 대비 몇 배를 받나 + 노장 가산. 금액 차보다 배율이 '거품'을 잘 가린다 */
      if(period()==='season'&&G.day>=KD(6,1)&&!teamCtx(t).contend){ pk=ds.filter(p=>!p.aiListed&&aiFaPlan(t,p)==='sell').sort((x,y)=>ovr(y)-ovr(x))[0]; if(pk)why='fa'; } /* 가을야구가 멀고 재계약이 어려운 FA 직전 주전은 제값에 판다 */
      if(!pk&&ci.pay>ci.cap*.97){ pk=ds.filter(p=>!top3.has(p.id)&&!p.aiListed&&p.sal-mk(p)>100&&!(ci.pay<=ci.cap&&aiFaPlan(t,p)==='keep')).sort((x,y)=>over(y)-over(x))[0]; why='sal'; } /* 상한을 넘지 않았으면 지킬 FA 직전 선수는 연봉 정리 대상에서 뺀다 */
      if(!pk&&t.mode==='rebuild'){ pk=ds.filter(p=>p.age>=29&&ovr(p)>=50&&!p.aiListed&&(over(p)>.85||(pl==='build'&&(p.age>=31||aiCY(p))))).sort((x,y)=>over(y)-over(x))[0]; why='reb'; } /* 유망주 수집 구단은 서른 넘었거나 계약이 끝나 가는 베테랑이면 거품이 없어도 내놓는다 */
      if(!pk&&R()<.5){ pk=ds.filter(p=>p.age<=25&&!st.has(p.id)&&p.pot-ovr(p)>=6&&!p.aiListed).sort((x,y)=>ovr(y)-ovr(x))[0]; why='room'; }
      if(!pk){ const rk=slotRanks(t.id); pk=ds.filter(p=>!st.has(p.id)&&!top3.has(p.id)&&ovr(p)>=48&&!p.aiListed&&rk[pSlot(p)]&&rk[pSlot(p)].rank<=4).sort((x,y)=>ovr(y)-ovr(x))[0]; why='dup'; }
      if(pk){ pk.aiListed=true; pk.aiWhy=why; pk.aiLd=G.day; } }
    /* 급매 늘리기(피드백 11-18: 급매 매물이 너무 드물다). 규칙: 위 정기 매물과 따로, 구단마다 주 20% 확률(해시라 본 난수를 쓰지 않는다)로
       매물이 3명(유망주 수집 구단 4명) 미만이면 자리가 없는 백업 한 명을 급매로 내놓는다. 대상은 주전(startersOf)·상위 6명(tvCore6)이 아닌 24세 이상 종합 44 이상이고,
       잠재력이 큰 25세 이하 유망주는 뺀다. 그래서 스타·유망주 급매는 생기지 않고, 급매 할인은 선수 값에 비례한다(16_trade, 11-11) */
    { const n=ds.filter(p=>p.aiListed).length; if(n<(pl==='build'?4:3)&&rngHash('aiFire',G.year,G.day,t.id)%100<20){ const S=startersOf(t.id), C6=tvCore6(t.id);
      const q=ds.filter(p=>!p.aiListed&&!S.has(p.id)&&!C6.has(p.id)&&p.age>=24&&ovr(p)>=44&&!(p.age<=25&&p.pot-ovr(p)>=6)).sort((x,y)=>ovr(y)-ovr(x)||x.id-y.id)[0]; if(q){ q.aiListed=true; q.aiWhy='cut'; q.aiLd=G.day; } } }
    for(const p of ds.filter(q=>q.aiListed)){ p.aiUrg=p.aiWhy==='cut'?true:p.aiWhy==='fa'?(G.day>=tradeDL()-7):(p.aiWhy==='sal'&&ci.pay>ci.cap||heat>=.6||(G.day-(p.aiLd??G.day)>21)); /* FA 앞둔 주전은 마감 직전 주에만 급해진다. 다른 매물은 3주가 지나도 안 팔리면 급매(11-18, 예전 5주) */ } } }
/* FA 에이전트 */
function faMood0(p){ const ag=p?agentOf(p):null; return clamp(Math.round(50+(agRel(ag)-50)*.6+agMemMood(ag,G.user)),25,85); } /* 첫 분위기: 친분 + 지난 협상 기억(계약 2단계) */
function negOf(id){ const F=G.fa; F.neg=F.neg||{}; if(!F.neg[id]){ F.neg[id]={rounds:0,mood:faMood0(G.players[id]),log:[],counter:null,closed:false,warned:false}; } return F.neg[id]; }
const offScore=o=>o.annual*(1+.06*(o.years-1));
/* 제안 반응 표(엔진 판정과 화면의 제안 전 경고가 같은 표를 쓴다): 요구 대비 비율 r → 수락(ok) · 역제안(counter) · 차이 큼(far) · 무리한 제안(bad), 그리고 분위기 변화.
   분위기가 FA_CLOSE_MOOD 밑으로 내려가면 결렬 */
const FA_CLOSE_MOOD=25, FA_GRACE_MOOD=30;
function faBand(r){ return r>=1?'ok':r>=.9?'counter':r>=.75?'far':'bad'; }
function faMoodHit(band,ag){ const h=ag&&ag.style==='hard'; return band==='ok'?8:band==='counter'?-2:band==='far'?(h?-13:-10):(h?-30:-25); }
/* 원소속 구단 유예(운영 결정 2026-11-17, 카페 제보: 세 번 낮게 불렀다가 프랜차이즈 스타를 잃음): 원소속 구단과의 협상이 결렬될 상황이면
   그 겨울 선수마다 한 번은 결렬 대신 14일 협상 중단(접음과 같은 냉각)으로 끝낸다. 같은 겨울 두 번째 결렬은 원래 규칙(45일+14일).
   구단 번호로 판정해 사용자·AI 구단 어느 쪽이든 같은 규칙이다. 지금 AI 구단의 FA 입찰(faDayRun)·인상(agShopTick)·비FA 다년(aiExtNeg)은
   분위기 결렬 없이 라운드 한도로 접기만 하므로(ctGate·ctFold) AI 원소속 구단은 처음부터 결렬로 협상이 끊기지 않는다 */
function faGraceOk(p,tid){ const F=G.fa; return !!(F&&p&&tid!=null&&p.faFrom===tid&&!(F.grace&&F.grace[p.id]!=null)); }
function faGraceUse(p,tid){ const F=G.fa; (F.grace=F.grace||{})[p.id]=tid; }
/* 제안하기 전 예상 반응(화면 경고·확인창). 사용자가 보는 정보만 쓴다: 보여 주는 요구(faWantFor는 화면 요구액의 기준)·지금 분위기·라운드·에이전트 성향·보이는 역제안.
   숨은 다른 구단 제안은 넣지 않는다(실제 판정은 다른 구단 제안이 앞서면 이보다 나쁠 수 있다). 난수·상태를 바꾸지 않는다 */
function faPreview(id,o){ const F=G.fa, p=G.players[id]; if(!F||!p||!o||!p.ask)return null; const ag=agNeg(p); const RM=agRoundsMax(p);
  const T=o.terms?{...o.terms}:null; if(T){ delete T.ov; const D=termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years}); o={annual:Math.round(termsVal(T,D)),years:T.years,terms:T}; }
  const n0=F.neg&&F.neg[id]; const reopen=!!n0&&faReopenOk(id); const n=n0||{rounds:0,mood:faMood0(p),counter:null};
  let mood=reopen?Math.max(n.mood,45):n.mood; const mood0=mood; const nAI=Object.keys((F.ai&&F.ai[id])||{}).length;
  if(n0&&n0.closed&&!reopen)return {st:'closed',mood:mood0,after:mood0,brk:false,warn:false,nAI};
  const c0=reopen?null:n.counter; const isCtr=!!(c0&&(T?c0.terms&&termsSame(T,c0.terms):o.annual>=c0.annual&&o.years===c0.years));
  if(!isCtr&&!reopen){ if(n.fold!=null&&G.day<n.fold)return {st:'cool',mood:mood0,after:mood0,brk:false,warn:false,next:n.fold,nAI};
    const ex=n.fold!=null; const rd=ex?0:(n.rounds||0), d0=ex?null:n.d0; if((d0!=null&&G.day-d0>CT_ROUND_DAYS&&rd>0)||rd>=RM)return {st:'fold',mood:mood0,after:clamp(mood-5,0,100),brk:false,warn:false,nAI}; }
  if(c0&&!isCtr&&ag.size==='big'&&offScore(o)<offScore(c0)*.97)mood=clamp(mood-6,0,100);
  const r=offScore(o)/(faWantFor(p,G.user)*.97); const st=faBand(r); const hit=faMoodHit(st,ag); const after=clamp(mood+hit,0,100); const brk=after<FA_CLOSE_MOOD;
  return {st,r,mood:mood0,hit:after-mood0,after,brk,grace:brk&&faGraceOk(p,G.user),warn:brk||st==='bad',nAI}; }
/* 예상 반응 한 줄: 수락 가능 / 역제안 예상 / 분위기 하락(−10) / 결렬 위험(분위기 −25, 지금 분위기 X → 결렬) */
function faPreviewTxt(P){ if(!P)return ''; if(P.st==='closed')return '협상 결렬 상태'; if(P.st==='cool')return '협상 중단 중'; if(P.st==='fold')return `협상 횟수 초과 · 이번 제안은 받지 않고 접습니다(분위기 −5)`;
  const d=`지금 분위기 ${P.mood} → ${P.brk?'결렬':P.after}`; const h=P.hit>0?`+${P.hit}`:P.hit<0?`−${-P.hit}`:'±0';
  if(P.brk)return `결렬 위험(분위기 ${h}, ${d})`; return P.st==='ok'?'수락 가능':P.st==='counter'?`역제안 예상(분위기 ${h})`:P.st==='far'?`분위기 하락(${h}, ${d})`:`결렬 위험(분위기 ${h}, ${d})`; }
/* 오래 팀을 찾지 못한 FA(시장 개장 45일 뒤, 마지막 협상 14일 뒤)는 에이전트가 협상을 다시 연다. 화면도 이 판정으로 제안 버튼을 살린다(테스터 11-07: 화면이 막혀 다시 열 수 없던 버그) */
function faReopenOk(id){ const F=G.fa, n=F&&F.neg&&F.neg[id], p=G.players[id]; if(!n||!p||F.closed||p.team!=null)return false; return (n.closed||n.rounds>=agRoundsMax(p))&&G.day-F.openDay>=45&&G.day-(n.lastD??-999)>=14; }
function faReopenDay(id){ const F=G.fa, n=F&&F.neg&&F.neg[id]; if(!n)return null; return Math.max(G.day+1,F.openDay+45,(n.lastD??G.day)+14); }
/* FA 계약의 상한 결재(13_roster capOwnerCheck): 계약금은 연평균으로 상한에 들어간다 */
function faCapCheck(p,o){ if(!p||!o)return null; const T=o.terms; const a=T?T.annual+Math.round((T.bonus||0)/Math.max(1,T.years||o.years||1)):o.annual; const s=sponSeason(); const cc=capOwnerCheck(capPayWith(G.user,p.id,a,s).tot,capPayWith(G.user,null,null,s).tot,s,'fa'+p.id); if(cc&&!cc.ok&&!cc.hard&&faGrantOpen(p.id)>0)return {...cc,ok:true,p:1,grant:true,msg:''}; /* 구단주가 영입 자금까지 낸 선수는 상한 초과 결재도 승인한다(절대 한도는 그대로, 피드백 11-18) */ return cc; }
/* FA 요구 기준(환산 점수): 구단마다 그 구단과의 에이전트 친분으로 달라진다(사용자·AI 같은 식) */
function faWantFor(p,tid){ const ag=agNeg(p); const ai=Object.entries((G.fa&&G.fa.ai&&G.fa.ai[p.id])||{}).filter(([k,o])=>o&&faAiOk(+k,p,o)).length; return offScore(p.ask)*agWantMul(ag,tid)*(1+.03*ai)*(p.faFrom===tid?.95:1); }
/* FA 마감일(1월 24일) */
function faDL(){ return G.day<=KD(1,24)?KD(1,24):dnum(G.year+1,1,24); }
/* 잠금 해제 권유: 모두 잠가 역제안을 낼 수 없을 때 어떤 잠금을 풀면 되는지 */
function ctUnlockTip(ag,lk){ const pref=agPref(ag); const f=pref==='bonus'?'bonus':'annual'; const L={annual:'연봉',bonus:'계약금',years:'계약 기간',cOpt:'구단 연장 옵션',ntc:'트레이드 거부권',role:'역할 약속'}; return `${L[lk.includes(f)?f:lk.find(k=>k==='annual'||k==='bonus')||f]} 잠금을 풀어 주시면 그 항목으로 맞춰 드리겠습니다.`; }
function faNegotiate(id,o){ const F=G.fa; const p=G.players[id]; if(!F||F.closed||!p||p.team!=null||G.unemp)return {msg:'이미 계약했거나 협상할 수 없는 선수입니다.'}; const ag=agNeg(p), me=!!ag.self, W=me?'선수':'에이전트'; const n=negOf(id); /* 에이전트가 없으면 선수 본인이 답한다(수수료·시장 확인 없음) */
  const lk=Array.isArray(o.lock)?o.lock.filter(k=>typeof k==='string').slice(0,8):[];
  const T=o.terms?{...o.terms}:null; if(T)delete T.ov; const D=T?termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years}):null; if(T)o={annual:Math.round(termsVal(T,D)),years:T.years,terms:T};
  if(faOutBlocked(G.user,p))return {msg:`이번 겨울 다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다(${ASSOC.s} 규약 제173조). 이미 ${faOutN(G.user)}명을 데려왔습니다.`};
  { const cc=faCapCheck(p,o); if(cc&&!cc.ok)return {msg:cc.msg,owner:true}; } /* 구단주 결재가 안 나면 에이전트에게 내밀지 못한다(협상 횟수·분위기 그대로) */
  { const cc=faFundsCheck(p,o); if(cc)return {msg:cc.msg,owner:true,funds:true}; }
  const RM=agRoundsMax(p); /* 오래 팀을 찾지 못한 FA(시장 개장 45일 뒤, 마지막 협상 14일 뒤): 에이전트가 협상을 다시 연다(요구액도 그동안 내려갔다) */
  let reopened=false; if(faReopenOk(id)){ n.closed=false; ctReset(n); delete n.fold; n.counter=null; n.mood=Math.max(n.mood,45); reopened=true; }
  if(n.closed)return {st:'closed',msg:`${me?`${p.name} 본인`:`${ag.name} 에이전트`}가 더 이상 우리와 협상하지 않습니다. ${dmd(faReopenDay(id))}부터 다시 제안할 수 있습니다(결렬 규칙: 시장 개장 45일 뒤 · 마지막 협상 14일 뒤).`};
  /* 에이전트가 낸 역제안을 그대로 내면 라운드를 쓰지 않고 받는다(트레이드 isCtr와 같음) */
  const c0=n.counter; const isCtr=!!(c0&&(T?c0.terms&&termsSame(T,c0.terms):o.annual>=c0.annual&&o.years===c0.years));
  if(isCtr)return {msg:faAcceptCounter(id,o),st:p.team===G.user?'signed':'wait'};
  const old=F.offers[id]; if(!reopened&&old&&!old.rej&&!n.counter&&n.fold==null&&old.annual===o.annual&&old.years===o.years&&(T?old.terms&&termsSame(T,old.terms):!old.terms)&&JSON.stringify(old.lock||[])===JSON.stringify(lk)&&n.lastD!=null)return {st:'wait',msg:`${agTag(ag)}: 같은 조건은 이미 확인했습니다. 조건이 바뀌면 다시 제안해 주십시오.`,shop:null};
  if(!isCtr){ const g=ctGate(n,RM);
    if(g==='cool')return {st:'cool',msg:`${agTag(ag)}: 지금은 더 이야기하지 않겠습니다. ${dmd(n.fold)}부터 다시 제안해 주십시오.`};
    if(g){ ctFold(n); n.counter=null; n.mood=clamp(n.mood-5,0,100); agRelAdd(ag,-1,`${p.name} 협상 지연`); agMemSet(ag,G.user,'fold',p.id); const lo=F.offers[id]; const t=`${ctFoldTxt(g)} ${dmd(n.fold)}부터 다시 제안해 주십시오.${lo&&!lo.rej?' 걸어 두신 제안은 그대로 두겠습니다.':''}`; n.log.push({d:G.day,w:W,t,k:'fold'}); return {msg:`${agTag(ag)}: ${t}`,st:'fold'}; } }
  n.lastD=G.day;
  /* 대형 에이전트의 역제안을 무시하고 더 낮게 부르면 기분이 상한다 */
  if(c0&&!isCtr&&ag.size==='big'&&offScore(o)<offScore(c0)*.97){ n.mood=clamp(n.mood-6,0,100); agRelAdd(ag,-2,`${p.name} 역제안 무시`); }
  if(!isCtr)ctStep(n); n.log.push({d:G.day,w:'구단',a:o.annual,y:o.years,...(T?{tm:T}:{}),...(lk.length?{lk}:{}),...(isCtr?{acc:true}:{})});
  faPruneAi(id); const ai=Object.values(F.ai[id]||{});
  const want=faWantFor(p,G.user); const mk=agMk(p); const shop=mk&&!mk.done;
  /* 요구 기준과 다른 구단 최고 제안(원소속 정·친분까지 반영한 점수)을 모두 넘어야 한다 */
  const rv=faBestOf(p,Object.entries(F.ai[id]||{}).map(([tid,x])=>({tid:+tid,annual:x.annual,years:x.years}))); const rw=offScore(o)/(want*.97); const r=Math.min(rw,rv?faScore(p,{tid:G.user,...o})/(faScore(p,rv)*1.01):9); let t;
  const prevO=F.offers[id]; F.offers[id]={annual:o.annual,years:o.years,...(T?{terms:T}:{}),...(lk.length?{lock:lk}:{})}; if(r<.9)F.offers[id].rej=true; /* 선수가 거절한 조건(역제안도 없음)은 그대로 계약되지 않는다 */
  const seed=id*31+(n.log.length||0); const ctx=agCtxTxt(p,ai.length,faDL()); let res='no';
  const band=faBand(r), hit=faMoodHit(band,ag); /* 분위기 변화는 제안 전 경고(faPreview)와 같은 표 */
  if(r>=1){ n.hot=true; n.counter=null; n.mood=clamp(n.mood+hit,0,100); res='wait'; ctReset(n); /* 요구를 채우면 이번 협상 라운드는 끝 */
    t=`${agSay(ag,'ok',seed)} ${shop?`다만 선수가 시장 반응을 끝까지 보고 싶어 합니다(시장 확인 ${mk.round}/${mk.need}라운드). ${mk.next?dsh(mk.next):'며칠 뒤'}에 다시 말씀드리겠습니다.`:ai.length?'다른 구단 제안과 비교해 곧 답을 드리겠습니다.':'큰 변수가 없으면 사인할 것 같습니다.'}`;
    agOfferRel(ag,r,G.user,p.name,p.id); }
  else if(r>=.9){ n.mood=clamp(n.mood+hit,0,100); /* 분위기를 먼저 반영하고, 그 분위기에서 받아들일 수 있는 최소 조건으로 역제안한다 */
    const pref=agPref(ag); const y=lk.includes('years')?o.years:Math.max(o.years,ag.style==='hard'||ag.size==='big'||pref==='years'?p.ask.years:o.years);
    let need=want*.97/(1+.06*(y-1)); if(rv){ const unit=faScore(p,{tid:G.user,annual:1000,years:y})/1000; if(unit>0)need=Math.max(need,faScore(p,rv)*1.01/unit); }
    need*=1.004*rnd(1,1.03);
    if(T){ const ft=termsFit(T,D,need,y,lk,pref); n.counter=ft?{annual:Math.ceil(termsVal(ft,D)),years:ft.years,terms:ft}:null; }
    else n.counter={annual:Math.ceil(need/5)*5,years:y};
    if(n.counter){ res='counter'; t=`${agSay(ag,'ctr',seed)} ${T?termsTxt(n.counter.terms,true):`${n.counter.years}년 연 ${money(n.counter.annual)}`}${me?'이면 사인하겠습니다.':'이면 선수를 설득하겠습니다.'}`; }
    else { F.offers[id].rej=true; t=`조금 모자랍니다. 다만 잠그신 조건만으로는 차이를 메울 수 없습니다. ${ctUnlockTip(ag,lk)}`; } }
  else if(r>=.75){ n.counter=null; n.mood=clamp(n.mood+hit,0,100); agOfferRel(ag,r,G.user,p.name,p.id); t=`${agSay(ag,'far',seed)} ${me?'제':'선수'} 기대치는 ${T?termsTxt(D,true)+(D.role===0?` · ${roleSet(p)[0]}`:'')+(D.ntc?' · 트레이드 거부권':''):`${p.ask.years}년 연 ${money(p.ask.annual)}`} 수준입니다.`; }
  else { n.counter=null; n.mood=clamp(n.mood+hit,0,100); agOfferRel(ag,r,G.user,p.name,p.id); t=`${agSay(ag,'bad',seed)}${ag.size==='big'?' 저희 회사 고객 전체를 이런 식으로 대하신다면 곤란합니다.':''}`; }
  if(T&&r<1){ if(T.role!=null&&D.role!=null&&T.role>D.role)t+=` 무엇보다 ${me?'저는':'선수는'} ${roleSet(p)[D.role]}을(를) 원합니다.`; if(D.ntc&&!T.ntc)t+=' 트레이드 거부권 조항도 빠져 있습니다.'; }
  if(ctx&&r<1)t+=' '+ctx;
  if(res==='counter')t+=` 원래 제안도 그대로 남아 있어, 다른 구단보다 나으면 그 조건으로 계약될 수도 있습니다.`; /* 역제안에 답하지 않아도 원제안이 유효하다(검수 11-08) */
  if(n.mood<FA_CLOSE_MOOD&&faGraceOk(p,G.user)){ /* 원소속 구단 유예: 그 겨울 한 번은 결렬 대신 14일 냉각(접음과 같음). 요구의 75% 이상인 제안은 남기고, 아니면 그 전에 걸어 둔 75% 이상 제안으로 되돌리거나 지운다 */
    faGraceUse(p,G.user); ctFold(n); n.counter=null; n.mood=FA_GRACE_MOOD; n.grace=n.fold;
    if(rw<.75){ if(prevO&&!prevO.rej&&offScore(prevO)/(want*.97)>=.75)F.offers[id]=prevO; else delete F.offers[id]; }
    const kept=!!(F.offers[id]&&!F.offers[id].rej); t+=` 원래라면 여기서 협상을 접어야 합니다. 다만 원소속 구단이라 한 번 더 기회를 주겠다고 합니다. ${dmd(n.fold)}부터 다시 제안해 주십시오.${kept?' 걸어 두신 제안은 그대로 두겠습니다.':' 이번 조건은 받지 않겠습니다.'} 이번 겨울 또 이러시면 그때는 협상을 접겠습니다.`;
    p.mor=clamp((p.mor??60)-5,0,100); agRelAdd(ag,-3,`${p.name} 협상 결렬 직전(원소속 유예)`); agMemSet(ag,G.user,'fold',p.id); res='grace'; }
  else if(n.mood<FA_CLOSE_MOOD){ n.closed=true; delete F.offers[id]; t+=' 우리 구단과의 협상을 접겠다고 합니다.'; p.mor=clamp((p.mor??60)-10,0,100); agRelAdd(ag,-6,`${p.name} 협상 결렬`); agMemSet(ag,G.user,'close',p.id); if(!me)p.agBad=G.year; res='closed'; } /* 결렬은 나쁜 협상: 다음 겨울 에이전트를 바꾸기도 한다 */
  else if(res!=='wait'){ if(res==='no'&&(n.rounds||0)>=RM&&!isCtr){ ctFold(n); agMemSet(ag,G.user,'fold',p.id); n.mood=clamp(n.mood-5,0,100); t+=` 정해 둔 협상 횟수(${RM}회)를 다 썼습니다. ${dmd(n.fold)}부터 다시 제안해 주십시오.`; res='fold'; } else t+=ctLastTxt(n,RM); }
  n.log.push({d:G.day,w:W,t}); if(n.log.length>24)n.log.splice(0,n.log.length-24); return {msg:`${agTag(ag)}: ${t}`,st:res==='wait'?'wait':res==='counter'?'counter':res==='closed'?'closed':res==='fold'?'fold':res==='grace'?'grace':'no',shop:r>=1&&shop?(mk.next||null):null}; }
function faAcceptCounter(id,offer){ { const p0=G.players[id]; if(!p0||p0.team!=null||!G.fa||G.fa.closed||G.unemp)return '이미 계약했거나 협상할 수 없는 선수입니다.'; if(faOutBlocked(G.user,p0))return `이번 겨울 다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있어 ${p0.name}의 역제안을 받아들일 수 없습니다(${ASSOC.s} 규약 제173조). 역제안은 그대로 둡니다.`; if(faRosterFull(G.user))return `정식 선수와 입단 예정 선수가 ${ROSTER_MAX}명으로 꽉 차 ${p0.name}의 역제안을 받아들일 수 없습니다. 먼저 한 명을 정리하세요. 역제안은 그대로 둡니다.`; } /* 한도 검사를 상태를 바꾸기 전에 */ const n=negOf(id); if(!n.counter)return '역제안이 없습니다.'; const c=offer||n.counter; const p=G.players[id]; { const cc=faCapCheck(p,c); if(cc&&!cc.ok)return cc.msg+' 역제안은 그대로 둡니다.'; const fc=faFundsCheck(p,c); if(fc)return fc.msg+' 역제안은 그대로 둡니다.'; } G.fa.offers[id]={annual:c.annual,years:c.years,...(c.terms?{terms:c.terms}:{})}; n.log.push({d:G.day,w:'구단',a:c.annual,y:c.years,acc:true,...(c.terms?{tm:c.terms}:{})}); n.counter=null; n.deal=true; n.hot=true; ctReset(n); agRelAdd(agentOf(p),2,`${p.name} 역제안 수용`);
  /* 에이전트가 낸 조건을 받아들였고 지금 우리가 가장 앞서면 그 자리에서 사인한다(약속을 지킨다) */
  faPruneAi(id); const ai=Object.entries(G.fa.ai[id]||{}).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})); const rival=faBestOf(p,ai); const mine={tid:G.user,annual:c.annual,years:c.years,...(c.terms?{terms:c.terms}:{})};
  { const mk=agMk(p); if(mk&&!mk.done){ n.log.push({d:G.day,w:agNeg(p).self?'선수':'에이전트',t:'조건은 받았습니다. 선수가 시장 반응을 끝까지 본 뒤 결정합니다.'}); return `역제안 조건을 우리 제안으로 걸어 두었습니다. ${p.name} 측은 시장 확인을 마친 뒤 ${mk.next?dsh(mk.next):'다음 시장일'}에 다른 구단 제안과 함께 비교해 결정합니다.`; } } /* 시장 보는 대어는 그 자리에서 사인하지 않는다(공략 방지: 시장이 서기 전에 낚아채던 것) */
  if(!rival||faScore(p,mine)>=faScore(p,rival)){ n.log.push({d:G.day,w:agNeg(p).self?'선수':'에이전트',t:'감사합니다. 선수가 바로 사인하겠다고 합니다.'}); faSign(p,[mine]); if(p.team===G.user)return `역제안을 받아들였습니다. ${p.name}이(가) 바로 계약서에 사인했습니다.`; n.log.push({d:G.day,w:agNeg(p).self?'선수':'에이전트',t:'계약이 성사되지 않았습니다.'}); return `역제안을 받아들였지만 계약이 성사되지 않았습니다. ${p.name}은(는) 아직 FA 시장에 있습니다.`; } /* 실제 계약을 확인한 뒤에만 '사인 완료' */
  n.log.push({d:G.day,w:agNeg(p).self?'선수':'에이전트',t:`감사합니다. 다만 ${rival.tid===p.faFrom?'원소속 구단':'다른 구단'} 조건과 비교해 최종 결정하겠습니다.`}); return `역제안을 받아들였습니다. 다만 ${p.name} 측은 다른 구단 조건과 비교해 최종 결정하겠다고 합니다.`; }
function faAgentPing(id){ const n=negOf(id); const p=G.players[id]; if(n.warned||!G.fa.offers[id]||n.closed||agShopN(p))return; /* 대어는 시장 보고 라운드로 알린다 */ faPruneAi(id); const ai=Object.values(G.fa.ai[id]||{}); if(!ai.length)return; const b=ai.sort((a,c)=>offScore(c)-offScore(a))[0];
  if(offScore(b)>offScore(G.fa.offers[id])){ n.warned=true; const ag=agNeg(p); const mo=G.fa.offers[id]; const ea=round5(b.annual*rnd(.97,1.03)); const why=b.years>mo.years&&b.annual<=mo.annual?'연봉은 비슷하지만 계약 기간이 더 깁니다':'조건이 더 좋습니다'; const cmp=`다른 구단 약 ${b.years}년 총 ${money(ea*b.years)}(연 ${money(ea)}) / 우리 ${mo.terms?termsTxt(mo.terms,true):`${mo.years}년 총 ${money(mo.annual*mo.years)}(연 ${money(mo.annual)})`}`; /* 세부 조건은 환산값이 아니라 실제 연봉·계약금·옵션으로(검수 11-08) */
    n.log.push({d:G.day,w:ag.self?'선수':'에이전트',t:`다른 구단 제안이 ${why}. ${cmp}.`});
    mail(ag.self?p.name:`${ag.name} 에이전트`,`${p.name} 건: 경쟁 제안이 들어왔습니다`,`${ag.self?`${p.name}입니다. 저에게`:`${ag.firm} ${ag.name}입니다. ${p.name}에게`} 들어온 다른 구단 제안이 ${why}.\n${cmp}\n\n조건을 올리실지 알려 주십시오.`,{imp:true,kind:'FA',ref:id,acts:[{l:'선수 보기',a:'player',v:id}]}); } }

