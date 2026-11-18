/* ===== 팬 마케팅 · 구단 이벤트 (가벼운 버전, 유저 요청 11-07) =====
   실제 KBO 사례를 본떴다:
   - 응원단·치어리더: 모든 구단이 응원단장·치어리더를 둔다. 응원 문화가 관중을 부른다.
   - 구단 유튜브: 구단 채널이 팬을 모으고 광고 수입을 낸다.
   - 서포터즈: 시즌 회원·팬클럽 모집(시즌 단위).
   - 이벤트: 연예인 시구, 테마 데이(어린이날·밀리터리 데이), 팬 사인회, 캐릭터·브랜드 콜라보 유니폼, 창단 기념 레트로 유니폼.
   비용은 G.spend.fan(결산 '팬 마케팅·구단 이벤트'), 수입은 G.spend.fanIn(결산 '구단 이벤트·채널 수입')으로 잡는다.
   운영 단계·이벤트 기록은 그 구단 것이라 이직·사임하면 끝난다(leaveTeamState).
   다른 구단은 가벼운 판으로 쓴다: 응원단 단계와 서포터즈만, 같은 비용(99_ai_parity aiFanPlan, 사용자 11-13) */
const FAN_OPS={
  cheer:{l:'응원단·치어리더',lv:['기본 응원단','응원단 확대','응원단 대폭 확대'],m:[0,25,55],att:[0,.025,.05],fan:[0,.3,.6],d:'응원 문화가 관중을 부릅니다. 홈 관중이 늘고 팬 여론이 매달 조금 오릅니다.'},
  yt:{l:'구단 유튜브 채널',lv:['운영 안 함','채널 운영','전담 제작팀'],m:[0,15,40],d:'경기 뒤 이야기·선수 일상 영상으로 구독자를 모읍니다. 구독자가 늘면 광고 수입과 팬 여론이 오릅니다. 성적이 좋으면 빨리 늘어납니다.'}
};
const FAN_EV={
  pitch:{l:'연예인 시구',c:30,cd:20,d:'인기 연예인·스포츠 스타를 시구자로 초청합니다. 팬 관심이 오르고 기사가 납니다.'},
  theme:{l:'테마 데이',c:50,cd:30,d:'어린이날·밀리터리 데이·레트로 데이처럼 주제를 정해 홈경기를 꾸밉니다. 7일 동안 홈 관중이 늘어납니다.'},
  meet:{l:'팬 사인회·팬미팅',c:20,cd:20,d:'선수들이 팬을 만납니다. 팬 여론과 참가 선수 기분이 오릅니다.'},
  collab:{l:'콜라보 유니폼',c:300,yr:1,d:'캐릭터·브랜드와 함께 한정판 유니폼·굿즈를 냅니다. 인기가 높을수록 완판 가능성이 커지고, 실패하면 재고가 남습니다.'},
  retro:{l:'창단 기념 레트로 유니폼',c:150,yr:1,d:'옛 유니폼을 복각해 특정 경기에 입고 판매합니다. 오래된 팬들이 반깁니다.'},
  sup:{l:'서포터즈 모집',c:100,yr:1,d:'시즌 회원·서포터즈를 모집합니다. 시즌 동안 홈 관중과 팬 여론이 받쳐 줍니다.'}
};
function fanOps(){ if(!G.fanOps){ const T=G.fanYrT||{}, Y=T[G.user]||{}; if(Y.log){ G.fanOps=Y; delete T[G.user]; return Y; } /* 돌아온 구단: 단계·구독자·응원단·쿨다운·미청구 월 요금을 그대로 이어받는다(검수 11-09j) */ const t=team(G.user)||{}, A=!G.unemp&&t.fanOps||{}; /* AI가 운영하던 구단을 맡으면 그 구단 응원단 단계·서포터즈를 이어받는다: 팬 운영은 단장이 아니라 구단 것(검수 11-17 #296) */ G.fanOps={cheer:A.cheer||0,yt:0,sub:Math.round(30000*(t.pop||1)),last:{},yr:{...(Y.yr||{}),...(A.sup!=null?{sup:A.sup}:{})},boost:null,sup:Y.sup??A.sup??null,log:[],crew:Y.crew||{}}; if(!G.unemp&&t.fanOps)delete t.fanOps; } return G.fanOps; }
/* 구단 팬 운영 상태 하나로(검수 11-17 #296·#297): 맡은 구단은 G.fanOps, 떠난 구단은 남긴 상태(fanYrT), 한 번도 맡지 않은 구단은 AI 가벼운 판(t.fanOps) */
function fanOf(tid){ if(tid===G.user&&!G.unemp)return G.fanOps||fanOps(); const F=(G.fanYrT||{})[tid]; if(F&&F.log)return F; return (team(tid)||{}).fanOps||null; }
function fanCheerLv(tid){ const F=fanOf(tid); return (F&&F.cheer)||0; }
/* 팬 운영 기사: 떠난 구단 대리 처리(fanAway) 중에도 같은 기사 효과(여론)를 그 구단 여론에 준다. 기사는 리그 소식으로(검수 11-17 #298) */
function fanNews(t,b,tone,fanW){ if(!G._away)return news('구단',t,b,tone,{fanW}); if((G.wire||[]).some(w=>w.t===t&&G.day-w.d<30))return null; wire('구단',t,{tid:G.user}); prInit(); const om=outletMul(outletPick(t),tone); G.pr.press=clamp(G.pr.press+tone*1.7*om,0,100); G.pr.fan=clamp(G.pr.fan+tone*(fanW??1)*om,0,100); return null; }
/* 독립구단 행사 자금(검수 11-17 #295): 기념 유니폼(83_stars)과 같은 기준. 결산 때 낼 팬 마케팅·기타 지출을 뺀 현금 안에서만 */
function fanCashWhy(c){ const t=team(G.user); if(!t||!t.indie||!(c>0))return ''; const S=G.spend||{}, cash=Math.max(0,spendable(G.user)), free=cash-(S.fan||0)-Math.max(0,(S.etc||0)-(S.trC||0)); return free<c?`독립구단 행사 자금이 부족합니다. 비용 ${money(c)}, 지금 쓸 수 있는 돈 ${money(Math.max(0,free))}(보유 현금에서 결산 때 낼 팬 마케팅·기타 지출을 뺀 금액).`:''; }
/* 자동 운영이 도는 시즌: 정규시즌이 끝난 뒤(포스트시즌·결산 전 겨울) 켜면 다음 시즌(검수 11-17 #290) */
function fanPlanY(){ const p=period(); return p==='pre'||p==='season'?G.year:G.year+1; }
/* 서포터즈: 정규시즌이 끝났고 결산 전이면 올 시즌 회원은 효과가 없고, 다음 시즌 회원은 결산 뒤에 모집한다(검수 11-17 #291) */
function fanSupShut(){ const p=period(); return (p==='post'||p==='off')&&sponSeason()===G.year; }
/* 수입 줄: 기념 유니폼(83_stars goods)·콜라보·레트로 유니폼(merch)은 '구단 이벤트·채널 수입'이 아니라 상품 판매로 따로(검수 11-17 #294) */
function fanInRows(S){ S=S||{}; const fi=S.fanIn||0, gd=Math.min(fi,S.goods||0), mc=Math.min(fi-gd,S.merch||0); return [['구단 이벤트·채널 수입',fi-gd-mc],['기념 유니폼 판매',gd],['상품 판매',mc]].map(([l,v])=>[l,Math.round(v)]); } /* 시즌 1회 행사·서포터즈 기록은 구단에 남는다: 떠났다 돌아와도 같은 시즌에 다시 열 수 없다(검수 11-08) */
/* 홈 관중 배율(우리 구단 홈경기): 응원단·테마 데이·서포터즈 */
/* 떠난 구단(야인이면 전 구단) 팬 운영: 그 구단 상태로 잠깐 바꿔 같은 계산을 돌린다. book이면 지출·수입은 그 구단 현금·장부로, 팬 여론은 그 구단에 남긴 여론으로. 메일·기사·결정은 내지 않는다(검수 11-09zs) */
function fanAway(tid,fn,book){ const F=(G.fanYrT||{})[tid]; if(!F||!F.log||(tid===G.user&&!G.unemp))return null; const P=(G.clubT||{})[tid], pr0=fanAwayPr(tid,P), s=[G.user,G.unemp,G.fanOps,G.spend,G.pr,G._away];
  G.user=tid; G.unemp=null; G.fanOps=F; G.spend={}; G.pr=pr0; G._away=1;
  try{ return fn(); }catch(e){ return null; } finally{ const S=G.spend; [G.user,G.unemp,G.fanOps,G.spend,G.pr]=s; if(s[5])G._away=s[5]; else delete G._away; if(book&&((S.fan||0)!==0||(S.fanIn||0)!==0)){ team(tid).cash+=Math.round((S.fanIn||0)-(S.fan||0)); hoBook(tid,fanInRows(S),[['팬 마케팅·구단 이벤트',S.fan]]); /* 환불도 같은 signed 장부에 남긴다. */ } } }
