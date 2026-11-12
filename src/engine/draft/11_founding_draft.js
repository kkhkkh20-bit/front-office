/* ===== 창단 드래프트 =====
   리그의 국내 선수 전원을 한데 모아 10개 구단이 지그재그 순서로 25라운드를 지명한다. 26번째부터는 자동 배분.
   계약(연봉·남은 기간)은 선수를 따라간다. 외국인 선수는 따로 영입한다 */
const FD_ROUNDS=25;
/* 창단 드래프트는 10라운드 직접 지명. 끝나면 단장이 고른다: 나머지를 스카우트에게 맡기거나(빈 포지션 우선 자동 지명), 5라운드 더 뽑는다 */
const FD_MAN=10, FD_MORE=5;
function fdManDone(){ const F=G.fd; if(!F||F.done||F.open===false)return false; const nx=F.picks.slice(F.cur).find(x=>x.tid===G.user); return !!nx&&nx.rd>(F.man||FD_ROUNDS); }
const FD_TGT={P:13,C:3, /* 포수 2명만 뽑아 한 명이 다치면 2군 포수가 없던 문제(리뷰 11-08) */'1B':1,'2B':2,'3B':1,SS:2,LF:1,CF:2,RF:1};
/* 창단 지명 순서: 쓸 수 있는 연봉이 적은 구단이 먼저 뽑는다. 돈과 지명 순번이 맞바뀌는 균형 장치 */
function fdCapOf(tid){ try{ return fdFin(tid).avail; }catch(e){ return capOf(G.year); } }
/* 창단 지명 순번은 단장이 먼저 고른다(구단 고르기 전). 앞 순번은 긴축, 뒤 순번은 지원 보너스. 3시즌 동안. 대가는 '전체 1번 스타 한 명' 값(3시즌 약 60억)에 맞춤(라운드마다 1→10, 10→1이라 나머지 지명 차이는 작다). 나머지 9개 구단은 돈이 적은 순서(fdOrder)로 남은 자리를 채운다
   d: 모기업 지원 한도 증감, cash: 시작 현금, strict: 구단주 수익 우선·승인 확률 낮음 */
const FD_SLOT={1:{d:-.1,cash:3000,strict:1},2:{d:-.07,cash:3200,strict:1},3:{d:-.05,cash:3500,strict:1},4:{d:-.02,cash:3800},5:{d:0,cash:4000},6:{d:0,cash:4000},7:{d:.01,cash:4100},8:{d:.02,cash:4200},9:{d:.03,cash:4300},10:{d:.04,cash:4400}}, FD_AUST_Y=3;
/* 같은 순서 방식(커뮤니티 건의 11-11): 라운드마다 1번부터 같은 순서. 앞 순번 이득이 라운드마다 쌓이므로 순번 조건(긴축·보너스)을 두 배로 */
const FD_STR_M=2;
function fdSlotA(k,str){ const A=FD_SLOT[k]; if(!A)return null; if(!(str??(typeof G!=='undefined'&&G&&G.fdStraight)))return A; return {...A,d:Math.round(A.d*FD_STR_M*1000)/1000,cash:4000+(A.cash-4000)*FD_STR_M}; }
function fdAustApply(tid,k){ const A=fdSlotA(k), O=G.fdOrd, t=team(tid); if(!A||!O)return; const i=O.indexOf(tid); if(i<0)return; O.splice(i,1); O.splice(k-1,0,tid); t.cash=A.cash; if(A.strict)t.owner='profit'; if(A.d||A.strict)t.aust={k,d:A.d,strict:!!A.strict,y0:G.year,y1:G.year+FD_AUST_Y-1}; }
function austOn(t){ return t&&t.aust&&sponSeason()<=t.aust.y1?t.aust:null; }
function austTxt(a){ return a.d<0?`긴축 ${Math.round(-a.d*100)}% 감액`:a.d>0?`지원 ${Math.round(a.d*100)}% 증액`:'긴축'; }
function fdOrder(){ return G.teams.map(t=>({id:t.id,v:fdCapOf(t.id)+hn('fdo'+G.year,t.id)*30})).sort((a,b)=>a.v-b.v).map(x=>x.id); }
function fdStart(){ const ids=[]; for(const t of G.teams)t.cap=null; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.prospect||(p.joinY>G.year))continue; p.fdFrom=p.team; p.team=null; p.fdPool=true; delete p.role; ids.push(p.id); if(p.fsx==null)p.fsx=Math.round(clamp(N(0,4.5),-9,9)*10)/10; } /* fsx: 실전 감각(숨은 값). 기록에는 묻어나지만 툴을 보는 눈에는 안 보인다 */
  G.lineup={}; const order=G.fdOrd&&G.fdOrd.length===G.teams.length?G.fdOrd:fdOrder(); delete G.fdOrd; const picks=[]; /* 구단 고르기 화면에서 정해 둔 순서가 있으면 그대로 */
  for(let r=0;r<FD_ROUNDS;r++){ const seq=r%2&&!G.fdStraight?[...order].reverse():order; seq.forEach((tid,i)=>picks.push({rd:r+1,no:i+1,tid,pid:null})); }
  G.startY=G.year; G.fd={pool:ids,all:ids.slice(),order,picks,cur:0,done:false,y:G.year,open:false,man:FD_MAN};
  { for(let i=0;i<4;i++)scoutFindWeek(true); } /* 창단 때 찾은 후보도 소식 없이 외국인 시장에 '우리 스카우트 발굴'로 표시 */
  /* 다른 구단도 외국인을 새로 뽑는다: 약한 외국인(국내 주전급 아래)은 정리하고, 나머지도 일부 바꾼다. 같은 시장에서 경쟁 */ for(const t of G.teams){ if(t.id===G.user)continue; for(const p of foreignOf(t.id)){ if(ovr(p)<(p.foreign==='아시아'?50:56)||R()<.3){ delete G.players[p.id]; } } } try{ refreshFMarket(0); }catch(e){} fdEstAll();
  mail(ASSOC.s,'창단 드래프트: 모든 선수를 새로 나눕니다',`리그 국내 선수 ${ids.length}명을 한데 모아 10개 구단이 ${FD_ROUNDS}라운드를 지명합니다. 순서는 예산 여유(국내 선수 연봉에 쓸 수 있는 돈)이 적은 구단부터이고, ${G.fdStraight?'모든 라운드가 같은 순서입니다(같은 순서 방식).':'라운드마다 뒤집힙니다(지그재그).'} 우리 구단 첫 지명은 ${order.indexOf(G.user)+1}번째입니다.\n\n선수의 연봉과 계약 기간은 그대로 따라옵니다. 상위 40명 연봉 합계가 샐러리캡(${money(capOf(G.year))})을 넘지 않게 고르세요. ${FD_ROUNDS}라운드가 끝나면 남은 선수는 구단마다 자동으로 나눠 받습니다. 외국인 선수는 드래프트 뒤에 따로 영입합니다.`,{imp:true,kind:'드래프트'}); }
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
  /* 트래킹은 능력치에서 나오고 개인차(측정·스타일)가 조금 붙는다. 실제 트래킹처럼 한 시즌 기록보다 실력을 잘 보여 주게 개인차를 줄였다(예전엔 홈런·삼진과 상관 0.6대로 한 시즌 기록보다 못했다).
     헛스윙%는 구위와 결정구, CSW%(루킹+헛스윙)는 구위 중심에 제구가 더해진다. 땅볼%는 땅볼 성향(gbT)과 같은 값 */
  if(p.isP){ const v=veloOf(p); let ak=0; try{ ak=arsenalK(p); }catch(e){ ak=0; } return {velo:v,vmax:veloMax(p),rpm:Math.round((2080+(r.stf-20)/60*420+n('rpm',45))/10)*10,ext:Math.round((1.78+n('ext',.09)+(r.stf-50)*.001)*100)/100,whiff:Math.round(17+(r.stf-20)/60*15+ak*120+n('wh',1.6)),gb:Math.round(clamp(44+hn('gb',p.id)*7,30,62)),csw:Math.round(25+(r.stf-20)/60*7+(r.ctl-20)/60*3.5+ak*60+n('csw',1))}; }
  const ev=evOf(p); return {ev,evmax:Math.round(156+(r.pow-20)/60*24+n('evm',2)),hh:Math.round(22+(r.pow-20)/60*24+(r.con-50)*.08+n('hh',2)),whiff:Math.round(31-(r.con-20)/60*18+n('bw',1.6)),chase:Math.round(36-(r.eye-20)/60*16+n('ch',1.6)),run:+runOf(p),arm:Math.round(124+(r.def-20)/60*22+(['SS','3B','RF','C'].includes(p.pos)?3:0)+n('arm',3))}; }
