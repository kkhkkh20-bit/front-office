/* ===== 프로모션 데이 · 스타 관중 효과 (사용자 11-14: "프로모션 데이 넣어보자", "스타 인기 관중은 이미 있을텐데 연결해서 넣자") =====
   - 정규시즌 홈경기에 행사를 하나씩 잡는다(시즌 PROMO_MAX회). 비용은 경기를 치른 날 그 구단 장부에 잡히고, 우천 순연 등으로 열리지 않으면 들지 않는다.
   - 효과는 관중 수요 배율(attOf 안의 promoAttM)로 들어가므로 매진 상한(구장 좌석 수)을 넘지 않는다. 늘어난 관중의 표값은 입장 수입(stadGame)에 그대로 쌓인다.
   - 효과는 그날 형편을 따른다: 평일·주말, 달(추위·더위·방학), 돔, 팀 성적, 팬 여론, 같은 행사 반복(피로), 응원단 단계, 스타 이름값.
   - 행사 고유 수입(치맥 매출·굿즈)은 '프로모션 부대 수입', 행사비·할인 손실은 '프로모션 데이 비용'으로 결산한다(모든 구단 같은 식, 08_season_events).
   - 다른 구단도 같은 행사·비용·효과·횟수로 운영한다: 개막 전날과 7월 1일에 같은 기대값 계산(promoEst)으로 고른다(99_ai_parity와 같은 원칙).
   스타 관중: 홈 스타 효과(starAttM, 37_stadium)는 이미 있다. 여기서는 원정 팀 스타가 관중을 부르는 몫(visStarM)을 더한다.
   리그 평균이 1이 되게 나눠 리그 전체 관중은 그대로 두고, 스타가 많은 팀이 찾아가는 구장에 관중이 몰리게 했다(실측 근거 없는 보수적 게임 설정).
   스타 상품 수입은 '스타 마케팅'(starIncome)에 이미 있다. 스타 데이 굿즈만 행사 수입으로 따로 잡는다(겹치지 않게). */