/* 떠난 구단 여론: 야인 기간 전 구단은 G.pr, 이직한 구단은 남긴 여론. 없으면 처음 계산한 여론을 그 구단에 남긴다(검수 11-09zza: 매번 55에서 시작) */
function fanAwayPr(tid,P){ let p=tid===G.user?G.pr:P&&P.pr; if(p)return p; p={fan:55,press:50,hist:[]}; if(tid===G.user)G.pr=p; else (G.clubT=G.clubT||{})[tid]=Object.assign(P||{fy:sponSeason()},{pr:p}); return p; }
function fanAwayMonthly(){ for(const k of Object.keys(G.fanYrT||{}))fanAway(+k,fanMonthly,true); } /* 떠난 구단도 매달 유튜브 성장·응원단 청구, 1월엔 응원단장 나이·계약이 흐른다 */
function fanAttM(day,tid,a,gi){ if(tid!=null&&(tid!==G.user||G.unemp))return fanAway(tid,()=>fanAttM(day,undefined,a,gi))??aiFanAttM(day,tid); /* 우리가 운영한 적 없는 구단은 그 구단 응원단·서포터즈(99_ai_parity) */ /* 서포터즈·테마 데이는 그 구단에 남아 계속 효과(검수 11-09zs) */ if(G.unemp)return 1; const F=G.fanOps||fanOps(); /* 맡은 구단 상태가 아직 없으면 그 구단 것을 이어받아 만든다(검수 11-17 #296) */ const nx=typeof _stY!=='undefined'&&_stY!=null; /* 다음 시즌 전망: 지난 테마 데이는 빼고 그 시즌 서포터즈만(검수 11-08) */ return (1+FAN_OPS.cheer.att[F.cheer||0]+crewAtt()+cheerAtt(day))*(!nx&&F.boost&&day>=(F.boost.from??0)&&day<=F.boost.until?themeDayM(day,a,gi):1)*(F.sup===(nx?_stY:G.year)?1.03:1); }
/* 테마 데이(+8%)와 프로모션 데이(38_promotions)가 같은 날 겹치면 곱하지 않고 큰 쪽만: 두 배율의 곱이 max(1.08, 프로모션 배율)이 되게 테마 몫을 줄인다 */
function themeDayM(day,a,gi){ let m=1;try{if(a==null)a=RAIN_GI&&RAIN_GI.day===day&&RAIN_GI.h===G.user?RAIN_GI.a:promoHomeOpp(G.user,day);if(a!=null)m=promoAttM(G.user,a,day,gi);}catch(e){} return m>1?Math.max(1,1.08/m):1.08; }
function fanLog(t){ const F=fanOps(); F.log.unshift({d:G.day,t}); F.log.length=Math.min(F.log.length,12); }
function fanSet(k,lv){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; const O=FAN_OPS[k]; lv=+lv; if(!O||!(lv>=0&&lv<O.lv.length))return '고를 수 없는 단계입니다.'; const F=fanOps(); if(F[k]===lv)return `이미 ${O.lv[lv]}입니다.`;
  if(k==='cheer'&&lv>(F.cheer||0)){ const why=cheerFundsWhy(F.cs?.ag||'han',lv,F.cs,false); if(why)return why; }
  if(k==='yt')fanYtTally(F); /* 채널은 단계별로 운영한 날수만큼 청구·성장(검수 11-17 #299·#300) */ F.mx=F.mx||{}; F.mx[k]=Math.max(F.mx[k]||0,F[k]||0,lv); F[k]=lv; if(k==='cheer'&&F.cs)cheerFill(F.cs); /* 단원 수를 새 단계에 맞춘다 */ fanLog(`${O.l}: ${O.lv[lv]}`); return `${O.l}을(를) '${O.lv[lv]}'(으)로 바꿨습니다.${O.m[lv]?` 매달 ${money(O.m[lv])}이 듭니다${k==='yt'?'(운영한 날수만큼)':''}.`:k==='yt'?' 이달 운영한 날수만큼만 청구됩니다.':' 추가 비용은 없습니다.'}`; }
