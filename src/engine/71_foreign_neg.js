/* ===== 외국인 선수 협상: 보장 연봉 + 인센티브, 다른 구단과의 경쟁, 우리 구단 매력 =====
 신규 외국인 계약은 1인 100만 달러(아시아쿼터 20만 달러) 상한이 있어서, 돈만으로는 차이를 크게 벌릴 수 없다.
 선수는 보장액을 인센티브보다 훨씬 크게 본다(인센티브는 55% 가치). 같은 금액이면 구단 매력이 높은 쪽을 고른다.
 - 구단 매력: 명성, 우승 가능성, 출전 기회(같은 자리 경쟁), 도시 규모, 외국인 선수 대우(재계약해 오래 뛴 외국인), 우리 해외 스카우트망(에이전트 인맥)
 - 다른 구단: 이 선수를 노리는 구단은 보장 85% + 인센티브 15% 수준으로 요구액을 맞춰 준다.
 - 우리 제안의 값(보장 + 인센티브 x 0.55) x 우리 매력이 선수 기준선과 가장 강한 경쟁 구단 제안보다 높으면 사인한다.
 - 처음 제안하면 에이전트가 경쟁 상황을 알려 주고 3일을 기다려 준다. 그 안에 못 잡으면 가장 강한 경쟁 구단으로 간다. */
const FO_INC_W=.55;
function foCap(q){ return q.foreign==='아시아'?ASIA_CAP:F_NEW_CAP; }
function foRep(tid){ const L=foreignOf(tid).filter(p=>p.foreign==='용병'||p.foreign==='아시아'); return L.filter(p=>p.fy!=null&&p.fy<=G.year-1).length; }
function foAppeal(q,tid){ const t=team(tid); const P=[]; let C=null; try{ C=faCtx(); }catch(e){}
  const pres=C?C.pres[tid]:clubPrestige(tid); P.push([`구단 명성 ${starTxt(prestigeStars(pres))}`,(pres-55)/400]);
  const rk=C?C.rank[tid]||5.5:5.5; P.push(['우승 가능성',.03*(5.5-rk)/4.5]);
  let pt=0; if(C){ const s=C.slot[tid]||{}; if(q.isP)pt=spV(q)>(s.SP5||0)+1?.03:-.01; else { const inc=s[q.pos]; pt=inc==null?.03:ovr(q)>inc+2?.03:ovr(q)<inc-4?-.04:0; } } P.push(['출전 기회',pt]);
  P.push([`도시 규모`,((t.market||1)-1)*.08]);
  const rep=foRep(tid); if(rep)P.push([`외국인 대우(재계약한 외국인 ${rep}명)`,Math.min(.045,rep*.015)]);
  if(tid===G.user){ try{ const lv=intlLv(q.orig==='la'?'la':q.orig==='jp'?'jp':q.orig==='tw'?'tw':q.orig==='au'?'au':'us'); if(lv>0)P.push(['해외 스카우트망(에이전트 인맥)',Math.min(.04,lv*.02)]); }catch(e){} }
  const f=clamp(1+sum(P.map(x=>x[1])),.85,1.2); return {f,parts:P.filter(x=>Math.abs(x[1])>=.003)}; }
function foRivalTeams(q){ const L=[]; for(const t of G.teams){ if(t.id===G.user)continue; const nd=fNeed(t.id); if(!nd||!fKnows(t.id,q)||nd.kind!==q.foreign||(nd.isP!=null&&nd.isP!==q.isP)||foreignCheck(t.id,q))continue;
    const top=(G.fmarket||[]).map(id=>G.players[id]).filter(x=>x&&x.team==null&&fKnows(t.id,x)&&x.foreign===nd.kind&&(nd.isP==null||x.isP===nd.isP)).sort((a,b)=>fScoreBy(t.id,b)-fScoreBy(t.id,a)).slice(0,3); if(top.includes(q))L.push(t.id); } return L; }
