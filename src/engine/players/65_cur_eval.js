/* ---------- 현재 평가의 근거: 툴별 수준, 종합이 어느 정도인지, 올해 KBO 예상 성적 범위 ----------
   예상 성적은 지어낸 숫자가 아니라 이 리그의 실제 1군 기록에서 '능력 → 성적' 관계를 다시 계산해 쓴다(올해 표본이 적으면 지난해).
   범위 = 같은 능력대 선수들의 실제 성적 흩어짐 + 평가 오차 */
const TOOL_LV=[[64,'최상급'],[58,'플러스'],[53,'평균 이상'],[47,'1군 평균'],[42,'평균 이하'],[0,'뚜렷한 약점']];
function toolLv(v){ return (TOOL_LV.find(t=>v>=t[0])||TOOL_LV[TOOL_LV.length-1])[1]; }
function curBand(c){ return c>=60?'리그 상위 5% 수준':c>=56?'확실한 주전급':c>=52?'1군 주전 평균 수준':c>=48?'1군 백업 수준':c>=44?'1군과 2군 경계':'2군 수준'; }
let _pjC={};
function projFit(isP){ const key=G.year+':'+Math.floor(G.day/14)+':'+(isP?1:0); if(_pjC.g===G&&_pjC[key]!==undefined)return _pjC[key]; /* 다른 세이브면 같은 날짜라도 다시 계산(검수 11-06) */
  const fit=y=>{ const X=[],Y=[]; for(const p of Object.values(G.players)){ if(p.team==null||!!p.isP!==!!isP)continue; const h=seasonTotal(p,y,'1군'); if(!h)continue;
      if(isP){ if(h.outs<150)continue; X.push(ovr(p)); Y.push(pRate(h).era); } else { if(h.pa<200)continue; X.push(ovr(p)); Y.push(bRate(h).ops); } }
    if(X.length<25)return null; const n=X.length, mx=sum(X)/n, my=sum(Y)/n; let sxy=0,sxx=0; for(let i=0;i<n;i++){ sxy+=(X[i]-mx)*(Y[i]-my); sxx+=(X[i]-mx)**2; }
    const b=sxx?sxy/sxx:0, a=my-b*mx; let ss=0; for(let i=0;i<n;i++)ss+=(Y[i]-(a+b*X[i]))**2; return {a,b,r:Math.sqrt(ss/Math.max(1,n-2)),n,y}; };
  const F=G.pjFit=G.pjFit||{}, kk=isP?'p':'b'; let v=fit(G.year); if(v)F[kk]=v; else v=F[kk]&&F[kk].y===G.year-1?F[kk]:null; /* 지난해 표본은 지난해에 그 능력으로 낸 성적으로 맞춘 식을 쓴다(작년 기록을 올해 능력과 짝짓지 않는다, 검수 11-06) */ _pjC={g:G,[key]:v}; return v; }
/* ===== 성적으로 오르는 실제 잠재력(구단주 결정 11-19, 시즌 기준 잠재력 구간 방식) =====
   화면의 잠재력은 지금처럼 스카우트 추정치이고, 이 장치는 실제 잠재력(p.pot)을 올린다. 내부 20~80 척도. 난수를 쓰지 않는다(결정적). 모든 구단 같은 식. 능력의 한 해 +5 상한과는 별개다.
   1) 시즌 기준 잠재력 p.potBase={y,v}: 정규시즌 개막일(겨울 성장 뒤)의 p.pot. 시즌 중 잠재력이 올라도 그 시즌 구간은 이 값으로 정한다.
      예전 저장·시즌 중 불러온 저장은 처음 불러온 날의 p.pot을 한 번만 적는다(다시 불러와도 그대로). 지난 시즌 소급은 없다.
   2) 시즌 결산(해 넘김 첫머리, 시상 확정 뒤·겨울 성장 전) 상승량 = 구간 상한 × 성적 보상 비율.
      구간 상한(POT_UP.bands): 기준 60 이하 +2.5(특별 조건 +3) / 60 초과~64 +1.5 / 64 초과~68 +1.2 / 68 초과~69.5 +0.8 / 69.5 초과는 대상 아님.
      특별 조건: 그해 MVP·신인왕·골든글러브·개인 타이틀 1위, 또는 기대 대비 성적 z가 POT_UP.spZ 이상. 60 이하 구간에서만 상한이 3이 된다(다른 구간은 그대로).
   3) 성적 보상 비율: 운에 덜 흔들리는 지표로 잰 '기대 대비 초과' 표준점수 z와 표본으로 정한다.
      타자 = 삼진율(낮을수록)·볼넷율·순장타율(ISO), 투수 = FIP(삼진·볼넷·피홈런)와 9이닝당 삼진-볼넷. 지표마다 그해 리그 선수들의 '종합 능력 → 지표' 직선 맞춤(projFit과 같은 방식)이 기대값이고,
      초과분을 그 맞춤의 흩어짐으로 나눈 값을 합친다(타자 셋은 ÷√3, 투수 둘은 평균). 2군 성적은 2군 선수끼리 맞춘 식으로 재고 표본을 절반으로 친다(1군·2군을 표본 가중 평균).
      비율 = (z - z0) ÷ (z1 - z0)을 0~1로 자른 값 × (표본 ÷ 온전한 표본, 최대 1). z가 z0 미만(기대 이하·비슷)이거나 표본이 최소 미만이면 0. 성적이 나쁘다고 깎지 않는다. 나이 제한 없음(구간이 제한).
   4) 국제대회(WBC·올림픽·프리미어12·아시안게임) 출전 성적은 따로 최대 +1.2(한 해 한 번, 자격은 그해 기준 잠재력 69.5 이하). 이 장치로 오르는 잠재력은 72를 넘지 않는다.
   5) 잠재력은 80을 넘지 않고 현재 능력보다 낮아지지 않는다. 그해 오른 몫(p.potUp)은 겨울 성장의 잠재력 정리에서 한 해 지켜 준다(04_growth) */
