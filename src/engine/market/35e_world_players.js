/* ===== 세계 주목 선수 저장소(세계척도 P2 11-19) =====
   해외 리그(MLB·트리플A·NPB·CPBL·멕시코리그) 구단마다 '주목 선수' 3~6명을 가벼운 기록(G.wps)으로 둔다. 전체 약 450명, 저장 약 0.2~0.3MB.
   - G.players에 넣지 않는다(등급 경계·리그 수준 보정·이름 중복·속도에 영향이 없게). 상주 외국인 후보군(G.ovp)·아마추어 저학년(G.amU)과 같은 '가벼운 기록 + 필요할 때만 펼치기' 방식.
   - 능력은 내부 20~80(국내 기준 절대 척도) 하나다. 리그 주전 평균·폭은 LEAGUE_LV의 st·sd, 기록은 KBO와 같은 simBat/simPit에 해외 시즌 오프셋(ovsAdj)과 리그 환경 편차(lgEnv)를 넣는다.
   - 본게임 난수(R)·선수 번호(G.nextId)를 쓰지 않는다: 만들기·시즌 마감·새해는 모두 씨앗을 둔 난수(withRng(rngHash(...))), 번호는 따로(WPS.nid0부터 G.wps.nid).
   - 날마다 하는 일은 없다. 새해(ovlNewYear)에 나이·성장·올해 기록을 미리 만들고(시즌 중 화면은 치른 만큼만 ovsPart), 시즌 마감(09_stoveleague)에 확정·은퇴·이동·새 얼굴을 한 번에 처리한다.
   - 예전 저장: 불러올 때(migrateDraft) 판 번호(G.wps.v)가 없거나 낮으면 만든다. 씨앗 난수라 몇 번 불러도 같은 결과(멱등).
   - 전체 선수 객체가 필요하면(심층 보고서) wpsExpand가 withRng(rngHash(번호))로 펼친다. 같은 번호면 언제나 같은 사람이고, 저장·본게임 난수·번호 흐름을 바꾸지 않는다. */
const WPS={v:1,nid0:2000001,keep:4,evMax:40,cap:7,
  n:{MLB:[4,6],AAA:[3,5],NPB:[4,5],CPBL:[3,5],LMB:[3,4]}, /* 구단당 주목 선수 수 */
  star:{MLB:.8,AAA:.45,NPB:.7,CPBL:.6,LMB:.55}}; /* 구단마다 간판 선수가 있을 확률 */
const WPS_LGS=['MLB','AAA','NPB','CPBL','LMB'];
const WPS_LV={MLB:'MLB',AAA:'트리플A',NPB:'NPB',CPBL:'CPBL',LMB:'멕시코리그'}; /* 기록 수준(해외 시즌 줄의 lvl과 같은 말) */
/* 국적 분포(o: 출신 지역 열쇠, FN 이름표. mx는 중남미 이름에 멕시코 국적) */
const WPS_NAT={MLB:{us:58,la:22,ve:8,jp:7,au:2,tw:3},AAA:{us:62,la:26,ve:10,au:2},NPB:{jp:88,us:8,la:4},CPBL:{tw:86,us:8,la:6},LMB:{mx:66,us:20,ve:9,la:5}};
const WPS_REG={us:'us',la:'la',ve:'la',mx:'la',jp:'jp',tw:'tw',au:'au'}; /* 출신 → 해외 스카우트 지역(IREG) */
const wpsSt=lg=>(LEAGUE_LV[WPS_LV[lg]]||{st:50}).st, wpsSd=lg=>(LEAGUE_LV[WPS_LV[lg]]||{sd:5}).sd;
/* 저장 0인 값은 뺀다(ovpLineE). 화면·계산은 wpsH로 채워 읽는다 */
const wpsH=(l,isP)=>{ if(!l)return null; const {y,l:lv,...h}=l; h.lvl=lv; h.y=y; return ovpFill(h,isP); };
const wpsFr=e=>({id:e.i,isP:!!e.P,age:e.a,r:e.r,role:e.ro,pos:e.ps});
const wpsOvr=e=>ovr({isP:!!e.P,r:e.r});
function wpsGet(id){ const W=G&&G.wps; if(!W||!W.L)return null; const s=String(id); if(W._m&&W._m.L===W.L&&W._m.n===W.L.length)return W._m.M.get(s)||null;
  const M=new Map(W.L.map(e=>[String(e.i),e])); Object.defineProperty(W,'_m',{value:{L:W.L,n:W.L.length,M},enumerable:false,configurable:true,writable:true}); return M.get(s)||null; } /* 찾기표는 저장하지 않는다(enumerable:false) */