function foVal(g,i){ return g+i*FO_INC_W; }
/* 경쟁 구단 제안(가장 강한 순) */
function foRivals(q){ const cap=foCap(q); return foRivalTeams(q).map(tid=>{ const tot=Math.min(cap,Math.round(q.ask*(1+.03*hn('fr'+tid,q.id)))); const g=Math.round(tot*.85/USD)*USD, i=Math.max(0,tot-g); const A=foAppeal(q,tid); return {tid,g,i,f:A.f,parts:A.parts,v:foVal(g,i)*A.f}; }).sort((a,b)=>b.v-a.v); }
/* 선수가 받아들이는 기준: 요구액을 보통 구단에서 보장 85% + 인센티브 15%로 받는 정도 */
function foFloor(q){ return foVal(q.ask*.85,q.ask*.15)*.98; }
function foNeg(q){ q.fneg=q.fneg||{n:0,mood:70,since:G.day,wk:G.day}; if(G.day-q.fneg.wk>=7){ q.fneg.wk=G.day; q.fneg.n=0; } return q.fneg; }
/* 이기려면 필요한 보장액(인센티브 i 고정). 한도를 넘으면 null */
function foNeedG(q,i,target,f){ const g=Math.ceil((target/f-i*FO_INC_W)/USD)*USD; /* 1만 달러 단위로 올림 */ return g+i<=foCap(q)?Math.max(g,MIN_SAL):null; }
function foOffer(id,g,i){ const q=G.players[id]; if(!q||q.team!=null)return {ok:false,msg:'이미 다른 곳과 계약했습니다.'}; if(!foreignOpen())return {ok:false,msg:'지금은 외국인 선수를 영입할 수 없습니다.'};
  g=Math.round(g); i=Math.round(Math.max(0,i)); const cap=foCap(q); if(g+i>cap)return {ok:false,msg:`신규 계약은 보장과 인센티브를 합쳐 ${Math.round(cap/USD)}만 달러(${money(cap)})까지입니다.`};
  const ask0=q.ask; q.ask=g+i; const err=foreignCheck(G.user,q); q.ask=ask0; if(err)return {ok:false,msg:err};
  if(period()==='season'&&(G.sea.repl[G.user]||0)>=F_REPL_MAX)return {ok:false,msg:'이번 시즌 외국인 교체 횟수를 다 썼습니다.'};
  const N=foNeg(q); if(N.cool>G.day)return {ok:false,msg:`${q.name} 측이 ${dmd(N.cool)}까지 협상을 쉬자고 합니다.`}; if(N.n>=3)return {ok:false,msg:`이번 주 제안은 세 번까지입니다. ${dmd(N.wk+7)}에 다시 제안할 수 있습니다.`};
  N.n++; const me=foAppeal(q,G.user); const v=foVal(g,i)*me.f; const R0=foRivals(q); const best=R0[0]; const floor=foFloor(q); const target=Math.max(floor,best?best.v*1.01:0);
  const riv=best?`${R0.length}개 구단이 관심을 보이고 있고, 가장 적극적인 곳은 ${tshort(best.tid)}(보장 ${usdT(best.g)} + 인센티브 ${usdT(best.i)}, 구단 매력 ${Math.round((best.f-1)*100)>=0?'+':''}${Math.round((best.f-1)*100)}%)입니다.`:'아직 다른 구단 제안은 없습니다.';
  if(v>=target){ delete q.fneg; signForeignT(G.user,id,g,i); return {ok:true,msg:`${q.name} 측이 사인했습니다. 보장 ${usdT(g)}(${money(g)})${i?` + 인센티브 ${usdT(i)}`:''}.${best?` ${tshort(best.tid)}도 노렸지만 우리를 택했습니다.`:''}`}; }
  /* 낮게 부르면 분위기가 나빠진다 */
  const r=v/target; if(r<.85){ N.mood-=12; } else if(r<.95)N.mood-=4;
  if(N.mood<40){ N.cool=G.day+7; N.mood=55; return {ok:false,msg:`${q.name} 측: "조건 차이가 너무 큽니다. 일주일 뒤에 다시 이야기하시죠." ${riv}`}; }
  if(best&&!N.dl){ N.dl=G.day+3; N.dlT=best.tid; }
  const ng=foNeedG(q,i,target,me.f), ng0=i>0?foNeedG(q,0,target,me.f):null;
  const why=best&&best.v>floor?`${tshort(best.tid)} 조건이 더 좋습니다`:'요구 조건에 못 미칩니다';
  const how=ng!=null?`${i>0?'인센티브를 그대로 두면 ':''}보장 ${usdT(ng)}(${money(ng)}) 이상이면 사인하겠다고 합니다.${ng0!=null&&ng0<ng+i?` 인센티브를 빼면 보장 ${usdT(ng0)}로도 됩니다.`:''}`:ng0!=null?`보장을 늘리고 인센티브를 줄여야 합니다. 인센티브 없이 보장 ${usdT(ng0)}면 사인합니다.`:`상한 ${Math.round(cap/USD)}만 달러 안에서는 ${best?tshort(best.tid)+' 조건을':'요구 조건을'} 넘기 어렵습니다. 우리 구단 매력이 부족합니다.`;
  return {ok:false,need:ng,msg:`${q.name} 측: ${why}. ${how} ${riv}${N.dl?` ${dmd(N.dl)}까지 답을 기다려 준다고 합니다.`:''}`}; }
