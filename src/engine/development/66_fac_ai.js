/* ===== 구단별 훈련 시설 보존과 다른 구단의 시설 투자 =====
   훈련 시설은 단장이 아니라 구단의 것이다. 우리 구단 시설은 G.fac, 다른 구단 시설은 team.fi에 같은 모양으로 둔다.
   {lv:종합 등급, it:{시설별 0~3단계}, bld:{시설:{lv,done,c,cap}}(공사 여러 곳), dn:{시설:완공일}, pf:구단 성향, up0:기준 유지비, inv:누적 투자, hist:투자 기록}
   - 단장이 구단을 옮기면 떠나는 구단의 G.fac를 통째로 team.fi로 넘기고, 가는 구단의 team.fi를 G.fac로 가져온다.
     진행 중인 공사도 그대로 남아 그 구단(AI)이 이어서 완공하고, 다시 돌아오면 그대로 복원된다.
   - 다른 구단은 매년 겨울(12월 1일)과 여름(6월 15일)에 재정·전략·구단 성향에 따라 공사를 할지 정한다.
     부자 구단은 분석·재활, 재정이 어려운 구단은 싼 유지·보강 위주로 드물게, 리빌딩 구단은 2군·숙소, 우승 도전 구단은 회복·컨디션 시설을 고른다.
   - 결정은 구단·연도로 고정된 해시 난수를 쓴다. 공용 난수(R)를 건드리지 않아 경기·성장 흐름이 시설 결정 때문에 바뀌지 않는다. */
const FAC_NEWS={indoor:['','간이 실내 연습장','실내 연습장','실내 훈련동'],weight:['','웨이트장','컨디셔닝 센터','퍼포먼스 센터'],rehab:['','물리치료실','재활센터','회복 센터'],
  lab:['','피칭·타격 랩','트래킹 랩','바이오메카닉스 랩'],fut:['','2군 구장 천연잔디','2군 구장 조명·라커룸','2군 전용 구장'],dorm:['','기숙사','기숙사 영양 식당','선수촌']};
for(const k of FACK)for(let lv=4;lv<=FAC_MAX;lv++)FAC_NEWS[k][lv]=FACI[k].lv[lv];
function facU(a,b){ let h=2166136261>>>0; const s=a+'|'+b; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  h=Math.imul(h^(h>>>15),2246822507)>>>0; h=Math.imul(h^(h>>>13),3266489909)>>>0; return ((h^(h>>>16))>>>0)/4294967296; }
/* 세계마다 다른 구단 성향이 나오게 하는 열쇠(공용 난수를 쓰지 않으려고 창단 때 정해진 값을 쓴다) */
function facWK(){ const t=G.teams&&G.teams[0]; return t?String(Math.round((t.scoutSd||5)*1e6)):'0'; }
function facCalcLv(it){ const a=sum(FACK.map(k=>it[k]||0))/FACK.length; return clamp(Math.round(1+a*4/3),1,5); }
function facUpOf(it){ return sum(FACK.map(k=>FACI[k].up[it[k]||0])); }
/* 종합 등급에서 시설별 단계를 나눈다. 합계는 종합 등급에 맞추고, 어느 시설에 먼저 투자했는지는 구단 성향으로 정한다(랩은 새 장비라 조금 늦게) */
function facAlloc(t,lv){ const W=facWK(); const pf={}; for(const k of FACK)pf[k]=.75+facU('fpf'+W+':'+t.id,k)*.5;
  const ord=[...FACK].sort((a,b)=>(pf[b]-(b==='lab'?.3:0))-(pf[a]-(a==='lab'?.3:0)));
  const tot=clamp(Math.round(((lv||3)-1)*.75*FACK.length),0,FACK.length*3); const base=Math.floor(tot/FACK.length); let rem=tot-base*FACK.length;
  const it={}; for(const k of FACK)it[k]=base; for(const k of ord){ if(rem<=0)break; it[k]++; rem--; }
  /* 성향이 뚜렷한 구단은 한 시설을 한 단계 더 올리고 가장 덜 챙긴 시설을 한 단계 낮춘다(합계 유지) */
  const hi=ord[0], lo=[...ord].reverse().find(k=>it[k]>0&&k!==hi); if(lo&&facU('fsw'+W,t.id)<.6&&it[hi]<3&&it[lo]>0){ it[hi]++; it[lo]--; }
  return {it,pf}; }
