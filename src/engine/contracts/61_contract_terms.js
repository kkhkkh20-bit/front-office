/* ---------- 계약 조건 묶음(협상 테이블): 역할 약속 · 기간 · 계약금 · 연봉 · 옵션 · 트레이드 거부권 ----------
   선수와 에이전트는 묶음 전체를 '환산 연봉'으로 비교한다. 계약금은 한 번에 받는 보장액이라 조금 더 쳐 주고(×1.06),
   옵션은 못 받을 수도 있어 절반 아래로 본다(×0.45). 역할 약속을 요구보다 낮추면 크게 깎고, 거부권을 빼면 조금 깎는다.
   실제 KBO FA 계약도 '4년 총액 = 계약금 + 연봉 + 옵션'으로 발표하고, 경쟁균형세 계산에는 계약금을 연평균으로 나눠 넣는다 */
const CT_BON=1.06, CT_OPT=.45;
const ROLE_L={B:['주전 보장','주전 경쟁','백업'],SP:['선발 로테이션 보장','선발 경쟁','불펜'],RP:['필승조 보장','불펜 경쟁','추격조']};
function roleSet(p){ return p.isP?(isSPr(p)?ROLE_L.SP:ROLE_L.RP):ROLE_L.B; }
function termsEq(t){ const y=Math.max(1,t.years||1); return (t.annual||0)+(t.bonus||0)*CT_BON/y+(t.opt||0)*CT_OPT; }
function termsMul(t,d){ let m=1; if(t.role!=null&&d&&d.role!=null){ const g=t.role-d.role; m*=g>0?1-.07*g:1-.02*g; }
  if(d&&d.ntc&&!t.ntc)m*=.95; else if(t.ntc&&!(d&&d.ntc))m*=1.01;
  if(t.cOpt)m*=1-.035*t.cOpt; if(t.pOut)m*=1+.012*Math.max(1,(t.years||1)-t.pOut)+.02; /* 구단 연장 옵션은 선수에게 불리(해마다 3.5%), 선수 옵트아웃은 유리(일찍 나갈 수 있을수록) — 사용자 커뮤니티 제안 2026-11-02 */
  return m; }
function termsVal(t,d){ return termsEq(t)*termsMul(t,d); }
/* 요구 묶음: 환산 연봉 요구액(base)을 계약금·연봉으로 나눈다. 대형 FA일수록 계약금 비중이 크다(KBO 관행) */
function termsDemand(p,kind,base){ const y=Math.max(1,base.years||1); const o=ovr(p);
  const bs=kind==='fa'?(p.faGrade==='A'?.42:p.faGrade==='B'?.32:.15)*(p.age>=34?.6:p.age>=32?.8:1):kind==='ext'?(o>=58?.3:.18):0;
  const bonus=kind==='sal'?0:round5(base.annual*y*bs); const annual=Math.max(MIN_SAL,Math.ceil((base.annual-bonus*CT_BON/y)/5)*5);
  const role=kind==='fa'?(o>=58?0:o>=50?1:2):null; const ntc=kind!=='sal'&&o>=64&&p.age>=29&&hasAgent(p)&&(agentOf(p).size==='big'||agentOf(p).style==='hard');
  return {years:y,bonus,annual,opt:0,role,ntc}; }
/* FA 실제 요구(환산 연봉): 에이전트 성향·경쟁 구단 수·원소속 할인을 반영한 금액. 이만큼이면 '요구 충족'(다른 구단과의 비교는 별도) */
function faWantA(p){ const ag=agentOf(p); const ai=Object.keys((G.fa&&G.fa.ai&&G.fa.ai[p.id])||{}).length; return Math.ceil(p.ask.annual*agWantMul(ag)*(1+.03*ai)*(p.faFrom===G.user?.95:1)*.97/5)*5; }
/* 묶음을 '같은 가치'로 맞추며 연봉만 조정한다(역제안을 우리 묶음 모양 그대로 돌려줄 때) */
function termsFit(t,d,val,years){ const y=years||t.years; const T={...t,years:y}; const need=val/termsMul(T,d); T.annual=round5(Math.max(MIN_SAL,need-(T.bonus||0)*CT_BON/y-(T.opt||0)*CT_OPT)); return T; }
function termsTxt(t,short){ const L=[`${t.years}년${t.cOpt?`+구단 옵션 ${t.cOpt}년`:''}`]; if(t.bonus)L.push(`계약금 ${money(t.bonus)}`); L.push(`연봉 ${money(t.annual)}`); if(t.opt)L.push(`옵션 연 ${money(t.opt)}`); if(t.pOut)L.push(`${t.pOut}년 뒤 선수 옵트아웃`);
  if(!short){ const tot=(t.bonus||0)+t.annual*t.years; L.push(`보장 총액 ${money(tot)}${t.opt?` (옵션 포함 최대 ${money(tot+t.opt*t.years)})`:''}`); } return L.join(' · '); }
