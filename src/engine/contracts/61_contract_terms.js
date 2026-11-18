/* ---------- 계약 조건 묶음(협상 테이블): 역할 약속 · 기간 · 계약금 · 연봉 · 옵션 · 트레이드 거부권 ----------
   선수와 에이전트는 묶음 전체를 '환산 연봉'으로 비교한다. 계약금은 한 번에 받는 보장액이라 조금 더 쳐 주고(×1.06),
   옵션은 못 받을 수도 있어 절반 아래로 본다(×0.45). 역할 약속을 요구보다 낮추면 크게 깎고, 거부권을 빼면 조금 깎는다.
   실제 KBO FA 계약도 '4년 총액 = 계약금 + 연봉 + 옵션'으로 발표하고, 경쟁균형세 계산에는 계약금을 연평균으로 나눠 넣는다 */
const CT_BON=1.06, CT_OPT=.45;
const ROLE_L={B:['주전 보장','주전 경쟁','백업'],SP:['선발 로테이션 보장','선발 경쟁','불펜'],RP:['필승조 보장','불펜 경쟁','추격조']};
function roleSet(p){ return p.isP?(isSPr(p)?ROLE_L.SP:ROLE_L.RP):ROLE_L.B; }
/* 옵션 가치: 종류별(출전 0.45 · 성적 0.3 · 수상 0.15~0.25) × 에이전트 성향(d.ov, 강경형이 가장 낮게 본다) */
function optV(t,d){ const c=OPT_CRIT[t.optC]; return (c?c[4]:CT_OPT)*(d&&d.ov!=null?d.ov:1); }
function termsEq(t,d){ const y=Math.max(1,t.years||1); return (t.annual||0)+(t.bonus||0)*CT_BON/y+(t.opt||0)*optV(t,d); }
function termsMul(t,d){ let m=1; if(t.role!=null&&d&&d.role!=null){ const g=t.role-d.role; m*=g>0?1-.07*g:1-.02*g; }
  if(d&&d.ntc&&!t.ntc)m*=.95; else if(t.ntc&&!(d&&d.ntc))m*=1.01;
  m*=1+pmVal(t,d); /* 구두 약속(약속 탭, 계약 2단계): 선수가 쳐 주는 만큼 조건 가치가 오른다 */
  if(t.cOpt)m*=1-.035*t.cOpt; if(t.pOut)m*=1+.012*Math.max(1,(t.years||1)-t.pOut)+.02; /* 구단 연장 옵션은 선수에게 불리(해마다 3.5%), 선수 옵트아웃은 유리(일찍 나갈 수 있을수록) — 사용자 커뮤니티 제안 2026-11-02 */
  return m; }
function termsVal(t,d){ return termsEq(t,d)*termsMul(t,d); }
/* 요구 묶음: 환산 연봉 요구액(base)을 계약금·연봉으로 나눈다. 대형 FA일수록 계약금 비중이 크다(KBO 관행) */
function termsDemand(p,kind,base){ const y=Math.max(1,base.years||1); const o=ovr(p);
  const bs=kind==='fa'?(p.faGrade==='A'?.42:p.faGrade==='B'?.32:.15)*(p.age>=34?.6:p.age>=32?.8:1):0; /* 비FA 다년계약·연봉 협상은 계약금 없음(KBO 규약 제81조, 실제화 11-17) */
  const bonus=bs>0?round5(base.annual*y*bs):0; const annual=Math.max(MIN_SAL,Math.ceil((base.annual-bonus*CT_BON/y)/5)*5);
  const role=kind==='fa'?(o>=58?0:o>=50?1:2):null; const ntc=kind!=='sal'&&o>=64&&p.age>=29&&hasAgent(p)&&(agentOf(p).size==='big'||agentOf(p).style==='hard');
  const ag=hasAgent(p)?agentOf(p):null; return {years:y,bonus,annual,opt:0,role,ntc,ov:agOptV(ag),...(kind!=='sal'?{pv:pmVals(p,kind)}:{})}; }
/* FA 실제 요구(환산 연봉): 에이전트 성향·경쟁 구단 수·원소속 할인을 반영한 금액. 이만큼이면 '요구 충족'(다른 구단과의 비교는 별도) */
function faWantA(p){ const ag=agNeg(p); const ai=Object.entries((G.fa&&G.fa.ai&&G.fa.ai[p.id])||{}).filter(([tid,o])=>o&&faAiOk(+tid,p,o)).length; return Math.ceil(p.ask.annual*agWantMul(ag)*(1+.03*ai)*(p.faFrom===G.user?.95:1)*.97/5)*5; }
/* 묶음을 '같은 가치'로 맞추며 연봉만 조정한다(역제안을 우리 묶음 모양 그대로 돌려줄 때) */
/* 역제안 묶음: 우리 묶음 모양을 유지하고, 잠그지 않은 항목으로만 '같은 가치(val)'까지 채운다(계약 1단계 조건 잠금).
   lock: 잠근 항목 이름 배열(annual·bonus·years·opt·role·ntc·cOpt·pOut). pref: 에이전트 선호(tot·bonus·years).
   순서: 선호 금액 항목 → 다른 금액 항목. 둘 다 잠겼으면 조항(구단 옵션 빼기·요구한 역할·거부권)으로 메우고, 그래도 모자라면 null(역제안 불가).
   금액은 5만 원 단위로 올림해 val 아래로 내려가지 않게 한다(보여 준 역제안을 그대로 내면 반드시 받는다) */
function termsFit(t,d,val,years,lock,pref){ const L=new Set(lock||[]); const y=L.has('years')?(t.years||1):(years||t.years); const T={...t,years:y};
  const gap=()=>val-termsVal(T,d); if(gap()<=0)return T;
  if(L.has('annual')&&L.has('bonus')){ if(!L.has('cOpt')&&T.cOpt){ T.cOpt=0; if(gap()<=0)return T; } if(d&&!L.has('role')&&d.role!=null&&T.role!=null&&T.role>d.role){ T.role=d.role; if(gap()<=0)return T; } if(d&&d.ntc&&!T.ntc&&!L.has('ntc')){ T.ntc=true; if(gap()<=0)return T; } return null; }
  const ord=pref==='bonus'?['bonus','annual']:['annual','bonus']; const f=ord.find(k=>!L.has(k));
  const need=val/termsMul(T,d)-termsEq(T,d); if(need<=0)return T;
  if(f==='annual')T.annual=Math.max(MIN_SAL,Math.ceil(((T.annual||0)+need)/5)*5); else T.bonus=Math.ceil(((T.bonus||0)+need*y/CT_BON)/5)*5;
  while(gap()>0){ if(f==='annual')T.annual+=5; else T.bonus+=5; } return T; }
/* 두 묶음이 같은 조건인지(역제안을 그대로 다시 낸 경우) */
function termsSame(a,b){ if(!a||!b)return false; for(const k of ['years','bonus','annual','opt','cOpt','pOut'])if((a[k]||0)!==(b[k]||0))return false; return (a.optC||'')===(b.optC||'')&&(a.role??null)===(b.role??null)&&!!a.ntc===!!b.ntc&&pmKey(a)===pmKey(b); }
function termsTxt(t,short){ const L=[`${t.years}년${t.cOpt?`+구단 옵션 ${t.cOpt}년`:''}`]; if(t.bonus)L.push(`계약금 ${money(t.bonus)}`); L.push(`연봉 ${money(t.annual)}`); if(t.opt)L.push(`옵션 연 ${money(t.opt)}`); if(t.pOut)L.push(`${t.pOut}년 뒤 선수 옵트아웃`); { const pt=pmTxt(t); if(pt)L.push(`약속: ${pt}`); }
  if(!short){ const tot=(t.bonus||0)+t.annual*t.years; L.push(`보장 총액 ${money(tot)}${t.opt?` (옵션 포함 최대 ${money(tot+t.opt*t.years)})`:''}`); } return L.join(' · '); }