/* 다른 구단 시설 상태. 없으면(예전 세이브·새 게임) 종합 등급에서 만든다 */
function aiFacInit(t){ if(t.fi&&t.fi.it){ const S=t.fi; S.bld=S.bld||{}; S.dn=S.dn||{}; if(!S.pf)S.pf=facAlloc(t,S.lv).pf; S.hist=S.hist||[]; if(S.up0==null)S.up0=facUpOf(S.it); return S; }
  const a=facAlloc(t,t.fac||3); const S={lv:facCalcLv(a.it),it:a.it,bld:{},dn:{},pf:a.pf,up0:facUpOf(a.it),inv:0,hist:[]}; t.fi=S; t.fac=S.lv; return S; }
function aiFacAll(){ if(!G||!G.teams)return; for(const t of G.teams){ if(t.id!==G.user)aiFacInit(t); else delete t.fi; } } /* 우리 구단 시설은 G.fac에만 둔다 */
/* 어느 구단이든 시설 상태(우리 구단은 G.fac) */
function facSt(tid){ if(tid==null)return null; if(tid===G.user){ if(!G.fac||!G.fac.it)facInit(); return G.fac; } const t=G.teams[tid]; return t?aiFacInit(t):null; }
/* 다른 구단의 시설 단계: 매일 모든 선수에 쓰므로 가볍게. 아직 만들지 않았으면 리그 기준(2단계) */
function facLvK(tid,k){ if(tid==null)return 2; if(tid===G.user)return facOf(k); const t=G.teams[tid]; return t&&t.fi&&t.fi.it?(t.fi.it[k]||0):2; }
/* 다른 구단 부상·회복·2군 효과는 리그 중간인 2단계를 기준(예전 값)으로 본다. 예전엔 이 효과가 없었으므로 2단계 구단은 그대로다 */
function facAiInj(tid){ return tid==null?1:1-(facImpact(facLvK(tid,'weight'))-2)*.05; }
function facAiRec(tid){ return tid==null?1:1-facImpact(facLvK(tid,'rehab'))*.07; } /* 우리 구단과 같은 식(0단계 기준). 병원 등급 몫은 AI에 없다 */
function facAiFat(tid){ return tid==null?1:1+facImpact(facLvK(tid,'rehab'))*.06; } /* 우리 구단과 같은 식(사용자 결정 11-07) */
function facAiFut(tid){ return tid==null?0:(facImpact(facLvK(tid,'fut'))-2)*.05; }
/* 증설분 유지비: 시작 때보다 늘어난 유지비만 결산에 붙인다(기본 시설 유지비는 구단 운영비에 들어 있다) */
/* 야인 기간 전 구단은 아직 G.fac·G.bus에 있다(검수 11-09zza). 우리가 떠난 날(hoD)이 이번 결산 기간이면 그 전 유지비는 인계 장부에 이미 냈으므로 떠난 뒤 몫만(검수 11-09zza) */
function aiFacUpExtra(t){ const me=t.id===G.user, F=me?G.fac:t.fi, bl=me?G.bus:t.bus; const s0=F&&F.hoD!=null&&F.hoD>G.day-365?F.hoD:G.day-365, f=clamp((G.day-s0)/365,0,1);
  const bus=bl!=null?Math.round(Math.max(0,BUS[bl].up-BUS[1].up)*f):0; /* 우리가 산 리무진의 추가 운영비(다른 구단 기본은 우등 버스, 검수 11-06) */ if(!F||!F.it)return bus; const up=sum(FACK.map(k=>{ const l=F.it[k]||0, cur=FACI[k].up[l], d=F.dn&&F.dn[k]; if(d!=null&&d>s0&&l>0){ const pv=FACI[k].up[l-1]; return pv*f+(cur-pv)*clamp((G.day-d)/365,0,1); } return cur*f; })); return Math.max(0,Math.round(up-(F.up0||0)*f))+bus+(me?0:Math.round(facCityUp(t)*f)); } /* 올해 완공한 증설분은 쓴 기간만(우리 구단처럼 일할, 검수 11-08) */ /* 올해 완공한 증설분은 쓴 기간만(우리 구단처럼 일할, 검수 11-08) */
