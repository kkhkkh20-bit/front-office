/* ===== 올해 예산(다음 결산까지 연간 예상) ===== */
function finYearEnd(){ const y=(G.last&&G.last.y>=G.year)?G.year+1:G.year; if(y===G.year&&G.ps&&G.ps.finDay!=null)return G.ps.finDay; if(y===G.year&&G.cal&&G.cal.end)return Math.min(dnum(y,11,5),G.cal.end+30); return dnum(y,11,5); } /* 결산은 한국시리즈 이틀 뒤: 알면 그날, 모르면 정규시즌 끝 +30일로 어림 */
function budget(){ const EY=sponSeason(); /* 예산표 전체를 그 시즌 경제 지수로(검수 11-08) */ const t=team(G.user); const ci=capInfo(G.user); const S=G.spend||{}; const m=G.mgr[G.user]; prInit();
  const rem=Math.max(0,finYearEnd()-G.day)/365; const acc=(spent,annual)=>Math.round((spent||0)+annual*rem);
  const settled=G.last&&G.last.y>=G.year; const HO=G.hoL&&G.hoL[fyNow()+':'+G.user], cash=t.cash-(HO?HO.net:0); /* 같은 해 떠났다 돌아온 구단: 이직 때 정산한 수입·지출도 결산처럼 올해 예산표에(현금은 그 정산 전 기준으로, 검수 11-09x) */ const SPj=stadProj(G.user,settled); const CT=G.contract, fRe=p=>CT&&!CT.done&&(CT.foreignEnd||[]).includes(p.id)&&p.newSal!=null; /* 재계약 협상 중인 외국인은 합의(제시) 연봉으로(재계약 한도 화면과 같게, 검수 11-09x) */ const fsNow=sum(forPayOf(G.user).filter(p=>!fDropIds(G.user).includes(p.id)).map(p=>fRe(p)?p.newSal:p.sal))+fDeadOf(G.user,sponSeason()); /* 개막 전 방출 선수의 보장 연봉 포함 */
  const fs=!settled&&G.sea&&G.sea.fspend&&G.sea.fspend[G.user]!=null?G.sea.fspend[G.user]:fsNow;
  const fR=settled?fNextReserve(fRe):(G.cal&&G.day>=G.cal.open&&G.sea&&G.sea.y===G.year)?0:fReserve(); const fsB=Math.max(fs,fR);
  const intlA=sum(Object.keys(IREG).map(r=>INET[intlLv(r)].c));
  const tax=ci.over>0?Math.round(ci.over*capRate((t.capOver||0)+1)):0; const flo=sponSeason()>=2027&&ci.floor>ci.pay?Math.round((ci.floor-ci.pay)*floorRate((t.floorUnder||0)+1)):0;
  const exp=[['국내 선수 연봉',ci.all,'pay'],[fR>fs?'외국인 선수 연봉(배정 예산)':'외국인 선수 연봉',fsB,'for'],['감독 연봉',settled&&m&&(m.interim||(G.rolled===G.year&&m.yrs<=0))?Math.round((S.mgr||0)+(m.sal||0)*Math.max(0,dnum(G.year+1,1,1)-G.day)/365):acc(S.mgr,m&&!(m.cs!=null&&m.cs>EY)?m.sal:0),'mgr'] /* 다음 시즌부터 일하는 감독은 올해 전망에 넣지 않는다(검수 11-08). 계약이 끝난 감독·대행은 연말까지만(검수 11-09x) */,['코치진 연봉',acc(S.coach,G.coach?coachSal(G.user,!settled):0),'mgr'] /* 결산 전에는 다음 시즌부터인 코치를 빼고(검수 11-09x) */,['단장 연봉',(()=>{ const C=G.unemp?null:myCInit(); return C&&C.tid===G.user&&C.y0<=EY?C.sal:0; })(),'mgr'], /* 결산 때 한 해 치를 낸다(myCPay) */
    ['구단 운영비',Math.round((t.indie?19000:24000)*ecoIdx(EY)),'ops'],['스카우트 운영',Math.round(scoutSpent()+sum(G.scouts.map(s=>s.sal))*rem)+600,'ops'] /* 이미 쌓인 몫 + 남은 기간 */,['마케팅',G.marketing,'ops'],
    ['부상 방지·병원',acc((S.med||0)+(S.hosp||0),PREV[G.med.prev].c+HOSP[G.med.hosp].c),'ops'],['해외 스카우트망',acc(S.intl,intlA),'ops'],['전력분석원 연봉',acc(S.data,anaSal()),'ops'],['훈련 시설 유지비',acc(S.fac,facUpkeep()+acadFee(G.user)),'ops'],
    ['해외 연수',S.dev||0,'ops'],['구장 시설 유지비',SPj.up,'ops'],['신인 계약금',settled?0:((G.sea.bonus&&G.sea.bonus[G.user])||0),'pay'],['신구장 분담금',newStadDue(G.user),'ops'],['단장 결정 지출',S.etc||0,'ops'],['팬 마케팅·구단 이벤트',Math.round((S.fan||0)+fanMonthCost()*Math.max(0,Math.round(rem*12))+fanPeakExtra()),'ops'] /* 응원단·채널 월 운영비는 남은 달만큼(검수 11-08) */,['FA 보상금·양도금',S.comp||0,'pay'],['FA·다년 계약금',S.faB||0,'pay'],['계약 옵션(예상)',optProj(G.user,settled?G.year+1:G.year),'pay'],['방출 정산금',S.rel||0,'pay'],['경쟁균형세',tax,'pay'],['하한 미달 발전기금',flo,'pay']].filter(x=>x[1]>0);
  const r=G.sea&&G.sea.rec&&!settled?G.sea.rec[G.user]:null; const wp=r&&r.w+r.l>=10?r.w/(r.w+r.l):.5;
  const att=SPj.att;
  const inc=[['입장 수입',SPj.ticket],['중계권 배분',Math.round(9000*ecoIdx(EY)*asRev())],['광고·상품',Math.round((2200*ecoIdx(EY)+G.marketing*1.6)*t.market*t.pop*(0.85+G.pr.fan/333)*(0.95+G.pr.press/1000))]]; { const sx=Math.max(0,SPj.fnb)+SPj.prem+SPj.ad; /* 결산처럼 매점 손실은 0으로(검수 11-08) */ if(sx>0)inc.push(['구장 부대 수입',sx]); }
  { sponInit(); const sp=sponIncome(); if(sp>0)inc.push(['스폰서 계약',sp]); } { const si=starIncome(G.user); if(si>0)inc.push(['스타 마케팅',si]); } { const fi=(G.spend&&G.spend.fanIn)||0, gd=Math.min(fi,(G.spend&&G.spend.goods)||0); if(fi-gd>0)inc.push(['구단 이벤트·채널 수입',Math.round(fi-gd)]); if(gd>0)inc.push(['기념 유니폼 판매',Math.round(gd)]); } /* 기념 유니폼 수입은 fanIn 안에서 따로 보인다 */ { const due=newStadDue(G.user); if(due&&!team(G.user).indie)inc.push(['모기업 신구장 출자',Math.round(due*.7)]); } if((S.compIn||0)>0)inc.push(['보상금·양도금 수령',Math.round(S.compIn)]); if((S.tradeIn||0)>0)inc.push(['트레이드 현금 수령',Math.round(S.tradeIn)]); if((S.postIn||0)>0)inc.push(['포스팅 수입',Math.round(S.postIn)]); if((S.devRef||0)>0)inc.push(['연수비 환급',Math.round(S.devRef)]); /* 결산과 같은 항목 */
  { const P=G.ps; if(!settled&&P&&P.champ!=null&&P.res){ try{ const ord=P.order||[]; const pool=Math.round(14500*.6), rest=pool*.8; const tid=G.user; let sh=0; if(ord[0]&&ord[0].tid===tid)sh+=Math.round(pool*.2); const w=[[P.champ,.5],[P.runner,.24],[P.res.po&&P.res.po[1],.14],[P.res.spo&&P.res.spo[1],.09],[P.res.wc&&P.res.wc[1],.03]]; for(const [x,f] of w)if(x===tid)sh+=Math.round(rest*f); if(sh)inc.push(['포스트시즌 배당금(예상)',sh]); /* 입장 수익 평균으로 추정, 결산 때 확정(검수 11-07) */
    if(P.champ===tid&&!t.indie)inc.push(['모기업 우승 보너스(예상)',Math.round(pool*.5*(t.owner==='profit'?.6:1))]); const gb=myCBonus({champ:P.champ,runner:P.runner},ord,true); if(gb>0)exp.push(['단장 성과급(예상)',gb,'mgr']); /* 결산 때 낼 성과급도 전망에(검수 11-09x) */ }catch(e){} } if(!settled)try{ const sb=sponBonusEst(G.year,P&&P.champ); if(sb)inc.push(['스폰서 성과 보너스',sb]); }catch(e){} } /* 가을야구 확정·진출만으로도 진출 보너스는 전망에(우승팀 확정 전에도, 검수 11-09i) */ { const ct=!settled&&G.sea&&G.sea.cut&&G.sea.cut[G.user]; if(ct>0)inc.push(['연봉 감액(고액 연봉 선수 2군 체류)',Math.round(ct)]); } /* 이미 생긴 감액은 결산 때 돌려받는다 */ /* 결산과 같은 항목 */
  if(HO){ const add=(A,o)=>{ for(const [l,v] of Object.entries(o)){ const r=A.find(x=>x[0]===l); if(r)r[1]+=v; else A.push([l,v,'ops']); } }; add(inc,HO.inc); add(exp,HO.exp); }
  const E=sum(exp.map(x=>x[1])), I=sum(inc.map(x=>x[1])); const gap=E-I; const cap=supportCap(t);
  const g=G.goals&&G.goals.y===G.year&&!settled?G.goals:null; const plan=!g&&!settled&&G.supPlan&&G.supPlan.y===G.year?G.supPlan.gf:null; const gf=g?g.sup:plan!=null?plan:settled?(G.goals&&G.goals.sup!=null?G.goals.sup:.6):clamp((cap?Math.max(0,gap)/cap:0)*(t.owner==='profit'?.85:t.owner==='pr'?1:1.15)+.05,.2,1); const fy=sponSeason(); const grantNow=t.grant&&t.grant.y===fy?t.grant.amt:0; const goalSup=t.indie?0:Math.round(gf*(cap-grantNow))+grantNow; /* 목표율은 기본 한도에, 추가 지원은 그 위에 더한다(확정 기준과 같게, 검수 11-09y) */
  const selfC=gap>0?Math.min(gap,Math.max(0,cash-3000)*.5):0, need=gap-selfC; /* 결산처럼 보유 현금 30억 초과분의 절반으로 적자를 먼저 메운다 */
  const support=t.indie?0:clamp(need,0,cap);
  /* 시즌 예산 확정: 구단주 지원(신뢰에 따른 한도·목표)과 예상 수입(입장·중계·광고·스폰서)은 시즌을 시작할 때(목표 확정·1월 1일 계획·결산 직후) 그해 몫으로 정한다.
     시즌 중에 신뢰가 오르거나 수입이 늘어도 단장이 쓸 수 있는 돈(예산 여유)은 늘지 않는다. 늘어난 수입은 구단(모기업) 몫이고, 구단주에게 추가 지원을 요청할 근거가 된다.
     예산을 늘리는 길은 구단주 승인(추가 지원)뿐이다. 실제 결산(적자 보전)은 실제 수입·지출로 한다 */
  const LK=G.bLocks=G.bLocks||{}; if(G.bLock){ if(!LK[G.bLock.tid])LK[G.bLock.tid]=G.bLock; delete G.bLock; } /* 확정 기준은 구단별로 보관한다: 다른 구단을 거쳐 돌아와도 그 시즌 기준이 바뀌지 않게(검수 11-06) */ let lock=LK[G.user]&&LK[G.user].fy===fy?LK[G.user]:null; if(!lock&&!G.unemp)lock=LK[G.user]={fy,tid:G.user,I,capB:cap-grantNow,gf,d:G.day,eco:ecoIdx(fy)}; if(lock&&lock.eco&&lock.eco!==ecoIdx(fy)){ lock.capB=Math.round(lock.capB*ecoIdx(fy)/lock.eco); lock.eco=ecoIdx(fy); } /* 12월 이사회가 상한을 정하면 확정 한도도 그 경제 지수로 맞춘다(검수 11-09y) */
  /* 독립구단은 모기업이 없어 늘어난 수입이 곧 쓸 수 있는 돈이다: 스폰서 계약·관중 증가가 예산 여유에 바로 들어간다(플레이 테스트 11-13: 연 77억 스폰서 뒤에도 두 달 그대로) */
  const IL=t.indie?I:(lock?lock.I:I), capL=lock?lock.capB+grantNow:cap, goalL=t.indie?0:(lock?Math.round(lock.gf*lock.capB)+grantNow:goalSup);
  const gapL=E-IL, selfCL=gapL>0?Math.min(gapL,Math.max(0,cash-3000)*.5):0, needL=gapL-selfCL;
  return {exp,inc,E,I,gap,cap,support,selfC,goalSup:goalL,goalFrac:lock?lock.gf:gf,grant:t.indie?0:grantNow,cash:t.cash,endCash:(c0=>t.indie&&c0>INDIE_DIV_T?c0-Math.round((c0-INDIE_DIV_T)*INDIE_DIV_R):c0)(cash+I+support-E),divEst:(c0=>t.indie&&c0>INDIE_DIV_T?Math.round((c0-INDIE_DIV_T)*INDIE_DIV_R):0)(cash+I+support-E), /* 독립구단은 결산 뒤 80억 초과분의 절반을 투자사가 배당으로 가져간다(검수 11-07) */
    lockI:IL, selfCL, extra:Math.round(I-IL), lockD:lock?lock.d:null, capLock:capL, goalLive:goalSup,
    roomGoal:goalL-needL, roomCap:capL-needL, roomMax:capL-gapL+Math.max(0,cash), rem, indie:!!t.indie, trust:t.trust,
    fR,fRoom:Math.max(0,fR-fs),fUsed:sum(fStayOf(G.user).filter(p=>p.foreign==='용병').map(p=>fRe(p)?p.newSal+(p.fInc||0):fCommit(p))), fCap:fCap(G.user), aUsed:sum(fStayOf(G.user).filter(p=>p.foreign==='아시아').map(p=>fRe(p)?p.newSal:p.sal)), ci}; }
