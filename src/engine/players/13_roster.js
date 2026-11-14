/* ===== 로스터 정리 ===== */
function fillRoster(tid,min){
  let n=rosterN(tid); const added=[]; /* 육성선수는 빼고 정식 선수 수로 센다 */
  while(n<min){ const isP=playersOf(tid).filter(p=>p.isP).length<n*.52; const b=clamp(N(34,3),26,42);
    const p=newPlayer({age:ri(20,24),isP,base:b,pot:b+ri(0,12),team:tid,dev:true}); added.push(p); n++; }
  return added;
}
/* AI 구단 육성선수 한도: 사용자는 규정 한도(YS_MAX)까지 쓸 수 있지만 AI는 해마다 쌓이지 않게 8명 안팎만 둔다 */
const AI_YS_MAX=8;
function trimRoster(tid,max){
  let ps=playersOf(tid).filter(p=>!p.foreign&&!p.ys); const out=[]; max=(max||ROSTER_MAX)-(rosterN(tid)-ps.length); /* 정원은 rosterN과 같은 기준(국가대표 차출 포함, 부상 대체를 둔 재활 외국인 제외, 검수 11-09zx) */ const ysCap=tid===G.user?YS_MAX:AI_YS_MAX;
  const keep=p=>keepScore(p)+(team(tid).mode==='contend'?(p.age>=26?1:0):(p.age<=24?1:0));
  while(ps.length>max){ ps.sort((a,b)=>keep(a)-keep(b)); const p=ps.shift(); out.push(p); if(p.age<=24&&ysOk(p)&&p.pot-ovr(p)>=8&&ysN(tid)<ysCap){ ysSet(p); } /* 사용자와 같은 전환 조건(다음 시즌 계약 선수 제외, 검수 11-07) */ else { const c=relCost(p).tot; if(c>0){ if(tid===G.user)G.spend.rel=(G.spend.rel||0)+c; else team(tid).cash-=c; } /* 일반 방출과 같은 잔여 연봉 정산(검수 11-05: AI가 계약 부담을 공짜로 없앴다) */ if(p.age<=35&&ovr(p)>=30)toFree(p,`${tname(tid)}에서 방출`,c); else retireOut(p,`${tname(tid)}에서 방출된 뒤 은퇴`); } }
  return out;
}
/* AI 구단 겨울 정리: 육성선수는 25세가 넘거나 한도를 넘으면 내보낸다(실제 구단도 해마다 10명 안팎을 정리한다).
   정식 선수는 newYear에서 61명까지 줄이고, 시즌 중 군 제대·부상 대체로 늘어나는 몫을 남겨 둔다 */
function aiYsPrune(tid){ if(tid===ME())return 0; const ys=playersOf(tid).filter(p=>p.ys&&!p.foreign).sort((a,b)=>keepScore(b)-keepScore(a)); let n=0;
  ys.forEach((p,i)=>{ if(p.age>=26||i>=AI_YS_MAX||p.pot<=ovr(p)+2){ if(p.age<=33&&ovr(p)>=30)toFree(p,`${tname(tid)}에서 방출(육성선수 정리)`); else retireOut(p,`${tname(tid)}에서 방출된 뒤 은퇴`); n++; } }); return n; }
