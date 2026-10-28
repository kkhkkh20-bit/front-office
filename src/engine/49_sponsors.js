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
  for(const k of Object.keys(SPON_SLOT)){ const d=SPON_SLOT[k]; if(d.indie&&!t.indie)continue; if(k==='main'||R()<.6){ const o=sponMake(k,{base:true}); o.yrs=k==='main'?3:ri(1,2); sponSign(o,true); } }
  return S; }
function sponSeason(){ return G.last&&G.last.y>=G.year?G.year+1:G.year; } /* 결산이 끝났으면 다음 시즌 계약 */
/* 스폰서 가치: 1.0이 리그 평균 */
function sponVal(tid){ tid=tid??G.user; const t=team(tid); let v=.45+t.market*.3+clamp(t.pop,0,1.6)*.25;
  const h=G.history&&G.history.length?G.history[G.history.length-1]:null; if(h){ const i=h.order.findIndex(o=>o.tid===tid); if(i>=0)v+=(4.5-i)*.03; if(h.champ===tid)v+=.12; }
  if(tid===G.user&&G.pr){ v+=(G.pr.fan-55)/250+(G.pr.press-50)/400; }
  try{ v+=Math.min(.25,teamStar(tid).v*.004); }catch(e){}
  return clamp(v,.55,1.9); }
function sponValParts(){ const t=team(G.user); const h=G.history&&G.history.length?G.history[G.history.length-1]:null; const i=h?h.order.findIndex(o=>o.tid===G.user):-1; let st=0; try{ st=Math.min(.25,teamStar(G.user).v*.004); }catch(e){}
  return [['시장 규모',t.market*.3-.3],['구단 인기',clamp(t.pop,0,1.6)*.25-.25],['지난 시즌 성적',h&&i>=0?(4.5-i)*.03+(h.champ===G.user?.12:0):0],['팬 여론',G.pr?(G.pr.fan-55)/250:0],['언론 논조',G.pr?(G.pr.press-50)/400:0],['스타 선수',st]]; }
function sponMake(slot,o){ o=o||{}; const S=G.spon; const ind=pick(SPON_IND[slot]); const co=pick(SPON_CO[ind]); const v=sponVal();
  const style=o.base?'std':pick(['std','std','bonus','safe','long']); const yrs=style==='long'?3:style==='safe'?ri(1,2):ri(1,3);
  let amt=SPON_SLOT[slot].b*ecoIdx()*v*rnd(.85,1.15)*(style==='bonus'?.82:style==='safe'?1.06:style==='long'?.95:1)*(o.renew?1.05:1);
  const bon=style==='bonus'?[.35,.7]:style==='safe'?[0,.1]:[.12,.3];
  const x={id:S.nid++,slot,co,ind,amt:round5(amt),yrs,ps:round5(amt*rnd(bon[0],bon[0]+.1)),champ:round5(amt*rnd(bon[1]-.05,bon[1]+.15)),img:R()<(o.base?.2:.35),style,day:G.day,exp:G.day+21,cnt:0,renew:!!o.renew};
  return x; }
function sponSign(o,silent){ const S=G.spon; const y0=sponSeason(); const inSea=y0===G.year&&G.cal&&G.day>G.cal.open; const over=inSea&&G.day>=G.cal.end; /* 정규시즌이 끝난 뒤 결산 전 계약: 올해 몫은 없고 계약 기간은 다음 시즌부터 센다 */
  const first=over?0:inSea?Math.max(.15,(G.cal.end-G.day)/(G.cal.end-G.cal.open)):1;
  S.c[o.slot]={co:o.co,ind:o.ind,amt:o.amt,ps:o.ps,champ:o.champ,img:o.img,y0,until:y0+o.yrs-1+(over?1:0),first,id:o.id};
  S.off=S.off.filter(x=>x.slot!==o.slot); if(!silent){ addLog(`${o.co}(${o.ind})와(과) ${SPON_SLOT[o.slot].l} 계약: ${o.yrs}년, 연 ${money(o.amt)}.`); chron&&chron('spon',`${o.co} ${SPON_SLOT[o.slot].l} 계약 (${o.yrs}년 연 ${money(o.amt)})`);
    if(o.amt>=SPON_SLOT[o.slot].b*1.15)news('구단',`${tshort(G.user)}, ${o.co}와(과) ${SPON_SLOT[o.slot].l} 계약`,`${o.yrs}년 연 ${money(o.amt)} 규모입니다. 구단 가치가 올랐다는 평가가 나옵니다.`,1); } }
