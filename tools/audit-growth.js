/* 성장 점검(측정만): 사용자 결정 없이(단장이 처음부터 야인 = 10구단 모두 AI) 여러 시즌을 돌려 선수 성장 기록을 모은다.
 - 해마다 겨울 성장 직전(newYear 첫머리)에 국내 선수 전원의 능력·잠재력·1군 기록을 남긴다(그해 시즌 끝 상태)
 - 은퇴·방출로 사라지기 전 기록을 위해 정규시즌 다음 날에도 한 번 더 남긴다(같은 해는 나중 값이 덮음)
 - 겨울 성장(develop) 때 환경 계수(시설·코치·출전·감독·훈련)를 함께 남긴다
 - 드래프트가 끝나면 지명 순번(라운드·순위)과 참가자 명단을 남긴다
 사용: node tools/audit-growth.js [끝 연도=2036] > out.json   환경 변수 SEED(기본 7)
 결과 JSON을 tools/audit-growth-report.js로 묶어 본다. build.sh로 dist/engine.js를 먼저 만든다. */
const fs=require('fs'), path=require('path');
const ENGINE=path.join(__dirname,'..','dist','engine.js'); if(!fs.existsSync(ENGINE)){ console.error('dist/engine.js가 없습니다. bash build.sh를 먼저 실행하세요.'); process.exit(2); }
const END=+process.argv[2]||2036; const SEED=+process.env.SEED||7; const TEAM=+process.env.TEAM||6; const OUT=process.env.OUT||null;
{ let a=SEED; Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const errs=[]; const oe=console.error; console.error=(...a)=>{ errs.push(a.map(String).join(' ').slice(0,200)); };
const SRC=fs.readFileSync(ENGINE,'utf8');
const run=new Function('errs','END','TEAM','log',SRC+`
DEMO.on=false; newGame(TEAM); fdStart(); fdAdvance(false); let g0=0; while(G.fd&&!G.fd.done&&g0++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true;
try{ firedFlow(G.year,'성장 점검: 처음부터 야인','resign'); }catch(e){ errs.push('야인 전환 '+e.message); }
const D={seed:0,startY:G.startY,players:{},snaps:[],dev:[],drafts:[],fac:[]};
const info=p=>{ let x=D.players[p.id]; if(!x){ x=D.players[p.id]={id:p.id,isP:!!p.isP,pos:p.pos,college:!!p.college,birth:G.year-p.age,init:p.joinY==null&&!p.draft?1:0}; } if(p.draft&&!x.draft)x.draft={y:p.draft.y,rd:p.draft.rd,no:p.draft.no,fd:G.fd&&p.draft.y===G.startY-1?1:0}; x.dt=p.dt; if(p.realK!=null)x.realK=p.realK; if(p.potB!=null)x.potB=p.potB; if(p.blue)x.blue=1; if(p.hidT)x.hidT=p.hidT; if(p.ready)x.ready=1; return x; };
const snap=(tag)=>{ const y=G.year; for(const p of Object.values(G.players)){ if(p.foreign||p.retired)continue; if(p.team==null&&!p.mil)continue; info(p);
  const a=seasonTotal(p,y,'1군'), f=seasonTotal(p,y,'퓨처스'); let war=0; try{ war=a?warOf(a,p):0; }catch(e){}
  const m=p.mil; const svc=m&&m.until&&m.from<=G.day+1&&m.until>G.day-200?m.unit:null;
  D.snaps.push([p.id,y,p.age,+ovr(p).toFixed(2),+p.pot.toFixed(2),p.team,a?a.pa||0:0,a?a.outs||0:0,a?a.g||0:0,a?a.gs||0:0,+war.toFixed(2),f?(p.isP?f.outs||0:f.pa||0):0,svc?(svc==='상무'?1:2):0,p.ys?1:0,p.prospect?1:0,tag]); } };
const _ny=newYear; newYear=function(){ try{ snap(1); }catch(e){ errs.push('snap '+e.message); } return _ny.apply(this,arguments); };
const _dv=develop; develop=function(p){ let r=null; try{ if(!p.foreign&&p.team!=null){ const fe=facEff(p); const svc=p.mil&&p.mil.until&&p.mil.from<=G.day&&p.mil.until>G.day?p.mil.unit:null; const m=G.mgr?mgrOf(p.team):null;
    r=[p.id,G.year,p.age,+ovr(p).toFixed(2),+p.pot.toFixed(2),p.team,+fe.g.toFixed(3),+(G.coach?coachDevMult(p):1).toFixed(3),+playShare(p).toFixed(2),m?m.youth:50,svc?(svc==='상무'?1:2):0,p.trI&&p.trI.n?+(p.trI.s/p.trI.n).toFixed(2):1]; } }catch(e){ r=null; }
  const o=_dv.apply(this,arguments); if(r){ r.push(+ovr(p).toFixed(2),+p.pot.toFixed(2),p.realK??null); D.dev.push(r); } return o; };
const draftSeen=new Set();
const step=()=>{ G.live=null; G.res=null; G.stops=[];
  if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(e){ errs.push('draft '+e.message); }
  if(G.draft&&G.draft.done&&!draftSeen.has(G.draft.y)){ draftSeen.add(G.draft.y); D.drafts.push({y:G.draft.y,cls:(G.draft.cls||[]).slice(),picks:G.draft.picks.filter(k=>k.pid>0).map(k=>[k.pid,k.rd,k.no,k.tid])}); for(const id of G.draft.cls||[]){ const p=G.players[id]; if(p){ const x=info(p); x.cls=G.draft.y; x.pot0=+p.pot.toFixed(2); x.o0=+ovr(p).toFixed(2); } } }
  if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,false); }catch(e){ errs.push('offer '+e.message); }
  for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ errs.push('ev '+e.k+' '+x.message); e.done=true; }
  for(const j of (G.jobs||[]))if(!j.done)try{ jobAnswer(j.tid,false,true); }catch(e){ errs.push('job '+e.message); }
  if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); }
  (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(e){ errs.push('comp '+e.message); } });
  if(G.contract&&!G.contract.done&&G.day>=KD(12,10))try{ confirmContracts(); }catch(e){ errs.push('contract '+e.message); }
  if(G.cal&&G.day===G.cal.end+1)try{ snap(0); }catch(e){ errs.push('snap0 '+e.message); }
  if(dobj(G.day).m===7&&dobj(G.day).d===1)try{ for(const t of G.teams){ let fg=0,n=0; for(const p of domestic(t.id)){ if(p.age<=24){ fg+=facEff(p).g; n++; } } D.fac.push([G.year,t.id,n?+(fg/n).toFixed(3):1,facLv(t.id)]); } }catch(e){}
  try{ advance('day'); }catch(e){ errs.push('advance '+dstr(G.day)+' '+e.message); G.day++; } };
let g=0; const T0=Date.now(); let lastD=G.day, same=0, ly=G.year;
while(G.year<END&&g++<90000){ step(); if(G.year!==ly){ ly=G.year; log(G.year+' '+((Date.now()-T0)/1000).toFixed(0)+'s'); } if(G.day===lastD){ if(++same>=40){ errs.push('진행 멈춤 '+dstr(G.day)); break; } } else { lastD=G.day; same=0; } }
D.unemp=!!G.unemp; D.end=dstr(G.day); return D;`);
let D; try{ D=run(errs,END,TEAM,s=>process.stderr.write(s+'\n')); }catch(e){ errs.push('중단 '+e.stack.slice(0,400)); }
console.error=oe; if(D){ D.seed=SEED; D.errs=errs.slice(0,50); const s=JSON.stringify(D); if(OUT)fs.writeFileSync(OUT,s); else process.stdout.write(s); }
process.stderr.write(`성장 점검(SEED ${SEED}): 오류 ${errs.length}건${D?' · '+D.end+'까지':''}\n`+errs.slice(0,10).join('\n')+'\n');
