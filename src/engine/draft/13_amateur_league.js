/* ===== 아마추어 야구: 고교·대학 선수들이 실제 경기를 치른다 (구단주 11-15 "실제 그 고교 선수들 가지고 리그 돌려야 해. 가라 성적이 아니라")
   - 선수: 드래프트 후보는 고1(대학은 대1)부터 실제로 있다. 저학년은 G.amU에 짧게 저장하고(능력·학년별 기록만), 졸업 학년이 되는 해 1월 1일 드래프트 후보(G.players)가 된다.
     해마다 겨울에 자란다(늦게 피는 선수·일찍 멈추는 선수가 섞인다). 학교 감독 성향이 성장과 기용에 조금씩 영향을 준다(어느 구단이 지켜보든 같다).
   - 팀: 학교마다 실제 후보(전 학년) + 그날 경기에만 쓰는 일반 부원(학교·연도 고정 시드로 매번 같게 다시 만든다, 저장 안 함). 부원 수준은 학교 전력(lv)을 따른다.
   - 일정: 고교 주말리그(8개 권역, 3~6월 주말, 두 바퀴) + 전국대회 5개(GM_TOURN 날짜, 단판 토너먼트. 황금사자기·청룡기는 주말리그 상위 32개교) +
     대학 U-리그(3개 조, 4~8월 화·목) + 전국대학야구선수권(7월). 나무 배트, 콜드게임(5회 10점·7회 7점), 10회부터 승부치기.
   - 투구 수: 하루 105개, 31개 이상 던지면 쉬는 날(1~4일), 사흘 연속 등판 금지(KBO 고교 규정). 대학도 같은 규정을 쓴다(게임 단순화).
   - 경기: 타석 단위 간이 경기. 확률은 1군과 같은 능력 모형(batProbs, 투수는 pitProbs와 같은 식)에 아마 척도(능력을 그 무대 평균 기준으로 늘린 값)를 넣는다.
   - 시즌 환경: 해마다 공·날씨·스트라이크 존 경향(env)이 조금 달라 투고타저·타고투저가 자연스럽게 나온다. 시즌 뒤 요약을 남긴다(G.amH).
   - 저장: 선수별 시즌 기록·순위·대진표·학교별 최근 결과만. 박스스코어는 남기지 않는다 */
const AM_LIM=105, AM_REST=[[76,4],[61,3],[46,2],[31,1]];
const AMC={hs:{m:12,s:2.2,fm:2,fsd:7,fg:2.2,bab:.022,bbm:1.25},col:{m:20,s:2.2,fm:10,fsd:7,fg:1.6,bab:.008,bbm:1.15}};
/* m·s: 아마 척도(능력 m이 1군 평균 50처럼 보이고, 차이는 s배로 벌어진다: 아마 무대는 선수 간 격차가 크다). fm·fsd: 일반 부원 능력(학교 전력 55 기준), fg: 학년당 차이.
   bab·bbm: 아마 수준 보정(수비가 거칠어 인플레이 안타가 많고, 제구가 흔들려 볼넷이 많다). 3개 세계로 맞춘 값(측정 11-15: 졸업 학년 잠재력 상위 고교 타자 타율 중앙값 .39, 투수 ERA 1.3) */
const AM_BK=['g','pa','ab','h','d','tr','hr','bb','hbp','so','r','rbi','sb','cs'], AM_PK=['g','gs','outs','bf','h','hr','bb','hbp','so','r','er','w','l','np'];
const AM_SL_P=.08, AM_SL_D=6; /* 졸업 학년 부진 확률·그해 아마 척도 감소(1군 척도 점수) */
const AM_STY_GROW={육성형:.55,엄격형:.1,데이터형:.2,자율형:0}; /* 겨울 성장 가산(능력 점수) */
let AM_TRACE=null; /* 점검용: 배열을 넣으면 경기마다 박스스코어를 쌓는다 */
let _amRos=null, _amToday={d:-1,L:[]};
const amOn=()=>G&&G.amOff!==true;
function amPipe(){ return G.amU||(G.amU={yr:null,L:{}}); }
const amGrade=(e,y)=>(e.c?4:3)-(e.gy-y);
/* 고교 전력: 학교 객체(91_schools)가 아직 없으면(새 게임 초기) 임시 표에 두고, 학교를 만들 때 그 값을 쓴다 */
function amHsObj(n){ if(G.schools)return G.schools[n]||null; if(!AREA.some(a=>a.hs.includes(n)))return null; const T=G.amHsLv=G.amHsLv||{}; return T[n]||(T[n]={lv:Math.round(clamp(N(55,10),30,85)),lh:[]}); }
const amLvOf=n=>{ const S=amHsObj(n); if(S)return S.lv; const C=amCols()[n]; return C?C.lv:55; };
function amCols(){ if(G.amCol)return G.amCol; const o={}; for(const a of AREA)for(const n of a.un)o[n]={n,area:a.k,lv:Math.round(clamp(50+hn('acl',n)*9,30,80))}; return G.amCol=o; }
const amSty=n=>{ const S=(G.schools||{})[n]; return S&&S.coach?S.coach.sty:null; };
/* ---------- 권역 조 편성(주말리그·U-리그): 학교 이름 목록만으로 정해진다 ---------- */
function amGroups(){ const by=k=>(areaDef(k)||{hs:[]}).hs, alt=(L,i)=>L.filter((_,j)=>j%2===i);
  const s=by('서울'), g=by('인천·경기').concat(by('강원')), h=by('전북').concat(by('광주·전남'),by('제주')), y=by('대구·경북').concat(by('부산·울산·경남'));
  return [['서울A',alt(s,0)],['서울B',alt(s,1)],['경기·강원A',alt(g,0)],['경기·강원B',alt(g,1)],['충청',by('충청')],['호남·제주',h],['경상A',alt(y,0)],['경상B',alt(y,1)]].filter(x=>x[1].length>1); }
function amColGroups(){ const by=k=>(areaDef(k)||{un:[]}).un; return [['U-리그 A조',by('서울')],['U-리그 B조',by('인천·경기').concat(by('강원'),by('충청'),by('전북'))],['U-리그 C조',by('광주·전남').concat(by('대구·경북'),by('부산·울산·경남'),by('제주'))]]; }
const AM_TOURS=()=>GM_TOURN.map((t,i)=>({k:'t'+i,n:t[4].replace(' 전국고교야구',''),a:[t[0],t[1]],b:[t[2],t[3]],top:i===1||i===3?32:0}));
const AM_COLT={k:'ct',n:'전국대학야구선수권',a:[7,8],b:[7,20]};
/* ---------- 선수(저학년 포함) 만들기 ---------- */
function amGenR(isP,base,pos){ const g=()=>N(base,7); let r;
  if(isP)r={stf:g(),ctl:g(),sta:N(base,11)}; else { r={con:g(),pow:g(),eye:g(),spd:g(),def:g()};
    if(['SS','CF','2B'].includes(pos)){r.def+=6;r.spd+=5;r.pow-=4} if(['1B','LF','RF'].includes(pos)){r.pow+=5;r.def-=5} if(pos==='C'){r.spd-=8;r.def+=9;r.con-=3;r.pow-=2} }
  const o=isP?r.stf*.44+r.ctl*.44+r.sta*.12:r.con*.3+r.pow*.25+r.eye*.15+r.spd*.1+r.def*.2; for(const k in r)r[k]=Math.round(clamp(r[k]+base-o,2,80)*10)/10; return r; }
const amOvr=(isP,r)=>isP?r.stf*.44+r.ctl*.44+r.sta*.12:r.con*.3+r.pow*.25+r.eye*.15+r.spd*.1+r.def*.2;
function amPickSchool(a,col,T){ const L=col?a.un:a.hs; const f=clamp(.5+(T-43)/16,.3,1.8); let tot=0; const w=L.map(n=>{ const v=Math.exp((amLvOf(n)-55)/20*f); tot+=v; return v; }); let x=R()*tot; for(let i=0;i<L.length;i++){ x-=w[i]; if(x<=0)return L[i]; } return L[L.length-1]; } /* 강한 학교일수록 좋은 신입생이 온다(재목일수록 더) */
/* 졸업 학년(gy) 기준 한 명: 졸업 학년 능력을 먼저 정하고(예전 드래프트 후보와 같은 분포), 남은 겨울 성장분만큼 빼서 지금(1학년) 능력을 둔다 */
function amGenEntry(gy,col,lvAdj){ const ageS=col?22:18; const T=clamp(N(43,8)+(R()<.04?rnd(3,8):0)-lvAdj,26,77); const curS=T-(27-ageS)*rnd(2.2,3.4);
  const tmp=newPlayer({age:ageS,base:clamp(curS,20,60),pot:T,college:col}); delete G.players[tmp.id];
  const a=pickArea(); const W=col?3:2; const u=R(); const ty=u<.15?'late':u<.27?'early':'';
  const per=ty==='late'?4.3:ty==='early'?1.1:2.8, tot=per*W*rnd(.8,1.2);
  const sh=W===2?(ty==='late'?[.15,.85]:ty==='early'?[.75,.25]:[.5,.5]):(ty==='late'?[.1,.25,.65]:ty==='early'?[.6,.3,.1]:[.34,.33,.33]);
  const rS=amGenR(tmp.isP,curS,tmp.pos), r={}; for(const k in rS)r[k]=Math.round((rS[k]-tot)*10)/10;
  const e={id:tmp.id,n:tmp.name,s:amPickSchool(a,col,T),a:a.k,c:col?1:0,gy,P:tmp.isP?1:0,pos:tmp.pos,t:tmp.th,b:tmp.bt,v:Math.round(tmp.velo*10)/10,pot:Math.round(T*10)/10,r,gp:sh.map(x=>Math.round(x*tot*10)/10),ty,
    ht:Math.round(clamp(N(tmp.isP?184:179,5)-(W*1.5),164,196)),wt:0,inj:Math.round(tmp.inj*1000)/1000,y:[]};
  e.wt=Math.round(clamp(e.ht-100+N(tmp.isP?-4:-6,6),55,108));
  if(T<56&&R()<.07){ const h=ri(6,12); e.pot=Math.min(78,e.pot+h); e.hidT=h; }
  if(tmp.inj>.22&&R()<.65){ e.ai=pick(tmp.isP?AM_INJ_P:AM_INJ_B); e.ig=gy-ri(0,W); } /* 부상 이력: 그 학년 시즌 전반을 쉰다 */
  return e; }
