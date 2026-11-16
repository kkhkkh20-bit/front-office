/* ===== 해외 활성화 3단계: 시작부터 해외에 있는 국내 선수 · 리그 사이 이동 · 상주 외국인 후보군 =====
   3-1 새 게임: 해외파 3~5명(MLB 2~3명 중 1명은 자리 잡은 주전, NPB 1명, 트리플A 1명)을 지난 기록·계약·원소속 구단과 함께 만든다.
       시작 세계(KBO 선수·외국인·드래프트 후보)를 만든 뒤에 따로 씨앗을 둔 난수(withRng)로 만든다. 본 난수 흐름·선수 번호(G.nextId)를 쓰지 않아 같은 씨앗의 세계는 예전과 같다. 예전 저장에는 만들지 않는다.
   3-2 리그 사이 이동: 계약이 끝나거나 NPB에서 잘한 선수는 MLB로, MLB에서 자리를 못 잡은 선수는 국내 대신 NPB로 간다. KBO를 떠난 외국인도 같은 길(확률은 낮게). 줄마다 리그·구단이 남아 기록이 따라간다.
   3-3 상주 외국인 후보군(G.ovp): 트리플A·NPB·CPBL 등에서 뛰는 외국인 약 80명. 해마다 나이를 먹고 기록을 쌓다가 외국인 시장에 나온다(새로 만드는 후보 대신 일부를 여기서).
       팔리지 않은 후보는 다시 후보군으로 돌아가 다음 해에 같은 사람·이어진 기록으로 나온다. 모든 구단이 같은 후보·같은 공개 기록을 본다 */
const OVS_NID0=800001; /* 해외 쪽에서 만든 사람 번호(본 선수 번호 흐름과 따로) */
function ovsNid(){ let n=Math.max(G.ovsNid||OVS_NID0,OVS_NID0); while(G.players[n]||(G.abroad||[]).some(a=>a.id===n))n++; G.ovsNid=n+1; return n; }
/* 만든 선수를 본 명단에서 떼어 해외 번호를 준다 */
function ovsDetach(p){ delete G.players[p.id]; p.id=ovsNid(); return p; }
/* 새 게임 한 번: 시작 세계와 따로 씨앗을 둔 난수로 해외파·후보군을 만든다 */
function ovsWorldStart(){ if(!G||G.ovsW)return; G.ovsW=1; const n0=G.nextId;
  const seed=rngHash('ovs3',G.year,Object.keys(G.players).length,...G.teams.map(t=>Math.round((t.scoutSd||0)*1e6)));
  try{ withRng(seed,()=>{ try{ ovsSeedKr(); ovsPregen(); }catch(e){} try{ ovpInit(); ovpPregen(); }catch(e){} }); }finally{ G.nextId=n0; } }
/* ----- 3-1 시작 해외파 ----- */
/* k: 종류 · lg: 계약 리그 · age·o: 나이·국내 능력 범위 · ago: 떠난 지(해외 시즌 수) · rem·amt: 남은 계약 연수(올해 포함)·연봉(만 달러) · p: 나올 확률 */
const OVS_SEED=[{k:'star',lg:'MLB',age:[29,31],o:[66,69],ago:[2,3],rem:[3,4],amt:[1100,1700],how:'포스팅'},
  {k:'mlb',lg:'MLB',age:[26,28],o:[61,64],ago:[1,2],rem:[2,3],amt:[450,900],how:'포스팅'},
  {k:'vet',lg:'MLB',age:[31,33],o:[60,62],ago:[1,2],rem:[1,2],amt:[300,550],how:'해외 FA',p:.5},
  {k:'npb',lg:'NPB',age:[28,31],o:[57,60],ago:[1,2],rem:[1,2],amt:[150,320],how:'해외 FA'},
  {k:'aaa',lg:'MLB',age:[24,27],o:[55,58],ago:[1,1],rem:[1,2],amt:[100,200],how:'포스팅',p:.75}];
