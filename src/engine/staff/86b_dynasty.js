/* ===== 독주 견제(사용자 11-13: 왕조는 괜찮다. 다만 다른 구단이 결국 맞서야 하고, 우리 구단이 우승을 독차지하지 못하게 필사적으로 덤벼야 한다) =====
 독주 구단: 최근 세 시즌 우승·정규시즌 1위·준우승, 지금 선두 승차(시즌 중), 전력 격차(시즌 밖)로 매긴다. 우리 구단과 AI 구단에 같은 기준을 쓴다.
 견제(우승 경쟁 구단일수록 세게, 유망주 수집·긴축 구단은 팔되 비싸게):
  1) 트레이드: 독주 구단 전력을 키우는 거래는 값을 올리거나 거절한다("우승 경쟁팀은 돕지 않는다").
  2) FA: 독주 구단의 FA와 독주 구단이 노리는 FA에 더 쓴다(지불 의사가 오른다).
  3) 군비 경쟁: 한 구단이 달아나면 2~5위권 구단이 우승 도전을 앞당긴다.
  4) 벼랑 끝: 자리가 위태로운 단장(성적 부진·가을야구 가뭄·구단주 신뢰 하락)은 올인·웃돈·마감 보강으로 승부를 건다. 대가(세금·빚·긴축)는 그대로 남는다.
 독주 구단 쪽 비용: 우승 프리미엄(연봉 인상·FA 요구액), 바깥 FA는 더 큰 계약을 원한다. 경기 계산은 건드리지 않는다.
 화면에는 수치가 보이지 않는다. 리그 소식·루머·단장 답변으로만 드러난다 */
const DOM_TH=1; /* 이 점수부터 독주 구단 */
let _domC={k:null,m:null};
/* 구단별 독주 점수(0~3 안팎) */
function domScores(){ const per=period(); const k=G.year+':'+G.day+':'+per; if(_domC.k===k&&_domC.g===G)return _domC.m; const m={}; for(const t of G.teams)m[t.id]=0;
  const H=(G.history||[]).filter(h=>h&&h.y<=G.year&&(h.champ!=null||h.order)).slice(-3).reverse(); const inS=per==='season'; const hw=inS?.75:1;
  H.forEach((h,i)=>{ const w=[1,.6,.35][i]*hw; if(h.champ!=null&&m[h.champ]!=null)m[h.champ]+=w; const o=h.order||[]; const f=o[0]!=null?(o[0].tid??o[0]):null; if(f!=null&&m[f]!=null)m[f]+=w*.4; if(h.runner!=null&&m[h.runner]!=null)m[h.runner]+=w*.2; });
  try{ if(inS){ const S=standingsNow(); const a=S[0], b=S[1]; if(a&&b&&a.w+a.l>=25){ const gb=((a.w-b.w)+(b.l-a.l))/2; m[a.tid]+=clamp((gb-2)/6,0,1.2); } }
    else { const R0=G.teams.map(t=>({id:t.id,r:teamRating(t.id)})).sort((x,y)=>y.r-x.r); if(R0.length>1)m[R0[0].id]+=clamp((R0[0].r-R0[1].r-.4)/1.5,0,.8); } }catch(e){}
  _domC={k,g:G,m}; return m; }
function domOf(tid){ if(tid==null||tid<0)return 0; return domScores()[tid]||0; }
/* 지금 독주 구단(없으면 null): 점수가 가장 높고 기준을 넘는 구단 */
function domLead(){ const m=domScores(); let b=null; for(const k in m){ if(m[k]>=DOM_TH&&(!b||m[k]>b.s))b={tid:+k,s:m[k]}; } return b; }
/* 견제 강도(0~1.2): 우승 도전 구단이 가장 세고, 순위 싸움에서 멀어질수록 약해진다. 벼랑 끝 단장은 더 세게 */
function rivalK(t,dtid){ if(!t||t.id===dtid||t.id===ME())return 0; const pl=planOf(t); let k={win:1,next:.75,star:.7,build:.3,tight:.3}[pl]??.6;
  try{ if(period()==='season'){ const S=standingsNow(); const a=S.find(x=>x.tid===dtid), b=S.find(x=>x.tid===t.id); if(a&&b){ const gb=((a.w-b.w)+(b.l-a.l))/2; k*=clamp(1-(gb-4)/14,.35,1); } }
    else { const rk=G.teams.map(x=>({id:x.id,r:teamRating(x.id)})).sort((x,y)=>y.r-x.r).findIndex(x=>x.id===t.id)+1; k*=rk<=4?1:rk<=6?.8:.6; } }catch(e){}
  return clamp(k+despOf(t)*.2,0,1.2); }