/* 구단 이동: 떠나는 구단에 시설을 그대로 남기고, 가는 구단의 시설을 그대로 가져온다 */
function facMoveTeam(oldTid,newTid){ if(oldTid===newTid)return; const ot=team(oldTid), nt=team(newTid); facInit();
  const S=G.fac; S.dn=S.dn||{}; S.hist=S.hist||[]; if(S.up0==null)S.up0=Math.min(facUpOf(S.it),facUpOf(facAlloc(ot,2).it)); /* 예전 저장: 증설된 현재 단계가 아니라 리그 기본(2단계) 기준(검수 11-06) */ if(!S.pf)S.pf=facAlloc(ot,ot.fac||3).pf;
  ot.fi=S; ot.fac=S.lv; ot.bus=G.bus!=null?G.bus:1;
  const N=aiFacInit(nt); delete nt.fi; N.build=null; G.fac=N; G.bus=nt.bus!=null?nt.bus:1; delete nt.bus; facInit(); }
/* 완공과 투자 결정(매일). 야인일 때 전 소속 구단 시설도 그 구단(AI)이 운영한다 */
function aiFacDaily(){ if(!G||!G.teams)return; const o=dobj(G.day); const plan=(o.m===12&&o.d===1)||(o.m===6&&o.d===15);
  for(const t of G.teams){ const mine=t.id===G.user; if(mine&&!G.unemp)continue; const S=mine?facSt(t.id):aiFacInit(t); if(!S)continue;
    if(!mine)for(const k of Object.keys(S.bld)){ const b=S.bld[k]; if(G.day<b.done)continue; S.it[k]=Math.max(S.it[k]||0,b.lv); S.dn[k]=G.day; delete S.bld[k]; S.lv=facCalcLv(S.it); t.fac=S.lv;
      clubFacilityHistory('fac',t.id,FACI[k].l,'완공',b); wire('시설',`${t.city} ${FAC_NEWS[k][b.lv]} ${b.lv>=4?'개관':'완공'}`,{tid:t.id}); }
    if(plan)try{ aiFacPlan(t,S,o.m===6); }catch(e){} }
  try{ clubEconDaily(); }catch(e){} }
/* AI 시설 투자 결정. o={force,budget,reserve}: 지출 정책(57_club_econ)이 남는 돈을 쓸 때는 굴림 없이 정하고, 예산 안에서 고른다.
   우리 구단과 같은 규칙: 선행 조건·큰 공사 한 곳·인허가(facCanStart·facStartBuild), 모기업 투자는 같은 승인 식과 120일 간격(capexOddsT), 명명권·지자체 보조도 같은 조건 */
