/* ===== 해외파 소식(사용자 11-17: "고교와 해외리그 활성화". 해외 리그가 살아 있게) =====
   해외 리그는 경기를 돌리지 않는다. 새해에 만든 한 시즌 기록(a.cur)을 주 단위로 나눠 '이번 주'를 만든다.
   - 주마다 몫(가중치)이 다르고, 홈런·삼진·볼넷·자책은 따로 흔들린다(뜨거운 주·무실점 주가 생긴다). 합은 시즌 기록 그대로.
   - 시즌 중 오르내림(MLB↔트리플A로 나뉜 시즌)은 정해진 주에 콜업·강등으로 보인다. 부상자 명단·재활 복귀도 그 주에는 몫이 0.
   - 모두 해시(rngHash)로 정한다. 본게임 난수(R)를 쓰지 않아 난수 순서가 그대로다. 저장은 소식 40건(OVF.keep)과 올스타 표시(a.asY)뿐 */
const OVF={nw:26,keep:40,perWk:4};
const ovfH=(...a)=>rngHash(...a)/4294967296;
/* 시즌 진행(주, 실수): 해외 리그 정규시즌 3월 27일~9월 28일(ovlFrac와 같은 구간) */
const ovfWeek=d=>clamp((d-KD(3,27))/(KD(9,28)-KD(3,27)),0,1)*OVF.nw;
const _ovfC=new Map();
/* 한 시즌 주별 계획: m·x = 본 줄·다른 수준 줄이 뛰는 주(0/1), w = 주 몫, ev = 구조 사건(콜업·강등·부상·복귀) */
function ovfPlan(a,L){ const k=a.id+':'+L.y+':'+(L.pa||0)+':'+(L.outs||0)+':'+(L.x?1:0); if(_ovfC.has(k))return _ovfC.get(k); if(_ovfC.size>400)_ovfC.clear();
  const id=a.id, y=L.y, nw=OVF.nw, w=[], ev=[]; for(let j=0;j<nw;j++)w.push(.6+.8*ovfH('ow',id,y,j));
  let p=null; try{ p=a.pj?JSON.parse(a.pj):null; }catch(e){} const av=p?ovsAv(a,p):1, r0=Math.min(nw-2,Math.round((1-av)*nw)); /* 새해에 재활 중이던 몫 */
  if(r0>0){ for(let j=0;j<r0;j++)w[j]=0; ev.push({j:r0,k:'ret',t:'재활을 마치고 복귀'}); }
  else if(ovfH('oil',id,y)<.18){ const s=3+Math.floor(ovfH('ois',id,y)*16), n=2+Math.floor(ovfH('oin',id,y)*4); for(let j=s;j<Math.min(nw,s+n);j++)w[j]=0; ev.push({j:s,k:'il',t:`부상자 명단에 올라 ${n}주쯤 쉽니다`}); if(s+n<nw)ev.push({j:s+n,k:'ret',t:'부상을 털고 복귀'}); }
  const m=Array(nw).fill(1), x=L.x?Array(nw).fill(0):null;
  if(L.x){ const h=ovfH('osw',id,y); let sw, upF; /* upF: 앞쪽이 다른 수준(x) */
    if(L.lvl==='MLB'){ sw=2+Math.floor(h*10); upF=true; ev.push({j:sw,k:'up',t:`${ovsLvlL(L.x.lvl)}에서 MLB 콜업`}); }
    else if(ovfH('oup',id,y)<.5){ sw=2+Math.floor(h*6); upF=true; ev.push({j:sw,k:'dn',t:`${ovsLvlL(L.x.lvl)}에서 ${ovsLvlL(L.lvl)}로 강등`}); }
    else { sw=nw-3-Math.floor(h*4); upF=false; ev.push({j:sw,k:'up',t:`${ovsLvlL(L.lvl)}에서 ${ovsLvlL(L.x.lvl)} 콜업(시즌 막판)`}); }
    for(let j=0;j<nw;j++){ const front=j<sw; m[j]=front===upF?0:1; x[j]=1-m[j]; } }
  const P={w,m,x,ev}; _ovfC.set(k,P); return P; }
const OVF_J={hr:1,so:1,bb:1,er:1}; /* 따로 흔들리는 기록 */
/* 기록 k의 주 t(실수)까지 누적 비율 */
function ovfFrac(a,L,act,k,t){ const nw=OVF.nw, P=ovfPlan(a,L); let tot=0, cum=0; const ti=Math.floor(t);
  for(let j=0;j<nw;j++){ const v=act[j]*P.w[j]*(OVF_J[k]?.35+1.3*ovfH('os',a.id,L.y,k,j):1); tot+=v; if(j<ti)cum+=v; else if(j===ti)cum+=v*(t-ti); } return tot>0?cum/tot:0; }
