/* ===== 트레이드 자격·적법성 공통 규칙 =====
 다섯 경로가 선수 자격(tradeEligible)과 거래 적법성(tradeLegal)을 여기서 함께 쓴다.
  우리 제안·역제안·추천(16_trade tradePreflight, tradeCtrOk), 받은 제안 수락·AI 제안 만들기(09_stoveleague offerBlockMsg, 21_block_agents 매물 제안),
  AI끼리 거래(27_other_gms aiTradePackage), 후보·매물 고르기(26_trade_ai, 21_block_agents, 27_other_gms).
 경로마다 쓰는 검사 목록은 TRADE_RULES에 모아 둔다.
 AI끼리 거래(ai)도 우리 구단과 같은 관문을 같은 함수로 지난다(AI 규칙 동등 11-19): 지명권 적법성(pkCheck)·거래 간격과 같은 구단 한도(tradeCool)·거부권 동의(ntcFor, 동의는 ntcAskAI)·
 구단주 예산 승인(tradeOwnerCheck)·연봉 상한 결재(tradeCapCheck). 결재는 사는 쪽·파는 쪽 모두 자기 구단주에게 받는다(우리 구단도 제안할 때·받은 제안을 수락할 때 모두 받는다). */

/* 선수 자격. ctx로 경로가 지금 쓰는 검사만 켠다(생략하면 켬).
 tid: 그 구단 소속이어야 한다 / foreign·ys(육성)·joinY(입단 예정)·healthy·faLock(FA 잠금): 개별 검사
 ntc: true(거부권이 있으면 안 됨, 기본) · 구단 번호(그 구단행 동의가 없을 때만 안 됨) · false
 recent: 'tr'(트레이드 뒤 30일, 기본) · 'mv'(이동 뒤 120일) · false. 검사는 모두 난수를 쓰지 않는다 */
function tradeEligible(p,ctx){ const c=ctx||{}; if(!p)return false;
  if(c.tid!=null&&p.team!==c.tid)return false;
  if(c.foreign!==false&&p.foreign)return false;
  if(c.ys!==false&&p.ys)return false;
  if(c.joinY!==false&&p.joinY>G.year)return false;
  if(c.healthy!==false&&!healthy(p))return false;
  const nt=c.ntc===undefined?true:c.ntc; if(nt===true?hasNtc(p):nt!==false&&ntcFor(p,nt))return false;
  if(c.faLock!==false&&faLock(p))return false;
  const rc=c.recent===undefined?'tr':c.recent; if(rc==='tr'?recentTr(p):rc==='mv'&&mvRecent(p))return false;
  return true; }
/* 거래 뒤 정식 인원이 정원 안인지(evalTrade의 theirN). 이미 정원을 넘었거나(군 전역·드래프트 합류 등) 모자란 구단은 그 차이를 더 키우지만 않으면 된다: 71명인 구단이 4명을 받고 6명을 보내 69명이 되는 거래는 막지 않는다(카페 11-21 마스터쉐프). 모든 구단 같은 규칙 */
function tradeSizeOk(e){ const n0=e.theirN0??e.theirN; return (e.theirN>=ROSTER_MIN||e.theirN>=n0)&&(e.theirN<=ROSTER_MAX||e.theirN<=n0); }
/* 선수 nOut명을 보내고 nIn명을 받은 뒤 정원(ROSTER_MAX)을 넘지 않는지 */
function tradeRosterFits(tid,nOut,nIn){ return rosterN(tid)-nOut+nIn<=ROSTER_MAX; }

/* 거래 적법성. deal: {from, to, give(from이 보냄), get(to가 보냄), cash(from이 to에게, 음수면 반대), pk}
 ctx.path: 'user'(우리 제안: from=우리 구단, ctx.budget이면 구단주·상한 결재까지) · 'offer'(받은 제안: from=우리 구단, to=제안 구단, ctx.strict) · 'ai'(AI끼리: from=사는 구단 A, to=파는 구단 B)
 돌려주는 값은 경로가 예전에 돌려주던 모양 그대로다(user: {ok,msg,...}, offer: {ok,msg}, ai: {ok,a,b}) */