/* 계약 반영: 계약금은 바로 지급(올해 지출), 상한 계산에는 연평균으로 들어간다. 옵션은 시즌 뒤 달성하면 지급 */
/* 조건은 계약한 구단에서만 유효하다(p.ctT): 방출·트레이드·보상선수로 옮기면 상한 반영·옵션·거부권·약속이 모두 끝난다 */
/* 확정 잔여 보장액: 지금 계약의 남은 해(다년·FA 계약) + 이미 합의한 다음 시즌 시작 계약(extNext). 해마다 협상하는 연봉은 넣지 않는다 */
function guarLeft(p){ if(!p||p.foreign)return 0; return (p.faC?p.sal*Math.max(1,p.yrs||1):0)+(p.extNext?p.extNext.annual*p.extNext.years:0); }
/* 이적하면 없어지는 계약 조건(화면 안내용) */
function termsLostTxt(p){ if(!p)return ''; const L=[]; if(ctOn(p)){ if(p.capB)L.push(`계약금 상한 반영(연 ${money(p.capB.a)})`); if(p.opt)L.push(`성과 옵션(연 최대 ${money(p.opt.a)})`); if(p.ntc)L.push('트레이드 거부권'); if(p.roleProm)L.push('역할 약속'); if(p.cOpt&&!p.cOpt.used)L.push(`구단 연장 옵션 ${p.cOpt.y}년`); if(p.pOut&&!p.pOut.used)L.push('선수 옵트아웃'); }
  { const X=p.extNext&&p.extNext.terms, N=[]; if(X){ if(X.bonus>0)N.push(`계약금 상한 반영(연 ${money(Math.round(X.bonus/Math.max(1,X.years||1)))})`); if(X.opt>0)N.push(`성과 옵션(연 최대 ${money(X.opt)})`); if(X.ntc)N.push('트레이드 거부권'); if(X.role===0)N.push('역할 약속'); if(X.cOpt>0)N.push(`구단 연장 옵션 ${X.cOpt}년`); if(X.pOut>0)N.push('선수 옵트아웃'); } if(N.length)L.push(`다음 시즌 계약의 ${N.join('·')}`); } /* 트레이드하면 미리 맺은 다음 시즌 계약의 구단 한정 조항도 끝난다(mvLog, 검수 11-09zzb) */
  return L.join(' · '); }
/* 계약의 현금 지급 연도: 계약금은 합의할 때 바로 나가 지금 결산 연도(sponSeason)에 잡히고, 연봉은 계약 적용 시즌마다. '계약 적용 시즌'과 '돈이 나가는 해'를 나눈다 */
function ctCashYears(T,s0){ const py=sponSeason(), yrs=Math.max(1,T.years||1), s1=s0+yrs-1; const out=[]; for(let y=Math.min(py,s0);y<=s1;y++){ const sal=y>=s0?(T.annual||0):0, bon=y===py?(T.bonus||0):0; if(sal||bon)out.push({y,sal,bon,v:sal+bon}); } return out; }
/* 트레이드로 옮길 때: 이미 달성한 성과 옵션은 원소속 구단이 지급하고 조항을 정리한다(방출 경로와 같게, 검수 11-06) */
/* 시즌 중 방출·트레이드로 미리 준 옵션: 구단별로 모아 결산 '계약 옵션 지급'에 넣는다(우리 구단은 방출 정산금, AI는 명세 없이 현금에서 빠지던 것, 검수 11-09zzb) */
function optPaid(tid,a){ const L=G.sea.optPd=G.sea.optPd||{}; L[tid]=(L[tid]||0)+a; }
/* 최근 트레이드로 옮긴 선수(30일): 같은 선수를 곧바로 다시 트레이드하지 않는다(플레이테스트 4 #19·#25) */
function recentTr(p,d){ return !!p&&p.trD!=null&&G.day-p.trD<(d||30); }
function tradeTerms(p){ if(p){ moveSalary(p,p.team); p.trD=G.day; } try{ if(p&&p.team!=null&&!p.foreign&&optEarned(p)&&p.opt.paidY!==G.year){ optPaid(p.team,p.opt.a); p.opt.paidY=G.year; if(p.team===G.user)addLog(`${p.name}이(가) 이미 달성한 성과 옵션 ${money(p.opt.a)}을(를) 트레이드와 함께 지급합니다.`); } }catch(e){} try{ capDeadBonus(p); }catch(e){} termsClear(p); } /* 계약금 반영액은 낸 구단 상한에 남긴다 */
/* 끝나지 않은 수상 옵션 장부(리뷰② 11-17): 정규시즌 뒤 시상식 전에 계약이 바뀌거나(재계약·다년 시작·트레이드·방출) FA가 되면 p.opt가 지워져
   12월 골든글러브 옵션이 사라졌다. 지우기 전에 {pid,y 시즌,tid 계약 구단,a 금액,paid}를 G.optLed에 남기고 시상식에서 그 시즌 수상이면 원래 구단이 한 번만 낸다. 사용자·AI 같은 규칙 */
function optLedKeep(p){ try{ const o=p&&p.opt, y=G.year; if(!o||(o.c)!=='gg'||!(o.a>0)||o.from>y||o.until<y||o.paidY===y||p.ctT==null)return; if(!(G.cal&&G.day>=G.cal.end))return; /* 그 시즌을 마친 뒤만 */
  const A=G.awards&&G.awards[y]; if(A&&A.cd&&A.cd.gg!=null)return; /* 이미 시상식을 열었다 */ const L=G.optLed=G.optLed||[]; if(L.some(x=>x.pid===p.id&&x.y===y))return; L.push({pid:p.id,y,tid:p.ctT,a:o.a,paid:false}); }catch(e){} }
function optLedPay(pid,y,name){ const L=G.optLed; if(!L)return false; let n=false; for(const x of L){ if(x.pid!==pid||x.y!==y||x.paid)continue; const t=team(x.tid); if(!t)continue; x.paid=true; n=true; t.optDue=(t.optDue||0)+x.a; const p=G.players[pid]; if(p)story(p,`계약 옵션 달성: 골든글러브 (${money(x.a)}, ${tshort(x.tid)} 계약)`,'move'); if(x.tid===G.user&&!G.unemp)note('운영팀',`${name||(p&&p.name)||'선수'} 골든글러브 옵션 ${money(x.a)}을(를) 다음 결산에 지급합니다(지난 계약 옵션).`); } return n; }
function optLedDone(y){ if(G.optLed)G.optLed=G.optLed.filter(x=>x.y>y||(x.paid&&x.y>=y-1)); if(G.optLed&&!G.optLed.length)delete G.optLed; } /* 시상식이 끝난 시즌의 못 받은 몫은 지우고, 지급 기록은 한 해만 남긴다 */
/* 계약을 승계하는 2차 지명·복귀: 선지급 계약금과 지난 시즌 수상 옵션은 낸 구단에 남긴다. */
function termsCarry(p,to){ const keep=ctOn(p); capDeadBonus(p); optLedKeep(p);
  if(keep&&optEarned(p)&&p.opt.paidY!==G.year){ optPaid(p.team,p.opt.a); p.opt.paidY=G.year; }
  delete p.capB; delete p.roleProm; p.team=to; if(keep)p.ctT=to; else termsClear(p); }
function termsClear(p){ optLedKeep(p); delete p.milPause; delete p.milClausePause; delete p.milPauseY; delete p.ntcOk; delete p.cprom; delete p.capB; delete p.opt; delete p.ntc; delete p.roleProm; delete p.ctT; delete p.cOpt; delete p.pOut; delete p.ctB; delete p.cOptAdd; }
/* 옵트아웃을 넣을 수 있는 해: 그 시즌을 마쳤을 때 FA 자격(등록 연수)이 생기는 해부터. 비FA 다년계약에서 자격 전 옵트아웃은 FA로 나갈 수 없어 막는다.
   st: 계약 첫 시즌(지금 시즌이면 0, 다음 시즌 시작이면 1을 더한다) */
