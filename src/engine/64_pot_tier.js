/* ---------- 잠재력은 숫자가 아니라 스카우트의 '말'로 ----------
   진짜 잠재력(p.pot)은 화면에 내보내지 않는다. 스카우트·코치진·감독의 추정치를 등급 문장으로 바꿔 보여 주고,
   그대로 크지 못할 수 있는 이유(큰 부상, 출전 기회, 훈련 환경, 나이)를 함께 붙인다. 정렬·비교에는 추정치를 그대로 쓴다 */
const POT_T=[[76,'세계적인 선수가 될 재목','세계적 재목',6],[70,'리그 정상급으로 클 재목','정상급 재목',5],[64,'1군 주전으로 자리 잡을 선수','주전감',4],[58,'1군에서 쓸 만한 선수','1군 자원',3],[52,'1군과 2군 경계에 설 선수','경계선',2],[0,'1군은 어려워 보이는 선수','2군 자원',1]];
function potTier(v,cur){ if(v==null)return null; if(cur!=null&&v<=cur+1)return {l:'지금이 거의 완성된 모습',s:'완성형',n:Math.max(1,POT_T.find(t=>v>=t[0])[3]),done:true};
  const t=POT_T.find(x=>v>=x[0]); return {l:t[1],s:t[2],n:t[3]}; }
/* 그대로 크지 못할 수 있는 이유: 실제 상태(부상 이력·출전·시설·코치·나이)를 근거로 든다 */
function potRisks(p){ const R0=[]; if(!p)return R0;
  const big=(p.injHist||[]).filter(i=>(i.days||0)>=120).length; if(big)R0.push(`큰 부상 이력(${big}번)이 있어 회복 정도가 변수`);
  else if(p.injOut>=60)R0.push('지금의 장기 부상에서 어떻게 돌아오느냐가 변수');
  if(p.team!=null&&p.age<=25){ try{ const ps=playShare(p); if(ps<=.92)R0.push('1군·2군 출전 기회가 적으면 크는 속도가 늦어짐'); }catch(e){}
    if(p.team===G.user){ try{ const f=facEff(p); if(f&&f.g!=null&&f.g<1)R0.push('훈련 시설이 부족하면 덜 큼'); }catch(e){} if(G.coach&&typeof coachDevMult==='function'){ try{ if(coachDevMult(p)<1)R0.push('담당 코치 역량이 낮으면 덜 큼'); }catch(e){} } } }
  if(p.age>=27)R0.push('성장기가 끝나 가는 나이'); return R0; }
/* 한 줄: '스카우트 ○○: 리그 정상급으로 클 재목(확신 보통). 다만 …' */
function potLine(p,rp,o){ o=o||{}; rp=rp||scoutReport(p); const T=potTier(rp.ofp,rp.cur); if(!T)return o.none||'잠재력은 아직 판단할 수 없습니다(담당 스카우트 필요).';
  const rk=T.done?[]:potRisks(p); return `${o.who===false?'':`${rp.who||'스카우트'} 평가: `}${T.l}${rp.conf?`(확신 ${rp.conf})`:''}.${rk.length&&!o.short?` 다만 ${rk.slice(0,2).join(', ')}.`:''}`; }