const PROMO_MAX=10;
const PROMO_EV={
  kids:{l:'어린이 행사',c:15,b:.10,fan:.6,d:'어린이 팬 초청·그라운드 체험. 주말과 5월에 강하고, 어린이날(5월 5일)엔 크게 늡니다.'},
  cap:{l:'모자 증정',c:25,b:.14,fan:.5,d:'선착순 모자 증정. 평일 관중을 끌어올립니다.'},
  jersey:{l:'유니폼 증정',c:60,b:.24,fan:1,d:'선착순 유니폼 증정. 효과가 크지만 비싸 대개 팬 서비스용입니다.'},
  legend:{l:'레전드 시구',c:10,b:.06,fan:.8,d:'은퇴한 구단 레전드를 시구자로 초청합니다. 영구결번 선수가 있으면 더 반깁니다.'},
  chimac:{l:'치킨·맥주 데이',c:12,b:.08,conc:.0004,fan:.3,d:'치킨·맥주 할인 세트. 여름에 강하고 매점 매출이 함께 오릅니다. 추운 달엔 약합니다(돔 제외).'},
  fire:{l:'불꽃놀이',c:30,b:.12,fan:.6,d:'경기 뒤 불꽃놀이. 한여름·토요일에 강하고, 추운 달엔 약합니다. 돔구장에선 할 수 없습니다.'},
  local:{l:'시·도민의 날',c:8,b:.09,disc:.04,fan:1.2,d:'연고지 주민 할인. 표값이 조금 줄지만 지역 팬 여론이 오릅니다.'},
  women:{l:'여성 팬 데이',c:10,b:.07,mg:.0002,fan:.4,d:'여성 팬 전용 굿즈·포토존. 굿즈 매출이 조금 오릅니다.'},
  univ:{l:'대학생 할인',c:5,b:.07,disc:.03,fan:.3,d:'학생증 할인. 평일 학기 중에 강하고 방학(7·8월)과 주말엔 약합니다.'},
  cheer:{l:'응원단 특별 공연',c:10,b:.06,fan:.4,d:'응원단·치어리더 특별 무대. 응원단 규모가 클수록 효과가 큽니다.'},
  star:{l:'스타 데이',c:30,b:.03,mg:.0003,fan:.5,d:'간판 스타 버블헤드·사인 굿즈. 그 선수 이름값이 클수록 관중·굿즈 매출이 늡니다.'},
  retire:{l:'영구결번 기념 행사',c:20,b:.12,fan:1.5,d:'영구결번 선수를 기리는 기념 행사. 영구결번이 있는 구단만, 시즌 한 번이 제일 좋습니다.'}
};
const PROMO_FANV=6; /* 팬 여론 1점의 값어치(기대값 비교용, 600만 원): 사람 단장 추천과 다른 구단 선택이 같은 기준을 쓴다 */
let _promoOff=false, _visOff=false;
function promoOf(tid){ const S=G.sea; if(!S)return null; const P=S.promo=S.promo||{}; return P[tid]||(P[tid]={bk:{},log:[],cost:0,inc:0,xatt:0,xtk:0}); }
function promoHomeOpp(tid,d){ const c=G.cal; if(!c||!c.sched||d<c.open||d>c.end)return null; const g=(c.sched[d]||[]).find(([h])=>h===tid); return g?g[1]:null; }
function promoUsed(tid){ const P=promoOf(tid); return P?P.log.length+Object.values(P.bk).filter(b=>!b.done).length:0; }
let _promoSC={k:null};
function promoStar(tid){ const k=G.year+':'+G.day; if(_promoSC.k!==k||_promoSC.g!==G)_promoSC={k,g:G,v:{}}; if(tid in _promoSC.v)return _promoSC.v[tid]; const x=teamStar(tid).L[0]; return _promoSC.v[tid]=x&&x.s>=15?x:null; } /* 하루 한 번만 잰다(추천 예약이 수천 번 묻는다) */
function promoCheerLv(tid){ if(tid===G.user&&!G.unemp)return (G.fanOps&&G.fanOps.cheer)||0; const F=team(tid).fanOps; return (F&&F.cheer)||0; }
/* 이 행사를 그날 열 수 있는지: ''면 가능, 아니면 이유 */
function promoWhyNot(tid,d,k){ const E=PROMO_EV[k]; if(!E)return '없는 행사입니다.'; if(k==='fire'&&stadOf(tid).dome)return '돔구장에서는 불꽃놀이를 할 수 없습니다.';
  if(k==='retire'&&!retNosOf(tid).length)return '영구결번 선수가 없습니다.'; if(k==='star'&&!promoStar(tid))return '내세울 스타 선수가 없습니다(이름값 15 이상).'; return ''; }
