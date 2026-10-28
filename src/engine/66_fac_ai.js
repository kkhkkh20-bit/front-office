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
function facAiInj(tid){ return tid==null?1:1-(facLvK(tid,'weight')-2)*.05; }
function facAiRec(tid){ return tid==null?1:1-(facLvK(tid,'rehab')-2)*.07; }
function facAiFat(tid){ return tid==null?1:1+(facLvK(tid,'rehab')-2)*.06; }
function facAiFut(tid){ return tid==null?0:(facLvK(tid,'fut')-2)*.05; }
/* 증설분 유지비: 시작 때보다 늘어난 유지비만 결산에 붙인다(기본 시설 유지비는 구단 운영비에 들어 있다) */
function aiFacUpExtra(t){ if(!t.fi||!t.fi.it)return 0; return Math.max(0,facUpOf(t.fi.it)-(t.fi.up0||0)); }
/* 구단 이동: 떠나는 구단에 시설을 그대로 남기고, 가는 구단의 시설을 그대로 가져온다 */
function facMoveTeam(oldTid,newTid){ if(oldTid===newTid)return; const ot=team(oldTid), nt=team(newTid); facInit();
  const S=G.fac; S.dn=S.dn||{}; S.hist=S.hist||[]; if(S.up0==null)S.up0=facUpOf(facAlloc(ot,ot.fac||3).it); if(!S.pf)S.pf=facAlloc(ot,ot.fac||3).pf;
  ot.fi=S; ot.fac=S.lv; ot.bus=G.bus!=null?G.bus:1;
  const N=aiFacInit(nt); delete nt.fi; N.build=null; G.fac=N; G.bus=nt.bus!=null?nt.bus:1; delete nt.bus; facInit(); }
/* 완공과 투자 결정(매일). 야인일 때 전 소속 구단 시설도 그 구단(AI)이 운영한다 */
function aiFacDaily(){ if(!G||!G.teams)return; const o=dobj(G.day); const plan=(o.m===12&&o.d===1)||(o.m===6&&o.d===15);
  for(const t of G.teams){ const mine=t.id===G.user; if(mine&&!G.unemp)continue; const S=mine?facSt(t.id):aiFacInit(t); if(!S)continue;
    if(!mine)for(const k of Object.keys(S.bld)){ const b=S.bld[k]; if(G.day<b.done)continue; S.it[k]=Math.max(S.it[k]||0,b.lv); S.dn[k]=G.day; delete S.bld[k]; S.lv=facCalcLv(S.it); t.fac=S.lv;
      wire('시설',`${t.city} ${FAC_NEWS[k][b.lv]} 완공`,{tid:t.id}); }
    if(plan)try{ aiFacPlan(t,S,o.m===6); }catch(e){} } }
function aiFacPlan(t,S,summer){ const nb=Object.keys(S.bld).length; if(nb>=2)return null;
  const key='fai'+facWK()+':'+t.id+':'+G.year+(summer?'s':'w'); const tr=gmTrait(t.id);
  const tight=t.cash<1500||(t.indie&&t.cash<3000), rich=!tight&&(t.cash>=6000||(t.market>=1.1&&t.cash>=4500));
  let p=tight?.15:rich?.7:.5; p+={win:.08,pr:.03,profit:-.08}[t.owner]||0; if(t.mode==='contend')p+=.04; if(tr==='miser')p*=.6; if(summer)p*=.3; if(nb)p*=.5;
  if(facU(key,'go')>=p)return null;
  const maps=[]; if(rich)maps.push({lab:2.2,rehab:1.8}); if(tight)maps.push({weight:1.8,rehab:1.3});
  maps.push(t.mode==='rebuild'?{fut:2.2,dorm:2.2}:{rehab:1.8,weight:1.8});
  if(tr==='data')maps.push({lab:1.6}); else if(tr==='prospect')maps.push({fut:1.4,dorm:1.4}); else if(tr==='gambler')maps.push({rehab:1.3,weight:1.2});
  const reserve=rich?2000:2500; const capP=t.indie?0:clamp(.28+({win:.15,pr:.1,profit:-.05}[t.owner]||0)+((t.trust??55)-50)/100,.05,.65);
  const C=FACK.filter(k=>(S.it[k]||0)<3&&!S.bld[k]).map(k=>{ const lv=S.it[k]||0, c=FACI[k].c[lv+1]; let w=((S.pf&&S.pf[k])||1)*(1+(2-lv)*.25); for(const M of maps)w*=M[k]||1;
      if(tight&&c>1500)w=0; return {k,lv,c,w}; }).filter(x=>x.w>0);
  if(!C.length)return null;
  /* 먼저 하고 싶은 공사를 고르고, 돈은 그다음에 본다: 적립금으로 되면 바로, 크면 모기업에 한 번 요청, 안 되면 작은 공사로 바꾸거나 올해는 접는다 */
  let r=facU(key,'pick')*sum(C.map(x=>x.w)), x=C[C.length-1]; for(const y of C){ r-=y.w; if(r<=0){ x=y; break; } }
  const cashOk=t.cash-x.c>=reserve, capOk=facU(key,'cap')<capP-x.c/30000;
  let src=capOk&&(x.c>=2500||!cashOk)?'cap':cashOk?'cash':null;
  if(!src){ const sm=C.filter(y=>t.cash-y.c>=reserve).sort((a,b)=>a.c-b.c)[0]; if(!sm||facU(key,'fb')>=.5)return null; x=sm; src='cash'; } /* 큰 공사가 막히면 절반은 적립금으로 되는 작은 공사로 바꾼다 */
  if(src==='cash')t.cash-=x.c;
  S.bld[x.k]={lv:x.lv+1,done:G.day+FACI[x.k].days[x.lv+1],c:x.c}; if(src==='cap')S.bld[x.k].cap=true;
  S.inv=(S.inv||0)+x.c; (S.hist=S.hist||[]).push({y:G.year,d:G.day,k:x.k,lv:x.lv+1,c:x.c,src}); if(S.hist.length>40)S.hist.shift();
  if(x.c>=4000)wire('시설',`${t.city} ${t.nick}, ${FAC_NEWS[x.k][x.lv+1]} 착공(${money(x.c)}${src==='cap'?', 모기업 투자':''})`,{tid:t.id});
  return x.k; }
