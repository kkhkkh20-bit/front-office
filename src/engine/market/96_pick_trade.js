/* ===== 신인 지명권 트레이드 (KBO 2020 시즌부터) =====
   출처: 엑스포츠뉴스 2020.4.30(2020 시즌부터 다음 연도 신인 지명권을 선수와 맞바꿀 수 있게 됨),
         노컷뉴스 2022.9.8(넘겨받은 지명권을 원래 구단 순번에 행사: 예: 다른 구단의 2라운드 12번을 받으면 그 순번에 지명).
   - 다음에 열릴 신인 드래프트 지명권과, 게임 규칙으로 그다음 드래프트 지명권까지 주고받을 수 있다(카페 11-18 건의: 미래 지명권 트레이드).
     실제 KBO는 다음 연도 지명권만 허용한다. 그다음 드래프트 자기 지명권은 구단당 PK_FUT_OUT장까지만 내줄 수 있다(우리·AI 같은 함수 pkFutWhy).
   - 지명권만 따로 사고팔 수는 없고 선수와 맞바꿔야 한다.
   - 넘겨받은 지명권은 원래 구단의 순번에 쓴다(10_draft draftPlan이 G.pkOwn을 연도별로 읽는다).
   지명권 열쇠: 'rd:원래 구단'은 다음 드래프트(pkYear) 것, 'rd:원래 구단:연도'는 그 뒤 드래프트 것. G.pkOwn['연도:rd:원래 구단']=지금 보유 구단(없으면 원래 구단) */
/* 11-13 측정(AI 리그 12시즌): 1라운드 1~3순위는 6년 안에 주전이 될 확률 46%·간판급 21%, 4~7순위 34%·0%, 8~10순위 13%·0%, 2라운드 4%.
   잠재력이 다 터지지 않는 성장 모형이라 지명권 값은 '주전이 될 확률 × 주전 몇 해의 값'으로 맞췄다(1라운드 앞 순번 18.8 → 끝 순번 3.5(11-18 곡선 조정), 2라운드 3.9~2.3) */
const PK_V=[15,3,1.6,.05,.05,.05,.05,.05,.05,.05,.05]; /* 4라운드부터는 주전 확률이 거의 없어 값이 거의 없다(공략 방지) */
const PK_R1S=[1.25,1.1,.95,.7,.6,.5,.42,.32,.27,.23]; /* 1라운드 순번별 배율: 상위 세 순번과 하위 세 순번의 차이가 크다. 11-18 소유자: 곡선을 더 가파르게(예전 .85·.8·.75·.7·.45·.4·.35). 측정(12개 세계): 지명 직후 신인 값 1순위 28·2~3순위 15·4~5순위 8·6~7순위 4·8~10순위 1 안팎 */
const PK_KEEP=1.2; /* 지명권은 내줄 때 더 아낀다(사용자 11-13: 지명권을 소중히). 올인·벼랑 끝 구단만 그대로 내준다 */
/* 11-18 카페·소유자(1순위 지명권은 진짜 희귀해야): 상위 지명권 값은 그대로 두고(자기 상위 3순번 ×2~2.6, 내줄 때 ×1.2, 매집 ×1.4), 순번 곡선만 가파르게 했다.
   1~3순위는 프리미엄, 8~10순위는 탄탄한 주전 한 명이면 살 수 있게, 2라운드부터는 싸다. 우리·AI 같은 함수(k는 예전 호출과 맞추려 받기만 한다) */
