/* ===== 올해 예산(다음 결산까지 연간 예상) ===== */
function finYearEnd(){ const y=(G.last&&G.last.y>=G.year)?G.year+1:G.year; return dnum(y,11,5); }
function budget(){ const t=team(G.user); const ci=capInfo(G.user); const S=G.spend||{}; const m=G.mgr[G.user]; prInit();
  const rem=Math.max(0,finYearEnd()-G.day)/365; const acc=(spent,annual)=>Math.round((spent||0)+annual*rem);
  const settled=G.last&&G.last.y>=G.year; const SPj=stadProj(G.user,settled); const fsNow=sum(foreignOf(G.user).map(p=>p.sal));
  const fs=!settled&&G.sea&&G.sea.fspend&&G.sea.fspend[G.user]!=null?G.sea.fspend[G.user]:fsNow;
  const fR=settled?((G.lgFor&&G.lgFor[G.year])||3200):(G.cal&&G.day>=G.cal.open&&G.sea&&G.sea.y===G.year)?0:fReserve(); const fsB=Math.max(fs,fR);
  const intlA=sum(Object.keys(IREG).map(r=>INET[intlLv(r)].c));
  const tax=ci.over>0?Math.round(ci.over*capRate((t.capOver||0)+1)):0; const flo=G.year>=2027&&ci.floor>ci.pay?Math.round((ci.floor-ci.pay)*floorRate((t.floorUnder||0)+1)):0;
  const exp=[['국내 선수 연봉',ci.all,'pay'],[fR>fs?'외국인 선수 연봉(배정 예산)':'외국인 선수 연봉',fsB,'for'],['감독 연봉',acc(S.mgr,m?m.sal:0),'mgr'],['코치진 연봉',acc(S.coach,G.coach?coachSal(G.user):0),'mgr'],['단장 연봉',(()=>{ const C=G.unemp?null:myCInit(); return C&&C.tid===G.user?C.sal:0; })(),'mgr'], /* 결산 때 한 해 치를 낸다(myCPay) */
    ['구단 운영비',Math.round((t.indie?19000:24000)*ecoIdx()),'ops'],['스카우트 운영',sum(G.scouts.map(s=>s.sal))+600,'ops'],['마케팅',G.marketing,'ops'],
    ['부상 방지·병원',acc((S.med||0)+(S.hosp||0),PREV[G.med.prev].c+HOSP[G.med.hosp].c),'ops'],['해외 스카우트망',acc(S.intl,intlA),'ops'],['전력분석원 연봉',acc(S.data,anaSal()),'ops'],['훈련 시설 유지비',acc(S.fac,facUpkeep()),'ops'],
    ['해외 연수',S.dev||0,'ops'],['구장 시설 유지비',SPj.up,'ops'],['신인 계약금',settled?0:((G.sea.bonus&&G.sea.bonus[G.user])||0),'pay'],['신구장 분담금',newStadDue(G.user),'ops'],['단장 결정 지출',S.etc||0,'ops'],['FA 보상금',S.comp||0,'pay'],['FA·다년 계약금',S.faB||0,'pay'],['계약 옵션(예상)',optProj(G.user,settled?G.year+1:G.year),'pay'],['방출 정산금',S.rel||0,'pay'],['경쟁균형세',tax,'pay'],['하한 미달 발전기금',flo,'pay']].filter(x=>x[1]>0);
  const r=G.sea&&G.sea.rec&&!settled?G.sea.rec[G.user]:null; const wp=r&&r.w+r.l>=10?r.w/(r.w+r.l):.5;
  const att=SPj.att;
  const inc=[['입장 수입',SPj.ticket],['중계권 배분',Math.round(9000*ecoIdx()*asRev())],['광고·상품',Math.round((2200*ecoIdx()+G.marketing*1.6)*t.market*t.pop*(0.85+G.pr.fan/333)*(0.95+G.pr.press/1000))]]; { const sx=SPj.fnb+SPj.prem+SPj.ad; if(sx>0)inc.push(['구장 부대 수입',sx]); }
  { sponInit(); const sp=sponIncome(); if(sp>0)inc.push(['스폰서 계약',sp]); } { const si=starIncome(G.user); if(si>0)inc.push(['스타 마케팅',si]); } { const due=newStadDue(G.user); if(due)inc.push(['모기업 신구장 출자',Math.round(due*.7)]); }
  const E=sum(exp.map(x=>x[1])), I=sum(inc.map(x=>x[1])); const gap=E-I; const cap=supportCap(t);
  const g=G.goals&&G.goals.y===G.year&&!settled?G.goals:null; const plan=!g&&!settled&&G.supPlan&&G.supPlan.y===G.year?G.supPlan.gf:null; const gf=g?g.sup:plan!=null?plan:clamp((cap?Math.max(0,gap)/cap:0)*(t.owner==='profit'?.85:t.owner==='pr'?1:1.15)+.05,.2,1); const goalSup=t.indie?0:Math.round(gf*cap);
  const support=t.indie?0:clamp(gap,0,cap);
  return {exp,inc,E,I,gap,cap,support,goalSup,goalFrac:gf,cash:t.cash,endCash:t.cash+I+support-E,
    roomGoal:goalSup-gap, roomCap:cap-gap, roomMax:cap-gap+Math.max(0,t.cash), rem, indie:!!t.indie, trust:t.trust,
    fR,fRoom:Math.max(0,fR-fs),fUsed:sum(foreignOf(G.user).filter(p=>p.foreign==='용병').map(fCommit)), fCap:fCap(G.user), aUsed:sum(foreignOf(G.user).filter(p=>p.foreign==='아시아').map(p=>p.sal)), ci}; }