/* 외국인 선수 연봉은 어느 구단이나 미리 잡아 두는 돈이다. 단장 첫 시즌은 규정 한도(신규 외국인 3명 각 100만 달러 + 아시아쿼터 20만 달러)까지 배정하고, 이후에는 지난 시즌 리그 평균 외국인 지출을 배정한다 */
/* 결산 뒤 다음 시즌 외국인 배정: 리그 평균 대신 우리 계약(재계약·새 계약·남은 계약) + 빈자리만 신규 상한으로(플레이 테스트 3차: 예상 65.72억 · 실제 30.94억) */
function fNextReserve(fRe){ const ny=G.year+1, d=fDropIds(G.user); const L=Object.values(G.players).filter(p=>p.team===G.user&&p.foreign&&!p.frehab&&!d.includes(p.id));
  const c=p=>fRe&&fRe(p)?(p.newSal||p.sal||0)+(p.fInc||0):fCommit(p,ny); const yb=L.filter(p=>p.foreign==='용병'), as=L.filter(p=>p.foreign==='아시아');
  const vac=Math.max(0,fMaxYB(G.user,ny)-yb.length)*fNewCap()+Math.max(0,1-as.length)*asiaCap(); return Math.round(sum(L.map(c))+vac); }
function fReserve(){ if(G.gmSince===G.year)return 3*fNewCap()+asiaCap(); const L=G.lgFor&&G.lgFor[G.year-1]; return L||3200; }
/* 개막 전 구단주 지원 목표는 시즌 시작 때 한 번 정해 둔다(지출할수록 여유가 줄어들도록) */
/* 창단 첫해 예비비: 비어 있는 코치 자리를 채울 연봉 + 운영 여유분. 드래프트 한도와 지원 목표에서 미리 떼어 둔다 */
function foundReserve(tid){ tid=tid??G.user; const C=G.coach&&G.coach[tid]; let vac=0;
  if(C){ for(const k of CKEYS){ if(C[k])continue; const L=(G.cmarket||[]).filter(c=>c.role===k).map(c=>c.sal).sort((a,b)=>a-b); vac+=L.length?L[Math.floor(L.length/2)]:150; } }
  if(!G.mgr[tid]||G.mgr[tid].interim){ const L=(G.mmarket||[]).map(m=>m.sal).sort((a,b)=>a-b); vac+=L.length?L[Math.floor(L.length/2)]:300; }
  const rem=Math.max(0,finYearEnd()-G.day)/365; const cap=supportCap(team(tid)); const cush=Math.max(1500,Math.round(cap*.08));
  return {vac:Math.round(vac*rem),cush,tot:Math.round(vac*rem)+cush}; } /* vac: 감독·코치 빈자리 채용비 */
