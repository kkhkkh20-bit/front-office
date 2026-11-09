/* ===== 단장 계약: 연봉·계약 기간·재계약·만료 때 다른 구단 제의 =====
 단장도 구단과 계약한 한 사람이다. 연봉은 구단이 내고(결산 지출 '단장 연봉'), 계약 마지막 해 시즌이 끝나면 구단주가 재계약 여부를 정한다.
 - 재계약 의사: 구단주 신뢰 45 이상(명성 60 이상이면 35 이상). 신뢰가 높고 우승하면 기간이 길고 인상 폭이 크다.
 - 명성 58 이상이면 계약 만료 시점에 다른 구단 제의도 온다. 수락하면 그 구단으로 옮긴다.
 - 경질되면 남은 계약 기간 연봉은 구단이 정산해 준다. 단장 연봉 수치는 게임 설정이다(실제 구단 단장 연봉은 공개되지 않는다). */
const GMC_MIN=150, GMC_MAX=700;
function myCBase(tid){ const t=team(tid); const rep=G.rep??50; let s=250+(rep-50)*4; s*=clamp(t.market||1,.8,1.3); if(t.indie)s*=.8; return Math.round(clamp(s,GMC_MIN,GMC_MAX)/10)*10; }
function myCInit(){ if(G.myC||G.unemp||G.user==null)return G.myC; let y0=G.gmSince??G.year, y1=y0+2; if(y1<G.year){ y0=G.year; y1=G.year+1; } /* 예전 저장: 지금부터 2년 계약으로 본다 */ G.myC={tid:G.user,sal:myCBase(G.user),y0,y1,earn:0,stints:[],seas:[]}; return G.myC; }
function myCLeft(){ const C=myCInit(); return C?Math.max(0,C.y1-G.year):0; }
/* 새 계약 시작(취임·이직·재계약) */
function myCStart(tid,terms,why){ const old=G.myC; const sal=terms&&terms.sal||myCBase(tid), yrs=terms&&terms.yrs||3;
  const y0=period()==='season'||period()==='post'?G.year:(dobj(G.day).m>=10?G.year+1:G.year);
  G.myC={tid,sal,y0,y1:y0+yrs-1,earn:old?old.earn:0,stints:old?old.stints:[],seas:old?old.seas:[]};
  chron('join',`${tname(tid)} 단장 계약: 연봉 ${money(sal)}, ${y0}~${y0+yrs-1}년${why?` (${why})`:''}`,null,tid); }