/* 그날 행사 효과: 수요 배율과 이유. 같은 행사 반복은 그날 전에 열었거나 잡아 둔 횟수로 센다 */
function promoLift(tid,a,d,k){ const E=PROMO_EV[k], o=dobj(d), why=[]; const S=stadOf(tid), P=promoOf(tid);
  let b=E.b, f=1; const wk=o.w===0||o.w===6;
  if(o.w>=1&&o.w<=4){ f*=1.15; why.push('평일이라 효과가 큽니다'); } else if(wk){ f*=.85; }
  const cold=!S.dome&&(o.m<=4||o.m>=10), hot=o.m>=7&&o.m<=8;
  if(k==='kids'){ if(o.m===5&&o.d===5){ f*=2; why.push('어린이날'); } else if(o.m===5)f*=1.3; if(!wk&&!(o.m===5&&o.d===5)&&!hot)f*=.7; else if(hot)f*=1.2; }
  if(k==='univ'){ if(wk)f*=.6; else f*=1.2; if(hot){ f*=.6; why.push('방학이라 약합니다'); } }
  if(k==='fire'){ if(o.w===6)f*=1.15; if(cold){ f*=.7; why.push('날이 추워 약합니다'); } else if(hot)f*=1.2; }
  if(k==='chimac'){ if(o.m>=6&&o.m<=8){ f*=1.3; why.push('여름이라 잘 팔립니다'); } else if(cold){ f*=.75; why.push('날이 추워 약합니다'); } }
  if(a!=null&&G.teams[a]){ let rh=0; try{ rh=rivalHeat(tid,a); }catch(e){} if(team(a).market>=1.15||rh>=.3){ f*=.9; why.push('인기 상대라 행사 없이도 관중이 많습니다'); } } /* 인기 상대·라이벌전은 행사 몫이 덜 남는다 */
  if(k==='cheer')f*=1+.25*promoCheerLv(tid);
  if(k==='legend'&&retNosOf(tid).length)f*=1.3;
  let sp=null; if(k==='star'){ const x=promoStar(tid); if(x){ sp=x; b+=Math.min(.09,x.s/700); why.push(`${x.p.name} 이름값`); } else b=0; }
  const pr=prOf(tid), fan=pr?pr.fan:55; f*=.75+fan/200; if(fan<35)why.push('팬 여론이 나빠 반응이 약합니다');
  const r=G.sea&&G.sea.rec&&G.sea.rec[tid], g=r?r.w+r.l:0, wp=g>=10?r.w/g:.5; if(wp<.42){ f*=.9; why.push('성적이 나빠 조금 약합니다'); } else if(wp>.58)f*=1.05;
  const same=P.log.filter(x=>x.k===k).length+Object.entries(P.bk).filter(([dd,x])=>x.k===k&&!x.done&&+dd<d).length; const fat=Math.pow(k==='retire'?.3:.7,same); if(same)why.push(`올해 ${same+1}번째라 효과가 줄었습니다`);
  const near=P.log.some(x=>x.d<d&&d-x.d<=2)||Object.keys(P.bk).some(dd=>+dd<d&&d-dd<=2&&!P.bk[dd].done); const nf=near?.85:1; if(near)why.push('행사가 연달아 있어 조금 약합니다');
  return {m:1+b*f*fat*nf,fat:fat*nf,why,sp}; }
/* 관중 수요 배율(37_stadium attOf): 그날 잡힌 행사. 다음 시즌 전망·효과 비교 중이면 빼고 본다 */
function promoAttM(h,a,day){ if(_promoOff||(typeof _stY!=='undefined'&&_stY!=null))return 1; const P=G.sea&&G.sea.promo&&G.sea.promo[h]; const B=P&&P.bk[day]; if(!B||B.done)return 1; return promoLift(h,a,day,B.k).m; }
/* 원정 스타가 부르는 관중: 원정 팀 상위 3명 이름값(최대 +4%)과 대기록 도전(+3%). 리그 평균으로 나눠 리그 전체 관중은 그대로 */
let _promoVC={k:null};
function visStarX(tid){ let x=Math.min(.04,teamStar(tid).v/2500); const c=G.cal; if(c&&G.day>=c.open&&G.day<=c.end&&playersOf(tid).some(p=>{ if((p.hstk||0)>=25)return true; const s=seasonTotal(p,G.year,'1군'); return !!s&&((s.hr||0)>=42||(s.h||0)>=180); }))x+=.03; return x; }
function visStarM(a){ if(_visOff||a==null||!G.teams||!G.teams[a])return 1; const k=G.year+':'+G.day; if(_promoVC.k!==k||_promoVC.g!==G){ const X=G.teams.map(t=>visStarX(t.id)); _promoVC={k,g:G,X,mean:X.reduce((s,v)=>s+v,0)/X.length}; } const x=_promoVC.X[a]; return x==null?1:(1+x)/(1+_promoVC.mean); }
/* 기대값(예약 화면·추천·다른 구단 선택): 늘어날 관중, 표값, 행사 수입, 비용, 팬 여론, 손익 */
function promoEst(tid,d,k,a){ if(a==null)a=promoHomeOpp(tid,d); if(a==null)return null; const E=PROMO_EV[k], S=stadOf(tid), P=promoOf(tid);
  const keep=P.bk[d]; P.bk[d]={k}; let w0,w1; try{ w1=attOf(tid,a,d,null); _promoOff=true; w0=attOf(tid,a,d,null); } finally{ _promoOff=false; if(keep)P.bk[d]=keep; else delete P.bk[d]; }
  const L=promoLift(tid,a,d,k), eco=ecoIdx(), tk1=TICKET*eco*PRICE[S.price].m; const xa=Math.max(0,w1-w0), cap=stadCap(tid);
  const tk=xa*tk1, conc=(E.conc||0)*w1*eco*L.fat, mg=(E.mg||0)*w1*eco*L.fat*(L.sp?1+L.sp.s/50:1), disc=(E.disc||0)*w1*tk1, cost=E.c*eco+disc;
  const why=[...L.why]; if(w0>=cap*.97)why.unshift('원래 매진이라 더 들어올 자리가 없습니다'); else if(w1>=cap*.97)why.push('매진에 막혀 효과가 줄었습니다');
  return {k,d,a,w0,w1,xa,tk,inc:conc+mg,conc,mg,disc,cost,fan:E.fan*L.fat,net:tk+conc+mg-cost,why,sp:L.sp}; }
