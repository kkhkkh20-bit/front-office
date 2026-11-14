/* ===== 시설 투자 규칙·재원 경로·구단주 운영: 모든 구단이 같은 규칙(사용자 11-13) =====
   "시설을 너무 쉽게 올린다", "다른 구단도 시설을 올리고 모은 돈을 쓰게", "다른 구단도 구단주가 지원해 줘야 한다"
   1) 높은 단계는 선행 조건: 4단계는 기반 시설(다른 시설 3곳 2단계 이상), 5단계는 그 시설을 쓸 사람(코치진 육성 능력·트래킹 분석원·연계 시설),
      6단계는 5단계를 한 해 넘게 운영해 본 경험과 종합 4단계
   2) 큰 공사(5단계 이상 또는 공사비 50억 이상)는 시 인허가를 거친다. 지역 관계가 좋을수록 빨리 나온다. 큰 공사는 한 번에 한 곳
   3) 공사 중인 시설은 훈련 효율이 잠시 떨어진다(공사 소음·이동). 4단계부터는 공사 기간도 길다
   4) 재원 네 갈래: 구단 현금 · 모기업 투자(신뢰·적자·성향, 120일에 한 번, 한 시즌 한 건) · 명명권 후원(공사비 절반, 대신 성적·관중 조건) ·
      지자체 보조(공사비 40%, 대신 지역 야구 교실·지역 채용 의무)
   5) AI 구단도 같은 비용·규칙으로 짓고, 계획에 맞춰 남는 돈을 쓴다(시설·구장·스태프·팬 행사). 구단주 신뢰가 성적·재정으로 움직이고,
      우승 포상·운영비 절감 지시·단장 경질 압박도 우리 구단과 같은 틀로 받는다 */

/* --- 지역(시) 관계: 0~100, 기본 50. 지자체 보조·인허가 속도에 쓴다 --- */
function cityRel(tid){ const t=team(tid); if(!t)return 50; if(t.cityRel==null)t.cityRel=50; return t.cityRel; }
function cityRelAdd(tid,d){ const t=team(tid); if(!t||!d)return; t.cityRel=clamp(Math.round((cityRel(tid)+d)*10)/10,0,100); }

/* --- 공사 기간: 4단계부터 1.4배(여러 시즌에 걸친 공사) --- */
const FAC_DAYS_X=1.4;
for(const F of Object.values(FACI))for(let lv=4;lv<=FAC_MAX;lv++)F.days[lv]=Math.round(F.days[lv]*FAC_DAYS_X/10)*10;

/* --- 선행 조건 --- */
const FAC_PRE={base:3,dv:52,trk:3};
function facCoachDv(tid){ const C=coachesOf(tid), L=Object.values(C).filter(c=>c&&Number.isFinite(c.dv)).map(c=>c.dv); return L.length?sum(L)/L.length:40; }
function facPre(tid,k,lv){ const S=facSt(tid); if(!S||!S.it)return ''; const it=S.it;
  if(lv>=4&&FACK.filter(x=>x!==k&&(it[x]||0)>=2).length<FAC_PRE.base)return '기반 시설이 먼저입니다. 다른 시설 세 곳 이상을 2단계로 올려야 합니다.';
  if(lv>=5){ if(k==='lab'){ if(anaPow('trk',tid)<FAC_PRE.trk)return '장비를 다룰 트래킹 분석원이 먼저 필요합니다.'; }
    else if(k==='rehab'){ if((it.weight||0)<4)return '웨이트·컨디셔닝이 4단계는 되어야 재활과 이어집니다.'; }
    else if(k==='weight'){ if((it.rehab||0)<3)return '재활·회복 센터가 3단계는 되어야 합니다.'; }
    else if(facCoachDv(tid)<FAC_PRE.dv)return '시설을 살릴 코치진의 육성 능력이 아직 부족합니다.'; }
  if(lv>=6){ const d=S.dn&&S.dn[k]; if(d==null||G.day-d<365)return '5단계를 한 해 넘게 운영해 본 뒤에 올릴 수 있습니다.'; if((S.lv||0)<4)return '종합 시설이 4단계는 되어야 합니다.'; }
  return ''; }