function amGenCohort(gy,col,n){ const U=amPipe(); const lv=draftLevelAdj(); for(let i=0;i<n;i++){ const e=amGenEntry(gy,col,lv); U.L[e.id]=e; } }
const AM_NH=()=>Math.round(DRAFT_POOL*.7), AM_NC=()=>DRAFT_POOL-AM_NH();
/* 겨울 성장: 계획분 + 개인 편차 + 감독 성향(육성형이 가장 크다) */
function amGrowAll(){ const U=amPipe(); for(const e of Object.values(U.L)){ const sty=e.c?null:amSty(e.s); const inc=(e.gp.shift()||0)+N(0,.9)*(sty==='자율형'?1.35:1)+(AM_STY_GROW[sty]||0);
    for(const k in e.r)e.r[k]=Math.round(clamp(e.r[k]+inc+N(0,.6),2,80)*10)/10;
    if(e.ht<(e.P?190:186)&&R()<.5){ e.ht+=1; e.wt+=1; } e.wt+=ri(0,2); } }
/* 해마다 1월 1일(makeDraftClass): 지난 시즌 정리(학교 전력 변화) → 겨울 성장 → 새 1학년 입학. 같은 해에 두 번 불러도 한 번만 */
function amYearStart(Y){ const U=amPipe(); if(U.yr!=null&&U.yr>=Y)return false;
  if(G.amL&&G.amL.y<Y){ try{ if(!G.amL.done)amSeasonEnd(G.amL); amLvDrift(G.amL); }catch(e){ console.error(e); } G.amLp=amLiteRes(G.amL); delete G.amL; }
  if(U.yr!=null)amGrowAll(); U.yr=Y;
  amGenCohort(Y+2,false,AM_NH()); amGenCohort(Y+3,true,AM_NC());
  for(const id in U.L)if(U.L[id].gy<Y)delete U.L[id]; return true; }
/* 처음 세계(새 게임)·예전 저장: 3년 전부터 시즌을 실제로 돌려 지금 학년까지의 기록을 만든다(그때부터 경기가 있었던 것처럼) */
function amBoot(Y,minGy){ const U=amPipe(); if(U.yr!=null)return; const t0=Date.now(); const want=gy=>gy>=Y&&(minGy==null||gy>=minGy);
  for(let y=Y-3;y<=Y;y++){ if(y>Y-3)amGrowAll(); if(want(y+2))amGenCohort(y+2,false,AM_NH()); if(want(y+3))amGenCohort(y+3,true,AM_NC());
    if(y<Y){ const S=amSimYear(y); try{ amLvDrift(S); }catch(e){} const h=(G.amH||[]).find(x=>x.y===y); if(h)h.boot=1; if(y===Y-1&&!G.amL)G.amLp=amLiteRes(S); } } /* 지난 시즌 요약(학교 페이지 일반 부원 기록 포함) */ /* 처음 세계의 지난 시즌은 학년이 다 차지 않아(저학년만) 시즌 환경 비교에서 뺀다 */
  U.yr=Y; G.amBootMs=Date.now()-t0; }
/* ---------- 경기 단위(유닛): 후보(G.players)·저학년(G.amU)·일반 부원 ---------- */
function amSimR(p){ return p.amR||p.r; }
function amUnit(src,kind,sch,lvl,y){ const isP=kind==='e'?!!src.P:!!src.isP; const r=kind==='e'?src.r:kind==='p'?amSimR(src):src.r;
  const C=AMC[lvl], E={}; for(const k in r)if(k!=='vit')E[k]=50+(r[k]-C.m)*C.s;
  if(kind==='p'&&src.amSl&&y===G.year)for(const k in E)E[k]-=AM_SL_D;
  const sty=lvl==='hs'?amSty(sch):null; if(!isP){ if(sty==='데이터형')E.eye+=4; if(sty==='자율형'){ E.pow+=3; E.con-=1; } }
  const u={id:src.id,kind,src,sch,isP,E,gr:kind==='e'?amGrade(src,y):kind==='p'?(src.college?4:3):src.gr,out:(kind==='e'?src.ig===y:kind==='p'&&src.amIg===y)?dnum(y,6,1):0}; /* 부상 시즌: 6월부터 뛴다 */
  const st={id:u.id,r:E,isP}; if(isP){ u.q=amPitQ(st); u.sv=E.stf*.44+E.ctl*.44+E.sta*.12; u.lim=Math.min(AM_LIM,Math.round(60+E.sta*.45)); u.ft=30+E.sta*.55; }
  else { const q=batProbs(st,0); u.q=q; u.bv=E.con*.3+E.pow*.25+E.eye*.15+E.spd*.1+E.def*.2; u.ov=E.con*.4+E.pow*.35+E.eye*.25; }
  return u; }
function amPitQ(p){ const r=p.r, be=0, b=0; return {k:PW.k0+cc(r.stf,0)*.24, bb:clamp(.15-cc(r.ctl,be)*.13,.025,.16), hr:clamp((PW.h0-cc(r.stf,b)*PW.hs-cc(r.ctl,be)*PW.hc-trt(p,'mv')*.0008)*(1-gbT(p)*.13),.006,.06),
  babip:clamp(PW.b0-cc(r.stf,b)*PW.bs-cc(r.ctl,be)*PW.bc-trt(p,'mv')*.0008+gbT(p)*.003,.25,.36), x2:clamp(1-(cc(r.stf,b)-.5)*PW.xs-(cc(r.ctl,be)-.5)*PW.xc-gbT(p)*.05,.6,1.4), ctl:r.ctl}; } /* 1군 pitProbs와 같은 식(구종 가산 제외) */
/* 일반 부원: 입학 연도(학년 묶음)마다 학교·입학 연도 시드로 늘 같게 만든다(저장 안 함). 같은 부원이 1학년부터 졸업까지 이어지고, 학년이 오를 때마다 fg만큼 낫다.
   학년마다 타자·투수 수(AM_FN). 이름·포지션·체격도 시드로 정해 학교 페이지 선수단에 그대로 보인다 */