/* 예약·취소: 사람 단장과 다른 구단이 같은 함수를 쓴다 */
function promoBook(tid,d,k){ d=+d; if(!PROMO_EV[k])return '없는 행사입니다.'; if(!(d>G.day))return '지난 날짜에는 잡을 수 없습니다.'; const a=promoHomeOpp(tid,d); if(a==null)return '그날은 정규시즌 홈경기가 없습니다.';
  const w=promoWhyNot(tid,d,k); if(w)return w; const P=promoOf(tid); const cur=P.bk[d];
  if(!cur&&promoUsed(tid)>=PROMO_MAX)return `올해 프로모션은 ${PROMO_MAX}번까지입니다.`; if(cur&&cur.k===k)return `이미 ${PROMO_EV[k].l}을(를) 잡아 두었습니다.`;
  P.bk[d]={k}; return `${dmd(d)} ${tshort(a)}전에 ${PROMO_EV[k].l}을(를) 잡았습니다. 행사비 ${money(PROMO_EV[k].c*ecoIdx())}은 경기 날 듭니다.`; }
function promoCancel(tid,d){ const P=promoOf(tid); const B=P&&P.bk[+d]; if(!B||B.done)return '잡힌 행사가 없습니다.'; delete P.bk[+d]; return `${dmd(+d)} ${PROMO_EV[B.k].l}을(를) 취소했습니다. 비용은 들지 않습니다.`; }
/* 추천 예약(사람 단장 일괄 예약·다른 구단): 남은 홈경기에서 기대값이 좋은 순서로 n개까지. 한 번 고를 때마다 반복 피로를 다시 계산한다 */
function promoAuto(tid,n,until){ const c=G.cal; if(!c||!c.sched||G.sea.y!==G.year)return 0; const P=promoOf(tid); n=Math.min(n??PROMO_MAX,PROMO_MAX-promoUsed(tid)); if(n<=0)return 0;
  const days=[]; for(let d=Math.max(G.day+1,c.open);d<=Math.min(c.end,until??c.end);d++){ if(P.bk[d])continue; const a=promoHomeOpp(tid,d); if(a!=null)days.push([d,a]); }
  const ks=Object.keys(PROMO_EV).filter(k=>!promoWhyNot(tid,G.day+1,k)); let got=0; const fv=PROMO_FANV*ecoIdx();
  const sc=(d,a,k)=>{ const e=promoEst(tid,d,k,a); return e?e.net+e.fan*fv:-1e9; };
  /* 날짜마다 그날 가장 좋은 행사를 고르고, 가장 좋은 날부터. 매번 전부 다시 재지 않게 후보를 줄인다(상위 24일) */
  const best=days.map(([d,a])=>{ let bk=null, bs=-1e9; for(const k of ks){ const s=sc(d,a,k); if(s>bs){ bs=s; bk=k; } } return {d,a,k:bk,s:bs}; }).sort((x,y)=>y.s-x.s).slice(0,24);
  while(got<n&&best.length){ for(const x of best){ x.s=-1e9; for(const k of ks){ const s=sc(x.d,x.a,k); if(s>x.s){ x.s=s; x.k=k; } } } best.sort((x,y)=>y.s-x.s); const x=best.shift(); if(!x||x.s<=0)break; P.bk[x.d]={k:x.k}; got++; }
  return got; }