/* 큰 공사: 인허가가 필요하고 한 번에 한 곳 */
function facBig(k,lv){ return lv>=5||FACI[k].c[lv]>=5000; }
function facPermitDays(tid){ return Math.round(clamp(45+(70-cityRel(tid))*2,30,120)); }
/* 공사를 시작할 수 있는가(재원과 상관없는 조건). 빈 문자열이면 가능 */
function facCanStart(tid,k){ const S=facSt(tid); if(!S||!FACI[k])return '없는 시설입니다.'; const lv=S.it[k]||0; if(lv>=FAC_MAX)return '이미 최고 단계입니다.'; if(S.bld[k])return '이미 공사 중입니다.';
  const B=Object.entries(S.bld); if(B.length>=2)return '공사는 동시에 2곳까지만 할 수 있습니다.';
  if(facBig(k,lv+1)&&B.some(([x,b])=>facBig(x,b.lv)))return '큰 공사는 한 번에 한 곳만 할 수 있습니다.';
  return facPre(tid,k,lv+1); }
/* 착공 기록을 만든다(우리·AI 공통). 큰 공사는 인허가 기간(pm)이 끝난 뒤 공사가 시작된다 */
function facStartBuild(tid,k,o){ const S=facSt(tid), lv=S.it[k]||0, F=FACI[k], c=F.c[lv+1]; const b={lv:lv+1,c,...(o||{})}; let st=G.day;
  if(facBig(k,lv+1)){ b.pm=G.day+facPermitDays(tid); st=b.pm; } b.done=st+F.days[lv+1]; S.bld[k]=b; return b; }
/* 공사 중 훈련 효율 저하: 인허가가 끝나 실제 공사가 시작된 시설만(효과 단계에서 뺀다) */
const FAC_DIS=.4;
function facDis(S,k){ const b=S&&S.bld&&S.bld[k]; return b&&!(b.pm>G.day)?FAC_DIS:0; }

/* --- 모기업 투자 승인(우리·AI 같은 식) --- */
const CAPEX_CD=120;
function capexLastFin(tid){ const H=G.history||[], h=H[H.length-1]; return h&&h.fins&&h.fins[tid]; }
function capexOddsT(tid,c){ const t=team(tid); if(!t||t.indie)return 0; const me=tid===G.user&&!G.unemp;
  const bond=me?((G.personal&&G.personal.contacts&&G.personal.contacts['own:'+G.user]||{}).bond??30):30;
  const f=capexLastFin(tid), deficit=f&&f.net<0?.12:0, debt=(t.cash||0)<0?.1:0;
  let p=.38+((t.trust??55)-50)/55+(bond-30)/120+({win:.12,pr:.05,profit:-.15}[t.owner]||0)-(austOn(t)?.strict?.15:0)-c/30000-deficit-debt+(me?cwRapMod():0);
  if(t.capexY===sponSeason())p-=.25; /* 한 시즌 두 번째 모기업 투자는 어렵다 */
  return clamp(p,.05,.9); }
function capexWait(tid){ const t=team(tid), d=t&&t.capexD; return d!=null&&G.day-d<CAPEX_CD?d+CAPEX_CD:0; }