function aiFacPlan(t,S,summer,o){ o=o||{}; const nb=Object.keys(S.bld).length; if(nb>=2)return null;
  const key='fai'+facWK()+':'+t.id+':'+G.year+(summer?'s':'w')+(o.force?'f'+nb:''); const tr=gmTrait(t.id);
  const cash=spendable(t.id); /* 독립구단은 결산 때 낼 신구장 분담금을 남긴다(검수 11-09zza) */ const tight=cash<1500||(t.indie&&cash<3000), rich=!tight&&(cash>=6000||(t.market>=1.1&&cash>=4500));
  const pl=planOf(t);
  if(!o.force){ let p=tight?.15:rich?.7:.5; p+={win:.08,pr:.03,profit:-.08}[t.owner]||0; if(t.mode==='contend')p+=.04; if(tr==='miser')p*=.6; if(pl==='build')p+=.25; /* 유망주 수집 구단은 남는 돈을 육성 시설에 돌린다 */ if(pl==='tight')p*=.3; if(summer)p*=pl==='build'?.6:.3; if(nb)p*=.5;
    if(facU(key,'go')>=p){ if(t.indie||capexWait(t.id))return null; o.capOnly=true; } } /* 직접 지을 생각이 없어도 모기업 투자 요청은 해 본다(사람 단장처럼, 같은 승인 식·120일 간격) */
  const maps=[]; if(rich)maps.push({lab:2.2,rehab:1.8}); if(tight)maps.push({weight:1.8,rehab:1.3});
  maps.push(pl==='build'?{fut:2.6,dorm:2.4,indoor:1.6}:pl==='tight'?{weight:1.3}:pl==='win'?{rehab:2,weight:1.8,lab:1.6}:pl==='star'?{indoor:1.4,rehab:1.3}:t.mode==='rebuild'?{fut:2.2,dorm:2.2}:{rehab:1.8,weight:1.8});
  if(tr==='data')maps.push({lab:1.6}); else if(tr==='prospect')maps.push({fut:1.4,dorm:1.4}); else if(tr==='gambler')maps.push({rehab:1.3,weight:1.2});
  const reserve=o.reserve??(pl==='build'?1500:rich?2000:2500);
  const C=FACK.filter(k=>!facCanStart(t.id,k)).map(k=>{ const lv=S.it[k]||0, c=FACI[k].c[lv+1]; let w=((S.pf&&S.pf[k])||1)*(1+(2-lv)*.25); for(const M of maps)w*=M[k]||1;
      if(tight&&c>1500)w=0; if(o.budget!=null&&c>o.budget*1.6)w*=.15; return {k,lv,c,w}; }).filter(x=>x.w>0);
  if(!C.length)return null;
  /* 먼저 하고 싶은 공사를 고르고, 돈은 그다음에 본다: 모기업 요청 → 명명권·지자체 → 적립금, 안 되면 작은 공사로 바꾸거나 접는다 */
  let r=facU(key,'pick')*sum(C.map(x=>x.w)), x=C[C.length-1]; for(const y of C){ r-=y.w; if(r<=0){ x=y; break; } }
  const go=(x)=>{ const I=facRouteInfo(t.id,x.k), cashOk=cash-x.c>=reserve;
    if(I.cap.ok){ t.capexD=G.day; /* 사람 단장처럼 먼저 모기업에 요청해 본다(같은 승인 식·간격) */ if(facU(key,'cap'+x.k)<I.cap.p){ t.capexY=sponSeason(); t.capN=(t.capN||0)+1; return 'cap'; } t.trust=clamp((t.trust??55)-1,0,100); if(typeof aiPushTry==='function'&&aiPushTry(t,{k:'cap',amt:x.c})){ t.capexY=sponSeason(); t.capN=(t.capN||0)+1; return 'cap'; } } /* 반려되면 다시 설득(94_owner_push) */
    if(o.capOnly)return null;
    for(const rt of ['spon','city'])if(I[rt].ok&&cash-x.c*(1-(rt==='spon'?FAC_SPON.share:FAC_CITY.share))>=reserve&&(x.c>=2000||!cashOk)){ (t.facAsk=t.facAsk||{})[rt]=G.day; if(facU(key,rt+x.k)<I[rt].p)return rt; }
    return cashOk?'cash':null; };
  let src=go(x);
  if(!src&&o.capOnly)return null;
  if(!src){ const sm=C.filter(y=>y!==x&&cash-y.c>=reserve).sort((a,b)=>a.c-b.c)[0]; if(!sm||(!o.force&&facU(key,'fb')>=.5))return null; x=sm; src='cash'; } /* 큰 공사가 막히면 절반은 적립금으로 되는 작은 공사로 바꾼다 */
  if(src==='spon'||src==='city'){ facFundGo(t.id,x.k,src,x.c); t.facN=(t.facN||0)+1; return x.k; }
  if(src==='cash')t.cash-=x.c;
  const b=facStartBuild(t.id,x.k,{src}); if(src==='cap')b.cap=true;
  S.inv=(S.inv||0)+x.c; (S.hist=S.hist||[]).push({y:G.year,d:G.day,k:x.k,lv:x.lv+1,c:x.c,src}); if(S.hist.length>40)S.hist.shift(); t.facN=(t.facN||0)+1;
  clubFacilityHistory('fac',t.id,FACI[x.k].l,'착공',{...b,src:facSrcTxt(src)}); facStartNews(t.id,x.k,b);
  return x.k; }

/* 유지·보수를 못 해 시설이 낡는다: 가장 높은 시설 하나가 한 단계 내려간다(공사 중인 시설은 제외) */
function facNeglect(t){ const mine=t.id===G.user; const it=mine?(G.fac&&G.fac.it):(t.fi&&t.fi.it); if(!it)return; const bld=mine?(G.fac.bld||{}):(t.fi.bld||{});
  const k=FACK.filter(k=>(it[k]||0)>=2&&!bld[k]).sort((a,b)=>it[b]-it[a])[0]; if(!k)return; it[k]--; 
  if(mine){ try{ facRecalc(); }catch(e){} mail('운영팀',`${FACI[k].l} 시설이 낡았습니다`,`구단 빚이 커 유지·보수를 미뤘습니다. ${FACI[k].l}이(가) ${FACI[k].lv[it[k]]} 수준으로 내려갔습니다. 다시 공사하면 회복됩니다.`,{kind:'시설'}); }
  else { t.fi.lv=facCalcLv(it); t.fac=t.fi.lv; wire('구단',`${t.city} ${t.nick}, 재정난에 ${FACI[k].l} 관리 소홀`,{tid:t.id}); } }

