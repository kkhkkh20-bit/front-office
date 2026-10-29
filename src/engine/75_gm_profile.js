/* ===== 단장 프로필: 행동으로 만들어지는 스타일 =====
 단장이 실제로 한 일(트레이드·언론 플레이·인터뷰·FA·감독 교체·외국인 교체·업무 위임·영입한 선수 나이)을 기록해
 '트레이드를 자주 한다', '언론 플레이를 즐긴다', '유망주를 선호한다' 같은 스타일과 별명을 붙인다. 다른 구단 단장도 같은 방식으로 기록한다.
 기록은 단장 개인을 따라간다(구단을 옮겨도 이어진다). */
function meInit(){ G.me=G.me||{pp:0,iv:0,ivSkip:0,fa:0,faBig:0,faAmt:0,mgrFire:0,fRep:0,since:G.gmSince??G.year}; return G.me; }
function meInc(k,n){ if(G.unemp)return; const M=meInit(); M[k]=(M[k]||0)+(n??1); }
/* 다른 구단 단장 기록(사람에게 붙는다: 단장이 바뀌면 새로 시작) */
function gmSt(tid){ const g=tid===G.user?null:team(tid).gm; if(!g)return null; g.st=g.st||{fa:0,faBig:0,mgrFire:0}; return g.st; }
function gmInc(tid,k,n){ if(tid===ME()){ meInc(k,n); return; } const s=gmSt(tid); if(s)s[k]=(s[k]||0)+(n??1); }

function meSeasons(){ const C=G.myC; const n=C&&C.seas?C.seas.length:0; return Math.max(1,n+(period()==='season'||period()==='post'?1:0)); }
function meTradeStats(){ const T=(G.trades||[]).filter(t=>t.gi); let net=0, best=null, worst=null, yIn=0, oIn=0, aIn=0;
  for(const t of T){ const r=tradeReport(t); if(r){ net+=r.net; if(!best||r.net>best.r.net)best={t,r}; if(!worst||r.net<worst.r.net)worst={t,r}; }
    for(const id of t.gi){ const p=G.players[id]; if(!p)continue; const a=p.age-(G.year-t.y); aIn++; if(a<=24)yIn++; else if(a>=30)oIn++; } }
  return {n:T.length,net,best,worst,yIn,oIn,aIn}; }
function meStats(){ const M=meInit(); const S=meSeasons(); const T=meTradeStats(); const m=G.unemp?null:G.mgr[G.user];
  const autos=typeof AUTO_AREAS!=='undefined'?AUTO_AREAS.filter(([k])=>autoOn(k)).length:0;
  return {S,M,T,mrel:m&&!m.interim?m.rel:null,trust:G.unemp?null:team(G.user).trust,autos,ppS:M.pp/S,trS:T.n/S}; }