/* 유튜브 채널 단계별 운영 날수(ytD[단계])를 오늘까지 센다. 옛 저장은 이달 1일부터 지금 단계로 운영한 것으로 본다 */
function fanYtTally(F){ const d=G.day; if(F.ytT==null){ const o=dobj(d); F.ytT=dnum(o.y,o.m,1); F.ytD=[0,0,0]; } F.ytD=F.ytD||[0,0,0]; const n=d-F.ytT; if(n>0){ F.ytD[F.yt||0]+=n; F.ytT=d; } }
function fanEvLeft(k){ const E=FAN_EV[k], F=fanOps(); if(k==='sup'&&fanSupShut())return '올 시즌 정규시즌이 끝났습니다. 다음 시즌 서포터즈는 시즌 결산 뒤에 모집할 수 있습니다.'; /* 끝난 시즌에 청구하고 효과가 없던 문제(검수 11-17 #291) */
  const bk=(F.bk||[]).find(b=>b.k===k); if(bk)return `${dmd(bk.d)} 홈경기 ${E.l}을(를) 이미 잡아 두었습니다.`; /* 잡아 둔 행사가 열리기 전(우천 순연이면 새 날짜로 따라간다) */
  if(E.yr)return F.yr[k]===sponSeason()||(k!=='sup'&&F.yr[k]===G.year&&sponSeason()===G.year)?(k==='sup'?`${sponSeason()} 시즌 서포터즈는 이미 모집했습니다.`:`${sponSeason()} 시즌에는 이미 했습니다.`):''; /* 시즌 1회: 결산 시즌 기준(결산 뒤 11월과 1월에 두 번 안 되게, 검수 11-08) */ const l=F.last[k]; return l!=null&&G.day-l<E.cd?`${E.cd-(G.day-l)}일 뒤 다시 할 수 있습니다.`:''; }
function fanPlanSet(k,on){ const E=FAN_EV[k];if(G.unemp)return '지금은 구단 단장이 아닙니다.';if(!E?.cd)return '시즌 자동 운영 대상이 아닙니다.';const F=fanOps();F.plans=F.plans||{};const y=fanPlanY();if(on)F.plans[k]=y;else delete F.plans[k];const msg=on?`${y} 시즌 ${E.l} 자동 운영을 켰습니다. ${y>G.year?'다음 시즌 ':''}홈경기일에 최소 ${E.cd}일 간격으로 열고, 행사마다 ${money(E.c)}을 팬 마케팅 비용으로 청구합니다.${k==='theme'?' 테마 데이는 그날 경기를 포함해 7일 안에 홈경기가 2경기 이상일 때만 엽니다.':''} 시즌 종료 후 자동 운영이 끝납니다.`:`${E.l} 자동 운영을 중단했습니다. 이미 진행한 행사 비용과 효과는 유지됩니다.`;fanLog(msg);return msg; }
/* 경기 전 단계(playDay: 경기 반영에 성공한 홈경기에서, 응원단 무대와 함께 관중 계산(stadGame) 전에 부른다, 검수 11-17 #288).
   연기·원정·휴식일과 더블헤더 중복 청구를 피한다. 잡아 둔 행사(시구·레트로 유니폼)는 그 경기에서 열리고, 자동 운영 행사는 그날 관중부터 효과가 난다.
   테마 데이 자동 운영은 그날 경기를 포함해 7일 안에 홈경기가 2경기 이상일 때만(홈 연전 마지막 날 비용만 나가지 않게, 검수 11-17 #289) */
