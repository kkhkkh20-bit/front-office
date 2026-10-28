/* ===== 창단 드래프트 =====
   리그의 국내 선수 전원을 한데 모아 10개 구단이 지그재그 순서로 25라운드를 지명한다. 26번째부터는 자동 배분.
   계약(연봉·남은 기간)은 선수를 따라간다. 외국인 선수는 따로 영입한다 */
const FD_ROUNDS=25;
/* 창단 드래프트는 10라운드 직접 지명. 끝나면 단장이 고른다: 나머지를 스카우트에게 맡기거나(빈 포지션 우선 자동 지명), 5라운드 더 뽑는다 */
const FD_MAN=10, FD_MORE=5;
function fdManDone(){ const F=G.fd; if(!F||F.done||F.open===false)return false; const nx=F.picks.slice(F.cur).find(x=>x.tid===G.user); return !!nx&&nx.rd>(F.man||FD_ROUNDS); }
const FD_TGT={P:13,C:2,'1B':1,'2B':2,'3B':1,SS:2,LF:1,CF:2,RF:1};
/* 창단 지명 순서: 쓸 수 있는 연봉이 적은 구단이 먼저 뽑는다. 돈과 지명 순번이 맞바뀌는 균형 장치 */
function fdCapOf(tid){ try{ return fdFin(tid).avail; }catch(e){ return capOf(G.year); } }
function fdOrder(){ return G.teams.map(t=>({id:t.id,v:fdCapOf(t.id)+hn('fdo'+G.year,t.id)*30})).sort((a,b)=>a.v-b.v).map(x=>x.id); }
function fdStart(){ const ids=[]; for(const t of G.teams)t.cap=null; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.prospect||(p.joinY>G.year))continue; p.fdFrom=p.team; p.team=null; p.fdPool=true; delete p.role; ids.push(p.id); if(p.fsx==null)p.fsx=Math.round(clamp(N(0,4.5),-9,9)*10)/10; } /* fsx: 실전 감각(숨은 값). 기록에는 묻어나지만 툴을 보는 눈에는 안 보인다 */
  G.lineup={}; const order=fdOrder(); const picks=[];
  for(let r=0;r<FD_ROUNDS;r++){ const seq=r%2?[...order].reverse():order; seq.forEach((tid,i)=>picks.push({rd:r+1,no:i+1,tid,pid:null})); }
  G.startY=G.year; G.fd={pool:ids,all:ids.slice(),order,picks,cur:0,done:false,y:G.year,open:false,man:FD_MAN};
  { let f=[]; for(let i=0;i<4;i++)f=f.concat(scoutFindWeek(true)||[]); if(f.length)mail('해외 스카우트',`우리 스카우트가 찾아 둔 후보 ${f.length}명`,`${f.map(q=>`${q.name}(${q.nat} · ${posLabel(q)} · ${q.prevLvl})`).join('\n')}\n\n에이전트가 리그 전체에 돌린 후보와 달리, 이 선수들은 아직 우리만 압니다.`,{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); }
  /* 다른 구단도 외국인 절반 정도는 새로 뽑는다: 같은 시장에서 경쟁 */ for(const t of G.teams){ if(t.id===G.user)continue; for(const p of foreignOf(t.id)){ if(R()<.45){ delete G.players[p.id]; } } } try{ refreshFMarket(0); }catch(e){} fdEstAll();
  mail('KBO','창단 드래프트: 모든 선수를 새로 나눕니다',`리그 국내 선수 ${ids.length}명을 한데 모아 10개 구단이 ${FD_ROUNDS}라운드를 지명합니다. 순서는 예산 여유(국내 선수 연봉에 쓸 수 있는 돈)이 적은 구단부터이고, 라운드마다 뒤집힙니다(지그재그). 우리 구단 첫 지명은 ${order.indexOf(G.user)+1}번째입니다.\n\n선수의 연봉과 계약 기간은 그대로 따라옵니다. 상위 40명 연봉 합계가 샐러리캡(${money(capOf(G.year))})을 넘지 않게 고르세요. ${FD_ROUNDS}라운드가 끝나면 남은 선수는 구단마다 자동으로 나눠 받습니다. 외국인 선수는 드래프트 뒤에 따로 영입합니다.`,{imp:true,kind:'드래프트'}); }
function fdCounts(tid){ const c={}; for(const p of playersOf(tid))if(!p.foreign){ const k=fdSlot(p); c[k]=(c[k]||0)+1; } return c; }
function fdCtx(tid){ return {c:fdCounts(tid),cp:capPay(tid),cap:capOf(G.year)}; }
/* 창단 드래프트: 어느 구단도 능력치를 모른다. 지난 시즌 기록(OPS·장타율·볼삼비, 투수는 FIP·WHIP·삼진/볼넷)으로 추정하고
   스카우트 관찰이 30% 섞인다. 표본이 적으면 평균 쪽으로 당긴다 */
