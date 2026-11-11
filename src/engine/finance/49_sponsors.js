/* ===== 스폰서 계약 =====
   모기업 구단도 유니폼 소매·헬멧·외야 펜스·유니폼 등·공식 용품 자리는 외부 스폰서를 받는다(독립구단은 메인 스폰서까지).
   비시즌(11~1월)에 기업들이 제안을 보내고, 단장은 수락·조건 상향 요청·거절을 고른다.
   제안 금액은 시장 규모·인기·성적·팬 여론·언론 논조·스타 선수로 정한 '스폰서 가치'를 따른다.
   계약에는 연 금액, 기간, 가을야구·우승 보너스가 있고 일부는 이미지 조항(언론 논조가 나쁘면 감액)이 붙는다 */
const SPON_SLOT={main:{l:'메인 스폰서(구단 명칭)',b:9000,indie:1},kit:{l:'공식 용품(유니폼 공급)',b:1400},sleeve:{l:'유니폼 소매 패치',b:1100},fence:{l:'외야 펜스 메인 보드',b:1000},helmet:{l:'헬멧',b:650},back:{l:'유니폼 등·바지',b:550}};
const SPON_IND={kit:['스포츠용품'],main:['금융','통신','건설','게임','유통'],sleeve:['금융','통신','자동차','제약','게임','식품'],fence:['주류','식품','편의점','보험','가전'],helmet:['보험','제약','식품','자동차'],back:['편의점','식품','게임','여행']};
const SPON_CO={스포츠용품:['스트라이드','에이스기어','배터박스','루키스포츠'],금융:['한결은행','미래로카드','새벽증권','든든캐피탈'],통신:['하나로텔레콤','오로라모바일'],건설:['대명건설','한빛이앤씨'],게임:['픽셀웍스','넥스타게임즈','라운드원'],유통:['모아마트','하루몰'],
  자동차:['한라모터스','세븐타이어'],제약:['참좋은제약','바른약품'],식품:['고소한식품','새참푸드','한입제과'],주류:['맑은맥주','청춘소주'],편의점:['24스테이','바로마트24'],보험:['든든생명','온누리화재'],가전:['빛가람전자'],여행:['떠나요투어']};
function sponInit(){ if(G.spon)return G.spon; const S=G.spon={c:{},off:[],hist:[],nid:1}; const t=team(G.user);
  /* 시작 시 일부 자리는 이미 계약이 있다(지난 단장 때 맺은 계약) */
  for(const k of Object.keys(SPON_SLOT)){ const d=SPON_SLOT[k]; if(d.indie&&!t.indie)continue; if(k==='main'||R()<.6){ const o=sponMake(k,{base:true}); o.yrs=k==='main'?3:ri(1,2); sponSign(o,true); const y=sponSeason(); Object.assign(S.c[k],{y0:y,until:y+o.yrs-1,first:1}); delete S.c[k].bf; delete S.c[k].psNo; delete S.c[k].d0; } /* 전임 단장 때 맺은 계약: 부임일이 아니라 그 시즌 처음부터(검수 11-09zza) */ }
  return S; }
function sponSeason(){ return G.last&&G.last.y>=G.year?G.year+1:G.year; } /* 결산이 끝났으면 다음 시즌 계약 */
/* 스폰서 가치: 1.0이 리그 평균 */
function sponVal(tid){ tid=tid??G.user; const t=team(tid); let v=.45+t.market*.3+clamp(t.pop,0,1.6)*.25;
  const h=G.history&&G.history.length?G.history[G.history.length-1]:null; if(h){ const i=h.order.findIndex(o=>o.tid===tid); if(i>=0)v+=(4.5-i)*.03; if(h.champ===tid)v+=.12; }
  { const P=prOf(tid); if(P)v+=(P.fan-55)/250+(P.press-50)/400; } /* 떠난 구단도 그 구단 여론으로(검수 11-09zza) */
  try{ v+=Math.min(.25,teamStar(tid).v*.004); }catch(e){}
  return clamp(v,.55,1.9); }