function planSup(){ delete G.supPlan; delete G.bLock; if(G.bLocks)delete G.bLocks[G.user]; try{ const b=budget(); let gf=b.goalFrac; if(b.cap){ const want=(b.gap+foundReserve().tot)/b.cap; gf=Math.round(clamp(Math.max(gf,want),.2,1)*100)/100; } G.supPlan={y:G.year,gf}; delete G.bLock; if(G.bLocks)delete G.bLocks[G.user]; /* 위 budget()이 계획 전 목표율로 확정해 둔 기준을 지운다(안 지우면 개막 목표 전까지 계획이 무시됨) */ }catch(e){} } /* 해마다 지원 목표에 단장 재량 여유분(빈 스태프 자리 + 15억 또는 한도의 8%)을 둔다. 창단 첫해에만 두면 목표가 '예상 적자 + 한도의 5%'라 2년차부터 예산 여유가 늘 1억 안팎에 묶였다(피드백 11-09i) */
function projSupport(){ const b=budget(); if(b.indie||!b.cap)return 0; return clamp((b.gap-(b.selfC||0))/b.cap,0,2); }
/* 코치진 정기 보고: 단장이 처리할 일을 골라 버튼과 함께 보낸다 */
function staffReport(when){ if(G.unemp||!G.mgr[G.user])return; const tid=G.user; const ps=playersOf(tid); const items=[], acts=[];
  const top=ps.filter(p=>!p.foreign).sort((a,b)=>ovr(b)-ovr(a)).slice(0,10);
  G.srSeen=G.srSeen||{}; for(const p of top.filter(p=>ctrlYears(p)<=1&&canExtend(p)&&G.srSeen[p.id]!==G.year).slice(0,2)){ G.srSeen[p.id]=G.year; items.push(`[계약] ${p.name}(${posLabel(p)}, ${p.age}세)은(는) 이번 시즌 뒤 FA가 됩니다. 팀 상위 10명 안의 선수라 다년계약을 검토할 만합니다.`); acts.push({l:`${p.name} 계약`,a:'pmgmt',v:p.id}); }
  const d=depth(tid); const y=G.year;
  { const wb=[...d.start].sort((a,b)=>ovr(a)-ovr(b))[0]; const fb=d.futB.filter(p=>!p.ys&&healthy(p)).map(p=>({p,h:seasonTotal(p,y,'퓨처스')})).filter(x=>x.h&&x.h.pa>=60&&bRate(x.h).ops>=.800).sort((a,b)=>ovr(b.p)-ovr(a.p))[0];
    if(wb&&fb&&ovr(fb.p)>=ovr(wb)-1){ items.push(`[콜업] 2군 ${fb.p.name}(${posLabel(fb.p)})이(가) OPS ${fmt3(bRate(fb.h).ops)}로 좋습니다. 1군 ${wb.name}과(와) 비교해 볼 만합니다.`); acts.push({l:`${fb.p.name} 보기`,a:'player',v:fb.p.id}); } }
  { const fp=d.futP.filter(p=>!p.ys&&healthy(p)).map(p=>({p,h:seasonTotal(p,y,'퓨처스')})).filter(x=>x.h&&x.h.outs>=60&&pRate(x.h).era<=3.2).sort((a,b)=>ovr(b.p)-ovr(a.p))[0];
    const wp=[...d.pen].sort((a,b)=>ovr(a)-ovr(b))[0]; if(fp&&wp&&ovr(fp.p)>=ovr(wp)-1&&acts.length<3){ items.push(`[콜업] 2군 투수 ${fp.p.name}이(가) 평균자책점 ${pRate(fp.h).era.toFixed(2)}입니다. 1군 불펜 보강 후보입니다.`); acts.push({l:`${fp.p.name} 보기`,a:'player',v:fp.p.id}); } }
  { const slump=[...d.start,...d.sp].map(p=>({p,h:seasonTotal(p,y,'1군')})).filter(x=>x.h&&(x.p.isP?(x.h.outs>=90&&pRate(x.h).era>=6.3):(x.h.pa>=120&&bRate(x.h).ops<.600))).slice(0,2);
    slump.forEach(x=>items.push(`[부진] ${x.p.name}: ${statLine(x.h,x.p)}. 감독은 계속 기용하고 있습니다. 대체 자원이 있는지 보세요.`)); }
  { const nx=PSLOTS.filter(k=>{ if(k==='SP'||k==='RP')return false; const p=d.ln[k]; return p&&!p.foreign&&ctrlYears(p)<=1; }); if(nx.length)items.push(`[내년] 주전 중 ${nx.map(k=>SLOTK[k]).join(', ')} 자리 선수가 이번 시즌 뒤 FA입니다. 선수단 화면의 선수단 계획에서 내년 공백을 확인하세요.`); }
  if(!items.length)return; if(acts.length<3)acts.push({l:'선수단 계획',a:'go',v:'roster:plan'});
  mail('코치진',`${when} 코치진 보고: 단장 확인 ${items.length}건`,`${items.join('\n\n')}\n\n버튼을 누르면 해당 화면으로 바로 갑니다.`,{kind:'업무',acts:acts.slice(0,3)}); }