/* 올해(진행 중이거나 다음) 시즌에 들어올 기본 금액 */
function sponIncome(y){ const S=G.spon; if(!S)return 0; y=y??sponSeason(); let s=0; for(const k in S.c){ const c=S.c[k]; if(c.y0<=y&&c.until>=y)s+=c.amt*(c.y0===y?c.first:1); } return Math.round(s); }
function sponOpen(k){ const c=G.spon.c[k]; const y=sponSeason(); return !c||c.until<y; }
/* 제안: 11월 10일·12월 1일·1월 10일, 시즌 중에는 매달 1일 빈자리에 가끔 */
function sponDaily(){ if(G.unemp)return; const S=sponInit(); const o=dobj(G.day); const t=team(G.user); try{ sponPitchDaily(); }catch(e){}
  S.off=S.off.filter(x=>x.exp>=G.day);
  const off=(o.m===11&&o.d===10)||(o.m===12&&o.d===1)||(o.m===1&&o.d===10)||(o.m===2&&o.d===1)||(o.m===3&&o.d===1); const sea=o.d===1&&period()==='season'&&R()<.35;
  if(!off&&!sea)return; const made=[];
  for(const k of Object.keys(SPON_SLOT)){ if(SPON_SLOT[k].indie&&!t.indie)continue; if(!sponOpen(k))continue; const have=S.off.filter(x=>x.slot===k).length; const n=off?ri(1,2):(R()<.5?1:0);
    for(let i=0;i<n&&have+i<3;i++){ const old=S.c[k]; const x=sponMake(k,{renew:old&&old.until===G.year&&i===0&&!S.off.some(z=>z.slot===k&&z.renew)}); if(x.renew){ x.co=old.co; x.ind=old.ind; } S.off.push(x); made.push(x); } }
  if(made.length)mail('마케팅팀',`스폰서 제안 ${made.length}건`,`${made.map(x=>`${SPON_SLOT[x.slot].l}: ${x.co}(${x.ind}) ${x.yrs}년 연 ${money(x.amt)}${x.renew?' · 재계약':''}`).join('\n')}\n\n제안은 3주 동안 유효합니다. 구단 가치 지수 ${Math.round(sponVal()*100)}.`,{kind:'스폰서',imp:true,acts:[{l:'스폰서 보기',a:'go',v:'club:spon'}]}); }
function sponAccept(id){ const S=G.spon; const o=S.off.find(x=>x.id===id); if(!o)return '제안이 없습니다.'; if(!sponOpen(o.slot))return '이미 계약된 자리입니다.'; sponSign(o); return `계약 완료: ${o.co}, ${SPON_SLOT[o.slot].l} ${o.yrs}년 연 ${money(o.amt)}`; }
function sponReject(id){ const S=G.spon; S.off=S.off.filter(x=>x.id!==id); return '제안을 거절했습니다.'; }
/* 조건 상향 요청: 구단 가치가 높을수록, 기업이 적극적일수록 받아들인다 */
function sponCounter(id,pct){ const S=G.spon; const o=S.off.find(x=>x.id===id); if(!o)return '제안이 없습니다.'; if(o.cnt>=1)return `${o.co}: 더 이상은 어렵습니다.`;
  o.cnt++; const v=sponVal(); const comp=S.off.filter(x=>x.slot===o.slot).length; const p=clamp(.62+(v-1)*.6+(comp-1)*.12-(pct-.1)*2.2+(o.renew?.1:0),.08,.92);
  if(R()<p){ o.amt=round5(o.amt*(1+pct)); o.ps=round5(o.ps*(1+pct*.5)); return `${o.co}: 요청하신 조건을 받아들이겠습니다. 연 ${money(o.amt)}.`; }
  if(R()<.45){ S.off=S.off.filter(x=>x.id!==id); return `${o.co}: 그 금액은 어렵습니다. 이번 제안은 철회하겠습니다.`; }
  return `${o.co}: 조건 상향은 어렵습니다. 처음 제안 그대로라면 계약하겠습니다.`; }