function sponValParts(){ const t=team(G.user); const h=G.history&&G.history.length?G.history[G.history.length-1]:null; const i=h?h.order.findIndex(o=>o.tid===G.user):-1; let st=0; try{ st=Math.min(.25,teamStar(G.user).v*.004); }catch(e){}
  return [['시장 규모',t.market*.3-.3],['구단 인기',clamp(t.pop,0,1.6)*.25-.25],['지난 시즌 성적',h&&i>=0?(4.5-i)*.03+(h.champ===G.user?.12:0):0],['팬 여론',G.pr?(G.pr.fan-55)/250:0],['언론 논조',G.pr?(G.pr.press-50)/400:0],['스타 선수',st]]; }
function sponMake(slot,o){ o=o||{}; const S=o.S||G.spon; const ind=pick(SPON_IND[slot]); const co=pick(SPON_CO[ind]); const v=sponVal(o.tid);
  const style=o.base?'std':pick(['std','std','bonus','safe','long']); const yrs=style==='long'?3:style==='safe'?ri(1,2):ri(1,3);
  let amt=SPON_SLOT[slot].b*ecoIdx()*v*rnd(.85,1.15)*(style==='bonus'?.82:style==='safe'?1.06:style==='long'?.95:1)*(o.renew?1.05:1);
  const bon=style==='bonus'?[.35,.7]:style==='safe'?[0,.1]:[.12,.3];
  const x={id:S.nid++,slot,co,ind,amt:round5(amt),yrs,ps:round5(amt*rnd(bon[0],bon[0]+.1)),champ:round5(amt*rnd(bon[1]-.05,bon[1]+.15)),img:R()<(o.base?.2:.35),style,day:G.day,exp:G.day+21,cnt:0,renew:!!o.renew};
  return x; }
/* 지금 계약하면 첫해 조건(계약 화면 안내와 실제 계약이 같은 계산을 쓴다, 검수 11-08) */
function sponFirstTerms(){ let y0=sponSeason(); const inSea=y0===G.year&&G.cal&&G.day>G.cal.open; const over=inSea&&G.day>=G.cal.end; if(over)y0++; const first=over?1:inSea?clamp((G.cal.end-G.day)/(G.cal.end-G.cal.open),0,1):1; let psLock=false; try{ psLock=inSea&&!over&&psClinched(G.user); }catch(e){} return {y0,first,lateSign:inSea&&first<1,psLock}; }
function sponSign(o,silent){ const S=G.spon; let y0=sponSeason(); const inSea=y0===G.year&&G.cal&&G.day>G.cal.open; const over=inSea&&G.day>=G.cal.end; /* 정규시즌이 끝난 뒤 결산 전 계약: 올해 몫은 없고 계약 기간은 다음 시즌부터 센다 */
  if(over)y0++; /* 정규시즌 뒤 계약은 다음 시즌부터 시작하는 계약으로 적는다(1년 계약이 2개 연도로 기록되지 않게, 검수 11-06) */ const first=over?1:inSea?clamp((G.cal.end-G.day)/(G.cal.end-G.cal.open),0,1):1; /* 남은 기간 비율 그대로(하한 없음, 검수 11-07) */
  const lateSign=inSea&&first<1; let psLock=false; try{ psLock=inSea&&!over&&psClinched(G.user); }catch(e){} /* 정규시즌 뒤 계약은 다음 시즌부터라 올해 진출과 무관(검수 11-08) */ /* 이미 가을야구를 확정한 뒤 맺은 계약은 진출 보너스 없음(검수 11-07) */ /* 시즌 중 계약: 첫해 성과 보너스도 남은 기간 비율만(이미 확정된 가을야구는 보너스 없음, 검수 11-07) */
  S.c[o.slot]={co:o.co,ind:o.ind,amt:o.amt,ps:o.ps,champ:o.champ,img:o.img,y0,until:y0+o.yrs-1,first,id:o.id,d0:G.day,...(lateSign?{bf:first}:{}),...(psLock?{psNo:1}:{})};
  S.off=S.off.filter(x=>x.slot!==o.slot); if(!silent){ addLog(`${o.co}(${o.ind})와(과) ${SPON_SLOT[o.slot].l} 계약: ${o.yrs}년, 연 ${money(o.amt)}.`); chron&&chron('spon',`${o.co} ${SPON_SLOT[o.slot].l} 계약 (${o.yrs}년 연 ${money(o.amt)})`);
    if(o.amt>=SPON_SLOT[o.slot].b*1.15)news('구단',`${tshort(G.user)}, ${o.co}와(과) ${SPON_SLOT[o.slot].l} 계약`,`${o.yrs}년 연 ${money(o.amt)} 규모입니다. 구단 가치가 올랐다는 평가가 나옵니다.`,1); } }