const pkKeep=(t,k)=>t&&t.id!==ME()&&(t.allIn===sponSeason()||despOf(t)>=.5)?1:PK_KEEP;
const pkCanon=k=>{ const a=pkParse(k); return pkKey(a.rd,a.o,a.y); };
const pkHoard=(buyer,k,gv,incoming)=>{ const K=pkParse(k); if(K.rd!==1)return 1; const same=x=>{ const a=pkParse(x); return a.rd===1&&a.y===K.y; }; const out=new Set((gv||[]).map(pkCanon)); const n=pkHeldF(buyer).filter(x=>same(x)&&!out.has(x)).length; const add=[...new Set((incoming||[k]).map(pkCanon))].filter(same).sort((a,b)=>pkParse(a).o-pkParse(b).o).indexOf(pkCanon(k)); return 1+.4*Math.max(0,n+Math.max(0,add)); }; /* gv: 같은 거래에서 내주는 지명권은 빼고 센다(국사왕 11-16: 1라 9·10번을 들고 10번을 4번과 바꾸면 거래 뒤에도 두 장인데 세 장째 값을 불렀다) */ /* 1라운드 지명권 보유 한도는 없다(KBO도 받는 장수 제한 없음, 사용자 11-15). 대신 같은 해 1라운드를 여러 장 쥔 구단에는 파는 단장이 더 비싸게 부른다: 두 장째부터 한 장마다 40%씩. 우리·AI 같음 */
const pkYear=()=>G.draft&&G.draft.y===G.year?G.year+1:G.year;
const PK_FUT=1; /* 다음 드래프트 뒤로 한 해 더(최대 두 번의 드래프트) */
const PK_FUT_OUT=2; /* 그다음 드래프트 자기 지명권은 구단당 2장까지만 남에게 넘길 수 있다 */
const pkYears=()=>{ const y=pkYear(); return Array.from({length:PK_FUT+1},(_,i)=>y+i); };
function pkParse(k){ const a=String(k).split(':').map(Number); return {rd:a[0],o:a[1],y:a.length>2&&Number.isFinite(a[2])?a[2]:pkYear()}; }
function pkKey(rd,o,y){ return y===pkYear()?rd+':'+o:rd+':'+o+':'+y; }
function pkOwner(y,rd,orig){ const o=G.pkOwn&&G.pkOwn[y+':'+rd+':'+orig]; return o??orig; }
/* 그 구단이 가진 다음 드래프트 지명권: 'rd:원래 구단' 목록 */
function pkHeld(tid){ const y=pkYear(), L=[]; for(let rd=1;rd<=DRAFT_ROUNDS;rd++)for(const t of G.teams)if(pkOwner(y,rd,t.id)===tid)L.push(rd+':'+t.id); return L; }
/* 다음 드래프트와 그다음 드래프트까지: 트레이드 화면·거래 검사·AI 거래가 같이 쓴다 */
function pkHeldF(tid){ const L=[]; for(const y of pkYears())for(let rd=1;rd<=DRAFT_ROUNDS;rd++)for(const t of G.teams)if(pkOwner(y,rd,t.id)===tid)L.push(pkKey(rd,t.id,y)); return L; }
function pkName(k){ const {rd,o,y}=pkParse(k); return `${tshort(o)} ${y} ${rd}라운드`; }
/* 예상 순번(0이 첫 순번): 올해 드래프트 전이면 정해진 순서, 끝났으면 지금 순위의 역순 */
function pkSlot(orig,rd){ const D=pkYear()===G.year?draftOrders():null; let o=D?(rd===1?D.r1:D.r2):standingsNow().map(x=>x.tid).reverse(); if(!D&&rd===1)o=penOrder(o,G.teams.filter(t=>t.pickPen===pkYear()).map(t=>t.id)); /* 이미 확정된 다음 드래프트 순번 하락 제재: 실제 순번과 같은 식(검수 11-07, 11-08d: 두 구단이 같은 순번으로 잡힘) */ let i=o.indexOf(orig); if(i<0)i=5; return i; } /* 1라운드는 경쟁균형세 페널티가 반영된 순서 */
/* 올 시즌 진행 정도(0~1): 팀당 평균 경기 수 / 144 */
function pkSeasonProg(){ try{ const r=G.sea&&G.sea.rec; if(!r||(G.sea.y!=null&&G.sea.y!==G.year))return 0; const g=G.teams.map(t=>{ const x=r[t.id]||{}; return (x.w||0)+(x.l||0)+(x.t||0); }); return clamp(g.reduce((a,b)=>a+b,0)/g.length/144,0,1); }catch(e){ return 0; } }
/* 미래 지명권의 예상 순번(카페 11-18): 그 드래프트 순서를 정할 시즌이 아직 덜 끝났으면 지금 전력(순위, 시즌 초엔 지난 순서)으로 어림하고 가운데 쪽으로 당겨 본다.
   y가 다음 드래프트면 예전 pkSlot과 같은 식, 그 뒤 해는 지금 순위(10경기 전엔 지난 시즌 순서)로. 올해 확정 순서는 그대로 */