/* 팬 예약도 직관·프로모션과 같은 편성 키를 쓴다. 구형 예약은 유일한 대진·순번일 때만 보완한다. */
function fanBookingBind(b,h){ if(b.gk)return 0; const rows=[...gmGameRows(b.d).filter(x=>!x.overflow),...((G.cal?.rain||{})[b.d]||[])].filter(x=>x.h===h&&(b.a==null||x.a===b.a)), keys=new Map(); for(const x of rows)keys.set(x.a+':'+(x.ordinal||1),x); if(keys.size!==1)return keys.size>1?-1:0; const x=[...keys.values()][0]; if(x.sourcePairN>1)return -1; b.a=x.a;b.gk=gmGameKey(b.d,h,x.a,x.ordinal||1);return 1; }
function fanBookingDrop(b,why){ const F=G.fanOps;if(!F||(F.bk||[]).indexOf(b)<0)return false;F.bk=F.bk.filter(x=>x!==b);if(!F.bk.length)delete F.bk;G.spend.fan=(G.spend.fan||0)-(b.c||0);if(b.k==='retro'&&F.yr.retro===b.y)delete F.yr.retro;const E=FAN_EV[b.k]||{l:'행사'},msg=`${E.l}: ${dmd(b.d)} ${why} 비용 ${money(b.c||0)}을 돌려받았습니다.`;fanLog(msg);if(!G._away)mail('마케팅팀',`${E.l} 취소·환불`,msg+(b.k==='retro'?' 이번 시즌 안에 다른 홈경기로 다시 잡을 수 있습니다.':''),{kind:'구단'});return true; }
/* 옛 팬 환불의 0 절삭으로만 생긴 미결 장부 차액을 복원한다. 이미 현금에 들어온 환불은 다시 지급하지 않는다. */
function fanLedgerFix(){const fy=fyNow(),label='팬 마케팅·구단 이벤트';let n=0;for(const [k,H]of Object.entries(G.hoL||{})){if(+k.split(':')[0]!==fy||!H||!Number.isFinite(H.net)||!H.inc||!H.exp||!Object.prototype.hasOwnProperty.call(H.exp,label)||H.exp[label]!==0||![...Object.values(H.inc),...Object.values(H.exp)].every(Number.isFinite))continue;const gap=H.net-(sum(Object.values(H.inc))-sum(Object.values(H.exp)));if(gap>0){H.exp[label]=-gap;n++;}}return n;}
function fanBookingFix(){let n=fanLedgerFix();const run=()=>{for(const b of [...(G.fanOps?.bk||[])]){const x=fanBookingBind(b,G.user);if(x>0)n++;else if(x<0&&fanBookingDrop(b,'예약한 경기 순번을 확인할 수 없어 행사를 취소하고'))n++;}};if(G.fanOps&&!G.unemp)run();for(const tid of Object.keys(G.fanYrT||{}))if(+tid!==G.user||G.unemp)fanAway(+tid,run,true);return n;}
function fanBookingRebase(to,h,a,ordinal){const F=h===G.user&&!G.unemp?G.fanOps:G.fanYrT?.[h];for(const b of F?.bk||[])if(b.gk?.d===to&&b.gk.h===h&&b.gk.a===a&&b.gk.i>=ordinal)b.gk={...b.gk,i:b.gk.i+1};}
function fanBookingMove(h,from,to,meta={}){let n=0;const run=()=>{for(const b of [...(G.fanOps?.bk||[])]){if(b.d!==from||b.a!=null&&b.a!==meta.a)continue;if(!b.gk){if(meta.sourcePairN>1){if(fanBookingDrop(b,'예약한 더블헤더 경기 순번을 확인할 수 없어 행사를 취소하고'))n++;continue;}if(b.a==null)continue;b.gk=gmGameKey(from,h,b.a,meta.ordinal||1);}if(!gmGameMatches(b,from,h,meta.a,meta.ordinal||1)||!(to>from))continue;b.d=to;b.a=meta.a;b.gk=gmGameKey(to,h,meta.a,meta.targetOrdinal||1);b.mv=from;fanLog(`${FAN_EV[b.k].l}: ${meta.reason||'우천 취소'}로 ${dmd(to)} 경기로 옮겼습니다.`);n++;}};if(h===G.user&&!G.unemp)run();else fanAway(h,run,true);return n;}
/* 자동 행사 자격은 실제 진행과 예산 전망이 함께 사용한다. 조회는 계획·쿨다운·난수를 바꾸지 않는다. */
function fanHomeGames(tid,from,to){const L=[];for(let d=from;d<=to;d++)for(const m of gmGameRows(d))if(!m.overflow&&m.h===tid)L.push({d,...m});return L;}
function fanPlanReady(F,k,d,tid){const E=FAN_EV[k];if(!E?.cd||F.plans?.[k]!==G.year||(F.bk||[]).some(b=>b.k===k)||F.last?.[k]!=null&&d-F.last[k]<E.cd)return false;if(k==='theme'&&fanHomeGames(tid,d,d+7).length<2)return false;if(k==='meet'&&!playersOf(tid).some(p=>!p.foreign&&healthy(p)&&!isAway(p)&&!ovsAbroad(p)&&!(p.joinY>G.year)))return false;return true;}
function fanPlanCost(){const F=G.fanOps,c=G.cal;if(G.unemp||!F?.plans||!Object.keys(F.plans).some(k=>F.plans[k]===G.year&&FAN_EV[k]?.cd)||!c||sponSeason()!==G.year)return 0;const V={plans:F.plans,last:{...(F.last||{})},bk:(F.bk||[]).map(b=>({...b}))},t=team(G.user);let cost=0,free=t.indie?Math.max(0,spendable(G.user))-(G.spend?.fan||0)-Math.max(0,(G.spend?.etc||0)-(G.spend?.trC||0)):Infinity;for(const m of fanHomeGames(G.user,Math.max(G.day+1,c.open),c.end)){for(const b of [...V.bk])if(b.d===m.d&&gmGameMatches(b,m.d,m.h,m.a,m.ordinal)){V.bk=V.bk.filter(x=>x!==b);if(FAN_EV[b.k]?.cd)V.last[b.k]=m.d;}for(const k of Object.keys(V.plans)){if(!fanPlanReady(V,k,m.d,G.user)||free<FAN_EV[k].c)continue;V.last[k]=m.d;cost+=FAN_EV[k].c;free-=FAN_EV[k].c;}}return cost;}
function fanPlansGame(tid,day,a){ const run=()=>{ const F=G.fanOps; if(G.unemp||!F||!G.cal)return; const d=day??G.day;
    for(const b of [...(F.bk||[])])if(b.d===d&&gmGameMatches(b,d,G.user,a,RAIN_GI&&RAIN_GI.day===d&&RAIN_GI.h===G.user&&RAIN_GI.a===a?RAIN_GI.i:1))fanHold(b);
    if(!F.plans||G.day<G.cal.open||G.day>G.cal.end||period()!=='season')return;
    for(const k of Object.keys(F.plans)){ if(!fanPlanReady(F,k,d,G.user))continue; if(fanCashWhy(FAN_EV[k].c))continue; fanEvent(k,true); } };
  if(tid===G.user&&!G.unemp)run(); else fanAway(tid,run,true); }
/* 잡아 둔 행사가 그 경기에서 열린다. 비용은 잡을 때 냈다 */
function fanHold(b){ const F=G.fanOps; F.bk=(F.bk||[]).filter(x=>x!==b); if(!F.bk.length)delete F.bk; const t=team(G.user), pop=clamp(t.pop,.4,1.6); prInit(); let msg='';
  if(b.k==='pitch'){ F.last.pitch=G.day; msg=fanPitchFx(pop); }
  if(b.k==='retro'){ const inc=Math.round(rnd(200,480)*pop*ecoIdx()); G.spend.fanIn=(G.spend.fanIn||0)+inc; G.spend.merch=(G.spend.merch||0)+inc; G.pr.fan=clamp(G.pr.fan+2,0,100); fanNews(`${tshort(G.user)}, 창단 기념 레트로 유니폼 입고 홈경기`,`선수단이 옛 유니폼을 복각한 기념 유니폼을 입고 ${b.a!=null?tshort(b.a)+'전에 ':''}나섰습니다. 구장 매장의 복각 유니폼도 오랜 팬들에게 인기였습니다.`,1,1); msg=`레트로 유니폼 경기를 치렀습니다. 상품 판매 ${money(inc)}, 팬 여론 조금 호전.`; }
  fanLog(`${FAN_EV[b.k].l}: ${msg}`); return msg; }