/* 최고 구속: 평균보다 4~7km 빠르다 */
function veloMax(p){ return Math.min(161,Math.round(veloOf(p)+4+hn('vmax',p.id)*1.2)); } /* 최고 구속: 평균보다 4km 안팎 빠르고 161 넘지 않음(국내 최고 기록 160km대 초반) */
function evOf(p){ if(!p||p.isP)return null; return Math.round(126+(p.r.pow-20)/60*17+(p.r.con-50)*.04+hn('ev',p.id)*1.6); }
/* 최근 3년 1군 합계(게임 시작 전 2023·2024 포함) */
function fdThree(p,y){ let t=null, ys=0; for(let yy=y-2;yy<=y;yy++){ const h=seasonTotal(p,yy,'1군'); if(!h||!(p.isP?h.outs:h.pa))continue; ys++; if(!t)t=Object.assign({},h); else addTo(t,h); } if(t)t.ys=ys; return t; }
/* 지난 시즌 1군 규정타석(경기 수×3.1, 144경기 446)·규정이닝(경기 수×1) 충족: 리그 기록 isQual과 같은 기준. 창단 전 시즌은 144경기 */
function fdQual(p,y){ const h=seasonTotal(p,y,'1군'); return !!h&&(p.isP?(h.outs||0)>=144*3:(h.pa||0)>=Math.round(144*3.1)); }
function fdStatLine(p,y){ const h1=seasonTotal(p,y,'1군'), h2=seasonTotal(p,y,'퓨처스');
  if(p.isP){ const h=h1&&h1.outs>=30?h1:h2&&h2.outs>=30?h2:h1||h2; if(!h||!h.outs)return null; const ip=h.outs/3; const T3=fdThree(p,y); return {lvl:h===h1?1:2,h,n:ip,t:trackOf(p),velo:veloOf(p),vmax:veloMax(p),war:warOf(h,p),fip:(13*(h.hr||0)+3*((h.bb||0)+(h.hbp||0))-2*h.so)/ip+3.2,fip3:T3&&T3.outs>=60?(13*(T3.hr||0)+3*((T3.bb||0)+(T3.hbp||0))-2*T3.so)/(T3.outs/3)+3.2:null,n3:T3?T3.outs/3:0,ys:T3?T3.ys:0,whip:(h.h+h.bb)/ip,k9:h.so*9/ip,kbb:h.so/Math.max(1,h.bb),era:h.er*9/ip,g:h.g||0,gs:h.gs||0,ipg:h.g?ip/h.g:0}; }
  const h=h1&&h1.pa>=30?h1:h2&&h2.pa>=30?h2:h1||h2; if(!h||!h.pa)return null; const r=bRate(h); const T3=fdThree(p,y); return {lvl:h===h1?1:2,h,n:h.pa,t:trackOf(p),ev:evOf(p),war:warPub(h,p),babip:(h.h-h.hr)/Math.max(1,h.ab-h.so-h.hr),ops3:T3&&T3.pa>=150?bRate(T3).ops:null,n3:T3?T3.pa:0,ys:T3?T3.ys:0,avg:r.avg,obp:r.obp,slg:r.slg,ops:r.ops,wrc:wrcPlus(h,y),iso:r.slg-r.avg,bbk:h.bb/Math.max(1,h.so),hr:h.hr,sb:h.sb||0}; }
/* 최근 3년(1군) 합산 줄: 성적 탭의 '최근 3년' 보기. 1군 기록이 거의 없으면 지난 시즌 줄(퓨처스 포함)로 */
function fdStatLine3(p,y){ const T=fdThree(p,y); if(!T||(p.isP?T.outs<30:T.pa<30))return fdStatLine(p,y); const yrs=[y-2,y-1,y].map(yy=>seasonTotal(p,yy,'1군')).filter(h=>h&&(p.isP?h.outs:h.pa));
  const war=yrs.reduce((a,h)=>a+warPub(h,p),0);
  if(p.isP){ const h=T, ip=h.outs/3; return {lvl:1,y3:T.ys,h,n:ip,t:trackOf(p),velo:veloOf(p),vmax:veloMax(p),war,fip:(13*(h.hr||0)+3*((h.bb||0)+(h.hbp||0))-2*h.so)/ip+3.2,fip3:null,n3:ip,ys:T.ys,whip:(h.h+h.bb)/ip,k9:h.so*9/ip,kbb:h.so/Math.max(1,h.bb),era:h.er*9/ip,g:h.g||0,gs:h.gs||0,ipg:h.g?ip/h.g:0}; }
  const h=T, r=bRate(h); return {lvl:1,y3:T.ys,h,n:h.pa,t:trackOf(p),ev:evOf(p),war,babip:(h.h-h.hr)/Math.max(1,h.ab-h.so-h.hr),ops3:null,n3:h.pa,ys:T.ys,avg:r.avg,obp:r.obp,slg:r.slg,ops:r.ops,wrc:wrcMulti(yrs),iso:r.slg-r.avg,bbk:h.bb/Math.max(1,h.so),hr:h.hr,sb:h.sb||0}; }
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
function fdEstAll(){ const F=G.fd; if(!F)return {}; const y=F.y-1; const P=(F.all||F.pool).map(id=>G.players[id]).filter(Boolean); const grp={};
  for(const p of P){ const L=fdStatLine(p,y); const k=(p.isP?'P':'B')+(L?L.lvl:0); (grp[k]=grp[k]||[]).push({p,L}); }
  const est={}, ana={};
  for(const k in grp){ const A=grp[k]; const isP=k[0]==='P';
    const W=A.filter(x=>x.L); if(W.length<8){ A.forEach(x=>{ est[x.p.id]=ovr(x.p); ana[x.p.id]=ovr(x.p); }); continue; }
    /* 스카우트: 겉 기록. 표본이 작아도 거의 깎지 않는다(운 좋은 한 해에 혹한다) */
    if(isP){ const za=fdZ(W,x=>-x.L.era), zw=fdZ(W,x=>(x.L.h.w||0)/Math.max(1,x.L.n)*100), zk=fdZ(W,x=>x.L.k9); W.forEach(x=>{ x.s=.55*za(x)+.15*zw(x)+.3*zk(x); x.s*=x.L.n/(x.L.n+12); }); }
    else { const za=fdZ(W,x=>x.L.avg), zh=fdZ(W,x=>x.L.hr/Math.max(1,x.L.n)*600), zr=fdZ(W,x=>(x.L.h.rbi||0)/Math.max(1,x.L.n)*600), zs=fdZ(W,x=>x.L.sb/Math.max(1,x.L.n)*600); W.forEach(x=>{ x.s=.42*za(x)+.28*zh(x)+.15*zr(x)+.15*zs(x); x.s*=x.L.n/(x.L.n+40); }); }
    /* 전력분석팀: 최근 2년 세부 지표, 표본만큼 믿는다 */
    W.forEach(x=>{ const t=fdTwo(x.p,y); x.t=t&&(isP?t.outs>=30:t.pa>=60)?t:x.L.h; });
    if(isP){ const ip=x=>Math.max(1,x.t.outs/3); const zf=fdZ(W,x=>-((13*(x.t.hr||0)+3*((x.t.bb||0)+(x.t.hbp||0))-2*x.t.so)/ip(x))), zkb=fdZ(W,x=>(x.t.so-x.t.bb)*9/ip(x)), zwh=fdZ(W,x=>trackOf(x.p).whiff); W.forEach(x=>{ x.a=(.45*zf(x)+.35*zkb(x)+.2*zwh(x))*ip(x)/(ip(x)+40); }); }
    else { const r=x=>bRate(x.t); const zo=fdZ(W,x=>r(x).obp), zi=fdZ(W,x=>r(x).slg-r(x).avg), zb=fdZ(W,x=>x.t.bb/Math.max(1,x.t.so)), ze=fdZ(W,x=>evOf(x.p)); W.forEach(x=>{ x.a=(.32*zo(x)+.3*zi(x)+.13*zb(x)+.25*ze(x))*x.t.pa/(x.t.pa+180); }); }
    A.forEach(x=>{ if(!x.L){ x.s=-1.5; x.a=-1.5; } });
    fdMap(A,'s',est); fdMap(A,'a',ana); }
  F.est=est; F.ana=ana; return est; }
