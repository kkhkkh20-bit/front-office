/* ===== 외국인 선수 협상: 보장 연봉 + 인센티브, 다른 구단과의 경쟁, 우리 구단 매력 =====
 신규 외국인 계약은 1인 100만 달러(아시아쿼터 20만 달러) 상한이 있어서, 돈만으로는 차이를 크게 벌릴 수 없다.
 선수는 보장액을 인센티브보다 훨씬 크게 본다(인센티브는 55% 가치). 같은 금액이면 구단 매력이 높은 쪽을 고른다.
 - 구단 매력: 명성, 우승 가능성, 출전 기회(같은 자리 경쟁), 도시 규모, 외국인 선수 대우(재계약해 오래 뛴 외국인), 우리 해외 스카우트망(에이전트 인맥)
 - 다른 구단: 이 선수를 노리는 구단은 보장 85% + 인센티브 15% 수준으로 요구액을 맞춰 준다.
 - 우리 제안의 값(보장 + 인센티브 x 0.55) x 우리 매력이 선수 기준선과 가장 강한 경쟁 구단 제안보다 높으면 사인한다.
 - 처음 제안하면 에이전트가 경쟁 상황을 알려 주고 3일을 기다려 준다. 그 안에 못 잡으면 가장 강한 경쟁 구단으로 간다. */
const FO_INC_W=.55;
function foCap(q){ return q.foreign==='아시아'?asiaCap():fNewCap(); }
function foRep(tid){ const L=foreignOf(tid).filter(p=>p.foreign==='용병'||p.foreign==='아시아'); return L.filter(p=>p.fy!=null&&p.fy<=G.year-1).length; }
/* 선수 선호(사람마다 하나): 우승·도시(수도권)·출전 기회·돈·보류권 해제(다음 해 자유) 중 무엇을 크게 보는지. 에이전트가 알려 준다 */
const FO_PREF={win:'우승 가능성을 가장 중시',city:'수도권·큰 도시를 선호',play:'확실한 주전 자리를 원함',money:'돈(보장액)을 가장 중시',free:'1년 뒤 자유(보류권 해제 조항)를 원함'};
function foPref(q){ if(!q.fpref){ const k=['win','city','play','money','free']; q.fpref=k[Math.floor(u01('fpref',q.id)*k.length)%k.length]; } return q.fpref; }
function foAppeal(q,tid,o){ o=o||{}; const t=team(tid); const P=[]; let C=null; try{ C=faCtx(); }catch(e){} const pf=foPref(q), W=k=>pf===k?2:1;
  const pres=C?C.pres[tid]:clubPrestige(tid); P.push([`구단 명성 ${starTxt(prestigeStars(pres))}`,(pres-55)/400]);
  const rk=C?C.rank[tid]||5.5:5.5; P.push(['우승 가능성',.03*(5.5-rk)/4.5*W('win')]);
  let pt=0; if(C){ const s=C.slot[tid]||{}; if(q.isP)pt=spV(q)>(s.SP5||0)+1?.03:-.01; else { const inc=s[q.pos]; pt=inc==null?.03:ovr(q)>inc+2?.03:ovr(q)<inc-4?-.04:0; } } P.push(['출전 기회',pt*W('play')]);
  P.push([`도시 규모`,((t.market||1)-1)*.08*W('city')]); if((TEAM_DEF[tid]||{}).region==='수도권')P.push(['수도권 구단',.015*(pf==='city'?2.5:1)]);
  const rep=foRep(tid); if(rep)P.push([`외국인 대우(재계약한 외국인 ${rep}명)`,Math.min(.045,rep*.015)]);
  if(tid===G.user){ try{ const lv=intlLv(q.orig==='la'?'la':q.orig==='jp'?'jp':q.orig==='tw'?'tw':q.orig==='au'?'au':'us'); if(lv>0)P.push(['해외 스카우트망(에이전트 인맥)',Math.min(.04,lv*.02)]); }catch(e){} }
  /* 에이전트 친분: 우리 구단은 실제 관계(협상·계약 이력), 다른 구단은 구단마다 조금씩 다르다 */
  if(tid===G.user){ try{ const ag=agentOf(q), r=agRel(ag); if(r!==50)P.push([`에이전트 ${ag.name} 친분(${agRelLab(r)})`,(r-50)/50*.04]); }catch(e){} } else P.push(['에이전트 친분',hn('fag'+tid,q.id)*.012]);
  if(o.rel)P.push(['보류권 해제 조항',.025*(pf==='free'?2.2:1)]);
  let f=1+sum(P.map(x=>x[1])); if(pf==='money')f=1+(f-1)*.5; /* 돈을 중시하는 선수는 구단 매력을 덜 본다 */
  f=clamp(f,.85,1.25); return {f,parts:P.filter(x=>Math.abs(x[1])>=.003),pref:pf}; }
