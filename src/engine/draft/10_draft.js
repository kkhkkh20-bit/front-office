/* 예전 저장 정리: 기한 임박 알림이 따로 만들던 중복 소식을 지운다(지금은 원래 소식을 끌어올림) */
function mailMigrate(){ if(G.mailMig>=1)return; G.mailMig=1; G.mail=(G.mail||[]).filter(m=>!(m.kind==='결정'&&/^내일까지 정하지 않으면/.test(m.subj||''))); }
/* ===== 드래프트 ===== */
const SCH_CITY={수도권:['서울','인천','수원','성남','부천','안산','의정부'],영남:['부산','대구','울산','창원','포항','김해','경주'],'호남·충청':['광주','대전','전주','청주','목포','천안','순천']};
const SCH_HS=['새빛고','한결고','솔뫼고','누리고','다솜고','미르고','해담고','가온고','라온고','늘품고','한울공고','푸름고'];
const SCH_UN=['한결대','누리대','새빛대','가온대','미르대','해담대'];
const AM_INJ_P=['팔꿈치 인대 접합 수술(토미 존) 이력','어깨 염증으로 3개월 공백','팔꿈치 뼛조각 제거 수술 이력','고3 시즌 혹사 논란(투구 수 과다)'];
/* 아마추어 기록(카페 11-15: 1라운드 1순위 고졸 투수의 아마 기록이 ERA 6.18·WHIP 1.87).
   예전에는 프로 확률식(batProbs/pitProbs)에 상대 수준 보정(+14.5~19.5)만 더하고 1군 폭(shrinkQ)으로 줄여 돌렸다. 유망주(능력 25~50)가 KBO 평균 안팎 선수처럼 나와
   기록이 ERA 3~6·타율 .250~.300에 몰렸고, 지명 순위(잠재력)와 기록이 거의 따로 놀았다.
   이제는 그해 후보 안에서(고교·대학, 투수·타자 따로) 능력이 몇 표준편차 위인지로 아마 리그 확률을 만든다.
   상위 지명감은 아마 무대를 압도하고(고교 타율 .400~.500, ERA 0~2점대·높은 탈삼진), 평균 지명자는 준수, 미지명은 평범하다.
   해마다 컨디션·상대 일정·부상 시즌(amInj가 있으면 한 해 결장·부진) 변동이 있어 상위 지명도 가끔 나쁜 해가 있다 */
const AM_LV={hs:{bk:0,bbb:0,bab:0,pk:0,pbb:0,pab:0},col:{bk:.006,bbb:-.003,bab:-.004,pk:-.01,pbb:.003,pab:.005},ovs:{bk:.04,bbb:-.015,bab:-.04,pk:-.045,pbb:.012,pab:.025}};
const AM_KB=['con','pow','eye','spd'], AM_KP=['stf','ctl','sta'];
/* 기준 분포: 해외 복귀자(나이·경력이 달라 기준을 흔든다)를 뺀 그해 후보. 같은 학력 집단이 너무 적으면 투수·타자 전체 */
function amRef(L){ L=L.filter(p=>p&&p.r&&!p.ovsRet); const st=v=>{ const m=v.length?avg(v):40; const sd=v.length?Math.sqrt(avg(v.map(x=>(x-m)**2))):5; return {m,sd:Math.max(sd,2.5)}; }; const ref={};
  for(const isP of [true,false])for(const col of [false,true]){ let A=L.filter(p=>!!p.isP===isP&&!!p.college===col); if(A.length<8)A=L.filter(p=>!!p.isP===isP); const o={ovr:st(A.map(ovr)),pot:st(A.map(p=>p.pot))}; for(const k of (isP?AM_KP:AM_KB))o[k]=st(A.map(p=>p.r[k])); ref[(isP?'P':'B')+(col?'c':'h')]=o; }
  return ref; }
function amZ0(b,ref){ const R0=ref[(b.isP?'P':'B')+(b.college?'c':'h')]; const z=k=>clamp(((k==='ovr'?ovr(b):k==='pot'?b.pot:b.r[k])-R0[k].m)/R0[k].sd,-3,3.5); const zo=.7*z('ovr')+.3*z('pot'); /* 잠재력이 큰 선수는 같은 나이 또래 중 몸·툴이 앞서 아마 무대에서 더 압도한다 */
  const o=b.isP?{o:zo,s:.6*z('stf')+.4*zo,c:.6*z('ctl')+.4*zo,t:z('sta')}:{o:zo,c:.6*z('con')+.4*zo,p:.6*z('pow')+.4*zo,e:.6*z('eye')+.4*zo,s:z('spd')};
  for(const k in o)if(o[k]<0)o[k]*=.7; /* 아래쪽은 덜 벌린다: 후보 명단 하위권도 아마에서는 주전급이라 기록이 바닥까지 떨어지지 않는다 */ return o; }
function amProbsB(z,L){ return {bb:clamp(.092+.028*z.e+.008*z.p+L.bbb,.03,.25),k:clamp(.165-.04*z.c-.012*z.e+L.bk,.03,.36),hr:clamp(.009+.011*z.p+.003*z.o,.0005,.075),
  babip:clamp(.375+.05*z.c+.018*z.s+.01*z.o+L.bab,.2,.54),d2:clamp(.17+.03*z.p,.1,.3),d3:clamp(.012+.008*z.s,.002,.04)}; }
function amProbsP(z,L){ return {k:clamp(.21+.058*z.s+.012*z.c+L.pk,.07,.46),bb:clamp(.085-.024*z.c-.005*z.s+L.pbb,.018,.2),hr:clamp(.009-.003*z.s-.002*z.c,.0015,.035),babip:clamp(.295-.021*z.s-.01*z.c+L.pab,.2,.4)}; }
function amHistory(b,lvl,ref,lv){ // 학년별 아마추어 기록. 어릴수록 조금 약하고, 선구안·제구 같은 기질은 학년이 바뀌어도 크게 변하지 않는다
  ref=ref||amRef((G.draftClass||[]).map(id=>G.players[id]).concat([b])); lv=lv||(b.ovsRet?'ovs':b.college?'col':'hs'); const L=AM_LV[lv]||AM_LV.hs;
  const n=b.college?4:3; const rows=[]; const tot=b.isP?{outs:0,h:0,hr:0,bb:0,so:0,er:0,g:0}:{pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,r:0,rbi:0,sb:0,cs:0,g:0};
  const z0=amZ0(b,ref); if(lv==='ovs')for(const k in z0)z0[k]=Math.min(z0[k],2.2); const sched=clamp(((lvl??17)-17)/2.5*.2,-.25,.25); /* 약팀 상대 비중이 크면 기록이 조금 좋다 */
  const injY=b.amInj&&R()<.6?(R()<.5?n-1:ri(1,n-1)):-1; /* 부상 이력: 그 학년은 덜 뛰고 기록도 처진다 */
  for(let i=0;i<n;i++){ const back=n-1-i, inj=i===injY; const d=-back*.3+sched+N(0,.3)-(inj?.75:0); const z={}; for(const k in z0)z[k]=z0[k]+(k==='t'?0:d);
    const fr=i===0&&!b.college; const vol=clamp(1+.08*z0.o+(b.isP?.14*z0.t:0),.6,1.45)*(inj?.42:1);
    const x=b.isP?Object.assign(simPit(b,Math.max(9,Math.round((fr?ri(30,90):ri(70,190))*vol)),0,amProbsP(z,L)),{g:Math.max(2,Math.round((i===0?ri(4,10):ri(9,18))*Math.min(1.2,vol)))})
      :Object.assign(simBat(b,Math.max(15,Math.round((fr?ri(40,80):ri(85,135))*vol)),0,null,amProbsB(z,L)),{g:Math.max(5,Math.round((i===0?ri(14,26):ri(25,38))*Math.min(1.1,vol)))});
    rows.push(Object.assign({gr:i+1},x,inj?{inj:1}:{})); for(const k in tot)tot[k]+=x[k]||0; }
  b.amY=rows; b.am=tot; b.amV=2; }
/* 아마 성적 표준점수(그해 후보 안, 투수·타자 따로): 언론·스카우트·AI 지명 평가가 같은 값을 쓴다(공개 기록이라 구단마다 다르지 않다) */
/* 지명 평가·언론이 보는 아마 기록 합계: 졸업 학년을 두 배로 친다(마지막 해 기록을 더 무겁게 보는 것은 모든 구단·언론이 같다). 학년별 기록이 없으면 통산 */
const AM_SR_W=2;
function amAmW(p){ const h=p&&p.am; if(!h||!p.amSim||!(p.amY||[]).length)return h; const sg=p.college?4:3, t={}; for(const k in h)t[k]=0; let any=0;
  for(const r of p.amY){ if(r.syn)continue; const w=r.gr===sg?AM_SR_W:1; for(const k in t)t[k]+=(r[k]||0)*w; any=1; } return any?t:h; }