function ovsSeedKr(){ G.abroad=G.abroad||[]; const T=G.teams.map(t=>t.id); const used=new Set();
  for(const S of OVS_SEED){ if(S.p!=null&&R()>=S.p)continue; let from=pick(T); for(let i=0;i<6&&used.has(from);i++)from=pick(T); used.add(from);
    const age=ri(S.age[0],S.age[1]), o=rnd(S.o[0],S.o[1]), ago=ri(S.ago[0],S.ago[1]), y=G.year-1-ago, y1=y+1, yrs=ago+ri(S.rem[0],S.rem[1]), amt=round5(rnd(S.amt[0],S.amt[1]));
    const isP=S.k==='star'?R()<.4:R()<.5; const p=ovsDetach(newPlayer({age:age-ago,isP,base:o,team:from,svc:0})); setOvr(p,o-(age-ago<28?ago*.7:0)); p.pot=Math.max(p.pot,o);
    if(isP)p.role=S.k==='star'||R()<.6?'SP':'RP';
    /* KBO 시절: 떠나기 전 세 시즌 1군 기록(능력은 지금보다 조금 낮게) */
    const svc=S.how==='해외 FA'?ri(9,11):ri(7,8); p.svc=svc; p.sal=round5(marketSal(ovr(p))*(S.how==='해외 FA'?1.2:.8)); p.mlb=ri(55,80); p.ovsY=y; p.joinY=y-svc+1;
    for(let k=2;k>=0;k--){ const yy=y-k; const L=isP?simPit(p,isSPr(p)?ri(420,540):ri(160,210),0):simBat(p,ri(470,620),0);
      const h=Object.assign({y:yy,t:from,lvl:'1군'},isP?ZP:ZB,L); if(isP){ h.g=isSPr(p)?Math.max(20,Math.round(h.outs/17)):Math.max(40,Math.round(h.outs/3.2)); if(isSPr(p))h.gs=h.g; h.bf=h.outs+h.h+h.bb+(h.hbp||0); } else h.g=Math.min(144,Math.round(h.pa/4.1)); p.hist.push(h); }
    /* 해외 시즌: 떠난 뒤 해마다 그 리그 수준으로(지금 능력으로 거꾸로, 어릴 때는 조금 낮게) */
    const CL=OVL_C[S.lg], ci=Math.floor(R()*CL.length), club=ovlNm(S.lg,ci);
    const rec={id:p.id,name:p.name,isP,pos:posLabel(p),foreign:null,from,lg:S.lg,club,how:S.how,yrs,amt,y,y1,age:age,lines:[],fee:S.how==='포스팅'?usd(postFee(amt*yrs)):0,back:false,d:dnum(y,12,10),pj:null,ci,seed:1};
    for(let k=0;k<ago;k++){ const yy=y1+k; p.age=age-ago+k+1; setOvr(p,o-(p.age<28?(ago-k-1)*.7:0)); const L=ovsLine(p,S.lg,{ci,y:yy,gt:ovsGt(rec)}); delete L.o; L.y=yy; const A=ovsAwards(L,p,S.lg,k===0); if(A.length)L.aw=A; rec.lines.push(L); }
    p.age=age; setOvr(p,o); p.team=from; rec.age=age; rec.pj=ovsPj(p); G.abroad.unshift(rec); } }
/* ----- 3-2 리그 사이 이동 ----- */
/* 이동 한 번: 리그·구단을 바꾸고 이동 기록을 남긴다(지난 줄은 그 시즌 리그·구단 그대로) */
function ovsMove(a,lg,yrs,amt,NW,why){ const f=a.lg, fc=a.club; const CL=OVL_C[ovlKey(lg)]; const ci=Math.floor(R()*CL.length);
  (a.mv=a.mv||[]).push({y:G.year,f,t:lg}); if(a.mv.length>4)a.mv.splice(0,a.mv.length-4); a.lg=lg; a.ci=ci; a.club=ovlNm(lg,ci); delete a.bn; delete a.cur;
  if(!a.foreign&&!a.cand){ const y1=a.y1??a.y+1; a.yrs=G.year-y1+1+yrs; a.amt=amt; }
  const t=`${a.foreign?'KBO 출신 ':''}${a.name}, ${f} ${String(fc||f).split(' ')[0]}에서 ${lg} ${a.club}로 이적${yrs?` · ${yrs}년 연 ${usdKw(amt)}`:''}${why?`(${why})`:''}`;
  if(NW)NW.push({pr:(lg==='MLB'?6:4)+(a.from===G.user?2:0)+(a.foreign||a.cand?-2:0),t,a}); return t; }
