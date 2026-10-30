/* ===== 시설 투자 재원 =====
   실제 KBO에서 큰 시설 투자는 운영비가 아니라 별도 재원으로 한다. 2군 구장·훈련장·숙소 같은 훈련 시설은 대부분 모기업 투자,
   1군 구장은 지자체 소유라 리모델링은 지자체와 구단이 나눠 낸다. 그래서 공사비를 내는 길을 셋으로 둔다.
   - 구단 보유 현금(적립금): 바로 착공. 연간 운영 예산(예산 여유)과는 별개다
   - 모기업 투자 요청(훈련 시설): 구단주 신뢰·성향·금액에 따라 승인. 거절되면 신뢰 -1, 60일 뒤 다시 요청
   - 지자체 분담 협의(구장): 승인되면 지자체가 절반을 낸다. 구단 인기·팬 여론이 높을수록 잘 된다 */
function capexState(){ return G.capex=G.capex||{last:{}}; }
function capexOdds(kind,c){ const t=team(G.user); if(kind==='fac'){ if(t.indie)return 0; return clamp(.3+(t.trust-50)/70+({win:.12,pr:.05,profit:-.15}[t.owner]||0)-c/30000+cwRapMod(),.05,.9); }
  return clamp(.35+(t.pop-1)*.4+((G.pr?G.pr.fan:55)-55)/100,.1,.8); }
function capexAsk(kind,k){ const S=capexState(); const key=kind; if(S.last[key]!=null&&G.day-S.last[key]<60)return `다시 요청하려면 ${dmd(S.last[key]+60)}까지 기다려야 합니다.`; const t=team(G.user);
  if(kind==='fac'){ facInit(); const F=FACI[k]; if(!F)return '없는 시설입니다.'; const lv=G.fac.it[k]; if(lv>=3)return '이미 최고 단계입니다.'; if(G.fac.bld[k])return '이미 공사 중입니다.'; if(Object.keys(G.fac.bld).length>=2)return '공사는 동시에 2곳까지만 할 수 있습니다.'; if(t.indie)return '독립구단은 모기업이 없습니다. 보유 현금으로만 지을 수 있습니다.';
    const c=F.c[lv+1]; const p=capexOdds('fac',c); S.last[key]=G.day; const B=bossOf(G.user);
    if(R()<p){ G.fac.bld[k]={lv:lv+1,done:G.day+F.days[lv+1],c,cap:true}; addLog(`모기업 투자로 ${F.l} ${F.lv[lv+1]} 공사를 시작했습니다(모기업 부담 ${money(c)}).`); mail('구단주실',`모기업 투자 승인: ${F.l}`,`${B.own.name} 회장이 ${F.l} ${F.lv[lv+1]} 공사비 ${money(c)}을(를) 모기업에서 내기로 했습니다. 구단 현금과 운영 예산은 그대로입니다. 완공 뒤 유지비(연 ${money(F.up[lv+1])})는 운영비에서 나갑니다.`,{kind:'구단주'}); return ''; }
    t.trust=clamp(t.trust-1,0,100); mail('구단주실',`모기업 투자 보류: ${F.l}`,`"지금은 그 돈을 쓸 때가 아닙니다." 승인 가능성은 ${Math.round(p*100)}%였습니다. 구단주 신뢰 -1. 60일 뒤 다시 요청할 수 있고, 급하면 구단 보유 현금으로 지을 수 있습니다.`,{kind:'구단주'}); return `모기업 투자가 보류됐습니다(가능성 ${Math.round(p*100)}%였음, 신뢰 -1).`; }
  const St=stadOf(G.user); const it=STAD_ITEMS.find(x=>x.k===k); if(!it)return '없는 시설입니다.'; const lv=St.lv[k]; if(lv>=5)return '이미 최고 단계입니다.'; if((St.build||[]).some(b=>b.k===k))return '이미 공사 중입니다.';
  if(!stadWindow())return '구장 공사는 시즌이 끝난 뒤(10월~2월)에만 시작할 수 있습니다.';
  const c=STAD_COST[lv+1], half=Math.round(c/2); if(t.cash<half)return `구단 부담분 ${money(half)}이 필요합니다(보유 ${money(t.cash)}).`; const p=capexOdds('stad',c); S.last[key]=G.day;
  if(R()<p){ t.cash-=half; St.build=(St.build||[]).concat({k,lv:lv+1,done:G.day+STAD_DAYS[lv+1]}); G.spend.stad=(G.spend.stad||0)+half; addLog(`${t.city}시와 비용을 나눠 ${stadName(G.user)} ${it.l} ${lv+1}단계 공사를 시작했습니다(구단 ${money(half)} · 지자체 ${money(c-half)}).`);
    mail('운영팀',`지자체 분담 합의: ${it.l}`,`${t.city}시가 공사비의 절반(${money(c-half)})을 내기로 했습니다. 구단은 ${money(half)}을(를) 냈습니다.`,{kind:'시설'}); return ''; }
  return `${t.city}시가 이번에는 예산 반영이 어렵다고 합니다(가능성 ${Math.round(p*100)}%였음). 60일 뒤 다시 협의할 수 있습니다. 구단 인기와 팬 여론이 오르면 잘 됩니다.`; }