const AM_FN={hs:[4,3],col:[3,2]}, AM_FPOS=['C','SS','2B','CF','3B','1B','LF','RF'];
function amFill(sch,y,lvl,lv){ const C=AMC[lvl], nG=lvl==='hs'?3:4, mid=lvl==='hs'?2:2.5, [nb,np]=AM_FN[lvl], mu=C.fm+(lv-55)*.13, L=[];
  for(let gr=1;gr<=nG;gr++){ const ey=y-gr+1, rnd0=seededRand('amf:'+sch+':'+ey), n=(m,s)=>{ let u=0,v=0; while(!u)u=rnd0(); v=rnd0(); return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
    const mk=(isP,i)=>{ const base=mu+(gr-mid)*C.fg+n(0,C.fsd*.6); const r=isP?{stf:n(base,5),ctl:n(base,5),sta:n(base,7)}:{con:n(base,5),pow:n(base,5),eye:n(base,5),spd:n(base,6),def:n(base,5)};
      const nm=surAt(rnd0())+GN[Math.floor(rnd0()*GN.length)], ht=Math.round(n(isP?180:176,5))-(nG-gr), t=rnd0()<.2?'좌':'우', b=isP?t:rnd0()<.3?'좌':'우';
      return {id:'f'+sch+'#'+ey+(isP?'p':'b')+i,isP,r,gr,ey,i,n:nm,pos:isP?'P':AM_FPOS[(i+ey)%AM_FPOS.length],ht,wt:Math.round(ht-104+n(0,5)),t,b}; };
    for(let i=0;i<nb;i++)L.push(mk(false,i)); for(let i=0;i<np;i++)L.push(mk(true,i)); }
  return L; }
/* 일반 부원 올해 기록: 학교·입학 연도·번호별 짧은 숫자 줄만(이름표·능력은 저장하지 않는다). 학교 페이지 선수단용 */
const AM_FBK=['g','pa','ab','h','d','tr','hr','bb','hbp','so'], AM_FPK=['g','gs','outs','h','hr','bb','so','er'];
function amFillAdd(S,u,b){ const f=u.src; if(f.ey==null)return; const F=S.fr||(S.fr={}), Sc=F[u.sch]||(F[u.sch]={}), E=Sc[f.ey]||(Sc[f.ey]={b:[],p:[]}), L=u.isP?E.p:E.b, K=u.isP?AM_FPK:AM_FBK;
  const r=L[f.i]||(L[f.i]=new Array(K.length).fill(0)); r[0]++; for(let k=1;k<K.length;k++)r[k]+=b[K[k]]||0; }
function amFillRow(S,sch,ey,isP,i){ const r=S&&S.fr&&S.fr[sch]&&S.fr[sch][ey]&&S.fr[sch][ey][isP?'p':'b'][i]; if(!r)return null; const K=isP?AM_FPK:AM_FBK, o={}; K.forEach((k,j)=>o[k]=r[j]); if(!isP)o.sb=o.cs=o.r=o.rbi=0; return o; }
/* 그해 학교별 선수단(경기 단위). 진행 중 시즌은 메모리에 한 번만 만든다 */
function amRosters(y){ const key=y+':'+(G.draftClass||[]).length+':'+Object.keys(amPipe().L).length; if(_amRos&&_amRos.k===key&&_amRos.g===G)return _amRos.m;
  const m={}; const add=(sch,lvl,u)=>{ const R0=m[sch]||(m[sch]={lvl,B:[],P:[]}); (u.isP?R0.P:R0.B).push(u); };
  const known=n=>AREA.some(a=>a.hs.includes(n)||a.un.includes(n));
  for(const e of Object.values(amPipe().L)){ const g=amGrade(e,y); if(g<1||g>(e.c?4:3)||!known(e.s))continue; add(e.s,e.c?'col':'hs',amUnit(e,'e',e.s,e.c?'col':'hs',y)); }
  if(y===G.year)for(const id of G.draftClass||[]){ const p=G.players[id]; if(!p||!p.prospect||p.ovsRet||!p.school||p.team!=null||!known(p.school))continue; const lvl=p.college?'col':'hs'; add(p.school,lvl,amUnit(p,'p',p.school,lvl,y)); }
  const all=[...AREA.flatMap(a=>a.hs.map(n=>[n,'hs'])),...AREA.flatMap(a=>a.un.map(n=>[n,'col']))];
  for(const [n,lvl] of all){ const R0=m[n]||(m[n]={lvl,B:[],P:[]}); for(const f of amFill(n,y,lvl,amLvOf(n)))(f.isP?R0.P:R0.B).push(amUnit(f,'f',n,lvl,y)); }
  _amRos={k:key,g:G,m}; return m; }
/* ---------- 시즌 상태 ---------- */
function amEnv(y){ const r=seededRand('amenv:'+y), n=()=>{ let u=0; while(!u)u=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r()); };
  return {hr:+clamp(1+n()*.16,.65,1.4).toFixed(3),bab:+clamp(n()*.01,-.025,.025).toFixed(4),bb:+clamp(1+n()*.07,.85,1.18).toFixed(3),k:+clamp(1+n()*.06,.86,1.15).toFixed(3)}; } /* 공 반발력·날씨·존 경향 */
function amNewSeason(y,live){ const S={y,live:!!live,env:amEnv(y),rec:{},tour:{},res:{},rest:{},tot:{hs:amTot0(),col:amTot0()},from:live?G.day:-1e9,last:-1e9,news:{},lgD:null,clD:null};
  for(const [g,L] of amGroups())S.rec[g]=Object.fromEntries(L.map(n=>[n,[0,0,0,0,0]]));
  for(const [g,L] of amColGroups())S.rec[g]=Object.fromEntries(L.map(n=>[n,[0,0,0,0,0]]));
  return S; }
const amTot0=()=>({pa:0,ab:0,h:0,hr:0,bb:0,so:0,outs:0,er:0,r:0,g:0});
function amLive(){ if(!G.amL||G.amL.y!==G.year)G.amL=amNewSeason(G.year,true); return G.amL; }
/* 리그 경기일: 주말리그는 3월 둘째 토요일~6월 말 토·일(전국대회 기간 제외, 모자라면 7월 주말), U-리그는 4~8월 화·목(선수권 기간 제외) */
function amTourSpan(y,t){ return [dnum(y,t.a[0],t.a[1]),dnum(y,t.b[0],t.b[1])]; }
function amLeagueDays(y,col){ const sp=(col?[AM_COLT]:AM_TOURS()).map(t=>amTourSpan(y,t)); const inT=d=>sp.some(([a,b])=>d>=a&&d<=b); const L=[];
  const a=col?dnum(y,4,1):dnum(y,3,7), b=col?dnum(y,8,31):dnum(y,7,31);
  for(let d=a;d<=b;d++){ const w=dobj(d).w; if((col?(w===2||w===4):(w===0||w===6))&&!inT(d))L.push(d); } return L; }
function amRounds(L){ const n=L.length+(L.length%2), half=n-1; const R0=[]; for(let r=0;r<half;r++)R0.push(flRR(L,r)); for(let r=0;r<half;r++)R0.push(flRR(L,r).map(([h,a])=>[a,h])); return R0; }
function amDayGames(S,d){ const y=S.y, out=[];
  if(!S.lgD)S.lgD=amLeagueDays(y,false); if(!S.clD)S.clD=amLeagueDays(y,true);
  const li=S.lgD.indexOf(d); if(li>=0)for(const [g,L] of amGroups()){ const R0=amRounds(L); if(li<R0.length)for(const [h,a] of R0[li])out.push({h,a,g,lvl:'hs'}); }
  const ci=S.clD.indexOf(d); if(ci>=0)for(const [g,L] of amColGroups()){ const R0=amRounds(L); if(ci<R0.length)for(const [h,a] of R0[ci])out.push({h,a,g,lvl:'col'}); }
  for(const t of AM_TOURS().concat([AM_COLT])){ const [a,b]=amTourSpan(y,t); if(d<a||d>b)continue; const T=amTourGet(S,t,d); if(!T||T.ch)continue; const k=T.days.indexOf(d); if(k<0||k!==T.rd.length)continue;
    const B=T.cur; for(let i=0;i<B.length;i+=2){ const h=B[i], aw=B[i+1]; if(h&&aw)out.push({h,a:aw,t:t.k,lvl:t.k==='ct'?'col':'hs',i}); } }
  return out; }
function amTourGet(S,t,d){ let T=S.tour[t.k]; if(T)return T; const [a,b]=amTourSpan(S.y,t); if(d!==a||d<S.from)return null;
  const col=t.k==='ct'; let ent=col?AREA.flatMap(x=>x.un):AREA.flatMap(x=>x.hs);
  if(t.top){ const st=amStandAll(S,false); ent=st.slice(0,t.top).map(x=>x.n); }
  const rnd0=seededRand('amtour:'+S.y+':'+t.k); let P2=1; while(P2<ent.length)P2*=2; const byes=P2-ent.length;
  const seed=[...ent].sort((x,z)=>amLvOf(z)-amLvOf(x)||(x<z?-1:1)); const top=seed.slice(0,byes), rest=seed.slice(byes).sort(()=>rnd0()-.5);
  const pairs=[]; for(const n of top)pairs.push([n,null]); for(let i=0;i<rest.length;i+=2)pairs.push([rest[i],rest[i+1]??null]); pairs.sort(()=>rnd0()-.5);
  const nR=Math.round(Math.log2(P2)), days=[]; for(let k=0;k<nR;k++)days.push(a+Math.round(k*(b-a)/Math.max(1,nR-1)));
  T=S.tour[t.k]={k:t.k,n:t.n,cur:pairs.flat(),rd:[],days,ch:null,ru:null,n0:ent.length}; return T; }
/* 그날 대회 한 라운드가 끝나면 다음 라운드 대진을 만든다. 부전승은 그대로 올라간다 */
function amTourAdvance(S,t,res){ const T=S.tour[t.k]; if(!T||T.ch)return; const k=T.days.indexOf(S.last); if(k<0||k!==T.rd.length)return;
  const B=T.cur, nx=[], row=[]; for(let i=0;i<B.length;i+=2){ const h=B[i], a=B[i+1]; if(!h||!a){ nx.push(h||a); row.push([h||a,null]); continue; } const g=res.find(x=>x.t===t.k&&x.i===i); if(!g){ nx.push(h); continue; } nx.push(g.w); row.push([h,a,g.hs,g.as,g.inn]); }
  T.rd.push(row); T.cur=nx; if(nx.length===1){ T.ch=nx[0]; const f=row.find(x=>x[1]); T.ru=f?(f[0]===T.ch?f[1]:f[0]):null; amTourNews(S,T); } }
