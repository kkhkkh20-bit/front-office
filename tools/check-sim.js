/* 장기 시뮬 점검: 화면 없이 엔진(dist/engine.js)만으로 여러 시즌을 돌려 오류와 이상한 값을 찾는다
 - 진행 중 던져진 예외, console.error로 남긴 오류
 - 선수 연봉·능력치가 숫자가 아니거나(NaN) 음수, 나이가 말이 안 되는 경우, 구단 현금이 숫자가 아닌 경우
 - 불변식: 경기마다(투수 아웃=이닝×3, 득점·안타·볼넷 합계, 타점·자책≤득점, 승패·세이브) · 하루마다(나이는 해가 바뀔 때만, 계약 조건 정리, 입대일, 소속, 외국인 수, 로스터·1군 엔트리 한도)
 - 단장이 할 일(결정·인터뷰·제안·드래프트·보상선수·연봉 계약)은 기본안으로 자동 처리
 사용: node tools/check-sim.js [끝 연도=2029]   환경 변수 SEED(기본 7), TEAM(기본 6), ACT=1(바쁜 단장: 트레이드·이직·영입·방출 등을 직접 해 본다)
 build.sh로 dist/engine.js를 먼저 만든다. */
const fs=require('fs'), path=require('path');
const ENGINE=path.join(__dirname,'..','dist','engine.js'); if(!fs.existsSync(ENGINE)){ console.error('dist/engine.js가 없습니다. bash build.sh를 먼저 실행하세요.'); process.exit(2); }
const END=+process.argv[2]||2029; const SEED=+process.env.SEED||7; const TEAM=+process.env.TEAM||6;
{ let a=SEED; Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const errs=[], bad=[]; const oe=console.error; console.error=(...a)=>{ errs.push(a.map(String).join(' ').slice(0,200)); };
/* 숨은 오류: 엔진 곳곳의 빈 catch(e){}가 삼키는 예외를 점검할 때만 드러낸다(소스는 그대로) */
const hidden={}; globalThis.__sw=e=>{ try{ const m=(e&&e.stack||String(e)).split('\n'); const at=(m.find(l=>/at /.test(l))||'').trim().replace(/\(.*?:(\d+):\d+\)/,'(줄 $1)'); const k=(e&&e.message||String(e)).slice(0,120)+' · '+at.slice(0,120); hidden[k]=(hidden[k]||0)+1; }catch(x){} };
let SRC=fs.readFileSync(ENGINE,'utf8'); let nSw=0; SRC=SRC.replace(/catch\((\w+)\)\{\s*\}/g,(m,v)=>{ nSw++; return `catch(${v}){__sw(${v})}`; });
const ratingRows=[]; const ratingFile=process.env.RATINGS_FILE;
const collectRatings=ratingFile?row=>{ ratingRows.push(row); fs.writeFileSync(ratingFile,JSON.stringify({seed:SEED,end:END,samples:ratingRows},null,2)+'\n'); console.log('능력치 분포 '+JSON.stringify(row)); }:null;
const run=new Function('errs','bad','END','TEAM','ACTF','collectRatings','EXPAND',SRC+`
DEMO.on=false; newGame(TEAM); fdStart(); fdAdvance(false); let g0=0; while(G.fd&&!G.fd.done&&g0++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true;
for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; try{ if(p&&!foreignCheck(G.user,p))signForeign(G.user,id); }catch(e){} }
if(typeof EXPAND!=='undefined'&&EXPAND){ for(let k=0;k<EXPAND;k++){ const E=expInit(); Object.assign(E,{stage:'approved',ay:G.year,city:['청주','전주'][k],region:'충청',market:.88,nick:['다이노스','위즈'][k],parent:'시험 기업'}); const tid=expDraft(); console.log('확장 시험: '+tshort(tid)+' 국내 '+domestic(tid).length+'명'); E.stage='idle'; E.last=null; } G.cal=buildCalendar(G.year); for(const t of G.teams)if(!G.sea.rec[t.id])G.sea.rec[t.id]={w:0,l:0,t:0}; } /* EXPAND=1·2: 시작하자마자 11·12구단으로 늘려 한 시즌 이상 돌린다 */
/* ===== 불변식: 경기·하루마다 항상 참이어야 하는 규칙(오류 없이 결과만 틀린 버그를 잡는다) ===== */
const INV=(k,t)=>{ bad.push('불변식 · '+k+' · '+t); };
const _sg=simGame; simGame=function(day,h,a,ps){ const g=_sg.apply(this,arguments); try{
  const S=g.S, num=L=>L.filter(x=>typeof x==='number').length; const P=k=>S[k].pitchers.map(id=>S[k].box.get(id)).filter(Boolean); const B=k=>[...S[k].box.entries()].filter(([id])=>!S[k].pitchers.includes(id)).map(x=>x[1]);
  const po=k=>sum(P(k).map(x=>x.outs||0));
  if(po('h')!==3*num(g.line.a))INV('투수 아웃',dstr(day)+' 홈 투수 '+po('h')+'아웃 · 원정 공격 '+num(g.line.a)+'이닝');
  if(g.score.h<=g.score.a&&po('a')!==3*num(g.line.h))INV('투수 아웃',dstr(day)+' 원정 투수 '+po('a')+'아웃 · 홈 공격 '+num(g.line.h)+'이닝');
  for(const [k,o] of [['h','a'],['a','h']]){ const runs=sum(B(k).map(x=>x.r||0)), rbi=sum(B(k).map(x=>x.rbi||0)), er=sum(P(o).map(x=>x.er||0));
    if(runs!==g.score[k])INV('득점 합계',dstr(day)+' 타자 득점 '+runs+' · 팀 '+g.score[k]); if(rbi>g.score[k])INV('타점',dstr(day)+' 타점 '+rbi+' > 득점 '+g.score[k]); if(er>g.score[k])INV('자책점',dstr(day)+' 자책 '+er+' > 실점 '+g.score[k]);
    const bh=sum(B(k).map(x=>x.h||0)), ph=sum(P(o).map(x=>x.h||0)); if(bh!==ph)INV('안타 합계',dstr(day)+' 타자 '+bh+' · 투수 '+ph);
    const bb=sum(B(k).map(x=>x.bb||0)), pb=sum(P(o).map(x=>x.bb||0)); if(bb!==pb)INV('볼넷 합계',dstr(day)+' 타자 '+bb+' · 투수 '+pb); }
  const d=g.dec||{}; if(g.score.h===g.score.a){ if(d.w||d.l)INV('승패','무승부인데 승·패 투수가 있음 '+dstr(day)); }
  else { const wk=g.score.h>g.score.a?'h':'a', lk=wk==='h'?'a':'h'; if(!S[wk].pitchers.includes(d.w)||!S[lk].pitchers.includes(d.l))INV('승패',dstr(day)+' 승·패 투수가 맞는 팀이 아님'); if(d.sv&&!S[wk].pitchers.includes(d.sv))INV('세이브',dstr(day)+' 진 팀 투수에게 세이브'); }
  if(ps&&G.ps&&G.ps.cur){ const c=G.ps.cur; if(c.wh>c.need[0]||c.wl>c.need[1])INV('시리즈',c.round+' 승수 초과 '+c.wh+'-'+c.wl); }
}catch(x){ INV('검사 오류',x.message); } return g; };
const ageSeen=new Map(); let ageY=G.year;
const invDay=()=>{ const per=period();
  if(G.year!==ageY){ for(const [id,a] of ageSeen){ const p=G.players[id]; if(p&&p.age-a>G.year-ageY)INV('나이',p.name+' '+a+'→'+p.age+'세('+ageY+'→'+G.year+')'); } ageSeen.clear(); ageY=G.year; }
  for(const p of Object.values(G.players)){ if(!ageSeen.has(p.id))ageSeen.set(p.id,p.age); else if(p.age!==ageSeen.get(p.id)&&G.year===ageY)INV('나이','해가 바뀌지 않았는데 '+p.name+' '+ageSeen.get(p.id)+'→'+p.age+' '+dstr(G.day));
    if(p.team!=null&&!G.teams[p.team])INV('소속','없는 구단 '+p.name);
    if(p.ctT!=null&&p.ctT!==p.team&&(p.capB||p.opt||p.ntc||p.roleProm))INV('계약 조건 정리',p.name+' 계약 구단 '+p.ctT+' · 지금 '+p.team);
    if(p.mil&&p.mil.until&&p.mil.from>G.day&&milServing(p))INV('입대','입대 전인데 복무 중 '+p.name);
    if(p.team!=null&&!p.foreign&&(p.yrs||0)<0)INV('계약 기간','음수 '+p.name+' '+p.yrs); }
  if(G.fa&&!G.fa.closed)for(const id of (G.fa.pool||[])){ const p=G.players[id]; if(p&&p.team!=null&&!G.fa.results?.some?.(r=>r.id===id))INV('FA 명단','소속이 있는데 FA 명단에 '+p.name); }
  for(const id of (G.fmarket||[])){ const p=G.players[id]; if(p&&p.team!=null)INV('외국인 시장','소속이 있는데 시장에 '+p.name); }
  for(const t of G.teams){ const C=G.contract; const dr=t.id===G.user&&C&&!C.done?(C.foreignDrop||[]):[]; const fs=foreignOf(t.id).filter(p=>!dr.includes(p.id)); /* 재계약 기간에 결별하기로 한 선수는 계약 확정 때 떠난다 */ if(fs.filter(p=>p.foreign==='용병').length>Math.max(fMaxYB(t.id),fMaxYB(t.id,G.year))||fs.filter(p=>p.foreign==='아시아').length>1)INV('외국인 수',tshort(t.id)+' 용병 '+fs.filter(p=>p.foreign==='용병').length+' · 아시아 '+fs.filter(p=>p.foreign==='아시아').length);
  /* 11-11~12 추가 기능 불변식: 코치 OB 중복, 분기 성장 몫, 득점권·맞대결 기록, 퓨처스 순위 */
  { const seen={}; for(const t of G.teams){ const C=G.coach&&G.coach[t.id]; if(!C)continue; for(const k of CKEYS){ const c=C[k]; if(c&&c.ob){ if(seen[c.ob]!=null&&seen[c.ob]!==t.id)INV('코치 중복',c.name+' '+tshort(seen[c.ob])+'·'+tshort(t.id)); seen[c.ob]=t.id; } } } }
  for(const p of Object.values(G.players)){ const Q=p.devQ; if(Q){ if(!(Q.i>=0&&Q.i<3)||!Array.isArray(Q.w)||Q.w.length!==3||Math.abs(Q.w.reduce((a,v)=>a+v,0)-1)>.02||Q.y<G.year||Q.y>G.year+1)INV('분기 성장',p.name+' '+JSON.stringify({i:Q.i,y:Q.y,w:Q.w})); for(const k in Q.D)if(!Number.isFinite(Q.D[k]))INV('분기 성장',p.name+' '+k+' NaN'); }
    const rs=p.spl&&p.spl.RS; if(rs&&!(rs[0]>=rs[1]&&rs[1]>=rs[2]&&rs[2]>=0))INV('득점권 기록',p.name+' '+rs.slice(0,3).join('/'));
    if(p.vs&&p.vs.m){ for(const id in p.vs.m){ const a=p.vs.m[id]; if(!(a[0]>=a[1]&&a[1]>=a[2]&&a[2]>=a[3]&&a[3]>=0&&a[0]>=a[4]+a[1]-0))INV('맞대결 기록',p.name+' vs '+id+' '+a.join('/')); } }
    for(const k in p.r)if(!(p.r[k]>=20-1e-6&&p.r[k]<=99.0001))INV('능력 범위',p.name+' '+k+' '+p.r[k]); }
  if(G.fl&&G.fl.rec)try{ for(const id in G.fl.rec){ const x=G.fl.rec[id]; if(x&&(x.w<0||x.l<0||!Number.isFinite(x.w+x.l)))INV('퓨처스 순위',id+' '+JSON.stringify(x)); } }catch(e){ INV('검사 오류','퓨처스 '+e.message); }
    if(t.id!==ME()&&(per==='season'||per==='post')&&rosterN(t.id)>ROSTER_MAX)INV('로스터',tshort(t.id)+' '+rosterN(t.id)+'명 '+dstr(G.day));
    if(entryOn()&&(per==='season'||per==='post')){ const n=playersOf(t.id).filter(p=>p.e1).length; if(n>entryLimit())INV('1군 엔트리',tshort(t.id)+' '+n+'명 > '+entryLimit()+' '+dstr(G.day)+' '+per); } }
  for(const k in (G.spend||{}))if(!Number.isFinite(G.spend[k]))INV('지출','G.spend.'+k+' '+G.spend[k]); };
/* 바쁜 단장(ACT=1): 트레이드·제안 수락·이직·무적 영입·방출·FA·외국인 교체·상무·감독 교체를 가끔 해서 상태 전환 경로를 돌린다 */
const ACT=ACTF; const pickR=L=>L.length?L[Math.floor(R()*L.length)]:null;
const actGM=()=>{ const o=dobj(G.day), per=period(); if(R()>.15)return; const me=G.user; const dom=domestic(me).filter(p=>!p.ys);
  const r=R();
  if(r<.2&&tradeOpen()){ const t=pickR(G.teams.filter(x=>x.id!==me)); const give=pickR(dom.filter(p=>!p.foreign)); const get=pickR(domestic(t.id).filter(p=>!p.ys&&ovr(p)<ovr(give||{r:{}})+3)); if(give&&get)proposeTrade(t.id,[give.id],[get.id],0); }
  else if(r<.35&&freeOpen()&&rosterN(me)<ROSTER_MAX){ const f=pickR(freeList()); if(f)signFree(f.id,me); }
  else if(r<.45&&rosterN(me)>ROSTER_MIN+2){ const w=dom.filter(p=>!p.foreign&&!p.e1).sort((a,b)=>ovr(a)-ovr(b))[0]; if(w)releasePlayer(w.id); }
  else if(r<.6&&G.fa&&!G.fa.closed){ const id=pickR((G.fa.pool||[]).filter(x=>G.players[x]&&G.players[x].team==null&&G.players[x].ask)); if(id){ const p=G.players[id]; faNegotiate(id,{annual:round5(p.ask.annual*(R()<.5?1.05:.6)),years:p.ask.years}); } }
  else if(r<.7&&foreignOpen()){ const yb=foreignOf(me).filter(p=>p.foreign==='용병'); if(yb.length>=3&&R()<.3)releaseForeign(pickR(yb).id); const c=pickR((G.fmarket||[]).map(id=>G.players[id]).filter(p=>p&&p.team==null&&!foreignCheck(me,p))); if(c)signForeign(me,c.id); }
  else if(r<.78){ const w=sangmuWave(); if(w){ const p=pickR(dom.filter(x=>milFree(x)&&x.age<=27&&!(x.mil&&x.mil.app))); if(p)sangmuApply(p.id); } }
  else if(r<.8&&per!=='post'){ fireMgr(); if(!G.mmarket||!G.mmarket.length)refreshMgrMarket(); hireMgr(G.mmarket[0].id,2); }
  else if(r<.85&&per==='season'){ const p=pickR(dom.filter(x=>!x.isP&&x.age<33)); const pos=pickR(['1B','LF','RF','3B']); if(p)posConv(p.id,pos); }
  else if(r<.9){ const p=pickR(dom); if(p)trnSet(p.id,pickR(Object.keys(TRN[trnG(p)]))); } };
const step=()=>{ G.live=null; G.res=null; G.stops=[];
  if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(e){ errs.push('draft '+e.message); }
  if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,ACT&&R()<.4); }catch(e){ errs.push('offer '+e.message); }
  if(ACT&&!G.unemp)try{ actGM(); }catch(e){ errs.push('act '+e.message.slice(0,120)); }
  for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ errs.push('ev '+e.k+' '+x.message); e.done=true; }
  for(const j of (G.jobs||[]))if(!j.done)try{ jobAnswer(j.tid,ACT&&R()<.5,true); }catch(e){ errs.push('job '+e.message); }
  if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); }
  (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(e){ errs.push('comp '+e.message); } });
  if(G.contract&&!G.contract.done&&G.day>=KD(12,10))try{ confirmContracts(); }catch(e){ errs.push('contract '+e.message); }
  /* 단장이 직접 해야 하는 정리(로스터 초과)는 사람이 하듯 처리 */
  try{ const n=rosterN(G.user), up=Math.max(0,rosterN(G.user,G.day+1)-n); if(n+up>ROSTER_MAX)trimRoster(G.user,ROSTER_MAX-up); }catch(e){ errs.push('trim '+e.message); } /* 내일 전역해 돌아오는 선수 자리도 미리 비운다(blocker의 전역일 검사와 같은 기준, 실제 게임은 7일 전 경고 메일) */
  try{ if(!G.unemp&&!G.mgr[G.user]){ if(!G.mmarket||!G.mmarket.length)refreshMgrMarket(); hireMgr(G.mmarket[0].id,2); } }catch(e){ errs.push('mgr '+e.message); }
  try{ advance('day'); }catch(e){ errs.push('advance '+dstr(G.day)+' '+e.message); G.day++; } try{ invDay(); }catch(e){ INV('검사 오류',e.message); } };
/* 옵션: 신인·기존 선수·외국인을 분리해 같은 시점(매년 1월 1일) 능력치 분포를 기록한다. 조회는 난수를 쓰지 않는다. */
const _simInitialIds=collectRatings?new Set(Object.values(G.players).filter(p=>p.team!=null).map(p=>p.id)):null;
const _simRatingSample=()=>{if(!collectRatings)return;const C=Object.values(G.players).filter(p=>p.team!=null&&!p.prospect&&!(p.joinY>G.year)&&!p.ys),stat=L=>{const V=L.map(ovr).sort((a,b)=>a-b),q=x=>V[Math.min(V.length-1,Math.floor(V.length*x))]||0;return {n:L.length,mean:+avg(V).toFixed(2),displayMean:+avg(V.map(dv)).toFixed(2),p90:+q(.9).toFixed(2),p99:+q(.99).toFixed(2),max:+q(1).toFixed(2),raw65:V.filter(v=>v>=65).length,display80:V.filter(v=>dv(v)>=80).length,display90:V.filter(v=>dv(v)>=90).length,potential:+avg(L.map(p=>p.pot)).toFixed(2),age:+avg(L.map(p=>p.age)).toFixed(2)};};collectRatings({year:G.year,day:dstr(G.day),domestic:stat(C.filter(p=>!p.foreign)),first:stat(C.filter(p=>!p.foreign&&p.e1)),newgen:stat(C.filter(p=>!p.foreign&&!_simInitialIds.has(p.id))),oldgen:stat(C.filter(p=>!p.foreign&&_simInitialIds.has(p.id))),foreign:stat(C.filter(p=>p.foreign))});};
let g=0; const T0=Date.now(); let lastD=G.day, same=0, ratingYear=G.year;_simRatingSample();
while(G.year<END&&g++<90000){ step();if(G.year!==ratingYear){ratingYear=G.year;_simRatingSample();} if(G.day===lastD){ if(++same>=40){ let why=''; try{ why=blocker()||''; }catch(e){ why='blocker 오류 '+e.message; } bad.push('진행 멈춤 '+dstr(G.day)+(why?' · '+why:'')+(G.gameOver?' · 게임 끝':'')); break; } } else { lastD=G.day; same=0; }
  if(G.day%30===0){ for(const p of Object.values(G.players)){ if(!Number.isFinite(p.sal)||p.sal<0)bad.push(G.year+' 연봉 '+p.name+' '+p.sal); for(const k in p.r)if(!Number.isFinite(p.r[k]))bad.push(G.year+' 능력치 NaN '+p.name+' '+k); if(p.team!=null&&(p.age>46||p.age<16))bad.push(G.year+' 나이 '+p.name+' '+p.age); }
    for(const t of G.teams)if(!Number.isFinite(t.cash))bad.push(G.year+' 현금 '+t.id); } }
const mv={}; for(const m of (G.moves||[]))mv[m.t]=(mv[m.t]||0)+1; return {end:dstr(G.day),sec:(Date.now()-T0)/1000,unemp:!!G.unemp,mv,sw:((G.myC&&G.myC.stints)||[]).length};`);
let r; try{ r=run(errs,bad,END,TEAM,process.env.ACT==='1',collectRatings,+process.env.EXPAND||0); }catch(e){ errs.push('중단 '+e.stack.slice(0,300)); }
console.error=oe;
const B=[...new Set(bad)];
const H=Object.entries(hidden).sort((a,b)=>b[1]-a[1]);
if(H.length){ console.log(`숨은 오류 ${H.length}종(빈 catch ${nSw}곳 중):`); for(const [k,n] of H.slice(0,25))console.log(`  ${n}회 · ${k}`); if(process.env.STRICT==='1')errs.push(`숨은 오류 ${H.length}종`); }
if(errs.length||B.length){ { const K={}; for(const b of B){ const k=b.split(' · ').slice(0,2).join(' · '); (K[k]=K[k]||[]).push(b); } for(const k in K)console.log(k+' '+K[k].length+'건 · 예: '+K[k][0].split(' · ').slice(2).join(' · ')); } console.log(errs.slice(0,20).join('\n')); console.log(`시뮬 점검(SEED ${SEED}): 오류 ${errs.length}건, 이상값 ${B.length}건${r?` · ${r.end}까지`:''}`); process.exit(1); }
console.log(`시뮬 점검(SEED ${SEED}): 문제 없음 · ${r.end}까지 ${r.sec.toFixed(0)}초`);
if(process.env.ACT==='1'&&r)console.log(`  바쁜 단장: 이직 ${r.sw}번 · 이동 기록 `+Object.entries(r.mv).map(([k,v])=>k+' '+v).join(', '));