/* 시즌 결산: 기본 금액 + 성과 보너스, 이미지 조항, 만료 처리 */
function sponSettle(y,ps){ const S=G.spon; if(!S)return {base:0,bonus:0,L:[]}; let base=0,bonus=0; const L=[];
  for(const k in S.c){ const c=S.c[k]; if(!(c.y0<=y&&c.until>=y))continue; base+=c.amt*(c.y0===y?c.first:1);
    const inPS=!!(G.ps&&G.ps.seeds&&G.ps.seeds.includes(G.user)); if(inPS&&c.ps){ bonus+=c.ps; L.push(`${c.co} 가을야구 보너스 ${money(c.ps)}`); } if(ps&&ps.champ===G.user&&c.champ){ bonus+=c.champ; L.push(`${c.co} 우승 보너스 ${money(c.champ)}`); }
    if(c.img&&G.pr&&G.pr.press<30&&c.until>y){ c.amt=round5(c.amt*.8); L.push(`${c.co}: 이미지 조항으로 다음 해 금액 20% 감액`); } }
  for(const k in S.c){ if(S.c[k].until===y){ S.hist.push(Object.assign({slot:k},S.c[k])); } }
  if(S.hist.length>40)S.hist=S.hist.slice(-40);
  { const exp=Object.keys(S.c).filter(k=>S.c[k].until===y); mail('마케팅팀',`${y} 스폰서 결산: ${money(Math.round(base+bonus))}`,`기본 계약 ${money(Math.round(base))}${bonus?`, 성과 보너스 ${money(Math.round(bonus))}`:''}.${L.length?'\n'+L.join('\n'):''}${exp.length?`\n\n이번 시즌으로 끝나는 계약: ${exp.map(k=>`${S.c[k].co}(${SPON_SLOT[k].l})`).join(', ')}. 11월 중순부터 재계약·신규 제안이 들어옵니다.`:''}`,{kind:'스폰서',acts:[{l:'스폰서 보기',a:'go',v:'club:spon'}]}); }
  return {base:Math.round(base),bonus:Math.round(bonus),L}; }
/* 팬 여론이 바닥이면 드물게 계약 해지 */
function sponMonthly(){ const S=G.spon; if(!S||!G.pr||G.pr.fan>=25)return; for(const k in S.c){ const c=S.c[k]; if(c.until<G.year||R()>=.06)continue; delete S.c[k]; mail('마케팅팀',`${c.co} 스폰서 계약 해지`,`팬 여론 악화로 ${c.co}이(가) ${SPON_SLOT[k].l} 계약을 해지했습니다. 남은 금액은 들어오지 않습니다.`,{kind:'스폰서',imp:true}); news('구단',`${c.co}, ${tshort(G.user)} 스폰서 철수`,'성난 팬심이 기업 이미지에도 부담이 된다는 판단입니다.',-2); break; } }
/* AI 구단 스폰서 수입(결산용) */
function sponAI(tid){ return Math.round(sum(Object.keys(SPON_SLOT).filter(k=>!SPON_SLOT[k].indie).map(k=>SPON_SLOT[k].b))*ecoIdx()*sponVal(tid)*.85); }
/* 영업 활동: 단장이 마케팅팀에 빈자리 영업을 지시한다. 영업비 3천만 원, 1~2주 뒤 결과.
   성공률은 구단 가치 지수와 단장 평판을 따른다. 자리마다 한 달에 한 번 */
function sponPitch(slot){ const S=sponInit(); if(!SPON_SLOT[slot])return '없는 자리입니다.'; if(!sponOpen(slot))return '이미 계약된 자리입니다.';
  S.pitch=S.pitch||[]; if(S.pitch.some(x=>x.slot===slot&&G.day-x.day<30))return '이 자리는 이미 영업 중이거나 이번 달에 시도했습니다.';
  G.spend.etc=(G.spend.etc||0)+30; S.pitch.push({slot,day:G.day,due:G.day+ri(7,14),done:false});
  return `마케팅팀이 ${SPON_SLOT[slot].l} 영업을 시작했습니다(영업비 3천만 원). 1~2주 뒤 결과를 보고합니다.`; }
function sponPitchDaily(){ const S=G.spon; if(!S||!S.pitch)return; for(const x of S.pitch){ if(x.done||x.due>G.day)continue; x.done=true; if(!sponOpen(x.slot))continue;
    const p=clamp(.45+(sponVal()-1)*.8+((G.rep??50)-50)/200,.15,.9); if(R()<p){ const n=R()<.35?2:1; const made=[]; for(let i=0;i<n;i++){ const o=sponMake(x.slot); o.amt=round5(o.amt*rnd(.92,1.02)); S.off.push(o); made.push(o); }
      mail('마케팅팀',`영업 성과: ${SPON_SLOT[x.slot].l} 제안 ${made.length}건`,`${made.map(o=>`${o.co}(${o.ind}) ${o.yrs}년 연 ${money(o.amt)}`).join('\n')}\n\n먼저 찾아간 영업이라 기업이 먼저 보낸 제안보다 금액이 조금 낮을 수 있습니다.`,{imp:true,kind:'스폰서',acts:[{l:'스폰서 보기',a:'go',v:'club:spon'}]}); }
    else mail('마케팅팀',`영업 결과: ${SPON_SLOT[x.slot].l} 관심 기업 없음`,`여러 기업을 만났지만 지금 구단 가치(지수 ${Math.round(sponVal()*100)})로는 조건이 맞지 않았습니다. 성적과 팬 여론이 오르면 다시 시도해 보세요.`,{kind:'스폰서'}); }
  S.pitch=S.pitch.filter(x=>!x.done||G.day-x.day<30); }
