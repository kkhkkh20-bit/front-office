/* ===== 구장 =====
   실제 구장은 지자체 소유이고 구단이 장기 임대해 운영한다. 단장은 구장 안 시설(좌석·매장·프리미엄석·전광판·그라운드)에 투자하고 티켓 가격을 정한다.
   수용 인원은 연고지 실제 구장 규모를 참고한 게임 설정 근사치. 2025년 KBO 평균 관중 17,101명·좌석 점유율 82.9%에 맞춰 수요를 조정했다 */
const STAD_CAP=[23750,23750,23000,18700,16000,17000,20500,24000,22990,17983];
/* 개장 연도(게임 설정, 연고지 실제 구장 연식 참고) */
const STAD_BUILT=[1982,1982,2002,1989,2015,2025,2014,2016,1985,2019];
const STAD_NM=['서울 종합야구장','서울 종합야구장','인천 문학야구장','수원 야구장','고양 돔구장','대전 신구장','광주 야구장','대구 신구장','부산 사직야구장','창원 야구장'];
const STAD_ITEMS=[
  {k:'seat',l:'관람석·편의시설',d:'좌석 교체, 화장실·통로·그늘막 개선. 관중 수요가 늘고 팬 여론이 좋아집니다.'},
  {k:'fnb',l:'식음료·굿즈 매장',d:'먹거리 매장과 구단 상품점을 넓힙니다. 관중 1인당 부대 수입이 오릅니다.'},
  {k:'prem',l:'프리미엄석',d:'스카이박스·테이블석·캠핑존. 기업 고객 판매로 고정 수입이 생기지만 일반 좌석이 조금 줄어듭니다.'},
  {k:'vis',l:'전광판·영상',d:'대형 전광판과 영상 설비. 구장 광고 수입이 오르고 관중 수요도 조금 늡니다.'},
  {k:'turf',l:'그라운드·잔디',d:'잔디·배수·조명 정비. 홈경기에서 부상이 조금 줄어듭니다.'}];
/* 12단계(사용자 11-05: 100년 플레이에 오래 쌓을 목표). 9단계부터는 효과가 더 작고(단계당 0.3) 비싸다 */
const STAD_MAX=12;const stadPower=lv=>lv<=5?lv:lv<=8?5+(lv-5)*.45:6.35+(lv-8)*.3;
const STAD_COST=[0,0,600,1200,2200,3600,5500,8000,12000,16000,21000,27000,34000], STAD_UP=[0,30,60,110,180,280,400,560,780,1000,1250,1550,1900], STAD_DAYS=[0,0,60,90,120,150,210,270,330,345,360,365,365];
const PRICE=[{l:'할인',m:.8,dem:1.12,fan:.5,d:'관중이 늘고 팬 여론이 오르지만 표값 수입이 줄어듭니다.'},{l:'보통',m:1,dem:1,fan:0,d:'리그 평균 수준입니다.'},{l:'인상',m:1.15,dem:.87,fan:-.5,d:'표값 수입이 늘지만 관중과 팬 여론이 조금 줄어듭니다.'},{l:'고가',m:1.3,dem:.72,fan:-1.2,d:'매진이 잦은 인기 구단이 아니면 손해입니다. 팬 여론이 매달 떨어집니다.'}];
const TICKET=.014; // 관중 1명당 표값 수입 1만4천원(백만원 단위, 게임 재정 기준)
function stadOf(tid){ const t=team(tid); if(!t.stad){ const mk=(TEAM_DEF[tid]||t).market||1, poor=mk<=.9||(TEAM_DEF[tid]||t).indie, rich=mk>=1.15; const r=k=>poor?2:rich?(k==='f'||k==='v'?4:3):2+(hn('st'+k,tid)>.35?1:0); /* 큰 시장 구단은 매장·전광판까지 개발된 구장(자체 수입), 작은 시장·독립 구단은 기본 구장에서 시작(사용자 11-08: 쉬운 구단·어려운 구단) */ t.stad={lv:{seat:r('s'),fnb:r('f'),prem:r('p'),vis:r('v'),turf:r('t')},price:1,build:[]}; } if(t.stad.dome==null&&!t.stad.built&&/돔/.test(STAD_NM[tid]||''))t.stad.dome=true; /* 기본 고양 돔구장은 돔 */ return t.stad; }
function stadCap(tid){ const S=stadOf(tid); return Math.round((S.cap||STAD_CAP[tid])-(stadPower(S.lv.prem)-2)*300); }
function stadBuilt(tid){ const S=stadOf(tid); return S.built||STAD_BUILT[tid]||2000; }
/* 구장 연식 효과: 30년 넘으면 관람 환경이 낡아 수요 -4%, 새 구장은 개장 3년간 +12%에서 서서히 줄어든다, 공사 중 -2% */
let _stY=null; /* 다음 시즌 전망을 낼 때 그 해 기준 */
function stadAgeF(tid){ const S=stadOf(tid); const age=(_stY??G.year)-stadBuilt(tid); let f=age>=30?.96:1; if(age<3)f*=1+.12*(3-age)/3+.04; const N=S.proj; if(N&&N.stage==='build')f*=.98; return f; }
/* 그날 열린 구장 이름: 신구장 개장 전 경기는 옛 구장으로(검수 11-06). 이름 기록이 없는 예전 저장은 개장한 해 전 경기를 기본 구장으로 본다 */
function stadNameAt(tid,d){ const S=stadOf(tid); for(const x of S.names||[])if(d<x.until)return x.n; if(!(S.names&&S.names.length)&&S.name&&S.built&&dobj(d).y<S.built)return STAD_NM[tid]||`${team(tid).city} 야구장`; return stadName(tid); }
function stadName(tid){ const S=stadOf(tid); return S.name||STAD_NM[tid]||`${team(tid).city} 야구장`; }
/* 구장 치수(m): 좌·중·우 담장 거리와 높이. 실제 한국 구장 규모를 참고한 가상 구장의 기본값(새 구장·공사로 바뀔 수 있음) */
const STAD_DIM=[{lf:100,cf:125,rf:100,wl:2.6,wc:2.6,wr:2.6},{lf:100,cf:125,rf:100,wl:2.6,wc:2.6,wr:2.6},{lf:95,cf:120,rf:95,wl:2.4,wc:2.4,wr:2.4},{lf:98,cf:120,rf:98,wl:4,wc:4,wr:4},{lf:99,cf:122,rf:99,wl:4,wc:4,wr:4},
  {lf:99,cf:122,rf:95,wl:3.2,wc:3.2,wr:8},{lf:99,cf:121,rf:99,wl:3,wc:3,wr:3},{lf:99.5,cf:122.5,rf:99.5,wl:3.6,wc:3.6,wr:3.6},{lf:95.8,cf:120.5,rf:95.8,wl:6,wc:6,wr:6},{lf:101,cf:123,rf:101,wl:3.3,wc:3.3,wr:3.3}];