function pOutMin(p,st){ const add=st!=null&&st>G.year?1:0; return Math.max(1,faSvc(p)-(p.svc||0)-add); } /* 계약 몇 시즌을 마치면 FA 자격(등록 연차)이 되는가: 남은 연차에서 계약 시작 전에 채울 올 시즌을 뺀다(검수 11-06: 하나 더 세어 첫해 옵트아웃이 막혔다) */
const ctOn=p=>p&&p.ctT!=null&&p.ctT===p.team;
/* 옵션 판단: 선수는 시장 가치가 지금 연봉보다 15% 넘게 높고 33세 이하면 옵트아웃한다. AI 구단은 시장 가치가 옵션 연봉의 90% 이상이면 연장 옵션을 실행한다 */
function pOutDecide(p,add){ return p.age<=33&&(p.svc||0)+(add||0)>=faSvc(p)&&marketSal(projO(p,1))>=p.sal*1.15; } /* FA 자격이 있어야 나간다 */
function cOptAI(p){ return p.age<=36&&marketSal(projO(p,1))>=p.cOpt.a*.9; }
/* 정규시즌이 끝나면 우리 선수의 구단 연장 옵션을 묻는다(스토브리그 계약 정리 전에 정한다) */
function cOptAsk(){ if(G.unemp)return; for(const p of Object.values(G.players).filter(q=>q.team===G.user&&!(q.joinY>G.year))){ /* 계약 결정 대상은 '출전 가능한 선수'가 아니라 구단이 계약을 가진 선수 전부(군 복무 중 포함) */ if(!p.faC||(p.yrs||0)!==1||!ctOn(p)||!p.cOpt||p.cOpt.used||p.cOpt.dec!=null||p.extNext)continue; /* 다음 시즌 새 계약에 합의했으면 옛 옵션은 쓸 일이 없다(검수 11-09zzb) */ const v=marketSal(projO(p,1)); const rec=cOptAI(p); const fa=copFA(p); /* 본문과 버튼 안내를 같은 판정으로(검수 11-09s) */
    evNew('copt',`${p.name} 구단 연장 옵션`,`${p.name}(${posLabel(p)}, ${p.age}세)의 보장 계약이 올 시즌으로 끝납니다. 계약에 구단 연장 옵션 ${p.cOpt.y}년(연 ${money(p.cOpt.a)})이 있습니다. 운영팀이 본 시장 가치는 연 ${money(v)} 안팎입니다.${milServing(p)?` 지금 군 복무 중이며 ${dmd(p.mil.until)} 전역 예정입니다.`:''}${!fa?' FA 자격 전이라 옵션을 포기해도 FA가 아니라 보류 선수로 남아 연봉 협상을 합니다.':''}`,
      [{l:`옵션 실행: ${p.cOpt.y}년 연 ${money(p.cOpt.a)} 연장`,fx:'같은 연봉으로 계약이 늘어납니다.'},{l:'옵션 포기',fx:fa?'시즌 뒤 FA 시장으로 나갑니다(FA 재자격 기간과 상관없이).':'FA 자격 전이라 보류 선수로 남아 연봉 협상을 합니다.'}],{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id},def:rec?0:1,exp:12}); } }
/* 옵션 포기 뒤 FA가 되는가: 스토브리그와 같이 올해 등록 연차(등록일수 145일 또는 누적)까지 더해서 본다 */
function copFA(p){ let c=0; try{ c=faSvcOk(p)?1:0; }catch(e){} return (p.svc||0)+c>=faSvc(p); }
EVH.copt={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||!p.cOpt||p.team!==G.user)return ''; if(p.extNext)return `${p.name}은(는) 다음 시즌부터 새 다년계약에 합의해 옛 계약의 구단 옵션은 쓰지 않습니다.`; p.cOpt.dec=i===0; return i===0?`${p.name} 구단 옵션을 실행하기로 했습니다(스토브리그 때 반영).`:`${p.name} 구단 옵션을 포기하기로 했습니다. ${copFA(p)?'시즌 뒤 FA가 됩니다.':'FA 자격 전이라 보류 선수로 남아 연봉 협상을 합니다.'}`; } };
function termsApply(p,t,from,sy,noPay){ termsClear(p); if(!t)return; const y=Math.max(1,t.years); sy=sy??ctSeason(); const end=sy+y-1; p.ctT=p.team;
  if(t.bonus>0){ if(!noPay){ G.spend=G.spend||{}; G.spend.faB=(G.spend.faB||0)+t.bonus; } p.capB={a:Math.round(t.bonus/y),until:end,b:t.bonus,pd:noPay?-1:finYearEnd()}; } /* b: 계약금 전액, pd: 지급한 회계연도(결산일). 미리 준 계약금(다음 시즌 시작 다년계약)은 -1 */
  if(t.opt>0)p.opt={a:t.opt,from:sy,until:end,c:t.optC||optCrit(p)}; /* 다음 시즌 시작 계약은 합의 때 보직 기준(검수 11-09zzb) */ /* from: 계약 첫 시즌. 그 전 시즌 성적으로는 옵션을 주지 않는다(검수 11-09s) */ else delete p.opt; /* 달성 기준은 계약 때 보직으로 고정 */
  if(t.ntc)p.ntc=end; else delete p.ntc;
  if(t.cOpt>0)p.cOpt={y:t.cOpt,a:t.annual,at:end}; /* 구단 연장 옵션: 보장 마지막 시즌(at) 뒤 구단이 같은 연봉으로 y년 연장할지 정한다 */
  if(t.pOut>0&&t.pOut<y&&t.pOut>=pOutMin(p,sy))p.pOut={y:sy+t.pOut-1}; /* FA 자격이 생기는 해부터만 효력 */
  if(t.bonus>0)p.ctB={b:t.bonus,sy,years:y,tid:p.team}; /* 계약 총액 기록용 계약금(상한 반영 기간이 끝나도 총액에서 빠지지 않게) */ /* 선수 옵트아웃: y시즌을 마친 뒤 남은 계약을 버리고 FA로 나갈 수 있다 */
  if(t.role===0)p.roleProm={k:0,t:p.isP?(isSPr(p)?'SP':'RP'):'B',until:sy+Math.min(y,2)-1,l:roleSet(p)[0],from:from||'fa'}; else delete p.roleProm;
  pmApply(p,t,sy,y); }
/* ---------- 약속 탭(계약 2단계): 계약서 밖 구두 약속. t.pm={pt 출전량 단계(0 없음·1 보통·2 많이), ptc 기준(pa 타석·g 경기·outs 이닝), n 기준 수, sg 보강 자리('' 없음·SP·RP·C·IF·OF), po 포스팅 허락(0 없음·n년 뒤), d 합의한 날}.
   역할 약속은 예전처럼 t.role(FA는 요구 대비 배수, 비FA 다년계약은 '보장'만 고른다). 선수는 성향만큼 약속을 쳐 준다(약속 하나에 0~5%, 합계 8% 이하).
   확인은 시즌 결산 때(cpromSeason): 지키면 기분 +3·에이전트 친분 +1·기억 '약속 이행', 어기면 기분 -8(보강 -6)·불만(약속)·에이전트 친분 -3·기억 '약속 위반'.
   어긴 뒤 기분이 바닥(30 미만)이고 야망이 있으면 트레이드를 요청한다. 부상으로 빠진 기간만큼 출전 기준을 낮추고, 절반 넘게 빠졌으면 따지지 않는다. 트레이드·방출로 옮기면 약속도 끝난다(termsClear).
   포스팅 약속은 예전 포스팅 약속(p.postPromise)으로 넣어 포스팅 요청 때 지키거나 어긴다 */
const PM_PT={B:{pa:[350,480],g:[100,125]},SP:{outs:[300,450],g:[20,26]},RP:{g:[40,55],outs:[120,180]}};
const PM_PTL={pa:'타석',g:'경기',outs:'이닝'};
const PM_SG={SP:'선발 투수',RP:'불펜 투수',C:'포수',IF:'내야수',OF:'외야수'};
const PM_SG_MIN=52; /* 보강으로 치는 영입: 그 자리 1군급(능력 52 이상) */
function pmKind(p){ return p.isP?(isSPr(p)?'SP':'RP'):'B'; }
function pmPtC(p,c){ const K=PM_PT[pmKind(p)]; return K[c]?c:Object.keys(K)[0]; }
function pmPtN(p,c,lv){ const L=PM_PT[pmKind(p)][pmPtC(p,c)]; return lv>0?L[Math.min(lv,2)-1]:0; }
function pmPtTxt(c,n){ return c==='outs'?`${Math.round(n/3)}이닝`:`${n}${PM_PTL[c]||''}`; }
function pmGrp(q){ if(q.isP)return isSPr(q)?'SP':'RP'; const ps=q.pos; return ps==='C'?'C':['1B','2B','3B','SS'].includes(ps)?'IF':['LF','CF','RF'].includes(ps)?'OF':'DH'; }
function pmKey(t){ const P=t&&t.pm||{}; return `${P.pt||0}|${P.pt?P.ptc||'':''}|${P.sg||''}|${P.po||0}`; }
/* 선수가 약속을 얼마나 쳐 주나(요구 대비 비율). 출전량은 주전이 아니거나 야망 큰 선수가, 보강은 야망 큰 선수가, 포스팅은 해외 진출 의지가 큰 선수가 크게 본다. 난수를 쓰지 않는다 */
function pmVals(p,kind){ initPers(p); const a=p.pers.amb; let reg=false; try{ reg=isRegular(p); }catch(e){}
  const k=(reg?.6:1.2)*(a>=13?1.25:1); let po=0; if(kind==='ext'&&p.mlb!=null){ try{ const w=p.mlb+postPull(p); po=w>=52?.05:w>=44?.02:.004; }catch(e){} }
  const r3=v=>Math.round(v*1000)/1000; return {pt:[r3(.015*k),r3(.03*k)],sg:r3(clamp(.01+(a-10)*.002,.004,.025)),po,rl:kind==='ext'?.02:0}; }