/* 구단주 신뢰 경고(플레이 테스트 3차: 경고 없이 신뢰가 무너져 경질): 35·20·10 이하로 처음 내려갈 때마다 진행을 멈추는 중요 메일을 보낸다.
   한 단계 위(기준 +5)로 회복해야 그 단계 경고가 다시 켜진다(기준선 근처에서 오르내릴 때 매일 울리지 않게) */
const TRUST_WARN=[35,20,10];
function ownerTrustWatch(){ if(G.unemp||G.gameOver||(G.fd&&!G.fd.done))return; const t=team(G.user); if(!t||t.trust==null)return; const tr=t.trust;
  const W=G.trW&&G.trW.tid===G.user?G.trW:(G.trW={tid:G.user,lv:0}); const cur=TRUST_WARN.filter(v=>tr<=v).length;
  { const o=dobj(G.day); if(period()==='season'&&o.d===1&&o.m>=7&&W.fy!==G.year&&!(expYr(G.user)&&!expFinDisaster(G.user))){ /* 창단 유예 중에는 성적으로 경질되지 않는다 */ let L=null; try{ L=ownerTrustOutlook(); }catch(e){} if(L&&L.end<12){ W.fy=G.year; /* 결산 때 한꺼번에 깎여 경고 없이 경질되지 않게: 지금 흐름이면 결산 뒤 신뢰가 경질선 아래라는 예고 */
    mail('구단주실',`[경고] 이대로면 시즌 결산 때 경질됩니다`,`지금 구단주 신뢰는 ${tr}입니다. 현재 성적·순위·수지·여론이 시즌 끝까지 이어지면 결산 때 신뢰가 약 ${L.d>=0?'+':''}${L.d} 바뀌어 ${L.end} 안팎이 됩니다. 결산 때 12 미만이면 경질됩니다.\n\n크게 움직이는 항목: ${L.why}\n남은 경기 성적, 구단주 목표(순위·재정·여론) 달성 여부가 결과를 바꿉니다.`,{imp:true,kind:'구단주',cat:'must',acts:[{l:'구단주 보기',a:'go',v:'club:owner'},{l:'재정 보기',a:'go',v:'club:fin'}]}); } } }
  if(cur<W.lv){ while(W.lv>cur&&tr>TRUST_WARN[W.lv-1]+5)W.lv--; return; } if(cur===W.lv)return; W.lv=cur;
  const lim=TRUST_WARN[cur-1], fire=12; const last=(G.ownerLog||[])[0];
  const why=last&&last.txt?`\n최근 구단주 보고: ${last.txt}`:'';
  const head=expYr(G.user)&&cur>=2?`구단주 신뢰가 ${tr}까지 내려갔습니다. 창단 유예 중이라 당장 자리를 걱정할 단계는 아니지만, 구단주가 눈여겨보고 있습니다.`:cur===1?`구단주 신뢰가 ${tr}까지 내려갔습니다(경고 기준 ${lim}).`:cur===2?`구단주 신뢰가 ${tr}입니다. 구단주실에서 단장 교체를 검토하기 시작했습니다.`:`구단주 신뢰가 ${tr}입니다. 이대로면 시즌 결산 때 경질됩니다.`;
  const tail=expYr(G.user)?`\n\n${expGraceTxt(G.user)} 다만 구단 자금이 바닥나는 재정 사고는 책임을 묻습니다. 신뢰는 유예가 끝난 뒤 평가의 출발점이 됩니다.`:`\n\n시즌 결산 때 신뢰가 ${fire} 미만이면 경질됩니다. 신뢰를 올리는 길: 시즌 목표(순위·재정·여론) 달성, 월간 보고 만족, 구단주 면담에서 약속을 지키기. 반려된 요청과 목표 초과 지출은 신뢰를 깎습니다.`;
  mail('구단주실',cur===3?`[최종 경고] 구단주 신뢰 ${tr}`:`[경고] 구단주 신뢰 ${tr}`,head+why+tail,{imp:true,kind:'구단주',cat:'must',acts:[{l:'구단주 보기',a:'go',v:'club:owner'},{l:'목표 확인',a:'go',v:'club:fin'}]}); }