const POT_UP={bands:[[60,2.5],[64,1.5],[68,1.2],[69.5,.8]],sp:3,spZ:2.6,z0:.8,z1:2,min:{b:120,p:120},full:{b:350,p:300},fut:.5,intl:1.2,top:72,minUp:.3};
function potBaseSet(p,force){ if(force||!p.potBase||p.potBase.y!==G.year)p.potBase={y:G.year,v:Math.round(p.pot*10)/10}; return p.potBase.v; }
function potBaseAll(force){ if(!G||!G.players)return; for(const p of Object.values(G.players))if(p&&p.team!=null&&!p.prospect&&p.pot!=null)potBaseSet(p,force); }
function potBandCap(v,special){ if(v<=POT_UP.bands[0][0])return special?POT_UP.sp:POT_UP.bands[0][1]; for(const [hi,c] of POT_UP.bands)if(v<=hi)return c; return 0; }
/* 지표: kind 'per'(운에 덜 흔들리는 지표, 실제 계산에 씀) | 'res'(결과 지표 OPS·평균자책점, 비교 측정용). [값, 방향] */
function potVals(h,isP,kind){ if(isP){ const o=h.outs||0; if(!o)return null; if(kind==='res')return [[h.er*27/o,-1]]; return [[(13*(h.hr||0)+3*((h.bb||0)+(h.hbp||0))-2*(h.so||0))*3/o+3.2,-1],[((h.so||0)-(h.bb||0))*27/o,1]]; }
  const pa=h.pa||0, ab=h.ab||0; if(!pa||!ab)return null; if(kind==='res')return [[bRate(h).ops,1]]; return [[(h.so||0)/pa,-1],[(h.bb||0)/pa,1],[((h.d||0)+2*(h.tr||0)+3*(h.hr||0))/ab,1]]; }
function potFitLv(isP,lvl,kind){ const X=[],Y=[]; const need=isP?(lvl==='1군'?150:90):(lvl==='1군'?200:120); for(const p of Object.values(G.players)){ if(p.team==null||!!p.isP!==!!isP||!p.hist)continue; const h=seasonTotal(p,G.year,lvl); if(!h||!(((isP?h.outs:h.pa)||0)>=need))continue; const v=potVals(h,isP,kind); if(!v)continue; X.push(ovr(p)); Y.push(v.map(x=>x[0])); }
  const n=X.length; if(n<25)return null; const mx=sum(X)/n; let sxx=0; for(let i=0;i<n;i++)sxx+=(X[i]-mx)**2; const c=[];
  for(let k=0;k<Y[0].length;k++){ const my=sum(Y.map(y=>y[k]))/n; let sxy=0; for(let i=0;i<n;i++)sxy+=(X[i]-mx)*(Y[i][k]-my); const b=sxx?sxy/sxx:0, a=my-b*mx; let ss=0; for(let i=0;i<n;i++)ss+=(Y[i][k]-(a+b*X[i]))**2; c.push({a,b,r:Math.sqrt(ss/Math.max(1,n-2))}); }
  return {c,n,y:G.year}; }
