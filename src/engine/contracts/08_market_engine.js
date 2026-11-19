/* ===== 시장 엔진(사용자 11-13: 가격은 표가 아니라 시장이 만든다) =====
   1) 필요 가치: 선수가 오면 그 구단 주전이 얼마나 좋아지는가(추가 승수). 자리가 빈 구단에는 크고, 더 나은 주전이 있는 구단에는 작다.
   2) 지불 의사: 추가 승수 × 그 구단이 1승에 매기는 값(전략·구단주·남은 연봉 여유·나이).
   3) 가격: 구단들의 지불 의사가 경쟁해서 정해진다. 선수 요구액도 '두 번째로 높은 지불 의사' 근처에서 시작한다.
      S급은 여러 구단이 원해 비싸지고, 어중간한 급은 대체재가 많아(추가 승수가 작아) 싸진다. 따로 공식으로 넣지 않는다.
   FA 입찰(faWorth)·FA 요구액(faAsk)이 이 값을 쓴다. 트레이드·다년계약은 다음 단계에서 잇는다. */
const MKT={hit:.22,sp:.24,rp:.09,repl:47,win:550,depth:.18}; /* 능력 1점당 승수(야수·선발·불펜), 대체 선수 수준, 1승의 기준값(백만원, 물가 곱), 주전을 못 밀어내도 남는 뎁스 가치 비율 */
let _mkD={k:null,m:{}};
/* 캐시 열쇠: 날짜만으로는 같은 날 이적·트레이드·FA 계약 뒤에도 옛 값이 남는다 */
function mktKey(){ return G.year+':'+G.day+':'+(G.mvN||0)+':'+(G.trades||[]).length+':'+((G.fa&&G.fa.pool&&G.fa.pool.filter(i=>G.players[i]&&G.players[i].team==null).length)||0); }
function mktDepth(tid){ const k=mktKey(); if(_mkD.k!==k||_mkD.g!==G)_mkD={k,g:G,m:{}}; return _mkD.m[tid]||(_mkD.m[tid]=depth(tid)); }
/* 선수의 시장 능력: 최근 성적과 능력을 섞고(성적 60%) 포지션 가치를 더한다(faWorth 기존 기준과 같다) */
function mktBase(p){ const pf=perfOvr(p,3); return (pf==null?ovr(p):pf*.6+ovr(p)*.4); }
/* 추가 승수: 그 구단 지금 주전(같은 자리)과 견준다. 야수는 자기 자리와 지명타자 중 큰 쪽, 선발은 5선발, 불펜은 필승조 4명 중 가장 약한 선수와 견준다 */
function mktWins(t,p){ const d=mktDepth(t.id); const adj=mktBase(p)-ovr(p); let gain=0, own=0;
  if(p.isP){ const sp=isSPr(p); if(sp){ const L=d.sp.filter(x=>x.id!==p.id).slice(0,5).map(spV); const inc=L.length>=5?Math.min(...L):42; const v=spV(p)+adj; gain=Math.max(0,v-inc)*MKT.sp; own=Math.max(0,v-MKT.repl)*MKT.sp; }
    else { const L=d.pen.filter(x=>x.id!==p.id).slice(0,4).map(penV); const inc=L.length>=4?Math.min(...L):42; const v=penV(p)+adj; gain=Math.max(0,v-inc)*MKT.rp; own=Math.max(0,v-MKT.repl)*MKT.rp; } }
  else { const at=k=>{ const q=d.ln&&d.ln[k]; return q&&q.id!==p.id?posScore(q,k):40; }; const vp=posScore(p,p.pos)+adj, vd=offV(p)+adj; gain=Math.max(0,vp-at(p.pos),vd-at('DH'))*MKT.hit; own=Math.max(0,vp-MKT.repl)*MKT.hit; }
  return Math.max(gain,own*MKT.depth); }