/* ---------- 투수 휴식(규정) ---------- */
function amCanPitch(S,u,d){ const x=S.rest[u.id]; if(!x)return true; if(d<x[0])return false; if(x[1]===d-1&&x[2]>=2)return false; return true; }
function amRestSet(S,u,d,pc){ const x=S.rest[u.id]; const st=x&&x[1]===d-1?x[2]+1:1; let rd=0; for(const [n,k] of AM_REST)if(pc>=n){ rd=k; break; } S.rest[u.id]=[d+1+rd,d,st]; }
/* ---------- 한 경기 ---------- */
function amSide(S,sch,d,ko,R0){ const T=R0[sch]; const lvl=T.lvl; const ok=u=>!(u.out&&d<u.out);
  const bk=u=>u.bv+(u.kind==='f'?0:6), pk=u=>u.sv+(u.kind==='f'?0:4); /* 드래프트 관심권 선수는 학교에서도 주전·주축 투수다 */
  const B=T.B.filter(ok).sort((a,b)=>bk(b)-bk(a)).slice(0,9); const ord=B.slice().sort((a,b)=>b.ov-a.ov); const lineup=[ord[1],ord[0],ord[2],ord[3],ord[4],ord[5],ord[6],ord[7],ord[8]].filter(Boolean);
  const dv=B.reduce((a,u)=>a+u.E.def,0)/Math.max(1,B.length); const P=T.P.filter(u=>ok(u)&&amCanPitch(S,u,d)).sort((a,b)=>pk(b)-pk(a));
  return {sch,lvl,lineup,idx:0,dv,P,cur:null,pc:0,used:[],ko,sty:lvl==='hs'?amSty(sch):null,runs:0,line:[]}; }
function amPitchIn(s,start){ const p=s.P.find(u=>!s.used.includes(u)); let u=p; if(!u){ u={id:'x'+s.sch,kind:'x',sch:s.sch,isP:true,E:{stf:35,ctl:35,sta:40},q:amPitQ({id:'x',r:{stf:35,ctl:35,sta:40}}),sv:35,lim:AM_LIM,ft:40}; } s.used.push(u); s.cur=u; s.pc=0; s.runAll=0;
  const strict=s.sty==='엄격형'; s.lim=Math.min(AM_LIM,start?(s.ko||strict?u.lim+8:u.lim):Math.round(30+u.E.sta*.35)+(s.ko?10:0)); return u; }
function amBoxB(M,u){ let b=M.get(u.id); if(!b){ b={u,pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,hbp:0,so:0,r:0,rbi:0,sb:0,cs:0}; M.set(u.id,b); } return b; }
function amBoxP(M,u){ let b=M.get(u.id); if(!b){ b={u,gs:0,outs:0,bf:0,h:0,hr:0,bb:0,hbp:0,so:0,r:0,er:0,np:0,w:0,l:0}; M.set(u.id,b); } return b; }
function amGame(S,g,d,R0){ const rnd0=seededRand('amg:'+S.y+':'+d+':'+g.h+':'+g.a), ko=!!g.t; const env=S.env;
  const H=amSide(S,g.h,d,ko,R0), A=amSide(S,g.a,d,ko,R0); if(H.lineup.length<9||A.lineup.length<9)return null;
  const M=new Map(); for(const s of [H,A]){ const u=amPitchIn(s,true); amBoxP(M,u).gs=1; }
  const sc={h:0,a:0}; let inn=0; const rec={w:{},l:{}}; const LG=LGP, LV=AMC[g.lvl]||AMC.hs;
  const half=(bat,fld,k,tb)=>{ let outs=0; const bs=[null,null,null]; let runs=0;
    if(tb){ const n=bat.lineup.length; bs[0]={u:bat.lineup[(bat.idx+n-1)%n],p:fld.cur,e:0}; bs[1]={u:bat.lineup[(bat.idx+n-2)%n],p:fld.cur,e:0}; } /* 승부치기: 무사 1·2루 */
    const score=(rn,bx,rbi)=>{ runs++; amBoxB(M,rn.u).r++; const pb=amBoxP(M,rn.p); pb.r++; if(rn.e)pb.er++; if(rbi&&bx)bx.rbi++; fld.runAll++; const was=sc[k]<=sc[k==='h'?'a':'h']; sc[k]++; const lead=sc[k]>sc[k==='h'?'a':'h']; if(was&&lead){ rec.w[k]=bat.cur; rec.l[k==='h'?'a':'h']=fld.cur; } };
    while(outs<3){ if(k==='h'&&inn>=9&&sc.h>sc.a)break; /* 끝내기 */
      if(fld.pc>=fld.lim||fld.runAll>=7&&fld.used.length<4)amPitchIn(fld,false);
      const p=fld.cur, pq=p.q, pb=amBoxP(M,p);
      if(bs[0]&&!bs[1]&&outs<2){ const sp=bs[0].u.E.spd; if(rnd0()<clamp((sp-55)*.004,0,.16)){ const bx=amBoxB(M,bs[0].u); if(rnd0()<clamp(.55+(sp-50)*.006,.4,.88)){ bx.sb++; bs[1]=bs[0]; bs[0]=null; } else { bx.cs++; bs[0]=null; outs++; pb.outs++; continue; } } }
      const b=bat.lineup[bat.idx%bat.lineup.length]; bat.idx++; const q=b.q, bx=amBoxB(M,b); bx.pa++; pb.bf++;
      const f=Math.max(0,fld.pc-p.ft)/60;
      const bb=comb(q.bb,pq.bb*(1+.5*f),LG.bb)*env.bb*LV.bbm, kk=comb(q.k,pq.k*(1-.35*f),LG.k)*env.k, hr=comb(q.hr,pq.hr*(1+.5*f),LG.hr)*env.hr, bab=comb(q.babip,pq.babip+.02*f,LG.babip)+env.bab+LV.bab-(fld.dv-50)*.0008;
      const hbp=.011; const x=rnd0(); let o; const pitch=n=>{ const v=Math.max(1,Math.min(9,Math.round(n+(50-p.E.ctl)*.015+(rnd0()-.5)*2))); fld.pc+=v; pb.np+=v; };
      if(x<hbp){ o='hbp'; pitch(3); bx.hbp++; pb.hbp++; }
      else if(x<hbp+bb){ o='bb'; pitch(5.6); bx.bb++; pb.bb++; }
      else if(x<hbp+bb+kk){ pitch(4.8); bx.ab++; bx.so++; pb.so++; pb.outs++; outs++; continue; }
      else if(x<hbp+bb+kk+hr){ pitch(3.3); bx.ab++; bx.h++; bx.hr++; pb.h++; pb.hr++; for(let i=2;i>=0;i--)if(bs[i]){ score(bs[i],bx,1); bs[i]=null; } score({u:b,p,e:1},bx,1); continue; }
      else { pitch(3.3); bx.ab++;
        if(rnd0()<bab){ bx.h++; pb.h++; const y2=rnd0(); const t=y2<q.d3?3:y2<q.d3+q.d2*pq.x2?2:1; if(t===3)bx.tr++; else if(t===2)bx.d++;
          const me={u:b,p,e:1};
          if(t===3){ for(let i=2;i>=0;i--)if(bs[i]){ score(bs[i],bx,1); bs[i]=null; } bs[2]=me; }
          else if(t===2){ if(bs[2]){ score(bs[2],bx,1); bs[2]=null; } if(bs[1]){ score(bs[1],bx,1); bs[1]=null; } if(bs[0]){ if(rnd0()<.45)score(bs[0],bx,1); else bs[2]=bs[0]; bs[0]=null; } bs[1]=me; }
          else { if(bs[2]){ score(bs[2],bx,1); bs[2]=null; } if(bs[1]){ if(rnd0()<.6)score(bs[1],bx,1); else bs[2]=bs[1]; bs[1]=null; } if(bs[0]){ if(!bs[2]&&rnd0()<.28)bs[2]=bs[0]; else bs[1]=bs[0]; bs[0]=null; } bs[0]=me; }
          continue; }
        const err=clamp(.045-(fld.dv-50)*.0007,.012,.08); if(rnd0()<err){ if(bs[2]){ score(bs[2],bx,0); bs[2]=null; } if(bs[1]){ bs[2]=bs[1]; bs[1]=null; } if(bs[0]){ bs[1]=bs[0]; } bs[0]={u:b,p,e:0}; continue; }
        if(bs[0]&&outs<2&&rnd0()<.12){ bs[0]=null; outs+=2; pb.outs+=2; if(outs<3&&bs[2]&&rnd0()<.5){ score(bs[2],null,0); bs[2]=null; } continue; }
        outs++; pb.outs++; if(outs<3){ if(bs[2]&&rnd0()<.3){ score(bs[2],bx,1); bs[2]=null; } if(bs[1]&&!bs[2]&&rnd0()<.3){ bs[2]=bs[1]; bs[1]=null; } }
        continue; }
      /* 볼넷·몸에 맞는 공: 밀어내기 */
      const me={u:b,p,e:1}; if(bs[0]){ if(bs[1]){ if(bs[2])score(bs[2],bx,1); bs[2]=bs[1]; } bs[1]=bs[0]; } bs[0]=me; }
    bat.line.push(runs); return runs; };
  const maxI=ko?20:12;
  for(inn=1;inn<=maxI;inn++){ half(A,H,'a',inn>=10);
    if(inn>=9&&sc.h>sc.a){ H.line.push('X'); break; }
    half(H,A,'h',inn>=10);
    const df=Math.abs(sc.h-sc.a); if(inn>=5&&df>=10||inn>=7&&df>=7)break; /* 콜드게임 */
    if(inn>=9&&sc.h!==sc.a)break; }
  inn=Math.min(inn,maxI); let w=null; if(sc.h!==sc.a)w=sc.h>sc.a?'h':'a'; else if(ko)w='h'; /* 20회까지 비기면 추첨(홈) */
  if(w){ const lk=w==='h'?'a':'h'; const wp=rec.w[w]||(w==='h'?H:A).used[0], lp=rec.l[lk]||(lk==='h'?H:A).used[0]; amBoxP(M,wp).w=1; amBoxP(M,lp).l=1; }
  for(const s of [H,A])for(const u of s.used)amRestSet(S,u,d,amBoxP(M,u).np);
  return {h:g.h,a:g.a,hs:sc.h,as:sc.a,inn,w:w?(w==='h'?g.h:g.a):null,M,line:{h:H.line,a:A.line},H,A}; }