/* --- 명명권 후원·지자체 보조 --- */
const FAC_SPON={share:.5,yrs:3,k:['indoor','weight','lab','fut'],rk:4,occ:.8,back:.8}; /* 공략 방지: 4위 안 그리고 관중 80%를 지켜야 하고, 후원금은 세 시즌에 나눠 받으며, 어기면 받은 돈의 80%를 돌려준다(예전 6위 또는 75%, 한 번에, 30%) */
const facOwnPart=(route,c)=>route==='spon'?c-Math.round(c*FAC_SPON.share/FAC_SPON.yrs):Math.round(c*(1-FAC_CITY.share)); /* 착공 때 구단이 먼저 내는 몫 */
const FAC_CITY={share:.4,yrs:4,k:['fut','dorm','indoor'],prog:.03,up:.1};
const facSponCo=()=>{ const L=Object.values(SPON_CO).flat(); return L.length?L:['한빛']; }; /* 명명권 기업 이름은 스폰서 기업 목록에서 */
function facLastRank(tid){ const o=G.last&&G.last.order; if(!o)return 5.5; const i=o.findIndex(x=>(x.tid??x)===tid); return i<0?5.5:i+1; }
function facSponOdds(tid){ const t=team(tid), fan=prOf(tid)?prOf(tid).fan:55; return clamp(.2+((t.pop||1)-1)*.9+(5.5-facLastRank(tid))*.05+(fan-55)/200,.05,.7); }
function facCityOdds(tid){ const t=team(tid); return clamp(.15+(cityRel(tid)-50)/80+((t.pop||1)-1)*.3,.05,.75); }
function facRouteWait(tid,r){ const t=team(tid), d=t&&t.facAsk&&t.facAsk[r]; return d!=null&&G.day-d<CAPEX_CD?d+CAPEX_CD:0; }
/* 고를 수 있는 길과 막힌 까닭: 화면 버튼과 AI 결정이 함께 쓴다 */
function facRouteInfo(tid,k){ const t=team(tid), S=facSt(tid), lv=(S.it[k]||0), c=FACI[k].c[lv+1]; const R0={};
  R0.cash={ok:spendable(tid)>=c,why:spendable(tid)>=c?'':'자금이 부족합니다.'};
  R0.cap=t.indie?{ok:false,why:'모기업이 없습니다.'}:capexWait(tid)?{ok:false,why:`${dmd(capexWait(tid))}부터 다시 요청할 수 있습니다.`}:{ok:true,p:capexOddsT(tid,c)};
  R0.spon=!FAC_SPON.k.includes(k)?{ok:false,why:'명명권을 붙일 시설이 아닙니다.'}:t.facSpon?{ok:false,why:'이미 명명권 계약이 있습니다.'}:facRouteWait(tid,'spon')?{ok:false,why:`${dmd(facRouteWait(tid,'spon'))}부터 다시 찾을 수 있습니다.`}:spendable(tid)<facOwnPart('spon',c)?{ok:false,why:'구단 부담분이 부족합니다.'}:{ok:true,p:facSponOdds(tid)};
  R0.city=!FAC_CITY.k.includes(k)?{ok:false,why:'지역과 함께 쓸 시설이 아닙니다.'}:(t.cityOb||[]).length>=2?{ok:false,why:'지자체와 맺은 약속이 이미 많습니다.'}:facRouteWait(tid,'city')?{ok:false,why:`${dmd(facRouteWait(tid,'city'))}부터 다시 협의할 수 있습니다.`}:spendable(tid)<facOwnPart('city',c)?{ok:false,why:'구단 부담분이 부족합니다.'}:{ok:true,p:facCityOdds(tid)};
  return R0; }
/* 확률을 말로만 */
const oddsWord=p=>p>=.65?'높음':p>=.4?'보통':p>=.2?'낮음':'매우 낮음';

/* --- 착공·완공 이야기 --- */
const FAC_STORY={indoor:'비 오는 날과 한겨울에도 공 소리가 끊이지 않게 됩니다.',weight:'선수들의 몸을 숫자로 관리하는 시대가 열립니다.',rehab:'다친 선수가 더 빨리, 더 안전하게 돌아올 길이 생깁니다.',
  lab:'투구와 스윙을 눈이 아니라 데이터로 고치게 됩니다.',fut:'2군 선수들이 더 좋은 그라운드에서 내일을 준비합니다.',dorm:'어린 선수들이 먹고 자는 일부터 프로답게 바뀝니다.'};
function facSrcTxt(src){ return src==='cap'?'모기업 투자':src==='spon'?'명명권 후원':src==='city'?'지자체 보조':'구단 현금'; }
function facStartNews(tid,k,b){ const t=team(tid), F=FACI[k], nm=FAC_NEWS[k][b.lv]||F.lv[b.lv];
  const pm=b.pm>G.day?` 시 인허가를 거쳐 ${dmd(b.pm)}쯤 첫 삽을 뜹니다.`:'';
  if(tid===G.user&&!G.unemp){ news('구단',`${t.city} ${t.nick}, ${nm} ${b.pm>G.day?'건립 발표':'착공'}`,`${FAC_STORY[k]||''}${b.sponN?` ${b.sponN}이(가) 이름을 걸고 공사비를 보탭니다.`:''}${b.src==='city'?` ${t.city}시가 공사비 일부를 보태고, 구단은 지역 야구 교실을 열기로 했습니다.`:''}${pm} 공사 기간에는 그 시설 훈련이 조금 불편해집니다.`,b.lv>=4?2:1); }
  else if(b.lv>=4||b.c>=4000)wire('시설',`${t.city} ${t.nick}, ${nm} ${b.pm>G.day?'건립 발표':'착공'}(${facSrcTxt(b.src)})`,{tid}); }
