/* ===== 시즌 구간 이벤트 ===== */
function openingDay(){
  /* 시범경기 등판 순서를 지우고 개막전은 1선발부터 */
  for(const p of Object.values(G.players))if(p.isP&&p.team!=null){ delete p.lastStart; } for(const t of G.teams)t.rot=0;
  for(const t of G.teams) G.sea.fspend[t.id]=sum(forPayOf(t.id).map(p=>p.sal))+fDeadOf(t.id,G.year); /* 개막 전에 방출한 선수의 보장 연봉 포함 */
  { const v=G.teams.filter(t=>t.id!==ME()).map(t=>G.sea.fspend[t.id]||0); G.lgFor=G.lgFor||{}; G.lgFor[G.year]=Math.round(sum(v)/Math.max(1,v.length)); }
  const rs=G.teams.map(t=>({id:t.id,r:teamRating(t.id)})); const a=avg(rs.map(x=>x.r));
  rs.forEach(x=>team(x.id).expW=clamp(.5+(x.r-a)*.03,.36,.64));
  G.proj=rs.map(x=>({id:x.id,r:x.r+hn('proj'+G.year,x.id)*.7})).sort((p,q)=>q.r-p.r).map(x=>x.id);
  note('일정',`${G.year} 시즌 개막입니다. 전력분석팀 예상 순위 ${G.proj.indexOf(G.user)+1}위.`);
  if(!(G.goals&&G.goals.y===G.year&&G.goals.fd))setGoals(); news('분석',`${G.year} 시즌 전망: ${tshort(G.user)} ${G.proj.indexOf(G.user)+1}위 예상`,`전문가들은 ${tname(G.user)}을(를) ${G.proj.indexOf(G.user)+1}위 전력으로 봅니다.`,0);
}
function recoverAll(n){ const rb=1+facImpact(facOf('rehab'))*.06; for(const p of Object.values(G.players)){ if(p.team==null||!p.fat)continue; p.fat=Math.max(0,p.fat-n*(p.isP?15.4+(p.r.sta-45)*.2:2.5+(p.r.vit||52)*.08)*(p.team===G.user?rb:facAiFat(p.team))); } }
const FORM_K=.4; /* 시즌 컨디션·타구 운의 크기(능력과 무관한 한 해의 흔들림). 1이면 타구 운(확률상 어쩔 수 없는 흔들림) 위에 한 해 컨디션이 크게 얹혀 능력과 기록이 너무 어긋났다 */
function rollForm(){ G.formY=G.year; for(const p of Object.values(G.players)){ if(p.team==null)continue; const sd=p.foreign?3.0:p.age>=33?2.4:2.0; const x=R(); /* 9%는 한 해 크게 부진하고 6%는 커리어 하이를 찍는다 */ const v0=x<.09?N(-4.2,1.1):x<.15?N(3.4,1):N(0,sd); p.sf={y:G.year,v:clamp(v0*FORM_K,-6.5,6),m:0,lk:clamp(N(0,.012)*FORM_K,-.03,.03)}; p.wear=0; p.fat=0; p.l10=[]; } }
function campSnap(){ const o={}; for(const p of domestic(G.user).concat(foreignOf(G.user)))o[p.id]={o:Math.round(ovr(p)*10)/10,r:Object.assign({},p.r)}; return o; }
function campStart(){ rollForm(); try{ for(const t of G.teams)electCaptain(t.id,'새 시즌 선수단 투표'); }catch(e){} G.camp={focus:'balance',done:false,snap:campSnap()}; stop('캠프','스프링캠프가 시작되었습니다. 훈련 → 육성 탭에서 훈련 방향을 정하세요. 3월 5일에 결과가 나옵니다.'); }
const CAMP={balance:'균형',skill:'기술 훈련',fitness:'체력·부상 방지',game:'실전 감각'};
function campEnd(){
  if(!G.camp)return; const f=G.camp.focus; G.campInj=1; G.form=null; const ups=[];
  const cev=campGrowAll('spring',f); /* 모든 구단 캠프 성장·구종 추가·폼 수정(79_camps.js) */
  if(f==='fitness')G.campInj=.78; if(f==='balance')G.campInj=.92;
  if(f==='game')G.form={until:dnum(G.year,4,30),b:2};
  G.camp.done=true;
  { const ps=domestic(G.user).concat(foreignOf(G.user)).filter(p=>p.sf).map(p=>({p,v:p.sf.v+N(0,1.2)})).sort((a,b)=>b.v-a.v); if(ps.length>6)mail('코칭스태프','캠프에서 본 선수들 컨디션',`캠프 기간 코치진 눈에 몸 상태가 특히 좋아 보인 선수: ${ps.slice(0,3).map(x=>x.p.name).join(', ')}.\n\n반대로 컨디션이 올라오지 않은 선수: ${ps.slice(-3).map(x=>x.p.name).join(', ')}.\n\n같은 선수라도 해마다 몸 상태와 감이 달라 성적이 오르내립니다. 외국인 선수는 그 폭이 더 큽니다.`,{kind:'캠프'}); }
  /* 캠프 결산: 캠프 시작 때와 비교해 능력이 오르거나 내린 선수를 정리해 보낸다 */
  const snap=G.camp.snap||{}; const rows=domestic(G.user).concat(foreignOf(G.user)).filter(p=>snap[p.id]&&snap[p.id].r).map(p=>{ const S=snap[p.id]; const ch=Object.keys(p.r).map(k=>[k,Math.round((p.r[k]-(S.r[k]??p.r[k]))*10)/10]).filter(x=>Math.abs(x[1])>=.3).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])); const tot=sum(ch.map(x=>x[1])); return {p,a:Math.round(S.o),b:Math.round(ovr(p)),ch,tot}; }).filter(x=>x.ch.length);
  const up=rows.filter(x=>x.tot>0).sort((x,y)=>y.tot-x.tot), dn=rows.filter(x=>x.tot<0).sort((x,y)=>x.tot-y.tot);
  const line=x=>`${x.p.name} (${posLabel(x.p)}, ${x.p.age}세) ${x.ch.slice(0,3).map(([k,v])=>`${TOOLK[k]||k} ${v>0?'+':''}${v.toFixed(1)}`).join(', ')}${dv(x.b)!==dv(x.a)?` · 능력 ${dv(x.a)} → ${dv(x.b)}`:''}`;
  const eff=f==='skill'?'젊은 선수 기술이 집중적으로 늘었습니다. 투수들은 새 구종을 익힐 기회도 많았습니다.':f==='fitness'?'올 시즌 부상 위험이 22% 줄었습니다.':f==='game'?'4월 말까지 경기 감각이 좋습니다.':'젊은 선수 성장과 부상 방지(부상 위험 -8%)를 고르게 챙겼습니다.';
  const hd=campHeads(up,dn,cev.ev);
  mail('코칭스태프',`스프링캠프 결산: ${hd.length?hd[0].split(':')[1].trim().split('(')[0]+' 등 주목할 선수 '+hd.length+'명':up.length?`${up.length}명 능력 상승`:'능력 변화 적음'}`,`${hd.length?`주목할 선수\n${hd.join('\n')}\n\n`:''}훈련 방향: ${CAMP[f]}. ${eff}${G.camp.join?`\n(캠프 도중 ${dsh(G.camp.join)}에 합류해, 능력 변화는 합류일부터 비교합니다.)`:''}\n\n${cev.length?`눈에 띈 일\n${cev.slice(0,10).join('\n')}\n\n`:''}${up.length?`능력이 오른 선수 ${up.length}명\n${up.slice(0,12).map(line).join('\n')}${up.length>12?`\n외 ${up.length-12}명`:''}`:'능력이 눈에 띄게 오른 선수는 없습니다.'}${dn.length?`\n\n능력이 내린 선수 ${dn.length}명\n${dn.slice(0,6).map(line).join('\n')}`:''}\n\n훈련 방향과 캠프 훈련이 함께 반영된 수치입니다(캠프 시작일 대비).`,{kind:'캠프',imp:true,acts:[{l:'선수단 보기',a:'go',v:'roster:glance'}]});
}
function seasonEnd(){
  updateLg(G.year); try{ _pjC={}; projFit(true); projFit(false); }catch(e){} /* 올 시즌 능력→성적 식을 시즌 끝 상태로 남긴다(다음 시즌 초 예측용) */ try{ cOptAsk(); }catch(e){} /* 구단 연장 옵션 결정(스토브리그 전) */
  const st=standingsNow(); const s=st.map(x=>x.tid); const two0=pctEq(st[0],st[1])&&!(st[2]&&pctEq(st[1],st[2]));
  stop('일정',`정규시즌이 끝났습니다. 우리 구단 ${tieRank(st,G.user)}위. ${two0?`1위는 ${tname(s[0])}·${tname(s[1])} 결정전으로 정합니다.`:`1위 ${tname(s[0])}.`}`); /* 공동 1위면 결정전 전에 1위를 발표하지 않는다(검수 11-07) */
  G.ps={seeds:s.slice(0,5),order:st,res:{},round:'wc',done:false};
  G.ps.upg=[]; for(const x of s.slice(0,st.length>5&&pctEq(st[4],st[5])&&!(st[3]&&pctEq(st[3],st[4]))&&!(st[6]&&pctEq(st[5],st[6]))?6:5)){ /* 5위 결정전에 들어가는 6위도 같은 날 최정예 엔트리(검수 11-07) */ G.ps.upg.push(x.tid??x); try{ entryUpgrade(x.tid??x,playersOf(x.tid??x).filter(canUp),'포스트시즌 최정예'); }catch(e){} } /* 가을야구는 가장 강한 엔트리로 */
  /* KBO: 1위·5위가 승률 같으면 결정전 한 경기(상대 전적 우위 팀 홈). 그 밖의 순위는 상대 전적·다득점으로 정한다 */
  const two=i=>pctEq(st[i],st[i+1])&&!(st[i-1]&&pctEq(st[i-1],st[i]))&&!(st[i+2]&&pctEq(st[i+1],st[i+2])); /* KBO: 결정전은 두 팀 동률일 때만. 세 팀 이상이면 상대 전적·상대 경기 다득점·전년도 순위로 정한다(검수 11-08) */
  const tbq=[]; if(two(0))tbq.push([0,s[0],s[1]]); if(st.length>5&&two(4))tbq.push([4,s[4],s[5]]); G.ps.tbq=tbq;
  if(tbq.length){ const q=tbq.shift(); G.ps.round='tb'; G.ps.tbPos=q[0]; G.ps.cur=mkSeries('tb',q[1],q[2],G.day+1); note('일정',`${q[0]+1}위 결정전: ${tname(q[1])} - ${tname(q[2])} (${tshort(q[1])} 홈)`); }
  else G.ps.cur=mkSeries('wc',s[3],s[4],G.day+2);
  if(G.ps.round==='wc')try{ psSeedNews(); }catch(e){ console.error(e); }
  for(const t of G.teams)try{ entryManage(t.id,false,true); }catch(e){} /* 포스트시즌에 들어가는 날 바로 엔트리를 기본 한도로 */
}
function mkSeries(round,hi,lo,start){
  const off={tb:[0],wc:[0,1],spo:[0,1,3,4,6],po:[0,1,3,4,6],ks:[0,1,3,4,5,7,8]}[round];
  const homes={tb:[hi],wc:[hi,hi],spo:[hi,hi,lo,lo,hi],po:[hi,hi,lo,lo,hi],ks:[hi,hi,lo,lo,lo,hi,hi]}[round];
  const need={tb:[1,1],wc:[1,2],spo:[3,3],po:[3,3],ks:[4,4]}[round];
  return {round,hi,lo,wh:0,wl:0,days:off.map(x=>start+x),homes,need,gi:0};
}
function psOursOn(d){ const P=G.ps; const s=P&&!P.done&&P.cur; return !!(s&&s.days[s.gi]===d&&(s.hi===G.user||s.lo===G.user)); }
/* 앞으로 열릴 우리 포스트시즌 경기(지금 시리즈의 남은 날짜). 시리즈가 일찍 끝나면 그 뒤 날짜는 빠진다. 반환: {home, op, n(차전)} */
function psOursAt(d){ const P=G.ps; const s=P&&!P.done&&P.cur; if(!s||!(s.hi===G.user||s.lo===G.user)||!s.days)return null; const i=s.days.indexOf(d); if(i<s.gi||i<0)return null; const h=s.homes?s.homes[i]:s.hi; return {home:h===G.user,op:s.hi===G.user?s.lo:s.hi,n:i+1,round:s.round}; }
function psOursTxt(){ const s=G.ps&&G.ps.cur; if(!s)return '우리 경기'; const op=s.hi===G.user?s.lo:s.hi; return `${ROUNDK[s.round]} ${s.gi+1}차전(${tshort(op)}전)`; }
const ROUNDK={tb:'순위 결정전',wc:'와일드카드 결정전',spo:'준플레이오프',po:'플레이오프',ks:'한국시리즈'};
function psDay(day){
  const P=G.ps, s=P.cur; if(!s||s.days[s.gi]!==day)return;
  const h=s.homes[s.gi], a=h===s.hi?s.lo:s.hi;
  const hiL=s.need[0]-s.wh, loL=s.need[1]-s.wl; /* 남은 승수: 한쪽이 1승만 남으면 다른 쪽은 탈락 위기, 둘 다 1승이면 최종전 */
  const g=simGame(day,h,a,{elim:hiL===1||loL===1,fin:hiL===1&&loL===1,elimT:[...(hiL===1?[s.lo]:[]),...(loL===1?[s.hi]:[])]}); /* 탈락 위기는 팀마다(검수 11-07) */ applyGame(day,h,a,g,true); rivalAfterGame(day,h,a,g,true);
  let win=g.score.h>g.score.a?h:g.score.a>g.score.h?a:null;
  if(win===s.hi)s.wh++; else if(win===s.lo)s.wl++;
  if(!s.gi)s.pts=[]; if(s.pts)s.pts.push([g.score.h,g.score.a]); /* 차전별 점수(홈:원정, 대진표). 1차전부터 센 시리즈만 남겨 옛 저장과 어긋나지 않게 */
  s.gi++;
  if(h===G.user||a===G.user){ const rec=gameRecord(day,h,a,g,`${ROUNDK[s.round]} ${s.gi}차전`); keepGame(rec); ulog(rec); G.res={i:0}; prAfterGame(rec); try{ gmAttendResult(rec); }catch(e){} }
  let done=null; if(s.wh>=s.need[0])done=[s.hi,s.lo]; else if(s.wl>=s.need[1])done=[s.lo,s.hi];
  else if(s.round==='wc'&&s.wl+(s.days.length-s.gi)<s.need[1])done=[s.hi,s.lo]; /* 와일드카드: 5위가 남은 경기를 다 이겨도 2승이 안 되면(무승부 포함) 1승을 안고 시작한 4위가 올라간다 */
  else if(s.gi>=s.days.length){ /* 무승부로 일정이 끝났는데 아무도 필요한 승수에 못 닿으면: 와일드카드는 1승을 안고 시작한 상위 팀이 올라가고, 나머지 시리즈는 다음 날 한 경기 더 한다(무승부는 승수에 넣지 않는다) */
    if(s.round==='wc')done=[s.hi,s.lo]; else if(s.days.length>=40&&s.wh!==s.wl)done=s.wh>s.wl?[s.hi,s.lo]:[s.lo,s.hi]; /* 필요한 승수(한국시리즈 4승)를 채울 때까지 더 한다. 40경기는 무한 반복 방지용 안전장치(검수 11-07) */ /* 승수가 같으면(0승 0패 포함) 상위 시드에게 주지 않고 승부가 날 때까지 한 경기씩 더 한다(검수 11-06) */
    else { s.days.push(s.days[s.days.length-1]+1); s.homes.push(s.homes[s.homes.length-1]===s.hi?s.lo:s.hi); /* 추가 경기는 홈을 번갈아(검수 11-07) */ if(h===G.user||a===G.user)note('포스트시즌',`${ROUNDK[s.round]}: ${win==null?'무승부로 ':'앞선 무승부 때문에 '}${s.wh}승 ${s.wl}패. ${dmd(s.days[s.days.length-1])}에 ${s.gi+1}차전을 더 합니다.`); } }
  if(done){ P.res[s.round]=[done[0],done[1],done[0]===s.hi?s.wh:s.wl,done[0]===s.hi?s.wl:s.wh]; (P.resD=P.resD||{})[s.round]=day; (P.days=P.days||{})[s.round==='tb'?'tb'+P.tbPos:s.round]={d:s.days.slice(0,s.gi),h:s.homes.slice(0,s.gi),...(s.pts?{p:s.pts.slice(0,s.gi)}:{})}; /* 치른 차전 날짜·홈(대진표) */ /* 시리즈가 끝난 날(팬 게시판 등) */
    const msg=s.round==='wc'&&!P.res.wc[2]&&!P.res.wc[3]?`${ROUNDK.wc}: 무승부로 끝나 1승을 안고 시작한 ${tname(done[0])}이(가) 준플레이오프에 올랐습니다.`:s.round==='wc'&&P.res.wc[2]===P.res.wc[3]?`${ROUNDK.wc}: ${P.res.wc[2]}승 ${P.res.wc[3]}패로 비겨 1승을 안고 시작한 ${tname(done[0])}이(가) 준플레이오프에 올랐습니다.`:`${ROUNDK[s.round]}: ${tname(done[0])}이(가) ${P.res[s.round][2]}승 ${P.res[s.round][3]}패로 이겼습니다.`; /* 와일드카드 무승부 진출(검수 11-07) */
    (done.includes(G.user)?stop:note)('포스트시즌',s.round==='tb'?`${P.tbPos+1}위 결정전: ${tname(done[0])}이(가) 이겨 ${P.tbPos+1}위, ${tname(done[1])}은(는) ${P.tbPos+2}위입니다.${P.tbPos===4&&done[1]===G.user?' 우리 구단은 가을야구에 나가지 못합니다.':''}`:msg+(done[1]===G.user?' 우리 구단의 포스트시즌은 여기서 끝났습니다.':done[0]===G.user&&s.round!=='ks'?' 우리 구단이 다음 시리즈에 올랐습니다.':''));
    if(s.round==='tb'){ const i=P.tbPos; if(done[0]!==P.order[i].tid){ const a=P.order[i]; P.order[i]=P.order[i+1]; P.order[i+1]=a; } P.seeds=P.order.slice(0,5).map(x=>x.tid); delete P.res.tb; { const dk=P.days&&P.days['tb'+i]; (P.tbRes=P.tbRes||[]).push({pos:i+1,w:done[0],l:done[1],d:dk&&dk.d?dk.d.slice(-1)[0]:G.day,p:dk&&dk.p?dk.p.slice(-1)[0]:null}); } /* 대진표에서 결정전 날짜·점수를 보여 준다(검수 11-07) */ if(i===4&&P.seeds.includes(done[0])){ P.upg=P.upg||[]; if(!P.upg.includes(done[0])){ P.upg.push(done[0]); try{ entryUpgrade(done[0],playersOf(done[0]).filter(canUp),'포스트시즌 최정예'); }catch(e){} } } /* 5위 결정전 승자도 가을야구 엔트리 보강(검수 11-06) */
      if((P.tbq||[]).length){ const q=P.tbq.shift(); const hi=P.order[q[0]].tid, lo=P.order[q[0]+1].tid; P.tbPos=q[0]; P.cur=mkSeries('tb',hi,lo,day+1); } else { P.round='wc'; P.cur=mkSeries('wc',P.seeds[3],P.seeds[4],day+2); try{ psSeedNews(); }catch(e){ console.error(e); } } return; } /* 결정전 승자가 그 순위를 갖는다 */
    const nx={wc:['spo',P.seeds[2]],spo:['po',P.seeds[1]],po:['ks',P.seeds[0]]}[s.round];
    try{ psOutNews(s.round,P.res[s.round]); }catch(e){ console.error(e); }
    if(nx){ P.round=nx[0]; P.cur=mkSeries(nx[0],nx[1],done[0],day+2); }
    else { P.done=true; P.cur=null; P.champ=done[0]; P.runner=done[1]; P.finDay=day+2; stop('포스트시즌',`${tname(done[0])}이(가) 한국시리즈 우승을 차지했습니다.${done[0]===G.user?' 우리 구단이 정상에 올랐습니다.':''}`); try{ champCelebrate(); }catch(e){ console.error(e); } try{ titleNews(done[0],done[1]); }catch(e){ console.error(e); } }
  }
}
/* 상한 초과(경쟁균형세)는 세금과 별개로 구단주가 부담으로 본다: 초과 폭만큼 신뢰 점수가 깎이고(상한의 10% 초과면 -4, 25% 넘으면 -10), 다음 시즌 모기업 지원 한도가 초과분의 절반만큼 준다. 신뢰 감점 값을 돌려준다(결산이 더한다) */
function capOverOwner(u,y){ const ci=capInfo(u.id); if(!(ci.over>0)||u.indie||G.unemp)return 0; const r=ci.over/ci.cap, pen=-clamp(Math.round(r*40),2,10);
  const cut=Math.round(ci.over*.5); const prev=u.supCut&&u.supCut.y===y+1?u.supCut.amt:0; u.supCut={y:y+1,amt:prev+cut};
  mail('구단주실',`상한 초과: 다음 시즌 모기업 지원 한도 ${money(cut)} 축소`,`상위 40명 연봉이 상한을 ${money(ci.over)}(${Math.round(r*100)}%) 넘었습니다. 경쟁균형세와 별도로, 모기업은 "규정을 넘겨 가며 쓴 돈은 구단이 책임지라"며 ${y+1}시즌 지원 한도를 ${money(cut)} 줄입니다. 구단주 신뢰 ${pen}.`,{kind:'구단주'}); return pen; }