/* 공개 WAR: 투수는 평균자책점 기반 그대로, 타자는 수비 부분을 공개 수비 지표처럼 오차(능력치 ±8 수준)를 섞어 계산 */
/* 창단 전 시즌 WAR는 공개 추정치(수비 오차 포함)로 한 번 정해 두고, 어느 화면에서든 같은 값을 쓴다 */
function warPub(h,p){ return warOf(h,p); }
function fdWar(p,h){ if(p.isP||!h||!h.pa)return warRaw(h,p); const pos=h.pos||p.pos; const w=warRaw(h,p); if(pos==='DH')return w; const true_d=(p.r.def-50)*.3*h.pa/600/10, noisy=(p.r.def-50+hn('dwar',p.id)*8)*.3*h.pa/600/10; return w-true_d+noisy; }
/* 평균 타구속도(km/h): 트래킹 데이터처럼 공개된 측정치. 파워가 주로, 컨택이 조금 관여한다 */
/* 트래킹 측정치: 실제 구단이 보는 수치처럼 능력에 연동되지만 측정 오차가 있다(같은 선수는 늘 같은 값) */
/* 측정 데이터: 한 시즌 측정이라 실제 능력과 어긋남(측정 오차)이 있다. 그래도 겉 기록보다는 실력을 잘 보여 준다 */
function trackOf(p){ if(!p)return null; const r=p.r, n=(k,s)=>hn('tr'+k,p.id)*(s||1);
  if(p.isP){ const v=veloOf(p); return {velo:v,vmax:veloMax(p),rpm:Math.round((2080+(r.stf-20)/60*420+n('rpm',70))/10)*10,ext:Math.round((1.78+n('ext',.09)+(r.stf-50)*.001)*100)/100,whiff:Math.round(17+(r.stf-20)/60*15+n('wh',3)),gb:Math.round(clamp(44+hn('gb',p.id)*7,30,62)),csw:Math.round(25+(r.ctl-20)/60*7+(r.stf-20)/60*4+n('csw',2))}; }
  const ev=evOf(p); return {ev,evmax:Math.round(156+(r.pow-20)/60*24+n('evm',4)),hh:Math.round(22+(r.pow-20)/60*24+(r.con-50)*.08+n('hh',4)),whiff:Math.round(31-(r.con-20)/60*18+n('bw',3.2)),chase:Math.round(36-(r.eye-20)/60*16+n('ch',3.2)),run:+runOf(p),arm:Math.round(124+(r.def-20)/60*22+(['SS','3B','RF','C'].includes(p.pos)?3:0)+n('arm',4))}; }
/* 최고 구속: 평균보다 4~7km 빠르다 */
function veloMax(p){ return Math.round(veloOf(p)+5+hn('vmax',p.id)*1.5); }
function evOf(p){ if(!p||p.isP)return null; return Math.round(126+(p.r.pow-20)/60*17+(p.r.con-50)*.04+hn('ev',p.id)*3.2); }
/* 최근 3년 1군 합계(게임 시작 전 2023·2024 포함) */
function fdThree(p,y){ let t=null, ys=0; for(let yy=y-2;yy<=y;yy++){ const h=seasonTotal(p,yy,'1군'); if(!h||!(p.isP?h.outs:h.pa))continue; ys++; if(!t)t=Object.assign({},h); else addTo(t,h); } if(t)t.ys=ys; return t; }
function fdStatLine(p,y){ const h1=seasonTotal(p,y,'1군'), h2=seasonTotal(p,y,'퓨처스');
  if(p.isP){ const h=h1&&h1.outs>=30?h1:h2&&h2.outs>=30?h2:h1||h2; if(!h||!h.outs)return null; const ip=h.outs/3; const T3=fdThree(p,y); return {lvl:h===h1?1:2,h,n:ip,t:trackOf(p),velo:veloOf(p),vmax:veloMax(p),war:warOf(h,p),fip:(13*(h.hr||0)+3*h.bb-2*h.so)/ip+3.2,fip3:T3&&T3.outs>=60?(13*(T3.hr||0)+3*T3.bb-2*T3.so)/(T3.outs/3)+3.2:null,n3:T3?T3.outs/3:0,ys:T3?T3.ys:0,whip:(h.h+h.bb)/ip,k9:h.so*9/ip,kbb:h.so/Math.max(1,h.bb),era:h.er*9/ip,g:h.g||0,gs:h.gs||0,ipg:h.g?ip/h.g:0}; }
  const h=h1&&h1.pa>=30?h1:h2&&h2.pa>=30?h2:h1||h2; if(!h||!h.pa)return null; const r=bRate(h); const T3=fdThree(p,y); return {lvl:h===h1?1:2,h,n:h.pa,t:trackOf(p),ev:evOf(p),war:warPub(h,p),babip:(h.h-h.hr)/Math.max(1,h.ab-h.so-h.hr),ops3:T3&&T3.pa>=150?bRate(T3).ops:null,n3:T3?T3.pa:0,ys:T3?T3.ys:0,avg:r.avg,obp:r.obp,slg:r.slg,ops:r.ops,iso:r.slg-r.avg,bbk:h.bb/Math.max(1,h.so),hr:h.hr,sb:h.sb||0}; }
function olsFit(X,y,w){ const k=X[0].length+1; const A=Array.from({length:k},()=>new Array(k+1).fill(0));
  for(let i=0;i<X.length;i++){ const r=[1,...X[i]], wi=w[i]; for(let a=0;a<k;a++){ for(let b=0;b<k;b++)A[a][b]+=wi*r[a]*r[b]; A[a][k]+=wi*r[a]*y[i]; } }
  for(let a=0;a<k;a++)A[a][a]+=1e-6; for(let c=0;c<k;c++){ let m=c; for(let r=c+1;r<k;r++)if(Math.abs(A[r][c])>Math.abs(A[m][c]))m=r; [A[c],A[m]]=[A[m],A[c]]; const d=A[c][c]||1e-9; for(let r=0;r<k;r++){ if(r===c)continue; const f=A[r][c]/d; for(let j=c;j<=k;j++)A[r][j]-=f*A[c][j]; } }
  return A.map((r,i)=>r[k]/(r[i]||1e-9)); }