function stadDim(tid){ const S=stadOf(tid); return S.dim||STAD_DIM[tid]||STAD_DIM[0]; }
/* 홈런 지수: 담장이 1m 가까우면 그 방향 홈런이 약 3.8% 늘고(27m에 e배), 1m 높으면 약 4% 준다. 당겨친 홈런(60%)·가운데(28%)·밀어친(12%) 비중으로 방향을 섞고,
   리그 10개 구장 평균이 1이 되게 나눈다(리그 전체 홈런 수는 그대로, 구장 사이 차이만). 오른쪽 타석은 당기면 좌익, 왼쪽 타석은 우익 */
const PK_DREF={lf:98.7,cf:122.1,rf:98.4}, PK_WREF={l:3.37,c:3.37,r:3.84};
function parkSideF(D,s){ const d=s==='l'?D.lf:s==='c'?D.cf:D.rf, w=s==='l'?D.wl:s==='c'?D.wc:D.wr; return Math.exp(-(d-PK_DREF[s==='l'?'lf':s==='c'?'cf':'rf'])/27)*Math.exp(-(w-PK_WREF[s])/24); }
function parkRaw(tid,side){ const D=stadDim(tid); const pl=side==='R'?'l':'r', op=side==='R'?'r':'l'; return .6*parkSideF(D,pl)+.28*parkSideF(D,'c')+.12*parkSideF(D,op); }
let _pkN={k:null}; function parkNorm(){ const k=G.teams.map(t=>JSON.stringify(stadDim(t.id))).join('|'); if(_pkN.k===k)return _pkN.v; const v=G.teams.reduce((a,t)=>a+(parkRaw(t.id,'R')+parkRaw(t.id,'L'))/2,0)/G.teams.length; _pkN={k,v}; return v; }
function parkHRM(tid,side){ if(tid==null||!G||!G.teams)return 1; return parkRaw(tid,side)/parkNorm(); }
/* 홈런 방향: 기본 비중에 그 구장 방향별 홈런 쉬움을 곱해 고른다 */
function parkHRDir(tid,side){ const D=stadDim(tid); const pl=side==='R'?'l':'r', op=side==='R'?'r':'l'; const w=[.6*parkSideF(D,pl),.28*parkSideF(D,'c'),.12*parkSideF(D,op)]; let x=R()*(w[0]+w[1]+w[2]); return x<w[0]?'pull':x<w[0]+w[1]?'mid':'oppo'; }
const turfM=lv=>Math.max(.7,1-(stadPower(lv)-2)*.05); /* 하한 .7: 12단계(.7225)까지 실제로 줄어든다(검수 11-06: 11→12단계가 .75 하한에 막힘) */
function stadTurfM(tid){ return turfM(stadOf(tid).lv.turf); }
function attOf(h,a,day,noise){ const t=team(h), S=stadOf(h), cap=stadCap(h); const r=G.sea&&G.sea.rec&&G.sea.rec[h]; const g=r?r.w+r.l:0; const wp=g>=10?r.w/g:.5;
  const o=dobj(day); const dow=o.w===6||o.w===0?1.28:o.w===5?1.08:.88; const opp=1+(team(a).market-1)*.35;
  const P=prOf(h), fan=P?(.9+P.fan/500):1; /* 떠난 구단도 그 구단 여론으로(검수 11-09zza) */ const late=o.m>=8&&wp<.44?.9:1;
  const f=.84*Math.pow(t.market,.5)*(.82+.3*t.pop)*(.9+(wp-.5)*1.3)*fan*dow*opp*late*PRICE[S.price].dem*(1+(stadPower(S.lv.seat)-2)*.04)*(1+(stadPower(S.lv.vis)-2)*.015)*stadAgeF(h)*(S.dome?1.06:1)*fanAttM(day,h)*starAttM(h)*rivalAttM(h,a); /* 라이벌전(91_league_events) */ /* 응원단·테마 데이·서포터즈·스타 선수 */
  if(noise===null){ /* 기대 관중: 3점 가우스-에르미트 근사로 매진 상한까지 반영 */ const z=1.732*.2; return Math.round(cap*(Math.min(1,f*Math.exp(-z))/6+Math.min(1,f)*2/3+Math.min(1,f*Math.exp(z))/6)); }
  const n=Math.exp(N(0,.2)); return Math.min(cap,Math.round(cap*f*n)); }