/* 툴 관찰의 치우침: 스카우트는 힘·발·구위를 좋아하고 선구안·제구는 덜 쳐준다 */
function fdToolBias(p){ const r=p.r; return p.isP?(r.stf-50)*.14-(r.ctl-50)*.12+(veloOf(p)-148)*.12:(r.pow-50)*.12+(r.spd-50)*.08-(r.eye-50)*.12; }
function fdSeenBy(tid,p){ const F=G.fd; if(!F.est||!F.ana)fdEstAll(); const o=ovr(p); const S=F.est[p.id]!=null?F.est[p.id]:o, An=F.ana[p.id]!=null?F.ana[p.id]:o;
  let sd; if(tid===G.user){ const sk=(G.scouts||[]).reduce((a,s)=>Math.max(a,s.skill||0),0); sd=SCOUT_SD[clamp(sk,1,5)]; } else sd=team(tid).scoutSd||6;
  const tob=o-(p.fsx||0)*.85+fdToolBias(p)+hn('fdo'+tid,p.id)*sd; const sc=S*.55+tob*.45;
  /* 우리 추천은 스카우트 관점 그대로. 다른 구단은 스카우트와 분석팀을 반씩 섞어 본다 */
  const seen=tid===G.user?sc:sc*.5+An*.5;
  const up=Math.max(0,26-p.age)*1.3+Math.max(0,p.pot-o)*.25+hn('fdp'+tid,p.id)*sd*.4;
  return {o:seen,pot:seen+Math.max(0,up),sc,an:An}; }
/* 장래성: 스카우트가 본 최대 예상 능력(전성기 능력). 지금 능력에서 출발해 보통 성장 곡선(DT.norm: 26세까지 큰다)으로 남은 성장 몫(잠재력 - 현재,
   어릴수록·스카우트가 약할수록 오차 큼)을 해마다 채워 가장 높은 지점을 본다. 다 큰 선수(27세 이상)는 지금 능력이 곧 최대치다.
   출발점은 지명 전에는 우리 스카우트 추정, 우리 선수는 코치진이 보는 실제 현재 능력(지명 직후 공개)이다. 잠재력 쪽은 여전히 추정.
   (사용자 2026-11-01 20:02: 장래성은 3년 뒤가 아니라 최대치. 30대의 하락은 장래성이 아니라 나이·계약 판단에서 본다) */
function fdPotBase(p){ return p.team===G.user?ovr(p):fdSeenBy(G.user,p).sc; }
function fdPotEst(p){ if(!G.fd||!p)return null; const sk=(G.scouts||[]).reduce((a,s)=>Math.max(a,s.skill||0),0);
  const yrs=Math.max(0,27-p.age); const sd=(1+yrs*.6)*(1.25-clamp(sk,1,5)*.08); let gap=Math.max(0,(p.pot-ovr(p))+hn('fdpe'+G.user,p.id)*sd);
  const T=DT.norm; let v=fdPotBase(p); for(let a=p.age;a<=T.grow;a++){ const add=gap*clamp(1/(T.grow-a+1.5),.04,.65)*1.3; v+=add; gap-=add; if(gap<=.05)break; }
  return v; }
/* 전성기 예상 나이: 남은 성장이 끝나는 해(다 큰 선수는 지금) */
function fdPeakAge(p){ return Math.max(p.age,DT.norm.grow+1); }
/* 화면용: 스카우트 등급과 분석팀 등급(분석원이 있을 때만) */
function fdViews(p){ if(!G.fd)return null; const S=fdSeenBy(G.user,p); const lv=dataLv(G.user); return {sc:S.sc,an:lv>=1?S.an:null,up:p.age<=26&&S.pot-S.o>=6}; }
function fdSlot(p){ return p.isP?'P':p.pos; }
/* AI 구단 지명 방향(stanceOf): 우승 도전은 지금 능력과 비싼 주전을 감수(상한 100%까지), 내년 도전은 25~30세, 리빌딩은 유망주를 보고 연봉을 아낀다 */
const FD_ST={win:{pw:.25,old:.8,cap:1,sal:.012},next:{pw:.35,old:1.2,cap:1,sal:.02,mid:1},rebuild:{pw:.5,old:1.3,cap:.97,sal:.03,young:.6}}; /* 사용자는 상한 가까이 쓰므로 AI도 연봉을 아끼느라 전력을 버리지 않게 연봉 감점을 줄였다 */
function fdScore(tid,p,auto,X){ X=X||fdCtx(tid); const t=team(tid); const S=fdSeenBy(tid,p); const o=S.o, pot=S.pot; const pol=tid===G.user&&auto?(G.fdPol||'need'):null; /* 맡기기 방침 */ const st=tid===G.user?null:FD_ST[stanceOf(t)]; const pw=pol==='now'?0:pol==='young'?.9:st?st.pw:.35;
  let eff=p.age<=25?o+Math.max(0,pot-o)*pw:p.age>=32?o-(p.age-31)*(st?st.old:1.3):o; if(pol==='young')eff+=p.age<=24?2:p.age>=31?-3:0; if(st&&st.young)eff+=p.age<=24?st.young:p.age>=31?-3:0; if(st&&st.mid&&p.age>=25&&p.age<=30)eff+=st.mid; let v=Math.pow(Math.max(0,eff-34),1.7)/10;
  const k=fdSlot(p); const c=X.c; const tg=FD_TGT[k]||1; v*=pol==='now'?((c[k]||0)<tg+2?1:.8):pol==='need'||st?((c[k]||0)<tg?1.35:(c[k]||0)<tg+2?.8:.45):(c[k]||0)<tg?1.15:(c[k]||0)<tg+2?.85:.55; /* AI 구단도 빈 포지션부터 채운다(전에는 덜 따져 고수와 전력 차가 컸다: check-balance) */
  const cap=X.cap, cp=X.cp; if(cp+p.sal>cap*(st?st.cap:.97))v*=.25; else v-=p.sal/100*(pol==='cheap'?.25:st?st.sal:.025)*(t.owner==='profit'?1.3:1);
  if(isAway(p))v*=.5; if(!auto&&tid!==G.user)v+=hn('fd'+tid,p.id)*v*.04; /* 구단마다 취향 차이(작게: 크면 AI가 손해) */ if(tid===G.user&&(G.shortlist||[]).includes(p.id))v=pol==='board'?v*1.8+6:v*1.2+2; return v; }