/* ---------- 기록 반영 ---------- */
function amRowOf(u,y){ const s=u.src; if(u.kind==='e'){ let r=s.y.find(x=>x[0]===y); if(!r){ r=[y,amGrade(s,y)].concat(new Array(s.P?AM_PK.length:AM_BK.length).fill(0)); s.y.push(r); } return {a:r}; }
  if(u.kind==='p'&&s.amSim){ s.amY=s.amY||[]; let r=s.amY.find(x=>x.y===y); if(!r){ r={y,gr:s.college?4:3}; for(const k of s.isP?AM_PK:AM_BK)r[k]=0; s.amY.push(r); } return {o:r}; } return null; }
function amAdd(u,y,b,isP){ const R0=amRowOf(u,y); if(!R0)return; const K=isP?AM_PK:AM_BK;
  if(R0.a){ for(let i=1;i<K.length;i++)R0.a[2+i]+=b[K[i]]||0; R0.a[2]+=1; } else { for(let i=1;i<K.length;i++)R0.o[K[i]]+=b[K[i]]||0; R0.o.g+=1; amTotFix(u.src); } }
function amTotFix(p){ const K=p.isP?AM_PK:AM_BK, t={}; for(const k of K)t[k]=0; for(const r of p.amY||[])for(const k of K)t[k]+=r[k]||0; p.am=t; }
function amRecord(S,g,d,meta){ const y=S.y, live=S.live;
  for(const b of g.M.values()){ const u=b.u; if(u.kind==='f')amFillAdd(S,u,b); else if(u.kind!=='x')amAdd(u,y,b,u.isP);
    const T=S.tot[meta.lvl]; if(u.isP){ T.outs+=b.outs; T.er+=b.er; T.r+=b.r; } else { T.pa+=b.pa; T.ab+=b.ab; T.h+=b.h; T.hr+=b.hr; T.bb+=b.bb; T.so+=b.so; } }
  S.tot[meta.lvl].g++;
  if(meta.g){ const G0=S.rec[meta.g]; if(G0){ const a=G0[g.h], b=G0[g.a]; if(a&&b){ if(g.hs>g.as){ a[0]++; b[1]++; } else if(g.as>g.hs){ b[0]++; a[1]++; } else { a[2]++; b[2]++; } a[3]+=g.hs; a[4]+=g.as; b[3]+=g.as; b[4]+=g.hs; } } }
  if(live){ const tag=meta.g?0:meta.t; for(const [n,o,rs,ra] of [[g.h,g.a,g.hs,g.as],[g.a,g.h,g.as,g.hs]]){ const L=S.res[n]||(S.res[n]=[]); L.push([d,o,rs,ra,tag,g.inn]); if(L.length>12)L.shift(); }
    for(const b of g.M.values()){ const u=b.u; if(u.kind!=='p'&&u.kind!=='e')continue; _amToday.L.push({id:u.id,kind:u.kind,sch:u.sch,b:amBoxTxt(b,u.isP)}); }
    try{ amGameNews(S,g,d,meta); }catch(e){} }
  if(AM_TRACE)AM_TRACE.push({y,d,h:g.h,a:g.a,hs:g.hs,as:g.as,inn:g.inn,line:g.line,box:[...g.M.values()].map(b=>Object.assign({id:b.u.id,kind:b.u.kind,isP:b.u.isP,sch:b.u.sch,gr:b.u.gr},b,{u:undefined}))}); }
function amBoxTxt(b,isP){ return isP?`${ipStr(b.outs)}이닝 ${b.r}실점 ${b.so}탈삼진 (${b.np}구)`:`${b.ab}타수 ${b.h}안타${b.hr?` ${b.hr}홈런`:''}${b.rbi?` ${b.rbi}타점`:''}${b.bb?` ${b.bb}볼넷`:''}`; }
/* 하루 경기(시즌 상태 S). 진행 중 시즌이면 대회 다음 라운드 대진까지 */
function amPlayDay(S,d){ if(d<=S.last||d<S.from)return 0; S.last=d; const L=amDayGames(S,d); if(!L.length)return 0; const R0=amRosters(S.y); const res=[];
  for(const m of L){ const g=amGame(S,m,d,R0); if(!g)continue; amRecord(S,g,d,m); res.push(Object.assign({t:m.t,i:m.i},{w:g.w,hs:g.hs,as:g.as,inn:g.inn})); }
  for(const t of AM_TOURS().concat([AM_COLT]))amTourAdvance(S,t,res); return res.length; }
/* 지난 시즌을 처음부터 끝까지(처음 세계 만들 때) */
function amSimYear(y,quiet){ const S=amNewSeason(y,false); const a=dnum(y,3,1), b=dnum(y,8,31); _amRos=null; for(let d=a;d<=b;d++)amPlayDay(S,d); if(!quiet)amHistPush(S); _amRos=null; return S; }
/* 매일(07_daily): 3~8월 경기, 9월 1일 시즌 정리, 월요일마다 아마 성적 표준점수 갱신 */
function amDaily(day){ if(!amOn()||!G.amU)return; const o=dobj(day); if(_amToday.d!==day)_amToday={d:day,L:[]};
  if(o.m>=3&&o.m<=8){ const S=amLive(); try{ amPlayDay(S,day); }catch(e){ console.error(e); } if(o.w===1||o.d===1)try{ amZSet((G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&(p.prospect||p.amV))); }catch(e){} if(o.d===1&&o.m>=4)try{ pressRank(G.draftClass||[]); }catch(e){}
    try{ amWatchDaily(day); }catch(e){} if(o.d===1)try{ amMonthNews(o); }catch(e){} try{ amAiFollow(o); }catch(e){} }
  if(o.m===9&&o.d===1&&G.amL&&G.amL.y===o.y&&!G.amL.done)try{ amSeasonEnd(G.amL); }catch(e){ console.error(e); }
  if(o.m===10&&o.d===1)for(const p of Object.values(G.players))if(!p.prospect&&(p.amR||p.amObs||p.amSl)){ delete p.amR; delete p.amObs; delete p.amSl; } } /* 지명 뒤에는 아마 경기 능력·관찰 횟수가 필요 없다(저장 크기) */
/* ---------- 시즌 정리·환경 요약 ---------- */
function amEnvSum(T){ return {avg:T.ab?+(T.h/T.ab).toFixed(3):0,era:T.outs?+(T.er*27/T.outs).toFixed(2):0,hr:T.pa?+(T.hr/T.pa*100).toFixed(2):0,k:T.pa?+(T.so/T.pa*100).toFixed(1):0,bb:T.pa?+(T.bb/T.pa*100).toFixed(1):0,rg:T.g?+(T.r/T.g/2).toFixed(2):0,g:T.g}; }
function amHistPush(S){ const H=G.amH=G.amH||[]; const i=H.findIndex(x=>x.y===S.y); const ch={}; for(const k in S.tour)if(S.tour[k].ch)ch[k]=[S.tour[k].ch,S.tour[k].ru];
  const lg={}; for(const g in S.rec){ const st=amStand(S,g); if(st[0])lg[g]=st[0].n; }
  const row={y:S.y,hs:amEnvSum(S.tot.hs),col:amEnvSum(S.tot.col),ch,lg,env:S.env}; if(i>=0)H[i]=row; else H.push(row); H.sort((a,b)=>a.y-b.y); if(H.length>30)H.shift(); return row; }
/* 투고타저·타고투저: 지난 시즌들 평균과 견준다(기록이 없으면 평년) */
function amEnvWord(y,lvl){ const H=(G.amH||[]), L=G.amL&&G.amL.y===y?G.amL:null; const cur=L&&!L.done?{y,hs:amEnvSum(L.tot.hs),col:amEnvSum(L.tot.col)}:H.find(x=>x.y===y); if(!cur)return null; /* 진행 중 시즌은 지금까지 경기로 */ const P=H.filter(x=>x.y<y&&x.y>=y-6&&x[lvl].g>50&&!x.boot); const c=cur[lvl]; if(!P.length||c.g<50)return {w:'평년',c};
  const m=k=>P.reduce((a,x)=>a+x[lvl][k],0)/P.length; const dA=c.avg-m('avg'), dE=c.era-m('era'), dH=c.hr-m('hr'); const s=dA/.012+dE/.35+dH/.25;
  return {w:s>=2.2?'타고투저':s<=-2.2?'투고타저':s>=1?'타격이 조금 셈':s<=-1?'투수가 조금 셈':'평년',c,m:{avg:m('avg'),era:m('era'),hr:m('hr')}}; }