function wpsName(k,used){ const d=FN[k==='mx'?'la':k]||FN.us; let n=''; for(let i=0;i<8;i++){ n=d.rev?pick(d.l)+' '+pick(d.f):pick(d.f)+' '+pick(d.l); if(!used.has(n))break; } used.add(n); return n; }
/* 툴: 목표 종합 능력(o)에 맞춰 모든 툴을 같은 폭으로 옮긴다(setOvr과 같은 생각, 가벼운 판) */
function wpsRat(isP,pos,role,o){ const r={}; if(isP){ r.stf=N(o,6); r.ctl=N(o,6); r.sta=role==='SP'?N(56,5):N(38,5); }
  else { for(const k of ['con','pow','eye','spd','def'])r[k]=N(o,6); if(['SS','2B','CF'].includes(pos)){ r.def+=6; r.spd+=4; r.pow-=4; } else if(pos==='C'){ r.def+=8; r.spd-=6; } else { r.pow+=5; r.def-=3; r.spd-=2; } }
  for(let t=0;t<3;t++){ const d=o-ovr({isP,r}); for(const k in r)r[k]=clamp(r[k]+d,20,80); }
  for(const k in r)r[k]=Math.round(r[k]*10)/10; return r; }
/* 한 사람 만들기. t: s 간판 · r 주전 · v 노장 · p 유망주 · i 부상 뒤 반등을 노리는 선수 */
function wpsNew(lg,c,t,used){ const st=wpsSt(lg), sd=wpsSd(lg), nk=wpick(WPS_NAT[lg]);
  const age=t==='s'?ri(26,31):t==='v'?ri(33,37):t==='p'?ri(20,24):ri(24,32);
  let o=t==='s'?st+sd*(1.2+Math.abs(N(0,.7))):t==='v'?st+sd*N(.3,.8):t==='p'?st+sd*N(-.6,.6):st+sd*N(.5,.6); o=clamp(o,30,79);
  const isP=R()<.46, role=isP?(R()<.6?'SP':'RP'):null, pos=isP?null:wpick({C:.8,'1B':1.1,'2B':1,'3B':1,SS:1,LF:1,CF:1,RF:1.1});
  const W=G.wps, e={i:W.nid++,n:wpsName(nk,used),na:nk==='mx'?'멕시코':(FN[nk]||FN.us).nat,o:WPS_REG[nk]||'us',lg,c,t,P:isP?1:0,a:age,r:wpsRat(isP,pos,role,o),L:[]};
  if(isP)e.ro=role; else e.ps=pos; e.pt=Math.round((t==='p'?o+rnd(4,12):age<27?o+rnd(0,3):o)*10)/10; if(e.pt>80)e.pt=80;
  e.ct=wpsCt(e); if(t==='i'){ e.ij={y:W.y??G.year-1,d:ri(70,160),f:1}; } return e; }
/* 계약(남은 해·연봉 만 달러). 화면에는 스카우트 지식만큼만 보인다 */
function wpsCt(e){ const o=wpsOvr(e), lg=e.lg;
  if(lg==='MLB'){ const pre=e.a<=25; const amt=pre?ri(74,90):Math.round(clamp(100+(o-60)*230+N(0,120),74,3800)); return {y:pre?ri(1,4):e.a>=34?ri(1,2):ri(1,6),amt}; }
  if(lg==='AAA')return {y:1,amt:ri(8,30),mi:1}; /* 마이너 계약 */
  if(lg==='NPB')return {y:e.a>=33?1:ri(1,4),amt:Math.round(clamp((o-48)*32+N(0,25),30,900))};
  if(lg==='CPBL')return {y:ri(1,3),amt:Math.round(clamp((o-40)*5+N(0,6),6,90))};
  return {y:ri(1,2),amt:Math.round(clamp((o-40)*4+N(0,5),4,60))}; }