/* 계약 반영: 보장은 연봉, 인센티브는 계약 옵션(규정 출전을 채우면 시즌 결산에 지급) */
function signForeignT(tid,id,g,i){ const p=G.players[id]; const a0=p.ask; p.ask=g; signForeign(tid,id); p.ask=a0; p.sal=g; if(i>0){ p.ctT=p.team; p.opt={a:i,until:p.fy}; }
  if(tid===G.user)story(p,`계약 조건: 보장 ${money(g)}${i?` + 인센티브 ${money(i)}(규정 출전 시)`:''}`,'move'); }
/* 기다려 준 기한이 지나면 가장 강한 경쟁 구단으로 간다 */
function foDaily(){ for(const id of [...(G.fmarket||[])]){ const q=G.players[id]; if(!q||q.team!=null||!q.fneg||!q.fneg.dl||q.fneg.dl>=G.day)continue; const dl=q.fneg.dl; delete q.fneg.dl;
    const R0=foRivals(q); const b=R0[0]; if(!b||!foreignOpen())continue; aiForeignSign(b.tid,q); note('외국인',`${q.name}이(가) ${tname(b.tid)}과(와) 계약했습니다. ${dmd(dl)}까지 기다려 줬지만 우리 조건이 ${tshort(b.tid)}보다 못했습니다.`); } }
/* AI 구단은 우리와 협상 중인(기다려 주는) 선수를 그 기간에는 데려가지 않는다 */
function foHeld(q){ return q&&q.fneg&&q.fneg.dl&&q.fneg.dl>=G.day; }
const usdT=v=>`${Math.round(v/USD)}만 달러`;

/* ===== 우리 외국인 선수 재계약과 보류권 =====
 실제 규정(외국인 선수 고용 규정 '독점 교섭 기간: 보류권'): 원소속 구단이 재계약을 제안했는데 선수가 받아들이지 않으면 5년 동안 국내 다른 구단에 입단할 수 없다.
 원소속 구단이 동의(보류권 해제)하면 다른 구단과 계약할 수 있다. 그래서 재계약 협상의 경쟁 상대는 국내 구단이 아니라 해외(일본·미국) 제안뿐이다.
 - 재계약은 1인 100만 달러 상한이 없고, 3명 총액 한도만 있다.
 - 선수는 국내에 남으려면 우리와 계약해야 하므로, 해외 제안이 없으면 요구액보다 조금 낮아도 받아들인다(적응력·충성심이 높을수록).
 - 결별할 때 보류권을 쥐고 있으면 그 선수는 해외로 떠나고, 풀어 주면 시장에 나와 다른 구단이 데려갈 수 있다. */
