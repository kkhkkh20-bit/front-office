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
  const rk={}; const H=(G.history||[]).filter(h=>h&&h.y<=G.year&&(h.champ!=null||h.order)).slice(-3).reverse(); const inS=per==='season'; const hw=inS?.75:1;
  H.forEach((h,i)=>{ const w=[1,.6,.35][i]*hw; if(h.champ!=null&&m[h.champ]!=null)m[h.champ]+=w; const o=h.order||[]; const f=o[0]!=null?(o[0].tid??o[0]):null; if(f!=null&&m[f]!=null)m[f]+=w*.4; if(h.runner!=null&&m[h.runner]!=null)m[h.runner]+=w*.2; });
  try{ if(inS){ const S=standingsNow(); const a=S[0], b=S[1]; if(a&&b&&a.w+a.l>=25){ const gb=((a.w-b.w)+(b.l-a.l))/2; m[a.tid]+=clamp((gb-2)/6,0,1.2); } }
    else { const R0=G.teams.map(t=>({id:t.id,r:teamRating(t.id)})).sort((x,y)=>y.r-x.r); R0.forEach((x,i)=>rk[x.id]=i+1); if(R0.length>1)m[R0[0].id]+=clamp((R0[0].r-R0[1].r-.4)/1.5,0,.8); } }catch(e){}
  _domC={k,g:G,m,rk}; return m; }
/* 시즌 밖 전력 순위(같은 날 한 번만 계산) */
function domRk(tid){ domScores(); return (_domC.rk||{})[tid]||6; }
function domOf(tid){ if(tid==null||tid<0)return 0; return domScores()[tid]||0; }
/* 지금 독주 구단(없으면 null): 점수가 가장 높고 기준을 넘는 구단 */
function domLead(){ const m=domScores(); let b=null; for(const k in m){ if(m[k]>=DOM_TH&&(!b||m[k]>b.s))b={tid:+k,s:m[k]}; } return b; }
/* 견제 강도(0~1.2): 우승 도전 구단이 가장 세고, 순위 싸움에서 멀어질수록 약해진다. 벼랑 끝 단장은 더 세게 */
function rivalK(t,dtid){ if(!t||t.id===dtid||t.id===ME())return 0; const pl=planOf(t); let k={win:1,next:.75,star:.7,build:.3,tight:.3}[pl]??.6;
  try{ if(period()==='season'){ const S=standingsNow(); const a=S.find(x=>x.tid===dtid), b=S.find(x=>x.tid===t.id); if(a&&b){ const gb=((a.w-b.w)+(b.l-a.l))/2; k*=clamp(1-(gb-4)/14,.35,1); } }
    else { const rk=domRk(t.id); k*=rk<=4?1:rk<=6?.8:.6; } }catch(e){}
  return clamp(k+despOf(t)*.2,0,1.2); }