/* 국내 선수: 계약이 끝난 해(또는 NPB에서 2년 넘게 잘한 해) 다음 행선지. 돌아오기로 한 선수는 home 그대로 */
function ovsMoveKr(a,p,ok,yrsIn,home,NW){ const o=ovr(p), A=ovsAgeT(p.age);
  if(a.lg==='NPB'&&ok&&p.age<=31&&o>=61&&(yrsIn>=a.yrs||yrsIn>=2)&&R()<(o>=64?.6:.4)){ const Y=postYrs(o); const yrs=Math.min(A.y,ri(Y[0],Y[1])); return ovsMove(a,'MLB',yrs,Math.round(clamp(postAmt0(o)*A.f+N(0,60),100,2500)),NW,yrsIn>=a.yrs?'계약 만료':'포스팅'); }
  if(yrsIn<a.yrs)return null;
  if(a.lg==='MLB'&&home&&!ok&&p.age<=33&&o>=56&&R()<.4)return ovsMove(a,'NPB',Math.min(A.y,ri(1,2)),Math.round(clamp((o-55)*45+N(0,30),80,600)),NW,'빅리그 자리를 잃고');
  if(!home){ const yrs=p.age<=30?ri(2,4):p.age<=32?ri(1,2):1; a.yrs=yrsIn+yrs; a.amt=Math.round(clamp(a.lg==='MLB'?postAmt0(o)*A.f:(o-55)*45,80,2500)); delete a.bn; return 're'; } /* 남는 선수: 같은 리그 재계약 */
  return null; }
/* KBO를 떠난 외국인·놓친 후보: 트리플A로 밀린 MLB 계약 선수는 가끔 NPB로, NPB에서 잘한 선수는 가끔 MLB로 */
function ovsMoveFr(a,L,NW){ const fr=a.fr; if(!fr||a.end!=null)return null; const v=ovsVal(L,!!a.isP);
  if(a.lg==='MLB'&&L.lvl==='트리플A'&&fr.age>=26&&fr.age<=33&&R()<.15)return ovsMove(a,'NPB',0,0,NW,'빅리그 자리를 잃고');
  if(a.lg==='NPB'&&v>=3.5&&fr.age<=32&&R()<.2)return ovsMove(a,'MLB',0,0,NW,'');
  return null; }
/* ----- 3-3 상주 외국인 후보군 ----- */
const OVP={n:80,max:100,p:.6,keep:2}; /* n: 해마다 채우는 인원 · max: 시장에서 돌아온 후보까지 받는 한도 · p: 시장 새 후보 중 후보군에서 나올 확률 · keep: 남기는 시즌 수 */
const OVP_LV=new Set(['트리플A','더블A','멕시코리그','NPB 1군','NPB 2군','CPBL']); /* 상주 리그(윈터리그·독립리그·호주는 짧은 시즌이라 뺀다) */
const ovpPrevY=d=>{ const o=dobj(d??G.day); return o.m>=10?o.y:o.y-1; }; /* 후보의 '지난 시즌'이 몇 년 시즌인가 */
const ovpWk=()=>{ const o=dobj(G.day); return o.m>=10?G.year:G.year-1; }; /* 겨울 번호(10월~이듬해 9월) */
/* 저장할 때 0인 값은 빼므로 읽을 때 채운다(OPS·ERA 계산에 빈 값이 없게) */
const OVP_ZB=['g','pa','ab','h','d','tr','hr','bb','hbp','so','sb','sf'], OVP_ZP=['g','outs','h','hr','bb','hbp','so','er'];
const ovpFill=(h,isP)=>{ for(const k of isP?OVP_ZP:OVP_ZB)if(h[k]==null)h[k]=0; return h; };
const ovpLineE=(h,y)=>{ const o={y,l:h.lvl}; for(const k of ['g','pa','ab','h','d','tr','hr','bb','hbp','so','sb','outs','er','sf'])if(h[k])o[k]=h[k]; return o; };
/* 선수 → 후보군 한 줄(능력·성향·지난 기록만) */
function ovpE(p,lines){ const e={i:p.id,n:p.name,k:p.foreign==='아시아'?1:0,na:p.nat,o:p.orig,P:p.isP?1:0,a:p.age,r:Object.assign({},p.r),pt:Math.round(p.pot*10)/10,th:p.th,bt:p.bt,ad:p.adapt,sx:p.sx||0,m:p.mlbG||0,l:(lines[lines.length-1]||{}).l||p.prevLvl,L:lines.slice(-OVP.keep)};
  if(!p.isP)e.ps=p.pos; else if(p.role)e.ro=p.role; if(p.velo)e.v=Math.round(p.velo*100)/100; if(p.inj!=null)e.in=Math.round(p.inj*1000)/1000; if(p.flaw)e.fl=p.flaw; if(p.ovp)e.s=p.ovp; if(p.addP&&p.addP.length)e.ap=p.addP;
  if(e.l==='트리플A')e.c=p.fkbo&&p.fkbo.c!=null?p.fkbo.c:ovlHashIdx('aaa',p.id,OVL_C.AAA.length); return e; }