function promoAiN(t){ const pl=planOf(t)||'next', cash=t.cash||0; if(cash<0)return 0; let n=pl==='tight'?2:pl==='build'?4:pl==='star'?7:5; if(t.owner==='pr')n++; return Math.min(PROMO_MAX,n); }
/* 매일(07_daily): 다른 구단은 개막 전날 상반기 몫, 7월 1일 나머지를 잡는다 */
function promoDaily(){ const c=G.cal; if(!c||!c.sched||!G.sea||G.sea.y!==G.year)return; const jul=dnum(G.year,7,1);
  for(const t of G.teams){ const P=G.sea.promo&&G.sea.promo[t.id]; if(P)for(const d of Object.keys(P.bk))if(+d<G.day&&!P.bk[d].done)delete P.bk[d]; /* 열리지 않은 경기(순연)의 행사는 비용 없이 사라진다 */
    if(t.id===ME()||G.day<c.open-1||G.day>c.end)continue; const Q=promoOf(t.id); const N=promoAiN(t);
    try{ if(!Q.ai1&&G.day<jul){ Q.ai1=1; promoAuto(t.id,Math.ceil(N*.55),jul-1); } else if(!Q.ai2&&G.day>=jul){ Q.ai1=Q.ai2=1; promoAuto(t.id,N-promoUsed(t.id)); } }catch(e){} } }
/* 경기 뒤(07_daily playDay, stadGame 다음): 행사 결과를 장부에 쌓고, 원정 스타 효과를 기록한다 */
function promoGame(day,h,a,st){ if(!st)return; try{ visDrawRec(day,h,a); }catch(e){}
  const P=G.sea&&G.sea.promo&&G.sea.promo[h]; const B=P&&P.bk[day]; if(!B||B.done)return; B.done=true;
  const e=promoEst(h,day,B.k,a); delete P.bk[day]; if(!e)return; const E=PROMO_EV[B.k]; const att=st.att, eco=ecoIdx();
  /* 실제 관중 기준으로 행사 수입·할인을 다시 잰다(기대 관중이 아니라 그날 들어온 사람 수) */
  const r=att/Math.max(1,e.w1); const inc=Math.round(e.inc*r), disc=Math.round(e.disc*r), cost=Math.round(E.c*eco+disc), xa=Math.round(Math.min(e.xa,att)), tk=Math.round(xa*TICKET*eco*PRICE[stadOf(h).price].m);
  P.cost+=cost; P.inc+=inc; P.xatt+=xa; P.xtk+=tk;
  const pr=prOf(h); const fan=Math.round(e.fan*10)/10; if(pr&&fan)pr.fan=clamp(pr.fan+fan,0,100);
  const L={d:day,a,k:B.k,att,cap:st.cap,so:!!st.so,xa,tk,inc,cost,net:tk+inc-cost,fan,why:e.why.slice(0,2),...(e.sp?{sp:e.sp.p.name}:{})}; P.log.push(L); if(P.log.length>PROMO_MAX*2)P.log.shift();
  if(h===G.user&&!G.unemp&&!G._away){ mail('마케팅팀',`[프로모션] ${E.l} 결과`,promoReport(L),{kind:'구단',acts:[{l:'프로모션 보기',a:'go',v:'club:fans'}]}); } }
