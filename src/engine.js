'use strict';
/* ===== 기본 도구 ===== */
const R=Math.random;
const rnd=(a,b)=>a+R()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const gauss=()=>{let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
const N=(m,s)=>m+gauss()*s;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pick=a=>a[Math.floor(R()*a.length)];
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const sum=a=>a.reduce((s,x)=>s+x,0);
const r5=x=>Math.round(x/5)*5;
const rr=x=>Math.floor(x)+(R()<x-Math.floor(x)?1:0);
function hn(a,b){ // 고정된 정규 잡음: 같은 평가자·같은 선수면 같은 오차
  let h=2166136261>>>0;const s=a+'|'+b;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
  const u1=(h%9973+1)/9974; h=Math.imul(h^(h>>>15),2246822507)>>>0; const u2=(h%9967+1)/9968;
  return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
}

/* ===== 리그 규정 (KBO 실제 규정을 단순화, 2029년 이후 상한액은 가정) ===== */
const REG=['수도권','영남','호남·충청'];
/* 경쟁균형세 상한: 2026~2028년은 KBO 이사회 결정(매년 5%). 2029년부터는 게임 안 이사회가 매년 12월 리그 연봉 상황을 보고 정한다 */
function capOf(y){ if(y<=2026)return 14397; if(y===2027)return 15117; if(y===2028)return 15873; if(typeof G!=='undefined'&&G&&G.capY){ if(G.capY[y])return G.capY[y]; const ks=Object.keys(G.capY).map(Number).filter(k=>k<y).sort((a,b)=>b-a); if(ks.length)return Math.round(G.capY[ks[0]]*Math.pow(1.03,y-ks[0])); } return Math.round(15873*Math.pow(1.03,y-2028)); }
function floorOf(y){ return Math.round(6065*capOf(y)/14397); }
const MIN_SAL=30;            // 3,000만원 (금액 단위: 백만원)
const ROSTER_MAX=68, ROSTER_MIN=45; // KBO 소속선수 한도: 2025년까지 65명, 2026년 68명으로 확대
/* 1군 엔트리(KBO 2026: 29명, 8월 25일부터 4명 확대, 말소 후 10일 뒤 재등록)와 육성선수 */
const ENTRY_BASE=29, ENTRY_EXP=4, YS_MAX=15;
const rosterN=tid=>playersOf(tid).filter(p=>!p.ys).length;
const ysN=tid=>playersOf(tid).filter(p=>p.ys).length;
const FA_SVC=8; // 고졸 8시즌, 대졸 7시즌 (2022시즌 종료 후 적용)
const faSvc=p=>p&&p.college?7:FA_SVC;
const DRAFT_ROUNDS=11, DRAFT_POOL=140;
const BONUS=[250,120,70,50,40,35,30,30,30,30,30];
const SCOUT_SAL=[0,60,90,130,180,250];
const SCOUT_SD=[13,9.5,7.5,5.5,4.2,3];
const USD=14;                // 1만 달러 = 약 1,400만원 (100만 달러 = 약 14억)
const F_NEW_CAP=100*USD, F_TOTAL_CAP=400*USD, ASIA_CAP=20*USD;
function fCap(tid){ return F_TOTAL_CAP+10*USD*sum(foreignOf(tid).filter(x=>x.foreign==='용병').map(x=>x.rsy||0)); }
const F_REPL_MAX=2;          // 시즌 중 외국인 교체 횟수 (게임 설정)

const TEAM_DEF=[
  {city:'서울',nick:'코메츠',code:'SC',hue:241,market:1.25,region:'수도권'},
  {city:'서울',nick:'하운즈',code:'SH',hue:337,market:1.2,region:'수도권'},
  {city:'인천',nick:'시걸스',code:'IS',hue:350,market:1.0,region:'수도권'},
  {city:'수원',nick:'스파크스',code:'SS',hue:0,market:.95,region:'수도권'},
  {city:'고양',nick:'스톰',code:'GS',hue:345,market:.85,region:'수도권',indie:true},
  {city:'대전',nick:'레드폭스',code:'DR',hue:15,market:.9,region:'호남·충청'},
  {city:'광주',nick:'블레이즈',code:'GB',hue:357,market:1.0,region:'호남·충청'},
  {city:'대구',nick:'썬더스',code:'DT',hue:206,market:1.05,region:'영남'},
  {city:'부산',nick:'웨이브스',code:'BW',hue:215,market:1.15,region:'영남'},
  {city:'창원',nick:'앵커스',code:'CA',hue:217,market:.8,region:'영남'},
];
/* 구단 색: 같은 지역 실제 프로야구단의 상징색 (주색·보조색·어두운 바탕·밝은 강조)
   서울 코메츠=두산(네이비), 서울 하운즈=LG(분홍·검정), 인천=SSG(카디널 레드), 수원=kt(검정·빨강), 고양=키움(버건디),
   대전=한화(오렌지), 광주=KIA(빨강·남색), 대구=삼성(파랑), 부산=롯데(네이비), 창원=NC(마린 블루) */
const TPAL={SC:['#131230','#ffffff','#09091a','#4b5fd6'],SH:['#C7004E','#111111','#2b0011','#ff3f88'],IS:['#CE0E2D','#ffffff','#34040c','#ff4a5c'],SS:['#1a1a1a','#ED1B23','#000000','#ff3c3c'],GS:['#820024','#ffffff','#26000b','#d63361'],
  DR:['#F15A28','#1a1a1a','#3f1606','#ff7d47'],GB:['#ED1B23','#091330','#3b0507','#ff4048'],DT:['#0066B3','#A1A0A4','#002340','#2e92ec'],BW:['#041E42','#ffffff','#020c1a','#3d72d9'],CA:['#315288','#ffffff','#0f1b2f','#5d8ad6']};
function tpal(t){ if(t==null)return ['#4b5b6c','#e3e9ee','#26313c','#8a99aa']; if(typeof t==='number')t=(typeof G!=='undefined'&&G&&G.teams&&G.teams[t])||TEAM_DEF[t]; return (t&&TPAL[t.code])||[hslHex(t.hue,58,40),hslHex(t.hue,62,62),hslHex(t.hue,45,18),hslHex(t.hue,62,55)]; }
const OWNVOICE={win:'저는 가을야구를 기본으로 봅니다. 성적이 나면 지원은 아끼지 않겠습니다.',profit:'저는 적자를 가장 싫어합니다. 숫자로 보여 주세요.',pr:'관중이 꽉 찬 야구장을 보고 싶습니다. 화제가 되는 구단을 만들어 주세요.'};
const OWNER={
  win:{label:'성적 우선',msg:'구단주는 가을야구를 기본으로 봅니다.',w:[1.4,1.3,.5,.5]},
  profit:{label:'수익 우선',msg:'구단주는 적자를 가장 싫어합니다.',w:[.8,.7,1.8,.5]},
  pr:{label:'그룹 홍보 우선',msg:'구단주는 관중과 인기를 중요하게 봅니다.',w:[.9,.9,.6,1.6]},
};
const SUR='김이박최정강조윤장임한오서신권황안송류홍전고문손양배백허남심노하곽성차주우구민유나진지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국'.split('');
const G1='민서준도현우지성태재승동진영상형규호원석한세윤건시유은하주경범정희용인수기종'.split('');
const G2='호준우민혁수현진훈석빈원성규찬결율환섭철영욱범기완택열균식겸후언'.split('');
const BLOCK=new Set(['김현수','박찬호','이승엽','류현진','이대호','양현종','김광현','최정','강백호','이정후','김도영','구자욱','박병호','오지환','손아섭','안우진','문동주','원태인','노시환','김하성','송성문','최원태','박세웅','고영표','김원중','구승민','정수빈','박해민','김태균','이종범','선동열','장성호','양의지','강민호','나성범','최형우','김재환','한유섬','고우석','정우영','김혜성','이용규','카일 하트','에릭 페디','케이시 켈리','라이언 와이스']);
const FN={
  us:{nat:'미국',f:['제이크','라이언','타일러','카일','브랜든','조시','코디','에릭','데릭','맷','닉','크리스','저스틴','오스틴','케빈','트래비스','브렛','코너','헌터','잭'],l:['존슨','밀러','데이비스','윌리엄스','스미스','브라운','우드','켈러','리드','쿡','벨','파커','모리스','헤이스','그레이','스톤','웰스','포터','반스','하퍼']},
  la:{nat:'도미니카공화국',f:['루이스','호세','카를로스','미겔','라파엘','후안','페드로','안드레스','라몬','엔리케'],l:['가르시아','로드리게스','마르티네스','에르난데스','로페스','곤살레스','페레스','산체스','리베라','토레스','라미레스','플로레스','메히아','페냐','디아스']},
  ve:{nat:'베네수엘라',f:['루이스','호세','카를로스','미겔','라파엘','후안','헤수스','알레한드로'],l:['가르시아','로드리게스','마르티네스','에르난데스','로페스','곤살레스','페레스','산체스','리베라','토레스']},
  jp:{nat:'일본',f:['유마','겐타','쇼타','다이키','하루토','료','가이토','소타','렌','고타'],l:['다나카','사토','스즈키','다카하시','와타나베','이토','야마모토','나카무라','고바야시','가토'],rev:true},
  tw:{nat:'대만',f:['쯔웨이','보원','지하오','안러','웨이룬','청한'],l:['린','천','황','장','왕','우','차이'],rev:true},
  au:{nat:'호주',f:['잭','리암','노아','윌','톰','샘','루크'],l:['오닐','캠벨','해리스','월시','톰슨','켈리','머피']},
};

let G=null;
/* 해외 스카우트망: 지역별 정보 수준 0~3 */
const IREG={us:{l:'미국',lg:'MLB·트리플A',asia:false},la:{l:'중남미',lg:'멕시코리그·도미니카 윈터리그',asia:false},jp:{l:'일본',lg:'NPB',asia:true},tw:{l:'대만',lg:'CPBL',asia:true},au:{l:'호주',lg:'ABL',asia:true}};
/* 전력분석·데이터팀: 분석원을 사람으로 뽑아 배치한다(스카우트처럼). 역할 3가지
   상대 전력분석: 상대 타자별 수비 위치·투구 계획 → 실점 억제 / 트래킹 데이터: 장비 운용 → 선수 평가 정확도·랩 성장 / 영상 분석: 상대 투수 공략 → 타격 */
const AROLE={opp:{l:'상대 전력분석',d:'상대 타자별 수비 위치와 투구 계획을 짭니다. 실점이 줄어듭니다.'},trk:{l:'트래킹 데이터',d:'PTS·트랙맨·랩소도 자료를 다룹니다. 다른 구단 선수 평가가 정확해지고 피칭·타격 랩 효과가 커집니다.'},vid:{l:'영상 분석',d:'상대 투수의 버릇과 볼 배합을 분석합니다. 타자들의 공략이 좋아집니다.'}};
const ANA_SAL=[0,30,50,80,120,170], ANA_MAX=6;
function mkAnalyst(skill,role){ return {id:'a'+Math.floor(R()*1e9),name:genName(),age:ri(26,52),skill,role:role||pick(Object.keys(AROLE)),sal:ANA_SAL[skill],since:G.day}; }
function anaList(){ if(!G.analysts){ const lv=G.data&&G.data.lv!=null?G.data.lv:1; G.analysts=[]; const add=(r,k)=>G.analysts.push(Object.assign(mkAnalyst(k,r),{since:-999})); if(lv>=1){ add('opp',lv>=3?4:lv>=2?3:2); add('trk',lv>=3?4:lv>=2?3:2); add('vid',lv>=3?3:2); } } return G.analysts; }
function anaPow(role,tid){ if(tid==null)tid=G.user; if(tid!==G.user||G.unemp)return 2+(hn('ap'+role+(G.year>>1),tid)>.4?1:0);
  const L=anaList().filter(a=>a.role===role).map(a=>a.skill*(G.day-a.since<30?.5:1)).sort((a,b)=>b-a); return (L[0]||0)+(L[1]||0)*.6+(L[2]||0)*.3; } /* 새로 온 분석원은 30일 적응 기간 */
function anaEff(tid){ const o=anaPow('opp',tid), t=anaPow('trk',tid), v=anaPow('vid',tid); return {sdm:1-Math.min(.35,t*.045+v*.012),bab:Math.min(.007,o*.0008),bat:Math.min(.005,v*.0006),rep:clamp(Math.floor((o+v+t)/3),0,3)}; }
function dataLv(tid){ return anaEff(tid).rep; }
function anaSal(){ return sum(anaList().map(a=>a.sal)); }
function anaMarket(){ const mk=G.year*100+dobj(G.day).m; if(!G.amarket||G.amarketM!==mk){ const keep=(G.amarket||[]).filter(()=>R()<.4); G.amarket=keep; while(G.amarket.length<7){ const sk=R()<.08?5:R()<.2?4:R()<.45?3:R()<.75?2:1; G.amarket.push(mkAnalyst(sk)); } G.amarketM=mk; } return G.amarket; }
function hireAna(id){ const a=anaMarket().find(x=>x.id===id); if(!a)return '후보가 없습니다.'; if(anaList().length>=ANA_MAX)return `분석원은 ${ANA_MAX}명까지입니다.`; a.since=G.day; G.analysts.push(a); G.amarket=G.amarket.filter(x=>x.id!==id); addLog(`${AROLE[a.role].l} 분석원 ${a.name}(능력 ${a.skill})을(를) 연 ${money(a.sal)}에 채용했습니다.`); return ''; }
function fireAna(id){ const a=anaList().find(x=>x.id===id); if(!a)return ''; G.analysts=G.analysts.filter(x=>x.id!==id); addLog(`분석원 ${a.name}과(와) 계약을 정리했습니다.`); return ''; }
function setAnaRole(id,role){ const a=anaList().find(x=>x.id===id); if(!a||!AROLE[role])return ''; if(a.role!==role){ a.role=role; a.since=G.day; } return ''; } /* 역할을 바꾸면 다시 30일 적응 */
function dataReport(m){ if(G.unemp||!anaList().length)return; const lv=dataLv(G.user); const T=G.teams.map(t=>({tid:t.id,b:Object.assign({},ZB),p:Object.assign({},ZP)}));
  for(const p of Object.values(G.players)) for(const h of p.hist){ if(h.y!==G.year||h.lvl!=='1군'||h.t==null||!T[h.t])continue; const X=p.isP?T[h.t].p:T[h.t].b; for(const k in X)X[k]+=h[k]||0; }
  for(const t of T){ t.ops=bRate(t.b).ops; t.era=t.p.outs?t.p.er*27/t.p.outs:0; const bip=(t.p.outs-(t.p.so||0))+(t.p.h-(t.p.hr||0)); t.der=bip>0?(t.p.outs-(t.p.so||0))/bip:null; } const me=T.find(x=>x.tid===G.user); if(!me)return;
  const rk=(k,asc)=>{ const L=[...T].sort((a,b)=>asc?a[k]-b[k]:b[k]-a[k]); return L.findIndex(x=>x.tid===G.user)+1; };
  const lines=[`팀 타격 OPS ${fmt3(me.ops)} (리그 ${rk('ops')}위) · 팀 평균자책점 ${me.era.toFixed(2)} (${rk('era',true)}위)`];
  if(me.der!=null)lines.push(`수비 타구 처리율 ${fmt3(me.der)} (${rk('der')}위)`);
  try{ const SR=slotRanks(G.user); const ks=PSLOTS.filter(k=>k!=='DH'); const w=[...ks].sort((a,b)=>SR[b].rank-SR[a].rank).slice(0,lv>=2?2:1), st=[...ks].sort((a,b)=>SR[a].rank-SR[b].rank)[0]; lines.push(`가장 약한 자리: ${w.map(k=>`${SLOTK[k]}(리그 ${SR[k].rank}위)`).join(', ')} · 가장 강한 자리: ${SLOTK[st]}(${SR[st].rank}위)`); }catch(e){}
  if(lv>=2){ const ps=domestic(G.user).concat(foreignOf(G.user)).map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h&&(x.p.isP?x.h.outs>=45:x.h.pa>=60));
    const unl=ps.filter(x=>!x.p.isP).map(x=>({p:x.p,d:bRate(x.h).ops-(.62+ (ovr(x.p)-40)*.006)})).sort((a,b)=>a.d-b.d);
    if(unl.length){ const a=unl[0], b=unl[unl.length-1]; lines.push(`능력에 비해 기록이 낮은 타자: ${a.p.name}(OPS ${fmt3(bRate(seasonTotal(a.p,G.year,'1군')).ops)}) · 능력 이상으로 잘하는 타자: ${b.p.name}`); } }
  if(lv>=3){ const d=G.sea&&G.sea.rec&&G.sea.rec[G.user]; if(d){ const st=standingsNow(); const i=st.findIndex(x=>x.tid===G.user); const po=(()=>{ try{ const o=playoffOdds(); const q=o&&o.find(x=>x.tid===G.user); return q?Math.round(q.ps*100):null; }catch(e){ return null; } })(); if(po!=null)lines.push(`데이터 랩 시뮬레이션: 가을야구 진출 확률 ${po}%`); } }
  mail('전력분석팀',`${m}월 전력 분석 보고`,lines.join('\n')+`\n\n분석원 ${anaList().length}명 기준 보고입니다. 상대 전력분석·영상 분석 인력이 늘수록 보고가 자세해집니다.`,{kind:'분석',acts:[{l:'전력분석',a:'go',v:'staff:data'}]}); }
const INET=[{l:'에이전트 자료',c:0,sd:9.5,d:'에이전트가 보낸 영상과 기록만 봅니다. 장래성과 성향은 알 수 없고 능력치 오차가 큽니다.'},
  {l:'현지 통신원',c:60,sd:6.5,d:'현지 통신원이 경기를 직접 봅니다. 장래성과 부상 체질을 대략 판단합니다.'},
  {l:'전담 스카우트',c:150,sd:4.5,d:'전담 스카우트가 상주합니다. 오차가 작고 한국 적응력(성격·생활)까지 확인합니다. 좋은 후보를 더 많이 찾습니다.'},
  {l:'현지 사무소',c:320,sd:3,d:'현지 사무소와 구단 네트워크로 거의 정확하게 봅니다. 숨은 후보를 가장 먼저, 가장 많이 확보합니다.'}];
const origOf=p=>p.orig||({'미국':'us','도미니카공화국':'la','베네수엘라':'la','일본':'jp','대만':'tw','호주':'au'}[p.nat]||'us');
const intlLv=r=>Math.min(3,((G.intl&&G.intl[r])||0)+(G&&G.scouts&&G.scouts.some(s=>s.role==='intl'&&s.region===r)?1:0));

function genName(){ for(let i=0;i<40;i++){ const n=pick(SUR)+pick(G1)+pick(G2); if(!BLOCK.has(n)&&n[1]!==n[2])return n; } return pick(SUR)+'도윤'; }
function genFName(k){ const d=FN[k]; for(let i=0;i<30;i++){ const n=d.rev?pick(d.l)+' '+pick(d.f):pick(d.f)+' '+pick(d.l); if(!BLOCK.has(n)&&!Object.values(G.players).some(p=>p.name===n))return n; } return pick(d.f)+' '+pick(d.l); }
function ovr(p){const r=p.r;return p.isP? r.stf*.45+r.ctl*.35+r.sta*.2 : r.con*.3+r.pow*.25+r.eye*.15+r.spd*.1+r.def*.2;}
const offV=p=>p.r.con*.35+p.r.pow*.3+p.r.eye*.2+p.r.spd*.15;
const spV=p=>p.r.stf*.45+p.r.ctl*.4+p.r.sta*.15;
const penV=p=>p.r.stf*.55+p.r.ctl*.45;
const isSP=p=>p.isP&&p.r.sta>=47;
const POSK={C:'포수','1B':'1루수','2B':'2루수','3B':'3루수',SS:'유격수',LF:'좌익수',CF:'중견수',RF:'우익수',DH:'지명타자'};
const POSS={C:'포수','1B':'1루','2B':'2루','3B':'3루',SS:'유격',LF:'좌익',CF:'중견',RF:'우익',DH:'지명'};
const FIELD=['C','1B','2B','3B','SS','LF','CF','RF'];
/* 투수는 선발·불펜이 정해져 있지 않다. 소속 구단 감독이 체력과 성적을 보고 정하고, 시즌 중에도 바꾼다 */
const isSPr=p=>p.isP&&(p.role?p.role==='SP':isSP(p));
const posLabel=p=>p.isP?(p.team==null||p.fdPool||p.prospect||!p.role?'투수':(p.role==='SP'?'선발':'불펜')):POSK[p.pos];
function roleBias(tid,p){ const m=tid!=null?mgrOf(tid):null; const thr=46+(((m&&m.pen!=null)?m.pen:50)-50)/10; return clamp((p.r.sta-thr)*.9,-14,8)+(p.rAdj||0); }
const team=id=>G.teams[id];
const tname=id=>id==null?'무소속':tshort(id);
const tshort=id=>id==null?'-':team(id).city+' '+team(id).nick;
const teamColor=t=>`hsl(${t.hue} 52% 31%)`;
const isRookie=p=>p.draft&&p.draft.y===G.year-1;
const healthy=p=>!(p.injOut>0)&&!(p.susp>G.day);

function genRatings(isP,base,pos){
  const g=()=>clamp(N(base,7),20,80);
  if(isP) return {stf:g(),ctl:g(),sta:clamp(N(base,11),20,80)};
  const r={con:g(),pow:g(),eye:g(),spd:g(),def:g(),vit:clamp(N(52,9),25,80)};
  const bump=(k,d)=>r[k]=clamp(r[k]+d,20,80);
  if(['SS','CF','2B'].includes(pos)){bump('def',6);bump('spd',5);bump('pow',-4)}
  if(['1B','LF','RF'].includes(pos)){bump('pow',5);bump('def',-5)}
  if(pos==='C'){bump('spd',-8);bump('def',4)}
  return r;
}
function setOvr(p,target){ for(let k=0;k<3;k++){ const d=target-ovr(p); for(const key in p.r){ if(key==='vit')continue; p.r[key]=clamp(p.r[key]+d,20,80);} } roundR(p); }
function roundR(p){ for(const k in p.r)p.r[k]=Math.round(p.r[k]*10)/10; }
function newPlayer(o){
  const isP=o.isP??(R()<.47);
  const pos=isP?'P':(o.pos||pick(['C','1B','2B','3B','SS','LF','CF','RF','SS','CF','C']));
  const th=isP?(R()<.28?'좌':'우'):(['C','2B','3B','SS'].includes(pos)?'우':R()<.24?'좌':'우'); /* 포수·내야(1루 제외)는 우투만 */
  const bt=isP?th:(th==='좌'?'좌':R()<.3?'좌':R()<.06?'양':'우');
  const p={id:G.nextId++,name:o.name||genName(),age:o.age,isP,pos,r:genRatings(isP,o.base,pos),pot:0,
    inj:clamp(N(.14,.07),.03,.42),injOut:0,team:o.team??null,sal:MIN_SAL,yrs:0,faC:false,ext:false,svc:o.svc||0,lastFA:null,
    hist:[],injHist:[],draft:null,region:o.region||pick(REG),college:!!o.college,dev:!!o.dev,
    foreign:o.foreign||null,nat:o.nat||null,th,bt,velo:N(0,1.3)};
  setOvr(p,o.base);
  p.pot=clamp(Math.max(ovr(p),o.pot??ovr(p)),20,80); p.dt=rollDT();
  initPers(p);
  G.players[p.id]=p; return p;
}
const playersOf=tid=>Object.values(G.players).filter(p=>p.team===tid&&!(p.joinY>G.year)&&!isAway(p));
const awayOf=tid=>Object.values(G.players).filter(p=>p.team===tid&&!(p.joinY>G.year)&&isAway(p));
const domestic=tid=>playersOf(tid).filter(p=>!p.foreign);
const payroll=tid=>sum(domestic(tid).map(p=>p.sal));
function capPay(tid){ const s=domestic(tid).filter(p=>!isRookie(p)).map(p=>p.sal).sort((a,b)=>b-a).slice(0,40); return sum(s); }
const foreignOf=tid=>playersOf(tid).filter(p=>p.foreign);
function marketSal(o){ return Math.round(Math.min(3000,30+Math.pow(Math.max(0,o-37),2)*3.0)*capOf(G.year)/15117); }
const round5=v=>Math.max(MIN_SAL,Math.round(v/5)*5);
const veloOf=p=>Math.round(137+(p.r.stf-20)/60*17+p.velo);
const runOf=p=>(4.62-(p.r.spd-20)/60*.6+p.velo*.02).toFixed(2);

/* ===== 기록: 타석 단위로 만든다 ===== */
const cc=(x,b)=>clamp((x+b-20)/60,0,1.25);
function seasonLuck(p){ return p.sf&&p.sf.y===G.year?(p.sf.lk||0):0; }
function batProbs(p,b){ const r=p.r; const be=b*.4, bc=b*.7;
  return {bb:.01+cc(r.eye,be)*.145, k:clamp(.31-cc(r.con,bc)*.17-cc(r.eye,be)*.04,.06,.36), hr:.003+Math.pow(cc(r.pow,b),1.6)*.06,
    babip:clamp(.268+cc(r.con,b)*.07+cc(r.spd,b)*.035+seasonLuck(p),.22,.39), d2:.16+cc(r.pow,b)*.08, d3:.004+cc(r.spd,b)*.025};
}
function simBat(p,pa,b,slot){
  const q=batProbs(p,b||0); const o={pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,r:0,rbi:0,sb:0,cs:0};
  for(let i=0;i<pa;i++){ o.pa++; const x=R();
    if(x<q.bb){o.bb++;continue} o.ab++;
    if(x<q.bb+q.k){o.so++;continue}
    if(x<q.bb+q.k+q.hr){o.h++;o.hr++;continue}
    if(R()<q.babip){ o.h++; const y=R(); if(y<q.d3)o.tr++; else if(y<q.d3+q.d2)o.d++; }
  }
  const on=o.h-o.hr-o.d-o.tr+o.bb; const att=rr(on*clamp((p.r.spd-40)/60,0,.6)*.25*rnd(.7,1.3)); const sr=clamp(.55+(p.r.spd-50)*.008,.4,.9);
  o.sb=rr(att*sr); o.cs=Math.max(0,att-o.sb);
  const sf=slot||{r:1,rbi:1};
  o.r=rr((on+o.d+o.tr)*.3*sf.r+o.hr); o.rbi=rr(o.hr*1.5+(o.h-o.hr)*.26*sf.rbi+o.bb*.02);
  return o;
}
function pitProbs(p,b){ const r=p.r; const be=b*.4, bk=b*.7;
  return {k:.10+cc(r.stf,bk)*.19, bb:clamp(.15-cc(r.ctl,be)*.13,.025,.16), hr:clamp(.036-cc(r.stf,b)*.012-cc(r.ctl,be)*.01,.008,.05), babip:clamp(.335-cc(r.stf,b)*.04-seasonLuck(p),.25,.36)};
}
function simPit(p,outs,b){
  const q=pitProbs(p,b||0); const o={outs:0,h:0,hr:0,bb:0,so:0,tb:0};
  let guard=0;
  while(o.outs<outs&&guard++<5000){ const x=R();
    if(x<q.bb){o.bb++;continue}
    if(x<q.bb+q.k){o.so++;o.outs++;continue}
    if(x<q.bb+q.k+q.hr){o.h++;o.hr++;o.tb+=4;continue}
    if(R()<q.babip){ o.h++; const y=R(); o.tb+=y<.03?3:y<.23?2:1; } else o.outs++;
  }
  const A=o.h+o.bb-o.hr, B=(1.4*o.tb-.6*o.h-3*o.hr+.1*o.bb)*1.02, C=o.outs;
  const runs=(B+C>0?A*B/(B+C):0)+o.hr;
  o.er=Math.max(0,Math.round(runs*.92+N(0,Math.sqrt(runs+.5)*.35)));
  delete o.tb; return o;
}
const ZB={pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,r:0,rbi:0,sb:0,cs:0,g:0};
const ZP={g:0,gs:0,outs:0,h:0,hr:0,bb:0,so:0,er:0,w:0,l:0,sv:0,hld:0};
function lineFor(p,y,t,lvl){ let h=p.hist.find(x=>x.y===y&&x.t===t&&x.lvl===lvl); if(!h){ h=Object.assign({y,t,lvl},p.isP?ZP:ZB); p.hist.push(h);} return h; }
function addTo(h,o){ for(const k in o) if(k!=='y'&&k!=='t'&&typeof o[k]==='number') h[k]=(h[k]||0)+o[k]; }
// 비율 기록
function bRate(h){ const avg=h.ab?h.h/h.ab:0, obp=h.pa?(h.h+h.bb)/h.pa:0, slg=h.ab?(h.h+h.d+2*h.tr+3*h.hr)/h.ab:0; return {avg,obp,slg,ops:obp+slg}; }
function pRate(h){ const ip=h.outs/3; return {ip,era:h.outs?h.er*27/h.outs:0,whip:h.outs?(h.h+h.bb)*3/h.outs:0,k9:h.outs?h.so*27/h.outs:0,bb9:h.outs?h.bb*27/h.outs:0}; }
const ipStr=outs=>Math.floor(outs/3)+(outs%3?'.'+outs%3:'');
const POS_ADJ={C:9,SS:7,'2B':3,CF:3,'3B':2,LF:-6,RF:-6,'1B':-10,DH:-15};
function lgOf(y){ return (G.lg&&G.lg[y])||{ops:.72,era:4.5}; }
/* WAR: 끝난 시즌의 타자 WAR은 처음 계산한 값으로 고정한다(수비 능력치가 나중에 바뀌어도 과거 기록은 그대로).
   창단 전 시즌은 공개 기록용 수비 추정치(fdWar)를 쓴다. 화면마다 같은 시즌 WAR이 달라 보이던 문제를 막는다 */
function warKey(h){ return h.y+':'+(h.lvl||'')+':'+(h.t??'')+':'+(h.pa||0); }
function warOf(h,p){ if(!h||!p)return 0; if(p.isP||!h.pa||h.y==null||h.y2)return warRaw(h,p);
  const pre=h.y<(G.startY??-1); if(!pre&&h.y>=G.year)return warRaw(h,p);
  p.pw=p.pw||{}; const k=warKey(h); if(p.pw[k]==null){ const old=pre?p.pw[h.y+':'+(h.lvl||'')]:null; /* 이전 저장 형식 */ p.pw[k]=old!=null?old:Math.round((pre?fdWar(p,h):warRaw(h,p))*100)/100; } return p.pw[k]; }
function warFreeze(y){ for(const p of Object.values(G.players)){ if(p.isP||!p.hist)continue; const L=p.hist.filter(h=>h.y===y&&!h.y2&&h.pa); if(!L.length)continue; p.pw=p.pw||{};
  const lv=[...new Set(L.map(h=>h.lvl))]; for(const h of L.concat(lv.map(l=>seasonTotal(p,y,l)).filter(Boolean))){ const k=warKey(h); if(p.pw[k]==null)p.pw[k]=Math.round(warRaw(h,p)*100)/100; } } }
function warRaw(h,p){
  if(!h)return 0; const lg=lgOf(h.y);
  if(p.isP){ if(!h.outs)return 0; const ip=h.outs/3; const era=h.er*27/h.outs; const lev=(h.sv>5)?1.3:1; return ((lg.era+.9)-era)*ip/9/10*lev; }
  if(!h.pa)return 0; const ops=bRate(h).ops; const pos=h.pos||p.pos;
  const bat=(ops/lg.ops-1)*h.pa*.16, rep=20*h.pa/600, adj=(POS_ADJ[pos]||0)*h.pa/600, def=pos==='DH'?0:(p.r.def-50)*.3*h.pa/600;
  return (bat+rep+adj+def)/10;
}
function updateLg(y){
  const bl=[],pl=[];
  for(const p of Object.values(G.players)) for(const h of p.hist) if(h.y===y&&h.lvl==='1군'){ (p.isP?pl:bl).push(h); }
  const s=(a,k)=>sum(a.map(h=>h[k]||0));
  const pa=s(bl,'pa'),ab=s(bl,'ab'),H=s(bl,'h'),bb=s(bl,'bb'),tb=s(bl,'h')+s(bl,'d')+2*s(bl,'tr')+3*s(bl,'hr');
  const outs=s(pl,'outs'),er=s(pl,'er');
  if(!G.lg)G.lg={};
  G.lg[y]={ops:pa&&ab?(H+bb)/pa+tb/ab:.72, era:outs?er*27/outs:4.5};
}

/* ===== 포지션 배치와 뎁스 ===== */
/* 서브 포지션: 주 포지션별로 함께 연습해 온 자리 (선수마다 고정) */
const SUBMAP={C:[['1B',.45]],'1B':[['LF',.35],['3B',.3],['RF',.25]],'2B':[['SS',.6],['3B',.45],['1B',.25]],'3B':[['1B',.6],['SS',.3],['2B',.35]],SS:[['2B',.85],['3B',.65]],LF:[['RF',.7],['1B',.35],['CF',.2]],CF:[['LF',.85],['RF',.8]],RF:[['LF',.7],['1B',.3],['CF',.3]]};
const _subC=new Map();
function subsOf(p){ if(p.isP||!SUBMAP[p.pos])return []; if(p.subs)return p.subs; const ck=p.id+':'+p.pos; const c=_subC.get(ck); if(c)return c; const out=[]; for(const [k,pr] of SUBMAP[p.pos]){ if(out.length<2&&u01('sub'+k,p.id)<pr)out.push(k); } _subC.set(ck,out); return out; }
function defAt(p,pos){
  if(pos==='DH')return 0; if(p.pos===pos)return p.r.def;
  if(subsOf(p).includes(pos))return p.r.def-(['SS','CF','C'].includes(pos)?5:3);
  const IF=['2B','SS','3B'], OF=['LF','CF','RF'];
  if(pos==='C')return p.r.def-25;
  if(pos==='1B')return p.r.def-3;
  if(IF.includes(pos)&&IF.includes(p.pos))return p.r.def-5;
  if(OF.includes(pos)&&OF.includes(p.pos))return p.r.def-(pos==='CF'?8:3);
  if(OF.includes(pos))return p.r.def-10;
  return p.r.def-14;
}
const posScore=(p,pos)=>pos==='DH'?offV(p):offV(p)*.62+defAt(p,pos)*.38;
const ORDER=['C','SS','CF','2B','3B','RF','LF','1B','DH'];
function makeLineup(tid,pool){
  const bats=(pool||actOf(tid)).filter(p=>!p.isP&&healthy(p));
  const used=new Set(); const ln={};
  const ov={}; const mg=G.mgr[tid]; const promo=p=>p.promise&&tid===G.user&&mg&&mg.disc<62?2:0;
  for(const pos of ORDER){ const id=ov[pos]; const p=id&&G.players[id]; if(p&&p.team===tid&&!p.isP&&healthy(p)&&!used.has(p.id)){ln[pos]=p;used.add(p.id);} }
  // 감독은 본래 포지션과 서브 포지션을 우선한다: 전체에서 가장 잘 맞는 (자리, 선수) 쌍부터 채운다
  const fitPen=(p,pos)=>pos==='DH'?(p.pos==='C'?1:0):p.pos===pos?0:subsOf(p).includes(pos)?1.5:pos==='C'?40:pos==='1B'?6:11;
  const lean=teamLean(tid); const pb=p=>polBonus(tid,p,lean);
  const open=new Set(ORDER.filter(pos=>!ln[pos]));
  const SC=new Map(); for(const p of bats){ const o=offV(p), ex=promo(p)+pb(p); const m={}; for(const pos of ORDER)m[pos]=(pos==='DH'?o:o*.62+defAt(p,pos)*.38)+ex-fitPen(p,pos); SC.set(p.id,m); }
  while(open.size){ let bp=null,bq=null,bs=-1e9;
    for(const pos of open){ if(pos==='DH'&&open.size>1)continue; for(const p of bats){ if(used.has(p.id))continue; const s=SC.get(p.id)[pos]; if(s>bs){bs=s;bp=pos;bq=p;} } }
    if(!bq)break; ln[bp]=bq; used.add(bq.id); open.delete(bp); }
  return ln;
}
function entryLimit(){ return period()==='season'&&G.day>=KD(8,25)?ENTRY_BASE+ENTRY_EXP:ENTRY_BASE; }
function entryOn(){ if(!G.cal||G.entryY!==G.year)return false; const per=period(); return per==='season'||per==='post'||(per==='pre'&&G.day>=G.cal.open-1); }
function actOf(tid){ const ps=playersOf(tid); return entryOn()?ps.filter(p=>p.e1):ps.filter(p=>!p.ys); }
const canUp=p=>!p.e1&&!p.ys&&!isAway(p)&&healthy(p)&&!(p.joinY>G.year)&&(p.downDay==null||G.day-p.downDay>=10);
function entryVal(tid,p,lean){ const f=p.sf&&p.sf.y===G.year?(p.sf.v+(p.sf.m||0))*.6:0; return (p.isP?(isSPr(p)?spV(p)+2:penV(p)):offV(p)*.72+p.r.def*.28)+polBonus(tid,p,lean)+f-(p.fat||0)/25; }
function setEntry(tid){ for(const p of playersOf(tid))p.e1=false; const lean=teamLean(tid);
  const ps=playersOf(tid).filter(p=>!p.ys&&healthy(p)); const v=p=>entryVal(tid,p,lean);
  const bats=ps.filter(p=>!p.isP).sort((a,b)=>v(b)-v(a)), pits=ps.filter(p=>p.isP);
  const sp=[...pits].sort((a,b)=>(spV(b)+roleBias(tid,b))-(spV(a)+roleBias(tid,a))).slice(0,5);
  const rp=pits.filter(p=>!sp.includes(p)).sort((a,b)=>v(b)-v(a)).slice(0,10);
  const ln=makeLineupFrom(tid,bats); const st=new Set(Object.values(ln).map(p=>p.id));
  const bench=bats.filter(p=>!st.has(p.id)); const c=bench.find(p=>p.pos==='C');
  const bsel=(c?[c]:[]).concat(bench.filter(p=>p!==c)).slice(0,5);
  [...Object.values(ln),...bsel,...sp,...rp].forEach(p=>{p.e1=true;p.upDay=G.day;});
  entryManage(tid,false,true); }
function entryManage(tid,weekly,quiet){ if(!entryOn())return; const lim=entryLimit(); const lean=teamLean(tid); const v=p=>entryVal(tid,p,lean); const moves=[];
  for(const p of playersOf(tid))if(p.e1&&(p.injOut>3||p.ys)){ p.e1=false; p.downDay=G.day; moves.push(`${p.name} 말소(${p.injOut>3?'부상':'육성'})`); }
  let ent=playersOf(tid).filter(p=>p.e1);
  if(ent.length>lim){ const d=depth(tid); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); ent.filter(p=>!core.has(p.id)).sort((a,b)=>v(a)-v(b)).slice(0,ent.length-lim).forEach(p=>{p.e1=false;p.downDay=G.day;moves.push(`${p.name} 말소`);}); ent=playersOf(tid).filter(p=>p.e1); }
  while(ent.length<lim){ const np=ent.filter(p=>p.isP).length; const needP=np<Math.round(lim*.5); const pool=playersOf(tid).filter(canUp);
    const c=pool.filter(p=>p.isP===needP).sort((a,b)=>v(b)-v(a))[0]||pool.sort((a,b)=>v(b)-v(a))[0]; if(!c)break; c.e1=true; c.upDay=G.day; ent.push(c); moves.push(`${c.name} 콜업`); }
  if(weekly){ const d=depth(tid); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id));
    for(const isP of [false,true]){ const out=ent.filter(p=>p.isP===isP&&!core.has(p.id)&&G.day-(p.upDay||0)>=7).sort((a,b)=>v(a)-v(b))[0]; const inn=playersOf(tid).filter(p=>canUp(p)&&p.isP===isP).sort((a,b)=>v(b)-v(a))[0];
      if(out&&inn&&v(inn)>v(out)+2.5){ out.e1=false; out.downDay=G.day; inn.e1=true; inn.upDay=G.day; moves.push(`${out.name} 말소 · ${inn.name} 콜업`); } } }
  if(tid===G.user&&moves.length&&!quiet)note('엔트리',`감독이 1군 엔트리를 조정했습니다: ${moves.join(', ')}.`); }
function reqEntry(id,up){ const p=G.players[id]; const m=G.mgr[G.user]; if(!p||p.team!==G.user)return '대상이 아닙니다.'; if(!entryOn())return '시즌 중에만 엔트리를 바꿀 수 있습니다.'; if(!m)return '감독이 없습니다.';
  if(up&&!canUp(p))return p.ys?'육성선수는 정식 선수로 등록해야 1군에 올릴 수 있습니다.':!healthy(p)?'부상 중입니다.':`말소 후 10일이 지나야 다시 등록할 수 있습니다(${dmd(p.downDay+10)}부터).`;
  if(!up&&!p.e1)return '이미 1군에 없습니다.';
  mgrFix(m); const a=clamp(.78-(m.ego-50)/70+(m.rel-60)/120,.15,.95); const ok=hn('req'+G.day,id)>-1.2&&R()<a;
  if(!ok){ m.rel=clamp(m.rel-2,0,100); mail('감독실',`${p.name} ${up?'콜업':'말소'} 요청 거절`,`${m.name} 감독: ${up?`${p.name}은(는) 아직 1군에 올릴 때가 아니라고 봅니다.`:`${p.name}은(는) 지금 팀에 필요한 선수입니다.`} 엔트리는 제가 판단하겠습니다.`,{kind:'감독'}); return `${m.name} 감독이 요청을 받아들이지 않았습니다.`; }
  if(up){ const ent=playersOf(G.user).filter(x=>x.e1); if(ent.length>=entryLimit()){ const d=depth(G.user); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); const lean=teamLean(G.user); const out=ent.filter(x=>x.isP===p.isP&&!core.has(x.id)).sort((a,b)=>entryVal(G.user,a,lean)-entryVal(G.user,b,lean))[0]||ent.filter(x=>!core.has(x.id))[0]; if(out){ out.e1=false; out.downDay=G.day; } }
    p.e1=true; p.upDay=G.day; addLog(`${p.name}이(가) 단장 요청으로 1군에 등록되었습니다.`); return `${m.name} 감독이 받아들였습니다. ${p.name} 1군 등록.`; }
  p.e1=false; p.downDay=G.day; entryManage(G.user,false,true); addLog(`${p.name}이(가) 단장 요청으로 1군에서 말소되었습니다.`); return `${m.name} 감독이 받아들였습니다. ${p.name} 말소(${dmd(G.day+10)}부터 재등록 가능).`; }
function toYS(id){ const p=G.players[id]; if(!p||p.team!==G.user||p.foreign||p.ys)return '대상이 아닙니다.'; if(p.faC||p.sal>100)return '연봉 1억 원 이하이고 FA·다년계약이 아닌 선수만 육성선수로 돌릴 수 있습니다.'; if(ysN(G.user)>=YS_MAX)return `육성선수는 ${YS_MAX}명까지입니다(게임 규칙).`;
  p.ys=true; p.e1=false; p.sal=Math.min(p.sal,MIN_SAL); addLog(`${p.name}을(를) 육성선수로 돌렸습니다. 정식 로스터에서 빠집니다.`); return ''; }
function fromYS(id){ const p=G.players[id]; if(!p||!p.ys)return '대상이 아닙니다.'; if(period()==='season'&&G.day<KD(5,1))return '육성선수는 5월 1일부터 정식 선수로 등록할 수 있습니다.'; if(rosterN(G.user)>=ROSTER_MAX)return `정식 로스터가 ${ROSTER_MAX}명으로 꽉 찼습니다.`;
  p.ys=false; addLog(`${p.name}을(를) 정식 선수로 등록했습니다.`); return ''; }
function makeLineupFrom(tid,bats){ const save=G.entryY; G.entryY=-1; const ln=makeLineup(tid,bats); G.entryY=save; return ln; }
function depth(tid){
  const ps=playersOf(tid); const act=actOf(tid); const actIds=new Set(act.map(p=>p.id));
  const ln=makeLineup(tid); const startIds=new Set(Object.values(ln).map(p=>p.id));
  const lean=teamLean(tid); const PB=new Map(); const pb=p=>{ let v=PB.get(p.id); if(v==null){ v=polBonus(tid,p,lean); PB.set(p.id,v); } return v; };
  const by=(arr,f)=>arr.map(p=>[f(p),p]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
  const bat=by(act.filter(p=>!p.isP&&healthy(p)&&!startIds.has(p.id)),p=>ovr(p)+pb(p));
  const futB0=by(ps.filter(p=>!p.isP&&healthy(p)&&!actIds.has(p.id)),ovr), futP0=by(ps.filter(p=>p.isP&&healthy(p)&&!actIds.has(p.id)),ovr);
  const pit=act.filter(p=>p.isP&&healthy(p));
  const sp=by(pit,p=>spV(p)+roleBias(tid,p)+pb(p)).slice(0,5); for(const p of pit)p.role=sp.includes(p)?'SP':'RP';
  const rest=by(pit.filter(p=>!sp.includes(p)),p=>penV(p)+pb(p)*.6);
  const start=ORDER.filter(k=>ln[k]).map(k=>ln[k]);
  const on=entryOn();
  return {ln,start,bench:on?bat:bat.slice(0,5),futB:on?futB0:bat.slice(5).concat(futB0),sp,pen:on?rest:rest.slice(0,7),futP:on?futP0:rest.slice(7).concat(futP0),inj:ps.filter(p=>!healthy(p))};
}
function teamRating(tid){
  const d=depth(tid);
  const off=avg(d.start.map(offV))*(Math.min(9,d.start.length)/9);
  const def=avg(FIELD.filter(k=>d.ln[k]).map(k=>defAt(d.ln[k],k)));
  const sp=avg(d.sp.map(spV))*(Math.min(5,d.sp.length)/5), pen=avg(d.pen.map(penV));
  return off*.4+(sp*.65+pen*.35)*.45+def*.15;
}
function battingOrder(d){
  const s=[...d.start]; const by=(f)=>s.sort((a,b)=>f(b)-f(a));
  by(p=>p.r.con+p.r.eye+p.r.spd*.7); const top=s.splice(0,2);
  by(p=>p.r.pow+p.r.con*.5); const mid=s.splice(0,3);
  by(offV); const ord=[...top,...mid,...s];
  const fr=[1.25,1.15,1.05,.95,.95,.9,.85,.85,.8], fb=[.7,.9,1.25,1.35,1.25,1,.95,.85,.8];
  const m={}; ord.forEach((p,i)=>m[p.id]={r:fr[i],rbi:fb[i],slot:i+1}); return m;
}

/* ===== 성장과 노화 ===== */
/* ===== 성장과 노화 =====
 성장 유형(숨김): norm 정상형, early 조기 완성형, late 대기만성형, stall 정체형, vet 기술형(신체는 늙어도 기술이 는다)
 성장 속도 = 남은 잠재력 × 유형별 나이 곡선 × 출전 시간 × 훈련 시설 × 감독 육성 성향 */
const DT={norm:{l:'정상 성장형',grow:27,peak:30,fall:31},early:{l:'조기 완성형',grow:24,peak:27,fall:29},late:{l:'대기만성형',grow:29,peak:32,fall:33},stall:{l:'정체형',grow:25,peak:29,fall:30},vet:{l:'기술형 베테랑',grow:27,peak:30,fall:31}};
const PHYS={vit:.9,con:.1,pow:.5,eye:-.3,spd:.9,def:.5,stf:.6,ctl:-.2,sta:.7}; // 나이 들 때 신체 의존도(높을수록 먼저 떨어짐)
function rollDT(){ const x=R(); return x<.52?'norm':x<.64?'early':x<.76?'late':x<.89?'stall':'vet'; }
const FAC=[null,{l:'낡은 시설',g:.88,d:1.1},{l:'기본 시설',g:.94,d:1.05},{l:'중급 시설',g:1,d:1},{l:'최신 시설',g:1.06,d:.95},{l:'최고 수준 시설',g:1.12,d:.9}];
const FAC_COST=[0,0,1200,2500,4500,7000], FAC_UPKEEP=[0,80,160,280,450,700], FAC_DAYS=[0,0,120,150,180,210];
const facLv=tid=>tid===G.user?((G.fac&&G.fac.lv)||2):(G.teams[tid].fac||3);
/* 세부 시설: 실제 구단 2군 훈련장·재활센터·트래킹 장비 투자를 항목별로 나눈다. 단계 0~3 */
const FACI={
  indoor:{l:'실내 연습장',lv:['없음','간이 실내 연습장','실내 연습장','실내 훈련동'],c:[0,1500,4000,8000],days:[0,120,180,240],up:[0,40,90,160],d:'비·한겨울에도 훈련합니다. 모든 선수의 성장이 조금씩 빨라집니다.'},
  weight:{l:'웨이트·컨디셔닝',lv:['없음','기본 웨이트장','컨디셔닝 센터','퍼포먼스 센터'],c:[0,600,1500,3000],days:[0,60,90,120],up:[0,30,60,110],d:'근력·유연성을 관리합니다. 부상이 줄고 30대 선수의 하락이 느려집니다.'},
  rehab:{l:'재활·회복 센터',lv:['없음','물리치료실','재활센터(수중 치료)','회복 센터(냉각·수면 관리)'],c:[0,800,2000,4000],days:[0,60,90,150],up:[0,30,70,120],d:'부상 복귀가 빨라지고 시즌 중 피로가 더 빨리 풀립니다.'},
  lab:{l:'피칭·타격 랩',lv:['없음','랩소도·영상 장비','트래킹 랩(고속 카메라)','바이오메카닉스 랩'],c:[0,500,1500,3500],days:[0,30,60,90],up:[0,40,90,180],d:'투구·스윙을 측정해 고칩니다. 젊은 선수의 성장이 빨라지고, 트래킹 분석원이 있으면 효과가 커집니다.'},
  fut:{l:'2군(퓨처스) 구장',lv:['낡은 공용 구장','천연잔디 교체','조명·불펜·라커룸 개선','퓨처스 전용 구장'],c:[0,2000,5000,10000],days:[0,150,210,300],up:[0,50,100,180],d:'퓨처스 경기 환경입니다. 2군에서 뛰는 시간이 성장에 더 많이 인정되고 2군 부상이 줄어듭니다.'},
  dorm:{l:'선수 숙소·식당',lv:['없음','기숙사','기숙사·영양 식당','선수촌'],c:[0,1000,2500,5000],days:[0,120,180,240],up:[0,30,60,100],d:'젊은 선수의 생활과 영양을 관리합니다. 23세 이하 선수 성장과 기분이 좋아집니다.'}};
const FACK=Object.keys(FACI);
/* 구단 버스: 원정 경기 피로. 다른 구단은 우등 버스 기준 */
const BUS=[{l:'일반 버스',f:.10,c:0,up:0},{l:'우등 버스',f:.02,c:250,up:40},{l:'리무진 버스',f:-.06,c:600,up:100}];
function busLv(tid){ if(tid!=null&&tid!==G.user)return 1; return G.bus!=null?G.bus:1; }
function buyBus(lv){ lv=+lv; if(!BUS[lv]||lv<=busLv())return '지금보다 좋은 버스만 살 수 있습니다.'; const t=team(G.user); const c=BUS[lv].c; if(t.cash<c)return `보유 자금이 부족합니다(${money(c)} 필요).`; t.cash-=c; G.bus=lv; addLog(`구단 버스를 ${BUS[lv].l}(으)로 바꿨습니다(${money(c)}).`); return ''; }
function facInit(){ G.fac=G.fac||{lv:2,build:null}; if(!G.fac.it){ const b=clamp(Math.round(((G.fac.lv||2)-1)*.75),0,3); G.fac.it={}; for(const k of FACK)G.fac.it[k]=k==='lab'?Math.max(0,b-1):b; if(G.fac.build){ for(const k of FACK)G.fac.it[k]=Math.min(3,G.fac.it[k]+1); G.fac.build=null; } G.fac.bld={}; } G.fac.bld=G.fac.bld||{}; facRecalc(); }
function facRecalc(){ const it=G.fac.it; const avg=sum(FACK.map(k=>it[k]))/FACK.length; G.fac.lv=clamp(Math.round(1+avg*4/3),1,5); }
function facUpkeep(){ const bu=BUS[busLv()].up; if(!G.fac||!G.fac.it)return FAC_UPKEEP[facLv(G.user)]+bu; return sum(FACK.map(k=>FACI[k].up[G.fac.it[k]]))+bu; } /* 버스 운영비 포함 */
function facOf(k){ return G.fac&&G.fac.it?G.fac.it[k]||0:1; }
/* 성장·노화 배수: 우리 팀은 세부 시설, 다른 구단은 종합 등급 */
function facEff(p){ if(p.team!==G.user||!G.fac||!G.fac.it)return FAC[p.team!=null?facLv(p.team):2];
  const young=p.age<=23; const futP=(()=>{ const a=seasonTotal(p,G.year,'1군'), f=seasonTotal(p,G.year,'퓨처스'); return f&&(!a||(p.isP?(f.outs||0)>(a.outs||0):(f.pa||0)>(a.pa||0))); })();
  const g=.94+facOf('indoor')*.012+facOf('lab')*.015*(1+anaPow('trk')*.08)+(young?facOf('dorm')*.015:0)+(futP?facOf('fut')*.02:0);
  const d=1.05-facOf('weight')*.03-facOf('rehab')*.015;
  return {l:`세부 시설(종합 ${G.fac.lv}단계)`,g:Math.round(g*1000)/1000,d:Math.round(d*1000)/1000}; }
function buildFacItem(k){ facInit(); const F=FACI[k]; if(!F)return '없는 시설입니다.'; const lv=G.fac.it[k]; if(lv>=3)return '이미 최고 단계입니다.'; if(G.fac.bld[k])return '이미 공사 중입니다.'; if(Object.keys(G.fac.bld).length>=2)return '공사는 동시에 2곳까지만 할 수 있습니다.';
  const c=F.c[lv+1]; const t=team(G.user); if(t.cash<c)return `보유 자금이 부족합니다. 공사비 ${money(c)}가 필요합니다(보유 ${money(t.cash)}).`;
  t.cash-=c; G.spend.facB=(G.spend.facB||0); G.fac.bld[k]={lv:lv+1,done:G.day+F.days[lv+1],c}; addLog(`${F.l} ${F.lv[lv+1]} 공사를 시작했습니다(공사비 ${money(c)}, ${F.days[lv+1]}일).`); t.trust=clamp(t.trust+1,0,100); return ''; }
function facDaily(){ if(!G.fac||!G.fac.bld)return; for(const k of Object.keys(G.fac.bld)){ const b=G.fac.bld[k]; if(G.day>=b.done){ G.fac.it[k]=b.lv; delete G.fac.bld[k]; facRecalc(); mail('육성팀',`${FACI[k].l} 완공: ${FACI[k].lv[b.lv]}`,`${FACI[k].l}이(가) ${b.lv}단계(${FACI[k].lv[b.lv]})로 완공됐습니다. ${FACI[k].d} 연 유지비는 ${money(FACI[k].up[b.lv])}입니다.`,{kind:'시설',acts:[{l:'시설 보기',a:'go',v:'staff:fac'}]}); } } }
function playShare(p){ // 지난 시즌 출전 비중: 1군은 그대로, 퓨처스는 60%만 인정
  const y=G.year; const a=seasonTotal(p,y,'1군'), f=seasonTotal(p,y,'퓨처스'); const fw=.6+(p.team===G.user?facOf('fut')*.05:0); /* 2군 구장이 좋을수록 퓨처스 출전을 더 인정 */
  if(p.isP){ const o=(a?a.outs:0)+(f?f.outs:0)*fw; return o>=420?1.15:o>=300?1.08:o>=180?1:o>=90?.92:.8; }
  const pa=(a?a.pa:0)+(f?f.pa:0)*fw; return pa>=450?1.15:pa>=320?1.08:pa>=200?1:pa>=100?.92:.8; }
function develop(p){
  if(!p.dt)p.dt=rollDT(); const T=DT[p.dt]; const o=ovr(p); const age=p.age;
  const svc=p.mil&&p.mil.until&&p.mil.from<=G.day&&p.mil.until>G.day?p.mil.unit:null;
  const play=svc==='현역'?.55:svc==='상무'?1:p.team!=null?playShare(p):.85, fac=p.team!=null?facEff(p):FAC[2];
  const yf=p.team!=null&&G.mgr?1+(mgrOf(p.team).youth-50)/150:1;
  p.devLog={y:G.year,play,fac:fac.l};
  const gap=Math.max(0,p.pot-o); let base=0;
  if(age<=T.grow){
    const rate=p.dt==='early'?(age<=22?.34:.24):p.dt==='late'?(age<=24?.08:.26):p.dt==='stall'?.07:.2;
    base=gap*rate*rnd(.65,1.35)*play*fac.g*yf*(G.coach?coachDevMult(p):1)*mpickMult(p)+N(0,1);
    // 잠재력 변화: 정체형은 해마다 깎이고, 많이 뛰고 좋은 시설이면 가끔 터진다
    if(p.dt==='stall')p.pot-=rnd(.5,2.5);
    if(R()<.05*play*fac.g)p.pot+=ri(3,7);
    if(R()<(p.dt==='stall'?.12:.05))p.pot-=ri(3,8);
    if(p.dt==='late'&&age>=25)p.pot+=rnd(0,1.5);
  } else if(age<=T.peak){ base=N(.15,1.1)+(p.dt==='late'?gap*.25*play*fac.g:0); }
  else { base=-(age-T.fall+1)*.85*fac.d*(G.coach?1.15-.15*coachDevMult(p):1)-.2+N(0,1.1); if(age<T.fall)base=N(-.2,1); }
  /* FA로이드: FA를 한 해 앞둔 첫 FA 후보는 동기부여로 한 번 더 큰다(대어가 시장에 나오게) */
  if(!p.foreign&&p.team!=null&&p.lastFA==null&&p.svc===faSvc(p)-1&&age>=23&&age<=31&&age>T.grow)base+=rnd(.4,1.8)*play;
  for(const k in p.r){
    let dk=base+N(0,(p.foreign?2.2:1.0)*(k==='eye'||k==='ctl'?.6:1));
    if(age>=T.fall-1){ // 노화: 신체 능력이 먼저 떨어진다
      dk-=PHYS[k]*(age-T.fall+2)*.35*fac.d;
      if(p.dt==='vet'&&PHYS[k]<=0&&age<=34)dk=Math.abs(dk)*.5+rnd(.3,1.3); // 기술형: 컨택·선구안·제구는 오히려 는다
    }
    p.r[k]=clamp(p.r[k]+dk,20,80);
  }
  if(svc==='현역')for(const k in p.r)p.r[k]=clamp(p.r[k]-rnd(.5,2.2),20,80);
  roundR(p);
  const no=ovr(p);
  // 성장 구간이 끝나면 터지지 않은 잠재력은 사라진다
  if(age>=T.grow)p.pot=Math.min(p.pot,no+Math.max(0,(T.grow+3-age))*1.5+1);
  p.pot=clamp(Math.max(p.pot,no),20,80);
  if(p.isP&&base>0)p.velo+=N(.2,.4); if(age>=T.fall)p.velo-=.4+(p.dt==='vet'?.2:0);
  (p.oh=p.oh||[]).push({y:G.year,o:Math.round(no)}); if(p.oh.length>12)p.oh.shift();
  p.age++;
}
function dtHint(p,sd){ // 스카우트·코치진이 보는 성장 유형 (정확도는 평가 오차에 따름)
  if(!p.dt||sd>6.5)return null;
  const wrong=hn('dt'+p.id,G.year)*sd>5.2; const k=wrong?rollDTfix(p):p.dt;
  return {early:'일찍 완성되는 유형으로 봅니다. 20대 후반부터 하락에 대비해야 합니다.',late:'늦게 꽃피는 대기만성형으로 봅니다. 20대 중반 이후에도 기다릴 가치가 있습니다.',stall:'성장이 정체될 우려가 있습니다. 재능만큼 크지 못할 수 있습니다.',vet:'신체 능력은 떨어져도 기술로 버티는 유형입니다. 30대에도 경쟁력을 유지할 것으로 봅니다.',norm:null}[k]; }
function rollDTfix(p){ return ['norm','early','late','stall','vet'][Math.floor(u01('dtw',p.id)*5)]; }
/* ===== 날짜 ===== */
const D0=Date.UTC(2024,0,1);
const dnum=(y,m,d)=>Math.round((Date.UTC(y,m-1,d)-D0)/864e5);
function dobj(n){const t=new Date(D0+n*864e5);return {y:t.getUTCFullYear(),m:t.getUTCMonth()+1,d:t.getUTCDate(),w:t.getUTCDay()};}
const WD='일월화수목금토';
const dstr=n=>{const o=dobj(n);return `${o.y}년 ${o.m}월 ${o.d}일 ${WD[o.w]}요일`;};
const dmd=n=>{const o=dobj(n);return `${o.m}월 ${o.d}일`;};
const dsh=n=>{const o=dobj(n);return `${o.m}/${o.d}`;};
function onOrAfter(y,m,d,w){ let n=dnum(y,m,d); while(dobj(n).w!==w)n++; return n; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
const KD=(m,d)=>dnum(G.year,m,d);

/* ===== 시즌 일정: 3연전·2연전, 월요일 휴식, 올스타 휴식기 ===== */
function buildCalendar(y){
  const open=onOrAfter(y,3,25,6);
  const asg=onOrAfter(y,7,8,6);
  const brk=new Set([asg-2,asg-1,asg,asg+1]);
  const rest=new Set(); while(rest.size<9){ const n=ri(open+10,dnum(y,9,5)); if(dobj(n).w!==1&&!brk.has(n))rest.add(n); }
  const days=[]; for(let n=open;days.length<144;n++){ const o=dobj(n); if(o.w===1||brk.has(n)||rest.has(n))continue; days.push(n); }
  const T=10; let arr=[...Array(T).keys()]; const rounds=[];
  for(let r=0;r<T-1;r++){ const pr=[]; for(let i=0;i<T/2;i++)pr.push([arr[i],arr[T-1-i]]); rounds.push(pr); arr=[arr[0],arr[T-1],...arr.slice(1,T-1)]; }
  const series=[]; rounds.forEach((pr,r)=>[3,3,3,3,2,2].forEach((len,k)=>series.push({r,len,flip:k%2})));
  shuffle(series);
  // 같은 상대와 연속 시리즈가 붙지 않게 순서를 정한다
  const ord=[]; let l1=-1,l2=-1; while(series.length){ let i=series.findIndex(s=>s.r!==l1&&s.r!==l2); if(i<0)i=series.findIndex(s=>s.r!==l1); if(i<0)i=0; const s=series.splice(i,1)[0]; ord.push(s); l2=l1; l1=s.r; }
  const sched={}; let di=0;
  for(const s of ord) for(let g=0;g<s.len;g++){ sched[days[di++]]=rounds[s.r].map(([a,b])=>s.flip?[b,a]:[a,b]); }
  return {y,open,asg,end:days[days.length-1],sched,draft:onOrAfter(y,9,14,3),camp:dnum(y,1,25),campEnd:dnum(y,3,5),exh:dnum(y,3,12)};
}
function period(){
  const c=G.cal, d=G.day;
  if(d<c.open)return 'pre'; if(d<=c.end)return 'season';
  if(G.ps&&!G.ps.done)return 'post'; return 'off';
}
const PERIOD={pre:'시즌 준비',season:'정규시즌',post:'포스트시즌',off:'스토브리그'};

/* ===== 경기: 타석·주자·투수 교체 ===== */
const LGP={bb:.083,k:.198,hr:.024,babip:.312};
const comb=(pb,pp,pl)=>{ const x=pb*pp/pl, y=(1-pb)*(1-pp)/(1-pl); return x/(x+y); };
const bz=()=>({pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,r:0,rbi:0,sb:0,cs:0});
const pz=()=>({outs:0,h:0,hr:0,bb:0,so:0,er:0,pc:0,bf:0});
function relAvail(p,day){ const m=p.team!=null?mgrOf(p.team):null; const ae=m&&!m.interim?mgrArmEff(m):50; if(!healthy(p)||p.lastApp===day||(p.fat||0)>72+(ae-50)*.4)return false; if(p.lastApp===day-1&&((p.lastPc||0)>25+(ae-50)*.3||(p.prevApp===day-2&&ae<70)))return false; return true; }
function pickStarter(tid,d,day){
  const t=team(tid); const sp=d.sp;
  if(!sp.length) return d.pen[0]||playersOf(tid).find(p=>p.isP&&healthy(p))||playersOf(tid).find(p=>p.isP)||null;
  for(let k=0;k<sp.length;k++){ const i=((t.rot||0)+k)%sp.length; const p=sp[i]; if(p.lastStart==null||day-p.lastStart>=5){ t.rot=(i+1)%sp.length; return p; } }
  return [...sp].sort((a,b)=>(a.lastStart||0)-(b.lastStart||0))[0];
}
function orderList(start){
  const s=[...start]; const by=f=>s.sort((a,b)=>f(b)-f(a));
  by(p=>p.r.con+p.r.eye+p.r.spd*.7); const top=s.splice(0,2);
  by(p=>p.r.pow+p.r.con*.5); const mid=s.splice(0,3);
  by(offV); return [...top,...mid,...s];
}
function gameSide(tid,day){
  const d=depth(tid); const ln=Object.assign({},d.ln); const bench=[...d.bench];
  const ov={};
  for(const pos of ORDER){ const p=ln[pos]; if(!p||ov[pos]===p.id||!bench.length)continue;
    const m=mgrOf(tid), re=m.interim?50:mgrRestEff(m); const fat=p.fat||0, thr=(pos==='C'?55:66)+(50-re)*.35; if(R()<.004+re/4000||(fat>thr&&R()<clamp((fat-thr)/30+(re-50)/150,.12,.95))){ let best=null,bs=-1e9; for(const q of bench){const s=posScore(q,pos); if(s>bs){bs=s;best=q}} ln[pos]=best; bench.splice(bench.indexOf(best),1); } }
  const posOf={}; for(const k in ln)posOf[ln[k].id]=k;
  const order=orderList(ORDER.filter(k=>ln[k]).map(k=>ln[k]));
  const sp=pickStarter(tid,d,day);
  const s={tid,order,posOf,pen:d.pen.filter(p=>p!==sp),used:new Set(sp?[sp.id]:[]),cur:sp,sp,curIsSP:true,idx:0,box:new Map(),pitchers:sp?[sp.id]:[],entry:{},exit:{}};
  if(sp)s.box.set(sp.id,pz()); order.forEach(p=>s.box.set(p.id,bz()));
  return s;
}
function boostOf(p){ let b=(p.team!=null&&G.coach)?coachBoost(p):0; if(p.team===G.user)b+=mgrRelBoost(p); const f=G.form; if(f&&p.team===G.user&&G.day<=f.until)b+=f.b; if(p.form&&G.day<=p.form.until)b+=p.form.b; if(p.mor!=null)b+=clamp((p.mor-60)/25,-1.6,1.2); if(p.team!=null){ b+=(mgrOf(p.team).tac-50)/60; b+=climateOf(p.team).boost; } if(p.foreign&&p.fy===G.year&&p.adapt!=null)b+=(p.adapt-50)/22;
  if(p.sf&&p.sf.y===G.year)b+=p.sf.v+(p.sf.m||0);
  if(p.fat>45)b-=(p.fat-45)/18;
  if(p.wear){ const cap=p.isP?60+p.r.sta*1.3:70+(p.r.vit||52)*1.0; if(p.wear>cap)b-=Math.min(3,(p.wear-cap)/25); }
  return b; }
/* 선수 능력 차이가 타석 결과에 반영되는 폭. 1이면 능력 그대로, 낮을수록 운의 비중이 커진다.
   실제 KBO 시즌 승률 표준편차(약 0.06, 1위 0.60~0.61)에 맞춰 0.84로 둔다 */
const TALENT_W=.84;
function shrinkQ(q){ const o=Object.assign({},q); for(const k of ['bb','k','hr','babip'])o[k]=LGP[k]+(q[k]-LGP[k])*TALENT_W; return o; }
function outcome(b,p){
  const qb=shrinkQ(batProbs(b,boostOf(b))), qp=shrinkQ(pitProbs(p,boostOf(p)));
  const bb=comb(qb.bb,qp.bb,LGP.bb), k=comb(qb.k,qp.k,LGP.k), hr=comb(qb.hr,qp.hr,LGP.hr), babip=comb(qb.babip,qp.babip,LGP.babip)-(G.coach&&p.team!=null?(effC(coachesOf(p.team).dc,p.team)-55)*.0006:0)-(p.team!=null?anaEff(p.team).bab-.0016:0)+(b.team!=null?anaEff(b.team).bat-.0012:0); /* 전력분석: 수비 위치·투구 계획 */
  const x=R(); if(x<bb)return 'BB'; if(x<bb+k)return 'K'; if(x<bb+k+hr)return 'HR';
  if(R()<babip){ const y=R(); if(y<qb.d3)return '3B'; if(y<qb.d3+qb.d2)return '2B'; return '1B'; }
  return 'OUT';
}
function simGame(day,hid,aid,ps){
  const S={h:gameSide(hid,day),a:gameSide(aid,day)};
  const score={h:0,a:0}, line={h:[],a:[]}, hits={h:[],a:[]}, ev=[], pbp=[];
  const wc={}, lc={}; let walk=false;
  const opp=k=>k==='h'?'a':'h';
  const lim=(fs)=>{ const mm=mgrOf(fs.tid); const ae=mm.interim?50:mgrArmEff(mm); return fs.curIsSP?72+fs.cur.r.sta*.55+(50-mm.pen)/4+(ae-50)/3:18+fs.cur.r.sta*.3+(ae-50)/8; };
  function needChange(fs){ const x=fs.box.get(fs.cur.id); if(fs.curIsSP)return x.pc>=lim(fs)||x.er>=6||(x.er>=4&&x.pc>=lim(fs)-25); return x.outs>=3||x.pc>=lim(fs); }
  function bringIn(fs,inn,lead,half){
    const av=fs.pen.filter(p=>!fs.used.has(p.id)&&relAvail(p,day)); if(!av.length)return;
    const closer=fs.pen[0], setup=fs.pen.slice(1,4), mid=fs.pen.slice(4);
    let nxt=null;
    if(inn>=9&&lead>=1&&lead<=3) nxt=av.find(p=>p===closer);
    if(!nxt&&inn>=7&&lead>=0&&lead<=3) nxt=av.find(p=>setup.includes(p));
    if(!nxt&&(lead<-3||lead>4)) nxt=[...av].reverse().find(p=>p!==closer);
    if(!nxt) nxt=av.find(p=>mid.includes(p))||av.find(p=>p!==closer)||av[0];
    fs.exit[fs.cur.id]=lead; fs.cur=nxt; fs.curIsSP=false; fs.used.add(nxt.id); fs.box.set(nxt.id,pz()); fs.entry[nxt.id]=lead; fs.pitchers.push(nxt.id);
    if(ev.length<400)ev.push({h:half,t:`투수 교체: ${nxt.name}`}); if(pbp.length<260)pbp.push([half,'PC',nxt.id]);
  }
  function half(bk,inn){
    const bs=S[bk], fs=S[opp(bk)], isBot=bk==='h', half=(inn-1)*2+(isBot?1:0);
    const lead=()=>score[bk]-score[opp(bk)];
    if(fs.cur&&needChange(fs))bringIn(fs,inn,-lead(),half);
    let outs=0, runs=0, hh=0; const base=[null,null,null];
    while(outs<3){
      if(base[0]&&!base[1]&&outs<2&&base[0].r.spd>=52&&R()<(base[0].r.spd-48)*.008*(.5+mgrOf(bs.tid).small/100*1.3)){
        const r=base[0], rb=bs.box.get(r.id); if(R()<clamp(.55+(r.r.spd-50)*.008+(G.coach?(effC(coachesOf(bs.tid).rc,bs.tid)-55)*.003:0),.4,.9)){rb.sb++;base[1]=r;base[0]=null; if(pbp.length<260)pbp.push([half,'SB',r.id,outs,base.map(x=>x?x.id:0)]);} else {rb.cs++;base[0]=null;outs++; if(pbp.length<260)pbp.push([half,'CS',r.id,outs,base.map(x=>x?x.id:0)]); continue;} }
      const b=bs.order[bs.idx%bs.order.length]; bs.idx++;
      const p=fs.cur; const xb=bs.box.get(b.id), xp=fs.box.get(p.id);
      xb.pa++; xp.bf++; xp.pc+=Math.max(1,Math.round(N(3.9,1.3)));
      const o=outcome(b,p); const before=lead(); const sc=[]; let dp=false;
      const PB=()=>{ if(pbp.length<260)pbp.push([half,b.id,p.id,dp?'DP':o,outs,base.map(x=>x?x.id:0),sc.length,score.a,score.h]); };
      if(o==='BB'){ xb.bb++; xp.bb++; if(base[0]){ if(base[1]){ if(base[2])sc.push(base[2]); base[2]=base[1]; } base[1]=base[0]; } base[0]=b; }
      else { xb.ab++;
        if(o==='K'){ xb.so++; xp.so++; outs++; xp.outs++; }
        else if(o==='OUT'){
          if(R()<.018){ xp.h+=0; if(base[2])sc.push(base[2]); base[2]=base[1]; base[1]=base[0]; base[0]=b; }
          else if(base[0]&&outs<2&&R()<.11){ dp=true; outs+=2; xp.outs+=2; base[0]=null; }
          else { outs++; xp.outs++; if(outs<3&&base[2]&&R()<.4){ sc.push(base[2]); base[2]=null; } if(outs<3&&base[1]&&!base[2]&&R()<.3){ base[2]=base[1]; base[1]=null; } }
        } else { xb.h++; xp.h++; hh++;
          if(o==='HR'){ xb.hr++; xp.hr++; sc.push(...base.filter(Boolean),b); base[0]=base[1]=base[2]=null; }
          else if(o==='3B'){ xb.tr++; sc.push(...base.filter(Boolean)); base[0]=base[1]=null; base[2]=b; }
          else if(o==='2B'){ xb.d++; if(base[2])sc.push(base[2]); if(base[1])sc.push(base[1]); const r1=base[0]; base[0]=base[1]=base[2]=null; if(r1){ if(R()<.46+(r1.r.spd-50)*.006)sc.push(r1); else base[2]=r1; } base[1]=b; }
          else { if(base[2])sc.push(base[2]); base[2]=null;
            if(base[1]){ if(R()<.66+(base[1].r.spd-50)*.006)sc.push(base[1]); else base[2]=base[1]; base[1]=null; }
            if(base[0]){ if(!base[2]&&R()<.31+(base[0].r.spd-50)*.005)base[2]=base[0]; else base[1]=base[0]; base[0]=null; }
            base[0]=b; }
        }
      }
      if(sc.length){
        const n=sc.length; sc.forEach(r=>bs.box.get(r.id).r++); if(!dp)xb.rbi+=n; xp.er+=n; score[bk]+=n; runs+=n; PB();
        const after=lead(); if(before<=0&&after>0){ wc[bk]=bs.cur; lc[opp(bk)]=fs.cur; }
        const kind={HR:n===4?'만루 홈런':`${n}점 홈런`,'3B':'3루타','2B':'2루타','1B':'적시타',BB:'밀어내기 볼넷',OUT:'희생타',K:''}[o];
        if(ev.length<400)ev.push({h:half,t:`${b.name} ${kind}${o!=='HR'?` (${n}점)`:''} · ${score.a}:${score.h}`,run:true});
        if(isBot&&inn>=9&&score.h>score.a){ walk=true; break; }
      } else PB();
      if(outs<3&&fs.box.get(fs.cur.id).pc>lim(fs)+12)bringIn(fs,inn,-lead(),half);
    }
    line[bk].push(runs); hits[bk].push(hh);
  }
  const maxInn=ps?15:11; let inn=1;
  while(true){
    half('a',inn);
    if(inn>=9&&score.h>score.a){ line.h.push('X'); break; }
    half('h',inn);
    if(walk)break;
    if(inn>=9&&score.h!==score.a)break;
    if(inn>=maxInn)break;
    inn++;
  }
  // 승패·세이브·홀드
  const winK=score.h>score.a?'h':score.a>score.h?'a':null; const dec={};
  for(const k of ['h','a']){ const fs=S[k]; if(!(fs.cur.id in fs.exit))fs.exit[fs.cur.id]=score[k]-score[opp(k)]; }
  if(winK){ const loseK=opp(winK); const ws=S[winK]; let w=wc[winK]||ws.sp; let l=lc[loseK]||S[loseK].sp;
    if(w===ws.sp&&ws.box.get(w.id).outs<15&&ws.pitchers.length>1){ const rel=ws.pitchers.slice(1).map(id=>G.players[id]).filter(Boolean).sort((a,b)=>ws.box.get(b.id).outs-ws.box.get(a.id).outs)[0]; if(rel)w=rel; }
    dec.w=w.id; dec.l=l.id;
    const fin=G.players[ws.pitchers[ws.pitchers.length-1]];
    if(fin&&fin.id!==w.id&&fin!==ws.sp){ const el=ws.entry[fin.id]; if(el!=null&&el>=1&&el<=3)dec.sv=fin.id; }
    dec.hld=[]; for(const k of ['h','a']){ const s=S[k]; s.pitchers.slice(1).forEach(id=>{ if(id===dec.w||id===dec.sv||id===s.pitchers[s.pitchers.length-1])return; const el=s.entry[id], xl=s.exit[id]; if(el!=null&&el>=1&&el<=3&&xl!=null&&xl>=1)dec.hld.push(id); }); }
  }
  return {S,score,line,hits,ev,dec,inn,walk,pbp};
}
function applyGame(day,hid,aid,g,ps){
  let turfM=1; try{ turfM=stadTurfM(hid); }catch(e){}
  const y=G.year;
  for(const k of ['h','a']){ const s=g.S[k]; const bm=k==='a'?1+BUS[busLv(s.tid)].f:1; /* 원정 이동 피로 */
    for(const [id,x] of s.box){ const p=G.players[id]; if(!p)continue;
      if(!ps)storyGame(p,x,day,g.S[k==='h'?'a':'h'].tid,g.dec);
      if(p.isP){ p.prevApp=p.lastApp; p.lastApp=day; p.lastPc=x.pc; if(id===s.sp?.id)p.lastStart=day;
        p.fat=clamp((p.fat||0)+(x.pc*(id===s.sp?.id?.55:.9)+(id===s.sp?.id?0:6))*bm,0,100); if(!ps)p.wear=(p.wear||0)+x.pc/15; if(!ps){ (p.l10=p.l10||[]).push([x.outs,x.er,x.h,x.bb,x.so]); if(p.l10.length>10)p.l10.shift(); }
        if(!ps){ const h=lineFor(p,y,s.tid,'1군'); const o={g:1,gs:id===s.sp?.id?1:0,outs:x.outs,h:x.h,hr:x.hr,bb:x.bb,so:x.so,er:x.er,w:g.dec.w===id?1:0,l:g.dec.l===id?1:0,sv:g.dec.sv===id?1:0,hld:(g.dec.hld||[]).includes(id)?1:0}; addTo(h,o); }
        const risk=p.inj*(id===s.sp?.id?.022:.005)*injMult(p)*turfM*(1+Math.max(0,(p.fat||0)-60)/50)*(id===s.sp?.id?1+Math.max(0,(x.pc||0)-100)/60:1); if(R()<risk)injure(p,day);
      } else {
        if(!ps){ const h=lineFor(p,y,s.tid,'1군'); addTo(h,Object.assign({g:1},x)); h.pos=s.posOf[id]||h.pos||p.pos; }
        if(!ps){ const i=s.order.findIndex(q=>q.id===id); if(i>=0){ const u=(p.use&&p.use.y===y)?p.use:(p.use={y,g:0,pos:{},slot:{}}); u.g++; const ps_=s.posOf[id]||'DH'; u.pos[ps_]=(u.pos[ps_]||0)+1; u.slot[i+1]=(u.slot[i+1]||0)+1; } }
        if(s.order.some(q=>q.id===id)){ p.fat=clamp((p.fat||0)+((s.posOf[id]==='C'?15:s.posOf[id]==='DH'?6:10)-(p.r.vit||52)*.04)*bm,0,100); if(!ps){ p.wear=(p.wear||0)+1; (p.l10=p.l10||[]).push([x.ab,x.h,x.hr,x.bb,x.rbi,x.d+x.tr*2+x.hr*3]); if(p.l10.length>10)p.l10.shift(); } }
        if(R()<p.inj*.0045*injMult(p)*turfM*(1+Math.max(0,(p.fat||0)-60)/60))injure(p,day);
      }
    }
  }
  if(!ps){ try{ featGame(day,g); }catch(e){} }
  if(!ps){ const r=G.sea.rec; if(g.score.h>g.score.a){r[hid].w++;r[aid].l++;} else if(g.score.a>g.score.h){r[aid].w++;r[hid].l++;} else {r[hid].t++;r[aid].t++;}
    const tl=G.sea.tl||(G.sea.tl=G.teams.map(()=>[])); const sg=Math.sign(g.score.h-g.score.a); tl[hid].push([sg,g.score.h,g.score.a,1,aid,day]); tl[aid].push([-sg,g.score.a,g.score.h,0,hid,day]); }
}
function injure(p,day){
  let days=ri(5,35); if(R()<.3)days=ri(36,120); days=Math.max(3,Math.round(days*recMult(p)));
  p.injOut=days; p.injHist.push({y:G.year,days,d:G.day}); if(days>=30)story(p,`부상으로 약 ${days}일 이탈`,'inj');
  if(days>90&&R()<(p.team===G.user&&G.med.hosp==='a'?.18:.35)){ const d=ri(2,5); for(const k in p.r)p.r[k]=clamp(p.r[k]-d*rnd(.5,1.2),20,80); roundR(p); }
  if(p.team===G.user&&days>=30&&period()==='season'&&(ovr(p)>=55||p.sal>=800))news('선수',`${tshort(G.user)} 악재, ${p.name} 장기 이탈`,`${p.name}이(가) 부상으로 한 달 넘게 빠집니다. 전력 공백이 불가피합니다.`,-1,{ref:p.id});
  if(p.team===G.user){ const H=HOSP[G.med.hosp]; const msg=`${p.name}(${posLabel(p)})이(가) 부상으로 ${H.dx?'':'약 '}${days}일 이탈합니다.${H.c?` ${H.name}에서 치료합니다.`:''}${H.dx?` 정밀 검진 결과 재발 위험은 ${p.inj>.24?'높은':p.inj>.15?'보통':'낮은'} 편입니다.`:''}`; p.mor=clamp((p.mor||60)-4,0,100); days>=10?stop('부상',msg,p.id):note('부상',msg,p.id); }
  try{ evInjury(p,days); }catch(e){}
}
function gameRecord(day,hid,aid,g,kind){
  const side=k=>{ const s=g.S[k]; return {tid:s.tid,bat:s.order.map(p=>{const x=s.box.get(p.id);return {id:p.id,n:p.name,pos:s.posOf[p.id],ab:x.ab,h:x.h,d:x.d,tr:x.tr,hr:x.hr,rbi:x.rbi,bb:x.bb,so:x.so,r:x.r,sb:x.sb}}),
    pit:s.pitchers.map(id=>{const x=s.box.get(id);const p=G.players[id];return {id,n:p?p.name:'',outs:x.outs,h:x.h,hr:x.hr,er:x.er,bb:x.bb,so:x.so,pc:x.pc,d:g.dec.w===id?'승':g.dec.l===id?'패':g.dec.sv===id?'세':(g.dec.hld||[]).includes(id)?'홀':''}})}; };
  const me=hid===G.user?'h':'a'; const ms=g.score[me], os=g.score[me==='h'?'a':'h'];
  return {day,kind,home:hid,away:aid,hs:g.score.h,as:g.score.a,line:g.line,hits:g.hits,ev:g.ev,pbp:g.pbp,box:{h:side('h'),a:side('a')},res:ms>os?'승':ms<os?'패':'무',inn:g.inn};
}
function keepGame(rec){ G.games.unshift(rec); G.games=G.games.slice(0,25); G.games.forEach((g,i)=>{ if(i>=8&&g.pbp)delete g.pbp; }); }
function ulog(r){ (G.sea.ulog=G.sea.ulog||[]).push({d:r.day,h:r.home,a:r.away,hs:r.hs,as:r.as,res:r.res,k:r.kind||''}); }


/* ===== 하루 진행 ===== */
function blocker(){
  if(G.demoEnd)return '체험판은 여기까지입니다.';
  if(G.gameOver)return '경질되었습니다.';
  if(G.live)return '경기를 먼저 끝까지 보세요.';
  if(G.res)return '방금 끝난 경기 결과를 확인하세요.';
  if(G.fdWait)return '창단 드래프트를 시작하세요.';
  if(G.fd&&!G.fd.done)return '창단 드래프트를 먼저 마치세요.';
  if(G.draft&&!G.draft.done)return '신인 드래프트를 먼저 마치세요.';
  const cp=(G.comp||[]).find(c=>(c.stage==='protect'&&c.to===G.user)||(c.stage==='pick'&&c.from===G.user));
  if(cp)return cp.stage==='protect'?`${cp.name} 영입 보상: 보호선수 명단을 먼저 제출하세요.`:`${cp.name} 이적 보상: 보상선수(또는 보상금)를 먼저 고르세요.`;
  const per=period();
  if(per==='pre'&&G.day>=G.cal.open-1&&!G.mgr[G.user])return '감독이 없습니다. 스태프·육성 → 감독에서 감독을 선임해야 개막할 수 있습니다.';
  if(per==='season'||(per==='pre'&&G.day>=G.cal.open-1)){ const n=rosterN(G.user);
    if(n>ROSTER_MAX)return `로스터가 ${n}명입니다. ${ROSTER_MAX}명 이하로 줄여야 진행할 수 있습니다.`;
    const d=depth(G.user); if(d.start.length<9)return '건강한 야수가 9명이 안 됩니다.'; if(d.sp.length+d.pen.length<8)return '건강한 투수가 부족합니다.'; }
  return '';
}
function advance(mode){
  const start=G.day; const o=dobj(start);
  let target=mode==='day'?start+1:mode==='week'?start+7:mode==='month'?dnum(o.m===12?o.y+1:o.y,o.m===12?1:o.m+1,1):start+400;
  if(mode==='month'&&target-start<2)target=start+30;
  G.stops=[]; const r0=G.sea.rec[G.user]; const w0=r0.w,l0=r0.l; let days=0;
  /* 다음 일까지(event): 경기 결과에서 멈추지 않고, 중요한 소식·결정·포스트시즌 경기·한 주가 끝날 때(월요일) 멈춘다 */
  if(mode==='event'){ G.dig={from:start+1,to:start,games:[],snap:digSnap(),rk:userRank(),ev0:(G.evs||[]).filter(e=>!e.done).length}; target=start+60; } else G.dig=null;
  while(G.day<target){
    if(G.unemp)unempAuto();
    if(blocker())break;
    processDay(); days++;
    if(G.unemp){ unempAuto(); G.res=null; G.stops=G.stops.filter(x=>x.kind==='경력'); }
    if(mode==='event'){ const D=G.dig; D.to=G.day;
      if(G.res){ const g=G.games[G.res.i]; D.games.push(g?g.day:G.day); if(g&&/차전/.test(g.kind||''))break; G.res=null; }
      if(G.stops.length||G.live||(G.draft&&!G.draft.done)||G.gameOver)break;
      { const op=(G.evs||[]).filter(e=>!e.done); if(op.some(e=>EV_KEY.has(e.k)&&e.day>start))break; if((G.offers||[]).some(o=>o.day!=null?o.day>start:false))break; }
      if(D.games.length&&dobj(G.day+1).w===1)break; /* 다음 날이 월요일(휴식일)이면 한 주 정리 */
      if(D.games.length===0&&days>=14&&period()!=='season')break;
      if(G.unemp&&days>=14)break;
      continue; }
    if(G.stops.length||G.live||G.res||(G.draft&&!G.draft.done)||G.gameOver)break;
  }
  if(mode==='event'&&G.dig&&!G.dig.games.length)G.dig=null;
  const r1=G.sea.rec[G.user];
  G.lastAdv={days,from:start,to:G.day,w:r1.w-w0,l:r1.l-l0};
  return G.lastAdv;
}
/* 주간 요약용: 우리 선수 시즌 누적 기록 스냅숏 */
const DIGK=['pa','ab','h','bb','hr','rbi','d','tr','sb','outs','er','so','w','l','sv','hld','g','gs'];
function digSnap(){ const o={}; for(const p of playersOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); o[p.id]=h?DIGK.map(k=>h[k]||0):DIGK.map(()=>0); } return o; }
function userRank(){ try{ const st=standingsNow(); return st.findIndex(x=>x.tid===G.user)+1; }catch(e){ return 0; } }
/* 시즌 제한(현재 꺼 둠): 켜면 첫 시즌을 마치고 스토브리그 직전에서 멈춘다 */
const GAME_VER='0.9'; const DEMO={on:false,seasons:1}; /* 무료 정식 공개: 시즌 제한 없음 */
function demoOver(){ return DEMO.on&&G.year>=(G.startY||2026)+DEMO.seasons-1&&!G.unemp; }
function processDay(){
  if(G.demoEnd)return;
  G.day++; const day=G.day, o=dobj(day);
  if(day===KD(11,1)&&demoOver()){ G.day--; G.demoEnd=true; stop('체험판',`${G.year}시즌을 모두 마쳤습니다. 체험판은 여기까지입니다. 홈 화면에서 한 시즌 기록을 확인하세요.`); return; }
  if(o.m===1&&o.d===1){ newYear(); planSup(); ovrSnap(); }
  else if(o.d===1&&foreignOpen())refreshFMarket(12,3);
  dailyCost(); try{ stadDaily(); newStadDaily(); }catch(e){} try{evDaily();}catch(e){} try{ ovsDaily(); }catch(e){} try{ compDaily(); }catch(e){} try{ marketDaily(); }catch(e){}
  milDaily();
  recoverAll(1);
  if(o.w===0)for(const p of Object.values(G.players)){ if(p.sf&&p.sf.y===G.year)p.sf.m=clamp((p.sf.m||0)*.65+N(0,p.foreign?.75:.55),-2.5,2.5); }
  for(const p of Object.values(G.players)) if(p.injOut>0){ p.injOut--; if(p.injOut===0&&p.team===G.user)note('복귀',`${p.name}이(가) 부상에서 돌아왔습니다.`,p.id); }
  const c=G.cal;
  if(day===KD(2,1))for(const t of G.teams)if(t.id!==G.user){aiForeignFill(t.id,false);aiForeignFill(t.id,false);aiForeignFill(t.id,false);aiForeignFill(t.id,false);}
  if(day===KD(1,10))faUnsignedNote();
  if(day===KD(1,24)&&G.fa&&!G.fa.closed)faClose();
  if(day===KD(1,31)&&G.contract&&!G.contract.done){ { let g=0; while(fReCapInfo().over>0&&g++<4){ const C=G.contract; const k=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id)).sort((a,b)=>b.newSal-a.newSal)[0]; if(!k)break; C.foreignDrop.push(k.id); } } confirmContracts(); stop('연봉','연봉 계약 마감일입니다. 남은 선수는 제시안대로 계약했습니다.'); }
  if(day===c.camp)campStart();
  if(day===c.campEnd)campEnd();
  if(day===c.exh)note('일정','시범경기가 시작됩니다. 개막까지 2주 남았습니다.');
  if(day===c.open-1){ G.entryY=G.year; for(const t of G.teams){ setEntry(t.id); t.rot=0; } for(const p of Object.values(G.players))if(p.isP)delete p.lastStart; stop('일정',`내일(${dmd(c.open)}) ${G.year} 시즌이 개막합니다. 개막 엔트리가 정해졌습니다. 선수단 구성은 오늘까지 점검하세요.`); }
  if(day===c.open){ openingDay(); G.fut0={y:G.year,m:Object.fromEntries(playersOf(G.user).map(p=>[p.id,ovr(p)]))}; }
  if(day===KD(7,17)&&!G.unemp&&G.sea&&G.sea.y===G.year){ try{ deadlineDecision(); }catch(e){} }
  if(day===KD(7,24)||day===KD(7,28)){ try{ deadlineRumors(day===KD(7,28)); }catch(e){} }
  if(day===KD(7,24))stop('일정','트레이드 마감까지 7일 남았습니다. 7월 31일 이후 포스트시즌이 끝날 때까지 트레이드할 수 없습니다. 다른 구단 제안이 몰리는 시기입니다.');
  if(day===KD(7,31))stop('일정','오늘 자정 트레이드가 마감됩니다. 남은 제안과 협상을 오늘 안에 정리하세요.');
  if(day===KD(8,8)){ const n=foreignOf(G.user).filter(p=>p.foreign==='용병'&&healthy(p)).length; (n<3?stop:note)('일정',`외국인 선수 포스트시즌 등록 마감(8월 15일)까지 7일 남았습니다. 건강한 용병 ${n}명.`); }
  if(o.d===1&&o.m>=5&&o.m<=9&&period()==='season'){ try{ futuresReport(); }catch(e){} }
  if(o.d===1){ try{ growSnap(); }catch(e){} }
  if(day===c.asg)note('일정','올스타전이 열렸습니다. 후반기가 곧 시작됩니다.');
  if(day===c.draft)startDraft();
  if(entryOn()&&period()==='season'){ const wk=o.w===1; for(const t of G.teams)entryManage(t.id,wk&&(t.id!==G.user||R()<.7)); }
  if(c.sched[day])playDay(day);
  if(day===c.end+1)seasonEnd();
  if(G.ps&&!G.ps.done)psDay(day);
  if(G.ps&&G.ps.done&&G.ps.finDay===day){ settlement(); try{ stadSeasonNote(); }catch(e){} try{ draftRetro(); }catch(e){} }
  if(day===KD(11,1)){ offseason(); offseasonMgr(); try{ stadAI(); }catch(e){} }
  if(day===KD(11,2))faAnnounce();
  if(G.fa&&G.fa.open&&!G.fa.closed&&day>=G.fa.openDay)faDay(day);
  if(day===KD(12,1)){ contractStart(); aiCapAll(); capWarnUser(); }
  if(day===KD(12,10)){ try{ capCouncil(); }catch(e){} }
  if(day===KD(12,15)){ try{ milWarn(); }catch(e){} }
  if(day===KD(1,31)||day===G.cal.open-2)aiCapAll();
  if(o.w===0){ for(const t of G.teams){ if(t.id!==G.user&&rosterN(t.id)>ROSTER_MAX)trimRoster(t.id,ROSTER_MAX); } for(const m of G.mail){ if(!m.read&&!m.imp&&G.day-m.day>(m.kind==='업무'||(m.acts&&m.acts.length)?14:5))m.read=true; if(m.imp&&m.kind==='일정'&&G.day-m.day>=3){ m.imp=false; m.read=true; } } /* 날짜가 지난 일정 안내는 읽음 처리 */ futuresWeek(); aiWeekly(); moraleWeek(); try{roleWeek();}catch(e){} try{relSnap();}catch(e){} if(G.coach)try{coachMarketMonth();}catch(e){} try{evWeek();}catch(e){} devWeek(); if(period()==='season')updateLg(G.year); }
  tutTick();
  const nx=dobj(day+1); if(nx.d===1&&day>=c.open&&day<=c.end+1)monthReport(o.m);
  if(day===c.end){ const S=G.sea, r=S.rec[G.user], mk=S.mark||{w:0,l:0,t:0}; if(r&&r.w+r.l+(r.t||0)>mk.w+mk.l+(mk.t||0)){ S.months.push({m:dobj(c.end).m+'월',w:r.w-mk.w,l:r.l-mk.l,t:(r.t||0)-(mk.t||0)}); S.mark={w:r.w,l:r.l,t:r.t}; } } /* 정규시즌 마지막 날 남은 달을 바로 마감 */
  G.offers=(G.offers||[]).filter(x=>{ if(x.exp<day){ addLog(`${tname(x.from)}의 트레이드 제안이 만료되었습니다.`); offerMailDone(x.id); return false;} return true; });
}
function specialKind(day,hid,aid){
  if(hid!==G.user&&aid!==G.user)return null;
  if(day===G.cal.open)return '개막전';
  const o=dobj(day);
  if(o.m>=9){ const st=standingsNow(); const ia=st.findIndex(x=>x.tid===hid), ib=st.findIndex(x=>x.tid===aid); const gb=(a,b)=>Math.abs((a.w-a.l)-(b.w-b.l))/2;
    if(Math.max(ia,ib)<=6&&gb(st[ia],st[ib])<=1.5&&Math.min(ia,ib)<=4)return '순위 경쟁'; }
  return null;
}
function playDay(day){
  let userRec=null;
  for(const [h,a] of G.cal.sched[day]){
    const kind=specialKind(day,h,a);
    const g=simGame(day,h,a,false); applyGame(day,h,a,g,false); let st=null; try{ st=stadGame(day,h,a); }catch(e){}
    if(h===G.user||a===G.user){ userRec=gameRecord(day,h,a,g,kind); if(st){ userRec.att=st.att; userRec.so=st.so; } milestones(g,h===G.user?'h':'a'); }
  }
  if(userRec){
    const me=userRec.home===G.user?'h':'a', op=me==='h'?'a':'h';
    // 노히트 도전: 7회까지 상대 무안타
    if(!userRec.kind&&userRec.hits[op].slice(0,7).reduce((s,x)=>s+x,0)===0&&userRec.hits[op].length>=7){ userRec.kind='노히트 도전'; userRec.from=14; }
    keepGame(userRec); ulog(userRec); G.res={i:0}; prAfterGame(userRec);
  }
  rankSnap(day);
}
function milestones(g,me){
  const s=g.S[me];
  for(const [id,x] of s.box){ const p=G.players[id]; if(!p)continue;
    if(!p.isP&&x.hr>=3){ note('기록',`${p.name}이(가) 한 경기 홈런 ${x.hr}개를 쳤습니다.`,id); if(G.S_me===s.tid||s.tid===G.user)news('선수',`${p.name}, 한 경기 ${x.hr}홈런 폭발`,`${p.name}이(가) 한 경기에 홈런 ${x.hr}개를 몰아쳤습니다.`,1,{ref:id}); }
    if(p.isP&&x.so>=12)note('기록',`${p.name}이(가) 탈삼진 ${x.so}개를 잡았습니다.`,id);
    if(p.isP&&id===s.sp?.id&&x.outs>=27&&x.h===0){ stop('기록',`${p.name}이(가) 노히트노런을 달성했습니다.`,id); if(s.tid===G.user)news('선수',`${p.name} 노히트노런 대기록`,`${p.name}이(가) 9이닝 동안 안타를 하나도 내주지 않았습니다.`,4,{ref:id,fanW:2}); } }
}
function futuresWeek(){
  if(period()!=='season')return;
  for(const t of G.teams){ const d=depth(t.id);
    for(const p of d.futB){ const h=lineFor(p,G.year,t.id,'퓨처스'); addTo(h,Object.assign({g:3},simBat(p,ri(9,14),7))); if(!h.pos)h.pos=p.pos; }
    for(const p of d.futP){ const o=simPit(p,isSPr(p)?ri(12,18):ri(4,8),7); o.g=isSPr(p)?1:2; o.gs=isSPr(p)?1:0; addTo(lineFor(p,G.year,t.id,'퓨처스'),o); }
  }
}
function monthReport(m){
  const S=G.sea; const r=S.rec[G.user]; const prev=S.mark||{w:0,l:0,t:0};
  try{ pactMonth(m); }catch(e){}
  try{ dataReport(m); }catch(e){}
  const mw=r.w-prev.w, ml=r.l-prev.l; S.months.push({m:m+'월',w:mw,l:ml,t:(r.t||0)-(prev.t||0)}); S.mark={w:r.w,l:r.l,t:r.t};
  const best=domestic(G.user).concat(foreignOf(G.user)).map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h).sort((a,b)=>warOf(b.h,b.p)-warOf(a.h,a.p))[0];
  prMonth(m);
  try{ const mg=G.mgr[G.user]; if(mg&&!mg.interim&&!G.unemp){ const w0=G.mgrTalkW; G.mgrTalkW=Math.floor(G.day/7); const a1=mgrTalk('now').a, a2=mgrTalk('need').a; G.mgrTalkW=w0;
    mail(`${mg.name} 감독`,`${m}월 감독 면담`,`${a1.replace(/^.*?감독: /,'')}\n\n급한 자리: ${a2.replace(/^.*?감독: /,'')}`,{kind:'감독',acts:[{l:'감독실로',a:'goWork',v:'감독'}]}); } }catch(e){}
  note('월간',`${m}월 ${mw}승 ${ml}패. 시즌 ${r.w}승 ${r.l}패 ${standingsNow().findIndex(x=>x.tid===G.user)+1}위.${best?` 팀 내 WAR 1위 ${best.p.name}.`:''}`);
}
function standingsNow(){ const r=G.sea.rec; return G.teams.map(t=>({tid:t.id,w:r[t.id].w,l:r[t.id].l,t:r[t.id].t||0})).sort((a,b)=>((b.w/Math.max(1,b.w+b.l))-(a.w/Math.max(1,a.w+a.l)))||b.w-a.w); }

/* ===== 시즌 구간 이벤트 ===== */
function openingDay(){
  /* 시범경기 등판 순서를 지우고 개막전은 1선발부터 */
  for(const p of Object.values(G.players))if(p.isP&&p.team!=null){ delete p.lastStart; } for(const t of G.teams)t.rot=0;
  for(const t of G.teams) G.sea.fspend[t.id]=sum(foreignOf(t.id).map(p=>p.sal));
  { const v=G.teams.filter(t=>t.id!==G.user).map(t=>G.sea.fspend[t.id]||0); G.lgFor=G.lgFor||{}; G.lgFor[G.year]=Math.round(sum(v)/Math.max(1,v.length)); }
  const rs=G.teams.map(t=>({id:t.id,r:teamRating(t.id)})); const a=avg(rs.map(x=>x.r));
  rs.forEach(x=>team(x.id).expW=clamp(.5+(x.r-a)*.03,.36,.64));
  G.proj=rs.map(x=>({id:x.id,r:x.r+hn('proj'+G.year,x.id)*.7})).sort((p,q)=>q.r-p.r).map(x=>x.id);
  note('일정',`${G.year} 시즌 개막입니다. 전력분석팀 예상 순위 ${G.proj.indexOf(G.user)+1}위.`);
  if(!(G.goals&&G.goals.y===G.year&&G.goals.fd))setGoals(); news('분석',`${G.year} 시즌 전망: ${tshort(G.user)} ${G.proj.indexOf(G.user)+1}위 예상`,`전문가들은 ${tname(G.user)}을(를) ${G.proj.indexOf(G.user)+1}위 전력으로 봅니다.`,0);
}
function recoverAll(n){ const rb=1+facOf('rehab')*.06; for(const p of Object.values(G.players)){ if(p.team==null||!p.fat)continue; p.fat=Math.max(0,p.fat-n*(p.isP?10+p.r.sta*.12:2.5+(p.r.vit||52)*.08)*(p.team===G.user?rb:1)); } }
function rollForm(){ G.formY=G.year; for(const p of Object.values(G.players)){ if(p.team==null)continue; const sd=p.foreign?3.0:p.age>=33?2.4:2.0; p.sf={y:G.year,v:clamp(N(0,sd),-5,5),m:0,lk:clamp(N(0,.012),-.03,.03)}; p.wear=0; p.fat=0; p.l10=[]; } }
function campSnap(){ const o={}; for(const p of domestic(G.user).concat(foreignOf(G.user)))o[p.id]={o:Math.round(ovr(p)*10)/10,r:Object.assign({},p.r)}; return o; }
function campStart(){ rollForm(); try{ for(const t of G.teams)electCaptain(t.id,'새 시즌 선수단 투표'); }catch(e){} G.camp={focus:'balance',done:false,snap:campSnap()}; stop('캠프','스프링캠프가 시작되었습니다. 훈련 → 육성 탭에서 훈련 방향을 정하세요. 3월 5일에 결과가 나옵니다.'); }
const CAMP={balance:'균형',skill:'기술 훈련',fitness:'체력·부상 방지',game:'실전 감각'};
function campEnd(){
  if(!G.camp)return; const f=G.camp.focus; G.campInj=1; G.form=null; const ups=[];
  for(const p of domestic(G.user)){ if(p.age<=26&&(f==='skill'||f==='balance')){ const ks=Object.keys(p.r); const n=f==='skill'?2:1; for(let i=0;i<n;i++){ const k=pick(ks); const add=f==='skill'?rnd(.8,1.8):rnd(.4,1.0); if(p.r[k]+add<=Math.max(p.pot,ovr(p))+6)p.r[k]=clamp(p.r[k]+add,20,80);} roundR(p); } }
  if(f==='fitness')G.campInj=.78; if(f==='balance')G.campInj=.92;
  if(f==='game')G.form={until:dnum(G.year,4,30),b:2};
  G.camp.done=true;
  { const ps=domestic(G.user).concat(foreignOf(G.user)).filter(p=>p.sf).map(p=>({p,v:p.sf.v+N(0,1.2)})).sort((a,b)=>b.v-a.v); if(ps.length>6)mail('코칭스태프','캠프에서 본 선수들 컨디션',`캠프 기간 코치진 눈에 몸 상태가 특히 좋아 보인 선수: ${ps.slice(0,3).map(x=>x.p.name).join(', ')}.\n\n반대로 컨디션이 올라오지 않은 선수: ${ps.slice(-3).map(x=>x.p.name).join(', ')}.\n\n같은 선수라도 해마다 몸 상태와 감이 달라 성적이 오르내립니다. 외국인 선수는 그 폭이 더 큽니다.`,{kind:'캠프'}); }
  /* 캠프 결산: 캠프 시작 때와 비교해 능력이 오르거나 내린 선수를 정리해 보낸다 */
  const snap=G.camp.snap||{}; const rows=domestic(G.user).concat(foreignOf(G.user)).filter(p=>snap[p.id]&&snap[p.id].r).map(p=>{ const S=snap[p.id]; const ch=Object.keys(p.r).map(k=>[k,Math.round((p.r[k]-(S.r[k]??p.r[k]))*10)/10]).filter(x=>Math.abs(x[1])>=.3).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])); const tot=sum(ch.map(x=>x[1])); return {p,a:Math.round(S.o),b:Math.round(ovr(p)),ch,tot}; }).filter(x=>x.ch.length);
  const up=rows.filter(x=>x.tot>0).sort((x,y)=>y.tot-x.tot), dn=rows.filter(x=>x.tot<0).sort((x,y)=>x.tot-y.tot);
  const line=x=>`${x.p.name} (${posLabel(x.p)}, ${x.p.age}세) ${x.ch.slice(0,3).map(([k,v])=>`${TOOLK[k]||k} ${v>0?'+':''}${v.toFixed(1)}`).join(', ')}${x.b!==x.a?` · 능력 ${x.a} → ${x.b}`:''}`;
  const eff=f==='skill'?'26세 이하 선수 기술이 집중적으로 늘었습니다.':f==='fitness'?'올 시즌 부상 위험이 22% 줄었습니다.':f==='game'?'4월 말까지 경기 감각이 좋습니다.':'26세 이하 선수 성장과 부상 방지(부상 위험 -8%)를 고르게 챙겼습니다.';
  mail('코칭스태프',`스프링캠프 결산: ${up.length?`${up.length}명 능력 상승`:'능력 변화 적음'}`,`훈련 방향: ${CAMP[f]}. ${eff}\n\n${up.length?`능력이 오른 선수 ${up.length}명\n${up.slice(0,12).map(line).join('\n')}${up.length>12?`\n외 ${up.length-12}명`:''}`:'능력이 눈에 띄게 오른 선수는 없습니다.'}${dn.length?`\n\n능력이 내린 선수 ${dn.length}명\n${dn.slice(0,6).map(line).join('\n')}`:''}\n\n2군 연수 효과와 캠프 훈련이 함께 반영된 수치입니다(캠프 시작일 대비).`,{kind:'캠프',imp:true,acts:[{l:'선수단 보기',a:'go',v:'roster:glance'}]});
}
function seasonEnd(){
  updateLg(G.year);
  const st=standingsNow(); const s=st.map(x=>x.tid);
  stop('일정',`정규시즌이 끝났습니다. 우리 구단 ${st.findIndex(x=>x.tid===G.user)+1}위. 1위 ${tname(s[0])}.`);
  G.ps={seeds:s.slice(0,5),order:st,res:{},round:'wc',done:false};
  G.ps.cur=mkSeries('wc',s[3],s[4],G.day+2);
}
function mkSeries(round,hi,lo,start){
  const off={wc:[0,1],spo:[0,1,3,4,6],po:[0,1,3,4,6],ks:[0,1,3,4,5,7,8]}[round];
  const homes={wc:[hi,hi],spo:[hi,hi,lo,lo,hi],po:[hi,hi,lo,lo,hi],ks:[hi,hi,lo,lo,lo,hi,hi]}[round];
  const need={wc:[1,2],spo:[3,3],po:[3,3],ks:[4,4]}[round];
  return {round,hi,lo,wh:0,wl:0,days:off.map(x=>start+x),homes,need,gi:0};
}
const ROUNDK={wc:'와일드카드 결정전',spo:'준플레이오프',po:'플레이오프',ks:'한국시리즈'};
function psDay(day){
  const P=G.ps, s=P.cur; if(!s||s.days[s.gi]!==day)return;
  const h=s.homes[s.gi], a=h===s.hi?s.lo:s.hi;
  const g=simGame(day,h,a,true); applyGame(day,h,a,g,true);
  let win=g.score.h>g.score.a?h:g.score.a>g.score.h?a:null;
  if(win===s.hi)s.wh++; else if(win===s.lo)s.wl++;
  s.gi++;
  if(h===G.user||a===G.user){ const rec=gameRecord(day,h,a,g,`${ROUNDK[s.round]} ${s.gi}차전`); keepGame(rec); ulog(rec); G.res={i:0}; prAfterGame(rec); }
  let done=null; if(s.wh>=s.need[0])done=[s.hi,s.lo]; else if(s.wl>=s.need[1])done=[s.lo,s.hi]; else if(s.gi>=s.days.length)done=s.wh>=s.wl?[s.hi,s.lo]:[s.lo,s.hi];
  if(done){ P.res[s.round]=[done[0],done[1],done[0]===s.hi?s.wh:s.wl,done[0]===s.hi?s.wl:s.wh];
    const msg=`${ROUNDK[s.round]}: ${tname(done[0])}이(가) ${P.res[s.round][2]}승 ${P.res[s.round][3]}패로 이겼습니다.`;
    (done.includes(G.user)?stop:note)('포스트시즌',msg+(done[1]===G.user?' 우리 구단의 포스트시즌은 여기서 끝났습니다.':done[0]===G.user&&s.round!=='ks'?' 우리 구단이 다음 시리즈에 올랐습니다.':''));
    const nx={wc:['spo',P.seeds[2]],spo:['po',P.seeds[1]],po:['ks',P.seeds[0]]}[s.round];
    if(nx){ P.round=nx[0]; P.cur=mkSeries(nx[0],nx[1],done[0],day+2); }
    else { P.done=true; P.cur=null; P.champ=done[0]; P.runner=done[1]; P.finDay=day+2; stop('포스트시즌',`${tname(done[0])}이(가) 한국시리즈 우승을 차지했습니다.${done[0]===G.user?' 우리 구단이 정상에 올랐습니다.':''}`); }
  }
}
function settlement(){
  const y=G.year; const P=G.ps; const prePop=G.teams.map(t=>t.pop);
  const order=P.order.map(x=>({tid:x.tid,w:G.sea.rec[x.tid].w,l:G.sea.rec[x.tid].l,t:G.sea.rec[x.tid].t||0}));
  const ps={wc:P.res.wc,spo:P.res.spo,po:P.res.po,ks:P.res.ks,champ:P.champ,runner:P.runner,poLose:P.res.po[1],spoLose:P.res.spo[1],wcLose:P.res.wc[1],first:order[0].tid};
  const gate=Math.round(rnd(128,162)*100), pool=Math.round(gate*.6);
  const share={}; G.teams.forEach(t=>share[t.id]=0);
  share[ps.first]+=Math.round(pool*.2); const rest=pool*.8;
  share[ps.champ]+=Math.round(rest*.5); share[ps.runner]+=Math.round(rest*.24); share[ps.poLose]+=Math.round(rest*.14); share[ps.spoLose]+=Math.round(rest*.09); share[ps.wcLose]+=Math.round(rest*.03);
  const fins={}; const fins_self={};
  for(const t of G.teams){
    const o=order.find(x=>x.tid===t.id); const wp=o.w/Math.max(1,o.w+o.l);
    const fanM=t.id===G.user&&G.pr?(0.9+G.pr.fan/500):1, adM=t.id===G.user&&G.pr?(0.85+G.pr.fan/333)*(0.95+G.pr.press/1000):1;
    const AT=G.sea.att&&G.sea.att[t.id]; const S=stadOf(t.id); const att=stadProj(t.id).att||Math.round(1e6*t.market*(.62+t.pop*.38+(wp-.5)*1.4)*fanM);
    const mkt=t.id===G.user?G.marketing:2000;
    const ci=capInfo(t.id);
    let tax=0; if(ci.over>0){ const n=(t.capOver||0)+1; tax=Math.round(ci.over*capRate(n)); t.capOver=n; if(n>=3)t.pickPen=G.year+1; } else t.capOver=0;
    let flo=0; if(G.year>=2027){ const under=ci.floor-ci.pay; if(under>0){ const n=(t.floorUnder||0)+1; flo=Math.round(under*capRate(n)); t.floorUnder=n; } else t.floorUnder=0; }
    const champBonus=(ps.champ===t.id&&!t.indie)?Math.round(pool*.5*(t.owner==='profit'?.6:1)):0;
    const inc=[['입장 수입',Math.round(att*TICKET*PRICE[S.price].m)],['구장 부대 수입',Math.max(0,Math.round(att*.0003*(S.lv.fnb-2)))+(S.lv.prem-2)*600+(S.lv.vis-2)*400],['중계권 배분',9000],['광고·상품',Math.round((5200+mkt*1.6)*t.market*t.pop*adM)]]; { const si=starIncome(t.id); if(si>0)inc.push(['스타 마케팅',si]); }
    if(t.indie)inc.push(['메인 스폰서',10500]); if(S.compIn>0)inc.push(['FA 보상금 수령',S.compIn]);
    if(share[t.id])inc.push(['포스트시즌 배당금',share[t.id]]);
    if(champBonus)inc.push(['모기업 우승 보너스',champBonus]);
    const scoutCost=t.id===G.user?sum(G.scouts.map(s=>s.sal))+600:1500;
    const exp=[['국내 선수 연봉',ci.all],['외국인 선수 연봉',G.sea.fspend[t.id]||0],['구단 운영비',t.indie?19000:24000],['스카우트 운영',scoutCost],['마케팅',mkt]];
    if(tax)exp.push(['경쟁균형세(야구발전기금)',tax]);
    { const bn=G.sea.bonus&&G.sea.bonus[t.id]; if(bn)exp.push(['신인 계약금',bn]); }
    { const due=newStadDue(t.id); if(due){ exp.push(['신구장 분담금',due]); inc.push(['모기업 신구장 출자(분담금의 70%)',Math.round(due*.7)]); stadOf(t.id).proj.paid=(stadOf(t.id).proj.paid||0)+due; } }
    { const up=sum(STAD_ITEMS.map(x=>STAD_UP[S.lv[x.k]]-STAD_UP[2])); if(up>0)exp.push(['구장 시설 유지비',up]); }
    if(flo)exp.push(['하한 미달 발전기금',flo]);
    if(t.id===G.user){ const S=G.spend; [['감독 연봉',S.mgr],['코치진 연봉',S.coach||0],['부상 방지 프로그램',S.med],['병원 제휴',S.hosp],['해외 연수',S.dev],['해외 스카우트망',S.intl||0],['전력분석원 연봉',S.data||0],['훈련 시설 유지비',S.fac||0],['단장 결정 지출',S.etc||0],['FA 보상금',S.comp||0],['방출 정산금',S.rel||0]].forEach(x=>{ if(x[1]>0)exp.push([x[0],Math.round(x[1])]); }); if(S.compIn>0)inc.push(['FA 보상금 수령',Math.round(S.compIn)]); G.spend={mgr:0,coach:0,med:0,hosp:0,dev:0,intl:0,fac:0,etc:0}; }
    const gap=sum(exp.map(x=>x[1]))-sum(inc.map(x=>x[1]));
    let support=0; const supCap=supportCap(t);
    /* 구단 보유 자금이 30억을 넘으면 적자의 일부(초과분의 절반까지)를 먼저 자체 자금으로 메운다 */
    const selfC=gap>0?Math.min(gap,Math.max(0,t.cash-3000)*.5):0;
    if(!t.indie&&gap-selfC>0){ support=Math.min(gap-selfC,supCap); inc.push(['모기업 지원(적자 보전)',support]); }
    if(selfC>0)fins_self[t.id]=Math.round(selfC);
    const net=sum(inc.map(x=>x[1]))-sum(exp.map(x=>x[1]));
    t.cash+=net;
    /* 독립구단은 이익이 쌓이면 투자사가 배당으로 가져간다(80억 초과분의 절반) */
    let div=0; if(t.indie&&t.cash>8000){ div=Math.round((t.cash-8000)*.5); t.cash-=div; if(t.id!==G.user)wire('구단',`${t.city} ${t.nick} 투자사, 배당 ${money(div)} 회수`,{tid:t.id}); }
    t.pop=clamp(1+(t.pop-1)*.85+(wp-.5)*.5+(mkt-2000)/45000+(ps.champ===t.id?.06:0)+(G.mgr[t.id]&&G.mgr[t.id].fame>=70?.03:0),.7,1.45);
    fins[t.id]={att,inc,exp,net,cash:t.cash,tax,support,supCap,selfC:fins_self[t.id]||0,div};
  }
  const u=team(G.user); const uo=order.find(x=>x.tid===G.user); const wp=uo.w/Math.max(1,uo.w+uo.l);
  const made=[ps.champ,ps.runner,ps.poLose,ps.spoLose,ps.wcLose].includes(G.user);
  const psPart=ps.champ===G.user?10:ps.runner===G.user?6:ps.poLose===G.user?4:made?2:-1;
  const w=OWNER[u.owner].w; const fin=fins[G.user];
  const finScore=clamp(fin.net/2500,-8,5)-(fin.supCap?(fin.support/fin.supCap-.5)*4:0);
  /* 공개된 순위 목표를 달성했으면 기대 승률 대비 평가로 깎지 않는다. 창단 첫해는 폭을 줄인다 */
  const rkNow=order.findIndex(x=>x.tid===G.user)+1; let perf=(wp-u.expW)*150*w[0]; if(G.goals&&G.goals.y===y&&rkNow<=G.goals.rank)perf=Math.max(perf,0); if(G.startY===y)perf=clamp(perf,-3,6);
  const why=[['성적(기대 승률 대비)',perf],['포스트시즌',psPart*w[1]],['수지(순이익·모기업 지원)',finScore*w[2]],['인기 변화',(u.pop-prePop[G.user])*40*w[3]]];
  let delta=sum(why.map(x=>x[1]));
  if(u.cash<0){ delta-=5; why.push(['자금 마이너스',-5]); }
  const gy=goalYearEnd(order.findIndex(x=>x.tid===G.user)+1,fin); delta+=gy.d; why.push(['구단주 목표(순위·재정·여론)',gy.d]); const pz=(G.pr?(G.pr.press-50)/10:0); delta+=pz; why.push(['언론 논조',pz]);
  delta=Math.round(delta); const before=u.trust; u.trust=clamp(u.trust+delta,0,100);
  const notes=[];
  for(const tr of G.trades.filter(x=>x.y===y&&!x.revealed)){ tr.revealed=true; if(tr.diff>7){ const t=team(tr.with); t.rel=clamp(t.rel-6,0,100); notes.push(`${tname(tr.with)} 단장이 지난 트레이드에서 손해를 봤다고 판단해 관계가 나빠졌습니다.`);} }
  const lines=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(h)lines.push({p,h}); }
  const bats=lines.filter(x=>!x.p.isP), pits=lines.filter(x=>x.p.isP);
  const top=(arr,f,flt,asc)=>arr.filter(flt).sort((a,b)=>asc?f(a)-f(b):f(b)-f(a))[0];
  const leaders=[
    ['타자 WAR',top(bats,x=>warOf(x.h,x.p),()=>true),x=>warOf(x.h,x.p).toFixed(1)],
    ['OPS',top(bats,x=>bRate(x.h).ops,x=>x.h.pa>=446),x=>fmt3(bRate(x.h).ops)],
    ['타율',top(bats,x=>bRate(x.h).avg,x=>x.h.pa>=446),x=>fmt3(bRate(x.h).avg)],
    ['홈런',top(bats,x=>x.h.hr,()=>true),x=>x.h.hr+'개'],
    ['타점',top(bats,x=>x.h.rbi,()=>true),x=>x.h.rbi+'개'],
    ['도루',top(bats,x=>x.h.sb,()=>true),x=>x.h.sb+'개'],
    ['투수 WAR',top(pits,x=>warOf(x.h,x.p),()=>true),x=>warOf(x.h,x.p).toFixed(1)],
    ['평균자책점',top(pits,x=>pRate(x.h).era,x=>x.h.outs>=432,true),x=>pRate(x.h).era.toFixed(2)],
    ['다승',top(pits,x=>x.h.w,()=>true),x=>x.h.w+'승'],
    ['탈삼진',top(pits,x=>x.h.so,()=>true),x=>x.h.so+'개'],
    ['세이브',top(pits,x=>x.h.sv,()=>true),x=>x.h.sv+'개'],
    ['홀드',top(pits,x=>x.h.hld,()=>true),x=>x.h.hld+'개'],
  ].filter(l=>l[1]).map(l=>({k:l[0],id:l[1].p.id,v:l[2](l[1]),nm:l[1].p.name,t:l[1].h.t??l[1].p.team}));
  const rank=order.findIndex(o=>o.tid===G.user)+1;
  if(!G.unemp){ const psr=ps.champ===G.user?' · 한국시리즈 우승':ps.runner===G.user?' · 한국시리즈 준우승':ps.poLose===G.user?' · 플레이오프 진출':ps.spoLose===G.user?' · 준플레이오프 진출':ps.wcLose===G.user?' · 와일드카드 진출':''; chron('season',`${uo.w}승 ${uo.l}패${uo.t?` ${uo.t}무`:''} ${rank}위${psr}`); }
  try{ franchiseCheck(); }catch(e){}
  try{ if(!G.unemp)seasonReview(y); }catch(e){}
  storySeason(y); const awards=seasonAwards(y); try{ featSeason(y); mgrEyeReport(); starAwardsNews(); }catch(e){}
  G.history.push({y,order,champ:ps.champ,runner:ps.runner,user:{w:uo.w,l:uo.l,t:uo.t,rank,net:fin.net,trust:u.trust}});
  { const S=G.sea, r=S.rec[G.user], mk=S.mark||{w:0,l:0,t:0}; if(r&&r.w+r.l+(r.t||0)>mk.w+mk.l+(mk.t||0)){ S.months.push({m:dobj(G.cal.end).m+'월',w:r.w-mk.w,l:r.l-mk.l,t:(r.t||0)-(mk.t||0)}); S.mark={w:r.w,l:r.l,t:r.t}; } } /* 마지막 달(9·10월) 잔여 경기도 결산에 넣는다 */
  G.last={y,order,ps,fins,trust:{before,after:u.trust,delta},notes,leaders,gate,pool,months:G.sea.months,goals:gy.lines,awards,pr:G.pr?{fan:Math.round(G.pr.fan),press:Math.round(G.pr.press)}:null};
  if(!G.unemp)try{ G.last.rep=repSeason(y,rank,ps.champ===G.user,ps.runner===G.user,delta); }catch(e){}
  if(u.trust<12&&!G.unemp){ firedFlow(y,`구단주 신뢰가 ${u.trust}까지 떨어져 ${y}시즌을 끝으로 경질되었습니다.`); }
  stop('결산',`${y}시즌 결산이 나왔습니다. ${uo.w}승 ${uo.l}패 ${rank}위, 구단주 신뢰 ${before}→${u.trust}. 신뢰 변화 내역: ${why.filter(x=>Math.abs(x[1])>=.5).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).map(x=>`${x[0]} ${x[1]>0?'+':''}${Math.round(x[1])}`).join(', ')||'변화 없음'}.`);
}

/* ===== 스토브리그 ===== */
function offseason(){ try{ if(G.startY&&G.year>=G.startY+2&&!G.fdRev&&!G.unemp)fdReview(); }catch(e){} for(const t of G.teams){ if(t.id!==G.user&&t.cash<-5000)t.mode='rebuild'; }
  const retired=[], declared=[], obs=[];
  for(const p of Object.values(G.players)){
    if(p.team==null||p.foreign||p.joinY>G.year)continue;
    const o=ovr(p);
    if(p.age>=40||(p.age>=35&&o<44)||(p.age>=32&&o<34&&!p.faC)){ try{ legendRetire(p); }catch(e){} retired.push({name:p.name,team:p.team,age:p.age}); const rec=retireRecord(p); try{ obs.push(obFromPlayer(p,rec)); }catch(e){} for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; delete G.players[p.id]; }
  }
  const all=Object.values(G.players).filter(p=>p.team!=null&&!(p.joinY>G.year));
  /* FA 등록일수(실제는 시즌 145일 이상 1군 등록): 게임에서는 1군에서 시즌 대부분을 보낸 해를 인정(야수 85경기·260타석, 투수 40경기·90이닝·선발 16경기 중 하나). 팀당 한 해 16명 안팎이 채운다 */
  const svcOk=p=>{ const h=seasonTotal(p,G.year,'1군'); if(!h)return false; return p.isP?((h.g||0)>=40||(h.outs||0)>=270||(h.gs||0)>=16):((h.g||0)>=85||(h.pa||0)>=260); };
  all.forEach(p=>{ if(p.foreign||svcOk(p))p.svc++; delete p.extTried; delete p.extOk;});
  for(const p of all){ if(p.foreign)continue; p.salH=(p.salH||[]).filter(x=>x.y!==G.year); p.salH.push({y:G.year,s:p.sal}); if(p.salH.length>4)p.salH.shift(); }
  const pool=[];
  for(const p of all){
    if(p.foreign)continue;
    if(p.extNext){ p.sal=p.extNext.annual; p.yrs=p.extNext.years; p.faC=true; p.ext=true; delete p.extNext; continue; }
    if(p.faC){ p.yrs--; if(p.yrs>0)continue; p.faC=false; p.ext=false; }
    const elig=p.svc>=faSvc(p)&&(p.lastFA==null||G.year-p.lastFA>=4)&&p.age<=37;
    /* 자격이 있어도 신청은 선수 몫: 시장 가치가 낮거나 나이가 많으면 신청하지 않고 남는다 */
    const o2=ovr(p); let dp=o2>=58?.97:o2>=52?.82:o2>=47?.45:o2>=42?.18:.05; if(p.age>=35)dp*=.5; if(p.faSkip)dp+=.1;
    if(elig&&R()>=dp){ p.faSkip=G.year; if(p.team===G.user)(G._faSkip=G._faSkip||[]).push(p.name); continue; }
    if(elig){ delete p.faSkip; const grade=faGradeOf(p,all);
      p.faFrom=p.team; p.faGrade=grade; p.faPrevSal=p.sal; p.ask=faAsk(p); p.ask0=p.ask.annual; try{ agentOf(p); }catch(e){} p.team=null; pool.push(p.id);
      for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k];
      if(p.faFrom===G.user)declared.push(p.id); }
  }
  try{ ovsFA(pool); }catch(e){}
  G.fa={pool,offers:{},ai:{},open:false,openDay:KD(11,6),closed:false,results:[],cap:pool.length<=20?2:3,outN:{},y0:G.year};
  if(G._faSkip&&G._faSkip.length){ note('FA',`FA 자격이 있지만 신청하지 않고 남은 우리 선수: ${G._faSkip.join(', ')}. 내년에도 자격은 유지됩니다.`); } G._faSkip=null;
  G.retired=retired; G.rolled=G.year; try{ obRetireEvents(obs); }catch(e){} try{ abroadYear(); }catch(e){} try{ fOverseas(); }catch(e){} try{ postingSeason(); }catch(e){}
  const mine=retired.filter(r=>r.team===G.user);
  stop('스토브리그',`스토브리그가 시작되었습니다. 은퇴 ${retired.length}명(우리 ${mine.length}명), FA 자격 ${pool.length}명(우리 ${declared.length}명). 11월 2일 FA 공시, 6일부터 협상, 12월 1일 연봉 협상이 시작됩니다.`);
}
function faAnnounce(){ if(!G.fa)return; G.fa.open=true; const mine=G.fa.pool.filter(id=>G.players[id]&&G.players[id].faFrom===G.user).length;
  stop('FA',`FA 승인 선수 ${G.fa.pool.length}명이 공시되었습니다. 우리 구단 ${mine}명. 다른 구단 FA는 구단마다 ${faCapN()}명까지 영입할 수 있습니다(KBO 규약 제173조). 11월 6일부터 모든 구단과 협상합니다. 영입·계약 → FA 시장에서 조건을 제시하세요.`); }
function faCapN(){ const F=G.fa; return F&&F.cap?F.cap:(F&&F.pool&&F.pool.length>20?3:2); }
function faOutN(tid){ const F=G.fa; return F&&F.outN?(F.outN[tid]||0):0; }
function faOutBlocked(tid,p){ return tid!==p.faFrom&&faOutN(tid)>=faCapN(); }
/* AI 구단이 매기는 FA의 값: 요구액이 아니라 능력·나이로 정한다(인플레이션 억제) */
function faWorth(t,p){ const pf=perfOvr(p,3); const base=pf==null?ovr(p):pf*.6+ovr(p)*.4; const af=p.age<30?1.12:p.age<=32?1:p.age<=34?.75:.55; return round5(Math.max(MIN_SAL,marketSal(base)*af*(t.id===p.faFrom?1.05:1)*(t.mode==='contend'?1.04:.94))); }
function faInterest(t,p){
  const room=capOf(G.year)-capPay(t.id); const po=ovr(p)+hn('o'+t.id,p.id)*3;
  if(faOutBlocked(t.id,p))return 0;
  if(t.id!==G.user&&capPay(t.id)+p.ask.annual*.9>capOf(G.year)*(t.id===p.faFrom?1.01:.99))return 0;
  if(t.id!==p.faFrom&&t.cash<-3000)return 0;
  if(t.id!==p.faFrom&&ovr(p)<47)return 0;
  /* 보상 비용(보상금)을 계약 총액과 견준다: 몸값보다 보상금이 크면 외부 구단은 거의 손대지 않는다 */
  let compF=1; if(t.id!==p.faFrom){ const ps=p.faPrevSal||p.sal||0; const cc=p.faGrade==='A'?ps*2:p.faGrade==='B'?ps:ps*1.5; compF=clamp(1-cc/Math.max(1,p.ask.annual*p.ask.years*.8),.08,1); }
  const debt=t.id===p.faFrom&&t.id!==G.user&&(t.cash<-5000||capPay(t.id)>capOf(G.year)*1.1)?.35:1;
  if(t.cash<-8000&&t.id!==p.faFrom)return 0;
  if(p.ask.annual>room*1.15&&t.owner==='profit')return 0;
  if(p.ask.annual>room*1.5)return 0;
  /* 연봉 총액이 낮은 구단(하한 근처)은 돈을 쓸 이유가 있다 */
  const low=(capPay(t.id)<capOf(G.year)*.5?.22:capPay(t.id)<capOf(G.year)*.65?.1:0)+(t.cash>6000?.08:0);
  return compF*clamp(.12+low+(po-50)*.03+(t.mode==='contend'?.12:0)+needScore(t.id,p)*.18+(t.id===p.faFrom?.45:0)-(t.id!==p.faFrom&&p.faGrade==='A'?.12:0)-(playersOf(t.id).length>=39?.25:0),0,1)*debt;
}
function faDay(day){
  const F=G.fa; const since=day-F.openDay;
  if(day===F.openDay){ const mine=F.pool.filter(id=>G.players[id]&&G.players[id].faFrom===G.user&&G.players[id].team==null); stop('FA',`오늘부터 모든 구단과 FA 협상이 열립니다.${mine.length?` 우리 FA ${mine.length}명(${mine.slice(0,4).map(id=>G.players[id].name).join(', ')}${mine.length>4?' 등':''})에게 다른 구단도 제안할 수 있습니다.`:''} 영입·계약 → FA 시장에서 조건을 제시하세요.`); }
  F.warned=F.warned||{};
  if(day===F.openDay&&!G.unemp){ const top=F.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.faFrom!==G.user).sort((a,b)=>ovr(b)-ovr(a)).slice(0,5);
    if(top.length)mail('스카우트팀장','FA 시장 개장: 주요 선수 5명',top.map((p,i)=>`${i+1}. ${p.name} (${posLabel(p)}, ${p.age}세, ${p.faGrade}등급, 원소속 ${tshort(p.faFrom)}) · 요구 연 ${money(p.ask.annual)} ${p.ask.years}년`).join('\n')+'\n\n관심 선수로 별표를 해 두면 다른 구단이 제안할 때 바로 알려 드립니다.',{kind:'FA',acts:[{l:'FA 시장',a:'goWork',v:'FA시장'}]}); }
  /* 찾는 구단이 없으면 요구액이 매주 내려간다(최초 요구의 40%까지) */
  if(since>0&&since%7===0)for(const id of F.pool){ const p=G.players[id]; if(!p||p.team!=null)continue; const ai=F.ai[id]||{}; if(Object.keys(ai).length||F.offers[id])continue; const a0=p.ask0||p.ask.annual; const na=round5(Math.max(a0*.4,MIN_SAL,p.ask.annual*.9)); if(na<p.ask.annual){ p.ask.annual=na; if(since>=35)p.ask.years=Math.min(p.ask.years,since>=50?1:2); } }
  for(const id of [...F.pool]){
    const p=G.players[id]; if(!p||p.team!=null)continue;
    const ai=F.ai[id]||(F.ai[id]={});
    const po=ovr(p);
    for(const t of G.teams){ if((t.id===G.user&&!G.unemp)||ai[t.id])continue; const own=t.id===p.faFrom;
      /* 애매한 선수는 원소속 구단도 서두르지 않는다: 시장 반응을 본 뒤(협상 50일 이후) 낮춰 부른다 */
      if(own&&po<50&&since<50)continue;
      let it=faInterest(t,p); if(!own)it*=po<52?.35:.7; if(it>0&&R()<it*.1){ const w=faWorth(t,p)*(own&&po<50?.65:1); ai[t.id]={annual:round5(Math.min(p.ask.annual*rnd(.85,1.12),w)),years:own&&po<50?1:clamp(p.ask.years+ri(-1,1),1,6)}; } }
    if(p.faFrom!==G.user&&!G.unemp&&!F.offers[id]&&!F.warned[id]&&((G.shortlist||[]).includes(id)||mreqOpen('fa').some(r=>r.data&&r.data.pid===id))&&Object.keys(ai).some(k=>+k!==G.user)){ F.warned[id]=1; const k0=Object.keys(ai).find(k=>+k!==G.user); stop('FA',`관심 FA ${p.name}에게 ${tname(+k0)}이(가) 제안했습니다(연 ${money(ai[k0].annual)} · ${ai[k0].years}년). 잡으려면 서둘러 조건을 제시하세요.`,id); }
    if(p.faFrom===G.user&&!F.offers[id]&&!F.warned[id]&&Object.keys(ai).some(k=>+k!==G.user)){ F.warned[id]=1; const k0=Object.keys(ai).find(k=>+k!==G.user); stop('FA',`우리 FA ${p.name}에게 ${tname(+k0)}이(가) 먼저 제안했습니다. 잡으려면 FA 시장에서 조건을 제시하세요.`,id); }
    const offers=Object.entries(ai).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years}));
    const uo=F.offers[id]; if(uo){ offers.push({tid:G.user,annual:uo.annual,years:uo.years}); faAgentPing(id); }
    if(!offers.length)continue;
    const ng=F.neg&&F.neg[id];
    const pr=(.04+since*.006+(offers.length>=2?.04:0)+(p.ask.annual<500?.03:0))*(ovr(p)>=52||offers.length>=2?1:.45)+(ng&&ng.deal?.35:ng&&ng.hot?.08:0);
    if(R()<pr)faSign(p,offers);
  }
}
function faSign(p,offers){
  offers=offers.filter(o=>!faOutBlocked(o.tid,p)); if(!offers.length)return;
  let best=null,bs=-1;
  const home=1.08+((p.pers?p.pers.loy:10)-10)/100+((p.mor??60)-60)/300;
  const ng=G.fa&&G.fa.neg&&G.fa.neg[p.id];
  for(const o of offers){ if(o.tid===G.user&&ng&&ng.closed)continue; const sc=o.annual*(1+.06*(o.years-1))*(o.tid===p.faFrom?home:1)*(o.tid===G.user&&ng?(ng.deal?1.06:ng.hot?1.02:1)*(.9+ng.mood/500):1)*rnd(.96,1.04); if(sc>bs){bs=sc;best=o;} }
  if(!best)best=offers.find(o=>o.tid!==G.user)||offers[0];
  const from=p.faFrom; p.team=best.tid; p.sal=best.annual; p.yrs=best.years; p.faC=true; p.ext=false; p.lastFA=G.year; p.faN=(p.faN||0)+1; p.faPrevGrade=p.faGrade;
  const rec={id:p.id,name:p.name,from,to:best.tid,annual:best.annual,years:best.years,grade:p.faGrade,kind:p.ask0&&best.annual<p.ask0*.6?'cheap':'sign',day:G.day,ask0:p.ask0||null};
  story(p,best.tid===from?`FA 잔류 · ${tname(best.tid)} ${best.years}년 연 ${money(best.annual)}`:`FA 이적 · ${tname(best.tid)} ${best.years}년 연 ${money(best.annual)}`,'move');
  if(best.tid!==from){ if(G.fa){ G.fa.outN=G.fa.outN||{}; G.fa.outN[best.tid]=(G.fa.outN[best.tid]||0)+1; }
    try{ compStart(p,from,best.tid,rec); }catch(e){}
  }
  if(best.tid===G.user&&!G.unemp)chron('fa',from===G.user?`FA ${p.name} 잔류 (${best.years}년 연 ${money(best.annual)})`:`FA ${p.name} 영입 (${best.years}년 연 ${money(best.annual)})`,p.id); else if(from===G.user&&best.tid!==G.user&&!G.unemp)chron('fa',`FA ${p.name}, ${tshort(best.tid)}로 이적`,p.id);
  const userOffered=!!G.fa.offers[p.id];
  delete G.fa.offers[p.id]; G.fa.pool=G.fa.pool.filter(x=>x!==p.id); G.fa.results.unshift(rec); prFA(rec);
  const t=rec.to===G.user?(from===G.user?`${p.name}와(과) ${rec.years}년 연 ${money(rec.annual)}에 잔류 계약했습니다.`:`FA ${p.name}을(를) ${rec.years}년 연 ${money(rec.annual)}에 영입했습니다.${rec.compPlayer?` 보상선수로 ${rec.compPlayer}이(가) 떠났습니다.`:''}${rec.compCash?` 보상금 ${money(rec.compCash)}.`:''}`)
    :from===G.user?`${p.name}이(가) ${tname(rec.to)}와(과) 계약했습니다(${rec.years}년 연 ${money(rec.annual)}).${rec.compPlayer?` 보상선수로 ${rec.compPlayer}을(를) 받았습니다.`:''}`
    :`${tname(rec.to)}이(가) FA ${p.name}(${p.faGrade}등급)을 ${rec.years}년 연 ${money(rec.annual)}에 잡았습니다.${userOffered?' 우리 제안은 밀렸습니다.':''}`;
  if(rec.to===G.user)addLog(t);
  if(rec.to===G.user||from===G.user||userOffered)stop('FA',t,p.id); else if(rec.grade!=='C'||rec.annual>=500)wire('FA',t,{ref:p.id,tid:rec.to});
  delete p.faFrom; delete p.ask;
}
function faClose(){
  const F=G.fa; let cheap=0, gone=0;
  for(const id of [...F.pool]){ const p=G.players[id]; if(!p||p.team!=null)continue;
    const ai=F.ai[id]||{}; const offers=Object.entries(ai).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})).filter(o=>!faOutBlocked(o.tid,p));
    if(F.offers[id])offers.push(Object.assign({tid:G.user},F.offers[id]));
    if(offers.length){ faSign(p,offers); continue; }
    const from=p.faFrom, t=team(from); const low=round5(Math.max(MIN_SAL,Math.min((p.faPrevSal||p.sal)*.5,marketSal(ovr(p))*.45)));
    /* 원소속 AI 구단이 쓸모를 인정하면 1년 헐값 계약으로 붙잡는다(실제 2025년 하주석 1년 1억1천만원 등) */
    if(from!==G.user&&t&&p.age<=35&&aiVal(t,p)>=1&&capPay(from)+low<=capOf(G.year)&&rosterN(from)<ROSTER_MAX){ faSign(p,[{tid:from,annual:low,years:1}]); const r=F.results[0]; if(r&&r.id===p.id){ r.kind='cheap'; } cheap++; wire('FA',`${p.name}, 원소속 ${tname(from)}와(과) 1년 ${money(low)} 헐값 계약`,{tid:from,ref:p.id}); continue; }
    /* 연봉 하한에 못 미치는 구단은 남은 FA로 채운다 */
    { const fl=floorOf(G.year); const lt=G.teams.filter(x=>x.id!==G.user&&x.id!==from&&capPay(x.id)<fl&&rosterN(x.id)<ROSTER_MAX&&!faOutBlocked(x.id,p)).sort((a,b)=>capPay(a.id)-capPay(b.id))[0];
      if(lt&&p.age<=35&&ovr(p)>=42){ const an=round5(Math.max(low,Math.min(p.ask.annual,(fl-capPay(lt.id))*.6))); faSign(p,[{tid:lt.id,annual:an,years:Math.min(2,p.ask.years)}]); continue; } }
    /* 아무도 찾지 않은 선수: 유니폼을 벗는다 */
    wire('FA',`${p.name}(${p.age}세)이(가) 새 팀을 찾지 못하고 은퇴했습니다.`,{ref:p.id}); if(from===G.user)note('FA',`우리 구단 출신 FA ${p.name}이(가) 계약하지 못하고 은퇴했습니다.`);
    try{ p.team=from; obFromPlayer(p,null); p.team=null; }catch(e){} delete G.players[id]; F.pool=F.pool.filter(x=>x!==id); gone++; }
  F.closed=true; F.cheapN=cheap; F.retN=gone;
  note('FA',`FA 시장이 사실상 끝났습니다. 스프링캠프 전까지 계약하지 못한 선수 중 ${cheap}명은 원소속 구단과 1년 헐값 계약했고, ${gone}명은 유니폼을 벗었습니다.`); }
/* 1월 10일: 우리 구단 출신 미계약 FA가 있으면 알린다 */
function faUnsignedNote(){ const F=G.fa; if(!F||F.closed)return; const L=F.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.faFrom===G.user); if(!L.length)return;
  stop('FA',`우리 구단 출신 미계약 FA ${L.length}명: ${L.map(p=>`${p.name}(요구 ${p.ask.years}년 연 ${money(p.ask.annual)})`).join(', ')}. 스프링캠프 전날(1월 24일)까지 아무 데서도 계약하지 못하면 은퇴합니다. 잡으려면 FA 시장에서 제안하세요.`); }
function contractStart(){
  const ended=[], foreignEnd=[];
  for(const p of Object.values(G.players)){
    if(p.team==null||p.joinY>G.year)continue;
    if(p.foreign){ p.newSal=newSalary(p); if(p.team===G.user)foreignEnd.push(p.id); else { const pf=perfOf(seasonTotal(p,G.year,'1군'),p.isP); if(p.age>=35||pf==null||pf<50)delete G.players[p.id]; else { p.sal=p.newSal; p.rsy=(p.rsy||0)+1; if(p.foreign==='용병'){ const yb=foreignOf(p.team).filter(x=>x.foreign==='용병'); if(sum(yb.map(x=>x.sal))>fCap(p.team)){ const w=[...yb].sort((a,b)=>ovr(a)-ovr(b))[0]; delete G.players[w.id]; } } } } continue; }
    if(p.faC)continue;
    p.newSal=newSalary(p); if(p.team===G.user)ended.push(p.id); else { p.sal=p.newSal; delete p.newSal; }
  }
  G.contract={ended,foreignEnd,foreignDrop:[],released:[],done:false};
  /* AI 구단: 기량이 크게 떨어진 고액 연봉 베테랑은 정리한다 */
  for(const t of G.teams){ if(t.id===G.user)continue; for(const p of domestic(t.id)){ if(p.age>=32&&ovr(p)<44&&p.sal>=800&&!p.ys){ story(p,`${tname(t.id)}에서 방출`,'move'); wire('방출',`${tname(t.id)}, 베테랑 ${p.name} 방출`,{tid:t.id,ref:p.id}); delete G.players[p.id]; } } }
  for(const t of G.teams) if(t.id!==G.user) trimRoster(t.id,60);
  refreshFMarket(12,99);
  stop('연봉',`연봉 협상이 시작되었습니다. 국내 선수 ${ended.length}명, 외국인 선수 ${foreignEnd.length}명의 재계약안이 올라왔습니다. 1월 31일까지 확정하세요.`);
}
/* 외국인 재계약: 잘한 선수는 더 달라고 한다. 3명 총액 한도(400만 달러 + 재계약 연차당 10만 달러)를 넘으면 확정할 수 없다 */
function fReCapInfo(){ const C=G.contract; if(!C)return null; const keep=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id));
  const others=foreignOf(G.user).filter(x=>x.foreign==='용병'&&!C.foreignEnd.includes(x.id)); const tot=sum(keep.map(p=>p.newSal))+sum(others.map(p=>p.sal));
  const cap=F_TOTAL_CAP+10*USD*sum(keep.map(p=>(p.rsy||0)+1))+10*USD*sum(others.map(p=>p.rsy||0)); return {tot,cap,over:Math.max(0,tot-cap)}; }
function fReNeg(id){ const C=G.contract; const p=G.players[id]; if(!C||!p||C.done)return ''; C.fneg=C.fneg||{}; if(C.fneg[id])return '이미 한 번 협상했습니다.'; C.fneg[id]=true;
  const ask=p.newSal; const off=round5(ask*.85); initPers(p); const h=seasonTotal(p,G.year,'1군'); const star=h&&warOf(h,p)>=3;
  const ch=clamp(.62+(p.pers.loy-10)*.03+((p.adapt||50)-50)/150-(star?.2:0),.1,.9);
  if(R()<ch){ p.newSal=off; return `${p.name} 측이 ${money(off)}에 동의했습니다. (요구액 ${money(ask)})`; }
  C.foreignDrop.includes(id)||C.foreignDrop.push(id); p.fleft=true; return `${p.name} 측이 거절했습니다. ${star?'일본 구단에서 더 좋은 조건을 받았다고 합니다.':'다른 리그를 알아보겠다고 합니다.'} 결별로 처리됩니다.`; }
function confirmContracts(){
  const C=G.contract; if(!C||C.done)return; { const f=fReCapInfo(); if(f&&f.over>0)return `외국인 3명 연봉 총액이 한도를 ${money(f.over)} 넘습니다. 한 명과 결별하거나 금액을 낮춰 협상하세요.`; }
  for(const id of C.ended){ const p=G.players[id]; if(p&&p.newSal!=null){p.sal=p.newSal; delete p.newSal;} }
  for(const id of C.foreignEnd){ const p=G.players[id]; if(!p)continue; if(C.foreignDrop.includes(id)){ addLog(`외국인 선수 ${p.name}와(과) 재계약하지 않았습니다.`); if(!p.fleft&&ovr(p)>=55&&p.age<=33){ delete p.newSal; p.team=null; p.fsrc='agent'; p.fday=G.day; p.fpub=G.day; p.ask=round5(fAsk(p)); G.fmarket=(G.fmarket||[]).concat(p.id); } else delete G.players[id]; } else { p.sal=p.newSal; delete p.newSal; p.rsy=(p.rsy||0)+1; } }
  C.done=true; addLog('연봉 계약을 마쳤습니다.');
}
/* 저장 용량: 3시즌 전 퓨처스 기록은 구단별 한 줄로 합치고, 프로 3년차 이상의 아마추어 연도별 기록은 지운다(1군 기록·이야기는 그대로) */
function compactPlayers(){ const y=G.year; let n=0;
  for(const p of Object.values(G.players)){
    if(p.hist&&p.hist.length>3){ const old=p.hist.filter(h=>h.lvl==='퓨처스'&&!h.y2&&h.y<y-2); if(old.length>=2){ const by={};
        for(const h of old){ const k=h.t; const m=by[k]=by[k]||Object.assign({},p.isP?ZP:ZB,{y:h.y,y2:h.y,t:h.t,lvl:'퓨처스'}); for(const f in (p.isP?ZP:ZB))m[f]=(m[f]||0)+(h[f]||0); m.y=Math.min(m.y,h.y); m.y2=Math.max(m.y2,h.y); }
        const prevAgg=p.hist.filter(h=>h.lvl==='퓨처스'&&h.y2); for(const a of prevAgg){ const m=by[a.t]; if(m){ for(const f in (p.isP?ZP:ZB))m[f]+=(a[f]||0); m.y=Math.min(m.y,a.y); m.y2=Math.max(m.y2,a.y2); } }
        p.hist=p.hist.filter(h=>!(h.lvl==='퓨처스'&&(old.includes(h)||(h.y2&&by[h.t])))).concat(Object.values(by)); n++; } }
    if(p.amY&&!p.prospect&&p.draft&&p.draft.y<y-2){ delete p.amY; n++; }
    if(p.story&&p.story.length>45)p.story.splice(1,p.story.length-45);
  }
  return n; }
function newYear(){
  try{ compactPlayers(); }catch(e){}
  for(const p of Object.values(G.players))p.fat=0; /* 겨울을 지나면 피로는 모두 풀린다 */
  ovsApply();
  if(G.mgr[G.user]&&G.mgr[G.user].yrs<=0&&!G.mgr[G.user].interim){ const m=G.mgr[G.user]; G.mgr[G.user]=null; mail('운영팀','감독 계약 종료',`${m.name} 감독과의 계약이 끝났습니다. 개막 전까지 새 감독을 선임해야 합니다.`,{imp:true,kind:'감독',acts:[{l:'감독 후보 보기',a:'goWork',v:'감독'}]}); }
  if(G.mgr[G.user]&&G.mgr[G.user].interim){ G.mgr[G.user]=null; mail('운영팀','감독대행 체제 종료','감독대행 체제가 끝났습니다. 개막 전까지 새 감독을 선임해야 합니다.',{imp:true,kind:'감독',acts:[{l:'감독 후보 보기',a:'goWork',v:'감독'}]}); }
  if(G.tut&&!G.tut.done)G.tut.done=true; /* 비서 업무 안내는 창단 첫해에만 */
  try{ warFreeze(G.year); }catch(e){} /* 능력치가 바뀌기 전에 올해 WAR을 고정 */
  const before={}; for(const p of domestic(G.user))before[p.id]=ovr(p);
  for(const p of Object.values(G.players)) if(p.team!=null) develop(p);
  if(G.draftClass)for(const id of G.draftClass){ const p=G.players[id]; if(p&&p.prospect)delete G.players[id]; }
  G.year++;
  milNewYear();
  for(const p of Object.values(G.players)){ p.injOut=0; delete p.lastStart; delete p.lastApp; delete p.prevApp; }
  for(const t of G.teams){ if(t.id!==G.user){ trimRoster(t.id,64); fillRoster(t.id,56);} t.rot=0; }
  const added=fillRoster(G.user,ROSTER_MIN); if(added.length)addLog(`로스터 최소 인원을 맞추려고 육성선수 ${added.length}명을 등록했습니다.`);
  for(const k in G.lineup){ const p=G.players[G.lineup[k]]; if(!p||p.team!==G.user)delete G.lineup[k]; }
  G.cal=buildCalendar(G.year); G.ps=null; G.camp=null; G.campInj=1; G.form=null; G.draft=null;
  G.sea={y:G.year,rec:G.teams.map(()=>({w:0,l:0,t:0})),months:[],fspend:{},repl:{},mark:null};
  refreshScoutMarket(); if(!G.fmarket||G.fmarket.length<4)refreshFMarket(8); updateModes();
  makeDraftClass();
  if(G.fa&&G.fa.closed)G.fa=null;
  const ch=domestic(G.user).filter(p=>before[p.id]!=null).map(p=>({p,d:ovr(p)-before[p.id]})).sort((a,b)=>b.d-a.d);
  const up=ch.filter(x=>x.d>=2.5).slice(0,3), dn=ch.filter(x=>x.d<=-2.5).slice(-3);
  { const n=rosterN(G.user); if(n>ROSTER_MAX)mail('운영팀','로스터 정원 초과',`신인 합류로 로스터가 ${n}명입니다. 개막 전까지 ${ROSTER_MAX}명 이하로 줄여야 합니다. 선수단 화면의 로스터 정리에서 방출 후보를 볼 수 있습니다.`,{imp:false,kind:'일반',acts:[{l:'로스터 정리',a:'tab',v:'roster'}]}); }
  stop('새해',`${G.year}년이 밝았습니다. 모든 선수가 한 살 먹었습니다.${up.length?` 코치진이 성장을 확인한 선수: ${up.map(x=>x.p.name).join(', ')}.`:''}${dn.length?` 기량이 떨어진 선수: ${dn.map(x=>x.p.name).join(', ')}.`:''} 신인 ${domestic(G.user).filter(isRookie).length}명이 합류했습니다.`);
}
function aiWeekly(){
  const per=period();
  if(per==='season'&&G.day<=KD(8,15)) for(const t of G.teams) if(t.id!==G.user) aiForeignReview(t.id);
  blockDaily(); aiBlockWeekly(); try{ marketWeek(); }catch(e){} try{ fBidWeek(); }catch(e){} try{ mlbHype(); }catch(e){} try{ fwatchWeek(); }catch(e){} try{ facWeek(); }catch(e){} try{ climateWeek(); }catch(e){} try{ mreqWeek(); }catch(e){} try{ mgrRelWeek(); if(period()==='season'&&G.day>=G.cal.open+7)mpickPlan(); }catch(e){} try{ grantCheck(); ownerPush(); }catch(e){}
  const dl=per==='season'&&G.day>=KD(7,1)&&G.day<=KD(7,31); if(tradeOpen()&&per!=='post'&&!G.unemp){ const pr=domestic(G.user).some(p=>p.listed)?.65:dl?.7:per==='season'?.45:.25; for(let i=0;i<(dl?2:1);i++)if(R()<pr&&(G.offers||[]).length<3)aiOffer(); }
}
/* 단장의 압박: 예상보다 성적이 나쁘거나 승부사 기질이면 트레이드로 살길을 찾는다 (0~1) */
function gmHeat(tid){ const t=team(tid); let h=gmTrait(tid)==='gambler'?.25:0; const per=period();
  if(per==='season'&&G.cal&&G.day>G.cal.open+20&&G.proj){ const st=standingsNow(); const rk=st.findIndex(x=>x.tid===tid)+1; const pr=G.proj.indexOf(tid)+1; if(pr>0)h+=clamp((rk-pr)/5,0,.6); if(rk>=8)h+=.15; }
  const g=t.gm; if(g&&G.year-g.since>=3)h+=.1; return clamp(h,0,1); }
function aiOffer(){ const ts=G.teams.filter(x=>x.id!==G.user).map(t=>({t,w:gmHeat(t.id)+R()*.8})).sort((a,b)=>b.w-a.w).slice(0,3);
  for(const x of ts){ if(aiOfferFrom(x.t))return true; } return false; }
function aiOfferFrom(t){ const U=team(G.user);
  const mine=domestic(G.user).filter(p=>!(p.joinY>G.year)&&healthy(p)).map(p=>({p,v:tval(t,p,'in')})).filter(x=>x.v>(x.p.listed?1.5:3)).sort((a,b)=>b.v-a.v).slice(0,8);
  if(!mine.length)return false; const listed=mine.filter(x=>x.p.listed); const tg=listed.length&&R()<.7?pick(listed):pick(mine);
  const tgU=tval(U,tg.p,'out'); // 우리가 그 선수를 내줄 때 느끼는 가치
  const core=new Set(domestic(t.id).map(p=>({p,v:tval(t,p,'out')})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.p.id));
  const pool=domestic(t.id).filter(p=>!core.has(p.id)&&healthy(p)&&!p.ys).map(p=>({p,v:tval(t,p,'out'),u:tval(U,p,'in')})).filter(x=>x.v>0&&x.u>.3).sort((a,b)=>a.v-b.v);
  const need=tradeNeed(t,0); const cap=tg.v-need; let best=null,bu=-1;
  for(let i=0;i<pool.length;i++){ const a=pool[i]; if(a.v<=cap&&a.u>=tgU*.75&&a.u>bu){ best=[a]; bu=a.u; }
    for(let j=i+1;j<pool.length;j++){ const b=pool[j]; const tv=a.v+b.v; const uv=Math.max(a.u,b.u)+.72*Math.min(a.u,b.u); if(tv<=cap&&uv>=tgU*.8&&uv>bu){ best=[a,b]; bu=uv; } } }
  if(!best)return false;
  const off={id:'o'+Math.floor(R()*1e9),from:t.id,give:best.map(x=>x.p.id),get:[tg.p.id],exp:G.day+3,day:G.day};
  G.offers=(G.offers||[]).concat(off);
  stop('트레이드',`${tname(t.id)} 단장이 ${best.map(x=>x.p.name).join(', ')}을(를) 주고 ${tg.p.name}을(를) 원한다는 트레이드를 제안했습니다. 3일 안에 답해야 합니다.${gmHeat(t.id)>=.4?' 성적 압박을 받는 단장이라 적극적입니다.':''}`); if(G.mail[0])G.mail[0].oid=off.id; return true;
}
function answerOffer(id,yes){
  const o=(G.offers||[]).find(x=>x.id===id); if(!o)return {ok:false,msg:'제안이 없습니다.'};
  G.offers=G.offers.filter(x=>x.id!==id);
  if(!yes){ addLog(`${tname(o.from)}의 트레이드 제안을 거절했습니다.`); return {ok:true,msg:'거절했습니다.'}; }
  if(!tradeOpen())return {ok:false,msg:'트레이드 기간이 아닙니다.'};
  if([...o.give,...o.get].some(id=>!G.players[id]))return {ok:false,msg:'선수 상황이 바뀌어 성사되지 않았습니다.'};
  if(o.give.some(id=>G.players[id].team!==o.from)||o.get.some(id=>G.players[id].team!==G.user))return {ok:false,msg:'선수 상황이 바뀌어 성사되지 않았습니다.'};
  const t=team(o.from); const mv=mgrTradeView(o.from,o.get,o.give); const snap=tradeSnap([...o.give,...o.get]); const grade=tradeGrade(o.from,o.get,o.give);
  o.give.forEach(id=>{ G.players[id].team=G.user; story(G.players[id],`트레이드로 ${tname(G.user)} 이적`,'move'); }); o.get.forEach(id=>{G.players[id].team=o.from; delete G.players[id].listed; story(G.players[id],`트레이드로 ${tname(o.from)} 이적`,'move');});
  for(const k in G.lineup) if(o.get.includes(G.lineup[k]))delete G.lineup[k];
  const diff=sum(o.give.map(id=>trueVal(G.players[id])))-sum(o.get.map(id=>trueVal(G.players[id])));
  try{ frBacklash(o.get); }catch(e){}
  chron('trade',`${tshort(o.from)}와(과) 트레이드: ${o.get.map(id=>G.players[id]?G.players[id].name:'').join('·')} 보내고 ${o.give.map(id=>G.players[id]?G.players[id].name:'').join('·')} 받음`);
  G.trades.push({y:G.year,d:G.day,with:o.from,give:o.get.map(id=>G.players[id].name),get:o.give.map(id=>G.players[id].name),diff,revealed:false,gi:[...o.give],go:[...o.get],snap,grade});
  t.rel=clamp(t.rel+3,0,100); prTrade(o.get,o.give,o.from); G.offers=(G.offers||[]).filter(x=>!x.get.some(id=>o.get.includes(id))&&!x.give.some(id=>o.give.includes(id)));
  mgrTradeApply(mv); churnCheck(); mpickTraded(o.get); addLog(`${tname(o.from)}의 제안을 받아들였습니다: ${o.get.map(id=>G.players[id].name).join(', ')} ↔ ${o.give.map(id=>G.players[id].name).join(', ')}`);
  return {ok:true,grade,msg:'트레이드가 성사되었습니다.'};
}

/* ===== 드래프트 ===== */
const SCH_CITY={수도권:['서울','인천','수원','성남','부천','안산','의정부'],영남:['부산','대구','울산','창원','포항','김해','경주'],'호남·충청':['광주','대전','전주','청주','목포','천안','순천']};
const SCH_HS=['새빛고','한결고','솔뫼고','누리고','다솜고','미르고','해담고','가온고','라온고','늘품고','한울공고','푸름고'];
const SCH_UN=['한결대','누리대','새빛대','가온대','미르대','해담대'];
const AM_INJ_P=['팔꿈치 인대 접합 수술(토미 존) 이력','어깨 염증으로 3개월 공백','팔꿈치 뼛조각 제거 수술 이력','고3 시즌 혹사 논란(투구 수 과다)'];
function amHistory(b,lvl){ // 학년별 아마추어 기록. 어릴수록 조금 약하고, 선구안·제구 같은 기질은 학년이 바뀌어도 크게 변하지 않는다
  const n=b.college?4:3; const rows=[]; const tot=b.isP?{outs:0,h:0,hr:0,bb:0,so:0,tb:0,er:0,g:0}:{pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,r:0,rbi:0,sb:0,cs:0,g:0};
  for(let i=0;i<n;i++){ const back=n-1-i; const q={r:{}}; for(const k in b.r)q.r[k]=clamp(b.r[k]-back*(k==='eye'||k==='ctl'?.8:rnd(1.6,2.6)),20,80);
    const sp=Object.assign({},b,{r:q.r,sf:null});
    const lv=lvl+(i===0&&!b.college?-2:0);
    const x=b.isP?Object.assign(simPit(sp,i===0&&!b.college?ri(30,90):ri(70,190),lv),{g:i===0?ri(4,10):ri(9,18)}):Object.assign(simBat(sp,i===0&&!b.college?ri(40,80):ri(85,135),lv),{g:i===0?ri(14,26):ri(25,38)});
    rows.push(Object.assign({gr:i+1},x)); for(const k in tot)tot[k]+=x[k]||0; }
  b.amY=rows; b.am=tot; }
const AM_INJ_B=['손목 골절 이력','햄스트링 부상 반복','허리 디스크 치료 이력','무릎 연골 수술 이력'];
function makeDraftClass(){
  const cls=[];
  for(let i=0;i<DRAFT_POOL;i++){
    const college=R()<.3; const age=college?22:18; const T=clamp(N(44,9)+(R()<.06?rnd(4,9):0),26,79); /* 해마다 리그 상위권(60+)으로 클 재목이 7~8명 섞인다. 사실성보다 '대어'가 꾸준히 나오는 쪽을 택했다 */
    const cur=clamp(T-(27-age)*rnd(2.2,3.4),20,60);
    const b=newPlayer({age,base:cur,pot:T,college}); b.prospect=true;
    b.school=pick(SCH_CITY[b.region])+(college?pick(SCH_UN):pick(SCH_HS)); b.schoolHue=Math.floor(u01('sh',b.school)*360);
    b.ht=Math.round(clamp(N(b.isP?184:179,5),168,198)); b.wt=Math.round(clamp(b.ht-100+N(b.isP?-1:-3,6),62,112));
    if(b.isP)b.amVelo=veloOf(b)-(college?ri(1,3):ri(3,6)); else b.amRun=(+runOf(b)+.04).toFixed(2);
    if(b.inj>.22&&R()<.65)b.amInj=pick(b.isP?AM_INJ_P:AM_INJ_B);
    const lvl=rnd(14.5,19.5); b.amLevel=lvl>18.5?'약팀 상대 비중이 큼':lvl<15.5?'강팀 상대 비중이 큼':'';
    amHistory(b,lvl);
    cls.push(b.id);
  }
  // 언론 평가: 눈에 보이는 성적과 체격·구속만으로 매긴 순위
  const ps=cls.map(id=>G.players[id]).map(p=>{ const h=p.am; let s;
    if(p.isP){ const r=pRate(h); s=-r.era*6+(h.so/Math.max(1,h.outs/3))*9*1.4+(p.amVelo-140)*1.2; }
    else { const r=bRate(h); s=r.ops*55+h.hr*.8+h.sb*.15; }
    return {p,s:s+(p.ht-180)*.15+N(0,2.5)}; }).sort((a,b)=>b.s-a.s);
  ps.forEach((x,i)=>x.p.press=i+1);
  G.draftClass=cls;
}
function migrateDraft(){
  if(!G)return; try{ gmInit(); }catch(e){} if(!G.coach){ try{ coachInit(); }catch(e){} } if(G.goals&&!G.goals.v&&G.goals.y===G.year){ try{ const t=team(G.user); const base=projSupport(); const mm=t.owner==='profit'?.85:t.owner==='pr'?1:1.15; G.goals.sup=Math.max(G.goals.sup,Math.round(clamp(base*mm+.05,.2,1)*100)/100); }catch(e){} G.goals.v=2; } if(G.spend&&G.spend.coach==null)G.spend.coach=0; G.shortlist=G.shortlist||[]; for(const t of G.teams||[]){ const d=TEAM_DEF.find(x=>x.code===t.code); if(d)t.hue=d.hue; }
  for(const k in G.mgr)mgrFix(G.mgr[k]); (G.mmarket||[]).forEach(mgrFix);
  if(!G.r68){ G.r68=true; for(const t of G.teams){ if(t.id===G.user)continue; const add=fillRoster(t.id,54); for(const p of add)delete p.dev; }
    const ua=fillRoster(G.user,ROSTER_MIN); if(ua.length)mail('운영팀','소속선수 한도 확대',`KBO 소속선수 한도에 맞춰 정식 등록 한도가 ${ROSTER_MAX}명으로 늘었습니다. 최소 인원(${ROSTER_MIN}명)을 맞추려고 2군 선수 ${ua.length}명을 등록했습니다.`,{kind:'운영'}); }
  for(const p of Object.values(G.players))milInit(p);
  for(const s of G.scouts.concat(G.scoutMarket||[])){ if(!s.role){ s.role='am'; s.since=-999; } }
  prInit(); if(!G.goals&&period()==='season')setGoals();
  if((period()==='season'||period()==='post')&&G.entryY!==G.year){ G.entryY=G.year; for(const t of G.teams)setEntry(t.id); }
  if(!G.intl)G.intl={us:1,la:0,jp:0,tw:0,au:0}; if(!G.data)G.data={lv:1}; if(G.spend&&G.spend.intl==null)G.spend.intl=0; if(!G.fac)G.fac={lv:2,build:null}; try{ facInit(); }catch(e){} if(G.spend.fac==null)G.spend.fac=0;
  for(const t of G.teams)if(t.fac==null)t.fac=ri(2,4);
  for(const p of Object.values(G.players)){ if(!p.dt)p.dt=rollDT(); if(!p.isP&&p.r.vit==null)p.r.vit=Math.round(clamp(N(55-(p.inj-.14)*90,8),25,80)); if(p.fat==null)p.fat=0; }
  if(G.formY!==G.year&&G.day>=G.cal.camp)rollForm();
  for(const p of Object.values(G.players)) if(p.foreign){ if(!p.orig)p.orig=origOf(p); if(p.adapt==null)p.adapt=Math.round(clamp(N(50,13),20,80)); }
  if(foreignOpen())refreshFMarket(0); /* 매주 최소 후보 수를 채운다 */
  if(!(G.draft&&!G.draft.done)&&(!G.draftClass||G.draftClass.length<DRAFT_POOL-10||G.draftClass.some(id=>G.players[id]&&!G.players[id].school))){
    for(const id of (G.draftClass||[])){ const p=G.players[id]; if(p&&p.prospect)delete G.players[id]; }
    if(G.draft&&G.draft.done&&G.draft.cls)G.draft.cls=[]; makeDraftClass(); }
}
function startDraft(){
  const last=G.history[G.history.length-1].order; const order=[...last].reverse().map(o=>o.tid);
  /* 경쟁균형세 3회 연속 초과 구단은 1라운드 지명 순서가 9단계 내려간다 */
  const o1=[...order]; for(const t of G.teams){ if(t.pickPen!==G.year)continue; const i=o1.indexOf(t.id); if(i<0)continue; o1.splice(i,1); o1.splice(Math.min(o1.length,i+9),0,t.id); if(t.id===G.user)note('드래프트','경쟁균형세 3회 연속 초과로 1라운드 지명 순서가 9단계 내려갔습니다.'); }
  const picks=[]; for(let r=0;r<DRAFT_ROUNDS;r++)(r===0?o1:order).forEach((tid,i)=>picks.push({rd:r+1,no:i+1,tid,pid:null}));
  G.draft={cls:G.draftClass||[],picks,cur:0,done:false,y:G.year};
  stop('드래프트',`${G.year} 신인 드래프트가 열립니다. 참가 ${G.draft.cls.length}명 중 ${DRAFT_ROUNDS}라운드 ${picks.length}명을 지명합니다. 순서는 지난 시즌 성적의 역순이고, 우리 첫 지명은 ${order.indexOf(G.user)+1}순위입니다. 3라운드부터는 지명을 건너뛸 수 있습니다.`);
}
/* 드래프트 성적표: 한 해 지명자 전체의 현재 모습 */
function draftTidOf(p){ const st=(p.story||[]).find(x=>x.k==='draft'); if(!st)return null; const t=G.teams.find(t=>st.t.includes(tname(t.id))); return t?t.id:null; }
function draftClass(y){ const L=(G.dlog&&G.dlog[y])||Object.values(G.players).filter(p=>p.draft&&p.draft.y===y).map(p=>({id:p.id,nm:p.name,t:p.draft.tid??draftTidOf(p),rd:p.draft.rd,no:p.draft.no,pos:posLabel(p),pr:p.press||null}));
  return L.map(x=>{ const p=G.players[x.id]; const c=p?careerOf(p):null; return Object.assign({},x,{p,war:c?c.war:0,now:p?p.team:null,ovr:p?Math.round(ovr(p)):null,n:(x.rd-1)*10+x.no}); }); }
function draftGrades(y){ const L=draftClass(y); const by={}; for(const x of L){ const t=x.t??(x.p&&x.p.draft?null:null); if(t==null)continue; by[t]=(by[t]||0)+x.war; } const arr=Object.entries(by).map(([t,v])=>({t:+t,v})).sort((a,b)=>b.v-a.v); return arr; }
/* 지명 3년·5년 뒤 돌아보기: 스틸픽과 실패한 상위 지명 */
function draftRetro(){ const now=G.year; for(const back of [3,5]){ const y=now-back; const L=draftClass(y).filter(x=>x.p); if(L.length<20)continue;
  const top=[...L].sort((a,b)=>b.war-a.war); const steal=top.find(x=>x.n>=15&&x.war>=3&&top.indexOf(x)<5); const bust=L.filter(x=>x.n<=3&&x.war<.5).sort((a,b)=>a.war-b.war)[0];
  if(steal)news('분석',`${y} 드래프트 ${back}년 뒤: ${steal.n}순위 ${steal.nm}, 최고의 스틸픽`,`${tname(steal.t)}이(가) ${steal.rd}라운드 ${steal.no}순위로 뽑은 ${steal.nm}이(가) 통산 WAR ${steal.war.toFixed(1)}로 같은 해 지명자 중 ${top.indexOf(steal)+1}위입니다.`,steal.t===G.user?2:0,{ref:steal.id});
  if(bust)news('분석',`${y} 드래프트 ${back}년 뒤: ${bust.n}순위 ${bust.nm}, 아직 물음표`,`${tname(bust.t)}이(가) 전체 ${bust.n}순위로 뽑은 ${bust.nm}의 통산 WAR는 ${bust.war.toFixed(1)}입니다. 같은 해 최고는 ${top[0].nm}(${top[0].war.toFixed(1)}).`,bust.t===G.user?-2:0,{ref:bust.id});
  const mine=L.filter(x=>x.t===G.user); if(mine.length){ const g=draftGrades(y); const rk=g.findIndex(x=>x.t===G.user)+1; note('드래프트',`${y} 드래프트 ${back}년 뒤 성적표: 우리 지명자 통산 WAR 합 ${mine.reduce((a,x)=>a+x.war,0).toFixed(1)}, 리그 ${rk||'-'}위. 스카우팅 → 신인 드래프트 → 성적표에서 자세히 볼 수 있습니다.`); } } }

/* 창단 드래프트 전 재정 전망: 국내 선수 연봉을 뺀 나머지 지출과 수입으로 '선수 연봉에 쓸 수 있는 돈'을 계산 */
function fdFin(tid){ const u0=G.user; if(tid!=null)G.user=tid; try{ const t=team(G.user); const b=budget(); const dom=sum(b.exp.filter(x=>x[2]==='pay').map(x=>x[1])); const other=b.E-dom; const sup=t.indie?0:b.cap;
    return {inc:b.inc,I:b.I,other,otherRows:b.exp.filter(x=>x[2]!=='pay'),sup,cash:t.cash,avail:b.I+sup-other-(G.fd&&!G.fd.done?foundReserve().tot:0),res:G.fd&&!G.fd.done?foundReserve():null,cap:capOf(G.year),indie:!!t.indie,owner:t.owner,market:t.market}; } finally{ G.user=u0; } }
function fdWelcome(){ const t=team(G.user); const B=bossOf(G.user); const f=fdFin(); G.fdWait=true;
  G.mail=G.mail.filter(m=>m.subj!=='구단주 서신'&&m.subj!==`${G.year} 시즌 구단 목표`); G.stops=(G.stops||[]).filter(m=>m.subj!==`${G.year} 시즌 구단 목표`); G.goals=null;
  /* 비서 업무 안내와 기존 선수단 기준 재정 경고는 드래프트가 끝난 뒤로 미룬다 */ G.mail=G.mail.filter(m=>m.kind!=='업무'&&m.subj!=='재정 압박 구단입니다'); delete t.tight; if(G.tut&&!G.tut.done)G.tut.step=0;
  const L=[`예상 수입 ${money(f.I)} (${f.inc.map(x=>`${x[0]} ${money(x[1])}`).join(', ')})`,`선수 연봉 외 지출 ${money(f.other)} (외국인 선수 예산, 감독·코치, 운영비 등)`,t.indie?'모기업 지원 없음: 수입 안에서 꾸려야 합니다':`모기업 지원 한도 ${money(f.sup)}`,`보유 현금 ${money(f.cash)}`]; if(f.res)L.push(`창단 첫해 예비비 ${money(f.res.tot)}: 비어 있는 감독·코치 자리 채용비 ${money(f.res.vac)}와 운영 여유분 ${money(f.res.cush)}을 연봉 여력에서 미리 뺐습니다`);
  const verdict=f.avail>=f.cap?`국내 선수 연봉으로 샐러리캡(${money(f.cap)})까지 써도 버틸 수 있습니다.`:f.avail>=f.cap*.75?`국내 선수 연봉은 ${money(f.avail)} 안쪽이 안전합니다. 샐러리캡(${money(f.cap)})을 꽉 채우면 적자입니다.`:`국내 선수 연봉에 쓸 수 있는 돈은 ${money(Math.max(0,f.avail))} 정도입니다. 샐러리캡(${money(f.cap)})보다 한참 적으니, 비싼 선수를 여럿 뽑으면 적자가 납니다.`;
  mail('구단주실',`${B.own.name} 회장: 창단을 함께해 주셔서 반갑습니다`,`${tname(G.user)} 창단 단장으로 와 주셔서 반갑습니다. ${OWNVOICE[t.owner]}\n\n올해 구단 재정 전망입니다.\n${L.map(x=>'· '+x).join('\n')}\n\n${verdict}\n\n리그가 국내 선수 전원을 다시 나누는 창단 드래프트를 엽니다. 선수 연봉과 계약은 그대로 따라오니 재정을 보면서 뽑아 주세요. 준비되면 시작하겠습니다.`,{kind:'구단주',imp:false,acts:[{l:'창단 드래프트 시작',a:'fdBegin'}]});
  addLog(`${tname(G.user)} 창단 단장으로 부임했습니다.`); }
/* ===== 창단 드래프트 =====
   리그의 국내 선수 전원을 한데 모아 10개 구단이 지그재그 순서로 25라운드를 지명한다. 26번째부터는 자동 배분.
   계약(연봉·남은 기간)은 선수를 따라간다. 외국인 선수는 따로 영입한다 */
const FD_ROUNDS=25;
const FD_TGT={P:13,C:2,'1B':1,'2B':2,'3B':1,SS:2,LF:1,CF:2,RF:1};
/* 창단 지명 순서: 쓸 수 있는 연봉이 적은 구단이 먼저 뽑는다. 돈과 지명 순번이 맞바뀌는 균형 장치 */
function fdCapOf(tid){ try{ return fdFin(tid).avail; }catch(e){ return capOf(G.year); } }
function fdOrder(){ return G.teams.map(t=>({id:t.id,v:fdCapOf(t.id)+hn('fdo'+G.year,t.id)*30})).sort((a,b)=>a.v-b.v).map(x=>x.id); }
function fdStart(){ const ids=[]; for(const t of G.teams)t.cap=null; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.prospect||(p.joinY>G.year))continue; p.fdFrom=p.team; p.team=null; p.fdPool=true; delete p.role; ids.push(p.id); }
  G.lineup={}; const order=fdOrder(); const picks=[];
  for(let r=0;r<FD_ROUNDS;r++){ const seq=r%2?[...order].reverse():order; seq.forEach((tid,i)=>picks.push({rd:r+1,no:i+1,tid,pid:null})); }
  G.startY=G.year; G.fd={pool:ids,all:ids.slice(),order,picks,cur:0,done:false,y:G.year,open:false};
  { let f=[]; for(let i=0;i<4;i++)f=f.concat(scoutFindWeek(true)||[]); if(f.length)mail('해외 스카우트',`우리 스카우트가 찾아 둔 후보 ${f.length}명`,`${f.map(q=>`${q.name}(${q.nat} · ${posLabel(q)} · ${q.prevLvl})`).join('\n')}\n\n에이전트가 리그 전체에 돌린 후보와 달리, 이 선수들은 아직 우리만 압니다.`,{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); }
  /* 다른 구단도 외국인 절반 정도는 새로 뽑는다: 같은 시장에서 경쟁 */ for(const t of G.teams){ if(t.id===G.user)continue; for(const p of foreignOf(t.id)){ if(R()<.45){ delete G.players[p.id]; } } } try{ refreshFMarket(0); }catch(e){} fdEstAll();
  mail('KBO','창단 드래프트: 모든 선수를 새로 나눕니다',`리그 국내 선수 ${ids.length}명을 한데 모아 10개 구단이 ${FD_ROUNDS}라운드를 지명합니다. 순서는 연봉 여력(국내 선수 연봉에 쓸 수 있는 돈)이 적은 구단부터이고, 라운드마다 뒤집힙니다(지그재그). 우리 구단 첫 지명은 ${order.indexOf(G.user)+1}번째입니다.\n\n선수의 연봉과 계약 기간은 그대로 따라옵니다. 상위 40명 연봉 합계가 샐러리캡(${money(capOf(G.year))})을 넘지 않게 고르세요. ${FD_ROUNDS}라운드가 끝나면 남은 선수는 구단마다 자동으로 나눠 받습니다. 외국인 선수는 드래프트 뒤에 따로 영입합니다.`,{imp:true,kind:'드래프트'}); }
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
function trackOf(p){ if(!p)return null; const r=p.r, n=(k,s)=>hn('tr'+k,p.id)*(s||1);
  if(p.isP){ const v=veloOf(p); return {velo:v,vmax:veloMax(p),rpm:Math.round((2080+(r.stf-20)/60*420+n('rpm',70))/10)*10,ext:Math.round((1.78+n('ext',.09)+(r.stf-50)*.001)*100)/100,whiff:Math.round(17+(r.stf-20)/60*15+n('wh',1.5)),gb:Math.round(clamp(44+hn('gb',p.id)*7,30,62)),csw:Math.round(25+(r.ctl-20)/60*7+(r.stf-20)/60*4+n('csw',1))}; }
  const ev=evOf(p); return {ev,evmax:Math.round(156+(r.pow-20)/60*24+n('evm',2.5)),hh:Math.round(22+(r.pow-20)/60*24+(r.con-50)*.08+n('hh',2)),whiff:Math.round(31-(r.con-20)/60*18+n('bw',1.5)),chase:Math.round(36-(r.eye-20)/60*16+n('ch',1.5)),run:+runOf(p),arm:Math.round(124+(r.def-20)/60*22+(['SS','3B','RF','C'].includes(p.pos)?3:0)+n('arm',2.5))}; }
/* 최고 구속: 평균보다 4~7km 빠르다 */
function veloMax(p){ return Math.round(veloOf(p)+5+hn('vmax',p.id)*1.5); }
function evOf(p){ if(!p||p.isP)return null; return Math.round(126+(p.r.pow-20)/60*17+(p.r.con-50)*.04+hn('ev',p.id)*1.6); }
function fdStatLine(p,y){ const h1=seasonTotal(p,y,'1군'), h2=seasonTotal(p,y,'퓨처스');
  if(p.isP){ const h=h1&&h1.outs>=30?h1:h2&&h2.outs>=30?h2:h1||h2; if(!h||!h.outs)return null; const ip=h.outs/3; return {lvl:h===h1?1:2,h,n:ip,t:trackOf(p),velo:veloOf(p),vmax:veloMax(p),war:warOf(h,p),fip:(13*(h.hr||0)+3*h.bb-2*h.so)/ip+3.2,whip:(h.h+h.bb)/ip,k9:h.so*9/ip,kbb:h.so/Math.max(1,h.bb),era:h.er*9/ip,g:h.g||0,gs:h.gs||0,ipg:h.g?ip/h.g:0}; }
  const h=h1&&h1.pa>=30?h1:h2&&h2.pa>=30?h2:h1||h2; if(!h||!h.pa)return null; const r=bRate(h); return {lvl:h===h1?1:2,h,n:h.pa,t:trackOf(p),ev:evOf(p),war:warPub(h,p),avg:r.avg,obp:r.obp,slg:r.slg,ops:r.ops,iso:r.slg-r.avg,bbk:h.bb/Math.max(1,h.so),hr:h.hr,sb:h.sb||0}; }
function olsFit(X,y,w){ const k=X[0].length+1; const A=Array.from({length:k},()=>new Array(k+1).fill(0));
  for(let i=0;i<X.length;i++){ const r=[1,...X[i]], wi=w[i]; for(let a=0;a<k;a++){ for(let b=0;b<k;b++)A[a][b]+=wi*r[a]*r[b]; A[a][k]+=wi*r[a]*y[i]; } }
  for(let a=0;a<k;a++)A[a][a]+=1e-6; for(let c=0;c<k;c++){ let m=c; for(let r=c+1;r<k;r++)if(Math.abs(A[r][c])>Math.abs(A[m][c]))m=r; [A[c],A[m]]=[A[m],A[c]]; const d=A[c][c]||1e-9; for(let r=0;r<k;r++){ if(r===c)continue; const f=A[r][c]/d; for(let j=c;j<=k;j++)A[r][j]-=f*A[c][j]; } }
  return A.map((r,i)=>r[k]/(r[i]||1e-9)); }
const fdFeat=(p,L)=>p.isP?[L.k9,L.h.bb*9/L.n,(L.h.hr||0)*9/L.n,L.whip,Math.min(7,L.ipg),L.g?L.gs/L.g:0]:[L.obp,L.slg,L.iso,Math.min(1.5,L.bbk),L.sb/Math.max(1,L.n)*100,L.avg];
function fdEstAll(){ const F=G.fd; if(!F)return {}; const y=F.y-1; const P=F.pool.map(id=>G.players[id]).filter(Boolean); const grp={};
  for(const p of P){ const L=fdStatLine(p,y); const k=(p.isP?'P':'B')+(L?L.lvl:0); (grp[k]=grp[k]||[]).push({p,L}); }
  const est={};
  for(const k in grp){ const A=grp[k]; const pr=k[0]==='P'?40:200; const W=A.filter(x=>x.L&&x.L.n>=(k[0]==='P'?15:60));
    if(W.length>=12){ const c=olsFit(W.map(x=>fdFeat(x.p,x.L)),W.map(x=>ovr(x.p)),W.map(x=>Math.min(x.L.n,k[0]==='P'?120:500)));
      A.forEach(x=>{ x.sc=x.L?c[0]+fdFeat(x.p,x.L).reduce((t,v,i)=>t+v*c[i+1],0):null; }); }
    else A.forEach(x=>x.sc=null);
    const vals=A.filter(x=>x.sc!=null).map(x=>x.sc); const m=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
    A.forEach(x=>{ x.r=x.sc!=null?(x.sc*x.L.n+m*pr)/(x.L.n+pr):m+hn('fd0',x.p.id)*.01; }); const ov=A.map(x=>ovr(x.p)).sort((a,b)=>a-b);
    const so=[...A].sort((a,b)=>a.r-b.r); so.forEach((x,i)=>{ est[x.p.id]=Math.round(ov[i]*10)/10; }); }
  F.est=est; return est; }
function fdSeenBy(tid,p){ const F=G.fd; if(!F.est)fdEstAll(); const e=F.est[p.id]!=null?F.est[p.id]:ovr(p); const o=ovr(p);
  let sd; if(tid===G.user){ const sk=(G.scouts||[]).reduce((a,s)=>Math.max(a,s.skill||0),0); sd=SCOUT_SD[clamp(sk,1,5)]; } else sd=team(tid).scoutSd||6;
  const obs=o+hn('fdo'+tid,p.id)*sd; const seen=e*.7+obs*.3;
  const up=Math.max(0,26-p.age)*1.3+Math.max(0,p.pot-o)*.25+hn('fdp'+tid,p.id)*sd*.4;
  return {o:seen,pot:seen+Math.max(0,up)}; }
function fdSlot(p){ return p.isP?'P':p.pos; }
function fdScore(tid,p,auto,X){ X=X||fdCtx(tid); const t=team(tid); const S=fdSeenBy(tid,p); const o=S.o, pot=S.pot; const eff=p.age<=25?o+Math.max(0,pot-o)*.5:p.age>=32?o-(p.age-31)*1.3:o; let v=Math.pow(Math.max(0,eff-34),1.7)/10;
  const k=fdSlot(p); const c=X.c; const tg=FD_TGT[k]||1; v*=(c[k]||0)<tg?1.15:(c[k]||0)<tg+2?.85:.55;
  const cap=X.cap, cp=X.cp; if(cp+p.sal>cap*.97)v*=.25; else v-=p.sal/100*.06*(t.owner==='profit'?1.3:1);
  if(isAway(p))v*=.5; if(!auto&&tid!==G.user)v+=hn('fd'+tid,p.id)*v*.12; if(tid===G.user&&(G.shortlist||[]).includes(p.id))v=v*1.2+2; return v; }
function fdBest(tid,auto){ let best=null,bs=-1e9; const X=fdCtx(tid); for(const id of G.fd.pool){ const p=G.players[id]; if(!p||!p.fdPool)continue; const v=fdScore(tid,p,auto,X); if(v>bs){bs=v;best=id;} } return best; }
function fdUserRec(n){ const X=fdCtx(G.user); const L=G.fd.pool.map(id=>G.players[id]).filter(p=>p&&p.fdPool).map(p=>({p,v:fdScore(G.user,p,true,X)})).sort((a,b)=>b.v-a.v); return L.slice(0,n||5).map(x=>x.p); }
function fdPick(pid){ const F=G.fd; if(!F||F.done)return '드래프트가 없습니다.'; const pk=F.picks[F.cur]; const p=G.players[pid]; if(!pk||!p||!p.fdPool)return '지명할 수 없는 선수입니다.';
  p.team=pk.tid; p.fdPool=false; delete p.role; p.rAdj=0; pk.pid=pid; pk.o0=Math.round(ovr(p)); pk.age0=p.age; F.pool=F.pool.filter(x=>x!==pid); F.cur++; story(p,`${G.year} 창단 드래프트 ${pk.rd}라운드 ${pk.no}번째 · ${tname(pk.tid)} 지명`,'move');
  if(pk.tid!==G.user&&(G.shortlist||[]).includes(pid))(F.lost=F.lost||[]).push({pid,tid:pk.tid,rd:pk.rd,nm:p.name});
  if(F.cur>=F.picks.length)fdFinish(); return ''; }
/* 한 번에 한 명씩: 실시간 드래프트 진행용 */
function fdStep(){ const F=G.fd; if(!F||F.done||F.open===false)return null; const pk=F.picks[F.cur]; if(!pk)return null; if(pk.tid===G.user)return 'user'; const id=fdBest(pk.tid,false); if(id==null){ fdFinish(); return null; } fdPick(id); return {pk,pid:id}; }
function amStep(){ const d=G.draft; if(!d||d.done)return null; const pk=d.picks[d.cur]; if(!pk)return null; if(pk.tid===G.user)return 'user'; const id=aiDraftPick(pk.tid); if(!id){ finishDraft(); return null; } if(id===-1){ passCurrent(); return {pk,pass:true}; } doPick(id); return {pk,pid:id}; }
function fdAdvance(stopAtUser){ const F=G.fd; let g=0; while(F&&!F.done&&g++<400){ const pk=F.picks[F.cur]; if(pk.tid===G.user&&stopAtUser)return; const id=fdBest(pk.tid,pk.tid===G.user); if(id==null){ fdFinish(); break; } if(pk.tid===G.user)pk.auto=true; fdPick(id); } }
function fdFinish(){ const F=G.fd; if(!F||F.done)return; /* 남은 선수 자동 배분: 구단 국내 선수 52명까지 지그재그 */
  let r=0, guard=0; while(F.pool.length&&guard++<80){ const seq=r%2?[...F.order].reverse():F.order; let any=false; for(const tid of seq){ if(domestic(tid).length>=52)continue; const id=fdBest(tid,true); if(id==null)break; const p=G.players[id]; p.team=tid; p.fdPool=false; F.pool=F.pool.filter(x=>x!==id); any=true; } if(!any)break; r++; }
  for(const id of F.pool){ const p=G.players[id]; if(!p)continue; story(p,'창단 드래프트에서 지명받지 못해 은퇴','move'); delete G.players[id]; }
  F.pool=[]; F.done=true; for(const p of Object.values(G.players)){ delete p.fdPool; delete p.fdFrom; }
  for(const t of G.teams){ if(rosterN(t.id)>ROSTER_MAX)trimRoster(t.id,ROSTER_MAX); } try{ aiCapAll(); }catch(e){} try{ foundDefaults(); }catch(err){} planSup(); G.tsug=null; try{ G.tgrow=[]; ovrSnap(); growSnap(); }catch(e){}
  const mine=F.picks.filter(x=>x.tid===G.user&&x.pid).map(x=>G.players[x.pid]).filter(Boolean); const ci=capInfo(G.user);
  try{ G.proj=G.teams.map(x=>({id:x.id,r:teamRating(x.id)+hn('proj'+G.year,x.id)*.7})).sort((p,q)=>q.r-p.r).map(x=>x.id); const pr=G.proj.indexOf(G.user)+1;
    setGoals(`창단 드래프트로 선수단이 꾸려졌습니다. 전력분석팀은 외국인 선수 영입 전 기준으로 우리를 10개 구단 중 ${pr}위 전력으로 봅니다. 창단 첫해이니 구단주도 무리한 목표는 잡지 않았습니다.`,true); G.goals.fd=true;
    news('분석',`창단 드래프트 평가: ${tshort(G.user)} ${pr}위 전력`,`전문가들은 창단 드래프트를 마친 ${tname(G.user)}을(를) ${pr}위 전력으로 봅니다. 외국인 선수 영입이 남았습니다.`,0); }catch(err){}
  try{ const L=F.picks.filter(x=>x.tid===G.user&&x.pid&&G.players[x.pid]); const P=L.map(x=>G.players[x.pid]); const nP=domestic(G.user).filter(p=>p.isP).length, nB=domestic(G.user).length-nP;
    mail('스카우트팀장','창단 드래프트 결과: 우리 지명 선수',`창단 드래프트가 끝났습니다. 지명 ${L.length}명, 자동 배분을 합친 국내 선수는 투수 ${nP}명 · 야수 ${nB}명입니다.\n\n${L.map(x=>{ const p=G.players[x.pid]; return `${x.rd}라운드  ${p.name} (${posLabel(p)}, ${p.age}세, 능력 ${Math.round(ovr(p))})`; }).join('\n')}\n\n능력은 50이 리그 평균, 60 이상이 주전 상위권입니다. 투수 보직은 감독이 정합니다.`,{kind:'업무',acts:[{l:'선수단 보기',a:'go',v:'roster:field'}]}); }catch(err){}
  try{ if(G.tut&&!G.tut.done){ G.tut.step=0; sendTut(); } }catch(err){}
  chron('found',`창단 드래프트로 선수단 구성 · 1라운드 ${(()=>{ const x=F.picks.find(q=>q.tid===G.user&&q.rd===1); const p=x&&G.players[x.pid]; return p?p.name:'-'; })()}`);
  stop('드래프트',`창단 드래프트가 끝났습니다. 우리 구단은 ${F.picks.filter(x=>x.tid===G.user&&x.pid&&!x.auto).length}명을 직접 지명했습니다(자동 지명 ${F.picks.filter(x=>x.tid===G.user&&x.pid&&x.auto).length}명, 나머지는 자동 배분). 상위 40명 연봉 ${money(ci.pay)} / 상한 ${money(ci.cap)}${ci.over>0?` (상한 ${money(ci.over)} 초과: 시즌 끝까지 넘으면 경쟁균형세)`:''}. 이제 외국인 선수와 감독을 정하세요.`); }
/* 창단 직후 기본 운영안: 의무·스카우트·2군 연수를 비서가 기본값으로 채워 둔다. 단장은 감독·외국인 선수와 전력 보강에 집중한다 */
function foundDefaults(){ const done=[], acts=[];
  if(!G.medSet){ G.medSet=true; done.push(`의무: 부상 방지 ${G.med.prev}단계 · 병원 제휴 ${G.med.hosp==='none'?'없음':G.med.hosp}`); acts.push({l:'의무 운영',a:'goWork',v:'부상방지·병원'}); }
  const am=G.scouts.filter(s=>(s.role||'am')==='am'); const have=new Set(am.map(s=>s.region)); const miss=REG.filter(r=>!have.has(r));
  for(const r of miss){ if(G.scouts.length>=SCOUT_MAX)break; const sc=mkScout(2); sc.region=r; sc.role='am'; sc.since=-999; G.scouts.push(sc); done.push(`스카우트: ${r} 담당 ${sc.name} 채용(연 ${money(sc.sal)})`); }
  if(miss.length)acts.push({l:'스카우트 팀',a:'goWork',v:'스카우트팀'});
  if(!(G.devProg||[]).length){ const L=domestic(G.user).filter(p=>p.age<=23&&!p.e1&&p.pot-ovr(p)>=6).sort((a,b)=>(b.pot-ovr(b))-(a.pot-ovr(a))).slice(0,2);
    for(const p of L){ const k=p.isP?(p.r.ctl<p.r.stf?'ctl':'stf'):(p.r.con<p.r.pow?'bat':'pow'); setDev(p.id,k); done.push(`2군 연수: ${p.name}(${posLabel(p)}, ${p.age}세) ${DEVP[k].l}`); }
    if(L.length)acts.push({l:'2군 연수',a:'goWork',v:'2군연수'}); }
  if(done.length)mail(`비서 ${SEC}`,'기본 운영안을 채워 두었습니다',`창단 직후라 손이 덜 가도록 운영 기본안을 적용했습니다. 모두 언제든 바꿀 수 있습니다.\n\n${done.join('\n')}\n\n단장님은 감독 선임과 외국인 선수 구성, 약한 자리 보강부터 챙기시면 됩니다.`,{kind:'업무',face:'sec',acts:acts.slice(0,3)}); }
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
  if(!L.length)return; mail('전력분석팀',`${y} 시즌 회고: 우리 선수들`,`${y} 시즌을 우리 선수 중심으로 정리했습니다.\n\n${L.join('\n\n')}\n\n구단·재정 → 연대기에 해마다 기록이 쌓입니다.`,{kind:'업무',imp:true,acts:[{l:'연대기',a:'go',v:'club:chron'},{l:'스쿼드 플래너',a:'go',v:'roster:plan'}]}); }
/* 창단 드래프트 3년 뒤: 지명 당시 능력 대비 지금, 우리 유니폼을 입고 쌓은 WAR */
function fdReview(){ const F=G.fd; if(!F||!F.picks||G.fdRev)return; G.fdRev=true; const y0=G.startY||G.year-3;
  const mine=F.picks.filter(x=>x.tid===G.user&&x.pid).slice(0,8).map(x=>{ const p=G.players[x.pid]; if(!p)return {x,gone:true}; const war=sum(p.hist.filter(h=>h.lvl==='1군'&&h.y>=y0&&h.t===G.user).map(h=>warOf(h,p))); return {x,p,war,now:Math.round(ovr(p))}; });
  const all=F.picks.filter(x=>x.pid&&G.players[x.pid]).map(x=>{ const p=G.players[x.pid]; return {x,p,war:sum(p.hist.filter(h=>h.lvl==='1군'&&h.y>=y0).map(h=>warOf(h,p)))}; }).sort((a,b)=>b.war-a.war);
  const steal=all.find(z=>z.x.rd>=5); const L=mine.map(z=>z.gone?`${z.x.rd}라운드 · 은퇴 또는 정리`:`${z.x.rd}라운드 ${z.p.name}: 지명 때 ${z.x.o0??'-'} → 지금 ${z.now} · 우리 팀 WAR ${z.war.toFixed(1)}${z.p.team!==G.user?' (지금은 다른 구단)':''}`);
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
  p.prospect=false; p.team=pk.tid; p.joinY=G.year+1; p.sal=MIN_SAL; p.svc=0; p.draft={y:G.year,rd:pk.rd,no:pk.no,tid:pk.tid}; story(p,`${G.year} 신인 드래프트 ${pk.rd}라운드 ${pk.no}순위 · ${tname(pk.tid)} 지명 (${p.school||''})`,'draft');
  { G.sea.bonus=G.sea.bonus||{}; G.sea.bonus[pk.tid]=(G.sea.bonus[pk.tid]||0)+BONUS[pk.rd-1]; } pk.pid=pid; d.cur++;
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

/* ===== 외국인 선수 ===== */
function fAsk(p){ const o=ovr(p); if(p.foreign==='아시아')return clamp(round5(100+(o-44)*16),100,ASIA_CAP); return clamp(round5(300+(o-46)*46),300,F_NEW_CAP); }
function wpick(ws){ let tot=0; for(const k in ws)tot+=ws[k]; let x=R()*tot; for(const k in ws){ x-=ws[k]; if(x<=0)return k; } return Object.keys(ws)[0]; }
/* 외국인 후보는 두 경로로 나온다.
   에이전트 제안: 리그 전체에 돌리는 공용 후보. 대부분 트리플A·더블A·독립리그 출신이고, 이름값 있는 선수는 이유(부상·나이·적응)가 있다.
   스카우트 발굴: 구단 스카우트가 직접 찾은 선수. 처음엔 찾은 구단만 알고, 시간이 지나면 소문이 나서 다른 구단도 알게 된다.
   해외 스카우트망과 파견 스카우트 수준이 높을수록 더 자주, 더 좋은 선수를 찾는다 */
const FFLAW={inj:'부상 이력',age:'나이 많음',adapt:'적응 우려'};
function newForeign(kind,opts){
  opts=opts||{};
  const asia=kind==='아시아'; const src=opts.src||(opts.market?'agent':null); const flv=opts.flv||0; const mineFind=src==='scout'&&opts.finder===G.user;
  const reg=opts.reg||(asia?(mineFind?wpick({jp:.4+2*intlLv('jp'),tw:.3+2*intlLv('tw'),au:.3+2*intlLv('au')}):pick(['jp','jp','tw','au'])):(mineFind?wpick({us:.6+2*intlLv('us'),la:.4+2*intlLv('la')}):pick(['us','us','us','la'])));
  const nk=reg==='la'?pick(['la','la','ve']):reg;
  const isP=opts.isP??(R()<.65);
  let base=asia?clamp(N(48.5,4),40,60):reg==='la'?clamp(N(53,6),43,69):clamp(N(54,5),44,69);
  if(src==='scout')base=clamp(base+flv*1.3+(R()<.07*flv?ri(3,6):0),40,72);
  const lvl=asia?{jp:['NPB 2군',-1],tw:['CPBL',4],au:['ABL',6]}[reg]:reg==='la'?pick([['멕시코리그',5],['도미니카 윈터리그',3],['베네수엘라 윈터리그',3]]):(()=>{ const w=wpick({AAA:5,AA:2,IND:1,MLB:src==='scout'?.15:.3}); return {AAA:['트리플A',2],AA:['더블A',4],IND:['독립리그',5],MLB:['MLB',-6]}[w]; })();
  if(lvl[0]==='더블A'||lvl[0]==='독립리그')base=clamp(base-1.5,40,72);
  /* 좋아 보이는 선수일수록 이유가 있다 */
  const fp=lvl[0]==='MLB'||base>=63?.7:base>=58?.28:.1; const flaw=R()<fp?pick(['inj','inj','age','adapt']):null;
  const age=flaw==='age'?ri(33,35):ri(25,32);
  const p=newPlayer({age,isP,base,pot:base+(age<28?ri(0,3):0),team:opts.team??null,foreign:asia?'아시아':'용병',nat:FN[nk].nat,name:genFName(nk)});
  p.orig=reg; p.adapt=Math.round(clamp(N(50,13),20,80)); if(flaw==='adapt')p.adapt=ri(16,30); if(flaw==='inj')p.inj=clamp(.3+R()*.12,.3,.42); if(flaw)p.flaw=flaw;
  p.prevLvl=lvl[0];
  p.prev=isP?Object.assign({lvl:lvl[0]},simPit(p,ri(150,420),lvl[1])):Object.assign({lvl:lvl[0]},simBat(p,ri(280,520),lvl[1]));
  p.prev.g=isP?ri(18,40):Math.round(p.prev.pa/4.1); if(lvl[0]==='MLB'){ p.prev.g=isP?ri(8,30):ri(20,70); }
  p.ask=fAsk(p); if(reg==='la')p.ask=round5(p.ask*.8); if(lvl[0]==='MLB')p.ask=round5(Math.min(F_NEW_CAP,p.ask*1.2)); if(flaw)p.ask=round5(p.ask*.88); p.sal=p.ask;
  if(src){ p.fsrc=src; p.fday=G.day; if(src==='scout'){ p.fknow=[opts.finder]; p.fpub=G.day+ri(14,45)-(base>=60?10:0); } else p.fpub=G.day; }
  return p;
}
/* 이 구단이 이 후보를 아는가 */
function fKnows(tid,p){ return !p||p.fsrc!=='scout'||G.day>=(p.fpub||0)||(p.fknow||[]).includes(tid); }
function fScoutLv(tid){ if(tid===G.user)return null; const sd=team(tid).scoutSd||6; return clamp((9-sd)/1.6,0,3); }
/* 매주 스카우트 발굴: 우리는 스카우트망 지역에서, 다른 구단은 스카우트 수준에 따라 */
function scoutFindWeek(silent){ const o=dobj(G.day); if(!(foreignOpen()||o.m===10||o.m===11))return; G.fmarket=G.fmarket||[]; if(G.fmarket.length>=46)return; const found=[];
  if(!G.unemp){ for(const r of Object.keys(IREG)){ const lv=intlLv(r); const isc=(G.scouts||[]).find(s=>s.role==='intl'&&s.region===r); const ch=lv>=1?.13*lv+(isc?isc.skill*.04:0):.03; if(R()<ch){ const asia=IREG[r].asia; const q=newForeign(asia?'아시아':'용병',{src:'scout',finder:G.user,flv:lv+(isc?isc.skill/3:0),reg:r}); G.fmarket.push(q.id); found.push(q); } } }
  for(const t of G.teams){ if(t.id===G.user)continue; const lv=fScoutLv(t.id); if(R()<.12+lv*.05){ const q=newForeign(R()<.25?'아시아':'용병',{src:'scout',finder:t.id,flv:lv}); G.fmarket.push(q.id); } }
  if(found.length&&!silent)mail('해외 스카우트',`발굴 보고: 새 후보 ${found.length}명`,`${found.map(q=>`${q.name}(${q.nat} · ${posLabel(q)} · ${q.age}세 · ${q.prevLvl})`).join('\n')}\n\n우리 스카우트가 직접 찾은 선수라 아직 다른 구단은 모릅니다. 소문이 나기 전에 판단하세요.`,{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]});
  return found; }
function refreshFMarket(n,drop){
  /* 에이전트 공용 후보를 최소 인원으로 유지하고, 오래 팔리지 않은 후보는 시장을 떠난다(관찰 중이면 남김) */
  G.fmarket=(G.fmarket||[]).filter(id=>G.players[id]&&G.players[id].team==null); const W=new Set((G.fwatch||[]).map(w=>w.id));
  for(const id of [...G.fmarket]){ const q=G.players[id]; if(q.fday==null)q.fday=G.day; if(!W.has(id)&&G.day-q.fday>80){ G.fmarket=G.fmarket.filter(x=>x!==id); delete G.players[id]; } }
  const ag=()=>G.fmarket.map(id=>G.players[id]).filter(q=>q&&q.fsrc!=='scout');
  for(let i=0;i<(drop||0);i++){ const old=ag().filter(q=>!W.has(q.id)).sort((a,b)=>a.fday-b.fday)[0]; if(!old)break; G.fmarket=G.fmarket.filter(x=>x!==old.id); delete G.players[old.id]; }
  /* 비시즌에는 후보가 넉넉해야 고르는 재미가 있다. 창단 첫해 겨울은 10개 구단이 한꺼번에 찾으므로 더 많이 */
  const fd0=G.startY===G.year&&period()!=='season'; const min=period()==='season'?9:fd0?34:22; let g=0;
  while(ag().length<min&&g++<40){ const ps=ag(); const asiaN=ps.filter(p=>p.foreign==='아시아').length; const yb=ps.filter(p=>p.foreign==='용병'); const batN=yb.filter(p=>!p.isP).length, pitN=yb.filter(p=>p.isP).length;
    const aMin=Math.round(min*.2), bMin=Math.round(min*.3), pMin=Math.round(min*.42);
    if(asiaN<aMin)G.fmarket.push(newForeign('아시아',{market:true}).id); else if(pitN<pMin)G.fmarket.push(newForeign('용병',{isP:true,market:true}).id); else if(batN<bMin)G.fmarket.push(newForeign('용병',{isP:false,market:true}).id); else G.fmarket.push(newForeign('용병',{market:true}).id); }
}
function foreignOpen(){ const per=period(); if(per==='post')return false; if(per==='season')return G.day<=KD(8,15); return G.day>=KD(12,1)||per==='pre'; }
function foreignCheck(tid,p,excludeId){
  const fs=foreignOf(tid).filter(x=>x.id!==excludeId);
  if(p.foreign==='아시아'){ if(fs.filter(x=>x.foreign==='아시아').length>=1)return '아시아쿼터는 1명까지입니다. 먼저 한 명을 방출하세요.'; return ''; }
  const yb=fs.filter(x=>x.foreign==='용병');
  if(yb.length>=3)return '외국인 선수(아시아쿼터 제외)는 3명까지입니다. 먼저 한 명을 방출하세요.';
  if(yb.length===2&&yb.every(x=>x.isP===p.isP))return `외국인 3명을 모두 ${p.isP?'투수':'타자'}로 채울 수 없습니다.`;
  const cap=fCap(tid); const tot=sum(yb.map(x=>x.sal))+p.ask; if(tot>cap)return `외국인 3명 연봉 총액이 한도 ${Math.round(cap/USD)}만 달러(약 ${money(cap)})를 넘습니다.`;
  return '';
}
function remainFrac(){ const c=G.cal; if(G.day<c.open)return 1; if(G.day>c.end)return 0; const left=Object.keys(c.sched).filter(d=>+d>G.day).length; return left/144; }
function signForeign(tid,id){
  const p=G.players[id];
  const mid=period()==='season';
  story(p,`${tname(tid)} 입단 (${p.foreign==='아시아'?'아시아쿼터':'외국인 선수'}, ${money(p.ask)})`,'move'); p.team=tid; p.sal=p.ask; p.yrs=1; if(G.formY===G.year&&!(p.sf&&p.sf.y===G.year))p.sf={y:G.year,v:clamp(N(0,3),-5,5),m:0}; p.fy=dobj(G.day).m>=10?G.year+1:G.year; if(p.adapt==null)p.adapt=Math.round(clamp(N(50,13),20,80));
  const cost=Math.round(p.ask*remainFrac());
  if(mid||G.day>=G.cal.open){ G.sea.fspend[tid]=(G.sea.fspend[tid]||0)+cost; }
  if(mid)G.sea.repl[tid]=(G.sea.repl[tid]||0)+1;
  G.fmarket=(G.fmarket||[]).filter(x=>x!==id);
  if(tid===G.user)addLog(`외국인 선수 ${p.name}(${p.nat}·${posLabel(p)})과 연 ${money(p.ask)}에 계약했습니다.${mid?` 남은 기간분 ${money(cost)} 지급.`:''}`);
}
function releaseForeign(id){ const p=G.players[id]; if(!p)return; if(p.team===G.user)addLog(`외국인 선수 ${p.name}을(를) 방출했습니다. 남은 연봉은 그대로 지급합니다.`); for(const k in G.lineup)if(G.lineup[k]===id)delete G.lineup[k]; delete G.players[id]; }
/* 외국인 시장은 10개 구단이 함께 쓴다. 구단마다 스카우트 오차를 안고 후보를 평가한다 */
function fNeed(tid){ const fs=foreignOf(tid); const yb=fs.filter(x=>x.foreign==='용병'); if(yb.length<3){ const needP=yb.filter(x=>x.isP).length<2, needB=yb.filter(x=>!x.isP).length<1; return {kind:'용병',isP:needP?true:needB?false:null}; } if(!fs.some(x=>x.foreign==='아시아'))return {kind:'아시아',isP:null}; return null; }
function fScoreBy(tid,q){ const t=team(tid); return ovr(q)+hn('fv'+tid,q.id)*(t.scoutSd||6)*.6-q.ask/600; }
function aiForeignPick(tid){ const nd=fNeed(tid); if(!nd)return null; const L=(G.fmarket||[]).map(id=>G.players[id]).filter(q=>q&&q.team==null&&fKnows(tid,q)&&q.foreign===nd.kind&&(nd.isP==null||q.isP===nd.isP)&&!foreignCheck(tid,q)); return L.sort((a,b)=>fScoreBy(tid,b)-fScoreBy(tid,a))[0]||null; }
function fInterest(q){ if(!q||q.team!=null)return 0; let n=0; for(const t of G.teams){ if(t.id===G.user)continue; const nd=fNeed(t.id); if(!nd||!fKnows(t.id,q)||nd.kind!==q.foreign||(nd.isP!=null&&nd.isP!==q.isP))continue;
    const L=(G.fmarket||[]).map(id=>G.players[id]).filter(x=>x&&x.team==null&&fKnows(t.id,x)&&x.foreign===nd.kind&&(nd.isP==null||x.isP===nd.isP)).sort((a,b)=>fScoreBy(t.id,b)-fScoreBy(t.id,a)).slice(0,3); if(L.includes(q))n++; } return n; }
function aiForeignSign(tid,q,why){ signForeign(tid,q.id); if(fwatchOn(q.id))mail('스카우트팀장',`관찰 후보 ${q.name}, ${tshort(tid)}와(과) 계약`,`관찰 명단에 있던 ${q.name}(${posLabel(q)})을(를) ${tname(tid)}이(가) 연 ${money(q.ask)}에 먼저 데려갔습니다.${why||''}`,{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); else if(ovr(q)>=60)wire('외국인',`${tshort(tid)}, 외국인 ${posLabel(q)} ${q.name} 영입 (${money(q.ask)})`,{tid,ref:q.id}); }
/* 스토브리그·캠프 기간: 구단들이 하루하루 시장에서 데려간다. 인기 선수는 몸값이 오른다 */
function aiForeignDaily(){ if(!foreignOpen()||period()==='season')return; const o=dobj(G.day); const pr=o.m===1||o.m===2?.12:.06;
  for(const t of G.teams){ if(t.id===ME()||!fNeed(t.id))continue; if(R()<pr){ const q=aiForeignPick(t.id); if(q)aiForeignSign(t.id,q); } } }
function fBidWeek(){ try{ scoutFindWeek(); }catch(err){} if(!foreignOpen())return; { const n=R()<.5?1:R()<.5?2:0; for(let i=0;i<n;i++){ const q=newForeign(R()<.22?'아시아':'용병',{market:true}); G.fmarket.push(q.id); } } for(const id of (G.fmarket||[])){ const q=G.players[id]; if(!q||q.team!=null)continue; const n=fInterest(q); q.fint=n; if(q.ask0==null)q.ask0=q.ask; if(n>=2&&q.ask<q.ask0*1.3)q.ask=round5(Math.min(q.ask*1.04,q.foreign==='아시아'?ASIA_CAP:F_NEW_CAP)); } }
function aiForeignFill(tid){
  { const q=aiForeignPick(tid); if(q){ aiForeignSign(tid,q); return; } }
  const fs=foreignOf(tid); const yb=fs.filter(x=>x.foreign==='용병');
  if(yb.length<3){ const needP=yb.filter(x=>x.isP).length<2, needB=yb.filter(x=>!x.isP).length<1;
    const want=needP?true:needB?false:R()<.6;
    const p=newForeign('용병',{isP:want}); while(foreignCheck(tid,p)&&p.ask>300)p.ask=round5(p.ask*.85);
    if(!foreignCheck(tid,p))signForeign(tid,p.id); else delete G.players[p.id]; return; }
  if(!fs.some(x=>x.foreign==='아시아')){ const p=newForeign('아시아'); signForeign(tid,p.id); }
}
function aiForeignReview(tid){
  if((G.sea.repl[tid]||0)>=F_REPL_MAX)return;
  for(const p of foreignOf(tid).filter(x=>x.foreign==='용병')){
    const h=seasonTotal(p,G.year,'1군');
    const bad=p.injOut>45||(G.day>G.cal.open+40&&h&&(p.isP?(h.outs>=120&&pRate(h).era>5.4):(h.pa>=160&&bRate(h).ops<.690)));
    if(bad&&R()<.5){ const nm=p.name; releaseForeign(p.id); aiForeignFill(tid); wire('외국인',`${tname(tid)}이(가) 외국인 선수 ${nm}을(를) 교체했습니다.`,{tid}); return; }
  }
}

/* ===== 로스터 정리 ===== */
function fillRoster(tid,min){
  let n=playersOf(tid).length; const added=[];
  while(n<min){ const isP=playersOf(tid).filter(p=>p.isP).length<n*.52; const b=clamp(N(34,3),26,42);
    const p=newPlayer({age:ri(20,24),isP,base:b,pot:b+ri(0,12),team:tid,dev:true}); added.push(p); n++; }
  return added;
}
function trimRoster(tid,max){
  let ps=playersOf(tid).filter(p=>!p.foreign&&!p.ys); const out=[]; max=(max||ROSTER_MAX)-foreignOf(tid).length;
  const keep=p=>keepScore(p)+(team(tid).mode==='contend'?(p.age>=26?1:0):(p.age<=24?1:0));
  while(ps.length>max){ ps.sort((a,b)=>keep(a)-keep(b)); const p=ps.shift(); out.push(p); if(p.age<=24&&!p.faC&&p.pot-ovr(p)>=8&&ysN(tid)<YS_MAX){ p.ys=true; p.e1=false; p.sal=MIN_SAL; } else delete G.players[p.id]; }
  return out;
}
function mkScout(skill){ const region=pick(REG); return {id:'s'+Math.floor(R()*1e9),name:genName(),skill,region,role:'am',since:-999,sal:SCOUT_SAL[skill]}; }
/* 스카우트 업무: 아마추어(지역) · 프로(지역 연고 구단) · 해외(나라) 중 하나를 맡는다. 바꾸면 30일 적응 기간 동안 능력이 1 낮다. */
const SCOUT_MAX=6;
const SROLE={am:'아마추어',pro:'프로',intl:'해외'};
function effSkill(s){ return Math.max(1,s.skill-(G.day-(s.since??-999)<30?1:0)); }
function scoutOf(role,key){ const s=G.scouts.filter(x=>(x.role||'am')===role&&x.region===key).sort((a,b)=>effSkill(b)-effSkill(a))[0]; return s?Object.assign({},s,{skill:effSkill(s)}):null; }
function assignScout(id,role,key){ const s=G.scouts.find(x=>x.id===id); if(!s)return; if((s.role||'am')===role&&s.region===key)return; s.role=role; s.region=key; s.since=G.day; addLog(`${s.name} 스카우트를 ${SROLE[role]} ${role==='intl'?IREG[key].l:key} 담당으로 바꿨습니다.`); }
function scoutLoad(){ const c={}; for(const s of G.scouts)c[(s.role||'am')+':'+s.region]=(c[(s.role||'am')+':'+s.region]||0)+1; return c; }
function refreshScoutMarket(){ G.scoutMarket=[1,2,3,4].map(()=>mkScout(clamp(Math.round(N(2.8,1.1)),1,5))); try{ if(G.ob)G.scoutMarket=obCands('scout').slice(0,2).map(obScout).concat(G.scoutMarket); }catch(e){} }
function offerMailDone(oid){ for(const m of G.mail) if(m.oid===oid)m.read=true; }
function wire(kind,t,o){ o=o||{}; const w={d:G.day,k:kind,t,tid:o.tid??null,ref:o.ref??null}; if(o.x)w.x=o.x; (G.wire=G.wire||[]).unshift(w); if(G.wire.length>150)G.wire.length=150; }
function addLog(t){ G.log.unshift({y:G.year,d:G.day,t}); G.log=G.log.slice(0,80); }
function updateModes(){ const rs=G.teams.map(t=>({id:t.id,r:teamRating(t.id)})).sort((a,b)=>b.r-a.r); rs.forEach((x,i)=>team(x.id).mode=i<6?'contend':i<8&&R()<.5?'contend':'rebuild'); for(const t of G.teams){ if(G.user!=null&&t.id!==G.user&&t.cash<-5000)t.mode='rebuild'; } }
function supportCap(t){ return t.indie?0:Math.round(16000*(.5+t.trust/100))+(t.grant&&t.grant.y===G.year?t.grant.amt:0); }
/* 상한 초과 제재(2025년 개정 규정): 1회 초과분 30%, 2회 연속 50%, 3회 연속 100% + 다음 해 1라운드 지명권 9단계 하락. 하한 미달(2027년~)도 30%·50%·100% */
function capRate(n){ return n>=3?1:n===2?.5:.3; }
/* AI 구단은 상한을 지킨다: 가성비가 낮은 고액 선수부터 여유 있는 구단으로 넘기고(연봉 덜어내기 트레이드), 받을 곳이 없으면 방출한다 */
/* 야인일 때는 전 소속 구단도 AI가 운영한다 */
const ME=()=>G.unemp?-99:G.user;
function aiCapFix(tid,frac){ const t=team(tid); if(!t||tid===ME())return 0; const cap=capOf(G.year)*(frac||.985); let n=0, guard=0;
  while(capPay(tid)>cap&&guard++<12){
    const core=new Set(domestic(tid).sort((a,b)=>ovr(b)-ovr(a)).slice(0,4).map(p=>p.id));
    const c=domestic(tid).filter(p=>!core.has(p.id)&&!isRookie(p)&&p.sal>=150&&!(p.joinY>G.year)).sort((a,b)=>aiVal(t,a)/a.sal-aiVal(t,b)/b.sal)[0];
    if(!c)break;
    const rc=G.teams.filter(x=>x.id!==tid&&x.id!==ME()&&capPay(x.id)+c.sal<=capOf(G.year)*.95&&rosterN(x.id)<ROSTER_MAX-1&&aiVal(x,c)>=Math.max(.5,c.sal/400)).sort((a,b)=>(capPay(a.id))-(capPay(b.id)))[0];
    if(rc){ c.team=rc.id; c.listed=false; for(const k in G.lineup)if(G.lineup[k]===c.id)delete G.lineup[k]; story(c,`연봉 덜어내기 트레이드로 ${tname(rc.id)} 이적`,'move'); wire('트레이드',`${tname(tid)}, 샐러리캡 맞추려 ${c.name}(${money(c.sal)})을 ${tname(rc.id)}로 보냄`,{tid,ref:c.id}); }
    else { const cost=c.faC?Math.round(c.sal*Math.max(1,c.yrs)*.5):0; t.cash-=cost; story(c,`${tname(tid)}에서 방출`,'move'); wire('방출',`${tname(tid)}, 샐러리캡 때문에 ${c.name}(${money(c.sal)}) 방출`,{tid,ref:c.id}); delete G.players[c.id]; }
    n++; }
  return n; }
function capWarnUser(){ const ci=capInfo(G.user); const t=team(G.user); if(ci.over<=0)return; const n=(t.capOver||0)+1;
  stop('재정',`연봉 재계약 기준으로 우리 상위 40명 연봉이 ${money(ci.pay)}로 상한 ${money(ci.cap)}을 ${money(ci.over)} 넘습니다. 시즌 끝까지 넘으면 초과분의 ${Math.round(capRate(n)*100)}%를 야구발전기금으로 냅니다${n>=3?'. 3회 연속이라 다음 해 1라운드 지명 순서도 9단계 내려갑니다':''}. 트레이드나 방출로 줄일 수 있습니다.`); }
/* 하한(2027년~)에 못 미치는 AI 구단은 주축 선수 연봉을 올려(다년계약) 하한을 맞춘다 */
function aiFloorFix(tid){ if(tid===ME()||G.year<2027)return; const fl=floorOf(G.year); let gap=fl*1.02-capPay(tid); if(gap<=0)return; const t=team(tid);
  const ps=domestic(tid).filter(p=>!isRookie(p)&&!p.ys&&!(p.joinY>G.year)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,8); const tot=sum(ps.map(p=>ovr(p)));
  for(const p of ps){ const add=round5(gap*ovr(p)/tot); p.sal=round5(p.sal+add); if(!p.faC){ p.faC=true; p.ext=true; p.yrs=Math.max(p.yrs||0,2); } }
  wire('구단',`${t.city} ${t.nick}, 연봉 하한 맞추려 주축 선수들과 다년계약`,{tid}); }
function aiCapAll(frac){ for(const t of G.teams)if(t.id!==ME())try{ aiFloorFix(t.id); }catch(e){} let n=0; for(const t of G.teams)if(t.id!==ME())n+=aiCapFix(t.id,frac); return n; }
/* 12월 이사회: 다음 해 상한을 정한다. 상한 가까이 붙은 구단이 많으면(연봉 인플레이션) 크게 올린다 */
function capCouncil(){ const y=G.year+1; if(y<=2028)return; G.capY=G.capY||{}; if(G.capY[y])return;
  const cap=capOf(G.year); const near=G.teams.filter(t=>capPay(t.id)>=cap*.97).length; const over=G.teams.filter(t=>(t.capOver||0)>0).length;
  const up=near+over>=5?.08:near+over>=3?.05:.03; G.capY[y]=Math.round(cap*(1+up));
  const why=up>=.08?`상한에 붙은 구단이 ${near}곳, 지난 시즌 초과 구단이 ${over}곳으로 연봉 인플레이션이 커 크게 올렸습니다`:up>=.05?`상한 가까이 붙은 구단이 늘어 인상 폭을 키웠습니다`:'물가 수준만 반영했습니다';
  news('리그',`KBO 이사회, ${y}년 경쟁균형세 상한 ${money(G.capY[y])}로 ${Math.round(up*100)}% 상향`,`${why}. 하한은 ${money(floorOf(y))}입니다.`,0);
  note('일정',`KBO 이사회가 ${y}년 경쟁균형세 상한을 ${money(G.capY[y])}(${Math.round(up*100)}% 상향)로 정했습니다. ${why}.`); }
function capInfo(tid){ const pay=capPay(tid), cap=capOf(G.year); return {pay,all:payroll(tid),cap,floor:floorOf(G.year),over:Math.max(0,pay-cap)}; }

/* ===== 연봉 ===== */
function perfOf(h,isP){
  if(!h)return null;
  if(isP){ if(h.outs<75)return null; return clamp(35+(6.2-pRate(h).era)/3.2*33,20,80); }
  if(h.pa<120)return null; return clamp(35+(bRate(h).ops-.55)/.35*30,20,80);
}
function seasonTotal(p,y,lvl){ const hs=p.hist.filter(h=>h.y===y&&!h.y2&&(!lvl||h.lvl===lvl)); if(!hs.length)return null; const tot=Object.assign({},hs[0]); for(const h of hs.slice(1))addTo(tot,h); tot.pos=hs[hs.length-1].pos; tot.t=hs[hs.length-1].t; return tot; }
function perfOvr(p,n){
  const ys=[...new Set(p.hist.filter(h=>h.lvl==='1군').map(h=>h.y))].slice(-n);
  /* 표본이 적은 시즌은 능력치 쪽으로 당긴다: 투수 이닝/(이닝+60), 타자 타석/(타석+250) */
  const vals=ys.map(y=>{ const h=seasonTotal(p,y,'1군'); const v=perfOf(h,p.isP); if(v==null)return null; const w=p.isP?h.outs/(h.outs+180):h.pa/(h.pa+250); return v*w+ovr(p)*(1-w); }).filter(v=>v!=null);
  if(!vals.length)return null; if(vals.length===1)return vals[0];
  const w=vals.map((_,i)=>i+1); return sum(vals.map((v,i)=>v*w[i]))/sum(w);
}
function newSalary(p){
  const pf=perfOvr(p,2); const base=pf==null?ovr(p):pf;
  if(p.foreign&&p.kept&&p.kept.y===G.year)return p.kept.sal;
  if(p.foreign){ if(p.foreign==='아시아')return round5(clamp(100+(base-44)*16,p.sal*.8,p.sal+10*USD)); return round5(clamp(300+(base-46)*62,p.sal*.7,p.sal*1.7)); }
  /* FA 전에는 보류권 때문에 시장가보다 훨씬 낮다: 3년 미만 35%, 6년 미만 50%, FA 직전 60%. 연차별 상한은 KBO 최고 기록 수준(4년차 5억 등) */
  /* FA 자격이 있어도 신청하지 않고 남은 선수는 여전히 보류 선수다: 시장가의 55%, 인상 50% 이내, 7억 상한 */
  const skip=p.svc>=faSvc(p)&&!p.faC&&!p.ext;
  const f=p.svc<3?.3:p.svc<6?.4:p.svc<faSvc(p)?.5:skip?.55:1;
  /* 연봉 삭감 한도: 3억 이상 40%, 그 아래 30%까지 깎을 수 있다 */
  const lo=p.sal*(p.sal>=300?.6:.7);
  /* 올해 1군 표본이 적으면(120타석·25이닝 미만) 시장가가 아니라 올해 기여로 소폭만 움직인다 */
  const h=seasonTotal(p,G.year,'1군'); const enough=h&&(p.isP?h.outs>=75:h.pa>=120); const war=h?warOf(h,p):0;
  if(!enough){ const fu=seasonTotal(p,G.year,'퓨처스'); const fw=fu?warOf(fu,p):0; return round5(Math.max(MIN_SAL,clamp(p.sal*(1+clamp(war*.15+fw*.05,-.1,.15)),lo,p.sal*1.15))); }
  /* 인상 폭 상한은 올해 WAR로 정한다: WAR 0이면 +10%, 1이면 +45%, 3이면 +115%, 5 이상이면 +190% */
  const up=war<=0?1.0:1+clamp(.1+war*.35,.1,1.9);
  /* 잘한 선수는 깎지 않는다: WAR 3 이상 +5% 이상, 2 이상 동결 이상, 1 이상 최대 -10%, 0 이상 최대 -20% */
  const lo2=war>=3?p.sal*1.05:war>=2?p.sal:war>=1?p.sal*.9:war>=0?p.sal*.8:lo;
  const v=round5(clamp(marketSal(base)*f,Math.max(lo,lo2),Math.max(p.sal*up,lo2)));
  if(skip)return round5(Math.min(v,Math.max(p.sal,Math.min(700,p.sal*1.5))));
  return p.svc<faSvc(p)&&!p.faC?Math.min(v,Math.max(p.sal,preCap(p))):v;
}
/* 보류권 선수 연봉 상한(다음 시즌 기준). FA 전에는 5억을 넘기 어렵다(김도영 4년차 5억이 최고 수준). 마지막 해만 6~7억까지 */
const PRE_CAP=[30,80,150,300,400,500,600,700];
function preCap(p){ return PRE_CAP[clamp(p.svc||0,0,PRE_CAP.length-1)]; }
function faAsk(p){
  const pf=perfOvr(p,3); const base=pf==null?ovr(p):pf*.7+ovr(p)*.3;
  const af=p.age<30?1.15:p.age<=32?1:p.age<=34?.8:.6;
  const years=p.age<=30?4:p.age<=32?3:p.age<=34?2:1;
  return {annual:round5(marketSal(base)*1.05*af),years};
}
function extDemand(p,years){
  const pf=perfOvr(p,2); const self=p.age<=27?ovr(p)+(p.pot-ovr(p))*.5:ovr(p)-Math.max(0,p.age-31);
  const base=pf==null?self:self*.6+pf*.4;
  const near=p.svc>=faSvc(p)-2?1.12:p.svc>=faSvc(p)-4?1:.88;
  const yadj=p.age<=29?1+.025*(years-1):1-.035*(years-1);
  return round5(marketSal(base)*near*yadj*(1-((p.mor??60)-60)/400)*(p.pers&&p.pers.loy>=15?.95:1));
}
function canExtend(p){ return p&&p.team===G.user&&!p.foreign&&!p.extNext&&!(p.joinY>G.year)&&(!p.faC||p.yrs<=1)&&p.age<=34&&!p.prospect&&!(G.contract&&!G.contract.done&&G.contract.ended.includes(p.id)); }
function offerExtension(id,annual,years){
  const p=G.players[id]; if(!canExtend(p))return {ok:false,msg:'다년계약을 제안할 수 없는 선수입니다.'};
  const wk=Math.floor(G.day/7);
  if(p.extTried===wk)return {ok:false,msg:`${p.name} 측: 이번 주에는 더 이야기하지 않겠습니다. 다음 주에 다시 제안해 주세요.`};
  const d=extDemand(p,years);
  if(annual>=d*.98){ const now=G.rolled===G.year&&G.day>=KD(11,1);
    if(now){ p.sal=annual; p.yrs=years; p.faC=true; p.ext=true; } else p.extNext={annual,years}; story(p,`비FA 다년계약 ${years}년 연 ${money(annual)}`,'move');
    addLog(`${p.name}와(과) 비FA 다년계약 ${years}년 연 ${money(annual)}(총 ${money(annual*years)})에 합의했습니다.`);
    return {ok:true,msg:`${p.name} 측이 ${years}년 연 ${money(annual)}에 합의했습니다. ${now?'바로 적용됩니다.':'다음 시즌부터 적용됩니다.'}`}; }
  p.extTried=wk;
  const hint=round5(d*(1+hn('x'+G.year,p.id)*.04));
  return {ok:false,msg:`${p.name} 측: 연 ${money(hint)} 안팎은 되어야 생각해 보겠다는 반응입니다.`};
}
function keepScore(p){ return ovr(p)+Math.max(0,p.pot-ovr(p))*(p.age<=22?.4:p.age<=24?.28:.1)+(p.faC?3:0)+(p.age>=26&&p.age<=33?1.2:0); }
function trimCands(n){ return domestic(G.user).filter(p=>!p.ys&&!(G.contract&&!G.contract.done&&G.contract.ended.includes(p.id))).sort((a,b)=>keepScore(a)-keepScore(b)).slice(0,n); }
function releasePlayer(id){
  const p=G.players[id]; if(!p||p.team!==G.user)return;
  if(p.foreign){ releaseForeign(id); return; }
  const cost=p.faC?Math.round(p.sal*p.yrs*.5):0; payOut(G.user,cost,'rel');
  addLog(`${p.name}을(를) 방출했습니다.${cost?` 남은 계약 정산금 ${money(cost)}.`:''}`); story(p,`${tname(p.team)}에서 방출`,'move');
  if(G.contract){ G.contract.ended=G.contract.ended.filter(x=>x!==id); }
  for(const k in G.lineup) if(G.lineup[k]===id)delete G.lineup[k];
  delete G.players[id];
}
function needScore(tid,p){ const d=depth(tid); const o=ovr(p);
  if(p.isP){ const arr=isSPr(p)?d.sp.map(spV):d.pen.map(penV); return arr.length&&o>Math.min(...arr)+2?1:0; }
  return d.start.length&&o>Math.min(...d.start.map(x=>ovr(x)))+2?1:0; }

/* ===== 새 게임 ===== */
function buildWorld(){ const userTid=0;
  G={ver:4,year:2026,day:0,user:userTid,teams:[],players:{},nextId:1,history:[],log:[],lg:{},lineup:{},mail:[],stops:[],games:[],offers:[],mgr:{},mmarket:[],med:{prev:1,hosp:'none'},spend:{mgr:0,med:0,hosp:0,dev:0,intl:0,fac:0},intl:{us:1,la:0,jp:0,tw:0,au:0},fac:{lv:2,build:null},devProg:[],ovs:[],tut:{step:0,done:false},tutFlags:{},
     scouts:[],scoutMarket:[],marketing:2000,draft:null,fa:null,trades:[],last:null,gameOver:null,contract:null,fmarket:[],live:null};
  TEAM_DEF.forEach((d,i)=>G.teams.push(Object.assign({id:i,cash:4000,pop:1,trust:55,rel:50,owner:d.indie?'profit':pick(['win','profit','pr','win']),
    mode:'contend',scoutSd:rnd(4,9),capOver:0,expW:.5,rot:0,fac:ri(2,4)},d)));
  const bpos=['C','C','1B','1B','2B','2B','3B','3B','SS','SS','LF','LF','CF','CF','RF','RF','3B'];
  for(const t of G.teams){
    const tb=N(0,1.6);
    const mk=(isP,pos)=>{ const age=clamp(Math.round(N(27,4.6)),19,37); const T=clamp(N(48+tb,7.5),30,75);
      const cur=age<27?T-(27-age)*rnd(1.8,3.2):age<=31?T:T-(age-31)*rnd(.9,1.9);
      return newPlayer({age,isP,pos,base:clamp(cur,22,76),pot:age<27?T+N(0,3):cur,team:t.id,svc:clamp(age-19-ri(0,3),0,18)}); };
    for(let i=0;i<14;i++)mk(true);
    // 2군 선수층: 젊은 유망주와 대기 전력 (정식 선수 약 58명)
    for(let i=0;i<27;i++){ const age=clamp(Math.round(N(23,2.8)),19,30); const T=clamp(N(44+tb,7.5)+(R()<.06?rnd(4,9):0),28,74); const cur=clamp(age<26?T-(26-age)*rnd(1.6,2.8):T-rnd(2,6),20,52);
      newPlayer({age,isP:i<15,pos:i<15?undefined:pick(['C','1B','2B','3B','SS','LF','CF','RF','C','SS','2B','CF']),base:cur,pot:Math.max(cur,T),team:t.id,svc:clamp(age-19-ri(0,2),0,8)}); }
    bpos.forEach(pos=>mk(false,pos));
  }
  G.year=2025;
  for(const p of Object.values(G.players)){ const f=p.svc<4?.45:p.svc<7?.7:1; p.sal=round5(marketSal(ovr(p))*f);
    if(p.svc>=FA_SVC){ if(R()<.6){ p.faC=true; p.yrs=ri(1,4); p.lastFA=2025-(4-p.yrs)-ri(0,2); p.faN=1; } else p.svc=FA_SVC-1-ri(0,5); } } /* 시작 시점 FA 계약은 남은 연수에 맞춰 체결 연도를 흩어 놓는다: 재자격 시기가 한 해에 몰리지 않는다 */
  for(const t of G.teams){ const target=(t.indie?8600:12300*Math.pow(t.market,.8))*rnd(.92,1.08); const ps=domestic(t.id); const cur=sum(ps.map(p=>p.sal));
    ps.forEach(p=>p.sal=round5(p.sal*target/cur));
    /* 보류권 선수는 연차별 상한을 넘지 않게 하고, 넘친 몫은 FA 계약 선수 쪽으로 돌린다 */
    let over=0; for(const p of ps){ if(!p.faC&&p.svc<faSvc(p)){ const c=PRE_CAP[clamp((p.svc||0)-1,0,PRE_CAP.length-1)]; if(p.sal>c){ over+=p.sal-c; p.sal=c; } } }
    const fc=ps.filter(p=>p.faC); const fs=sum(fc.map(p=>p.sal)); if(fs>0&&over>0)fc.forEach(p=>p.sal=round5(p.sal*(1+over/fs))); }
  G.scouts=[mkScout(ri(2,3)),mkScout(2),mkScout(2)]; G.scouts[0].role='am'; G.scouts[1].role='am'; G.scouts[1].region=REG.find(r=>r!==G.scouts[0].region); G.scouts[2].role='pro'; G.scouts[2].region='영남';
  if(G.scouts[0].region===G.scouts[1].region)G.scouts[1].region=REG.find(r=>r!==G.scouts[0].region);
  refreshScoutMarket();
  for(const t of G.teams){ const m=mkMgr(); m.yrs=ri(1,3); G.mgr[t.id]=m; }
  // 지난 시즌(2025) 기록을 실제 경기로 만든다
  G.cal=buildCalendar(2025); G.day=G.cal.open-1;
  G.sea={y:2025,rec:G.teams.map(()=>({w:0,l:0,t:0})),months:[],fspend:{},repl:{},mark:null};
  for(const t of G.teams){ for(const isP of [true,true,false]){ const p=newForeign('용병',{isP}); while(foreignCheck(t.id,p)&&p.ask>300)p.ask=round5(p.ask*.85); signForeign(t.id,p.id);} signForeign(t.id,newForeign('아시아').id); }
  G.stops=[];
  let pd=null; for(const d of Object.keys(G.cal.sched).map(Number).sort((a,b)=>a-b)){ if(pd!=null)recoverAll(d-pd); pd=d; G.day=d; for(const p of Object.values(G.players))if(p.injOut>0)p.injOut--; for(const [h,a] of G.cal.sched[d]){ const g=simGame(d,h,a,false); applyGame(d,h,a,g,false);} if(dobj(d).w===0)futuresWeek(); }
  updateLg(2025); try{ featSeason(2025); }catch(e){} const st=standingsNow();
  G.history.push({y:2025,order:st,champ:st[0].tid,runner:st[1].tid});
  for(const p of Object.values(G.players)){ p.svc++; p.injOut=0; develop(p); delete p.lastStart; delete p.lastApp; delete p.prevApp; }
  for(const p of Object.values(G.players)) if(!p.foreign&&!p.faC&&p.svc>=FA_SVC-1&&R()<.15) p.svc=FA_SVC-1-ri(1,2);
  // 시즌을 치르고 나이 든 뒤의 능력으로 연봉을 다시 매긴다. FA 계약 선수는 계약 당시 웃돈이 조금 남아 있다
  for(const p of Object.values(G.players)){ if(p.foreign||p.team==null)continue; const f=p.svc<4?.3:p.svc<faSvc(p)?.42:1; let v=marketSal(ovr(p))*f; if(p.faC)v*=rnd(1,1.3)*(p.yrs>=3?1.05:1); p.sal=round5(clamp(v,MIN_SAL,2500)); }
  for(const t of G.teams){ const target=(t.indie?8600:12300*Math.pow(t.market,.8))*rnd(.92,1.05); const ps=domestic(t.id); const cur=sum(ps.map(p=>p.sal)); const k=clamp(target/Math.max(1,cur),.9,1.3); ps.forEach(p=>p.sal=round5(Math.min(2600,p.sal*(p.faC||p.svc>=faSvc(p)?k:1+(k-1)*.4))));
    const fl=floorOf(G.year)*1.1, now=sum(ps.map(p=>p.sal)); if(now<fl){ const top=[...ps].sort((a,b)=>ovr(b)-ovr(a)).slice(0,10); const ts=sum(top.map(p=>p.sal)); const kk=(ts+fl-now)/Math.max(1,ts); top.forEach(p=>p.sal=round5(p.sal*kk)); } }
  /* 보류권 선수 연봉 상한(연차별 KBO 최고 수준). 넘친 몫은 FA 계약 선수에게 돌려 팀 연봉 규모는 유지한다 */
  for(const t of G.teams){ const ps=domestic(t.id); let over=0; for(const p of ps){ if(!p.faC&&p.svc<faSvc(p)){ const c=preCap(p); if(p.sal>c){ over+=p.sal-c; p.sal=c; } } } const fc=ps.filter(p=>p.faC); const fs=sum(fc.map(p=>p.sal)); if(fs>0&&over>0)fc.forEach(p=>p.sal=round5(Math.max(p.sal,Math.min(p.sal*(1+over/fs),marketSal(ovr(p))*1.3,2500)))); }
  /* 오래 한 팀에서 뛴 간판 선수는 처음부터 프랜차이즈 스타 */
  for(const t of G.teams){ const L=domestic(t.id).filter(p=>p.svc>=6&&p.age>=28&&ovr(p)>=55&&(!p.faC||hn("frc",p.id)>-.2)).sort((a,b)=>ovr(b)-ovr(a)); L.slice(0,L[1]&&ovr(L[1])>=62?2:1).forEach(p=>p.fr={tid:t.id,y:2025}); }
  /* 실제 2025년처럼 대부분 구단은 상한 아래(상위권 89~96%)에 있다 */
  for(const t of G.teams){ const cap=capOf(2026), cp=capPay(t.id); const lim=cap*rnd(.88,.96); if(cp>lim){ const ps=domestic(t.id); const k=lim/cp; ps.forEach(p=>p.sal=round5(Math.max(MIN_SAL,p.sal*(p.sal>200?k:1)))); } }
  // 2026년 1월 2일에서 시작
  G.year=2026; G.cal=buildCalendar(2026); G.day=dnum(2026,1,2); G.ps=null;
  G.sea={y:2026,rec:G.teams.map(()=>({w:0,l:0,t:0})),months:[],fspend:{},repl:{},mark:null};
  G.teams.forEach(t=>{t.cash=ri(3000,5000);});
  G.fmarket=[]; refreshFMarket(12); updateModes(); makeDraftClass();
  G.stops=[]; G.games=[];
  for(const t of G.teams){ const rs=G.teams.map(x=>({id:x.id,r:teamRating(x.id)})); const a=avg(rs.map(x=>x.r)); t.expW=clamp(.5+(teamRating(t.id)-a)*.03,.36,.64); }
  G.proj=G.teams.map(x=>({id:x.id,r:teamRating(x.id)+hn('proj'+G.year,x.id)*.7})).sort((p,q)=>q.r-p.r).map(x=>x.id);
  try{ G.preview=worldPreview(); }catch(e){ G.preview=null; }
}
function claimTeam(userTid){ G.user=userTid; G.gmSince=G.year; delete G.preview; G.lineup={}; team(userTid).cash=4000;
  if(G.scouts[2])G.scouts[2].region=TEAM_DEF[userTid].region==='수도권'?'영남':'수도권';
  for(const p of foreignOf(userTid)) delete G.players[p.id];
  G.r68=true; for(const p of Object.values(G.players)){ delete p.story; delete p.cum; delete p.fl; cumInit(p); } G.mgr[userTid]=null; refreshMgrMarket(); G.coach=null; coachInit(); for(const t of G.teams)delete t.gm; G.rep=50; G.jobs=[]; G.lgTrades=[]; G.gmc={}; gmInit(); G.ob=null; G.obFace={}; try{ obInit(); refreshCoachMarket(); refreshScoutMarket(); }catch(e){} G.mail=[]; G.stops=[]; G.spend={mgr:0,med:0,hosp:0,dev:0,intl:0,fac:0}; G.intl={us:1,la:0,jp:0,tw:0,au:0}; G.fac={lv:2,build:null}; G.pr=null; G.news=[]; G.ownerLog=[]; prInit(); for(const p of Object.values(G.players))milInit(p);
  for(const p of Object.values(G.players)){ if(p.team!=null){ p.mor=clamp(Math.round(N(62,9)),30,88);} }
  addLog(`${tname(userTid)} 단장에 취임했습니다. ${OWNER[team(userTid).owner].msg}`); chron('join','단장 취임',null,userTid);
  mail('구단주실','구단주 서신',`${tname(userTid)}의 새 단장을 맡아 주셔서 감사합니다. ${OWNER[team(userTid).owner].msg} 기대 승률은 약 ${fmt3(team(userTid).expW)}입니다. 구단 운영을 믿고 맡기겠습니다.`,{kind:'구단주'});
  planSup(); try{ ovrSnap(); growSnap(); }catch(e){}
  try{ const b=budget(); const ci=capInfo(userTid); if(b.roomGoal<0||ci.over>0){ team(userTid).tight=G.year;
    mail('운영팀','재정 압박 구단입니다',`올해 예상 지출이 구단주가 정한 지원 한도를 ${money(-Math.min(0,b.roomGoal))} 넘습니다.${ci.over>0?` 연봉 총액(${money(ci.pay)})이 샐러리캡(${money(ci.cap)})도 ${money(ci.over)} 넘어 경쟁균형세가 붙습니다.`:''}\n\n이 구단의 첫 과제는 연봉 정리입니다. 고액 연봉 선수를 트레이드하거나, 외국인 선수 몸값을 낮추거나, 구단주에게 지원을 요청할 수 있습니다. 한도를 넘긴 채 시즌을 마치면 구단주 신뢰가 떨어집니다.`,{kind:'재정',acts:[{l:'재정 보기',a:'go',v:'club:fin'}]}); } }catch(e){}
  sendTut(); tutTick(); G.stops=[];
}
function newGame(userTid){ buildWorld(); claimTeam(userTid); }
/* ===== 트레이드 ===== */
function aiVal(t,p){
  const o=ovr(p)+hn('o'+t.id,p.id)*3, pt=p.pot+hn('q'+t.id,p.id)*5;
  let eff=p.age<=25?o+Math.max(0,pt-o)*(t.mode==='rebuild'?.75:.5):p.age>=32?o-(p.age-31)*1.3:o;
  let v=Math.pow(Math.max(0,eff-36),1.7)/10;
  v-=(p.sal/100)*(t.owner==='profit'?.45:.3)*(p.faC?Math.max(1,p.yrs)*.6:.6);
  if(milFree(p)&&p.age>=26)v*=.82;
  if(t.mode==='contend'&&p.age>=29)v*=1.1; if(t.mode==='rebuild'&&p.age>=30)v*=.75;
  if(G.cal&&period()==='season'&&G.day>G.cal.open+40){ // 시즌 중: 순위 경쟁 팀은 즉시 전력을 더 원한다
    const st=standingsNow(); const rk=st.findIndex(x=>x.tid===t.id); if(rk<5&&p.age>=27)v*=1.12; if(rk>=7&&p.age>=30)v*=.8; }
  return v;
}
/* ===== 트레이드 가치 (단위: 억 원 상당) =====
 능력(현재·장래·나이), 연봉과 남은 계약, 구단 형편(돈·우승 경쟁·리빌딩), 자리 필요도(주전을 내주면 비싸게), 감독 성향, 선수 불만, 컨디션을 함께 본다. */
function condOf(p){ const f=p.sf&&p.sf.y===G.year?p.sf.v*.5+(p.sf.m||0):0; return clamp(Math.round(f*.9+((p.mor??60)-60)/25-(p.fat||0)/40),-5,5); }
function seasonWorth(o){ return Math.pow(Math.max(0,o-40),1.6)/6; }
function projO(p,i){ const o=ovr(p)+(i===0?condOf(p)*.3:0); const a=p.age+i; if(a<=25){ const g=Math.max(0,p.pot-ovr(p)); return o+g*Math.min(1,(i+1)*.28); } if(a>=31)return o-(a-30)*1.3; return o; }
function ctrlYears(p){ if(p.foreign)return 1; if(p.faC)return Math.max(1,p.yrs||1); return clamp(faSvc(p)-(p.svc||0),1,6); }
let _tcC={k:null,m:{}};
function teamCtx(t){ const k=G.year+':'+G.day; if(_tcC.k!==k)_tcC={k,m:{}}; if(_tcC.m[t.id])return _tcC.m[t.id];
  const per=period(); const st=per==='season'&&G.day>G.cal.open+20?standingsNow():null; const rk=st?st.findIndex(x=>x.tid===t.id)+1:null;
  const contend=rk?rk<=4||(t.mode==='contend'&&rk<=6):t.mode==='contend'; const ci=capInfo(t.id);
  const tr=gmTrait(t.id); const money=(t.indie?1.5:t.owner==='profit'?1.25:t.owner==='win'?.85:1)*(ci.over>0?1.25:1)*(contend?.9:1.1)*(tr==='miser'?1.3:tr==='data'?1.15:tr==='gambler'?.9:1);
  const v={contend,money,H:contend?2:4,now:contend?1.15:.8,rk}; _tcC.m[t.id]=v; return v; }
function pSlot(p){ return p.isP?(isSPr(p)?'SP':'RP'):p.pos; }
function roleFactor(t,p,dir){ const L=leagueSlots()[t.id]; const k=pSlot(p); const sl=L&&L[k]; if(!sl)return 1;
  if(dir==='out'){ const starter=sl.ps.some(q=>q.id===p.id); if(!starter)return 1; return teamCtx(t).contend?1.45:1.25; }
  const base=k==='SP'?(sl.ps.length<5?30:Math.min(...sl.ps.map(spV))):k==='RP'?(sl.ps.length<4?30:Math.min(...sl.ps.map(penV))):sl.v;
  const up=slotGain(k,p)-base; if(up>0)return 1+Math.min(.35,up/20); return p.age<=23?.85:.6; }
function tval(t,p,dir){ if(!p)return 0; const c=teamCtx(t); const ny=ctrlYears(p); let v=0;
  for(let i=0;i<c.H;i++){ const o=projO(p,i); const d=Math.pow(.85,i); const w=seasonWorth(o)*(i===0?c.now:1)*d;
    if(i>=ny){ v+=w*.25; continue; }
    const sal=p.faC||p.foreign?p.sal/100:Math.min(seasonWorth(o),p.sal/100*Math.pow(1.3,i)); v+=w-sal*c.money*d; }
  if(v>0)v*=roleFactor(t,p,dir);
  const gt=gmTrait(t.id); if(v>0){ if(gt==='prospect'&&p.age<=24)v*=1.22; if(gt==='gambler'&&dir==='in'&&ovr(p)>=60)v*=1.15; if(gt==='data'){ const cd=condOf(p); v*=1-cd*.02; } }
  const m=G.mgr[t.id]; if(m&&v>0){ if(m.youth>=65&&p.age<=25)v*=1.1; if(m.small>=65&&!p.isP&&p.r.spd>=60)v*=1.06; if(m.pen>=65&&p.isP&&!isSP(p))v*=1.08; }
  if(v>0&&p.mor!=null&&p.mor<30)v*=dir==='in'?.92:.85;
  if(v>0&&dir==='in'&&ovr(p)<40&&p.age<=24)v*=.8; /* 아직 1군 근처에도 못 온 유망주는 불확실하다 */
  if(v>0&&dir==='out'&&(p.listed||p.aiListed))v*=p.aiListed?(p.aiUrg?.5:.62):(p.urgent?.75:.85); /* 블록에 올린 선수는 정리하고 싶은 선수다 */
  if(v>0&&milFree(p)&&p.age>=26)v*=.85;
  if(p.injOut>20)v-=Math.abs(v)*.2;
  if(dir==='out'){ const L=leagueSlots()[t.id]; const sl=L&&L[pSlot(p)]; const starter=sl&&sl.ps.some(q=>q.id===p.id)&&!p.aiListed; const fl=p.aiListed?(t.mode==='rebuild'?0:.6):starter?(c.contend?seasonWorth(projO(p,0))*.7:seasonWorth(projO(p,0))*.25):.4; v=Math.max(v,fl); }
  /* 연봉이 부담스러워도 주전급은 공짜로 내주지 않는다(다른 구단에 팔 수 있으므로) */
  if(dir==='out'){ const core=domestic(t.id).filter(q=>!q.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,6).some(q=>q.id===p.id); const w0=seasonWorth(projO(p,0));
    /* 팀 핵심(상위 6명)은 연봉과 상관없이 쉽게 내주지 않는다. 젊으면 더 비싸다 */
    if(core)v=Math.max(v,w0*(c.contend?.9:.55)*(p.age<=28?1.25:1)); else if(ovr(p)>=50)v=Math.max(v,w0*(c.contend?.45:.3)); }
  return v; }
function stackIn(vals){ const pos=vals.filter(x=>x>0).sort((a,b)=>b-a), neg=vals.filter(x=>x<=0); const w=[1,.62,.42,.3,.25]; return sum(pos.map((x,i)=>x*(w[i]??.25)))+sum(neg); }
function tradeNeed(t,outVal){ const tr=gmTrait(t.id); let n=1.2+Math.max(0,outVal)*.08-(t.rel-50)/15*(tr==='loyal'?2:1); if(tr==='hard')n=n*1.35+.8; if(tr==='gambler')n-=.5; if(tr==='loyal'&&t.rel>=70)n-=1; return n; }
function trueVal(p){ const o=ovr(p); const eff=p.age<=25?o+Math.max(0,p.pot-o)*.6:p.age>=32?o-(p.age-31)*1.3:o; return Math.pow(Math.max(0,eff-36),1.7)/10-(p.sal/100)*.35; }
function tradeOpen(){ const per=period(); if(per==='post')return false; if(per==='season')return G.day<=KD(7,31); return true; }
function evalTrade(tid,give,get){
  const t=team(tid); const P=id=>G.players[id];
  const I=aiInterest(tid); const hit=give.filter(id=>I.includes(id));
  const inV=stackIn(give.map(id=>tval(t,P(id),'in')*(I.includes(id)?1.2:1))), outV=sum(get.map(id=>tval(t,P(id),'out')));
  const theirN=rosterN(tid)+give.length-get.filter(id=>!P(id).ys).length;
  let need=tradeNeed(t,outV)-(get.some(id=>P(id)&&P(id).aiListed)?1.5:0)-(hit.length?.6:0); if(t.mode!=='rebuild'&&get.some(id=>P(id)&&P(id).aiListed))need=Math.max(need,.3); if(theirN>=ROSTER_MAX-1&&give.length>get.length)need+=.8*(give.length-get.length);
  const theirPay=capPay(tid)+sum(give.map(id=>P(id).sal))-sum(get.map(id=>P(id).sal));
  const c=(G.gmc||{})[tid]||{}; let anc=0; for(const id of get){ const a=c.ask&&c.ask[id]; if(a&&a.until>=G.day)anc+=a.m; } need+=Math.max(0,outV)*Math.min(.25,anc)+hn('gmday'+tid,G.day)*.06*Math.max(3,outV);
  /* 같은 구단과 올해 거래를 반복할수록, 상대 핵심 선수를 데려갈수록 웃돈을 요구한다 */
  if(tid!==G.user){ const nT=(G.trades||[]).filter(x=>x.y===G.year&&x.with===tid).length; if(nT)need+=Math.max(1.5,outV)*.25*nT;
    const core=new Set(domestic(tid).filter(q=>!q.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,3).map(q=>q.id)); if(get.some(id=>core.has(id)))need+=Math.max(1,outV)*.2; }
  /* 한 명의 주축을 여러 명의 B급과 바꾸지 않는다: 받는 선수 중 가장 좋은 선수가 내주는 주축의 75%는 돼야 한다 */
  { const outs=get.map(id=>tval(t,P(id),'out')).filter(x=>x>0); const ins=give.map(id=>tval(t,P(id),'in')); const topO=outs.length?Math.max(...outs):0, topI=ins.length?Math.max(...ins):0;
    if(topO>=3&&give.length>get.length&&topI<topO*.75)need+=(topO*.75-topI)*1.3; }
  const gain=inV-outV; return {gain,need,ok:gain>=need,theirN,theirPay,inV,outV,hit};
}
function proposeTrade(tid,give,get){
  const t=team(tid);
  if(!tradeOpen())return {ok:false,msg:'트레이드 마감(7월 31일)이 지났습니다. 포스트시즌이 끝난 뒤 다시 할 수 있습니다.'};
  if(!give.length&&!get.length)return {ok:false,msg:'주고받을 선수를 골라 주세요.'};
  if([...give,...get].some(id=>G.players[id].foreign))return {ok:false,msg:'외국인 선수는 트레이드 대상에서 뺐습니다(게임 단순화).'};
  const gmn=`${t.city} ${t.nick} ${gmOf(tid).name} 단장`; const nt=negTurn(tid); const ni=negInfo(tid); const sig=tsig(give,get);
  const isCtr=nt.ctr&&nt.ctr[sig]===G.day; /* 상대가 직접 낸 역제안·보완안은 횟수·중복 제한 없이 받는다 */
  if(!isCtr&&nt.seen[sig]!=null)return {ok:false,msg:`${gmn}: 그 안은 ${dsh(nt.seen[sig])}에 이미 답을 드렸습니다. 조건을 바꿔서 오시죠.`,dup:true};
  if(!isCtr&&!ni.left)return {ok:false,msg:`${gmn}: 이번 달은 더 시간을 내기 어렵습니다. ${ni.next}에 다시 연락 주십시오.${ni.free?'':' (우리와 맞대결하는 기간에는 경기장에서 따로 만날 수 있습니다)'}`,closed:true};
  const e=evalTrade(tid,give,get);
  if(e.theirN>ROSTER_MAX)return {ok:false,msg:`${t.city} ${t.nick} 로스터가 ${ROSTER_MAX}명을 넘게 됩니다. 받을 선수를 늘려 주세요.`};
  if(e.theirN<ROSTER_MIN)return {ok:false,msg:`${t.city} ${t.nick} 로스터가 ${ROSTER_MIN}명 아래로 내려갑니다.`};
  if(e.theirPay>capOf(G.year)&&e.theirPay>capPay(tid))return {ok:false,msg:`${t.city} ${t.nick} 단장: 샐러리캡 때문에 연봉을 더 떠안을 수 없습니다.`};
  if(e.ok){ const mv=mgrTradeView(tid,give,get); const grade=tradeGrade(tid,give,get); const snap=tradeSnap([...give,...get]);
    give.forEach(id=>{ G.players[id].team=tid; story(G.players[id],`트레이드로 ${tname(tid)} 이적`,'move'); }); get.forEach(id=>{ G.players[id].team=G.user; story(G.players[id],`트레이드로 ${tname(G.user)} 이적`,'move'); });
    for(const k in G.lineup) if(give.includes(G.lineup[k]))delete G.lineup[k];
    const diff=sum(get.map(id=>trueVal(G.players[id])))-sum(give.map(id=>trueVal(G.players[id])));
    try{ frBacklash(give); }catch(e){}
    chron('trade',`${tshort(tid)}와(과) 트레이드: ${give.map(id=>G.players[id]?G.players[id].name:'').join('·')} 보내고 ${get.map(id=>G.players[id]?G.players[id].name:'').join('·')} 받음`);
    G.trades.push({y:G.year,d:G.day,with:tid,give:give.map(id=>G.players[id].name),get:get.map(id=>G.players[id].name),diff,revealed:false,gi:[...get],go:[...give],snap,grade});
    t.rel=clamp(t.rel+2,0,100); prTrade(give,get,tid);
    addLog(`${tname(tid)}와(과) 트레이드: ${give.map(id=>G.players[id].name).join(', ')||'없음'} ↔ ${get.map(id=>G.players[id].name).join(', ')||'없음'}`);
    mgrTradeApply(mv); churnCheck(); mpickTraded(give); return {ok:true,grade,msg:`${gmn}이 제안을 받아들였습니다.${mv&&mv.r?` ${mv.r>0?'감독은 반깁니다':'감독은 못마땅해합니다'}(관계 ${mv.r>0?'+':''}${mv.r}).`:''}`};
  }
  const gap=e.need-e.gain; if(!ni.free&&!isCtr)nt.neg++; nt.seen[sig]=G.day; nt.ask=nt.ask||{}; for(const id of get){ const a=nt.ask[id]||{m:0,until:0}; a.m=Math.min(.25,(a.until>=G.day?a.m:0)+.04); a.until=G.day+7; nt.ask[id]=a; }
  for(const id of give){ const q=G.players[id]; if(q&&R()<.12){ q.mor=clamp((q.mor??60)-4,0,100); if(R()<.5)wire('루머',`${q.name}, ${t.city} ${t.nick}와(과) 트레이드 카드로 거론됐다는 소문`,{ref:q.id}); } } if(gmTrait(tid)==='hard'&&nt.neg>=3)t.rel=clamp(t.rel-1,0,100);
  if(gap>9){ t.rel=clamp(t.rel-2,0,100); return {ok:false,msg:`${gmn}: 진지한 제안으로 보기 어렵습니다. (친분 -2)`}; }
  const co=counterOffer(tid,give,get); nt.ctr={}; for(const c of co)nt.ctr[tsig(c.give,c.get)]=G.day; if(co.length)return {ok:false,msg:`${gmn}: 조금 모자랍니다. 이렇게 하시면 응하겠습니다.`,counters:co};
  const cand=domestic(G.user).filter(p=>!give.includes(p.id)&&!(p.joinY>G.year)).map(p=>({p,v:tval(t,p,'in')*.72})).filter(x=>x.v>=gap*.8).sort((a,b)=>a.v-b.v)[0];
  if(cand)nt.ctr[tsig([...give,cand.p.id],get)]=G.day;
  return {ok:false,msg:`${gmn}: 조금 부족합니다.${cand?` ${cand.p.name}(${posLabel(cand.p)})을(를) 얹어 주면 응하겠습니다.`:' 받는 선수를 줄여 주세요.'}`,want:cand?cand.p.id:null};
}

/* ===== 스카우트 리포트: 숨은 능력을 오차를 섞어 보여준다 ===== */
const TOOLK={con:'컨택',pow:'파워',eye:'선구안',spd:'주루',def:'수비',vit:'체력',stf:'구위',ctl:'제구',sta:'체력'};
const GOOD={vit:'체력이 좋아 연속 출장에도 지치지 않습니다.',con:'배트 컨트롤이 좋아 삼진을 잘 당하지 않습니다.',pow:'타구에 힘이 실려 장타를 기대할 수 있습니다.',eye:'공을 오래 보고 볼넷을 골라냅니다.',spd:'발이 빨라 내야안타와 도루가 됩니다.',def:'수비 범위와 송구가 안정적입니다.',stf:'구위로 타자를 압도합니다.',ctl:'원하는 곳에 던지는 제구가 됩니다.',sta:'긴 이닝을 버틸 체력이 있습니다.'};
const BAD={vit:'체력이 약해 연속 출장이 이어지면 성적이 떨어집니다.',con:'변화구 대처가 약해 삼진이 많습니다.',pow:'장타력이 부족합니다.',eye:'유인구에 방망이가 쉽게 나갑니다.',spd:'주력이 느립니다.',def:'수비에서 실수가 잦습니다.',stf:'구위가 평범해 정타를 자주 허용합니다.',ctl:'제구가 흔들려 볼넷이 많습니다.',sta:'투구 수가 늘면 구위가 떨어집니다.'};
function coverOf(tid){ const reg=team(tid).region; return {reg,sc:scoutOf('pro',reg)}; }
function publicP(p){ return p.hist.some(h=>h.lvl==='1군'&&h.y>=G.year-1&&(h.pa>=10||h.outs>=9)); }
function bestScout(region){ if(region)return scoutOf('am',region); const s=[...G.scouts].sort((a,b)=>effSkill(b)-effSkill(a))[0]; return s?Object.assign({},s,{skill:effSkill(s)}):null; }
function archetype(t,p){ // t: 평가된 도구 점수
  if(p.isP){
    if(t.stf>=62&&t.ctl<50)return '강속구 투수(제구 불안)'; if(t.stf>=60&&t.ctl>=57)return '에이스형'; if(t.ctl>=60&&t.stf<53)return '제구형 기교파';
    if(isSP(p)&&t.sta>=60)return '이닝이터'; if(!isSP(p)&&t.stf>=58)return '파워 불펜'; return isSP(p)?'선발 자원':'불펜 자원'; }
  if(t.pow>=62&&t.con<50)return '거포형'; if(t.pow>=57&&t.con>=55)return '중장거리 강타자'; if(t.con>=58&&t.spd>=58)return '교타형 리드오프';
  if(t.con>=60)return '교타자'; if(t.spd>=62)return '준족형'; if(t.def>=62&&t.con+t.pow<100)return '수비형'; if(t.eye>=62)return '선구안형'; return '밸런스형';
}
function roleOf(ofp,p){
  const pos=p.isP?(isSP(p)?'선발':'불펜'):POSS[p.pos];
  if(ofp>=70)return '리그 최정상급'; if(ofp>=65)return '올스타급 '+pos; if(ofp>=60)return '상위권 주전 '+pos; if(ofp>=55)return '주전 '+pos;
  if(ofp>=50)return p.isP?(isSP(p)?'4~5선발':'필승조급 불펜'):'평균 주전·핵심 백업'; if(ofp>=45)return '1군 백업'; if(ofp>=40)return '1.5군'; return '1군 전력 외';
}
function scoutReport(p){ // KBO 소속 선수는 현재 능력(오버롤)을 정확히 보여 준다. 장래성은 우리 선수, 또는 프로 담당 스카우트가 있는 지역 구단 선수만
  const r=scoutReport0(p); if(p.prospect||(p.foreign&&p.team==null))return r;
  const ref=p.team!=null?p.team:p.faFrom; if(ref==null)return r;
  const own=ref===G.user; const cur=Math.round(ovr(p)); let ofp=own?r.ofp:null, who=r.who, sc=r.sc;
  if(!own){ const cv=coverOf(ref); if(cv.sc){ const sd=SCOUT_SD[cv.sc.skill]; ofp=clamp(r5(p.pot+hn('pf'+cv.sc.id+G.year,p.id)*sd),20,80); who=`${cv.sc.name} 스카우트(${cv.reg} 프로 담당)`; sc=cv.sc; } else who=`${cv.reg} 프로 담당 스카우트 없음`; }
  if(ofp!=null)ofp=Math.max(ofp,cur);
  /* 성장기가 끝난 선수는 장래 능력이 현재를 크게 넘지 않는다(29세 +4, 30세 +2, 31세 이상 현재 그대로) */
  if(ofp!=null&&p.age>=29)ofp=Math.min(ofp,cur+Math.max(0,31-p.age)*2);
  const tools=Object.keys(p.r).map(k=>{ const c=Math.round(p.r[k]); const f=ofp!=null&&p.age<=26?clamp(Math.round(c+(ofp-cur)*.9),c,80):c; return {k,cur:c,fut:f}; });
  const tv={}; tools.forEach(t=>tv[t.k]=t.cur);
  const notes=r.cur!=null&&r.notes&&r.notes.length?r.notes.slice():[GOOD[[...tools].sort((a,b)=>b.cur-a.cur)[0].k]];
  if(!own&&ofp==null)notes.push('장래성은 그 지역 프로 담당 스카우트가 있어야 알 수 있습니다.');
  return Object.assign({},r,{who,sc,cur,ofp,tools,arch:archetype(tv,p),role:ofp!=null?roleOf(ofp,p):null,notes,risk:r.risk||'판단 불가',conf:own?r.conf:ofp!=null?r.conf||'보통':'현재 능력만',exact:true});
}
function scoutReport0(p){
  const own=p.team===G.user&&!p.prospect; let sc=null, sd, who, futKnown=true;
  if(p.prospect){ sc=bestScout(p.region); const mo=dobj(G.day).m; sd=(sc?SCOUT_SD[sc.skill]:SCOUT_SD[0])*(mo<=5?1.35:mo<=8?1.12:1); futKnown=!!sc; who=sc?`${sc.name} 스카우트(${p.region})`:'담당 스카우트 없음'; }
  else if(own){ sc=bestScout(); sd=sc?Math.min(3,SCOUT_SD[sc.skill]):3.5; who='코치진·스카우트 합동'; }
  else if(p.foreign&&p.team==null){ const r=origOf(p), lv=intlLv(r); sd=INET[lv].sd*(1-fwatchK(p.id)/100*.7); futKnown=lv>=1||fwatchK(p.id)>=40; const isc=G.scouts.find(s=>s.role==='intl'&&s.region===r); who=`${IREG[r].l} ${INET[lv].l}${isc?` · ${isc.name} 스카우트 파견`:''}`; sc={id:'intl'+r+lv,skill:lv+1,name:IREG[r].l}; }
  else if(p.team!=null){ const cv=coverOf(p.team); const pub=publicP(p);
    if(!cv.sc||(!pub&&cv.sc.skill<3))return {who:cv.sc?`${cv.sc.name} 스카우트(${cv.reg})`:`${cv.reg} 담당 스카우트 없음`,sc:null,sd:99,conf:'없음',cur:null,ofp:null,tools:[],arch:'평가 없음',role:null,notes:[cv.sc?'1군 기록이 없는 퓨처스 선수라 능력 3 이상 스카우트만 파악할 수 있습니다.':`${cv.reg} 지역을 맡은 스카우트가 없어 이 구단 선수는 평가하지 못했습니다. 기록만 볼 수 있습니다.`],risk:'판단 불가',eta:null,unseen:true};
    sc=cv.sc; sd=SCOUT_SD[sc.skill]*.8*anaEff(G.user).sdm; futKnown=false; who=`${sc.name} 스카우트(${cv.reg} 프로 담당)`; }
  else { sc=bestScout(); sd=(sc?SCOUT_SD[sc.skill]*.8:SCOUT_SD[0])*anaEff(G.user).sdm; futKnown=!!sc; who=sc?`${sc.name} 스카우트(프로 담당)`:'스카우트 없음'; }
  const key=(sc?sc.id:'none')+(own?'own':'')+G.year;
  const gap=Math.max(0,p.pot-ovr(p));
  const tools=Object.keys(p.r).map(k=>{ const n=hn('t'+k+key,p.id)*sd*.8; const cur=clamp(r5(p.r[k]+n),20,80); const fut=clamp(r5(p.r[k]+gap*(p.age<=26?1:0)+n+hn('u'+k+key,p.id)*sd*.4),20,80); return {k,cur,fut:futKnown?Math.max(cur,fut):cur}; });
  const cur=clamp(r5(ovr(p)+hn('c'+key,p.id)*sd*.55),20,80);
  let ofp=futKnown?clamp(Math.max(cur,r5(p.pot+hn('f'+key,p.id)*sd)),20,80):null;
  if(ofp!=null&&!p.prospect&&p.age>=29)ofp=Math.min(ofp,cur+Math.max(0,31-p.age)*2);
  const tv={}; tools.forEach(t=>tv[t.k]=t.cur);
  const arch=archetype(tv,p);
  const sorted=[...tools].sort((a,b)=>b.cur-a.cur);
  const notes=[GOOD[sorted[0].k]];
  if(futKnown){
    if(sorted[sorted.length-1].cur<45)notes.push(BAD[sorted[sorted.length-1].k]);
    if(p.age<=26&&ofp!=null&&ofp-cur>=10)notes.push(p.prospect?`체격과 기술이 더 자랄 여지가 큽니다. ${ofp>=60?'팀의 미래를 걸어 볼 만합니다.':'꾸준히 키우면 1군 자원이 됩니다.'}`:`아직 다 자라지 않았습니다. 2~3년 안에 ${roleOf(ofp,p)}까지 기대합니다.`);
    if(p.age>=32)notes.push('하락세가 시작될 나이입니다. 장기 계약은 신중해야 합니다.');
    { const dh=dtHint(p,sd); if(dh&&(p.age<=30||p.dt==='vet'))notes.push(dh); }
    if(!p.prospect&&!p.foreign){ const pf=perfOvr(p,2); if(pf!=null){ if(pf-cur>=8)notes.push('최근 기록은 실력보다 운이 따른 면이 있습니다. 기록만 보고 비싸게 사면 위험합니다.'); else if(cur-pf>=8)notes.push('기록보다 실력이 좋습니다. 반등을 기대할 만합니다.'); } }
    if(p.foreign&&p.prev&&!p.team){ notes.push(`${p.prevLvl} 기록은 리그 수준 차이를 감안해야 합니다.`); const lv=intlLv(origOf(p)); if(lv>=2&&p.adapt!=null){ if(p.adapt>=62)notes.push('성격이 밝고 생활 적응력이 좋아 첫해부터 제 실력을 낼 것으로 봅니다.'); else if(p.adapt<=38)notes.push('낯선 환경에 예민한 편입니다. 첫 시즌 적응에 애를 먹을 수 있습니다.'); else notes.push('적응력은 평범한 수준입니다.'); } }
    if(p.inj>.24&&sd<=7.5)notes.push('잔부상이 잦은 체질입니다. 부상 위험이 높습니다.');
    if(p.prospect&&p.amLevel&&sc&&sc.skill>=4)notes.push(`아마추어 기록은 ${p.amLevel}니다.`);
  } else notes.push(p.foreign&&!p.team?'에이전트가 보낸 영상과 기록뿐이라 실제 기량과 장래성은 불확실합니다. 해외 스카우트망을 넓히면 정확해집니다.':p.prospect?'이 지역을 맡은 스카우트가 없어 장래성은 판단하지 못했습니다.':'스카우트가 없어 장래성은 판단하지 못했습니다.');
  const risk=!futKnown?'판단 불가':(gap>14||p.inj>.26)&&p.age<=24?'높음':gap>8||p.inj>.22?'보통':'낮음';
  const eta=p.prospect&&futKnown?Math.max(1,Math.ceil((48-cur)/4)):null;
  const conf=sd<=3.5?'매우 높음':sd<=5.5?'높음':sd<=8?'보통':'낮음';
  return {who,sc,sd,conf,cur,ofp,tools,arch,role:ofp!=null?roleOf(ofp,p):null,notes,risk,eta};
}

/* ===== 표시 도구 ===== */
function money(v){ const neg=v<0; v=Math.abs(Math.round(v)); if(v===0)return '0원'; let s; if(v>=100)s=(v/100).toFixed(2).replace(/\.?0+$/,'')+'억'; else s=(v*100).toLocaleString('ko-KR')+'만'; return (neg?'-':'')+s; }
const fmt3=x=>x.toFixed(3).replace(/^0/,'');
function curLine(p){ // 이번 시즌 합계(1군 우선), 없으면 지난 시즌
  const y=period()==='pre'?G.year-1:G.year;
  /* 시즌 초 1~2경기 표본은 보여 주지 않는다: 30타석·10이닝 전까지는 지난 시즌 기록 */
  const h=seasonTotal(p,y,'1군'); const ok=h&&(p.isP?h.outs>=30:h.pa>=30);
  return (ok?h:null)||seasonTotal(p,y-1,'1군')||h||seasonTotal(p,y,'퓨처스')||seasonTotal(p,y-1,'퓨처스');
}
function statLine(h,p){ if(!h)return '기록 없음';
  const lv=h.lvl==='퓨처스'?'퓨처스 ':'';
  if(p.isP){ const r=pRate(h); return `${lv}ERA ${h.outs?r.era.toFixed(2):'-'} · ${ipStr(h.outs)}이닝 · WAR ${warOf(h,p).toFixed(1)}${h.sv?` · ${h.sv}세이브`:h.hld?` · ${h.hld}홀드`:h.gs?` · ${h.w}승`:''}`; }
  const r=bRate(h); return `${lv}OPS ${h.pa?fmt3(r.ops):'-'} · ${h.hr}홈런 · WAR ${warOf(h,p).toFixed(1)}`; }


/* ===== 언론·여론·구단주 압박 =====
 팬 여론(fan)과 언론 논조(press)는 0~100. 기사 하나하나가 두 지수를 움직이고, 지수는 관중·광고 수입과 구단주 평가로 이어진다. */
const OUTLETS=['스포츠한빛','데일리 베이스볼','야구일보','더그아웃 매거진','팬 커뮤니티'];
function prInit(){ if(!G.pr)G.pr={fan:55,press:50,hist:[]}; if(!G.news)G.news=[]; if(!G.ownerLog)G.ownerLog=[]; }
function news(kind,title,body,tone,o){ prInit(); o=o||{};
  const outlet=o.outlet||(kind==='팬'?'팬 커뮤니티':OUTLETS[Math.floor(u01('out'+title,G.day)*4)]);
  if((G.news||[]).some(x=>x.t===title&&G.day-x.d<30))return null; /* 같은 제목 기사는 한 달 안에 다시 내지 않는다 */
  const it={d:G.day,o:outlet,t:title,b:body,v:tone,k:kind,ref:o.ref??null,id:(G.newsSeq=(G.newsSeq||0)+1)};
  G.news.unshift(it); if(G.news.length>80)G.news.length=80;
  G.pr.press=clamp(G.pr.press+tone*1.7,0,100); G.pr.fan=clamp(G.pr.fan+tone*(o.fanW??1),0,100);
  if(o.mail)mail('홍보팀',`[${outlet}] ${title}`,`${body}\n\n홍보팀 의견: ${tone>=2?'구단에 우호적인 기사입니다. 팬 반응도 좋습니다.':tone<=-2?'부정적인 기사입니다. 여론이 나빠지고 구단주실도 이 기사를 봤을 것입니다.':'참고하실 기사입니다.'}`,{kind:'언론',ref:o.ref??null});
  return it; }
function prDaily(won,lost){ prInit(); const P=G.pr;
  if(won)P.fan=clamp(P.fan+.32,0,100); if(lost)P.fan=clamp(P.fan-.32,0,100);
  P.press+=(50-P.press)*.012; P.fan+=(50+(team(G.user).pop-1)*30-P.fan)*.004; }
function prAfterGame(rec){ prInit(); const S=G.sea; const won=rec.res==='승', lost=rec.res==='패';
  prDaily(won,lost);
  S.streak=won?(S.streak>0?S.streak+1:1):lost?(S.streak<0?S.streak-1:-1):0;
  const st=S.streak, nm=tshort(G.user);
  if(st===5||st===8||st===12)news('경기',`${nm}, ${st}연승 질주`,`${tname(G.user)}이(가) ${st}연승을 달렸습니다. 마운드와 타선이 고르게 터지면서 분위기가 살아났다는 평가입니다.`,st>=8?3:2);
  if(st===-5||st===-8||st===-12){ const n=-st; const T=[[`${nm} ${n}연패 수렁… 프런트 책임론`,`전력 보강 실패와 운영 방향을 두고 프런트를 향한 비판이 나오고 있습니다.`],[`${nm}, 끝 모를 ${n}연패`,`타선 침묵과 마운드 붕괴가 겹쳤습니다. 분위기 반전 카드가 필요하다는 목소리가 큽니다.`],[`${n}연패 ${nm}, 해법이 안 보인다`,`벤치와 프런트 모두 답을 찾지 못하고 있습니다. 팬들의 인내심도 바닥나고 있습니다.`],[`${nm} 또 졌다… ${n}연패`,`경기력 기복이 심합니다. 선수단 구성을 다시 봐야 한다는 지적이 나옵니다.`]];
    const k=Math.floor(u01('ls'+G.year,G.day)*T.length); news('경기',T[k][0],`${tname(G.user)}이(가) ${n}연패에 빠졌습니다. ${T[k][1]}`,n>=8?-3:-2); }
  const ms=rec.home===G.user?rec.hs-rec.as:rec.as-rec.hs; if(Math.abs(ms)>=10&&R()<.6)news('경기',ms>0?`${nm} 타선 대폭발, ${Math.abs(ms)}점 차 대승`:`${nm} 마운드 붕괴, ${Math.abs(ms)}점 차 대패`,ms>0?`${tname(G.user)}이(가) 상대 마운드를 두들기며 크게 이겼습니다.`:`${tname(G.user)} 마운드가 무너지며 크게 졌습니다. 투수진 운용에 물음표가 붙었습니다.`,ms>0?1:-1);
  if(period()==='season'&&G.day>dnum(G.year,6,1)){ const rk=standingsNow().findIndex(x=>x.tid===G.user)+1; const inn=rk<=5; if(S.inPS!=null&&inn!==S.inPS&&G.day-(S.psNewsDay||0)>=12&&(S.psNewsDay=G.day))news('분석',inn?`${nm}, 5위권 진입… 가을야구 보인다`:`${nm}, 5위권 밖으로 밀려나`,inn?`${tname(G.user)}이(가) ${rk}위로 올라서며 포스트시즌 진출권에 들어왔습니다.`:`${tname(G.user)}이(가) ${rk}위로 내려앉았습니다. 가을야구 경쟁이 험난해졌습니다.`,inn?2:-2); S.inPS=inn; }
  if(/한국시리즈/.test(rec.kind||'')&&won&&G.ps&&G.ps.done&&G.ps.res.ks&&G.ps.res.ks[0]===G.user)news('경기',`${nm} 한국시리즈 우승`,`${tname(G.user)}이(가) 한국시리즈 정상에 올랐습니다. 단장의 선수단 구성이 결실을 맺었다는 평가가 나옵니다.`,4,{fanW:3});
}
function prMonth(m){ prInit(); if(G.unemp)return; const st=standingsNow(); const rk=st.findIndex(x=>x.tid===G.user)+1; const g=G.goals; const nm=tshort(G.user);
  G.pr.hist.push({m:`${G.year}.${m}`,fan:Math.round(G.pr.fan),press:Math.round(G.pr.press)}); if(G.pr.hist.length>24)G.pr.hist.shift();
  if(g&&rk<=g.rank-2)news('분석',`${m}월 결산: ${nm}, 예상 밖 선전`,`시즌 전 예상보다 높은 ${rk}위를 달리고 있습니다. 프런트의 겨울 준비가 통했다는 분석입니다.`,2);
  else if(g&&rk>=g.rank+3)news('분석',`${m}월 결산: ${nm}, 목표와 거리 멀어져`,`구단 목표였던 ${g.rank}위 이내와 달리 ${rk}위에 머물고 있습니다. 반등 카드가 필요하다는 지적입니다.`,-2);
  // 젊은 선수 활약
  const y=domestic(G.user).filter(p=>p.age<=23).map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h&&((!x.p.isP&&x.h.pa>=60&&bRate(x.h).ops>=.85)||(x.p.isP&&x.h.outs>=60&&pRate(x.h).era<=3.2)))[0];
  if(y&&!(G.sea.youthNews||[]).includes(y.p.id)){ (G.sea.youthNews=G.sea.youthNews||[]).push(y.p.id); news('선수',`${nm}의 새 얼굴 ${y.p.name}`,`${y.p.age}세 ${y.p.name}이(가) ${statLine(y.h,y.p)}(으)로 활약 중입니다. 구단 육성의 성과라는 평가입니다.`,2,{ref:y.p.id,fanW:1.5}); }
  // 외국인 부진
  for(const p of foreignOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); if(!h)continue; const bad=p.isP?(h.outs>=90&&pRate(h).era>=6):(h.pa>=120&&bRate(h).ops<.66);
    if(bad&&!(G.sea.fbad||[]).includes(p.id)){ (G.sea.fbad=G.sea.fbad||[]).push(p.id); news('선수',`${nm} 외국인 ${p.name}, 계속되는 부진`,`${p.name}이(가) ${statLine(h,p)}에 그치고 있습니다. 교체 여부를 두고 프런트의 결단이 필요하다는 목소리가 큽니다.`,-2,{ref:p.id}); } }
  // 육성 기조와 성적
  if(G.policy&&G.policy.k==='youth'&&rk>=8)news('분석',`'육성'이냐 '포기'냐… ${nm} 리빌딩 논란`,`하위권에서 유망주 기용을 늘리는 ${nm}의 운영을 두고 팬들 사이에서 의견이 갈립니다.`,-1,{fanW:1.5});
  // 이달의 선수
  const best=domestic(G.user).concat(foreignOf(G.user)).map(p=>{ const L=p.l10||[]; return {p,v:(seasonTotal(p,G.year,'1군')?warOf(seasonTotal(p,G.year,'1군'),p):0)}; }).sort((a,b)=>b.v-a.v)[0];
  if(best&&best.v>=1.2&&R()<.6){ const h=seasonTotal(best.p,G.year,'1군'); news('선수',`${nm}의 기둥 ${best.p.name}`,`${best.p.name}이(가) ${statLine(h,best.p)}(으)로 팀을 이끌고 있습니다.`,1,{ref:best.p.id}); }
  // 티켓 가격과 구장 관중
  { const S=stadOf(G.user); const pf=PRICE[S.price].fan+(S.lv.seat-2)*.25; if(pf)G.pr.fan=clamp(G.pr.fan+pf*2,0,100); const A=G.sea.att&&G.sea.att[G.user];
    if(A&&A.n>=8){ const occ=A.sum/A.n/stadCap(G.user); if(occ>=.95&&R()<.5)news('구단',`${nm} 홈경기 표 구하기 전쟁`,`${stadName(G.user)} 좌석 점유율이 ${Math.round(occ*100)}%입니다. 올해 매진 ${A.so}회.`,1); else if(occ<.6&&R()<.5)news('구단',`${nm} 홈 관중석 썰렁`,`${stadName(G.user)} 경기당 평균 ${Math.round(A.sum/A.n).toLocaleString('ko-KR')}명으로 좌석 점유율 ${Math.round(occ*100)}%에 그쳤습니다.`,-1); } }
  ownerMonth(m,rk); try{ staffReport(`${m}월`); }catch(err){}
}
function prTrade(give,get,partner){ prInit(); const v=ids=>sum(ids.map(id=>{const p=G.players[id]; if(!p)return 0; const h=seasonTotal(p,G.year,'1군')||seasonTotal(p,G.year-1,'1군'); return h?Math.max(-1,warOf(h,p)):0;}));
  const d=v(get)-v(give); const gn=give.map(id=>G.players[id]&&G.players[id].name).filter(Boolean).join(', '), tn=get.map(id=>G.players[id]&&G.players[id].name).filter(Boolean).join(', ');
  const tone=d>=2?2:d>=.7?1:d<=-2?-2:d<=-.7?-1:0;
  news('트레이드',tone>=1?`${tshort(G.user)}, 트레이드로 전력 보강`:tone<=-1?`${tshort(G.user)} 트레이드에 물음표`:`${tshort(G.user)}-${tshort(partner)} 트레이드 단행`,
    `${tname(G.user)}이(가) ${tname(partner)}와(과) 트레이드했습니다. ${gn||'없음'}을(를) 보내고 ${tn||'없음'}을(를) 받았습니다. ${tone>=1?'당장 전력에 도움이 되는 거래라는 평가입니다.':tone<=-1?'기록상으로는 손해라는 시각이 많습니다. 숨은 의도가 있는지 지켜봐야 합니다.':'득실은 시간이 지나야 알 수 있다는 평가입니다.'}`,tone,{mail:true});
}
function prFA(rec){ if(rec.to!==G.user||rec.from===G.user)return; const big=rec.annual>=1500; news('FA',`${tshort(G.user)}, FA ${rec.name} 영입`,`${tname(G.user)}이(가) FA ${rec.name}와(과) ${rec.years}년 연 ${money(rec.annual)}에 계약했습니다.${big?' 대형 계약으로 팬들의 기대가 큽니다.':''}`,big?3:1,{fanW:big?2:1}); }
function prLeak(kind,p,txt){ news('선수',kind==='mgr'?`${txt}`:`${tshort(G.user)} ${p.name}, 출전 기회 불만 토로`,kind==='mgr'?`감독과 프런트 사이 엇박자가 감지됩니다. 구단 내부 소통에 문제가 있다는 지적입니다.`:`${p.name}이(가) 측근을 통해 현재 상황에 대한 불만을 드러냈다는 소식입니다. 구단 분위기가 흔들릴 수 있다는 우려가 나옵니다.`,-2,{ref:p?p.id:null}); }
/* 구단주: 시즌 목표와 월간 평가 */
function setGoals(intro,first){ prInit(); const t=team(G.user); const proj=G.proj?G.proj.indexOf(G.user)+1:5; const ow=t.owner;
  /* 창단 첫해는 구단주도 기대를 낮춘다: 예상 순위 기준으로 성적 우선 그대로, 홍보 우선 1계단 아래, 수익 우선 2계단 아래(최대 8위) */
  const rank=first?Math.min(8,ow==='win'?proj:ow==='profit'?proj+2:proj+1):ow==='win'?Math.max(1,Math.min(5,proj-1)):ow==='profit'?Math.min(8,proj+1):Math.min(7,proj);
  const base=projSupport(); const sup=G.supPlan&&G.supPlan.y===G.year?Math.round(G.supPlan.gf*100)/100:Math.round(clamp(base*(ow==='profit'?.85:ow==='pr'?1:1.15)+.05,.2,1)*100)/100; /* 1월에 정한 지원 목표를 그대로 쓴다 */ const fan=ow==='pr'?60:ow==='win'?45:50;
  const youth=t.mode==='rebuild'||ow==='profit'?1:0;
  G.goals={y:G.year,rank,sup,fan,youth,v:2};
  const lines=[`정규시즌 ${rank}위 이내`,`모기업 적자 보전을 한도의 ${Math.round(sup*100)}% 이하로`,`팬 여론 ${fan} 이상 유지`]; if(youth)lines.push('24세 이하 선수 1명 이상을 1군 주전급(규정 타석 절반 또는 80이닝)으로');
  mail('구단주실',`${G.year} 시즌 구단 목표`,`${intro?intro+'\n\n':''}구단주께서 올 시즌 목표를 정하셨습니다.\n\n${lines.map((l,i)=>`${i+1}. ${l}`).join('\n')}\n\n전력분석팀 예상 순위는 ${proj}위입니다. ${OWNER[ow].msg} 매달 말 구단주께서 진행 상황을 보고받으십니다.`,{imp:true,kind:'구단주',acts:[{l:'목표 보기',a:'go',v:'club:owner'}]});
}
function goalStatus(){ const g=G.goals; if(!g||g.y!==G.year)return null; const t=team(G.user); const per=period();
  const st=per==='season'||per==='post'?standingsNow():null; const rk=st?st.findIndex(x=>x.tid===G.user)+1:null;
  const proj=projSupport(); const yc=domestic(G.user).filter(p=>p.age<=24).filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?h.outs>=240:h.pa>=223); }).length;
  return {rank:{t:g.rank,cur:rk,ok:rk!=null&&rk<=g.rank},sup:{t:g.sup,cur:proj,ok:proj<=g.sup},fan:{t:g.fan,cur:Math.round(G.pr.fan),ok:G.pr.fan>=g.fan},youth:g.youth?{t:1,cur:yc,ok:yc>=1}:null}; }
/* ===== 올해 예산(다음 결산까지 연간 예상) ===== */
function finYearEnd(){ const y=(G.last&&G.last.y>=G.year)?G.year+1:G.year; return dnum(y,11,5); }
function budget(){ const t=team(G.user); const ci=capInfo(G.user); const S=G.spend||{}; const m=G.mgr[G.user]; prInit();
  const rem=Math.max(0,finYearEnd()-G.day)/365; const acc=(spent,annual)=>Math.round((spent||0)+annual*rem);
  const settled=G.last&&G.last.y>=G.year; const SPj=stadProj(G.user,settled); const fsNow=sum(foreignOf(G.user).map(p=>p.sal));
  const fs=!settled&&G.sea&&G.sea.fspend&&G.sea.fspend[G.user]!=null?G.sea.fspend[G.user]:fsNow;
  const fR=settled?((G.lgFor&&G.lgFor[G.year])||3200):(G.cal&&G.day>=G.cal.open&&G.sea&&G.sea.y===G.year)?0:fReserve(); const fsB=Math.max(fs,fR);
  const intlA=sum(Object.keys(IREG).map(r=>INET[intlLv(r)].c));
  const tax=ci.over>0?Math.round(ci.over*capRate((t.capOver||0)+1)):0; const flo=G.year>=2027&&ci.floor>ci.pay?Math.round((ci.floor-ci.pay)*capRate((t.floorUnder||0)+1)):0;
  const exp=[['국내 선수 연봉',ci.all,'pay'],[fR>fs?'외국인 선수 연봉(배정 예산)':'외국인 선수 연봉',fsB,'for'],['감독 연봉',acc(S.mgr,m?m.sal:0),'mgr'],['코치진 연봉',acc(S.coach,G.coach?coachSal(G.user):0),'mgr'],
    ['구단 운영비',t.indie?19000:24000,'ops'],['스카우트 운영',sum(G.scouts.map(s=>s.sal))+600,'ops'],['마케팅',G.marketing,'ops'],
    ['부상 방지·병원',acc((S.med||0)+(S.hosp||0),PREV[G.med.prev].c+HOSP[G.med.hosp].c),'ops'],['해외 스카우트망',acc(S.intl,intlA),'ops'],['전력분석원 연봉',acc(S.data,anaSal()),'ops'],['훈련 시설 유지비',acc(S.fac,facUpkeep()),'ops'],
    ['해외 연수',S.dev||0,'ops'],['구장 시설 유지비',SPj.up,'ops'],['신인 계약금',settled?0:((G.sea.bonus&&G.sea.bonus[G.user])||0),'pay'],['신구장 분담금',newStadDue(G.user),'ops'],['단장 결정 지출',S.etc||0,'ops'],['FA 보상금',S.comp||0,'pay'],['방출 정산금',S.rel||0,'pay'],['경쟁균형세',tax,'pay'],['하한 미달 발전기금',flo,'pay']].filter(x=>x[1]>0);
  const r=G.sea&&G.sea.rec&&!settled?G.sea.rec[G.user]:null; const wp=r&&r.w+r.l>=10?r.w/(r.w+r.l):.5;
  const att=SPj.att;
  const inc=[['입장 수입',SPj.ticket],['중계권 배분',9000],['광고·상품',Math.round((5200+G.marketing*1.6)*t.market*t.pop*(0.85+G.pr.fan/333)*(0.95+G.pr.press/1000))]]; { const sx=SPj.fnb+SPj.prem+SPj.ad; if(sx>0)inc.push(['구장 부대 수입',sx]); }
  if(t.indie)inc.push(['메인 스폰서',10500]); { const si=starIncome(G.user); if(si>0)inc.push(['스타 마케팅',si]); } { const due=newStadDue(G.user); if(due)inc.push(['모기업 신구장 출자',Math.round(due*.7)]); }
  const E=sum(exp.map(x=>x[1])), I=sum(inc.map(x=>x[1])); const gap=E-I; const cap=supportCap(t);
  const g=G.goals&&G.goals.y===G.year&&!settled?G.goals:null; const plan=!g&&!settled&&G.supPlan&&G.supPlan.y===G.year?G.supPlan.gf:null; const gf=g?g.sup:plan!=null?plan:clamp((cap?Math.max(0,gap)/cap:0)*(t.owner==='profit'?.85:t.owner==='pr'?1:1.15)+.05,.2,1); const goalSup=t.indie?0:Math.round(gf*cap);
  const support=t.indie?0:clamp(gap,0,cap);
  return {exp,inc,E,I,gap,cap,support,goalSup,goalFrac:gf,cash:t.cash,endCash:t.cash+I+support-E,
    roomGoal:goalSup-gap, roomCap:cap-gap, roomMax:cap-gap+Math.max(0,t.cash), rem, indie:!!t.indie, trust:t.trust,
    fR,fRoom:Math.max(0,fR-fs),fUsed:sum(foreignOf(G.user).filter(p=>p.foreign==='용병').map(p=>p.sal)), fCap:fCap(G.user), aUsed:sum(foreignOf(G.user).filter(p=>p.foreign==='아시아').map(p=>p.sal)), ci}; }
/* 외국인 선수 연봉은 어느 구단이나 미리 잡아 두는 돈이다. 단장 첫 시즌은 규정 한도(신규 용병 3명 각 100만 달러 + 아시아쿼터 20만 달러)까지 배정하고, 이후에는 지난 시즌 리그 평균 외국인 지출을 배정한다 */
function fReserve(){ if(G.gmSince===G.year)return 3*F_NEW_CAP+ASIA_CAP; const L=G.lgFor&&G.lgFor[G.year-1]; return L||3200; }
/* 개막 전 구단주 지원 목표는 시즌 시작 때 한 번 정해 둔다(지출할수록 여유가 줄어들도록) */
/* 창단 첫해 예비비: 비어 있는 코치 자리를 채울 연봉 + 운영 여유분. 드래프트 한도와 지원 목표에서 미리 떼어 둔다 */
function foundReserve(tid){ tid=tid??G.user; const C=G.coach&&G.coach[tid]; let vac=0;
  if(C){ for(const k of CKEYS){ if(C[k])continue; const L=(G.cmarket||[]).filter(c=>c.role===k).map(c=>c.sal).sort((a,b)=>a-b); vac+=L.length?L[Math.floor(L.length/2)]:150; } }
  if(!G.mgr[tid]||G.mgr[tid].interim){ const L=(G.mmarket||[]).map(m=>m.sal).sort((a,b)=>a-b); vac+=L.length?L[Math.floor(L.length/2)]:300; }
  const rem=Math.max(0,finYearEnd()-G.day)/365; const cap=supportCap(team(tid)); const cush=Math.max(1500,Math.round(cap*.08));
  return {vac:Math.round(vac*rem),cush,tot:Math.round(vac*rem)+cush}; } /* vac: 감독·코치 빈자리 채용비 */
function planSup(){ delete G.supPlan; try{ const b=budget(); let gf=b.goalFrac; if(G.startY===G.year&&b.cap){ const want=(b.gap+foundReserve().tot)/b.cap; gf=Math.round(clamp(Math.max(gf,want),.2,1)*100)/100; } G.supPlan={y:G.year,gf}; }catch(e){} } /* 창단 첫해는 드래프트 직후 예산 여유가 마이너스로 시작하지 않게 지원 목표에 여유분을 둔다 */
function projSupport(){ const b=budget(); if(b.indie||!b.cap)return 0; return clamp(b.gap/b.cap,0,2); }
/* 코치진 정기 보고: 단장이 처리할 일을 골라 버튼과 함께 보낸다 */
function staffReport(when){ if(G.unemp||!G.mgr[G.user])return; const tid=G.user; const ps=playersOf(tid); const items=[], acts=[];
  const top=ps.filter(p=>!p.foreign).sort((a,b)=>ovr(b)-ovr(a)).slice(0,10);
  G.srSeen=G.srSeen||{}; for(const p of top.filter(p=>ctrlYears(p)<=1&&canExtend(p)&&G.srSeen[p.id]!==G.year).slice(0,2)){ G.srSeen[p.id]=G.year; items.push(`[계약] ${p.name}(${posLabel(p)}, ${p.age}세)은(는) 이번 시즌 뒤 FA가 됩니다. 팀 상위 10명 안의 선수라 다년계약을 검토할 만합니다.`); acts.push({l:`${p.name} 계약`,a:'pmgmt',v:p.id}); }
  const d=depth(tid); const y=G.year;
  { const wb=[...d.start].sort((a,b)=>ovr(a)-ovr(b))[0]; const fb=d.futB.filter(p=>!p.ys&&healthy(p)).map(p=>({p,h:seasonTotal(p,y,'퓨처스')})).filter(x=>x.h&&x.h.pa>=60&&bRate(x.h).ops>=.800).sort((a,b)=>ovr(b.p)-ovr(a.p))[0];
    if(wb&&fb&&ovr(fb.p)>=ovr(wb)-1){ items.push(`[콜업] 퓨처스 ${fb.p.name}(${posLabel(fb.p)})이(가) OPS ${fmt3(bRate(fb.h).ops)}로 좋습니다. 1군 ${wb.name}과(와) 비교해 볼 만합니다.`); acts.push({l:`${fb.p.name} 보기`,a:'player',v:fb.p.id}); } }
  { const fp=d.futP.filter(p=>!p.ys&&healthy(p)).map(p=>({p,h:seasonTotal(p,y,'퓨처스')})).filter(x=>x.h&&x.h.outs>=60&&pRate(x.h).era<=3.2).sort((a,b)=>ovr(b.p)-ovr(a.p))[0];
    const wp=[...d.pen].sort((a,b)=>ovr(a)-ovr(b))[0]; if(fp&&wp&&ovr(fp.p)>=ovr(wp)-1&&acts.length<3){ items.push(`[콜업] 퓨처스 투수 ${fp.p.name}이(가) 평균자책점 ${pRate(fp.h).era.toFixed(2)}입니다. 1군 불펜 보강 후보입니다.`); acts.push({l:`${fp.p.name} 보기`,a:'player',v:fp.p.id}); } }
  { const slump=[...d.start,...d.sp].map(p=>({p,h:seasonTotal(p,y,'1군')})).filter(x=>x.h&&(x.p.isP?(x.h.outs>=90&&pRate(x.h).era>=6.3):(x.h.pa>=120&&bRate(x.h).ops<.600))).slice(0,2);
    slump.forEach(x=>items.push(`[부진] ${x.p.name}: ${statLine(x.h,x.p)}. 감독은 계속 기용하고 있습니다. 대체 자원이 있는지 보세요.`)); }
  { const nx=PSLOTS.filter(k=>{ if(k==='SP'||k==='RP')return false; const p=d.ln[k]; return p&&!p.foreign&&ctrlYears(p)<=1; }); if(nx.length)items.push(`[내년] 주전 중 ${nx.map(k=>SLOTK[k]).join(', ')} 자리 선수가 이번 시즌 뒤 FA입니다. 선수단 화면의 스쿼드 플래너에서 내년 공백을 확인하세요.`); }
  if(!items.length)return; if(acts.length<3)acts.push({l:'스쿼드 플래너',a:'go',v:'roster:plan'});
  mail('코치진',`${when} 코치진 보고: 단장 확인 ${items.length}건`,`${items.join('\n\n')}\n\n버튼을 누르면 해당 화면으로 바로 갑니다.`,{kind:'업무',acts:acts.slice(0,3)}); }
function ownerMonth(m,rk){ const t=team(G.user); const g=G.goals; if(!g)return; const ow=t.owner; const w=OWNER[ow].w;
  /* 경기 수가 적을 때는 순위로 판단하지 않는다: 30경기 전에는 평가 보류, 70경기까지 순위 비중을 서서히 올린다 */
  const rr=G.sea&&G.sea.rec&&G.sea.rec[G.user]; const gp=rr?rr.w+rr.l+(rr.t||0):0; const early=gp<30; const rkW=clamp((gp-30)/40,0,1);
  let s=0; s+=(g.rank-rk)*.6*w[0]*rkW; s+=(G.pr.press-50)/14*(w[3]*.6+.4); s+=(G.pr.fan-g.fan)/12*(w[3]*.7+.3); const ps=projSupport(); s+=(g.sup-ps)*4*w[2];
  if(early)s=clamp(s,-1,1);
  const fy=g.fd&&G.year===G.startY; if(fy&&s<0)s*=.6; /* 창단 첫해: 구단주도 참을성이 있다 */
  const d=clamp(Math.round(s),early?0:fy?-2:-4,early?1:3); t.trust=clamp(t.trust+d,0,100);
  const mood=s>=2?'만족':s>=-1?'관망':s>=-4?'불만':'격노';
  const demands=[]; if(!early&&rkW>=.5&&rk>g.rank+1)demands.push(`순위를 ${g.rank}위 안으로 끌어올리라`); if(ps>g.sup+.15)demands.push('적자 폭을 줄이라'); if(G.pr.press<38)demands.push('언론 보도를 관리하라'); if(G.pr.fan<g.fan-8)demands.push('팬심을 돌려 놓으라');
  const txt=mood==='만족'?`구단주께서 ${m}월 보고를 받고 만족해하셨습니다. 지금 방향을 유지하라는 말씀입니다.`:mood==='관망'?(early?`구단주께서 ${m}월 보고를 받으셨습니다. 아직 ${gp}경기라 성적은 더 지켜보겠다고 하셨습니다.`:`구단주께서 ${m}월 보고를 받으셨습니다. 아직 판단을 미루고 지켜보겠다고 하셨습니다.`):`구단주께서 ${m}월 보고에 ${mood==='격노'?'크게 화를 내셨습니다':'불만을 표하셨습니다'}. ${demands.length?demands.join(', ')+'고 하셨습니다.':''}${t.trust<25?' 단장 교체 이야기가 그룹 안에서 나오고 있습니다.':''}`;
  G.ownerLog.unshift({d:G.day,m,mood,delta:d,trust:t.trust,txt}); if(G.ownerLog.length>20)G.ownerLog.length=20;
  mail('구단주실',`${m}월 구단주 보고: ${mood}`,`${txt}\n\n현재 ${rk}위(목표 ${g.rank}위 이내) · 팬 여론 ${Math.round(G.pr.fan)}(목표 ${g.fan}) · 언론 논조 ${Math.round(G.pr.press)} · 예상 적자 보전 ${Math.round(ps*100)}%(목표 ${Math.round(g.sup*100)}% 이하)\n구단주 신뢰 ${t.trust} (${d>=0?'+':''}${d})`,{imp:mood==='격노',kind:'구단주',acts:[{l:'목표 보기',a:'go',v:'club:owner'}]});
}
function goalYearEnd(rank,fin){ const s=goalStatus(); if(!s)return {d:0,lines:[]}; s.rank.cur=rank; s.rank.ok=rank<=s.rank.t; if(fin&&fin.supCap){ s.sup.cur=fin.support/fin.supCap; s.sup.ok=s.sup.cur<=s.sup.t; } const w=OWNER[team(G.user).owner].w; let d=0; const lines=[];
  const f=(ok,label,wt)=>{ const v=Math.round((ok?3:-4)*wt); d+=v; lines.push(`${label} ${ok?'달성':'미달'} (${v>=0?'+':''}${v})`); };
  f(s.rank.ok,`순위 목표(${s.rank.t}위 이내)`,w[0]); f(s.sup.ok,'재정 목표',w[2]); f(s.fan.ok,`여론 목표(${s.fan.t})`,w[3]); if(s.youth)f(s.youth.ok,'육성 목표',.8);
  return {d,lines}; }

/* ===== 병역: 상무·현역 입대, 올림픽 특례 =====
 KBO 실제: 상무(국군체육부대) 복무 1년 6개월, 복무 중 퓨처스리그 출전 가능. 올림픽 동메달 이상은 체육요원 편입.
 게임 규칙: 만 28세가 되는 해까지 입대하지 않으면 현역으로 입대한다. 상무 지원은 9~10월(12월 입대)과 3~4월(6월 입대) 두 번. 올림픽은 2028 LA 이후 4년마다 열린다고 가정. */
const MIL_DAYS=548, SANGMU_SLOTS=14;
const isAway=p=>!!((p.mil&&p.mil.until&&p.mil.until>G.day)||(p.ntAway&&p.ntAway>G.day&&p.ntFrom<=G.day));
const milFree=p=>!p.foreign&&!(p.mil&&(p.mil.done||p.mil.exempt||p.mil.until));
function milInit(p){ if(p.mil!==undefined||p.foreign)return; const a=p.age; const u=u01('mil',p.id);
  p.mil=a>=28?(u<.9?{done:true}:u<.95?{exempt:true}:null):a>=25?(u<.55?{done:true}:u<.6?{exempt:true}:null):a>=22?(u<.2?{done:true}:null):null; }
function milText(p){ if(p.foreign)return '해당 없음'; const m=p.mil; if(!m)return `미필 · ${G.year+Math.max(0,27-p.age)}년까지 입대`; if(m.exempt)return '면제(체육요원)'; if(m.done)return '군필';
  if(m.until>G.day)return `${m.unit} 복무 중 · ${dmd(m.until)} 전역`; if(m.until)return `${m.unit} 입대 예정 · ${dmd(m.from)}`; if(m.app)return `상무 지원 중(${m.app==='dec'?'12월':'6월'} 입대)`; return '미필'; }
function enlist(p,unit,from){ p.mil={unit,from,until:from+MIL_DAYS}; story(p,`${unit} 입대 (${dmd(from)})`,'mil'); p.e1=false; if(p.team===G.user)addLog(`${p.name} ${unit} 입대 확정 (${dmd(from)} 입대, ${dmd(from+MIL_DAYS)} 전역 예정).`); }
function sangmuApply(id){ const p=G.players[id]; if(!p||p.team!==G.user||!milFree(p))return '대상이 아닙니다.'; if(p.mil&&p.mil.app)return '이미 지원했습니다.'; const w=sangmuWave(); if(!w)return '상무 지원 기간이 아닙니다(3~4월, 9~10월).'; if(p.age>27)return '상무 지원은 27세까지입니다(게임 규칙).';
  p.mil={app:w}; addLog(`${p.name}이(가) 상무에 지원했습니다.`); return ''; }
function sangmuWave(){ const d=G.day; if(d>=KD(9,1)&&d<KD(10,15))return 'dec'; if(d>=KD(3,1)&&d<KD(4,15))return 'jun'; return null; }
function enlistNow(id){ const p=G.players[id]; if(!p||p.team!==G.user||!milFree(p))return '대상이 아닙니다.'; enlist(p,'현역',G.day+14); return ''; }
function milDaily(){ const d=G.day;
  if(d===KD(9,1)||d===KD(3,1)){ const w=d===KD(9,1)?'dec':'jun';
    for(const p of Object.values(G.players)){ if(p.team==null||p.team===G.user||!milFree(p)||p.mil&&p.mil.app)continue; if(p.age>=24&&p.age<=27&&R()<(p.age>=26?.7:.25))p.mil={app:w}; }
    const mine=domestic(G.user).filter(p=>milFree(p)&&p.age>=23&&p.age<=27);
    if(mine.length)mail('운영팀',`상무 지원 기간입니다 (${w==='dec'?'12월':'6월'} 입대)`,`상무(국군체육부대) 야구단 지원을 받습니다. 복무는 1년 6개월이고, 복무 중에도 퓨처스리그에서 뛰며 기량을 유지할 수 있습니다. 현역으로 가면 1년 6개월 동안 야구를 거의 못 해 기량이 떨어집니다.\n\n우리 구단 미필 선수: ${mine.map(p=>`${p.name}(${p.age}세)`).join(', ')}\n\n${p28(mine)}지원은 ${dmd(d+44)}까지입니다.`,{imp:true,kind:'병역',acts:[{l:'병역 관리',a:'go',v:'staff:mil'}]}); }
  if(d===KD(10,15)||d===KD(4,15)){ const w=d===KD(10,15)?'dec':'jun'; const apps=Object.values(G.players).filter(p=>p.mil&&p.mil.app===w);
    const ranked=apps.map(p=>({p,s:ovr(p)+hn('sm'+G.year,p.id)*4+(p.injOut>30?-10:0)})).sort((a,b)=>b.s-a.s); const from=w==='dec'?KD(12,10):KD(6,10);
    const ok=[],no=[]; ranked.forEach((x,i)=>{ if(i<SANGMU_SLOTS){ enlist(x.p,'상무',from); ok.push(x.p);} else { x.p.mil=null; no.push(x.p);} });
    const mo=ok.filter(p=>p.team===G.user), mn=no.filter(p=>p.team===G.user);
    if(mo.length||mn.length)mail('운영팀','상무 합격자 발표',`${mo.length?`합격: ${mo.map(p=>p.name).join(', ')} (${dmd(from)} 입대)`:'합격자 없음'}${mn.length?`\n불합격: ${mn.map(p=>p.name).join(', ')}. 다음 지원 기간에 다시 지원하거나 현역으로 입대해야 합니다.`:''}`,{imp:true,kind:'병역'});
    if(mo.some(p=>ovr(p)>=52))news('선수',`${tshort(G.user)} 주축 ${mo.find(p=>ovr(p)>=52).name} 상무 합격`,`전력 공백은 불가피하지만 1년 6개월 뒤 돌아올 자원입니다.`,-1); }
  for(const p of Object.values(G.players)){ const m=p.mil; if(m&&m.until===d){ p.mil={done:true,unit:m.unit}; story(p,`${m.unit} 전역`,'mil'); if(p.team===G.user)mail('운영팀',`${p.name} 전역`,`${p.name}이(가) ${m.unit} 복무를 마치고 돌아왔습니다. 정식 로스터 인원을 확인해 주세요.`,{kind:'병역',ref:p.id}); } }
  for(const t of G.teams){ if(t.id!==ME()&&rosterN(t.id)>ROSTER_MAX)try{ trimRoster(t.id,ROSTER_MAX); }catch(e){} }
  oly(d); }
function p28(ms){ const u=ms.filter(p=>p.age>=27); return u.length?`올해 안에 입대해야 하는 선수(27세 이상): ${u.map(p=>p.name).join(', ')}. 해를 넘기면 현역으로 입대합니다.\n\n`:''; }
function milNewYear(){ // 해가 바뀌면 28세 이상 미필은 현역 입대
  for(const p of Object.values(G.players)){ milInit(p); if(p.team==null||!milFree(p)||p.mil&&p.mil.app)continue; if(p.team!==G.user&&p.age>=20&&p.age<=24&&ovr(p)<40&&R()<.22){ enlist(p,'현역',dnum(G.year,1,20)); continue; } if(p.age>=28){ enlist(p,'현역',dnum(G.year,1,20)); if(p.team===G.user)mail('운영팀',`${p.name} 현역 입대`,`${p.name}이(가) 입대 연기 한도를 넘겨 현역으로 입대합니다(게임 규칙: 28세). 1년 6개월 뒤 돌아오지만 기량이 떨어질 수 있습니다.`,{imp:true,kind:'병역',ref:p.id}); } } }
/* 2군(퓨처스) 월간 리포트: 5~9월 1일 육성팀 보고 */
function futuresReport(){ if(G.unemp)return; const y=G.year; const ps=playersOf(G.user).filter(p=>!p.foreign&&!p.e1); if(!ps.length)return;
  const B=ps.filter(p=>!p.isP).map(p=>({p,h:seasonTotal(p,y,'퓨처스')})).filter(x=>x.h&&x.h.pa>=40).map(x=>({...x,v:bRate(x.h).ops})).sort((a,b)=>b.v-a.v).slice(0,3);
  const P=ps.filter(p=>p.isP).map(p=>({p,h:seasonTotal(p,y,'퓨처스')})).filter(x=>x.h&&x.h.outs>=45).map(x=>({...x,v:pRate(x.h).era})).sort((a,b)=>a.v-b.v).slice(0,3);
  const base=G.fut0&&G.fut0.y===y?G.fut0.m:{}; const up=ps.filter(p=>base[p.id]!=null).map(p=>({p,d:ovr(p)-base[p.id]})).filter(x=>x.d>=1).sort((a,b)=>b.d-a.d).slice(0,3);
  const rk=slotRanks(G.user); const call=ps.filter(p=>healthy(p)&&!p.ys&&!(p.joinY>y)).map(p=>{ const k=pSlot(p); const sl=rk[k]; const worst=sl&&sl.ps&&sl.ps.length?Math.min(...sl.ps.map(q=>ovr(q))):0; return {p,k,gap:ovr(p)-worst}; }).filter(x=>x.gap>=-1).sort((a,b)=>b.gap-a.gap).slice(0,2);
  if(!B.length&&!P.length&&!up.length)return;
  const L=[]; if(B.length)L.push('퓨처스 타격: '+B.map(x=>`${x.p.name}(${posLabel(x.p)}, OPS ${fmt3(x.v)}, ${x.h.pa}타석)`).join(', '));
  if(P.length)L.push('퓨처스 투구: '+P.map(x=>`${x.p.name}(${posLabel(x.p)}, ERA ${x.v.toFixed(2)}, ${ipStr(x.h.outs)}이닝)`).join(', '));
  if(up.length)L.push('올해 눈에 띄게 성장: '+up.map(x=>`${x.p.name}(+${x.d.toFixed(1)})`).join(', '));
  if(call.length)L.push('1군 콜업 후보: '+call.map(x=>`${x.p.name}(${posLabel(x.p)}) — 1군 같은 자리 선수와 비슷하거나 낫습니다`).join(', '));
  mail('육성팀',`${dobj(G.day).m}월 퓨처스 리포트`,`육성팀입니다. 이번 달 퓨처스 현황을 보고드립니다.\n\n${L.join('\n\n')}\n\n1군 기용은 감독 권한입니다. 콜업 후보는 감독에게 건의하거나 출전 기회를 약속하는 면담으로 밀어줄 수 있습니다.`,{kind:'육성',acts:[{l:'2군 연수 관리',a:'goWork',v:'2군연수'}]}); }
/* 올해 시작 시점 능력(성장 표시용)과 매달 팀 성장 기록 */
function ovrSnap(){ if(G.unemp)return; G.ovr0={y:G.year,m:Object.fromEntries(playersOf(G.user).concat(Object.values(G.players).filter(p=>p.team===G.user&&p.joinY>G.year)).map(p=>[p.id,ovr(p)]))}; }
function growSnap(){ if(G.unemp)return; const tid=G.user; const pr=playersOf(tid).filter(p=>p.age<=24&&!p.foreign).map(p=>p.pot).sort((a,b)=>b-a).slice(0,10); const o=dobj(G.day);
  (G.tgrow=G.tgrow||[]).push({y:o.y,m:o.m,r1:+teamRating(tid).toFixed(2),pot:pr.length?+(pr.reduce((a,b)=>a+b,0)/pr.length).toFixed(2):0,tid}); G.tgrow=G.tgrow.filter(x=>x.tid===tid).slice(-60); }
function milWarn(){ const L=domestic(G.user).filter(p=>{ milInit(p); return milFree(p)&&!(p.mil&&(p.mil.app||p.mil.until))&&p.age>=27; }); if(!L.length)return;
  stop('병역',`해가 바뀌면 현역으로 입대하는 선수(27세 미필): ${L.map(p=>`${p.name}(${posLabel(p)}, 능력 ${Math.round(ovr(p))})`).join(', ')}. 1월 20일 입대해 1년 6개월 동안 빠집니다. 대체 선수를 미리 구하세요.`,L[0].id); }
/* 올림픽 */
const olyYear=y=>y>=2028&&(y-2028)%4===0;
function olySquad(){ const ps=Object.values(G.players).filter(p=>p.team!=null&&!p.foreign&&!isAway(p)&&healthy(p)&&!(p.joinY>G.year));
  const v=p=>ovr(p)+hn('oly'+G.year,p.id)*2.5; const P=ps.filter(p=>p.isP).sort((a,b)=>v(b)-v(a)).slice(0,12), B=ps.filter(p=>!p.isP).sort((a,b)=>v(b)-v(a)).slice(0,12); return P.concat(B); }
function oly(d){ if(!olyYear(G.year))return; const y=G.year;
  if(d===KD(6,10)){ const sq=olySquad(); G.oly={y,ids:sq.map(p=>p.id)}; const mine=sq.filter(p=>p.team===G.user);
    mail('운영팀',`${y} 올림픽 야구 대표팀 발표`,`KBO 선수 24명이 뽑혔습니다. 우리 구단: ${mine.map(p=>`${p.name}${milFree(p)?'(미필)':''}`).join(', ')||'없음'}.\n\n올림픽은 7월 15~20일 열립니다. 대표 선수는 7월 13일부터 22일까지 팀을 떠납니다. 동메달 이상이면 미필 선수는 체육요원으로 병역 특례를 받습니다.`,{imp:mine.length>0,kind:'병역'});
    for(const p of mine)p.mor=clamp((p.mor??60)+6,0,100); }
  if(G.oly&&G.oly.y===y&&d===KD(7,13))for(const id of G.oly.ids){ const p=G.players[id]; if(p){ p.ntFrom=d; p.ntAway=KD(7,22); p.e1=false; } }
  if(G.oly&&G.oly.y===y&&d===KD(7,21)&&!G.oly.res){ const sq=G.oly.ids.map(id=>G.players[id]).filter(Boolean); const str=avg(sq.map(ovr));
    const pm=clamp(.32+(str-58)*.05,.12,.75), x=R(); const res=x<pm*.3?'금메달':x<pm*.62?'은메달':x<pm?'동메달':'노메달'; G.oly.res=res;
    const ex=res!=='노메달'?sq.filter(p=>milFree(p)):[]; ex.forEach(p=>p.mil={exempt:true});
    const mine=ex.filter(p=>p.team===G.user);
    mail('운영팀',`올림픽 야구 대표팀 ${res}`,`한국 대표팀이 ${res==='노메달'?'메달을 따지 못했습니다':res+'을 땄습니다'}.${ex.length?` 미필 선수 ${ex.length}명이 체육요원으로 병역 특례를 받습니다.`:''}${mine.length?` 우리 구단: ${mine.map(p=>p.name).join(', ')}.`:''}`,{imp:true,kind:'병역'});
    if(mine.length)news('선수',`${mine.map(p=>p.name).join('·')}, 올림픽 메달로 병역 특례`,`${tshort(G.user)}이(가) 군 공백 걱정을 덜었습니다.`,2,{fanW:1.5}); } }

/* ===== 트레이드 블록과 FA 에이전트 협상 ===== */
const WANT={any:'가장 좋은 제안',prospect:'유망주',p:'투수',b:'야수',sal:'연봉 절감'};
function blockAdd(id,want){ const p=G.players[id]; if(!p||p.team!==G.user||p.foreign)return; p.listed=true; p.lw=want||p.lw||'any'; }
function blockRemove(id){ const p=G.players[id]; if(!p)return; delete p.listed; delete p.lw; G.offers=(G.offers||[]).filter(o=>!(o.blk&&o.get.includes(id))); }
function corePool(tid){ const t=team(tid); const ds=domestic(tid).filter(p=>!p.ys); const core=new Set(ds.map(p=>({p,v:tval(t,p,'out')})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.p.id)); return ds.filter(p=>!core.has(p.id)); }
function pickPackage(tid,budget,want,exclude){ const t=team(tid); exclude=exclude||[];
  let pool=corePool(tid).filter(p=>!exclude.includes(p.id)&&healthy(p)).map(p=>({p,v:tval(t,p,'out')*(p.aiListed?.85:1),u:tval(team(G.user),p,'in')})).filter(x=>x.v>0.3&&x.u>0.3);
  if(want==='prospect')pool=pool.filter(x=>x.p.age<=24&&x.p.pot-ovr(x.p)>=6); else if(want==='p')pool=pool.filter(x=>x.p.isP); else if(want==='b')pool=pool.filter(x=>!x.p.isP);
  let best=null,bs=-1; const sc=arr=>{ const v=sum(arr.map(x=>x.v)); if(v>budget)return -1; return want==='sal'?v*.4-sum(arr.map(x=>x.p.sal))/100:v; };
  for(let i=0;i<pool.length;i++){ const s=sc([pool[i]]); if(s>bs){bs=s;best=[pool[i]];} for(let j=i+1;j<pool.length;j++){ const s2=sc([pool[i],pool[j]])-.4; if(s2>bs){bs=s2;best=[pool[i],pool[j]];} } }
  if(!best||sum(best.map(x=>x.v))<budget*.45)return null; return best.map(x=>x.p.id); }
function blockDaily(){ if(!tradeOpen())return; const got=[];
  for(const p of domestic(G.user).filter(x=>x.listed)){ const n=(G.offers||[]).filter(o=>o.blk&&o.get.includes(p.id)).length; if(n>=3)continue;
    for(const t of G.teams){ if(t.id===G.user||(G.offers||[]).some(o=>o.from===t.id&&o.get.includes(p.id))||R()>(p.urgent?.5:.3))continue;
      const v=tval(t,p,'in'), need=tradeNeed(t,v*.6); const budget=(v-need)*(p.urgent?.82:1); if(budget<1)continue;
      const give=pickPackage(t.id,budget,p.lw||'any'); if(!give)continue;
      G.offers=(G.offers||[]).concat({id:'o'+Math.floor(R()*1e9),from:t.id,give,get:[p.id],exp:G.day+7,blk:true,day:G.day}); got.push(`${t.city} ${t.nick} → ${p.name}`); break; } }
  if(got.length)note('트레이드',`트레이드 블록에 새 제안이 왔습니다: ${got.join(', ')}. 영입·계약 → 트레이드 블록에서 확인하세요.`); }
function offerMore(id){ const o=(G.offers||[]).find(x=>x.id===id); if(!o)return '제안이 없습니다.'; const t=team(o.from); if(o.more)return `${t.city} ${t.nick} 단장: 이미 한 번 올렸습니다. 이게 마지막입니다.`;
  o.more=true; const x=R(); if(x<.33+(t.rel-50)/100){ const p=G.players[o.get[0]]; const add=pickPackage(t.id,Math.max(1.5,tval(t,p,'in')*.35),'any',o.give); if(add){ o.give=o.give.concat(add.slice(0,1)); o.exp=G.day+3; return `${t.city} ${t.nick} 단장: 좋습니다. ${G.players[add[0]].name}을(를) 더 얹겠습니다.`; } }
  if(x>.8){ G.offers=G.offers.filter(y=>y.id!==id); t.rel=clamp(t.rel-2,0,100); return `${t.city} ${t.nick} 단장: 그 조건이면 없던 일로 하겠습니다. (제안 철회)`; }
  return `${t.city} ${t.nick} 단장: 이게 저희가 낼 수 있는 최선입니다.`; }
/* 다른 구단 트레이드 블록: 이유가 있는 선수를 올리고 6주까지 둔다. 압박받는 단장·연봉 초과 구단은 급매 */
const BLKWHY={reb:'리빌딩 정리',room:'자리 없음',dup:'중복 자원',sal:'연봉 정리'};
function aiBlockWeekly(){ if(!tradeOpen())return;
  for(const p of playersOf(G.user)){ delete p.aiListed; delete p.aiWhy; delete p.aiUrg; }
  for(const t of G.teams){ if(t.id===ME())continue; const ds=domestic(t.id).filter(p=>!p.ys&&healthy(p)&&!(p.joinY>G.year));
    for(const p of ds){ if(p.aiListed&&G.day-(p.aiLd||G.day)>42){ delete p.aiListed; delete p.aiWhy; delete p.aiUrg; delete p.aiLd; } }
    const cur=ds.filter(p=>p.aiListed); const heat=gmHeat(t.id); const ci=capInfo(t.id);
    if(cur.length<2&&R()<.55){ const top3=new Set([...ds].sort((x,y)=>ovr(y)-ovr(x)).slice(0,3).map(q=>q.id)); const d=depth(t.id); const st=new Set([...d.start,...d.sp,...d.pen.slice(0,3)].map(q=>q.id)); let pk=null, why=null;
      if(ci.pay>ci.cap*.97){ pk=ds.filter(p=>!top3.has(p.id)&&!p.aiListed).sort((x,y)=>y.sal-x.sal)[0]; why='sal'; }
      if(!pk&&t.mode==='rebuild'){ pk=ds.filter(p=>p.age>=29&&ovr(p)>=50&&!p.aiListed).sort((x,y)=>y.sal-x.sal)[0]; why='reb'; }
      if(!pk&&R()<.5){ pk=ds.filter(p=>p.age<=25&&!st.has(p.id)&&p.pot-ovr(p)>=6&&!p.aiListed).sort((x,y)=>ovr(y)-ovr(x))[0]; why='room'; }
      if(!pk){ const rk=slotRanks(t.id); pk=ds.filter(p=>!st.has(p.id)&&!top3.has(p.id)&&ovr(p)>=48&&!p.aiListed&&rk[pSlot(p)]&&rk[pSlot(p)].rank<=4).sort((x,y)=>ovr(y)-ovr(x))[0]; why='dup'; }
      if(pk){ pk.aiListed=true; pk.aiWhy=why; pk.aiLd=G.day; } }
    for(const p of ds.filter(q=>q.aiListed)){ p.aiUrg=p.aiWhy==='sal'&&ci.pay>ci.cap||heat>=.6||(G.day-(p.aiLd||G.day)>35); } } }
/* FA 에이전트 */
const AGF=['한빛스포츠','리드매니지먼트','넥스트에이전시','스타플러스','베이스라인'];
function agentOf(p){ if(!p.agent)p.agent={name:genName(),firm:AGF[Math.floor(u01('ag',p.id)*AGF.length)],style:u01('ags',p.id)<.3?'hard':u01('ags',p.id)>.8?'soft':'normal'}; return p.agent; }
function negOf(id){ const F=G.fa; F.neg=F.neg||{}; return F.neg[id]||(F.neg[id]={rounds:0,mood:60,log:[],counter:null,closed:false,warned:false}); }
const offScore=o=>o.annual*(1+.06*(o.years-1));
function faNegotiate(id,o){ const F=G.fa; const p=G.players[id]; const ag=agentOf(p); const n=negOf(id);
  if(faOutBlocked(G.user,p))return {msg:`이번 겨울 다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다(KBO 규약 제173조). 이미 ${faOutN(G.user)}명을 데려왔습니다.`};
  if(n.closed)return {msg:`${ag.name} 에이전트가 더 이상 우리와 협상하지 않습니다.`};
  if(n.rounds>=4)return {msg:'협상 횟수(4회)를 다 썼습니다. 지금 조건이 마지막입니다.'};
  n.rounds++; n.log.push({d:G.day,w:'구단',a:o.annual,y:o.years});
  const ai=Object.values(F.ai[id]||{}); const bestAI=ai.length?Math.max(...ai.map(offScore)):0;
  const want=offScore(p.ask)*(ag.style==='hard'?1.06:ag.style==='soft'?.95:1)*(1+.03*ai.length)*(p.faFrom===G.user?.95:1);
  const r=offScore(o)/Math.max(want*.97,bestAI*1.01); let t;
  F.offers[id]={annual:o.annual,years:o.years};
  if(r>=1){ n.hot=true; n.counter=null; n.mood=clamp(n.mood+8,0,100); t=`좋은 조건입니다. 선수에게 바로 전하겠습니다. ${ai.length?'다른 구단 제안과 비교해 곧 답을 드리겠습니다.':'큰 변수가 없으면 사인할 것 같습니다.'}`; }
  else if(r>=.9){ const k=1/r*rnd(.99,1.03); n.counter={annual:Math.min(round5(o.annual*k),round5(p.ask.annual*1.15)),years:Math.max(o.years,ag.style==='hard'?p.ask.years:o.years)}; n.mood=clamp(n.mood-2,0,100);
    t=`조금만 더 맞춰 주시면 됩니다. ${n.counter.years}년 연 ${money(n.counter.annual)}이면 선수를 설득해 보겠습니다.${ai.length?` 다른 구단에서도 ${ai.length}곳이 제안을 넣었습니다.`:''}`; }
  else if(r>=.75){ n.counter=null; n.mood=clamp(n.mood-10,0,100); t=`솔직히 차이가 큽니다. 선수 기대치는 ${p.ask.years}년 연 ${money(p.ask.annual)} 수준입니다.`; }
  else { n.counter=null; n.mood=clamp(n.mood-25,0,100); t='선수가 실망했습니다. 이 조건으로는 이야기하기 어렵습니다.'; }
  if(n.mood<25){ n.closed=true; delete F.offers[id]; t+=' 우리 구단과의 협상을 접겠다고 합니다.'; p.mor=clamp((p.mor??60)-10,0,100); }
  n.log.push({d:G.day,w:'에이전트',t}); return {msg:`${ag.name}(${ag.firm}): ${t}`}; }
function faAcceptCounter(id){ const n=negOf(id); if(!n.counter)return '역제안이 없습니다.'; const c=n.counter; G.fa.offers[id]={annual:c.annual,years:c.years}; n.log.push({d:G.day,w:'구단',a:c.annual,y:c.years,acc:true}); n.counter=null; n.deal=true; n.hot=true; n.log.push({d:G.day,w:'에이전트',t:'감사합니다. 선수에게 바로 사인을 권하겠습니다.'}); return `역제안을 받아들였습니다. ${G.players[id].name}이(가) 곧 답을 줄 것입니다.`; }
function faAgentPing(id){ const n=negOf(id); const p=G.players[id]; if(n.warned||!G.fa.offers[id]||n.closed)return; const ai=Object.values(G.fa.ai[id]||{}); if(!ai.length)return; const b=ai.sort((a,c)=>offScore(c)-offScore(a))[0];
  if(offScore(b)>offScore(G.fa.offers[id])){ n.warned=true; const ag=agentOf(p); n.log.push({d:G.day,w:'에이전트',t:`다른 구단에서 우리 제안보다 좋은 조건(약 ${b.years}년 연 ${money(round5(b.annual*rnd(.95,1.05)))})이 들어왔습니다.`});
    mail(`${ag.name} 에이전트`,`${p.name} 건: 경쟁 제안이 들어왔습니다`,`${ag.firm} ${ag.name}입니다. ${p.name}에게 다른 구단이 더 좋은 조건을 냈습니다. 대략 ${b.years}년 연 ${money(round5(b.annual*rnd(.95,1.05)))} 수준입니다. 조건을 올리실지 알려 주십시오.`,{imp:true,kind:'FA',ref:id,acts:[{l:'선수 보기',a:'player',v:id}]}); } }

/* ===== 시상·통산 기록·명예의 전당 ===== */
function careerOf(p){ const c={seasons:new Set(),teams:new Set(),pa:0,h:0,hr:0,rbi:0,sb:0,outs:0,w:0,sv:0,hld:0,so:0,war:0,byTeam:{}};
  for(const h of p.hist){ if(h.lvl!=='1군')continue; c.seasons.add(h.y); c.teams.add(h.t); const w=warOf(h,p); c.war+=w; c.byTeam[h.t]=c.byTeam[h.t]||{war:0,ys:new Set()}; c.byTeam[h.t].war+=w; c.byTeam[h.t].ys.add(h.y);
    if(p.isP){ c.outs+=h.outs||0; c.w+=h.w||0; c.sv+=h.sv||0; c.hld+=h.hld||0; c.so+=h.so||0; } else { c.pa+=h.pa||0; c.h+=h.h||0; c.hr+=h.hr||0; c.rbi+=h.rbi||0; c.sb+=h.sb||0; } }
  return c; }
function addAward(p,label){ (p.aw=p.aw||[]).push(label); story(p,label,'award'); if(p.team===G.user&&!G.unemp)chron('award',`${p.name} ${label}`,p.id); }
/* ===== 구단 연대기: 구단마다 해마다 일어난 일을 쌓는다 ===== */
function chron(k,t,ref,tid){ tid=tid??G.user; if(tid==null)return; G.chron=G.chron||[]; G.chron.push({y:G.year,d:G.day,tid,k,t,ref:ref??null,gm:G.unemp?0:1}); if(G.chron.length>900)G.chron.splice(0,100); }
/* ===== 프랜차이즈 스타: 한 구단에서 5시즌 이상 1군을 뛰고 그 구단 통산 WAR 12 이상(또는 7시즌·WAR 8) ===== */
function teamTenure(p,tid){ const ys=new Set(); let war=0; for(const h of p.hist){ if(h.lvl!=='1군'||h.t!==tid)continue; if((h.pa||0)>=100||(h.outs||0)>=120)ys.add(h.y); war+=warOf(h,p); } return {n:ys.size,war}; }
function isFranchise(p){ if(!p||p.team==null||p.foreign)return false; if(p.fr&&p.fr.tid===p.team)return true; const T=teamTenure(p,p.team); return (T.n>=5&&T.war>=12)||(T.n>=7&&T.war>=8); }
function franchiseCheck(){ for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||(p.fr&&p.fr.tid===p.team))continue; if(isFranchise(p)){ p.fr={tid:p.team,y:G.year}; if(p.team===G.user){ news('선수',`${p.name}, ${tshort(G.user)}의 프랜차이즈 스타로`,`${teamTenure(p,p.team).n}시즌 동안 한 팀에서 뛰며 통산 WAR ${teamTenure(p,p.team).war.toFixed(1)}을 쌓았습니다. 팬들이 가장 아끼는 선수가 됐습니다.`,2,{ref:p.id}); chron('star',`${p.name} 프랜차이즈 스타 등극`,p.id); } } } }
/* 은퇴하는 프랜차이즈 스타: 은퇴식, 통산 WAR 25 이상이면 영구결번 */
function legendRetire(p){ if(!isFranchise(p))return; const tid=p.team; const T=teamTenure(p,tid); G.frLeg=G.frLeg||[]; G.frLeg.push({tid,name:p.name,pos:posLabel(p),y:G.year,n:T.n,war:+T.war.toFixed(1)});
  wire('은퇴',`${tname(tid)} 프랜차이즈 스타 ${p.name} 은퇴`,{tid}); if(tid===G.user){ stop('선수',`${p.name}이(가) 은퇴합니다. ${T.n}시즌 동안 우리 팀에서 통산 WAR ${T.war.toFixed(1)}. 은퇴식을 열었습니다.`); chron('legend',`${p.name} 은퇴식 (${T.n}시즌, WAR ${T.war.toFixed(1)})`); news('선수',`${p.name} 은퇴식… ${tshort(tid)} 팬들 눈물`,`${T.n}시즌 동안 ${tshort(tid)}을(를) 지킨 ${p.name}이(가) 유니폼을 벗습니다.`,2); } }
/* ===== 선수단 리더십: 선수들이 투표로 주장을 뽑는다. 주장의 엄격함(기강)과 영향력이 선수단 분위기를 정한다 =====
   기강 지수 S(0~100) = 주장 엄격함 60% + 감독 규율 40% (+단장 요청 보정). 45~65가 알맞고,
   너무 느슨하면(40 미만) 집중력이 떨어지고 기행이 잦아지며, 너무 세면(70 초과) 경직된 플레이와 젊은 선수 불만이 생긴다 */
function leadOf(p){ initPers(p); if(!p.lead){ const pr=p.pers.pro, tp=p.pers.temp; p.lead={str:clamp(Math.round(pr*.55+tp*.35+N(0,2.5)),1,20),cha:clamp(Math.round(p.pers.loy*.3+(p.age-22)*.45+ovr(p)/8+N(0,2)),1,20)}; } return p.lead; }
const LEADSTY=s=>s>=15?'엄격한 원칙주의':s>=11?'단호한 편':s>=7?'부드러운 형님형':'자유방임형';
function electCaptain(tid,why){ const ps=domestic(tid).filter(p=>!p.ys&&healthy(p)&&!(p.joinY>G.year)&&p.age>=25); if(!ps.length)return null;
  const sc=p=>teamTenure(p,tid).n*2.5+ovr(p)*.35+leadOf(p).cha*1.2+((p.pers&&p.pers.loy)||10)*.4+hn('el'+G.year+(why||''),p.id)*4;
  const L=ps.map(p=>({p,v:Math.max(1,sc(p))})).sort((a,b)=>b.v-a.v).slice(0,3); const c=L[0].p; const t=team(tid); const old=t.cap; t.cap=c.id;
  if(tid===G.user&&!G.unemp){ const n=domestic(tid).filter(p=>!p.ys).length; const w=L.map(x=>Math.pow(x.v,4)); const tot=sum(w); const votes=w.map(x=>Math.round(n*x/tot)); const ld=leadOf(c);
    chron('cap',`선수단 투표로 ${c.name} 주장 선출`,c.id);
    mail('선수단','주장 선출 결과',`선수단 투표로 ${c.name}(${posLabel(c)}, ${c.age}세)이(가) 주장이 됐습니다${why?`(${why})`:''}.\n\n${L.map((x,i)=>`${x.p.name} ${votes[i]}표`).join(' · ')}\n\n리더십 성향: ${LEADSTY(ld.str)} · 선수단 영향력 ${ld.cha>=14?'큼':ld.cha>=9?'보통':'작음'}. ${old!=null&&old!==c.id&&G.players[old]&&G.players[old].team===tid?`전임 ${G.players[old].name}은(는) 주장에서 물러났습니다.`:''}\n\n주장은 선수들이 직접 뽑습니다. 기강이 지나치게 느슨하거나 세면 주장과 면담해 방향을 바꿔 달라고 요청할 수 있습니다.`,{kind:'선수',ref:c.id,face:c.id,acts:[{l:'선수단 리더십',a:'go',v:'train:lead'}]}); }
  return c; }
function climateOf(tid){ if(!G._cl||G._cl.d!==G.day)G._cl={d:G.day,v:{}}; const C=G._cl.v; if(C[tid])return C[tid];
  const t=team(tid); const c=t.cap!=null&&G.players[t.cap]&&G.players[t.cap].team===tid?G.players[t.cap]:null; const m=G.mgr[tid]; const md=m&&m.disc!=null?m.disc:45;
  const L=c?leadOf(c):{str:9,cha:6}; const adj=tid===G.user&&G.leadAdj&&G.leadAdj.until>G.day?G.leadAdj.v:0;
  const S=clamp(Math.round(L.str*5*.6+md*.4+adj),0,100); const w=clamp(L.cha/14,.35,1.3);
  const boost=(S>=45&&S<=65?.4:0)*w-(S<40?1.2*(40-S)/40:0)*w-(S>70?.8*(S-70)/30:0)*w;
  return C[tid]={S,w,boost,cap:c,band:S<40?'loose':S>70?'rigid':S>=45&&S<=65?'good':'ok'}; }
/* 주간: 느슨하면 기행, 너무 세면 젊은 선수 불만 */
function climateWeek(){ if(G.unemp||period()==='off')return; const cl=climateOf(G.user); const ps=domestic(G.user).filter(p=>!p.ys&&healthy(p)); if(!ps.length)return;
  if(cl.band==='rigid'){ for(const p of ps)if(p.age<=25||((p.pers&&p.pers.temp)||10)>=14)p.mor=clamp((p.mor??60)-.8,0,100); }
  if(cl.band==='good'){ for(const p of ps)if((p.mor??60)<70)p.mor=clamp((p.mor??60)+.4,0,100); }
  const ch=cl.band==='loose'?.05+.18*(40-cl.S)/40:cl.band==='ok'&&cl.S<45?.03:.01; if(R()>=ch)return;
  const cand=ps.filter(p=>((p.pers&&p.pers.pro)||10)<=11).sort(()=>R()-.5); const p=cand[0]||pick(ps); const kinds=[['늦은 귀가','원정 숙소 통금 시간을 넘겨 들어왔습니다'],['SNS 논란','개인 SNS에 올린 글이 팬들 사이에서 논란이 됐습니다'],['훈련 지각','팀 훈련에 늦게 나왔습니다'],['더그아웃 언쟁','경기 중 더그아웃에서 동료와 언성을 높였습니다']]; const [k,d]=pick(kinds);
  prInit(); G.pr.fan=clamp(G.pr.fan-(k==='SNS 논란'?3:1),0,100);
  const m=G.mgr[G.user]; const mr=m&&!m.interim?(m.disc>=65?`${m.name} 감독은 엄하게 다스려야 한다는 입장입니다.`:m.disc<40?`${m.name} 감독은 선수를 감싸고 싶어 합니다.`:`${m.name} 감독은 구단 판단에 따르겠다고 합니다.`):'';
  evNew('lead',`${p.name} ${k}`,`${p.name}(${posLabel(p)})이(가) ${d}. 선수단 기강이 느슨하다는 말이 나옵니다(기강 지수 ${cl.S}). ${mr} 구단 차원의 징계를 정해 주세요.`,[{l:'구단 징계: 출장 정지 5일',fx:'선수 기분이 크게 내려가고 그 기간 못 뜁니다. 선수단이 긴장합니다(기강 +6, 45일).'},{l:'구단 징계: 벌금',fx:'선수 기분이 내려가고 기강이 조금 잡힙니다(+3, 30일).'},{l:'선처하고 감독에게 맡기기',fx:'선수 기분은 지킵니다. 감독이 엄한 편이면 감독이 직접 다잡습니다.'}],{ref:p.id,data:{pid:p.id},from:'운영팀',def:1}); }
const EVH_LEAD={ pick(e,i){ const p=G.players[e.data.pid]; if(!p)return ''; const cur=G.leadAdj&&G.leadAdj.until>G.day?Math.max(0,G.leadAdj.v):0; G._cl=null;
    if(i===0){ p.mor=clamp((p.mor??60)-12,0,100); p.susp=G.day+5; G.leadAdj={v:Math.min(12,cur+6),until:G.day+45}; news('구단',`${tshort(G.user)}, ${p.name} 출장 정지 5일 징계`,`구단이 ${p.name}에게 자체 징계를 내렸습니다.`,0,{ref:p.id}); return `${p.name}에게 출장 정지 5일 징계를 내렸습니다. 선수단이 긴장했습니다(기강 +6, 45일).`; }
    if(i===1){ p.mor=clamp((p.mor??60)-6,0,100); G.leadAdj={v:Math.min(12,cur+3),until:G.day+30}; return `${p.name}에게 벌금을 물렸습니다(기강 +3, 30일).`; }
    p.mor=clamp((p.mor??60)+2,0,100); const m=G.mgr[G.user]; if(m&&!m.interim&&m.disc>=60){ G.leadAdj={v:Math.min(12,cur+3),until:G.day+30}; return `구단은 선처했고, ${m.name} 감독이 선수단 미팅을 열어 직접 다잡았습니다(기강 +3, 30일).`; } return `${p.name}을(를) 선처했습니다. 감독도 크게 문제 삼지 않았습니다.`; } };
/* 주장: 단장이 지정하지 않으면 감독이 정한다(한 팀에서 오래 뛴 성실한 주전) */
function autoCaptain(tid){ const ps=domestic(tid).filter(p=>!p.ys&&healthy(p)&&!(p.joinY>G.year)&&p.age>=26); if(!ps.length)return null; const sc=p=>teamTenure(p,tid).n*3+ovr(p)*.5+((p.pers&&p.pers.pro)||10)+((p.pers&&p.pers.loy)||10)*.5; return ps.sort((a,b)=>sc(b)-sc(a))[0]; }
function captainOf(tid){ const t=team(tid); const p=t.cap!=null?G.players[t.cap]:null; if(p&&p.team===tid)return p;
  if(t.cap!=null&&tid===G.user&&!G.unemp){ const was=G.players[t.cap]; if(was)news('구단',`${tshort(tid)} 주장 ${was.name} 떠나… 선수단 술렁`,'주장이 팀을 떠나 더그아웃 분위기가 가라앉았습니다.',-1); for(const q of playersOf(tid))q.mor=clamp((q.mor??60)-2,0,100); t.cap=null; } const a=electCaptain(tid,tid===G.user&&!G.unemp?'전임 주장 이탈':''); return a; }
function setCaptain(id){ const p=G.players[id]; if(!p||p.team!==G.user)return '우리 선수가 아닙니다.'; const t=team(G.user); const old=t.cap!=null?G.players[t.cap]:null; t.cap=id; initPers(p); p.mor=clamp(p.mor+6,0,100); if(old&&old.id!==id&&old.team===G.user)old.mor=clamp(old.mor-4,0,100);
  chron('cap',`${p.name} 주장 임명`,p.id); news('구단',`${tshort(G.user)} 새 주장에 ${p.name}`,`${p.name}이(가) 선수단을 이끌게 됐습니다.`,1,{ref:p.id}); return ''; }

function seasonAwards(y){ const rows=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(h)rows.push({p,h,w:warOf(h,p)}); }
  const qB=x=>!x.p.isP&&x.h.pa>=300, qP=x=>x.p.isP&&x.h.outs>=270;
  const A={y,gg:{}};
  const mv=rows.filter(x=>qB(x)||qP(x)).sort((a,b)=>b.w-a.w)[0]; if(mv){ A.mvp={id:mv.p.id,name:mv.p.name,t:mv.p.team,line:statLine(mv.h,mv.p)}; addAward(mv.p,`${y} MVP`); }
  const rk=rows.filter(x=>x.p.age<=26&&!x.p.foreign&&(x.h.pa>=150||x.h.outs>=150)&&!x.p.hist.some(h=>h.lvl==='1군'&&h.y<y&&((h.pa||0)>=60||(h.outs||0)>=90))).sort((a,b)=>b.w-a.w)[0];
  if(rk){ A.roy={id:rk.p.id,name:rk.p.name,t:rk.p.team,line:statLine(rk.h,rk.p)}; addAward(rk.p,`${y} 신인왕`); }
  for(const pos of ['C','1B','2B','3B','SS','DH']){ const c=rows.filter(x=>!x.p.isP&&x.h.pos===pos&&(x.h.g||0)>=72).sort((a,b)=>b.w-a.w)[0]; if(c){ A.gg[pos]={id:c.p.id,name:c.p.name,t:c.p.team,line:statLine(c.h,c.p)}; addAward(c.p,`${y} 골든글러브(${POSS[pos]})`); } }
  rows.filter(x=>!x.p.isP&&['LF','CF','RF'].includes(x.h.pos)&&(x.h.g||0)>=72).sort((a,b)=>b.w-a.w).slice(0,3).forEach((c,i)=>{ A.gg['OF'+i]={id:c.p.id,name:c.p.name,t:c.p.team,line:statLine(c.h,c.p)}; addAward(c.p,`${y} 골든글러브(외야수)`); });
  const pg=rows.filter(qP).sort((a,b)=>b.w-a.w)[0]; if(pg){ A.gg.P={id:pg.p.id,name:pg.p.name,t:pg.p.team,line:statLine(pg.h,pg.p)}; addAward(pg.p,`${y} 골든글러브(투수)`); }
  (G.awards=G.awards||{})[y]=A;
  const mine=[A.mvp,A.roy,...Object.values(A.gg)].filter(x=>x&&x.t===G.user);
  for(const x of mine){ const p=G.players[x.id]; if(p)p.mor=clamp((p.mor??60)+6,0,100); }
  if(A.mvp&&A.mvp.t===G.user)news('선수',`${A.mvp.name}, ${y} 정규시즌 MVP`,`${tname(G.user)}의 ${A.mvp.name}이(가) ${A.mvp.line}(으)로 MVP를 차지했습니다.`,3,{ref:A.mvp.id,fanW:2});
  if(A.roy&&A.roy.t===G.user)news('선수',`${A.roy.name}, ${y} 신인왕`,`${tname(G.user)} 육성의 결실입니다.`,2,{ref:A.roy.id});
  const gg=Object.values(A.gg).filter(x=>x.t===G.user); if(gg.length)news('선수',`${tshort(G.user)} 골든글러브 ${gg.length}명 배출`,`${gg.map(x=>x.name).join(', ')}이(가) 수상했습니다.`,gg.length>=3?2:1);
  mail('홍보팀',`${y} KBO 시상 결과`,`MVP: ${A.mvp?`${A.mvp.name}(${tshort(A.mvp.t)})`:'-'}\n신인왕: ${A.roy?`${A.roy.name}(${tshort(A.roy.t)})`:'-'}\n골든글러브: ${Object.entries(A.gg).map(([k,x])=>`${k.startsWith('OF')?'외야':k==='P'?'투수':POSS[k]} ${x.name}(${tshort(x.t)})`).join(', ')}\n\n우리 구단 수상: ${mine.length?mine.map(x=>x.name).join(', '):'없음'}`,{kind:'기록',acts:[{l:'역사·시상 보기',a:'go',v:'league:hist'}]});
  return A; }
function retireRecord(p){ const c=careerOf(p); const aw=p.aw||[];
  const rec={name:p.name,isP:p.isP,pos:p.isP?posLabel(p):POSK[p.pos],y:G.year,age:p.age,seasons:c.seasons.size,teams:[...c.teams],war:+c.war.toFixed(1),pa:c.pa,h:c.h,hr:c.hr,rbi:c.rbi,sb:c.sb,ip:Math.round(c.outs/3),w:c.w,sv:c.sv,so:c.so,aw:aw.slice(-12),mvp:aw.filter(a=>a.includes('MVP')).length,gg:aw.filter(a=>a.includes('골든')).length,no:jno(p),
    mine:c.byTeam[G.user]?{war:+c.byTeam[G.user].war.toFixed(1),ys:c.byTeam[G.user].ys.size}:null};
  { const miss=Math.max(0,(p.svc||0)-rec.seasons); if(miss){ const add=miss*clamp((p.pot-45)/5,0,4.5); rec.seasons+=miss; rec.war=+(rec.war+add).toFixed(1); rec.est=true;
      if(p.team===G.user&&c.teams.size<=1){ rec.mine=rec.mine||{war:0,ys:0}; rec.mine.war=+(rec.mine.war+add).toFixed(1); rec.mine.ys+=miss; } } } /* 게임 시작 전 경력은 연차와 잠재력으로 추정 */
  if(rec.war>=8||rec.aw.length){ (G.legends=G.legends||[]).push(rec); if(G.legends.length>300)G.legends.shift(); }
  const hof=rec.war>=38||rec.mvp>=2||rec.gg>=6||(rec.war>=30&&rec.mvp>=1);
  if(hof){ rec.hof=true; (G.hof=G.hof||[]).push(rec); mail('홍보팀',`${rec.name}, 명예의 전당 헌액`,`${rec.name}이(가) 은퇴와 함께 명예의 전당에 올랐습니다. 통산 ${rec.seasons}시즌 · WAR ${rec.war}${rec.isP?` · ${rec.w}승 ${rec.sv}세이브`:` · ${rec.h}안타 ${rec.hr}홈런`}${rec.mvp?` · MVP ${rec.mvp}회`:''}${rec.gg?` · 골든글러브 ${rec.gg}회`:''}.`,{kind:'기록'}); if(rec.mine&&rec.mine.ys>=5)news('선수',`${tshort(G.user)} 레전드 ${rec.name}, 명예의 전당으로`,`구단 역사에 남을 선수가 명예의 전당에 올랐습니다.`,2,{fanW:2}); }
  if(rec.mine&&rec.mine.ys>=(retWarT()>=60?10:8)&&rec.mine.war>=retWarT()){ rec.canRetNo=true; if(!G.ob){ mail('홍보팀',`${rec.name} 영구결번 검토`,`${rec.name}이(가) 우리 구단에서 ${rec.mine.ys}시즌 동안 WAR ${rec.mine.war}를 남기고 은퇴합니다. 등번호 ${rec.no}번을 영구결번으로 지정하면 팬들이 크게 반길 것입니다.`,{imp:true,kind:'기록',acts:[{l:`${rec.no}번 영구결번 지정`,a:'retNo',v:String(G.legends.length-1)}]}); }  }
  return rec; }
function jno(p){ let n=1+Math.floor(u01('jno',p.id)*99); if(p.team===G.user&&G.retNos&&G.retNos.length){ const used=new Set(G.retNos.map(r=>r.no)); let g=0; while(used.has(n)&&g++<99)n=n%99+1; } return n; }
function retireNumber(i){ const r=(G.legends||[])[+i]; if(!r||!r.canRetNo||r.retNo)return '대상이 아닙니다.'; r.retNo=true; (G.retNos=G.retNos||[]).push({name:r.name,no:r.no,y:G.year}); news('선수',`${tshort(G.user)}, ${r.name}의 ${r.no}번 영구결번`,`구단 역사에 길이 남을 이름이 됐습니다.`,3,{fanW:3}); return `${r.no}번을 영구결번으로 지정했습니다.`; }

/* ===== 예고 선발 · 순위 기록 · 트레이드 비교 · 모의 지명 · 스태프 의견 ===== */
function teamGames(tid,from,n){ const c=G.cal; const L=[]; if(!c||!c.sched)return L; for(let d=from;d<=c.end&&L.length<n;d++){ const gs=c.sched[d]; if(!gs)continue; const m=gs.find(x=>x.includes(tid)); if(m)L.push({d,home:m[0]===tid,op:m[0]===tid?m[1]:m[0]}); } return L; }
let _spC={k:null};
function projStarters(tid,n){ // 지금 로테이션 순번과 휴식일로 다음 경기 선발을 예상(부상·피로로 바뀔 수 있음)
  const k=G.day+':'+G.games.length+':'+G.year; if(_spC.k!==k)_spC={k}; const ck=tid+':'+n; if(_spC[ck])return _spC[ck];
  const t=team(tid); const sp=depth(tid).sp; const games=teamGames(tid,G.day+1,n); const last={}; sp.forEach(p=>last[p.id]=p.lastStart); let rot=t.rot||0; const out=[];
  for(const g of games){ let pick=null;
    if(sp.length){ for(let i0=0;i0<sp.length;i0++){ const i=(rot+i0)%sp.length; const p=sp[i]; if(last[p.id]==null||g.d-last[p.id]>=5){ rot=(i+1)%sp.length; pick=p; break; } }
      if(!pick)pick=[...sp].sort((a,b)=>(last[a.id]||0)-(last[b.id]||0))[0]; last[pick.id]=g.d; }
    out.push(Object.assign({},g,{sp:pick})); }
  _spC[ck]=out; return out; }
function rankSnap(day){ if(period()!=='season')return; const st=standingsNow(); const rk=G.teams.map(()=>0); st.forEach((o,i)=>rk[o.tid]=i+1);
  const S=G.sea; S.rh=S.rh||[]; if(S.rh.length&&S.rh[S.rh.length-1][0]===day)return; S.rh.push([day,rk,G.teams.map(t=>{ const r=S.rec[t.id]; return r.w-r.l; })]); }

const FIELDK=['C','1B','2B','3B','SS','LF','CF','RF'];
function canAt(p,k){ return !p.isP&&(p.pos===k||subsOf(p).includes(k)); }
function posStrength(list){ const ev=new Map(list.map(p=>[p.id,scoutReport(p).cur])); const out={};
  for(const k of FIELDK){ const c=list.filter(p=>canAt(p,k)&&ev.get(p.id)!=null&&healthy(p)).map(p=>ev.get(p.id)).sort((a,b)=>b-a); out[k]=c.length?c[0]:null; }
  const sp=list.filter(p=>p.isP&&isSPr(p)&&ev.get(p.id)!=null&&healthy(p)).map(p=>ev.get(p.id)).sort((a,b)=>b-a).slice(0,5);
  const rp=list.filter(p=>p.isP&&!isSPr(p)&&ev.get(p.id)!=null&&healthy(p)).map(p=>ev.get(p.id)).sort((a,b)=>b-a).slice(0,5);
  out.SP=sp.length?Math.round(avg(sp)):null; out.RP=rp.length?Math.round(avg(rp)):null; return out; }
function rosterList(tid){ return playersOf(tid).filter(p=>!(p.joinY>G.year)); }
function tradeCompare(tid,give,get){
  const mine=rosterList(G.user), theirs=rosterList(tid); const gv=give.map(id=>G.players[id]), gt=get.map(id=>G.players[id]);
  const myAfter=mine.filter(p=>!give.includes(p.id)).concat(gt), thAfter=theirs.filter(p=>!get.includes(p.id)).concat(gv);
  return {my:[posStrength(mine),posStrength(myAfter)],th:[posStrength(theirs),posStrength(thAfter)]}; }
/* 감독 반응: 우리 트레이드가 전력과 감독 성향에 맞는지 */
function mgrTradeView(tid,give,get){ const m=G.mgr[G.user]; if(!m||m.interim)return null; const c=tradeCompare(tid,give,get); const ks=FIELDK.concat(['SP','RP']);
  let d=0; for(const k of ks){ const b=c.my[0][k]??35, a=c.my[1][k]??35; d+=(a-b)*(k==='SP'?2:1); }
  const youngOut=give.map(id=>G.players[id]).filter(p=>p&&p.age<=24&&(scoutReport(p).ofp||0)>=58).length;
  const regOut=give.map(id=>G.players[id]).filter(p=>p&&isRegular(p)).length;
  let r=0; const why=[]; if(d>=6){ r+=3; why.push('전력이 좋아진다'); } else if(d<=-6){ r-=4; why.push('전력이 약해진다'); }
  if(regOut&&d<0){ r-=2*regOut; why.push(`주전 ${regOut}명을 내준다`); }
  if(youngOut&&m.youth>=62){ r-=3; why.push('키우던 유망주를 내준다'); }
  if(m.ego>=70&&r<0)r-=1;
  const P=G.mpick; const pk=P&&P.back&&P.y===G.year?give.map(id=>G.players[id]).filter(p=>p&&P.ids.includes(p.id)):[];
  if(pk.length){ r=Math.min(r-3,-2); why.unshift(`함께 밀어주기로 한 ${pk.map(p=>p.name).join('·')}을(를) 내준다(감독 관계 -6)`); }
  return {r,d,txt:r>=2?`${m.name} 감독: 환영합니다. ${why.join(', ')}고 봅니다.`:r<=-2?`${m.name} 감독: 반대합니다. ${why.join(', ')}고 봅니다.`:`${m.name} 감독: 특별히 반대하지 않습니다.`}; }
function mgrTradeApply(v){ const m=G.mgr[G.user]; if(!m||!v||!v.r)return; m.rel=clamp(m.rel+v.r,0,100); note('감독',`${v.txt} (감독 관계 ${v.r>0?'+':''}${v.r})`); }
function estVal(p){ const rp=scoutReport(p); const cur=rp.cur??45; const fut=rp.ofp??cur; const eff=p.age<=25?cur+Math.max(0,fut-cur)*.6:p.age>=32?cur-(p.age-31)*1.3:cur; return Math.pow(Math.max(0,eff-36),1.7)/10-(p.sal/100)*.35; }
function asstOpinion(tid,give,get){ // 우리 부단장 의견: 스카우트 평가 기준(실제 능력과 다를 수 있음)
  if(!give.length&&!get.length)return [];
  const gv=give.map(id=>G.players[id]), gt=get.map(id=>G.players[id]); const L=[];
  const U=team(G.user); const diff=stackIn(gt.map(p=>tval(U,p,'in')))-sum(gv.map(p=>tval(U,p,'out')));
  L.push(diff>=3?'우리 평가로는 우리에게 유리한 거래입니다.':diff>=-1?'우리 평가로는 대체로 공정한 거래입니다.':diff>=-5?'우리가 조금 더 내주는 거래입니다.':'우리가 많이 손해 보는 거래로 봅니다.');
  const c=tradeCompare(tid,give,get); const lab=k=>k==='SP'?'선발진':k==='RP'?'불펜':POSK[k];
  const keys=FIELDK.concat(['SP','RP']);
  const drop=keys.map(k=>({k,b:c.my[0][k],a:c.my[1][k]})).filter(x=>x.b!=null&&(x.a==null||x.a<=x.b-5)).sort((x,y)=>(x.a??0)-x.b-((y.a??0)-y.b))[0];
  const up=keys.map(k=>({k,b:c.my[0][k],a:c.my[1][k]})).filter(x=>x.a!=null&&(x.b==null||x.a>=x.b+5)).sort((x,y)=>(y.a-(y.b??0))-(x.a-(x.b??0)))[0];
  if(drop)L.push(`트레이드 후 ${lab(drop.k)} 자리가 약해집니다(${drop.b}→${drop.a??'없음'}).`);
  if(up)L.push(`${lab(up.k)} 자리가 좋아집니다(${up.b??'없음'}→${up.a}).`);
  const young=gv.find(p=>p.age<=23&&(scoutReport(p).ofp||0)>=60); if(young)L.push(`장래성이 큰 ${young.name}을(를) 내주는 것은 신중해야 합니다.`);
  const unk=gt.find(p=>scoutReport(p).cur==null); if(unk)L.push(`${unk.name}은(는) 우리 스카우트가 본 적이 없어 평가가 불확실합니다.`);
  return L.slice(0,3); }
function tradeHint(tid,give,get){ // 상대가 무엇을 더 원할지 짐작(관계가 나쁘면 못 읽음)
  if(!give.length&&!get.length)return null; const t=team(tid); const e=evalTrade(tid,give,get); const gap=e.need-e.gain; if(gap<=0)return null;
  if(t.rel<35)return {txt:'관계가 낮아 상대가 무엇을 원하는지 읽기 어렵습니다.'};
  const sd=1.2+Math.max(0,75-t.rel)/10;
  const add=domestic(G.user).filter(p=>!give.includes(p.id)&&!(p.joinY>G.year)).map(p=>({p,v:tval(t,p,'in')*.72+hn('th'+tid+G.year,p.id)*sd*.4})).filter(x=>x.v>=gap*.9).sort((a,b)=>a.v-b.v)[0];
  const drop=get.length>1||give.length?get.map(id=>({p:G.players[id],v:tval(t,G.players[id],'out')+hn('td'+tid+G.year,id)*sd*.4})).filter(x=>x.v>=gap*.9).sort((a,b)=>a.v-b.v)[0]:null;
  return {add:add?add.p:null,drop:drop?drop.p:null,big:gap>12}; }

function draftPickOrder(){ // 드래프트 전: 지금 순위의 역순 1라운드
  const st=period()==='season'||period()==='post'?standingsNow():(G.history.length?G.history[G.history.length-1].order:standingsNow()); return [...st].reverse().map((o,i)=>({tid:o.tid,rd:1,no:i+1})); }
function mockPick(tid,pool){ const t=team(tid); let best=null,bs=-1e9;
  for(const id of pool){ const p=G.players[id]; const rp=scoutReport(p); const sc=(rp.ofp??rp.cur+6)+hn('mk'+tid+G.year,id)*(t.scoutSd+3)+(rp.cur-35)*(t.mode==='contend'?.5:.25); if(sc>bs){bs=sc;best=id;} } return best; }
function mockDraft(n){ // 우리 다음 순번 전까지(드래프트 전에는 1라운드) 다른 구단 지명 예상
  const d=G.draft; const live=d&&!d.done; const pool=new Set((live?d.cls:G.draftClass||[]).filter(id=>G.players[id]&&G.players[id].prospect)); const out=[];
  if(live){ let i=d.cur+(d.picks[d.cur].tid===G.user?1:0); for(;i<d.picks.length&&out.length<(n||12);i++){ const pk=d.picks[i]; if(pk.tid===G.user)break; const id=mockPick(pk.tid,pool); if(id==null)break; pool.delete(id); out.push({pk,id}); } }
  else { for(const pk of draftPickOrder()){ const id=mockPick(pk.tid,pool); if(id==null)break; pool.delete(id); out.push({pk,id,mine:pk.tid===G.user}); } }
  return out; }

function staffNotes(p){ // 선수 카드 상단 스태프 의견
  const own=p.team===G.user&&!p.prospect; const rp=scoutReport(p); const L=[];
  L.push({w:'스카우트',t:(rp.role?`장래 ${rp.role}. `:'')+(rp.notes&&rp.notes[0]?rp.notes[0]:'')});
  { const sn=statNotes(p); if(sn[0])L.push({w:'전력분석',t:sn[0]}); }
  if(!own)return L.filter(x=>x.t);
  const l=p.l10||[]; if(l.length>=5){ if(p.isP){ const o=sum(l.map(x=>x[0])), er=sum(l.map(x=>x[1])); const era=o?er*27/o:0; L.push({w:'코치',t:era<=3?`최근 ${l.length}경기 평균자책점 ${era.toFixed(2)}로 공이 좋습니다.`:era>=6?`최근 ${l.length}경기 평균자책점 ${era.toFixed(2)}로 흔들리고 있습니다.`:`최근 ${l.length}경기 평균자책점 ${era.toFixed(2)}, 무난합니다.`}); }
    else { const ab=sum(l.map(x=>x[0])), hh=sum(l.map(x=>x[1])); const a=ab?hh/ab:0; L.push({w:'코치',t:a>=.33?`최근 ${l.length}경기 타율 ${fmt3(a)}로 감이 좋습니다.`:a<=.2?`최근 ${l.length}경기 타율 ${fmt3(a)}로 부진합니다.`:`최근 ${l.length}경기 타율 ${fmt3(a)}, 무난합니다.`}); } }
  if((p.fat||0)>=60)L.push({w:'트레이너',t:`피로가 ${Math.round(p.fat)}까지 쌓였습니다. 감독이 쉬게 할 가능성이 큽니다.`});
  else if(p.injOut>0)L.push({w:'의무팀',t:`부상으로 약 ${p.injOut}일 더 쉬어야 합니다.`});
  else if(p.injHist&&p.injHist.length>=3)L.push({w:'의무팀',t:`부상 이력이 ${p.injHist.length}번 있습니다. 관리가 필요합니다.`});
  if(!p.foreign){ const v=estVal(p); const left=p.faC?Math.max(1,p.yrs):null; L.push({w:'운영팀',t:(v>=4&&p.sal<5000?'연봉 대비 가치가 높습니다. ':v<0?'연봉 대비 활약이 부족하다는 평가입니다. ':'')+(left?`계약 ${left}년 남았습니다.`:Math.max(0,FA_SVC-p.svc)?`FA까지 ${Math.max(0,FA_SVC-p.svc)}년.`:'올해 FA 자격을 얻습니다.')}); }
  return L.filter(x=>x.t).slice(0,5); }

/* ===== 선수 이야기(커리어 연표) ===== */
function story(p,t,k){ if(!p)return; (p.story=p.story||[]).push({y:G.year,d:G.day,t,k:k||''}); if(p.story.length>60)p.story.splice(1,1); }
const MILE={hr:[100,200,300,400,500],h:[1000,1500,2000,2500],w:[100,150,200],sv:[100,200,300,400],so:[1000,1500,2000]};
const MILEK={hr:'홈런',h:'안타',w:'승',sv:'세이브',so:'탈삼진'};
function cumInit(p){ if(p.cum)return; const one=p.hist.filter(h=>h.lvl==='1군'); const c={h:0,hr:0,w:0,sv:0,so:0}; for(const h of one){ if(p.isP){ c.w+=h.w||0; c.sv+=h.sv||0; c.so+=h.so||0; } else { c.h+=h.h||0; c.hr+=h.hr||0; } } p.cum=c; p.fl=p.fl||{}; if(one.length)p.fl.deb=1; if(c.hr)p.fl.hr1=1; if(c.w)p.fl.w1=1; if(c.sv)p.fl.sv1=1; }
function storyGame(p,x,day,opp,dec){ // 1군 경기 하나가 끝난 뒤
  cumInit(p); const f=p.fl, c=p.cum; const vs=`${dmd(day)} vs ${tshort(opp)}`;
  if(!f.deb){ f.deb=1; story(p,`1군 데뷔 · ${vs}`,'debut'); }
  const add=(k,v)=>{ if(!v)return; const b=c[k]; c[k]+=v; for(const m of MILE[k]) if(b<m&&c[k]>=m){ story(p,`통산 ${m}${MILEK[k]} 달성 · ${vs}`,'mile'); try{ featAdd('mile',p,`통산 ${m}${MILEK[k]}`,{vs,maj:m>=({hr:400,h:2000,w:150,sv:300,so:2000})[k]}); }catch(e){} } };
  if(p.isP){ if(dec.w===p.id&&!f.w1){ f.w1=1; story(p,`1군 첫 승 · ${vs}`,'first'); } if(dec.sv===p.id&&!f.sv1){ f.sv1=1; story(p,`1군 첫 세이브 · ${vs}`,'first'); }
    add('w',dec.w===p.id?1:0); add('sv',dec.sv===p.id?1:0); add('so',x.so||0);
    if(x.outs>=27&&x.h===0)story(p,`노히트노런 · ${vs}`,'mile'); }
  else { if(x.hr&&!f.hr1){ f.hr1=1; story(p,`1군 첫 홈런 · ${vs}`,'first'); } if(x.hr>=3)story(p,`한 경기 ${x.hr}홈런 · ${vs}`,'mile'); if(x.h>=5&&(!f.h5||x.h>=6)){ f.h5=1; story(p,`한 경기 ${x.h}안타 · ${vs}`,'mile'); } add('h',x.h||0); add('hr',x.hr||0); try{ featBat(p,x,vs); }catch(e){} }
}
function storySeason(y){ // 시즌이 끝나면: 커리어 하이와 규정 이상 시즌
  for(const p of Object.values(G.players)){ if(p.team==null)continue; const h=seasonTotal(p,y,'1군'); if(!h)continue;
    const q=p.isP?h.outs>=300:h.pa>=300; if(!q)continue;
    const w=warOf(h,p); const prev=p.hist.filter(x=>x.lvl==='1군'&&x.y<y).map(x=>x.y); const best=[...new Set(prev)].map(yy=>warOf(seasonTotal(p,yy,'1군'),p));
    if(best.length&&w>Math.max(...best)+.3&&w>=2)story(p,`커리어 하이 시즌 · ${statLine(h,p)}`,'high'); } }

/* ===== 가을야구 확률(남은 일정 모의 진행) ===== */
let _poC={k:null};
function mulberry(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function playoffOdds(){
  if(period()!=='season')return null; const k=G.year+':'+G.day; if(_poC.k===k)return _poC.v;
  const rec=G.sea.rec; if(sum(G.teams.map(t=>rec[t.id].w+rec[t.id].l))/G.teams.length<20){ _poC={k,v:null}; return null; } /* 20경기 전에는 확률을 내지 않는다 */
  const str0=G.teams.map(t=>{ const r=rec[t.id]; return (r.w+(t.expW||.5)*60)/(r.w+r.l+60); });
  const rem=[]; for(const d in G.cal.sched){ if(+d>G.day)for(const m of G.cal.sched[d])rem.push(m); }
  const n=G.teams.length, N=400, top5=new Array(n).fill(0), first=new Array(n).fill(0), rnd=mulberry(G.day*7919+G.year);
  const w0=G.teams.map(t=>rec[t.id].w), l0=G.teams.map(t=>rec[t.id].l);
  for(let s=0;s<N;s++){ const w=w0.slice(), l=l0.slice(); const str=str0.map(x=>clamp(x+(rnd()+rnd()+rnd()-1.5)*.06,.25,.75)); /* 팀 실력 자체의 불확실성 */
    for(const [h,a] of rem){ const ph=str[h], pa=str[a]; const p=ph*(1-pa)/(ph*(1-pa)+pa*(1-ph))+.015; if(rnd()<p){w[h]++;l[a]++;} else {w[a]++;l[h]++;} }
    const ord=[...Array(n).keys()].sort((x,y)=>(w[y]/(w[y]+l[y]))-(w[x]/(w[x]+l[x]))||rnd()-.5);
    for(let i=0;i<5;i++)top5[ord[i]]++; first[ord[0]]++; }
  const v=G.teams.map(t=>({tid:t.id,ps:top5[t.id]/N,first:first[t.id]/N,str:str0[t.id]})); _poC={k,v}; return v; }

/* ===== 기록으로 보는 메모(능력치가 아니라 눈에 보이는 성적 기준) ===== */
const babipOf=h=>{ const d=(h.ab||0)-(h.so||0)-(h.hr||0); return d>0?(h.h-h.hr)/d:null; };
function amNotes(p){ const Y=p.amY; if(!Y||!Y.length)return []; const L=[];
  if(!p.isP){ const bk=Y.filter(x=>x.pa>=30).map(x=>x.so?x.bb/x.so:x.bb); const t=p.am; const tbk=t.so?t.bb/t.so:t.bb; const avg=t.ab?t.h/t.ab:0;
    if(bk.length>=2&&bk.every(v=>v>=.8))L.push(`학년마다 볼넷이 삼진만큼 많았습니다(볼삼비 ${tbk.toFixed(2)}). 선구안은 프로에 와서도 잘 변하지 않는 기록입니다.`);
    else if(bk.length>=2&&bk.every(v=>v<=.35))L.push(`학년마다 삼진이 볼넷의 3배 가까이 됩니다(볼삼비 ${tbk.toFixed(2)}). 프로 투수를 상대로 고전할 수 있습니다.`);
    if(avg>=.36&&tbk<.5)L.push('타율은 높지만 볼삼비가 낮아, 이 타율이 프로에서 유지될지는 의문입니다.');
    if(Y.length>=3){ const a=Y[Y.length-1], b=Y[Y.length-2]; const o=x=>bRate(x).ops; if(o(a)-o(b)>=.15)L.push('마지막 학년에 기록이 크게 뛰었습니다. 성장인지 한 해 반짝인지 지켜봐야 합니다.'); } }
  else { const t=p.am; const k9=t.outs?t.so*27/t.outs:0, b9=t.outs?t.bb*27/t.outs:0; const b9s=Y.filter(x=>x.outs>=45).map(x=>x.bb*27/x.outs); const era=t.outs?(t.er||0)*27/t.outs:0;
    if(b9s.length>=2&&b9s.every(v=>v<=3))L.push(`학년 내내 볼넷이 적었습니다(9이닝당 ${b9.toFixed(1)}개). 제구는 프로에서도 비슷하게 이어지는 편입니다.`);
    else if(b9s.length>=2&&b9s.every(v=>v>=5))L.push(`학년 내내 볼넷이 많았습니다(9이닝당 ${b9.toFixed(1)}개). 제구 불안이 꾸준합니다.`);
    if(k9>=10)L.push(`탈삼진이 9이닝당 ${k9.toFixed(1)}개로 많습니다. 구위가 통한다는 신호입니다.`);
    if(era<=2&&k9<6)L.push('평균자책점에 비해 탈삼진이 적습니다. 수비나 운의 도움을 받았을 수 있습니다.'); }
  return L.slice(0,2); }
function statNotes(p){ // 프로 기록에서 읽히는 신호
  const h=seasonTotal(p,G.year,'1군')||seasonTotal(p,G.year-1,'1군'); if(!h)return [];
  const L=[]; const yy=h.y===G.year?'올해':'지난해';
  if(!p.isP&&h.pa>=150){ const b=babipOf(h); const bk=h.so?h.bb/h.so:h.bb;
    if(b!=null&&b>=.37)L.push(`${yy} 인플레이 타구 타율(BABIP)이 ${fmt3(b)}로 높습니다. 운이 섞여 타율이 내려올 수 있습니다.`);
    else if(b!=null&&b<=.25)L.push(`${yy} BABIP ${fmt3(b)}로 운이 없었습니다. 타율은 반등할 여지가 있습니다.`);
    if(bk>=.9)L.push(`볼삼비 ${bk.toFixed(2)}. 선구안이 좋아 슬럼프가 길지 않은 유형입니다.`); else if(bk<=.3)L.push(`볼삼비 ${bk.toFixed(2)}. 삼진이 많아 기복이 클 수 있습니다.`); }
  if(p.isP&&h.outs>=120){ const k9=h.so*27/h.outs, b9=h.bb*27/h.outs, era=h.er*27/h.outs;
    if(era<=3.2&&k9-b9<4)L.push(`${yy} 평균자책점(${era.toFixed(2)})에 비해 탈삼진·볼넷 차이가 작습니다. 다음 시즌 평균자책점이 오를 수 있습니다.`);
    else if(era>=5&&k9-b9>=5)L.push(`${yy} 평균자책점(${era.toFixed(2)})은 나쁘지만 탈삼진·볼넷 내용은 좋습니다. 반등 후보입니다.`); }
  return L; }

/* ===== 코치진과 감독 사단 =====
 지도력(sk): 1군 경기력에 작게 영향. 육성력(dv): 맡은 선수들의 성장 속도.
 사단: 감독과 함께 다니는 코치 묶음. 같은 사단이면 손발이 맞아 실력이 더 나온다(+6). 고집 센 감독은 남의 코치와 덜 맞는다(-2). */
const CROLE={hc:{l:'수석코치',g:1,d:'감독 보좌 · 선수단 분위기'},pc:{l:'투수코치',g:1,d:'투수 경기력·성장'},bc:{l:'타격코치',g:1,d:'타자 경기력·성장'},cc:{l:'배터리코치',g:1,d:'포수 수비·투수 제구'},rc:{l:'주루·작전코치',g:1,d:'도루·주루'},dc:{l:'수비코치',g:1,d:'내외야 수비'},
  fm:{l:'2군 감독',g:2,d:'퓨처스 선수 전체 성장'},fp:{l:'2군 투수코치',g:2,d:'퓨처스 투수 성장'},fb:{l:'2군 타격코치',g:2,d:'퓨처스 타자 성장'}};
const CKEYS=Object.keys(CROLE);
const CCAR=['프랜차이즈 스타 출신','국가대표 코치 경력','미국 마이너리그 연수','일본 코치 연수','전력분석원 출신','2군에서 오래 지도','우승 코치진 출신','무명 선수 출신 지도자'];
function mkCoach(role,o){ o=o||{}; const sk=clamp(Math.round(N(55,9)+(o.boost||0)),30,88), dv=clamp(Math.round(N(CROLE[role].g===2?57:53,10)+(o.boost||0)*.6),30,88);
  return {id:'c'+Math.floor(R()*1e9),name:genName(),age:ri(36,63),role,sk,dv,car:pick(CCAR),sal:round5(clamp(60+(Math.max(sk,dv)-50)*4.5+N(0,12),45,320)),yrs:0,clan:o.clan||null}; }
function mkClan(m){ // 이름난 감독은 사단을 거느린다
  const n=m.fame>=80?5:m.fame>=70?4:m.fame>=55?2:0; if(!n)return [];
  const roles=['hc',...['pc','bc','cc','rc','dc','fm'].sort(()=>R()-.5)].slice(0,n);
  return roles.map(r=>mkCoach(r,{clan:m.id,boost:3})); }
function coachesOf(tid){ return (G.coach&&G.coach[tid])||{}; }
function effC(c,tid,k){ if(!c)return 45; const m=G.mgr[tid]; let v=c[k||'sk']; if(m&&c.clan&&c.clan===m.id)v+=6; else if(m&&(m.ego||0)>=70)v-=2; return v; }
function clanCount(tid){ const m=G.mgr[tid]; if(!m)return 0; return Object.values(coachesOf(tid)).filter(c=>c&&c.clan===m.id).length; }
function coachInit(){ G.coach=G.coach||{}; G.cmarket=G.cmarket||[];
  for(const t of G.teams){ if(G.coach[t.id])continue; const C={}; const m=G.mgr[t.id]; const clan=m&&t.id!==G.user?(m.clan||(m.clan=mkClan(m))):[];
    for(const k of CKEYS){ const cl=clan.find(c=>c.role===k); C[k]=cl||mkCoach(k); C[k].yrs=ri(1,3); }
    if(t.id===G.user){ for(const k of CKEYS)if(R()<.35)C[k]=null; }
    G.coach[t.id]=C; }
  for(const k in G.mgr){ const m=G.mgr[k]; if(m&&!m.interim&&!m.clan)m.clan=mkClan(m); }
  (G.mmarket||[]).forEach(m=>{ if(!m.clan)m.clan=mkClan(m); });
  if(!G.cmarket.length)refreshCoachMarket(); }
/* 코치 후보: 자리마다 4~5명. 스타 코치(드묾·비쌈), 베테랑, 보통, 젊은 지도자(싸지만 낮음)가 섞인다 */
function mkCandCoach(k){ const x=R(); const c=x<.1?mkCoach(k,{boost:ri(9,15)}):x<.32?mkCoach(k,{boost:ri(3,7)}):x<.78?mkCoach(k):mkCoach(k,{boost:-ri(2,6)});
  if(x>=.78){ c.age=ri(33,41); c.car=pick(['은퇴 2년 차 젊은 지도자','전력분석원 출신','2군 코치 경력 3년','해외 코치 연수 막 마침']); c.sal=round5(Math.max(40,c.sal*.7)); }
  if(x<.1){ c.car=pick(['우승 코치진 출신','국가대표 코치 경력','레전드 선수 출신','타 구단 수석코치 출신']); c.star=true; } return c; }
function refreshCoachMarket(){ const L=[]; for(const k of CKEYS){ const n=ri(6,8); for(let i=0;i<n;i++)L.push(mkCandCoach(k)); } const res=(G.cmarket||[]).filter(c=>c.res===G.user);
  let obc=[]; try{ obc=G.ob?obCands('coach').filter(o=>!res.some(c=>c.ob===o.id)).map(obCoach):[]; }catch(e){} G.cmarket=[...res,...obc,...L]; }
/* 매달 초: 새 후보가 들어오고 오래된 후보 일부는 다른 일을 찾아 떠난다 */
function coachMarketMonth(){ const o=dobj(G.day); const mk=o.y*100+o.m; if(G.cmMonth===mk)return; G.cmMonth=mk; G.cmarket=G.cmarket||[];
  const leave=G.cmarket.filter(()=>R()<.12).map(c=>c.id); G.cmarket=G.cmarket.filter(c=>!leave.includes(c.id)); const n=ri(3,5); for(let i=0;i<n;i++)G.cmarket.push(mkCandCoach(pick(CKEYS)));
  if(G.cmarket.length>90)G.cmarket=G.cmarket.slice(-90); }
function coachSal(tid){ return sum(Object.values(coachesOf(tid)).filter(Boolean).map(c=>c.sal)); }
/* 경기력: 타석 결과에 더하는 보정(보통 ±1 안팎) */
function coachBoost(p){ const C=coachesOf(p.team); if(!C)return 0; const tid=p.team; const z=(c,k)=>(effC(c,tid,k)-55)/25;
  let b=z(C.hc)*.15; if(p.isP)b+=z(C.pc)*.45+z(C.cc)*.15; else b+=z(C.bc)*.45; return b; }
function coachDevMult(p){ // 성장 배율: 1군에서 많이 뛴 선수는 1군 코치, 아니면 2군 코치진
  if(p.team==null)return 1; const C=coachesOf(p.team); const tid=p.team; const one=playShare(p)>=.5;
  const v=one?(p.isP?effC(C.pc,tid,'dv')*.65+effC(C.cc,tid,'dv')*.1:effC(C.bc,tid,'dv')*.75)+effC(C.hc,tid,'dv')*.25:(p.isP?effC(C.fp,tid,'dv'):effC(C.fb,tid,'dv'))*.6+effC(C.fm,tid,'dv')*.4;
  return clamp(1+(v-55)/110,.7,1.35)*(G.mentor&&G.mentor.y===G.year&&p.team===G.user&&p.age<=24?1.05:1); }
function hireCoach(id,years){ const c=(G.cmarket||[]).find(x=>x.id===id); if(!c)return '후보가 없습니다.'; const C=G.coach[G.user]; const old=C[c.role];
  if(old){ const pay=Math.round(old.sal*Math.max(0,old.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; addLog(`${CROLE[c.role].l} ${old.name}와(과) 결별했습니다(잔여 연봉 정산 ${money(pay)}).`); old.yrs=0; old.clan=null; G.cmarket.push(old); }
  c.yrs=years; C[c.role]=c; G.cmarket=G.cmarket.filter(x=>x.id!==id); obHireBonus(c.ob,CROLE[c.role].l); addLog(`${CROLE[c.role].l}로 ${c.name}을(를) ${years}년 연 ${money(c.sal)}에 영입했습니다.`); return ''; }
function fireCoach(role){ const C=G.coach[G.user]; const c=C[role]; if(!c)return; const pay=Math.round(c.sal*Math.max(0,c.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; C[role]=null; c.yrs=0; c.clan=null; G.cmarket.push(c); addLog(`${CROLE[role].l} ${c.name}을(를) 내보냈습니다(잔여 연봉 정산 ${money(pay)}).`); }
function clanSev(m){ const C=G.coach&&G.coach[G.user]; if(!C)return 0; return sum((m.clan||[]).map(c=>{ const o=C[c.role]; return o?Math.round(o.sal*Math.max(0,o.yrs-.5)*.5):0; })); }
function hireClan(m,years){ // 감독과 함께 사단 코치를 데려온다
  const C=G.coach[G.user]; const got=[];
  for(const c of (m.clan||[])){ const old=C[c.role]; if(old){ const pay=Math.round(old.sal*Math.max(0,old.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; old.yrs=0; old.clan=null; G.cmarket.push(old); } c.yrs=years; C[c.role]=c; got.push(`${CROLE[c.role].l} ${c.name}`); }
  if(got.length)addLog(`${m.name} 감독 사단 합류: ${got.join(', ')}`); return got; }
function clanLeave(m){ // 감독이 떠나면 사단 코치 상당수가 함께 떠난다
  if(!m||!m.id)return []; const C=G.coach[G.user]; const out=[]; for(const k of CKEYS){ const c=C[k]; if(c&&c.clan===m.id&&R()<.7){ C[k]=null; out.push(`${CROLE[k].l} ${c.name}`); } } return out; }
function coachYear(){ // 겨울: 계약 정리
  for(const t of G.teams){ const C=G.coach[t.id]; if(!C)continue; for(const k of CKEYS){ const c=C[k]; if(!c)continue; c.age++; c.yrs--; if(c.yrs<=0){ if(t.id===G.user){ C[k]=null; c.from=G.user; c.fromY=G.year; G.cmarket.push(c); } else if(R()<.55)c.yrs=ri(1,2); else { if(c.age<62&&!c.ob){ c.yrs=0; c.clan=null; c.from=t.id; c.fromY=G.year; G.cmarket.push(c); } C[k]=obAiCoach(t.id,k)||mkCoach(k); if(!C[k].yrs)C[k].yrs=ri(1,3); } } } }
  const kept=(G.cmarket||[]).filter(c=>c.fromY===G.year); refreshCoachMarket(); G.cmarket=G.cmarket.concat(kept.filter(c=>c.age<64)); const C=G.coach[G.user]; const empty=CKEYS.filter(k=>!C[k]); if(empty.length)mail('운영팀','코치 자리가 비어 있습니다',`계약이 끝나거나 떠나서 ${empty.map(k=>CROLE[k].l).join(', ')} 자리가 비었습니다. 스태프·육성 → 코치진에서 채워 주세요.`,{imp:true,kind:'감독',acts:[{l:'코치진 보기',a:'go',v:'staff:coach'}]}); }
function coachGrade(tid){ const C=coachesOf(tid); const g=(ks,k)=>{ const v=avg(ks.map(r=>effC(C[r],tid,k))); return {v:Math.round(v),l:v>=66?'A':v>=59?'B':v>=52?'C':'D'}; };
  return {bat:g(['bc','hc'],'sk'),pit:g(['pc','cc'],'sk'),run:g(['rc'],'sk'),def:g(['dc','cc'],'sk'),dev1:g(['pc','bc','hc'],'dv'),dev2:g(['fm','fp','fb'],'dv')}; }

/* ===== 단장 결정 사건 =====
 시즌 중 1~2주에 한 번, 단장이 직접 정해야 하는 일이 생긴다. 선택지마다 대가가 있고, 일부는 몇 주 뒤 결과가 돌아온다.
 기한 안에 정하지 않으면 기본 선택으로 처리된다. */
function evInit(){ G.evs=G.evs||[]; G.evf=G.evf||[]; G.evlog=G.evlog||[]; }
function evOpen(){ evInit(); return G.evs.filter(e=>!e.done); }
/* 핵심 결정: 나타나면 진행을 멈추고, 기한 하루 전에 한 번 더 멈춘다. 나머지 일상 결정은 알림 뒤 기한이 지나면 기본안으로 처리하고 결과를 보고한다 */
const EV_KEY=new Set(['scandal','reinf','clash','agent','fx','dline','fovs','post','mreq','mpick','inj']);
const EV_NAME={lead:'기강 문제',pt:'출전 기회 면담',call:'콜업 여론',press:'연패 기자회견',vet:'베테랑 제안',fan:'팬 행사',slump:'부진 선수 면담',ret:'은퇴 행사'};
function evNew(k,title,sit,opts,o){ evInit(); o=o||{};
  const e={id:'e'+(G.evSeq=(G.evSeq||0)+1),k,day:G.day,exp:G.day+(o.exp||5),title,sit,opts:opts.map(x=>({l:x.l,fx:x.fx})),def:o.def??opts.length-1,data:o.data||{},ref:o.ref??null,from:o.from||'운영팀',done:false};
  G.evs.push(e); if(G.evs.length>40)G.evs.splice(0,G.evs.length-40); { const rid=e.ref!=null?e.ref:(e.data&&e.data.pid); if(rid!=null){ G.evRecent=G.evRecent||{}; G.evRecent[k+':'+rid]=G.day; G.evRecent['p:'+rid]=G.day; } }
  const lines=opts.map((x,i)=>`${i+1}. ${x.l}: ${x.fx}`).join('\n');
  const m=mail(e.from,title,`${sit}\n\n${lines}\n\n${dmd(e.exp)}까지 정하지 않으면 "${opts[e.def].l}"(으)로 처리됩니다.`,{imp:true,kind:'결정',ref:e.ref,face:o.face??null,acts:opts.map((x,i)=>({l:x.l,a:'evPick',v:e.id+':'+i}))});
  e.mid=m.id; if(!EV_KEY.has(k)&&G.deleg&&G.deleg[k]){ e.deleg=true; evPick(e.id,e.def,true); } return e; }
function evPick(id,i,auto){ const e=(G.evs||[]).find(x=>x.id===id); if(!e||e.done)return '이미 정한 일입니다.'; e.done=true; e.pick=i;
  let r=''; try{ r=(EVH[e.k]&&EVH[e.k].pick(e,i))||''; }catch(err){ r=''; }
  e.res=r; const m=G.mail.find(x=>x.id===e.mid); if(m){ m.acts=[]; m.read=true; m.imp=false; m.body+=`\n\n[결정] ${e.opts[i].l}${e.deleg?' (비서가 맡은 일)':auto?' (기한이 지나 자동 처리)':''}${r?`\n${r}`:''}`; }
  if(auto&&!G.unemp){ (G.autoLog=G.autoLog||[]).unshift({d:G.day,t:e.title,c:e.opts[i].l,r:r||'',k:e.k}); if(G.autoLog.length>20)G.autoLog.length=20; } /* 자동 처리 결과는 따로 메일을 보내지 않고 주간 요약에 한 줄로 모은다 */
  G.stops=(G.stops||[]).filter(x=>x.id!==e.mid);
  G.evlog.unshift({d:G.day,y:G.year,t:e.title,c:e.opts[i].l,r,k:e.k,id:e.id,auto:!!auto}); if(G.evlog.length>80)G.evlog.length=80;
  return r; }
function evFollow(days,k,data){ evInit(); G.evf.push({day:G.day+days,k,data}); }
function evResult(evId,txt){ const L=(G.evlog||[]).find(x=>x.id===evId); if(L)L.f=txt; }
function evDaily(){ if(!G.evs)return;
  for(const e of G.evs)if(!e.done&&G.day>=e.exp)evPick(e.id,e.def,true);
  const due=(G.evf||[]).filter(f=>f.day<=G.day); if(due.length){ G.evf=G.evf.filter(f=>f.day>G.day); for(const f of due){ try{ EVH[f.k]&&EVH[f.k].follow&&EVH[f.k].follow(f.data); }catch(err){} } } }
function aiScandalWeek(){ if(period()!=='season'||R()>.025)return; const t=pick(G.teams.filter(x=>x.id!==G.user)); const L=playersOf(t.id).filter(p=>!(p.susp>G.day)); if(!L.length)return; const p=pick(L); const ty=wpick({gamble:.3,drink:.35,sns:.35}); const S=SCAND[ty];
  if(S.kbo)p.susp=G.day+gDays(S.kbo+(R()<.5?S.club:0)); story(p,`${S.t}로 징계`,'inj'); wire('징계',`${tshort(t.id)} ${p.name}, ${S.t}로 ${S.kbo?`출장정지 ${S.kbo}경기`:'제재금'} 징계`,{tid:t.id,ref:p.id}); }
function evWeek(){ try{ aiScandalWeek(); }catch(err){} if(period()!=='season'||G.gameOver||!G.mgr[G.user])return; evInit(); if(evOpen().length)return; if(R()>.8)return;
  const recent=new Set(G.evlog.filter(x=>x.d>G.day-35&&x.y===G.year).map(x=>x.k));
  /* 같은 선수에게 같은 종류 일이 90일 안에 또 생기지 않게, 어떤 선수든 개인 일상 사건은 45일에 한 번 */
  const RC=G.evRecent||{}; const pidOf=d=>d&&(d.r&&d.name&&d.id!=null?d.id:d.p&&d.p.id!=null?d.p.id:d.a&&d.a.id!=null?d.a.id:null);
  const cands=[]; for(const k in EVH){ const h=EVH[k]; if(recent.has(k)||!h.check)continue; let d=null; try{ d=h.check(); }catch(err){} if(!d)continue; const pid=pidOf(d); if(pid!=null&&((RC[k+':'+pid]||-999)>G.day-90||(!EV_KEY.has(k)&&(RC['p:'+pid]||-999)>G.day-45)))continue; cands.push([k,d,h.w||1]); }
  if(!cands.length)return; let x=R()*sum(cands.map(c=>c[2])); for(const c of cands){ x-=c[2]; if(x<=0){ EVH[c[0]].make(c[1]); return; } } }
const evP=id=>G.players[id];
const evLine=p=>{ const h=curLine(p); return h?statLine(h,p):'기록 없음'; };
function evSince(day){ return playersOf(G.user).filter(p=>(p.story||[]).some(s=>s.k==='move'&&s.y===G.year&&s.d>=day&&/이적|입단/.test(s.t))); }
const SCAND={gamble:{t:'해외 원정 도박',kbo:30,club:20,sp:400,fan:9,press:12,d:'시즌 전 해외 전지훈련 기간에 원정 도박을 한 사실이 보도됐습니다.'},
  drink:{t:'음주 소란',kbo:10,club:10,sp:150,fan:6,press:8,d:'원정 숙소 근처 술집에서 시비 끝에 소란을 피워 경찰이 출동했습니다.'},
  sns:{t:'SNS 막말',kbo:0,club:5,sp:50,fan:5,press:5,d:'개인 SNS에 팬을 비하하는 글을 올렸다가 지웠지만 캡처가 퍼졌습니다.'}};
const gDays=g=>Math.round(g*1.15);
const EVH={
  /* 선수 물의: KBO 징계는 자동, 구단 자체 징계는 단장이 정한다 */
  scandal:{ w:.5, check(){ if(R()>.3)return null; if((G.evlog||[]).some(x=>x.k==='scandal'&&x.y===G.year))return null;
      const L=playersOf(G.user).filter(p=>!(p.susp>G.day)&&!(p.joinY>G.year)); if(!L.length)return null; L.forEach(initPers);
      const w=L.map(p=>(p.pers.pro<8?3:1)*(p.pers.temp>=14?2:1)); let x=R()*sum(w), pk=L[0]; for(let i=0;i<L.length;i++){ x-=w[i]; if(x<=0){ pk=L[i]; break; } }
      return {p:pk,ty:wpick({gamble:.3,drink:.35,sns:.35})}; },
    make(d){ const p=d.p, S=SCAND[d.ty]; prInit(); G.pr.fan=clamp(G.pr.fan-S.fan,0,100); G.pr.press=clamp(G.pr.press-S.press,0,100); G.spend=G.spend||{}; G.spend.etc=(G.spend.etc||0)+S.sp;
      if(S.kbo)p.susp=G.day+gDays(S.kbo); story(p,`${S.t}로 KBO 징계${S.kbo?` (출장정지 ${S.kbo}경기)`:' (제재금)'}`,'inj'); news('구단',`${tshort(G.user)} ${p.name}, ${S.t} 파문`,`${S.d} KBO 상벌위원회는 ${S.kbo?`출장정지 ${S.kbo}경기와 `:''}제재금을 부과했습니다. 후원사 일부가 광고를 중단해 약 ${money(S.sp)}의 손실이 예상됩니다.`,-3,{ref:p.id});
      evNew('scandal',`${p.name} ${S.t}: 구단 징계를 정해 주세요`,`${p.name}(${posLabel(p)}, ${p.age}세) ${S.d}\nKBO 징계: ${S.kbo?`출장정지 ${S.kbo}경기 + 제재금`:'제재금'}\n후원 손실 약 ${money(S.sp)}, 팬 여론 -${S.fan}, 언론 논조 -${S.press}가 이미 반영됐습니다. 구단 자체 징계 수위에 따라 여론과 후원사 반응이 달라집니다.`,
        [{l:'KBO 징계만 따르기',fx:'선수 기분은 지키지만 "봐주기" 비판으로 팬 여론과 언론 논조가 더 떨어집니다.'},
         {l:`자체 징계 추가 (벌금·출장정지 ${S.club}경기)`,fx:'여론은 조금 더 떨어지고 선수 기분이 내려갑니다. 무난한 선택입니다.'},
         {l:'시즌 아웃 (무기한 출장정지)',fx:'올 시즌 더 쓸 수 없습니다. 여론이 회복되고, 후원사 일부가 돌아올 수 있습니다.'},
         {l:'방출',fx:'남은 연봉은 그대로 주고 팀을 떠납니다. 여론은 가장 빨리 회복됩니다.'}],{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id,ty:d.ty},def:1,exp:4}); },
    pick(e,i){ const p=evP(e.data.pid); const S=SCAND[e.data.ty]; if(!p||p.team!==G.user)return '이미 팀을 떠난 선수입니다.'; initPers(p); const base=Math.max(G.day,p.susp||0);
      if(i===0){ G.pr.fan=clamp(G.pr.fan-4,0,100); G.pr.press=clamp(G.pr.press-6,0,100); p.mor=clamp((p.mor??60)+4,0,100); evFollow(21,'scandal',{pid:p.id,ty:e.data.ty,c:0}); return '팬 여론 -4, 언론 논조 -6. 선수는 구단에 고마워합니다.'; }
      if(i===1){ p.susp=base+gDays(S.club); G.pr.fan=clamp(G.pr.fan-1,0,100); p.mor=clamp((p.mor??60)-8,0,100); evFollow(21,'scandal',{pid:p.id,ty:e.data.ty,c:1}); return `${p.name} 출장정지가 ${S.club}경기 늘었습니다. 선수 기분 -8.`; }
      if(i===2){ p.susp=Math.max(base,G.cal?G.cal.end+1:base+120); G.pr.fan=clamp(G.pr.fan+3,0,100); G.pr.press=clamp(G.pr.press+4,0,100); p.mor=clamp((p.mor??60)-20,0,100); evFollow(21,'scandal',{pid:p.id,ty:e.data.ty,c:2}); return `${p.name}은(는) 올 시즌 뛸 수 없습니다. 팬 여론 +3, 언론 논조 +4.`; }
      const nm=p.name; if(p.foreign)releaseForeign(p.id); else releasePlayer(p.id); G.pr.fan=clamp(G.pr.fan+4,0,100); G.pr.press=clamp(G.pr.press+5,0,100); evFollow(21,'scandal',{pid:null,ty:e.data.ty,c:3,nm}); return `${nm}을(를) 방출했습니다. 팬 여론 +4, 언론 논조 +5.`; },
    follow(d){ const S=SCAND[d.ty]; if(d.c>=2){ const back=Math.round(S.sp*.5); G.spend.etc=Math.max(0,(G.spend.etc||0)-back); mail('마케팅팀','후원사 일부 복귀',`강한 자체 징계 뒤 광고를 중단했던 후원사 일부가 돌아왔습니다. 손실 ${money(back)}을(를) 만회했습니다.`,{kind:'재정'}); }
      else if(d.c===0){ G.pr.fan=clamp(G.pr.fan-2,0,100); mail('마케팅팀','징계 논란이 이어집니다',`"구단이 감싼다"는 비판이 계속되고 있습니다. 팬 여론이 조금 더 떨어졌습니다.`,{kind:'재정'}); } } },
  /* 출전 시간 불만 */
  pt:{ w:1.2, check(){ const reg=new Set((()=>{ const d=depth(G.user); return [...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id); })());
      const regs=playersOf(G.user).filter(p=>reg.has(p.id)); const bar=regs.length?avg(regs.map(ovr))-4:50;
      const L=playersOf(G.user).filter(p=>{ initPers(p); return healthy(p)&&!reg.has(p.id)&&!p.ys&&(ovr(p)>=bar||p.sal>=400||(p.age>=27&&ovr(p)>=bar-3))&&p.mor<66&&!p.promise&&!p.listed&&p.age>=22&&!(p.ptDay>G.day-60); }).sort((a,b)=>ovr(b)-ovr(a)); return L[0]||null; },
    make(p){ p.ptDay=G.day; evNew('pt',`${p.name}, 출전 시간 불만`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) 면담을 요청했습니다. "${moraleWhy(p)}"\n올해 기록: ${evLine(p)}`,
      [{l:'감독에게 기용 건의',fx:'선수 기분이 오르고 감독 관계는 조금 내려갑니다. 한 달 안에 기회를 못 얻으면 선수가 크게 실망합니다.'},
       {l:'트레이드 명단에 올리기',fx:tradeOpen()?'선수 기분이 오르고, 다른 구단 제안이 올 수 있습니다.':'선수 기분이 오릅니다. 트레이드는 포스트시즌 뒤에 다시 열립니다.'},
       {l:'기다리라고 설득',fx:'구단 충성심이 높은 선수는 받아들이고, 아니면 기분이 더 나빠집니다.'}],{ref:p.id,face:p.id,from:p.name,data:{pid:p.id},def:2}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '이미 팀을 떠난 선수입니다.'; const m=G.mgr[G.user];
      if(i===0){ p.promise={until:G.day+30}; p.mor=clamp(p.mor+8,0,100); const d=m&&m.ego>=70?5:3; if(m)m.rel=clamp(m.rel-d,0,100); return `${p.name} 기분 +8, 감독 관계 -${d}. 한 달 뒤 기회를 얻었는지 알려 드립니다.`; }
      if(i===1){ listPlayer(p.id); return `${p.name}을(를) 트레이드 명단에 올렸습니다.`; }
      const ok=p.pers.loy>=11||R()<.35; p.mor=clamp(p.mor+(ok?6:-7),0,100); return ok?`${p.name}: "단장님 말씀을 믿고 기다리겠습니다." (기분 +6)`:`${p.name}: "말씀은 알겠지만 납득은 안 됩니다." (기분 -7)`; } },
  /* 퓨처스 유망주 콜업 여론 */
  call:{ w:1.1, check(){ if(!entryOn())return null;
      const L=playersOf(G.user).filter(p=>!p.e1&&!p.ys&&healthy(p)&&canUp(p)).map(p=>{ const h=seasonTotal(p,G.year,'퓨처스'); if(!h)return null;
        if(p.isP){ if(h.outs<75)return null; const era=h.er*27/h.outs; return era<=3.2?{p,h,s:3.2-era}:null; }
        if(h.pa<50)return null; const ops=bRate(h).ops; return ops>=.84?{p,h,s:ops-.84}:null; }).filter(Boolean).sort((a,b)=>b.s-a.s); return L[0]||null; },
    make(x){ const p=x.p; evNew('call',`${p.name} 콜업 여론`,`퓨처스에서 ${p.name}(${posLabel(p)}, ${p.age}세)이(가) ${statLine(x.h,p)}로 활약 중입니다. 팬 커뮤니티에서 1군에 올리라는 목소리가 커지고 있습니다.`,
      [{l:'감독에게 콜업 요청',fx:'감독이 받아들이면 바로 1군에 등록됩니다. 거절하면 감독 관계가 조금 내려갑니다. 한 달 뒤 1군 성적을 보고합니다.'},
       {l:'퓨처스에서 더 키운다',fx:'팬 여론이 조금 내려갑니다. 야망이 큰 선수는 실망합니다.'}],{ref:p.id,face:p.id,from:'스카우트팀장',data:{pid:p.id},def:1}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '이미 팀을 떠난 선수입니다.';
      if(i===0){ const r=reqEntry(p.id,true); if(p.e1){ G.pr.fan=clamp(G.pr.fan+2,0,100); const h=seasonTotal(p,G.year,'1군'); evFollow(30,'call',{pid:p.id,ev:e.id,pa:h?h.pa:0,outs:h?h.outs:0}); } return r; }
      G.pr.fan=clamp(G.pr.fan-2,0,100); initPers(p); if(p.pers.amb>=13){ p.mor=clamp(p.mor-6,0,100); return `팬 여론 -2. ${p.name}은(는) 실망한 기색입니다(기분 -6).`; } return '팬 여론 -2. 선수는 묵묵히 준비하겠다고 합니다.'; },
    follow(d){ const p=evP(d.pid); if(!p||p.team!==G.user)return; const h=seasonTotal(p,G.year,'1군');
      const t=h?`${p.name} 콜업 한 달: 1군 ${statLine(h,p)}${p.e1?'':' · 지금은 퓨처스로 내려가 있습니다'}`:`${p.name} 콜업 한 달: 1군 기회를 거의 얻지 못했습니다.`; evResult(d.ev,t); note('엔트리',t,p.id); } },
  /* 감독의 보강 요청 */
  reinf:{ w:1, check(){ const m=G.mgr[G.user]; if(!m||G.day>KD(7,24))return null;
      const all=G.teams.map(t=>({t:t.id,d:depth(t.id)})); const rk=f=>{ const vs=all.map(x=>({t:x.t,v:f(x.d)})).sort((a,b)=>b.v-a.v); return vs.findIndex(x=>x.t===G.user)+1; };
      const L=[['선발진',rk(d=>avg(d.sp.slice(0,5).map(spV)))],['불펜',rk(d=>avg(d.pen.slice(0,5).map(penV)))],['타선',rk(d=>avg(d.start.map(offV)))]].sort((a,b)=>b[1]-a[1]);
      return L[0][1]>=8?{area:L[0][0],rank:L[0][1]}:null; },
    make(x){ const m=G.mgr[G.user]; evNew('reinf',`감독의 ${x.area} 보강 요청`,`${m.name} 감독: "우리 ${x.area}이(가) 리그 ${x.rank}위입니다. 이대로는 버티기 어렵습니다. 보강을 부탁드립니다."`,
      [{l:'30일 안에 보강 약속',fx:'감독 관계가 오릅니다. 30일 안에 트레이드·외국인 교체 등으로 선수를 데려오지 못하면 크게 떨어집니다.'},
       {l:'지금 전력으로 버티자',fx:'감독 관계가 내려갑니다.'}],{from:'감독실',data:{area:x.area},def:1}); },
    pick(e,i){ const m=G.mgr[G.user]; if(!m)return ''; if(i===0){ m.rel=clamp(m.rel+4,0,100); evFollow(30,'reinf',{ev:e.id,day:G.day,area:e.data.area,mid:m.id}); return '감독 관계 +4. 30일 안에 선수를 데려와야 합니다.'; }
      m.rel=clamp(m.rel-5,0,100); return '감독 관계 -5. 감독은 아쉬운 표정입니다.'; },
    follow(d){ const m=G.mgr[G.user]; if(!m||m.id!==d.mid)return; const got=evSince(d.day);
      if(got.length){ m.rel=clamp(m.rel+6,0,100); if(!G.form||G.day>G.form.until)G.form={until:G.day+14,b:.6}; const t=`${m.name} 감독: "약속을 지켜 주셨습니다. ${got.slice(0,2).map(p=>p.name).join(', ')} 합류로 선수단 분위기가 살아났습니다." (감독 관계 +6, 2주간 팀 분위기 상승)`; evResult(d.ev,t); note('감독',t); }
      else { m.rel=clamp(m.rel-10,0,100); const t=`${m.name} 감독: "보강 약속은 어떻게 된 겁니까?" 30일이 지났지만 데려온 선수가 없습니다. (감독 관계 -10)`; evResult(d.ev,t); stop('감독',t); } } },
  /* 더그아웃 충돌 */
  clash:{ w:.8, check(){ if(R()>.4)return null; const ps=playersOf(G.user).filter(p=>{ initPers(p); return healthy(p)&&p.pers.temp>=15&&p.mor<70&&isRegular(p); }); if(!ps.length)return null;
      const a=ps[Math.floor(R()*ps.length)]; const others=playersOf(G.user).filter(p=>p.id!==a.id&&healthy(p)&&isRegular(p)); if(!others.length)return null; return {a,b:others[Math.floor(R()*others.length)]}; },
    make(x){ evNew('clash',`더그아웃 충돌: ${x.a.name}`,`${x.a.name}이(가) ${x.b.name}와(과) 더그아웃에서 언성을 높였습니다. 기사로 나가기 전에 정리해야 합니다.`,
      [{l:'경고로 끝낸다',fx:'조용히 넘어갑니다. 언론에 새어 나갈 수 있습니다.'},
       {l:'출장 정지 5일',fx:`${x.a.name}은(는) 5일간 못 뛰고 기분이 크게 떨어집니다. 기강이 서서 2주간 팀 분위기가 오릅니다.`},
       {l:'트레이드 명단에 올리기',fx:tradeOpen()?'갈등을 정리합니다. 다른 구단이 싸게 보려 할 수 있습니다.':'갈등을 정리합니다. 트레이드는 포스트시즌 뒤에 다시 열립니다.'}],{ref:x.a.id,face:x.a.id,from:'수석코치',data:{a:x.a.id,b:x.b.id},def:0}); },
    pick(e,i){ const a=evP(e.data.a); if(!a||a.team!==G.user)return '';
      if(i===0){ a.mor=clamp(a.mor-3,0,100); if(R()<.4){ news('선수',`${tshort(G.user)} 더그아웃 불화설`,`${a.name}이(가) 동료와 충돌했다는 이야기가 흘러나왔습니다. 구단은 "별일 아니다"라고 밝혔습니다.`,-2,{ref:a.id}); return '경고로 마무리했지만 이야기가 언론에 새어 나갔습니다(언론 논조 하락).'; } return '조용히 마무리했습니다.'; }
      if(i===1){ a.susp=G.day+5; a.mor=clamp(a.mor-12,0,100); G.form={until:G.day+14,b:.5}; for(const p of playersOf(G.user))if(p.id!==a.id&&p.pers&&p.pers.pro>=13)p.mor=clamp(p.mor+2,0,100); return `${a.name} 5일 출장 정지(기분 -12). 2주간 팀 분위기 상승.`; }
      listPlayer(a.id); return `${a.name}을(를) 트레이드 명단에 올렸습니다.`; } },
  /* 연패 기자회견 */
  press:{ w:1.3, check(){ const L=(G.sea.tl&&G.sea.tl[G.user])||[]; if(L.length<6)return null; const last=L.slice(-5); return last.every(x=>x[0]<0)?{n:(()=>{ let n=0; for(let i=L.length-1;i>=0&&L[i][0]<0;i--)n++; return n; })()}:null; },
    make(x){ const r=G.sea.rec[G.user]; evNew('press',`${x.n}연패, 기자회견`,`${x.n}연패로 시즌 ${r.w}승 ${r.l}패가 됐습니다. 기자들이 단장의 입장을 묻고 있습니다.`,
      [{l:'감독 신임 표명',fx:'감독 관계가 크게 오릅니다. 그래도 계속 지면 언론이 단장 책임론을 꺼냅니다.'},
       {l:'선수단 분발 촉구',fx:'프로의식이 높은 선수는 2주간 분발하고, 나머지는 기분이 내려갑니다.'},
       {l:'말을 아낀다',fx:'언론 논조가 조금 내려갑니다.'}],{from:'홍보팀',data:{n:x.n},def:2,exp:3}); },
    pick(e,i){ const m=G.mgr[G.user]; const r=G.sea.rec[G.user]; const base={w:r.w,l:r.l,ev:e.id,i};
      if(i===0){ if(m)m.rel=clamp(m.rel+8,0,100); news('언론',`단장 "${m?m.name:'감독'} 감독 믿는다"`,`연패 속에서도 단장은 감독에게 힘을 실어 줬습니다.`,1); evFollow(10,'press',base); return '감독 관계 +8. 10일 뒤 성적에 따라 여론이 갈립니다.'; }
      if(i===1){ let up=0,dn=0; for(const p of playersOf(G.user)){ initPers(p); if(p.pers.pro>=13){ p.form={until:G.day+14,b:.8}; up++; } else { p.mor=clamp(p.mor-5,0,100); dn++; } } evFollow(10,'press',base); return `${up}명은 분발(2주), ${dn}명은 기분 -5.`; }
      G.pr.press=clamp(G.pr.press-3,0,100); return '언론 논조 -3.'; },
    follow(d){ const r=G.sea.rec[G.user]; const w=r.w-d.w, l=r.l-d.l; const good=w>l;
      let t=`기자회견 뒤 10일: ${w}승 ${l}패.`; if(d.i===0&&!good){ news('언론',`연패 탈출 실패… 단장 책임론`,`단장이 감독을 공개적으로 신임했지만 반등은 없었습니다.`,-2); t+=' 반등이 없어 단장 책임론 기사가 나왔습니다.'; } else if(good)t+=' 분위기 반전에 성공했습니다.';
      evResult(d.ev,t); note('언론',t); } },
  /* 베테랑 멘토 */
  vet:{ w:.6, check(){ if((G.mentor&&G.mentor.y===G.year)||G.vetAsk===G.year)return null; const L=playersOf(G.user).filter(p=>{ initPers(p); return p.age>=33&&p.pers.pro>=13&&!p.foreign; }).sort((a,b)=>b.age-a.age); return L[0]||null; },
    make(p){ G.vetAsk=G.year; evNew('vet',`${p.name}의 제안`,`베테랑 ${p.name}(${p.age}세)이(가) 젊은 선수들을 따로 챙기고 싶다고 합니다. 코치진도 반기는 분위기입니다.`,
      [{l:'멘토 역할 맡기기 (수당 5천만)',fx:'올 시즌 24세 이하 선수 성장이 조금 빨라지고, 본인 기분이 오릅니다.'},
       {l:'선수로 집중해 달라',fx:'변화가 없습니다. 본인은 조금 서운해합니다.'}],{ref:p.id,face:p.id,from:p.name,data:{pid:p.id},def:1}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '';
      if(i===0){ G.mentor={id:p.id,y:G.year}; G.spend.etc=(G.spend.etc||0)+50; p.mor=clamp(p.mor+8,0,100); return `${p.name} 멘토 지정. 올 시즌 24세 이하 성장 +5%. 수당 5천만.`; }
      p.mor=clamp(p.mor-3,0,100); return `${p.name} 기분 -3.`; } },
  /* 마케팅 행사 */
  fan:{ w:.6, check(){ const n=(G.evlog||[]).filter(x=>x.k==='fan'&&x.y===G.year).length; return n<2&&G.pr.fan<56&&!team(G.user).indie?{fan:Math.round(G.pr.fan)}:null; },
    make(x){ evNew('fan','팬 행사 제안',`마케팅팀이 팬 행사를 제안했습니다. 현재 팬 여론은 ${x.fan}입니다.`,
      [{l:'팬 사인회·할인 주간 (2억)',fx:'팬 여론이 크게 오르고 구단 인기도 조금 오릅니다.'},
       {l:'유니폼 증정 경기 (8천만)',fx:'팬 여론이 조금 오릅니다.'},
       {l:'하지 않는다',fx:'변화가 없습니다.'}],{from:'마케팅팀',def:2}); },
    pick(e,i){ const t=team(G.user);
      if(i===0){ G.spend.etc=(G.spend.etc||0)+200; G.pr.fan=clamp(G.pr.fan+8,0,100); t.pop=clamp(t.pop+.01,0,1.5); return '2억 지출. 팬 여론 +8, 구단 인기 소폭 상승.'; }
      if(i===1){ G.spend.etc=(G.spend.etc||0)+80; G.pr.fan=clamp(G.pr.fan+3,0,100); return '8천만 지출. 팬 여론 +3.'; } return ''; } },
  /* FA 앞둔 주축의 다년계약 요구 */
  agent:{ w:.8, check(){ const top=playersOf(G.user).map(ovr).sort((a,b)=>b-a); const bar=top[11]||50; const L=playersOf(G.user).filter(p=>!p.foreign&&!p.faC&&!p.extNext&&p.svc===FA_SVC-1&&ovr(p)>=bar&&!p.agentY); return L.sort((a,b)=>ovr(b)-ovr(a))[0]||null; },
    make(p){ p.agentY=G.year; evNew('agent',`${p.name} 측, 다년계약 요구`,`올 시즌 뒤 FA가 되는 ${p.name}(${posLabel(p)}, ${p.age}세)의 에이전트가 시즌 중 다년계약 협상을 원합니다.\n올해 기록: ${evLine(p)}`,
      [{l:'협상 테이블 열기',fx:'선수 관리 화면에서 조건을 제시합니다. 협상이 틀어지면 기분이 내려갈 수 있습니다.'},
       {l:'시즌 끝나고 이야기하자',fx:'선수 기분이 조금 내려가고, FA 시장에 나갈 가능성이 커집니다.'}],{ref:p.id,face:p.id,from:'에이전트',data:{pid:p.id},def:1}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p)return ''; if(i===0)return '선수 정보의 관리 탭에서 다년계약 조건을 제시하세요.'; p.mor=clamp(p.mor-5,0,100); return `${p.name} 기분 -5.`; } },
  /* 주전 슬럼프 */
  slump:{ w:1.1, check(){ const d=depth(G.user); const L=d.start.filter(p=>(p.l10||[]).length>=8).map(p=>{ const L=p.l10; const ab=sum(L.map(x=>x[0])),h=sum(L.map(x=>x[1])),bb=sum(L.map(x=>x[3])),xb=sum(L.map(x=>x[5]||0)); if(ab<25)return null; const ops=(h+bb)/(ab+bb)+(h+xb)/ab; return ops<.5?{p,ops,avg:h/ab}:null; }).filter(Boolean).sort((a,b)=>a.ops-b.ops); return L[0]||null; },
    make(x){ const p=x.p; evNew('slump',`${p.name}, 깊은 슬럼프`,`주전 ${p.name}(${posLabel(p)})이(가) 최근 10경기 타율 ${fmt3(x.avg)}, OPS ${fmt3(x.ops)}에 그치고 있습니다. 전력분석팀은 타격 밸런스가 무너졌다고 봅니다.\n시즌 기록: ${evLine(p)}`,
      [{l:'퓨처스에서 조정 (말소 요청)',fx:'감독이 받아들이면 10일 이상 2군에서 조정합니다. 돌아오면 2주간 컨디션이 좋아집니다. 본인 기분은 내려갑니다.'},
       {l:'면담으로 다잡기',fx:'프로의식이 높은 선수는 2주간 분발합니다. 아니면 기분만 내려갑니다.'},
       {l:'믿고 기다린다',fx:'변화가 없습니다. 선수 기분이 조금 오릅니다.'}],{ref:p.id,face:p.id,from:'전력분석팀',data:{pid:p.id},def:2}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '';
      if(i===0){ const r=reqEntry(p.id,false); if(!p.e1){ p.mor=clamp(p.mor-6,0,100); p.form={until:G.day+24,b:.9}; evFollow(25,'slump',{pid:p.id,ev:e.id}); } return r; }
      if(i===1){ initPers(p); if(p.pers.pro>=12){ p.form={until:G.day+14,b:.9}; p.mor=clamp(p.mor+2,0,100); evFollow(15,'slump',{pid:p.id,ev:e.id}); return `${p.name}: "다시 준비하겠습니다." (2주간 분발)`; } p.mor=clamp(p.mor-6,0,100); return `${p.name}: "저도 답답합니다." (기분 -6)`; }
      p.mor=clamp(p.mor+3,0,100); return `${p.name} 기분 +3.`; },
    follow(d){ const p=evP(d.pid); if(!p)return; const L=p.l10||[]; const ab=sum(L.map(x=>x[0])),h=sum(L.map(x=>x[1])); const t=ab?`${p.name} 조정 이후 최근 10경기 타율 ${fmt3(h/ab)}.`:`${p.name}은(는) 아직 1군 경기에 나오지 않았습니다.`; evResult(d.ev,t); note('경기',t,p.id); } },
  /* 외국인 선수 부진 */
  fx:{ w:1, check(){ if(G.day>KD(8,15))return null; const L=foreignOf(G.user).filter(p=>!p.fxAsk).map(p=>{ const h=seasonTotal(p,G.year,'1군'); if(!h)return null;
        if(p.isP){ if(h.outs<120)return null; const era=h.er*27/h.outs; return era>=5.4?{p,h,s:era}:null; } if(h.pa<120)return null; const ops=bRate(h).ops; return ops<.7?{p,h,s:1-ops}:null; }).filter(Boolean).sort((a,b)=>b.s-a.s); return L[0]||null; },
    make(x){ const p=x.p; p.fxAsk=G.year; evNew('fx',`외국인 ${p.name} 부진`,`${p.name}이(가) ${statLine(x.h,p)}에 머물고 있습니다. 교체 여론이 나옵니다. 교체 기한은 8월 15일입니다.`,
      [{l:'교체 후보 보기',fx:'외국인 시장으로 이동합니다. 교체하면 남은 연봉을 정산합니다.'},
       {l:'한 달 더 지켜본다',fx:'한 달 뒤 성적을 다시 보고합니다. 그사이 교체 기한이 지날 수 있습니다.'}],{ref:p.id,face:p.id,from:'전력분석팀',data:{pid:p.id},def:1}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p)return ''; if(i===0)return '외국인 시장에서 교체 후보를 확인하세요.'; const h=seasonTotal(p,G.year,'1군'); evFollow(30,'fx',{pid:p.id,ev:e.id}); return '한 달 뒤 다시 보고합니다.'; },
    follow(d){ const p=evP(d.pid); if(!p||p.team!==G.user)return; const h=seasonTotal(p,G.year,'1군'); const t=`${p.name} 한 달 뒤: ${h?statLine(h,p):'기록 없음'}.`; evResult(d.ev,t); note('경기',t,p.id); } },
  /* 부상 조기 복귀 (부상 순간에 발생) */
  inj:{ pick(e,i){ const p=evP(e.data.pid); if(!p)return ''; if(i===0&&p.injOut>0){ const before=p.injOut; p.injOut=Math.max(2,Math.round(p.injOut*.6)); p.rush=G.day+p.injOut+30; evFollow(p.injOut+30,'inj',{pid:p.id,n:p.injHist.length,ev:e.id}); return `복귀 예정 ${before}일 → ${p.injOut}일. 복귀 후 한 달은 부상 위험 3배.`; } return '예정대로 재활합니다.'; },
    follow(d){ const p=evP(d.pid); if(!p)return; const t=p.injHist.length>d.n?`${p.name} 조기 복귀 뒤 다시 다쳤습니다.`:`${p.name} 조기 복귀 뒤 한 달 동안 탈 없이 뛰었습니다.`; evResult(d.ev,t); note('복귀',t,p.id); } }
};
function evInjury(p,days){ if(p.team!==G.user||period()!=='season'||days<12||days>70||evOpen().some(e=>e.k==='inj'))return; if(!isRegular(p))return;
  evNew('inj',`${p.name} 복귀 시점`,`${p.name}이(가) 부상으로 약 ${days}일 빠집니다. 의무팀은 무리하면 일찍 돌아올 수 있다고 합니다.`,
    [{l:'조기 복귀 (재활 약 40% 단축)',fx:'빨리 돌아오지만, 복귀 후 한 달 동안 부상 위험이 3배입니다.'},
     {l:'정상 재활',fx:'예정대로 복귀합니다.'}],{ref:p.id,face:p.id,from:'팀 닥터 · 의무팀',data:{pid:p.id},def:1,exp:2}); }

/* ===== 전력 슬롯 비교와 추천 트레이드 ===== */
const PSLOTS=['C','1B','2B','3B','SS','LF','CF','RF','DH','SP','RP'];
const SLOTK={C:'포수','1B':'1루수','2B':'2루수','3B':'3루수',SS:'유격수',LF:'좌익수',CF:'중견수',RF:'우익수',DH:'지명타자',SP:'선발진',RP:'불펜',P:'투수'};
function slotOf(tid){ const d=depth(tid); const o={}; for(const k of PSLOTS.slice(0,9)){ const p=d.ln[k]; o[k]={ps:p?[p]:[],v:p?posScore(p,k):30}; }
  const sp=d.sp.slice(0,5), rp=d.pen.slice(0,4); o.SP={ps:sp,v:sp.length?avg(sp.map(spV))*(Math.min(5,sp.length)/5):30}; o.RP={ps:rp,v:rp.length?avg(rp.map(penV)):30}; return o; }
let _slC={k:null};
function leagueSlots(){ const k=G.year+':'+G.day+':'+(G.trades||[]).length+':'+Object.values(G.players).filter(p=>p.team===G.user).length; if(_slC.k===k)return _slC.v; const v=G.teams.map(t=>slotOf(t.id)); _slC={k,v}; return v; }
/* 트레이드 마감 주간: 사는 구단(상위권의 약한 자리)과 파는 구단(하위권의 베테랑) 루머 */
function deadlineRumors(quiet){ const st=standingsNow(); const buyers=st.slice(0,5).map(x=>x.tid).filter(t=>t!==G.user); const sellers=st.slice(6).map(x=>x.tid).filter(t=>t!==G.user);
  const L=[]; for(const t of buyers.slice(0,3)){ const rk=slotRanks(t); const weak=PSLOTS.filter(k=>k!=='DH').sort((a,b)=>rk[b].rank-rk[a].rank)[0]; if(weak&&rk[weak].rank>=6)L.push(`${tshort(t)}(${st.findIndex(x=>x.tid===t)+1}위)은(는) ${SLOTK[weak]} 보강을 노립니다`); }
  for(const t of sellers.slice(0,3)){ const v=domestic(t).filter(p=>p.age>=29&&ovr(p)>=54&&!p.ys).sort((a,b)=>ovr(b)-ovr(a))[0]; if(v){ v.aiListed=true; L.push(`${tshort(t)}은(는) ${v.name}(${posLabel(v)}, ${v.age}세)을(를) 시장에 내놓을 수 있습니다`); } }
  if(!L.length)return; news('트레이드',`트레이드 마감 앞두고 시장 꿈틀`,L.join('. ')+'.',0); if(!quiet)note('트레이드',`마감 주간 시장 소식: ${L.join('. ')}. 트레이드 → 파인더에서 해당 구단을 살펴보세요.`); }
/* 마감 2주 전: 단장이 올해 방향(보강·유지·정리)을 정한다. 순위와 남은 경기로 부단장이 상황을 정리해 준다 */
function deadlineDecision(){ if(G.dline&&G.dline.y===G.year)return; const st=standingsNow(); const rk=st.findIndex(x=>x.tid===G.user)+1; const r=G.sea.rec[G.user]; const gb5=(()=>{ const f=st[4]; return ((f.w-f.l)-(r.w-r.l))/2; })();
  const vets=domestic(G.user).filter(p=>p.age>=30&&ctrlYears(p)<=1&&ovr(p)>=52&&!p.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,3);
  const sit=`${r.w}승 ${r.l}패로 ${rk}위입니다. ${rk<=5?`가을야구 안쪽입니다(6위와 ${(((r.w-r.l)-(st[5].w-st[5].l))/2).toFixed(1)}경기 차).`:`5위와 ${gb5.toFixed(1)}경기 차입니다.`} 7월 31일 트레이드 마감 전에 올해 방향을 정해 주세요. ${vets.length?`계약이 올해로 끝나는 베테랑: ${vets.map(p=>`${p.name}(${posLabel(p)}, ${p.age}세)`).join(', ')}.`:''}`;
  evNew('dline',`트레이드 마감 방향: ${rk}위`,sit,[
    {l:'보강한다',fx:'부단장이 약한 자리 보강안을 바로 올립니다. 팬 여론 +2. 성적 우선 구단주는 반기지만, 유망주를 내줄 각오가 필요합니다.'},
    {l:'지금 전력으로 간다',fx:'변화 없이 시즌을 이어갑니다.'},
    {l:'정리한다',fx:`올해 계약이 끝나는 베테랑을 급매로 블록에 올립니다. 팬 여론 -3. 수익 우선 구단주는 반깁니다.`}],{from:'부단장',data:{rk,vets:vets.map(p=>p.id)},def:1,exp:7}); }
EVH.lead=EVH_LEAD;
EVH.dline={ pick(e,i){ const t=team(G.user); G.dline={y:G.year,mode:['buy','hold','sell'][i]};
  if(i===0){ G.pr.fan=clamp(G.pr.fan+2,0,100); if(t.owner==='win')t.trust=clamp(t.trust+2,0,100); let L=[]; try{ L=tradeSuggest(true).slice(0,3); }catch(err){}
    if(L.length)mail('부단장','마감 보강안',`보강 방향으로 정리했습니다. 상대가 받아들일 만한 조건입니다.\n\n${L.map(x=>{ const q=G.players[x.id]; return q?`${SLOTK[x.k]||''} 보강: ${q.name}(${tshort(x.tid)}, ${posLabel(q)}) 영입 · 내줄 선수 ${x.give.map(id=>G.players[id]?G.players[id].name:'').join(', ')}`:''; }).filter(Boolean).join('\n')}\n\n홈의 단장 데스크나 트레이드 센터에서 바로 제안할 수 있습니다.`,{kind:'트레이드',imp:true,acts:[{l:'트레이드 센터',a:'go',v:'trade:market'}]});
    return `팬 여론 +2.${t.owner==='win'?' 구단주 신뢰 +2.':''} 부단장이 보강안을 올렸습니다.`; }
  if(i===1)return '현재 전력으로 시즌을 이어갑니다.';
  const ids=(e.data.vets||[]).filter(id=>G.players[id]&&G.players[id].team===G.user); for(const id of ids){ const p=G.players[id]; p.listed=true; p.urgent=true; }
  G.pr.fan=clamp(G.pr.fan-3,0,100); if(t.owner==='profit')t.trust=clamp(t.trust+2,0,100);
  return `${ids.length?ids.map(id=>G.players[id].name).join(', ')+'을(를) 급매로 블록에 올렸습니다. ':''}팬 여론 -3.${t.owner==='profit'?' 구단주 신뢰 +2.':''}`; } };
function slotRanks(tid){ const L=leagueSlots(); const out={}; for(const k of PSLOTS){ const vs=L.map((s,i)=>({i,v:s[k].v})).sort((a,b)=>b.v-a.v); out[k]={rank:vs.findIndex(x=>x.i===tid)+1,v:L[tid][k].v,ps:L[tid][k].ps}; } return out; }
function rankWith(k,v){ return leagueSlots().filter((s,i)=>i!==G.user&&s[k].v>v).length+1; }
function myCoreIds(){ const d=depth(G.user); return new Set([...d.start,...d.sp.slice(0,3),...d.pen.slice(0,1)].map(p=>p.id)); }
function buildPackage(t,p,core){ const v=tval(t,p,'out'); const need=tradeNeed(t,v)-(p.aiListed?1.5:0); const target=v+need+.3;
  const pool=domestic(G.user).filter(q=>!q.ys&&!core.has(q.id)&&healthy(q)&&!(q.joinY>G.year)).map(q=>({q,v:tval(t,q,'in')})).filter(x=>x.v>.2).sort((a,b)=>a.v-b.v);
  let best=null,bo=1e9; for(let i=0;i<pool.length;i++){ if(pool[i].v>=target&&pool[i].v-target<bo){ bo=pool[i].v-target; best=[pool[i].q.id]; } for(let j=i+1;j<pool.length;j++){ const sm=Math.max(pool[i].v,pool[j].v)+.72*Math.min(pool[i].v,pool[j].v); if(sm>=target&&sm-target<bo-.6){ bo=sm-target+.6; best=[pool[i].q.id,pool[j].q.id]; } } }
  if(!best)return null; const e=evalTrade(t.id,best,[p.id]); if(!e.ok||e.theirN>ROSTER_MAX||e.theirN<ROSTER_MIN)return null; if(e.theirPay>capOf(G.year)&&e.theirPay>capPay(t.id))return null;
  if(rosterN(G.user)-best.length+1>ROSTER_MAX)return null; return best; }
function tsugValid(s){ const p=G.players[s.id]; if(!(p&&p.team===s.tid&&s.give.every(id=>G.players[id]&&G.players[id].team===G.user)))return false; return evalTrade(s.tid,s.give,[s.id]).ok; }
/* 조건부 영입 요청: 자리·유형·나이·연봉 조건으로 스카우트가 후보를 추린다. 능력 순이 아니라 조건과 팀 사정으로 설명한다 */
const RTYPE={now:'즉시 전력',cheap:'저비용',grow:'성장형'};
function recruitReport(c){ const k=c.k; const rk=slotRanks(G.user)[k]; const d=depth(G.user); const core=myCoreIds();
  const base=k==='SP'?(d.sp.slice(0,5).length<5?30:Math.min(...d.sp.slice(0,5).map(spV))):k==='RP'?(d.pen.slice(0,4).length<4?30:Math.min(...d.pen.slice(0,4).map(penV))):rk.v;
  const fits=p=>k==='SP'?p.isP&&isSPr(p):k==='RP'?p.isP:!p.isP&&(p.pos===k||subsOf(p).includes(k));
  const C=[]; for(const t of G.teams){ if(t.id===G.user)continue; for(const p of domestic(t.id)){ if(p.ys||(p.joinY>G.year)||!fits(p))continue; if(c.age&&p.age>c.age)continue; if(c.sal&&p.sal>c.sal)continue;
      const now=slotGain(k,p)-base; const rp=scoutReport(p); const fut=(rp.ofp??rp.cur)-(rk.v||40);
      let sc=c.type==='now'?now:c.type==='cheap'?now-p.sal/150:(p.age<=25?fut*1.2+(25-p.age)*.6:-99);
      if(c.type!=='grow'&&now<1)continue; if(c.type==='grow'&&(p.age>25||fut<2))continue; C.push({p,t,now,fut,rp,sc}); } }
  C.sort((a,b)=>b.sc-a.sc); const out=[]; const open=tradeOpen();
  for(const x of C.slice(0,30)){ if(out.length>=3)break; const give=open?buildPackage(x.t,x.p,core):null; if(open&&!give)continue;
    const why=[]; const r1=k==='SP'||k==='RP'?null:rankWith(k,slotGain(k,x.p));
    if(c.type==='now')why.push(`지금 우리 ${SLOTK[k]}보다 ${Math.round(x.now)}만큼 낫습니다${r1?`(리그 ${rk.rank}위 → ${r1}위)`:''}.`);
    if(c.type==='cheap')why.push(`연봉 ${money(x.p.sal)}로 우리 ${SLOTK[k]}보다 ${Math.round(x.now)}만큼 낫습니다.`);
    if(c.type==='grow')why.push(`${x.p.age}세, ${x.rp.ofp!=null?`장래 ${x.rp.ofp} 전망(${x.rp.who||'스카우트'})`:'장래성은 아직 관찰이 부족합니다'}. 지금 능력 ${x.rp.cur}.`);
    const h=curLine(x.p); if(h)why.push(x.p.isP?(h.outs?`올해 ${ipStr(h.outs)}이닝 ERA ${pRate(h).era.toFixed(2)}`:''):(h.pa?`올해 ${h.pa}타석 OPS ${fmt3(bRate(h).ops)}`:''));
    if(x.p.listed||x.p.aiListed)why.push(`${tshort(x.t.id)}이(가) 트레이드 블록에 올린 선수입니다.`);
    const cy=ctrlYears(x.p); const cost=`연봉 ${money(x.p.sal)} · ${x.p.faC?`계약 ${x.p.yrs}년 남음`:`FA까지 ${cy}년`}`;
    const cur=k==='SP'?d.sp[4]:k==='RP'?d.pen[3]:d.ln?d.ln[k]:null; const push=cur&&cur.id!==x.p.id?cur:null;
    const blk=playersOf(G.user).filter(q=>!q.foreign&&q.age<=24&&fits(q)&&(scoutReport(q).ofp||0)>=52).sort((a,b)=>(scoutReport(b).ofp||0)-(scoutReport(a).ofp||0))[0]||null;
    out.push({id:x.p.id,tid:x.t.id,give:give||[],why:why.filter(Boolean),cost,push:push?push.id:null,blk:blk?blk.id:null,k}); }
  let hint=''; if(!out.length){ hint=c.sal&&c.age?'조건이 좁습니다. 나이나 연봉 한도를 하나 풀어 보세요.':c.type==='grow'?'지금은 조건에 맞는 성장형 후보가 없습니다. 관찰을 이어가며 겨울에 다시 보겠습니다.':'조건에 맞으면서 상대가 내줄 만한 후보가 없습니다. 조건을 바꾸거나 관찰을 이어가겠습니다.'; }
  return {list:out,hint,open,rank:rk.rank}; }
function slotGain(k,p){ return k==='SP'?spV(p):k==='RP'?penV(p):posScore(p,k); }
function tradeSuggest(force,only){ if(!tradeOpen())return [];
  const key='v5:'+(G.trades||[]).length+':'+(only||'')+':'+playersOf(G.user).map(p=>p.id).reduce((a,b)=>(a*31+b)%1000003,7);
  if(!force&&G.tsug&&G.tsug.key===key&&G.tsug.day>G.day-7){ const L=G.tsug.list.filter(tsugValid); if(L.length||G.tsug.day===G.day)return L; }
  const rk=slotRanks(G.user); const d=depth(G.user); const core=myCoreIds(); const seed=(G.tsugN=(G.tsugN||0)+(force?1:0));
  const needs=(only?[only]:PSLOTS.filter(k=>k!=='DH')).map(k=>({k,...rk[k]})).filter(x=>only||x.rank>=5).sort((a,b)=>b.rank-a.rank).slice(0,3);
  let out=[];
  for(const nd of needs){ const k=nd.k; const cands=[];
    const base=k==='SP'?(d.sp.slice(0,5).length<5?30:Math.min(...d.sp.slice(0,5).map(spV))):k==='RP'?(d.pen.slice(0,4).length<4?30:Math.min(...d.pen.slice(0,4).map(penV))):nd.v;
    for(const t of G.teams){ if(t.id===G.user)continue; for(const p of domestic(t.id)){ if(p.ys||!healthy(p))continue;
      if(k==='SP'){ if(!p.isP||!isSPr(p))continue; } else if(k==='RP'){ if(!p.isP)continue; } else { if(p.isP||(p.pos!==k&&!subsOf(p).includes(k)))continue; }
      const up=slotGain(k,p)-base; if(up<3)continue; cands.push({p,t,up:up+hn('ts'+seed,p.id)*1.5}); } }
    cands.sort((a,b)=>b.up-a.up); let n=0;
    for(const c of cands.slice(0,24)){ if(n>=(only?3:1))break; if(out.some(x=>x.id===c.p.id))continue; const pk=buildPackage(c.t,c.p,core); if(!pk)continue;
      const U=team(G.user); const ud=stackIn([tval(U,c.p,'in')])-sum(pk.map(id=>tval(U,G.players[id],'out'))); if(ud<-4)continue;
      const nv=k==='SP'||k==='RP'?null:slotGain(k,c.p); out.push({k,id:c.p.id,tid:c.t.id,give:pk,rank0:nd.rank,rank1:nv!=null?rankWith(k,nv):null}); n++; } }
  /* 최근 1군 성적이 바닥인 선수는 추천하지 않는다(표본 100타석·30이닝 이상) */
  const badRecent=q=>{ const y=G.year; const h=seasonTotal(q,y,'1군'); const h0=seasonTotal(q,y-1,'1군'); const x=h&&(q.isP?h.outs>=90:h.pa>=100)?h:h0&&(q.isP?h0.outs>=90:h0.pa>=100)?h0:null; if(!x)return false; return q.isP?pRate(x).era>=6.5:bRate(x).ops<.6; };
  out=out.filter(s=>{ const q=G.players[s.id]; return q&&!badRecent(q); });
  G.tsug={day:G.day,key,list:out}; return out; }
/* 잦은 트레이드는 선수단을 흔든다 */
function churnCheck(){ const n=(G.trades||[]).filter(t=>t.y===G.year&&t.d!=null&&t.d>G.day-30).length; if(n<3)return;
  G.form={until:G.day+14,b:-.5}; const m=G.mgr[G.user]; if(m)m.rel=clamp(m.rel-3,0,100); for(const p of playersOf(G.user))p.mor=clamp((p.mor??60)-2,0,100);
  news('선수',`${tshort(G.user)}, 한 달 새 트레이드 ${n}건… 선수단 어수선`,`잇단 트레이드로 선수들 사이에 "다음은 누구냐"는 말이 나옵니다.`,-1);
  stop('감독',`한 달 사이 트레이드가 ${n}건입니다. 선수단이 어수선해 2주간 팀 분위기가 떨어지고, 감독 관계 -3, 선수 기분 -2입니다.`); }
function findPackages(pid){ const p=G.players[pid]; if(!p||p.team==null||p.team===G.user)return []; const t=team(p.team); const out=[]; const used=new Set(); let core=myCoreIds();
  for(let i=0;i<4&&out.length<3;i++){ const ex=new Set([...core,...used]); const pk=buildPackage(t,p,ex); if(!pk){ if(core.size){ core=new Set(); continue; } break; } out.push(pk); pk.forEach(id=>used.add(id)); }
  return out; }
function marketFor(pid){ const p=G.players[pid]; if(!p)return []; const out=[]; const U=team(G.user);
  for(const T of G.teams){ if(T.id===G.user)continue; const v=tval(T,p,'in'); const budget=v-tradeNeed(T,v*.6); if(budget<1)continue; const give=pickPackage(T.id,budget,'any'); if(!give)continue; if(!evalTrade(T.id,[pid],give).ok)continue;
    out.push({tid:T.id,give,u:stackIn(give.map(id=>tval(U,G.players[id],'in')))}); }
  return out.sort((a,b)=>b.u-a.u).slice(0,4); }
function sellSuggest(){ const core=myCoreIds(); const cont=G.teams.filter(t=>t.id!==G.user);
  return domestic(G.user).filter(p=>!p.ys&&!p.listed&&!core.has(p.id)&&healthy(p)&&!(p.joinY>G.year)&&p.age>=26).map(p=>{ let best=null; for(const t of cont){ const tv=tval(t,p,'in'); const v=tv-tradeNeed(t,0); if(!best||v>best.v)best={t,v}; } return {p,v:best?best.v:0,t:best&&best.t}; })
    .filter(x=>x.v>=1.5).sort((a,b)=>b.v-a.v).slice(0,3); }

/* ===== 다른 구단 단장: 인물·성격·친분 ===== */
const GMT={hard:{l:'강경 협상가',d:'쉽게 양보하지 않고 조건을 높게 부릅니다.'},prospect:{l:'유망주 수집가',d:'젊은 선수를 아끼고, 받을 때도 유망주를 원합니다.'},data:{l:'데이터 신봉자',d:'요즘 컨디션보다 계약과 기록을 봅니다. 싼 계약을 좋아합니다.'},
  loyal:{l:'의리파',d:'친한 단장에게는 조건을 너그럽게 봐줍니다.'},gambler:{l:'승부사',d:'스타라면 비싸도 데려가려 합니다.'},miser:{l:'짠돌이',d:'연봉 부담을 가장 싫어합니다.'}};
const GMCAR=['스카우트 출신','전력분석원 출신','구단 프런트 공채','선수 출신','모기업 기획실 출신','에이전트 출신'];
const GMTALK=['요즘 어떻게 지내십니까. 시즌 길게 보고 갑시다.','좋은 선수 있으면 저희 먼저 생각해 주십시오.','다음에 식사 한번 하시죠.','우리 감독이 요즘 불펜 걱정이 많습니다.','시장 분위기가 조용하네요. 큰 거래 하나 나올 때가 됐는데.','작년 트레이드 얘기는 이제 그만합시다. 하하.'];
function mkGM(tid){ return {id:'m'+Math.floor(R()*1e9),name:genName(),age:ri(38,60),trait:pick(Object.keys(GMT)),car:pick(GMCAR),since:G.year,tid,f:R()<.12}; }
function gmOf(tid){ if(tid===G.user)return null; const t=team(tid); if(!t.gm)t.gm=mkGM(tid); return t.gm; }
function gmTrait(tid){ const g=tid===G.user?null:team(tid).gm; return g&&!g.interim?g.trait:null; }
function gmInit(){ for(const t of G.teams){ if(t.id!==G.user&&!t.gm)t.gm=mkGM(t.id); } if(G.rep==null)G.rep=50; G.gmc=G.gmc||{}; G.jobs=G.jobs||[]; G.lgTrades=G.lgTrades||[]; }
function relLabel(r){ return r>=80?'막역한 사이':r>=65?'친한 편':r>=45?'무난한 사이':r>=30?'서먹한 사이':'껄끄러운 사이'; }
function teamNeeds(tid){ const rk=slotRanks(tid); const weak=PSLOTS.filter(k=>k!=='DH').map(k=>({k,r:rk[k].rank})).sort((a,b)=>b.r-a.r).filter(x=>x.r>=6).slice(0,2).map(x=>x.k);
  const t=team(tid); const c=teamCtx(t); const ci=capInfo(tid); const money=t.indie||ci.over>0||t.owner==='profit'?'tight':ci.cap-ci.pay>2500?'rich':'normal';
  return {weak,contend:c.contend,money,rk}; }
function needText(tid){ const n=teamNeeds(tid); return `${n.contend?'우승 경쟁':'리빌딩'} · ${n.weak.length?n.weak.map(k=>SLOTK[k]).join('·')+' 보강 원함':'급한 자리 없음'} · 연봉 ${n.money==='tight'?'여유 없음':n.money==='rich'?'여유 많음':'보통'}`; }
function gmContact(tid,kind){ const t=team(tid), g=gmOf(tid); if(!g)return {msg:''}; G.gmc=G.gmc||{}; const c=G.gmc[tid]||(G.gmc[tid]={});
  if(kind==='call'){ if(c.call!=null&&c.call>G.day-14)return {msg:`${g.name} 단장과는 ${dmd(c.call+14)}부터 다시 연락할 수 있습니다.`};
    c.call=G.day; const d=Math.max(0,(g.trait==='loyal'?2:1)*ri(1,2)-(g.trait==='hard'?1:0)); t.rel=clamp(t.rel+d,0,100);
    return {msg:`${g.name} 단장: "${pick(GMTALK)}" (친분 +${d}) 들어 보니 ${needText(tid)}입니다.`,ok:true}; }
  if(kind==='meal'){ if(c.meal!=null&&c.meal>G.day-30)return {msg:`식사 자리는 한 달에 한 번입니다(${dmd(c.meal+30)}부터).`};
    c.meal=G.day; G.spend.etc=(G.spend.etc||0)+10; const d=Math.round(ri(3,5)*(g.trait==='loyal'?1.5:g.trait==='hard'?.6:1)); t.rel=clamp(t.rel+d,0,100);
    return {msg:`${g.name} 단장과 저녁 식사를 했습니다(1천만 원). 친분 +${d}. ${g.trait==='hard'?'식사는 즐겁게 했지만 협상은 별개라고 선을 긋습니다.':'다음 거래 때 잘 봐 달라는 말이 오갔습니다.'}`,ok:true}; }
  return {msg:''}; }
/* 역제안: 조금 모자랄 때 상대가 조건을 바꿔 다시 제시 */
function counterOffer(tid,give,get){ const e=evalTrade(tid,give,get); const gap=e.need-e.gain; if(gap<=0||gap>9)return [];
  const out=[]; const U=team(G.user);
  const add=domestic(G.user).filter(p=>!give.includes(p.id)&&!(p.joinY>G.year)&&!p.ys&&healthy(p)).map(p=>({p,ng:give.concat(p.id)})).filter(x=>{ const e2=evalTrade(tid,x.ng,get); return e2.ok&&e2.theirN<=ROSTER_MAX; }).map(x=>({...x,c:tval(U,x.p,'out')})).sort((a,b)=>a.c-b.c)[0];
  if(add)out.push({give:add.ng,get:[...get],why:`${add.p.name}을(를) 더 얹어 주시면 하겠습니다.`});
  if(get.length>1){ for(const id of [...get].sort((a,b)=>tval(team(tid),G.players[b],'out')-tval(team(tid),G.players[a],'out'))){ const ng=get.filter(x=>x!==id); if(evalTrade(tid,give,ng).ok){ out.push({give:[...give],get:ng,why:`${G.players[id].name}은(는) 못 드립니다. 나머지로 하시죠.`}); break; } } }
  if(out.length<2&&get.length===1){ const p=G.players[get[0]]; const k=pSlot(p); const alt=domestic(tid).filter(q=>q.id!==p.id&&!q.ys&&healthy(q)&&pSlot(q)===k).map(q=>({q,e:evalTrade(tid,give,[q.id])})).filter(x=>x.e.ok).sort((a,b)=>ovr(b.q)-ovr(a.q))[0];
    if(alt&&ovr(alt.q)>=ovr(p)-8)out.push({give:[...give],get:[alt.q.id],why:`${p.name} 대신 ${alt.q.name}(${posLabel(alt.q)})이면 됩니다.`}); }
  return gmTrait(tid)==='hard'?out.slice(0,1):out.slice(0,2); }
const NEG_MONTH=4;
function negTurn(tid){ G.gmc=G.gmc||{}; const c=G.gmc[tid]||(G.gmc[tid]={}); const o=dobj(G.day); const mk=o.y*100+o.m; if(c.negM!==mk){ c.negM=mk; c.neg=0; } delete c.negDay; c.seen=c.seen||{}; for(const k in c.seen)if(c.seen[k]<G.day-30)delete c.seen[k]; return c; }
/* 맞대결: 오늘(쉬는 날이면 내일) 우리와 경기하는 구단은 경기장에서 만나므로 횟수 제한이 없다 */
function seriesOpp(){ const c=G.cal; if(!c||!c.sched)return null; for(const d of [G.day,G.day+1]){ const gs=c.sched[d]; if(!gs)continue; const m=gs.find(x=>x.includes(G.user)); return m?(m[0]===G.user?m[1]:m[0]):null; } return null; }
function negInfo(tid){ const c=negTurn(tid); const free=seriesOpp()===tid; const o=dobj(G.day); const nx=o.m===12?1:o.m+1; const cap=negCap(tid); return {used:c.neg,cap,left:free?99:Math.max(0,cap-c.neg),free,next:`${nx}월 1일`}; }
const tsig=(give,get)=>[...give].sort((a,b)=>a-b).join(',')+'|'+[...get].sort((a,b)=>a-b).join(',');
/* 트레이드 기록과 성적표 */
const warSoFar=(p,y)=>{ const h=seasonTotal(p,y,'1군'); return h?warOf(h,p):0; };
function tradeSnap(ids){ const o={}; for(const id of ids){ const p=G.players[id]; if(p)o[id]=warSoFar(p,G.year); } return o; }
function warSince(id,y,snap){ const p=G.players[id]; if(!p)return 0; let w=0; for(let yy=y;yy<=G.year;yy++)w+=warSoFar(p,yy); return w-(snap&&snap[id]||0); }
function tradeReport(tr){ if(!tr.gi)return null; const got=sum(tr.gi.map(id=>warSince(id,tr.y,tr.snap))), gave=sum(tr.go.map(id=>warSince(id,tr.y,tr.snap))); return {got,gave,net:got-gave}; }
function tradeGrade(tid,give,get){ const U=team(G.user); const d=stackIn(get.map(id=>tval(U,G.players[id],'in')))-sum(give.map(id=>tval(U,G.players[id],'out'))); return d>=8?'A':d>=3?'B':d>=-3?'C':d>=-8?'D':'F'; }
/* 다른 구단끼리 트레이드 */
function aiTradeTry(aid){ const tc={}; (G.lgTrades||[]).filter(t=>t.y===G.year).forEach(t=>{ tc[t.a]=(tc[t.a]||0)+1; tc[t.b]=(tc[t.b]||0)+1; }); const teams=G.teams.filter(t=>t.id!==ME()&&(tc[t.id]||0)<4); const buyers=teams.filter(t=>teamCtx(t).contend); const A=aid!=null?teams.find(t=>t.id===aid):pick(buyers.length?buyers:teams); if(!A)return null;
  const rk=slotRanks(A.id); const nd=PSLOTS.filter(k=>k!=='DH').map(k=>({k,r:rk[k].rank})).sort((a,b)=>b.r-a.r)[0]; if(!nd||nd.r<(gmHeat(A.id)>=.4?5:6))return null;
  const k=nd.k; const L=leagueSlots()[A.id]; const base=k==='SP'?(L.SP.ps.length<5?30:Math.min(...L.SP.ps.map(spV))):k==='RP'?(L.RP.ps.length<4?30:Math.min(...L.RP.ps.map(penV))):L[k].v;
  const cands=[]; for(const B of teams){ if(B.id===A.id)continue; for(const p of domestic(B.id)){ if(p.ys||!healthy(p))continue; if(k==='SP'||k==='RP'){ if(pSlot(p)!==k)continue; } else if(p.isP||(p.pos!==k&&!subsOf(p).includes(k)))continue;
      const up=slotGain(k,p)-base+(p.aiListed?(p.aiUrg?4:2.5):0); if(up>=3)cands.push({B,p,up}); } }
  cands.sort((a,b)=>b.up-a.up);
  for(const c of cands.slice(0,8)){ const B=c.B, p=c.p; const vOut=tval(B,p,'out'), vInA=tval(A,p,'in'); if(vInA<=0)continue; const needB=tradeNeed(B,vOut);
    /* 2대2: B의 블록 선수 한 명을 끼워 함께 받는 경우 */
    const extra=R()<.3?domestic(B.id).find(q=>q.aiListed&&q.id!==p.id&&healthy(q)&&!q.ys):null; const gets=extra?[p,extra]:[p];
    const vOutAll=sum(gets.map(q=>tval(B,q,'out'))), vInAAll=stackIn(gets.map(q=>tval(A,q,'in')));
    const pool=corePool(A.id).filter(q=>healthy(q)&&!q.ys).map(q=>({q,b:tval(B,q,'in')*(q.aiListed?1.1:1),a:tval(A,q,'out')})).filter(x=>x.b>.3).sort((x,y)=>x.b-y.b).slice(0,22);
    let best=null,bo=1e9; const tryS=arr=>{ const bv=stackIn(arr.map(x=>x.b)); if(bv<vOutAll+needB)return; if(arr.length>gets.length&&((vOut>=2&&Math.max(...arr.map(x=>x.b))<vOut*.75)||(ovr(p)>=56&&Math.max(...arr.map(x=>ovr(x.q)))<ovr(p)-5)))return; const av=sum(arr.map(x=>x.a)); if(vInAAll-av<tradeNeed(A,av))return; const o=bv-vOutAll-needB+arr.length*.5; if(o<bo){ bo=o; best=arr; } };
    for(let i=0;i<pool.length;i++){ tryS([pool[i]]); for(let j=i+1;j<pool.length;j++)tryS([pool[i],pool[j]]); }
    if(!best)continue;
    if(rosterN(B.id)+best.length-gets.length>ROSTER_MAX)continue;
    { const gs=sum(best.map(x=>x.q.sal)), ps=sum(gets.map(q=>q.sal)); const capY=capOf(G.year); if((ps>gs&&capPay(A.id)+ps-gs>capY)||(gs>ps&&capPay(B.id)+gs-ps>capY))continue; }
    const give=best.map(x=>x.q.id); const snap=tradeSnap([...gets.map(q=>q.id),...give]);
    gets.forEach(q=>{ q.team=A.id; story(q,`트레이드로 ${tname(A.id)} 이적`,'move'); delete q.aiListed; delete q.aiWhy; delete q.aiUrg; }); give.forEach(id=>{ G.players[id].team=B.id; story(G.players[id],`트레이드로 ${tname(B.id)} 이적`,'move'); delete G.players[id].aiListed; });
    G.lgTrades.unshift({y:G.year,d:G.day,a:A.id,b:B.id,ag:gets.map(q=>q.id),bg:give,snap}); if(G.lgTrades.length>60)G.lgTrades.length=60;
    wire('트레이드',`${tshort(A.id)}–${tshort(B.id)} ${gets.length}대${give.length} 트레이드: ${tshort(A.id)}은(는) ${gets.map(q=>`${q.name}(${posLabel(q)})`).join(', ')}을(를) 얻고 ${give.map(id=>G.players[id].name).join(', ')}을(를) 내줬습니다.${gets.some(q=>q.aiWhy)?' 블록에 올라 있던 선수입니다.':''}`,{tid:A.id,ref:p.id});
    return true; }
  return null; }
function marketWeek(){ if(!tradeOpen()||G.gameOver)return; gmInit(); const per=period(); const dl=per==='season'&&G.day>=KD(7,1);
  /* 다른 구단끼리 트레이드: 한 해 6~10건 정도(실제 KBO도 시즌 중에는 몇 건 안 된다). 마감 직전에 몰린다 */
  /* 다른 구단끼리: 필요한 구단, 압박받는 단장이 먼저 움직인다. 한 해 12~18건 안팎 */
  { const n=(G.lgTrades||[]).filter(t=>t.y===G.year).length; if(n<22){ for(const t of G.teams){ if(t.id===ME())continue; const rk=slotRanks(t.id); const weak=PSLOTS.filter(k=>k!=='DH'&&rk[k].rank>=8).length;
      let pr=.06+gmHeat(t.id)*.1+Math.min(2,weak)*.025+(dl?.12:0); if(per!=='season')pr*=.7; if(R()<pr&&!aiTradeTry(t.id)&&R()<.06){ const B=pick(G.teams.filter(x=>x.id!==ME()&&x.id!==t.id)); wire('루머',`${tshort(t.id)}, ${tshort(B.id)}에 트레이드를 제안했지만 조건이 맞지 않았다는 소식입니다.`,{tid:t.id}); } } } }
  if(G.unemp)return;
  const teams=G.teams.filter(t=>t.id!==ME()); const t=pick(teams); const n=teamNeeds(t.id);
  if(n.weak.length&&R()<.6)wire('루머',`${t.city} ${t.nick} ${gmOf(t.id).name} 단장, ${SLOTK[n.weak[0]]} 보강을 추진 중이라는 소문입니다.`,{tid:t.id});
  if(R()<.25){ let best=null; for(const T of teams){ for(const p of domestic(G.user)){ if(p.ys||(p.joinY>G.year))continue; const v=tval(T,p,'in')-tradeNeed(T,0); if(v>=3&&(!best||v>best.v))best={T,p,v}; } }
    if(best)mail('운영팀',`${best.T.city} ${best.T.nick}, ${best.p.name}에 관심`,`${best.T.city} ${best.T.nick} ${gmOf(best.T.id).name} 단장이 ${best.p.name}(${posLabel(best.p)})에 관심을 보인다는 이야기가 들립니다. 시장 가치를 확인해 보세요.`,{kind:'트레이드',ref:best.p.id,face:best.p.id,acts:[{l:'시장 가치 보기',a:'findMine',v:best.p.id}]}); }
}
function marketDaily(){ if(G.gameOver)return; gmInit(); const per=period(); try{ aiForeignDaily(); }catch(err){}
  if(per==='season'&&G.day===KD(7,31)){ for(let i=0;i<2;i++){ try{ if((G.offers||[]).length<4)aiOffer(); }catch(e){} } for(let i=0;i<2;i++)aiTradeTry();  }
  jobsDaily(); }
/* ===== 단장 경력: 명성과 다른 구단 제의 ===== */
function repSeason(y,rank,champ,runner,trustD){ G.rep=G.rep??50; let d=0; if(champ)d+=10; else if(runner)d+=6; else if(rank<=5)d+=3; else if(rank>=8)d-=4; d+=clamp(trustD/3,-3,3);
  const net=sum((G.trades||[]).filter(t=>t.y===y&&t.gi).map(t=>{ const r=tradeReport(t); return r?r.net:0; })); d+=clamp(net,-4,4);
  G.rep=clamp(Math.round(G.rep+d),0,100); return d; }
function repLabel(r){ return r>=80?'리그 최고의 단장':r>=65?'유능한 단장':r>=45?'평범한 단장':r>=30?'흔들리는 단장':'평판이 나쁜 단장'; }
function gmTurnover(){ gmInit(); const st=G.last&&G.last.order?G.last.order:null;
  for(const t of G.teams){ if(t.id===ME())continue; /* 야인일 때 전 소속 구단도 새 단장이 성적으로 평가받는다 */ const g=gmOf(t.id); g.age++; const rk=st?st.findIndex(o=>o.tid===t.id)+1:5; const ten=G.year-g.since;
    const fire=(rk>=8&&ten>=2&&R()<.4)||(rk>=6&&ten>=4&&R()<.2)||(g.age>=64&&R()<.35); if(!fire)continue;
    const old=g.name; const want=G.unemp?R()<clamp((G.rep-10)/60,.15,.85):(G.rep>=55&&R()<.55); if(want&&!G.gameOver&&!(G.unemp&&G.unemp.from===t.id)&&!G.jobs.some(j=>!j.done)){ t.gm={...mkGM(t.id),name:'단장대행',interim:true}; jobOffer(t.id,false); wire('단장',`${t.city} ${t.nick}, ${old} 단장 경질. 후임을 물색 중입니다.`,{tid:t.id}); }
    else { const og=(()=>{ try{ return obAiGM(t.id); }catch(e){ return null; } })(); t.gm=og||mkGM(t.id); if(!og)t.rel=clamp(Math.round(N(50,6)),35,65); wire('단장',`${t.city} ${t.nick}, ${old} 단장 후임으로 ${t.gm.name} 단장 선임 (${GMT[t.gm.trait].l})`,{tid:t.id}); } } }
function jobOffer(tid,fired){ const t=team(tid); G.jobs.push({tid,exp:G.day+(fired?20:12),fired:!!fired,done:false});
  mail(`${t.city} ${t.nick} 구단주실`,`${t.city} ${t.nick} 단장직 제의`,`${t.city} ${t.nick} 구단주실입니다. 단장님의 운영을 지켜봐 왔습니다. 저희 구단의 새 단장을 맡아 주실 수 있겠습니까?\n${tname(tid)} · 지난 시즌 ${G.last&&G.last.order?G.last.order.findIndex(o=>o.tid===tid)+1:'-'}위 · ${needText(tid)}\n수락하면 ${fired?'바로':'이번 겨울부터'} ${t.city} ${t.nick}를 맡게 되고, 지금 구단과는 작별합니다.`,
    {imp:true,kind:'경력',acts:[{l:`수락: ${t.city} ${t.nick}로 이동`,a:'jobYes',v:tid},{l:'거절',a:'jobNo',v:tid}]}); }
function jobsDaily(){ for(const j of G.jobs||[]){ if(j.done||G.day<j.exp)continue; jobAnswer(j.tid,false,true); } }
function jobAnswer(tid,yes,auto){ const j=(G.jobs||[]).find(x=>x.tid===tid&&!x.done); if(!j)return '제의가 없습니다.'; j.done=true; const t=team(tid);
  if(yes){ G.gmSince=G.year; switchTeam(tid); return `${tname(tid)} 단장으로 취임했습니다.`; }
  if(t.gm&&t.gm.interim){ t.gm=mkGM(tid); t.rel=50; wire('단장',`${t.city} ${t.nick}, ${t.gm.name} 단장 선임 (${GMT[t.gm.trait].l})`,{tid}); }
  return auto?'':`${t.city} ${t.nick}의 제의를 거절했습니다.`; }
/* 경질되면 야인이 된다. 시간은 계속 흐르고, 다른 구단에서 단장이 바뀔 때 명성에 따라 제의가 온다 */
function firedFlow(y,msg){ gmInit(); const old=G.user; const ot=team(old);
  chron('fired',`단장 경질: ${msg}`,null,old); G.unemp={y,msg,since:G.day,from:old}; ot.gm=mkGM(old); ot.rel=55;
  wire('단장',`${tname(old)}, 단장 경질. 후임에 ${ot.gm.name} 단장`,{tid:old});
  mail('야인','단장직에서 물러났습니다',`${msg}\n\n이제 야인입니다. 시간은 그대로 흐르고, 다른 구단이 단장을 바꿀 때 단장 명성(${G.rep})을 보고 제의가 올 수 있습니다. 명성이 높을수록 제의가 자주 옵니다. 제의는 소식함과 홈에 뜹니다.\n\n그동안 리그 탭에서 판도를 지켜보세요. 단장 경력을 끝내려면 홈의 '단장 경력 마치기'를 누르면 됩니다.`,{imp:true,kind:'경력'});
  /* 명성이 높으면 곧바로 연락이 오기도 한다 */
  const cands=G.teams.filter(t=>t.id!==old).map(t=>({t,rk:G.last&&G.last.order?G.last.order.findIndex(o=>o.tid===t.id)+1:5})).sort((a,b)=>b.rk-a.rk);
  const n=G.rep>=70?2:G.rep>=55?1:0; for(const c of cands.slice(0,n)){ const og=gmOf(c.t.id).name; c.t.gm={...mkGM(c.t.id),name:'단장대행',interim:true}; wire('단장',`${c.t.city} ${c.t.nick}, ${og} 단장과 결별`,{tid:c.t.id}); jobOffer(c.t.id,true); } }
/* 야인 기간: 전 소속 구단은 새 단장(AI)이 운영한다 */
function unempAuto(){ if(!G.unemp)return; const u=G.user;
  for(const e of (G.evs||[]))if(!e.done){ try{ evPick(e.id,e.def,true); }catch(x){ e.done=true; } }
  if(G.offers&&G.offers.length){ for(const o of [...G.offers])try{ answerOffer(o.id,false); }catch(x){} }
  if(!G.mgr[u]&&(G.mmarket||[]).length)try{ hireMgr(G.mmarket[0].id,2); }catch(x){}
  if(G.contract&&!G.contract.done&&G.day>=KD(12,10))try{ { let g=0; while(fReCapInfo().over>0&&g++<4){ const C=G.contract; const k=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id)).sort((a,b)=>b.newSal-a.newSal)[0]; if(!k)break; C.foreignDrop.push(k.id); } } confirmContracts(); }catch(x){}
  (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(x){} });
  if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(x){}
  if(G.camp&&!G.camp.done&&!G.camp.focus)G.camp.focus='balance';
  if(foreignOpen()&&foreignOf(u).length<4&&dobj(G.day).w===2)try{ aiForeignFill(u); }catch(x){}
  if(rosterN(u)>ROSTER_MAX)try{ trimRoster(u,ROSTER_MAX); }catch(x){}
  G.medSet=true; G.res=null; G.live=null;
  const o=dobj(G.day); if(o.d===1){ G.rep=clamp((G.rep??40)+(G.rep<50?1:0),0,100); }
  /* 7월 1일: 하위권 구단이 단장을 바꾸며 연락해 오기도 한다 */
  if(o.m===7&&o.d===1&&!(G.jobs||[]).some(j=>!j.done)){ const st=standingsNow(); const t=team(st[st.length-1-ri(0,2)].tid); if(t.id!==u&&R()<clamp((G.rep-15)/80,.08,.6)){ const og=gmOf(t.id).name; t.gm={...mkGM(t.id),name:'단장대행',interim:true}; wire('단장',`${t.city} ${t.nick}, ${og} 단장 시즌 중 경질`,{tid:t.id}); jobOffer(t.id,true); } } }
function retireGM(){ if(!G.unemp)return; G.gameOver={y:G.year,msg:`${G.unemp.y}시즌 뒤 야인으로 지내다 단장 경력을 마쳤습니다.`}; }
function switchTeam(tid){ const old=G.user; const ot=team(old), nt=team(tid);
  ot.fac=(G.fac&&G.fac.lv)||3; ot.gm=mkGM(old); ot.rel=60; nt.gm=null; G.user=tid; nt.trust=55; nt.rel=50;
  G.goals=null; G.policy=null; G.devProg=[]; G.ovs=[]; G.lineup={}; G.offers=[]; G.shortlist=[]; G.tsug=null; G.mentor=null; G.camp=G.camp&&!G.camp.done?G.camp:null;
  for(const e of (G.evs||[]))if(!e.done)e.done=true; G.fac={lv:nt.fac||3,build:null}; facInit(); G.marketing=2000; G.pr={fan:55,press:50,hist:[]};
  for(const p of Object.values(G.players)){ if(p.team===old){ delete p.listed; delete p.promise; } }
  G.unemp=null; G.gameOver=null; G.stops=[];
  try{ if(period()!=='off')setGoals(); }catch(e){}
  addLog(`${tname(old)}을(를) 떠나 ${tname(tid)} 단장으로 취임했습니다.`); chron('join',`새 단장 취임`,null,tid); try{ G.tgrow=[]; ovrSnap(); growSnap(); }catch(e){}
  mail('구단주실',`${nt.city} ${nt.nick} 단장 취임`,`${tname(tid)} 단장으로 취임하셨습니다. 선수단과 코치진, 감독은 그대로 이어받습니다. 재정과 목표는 이 구단 기준으로 새로 시작합니다.\n${needText(tid)}`,{kind:'경력'}); }

/* ===== 메일 ===== */
const SEC='서하린';
const FROM={병역:'운영팀',엔트리:'감독실',언론:'홍보팀',구단주:'구단주실',부상:'팀 닥터 · 의무팀',복귀:'팀 닥터 · 의무팀',트레이드:'운영팀',일정:`비서 ${SEC}`,FA:'운영팀',연봉:'운영팀',결산:'구단주실',경기:'전력분석팀',기록:'홍보팀',월간:`비서 ${SEC}`,드래프트:'스카우트팀장',새해:`비서 ${SEC}`,캠프:'코칭스태프',스토브리그:`비서 ${SEC}`,외국인:'운영팀',포스트시즌:`비서 ${SEC}`,취임:`비서 ${SEC}`,면담:'선수단',감독:'운영팀',연수:'육성팀',의무:'팀 닥터 · 의무팀'};
const GOTO={구장:'구장',연봉:'연봉협상',드래프트:'신인드래프트',FA:'FA시장',결산:'시즌결산',캠프:'스프링캠프',감독:'감독',스토브리그:'FA시장',외국인:'외국인선수',트레이드:'트레이드'};
function mail(from,subj,body,o){ o=o||{}; if(G.unemp&&o.kind!=='경력'&&from!=='야인')return {read:true,acts:[]}; /* 야인일 때는 전 소속 구단 업무 메일을 받지 않는다 */
  const m={id:'m'+(G.mailSeq=(G.mailSeq||0)+1),day:G.day,from,subj,body,read:false,imp:!!o.imp,acts:o.acts||[],ref:o.ref??null,kind:o.kind||'일반',face:o.face??null};
  G.mail.unshift(m); if(G.mail.length>160)G.mail.length=160; if(m.imp)G.stops.push(m); return m; }
function headline(t){ const i=t.search(/[.!?](\s|$)/); return i>0&&i<46?t.slice(0,i):t.length>40?t.slice(0,38)+'…':t; }
function kindActs(kind,ref){ const a=[]; if(ref!=null&&G.players[ref])a.push({l:'선수 보기',a:'player',v:ref}); if(GOTO[kind])a.push({l:'해당 화면으로',a:'goWork',v:GOTO[kind]}); return a; }
function stop(kind,t,ref){ mail(FROM[kind]||'프런트',headline(t),t,{imp:true,ref,kind,acts:kindActs(kind,ref),face:ref!=null&&kind!=='부상'?ref:null}); }
function note(kind,t,ref){ mail(FROM[kind]||'프런트',headline(t),t,{ref,kind,acts:kindActs(kind,ref)}); }

/* ===== 비서 업무 안내(튜토리얼) ===== */
const TUT=[
  {k:'welcome',title:'취임 인사',subj:'단장님, 취임을 축하드립니다',body:`비서 ${SEC}입니다. 구단에 보고되는 소식은 이 소식함으로 보내 드리겠습니다.\n\n하루 흐름은 간단합니다. 홈 화면에서 처리할 일을 확인하고, 화면 오른쪽 위 계속 버튼으로 시간을 넘기세요. 시즌 중에는 계속을 누르면 중요한 소식이 생기거나 한 주가 끝날 때까지 경기를 몰아서 진행하고, 홈 맨 위에 그 기간 성적과 잘한·부진한 선수를 정리해 보여 드립니다. 한 경기씩 보려면 1경기 버튼을 누르세요. 중요한 일이 생기면 진행이 멈추고 홈의 처리할 일에 올라옵니다.\n\n개막 전까지 정리할 일이 몇 가지 있습니다. 하나씩 안내해 드리겠습니다.`,check:()=>true},
  {k:'foreign',title:'외국인 선수 구성',subj:'외국인 선수 자리가 모두 비어 있습니다',body:'지난 시즌 외국인 선수들과 재계약하지 않아 네 자리가 모두 비어 있습니다. 용병 3명과 아시아쿼터 1명을 채울 수 있습니다.\n\n보통은 선발 투수 2명과 타자 1명으로 구성합니다. 규정상 3명을 모두 투수나 모두 타자로 채울 수는 없습니다. 신규 계약은 1인 100만 달러, 아시아쿼터는 20만 달러까지이고, 용병 3명 합계는 400만 달러를 넘을 수 없습니다.\n\n화면 위쪽에서 용병과 아시아쿼터 탭이 나뉩니다. 후보 정보가 얼마나 정확한지는 그 나라에 우리 스카우트망이 얼마나 있느냐에 달려 있습니다. 지금은 미국에만 현지 통신원이 있고, 나머지 지역은 에이전트 자료뿐입니다. 스카우팅 메뉴의 해외 스카우트망에서 지역별로 늘릴 수 있습니다.\n\n지난 리그 기록은 리그 수준 차이를 감안해서 보세요.',btn:'외국인 후보 보기',go:['goWork','외국인선수'],check:()=>{const f=foreignOf(G.user); return f.filter(p=>p.foreign==='용병').length>=3&&f.some(p=>p.foreign==='아시아');},prog:()=>{const f=foreignOf(G.user); return `용병 ${f.filter(p=>p.foreign==='용병').length}/3 · 아시아쿼터 ${f.filter(p=>p.foreign==='아시아').length}/1`;}},
  {k:'mgr',title:'감독 선임',subj:'감독 자리가 비어 있습니다',body:'전임 감독의 계약이 끝나 사령탑이 공석입니다. 개막 전까지 반드시 감독을 선임해야 합니다.\n\n감독마다 성향이 다릅니다. 스몰볼 감독은 도루와 작전을 많이 쓰고, 불펜을 적극 쓰는 감독은 선발을 일찍 내립니다. 육성형 감독은 젊은 선수 성장을 돕고, 장악력이 강한 감독은 선수단 분위기를 안정시킵니다. 연봉이 높을수록 경기 운영 능력이 좋은 편입니다. 감독을 뽑은 뒤에는 홈의 감독실에서 팀 상황과 원하는 외국인 선수를 자주 물어보세요. 감독이 원한 유형은 외국인 시장에 "감독 선호"로 표시됩니다.',btn:'감독 후보 보기',go:['goWork','감독'],check:()=>!!G.mgr[G.user]},
  {k:'med',from:'팀 닥터 · 의무팀',title:'의무 체계',subj:'부상 방지 프로그램과 병원 제휴를 정해 주세요',body:'의무팀에서 올 시즌 운영안을 올렸습니다. 부상 방지 프로그램 단계가 높을수록 부상이 줄고, 제휴 병원이 좋을수록 재활 기간이 짧아집니다. 종합 스포츠의학센터와 제휴하면 정밀 검진으로 선수의 부상 체질도 알 수 있습니다.\n\n비용은 하루 단위로 쌓여 시즌 결산 때 나갑니다.',btn:'의무 운영안 보기',go:['goWork','부상방지·병원'],check:()=>!!G.medSet},
  {k:'dev',from:'육성팀',title:'2군 연수',subj:'2군 연수 프로그램에 보낼 선수를 정해 주세요',body:'육성팀입니다. 퓨처스 선수들을 집중 훈련 프로그램에 배정할 수 있습니다. 최대 6명까지 가능하고, 배정한 선수는 매주 해당 능력이 조금씩 오릅니다. 1군에서 뛰는 선수는 효과가 절반입니다.\n\n가을과 겨울에는 일본 교육리그, 호주리그 파견, 미국 연수 같은 해외 연수도 보낼 수 있습니다.\n\n선수를 누르면 카드 아래쪽에서 프로그램을 고를 수 있습니다.',btn:'2군 연수 보기',go:['goWork','2군연수'],check:()=>(G.devProg||[]).length>=1},
  {k:'scout',from:'스카우트팀장',title:'스카우트 공백',subj:'스카우트 담당 지역에 공백이 있습니다',body:'스카우트팀장입니다. 스카우트는 한 사람이 한 가지 업무만 맡습니다. 아마추어(지역 고교·대학 선수), 프로(그 지역 연고 구단 선수), 해외(외국인 선수 시장) 중 하나입니다. 최대 6명까지 둘 수 있으니, 드래프트를 위해 먼저 수도권·영남·호남·충청 세 지역에 아마추어 스카우트를 배치해 주세요. 업무를 바꾸면 30일 동안 적응 기간이 있습니다.',btn:'스카우트 팀 보기',go:['goWork','스카우트팀'],check:()=>new Set(G.scouts.filter(s=>(s.role||'am')==='am').map(s=>s.region)).size>=3},
  {k:'lineup',from:'코칭스태프',title:'배치 확인',subj:'감독이 정한 선수단 배치를 확인해 주세요',body:'선수단 탭에서 야구장 그림으로 포지션별 주전을 볼 수 있습니다. 주전 기용과 타순, 투수 운용은 감독 권한입니다. 단장은 선수 구성과 감독 선임으로 팀을 바꿉니다. 자리를 누르면 그 포지션 후보를 비교해 볼 수 있습니다.',btn:'선수단 보기',go:['tab','roster'],check:()=>!!(G.tutFlags&&G.tutFlags.roster)||(G.cal&&G.day>G.cal.open+7)},
  {k:'go',title:'캠프 준비',subj:'개막 준비가 끝났습니다',body:'기본 업무 안내는 여기까지입니다. 홈의 처리할 일에 남은 항목(코치 빈자리 등)이 있으면 마저 정리하고 시간을 넘겨 보세요. 1월 25일에 스프링캠프가 시작되면 훈련 방향을 정해 주셔야 합니다.\n\n그 밖에 비FA 다년계약과 트레이드는 영입·계약 메뉴, 마케팅 예산은 구단·재정 메뉴에서 언제든 볼 수 있습니다.',btn:'캠프까지 넘기기',go:['adv','next'],check:()=>G.day>=G.cal.camp},
];
function sendTut(){ const s=TUT[G.tut.step]; mail(s.from||`비서 ${SEC}`,s.subj,s.body,{kind:'업무',acts:s.btn?[{l:s.btn,a:s.go[0],v:s.go[1]}]:[],face:s.from?null:'sec'}); }
function tutTick(){
  const t=G.tut; if(!t||t.done)return; if(G.fdWait||(G.fd&&!G.fd.done))return; if(G.cal&&G.day>G.cal.end){ t.done=true; return; } /* 시즌이 끝나면 첫해 안내는 정리한다 */
  let guard=0;
  while(guard++<12&&!t.done){ const s=TUT[t.step]; if(!s.check())break;
    if(s.k!=='welcome'&&s.k!=='go'){ const m=mail(`비서 ${SEC}`,`완료: ${s.title}`,`${s.title} 업무가 끝났습니다. 다음 업무를 안내해 드리겠습니다.`,{kind:'업무',face:'sec'}); m.read=true; }
    t.step++; if(t.step>=TUT.length){ t.done=true; mail(`비서 ${SEC}`,'업무 안내를 마칩니다','기본 업무 안내를 모두 마쳤습니다. 앞으로도 중요한 소식은 이곳으로 보내 드리겠습니다. 좋은 시즌 되십시오.',{kind:'업무',face:'sec'}); break; }
    sendTut(); }
}
function tutSkip(){ const t=G.tut; if(!t||t.done)return; t.step++; if(t.step>=TUT.length){t.done=true;return;} sendTut(); }

/* ===== 선수 기분과 성향 ===== */
function initPers(p){ if(p.mor==null)p.mor=clamp(Math.round(N(62,8)),35,85); if(!p.pers)p.pers={pro:ri(4,20),amb:ri(4,20),loy:ri(4,20),temp:ri(4,20)}; }
const moodLabel=m=>m>=80?'매우 좋음':m>=65?'좋음':m>=45?'보통':m>=30?'불만':'매우 불만';
const moodClass=m=>m>=65?'good':m>=45?'':m>=30?'warn':'bad';
function persText(p){ const s=p.pers; const t=[]; if(s.pro>=15)t.push('프로의식이 강함'); if(s.pro<=7)t.push('훈련 태도가 들쭉날쭉'); if(s.amb>=15)t.push('야망이 큼'); if(s.loy>=15)t.push('구단 충성심이 높음'); if(s.loy<=6)t.push('시장 평가를 중시'); if(s.temp>=15)t.push('예민한 편'); if(s.temp<=6)t.push('무던한 편'); return t.length?t.join(' · '):'평범한 성향'; }
function isRegular(p){ if(!p.team)return false; const d=depth(p.team); return [...d.start,...d.sp,...d.pen.slice(0,4)].some(x=>x.id===p.id); }
function playedReg(p){ if(!p.team)return false; const r=G.sea&&G.sea.rec[p.team]; const g=r?r.w+r.l+(r.t||0):0; if(g<10)return false; const h=seasonTotal(p,G.year,'1군'); if(!h)return false;
  return p.isP?((h.gs||0)>=g/7||(h.g||0)>=g/3):(h.pa||0)>=g*2.5; }
function moraleWhy(p){
  const per=period(); const live=per==='season'||per==='post';
  const reg=!live||isRegular(p)||playedReg(p); const star=ovr(p)>=55||p.sal>=500;
  if(p.promise)return '건의해 주신 출전 기회를 기다리고 있습니다.';
  if(star&&!reg&&healthy(p))return '주전으로 뛰지 못해 답답합니다.';
  if(!reg&&p.age>=27&&healthy(p))return '나이가 있어서 더 많은 기회가 필요합니다.';
  const r=G.sea.rec[p.team]; if(r&&r.w+r.l>20&&r.w/(r.w+r.l)<.44)return '팀 성적이 좋지 않아 분위기가 무겁습니다.';
  if(!p.foreign&&!p.faC&&p.svc>=faSvc(p)-1)return 'FA를 앞두고 미래가 신경 쓰입니다.';
  if(p.mor>=65)return '요즘 야구가 즐겁습니다.';
  return '특별한 고민은 없습니다.';
}
/* 감독의 투수 보직 결정: 부진한 선발은 불펜으로, 잘 던지는 불펜은 선발 기회. 매주 다시 본다 */
function roleWeek(){ if(period()!=='season')return; const y=G.year;
  for(const t of G.teams){ const m=mgrOf(t.id); const thr=46+(((m&&m.pen!=null)?m.pen:50)-50)/10; const before=new Set(playersOf(t.id).filter(p=>p.isP&&p.role==='SP').map(p=>p.id));
    for(const p of playersOf(t.id)){ if(!p.isP)continue; p.rAdj=(p.rAdj||0)*.85; const h=seasonTotal(p,y,'1군'); if(!h||!h.outs)continue; const era=h.er*27/h.outs;
      if(p.role==='SP'&&(h.gs||0)>=5&&era>=6.2)p.rAdj=Math.min(p.rAdj,-7);
      else if(p.role==='RP'&&(h.g||0)>=12&&h.outs>=60&&era<=2.6&&p.r.sta>=thr-9)p.rAdj=Math.max(p.rAdj,6); }
    if(t.id!==G.user||G.unemp||!m)continue; depth(t.id); const after=playersOf(t.id).filter(p=>p.isP&&p.role==='SP'); const up=after.filter(p=>!before.has(p.id)&&before.size), down=[...before].map(id=>G.players[id]).filter(p=>p&&p.team===t.id&&p.role==='RP'&&healthy(p));
    if(up.length||down.length){ const ln=[...up.map(p=>`${p.name}: 불펜 → 선발`),...down.map(p=>`${p.name}: 선발 → 불펜`)];
      mail('감독실',`투수 보직 변경 (${ln.length}명)`,`${m.name} 감독: 이번 주부터 선발진을 바꿉니다.\n\n${ln.join('\n')}\n\n체력과 최근 투구 내용을 보고 정했습니다. 내용이 바뀌면 다시 조정합니다.`,{kind:'감독'}); } } }
function moraleWeek(){
  const per=period();
  for(const t of G.teams){
    const d=depth(t.id); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id));
    const st=G.sea.rec[t.id]; const wp=(st.w+st.l)?st.w/(st.w+st.l):.5; const m=G.mgr[t.id]; const disc=m?m.disc:45;
    const cap=t.id===G.user?captainOf(t.id):null; const capB=cap&&healthy(cap)?((cap.pers&&cap.pers.pro)||10)>=14?.4:.2:0;
    for(const p of playersOf(t.id)){ initPers(p); let dd=capB; const star=ovr(p)>=55||p.sal>=500; const r=reg.has(p.id)||(per==='season'&&playedReg(p));
      if(per==='season'){ if(star&&!r&&healthy(p))dd-=3*(p.pers.temp>=14?1.3:1); else if(!r&&healthy(p)&&p.age>=27&&ovr(p)>=46)dd-=1; else if(r)dd+=1; if(wp>.56)dd+=1; if(wp<.44)dd-=1; }
      if(p.promise&&G.day>=p.promise.until){
        if(r){ dd+=5; if(t.id===G.user)note('면담',`${p.name}: 감독님께 말씀해 주셔서 기회를 얻었습니다. 감사합니다.`,p.id); }
        else { dd-=12; if(t.id===G.user)stop('면담',`${p.name}이(가) 한 달이 지나도 기회를 얻지 못해 실망했습니다. 감독은 다른 선수를 기용하고 있습니다.`,p.id); }
        delete p.promise; }
      const tgt=60+(disc-50)/8; p.mor=clamp(p.mor+dd+(tgt-p.mor)*.08,0,100);
      if(t.id===G.user)requestCheck(p);
    }
  }
}
function requestCheck(p){
  if(p.mor>=34||(p.reqDay!=null&&p.reqDay>G.day-45))return;
  p.reqDay=G.day; const why=moraleWhy(p);
  if(p.mor<22&&p.pers.amb>=13&&!p.listed&&!p.foreign&&p.pers.temp>=13&&R()<.5)prLeak('p',p);
  if(p.mor<22&&p.pers.amb>=13&&!p.listed&&!p.foreign) mail(p.name,'트레이드 요청',`${why} 이대로라면 다른 팀에서 뛰고 싶습니다. 트레이드를 요청드립니다.`,{imp:true,ref:p.id,face:p.id,kind:'선수',acts:[{l:'트레이드 명단에 올리기',a:'listP',v:p.id},{l:'남아 달라고 설득',a:'keepP',v:p.id},{l:'선수 보기',a:'player',v:p.id}]});
  else mail(p.name,'면담 요청',`${why} 단장님과 이야기하고 싶습니다.`,{imp:true,ref:p.id,face:p.id,kind:'선수',acts:[{l:'면담하기',a:'player',v:p.id}]});
}
const TALK={praise:'칭찬하기',push:'분발 촉구',promise:'출전 기회 건의',contract:'계약 이야기',ask:'고민 묻기'};
/* 감독과의 대화: 단장이 자주 묻고, 감독이 현황과 원하는 보강을 말한다 */
function mgrWantForeign(){ const m=G.mgr[G.user]; if(!m)return null; const rk=slotRanks(G.user); const f=foreignOf(G.user).filter(p=>p.foreign==='용병'); const fp=f.filter(p=>p.isP).length, fb=f.length-fp;
  const fieldW=PSLOTS.filter(k=>k!=='SP'&&k!=='RP').sort((a,b)=>rk[b].rank-rk[a].rank)[0];
  let want; if(f.length>=3)want=null; else if(fp<2&&(rk.SP.rank>=4||fp===0))want={isP:true,k:'SP'}; else if(fb<1||rk[fieldW].rank>=6)want={isP:false,k:fieldW}; else want={isP:true,k:rk.RP.rank>rk.SP.rank?'RP':'SP'};
  if(!want)return {want:null,txt:'외국인 세 자리는 다 찼습니다. 지금 선수들로 가겠습니다.'};
  const style=want.isP?(m.pen>=60&&want.k==='RP'?'구위로 윽박지르는 불펜':m.arm>=60?'이닝을 길게 먹어 주는 선발':'제구가 되는 선발'):(m.small>=60?'출루와 주루가 되는 타자':'담장을 넘길 수 있는 거포');
  want.style=style; return {want,txt:want.isP?`${SLOTK[want.k]}이(가) 급합니다. ${style}이면 좋겠습니다. 우리 ${SLOTK[want.k]}은(는) 리그 ${rk[want.k].rank}위입니다.`:`${SLOTK[want.k]} 쪽 타자를 원합니다. ${style}이면 좋겠습니다. 지금 우리 ${SLOTK[want.k]}은(는) 리그 ${rk[want.k].rank}위입니다.`}; }
function mgrFitF(p,W){ if(!W||!W.want||!p)return false; if(W.want.isP!==!!p.isP)return false; if(p.isP)return W.want.k==='SP'?isSPr(p):true; return p.pos===W.want.k||(W.want.k==='DH'&&['1B','LF','RF'].includes(p.pos))||subsOf(p).includes(W.want.k); }
function mgrTalk(topic){ const m=G.mgr[G.user]; if(!m||m.interim)return {a:'감독이 없습니다.'}; mgrAttr(m); const nm=m.name; let a='';
  if(topic==='now'){ const r=G.sea&&G.sea.rec?G.sea.rec[G.user]:null; const st=period()==='season'?standingsNow():null; const rk=st?st.findIndex(x=>x.tid===G.user)+1:null; const d=depth(G.user);
    const inj=playersOf(G.user).filter(p=>p.injOut>0&&ovr(p)>=50).slice(0,3); const tired=period()==='season'?playersOf(G.user).filter(p=>(p.fat||0)>=60).slice(0,3):[];
    const cold=d.start.map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h&&x.h.pa>=60&&bRate(x.h).ops<.62).slice(0,2);
    const R=slotRanks(G.user); const weak=PSLOTS.filter(k=>k!=='DH').sort((x,y)=>R[y].rank-R[x].rank).slice(0,2);
    a=`${rk?`${r.w}승 ${r.l}패, ${rk}위입니다. `:''}가장 약한 자리는 ${weak.map(k=>`${SLOTK[k]}(리그 ${R[k].rank}위)`).join(', ')}입니다.${inj.length?` 부상: ${inj.map(p=>`${p.name} ${p.injOut}일`).join(', ')}.`:''}${tired.length?` 지친 선수: ${tired.map(p=>p.name).join(', ')}.`:''}${cold.length?` 타격이 안 풀리는 주전: ${cold.map(x=>`${x.p.name}(OPS ${fmt3(bRate(x.h).ops)})`).join(', ')}.`:''} 분위기는 ${m.rel>=60?'괜찮습니다':m.rel>=40?'나쁘지 않습니다':'솔직히 무겁습니다'}.`; }
  else if(topic==='foreign'){ const W=mgrWantForeign(); a=W?W.txt:''; G.mgrWant=W&&W.want?{y:G.year,day:G.day,...W.want}:null;
    const L=(G.fmarket||[]).map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.foreign==='용병'&&fKnows(G.user,p)&&mgrFitF(p,W)).sort((x,y)=>{ const v=r=>(r.ofp??r.cur+6)+r.cur*.2; return v(scoutReport(y))-v(scoutReport(x)); }).slice(0,3);
    if(L.length)a+=` 시장에서 눈에 띄는 건 ${L.map(p=>`${p.name}(${posLabel(p)}, ${p.nat||''})`).join(', ')} 정도입니다.`; }
  else if(topic==='need'){ const R=slotRanks(G.user); const k=PSLOTS.filter(x=>x!=='DH').sort((x,y)=>R[y].rank-R[x].rank)[0]; const d=depth(G.user); const cur=k==='SP'?d.sp[4]:k==='RP'?d.pen[3]:d.ln[k];
    a=`${SLOTK[k]}입니다. 리그 ${R[k].rank}위${cur?`이고 지금은 ${cur.name}(${Math.round(ovr(cur))})이(가) 맡고 있습니다`:''}. ${m.youth>=60?'내부에서 키울 선수가 있으면 기회를 주겠지만, ':''}트레이드든 외국인이든 한 명 있으면 확 달라집니다.`; }
  else if(topic==='young'){ const ys=playersOf(G.user).filter(p=>!p.foreign&&p.age<=24).map(p=>({p,rp:scoutReport(p)})).sort((x,y)=>(y.rp.ofp||0)-(x.rp.ofp||0)).slice(0,3);
    const up=x=>{ const h=seasonTotal(x.p,G.year,'1군'); return !!(h&&(x.p.isP?h.outs>=45:h.pa>=60)); }; const inU=ys.filter(up), outU=ys.filter(x=>!up(x));
    a=ys.length?`눈여겨보는 선수는 ${ys.map(x=>`${x.p.name}(${posLabel(x.p)}, ${x.p.age}세)`).join(', ')}입니다.${inU.length?` ${inU.map(x=>x.p.name).join(', ')}은(는) 이미 1군에서 자리를 잡아 가고 있습니다.`:''}${outU.length?` ${outU.map(x=>x.p.name).join(', ')}은(는) ${m.youth>=60?'기회를 더 주고 싶습니다.':'아직 1군에서 쓰기엔 이릅니다.'}`:''}`:'당장 1군에 올릴 만한 젊은 선수는 안 보입니다.'; }
  const wk=Math.floor(G.day/7); let rel=''; if(G.mgrTalkW!==wk){ G.mgrTalkW=wk; m.rel=clamp(m.rel+1,0,100); rel=' (자주 의논해 주셔서 감독 관계 +1)'; }
  (G.mgrChat=G.mgrChat||[]).unshift({d:G.day,t:topic,a:a.replace(/^/,'')}); if(G.mgrChat.length>8)G.mgrChat.length=8; return {a:`${nm} 감독: "${a}"${rel}`}; }
/* 선수단 미팅: 개별 면담 대신 팀 전체에 한 번에 말한다. 2주에 한 번 */
const TEAMTALK={cheer:'격려',push:'분발 촉구',rest:'부담 덜어 주기'};
function teamTalk(k){ if(G.ttDay!=null&&G.day-G.ttDay<14)return `선수단 미팅은 2주에 한 번 할 수 있습니다(${dmd(G.ttDay+14)}부터).`; const ps=playersOf(G.user); const m=G.mgr[G.user]; const r=G.sea&&G.sea.rec?G.sea.rec[G.user]:null; const bad=r&&r.l>r.w+3;
  G.ttDay=G.day; let msg='';
  if(k==='cheer'){ ps.forEach(p=>p.mor=clamp((p.mor??60)+(bad?4:2),0,100)); msg=`선수들 표정이 밝아졌습니다. 기분 +${bad?4:2}.`; }
  else if(k==='push'){ const ok=(m?m.rel:50)>=45&&R()<.65; ps.forEach(p=>p.mor=clamp((p.mor??60)-2,0,100)); if(ok){ G.form={until:G.day+10,b:.5}; msg='선수단이 긴장했습니다. 열흘간 집중력이 올라갑니다. 기분 -2.'; } else msg='선수들이 받아들이지 못했습니다. 기분 -2.'; }
  else { ps.forEach(p=>{ p.mor=clamp((p.mor??60)+1,0,100); p.fat=Math.max(0,(p.fat||0)-8); }); msg='훈련 강도를 낮췄습니다. 피로가 줄고 기분 +1.'; }
  return msg; }
function talk(id,kind){
  const p=G.players[id]; if(!p||p.team!==G.user)return {msg:'우리 선수만 면담할 수 있습니다.'};
  initPers(p); const wk=Math.floor(G.day/7);
  if(p.talkWk===wk)return {msg:`${p.name}: 이번 주에는 이미 이야기를 나눴습니다.`};
  p.talkWk=wk; G.tutFlags.talk=true;
  const h=curLine(p); const pf=perfOf(h,p.isP); const good=pf==null?null:pf>=ovr(p)+1.5?true:pf<=ovr(p)-3?false:null;
  let d=0, line='';
  if(kind==='praise'){ if(good===true){d=rnd(6,10);line='고맙습니다. 계속 잘하겠습니다.';} else if(good===false){ if(p.pers.temp>=14){d=-3;line='요즘 못하는 건 저도 압니다. 빈말은 괜찮습니다.';} else {d=2;line='감사합니다. 분발하겠습니다.';} } else {d=3;line='감사합니다. 힘이 됩니다.';} }
  if(kind==='push'){ if(good===false){ if(p.pers.pro>=12){d=4;p.form={until:G.day+21,b:1};line='맞는 말씀입니다. 훈련량을 늘리겠습니다.';} else {d=-7;line='저도 최선을 다하고 있습니다.';} } else {d=-9;line='제가 뭘 더 해야 합니까? 납득하기 어렵습니다.';} }
  if(kind==='promise'){ if(isRegular(p)){d=0;line='이미 주전으로 뛰고 있습니다. 마음만 받겠습니다.';} else if(p.promise){d=-2;line='지난번 약속부터 지켜 주세요.';} else {d=8;p.promise={until:G.day+30};line='감독님께 말씀해 주신다니 감사합니다. 기회가 오면 보여 드리겠습니다.';} }
  if(kind==='contract'){ d=1;
    if(p.foreign)line='재계약은 성적으로 말씀드리겠습니다.';
    else if(p.faC&&p.yrs>1)line='계약 기간이 남았으니 야구에만 집중하겠습니다.';
    else if(p.svc>=faSvc(p)-2)line=`FA까지 ${Math.max(0,faSvc(p)-p.svc)}년 남았습니다. ${p.pers.loy>=13?'가능하면 이 팀에서 오래 뛰고 싶습니다. 다년계약 제안이면 진지하게 듣겠습니다.':'솔직히 시장 평가도 받아 보고 싶습니다.'}`;
    else line=p.age<=24?'아직은 1군에서 자리 잡는 게 먼저입니다.':'좋은 대우를 받으려면 성적부터 내야죠.'; }
  if(kind==='ask'){ d=2; line=moraleWhy(p); }
  if(d<0&&p.pers.temp>=15)d*=1.4;
  p.mor=clamp(p.mor+d,0,100);
  return {msg:`${p.name}: "${line}"`,d};
}
function listPlayer(id){ const p=G.players[id]; if(!p)return; p.listed=true; p.mor=clamp(p.mor+6,0,100); note('면담',`${p.name}을(를) 트레이드 명단에 올렸습니다. 다른 구단이 관심을 보이면 제안이 올 수 있습니다.`,id); }
function keepPlayer(id){ const p=G.players[id]; if(!p)return; const ok=p.pers.loy>=11||R()<.35; p.mor=clamp(p.mor+(ok?8:-6),0,100); note('면담',ok?`${p.name}: "단장님 말씀을 믿고 한 번 더 해 보겠습니다."`:`${p.name}: "생각은 달라지지 않았습니다."`,id); }

/* ===== 감독 ===== */
const MCAR=['투수코치','타격코치','수비코치','작전·주루코치','배터리코치','수석코치','2군 감독'];
function mkMgr(){ const tac=ri(35,82); const fame=R()<.16?ri(70,92):ri(18,62); const ego=clamp(ri(20,85)+(fame>=70?12:0),20,95);
  return {id:'g'+Math.floor(R()*1e9),name:genName(),age:ri(44,63),small:ri(15,88),pen:ri(15,88),youth:ri(15,88),disc:ri(20,88),tac,ego,fame,rel:60,
  sal:round5(clamp(220+(tac-50)*9+Math.max(0,fame-55)*9+N(0,40),180,1200)),yrs:0,career:fame>=70?`${pick(['국가대표 출신 스타','레전드 투수 출신','레전드 타자 출신','우승 감독 출신'])} · 지도자 경력 ${ri(6,22)}년`:`${pick(MCAR)} 출신 · 지도자 경력 ${ri(6,22)}년`}; }
function mgrFix(m){ if(!m)return m; if(m.ego==null)m.ego=ri(20,85); if(m.fame==null)m.fame=ri(18,62); if(m.rel==null)m.rel=60; mgrAttr(m); return m; }
/* 운영 기조: 단장이 지시하고, 감독이 성향대로 받아들인다 */
const POL={win:{l:'성적 우선',lean:-1,d:'지금 이기는 데 집중합니다. 검증된 선수가 우선 출전합니다.'},bal:{l:'균형',lean:0,d:'성적과 육성을 함께 봅니다.'},youth:{l:'육성 우선',lean:1,d:'젊은 유망주에게 출전 기회를 줍니다. 당장 성적은 떨어질 수 있습니다.'}};
function mgrLean(m){ return clamp((m.youth-50)/40,-1,1); }
function teamLean(tid){ const m=mgrOf(tid);
  if(tid!==G.user){ const want=team(tid).mode==='rebuild'?.6:-.5; return clamp(want*.5+mgrLean(m)*.5,-1,1); }
  if(!G.policy)return mgrLean(m); const f=G.policy.follow??1; return clamp(POL[G.policy.k].lean*f+mgrLean(m)*(1-f),-1,1); }
function polBonus(tid,p,lean){ if(lean==null)lean=teamLean(tid); const pa=tid===G.user?pactB(p):0; if(Math.abs(lean)<.05)return pa;
  if(lean>0){ const gap=Math.max(0,p.pot-ovr(p)); return pa+lean*(p.age<=24?3+gap*.18:p.age<=26?1.5:p.age>=31?-1:0); }
  return pa-lean*(p.age>=28?1.5:p.age<=23?-1.5:0); }
/* 감독과의 유망주 기회 합의: 단장이 대상을 정하고 감독이 받아들인 만큼 기용에 반영된다. 매달 감독이 근거와 함께 보고한다 */
function pactB(p){ const P=G.pact; if(!P||P.y!==G.year||!P.on)return 0; const x=P.t.find(t=>t.id===p.id); return x?x.b:0; }
function pactPropose(ids){ const m=G.mgr[G.user]; if(!m||m.interim)return '감독이 없습니다.'; mgrAttr(m); ids=ids.filter(id=>G.players[id]&&G.players[id].team===G.user).slice(0,2); if(!ids.length)return '대상 선수를 고르세요.';
  const d=depth(G.user); const t=ids.map(id=>{ const p=G.players[id]; const k=pSlot(p); const st=k==='SP'?d.sp[4]:k==='RP'?d.pen[3]:d.ln[k]; const gap=st&&st.id!==p.id?ovr(st)-ovr(p):0;
    const ch=clamp(.7+(m.rel-60)/100+(m.youth-50)/90-(m.ego-50)/120-Math.max(0,gap)*.035,.08,.95); const r=R();
    const lv=r<ch?'full':r<ch+.25?'part':'no'; const b=lv==='full'?4:lv==='part'?1.6:0;
    const why=lv==='full'?`"${p.name}에게 꾸준히 기회를 주겠습니다."`:lv==='part'?`"${st?`${st.name}(${Math.round(ovr(st))})와 차이가 있어서`:'아직은'} 대타·대수비나 승부가 기운 경기 위주로 쓰겠습니다."`:`"지금 ${p.name}(${Math.round(ovr(p))})로는 ${st?`${st.name}(${Math.round(ovr(st))}) 자리를`:'1군 자리를'} 맡기기 어렵습니다. 2군에서 더 보겠습니다."`;
    const h=seasonTotal(p,G.year,'1군'); return {id,lv,b,why,s0:{pa:h?h.pa:0,outs:h?h.outs:0}}; });
  G.pact={y:G.year,on:true,day:G.day,mid:m.id,t,log:[]};
  return t.map(x=>`${G.players[x.id].name}: ${x.lv==='full'?'합의':x.lv==='part'?'부분 합의':'거절'} · ${x.why}`).join('\n'); }
function pactMonth(mo){ const P=G.pact; const m=G.mgr[G.user]; if(!P||P.y!==G.year||!P.on||!m||P.mid!==m.id||G.unemp)return; const L=[];
  for(const x of P.t){ const p=G.players[x.id]; if(!p||p.team!==G.user){ L.push('대상 선수가 팀을 떠났습니다.'); continue; } const h=seasonTotal(p,G.year,'1군'); const pa=(h?h.pa:0)-x.s0.pa, outs=(h?h.outs:0)-x.s0.outs; x.s0={pa:h?h.pa:0,outs:h?h.outs:0};
    const enough=p.isP?outs>=27:pa>=35; const amt=p.isP?`${ipStr(outs)}이닝`:`${pa}타석`; let r='';
    if(enough)r='약속대로 기회를 줬습니다.'; else if(p.injOut>0||(p.injHist||[]).some(z=>z.y===G.year&&z.d>=G.day-31))r='부상으로 쓰지 못했습니다.'; else if(!p.e1)r=x.lv==='no'?'합의 때 말씀드린 대로 2군에서 보고 있습니다.':'1군 엔트리 경쟁에서 밀렸습니다. 지금 능력으로는 다른 선수가 먼저입니다.'; else { const hh=h&&(p.isP?h.outs>=30:h.pa>=40)?h:null; r=hh?(p.isP?`부진(ERA ${pRate(hh).era.toFixed(2)})해서 비중을 줄였습니다.`:`부진(OPS ${fmt3(bRate(hh).ops)})해서 비중을 줄였습니다.`):'경기 상황상 기회가 적었습니다.'; }
    L.push(`${p.name}(${x.lv==='full'?'합의':x.lv==='part'?'부분 합의':'2군 육성'}): ${mo}월 1군 ${amt} · ${r}`); }
  if(!L.length)return; P.log.push({m:mo,L});
  mail('감독실',`${mo}월 유망주 기회 점검`,`${m.name} 감독의 보고입니다.\n\n${L.join('\n')}\n\n합의는 그대로 두거나, 대상을 바꾸거나, 끝낼 수 있습니다. 결과만으로 자동 평가하지 않습니다.`,{kind:'감독',acts:[{l:'합의 유지',a:'pactKeep',v:''},{l:'대상 바꾸기',a:'go',v:'staff:pact'},{l:'합의 끝내기',a:'pactEnd',v:''}]}); }
function setPolicy(k){
  const m=G.mgr[G.user]; if(!m)return {msg:'감독이 없습니다.'};
  if(G.policy&&G.policy.k===k)return {msg:'이미 그 기조입니다.'};
  if(G.policy&&G.day-G.policy.day<14)return {msg:`운영 기조는 2주에 한 번만 바꿀 수 있습니다. (${dmd(G.policy.day+14)}부터)`};
  mgrFix(m); const diff=Math.abs(POL[k].lean-mgrLean(m));
  let s=1-diff*.32-(m.ego-50)/55-(m.fame-50)/110+(m.rel-60)/90+(G.policy?-.05:0);
  const follow=clamp(s,.12,1); G.policy={k,day:G.day,follow};
  let msg;
  if(follow>=.8){ msg=`${m.name} 감독: 알겠습니다. ${POL[k].l} 기조로 운영하겠습니다.`; m.rel=clamp(m.rel+2,0,100); }
  else if(follow>=.5){ msg=`${m.name} 감독: 취지는 이해합니다. 다만 현장 상황을 보면서 일부만 반영하겠습니다.`; }
  else { msg=`${m.name} 감독: 선수 기용은 감독의 권한입니다. 제 방식대로 하겠습니다.`; m.rel=clamp(m.rel-6,0,100); if(m.fame>=70||m.ego>=75)prLeak('mgr',null,`${m.name} 감독 "기용은 감독 권한"… 프런트와 엇박자`); }
  mail('감독실',`운영 기조 지시: ${POL[k].l}`,`${msg}\n\n감독 수용도 ${Math.round(follow*100)}%. 실제 운영은 지시와 감독 본래 성향(${mgrLean(m)>.2?'육성 쪽':mgrLean(m)<-.2?'성적 쪽':'균형'})이 섞여 정해집니다.`,{kind:'감독'});
  addLog(`운영 기조를 ${POL[k].l}(으)로 지시했습니다. 감독 수용도 ${Math.round(follow*100)}%.`);
  return {msg,follow};
}
function mgrStyle(m){ const t=[]; t.push(m.small>=62?'스몰볼':m.small<=38?'빅볼':'균형 공격'); t.push(m.pen>=62?'불펜 적극 운용':m.pen<=38?'선발에 긴 이닝':'보통 투수 운용'); if(m.youth>=62)t.push('육성형'); if(m.disc>=65)t.push('강한 장악력'); else if(m.disc<=35)t.push('자율형'); return t.join(' · '); }
function refreshMgrMarket(){ G.mmarket=[1,2,3,4,5].map(mkMgr); if(!G.mmarket.some(m=>m.fame>=70)){ for(let i=0;i<60;i++){ const m=mkMgr(); if(m.fame>=70){ G.mmarket[0]=m; break; } } } G.mmarket.forEach(m=>m.clan=mkClan(m)); try{ if(G.ob)for(const ob of obMgrCands().sort((a,b)=>b.fame-a.fame).slice(0,2))G.mmarket.push(obMgr(ob)); }catch(e){} }
function hireMgr(id,years,withClan){
  const m=(G.mmarket||[]).find(x=>x.id===id); if(!m)return '후보가 없습니다.';
  const cur=G.mgr[G.user]; if(G.coach&&cur&&!cur.interim){ const gone=clanLeave(cur); if(gone.length)addLog(`${cur.name} 감독 사단이 함께 떠났습니다: ${gone.join(', ')}`); }
  if(cur&&!cur.interim){ const pay=Math.round(cur.sal*Math.max(0,cur.yrs-.5)); G.spend.mgr+=pay; addLog(`${cur.name} 감독을 경질했습니다. 잔여 연봉 ${money(pay)}.`); }
  m.yrs=years; G.mgr[G.user]=m; G.mmarket=G.mmarket.filter(x=>x.id!==id);
  if(G.coach&&withClan&&m.clan&&m.clan.length){ const got=hireClan(m,years); if(got.length)note('감독',`${m.name} 감독 사단이 함께 왔습니다: ${got.join(', ')}. 감독과 손발이 맞아 제 실력보다 더 잘 해낼 것입니다.`); }
  addLog(`${m.name} 감독과 ${years}년 연 ${money(m.sal)}에 계약했습니다.`); chron('mgr',`${m.name} 감독 선임 (${years}년)`);
  mail('운영팀',`${m.name} 감독 선임`,`${m.name} 감독과 ${years}년 연 ${money(m.sal)}에 계약했습니다. ${mgrStyle(m)} 성향입니다.`,{kind:'감독'});
  wire('감독',`${tname(G.user)}, ${m.name} 감독 선임`,{tid:G.user,x:{mid:m.id,hire:1}});
  mgrFix(m); m.rel=60; G.policy=null; try{ obHireBonus(m.ob,'감독'); }catch(e){} if(m.fame>=70){ const t=team(G.user); t.pop=clamp(t.pop+(m.fame-60)/400,0,1.5); note('감독',`스타 감독 ${m.name} 선임 소식에 팬들의 관심이 커졌습니다. 구단 인기가 올랐습니다.`); }
  for(const p of playersOf(G.user)){ initPers(p); p.mor=clamp(p.mor+(m.disc-50)/10+(m.fame>=70?3:0),0,100); }
  return '';
}
function fireMgr(){ const cur=G.mgr[G.user]; if(!cur||cur.interim)return; if(G.coach){ const gone=clanLeave(cur); if(gone.length)addLog(`${cur.name} 감독 사단이 함께 떠났습니다: ${gone.join(', ')}`); } const pay=Math.round(cur.sal*Math.max(0,cur.yrs-.5)); G.spend.mgr+=pay;
  addLog(`${cur.name} 감독을 경질했습니다. 잔여 연봉 ${money(pay)}.`); chron('mgr',`${cur.name} 감독 경질`);
  G.mgr[G.user]={id:'interim',name:'수석코치(감독대행)',age:50,small:50,pen:50,youth:50,disc:42,tac:45,sal:150,yrs:1,career:'감독대행',interim:true};
  for(const p of playersOf(G.user))p.mor=clamp(p.mor-4,0,100);
  wire('감독',`${tname(G.user)}, ${cur.name} 감독 경질`,{tid:G.user,x:{fire:1,nm:cur.name}});
  stop('감독',`${cur.name} 감독을 경질했습니다. 남은 기간은 수석코치가 감독대행을 맡습니다. 새 감독은 스태프·육성 → 감독에서 선임하세요.`); }
/* 감독 자진 사퇴: 잔여 연봉·경질 기사·선수 기분 하락 없이 감독대행 체제로 */
function resignMgr(){ const cur=G.mgr[G.user]; if(!cur||cur.interim)return; if(G.coach){ const gone=clanLeave(cur); if(gone.length)addLog(`${cur.name} 감독 사단이 함께 떠났습니다: ${gone.join(', ')}`); }
  addLog(`${cur.name} 감독이 자진 사퇴했습니다. 잔여 연봉은 없습니다.`); chron('mgr',`${cur.name} 감독 자진 사퇴`);
  G.mgr[G.user]={id:'interim',name:'수석코치(감독대행)',age:50,small:50,pen:50,youth:50,disc:42,tac:45,sal:150,yrs:1,career:'감독대행',interim:true};
  wire('감독',`${tname(G.user)}, ${cur.name} 감독 자진 사퇴`,{tid:G.user,x:{fire:1,nm:cur.name}}); }
const mgrOf=tid=>G.mgr[tid]||{small:50,pen:50,youth:50,disc:45,tac:45};

/* ===== 2군 연수 ===== */
const DEVP={bat:{l:'타격 집중',k:['con','eye'],P:false},pow:{l:'장타력 강화',k:['pow'],P:false},run:{l:'주루·수비',k:['spd','def'],P:false},stf:{l:'구위 강화',k:['stf'],P:true},ctl:{l:'제구 교정',k:['ctl'],P:true},sta:{l:'체력·선발 전환',k:['sta'],P:true}};
const OVS={jp:{l:'일본 교육리그',c:50,d:'가을 교육리그에서 실전 경험을 쌓습니다.',inj:.02},au:{l:'호주리그 파견',c:80,d:'겨울 동안 호주 프로리그에서 뜁니다. 실전이 많지만 부상 위험이 조금 있습니다.',inj:.06},us:{l:'미국 연수',c:120,d:'미국 훈련 시설에서 기술과 체계를 배웁니다.',inj:.01}};
function ovsOpen(){ const per=period(); return per==='off'||per==='post'||(per==='season'&&G.day>=KD(9,1)); }
function setDev(id,prog){ G.devProg=(G.devProg||[]).filter(x=>x.pid!==id); if(prog){ if(G.devProg.length>=6)return '2군 연수는 6명까지입니다.'; G.devProg.push({pid:id,prog,since:G.day}); } return ''; }
function setOvs(id,prog){ { const prev=(G.ovs||[]).find(x=>x.pid===id); if(prev&&OVS[prev.prog])G.spend.dev=Math.max(0,(G.spend.dev||0)-OVS[prev.prog].c); } /* 떠나기 전에 바꾸거나 취소하면 비용을 돌려받는다 */ G.ovs=(G.ovs||[]).filter(x=>x.pid!==id); if(prog){ if(G.ovs.length>=4)return '해외 연수는 4명까지입니다.'; G.ovs.push({pid:id,prog}); G.spend.dev+=OVS[prog].c; addLog(`${G.players[id].name}을(를) ${OVS[prog].l}에 보냅니다(비용 ${money(OVS[prog].c)}).`); } return ''; }
function devWeek(){
  G.devProg=(G.devProg||[]).filter(x=>{ const p=G.players[x.pid]; return p&&p.team===G.user; });
  const m=mgrOf(G.user); const yf=1+(m.youth-50)/120;
  for(const x of G.devProg){ const p=G.players[x.pid]; const pr=DEVP[x.prog]; if(p.age>28)continue;
    const half=isRegular(p)?.5:1; const room=Math.max(0,p.pot-ovr(p));
    for(const k of pr.k){ const cap=Math.max(p.pot,ovr(p))+8; if(p.r[k]>=cap)continue; p.r[k]=clamp(p.r[k]+rnd(.06,.16)*half*yf*(room>0?1:.35),20,80); }
    roundR(p); }
}
function ovsApply(){
  const out=[];
  for(const x of (G.ovs||[])){ const p=G.players[x.pid]; if(!p||p.team!==G.user)continue; const o=OVS[x.prog]; const gap=Math.max(0,p.pot-ovr(p));
    const g=rnd(.6,1.6)*Math.min(1,gap/5+.35);
    for(const k in p.r)p.r[k]=clamp(p.r[k]+g*rnd(.6,1.3),20,80); roundR(p);
    let msg=`${p.name}이(가) ${o.l}을 마치고 돌아왔습니다.`; if(R()<o.inj){ p.injOut=ri(10,40); msg+=` 연수 중 부상으로 약 ${p.injOut}일 재활이 필요합니다.`; } else msg+=' 코치진이 성장을 확인했습니다.';
    out.push(msg); }
  G.ovs=[]; if(out.length)mail('육성팀','해외 연수 결과',out.join('\n'),{kind:'연수'});
}

/* ===== 부상 방지와 병원 ===== */
const PREV=[{l:'없음',c:0,m:1},{l:'기본',c:500,m:.9},{l:'강화',c:1200,m:.8},{l:'최고 수준',c:2200,m:.7}];
const HOSP={none:{name:'제휴 없음',c:0,rec:0,dx:false,d:'부상 때마다 외부 병원을 이용합니다.'},c:{name:'다온재활병원',c:400,rec:.08,dx:false,d:'재활 위주. 재활 기간이 조금 줄어듭니다.'},b:{name:'청명정형외과',c:700,rec:.12,dx:false,d:'정형외과 전문. 재활 기간이 줄어듭니다.'},a:{name:'새봄스포츠의학센터',c:1500,rec:.25,dx:true,d:'종합 스포츠의학. 재활 기간이 크게 줄고, 정밀 검진으로 선수의 부상 체질을 알려 줍니다.'}};
function injMult(p){ return (p.team===G.user?(G.campInj||1)*PREV[G.med.prev].m*(1-facOf('weight')*.05):1)*(p.rush&&G.day<=p.rush?3:1); }
function recMult(p){ return p.team===G.user?(1-HOSP[G.med.hosp].rec)*(1-facOf('rehab')*.07):1; }
function facWeek(){ const dl=facOf('dorm'); if(!dl||G.unemp)return; for(const p of domestic(G.user))if(p.age<=23&&(p.mor??60)<75)p.mor=clamp((p.mor??60)+dl*.3,0,75); }
function dailyCost(){ const m=G.mgr[G.user]; if(m)G.spend.mgr+=m.sal/365; if(G.coach)G.spend.coach=(G.spend.coach||0)+coachSal(G.user)/365; G.spend.med+=PREV[G.med.prev].c/365; G.spend.hosp+=HOSP[G.med.hosp].c/365; G.spend.intl=(G.spend.intl||0)+sum(Object.keys(IREG).map(r=>INET[intlLv(r)].c))/365; G.spend.fac=(G.spend.fac||0)+facUpkeep()/365; G.spend.data=(G.spend.data||0)+anaSal()/365;
  try{ facDaily(); }catch(e){}
  if(G.fac&&G.fac.build&&G.day>=G.fac.build.done){ G.fac.lv=G.fac.build.lv; G.fac.build=null; mail('육성팀','훈련 시설 완공',`훈련 시설이 ${FAC[G.fac.lv].l}(${G.fac.lv}단계)로 완공되었습니다. 다음 겨울 성장부터 반영됩니다.`,{kind:'일반'}); } }
function buildFac(){ const lv=facLv(G.user); if(lv>=5||(G.fac&&G.fac.build))return '이미 공사 중이거나 최고 단계입니다.'; const c=FAC_COST[lv+1]; const t=team(G.user); if(t.cash<c)return `자금이 부족합니다. 공사비 ${money(c)}가 필요합니다.`; t.cash-=c; G.fac.build={lv:lv+1,done:G.day+FAC_DAYS[lv+1]}; addLog(`훈련 시설 ${lv+1}단계 공사를 시작했습니다(공사비 ${money(c)}, ${FAC_DAYS[lv+1]}일).`); t.trust=clamp(t.trust+1,0,100); return ''; }

/* ===== 얼굴 (faces.js, Apache-2.0 · ZenGM) ===== */
const FACEC=new Map();
function seededRand(seed){ let h=2166136261>>>0; const s=String(seed); for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;} return ()=>{ h=Math.imul(h^(h>>>15),2246822507)>>>0; h=Math.imul(h^(h>>>13),3266489909)>>>0; h^=h>>>16; return (h>>>0)/4294967296; }; }
function hslHex(h,s,l){ s/=100;l/=100; const k=n=>(n+h/30)%12, a=s*Math.min(l,1-l); const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1)); return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join(''); }
const u01=(k,id)=>clamp((hn(k,id)+3)/6,0,.9999);
function raceOf(o){ if(o==='sec')return 'asian'; const nat=o.nat; if(!o.foreign||nat==='일본'||nat==='대만')return 'asian'; const u=u01('race',o.id);
  if(nat==='호주')return u<.8?'white':'brown'; if(nat==='미국')return u<.5?'white':u<.8?'black':'brown'; return u<.15?'white':u<.55?'brown':'black'; }
function moodMouth(m){ return m>=74?'smile':m>=62?'smile-closed':m>=46?null:m>=32?'straight':'angry'; }
const ageB=a=>a==null?0:a<=23?0:a<=29?1:a<=33?2:3;
function faceKey(o){ return o==='sec'?'sec':o.persona?'P:'+o.persona+':'+o.pid+':'+(o.team??'x')+':'+(o.expr||''):o.id+':'+(o.team??'x')+':'+(moodMouth(o.mor??60)||'n')+':'+ageB(o.age); }
function faceSVG(o){
  const key=faceKey(o); if(FACEC.has(key))return FACEC.get(key);
  let out='';
  try{ if(typeof window!=='undefined'&&window.FJS){
    const orig=Math.random; let f;
    const seed=o==='sec'?'sec':o.persona?(G&&G.obFace&&G.obFace[o.pid]!=null?G.obFace[o.pid]:'P'+o.pid):o.id; Math.random=seededRand('face'+seed);
    try{ f=window.FJS.generate(undefined,{race:o.persona?'asian':raceOf(o),gender:o==='sec'||o.female?'female':'male'}); } finally{ Math.random=orig; }
    if(o.persona){ const t=o.team!=null&&G.teams[o.team]?G.teams[o.team]:null; const rr=seededRand('pz'+o.pid); const tp=t?tpal(t):null; const dk=t?tp[2]:'#26313c', mid=t?tp[0]:'#4b5b6c';
      if(o.persona==='mgr'||o.persona==='coach'){ f.teamColors=[mid,mid,tp&&tp[1]!=='#ffffff'?tp[1]:'#f2f4f6']; f.jersey={id:t?['baseball','baseball2','baseball3','baseball4'][t.id%4]:'baseball'}; f.accessories={id:'hat'}; }
      else { f.accessories={id:'none'}; f.jersey={id:'jersey3'}; f.teamColors=o.persona==='doc'?['#e9eef2','#c9d3da','#7a8794']:o.persona==='own'?['#1d2733','#11161c','#c9a24a']:o.persona==='agent'?['#15191e','#0b0e11','#9aa6b2']:[dk,'#11161c',mid]; }
      if((o.age||45)>=52&&f.hair){ f.hair.color=['#8d8d8d','#a7a7a7','#6e6e6e'][Math.floor(rr()*3)]; }
      f.glasses={id:o.persona==='doc'||rr()<.22?'glasses2-black':'none'}; if(!o.female&&rr()<.5)f.facialHair={id:'none'};
      f.fatness=(f.fatness||.3)*.8; const m0=rr()<.5?'smile-closed':'closed'; f.mouth={id:o.expr==='smile'?'smile':o.expr==='angry'?'angry':o.expr==='flat'?'straight':m0,flip:false}; }
    else if(o==='sec'){ f.jersey={id:'jersey3'}; f.teamColors=['#4b5b6c','#e3e9ee','#2a3642']; f.accessories={id:'none'}; f.glasses={id:'none'}; }
    else {
      const t=o.team!=null&&G.teams[o.team]?G.teams[o.team]:null;
      f.teamColors=t?[tpal(t)[0],tpal(t)[0],tpal(t)[1]==='#ffffff'?'#f2f4f6':tpal(t)[1]]:o.schoolHue!=null?[hslHex(o.schoolHue,42,36),'#f2f4f6',hslHex(o.schoolHue,40,20)]:['#6b7785','#3a4652','#e3e9ee'];
      f.jersey={id:t?['baseball','baseball2','baseball3','baseball4'][t.id%4]:'baseball'};
      f.accessories={id:'hat'}; f.glasses={id:u01('gl',o.id)>.94?'glasses2-black':'none'};
      if(raceOf(o)==='asian'&&u01('fh',o.id)>.12)f.facialHair={id:'none'};
      f.fatness=(f.fatness||.3)*.55;
      const mm=moodMouth(o.mor??60); if(mm)f.mouth={id:mm,flip:false};
      /* 나이에 따라 얼굴이 변한다: 해가 갈수록 눈가·이마 주름이 생긴다 */
      const ab=ageB(o.age), ra=seededRand('age'+o.id);
      if(ab===0){ f.eyeLine={id:'none'}; f.smileLine={id:'none',size:1}; f.miscLine={id:ra()<.12?'freckles1':'none'}; }
      else if(ab===1){ f.eyeLine={id:ra()<.4?'line1':'none'}; f.smileLine={id:'none',size:1}; f.miscLine={id:'none'}; }
      else if(ab===2){ f.eyeLine={id:['line1','line2'][Math.floor(ra()*2)]}; f.smileLine={id:'line1',size:1}; f.miscLine={id:ra()<.35?'forehead1':'none'}; }
      else { f.eyeLine={id:['line3','line4','line5','line6'][Math.floor(ra()*4)]}; f.smileLine={id:['line2','line3','line4'][Math.floor(ra()*3)],size:1}; f.miscLine={id:['forehead2','forehead3','forehead4','chin1'][Math.floor(ra()*4)]}; f.fatness=Math.min(1,(f.fatness||.2)+.08); }
    }
    out='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(window.FJS.faceToSvgString(f));
  } }catch(err){ out=''; }
  FACEC.set(key,out); return out;
}
function offseasonMgr(){
  try{ obYear(); }catch(e){}
  if(G.coach)coachYear(); try{ gmTurnover(); }catch(e){}
  for(const t of G.teams){ const m=G.mgr[t.id]; if(!m)continue; m.yrs--; if(m.age)m.age++;
    if(t.id!==G.user&&m.yrs<=0){ if(R()<.6)m.yrs=2; else { const n=(()=>{ try{ return obAiMgr(t.id); }catch(e){ return null; } })()||mkMgr(); n.yrs=n.yrs||ri(2,3); G.mgr[t.id]=n; n.clan=n.ob?[]:mkClan(n); if(G.coach&&G.coach[t.id])for(const c of n.clan){ c.yrs=n.yrs; G.coach[t.id][c.role]=c; } wire('감독',`${tname(t.id)}이(가) ${n.name} 감독을 새로 선임했습니다.`,{tid:t.id,x:{mid:n.id,hire:1}}); } } }
  refreshMgrMarket();
  const m=G.mgr[G.user];
  if(m&&!m.interim&&m.yrs<=0) mail('운영팀','감독 계약이 끝납니다',`${m.name} 감독의 계약이 올해로 끝납니다. 재계약하거나 새 감독을 선임해야 합니다. 연말까지 정하지 않으면 감독 자리가 비게 됩니다.`,{imp:true,kind:'감독',acts:[{l:'2년 재계약',a:'renewMgr',v:'2'},{l:'감독 후보 보기',a:'goWork',v:'감독'}]});
}
function renewMgr(y){ const m=G.mgr[G.user]; if(!m||m.interim)return; m.yrs=+y; m.sal=round5(m.sal*1.1); addLog(`${m.name} 감독과 ${y}년 재계약했습니다(연 ${money(m.sal)}).`); }

/* ===== 인물 관계도: 구단주·사장·감독·코치·선수·타 구단 단장·팬·언론 ===== */
function nameH(k){ for(let i=0;i<9;i++){ const a=u01(k+'s'+i,7),b=u01(k+'a'+i,11),c=u01(k+'b'+i,13); const n=SUR[Math.floor(a*SUR.length)]+G1[Math.floor(b*G1.length)]+G2[Math.floor(c*G2.length)]; if(!BLOCK.has(n)&&n[1]!==n[2])return n; } return SUR[0]+'도윤'; }
const OWNTRAIT={win:'우승 트로피를 직접 들고 싶어 합니다. 성적이 나면 지갑을 엽니다.',profit:'숫자에 밝습니다. 적자 보고서를 가장 먼저 펼쳐 봅니다.',pr:'그룹 이미지와 관중석을 봅니다. 화제가 되는 구단을 원합니다.'};
function bossOf(tid){ G.boss=G.boss||{}; const k=tid??G.user; if(!G.boss[k]){ const s='boss'+k+':'+(team(k).code||k);
    G.boss[k]={own:{name:nameH(s+'o'),age:58+Math.floor(u01(s,'oa')*18),id:'own'+k},ceo:{name:nameH(s+'c'),age:52+Math.floor(u01(s,'ca')*12),id:'ceo'+k,car:['그룹 전략실 출신','재무 담당 임원 출신','마케팅 임원 출신','계열사 대표 출신'][Math.floor(u01(s,'cc')*4)]}}; }
  return G.boss[k]; }
/* 단장별 월 협상 횟수: 친분이 높으면 1회 더, 낮으면 1회 덜 */
function negCap(tid){ const r=team(tid).rel; return NEG_MONTH+(r>=70?1:0)-(r<30?1:0); }
/* 주간 관계 스냅샷: 최근 4주 변화 표시용 */
function relSnap(){ prInit(); const m=G.mgr[G.user]; const s={d:G.day,own:team(G.user).trust,mgr:m?m.rel:null,fan:Math.round(G.pr.fan),press:Math.round(G.pr.press),gm:G.teams.map(t=>t.rel)};
  G.relHist=G.relHist||[]; G.relHist.push(s); if(G.relHist.length>10)G.relHist.shift(); }
function relNow(k){ prInit(); if(k==='own')return team(G.user).trust; if(k==='mgr'){ const m=G.mgr[G.user]; return m?m.rel:null; } if(k==='fan')return Math.round(G.pr.fan); if(k==='press')return Math.round(G.pr.press); if(k.startsWith('gm:'))return team(+k.slice(3)).rel; return null; }
function relDelta(k){ const H=G.relHist||[]; if(!H.length)return 0; const base=H.find(s=>s.d>=G.day-30)||H[H.length-1]; const now=relNow(k); if(now==null)return 0;
  const was=k.startsWith('gm:')?base.gm[+k.slice(3)]:base[k]; return was==null?0:Math.round(now-was); }

/* 구단 선택 화면용 미리보기: 예상 순위와 팀 특징 */
function worldPreview(){ const H=G.history[G.history.length-1]; const st=H.order; const n=G.teams.length;
  return G.teams.map(t=>{ const rk=slotRanks(t.id); const ps=playersOf(t.id).filter(p=>!p.ys); const dom=ps.filter(p=>!p.foreign);
    const sl=PSLOTS.map(k=>({k,r:rk[k].rank})).sort((a,b)=>a.r-b.r);
    const top=[...dom].sort((a,b)=>ovr(b)-ovr(a)).slice(0,2).map(p=>({id:p.id,name:p.name,pos:posLabel(p),o:Math.round(ovr(p)),age:p.age}));
    const rec=st.find(x=>x.tid===t.id); const ci=capInfo(t.id); const ageAvg=avg(dom.map(p=>p.age));
    const young=dom.filter(p=>p.age<=24&&ovr(p)>=45).length; const vets=dom.filter(p=>p.age>=33&&ovr(p)>=50).length; const faSoon=dom.filter(p=>p.svc>=FA_SVC-1&&!p.faC&&ovr(p)>=52).length;
    const pr=G.proj.indexOf(t.id)+1;
    return {tid:t.id,proj:pr,prev:st.findIndex(x=>x.tid===t.id)+1,w:rec?rec.w:0,l:rec?rec.l:0,expW:t.expW,owner:t.owner,indie:!!t.indie,market:t.market,
      best:sl.slice(0,2).map(x=>[x.k,x.r]),worst:sl.slice(-2).reverse().map(x=>[x.k,x.r]),top,age:+ageAvg.toFixed(1),young,vets,faSoon,pay:ci.pay,cap:ci.cap,cash:t.cash,
      mode:pr<=3?'우승 후보':pr<=6?'중위권':'하위권'}; }); }

/* ===== OB: 은퇴 선수의 두 번째 인생 (코치·스카우트·프런트·해설 → 감독·단장) ===== */
const OBPATH={coach:'지도자',scout:'스카우트',front:'프런트',media:'해설위원'};
function obInit(){ if(G.ob)return; G.ob=[]; G.obFace=G.obFace||{}; G.obSeq=G.obSeq||0;
  // 리그 초창기 레전드: 구단마다 2명, 일부는 이미 지도자·프런트로 일하고 있다
  for(const t of G.teams)for(let i=0;i<2;i++){ const war=+(i===0?rnd(18,72):rnd(8,30)).toFixed(1); const retY=G.year-ri(1,12); const isP=R()<.45;
    const ob=obMake({fid:'obs'+t.id+'_'+i,name:genName(),isP,pos:isP?(R()<.6?'선발':'불펜'):pick(['포수','1루수','2루수','3루수','유격수','좌익수','중견수','우익수']),team:t.id,ys:i===0?ri(10,17):ri(6,12),war,seasons:ri(10,18),age:retY>0?G.year-retY+ri(34,39):40,retY,awards:war>=26?ri(1,4):0,cat:!isP&&R()<.15});
    ob.cy=ob.path==='coach'?Math.max(0,G.year-retY-1):0; ob.sy=ob.path==='scout'?G.year-retY:0; ob.fy=ob.path==='front'?G.year-retY:0; ob.my=ob.path==='media'?G.year-retY:0;
    ob.sk=clamp(ob.sk+Math.min(8,ob.cy),30,82); ob.dv=clamp(ob.dv+Math.min(8,ob.cy),30,82); }
  // 이미 일자리가 있는 OB: 다른 구단 코치·프런트
  for(const ob of G.ob){ if(G.year<ob.readyY)continue;
    if(ob.path==='coach'&&G.coach&&R()<.65){ const tids=G.teams.filter(t=>t.id!==G.user).map(t=>t.id); const tid=R()<.5&&ob.team!==G.user?ob.team:pick(tids); const c=obCoach(ob); c.yrs=ri(1,3); G.coach[tid][c.role]=c; }
    else if(ob.path==='front'||ob.path==='scout'){ const tid=ob.team!==G.user?ob.team:pick(G.teams.filter(t=>t.id!==G.user)).id; ob.alt={k:'front',tid,t:`${tshort(tid)} ${ob.path==='scout'?'스카우트':'프런트'}`}; } }
  // 우리 구단 첫 레전드에게는 영구결번이 있을 수도 있다
  const mineOB=G.ob.filter(o=>o.team===G.user).sort((a,b)=>b.war-a.war)[0];
  if(mineOB&&mineOB.war>=retWarT()&&mineOB.ys>=10&&!(G.retNos||[]).length){ mineOB.no=1+Math.floor(u01('jno',mineOB.fid)*99); (G.retNos=G.retNos||[]).push({name:mineOB.name,no:mineOB.no,y:mineOB.retY,ob:mineOB.id}); mineOB.retNo=true; } }
function obMake(o){ G.obSeq=(G.obSeq||0)+1; const pers=o.pers||{pro:ri(4,20),amb:ri(4,20),loy:ri(4,20),temp:ri(4,20)};
  const fame=Math.round(clamp((o.hof?86:o.war>=24||o.awards>=2?72:30)+o.war*.6+N(0,4),25,95));
  const w=[['coach',4+(o.cat?3:0)+pers.pro/5],['scout',2+(pers.pro<10?1:0)],['front',1.5+pers.amb/8],['media',2+(fame>=70?2:0)]]; let x=R()*sum(w.map(a=>a[1])), path='coach'; for(const [k,v] of w){ x-=v; if(x<=0){ path=k; break; } }
  const aim=pers.amb>=13?(path==='coach'||path==='media'?'mgr':'gm'):null;
  const ob={id:'ob'+G.obSeq,fid:o.fid,name:o.name,isP:o.isP,pos:o.pos,team:o.team,ys:o.ys||0,mine:o.team===G.user,war:o.war||0,seasons:o.seasons||0,awards:o.awards||0,hof:!!o.hof,
    retY:o.retY,age:o.age,pers,fame,path,aim,sk:Math.round(clamp(44+Math.min(10,o.war*.3)+(o.cat?4:0)+pers.pro*.35+N(0,4),32,72)),dv:Math.round(clamp(44+pers.pro*.5+pers.loy*.15+N(0,5),32,72)),
    sc:clamp(Math.round(1.5+pers.pro/8+R()),1,5),readyY:o.retY+(path==='media'?ri(2,5):path==='coach'?(R()<.5?0:1):0),cy:0,sy:0,fy:0,my:0,bond:o.team===G.user?10:0,log:[]};
  G.ob.push(ob); return ob; }
function obFromPlayer(p,rec){ if(!G.ob)obInit(); const c=careerOf(p); let war=rec?rec.war:+c.war.toFixed(1); let seasons=rec?rec.seasons:c.seasons.size; const by=c.byTeam[p.team]; let ys=by?by.ys.size:0;
  if(rec&&rec.mine&&p.team===G.user)ys=Math.max(ys,rec.mine.ys);
  const miss=Math.max(0,(p.svc||0)-seasons); if(miss){ seasons+=miss; war=+(war+miss*clamp((p.pot-45)/5,0,4.5)).toFixed(1); if(c.teams.size<=1)ys+=miss; } /* 기록이 남기 전(게임 시작 전) 경력은 연차와 잠재력으로 추정 */
  if(seasons<5&&war<5&&!(p.team===G.user&&ys>=3))return null; initPers(p);
  const ob=obMake({fid:p.id,name:p.name,isP:p.isP,pos:posLabel(p),team:p.team,ys,war,seasons,age:p.age,retY:G.year,awards:(p.aw||[]).length,hof:rec&&rec.hof,cat:!p.isP&&p.pos==='C',pers:{...p.pers}});
  ob.mineWar=rec&&rec.mine?rec.mine.war:p.team===G.user?+(war*(ys/Math.max(1,seasons))).toFixed(1):c.byTeam[G.user]?+c.byTeam[G.user].war.toFixed(1):0; ob.no=jno(p); if(rec&&rec.canRetNo)ob.canRetNo=G.legends.length-1; return ob; }
/* 지금 어디서 무엇을 하는가 */
function obWhere(ob){ for(const t of G.teams){ const m=G.mgr[t.id]; if(m&&m.ob===ob.id)return {k:'mgr',tid:t.id,t:`${t.city} ${t.nick} 감독`}; if(t.gm&&t.gm.ob===ob.id)return {k:'gm',tid:t.id,t:`${t.city} ${t.nick} 단장`};
    const C=G.coach&&G.coach[t.id]; if(C)for(const r of CKEYS)if(C[r]&&C[r].ob===ob.id)return {k:'coach',tid:t.id,role:r,t:`${t.city} ${t.nick} ${CROLE[r].l}`}; }
  if((G.scouts||[]).some(s=>s.ob===ob.id))return {k:'scout',tid:G.user,t:`${tshort(G.user)} 스카우트`};
  if(G.year<ob.readyY)return {k:'wait',t:ob.path==='media'?'해설위원':ob.path==='coach'?'지도자 연수 중':'휴식 중'};
  if(ob.alt)return {k:ob.alt.k,tid:ob.alt.tid,t:ob.alt.t};
  return {k:'free',t:ob.path==='media'?'해설위원':`${OBPATH[ob.path]} 자리를 찾는 중`}; }
function obRole(ob){ if(ob.isP)return ob.cy>=6?'hc':ob.cy<2&&R()<.5?'fp':'pc'; if(ob.pos==='포수')return 'cc'; const r=pick(['bc','bc','dc','rc','fb']); return ob.cy>=6&&R()<.4?'hc':r; }
function obCoach(ob){ const role=obRole(ob); const c={id:'c'+ob.id,name:ob.name,age:ob.age,role,sk:ob.sk,dv:ob.dv,car:`${tshort(ob.team)} ${ob.hof?'명예의 전당 ':ob.fame>=70?'레전드 ':''}출신 · 통산 WAR ${ob.war}`,sal:round5(clamp(55+(Math.max(ob.sk,ob.dv)-50)*4.5+(ob.fame>=70?40:0),45,340)),yrs:0,clan:null,ob:ob.id,star:ob.fame>=70};
  G.obFace[c.id]=ob.fid; return c; }
function obCands(kind){ obInit(); return G.ob.filter(o=>{ const w=obWhere(o); return w.k==='free'&&o.age<=66&&(kind==='coach'?(o.path==='coach'||o.path==='media'&&o.my>=3):kind==='scout'?(o.path==='scout'||o.path==='front'&&o.fy<3):false); }); }
function obMgrCands(){ obInit(); return G.ob.filter(o=>{ const w=obWhere(o); if(w.k==='mgr'||w.k==='gm'||o.age>66||o.age<42)return false; return (o.cy>=5&&(o.sk>=58||o.aim==='mgr'))||(o.fame>=72&&(o.cy>=2||o.my>=4)); }); }
function obMgr(ob){ const m=mkMgr(); m.name=ob.name; m.age=ob.age; m.fame=clamp(ob.fame+Math.min(10,ob.cy),20,95); m.tac=clamp(Math.round(ob.sk+N(0,4)),30,90); m.youth=clamp(Math.round(ob.dv+N(0,8)),15,88); m.ego=clamp(Math.round(ob.pers.temp*3.5+20+(ob.fame>=70?10:0)),20,95);
  m.career=`${tshort(ob.team)} ${ob.fame>=70?'레전드':''} 출신 · 지도자 경력 ${ob.cy}년${ob.my?` · 해설 ${ob.my}년`:''}`; m.ob=ob.id; m.id='g'+ob.id; G.obFace[m.id]=ob.fid; m.sal=round5(clamp(220+(m.tac-50)*9+Math.max(0,m.fame-55)*9,180,1200)); m.clan=[]; return m; }
function obGMCands(){ obInit(); return G.ob.filter(o=>{ const w=obWhere(o); if(w.k==='gm'||w.k==='mgr'||o.age>64||o.age<40)return false; return (o.fy+o.sy>=6&&(o.aim==='gm'||o.pers.amb>=11))||(o.fy>=4&&o.fame>=70); }); }
function obGM(ob,tid){ const g=mkGM(tid); g.name=ob.name; g.age=ob.age; const P=ob.pers; g.trait=P.loy>=15?'loyal':P.temp>=15?'hard':P.pro>=15?'data':P.amb>=16?'gambler':ob.sy>=ob.fy?'prospect':g.trait;
  g.car=`${tshort(ob.team)} ${ob.pos} 출신 · ${ob.sy?`스카우트 ${ob.sy}년`:''}${ob.sy&&ob.fy?' · ':''}${ob.fy?`프런트 ${ob.fy}년`:''}`; g.ob=ob.id; g.id='m'+ob.id; G.obFace[g.id]=ob.fid; return g; }
/* 겨울마다: 경력 연차가 쌓이고, 능력이 자라고, 일부는 자리를 옮긴다 */
function obYear(){ obInit(); for(const ob of G.ob){ ob.age++; const w=obWhere(ob);
    if(w.k==='coach'){ ob.cy++; const c=G.coach[w.tid][w.role]; if(ob.age<=56){ c.sk=clamp(c.sk+ri(0,2),30,90); c.dv=clamp(c.dv+ri(0,2),30,90); } ob.sk=c.sk; ob.dv=c.dv; c.age=ob.age; }
    else if(w.k==='mgr'){ ob.cy++; } else if(w.k==='scout'){ ob.sy++; const s=G.scouts.find(x=>x.ob===ob.id); if(s&&ob.sy%3===0&&s.skill<5)s.skill++; ob.sc=s?s.skill:ob.sc; }
    else if(w.k==='front'||ob.alt&&ob.alt.k==='front'){ ob.fy++; } else if(ob.path==='media'&&G.year>=ob.retY){ ob.my++; }
    else if(w.k==='free'&&G.year>=ob.readyY){ // 자리를 못 찾으면 일부는 다른 구단 프런트·2군으로 간다
      if(ob.path==='front'||ob.path==='scout'){ if(R()<.6){ const tid=R()<.5?ob.team:pick(G.teams).id; if(tid!==G.user)ob.alt={k:'front',tid,t:`${tshort(tid)} ${ob.path==='scout'?'스카우트':'프런트'}`}; } }
      if(ob.alt&&ob.alt.k==='front'){ ob.fy++; if(ob.path==='scout'){ ob.sy++; ob.fy--; } } }
    if(ob.path==='media'&&ob.my>=3&&R()<.25){ ob.path='coach'; ob.log.push({y:G.year,t:'해설을 접고 지도자의 길을 택했습니다'}); } } }
/* AI 구단이 OB를 쓰는 곳 */
function obAiCoach(tid,role){ const L=obCands('coach').filter(o=>!(G.cmarket||[]).some(c=>c.ob===o.id&&c.role!==role)); const ob=L.length&&R()<.4?pick(L):null; if(!ob)return null; const c=obCoach(ob); c.role=role; c.yrs=ri(1,3);
  if(ob.mine)wire('코치',`${tshort(ob.team)} 출신 ${ob.name}, ${tshort(tid)} ${CROLE[role].l}로 합류`,{tid}); G.cmarket=(G.cmarket||[]).filter(x=>x.ob!==ob.id); return c; }
function obAiMgr(tid){ const L=obMgrCands(); if(!L.length||R()>.35)return null; const ob=L.sort((a,b)=>b.fame-a.fame)[0]; const m=obMgr(ob); m.yrs=ri(2,3); ob.log.push({y:G.year,t:`${tshort(tid)} 감독 취임`});
  wire('감독',`${tshort(tid)}, ${tshort(ob.team)} 출신 ${ob.name} 감독 선임`,{tid}); if(ob.mine)mail('홍보팀',`우리 구단 출신 ${ob.name}, ${tshort(tid)} 감독으로`,`${ob.name}이(가) ${tshort(tid)}의 새 감독이 됐습니다. ${ob.ys}시즌을 우리 유니폼을 입고 뛰었던 선수입니다.`,{kind:'OB'}); return m; }
function obAiGM(tid){ const L=obGMCands(); if(!L.length||R()>.45)return null; const ob=L.sort((a,b)=>(b.fy+b.sy+b.fame/10)-(a.fy+a.sy+a.fame/10))[0]; const g=obGM(ob,tid); ob.alt=null; ob.log.push({y:G.year,t:`${tshort(tid)} 단장 취임`});
  if(ob.mine){ team(tid).rel=clamp(66+Math.round(ob.bond/2),0,100); mail('홍보팀',`우리 구단 출신 ${ob.name}, ${tshort(tid)} 단장으로`,`${ob.name}이(가) ${tshort(tid)} 단장에 올랐습니다. 우리 구단 출신이라 첫 친분은 높게 시작합니다.`,{kind:'OB'}); } return g; }
/* 우리 선수 은퇴: 은퇴식·영구결번·구단에 남기기 */
function obRetireEvents(list){ const L=list.filter(o=>o&&o.mine&&(o.ys>=3)).sort((a,b)=>b.mineWar-a.mineWar).slice(0,3);
  for(const ob of L){ const leg=ob.mineWar>=12||ob.ys>=8; const rn=ob.canRetNo!=null; const stay=ob.path==='media'?null:ob.path==='coach'?'코치로 남기기':ob.path==='scout'?'스카우트로 채용':'프런트 직원으로 채용';
    const opts=[{l:rn?'은퇴식과 영구결번 (1억)':`은퇴식 열어 주기 (${leg?'5천만':'2천만'})`,fx:rn?`${ob.no}번 영구결번. 팬 여론이 크게 오르고, 훗날 구단으로 돌아올 가능성이 커집니다.`:'팬 여론이 오르고, 훗날 구단으로 돌아올 가능성이 커집니다.'}];
    if(stay)opts.push({l:stay,fx:ob.path==='coach'?'코치 후보에 우선 협상 대상으로 올라옵니다(연봉 20% 할인).':ob.path==='scout'?'빈자리가 있으면 바로 스카우트로 합류합니다.':'우리 프런트에서 일하며 경력을 쌓습니다. 언젠가 다른 구단 단장이 될 수도 있습니다.'});
    opts.push({l:'조용히 보내 주기',fx:`${OBPATH[ob.path]}의 길을 스스로 찾습니다.`});
    evNew('ret',`${ob.name} 은퇴`,`${ob.name}(${ob.pos}, ${ob.age}세)이(가) 은퇴합니다. 우리 구단에서 ${ob.ys}시즌 · WAR ${ob.mineWar}. 은퇴 후 ${ob.path==='media'?'해설위원 제안을 받았다고 합니다':`${OBPATH[ob.path]}의 길을 생각하고 있습니다`}${ob.aim?` (${ob.aim==='mgr'?'언젠가 감독':'언젠가 단장'}을 꿈꿉니다)`:''}.`,opts,{from:ob.name,face:'ob:'+ob.id,data:{ob:ob.id,rn:ob.canRetNo,leg,stay:!!stay},def:opts.length-1,exp:10}); } }
EVH.ret={ pick(e,i){ const ob=(G.ob||[]).find(o=>o.id===e.data.ob); if(!ob)return ''; const t=team(G.user); const L=e.opts.length;
    if(i===0){ const rn=e.data.rn!=null; const cost=rn?100:e.data.leg?50:20; G.spend.etc=(G.spend.etc||0)+cost; ob.bond+=rn?30:20; ob.ceremony=G.year; let r='';
      if(rn){ r=retireNumber(e.data.rn); ob.retNo=true; } const f=rn?5:e.data.leg?3:1; G.pr.fan=clamp(G.pr.fan+f,0,100);
      news('선수',`${t.city} ${t.nick} ${ob.name} 은퇴식${rn?`, ${ob.no}번 영구결번`:''}`,`${ob.ys}시즌 동안 뛴 ${ob.name}이(가) 팬들 앞에서 마지막 인사를 했습니다.`,rn?3:2,{fanW:1});
      return `${r?r+' ':''}은퇴식 비용 ${money(cost)}. 팬 여론 +${f}.`; }
    if(i===1&&e.data.stay){ ob.bond+=15; ob.readyY=G.year;
      if(ob.path==='coach'){ const c=obCoach(ob); c.sal=round5(c.sal*.8); c.res=G.user; G.cmarket=(G.cmarket||[]).filter(x=>x.ob!==ob.id); G.cmarket.unshift(c); return `${ob.name}이(가) 코치 후보 맨 앞에 올라왔습니다(${CROLE[c.role].l}, 연 ${money(c.sal)}).`; }
      if(ob.path==='scout'){ const s=obScout(ob); if(G.scouts.length<SCOUT_MAX){ s.since=G.day; G.scouts.push(s); return `${ob.name}이(가) 스카우트로 합류했습니다.`; } G.scoutMarket.unshift(s); return '스카우트 자리가 꽉 차서 후보 명단에 올렸습니다.'; }
      ob.alt={k:'front',tid:G.user,t:`${t.city} ${t.nick} 프런트`}; return `${ob.name}이(가) 우리 프런트에서 일을 시작합니다.`; }
    return ''; } };
function obScout(ob){ const s=mkScout(ob.sc); s.name=ob.name; s.ob=ob.id; s.fid=ob.fid; s.id='s'+ob.id; G.obFace[s.id]=ob.fid; return s; }

function obHireBonus(obid,role){ if(!obid||!G.ob)return; const ob=G.ob.find(o=>o.id===obid); if(!ob)return; ob.log.push({y:G.year,t:`${tshort(G.user)} ${role}`}); if(!ob.mine)return; prInit(); const f=ob.fame>=70?3:1; G.pr.fan=clamp(G.pr.fan+f,0,100);
  news('팬',`${ob.name}, 친정 ${tshort(G.user)}로 돌아왔다`,`${role}로 합류합니다. 팬들이 반깁니다.`,2,{fanW:1}); }

/* ===== 진기록: 경기·시즌·통산 이정표를 한곳에 모은다 ===== */
const FEATK={cyc:'사이클링 히트',hr4:'한 경기 4홈런',hr3:'한 경기 3홈런',h6:'한 경기 6안타',h5:'한 경기 5안타',rbi8:'한 경기 8타점',pg:'퍼펙트게임',nh:'노히트노런',tnh:'팀 노히트노런',k15:'한 경기 15탈삼진',cg0:'무사사구 완봉',r20:'한 경기 20득점',hs:'연속 경기 안타',
  mile:'통산 이정표',s3030:'30-30',s4040:'40-40',hr50:'시즌 50홈런',h200:'시즌 200안타',avg400:'4할 타율',tcB:'타격 3관왕',tcP:'투수 3관왕',w20:'시즌 20승',sv40:'시즌 40세이브',k200:'시즌 200탈삼진',era1:'1점대 평균자책점',srec:'시즌 신기록',ovs:'해외 진출'};
const FEATG={cyc:'g',hr4:'g',hr3:'g',h6:'g',h5:'g',rbi8:'g',pg:'g',nh:'g',tnh:'g',k15:'g',cg0:'g',r20:'g',hs:'g',mile:'m'};
const FEATMAJ=new Set(['cyc','hr4','h6','pg','nh','tnh','s4040','hr50','h200','avg400','tcB','tcP','srec']);
function featAdd(k,p,txt,o){ o=o||{}; G.feats=G.feats||[]; const tid=o.tid??(p?p.team:null); const f={id:(G.featSeq=(G.featSeq||0)+1),y:G.year,d:G.day,k,pid:p?p.id:null,name:p?p.name:(o.name||''),tid,txt,vs:o.vs||'',maj:FEATMAJ.has(k)||!!o.maj,v:o.v??null};
  G.feats.unshift(f); if(G.feats.length>600)G.feats.length=600;
  if(f.maj){ wire('기록',`${p?p.name+' ':''}${txt}${o.vs?` (${o.vs})`:''}`,{tid,ref:p?p.id:null}); if(tid===G.user&&G.pr&&period()!=='pre'){ news('선수',`${p?p.name+', ':''}${FEATK[k]}`,`${txt}${o.vs?` · ${o.vs}`:''}`,2,{ref:p?p.id:null,fanW:1}); } }
  return f; }
/* 경기 단위 투수·팀 기록 */
function featGame(day,g){ if(!G.cal)return; for(const k of ['h','a']){ const s=g.S[k], ok=k==='h'?'a':'h', os=g.S[ok]; const vs=`${dmd(day)} vs ${tshort(os.tid)}`;
    const P=s.pitchers.map(id=>[id,s.box.get(id)]).filter(x=>x[1]); const ha=sum(P.map(x=>x[1].h||0)), bba=sum(P.map(x=>x[1].bb||0)), outs=sum(P.map(x=>x[1].outs||0));
    if(outs>=27&&ha===0&&g.score[ok]===0){ if(P.length===1){ const p=G.players[P[0][0]]; if(p)featAdd(bba===0?'pg':'nh',p,bba===0?'퍼펙트게임':'노히트노런',{vs}); } else featAdd('tnh',null,`${tname(s.tid)} 투수 ${P.length}명 합작 노히트노런`,{tid:s.tid,vs,name:tname(s.tid)}); }
    else if(P.length===1&&outs>=27&&g.score[ok]===0&&bba===0){ const p=G.players[P[0][0]]; if(p)featAdd('cg0',p,`무사사구 완봉 (${ha}피안타)`,{vs}); }
    for(const [id,x] of P)if((x.so||0)>=15){ const p=G.players[id]; if(p)featAdd('k15',p,`한 경기 ${x.so}탈삼진`,{vs,maj:x.so>=17}); }
    if(g.score[k]>=20)featAdd('r20',null,`${tname(s.tid)} ${g.score[k]}득점`,{tid:s.tid,vs,name:tname(s.tid)}); } }
/* 경기 단위 타자 기록 (storyGame에서 부른다) */
function featBat(p,x,vs){ const sg=(x.h||0)-(x.d||0)-(x.tr||0)-(x.hr||0);
  if(sg>=1&&x.d>=1&&x.tr>=1&&x.hr>=1)featAdd('cyc',p,`사이클링 히트 (${x.ab}타수 ${x.h}안타)`,{vs});
  if(x.hr>=4)featAdd('hr4',p,`한 경기 ${x.hr}홈런`,{vs}); else if(x.hr===3)featAdd('hr3',p,'한 경기 3홈런',{vs});
  if(x.h>=6)featAdd('h6',p,`한 경기 ${x.h}안타`,{vs}); else if(x.h===5)featAdd('h5',p,'한 경기 5안타',{vs});
  if((x.rbi||0)>=8)featAdd('rbi8',p,`한 경기 ${x.rbi}타점`,{vs,maj:x.rbi>=10});
  if((x.ab||0)+(x.bb||0)>0){ if(x.h>0){ p.hstk=(p.hstk||0)+1; if(p.hstk>=20){ const f=(G.feats||[]).find(z=>z.id===p.hstkF); if(f&&f.pid===p.id){ f.v=p.hstk; f.txt=`${p.hstk}경기 연속 안타`; f.d=G.day; f.maj=p.hstk>=28; } else p.hstkF=featAdd('hs',p,`${p.hstk}경기 연속 안타`,{vs,v:p.hstk}).id; } } else if(x.ab>0){ p.hstk=0; p.hstkF=null; } } }
/* 시즌 기록: 정규시즌이 끝날 때 */
const SBK={hr:['홈런',1],rbi:['타점',1],h:['안타',1],sb:['도루',1],w:['승',1],sv:['세이브',1],so:['탈삼진',1]};
function featSeason(y){ const B=[], P=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(!h)continue; (p.isP?P:B).push({p,h}); }
  const qB=B.filter(x=>x.h.pa>=446), qP=P.filter(x=>x.h.outs>=432);
  for(const {p,h} of B){ const r=bRate(h); if(h.hr>=40&&h.sb>=40)featAdd('s4040',p,`40-40 (${h.hr}홈런 ${h.sb}도루)`); else if(h.hr>=30&&h.sb>=30)featAdd('s3030',p,`30-30 (${h.hr}홈런 ${h.sb}도루)`);
    if(h.hr>=50)featAdd('hr50',p,`시즌 ${h.hr}홈런`); if(h.h>=200)featAdd('h200',p,`시즌 ${h.h}안타`); if(h.pa>=446&&r.avg>=.4)featAdd('avg400',p,`시즌 타율 ${fmt3(r.avg)}`); }
  if(qB.length){ const ma=Math.max(...qB.map(x=>bRate(x.h).avg)), mh=Math.max(...B.map(x=>x.h.hr)), mr=Math.max(...B.map(x=>x.h.rbi)); for(const {p,h} of qB)if(bRate(h).avg===ma&&h.hr===mh&&h.rbi===mr)featAdd('tcB',p,`타격 3관왕 (타율 ${fmt3(ma)} · ${mh}홈런 · ${mr}타점)`); }
  for(const {p,h} of P){ if(h.w>=20)featAdd('w20',p,`시즌 ${h.w}승`); if(h.sv>=40)featAdd('sv40',p,`시즌 ${h.sv}세이브`); if(h.so>=200)featAdd('k200',p,`시즌 ${h.so}탈삼진`); if(h.outs>=432&&pRate(h).era<2)featAdd('era1',p,`평균자책점 ${pRate(h).era.toFixed(2)}`); }
  if(qP.length){ const me=Math.min(...qP.map(x=>pRate(x.h).era)), mw=Math.max(...P.map(x=>x.h.w)), mk=Math.max(...P.map(x=>x.h.so)); for(const {p,h} of qP)if(pRate(h).era===me&&h.w===mw&&h.so===mk)featAdd('tcP',p,`투수 3관왕 (${mw}승 · 평균자책점 ${me.toFixed(2)} · ${mk}탈삼진)`); }
  // 리그 단일 시즌 최고 기록 갱신
  G.sbest=G.sbest||{}; const first=!Object.keys(G.sbest).length;
  for(const k in SBK){ const L=(k==='w'||k==='sv'||k==='so')?P:B; let best=null; for(const x of L){ const v=x.h[k]||0; if(!best||v>best.v)best={v,p:x.p}; } if(!best||!best.v)continue;
    const cur=G.sbest[k]; if(!cur||best.v>cur.v){ G.sbest[k]={v:best.v,name:best.p.name,pid:best.p.id,tid:best.p.team,y}; if(!first&&cur)featAdd('srec',best.p,`시즌 최다 ${SBK[k][0]} 신기록 ${best.v} (종전 ${cur.v}, ${cur.name} ${cur.y})`); } }
  const ab=qB.map(x=>({v:bRate(x.h).avg,p:x.p})).sort((a,b)=>b.v-a.v)[0]; if(ab&&(!G.sbest.avg||ab.v>G.sbest.avg.v)){ const cur=G.sbest.avg; G.sbest.avg={v:+ab.v.toFixed(3),name:ab.p.name,pid:ab.p.id,tid:ab.p.team,y}; if(cur&&!first)featAdd('srec',ab.p,`시즌 최고 타율 신기록 ${fmt3(ab.v)} (종전 ${fmt3(cur.v)})`); }
  const eb=qP.map(x=>({v:pRate(x.h).era,p:x.p})).sort((a,b)=>a.v-b.v)[0]; if(eb&&(!G.sbest.era||eb.v<G.sbest.era.v)){ const cur=G.sbest.era; G.sbest.era={v:+eb.v.toFixed(2),name:eb.p.name,pid:eb.p.id,tid:eb.p.team,y}; if(cur&&!first)featAdd('srec',eb.p,`시즌 최저 평균자책점 신기록 ${eb.v.toFixed(2)} (종전 ${cur.v.toFixed(2)})`); } }

function retWarT(){ return (G&&G.cfg&&G.cfg.retWar)||60; }

/* ===== 해외 진출: 외국인 역수출 · 국내 선수 포스팅/해외 FA · 해외파 추적 ===== */
const MLBT=['뉴욕','LA','시카고','보스턴','시애틀','샌디에이고','텍사스','토론토','애리조나','디트로이트'], NPBT=['도쿄','오사카','후쿠오카','요코하마','나고야','센다이','삿포로','히로시마'];
const usd=m=>Math.round(m*USD); // 만 달러 → 게임 금액
function seasonWar(p,y){ const h=seasonTotal(p,y??G.year,'1군'); return h?warOf(h,p):0; }
/* 외국인: 잘하면 MLB·NPB가 데려간다 */
function fOverseas(){ for(const p of Object.values(G.players)){ if(!p.foreign||p.team==null||p.joinY>G.year)continue; const w=seasonWar(p); if(w<3.5||p.age>=35)continue;
    const mlb=p.foreign==='용병'&&p.age<=32&&w>=5.5&&R()<.35+Math.min(.25,(w-5.5)*.08), npb=!mlb&&R()<(p.foreign==='아시아'?.45:.22)+(w>=5?.2:0); if(!mlb&&!npb)continue;
    const lg=mlb?'MLB':'NPB'; const yrs=mlb?ri(1,2):ri(1,3); const amt=Math.round(mlb?clamp(150+(w-5)*120+N(0,60),120,900):clamp(120+(w-3.5)*90+N(0,40),100,500)); const club=pick(lg==='MLB'?MLBT:NPBT);
    p.ovsOffer={lg,club,yrs,amt,y:G.year};
    if(p.team!==G.user){ let stay=R()<(lg==='MLB'?.12:.3); if(stay&&p.foreign!=='아시아'){ const oth=sum(foreignOf(p.team).filter(x=>x.foreign==='용병'&&x.id!==p.id).map(x=>x.sal)); const ns=round5(Math.min(Math.max(p.sal*1.35,usd(amt)*.9),fCap(p.team)-oth)); stay=ns>p.sal; if(stay){ p.sal=ns; p.kept={y:G.year,sal:ns}; } } else if(stay){ p.sal=round5(p.sal+10*USD); p.kept={y:G.year,sal:p.sal}; } if(stay){ wire('외국인',`${tname(p.team)} ${p.name}, ${lg} 제안 뿌리치고 잔류`,{tid:p.team,ref:p.id}); delete p.ovsOffer; }
      else { ovsLeave(p,lg,club,yrs,amt,'외국인'); } continue; }
    evNew('fovs',`${p.name}에게 ${lg} 제안`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) 올 시즌 WAR ${w.toFixed(1)}을 기록하자 ${club} 구단(${lg})이 ${yrs}년 총 ${amt*yrs}만 달러 수준을 제시했습니다. 에이전트는 KBO 잔류도 열어 두었지만 ${lg==='MLB'?'메이저리그 복귀를 원합니다':'조건이 맞으면 일본으로 가겠다고 합니다'}.`,
      [{l:`잔류 설득 (연봉 ${Math.round(Math.max(p.sal/USD*1.5,amt*.85))}만 달러)`,fx:`${lg==='MLB'?'성공 확률이 낮습니다(약 20%)':'성공 확률은 절반 정도입니다'}. 실패하면 연봉 부담 없이 떠납니다. 재계약 선수는 개인 연봉 상한이 없지만 3명 총액 한도는 지켜야 합니다.`},
       {l:'축하하며 보내 준다',fx:'떠납니다. 대체 외국인을 찾아야 합니다.'}],{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id},def:1,exp:12}); } }
EVH.fovs={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||!p.ovsOffer)return ''; const o=p.ovsOffer;
    if(i===0){ const asia=p.foreign==='아시아'; const ns=asia?round5(p.sal+10*USD):round5(usd(Math.max(p.sal/USD*1.5,o.amt*.85))); const yb=foreignOf(G.user).filter(x=>x.foreign==='용병'&&x.id!==p.id); const capOk=asia||sum(yb.map(x=>x.sal))+ns<=fCap(G.user);
      if(!capOk)return `외국인 연봉 총액 한도(${money(fCap(G.user))})를 넘어 설득할 수 없습니다. ${ovsLeave(p,o.lg,o.club,o.yrs,o.amt,'외국인')}`;
      const ok=R()<((o.lg==='MLB'?.2:.5)+((p.mor??60)-60)/200)*(asia?.5:1); if(ok){ p.sal=ns; p.kept={y:G.year,sal:ns}; delete p.ovsOffer; news('선수',`${p.name}, ${o.lg} 제안 뿌리치고 잔류`,`${tshort(G.user)}이(가) 연봉 ${money(ns)}에 붙잡았습니다.`,2,{ref:p.id}); return `설득 성공. 연봉 ${money(ns)}.`; }
      return `설득에 실패했습니다. ${ovsLeave(p,o.lg,o.club,o.yrs,o.amt,'외국인')}`; }
    return ovsLeave(p,o.lg,o.club,o.yrs,o.amt,'외국인'); } };
/* 떠나는 선수를 해외파 명단으로 옮긴다 (국내 선수는 나중에 돌아올 수 있다) */
function ovsLeave(p,lg,club,yrs,amt,how,fee){ const from=p.team??p.faFrom; G.abroad=G.abroad||[];
  const rec={id:p.id,name:p.name,isP:p.isP,pos:posLabel(p),foreign:p.foreign||null,from,lg,club,how,yrs,amt,y:G.year,age:p.age,lines:[],fee:fee||0,back:false,pj:p.foreign?null:JSON.stringify(p)};
  G.abroad.unshift(rec); if(G.abroad.length>120)G.abroad.length=120;
  for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; if(G.fa&&G.fa.pool)G.fa.pool=G.fa.pool.filter(x=>x!==p.id); delete G.players[p.id];
  const t=`${p.name}, ${club} 구단(${lg})과 ${yrs}년 계약${how==='포스팅'?` · 포스팅 비용 ${money(fee)}`:''}`; wire(lg==='MLB'?'해외':'해외',t,{tid:from});
  try{ featAdd('ovs',null,`${p.name} ${how==='외국인'?'역수출':'해외 진출'} · ${club}(${lg}) ${yrs}년 ${amt*yrs}만 달러`,{tid:from,name:p.name,maj:lg==='MLB'}); }catch(e){}
  if(from===G.user){ news('선수',`${p.name}, ${lg} 진출 확정`,`${club} 구단과 ${yrs}년 총 ${amt*yrs}만 달러에 계약했습니다.${fee?` 구단은 포스팅 비용 ${money(fee)}를 받습니다.`:''}`,1,{fanW:.5}); }
  return `${p.name}이(가) ${club}(${lg})로 떠납니다.`; }
/* 국내 선수의 메이저리그 꿈: 야망 + 활약 + 언론 */
function mlbOf(p){ if(p.mlb==null){ initPers(p); p.mlb=clamp(Math.round((p.pers.amb-4)*3+N(0,10)),0,70); } return p.mlb; }
function mlbHype(){ if(period()!=='season'||G.day<G.cal.open+30)return; const cands=[]; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.age>31||ovr(p)<60)continue; const h=seasonTotal(p,G.year,'1군'); if(!h||(p.isP?h.outs<120:h.pa<150))continue; const w=warOf(h,p); if(w<2.5)continue; cands.push({p,w}); }
  if(!cands.length||R()>.45)return; cands.sort((a,b)=>b.w-a.w); const mine=cands.filter(x=>x.p.team===G.user); const x=mine.length&&R()<.5?mine[0]:pick(cands.slice(0,5)); const p=x.p; mlbOf(p);
  if(p.hyp&&p.hyp>G.day-30)return; p.hyp=G.day; const d=ri(4,9); p.mlb=clamp(p.mlb+d,0,100);
  const T=[`메이저리그 스카우트 ${ri(4,12)}명, ${p.name} 경기에 집결`,`"${p.name}, 지금 당장 메이저리그 통한다" 현지 전문가 평가`,`${p.name} 측 "해외 진출, 언젠가는 도전하고 싶다"`,`${p.name}, 일본 구단도 영입 리스트에`];
  news('언론',pick(T),`${posLabel(p)} ${p.name}의 활약에 해외 구단들의 관심이 커지고 있습니다. 서비스 연차 ${p.svc}년${p.svc>=7?'으로 포스팅 자격이 있습니다':`, 포스팅 자격(7년)까지 ${7-p.svc}년 남았습니다`}.`,p.team===G.user?0:0,{ref:p.id});
  if(p.team===G.user)p.mor=clamp((p.mor??60)+1,0,100); }
/* 비시즌: 포스팅 요청 */
function postingSeason(){ G.posting=G.posting||[]; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.joinY>G.year||p.faC&&p.yrs>1)continue; if(p.svc<7||p.age>32||ovr(p)<60)continue; mlbOf(p);
    const want=p.mlb>=55||(p.postPromise===G.year); if(!want)continue; if(G.posting.some(x=>x.pid===p.id&&x.y===G.year))continue;
    if(p.team!==G.user){ const t=team(p.team); const allow=R()<(t.mode==='rebuild'?.75:.5); if(allow)postStart(p); else { p.mlb=clamp(p.mlb+5,0,100); } continue; }
    const promised=p.postPromise===G.year; const asked=(p.postAsk||0);
    evNew('post',`${p.name} 포스팅 요청`,`${p.name}(${posLabel(p)}, ${p.age}세, 서비스 ${p.svc}년)이(가) 메이저리그 도전을 위해 포스팅을 요청했습니다.${promised?' 지난해 "1년 뒤 보내 주겠다"고 약속했습니다.':asked?` 작년에도 요청했다가 거절당했습니다(${asked}회).`:''} 언론은 연일 해외 진출 가능성을 다루고 있습니다.`,
      [{l:'포스팅 허락',fx:'12월 중순 결과가 나옵니다. 계약이 성사되면 포스팅 비용(계약 보장액의 약 20%)을 받고 선수는 떠납니다. 무산되면 남습니다.'},
       {l:'1년 뒤 보내 주겠다고 약속',fx:'기분이 조금 오르고 올해는 남습니다. 내년에 약속을 어기면 크게 실망하고 팬·언론도 비판합니다.'},
       {l:'거절',fx:`기분이 크게 떨어집니다${asked?' (두 번째 거절이라 더 크게)':''}. 팬 여론은 갈리고 언론은 비판적입니다.`}],{ref:p.id,face:p.id,from:p.name,data:{pid:p.id,promised},def:promised?0:2,exp:12}); } }
EVH.post={ pick(e,i){ const p=G.players[e.data.pid]; if(!p)return ''; prInit();
    if(i===0){ postStart(p); return `${p.name} 포스팅을 신청했습니다. 12월 중순에 결과가 나옵니다.`; }
    if(i===1){ if(e.data.promised){ p.mor=clamp((p.mor??60)-25,0,100); G.pr.fan=clamp(G.pr.fan-3,0,100); G.pr.press=clamp(G.pr.press-4,0,100); news('언론',`${tshort(G.user)}, ${p.name}과의 약속 또 미뤄`,'약속을 어겼다는 비판이 나옵니다.',-3,{ref:p.id}); return '약속을 또 미뤘습니다. 기분 -25, 팬 여론 -3, 언론 -4.'; }
      p.postPromise=G.year+1; p.mor=clamp((p.mor??60)+3,0,100); return `${p.name}에게 내년 포스팅을 약속했습니다. 기분 +3.`; }
    p.postAsk=(p.postAsk||0)+1; const d=e.data.promised?28:p.postAsk>=2?20:14; p.mor=clamp((p.mor??60)-d,0,100); G.pr.press=clamp(G.pr.press-(e.data.promised?5:2),0,100); G.pr.fan=clamp(G.pr.fan-(e.data.promised?3:0),0,100);
    news('언론',`${tshort(G.user)}, ${p.name} 포스팅 불허`,e.data.promised?'약속을 뒤집었다는 비판이 거셉니다.':'구단은 전력 유지를 택했습니다.',e.data.promised?-3:-1,{ref:p.id}); return `포스팅을 거절했습니다. 기분 -${d}.`; } };
function postStart(p){ G.posting=G.posting||[]; G.posting.push({pid:p.id,y:G.year,tid:p.team,day:Math.max(G.day+20,KD(12,12)),done:false}); wire('해외',`${tname(p.team)} ${p.name}, 포스팅 신청`,{tid:p.team,ref:p.id}); delete p.postPromise; }
/* 포스팅 결과: 능력이 높을수록 MLB 계약 가능성이 크다 */
function postFee(amtTot){ const a=amtTot; const f=Math.min(a,2500)*.2+Math.max(0,Math.min(a,5000)-2500)*.175+Math.max(0,a-5000)*.15; return Math.round(f); }
function ovsDaily(){ for(const x of G.posting||[]){ if(x.done||G.day<x.day)continue; x.done=true; const p=G.players[x.pid]; if(!p||p.team!==x.tid)continue; const o=ovr(p);
    const pm=o>=68?.9:o>=64?.6:o>=61?.3:.1; let lg=null; if(R()<pm)lg='MLB'; else if(R()<(o>=60?.35:.1))lg='NPB';
    if(!lg){ x.res='무산'; p.mor=clamp((p.mor??60)-5,0,100); p.mlb=clamp(p.mlb-15,0,100); wire('해외',`${p.name} 포스팅 무산, ${tshort(x.tid)} 잔류`,{tid:x.tid,ref:p.id}); if(x.tid===G.user)note('선수',`${p.name}의 포스팅이 무산됐습니다. 계약을 제시한 구단이 없었습니다. 선수는 남습니다(기분 -5).`,p.id); continue; }
    const yrs=lg==='MLB'?(o>=70?ri(4,6):o>=66?ri(2,4):ri(1,2)):ri(2,3); const amt=Math.round(lg==='MLB'?clamp((o-58)*90+N(0,80),100,2500):clamp((o-55)*45+N(0,30),80,600)); const fee=usd(postFee(amt*yrs)); x.res=lg;
    team(x.tid).cash+=fee; if(x.tid===G.user){ G.ovsIncome=(G.ovsIncome||0)+fee; }
    ovsLeave(p,lg,pick(lg==='MLB'?MLBT:NPBT),yrs,amt,'포스팅',fee); } }
/* 해외 FA: 9시즌을 채운 FA 선수는 해외로 갈 수 있다 */
function ovsFA(pool){ for(const id of [...pool]){ const p=G.players[id]; if(!p||p.foreign||p.svc<9||p.age>33)continue; const o=ovr(p); if(o<61)continue; mlbOf(p);
    if(R()<p.mlb/100*(o>=66?.8:.45)){ const lg=o>=65&&R()<.7?'MLB':'NPB'; const yrs=ri(1,3); const amt=Math.round(lg==='MLB'?clamp((o-58)*80,100,2000):clamp((o-55)*40,80,500)); ovsLeave(p,lg,pick(lg==='MLB'?MLBT:NPBT),yrs,amt,'해외 FA'); const i=pool.indexOf(id); if(i>=0)pool.splice(i,1); } } }
/* 해외파의 한 해: 그 리그 수준으로 기록을 만들고, 계약이 끝나면 일부는 돌아온다 */
function abroadYear(){ for(const a of G.abroad||[]){ if(a.back||a.foreign)continue; let p; try{ p=JSON.parse(a.pj); }catch(e){ continue; } if(!p)continue;
    const b=a.lg==='MLB'?-6:-2; const ok=ovr(p)>=(a.lg==='MLB'?62:57); const line=p.isP?simPit(p,ok?ri(200,500):ri(30,150),b):simBat(p,ok?ri(250,560):ri(40,160),b); line.y=G.year; line.lvl=ok?a.lg:(a.lg==='MLB'?'트리플A':'NPB 2군'); a.lines.push(line);
    try{ develop(p); }catch(e){} p.age++; a.age=p.age; a.pj=JSON.stringify(p); const yrsIn=G.year-a.y;
    if(yrsIn>=a.yrs&&(!ok||p.age>=33||R()<.45)){ a.back=true; a.backY=G.year; p.svc=(p.svc||0)+yrsIn; G.players[p.id]=p; p.team=a.from; p.sal=round5(Math.max(marketSal(ovr(p)),p.sal)); p.yrs=ri(1,3); p.faC=true; p.joinY=undefined; p.mor=70; delete p.ovsOffer; story(p,`${a.lg} 생활을 마치고 ${tname(a.from)} 복귀`,'move');
      wire('해외',`${p.name}, ${a.lg} ${yrsIn}년 마치고 ${tshort(a.from)} 복귀`,{tid:a.from,ref:p.id}); if(a.from===G.user)news('선수',`${p.name}, 친정 복귀`,`${a.lg}에서 ${yrsIn}년을 뛰고 돌아왔습니다. 연봉 ${money(p.sal)} · ${p.yrs}년 계약.`,2,{ref:p.id,fanW:1.5}); } } }
/* 대체 외국인 관찰 명단 */
function fwatchOn(id){ G.fwatch=G.fwatch||[]; return G.fwatch.some(w=>w.id===id); }
function fwatchToggle(id){ G.fwatch=G.fwatch||[]; if(fwatchOn(id)){ const w=G.fwatch.find(x=>x.id===id); if(w&&w.auto)(G.fwNo=G.fwNo||[]).push(id); G.fwatch=G.fwatch.filter(x=>x.id!==id); return '관찰 명단에서 뺐습니다.'; } if(G.fwatch.length>=8)return '관찰 명단은 8명까지입니다.'; G.fwatch.push({id,since:G.day,k:0}); return '관찰 명단에 올렸습니다. 매주 스카우트 보고가 쌓여 평가가 정확해집니다.'; }
function fwatchK(id){ const w=(G.fwatch||[]).find(x=>x.id===id); return w?w.k:0; }
function fwatchWeek(){ G.fwatch=G.fwatch||[]; const out=[];
  for(const w of G.fwatch){ const p=G.players[w.id]; if(!p||p.team!=null){ if(p&&p.team!=null&&p.team!==G.user)out.push(`${p.name}은(는) ${tshort(p.team)}와(과) 계약했습니다`); w.gone=true; continue; }
    const r=origOf(p); const isc=G.scouts.find(s=>s.role==='intl'&&s.region===r); w.k=clamp(w.k+3+intlLv(r)*3+(isc?isc.skill*2:0),0,100);
    if(period()==='season'){ const gone=R()<(p.age<=29&&ovr(p)>=60?.03:.015); if(gone){ const lg=R()<.6?'MLB 콜업':'NPB 계약'; out.push(`${p.name}이(가) ${lg}(으)로 후보에서 빠졌습니다`); w.gone=true; G.fmarket=(G.fmarket||[]).filter(x=>x!==p.id); delete G.players[p.id]; continue; }
      const lvl=r==='jp'?-1:r==='la'?4:2; const add=p.isP?simPit(p,ri(9,21),lvl):simBat(p,ri(14,26),lvl); const n=p.now&&p.now.y===G.year?p.now:(p.now={y:G.year,lvl:p.prevLvl}); for(const k in add)if(typeof add[k]==='number')n[k]=(n[k]||0)+add[k]; } }
  G.fwatch=G.fwatch.filter(w=>!w.gone);
  /* 스카우트 자동 관찰: 빈자리가 있으면 감독이 원하는 유형(없으면 우리 팀에 필요한 유형) 후보를 주 1~2명씩 올린다(자동 3명까지) */
  try{ if(!G.unemp&&(foreignOpen()||period()==='season')&&G.fwatch.length<8&&G.fwatch.filter(w=>w.auto).length<3){ const W=mgrWantForeign(); const need=fNeed(G.user); const on=new Set(G.fwatch.map(w=>w.id).concat(G.fwNo||[]));
    const C=(G.fmarket||[]).map(id=>G.players[id]).filter(q=>q&&q.team==null&&!on.has(q.id)&&fKnows(G.user,q)&&(q.foreign==='용병'||(need&&need.kind==='아시아')));
    const fit=q=>(W&&mgrFitF(q,W)?2:0)+(need&&need.isP!=null&&q.isP===need.isP?1:0)+(need&&need.kind==='아시아'&&q.foreign==='아시아'?1:0); const val=q=>{ const r=scoutReport(q); return (r.ofp??((r.cur??40)+3))+(r.cur??40)*.3; };
    const pickL=C.filter(q=>fit(q)>0).sort((a,b)=>fit(b)-fit(a)||val(b)-val(a)).slice(0,Math.min(2,3-G.fwatch.filter(w=>w.auto).length,8-G.fwatch.length));
    if(pickL.length){ for(const q of pickL)G.fwatch.push({id:q.id,since:G.day,k:0,auto:true}); mail('스카우트팀장','관찰 명단에 후보를 올렸습니다',`${pickL.map(q=>`${q.name}(${posLabel(q)}, ${q.nat||''}, ${q.age}세 · 요구 ${Math.round(q.ask/USD)}만 달러)`).join('\n')}\n\n${W&&W.want?'감독이 원하는 유형':'우리 팀에 필요한 유형'}이라 지켜보겠습니다. 매주 보고가 쌓이면 평가가 정확해집니다. 필요 없으면 관찰 명단에서 빼 주세요(스카우트가 올린 후보는 3명까지).`,{kind:'외국인',acts:[{l:'관찰 명단',a:'go',v:'transfer:watch'}]}); } } }catch(e){}
  if(out.length)mail('스카우트팀장','관찰 명단 변동',out.join('.\n')+'.',{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]});
  // 우리 외국인이 흔들리면 대체 후보를 올린다
  if(period()!=='season'||G.day>KD(8,15)||G.day<G.cal.open+30)return; for(const p of foreignOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); const bad=p.injOut>=30||(h&&(p.isP?(h.outs>=90&&pRate(h).era>5.6):(h.pa>=120&&bRate(h).ops<.680)));
    if(!bad||p.fwarn===G.year*100+dobj(G.day).m)continue; p.fwarn=G.year*100+dobj(G.day).m; const alt=(G.fwatch||[]).map(w=>G.players[w.id]).filter(q=>q&&q.isP===p.isP&&q.foreign===p.foreign);
    mail('스카우트팀장',`${p.name} 교체 검토`,`${p.name}이(가) ${p.injOut>=30?`부상으로 약 ${p.injOut}일 빠집니다`:'부진합니다'}. ${alt.length?`관찰 명단의 ${p.isP?'투수':'타자'} 후보: ${alt.map(q=>q.name).join(', ')}.`:'관찰 명단에 같은 유형 후보가 없습니다. 외국인 시장에서 후보를 관찰 명단에 올려 두세요.'}`,{imp:!!alt.length,kind:'외국인',ref:p.id,acts:[...alt.slice(0,2).map(q=>({l:`${q.name} 보기`,a:'player',v:q.id})),{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); } }

/* 상대 구단이 눈여겨보는 우리 선수: 그 팀 약한 자리에 맞고 그 팀 눈에 값어치가 큰 선수 3명. 매주 바뀐다 */
let _intC={};
function aiInterest(tid){ if(tid===G.user||!G.teams[tid])return []; const wk=G.year*100+Math.floor(G.day/7); const n=Object.values(G.players).filter(p=>p.team===G.user).length; const k=wk+':'+n+':'+(G.trades||[]).length;
  if(_intC[tid]&&_intC[tid].k===k)return _intC[tid].v; const t=team(tid); let weak=[]; try{ weak=teamNeeds(tid).weak||[]; }catch(e){}
  const v=domestic(G.user).filter(p=>!p.ys&&!(p.joinY>G.year)&&healthy(p)).map(p=>{ const val=tval(t,p,'in'); const fit=weak.includes(pSlot(p))?1.35:1; return {id:p.id,s:val*fit+hn('int'+tid+':'+wk,p.id)*.6}; }).filter(x=>x.s>.6).sort((a,b)=>b.s-a.s).slice(0,3).map(x=>x.id);
  _intC[tid]={k,v}; return v; }
function interestKnown(tid){ return team(tid).rel>=35; }

function interestWhy(tid,p){ const w=[]; let weak=[]; try{ weak=teamNeeds(tid).weak||[]; }catch(e){} if(weak.includes(pSlot(p)))w.push(`${SLOTK[pSlot(p)]} 보강`); const tr=gmTrait(tid);
  if(tr==='prospect'&&p.age<=24)w.push('유망주 선호'); if(tr==='miser'&&p.sal<=150)w.push('싼 연봉'); if(tr==='gambler'&&ovr(p)>=60)w.push('즉시 전력'); if(teamCtx(team(tid)).contend&&ovr(p)>=55)w.push('우승 경쟁용'); if(!teamCtx(team(tid)).contend&&p.age<=25)w.push('리빌딩 자원'); return w.slice(0,2).join(' · ')||'전력 보강'; }
function listWant(p){ const t=team(p.team); if(t.mode==='rebuild')return '연봉 정리가 목적 · 젊은 선수 한 명이면 충분'; let weak=[]; try{ weak=teamNeeds(p.team).weak||[]; }catch(e){} return `자리가 없는 유망주 · ${weak.length?weak.map(k=>SLOTK[k]).join('·')+' 즉시 전력 원함':'즉시 전력 원함'}`; }

/* ===== 감독이 먼저 하는 요청: 보강·정리·외국인 교체·FA·드래프트 ===== */
const MREQK={slot:'보강 요청',out:'정리 요청',frep:'외국인 교체 요청',fa:'FA 영입 요청',draft:'드래프트 기조 추천'};
function mreqs(){ return G.mreq=G.mreq||[]; }
function mreqOpen(k){ return mreqs().filter(r=>r.st==='open'&&(!k||r.k===k)); }
function mreqAdd(k,data,until){ const r={id:'r'+(G.mreqSeq=(G.mreqSeq||0)+1),k,day:G.day,y:G.year,until,data,st:'ask'}; mreqs().unshift(r); if(G.mreq.length>40)G.mreq.length=40; return r; }
function mgrSays(m){ return `${m.name} 감독`; }
function mreqAsk(r,title,sit,opts,def,face){ const m=G.mgr[G.user]; evNew('mreq',title,sit,opts,{from:'감독실',face:null,ref:face??null,data:{rid:r.id},def:def??opts.length-1,exp:7}); }
const DPOL={P:'투수 위주',C:'포수',IF:'내야수',OF:'외야수',HS:'고졸 유망주',COL:'대졸 즉시 전력'};
function draftFit(p,k){ if(!k||!p)return false; return k==='P'?p.isP:k==='C'?p.pos==='C':k==='IF'?['1B','2B','3B','SS'].includes(p.pos)&&!p.isP:k==='OF'?['LF','CF','RF'].includes(p.pos)&&!p.isP:k==='HS'?!p.college:k==='COL'?p.college:false; }
/* 매주: 새 요청을 꺼내고, 진행 중인 요청을 점검한다 */
function mreqWeek(){ const m=G.mgr[G.user]; if(!m||m.interim||G.gameOver||G.unemp)return; mgrFix(m); mreqCheck();
  const per=period(); const open=mreqs().filter(r=>r.st==='open'||r.st==='ask'); if(open.length>=2)return;
  const recent=mreqs().filter(r=>r.day>G.day-28).length; if(recent)return;
  const C=[];
  if(per==='season'&&tradeOpen()&&!open.some(r=>r.k==='slot')&&!mreqs().some(r=>r.k==='slot'&&r.day>G.day-50)){ const rk=slotRanks(G.user); const w=PSLOTS.filter(k=>k!=='DH').map(k=>({k,r:rk[k].rank})).sort((a,b)=>b.r-a.r)[0];
    if(w&&w.r>=8)C.push(['slot',w,1.2+(m.ego-50)/60]); }
  if(per==='season'&&G.day>G.cal.open+25&&!open.some(r=>r.k==='out')){ const bad=domestic(G.user).filter(p=>{ if(p.ys||p.age<29)return false; const h=seasonTotal(p,G.year,'1군'); if(!h)return false; return p.isP?(h.outs>=60&&pRate(h).era>6):(h.pa>=90&&bRate(h).ops<.600); }).sort((a,b)=>b.sal-a.sal)[0]; if(bad&&!mreqs().some(r=>r.k==='out'&&r.data.pid===bad.id))C.push(['out',bad,.8+(m.disc-50)/80]); }
  if(per==='season'&&G.day<=KD(8,15)&&!open.some(r=>r.k==='frep')){ const f=foreignOf(G.user).find(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=90&&pRate(h).era>5.4):(h.pa>=130&&bRate(h).ops<.690)); }); if(f)C.push(['frep',f,1]); }
  if(G.day>=KD(8,20)&&G.day<KD(9,10)&&!mreqs().some(r=>r.k==='draft'&&r.y===G.year))C.push(['draft',null,3]);
  if(G.fa&&G.fa.open&&!G.fa.closed&&!mreqs().some(r=>r.k==='fa'&&r.y===G.year))C.push(['fa',null,3]);
  if(!C.length||R()>.45)return; let x=R()*sum(C.map(c=>Math.max(.2,c[2]))); for(const c of C){ x-=Math.max(.2,c[2]); if(x<=0){ mreqMake(c[0],c[1]); return; } } }
function mreqMake(k,d){ const m=G.mgr[G.user]; const nm=mgrSays(m);
  if(k==='slot'){ const sk=d.k; const cur=slotRanks(G.user)[sk]; const rv=cur.v;
    const cands=Object.values(G.players).filter(p=>p.team!=null&&p.team!==G.user&&!p.foreign&&!p.ys&&!(p.joinY>G.year)&&pSlot(p)===sk&&ovr(p)>=rv+4&&healthy(p)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,8);
    const t=cands.find(p=>{ try{ return findPackages(p.id).length>0; }catch(e){ return false; } })||null; const until=Math.min(G.day+30,KD(7,31));
    const r=mreqAdd('slot',{sk,rank:d.r,v:rv,target:t?t.id:null},until);
    mreqAsk(r,`${nm}: ${SLOTK[sk]} 보강 요청`,`"${SLOTK[sk]} 자리가 리그 ${d.r}위입니다. 이대로는 버티기 어렵습니다.${t?` ${tname(t.team)}의 ${t.name}(${posLabel(t)}, ${t.age}세) 같은 선수가 필요합니다.`:''}" ${dmd(until)}까지 ${SLOTK[sk]}을(를) 보강해 달라고 합니다.`,
      [{l:'알겠다, 보강하겠다',fx:`${dmd(until)}까지 ${SLOTK[sk]} 자리에 지금보다 나은 선수를 데려오면 감독 관계 +6. 못 하면 -5.`},{l:'지금 전력으로 간다',fx:`감독 관계 -${m.ego>=70?5:3}.`}],1,t?t.id:null); return; }
  if(k==='out'){ const p=d; const h=seasonTotal(p,G.year,'1군'); const r=mreqAdd('out',{pid:p.id},G.day+30);
    mreqAsk(r,`${nm}: ${p.name} 정리 요청`,`"${p.name}은(는) ${statLine(h,p)}입니다. 엔트리 한 자리가 아깝습니다. 정리하고 그 자리를 다른 선수에게 주고 싶습니다." 연봉 ${money(p.sal)}${p.faC?` · 잔여 ${p.yrs}년`:''}.`,
      [{l:'트레이드 블록에 올린다',fx:'30일 안에 내보내면 감독 관계 +4. 블록에만 올려도 감독은 일단 받아들입니다.'},{l:'방출한다',fx:`바로 정리합니다. ${p.faC?`남은 연봉 절반(${money(Math.round(p.sal*p.yrs*.5))})을 지급합니다. `:''}감독 관계 +4, 선수단 분위기 조금 하락.`},{l:'더 기회를 준다',fx:`감독 관계 -${m.ego>=70?5:3}. 선수 기분은 오릅니다.`}],2,p.id); return; }
  if(k==='frep'){ const p=d; const alt=(G.fwatch||[]).map(w=>G.players[w.id]).filter(q=>q&&q.isP===p.isP&&q.foreign===p.foreign); const r=mreqAdd('frep',{pid:p.id},G.day+21);
    mreqAsk(r,`${nm}: 외국인 ${p.name} 교체 요청`,`"${p.name}로는 안 됩니다. 시즌을 포기할 수 없으니 바꿔 주십시오."${alt.length?` 관찰 명단의 ${alt.map(q=>q.name).join(', ')}을(를) 언급합니다.`:' 관찰 명단에 같은 유형 후보가 없습니다.'}`,
      [{l:'교체를 추진한다',fx:'21일 안에 교체하면 감독 관계 +5. 못 하면 -4.'},{l:'좀 더 지켜본다',fx:'감독 관계 -3.'}],1,p.id); return; }
  if(k==='fa'){ const rk=slotRanks(G.user); const weak=PSLOTS.filter(s=>s!=='DH').sort((a,b)=>rk[b].rank-rk[a].rank).slice(0,3);
    const pool=G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&weak.includes(pSlot(p))).sort((a,b)=>ovr(b)-ovr(a)); const p=pool[0]; if(!p)return;
    const o=dobj(G.day); const close=o.m<=2?KD(1,23):dnum(G.year+1,1,23); if(!G.fa||G.fa.closed||close-G.day<7)return;
    const r=mreqAdd('fa',{pid:p.id},Math.min(close,G.day+21)); const b=budget();
    mreqAsk(r,`${nm}: FA ${p.name} 영입 요청`,`"${SLOTK[pSlot(p)]}이(가) 우리 약점입니다. FA ${p.name}(${posLabel(p)}, ${p.age}세)만 잡아 주시면 내년은 다르게 싸울 수 있습니다." 선수 요구는 ${p.ask.years}년 연 ${money(p.ask.annual)}, 우리 예산 여유는 ${money(b.roomGoal)}입니다.`,
      [{l:'영입에 나서겠다',fx:'FA 시장이 닫히기 전에 잡으면 감독 관계 +7. 다른 팀에 뺏기면 -4.'},{l:'예산상 어렵다',fx:'감독 관계 -2. 감독도 사정은 압니다.'}],1,p.id); return; }
  if(k==='draft'){ const ps=playersOf(G.user); const pit=ps.filter(p=>p.isP).length; const C=ps.filter(p=>p.pos==='C'&&!p.isP).length; const rk=slotRanks(G.user);
    let pol=m.youth>=62?'HS':teamCtx(team(G.user)).contend?'COL':'HS'; if(pit<15||rk.SP.rank>=7)pol='P'; else if(C<3||rk.C.rank>=8)pol='C'; else if(['2B','SS','3B'].some(s=>rk[s].rank>=8))pol='IF'; else if(['LF','CF','RF'].some(s=>rk[s].rank>=8))pol='OF';
    const why={P:`투수가 ${pit}명뿐이고 선발진이 리그 ${rk.SP.rank}위입니다`,C:`포수가 ${C}명이고 포수 자리가 리그 ${rk.C.rank}위입니다`,IF:'내야가 약합니다',OF:'외야가 약합니다',HS:'당장보다 몇 년 뒤를 봐야 합니다',COL:'바로 쓸 선수가 필요합니다'}[pol];
    const r=mreqAdd('draft',{pol},G.cal.draft+1);
    mreqAsk(r,`${nm}: 드래프트는 ${DPOL[pol]}로`,`"${why}. 이번 드래프트는 ${DPOL[pol]}로 가 주셨으면 합니다." 스카우트팀 판단과는 다를 수 있습니다.`,
      [{l:'감독 의견대로 간다',fx:`드래프트 화면에 "감독 추천" 표시가 붙습니다. 1·2라운드에서 이 기조 선수를 뽑으면 감독 관계 +4.`},{l:'스카우트 판단을 따른다',fx:'감독 관계 -1. 감독은 크게 개의치 않습니다.'}],0); return; } }
EVH.mreq={ pick(e,i){ const r=mreqs().find(x=>x.id===e.data.rid); const m=G.mgr[G.user]; if(!r||!m)return ''; const L=e.opts.length;
    const neg=d=>{ m.rel=clamp(m.rel-d,0,100); return `감독 관계 -${d}.`; };
    if(r.k==='slot'){ if(i===0){ r.st='open'; return `${dmd(r.until)}까지 ${SLOTK[r.data.sk]} 보강을 약속했습니다.`; } r.st='no'; return neg(m.ego>=70?5:3); }
    if(r.k==='out'){ const p=G.players[r.data.pid]; if(!p||p.team!==G.user){ r.st='done'; return ''; }
      if(i===0){ p.listed=true; p.mor=clamp((p.mor??60)-4,0,100); r.st='open'; m.rel=clamp(m.rel+1,0,100); return `${p.name}을(를) 트레이드 블록에 올렸습니다. 감독 관계 +1.`; }
      if(i===1){ const nm=p.name; releasePlayer(p.id); r.st='done'; m.rel=clamp(m.rel+4,0,100); for(const q of playersOf(G.user))q.mor=clamp((q.mor??60)-1,0,100); return `${nm}을(를) 방출했습니다. 감독 관계 +4.`; }
      r.st='no'; p.mor=clamp((p.mor??60)+5,0,100); return `${p.name}에게 기회를 더 줍니다(기분 +5). `+neg(m.ego>=70?5:3); }
    if(r.k==='frep'){ if(i===0){ r.st='open'; return '21일 안에 교체를 추진합니다. 외국인 시장과 관찰 명단을 확인하세요.'; } r.st='no'; return neg(3); }
    if(r.k==='fa'){ if(i===0){ r.st='open'; return 'FA 협상에 나섭니다.'; } r.st='no'; return neg(2); }
    if(r.k==='draft'){ if(i===0){ r.st='open'; G.draftPol={y:G.year,k:r.data.pol}; return `드래프트 기조: ${DPOL[r.data.pol]}.`; } r.st='no'; G.draftPol=null; return neg(1); }
    return ''; } };
/* 약속을 지켰는지 */
function mreqCheck(){ const m=G.mgr[G.user]; if(!m)return; for(const r of mreqs()){ if(r.st!=='open')continue; let ok=false, fail=false;
    if(r.k==='slot'){ const cur=slotRanks(G.user)[r.data.sk]; const got=r.data.target&&G.players[r.data.target]&&G.players[r.data.target].team===G.user; ok=got||cur.v>=r.data.v+3; if(!ok&&G.day>r.until)fail=true; }
    else if(r.k==='out'){ const p=G.players[r.data.pid]; ok=!p||p.team!==G.user; if(!ok&&G.day>r.until){ r.st='half'; continue; } }
    else if(r.k==='frep'){ const p=G.players[r.data.pid]; ok=!p||p.team!==G.user; if(!ok&&G.day>r.until)fail=true; }
    else if(r.k==='fa'){ const p=G.players[r.data.pid]; ok=p&&p.team===G.user; if(!ok&&(p&&p.team!=null&&p.team!==G.user||G.fa&&G.fa.closed))fail=true; }
    else if(r.k==='draft'){ if(G.draft&&G.draft.done&&G.draft.y===G.year){ const mine=G.draft.picks.filter(x=>x.tid===G.user&&x.pid>0&&x.rd<=2).map(x=>G.players[x.pid]).filter(Boolean); ok=mine.some(p=>draftFit(p,r.data.pol)); fail=!ok; } }
    const gain={slot:6,out:4,frep:5,fa:7,draft:4}[r.k], loss={slot:5,out:0,frep:4,fa:4,draft:1}[r.k];
    if(ok){ r.st='done'; r.end=G.day; m.rel=clamp(m.rel+gain,0,100); mail('감독실',`${m.name} 감독: "고맙습니다"`,`${MREQK[r.k]}을(를) 들어주셨습니다. 감독 관계 +${gain}.${r.k==='slot'||r.k==='fa'?' 선수단 분위기도 좋아졌습니다.':''}`,{kind:'감독'}); if(r.k==='slot'||r.k==='fa'){ if(!G.form||G.day>G.form.until)G.form={until:G.day+10,b:.4}; } }
    else if(fail){ r.st='fail'; r.end=G.day; m.rel=clamp(m.rel-loss,0,100); if(loss)mail('감독실',`${m.name} 감독: "약속은 어떻게 된 겁니까"`,`${MREQK[r.k]}이(가) 지켜지지 않았습니다. 감독 관계 -${loss}.`,{kind:'감독',imp:true}); } } }

/* ===== 구단주와의 소통: 단장이 돈을 요청하고, 구단주가 먼저 주문하기도 한다 ===== */
function grants(){ return G.grants=G.grants||[]; }
function grantAmt(y){ return sum(grants().filter(g=>g.y===(y??G.year)&&g.ok).map(g=>g.amt)); }
function ownAskLeft(){ const o=dobj(G.day); const mk=o.y*100+o.m; return grants().some(g=>g.mk===mk&&g.by==='gm')?0:1; }
/* 성사 가능성: 신뢰, 구단주 성향, 순위, 목적 */
function ownOdds(amt,pur){ const t=team(G.user); if(t.indie)return 0; const ow=t.owner; const rk=uRank(); let p=.35+(t.trust-50)/80;
  const contend=rk<=5||teamCtx(t).contend; if(ow==='win')p+=contend?.2:-.05; if(ow==='profit')p-=.18; if(ow==='pr')p+=.05;
  if(pur&&pur.k==='fa'){ const q=G.players[pur.pid]; if(q){ if(ovr(q)>=62)p+=ow==='pr'?.2:.1; } p+=.08; } if(pur&&pur.k==='frep')p+=.05;
  p-=Math.max(0,amt-1000)/4000; const asked=grants().filter(g=>g.y===G.year&&g.by==='gm').length; p-=asked*.08; return clamp(p,.03,.92); }
function oddsTxt(p){ return p>=.7?'받아들일 가능성이 큽니다':p>=.45?'반반입니다':p>=.25?'쉽지 않습니다':'거의 어렵습니다'; }
function ownerAsk(amt,pur){ const t=team(G.user); if(t.indie)return '독립구단이라 모기업 지원이 없습니다. 스폰서와 자체 수익으로 운영합니다.'; if(!ownAskLeft())return '이번 달에는 이미 요청했습니다. 다음 달에 다시 요청할 수 있습니다.';
  const p=ownOdds(amt,pur); const ok=R()<p; const B=bossOf(G.user); const o=dobj(G.day); const g={y:G.year,mk:o.y*100+o.m,d:G.day,amt,pur:pur||null,ok,by:'gm',st:ok?'open':'no',until:pur&&pur.k==='fa'?KD(12,31):pur&&pur.k==='frep'?Math.min(G.day+30,KD(8,15)):null};
  grants().unshift(g); if(G.grants.length>40)G.grants.length=40; const what=pur?pur.k==='fa'?`FA ${G.players[pur.pid]?.name||''} 영입 자금`:pur.k==='frep'?'외국인 교체 자금':'운영 자금':'운영비 증액';
  if(ok){ grantApply(amt); if(!pur)g.st='done'; mail('구단주실',`구단주 승인: ${what} ${money(amt)}`,`${B.own.name} 회장이 ${what} ${money(amt)}을(를) 승인했습니다. ${pur?'목적대로 쓰지 않으면 신뢰가 깎입니다. ':''}올해 모기업 지원 한도와 구단주 목표가 그만큼 늘었습니다.`,{kind:'구단주'}); return `승인됐습니다. ${what} ${money(amt)}.`; }
  t.trust=clamp(t.trust-1,0,100); mail('구단주실',`구단주 반려: ${what}`,`${B.own.name} 회장이 요청을 반려했습니다. "${t.owner==='profit'?'지금 적자부터 줄이세요.':t.owner==='win'?'성적으로 먼저 증명하세요.':'지금은 때가 아닙니다.'}" 구단주 신뢰 -1.`,{kind:'구단주'}); return `반려됐습니다. 구단주 신뢰 -1.`; }
function grantApply(amt){ const t=team(G.user); t.grant=(t.grant&&t.grant.y===G.year?t.grant.amt:0)+amt; t.grant={y:G.year,amt:t.grant}; const g=G.goals; if(g&&g.y===G.year){ const cap=supportCap(t); g.sup=clamp(g.sup+amt/Math.max(1,cap),0,1.5); } }
/* 목적이 있는 지원금: 지켰는지 */
function grantCheck(){ const t=team(G.user); for(const g of grants()){ if(g.st!=='open'||!g.pur)continue; let ok=false, fail=false;
    if(g.pur.k==='fa'){ const p=G.players[g.pur.pid]; ok=p&&p.team===G.user; fail=!ok&&(p&&p.team!=null&&p.team!==G.user||G.fa&&G.fa.closed||G.day>g.until); }
    else if(g.pur.k==='frep'){ const p=G.players[g.pur.pid]; ok=!p||p.team!==G.user; fail=!ok&&G.day>g.until; }
    else if(g.pur.k==='boost'){ ok=(G.trades||[]).some(x=>x.y===G.year&&x.d>=g.d)||foreignOf(G.user).some(p=>p.fy===G.year&&(p.story||[]).some(s=>s.d>=g.d)); fail=!ok&&G.day>g.until; }
    if(ok){ g.st='done'; t.trust=clamp(t.trust+(g.by==='own'?4:2),0,100); note('구단주',`구단주가 지원한 돈이 목적대로 쓰였습니다. 구단주 신뢰 +${g.by==='own'?4:2}.`); }
    else if(fail){ g.st='fail'; t.trust=clamp(t.trust-(g.by==='own'?4:3),0,100); mail('구단주실','구단주: "그 돈은 어디에 썼습니까"',`지원 목적(${g.pur.k==='fa'?'FA 영입':g.pur.k==='frep'?'외국인 교체':'전력 보강'})이 이뤄지지 않았습니다. 구단주 신뢰 -${g.by==='own'?4:3}.`,{kind:'구단주',imp:true}); } } }
/* 구단주가 먼저: FA 기간 스타 영입 주문, 7월 우승 보강 자금 */
function ownerPush(){ const t=team(G.user); if(t.indie||G.gameOver||G.unemp)return; const B=bossOf(G.user); const o=dobj(G.day); const mk=o.y*100+o.m; if(grants().some(g=>g.by==='own'&&g.y===G.year&&g.kind===(G.fa&&G.fa.open&&!G.fa.closed?'fa':'boost')))return;
  if(G.fa&&G.fa.open&&!G.fa.closed&&t.trust>=35&&(t.owner==='pr'||t.owner==='win')&&R()<.5){ const star=G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&ovr(p)>=60).sort((a,b)=>ovr(b)-ovr(a))[0]; if(!star)return;
    const amt=round5(star.ask.annual*(t.owner==='pr'?1:.8)); const g={y:G.year,mk,d:G.day,amt,pur:{k:'fa',pid:star.id},ok:true,by:'own',kind:'fa',st:'open',until:KD(12,31)}; grants().unshift(g); grantApply(amt);
    mail('구단주실',`구단주 주문: "${star.name}을(를) 잡으세요"`,`${B.own.name} 회장이 직접 연락했습니다. "${t.owner==='pr'?'팬들이 원하는 스타가 필요합니다':'우승하려면 저런 선수가 있어야 합니다'}. ${star.name} 영입 자금으로 ${money(amt)}을(를) 더 내겠습니다." 영입하면 구단주 신뢰 +4, 놓치면 -4.`,{imp:true,kind:'구단주',ref:star.id,acts:[{l:`${star.name} 협상실`,a:'faOpen',v:star.id}]}); return; }
  if(period()==='season'&&G.day>=KD(7,1)&&G.day<=KD(7,10)&&t.owner==='win'&&t.trust>=40&&uRank()<=4&&R()<.6){ const amt=1500; const g={y:G.year,mk,d:G.day,amt,pur:{k:'boost'},ok:true,by:'own',kind:'boost',st:'open',until:KD(7,31)}; grants().unshift(g); grantApply(amt);
    mail('구단주실','구단주: "올해 우승을 노립시다"',`${B.own.name} 회장이 보강 자금 ${money(amt)}을(를) 내놨습니다. 7월 31일까지 트레이드나 외국인 교체로 전력을 보강하면 구단주 신뢰 +4, 아무것도 안 하면 -4.`,{imp:true,kind:'구단주',acts:[{l:'트레이드 센터',a:'go',v:'trade:market'}]}); } }

function uRank(){ try{ const i=standingsNow().findIndex(x=>x.tid===G.user); return i>=0?i+1:5; }catch(e){ return 5; } }

/* ===== 감독과의 공생: 선수 보는 눈 · 미는 선수 · 휴식/투수 관리 성향과 단장 지시 ===== */
function mgrAttr(m){ if(!m)return m; const k=m.id||'x'; if(m.rest==null)m.rest=Math.round(clamp(30+u01('mrest',k)*55+(m.youth-50)*.25,20,90)); if(m.arm==null)m.arm=Math.round(clamp(25+u01('marm',k)*60-(m.pen-50)*.2,20,90)); if(m.eye==null)m.eye=Math.round(clamp(m.tac*.45+(m.youth||50)*.2+m.fame*.15+u01('meye',k)*25,25,90)); return m; }
function mgrDir(){ return G.mgrDir=G.mgrDir||{}; }
/* 단장 지시가 반영된 실제 성향 */
function mgrRestEff(m){ mgrAttr(m); const d=mgrDir(); return d.rest&&d.rest.ok&&m.id===d.rest.mid?Math.max(m.rest,70):m.rest; }
function mgrArmEff(m){ mgrAttr(m); const d=mgrDir(); return d.arm&&d.arm.ok&&m.id===d.arm.mid?Math.min(m.arm,35):m.arm; }
function setMgrDir(k,on){ const m=G.mgr[G.user]; if(!m||m.interim)return '감독이 없습니다.'; mgrAttr(m); mgrFix(m); const d=mgrDir();
  if(!on){ delete d[k]; return k==='arm'?'투수 관리 지시를 풀었습니다. 감독 본래 성향대로 운영합니다.':'휴식 보장 지시를 풀었습니다.'; }
  const gap=k==='arm'?Math.max(0,m.arm-35)/55:Math.max(0,70-m.rest)/50; const s=1-gap*.45-(m.ego-50)/70+(m.rel-60)/80; const ok=R()<clamp(s,.15,.97);
  d[k]={ok,mid:m.id,day:G.day}; if(ok){ m.rel=clamp(m.rel-(gap>.5?2:0),0,100); return `${m.name} 감독: "알겠습니다. ${k==='arm'?'투수들 무리시키지 않겠습니다':'주전도 쉬게 하면서 가겠습니다'}."${gap>.5?' (본래 성향과 달라 관계 -2)':''}`; }
  m.rel=clamp(m.rel-4,0,100); return `${m.name} 감독: "${k==='arm'?'이길 수 있는 경기는 잡아야 합니다. 투수 운용은 제게 맡겨 주십시오':'주전은 뛰어야 주전입니다'}." 지시를 따르지 않습니다(관계 -4). 관계가 더 좋아지면 다시 지시해 보세요.`; }
/* 감독의 눈: 장래 예측. 안목이 좋을수록 실제와 가깝다 */
function mgrView(p){ const m=G.mgr[G.user]; if(!m||m.interim||!p||p.team!==G.user)return null; mgrAttr(m); if(m.rel<30)return {mute:true};
  const sd=Math.max(1.5,9.5-m.eye/10); const fut=clamp(Math.round(p.pot+hn('meye'+m.id+':'+G.year,p.id)*sd),20,80); const cur=Math.round(ovr(p));
  const line=fut-cur>=8?(fut>=62?'2~3년 안에 팀의 기둥이 됩니다':'꾸준히 쓰면 1군 주전감입니다'):fut-cur>=3?'조금 더 올라옵니다':p.age>=31?'내려가는 길입니다. 길게 보지 않는 게 좋습니다':'지금이 거의 다 큰 모습입니다';
  return {fut,line,sd,eye:m.eye}; }
/* 감독이 미는 선수: 시즌마다 1~2명. 단장이 함께 밀어주면 성장이 빨라진다 */
function mpickPlan(){ const m=G.mgr[G.user]; if(!m||m.interim)return; mgrAttr(m); const P=G.mpick; if(P&&P.y===G.year&&P.mid===m.id)return;
  const cands=domestic(G.user).filter(p=>p.age<=26&&!p.ys&&!(p.joinY>G.year)).map(p=>({p,v:mgrView(p)})).filter(x=>x.v&&!x.v.mute&&x.v.fut-ovr(x.p)>=5).sort((a,b)=>(b.v.fut-ovr(b.p)*.3)-(a.v.fut-ovr(a.p)*.3)).slice(0,2);
  G.mpick={y:G.year,mid:m.id,ids:cands.map(x=>x.p.id),back:null,day:G.day}; if(!cands.length)return;
  evNew('mpick',`${m.name} 감독이 미는 선수`,`"${cands.map(x=>`${x.p.name}(${posLabel(x.p)}, ${x.p.age}세)`).join(', ')}. 제가 보기엔 ${cands[0].v.line.replace(/[.]$/,'')}. 올해 출전 기회와 훈련을 몰아주고 싶습니다." 감독의 선수 보는 눈(안목) ${m.eye}.`,
    [{l:'함께 밀어준다',fx:'올해 이 선수들의 성장 속도가 30% 빨라지고 기분이 오릅니다. 감독 관계 +4. 시즌 중 트레이드하면 감독이 크게 서운해합니다(-6).'},{l:'성적이 먼저다',fx:'변화 없음. 감독 관계 -2.'}],{from:'감독실',ref:cands[0].p.id,data:{ids:cands.map(x=>x.p.id)},def:0,exp:7}); }
EVH.mpick={ pick(e,i){ const m=G.mgr[G.user]; if(!m)return ''; if(i===0){ G.mpick.back=true; m.rel=clamp(m.rel+4,0,100); for(const id of e.data.ids){ const p=G.players[id]; if(p)p.mor=clamp((p.mor??60)+5,0,100); } return '감독과 함께 밀어주기로 했습니다. 감독 관계 +4.'; } G.mpick.back=false; m.rel=clamp(m.rel-2,0,100); return '감독 관계 -2.'; } };
function mpickMult(p){ const P=G.mpick; return P&&P.back&&P.y===G.year&&P.ids.includes(p.id)&&p.team===G.user?1.3:1; }
/* 감독 안목 성적표: 예측과 실제 성장 비교 (시즌 끝에) */
function mgrEyeReport(){ const m=G.mgr[G.user]; const P=G.mpick; if(!m||!P||P.y!==G.year||!P.ids.length)return; const L=P.ids.map(id=>G.players[id]).filter(Boolean); if(!L.length)return;
  const txt=L.map(p=>{ const h=(p.oh||[]).slice(-2); const d=h.length===2?h[1].o-h[0].o:0; return `${p.name} ${d>=0?'+':''}${d}`; }).join(', '); (G.mpickLog=G.mpickLog||[]).unshift({y:G.year,mid:m.id,txt,back:P.back}); if(G.mpickLog.length>10)G.mpickLog.length=10; }
/* 관계가 주는 것: 선수단 분위기(경기력), 좋으면 공개 지지, 나쁘면 언론 불화설·사퇴 */
function mgrRelBoost(p){ if(p.team!==G.user)return 0; const m=G.mgr[G.user]; if(!m||m.interim)return 0; return clamp((m.rel-55)/60,-.5,.4); }
function mgrRelWeek(){ const m=G.mgr[G.user]; if(!m||m.interim||period()!=='season')return; mgrFix(m); prInit();
  if(m.rel>=78&&R()<.08){ news('언론',`${m.name} 감독 "단장님과 호흡 최고"`,'프런트와 현장이 한 방향을 보고 있다는 평가입니다.',2); G.pr.press=clamp(G.pr.press+1,0,100); }
  if(m.rel<=25&&R()<.15){ news('언론',`${tshort(G.user)} 감독-단장 불화설`,`${m.name} 감독이 프런트 결정에 불만을 드러냈습니다.`,-2); G.pr.fan=clamp(G.pr.fan-1,0,100); G.pr.press=clamp(G.pr.press-2,0,100);
    if(m.ego>=65&&m.rel<=15&&R()<.3){ const nm=m.name; resignMgr(); mail('감독실',`${nm} 감독 자진 사퇴`,`${nm} 감독이 "더는 함께하기 어렵다"며 물러났습니다. 수석코치가 감독대행을 맡습니다. 새 감독을 선임하세요.`,{imp:true,kind:'감독',acts:[{l:'감독 후보',a:'go',v:'staff:mgr'}]}); } } }
/* ===== 스타 파워: 수상·기록·활약이 마케팅 수입이 된다 ===== */
function starPower(p){ let s=0; for(const a of (p.aw||[])){ const y=+String(a).slice(0,4); const age=G.year-y; if(age>2||isNaN(y))continue; const w=age===0?1:age===1?.7:.4;
    s+=(a.includes('MVP')?40:a.includes('신인왕')?20:a.includes('골든')?15:5)*w; }
  const f=(G.feats||[]).filter(x=>x.pid===p.id&&x.maj&&x.y>=G.year-1).length; s+=f*8; const h=seasonTotal(p,G.year,'1군'); if(h){ const w=warOf(h,p); if(w>=4)s+=(w-3)*5; } if(p.foreign)s*=.6; return Math.round(s); }
function teamStar(tid){ const L=playersOf(tid??G.user).map(p=>({p,s:starPower(p)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,3); return {v:sum(L.map(x=>x.s)),L}; }

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
const STAD_COST=[0,0,600,1200,2200,3600], STAD_UP=[0,30,60,110,180,280], STAD_DAYS=[0,0,60,90,120,150];
const PRICE=[{l:'할인',m:.8,dem:1.12,fan:.5,d:'관중이 늘고 팬 여론이 오르지만 표값 수입이 줄어듭니다.'},{l:'보통',m:1,dem:1,fan:0,d:'리그 평균 수준입니다.'},{l:'인상',m:1.15,dem:.87,fan:-.5,d:'표값 수입이 늘지만 관중과 팬 여론이 조금 줄어듭니다.'},{l:'고가',m:1.3,dem:.72,fan:-1.2,d:'매진이 잦은 인기 구단이 아니면 손해입니다. 팬 여론이 매달 떨어집니다.'}];
const TICKET=.014; // 관중 1명당 표값 수입 1만4천원(백만원 단위, 게임 재정 기준)
function stadOf(tid){ const t=team(tid); if(!t.stad){ const r=k=>2+(hn('st'+k,tid)>.35?1:0); t.stad={lv:{seat:r('s'),fnb:r('f'),prem:r('p'),vis:r('v'),turf:r('t')},price:1,build:[]}; } return t.stad; }
function stadCap(tid){ const S=stadOf(tid); return Math.round((S.cap||STAD_CAP[tid])-(S.lv.prem-2)*300); }
function stadBuilt(tid){ const S=stadOf(tid); return S.built||STAD_BUILT[tid]||2000; }
/* 구장 연식 효과: 30년 넘으면 관람 환경이 낡아 수요 -4%, 새 구장은 개장 3년간 +12%에서 서서히 줄어든다, 공사 중 -2% */
function stadAgeF(tid){ const S=stadOf(tid); const age=G.year-stadBuilt(tid); let f=age>=30?.96:1; if(age<3)f*=1+.12*(3-age)/3+.04; const N=S.proj; if(N&&N.stage==='build')f*=.98; return f; }
function stadName(tid){ const S=stadOf(tid); return S.name||STAD_NM[tid]||`${team(tid).city} 야구장`; }
function stadTurfM(tid){ return 1-(stadOf(tid).lv.turf-2)*.05; }
function attOf(h,a,day,noise){ const t=team(h), S=stadOf(h), cap=stadCap(h); const r=G.sea&&G.sea.rec&&G.sea.rec[h]; const g=r?r.w+r.l:0; const wp=g>=10?r.w/g:.5;
  const o=dobj(day); const dow=o.w===6||o.w===0?1.28:o.w===5?1.08:.88; const opp=1+(team(a).market-1)*.35;
  const fan=h===G.user&&G.pr?(.9+G.pr.fan/500):1; const late=o.m>=8&&wp<.44?.9:1;
  const f=.84*Math.pow(t.market,.5)*(.82+.3*t.pop)*(.9+(wp-.5)*1.3)*fan*dow*opp*late*PRICE[S.price].dem*(1+(S.lv.seat-2)*.04)*(1+(S.lv.vis-2)*.015)*stadAgeF(h)*(S.dome?1.06:1);
  if(noise===null){ /* 기대 관중: 3점 가우스-에르미트 근사로 매진 상한까지 반영 */ const z=1.732*.2; return Math.round(cap*(Math.min(1,f*Math.exp(-z))/6+Math.min(1,f)*2/3+Math.min(1,f*Math.exp(z))/6)); }
  const n=Math.exp(N(0,.2)); return Math.min(cap,Math.round(cap*f*n)); }
function stadGame(day,h,a){ const att=attOf(h,a,day); const cap=stadCap(h); G.sea.att=G.sea.att||{}; const A=G.sea.att[h]||(G.sea.att[h]={n:0,sum:0,so:0,best:0});
  A.n++; A.sum+=att; if(att>=cap)A.so++; if(att>A.best)A.best=att; return {att,so:att>=cap}; }
function homeGames(tid,from,to){ const L=[]; for(let d=from;d<=to;d++){ const gs=G.cal.sched[d]; if(!gs)continue; for(const [h,a] of gs)if(h===tid)L.push([d,a]); } return L; }
/* 시즌 관중·구장 수입 전망: 지금까지 실제 + 남은 홈경기 예상 */
function stadProj(tid,next){ const S=stadOf(tid); const c=G.cal;
  /* 시즌이 끝난 뒤 예산 전망(next): 지난 일정에 지금 가격·시설을 넣어 다음 시즌 기대 관중을 낸다 */
  if(next&&c&&c.sched){ let att=0,n=0; for(const [d,a] of homeGames(tid,c.open,c.end)){ att+=attOf(tid,a,d,null); n++; } att=Math.round(att);
    return {att,n,avg:n?Math.round(att/n):0,ticket:Math.round(att*TICKET*PRICE[S.price].m),fnb:Math.round(att*.0003*(S.lv.fnb-2)),prem:(S.lv.prem-2)*600,ad:(S.lv.vis-2)*400+(S.dome?2500:0),up:sum(STAD_ITEMS.map(x=>STAD_UP[S.lv[x.k]]-STAD_UP[2]))}; }
  const A=(G.sea&&G.sea.att&&G.sea.att[tid])||{n:0,sum:0}; let rest=0, rn=0;
  let done=A.sum, dn=A.n;
  if(c&&c.sched){ for(const [d,a] of homeGames(tid,Math.max(G.day+1,c.open),c.end)){ rest+=attOf(tid,a,d,null); rn++; }
    /* 예전 저장본처럼 시즌 중간부터 집계된 경우: 이미 치른 홈경기 수에 맞춰 늘린다 */
    const played=homeGames(tid,c.open,Math.min(G.day,c.end)).length; if(played>dn){ if(dn>0){ done=A.sum/dn*played; } else { done=0; for(const [d,a] of homeGames(tid,c.open,Math.min(G.day,c.end)))done+=attOf(tid,a,d,null); } dn=played; } }
  const att=Math.round(done+rest); const n=dn+rn;
  return {att,n,avg:n?Math.round(att/n):0,ticket:Math.round(att*TICKET*PRICE[S.price].m),fnb:Math.round(att*.0003*(S.lv.fnb-2)),prem:(S.lv.prem-2)*600,ad:(S.lv.vis-2)*400+(S.dome?2500:0),
    up:sum(STAD_ITEMS.map(x=>STAD_UP[S.lv[x.k]]-STAD_UP[2]))}; }
function stadStart(k){ const S=stadOf(G.user); const it=STAD_ITEMS.find(x=>x.k===k); if(!it)return '없는 시설입니다.'; const lv=S.lv[k];
  if(lv>=5)return '이미 최고 단계입니다.'; if((S.build||[]).some(b=>b.k===k))return '이미 공사 중입니다.';
  if(period()==='season'||period()==='post')return '구장 공사는 시즌이 끝난 뒤(10월~2월)에만 시작할 수 있습니다.';
  const c=STAD_COST[lv+1]; const t=team(G.user); if(t.cash<c)return `자금이 부족합니다. 공사비 ${money(c)}가 필요합니다.`;
  t.cash-=c; S.build=(S.build||[]).concat({k,lv:lv+1,done:G.day+STAD_DAYS[lv+1]}); G.spend.stad=(G.spend.stad||0)+c;
  addLog(`${stadName(G.user)} ${it.l} ${lv+1}단계 공사를 시작했습니다(공사비 ${money(c)}, ${STAD_DAYS[lv+1]}일).`); return ''; }
function stadDaily(){ for(const t of G.teams){ const S=t.stad; if(!S||!S.build||!S.build.length)continue; S.build=S.build.filter(b=>{ if(G.day<b.done)return true; S.lv[b.k]=b.lv; if(t.id===G.user){ const it=STAD_ITEMS.find(x=>x.k===b.k); chron('stad',`${it.l} ${b.lv}단계 완공`); note('구장',`${it.l} ${b.lv}단계 공사가 끝났습니다.`); news('구단',`${t.city} ${t.nick}, ${it.l} 새단장`,`${stadName(t.id)}의 ${it.l}이(가) ${b.lv}단계로 바뀌었습니다. 팬들의 관람 환경이 좋아졌습니다.`,1); } return false; }); } }
function stadSeasonNote(){ const A=G.sea.att&&G.sea.att[G.user]; if(!A||!A.n)return; const cap=stadCap(G.user); const avg=Math.round(A.sum/A.n);
  const rk=G.teams.map(t=>{ const x=G.sea.att[t.id]; return {id:t.id,v:x&&x.n?x.sum/x.n:0}; }).sort((a,b)=>b.v-a.v).findIndex(x=>x.id===G.user)+1;
  mail('운영팀',`${G.year} 홈 관중 결산과 구장 공사`,`올해 ${stadName(G.user)} 홈 ${A.n}경기 관중은 ${A.sum.toLocaleString('ko-KR')}명, 경기당 ${avg.toLocaleString('ko-KR')}명(좌석 점유율 ${Math.round(avg/cap*100)}%, 리그 ${rk}위)입니다. 매진 ${A.so}회.\n\n구장 시설 공사는 지금부터 2월까지 시작할 수 있습니다. 관람석을 고치면 관중이, 매장과 프리미엄석을 늘리면 1인당 수입이 오릅니다.`,{kind:'구장',acts:[{l:'구장 관리',a:'go',v:'club:stad'}]}); }
/* ===== 신구장 건립 =====
   실제로 신구장은 지자체가 짓고 구단이 일부를 분담한다(예: 2025년 개장한 대전 신구장). 게임에서는
   1) 지자체 협상(6개월) → 2) 규모 선택 → 3) 3년 공사(분담금 3년 분납) → 4) 개장 */
const NEWSTAD=[{k:'mid',l:'실속형',cap:21000,cost:9000,d:'2만1천 석. 분담금 90억(3년 분납).'},{k:'big',l:'대형',cap:25000,cost:16000,d:'2만5천 석. 분담금 160억(3년 분납). 관중이 많은 구단에 유리합니다.'},{k:'dome',l:'돔구장',cap:23000,cost:28000,d:'2만3천 석 돔. 분담금 280억(3년 분납). 날씨와 더위에 상관없이 관중이 오고(+6%), 비시즌 공연·행사 대관으로 연 25억 안팎을 더 법니다.'}];
function newStadCan(){ const S=stadOf(G.user); return !S.proj&&G.year-stadBuilt(G.user)>=20; }
function newStadTalk(){ const S=stadOf(G.user); if(!newStadCan())return '지금은 신구장 협상을 시작할 수 없습니다(개장 20년 이상 구장만).'; const t=team(G.user);
  if(t.trust<45)return `구단주 신뢰(${t.trust})가 45 이상이어야 구단주가 지자체 협상을 허락합니다.`;
  S.proj={stage:'talk',start:G.day,res:G.day+180}; addLog(`${team(G.user).city}시와 신구장 건립 협상을 시작했습니다. 결과는 ${dmd(G.day+180)}쯤 나옵니다.`);
  news('구단',`${t.city} ${t.nick}, 신구장 건립 추진`,`${stadName(G.user)} 개장 ${G.year-stadBuilt(G.user)}년. 구단이 ${t.city}시와 신구장 협상에 들어갔습니다.`,1); return ''; }
function newStadDaily(){ const S=stadOf(G.user); const N=S.proj; if(!N)return; const t=team(G.user);
  if(N.stage==='talk'&&G.day>=N.res){ const pr=clamp(.35+(t.trust-50)/100+(t.market-1)*.6+(G.rep-50)/200,.15,.85);
    if(R()<pr){ N.stage='plan'; stop('구장',`${t.city}시가 신구장 건립에 합의했습니다. 시가 공사비 대부분을 내고 구단이 일부를 분담합니다. 구단 → 구장에서 규모를 고르세요.`); news('구단',`${t.city}시-${t.nick}, 신구장 건립 합의`,'새 야구장 시대가 열립니다.',2); }
    else { S.proj=null; S.retry=G.year+1; stop('구장',`${t.city}시와의 신구장 협상이 결렬됐습니다. 시 재정 여건이 이유입니다. 내년에 다시 시도할 수 있습니다.`); } }
  if(N.stage==='build'&&G.day>=N.done){ S.cap=N.cap; S.built=G.year; S.name=N.k==='dome'?`${t.city} 돔구장`:`${t.city} 새 야구장`; if(N.k==='dome')S.dome=true; for(const k of Object.keys(S.lv))S.lv[k]=Math.max(S.lv[k],4); S.proj=null; t.pop=clamp(t.pop+.08,.7,1.45);
    chron('stad',`${S.name} 개장 (${N.cap.toLocaleString('ko-KR')}석)`);
    stop('구장',`${S.name}이(가) 문을 열었습니다. ${N.cap.toLocaleString('ko-KR')}석, 시설은 모두 4단계 이상입니다. 개장 첫 몇 해는 관중이 크게 늡니다.`); news('구단',`${S.name} 개장`,`${t.city} ${t.nick}의 새 홈구장이 문을 열었습니다.`,3); } }
function newStadPick(k){ const S=stadOf(G.user); const N=S.proj; const o=NEWSTAD.find(x=>x.k===k); if(!N||N.stage!=='plan'||!o)return '선택할 수 없습니다.';
  N.stage='build'; N.k=k; N.cap=o.cap; N.cost=o.cost; N.paid=0; const y=dobj(G.day).m>=10?G.year+4:G.year+3; N.done=dnum(y,3,1); addLog(`신구장 ${o.l} 규모로 착공했습니다. ${dmd(N.done)} ${y}년 개장 예정.`); return ''; }
/* 분담금은 결산 때 3년에 나눠 낸다 */
function newStadDue(tid){ const S=stadOf(tid); const N=S.proj; if(!N||N.stage!=='build')return 0; return Math.min(Math.round(N.cost/3),N.cost-(N.paid||0)); }

/* AI 구단: 돈이 넉넉하면 비시즌에 시설 하나를 손본다 */
function stadAI(){ for(const t of G.teams){ if(t.id===G.user)continue; const S=stadOf(t.id); if(t.cash<6000||R()>.35)continue; const k=pick(['seat','fnb','vis','prem','turf']); const lv=S.lv[k]; if(lv>=4)continue; const c=STAD_COST[lv+1]; t.cash-=c; S.build=(S.build||[]).concat({k,lv:lv+1,done:G.day+STAD_DAYS[lv+1]}); } }
function starIncome(tid){ return Math.round(teamStar(tid).v*14*team(tid??G.user).market); }

function starAwardsNews(){ const T=teamStar(G.user); const L=T.L.filter(x=>x.s>=25); if(!L.length)return; prInit(); const t=team(G.user);
  news('구단',`${t.city} ${t.nick}, ${L.map(x=>x.p.name).join('·')} 앞세운 스타 마케팅`,`수상과 활약으로 이름값이 오른 선수들의 유니폼과 광고 수요가 늘고 있습니다. 내년 스타 마케팅 수입 예상 ${money(starIncome(G.user))}.`,2,{fanW:1});
  if(t.owner==='pr'){ t.trust=clamp(t.trust+2,0,100); note('구단주','홍보를 중시하는 구단주가 스타 선수들의 활약을 반깁니다. 구단주 신뢰 +2.'); } }

function mpickTraded(ids){ const P=G.mpick; const m=G.mgr[G.user]; if(!P||!P.back||P.y!==G.year||!m)return; const hit=ids.filter(id=>P.ids.includes(id)); if(!hit.length)return; m.rel=clamp(m.rel-6,0,100); P.ids=P.ids.filter(id=>!hit.includes(id));
  mail('감독실',`${m.name} 감독: "제가 키우던 선수를…"`,`함께 밀어주기로 한 선수를 트레이드했습니다. 감독 관계 -6.`,{kind:'감독',imp:true}); }

/* ===== 다른 구단 코치 빼 오기 ===== */
const PROMO={fp:'pc',fb:'bc',fm:'hc',pc:'hc',bc:'hc',cc:'hc',rc:'hc',dc:'hc'};
function poachOff(){ const per=period(); return per!=='season'&&per!=='post'; }
function poachTerms(tid,role,toRole){ const c=G.coach&&G.coach[tid]&&G.coach[tid][role]; if(!c)return null; const promo=toRole!==role; const sal=round5(c.sal*(promo?1.15:1.35));
  const comp=poachOff()&&c.yrs<=1?0:Math.round(c.sal*Math.max(.5,c.yrs-(poachOff()?1:.5))*.5); const m=G.mgr[tid]; const clan=!!(c.clan&&m&&c.clan===m.id);
  let ch=.42+(promo?.25:0)-(clan?.35:0)-(c.yrs>=2&&!poachOff()?.08:0); const ur=uRank(); const st=standingsNow(); const tr=st.findIndex(x=>x.tid===tid)+1; if(period()==='season'&&tr>0)ch+=(tr-ur)*.015;
  const um=G.mgr[G.user]; if(um&&!um.interim&&um.fame>=70)ch+=.06; const ob=c.ob&&G.ob?G.ob.find(o=>o.id===c.ob):null; if(ob&&ob.mine)ch+=.2+Math.min(.1,ob.bond/200);
  if(team(tid).rel<35)ch-=.1; return {c,sal,comp,promo,clan,chance:clamp(ch,.05,.9),toRole}; }
function poachCoach(tid,role,toRole){ if(!G.coach||tid===G.user)return '대상이 아닙니다.'; const T=poachTerms(tid,role,toRole); if(!T)return '그 자리에 코치가 없습니다.'; const c=T.c; G.poachCd=G.poachCd||{};
  if(G.poachCd[c.id]>G.day)return `${c.name} 코치는 ${dmd(G.poachCd[c.id])}까지 다시 만나 주지 않습니다.`; const t=team(tid);
  if(R()>=T.chance){ G.poachCd[c.id]=G.day+30; t.rel=clamp(t.rel-1,0,100); return `${c.name} 코치가 제의를 거절했습니다. "${T.clan?`${G.mgr[tid].name} 감독님을 두고 갈 수 없습니다`:'지금 팀에서 하던 일을 마무리하고 싶습니다'}." (${tshort(tid)} 단장 친분 -1)`; }
  const C=G.coach[G.user]; const old=C[toRole]; if(old){ const pay=Math.round(old.sal*Math.max(0,old.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; addLog(`${CROLE[toRole].l} ${old.name}와(과) 결별했습니다(잔여 연봉 정산 ${money(pay)}).`); old.yrs=0; old.clan=null; G.cmarket.push(old); }
  if(T.comp){ G.spend.coach=(G.spend.coach||0)+T.comp; t.cash+=T.comp; }
  G.coach[tid][role]=null; const rep=obAiCoach(tid,role)||mkCoach(role); if(!rep.yrs)rep.yrs=ri(1,3); G.coach[tid][role]=rep;
  c.role=toRole; c.sal=T.sal; c.yrs=2; c.clan=null; c.from=tid; C[toRole]=c; t.rel=clamp(t.rel-(T.comp?2:4),0,100); obHireBonus(c.ob,CROLE[toRole].l);
  wire('코치',`${tshort(G.user)}, ${tshort(tid)} ${CROLE[role].l} ${c.name} 영입${T.promo?` (${CROLE[toRole].l} 승격)`:''}`,{tid}); addLog(`${tname(tid)}에서 ${c.name} 코치를 ${CROLE[toRole].l}로 데려왔습니다. 연 ${money(T.sal)}${T.comp?` · 보상금 ${money(T.comp)}`:''}.`);
  return `${c.name} 코치가 ${CROLE[toRole].l}로 합류합니다. 연 ${money(T.sal)} 2년${T.comp?`, ${tshort(tid)}에 보상금 ${money(T.comp)}`:''}. ${tshort(tid)} 단장 친분 -${T.comp?2:4}.`; }

/* ===== FA 등급제 (2021 FA부터): 3년 평균 연봉의 구단 내·리그 순위, 나이, FA 횟수로 정한다 ===== */
function avgSal3(p){ const H=(p.salH||[]).slice(-3); return H.length?avg(H.map(x=>x.s)):p.sal; }
function faGradeOf(p,all){ if(p.age>=35)return 'C'; const n=p.faN||(p.lastFA!=null?1:0); if(n>=2)return 'C'; if(n===1)return p.faPrevGrade==='C'?'C':'B';
  /* 실제 KBO 등급은 계약금을 뺀 연봉으로 매긴다. FA 계약 선수 연봉은 계약금 몫(약 40%)을 빼고 비교한다 */
  const gs=q=>avgSal3(q)*(q.lastFA!=null&&q.faC&&!q.ext?.6:1);
  const D=all.filter(q=>!q.foreign); const v=gs(p); const lg=D.filter(q=>gs(q)>v).length+1; const tm=D.filter(q=>q.team===p.team&&gs(q)>v).length+1; p.faRank={lg,tm};
  if(tm<=3&&lg<=30)return 'A'; if(tm<=10&&lg<=60)return 'B'; return 'C'; }
/* 실제 KBO는 소속선수 65명 중 A 20명·B 25명을 보호한다. 이 게임 등록 상한은 40명이라 같은 비율(약 31%·38%)로 줄인다 */
const COMP={A:{prot:20,kbo:20,withP:2,cash:3},B:{prot:25,kbo:25,withP:1,cash:2},C:{prot:0,kbo:0,withP:0,cash:1.5}};
/* 보호선수에서 저절로 빠지는 선수: 외국인, 올해 신인·입단 예정, 군 복무 중, 이번 겨울 FA로 계약한 선수 */
function autoProt(q){ return !!(q.foreign||q.joinY>G.year||(q.draft&&q.draft.y>=G.year)||isAway(q)||q.lastFA===G.year); }
function compPool(tid){ return domestic(tid).concat(awayOf(tid).filter(q=>!q.foreign)).filter(q=>!autoProt(q)); }
function aiProtect(tid,n){ const t=team(tid); return compPool(tid).sort((a,b)=>aiVal(t,b)-aiVal(t,a)).slice(0,n).map(q=>q.id); }
/* 우리 구단의 일회성 현금 지출·수입은 결산 장부(G.spend)에 올려 예산 여유와 결산에 함께 반영한다 */
function payOut(tid,amt,key){ if(!amt)return; if(tid===G.user){ G.spend[key]=(G.spend[key]||0)+amt; } else team(tid).cash-=amt; }
function payIn(tid,amt){ if(!amt)return; if(tid===G.user){ G.spend.compIn=(G.spend.compIn||0)+amt; } else team(tid).cash+=amt; }
function compStart(p,from,to,rec){ const g=COMP[p.faGrade]; const prev=p.faPrevSal;
  if(p.faGrade==='C'){ const cash=Math.round(prev*1.5); payOut(to,cash,'comp'); payIn(from,cash); rec.compCash=cash; return; }
  const c={id:'cp'+(G.compSeq=(G.compSeq||0)+1),pid:p.id,name:p.name,grade:p.faGrade,from,to,prev,day:G.day,stage:'protect',exp:G.day+3,prot:null,rec:rec.id,_rec:rec};
  (G.comp=G.comp||[]).unshift(c); if(G.comp.length>30)G.comp.length=30;
  if(to!==G.user){ c.prot=aiProtect(to,g.prot); c.stage='pick'; c.exp=G.day+3;
    if(from!==G.user){ compAiPick(c); return; }
    mail('운영팀',`보상선수 지명: ${tname(to)} 보호명단 도착`,`${p.name}(${p.faGrade}등급)을 데려간 ${tname(to)}이(가) 보호선수 ${g.prot}명 명단을 보냈습니다. 명단 밖 선수 1명과 직전 연봉 ${g.withP*100}%(${money(prev*g.withP)})를 받거나, 선수 없이 ${g.cash*100}%(${money(prev*g.cash)})를 받을 수 있습니다. ${dmd(c.exp)}까지 정하세요.`,{imp:true,kind:'FA',acts:[{l:'보상선수 고르기',a:'go',v:'trade:fa'}]}); stop('FA',`${tname(to)}의 보호선수 명단이 왔습니다. 보상선수를 고르세요.`); return; }
  mail('운영팀',`보호선수 명단 제출: ${p.name} 영입 보상`,`${p.name}(${p.faGrade}등급) 영입으로 ${tname(from)}에 보상해야 합니다. 보호선수 ${g.prot}명을 정해 ${dmd(c.exp)}까지 제출하세요. 외국인, 올해 신인, 군 복무 중인 선수, 이번 겨울 FA 계약 선수는 저절로 보호됩니다. ${tname(from)}은(는) 명단 밖에서 1명을 데려가거나 돈으로 받습니다.`,{imp:true,kind:'FA',acts:[{l:'보호명단 정하기',a:'go',v:'trade:fa'}]}); stop('FA',`${p.name} 영입 보상: 보호선수 ${g.prot}명을 정하세요.`); }
function compAiPick(c){ const g=COMP[c.grade]; const ft=team(c.from); const cand=compPool(c.to).filter(q=>!c.prot.includes(q.id)).sort((a,b)=>aiVal(ft,b)-aiVal(ft,a)); const best=cand[0];
  const cashDiff=c.prev*(g.cash-g.withP)/100; return compResolve(c,best&&aiVal(ft,best)>=Math.max(.8,cashDiff*.15)?best.id:null); }
function compResolve(c,pid){ const g=COMP[c.grade]; const mult=pid?g.withP:g.cash; const cash=Math.round(c.prev*mult); payOut(c.to,cash,'comp'); payIn(c.from,cash); c.cash=cash; c.stage='done'; c.done=G.day;
  const R0=c._rec||(G.fa&&G.fa.results||[]).find(r=>r.id===c.pid&&r.to===c.to); delete c._rec; if(R0)R0.compCash=cash;
  if(pid){ const q=G.players[pid]; q.team=c.from; q.faC=false; q.ext=false; q.yrs=0; q.listed=false; for(const k in G.lineup)if(G.lineup[k]===q.id)delete G.lineup[k]; story(q,`FA ${c.name} 보상선수로 ${tname(c.from)} 이적`,'move'); c.player=q.name; c.cpid=q.id; if(R0)R0.compPlayer=q.name;
    wire('FA',`${tname(c.from)}, ${c.name} 보상선수로 ${tname(c.to)} ${q.name}(${posLabel(q)}) 지명`,{tid:c.from,ref:q.id}); }
  else wire('FA',`${tname(c.from)}, ${c.name} 보상으로 선수 대신 현금 ${money(cash)}`,{tid:c.from});
  if(c.from===G.user)note('FA',pid?`보상선수로 ${G.players[pid].name}을(를) 지명했습니다. 보상금 ${money(cash)}.`:`선수 대신 보상금 ${money(cash)}을(를) 받았습니다.`,pid);
  if(c.to===G.user)note('FA',pid?`${tname(c.from)}이(가) 보상선수로 ${G.players[pid].name}을(를) 데려갔습니다. 보상금 ${money(cash)}.`:`${tname(c.from)}이(가) 선수 대신 보상금 ${money(cash)}을(를) 받았습니다.`,pid);
  return c; }
function compSubmit(id,prot){ const c=(G.comp||[]).find(x=>x.id===id); if(!c||c.stage!=='protect'||c.to!==G.user)return '처리할 명단이 없습니다.'; const g=COMP[c.grade]; const pool=compPool(G.user).map(q=>q.id); const P=prot.filter(x=>pool.includes(x)).slice(0,g.prot);
  c.prot=P; c.stage='pick'; compAiPick(c); return c.player?`${tname(c.from)}이(가) ${c.player}을(를) 지명했습니다.`:`${tname(c.from)}이(가) 선수 대신 보상금을 택했습니다.`; }
function compAuto(c){ if(c.stage==='protect'&&c.to===G.user){ compSubmit(c.id,aiProtect(G.user,COMP[c.grade].prot)); note('FA','보호선수 명단을 운영팀이 능력 순으로 제출했습니다.'); }
    else if(c.stage==='pick'&&c.from===G.user){ const ft=team(G.user); const best=compPool(c.to).filter(q=>!c.prot.includes(q.id)).sort((a,b)=>aiVal(ft,b)-aiVal(ft,a))[0]; compResolve(c,best?best.id:null); } }
function compDaily(){ for(const c of (G.comp||[])){ if(c.stage==='done'||G.day<c.exp)continue; compAuto(c); } }