function pmVal(t,d){ const P=t&&t.pm, V=d&&d.pv; if(!V)return 0; let v=0; if(P){ if(P.pt>0)v+=V.pt[Math.min(P.pt,2)-1]||0; if(P.sg&&PM_SG[P.sg])v+=V.sg; if(P.po>0)v+=V.po*(P.po<=2?1:P.po===3?.75:.5); } if(t.role===0&&d.role==null)v+=V.rl||0; return Math.min(.08,v); }
function pmCount(t){ const P=t&&t.pm||{}; return (P.pt>0?1:0)+(P.sg?1:0)+(P.po>0?1:0)+(t&&t.role===0?1:0); }
function pmTxt(t){ const P=t&&t.pm; if(!P)return ''; const L=[]; if(P.pt>0)L.push(P.n?`출전 ${pmPtTxt(P.ptc,P.n)}`:'출전량'); if(P.sg&&PM_SG[P.sg])L.push(`${PM_SG[P.sg]} 보강`); if(P.po>0)L.push(`${P.po}년 뒤 포스팅 허락`); return L.join(', '); }
function pmApply(p,t,sy,y){ const P=t&&t.pm; if(!P)return; const L=[];
  if(P.pt>0){ const c=pmPtC(p,P.ptc); L.push({k:'pt',c,n:pmPtN(p,c,P.pt),y0:sy,y1:sy+Math.min(y,2)-1}); }
  if(P.sg&&PM_SG[P.sg])L.push({k:'sg',g:P.sg,y0:sy,y1:sy,d:P.d??G.day,seq:G.mvN||0});
  if(L.length){ let ag=null; try{ ag=agentOf(p); }catch(e){} p.cprom={tid:p.team,ag:ag?ag.id:null,L}; }
  if(P.po>0){ p.postPromise=sy+P.po-1; p.postPromiseT=p.team; } }