/* 단장이 떠난 구단의 계약서: 이직하면 G.sponT, 무직이면 G.spon이 떠난 구단 것(검수 11-08: 사임 뒤 결산에서 계약이 빠짐) */
function sponLeft(tid){ return (G.sponT&&G.sponT[tid])||(G.unemp&&G.unemp.from===tid&&G.spon)||null; }
/* 올해(진행 중이거나 다음) 시즌에 들어올 기본 금액 */
function sponIncome(y){ const S=G.spon; if(!S)return 0; y=y??sponSeason(); let s=0; for(const k in S.c){ const c=S.c[k]; if(c.y0<=y&&c.until>=y)s+=c.amt*(c.y0===y?(c.first??1):1); } for(const c of (S.cutL||[]))if(c.until===y)s+=c.amt*(c.cutF||0); return Math.round(s); } /* 비율 칸이 없는 옛 계약도 1로(검수 11-08) */
/* 중도 해지: 해지 전까지 지난 기간 몫(정규시즌 날짜 비율)은 그해 결산에 남기고, 남은 몫만 취소한다. 해지 날짜·사유는 이력에 남는다 */
function sponCancel(k,why,S0){ const S=S0||G.spon; const c=S&&S.c[k]; if(!c)return null; const y=sponSeason(); let f=0; /* 결산 뒤 해지는 다음 시즌 기준: 올해 몫은 이미 받았다(검수 11-08) */
  if(y===G.year&&c.y0<=y&&c.until>=y&&G.cal){ const eff=c.y0===y?(c.first??1):1, o=G.cal.open, e=G.cal.end; const s0=c.y0===y&&c.d0!=null?Math.max(o,c.d0):o; f=G.day<=s0?0:G.day>=e?eff:eff*clamp((G.day-s0)/Math.max(1,e-s0),0,1); } /* 계약한 날부터 해지한 날까지 지난 비율만큼(같은 날 해지면 0, 검수 11-06) */
  const effY=c.y0<=y&&c.until>=y?(c.y0===y?(c.first??1):1):0, later=c.until-Math.max(y,c.y0-1); /* 남은 몫: 올해 남은 기간 + 다음 해부터 */
  const x=Object.assign({slot:k},c,{until:y,cutF:Math.round(f*1000)/1000,cut:{d:G.day,why,lost:Math.round(c.amt*(effY-f+Math.max(0,later)))}});
  (S.cutL=S.cutL||[]).push(x); delete S.c[k]; return x; }
function sponOpen(k){ const c=G.spon.c[k]; const y=sponSeason(); return !c||c.until<y; }
/* 제안: 11월 10일·12월 1일·1월 10일, 시즌 중에는 매달 1일 빈자리에 가끔 */
function sponDaily(){ try{ sponPitchOld(); }catch(e){} /* 무직 중에도 떠난 구단 영업 결과는 예정일에 낸다(검수 11-07) */ if(G.unemp)return; const S=sponInit(); const o=dobj(G.day); const t=team(G.user); S.off=S.off.filter(x=>x.exp>=G.day); /* 영업 결과보다 먼저: 만료된 제안이 새 제안을 중복으로 막지 않게(검수 11-09i) */ try{ sponPitchDaily(); }catch(e){}
  const off=(o.m===11&&o.d===10)||(o.m===12&&o.d===1)||(o.m===1&&o.d===10)||(o.m===2&&o.d===1)||(o.m===3&&o.d===1); const sea=o.d===1&&period()==='season'&&R()<.35;
  if(!off&&!sea)return; const made=[];
  for(const k of Object.keys(SPON_SLOT)){ if(SPON_SLOT[k].indie&&!t.indie)continue; if(!sponOpen(k))continue; const have=S.off.filter(x=>x.slot===k).length; const n=off?ri(1,2):(R()<.5?1:0);
    for(let i=0;i<n&&have+i<3;i++){ const old=S.c[k]||[...(S.hist||[])].reverse().find(h=>h.slot===k&&!h.cut&&h.until===sponSeason()-1); /* 떠난 사이 결산으로 계약서에서 빠진 만료 계약도 이력으로 재계약 제안(검수 11-08) */ const x=sponMake(k,{renew:old&&old.until===sponSeason()-1&&i===0 /* 막 끝난 계약 시즌 기준(1월에도 재계약 제안, 검수 11-07) */&&!S.off.some(z=>z.slot===k&&z.renew)}); if(x.renew){ x.co=old.co; x.ind=old.ind; } if(S.off.some(z=>z.slot===k&&z.co===x.co))continue; /* 같은 자리 같은 기업 중복 제안 없음(검수 11-07) */ S.off.push(x); made.push(x); } }
  if(made.length)mail('마케팅팀',`스폰서 제안 ${made.length}건`,`${made.map(x=>`${SPON_SLOT[x.slot].l}: ${x.co}(${x.ind}) ${x.yrs}년 연 ${money(x.amt)}${x.renew?' · 재계약':''}`).join('\n')}\n\n제안은 3주 동안 유효합니다. 구단 가치 지수 ${Math.round(sponVal()*100)}.`,{kind:'스폰서',imp:true,acts:[{l:'스폰서 보기',a:'go',v:'club:spon'}]}); }