const fdFeat=(p,L)=>p.isP?[L.k9,L.h.bb*9/L.n,(L.h.hr||0)*9/L.n,L.whip,Math.min(7,L.ipg),L.g?L.gs/L.g:0]:[L.obp,L.slg,L.iso,Math.min(1.5,L.bbk),L.sb/Math.max(1,L.n)*100,L.avg];
/* 추천의 관점(정답지가 아니다):
   - 스카우트: 지난 시즌 '겉 기록'(타율·홈런·타점·도루 / ERA·승·삼진)과 눈으로 본 툴. 힘·발·구위를 좋아하고 선구안·제구는 덜 쳐준다. 운 좋은 시즌에 잘 속는다.
   - 전력분석팀: 최근 2년 세부 지표(출루·순장타·볼삼비·타구속도 / FIP·K-BB·헛스윙)를 표본 크기만큼 믿는다. 수비와 나이에 따른 변화는 계산에 넣지 않는다.
   둘 다 틀리는 방향이 있다. 여러 해 기록·수비 측정·나이를 함께 읽으면 둘보다 잘 고를 수 있다 */
function fdZ(A,f){ const v=A.map(f); const m=v.reduce((a,b)=>a+b,0)/v.length; const sd=Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/v.length)||1; return x=>(f(x)-m)/sd; }
function fdMap(A,key,out){ const ov=A.map(x=>ovr(x.p)).sort((a,b)=>a-b); [...A].sort((a,b)=>a[key]-b[key]).forEach((x,i)=>{ out[x.p.id]=Math.round(ov[i]*10)/10; }); }
function fdTwo(p,y){ /* 최근 2년 합산(분석팀용) */ const L=[seasonTotal(p,y,'1군'),seasonTotal(p,y-1,'1군')].filter(Boolean); if(!L.length)return null; const t=Object.assign({},L[0]); for(const h of L.slice(1))addTo(t,h); return t; }
function fdEstAll(){ const F=G.fd; if(!F)return {}; const y=F.y-1; const P=F.pool.map(id=>G.players[id]).filter(Boolean); const grp={};
  for(const p of P){ const L=fdStatLine(p,y); const k=(p.isP?'P':'B')+(L?L.lvl:0); (grp[k]=grp[k]||[]).push({p,L}); }
  const est={}, ana={};
  for(const k in grp){ const A=grp[k]; const isP=k[0]==='P';
    const W=A.filter(x=>x.L); if(W.length<8){ A.forEach(x=>{ est[x.p.id]=ovr(x.p); ana[x.p.id]=ovr(x.p); }); continue; }
    /* 스카우트: 겉 기록. 표본이 작아도 거의 깎지 않는다(운 좋은 한 해에 혹한다) */
    if(isP){ const za=fdZ(W,x=>-x.L.era), zw=fdZ(W,x=>(x.L.h.w||0)/Math.max(1,x.L.n)*100), zk=fdZ(W,x=>x.L.k9); W.forEach(x=>{ x.s=.55*za(x)+.15*zw(x)+.3*zk(x); x.s*=x.L.n/(x.L.n+12); }); }
    else { const za=fdZ(W,x=>x.L.avg), zh=fdZ(W,x=>x.L.hr/Math.max(1,x.L.n)*600), zr=fdZ(W,x=>(x.L.h.rbi||0)/Math.max(1,x.L.n)*600), zs=fdZ(W,x=>x.L.sb/Math.max(1,x.L.n)*600); W.forEach(x=>{ x.s=.42*za(x)+.28*zh(x)+.15*zr(x)+.15*zs(x); x.s*=x.L.n/(x.L.n+40); }); }
    /* 전력분석팀: 최근 2년 세부 지표, 표본만큼 믿는다 */
    W.forEach(x=>{ const t=fdTwo(x.p,y); x.t=t&&(isP?t.outs>=30:t.pa>=60)?t:x.L.h; });
    if(isP){ const ip=x=>Math.max(1,x.t.outs/3); const zf=fdZ(W,x=>-((13*(x.t.hr||0)+3*x.t.bb-2*x.t.so)/ip(x))), zkb=fdZ(W,x=>(x.t.so-x.t.bb)*9/ip(x)), zwh=fdZ(W,x=>trackOf(x.p).whiff); W.forEach(x=>{ x.a=(.45*zf(x)+.35*zkb(x)+.2*zwh(x))*ip(x)/(ip(x)+40); }); }
    else { const r=x=>bRate(x.t); const zo=fdZ(W,x=>r(x).obp), zi=fdZ(W,x=>r(x).slg-r(x).avg), zb=fdZ(W,x=>x.t.bb/Math.max(1,x.t.so)), ze=fdZ(W,x=>evOf(x.p)); W.forEach(x=>{ x.a=(.32*zo(x)+.3*zi(x)+.13*zb(x)+.25*ze(x))*x.t.pa/(x.t.pa+180); }); }
    A.forEach(x=>{ if(!x.L){ x.s=-1.5; x.a=-1.5; } });
    fdMap(A,'s',est); fdMap(A,'a',ana); }
  F.est=est; F.ana=ana; return est; }