function fanPitchFx(pop){ const up=R()<.25*pop?3:R()<.6?2:1; G.pr.fan=clamp(G.pr.fan+up,0,100); fanNews(`${tshort(G.user)} 홈경기 시구, 화제의 스타 등장`,`초청 스타의 시구 영상이 온라인에서 화제가 됐습니다.`,1,1); return `시구 행사를 열었습니다. 팬 여론 호전.`; }
/* 매일(그날 경기를 다 치른 뒤): 잡아 둔 날 경기가 열리지 않았으면 우천 순연 새 날짜로 따라가고, 새 날짜가 없으면 비용을 돌려준다(프로모션 데이와 같은 규칙, 검수 11-17 #292) */
function fanBkDaily(){ const F=G.fanOps;if(G.unemp||!F?.bk?.length)return;for(const b of [...F.bk]){const bound=fanBookingBind(b,G.user);if(bound<0){fanBookingDrop(b,'예약한 경기 순번을 확인할 수 없어 행사를 취소하고');continue;}if(b.d>G.day)continue;const r=((G.cal?.rain||{})[b.d]||[]).find(x=>x.h===G.user&&gmGameMatches(b,b.d,x.h,x.a,x.ordinal||1)&&x.to>b.d);if(r){fanBookingMove(G.user,b.d,r.to,r);continue;}const retry=(G.makeup||[]).find(x=>x.y===G.year&&x.h===G.user&&x.a===b.a&&(b.retryId!=null?x.rid===b.retryId:b.gk&&(x.sourceDay??x.d)===b.gk.d&&(x.sourceOrdinal!=null?x.sourceOrdinal===b.gk.i:b.gk.i===1&&gmGameRows(x.d).filter(m=>m.h===x.h&&m.a===x.a).length===1)));if(retry){const to=G.day+1,row=gmGameRows(to).find(x=>x.retry===retry);if(row){b.d=to;b.gk=gmGameKey(to,G.user,retry.a,row.ordinal);if(retry.rid!=null)b.retryId=retry.rid;continue;}}fanBookingDrop(b,'경기가 열리지 않아 행사를 취소하고');} }
/* 홈경기 고르기(레트로 유니폼): 오늘 뒤 이번 시즌 남은 우리 홈경기 날 */
function fanGameDays(){ if(G.unemp||!G.cal)return []; const p=period(); if(p!=='pre'&&p!=='season')return []; return [...new Map(homeGames(G.user,G.day+1,G.cal.end).map(([d,a])=>[d,[d,a]])).values()]; }
function fanEvent(k,scheduled,day){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; const E=FAN_EV[k]; if(!E)return '없는 이벤트입니다.'; const left=fanEvLeft(k); if(left)return `${E.l}: ${left}`;
  const per=period(); if(['pitch','theme','meet'].includes(k)&&per!=='season')return `${E.l}은(는) 정규시즌 홈경기 기간에만 열 수 있습니다.`;
  if(k==='pitch'&&!scheduled&&!homeGames(G.user,G.day+1,G.day+1).length)return `${E.l}: 내일 우리 홈경기가 없습니다. 홈경기 전날 준비하거나 시즌 자동 운영을 켜세요.`;
  if(k==='theme'&&!scheduled&&!homeGames(G.user,G.day+1,G.day+7).length)return `${E.l}: 앞으로 7일 동안 우리 홈경기가 없습니다. 홈경기 주간에 열거나 시즌 자동 운영을 켜세요.`;
  let rg=null; if(k==='retro'){ day=+day; rg=fanGameDays().find(([d])=>d===day); if(!rg)return `${E.l}: 입고 나설 홈경기를 고르세요(이번 시즌 남은 우리 홈경기${per==='off'||per==='post'?', 다음 시즌 일정이 나온 뒤':''}).`; } /* 특정 경기에 입고 그날 판매한다(검수 11-17 #293) */
  const guests=k==='meet'?playersOf(G.user).filter(p=>!p.foreign&&healthy(p)&&!isAway(p)&&!ovsAbroad(p)&&!(p.joinY>G.year)):null;
  if(guests&&!guests.length)return '팬 사인회에 참가할 수 있는 선수가 없습니다(부상·파견·복무·합류 전 제외).';
  { const why=fanCashWhy(E.c); if(why)return `${E.l}: ${why}`; }
  const F=fanOps(), t=team(G.user); prInit(); G.spend.fan=(G.spend.fan||0)+E.c; const pop=clamp(t.pop,.4,1.6); let msg='';
  if(k==='pitch'&&!scheduled){ const [d,a]=homeGames(G.user,G.day+1,G.day+1)[0]; (F.bk=F.bk||[]).push({k,d,a,c:E.c,gk:gmGameKey(d,G.user,a,gmGamePick(d,G.user,true,a)?.ordinal||1)}); msg=`${dmd(d)} ${tshort(a)}전 홈경기 시구 행사를 잡았습니다(비용 ${money(E.c)}). 그 경기가 열릴 때 효과가 나고, 우천 취소되면 새 날짜로 따라가며 새 날짜가 없으면 비용을 돌려받습니다.`; fanLog(`${E.l}: ${msg}`); return msg; } /* 우천 취소 경기의 시구가 열린 것으로 잡히지 않게(검수 11-17 #292) */
  if(k==='retro'){ F.yr[k]=sponSeason(); (F.bk=F.bk||[]).push({k,d:rg[0],a:rg[1],c:E.c,y:F.yr[k],gk:gmGameKey(rg[0],G.user,rg[1],gmGamePick(rg[0],G.user,true,rg[1])?.ordinal||1)}); msg=`${dmd(rg[0])} ${tshort(rg[1])}전에 창단 기념 레트로 유니폼을 입기로 했습니다(제작비 ${money(E.c)}). 그날 경기에서 입고 구장 매장에서 팝니다. 우천 취소되면 새 날짜로 따라가고, 새 날짜가 없으면 비용을 돌려받습니다.`; fanLog(`${E.l}: ${msg}`); return msg; }
  if(E.yr)F.yr[k]=sponSeason(); else F.last[k]=G.day;
  if(k==='pitch')msg=fanPitchFx(pop);
  if(k==='theme'){ F.boost={from:G.day,until:G.day+7}; G.pr.fan=clamp(G.pr.fan+1,0,100); msg=`테마 데이를 열었습니다. ${dmd(G.day+7)}까지 홈 관중이 늘어납니다. 팬 여론 조금 호전.`; }
  if(k==='meet'){ G.pr.fan=clamp(G.pr.fan+2,0,100); const L=guests.sort(()=>R()-.5).slice(0,3); L.forEach(p=>{ p.mor=clamp((p.mor??60)+2,0,100); }); msg=`팬 사인회를 열었습니다(${L.map(p=>p.name).join(', ')} 참가). 팬 여론 조금 호전, 참가 선수 기분 상승.`; }
  if(k==='collab'){ const ok=R()<clamp(.3+.3*(pop-.8)+(G.pr.fan-55)/200,.15,.8); const inc=Math.round((ok?rnd(600,1200):rnd(100,220))*ecoIdx()); G.spend.fanIn=(G.spend.fanIn||0)+inc; G.spend.merch=(G.spend.merch||0)+inc; /* 결산 '상품 판매'(검수 11-17 #294) */ if(ok)G.pr.fan=clamp(G.pr.fan+3,0,100);
    fanNews(ok?`${tshort(G.user)} 콜라보 유니폼 하루 만에 완판`:`${tshort(G.user)} 콜라보 굿즈, 반응 미지근`,ok?'한정판 유니폼과 굿즈가 출시 첫날 다 팔렸습니다. 추가 생산 요청이 이어집니다.':'출시 초반 관심에 비해 판매가 더딥니다. 재고가 남았습니다.',ok?2:0,1); msg=ok?`완판입니다. 상품 판매 ${money(inc)}, 팬 여론 호전.`:`판매가 부진했습니다. 상품 판매 ${money(inc)}(비용 ${money(E.c)}).`; }
  if(k==='sup'){ const y=sponSeason(); F.sup=y; G.pr.fan=clamp(G.pr.fan+2,0,100); msg=`${y} 서포터즈를 모집했습니다. ${y===G.year?'올':y+'년'} 시즌 홈 관중이 늘고 팬 여론 조금 호전.`; } /* 결산 뒤 모집은 다음 시즌 회원(검수 11-08) */
  fanLog(`${E.l}: ${msg}`); return msg; }