function amZSet(L){ L=L.filter(p=>p&&p.am); for(const P of [true,false]){ const A=L.filter(p=>!!p.isP===P); const v=A.map(amRaw); const m=v.length?avg(v):0; const sd=v.length?Math.sqrt(avg(v.map(x=>(x-m)**2)))||1:1; A.forEach((p,i)=>{ p.amZ=+clamp((v[i]-m)/sd,-3,3).toFixed(2); }); } }
const AM_DRAFT_W=1.5; /* 아마 성적 1표준편차 = 잠재력 1.5점. 툴(잠재력) 평가가 중심이고 기록은 보조(±2.5σ까지) */
function amDraftAdj(p){ return p&&p.amZ!=null?clamp(p.amZ,-2.5,2.5)*AM_DRAFT_W:0; }
/* 클래스 전체 아마 기록: 능력 조정(완성형·해외 복귀)까지 끝난 뒤 한 번에 만든다 */
function amClass(cls){ const L=cls.map(id=>G.players[id]).filter(Boolean); const ref=amRef(L);
  for(const p of L){ if(p.ovsRet){ if(!p.am)amHistory(p,17.5,ref,'ovs'); continue; } if(p.amSim){ amTotFix(p); continue; } /* 실제 아마 경기 기록(13_amateur_league) */ amHistory(p,p.amLv??17,ref); }
  amZSet(L); G.amV=2; }
/* 언론 평가: 눈에 보이는 성적과 체격·구속만으로 매긴 순위.
   투수와 타자는 척도가 달라 각자 안에서 표준점수로 바꾼 뒤 합친다(그래야 언론 상위권에 투수와 타자가 섞인다) */
function pressRank(cls){ const raw=cls.map(id=>G.players[id]).filter(p=>p&&p.am).map(p=>{ const h=amAmW(p); let s;
    if(p.isP){ const r=pRate(h); s=-r.era*6+(h.so/Math.max(1,h.outs/3))*9*1.4+((p.amVelo||veloOf(p))-143)*1.2; }
    else { const r=bRate(h); s=r.ops*55+h.hr*.8+h.sb*.15; }
    return {p,s:s+(p.ht-180)*.15}; });
  const zs=grp=>{ const L=raw.filter(x=>!!x.p.isP===grp); const m=L.reduce((a,x)=>a+x.s,0)/Math.max(1,L.length); const sd=Math.sqrt(L.reduce((a,x)=>a+(x.s-m)**2,0)/Math.max(1,L.length))||1; L.forEach(x=>x.z=(x.s-m)/sd+(grp?.15:0)); };
  zs(true); zs(false);
  const ps=raw.map(x=>({p:x.p,s:x.z+N(0,.25)})).sort((a,b)=>b.s-a.s);
  ps.forEach((x,i)=>x.p.press=i+1); }
/* 예전 저장(amV<2): 아직 지명되지 않은 올해 후보만 새 식으로 아마 기록을 다시 만든다. 이미 지명된 선수의 기록(역사)은 그대로 두고 표준점수만 붙인다.
   드래프트가 진행 중이면 이미 본 기록을 바꾸지 않고 표준점수만 붙인다 */
function amMigrate(){ if(!G||G.amV>=2)return; G.amV=2; const cls=(G.draftClass||[]).filter(id=>G.players[id]); if(!cls.length)return; const L=cls.map(id=>G.players[id]);
  const live=G.draft&&!G.draft.done&&G.draft.y===G.year, todo=L.filter(p=>p.prospect&&!p.draft&&p.team==null&&!p.ovsRet&&!p.amV);
  if(!live&&todo.length){ const ref=amRef(L); for(const p of todo){ const lvl=p.amLv??(p.amLevel==='약팀 상대 비중이 큼'?19:p.amLevel==='강팀 상대 비중이 큼'?15:17); amHistory(p,lvl,ref); } pressRank(cls); }
  amZSet(L.filter(p=>p.prospect||p.amV)); }
const AM_INJ_B=['손목 골절 이력','햄스트링 부상 반복','허리 디스크 치료 이력','무릎 연골 수술 이력'];
/* 리그 수준 유지: 해마다 신인이 은퇴 선수보다 강하면 리그 전체 능력이 계속 오른다(12시즌에 평균 +4, 60 이상 5명→50명).
   게임 시작 때 리그 평균을 기준으로 삼고, 지금 평균이 그보다 높으면 신인 잠재력을 그만큼 낮춰(낮으면 높여) 리그 수준을 비슷하게 유지한다 */
function lgMeanDom(){ const L=Object.values(G.players).filter(p=>!p.foreign&&!p.prospect&&(p.team!=null||p.fdPool)); return L.length?L.reduce((a,p)=>a+ovr(p),0)/L.length:null; }
/* 리그 수준 기준: 국내 선수 상위 300명(구단당 30명 안팎) 평균. 전체 평균은 신인이 늘면 내려가 버려(인원 구성 효과) 상승을 못 잡았다(커뮤니티 피드백 11-11) */
function lgTopDom(){ const V=Object.values(G.players).filter(p=>!p.foreign&&!p.prospect&&(p.team!=null||p.fdPool)).map(ovr).sort((a,b)=>b-a).slice(0,300); return V.length>=100?V.reduce((a,v)=>a+v,0)/V.length:null; }
function lgTopBase(m){ if(G.lgBaseT==null&&m!=null)G.lgBaseT=+m.toFixed(2); return G.lgBaseT; }
/* 리그 수준 목표(11-15 밸런스: 실제 KBO 생산력에 맞춘 척도). 시작 세계는 베테랑 위주라 상위 300명 평균을 그대로 묶어 두면
   주전 평균이 표시 65~68에 머물러, 2~3 WAR 주전이 66~67·5 WAR 타자가 78~79로 나왔다(KBO: 주전 70대 초중반, 리그 상위 10명 80 중후반).
   기준을 시작 값보다 LV_UP(원래 능력)만큼 위로 잡아 몇 해에 걸쳐 국내 선수층이 그만큼 자라게 한다. 외국인 생성 폭은 그대로다 */
const LV_UP=3;
const lvUp=()=>G.startY!=null?LV_UP:0; /* 세계를 만드는 동안(창단 드래프트 전 사전 시즌·성장)에는 예전 기준 그대로: 시작 세계 분포는 바꾸지 않는다 */
const lvBase=()=>{ const b=lgTopBase(lgTopDom()); return b==null?null:b+lvUp(); };
function draftLevelAdj(){ const m=lgMeanDom(); if(m==null)return 0; if(G.lgBase==null){ G.lgBase=+m.toFixed(2); } const t=lgTopDom(), b=lvBase(); const dT=t!=null&&b!=null?t-b:0; return clamp(Math.max((m-G.lgBase-lvUp()*.6)*1.6,dT*2.4),-4,8); } /* 1.6→2.4: 10시즌에 평균 표시 능력 57.3→58.9, 80 이상 4→11명(커뮤니티 피드백 11-11) */ /* 전체 평균 기준도 목표만큼(상위 300명보다 덜 오르므로 0.6배) 올린다 */
/* 성장 안정 장치: 국내 상위 300명 평균이 목표(시작+LV_UP)보다 오른 만큼 그해 겨울 성장(플러스 쪽)을 줄인다. 원래 능력 1점에 15%, 최대 40%. 목표보다 낮으면 최대 15% 더 큰다(예전 5%로는 목표까지 10년 넘게 걸렸다) */
function growLevelF(){ const y=G.year; const u=lvUp(); if(G.lvF&&G.lvF.y===y&&G.lvF.u===u)return G.lvF.f; const t=lgTopDom(), b=lvBase(); const f=t==null||b==null?1:clamp(1-(t-b)*.15,.6,1.15); G.lvF={y,u,f:+f.toFixed(3)}; return G.lvF.f; }
/* 특급 꼬리 억제(사용자 11-13: S급은 몇 년에 한 번): 상위 300명 평균을 맞춰도 정상급(표시 80+)이 해마다 늘었다(16시즌 8→26명).
   국내 정상급(표시 80 이상) 수가 기준(ELITE_N0)보다 많아진 만큼 정상급 근처(76+) 선수의 성장을 줄이고, 90 근처(86+)는 더 줄인다. 모든 구단에 같다.
   11-15: 국내 선수만 센다(외국인은 해마다 새로 들어오는 바깥 전력이라, 외국인이 상위권을 채울수록 국내 76+ 성장이 30~70% 깎였다. 사용자: 외국인이 리그 꼭대기를 차지하는 건 KBO답다).
   기준은 처음 수(국내 4명 안팎)가 아니라 목표인 구단당 1명(10명): 국내 정상급이 구단마다 한두 명 있게(플레이어 제보 11-15) */
