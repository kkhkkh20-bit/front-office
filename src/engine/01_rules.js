/* ===== 리그 규정 (KBO 실제 규정을 단순화, 2029년 이후 상한액은 가정) ===== */
const REG=['수도권','영남','호남·충청'];
/* 경쟁균형세 상한: 2026~2028년은 KBO 이사회 결정(매년 5%). 2029년부터는 게임 안 이사회가 매년 12월 리그 연봉 상황을 보고 정한다 */
function capOf(y){ if(y<=2026)return 14397; if(y===2027)return 15117; if(y===2028)return 15873; if(typeof G!=='undefined'&&G&&G.capY){ if(G.capY[y])return G.capY[y]; const ks=Object.keys(G.capY).map(Number).filter(k=>k<y).sort((a,b)=>b-a); if(ks.length)return Math.round(G.capY[ks[0]]*Math.pow(1.03,y-ks[0])); } return Math.round(15873*Math.pow(1.03,y-2028)); }
/* 리그 경제 지수: 연봉 상한이 오르는 만큼 수입·운영비·지원 한도·스폰서도 같이 오른다(연봉만 오르고 수입이 고정이면 해마다 모든 구단이 적자로 몰린다) */
function ecoIdx(y){ return Math.max(1,capOf(y??G.year)/14397); }
function floorOf(y){ return Math.round(6065*capOf(y)/14397); }
let MIN_SAL=30;              // 최저 연봉 3,000만원(금액 단위: 백만원). 2027년부터 3,300만원(2026년 1월 KBO 이사회)
function syncMinSal(){ MIN_SAL=(typeof G!=='undefined'&&G&&G.year>=2027)?33:30; }
const ROSTER_MAX=68, ROSTER_MIN=45; // KBO 소속선수 한도: 2025년까지 65명, 2026년 68명으로 확대
/* 1군 엔트리(KBO 2026: 29명, 8월 25일부터 4명 확대, 말소 후 10일 뒤 재등록)와 육성선수 */
const ENTRY_BASE=29, ENTRY_EXP=4, YS_MAX=15;
const rosterN=tid=>playersOf(tid).filter(p=>!p.ys).length;
const ysN=tid=>playersOf(tid).filter(p=>p.ys).length;
const FA_SVC=8; // 고졸 8시즌, 대졸 7시즌 (2022시즌 종료 후 적용)
const faSvc=p=>p&&p.college?7:FA_SVC;
const DRAFT_ROUNDS=11, DRAFT_POOL=140;
/* 신인 계약금(백만원): 실제 2025~2026 신인 계약 기준.
   1라운드는 순번별(1·2순위 5억, 3순위 4억, 4~5순위 3억, 6순위 2.6억, 7~8순위 2.2억, 9~10순위 2억, 최대어 1순위는 6.5억 안팎),
   2라운드 1.5~1.6억, 3라운드 1.2억, 4라운드 9천만, 이후 1천만 원씩 내려가 10라운드 이후 3천만 원. 신인 연봉은 최저 연봉 */
const BONUS1=[500,500,400,300,300,260,220,220,200,200];
const BONUS=[250,155,115,85,75,65,55,50,40,30,30];
function bonusOf(rd,no,p){ if(rd===1){ let b=BONUS1[(no||10)-1]??200; if(no===1&&p&&p.press&&p.press<=2)b*=1.3; return round5(b); } return round5((BONUS[rd-1]??30)*(rd<=3?1+(5-(no||5))*.008:1)); }
const SCOUT_SAL=[0,60,90,130,180,250];
const SCOUT_SD=[13,9.5,7.5,5.5,4.2,3];
const USD=14;                // 1만 달러 = 약 1,400만원 (100만 달러 = 약 14억)
const F_NEW_CAP=100*USD, F_TOTAL_CAP=400*USD, ASIA_CAP=20*USD;
/* 외국인 선수 한 명이 총액 한도에 차지하는 금액: 보장 연봉 + 아직 유효한 인센티브(신규·재계약·화면이 모두 이 계산을 쓴다) */
function fCommit(p){ return (p.sal||0)+(p.opt&&p.ctT===p.team&&p.opt.until>=G.year?(p.opt.a||0):0); }
function fCap(tid){ return F_TOTAL_CAP+10*USD*sum(foreignOf(tid).filter(x=>x.foreign==='용병').map(x=>x.rsy||0)); }
const F_REPL_MAX=2;
const fReplLeft=tid=>period()!=='season'?F_REPL_MAX:Math.max(0,F_REPL_MAX-((G.sea&&G.sea.repl&&G.sea.repl[tid])||0)); /* 시즌 중 남은 외국인 교체 횟수 */          // 시즌 중 외국인 교체 횟수 (게임 설정)

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
const G2='호준우민혁수현진훈석빈원성규찬결율환섭철영욱범완택열균식겸후언'.split(''); /* '기'로 끝나는 이름(지기·경기·성기·종기…)은 낱말처럼 읽혀 뺐다 */
/* 낱말처럼 읽히는 이름(성 뒤 두 글자): 야구·구단 용어와 헷갈리거나 어색한 것 */
const GBAD=new Set(['시민','주민','도민','주식','지식','인식','한식','정식','시식','종식','수식','하수','호수','승수','인수','기준','기수','기원','기성','기우','수준','정수','정원','인원','동원','경영','경호','주석','재석','성원','재원','세수','정석','시원','용수']);
const nameBad=n=>typeof n==='string'&&n.length===3&&(GBAD.has(n.slice(1))||n[2]==='기');
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
const INET=[{l:'에이전트 자료',c:0,sd:9.5,d:'에이전트가 보낸 영상과 기록만 봅니다. 잠재력과 성향은 알 수 없고 능력치 오차가 큽니다.'},
  {l:'현지 통신원',c:60,sd:6.5,d:'현지 통신원이 경기를 직접 봅니다. 잠재력과 부상 체질을 대략 판단합니다.'},
  {l:'전담 스카우트',c:150,sd:4.5,d:'전담 스카우트가 상주합니다. 오차가 작고 한국 적응력(성격·생활)까지 확인합니다. 좋은 후보를 더 많이 찾습니다.'},
  {l:'현지 사무소',c:320,sd:3,d:'현지 사무소와 구단 네트워크로 거의 정확하게 봅니다. 숨은 후보를 가장 먼저, 가장 많이 확보합니다.'}];