function amSeasonEnd(S){ if(S.done)return; S.done=1; amHistPush(S); S.rest={}; _amRos=null;
  try{ const L=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&(p.prospect||p.amV)); amZSet(L); pressRank(G.draftClass||[]); }catch(e){}
  try{ const w=amEnvWord(S.y,'hs'); if(w&&!G.unemp){ const c=w.c; const top=amLeaders(S.y,'hs',false,'avg',1)[0], tp=amLeaders(S.y,'hs',true,'era',1)[0];
      wire('아마',`${S.y} 고교야구 결산: ${w.w==='평년'?'예년 수준':w.w} · 타율 ${fmt3(c.avg)} · 평균자책점 ${c.era.toFixed(2)}${top?` · 타율 1위 ${top.n}(${top.sch}) ${fmt3(top.v)}`:''}${tp?` · 평균자책점 1위 ${tp.n} ${tp.v.toFixed(2)}`:''}`);
      const n4=amLeaders(S.y,'hs',false,'avg',99).filter(x=>x.v>=.4).length, n0=amLeaders(S.y,'hs',true,'era',99).filter(x=>x.v<1).length; if(n4||n0)wire('아마',`${S.y} 고교야구 규정 타석 4할 타자 ${n4}명 · 규정 이닝 0점대 투수 ${n0}명`); } }catch(e){} }
/* 학교 전력 변화: 성적·우승·감독(명성·육성형)·평균 회귀. 강팀·떠오르는 팀·내려가는 팀이 생긴다 */
function amLvDrift(S){ const W={}; const add=(n,w,l)=>{ const o=W[n]||(W[n]=[0,0]); o[0]+=w; o[1]+=l; };
  for(const g in S.rec)for(const n in S.rec[g]){ const r=S.rec[g][n]; add(n,r[0],r[1]); }
  for(const k in S.tour){ const T=S.tour[k]; for(const row of T.rd)for(const x of row){ if(x[1]==null)continue; const hw=x[2]>x[3]||x[2]===x[3]; add(x[0],hw?1:0,hw?0:1); add(x[1],hw?0:1,hw?1:0); } }
  const ch={}; for(const k in S.tour){ const T=S.tour[k]; if(T.ch)ch[T.ch]=(ch[T.ch]||0)+2; if(T.ru)ch[T.ru]=(ch[T.ru]||0)+1; }
  const one=(o,n)=>{ const w=W[n]; const wp=w&&w[0]+w[1]?w[0]/(w[0]+w[1]):.5; const S0=(G.schools||{})[n]; const c=S0&&S0.coach;
    const d=(wp-.5)*5+(ch[n]||0)*.5+(c?(c.rep-50)*.02+(c.sty==='육성형'?.3:0):0)+(55-o.lv)*.1+N(0,1.5); o.lv=Math.round(clamp(o.lv+d,25,88)); /* 평균 회귀를 둬서 한 학교가 끝없이 강해지지 않는다(측정 11-15: 회귀가 약하면 전력 90 학교가 해마다 대회 대부분을 우승) */ (o.lh=o.lh||[]).push([S.y,o.lv]); if(o.lh.length>12)o.lh.shift(); };
  for(const a of AREA)for(const n of a.hs){ const o=amHsObj(n); if(o)one(o,n); } for(const n in amCols())one(amCols()[n],n); }
/* 지난 시즌 화면용 요약(순위표·대진은 남기고 최근 결과·휴식은 버린다) */
function amLiteRes(S){ if(!S)return null; return {y:S.y,rec:S.rec,rec2:S.rec2,tour:S.tour,env:S.env,fr:S.fr}; }
/* ---------- 순위·기록 순위 ---------- */
function amStand(S,g){ const R0=S.rec[g]||{}; return Object.entries(R0).map(([n,r])=>({n,w:r[0],l:r[1],d:r[2],rs:r[3],ra:r[4],p:r[0]+r[1]?r[0]/(r[0]+r[1]):0})).sort((a,b)=>b.p-a.p||(b.rs-b.ra)-(a.rs-a.ra)||(a.n<b.n?-1:1)); }
function amStandAll(S,col){ const L=[]; for(const g in S.rec){ if(g.startsWith('U-')!==!!col)continue; L.push(...amStand(S,g)); } return L.sort((a,b)=>b.p-a.p||(b.w-a.w)||(b.rs-b.ra)-(a.rs-a.ra)||(a.n<b.n?-1:1)); }
/* 그해 선수 기록 행(저학년·후보 공통): {id,n,sch,gr,isP,row(object),kind} */
function amYearRows(y,lvl){ const out=[]; for(const e of Object.values(amPipe().L)){ if(lvl&&(e.c?'col':'hs')!==lvl)continue; const r=e.y.find(x=>x[0]===y); if(r)out.push({id:e.id,n:e.n,sch:e.s,gr:r[1],isP:!!e.P,kind:'e',row:amRowObj(e,r),e}); }
  for(const p of Object.values(G.players)){ if(!p.amY||p.ovsRet)continue; if(lvl&&(p.college?'col':'hs')!==lvl)continue; const r=p.amY.find(x=>x.y===y&&!x.syn); if(r&&(p.amSim||r.y!=null))out.push({id:p.id,n:p.name,sch:p.school,gr:r.gr,isP:!!p.isP,kind:'p',row:r,p}); }
  return out; }
function amRowObj(e,r){ const K=e.P?AM_PK:AM_BK, o={y:r[0],gr:r[1]}; K.forEach((k,i)=>o[k]=r[2+i]); return o; }
/* 규정 타석·이닝: 그해 팀당 평균 경기 수 기준(타석 2.5배, 이닝 0.8배) */
function amTeamG(y,lvl){ const S=G.amL&&G.amL.y===y?G.amL:null; const T=S?S.tot[lvl]:((G.amH||[]).find(h=>h.y===y)||{})[lvl]; const n=lvl==='hs'?AREA.reduce((a,x)=>a+x.hs.length,0):AREA.reduce((a,x)=>a+x.un.length,0); return T&&T.g?T.g*2/n:20; }
function amLeaders(y,lvl,isP,k,n,gr){ const L=amYearRows(y,lvl).filter(x=>x.isP===isP&&(gr==null||x.gr===gr)); const tg=amTeamG(y,lvl), qPA=Math.max(10,tg*2.5), qO=Math.max(9,tg*2.4);
  const val=x=>{ const h=x.row; if(isP){ if(k==='era')return h.outs>=qO?h.er*27/h.outs:null; if(k==='so')return h.so; if(k==='w')return h.w; return null; }
    if(k==='avg')return h.pa>=qPA&&h.ab?h.h/h.ab:null; if(k==='ops')return h.pa>=qPA?bRate(h).ops:null; if(k==='hr')return h.hr; if(k==='sb')return h.sb; return null; };
  const asc=isP&&k==='era'; return L.map(x=>Object.assign({v:val(x)},x)).filter(x=>x.v!=null&&(asc||x.v>0)).sort((a,b)=>asc?a.v-b.v:b.v-a.v).slice(0,n||10); }
/* ---------- 드래프트 후보로(졸업 학년 1월 1일) ---------- */
function amMat(e){ const ageS=e.c?22:18; const p=newPlayer({age:ageS,base:clamp(amOvr(!!e.P,e.r),20,60),pot:e.pot,college:!!e.c,isP:!!e.P,pos:e.pos,name:e.n});
  delete G.players[p.id]; p.id=e.id; G.players[p.id]=p; p.th=e.t; p.bt=e.b; p.velo=e.v; p.inj=e.inj;
  for(const k in e.r)p.r[k]=clamp(e.r[k],20,80); roundR(p); p.pot=clamp(Math.max(ovr(p),e.pot),20,80); p.prospect=true; p.school=e.s; p.area=e.a; p.region=(areaDef(e.a)||{}).reg||p.region; p.ht=e.ht; p.wt=e.wt;
  if(R()<AM_SL_P)p.amSl=R()<.5?'inj':'form'; /* 졸업 학년 부진(가벼운 부상·컨디션): 그해 아마 경기에서만 조금 못 하고, 능력·잠재력은 그대로. 어느 구단도 직접 보지 못한다 */
  if(e.hidT)p.hidT=e.hidT; if(e.ai){ p.amInj=e.ai; if(e.ig===e.gy)p.amIg=e.gy; } if(e.ty)p.amTy=e.ty; if(e.amObs)p.amObs=e.amObs; if(e.fw)p.amFw=e.fw;
  p.amR={}; for(const k in e.r)p.amR[k]=e.r[k]; p.amY=e.y.map(r=>amRowObj(e,r)).sort((a,b)=>a.y-b.y); for(const r of p.amY){ if(e.ig===r.y)r.inj=1; } amTotFix(p); p.amV=3; p.amSim=1;
  delete p.delivery; if(p.isP)p.delivery=pitchDelivery(p); p.schoolHue=Math.floor(u01('sh',p.school)*360); p.amLevel=''; return p; }
