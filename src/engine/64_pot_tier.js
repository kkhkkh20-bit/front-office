/* ---------- 잠재력은 숫자가 아니라 스카우트의 '말'로 ----------
   진짜 잠재력(p.pot)은 화면에 내보내지 않는다. 스카우트·코치진·감독의 추정치를 등급 문장으로 바꿔 보여 주고,
   그대로 크지 못할 수 있는 이유(큰 부상, 출전 기회, 훈련 환경, 나이)를 함께 붙인다. 정렬·비교에는 추정치를 그대로 쓴다 */
/* 기준(내부 20~80 척도): 1군 주전 평균 약 53, 리그 상위 5% 약 60 */
const POT_T=[[66,'세계적인 선수가 될 재목','세계적 재목',6],[60,'리그 정상급으로 클 재목','정상급 재목',5],[53,'1군 주전으로 자리 잡을 선수','주전감',4],[48,'1군에서 쓸 만한 선수','1군 자원',3],[44,'1군과 2군 경계에 설 선수','경계선',2],[0,'1군은 어려워 보이는 선수','2군 자원',1]];
/* 오차가 큰 추정은 한가운데 쪽으로 당겨서 말한다(관찰이 적은 고교 선수를 '세계적'으로 쉽게 부르지 않게) */
function potVal(rp){ if(!rp||rp.ofp==null)return null; const sd=Math.min(8,rp.sd||0); const v=rp.ofp-Math.max(0,sd-3)*.7; return rp.cur!=null&&rp.ofp>rp.cur+1?Math.max(v,Math.min(rp.ofp,rp.cur+2)):v; }
function potTier(v,cur){ if(v==null||isNaN(v))return null; const tf=x=>POT_T.find(t=>x>=t[0])||POT_T[POT_T.length-1]; if(cur!=null&&v<=cur+1)return {l:'지금이 거의 완성된 모습',s:'완성형',n:Math.max(1,tf(v)[3]),done:true};
  const t=tf(v); return {l:t[1],s:t[2],n:t[3]}; }
/* 우리 쪽 추정으로 본 '더 클 여지'(진짜 잠재력은 쓰지 않는다) */
function potGapEst(p){ try{ const rp=scoutReport(p); const v=potVal(rp); return v==null?0:Math.max(0,v-(rp.cur??ovr(p))); }catch(e){ return 0; } }
/* 트레이드 제안이 오면 스카우트·전력분석팀이 받는 선수의 잠재력 추정을 바로 보고한다(추정일 뿐, 맞을 수도 틀릴 수도 있다) */
function offScoutNote(o){ const L=[]; for(const id of (o.give||[])){ const p=G.players[id]; if(!p)continue; let rp; try{ rp=scoutReport(p); }catch(e){ continue; }
    L.push(`${p.name}(${posLabel(p)}, ${p.age}세) — ${potLine(p,rp,{none:`${rp.who||'담당 스카우트 없음'}: 이 구단을 맡은 프로 스카우트가 없어 잠재력은 추정하지 못했습니다.`})}`); }
  return L.join('\n'); }
/* 그대로 크지 못할 수 있는 이유: 실제 상태(부상 이력·출전·시설·코치·나이)를 근거로 든다 */
function potRisks(p){ const R0=[]; if(!p)return R0;
  const big=(p.injHist||[]).filter(i=>(i.days||0)>=120).length; if(big)R0.push(`큰 부상 이력(${big}번)이 있어 회복 정도가 변수`);
  else if(p.injOut>=60)R0.push('지금의 장기 부상에서 어떻게 돌아오느냐가 변수');
  if(p.team!=null&&p.age<=25){ try{ const ps=playShare(p); if(ps<=.92)R0.push('1군·2군 출전 기회가 적으면 크는 속도가 늦어짐'); }catch(e){}
    if(p.team===G.user){ try{ const f=facEff(p); if(f&&f.g!=null&&f.g<1)R0.push('훈련 시설이 부족하면 덜 큼'); }catch(e){} if(G.coach&&typeof coachDevMult==='function'){ try{ if(coachDevMult(p)<1)R0.push('담당 코치 역량이 낮으면 덜 큼'); }catch(e){} } } }
  if(p.age>=27)R0.push('성장기가 끝나 가는 나이'); return R0; }
/* 한 줄: '스카우트 ○○: 리그 정상급으로 클 재목(확신 보통). 다만 …' */
function potLine(p,rp,o){ o=o||{}; rp=rp||scoutReport(p); const T=potTierP(rp,p); if(!T)return o.none||'잠재력은 아직 판단할 수 없습니다(담당 스카우트 필요).';
  const rk=T.done?[]:potRisks(p); return `${o.who===false?'':`${rp.who||'스카우트'} 평가: `}${T.l}${rp.conf?`(확신 ${rp.conf})`:''}.${rk.length&&!o.short?` 다만 ${rk.slice(0,2).join(', ')}.`:''}`; }
/* 역할을 감안한 말: 불펜으로 보는 투수는 '세계적'이 아니라 '정상급 불펜'으로 */
const POT_M=['','2군 수준에 머물 선수','1군·2군 경계 수준까지 오를 선수','1군에서 쓸 만한 수준까지 오를 선수','1군 주전급까지 오를 선수','리그 정상급까지 오를 선수','세계적인 수준까지 오를 선수'];
const POT_MS=['','2군 수준','경계선','1군 자원','주전급','정상급','세계적 수준'];
function potTierP(rp,p){ let T=potTier(potVal(rp),rp&&rp.cur); if(!T)return T; if(!T.done&&p&&p.age>=27)T={...T,l:POT_M[T.n],s:POT_MS[T.n]}; /* 다 자란 나이에는 '재목'이 아니라 '어디까지 오를지'로 말한다 */ if(T.n>=5&&rp.role&&/불펜|마무리|필승/.test(rp.role))return {...T,l:p&&p.age>=27?'리그 정상급 불펜까지 오를 선수':'리그 최고 수준의 불펜이 될 재목',s:'정상급 불펜감',n:5}; return T; }