/* 스카우트 특기: 투수 감별·타자 감별은 그 유형 선수를 볼 때 능력이 한 단계 높다. 경력은 성격 묘사용 */
const SC_SPEC={P:'투수 감별',B:'타자 감별'};
const SC_CAR=['전 프로 투수','전 프로 포수','전 프로 내야수','전 프로 외야수','고교 감독 출신','대학 코치 출신','전력분석원 출신','야구 기자 출신','해외 리그 코치 출신','독립리그 감독 출신'];
function mkScout(skill){ const region=pick(REG); const x=R(); const spec=x<.4?'P':x<.75?'B':null; return staffAttach({id:'s'+Math.floor(R()*1e9),name:genName(),skill,region,role:'am',since:-999,sal:SCOUT_SAL[skill],spec,car:pick(SC_CAR),age:ri(31,63)},'scout'); }
function scSd(sc,p){ if(!sc)return SCOUT_SD[0]*netSdM(p); const b=sc.spec&&p&&((sc.spec==='P')===!!p.isP)?1:0; return SCOUT_SD[clamp(sc.skill+b,0,5)]*staffScoutFactor(sc,p)*netSdM(p); } /* 아마추어 후보는 권역 정보망만큼 오차가 줄거나 는다(12_scout_area) */
/* 스카우트 업무: 아마추어(지역) · 프로(지역 연고 구단) · 해외(나라) 중 하나를 맡는다. 바꾸면 30일 적응 기간 동안 능력이 1 낮다. */
const SCOUT_MAX=8;
/* 스카우트 한도: 피칭·타격 랩(데이터 시설) 4단계부터 1명, 6단계에 1명 더(커뮤니티 요청 11-07) */
function scoutMax(){ const l=typeof facOf==='function'?facOf('lab'):0; return SCOUT_MAX+(l>=4?1:0)+(l>=6?1:0); }
const SROLE={am:'아마추어',pro:'프로',intl:'해외'};
function effSkill(s){ return Math.max(1,s.skill-(G.day-(s.since??-999)<30?1:0)); }
function scoutOf(role,key){ const s=G.scouts.filter(x=>(x.role||'am')===role&&x.region===key).sort((a,b)=>effSkill(b)-effSkill(a))[0]; return s?Object.assign({},s,{skill:effSkill(s)}):null; }
function assignScout(id,role,key){ const s=G.scouts.find(x=>x.id===id); if(!s)return; if(!SROLE[role]||(role==='intl'&&!IREG[key]))return '지원하지 않는 배치입니다.'; /* 값 검사를 먼저 해 기존 담당을 잃지 않게(검수 11-07) */ if((s.role||'am')===role&&s.region===key)return; staffAttach(s,'scout');s.role=role; s.region=key; s.since=G.day; addLog(`${s.name} 스카우트를 ${SROLE[role]} ${role==='intl'?IREG[key].l:key} 담당으로 바꿨습니다.`); }
function scoutLoad(){ const c={}; for(const s of G.scouts)c[(s.role||'am')+':'+s.region]=(c[(s.role||'am')+':'+s.region]||0)+1; return c; }
/* 스카우트 후보 12명. 매달 일부가 다른 구단으로 가고 새 후보가 들어온다 */
const SC_MKT=12; function scSkillRoll(){ return clamp(Math.round(N(2.45,1.0)),1,5); }
function scoutMkt(){ const mk=G.year*100+dobj(G.day).m; if(!G.scoutMarket)G.scoutMarket=[]; if(G.scoutMarketM!==mk){ G.scoutMarket=G.scoutMarket.filter(s=>s.ob||(s.bid&&s.bid.exp>=G.day)||R()<.6); /* 재제안 기한이 남은 후보는 월초 교체에서 빼지 않는다 */ while(G.scoutMarket.length<SC_MKT)G.scoutMarket.push(mkScout(scSkillRoll())); G.scoutMarketM=mk; } return G.scoutMarket; }
function refreshScoutMarket(){ const keep=(G.scoutMarket||[]).filter(s=>s.bid&&s.bid.exp>=G.day); /* 재제안 기한이 남은 후보는 새해 교체에도 남긴다(검수 11-07) */ G.scoutMarket=keep.concat(Array.from({length:Math.max(0,SC_MKT-keep.length)},()=>mkScout(scSkillRoll()))); G.scoutMarketM=G.year*100+dobj(G.day).m; try{ if(G.ob)G.scoutMarket=obCands('scout').slice(0,2).map(obScout).concat(G.scoutMarket); }catch(e){} }
function offerMailDone(oid){ for(const m of G.mail) if(m.oid===oid)m.read=true; }
/* 거래로 소속이 바뀐 선수가 걸린 받은 제안은 성사될 수 없으니 메일과 함께 닫는다 */
function offerDropMoved(ids){ G.offers=(G.offers||[]).filter(x=>{ if(![...x.give,...x.get].some(id=>ids.includes(id)))return true; offerMailDone(x.id); return false; }); }
function wire(kind,t,o){ o=o||{}; const w={d:G.day,k:kind,t,tid:o.tid??null,ref:o.ref??null}; if(o.x)w.x=o.x; (G.wire=G.wire||[]).unshift(w); if(G.wire.length>150)G.wire.length=150; }
function addLog(t){ G.log.unshift({y:G.year,d:G.day,t}); G.log=G.log.slice(0,80); }
/* AI 구단은 운영 전략(86_ai_plan의 t.plan)에서 mode·stance가 나온다: 새해마다 순위로 다시 뽑지 않는다(계획의 관성). 계획이 아직 없는 구단(새 게임·예전 저장)만 여기서 처음 정한다.
   우리 구단(사용자)은 예전처럼 전력 순위로만 표시한다 */