/* 시즌 결산 때 신뢰 변화 예상(08_season_events 결산식을 지금 값으로 어림): 성적·포스트시즌·수지·구단주 목표·언론 */
function ownerTrustOutlook(){ const u=team(G.user); const r=G.sea&&G.sea.rec&&G.sea.rec[G.user]; if(!u||!r||r.w+r.l<40)return null; const y=G.year, wp=r.w/(r.w+r.l);
  const w=OWNER[(G.goals&&G.goals.y===y&&G.goals.owner)||u.owner].w; const rk=rankOf(G.user); let perf=(wp-(u.expW??.5))*150*w[0]; if(G.goals&&G.goals.y===y&&rk<=G.goals.rank)perf=Math.max(perf,0); if(G.startY===y)perf=clamp(perf,-3,6); if(expYr(G.user))perf=clamp(perf,-2,6); /* 결산식과 같게(08_season_events) */
  const ps=(rk<=5?2:expYr(G.user)?0:-1)*w[1]; let b=null; try{ b=budget(); }catch(e){} const fin=b?(clamp((b.I+b.support-b.E)/2500,-8,5)-(b.cap?(b.support/b.cap-.5)*4:0))*w[2]:0;
  let gy=0; try{ gy=goalYearEnd(rk,b?{support:b.support,supCap:b.cap}:null).d; }catch(e){} const pz=G.pr?(G.pr.press-50)/10:0;
  let d=perf+ps+fin+gy+pz; if(HARD()&&d<0)d*=1.3; d=Math.round(d);
  const parts=[['성적',perf],['포스트시즌',ps],['수지',fin],['구단주 목표',gy],['언론',pz]].filter(x=>Math.abs(x[1])>=1).sort((a,b)=>a[1]-b[1]).map(([l,v])=>`${l} ${v>=0?'+':''}${Math.round(v)}`).join(' · ');
  return {d,end:clamp(u.trust+d,0,100),why:parts||'없음'}; }