/* 외국인 선수 연봉은 어느 구단이나 미리 잡아 두는 돈이다. 단장 첫 시즌은 규정 한도(신규 외국인 3명 각 100만 달러 + 아시아쿼터 20만 달러)까지 배정하고, 이후에는 지난 시즌 리그 평균 외국인 지출을 배정한다 */
function fReserve(){ if(G.gmSince===G.year)return 3*F_NEW_CAP+ASIA_CAP; const L=G.lgFor&&G.lgFor[G.year-1]; return L||3200; }
/* 개막 전 구단주 지원 목표는 시즌 시작 때 한 번 정해 둔다(지출할수록 여유가 줄어들도록) */
/* 창단 첫해 예비비: 비어 있는 코치 자리를 채울 연봉 + 운영 여유분. 드래프트 한도와 지원 목표에서 미리 떼어 둔다 */
function foundReserve(tid){ tid=tid??G.user; const C=G.coach&&G.coach[tid]; let vac=0;
  if(C){ for(const k of CKEYS){ if(C[k])continue; const L=(G.cmarket||[]).filter(c=>c.role===k).map(c=>c.sal).sort((a,b)=>a-b); vac+=L.length?L[Math.floor(L.length/2)]:150; } }
  if(!G.mgr[tid]||G.mgr[tid].interim){ const L=(G.mmarket||[]).map(m=>m.sal).sort((a,b)=>a-b); vac+=L.length?L[Math.floor(L.length/2)]:300; }
  const rem=Math.max(0,finYearEnd()-G.day)/365; const cap=supportCap(team(tid)); const cush=Math.max(1500,Math.round(cap*.08));
  return {vac:Math.round(vac*rem),cush,tot:Math.round(vac*rem)+cush}; } /* vac: 감독·코치 빈자리 채용비 */
