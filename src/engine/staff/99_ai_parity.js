/* ===== 다른 구단도 사람 단장과 같은 수단을 쓴다(사용자 11-13: "유저가 하는 기능을 AI도 다 해야 공평하고 재미있다") =====
 같은 규칙·같은 식·같은 비용. 결정은 구단 계획(86_ai_plan)과 형편(남는 돈)으로 하고, 숫자는 화면에 보이지 않는다. 소식은 짧게만 남긴다.
 - 부상 방지 단계·제휴 병원: 구단 것이라 G.orgT[tid].med에 둔다(맡은 구단은 G.med, 이직하면 27_other_gms가 그대로 주고받는다).
   부상·재활 식은 모든 구단이 같다(31_dev_medical injMult·recMult, 45_injuries injApply). 비용은 결산에서 우리와 같은 값
 - 육성 방침: t.trnPol(계획에서). 코치진 강도 배분·성장·부상·피로 대가가 같다(76_dev_plan)
 - 스프링캠프 방향의 부상·컨디션 효과: t.campInj·t.form(08_season_events campEnd)
 - 감독이 미는 선수: t.mpick. 유망주 수집·내년 도전 구단은 받아 주고, 나머지는 가끔
 - 구단주 자금 요청: 같은 승인 식(ownOddsT)·한 달 간격·반려 때 신뢰 -1. 승인되면 t.grant(지원 한도, supportCap)
 - 보조 코치: G.orgT[tid].coachX(axOf가 읽는다), 정원은 그 구단 시설(axSlots(tid)). 멘토: G.clubT[tid].mentor, 수당 같은 값
 - 특수 아카데미: G.orgT[tid].acad(acadLv(tid)), 해외 연수 정원·성과에 반영
 - 티켓 가격(지난 시즌 점유율), 응원단·서포터즈(t.fanOps), 구단 버스(t.bus): 같은 값으로 구단 현금에서
 옛 저장: 새 값이 없으면 리그 기본(기본 프로그램·제휴 없음·균형 방침·효과 없음)으로 본다 */
const MED0={prev:1,hosp:'none'};
function orgOf(tid){ const O=G.orgT=G.orgT||{}; return O[tid]||(O[tid]={}); }
function medOf(tid){ if(tid===G.user)return G.med||MED0; const o=G.orgT&&G.orgT[tid]; return o&&o.med&&PREV[o.med.prev]&&HOSP[o.med.hosp]?o.med:MED0; }
function medSetT(tid,m){ if(tid===G.user)G.med={...m}; else orgOf(tid).med={...m}; }
function acadSetT(tid,a){ if(tid===G.user)G.acad=a; else orgOf(tid).acad=a; }
function busSetT(tid,lv){ if(tid===G.user)G.bus=lv; else team(tid).bus=lv; }
const medCost=m=>PREV[m.prev].c+HOSP[m.hosp].c;

/* --- 부상 방지·병원: 계획이 바라는 수준을, 남는 돈의 일부(계획의 스태프 몫) 안에서 고른다. 빚이 있으면 기본도 끊는다 --- */
const AI_MED_WANT={win:[[3,'a'],[3,'b'],[2,'b'],[2,'c'],[1,'c']],star:[[2,'b'],[2,'c'],[1,'c']],next:[[2,'b'],[2,'c'],[1,'c']],build:[[2,'c'],[1,'c']],tight:[]};
function aiMedPlan(t,ex,W){ const pl=planOf(t)||'next', cash=t.cash||0; let m={prev:1,hosp:'none'};
  if(cash<0||(pl==='tight'&&cash<1000))m={prev:0,hosp:'none'};
  else if(pl!=='tight'&&ex>0){ const room=Math.min(3200,ex*Math.max(.15,((W&&W.st)||0)*.6)), base=medCost(MED0); const hit=(AI_MED_WANT[pl]||[]).find(([p,h])=>PREV[p].c+HOSP[h].c-base<=room); if(hit)m={prev:hit[0],hosp:hit[1]}; }
  const cur=medOf(t.id); if(cur.prev!==m.prev||cur.hosp!==m.hosp)medSetT(t.id,m); return m; }