/* 스타 효과(사용자 11-09: 스타가 관중을 부른다): 구단 상위 3명 스타 파워 합이 클수록 수요 최대 +5%, 정규시즌 중 대기록 도전(시즌 42홈런·180안타 이상, 25경기 연속 안타 이상)이면 +8% 더.
   근거: 실제 리그에서 스타 신드롬과 우승이 겹친 구단이 구단 최다 관중을 기록한 해가 있지만 리그 전체도 역대 최다(1천만 명대)라 스타 몫만 떼어 낼 수 없다. 그래서 수치는 보수적 게임 설정(실측 근거 없음). 하루 한 번만 계산한다 */
let _saC={k:null,v:{}};
function starAttM(h){ const k=G.year+':'+G.day; if(_saC.k!==k||_saC.g!==G)_saC={k,g:G,v:{}}; /* 새 게임·불러오기면 다시 */ if(_saC.v[h]!=null)return _saC.v[h]; let m=1+Math.min(.05,teamStar(h).v/2000); const c=G.cal;
  if(c&&G.day>=c.open&&G.day<=c.end&&playersOf(h).some(p=>{ if((p.hstk||0)>=25)return true; const x=seasonTotal(p,G.year,'1군'); return !!x&&((x.hr||0)>=42||(x.h||0)>=180); }))m*=1.08;
  return _saC.v[h]=m; }
function stadGame(day,h,a){ const cap=stadCap(h); let att=attOf(h,a,day); const ring=champRing(h);
  if(ring){ ring.ringDone=G.year;chron('champ',`${G.year-1} 우승 반지 수여식 개최`,null,h,{source:'champ-ring:'+(G.year-1)});if(G.ringT===h)G.ringDone=G.year; att=cap; /* 우승 반지 수여식: 우승 구단 홈 개막전 매진(단장이 이직해도 우승 구단에서 연다) */ for(const p of playersOf(h))p.mor=clamp((p.mor??60)+3,0,100);
    if(h!==G.user||G.unemp)wire('구단',`${tshort(h)} 우승 반지 수여식, 홈 개막전 ${cap.toLocaleString('ko-KR')}석 매진`,{tid:h}); else news('구단',`${tshort(G.user)} 우승 반지 수여식…홈 개막전 ${cap.toLocaleString('ko-KR')}석 매진`,`경기 전 지난 시즌 우승 멤버들이 반지를 받았습니다. 전광판에는 우승 순간이 다시 흘렀고, 관중석은 빈자리 없이 들어찼습니다.`,2,{fanW:2}); } G.sea.att=G.sea.att||{}; const A=G.sea.att[h]||(G.sea.att[h]={n:0,sum:0,so:0,best:0});
  { const S=stadOf(h); if(A.tk==null&&A.n>0){ A.tk=A.sum*TICKET*ecoIdx()*PRICE[S.price].m; A.fb=A.sum*.0003*(stadPower(S.lv.fnb)-2); } if(A.cap==null&&A.n>0)A.cap=A.n*cap; /* 예전 저장: 기록이 없던 앞 경기들은 지금 값으로 채워 둔다(새 경기 하나만 남지 않게, 검수 11-06) */ A.tk=(A.tk||0)+att*TICKET*ecoIdx()*PRICE[S.price].m; A.fb=(A.fb||0)+att*.0003*(stadPower(S.lv.fnb)-2); } /* 그 경기 당시 표값·매점 수준으로 수입을 쌓는다(나중에 값을 바꿔도 지난 경기 수입은 그대로) */
  { const S=stadOf(h), hg=stadHG(h), v=stadYr(S); if(A.pn==null){ A.pn=A.n; A.pm=v.prem*A.n/hg; A.ad=v.ad*A.n/hg; A.up=v.up*A.n/hg; } A.pm+=v.prem/hg; A.ad+=v.ad/hg; A.up+=v.up/hg; A.pn++; } /* 프리미엄석·전광판 수입과 유지비도 경기 당시 단계로 쌓는다(검수 11-06: 홈경기가 끝난 뒤 완공해도 한 해 치를 받음) */
  A.n++; A.sum+=att; A.cap=(A.cap||0)+cap; /* 경기 당시 좌석 수 합(점유율은 이것으로) */ if(att>=cap)A.so++; if(att>A.best)A.best=att; return {att,so:att>=cap,cap}; }
