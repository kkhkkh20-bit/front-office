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
function stadOf(tid){ const t=team(tid); if(!t.stad){ const r=k=>2+(hn('st'+k,tid)>.35?1:0); t.stad={lv:{seat:r('s'),fnb:r('f'),prem:r('p'),vis:r('v'),turf:r('t')},price:1,build:[]}; } if(t.stad.dome==null&&!t.stad.built&&/돔/.test(STAD_NM[tid]||''))t.stad.dome=true; /* 기본 고양 돔구장은 돔 */ return t.stad; }
function stadCap(tid){ const S=stadOf(tid); return Math.round((S.cap||STAD_CAP[tid])-(stadPower(S.lv.prem)-2)*300); }
function stadBuilt(tid){ const S=stadOf(tid); return S.built||STAD_BUILT[tid]||2000; }
/* 구장 연식 효과: 30년 넘으면 관람 환경이 낡아 수요 -4%, 새 구장은 개장 3년간 +12%에서 서서히 줄어든다, 공사 중 -2% */
function stadAgeF(tid){ const S=stadOf(tid); const age=G.year-stadBuilt(tid); let f=age>=30?.96:1; if(age<3)f*=1+.12*(3-age)/3+.04; const N=S.proj; if(N&&N.stage==='build')f*=.98; return f; }
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
function stadTurfM(tid){ return Math.max(.75,1-(stadPower(stadOf(tid).lv.turf)-2)*.05); }
function attOf(h,a,day,noise){ const t=team(h), S=stadOf(h), cap=stadCap(h); const r=G.sea&&G.sea.rec&&G.sea.rec[h]; const g=r?r.w+r.l:0; const wp=g>=10?r.w/g:.5;
  const o=dobj(day); const dow=o.w===6||o.w===0?1.28:o.w===5?1.08:.88; const opp=1+(team(a).market-1)*.35;
  const fan=h===G.user&&G.pr?(.9+G.pr.fan/500):1; const late=o.m>=8&&wp<.44?.9:1;
  const f=.84*Math.pow(t.market,.5)*(.82+.3*t.pop)*(.9+(wp-.5)*1.3)*fan*dow*opp*late*PRICE[S.price].dem*(1+(stadPower(S.lv.seat)-2)*.04)*(1+(stadPower(S.lv.vis)-2)*.015)*stadAgeF(h)*(S.dome?1.06:1);
  if(noise===null){ /* 기대 관중: 3점 가우스-에르미트 근사로 매진 상한까지 반영 */ const z=1.732*.2; return Math.round(cap*(Math.min(1,f*Math.exp(-z))/6+Math.min(1,f)*2/3+Math.min(1,f*Math.exp(z))/6)); }
  const n=Math.exp(N(0,.2)); return Math.min(cap,Math.round(cap*f*n)); }
function stadGame(day,h,a){ const cap=stadCap(h); let att=attOf(h,a,day); const ring=champRing(h);
  if(ring){ ring.ringDone=G.year; if(G.ringT===h)G.ringDone=G.year; att=cap; /* 우승 반지 수여식: 우승 구단 홈 개막전 매진(단장이 이직해도 우승 구단에서 연다) */ for(const p of playersOf(h))p.mor=clamp((p.mor??60)+3,0,100);
    if(h!==G.user||G.unemp)wire('구단',`${tshort(h)} 우승 반지 수여식, 홈 개막전 ${cap.toLocaleString('ko-KR')}석 매진`,{tid:h}); else news('구단',`${tshort(G.user)} 우승 반지 수여식…홈 개막전 ${cap.toLocaleString('ko-KR')}석 매진`,`경기 전 지난 시즌 우승 멤버들이 반지를 받았습니다. 전광판에는 우승 순간이 다시 흘렀고, 관중석은 빈자리 없이 들어찼습니다.`,2,{fanW:2}); } G.sea.att=G.sea.att||{}; const A=G.sea.att[h]||(G.sea.att[h]={n:0,sum:0,so:0,best:0});
  { const S=stadOf(h); A.tk=(A.tk||0)+att*TICKET*ecoIdx()*PRICE[S.price].m; A.fb=(A.fb||0)+att*.0003*(stadPower(S.lv.fnb)-2); } /* 그 경기 당시 표값·매점 수준으로 수입을 쌓는다(나중에 값을 바꿔도 지난 경기 수입은 그대로) */
  A.n++; A.sum+=att; A.cap=(A.cap||0)+cap; /* 경기 당시 좌석 수 합(점유율은 이것으로) */ if(att>=cap)A.so++; if(att>A.best)A.best=att; return {att,so:att>=cap}; }
