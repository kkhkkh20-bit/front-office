/* 수비 세부 능력 측정: 엔진(dist/engine.js)만으로 시드마다 정규시즌을 돌려 리그 전체 수비 관련 기록을 잰다.
 - 타율(AVG)·인플레이 타구 안타율(BABIP)·경기당 실책·실책 출루(ROE)·도루 시도/성공률·병살·경기당 득점·외야 주자 진루 아웃
 - 세부 능력이 결과를 가르는지(수비 범위 상·하위 야수가 맡은 타구의 안타율, 포수 송구 상·하위의 도루 성공률)도 따로 낸다
 사용: node tools/check-defense.cjs [시즌 수=1]   환경 변수 SEEDS=1,2,3(기본), TEAM(기본 6), DEFSPLIT=0|1(경기 계산에 세부 수비 능력 사용, 기본은 엔진 값)
 비교: 같은 SEEDS로 바꾸기 전후를 돌려 각 항목이 ±2% 안인지 본다. JSON=파일 이면 결과를 저장한다. */
const fs=require('fs'), path=require('path');
const ENGINE=process.env.ENGINE||path.join(__dirname,'..','dist','engine.js'); if(!fs.existsSync(ENGINE)){ console.error('dist/engine.js가 없습니다. bash build.sh --engine-out dist/engine.js를 먼저 실행하세요.'); process.exit(2); }
if(process.argv[2]==='--merge'){ /* 여러 번 나눠 돌린 결과(JSON)를 합친다: node tools/check-defense.cjs --merge a.json b.json [--vs before.json] */
  const ar=process.argv.slice(3), vi=ar.indexOf('--vs'); const load=L=>L.flatMap(f=>JSON.parse(fs.readFileSync(f,'utf8')).per);
  const cur=load(vi<0?ar:ar.slice(0,vi)), base=vi<0?null:load(ar.slice(vi+1)); const sumA=L=>{ const t={}; for(const x of L)for(const k in x)if(typeof x[k]==='number')t[k]=(t[k]||0)+x[k]; return t; };
  const M=defMetrics; const a=M(sumA(cur)), b=base&&M(sumA(base));
  console.log(`시즌 ${cur.length}개 합계`+(b?` (비교 기준 ${base.length}개)`:''));
  for(const k in a)console.log(`  ${k.padEnd(6)} ${a[k].toFixed(4)}`+(b?`  기준 ${b[k].toFixed(4)}  차이 ${((a[k]/b[k]-1)*100).toFixed(2)}%`:''));
  process.exit(0); }