const ELITE_N0=7, ELITE_SLOPE=1.0; /* 11-17 정상급 수 보정(구단주: 리그 한 해 7~8명): 기준 10→7, 기울기 0.7→1.0. 기준 10은 길게 보면 10명 넘게 쌓였다(드래프트 보정 문서 12년째 10.5명). 8세계 12년째 7.5→6.6명, 늘어나는 속도가 느려져 7명 근처에서 멈추게. 모든 구단에 같다(docs/design/draft-elite-tune-2026-11-17.md) */
function eliteN80(){ const y=G.year; if(G.elN&&G.elN.y===y&&G.elN.d===2)return G.elN; const n=Object.values(G.players).filter(p=>!p.prospect&&!p.retired&&!p.foreign&&p.team!=null&&FrontOfficeCore.dv(ovr(p))>=80).length; const b=ELITE_N0; G.elN={y,n,d:2,f:+clamp(1-(n-b)/b*ELITE_SLOPE,.3,1.05).toFixed(3)}; return G.elN; }
function eliteGrowF(o){ const d=FrontOfficeCore.dv(o); if(d<76)return 1; return eliteN80().f*(d>=86?.55:1); }
const DRAFT_READY=.15, DRAFT_SUPER=.2;
function makeDraftClass(){
  const cls=[]; const lvAdj=draftLevelAdj();
  /* 고1·대1부터 실제 경기를 치러 온 졸업 학년(13_amateur_league). 아마 리그를 끈 저장·실패할 때만 예전처럼 새로 만든다 */
  let sen=[]; try{ sen=amSeniors(G.year); }catch(e){ console.error(e); sen=[]; } for(const b of sen)cls.push(b.id);
  for(let i=sen.length?DRAFT_POOL:0;i<DRAFT_POOL;i++){
    const college=R()<.3; const age=college?22:18; const T=clamp(N(43,8)+(R()<.04?rnd(3,8):0)-lvAdj,26,77); /* 해마다 리그 상위권(60+)으로 클 재목이 몇 명 섞인다. 커뮤니티 피드백(11-07: 탱킹 2~3년이면 주전이 대어로 채워짐)으로 폭을 줄였다 */
    const cur=clamp(T-(27-age)*rnd(2.2,3.4),20,60);
    const b=newPlayer({age,base:cur,pot:T,college}); b.prospect=true;
    if(T<56&&R()<.07){ const h=ri(6,12); b.pot=Math.min(78,b.pot+h); b.hidT=h; } /* 숨은 재능: 실제 잠재력이 겉보기보다 크다. 대부분의 스카우트는 놓치고, 능력 좋은 스카우트만 알아본다(유저 요청 11-07) */
    setProspectArea(b); b.schoolHue=Math.floor(u01('sh',b.school)*360); /* 실제 권역·고교 이름(12_scout_area, 사용자 11-08) */
    b.ht=Math.round(clamp(N(b.isP?184:179,5),168,198)); b.wt=Math.round(clamp(b.ht-100+N(b.isP?-1:-3,6),62,112));
    if(b.isP)b.amVelo=veloOf(b)-(college?ri(1,3):ri(3,6)); else b.amRun=(+runOf(b)+.04).toFixed(2);
    if(b.inj>.22&&R()<.65)b.amInj=pick(b.isP?AM_INJ_P:AM_INJ_B);
    const lvl=rnd(14.5,19.5); b.amLevel=lvl>18.5?'약팀 상대 비중이 큼':lvl<15.5?'강팀 상대 비중이 큼':'';
    b.amLv=+lvl.toFixed(2); /* 아마 기록은 클래스가 다 만들어진 뒤 amClass에서 */
    cls.push(b.id);
  }
  sonMake(cls); /* 옛 선수의 아들(2대 선수, 33_ob) */
  /* 즉시 전력 신인: 해마다 상위 재목 몇 명은 1년차부터 1군 주전급이다(실제 KBO도 매년 2~4명은 첫해부터 자리를 잡는다).
     잠재력 상위 5명 중 DRAFT_READY 비율이 완성형이 되고, DRAFT_SUPER 확률로 리그 정상급으로 클 특급이 하나 나온다.
     드래프트 보정(11-17, docs/design/draft-calibration-2026-11-17.md): 55%·35%로는 1라운드 1~3순위의 43~48%가 1년차 주전이었다(지금 15%·20%).
     이정후·강백호·소형준·이의리·김택연처럼 첫해부터 자리 잡는 상위 지명은 있지만 대부분은 아니다(가정 목표: 1년차 주전 20~30%) */
  { const top=cls.map(id=>G.players[id]).filter(p=>p.pot>=54).sort((a,b)=>b.pot-a.pot).slice(0,5);
    for(const p of top){ if(R()<DRAFT_READY){ const t=clamp(p.pot-rnd(4,9),47,56); if(ovr(p)<t){ setOvr(p,t); p.ready=true; } } }
    if(top[0]&&R()<DRAFT_SUPER){ const p=top[0]; p.pot=clamp(p.pot+rnd(3,7),60,79); setOvr(p,clamp(p.pot-rnd(5,9),53,60)); p.ready=true; p.dt=R()<.5?'early':'norm'; }
    top.slice(0,3).forEach(p=>{ p.blue=1; }); /* 대어 셋: 성장 실현율 하한이 높다(04_growth). 상위 지명과 하위 지명의 차이가 실제로 나게(사용자 11-13: 우승팀 10순위가 손해가 되게) */
    for(const p of top.filter(q=>q.ready)){ if(p.isP)p.amVelo=veloOf(p)-(p.college?ri(0,2):ri(1,4)); else p.amRun=(+runOf(p)+.04).toFixed(2); } }
  for(const id of cls){ const p=G.players[id]; if(p&&p.amSim){ amSyncR(p); if(p.isP&&p.amVelo==null)p.amVelo=veloOf(p)-(p.college?ri(1,3):ri(3,6)); else if(!p.isP&&p.amRun==null)p.amRun=(+runOf(p)+.04).toFixed(2); } } /* 졸업 학년 후보: 구속·주력 표시 */
  /* 해외파 신인: 해외에서 돌아와 2년 유예를 마친 선수(KBO 규약 107조)는 이해 신인 드래프트에 나온다. 트라이아웃 기록 대신 해외 마지막 시즌 수준으로 아마 기록을 만든다 */
  for(const p of Object.values(G.players)){ if(p.ovsRet&&p.prospect&&p.team==null&&!p.retired){ if(!cls.includes(p.id))cls.push(p.id); continue; } /* 불러오기 보정으로 명단을 다시 만들 때 이미 참가한 복귀자(검수 11-09ze) */
    if(!(p.ovsWait&&G.year>=p.ovsWait&&p.team==null&&!p.prospect&&!p.retired))continue; delete p.ovsWait; if(milFree(p)&&!p.foreign){ p.mil={done:true,wait:G.year}; story(p,'유예 기간 2년 동안 병역 이행(군필로 드래프트 참가)','mil'); } /* 실제 해외 유턴파는 2년 유예 기간에 병역을 마치고 나온다(카페 11-15: 지명 뒤 현역 입대로 능력 하락) */ p.prospect=true; p.ovsRet=true; p.school=`해외파(${p.school||'고교 직행'})`; /* 학력·아마 기록은 출국 전 것 그대로: 고교 직행을 대졸 4년으로 새로 만들지 않는다(검수 11-09ze) */ if(!cls.includes(p.id))cls.push(p.id);
    try{ wire('드래프트',`해외파 ${p.name}(${p.age}세), ${G.year} 신인 드래프트 참가`,{ref:p.id}); }catch(e){} }
  try{ for(const p of amDepSeniors(G.year))if(!cls.includes(p.id))cls.push(p.id); }catch(e){ console.error(e); } /* 프로 지원한 부원 졸업반(13b_am_depth, 사용자 11-17): 시드 난수만 쓴다 */
  for(let i=cls.length-1;i>=0;i--){ const p=G.players[cls[i]]; if(!p||p.team!=null)cls.splice(i,1); } /* 어느 구단과든 계약한 선수는 드래프트 명단에 넣지 않는다(카페 11-17). 정상 세계에선 아무도 빠지지 않아 난수 순서 그대로 */
  amClass(cls); /* 해외 복귀자는 출국 전 아마 기록이 없을 때만 새로 만든다(검수 11-09ze) */
  pressRank(cls);
  G.draftClass=cls;
}
/* 예전 저장: 낱말처럼 읽히는 이름(예: 탁지기)을 새 이름으로 바꾼다. 같은 사람은 어디서나 같은 새 이름, 소식 글의 이름도 함께 바꾼다. 단장 본인 이름은 그대로 */
function nameMigrate(){ if(G.nmFix>=1)return; G.nmFix=1; const M=new Map(); const seen=new Set();
  const walk=(o,d)=>{ if(!o||typeof o!=='object'||d>6||seen.has(o)||o===G.gmP||o===G.mail)return; seen.add(o);
    if(typeof o.name==='string'&&nameBad(o.name)&&/^[가-힣]{3}$/.test(o.name)){ if(!M.has(o.name))M.set(o.name,genName()); o.name=M.get(o.name); }
    for(const k in o){ const v=o[k]; if(v&&typeof v==='object')walk(v,d+1); } };
  walk(G,0); if(!M.size)return;
  const fix=s=>{ if(typeof s!=='string')return s; for(const [a,b] of M)if(s.includes(a))s=s.split(a).join(b); return s; };
  for(const m of (G.mail||[])){ m.subj=fix(m.subj); m.body=fix(m.body); if(m.from)m.from=fix(m.from); }
  for(const L of [G.news,G.wire,G.log])if(Array.isArray(L))for(const x of L){ if(!x||typeof x!=='object')continue; for(const k of ['t','h','b','title','body','txt'])if(typeof x[k]==='string')x[k]=fix(x[k]); } }