function settlement(){
  try{ asSnap(); }catch(e){} /* 시즌 연봉 규모 기록: 실행위원회 소집 요건은 시즌을 치른 연봉으로 본다 */
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
    const AT=G.sea.att&&G.sea.att[t.id]; const S=stadOf(t.id); const SPj=stadProj(t.id); const att=SPj.att||Math.round(1e6*t.market*(.62+t.pop*.38+(wp-.5)*1.4)*fanM);
    const mkt=t.id===ME()?G.marketing:2000; /* 야인 기간 전 소속 구단은 AI 구단과 같은 방식(스폰서·마케팅)으로 결산한다 */
    const ci=capInfo(t.id);
    let tax=0; if(ci.over>0){ const n=(t.capOver||0)+1; tax=Math.round(ci.over*capRate(n)); t.capOver=n; if(n>=3)t.pickPen=G.year+1; /* KBO 규정: 3회 연속 초과면 다음 해 1라운드 지명 순서 9단계 하락 */ } else t.capOver=0;
    let flo=0; if(G.year>=2027){ const under=ci.floor-ci.pay; if(under>0){ const n=(t.floorUnder||0)+1; flo=Math.round(under*floorRate(n)); t.floorUnder=n; } else t.floorUnder=0; }
    const champBonus=(ps.champ===t.id&&!t.indie)?Math.round(pool*.5*(t.owner==='profit'?.6:1)):0;
    const EI=ecoIdx(y); const inc=[['입장 수입',SPj.att?SPj.ticket:Math.round(att*TICKET*EI*PRICE[S.price].m)] /* 경기마다 그때 가격으로 쌓은 수입(stadGame) */,['구장 부대 수입',Math.max(0,SPj.att?SPj.fnb:Math.round(att*.0003*(S.lv.fnb-2)))+SPj.prem+SPj.ad] /* 경기별로 그때 시설 단계로 쌓은 값(예산 전망 stadProj와 같은 장부, 검수 11-07). 돔구장 비시즌 대관(예산 전망 stadProj와 같은 값: 6단계 이상은 stadPower로 체감) */,['중계권 배분',Math.round(9000*EI*asRev())],['광고·상품',Math.round((2200*EI+mkt*1.6)*t.market*t.pop*adM)]]; { const si=starIncome(t.id); if(si>0)inc.push(['스타 마케팅',si]); } { const ct=G.sea.cut&&G.sea.cut[t.id]; if(ct>0)inc.push(['연봉 감액(고액 연봉 선수 2군 체류)',Math.round(ct)]); } /* KBO: 연봉 3억 이상 선수가 1군에 없으면 하루 1/600 감액 */
    if(t.id===ME()){ const sp=sponSettle(y,ps); if(sp.base)inc.push(['스폰서 계약',sp.base]); if(sp.bonus)inc.push(['스폰서 성과 보너스',sp.bonus]); } else if(G.sponT&&G.sponT[t.id]&&(Object.values(G.sponT[t.id].c||{}).some(c=>c.y0<=y&&c.until>=y)||(G.sponT[t.id].cutL||[]).some(c=>c.until===y))){ const S0=G.sponT[t.id]; const sp=sponSettle(y,ps,t.id,S0); const live=new Set(Object.keys(S0.c||{}).filter(k=>S0.c[k].y0<=y&&S0.c[k].until>=y)); const cutF=k=>{ const c=(S0.cutL||[]).find(x=>x.slot===k&&x.until===y); return c?1-(c.cutF||0):1; }; /* 해지 전까지는 계약 몫이 이미 결산에 있으니 AI 대체 수입은 해지 뒤 기간만(검수 11-07) */ const ai=Math.round(sum(Object.keys(SPON_SLOT).filter(k=>!SPON_SLOT[k].indie&&!live.has(k)).map(k=>SPON_SLOT[k].b*cutF(k)))*ecoIdx()*sponVal(t.id)*.85); if(sp.base)inc.push(['스폰서 계약',sp.base]); if(ai)inc.push(['스폰서',ai]); if(sp.bonus)inc.push(['스폰서 성과 보너스',sp.bonus]); if(t.indie&&!live.has(Object.keys(SPON_SLOT).find(k=>SPON_SLOT[k].indie)))inc.push(['메인 스폰서',Math.round(10500*EI)]); for(const k of Object.keys(S0.c||{}))if(S0.c[k].until<=y)delete S0.c[k]; } /* 단장이 떠난 구단: 남은 계약·해지 정산은 계약대로, 빈 자리는 AI 구단처럼 채운다. 끝난 계약은 지워 다음 해부터 AI 수입으로(검수 11-06) */ /* 단장이 떠나도 그 구단이 맺은 계약대로 */ else { if(t.indie)inc.push(['메인 스폰서',Math.round(10500*EI)]); inc.push(['스폰서',sponAI(t.id)]); } 
    if(share[t.id])inc.push(['포스트시즌 배당금',share[t.id]]);
    if(champBonus)inc.push(['모기업 우승 보너스',champBonus]);
    const scoutCost=t.id===G.user?Math.round(scoutSpent())+600:(G.lgStaff&&G.lgStaff[t.id]?stAiPay(G.lgStaff[t.id])+600:1500); /* AI도 실제 고용한 스태프 연봉만큼 */
    const exp=[['국내 선수 연봉',ci.all],['외국인 선수 연봉',G.sea.fspend[t.id]||0],['구단 운영비',Math.round((t.indie?19000:24000)*EI)],['스카우트 운영',scoutCost],['마케팅',mkt]];
    if(tax)exp.push(['경쟁균형세(야구발전기금)',tax]);
    { const bn=G.sea.bonus&&G.sea.bonus[t.id]; if(bn)exp.push(['신인 계약금',bn]); }
    { const due=newStadDue(t.id); if(due){ exp.push(['신구장 분담금',due]); if(!t.indie)inc.push(['모기업 신구장 출자(분담금의 70%)',Math.round(due*.7)]); /* 독립구단은 모기업 출자 없음 */ { const N=newStadAcct(t.id); N.paid=(N.paid||0)+due; if(N===stadOf(t.id).debt&&N.paid>=N.cost)delete stadOf(t.id).debt; } } }
    { const up=SPj.up; if(up>0)exp.push(['구장 시설 유지비',up]); } /* 경기별 집계(검수 11-07) */
    if(t.id!==ME()){ const fu=aiFacUpExtra(t); if(fu>0)exp.push(['훈련 시설 유지비(증설분)',fu]); }
    if(flo)exp.push(['하한 미달 발전기금',flo]);
    if(t.id===ME()){ const gs=myCPay(); if(gs>0)exp.push(['단장 연봉',gs]); }
    if(t.id===G.user&&G.unemp)G.spend={mgr:0,coach:0,med:0,hosp:0,dev:0,intl:0,fac:0,etc:0,scout:0}; /* 야인 기간: 전 소속 구단은 AI 구단처럼 운영비 안에서 스태프·감독 비용을 처리한다(따로 더 내지 않는다) */
    if(t.id!==G.user){ const o=optSettle(t.id); if(o>0)exp.push(['계약 옵션 지급',o]); } /* AI도 달성한 옵션을 낸다 */
    if(t.id===G.user){ const S=G.spend; [['감독 연봉',S.mgr],['코치진 연봉',S.coach||0],['부상 방지 프로그램',S.med],['병원 제휴',S.hosp],['해외 연수',S.dev],['해외 스카우트망',S.intl||0],['전력분석원 연봉',S.data||0],['훈련 시설 유지비',S.fac||0],['단장 결정 지출',S.etc||0],['팬 마케팅·구단 이벤트',S.fan||0],['FA 보상금·양도금',S.comp||0],['방출 정산금',S.rel||0],['FA·다년 계약금',S.faB||0],['계약 옵션 지급',optSettle(t.id)]].forEach(x=>{ if(x[1]>0)exp.push([x[0],Math.round(x[1])]); }); if(S.compIn>0)inc.push(['보상금·양도금 수령',Math.round(S.compIn)]); if(S.fanIn>0)inc.push(['구단 이벤트·채널 수입',Math.round(S.fanIn)]); if(S.postIn>0)inc.push(['포스팅 수입',Math.round(S.postIn)]); if(S.devRef>0)inc.push(['연수비 환급',Math.round(S.devRef)]); G.spend={mgr:0,coach:0,med:0,hosp:0,dev:0,intl:0,fac:0,etc:0,scout:0}; }
    const gap=sum(exp.map(x=>x[1]))-sum(inc.map(x=>x[1]));
    let support=0; const supCap=supportCap(t);
    /* 구단 보유 현금이 30억을 넘으면 적자의 일부(초과분의 절반까지)를 먼저 자체 자금으로 메운다 */
    const selfC=gap>0?Math.min(gap,Math.max(0,t.cash-3000)*.5):0;
    if(!t.indie&&gap-selfC>0){ support=Math.min(gap-selfC,supCap); inc.push(['모기업 지원(적자 보전)',support]); }
    if(selfC>0)fins_self[t.id]=Math.round(selfC);
    /* AI 구단 부채 정리: 지원이 적자만 메우면 FA 보상금·방출 위약금으로 생긴 마이너스 현금이 영영 회복되지 않는다.
       모기업이 부채의 45%를 갚아 준다(남은 지원 한도 + 30억까지, 독립구단은 투자사 증자 60억까지). 빚이 깊으면 FA 영입을 끊고 고액 선수를 넘기므로(aiDebtDump) 2~4년이면 0 근처로 돌아온다 */
    let relief=0; if(t.id!==ME()&&t.cash+sum(inc.map(x=>x[1]))-sum(exp.map(x=>x[1]))<0){ const debt=-(t.cash+sum(inc.map(x=>x[1]))-sum(exp.map(x=>x[1])));
      relief=Math.round(t.indie?Math.min(debt*.45,6000):Math.min(debt*.45,Math.max(0,supCap-support)+3000)); if(relief>0){ inc.push([t.indie?'투자사 증자(부채 정리)':'모기업 지원(부채 정리)',relief]); support+=t.indie?0:relief; } }
    const net=sum(inc.map(x=>x[1]))-sum(exp.map(x=>x[1]));
    t.cash+=net;
    /* 독립구단은 이익이 쌓이면 투자사가 배당으로 가져간다(80억 초과분의 절반) */
    let div=0; if(t.indie&&t.cash>8000){ div=Math.round((t.cash-8000)*.5); t.cash-=div; if(t.id!==ME())wire('구단',`${t.city} ${t.nick} 투자사, 배당 ${money(div)} 회수`,{tid:t.id}); }
    /* 모기업 지원 조정: 구단에 쓰지 않은 돈이 쌓여 있으면, 다음 시즌 모기업 지원 한도를 그만큼 줄인다(돈을 가져가지는 않는다).
       50억(경제 지수 반영)을 넘는 부분의 35~60%, 수익형 구단주가 가장 많이 줄인다. 쌓인 돈은 구단이 그대로 쓸 수 있다 */
    let cut0=t.supCut&&t.supCut.y===y?t.supCut.amt:0;
    if(!t.indie){ const th=Math.round(5000*EI); t.supCut=null; if(t.cash>th){ const r=t.owner==='profit'?.6:t.owner==='pr'?.45:.35; const cut=Math.min(Math.round((t.cash-th)*r),Math.round(16000*EI*.8)); t.supCut={y:y+1,amt:cut};
      if(t.id===ME())mail('구단주실',`다음 시즌 모기업 지원 한도 ${money(cut)} 축소`,`구단 보유 현금이 ${money(t.cash)}으로 ${money(th)}을(를) 넘었습니다. 모기업은 "구단에 쓰지 않은 돈이 있으니 그만큼 지원을 줄이겠다"며 ${y+1}시즌 지원 한도를 ${money(cut)} 줄입니다. 돈을 가져가지는 않습니다. 쌓인 돈은 시설 투자나 선수 영입에 그대로 쓸 수 있습니다.`,{kind:'구단주'}); } }
    /* 시설 관리: 빚이 크면 유지·보수를 미뤄 시설 하나가 한 단계 낡는다(30%) */
    if(t.cash<-3000&&R()<.3){ try{ facNeglect(t); }catch(e){} }
    t.pop=clamp(1+(t.pop-1)*.85+(wp-.5)*.5+(mkt-2000)/45000+(ps.champ===t.id?.06:0)+(G.mgr[t.id]&&G.mgr[t.id].fame>=70?.03:0)+localStarPop(t.id),.7,1.45);
    fins[t.id]={att,inc,exp,net,cash:t.cash,tax,support,supCap,supCut:cut0,selfC:fins_self[t.id]||0,div};
  }
  try{ clubRescue(y); }catch(e){}
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
  { const pen=capOverOwner(u,y); if(pen){ delta+=pen; why.push([`샐러리캡 초과(${Math.round(capInfo(G.user).over/capInfo(G.user).cap*100)}%)`,pen]); } }
  const gy=goalYearEnd(order.findIndex(x=>x.tid===G.user)+1,fin); delta+=gy.d; why.push(['구단주 목표(순위·재정·여론)',gy.d]); const pz=(G.pr?(G.pr.press-50)/10:0); delta+=pz; why.push(['언론 논조',pz]);
  delta=Math.round(delta); const before=u.trust; u.trust=clamp(u.trust+delta,0,100);
  const notes=[];
  for(const tr of G.trades.filter(x=>x.y===y&&!x.revealed)){ tr.revealed=true; if(tr.diff>7){ const t=team(tr.with); t.rel=clamp(t.rel-6,0,100); notes.push(`${tname(tr.with)} 단장이 지난 트레이드에서 손해를 봤다고 판단해 관계가 나빠졌습니다.`);} }
  const lines=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(h)lines.push({p,h}); }
  for(const id in (G.arch||{})){ if(G.players[id])continue; const a=G.arch[id]; try{ const h=a&&archSeason(a,y); if(h&&(h.pa||h.outs))lines.push({p:{id:+id,name:a.name,isP:a.isP,pos:a.pos,arch:a,r:a.r||{}},h}); }catch(e){} } /* 시즌 중 리그를 떠난 선수도 결산 1위에(공식 타이틀과 같게, 검수 11-08) */
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
  try{ if(!G.unemp&&typeof teleEv==='function')teleEv('season_end',{rank,champ:ps.champ===G.user?1:0,ps:P.seeds&&P.seeds.includes(G.user)?1:0,trust:team(G.user).trust}); }catch(e){}
  try{ franchiseCheck(); }catch(e){}
  try{ if(!G.unemp)seasonReview(y); }catch(e){}
  storySeason(y); const awards=seasonAwards(y); try{ seasonTitles(y); }catch(e){} try{ featSeason(y); mgrEyeReport(); }catch(e){} try{ ivPromCheck('season'); }catch(e){}
  G.history.push({y,order,champ:ps.champ,runner:ps.runner,ps:{wc:ps.wc,spo:ps.spo,po:ps.po,ks:ps.ks,days:P.days,tbRes:P.tbRes} /* 순위 결정전도 지난 대진표에 남긴다(검수 11-08) */,user:{w:uo.w,l:uo.l,t:uo.t,rank,net:fin.net,trust:u.trust}});
  { const S=G.sea, r=S.rec[G.user], mk=S.mark||{w:0,l:0,t:0}; if(r&&r.w+r.l+(r.t||0)>mk.w+mk.l+(mk.t||0)){ S.months.push({m:dobj(G.cal.end).m+'월',w:r.w-mk.w,l:r.l-mk.l,t:(r.t||0)-(mk.t||0)}); S.mark={w:r.w,l:r.l,t:r.t}; } } /* 마지막 달(9·10월) 잔여 경기도 결산에 넣는다 */
  try{ tsArchive(y); }catch(e){}
  G.last={y,order,ps,fins,trust:{before,after:u.trust,delta},notes,leaders,gate,pool,months:G.sea.months,goals:gy.lines,awards,pr:G.pr?{fan:Math.round(G.pr.fan),press:Math.round(G.pr.press)}:null};
  if(!G.unemp)try{ G.last.rep=repSeason(y,rank,ps.champ===G.user,ps.runner===G.user,delta); }catch(e){}
  if(!G.unemp)try{ myCRecord(y,rank,ps,uo); }catch(e){}
  if(u.trust<12&&!G.unemp){ firedFlow(y,`구단주 신뢰가 ${u.trust}까지 떨어져 ${y}시즌을 끝으로 경질되었습니다.`); }
  else if(!G.unemp)try{ myCSeasonEnd(y,ps); }catch(e){} /* 계약 마지막 해: 재계약 제안 또는 결별, 다른 구단 제의 */
  stop('결산',`${y}시즌 결산이 나왔습니다. ${uo.w}승 ${uo.l}패 ${rank}위, 구단주 신뢰 ${before}→${u.trust}. 신뢰 변화 내역: ${why.filter(x=>Math.abs(x[1])>=.5).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).map(x=>`${x[0]} ${x[1]>0?'+':''}${Math.round(x[1])}`).join(', ')||'변화 없음'}.`);
}