function ownerMonth(m,rk){ const t=team(G.user); const g=G.goals; if(!g)return; const ow=g.owner||t.owner; const w=OWNER[ow].w;
  /* 경기 수가 적을 때는 순위로 판단하지 않는다: 30경기 전에는 평가 보류, 70경기까지 순위 비중을 서서히 올린다 */
  const rr=G.sea&&G.sea.rec&&G.sea.rec[G.user]; const days=G.cal&&G.cal.open!=null?G.day-G.cal.open:999; const gp=Math.min(rr?rr.w+rr.l+(rr.t||0):0,Math.max(0,Math.round(days*.85))); const early=gp<30; const rkW=clamp((gp-30)/40,0,1);
  let s=0; s+=(g.rank-rk)*.6*w[0]*rkW; s+=(G.pr.press-50)/14*(w[3]*.6+.4); s+=(G.pr.fan-g.fan)/12*(w[3]*.7+.3); const ps=projSupport(); s+=(g.sup-ps)*4*w[2];
  if(early)s=clamp(s,-1,1);
  const fy=g.fd&&G.year===G.startY; if(fy&&s<0)s*=.6; /* 창단 첫해: 구단주도 참을성이 있다 */
  const ex=expYr(G.user); if(ex&&s<0)s*=.35; /* 신생 구단 유예(89_league_expansion): 성적이 나빠도 크게 나무라지 않는다 */
  const d=gp<10?0:clamp(Math.round(s),early||ex?(ex&&!early?-1:0):fy?-2:-4,early?1:3); /* 평가 보류면 신뢰도 그대로(검수 11-09zzd) */ t.trust=clamp(t.trust+(HARD()&&d<0?Math.round(d*1.3):d),0,100); /* 하드 모드: 신뢰 하락 1.3배 */
  const mood=s>=2?'만족':s>=-1?'관망':s>=-4?'불만':'격노';
  const demands=[]; if(!early&&!ex&&rkW>=.5&&rk>g.rank+1)demands.push(`순위를 ${g.rank}위 안으로 끌어올리라`); if(ps>g.sup+.15)demands.push('적자 폭을 줄이라'); if(G.pr.press<38)demands.push('언론 보도를 관리하라'); if(G.pr.fan<g.fan-8)demands.push('팬심을 돌려 놓으라');
  const txt=mood==='만족'?`구단주께서 ${m}월 보고를 받고 만족해하셨습니다. 지금 방향을 유지하라는 말씀입니다.`:mood==='관망'?(early?`구단주께서 ${m}월 보고를 받으셨습니다. 아직 ${gp}경기라 성적은 더 지켜보겠다고 하셨습니다.`:`구단주께서 ${m}월 보고를 받으셨습니다. 아직 판단을 미루고 지켜보겠다고 하셨습니다.`):`구단주께서 ${m}월 보고에 ${mood==='격노'?'크게 화를 내셨습니다':'불만을 표하셨습니다'}. ${demands.length?demands.join(', ')+'고 하셨습니다.':''}${ex?` 창단 ${ex}년차라 성적보다 기반을 보겠다고 덧붙이셨습니다.`:t.trust<25?' 단장 교체 이야기가 그룹 안에서 나오고 있습니다.':''}`;
  if(gp<10){ G.ownerLog.unshift({d:G.day,m,mood:'관망',delta:d,trust:t.trust,txt:`개막 ${gp}경기: 평가 보류`}); if(G.ownerLog.length>20)G.ownerLog.length=20; return; }
  G.ownerLog.unshift({d:G.day,m,mood,delta:d,trust:t.trust,txt}); if(G.ownerLog.length>20)G.ownerLog.length=20;
  mail('구단주실',`${m}월 구단주 보고: ${mood}`,`${txt}\n\n현재 ${rk}위(목표 ${g.rank}위 이내) · 팬 여론 ${Math.round(G.pr.fan)}(목표 ${g.fan}) · 언론 논조 ${Math.round(G.pr.press)} · 예상 적자 보전 ${Math.round(ps*100)}%(목표 ${Math.round(g.sup*100)}% 이하)\n구단주 신뢰 ${t.trust} (${d>=0?'+':''}${d})`,{imp:mood==='격노',kind:'구단주',acts:[{l:'목표 보기',a:'go',v:'club:owner'}]});
}
function goalYearEnd(rank,fin){ const s=goalStatus(); if(!s)return {d:0,lines:[]}; s.rank.cur=rank; s.rank.ok=rank<=s.rank.t; if(fin&&fin.supCap){ s.sup.cur=fin.support/fin.supCap; s.sup.ok=s.sup.cur<=s.sup.t; } const w=OWNER[(G.goals&&G.goals.owner)||team(G.user).owner].w; let d=0; const lines=[];
  const ex=expYr(G.user); const f=(ok,label,wt)=>{ const v=Math.round((ok?3:ex?-1.5:-4)*wt); d+=v; /* 창단 유예: 미달 벌점을 크게 줄인다 */ lines.push(`${label} ${ok?'달성':'미달'} (${v>=0?'+':''}${v})`); };
  f(s.rank.ok,`순위 목표(${s.rank.t}위 이내)`,w[0]); f(s.sup.ok,'재정 목표',w[2]); f(s.fan.ok,`여론 목표(${s.fan.t})`,w[3]); if(s.youth)f(s.youth.ok,'육성 목표',.8);
  return {d,lines}; }