/* 한 시즌 기록: 그 리그 수준(ovsAdj)·리그 환경 편차(lgEnv)·자리(주전/백업)·부상으로 못 뛴 몫(av) */
const WPS_GF={MLB:1,AAA:.93,NPB:.88,CPBL:.75,LMB:.56}; /* 리그 경기 수 비(162·150·143·120·90경기) */
function wpsLine(e,y,av){ const lv=WPS_LV[e.lg], A=ovsAdj(lv), env=N(0,lgEnv(lv)??2), fr=wpsFr(e); if(av<1){ fr.r={}; for(const k in e.r)fr.r[k]=clamp(e.r[k]-2.5,20,80); } /* 다친 시즌은 덜 뛰고 뛸 때도 몸이 무겁다 */ const sp=fr.isP&&isSPr(fr), full=e.t==='s'||ovr(fr)>=wpsSt(e.lg)-wpsSd(e.lg)*.3;
  const n0=fr.isP?(sp?(full?ri(470,600):ri(250,420)):(full?ri(165,215):ri(100,165))):(full?ri(500,660):ri(240,450)); const n=Math.max(0,Math.round(n0*av*WPS_GF[e.lg]));
  const h=fr.isP?simPit(fr,n,A[1]+env*1.6):simBat(fr,n,A[0]+env); h.lvl=lv; h.g=n?(fr.isP?Math.max(1,Math.round(n/(sp?17.5:3.2))):Math.max(1,Math.round(n/4.1))):0;
  const L=ovpLineE(h,y); L.c=e.c; if(fr.isP&&!sp)L.rp=1; return L; }
/* 올해 부상(새해에 정한다): 나이·최근 부상으로 확률이 오른다. f는 시즌 중 부상이 드러나는 시점(진행 비율) */
function wpsInjRoll(e){ const p=.1+Math.max(0,e.a-30)*.02+(e.ij&&e.ij.y>=G.year-1?.08:0); if(R()>=p)return 1; const av=rnd(.3,.8); e.ij={y:G.year,d:Math.round((1-av)*180),f:Math.round(rnd(.15,.8)*100)/100}; return av; }
/* 마지막으로 끝난 시즌: 해외 리그가 올해 시즌을 마감했으면 올해, 아니면 작년 */
const wpsDone=()=>!!(G.ovl&&G.ovl.MLB&&(G.ovl.MLB.h||[]).some(h=>h.y===G.year));
const wpsSeed=(k,...a)=>rngHash('wps',k,G.year,...a);
/* 받침에 맞는 조사: (으)로 · 와/과 */
const wpsJ=(s,a,b)=>{ const c=String(s).charCodeAt(String(s).length-1)-0xAC00; if(c<0||c>11171)return s+b; const j=c%28; return s+(j&&!(a==='으로'&&j===8)?a:b); };
/* 저장소 만들기(새 게임·예전 저장 불러오기 한 번). 지난 시즌 기록 1~3줄을 나이를 거꾸로 돌려 만들고, 올해 시즌이 남았으면 올해 기록을 미리 만든다 */
function wpsBuild(){ const y0=wpsDone()?G.year:G.year-1;
  G.wps={v:WPS.v,y:y0,ny:G.year,nid:WPS.nid0,L:[],ev:[]};
  withRng(wpsSeed('build',Object.keys(G.players).length,(G.teams||[]).map(t=>t.name).join('|')),()=>{ const used=new Set();
    for(const lg of WPS_LGS){ const nC=OVL_C[lg].length; for(let c=0;c<nC;c++){ const [a,b]=WPS.n[lg]; const n=ri(a,b); const T=[]; if(R()<WPS.star[lg])T.push('s');
        while(T.length<n)T.push(wpick({r:45,v:20,p:25,i:10}));
        for(const t of T){ const e=wpsNew(lg,c,t,used); const r0=Object.assign({},e.r), a0=e.a, ys=Math.min(3,Math.max(1,e.a-20));
          for(let k=ys-1;k>=0;k--){ const y=y0-k; e.a=a0-k; const back=k*(a0-k<=27?.9:a0-k>=32?-.9:0); for(const q in e.r)e.r[q]=clamp(r0[q]-back,20,80);
            const av=e.ij&&e.ij.y===y?rnd(.35,.7):1; e.L.push(wpsLine(e,y,av)); }
          e.a=a0; e.r=r0; G.wps.L.push(e); } } }
    if(y0<G.year)for(const e of G.wps.L)e.cu=wpsLine(e,G.year,wpsInjRoll(e)); });
  return G.wps; }