function updateModes(){ const rs=G.teams.map(t=>({id:t.id,r:teamRating(t.id)})).sort((a,b)=>b.r-a.r); const me=G.user!=null?ME():-99;
  rs.forEach((x,i)=>{ const t=team(x.id); if(t.id!==me&&t.plan&&AIPLAN[t.plan.k]){ t.mode=AIPLAN[t.plan.k].mode; t.stance=AIPLAN[t.plan.k].st; return; }
    if(t.id===me||G.user==null&&!t.owner){ t.mode=i<6?'contend':i<8&&R()<.5?'contend':'rebuild'; t.stance=t.mode==='rebuild'?'rebuild':i<4||(i<6&&t.owner==='win')?'win':'next'; return; }
    const rk=(i+1)*10/G.teams.length; aiPlanSet(t,aiPlanChoose({rk,rkL:rk,age:28,cash:t.cash||0,owner:t.owner,tr:gmTrait(t.id),mid:false},null,0,true),'',true); }); }
/* AI 운영 방향: win 우승 도전(연봉을 상한 근처까지 실제 전력으로), next 내년 도전(25~30세 주전급·유망주), rebuild 리빌딩(유망주, 비싼 베테랑 정리). mode(contend/rebuild)를 잘게 나눈 것 */
function stanceOf(t){ return t.mode==='rebuild'?'rebuild':t.stance||'win'; }
function supportCap(t){ return t.indie?0:Math.max(0,Math.round(16000*ecoIdx(sponSeason())*ownershipSupportPct(t,sponSeason())/100*(.5+t.trust/100)*(1+((austOn(t)||{}).d||0)))-(t.supCut&&t.supCut.y===sponSeason()?t.supCut.amt:0)-(t.ownCut&&t.ownCut.y===sponSeason()?t.ownCut.amt:0))+(t.grant&&t.grant.y===sponSeason()?t.grant.amt:0); } /* 지원금은 그 시즌 몫(결산 뒤 겨울에 받으면 다음 시즌) */ /* 쌓인 현금이 많으면 그만큼 지원 한도가 줄어든다(supCut) */
/* 상한 초과 제재(2025년 개정 규정): 1회 초과분 30%, 2회 연속 50%, 3회 연속 100% + 다음 해 1라운드 지명권 9단계 하락 */
/* 경쟁균형세(KBO 2025-09 개정, 2026~): 초과분 1회 30%·2회 연속 50%·3회 연속 100% + 3회 연속이면 다음 해 1라운드 지명 9단계 하락.
   AI 구단의 상한 감각: 지난해 넘은 구단은 2회 연속을 피하려고 더 아낀다(실제로 초과 다음 해 FA 영입을 포기한 사례가 있다). 가끔 한 구단은 세금을 감수하고 우승에 올인한다 */