/* 시즌 팀 기록 보관: 은퇴·해외 진출로 선수 기록이 지워지고 경기 기록도 새 시즌에 비워지므로, 시즌이 끝날 때 구단별 합계를 남긴다 */
function tsArchive(y){ const T=G.teams.map(t=>({b:Object.assign({},ZB),p:Object.assign({},ZP)}));
  for(const p of Object.values(G.players)) for(const h of p.hist){ if(h.y!==y||h.lvl!=='1군'||h.t==null||!T[h.t])continue; const X=p.isP?T[h.t].p:T[h.t].b; for(const k in X)X[k]+=h[k]||0; }
  { const A=G.arch||{}; for(const id in A){ if(G.players[id])continue; const a=A[id]; for(const r of a.rows||[]){ if(r.y!==y||r.t==null||!T[r.t])continue; const X=a.isP?T[r.t].p:T[r.t].b; for(const k in X)X[k]+=r[k]||0; } } } /* 리그를 떠난 선수의 보관 기록도 그 구단 합계에 넣는다 */
  const tl=(G.sea&&G.sea.tl)||[]; T.forEach((x,i)=>{ const L=tl[i]||[]; x.rs=sum(L.map(z=>z[1])); x.ra=sum(L.map(z=>z[2])); x.g=L.length; });
  G.tsArch=G.tsArch||{}; G.tsArch[y]=T; }