function pkProjIdx(o,rd,y){ if(y===pkYear())return pkSlot(o,rd); let ord; const D=draftOrders(); if(pkSeasonProg()*144>=10||!D)ord=standingsNow().map(x=>x.tid).reverse(); else ord=[...D.r2];
  if(rd===1)ord=penOrder(ord,G.teams.filter(t=>t.pickPen===y).map(t=>t.id)); const i=ord.indexOf(o); return i<0?5:i; }
function pkSlotY(o,rd,y){ const i=pkProjIdx(o,rd,y); if(!(y>G.year))return i; const n=G.teams.length, mid=(n-1)/2; const w=y===G.year+1?.5+.45*pkSeasonProg():.4; return mid+(i-mid)*w; }
/* 시간 할인: 그 드래프트까지 남은 해(올해 0, 내년 1, 후년 2). 순번이 정해지지 않았고 후보도 아직 모른다 */
const PK_DISC=[1,.92,.82];
const pkDisc=y=>PK_DISC[Math.max(0,Math.min(PK_DISC.length-1,y-G.year))];
/* 드래프트 후보가 보이는 해(올해 드래프트 전): 그 구단 스카우트 눈(aiDraftEst, 우리 보고서와 같은 재료)으로 본 이번 후보층 순위별 평가를 평년(12개 세계 평균)과 견준다.
   그 순번 근처(순번·다음 두 순위) 후보가 평년보다 1점 높으면 1라운드 값 +4%, 0.85~1.15배. 난수를 쓰지 않는다(해시 오차) */
const PK_CLS_REF=[78.7,74.1,71.6,69.7,68.2,66.9,65.9,65,64.3,63.6,63,62.4,61.8,61.3,60.9,60.5,60.1,59.6,59.3,58.9,58.5,58.2];
let _pkCls={k:null,g:null,m:{}};
function pkClassEst(tid){ const k=G.year+':'+G.day+':'+(G.draftClass||[]).length; if(_pkCls.k!==k||_pkCls.g!==G)_pkCls={k,g:G,m:{}}; if(_pkCls.m[tid])return _pkCls.m[tid];
  const L=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&p.team==null).map(p=>{ try{ return aiDraftEst(tid,p).v; }catch(e){ return null; } }).filter(v=>Number.isFinite(v)).sort((a,b)=>b-a).slice(0,PK_CLS_REF.length); return _pkCls.m[tid]=L; }
function pkClassMul(t,rd,sl,y){ if(rd!==1||y!==G.year||!t||(G.draft&&G.draft.y===G.year))return 1; const L=pkClassEst(t.id); const i=Math.max(0,Math.min(PK_CLS_REF.length-3,Math.round(sl))); if(L.length<i+3)return 1;
  const e=(L[i]+L[i+1]+L[i+2])/3, r=(PK_CLS_REF[i]+PK_CLS_REF[i+1]+PK_CLS_REF[i+2])/3; return clamp(1+(e-r)*.04,.85,1.15); }
/* 10구단 배율은 유지하고, 확장 리그는 4순번 이후 곡선을 늘린다. */
function pkR1Mul(sl){ const n=G.teams.length, x=n>10&&sl>=3?3+(sl-3)*6/(n-4):sl, lo=Math.min(PK_R1S.length-1,Math.max(0,Math.floor(x))), hi=Math.min(lo+1,PK_R1S.length-1); return PK_R1S[lo]+(PK_R1S[hi]-PK_R1S[lo])*(x-lo); }
function pkVal(t,k){ const {rd,o,y}=pkParse(k); const m=planPickMul(t)||(t.mode==='rebuild'?1.3:teamCtx(t).contend?.8:1); /* 운영 전략: 유망주 수집 1.5배·긴축 1.3배·우승 도전 0.9배(우리 구단은 예전 기준) */ const sl=pkSlotY(o,rd,y); const own=rd===1&&o===t.id?pkTopMul(t,sl):1; /* 상위 3순번 자기 1라운드 지명권: 안 파는 게 아니라 아주 비싸게 판다(유저 피드백 11-07) */
  return (PK_V[rd-1]||.05)*(rd===1?pkR1Mul(sl)*m*pkClassMul(t,rd,sl,y):1.3-.06*sl)*own*pkDisc(y)*TR_TUNE.pk; } /* 11-18 4차: 지명권은 AI 눈에 ×1.15(16_trade TR_TUNE) */ /* 운영 전략 배율은 1라운드에만 */ /* 11-18 카페: 후보층(pkClassMul)·미래 순번 어림(pkSlotY)·시간 할인(pkDisc) */