function potFits(kind){ kind=kind||'per'; const F={}; for(const k of ['b','p']){ F[k]={}; for(const lvl of ['1군','퓨처스'])F[k][lvl]=potFitLv(k==='p',lvl,kind); } F.kind=kind; return F; }
/* 한 선수의 올해 기대 대비 초과 {z, n}: 1군·2군을 표본(2군 절반)으로 가중 평균 */
function potPerfZ(p,F){ const fits=F[p.isP?'p':'b'], kind=F.kind||'per'; let zs=0,w=0; const cur=ovr(p); for(const lvl of ['1군','퓨처스']){ const f=fits[lvl]; if(!f)continue; const h=seasonTotal(p,G.year,lvl); if(!h)continue; const n=(p.isP?h.outs:h.pa)||0; if(!(n>0))continue; const v=potVals(h,!!p.isP,kind); if(!v)continue;
    let z=0,ok=true; v.forEach(([x,s],i)=>{ const c=f.c[i]; if(!c||!(c.r>0)){ ok=false; return; } z+=s*(x-(c.a+c.b*cur))/c.r; }); if(!ok)continue; z=p.isP?z/v.length:z/Math.sqrt(v.length); const ww=n*(lvl==='1군'?1:POT_UP.fut); zs+=clamp(z,-4,4)*ww; w+=ww; }
  return w>0?{z:zs/w,n:w}:{z:0,n:0}; }
function potUpRatio(isP,z,n){ const kk=isP?'p':'b'; if(!(n>=POT_UP.min[kk])||!(z>=POT_UP.z0))return 0; return clamp((z-POT_UP.z0)/(POT_UP.z1-POT_UP.z0),0,1)*Math.min(1,n/POT_UP.full[kk]); }
function potUpAdd(p,amt,o){ const b=p.pot; const np=Math.round(clamp(Math.max(Math.min(p.pot+amt,Math.max(p.pot,POT_UP.top)),ovr(p)),20,80)*10)/10; if(!(np>b))return 0; p.pot=np; const up=Math.round((np-b)*10)/10; const U=p.potUp&&p.potUp.y===G.year?p.potUp:{y:G.year,v:0,b:o.b}; U.v=Math.round((U.v+up)*10)/10; if(o.iv)U.iv=up; if(o.s)U.s=1; if(o.sp)U.sp=1; p.potUp=U; return up; }
function potAwardIds(y){ const S=new Set(); try{ const A=G.awards&&G.awards[y]; if(A){ if(A.mvp&&A.mvp.id!=null)S.add(String(A.mvp.id)); if(A.roy&&A.roy.id!=null)S.add(String(A.roy.id)); for(const k in (A.gg||{}))if(A.gg[k]&&A.gg[k].id!=null)S.add(String(A.gg[k].id)); } for(const id of awTitleHolders(y))S.add(String(id)); }catch(e){} return S; }
function potPerfSeason(){ const out=[]; const F=potFits('per'), AW=potAwardIds(G.year);
  for(const p of Object.values(G.players)){ if(p.team==null||p.prospect||p.joinY>G.year||!p.hist||p.pot==null)continue; if(p.potUp&&p.potUp.y===G.year&&p.potUp.s)continue; const base=potBaseSet(p); if(!potBandCap(base,false))continue;
    const {z,n}=potPerfZ(p,F); const q=potUpRatio(!!p.isP,z,n); if(!q)continue; const sp=AW.has(String(p.id))||z>=POT_UP.spZ; const amt=Math.round(potBandCap(base,sp)*q*10)/10; if(!(amt>=POT_UP.minUp))continue;
    const up=potUpAdd(p,amt,{b:base,s:1,sp:sp&&base<=POT_UP.bands[0][0]}); if(!up)continue; out.push({id:p.id,tid:p.team,age:p.age,b:base,v:up,z:+z.toFixed(2),n:Math.round(n),sp:sp?1:0,pot:p.pot}); try{ story(p,G.year+' 성적 보상으로 잠재력 재평가'); }catch(e){}
    if(p.team===G.user&&!G.unemp)try{ note('육성',p.name+' 잠재력 상승(올 시즌 성적 보상)',p.id); }catch(e){} }
  return out; }
