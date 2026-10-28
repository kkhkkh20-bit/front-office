/* ---------- 계약 조건 묶음(협상 테이블): 역할 약속 · 기간 · 계약금 · 연봉 · 옵션 · 트레이드 거부권 ----------
   선수와 에이전트는 묶음 전체를 '환산 연봉'으로 비교한다. 계약금은 한 번에 받는 보장액이라 조금 더 쳐 주고(×1.06),
   옵션은 못 받을 수도 있어 절반 아래로 본다(×0.45). 역할 약속을 요구보다 낮추면 크게 깎고, 거부권을 빼면 조금 깎는다.
   실제 KBO FA 계약도 '4년 총액 = 계약금 + 연봉 + 옵션'으로 발표하고, 경쟁균형세 계산에는 계약금을 연평균으로 나눠 넣는다 */
const CT_BON=1.06, CT_OPT=.45;
const ROLE_L={B:['주전 보장','주전 경쟁','백업'],SP:['선발 로테이션 보장','선발 경쟁','불펜'],RP:['필승조 보장','불펜 경쟁','추격조']};
function roleSet(p){ return p.isP?(isSPr(p)?ROLE_L.SP:ROLE_L.RP):ROLE_L.B; }
function termsEq(t){ const y=Math.max(1,t.years||1); return (t.annual||0)+(t.bonus||0)*CT_BON/y+(t.opt||0)*CT_OPT; }
function termsMul(t,d){ let m=1; if(t.role!=null&&d&&d.role!=null){ const g=t.role-d.role; m*=g>0?1-.07*g:1-.02*g; }
  if(d&&d.ntc&&!t.ntc)m*=.95; else if(t.ntc&&!(d&&d.ntc))m*=1.01; return m; }
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
function termsTxt(t,short){ const L=[`${t.years}년`]; if(t.bonus)L.push(`계약금 ${money(t.bonus)}`); L.push(`연봉 ${money(t.annual)}`); if(t.opt)L.push(`옵션 연 ${money(t.opt)}`);
  if(!short){ const tot=(t.bonus||0)+t.annual*t.years; L.push(`보장 총액 ${money(tot)}${t.opt?` (옵션 포함 최대 ${money(tot+t.opt*t.years)})`:''}`); } return L.join(' · '); }
/* 계약 반영: 계약금은 바로 지급(올해 지출), 상한 계산에는 연평균으로 들어간다. 옵션은 시즌 뒤 달성하면 지급 */
function termsApply(p,t,from,sy){ if(!t)return; const y=Math.max(1,t.years); sy=sy??ctSeason(); const end=sy+y-1;
  if(t.bonus>0){ G.spend=G.spend||{}; G.spend.faB=(G.spend.faB||0)+t.bonus; p.capB={a:Math.round(t.bonus/y),until:end}; }
  if(t.opt>0)p.opt={a:t.opt,until:end}; else delete p.opt;
  if(t.ntc)p.ntc=end; else delete p.ntc;
  if(t.role===0)p.roleProm={k:0,until:sy+Math.min(y,2)-1,l:roleSet(p)[0],from:from||'fa'}; else delete p.roleProm; }
function capBOf(p){ return p.capB&&p.capB.until>=G.year?p.capB.a:0; }
/* 옵션 달성 기준: 타자 400타석, 선발 120이닝, 불펜 50이닝(규정 달성형 옵션을 단순화) */
function optEarned(p){ if(!p.opt||p.opt.until<G.year)return false; const h=seasonTotal(p,G.year,'1군'); if(!h)return false; return p.isP?(isSPr(p)?h.outs>=360:h.outs>=150):h.pa>=400; }
function optSettle(tid){ let tot=0; const L=[]; for(const p of playersOf(tid)){ if(!p.opt||p.opt.until<G.year)continue; if(optEarned(p)){ tot+=p.opt.a; L.push(`${p.name} ${money(p.opt.a)}`); story(p,`계약 옵션 달성 (${money(p.opt.a)})`,'move'); } }
  if(L.length&&tid===G.user)note('운영팀',`계약 옵션 지급: ${L.join(', ')}`); return tot; }
/* 역할 약속 점검(6~9월 매달 1일): 주전 보장을 약속했는데 주전이 아니면 서운해한다 */
function rolePromCheck(mo){ if(mo<6||mo>9||period()!=='season'||G.unemp)return; for(const p of playersOf(G.user)){ const r=p.roleProm; if(!r||r.until<G.year||p.injOut>0)continue; if(isRegular(p))continue;
  p.mor=clamp((p.mor??60)-6,0,100); try{ if(hasAgent(p))agRelAdd(agentOf(p),-1,`${p.name} 역할 약속 불이행`); }catch(e){}
  if(r.warn!==G.year){ r.warn=G.year; mail(hasAgent(p)?`${agentOf(p).name} 에이전트`:'선수단',`${p.name} 측: "${r.l} 약속은 어디 갔습니까"`,`계약할 때 ${r.l}을(를) 약속했는데 지금 주전으로 뛰지 못하고 있습니다. 약속이 지켜지지 않으면 매달 선수 기분이 떨어지고 에이전트와의 관계도 나빠집니다.`,{kind:'면담',imp:true,ref:p.id,acts:[{l:'선수 보기',a:'player',v:p.id},{l:'감독실 들어가기',a:'meetOpen',v:'mgr'}]}); } } }
function ntcOf(ids){ return ids.map(id=>G.players[id]).find(p=>p&&p.ntc&&p.ntc>=G.year&&p.team===G.user)||null; }