const PK_TOP3=2;
/* 자기 상위 1라운드 지명권(1~5순번): 아주 비싸게 판다. 유망주 수집·내년 도전·긴축 구단은 더(공략 방지 11-14: 애매한 선수+현금으로 상위 지명권을 해마다 사 가던 것). AI끼리도 같은 값 */
const pkTopMul=(t,sl)=>{ const keen=['build','next','tight'].includes(planOf(t)); return sl<3?(keen?2.6:PK_TOP3):sl<5?(keen?1.7:1.4):1; };
const pkNorm=pk=>({give:[...new Set((pk&&pk.give)||[])],get:[...new Set((pk&&pk.get)||[])],y:pk&&pk.y!=null?pk.y:pkYear()}); /* y: 거래안에 넣을 때의 드래프트 연도. 드래프트가 끝나도 다음 해 것으로 바뀌지 않게(검수 11-06) */ /* 같은 지명권을 두 번 넣어도 한 장(검수 11-06) */
const pkSig=pk=>{ pk=pkNorm(pk); return pk.give.length||pk.get.length?'|p'+pk.y+':'+[...pk.give].sort().join(',')+'/'+[...pk.get].sort().join(','):''; };
/* 그다음 드래프트 자기 지명권 한도: 이미 남에게 넘긴 장수 + 이번에 내줄 장수가 PK_FUT_OUT을 넘으면 안 된다. 우리·AI 같은 함수 */
function pkFutOut(tid){ const y=pkYear(); let n=0; for(const yy of pkYears())if(yy>y)for(let rd=1;rd<=DRAFT_ROUNDS;rd++)if(pkOwner(yy,rd,tid)!==tid)n++; return n; }
function pkFutWhy(tid,out){ const y=pkYear(); const add=new Set((out||[]).map(pkCanon).filter(k=>{ const a=pkParse(k); return a.o===tid&&a.y>y&&pkOwner(a.y,a.rd,tid)===tid; })).size; if(!add)return ''; const n=pkFutOut(tid);
  return n+add>PK_FUT_OUT?`${tid===G.user?'우리 구단':tname(tid)}은(는) ${y+1} 드래프트 자기 지명권을 ${n?`이미 ${n}장 넘겨 `:''}더 내줄 수 없습니다(그다음 드래프트 자기 지명권은 구단당 ${PK_FUT_OUT}장까지).`:''; }
function pkCheck(tid,give,get,pk){ pk=pkNorm(pk); if(!pk.give.length&&!pk.get.length)return '';
  if(G.draft&&!G.draft.done)return '신인 드래프트가 진행 중이라 지명권을 주고받을 수 없습니다.';
  if(pk.y!==pkYear())return `거래안의 지명권은 ${pk.y} 드래프트 때 고른 것입니다. 지금 주고받을 수 있는 것은 ${pkYears().join('·')} 드래프트 지명권입니다. 다시 골라 주세요.`;
  const mine=pkHeldF(G.user), their=pkHeldF(tid); if(pk.give.some(k=>!mine.includes(pkCanon(k)))||pk.get.some(k=>!their.includes(pkCanon(k))))return '지명권 보유 구단이 바뀌었습니다. 다시 골라 주세요.';
  if((pk.give.length&&!get.length)||(pk.get.length&&!give.length))return '리그 규약상 지명권은 선수와 맞바꿀 때만 넘길 수 있습니다. 지명권을 주려면 선수를 받고, 지명권을 받으려면 선수를 보내야 합니다.';
  return pkFutWhy(G.user,pk.give)||pkFutWhy(tid,pk.get); }