/* 한국시리즈가 끝났고 아직 결산 전: 그해 시즌은 이미 끝났다(결산까지 이틀) */
function myCOver(){ const P=G.ps; return !!(P&&P.done&&P.finDay!=null&&dobj(P.finDay).y===G.year&&!(G.last&&G.last.y>=G.year)); }
/* 떠나는 단장의 그해 몫 정리(이직·사임·세대 교체 공통). 시즌이 끝난 뒤면 결산을 기다리지 않고 승패·연봉·성과급·명성을 이 단장에게 닫는다(검수 11-09zb) */
function myCClose(how){ const C=G.myC; if(!C||C.tid==null)return; const per=period(), r=G.sea&&G.sea.rec&&G.sea.rec[C.tid], over=myCOver();
    /* 시즌 중 떠나면 그 구단에서 쌓은 그해 승패를 통산에 남긴다(검수 11-07: 이직하면 사라짐). 순위·우승은 시즌을 마친 구단 기준이라 part 표시 */
    const J0=G.gmJoin&&G.gmJoin.y===G.year&&G.gmJoin.tid===C.tid?G.gmJoin:null, late=!!(J0&&J0.psDone); /* 시즌이 끝난 뒤 부임했으면 그해 몫이 없다 */
    if((per==='season'||per==='post'||over&&!late)&&r&&!(J0&&J0.rec)&&!(C.seas||[]).some(s=>s.y===G.year&&s.tid===C.tid&&(!s.part||!J0))){ const J=J0; if(J)J.rec=true; /* 같은 해 같은 구단 두 번째 재임도 그 기간 승패로 남긴다(검수 11-08) */ let rk=null; try{ rk=over?G.ps.order.findIndex(x=>x.tid===C.tid)+1||null:tieRank(standingsNow(),C.tid)||null; /* 동률이면 순위표와 같은 공동 순위(검수 11-09zc) */ }catch(e){}
      (C.seas=C.seas||[]).push({y:G.year,tid:C.tid,rank:rk,w:Math.max(0,(r.w||0)-(J?J.w:0)),l:Math.max(0,(r.l||0)-(J?J.l:0)),t:Math.max(0,(r.t||0)-(J?J.t||0:0)),...(over?{ch:G.ps.champ===C.tid?1:G.ps.runner===C.tid?2:0}:{ch:0,part:1,how})}); }
    try{ const S=personalState(), fy=fyNow(), ak=fy+':'+C.tid;
      if(over&&!late&&C.tid===G.user&&C.y0<=fy&&!S.settled[fy]){ /* 끝난 시즌 연봉 전액·확정된 성과급·명성은 떠나는 단장 몫. 구단 현금에서 바로 낸다 */
        team(C.tid).cash-=C.sal; hoBook(C.tid,[],[['단장 연봉',C.sal]]); C.earn+=C.sal; personalSettle(C.sal);
        const b=myCBonus({champ:G.ps.champ,runner:G.ps.runner},G.ps.order); team(C.tid).cash-=b; if(b>0)hoBook(C.tid,[],[['단장 성과급',b]]);
        const rk=G.ps.order.findIndex(x=>x.tid===C.tid)+1; repSeason(G.year,rk,G.ps.champ===C.tid,G.ps.runner===C.tid,0); }
      else { const adv=S.advance[ak]??S.advance[fy]??0; /* 옛 저장은 연도 키만 있다: 지금 계약(떠나는 구단) 것으로 본다 */ if(adv>0&&!S.settled[fy]){ team(C.tid).cash-=adv; hoBook(C.tid,[],[['단장 연봉',adv]]); C.earn+=adv; } /* 결산 명세에도(검수 11-09x) */ delete S.advance[ak]; delete S.advance[fy]; } }catch(e){} /* 이 구단에서 이미 받은 월급은 이 구단이 낸다(검수 11-07) */ }
/* 진행 중인 재계약 제안 닫기(이직·세대 교체) */
function myCRenewClose(){ if(G.myC)delete G.myC.offer; for(const e of (G.evs||[]))if(!e.done&&e.k==='gmRenew'){ e.done=true; e.void=true; const m=(G.mail||[]).find(x=>x.id===e.mid); if(m){ m.acts=[]; m.imp=false; } } }
function myCEnd(how,y){ const C=G.myC; if(!C)return; if(C.tid!=null)myCClose(how);
  let fin=null; try{ const L=G.last; if(L&&L.fins&&L.fins[C.tid]&&L.y>=C.y0){ const o=L.order&&L.order.find(x=>x.tid===C.tid); fin={y:L.y,f:JSON.parse(JSON.stringify(L.fins[C.tid])),rank:L.order?L.order.findIndex(x=>x.tid===C.tid)+1:null,w:o?o.w:null,l:o?o.l:null,t:o?o.t||0:0}; } }catch(e){} /* 퇴임 시점의 마지막 시즌 결산: 야인이 되어도 복기할 수 있게 경력에 남긴다 */
  const ye=Math.min(C.y1,y??G.year), p=C.stints[0]; if(C.y0>ye&&p&&p.tid===C.tid&&p.how==='재계약'&&p.y1===C.y0-1){ p.how=how; p.fin=p.fin||fin; } /* 시작 전인 재계약을 끝내면 근무한 지난 계약이 떠난 계약이다(검수 11-09zb) */ else C.stints.unshift({tid:C.tid,y0:Math.min(C.y0,ye),y1:ye, /* 다음 시즌부터인 계약을 시작 전에 끝내면 끝낸 해로 적는다 */sal:C.sal,how,fin}); C.stints.length=Math.min(C.stints.length,20); C.tid=null; }