/* 국제대회 성적 보상: 대회가 끝날 때(84b ntTourFinish). 타자 8타석 이상 OPS .750→1.000, 투수 3이닝 이상 평균자책점 4.00→1.50 사이를 0~1로 보고 최대 +1.2 */
function potIntlUp(T){ const out=[]; if(!T||!T.st)return out; for(const key in T.st){ const p=G.players[key]; if(!p||p.team==null||p.pot==null||(p.ntKey&&p.ntKey!==p.id))continue; if(p.potUp&&p.potUp.y===G.year&&p.potUp.iv)continue; const base=potBaseSet(p); if(!potBandCap(base,false))continue;
    const S=T.st[key]; let q=0; if(S.P){ const o=S.outs||0; if(o>=9)q=clamp((4-(S.er||0)*27/o)/2.5,0,1); } else if((S.pa||0)>=8&&S.ab){ const obp=((S.h||0)+(S.bb||0))/S.pa, slg=((S.h||0)+(S.d||0)+2*(S.tr||0)+3*(S.hr||0))/S.ab; q=clamp((obp+slg-.75)/.25,0,1); }
    const amt=Math.round(POT_UP.intl*q*10)/10; if(!(amt>=POT_UP.minUp))continue; const up=potUpAdd(p,amt,{b:base,iv:1}); if(!up)continue; out.push({id:p.id,tid:p.team,v:up,b:base}); try{ story(p,G.year+' 국제대회 활약으로 잠재력 재평가'); }catch(e){}
    if(p.team===G.user&&!G.unemp)try{ note('육성',p.name+' 잠재력 상승(국제대회 성적 보상)',p.id); }catch(e){} }
  return out; }
/* 올해 KBO 예상: 가운데 값과 범위(대략 3명 중 2명이 들어오는 폭) */
function projKBO(p,cur,sd){ if(cur==null)return null; const f=projFit(p.isP); if(!f)return null; const m=f.a+f.b*cur; const s=Math.sqrt(f.r*f.r+(f.b*(sd||0))**2);
  const lo=Math.min(m-s,m+s), hi=Math.max(m-s,m+s); if(p.isP){ const L=Math.max(1,lo), M=Math.max(L,m), H=Math.max(M+.3,hi); /* 하한을 1.00으로 막으면 가운데·상한도 그 위로(범위가 뒤집히지 않게) */ return {k:'era',m:M,lo:L,hi:H,txt:`평균자책점 ${L.toFixed(2)}~${H.toFixed(2)}`,mid:M.toFixed(2),n:f.n,y:f.y}; } const oL=Math.max(0,lo), oM=Math.max(oL,m), oH=Math.max(oM,hi); return {k:'ops',m:oM,lo:oL,hi:oH,txt:`OPS ${fmt3(oL)}~${fmt3(oH)}`, /* OPS는 0 아래로 내려가지 않는다 */mid:fmt3(oM),n:f.n,y:f.y}; }