/* 계약 반영: 계약금은 바로 지급(올해 지출), 상한 계산에는 연평균으로 들어간다. 옵션은 시즌 뒤 달성하면 지급 */
/* 조건은 계약한 구단에서만 유효하다(p.ctT): 방출·트레이드·보상선수로 옮기면 상한 반영·옵션·거부권·약속이 모두 끝난다 */
/* 확정 잔여 보장액: 지금 계약의 남은 해(다년·FA 계약) + 이미 합의한 다음 시즌 시작 계약(extNext). 해마다 협상하는 연봉은 넣지 않는다 */
function guarLeft(p){ if(!p||p.foreign)return 0; return (p.faC?p.sal*Math.max(1,p.yrs||1):0)+(p.extNext?p.extNext.annual*p.extNext.years:0); }
/* 이적하면 없어지는 계약 조건(화면 안내용) */
function termsLostTxt(p){ if(!p||!ctOn(p))return ''; const L=[]; if(p.capB)L.push(`계약금 상한 반영(연 ${money(p.capB.a)})`); if(p.opt)L.push(`성과 옵션(연 최대 ${money(p.opt.a)})`); if(p.ntc)L.push('트레이드 거부권'); if(p.roleProm)L.push('역할 약속'); if(p.cOpt&&!p.cOpt.used)L.push(`구단 연장 옵션 ${p.cOpt.y}년`); if(p.pOut&&!p.pOut.used)L.push('선수 옵트아웃'); return L.join(' · '); }
/* 계약의 현금 지급 연도: 계약금은 합의할 때 바로 나가 지금 결산 연도(sponSeason)에 잡히고, 연봉은 계약 적용 시즌마다. '계약 적용 시즌'과 '돈이 나가는 해'를 나눈다 */
function ctCashYears(T,s0){ const py=sponSeason(), yrs=Math.max(1,T.years||1), s1=s0+yrs-1; const out=[]; for(let y=Math.min(py,s0);y<=s1;y++){ const sal=y>=s0?(T.annual||0):0, bon=y===py?(T.bonus||0):0; if(sal||bon)out.push({y,sal,bon,v:sal+bon}); } return out; }
/* 트레이드로 옮길 때: 이미 달성한 성과 옵션은 원소속 구단이 지급하고 조항을 정리한다(방출 경로와 같게, 검수 11-06) */
function tradeTerms(p){ try{ if(p&&p.team!=null&&!p.foreign&&optEarned(p)&&p.opt.paidY!==G.year){ payOut(p.team,p.opt.a,'rel'); if(p.team===G.user)addLog(`${p.name}이(가) 이미 달성한 성과 옵션 ${money(p.opt.a)}을(를) 트레이드와 함께 지급합니다.`); } }catch(e){} termsClear(p); }
function termsClear(p){ delete p.capB; delete p.opt; delete p.ntc; delete p.roleProm; delete p.ctT; delete p.cOpt; delete p.pOut; delete p.ctB; delete p.cOptAdd; }
/* 옵트아웃을 넣을 수 있는 해: 그 시즌을 마쳤을 때 FA 자격(등록 연수)이 생기는 해부터. 비FA 다년계약에서 자격 전 옵트아웃은 FA로 나갈 수 없어 막는다.
   st: 계약 첫 시즌(지금 시즌이면 0, 다음 시즌 시작이면 1을 더한다) */
