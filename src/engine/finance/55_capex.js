/* ===== 시설 투자 재원 =====
   실제 KBO에서 큰 시설 투자는 운영비가 아니라 별도 재원으로 한다. 2군 구장·훈련장·숙소 같은 훈련 시설은 대부분 모기업 투자,
   1군 구장은 지자체 소유라 리모델링은 지자체와 구단이 나눠 낸다. 그래서 공사비를 내는 길을 셋으로 둔다.
   - 구단 보유 현금(적립금): 바로 착공. 연간 운영 예산(예산 여유)과는 별개다
   - 모기업 투자 요청(훈련 시설): 구단주 신뢰·성향·금액·지난 결산 적자에 따라 승인(AI 구단과 같은 식, 57_club_econ capexOddsT). 거절되면 신뢰 -1, 120일 뒤 다시 요청. 한 시즌 두 번째는 어렵다
   - 명명권 후원·지자체 보조(훈련 시설 일부): 57_club_econ facFund
   - 지자체 분담 협의(구장): 승인되면 지자체가 절반을 낸다. 구단 인기·팬 여론이 높을수록 잘 된다 */
function capexState(){ return G.capex=G.capex||{last:{}}; }
function capexOdds(kind,c){ const t=team(G.user); if(kind==='fac')return capexOddsT(G.user,c); /* 구단주와 관계(신뢰 + 개인적 친분)가 좋을수록 잘 된다(사용자 11-05) */
  return clamp(.35+(t.pop-1)*.4+((G.pr?G.pr.fan:55)-55)/100,.1,.8); }
function capexAsk(kind,k){ const S=capexState(); const key=kind; const t=team(G.user); if(kind==='fac'){ const w=capexWait(G.user); if(w)return `다시 요청하려면 ${dmd(w)}까지 기다려야 합니다.`; } else if(S.last[key]!=null&&G.day-S.last[key]<60)return `다시 요청하려면 ${dmd(S.last[key]+60)}까지 기다려야 합니다.`;
  if(kind==='fac'){ facInit(); const F=FACI[k]; if(!F)return '없는 시설입니다.'; const lv=G.fac.it[k]; { const e=facCanStart(G.user,k); if(e)return e; } if(t.indie)return '독립구단은 모기업이 없습니다. 보유 현금으로만 지을 수 있습니다.';
    const c=F.c[lv+1]; const p=capexOdds('fac',c); S.last[key]=G.day; t.capexD=G.day; const B=bossOf(G.user);
    if(R()<p){ t.capexY=sponSeason(); t.capN=(t.capN||0)+1; const b=facStartBuild(G.user,k,{src:'cap',cap:true}); clubFacilityHistory('fac',G.user,F.l,'착공',{...b,src:'모기업 투자'}); facStartNews(G.user,k,b); G.fac.inv=(G.fac.inv||0)+c; (G.fac.hist=G.fac.hist||[]).push({d:G.day,k,lv:lv+1,c,src:'cap'}); /* 모기업 투자도 구단 이력에(이직 뒤 리그 비교에 남게, 검수 11-08) */ addLog(`모기업 투자로 ${F.l} ${F.lv[lv+1]} 공사를 시작했습니다(모기업 부담 ${money(c)}).`); mail('구단주실',`모기업 투자 승인: ${F.l}`,`${B.own.name} 회장이 ${F.l} ${F.lv[lv+1]} 공사비 ${money(c)}을(를) 모기업에서 내기로 했습니다. 구단 현금과 운영 예산은 그대로입니다. 완공 뒤 유지비(연 ${money(F.up[lv+1])})는 운영비에서 나갑니다.`,{kind:'구단주'}); return ''; }
    t.trust=clamp(t.trust-1,0,100); mail('구단주실',`모기업 투자 보류: ${F.l}`,`"${capexLastFin(G.user)&&capexLastFin(G.user).net<0?'적자 구단에 공사비까지 대 줄 수는 없습니다.':'지금은 그 돈을 쓸 때가 아닙니다.'}" 구단주 신뢰가 조금 떨어졌습니다. 120일 뒤 다시 요청할 수 있고, 구단 현금이나 명명권 후원·지자체 보조를 알아볼 수도 있습니다.`,{kind:'구단주'}); return '모기업 투자가 보류됐습니다. 구단주 신뢰가 조금 떨어졌습니다.'; }
  const St=stadOf(G.user); const it=STAD_ITEMS.find(x=>x.k===k); if(!it)return '없는 시설입니다.'; const lv=St.lv[k]; if(lv>=STAD_MAX)return '이미 최고 단계입니다.'; if((St.build||[]).some(b=>b.k===k))return '이미 공사 중입니다.';
  if(!stadWindow())return '구장 공사는 시즌이 끝난 뒤(10월~2월)에만 시작할 수 있습니다.';
  const c=STAD_COST[lv+1], half=Math.round(c/2), rsv=t.indie?newStadDue(G.user):0, av=spendable(G.user); /* 트레이드 약정 현금(검수 11-09v)과 독립구단의 결산 때 낼 신구장 분담금(검수 11-09x)은 spendable이 뺀다 */ if(av<half)return `구단 부담분 ${money(half)}이 필요합니다(쓸 수 있는 돈 ${money(Math.max(0,av))}${rsv?`, 신구장 분담금 ${money(rsv)}은 결산 때 낼 돈`:''}).`; const p=capexOdds('stad',c); S.last[key]=G.day;
  if(R()<p){ const k0=spendPay(half); St.build=(St.build||[]).concat({k,lv:lv+1,done:G.day+STAD_DAYS[lv+1],c:half,totalC:c,sup:half-k0,ep:G.spEp}); G.spend.stad=(G.spend.stad||0)+k0; clubFacilityHistory('stad',G.user,`${stadName(G.user)} ${it.l}`,'착공',{...St.build[St.build.length-1],c,src:`구단 ${money(half)} · 지자체 ${money(c-half)}`}); addLog(`${t.city}시와 비용을 나눠 ${stadName(G.user)} ${it.l} ${lv+1}단계 공사를 시작했습니다(구단 ${money(half)} · 지자체 ${money(c-half)}).`);
    mail('운영팀',`지자체 분담 합의: ${it.l}`,`${t.city}시가 공사비의 절반(${money(c-half)})을 내기로 했습니다. 구단은 ${money(half)}을(를) 냈습니다.`,{kind:'시설'}); return ''; }
  return `${t.city}시가 이번에는 예산 반영이 어렵다고 합니다(가능성 ${Math.round(p*100)}%였음). 60일 뒤 다시 협의할 수 있습니다. 구단 인기와 팬 여론이 오르면 잘 됩니다.`; }