function planSup(){ delete G.supPlan; try{ const b=budget(); let gf=b.goalFrac; if(G.startY===G.year&&b.cap){ const want=(b.gap+foundReserve().tot)/b.cap; gf=Math.round(clamp(Math.max(gf,want),.2,1)*100)/100; } G.supPlan={y:G.year,gf}; }catch(e){} } /* 창단 첫해는 드래프트 직후 예산 여유가 마이너스로 시작하지 않게 지원 목표에 여유분을 둔다 */
function projSupport(){ const b=budget(); if(b.indie||!b.cap)return 0; return clamp(b.gap/b.cap,0,2); }
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
function ownerMonth(m,rk){ const t=team(G.user); const g=G.goals; if(!g)return; const ow=t.owner; const w=OWNER[ow].w;
  /* 경기 수가 적을 때는 순위로 판단하지 않는다: 30경기 전에는 평가 보류, 70경기까지 순위 비중을 서서히 올린다 */
  const rr=G.sea&&G.sea.rec&&G.sea.rec[G.user]; const days=G.cal&&G.cal.open!=null?G.day-G.cal.open:999; const gp=Math.min(rr?rr.w+rr.l+(rr.t||0):0,Math.max(0,Math.round(days*.85))); const early=gp<30; const rkW=clamp((gp-30)/40,0,1);
  let s=0; s+=(g.rank-rk)*.6*w[0]*rkW; s+=(G.pr.press-50)/14*(w[3]*.6+.4); s+=(G.pr.fan-g.fan)/12*(w[3]*.7+.3); const ps=projSupport(); s+=(g.sup-ps)*4*w[2];
  if(early)s=clamp(s,-1,1);
  const fy=g.fd&&G.year===G.startY; if(fy&&s<0)s*=.6; /* 창단 첫해: 구단주도 참을성이 있다 */
  const d=clamp(Math.round(s),early?0:fy?-2:-4,early?1:3); t.trust=clamp(t.trust+d,0,100);
  const mood=s>=2?'만족':s>=-1?'관망':s>=-4?'불만':'격노';
  const demands=[]; if(!early&&rkW>=.5&&rk>g.rank+1)demands.push(`순위를 ${g.rank}위 안으로 끌어올리라`); if(ps>g.sup+.15)demands.push('적자 폭을 줄이라'); if(G.pr.press<38)demands.push('언론 보도를 관리하라'); if(G.pr.fan<g.fan-8)demands.push('팬심을 돌려 놓으라');
  const txt=mood==='만족'?`구단주께서 ${m}월 보고를 받고 만족해하셨습니다. 지금 방향을 유지하라는 말씀입니다.`:mood==='관망'?(early?`구단주께서 ${m}월 보고를 받으셨습니다. 아직 ${gp}경기라 성적은 더 지켜보겠다고 하셨습니다.`:`구단주께서 ${m}월 보고를 받으셨습니다. 아직 판단을 미루고 지켜보겠다고 하셨습니다.`):`구단주께서 ${m}월 보고에 ${mood==='격노'?'크게 화를 내셨습니다':'불만을 표하셨습니다'}. ${demands.length?demands.join(', ')+'고 하셨습니다.':''}${t.trust<25?' 단장 교체 이야기가 그룹 안에서 나오고 있습니다.':''}`;
  if(gp<10){ G.ownerLog.unshift({d:G.day,m,mood:'관망',delta:d,trust:t.trust,txt:`개막 ${gp}경기: 평가 보류`}); if(G.ownerLog.length>20)G.ownerLog.length=20; return; }
  G.ownerLog.unshift({d:G.day,m,mood,delta:d,trust:t.trust,txt}); if(G.ownerLog.length>20)G.ownerLog.length=20;
  mail('구단주실',`${m}월 구단주 보고: ${mood}`,`${txt}\n\n현재 ${rk}위(목표 ${g.rank}위 이내) · 팬 여론 ${Math.round(G.pr.fan)}(목표 ${g.fan}) · 언론 논조 ${Math.round(G.pr.press)} · 예상 적자 보전 ${Math.round(ps*100)}%(목표 ${Math.round(g.sup*100)}% 이하)\n구단주 신뢰 ${t.trust} (${d>=0?'+':''}${d})`,{imp:mood==='격노',kind:'구단주',acts:[{l:'목표 보기',a:'go',v:'club:owner'}]});
}
function goalYearEnd(rank,fin){ const s=goalStatus(); if(!s)return {d:0,lines:[]}; s.rank.cur=rank; s.rank.ok=rank<=s.rank.t; if(fin&&fin.supCap){ s.sup.cur=fin.support/fin.supCap; s.sup.ok=s.sup.cur<=s.sup.t; } const w=OWNER[team(G.user).owner].w; let d=0; const lines=[];
  const f=(ok,label,wt)=>{ const v=Math.round((ok?3:-4)*wt); d+=v; lines.push(`${label} ${ok?'달성':'미달'} (${v>=0?'+':''}${v})`); };
  f(s.rank.ok,`순위 목표(${s.rank.t}위 이내)`,w[0]); f(s.sup.ok,'재정 목표',w[2]); f(s.fan.ok,`여론 목표(${s.fan.t})`,w[3]); if(s.youth)f(s.youth.ok,'육성 목표',.8);
  return {d,lines}; }