/* 이 후보를 노리는 다른 구단: AI 영입 후보 상위 3명(fTop3, 계약할 수 있는 후보만)에 든 구단과, 관찰 명단 끼어들기를 일으킨 구단(foCutIn, 검수 11-09zl) */
function foRivalTeams(q){ const c=q.fneg&&q.fneg.cut; const L=[]; for(const t of G.teams){ if(t.id===G.user||!fKnows(t.id,q))continue;
    if(c&&c.tid===t.id){ if(!foreignCheck(t.id,q,foUp(t.id,q)))L.push(t.id); continue; }
    const nd=fNeed(t.id); if(!nd||nd.kind!==q.foreign||(nd.isP!=null&&nd.isP!==q.isP)||(nd.up&&ovr(q)<nd.upO+6))continue; if(fTop3(t.id,nd,q).includes(q))L.push(t.id); } return L; }
/* 이 구단이 계약하면서 내보낼 선수: 끼어들기를 일으킨 교체 대상, 아니면 겨울 교체 대상 */
function foUp(tid,q){ const c=q&&q.fneg&&q.fneg.cut; if(c&&c.tid===tid)return c.up!=null&&G.players[c.up]&&G.players[c.up].team===tid?c.up:undefined; const nd=fNeed(tid); return nd&&nd.up?nd.up:undefined; }
function foVal(g,i){ return g+i*FO_INC_W; }
/* 목록의 협상 버튼: 요구액이 아니라 가장 낮은 제안(최소 보장)으로도 막히는지 본다. 낮춰 부르면 풀리는 총액 한도로는 협상 자체를 막지 않는다(검수 11-09b) */
function foListErr(q){ const a0=q.ask; q.ask=MIN_SAL; const e=foreignCheck(G.user,q); q.ask=a0; return e; }
/* 경쟁 구단 제안(가장 강한 순) */
/* 경쟁 구단 제시액: 관심 구단이 많을수록 값이 오른다(실제 KBO: S급 신규 외국인은 대부분 상한 100만 달러 근처). 우리가 관찰 중이면 한 곳 더 붙은 것으로 본다 */
function foRivals(q){ const cap=foCap(q); let T=foRivalTeams(q), R=[];
  for(let g=0;g<10;g++){ const n=T.length+(fwatchOn(q.id)?1:0); const up=1+.07*Math.max(0,n-1);
    R=T.map(tid=>{ const tot=Math.min(cap,Math.round(q.ask*up*(1+.03*hn('fr'+tid,q.id)))); { const a0=q.ask; q.ask=tot; const e=foreignCheck(tid,q,foUp(tid,q)); q.ask=a0; if(e)return null; } /* 제시 총액으로 계약할 수 없는 구단은 경쟁자가 아니다(검수 11-09b) */ const g=Math.round(tot*.85/USD)*USD, i=Math.max(0,tot-g); const A=foAppeal(q,tid); return {tid,g,i,f:A.f,parts:A.parts,v:foVal(g,i)*A.f}; }).filter(Boolean);
    if(R.length===T.length)break; T=R.map(r=>r.tid); } /* 감당 못 해 빠진 구단은 다른 구단 제시액도 올리지 않는다: 남은 구단 수로 다시 계산(검수 11-09zl) */
  return R.sort((a,b)=>b.v-a.v); }
