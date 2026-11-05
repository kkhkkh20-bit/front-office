/* 난이도 측정: 같은 리그(고정 시드)에서 사용자 운영 방식별로 한 시즌을 돌려 승률·득실차·순위를 잰다.
 운영 방식
  proR : 현실적인 고수(실제 능력 대신 화면에서 볼 수 있는 기록 추정으로 지명, 외국인은 최상위)
  proD·proF: 고수의 지명만·외국인만(어디서 이득이 나는지 나눠 본다)
  auto : 스카우트 추천대로 맡기는 사용자(창단 지명 fdBest, 외국인 자동)
  pro  : 고수(실제 능력을 거의 정확히 읽고, 연봉 상한 100%까지 강한 선수를 뽑고, 외국인도 시장 최상위를 고른다). 고수의 상한선
 사용: [NS=시즌 수] node tools/check-balance.cjs [리그 수=4] [방식=auto,pro]   (dist/engine.js 필요: bash build.sh)
 기준(2026-11-05): 고수도 우승이 보장되면 안 된다. 고수 평균 승률 .600 이하, 1위 비율 절반 이하를 목표로 본다 */
const fs=require('fs'), path=require('path');
const ENGINE=path.join(__dirname,'..','dist','engine.js'); if(!fs.existsSync(ENGINE)){ console.error('dist/engine.js가 없습니다. bash build.sh를 먼저 실행하세요.'); process.exit(2); }
let seed=1; Math.random=()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
const setSeed=v=>{ seed=v; };
const NL=+process.argv[2]||4, MODES=(process.argv[3]||'auto,pro').split(','), NS=+process.env.NS||1; /* NS: 이어서 돌릴 시즌 수(독주 확인) */
const oe=console.error; console.error=()=>{};
const run=new Function('setSeed','NL','MODES','NS','log',fs.readFileSync(ENGINE,'utf8')+`

/* 고수 지명: 실제 능력(ovr)과 젊은 선수 성장 여지, 포지션 필요, 상한 100% 안에서 */
let REAL=false, EQ=false; const FL=[]; /* eq: 실험용. AI도 고수와 같은 방식으로 지명하면 차이가 사라지는지 */ /* proR: 고수가 실제로 볼 수 있는 기록(분석팀·스카우트 추정)만으로 고른다 */
function proPick(tid){ tid=tid??G.user; const X=fdCtx(tid), c=X.c; let best=null,bv=-1e9;
  for(const id of G.fd.pool){ const p=G.players[id]; if(!p||!p.fdPool)continue; const sv=REAL?fdSeenBy(tid,p):null; const o=REAL?sv.an*.6+sv.sc*.4:ovr(p); const pot=REAL?o+Math.max(0,sv.pot-sv.o):(p.pot||o); let e=p.age<=25?o+Math.max(0,pot-o)*.35:p.age>=32?o-(p.age-31)*1.2:o;
    const k=fdSlot(p), tg=FD_TGT[k]||1; let v=Math.pow(Math.max(0,e-34),1.7)/10*((c[k]||0)<tg?1.3:(c[k]||0)<tg+2?.8:.4); if(X.cp+p.sal>X.cap)v*=.2; if(isAway(p))v*=.5; if(v>bv){bv=v;best=id;} } return best; }
function proForeign(){ /* 고수도 경쟁 입찰(foOffer)을 거친다: 상한까지 불러도 매력에서 지면 놓친다 */ const lost=[]; for(let g=0;g<14;g++){ const fv=q=>{ if(!REAL)return ovr(q); const f=fScout(q); return f.mid!=null?f.mid:(f.raw??ovr(q)); }; const L=(G.fmarket||[]).map(id=>G.players[id]).filter(q=>q&&q.team==null&&!lost.includes(q.id)&&!foreignCheck(G.user,q)).sort((a,b)=>fv(b)-fv(a)); if(!L.length)break; const q=L[0]; const cap=foCap(q); const gg=Math.round(cap*.9/USD)*USD; const r=foOffer(q.id,gg,cap-gg,false); if(!r.ok){ lost.push(q.id); if(q.fneg)q.fneg.n=0; } } FL.push(lost.length); }
function season(mode){ REAL=mode==='proR'||mode==='eq'; EQ=mode==='eq'; if(EQ)mode='proR';
  G=null; buildWorld(); G.fdOrd=fdOrder(); claimTeam(6,5); fdWelcome(); G.fdWait=false; fdStart(); G.fd.open=true;
  let g=0; while(!G.fd.done&&g++<700){ const pk=G.fd.picks[G.fd.cur]; if(!pk){ fdFinish(); break; } const id=pk.tid===G.user?((mode==='pro'||mode==='proD'||mode==='proR')?proPick():fdBest(G.user,true)):(EQ?proPick(pk.tid):fdBest(pk.tid,false)); if(id==null){ fdFinish(); break; } fdPick(id); } if(!G.fd.done)fdFinish();
  G.tut={done:true,step:99}; try{ hireMgr(G.mmarket[0].id,3); }catch(e){} G.medSet=true;
  if(mode==='pro'||mode==='proF'||mode==='proR')proForeign(); for(let i=0;i<3;i++)try{ aiForeignFill(G.user); }catch(e){}
  G.auto={sal:true,fre:true,mgr:true,tro:true,raid:true}; G.scoutAuto=true; try{ G.deleg=Object.fromEntries(Object.keys(EV_NAME).map(k=>[k,1])); }catch(e){}
  const Rt=G.teams.map(t=>({t:t.id,r:teamRating(t.id)})).sort((a,b)=>b.r-a.r); const pre={rRank:Rt.findIndex(x=>x.t===G.user)+1,gap:teamRating(G.user)-avg(Rt.filter(x=>x.t!==G.user).map(x=>x.r)),pay:capPay(G.user)/capOf(G.year),aiPay:avg(G.teams.filter(t=>t.id!==G.user).map(t=>capPay(t.id)))/capOf(G.year),aiF:avg(G.teams.filter(t=>t.id!==G.user).flatMap(t=>foreignOf(t.id).filter(x=>x.foreign==='용병').map(ovr))),myF:avg(foreignOf(G.user).filter(x=>x.foreign==='용병').map(ovr))};
  const RS={},RA={}; const ag=applyGame; applyGame=function(day,h,a,gm,ps){ if(!ps&&gm&&gm.score){ RS[h]=(RS[h]||0)+gm.score.h; RA[h]=(RA[h]||0)+gm.score.a; RS[a]=(RS[a]||0)+gm.score.a; RA[a]=(RA[a]||0)+gm.score.h; } return ag.apply(this,arguments); };
  /* 겨울마다 사람 단장이 하는 일(맡기기로는 안 되는 큰 결정): 외국인 빈자리 채우기, 고수는 FA도 상한 90%까지 */
  const winter=()=>{ if(G.day%7)return; try{ if(foreignOpen()&&fNeed(G.user)){ if(mode==='auto')aiForeignFill(G.user); else proForeign(); } }catch(x){}
    if(mode!=='auto'&&G.fa&&!G.fa.closed&&G.day>=G.fa.openDay&&capPay(G.user)<capOf(sponSeason())*.9){ try{ const L=G.fa.pool.map(id=>G.players[id]).filter(q=>q&&q.team==null&&q.ask&&!faOutBlocked(G.user,q)&&!(G.fa.offers[q.id])).sort((a,b)=>ovr(b)-ovr(a)); if(L[0])faNegotiate(L[0].id,{annual:round5(L[0].ask.annual*1.05),years:L[0].ask.years}); }catch(x){} } };
  const step=()=>{ winter(); G.live=null; G.res=null; G.stops=[]; G.matchAwait=null; for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; }
      if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); } if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,false); }catch(x){} if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(x){}
      (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(x){} }); /* 보상선수 고르기 등 단장 결정은 기본안(check-logic simTo와 같게) */
      try{ if(rosterN(G.user)>ROSTER_MAX)trimRoster(G.user,ROSTER_MAX); }catch(x){} try{ advance('day',{skipMatchStop:true}); }catch(e){ G.day++; } };
  const res=()=>{ const S=G.teams.map(t=>({t:t.id,w:G.sea.rec[t.id].w,l:G.sea.rec[t.id].l})).sort((a,b)=>b.w/(b.w+b.l)-a.w/(a.w+a.l)); const i=S.findIndex(x=>x.t===G.user);
    const Rt=G.teams.map(t=>({t:t.id,r:teamRating(t.id)})).sort((a,b)=>b.r-a.r);
    return {fN:foreignOf(G.user).length,fO:avg(foreignOf(G.user).map(ovr)),pay:capPay(G.user)/capOf(G.year),rR:Rt.findIndex(x=>x.t===G.user)+1,dom:avg(domestic(G.user).map(ovr).sort((a,b)=>b-a).slice(0,20)),aiDom:avg(G.teams.filter(t=>t.id!==G.user).map(t=>avg(domestic(t.id).map(ovr).sort((a,b)=>b-a).slice(0,20)))),w:S[i].w,l:S[i].l,rank:i+1,rd:(RS[G.user]||0)-(RA[G.user]||0),rdTop:Math.max(...G.teams.filter(t=>t.id!==G.user).map(t=>(RS[t.id]||0)-(RA[t.id]||0)))}; };
  const later=[]; let first;
  try{ let n=0; while(n++<900&&!G.ps)step(); first=res();
    /* 여러 시즌(NS): 정규시즌이 끝날 때마다(새 포스트시즌이 열릴 때) 기록. 이후 시즌은 자동 운영(고수 봇은 첫 겨울만 직접 고른다) */
    for(let k=1;k<NS;k++){ const prev=G.ps; for(const t in RS)RS[t]=0; for(const t in RA)RA[t]=0; let m=0; while(m++<1400&&!(G.ps&&G.ps!==prev))step(); if(!(G.ps&&G.ps!==prev)){ log('  (다음 시즌 진행 멈춤: '+G.year+' '+dmd(G.day)+' '+period()+' '+String((typeof blocker==='function'&&blocker())||'').slice(0,80)+')'); break; } later.push(res()); } } finally { applyGame=ag; }
  return Object.assign(pre,first,{later}); }
const RES={}; for(const m of MODES)RES[m]=[];
for(let L=0;L<NL;L++)for(const m of MODES){ setSeed(1000+L*77); const r=season(m); RES[m].push(r); log('리그 '+(L+1)+' '+m+': '+r.w+'승 '+r.l+'패 '+r.rank+'위 득실 '+(r.rd>0?'+':'')+r.rd+' (AI 최고 '+r.rdTop+') · 시작 전력 '+r.rRank+'위(평균 대비 '+r.gap.toFixed(1)+') · 연봉 '+Math.round(r.pay*100)+'% · 외국인 우리 '+r.myF.toFixed(1)+' / AI '+r.aiF.toFixed(1)+' · AI 연봉 '+Math.round(r.aiPay*100)+'%'); }
if(FL.length)log('고수가 상한까지 불렀는데 놓친 외국인 후보: 시즌당 평균 '+avg(FL).toFixed(1)+'명');
for(const m of MODES){ const L=RES[m]; for(let k=0;k<NS-1;k++){ const X=L.map(x=>x.later[k]).filter(Boolean); if(X.length)log('   '+m+' '+(k+2)+'년차: 전력 '+avg(X.map(x=>x.rR)).toFixed(1)+'위 · 국내 상위20 '+avg(X.map(x=>x.dom)).toFixed(1)+'(AI '+avg(X.map(x=>x.aiDom)).toFixed(1)+') · 외국인 '+avg(X.map(x=>x.fN)).toFixed(1)+'명 '+avg(X.map(x=>x.fO)).toFixed(1)+' · 연봉 '+Math.round(avg(X.map(x=>x.pay))*100)+'% · 승률 '+avg(X.map(x=>x.w/(x.w+x.l))).toFixed(3)+' · 평균 '+avg(X.map(x=>x.rank)).toFixed(1)+'위 · 1위 '+X.filter(x=>x.rank===1).length+'/'+X.length+' · 득실 평균 '+Math.round(avg(X.map(x=>x.rd)))); } }
for(const m of MODES){ const L=RES[m]; log('== '+m+': 승률 '+avg(L.map(x=>x.w/(x.w+x.l))).toFixed(3)+' · 평균 '+avg(L.map(x=>x.rank)).toFixed(1)+'위 · 1위 '+L.filter(x=>x.rank===1).length+'/'+L.length+' · 득실 평균 '+Math.round(avg(L.map(x=>x.rd)))+' · 시작 전력 평균 '+avg(L.map(x=>x.rRank)).toFixed(1)+'위'); }
`);
try{ run(setSeed,NL,MODES,NS,(...a)=>console.log(...a)); }catch(e){ console.error=oe; console.log('실행 실패: '+(e.stack||e).toString().slice(0,600)); process.exit(1); }