function pOutMin(p,st){ const add=st!=null&&st>G.year?1:0; return Math.max(1,faSvc(p)-(p.svc||0)-add); } /* 계약 몇 시즌을 마치면 FA 자격(등록 연차)이 되는가: 남은 연차에서 계약 시작 전에 채울 올 시즌을 뺀다(검수 11-06: 하나 더 세어 첫해 옵트아웃이 막혔다) */
const ctOn=p=>p&&p.ctT!=null&&p.ctT===p.team;
/* 옵션 판단: 선수는 시장 가치가 지금 연봉보다 15% 넘게 높고 33세 이하면 옵트아웃한다. AI 구단은 시장 가치가 옵션 연봉의 90% 이상이면 연장 옵션을 실행한다 */
function pOutDecide(p){ return p.age<=33&&(p.svc||0)>=faSvc(p)&&marketSal(projO(p,1))>=p.sal*1.15; } /* FA 자격이 있어야 나간다 */
function cOptAI(p){ return p.age<=36&&marketSal(projO(p,1))>=p.cOpt.a*.9; }
/* 정규시즌이 끝나면 우리 선수의 구단 연장 옵션을 묻는다(스토브리그 계약 정리 전에 정한다) */
function cOptAsk(){ if(G.unemp)return; for(const p of Object.values(G.players).filter(q=>q.team===G.user&&!(q.joinY>G.year))){ /* 계약 결정 대상은 '출전 가능한 선수'가 아니라 구단이 계약을 가진 선수 전부(군 복무 중 포함) */ if(!p.faC||(p.yrs||0)!==1||!ctOn(p)||!p.cOpt||p.cOpt.used||p.cOpt.dec!=null)continue; const v=marketSal(projO(p,1)); const rec=cOptAI(p);
    evNew('copt',`${p.name} 구단 연장 옵션`,`${p.name}(${posLabel(p)}, ${p.age}세)의 보장 계약이 올 시즌으로 끝납니다. 계약에 구단 연장 옵션 ${p.cOpt.y}년(연 ${money(p.cOpt.a)})이 있습니다. 운영팀이 본 시장 가치는 연 ${money(v)} 안팎입니다.${milServing(p)?` 지금 군 복무 중이며 ${dmd(p.mil.until)} 전역 예정입니다.`:''}${(p.svc||0)<faSvc(p)?' FA 자격 전이라 옵션을 포기해도 FA가 아니라 보류 선수로 남아 연봉 협상을 합니다.':''}`,
      [{l:`옵션 실행: ${p.cOpt.y}년 연 ${money(p.cOpt.a)} 연장`,fx:'같은 연봉으로 계약이 늘어납니다.'},{l:'옵션 포기',fx:copFA(p)?'시즌 뒤 FA 시장으로 나갑니다(FA 재자격 기간과 상관없이).':'FA 자격 전이라 보류 선수로 남아 연봉 협상을 합니다.'}],{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id},def:rec?0:1,exp:12}); } }
/* 옵션 포기 뒤 FA가 되는가: 스토브리그와 같이 올해 등록 연차(등록일수 145일 또는 누적)까지 더해서 본다 */
function copFA(p){ let c=0; try{ c=faSvcOk(p)?1:0; }catch(e){} return (p.svc||0)+c>=faSvc(p); }
EVH.copt={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||!p.cOpt||p.team!==G.user)return ''; p.cOpt.dec=i===0; return i===0?`${p.name} 구단 옵션을 실행하기로 했습니다(스토브리그 때 반영).`:`${p.name} 구단 옵션을 포기하기로 했습니다. ${copFA(p)?'시즌 뒤 FA가 됩니다.':'FA 자격 전이라 보류 선수로 남아 연봉 협상을 합니다.'}`; } };
function termsApply(p,t,from,sy,noPay){ termsClear(p); if(!t)return; const y=Math.max(1,t.years); sy=sy??ctSeason(); const end=sy+y-1; p.ctT=p.team;
  if(t.bonus>0){ if(!noPay){ G.spend=G.spend||{}; G.spend.faB=(G.spend.faB||0)+t.bonus; } p.capB={a:Math.round(t.bonus/y),until:end,b:t.bonus,pd:noPay?-1:finYearEnd()}; } /* b: 계약금 전액, pd: 지급한 회계연도(결산일). 미리 준 계약금(다음 시즌 시작 다년계약)은 -1 */
  if(t.opt>0)p.opt={a:t.opt,until:end,c:optCrit(p)}; else delete p.opt; /* 달성 기준은 계약 때 보직으로 고정 */
  if(t.ntc)p.ntc=end; else delete p.ntc;
  if(t.cOpt>0)p.cOpt={y:t.cOpt,a:t.annual,at:end}; /* 구단 연장 옵션: 보장 마지막 시즌(at) 뒤 구단이 같은 연봉으로 y년 연장할지 정한다 */
  if(t.pOut>0&&t.pOut<y&&t.pOut>=pOutMin(p,sy))p.pOut={y:sy+t.pOut-1}; /* FA 자격이 생기는 해부터만 효력 */
  if(t.bonus>0)p.ctB={b:t.bonus,sy}; /* 계약 총액 기록용 계약금(상한 반영 기간이 끝나도 총액에서 빠지지 않게) */ /* 선수 옵트아웃: y시즌을 마친 뒤 남은 계약을 버리고 FA로 나갈 수 있다 */
  if(t.role===0)p.roleProm={k:0,t:p.isP?(isSPr(p)?'SP':'RP'):'B',until:sy+Math.min(y,2)-1,l:roleSet(p)[0],from:from||'fa'}; else delete p.roleProm; }