/* 그 구단이 1승에 매기는 값: 우승 도전은 비싸게(성적 우선 구단주면 더), 리빌딩은 싸게(젊은 선수는 제값). 나이에 따라 계약 기간 가치가 달라진다 */
function mktWinPrice(t,p){ const st=t.mode==='contend'?(t.owner==='win'?1.4:1.25):t.mode==='rebuild'?(p.age<=27?1:.6):1; const ab=typeof gmAbOf==='function'?gmAbOf(t.id):null;
  const af=(p.age<30?1.12:p.age<=32?1:p.age<=34?.75:.55)*(ab&&p.age>=30?1+(55-ab.money)/400:1); return MKT.win*ecoIdx(sponSeason())*st*af*(t.id===p.faFrom?1.05:1)*faMktNow(); }
/* 지불 의사(연평균, 백만원): 추가 승수 × 1승의 값 × 남는 연봉 여유(faRoomPush) × 구단주가 찍은 선수 웃돈. 한 선수 연평균 상한(faTop)을 넘지 않는다 */
function mktWTP(t,p){ const w=mktWins(t,p)*mktWinPrice(t,p); const k=(typeof faTgt==='function'&&faTgt(t,p)?faOverpay(t):1)*(t.id===ME()?1:faRoomPush(t,p)*domFaMul(t,p)); /* 독주 견제: 독주 구단의 FA·그 구단이 노리는 FA에는 경쟁 구단이 더 쓴다(86b_dynasty) */ const top=faTop(); /* 급에 따른 천장: 특급(종합 62+)만 리그 최고액까지, 주전급(58)은 75%, 평범한 주전(54)은 절반. 빈자리가 급해도 어중간한 선수에게 특급 값을 주지 않는다 */ return round5(Math.max(MIN_SAL,Math.min(top,w*k))); }
/* 시장가: 실제로 입찰할 수 있는 AI 구단들의 지불 의사 가운데 두 번째로 높은 값(경쟁이 가격을 만든다). 원하는 구단이 하나뿐이면 그 구단 값의 70%.
   입찰 구단은 faInterest와 같은 문턱으로 고른다(긴축·리빌딩 계획, 외부 FA 한도, 정원, 현금). 구단 값은 실제 입찰(faWorth)처럼 계획 배율을 곱하고,
   외부 구단은 원소속 구단에 줄 보상금을 계약 기간에 나눠 뺀다(검수 11-14: 입찰하지 않을 구단까지 세어 요구액이 실제 계약보다 높았다) */
let _mkP={k:null,m:{}};
function mktBidOk(t,p,fa){ if(t.id===ME()||(t.cash||0)<=-3000)return false; const own=t.id===(fa?p.faFrom:p.team); const pl=typeof planOf==='function'?planOf(t):null;
  if(pl==='tight'&&!own)return false; if(pl==='build'&&p.age>=(own||planYears(t)>=3?33:31))return false;
  if(fa){ if(faOutBlocked(t.id,p)||rosterN(t.id)>=ROSTER_MAX)return false; if(!own){ if(ovr(p)<47)return false; const cc=mktCompCost(p); if(cc&&t.cash-cc<-2500)return false; } }
  return true; }
function mktCompCost(p){ if(!p.faGrade)return 0; const ps=p.faPrevSal??p.sal??0; return p.faGrade==='A'?ps*2:p.faGrade==='B'?ps:ps*1.5; }
function mktBid(t,p,fa){ let w=mktWTP(t,p)*(typeof planFaMul==='function'?planFaMul(t,p):1); return w; } /* 보상 부담은 입찰 여부(faInterest의 compF)에만 반영한다. 실제 입찰가는 보상을 빼지 않으므로 시장가에서도 빼지 않는다(11-14) */
function mktPrice(p){ const k=mktKey(); if(_mkP.k!==k||_mkP.g!==G)_mkP={k,g:G,m:{}}; if(_mkP.m[p.id]!=null)return _mkP.m[p.id];
  const fa=p.team==null&&p.faFrom!=null; return _mkP.m[p.id]=fa?mktFa(p).price:mktClear(mktBids(p,false),1); }