/* 이달 이미 쓴 더 높은 단계 몫(다음 달 1일 청구 예정): 단계를 내려도 예산에서 빠지지 않게(검수 11-09j). 채널은 단계별 운영 날수로, 응원단장·팀장은 떠난 사람의 이달 근무 몫(검수 11-17) */
function fanPeakExtra(){ const F=G.fanOps; if(!F||G.unemp)return 0; const mx=F.mx||{}; const ytX=F.ytT!=null&&F.ytD?Math.max(0,sum(F.ytD.map((n,i)=>(FAN_OPS.yt.m[i]-FAN_OPS.yt.m[F.yt||0])*n))/30.4):0; return FAN_OPS.cheer.m[Math.max(F.cheer||0,mx.cheer||0)]-FAN_OPS.cheer.m[F.cheer||0]+ytX+(F.cpAcc||0)+(F.cs?Math.max(0,(F.cs.payPeak||0)-cheerPay()):0); }
function fanMonthCost(){ const F=G.fanOps; return F&&!G.unemp?FAN_OPS.cheer.m[F.cheer||0]+FAN_OPS.yt.m[F.yt||0]+crewPay()+cheerPay():0; }
/* 매달 1일: 운영비, 유튜브 구독자·광고 수입, 응원단 효과 */
function fanMonthly(){ if(G.unemp||!G.fanOps)return; const F=G.fanOps, t=team(G.user); prInit();
  /* 채널: 지난달 단계별 운영 날수만큼 비용·구독자·광고 수입(검수 11-17 #299·#300: 월초 단계로 한 달 치를 매기지 않는다). 날수 기록이 없는 옛 저장은 지난달 내내 가장 높았던 단계로 */
  const mx=F.mx||{}; if(F.ytT==null){ const o=dobj(G.day-1); F.ytT=dnum(o.y,o.m,1); F.ytD=[0,0,0]; F.ytD[Math.max(F.yt||0,mx.yt||0)]+=G.day-F.ytT; F.ytT=G.day; } else fanYtTally(F);
  const D=F.ytD, L=Math.max(1,sum(D)), ytLv=sum(D.map((n,i)=>i*n))/L, ytOn=(L-D[0])/L; F.ytD=[0,0,0];
  const cost=FAN_OPS.cheer.m[Math.max(F.cheer||0,mx.cheer||0)]+Math.round(sum(D.map((n,i)=>FAN_OPS.yt.m[i]*n))/L); F.mx={}; /* 응원단은 지난 한 달 중 가장 높았던 단계로 청구: 월초에 잠깐 꺼서 비용을 피하지 못하게(검수 11-08) */ if(cost)G.spend.fan=(G.spend.fan||0)+cost;
  if(F.cheer)G.pr.fan=clamp(G.pr.fan+FAN_OPS.cheer.fan[F.cheer],0,100);
  try{ crewMonthly(); }catch(e){}
  try{ cheerMonthly(); }catch(e){} /* 치어리더 단원(56b) */
  if(ytLv>0){ const r=G.sea&&G.sea.rec&&G.sea.rec[G.user], wp=r&&r.w+r.l>=10?r.w/(r.w+r.l):.5, on=period()==='season'||period()==='post'; const base=F.yt?(on?rnd(3000,7000):rnd(800,2000)):(on?5000:1400); /* 지금 꺼져 있으면 난수 없이 가운데 값(난수 소비는 예전과 같게) */ const add=Math.round(ytLv*clamp(t.pop,.4,1.6)*base*(wp>=.55?1.4:wp<.45?.7:1)); F.sub=(F.sub||0)+add;
    const ad=Math.round(F.sub/10000*1.6*ytOn); if(ad>0)G.spend.fanIn=(G.spend.fanIn||0)+ad; if(F.sub>=100000)G.pr.fan=clamp(G.pr.fan+.3*ytLv,0,100); } }

/* ===== 응원단장·치어리더 팀장(커뮤니티 제안 11-08): 스태프처럼 인물을 영입한다 =====
   능력치(1~20, 에펨처럼): 호응 유도(홈 관중), 영향력(팬 여론), 구단 충성도(재계약·이적 제의 버티기), 스타성(화제성·상품 수입·관중 조금).
   월급은 매달 1일 팬 마케팅 비용으로. 계약이 끝나는 해 1월에 충성도에 따라 재계약하거나 떠난다. 사진은 갤러리에서 바꿀 수 있다(G.cimg).
   shortcut: AI 구단은 응원단장을 두지 않는다(리그 경쟁이 필요해지면 붙인다) */