function facDoneNews(tid,k,b){ const t=team(tid), nm=FAC_NEWS[k][b.lv]||FACI[k].lv[b.lv]; if(tid===G.user&&!G.unemp){ if(b.lv>=3)news('구단',`${nm} 개관식`,`${t.city} ${t.nick}의 ${b.sponN?b.sponN+' ':''}${nm}이(가) 문을 열었습니다. ${FAC_STORY[k]||''}`,b.lv>=5?2:1); } }

/* --- 우리 구단 재원 경로(명명권·지자체) --- */
function facFund(k,route){ if(G.unemp)return '맡은 구단이 없습니다.'; facInit(); const tid=G.user, t=team(tid); const e=facCanStart(tid,k); if(e)return e;
  const I=facRouteInfo(tid,k)[route]; if(!I)return '없는 방법입니다.'; if(!I.ok)return I.why; (t.facAsk=t.facAsk||{})[route]=G.day; const lv=G.fac.it[k], c=FACI[k].c[lv+1];
  if(R()>=I.p)return route==='spon'?'명명권을 살 기업을 찾지 못했습니다. 성적이나 관중이 오르면 관심이 생깁니다.':`${t.city}시가 올해는 예산을 잡기 어렵다고 합니다. 지역 관계가 좋아지면 잘 됩니다.`;
  return facFundGo(tid,k,route,c); }
function facFundGo(tid,k,route,c){ const t=team(tid), me=tid===G.user&&!G.unemp, share=route==='spon'?FAC_SPON.share:FAC_CITY.share, help=Math.round(c*share), own=facOwnPart(route,c), up=c-own; /* 명명권은 첫해 몫(up)만 먼저 받는다 */
  let k0=own; if(me){ k0=spendPay(own); G.spend.facB=(G.spend.facB||0)+k0; } else t.cash-=own;
  const o={src:route,help}; if(route==='spon'){ { const L=facSponCo(); o.sponN=L[Math.floor(facU('spn'+G.year,tid+k)*L.length)]; } t.facSpon={k,n:o.sponN,y0:sponSeason(),y1:sponSeason()+FAC_SPON.yrs-1,help,paid:up,miss:0}; }
  else (t.cityOb=t.cityOb||[]).push({k,y1:sponSeason()+FAC_CITY.yrs-1,prog:Math.round(c*FAC_CITY.prog),help,miss:0});
  const S=facSt(tid), b=facStartBuild(tid,k,o); S.inv=(S.inv||0)+c; (S.hist=S.hist||[]).push({y:G.year,d:G.day,k,lv:b.lv,c,src:route}); if(S.hist.length>40)S.hist.shift();
  clubFacilityHistory('fac',tid,FACI[k].l,'착공',{...b,src:`${facSrcTxt(route)} ${money(help)} · 구단 ${money(own)}`}); facStartNews(tid,k,b);
  if(me){ addLog(`${FACI[k].l} ${FACI[k].lv[b.lv]} 공사: ${facSrcTxt(route)}로 공사비 일부를 덜었습니다(구단 부담 ${money(own)}).`);
    mail(route==='spon'?'마케팅팀':'운영팀',route==='spon'?`명명권 계약: ${o.sponN}`:`지자체 보조 합의: ${FACI[k].l}`,route==='spon'?`${o.sponN}이(가) ${FACI[k].l}에 이름을 걸고 공사비 절반을 ${FAC_SPON.yrs}시즌에 나눠 냅니다. 대신 그동안 상위권 성적과 꽉 찬 관중을 함께 지켜야 하고, 못 지키면 후원을 거두고 받은 돈 대부분을 돌려받으려 합니다.`:`${t.city}시가 공사비 일부를 냅니다. 대신 ${FAC_CITY.yrs}시즌 동안 해마다 지역 야구 교실을 열고 지역 인력을 써야 합니다. 그만큼 운영비가 조금 늘어납니다.`,{kind:'시설'}); }
  return ''; }
/* 지자체 약속으로 늘어나는 연 운영비(지역 채용): 결산 증설분 유지비에 더한다 */
function facCityUp(t){ return sum((t.cityOb||[]).map(o=>{ const S=facSt(t.id), lv=S&&S.it?S.it[o.k]||0:0; return Math.round(FACI[o.k].up[lv]*FAC_CITY.up); })); }