/* 누락된 옛 선수 필드만 인물·필드별로 복원한다. 불러오기 횟수와 본게임 난수에 영향을 주지 않는다. */
function playerLoadValue(p,k,f){return withRng(rngHash('playerLoad',G.startY??G.year,p.id,p.name||'',k),f);}
function playerLoadDefaults(p){if(!p.dt)p.dt=playerLoadValue(p,'dt',()=>rollDT());if(!p.isP&&p.r.vit==null)p.r.vit=playerLoadValue(p,'vit',()=>Math.round(clamp(N(55-((p.inj??.14)-.14)*90,8),25,80)));if(p.fat==null)p.fat=0;if(p.foreign){if(!p.orig)p.orig=origOf(p);if(p.adapt==null)p.adapt=playerLoadValue(p,'adapt',()=>Math.round(clamp(N(50,13),20,80)));}}
/* 캠프를 다시 여는 것이 아니라 그해 누락된 컨디션만 채운다. 이미 쌓인 피로·소모·경기 기록은 손대지 않는다. */
function formLoadFix(){for(const p of Object.values(G.players)){if(p.team==null)continue;const old=p.sf;if(old&&(old.y==null||old.y===G.year)){if(old.y==null)old.y=G.year;if(old.v!=null&&old.lk!=null&&old.m!=null)continue;}const sf=playerLoadValue(p,'form:'+G.year,()=>{const sd=p.foreign?3:p.age>=33?2.4:2,x=R(),v=x<.09?N(-4.2,1.1):x<.15?N(3.4,1):N(0,sd);return {y:G.year,v:clamp(v*FORM_K,-6.5,6),m:0,lk:clamp(N(0,.012)*FORM_K,-.03,.03)};});if(old&&old.y===G.year){for(const k of ['v','m','lk'])if(old[k]==null)old[k]=sf[k];}else p.sf=sf;}G.formY=G.year;}
function migrateDraft(){ worldReset(); try{ psCatchUp(G.day+1); }catch(e){} /* 불러온 저장의 지난 포스트시즌 차전은 다음 진행일로(검수 11-09zo) */ try{ syncMinSal(); }catch(e){} /* 불러온 해의 최저 연봉(검수 11-06: 2027년 세이브를 열자마자 2026년 기준으로 계약됨) */ /* 불러오기·가져오기 뒤 항상 부르는 자리 */
  if(!G)return; champEventsInit(); try{ psArchiveMetaMigrate(); }catch(e){} try{ awardListFix(); }catch(e){} try{ retirementMigrate(); }catch(e){} try{ awardHistoryMigrate(); }catch(e){} try{ storyCountersMigrate(); }catch(e){} /* 우승·시상·은퇴·이정표의 결정적 옛 저장 정리(검수 11-18 #614~643) */ try{ postFix(); }catch(e){} try{ ovsMigrate(); }catch(e){} /* 해외 신청·이력·수상 누락의 결정적 옛 저장 정리(검수 11-18 #584~613) */ try{ mailMigrate(); }catch(e){} try{ persMigrate(); }catch(e){} try{ nameMigrate(); }catch(e){} try{ amMigrate(); }catch(e){ console.error(e); } try{ amLeagueMigrate(); }catch(e){ console.error(e); } try{ franSelFix(); }catch(e){} /* 이직·야인 뒤 남은 전 구단 프랜차이즈 직접 지정(검수 11-17 #189) */ try{ amProLeakFix(); }catch(e){ console.error(e); } /* 카페 11-17: 프로 선수에 붙은 지명 뒤 아마 기록 줄 정리 */ try{ ntSaveFix(); }catch(e){ console.error(e); } try{ psRecordMigrate(); }catch(e){} /* 대표 통산 기록을 거부권 칸(p.ntc)에서 p.ntcr로(검수 11-17 #213) */ /* 카페 11-17: 프로 선수에 붙은 지명 뒤 아마 기록 줄 정리 */ try{ ciMigrate(); }catch(e){ console.error(e); } /* 이름 변경 대기·이름 이력 날짜·연고 이전 구장 수리(87_club_identity) */ try{ gmInit(); }catch(e){} try{ legMigrate(); }catch(e){} try{ legStadMigrate(); }catch(e){} try{ gmClubMigrate(); }catch(e){} try{ jobMigrate(); }catch(e){} try{ personalMigrate(); }catch(e){} try{ userLogMigrate(); }catch(e){} /* 경력·제안·개인 기록의 결정적 옛 저장 정리(검수 11-18 #554~583) */ try{ agInit(); }catch(e){ console.error(e); } /* 옛 저장(에이전시 8곳)을 에이전시 12곳·담당자 27명으로 옮긴다(결정적) */ if(!G.coach){ try{ coachInit(); }catch(e){} } else { try{ coachFill(); }catch(e){} } try{ fTmpStaleFix(); }catch(e){ console.error(e); } /* 옛 저장 수리: 이미 정리된 부상 대체 선수의 결정 버튼·다시 다친 원 선수 복귀 결정을 닫는다(검수 11-17 #233·#235) */ try{ futAggFix(); }catch(e){ console.error(e); } /* 옛 2군 합산 줄 WAR·wRC+ 고정(검수 11-17 #209·#210) */ try{ mcfMigrate(); }catch(e){} /* 감독이 바뀐 뒤 남은 전임 감독 상태 정리(검수 11-17) */ try{ rainMigrate(); }catch(e){ console.error(e); } try{ promoMigrate(); }catch(e){ console.error(e); } try{ ownershipIndieFix(); }catch(e){ console.error(e); } /* 검수 11-17: 우천 순연 표시·행사 예약·투자사 구단 매각 문구 수리(여러 번 불러도 같다) */ try{ coachRulesMigrate(); }catch(e){} /* 코치 영입 공통 규칙(89d): 떠난 코치를 가리키는 대행·옛 제안 정리 */ try{ trStintFix(); }catch(e){ console.error(e); } if(G.goals&&!G.goals.v&&G.goals.y===G.year){ /* 검수 11-17 #197: 트레이드 성과는 그 거래로 시작한 소속 기간만 */ /* 카페 11-17: 프로 선수에 붙은 지명 뒤 아마 기록 줄 정리 */ try{ const t=team(G.user); const base=projSupport(); const mm=t.owner==='profit'?.85:t.owner==='pr'?1:1.15; G.goals.sup=Math.max(G.goals.sup,Math.round(clamp(base*mm+.05,.2,1)*100)/100); }catch(e){} G.goals.v=2; } if(G.spend&&G.spend.coach==null)G.spend.coach=0; G.shortlist=G.shortlist||[]; for(const t of G.teams||[]){ const d=TEAM_DEF.find(x=>x.code===t.code); if(d)t.hue=d.hue; }
  for(const k in G.mgr)mgrFix(G.mgr[k]); (G.mmarket||[]).forEach(mgrFix);
  if(!G.r68){ G.r68=true; for(const t of G.teams){ if(t.id===G.user)continue; const add=fillRoster(t.id,54); for(const p of add)delete p.dev; }
    const ua=fillRoster(G.user,ROSTER_MIN); if(ua.length)mail('운영팀','소속선수 한도 확대',`협회 규정의 소속선수 한도에 맞춰 정식 등록 한도가 ${ROSTER_MAX}명으로 늘었습니다. 최소 인원(${ROSTER_MIN}명)을 맞추려고 2군 선수 ${ua.length}명을 등록했습니다.`,{kind:'운영'}); }
  for(const p of Object.values(G.players))milInit(p);
  try{ dsubMigrate(); }catch(e){ console.error(e); } /* 세부 수비 능력(03b_def_sub): 옛 저장 선수도 같은 값으로 */
  for(const s of G.scouts.concat(G.scoutMarket||[])){ if(!s.role){ s.role='am'; s.since=-999; } }
  /* 검수 11-18 #644~672: 직원 복원 뒤 구단별 관찰·출장·의견·정원을 결정적으로 정리한다. */
  obsLogMigrate(); tripMigrate(); obsViewMigrate(); obsWatchFix(); domesticScoutMigrate();
  /* 채용은 날짜 진행에서 한다. 저장에는 남아 있는 직원의 평가 효과만 다시 연결한다. */
  for(const tid in G.lgStaff||{})if(team(+tid)&&Array.isArray(G.lgStaff[tid]?.sc))try{stSync(+tid);}catch(e){}
  prInit(); if(!G.goals&&period()==='season')setGoals();
  if((period()==='season'||period()==='post')&&G.entryY!==G.year){ G.entryY=G.year; for(const t of G.teams)setEntry(t.id); }
  if(!G.intl)G.intl={us:1,la:0,jp:0,tw:0,au:0}; if(!G.data)G.data={lv:1}; if(G.spend&&G.spend.intl==null)G.spend.intl=0; if(!G.fac)G.fac={lv:2,build:null}; try{ facInit(); }catch(e){} if(G.spend.fac==null)G.spend.fac=0;
  for(const t of G.teams)if(t.fac==null)t.fac=ri(2,4); try{ aiFacAll(); }catch(e){} try{ facOverdueFix(); }catch(e){} try{ extStaleFix(); }catch(e){} try{ ovsPostFix(); }catch(e){} try{ ntLoadFix(); }catch(e){} /* 검수 11-17: WBC 해외파 포지션·모습, 상무 안내 표시 */ /* 카페 11-17: 포스팅 복귀 선수의 FA 연차·계약 수리 */try{ fanOpsFix(); }catch(e){} /* 팬 운영 구단 상태·응원단 단원 사진 키(검수 11-17) */ /* 카페 11-17: 포스팅 복귀 선수의 FA 연차·계약 수리 */try{ sponMigrate(); }catch(e){} /* 스폰서 옛 저장 수리(검수 11-17 #284·#287) */ try{ expMigrate(); }catch(e){ console.error(e); } /* 창단 단계·모기업·남은 제의(검수 11-17 #158·159·164) */ /* 카페 11-17: 포스팅 복귀 선수의 FA 연차·계약 수리 */
  for(const p of Object.values(G.players))playerLoadDefaults(p);
  if(G.formY!==G.year&&G.day>=G.cal.camp)formLoadFix();
  /* 외국인 후보 채우기는 다음 날짜 진행(07_daily)에 맡긴다: 같은 저장을 두 번 열면 후보가 달라졌다(검수 11-09zr #13) */
  migrateDraftPool(); /* 학교 정보 하나가 없거나 풀이 작다는 이유로 저장한 후보를 다시 뽑지 않는다 */
  if(G.dmemo)for(const id in G.dmemo)if(!(G.players[id]&&G.players[id].prospect))delete G.dmemo[id]; /* 실제로 사라진 후보의 메모만 정리 */
  recoverDraftLogs(); draftClubInit(); rchkInit(); sdObFix(); ctMilClauseFix(); sdContractFix(); salMilFix(); migrateMoveContracts(); faClosedFix(); aiBlockDates();
  /* 검수 11-18 #731~750: 실제 구단·복무 상태를 복원한 뒤 소속별 기록을 조용히 정리한다. */
  captainMigrate(); leadAdjMigrate(); playPromiseFix(); goalSupportFix();
}
/* 드래프트 명단 정리(카페 11-17 ddddddd): 어느 구단과든 계약한 선수(트라이아웃·무적·해외 복귀 등)는 신인 드래프트 명단·진행 중 지명 명단에서 뺀다.
   계약했는데 신인 후보(prospect) 표시가 남은 선수는 표시를 푼다(1월 1일 명단 정리 때 지워지지 않게). 난수를 쓰지 않는다. 사람·AI 구단 공통 */