function stadYr(S){ return {prem:(stadPower(S.lv.prem)-2)*600,ad:(stadPower(S.lv.vis)-2)*400+(S.dome?2500:0),up:sum(STAD_ITEMS.map(x=>STAD_UP[S.lv[x.k]]-STAD_UP[2]))}; }
function stadHG(tid){ const c=G.cal, H=G.sea.hg=G.sea.hg||{}; if(H[tid]==null)H[tid]=c&&c.sched?Math.max(1,homeGames(tid,c.open,c.end).length):72; return H[tid]; }
function homeGames(tid,from,to){ const L=[], c=G.cal, n=G.day+1; if(!c||!c.sched)return L; for(let d=from;d<=to;d++){ if(d===n&&d>=c.open&&d<=c.end)for(const x of (G.makeup||[]))if(x.y===G.year&&x.h===tid&&!(x.d>=from))L.push([d,x.a]); for(const [h,a] of (c.sched[d]||[]))if(h===tid)L.push([d,a]); } return L; } /* 미룬 경기는 원래 날짜 일정에 이미 있다: 그 날짜가 범위 밖일 때만 내일 경기로 센다(검수 11-09zza: 한 경기가 두 번 셈) */ /* 내일 치를 미룬 홈경기도 관중·입장권 전망에(검수 11-09zo) */
/* d날 경기 때 시설 단계: 그날까지 끝나는 공사는 완공 단계로(완공 전 경기는 지금 단계) */
function stadLvAt(S,d,base){ const L={...(base||S.lv)}; for(const b of S.build||[])if(b.done<=d&&b.lv>(L[b.k]||0))L[b.k]=b.lv; return L; }
/* 시즌 관중·구장 수입 전망: 지금까지 실제 + 남은 홈경기 예상 */
function stadProj(tid,next){ const S=stadOf(tid); const c=G.cal; if(!next&&c&&c.sched&&G.day<c.open&&S.proj&&S.proj.stage==='build'&&S.proj.done<=c.open)return stadProj(tid,true); /* 개막 전 새해: 개막 전에 문을 여는 신구장은 그 구장 기준(검수 11-08) */
  /* 시즌이 끝난 뒤 예산 전망(next): 지난 일정에 지금 가격·시설을 넣어 다음 시즌 기대 관중을 낸다 */
  if(next&&c&&c.sched){ const N=S.proj, y1=dobj(G.day).m>=10?G.year+1:G.year; const nw=N&&N.stage==='build'&&N.done<=dnum(y1,4,1); /* 다음 시즌 전에 문을 여는 신구장: 그 구장 기준으로 본다(검수 11-06) */
    const keep={cap:S.cap,dome:S.dome,lv:S.lv,built:S.built,proj:S.proj}; S.lv={...S.lv}; if(nw){ S.lv=Object.fromEntries(Object.entries(S.lv).map(([k,v])=>[k,Math.max(v,4)])); S.cap=N.cap+(stadPower(S.lv.prem)-2)*300; S.dome=N.k==='dome'; S.built=y1; S.proj=null; } /* 개장 연도 기준 구장 나이(검수 11-07) */ /* 개장 첫해와 같은 구장 나이(0년)·공사 중 감소 없음 */
    const off=(c.open>G.day&&dobj(c.open).y===y1?c.open:onOrAfter(y1,3,25,6))-c.open; /* 지난 일정을 다음 시즌 개막일(buildCalendar와 같은 식)로 옮겨 공사 완공일과 맞춘다(검수 11-09y: 개막 뒤 완공도 개막 전처럼 셈) */ const lv0=S.lv;
    try{ _stY=y1; let att=0,n=0,fb=0,pm=0,ad=0,up=0; for(const [d,a] of homeGames(tid,c.open,c.end)){ S.lv=stadLvAt(S,d+off,lv0); const x=attOf(tid,a,d,null), v=stadYr(S); att+=x; fb+=x*.0003*(stadPower(S.lv.fnb)-2); pm+=v.prem; ad+=v.ad; up+=v.up; n++; } att=Math.round(att);
    return {att,n,avg:n?Math.round(att/n):0,ticket:Math.round(att*TICKET*ecoIdx(y1)*PRICE[S.price].m), /* 다음 시즌 표값·구장 나이(검수 11-06) */fnb:Math.round(fb),prem:Math.round(n?pm/n:0),ad:Math.round(n?ad/n:0),up:Math.round(n?up/n:0)}; } finally{ _stY=null; Object.assign(S,keep); } }
  const A=(G.sea&&G.sea.att&&G.sea.att[tid])||{n:0,sum:0}; let rest=0, rn=0;
  let done=A.sum, dn=A.n;
  let restFb=0; if(c&&c.sched){ const lv0=S.lv; try{ for(const [d,a] of homeGames(tid,Math.max(G.day+1,c.open),c.end)){ S.lv=stadLvAt(S,d,lv0); const x=attOf(tid,a,d,null); rest+=x; restFb+=x*.0003*(stadPower(S.lv.fnb)-2); rn++; } } finally{ S.lv=lv0; } /* 공사 중인 관람석·전광판·프리미엄석(좌석 감소)·매점은 완공 뒤 경기부터(검수 11-09y) */
    /* 예전 저장본처럼 시즌 중간부터 집계된 경우: 이미 치른 홈경기 수에 맞춰 늘린다 */
    const to=Math.min(G.day,c.end), pend=(G.makeup||[]).filter(x=>x.y===G.year&&x.h===tid&&x.d>=c.open&&x.d<=to&&(c.sched[x.d]||[]).some(([h,a])=>h===x.h&&a===x.a)).length; /* 미룬 경기: 원래 날짜 일정에 남아 있지만 아직 열리지 않았다. 재편성 경기로 따로 세므로 치른 경기에서 뺀다(검수 150) */ const played=homeGames(tid,c.open,to).length-pend; if(played>dn){ if(dn>0){ done=A.sum/dn*played; } else { done=0; for(const [d,a] of homeGames(tid,c.open,Math.min(G.day,c.end)))done+=attOf(tid,a,d,null); } dn=played; } }
  const att=Math.round(done+rest); const n=dn+rn;
  /* 수입 = 이미 치른 경기에서 그때 가격으로 번 돈 + 남은 경기 예상(지금 가격). 경기별 수입 기록이 없는 예전 저장은 지금 가격으로 본다 */
  const tkNow=TICKET*ecoIdx()*PRICE[S.price].m, fbNow=.0003*(stadPower(S.lv.fnb)-2); const sc=A.n>0?done/A.sum:1; const hasR=A.tk!=null&&A.n>0&&A.sum>0;
  const tkDone=hasR?A.tk*sc:done*tkNow, fbDone=hasR?(A.fb||0)*sc:done*fbNow;
  const v=stadYr(S); let yr=v; if(A.pn!=null){ const hg=stadHG(tid), left=Math.max(0,hg-A.pn); yr={prem:A.pm+v.prem*left/hg,ad:A.ad+v.ad*left/hg,up:A.up+v.up*left/hg}; } /* 치른 경기는 그때 단계, 남은 경기는 지금 단계 */
  if(c&&c.sched)for(const b of (S.build||[])){ const l0=S.lv[b.k]; if(!(b.lv>l0))continue; S.lv[b.k]=b.lv; const v2=stadYr(S); S.lv[b.k]=l0; const m=homeGames(tid,Math.max(b.done,G.day+1,c.open),c.end).length/stadHG(tid); yr={prem:yr.prem+(v2.prem-v.prem)*m,ad:yr.ad+(v2.ad-v.ad)*m,up:yr.up+(v2.up-v.up)*m}; } /* 공사 중인 시설은 완공 뒤 홈경기 몫만큼(검수 11-08) */
  return {att,n,avg:n?Math.round(att/n):0,ticket:Math.round(tkDone+rest*tkNow),fnb:Math.round(fbDone+restFb),prem:Math.round(yr.prem),ad:Math.round(yr.ad),up:Math.round(yr.up)}; }