/* 불러오기·새 게임: 판 번호가 낮거나 없으면 만든다(몇 번 불러도 같은 결과) */
function wpsMigrate(){ if(!G||!G.teams||!G.teams.length)return null; if(G.wps&&(G.wps.v||0)>=WPS.v)return G.wps; return wpsBuild(); }
function wpsEv(t,id){ const W=G.wps; (W.ev=W.ev||[]).unshift({y:G.year,t,id}); if(W.ev.length>WPS.evMax)W.ev.length=WPS.evMax; }
/* 관찰 중인 주목 선수: 관찰을 시작한 시즌부터 해마다 한 줄씩 남긴다(은퇴·이적해도 관찰 기록은 남는다) */
function wpsWatchLog(e,L){ for(const w of G.ovw||[]){ if(String(w.id)!==String(e.i))continue; const y0=w.y0??G.year; if(L.y<y0)continue; w.h=w.h||[]; if(!w.h.some(x=>x.y===L.y)){ const x=Object.assign({},L,{lg:e.lg}); w.h.push(x); w.h.sort((a,b)=>a.y-b.y); } } }
/* 시즌 마감(09_stoveleague 시즌 정리, 해외 리그 마감 바로 뒤): 올해 기록 확정 → 계약 1년 줄이기 → 은퇴·승격·강등·이적 → 빈 구단에 새 얼굴 */
function wpsSeasonEnd(){ const W=G.wps; if(!W||W.y>=G.year)return 0; W.y=G.year; let ch=0;
  withRng(wpsSeed('end',W.nid,W.L.length),()=>{ const used=new Set(W.L.map(e=>e.n)), out=new Set(), watched=new Set((G.ovw||[]).map(w=>String(w.id))), cnt0={}; for(const e of W.L)cnt0[e.lg+':'+e.c]=(cnt0[e.lg+':'+e.c]||0)+1;
    const room=(lg,c)=>(cnt0[lg+':'+c]||0)<WPS.cap, mv=(e,lg,c)=>{ cnt0[e.lg+':'+e.c]--; cnt0[lg+':'+c]=(cnt0[lg+':'+c]||0)+1; e.lg=lg; e.c=c; }; /* 한 구단에 주목 선수가 몰리지 않게(WPS.cap) */
    for(const e of W.L){ const L=e.cu&&e.cu.y===G.year?e.cu:wpsLine(e,G.year,1); delete e.cu; if(!e.L.some(l=>l.y===G.year))e.L.push(L); if(e.L.length>WPS.keep)e.L.splice(0,e.L.length-WPS.keep); wpsWatchLog(e,L);
      if(e.ct){ e.ct.y--; if(e.ct.y<=0)e.fa=1; }
      const o=wpsOvr(e), st=wpsSt(e.lg), sd=wpsSd(e.lg);
      const retP=e.a>=39?.85:e.a>=37?.45:e.a>=35?.2:e.a>=33?.06:0, dropP=o<st-sd*1.6?(watched.has(String(e.i))?.0:.35):0;
      if(R()<retP){ out.add(e); wpsEv(`${e.n}(${e.a}세, ${OVL_LBL[e.lg]} ${ovlNm(e.lg,e.c)}) 은퇴`,e.i); continue; }
      if(R()<dropP){ out.add(e); continue; } /* 주목 선수 명단에서 빠진다(관찰 중이면 남긴다) */
      if(e.lg==='AAA'&&o>=60.5&&e.a<=31&&R()<.4&&room('MLB',e.c)){ mv(e,'MLB',e.c); delete e.fa; e.ct=wpsCt(e); wpsEv(`${e.n}, 트리플A ${ovlNm('AAA',e.c)}에서 MLB ${wpsJ(ovlNm('MLB',e.c),'으로','로')} 승격`,e.i); ch++; continue; } /* 산하 구단 번호 = 모구단 번호 */
      if(e.lg==='MLB'&&o<st-sd*1.1&&e.a<=33&&R()<.4&&room('AAA',e.c)){ mv(e,'AAA',e.c); e.ct={y:1,amt:ri(15,60),mi:1}; delete e.fa; wpsEv(`${e.n}, MLB ${ovlNm('MLB',e.c)}에서 트리플A ${wpsJ(ovlNm('AAA',e.c),'으로','로')} 강등`,e.i); ch++; continue; }
      if(e.fa&&e.lg==='MLB'&&e.a>=32&&o<st-sd*.4&&R()<.35){ const lg=o>=56?'NPB':'LMB', c=ri(0,OVL_C[lg].length-1); if(room(lg,c)){ wpsEv(`${e.n}, MLB 계약을 마치고 ${OVL_LBL[lg]} ${wpsJ(ovlNm(lg,c),'과','와')} 계약`,e.i); mv(e,lg,c); delete e.fa; e.ct=wpsCt(e); ch++; continue; } }
      if(e.lg==='NPB'&&o>=61&&e.a<=31&&(e.fa||e.o==='jp')&&R()<.15){ const c=ri(0,OVL_C.MLB.length-1); if(room('MLB',c)){ wpsEv(`${e.n}, NPB ${ovlNm('NPB',e.c)}에서 ${e.o==='jp'&&!e.fa?'포스팅으로 ':''}MLB ${wpsJ(ovlNm('MLB',c),'과','와')} 계약`,e.i); mv(e,'MLB',c); delete e.fa; e.ct=wpsCt(e); ch++; continue; } }
      if(e.fa&&R()<.45){ const c=ri(0,OVL_C[e.lg].length-1); if(c!==e.c&&room(e.lg,c)){ wpsEv(`${e.n}, FA로 ${OVL_LBL[e.lg]} ${ovlNm(e.lg,e.c)}에서 ${wpsJ(ovlNm(e.lg,c),'으로','로')} 이적`,e.i); mv(e,e.lg,c); ch++; } }
      if(e.fa){ delete e.fa; e.ct=wpsCt(e); } }
    if(out.size){ W.L=W.L.filter(e=>!out.has(e)); ch+=out.size; }
    /* 빈자리: 구단마다 최소 인원까지 새 얼굴(신인·반등·새로 뜬 선수). 번호는 저장소 번호로 */
    const cnt={}; for(const e of W.L){ const k=e.lg+':'+e.c; cnt[k]=(cnt[k]||0)+1; }
    for(const lg of WPS_LGS)for(let c=0;c<OVL_C[lg].length;c++){ let n=cnt[lg+':'+c]||0; const min=WPS.n[lg][0]; while(n<min){ const t=wpick({p:45,r:40,i:15}); const e=wpsNew(lg,c,t,used); e.L.push(wpsLine(e,G.year,e.ij?rnd(.4,.8):1)); W.L.push(e); n++; ch++; } } });
  return ch; }