/* 벼랑 끝(0~1): 단장 자리가 위태롭다(지난 시즌 순위·재임 기간), 가을야구 가뭄, 구단주 신뢰 하락. AI 구단만 */
function despOf(t){ if(!t||t.id===ME()||t.indie)return 0; const H=(G.history||[]).filter(h=>h&&h.order&&h.y<G.year+1).slice(-3); if(!H.length)return 0;
  const rkIn=h=>{ const i=h.order.findIndex(o=>(o.tid??o)===t.id); return i<0?6:i+1; }; const r1=rkIn(H[H.length-1]); const g=t.gm; const ten=g&&g.since!=null?G.year-g.since:0;
  let d=r1>=8&&ten>=1?.35:r1>=6&&ten>=3?.3:0; const dr=H.filter(h=>rkIn(h)>5).length; d+=dr>=3?.3:dr>=2?.15:0; if((t.trust??55)<40)d+=.2;
  return clamp(d,0,1); }
/* 군비 경쟁: 독주 구단이 있으면 상위권 경쟁 구단이 우승 도전 문턱을 낮춘다(계획 점수 rk에 더할 값) */
function domArms(t,rk){ const L=domLead(); if(!L||L.tid===t.id||rk>5.5)return 0; return Math.min(1.5,L.s)*.9; }
/* 견제 기록(측정·소식용): ref 거절, over 웃돈, outbid FA 가로채기, allin 올인, arms 군비 경쟁 전환 */
let _domSeen={d:-1,s:new Set()};
function domLog(kind,key){ if(key!=null){ if(_domSeen.d!==G.day)_domSeen={d:G.day,s:new Set()}; const k=kind+':'+key; if(_domSeen.s.has(k))return; _domSeen.s.add(k); }
  const y=G.year; G.domLog=G.domLog||{}; const o=G.domLog[y]=G.domLog[y]||{}; o[kind]=(o[kind]||0)+1; for(const k in G.domLog)if(+k<y-12)delete G.domLog[k]; }
/* 트레이드 견제: 상대(독주 구단)에게 붙일 웃돈 비율과 거절 여부. t: 파는 구단, dtid: 사는 구단, starter: 주전을 내주는 거래인지 */
function domTradeTax(t,dtid,starter){ const s=domOf(dtid); if(s<DOM_TH*.6)return {k:0,refuse:false}; const rk=rivalK(t,dtid); const m=Math.min(2,s);
  return {k:(.04+.16*rk)*m,refuse:!!starter&&rk>=.8&&s>=1.3,s,rk}; }
/* FA 견제: 독주 구단의 FA이거나 독주 구단이 노리는(제안했거나 구단주가 찍은) FA면 경쟁 구단의 지불 의사가 오른다 */
function domFaMul(t,p){ if(!t||!p||t.id===ME())return 1; const L=domLead(); if(!L||L.tid===t.id)return 1; const D=team(L.tid); const F=G.fa;
  const hit=p.faFrom===L.tid||(F&&F.tgt&&F.tgt[L.tid]===p.id)||(F&&L.tid===G.user&&!G.unemp&&F.offers&&F.offers[p.id])||(F&&F.ai&&F.ai[p.id]&&F.ai[p.id][L.tid]); if(!hit||!D)return 1;
  const rk=rivalK(t,L.tid); return 1+.12*rk*Math.min(2,L.s); }
/* 우승 프리미엄: 독주 구단 선수의 연봉 인상·FA 요구액이 오른다 */
function domPrem(tid){ const s=domOf(tid); return s>=DOM_TH?1+.05*Math.min(2,s):1; }
/* 독주 구단이 바깥 FA를 데려올 때 선수 쪽 기대(더 큰 계약을 원한다): 제안 점수에 곱한다 */
function domFaPull(p,tid){ const s=domOf(tid); return s>=DOM_TH&&tid!==p.faFrom?1-.04*Math.min(2,s):1; }
/* 소식: 독주가 시작되면(시즌 뒤 FA 공시, 7월 1일) 한 번씩 리그 소식으로 알린다 */
function domNews(){ const L=domLead(); if(!L||L.s<1.3)return; const key=G.year+(period()==='season'?'s':'w'); if(G.domNewsK===key)return; G.domNewsK=key;
  const R2=G.teams.filter(t=>t.id!==L.tid&&t.id!==ME()&&rivalK(t,L.tid)>=.8).slice(0,3); if(!R2.length)return; const nm=tshort(L.tid);
  const H=(G.history||[]).filter(h=>h.champ===L.tid&&h.y>=G.year-3).length;
  const t1=`${nm} 독주에 다른 구단들 견제 나서`, b1=`${H>=2?`최근 ${H}번 우승한 `:''}${tname(L.tid)}을(를) 두고 ${R2.map(t=>tshort(t.id)).join('·')}이(가) 견제에 나섰다는 이야기가 돕니다. "우승 경쟁팀을 도와줄 이유는 없다"며 트레이드 문의를 돌려보내고, FA 시장에서도 맞불을 놓을 기세입니다.`;
  try{ news('리그',t1,b1,0,{tid:L.tid}); }catch(e){} try{ wire('구단',t1,{tid:L.tid}); }catch(e){} }
/* 트레이드 거절 루머(AI끼리) */
function domRumor(seller,buyer){ if(R()>=.35)return; try{ wire('루머',`${tshort(seller)}, 선두 ${tshort(buyer)}의 트레이드 문의를 거절… "우승 경쟁팀은 돕지 않는다"`,{tid:seller}); }catch(e){} }