/* 툴 관찰의 치우침: 스카우트는 힘·발·구위를 좋아하고 선구안·제구는 덜 쳐준다 */
function fdToolBias(p){ const r=p.r; return p.isP?(r.stf-50)*.14-(r.ctl-50)*.12+(veloOf(p)-145)*.12:(r.pow-50)*.12+(r.spd-50)*.08-(r.eye-50)*.12; }
function fdSeenBy(tid,p){ const F=G.fd; if(!F.est||!F.ana)fdEstAll(); const o=ovr(p); const S=F.est[p.id]!=null?F.est[p.id]:o, An=F.ana[p.id]!=null?F.ana[p.id]:o;
  let sd; if(tid===G.user){ const sk=(G.scouts||[]).reduce((a,s)=>Math.max(a,s.skill||0),0); sd=SCOUT_SD[clamp(sk,1,5)]; } else sd=team(tid).scoutSd||6;
  const tob=o-(p.fsx||0)*.85+fdToolBias(p)+hn('fdo'+tid,p.id)*sd; const sc=S*.55+tob*.45;
  /* 우리 추천은 스카우트 관점 그대로. 다른 구단은 스카우트와 분석팀을 반씩 섞어 본다 */
  const seen=tid===G.user?sc:sc*.5+An*.5;
  const up=Math.max(0,26-p.age)*1.3+Math.max(0,p.pot-o)*.25+hn('fdp'+tid,p.id)*sd*.4;
  return {o:seen,pot:seen+Math.max(0,up),sc,an:An}; }
/* 화면용: 스카우트 등급과 분석팀 등급(분석원이 있을 때만) */
function fdViews(p){ if(!G.fd)return null; const S=fdSeenBy(G.user,p); const lv=dataLv(G.user); return {sc:S.sc,an:lv>=1?S.an:null,up:p.age<=26&&S.pot-S.o>=6}; }
function fdSlot(p){ return p.isP?'P':p.pos; }
function fdScore(tid,p,auto,X){ X=X||fdCtx(tid); const t=team(tid); const S=fdSeenBy(tid,p); const o=S.o, pot=S.pot; const pol=tid===G.user&&auto?(G.fdPol||'need'):null; /* 맡기기 방침 */ const pw=pol==='now'?0:pol==='young'?.9:.5;
  let eff=p.age<=25?o+Math.max(0,pot-o)*pw:p.age>=32?o-(p.age-31)*1.3:o; if(pol==='young')eff+=p.age<=24?2:p.age>=31?-3:0; let v=Math.pow(Math.max(0,eff-34),1.7)/10;
  const k=fdSlot(p); const c=X.c; const tg=FD_TGT[k]||1; v*=pol==='now'?((c[k]||0)<tg+2?1:.8):pol==='need'?((c[k]||0)<tg?1.35:(c[k]||0)<tg+2?.8:.45):(c[k]||0)<tg?1.15:(c[k]||0)<tg+2?.85:.55;
  const cap=X.cap, cp=X.cp; if(cp+p.sal>cap*.97)v*=.25; else v-=p.sal/100*(pol==='cheap'?.25:.06)*(t.owner==='profit'?1.3:1);
  if(isAway(p))v*=.5; if(!auto&&tid!==G.user)v+=hn('fd'+tid,p.id)*v*.12; if(tid===G.user&&(G.shortlist||[]).includes(p.id))v=pol==='board'?v*1.8+6:v*1.2+2; return v; }
function fdBest(tid,auto){ let best=null,bs=-1e9; const X=fdCtx(tid); for(const id of G.fd.pool){ const p=G.players[id]; if(!p||!p.fdPool)continue; const v=fdScore(tid,p,auto,X); if(v>bs){bs=v;best=id;} } return best; }
function fdUserRec(n){ const X=fdCtx(G.user); const L=G.fd.pool.map(id=>G.players[id]).filter(p=>p&&p.fdPool).map(p=>({p,v:fdScore(G.user,p,true,X)})).sort((a,b)=>b.v-a.v); return L.slice(0,n||5).map(x=>x.p); }
function fdPick(pid){ const F=G.fd; if(!F||F.done)return '드래프트가 없습니다.'; const pk=F.picks[F.cur]; const p=G.players[pid]; if(!pk||!p||!p.fdPool)return '지명할 수 없는 선수입니다.';
  p.team=pk.tid; p.fdPool=false; delete p.role; p.rAdj=0; pk.pid=pid; pk.o0=Math.round(ovr(p)); pk.age0=p.age; F.pool=F.pool.filter(x=>x!==pid); F.cur++; story(p,`${G.year} 창단 드래프트 ${pk.rd}라운드 ${pk.no}번째 · ${tname(pk.tid)} 지명`,'move');
  if(pk.tid!==G.user&&(G.shortlist||[]).includes(pid))(F.lost=F.lost||[]).push({pid,tid:pk.tid,rd:pk.rd,nm:p.name});
  if(F.cur>=F.picks.length)fdFinish(); return ''; }
/* 창단 드래프트 뒤 AI 구단 연봉 맞추기: 드래프트는 연봉을 따라가므로 어떤 구단은 상한의 50%대에 머문다.
   AI 구단은 새 선수단 주축과 재계약해 상한의 75~83%(시즌 중 군 입대 등으로 조금 줄어 72~78%)까지 올린다(실제 KBO 구단 평균 75% 안팎). 상한은 넘지 않는다 */