/* --- 해마다(결산 직후) 조건 점검: 명명권 성적·관중, 지자체 지역 교실 --- */
function facDealsYear(t){ const me=t.id===G.user&&!G.unemp, y=G.last&&G.last.y; if(y==null)return;
  const D=t.facSpon; if(D&&y>=D.y0){ const A=G.sea&&G.sea.att&&G.sea.att[t.id], occ=A&&A.cap?A.sum/A.cap:.8, rk=facLastRank(t.id), ok=rk<=FAC_SPON.rk&&occ>=FAC_SPON.occ;
    if(!ok)D.miss++; if(D.miss>=2){ const back=Math.round((D.paid??D.help)*FAC_SPON.back); if(me){ if(t.indie)spendPay(back); else G.spend.etc=(G.spend.etc||0)+back; } else t.cash-=back; /* 우리 구단은 결산 장부로(검수 11-14) */ t.facSpon=null; if(me){ prInit(); G.pr.fan=clamp(G.pr.fan-1,0,100); news('구단',`${D.n}, ${FACI[D.k].l} 명명권 조기 해지`,`성적과 관중이 약속에 못 미쳤다며 ${D.n}이(가) 후원을 거뒀습니다. 구단은 후원금 일부(${money(back)})를 돌려줍니다.`,-1); } else wire('구단',`${t.city} ${t.nick}, ${D.n} 명명권 해지`,{tid:t.id}); }
    else { if(ok&&y>D.y0&&D.paid!=null&&D.paid<D.help){ const a=Math.min(D.help-D.paid,Math.round(D.help/FAC_SPON.yrs)); D.paid+=a; t.cash=(t.cash||0)+a; if(me)note('시설',`${D.n} 명명권 후원금 ${money(a)}이 들어왔습니다.`); } } /* 해마다 조건을 지켰을 때만 다음 몫 */
    if(!t.facSpon){}
    else if(y>=D.y1){ t.facSpon=null; t.pop=clamp((t.pop||1)+.01,.7,1.45); if(me)news('구단',`${D.n} 명명권 계약 만료`,`${D.n}과 함께한 ${FACI[D.k].l} 후원이 약속대로 끝났습니다. 다른 기업들도 구단을 다시 보고 있습니다.`,1); }
    else if(me&&!ok)mail('마케팅팀',`${D.n}: "이대로면 곤란합니다"`,`명명권 후원사가 올해 성적과 관중에 실망했습니다. 한 번 더 기대에 못 미치면 후원을 거두고 일부를 돌려받으려 합니다.`,{kind:'시설'}); }
  const L=t.cityOb||[]; for(const o of [...L]){ if(y>o.y1){ t.cityOb=(t.cityOb||[]).filter(x=>x!==o); cityRelAdd(t.id,3); continue; }
    if((t.cash||0)-o.prog<-2000){ o.miss++; cityRelAdd(t.id,-8); if(o.miss>=2&&o.help){ const back=Math.round(o.help*FAC_SPON.back); t.cash-=back; t.cityOb=(t.cityOb||[]).filter(x=>x!==o); if(me)mail('운영팀',`${t.city}시, 시설 보조금 회수`,`약속한 지역 야구 교실을 두 해 열지 못해 ${t.city}시가 보조금 대부분(${money(back)})을 돌려받았습니다.`,{kind:'시설',imp:true}); continue; } /* 약속을 두 번 어기면 지자체도 돌려받는다(공략 방지) */ if(me)mail('운영팀','지역 야구 교실을 열지 못했습니다',`돈이 모자라 ${t.city}시와 약속한 지역 야구 교실을 올해 열지 못했습니다. 시와의 관계가 나빠졌습니다.`,{kind:'시설'}); continue; }
    if(me){ const k0=spendPay(o.prog); G.spend.fac=(G.spend.fac||0)+k0; } else t.cash-=o.prog; cityRelAdd(t.id,2); } }

/* ===== AI 구단 구단주(모기업): 신뢰·우승 포상·운영비 절감·단장 경질 압박 =====
   우리 구단의 결산 평가를 줄인 식: 계획에 맞는 기대 순위 대비 성적, 수지, 모기업 지원을 얼마나 썼는지. 신뢰는 지원 한도(supportCap)·모기업 투자 승인에 그대로 쓰인다 */