function fdBest(tid,auto){ let best=null,bs=-1e9; const X=fdCtx(tid); for(const id of G.fd.pool){ const p=G.players[id]; if(!p||!p.fdPool)continue; const v=fdScore(tid,p,auto,X); if(v>bs){bs=v;best=id;} } return best; }
function fdUserRec(n){ const X=fdCtx(G.user); const L=G.fd.pool.map(id=>G.players[id]).filter(p=>p&&p.fdPool).map(p=>({p,v:fdScore(G.user,p,true,X)})).sort((a,b)=>b.v-a.v); return L.slice(0,n||5).map(x=>x.p); }
function fdPick(pid){ const F=G.fd; if(!F||F.done)return '드래프트가 없습니다.'; const pk=F.picks[F.cur]; const p=G.players[pid]; if(!pk||!p||!p.fdPool)return '지명할 수 없는 선수입니다.';
  if(pk.tid===G.user&&!pk.auto&&fdManDone())return `${F.man}라운드 직접 지명을 마쳤습니다. 상황판에서 맡기기나 더 뽑기를 고르세요.`; /* 연장 버튼 없이 다음 라운드를 직접 뽑던 문제(검수 11-09zd) */
  /* 지명 순간 우리 스카우트 추정을 남겨 둔다: 지명 직후 화면과 나중의 지명 평가가 이 값을 쓴다(실제 능력은 바로 공개하지 않는다) */ try{ fdEsd(); pk.e0=Math.round(fdSeenBy(G.user,p).sc*10)/10; if(pk.tid===G.user)pk.role=fdRole(p,pk.e0); }catch(e){}
  p.team=pk.tid; p.fdPool=false; delete p.role; p.rAdj=0; pk.pid=pid; pk.o0=Math.round(ovr(p)); pk.age0=p.age; acqStamp(p,'fd',pk.tid,Object.assign({rd:pk.rd,no:pk.no},pk.tid===G.user?{how:pk.auto?'auto':'gm',e0:pk.e0}:{})); F.pool=F.pool.filter(x=>x!==pid); F.cur++; story(p,`${G.year} 창단 드래프트 ${pk.rd}라운드 ${pk.no}번째 · ${tname(pk.tid)} 지명`,'move');
  chron('draft',`창단 ${pk.rd}라운드 ${pk.no}순위 ${p.name}(${posLabel(p)}, ${p.age}세) 지명 · 연봉 ${money(p.sal)}`,p.id,pk.tid,{source:'fd:'+G.year+':'+pk.tid+':'+pk.rd+':'+pk.no});
  if(pk.tid!==G.user&&(G.shortlist||[]).includes(pid))(F.lost=F.lost||[]).push({pid,tid:pk.tid,rd:pk.rd,nm:p.name});
  if(F.cur>=F.picks.length)fdFinish(); return ''; }
/* 창단 드래프트 뒤 AI 구단 연봉 맞추기: 드래프트는 연봉을 따라가므로 어떤 구단은 상한의 50%대에 머문다.
   AI 구단은 새 선수단 주축과 재계약해 운영 방향만큼(리빌딩 82~87%, 내년 도전 89~94%, 우승 도전 95~99%: 실제 KBO 상위권처럼 상한 가까이) 올린다. 우승 도전 구단은 지명·트레이드(fdStrengthen)로 먼저 실제 전력을 채우고, 남은 몫만 연봉으로 맞춘다. 상한은 넘지 않는다 */
function fdAiPayFill(){ const cap=capOf(G.year);
  for(const t of G.teams){ if(t.id===ME())continue; const s=stanceOf(t); const tgt=cap*(t.indie?rnd(.4,.55):s==='win'?rnd(.9,.97):s==='next'?rnd(.76,.88):rnd(.5,.7)); /* 실제 2025 상위 40명 합계는 상한의 32~96%(평균 약 74%): 우승 도전 89~96%, 중위권 77~92%, 재건 65% 이하 */ let gap=tgt-capPay(t.id); if(gap<=0)continue;
    for(let pass=0;pass<4&&gap>5;pass++){ const ps=domestic(t.id).filter(p=>!isRookie(p)&&!p.ys&&ovr(p)>=45).sort((a,b)=>ovr(b)-ovr(a)).slice(0,20); const tot=sum(ps.map(p=>Math.max(1,ovr(p)-40)));
      for(const p of ps){ const lim=p.faC?Math.min(2600,Math.max(p.sal,marketSal(ovr(p))*1.5)):Math.max(p.sal,pass<3?preCap(p):Math.min(2600,marketSal(ovr(p))*1.1)); /* 마지막 회차: 젊은 선수뿐인 구단(리빌딩)도 시장가 다년계약으로 하한 아래에 머물지 않게 */ const add=Math.min(lim-p.sal,round5(gap*Math.max(1,ovr(p)-40)/tot)); if(add<=0)continue; p.sal=round5(p.sal+add); gap-=add; if(gap<=5)break; } } } }
/* 한 번에 한 명씩: 실시간 드래프트 진행용 */
function fdStep(){ const F=G.fd; if(!F||F.done||F.open===false)return null; const pk=F.picks[F.cur]; if(!pk)return null; if(fdManDone())return null; if(pk.tid===G.user)return 'user'; const id=fdBest(pk.tid,false); if(id==null){ fdFinish(); return null; } fdPick(id); return {pk,pid:id}; }
function amStep(){ const d=G.draft; if(!d||d.done)return null; const pk=d.picks[d.cur]; if(!pk)return null; if(pk.tid===G.user&&!G.unemp)return 'user'; /* 야인 기간에는 전 구단도 AI 판단(검수 11-09d) */ const id=aiDraftPick(pk.tid); if(!id){ finishDraft(); return null; } if(id===-1){ passCurrent(); return {pk,pass:true}; } doPick(id); return {pk,pid:id}; }
/* gm: 단장이 화면에서 맡긴 지명. 우리 지명은 연봉 한도 안에서 고른다(fdAutoBest) */
function fdAdvance(stopAtUser,gm){ const F=G.fd; let g=0; while(F&&!F.done&&g++<400){ const pk=F.picks[F.cur]; if(pk.tid===G.user&&stopAtUser)return; const id=pk.tid===G.user&&gm?fdAutoBest():fdBest(pk.tid,pk.tid===G.user); if(id==null){ fdFinish(); break; } if(pk.tid===G.user)pk.auto=true; fdPick(id); } }
/* 맡긴 우리 지명: 직접 지명 때 연봉 확인창이 뜨는 선수(남은 한도 - 자동 배분 몫 초과)는 건너뛴다. 모두 넘으면 가장 싼 후보 중에서(검수 11-09zd) */
function fdAutoBest(){ const F=G.fd; const L=F.pool.map(id=>G.players[id]).filter(p=>p&&p.fdPool); if(!L.length)return null; const M=fdMoney(); const X=fdCtx(G.user);
  let C=M?L.filter(p=>p.sal<=M.room-M.W):L; if(!C.length){ const ms=Math.min(...L.map(p=>p.sal)); C=L.filter(p=>p.sal<=ms); }
  let best=null,bs=-1e9; for(const p of C){ const v=fdScore(G.user,p,true,X); if(v>bs){bs=v;best=p.id;} } return best; }