/* 예상보다 더 들어온 수입(시즌 예산을 정한 뒤 늘어난 입장·광고·스폰서 수입). 쓸 수 있는 돈이 아니라 구단주에게 추가 지원을 요청할 근거 */
function budgetExtra(){ try{ return Math.max(0,budget().extra||0); }catch(e){ return 0; } }
/* 예산 세 칸(FM의 이적 예산·급료 예산처럼, 피드백 11-09q). 새 계산 없이 판정 함수(spendable·budget·capInfo)의 값을 그대로 나눠 보인다.
   올해 예상 지출(b.E)은 세 칸에 한 번씩만 들어간다: 영입(트레이드 현금·보상금·양도금·계약금) + 연봉('pay'·'for' 항목에서 영입분을 뺀 몫) + 운영(나머지, 단장 결정 지출 안의 트레이드 현금은 뺀다) */
function budgetSplit(){ const b=budget(), t=team(G.user), ci=b.ci, S=G.spend||{}, P=k=>Math.round(S[k]||0), tag=k=>sum(b.exp.filter(x=>x[2]===k).map(x=>x[1]));
  const trC=Math.min(P('trC'),P('etc')), bSp=trC+P('comp')+P('faB'); /* 영입 지출: 이미 낸 일시금(장부) */
  const pY=tag('pay')+tag('for')-P('comp')-P('faB'), oY=tag('ops')+tag('mgr')-trC;
  const oSp=Math.round(['mgr','coach','med','hosp','intl','data','fac','dev','fan'].reduce((a,k)=>a+(S[k]||0),0)+scoutSpent()+Math.max(0,(S.etc||0)-trC)); /* 운영 지출: 지금까지 쌓인 장부 */
  return {indie:b.indie,E:b.E,
    buy:{avail:Math.max(0,Math.round(spendable(G.user))),cash:Math.max(0,Math.round(t.cash||0)),room:Math.round(spendRoom()),spent:bSp,yr:bSp},
    pay:{capLeft:ci.cap-ci.pay,floorGap:Math.max(0,ci.floor-ci.pay),pay:ci.pay,cap:ci.cap,floor:ci.floor,room:Math.round(b.roomGoal),fRoom:Math.round(b.fRoom||0),spent:Math.round(pY),yr:Math.round(pY)},
    ops:{budget:Math.round(oY),spent:oSp,left:Math.round(oY)-oSp,yr:Math.round(oY)}}; }