/* 결산 지출: 단장 연봉 */
function myCPay(){ const C=myCInit(); if(!C||G.unemp||C.y0>fyNow())return 0; /* 한국시리즈 뒤 부임해 다음 시즌부터 시작하는 계약은 올해 결산에 연봉이 없다(검수 11-09h) */ if(personalState().settled[fyNow()])return 0; /* 같은 회계연도 두 번째 정산: 지갑·경력 수입·구단 지출 모두 한 번만(검수 11-06) */C.earn+=C.sal;personalSettle(C.sal); return C.sal; }
/* 결산 지출: 단장 성과급(우승 30%·준우승 15%·가을야구 5%). 구단이 내고 개인 지갑으로 들어온다. 한 해 한 번 */
function myCBonus(ps,order,dry){ /* dry: 금액만 계산(예산 전망) */ const C=myCInit(); if(!C||G.unemp||C.tid!==G.user||C.bonusY===G.year||C.y0>G.year)return 0; { const J=G.gmJoin; if(J&&J.y===G.year&&J.tid===G.user&&J.psDone)return 0; } /* 가을야구가 끝난 뒤 부임했으면 그해 성과는 전임 단장 몫(경력 기록과 같은 기준, 검수 11-09h) */ const rk=(order||[]).findIndex(o=>o.tid===G.user)+1;
  const k=ps&&ps.champ===G.user?'우승':ps&&ps.runner===G.user?'준우승':rk&&rk<=5?'가을야구':null; if(!k)return 0; const b=Math.round(C.sal*{우승:.3,준우승:.15,가을야구:.05}[k]/10)*10; if(dry)return b;
  C.bonusY=G.year; C.earn+=b; personalSalary(b,`${k} 성과급`); return b; }
/* 시즌 기록(경질 판정 전에 남긴다) */
function myCRecord(y,rank,ps,uo){ const C=myCInit(); if(!C||G.unemp)return; const J=G.gmJoin&&G.gmJoin.y===y&&G.gmJoin.tid===G.user?G.gmJoin:null; if(J&&J.psDone)return; /* 시즌이 끝난 뒤 부임: 그해는 이 단장 시즌이 아니다(검수 11-09zb) */ /* 시즌 중 부임: 전임 단장 때 승패는 빼고 부임 뒤 승패만(검수 11-06) */ C.seas.push({y,tid:G.user,rank,w:uo.w-(J?J.w:0),l:uo.l-(J?J.l:0),t:(uo.t||0)-(J?J.t||0:0),ch:ps.champ===G.user?1:ps.runner===G.user?2:0}); if(C.seas.length>120)C.seas.splice(0,C.seas.length-120); }
/* 경질: 남은 기간 연봉을 구단이 정산한다 */
function myCFired(y){ const C=G.myC; if(!C||C.tid==null)return ''; const left=Math.max(0,C.y1-y); const owed=left*C.sal; if(owed>0){ team(C.tid).cash-=owed; hoBook(C.tid,[],[['단장 경질 정산금',owed]]);personalState(); C.earn+=owed;personalSalary(owed,'경질 잔여 연봉 정산'); } myCEnd('경질',y); return owed>0?` 남은 계약 ${left}년 치 연봉 ${money(owed)}을 구단이 정산합니다.`:''; }

/* 다른 구단 제의 조건 */
function myCOffer(tid,fired){ const b=myCBase(tid); let sal=Math.round(b*(fired?rnd(1,1.12):rnd(1.08,1.25))/10)*10; const cur=!G.unemp&&G.myC&&G.myC.tid!=null?G.myC.sal||0:0; if(cur)sal=Math.max(sal,Math.round(cur*rnd(1.15,1.35)/10)*10); /* 현직 단장 빼 오기: 지금 연봉보다 높게 */ return {sal,yrs:G.rep>=70?3:R()<.5?3:2}; }