function fdAiPayFill(){ const cap=capOf(G.year);
  for(const t of G.teams){ if(t.id===ME())continue; const tgt=cap*(t.indie?rnd(.7,.76):rnd(.75,.83)); let gap=tgt-capPay(t.id); if(gap<=0)continue;
    for(let pass=0;pass<3&&gap>5;pass++){ const ps=domestic(t.id).filter(p=>!isRookie(p)&&!p.ys&&ovr(p)>=45).sort((a,b)=>ovr(b)-ovr(a)).slice(0,20); const tot=sum(ps.map(p=>Math.max(1,ovr(p)-40)));
      for(const p of ps){ const lim=p.faC?Math.min(2600,Math.max(p.sal,marketSal(ovr(p))*1.5)):Math.max(p.sal,preCap(p)); const add=Math.min(lim-p.sal,round5(gap*Math.max(1,ovr(p)-40)/tot)); if(add<=0)continue; p.sal=round5(p.sal+add); gap-=add; if(gap<=5)break; } } } }
/* 한 번에 한 명씩: 실시간 드래프트 진행용 */
function fdStep(){ const F=G.fd; if(!F||F.done||F.open===false)return null; const pk=F.picks[F.cur]; if(!pk)return null; if(fdManDone())return null; if(pk.tid===G.user)return 'user'; const id=fdBest(pk.tid,false); if(id==null){ fdFinish(); return null; } fdPick(id); return {pk,pid:id}; }
function amStep(){ const d=G.draft; if(!d||d.done)return null; const pk=d.picks[d.cur]; if(!pk)return null; if(pk.tid===G.user)return 'user'; const id=aiDraftPick(pk.tid); if(!id){ finishDraft(); return null; } if(id===-1){ passCurrent(); return {pk,pass:true}; } doPick(id); return {pk,pid:id}; }
function fdAdvance(stopAtUser){ const F=G.fd; let g=0; while(F&&!F.done&&g++<400){ const pk=F.picks[F.cur]; if(pk.tid===G.user&&stopAtUser)return; const id=fdBest(pk.tid,pk.tid===G.user); if(id==null){ fdFinish(); break; } if(pk.tid===G.user)pk.auto=true; fdPick(id); } }
function fdFinish(){ const F=G.fd; if(!F||F.done)return; /* 남은 선수 자동 배분: 구단 국내 선수 52명까지 지그재그 */
  let r=0, guard=0; while(F.pool.length&&guard++<80){ const seq=r%2?[...F.order].reverse():F.order; let any=false; for(const tid of seq){ if(domestic(tid).length>=52)continue; const id=fdBest(tid,true); if(id==null)break; const p=G.players[id]; p.team=tid; p.fdPool=false; F.pool=F.pool.filter(x=>x!==id); any=true; } if(!any)break; r++; }
  for(const id of F.pool){ const p=G.players[id]; if(!p)continue; story(p,'창단 드래프트에서 지명받지 못해 은퇴','move'); delete G.players[id]; }
  F.pool=[]; F.done=true; for(const p of Object.values(G.players)){ delete p.fdPool; delete p.fdFrom; }
  for(const t of G.teams){ if(rosterN(t.id)>ROSTER_MAX)trimRoster(t.id,ROSTER_MAX); } try{ fdAiPayFill(); }catch(e){} try{ aiCapAll(); }catch(e){} try{ foundDefaults(); }catch(err){} planSup(); G.tsug=null; try{ G.tgrow=[]; ovrSnap(); growSnap(); }catch(e){}
  const mine=F.picks.filter(x=>x.tid===G.user&&x.pid).map(x=>G.players[x.pid]).filter(Boolean); const ci=capInfo(G.user);
  try{ G.proj=G.teams.map(x=>({id:x.id,r:teamRating(x.id)+hn('proj'+G.year,x.id)*.7})).sort((p,q)=>q.r-p.r).map(x=>x.id); const pr=G.proj.indexOf(G.user)+1;
    setGoals(`창단 드래프트로 선수단이 꾸려졌습니다. 전력분석팀은 외국인 선수 영입 전 기준으로 우리를 10개 구단 중 ${pr}위 전력으로 봅니다. 창단 첫해이니 구단주도 무리한 목표는 잡지 않았습니다.`,true); G.goals.fd=true;
    news('분석',`창단 드래프트 평가: ${tshort(G.user)} ${pr}위 전력`,`전문가들은 창단 드래프트를 마친 ${tname(G.user)}을(를) ${pr}위 전력으로 봅니다. 외국인 선수 영입이 남았습니다.`,0); }catch(err){}
  try{ const L=F.picks.filter(x=>x.tid===G.user&&x.pid&&G.players[x.pid]); const P=L.map(x=>G.players[x.pid]); const nP=domestic(G.user).filter(p=>p.isP).length, nB=domestic(G.user).length-nP;
    mail('스카우트팀장','창단 드래프트 결과: 우리 지명 선수',`창단 드래프트가 끝났습니다. 지명 ${L.length}명, 자동 배분을 합친 국내 선수는 투수 ${nP}명 · 야수 ${nB}명입니다.\n\n${L.map(x=>{ const p=G.players[x.pid]; return `${x.rd}라운드  ${p.name} (${posLabel(p)}, ${p.age}세, 능력 ${dvo(p)})`; }).join('\n')}\n\n능력은 100점 기준으로 63이 1군 평균, 75 이상이 주전 상위권입니다. 투수 보직은 감독이 정합니다.`,{kind:'업무',acts:[{l:'선수단 보기',a:'go',v:'roster:field'}]}); }catch(err){}
  try{ if(G.tut&&!G.tut.done){ G.tut.step=0; sendTut(); } }catch(err){}
  chron('found',`창단 드래프트로 선수단 구성 · 1라운드 ${(()=>{ const x=F.picks.find(q=>q.tid===G.user&&q.rd===1); const p=x&&G.players[x.pid]; return p?p.name:'-'; })()}`);
  stop('드래프트',`창단 드래프트가 끝났습니다. 우리 구단은 ${F.picks.filter(x=>x.tid===G.user&&x.pid&&!x.auto).length}명을 직접 지명했습니다(자동 지명 ${F.picks.filter(x=>x.tid===G.user&&x.pid&&x.auto).length}명, 나머지는 자동 배분). 상위 40명 연봉 ${money(ci.pay)} / 상한 ${money(ci.cap)}${ci.over>0?` (상한 ${money(ci.over)} 초과: 시즌 끝까지 넘으면 경쟁균형세)`:''}. 이제 감독을 먼저 선임하고, 감독과 상의해 외국인 선수를 뽑으세요.`); }