const origOf=p=>p.orig||({'미국':'us','도미니카공화국':'la','베네수엘라':'la','일본':'jp','대만':'tw','호주':'au'}[p.nat]||'us');
const intlLv=r=>Math.min(3,((G.intl&&G.intl[r])||0)+(G&&G.scouts&&G.scouts.some(s=>s.role==='intl'&&s.region===r)?1:0));

/* 국내 이름: 현역·은퇴 선수(OB) 이름과 겹치지 않게(하루 단위로 이름 목록을 모아 둔다) */
let _nmSet=null, _nmDay=null;
function nameTaken(n){ if(typeof G==='undefined'||!G||!G.players)return false; if(_nmDay!==G.day||!_nmSet){ _nmSet=new Set(Object.values(G.players).map(p=>p.name)); for(const o of (G.ob||[]))_nmSet.add(o.name); _nmDay=G.day; } return _nmSet.has(n); }
function genName(){ for(let i=0;i<60;i++){ const n=pick(SUR)+pick(G1)+pick(G2); if(!BLOCK.has(n)&&!nameBad(n)&&n[1]!==n[2]&&!nameTaken(n)){ if(_nmSet)_nmSet.add(n); return n; } } return pick(SUR)+'도윤'; }
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
function roleBias(tid,p){ const thr=rpThr(tid); return clamp((p.r.sta-thr)*.9,-14,8)+(p.rAdj||0)+rpBias(tid,p); } /* 체력 기준은 감독 성향(불펜 의존·스몰볼), 보직 계획(신인 계투 시작·단장 요청)은 77_pitch_role.js */
const team=id=>G.teams[id];
const tname=id=>id==null?'무소속':tshort(id);
const tshort=id=>id==null?'-':team(id).city+' '+team(id).nick;
const isRookie=p=>p.draft&&p.draft.y===G.year-1;
const healthy=p=>!(p.injOut>0)&&!(p.susp>G.day);

function genRatings(isP,base,pos){
  const g=()=>clamp(N(base,7),20,80);
  if(isP) return {stf:g(),ctl:g(),sta:clamp(N(base,11),20,80)};
  const r={con:g(),pow:g(),eye:g(),spd:g(),def:g(),vit:clamp(N(52,9),25,80)};
  const bump=(k,d)=>r[k]=clamp(r[k]+d,20,80);
  if(['SS','CF','2B'].includes(pos)){bump('def',6);bump('spd',5);bump('pow',-4)}
  if(['1B','LF','RF'].includes(pos)){bump('pow',5);bump('def',-5)}
  if(pos==='C'){bump('spd',-8);bump('def',9);bump('con',-3);bump('pow',-2)} /* 포수는 수비 부담이 커 같은 종합이라도 방망이가 약하다 */
  return r;
}
function setOvr(p,target){ for(let k=0;k<3;k++){ const d=target-ovr(p); for(const key in p.r){ if(key==='vit')continue; p.r[key]=clamp(p.r[key]+d,20,80);} } roundR(p); }
function roundR(p){ for(const k in p.r)p.r[k]=Math.round(p.r[k]*10)/10; }
/* 자리별 최상위 재능의 드묾: 포수·유격·2루·중견에서 공격과 수비를 다 갖춘 대형 선수는 드물다. 그런 재능은 대개 3루·코너 외야·1루로 옮겨 간다.
   선수 수(공급)는 그대로 두고 위쪽 끝만 줄인다. 자리를 정하지 않고 만든 선수는 옮기고(재능 유지), 자리가 정해진 선수는 위쪽 끝을 눌러 준다.
   TOPK: 문턱(능력 52, 화면 약 64 · 주전급)을 넘는 만큼 남는 비율. 포수가 가장 드물다 */
