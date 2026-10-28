/* ===== 투수 부하와 감독의 투수 운용 =====
   감독의 '투수 혹사' 성향에 성적 압박(성적 우선 기조, 시즌 막판 순위 싸움, 가을야구)을 더해 실제로 얼마나 밀어붙이는지 정한다.
   많이 밀어붙이는 감독은 불펜 3연투·4연투, 멀티이닝, 선발을 일찍 내리고 필승조를 계속 붙이는 운용을 한다.
   투수마다 최근 등판 기록(연투)과 누적 팔 부하를 쌓고, 둘 다 부상 위험과 팔꿈치·어깨 부상 비중을 키운다 */
function mgrPush(tid){ if(tid==null)return 50; const m=mgrOf(tid); if(!m||m.interim)return 50;
  const c=G._push&&G._push.d===G.day?G._push:(G._push={d:G.day,v:{}}); if(c.v[tid]!=null)return c.v[tid];
  let v=mgrArmEff(m); try{ v+=-teamLean(tid)*10; }catch(e){}
  if(period()==='season'&&G.day>=KD(8,15)){ try{ const S=standingsNow(); const pct=x=>x.w/Math.max(1,x.w+x.l); const i=S.findIndex(x=>x.tid===tid); const cut=S[4]; if(i>=0&&cut){ const gb=((cut.w-S[i].w)+(S[i].l-cut.l))/2; if(Math.abs(gb)<=3||i<=1)v+=8; void pct; } }catch(e){} }
  if(G.ps&&period()==='post')v+=15;
  return c.v[tid]=clamp(Math.round(v),15,100); }
function pushText(v){ return v>=72?"필승조를 매일 붙이고 3·4연투도 시키는 강행군":v>=55?"접전이면 3연투·멀티이닝도 시키는 편":v>=40?"연투는 이틀까지가 원칙":"연투를 피하고 투구 수를 엄격히 관리"; }
/* 어제까지 며칠 연속 던졌나 */
function consecDays(p,day){ const L=p.ld||[]; let n=0, d=day-1; for(let i=L.length-1;i>=0;i--){ if(L[i][0]===day)continue; if(L[i][0]===d){ n++; d--; } else if(L[i][0]<d)break; } return n; }
function pc7(p,day){ return sum((p.ld||[]).filter(x=>x[0]>=day-7&&x[0]<day).map(x=>x[1])); }
/* 누적 팔 부하 한도: 선발은 5일 로테이션 100구, 불펜은 이틀에 한 번 20구를 꾸준히 던질 때 한도에 닿는다 */
function armCap(p){ const s=p.r.sta||50; return isSPr(p)?1150+(s-50)*12:540+(s-50)*6; }
function armRatio(p){ return (p.armw||0)/armCap(p); }
/* 등판 기록: applyGame에서 투수마다 호출 */
function loadLog(p,day,pc,isStart){ const cd=consecDays(p,day); const L=p.ld=p.ld||[]; L.push([day,pc]); if(L.length>10)L.shift();
  const prevS=p.lsS; let add=pc*(cd>=2?1.8:cd>=1?1.3:1);
  if(isStart){ if(pc>105)add+=(pc-105)*3; if(prevS!=null&&day-prevS<5)add+=pc*.4; p.lsS=day; }
  if(!isStart&&pc>=35)add+=(pc-35)*1.5; /* 불펜 멀티이닝 */
  p.armw=(p.armw||0)+add;
  if(cd>=2&&p.team===G.user&&period()==='season'){ const m=G.mgr[G.user]; note('부하',`${p.name}이(가) ${cd+1}일 연속 등판했습니다(최근 7일 ${pc7(p,day+1)}구).${m&&!m.interim?` ${m.name} 감독의 투수 운용: ${pushText(mgrPush(G.user))}.`:''}`,p.id); }
  return cd; }
/* 부상 위험 배수: 연투(급성)와 누적 부하(만성) */
function loadMult(p,cd,day){ const sp=isSPr(p); const w7=pc7(p,day);
  const a=1+(cd>=2?1:0)+(cd>=3?1.5:0)+(sp?0:Math.max(0,w7-50)/40); /* 급성: 연투, 최근 7일 투구 수 */
  const c=1+Math.max(0,armRatio(p)-.75)*4; /* 만성: 누적 팔 부하 */ return a*c; }