function sponAccept(id){ const S=G.spon; const o=S.off.find(x=>x.id===id); if(!o)return '제안이 없습니다.'; if(o.exp<G.day){ S.off=S.off.filter(x=>x.id!==id); return '기한이 지난 제안입니다.'; } if(SPON_SLOT[o.slot].indie&&!team(G.user).indie)return '모기업이 있는 구단은 메인 스폰서(구단 명칭) 계약을 할 수 없습니다.'; /* 검수 11-07 */ if(!sponOpen(o.slot))return '이미 계약된 자리입니다.'; sponSign(o); return `계약 완료: ${o.co}, ${SPON_SLOT[o.slot].l} ${o.yrs}년 연 ${money(o.amt)}`; }
function sponReject(id){ const S=G.spon; S.off=S.off.filter(x=>x.id!==id); return '제안을 거절했습니다.'; }
/* 조건 상향 요청: 구단 가치가 높을수록, 기업이 적극적일수록 받아들인다 */
function sponCounter(id,pct){ const S=G.spon; const o=S.off.find(x=>x.id===id); if(!o)return '제안이 없습니다.'; if(o.exp<G.day){ S.off=S.off.filter(x=>x.id!==id); return '기한이 지난 제안입니다.'; } /* 검수 11-08 */ if(o.cnt>=1)return `${o.co}: 더 이상은 어렵습니다.`;
  o.cnt++; const v=sponVal(); const comp=new Set(S.off.filter(x=>x.slot===o.slot&&x.exp>=G.day).map(x=>x.co)).size; /* 만료 제안은 경쟁으로 치지 않는다(검수 11-09i) */ /* 같은 기업 제안은 한 곳으로 */ const p=clamp(.62+(v-1)*.6+(comp-1)*.12-(pct-.1)*2.2+(o.renew?.1:0),.08,.92);
  if(R()<p){ o.amt=round5(o.amt*(1+pct)); o.ps=round5(o.ps*(1+pct*.5)); return `${o.co}: 요청하신 조건을 받아들이겠습니다. 연 ${money(o.amt)}.`; }
  if(R()<.45){ S.off=S.off.filter(x=>x.id!==id); return `${o.co}: 그 금액은 어렵습니다. 이번 제안은 철회하겠습니다.`; }
  return `${o.co}: 조건 상향은 어렵습니다. 처음 제안 그대로라면 계약하겠습니다.`; }