const CREW_JOB={lead:{l:'응원단장',b:6},cap:{l:'치어리더 팀장',b:4}};
const CREW_AT=[['hype','호응 유도'],['infl','영향력'],['loy','구단 충성도'],['star','스타성']];
function crewOf(){ const F=fanOps(); return F.crew=F.crew||{}; }
function crewSal(c){ const s=c.hype+c.infl+c.star+c.loy*.5; return Math.max(2,Math.round(CREW_JOB[c.job].b*(.45+s/70))); } /* 월급(100만 원 단위) */
function crewMk(job){ const g=()=>clamp(Math.round(N(10.5,3.6)),3,20); const c={id:(G.crewNid=(G.crewNid||0)+1),job,name:job==='cap'?surAt(R())+pick(CHEER_FN):genName(), /* 치어리더 팀장은 여성 이름(사진도 여성, 11-09c) */age:ri(23,39),hype:g(),infl:g(),loy:g(),star:g()}; if(R()<.15){ const k=pick(['hype','infl','star']); c[k]=clamp(c[k]+ri(4,7),3,20); } c.sal=crewSal(c); return c; }
function crewMkt(){ const M=G.crewMkt; if(M&&M.L&&M.L.length&&G.day-M.d<75)return M.L; const L=[]; for(const j of Object.keys(CREW_JOB))for(let i=0;i<3;i++)L.push(crewMk(j)); G.crewMkt={d:G.day,L}; return L; }
function crewHire(id,yrs){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; yrs=clamp(Math.round(+yrs||2),1,3); const L=crewMkt(); const c=L.find(x=>x.id===+id); if(!c)return '후보가 없습니다.'; const C=crewOf(); const old=C[c.job]; G.crewMkt.L=L.filter(x=>x.id!==c.id); const fire=old?crewFire(c.job):''; /* 바로 교체해도 전임 해지 정산금은 낸다(검수 11-09j). 전임은 해고와 같이 시장으로(crewFire) */
  C[c.job]={...c,y1:sponSeason()+yrs-1,d0:G.day};
  fanLog(`${CREW_JOB[c.job].l} ${c.name} 영입(${yrs}년, 월 ${money(c.sal)})`); return `${CREW_JOB[c.job].l}으로 ${c.name}을(를) 영입했습니다. ${yrs}년 계약, 월 ${money(c.sal)}.${old?` ${fire} 전임은 시장으로 나갔습니다.`:''}`; }
function crewSettle(c){ const mo=clamp((dnum(c.y1+1,1,1)-G.day)/30.4,0,12); return Math.round(c.sal*mo*.3); } /* 남은 달 수만큼(계약은 마지막 해 12월 말까지, 1월에 재계약 판단). 만료가 가까우면 줄어든다(검수 11-09zza) */
function crewFire(job){ const C=crewOf(); const c=C[job]; if(!c)return '그 자리는 비어 있습니다.'; const pay=crewSettle(c); G.spend.fan=(G.spend.fan||0)+pay; { const F=fanOps(); F.cpAcc=(F.cpAcc||0)+crewWorked(c); } /* 이달 일한 날수만큼 월급은 다음 달 1일에(검수 11-17 #301) */ delete C[job]; crewMkt().push({...c,sal:crewSal(c)}); /* 해고해도 즉시 교체처럼 시장으로(검수 11-09zza) */ fanLog(`${CREW_JOB[job].l} ${c.name} 계약 해지(정산 ${money(pay)})`); return `${c.name}과(와) 계약을 해지했습니다. 남은 기간 정산금 ${money(pay)}.`; } /* 남은 계약의 30%(최대 1년 치 기준) */
function crewPay(){ if(G.unemp||!G.fanOps)return 0; return sum(Object.values(G.fanOps.crew||{}).map(c=>c.sal)); }
function crewAtt(){ if(G.unemp||!G.fanOps)return 0; return sum(Object.values(G.fanOps.crew||{}).map(c=>(c.hype-10)*.003+(c.star-10)*.001)); } /* 응원단장 20/20이면 홈 관중 +4% 안팎 */
/* 월급은 일한 날수만큼(검수 11-17 #301): 지난달 중간에 영입하면 영입일부터, 해지하면 해지일 전날까지(해지한 사람 몫은 F.cpAcc에 쌓아 두었다가 1일에 함께) */
function crewWorked(c){ const o=dobj(G.day), S=dnum(o.y,o.m,1), E=dnum(o.y,o.m+1,1); return Math.round(c.sal*Math.max(0,G.day-Math.max(S,c.d0??S))/(E-S)*10)/10; }
function crewMonthPay(){ const C=crewOf(), F=fanOps(), o=dobj(G.day-1), S=dnum(o.y,o.m,1), n=Math.max(1,G.day-S); return Math.round((sum(Object.values(C).map(c=>c.sal*Math.max(0,G.day-Math.max(S,c.d0??S))/n))+(F.cpAcc||0))*10)/10; }
function crewMonthly(){ const C=crewOf(), t=team(G.user), F=fanOps(); const L=Object.values(C); const pay=crewMonthPay(); F.cpAcc=0; if(pay>0)G.spend.fan=(G.spend.fan||0)+pay; if(!L.length)return;
  for(const c of L){ G.pr.fan=clamp(G.pr.fan+(c.infl-10)*.04,0,100); t.pop=clamp(t.pop+(c.star-11)*.0004,.4,1.6); const g=Math.max(0,Math.round((c.star-8)*.6)); if(g)G.spend.fanIn=(G.spend.fanIn||0)+g; }
  try{ crewSongAsk(); }catch(e){}
  if(dobj(G.day).m!==1)return; const y=sponSeason();
  for(const j of Object.keys(C)){ const c=C[j]; c.age++; const end=c.y1<y; const poach=!end&&c.star>=15&&c.loy<=8&&R()<.25;
    if(end){ if(R()<.35+c.loy*.03){ const n=ri(1,2); c.y1=y+n-1; c.sal=Math.round(c.sal*1.06); mail('마케팅팀',`${CREW_JOB[j].l} ${c.name} 재계약`,`${c.name}이(가) ${n}년 더 남기로 했습니다. 월급은 ${money(c.sal)}입니다.`,{kind:'구단'}); } else { delete C[j]; mail('마케팅팀',`${CREW_JOB[j].l} ${c.name} 계약 만료`,`${c.name}이(가) 재계약하지 않고 떠났습니다. 팬 마케팅에서 새 ${CREW_JOB[j].l}을(를) 영입할 수 있습니다.`,{kind:'구단',imp:true,acts:[{l:'팬 마케팅',a:'go',v:'club:ops'}]}); } }
    else if(poach){ const buy=crewSettle(c); G.spend.fanIn=(G.spend.fanIn||0)+buy; /* 영입 구단이 내는 위약금(해지 정산금과 같은 기준, 검수 11-09j) */ delete C[j]; mail('마케팅팀',`${CREW_JOB[j].l} ${c.name}, 다른 구단으로`,`스타성이 높은 ${c.name}에게 다른 구단이 더 좋은 조건을 냈고, 구단 애착이 약해 옮겼습니다. 위약금 ${money(buy)}은 그 구단이 냈고 구단 이벤트 수입으로 잡힙니다.`,{kind:'구단',imp:true}); } } }