/* 구장 공사 시작 가능 기간: 정규시즌이 끝난 뒤부터 2월 말까지(3월은 개막 준비) */
function stadWindow(){ const per=period(); if(per==='season'||per==='post')return false; return !(per==='pre'&&dobj(G.day).m>=3); }
/* 담장 공사(사용자 요청 11-11): 좌·중·우 담장 거리와 높이를 바꾼다. 홈런 지수(parkHRM)로 실제 경기의 홈런·담장 맞는 2루타가 달라진다.
   범위는 공인 야구규칙 권고(양 옆 99m·가운데 122m 안팎)를 중심으로 KBO 구장 실제 폭(좌우 95~101m, 가운데 120~125m, 높이 2.4~8m)을 넉넉히 감쌌다. 비시즌(10월~2월)에 한 해 한 번, 공사비를 낸다 */
const FENCE_LIM={lf:[95,105],cf:[115,128],rf:[95,105],wl:[2,8],wc:[2,8],wr:[2,8]};
function fenceNorm(d){ const o={}; for(const k in FENCE_LIM){ const v=+d[k]; if(!Number.isFinite(v))return null; o[k]=Math.round(clamp(v,FENCE_LIM[k][0],FENCE_LIM[k][1])*10)/10; } return o; }
function fenceCost(from,to){ let c=1000; for(const k of ['lf','cf','rf'])c+=Math.abs(to[k]-from[k])*100; for(const k of ['wl','wc','wr'])c+=Math.abs(to[k]-from[k])*150; return Math.round(c*ecoIdx()/10)*10; } /* 기본 10억 + 거리 1m당 1억, 높이 1m당 1.5억 */
function fenceIdx(tid,D){ const S=stadOf(tid), keep=S.dim; S.dim=D; _pkN={k:null}; const r={R:parkHRM(tid,'R'),L:parkHRM(tid,'L')}; if(keep)S.dim=keep; else delete S.dim; _pkN={k:null}; return r; }
function fenceSet(d){ const tid=G.user, S=stadOf(tid); const to=fenceNorm(d); if(!to)return '숫자로 입력하세요.'; const from=stadDim(tid); if(Object.keys(to).every(k=>to[k]===from[k]))return '바뀐 치수가 없습니다.';
  if(!stadWindow())return '담장 공사는 시즌이 끝난 뒤(10월~2월)에만 할 수 있습니다.'; if(S.fenceY===sponSeason())return '담장 공사는 한 해에 한 번만 할 수 있습니다.';
  const c=fenceCost(from,to); if(spendable(tid)<c)return `자금이 부족합니다(${spendTxt()}). 공사비 ${money(c)}이 필요합니다.`;
  const k0=spendPay(c); G.spend.stad=(G.spend.stad||0)+k0; S.dim=to; S.fenceY=sponSeason(); (S.fenceH=S.fenceH||[]).push({y:G.year,d:G.day,from,to,c}); _pkN={k:null};
  const ix=fenceIdx(tid,to); try{ clubFacilityHistory('stad',tid,`${stadName(tid)} 담장`,'공사',{c}); }catch(e){} addLog(`${stadName(tid)} 담장 공사: 좌 ${to.lf}·중 ${to.cf}·우 ${to.rf}m, 높이 ${to.wl}·${to.wc}·${to.wr}m(공사비 ${money(c)}). 홈런 지수 우타 ${Math.round(ix.R*100)} · 좌타 ${Math.round(ix.L*100)}.`); return ''; }