/* 스타일 태그: 조건을 넘은 것만, 강한 순 */
function meTags(){ const s=meStats(), M=s.M, T=s.T; const L=[];
  if(M.pp>=3&&s.ppS>=1)L.push({k:'pp',l:'언론 플레이를 즐긴다',d:`언론 플레이 ${M.pp}회(시즌당 ${s.ppS.toFixed(1)}회)`,nick:'입담꾼 단장',w:s.ppS});
  if(M.ivSkip>=3&&M.ivSkip>=M.iv*.4)L.push({k:'quiet',l:'언론과 거리를 둔다',d:`인터뷰 거절 ${M.ivSkip}회 · 응함 ${M.iv}회`,nick:'침묵의 단장',w:M.ivSkip/s.S});
  else if(M.iv>=6&&M.ivSkip<=M.iv*.15)L.push({k:'open',l:'언론 앞에 자주 선다',d:`인터뷰 ${M.iv}회 · 거절 ${M.ivSkip}회`,nick:'',w:.5});
  if(T.n>=4&&s.trS>=2)L.push({k:'tr',l:'트레이드를 자주 한다',d:`트레이드 ${T.n}건(시즌당 ${s.trS.toFixed(1)}건)`,nick:'트레이드 매니아',w:s.trS});
  if(T.n>=3&&T.net>=5)L.push({k:'trw',l:'트레이드에 강하다',d:`트레이드 뒤 WAR 차 합계 +${T.net.toFixed(1)}`,nick:'트레이드 귀재',w:T.net/3});
  else if(T.n>=3&&T.net<=-5)L.push({k:'trl',l:'트레이드에서 자주 손해 본다',d:`트레이드 뒤 WAR 차 합계 ${T.net.toFixed(1)}`,nick:'',w:-T.net/4});
  if(T.aIn>=4&&T.yIn>=T.aIn*.55)L.push({k:'young',l:'유망주를 선호한다',d:`트레이드로 받은 ${T.aIn}명 중 24세 이하 ${T.yIn}명`,nick:'육성 신봉자',w:T.yIn/T.aIn*2});
  else if(T.aIn>=4&&T.oIn>=T.aIn*.55)L.push({k:'now',l:'즉시 전력을 원한다',d:`트레이드로 받은 ${T.aIn}명 중 30세 이상 ${T.oIn}명`,nick:'윈나우 단장',w:T.oIn/T.aIn*2});
  if(M.faBig>=2||M.fa>=4)L.push({k:'fa',l:'FA 시장의 큰손',d:`외부 FA ${M.fa}명 영입 · 대형 계약 ${M.faBig}건`,nick:'큰손 단장',w:M.fa/s.S+M.faBig});
  if(s.mrel!=null&&s.mrel>=72)L.push({k:'mgr',l:'감독과 가깝다',d:`감독과의 관계 ${Math.round(s.mrel)}`,nick:'',w:.8});
  if(M.mgrFire>=2)L.push({k:'mgrF',l:'감독을 자주 바꾼다',d:`감독 경질 ${M.mgrFire}회`,nick:'',w:M.mgrFire/s.S*2});
  if(M.fRep>=3)L.push({k:'fRep',l:'외국인 교체를 망설이지 않는다',d:`시즌 중 외국인 교체 ${M.fRep}회`,nick:'',w:M.fRep/s.S});
  if(s.autos>=5)L.push({k:'deleg',l:'실무를 맡기는 단장',d:`업무 ${s.autos}가지를 비서·팀장에게 넘김`,nick:'',w:.3}); else if(s.autos===0&&s.S>=2)L.push({k:'hands',l:'실무를 손수 챙긴다',d:'반복 업무도 직접 처리',nick:'',w:.3});
  if(s.trust!=null&&s.trust>=72)L.push({k:'trust',l:'구단주의 신임',d:`구단주 신뢰 ${Math.round(s.trust)}`,nick:'',w:.6});
  return L.sort((a,b)=>b.w-a.w); }
function meNick(){ const t=meTags().find(x=>x.nick); return t?t.nick:''; }
/* 다른 구단 단장 */
function aiGmStats(tid){ const t=team(tid), g=t.gm; if(!g)return null; const st=gmSt(tid)||{}; const yrs=Math.max(1,G.year-(g.since??G.year)+1);
  const tr=(G.lgTrades||[]).filter(x=>(x.a===tid||x.b===tid)&&x.y>=(g.since??0)).length+(G.trades||[]).filter(x=>x.with===tid&&x.y>=(g.since??0)).length;
  return {yrs,tr,fa:st.fa||0,faBig:st.faBig||0,mgrFire:st.mgrFire||0}; }
function aiGmTags(tid){ const s=aiGmStats(tid); if(!s)return []; const L=[];
  if(s.tr>=3&&s.tr/s.yrs>=1.5)L.push({l:'트레이드를 자주 한다',d:`재임 ${s.yrs}년 트레이드 ${s.tr}건`});
  if(s.faBig>=2||s.fa>=3)L.push({l:'FA 시장의 큰손',d:`FA ${s.fa}명 영입 · 대형 계약 ${s.faBig}건`});
  if(s.mgrFire>=2)L.push({l:'감독을 자주 바꾼다',d:`감독 교체 ${s.mgrFire}회`});
  if(s.yrs>=6)L.push({l:'장수 단장',d:`재임 ${s.yrs}년`});
  return L; }
/* 기사에서 단장을 부르는 말: 별명이 붙었으면 '트레이드 귀재' 광주 단장처럼 */
function meCall(){ let n=''; try{ n=meNick(); }catch(e){} return n?`'${n}' ${tshort(G.user)} 단장`:`${tshort(G.user)} 단장`; }