function aiCapMul(t){ if(!t||t.id===ME())return 1; if(t.allIn===sponSeason())return t.capOver>=2?1.02:1.12; return t.capOver>=1?.97:1; }
/* FA 시장이 열릴 때 올인 구단을 고른다: 구단주가 우승형·현금 여유·전력 상위·최근 3년 올인 없음·연속 초과 2회 미만. 한 해 한 구단(독주 구단이 있으면 두 구단까지) */
function allInPick(){ const sy=sponSeason(); const ord=(G.last&&G.last.order)||[]; const rk=id=>{ const i=ord.findIndex(o=>(o.tid??o)===id); return i<0?6:i+1; };
  /* 독주 견제(86b_dynasty): 한 구단이 달아나면 상위권 경쟁 구단이, 자리가 위태로운 단장은 빚을 져서라도 올인한다(한 해 두 구단까지). 독주 구단 자신은 올인하지 않는다 */
  let L=null; try{ L=domLead(); }catch(e){} const max=L?2:1; if(G.teams.filter(t=>t.allIn===sy).length>=max)return;
  const ok0=t=>t.id!==ME()&&!t.indie&&planOf(t)==='win'&&t.allIn!==sy&&(t.capOver||0)<2&&!(t.allInY&&sy-t.allInY<3)&&!(L&&L.tid===t.id);
  const ds=t=>{ try{ return despOf(t); }catch(e){ return 0; } };
  const C=G.teams.filter(t=>ok0(t)&&(((t.owner==='win'||(t.owner==='pr'&&gmTrait(t.id)==='gambler'))&&(t.cash||0)>5000&&rk(t.id)<=4)||((ds(t)>=.5||(L&&rk(t.id)<=5))&&(t.cash||0)>-1000)));
  if(!C.length||R()>=.22+(L?.25:0)+.2*Math.max(0,...C.map(ds)))return;
  const t=C[Math.floor(R()*C.length)]; t.allIn=sy; t.allInY=sy; const dp=ds(t)>=.5; if(L||dp)try{ domLog('allin'); }catch(e){}
  news('구단',`${tshort(t.id)}, ${L&&!dp?`${tshort(L.tid)} 독주 막겠다… `:dp?'벼랑 끝 승부수… ':''}경쟁균형세 감수하고 우승 올인`,`${t.city} ${t.nick} 구단주가 "세금을 내더라도 올해는 우승"이라며 FA 시장에 큰돈을 풀 준비를 마쳤다는 소식입니다.${dp?' 성적이 나지 않으면 단장 자리도 장담할 수 없다는 이야기가 함께 나옵니다.':''} 상한을 넘기면 초과분의 30% 이상을 내야 하고, 3년 연속이면 신인 1라운드 지명이 9단계 밀립니다.`,0,{tid:t.id}); }
function capRate(n){ return n>=3?1:n===2?.5:.3; }
/* 초과액으로 낼 제재금 예상: 지금까지 연속 초과 횟수에 이번을 더한 단계(재계약 화면에서 넘길지 고르게, 유저 피드백 11-07) */
function capTaxEst(over,tid=G.user){ const n=((team(tid)||{}).capOver||0)+1; return {n,tax:Math.round(Math.max(0,over)*capRate(n)),pen:n>=3}; }
/* 상한 초과 구단주 결재(사용자 11-13 "셀캡 깨는 유저들도 있더라"). 실제 KBO 상한은 세금만 내면 넘길 수 있지만, 넘기려면 모기업·구단주 결재가 필요하고 구단주는 상한을 크게 넘기는 걸 거의 허락하지 않는다.
   우리 구단의 움직임(FA 영입·잔류, 비FA 다년계약, 연봉 협상에서 산정안보다 더 주기, 트레이드, 웨이버 양수, 무적 선수 영입)이 다음에 잴 상위 40명 연봉을 상한 위로 올리면 결재를 받는다.
   절대 한도: 상한 +10%(성적 우선 구단주이고 신뢰 70 이상이면 +15%). 그 안에서는 구단주 성향(성적 우선 너그럽고 수익 우선 깐깐)·신뢰·연속 초과 횟수·초과 폭으로 승인 가능성이 정해진다.
   같은 해 같은 건의 결재 결과는 고정(다시 올려도 결과가 바뀌지 않는다. 금액을 줄이면 가능성이 올라간다). 독립구단은 결재 없이 투자사 현금으로 세금을 낸다(capOverOwner·tradeOwnerCheck와 같게) */