/* 주 t까지의 기록(본 줄 + 다른 수준 x). 화면의 '진행 중' 기록과 소식이 같은 값 */
function ovfCum(a,L,t){ const P=ovfPlan(a,L), nw=OVF.nw; if(t>=nw)return L;
  const mk=(Q,act)=>{ const o={}; for(const k in Q){ if(k==='x')continue; const v=Q[k]; o[k]=typeof v==='number'&&!['y','c','o','rp'].includes(k)?Math.round(v*ovfFrac(a,L,act,k,t)):v; } o.live=1; return o; };
  const M=mk(L,P.m); if(L.x){ const X=mk(L.x,P.x); if((X.pa||0)+(X.outs||0)>0)M.x=X; } /* 아직 오르내리기 전이면 다른 수준 줄은 없다 */
  if(L.x&&!((M.pa||0)+(M.outs||0))&&M.x){ const X=M.x; delete M.x; return Object.assign(X,{y:L.y,live:1}); } /* 아직 본 수준에서 뛰지 않았다: 지금 뛰는 수준을 앞에 */
  return M; }
/* 진행 중인 해외파 기록(화면용, ovsPart 대신): f = 해외 리그 진행 비율 */
function ovsCurPart(a,f){ const L=a&&a.cur; if(!L)return null; if(f>=1)return L; if(a.foreign||a.cand)return ovsPart(L,f); return ovfCum(a,L,f*OVF.nw); }
/* 올스타(빅리그만): 시즌 기록 가치로 정한다. 확률은 시즌 뒤 시상(ovsAwards)과 같은 식, 뽑기는 해시. 7월 초에 발표하고 시즌 뒤 시상도 그 결과를 따른다 */
function ovsAsP(L,isP){ if(!L||!ovsBig(L.lvl))return 0; const v=ovsVal(L,isP); return isP&&L.rp?(v>=1.6?clamp((v-1.4)/2.5,0,.5):0):clamp((v-3)/3,0,.85); }
const ovsKr=a=>a&&!a.foreign&&!a.cand&&!a.back&&a.end==null;
function ovfPush(a,t,pr,d){ const F=G.ovsFeed=G.ovsFeed||[]; F.unshift({y:G.year,d:d??G.day,id:a.id,t,p:pr+(a.from===G.user?2:0)}); if(F.length>OVF.keep)F.length=OVF.keep; }
const ovfClub=(a,q)=>{ const c=ovsClubNm(q)||a.club||a.lg; return String(c).split(' ').slice(-1)[0]; };
/* 매주(aiWeekly): 지난번부터 이번 주까지 해외파의 눈에 띄는 일. 주 4건까지, 중요한 것부터(우리 구단 출신 우선) */
function ovsFeedWeek(){ const d1=G.day, d0=G.ovfD!=null&&G.ovfD<d1&&d1-G.ovfD<=21?G.ovfD:d1-7; G.ovfD=d1; const t0=ovfWeek(d0), t1=ovfWeek(d1); if(t1<=t0)return;
  const out=[], y=G.year, asD=KD(7,6);
  for(const a of G.abroad||[]){ if(!ovsKr(a)||!a.cur||a.cur.y!==y)continue; const L=a.cur, P=ovfPlan(a,L), A=ovfCum(a,L,t0), B=ovfCum(a,L,t1), nm=a.name;
    const parts=Q=>ovsParts(Q), sumK=(Q,k)=>parts(Q).reduce((s,q)=>s+(q[k]||0),0), dK=k=>sumK(B,k)-sumK(A,k), big=ovsBig(B.lvl)?(B.lvl==='MLB'?2:1):0, cl=ovfClub(a,B);
    for(const e of P.ev)if(e.j>t0&&e.j<=t1)out.push({a,pr:e.k==='up'?7:e.k==='il'?4:3,t:`${nm}(${cl}) ${e.t}`});
    if(d0<asD&&d1>=asD){ const pAS=ovsAsP(L,a.isP), hit=pAS>0&&ovfH('oas',a.id,y)<pAS; a.asY=hit?y:-y; if(hit)out.push({a,pr:8,t:`${nm}(${cl}), ${ovsAwNm('AS',L.lvl)} 선정`}); }
    if(!a.isP){ const hr=dK('hr'), H=sumK(B,'hr'), pa=dK('pa'), h=dK('h'), ab=dK('ab'); const ms=[10,20,30,40].find(m=>H>=m&&H-hr<m);
      if(ms)out.push({a,pr:5+big,t:`${nm}(${cl}), 시즌 ${ms}호 홈런 고지`}); else if(hr>=2)out.push({a,pr:3+big,t:`${nm}(${cl}), 이번 주 ${hr}홈런 · 시즌 ${H}호`}); else if(hr===1&&H===1&&big)out.push({a,pr:1+big,t:`${nm}(${cl}), 시즌 첫 홈런`}); /* 한 개씩은 첫 홈런만(소식이 홈런으로 넘치지 않게) */
      if(pa>=15&&ab>0&&h/ab>=.4)out.push({a,pr:2+big,t:`${nm}(${cl}), 이번 주 타율 ${fmt3(h/ab)}(${ab}타수 ${h}안타)`}); }
    else { const outs=dK('outs'), er=dK('er'), so=dK('so'), K=sumK(B,'so'), g=dK('g'), sp=!L.rp; const ms=[100,200].find(m=>K>=m&&K-so<m);
      if(sp&&outs>=15&&er===0)out.push({a,pr:4+big,t:`${nm}(${cl}), 이번 주 ${ipStr(outs)}이닝 무실점`}); else if(!sp&&outs>=5&&er===0&&g>=2)out.push({a,pr:1+big,t:`${nm}(${cl}), 이번 주 ${g}경기 무실점`});
      if(ms)out.push({a,pr:4+big,t:`${nm}(${cl}), 시즌 ${ms}탈삼진`}); else if(sp&&so>=10)out.push({a,pr:2+big,t:`${nm}(${cl}), 이번 주 탈삼진 ${so}개`}); } }
  out.sort((x,z)=>(z.pr+(z.a.from===G.user?2:0))-(x.pr+(x.a.from===G.user?2:0))); for(const x of out.slice(0,OVF.perWk).reverse())ovfPush(x.a,x.t,x.pr); }
