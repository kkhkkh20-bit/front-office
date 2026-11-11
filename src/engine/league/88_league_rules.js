/* ===== 협회 규정 변화·시대 변화 (장기 기획 11-11) =====
   해마다 12월 18일 협회 규칙위원회가 다음 시즌 규정을 정한다. 경기와 계약에 실제로 반영된다.
   - 공인구 반발계수(ball): 홈런 확률 배수. 지난 시즌 홈런이 기준(첫 시즌)보다 12% 넘게 많으면 낮추고 적으면 높인다. 검사 편차로 조금씩 흔들리고, 드물게 새 공인구 도입으로 크게 바뀐다(타고투저·투고타저 시대).
   - ABS 존(zone, -1~+1): 넓히면 삼진이 늘고 볼넷이 준다(1단계당 삼진 ×1.04, 볼넷 ×0.94).
   - 외국인 선수 연봉 총액 상한(fcap): 기본 400만 달러의 80~130%.
   첫 해는 모두 기본값(1·0·1). 옛 저장도 기본값으로 시작한다 */
function lgrInit(){ return G.lgr=G.lgr||{y:{},hist:[],hr0:null}; }
function lgRuleOf(y){ const L=lgrInit(); let r=null; for(const k in L.y)if(+k<=y&&(r==null||+k>r))r=+k; return r==null?{ball:1,zone:0,fcap:1}:L.y[r]; }
function lgRuleNow(){ return lgRuleOf(G.year); }
function fTotCap(){ return Math.round(F_TOTAL_CAP*(lgRuleNow().fcap||1)); }
function lgHrRate(y){ let hr=0,pa=0; for(const p of Object.values(G.players)){ if(p.isP)continue; const h=seasonTotal(p,y,'1군'); if(h){ hr+=h.hr||0; pa+=h.pa||0; } } return pa>2000?hr/pa:null; }
function lgrDecide(){ const L=lgrInit(), y=G.year+1; if(L.y[y])return; const cur=lgRuleOf(G.year), hr=lgHrRate(G.year); if(L.hr0==null&&hr!=null)L.hr0=hr;
  const nx={...cur}, why=[];
  { let b=cur.ball; const r=hr!=null&&L.hr0?hr/L.hr0:1; if(R()<.1){ const d=R()<.5?-.08:.08; b+=d; why.push(`새 공인구 도입: 반발계수 ${d>0?'상향':'하향'}`); } else if(r>1.12){ b-=.05; why.push(`지난 시즌 홈런 증가(기준 대비 ${Math.round((r-1)*100)}%)로 공인구 반발계수 하향`); } else if(r<.88){ b+=.05; why.push(`지난 시즌 홈런 감소(기준 대비 ${Math.round((1-r)*100)}%)로 공인구 반발계수 상향`); } else if(R()<.35){ const d=(R()<.5?-1:1)*.02; b+=d; why.push(`공인구 반발계수 검사 결과 ${d>0?'소폭 상승':'소폭 하락'}`); }
    nx.ball=Math.round(clamp(b,.82,1.18)*100)/100; }
  if(R()<.2){ const d=(R()<.5?-.5:.5); const z=clamp(cur.zone+d,-1,1); if(z!==cur.zone){ nx.zone=z; why.push(`ABS 존 ${d>0?'확대(상·하단 0.5%p 넓힘)':'축소(상·하단 0.5%p 좁힘)'}`); } }
  if(R()<.15){ const d=R()<.6?.1:-.1; const f=Math.round(clamp(cur.fcap+d,.8,1.3)*100)/100; if(f!==cur.fcap){ nx.fcap=f; why.push(`외국인 선수 연봉 총액 상한 ${money(Math.round(F_TOTAL_CAP*cur.fcap))} → ${money(Math.round(F_TOTAL_CAP*f))}`); } }
  L.y[y]=nx; if(!why.length)return; L.hist.push({y,why,r:nx});
  const era=nx.ball>=1.08?'타고투저 우려':nx.ball<=.92?'투고타저 우려':'';
  news('리그',`${ASSOC.s} 규칙위원회, ${y}시즌 규정 확정${era?' · '+era:''}`,why.join('\n')+'\n\n다음 시즌 개막부터 적용됩니다.',1,{});
  if(!G.unemp)mail(ASSOC.s,`${y}시즌 규정 변경 안내`,why.map(w=>'· '+w).join('\n')+`\n\n공인구 홈런 지수 ${Math.round(nx.ball*100)} · ABS 존 ${nx.zone>0?'넓음':nx.zone<0?'좁음':'기본'} · 외국인 연봉 총액 상한 ${money(Math.round(F_TOTAL_CAP*nx.fcap))}`,{kind:'리그'}); }
function lgrDaily(day){ if(day===KD(12,18))try{ lgrDecide(); }catch(e){} }
function lgrTxt(y){ const r=lgRuleOf(y); return `협회 규정: 공인구 홈런 지수 ${Math.round(r.ball*100)}(기준 100) · ABS 존 ${r.zone>0?'넓음(삼진↑)':r.zone<0?'좁음(볼넷↑)':'기본'} · 외국인 연봉 총액 상한 ${money(Math.round(F_TOTAL_CAP*r.fcap))}`; }