/* 선수 응원가(사용자 11-08): 응원단장이 있으면 시즌 중 매달 한 번쯤 응원가가 없는 주축 선수의 응원가를 만들자고 한다.
   만들면 비용이 들고, 응원단장 호응 유도·스타성이 높을수록 잘 만들어져 팬 여론·선수 기분·화제성이 오른다. 이적하면 응원가는 그 구단에 남는다 */
function crewSongAsk(){ const c=crewOf().lead; if(!c||G.unemp||G._away)return; const m=dobj(G.day).m; if(m<4||m>9||R()>.55)return; if((G.evs||[]).some(e=>!e.done&&e.k==='song'))return;
  const L=playersOf(G.user).filter(p=>p.e1&&!(p.songs&&p.songs[G.user])&&!p.ys).sort((a,b)=>(b.fr&&b.fr.tid===G.user)-(a.fr&&a.fr.tid===G.user)||ovr(b)-ovr(a)); const p=L[0]; if(!p)return;
  const cost=Math.round(8+c.star*.6), q=Math.round(clamp((c.hype+c.star)/2+N(0,2.5),3,20));
  evNew('song',`${p.name} 응원가 만들까요?`,`응원단장 ${c.name}: "${p.name} 선수 응원가가 아직 없습니다. ${p.fr&&p.fr.tid===G.user?'프랜차이즈 스타에게 어울리는 노래를 붙이고 싶습니다.':'팬들이 따라 부를 수 있는 노래를 만들어 보겠습니다.'}" (호응 유도 ${c.hype} · 스타성 ${c.star})`,
    [{l:'만든다',fx:`제작비 ${money(cost)}(팬 마케팅 비용). 응원단장 능력만큼 반응이 갈립니다. 선수 기분이 오르고 팬 여론·화제성이 오를 수 있습니다.`},{l:'다음에',fx:'만들지 않습니다.'}],{ref:p.id,face:p.id,from:'마케팅팀',data:{pid:p.id,cost,q,cid:c.id,by:c.name},def:1,exp:10}); }
EVH.song={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||p.team!==G.user)return '이제 우리 선수가 아닙니다.'; if(i!==0)return '다음에 만들기로 했습니다.'; const {cost,q}=e.data; const c=crewOf().lead, by=e.data.by??(c?c.name:''); /* 제안한 단장이 만든다: 수락 전에 바뀌어도(검수 11-09j) */
  G.spend.fan=(G.spend.fan||0)+cost; (p.songs=p.songs||{})[G.user]={y:G.year,q,by}; const F=fanOps(); F.songs=(F.songs||0)+1;
  p.mor=clamp((p.mor??60)+3+Math.round(q/5),0,100); const hit=q>=15, flop=q<=7; G.pr.fan=clamp(G.pr.fan+(hit?2:flop?0:1),0,100); if(hit)team(G.user).pop=clamp(team(G.user).pop+.004,.4,1.6);
  story(p,`${tshort(G.user)} 응원가 생김${hit?' · 화제':''}`,'mile');
  if(hit)news('구단',`${p.name} 새 응원가, 구장 떼창에 SNS 화제`,`응원단장 ${by}이(가) 만든 ${p.name} 응원가가 첫날부터 관중석 떼창을 불렀습니다. 영상 조회수가 빠르게 오르고 있습니다.`,2,{ref:p.id});
  else if(flop)news('구단',`${p.name} 새 응원가, 팬 반응은 "글쎄"`,`가사가 입에 붙지 않는다는 반응이 많습니다. 몇 경기 더 불러 봐야 알 것 같다는 의견도 있습니다.`,0,{ref:p.id});
  return `${p.name} 응원가를 만들었습니다(완성도 ${q}/20${hit?' · 화제':flop?' · 반응 미지근':''}). 선수 기분이 올랐습니다.`; } };

/* 불러오기 수리(검수 11-17, 여러 번 불러도 같은 결과):
   #296 맡은 구단에 AI 시절 응원단 단계·서포터즈(t.fanOps)가 남아 있으면 우리 팬 운영으로 옮긴다(직접 고른 응원단 단계는 그대로).
   #302 옛 단원 사진 키 'P:cheerm:번호'는 해당 번호가 한 구단에만 있을 때 구단별 키로 옮긴다. 소속 모호·기존 사진 충돌이면 원본을 보존한다 */
function fanOpsFix(){ if(!G||!G.teams)return 0; let n=0;
  if(!G.unemp&&G.fanOps){ const t=team(G.user), A=t&&t.fanOps; if(A){ const F=G.fanOps; if(!(F.cheer>0)&&!(F.mx&&F.mx.cheer>0)&&!(F.log||[]).some(x=>String(x.t).startsWith(FAN_OPS.cheer.l+':'))&&A.cheer>0)F.cheer=A.cheer; if(F.sup==null&&A.sup!=null){ F.sup=A.sup; F.yr=F.yr||{}; if(F.yr.sup==null)F.yr.sup=A.sup; } delete t.fanOps; n++; } }
  const C=G.cimg; if(C){ const own=[]; if(!G.unemp&&G.fanOps&&G.fanOps.cs)own.push([G.user,G.fanOps.cs]); for(const [k,F] of Object.entries(G.fanYrT||{}))if(F&&F.cs)own.push([+k,F.cs]);
    for(const k of Object.keys(C)){ const m=/^P:cheerm:(\d+)$/.exec(k); if(!m)continue; const id=+m[1], matches=own.filter(([,S])=>(S.L||[]).some(x=>x.id===id)), tids=new Set(matches.map(x=>x[0])); if(tids.size!==1)continue; /* 구단을 모르면 사진과 자르기 원본을 그대로 보존한다. */ const o=matches[0], nk='P:cheerm:'+o[0]+':'+id; if(C[nk]!=null&&C[nk]!==C[k]||G.cimgO?.[nk]!=null&&G.cimgO?.[k]!=null&&G.cimgO[nk]!==G.cimgO[k])continue; if(C[nk]==null)C[nk]=C[k]; delete C[k]; if(G.cimgO&&G.cimgO[k]!=null){ if(G.cimgO[nk]==null)G.cimgO[nk]=G.cimgO[k]; delete G.cimgO[k]; } n++; } }
  if(typeof fanBookingFix==='function')n+=fanBookingFix()||0;
  return n; }