function draftClassPrune(){ if(!G)return 0; let n=0; const out=new Set();
  const drafted=p=>!!(p.draft&&p.draft.y===G.year); /* 이번 드래프트에서 지명된 선수는 진행 중 명단에 남긴다(지명 결과 표시) */
  const prune=L=>{ if(!Array.isArray(L))return; for(let i=L.length-1;i>=0;i--){ const p=G.players[L[i]]; if(!p||(!p.prospect&&!drafted(p))||(p.team!=null&&!drafted(p))){ if(p)out.add(p.id); L.splice(i,1); n++; } } }; /* 제자리에서 지운다: G.draft.cls와 G.draftClass가 같은 배열일 수 있다 */
  prune(G.draftClass); const d=G.draft; if(d&&!d.done&&d.cls!==G.draftClass)prune(d.cls);
  for(const id of out){ const p=G.players[id]; if(p&&p.prospect){ p.prospect=false; if(G.dmemo)delete G.dmemo[id]; } }
  n+=proStaleFix(); return n; }
/* 계약한 선수의 아마추어 표시 정리(카페 11-17 "트라이아웃에서 영입했는데 선수 화면이 드래프트 대상으로 나와요"):
   명단(G.draftClass)에 없더라도 어느 구단과든 계약한 선수에 남은 신인 후보(prospect)·창단 드래프트 후보(fdPool)·해외 복귀 유예(ovsWait) 표시를 지운다.
   선수 화면은 prospect를 보고 '드래프트 대상'·아마추어 프로필로 그렸다. 지명된 선수는 doPick에서 이미 prospect가 꺼져 있어 건드리지 않는다.
   계약 직후(trySign 등)·드래프트 시작·불러오기·매일 진행에서 부른다. 난수를 쓰지 않고, 두 번 불러도 같다. 사람·AI 구단 공통 */
function proStaleFix(){ if(!G||!G.players)return 0; let n=0; const fdLive=!!(G.fd&&!G.fd.done);
  for(const p of Object.values(G.players)){ if(!p||p.team==null)continue; let f=false;
    if(p.prospect){ p.prospect=false; f=true; if(G.dmemo)delete G.dmemo[p.id]; }
    if(p.fdPool&&!fdLive){ p.fdPool=false; f=true; }
    if(p.ovsWait){ delete p.ovsWait; f=true; }
    if(f)n++; }
  return n; }