/* 새해(ovlNewYear): 나이·가벼운 성장 곡선 → 올해 부상 추첨 → 올해 기록 미리 만들기 */
function wpsNewYear(){ const W=G.wps; if(!W||W.ny>=G.year)return 0; W.ny=G.year;
  withRng(wpsSeed('year',W.nid,W.L.length),()=>{ for(const e of W.L){ e.a++; const o=wpsOvr(e);
      const d=e.a<=24?1.2:e.a<=27?.6:e.a<=30?0:e.a<=32?-.8:e.a<=34?-1.6:-2.5, up=e.pt>o&&e.a<=28?Math.min(e.pt-o,rnd(.5,2.5)):0, back=e.ij&&e.ij.y===G.year-1?rnd(0,1.5):0, z=N(0,.8);
      for(const k in e.r)e.r[k]=clamp(Math.round((e.r[k]+d+up+back+z)*10)/10,20,80); if(e.pt<wpsOvr(e))e.pt=Math.round(wpsOvr(e)*10)/10;
      if(e.t==='p'&&e.a>=26)e.t='r'; if(e.t!=='v'&&e.a>=34)e.t='v';
      e.cu=wpsLine(e,G.year,wpsInjRoll(e)); } });
  return W.L.length; }
/* 심층 보고서용 전체 선수: 번호로 씨앗을 둔 난수라 언제 펼쳐도 같은 사람. G.players·G.nextId·본게임 난수를 그대로 둔다(돌려주기만 한다) */
function wpsExpand(e){ if(!e)return null; const n0=G.nextId, keep=G.players[n0];
  try{ return withRng(rngHash('wpsX',e.i),()=>{ const p=newPlayer({age:e.a,isP:!!e.P,base:50,pos:e.ps,foreign:e.o==='jp'||e.o==='tw'?'아시아':'용병',nat:e.na,name:e.n}); if(G.players[p.id]===p)delete G.players[p.id];
      p.id=e.i; p.r=Object.assign({},e.r); p.pot=Math.max(wpsOvr(e),e.pt||0); if(e.ro)p.role=e.ro; p.team=null; p.wps=e.lg; p.orig=e.o; return p; }); }
  finally{ G.nextId=n0; if(keep)G.players[n0]=keep; } }