/* 시즌 결산: 기본 금액 + 성과 보너스, 이미지 조항, 만료 처리 */
function sponSettle(y,ps,tid,S0){ tid=tid??G.user; const S=S0||G.spon; /* tid·S0: 단장이 떠난 구단의 남은 계약서(G.sponT)로 결산 */ if(!S)return {base:0,bonus:0,L:[]}; let base=0,bonus=0; const L=[];
  for(const k in S.c){ const c=S.c[k]; if(!(c.y0<=y&&c.until>=y))continue; const eff=c.y0===y?(c.first??1):1; base+=c.amt*eff; c.paidY=Math.round(c.amt*eff); /* 이력에는 그해 실제 받은 금액(첫해 비율 포함, 검수 11-08) */ if(!(eff>0))continue; /* 올해 효력이 없는 계약(시즌 뒤 계약)은 올해 성과 보너스도 없다 */
    const bf=c.y0===y&&c.bf!=null?c.bf:1; const inPS=!!(G.ps&&G.ps.seeds&&G.ps.seeds.includes(tid)); if(inPS&&c.ps&&!(c.psNo&&c.y0===y)){ const v=Math.round(c.ps*bf); bonus+=v; if(v)L.push(`${c.co} 가을야구 보너스 ${money(v)}${bf<1?' (계약 기간 비율)':''}`); } if(ps&&ps.champ===tid&&c.champ){ const v=Math.round(c.champ*bf); bonus+=v; if(v)L.push(`${c.co} 우승 보너스 ${money(v)}${bf<1?' (계약 기간 비율)':''}`); }
    if(c.base0==null)c.base0=c.amt; c.amt=c.base0; const P=prOf(tid), press=P?P.press:(S.press??50); /* 그 구단의 지금 언론 논조(사임·이직 뒤에도, 검수 11-09zza) */ if(c.img&&press<30&&c.until>y){ c.amt=round5(c.base0*.8); L.push(`${c.co}: 이미지 조항으로 다음 해 금액 20% 감액`); } } /* 감액은 그다음 한 해만(원래 금액 기준으로 해마다 다시 판단). 이직 뒤 남은 계약서도 같은 판단(검수 11-07) */
  for(const c of (S.cutL||[]))if(c.until===y){ const v=c.amt*(c.cutF||0); base+=v; if(v>0)L.push(`${c.co}: 해지(${dsh(c.cut.d)}) 전까지 몫 ${money(Math.round(v))}`); }
  for(const k in S.c){ if(S.c[k].until===y){ S.hist.push(Object.assign({slot:k},S.c[k])); } } /* 이력의 amt는 연 계약금, 마지막 해 실제로 받은 금액은 paidY(검수 11-07·11-09i) */
  if(S.cutL&&S.cutL.length){ for(const c of S.cutL)if(c.until<=y)S.hist.push(c); S.cutL=S.cutL.filter(c=>c.until>y); }
  if(S.hist.length>40)S.hist=S.hist.slice(-40); S.paid={y,v:Math.round(base)}; /* 비시즌 준비표의 지난 시즌 수입은 실제 결산액(해지 전 몫 포함, 검수 11-09i) */
  if(tid===G.user&&!S0){ const exp=Object.keys(S.c).filter(k=>S.c[k].until===y); mail('마케팅팀',`${y} 스폰서 결산: ${money(Math.round(base+bonus))}`,`기본 계약 ${money(Math.round(base))}${bonus?`, 성과 보너스 ${money(Math.round(bonus))}`:''}.${L.length?'\n'+L.join('\n'):''}${exp.length?`\n\n이번 시즌으로 끝나는 계약: ${exp.map(k=>`${S.c[k].co}(${SPON_SLOT[k].l})`).join(', ')}. 11월 중순부터 재계약·신규 제안이 들어옵니다.`:''}`,{kind:'스폰서',acts:[{l:'스폰서 보기',a:'go',v:'club:spon'}]}); }
  return {base:Math.round(base),bonus:Math.round(bonus),L}; }
/* 팬 여론이 바닥이면 드물게 계약 해지 */
function sponMonthly(){ const L=[[G.user,G.spon]]; for(const k in (G.sponT||{}))L.push([+k,G.sponT[k]]); /* 떠난 구단 계약서도 그 구단 여론으로 검사(검수 11-09zza) */
  for(const [tid,S] of L){ const P=prOf(tid); if(!S||!P||P.fan>=25)continue; for(const k in S.c){ const c=S.c[k]; if(c.until<sponSeason()||R()>=.06)continue; /* 결산까지 끝난 계약은 해지 대상 아님 */ const x=sponCancel(k,'팬 여론 악화',S); if(tid!==ME()){ wire('구단',`${c.co}, ${tshort(tid)} 스폰서 철수`,{tid}); break; } const kept=Math.round(x.amt*x.cutF), done=sponSeason()>G.year, s0=Math.max(c.y0??x.until,x.until); /* 사라진 시즌을 앞세운다(시작 전 계약이면 시작 연도부터, 검수 11-09i) */ mail('마케팅팀',`${c.co} 스폰서 계약 해지`,`팬 여론 악화로 ${c.co}이(가) ${SPON_SLOT[k].l} 계약을 해지했습니다. 사라진 계약: ${s0<c.until?`${s0}~${c.until}`:s0}시즌 몫 ${money(x.cut.lost)}. ${done?`${G.year}시즌 몫은 이미 결산에 들어왔습니다.`:kept>0?`해지 전까지 지난 기간 몫 ${money(kept)}은 올해 결산에 들어옵니다.`:''} 이 자리에는 새 스폰서와 계약할 수 있습니다.`,{kind:'스폰서',imp:true}); news('구단',`${c.co}, ${tshort(G.user)} 스폰서 철수`,'성난 팬심이 기업 이미지에도 부담이 된다는 판단입니다.',-2); break; } } }