/* ===== 부실 구단 정리(100년 플레이, 사용자 11-05) =====
 시즌 결산 뒤 AI 구단 현금이 -40억 아래로 2년 넘게 이어지면, KBO가 개입해 새 주인을 찾는다(실제: 해태→KIA 매각, 현대 해체→히어로즈 재창단).
 - 구단 매각: 새 모기업이 인수해 부채를 떠안고 운영 자금을 넣는다. 선수단·구장·이름·상징(팬)은 그대로
 - 재창단: 모기업을 못 찾으면 협회가 기존 구단을 정리하고 투자사가 세운 신생 구단(독립구단)이 선수단을 그대로 이어받는다
 우리 구단은 대상이 아니다(우리 구단 적자는 구단주 신뢰·경질로 다룬다) */
function clubRescue(y){ for(const t of G.teams){ if(t.id===G.user)continue; t.debtY=t.cash<-4000?(t.debtY||0)+1:0; if(t.debtY<2||R()>.6)continue;
  const debt=-t.cash, old=bossOf(t.id).own.name, rebirth=t.indie||R()<.3;
  t.bseed=y; delete G.boss[t.id]; const nb=bossOf(t.id); t.debtY=0; t.trust=60; t.supCut=null;
  if(rebirth){ t.indie=true; t.owner='profit'; t.cash=4500; }
  else { t.indie=false; t.owner=pick(['win','pr','profit']); t.cash=3500; }
  try{ t.gm=mkGM(t.id); }catch(e){}
  (G.rescues=G.rescues||[]).push({y,tid:t.id,k:rebirth?'re':'sale',debt,old,nw:nb.own.name});
  const tl=`${t.city} ${t.nick}`;
  if(rebirth){ news('리그',`${tl} 재창단… 투자사가 선수단 인수`,`누적 적자 ${money(debt)}를 감당하지 못한 기존 운영 법인이 KBO 이사회 결정으로 정리됐습니다. 투자사(대표 ${nb.own.name})가 세운 신생 법인이 선수단·구장·이름을 그대로 이어받아 ${y+1}시즌에 참가합니다. 모기업 지원이 없는 독립구단으로 운영됩니다.`,4,{fanW:2,tid:t.id}); wire('구단',`${tl}, KBO 승인 아래 재창단 (투자사 인수 · 부채 ${money(debt)} 정리)`,{tid:t.id}); }
  else { news('리그',`${tl} 매각… 새 모기업 인수`,`${old} 구단주 시절 쌓인 적자 ${money(debt)}를 정리하기 위해 구단이 매각됐습니다. 새 구단주 ${nb.own.name}는 부채를 떠안고 운영 자금을 넣기로 했습니다. 선수단과 이름은 그대로입니다.`,4,{fanW:2,tid:t.id}); wire('구단',`${tl} 매각 · 새 구단주 ${nb.own.name} (부채 ${money(debt)} 인수)`,{tid:t.id}); }
  try{ chron('lg',`${tl} ${rebirth?'재창단':'매각'}(누적 적자 ${money(debt)})`,null,t.id); }catch(e){} } }