/* 화면: 시즌 줄들(끝난 시즌 + 올해 진행 중) */
function wpsLines(e){ const isP=!!e.P, out=e.L.map(l=>wpsH(l,isP)); const f=ovlFrac(G.year); if(e.cu&&e.cu.y===G.year&&f>0){ const q=wpsH(ovsPart(e.cu,f),isP); q.live=f<1?1:0; out.push(q); } return out; }
/* 표시 꼬리표: 노장 · 유망주 · 부상 중 · 부상 후 부진 · 부진. 공개 기록(나이·기록·부상 소식)으로만 정한다 */
function wpsFlags(e){ const F=[], isP=!!e.P, L=wpsLines(e), v=l=>l?ovsVal(l,isP)/Math.max(.35,(isP?(l.outs||0)/(l.rp?180:540):(l.pa||0)/600)):0;
  if(e.a>=34)F.push(['노장','warn']); else if(e.a<=23)F.push(['유망주','acc']);
  const f=ovlFrac(G.year), injNow=e.ij&&e.ij.y===G.year&&f>0&&f>=(e.ij.f??0)&&f<1; if(injNow)F.push(['부상','bad']);
  const done=L.filter(l=>!l.live), last=done[done.length-1], prev=done.slice(-3,-1);
  if(last&&prev.length){ const pv=prev.reduce((s,l)=>s+v(l),0)/prev.length, lv=v(last); const slump=lv<pv-1.5&&pv>0;
    if(slump&&e.ij&&e.ij.y>=last.y-1&&e.ij.y<=G.year)F.push(['부상 후 부진','bad']); else if(slump)F.push(['부진','warn']); }
  else if(e.ij&&e.ij.y===G.year-1&&last&&last.y===G.year-1)F.push(['부상 후 부진','bad']);
  return F; }
/* 알려진 계약: 남은 해(올해 포함)·연봉. 스카우트 지식(k)이 모자라면 일부만 */
function wpsCtTxt(e,k){ const c=e.ct; if(!c||k<20)return '계약 알 수 없음'; const yrs=c.mi?'마이너 계약':c.y<=1?'올 시즌 뒤 FA':`계약 ${c.y}년 남음`; return k>=55?`${yrs} · 연 약 ${c.amt.toLocaleString('ko-KR')}만 달러`:yrs; }