function capBOf(p){ return ctOn(p)&&p.capB&&p.capB.until>=G.year?p.capB.a:0; }
/* 예산 전망용 옵션 예상액: 시즌 중엔 지금 페이스로, 개막 전·비시즌엔 주전이면 달성한다고 본다 */
function optProj(tid,y){ let s=0; for(const p of Object.values(G.players)){ if(p.team!==tid||p.joinY>G.year||!ctOn(p)||!p.opt||p.opt.until<y)continue; if(isAway(p)){ if(y===G.year&&optEarned(p))s+=p.opt.a; continue; } const h=y===G.year?seasonTotal(p,G.year,'1군'):null; const r=G.sea&&G.sea.rec&&G.sea.rec[tid]; const g=r?r.w+r.l+(r.t||0):0;
  const oc=OPT_CRIT[p.opt.c||optCrit(p)]; const ok=h&&g>=20?(h[oc[0]]||0)*144/g>=oc[1]:isRegular(p); if(ok)s+=p.opt.a; } return s; }
/* 옵션 달성 기준: 타자 400타석, 선발 120이닝, 불펜 50이닝(규정 달성형 옵션을 단순화) */
/* 옵션 기준: 계약 때 보직(b 타자 400타석 · sp 선발 120이닝 · rp 불펜 50이닝). 저장된 기준이 없으면(예전 계약) 지금 보직 */
function optCrit(p){ return p.isP?(isSPr(p)?'sp':'rp'):'b'; }
const OPT_CRIT={b:['pa',400,'400타석'],sp:['outs',360,'120이닝'],rp:['outs',150,'50이닝']};
function optEarned(p){ if(!ctOn(p)||!p.opt||p.opt.until<G.year)return false; const h=seasonTotal(p,G.year,'1군'); if(!h)return false; const c=OPT_CRIT[p.opt.c||optCrit(p)]; return (h[c[0]]||0)>=c[1]; }
function optSettle(tid){ let tot=0; const L=[]; for(const p of Object.values(G.players)){ if(p.team!==tid||p.joinY>G.year)continue; /* 시즌 중 입대·대표팀으로 빠진 선수도 이미 달성한 옵션은 받는다 */ if(!ctOn(p)||!p.opt||p.opt.until<G.year||p.opt.paidY===G.year)continue; /* 방출 때 이미 준 옵션은 다시 주지 않는다 */ if(optEarned(p)){ tot+=p.opt.a; L.push(`${p.name} ${money(p.opt.a)}`); story(p,`계약 옵션 달성 (${money(p.opt.a)})`,'move'); } }
  if(L.length&&tid===G.user)note('운영팀',`계약 옵션 지급: ${L.join(', ')}`); return tot; }