/* 지명 준비가 끝난(완성형 등) 뒤: 1군 능력이 바뀐 항목은 아마 능력도 맞춘다(바닥 20 아래는 아마 능력 그대로) */
function amSyncR(p){ if(!p.amR)return; for(const k in p.r){ if(k==='vit'||p.amR[k]==null)continue; if(p.r[k]>20.05)p.amR[k]=p.r[k]; else p.amR[k]=Math.min(20,p.amR[k]); } }
function amSeniors(Y){ if(!amOn())return []; const U=amPipe(); if(U.yr==null)amBoot(Y); else amYearStart(Y);
  let L=Object.values(U.L).filter(e=>e.gy===Y);
  if(!L.length){ /* 같은 해에 다시 부르면(예전 저장·점검): 이 학년만 3~4년 전부터 경기를 돌려 만든다 */ const keep=U.L, yr0=U.yr; U.L={};
    try{ for(let y=Y-3;y<Y;y++){ if(y>Y-3)amGrowAll(); if(y===Y-3)amGenCohort(Y,true,AM_NC()); if(y===Y-2)amGenCohort(Y,false,AM_NH()); amSimYear(y,true); } amGrowAll(); L=Object.values(U.L); } finally { U.L=keep; U.yr=yr0; } }
  const out=L.map(amMat); for(const e of L)delete U.L[e.id]; _amRos=null; try{ amFollowCarry(out); }catch(e){ console.error(e); } return out; }
/* 관심 선수 이어 가기: 1·2학년 때 관심 선수로 둔 선수는 졸업 학년(드래프트 후보)이 되면 드래프트 관심 목록(G.shortlist)에 저절로 들어간다(이미 있으면 그대로).
   졸업·지명으로 사라진 번호는 관심 목록에서 지운다(모든 구단 같은 규칙) */
function amFollowCarry(sen){ const live=new Set([...Object.keys(amPipe().L).map(Number),...sen.map(p=>p.id)]);
  for(const tid in (G.amFw||{})){ const F=G.amFw[tid]; for(let i=F.length-1;i>=0;i--){ const id=F[i]; if(typeof id==='number'&&!live.has(id))F.splice(i,1); } }
  if(G.user==null||G.unemp)return; const F=amFollowL(G.user), SL=G.shortlist=G.shortlist||[]; for(const p of sen)if(F.includes(p.id)&&!SL.includes(p.id))SL.push(p.id); }
/* ---------- 관찰: 경기장에서 본 선수(구단 공통 규칙) ---------- */
/* 구단이 아마추어 스카우트를 둔 지역(우리: 스카우트 배치, 다른 구단: 리그 스태프 명단. 없으면 연고 지역) */
function amClubRegs(tid){ const L=(tid===G.user?G.scouts:(G.lgStaff&&G.lgStaff[tid]&&G.lgStaff[tid].sc))||[]; const R1=[...new Set(L.filter(s=>(s.role||'am')==='am'&&s.region).map(s=>s.region))]; if(R1.length)return R1; const t=team(tid); return t&&t.region&&REG.includes(t.region)?[t.region]:[]; }
const amFollowL=tid=>{ G.amFw=G.amFw||{}; return G.amFw[tid]=G.amFw[tid]||[]; };
function amFollowing(tid,id){ return amFollowL(tid).includes(id); }
const AM_FW_MAX=80; /* 1~3학년을 미리 담아 두는 만큼 넉넉히(AI 구단도 같은 상한) */
function amFollow(id,on,tid){ tid=tid??G.user; const L=amFollowL(tid), i=L.indexOf(id); if(on===false||on==null&&i>=0){ if(i>=0)L.splice(i,1); return false; } if(i<0){ L.push(id); if(L.length>AM_FW_MAX)L.shift(); }
  const p=typeof id==='number'?G.players[id]:null; if(tid===G.user&&p&&p.prospect&&p.team==null){ const SL=G.shortlist=G.shortlist||[]; if(!SL.includes(id))SL.push(id); } /* 올해 후보는 드래프트 관심 목록에도 바로 */
  return true; }
/* 경기가 열린 날: 스카우트를 둔 지역의 경기에 나온 선수, 관심 선수·관심 학교 선수는 그 구단의 관찰 횟수가 쌓인다(평가 오차 감소, 최대 15%) */
function amWatchDaily(d){ if(_amToday.d!==d||!_amToday.L.length)return; const regOf=n=>{ const a=AREA.find(x=>x.hs.includes(n)||x.un.includes(n)); return a?a.reg:null; };
  for(const t of G.teams){ const tid=t.id; if(tid===G.user&&G.unemp)continue; const regs=amClubRegs(tid), F=new Set(amFollowL(tid)); const seen=new Set();
    for(const x of _amToday.L){ if(seen.has(x.id))continue; const fol=F.has(x.id)||F.has('s:'+x.sch); const here=regs.includes(regOf(x.sch)); if(!fol&&!(here&&u01('amw'+d+':'+tid,x.id)<.25))continue; seen.add(x.id);
      const s=x.kind==='e'?amPipe().L[x.id]:G.players[x.id]; if(!s)continue; s.amObs=s.amObs||{}; s.amObs[tid]=Math.min(12,(s.amObs[tid]||0)+(fol?1:.5)); } } }
function amObsM(p,tid){ const o=p&&p.amObs; const n=o?o[tid??G.user]||0:0; return 1-Math.min(.15,n*.0125); }
const amObsN=(p,tid)=>Math.round((p&&p.amObs&&p.amObs[tid??G.user])||0);
const amObsTxt=(p,tid)=>{ const n=amObsN(p,tid); return n?`관찰 ${n}회 · 평가 오차 ${Math.round((1-amObsM(p,tid))*100)}% 줄어듦`:'관찰 전'; };
/* ---------- 평가 등급(능력 수치 없이): 졸업 학년 후보와 같은 틀(스카우트 실력·권역 정보망·관찰 횟수)이고, 졸업까지 남은 해마다 오차가 30%씩 커진다.
   어느 구단이든 같은 식: 우리는 그 지역 아마추어 스카우트 실력, AI는 구단 스카우트 오차(scoutSd). 저학년은 숨은 재능을 보지 못한다 ---------- */
const AM_YR_SD=.3;
function amScSd(tid,a){ if(tid===G.user){ const reg=(areaDef(a)||{}).reg; const L=(G.scouts||[]).filter(s=>(s.role||'am')==='am'&&s.region===reg); return L.length?Math.min(...L.map(s=>SCOUT_SD[clamp(effSkill(s),0,5)])):SCOUT_SD[0]; } return (team(tid)||{}).scoutSd||6; }
function amEstU(e,tid,Y){ tid=tid??G.user; Y=Y??G.year; const left=Math.max(0,e.gy-Y);
  const sd=amScSd(tid,e.a)*(1.3-areaNet(tid,e.a)*.0055)*amObsM(e,tid)*(1+AM_YR_SD*left); return {v:e.pot-(e.hidT||0)+hn('amu'+tid+':'+Y,e.id)*sd,sd}; }
/* 졸업 학년 후보: 우리는 드래프트 보드와 같은 스카우트 보고서, AI는 지명 평가(aiDraftScore)와 같은 잠재력 추정 */
function amEstP(p,tid){ tid=tid??G.user; if(tid===G.user){ const rp=scoutReport(p); return {v:rp.ofp??(rp.cur+6),sd:rp.sd>=50?SCOUT_SD[0]:rp.sd}; }
  const sd=((team(tid)||{}).scoutSd||6)*netSdM(p,tid); return {v:p.pot-(p.hidT&&u01('aih'+tid,p.id)>=.2?p.hidT:0)+hn('ai'+tid+G.year,p.id)*sd,sd}; }
const AM_TIERS=[[60,'대형 재목'],[53,'상위 지명감'],[46,'지명권'],[40,'육성 후보'],[-99,'지켜볼 선수']];
const amTierOf=v=>AM_TIERS.find(t=>v>=t[0])[1];
function amTier(est){ return {t:amTierOf(est.v),lo:amTierOf(est.v-est.sd*.8),hi:amTierOf(est.v+est.sd*.8),w:est.sd>=9?'오차 큼':est.sd>=6?'오차 보통':'오차 작음'}; }
/* AI 구단 관심 선수: 4월·7월 1일, 스카우트 지역에서 공개 기록이 좋은 저학년·후보를 고른다(우리 화면의 추천과 같은 기준) */
function amAiFollow(o){ if(o.d!==1||(o.m!==4&&o.m!==7))return; const y=o.m===4?o.y-1:o.y; for(const t of G.teams){ if(t.id===G.user)continue; const regs=amClubRegs(t.id); const L=amSuggest(y,regs,8,t.id); const F=amFollowL(t.id); F.length=0; F.push(...L.map(x=>x.id));
    const home=teamArea(t.id), A0=areaDef(home); if(!A0||!G.schools)continue; const cnt=n=>Object.values(amPipe().L).filter(e=>e.s===n).length; const sch=[...A0.hs].sort((p,q)=>cnt(q)-cnt(p)||(p<q?-1:1))[0]; if(sch){ F.push('s:'+sch);
      const S=G.schools[sch]; if(o.m===4&&S&&!schGave(S,t.id)&&(t.cash||0)>50){ if(!S.gy||typeof S.gy!=='object')S.gy={}; S.gy[t.id]=G.year; t.cash-=10; schAdd(S,8,t.id); } } } } /* AI 구단도 연고 권역 학교 하나를 관심 학교로 두고 한 해 한 번 후원한다(우리와 같은 1천만 원·친분 +8) */