function homeGames(tid,from,to){ const L=[]; for(let d=from;d<=to;d++){ const gs=G.cal.sched[d]; if(!gs)continue; for(const [h,a] of gs)if(h===tid)L.push([d,a]); } return L; }
/* 시즌 관중·구장 수입 전망: 지금까지 실제 + 남은 홈경기 예상 */
function stadProj(tid,next){ const S=stadOf(tid); const c=G.cal;
  /* 시즌이 끝난 뒤 예산 전망(next): 지난 일정에 지금 가격·시설을 넣어 다음 시즌 기대 관중을 낸다 */
  if(next&&c&&c.sched){ let att=0,n=0; for(const [d,a] of homeGames(tid,c.open,c.end)){ att+=attOf(tid,a,d,null); n++; } att=Math.round(att);
    return {att,n,avg:n?Math.round(att/n):0,ticket:Math.round(att*TICKET*ecoIdx()*PRICE[S.price].m),fnb:Math.round(att*.0003*(stadPower(S.lv.fnb)-2)),prem:(stadPower(S.lv.prem)-2)*600,ad:(stadPower(S.lv.vis)-2)*400+(S.dome?2500:0),up:sum(STAD_ITEMS.map(x=>STAD_UP[S.lv[x.k]]-STAD_UP[2]))}; }
  const A=(G.sea&&G.sea.att&&G.sea.att[tid])||{n:0,sum:0}; let rest=0, rn=0;
  let done=A.sum, dn=A.n;
  if(c&&c.sched){ for(const [d,a] of homeGames(tid,Math.max(G.day+1,c.open),c.end)){ rest+=attOf(tid,a,d,null); rn++; }
    /* 예전 저장본처럼 시즌 중간부터 집계된 경우: 이미 치른 홈경기 수에 맞춰 늘린다 */
    const played=homeGames(tid,c.open,Math.min(G.day,c.end)).length; if(played>dn){ if(dn>0){ done=A.sum/dn*played; } else { done=0; for(const [d,a] of homeGames(tid,c.open,Math.min(G.day,c.end)))done+=attOf(tid,a,d,null); } dn=played; } }
  const att=Math.round(done+rest); const n=dn+rn;
  /* 수입 = 이미 치른 경기에서 그때 가격으로 번 돈 + 남은 경기 예상(지금 가격). 경기별 수입 기록이 없는 예전 저장은 지금 가격으로 본다 */
  const tkNow=TICKET*ecoIdx()*PRICE[S.price].m, fbNow=.0003*(stadPower(S.lv.fnb)-2); const sc=A.n>0?done/A.sum:1; const hasR=A.tk!=null&&A.n>0&&A.sum>0;
  const tkDone=hasR?A.tk*sc:done*tkNow, fbDone=hasR?(A.fb||0)*sc:done*fbNow;
  return {att,n,avg:n?Math.round(att/n):0,ticket:Math.round(tkDone+rest*tkNow),fnb:Math.round(fbDone+rest*fbNow),prem:(stadPower(S.lv.prem)-2)*600,ad:(stadPower(S.lv.vis)-2)*400+(S.dome?2500:0),
    up:sum(STAD_ITEMS.map(x=>STAD_UP[S.lv[x.k]]-STAD_UP[2]))}; }
/* 구장 공사 시작 가능 기간: 정규시즌이 끝난 뒤부터 2월 말까지(3월은 개막 준비) */
function stadWindow(){ const per=period(); if(per==='season'||per==='post')return false; return !(per==='pre'&&dobj(G.day).m>=3); }
function stadStart(k){ const S=stadOf(G.user); const it=STAD_ITEMS.find(x=>x.k===k); if(!it)return '없는 시설입니다.'; const lv=S.lv[k];
  if(lv>=STAD_MAX)return '이미 최고 단계입니다.'; if((S.build||[]).some(b=>b.k===k))return '이미 공사 중입니다.';
  if(!stadWindow())return '구장 공사는 시즌이 끝난 뒤(10월~2월)에만 시작할 수 있습니다.';
  const c=STAD_COST[lv+1]; const t=team(G.user); if(t.cash<c)return `자금이 부족합니다. 공사비 ${money(c)}이 필요합니다.`;
  t.cash-=c; S.build=(S.build||[]).concat({k,lv:lv+1,done:G.day+STAD_DAYS[lv+1],c}); G.spend.stad=(G.spend.stad||0)+c;
  addLog(`${stadName(G.user)} ${it.l} ${lv+1}단계 공사를 시작했습니다(공사비 ${money(c)}, ${STAD_DAYS[lv+1]}일).`); return ''; }