/* --- 응원단·서포터즈(가벼운 판): 계획의 팬 몫 안에서. 우리가 운영하던 구단은 남긴 운영 그대로(fanAway) --- */
function aiFanPlan(t,left,W,pay){ if(G.fanYrT&&G.fanYrT[t.id])return 0; const F=t.fanOps=t.fanOps||{cheer:0}; const bud=Math.max(0,left*((W&&W.fan)||0)); let lv=0;
  for(let i=FAN_OPS.cheer.m.length-1;i>=1;i--)if(FAN_OPS.cheer.m[i]*12<=bud*.6){ lv=i; break; }
  F.cheer=lv; const y=FAN_OPS.cheer.m[lv]*12, sy=sponSeason(); if(F.sup!==sy&&bud-y>=FAN_EV.sup.c*2){ pay(FAN_EV.sup.c); F.sup=sy; } return y; }
function aiFanAttM(day,tid){ const t=G.teams&&G.teams[tid], F=t&&t.fanOps; if(!F)return 1; const nx=typeof _stY!=='undefined'&&_stY!=null; return (1+(FAN_OPS.cheer.att[F.cheer||0]||0))*(F.sup===(nx?_stY:G.year)?1.03:1); }

/* --- 겨울(11월 20일) 운영 결정: aiSpend가 남는 돈(ex)을 나누기 전에 부른다. 돌려주는 값: 바로 쓴 현금, 응원단 연 운영비 --- */
function aiOpsPlan(t,ex,W){ const out={cash:0,fanY:0}; const pl=planOf(t)||'next'; let left=ex; const pay=c=>{ t.cash-=c; out.cash+=c; left-=c; };
  t.trnPol=AI_TRNPOL[pl]||'bal';
  aiMedPlan(t,ex,W);
  if((pl==='build'||pl==='next')&&left>0){ const lv=acadLv(t.id), n=ACAD[lv+1]; if(n&&left>=n.c*3){ pay(n.c); acadSetT(t.id,{lv:lv+1,d:G.day}); const S=facSt(t.id); if(S){ S.inv=(S.inv||0)+n.c; (S.hist=S.hist||[]).push({y:G.year,d:G.day,k:'acad',lv:lv+1,c:n.c,src:'cash'}); if(S.hist.length>40)S.hist.shift(); } } }
  if((pl==='win'||pl==='star')&&busLv(t.id)<2&&left>=BUS[2].c*4){ pay(BUS[2].c); busSetT(t.id,2); try{ clubFacilityHistory('fac',t.id,`구단 버스 ${BUS[2].l}`,'교체',{lv:2,c:BUS[2].c,costLabel:'구입비'}); }catch(e){} }
  out.fanY=aiFanPlan(t,left,W,pay);
  return out; }
/* 결산 지출(우리 구단과 같은 값): 부상 방지·병원·보조 코치 연봉·응원단 */
function aiOpsCost(t,y){ const M=medOf(t.id), L=[['부상 방지 프로그램',PREV[M.prev].c],['병원 제휴',HOSP[M.hosp].c]];
  L.push(['보조 코치 연봉',Math.round(sum(axOf(t.id).filter(c=>c&&!(c.cs!=null&&c.cs>y)).map(c=>c.sal||0)))]);
  const F=t.fanOps; if(F&&!(G.fanYrT&&G.fanYrT[t.id]))L.push(['팬 마케팅·구단 이벤트',(FAN_OPS.cheer.m[F.cheer||0]||0)*12]);
  return L; }