/* 역할 약속 점검(6~9월 매달 1일): 주전 보장을 약속했는데 주전이 아니면 서운해한다 */
/* 약속 종류별 확인: 선발 보장=선발 로테이션, 필승조 보장=마무리·셋업(불펜 앞 4명), 주전 보장=야수 주전 배치. 옛 저장은 약속 문구로 종류를 읽는다 */
function promKind(r){ return r.t||(r.l===ROLE_L.SP[0]?'SP':r.l===ROLE_L.RP[0]?'RP':'B'); }
function promKept(p,r,d){ d=d||depth(p.team); const has=a=>(a||[]).some(x=>x&&x.id===p.id); const k=promKind(r); return k==='SP'?has(d.sp):k==='RP'?has((d.pen||[]).slice(0,4)):has(d.start); }
function roleNowTxt(p,d){ d=d||depth(p.team); const has=a=>(a||[]).some(x=>x&&x.id===p.id); return has(d.sp)?'선발 로테이션':(d.pen||[])[0]&&d.pen[0].id===p.id?'마무리':has((d.pen||[]).slice(1,4))?'셋업':has(d.pen)?'불펜':has(d.start)?'주전':'벤치·2군'; }
function rolePromCheck(mo){ if(mo<6||mo>9||period()!=='season'||G.unemp)return; for(const p of playersOf(G.user)){ const r=p.roleProm; if(!ctOn(p)||!r||r.until<G.year||p.injOut>0||!healthy(p)||isAway(p))continue; /* 징계·미계약·대표팀·군 복무로 못 뛰는 동안은 약속 위반이 아니다(사용자 피드백 11-06) */ const d=depth(p.team); if(promKept(p,r,d))continue; const now=roleNowTxt(p,d);
  p.mor=clamp((p.mor??60)-6,0,100); try{ if(hasAgent(p))agRelAdd(agentOf(p),-1,`${p.name} 역할 약속 불이행`); }catch(e){}
  if(r.warn!==G.year){ r.warn=G.year; mail(hasAgent(p)?`${agentOf(p).name} 에이전트`:'선수단',`${p.name} 측: "${r.l} 약속은 어디 갔습니까"`,`계약할 때 ${r.l}을(를) 약속했는데 지금은 ${now}(으)로 뛰고 있습니다. 약속이 지켜지지 않으면 매달 선수 기분이 떨어지고 에이전트와의 관계도 나빠집니다.`,{kind:'면담',imp:true,ref:p.id,acts:[{l:'선수 보기',a:'player',v:p.id},{l:'감독실 들어가기',a:'meetOpen',v:'mgr'}]}); } } }
/* 거부권은 계약한 구단에 있는 동안 유효하다(우리 선수든 상대 선수든) */
function ntcOf(ids){ return ids.map(id=>G.players[id]).find(p=>p&&ctOn(p)&&p.ntc&&p.ntc>=G.year)||null; }
const hasNtc=p=>ctOn(p)&&p.ntc>=G.year;
/* 계약 금액 표기 통일: 그 시즌 현금 지출(연봉 + 그 회계연도에 준 계약금) · 보장 총액(계약금 + 연봉×기간) · 연평균(상한 반영 = 연봉 + 계약금/기간) */
function ctMoney(p){ if(!p||!p.faC||!ctOn(p))return null; const c=ctInfo(p); const yrs=c?c.tot:Math.max(1,p.yrs||1); const sy=ctSeason(); const B=p.capB&&p.capB.until>=sy?p.capB:null;
  const bTot=p.ctB?p.ctB.b:B?(B.b??B.a*yrs):0; const first=B?B.until-yrs+1:sy-(c?c.k-1:0); /* 계약금은 상한 반영 기간이 끝나도 계약 총액에 남는다 */
  const bNow=B&&(B.pd!=null?(B.pd>=0&&dobj(B.pd).y===dobj(finYearEnd()).y):first===sy)?bTot:0;
  return {sy,yrs,bTot,bNow,cash:p.sal+bNow,tot:bTot+p.sal*yrs,add:p.cOptAdd||null,avg:p.sal+(B?B.a:0),opt:p.opt&&p.opt.until>=sy?p.opt.a:0}; }
function ctMoneyTxt(p){ const m=ctMoney(p); if(!m)return ''; return `${m.sy}시즌 현금 지출 ${money(m.cash)}${m.bNow?`(계약금 ${money(m.bNow)} 포함)`:''} · 보장 총액 ${money(m.tot)} · 연평균 ${money(m.avg)}(상한 반영)${m.opt?` · 옵션 최대 연 ${money(m.opt)}`:''}`; }
/* FA 체결 기록(rec) 기준: 계약금은 계약할 때 지급하므로 첫 시즌 현금에 들어간다 */
function ctRecMoney(r){ const t=r.terms; const y=Math.max(1,r.years||1); const b=t?(t.bonus||0):0; const an=t?t.annual:r.annual;
  const tot=b+an*y, avg=an+Math.round(b/y), cash=an+b;
  return {tot,avg,cash,txt:`첫 시즌 현금 지출 ${money(cash)}${b?`(계약금 ${money(b)} 포함)`:''} · 보장 총액 ${money(tot)} · 연평균 ${money(avg)}(상한 반영)`}; }
function ctRecShort(r){ if(!r.terms||!r.terms.bonus)return `${r.years}년 연 ${money(r.annual)}`; const m=ctRecMoney(r); return `${r.years}년 총액 ${money(m.tot)} · 연평균 ${money(m.avg)}`; }