/* 창단 직후 기본 운영안: 의무·스카우트·2군 연수를 비서가 기본값으로 채워 둔다. 단장은 감독·외국인 선수와 전력 보강에 집중한다 */
function foundDefaults(){ const done=[], acts=[];
  if(!G.medSet){ G.medSet=true; done.push(`의무: 부상 방지 ${G.med.prev}단계 · 병원 제휴 ${G.med.hosp==='none'?'없음':G.med.hosp}`); acts.push({l:'의무 운영',a:'goWork',v:'부상방지·병원'}); }
  const am=G.scouts.filter(s=>(s.role||'am')==='am'); const have=new Set(am.map(s=>s.region)); const miss=REG.filter(r=>!have.has(r));
  for(const r of miss){ if(G.scouts.length>=SCOUT_MAX)break; const sc=mkScout(2); sc.region=r; sc.role='am'; sc.since=-999; G.scouts.push(sc); done.push(`스카우트: ${r} 담당 ${sc.name} 채용(연 ${money(sc.sal)})`); }
  if(miss.length)acts.push({l:'스카우트 팀',a:'goWork',v:'스카우트팀'});
  if(!(G.devProg||[]).length){ const L=domestic(G.user).filter(p=>p.age<=23&&!p.e1&&p.pot-ovr(p)>=6).sort((a,b)=>(b.pot-ovr(b))-(a.pot-ovr(a))).slice(0,2);
    for(const p of L){ const k=p.isP?(p.r.ctl<p.r.stf?'ctl':'stf'):(p.r.con<p.r.pow?'bat':'pow'); setDev(p.id,k); done.push(`2군 연수: ${p.name}(${posLabel(p)}, ${p.age}세) ${DEVP[k].l}`); }
    if(L.length)acts.push({l:'2군 연수',a:'goWork',v:'2군연수'}); }
  if(!G.mgr[G.user])acts.unshift({l:'감독 선임',a:'goWork',v:'감독'});
  if(done.length)mail(`비서 ${SEC}`,'기본 운영안을 채워 두었습니다',`창단 직후라 손이 덜 가도록 운영 기본안을 적용했습니다. 모두 언제든 바꿀 수 있습니다.\n\n${done.join('\n')}\n\n단장님은 감독부터 선임하시고, 새 감독과 상의해 외국인 선수를 구성하시면 됩니다.`,{kind:'업무',face:'sec',acts:acts.slice(0,3)}); }
/* 시즌 회고: 우리 선수 중심으로 영입 기대와 실제 기여, 트레이드 결과, 젊은 선수, 내년 공백을 한 장에 */
function seasonReview(y){ const tid=G.user; const ps=playersOf(tid); const W=p=>{ const h=seasonTotal(p,y,'1군'); const w=h?warOf(h,p):0; return Math.abs(w)<.05?0:w; }; const L=[];
  const top=ps.map(p=>({p,w:W(p)})).sort((a,b)=>b.w-a.w).slice(0,3); if(top.length)L.push('[올해의 선수] '+top.map(x=>`${x.p.name}(${posLabel(x.p)}) WAR ${x.w.toFixed(1)}`).join(', '));
  const how=t=>/창단 드래프트/.test(t)?'창단 지명':/트레이드/.test(t)?'트레이드':/FA/.test(t)?'FA':/외국인|아시아쿼터/.test(t)?'외국인':/드래프트/.test(t)?'신인':'영입';
  const nw=ps.map(p=>{ const st=(p.story||[]).filter(x=>x.y===y&&x.k==='move'); return st.length?{p,how:how(st[st.length-1].t)}:null; }).filter(x=>x&&x.how!=='신인'&&x.how!=='창단 지명');
  if(nw.length){ const rows=nw.map(x=>({...x,w:W(x.p)})).sort((a,b)=>b.w-a.w); L.push('[올해 영입한 선수] '+rows.slice(0,6).map(x=>`${x.p.name}(${x.how}, 연봉 ${money(x.p.sal)}) WAR ${x.w.toFixed(1)}${x.w>=1?` · 1WAR당 ${money(Math.round(x.p.sal/x.w))}`:x.w<0.3?' · 기대 이하':''}`).join(' / ')); }
  const TR=(G.trades||[]).filter(t=>t.y===y&&t.gi); for(const t of TR.slice(0,8)){ const r=tradeReport(t); if(r)L.push(`[트레이드] ${tshort(t.with)}와(과): 받은 ${t.get.join(', ')} WAR ${r.got.toFixed(1)} · 준 ${t.give.join(', ')} WAR ${r.gave.toFixed(1)} → ${r.net>=0.5?'이득':r.net<=-0.5?'손해':'비슷'}`); }
  const f0=G.fut0&&G.fut0.y===y?G.fut0.m:{}; const yg=ps.filter(p=>!p.foreign&&p.age<=25).map(p=>({p,d:f0[p.id]!=null?ovr(p)-f0[p.id]:0,w:W(p)})).filter(x=>x.d>=2||x.w>=1).sort((a,b)=>(b.d+b.w*2)-(a.d+a.w*2)).slice(0,3);
  if(yg.length)L.push('[성장한 젊은 선수] '+yg.map(x=>`${x.p.name}(${x.p.age}세) ${[x.d>=1?`능력 +${Math.round(x.d)}`:'',x.w>=1?`WAR ${x.w.toFixed(1)}`:''].filter(Boolean).join(' · ')}`).join(', '));
  const out=ps.filter(p=>!p.foreign&&!p.prospect&&p.svc>=faSvc(p)-1&&(p.lastFA==null||y+1-p.lastFA>=4)&&(!p.faC||p.yrs<=1)&&W(p)>=1).sort((a,b)=>W(b)-W(a)).slice(0,4);
  if(out.length)L.push('[내년 준비] FA 자격이 다가온 주축: '+out.map(p=>`${p.name}(${posLabel(p)}, WAR ${W(p).toFixed(1)})`).join(', ')+'. 다년계약이나 대체 자원을 미리 보세요.');
  if(!L.length)return; mail('전력분석팀',`${y} 시즌 회고: 우리 선수들`,`${y} 시즌을 우리 선수 중심으로 정리했습니다.\n\n${L.join('\n\n')}\n\n구단·재정 → 연대기에 해마다 기록이 쌓입니다.`,{kind:'업무',imp:true,acts:[{l:'연대기',a:'go',v:'club:chron'},{l:'선수단 계획',a:'go',v:'roster:plan'}]}); }