function stadStart(k){ const S=stadOf(G.user); const it=STAD_ITEMS.find(x=>x.k===k); if(!it)return '없는 시설입니다.'; const lv=S.lv[k];
  if(lv>=STAD_MAX)return '이미 최고 단계입니다.'; if((S.build||[]).some(b=>b.k===k))return '이미 공사 중입니다.';
  if(!stadWindow())return '구장 공사는 시즌이 끝난 뒤(10월~2월)에만 시작할 수 있습니다.';
  const c=STAD_COST[lv+1]; const t=team(G.user); if(spendable(G.user)<c)return `자금이 부족합니다(${spendTxt()}). 공사비 ${money(c)}이 필요합니다.`; /* 독립구단의 결산 때 낼 신구장 분담금은 spendable이 뺀다 */
  const k0=spendPay(c); S.build=(S.build||[]).concat({k,lv:lv+1,done:G.day+STAD_DAYS[lv+1],c,sup:c-k0,ep:G.spEp}); G.spend.stad=(G.spend.stad||0)+k0; /* 구단주 지원 몫(sup)과 장부 회차: 취소 환급 때 현금이 아니라 장부로 되돌린다(검수 11-09zza) */
  clubFacilityHistory('stad',G.user,`${stadName(G.user)} ${it.l}`,'착공',S.build[S.build.length-1]); addLog(`${stadName(G.user)} ${it.l} ${lv+1}단계 공사를 시작했습니다(공사비 ${money(c)}, ${STAD_DAYS[lv+1]}일).`); return ''; }
function stadDaily(){ for(const t of G.teams){ const S=t.stad; if(!S||!S.build||!S.build.length)continue; S.build=S.build.filter(b=>{ if(G.day<b.done)return true; if((S.lv[b.k]||0)>=b.lv)return false; /* 이미 더 높은 단계(신구장 개장 등)면 낮추지 않는다 */ S.lv[b.k]=b.lv; const it=STAD_ITEMS.find(x=>x.k===b.k); clubFacilityHistory('stad',t.id,`${stadName(t.id)} ${it.l}`,'완공',{...b,c:b.totalC??b.c??STAD_COST[b.lv]}); if(t.id!==ME()){ wire('구장',`${t.city} ${t.nick}, ${it.l} ${b.lv}단계 공사 완공`,{tid:t.id}); return false; } /* 떠난 구단·야인 기간 전 구단은 리그 소식으로만(검수 11-09zza) */ { note('구장',`${it.l} ${b.lv}단계 공사가 끝났습니다.`); news('구단',`${t.city} ${t.nick}, ${it.l} 새단장`,`${stadName(t.id)}의 ${it.l}이(가) ${b.lv}단계로 바뀌었습니다. 팬들의 관람 환경이 좋아졌습니다.`,1); } return false; }); } }
function stadSeasonNote(){ const A=G.sea.att&&G.sea.att[G.user]; if(!A||!A.n)return; const cap=stadCap(G.user); const avg=Math.round(A.sum/A.n);
  const rk=G.teams.map(t=>{ const x=G.sea.att[t.id]; return {id:t.id,v:x&&x.n?x.sum/x.n:0}; }).sort((a,b)=>b.v-a.v).findIndex(x=>x.id===G.user)+1;
  mail('운영팀',`${G.year} 홈 관중 결산과 구장 공사`,`올해 ${stadName(G.user)} 홈 ${A.n}경기 관중은 ${A.sum.toLocaleString('ko-KR')}명, 경기당 ${avg.toLocaleString('ko-KR')}명(좌석 점유율 ${Math.min(100,Math.round(A.cap?A.sum/A.cap*100:avg/cap*100))}%, 리그 ${rk}위)입니다. 매진 ${A.so}회.\n\n구장 시설 공사는 지금부터 2월까지 시작할 수 있습니다. 관람석을 고치면 관중이, 매장과 프리미엄석을 늘리면 1인당 수입이 오릅니다.`,{kind:'구장',acts:[{l:'구장 관리',a:'go',v:'club:stad'}]}); }
/* ===== 신구장 건립 =====
   실제로 신구장은 지자체가 짓고 구단이 일부를 분담한다(예: 2025년 개장한 대전 신구장). 게임에서는
   1) 지자체 협상(6개월) → 2) 규모 선택 → 3) 3년 공사(분담금 3년 분납) → 4) 개장 */
const NEWSTAD=[{k:'mid',l:'실속형',cap:21000,cost:9000,d:'개장 때 실제 수용 2만1천 석(프리미엄석 4단계 포함). 분담금 90억(3년 분납).'},{k:'big',l:'대형',cap:25000,cost:16000,d:'개장 때 실제 수용 2만5천 석(프리미엄석 4단계 포함). 분담금 160억(3년 분납). 관중이 많은 구단에 유리합니다.'},{k:'dome',l:'돔구장',cap:23000,cost:28000,d:'개장 때 실제 수용 2만3천 석 돔(프리미엄석 4단계 포함). 분담금 280억(3년 분납). 날씨와 더위에 상관없이 관중이 오고(+6%), 비시즌 공연·행사 대관으로 연 25억 안팎을 더 법니다.'}];
function newStadCan(){ const S=stadOf(G.user); return !S.proj&&G.year-stadBuilt(G.user)>=20&&!(S.retry&&G.year<S.retry); }
function newStadTalk(){ const S=stadOf(G.user); if(!newStadCan())return S.retry&&G.year<S.retry&&!S.proj?`신구장 협상은 ${S.retry}년에 다시 시도할 수 있습니다.`:'지금은 신구장 협상을 시작할 수 없습니다(개장 20년 이상 구장만).'; const t=team(G.user);
  if(t.trust<45)return `구단주 신뢰(${t.trust})가 45 이상이어야 구단주가 지자체 협상을 허락합니다.`;
  S.proj={stage:'talk',start:G.day,res:G.day+180}; addLog(`${team(G.user).city}시와 신구장 건립 협상을 시작했습니다. 결과는 ${dmd(G.day+180)}쯤 나옵니다.`);
  news('구단',`${t.city} ${t.nick}, 신구장 건립 추진`,`${stadName(G.user)} 개장 ${G.year-stadBuilt(G.user)}년. 구단이 ${t.city}시와 신구장 협상에 들어갔습니다.`,1); return ''; }
