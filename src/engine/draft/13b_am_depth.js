/* ===== 고교·대학 모든 부원이 실제 선수 (사용자 11-17 "고교리그 실제로 시즌 돌리면서 돌아가? 선수들 다 차있어? 고교마다?") =====
   예전: 학교마다 실제 추적 선수(드래프트 후보·저학년)는 0~12명(가운데 5명)이고, 나머지 약 21명은 그날 경기에만 쓰는 일반 부원(저장 안 함)이었다.
   부원은 같은 시드로 이어졌지만 개인 성장·통산 기록·관찰·지명이 없었다.
   이제: 학교·입학 연도·번호(AM_FN) 시드로 정해지는 부원도 한 사람으로 산다.
   - 저장은 가볍게: 이름·체격·첫 능력·성장 버릇·잠재력은 시드로 다시 만들고, 저장하는 것은 입학 때 학교 전력(G.amF.lv), 시즌별 기록 줄(G.amF.fr[연도]),
     학교 방문 수(G.amF.sv[구단][학교][연도]), 관심 부원의 추가 관찰(G.amF.ob), 드래프트에 나간 부원 표시(G.amF.cv)뿐이다.
   - 성장: 학년이 오를 때마다 학년 차(fg)만큼 자라되 사람마다 빠르기가 다르다(일찍 피는 선수 20%·늦게 피는 선수 15%) + 해마다 작은 편차.
   - 잠재력: 졸업 학년 능력 + 남은 성장 여지((27-졸업 나이)×1.2~2.4, 추적 선수는 2.2~3.4) + 드물게 숨은 재능(5%, +6~12). 그래서 어느 학교에서든 늦게 피는 재목이 나온다.
   - 졸업 학년 1월 1일(makeDraftClass): 프로 지원 여부를 그 선수 기량으로 정하고(지원 확률 5~90%), 지원한 부원은 드래프트 후보(G.players)가 된다.
     지원하지 않은 부원은 졸업 학년을 뛰고 진학·실업·은퇴로 떠난다(기록만 남았다가 정리). 드래프트 참가 인원이 지명 수보다 훨씬 많아진다.
   - 관찰: 아마추어 스카우트가 학교를 찾으면 그 학교 부원 모두 1회(추적 선수와 같은 규칙, 모든 구단 같다). 관심 부원은 우선순위만큼 더 본다.
   - 난수: 모두 시드(seededRand·withRng)로만. 본 게임 난수 순서를 바꾸지 않는다. 지명 후보로 만들 때 쓰는 선수 번호도 따로 둔다(G.nextId를 쓰지 않는다) */
const amHash=t=>{ let h=2166136261>>>0; for(let i=0;i<t.length;i++){ h^=t.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h|0; };
const AM_DEP_ID0=9000000, AM_DEP_KEEP=5; /* 부원 출신 후보 번호 시작, 시즌 기록 보관 햇수(대학 4년 + 1) */
function amFS(){ const F=G.amF||(G.amF={lv:{},cv:{},fr:{},sv:{},ob:{}}); for(const k of ['lv','cv','fr','sv','ob'])if(!F[k])F[k]={}; return F; }
/* 입학 때 학교 전력: 있으면 그 값, 없으면 지금 전력(엔진 경로에서만 남긴다) */
function amFLv(sch,ey,lvNow,keep){ const F=amFS(), k=sch+'#'+ey; if(F.lv[k]!=null)return F.lv[k]; if(keep)F.lv[k]=Math.round(lvNow*10)/10; return lvNow; }
/* 시드 부원 한 명의 개인 성장: 빠르기(sp)·해마다 편차(j)·남은 성장 여지(rate)·숨은 재능. 이름표 시드(amf:학교:입학년)와 따로 */
function amFPers(id,ageS){ const r=seededRand('amfg:'+id), n=()=>{ let u=0; while(!u)u=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r()); };
  const u=r(), ty=u<.15?'late':u<.35?'early':''; const sp=ty==='late'?1.6:ty==='early'?.5:clamp(1+n()*.2,.6,1.4); const j=[0,n()*.8,n()*.8,n()*.8];
  const rate=1.2+r()*1.2+(ty==='late'?.4:ty==='early'?-.3:0); /* 부원은 성장 여지가 추적 선수(2.2~3.4)보다 작다: 대부분 아마에서 끝나고, 늦게 피는 선수와 숨은 재능이 드물게 지명권에 든다 */ const hid=r()<.05?6+Math.floor(r()*7):0; const app=r(), v=Math.round(n()*15)/10, inj=Math.round((.12+r()*.14)*1000)/1000;
  return {ty,sp,j,rate,hid,app,v,inj,room:(27-ageS)*rate}; }