/* 벼랑 끝(0~1): 단장 자리가 위태롭다(지난 시즌 순위·재임 기간), 가을야구 가뭄, 구단주 신뢰 하락. AI 구단만 */
function despOf(t){ if(!t||t.id===ME()||t.indie)return 0; const H=(G.history||[]).filter(h=>h&&h.order&&h.y<G.year+1).slice(-3); if(!H.length)return 0;
  const rkIn=h=>{ const i=h.order.findIndex(o=>(o.tid??o)===t.id); return i<0?6:i+1; }; const r1=rkIn(H[H.length-1]); const g=t.gm; const ten=g&&g.since!=null?G.year-g.since:0;
  let d=.45*gmHot(t); if(!d&&r1>=8&&ten>=1)d=.2; const dr=H.filter(h=>rkIn(h)>5).length; d+=dr>=3?.3:dr>=2?.15:0; if((t.trust??55)<40)d+=.2;
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
/* ===== 단장 생존(사용자 11-13: 몇 년째 못하는 구단은 단장·감독이 다 잘리고 유능한 단장이 와서 개혁한다) =====
 기대치: 우승 도전·흥행 5위 안, 내년 도전 6위 안, 유망주 수집·긴축은 처음 세 시즌 8위 안(그 뒤는 6위 안).
 인내심: 성적 우선 구단주 2시즌, 그 밖 3시즌(유망주 수집 중이면 한 시즌 더). 새 단장은 두 시즌은 성적으로 자르지 않는다(창단 유예 구단도 제외).
 한 시즌만 더 못하면 잘리는 단장은 벼랑 끝(despOf)이 돼 올인·웃돈·마감 보강으로 승부를 건다 */
function gmExpRank(t){ const pl=planOf(t); return pl==='win'||pl==='star'?5:pl==='next'?6:planYears(t)<3?8:6; }
function gmBadRun(t){ const g=t&&t.gm; if(!g||g.interim)return 0; const H=(G.history||[]).filter(h=>h&&h.order&&h.y>g.since&&h.y<=G.year).sort((a,b)=>b.y-a.y); const lim=gmExpRank(t); let n=0;
  for(const h of H){ const rk=h.order.findIndex(o=>(o.tid??o)===t.id)+1; if(!rk||rk<=lim)break; n++; } return n; }
function gmPatience(t){ return (t.owner==='win'?2:3)+(planOf(t)==='build'&&planYears(t)<4?1:0); }
/* 자리 위태로움(0~1): 한 시즌만 더 못하면 잘린다 1, 두 시즌 남았으면 .5 */
function gmHot(t){ const g=t&&t.gm; if(!g||g.interim||t.id===ME())return 0; const ten=G.year-g.since; const run=gmBadRun(t), N=gmPatience(t); return run>=N-1&&ten>=1?1:run>=1&&run>=N-2?.5:0; }
/* 시즌 뒤 단장 경질 판정(gmTurnover가 부른다). 성적 경질이면 run(못한 시즌 수)을 돌려준다 */
function gmFireCheck(t,g,ten){ if(expYr(t.id))return g.age>=64&&R()<.35?{age:1}:null; if(ten>=2){ const run=gmBadRun(t), N=gmPatience(t);
    if(run>=N&&R()<.8)return {run}; if(run>=N-1&&(t.trust??55)<35&&R()<.3)return {run}; }
  return g.age>=64&&R()<.35?{age:1}:null; }
/* 개혁 단장: 못한 기간이 길수록 구단주가 능력을 더 따지고 돈을 더 쓴다. 후보는 새 인물·내부 승격·다른 구단에서 물러난 단장·OB */
function gmReformPick(t,run){ const C=[]; const n=3+Math.min(3,run||0); for(let i=0;i<n;i++)C.push(mkGM(t.id)); try{ C[0]=ipGM(t,C[0]); }catch(e){}
  for(const x of (G.exGM||[]).filter(x=>x.tid!==t.id&&x.g.age<63).slice(0,3))C.push(x.g);
  let ob=null; try{ const L=obGMCands(); if(L.length&&R()<.6){ ob=L.sort((a,b)=>(b.fy+b.sy+b.fame/10)-(a.fy+a.sy+a.fame/10))[0]; C.push(obGM(ob,t.id)); } }catch(e){ ob=null; }
  const w=.5+.3*Math.min(4,run||0); const sc=g=>{ const a=gmAbil(g); return (a?(a.eye+a.neg+a.plan+a.money)/4:50)*w+R()*12; };
  let b=C[0], bs=-1e9; for(const g of C){ const s=sc(g); if(s>bs){ bs=s; b=g; } }
  if(ob&&b.ob===ob.id){ try{ obAiGMTake(ob,b,t.id); }catch(e){} }
  const ex=(G.exGM||[]).find(x=>x.g===b); if(ex){ G.exGM=G.exGM.filter(x=>x!==ex); b.since=G.year; b.tid=t.id; delete b.c; b.car=`${b.car||'프런트 출신'} · 전 ${tshort(ex.tid)} 단장`; }
  try{ const c=gmCon(b,t.id); if(c&&run)c.sal=Math.round(clamp(c.sal*(1+.08*Math.min(4,run)),150,500)/10)*10; }catch(e){} return b; }
/* 물러난 단장은 몇 해 동안 다른 구단 후보로 남는다 */
function gmExAdd(g,tid){ if(!g||g.interim||g.ob||g.age>=62)return; G.exGM=(G.exGM||[]).filter(x=>G.year-x.y<4&&x.g.id!==g.id); G.exGM.push({g,tid,y:G.year}); if(G.exGM.length>12)G.exGM.shift(); }
/* 개혁: 새 단장은 대개 감독을 바꾸고(새 감독은 코치진을 데려온다) 계획을 새로 짠다 */
function gmReformStaff(t,run){ const m=G.mgr&&G.mgr[t.id]; if(!m||m.hireY===G.year||R()>=.7)return; const old=m.name; try{ staffHistory('mgr',m,'경질',t.id,'새 단장 체제 개편'); }catch(e){} t.cash=(t.cash||0)-Math.round((m.sal||0)*Math.max(0,(m.yrs||1)-1));
  const n=mgrNew(t.id,false); n.yrs=(n.yrs||2)+1; n.hireY=G.year; try{ domLog('reformMgr'); }catch(e){}
  try{ news('리그',`${tshort(t.id)}, 새 단장 체제로 판 갈이… ${old} 감독도 교체`,`${run}시즌째 기대에 못 미친 ${tname(t.id)}이(가) 단장에 이어 감독까지 바꿨습니다. 새 감독은 ${n.name}입니다. 코치진도 상당수 바뀝니다.`,0); }catch(e){} try{ wire('감독',`${tname(t.id)}, ${old} 감독 교체 · ${n.name} 감독 선임`,{tid:t.id,x:{mid:n.id,hire:1}}); }catch(e){} }