const AI_OWN_EXP={win:3,next:5,star:5,build:8,tight:8};
function aiOwnerYear(h){ const ord=h.order||[]; const EI=ecoIdx(sponSeason());
  for(const t of G.teams){ if(t.id===ME()||t.indie)continue; const f=h.fins&&h.fins[t.id]; const i=ord.findIndex(o=>(o.tid??o)===t.id), rk=i<0?5.5:i+1;
    const exp=AI_OWN_EXP[planOf(t)]||5, w=t.owner==='win'?1.3:t.owner==='profit'?.7:1; let d=clamp((exp-rk)*1.1*w,-6,6);
    if(h.champ===t.id)d+=5; else if(h.runner===t.id)d+=2;
    if(f){ d+=clamp((f.net+(f.back||0))/2500,-3,3)*(t.owner==='profit'?1.5:1); if(f.supCap)d-=(f.support/f.supCap-.5)*3; }
    if((t.cash||0)<0)d-=3;
    try{ d+=opPromSettle(t.id,h.y,rk); }catch(e){} /* 다시 설득하며 한 성적 약속(우리와 같은 +2/-8, 94_owner_push) */
    t.trust=clamp(Math.round((t.trust??55)+d+(55-(t.trust??55))*.1),5,95);
    /* 우승 포상: 우승을 바라거나 홍보를 중시하는 구단주는 FA 특별 자금을 낸다 */
    if(h.champ===t.id&&(t.owner==='win'||t.owner==='pr')){ const g=Math.round(2000*EI); t.cash+=g; wire('구단',`${t.city} ${t.nick} 구단주, 우승 포상으로 FA 영입 자금 ${money(g)} 지원`,{tid:t.id}); }
    /* 적자가 나고 지원을 많이 쓴 구단에 신뢰가 낮으면 운영비 절감 지시(다음 시즌 지원 한도 축소) */
    if(f&&f.net<0&&f.supCap&&f.support>=f.supCap*.8&&t.trust<45){ const amt=Math.round(800*EI/10)*10; t.ownCut={y:sponSeason(),amt}; wire('구단',`${t.city} ${t.nick} 모기업, 운영비 절감 지시`,{tid:t.id}); }
    /* 신뢰가 바닥이면 구단주가 단장을 바꾼다(성적 경질과 별개, 재임 2년 이상) */
    const g=gmOf(t.id); if(g&&!g.interim&&t.trust<22&&G.year-(g.since??G.year)>=2&&!expYr(t.id)){ t.trust=45; /* 성적 경질과 같은 길: 물러난 단장 후보 명단·내부 승격·사용자 단장직 제의(검수 11-14) */
      gmReplace(t,g,{chron:`${g.name} 단장 경질 · 구단주 신뢰 하락`,why:'구단주의 신뢰를 잃었다는 평가입니다'}); } } }

/* ===== AI 구단 지출 정책: 상대 게임이라 돈을 쌓아 두지 않고 계획에 맞게 쓴다 =====
   겨울(11월 20일)과 여름(7월 1일)에 남는 돈(현금 - 완충액)을 계획별 비율로 나눠 시설·구장·스태프·팬 행사에 쓴다. 비용과 규칙은 우리 구단과 같다 */
