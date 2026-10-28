/* ===== 시즌 구간 이벤트 ===== */
function openingDay(){
  /* 시범경기 등판 순서를 지우고 개막전은 1선발부터 */
  for(const p of Object.values(G.players))if(p.isP&&p.team!=null){ delete p.lastStart; } for(const t of G.teams)t.rot=0;
  for(const t of G.teams) G.sea.fspend[t.id]=sum(foreignOf(t.id).map(p=>p.sal));
  { const v=G.teams.filter(t=>t.id!==G.user).map(t=>G.sea.fspend[t.id]||0); G.lgFor=G.lgFor||{}; G.lgFor[G.year]=Math.round(sum(v)/Math.max(1,v.length)); }
  const rs=G.teams.map(t=>({id:t.id,r:teamRating(t.id)})); const a=avg(rs.map(x=>x.r));
  rs.forEach(x=>team(x.id).expW=clamp(.5+(x.r-a)*.03,.36,.64));
  G.proj=rs.map(x=>({id:x.id,r:x.r+hn('proj'+G.year,x.id)*.7})).sort((p,q)=>q.r-p.r).map(x=>x.id);
  note('일정',`${G.year} 시즌 개막입니다. 전력분석팀 예상 순위 ${G.proj.indexOf(G.user)+1}위.`);
  if(!(G.goals&&G.goals.y===G.year&&G.goals.fd))setGoals(); news('분석',`${G.year} 시즌 전망: ${tshort(G.user)} ${G.proj.indexOf(G.user)+1}위 예상`,`전문가들은 ${tname(G.user)}을(를) ${G.proj.indexOf(G.user)+1}위 전력으로 봅니다.`,0);
}
function recoverAll(n){ const rb=1+facOf('rehab')*.06; for(const p of Object.values(G.players)){ if(p.team==null||!p.fat)continue; p.fat=Math.max(0,p.fat-n*(p.isP?10+p.r.sta*.12:2.5+(p.r.vit||52)*.08)*(p.team===G.user?rb:1)); } }
function rollForm(){ G.formY=G.year; for(const p of Object.values(G.players)){ if(p.team==null)continue; const sd=p.foreign?3.0:p.age>=33?2.4:2.0; const x=R(); /* 9%는 한 해 크게 부진하고 6%는 커리어 하이를 찍는다 */ const v0=x<.09?N(-4.2,1.1):x<.15?N(3.4,1):N(0,sd); p.sf={y:G.year,v:clamp(v0,-6.5,6),m:0,lk:clamp(N(0,.012),-.03,.03)}; p.wear=0; p.fat=0; p.l10=[]; } }
function campSnap(){ const o={}; for(const p of domestic(G.user).concat(foreignOf(G.user)))o[p.id]={o:Math.round(ovr(p)*10)/10,r:Object.assign({},p.r)}; return o; }
function campStart(){ rollForm(); try{ for(const t of G.teams)electCaptain(t.id,'새 시즌 선수단 투표'); }catch(e){} G.camp={focus:'balance',done:false,snap:campSnap()}; stop('캠프','스프링캠프가 시작되었습니다. 훈련 → 육성 탭에서 훈련 방향을 정하세요. 3월 5일에 결과가 나옵니다.'); }
const CAMP={balance:'균형',skill:'기술 훈련',fitness:'체력·부상 방지',game:'실전 감각'};
function campEnd(){
  if(!G.camp)return; const f=G.camp.focus; G.campInj=1; G.form=null; const ups=[];
  for(const p of domestic(G.user)){ if(p.age<=26&&(f==='skill'||f==='balance')){ const ks=Object.keys(p.r); const n=f==='skill'?2:1; for(let i=0;i<n;i++){ const k=pick(ks); const add=f==='skill'?rnd(.8,1.8):rnd(.4,1.0); if(p.r[k]+add<=Math.max(p.pot,ovr(p))+6)p.r[k]=clamp(p.r[k]+add,20,80);} roundR(p); } }
  if(f==='fitness')G.campInj=.78; if(f==='balance')G.campInj=.92;
  if(f==='game')G.form={until:dnum(G.year,4,30),b:2};
  G.camp.done=true;
  { const ps=domestic(G.user).concat(foreignOf(G.user)).filter(p=>p.sf).map(p=>({p,v:p.sf.v+N(0,1.2)})).sort((a,b)=>b.v-a.v); if(ps.length>6)mail('코칭스태프','캠프에서 본 선수들 컨디션',`캠프 기간 코치진 눈에 몸 상태가 특히 좋아 보인 선수: ${ps.slice(0,3).map(x=>x.p.name).join(', ')}.\n\n반대로 컨디션이 올라오지 않은 선수: ${ps.slice(-3).map(x=>x.p.name).join(', ')}.\n\n같은 선수라도 해마다 몸 상태와 감이 달라 성적이 오르내립니다. 외국인 선수는 그 폭이 더 큽니다.`,{kind:'캠프'}); }
  /* 캠프 결산: 캠프 시작 때와 비교해 능력이 오르거나 내린 선수를 정리해 보낸다 */
  const snap=G.camp.snap||{}; const rows=domestic(G.user).concat(foreignOf(G.user)).filter(p=>snap[p.id]&&snap[p.id].r).map(p=>{ const S=snap[p.id]; const ch=Object.keys(p.r).map(k=>[k,Math.round((p.r[k]-(S.r[k]??p.r[k]))*10)/10]).filter(x=>Math.abs(x[1])>=.3).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])); const tot=sum(ch.map(x=>x[1])); return {p,a:Math.round(S.o),b:Math.round(ovr(p)),ch,tot}; }).filter(x=>x.ch.length);
  const up=rows.filter(x=>x.tot>0).sort((x,y)=>y.tot-x.tot), dn=rows.filter(x=>x.tot<0).sort((x,y)=>x.tot-y.tot);
  const line=x=>`${x.p.name} (${posLabel(x.p)}, ${x.p.age}세) ${x.ch.slice(0,3).map(([k,v])=>`${TOOLK[k]||k} ${v>0?'+':''}${v.toFixed(1)}`).join(', ')}${dv(x.b)!==dv(x.a)?` · 능력 ${dv(x.a)} → ${dv(x.b)}`:''}`;
  const eff=f==='skill'?'26세 이하 선수 기술이 집중적으로 늘었습니다.':f==='fitness'?'올 시즌 부상 위험이 22% 줄었습니다.':f==='game'?'4월 말까지 경기 감각이 좋습니다.':'26세 이하 선수 성장과 부상 방지(부상 위험 -8%)를 고르게 챙겼습니다.';
  mail('코칭스태프',`스프링캠프 결산: ${up.length?`${up.length}명 능력 상승`:'능력 변화 적음'}`,`훈련 방향: ${CAMP[f]}. ${eff}\n\n${up.length?`능력이 오른 선수 ${up.length}명\n${up.slice(0,12).map(line).join('\n')}${up.length>12?`\n외 ${up.length-12}명`:''}`:'능력이 눈에 띄게 오른 선수는 없습니다.'}${dn.length?`\n\n능력이 내린 선수 ${dn.length}명\n${dn.slice(0,6).map(line).join('\n')}`:''}\n\n2군 연수 효과와 캠프 훈련이 함께 반영된 수치입니다(캠프 시작일 대비).`,{kind:'캠프',imp:true,acts:[{l:'선수단 보기',a:'go',v:'roster:glance'}]});
}
function seasonEnd(){
  updateLg(G.year);
  const st=standingsNow(); const s=st.map(x=>x.tid);
  stop('일정',`정규시즌이 끝났습니다. 우리 구단 ${st.findIndex(x=>x.tid===G.user)+1}위. 1위 ${tname(s[0])}.`);
  G.ps={seeds:s.slice(0,5),order:st,res:{},round:'wc',done:false};
  G.ps.cur=mkSeries('wc',s[3],s[4],G.day+2);
}
function mkSeries(round,hi,lo,start){
  const off={wc:[0,1],spo:[0,1,3,4,6],po:[0,1,3,4,6],ks:[0,1,3,4,5,7,8]}[round];
  const homes={wc:[hi,hi],spo:[hi,hi,lo,lo,hi],po:[hi,hi,lo,lo,hi],ks:[hi,hi,lo,lo,lo,hi,hi]}[round];
  const need={wc:[1,2],spo:[3,3],po:[3,3],ks:[4,4]}[round];
  return {round,hi,lo,wh:0,wl:0,days:off.map(x=>start+x),homes,need,gi:0};
}
const ROUNDK={wc:'와일드카드 결정전',spo:'준플레이오프',po:'플레이오프',ks:'한국시리즈'};
function psDay(day){
  const P=G.ps, s=P.cur; if(!s||s.days[s.gi]!==day)return;
  const h=s.homes[s.gi], a=h===s.hi?s.lo:s.hi;
  const g=simGame(day,h,a,true); applyGame(day,h,a,g,true);
  let win=g.score.h>g.score.a?h:g.score.a>g.score.h?a:null;
  if(win===s.hi)s.wh++; else if(win===s.lo)s.wl++;
  s.gi++;
  if(h===G.user||a===G.user){ const rec=gameRecord(day,h,a,g,`${ROUNDK[s.round]} ${s.gi}차전`); keepGame(rec); ulog(rec); G.res={i:0}; prAfterGame(rec); try{ gmAttendResult(rec); }catch(e){} }
  let done=null; if(s.wh>=s.need[0])done=[s.hi,s.lo]; else if(s.wl>=s.need[1])done=[s.lo,s.hi]; else if(s.gi>=s.days.length)done=s.wh>=s.wl?[s.hi,s.lo]:[s.lo,s.hi];
  if(done){ P.res[s.round]=[done[0],done[1],done[0]===s.hi?s.wh:s.wl,done[0]===s.hi?s.wl:s.wh];
    const msg=`${ROUNDK[s.round]}: ${tname(done[0])}이(가) ${P.res[s.round][2]}승 ${P.res[s.round][3]}패로 이겼습니다.`;
    (done.includes(G.user)?stop:note)('포스트시즌',msg+(done[1]===G.user?' 우리 구단의 포스트시즌은 여기서 끝났습니다.':done[0]===G.user&&s.round!=='ks'?' 우리 구단이 다음 시리즈에 올랐습니다.':''));
    const nx={wc:['spo',P.seeds[2]],spo:['po',P.seeds[1]],po:['ks',P.seeds[0]]}[s.round];
    if(nx){ P.round=nx[0]; P.cur=mkSeries(nx[0],nx[1],done[0],day+2); }
    else { P.done=true; P.cur=null; P.champ=done[0]; P.runner=done[1]; P.finDay=day+2; stop('포스트시즌',`${tname(done[0])}이(가) 한국시리즈 우승을 차지했습니다.${done[0]===G.user?' 우리 구단이 정상에 올랐습니다.':''}`); }
  }
}
function settlement(){
  const y=G.year; const P=G.ps; const prePop=G.teams.map(t=>t.pop);
  const order=P.order.map(x=>({tid:x.tid,w:G.sea.rec[x.tid].w,l:G.sea.rec[x.tid].l,t:G.sea.rec[x.tid].t||0}));
  const ps={wc:P.res.wc,spo:P.res.spo,po:P.res.po,ks:P.res.ks,champ:P.champ,runner:P.runner,poLose:P.res.po[1],spoLose:P.res.spo[1],wcLose:P.res.wc[1],first:order[0].tid};
  const gate=Math.round(rnd(128,162)*100), pool=Math.round(gate*.6);
  const share={}; G.teams.forEach(t=>share[t.id]=0);
  share[ps.first]+=Math.round(pool*.2); const rest=pool*.8;
  share[ps.champ]+=Math.round(rest*.5); share[ps.runner]+=Math.round(rest*.24); share[ps.poLose]+=Math.round(rest*.14); share[ps.spoLose]+=Math.round(rest*.09); share[ps.wcLose]+=Math.round(rest*.03);
  const fins={}; const fins_self={};
  for(const t of G.teams){
    const o=order.find(x=>x.tid===t.id); const wp=o.w/Math.max(1,o.w+o.l);
    const fanM=t.id===G.user&&G.pr?(0.9+G.pr.fan/500):1, adM=t.id===G.user&&G.pr?(0.85+G.pr.fan/333)*(0.95+G.pr.press/1000):1;
    const AT=G.sea.att&&G.sea.att[t.id]; const S=stadOf(t.id); const att=stadProj(t.id).att||Math.round(1e6*t.market*(.62+t.pop*.38+(wp-.5)*1.4)*fanM);
    const mkt=t.id===G.user?G.marketing:2000;
    const ci=capInfo(t.id);
    let tax=0; if(ci.over>0){ const n=(t.capOver||0)+1; tax=Math.round(ci.over*capRate(n)); t.capOver=n; if(n>=3)t.pickPen=G.year+1; } else t.capOver=0;
    let flo=0; if(G.year>=2027){ const under=ci.floor-ci.pay; if(under>0){ const n=(t.floorUnder||0)+1; flo=Math.round(under*capRate(n)); t.floorUnder=n; } else t.floorUnder=0; }
    const champBonus=(ps.champ===t.id&&!t.indie)?Math.round(pool*.5*(t.owner==='profit'?.6:1)):0;
    const inc=[['입장 수입',Math.round(att*TICKET*PRICE[S.price].m)],['구장 부대 수입',Math.max(0,Math.round(att*.0003*(S.lv.fnb-2)))+(S.lv.prem-2)*600+(S.lv.vis-2)*400],['중계권 배분',9000],['광고·상품',Math.round((2200+mkt*1.6)*t.market*t.pop*adM)]]; { const si=starIncome(t.id); if(si>0)inc.push(['스타 마케팅',si]); }
    if(t.id===G.user){ const sp=sponSettle(y,ps); if(sp.base)inc.push(['스폰서 계약',sp.base]); if(sp.bonus)inc.push(['스폰서 성과 보너스',sp.bonus]); } else { if(t.indie)inc.push(['메인 스폰서',10500]); inc.push(['스폰서',sponAI(t.id)]); } if(S.compIn>0)inc.push(['FA 보상금 수령',S.compIn]);
    if(share[t.id])inc.push(['포스트시즌 배당금',share[t.id]]);
    if(champBonus)inc.push(['모기업 우승 보너스',champBonus]);
    const scoutCost=t.id===G.user?sum(G.scouts.map(s=>s.sal))+600:1500;
    const exp=[['국내 선수 연봉',ci.all],['외국인 선수 연봉',G.sea.fspend[t.id]||0],['구단 운영비',t.indie?19000:24000],['스카우트 운영',scoutCost],['마케팅',mkt]];
    if(tax)exp.push(['경쟁균형세(야구발전기금)',tax]);
    { const bn=G.sea.bonus&&G.sea.bonus[t.id]; if(bn)exp.push(['신인 계약금',bn]); }
    { const due=newStadDue(t.id); if(due){ exp.push(['신구장 분담금',due]); inc.push(['모기업 신구장 출자(분담금의 70%)',Math.round(due*.7)]); stadOf(t.id).proj.paid=(stadOf(t.id).proj.paid||0)+due; } }
    { const up=sum(STAD_ITEMS.map(x=>STAD_UP[S.lv[x.k]]-STAD_UP[2])); if(up>0)exp.push(['구장 시설 유지비',up]); }
    if(flo)exp.push(['하한 미달 발전기금',flo]);
    if(t.id===G.user){ const S=G.spend; [['감독 연봉',S.mgr],['코치진 연봉',S.coach||0],['부상 방지 프로그램',S.med],['병원 제휴',S.hosp],['해외 연수',S.dev],['해외 스카우트망',S.intl||0],['전력분석원 연봉',S.data||0],['훈련 시설 유지비',S.fac||0],['단장 결정 지출',S.etc||0],['FA 보상금',S.comp||0],['방출 정산금',S.rel||0]].forEach(x=>{ if(x[1]>0)exp.push([x[0],Math.round(x[1])]); }); if(S.compIn>0)inc.push(['FA 보상금 수령',Math.round(S.compIn)]); G.spend={mgr:0,coach:0,med:0,hosp:0,dev:0,intl:0,fac:0,etc:0}; }
    const gap=sum(exp.map(x=>x[1]))-sum(inc.map(x=>x[1]));
    let support=0; const supCap=supportCap(t);
    /* 구단 보유 현금이 30억을 넘으면 적자의 일부(초과분의 절반까지)를 먼저 자체 자금으로 메운다 */
    const selfC=gap>0?Math.min(gap,Math.max(0,t.cash-3000)*.5):0;
    if(!t.indie&&gap-selfC>0){ support=Math.min(gap-selfC,supCap); inc.push(['모기업 지원(적자 보전)',support]); }
    if(selfC>0)fins_self[t.id]=Math.round(selfC);
    const net=sum(inc.map(x=>x[1]))-sum(exp.map(x=>x[1]));
    t.cash+=net;
    /* 독립구단은 이익이 쌓이면 투자사가 배당으로 가져간다(80억 초과분의 절반) */
    let div=0; if(t.indie&&t.cash>8000){ div=Math.round((t.cash-8000)*.5); t.cash-=div; if(t.id!==G.user)wire('구단',`${t.city} ${t.nick} 투자사, 배당 ${money(div)} 회수`,{tid:t.id}); }
    t.pop=clamp(1+(t.pop-1)*.85+(wp-.5)*.5+(mkt-2000)/45000+(ps.champ===t.id?.06:0)+(G.mgr[t.id]&&G.mgr[t.id].fame>=70?.03:0),.7,1.45);
    fins[t.id]={att,inc,exp,net,cash:t.cash,tax,support,supCap,selfC:fins_self[t.id]||0,div};
  }
  const u=team(G.user); const uo=order.find(x=>x.tid===G.user); const wp=uo.w/Math.max(1,uo.w+uo.l);
  const made=[ps.champ,ps.runner,ps.poLose,ps.spoLose,ps.wcLose].includes(G.user);
  const psPart=ps.champ===G.user?10:ps.runner===G.user?6:ps.poLose===G.user?4:made?2:-1;
  const w=OWNER[u.owner].w; const fin=fins[G.user];
  const finScore=clamp(fin.net/2500,-8,5)-(fin.supCap?(fin.support/fin.supCap-.5)*4:0);
  /* 공개된 순위 목표를 달성했으면 기대 승률 대비 평가로 깎지 않는다. 창단 첫해는 폭을 줄인다 */
  const rkNow=order.findIndex(x=>x.tid===G.user)+1; let perf=(wp-u.expW)*150*w[0]; if(G.goals&&G.goals.y===y&&rkNow<=G.goals.rank)perf=Math.max(perf,0); if(G.startY===y)perf=clamp(perf,-3,6);
  const why=[['성적(기대 승률 대비)',perf],['포스트시즌',psPart*w[1]],['수지(순이익·모기업 지원)',finScore*w[2]],['인기 변화',(u.pop-prePop[G.user])*40*w[3]]];
  let delta=sum(why.map(x=>x[1]));
  if(u.cash<0){ delta-=5; why.push(['자금 마이너스',-5]); }
  const gy=goalYearEnd(order.findIndex(x=>x.tid===G.user)+1,fin); delta+=gy.d; why.push(['구단주 목표(순위·재정·여론)',gy.d]); const pz=(G.pr?(G.pr.press-50)/10:0); delta+=pz; why.push(['언론 논조',pz]);
  delta=Math.round(delta); const before=u.trust; u.trust=clamp(u.trust+delta,0,100);
  const notes=[];
  for(const tr of G.trades.filter(x=>x.y===y&&!x.revealed)){ tr.revealed=true; if(tr.diff>7){ const t=team(tr.with); t.rel=clamp(t.rel-6,0,100); notes.push(`${tname(tr.with)} 단장이 지난 트레이드에서 손해를 봤다고 판단해 관계가 나빠졌습니다.`);} }
  const lines=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(h)lines.push({p,h}); }
  const bats=lines.filter(x=>!x.p.isP), pits=lines.filter(x=>x.p.isP);
  const top=(arr,f,flt,asc)=>arr.filter(flt).sort((a,b)=>asc?f(a)-f(b):f(b)-f(a))[0];
  const leaders=[
    ['타자 WAR',top(bats,x=>warOf(x.h,x.p),()=>true),x=>warOf(x.h,x.p).toFixed(1)],
    ['OPS',top(bats,x=>bRate(x.h).ops,x=>x.h.pa>=446),x=>fmt3(bRate(x.h).ops)],
    ['타율',top(bats,x=>bRate(x.h).avg,x=>x.h.pa>=446),x=>fmt3(bRate(x.h).avg)],
    ['홈런',top(bats,x=>x.h.hr,()=>true),x=>x.h.hr+'개'],
    ['타점',top(bats,x=>x.h.rbi,()=>true),x=>x.h.rbi+'개'],
    ['도루',top(bats,x=>x.h.sb,()=>true),x=>x.h.sb+'개'],
    ['투수 WAR',top(pits,x=>warOf(x.h,x.p),()=>true),x=>warOf(x.h,x.p).toFixed(1)],
    ['평균자책점',top(pits,x=>pRate(x.h).era,x=>x.h.outs>=432,true),x=>pRate(x.h).era.toFixed(2)],
    ['다승',top(pits,x=>x.h.w,()=>true),x=>x.h.w+'승'],
    ['탈삼진',top(pits,x=>x.h.so,()=>true),x=>x.h.so+'개'],
    ['세이브',top(pits,x=>x.h.sv,()=>true),x=>x.h.sv+'개'],
    ['홀드',top(pits,x=>x.h.hld,()=>true),x=>x.h.hld+'개'],
  ].filter(l=>l[1]).map(l=>({k:l[0],id:l[1].p.id,v:l[2](l[1]),nm:l[1].p.name,t:l[1].h.t??l[1].p.team}));
  const rank=order.findIndex(o=>o.tid===G.user)+1;
  if(!G.unemp){ const psr=ps.champ===G.user?' · 한국시리즈 우승':ps.runner===G.user?' · 한국시리즈 준우승':ps.poLose===G.user?' · 플레이오프 진출':ps.spoLose===G.user?' · 준플레이오프 진출':ps.wcLose===G.user?' · 와일드카드 진출':''; chron('season',`${uo.w}승 ${uo.l}패${uo.t?` ${uo.t}무`:''} ${rank}위${psr}`); }
  try{ franchiseCheck(); }catch(e){}
  try{ if(!G.unemp)seasonReview(y); }catch(e){}
  storySeason(y); const awards=seasonAwards(y); try{ featSeason(y); mgrEyeReport(); }catch(e){} try{ ivPromCheck('season'); }catch(e){}
  G.history.push({y,order,champ:ps.champ,runner:ps.runner,user:{w:uo.w,l:uo.l,t:uo.t,rank,net:fin.net,trust:u.trust}});
  { const S=G.sea, r=S.rec[G.user], mk=S.mark||{w:0,l:0,t:0}; if(r&&r.w+r.l+(r.t||0)>mk.w+mk.l+(mk.t||0)){ S.months.push({m:dobj(G.cal.end).m+'월',w:r.w-mk.w,l:r.l-mk.l,t:(r.t||0)-(mk.t||0)}); S.mark={w:r.w,l:r.l,t:r.t}; } } /* 마지막 달(9·10월) 잔여 경기도 결산에 넣는다 */
  try{ tsArchive(y); }catch(e){}
  G.last={y,order,ps,fins,trust:{before,after:u.trust,delta},notes,leaders,gate,pool,months:G.sea.months,goals:gy.lines,awards,pr:G.pr?{fan:Math.round(G.pr.fan),press:Math.round(G.pr.press)}:null};
  if(!G.unemp)try{ G.last.rep=repSeason(y,rank,ps.champ===G.user,ps.runner===G.user,delta); }catch(e){}
  if(u.trust<12&&!G.unemp){ firedFlow(y,`구단주 신뢰가 ${u.trust}까지 떨어져 ${y}시즌을 끝으로 경질되었습니다.`); }
  stop('결산',`${y}시즌 결산이 나왔습니다. ${uo.w}승 ${uo.l}패 ${rank}위, 구단주 신뢰 ${before}→${u.trust}. 신뢰 변화 내역: ${why.filter(x=>Math.abs(x[1])>=.5).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).map(x=>`${x[0]} ${x[1]>0?'+':''}${Math.round(x[1])}`).join(', ')||'변화 없음'}.`);
}


/* 시즌 팀 기록 보관: 은퇴·해외 진출로 선수 기록이 지워지고 경기 기록도 새 시즌에 비워지므로, 시즌이 끝날 때 구단별 합계를 남긴다 */
function tsArchive(y){ const T=G.teams.map(t=>({b:Object.assign({},ZB),p:Object.assign({},ZP)}));
  for(const p of Object.values(G.players)) for(const h of p.hist){ if(h.y!==y||h.lvl!=='1군'||h.t==null||!T[h.t])continue; const X=p.isP?T[h.t].p:T[h.t].b; for(const k in X)X[k]+=h[k]||0; }
  const tl=(G.sea&&G.sea.tl)||[]; T.forEach((x,i)=>{ const L=tl[i]||[]; x.rs=sum(L.map(z=>z[1])); x.ra=sum(L.map(z=>z[2])); x.g=L.length; });
  G.tsArch=G.tsArch||{}; G.tsArch[y]=T; }