const NS=+process.argv[2]||1, SEEDS=(process.env.SEEDS||'1,2,3').split(',').map(Number), TEAM=+process.env.TEAM||6;
const DS=process.env.DEFSPLIT==null?null:+process.env.DEFSPLIT;
const SRC=fs.readFileSync(ENGINE,'utf8');
const oe=console.error; console.error=()=>{};
function one(seed){
  let a=seed; Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  const run=new Function('NS','TEAM','DS',SRC+`
if(DS!=null&&typeof DEF_SPLIT!=='undefined')DEF_SPLIT=DS;
DEMO.on=false; newGame(TEAM); fdStart(); fdAdvance(false); let g0=0; while(G.fd&&!G.fd.done&&g0++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true;
for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; try{ if(p&&!foreignCheck(G.user,p))signForeign(G.user,id); }catch(e){} }
const A={g:0,pa:0,ab:0,h:0,hr:0,bb:0,hbp:0,so:0,sf:0,e:0,roe:0,sb:0,cs:0,dp:0,r:0,xbo:0,d2:0,d3:0};
const RB={}; /* 자리·타구 유형별 [상위 타구, 상위 안타, 하위 타구, 하위 안타]: 자리마다 타구 안타율이 달라 섞으면 비교가 틀어진다 */
const sub=(p,k)=>typeof dsubOf==='function'?dsubOf(p)[k]:0;
const _sg=simGame; simGame=function(day,h,aa,ps,options){ const g=_sg.apply(this,arguments); try{ if(ps||(options&&options.sides))return g; const S=g.S; A.g++;
  for(const k of ['h','a']){ const s=S[k]; for(const [id,x] of s.box){ if(s.pitchers.includes(id)){ A.roe+=x.roe||0; continue; } A.pa+=x.pa||0; A.ab+=x.ab||0; A.h+=x.h||0; A.hr+=x.hr||0; A.bb+=x.bb||0; A.hbp+=x.hbp||0; A.so+=x.so||0; A.sf+=x.sf||0; A.e+=x.e||0; A.sb+=x.sb||0; A.cs+=x.cs||0; A.r+=x.r||0; A.d2+=x.d||0; A.d3+=x.tr||0; } }
  for(const r of g.pbp||[]){ if(r[3]==='DP')A.dp++; if(Array.isArray(r[14]))for(const m of r[14])if(m&&m.result==='out'&&m.from<m.to&&r[3]!=='SAC'&&r[3]!=='OUT')A.xbo++; }
}catch(x){} return g; };
/* 세부 능력이 결과를 가르는지: 수비 범위 상·하위(그 자리 평균 대비) 야수가 맡은 인플레이 타구, 포수 송구 상·하위의 도루 */
const _br=bipResolve; bipResolve=function(b,p,babip,qb,qp,fs){ const o=_br.apply(this,arguments); try{ if(LBIP&&LBIP.fid!=null&&LBIP.pos!=='P'){ const f=G.players[LBIP.fid]; const v=typeof dsubRel==='function'?dsubRel(f,LBIP.pos,'rng'):0; const k=v>=2?0:v<=-2?2:null; if(k!=null){ const z=RB[LBIP.pos+':'+LBIP.t]=RB[LBIP.pos+':'+LBIP.t]||[0,0,0,0]; z[k]++; if(o!=='OUT')z[k+1]++; } } }catch(x){} return o; };
const step=()=>{ G.live=null; G.res=null; G.stops=[];
  if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(e){}
  if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,false); }catch(e){}
  for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; }
  for(const j of (G.jobs||[]))if(!j.done)try{ jobAnswer(j.tid,false,true); }catch(e){}
  if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); }
  (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(e){} });
  if(G.contract&&!G.contract.done&&G.day>=KD(12,10))try{ confirmContracts(); }catch(e){}
  try{ const n=rosterN(G.user), up=Math.max(0,rosterN(G.user,G.day+1)-n); if(n+up>ROSTER_MAX)trimRoster(G.user,ROSTER_MAX-up); }catch(e){}
  try{ if(!G.unemp&&!G.mgr[G.user]){ if(!G.mmarket||!G.mmarket.length)refreshMgrMarket(); hireMgr(G.mmarket[0].id,2); } }catch(e){}
  try{ advance('day'); }catch(e){ G.day++; } };
const y0=G.year; let n=0; while(G.year<y0+NS&&n++<90000)step();
return {A,RB};`);
  return run(NS,TEAM,DS);
}
const tot={}; const per=[]; const RB={};
for(const s of SEEDS){ const T0=Date.now(); const r=one(s); per.push({seed:s,...r.A,sec:(Date.now()-T0)/1000}); for(const k in r.A)tot[k]=(tot[k]||0)+r.A[k]; for(const k in r.RB){ const z=RB[k]=RB[k]||[0,0,0,0]; for(let i=0;i<4;i++)z[i]+=r.RB[k][i]; } if(process.env.JSON)fs.writeFileSync(process.env.JSON,JSON.stringify({seeds:SEEDS,ns:NS,ds:DS,per},null,1)); } /* 시드마다 저장: 오래 걸려도 중간 결과를 합칠 수 있게 */
console.error=oe;
const M=defMetrics;
function defMetrics(A){ const bip=A.ab-A.so-A.hr+A.sf; return {AVG:A.h/A.ab, BABIP:(A.h-A.hr)/bip, 'E/G':A.e/A.g, 'ROE/G':A.roe/A.g, 'SBA/G':(A.sb+A.cs)/A.g, 'SB%':A.sb/Math.max(1,A.sb+A.cs), 'DP/G':A.dp/A.g, 'R/G':A.r/A.g, 'XBO/G':A.xbo/A.g, '2B/G':A.d2/A.g}; }
const f=v=>v<1?v.toFixed(4):v.toFixed(3);
for(const x of per){ const m=M(x); console.log(`시드 ${x.seed} · 경기 ${x.g/1}(팀 경기 ${x.g*2}) · `+Object.entries(m).map(([k,v])=>k+' '+f(v)).join(' · ')+` · ${x.sec.toFixed(0)}초`); }
const all=M(tot); console.log('합계 · '+Object.entries(all).map(([k,v])=>k+' '+f(v)).join(' · '));
{ let w=0,d=0,base=0; for(const k in RB){ const z=RB[k]; if(z[0]<200||z[2]<200)continue; const n=Math.min(z[0],z[2]); w+=n; d+=n*(z[1]/z[0]-z[3]/z[2]); base+=n*(z[1]+z[3])/(z[0]+z[2]); } if(w)console.log(`수비 범위(그 자리 보통 대비 ±2 이상) 상위 야수 타구 안타율 - 하위 야수(같은 자리·같은 타구 유형끼리 비교) ${(d/w).toFixed(4)} · 그 칸 평균 안타율 ${(base/w).toFixed(4)} · 비교 타구 ${w}`); }
if(process.env.JSON)fs.writeFileSync(process.env.JSON,JSON.stringify({seeds:SEEDS,ns:NS,ds:DS,all,per},null,1));