/* 계약 마지막 해 결산 뒤: 구단주의 재계약 의사, 다른 구단 제의 */
function myCSeasonEnd(y,ps){ const C=myCInit(); if(!C||G.unemp||C.y1!==y)return; const t=team(G.user); const tr=t.trust, rep=G.rep??50;
  const champ=ps.champ===G.user, recent=(C.seas||[]).filter(s=>s.y>y-3&&s.ch===1).length;
  /* 명성이 높으면 다른 구단이 먼저 연락해 온다 */
  if(rep>=58){ const cands=G.teams.filter(x=>x.id!==G.user&&!(G.jobs||[]).some(j=>!j.done&&j.tid===x.id)).map(x=>({x,rk:G.last&&G.last.order?G.last.order.findIndex(o=>o.tid===x.id)+1:5,g:gmOf(x.id)})).sort((a,b)=>b.rk-a.rk+(b.g&&b.g.age>=60?2:0)-(a.g&&a.g.age>=60?2:0));
    for(const c of cands.slice(0,rep>=75?2:1)){ if(R()<.25)continue; jobOffer(c.x.id,false,myCOffer(c.x.id,false),true); } }
  const will=tr>=45||(tr>=35&&rep>=60);
  if(!will){ firedFlow(y,`${y}시즌으로 계약이 끝났고, 구단주가 재계약하지 않기로 했습니다(구단주 신뢰 ${tr}).`,'expire'); return; }
  const yrs=champ||recent>=2?4:tr>=70?3:2; const raise=(tr>=70?.15:tr>=55?.08:0)+(champ?.1:0)+(rep>=70?.05:0);
  const sal=Math.round(Math.max(GMC_MIN,Math.min(Math.max(C.sal,myCBase(G.user))*(1+raise),C.sal*1.35))/10)*10; /* 한 번에 35%까지만 오른다. 7억 상한은 기본 연봉에만: 영입 제안처럼 지금 연봉 위로 오른다(검수 11-09zb) */ const B=bossOf(G.user);
  C.offer={y,sal,yrs};
  evNew('gmRenew',`재계약 제안: 연봉 ${money(sal)}, ${yrs}년`,`${B.own.name} 회장이 재계약을 제안했습니다. "${tr>=70?'단장님 없이는 다음 시즌을 생각하기 어렵습니다.':tr>=55?'지금처럼만 해 주시면 됩니다.':'기대만큼은 아니었지만 한 번 더 맡겨 보겠습니다.'}"
지금 계약: 연봉 ${money(C.sal)}, ${C.y0}~${C.y1}년. 제안: 연봉 ${money(sal)}(${sal>=C.sal?'+':''}${Math.round((sal/C.sal-1)*100)}%), ${y+1}~${y+yrs}년.
구단주 신뢰 ${tr} · 단장 명성 ${rep}.${(G.jobs||[]).some(j=>!j.done&&j.exp0)?' 다른 구단 제의도 와 있습니다. 소식함에서 조건을 비교해 보세요.':''}`,
    [{l:'수락'+myQ('renew'),fx:`연봉 ${money(sal)}, ${yrs}년 계약.`},
     {l:'연봉 인상 요구(+15%)'+myQ('raise'),fx:'구단주 신뢰가 높을수록 받아들입니다. 거절되면 원래 조건으로 계약하고 신뢰가 조금 내려가며, 신뢰가 낮으면 제안을 거둘 수도 있습니다.'},
     {l:'재계약 거절'+myQ('leave'),fx:'계약이 끝나 구단을 떠납니다. 명성에 따라 다른 구단 제의를 기다립니다.'}],{from:'구단주실',exp:14,def:0}); }