/* AI 구단 스폰서 수입(결산용) */
function sponAI(tid){ return Math.round(sum(Object.keys(SPON_SLOT).filter(k=>!SPON_SLOT[k].indie).map(k=>SPON_SLOT[k].b))*ecoIdx()*sponVal(tid)*.85); }
/* 영업 활동: 단장이 마케팅팀에 빈자리 영업을 지시한다. 영업비 3천만 원, 1~2주 뒤 결과.
   성공률은 구단 가치 지수와 단장 평판을 따른다. 자리마다 한 달에 한 번 */
function sponPitch(slot){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; const S=sponInit(); if(!SPON_SLOT[slot])return '없는 자리입니다.'; if(SPON_SLOT[slot].indie&&!team(G.user).indie)return '모기업이 있는 구단은 메인 스폰서 영업을 할 수 없습니다.'; if(!sponOpen(slot))return '이미 계약된 자리입니다.';
  S.pitch=S.pitch||[]; if(S.pitch.some(x=>x.slot===slot&&G.day-x.day<30))return '이 자리는 이미 영업 중이거나 이번 달에 시도했습니다.';
  if(team(G.user).indie&&spendable(G.user)-(G.spend.etc||0)<30)return '스폰서 영업비 3천만 원을 낼 구단 현금이 부족합니다.';
  G.spend.etc=(G.spend.etc||0)+30; S.pitch.push({slot,day:G.day,due:G.day+ri(7,14),done:false});
  return `마케팅팀이 ${SPON_SLOT[slot].l} 영업을 시작했습니다(영업비 3천만 원). 1~2주 뒤 결과를 보고합니다.`; }
function sponPitchDaily(){ const S=G.spon; if(!S||!S.pitch)return; for(const x of S.pitch){ if(x.done||x.due>G.day)continue; x.done=true; if(!sponOpen(x.slot))continue;
    if(R()<sponPitchP(G.user)){ const made=sponPitchMake(S,x.slot,G.user);
      if(made.length)mail('마케팅팀',`영업 성과: ${SPON_SLOT[x.slot].l} 제안 ${made.length}건`,`${made.map(o=>`${o.co}(${o.ind}) ${o.yrs}년 연 ${money(o.amt)}`).join('\n')}\n\n먼저 찾아간 영업이라 기업이 먼저 보낸 제안보다 금액이 조금 낮을 수 있습니다.`,{imp:true,kind:'스폰서',acts:[{l:'스폰서 보기',a:'go',v:'club:spon'}]}); else mail('마케팅팀',`영업 결과: ${SPON_SLOT[x.slot].l} 새 제안 없음`,'관심을 보인 기업이 모두 이미 제안을 보낸 곳이었습니다. 받은 제안은 그대로 유효합니다.',{kind:'스폰서'}); }
    else mail('마케팅팀',`영업 결과: ${SPON_SLOT[x.slot].l} 관심 기업 없음`,`여러 기업을 만났지만 지금 구단 가치(지수 ${Math.round(sponVal()*100)})로는 조건이 맞지 않았습니다. 성적과 팬 여론이 오르면 다시 시도해 보세요.`,{kind:'스폰서'}); }
  S.pitch=S.pitch.filter(x=>!x.done||G.day-x.day<30); }