/* 'n번 맡기기': 우리 지명 n번을 맡기되 직접 지명 라운드(F.man)를 넘지 않는다(검수 11-09zd). 시작 순번을 돌려준다(화면 지명 소식용) */
function fdAutoRun(n){ const F=G.fd; if(!F||F.done||F.open===false)return null; const c0=F.cur; let g=0; while(!F.done&&g++<500){ const pk=F.picks[F.cur]; if(!pk)break; if(pk.tid!==G.user){ fdAdvance(true); continue; } if(n<=0||fdManDone())break; const id=fdAutoBest(); if(id==null){ fdFinish(); break; } pk.auto=true; fdPick(id); n--; } return c0; }
/* 창단 드래프트 연봉 계산: 지금까지 쓴 돈, 쓸 수 있는 한도, 남은 지명과 자동 배분까지 감안한 1명당 여유 */
let _fdfC=null;
function fdMoney(){ const F=G.fd; if(!F)return null; const key=G.day+':'+G.user; if(!_fdfC||_fdfC.k!==key||_fdfC.g!==G){ try{ _fdfC={k:key,g:G,f:fdFin()}; }catch(e){ return null; } } const f=_fdfC.f;
  const mine=Object.values(G.players).filter(p=>p.team===G.user&&!p.foreign); const spent=sum(mine.map(p=>p.sal));
  const lim=Math.min(f.cap,Math.max(0,f.avail)); const left=F.picks.slice(F.cur).filter(x=>x.tid===G.user).length;
  const pool=F.pool.map(id=>G.players[id]).filter(p=>p&&p.fdPool).map(p=>p.sal).sort((a,b)=>a-b); const cheap=pool.slice(0,Math.max(1,Math.round(pool.length*.4))); const avgC=cheap.length?sum(cheap)/cheap.length:MIN_SAL;
  const autoN=Math.max(0,52-mine.length-left); const W=Math.round(autoN*avgC); const room=lim-spent; const per=left?Math.max(0,(room-W)/left):0;
  const fr=(f.otherRows||[]).find(x=>/외국인/.test(x[0])); return {spent,lim,room,left,autoN,W,per,capBound:f.avail>=f.cap,fres:fr?fr[1]:0,res:f.res}; }
function fdFinish(){ const F=G.fd; if(!F||F.done)return; /* 남은 선수 자동 배분: 구단 국내 선수 52명까지 지그재그 */
  let r=0, guard=0; while(F.pool.length&&guard++<80){ const seq=r%2?[...F.order].reverse():F.order; let any=false; for(const tid of seq){ if(domestic(tid).length>=52)continue; const id=fdBest(tid,true); if(id==null)break; const p=G.players[id]; p.team=tid; p.fdPool=false; acqStamp(p,'fd',tid,{auto:true}); chron('draft',`창단 추가 지명 ${p.name}(${posLabel(p)}, ${p.age}세) · 연봉 ${money(p.sal)}`,p.id,tid,{source:'fd:'+G.year+':extra:'+p.id}); F.pool=F.pool.filter(x=>x!==id); any=true; } if(!any)break; r++; }
  for(const id of F.pool){ const p=G.players[id]; if(p)retireOut(p,'창단 드래프트에서 지명받지 못해 은퇴'); } /* 일반 은퇴 절차: 기존 1군 기록을 보관(G.arch)에 남긴다(검수 11-09zd) */
  F.pool=[]; F.done=true; for(const p of Object.values(G.players)){ delete p.fdPool; delete p.fdFrom; } try{ tbTakeSnap(); }catch(e){}
  for(const t of G.teams){ if(rosterN(t.id)>ROSTER_MAX)trimRoster(t.id,ROSTER_MAX); } try{ aiCapAll(); }catch(e){} try{ fdStrengthen(); }catch(e){} try{ fdAiPayFill(); }catch(e){} try{ foundDefaults(); }catch(err){}
  /* 외국인은 먼저 계약하지 않는다: 1월 시장에서 값을 불러 경쟁한다(foRivals·aiForeignDaily) */
  planSup(); G.tsug=null; try{ G.tgrow=[]; ovrSnap(); growSnap(); }catch(e){}
  const mine=F.picks.filter(x=>x.tid===G.user&&x.pid).map(x=>G.players[x.pid]).filter(Boolean); const ci=capInfo(G.user);
  try{ G.proj=G.teams.map(x=>({id:x.id,r:projRating(x.id)+hn('proj'+G.year,x.id)*.7})).sort((p,q)=>q.r-p.r).map(x=>x.id); const pr=G.proj.indexOf(G.user)+1;
    setGoals(`창단 드래프트로 선수단이 꾸려졌습니다. 전력분석팀은 외국인 선수 영입 전 기준으로 우리를 10개 구단 중 ${pr}위 전력으로 봅니다. 창단 첫해이니 구단주도 무리한 목표는 잡지 않았습니다.`,true); G.goals.fd=true;
    news('분석',`창단 드래프트 평가: ${tshort(G.user)} ${pr}위 전력`,`창단 드래프트를 마친 ${tname(G.user)}의 전력은 ${pr}위로 꼽힙니다. 외국인 선수 영입이 남았습니다.`,0); }catch(err){}
  try{ const L=F.picks.filter(x=>x.tid===G.user&&x.pid&&G.players[x.pid]); const P=L.map(x=>G.players[x.pid]); const nP=domestic(G.user).filter(p=>p.isP).length, nB=domestic(G.user).length-nP;
    mail('스카우트팀장','창단 드래프트 결과: 우리 지명 선수',`창단 드래프트가 끝났습니다. 지명 ${L.length}명, 자동 배분을 합친 국내 선수는 투수 ${nP}명 · 야수 ${nB}명입니다.\n\n${L.map(x=>{ const p=G.players[x.pid]; const r=fdRange(p); return `${x.rd}라운드  ${p.name} (${posLabel(p)}, ${p.age}세) 현재 능력 ${fdRangeTxt(r)} · 지명 때 추정 ${dv(fdE0(p,x))} · ${x.role||fdRole(p,fdE0(p,x))}`; }).join('\n')}\n\n능력은 100점 기준으로 63이 1군 평균, 69가 주전급입니다. 현재 능력은 우리 선수라 정확하고, 잠재력은 추정입니다. 7월 1일 중간 평가와 정규시즌 뒤 첫해 평가에서 이 지명을 돌아봅니다.${(()=>{ const n=draftNo(G.user); return n&&G.cal&&G.cal.draft?`\n\n다음은 신인 드래프트입니다. ${dmd(G.cal.draft)}에 열리고, 지난 시즌(${n.y}) 성적 역순이라 우리는 1라운드 ${n.r1}순위입니다. 3월부터 스카우트가 고교·대학 선수를 관찰합니다.`:''; })()}`,{kind:'업무',acts:[{l:'선수단 보기',a:'go',v:'roster:field'}]}); }catch(err){}
  try{ if(G.tut&&!G.tut.done){ G.tut.step=0; sendTut(); } }catch(err){}
  chron('found',`창단 드래프트로 선수단 구성 · 1라운드 ${(()=>{ const x=F.picks.find(q=>q.tid===G.user&&q.rd===1); const p=x&&G.players[x.pid]; return p?p.name:'-'; })()}`);
  stop('드래프트',`창단 드래프트가 끝났습니다. 우리 구단은 ${F.picks.filter(x=>x.tid===G.user&&x.pid&&!x.auto).length}명을 직접 지명했습니다(자동 지명 ${F.picks.filter(x=>x.tid===G.user&&x.pid&&x.auto).length}명, 나머지는 자동 배분). 상위 40명 연봉 ${money(ci.pay)} / 상한 ${money(ci.cap)}${ci.over>0?` (상한 ${money(ci.over)} 초과: 시즌 끝까지 넘으면 경쟁균형세)`:''}. 이제 감독을 먼저 선임하고, 감독과 상의해 외국인 선수를 뽑으세요.`); }