/* 새 후보군 선수: 시장 후보와 같은 식(newForeign)으로 만들고 상주 리그만 남긴다 */
function ovpFresh(){ const n0=G.nextId; let q=null; for(let t=0;t<4;t++){ const k=R()<.25?'아시아':'용병'; q=newForeign(k,k==='아시아'?{market:true,reg:R()<.6?'jp':'tw'}:{market:true,lvl:wpick({'트리플A':7,'더블A':1,'멕시코리그':1})}); delete G.players[q.id]; if(OVP_LV.has(q.prevLvl))break; q=null; }
  G.nextId=n0; if(!q)return null; q.id=ovsNid(); const y=ovpPrevY(); const L=[]; if(q.prev2)L.push(ovpLineE(q.prev2,y-1)); L.push(ovpLineE(q.prev,y)); return ovpE(q,L); }
function ovpInit(){ const O=G.ovp=G.ovp||{v:1,L:[]}; let g=0; while(O.L.length<OVP.n&&g++<OVP.n*2){ const e=ovpFresh(); if(e)O.L.push(e); } return O; }
/* 후보군 → 외국인 시장 후보(같은 사람·같은 번호, 지난 기록이 그대로 공개 기록) */
function ovpP(e){ const O=G.ovp; if(O)O.L=O.L.filter(x=>x!==e);
  const p=newPlayer({age:e.a,isP:!!e.P,base:50,pos:e.ps,foreign:e.k?'아시아':'용병',nat:e.na||null,name:e.n}); delete G.players[p.id]; p.id=e.i; G.players[p.id]=p;
  p.r=Object.assign({},e.r); p.th=e.th||p.th; p.bt=e.bt||p.bt; if(e.ro)p.role=e.ro; if(e.v!=null)p.velo=e.v; if(e.in!=null)p.inj=e.in; if(e.ap)p.addP=e.ap.slice(); if(p.isP){ delete p.delivery; p.delivery=pitchDelivery(p); }
  p.pot=Math.max(ovr(p),e.pt||0); p.orig=e.o||origOf(p); p.adapt=e.ad??50; p.sx=e.sx||0; if(e.fl)p.flaw=e.fl; p.mlbG=e.m||0;
  const L=e.L||[], l=L[L.length-1], l2=L[L.length-2]; const st=x=>{ const {y,l:lv,...h}=x; h.lvl=lv; ovpFill(h,p.isP); if(h.g==null)h.g=p.isP?Math.max(1,Math.round((h.outs||0)/(isSPr(p)?17:3.5))):Math.max(1,Math.round((h.pa||0)/4.1)); return h; };
  if(l){ p.prevLvl=l.l; p.prev=st(l); if(l2&&l2.l===l.l)p.prev2=st(l2); } p.ovpY=l?l.y:null;
  p.ask=fAsk(p,ovr(p)+N(0,3.5)+(p.mlbG>=30?1.5:p.mlbG>0?.7:0)); if(p.orig==='la'||p.orig==='ve')p.ask=round5(p.ask*.8); if(p.flaw)p.ask=round5(p.ask*.88); p.sal=p.ask;
  if(e.cur&&e.cur.y===G.year&&e.cur.l===p.prevLvl&&period()==='season'){ const f=ovlFrac(G.year); if(f>0){ const {y,l:lv,live,...h}=ovsPart(e.cur,f); p.now=ovpFill(Object.assign({y:G.year,lvl:lv},h),p.isP); } } /* 올해 이 리그에서 치른 만큼(공개 기록) */
  p.fsrc='agent'; p.fday=G.day; p.fpub=G.day; p.ovp=(e.s||0)+1; return p; }