/* 시즌을 마친 해외파의 시상·첫 시즌(abroadYear의 소식 후보): 국내 선수만 */
function ovsFeedSeason(N){ for(const x of (N||[]).slice().sort((p,q)=>p.pr-q.pr))if(x.a&&!x.a.foreign&&!x.a.cand)ovfPush(x.a,x.t,x.pr); }
/* 해외파 시즌 요약(화면): 올해(시즌 전이면 지난해) 국내 선수 해외 기록. 리그별 인원, 팀 성적, 부문 1위 */
function ovsSeasonSum(){ const fr=ovlFrac(G.year), y=fr>0?G.year:G.year-1, R=[];
  for(const a of G.abroad||[]){ if(a.foreign||a.cand)continue; let l=(a.lines||[]).find(z=>z.y===y); if(!l&&y===G.year&&a.cur&&a.cur.y===y&&!a.back&&a.end==null)l=ovsCurPart(a,fr); if(!l)continue;
    const q=l, tr=q.c!=null&&q.c>=0&&OVL_C[ovlKey(q.lvl)]?ovlTeamRec(q.lvl,q.c,y):null; R.push({a,l,tr,lv:q.lvl}); }
  const by=k=>R.filter(r=>k==='etc'?!['MLB','NPB','트리플A'].includes(r.lv):r.lv===k).length;
  const bat=R.filter(r=>!r.a.isP&&ovsParts(r.l).some(q=>q.pa)), pit=R.filter(r=>r.a.isP&&ovsParts(r.l).some(q=>q.outs));
  const sb=(r,k)=>ovsParts(r.l).reduce((s,q)=>s+(q[k]||0),0), best=(L,f,min)=>L.filter(min).sort((x,z)=>f(z)-f(x))[0]||null;
  const hrL=best(bat,r=>sb(r,'hr'),r=>sb(r,'hr')>0), opsL=best(bat,r=>bRate(r.l).ops,r=>(r.l.pa||0)>=Math.max(30,200*Math.min(1,fr||1))), soL=best(pit,r=>sb(r,'so'),r=>sb(r,'so')>0), eraL=best(pit,r=>-pRate(r.l).era,r=>(r.l.outs||0)>=Math.max(24,(r.l.rp?60:150)*Math.min(1,fr||1)));
  return {y,live:y===G.year&&fr<1,fr,R,n:{MLB:by('MLB'),NPB:by('NPB'),AAA:by('트리플A'),etc:by('etc')},hrL,opsL,soL,eraL,sb}; }