const TRADE_RULES={
  user:['recent','open','empty','faLock','own','ntcOut','ntcIn','cashMax','cashInNoGive','cashTheirs','cashOutNoGet','cashMine','foreign','pk','cool','budget','owner','cap'],
  offer:['recentOffer','coolOffer','faLock','ntcOut','ntcIn','exists','own','cashParse','cashInt','cashMine','cashTheirs','pk','eval','size','capHard','value'],
  ai:['distinct','eligible','cashMax','cashAi','pkAi','coolAi','ntcAi','evalTo','ownerAi','capAi','evalFrom']
};
const TRADE_RULE={
  recent:d=>{ const msg=tradeRecentMsg([...d.give,...d.get]); if(msg)return {ok:false,msg}; },
  recentOffer:d=>{ const msg=tradeRecentMsg([...(d.get||[]),...(d.give||[])]); if(msg)return {ok:false,msg}; },
  open:()=>{ if(!tradeOpen())return {ok:false,msg:'트레이드 마감(7월 31일)이 지났습니다. 포스트시즌이 끝난 뒤 다시 할 수 있습니다.'}; },
  empty:d=>{ if(!d.give.length&&!d.get.length)return {ok:false,msg:'주고받을 선수를 골라 주세요.'}; },
  faLock:d=>{ const m=faLockMsg([...(d.give||[]),...(d.get||[])]); if(m)return {ok:false,msg:m}; },
  exists:d=>{ if([...d.get,...d.give].some(id=>!G.players[id]))return {ok:false,msg:'선수 상황이 바뀌어 성사되지 않았습니다.'}; },
  own:(d,c)=>{ const off=c.path==='offer', bad=(ids,tid)=>ids.some(id=>!G.players[id]||G.players[id].team!==tid);
    if(off?bad(d.get,d.to)||bad(d.give,d.from):bad(d.give,d.from)||bad(d.get,d.to))return {ok:false,msg:off?'선수 상황이 바뀌어 성사되지 않았습니다.':'선수 소속이 바뀌었습니다. 목록을 다시 확인하세요.'}; }, /* 우리 선수만 보내고 그 구단 선수만 받는다 */
  ntcOut:(d,c)=>{ const nt=ntcOfFor(d.give,d.to); if(!nt)return; if(c.path==='offer')return {ok:false,msg:`${nt.name}은(는) 트레이드 거부권이 있어 보낼 수 없습니다. 선수에게 ${tshort(d.to)}행 동의를 구할 수 있습니다.`};
    return {ok:false,ntc:nt.id,msg:`${nt.name}은(는) 계약서에 트레이드 거부권이 있어 동의 없이 보낼 수 없습니다(${nt.ntc}년까지). 선수에게 ${tshort(d.to)}행 동의를 구할 수 있습니다.`}; },
  ntcIn:(d,c)=>{ const nt=ntcOf(d.get); if(!nt)return; return {ok:false,msg:c.path==='offer'?`${tname(d.to)} ${nt.name}은(는) 트레이드 거부권이 있어 데려올 수 없습니다.`:`${tname(d.to)} ${nt.name}은(는) 계약서에 트레이드 거부권이 있어 데려올 수 없습니다(${nt.ntc}년까지).`}; },
  cashMax:(d,c,x)=>{ if(Math.abs(x.cash)>3000)return c.path==='ai'?{ok:false}:{ok:false,msg:'현금은 한 번에 30억 원까지 주고받을 수 있습니다.'}; },
  cashInNoGive:(d,c,x)=>{ if(x.cash<0&&!d.give.length)return {ok:false,msg:'선수를 보내지 않고 현금만 받는 거래는 할 수 없습니다.'}; },
  cashOutNoGet:(d,c,x)=>{ if(x.cash>0&&!d.get.length)return {ok:false,msg:'현금만 주고 선수를 받지 않는 거래는 할 수 없습니다.'}; },
  cashTheirs:(d,c,x)=>{ const t=team(d.to); if(x.cash<0&&(t.cash||0)<-x.cash)return {ok:false,msg:c.path==='offer'?'상대 구단의 트레이드 현금 여유가 부족합니다.':`${tname(d.to)}은(는) 그만한 현금 여유가 없습니다(보유 ${money(Math.max(0,t.cash||0))}).`}; },
  cashMine:(d,c,x)=>{ if(!(x.cash>0))return; const myC=spendable(G.user); /* 약정 현금과 구단주 지원 여유를 포함한 실제 지출 가능액 */ if(myC>=x.cash)return;
    return {ok:false,msg:c.path==='offer'?'우리 구단의 트레이드 현금 여유가 부족합니다.':`우리 구단 선수 영입 자금(${team(G.user).indie?'독립구단이라 보유 현금만, 앞선 거래 약정분 제외':'보유 현금 + 구단주 지원 여유'} ${money(Math.max(0,myC))})이 얹을 현금 ${money(x.cash)}보다 적습니다.`}; },
  cashParse:(d,c,x)=>{ x.cash=d.cash==null?0:+d.cash; x.pk=pkNorm(d.pk); }, /* 받은 제안은 저장된 조건을 여기서 읽는다(간격 검사는 저장된 값 그대로) */
  cashInt:(d,c,x)=>{ if(!Number.isSafeInteger(x.cash)||Math.abs(x.cash)>3000)return {ok:false,msg:'현금 조건이 올바르지 않습니다(최대 30억 원).'}; },
  cashAi:(d,c,x)=>{ const A=team(d.from), B=team(d.to); if((x.cash>0&&(!d.get.length||x.cash>(A.cash||0)-AI_CASH_BUF))||(x.cash<0&&(!d.give.length||-x.cash>(B.cash||0)-AI_CASH_BUF)))return {ok:false}; },
  foreign:d=>{ if([...d.give,...d.get].some(id=>G.players[id].foreign))return {ok:false,msg:'외국인 선수는 트레이드할 수 없습니다.'}; },
  pk:(d,c,x)=>{ const pe=pkCheck(d.to,d.give,d.get,x.pk); if(pe)return {ok:false,msg:pe}; },
  cool:(d,c,x)=>{ const t=team(d.to), gmn=`${tfull(t)} ${gmOf(d.to).name} 단장`; const cd=tradeCool(d.to,d.get,x.cash,x.pk); if(cd)return {ok:false,cool:true,msg:cd.cap?`${gmn}: 올해 귀 구단과는 벌써 ${cd.n}번 거래했습니다. 팬 여론도 있고, 받은 선수들이 적응하는 것부터 봐야 합니다. 내년에 다시 이야기합시다.`:`${gmn}: 지난번 거래(${dsh(cd.d)}) 뒤 여론과 받은 선수들이 자리 잡는 걸 먼저 보겠습니다. ${dsh(cd.until)}부터 다시 이야기합시다.`}; },
  coolOffer:d=>{ const cd=tradeCool(d.to,d.get,d.cash||0,d.pk); if(cd)return {ok:false,msg:'최근 거래 횟수 또는 거래 간격 제한으로 지금은 거래할 수 없습니다.'}; },
  budget:(d,c)=>{ if(!c.budget)return {ok:true}; },
  owner:(d,c,x)=>{ const oc0=tradeOwnerCheck(d.give,d.get,x.cash); x.oc0=oc0; if(oc0&&!oc0.ok)return {ok:false,owner:true,msg:oc0.msg}; },
  cap:(d,c,x)=>{ const cc0=tradeCapCheck(d.give,d.get); x.cc0=cc0; if(cc0&&!cc0.ok)return {ok:false,owner:true,msg:cc0.msg}; x.res={ok:true,oc0:x.oc0,cc0}; },
  eval:(d,c,x)=>{ x.ev=evalTrade(d.to,d.give,d.get,x.cash,x.pk); },
  size:(d,c,x)=>{ if(!tradeSizeOk(x.ev))return {ok:false,msg:`${tfull(team(d.to))} 로스터 사정이 바뀌어 성사되지 않았습니다(정식 ${x.ev.theirN}명).`}; },
  capHard:(d,c,x)=>{ if(x.ev.capT&&x.ev.capT.hard)return {ok:false,msg:`${tfull(team(d.to))} 단장: 그사이 연봉 사정이 바뀌어 구단주가 허락하는 한도를 넘게 됐습니다. 이 제안을 지킬 수 없습니다.`}; }, /* 소프트캡(13_roster aiCapTake): 한도 안이면 세금만큼 값으로 따진다(evalTrade) */
  value:(d,c,x)=>{ if(c.keep)return; /* 카페 11-20: 보낸 제안은 오가는 선수가 실제로 바뀌지 않으면 기한까지 지킨다(09_stoveleague offerMoved) */ const ev=x.ev, tol=c.strict?0:Math.max(1.5,ev.outV)*.15; if(!ev.ok&&((ev.dom&&ev.dom.refuse)||ev.gain<ev.need-tol))return {ok:false,msg:`${tfull(team(d.to))} 단장: 다시 따져 보니 이 조건으로는 어렵겠습니다.`}; }, /* 공략 방지: AI 제안도 직접 협상과 같은 값(evalTrade)으로 판정. strict: 제안을 만들 때는 evalTrade가 받아들이는 조건만, 수락할 때는 역제안과 같은 여유(.15) */
  distinct:d=>{ if(d.from===d.to||new Set(d.give).size!==d.give.length||new Set(d.get).size!==d.get.length)return {ok:false}; },
  eligible:d=>{ const ok=(ids,tid)=>ids.every(id=>tradeEligible(G.players[id],{tid,ntc:false})); if(!ok(d.give,d.from)||!ok(d.get,d.to))return {ok:false}; }, /* 거부권은 아래 ntcAi(우리와 같은 동의 절차) */
  pkAi:(d,c,x)=>{ if(pkCheck(d.to,d.give,d.get,x.pk,d.from))return {ok:false}; },
  coolAi:(d,c,x)=>{ if(tradeCool(d.to,d.get,x.cash,x.pk,d.from))return {ok:false}; }, /* 거래 간격·같은 구단 한도: 우리 구단과 같은 함수(사는 쪽 기준, 급매 예외·맞대결 예외도 같게) */
  ntcAi:(d,c)=>{ const bad=(ids,to)=>ids.some(id=>{ const p=G.players[id]; return c.ntcAsk?!ntcAskable(p,to):ntcFor(p,to); }); if(bad(d.give,d.to)||bad(d.get,d.from))return {ok:false}; }, /* 후보를 고를 때(ntcAsk)는 물어볼 수 있는 선수까지, 최종 확인은 동의가 있어야 */
  ownerAi:(d,c,x)=>{ const oA=tradeOwnerCheck(d.give,d.get,x.cash,false,d.from), oB=tradeOwnerCheck(d.get,d.give,-x.cash,false,d.to); if((oA&&!oA.ok)||(oB&&!oB.ok))return {ok:false,b:x.b}; x.ocA=oA; x.ocB=oB; },
  capAi:(d,c,x)=>{ const cA=tradeCapCheck(d.give,d.get,d.from), cB=tradeCapCheck(d.get,d.give,d.to); if((cA&&!cA.ok)||(cB&&!cB.ok))return {ok:false,b:x.b}; x.ccA=cA; x.ccB=cB; },
  evalTo:(d,c,x)=>{ const b=evalTrade(d.to,d.give,d.get,x.cash,x.pk,d.from); x.b=b; if(!b.ok||!tradeSizeOk(b))return {ok:false,b}; },
  evalFrom:(d,c,x)=>{ const a=evalTrade(d.from,d.get,d.give,-x.cash,{y:x.pk.y,give:x.pk.get,get:x.pk.give},d.to); return {ok:!!(a.ok&&tradeSizeOk(a)),a,b:x.b,ocA:x.ocA,ocB:x.ocB,ccA:x.ccA,ccB:x.ccB}; }
};
/* AI끼리 거래가 성사되면 결재 대가를 우리 구단과 같게(예산 초과 승인 신뢰 -2, 상한 초과 결재 신뢰 -1~3) */
function tradeApproveAI(e,A,B){ if(!e)return; if(e.ocA&&e.ocA.ok&&e.ocA.over>0)tradeOwnerOk(e.ocA,A); if(e.ocB&&e.ocB.ok&&e.ocB.over>0)tradeOwnerOk(e.ocB,B); if(e.ccA&&e.ccA.ok)capOwnerOk(e.ccA,'트레이드',A); if(e.ccB&&e.ccB.ok)capOwnerOk(e.ccB,'트레이드',B); }
function tradeLegal(deal,ctx){ const c=ctx||{}, x={cash:deal.cash,pk:deal.pk,res:{ok:true}};
  for(const k of TRADE_RULES[c.path]){ const r=TRADE_RULE[k](deal,c,x); if(r)return r; }
  return x.res; }