/* 창단 직후 기본 운영안: 의무·스카우트·2군 연수를 비서가 기본값으로 채워 둔다. 단장은 감독·외국인 선수와 전력 보강에 집중한다 */
function foundDefaults(){ const done=[], acts=[];
  if(!G.medSet){ G.medSet=true; done.push(`부상 관리: 부상 방지 ${G.med.prev}단계 · 병원 제휴 ${G.med.hosp==='none'?'없음':G.med.hosp}`); acts.push({l:'의무 운영',a:'goWork',v:'부상방지·병원'}); }
  const am=G.scouts.filter(s=>(s.role||'am')==='am'); const have=new Set(am.map(s=>s.region)); const miss=REG.filter(r=>!have.has(r));
  for(const r of miss){ if(G.scouts.length>=scoutMax())break; const sc=mkScout(2); sc.region=r; sc.role='am'; sc.since=-999; G.scouts.push(sc); done.push(`스카우트: ${r} 담당 ${sc.name} 채용(연 ${money(sc.sal)})`); }
  if(miss.length)acts.push({l:'스카우트 팀',a:'goWork',v:'스카우트팀'});
  if(!Object.keys(G.trn||{}).length){ const L=domestic(G.user).filter(p=>p.age<=23&&!p.e1&&potGapEst(p)>=6).sort((a,b)=>potGapEst(b)-potGapEst(a)).slice(0,2);
    for(const p of L){ const k=p.isP?(p.r.ctl<p.r.stf?'ctl':'stf'):(p.r.con<p.r.pow?'bat':'pow'); setDev(p.id,k); done.push(`훈련 방향: ${p.name}(${posLabel(p)}, ${p.age}세) ${DEVP[k].l}`); }
    if(L.length)acts.push({l:'선수 육성',a:'goWork',v:'2군연수'}); }
  if(!G.mgr[G.user])acts.unshift({l:'감독 선임',a:'goWork',v:'감독'});
  if(done.length)mail(`비서 ${SEC}`,'기본 운영안을 채워 두었습니다',`창단 직후라 손이 덜 가도록 운영 기본안을 적용했습니다. 모두 언제든 바꿀 수 있습니다.\n\n${done.join('\n')}\n\n단장님은 감독부터 선임하시고, 새 감독과 상의해 외국인 선수를 구성하시면 됩니다.`,{kind:'업무',face:'sec',acts:acts.slice(0,3)}); }