/* --- 티켓 가격: 결산 직후 지난 시즌 점유율을 보고 한 단계씩. 수익형 구단주·긴축 구단은 조금 일찍 올리고, 흥행 구단은 비싸게 받지 않는다 --- */
function aiPriceYear(t){ const A=G.sea&&G.sea.att&&G.sea.att[t.id]; if(!A||!A.cap||!A.n)return; const occ=A.sum/A.cap, S=stadOf(t.id), pl=planOf(t); let p=PRICE[S.price]?S.price:1; const p0=p;
  const hi=pl==='tight'||t.owner==='profit'?.88:.93, lo=pl==='star'?.72:.62, top=occ>=.98&&(t.pop||1)>=1.1?3:2;
  if(occ>=hi&&p<top)p++; else if(occ<lo&&p>0)p--; else if(p>=2&&occ<.8)p--;
  if(pl==='star')p=Math.min(p,1); if(p!==p0)S.price=p; return p; }

/* --- 구단주 자금 요청: FA 시장이 열린 날(영입 자금)과 7월 1일(우승 도전 보강·적자) --- */
function aiOwnerAsk(t,kind){ if(!t||t.id===ME()||t.indie)return null; const pl=planOf(t)||'next', sy=sponSeason(); const o=dobj(G.day), mk=o.y*100+o.m;
  const L=t.ownAsk=(t.ownAsk||[]).filter(g=>G.day-g.d<=400); if(L.some(g=>g.mk===mk))return null; /* 한 달에 한 번(우리와 같은 간격) */
  let amt=0, pur=null;
  if(kind==='fa'){ if(!['win','next','star'].includes(pl)||!(G.fa&&G.fa.open&&!G.fa.closed))return null;
    const q=(G.fa.pool||[]).map(id=>G.players[id]).filter(p=>{ if(!p||p.team!=null||!p.ask||ovr(p)<60||p.faFrom===t.id)return false; try{ return !faOutBlocked(t.id,p); }catch(e){ return true; } }).sort((a,b)=>ovr(b)-ovr(a))[0];
    if(!q)return null; amt=q.ask.annual; pur={k:'fa',pid:q.id}; }
  else { const rk=rankNowT(t.id), cash=t.cash||0; if(cash<-1000)amt=cash<-3000?2000:1000; else if((pl==='win'||pl==='next')&&rk<=5){ amt=pl==='win'?2000:1000; pur={k:'push'}; } else return null; }
  const p0=ownOddsT(t.id,amt,pur); if(p0<.25)return null; /* 사람 단장처럼 될 성싶을 때만 찾아간다 */
  const rec=L.filter(g=>G.day-g.d<=120).length; const p=p0*Math.pow(.85,rec)*(amt>=2000?.9:1); const ok=R()<p; /* ownerAsk와 같은 감쇠 */
  L.push({d:G.day,mk,y:sy,amt,ok}); if(L.length>12)L.shift();
  if(ok){ t.grant={y:sy,amt:(t.grant&&t.grant.y===sy?t.grant.amt:0)+amt}; try{ wire('구단',`${t.city} ${t.nick} 모기업, 추가 지원`,{tid:t.id}); }catch(e){} }
  else t.trust=clamp((t.trust??55)-1,0,100);
  return {ok,amt,p}; }

/* --- 감독이 미는 선수(시즌 개막 한 주 뒤, 해마다): 그 감독 안목으로 1~2명. 받아 주면 그해 성장 ×1.3, 같은 자리 경쟁자 기분 하락(우리와 같은 값) --- */
function aiMpickPlan(){ for(const t of G.teams){ if(t.id===ME())continue; const m=G.mgr[t.id], mid=m&&!m.interim?m.id:null, P=t.mpick; if(P&&P.y===G.year&&P.mid===mid)continue;
    if(mid==null){ t.mpick={y:G.year,mid:null,ids:[],back:false}; continue; }
    mgrAttr(m); const last=P&&P.y===G.year-1&&P.mid===mid?new Set(P.ids||[]):new Set(), sd=Math.max(1.5,9.5-m.eye/10);
    const C=domestic(t.id).filter(p=>p.age<=26&&!p.ys&&!(p.joinY>G.year)&&!last.has(p.id)).map(p=>({p,fut:clamp(Math.round(p.pot+hn('meye'+m.id+':'+G.year,p.id)*sd),20,80)})).filter(x=>x.fut-ovr(x.p)>=5).sort((a,b)=>(b.fut-ovr(b.p)*.3)-(a.fut-ovr(a.p)*.3)).slice(0,2);
    const pl=planOf(t), back=C.length>0&&(pl==='build'||pl==='next'||u01('mpkA'+G.year,t.id)<.35);
    t.mpick={y:G.year,mid,ids:C.map(x=>x.p.id),back};
    if(back)for(const x of C){ const p=x.p; p.mor=clamp((p.mor??60)+5,0,100); for(const q of playersOf(t.id))if(q!==p&&!C.some(z=>z.p===q)&&q.isP===p.isP&&pSlot(q)===pSlot(p)&&!q.ys)q.mor=clamp((q.mor??60)-3,0,100); } } }