/* 유보가(구단주 검수 11-19: 비슷한 내야 FA 3명 겨울에 연 8.65억 → 2.1억, 방향은 맞지만 낙폭이 비현실적). 공급에도 유보가가 있다:
   선수에게는 '1년만 계약하고 내년에 다시 시장에 나가는' 길이 있으므로, 대체재가 없을 때의 값(solo: 같은 구단들의 지불 의사에서 공급 1로 청산한 값)에
   나이별 기다림 할인(29세 이하 70%, 32세 이하 62%, 34세 이하 52%, 그 위 42%)을 곱한 값과 직전 연봉의 75% 가운데 큰 쪽 아래로는 계약하지 않는다.
   유보가는 solo를 넘지 않는다(혼자 나와도 그 값을 못 받는 선수에게 직전 연봉은 대안이 아니다). 능력표는 쓰지 않는다: 모두 구단 지불 의사에서 나온다.
   청산값이 유보가보다 낮으면(prove) 값은 유보가에서 멈추고 수량이 줄어든다: FA 신청을 미루거나(faDeclWhy), 1년 계약을 하거나(faAsk·faSignRun), 더 오래 미계약으로 남는다 */
let _mkF={k:null,m:{}};
function mktResv(p,solo,prev){ const w=p.age<=29?.7:p.age<=32?.62:p.age<=34?.52:.42; return round5(Math.max(MIN_SAL,Math.min(solo,Math.max((prev||0)*.75,solo*w)))); }
function mktFa(p){ const k=mktKey(); if(_mkF.k!==k||_mkF.g!==G)_mkF={k,g:G,m:{}}; if(_mkF.m[p.id])return _mkF.m[p.id];
  const L=mktBids(p,true), m=mktSupply(p), clear=mktClear(L,m), solo=m>1?mktClear(L,1):clear, res=m>1?mktResv(p,solo,p.faPrevSal??p.sal):clear, prove=clear<res;
  return _mkF.m[p.id]={clear,solo,res,m,prove,price:prove?res:clear}; }
function mktBids(p,fa){ return G.teams.filter(t=>mktBidOk(t,p,fa)).map(t=>mktBid(t,p,fa)).sort((a,b)=>b-a); }
function mktClear(L,m){ m=Math.max(1,m|0);
  /* 수요·공급 청산(구단주 원칙 11-19): 비슷한 FA가 m명이면 그 자리를 사려는 구단 가운데 (m+1)번째 지불 의사가 값이 된다(m=1이면 예전처럼 두 번째).
     원하는 구단이 공급보다 적으면(공급 과잉) 가장 낮게 부른 구단 값의 70%까지 내려간다. 원하는 구단이 없으면 최저 연봉 */
  const v=L.length>m?Math.max(L[m],L[m-1]*.7):L.length?L[L.length-1]*.7:MIN_SAL; return round5(Math.max(MIN_SAL,v)); }
/* 공급: 이번 겨울 시장에 남은 비슷한 FA 수(같은 역할 SP·RP·C·IF·OF, 시장 능력 ±2 안, 본인 포함, 최대 3). 계약하면 빠져 남은 선수 값이 다시 정해진다(캐시 열쇠에 남은 FA 수가 들어 있다) */
let _mkS={k:null,m:{}};
function mktSupply(p){ const F=G.fa; if(!F||!F.pool)return 1; const k=mktKey(); if(_mkS.k!==k||_mkS.g!==G){ const L=F.pool.map(i=>G.players[i]).filter(q=>q&&q.team==null&&!q.foreign).map(q=>[q.id,dGrp(q),mktBase(q)]); _mkS={k,g:G,m:{},L}; }
  if(_mkS.m[p.id]!=null)return _mkS.m[p.id]; const g=dGrp(p), b=mktBase(p); return _mkS.m[p.id]=clamp(_mkS.L.filter(x=>x[1]===g&&Math.abs(x[2]-b)<=2).length+(_mkS.L.some(x=>x[0]===p.id)?0:1),1,MKT_SUP_MAX); } /* 구단은 한 자리에 한 명만 사므로, 대체재는 셋까지만 값에 반영한다(넷째부터는 이미 수요가 바닥) */
const MKT_SUP_MAX=3;