/* ===== 상위 지명권 기준선(소유자 11-18 "정말 류현진이면 거래하겠지") =====
   1라운드 지명권 값은 '적어도 주전, 잘되면 간판'의 기대값이다(주전 확률 × 주전 값 + 간판 확률 × 간판 값, 활약까지 남은 해만큼 할인: PK_V·PK_R1S·pkDisc).
   1~5순번(미래 지명권은 예상 순번 5순번 안)은 값 비교 전에 기준선을 넘어야 한다: 리그 A급 선수(리그 주전 가운데 현재 능력 상위 8%)를 연봉 부담이 크지 않게(연봉 ≤ 그 능력 한 해 값) 받고,
   그 선수 자리가 받는 구단에 필요해야 한다(그 자리가 리그 아래쪽 절반이고 그 자리 가장 약한 주전보다 3 이상 낫다). 1순위는 기준선 맨 위: 리그 최정상급(상위 3%, 화면 종합 80 이상) 특급이어야 한다.
   기준선을 넘으면 그다음은 보통 값 비교(1순위는 여전히 가장 비싸다). 우리 구단의 제안(evalTrade)·AI끼리 거래(aiTradePackage → evalTrade) 모두 같은 함수. 올인 구단은 기준선 없음(이미 미래를 내건 상태).
   실제 사례(KBO 2020~2024): 1순위 지명권 트레이드는 한 번도 없었다. 1라운드 #7+3라운드 ↔ 22세 주전 내야수 김휘집(2024.5 키움→NC), 1라운드 #10+4라운드+10억 ↔ FA 1년 앞 마무리 조상우(2024.12 키움→KIA),
   2라운드+선수+10억 ↔ 주전 포수 박동원(2022.4), 2라운드 ↔ 백업 포수 주효상, 3라운드 ↔ 불펜 김태훈, 3라운드 ↔ 유틸리티 베테랑(2020 롯데↔kt). 6순번 이하는 값 곡선(PK_R1S)으로만 따진다 */
const PK_GATE=5, PK_A_PCT=.92, PK_STAR_PCT=.97;
let _pkLn={k:null,g:null,v:null};
function pkLines(){ const k=G.year+':'+G.day; if(_pkLn.k===k&&_pkLn.g===G)return _pkLn.v; const S=new Set(); for(const t of G.teams)for(const id of startersOf(t.id))S.add(id);
  const V=[...S].map(id=>G.players[id]).filter(Boolean).map(ovr).sort((a,b)=>a-b), at=f=>V.length?V[Math.min(V.length-1,Math.floor(V.length*f))]:99; const v={a:at(PK_A_PCT),star:at(PK_STAR_PCT)}; _pkLn={k,g:G,v}; return v; }
/* 2: 특급(1순위 기준), 1: A급(2~5순위 기준), 0: 그 밖. 연봉이 그 능력 한 해 값보다 많으면 0 */
function pkGrade(p){ if(!p||p.ys||p.age>33||!healthy(p))return 0; const o=ovr(p); if(p.sal/100>seasonWorth(o+pvShift(p)))return 0; const L=pkLines(); return o>=L.star&&dv(o)>=80?2:o>=L.a?1:0; }
function pkAce(p){ return pkGrade(p)>=2; }
function pkTopSlot(k){ const a=pkParse(k); return a.rd===1&&pkSlotY(a.o,1,a.y)<PK_GATE-.5; }
/* 자리가 필요하다: 그 선수가 뛸 자리(지명타자 제외)가 리그 아래쪽 절반(순위 n/2 이하)이고, 그 자리 가장 약한 주전보다 3 이상 낫다(trFills와 같은 기준) */
function pkNeedFor(t,p){ try{ const R=slotRanks(t.id), n=G.teams.length; return tradeSlotsOf(p).some(k=>k!=='DH'&&R[k]&&R[k].rank>=n/2&&slotGain(k,p)-slotBase(t.id,k)>=TR_TUNE.fitUp); }catch(e){ return false; } }
/* 기준선에 못 미치는 이유(없으면 ''). t: 지명권을 내주는 AI 구단, inIds: 그 구단이 받는 선수 */
function pkGateWhy(t,out,inIds){ if(!t||t.id===ME())return ''; const top=(out||[]).filter(pkTopSlot); if(!top.length)return ''; if(t.allIn===sponSeason())return '';
  const one=top.some(k=>{ const a=pkParse(k); return pkSlotY(a.o,1,a.y)<.5; }), bar=one?2:1; const P=(inIds||[]).map(id=>G.players[id]).filter(Boolean), gr=P.filter(p=>pkGrade(p)>=bar);
  if(gr.some(p=>pkNeedFor(t,p)))return '';
  return `${top.map(pkName).join(', ')} 지명권은 ${one?'리그 최정상급(특급) 선수':'리그 A급 선수'}를 받고 그 자리가 필요할 때만 검토합니다${gr.length?'(그 선수 자리는 지금 저희에게 급하지 않습니다)':''}. 팬들이 미래를 판다고 볼 거래입니다.`; }