/* 영업 성공률과 제안 만들기: 재임 중·이직 뒤 같은 판정(지시한 단장 명성 포함, 이미 제안한 기업이 뽑히면 다른 기업을 찾는다, 검수 11-09zza) */
function sponPitchP(tid){ return clamp(.45+(sponVal(tid)-1)*.8+((G.rep??50)-50)/200,.15,.9); }
function sponPitchMake(S,slot,tid){ S.off=(S.off||[]).filter(o=>o.exp>=G.day); const room=Math.max(0,3-S.off.filter(o=>o.slot===slot).length), n=Math.min(room,R()<.35?2:1), made=[]; let tries=0; for(let i=0;i<n&&tries<12;i++){ tries++; const o=sponMake(slot,{tid,S}); o.amt=round5(o.amt*rnd(.92,1.02)); if(S.off.some(z=>z.slot===slot&&z.co===o.co)){ i--; continue; } S.off.push(o); made.push(o); } return made; }
/* 단장이 떠난 구단의 영업(돈은 이미 냈다)도 예정일에 결과를 낸다: 제안은 그 구단 계약서에 남아 돌아오면 볼 수 있다(검수 11-06) */
function sponPitchOld(){ const L=Object.assign({},G.sponT||{}); if(G.unemp&&G.spon&&G.unemp.from!=null)L[G.unemp.from]=G.spon; /* 무직 중엔 G.spon이 떠난 구단 것 */ for(const tid in L){ const S=L[tid]; if(!S||!S.pitch)continue; for(const x of S.pitch){ if(x.done||x.due>G.day)continue; x.done=true; const c=S.c&&S.c[x.slot]; if(c&&c.until>=sponSeason())continue; S.off=(S.off||[]).filter(z=>z.exp>=G.day); /* 만료 제안은 중복 판정에서 뺀다(검수 11-09i) */ if(R()<sponPitchP(+tid))sponPitchMake(S,x.slot,+tid); /* 같은 자리 같은 기업 중복 없음(이직 뒤에도, 검수 11-08) */ } S.pitch=S.pitch.filter(x=>!x.done||G.day-x.day<30); } }
/* 가을야구 확정(수학적): 남은 경기를 다 져도 우리 승률 이상을 아직 낼 수 있는 구단이 4곳 이하면 5위 안이 확정. 순위는 승률(무승부 제외)이라 승수만 보지 않는다. 동률은 보수적으로 위협으로 센다(검수 11-09zn) */
function psClinched(tid){ const R=G.sea&&G.sea.rec; if(!R||!R[tid])return false; const gp=r=>r.w+r.l+(r.t||0), N=seasonG(); const me=R[tid], lo=me.w/Math.max(1,me.w+me.l+Math.max(0,N-gp(me)));
  return G.teams.filter(t=>{ const r=R[t.id]; if(t.id===tid||!r)return false; const left=Math.max(0,N-gp(r)); return (r.w+left)/Math.max(1,r.w+r.l+left)>=lo; }).length<=4; }

/* 결산 전 예상: 가을야구·우승 성과 보너스(결산 sponSettle과 같은 기준, 상태는 바꾸지 않는다) */
function sponBonusEst(y,champ){ const S=G.spon; if(!S)return 0; const P=G.sea&&G.sea.y===y?G.ps:null; /* 지난 시즌 포스트시즌은 다음 시즌 전망에 넣지 않는다(검수 11-09zn) */ const si=P&&P.seeds?P.seeds.indexOf(G.user):-1; let inPS=si>=0&&(si<4||psSeedsNow(P)[4]!=null); /* 5위 결정전이 남았으면 잠정 5위·6위는 아직 진출 전(검수 11-09zn) */ if(!(P&&P.seeds)&&y===G.year)try{ inPS=psClinched(G.user); }catch(e){} /* 정규시즌 중 가을야구를 확정하면 진출 보너스를 바로 전망에(검수 11-09i) */ let b=0; for(const k in S.c){ const c=S.c[k]; if(!(c.y0<=y&&c.until>=y))continue; const eff=c.y0===y?(c.first??1):1; if(!(eff>0))continue; const bf=c.y0===y&&c.bf!=null?c.bf:1; if(inPS&&c.ps&&!(c.psNo&&c.y0===y))b+=Math.round(c.ps*bf); if(champ===G.user&&c.champ)b+=Math.round(c.champ*bf); } return b; }