function capOwnerLim(t){ return t.owner==='win'&&t.trust>=70?.15:.10; }
function capOwnerP(t,r){ const L=capOwnerLim(t), n=t.capOver||0; return clamp((t.owner==='win'?.85:t.owner==='pr'?.6:.35)+((t.trust??50)-50)/100-.15*n-(n>=2?.15:0)-.5*clamp(r/L,0,1),.05,.95); } /* n: 지난 시즌까지 연속 초과 횟수(이번에 넘기면 n+1회째) */
function capRoll(key){ let h=2166136261>>>0; const s='capOwn|'+G.year+'|'+G.user+'|'+key; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } h=Math.imul(h^(h>>>13),2246822507)>>>0; return (h>>>0)/4294967296; } /* 경기 난수를 쓰지 않는 고정값 */
const capPLabel=p=>p>=.7?'높음':p>=.4?'반반':'낮음';
/* pay: 움직임 뒤 상한 합계, before: 움직임 전, s: 그 합계를 재는 시즌, key: 결재 건(선수·거래). 결재가 필요 없으면 null */
function capOwnerCheck(pay,before,s,key){ if(G.unemp)return null; const t=team(G.user); if(!t||t.indie)return null; s=s??sponSeason(); const cap=capOf(s); pay=Math.round(pay); before=Math.round(before??0);
  if(!(pay>cap)||pay<=before)return null; /* 상한 안이거나 합계를 늘리지 않는 움직임은 결재가 필요 없다 */
  const B=bossOf(G.user), who=B&&B.own?B.own.name+' 회장':'구단주'; const r=(pay-cap)/cap, L=capOwnerLim(t), lim=Math.floor(cap*(1+L)), n=(t.capOver||0)+1;
  const base={pay,before,cap,s,over:pay-cap,r,lim,L,n,who,key};
  const why=`${s}시즌 상위 40명 연봉이 ${money(pay)}으로 상한 ${money(cap)}을 ${money(pay-cap)}(${Math.round(r*100)}%) 넘습니다`;
  if(pay>lim)return {...base,ok:false,hard:true,p:0,msg:`구단주 승인 불가 · ${why}. ${who}은(는) 상한의 ${Math.round(L*100)}%(${money(lim)})를 넘는 지출은 어떤 경우에도 허락하지 않습니다${L<.15?' (성적 우선 구단주가 단장을 크게 신뢰하면 15%까지)':''}. 금액을 줄이거나 연봉이 많은 선수를 먼저 정리하세요.`};
  const p=capOwnerP(t,r), ok=capRoll(key)<p;
  return {...base,ok,p,msg:ok?'':`구단주 결재 거절 · ${why}. ${who}: "${n>=3?'3년 연속 초과면 신인 1라운드 지명까지 밀립니다. ':n===2?'2년 연속이면 세금이 초과분의 절반입니다. ':''}${t.owner==='profit'?'세금까지 내 가며 쓸 돈은 없습니다.':t.owner==='pr'?'규정을 넘겨 가며 쓰는 건 그룹 이미지에 좋지 않습니다.':'상한을 넘길 만큼의 선수인지 아직 확신이 서지 않습니다.'}" 초과 폭을 줄이면 다시 결재를 올릴 수 있습니다.`}; }