function promoReport(L){ const E=PROMO_EV[L.k]; const n=x=>x.toLocaleString('ko-KR');
  return `${dmd(L.d)} ${tshort(L.a)}전 ${E.l}${L.sp?`(${L.sp})`:''}\n관중 ${n(L.att)}명${L.so?'(매진)':''} · 행사 효과 약 +${n(L.xa)}명\n표값 +${money(L.tk)}${L.inc?` · 행사 매출 +${money(L.inc)}`:''} · 비용 ${money(L.cost)} → ${L.net>=0?'+':''}${money(L.net)}${L.fan?` · 팬 여론 +${L.fan}`:''}${L.why.length?`\n${L.why.join('. ')}.`:''}`; }
/* 원정 스타 효과 기록: 원정 팀 스타 덕에 늘어난 기대 관중(양수일 때만). 홈 구단 화면엔 '어느 팀 스타가 관중을 불렀나', 원정 팀엔 '우리 스타가 원정 관중을 불렀나' */
function visDrawRec(day,h,a){ const m=visStarM(a); if(!(m>1.003))return; const w1=attOf(h,a,day,null); _visOff=true; let w0; try{ w0=attOf(h,a,day,null); } finally{ _visOff=false; } const x=Math.round(w1-w0); if(x<=0)return;
  const V=G.sea.vdraw=G.sea.vdraw||{}; const A=V[a]=V[a]||{out:0,n:0,inn:0,top:null}; A.out+=x; A.n++; const s=teamStar(a).L[0]; if(s)A.top=s.p.name;
  const H=V[h]=V[h]||{out:0,n:0,inn:0,top:null}; H.inn+=x; const bv=H.bv||(H.bv={}); bv[a]=(bv[a]||0)+x; }
/* 결산(08_season_events, 모든 구단): 행사 장부 */
function promoSettle(tid,inc,exp){ const P=G.sea&&G.sea.promo&&G.sea.promo[tid]; if(!P)return; if(P.inc>0)inc.push(['프로모션 부대 수입',Math.round(P.inc)]); if(P.cost>0)exp.push(['프로모션 데이 비용',Math.round(P.cost)]); }
/* 올해 예산(19_budget, 우리 구단): 치른 행사 + 잡아 둔 행사 기대값 */
function promoBudget(inc,exp){ if(G.unemp||(G.last&&G.last.y>=G.year))return; const P=G.sea&&G.sea.promo&&G.sea.promo[G.user]; if(!P)return; let c=P.cost, i=P.inc;
  for(const d of Object.keys(P.bk)){ const B=P.bk[d]; if(B.done)continue; const e=promoEst(G.user,+d,B.k); if(e){ c+=e.cost; i+=e.inc; } }
  if(i>0)inc.push(['프로모션 부대 수입',Math.round(i)]); if(c>0)exp.push(['프로모션 데이 비용',Math.round(c),'ops']); }
/* 관중 요인 설명(구장 화면): 스타 효과를 말로 */
function starDrawLines(tid){ const L=[]; const T=teamStar(tid); const hm=starAttM(tid); const V=(G.sea&&G.sea.vdraw||{})[tid];
  if(hm>1.004&&T.L.length)L.push(`${T.L.slice(0,2).map(x=>x.p.name).join('·')} 이름값으로 홈 관중 +${Math.round((hm-1)*100)}%`);
  if(V&&V.out>0&&V.top)L.push(`${V.top} 효과로 원정 관중 약 +${V.out.toLocaleString('ko-KR')}명(${V.n}경기)`);
  if(V&&V.bv){ const b=Object.entries(V.bv).sort((x,y)=>y[1]-x[1])[0]; if(b&&b[1]>=300)L.push(`${tshort(+b[0])} 스타 방문 때 홈 관중 약 +${b[1].toLocaleString('ko-KR')}명`); }
  const si=starIncome(tid); if(si>0&&T.L.length)L.push(`스타 마케팅(유니폼·광고) ${money(si)}`); return L; }