/* 예전 후보는 인물·능력·관찰·메모를 그대로 두고 학교/권역 표시만 보완한다. */
function migrateDraftPool(){
  const d=G.draft, live=!!(d&&!d.done), done=!!(d&&d.done&&(d.y==null||d.y===G.year));
  const valid=L=>[...new Set((Array.isArray(L)?L:[]).filter(id=>G.players[id]&&typeof G.players[id]==='object').map(id=>G.players[id].id??id))];
  try{ proStaleFix(); }catch(e){ console.error(e); } /* 계약한 선수를 후보로 세지 않는다: 명단이 비었을 때 prospect로 명단을 다시 세우며 계약 선수가 되돌아왔다(카페 11-17) */
  const prospects=Object.values(G.players).filter(p=>p&&p.prospect).map(p=>p.id);
  const source=Array.isArray(G.draftClass)&&G.draftClass.length?G.draftClass:live&&Array.isArray(d.cls)?d.cls:prospects;
  G.draftClass=valid(source);
  try{ draftClassPrune(); }catch(e){ console.error(e); } /* 옛 저장 수리: 트라이아웃 등으로 계약했는데 명단에 남은 선수(카페 11-17) */
  if(!G.draftClass.length&&!live&&!done){ if(prospects.length)G.draftClass=valid(prospects); else makeDraftClass(); }
  if(live)d.cls=valid(Array.isArray(d.cls)?d.cls:G.draftClass);
  for(const id of new Set([...G.draftClass,...prospects,...(live?d.cls:[])])){ const p=G.players[id]; if(!p||!p.prospect)continue;
    const school=typeof p.school==='string'&&p.school.trim(), known=school&&AREA.find(a=>a.hs.includes(school)||a.un.includes(school));
    const area=known||areaDef(p.area)||areaDef(areaOf(p));
    if(area){p.area=area.k;p.region=area.reg;}
    p.school=school||'학교 정보 없음'; /* 근거 없는 학교·아마 성적을 새로 만들지 않는다 */
    if(p.schoolHue==null)p.schoolHue=Math.floor(u01('sh',p.school)*360);
  }
  draftRefsPrune();
}
/* 지워진 선수 번호만 정리한다. 실제 선수·저학년과 학교/부원 관심 토큰은 보존한다. */
function draftRefsPrune(){if(!G)return 0;let n=0;const live=id=>!!(G.players?.[id]||G.amU?.L?.[id]),list=L=>{if(!Array.isArray(L))return;for(let i=L.length-1;i>=0;i--)if(typeof L[i]==='number'&&!live(L[i])){L.splice(i,1);n++;}},map=M=>{for(const id in M||{})if(/^\d+$/.test(id)&&!live(id)){delete M[id];n++;}};
  list(G.shortlist);map(G.dmemo);for(const L of Object.values(G.amFw||{}))list(L);for(const P of Object.values(G.amPr||{}))map(P);for(const C of Object.values(G.dClub||{})){list(C.shortlist);map(C.dmemo);}return n;}
/* 그해 신인 드래프트 지명 순서: 지난 시즌 순위의 역순(r2: 2라운드부터). 경쟁균형세 3회 연속 초과 구단은 1라운드(r1)에서 9단계 내려간다.
   드래프트 날 전에도 같은 순서를 미리 알려 줄 수 있게 따로 계산한다 */
/* 옛 저장의 지정 순번에는 최초 취임 구단을 붙여 이직·사임 전에 고정한다. */
function draftClubInit(){ if(G.dr1&&G.dr1.tid==null){ const first=(G.chron||[]).find(x=>x.k==='join'&&x.gm&&x.tid!=null); G.dr1.tid=first?first.tid:(G.unemp&&G.unemp.from)??G.user; } }
function draftClubLeave(old,rehire){ draftClubInit();
  const T=G.dClub=G.dClub||{}; if(!rehire)T[old]={shortlist:G.shortlist||[],dmemo:G.dmemo||{},dplan:G.dplan||null,drestPre:G.drestPre||null,rchkA:Object.fromEntries(Object.values(G.players).filter(p=>p.rchkA).map(p=>[p.id,p.rchkA]))};
  const n=!G.unemp&&(G.user!==old||rehire)?T[G.user]:null;
  G.shortlist=n?n.shortlist:[]; G.dmemo=n?n.dmemo:{}; G.dplan=n?n.dplan:null; G.drestPre=n?n.drestPre:null;
  for(const p of Object.values(G.players)){ delete p.rchkA; if(n&&n.rchkA&&n.rchkA[p.id])p.rchkA=n.rchkA[p.id]; }
  if(n)delete T[G.user]; }
function draftOrders(){ draftClubInit(); const h=[...(G.history||[])].reverse().find(x=>x.y<G.year&&x.order); if(!h)return null; const order=[...h.order].reverse().map(o=>o.tid); for(const t of G.teams)if(!order.includes(t.id))order.unshift(t.id); /* 지난 시즌 기록이 없는 신생 구단은 첫 순번(89_league_expansion) */
  if(G.dr1&&G.dr1.y===G.year&&order.includes(G.dr1.tid)){ const i=order.indexOf(G.dr1.tid); order.splice(i,1); order.splice(clamp(G.dr1.slot-1,0,order.length),0,G.dr1.tid); } /* 1년차 신인 드래프트 순번을 새 게임에서 골랐으면 첫 시즌만 그 자리(오른발고니 11-11) */
  const pen=G.teams.filter(t=>t.pickPen===G.year&&order.includes(t.id)).map(t=>t.id);
  return {r1:penOrder(order,pen),r2:order,pen,y:h.y}; }
/* 1라운드 제재 반영 순서: 제재 구단은 원래 순번에서 9칸 아래 자리에 둔다. 여러 구단이 함께 받아도 서로 밀어 올리지 않게 자리를 먼저 잡고 나머지를 순서대로 채운다(검수 11-07). 지명권 예상 순번도 같은 식(검수 11-08d) */
function penOrder(order,pen){ const n=order.length; pen=pen.filter(t=>order.includes(t)).sort((a,b)=>order.indexOf(b)-order.indexOf(a)); const slot=new Array(n).fill(null);
  for(const t of pen){ let j=Math.min(n-1,order.indexOf(t)+9); while(j<n&&slot[j]!=null)j++; if(j>=n){ j=n-1; while(slot[j]!=null)j--; } slot[j]=t; }
  const rest=order.filter(t=>!pen.includes(t)); for(let j=0;j<n;j++)if(slot[j]==null)slot[j]=rest.shift(); return slot; }
/* 실제 드래프트 순번표(지명권 거래 반영): 사전 안내·모의 지명·드래프트 시작이 같은 표를 쓴다(검수 11-06) */
function draftPlan(){ const D=draftOrders(); if(!D)return null; const picks=[]; for(let r=0;r<DRAFT_ROUNDS;r++)(r===0?D.r1:D.r2).forEach((tid,i)=>{ const own=pkOwner(G.year,r+1,tid); picks.push(own===tid?{rd:r+1,no:i+1,tid,pid:null}:{rd:r+1,no:i+1,tid:own,from:tid,pid:null}); }); return picks; }
function draftNo(tid){ const o=draftOrders(); if(!o)return null; const r1=o.r1.indexOf(tid)+1, r2=o.r2.indexOf(tid)+1, r1o=[...o.r2].indexOf(tid)+1; const f=(draftPlan()||[]).find(k=>k.tid===tid); /* 지명권 거래를 반영한 실제 첫 지명(검수 11-07) */ return {r1,r2,pen:o.pen.includes(tid)&&r1!==r1o,y:o.y,first:f?{rd:f.rd,no:f.no}:null}; } /* pen: 실제로 순번이 내려간 때만(검수 11-07) */
/* 신인 보드 점수: 보드 화면과 추천 지명이 같은 식(잠재력 미확인은 현재 +6, 검수 11-07) */
const draftVal=(rp,p)=>(rp.ofp??rp.cur+6)+rp.cur*.2+amDraftAdj(p); /* p: 공개 아마 성적 보정(AI 지명 aiDraftScore와 같은 amDraftAdj) */
const draftFirstTxt=n=>n&&n.first?`${n.first.rd}라운드 ${n.first.no}순위`:'지명권 없음';
/* 3월 1일: 드래프트 시즌 시작 안내(첫 시즌 포함) */
function draftSeasonMail(){ if(G.unemp||G.user==null)return; const n=draftNo(G.user); if(!n||!G.cal||!G.cal.draft)return; const c=scoutChief&&scoutChief();
  let own1=true, pkT=''; try{ const H=pkHeld(G.user); own1=H.includes('1:'+G.user); const gone=Array.from({length:DRAFT_ROUNDS},(_,i)=>i+1).filter(rd=>!H.includes(rd+':'+G.user)) /* 모든 라운드(검수 11-07) */, got=H.filter(k=>+k.split(':')[1]!==G.user); if(gone.length||got.length)pkT=` 지명권 거래 반영: ${gone.length?`넘긴 지명권 ${gone.map(rd=>rd+'라운드').join('·')}`:''}${gone.length&&got.length?', ':''}${got.length?`받은 지명권 ${got.map(pkName).join(', ')}`:''}.`; }catch(e){} /* 거래한 지명권을 반영해 안내(검수 11-06) */
  const f1=(draftPlan()||[]).find(k=>k.tid===G.user); /* 실제 첫 지명(받은 지명권 포함) */
  mail('스카우트팀',`${G.year} 신인 드래프트: ${f1?`우리 첫 지명은 ${f1.rd}라운드 ${f1.no}순위`:'이번 드래프트 지명권이 없습니다'}`,`${dmd(G.cal.draft)}에 ${G.year} 신인 드래프트가 열립니다. 지명 순서는 지난 시즌(${n.y}) 성적의 역순이라 원래 우리 순번은 1라운드 ${n.r1}순위${n.r2!==n.r1?`, 2라운드부터 ${n.r2}순위`:''}입니다.${f1&&!(f1.rd===1&&f1.no===n.r1)?` 지명권 거래를 반영한 실제 첫 지명은 ${f1.rd}라운드 ${f1.no}순위입니다.`:''}${pkT}${n.pen?` 경쟁균형세 3회 연속 초과로 1라운드 순서가 ${n.r2}순위에서 ${n.r1}순위로 내려갔습니다.`:''}\n\n오늘부터 드래프트 시즌입니다. ${c?`${c.name} 스카우트팀장이 `:''}아마추어 담당 스카우트를 고교·대학 선수 관찰에 보냅니다. 관찰이 쌓일수록 평가가 정확해집니다.\n영입·계약 → 신인 드래프트에서 후보 순위를 보고 관심 선수를 표시해 두세요. 지명한 신인은 내년 1월에 합류합니다.`,{kind:'업무',acts:[{l:'신인 드래프트 보기',a:'go',v:'transfer:draft'}]}); }