/* 화면 미리보기: 제출 전에 결재가 필요한지·허락하는 범위인지 */
function capOwnerTxt(c){ if(!c)return ''; if(c.hard)return `구단주 허용 한도 ${money(c.lim)} 초과 · 구단주가 승인하지 않습니다`; return `상한 ${money(c.over)} 초과 · 구단주 결재 필요 · 승인 가능성 ${capPLabel(c.p)}`; } /* 결재 결과(고정값)는 미리 알려 주지 않는다: 올려 봐야 안다 */
/* 결재 통과: 구단주 신뢰가 초과 폭만큼 깎인다(5% 넘으면 -2, 10% 넘으면 -3) */
function capOwnerOk(c,what){ if(!c||!c.ok)return; const t=team(G.user); const d=c.r>.1?3:c.r>.05?2:1; t.trust=clamp(t.trust-d,0,100);
  try{ mail('구단주실',`구단주: 상한 초과 결재 (${what})`,`${c.who}: "${what}로 ${c.s}시즌 상위 40명 연봉이 상한을 ${money(c.over)}(${Math.round(c.r*100)}%) 넘지만 이번만 승인하겠습니다. 시즌 끝까지 넘으면 초과분의 ${Math.round(capRate(c.n)*100)}%를 야구발전기금으로 내고, 모기업 지원도 그만큼 줄어듭니다." 구단주 신뢰 하락.`,{kind:'구단주'}); }catch(e){} }
function floorRate(n){ return n>=3?1:n===2?.5:.3; } /* KBO 하한(2027~): 미달분의 1회 30%·2회 연속 50%·3회 연속 100%(유소년 발전기금) */
/* AI 구단은 상한을 지킨다: 가성비가 낮은 고액 선수부터 여유 있는 구단으로 넘기고(연봉 덜어내기 트레이드), 받을 곳이 없으면 방출한다 */
/* 야인일 때는 전 소속 구단도 AI가 운영한다 */
const ME=()=>G.unemp?-99:G.user;
function aiCapFix(tid,frac,noRel,maxN){ const t=team(tid); if(!t||tid===ME())return 0; if(t.allIn===sponSeason()&&(t.cash||0)>0)return 0; /* 올인 구단은 세금을 내고 버틴다 */ const cap=capOf(sponSeason())*(frac||.985)*Math.min(1,aiCapMul(t)); let n=0, guard=0;
  while(capPay(tid)>cap&&guard++<12&&n<(maxN||99)){
    const core=new Set(domestic(tid).sort((a,b)=>ovr(b)-ovr(a)).slice(0,4).map(p=>p.id));
    const c=domestic(tid).filter(p=>!core.has(p.id)&&!isRookie(p)&&p.sal>=150&&!(p.joinY>G.year)&&!hasNtc(p)) /* 거부권 선수는 동의 없이 보낼 수 없다(일반 트레이드와 같은 규칙). 못 맞추면 초과 제재를 받는다 */.sort((a,b)=>aiVal(t,a)/a.sal-aiVal(t,b)/b.sal)[0];
    if(!c)break;
    const rc=G.teams.filter(x=>x.id!==tid&&x.id!==ME()&&(x.cash||0)>-2000&&capPayAs(x.id,[c.id],[])<=capOf(sponSeason())*.95&&rosterN(x.id)<ROSTER_MAX-1&&aiVal(x,c)>=Math.max(.5,c.sal/400)).sort((a,b)=>(capPay(a.id))-(capPay(b.id)))[0];
    if(rc){ tradeTerms(c); mvLog('트레이드',c,tid,rc.id,'연봉 덜어내기',0,mvTr()); c.team=rc.id; c.listed=false; for(const k in G.lineup)if(G.lineup[k]===c.id)delete G.lineup[k]; story(c,`연봉 덜어내기 트레이드로 ${tname(rc.id)} 이적`,'move'); wire('트레이드',`${tname(tid)}, ${noRel?'적자를 줄이려':'샐러리캡 맞추려'} ${c.name}(${money(c.sal)})을 ${tname(rc.id)}로 보냄`,{tid,ref:c.id}); }
    else if(noRel)break;
    else if(domestic(tid).filter(q=>ovr(q)>ovr(c)).length<14)break; /* 주전급(구단 상위 14명)은 방출하지 않고 초과 제재를 감수한다: 실제 구단이 비싼 주전을 웨이버에 내놓지 않는다(카페 11-08) */
    else { const cost=relCost(c).tot; t.cash-=cost; wire('방출',`${tname(tid)}, 샐러리캡 때문에 ${c.name}(${money(c.sal)}) 방출`,{tid,ref:c.id}); if(c.age<=35&&ovr(c)>=30)toFree(c,`${tname(tid)}에서 방출(샐러리캡)`,cost); else retireOut(c,`${tname(tid)}에서 방출된 뒤 은퇴`); } /* 로스터 정리와 같은 기준: 뛸 만한 선수는 무적 시장으로 */
    n++; }
  return n; }