/* 창단 드래프트 3년 뒤: 지명 당시 능력 대비 지금, 우리 유니폼을 입고 쌓은 WAR */
function fdReview(){ const F=G.fd; if(!F||!F.picks||G.fdRev)return; G.fdRev=true; const y0=G.startY||G.year-3;
  const mine=F.picks.filter(x=>x.tid===G.user&&x.pid).slice(0,8).map(x=>{ const p=G.players[x.pid]; if(!p)return {x,gone:true}; const war=sum(p.hist.filter(h=>h.lvl==='1군'&&h.y>=y0&&h.t===G.user).map(h=>warOf(h,p))); return {x,p,war,now:Math.round(ovr(p))}; });
  const all=F.picks.filter(x=>x.pid&&G.players[x.pid]).map(x=>{ const p=G.players[x.pid]; return {x,p,war:sum(p.hist.filter(h=>h.lvl==='1군'&&h.y>=y0).map(h=>warOf(h,p)))}; }).sort((a,b)=>b.war-a.war);
  const steal=all.find(z=>z.x.rd>=5); const L=mine.map(z=>z.gone?`${z.x.rd}라운드 · 은퇴 또는 정리`:`${z.x.rd}라운드 ${z.p.name}: 지명 때 ${dv(z.x.o0??'-')} → 지금 ${dv(z.now)} · 우리 팀 WAR ${z.war.toFixed(1)}${z.p.team!==G.user?' (지금은 다른 구단)':''}`);
  mail('스카우트팀장','창단 드래프트 3년 회고',`창단 드래프트 뒤 3시즌이 지났습니다. 우리 상위 지명 선수들입니다.\n\n${L.join('\n')}\n\n리그 전체 최고 성과: ${all[0]?`${all[0].p.name}(${tshort(all[0].x.tid)} ${all[0].x.rd}라운드) WAR ${all[0].war.toFixed(1)}`:'-'}${steal?`\n최고의 스틸: ${steal.p.name}(${tshort(steal.x.tid)} ${steal.x.rd}라운드) WAR ${steal.war.toFixed(1)}`:''}`,{kind:'업무',imp:true}); }