/* 선수가 받아들이는 기준: 요구액을 보통 구단에서 보장 85% + 인센티브 15%로 받는 정도 */
function foFloor(q){ return foVal(q.ask*.85,q.ask*.15)*.98; }
function foNeg(q){ q.fneg=q.fneg||{n:0,mood:70,since:G.day,wk:G.day}; if(G.day-q.fneg.wk>=7){ q.fneg.wk=G.day; q.fneg.n=0; } return q.fneg; }
/* 이기려면 필요한 보장액(인센티브 i 고정). 한도를 넘으면 null */
function foNeedG(q,i,target,f){ const g=Math.max(Math.ceil((target/f-i*FO_INC_W)/USD)*USD,MIN_SAL); /* 1만 달러 단위로 올림, 최소 보장을 먼저 적용한 뒤 상한 검사(검수 11-06) */ return g+i<=foCap(q)?g:null; }
function foOffer(id,g,i,rel){ rel=!!rel; const q=G.players[id]; if(!q||q.team!=null)return {ok:false,msg:'이미 다른 곳과 계약했습니다.'}; if(!foreignOpen())return {ok:false,msg:'지금은 외국인 선수를 영입할 수 없습니다.'};
  g=Math.round(g); i=Math.round(Math.max(0,i)); const cap=foCap(q); if(g+i>cap)return {ok:false,msg:`신규 계약은 보장과 인센티브를 합쳐 ${Math.round(cap/USD)}만 달러(${money(cap)})까지입니다.`};
  const ask0=q.ask; q.ask=g+i; const err=foreignCheck(G.user,q); q.ask=ask0; if(err)return {ok:false,msg:err};
  const N=foNeg(q); if(N.cool>G.day)return {ok:false,msg:`${q.name} 측이 ${dmd(N.cool)}까지 협상을 쉬자고 합니다.`}; if(N.n>=3)return {ok:false,msg:`이번 주 제안은 세 번까지입니다. ${dmd(N.wk+7)}에 다시 제안할 수 있습니다.`};
  N.n++; N.last=G.day; const me=foAppeal(q,G.user,{rel}); const v=foVal(g,i)*me.f; const R0=foRivals(q); const best=R0[0]; const floor=foFloor(q); const target=Math.max(floor,best?best.v*1.01:0);
  const riv=best?`${R0.length}개 구단이 관심을 보이고 있고, 가장 적극적인 곳은 ${tshort(best.tid)}(보장 ${usdT(best.g)} + 인센티브 ${usdT(best.i)}, 구단 매력 ${Math.round((best.f-1)*100)>=0?'+':''}${Math.round((best.f-1)*100)}%)입니다.`:'아직 다른 구단 제안은 없습니다.';
  if(v>=target){ const err=signForeignT(G.user,id,g,i); if(err)return {ok:false,msg:err}; delete q.fneg; if(rel){ q.fRel=true; story(q,'계약 조항: 재계약하지 않으면 보류권 해제(국내 다른 구단과 계약 가능)','move'); } try{ agRelAdd(agentOf(q),2,`외국인 ${q.name} 계약`); }catch(e){} return {ok:true,msg:`${q.name} 측이 사인했습니다. 보장 ${usdT(g)}(${money(g)})${i?` + 인센티브 ${usdT(i)}`:''}.${best?` ${tshort(best.tid)}도 노렸지만 우리를 택했습니다.`:''}`}; }
  /* 낮게 부르면 분위기가 나빠진다 */
  const r=v/target; if(r<.85){ N.mood-=12; } else if(r<.95)N.mood-=4;
  if(N.mood<40){ N.cool=N.dl>G.day?Math.min(G.day+7,N.dl):G.day+7; /* 기다려 주는 기한 안에 한 번은 답할 수 있게(검수 11-09zl) */ N.mood=55; return {ok:false,msg:`${q.name} 측: "조건 차이가 너무 큽니다. 일주일 뒤에 다시 이야기하시죠." ${riv}`}; }
  if(best&&!N.dl&&foDL()>G.day){ N.dl=foDL(); N.dlT=best.tid; } /* 등록 마감 뒤로 약속하지 않는다(검수 11-09b) */
  const okT=(g,ii)=>{ if(g==null)return null; const a0=q.ask; q.ask=g+ii; const e=foreignCheck(G.user,q); q.ask=a0; return e?null:g; }; /* 구단 외국인 총액 한도로 다시 막히는 금액은 안내하지 않는다(검수 11-09s) */
  const ng=okT(foNeedG(q,i,target,me.f),i), ng0=i>0?okT(foNeedG(q,0,target,me.f),0):null;
  const why=best&&best.v>floor?`${tshort(best.tid)} 조건이 더 좋습니다`:'요구 조건에 못 미칩니다';
  const pfT=`${q.name}은(는) ${FO_PREF[me.pref]}합니다.`;
  const how=ng!=null?`${i>0?'인센티브를 그대로 두면 ':''}보장 ${usdT(ng)}(${money(ng)}) 이상이면 사인하겠다고 합니다.${ng0!=null&&ng0<ng+i?` 인센티브를 빼면 보장 ${usdT(ng0)}로도 됩니다.`:''}`:ng0!=null?`보장을 늘리고 인센티브를 줄여야 합니다. 인센티브 없이 보장 ${usdT(ng0)}면 사인합니다.`:`상한 ${Math.round(cap/USD)}만 달러와 남은 외국인 총액 한도 안에서는 ${best?tshort(best.tid)+' 조건을':'요구 조건을'} 넘기 어렵습니다. 우리 구단 매력이 부족합니다.`;
  return {ok:false,need:ng,msg:`${q.name} 측: ${why}. ${how} ${riv} ${pfT}${N.dl?` ${dmd(N.dl)}까지 답을 기다려 준다고 합니다.`:''}`}; }
