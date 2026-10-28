/* ---------- 홈 상태 타일: FM 대시보드처럼 구단 상태를 한눈에 ----------
   순위·다음 일정·팀 분위기·부상자·구단주 신뢰·예산·여론을 숫자 하나와 짧은 설명으로 보여 주고, 누르면 해당 화면으로 간다 */
function dashTiles(){ if(G.unemp||G.gameOver)return ''; const T=[]; const t=team(G.user); const per=period();
  const tile=(lab,val,sub,go,cls,meter)=>`<button class="dtl ${cls||''}" data-a="go" data-v="${go}"><span class="dtl-l">${lab}</span><b class="dtl-v num">${val}</b>${meter!=null?`<span class="dtl-m"><i style="width:${clamp(meter,0,100)}%"></i></span>`:''}<span class="dtl-s">${sub}</span></button>`;
  { const {order,live}=standOrder(); const i=order.findIndex(o=>o.tid===G.user); const o=order[i];
    if(o&&(live||G.startY!==G.year||(G.history.length&&G.history[G.history.length-1].y>=G.year))){ const gb=i>0?gbOf(order[0],o):0, g5=order[4]?gbOf(order[4],o):0; T.push(tile(live?'순위':'지난 시즌',`${i+1}위`,`${o.w}승 ${o.l}패${o.t?` ${o.t}무`:''}${live?(i===0?' · 선두':` · 1위와 ${gb.toFixed(1)}`)+(i>=5?` · 5위와 ${g5.toFixed(1)}`:''):''}`,'league:stand',i<5?'good':i>=8?'bad':'')); }
    else T.push(tile('전력 평가','-','개막 전','league:stand')); }
  { let nx=null; try{ const L=nextGames(1); if(L&&L[0])nx=L[0]; }catch(e){}
    if(nx&&(per==='season'||per==='post'||per==='pre')){ const op=nx.op, home=nx.home; T.push(tile("다음 경기",`${home?"vs":"@"} ${esc(team(op).nick)}`,`${dsh(nx.d)} ${WD[dobj(nx.d).w]} · ${home?'홈':'원정'}`,'cal')); }
    else { let ev=null; try{ ev=calUpcomingList(1)[0]||null; }catch(e){} T.push(tile('다음 일정',ev?dsh(ev.d):'-',ev?esc(ev.t):'예정된 일정 없음','cal')); } }
  { const ps=playersOf(G.user).filter(p=>p.e1||!entryOn()); const mor=ps.length?sum(ps.map(p=>p.mor??60))/ps.length:60; const fat=ps.length?sum(ps.map(p=>p.fat||0))/ps.length:0;
    T.push(tile('팀 분위기',Math.round(mor),`${mor>=65?'좋음':mor>=50?'보통':mor>=38?'가라앉음':'나쁨'} · 평균 피로 ${Math.round(fat)}`,'roster',mor>=65?'good':mor<45?'bad':'',mor)); }
  { const inj=playersOf(G.user).filter(p=>p.injOut>0).sort((a,b)=>ovr(b)-ovr(a)); T.push(tile('부상자',`${inj.length}명`,inj.length?`${esc(inj[0].name)}${inj[0].injK?` · ${esc(INJ[inj[0].injK].part)}`:''} ${inj[0].injOut}일${inj.length>1?` 외 ${inj.length-1}명`:''}`:'전원 정상','staff:med',inj.length>=4?'bad':inj.length?'warn':'good')); }
  T.push(tile('구단주 신뢰',Math.round(t.trust),t.trust>=60?'안정':t.trust>=35?'보통':t.trust>=20?'불안':'위험','club:owner',t.trust>=60?'good':t.trust<30?'bad':'',t.trust));
  { let b=null; try{ b=budget(); }catch(e){} if(b)T.push(tile('예산 여유',money(Math.round(b.roomGoal)),b.roomGoal>=0?'지원 목표 안':'목표 초과','club:fin',b.roomGoal<0?'bad':'')); }
  if(G.pr)T.push(tile('팬 여론',Math.round(G.pr.fan),`언론 논조 ${Math.round(G.pr.press)}`,'club:owner',G.pr.fan>=60?'good':G.pr.fan<40?'bad':'',G.pr.fan));
  { const v=clubPrestige(G.user); const L=G.teams.map(x=>clubPrestige(x.id)).sort((a,b)=>b-a); T.push(tile('구단 명성',`<span class="stars-t">${starTxt(prestigeStars(v))}</span>`,`${v}점 · 리그 ${L.indexOf(v)+1}위`,'club:owner','',v)); }
  return `<div class="dtiles">${T.join('')}</div>`; }
/* FM식 별점: 100점 척도 → 별 5개(반 개 단위) */
function starsH(v){ if(v==null||isNaN(v))return ''; const n=clamp(Math.round((v-30)/14*2)/2,.5,5); return `<span class="stars" title="별 ${n}개" aria-label="별 ${n}개"><span class="st-b">★★★★★</span><span class="st-f" style="width:${n/5*100}%">★★★★★</span></span>`; }