/* 시즌 회고: 우리 선수 중심으로 영입 기대와 실제 기여, 트레이드 결과, 젊은 선수, 내년 공백을 한 장에 */
function seasonReview(y){ const tid=G.user; const ps=playersOf(tid); const W=p=>{ const h=seasonTotal(p,y,'1군'); const w=h?warOf(h,p):0; return Math.abs(w)<.05?0:w; }; const L=[];
  const top=ps.map(p=>({p,w:W(p)})).sort((a,b)=>b.w-a.w).slice(0,3); if(top.length)L.push('[올해의 선수] '+top.map(x=>`${x.p.name}(${posLabel(x.p)}) WAR ${x.w.toFixed(1)}`).join(', ')); try{ L.push(...tbReviewLines(y)); }catch(e){}
  /* 이야기 문구로 계약 종류를 가른다. 영입(밖에서 온 선수)과 계약 연장(원래 우리 선수)을 섞지 않는다. 'FA'만 보고 고르면 '비FA'도 걸린다 */
  const how=t=>/창단 드래프트/.test(t)?'창단 지명':/신인 드래프트/.test(t)?'신인':/보상선수/.test(t)?'보상선수':/트레이드/.test(t)?'트레이드':/^FA 이적/.test(t)?'외부 FA':/^FA 잔류/.test(t)?'FA 재계약':/^비FA 다년계약/.test(t)?'비FA 연장':/입단 \((외국인|아시아쿼터)/.test(t)?'외국인':/무적 선수/.test(t)?'무적 선수':null;
  const ACQ=new Set(['트레이드','외부 FA','외국인','무적 선수','보상선수']), KEEP=new Set(['FA 재계약','비FA 연장']);
  const kinds=p=>(p.story||[]).filter(x=>x.y===y&&x.k==='move').map(x=>how(x.t)).filter(Boolean);
  const nw=ps.map(p=>{ const K=kinds(p).filter(k=>ACQ.has(k)); return K.length?{p,how:K[K.length-1]}:null; }).filter(Boolean);
  const kp=ps.map(p=>{ const K=kinds(p).filter(k=>KEEP.has(k)); return K.length&&!nw.some(x=>x.p===p)?{p,how:K[K.length-1]}:null; }).filter(Boolean);
  if(kp.length)L.push('[붙잡은 선수] '+kp.map(x=>({...x,w:W(x.p)})).sort((a,b)=>b.w-a.w).slice(0,6).map(x=>`${x.p.name}(${x.how}, 연봉 ${money(x.p.sal)}) WAR ${x.w.toFixed(1)}`).join(' / '));
  if(nw.length){ const rows=nw.map(x=>({...x,w:W(x.p)})).sort((a,b)=>b.w-a.w); L.push('[올해 영입한 선수] '+rows.slice(0,6).map(x=>`${x.p.name}(${x.how}, 연봉 ${money(x.p.sal)}) WAR ${x.w.toFixed(1)}${x.w>=1?` · 1WAR당 ${money(Math.round(x.p.sal/x.w))}`:x.w<0.3?' · 기대 이하':''}`).join(' / ')); }
  const TR=(G.trades||[]).filter(t=>t.y===y&&t.gi); for(const t of TR.slice(0,8)){ const r=tradeReport(t); if(r)L.push(`[트레이드] ${tshort(t.with)}와(과): 받은 ${t.get.join(', ')} WAR ${r.got.toFixed(1)} · 준 ${t.give.join(', ')} WAR ${r.gave.toFixed(1)} → ${r.net>=0.5?'이득':r.net<=-0.5?'손해':'비슷'}`); }
  const f0=G.fut0&&G.fut0.y===y?G.fut0.m:{}; const yg=ps.filter(p=>!p.foreign&&p.age<=25).map(p=>({p,d:f0[p.id]!=null?ovr(p)-f0[p.id]:0,w:W(p)})).filter(x=>x.d>=2||x.w>=1).sort((a,b)=>(b.d+b.w*2)-(a.d+a.w*2)).slice(0,3);
  if(yg.length)L.push('[성장한 젊은 선수] '+yg.map(x=>`${x.p.name}(${x.p.age}세) ${[x.d>=1?`능력 +${Math.round(x.d)}`:'',x.w>=1?`WAR ${x.w.toFixed(1)}`:''].filter(Boolean).join(' · ')}`).join(', '));
  const out=ps.filter(p=>!p.foreign&&!p.prospect&&p.svc>=faSvc(p)-1&&(p.lastFA==null||y+1-p.lastFA>=4)&&(!p.faC||p.yrs<=1)&&W(p)>=1).sort((a,b)=>W(b)-W(a)).slice(0,4);
  if(out.length)L.push('[내년 준비] FA 자격이 다가온 주축: '+out.map(p=>`${p.name}(${posLabel(p)}, WAR ${W(p).toFixed(1)})`).join(', ')+'. 다년계약이나 대체 자원을 미리 보세요.');
  if(!L.length)return; G.reviews=G.reviews||{}; G.reviews[y]={tid,L:L.slice()}; { const ks=Object.keys(G.reviews).map(Number).sort((a,b)=>a-b); while(ks.length>40)delete G.reviews[ks.shift()]; } /* 소식함은 오래된 것부터 지워지므로 연대기에 따로 남긴다 */
  const m=mail('전력분석팀',`${y} 시즌 회고: 우리 선수들`,`${y} 시즌을 우리 선수 중심으로 정리했습니다.\n\n${L.join('\n\n')}\n\n아래 선수별 버튼으로 유지·재계약 검토·대체 후보 찾기를 바로 할 수 있습니다. 이 회고는 구단 > 연대기의 해당 시즌에도 그대로 남습니다.`,{kind:'업무',imp:true,acts:[{l:'연대기',a:'go',v:'club:chron'},{l:'선수단 계획',a:'go',v:'roster:plan'}]});
  /* 선수별 후속 조치 버튼용 목록: 영입·트레이드로 온 선수, 성장한 젊은 선수, FA가 다가온 주축 */
  const rv=[]; const add=(p,k)=>{ if(!p||p.team!==tid)return; const o=rv.find(x=>x.id===p.id); if(o){ if(!o.k.includes(k))o.k+=' · '+k; } else rv.push({id:p.id,k,w:Math.round(W(p)*10)/10}); };
  nw.forEach(x=>add(x.p,x.how)); for(const t of TR.slice(0,8))(t.gi||[]).forEach(id=>add(G.players[id],'트레이드')); yg.forEach(x=>add(x.p,'성장')); out.forEach(p=>add(p,'FA 임박'));
  if(m&&rv.length)m.rv={y,L:rv.slice(0,12)}; }
/* 창단 드래프트 3년 뒤: 지명 당시 능력 대비 지금, 우리 유니폼을 입고 쌓은 WAR */
function fdReview(){ const F=G.fd; if(!F||!F.picks||G.fdRev)return; G.fdRev=true; const y0=G.startY||G.year-3;
  /* 은퇴로 보관 기록(G.arch)에 옮긴 선수도 이름과 성과를 남긴다(fdP, 검수 11-09zd) */ const W=(p,tid)=>sum(p.hist.filter(h=>h.lvl==='1군'&&h.y>=y0&&(tid==null||h.t===tid)).map(h=>h.war!=null&&p.arch?h.war:warOf(h,p)));
  const mine=F.picks.filter(x=>x.tid===G.user&&x.pid).slice(0,8).map(x=>{ const p=fdP(x.pid); if(!p)return {x,gone:true}; return {x,p,war:W(p,G.user),now:p.arch?null:Math.round(ovr(p))}; });
  const all=F.picks.filter(x=>x.pid&&fdP(x.pid)).map(x=>{ const p=fdP(x.pid); return {x,p,war:W(p)}; }).sort((a,b)=>b.war-a.war);
  const steal=all.find(z=>z.x.rd>=5); const L=mine.map(z=>z.gone?`${z.x.rd}라운드 · 은퇴 또는 정리`:`${z.x.rd}라운드 ${z.p.name}: 지명 때 ${dv(z.x.o0??'-')} → ${z.now==null?'은퇴':`지금 ${dv(z.now)}`} · 우리 팀 WAR ${z.war.toFixed(1)}${z.now!=null&&z.p.team!==G.user?' (지금은 다른 구단)':''}`);
  mail('스카우트팀장','창단 드래프트 3년 회고',`창단 드래프트 뒤 3시즌이 지났습니다. 우리 상위 지명 선수들입니다.\n\n${L.join('\n')}\n\n리그 전체 최고 성과: ${all[0]?`${all[0].p.name}(${tshort(all[0].x.tid)} ${all[0].x.rd}라운드) WAR ${all[0].war.toFixed(1)}`:'-'}${steal?`\n최고의 스틸: ${steal.p.name}(${tshort(steal.x.tid)} ${steal.x.rd}라운드) WAR ${steal.war.toFixed(1)}`:''}`,{kind:'업무',imp:true}); }
function draftedBy(tid){ return G.draft?G.draft.picks.filter(x=>x.tid===tid&&x.pid>0).length:0; }
function rosterProj(tid){ return rosterN(tid)+draftedBy(tid)+milBackBy(tid); }
/* 다음 개막 전까지 전역해 돌아오는 선수(검수 11-08: 지명 화면 예상 인원에서 빠짐) */
function milBackBy(tid){ const op=G.cal&&G.cal.open>G.day?G.cal.open:onOrAfter(G.year+1,3,25,6); /* 다음 시즌 실제 개막일(buildCalendar와 같은 식, 검수 11-09d) */ return awayOf(tid).filter(p=>!p.ys&&p.mil&&p.mil.until>G.day&&p.mil.until<=op).length; }
/* 포지션 필요도: 구단 안 26세 이하 유망주가 적은 자리(포수·내야·외야·선발·불펜)일수록 가산점(최대 +3) */
function dGrp(p){ if(p.isP)return p.role==='RP'?'RP':'SP'; return p.pos==='C'?'C':['1B','2B','3B','SS'].includes(p.pos)?'IF':p.pos==='DH'?'IF':'OF'; }
function draftNeed(tid){ const k=['C','IF','OF','SP','RP'], share={C:.08,IF:.27,OF:.2,SP:.25,RP:.2}; const L=domestic(tid).filter(p=>p.age<=26).concat(Object.values(G.players).filter(p=>p.team===tid&&!p.foreign&&p.joinY>G.year)); /* 이번 드래프트에서 이미 뽑은(내년 합류) 선수도 수요에 반영(검수 11-07) */ const n=L.length||1; const o={};
  for(const g of k){ const c=L.filter(p=>dGrp(p)===g).length; o[g]=clamp((share[g]*n-c)*.6,-2,3); } return o; }
function aiDraftScore(tid,p,need){ const t=team(tid); return p.pot-(p.hidT&&u01('aih'+tid,p.id)>=.2?p.hidT:0)+ /* 숨은 재능은 AI 구단도 대부분 놓친다 */hn('ai'+tid+G.year,p.id)*t.scoutSd*netSdM(p,tid)+ /* 후보 권역 정보망만큼 오차가 줄거나 는다(검수 11-09e #29) */(ovr(p)-35)*(t.mode==='contend'?.5:.25)+(need[dGrp(p)]||0); }
/* AI 지명: 평가 순으로 보되, 로스터가 찬 3라운드 이후에는 최하위 선수보다 나은 후보만 뽑는다.
   기준을 넘는 후보가 하나라도 있으면 그중 평가 1위를 뽑고, 아무도 없을 때만 건너뛴다(검수 11-09d: 1위만 보고 패스). 모의 지명도 같은 판단 */
function aiDraftChoose(tid,ids,rd,proj){ const t=team(tid); const need=draftNeed(tid);
  const L=ids.map(id=>({id,s:aiDraftScore(tid,G.players[id],need)})).sort((a,b)=>b.s-a.s); if(!L.length)return null;
  if(!(rd>=3&&proj>=ROSTER_MAX-2))return L[0].id;
  const worst=Math.min(...domestic(tid).map(keepScore)); const f=L.find(x=>keepScore(G.players[x.id])+hn('ak'+tid,x.id)*t.scoutSd*.5>=worst+1); return f?f.id:-1; }
function aiDraftPick(tid){ const d=G.draft; return aiDraftChoose(tid,d.cls.filter(id=>G.players[id]&&G.players[id].prospect),d.picks[d.cur].rd,rosterProj(tid)); }
function passCurrent(){ const d=G.draft; const pk=d.picks[d.cur]; pk.pid=-1; pk.pass=true; d.cur++; if(pk.tid===G.user&&!G.unemp)addLog(`${pk.rd}라운드 ${pk.no}순위 지명을 건너뛰었습니다.`); if(d.cur>=d.picks.length)finishDraft(); }
/* 우리 지명 요청: 우리 차례일 때만(검수 11-06) */
function userPick(pid){ const d=G.draft; const pk=d&&!d.done&&d.picks[d.cur]; if(!pk||pk.tid!==G.user)return '지금은 우리 차례가 아닙니다.'; return doPick(pid)?'':'지명할 수 없는 선수입니다.'; }
function doPick(pid){
  const d=G.draft; const pk=d&&!d.done&&d.picks[d.cur]; const p=G.players[pid]; if(!pk||!p||!p.prospect||!d.cls.includes(pid))return false; /* 이미 지명된 선수·후보 아닌 선수는 다시 뽑지 않는다(검수 11-06) */
  const mine=pk.tid===G.user&&!G.unemp; let rp0=null; /* 지명 직전 우리 스카우트 추정: 지명 뒤 다시 읽으면 우리 선수 기준이라 값이 달라진다(검수 11-09d) */
  if(mine){ try{ rp0=scoutReport(p); if(rp0.ofp!=null)p.dEst={ofp:rp0.ofp,sd:rp0.sd,who:rp0.who,tid:G.user,y:G.year,d:G.day}; }catch(e){} }
  p.prospect=false; p.team=pk.tid; p.joinY=G.year+1; p.sal=MIN_SAL; p.svc=0; p.draft={y:G.year,rd:pk.rd,no:pk.no,tid:pk.tid,bonus:bonusOf(pk.rd,pk.no,p),...(pk.from!=null?{from:pk.from}:{})}; /* from: 넘겨받은 지명권의 원래 구단(거래 성과 집계) */ acqStamp(p,'draft',pk.tid,Object.assign({rd:pk.rd,no:pk.no},mine?{how:pk.rule?'rule':pk.auto?'auto':'gm'}:{})); if(mine&&rp0)try{ p.acq.e0=rp0.cur; if(rp0.ofp!=null)p.acq.ep=rp0.ofp; }catch(e){} story(p,`${G.year} 신인 드래프트 ${pk.rd}라운드 ${pk.no}순위 · ${tname(pk.tid)} 지명 (${p.school||''})`,'draft');
  { G.sea.bonus=G.sea.bonus||{}; G.sea.bonus[pk.tid]=(G.sea.bonus[pk.tid]||0)+p.draft.bonus; } pk.pid=pid; d.cur++;
  chron('draft',`신인 ${pk.rd}라운드 ${pk.no}순위 ${p.name}(${posLabel(p)}, ${p.age}세) 지명 · 계약금 ${money(p.draft.bonus)} · ${p.joinY}년 합류`,p.id,pk.tid,{source:'draft:'+d.y+':'+pk.no+':'+pk.rd+':'+pk.tid});
  if(mine&&p.father)try{ sonDrafted(p); }catch(e){} /* 옛 선수의 아들(11-09r) */
  if(mine)addLog(`${pk.rd}라운드 ${pk.no}순위로 ${p.name}(${p.college?'대졸':'고졸'}·${posLabel(p)})을(를) 지명했습니다.`);
  if(pk.tid!==G.user&&(G.shortlist||[]).includes(pid)){ (d.lost=d.lost||[]).push({pid,tid:pk.tid,rd:pk.rd,no:pk.no,nm:p.name}); }
  G.shortlist=(G.shortlist||[]).filter(x=>x!==pid);
  if(d.cur>=d.picks.length)finishDraft(); return true;
}
function passPick(){ const d=G.draft; const pk=d&&!d.done&&d.picks[d.cur]; if(!pk||pk.tid!==G.user)return; passCurrent(); } /* KBO는 어느 라운드든 지명권을 패스할 수 있다(카페 피드백 11-09v) */
function finishDraft(){ const d=G.draft; d.done=true; G.dlog=G.dlog||{}; G.dlog[d.y]=d.picks.filter(x=>x.pid>0).map(x=>{ const p=G.players[x.pid]; return {id:x.pid,nm:p?p.name:'',t:x.tid,rd:x.rd,no:x.no,from:x.from??x.tid,pos:p?posLabel(p):'',pr:p?p.press||null:null}; }); for(const id of d.cls){ const p=G.players[id]; if(G.dmemo)delete G.dmemo[id]; /* 후보 메모·고려 라운드도 함께 정리(검수 11-09ze) */ if(!p||!p.prospect)continue; if(p.ovsRet){ p.prospect=false; toFree(p,`${d.y} 신인 드래프트 미지명 · 자유계약 선수`); continue; } /* 해외파 복귀자는 지우지 않고 자유계약으로(검수 11-09ze) */ delete G.players[id]; } G.draftClass=[]; const cls=new Set(d.cls);
  const mine=d.picks.filter(x=>x.tid===G.user&&x.pid>0).map(x=>G.players[x.pid]).filter(Boolean); G.shortlist=(G.shortlist||[]).filter(id=>!cls.has(id)&&G.players[id]); /* 신인 후보만 정리하고 현역 관심 선수는 남긴다(검수 11-06) */
  note('드래프트',`드래프트를 마쳤습니다. 우리 구단 지명: ${mine.map(p=>p.name).join(', ')}. 내년 1월에 합류합니다.`); }
function advanceDraft(stopAtUser){
  const d=G.draft;
  while(!d.done){ const pk=d.picks[d.cur]; const me=pk.tid===G.user&&!G.unemp; /* 야인 기간 전 구단은 AI 기준(검수 11-09d) */ if(me&&stopAtUser)return; const id=me?userAutoPick():aiDraftPick(pk.tid); if(!id){finishDraft();break;} if(id===-1){passCurrent();continue;} if(me)pk.auto=true; doPick(id); }
}
/* 남은 우리 지명 일괄 처리. pass: 모두 건너뛴다
   cond: 스카우트 추천 후보의 잠재력 추정 등급이 기준(min) 이상일 때만 지명하고, 아니면 건너뛴다. 로스터가 한도에 차면 더 뽑지 않는다.
   KBO 규약상 지명권 패스는 라운드 제한이 없어 1·2라운드도 기준 미달이면 건너뛴다(카페 피드백 11-09v).
   드래프트가 열리기 전에 정하면 drestPre에 두었다가 startDraft가 이어 받는다 */
function draftRestSet(mode,min){ const d=G.draft; const r=mode?{mode,min:min||3,tid:G.user}:null; if(!d||d.done){ G.drestPre=r&&Object.assign({y:G.year},r); return; } d.rest=r; delete d.ruleMsg; }
function draftRestPre(){ const P=G.drestPre; return P&&P.y===G.year&&P.tid===G.user&&!G.unemp?P:null; }
/* 일괄 처리는 설정한 구단에만: 이직하면 새 구단 지명에 쓰지 않는다(검수 11-09d) */
function draftRestOf(){ const d=G.draft; return d&&!d.done&&d.rest&&d.rest.tid===G.user&&!G.unemp?d.rest:null; }
function draftCondSummary(min){ const d=G.draft, ids=d&&!d.done?d.cls:G.draftClass||[]; let total=0,fit=0,unknown=0;for(const id of ids){const p=G.players[id];if(!p?.prospect)continue;total++;const T=potTierP(scoutReport(p),p);if(!T)unknown++;else if(T.n>=min)fit++;}return {total,fit,unknown,full:rosterProj(G.user)>=ROSTER_MAX}; }
function draftRestPick(){ const d=G.draft; const R0=draftRestOf(); const pk=R0&&d.picks[d.cur]; if(!pk||pk.tid!==G.user)return null;
  const S=R0.mode==='cond'?draftCondSummary(R0.min):null;if(S&&!S.full&&!S.fit&&S.unknown){d.ruleMsg=`기준 충족 후보가 확인되지 않았고 잠재력 미확인 후보가 ${S.unknown}명 남아 자동 지명을 멈췄습니다. 미확인을 기준 미달로 처리하지 않습니다. 스카우트 배치·직접 관찰을 확인하거나 직접 지명하세요.`;d.rest=null;return null;}
  const cond=R0.mode==='cond'; const fit=p=>{ const T=potTierP(scoutReport(p),p); return !!T&&T.n>=R0.min; }; const id=cond&&rosterProj(G.user)<ROSTER_MAX?userAutoPick(fit):null; const ok=!!id; /* 기준을 채운 후보 중 추천 1위(종합 1위가 미달이어도 2위 이하에서 찾는다) */
  if(ok){ pk.rule=true; doPick(id); return {pk,pid:id,me:true}; }
  pk.passReason=!cond?'직접 설정: 남은 지명 건너뛰기':S.full?`정식 로스터 한도 ${ROSTER_MAX}명`:'잠재력 추정 기준을 충족한 후보 없음';
  passCurrent(); return {pk,pass:true}; }
function userAutoPick(ok){ const av=G.draft.cls.filter(id=>G.players[id]&&G.players[id].prospect&&(!ok||ok(G.players[id]))); let best=null,bs=-1; /* ok: 조건(등급 등)을 채운 후보 중에서만 */ const pol=draftPolK();
  for(const id of av){ const rp=scoutReport(G.players[id]); const v=draftVal(rp)+(pol&&draftFit(G.players[id],pol)?4:0); if(v>bs){bs=v;best=id;} } return best; }


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
