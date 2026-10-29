/* ---------- 현재 평가의 근거: 툴별 수준, 종합이 어느 정도인지, 올해 KBO 예상 성적 범위 ----------
   예상 성적은 지어낸 숫자가 아니라 이 리그의 실제 1군 기록에서 '능력 → 성적' 관계를 다시 계산해 쓴다(올해 표본이 적으면 지난해).
   범위 = 같은 능력대 선수들의 실제 성적 흩어짐 + 평가 오차 */
const TOOL_LV=[[64,'최상급'],[58,'플러스'],[53,'평균 이상'],[47,'1군 평균'],[42,'평균 이하'],[0,'뚜렷한 약점']];
function toolLv(v){ return (TOOL_LV.find(t=>v>=t[0])||TOOL_LV[TOOL_LV.length-1])[1]; }
function curBand(c){ return c>=60?'리그 상위 5% 수준':c>=56?'확실한 주전급':c>=52?'1군 주전 평균 수준':c>=48?'1군 백업 수준':c>=44?'1군과 2군 경계':'2군 수준'; }
let _pjC={};
function projFit(isP){ const key=G.year+':'+Math.floor(G.day/14)+':'+(isP?1:0); if(_pjC[key]!==undefined)return _pjC[key];
  const fit=y=>{ const X=[],Y=[]; for(const p of Object.values(G.players)){ if(p.team==null||!!p.isP!==!!isP)continue; const h=seasonTotal(p,y,'1군'); if(!h)continue;
      if(isP){ if(h.outs<150)continue; X.push(ovr(p)); Y.push(pRate(h).era); } else { if(h.pa<200)continue; X.push(ovr(p)); Y.push(bRate(h).ops); } }
    if(X.length<25)return null; const n=X.length, mx=sum(X)/n, my=sum(Y)/n; let sxy=0,sxx=0; for(let i=0;i<n;i++){ sxy+=(X[i]-mx)*(Y[i]-my); sxx+=(X[i]-mx)**2; }
    const b=sxx?sxy/sxx:0, a=my-b*mx; let ss=0; for(let i=0;i<n;i++)ss+=(Y[i]-(a+b*X[i]))**2; return {a,b,r:Math.sqrt(ss/Math.max(1,n-2)),n,y}; };
  const v=fit(G.year)||fit(G.year-1)||null; _pjC={[key]:v}; return v; }
/* 올해 KBO 예상: 가운데 값과 범위(대략 3명 중 2명이 들어오는 폭) */
function projKBO(p,cur,sd){ if(cur==null)return null; const f=projFit(p.isP); if(!f)return null; const m=f.a+f.b*cur; const s=Math.sqrt(f.r*f.r+(f.b*(sd||0))**2);
  const lo=Math.min(m-s,m+s), hi=Math.max(m-s,m+s); return p.isP?{k:'era',m:Math.max(1,m),lo:Math.max(1,lo),hi,txt:`평균자책점 ${Math.max(1,lo).toFixed(2)}~${hi.toFixed(2)}`,mid:Math.max(1,m).toFixed(2),n:f.n,y:f.y}:{k:'ops',m,lo,hi,txt:`OPS ${fmt3(lo)}~${fmt3(hi)}`,mid:fmt3(m),n:f.n,y:f.y}; }
/* 설명 줄 */
function curExplain(p,rp){ rp=rp||scoutReport(p); const c=rp.cur; if(c==null)return null; const L=[];
  const sd=rp.exact?0:(rp.sd||0); /* KBO 소속 선수의 현재 능력은 정확히 보인다(오차 없음). 추정인 것은 잠재력뿐 */
  L.push(`종합 ${dv(c)}: ${curBand(c)}${p.isP?(isSPr(p)?' 선발':' 불펜'):''}입니다. 1군 주전 평균이 ${dv(53)}, 리그 상위 5%가 ${dv(60)}쯤입니다.`);
  const ts=[...(rp.tools||[])].sort((a,b)=>b.cur-a.cur);
  const top=ts.filter(t=>t.cur>=53).slice(0,2), low=ts.filter(t=>t.cur<47).slice(-2).reverse();
  if(top.length)L.push(`강점: ${top.map(t=>`${TOOLK[t.k]} ${dv(t.cur)}(${toolLv(t.cur)})`).join(', ')}. ${GOOD[top[0].k]||''}`);
  else if(ts.length)L.push(`뚜렷한 강점은 없습니다. 가장 나은 툴은 ${TOOLK[ts[0].k]} ${dv(ts[0].cur)}(${toolLv(ts[0].cur)})입니다.`);
  if(low.length)L.push(`약점: ${low.map(t=>`${TOOLK[t.k]} ${dv(t.cur)}(${toolLv(t.cur)})`).join(', ')}. ${BAD[low[0].k]||''}`);
  const pj=projKBO(p,c,sd); if(pj)L.push(`올해 리그 예상: ${pj.txt} (가운데 ${pj.mid}). ${pj.y}시즌 1군 ${pj.n}명의 실제 기록에서 같은 능력대 선수들이 낸 범위${sd?'에 평가 오차를 더한 폭':''}입니다.`);
  if(p.team!==G.user){ try{ const k=p.isP?(isSPr(p)?'SP':'RP'):pSlot(p); const d=depth(G.user); const mine=k==='SP'?d.sp:k==='RP'?d.pen.slice(0,4):[d.ln[k]].filter(Boolean); const w=mine.filter(Boolean).sort((a,b)=>ovr(a)-ovr(b))[0];
      if(w){ const df=c-Math.round(ovr(w)); L.push(`우리 ${SLOTK[k]||posLabel(p)} ${k==='SP'||k==='RP'?'가장 약한 투수':'주전'} ${w.name}(${dvo(w)})보다 ${df>0?'+':''}${df}${df>=2?' — 바로 전력이 오릅니다':df<=-2?' — 주전보다 못합니다':' — 비슷한 수준입니다'}.`); } }catch(e){} }
  L.push(sd?`평가 오차 약 ±${Math.max(1,Math.round(sd))}(정확도 ${rp.conf}). ${p.foreign&&p.team==null?'관찰 명단에 올리고 해외 스카우트망을 넓히면 줄어듭니다.':'담당 스카우트 능력과 트래킹 분석원이 좋을수록 줄어듭니다.'}`:'');
  if(p.foreign){ if(p.adapt!=null&&rp.sd!=null&&rp.sd<=7.5)L.push(p.adapt>=62?'적응: 생활 적응력이 좋아 첫해부터 제 실력을 낼 것으로 봅니다.':p.adapt<45?'적응: 한국 생활 적응이 변수입니다. 첫 두 달 성적이 기대보다 낮을 수 있습니다.':'적응: 보통입니다.'); L.push('외국인 선수는 올해 성적을 보고 뽑습니다. 장래 성장은 평가에 넣지 않았습니다.'); }
  return L.filter(Boolean); }