function stadDaily(){ for(const t of G.teams){ const S=t.stad; if(!S||!S.build||!S.build.length)continue; S.build=S.build.filter(b=>{ if(G.day<b.done)return true; if((S.lv[b.k]||0)>=b.lv)return false; /* 이미 더 높은 단계(신구장 개장 등)면 낮추지 않는다 */ S.lv[b.k]=b.lv; if(t.id===G.user){ const it=STAD_ITEMS.find(x=>x.k===b.k); chron('stad',`${it.l} ${b.lv}단계 완공`); note('구장',`${it.l} ${b.lv}단계 공사가 끝났습니다.`); news('구단',`${t.city} ${t.nick}, ${it.l} 새단장`,`${stadName(t.id)}의 ${it.l}이(가) ${b.lv}단계로 바뀌었습니다. 팬들의 관람 환경이 좋아졌습니다.`,1); } return false; }); } }
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
  if(!me&&N.stage==='plan'){ const o=NEWSTAD[0]; N.stage='build'; N.k=o.k; N.cap=o.cap; N.cost=o.cost; N.paid=N.paid||0; const y=dobj(G.day).m>=10?G.year+4:G.year+3; N.done=dnum(y,3,1); wire('구장',`${t.city} ${t.nick}, 신구장 ${o.l} 규모로 착공`,{tid}); return; } /* 단장이 없는 구단은 실속형으로 정한다 */
  if(N.stage==='talk'&&G.day>=N.res){ const pr=clamp(.35+(t.trust-50)/100+(t.market-1)*.6+((me?G.rep:50)-50)/200,.15,.85);
    if(!me){ if(R()<pr)N.stage='plan'; else { S.proj=null; S.retry=G.year+1; } return; }
    if(R()<pr){ N.stage='plan'; stop('구장',`${t.city}시가 신구장 건립에 합의했습니다. 시가 공사비 대부분을 내고 구단이 일부를 분담합니다. 구단·재정 → 시설 투자 → 신구장에서 규모를 고르세요.`); news('구단',`${t.city}시-${t.nick}, 신구장 건립 합의`,'새 야구장 시대가 열립니다.',2); }
    else { S.proj=null; S.retry=G.year+1; stop('구장',`${t.city}시와의 신구장 협상이 결렬됐습니다. 시 재정 여건이 이유입니다. 내년에 다시 시도할 수 있습니다.`); } }
  if(N.stage==='build'&&G.day>=N.done){ S.cap=N.cap; S.built=G.year; S.name=N.k==='dome'?`${t.city} 돔구장`:`${t.city} 새 야구장`; S.dome=N.k==='dome'; /* 돔이 아닌 신구장으로 바꾸면 돔 효과도 끝 */ for(const k of Object.keys(S.lv))S.lv[k]=Math.max(S.lv[k],4);
    /* 옛 구장에서 진행 중이던 시설 공사: 새 구장 기본 단계(4) 이하가 목표면 취소하고 남은 공사 기간만큼 환급, 그보다 높으면 새 구장에서 이어서 진행 */
    { const can=[], go=[]; S.build=(S.build||[]).filter(b=>{ if(b.lv>S.lv[b.k]){ go.push(b); return true; } const c=b.c??STAD_COST[b.lv]; const r=Math.round(c*clamp((b.done-G.day)/Math.max(1,STAD_DAYS[b.lv]),0,1)); t.cash+=r; can.push([b,r]); return false; });
      if(me&&(can.length||go.length)){ const nm=b=>STAD_ITEMS.find(x=>x.k===b.k).l; mail('운영팀','신구장 개장: 옛 구장 공사 정리',`${can.length?`새 구장 시설(4단계 이상)에 포함돼 취소한 공사: ${can.map(([b,r])=>`${nm(b)} ${b.lv}단계(남은 공사분 ${money(r)} 환급)`).join(', ')}.`:''}${go.length?`${can.length?'\n':''}새 구장에서 이어서 진행하는 공사: ${go.map(b=>`${nm(b)} ${b.lv}단계(${dmd(b.done)} 완공)`).join(', ')}.`:''}`,{kind:'구장'}); } }
    S.cap=N.cap+(stadPower(S.lv.prem)-2)*300; /* 고를 때 안내한 좌석 수 = 개장 때 실제 수용(프리미엄석 4단계로 줄어드는 일반석만큼 기준을 늘려 둔다). 이후 프리미엄석을 더 늘리면 그만큼 줄어든다 */ S.proj=null; t.pop=clamp(t.pop+.08,.7,1.45);
    if(!me){ wire('구장',`${S.name} 개장 (${N.cap.toLocaleString('ko-KR')}석)`,{tid}); return; }
    chron('stad',`${S.name} 개장 (${N.cap.toLocaleString('ko-KR')}석)`);
    stop('구장',`${S.name}이(가) 문을 열었습니다. ${N.cap.toLocaleString('ko-KR')}석, 시설은 모두 4단계 이상입니다. 개장 첫 몇 해는 관중이 크게 늡니다.`); news('구단',`${S.name} 개장`,`${t.city} ${t.nick}의 새 홈구장이 문을 열었습니다.`,3); } }