/* 계약 반영: 보장은 연봉, 인센티브는 계약 옵션(규정 출전을 채우면 시즌 결산에 지급) */
function signForeignT(tid,id,g,i){ const p=G.players[id]; if(!p)return '외국인 계약 대상이 아닙니다.';
  const a0=p.ask; p.ask=g+i; const check=foreignCheck(tid,p); p.ask=a0; if(check)return check;
  p.ask=g; const err=signForeign(tid,id); p.ask=a0; if(err)return err; p.sal=g; if(i>0){ const fr=period()==='season'?remainFrac():1; p.ctT=p.team; p.opt={a:Math.round(i*fr),from:p.fy,until:p.fy,c:optCrit(p)}; /* 시즌 중 계약은 인센티브도 남은 기간분(안내와 같게, 검수 11-06) */ /* 달성 기준은 계약 때 보직으로 고정(검수 11-05) */ }
  if(tid===G.user)story(p,`계약 조건: 보장 ${money(g)}${i?` + 인센티브 ${money(i)}(규정 출전 시)`:''}`,'move'); return ''; }
/* 기다려 준 기한이 지나면 가장 강한 경쟁 구단으로 간다 */
function foDaily(){ for(const id of [...(G.fmarket||[])]){ const q=G.players[id]; if(!q||q.team!=null||!q.fneg||!q.fneg.dl||q.fneg.dl>=G.day)continue; const dl=q.fneg.dl; delete q.fneg.dl;
    const R0=foRivals(q); let b=null; if(foreignOpen())for(const r of R0){ aiForeignSign(r.tid,q,'',r); if(q.team===r.tid){ b=r; break; } } if(q.fneg)delete q.fneg.cut; if(!b)continue; /* 1순위가 한도 등으로 못 하면 다음 구단(검수 11-06). 아무도 못 하면 시장에 남는다. 경쟁 소식 전에 낸 제안은 답으로 세지 않는다(검수 11-09zl) */ note('외국인',`${q.name}이(가) ${tname(b.tid)}과(와) 계약했습니다. ${q.fcut!=null&&!(q.fneg.last>=q.fcut)?`${dmd(dl)}까지 끼어들 기회가 있었지만 우리는 제안하지 않았습니다.`:`${dmd(dl)}까지 기다려 줬지만 우리 조건이 ${tshort(b.tid)}보다 못했습니다.`}`); } }
/* 우리 관찰 명단 후보를 AI 구단이 데려가려 하면 바로 끝내지 않고 사흘 끼어들 기한을 준다(사용자 피드백 11-09f: '하이재킹 당했습니다'로 끝나 허무함).
   기한에는 다른 구단도 못 데려가고(foHeld), 기한이 지나면 foDaily가 기존 점수로 가장 강한 구단에 보낸다. 관찰 명단만, 한 선수당 한 번만 */