function foReOut(p){ const C=G.contract; const y=C?C.y:G.year; if(p.fout&&p.fout.y===y)return p.fout; const h=seasonTotal(p,y,'1군'); const war=h?warOf(h,p):0; let o=null;
  if(war>=3&&p.age<=33&&R()<.55)o={k:R()<.7?'일본':'미국',v:Math.round(p.newSal*rnd(1.05,1.45))};
  else if(war>=1.5&&p.age<=32&&R()<.25)o={k:R()<.6?'일본':'대만',v:Math.round(p.newSal*rnd(.8,1.05))};
  p.fout=o?Object.assign(o,{y}):{y,none:true}; return p.fout; }
function foReComfort(p){ initPers(p); return clamp(1+((p.adapt||50)-50)/500+(p.rsy||0)*.01+((p.pers.loy||10)-10)*.004,.95,1.12); }
function foReFloor(p){ initPers(p); const O=foReOut(p); const stay=p.newSal*clamp(.9-((p.pers.loy||10)-10)*.01-((p.adapt||50)-50)/1000,.78,.95); return Math.max(stay,O&&!O.none?O.v*.97:0); }
function foReOffer(id,g,i){ const C=G.contract; const p=G.players[id]; if(!C||C.done||!p||!C.foreignEnd.includes(id))return {ok:false,msg:'재계약 기간이 아닙니다.'};
  if(C.foreignDrop.includes(id))return {ok:false,msg:'이미 결별하기로 한 선수입니다.'}; C.fre=C.fre||{}; const N=C.fre[id]=C.fre[id]||{n:0,mood:70};
  if(N.ok)return {ok:false,msg:'이미 합의했습니다.'}; if(N.n>=3)return {ok:false,msg:'재계약 제안은 세 번까지입니다.'};
  g=Math.round(g); i=Math.round(Math.max(0,i)); N.n++; const f=foReComfort(p); const v=foVal(g,i)*f; const target=foReFloor(p); const O=foReOut(p);
  const out=O&&!O.none?`${O.k} 구단이 ${usdT(O.v)} 수준을 제시했다고 합니다.`:'해외 제안은 없다고 합니다. 국내 다른 구단은 보류권 때문에 접촉할 수 없습니다.';
  if(v>=target){ N.ok=true; p.newSal=g; if(i>0)p.fInc=i; else delete p.fInc; return {ok:true,msg:`${p.name} 측이 재계약에 합의했습니다. 보장 ${usdT(g)}(${money(g)})${i?` + 인센티브 ${usdT(i)}`:''}. ${O&&!O.none?out:''}`}; }
  const r=v/target; N.mood-=r<.85?15:r<.95?6:2;
  if(N.mood<40||N.n>=3){ C.foreignDrop.includes(id)||C.foreignDrop.push(id); p.fleft=true; return {ok:false,msg:`${p.name} 측이 재계약을 거절했습니다. ${out} 보류권은 우리에게 있으니 5년 동안 국내 다른 구단에는 갈 수 없고, ${O&&!O.none?O.k+'으로':'해외로'} 떠납니다.`}; }
  const need=Math.ceil((target/f-i*FO_INC_W)/USD)*USD; return {ok:false,need,msg:`${p.name} 측: 보장 ${usdT(need)}(${money(need)})${i?` + 인센티브 ${usdT(i)}`:''} 이상이면 사인하겠다고 합니다. ${out} 남은 제안 ${3-N.n}번.`}; }
/* 보류 명단: 보류권을 쥐고 결별한 외국인(5년간 국내 다른 구단 입단 불가) */
function foResAdd(p,tid){ G.fRes=(G.fRes||[]).filter(x=>x.until>=G.year); G.fRes.unshift({name:p.name,pos:posLabel(p),nat:p.nat,tid,y:G.year,until:G.year+5}); if(G.fRes.length>40)G.fRes.length=40; }