/* 설명 줄 */
function curExplain(p,rp){ rp=rp||scoutReport(p); const fsx=p.foreign&&p.team==null?fScout(p,rp):null; /* 외국인 후보는 스카우트 평가와 기록을 합친 종합 추정으로 설명한다 */ const c=fsx&&fsx.raw!=null?fsx.raw:rp.cur; if(c==null)return null; const L=[];
  const sd=rp.exact?0:fsx&&fsx.ms!=null?fsx.ms:(rp.sd||0); /* KBO 소속 선수의 현재 능력은 정확히 보인다(오차 없음). 추정인 것은 잠재력뿐 */
  /* 계약 전 외국인 후보: 문장도 조사 단계만큼만 말한다. 기초 조사에서는 방향만, 조사가 쌓이면 수준(플러스·평균 이하)까지. 숫자는 범위로만(사용자 11-13) */
  const fn=fsx?fsx.n:3, soft=!!fsx&&fsx.raw!=null;
  L.push(soft?`종합 추정 ${fsx.lo}~${fsx.hi}, ${curBand(c)}${p.isP?(isSPr(p)?' 선발':' 불펜'):''}${fn<=1?'(으)로 보입니다':'입니다'}. 1군 주전 평균이 ${dv(53)}, 리그 상위 5%가 ${dv(60)}쯤입니다.`:`종합 ${dvG(c,rp.exact)}: ${curBand(c)}${p.isP?(isSPr(p)?' 선발':' 불펜'):''}입니다. 1군 주전 평균이 ${dv(53)}, 리그 상위 5%가 ${dv(60)}쯤입니다.`);
  const ts=[...(rp.tools||[])].sort((a,b)=>b.cur-a.cur);
  const top=ts.filter(t=>t.cur>=53).slice(0,2), low=ts.filter(t=>t.cur<47).slice(-2).reverse();
  if(soft){ const nm=t=>TOOLK[t.k], lv=t=>`${TOOLK[t.k]} ${toolLv(t.cur)}`;
    if(fn<=1){ if(top.length)L.push(`${nm(top[0])} 쪽이 강점으로 보입니다.`); else if(ts.length)L.push('아직 뚜렷한 강점을 찾지 못했습니다.'); if(low.length)L.push(`${nm(low[0])}은(는) 약점일 수 있습니다.`); }
    else { if(top.length)L.push(`강점: ${top.map(lv).join(', ')}. ${fn>=3?GOOD[top[0].k]||'':''}`.trim()); else if(ts.length)L.push(`뚜렷한 강점은 없습니다. 가장 나은 툴은 ${lv(ts[0])}입니다.`); if(low.length)L.push(`약점: ${low.map(lv).join(', ')}. ${fn>=3?BAD[low[0].k]||'':''}`.trim()); } }
  else {
  if(top.length)L.push(`강점: ${top.map(t=>`${TOOLK[t.k]} ${dvG(t.cur,rp.exact)}(${toolLv(t.cur)})`).join(', ')}. ${GOOD[top[0].k]||''}`);
  else if(ts.length)L.push(`뚜렷한 강점은 없습니다. 가장 나은 툴은 ${TOOLK[ts[0].k]} ${dvG(ts[0].cur,rp.exact)}(${toolLv(ts[0].cur)})입니다.`);
  if(low.length)L.push(`약점: ${low.map(t=>`${TOOLK[t.k]} ${dvG(t.cur,rp.exact)}(${toolLv(t.cur)})`).join(', ')}. ${BAD[low[0].k]||''}`); }
  const pj=projKBO(p,c,sd); if(pj)L.push(`올해 리그 예상: ${pj.txt}${soft?'':`, 가운데 ${pj.mid}`}. ${pj.y}시즌 1군 ${pj.n}명의 실제 기록에서 같은 능력대 선수들이 낸 범위${sd?'에 평가 오차를 더한 폭':''}입니다.`);
  if(p.team!==G.user){ try{ const k=p.isP?(isSPr(p)?'SP':'RP'):pSlot(p); const d=depth(G.user); const mine=k==='SP'?d.sp:k==='RP'?d.pen.slice(0,4):[d.ln[k]].filter(Boolean); const w=mine.filter(Boolean).sort((a,b)=>ovr(a)-ovr(b))[0];
      if(w){ const df=dvG(c,rp.exact)-dvo(w); /* 화면에 보이는 점수(100점 척도)끼리 뺀다 */ const who=`우리 ${SLOTK[k]||posLabel(p)} ${k==='SP'||k==='RP'?'가장 약한 투수':'주전'} ${w.name}`;
        if(soft){ const b=fsx.band||0; L.push(df-b>=2?`${who}보다 낫습니다.`:df+b<=-2?`${who}에 못 미칩니다.`:df>=2?`${who}보다 나아 보입니다.`:df<=-2?`${who}보다 처져 보입니다.`:`${who}와 비슷해 보입니다.`); }
        else L.push(`${who}(${dvo(w)})보다 ${df>0?'+':''}${df}. ${df>=2?'바로 전력이 오릅니다':df<=-2?'주전보다 못합니다':'비슷한 수준입니다'}.`); } }catch(e){} }
  /* 외국인 후보의 조사 단계·추정 범위는 선수 화면 위쪽 상자(fsBox)에 따로 보인다 */ if(!(p.foreign&&p.team==null))L.push(sd?`평가 오차 약 ±${dvSd(c,sd)}(정확도 ${rp.conf}). 담당 스카우트 능력과 트래킹 분석원이 좋을수록 줄어듭니다.`:'');
  if(p.foreign){ if(p.adapt!=null&&rp.sd!=null&&rp.sd<=7.5)L.push(p.adapt>=62?'적응: 생활 적응력이 좋아 첫해부터 제 실력을 낼 것으로 봅니다.':p.adapt<45?'적응: 한국 생활 적응이 변수입니다. 첫 두 달 성적이 기대보다 낮을 수 있습니다.':'적응: 보통입니다.'); if(p.team==null&&rp.sd!=null&&rp.sd<=8)L.push(fFitHint(p,rp.sd)); L.push('외국인 선수는 올해 성적을 보고 뽑습니다. 장래 성장은 평가에 넣지 않았습니다.'); }
  return L.filter(Boolean); }