/* 학년 gr까지 쌓인 개인 성장(학년 차 fg 기준). 평균은 예전과 같다(fg×(gr-1)) */
const amFGrow=(P,gr,fg)=>fg*(gr-1)*P.sp+P.j.slice(1,gr).reduce((a,b)=>a+b,0);
/* 부원 잠재력(1군 척도): 졸업 학년 능력 + 남은 성장 여지 + 숨은 재능. 졸업 학년 능력은 지금 학년에서 남은 학년 성장분을 더해 본다 */
function amFPot(f,lvl){ const C=AMC[lvl], nG=lvl==='hs'?3:4, P=f.P0; const add=amFGrow(P,nG,C.fg)-amFGrow(P,f.gr,C.fg); const o=amOvr(f.isP,f.r)+add; return {pot:Math.round(clamp(o+P.room+P.hid,20,78)*10)/10,hidT:P.hid,senior:o}; }
/* 부원 id → 학교·입학년·투타·번호 */
function amFId(id){ const m=/^f(.+)#(\d+)([pb])(\d+)$/.exec(String(id)); return m?{sch:m[1],ey:+m[2],isP:m[3]==='p',i:+m[4]}:null; }
const amFLvl=sch=>AREA.some(a=>a.un.includes(sch))?'col':'hs';
/* 시즌별 기록 줄: 진행 중 시즌(G.amL) → 보관(G.amF.fr) → 예전 저장의 지난 시즌 요약(G.amLp.fr) */
function amFRow(sch,ey,isP,i,y){ const S=G.amL&&G.amL.y===y?G.amL:null; const src=S&&S.fr?S:amFS().fr[y]?{fr:amFS().fr[y]}:G.amLp&&G.amLp.y===y?G.amLp:null; return amFillRow(src,sch,ey,isP,i); }
/* 관찰 횟수(구단별): 입학 뒤 그 학교 방문 수 + 관심 부원 추가 관찰 */
function amFObs(sch,ey,id,tid){ const V=((amFS().sv[tid]||{})[sch])||{}; let n=0; for(const y in V)if(+y>=ey)n+=V[y]; const o=amFS().ob[id]; return Math.min(OBS_MAX,Math.round((n+(o&&o[tid]||0))*100)/100); }
function amFVisit(tid,sch,w){ const F=amFS(), y=G.year; const T=F.sv[tid]||(F.sv[tid]={}), S=T[sch]||(T[sch]={}); S[y]=Math.round(((S[y]||0)+w)*100)/100; }
/* 한 부원을 추적 선수(e)와 같은 모양으로: 화면(amPlayerView)·평가(amEstU)·지명 후보 만들기(amMat)가 같이 쓴다 */
let _amFE=null;
function amDepE(id,Y){ Y=Y??G.year; const q=amFId(id); if(!q)return null; const key=Y+':'+id; if(_amFE&&_amFE.g===G&&_amFE.d===G.day&&_amFE.m.has(key))return _amFE.m.get(key);
  if(!_amFE||_amFE.g!==G||_amFE.d!==G.day)_amFE={g:G,d:G.day,m:new Map()}; const lvl=amFLvl(q.sch), f=amFill(q.sch,Y,lvl,amLvOf(q.sch)).find(x=>x.id===id)||amFillAt(q.sch,q.ey,Y,lvl,id); if(!f){ _amFE.m.set(key,null); return null; }
  const a=AREA.find(z=>z.hs.includes(q.sch)||z.un.includes(q.sch)), col=lvl==='col', nG=col?4:3, PT=amFPot(f,lvl), K=f.isP?AM_PK:AM_BK, FK=f.isP?AM_FPK:AM_FBK;
  const rows=[]; for(let yy=q.ey;yy<=Math.min(Y,q.ey+nG-1);yy++){ const h=amFRow(q.sch,q.ey,f.isP,q.i,yy); if(!h)continue; const r=[yy,yy-q.ey+1]; for(const k of K)r.push(FK.includes(k)?h[k]||0:0); r.fz=1; rows.push(r); }
  const obs={}; for(const t of G.teams||[]){ const n=amFObs(q.sch,q.ey,id,t.id); if(n)obs[t.id]=n; }
  const e={id,n:f.n,s:q.sch,a:a?a.k:null,c:col?1:0,gy:q.ey+nG-1,P:f.isP?1:0,pos:f.pos,t:f.t,b:f.b,v:f.P0.v,pot:PT.pot,r:Object.assign({},f.r),ht:f.ht,wt:f.wt,inj:f.P0.inj,y:rows,ty:f.P0.ty==='late'?'late':f.P0.ty==='early'?'early':'',amObs:obs,dep:1,gr:f.gr};
  if(PT.hidT)e.hidT=PT.hidT; _amFE.m.set(key,e); return e; }
/* 졸업한(그해 명단에 없는) 부원: 졸업 학년 기준으로 다시 만든다 */
function amFillAt(sch,ey,Y,lvl,id){ const nG=lvl==='hs'?3:4, y=Math.min(Y,ey+nG-1); if(y<ey)return null; return amFill(sch,y,lvl,amLvOf(sch),true).find(x=>x.id===id)||null; }
/* 그해 부원 기록 줄(기록 순위·추천·학교 화면): amYearRows 모양 */
let _amFYR=null; /* 같은 날 같은 연도는 한 번만(기록 순위 카드 여러 장·AI 관심 명단) */
function amFYearRows(y,lvl){ const S=G.amL&&G.amL.y===y?G.amL:null, k=y+':'+(lvl||'')+':'+G.day+':'+(S?S.tot.hs.g+S.tot.col.g:-1)+':'+Object.keys(amFS().cv).length; if(_amFYR&&_amFYR.g===G&&_amFYR.k===k)return _amFYR.r.slice(); const out=[]; for(const a of AREA)for(const [n,lv] of [...a.hs.map(x=>[x,'hs']),...a.un.map(x=>[x,'col'])]){ if(lvl&&lv!==lvl)continue;
    for(const f of amFill(n,y,lv,amLvOf(n))){ const h=amFRow(n,f.ey,f.isP,f.i,y); if(h)out.push({id:f.id,n:f.n,sch:n,gr:f.gr,isP:f.isP,kind:'f',row:h}); } }
  _amFYR={g:G,k,r:out}; return out.slice(); }
/* 지원한 부원 표시: 그해 명단(amFill)에서 빠지고 드래프트 후보(kind p)로 뛴다 */
const amFConv=(sch,ey,isP,i)=>{ const L=amFS().cv[sch+'#'+ey]; return !!L&&L.includes((isP?'p':'b')+i); };
/* 졸업 학년 1월 1일: 프로 지원 부원 → 드래프트 후보. 지원 확률은 그 선수 기량(잠재력)으로: 30 이하 5% … 42 이상 90%. 어느 구단에도 같은 명단 */
let AM_DEP_ON=true; /* 점검용 스위치 */
function amDepSeniors(Y){ if(!amOn()||!AM_DEP_ON)return []; const F=amFS(), out=[]; if(F.dsY===Y)return Object.values(G.players).filter(p=>p.amDep&&p.amDepY===Y&&p.prospect&&p.team==null); F.dsY=Y; /* 같은 해 다시 부르면(점검·예전 저장 보정) 이미 나온 지원자 그대로 */ if(F.nid==null)F.nid=AM_DEP_ID0;
  for(const a of AREA)for(const [sch,lvl] of [...a.hs.map(x=>[x,'hs']),...a.un.map(x=>[x,'col'])]){ const nG=lvl==='hs'?3:4, ey=Y-nG+1;
    for(const f of amFill(sch,Y,lvl,amLvOf(sch))){ if(f.ey!==ey)continue; const e=amDepE(f.id,Y); if(!e)continue; const pr=clamp((e.pot-30)/13.3,.05,.9); if(f.P0.app>=pr)continue;
      const n0=G.nextId, nid=F.nid++; let p=null; try{ withRng(amHash('amdep:'+f.id),()=>{ const e2=Object.assign({},e,{id:nid,y:e.y.map(r=>r.slice())}); p=amMat(e2); p.amDep=f.id; p.amDepY=Y; if(p.isP)p.amVelo=veloOf(p)-(p.college?ri(1,3):ri(3,6)); else p.amRun=(+runOf(p)+.04).toFixed(2); }); } finally { G.nextId=n0; }
      if(!p)continue; (F.cv[sch+'#'+ey]=F.cv[sch+'#'+ey]||[]).push((f.isP?'p':'b')+f.i); out.push(p);
      for(const t in (G.amFw||{})){ const L=G.amFw[t], k=L.indexOf(f.id); if(k>=0)L[k]=p.id; } const P0=G.amPr||{}; for(const t in P0)if(P0[t][f.id]!=null){ P0[t][p.id]=P0[t][f.id]; delete P0[t][f.id]; } } }
  _amRos=null; _amFE=null; return out; }
/* 1월 1일 정리: 시즌 기록 보관 햇수 밖·졸업한 부원의 표시·방문 수를 지운다 */
function amFClean(Y){ const F=amFS(); for(const y in F.fr)if(+y<Y-AM_DEP_KEEP)delete F.fr[y]; for(const k in F.lv){ const ey=+k.split('#').pop(); if(ey<Y-AM_DEP_KEEP)delete F.lv[k]; } for(const k in F.cv){ const ey=+k.split('#').pop(); if(ey<Y-AM_DEP_KEEP)delete F.cv[k]; }
  for(const t in F.sv)for(const s in F.sv[t])for(const y in F.sv[t][s])if(+y<Y-AM_DEP_KEEP)delete F.sv[t][s][y];
  for(const id in F.ob){ const q=amFId(id); if(!q||q.ey<Y-AM_DEP_KEEP)delete F.ob[id]; }
  for(const t in (G.amFw||{})){ const L=G.amFw[t]; for(let i=L.length-1;i>=0;i--){ const q=typeof L[i]==='string'&&L[i][0]==='f'?amFId(L[i]):null; if(q&&q.ey+(amFLvl(q.sch)==='hs'?3:4)-1<Y)L.splice(i,1); } } }
/* 시즌이 끝나면(또는 새해에) 그 시즌 부원 기록 줄을 보관 */
function amFKeep(S){ if(!S||!S.fr)return; amFS().fr[S.y]=S.fr; }