function capWarnUser(){ const pay=capPayNext(G.user), cap=capOf(sponSeason()), ci={pay,cap,over:Math.max(0,pay-cap)}; const t=team(G.user); if(ci.over<=0)return; const n=(t.capOver||0)+1;
  stop('재정',`연봉 재계약 기준으로 우리 상위 40명 연봉이 ${money(ci.pay)}으로 상한 ${money(ci.cap)}을 ${money(ci.over)} 넘습니다. 시즌 끝까지 넘으면 초과분의 ${Math.round(capRate(n)*100)}%를 야구발전기금으로 냅니다${n>=3?'. 3회 연속이라 다음 해 1라운드 지명 순서도 9단계 내려갑니다':''}. 개막 전 트레이드나 방출로 줄일 수 있습니다. 개막 뒤 방출한 선수 연봉은 그해 산정에 남습니다.${t.indie?'':' 상한을 더 넘기는 영입·계약은 구단주 결재가 필요하고, 구단주는 상한을 크게 넘기는 지출은 허락하지 않습니다.'}`); }
/* 하한(2027년~)에 못 미치는 AI 구단은 주축 선수 연봉을 올려(다년계약) 하한을 맞춘다 */
/* 군 입대·부상 이탈로 시즌 중 상위 40명 연봉이 줄어드므로 5% 여유를 두고 맞춘다. 시즌 막판(9월 1일·정규시즌 종료)에도 한 번 더 확인한다 */
function aiFloorFix(tid){ if(tid===ME()||G.year<2027||fNewBonus(tid,G.year))return; const fl=floorOf(G.year); let gap=fl*1.05-capPay(tid); if(gap<=0)return; const t=team(tid); if((t.cash||0)<-3000)return; /* 빚이 큰 구단은 연봉을 억지로 올리지 않고 하한 미달 발전기금을 낸다 */
  const ps=domestic(tid).filter(p=>!isRookie(p)&&!p.ys&&!(p.joinY>G.year)&&!p.extNext) /* 다음 시즌 계약에 합의한 선수는 따로 계약을 바꾸지 않는다(검수 11-09zzb) */.sort((a,b)=>ovr(b)-ovr(a)).slice(0,12);
  /* FA까지 1년 넘게 남은 보류 선수는 연차 상한(preCap)까지만 올린다(카페 11-12: 4~5년 차가 하한 맞추기로 16~17억). 남는 차액은 FA·다년계약 선수에게, 그래도 모자라면 하한 미달 발전기금 */
  const room=p=>(!p.faC&&!p.ext&&(p.svc||0)<faSvc(p)-1)?Math.max(0,preCap(p)-p.sal):1e9;
  const s0=new Map(ps.map(p=>[p.id,p.sal])), s0m=s0;
  for(let k=0;k<6&&gap>0;k++){ const E=ps.filter(p=>room(p)>=5); if(!E.length)break; const tot=sum(E.map(p=>ovr(p))); for(const p of E)p.sal=round5(p.sal+Math.min(room(p),round5(gap*ovr(p)/tot))); gap=fl*1.05-capPay(tid); } /* 올린 뒤 다시 잰다: 프랜차이즈 예외 선수는 인상분의 절반만 들어가 한 번으로는 모자랄 수 있다(검수 11-09y) */
  for(const p of ps){ const s0=s0m.get(p.id); if(p.sal>s0){ p.ysGap=(p.ysGap||[]).filter(g=>g.y>=G.year-1); p.ysGap.push({y:G.year,d0:-1e9,d1:G.day,s0:p.sal,s:s0,t:tid}); } } /* 올린 연봉은 오늘부터: 그 전 기간은 원래 연봉(지급 보정 ysAdj, 검수 11-09x) */
  for(const p of ps){ const y0=p.yrs||0, multi=!p.faC&&(p.svc||0)>=faSvc(p)-1; if(multi){ p.faC=true; p.ext=true; p.yrs=Math.max(p.yrs||0,2); p.cyrs=p.yrs; } /* FA까지 1년 넘게 남은 보류 선수는 다년계약으로 묶지 않고 연봉만 올린다(카페 11-11: 21세 선수가 하한 맞추기로 2년 다년계약) */
    if(p.sal!==s0.get(p.id)||multi)story(p,`연봉 하한 맞추기 계약 조정: 연봉 ${money(s0.get(p.id))} → ${money(p.sal)}, 계약 ${multi?`${y0||1}년 → ${p.yrs}년(다년계약 전환)`:`${p.yrs}년 유지`}`,'move'); } /* 구단이 하한을 맞추려 올린 계약도 선수 이력(이적·계약)에 남긴다 */
  wire('구단',`${t.city} ${t.nick}, 연봉 하한 맞추려 주축 선수들과 다년계약`,{tid}); }