function foCutIn(tid,q,up){ if(G.unemp||!q||q.team!=null||q.fcut!=null||!fwatchOn(q.id)||foHeld(q))return false; const dl=foDL(); if(dl<=G.day)return false;
  q.fcut=G.day; const N=foNeg(q); N.dl=dl; N.dlT=tid; N.cut={tid,up:up??(fNeed(tid)||{}).up}; delete N.cool; /* 영입을 추진한 구단(교체 대상 포함)은 경쟁자로 남고, 새 기한 동안 협상 휴식은 풀린다(검수 11-09zl) */ const r=foRivals(q).find(x=>x.tid===tid); const tot=r?r.g+r.i:Math.min(foCap(q),q.ask);
  mail('스카우트팀장',`${tshort(tid)}, 관찰 후보 ${q.name}와(과) 협상 중`,`${tname(tid)}이(가) 관찰 명단의 ${q.name}(${posLabel(q)}, ${q.age}세)과(와) 계약을 앞두고 있습니다. 제시액은 약 ${Math.round(tot/USD/5)*5}만 달러 수준으로 들립니다. 관심 있으면 ${dmd(dl)}까지 제안하세요. 선수가 두 구단 조건을 비교해 고릅니다.`,{imp:true,kind:'외국인',ref:q.id,acts:[{l:`${q.name} 보고 제안`,a:'player',v:q.id},{l:'외국인 시장',a:'go',v:'transfer:foreign'}]});
  return true; }
/* AI 구단은 우리와 협상 중인(기다려 주는) 선수를 그 기간에는 데려가지 않는다 */
function foHeld(q){ return q&&q.fneg&&q.fneg.dl&&q.fneg.dl>=G.day; }
/* 기다려 주는 기한: 사흘 뒤, 시즌 중에는 등록 마감 전날까지(그다음 날 처리가 마감일 안에 돌게, 검수 11-09zl: 8월 15일 기한이 16일에 처리돼 아무도 계약 못 함) */
function foDL(){ return period()==='season'?Math.min(G.day+3,foreignDL()-1):G.day+3; }
const usdT=v=>`${(v/USD).toFixed(2).replace(/\.?0+$/,'')}만 달러`;

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
  const re=!!N.ok; if(re){ const fc=fReCapInfo(); if(p.foreign!=='용병'||!(fc&&fc.over>0))return {ok:false,msg:'이미 합의했습니다.'}; } else if(N.n>=3)return {ok:false,msg:'재계약 제안은 세 번까지입니다.'}; /* 합의 뒤 총액 한도를 넘으면 낮춘 조건으로 다시 제안할 수 있다(횟수 제한 없음, 검수 11-09zl) */
  g=Math.round(g); i=Math.round(Math.max(0,i)); if(p.foreign==='아시아'&&g+i>asiaReCap(p))return {ok:false,msg:`아시아쿼터 재계약은 보장·인센티브 합계 ${usdT(asiaReCap(p))}(${money(asiaReCap(p))})까지입니다(직전 연봉 ${usdT(p.sal)} + 10만 달러, 신규 상한 20만 달러 중 큰 쪽).`}; /* 화면 안내 상한과 같게(검수 11-06) */ if(!re)N.n++; const f=foReComfort(p); const v=foVal(g,i)*f; const target=foReFloor(p); const O=foReOut(p);
  const out=O&&!O.none?`${O.k} 구단이 ${usdT(O.v)} 수준을 제시했다고 합니다.`:'해외 제안은 없다고 합니다. 국내 다른 구단은 보류권 때문에 접촉할 수 없습니다.';
  if(v>=target){ N.ok=true; p.newSal=g; if(i>0)p.fInc=i; else delete p.fInc; if(p.fMulti>C.y)delete p.fMulti; /* 새 조건은 1년 계약으로 */ return {ok:true,msg:`${p.name} 측이 재계약에 합의했습니다. 보장 ${usdT(g)}(${money(g)})${i?` + 인센티브 ${usdT(i)}`:''}. ${O&&!O.none?out:''}`}; }
  if(re){ const need=Math.ceil((target/f-i*FO_INC_W)/USD)*USD; return {ok:false,need,msg:`${p.name} 측: 보장 ${usdT(need)}(${money(need)})${i?` + 인센티브 ${usdT(i)}`:''} 이상이어야 조건을 바꾸겠다고 합니다. 기존 합의(보장 ${usdT(p.newSal)}${p.fInc?` + 인센티브 ${usdT(p.fInc)}`:''})는 그대로입니다.`}; }
  const r=v/target; N.mood-=r<.85?15:r<.95?6:2;
  if(N.mood<40||N.n>=3){ C.foreignDrop.includes(id)||C.foreignDrop.push(id); p.fleft=true; return {ok:false,msg:`${p.name} 측이 재계약을 거절했습니다. ${out} ${(C.fFree||[]).includes(id)||p.fRel?'계약에 보류권 해제 조항이 있어 국내 다른 구단과도 계약할 수 있는 자유계약 선수가 됩니다.':`보류권은 우리에게 있으니 5년 동안 국내 다른 구단에는 갈 수 없고, ${O&&!O.none?O.k+'으로':'해외로'} 떠납니다.`}`}; } /* 해제 조항이 있으면 실제 처리(자유계약)와 같은 안내(검수 11-08) */
  let need=Math.ceil((target/f-i*FO_INC_W)/USD)*USD, ii=i; if(p.foreign==='아시아'&&need+i>asiaReCap(p)){ const n0=Math.ceil(target/f/USD)*USD; if(n0>asiaReCap(p))return {ok:false,msg:`${p.name} 측: 아시아쿼터 재계약 상한 ${usdT(asiaReCap(p))} 안에서는 사인할 조건이 없다고 합니다. ${out} 남은 제안 ${3-N.n}번.`}; need=n0; ii=0; } /* 상한을 넘는 금액은 조건으로 내놓지 않는다(검수 11-09s) */
  return {ok:false,need,msg:`${p.name} 측: 보장 ${usdT(need)}(${money(need)})${ii?` + 인센티브 ${usdT(ii)}`:i?'(인센티브 없이)':''} 이상이면 사인하겠다고 합니다. ${out} 남은 제안 ${3-N.n}번.`}; }