/* 시장 새 후보: 후보군에서 조건에 맞는 사람을 먼저(확률 OVP.p), 없으면 예전처럼 새로 만든다 */
function fCandNew(kind,o){ o=o||{}; const e=ovpPick(kind,o); if(e)return ovpP(e); const n=Object.assign({market:true},o); delete n.amin; delete n.amax; return newForeign(kind,n); }
function ovpPick(kind,o){ const O=G.ovp; if(!O||!O.L.length||R()>=OVP.p)return null; const wk=ovpWk(), k=kind==='아시아'?1:0;
  const C=O.L.filter(e=>e.k===k&&(o.isP==null||!!e.P===o.isP)&&(!o.lvl||e.l===o.lvl)&&(!o.pos||e.ps===o.pos)&&(o.amin==null||e.a>=o.amin)&&(o.amax==null||e.a<=o.amax)&&e.cy!==wk); return C.length?pick(C):null; }
/* 팔리지 않고 시장을 떠나는 후보: KBO 기록이 없고 34세 이하면 후보군으로 돌아간다(다음 겨울 같은 사람으로 다시 나온다) */
function ovpBack(p){ const O=G.ovp; if(!O||!p||!p.foreign||p.team!=null||p.fkbo||(p.hist||[]).length||p.age>34||!p.prev||!OVP_LV.has(p.prevLvl))return false; if(O.L.some(e=>e.i===p.id))return false;
  if(O.L.length>=OVP.max){ const old=O.L.reduce((m,e)=>e.a>m.a?e:m,O.L[0]); if(old.a<=p.age)return false; O.L.splice(O.L.indexOf(old),1); } /* 가득 차면 가장 나이 많은 선수를 내보낸다 */
  const y=p.ovpY??ovpPrevY(p.fday); const L=[]; if(p.prev2&&p.prev2.lvl===p.prevLvl)L.push(ovpLineE(p.prev2,y-1)); L.push(ovpLineE(p.prev,y)); const e=ovpE(p,L); e.s=p.ovp||1; e.cy=ovpWk(); O.L.push(e); return true; }