/* 공개 기록 기준 눈에 띄는 선수(지역 한정): 타자 OPS, 투수 평균자책점·탈삼진을 학년 안에서 견준다 */
function amSuggest(y,regs,n,tid){ const reg=x=>{ const a=AREA.find(z=>z.hs.includes(x.sch)||z.un.includes(x.sch)); return a?a.reg:null; };
  const L=amYearRows(y).filter(x=>!regs||regs.includes(reg(x))); const sc=x=>{ const h=x.row; if(x.isP){ if(h.outs<30)return -9; return (4.5-h.er*27/h.outs)*.6+(h.so*27/h.outs-7)*.25; } if(h.pa<35)return -9; return (bRate(h).ops-.8)*5; };
  let R0=L.map(x=>Object.assign({s:sc(x)+(x.gr<=2?.3:0)},x)).filter(x=>x.s>-9).sort((a,b)=>b.s-a.s);
  if(tid!=null){ /* 기록 상위 안에서 그 구단 스카우트 평가 등급을 더한다(우리 추천·AI 관심 선수 같은 식) */ R0=R0.slice(0,n*3).map(x=>{ const est=x.kind==='e'&&x.e?amEstU(x.e,tid):x.p&&x.p.prospect?amEstP(x.p,tid):null; return Object.assign(x,{s:x.s+(est?(est.v-46)*.05:0)}); }).sort((a,b)=>b.s-a.s); }
  return R0.slice(0,n); }
/* 단장 대회 관전: 그날 그 지역 학교가 치른 경기에서 본 선수(실제 경기 기록 한 줄) */
function amTripSeen(reg){ if(_amToday.d!==G.day)return null; const regOf=n=>{ const a=AREA.find(x=>x.hs.includes(n)); return a?a.reg:null; }; const L=_amToday.L.filter(x=>regOf(x.sch)===reg); return L.length?L:null; }
/* ---------- 학년별 흐름·3학년 부진(공개 기록만, 모든 구단이 같은 기록을 본다) ---------- */
const AM_SL_MIN={pa:40,outs:45}, AM_SL_OPS=.15, AM_SL_ERA=1.5, AM_SL_OBS=5;
/* 학년별 기록 행(저학년 G.amU·후보 공통): [{y,gr,...}] 학년 순 */
function amGrRows(x){ if(!x)return []; if(x.amY)return x.amY.filter(r=>!r.syn).slice().sort((a,b)=>a.gr-b.gr); return (x.y||[]).map(r=>amRowObj(x,r)).sort((a,b)=>a.gr-b.gr); }
/* 학년 한 줄 핵심 기록: 타자 OPS·타율, 투수 ERA·K/9. 표본이 적으면 null */
function amGrKey(isP,h){ if(!h)return null; if(isP)return h.outs>=30?{v:h.er*27/h.outs,k9:h.so*27/h.outs,n:h.outs}:null; return h.pa>=30?{v:bRate(h).ops,avg:h.ab?h.h/h.ab:0,n:h.pa}:null; }
/* 학년별 흐름: [{gr,k,d}] d=1 좋아짐, -1 나빠짐(타자 OPS .05, 투수 ERA .5 넘게 변할 때) */
function amTrend(x,isP){ const out=[]; let prev=null; for(const r of amGrRows(x)){ const k=amGrKey(isP,r); let d=0; if(k&&prev){ const dv=isP?prev.v-k.v:k.v-prev.v; d=dv>(isP?.5:.05)?1:dv<-(isP?.5:.05)?-1:0; } out.push({gr:r.gr,k,d}); if(k)prev=k; } return out; }
/* 3학년 부진: 졸업 학년 기록이 바로 전 학년보다 뚜렷이 나쁘다(타자 OPS .150 이상 하락, 투수 ERA 1.50 이상 상승, 두 해 모두 40타석·15이닝 이상) */
function amSlump(p){ if(!p||!p.prospect)return false; const L=amGrRows(p), sg=p.college?4:3; const a=L.find(r=>r.gr===sg-1), b=L.find(r=>r.gr===sg); if(!a||!b)return false;
  if(p.isP)return a.outs>=AM_SL_MIN.outs&&b.outs>=AM_SL_MIN.outs&&b.er*27/b.outs-a.er*27/a.outs>=AM_SL_ERA;
  return a.pa>=AM_SL_MIN.pa&&b.pa>=AM_SL_MIN.pa&&bRate(a).ops-bRate(b).ops>=AM_SL_OPS; }
/* 스카우트 귀띔: 그 선수를 충분히 본(관찰 5회 이상) 구단만, 실제 능력이 기록보다 뚜렷이 좋을 때 */
function amSlHint(p,tid){ tid=tid??G.user; if(!amSlump(p)||amObsN(p,tid)<AM_SL_OBS)return null; const A=(G.draftClass||[]).map(id=>G.players[id]).filter(q=>q&&q.prospect&&!!q.isP===!!p.isP&&!!q.college===!!p.college&&!q.ovsRet); const tv=q=>ovr(q)*.5+q.pot*.5; /* 실제 능력·잠재력(같은 학력·투타 안에서) */
  if(A.length<5)return null; const v=A.map(tv), m=v.reduce((a,b)=>a+b,0)/v.length, sd=Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/v.length)||1; if((tv(p)-m)/sd-(p.amZ??0)<.8)return null;
  return p.amSl==='inj'||p.amIg===G.year?'부상 여파로 보입니다':p.isP?'기록보다 공이 좋습니다':'기록보다 타구가 좋습니다'; }
/* ---------- 소식(빈도 상한) ---------- */
function amCap(S,k,n){ S.news[k]=(S.news[k]||0)+1; return S.news[k]<=n; }
const amSchName=n=>n;
function amTourNews(S,T){ if(!S.live)return; const nm=T.k==='ct'?T.n:T.n+' 고교야구'; const cnt=(G.amH||[]).filter(h=>h.ch&&h.ch[T.k]&&h.ch[T.k][0]===T.ch).length;
  wire('아마',`${T.ch}, ${nm} 우승${cnt?` (${cnt+1}번째)`:''} · 준우승 ${T.ru||'-'}`); }
function amGameNews(S,g,d,meta){ for(const k of ['H','A']){ const s=g[k], op=k==='H'?g.A:g.H; if(s.used.length!==1)continue; const u=s.used[0]; const b=g.M.get(u.id); if(!b||b.outs<21||u.kind==='f'||u.kind==='x')continue;
    if(b.h===0&&b.bb===0&&b.hbp===0&&b.bf<=b.outs&&amCap(S,'pg',2)){ wire('아마',`${u.src.n||u.src.name}(${s.sch} ${u.gr}학년), 퍼펙트게임 · ${op.sch}전 ${b.so}탈삼진`,{ref:u.kind==='p'?u.id:null}); }
    else if(b.h===0&&amCap(S,'nh',3)){ wire('아마',`${u.src.n||u.src.name}(${s.sch} ${u.gr}학년), 노히트노런 · ${op.sch}전`,{ref:u.kind==='p'?u.id:null}); } } }
/* 매달 1일: 고교 최대어 경쟁(언론 순위 1·2위), 6·8월에는 1학년 돌풍 */
function amMonthNews(o){ const S=G.amL; if(!S||!S.live||G.unemp)return; const y=o.y;
  if(o.m>=5&&o.m<=8&&amCap(S,'big',4)){ const L=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&p.press).sort((a,b)=>a.press-b.press).slice(0,2); if(L.length===2)wire('아마',`고교 최대어 경쟁: ${L[0].name}(${L[0].school}) · ${L[1].name}(${L[1].school}) — ${amShortLine(L[0])} / ${amShortLine(L[1])}`,{ref:L[0].id}); }
  if((o.m===6||o.m===8)&&amCap(S,'fr',2)){ const b=amLeaders(y,'hs',false,'ops',1,1)[0], p=amLeaders(y,'hs',true,'era',1,1)[0]; const x=b&&b.v>=1.0?b:p&&p.v<1.5?p:null; if(x)wire('아마',`1학년 돌풍: ${x.n}(${x.sch}) ${x.isP?`평균자책점 ${x.v.toFixed(2)}`:`OPS ${fmt3(x.v)}`}`); } }
function amShortLine(p){ const h=(p.amY||[]).find(r=>r.y===G.year); if(!h)return '기록 없음'; if(p.isP)return h.outs?`ERA ${(h.er*27/h.outs).toFixed(2)}`:'등판 없음'; return h.ab?`타율 ${fmt3(h.h/h.ab)}`:'출전 없음'; }
/* ---------- 예전 저장: 저학년 파이프라인을 만들고(지난 3년 경기 실제로), 올해 후보의 옛 기록은 그대로 둔다 ---------- */
function amLeagueMigrate(){ if(!G||!G.teams||!amOn())return; const U=amPipe(); if(U.yr!=null)return; amBoot(G.year,G.year+1);
  for(const id of G.draftClass||[]){ const p=G.players[id]; if(p&&p.amY&&!p.amSim)for(const r of p.amY)r.syn=1; } /* 시뮬레이션 전에 만든 기록(합성)임을 표시 */ }