/* 보류 명단: 보류권을 쥐고 결별한 외국인(5년간 국내 다른 구단 입단 불가) */
function foResFor(p){ if(!p)return null; return (G.fRes||[]).find(x=>x.until>=G.year&&(x.pid!=null?x.pid===p.id:x.name===p.name&&x.nat===p.nat))||null; }
function foResAdd(p,tid){ G.fRes=(G.fRes||[]).filter(x=>x.until>=G.year); if(G.fRes.some(x=>x.tid===tid&&(x.pid!=null?x.pid===p.id:x.name===p.name&&x.nat===p.nat)))return;
  G.fRes.unshift({pid:p.id,name:p.name,pos:posLabel(p),nat:p.nat,tid,y:G.year,until:G.year+5}); } /* 유효한 권리는 화면 표시 개수와 무관하게 모두 유지 */

/* 외국인 2년 계약(커뮤니티 요청 11-07, KBO도 재계약 외국인 다년 계약을 허용): 재계약에 합의한 뒤 2년으로 묶으면 연봉 5%를 더 주고, 다음 겨울 재계약 협상 없이 같은 연봉으로 한 해 더 뛴다 */
function fReMulti(id){ const C=G.contract; const p=G.players[id]; if(!C||C.done||!p||p.team!==G.user||!C.foreignEnd.includes(id))return '재계약 기간이 아닙니다.'; const N=(C.fre||{})[id]; if(!(N&&N.ok))return '먼저 1년 재계약에 합의해야 합니다.'; if(p.fMulti>C.y)return '이미 2년 계약입니다.'; if(p.age>=35)return `${p.age}세라 다년 계약은 하지 않습니다.`;
  const s0=p.newSal; p.newSal=round5(s0*1.05); if(p.foreign==='아시아'&&p.newSal+(p.fInc||0)>asiaReCap(p)){ /* 보장·인센티브 합계로 본다(검수 11-09s) */ p.newSal=s0; return `아시아쿼터 재계약 상한 ${money(asiaReCap(p))}을(를) 넘어 2년 계약(5% 인상)으로 바꿀 수 없습니다.`; } /* 검수 11-08 */ p.fMulti=C.y+2; const f=fReCapInfo(); if(f&&f.over>0){ p.newSal=s0; delete p.fMulti; return `외국인 3명 연봉 총액 한도를 ${money(f.over)} 넘어 2년 계약으로 바꿀 수 없습니다.`; }
  story(p,`${C.y+1}~${C.y+2} 2년 계약 (연 ${money(p.newSal)})`,'move'); return `${p.name}과(와) ${C.y+1}~${C.y+2} 2년 계약으로 바꿨습니다. 연봉 ${money(s0)} → ${money(p.newSal)}, 다음 겨울에는 재계약 협상 없이 같은 연봉입니다.`; }