function startDraft(){ try{ draftOddsSnap(); }catch(e){} /* 예상 확률 보정 측정(65_draft_odds) */
  const D=draftOrders(); const order=D.r2, o1=D.r1;
  if(D.pen.includes(G.user)){ const a=D.r2.indexOf(G.user)+1, b=D.r1.indexOf(G.user)+1; if(b!==a)note('드래프트',`경쟁균형세 3회 연속 초과로 1라운드 지명 순서가 ${a}순위에서 ${b}순위로 내려갔습니다.`); } /* 실제로 바뀐 만큼만(검수 11-07) */
  pkClean(); const picks=draftPlan(); void order; void o1; /* 트레이드로 넘겨받은 지명권은 원래 구단 순번에 쓴다 */
  try{ draftClassPrune(); }catch(e){ console.error(e); } /* 지명 시작 전: 계약한 선수는 명단에서 뺀다(카페 11-17) */
  G.draft={cls:G.draftClass||[],picks,cur:0,done:false,y:G.year}; { const P=draftRestPre(); if(P)G.draft.rest={mode:P.mode,min:P.min,tid:P.tid}; delete G.drestPre; } /* 준비 화면에서 정해 둔 자동 지명 기준 */
  stop('드래프트',`${G.year} 신인 드래프트가 열립니다. 참가 ${G.draft.cls.length}명, ${DRAFT_ROUNDS}라운드 지명 순번은 ${picks.length}개입니다(어느 라운드든 지명을 건너뛸 수 있어 실제 지명 인원은 더 적을 수 있습니다). 순서는 지난 시즌 성적의 역순이고, ${(()=>{ const f=picks.find(k=>k.tid===G.user); return f?`우리 첫 지명은 ${f.rd}라운드 ${f.no}순위입니다.`:'우리 구단은 이번 드래프트 지명권이 없습니다.'; })()}`);
}
/* 드래프트 성적표: 한 해 지명자 전체의 현재 모습 */
function draftTidOf(p){ const st=(p.story||[]).find(x=>x.k==='draft'); if(!st)return null; const t=G.teams.find(t=>st.t.includes(tname(t.id))); return t?t.id:null; }
/* 누락된 지명 장부만 현역/보관 기록의 명시적 지명 정보로 복원한다. 팀 소속·이름으로는 추정하지 않는다. */
function draftRecoveredRows(y){ const L=[],seen=new Set(),add=(p,a)=>{ const d=p.draft||{}, year=d.y??(a?p.dy:null); if(year!==y||p.id==null||seen.has(String(p.id)))return;
    const tid=d.tid??(a?p.dt:draftTidOf(p)); if(tid==null||!team(tid))return;
    seen.add(String(p.id)); L.push({id:p.id,nm:p.name,t:tid,rd:d.rd??'?',no:d.no??'?',...(d.from!=null?{from:d.from}:{}),...(d.nt?{nt:d.nt}:{}),pos:a?(p.isP?p.pos:POSK[p.pos]||p.pos):posLabel(p),pr:p.press||null}); };
  for(const p of Object.values(G.players))if(p)add(p,false);
  for(const p of Object.values(G.arch||{}))if(p&&!seen.has(String(p.id)))add(p,true);
  return L;
}
function recoverDraftLogs(){ const years=new Set(); for(const p of Object.values(G.players).concat(Object.values(G.arch||{}))){ if(!p)continue; const y=p.draft&&p.draft.y!=null?p.draft.y:p.dy; if(Number.isInteger(y)&&y<=G.year)years.add(y); }
  for(const y of years){ const rows=draftRecoveredRows(y), L=((G.dlog=G.dlog||{})[y]=Array.isArray(G.dlog[y])?G.dlog[y]:[]), seen=new Map(L.map(x=>[String(x.id),x]));
    for(const r of rows){ const old=seen.get(String(r.id)); if(old){ for(const k of ['from','nt'])if(old[k]==null&&r[k]!=null)old[k]=r[k]; } else { L.push(r); seen.set(String(r.id),r); } } }
}
function draftWidth(y){ const L=(G.dlog||{})[y]||[], d=G.draft&&G.draft.y===y?G.draft:null, h=(G.history||[]).find(h=>h.y===y-1&&h.order);
  const saved=L.find(x=>x.nt>0); if(saved)return saved.nt;
  return Math.max(1,...(d?d.picks.map(k=>k.no||0):[]),h?h.order.length:0,...L.map(x=>Number(x.no)||0),y===G.year?G.teams.length:10); }
function draftClass(y){ const L=Array.isArray(G.dlog&&G.dlog[y])?G.dlog[y]:draftRecoveredRows(y), seen=new Set();
  return L.filter(x=>x&&x.id!=null&&!seen.has(String(x.id))&&seen.add(String(x.id))).map(x=>{ const p=G.players[x.id]; const c=p?careerOf(p):null; const a=!p&&G.arch&&G.arch[x.id]; /* 은퇴해도 지명 성과는 보관 기록으로 */ return Object.assign({},x,{p,war:c?c.war:a?(a.rows||[]).reduce((s,r)=>s+(r.war||0),0):0,now:p?p.team:null,ovr:p?Math.round(ovr(p)):null,n:Number.isInteger(x.rd)&&Number.isInteger(x.no)?(x.rd-1)*(x.nt||draftWidth(y))+x.no:null}); }); }
function draftGrades(y){ const L=draftClass(y); const by={}; for(const x of L){ const t=x.t??(x.p&&x.p.draft?null:null); if(t==null)continue; by[t]=(by[t]||0)+x.war; } const arr=Object.entries(by).map(([t,v])=>({t:+t,v})).sort((a,b)=>b.v-a.v); return arr; }
/* 지명 3년·5년 뒤 돌아보기: 스틸픽과 실패한 상위 지명 */
function draftRetro(){ const now=G.year; for(const back of [3,5]){ const y=now-back; const L=draftClass(y); if(L.length<20)continue; /* 은퇴 선수도 보관 기록으로 넣는다: 성적표(draftGrades)와 같은 합계(검수 11-06) */
  const top=[...L].sort((a,b)=>b.war-a.war); const steal=top.find(x=>x.n!=null&&x.n>=15&&x.war>=3&&top.indexOf(x)<5); const bust=L.filter(x=>x.n!=null&&x.n<=3&&x.war<.5).sort((a,b)=>a.war-b.war)[0];
  if(steal)news('분석',`${y} 드래프트 ${back}년 뒤: ${steal.n}순위 ${steal.nm}, 최고의 스틸픽`,`${tname(steal.t)}이(가) ${steal.rd}라운드 ${steal.no}순위로 뽑은 ${steal.nm}이(가) 통산 WAR ${steal.war.toFixed(1)}로 같은 해 지명자 중 ${top.indexOf(steal)+1}위입니다.`,steal.t===G.user?2:0,{ref:steal.id});
  if(bust)news('분석',`${y} 드래프트 ${back}년 뒤: ${bust.n}순위 ${bust.nm}, 아직 물음표`,`${tname(bust.t)}이(가) 전체 ${bust.n}순위로 뽑은 ${bust.nm}의 통산 WAR는 ${bust.war.toFixed(1)}입니다. 같은 해 최고는 ${top[0].nm}(${top[0].war.toFixed(1)}).`,bust.t===G.user?-2:0,{ref:bust.id});
  const mine=L.filter(x=>x.t===G.user); if(mine.length){ const g=draftGrades(y); const rk=g.findIndex(x=>x.t===G.user)+1; note('드래프트',`${y} 드래프트 ${back}년 뒤 성적표: 우리 지명자 통산 WAR 합 ${mine.reduce((a,x)=>a+x.war,0).toFixed(1)}, 리그 ${rk||'-'}위. 영입·계약 → 신인 드래프트 → 성적표에서 자세히 볼 수 있습니다.`); } } }