const LOAD_NORM=1.27;
function loadDaily(){ for(const p of Object.values(G.players)){ if(p.armw){ p.armw*=.985; if(p.armw<5)delete p.armw; } } }
function loadText(p){ if(!p.isP)return ''; const day=G.day+1; const cd=consecDays(p,day); const r=armRatio(p);
  return `최근 7일 ${pc7(p,day)}구${cd?` · ${cd}일 연속 등판`:''} · 팔 부하 ${Math.round(r*100)}%${r>=1.3?' (위험)':r>=1.1?' (높음)':''}`; }
/* 매주 월요일: 우리 팀 부하 보고 */
function loadWeekly(){ if(period()!=='season')return; const hi=playersOf(G.user).filter(p=>p.isP&&armRatio(p)>=1.1).sort((a,b)=>armRatio(b)-armRatio(a)); if(!hi.length)return;
  const m=G.mgr[G.user]; mail('의무팀',`투수 부하 주의 ${hi.length}명`,`누적 팔 부하가 한도를 넘은 투수입니다. 부하가 높을수록 팔꿈치·어깨 부상 위험이 커집니다.\n\n${hi.slice(0,6).map(p=>`${p.name}(${posLabel(p)}): ${loadText(p)}`).join('\n')}${m&&!m.interim?`\n\n${m.name} 감독의 투수 운용: ${pushText(mgrPush(G.user))}. 감독에게 '투수 관리(혹사 금지)'를 지시하면 줄일 수 있습니다.`:''}`,{kind:'의무',acts:[{l:'감독 지시',a:'goWork',v:'감독'}]}); }
/* ===== 메디컬 체크 =====
   다른 구단 선수의 부상 체질은 우리 의무팀이 검진해야 알 수 있다. 제휴 병원 등급이 높을수록 정확하다.
   우리 선수는 매일 보기 때문에 정확히 안다. AI 구단은 자기 의무팀이 있어서 트레이드 때 실제 체질을 반영한다 */
const MED_SD={none:.07,c:.05,b:.035,a:0};
function medInj(p){ if(p.team===G.user)return p.inj; const sd=MED_SD[G.med&&G.med.hosp]??.07; return clamp(p.inj+hn('med'+G.year,p.id)*sd,.02,.45); }
function durGrade(v){ return v<.08?['강철 몸','good']:v<.12?['튼튼함','good']:v<.18?['보통','']:v<.26?['잔부상 주의','warn']:['부상 병동','bad']; }
function injDays2(p){ return sum((p.injHist||[]).filter(h=>h.y>=G.year-1).map(h=>h.days)); }
function medReport(p){ const v=medInj(p); const [g,c]=durGrade(v); const L=[];
  const H=(p.injHist||[]).filter(h=>h.y>=G.year-2); if(H.length)L.push(`최근 부상: ${H.slice(-4).map(h=>`${h.y}년 ${h.k?injName(h.k):'부상'} ${h.days}일`).join(', ')}`);
  if(p.injOut>0)L.push(`현재 ${injNow(p)}, 복귀까지 약 ${p.injOut}일`);
  for(const f of injFxText(p))L.push(`${f.n}: ${f.t}`);
  if(p.ucl)L.push('팔꿈치 인대 손상 이력: 수술로 이어질 위험이 있습니다');
  if(p.isP&&armRatio(p)>=1.1)L.push(`팔 부하가 높습니다(${Math.round(armRatio(p)*100)}%). 전 소속팀에서 많이 던졌습니다`);
  const sure=p.team===G.user||G.med.hosp==='a'; return {g,c,v,L,sure,note:sure?'':'제휴 병원 등급이 낮아 검진 정확도가 떨어집니다'}; }
/* 트레이드 가치에 반영할 몸 상태 계수(AI 의무팀은 실제 체질을 안다) */
function medTradeF(p){ let f=1-clamp((p.inj-.14)*1.3,-.05,.3); f*=1-Math.min(.2,injDays2(p)/600); if(injFxNow(p).length)f*=.92; if(p.ucl)f*=.92; if(p.isP&&armRatio(p)>=1.1)f*=.95; return f; }
function medRisky(p){ return medTradeF(p)<.82; }