function newStadPick(k){ const S=stadOf(G.user); const N=S.proj; const o=NEWSTAD.find(x=>x.k===k); if(!N||N.stage!=='plan'||!o)return '선택할 수 없습니다.';
  N.stage='build'; N.k=k; N.cap=o.cap; N.cost=o.cost; N.paid=0; const y=dobj(G.day).m>=10?G.year+4:G.year+3; N.done=dnum(y,3,1); addLog(`신구장 ${o.l} 규모로 착공했습니다. ${dmd(N.done)} ${y}년 개장 예정.`); return ''; }
/* 분담금은 결산 때 3년에 나눠 낸다 */
function newStadDue(tid){ const S=stadOf(tid); const N=S.proj; if(!N||N.stage!=='build')return 0; const n=Math.round(N.cost/3), left=N.cost-(N.paid||0); return left<=n*1.5?left:n; } /* 마지막 회차는 반올림 잔액까지(검수 11-06: 160억 중 100만 원이 남아 사라졌다) */

/* AI 구단: 돈이 넉넉하면 비시즌에 시설 하나를 손본다 */
function stadAI(){ for(const t of G.teams){ if(t.id===G.user)continue; const S=stadOf(t.id); if(t.cash<6000||R()>.35)continue; const k=pick(['seat','fnb','vis','prem','turf']); if((S.build||[]).some(b=>b.k===k))continue; /* 진행 중인 공사가 있으면 같은 시설은 다시 발주하지 않는다 */ const lv=S.lv[k]; if(lv>=(t.cash>=15000?8:t.cash>=9000?6:4))continue; /* 돈이 많은 구단은 더 높게(우리 상한 12) */ const c=STAD_COST[lv+1]; t.cash-=c; S.build=(S.build||[]).concat({k,lv:lv+1,done:G.day+STAD_DAYS[lv+1]}); } }
function starIncome(tid){ return Math.round(teamStar(tid).v*14*team(tid??G.user).market)+smBonus(tid??G.user); } /* 스타 마케팅 캠페인 몫 포함 */

function starAwardsNews(){ const T=teamStar(G.user); const L=T.L.filter(x=>x.s>=25); if(!L.length)return; prInit(); const t=team(G.user);
  news('구단',`${t.city} ${t.nick}, ${L.map(x=>x.p.name).join('·')} 앞세운 스타 마케팅`,`수상과 활약으로 이름값이 오른 선수들의 유니폼과 광고 수요가 늘고 있습니다. 내년 스타 마케팅 수입 예상 ${money(starIncome(G.user))}.`,2,{fanW:1});
  if(t.owner==='pr'){ t.trust=clamp(t.trust+2,0,100); note('구단주','홍보를 중시하는 구단주가 스타 선수들의 활약을 반깁니다. 구단주 신뢰 +2.'); } }

function mpickTraded(ids){ const P=G.mpick; const m=G.mgr[G.user]; if(!P||!P.back||P.y!==G.year||!m)return; const hit=ids.filter(id=>P.ids.includes(id)); if(!hit.length)return; m.rel=clamp(m.rel-6,0,100); P.ids=P.ids.filter(id=>!hit.includes(id));
  mail('감독실',`${m.name} 감독: "제가 키우던 선수를…"`,`함께 밀어주기로 한 선수를 트레이드했습니다. 감독 관계 -6.`,{kind:'감독',imp:true}); }