/* 빚이 깊은 AI 구단(현금 -40억 아래): 모기업이 허리띠를 졸라맨다. 고액 베테랑을 여유 있는 구단에 넘겨 상위 40명 연봉을 상한의 80%까지 낮춘다(방출 위약금은 빚을 늘리므로 트레이드만) */
/* 긴축 계획 구단(빚이 그만큼 깊지 않아도)은 상한의 88%까지 덜어낸다. 빚이 깊은 구단은 그 자리에서 긴축으로 돌아선다 */
function aiDebtDump(){ let n=0; for(const t of G.teams){ if(t.id===ME())continue; const deep=t.cash<-4000; if(!deep&&planOf(t)!=='tight')continue; if(deep)try{ aiPlanSet(t,'tight','빚 누적'); }catch(e){ t.mode='rebuild'; } n+=aiCapFix(t.id,deep?.8:.88,true,deep?3:2); } return n; }
function aiCapAll(frac){ for(const t of G.teams)if(t.id!==ME())try{ aiFloorFix(t.id); }catch(e){} let n=0; for(const t of G.teams)if(t.id!==ME())n+=aiCapFix(t.id,frac); return n; }
/* 경쟁균형세 상한 결정(capCouncil)은 68_assoc.js의 실행위원회·이사회로 옮겼다 */
function capInfo(tid){ const pay=preSeason(sponSeason())?capPayNext(tid):capPay(tid), /* 겨울: 합의한 다음 시즌 연봉 기준 */ cap=capOf(sponSeason()); return {pay,all:payYear(tid,sponSeason()),cap,floor:sponSeason()>=2027&&!fNewBonus(tid)?floorOf(sponSeason()):0 /* 신생 구단은 외국인 혜택과 같은 첫 두 시즌 하한 적용 안 함(창단 테스트 11-13: 특별지명 선수단 연봉이 하한의 절반) */ /* 하한 제재는 2027년부터(검수 11-09y) */,over:Math.max(0,pay-cap)}; }