/* 상위 5순번 1라운드 지명권을 내준 구단은 팬 여론이 조금 나빠진다(우리·AI 같음, 난수 없음) */
function pkFanHit(tid){ try{ const P=prOf(tid); if(P&&P.fan!=null)P.fan=clamp(P.fan-2,0,100); }catch(e){} }
/* 지명권 한 장의 보유 구단을 바꾼다(우리·AI 거래 공통) */
function pkSet(k,to){ const {rd,o,y}=pkParse(k); G.pkOwn=G.pkOwn||{}; { const from=pkOwner(y,rd,o); if(from!==to&&rd===1&&pkTopSlot(k))pkFanHit(from); } if(to===o)delete G.pkOwn[y+':'+rd+':'+o]; else G.pkOwn[y+':'+rd+':'+o]=to; }
function pkMove(pk,tid){ pk=pkNorm(pk); pk.give.forEach(k=>pkSet(k,tid)); pk.get.forEach(k=>pkSet(k,G.user)); }
/* 구단 정보(30_card_common teamSheet)·트레이드 화면용 지명권 장부 요약: 받은 남의 지명권과 넘긴 자기 지명권(다음·그다음 드래프트) */
function pkSummary(tid){ const got=[], gone=[]; for(const y of pkYears())for(let rd=1;rd<=DRAFT_ROUNDS;rd++)for(const t of G.teams){ const own=pkOwner(y,rd,t.id); if(own===tid&&t.id!==tid)got.push(pkName(pkKey(rd,t.id,y))); else if(t.id===tid&&own!==tid)gone.push(`${pkName(pkKey(rd,tid,y))}(→${tshort(own)})`); }
  return got.length||gone.length?[got.length?'받음 '+got.join(', '):'',gone.length?'넘김 '+gone.join(', '):''].filter(Boolean).join(' · '):`${pkYears().join('·')} 자기 지명권 모두 보유`; }
/* 드래프트를 열 때: 지난 해 이전 기록은 지운다(미래 연도 기록은 남는다) */
function pkClean(){ if(!G.pkOwn)return; for(const k in G.pkOwn)if(+k.split(':')[0]<G.year)delete G.pkOwn[k]; }
/* 예전 저장(11-18): 보유 장부가 없으면 빈 장부(= 모든 지명권은 원래 구단 것)를 만들고, 깨진 줄·원래 구단으로 돌아온 줄을 지운다. 난수 없음, 여러 번 불러도 같다 */
function pkMigrate(){ if(!G)return; if(!G.pkOwn||typeof G.pkOwn!=='object'||Array.isArray(G.pkOwn))G.pkOwn={};
  for(const k of Object.keys(G.pkOwn)){ const a=k.split(':').map(Number), v=G.pkOwn[k]; if(a.length!==3||a.some(x=>!Number.isFinite(x))||!Number.isFinite(v)||!G.teams[v]||!G.teams[a[2]]||v===a[2])delete G.pkOwn[k]; } G.pkV=1; }