const TOPK={C:.45,SS:.55,'2B':.7,CF:.75}, TOP_TH=52, TOP_MV={C:['1B','1B','LF'],SS:['3B','3B','RF'],'2B':['3B','LF','RF'],CF:['LF','RF']};
function newPlayer(o){
  const isP=o.isP??(R()<.47);
  let pos=isP?'P':(o.pos||pick(['C','1B','2B','3B','SS','LF','CF','RF','SS','CF','C']));
  if(!isP&&!o.foreign&&TOPK[pos]){ const t=Math.max(o.base||0,o.pot||0), k=TOPK[pos];
    if(t>TOP_TH){ if(!o.pos&&R()<(1-k)*Math.min(1,(t-TOP_TH)/5)){ pos=pick(TOP_MV[pos]); }
      else { const c=v=>v>TOP_TH?TOP_TH+(v-TOP_TH)*k:v; o=Object.assign({},o,{base:c(o.base),pot:o.pot!=null?c(o.pot):o.pot}); } } }
  const th=isP?(R()<.28?'좌':'우'):(['C','2B','3B','SS'].includes(pos)?'우':R()<.24?'좌':'우'); /* 포수·내야(1루 제외)는 우투만 */
  const bt=isP?th:(th==='좌'?'좌':R()<.3?'좌':R()<.06?'양':'우');
  const p={id:G.nextId++,name:o.name||genName(),age:o.age,isP,pos,r:genRatings(isP,o.base,pos),pot:0,
    inj:injRoll(),injOut:0,team:o.team??null,sal:MIN_SAL,yrs:0,faC:false,ext:false,svc:o.svc||0,lastFA:null,
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
/* 트레이드 뒤 상위 40명 연봉 합계(받는 선수는 옛 계약 조건의 상한 반영액이 끝난다) */
function capPayAs(tid,inIds,outIds){ const out=new Set(outIds||[]); const L=domestic(tid).filter(p=>!out.has(p.id)&&!isRookie(p)).map(p=>p.sal+(p.capB&&p.ctT===p.team&&p.capB.until>=G.year?p.capB.a:0));
  for(const id of (inIds||[])){ const p=G.players[id]; if(p&&!p.foreign&&!isRookie(p))L.push(p.sal); } return sum(L.sort((a,b)=>b-a).slice(0,40)); }
/* 다음 시즌 기준 상위 40명 연봉: 재계약 중인 선수는 새 연봉(newSal), 계약금 상한 반영도 다음 시즌까지 남는 것만 */
function capPayNext(tid){ const y=sponSeason(); const s=domestic(tid).filter(p=>!(p.draft&&p.draft.y===y-1)).map(p=>(p.newSal??p.sal)+(p.capB&&p.ctT===p.team&&p.capB.until>=y?p.capB.a:0)).sort((a,b)=>b-a).slice(0,40); return sum(s); }
function capPay(tid){ const s=domestic(tid).filter(p=>!isRookie(p)).map(p=>p.sal+(p.capB&&p.ctT===p.team&&p.capB.until>=G.year?p.capB.a:0)).sort((a,b)=>b-a).slice(0,40); return sum(s); }
const foreignOf=tid=>playersOf(tid).filter(p=>p.foreign);
/* 시장가(연 환산, 백만원): 능력 60까지는 제곱으로 오르고, 그 위는 완만하게(최상위 FA 연평균 20~25억: 2026 강백호 4년 100억, 박찬호 4년 80억) */
function marketSal(o){ const x=Math.max(0,o-37); const v=o<=60?30+x*x*3.0:1617+(o-60)*95; return Math.round(Math.min(3000,v)*capOf(G.year)/15117); }
const round5=v=>Math.max(MIN_SAL,Math.round(v/5)*5);
/* 직구 평균 구속(km): 리그 평균 146 안팎(KBO 2025~26년 146.0·146.3), 구위 90(원래 능력 약 69.5)이면 155 안팎·최고 160 가까이.
   VELO_K: 구위 1당 구속. 경기 계산(직구 구종 점수)은 예전 식(veloSim)을 그대로 써서 표시만 바뀐다 */
const VELO_K=.324;
const veloOf=p=>Math.round(146+(p.r.stf-41.5)*VELO_K+(p.velo||0));
const veloSim=p=>137+(p.r.stf-20)/60*17+(p.velo||0);
const runOf=p=>(4.62-(p.r.spd-20)/60*.6+p.velo*.02).toFixed(2);


/* 부상 체질: 대부분 보통이고, 7%는 해마다 다치는 '부상 병동', 12%는 거의 안 다치는 '강철 체력'이다 */
function injRoll(){ const x=R(); return x<.07?rnd(.28,.42):x<.19?rnd(.03,.07):clamp(N(.14,.055),.05,.28); }