const AI_SPEND={win:{fac:.45,stad:.15,st:.3,fan:.1},next:{fac:.5,stad:.2,st:.2,fan:.1},build:{fac:.7,stad:.05,st:.25,fan:0},star:{fac:.3,stad:.4,st:.1,fan:.2},tight:{fac:0,stad:0,st:0,fan:0}};
const AI_STAD_PREF={win:['turf','seat','vis'],next:['seat','fnb','turf'],build:['fnb','seat'],star:['seat','vis','fnb','prem'],tight:[]};
function aiBuffer(t){ const EI=ecoIdx(sponSeason()); return Math.round((1500+(t.owner==='profit'?1500:0)+(t.owner==='win'?-500:0))*EI)+(t.indie?2000+newStadDue(t.id):0); }
function aiSpend(t,winter){ if(t.id===ME())return null; const pl=planOf(t)||'next', W=AI_SPEND[pl]||AI_SPEND.next; const buf=aiBuffer(t); let ex=(t.cash||0)-buf;
  let ops=null; if(winter){ try{ ops=aiOpsPlan(t,ex,W); ex-=ops.cash; }catch(e){} } /* 겨울: 사람 단장이 쓰는 운영 수단(부상 방지·병원·육성 방침·아카데미·응원단·버스)부터 같은 값으로 정한다(99_ai_parity) */
  if(ex<800||pl==='tight')return null;
  if(!winter)ex*=.5; /* 시즌 중에는 절반만 */ const L={y:G.year,w:winter?1:0,ex:Math.round(ex),fac:0,stad:0,st:0,fan:0,ops:ops?Math.round(ops.cash):0};
  /* 시설: 계획 비중만큼, 많아야 두 건 */ const S=aiFacInit(t); let fb=ex*W.fac; for(let i=0;i<2&&fb>300;i++){ const c0=t.cash; const k=aiFacPlan(t,S,!winter,{force:true,budget:fb,reserve:buf}); if(!k)break; const used=Math.max(0,c0-t.cash); L.fac+=used||S.bld[k].c-(S.bld[k].help||0); fb-=Math.max(used,300); }
  /* 구장: 겨울에만, 계획에 맞는 항목 */ if(winter&&stadWindow()){ const St=stadOf(t.id); let sb=ex*W.stad; for(const k of AI_STAD_PREF[pl]||[]){ const lv=St.lv[k]; if(lv>=STAD_MAX||(St.build||[]).some(b=>b.k===k))continue; const c=STAD_COST[lv+1]; if(c>sb*2||t.cash-c<buf)continue; /* 몫의 두 배까지는 한 건 */ t.cash-=c; sb-=c; L.stad+=c; St.build=(St.build||[]).concat({k,lv:lv+1,done:G.day+STAD_DAYS[lv+1],c}); clubFacilityHistory('stad',t.id,`${stadName(t.id)} ${STAD_ITEMS.find(x=>x.k===k).l}`,'착공',St.build[St.build.length-1]); } }
  /* 스태프: 다음 시즌 스카우트·분석원 인건비 여유(stAiPlan이 읽는다). 겨울에 다시 정한다 */ if(winter){ t.stBoost=Math.round(clamp(ex*W.st/2,0,800)); L.st=t.stBoost; }
  /* 팬 행사·지역 공헌: 인기 조금, 지역 관계 조금 */ const fb2=Math.round(Math.min(ex*W.fan-(ops?ops.fanY:0),1500)); /* 응원단 운영비로 쓴 만큼 뺀다 */ if(fb2>=200){ t.cash-=fb2; t.pop=clamp((t.pop||1)+fb2/60000,.7,1.45); cityRelAdd(t.id,fb2/500); L.fan=fb2; }
  (t.spendLog=t.spendLog||[]).push(L); if(t.spendLog.length>12)t.spendLog.shift(); return L; }

/* ===== 매일(aiFacDaily 끝에서): 결산 직후 처리, 지출 시점 ===== */
function clubEconDaily(){ if(!G||!G.teams)return; const E=G.ceco=G.ceco||{}; const H=G.history||[], h=H[H.length-1];
  if(h&&h.y!=null&&E.yr!==h.y&&G.last&&G.last.y===h.y){ E.yr=h.y; try{ aiOwnerYear(h); }catch(e){} for(const t of G.teams)try{ facDealsYear(t); }catch(e){} for(const t of G.teams){ if(t.id!==ME())try{ aiPriceYear(t); }catch(e){} } }
  const o=dobj(G.day); const winter=o.m===11&&o.d===20, summer=o.m===7&&o.d===1;
  if(winter||summer){ const k=G.year+(winter?'w':'s'); if(E.sp!==k){ E.sp=k; for(const t of G.teams){ if(t.id===ME())continue; try{ aiSpend(t,winter); }catch(e){} if(summer)try{ aiOwnerAsk(t,'mid'); }catch(e){} } } }
  /* FA 시장이 열린 날: 다른 구단 단장도 구단주에게 영입 자금을 요청한다(우리와 같은 승인 식·간격·신뢰 비용) */
  if(G.fa&&G.fa.open&&!G.fa.closed&&G.day>=G.fa.openDay&&E.oa!==sponSeason()){ E.oa=sponSeason(); for(const t of G.teams){ if(t.id===ME())continue; try{ aiOwnerAsk(t,'fa'); }catch(e){} } }
  /* 매달 1일: 우리처럼 언제든 찾아갈 수 있다(같은 달력이 횟수를 막는다). 목적 있는 지원금은 그때 판정 */
  if(o.d===1&&E.om!==G.day){ E.om=G.day; const faOn=G.fa&&G.fa.open&&!G.fa.closed; for(const t of G.teams){ if(t.id===ME())continue; try{ aiGrantCheck(t); }catch(e){} try{ aiOwnerAsk(t,faOn?'fa':'mid'); }catch(e){} } } }