/* 창단 드래프트 전 재정 전망: 국내 선수 연봉을 뺀 나머지 지출과 수입으로 '선수 연봉에 쓸 수 있는 돈'을 계산 */
function fdFin(tid){ const u0=G.user; if(tid!=null)G.user=tid; try{ const t=team(G.user); const b=budget(); const dom=sum(b.exp.filter(x=>x[2]==='pay').map(x=>x[1])); const other=b.E-dom; const sup=t.indie?0:b.cap;
    return {inc:b.inc,I:b.I,other,otherRows:b.exp.filter(x=>x[2]!=='pay'),sup,cash:t.cash,avail:b.I+sup-other-(G.fd&&!G.fd.done?foundReserve().tot:0),res:G.fd&&!G.fd.done?foundReserve():null,cap:capOf(G.year),indie:!!t.indie,owner:t.owner,market:t.market}; } finally{ G.user=u0; } }
function fdWelcome(){ const t=team(G.user); const B=bossOf(G.user); const f=fdFin(); G.fdWait=true;
  G.mail=G.mail.filter(m=>m.subj!=='구단주 서신'&&m.subj!==`${G.year} 시즌 구단 목표`); G.stops=(G.stops||[]).filter(m=>m.subj!==`${G.year} 시즌 구단 목표`); G.goals=null;
  /* 비서 업무 안내와 기존 선수단 기준 재정 경고는 드래프트가 끝난 뒤로 미룬다 */ G.mail=G.mail.filter(m=>m.kind!=='업무'&&m.subj!=='재정 압박 구단입니다'); delete t.tight; if(G.tut&&!G.tut.done)G.tut.step=0;
  const L=[`예상 수입 ${money(f.I)} (${f.inc.map(x=>`${x[0]} ${money(x[1])}`).join(', ')})`,`선수 연봉 외 지출 ${money(f.other)} (외국인 선수 예산, 감독·코치, 운영비 등)`,t.indie?'모기업 지원 없음: 수입 안에서 꾸려야 합니다':`모기업 지원 한도 ${money(f.sup)}`,`보유 현금 ${money(f.cash)}`]; { const a=austOn(t); if(a)L.push(`창단 지명 1라운드 ${a.k}순위 조건: ${a.y1}시즌까지 모기업 지원 한도 ${a.d<0?Math.round(-a.d*100)+'% 감액':a.d>0?Math.round(a.d*100)+'% 증액':'그대로'}${a.strict?', 시설·추가 지원 요청 승인 가능성 낮음':''}`); } if(f.res)L.push(`창단 첫해 예비비 ${money(f.res.tot)}: 비어 있는 감독·코치 자리 채용비 ${money(f.res.vac)}과 운영 여유분 ${money(f.res.cush)}을 예산 여유에서 미리 뺐습니다`);
  const verdict=f.avail>=f.cap?`국내 선수 연봉으로 샐러리캡(${money(f.cap)})까지 써도 버틸 수 있습니다.`:f.avail>=f.cap*.75?`국내 선수 연봉은 ${money(f.avail)} 안쪽이 안전합니다. 샐러리캡(${money(f.cap)})을 꽉 채우면 적자입니다.`:`국내 선수 연봉에 쓸 수 있는 돈은 ${money(Math.max(0,f.avail))} 정도입니다. 샐러리캡(${money(f.cap)})보다 한참 적으니, 비싼 선수를 여럿 뽑으면 적자가 납니다.`;
  mail('구단주실',`${B.own.name} 회장: 창단을 함께해 주셔서 반갑습니다`,`${tname(G.user)} 창단 단장으로 와 주셔서 반갑습니다. ${OWNVOICE[t.owner]}\n\n올해 구단 재정 전망입니다.\n${L.map(x=>'· '+x).join('\n')}\n\n${verdict}\n\n리그가 국내 선수 전원을 다시 나누는 창단 드래프트를 엽니다. 선수 연봉과 계약은 그대로 따라오니 재정을 보면서 뽑아 주세요. 준비되면 시작하겠습니다.`,{kind:'구단주',imp:false,acts:[{l:'창단 드래프트 시작',a:'fdBegin'}]});
  addLog(`${tname(G.user)} 창단 단장으로 부임했습니다.`); }

/* 드래프트 언론 보도: 6월 15일 '최대어 TOP 10', 8월 25일 '1라운드 모의 지명'. 언론 순위는 눈에 보이는 성적·구속·체격으로 매긴 것이라 잠재력과 다를 수 있다 */
function draftPressLine(p){ const h=p.am; if(!h)return ''; if(p.isP){ const r=pRate(h); return `ERA ${r.era.toFixed(2)} · 탈삼진 ${h.so}${p.amVelo?` · 최고 ${amVmax(p)}km`:''}`; } const r=bRate(h); return `OPS ${fmt3(r.ops)} · 홈런 ${h.hr}${h.sb>=10?` · 도루 ${h.sb}`:''}`; }
function draftPressNews(day){ if(G.unemp||!G.draftClass||!G.draftClass.length||(G.draft&&!G.draft.done&&G.draft.y===G.year))return;
  const cls=G.draftClass.map(id=>G.players[id]).filter(p=>p&&p.prospect&&p.press).sort((a,b)=>a.press-b.press);
  if(day===KD(6,15)&&cls.length){ const L=cls.slice(0,10).map((p,i)=>`${i+1}. ${p.name}(${p.school||p.region}, ${posLabel(p)}) ${draftPressLine(p)}`);
    for(const p of cls){ const o=fatherOf(p); if(o&&(obMine(o)||o.retNo))news('드래프트',`${o.name}의 아들 ${p.name}, 올해 드래프트에 나온다`,`${obMine(o)?`${tname(G.user)}에서 ${obMineC(o).ys}시즌을 뛴`:`${tshort(o.team)} 출신`}${o.retNo?` 영구결번 ${o.no}번`:''} ${o.name}의 아들 ${p.name}(${p.school||p.region}, ${posLabel(p)})이(가) ${G.year} 신인 드래프트에 나옵니다. 스카우트팀은 '아버지 이름값과 별개로 지켜봐야 할 선수'라고 보고했습니다.`,0,{ref:p.id}); } /* 우리 구단 출신·영구결번 OB의 아들은 드래프트 전에 한 번 알린다(11-09r) */
    news('드래프트',`${G.year} 신인 드래프트 최대어 TOP 10`,`언론이 꼽은 올해 드래프트 상위 10명입니다. 고교·대학 기록과 구속·체격 같은 눈에 보이는 것으로 매긴 순위라, 프로에서 얼마나 클지는 구단 스카우트의 판단이 다를 수 있습니다.\n\n${L.join('\n')}`,0); }
  if(day===KD(8,25)&&cls.length){ const O=draftPickOrder(); const pool=[...cls]; const L=[]; for(const pk of O){ const p=pool.shift(); if(!p)break; L.push(`${pk.no}순위 ${tshort(pk.tid)}: ${p.name}(${p.school||p.region}, ${posLabel(p)})`); }
    const mine=O.find(x=>x.tid===G.user);
    news('드래프트',`${G.year} 신인 드래프트 1라운드 모의 지명`,`지난 시즌 순위 역순으로 정해진 1라운드 순서에, 언론 순위대로 뽑는다고 가정한 예상입니다. 실제로는 구단마다 스카우트 평가와 필요한 자리가 달라 순서가 바뀝니다.\n\n${L.join('\n')}${mine?`\n\n${tname(G.user)}은(는) 1라운드 ${mine.no}순위입니다.`:''}`,0); } }