/* 신구장 사업은 구단 몫이다: 단장이 떠나도 협상·공사는 그 구단(AI)이 이어서 마친다 */
function newStadDaily(){ for(const t of G.teams){ if(t.stad&&t.stad.proj)try{ newStadTeam(t.id); }catch(e){} } }
function newStadTeam(tid){ const S=stadOf(tid); const N=S.proj; if(!N)return; const t=team(tid); const me=tid===ME();
  if(!me&&N.stage==='plan'){ const o=NEWSTAD[0]; if(t.indie&&spendable(tid)<Math.round(o.cost/3)){ S.proj=null; S.retry=G.year+1; wire('구장',`${t.city} ${t.nick}, 신구장 착공 자금 부족으로 보류`,{tid}); return; } /* 독립구단은 단장이 있든 없든 첫 분담금을 낼 현금이 있어야 착공(검수 11-06) */ N.stage='build'; N.k=o.k; N.cap=o.cap; N.cost=o.cost; N.paid=N.paid||0; const y=dobj(G.day).m>=10?G.year+4:G.year+3; N.done=dnum(y,3,1); clubFacilityHistory('stad',tid,`신구장 ${o.l}`,'착공',{c:N.cost,costLabel:'구단 분담금',done:N.done,cap:N.cap}); wire('구장',`${t.city} ${t.nick}, 신구장 ${o.l} 규모로 착공`,{tid}); return; } /* 단장이 없는 구단은 실속형으로 정한다 */
  if(N.stage==='talk'&&G.day>=N.res){ const pr=clamp(.35+(t.trust-50)/100+(t.market-1)*.6+((me?G.rep:50)-50)/200,.15,.85);
    if(!me){ if(R()<pr)N.stage='plan'; else { S.proj=null; S.retry=G.year+1; } return; }
    if(R()<pr){ N.stage='plan'; stop('구장',`${t.city}시가 신구장 건립에 합의했습니다. 시가 공사비 대부분을 내고 구단이 일부를 분담합니다. 구단·재정 → 시설 투자 → 신구장에서 규모를 고르세요.`); news('구단',`${t.city}시-${t.nick}, 신구장 건립 합의`,'새 야구장 시대가 열립니다.',2); }
    else { S.proj=null; S.retry=G.year+1; stop('구장',`${t.city}시와의 신구장 협상이 결렬됐습니다. 시 재정 여건이 이유입니다. 내년에 다시 시도할 수 있습니다.`); } }
  if(N.stage==='build'&&G.day>=N.done){ S.cap=N.cap; S.built=G.year; (S.names=S.names||[]).push({until:G.day,n:stadName(t.id)}); /* 옛 구장 이름: 지난 경기 장소 표시용 */ S.name=N.k==='dome'?`${t.city} 돔구장`:`${t.city} 새 야구장`; S.dome=N.k==='dome'; /* 돔이 아닌 신구장으로 바꾸면 돔 효과도 끝 */ for(const k of Object.keys(S.lv))S.lv[k]=Math.max(S.lv[k],4);
    /* 옛 구장에서 진행 중이던 시설 공사: 새 구장 기본 단계(4) 이하가 목표면 취소하고 남은 공사 기간만큼 환급, 그보다 높으면 새 구장에서 이어서 진행 */
    { const can=[], go=[]; S.build=(S.build||[]).filter(b=>{ if(b.lv>S.lv[b.k]){ go.push(b); return true; } const c=b.c??STAD_COST[b.lv]; const r=Math.round(c*clamp((b.done-G.day)/Math.max(1,STAD_DAYS[b.lv]),0,1)); stadRefund(t,b,r); can.push([b,r]); return false; });
      if(me&&(can.length||go.length)){ const nm=b=>STAD_ITEMS.find(x=>x.k===b.k).l; mail('운영팀','신구장 개장: 옛 구장 공사 정리',`${can.length?`새 구장 시설(4단계 이상)에 포함돼 취소한 공사: ${can.map(([b,r])=>`${nm(b)} ${b.lv}단계(남은 공사분 ${money(r)} 환급)`).join(', ')}.`:''}${go.length?`${can.length?'\n':''}새 구장에서 이어서 진행하는 공사: ${go.map(b=>`${nm(b)} ${b.lv}단계(${dmd(b.done)} 완공)`).join(', ')}.`:''}`,{kind:'구장'}); } }
    S.cap=N.cap+(stadPower(S.lv.prem)-2)*300; /* 고를 때 안내한 좌석 수 = 개장 때 실제 수용(프리미엄석 4단계로 줄어드는 일반석만큼 기준을 늘려 둔다). 이후 프리미엄석을 더 늘리면 그만큼 줄어든다 */ if((N.paid||0)<N.cost)S.debt={cost:N.cost,paid:N.paid||0}; /* 개장 때 남은 분담금은 계속 낸다(검수 11-06) */ S.proj=null; t.pop=clamp(t.pop+.08,.7,1.45);
    clubFacilityHistory('stad',tid,S.name,'개장',{c:N.cost,costLabel:'구단 분담금',done:N.done,cap:N.cap}); if(!me){ wire('구장',`${S.name} 개장 (${N.cap.toLocaleString('ko-KR')}석)`,{tid}); return; }
    stop('구장',`${S.name}이(가) 문을 열었습니다. ${N.cap.toLocaleString('ko-KR')}석, 시설은 모두 4단계 이상입니다. 개장 첫 몇 해는 관중이 크게 늡니다.`); news('구단',`${S.name} 개장`,`${t.city} ${t.nick}의 새 홈구장이 문을 열었습니다.`,3); } }