function draftedBy(tid){ return G.draft?G.draft.picks.filter(x=>x.tid===tid&&x.pid>0).length:0; }
function rosterProj(tid){ return rosterN(tid)+draftedBy(tid); }
function aiDraftPick(tid){
  const t=team(tid); const av=G.draft.cls.filter(id=>G.players[id]&&G.players[id].prospect);
  let best=null,bs=-1e9;
  for(const id of av){ const p=G.players[id]; const sc=p.pot+hn('ai'+tid+G.year,id)*t.scoutSd+(ovr(p)-35)*(t.mode==='contend'?.5:.25); if(sc>bs){bs=sc;best=id;} }
  // 로스터가 찼으면 최하위 선수보다 나은 신인만 뽑는다
  const rd=G.draft.picks[G.draft.cur].rd;
  if(best&&rd>=3&&rosterProj(tid)>=ROSTER_MAX-2){ const worst=Math.min(...domestic(tid).map(keepScore)); const bp=G.players[best]; if(keepScore(bp)+hn('ak'+tid,best)*t.scoutSd*.5<worst+1)return -1; }
  return best;
}
function passCurrent(){ const d=G.draft; const pk=d.picks[d.cur]; pk.pid=-1; pk.pass=true; d.cur++; if(pk.tid===G.user)addLog(`${pk.rd}라운드 ${pk.no}순위 지명을 건너뛰었습니다.`); if(d.cur>=d.picks.length)finishDraft(); }
function doPick(pid){
  const d=G.draft; const pk=d.picks[d.cur]; const p=G.players[pid];
  p.prospect=false; p.team=pk.tid; p.joinY=G.year+1; p.sal=MIN_SAL; p.svc=0; p.draft={y:G.year,rd:pk.rd,no:pk.no,tid:pk.tid,bonus:bonusOf(pk.rd,pk.no,p)}; story(p,`${G.year} 신인 드래프트 ${pk.rd}라운드 ${pk.no}순위 · ${tname(pk.tid)} 지명 (${p.school||''})`,'draft');
  { G.sea.bonus=G.sea.bonus||{}; G.sea.bonus[pk.tid]=(G.sea.bonus[pk.tid]||0)+p.draft.bonus; } pk.pid=pid; d.cur++;
  if(pk.tid===G.user&&pk.rd<=2&&!G.unemp)chron('draft',`신인 ${pk.rd}라운드 ${pk.no}순위 ${p.name}(${posLabel(p)}) 지명`,p.id);
  if(pk.tid===G.user)addLog(`${pk.rd}라운드 ${pk.no}순위로 ${p.name}(${p.college?'대졸':'고졸'}·${posLabel(p)})을(를) 지명했습니다.`);
  if(pk.tid!==G.user&&(G.shortlist||[]).includes(pid)){ (d.lost=d.lost||[]).push({pid,tid:pk.tid,rd:pk.rd,no:pk.no,nm:p.name}); }
  G.shortlist=(G.shortlist||[]).filter(x=>x!==pid);
  if(d.cur>=d.picks.length)finishDraft();
}
function passPick(){ const d=G.draft; const pk=d.picks[d.cur]; if(!pk||pk.tid!==G.user||pk.rd<3)return; passCurrent(); }
function finishDraft(){ const d=G.draft; d.done=true; G.dlog=G.dlog||{}; G.dlog[d.y]=d.picks.filter(x=>x.pid>0).map(x=>{ const p=G.players[x.pid]; return {id:x.pid,nm:p?p.name:'',t:x.tid,rd:x.rd,no:x.no,pos:p?posLabel(p):'',pr:p?p.press||null:null}; }); for(const id of d.cls){ const p=G.players[id]; if(p&&p.prospect)delete G.players[id]; } G.draftClass=[];
  const mine=d.picks.filter(x=>x.tid===G.user&&x.pid>0).map(x=>G.players[x.pid]).filter(Boolean); G.shortlist=[];
  note('드래프트',`드래프트를 마쳤습니다. 우리 구단 지명: ${mine.map(p=>p.name).join(', ')}. 내년 1월에 합류합니다.`); }
function advanceDraft(stopAtUser){
  const d=G.draft;
  while(!d.done){ const pk=d.picks[d.cur]; if(pk.tid===G.user&&stopAtUser)return; const id=pk.tid===G.user?userAutoPick():aiDraftPick(pk.tid); if(!id){finishDraft();break;} if(id===-1){passCurrent();continue;} doPick(id); }
}
function userAutoPick(){ const av=G.draft.cls.filter(id=>G.players[id]&&G.players[id].prospect); let best=null,bs=-1; const pol=G.draftPol&&G.draftPol.y===G.year?G.draftPol.k:null;
  for(const id of av){ const rp=scoutReport(G.players[id]); const v=(rp.ofp??rp.cur+8)+rp.cur*.2+(pol&&draftFit(G.players[id],pol)?4:0); if(v>bs){bs=v;best=id;} } return best; }


/* 다음 우리 차례 전에 다른 구단이 데려갈 확률: 사이에 지명하는 구단들이 각자 상위 후보 중에서 고른다고 보고 여러 번 굴려 본다 */
const FD_POL={need:'빈자리 우선',now:'즉시 전력',young:'젊은 선수',cheap:'연봉 절약',board:'내 관심 명단 우선'};
function fdRisk(){ const F=G.fd; if(!F||F.done)return {}; const key=F.cur+':'+F.pool.length; if(F._rk&&F._rk.k===key)return F._rk.m;
  let i=F.cur; if(F.picks[i]&&F.picks[i].tid===G.user)i++; const seq=[]; while(i<F.picks.length&&F.picks[i].tid!==G.user){ seq.push(F.picks[i].tid); i++; }
  const m={}; if(!seq.length){ F._rk={k:key,m}; return m; }
  const pool=F.pool.map(id=>G.players[id]).filter(p=>p&&p.fdPool); const tops={};
  for(const tid of new Set(seq)){ const X=fdCtx(tid); tops[tid]=pool.map(p=>({id:p.id,v:fdScore(tid,p,false,X)})).sort((a,b)=>b.v-a.v).slice(0,10); }
  const N=160; const cnt={}; let seed=F.cur*7919+1; const rnd0=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  for(let it=0;it<N;it++){ const gone=new Set(); for(const tid of seq){ const L=tops[tid].filter(x=>!gone.has(x.id)); if(!L.length)continue; const vm=L[0].v, T=Math.max(.4,Math.abs(vm)*.1); let tot=0; const w=L.map(x=>{ const e=Math.exp((x.v-vm)/T); tot+=e; return e; }); let r=rnd0()*tot, pick=L[0].id; for(let j=0;j<L.length;j++){ r-=w[j]; if(r<=0){ pick=L[j].id; break; } } gone.add(pick); cnt[pick]=(cnt[pick]||0)+1; } }
  for(const id in cnt)m[id]=cnt[id]/N; F._rk={k:key,m,n:seq.length}; return m; }