/* ===== 시설 연식(커뮤니티 건의 11-11: 한 번 올린 시설이 영원히 유지되면 구단 사이 격차가 굳는다) =====
   항목마다 마지막으로 짓거나 고친 해를 기억한다. 10년이 넘으면 해마다 30% 확률로 한 단계 낡는다(2단계 아래로는 내려가지 않음).
   우리 구단은 9년째에 미리 알리고, 보수 공사(지금 단계 공사비의 25%)로 연식을 새로 시작할 수 있다. AI 구단은 현금이 넉넉하면 스스로 보수한다 */
const FAC_AGE={warn:9,old:10,p:.3,fix:.25};
function facAgeStore(t){ const mine=t.id===G.user; const it=mine?(G.fac&&G.fac.it):(t.fi&&t.fi.it); if(!it)return null; const box=mine?G.fac:t.fi; const A=box.age=box.age||{};
  for(const k of FACK){ const lv=it[k]||0; if(!A[k])A[k]={lv,y:G.year-ri(0,6)}; else if(A[k].lv!==lv)A[k]={lv,y:G.year}; } return {it,A,bld:box.bld||{},mine}; }
function facAgeOf(tid,k){ const t=team(tid); const S=t&&facAgeStore(t); return S?G.year-S.A[k].y:0; }
function facRefurbCost(k){ const lv=(G.fac&&G.fac.it&&G.fac.it[k])||0; return Math.round(FACI[k].c[Math.min(lv,FACI[k].c.length-1)]*FAC_AGE.fix*ecoIdx()/10)*10; }
function facRefurb(k){ if(G.unemp)return '맡은 구단이 없습니다.'; const S=facAgeStore(team(G.user)); if(!S||!FACI[k])return '없는 시설입니다.'; if((S.it[k]||0)<2)return '보수할 시설이 없습니다.'; if(S.bld[k])return '공사 중입니다.';
  const c=facRefurbCost(k); if(spendable(G.user)<c)return `자금이 부족합니다(${spendTxt()}). 보수비 ${money(c)}이 필요합니다.`; const k0=spendPay(c); G.spend.fac=(G.spend.fac||0)+k0; S.A[k].y=G.year; addLog(`${FACI[k].l} 보수 공사(${money(c)}). 연식을 새로 셉니다.`); return ''; }
function facAgeYear(){ for(const t of G.teams){ const S=facAgeStore(t); if(!S)continue;
  for(const k of FACK){ const lv=S.it[k]||0; if(lv<3||S.bld[k])continue; const age=G.year-S.A[k].y;
    if(!S.mine&&age>=FAC_AGE.warn&&(t.cash||0)>Math.max(3000,FACI[k].c[Math.min(lv,FACI[k].c.length-1)]*FAC_AGE.fix*2)){ t.cash-=Math.round(FACI[k].c[Math.min(lv,FACI[k].c.length-1)]*FAC_AGE.fix); S.A[k].y=G.year; continue; } /* 여유 있는 AI 구단은 보수 */
    if(S.mine&&age===FAC_AGE.warn&&!G.unemp)mail('운영팀',`${FACI[k].l} 시설이 오래됐습니다`,`${FACI[k].l}을(를) 짓거나 고친 지 ${age}년입니다. 10년이 넘으면 해마다 낡아 한 단계씩 내려갈 수 있습니다. 시설 화면에서 보수 공사(${money(facRefurbCost(k))})를 하면 연식을 새로 셉니다.`,{kind:'시설',acts:[{l:'시설 화면',a:'cpFacGo',v:k}]});
    if(age>=FAC_AGE.old&&R()<FAC_AGE.p){ S.it[k]=lv-1; S.A[k]={lv:lv-1,y:G.year-5}; if(S.mine){ try{ facRecalc(); }catch(e){} if(!G.unemp)mail('운영팀',`${FACI[k].l} 시설이 낡아 한 단계 내려갔습니다`,`${FACI[k].l}이(가) ${FACI[k].lv[Math.min(lv-1,FACI[k].lv.length-1)]||''} 수준으로 내려갔습니다. 다시 공사하면 회복됩니다.`,{kind:'시설'}); } else { try{ t.fi.lv=facCalcLv(S.it); t.fac=t.fi.lv; }catch(e){} } } } } }
