/* 장기 시뮬 점검: 화면 없이 엔진(dist/engine.js)만으로 여러 시즌을 돌려 오류와 이상한 값을 찾는다
 - 진행 중 던져진 예외, console.error로 남긴 오류
 - 선수 연봉·능력치가 숫자가 아니거나(NaN) 음수, 나이가 말이 안 되는 경우, 구단 현금이 숫자가 아닌 경우
 - 단장이 할 일(결정·인터뷰·제안·드래프트·보상선수·연봉 계약)은 기본안으로 자동 처리
 사용: node tools/check-sim.js [끝 연도=2029]   환경 변수 SEED(기본 7), TEAM(기본 6)
 build.sh로 dist/engine.js를 먼저 만든다. */
const fs=require('fs'), path=require('path');
const ENGINE=path.join(__dirname,'..','dist','engine.js'); if(!fs.existsSync(ENGINE)){ console.error('dist/engine.js가 없습니다. bash build.sh를 먼저 실행하세요.'); process.exit(2); }
const END=+process.argv[2]||2029; const SEED=+process.env.SEED||7; const TEAM=+process.env.TEAM||6;
{ let a=SEED; Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const errs=[], bad=[]; const oe=console.error; console.error=(...a)=>{ errs.push(a.map(String).join(' ').slice(0,200)); };
/* 숨은 오류: 엔진 곳곳의 빈 catch(e){}가 삼키는 예외를 점검할 때만 드러낸다(소스는 그대로) */
const hidden={}; globalThis.__sw=e=>{ try{ const m=(e&&e.stack||String(e)).split('\n'); const at=(m.find(l=>/at /.test(l))||'').trim().replace(/\(.*?:(\d+):\d+\)/,'(줄 $1)'); const k=(e&&e.message||String(e)).slice(0,120)+' · '+at.slice(0,120); hidden[k]=(hidden[k]||0)+1; }catch(x){} };
let SRC=fs.readFileSync(ENGINE,'utf8'); let nSw=0; SRC=SRC.replace(/catch\((\w+)\)\{\s*\}/g,(m,v)=>{ nSw++; return `catch(${v}){__sw(${v})}`; });
const run=new Function('errs','bad','END','TEAM',SRC+`
DEMO.on=false; newGame(TEAM); fdStart(); fdAdvance(false); let g0=0; while(G.fd&&!G.fd.done&&g0++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true;
for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; try{ if(p&&!foreignCheck(G.user,p))signForeign(G.user,id); }catch(e){} }
const step=()=>{ G.live=null; G.res=null; G.stops=[];
  if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(e){ errs.push('draft '+e.message); }
  if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,false); }catch(e){ errs.push('offer '+e.message); }
  for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ errs.push('ev '+e.k+' '+x.message); e.done=true; }
  for(const j of (G.jobs||[]))if(!j.done)try{ jobAnswer(j.tid,false,true); }catch(e){}
  if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); }
  (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(e){ errs.push('comp '+e.message); } });
  if(G.contract&&!G.contract.done&&G.day>=KD(12,10))try{ confirmContracts(); }catch(e){ errs.push('contract '+e.message); }
  /* 단장이 직접 해야 하는 정리(로스터 초과)는 사람이 하듯 처리 */
  try{ if(rosterN(G.user)>ROSTER_MAX)trimRoster(G.user,ROSTER_MAX); }catch(e){ errs.push('trim '+e.message); }
  try{ if(!G.unemp&&!G.mgr[G.user]){ if(!G.mmarket||!G.mmarket.length)refreshMgrMarket(); hireMgr(G.mmarket[0].id,2); } }catch(e){ errs.push('mgr '+e.message); }
  try{ advance('day'); }catch(e){ errs.push('advance '+dstr(G.day)+' '+e.message); G.day++; } };
let g=0; const T0=Date.now(); let lastD=G.day, same=0;
while(G.year<END&&g++<90000){ step(); if(G.day===lastD){ if(++same>=40){ let why=''; try{ why=blocker()||''; }catch(e){ why='blocker 오류 '+e.message; } bad.push('진행 멈춤 '+dstr(G.day)+(why?' · '+why:'')+(G.gameOver?' · 게임 끝':'')); break; } } else { lastD=G.day; same=0; }
  if(G.day%30===0){ for(const p of Object.values(G.players)){ if(!Number.isFinite(p.sal)||p.sal<0)bad.push(G.year+' 연봉 '+p.name+' '+p.sal); for(const k in p.r)if(!Number.isFinite(p.r[k]))bad.push(G.year+' 능력치 NaN '+p.name+' '+k); if(p.team!=null&&(p.age>46||p.age<16))bad.push(G.year+' 나이 '+p.name+' '+p.age); }
    for(const t of G.teams)if(!Number.isFinite(t.cash))bad.push(G.year+' 현금 '+t.id); } }
return {end:dstr(G.day),sec:(Date.now()-T0)/1000,unemp:!!G.unemp};`);
let r; try{ r=run(errs,bad,END,TEAM); }catch(e){ errs.push('중단 '+e.stack.slice(0,300)); }
console.error=oe;
const B=[...new Set(bad)];
const H=Object.entries(hidden).sort((a,b)=>b[1]-a[1]);
if(H.length){ console.log(`숨은 오류 ${H.length}종(빈 catch ${nSw}곳 중):`); for(const [k,n] of H.slice(0,25))console.log(`  ${n}회 · ${k}`); if(process.env.STRICT==='1')errs.push(`숨은 오류 ${H.length}종`); }
if(errs.length||B.length){ console.log([...errs.slice(0,20),...B.slice(0,20)].join('\n')); console.log(`시뮬 점검(SEED ${SEED}): 오류 ${errs.length}건, 이상값 ${B.length}건${r?` · ${r.end}까지`:''}`); process.exit(1); }
console.log(`시뮬 점검(SEED ${SEED}): 문제 없음 · ${r.end}까지 ${r.sec.toFixed(0)}초`);