function aiMpickMult(p){ const t=G.teams[p.team], P=t&&t.mpick, m=G.mgr[p.team]; return P&&P.back&&P.y===G.year&&(P.ids||[]).includes(p.id)&&m&&!m.interim&&P.mid===m.id?1.3:1; }

/* --- 멘토: 시즌마다 한 번, 33세 이상 프로의식 높은 베테랑(우리 구단 제안과 같은 조건)을 젊은 선수 멘토로. 수당 5천만 --- */
function aiMentorPick(){ if(period()!=='season')return; for(const t of G.teams){ if(t.id===ME()||t.mentorY===G.year)continue; t.mentorY=G.year;
    const cur=t.id===G.user?G.mentor:((G.clubT||{})[t.id]||{}).mentor; if(cur&&cur.y===G.year)continue; if(planOf(t)==='tight'||(t.cash||0)<50)continue;
    const p=playersOf(t.id).filter(q=>{ initPers(q); return q.age>=33&&q.pers.pro>=13&&!q.foreign; }).sort((a,b)=>b.age-a.age)[0]; if(!p||!domestic(t.id).some(q=>q.age<=24))continue;
    t.cash-=50; p.mor=clamp((p.mor??60)+8,0,100); const M={id:p.id,y:G.year}; if(t.id===G.user)G.mentor=M; else { const K=G.clubT=G.clubT||{}; (K[t.id]=K[t.id]||{}).mentor=M; } } }

/* --- 보조 코치: 매달 1일 코치 시장(cmAiMonthly 끝). 시설이 줄어 정원을 넘으면 정리(잔여 연봉 절반) --- */
function aiAsstMonthly(tid,off){ const t=team(tid); if(!t||tid===ME())return; const O=orgOf(tid); const X=O.coachX=O.coachX||[]; const n=axSlots(tid);
  if(X.length>n){ for(const c of X.splice(n)){ staffHistory('coach',c,'보조 코치 계약 종료',tid,'시설 축소로 인한 정원 조정'); coachPaySev(tid,c); delete c.ax; c.yrs=0; (G.cmarket=G.cmarket||[]).push(c); } return; }
  if(X.length>=n||R()>(off?.5:.15))return; if(planOf(t)==='tight'||(t.cash||0)<0)return;
  const c=(G.cmarket||[]).filter(c=>c&&AX_ROLES.includes(c.role)&&!(typeof schMarketWhy==='function'&&schMarketWhy(c))&&c.res!==G.user&&c.age<66&&!(c.from===tid&&c.fromY===G.year)&&!(c.bid&&c.bid.exp>=G.day)&&(c.dv||0)>=55&&cmCanPay(t,c,null)).sort((a,b)=>(b.dv||0)-(a.dv||0))[0];
  if(!c)return; G.cmarket=G.cmarket.filter(x=>x!==c); const m=dobj(G.day).m; staffCt(c,ri(1,3),off&&m>=11?G.year+1:G.year); c.ax=true; delete c.res; c.clan=null; X.push(c); stAttr(c); c.loy=20;
  if(typeof schStaffJoined==='function')schStaffJoined(c,tid); try{ if(c.ob)obTaken(c.ob,c); }catch(e){} staffHistory('coach',c,'보조 코치 영입',tid,`${c.yrs}년 · 연 ${money(c.sal)}`); }