/* 출전 기준 확인: 부상으로 빠진 날만큼 기준을 낮추고, 절반 넘게 빠졌거나 군 복무 중이면 따지지 않는다(null) */
function promiseInjEnd(p,h){if(Number.isFinite(h.bk))return h.bk;return h===(p.injHist||[]).at(-1)&&p.injOut>0?G.day+p.injOut:h.d+(h.days||0);}
function promiseInjDays(p,from,to){const intervals=(p.injHist||[]).filter(h=>Number.isFinite(h.d)).map(h=>[Math.max(from,h.d),Math.min(to,promiseInjEnd(p,h))]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let total=0,start=null,end=null;for(const [a,b] of intervals){if(start==null){start=a;end=b;}else if(a<=end)end=Math.max(end,b);else{total+=end-start;start=a;end=b;}}return total+(start==null?0:end-start);}
function promiseInjBack(p){const H=(p.injHist||[]).filter(h=>Number.isFinite(h.d)&&h.d<=G.day);return H.length?Math.max(...H.map(h=>promiseInjEnd(p,h))):null;}
function cpromPt(p,x,y){ if(milServing(p))return null; const C=G.cal||{}; const open=y===G.year&&C.open?C.open:dnum(y,3,25), end=y===G.year&&C.end?C.end:dnum(y,10,1),out=promiseInjDays(p,open,end);
  const sc=1-out/Math.max(1,end-open); if(sc<.5)return null; const h=seasonTotal(p,y,'1군')||{}; return (h[x.c]||0)>=x.n*sc; }
function cpromSgKey(C,x){return JSON.stringify([C.tid,x.d,x.seq??null,x.y0,x.y1,x.g]);}
function cpromAfter(x,d,seq){return Number.isFinite(d)&&Number.isFinite(x.d)&&(d>x.d||d===x.d&&x.seq!=null&&seq!=null&&seq>x.seq);}
function cpromMoveGroup(m){if(m.pg)return m.pg;const pos=Object.keys(POSK).find(k=>POSK[k]===m.pos);return ({C:'C','1B':'IF','2B':'IF','3B':'IF',SS:'IF',LF:'OF',CF:'OF',RF:'OF',DH:'DH'}[pos])||(m.pos==='선발'?'SP':m.pos==='불펜'?'RP':null);}
/* 이행 근거를 해당 약속의 구단·시작일·이동 순번에 묶는다. 나중에 떠나도 이미 한 영입은 사라지지 않는다. */
function cpromAcquire(q,from,to){if(from===to||q.joinY>G.year)return;const group=pmGrp(q),value=ovr(q);if(value<PM_SG_MIN)return;for(const p of Object.values(G.players)){const C=p.cprom;if(!C||p.team!==C.tid||p.id===q.id||C.tid!==to&&C.tid!==from)continue;const incoming=C.tid===to,d=incoming?G.day:q.mvD,seq=incoming?(G.mvN||0)+1:(G.moves||[]).find(m=>m.pid===q.id&&m.to===from&&m.d===d)?.seq;/* 옛 영입 장부가 압축됐어도 실제 이탈 직전 소속·합류일로 확인되는 이행은 보관한다. */for(const x of C.L||[])if(x.k==='sg'&&x.g===group&&x.y0<=G.year&&x.y1>=G.year&&cpromAfter(x,d,seq)&&x.sgKept?.key!==cpromSgKey(C,x))x.sgKept={key:cpromSgKey(C,x),pid:q.id,tid:C.tid,d,seq:seq??null,g:group,o:value,y:G.year,observed:G.day};}}
function cpromSg(p,C,x,year=G.year){const key=cpromSgKey(C,x);if(x.sgKept?.key===key)return true;for(const m of G.moves||[]){if(!cpromAfter(x,m.d,m.seq))continue;const y=Number.isInteger(m.y)?m.y:dobj(m.d).y;if(m.pid===p.id||m.to!==C.tid||m.from===m.to||y<x.y0||y>x.y1||y>year||!(m.o>=PM_SG_MIN)||cpromMoveGroup(m)!==x.g)continue;const q=G.players[m.pid],available=m.joinY!=null?m.joinY<=y:q&&!(q.joinY>y);if(available)return true;}return Object.values(G.players).some(q=>q.team===C.tid&&q.id!==p.id&&!(q.joinY>year)&&q.mvD>x.d&&dobj(q.mvD).y<=year&&ovr(q)>=PM_SG_MIN&&pmGrp(q)===x.g);}
function cpromLab(p,x){ return x.k==='pt'?`출전 ${pmPtTxt(x.c,x.n)}`:`${PM_SG[x.g]} 보강`; }
function cpromSeason(y){ for(const p of Object.values(G.players)){ const C=p.cprom; if(!C)continue; if(p.team!==C.tid||!ctOn(p)){ delete p.cprom; continue; }
    const res=[]; for(const x of C.L){ if(x.y0>y||x.y1<y)continue; const r=x.k==='pt'?cpromPt(p,x,y):cpromSg(p,C,x,y); if(r!=null)res.push([x,r]); }
    C.L=C.L.filter(x=>x.y1>y); if(!C.L.length)delete p.cprom; if(!res.length)continue;
    const ag=C.ag!=null?agById(C.ag):null; const me=C.tid===G.user&&!G.unemp; const bad=res.filter(r=>!r[1]), good=res.filter(r=>r[1]);
    for(const [x] of good){ p.mor=clamp((p.mor??60)+3,0,100); if(ag)agRelAdd(ag,1,`${p.name} 약속 이행`,C.tid); }
    for(const [x] of bad){ p.mor=clamp((p.mor??60)-(x.k==='pt'?8:6),0,100); try{ grvAdd(p,'prom',5); }catch(e){} if(ag)agRelAdd(ag,-3,`${p.name} 약속 불이행`,C.tid); }
    if(ag)agMemSet(ag,C.tid,bad.length?'broke':'kept',p.id); /* 하나라도 어기면 '약속 위반'으로 기억한다 */
    initPers(p); const req=bad.length&&(p.mor??60)<30&&p.pers.amb>=11&&!p.listed;
    if(me){ const who=ag?`${ag.name} 에이전트`:p.name; const L=res.map(([x,r])=>`${r?'지킴':'어김'} · ${cpromLab(p,x)}`).join('\n');
      if(req){ p.treq={day:G.day}; mail(p.name,'트레이드 요청',`계약 때 한 약속이 지켜지지 않았습니다.\n${L}\n\n이대로라면 다른 팀에서 뛰고 싶습니다. 트레이드를 요청드립니다.`,{imp:true,ref:p.id,face:p.id,kind:'선수',acts:[{l:'트레이드 명단에 올리기',a:'listP',v:p.id},{l:'남아 달라고 설득',a:'keepP',v:p.id},{l:'선수 보기',a:'player',v:p.id}]}); }
      else mail(who,`${p.name} 계약 약속 ${bad.length?'불이행':'이행'}`,`${y}시즌 약속을 확인했습니다.\n${L}\n\n${bad.length?`약속을 어겨 선수 기분이 떨어졌고${ag?', 에이전트와의 관계도 나빠졌습니다. 이 에이전트는 다음 협상에서 이 일을 기억합니다':''}.`:`약속을 지켜 선수 기분이 올랐습니다${ag?'. 에이전트도 다음 협상에서 이 일을 기억합니다':''}.`}`,{kind:'면담',imp:!!bad.length,ref:p.id,acts:[{l:'선수 보기',a:'player',v:p.id}]}); }
    else if(req&&p.team!=null){ try{ wire('구단 사정',`${tshort(p.team)} ${p.name}, 계약 약속 불이행에 불만 · 트레이드 요청`,{tid:p.team,ref:p.id}); }catch(e){} } } }
function capBOf(p){ return ctOn(p)&&p.capB&&p.capB.until>=G.year?p.capB.a:0; }
/* 예산 전망은 조회 시즌에 유효한 계약 한 건만 본다. 확정된 다음 계약은 옵션이 없어도 옛 조항을 대체한다. */
function optForSeason(p,y){ if(y>G.year&&p.extNext){ const x=p.extNext,T=x.terms,from=G.year+1,until=from+Math.max(1,x.years||T&&T.years||1)-1; return y<=until&&T&&T.opt>0?{a:T.opt,from,until,c:T.optC||optCrit(p)}:null; }
  const o=ctOn(p)&&p.opt; return o&&!(o.from>y)&&!(o.until<y)&&o.paidY!==y?o:null; }
/* 현재·미래 계약의 종류별 전망은 같은 판정을 쓴다. 수상은 실제 선정 전에는 지출로 잡지 않는다. */
function optProjMet(p,y,o){ if(milServing(p))return y===G.year&&optEarned(p); /* 짧은 대표팀 차출은 복무가 아니므로 평소 페이스를 쓴다 */
  const c=o.c||optCrit(p),oc=OPT_CRIT[c]||OPT_CRIT[optCrit(p)]; if(oc[3]==='award')return c==='as'&&y===G.year&&optEarned(p);
  const h=y===G.year?seasonTotal(p,G.year,'1군'):null,r=G.sea&&G.sea.rec&&G.sea.rec[p.team],g=r?r.w+r.l+(r.t||0):0;
  return h&&g>=20?optMet(c,h,p,144/g):isRegular(p)&&oc[3]==='play'; }
function optProj(tid,y){ let s=y===G.year&&G.sea&&G.sea.optPd?G.sea.optPd[tid]||0:0; /* 시즌 중 이미 준 옵션 */ for(const p of Object.values(G.players)){ if(p.team!==tid||p.joinY>G.year)continue; const o=optForSeason(p,y); if(o&&optProjMet(p,y,o))s+=o.a; } return s; }
/* 옵션 달성 기준: 타자 400타석, 선발 120이닝, 불펜 50이닝(규정 달성형 옵션을 단순화) */
/* 옵션 기준: 계약 때 보직(b 타자 400타석 · sp 선발 120이닝 · rp 불펜 50이닝). 저장된 기준이 없으면(예전 계약) 지금 보직 */
function optCrit(p){ return p.isP?(isSPr(p)?'sp':'rp'):'b'; }
/* 옵션 종류(계약 1단계): [기록, 기준, 표시, 묶음(play 출전·perf 성적·award 수상), 선수가 보는 가치(보장액 대비)].
   실제 KBO FA 옵션처럼 출전(경기·타석·이닝), 성적(규정타석 타율·OPS, 규정이닝 평균자책점, 세이브·홀드), 수상(골든글러브·올스타). 달성해야만 지급한다 */
const OPT_CRIT={b:['pa',400,'400타석','play',.45],bg:['g',120,'120경기 출전','play',.45],sp:['outs',360,'120이닝','play',.45],rp:['outs',150,'50이닝','play',.45],rpg:['g',50,'50경기 등판','play',.45],
  avg:['avg',.3,'규정타석 타율 3할','perf',.3],ops:['ops',.85,'규정타석 OPS 0.850','perf',.3],era:['era',3.5,'규정이닝 평균자책점 3.50 이하','perf',.3],sv:['sv',20,'20세이브','perf',.32],hld:['hld',20,'20홀드','perf',.32],
  gg:['gg',1,'골든글러브 수상','award',.15],as:['as',1,'올스타 선정','award',.25]};
const OPT_GRP={play:'출전',perf:'성적',award:'수상'};
/* 보직별로 고를 수 있는 옵션 */
function optKinds(p){ return p.isP?(isSPr(p)?['sp','era','gg','as']:['rp','rpg','sv','hld','as']):['b','bg','avg','ops','gg','as']; }
/* 시즌 중 외국인 계약은 지급액과 같은 남은 일정 비율을 출전 조건에도 쓴다. 율·수상 값은 낮추지 않는다. */
function optFracEvidence(p){ const o=p&&p.opt,c=G.cal; if(!p||!p.foreign||!o||o.from!==G.year||!Number.isFinite(p.fjD)||dobj(p.fjD).y!==o.from||!c||p.fjD<c.open||p.fjD>c.end)return null; const ds=Object.keys(c.sched||{}); return ds.length?ds.filter(d=>+d>p.fjD).length/ds.length:null; }
function optFrac(p){ const o=p&&p.opt; if(!o)return 1; if(Number.isFinite(o.fr)&&o.fr>=0&&o.fr<=1)return o.fr; return optFracEvidence(p)??1; }
function optCountNeed(p,c){ const o=OPT_CRIT[c]; return o?Math.ceil(o[1]*(o[3]==='award'?1:optFrac(p))-1e-9):0; }
/* 저장된 실제 조건 표시. 출전량은 정수 기록으로 달성할 수 있는 최소값을 보여 준다. */
function optLabel(p){ const x=p&&p.opt,c=x&&(x.c||optCrit(p)),o=OPT_CRIT[c]; if(!o)return ''; const fr=optFrac(p); if(fr>=1||o[3]==='award')return o[2]; if(['avg','ops','era'].includes(c))return o[2]+'(규정 출전량은 잔여 일정 비례)'; const n=optCountNeed(p,c); return (o[0]==='outs'?ipStr(n)+'이닝':n+({pa:'타석',g:p.isP?'경기 등판':'경기 출전',sv:'세이브',hld:'홀드'}[o[0]]||''))+'(잔여 일정 비례)'; }
/* 옛 저장은 현재 계약 시즌과 실제 입단일·일정이 함께 남은 경우에만 비율을 복원한다. */
function optProrationFix(p0){ let n=0; for(const p of p0?[p0]:Object.values(G.players||{})){ if(!p||!p.opt||Number.isFinite(p.opt.fr))continue; const fr=optFracEvidence(p); if(fr!=null&&fr<1){ p.opt.fr=fr; n++; } } return n; }
/* 달성 판정: sc는 시즌 중 페이스 환산(144/경기 수) */
function optMet(c,h,p,sc){ const o=OPT_CRIT[c]; if(!o||!h)return false; sc=sc||1; const g=G.sea&&G.sea.rec&&p.team!=null&&G.sea.rec[p.team]; const tg=Math.max(1,(g?g.w+g.l+(g.t||0):144)*sc),fr=optFrac(p);
  if(c==='avg'||c==='ops'){ if((h.pa||0)*sc<Math.round(tg*3.1*fr))return false; return bRate(h)[c]>=o[1]; } if(c==='era'){ if((h.outs||0)*sc<tg*3*fr)return false; return pRate(h).era<=o[1]; }
  return (h[o[0]]||0)*sc>=optCountNeed(p,c); }
function optEarned(p){ if(!ctOn(p)||!p.opt||p.opt.until<G.year||p.opt.from>G.year)return false; const c=p.opt.c||optCrit(p);
  if(c==='gg')return false; /* 골든글러브는 결산 뒤(12월) 시상식에서 optAward가 지급한다 */ if(c==='as')return (p.aw||[]).some(l=>l.startsWith(G.year+' 올스타'));
  const h=seasonTotal(p,G.year,'1군'); if(!h)return false; return optMet(c,h,p,1); }
/* 골든글러브 옵션: 시상식에서 받으면 계약한 구단의 다음 결산 지출(t.optDue)로 잡는다. AI 구단도 같다 */
function optAward(p,y){ try{ if(!p||!p.opt||(G.optLed||[]).some(x=>x.pid===p.id&&x.y===y)||(p.opt.c)!=='gg'||p.opt.from>y||p.opt.until<y||p.opt.paidY===y)return; const tid=p.ctT; const t=tid!=null&&team(tid); if(!t)return; t.optDue=(t.optDue||0)+p.opt.a; p.opt.paidY=y; story(p,`계약 옵션 달성: 골든글러브 (${money(p.opt.a)})`,'move'); if(tid===G.user)note('운영팀',`${p.name} 골든글러브 옵션 ${money(p.opt.a)}을(를) 다음 결산에 지급합니다.`); }catch(e){} }
function optSettle(tid){ let tot=0; const L=[]; for(const p of Object.values(G.players)){ if(p.team!==tid||p.joinY>G.year)continue; /* 시즌 중 입대·대표팀으로 빠진 선수도 이미 달성한 옵션은 받는다 */ if(!ctOn(p)||!p.opt||p.opt.until<G.year||p.opt.paidY===G.year)continue; /* 방출 때 이미 준 옵션은 다시 주지 않는다 */ if(optEarned(p)){ tot+=p.opt.a; p.opt.paidY=G.year; /* 결산에서 준 옵션은 방출·트레이드 때 다시 주지 않는다(검수 11-08) */ L.push(`${p.name} ${money(p.opt.a)}`); story(p,`계약 옵션 달성 (${money(p.opt.a)})`,'move'); } }
  if(L.length&&tid===G.user)note('운영팀',`계약 옵션 지급: ${L.join(', ')}`); return tot; }
/* 역할 약속 점검(6~9월 매달 1일): 주전 보장을 약속했는데 주전이 아니면 서운해한다 */
/* 약속 종류별 확인: 선발 보장=선발 로테이션, 필승조 보장=마무리·셋업(불펜 앞 4명), 주전 보장=야수 주전 배치. 옛 저장은 약속 문구로 종류를 읽는다 */
function promKind(r){ return r.t||(r.l===ROLE_L.SP[0]?'SP':r.l===ROLE_L.RP[0]?'RP':'B'); }
function promKept(p,r,d){ d=d||depth(p.team); const has=a=>(a||[]).some(x=>x&&x.id===p.id); const k=promKind(r); return k==='SP'?has(d.sp):k==='RP'?has((d.pen||[]).slice(0,4)):has(d.start); }
function roleNowTxt(p,d){ d=d||depth(p.team); const has=a=>(a||[]).some(x=>x&&x.id===p.id); return has(d.sp)?'선발 로테이션':(d.pen||[])[0]&&d.pen[0].id===p.id?'마무리':has((d.pen||[]).slice(1,4))?'셋업':has(d.pen)?'불펜':has(d.start)?'주전':'벤치·2군'; }
function rolePromCheck(mo){ if(mo<6||mo>9||period()!=='season')return; for(const p of G.teams.flatMap(t=>playersOf(t.id))){ if(!p.roleProm)continue; const me=p.team===G.user&&!G.unemp; /* 약속은 계약한 구단에 남는다: 단장이 떠나도 효과는 이어지고 안내만 우리 구단에(검수 11-09zzb) */ const r=p.roleProm; if(!ctOn(p)||!r||r.until<G.year||p.injOut>0||!healthy(p)||isAway(p))continue; {const back=promiseInjBack(p);if(back!=null&&G.day<back+28)continue;} /* 실제 복귀 뒤 4주 동안은 약속 위반으로 보지 않는다. */ /* 징계·미계약·대표팀·군 복무로 못 뛰는 동안은 약속 위반이 아니다(사용자 피드백 11-06) */ const d=depth(p.team); if(promKept(p,r,d))continue; const now=roleNowTxt(p,d);
  const gr=r.grace>=G.day; p.mor=clamp((p.mor??60)-(gr||(r.soft>=G.day&&p.promise)?3:6),0,100); try{ if(hasAgent(p)&&!gr)agRelAdd(agentOf(p),-1,`${p.name} 역할 약속 불이행`,p.ctT); }catch(e){} /* 약속한(계약한) 구단 친분만: 구단을 빼면 우리 구단으로 잡혀 AI 구단 위반이 우리 친분을 깎았다(리뷰② 11-17) */ /* 에이전트 양해(grace)·대신 받은 출전 기회(soft) 동안은 덜 서운해한다 */
  if(me&&r.warn!==G.year){ r.warn=G.year; mail(hasAgent(p)?`${agentOf(p).name} 에이전트`:'선수단',`${p.name} 측: "${r.l} 약속은 어디 갔습니까"`,`계약할 때 ${r.l}을(를) 약속했는데 지금은 ${now}(으)로 뛰고 있습니다. 약속이 지켜지지 않으면 매달 선수 기분이 떨어지고 에이전트와의 관계도 나빠집니다.\n\n기용은 감독이 정합니다. 감독실에서 이 선수 기용을 건의하거나, 에이전트에게 사정을 설명하고 양해를 구할 수 있습니다.`,{kind:'면담',imp:true,ref:p.id,acts:[{l:'선수 보기',a:'player',v:p.id},{l:'감독실 들어가기',a:'meetOpen',v:`mgr|use:${p.id}`},{l:hasAgent(p)?'에이전트에게 양해 구하기':'선수에게 양해 구하기',a:'agPardon',v:p.id}]}); } } }
/* 선수 기용 건의(감독실, 카페 피드백 11-09: 약속 위반 메일로 감독실에 가도 그 선수 이야기를 할 수 없었다).
   단장은 기용 권한이 없어 건의만 한다. 감독은 고집(ego)·단장과의 관계·그 자리 마지막 경쟁자와의 능력 차로 정하고, 같은 조건이면 같은 답을 한다.
   받아들이면 그 감독이 있는 동안 이번 시즌은 약속한 보직에 넣는다(뎁스 가산 rpB). 거절하면 감독 관계 -1, 7일 뒤 다시 건의 */
const rpLive=p=>p.roleProm&&ctOn(p)&&p.roleProm.until>=G.year?p.roleProm:null;
function useKind(p){ const r=rpLive(p); return r?promKind(r):p.isP?(isSPr(p)?'SP':'RP'):'B'; }
function rpromK(tid,p){ const r=p.roleProm, o=r&&r.ok; if(!o||o.tid!==tid||o.y!==G.year||r.until<G.year)return ''; const m=G.mgr[tid]; return m&&m.id===o.mid?promKind(r):''; }
const rpB=(tid,p,k)=>p.roleProm&&rpromK(tid,p)===k?30:0;
/* 그 자리 마지막 경쟁자(5선발·필승조 4번째·같은 포지션 주전)와 능력 차: 양수면 이 선수가 처진다 */
function useComp(p,k){ const d=depth(p.team); const v=k==='SP'?spV:k==='RP'?penV:ovr; let L=(k==='SP'?d.sp:k==='RP'?(d.pen||[]).slice(0,4):d.start).filter(x=>x&&x.id!==p.id);
  if(k==='B'){ const at=d.ln&&d.ln[p.pos]; if(at&&at.id!==p.id)L=[at]; else if(L.length<9)return {c:null,gap:-99}; } else if(L.length<(k==='SP'?5:4))return {c:null,gap:-99};
  const c=[...L].sort((a,b)=>v(a)-v(b))[0]; return {c,gap:Math.round(v(c)-v(p))}; }
function useScore(m,gap){ const ego=m.interim?40:m.ego; return 4-gap-(ego-50)/10+(m.rel-60)/10-(m.disc>=62?1:0)+(mplOn('listen')?3:0); }
function mgrUseView(p){ const k=useKind(p), r=rpLive(p), role=k==='SP'?'선발 로테이션':k==='RP'?'필승조':'주전'; if(r&&promKept(p,r))return `${p.name}은(는) 지금 약속대로 ${roleNowTxt(p)}(으)로 쓰고 있습니다.`;
  const {c,gap}=useComp(p,k); return `${p.name} 말씀이군요. 지금은 ${roleNowTxt(p)}(으)로 쓰고 있습니다. ${c?`${role} 마지막 자리는 ${c.name}인데, ${gap>2?`${p.name}이(가) 아직 처집니다`:gap>=-2?'둘이 비슷합니다':`${p.name}이(가) 더 낫습니다`}.`:`${role} 자리에 여유가 있습니다.`}${r?` 계약 때 ${r.l} 약속이 있었던 건 압니다.`:''}`; }
function useUnavailable(p){ if(!healthy(p)||isAway(p)||p.ys||p.joinY>G.year||p.hold||!psOk(p))return upWhy({...p,e1:false}); if(entryOn()&&!p.e1&&!canUp(p))return upWhy(p); return ''; }
/* 포지션 기용 건의(커뮤니티 11-12 Derma: 3루도 되는 1루수를 감독이 1루에만 쓴다). 단장은 건의만 하고 감독이 받아들이면
   그 감독이 있는 동안 이번 시즌 그 자리에 쓰는 쪽으로 기운다(라인업 가산 posAskB, 절대 지시는 아님: 그 자리 수비가 크게 처지면 여전히 안 쓴다).
   판단: 그 자리 지금 주전과의 자리 점수(posScore) 차, 감독 고집·관계(useScore와 같은 식). 거절하면 관계 -1, 7일 뒤 다시 */
function posAskOf(tid,p){ const x=G.posAsk&&G.posAsk[p.id]; if(!x||x.tid!==tid||x.y!==G.year||p.team!==tid)return null; const m=G.mgr[tid]; return m&&m.id===x.mid?x.k:null; }
const posAskB=(tid,p,pos)=>posAskOf(tid,p)===pos?14:0;
function mgrPosAsk(p,m,k){ const nm=POSK[k]||k; const me=`${p.name}을(를) ${nm}로도 써 주십시오. 그 자리 수비가 됩니다.`;
  if(p.isP||!subsOf(p).includes(k))return {me,a:`${p.name}은(는) ${nm} 수비 경험이 부족합니다. 거기는 못 맡깁니다.`,sys:'그 자리 숙련도 50 이상인 자리만 건의할 수 있습니다'};
  if(posAskOf(G.user,p)===k)return {me,a:'이미 그렇게 쓰기로 했습니다.',sys:''};
  const no=G.useNo&&G.useNo[p.id]; if(no&&no.u>G.day&&no.mid===m.id)return {me,a:`며칠 전에 말씀드렸습니다. 당분간은 지금대로 가겠습니다.`,sys:`${dmd(no.u)}부터 다시 건의할 수 있습니다`};
  const d=depth(G.user), at=d.ln&&d.ln[k]; const gap=at&&at.id!==p.id?Math.round(posScore(at,k)-posScore(p,k)):-3;
  if(useScore(m,gap)<0){ m.rel=clamp(m.rel-1,0,100); (G.useNo=G.useNo||{})[p.id]={u:G.day+7,mid:m.id}; return {me,a:`${at?`${nm}는 ${at.name}이(가) 낫습니다.`:''} ${p.name}은(는) 지금 자리에서 쓰겠습니다.`,sys:'건의 거절 · 감독 관계 조금 악화 · 7일 뒤 다시 건의할 수 있습니다'}; }
  const cost=m.ego>=65&&!mplOn('listen'); if(cost)m.rel=clamp(m.rel-1,0,100);
  (G.posAsk=G.posAsk||{})[p.id]={k,tid:G.user,mid:m.id,y:G.year,d:G.day}; p.mor=clamp((p.mor??60)+2,0,100);
  return {me,a:`해 보겠습니다. ${nm}에 넣어 보고 수비가 버티면 계속 쓰겠습니다.`,sys:`수락: 이번 시즌 ${p.name}을(를) ${nm} 쪽으로 기용(감독이 바뀌면 다시 건의) · ${p.name} 기분 조금 상승${cost?' · 감독 관계 조금 악화':''}`}; }
function mgrUseAsk(pid,c){ const p=G.players[pid], m=G.mgr[G.user]; if(!p||p.team!==G.user||G.unemp||!m)return {me:'',a:'...',sys:'건의할 수 없는 선수입니다.'}; mgrFix(m);
  const why=useUnavailable(p); if(why)return {me:'',a:'지금은 출전 기용을 약속할 수 없습니다.',sys:why};
  if(String(c).startsWith('pos:'))return mgrPosAsk(p,m,String(c).slice(4));
  const k=useKind(p), r=rpLive(p), role=k==='SP'?'선발 로테이션':k==='RP'?'필승조':'주전'; const {c:cp,gap}=useComp(p,k);
  const me=c==='role'?`계약 때 약속한 ${r?r.l.replace(' 보장',''):role} 자리대로 ${p.name}을(를) 써 주십시오.`:c==='alt'?`${r?`${role}이 어렵다면 `:''}${p.name}에게 ${p.isP?'롱릴리프·스윙맨으로라도':'대타·선발 몇 경기로라도'} 출전 기회를 주십시오.`:`성적이 안 되면 감독님 판단을 존중하겠습니다. 다만 ${p.name} 사정은 알아 주십시오.`;
  if(c==='respect'){ const first=m.useResp!==G.year; if(first){ m.useResp=G.year; m.rel=clamp(m.rel+1,0,100); } return {me,a:`알겠습니다. 내용이 올라오면 바로 쓰겠습니다. 믿어 주셔서 고맙습니다.`,sys:`${first?'감독 관계 조금 개선 · ':''}약속 판정은 그대로입니다`}; }
  if(c==='role'&&(!r||rpromK(G.user,p)))return {me,a:`${r?'이미 그렇게 하기로 했습니다.':'계약 때 약속한 역할이 없는 선수입니다.'}`,sys:''};
  if(c==='alt'&&p.promise)return {me,a:`지난번 말씀하신 출전 기회부터 챙기고 있습니다.`,sys:`${dmd(p.promise.until)}까지 출전 기회 약속이 이미 있습니다`};
  const no=G.useNo&&G.useNo[pid]; if(no&&no.u>G.day&&no.mid===m.id)return {me,a:`며칠 전에 말씀드렸습니다. 당분간은 지금대로 가겠습니다.`,sys:`${dmd(no.u)}부터 다시 건의할 수 있습니다`};
  if(useScore(m,gap)+(c==='alt'?5:0)<0){ m.rel=clamp(m.rel-1,0,100); (G.useNo=G.useNo||{})[pid]={u:G.day+7,mid:m.id};
    return {me,a:`${cp?`${p.name}은(는) 지금 ${cp.name}보다 처집니다.`:''} 약속은 프런트 사정이고, 저는 이기는 쪽으로 쓰겠습니다. 내용으로 보여 주면 그때 쓰겠습니다.`,sys:'건의 거절 · 감독 관계 조금 악화 · 7일 뒤 다시 건의할 수 있습니다'}; }
  const cost=m.ego>=65&&!mplOn('listen'); if(cost)m.rel=clamp(m.rel-1,0,100);
  if(c==='role'){ r.ok={tid:G.user,mid:m.id,y:G.year,d:G.day}; if(k==='SP'&&G.prole&&G.prole[pid]&&G.prole[pid].k!=='sp')delete G.prole[pid]; try{ entryUpgrade(G.user,[p],'약속 보직'); roleSync(G.user); }catch(e){} p.mor=clamp((p.mor??60)+4,0,100);
    return {me,a:`알겠습니다. 계약 때 한 약속이니 이번 시즌은 ${role}에 넣겠습니다. 대신 결과는 선수가 책임져야 합니다.`,sys:`수락: 이번 시즌 ${role}${k==='SP'?'으로':'로'} 기용(감독이 바뀌면 다시 건의) · ${p.name} 기분 상승${cost?' · 감독 관계 조금 악화':''}`}; }
  p.promise=mkPromise(p,30); if(r)r.soft=G.day+30; p.mor=clamp((p.mor??60)+3,0,100);
  return {me,a:`그 정도는 해 보겠습니다. 한 달 안에 기회를 주겠습니다.`,sys:`수락: 30일 안에 출전 기회 · ${p.name} 기분 상승${r?' · 그동안 약속 위반 기분 하락 절반(약속 위반은 그대로)':''}${cost?' · 감독 관계 조금 악화':''}`}; }
/* 건의할 만한 선수: 역할 약속을 못 지키는 선수 먼저, 다음은 출전 시간에 불만인 주축·고참 */
function useCands(){ if(G.unemp)return []; const d=depth(G.user); const L=playersOf(G.user).filter(p=>!useUnavailable(p));
  const bad=L.filter(p=>rpLive(p)&&!promKept(p,p.roleProm,d)); return [...bad,...L.filter(p=>!bad.includes(p)&&ptWhyP(p)&&(p.mor??60)<55).sort((a,b)=>ovr(b)-ovr(a))].slice(0,4); }
/* 에이전트에게 양해 구하기(계약당 한 번): KBO에서는 구단이 사정을 설명하면 에이전트가 한동안 지켜봐 준다. 대신 그 자리에서 신뢰가 깎이고(관계 -2, 큰 에이전시는 -3) 선수도 서운해한다(기분 -2).
   60일 동안은 매달 약속 위반 기분 하락이 절반, 에이전트 관계 감점은 없다. 약속 자체가 없어지지는 않는다 */
function agPardon(pid){ const p=G.players[pid], r=p&&rpLive(p); if(!p||p.team!==G.user||G.unemp||!r)return '역할 약속이 남은 우리 선수가 아닙니다.'; if(r.pard)return '이번 계약에서는 이미 양해를 구했습니다.';
  r.pard=G.year; r.grace=G.day+60; const ag=hasAgent(p)?agentOf(p):null; if(ag)agRelAdd(ag,-2,`${p.name} 역할 약속 양해 요청`,G.user); p.mor=clamp((p.mor??60)-2,0,100);
  return `${ag?`${ag.name} 에이전트`:p.name}: "사정은 알겠습니다. 두 달은 지켜보겠습니다. 그 뒤에도 그대로면 다음 계약 때 다시 이야기하겠습니다." ${ag?`${ag.size==='big'?'에이전트가 꽤 서운해하고':'에이전트가 조금 서운해하고'}, `:''}선수 기분도 조금 내려갑니다. ${dmd(r.grace)}까지는 약속 위반에 대한 실망이 덜합니다${ag?'. 그동안 에이전트와 사이는 더 나빠지지 않습니다':''}.`; }
/* 거부권은 계약한 구단에 있는 동안 유효하다(우리 선수든 상대 선수든) */
function ntcOf(ids){ return ids.map(id=>G.players[id]).find(p=>p&&hasNtc(p))||null; }
const hasNtc=p=>ctOn(p)&&p.ntc>=ctSeason();
/* 거부권 선수의 동의(커뮤니티 11-13 마스터쉐프): 우리 선수가 특정 구단행에 동의하면 14일 동안 그 구단과의 트레이드에서만 거부권을 쓰지 않는다 */
const ntcFor=(p,tid)=>hasNtc(p)&&!(p.ntcOk&&p.ntcOk.tid===tid&&p.ntcOk.until>=G.day);
function ntcOfFor(ids,tid){ return ids.map(id=>G.players[id]).find(p=>p&&ntcFor(p,tid))||null; }
/* 동의 확률: 충성심이 높으면 남고 싶어 하고, 야망이 크거나 기분이 나쁘면 떠날 마음이 있다. 가서 주전이 되거나 우승 경쟁 구단·고향 구단이면 끌린다. 지켜지지 않은 약속이 있으면 구단 말을 믿지 않는다. 포기 대가(연봉의 30%)를 주면 오른다 */
const NTC_BONUS_F=.3;
function ntcAskOdds(p,tid,bonus){ initPers(p); const s=p.pers; let x=.3-(s.loy-10)*.035+(s.amb-10)*.02+(60-(p.mor??60))/100; const why=[];
  let reg=false; try{ reg=isRegular(p); }catch(e){} if(!reg){ x+=.12; why.push('여기선 출전 기회가 적다'); } else x-=.08;
  try{ const L=leagueSlots()[tid], sl=L&&L[pSlot(p)]; if(sl&&sl.v!=null&&ovr(p)>sl.v+1){ x+=.12; why.push('그 팀에선 주전'); } }catch(e){}
  try{ if(teamCtx(team(tid)).contend){ x+=.1; why.push('우승 경쟁 구단'); } }catch(e){}
  try{ if(homeTie(p,tid)){ x+=.15; why.push('고향 구단'); } }catch(e){}
  const pr=p.grv&&p.grv.prom||0; if(pr>0){ x-=Math.min(.2,pr*.02); why.push('지켜지지 않은 약속'); }
  if(bonus){ x+=.2; why.push('포기 대가'); }
  return {p:clamp(x,.03,.92),why}; }
function ntcAsk(id,tid,bonus){ const p=G.players[+id]; tid=+tid; if(!p||p.team!==G.user||G.unemp)return '우리 선수가 아닙니다.'; if(!hasNtc(p))return `${p.name}은(는) 거부권이 없습니다.`; if(!team(tid)||tid===G.user)return '상대 구단을 먼저 고르세요.';
  if(!ntcFor(p,tid))return `${p.name}은(는) 이미 ${tshort(tid)}행에 동의했습니다(${dmd(p.ntcOk.until)}까지).`;
  const A=p.ntcAsk=p.ntcAsk||{}; if(A[tid]!=null&&G.day-A[tid]<30)return `${p.name}에게는 ${tshort(tid)}행을 ${dmd(A[tid])}에 이미 물었습니다. 30일 뒤에 다시 물을 수 있습니다.`;
  const cost=bonus?round5(Math.max(MIN_SAL,p.sal*NTC_BONUS_F)):0; if(cost&&spendable(G.user)<cost)return `포기 대가 ${money(cost)}을(를) 낼 돈이 부족합니다(${spendTxt()}).`;
  const o=ntcAskOdds(p,tid,!!bonus); A[tid]=G.day;
  if(R()<o.p){ if(cost){ spendPay(cost); G.spend.etc=(G.spend.etc||0); story(p,`${G.year} 트레이드 거부권 포기 대가 ${money(cost)}`,'move'); } p.ntcOk={tid,until:G.day+14}; return `${p.name}: "${tshort(tid)}(이)라면 가겠습니다." ${dmd(G.day+14)}까지 ${tname(tid)}과(와)의 트레이드에 동의했습니다.${cost?` 포기 대가 ${money(cost)}을(를) 지급했습니다.`:''}`; }
  p.mor=clamp((p.mor??60)-3,0,100); return `${p.name}: "${tshort(tid)}행은 생각이 없습니다." 거부권을 지키겠다고 합니다. (기분 하락${o.why.length?` · 고려한 점: ${o.why.join(', ')}`:''})`; } /* 스토브리그 뒤에는 다음 시즌 계약 기준: 끝난 해까지인 거부권이 11월 거래를 막았다(검수 11-09zzb) */
/* 계약 금액 표기 통일: 그 시즌 현금 지출(연봉 + 그 회계연도에 준 계약금) · 보장 총액(계약금 + 연봉×기간) · 연평균(상한 반영 = 연봉 + 계약금/기간) */
function ctMoney(p){ if(!p||!p.faC||!ctOn(p))return null; const c=ctInfo(p); const yrs=c?c.tot:Math.max(1,p.yrs||1); const sy=ctSeason(); const B=p.capB&&p.capB.until>=sy?p.capB:null;
  const bTot=p.ctB?p.ctB.b:B?(B.b??B.a*yrs):0; const first=B?B.until-yrs+1:sy-(c?c.k-1:0); /* 계약금은 상한 반영 기간이 끝나도 계약 총액에 남는다 */
  const bNow=B&&(B.pd!=null?(B.pd>=0&&dobj(B.pd).y===dobj(finYearEnd()).y):first===sy)?bTot:0;
  return {sy,yrs,bTot,bNow,cash:p.sal+bNow,tot:bTot+p.sal*yrs+sum([...Array(c?c.k-1:0)].map((_,i)=>{ const h=(p.salH||[]).find(x=>x.y===sy-1-i); return h?h.s-p.sal:0; })) /* 지난 연차는 그해 받은 연봉으로(시즌 중 인상이 지난 해까지 바꾸지 않게, 검수 11-09zzb) */,add:p.cOptAdd||null,avg:p.sal+(B?B.a:0),opt:p.opt&&p.opt.until>=sy?p.opt.a:0}; }
function ctMoneyTxt(p){ const m=ctMoney(p); if(!m)return ''; return `${m.sy}시즌 현금 지출 ${money(m.cash)}${m.bNow?`(계약금 ${money(m.bNow)} 포함)`:''} · 보장 총액 ${money(m.tot)} · 연평균 ${money(m.avg)}(상한 반영)${m.opt?` · 옵션 최대 연 ${money(m.opt)}`:''}`; }
/* FA 체결 기록(rec) 기준: 계약금은 계약할 때 지급하므로 첫 시즌 현금에 들어간다 */
function ctRecMoney(r){ const t=r.terms; const y=Math.max(1,r.years||1); const b=t?(t.bonus||0):0; const an=t?t.annual:r.annual;
  const tot=b+an*y, avg=an+Math.round(b/y), cash=an+b;
  return {tot,avg,cash,txt:`첫 시즌 현금 지출 ${money(cash)}${b?`(계약금 ${money(b)} 포함)`:''} · 보장 총액 ${money(tot)} · 연평균 ${money(avg)}(상한 반영)`}; }
function ctRecShort(r){ if(!r.terms||!r.terms.bonus)return `${r.years}년 연 ${money(r.annual)}`; const m=ctRecMoney(r); return `${r.years}년 총액 ${money(m.tot)} · 연평균 ${money(m.avg)}`; }