/* 취소한 공사 환급: 지원 예산으로 낸 몫은 아직 결산 전 같은 장부면 장부에서 빼고, 나머지만 현금으로(검수 11-09zza: 지원 예산 공사를 취소하면 현금이 생기던 것) */
function stadRefund(t,b,r){ const sr=b.sup>0&&t.id===ME()&&b.ep===G.spEp?Math.min(G.spend.etc||0,Math.round(r*b.sup/Math.max(1,b.c))):0; if(sr)G.spend.etc-=sr; t.cash+=r-sr; if(t.id===ME()&&G.spend&&G.spend.stad>0)G.spend.stad=Math.max(0,G.spend.stad-Math.min(r-sr,Math.round(r*(1-(b.sup||0)/Math.max(1,b.c))))); } /* 현금으로 돌려받은 몫은 재정 화면의 현금 투자액에서도 뺀다(검수 151) */
function newStadPick(k){ const S=stadOf(G.user); const N=S.proj; const o=NEWSTAD.find(x=>x.k===k); if(!N||N.stage!=='plan'||!o)return '선택할 수 없습니다.'; { const t=team(G.user), first=Math.round(o.cost/3); if(t.indie&&spendable(G.user)<first)return `모기업 출자가 없는 독립구단은 첫 회차 분담금 ${money(first)}을(를) 구단 현금으로 낼 수 있어야 착공할 수 있습니다(${spendTxt()}). 분담금은 결산 때 3년에 나눠 냅니다.`; } /* 검수 11-06 */
  N.stage='build'; N.k=k; N.cap=o.cap; N.cost=o.cost; N.paid=0; const y=dobj(G.day).m>=10?G.year+4:G.year+3; N.done=dnum(y,3,1); clubFacilityHistory('stad',G.user,`신구장 ${o.l}`,'착공',{c:N.cost,costLabel:'구단 분담금',done:N.done,cap:N.cap}); addLog(`신구장 ${o.l} 규모로 착공했습니다. ${dmd(N.done)} ${y}년 개장 예정.`); return ''; }
/* 분담금은 결산 때 3년에 나눠 낸다 */
function newStadAcct(tid){ const S=stadOf(tid); const N=S.proj; return N&&N.stage==='build'?N:S.debt&&S.debt.paid<S.debt.cost?S.debt:null; }
function newStadDue(tid){ const N=newStadAcct(tid); if(!N)return 0; const n=Math.round(N.cost/3), left=N.cost-(N.paid||0); return left<=n*1.5?left:n; } /* 마지막 회차는 반올림 잔액까지(검수 11-06: 160억 중 100만 원이 남아 사라졌다) */

/* AI 구단: 돈이 넉넉하면 비시즌에 시설 하나를 손본다 */
function stadAI(){ for(const t of G.teams){ if(t.id===ME())continue; /* 야인 기간 전 구단도 AI가 운영(검수 11-09zza) */ const S=stadOf(t.id), cash=spendable(t.id); /* 독립구단은 결산 때 낼 신구장 분담금을 남긴다(검수 11-09zza) */ if(cash<6000||R()>.35)continue; const k=pick(['seat','fnb','vis','prem','turf']); if((S.build||[]).some(b=>b.k===k))continue; /* 진행 중인 공사가 있으면 같은 시설은 다시 발주하지 않는다 */ const lv=S.lv[k]; if(lv>=(cash>=15000?8:cash>=9000?6:4))continue; /* 돈이 많은 구단은 더 높게(우리 상한 12) */ const c=STAD_COST[lv+1]; if(cash-c<0)continue; t.cash-=c; S.build=(S.build||[]).concat({k,lv:lv+1,done:G.day+STAD_DAYS[lv+1],c}); clubFacilityHistory('stad',t.id,`${stadName(t.id)} ${STAD_ITEMS.find(x=>x.k===k).l}`,'착공',S.build[S.build.length-1]); } }
function starIncome(tid){ return Math.round(teamStar(tid).v*14*team(tid??G.user).market)+smBonus(tid??G.user); } /* 스타 마케팅 캠페인 몫 포함 */

function starAwardsNews(){ const T=teamStar(G.user); const L=T.L.filter(x=>x.s>=25); if(!L.length)return; prInit(); const t=team(G.user);
  news('구단',`${t.city} ${t.nick}, ${L.map(x=>x.p.name).join('·')} 앞세운 스타 마케팅`,`수상과 활약으로 이름값이 오른 선수들의 유니폼과 광고 수요가 늘고 있습니다. 내년 스타 마케팅 수입 예상 ${money(starIncome(G.user))}.`,2,{fanW:1});
  if(t.owner==='pr'){ t.trust=clamp(t.trust+2,0,100); note('구단주','홍보를 중시하는 구단주가 스타 선수들의 활약을 반깁니다. 구단주 신뢰 +2.'); } }

function mpickTraded(ids){ const P=G.mpick; const m=G.mgr[G.user]; if(!P||!P.back||P.y!==G.year||!m)return; const hit=ids.filter(id=>P.ids.includes(id)); if(!hit.length)return; m.rel=clamp(m.rel-6,0,100); P.ids=P.ids.filter(id=>!hit.includes(id));
  mail('감독실',`${m.name} 감독: "제가 키우던 선수를…"`,`함께 밀어주기로 한 선수를 트레이드했습니다. 감독 관계 -6.`,{kind:'감독',imp:true}); }