/* 시즌을 마치면(abroadYear): 후보군 모두 한 시즌 기록을 쌓고, 일부는 MLB 콜업·리그 이동·은퇴, 빈자리는 새 선수로 */
function ovpYear(){ const O=G.ovp||ovpInit(); if(O.y===G.year)return; O.y=G.year; const out=[], NW=[];
  for(const e of O.L){ if((e.L||[]).some(l=>l.y===G.year))continue; const fr=ovpFr(e), lv=e.l; const c=e.cur; delete e.cur; (e.L=e.L||[]).push(c&&c.y===G.year&&c.l===lv?c:ovpGen(e,G.year)); if(e.L.length>OVP.keep)e.L.splice(0,e.L.length-OVP.keep);
    const o=ovr(fr); if(lv==='트리플A'||lv==='MLB')e.m=(e.m||0)+(lv==='MLB'?(fr.isP?ri(10,30):ri(30,90)):o>=56&&R()<.3?ri(5,30):0); /* 트리플A 선수도 짧게 콜업된다(MLB 통산 경기 수) */
    if(e.a>=36?R()<.6:e.a>=34?R()<.25:o<44?R()<.3:R()<.05){ out.push(e); continue; }
    if(lv==='트리플A'&&o>=58.5&&e.a<=31&&R()<.2){ out.push(e); if(e.s)NW.push(`예전 외국인 후보 ${e.n}, MLB 콜업 뒤 빅리그에 자리`); continue; } /* 빅리그에 자리 잡으면 후보군을 떠난다 */
    if(lv==='NPB 2군'&&o>=55&&R()<.3)e.l='NPB 1군'; else if(lv==='NPB 1군'&&o<52&&R()<.5)e.l='NPB 2군'; else if(lv==='트리플A'&&e.a>=32&&o<50&&R()<.3){ e.l='멕시코리그'; delete e.c; } else if(lv==='더블A'&&o>=54&&R()<.4){ e.l='트리플A'; e.c=ovlHashIdx('aaa',e.i,OVL_C.AAA.length); }
    if(lv==='NPB 1군'&&e.l==='NPB 1군'&&o>=60&&e.a<=31&&R()<.15){ out.push(e); if(e.s)NW.push(`예전 외국인 후보 ${e.n}, NPB 활약 뒤 MLB 계약`); } }
  O.L=O.L.filter(e=>!out.includes(e)); let g=0; while(O.L.length<OVP.n&&g++<OVP.n){ const e=ovpFresh(); if(e)O.L.push(e); }
  for(const t of NW.slice(0,2))wire('해외',t,{}); return out.length; }
const ovpFr=e=>({id:e.i,isP:!!e.P,age:e.a,r:e.r,role:e.ro,velo:e.v,th:e.th,bt:e.bt,pos:e.ps,addP:e.ap});
/* 한 시즌 기록(그 리그 수준·환경 편차, 시장 후보의 지난 시즌 기록과 같은 식) */
function ovpGen(e,y){ const fr=ovpFr(e), lv=e.l, A=LG_ADJ[lv]||[0,0], env=N(0,FENV[lv]??2), sp=fr.isP&&isSPr(fr);
  const n=fr.isP?(sp?ri(240,450):ri(120,220)):ri(300,540); const h=fr.isP?simPit(fr,n,A[1]+env*1.6):simBat(fr,n,A[0]+env); h.lvl=lv; h.g=fr.isP?Math.max(1,Math.round(n/(sp?17:3.5))):Math.round(n/4.1); return ovpLineE(h,y); }
/* 새해: 올 시즌 기록을 미리 만든다(시즌 중 화면에는 치른 만큼만, 시즌을 마치면 그대로 확정. 해외파 ovsPregen과 같은 방식) */
function ovpPregen(){ for(const e of (G.ovp&&G.ovp.L)||[])if(!(e.cur&&e.cur.y===G.year))e.cur=ovpGen(e,G.year); }
/* 새해: 후보군도 나이를 먹는다(KBO를 떠난 외국인과 같은 나이 곡선) */
function ovpAge(){ const O=G.ovp; if(!O)return; for(const e of O.L){ const fr={age:e.a,r:e.r}; ovsAgeFr(fr); e.a=fr.age; e.r=fr.r; } }
/* 주목 선수(해외 리그 화면): 후보군도 공개 기록으로 함께 보인다. 시장에 나오기 전부터 몇 해씩 지켜볼 수 있다 */
function ovpTopRows(y){ const R0=[], fr=ovlFrac(y); for(const e of (G.ovp&&G.ovp.L)||[]){ const l=(e.L||[]).find(x=>x.y===y)||(e.cur&&e.cur.y===y&&fr>0?ovsPart(e.cur,fr):null); if(!l)continue; const {y:_,l:lv,...h}=l; h.lvl=lv; ovpFill(h,!!e.P);
    R0.push({id:e.i,abr:0,pool:1,name:e.n,isP:!!e.P,pos:e.P?'투수':POSK[e.ps]||'',age:e.a,tag:'해외 후보군',lvl:lv,club:lv==='트리플A'&&e.c!=null?`트리플A ${ovlNm('AAA',e.c)}`:ovsLvlL(lv),h}); } return R0; }