EVH.gmRenew={ pick(e,i){ const C=G.myC; const O=C&&C.offer; if(!O||G.unemp)return ''; const t=team(G.user); delete C.offer;
  const sign=(sal)=>{ C.stints.unshift({tid:C.tid,y0:C.y0,y1:C.y1,sal:C.sal,how:'재계약'}); C.sal=sal; C.y0=O.y+1; C.y1=O.y+O.yrs; chron('join',`재계약: 연봉 ${money(sal)}, ${C.y0}~${C.y1}년`,null,G.user); return `재계약했습니다. 연봉 ${money(sal)}, ${C.y0}~${C.y1}년.`; };
  if(i===0)return sign(O.sal);
  if(i===1){ const p=clamp((t.trust-40)/60+((G.rep??50)-50)/100,.1,.9); if(R()<p){ t.trust=clamp(t.trust-1,0,100); return '구단주가 인상을 받아들였습니다. '+sign(Math.round(O.sal*1.15/10)*10)+' 신뢰 -1.'; }
    if(t.trust<55&&R()<.3){ firedFlow(O.y,`연봉 인상을 요구하자 구단주가 재계약 제안을 거뒀습니다.`,'expire'); return '구단주가 제안을 거뒀습니다. 계약이 끝나 구단을 떠납니다.'; }
    t.trust=clamp(t.trust-3,0,100); return '구단주가 인상은 어렵다고 했습니다. '+sign(O.sal)+' 신뢰 -3.'; }
  firedFlow(O.y,`${O.y}시즌으로 계약이 끝나 재계약을 고사했습니다.`,'leave'); return '재계약을 고사했습니다. 이제 다른 구단 제의를 기다립니다.'; } };
EV_KEY.add('gmRenew');
/* 새해: 계약 마지막 해 알림 */
function myCNewYear(){ const C=myCInit(); if(!C||G.unemp)return; if(C.y1===G.year)note('구단주',`올해가 단장 계약 마지막 해입니다(연봉 ${money(C.sal)}). 시즌이 끝나면 구단주가 재계약 여부를 정합니다. 구단주 신뢰 45 이상이면 재계약 제안이 오고, 명성 58 이상이면 다른 구단 제의도 올 수 있습니다.`); }
/* 단장 카드용 통산 */
function myCStats(){ const C=myCInit()||G.myC; if(!C)return null; const A=C.seas||[], fin=s=>!s.part||s.y<G.year||G.rolled===G.year; /* 시즌 중 떠난 구단 승패는 그 시즌 결산 뒤에 통산으로(검수 11-09zc: 5월 사임이 마친 시즌 1회로 셈) */ const S=A.filter(fin); const w=sum(S.map(s=>s.w)), l=sum(S.map(s=>s.l)), t=sum(S.map(s=>s.t||0));
  let now=null; if(G.rolled!==G.year){ const P=A.filter(s=>!fin(s)), r=!G.unemp&&C.tid===G.user&&G.sea&&G.sea.rec&&G.sea.rec[G.user], J=r&&G.gmJoin&&G.gmJoin.y===G.year&&G.gmJoin.tid===G.user?G.gmJoin:null; now={w:sum(P.map(s=>s.w))+(r?(r.w||0)-(J?J.w:0):0),l:sum(P.map(s=>s.l))+(r?(r.l||0)-(J?J.l:0):0),t:sum(P.map(s=>s.t||0))+(r?(r.t||0)-(J?J.t||0:0):0)}; if(!(now.w+now.l+now.t))now=null; } /* 올해 내가 치른 승패(떠난 구단 몫 포함, 결산 전까지) */
  const teams=new Set([...A.map(s=>s.tid),...(C.stints||[]).map(s=>s.tid),...(C.tid!=null?[C.tid]:[])]); /* 계약 이력이 있는 구단도 맡은 구단(검수 11-09zc) */ return {n:new Set(S.map(s=>s.y)).size, /* 시즌 중 이직한 해는 한 시즌 */w,l,t,now,pct:w+l?w/(w+l):0,ch:S.filter(s=>s.ch===1).length,ru:S.filter(s=>s.ch===2).length,ps:S.filter(s=>!s.part&&s.rank!=null&&s.rank<=5).length,teams:teams.size,chT:[...new Set(S.filter(s=>s.ch===1).map(s=>s.tid))]}; }
