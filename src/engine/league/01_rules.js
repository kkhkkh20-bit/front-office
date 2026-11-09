/* ===== 리그 규정 (KBO 실제 규정을 단순화, 2029년 이후 상한액은 가정) ===== */
const REG=['수도권','영남','호남·충청'];
/* 경쟁균형세 상한: 2026~2028년은 KBO 이사회 결정(매년 5%). 2029년부터는 게임 안 이사회가 매년 12월 리그 연봉 상황을 보고 정한다 */
function capOf(y){ if(y<=2026)return 14397; if(y===2027)return 15117; if(y===2028)return 15873; if(typeof G!=='undefined'&&G&&G.capY){ if(G.capY[y])return G.capY[y]; const ks=Object.keys(G.capY).map(Number).filter(k=>k<y).sort((a,b)=>b-a); if(ks.length)return Math.round(G.capY[ks[0]]*Math.pow(1.03,y-ks[0])); } return Math.round(15873*Math.pow(1.03,y-2028)); }
/* 리그 경제 지수: 연봉 상한이 오르는 만큼 수입·운영비·지원 한도·스폰서도 같이 오른다(연봉만 오르고 수입이 고정이면 해마다 모든 구단이 적자로 몰린다) */
function ecoIdx(y){ return Math.max(1,capOf(y??G.year)/14397); }
function floorOf(y){ return Math.round(6065*capOf(y)/capOf(2027)); } /* KBO 하한: 2027년 도입 60억6,538만 원, 이후 상한과 같이 매년 상향 */
let MIN_SAL=30;              // 최저 연봉 3,000만원(금액 단위: 백만원). 2027년부터 3,300만원(2026년 1월 KBO 이사회)
function syncMinSal(){ MIN_SAL=(typeof G!=='undefined'&&G&&G.year>=2027)?33:30; }
const ROSTER_MAX=68, ROSTER_MIN=45; // KBO 소속선수 한도: 2025년까지 65명, 2026년 68명으로 확대
/* 1군 엔트리(KBO 2026: 29명, 9월 1일부터 5명 확대(아시안게임 해는 후반기 30명 + 8월 25일부터 4명), 말소 후 10일 뒤 재등록)와 육성선수 */
const ENTRY_BASE=29, ENTRY_EXP=5, YS_MAX=15;
const rosterN=(tid,d)=>ownedOf(tid,d).filter(p=>!p.ys&&!(p.frehab&&p.frehab!=='hold')).length; /* 부상 대체 외국인을 둔 재활 선수 명단 원선수는 빼고 센다(대체 선수가 자리를 쓴다, 검수 11-09t) */ /* 국가대표 차출 선수도 구단 선수 수에 들어간다(군 복무는 빠짐) */
const ysN=tid=>Object.values(G.players).filter(p=>p.team===tid&&p.ys&&!(p.joinY>G.year)&&!milServing(p)).length; /* KBO처럼 군 복무 중(군보류)은 빼고, 대표팀 차출 중은 센다(사용자 11-09) */
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
/* 아시아쿼터 재계약 상한: 신규는 20만 달러, 재계약은 직전 연봉에서 해마다 10만 달러까지 올릴 수 있다(KBO 2026 아시아쿼터 규정, 유저 제보 11-07) */
function asiaReCap(p){ if(!(p&&p.foreign==='아시아'&&p.team!=null))return ASIA_CAP; const k=p.kept, b=k&&k.base!=null&&k.y===(G.contract&&!G.contract.done?G.contract.y:G.year)?k.base:(p.sal||0); return Math.max(ASIA_CAP,b+10*USD); } /* 같은 겨울 해외 제안 잔류로 이미 올린 연봉을 다시 기준으로 쓰지 않는다(검수 11-09a: 한 겨울 두 번 인상) */
/* 외국인 선수 한 명이 총액 한도에 차지하는 금액: 보장 연봉 + 아직 유효한 인센티브(신규·재계약·화면이 모두 이 계산을 쓴다) */
function fCommit(p,sy){ sy=sy>999?sy:ctSeason(); /* map(fCommit)이 넘기는 순번을 시즌으로 보지 않게(검수 11-09a: 끝난 인센티브가 한도에 남음) */ return (p.sal||0)+(p.opt&&p.ctT===p.team&&p.opt.until>=sy?(p.opt.a||0):0); } /* sy: 계약 대상 시즌(기본: 지금 계약이 잡히는 시즌 — 겨울이면 다음 시즌). 그 시즌에 유효한 인센티브만 더한다(달력 연도로 보지 않음) */
function fCap(tid,ex){ return F_TOTAL_CAP+10*USD*sum(playersOf(tid).filter(x=>x.foreign==='용병'&&x.id!==ex).map(x=>x.rsy||0)); } /* ex: 내보낼 선수(그 선수의 재계약 가산도 빠진 한도, 검수 11-09a) */ /* 재활 명단 선수의 재계약 가산도 유지(대체 등록 직후 한도가 줄어 초과되지 않게) */
const F_REPL_MAX=2, ASIA_REPL_MAX=1;
const fReplMax=kind=>kind==='아시아'?ASIA_REPL_MAX:F_REPL_MAX;
function fReplUsed(tid,kind){ const S=G.sea; if(!S||S.y!==G.year)return 0; const by=kind==='아시아'?S.asiaRepl:S.repl; return (by&&by[tid])||0; }
const fReplLeft=(tid,kind)=>period()!=='season'?fReplMax(kind):Math.max(0,fReplMax(kind)-fReplUsed(tid,kind)); /* 일반 외국인과 아시아쿼터는 별도 교체 횟수 */

const TEAM_DEF=[
  {city:'서울',nick:'코메츠',code:'SC',hue:340,market:1.25,region:'수도권'},
  {city:'서울',nick:'하운즈',code:'SH',hue:241,market:1.2,region:'수도권'},
  {city:'인천',nick:'시걸스',code:'IS',hue:350,market:1.0,region:'수도권'},
  {city:'수원',nick:'스파크스',code:'SS',hue:0,market:.95,region:'수도권'},
  {city:'고양',nick:'스톰',code:'GS',hue:345,market:.85,region:'수도권',indie:true},
  {city:'대전',nick:'레드폭스',code:'DR',hue:22,market:.9,region:'호남·충청'},
  {city:'광주',nick:'블레이즈',code:'GB',hue:357,market:1.0,region:'호남·충청'},
  {city:'대구',nick:'썬더스',code:'DT',hue:206,market:1.05,region:'영남'},
  {city:'부산',nick:'웨이브스',code:'BW',hue:215,market:1.15,region:'영남'},
  {city:'창원',nick:'앵커스',code:'CA',hue:217,market:.8,region:'영남'},
];
/* 구단 색: 구단 배지(assets/badges/v1/teams.json)와 같은 지역 실제 프로야구단의 상징색 (주색·보조색·어두운 바탕·밝은 강조)
   서울 코메츠=LG(빨강·검정), 서울 하운즈=두산(네이비·빨강), 인천=SSG(카디널 레드), 수원=kt(검정·빨강), 고양=키움(버건디),
   대전=한화(오렌지), 광주=KIA(빨강·남색·금색), 대구=삼성(파랑), 부산=롯데(네이비), 창원=NC(마린 블루·금색). 배지 바탕색을 주색으로 맞춘다(사용자 2026-11-02) */
const TPAL={SC:['#A50034','#111111','#2b000e','#ff3f78'],SH:['#131230','#ED1C24','#09091a','#4b5fd6'],IS:['#CE0E2D','#ffffff','#34040c','#ff4a5c'],SS:['#141414','#ED1C24','#000000','#ff3c3c'],GS:['#570514','#ffffff','#1f0207','#c23a52'],
  DR:['#F37321','#282828','#3f1606','#ff8a45'],GB:['#EA0029','#091330','#3b0507','#ff4048'],DT:['#074CA1','#A1A0A4','#002340','#2e92ec'],BW:['#041E42','#ffffff','#020c1a','#3d72d9'],CA:['#1D467B','#C6A269','#0f1b2f','#5d8ad6']};
function tpal(t){ if(t==null)return ['#4b5b6c','#e3e9ee','#26313c','#8a99aa']; if(typeof t==='number')t=(typeof G!=='undefined'&&G&&G.teams&&G.teams[t])||TEAM_DEF[t]; if(t&&t.logo&&t.logo.c1){ const b=(t&&TPAL[t.code])||[hslHex(t.hue,58,40),hslHex(t.hue,62,62),hslHex(t.hue,45,18),hslHex(t.hue,62,55)]; const L=t.logo; return [L.c1||b[0],L.c2||b[1],L.c3||b[2],L.c4||L.c1||b[3]]; } return (t&&TPAL[t.code])||[hslHex(t.hue,58,40),hslHex(t.hue,62,62),hslHex(t.hue,45,18),hslHex(t.hue,62,55)]; }
const OWNVOICE={win:'저는 가을야구를 기본으로 봅니다. 성적이 나면 지원은 아끼지 않겠습니다.',profit:'저는 적자를 가장 싫어합니다. 숫자로 보여 주세요.',pr:'관중이 꽉 찬 야구장을 보고 싶습니다. 화제가 되는 구단을 만들어 주세요.'};
const OWNER={
  win:{label:'성적 우선',msg:'구단주는 가을야구를 기본으로 봅니다.',w:[1.4,1.3,.5,.5]},
  profit:{label:'수익 우선',msg:'구단주는 적자를 가장 싫어합니다.',w:[.8,.7,1.8,.5]},
  pr:{label:'그룹 홍보 우선',msg:'구단주는 관중과 인기를 중요하게 봅니다.',w:[.9,.9,.6,1.6]},
};
const SUR='김이박최정강조윤장임한오서신권황안송류홍전고문손양배백허남심노하곽성차주우구민유나진지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국'.split('');
/* 성씨 비중(%): 통계청 2015 인구주택총조사 근사. 고르게 뽑으면 희성이 너무 많이 나온다(사용자 피드백 11-06) */
const SUR_W=[21.6,14.8,8.5,4.7,4.4,2.4,2.1,2.1,2.0,1.7,1.5,1.5,1.5,1.5,1.4,1.4,1.4,1.3,0.3,1.1,1.1,0.9,0.9,0.9,0.9,0.8,0.8,0.6,0.5,0.5,0.5,0.5,0.4,0.4,0.4,0.4,0.4,0.4,0.3,1.4,0.3,0.3,0.3,0.3,0.3,0.3,0.2,0.2,0.2,0.2,0.2,0.2,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.06,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.03,0.03,0.03,0.03,0.03]; const SUR_C=(()=>{ let a=0; const t=SUR_W.reduce((x,y)=>x+y,0); return SUR_W.map(v=>(a+=v)/t); })();
function surAt(u){ const i=SUR_C.findIndex(c=>u<c); return SUR[i<0?SUR.length-1:i]; }
/* 이름(성 뒤 두 글자): 1990~2000년대생 남자 선수에게 흔한 실제 이름. 음절을 따로 붙이면 어색하고 비슷한 이름이 몰려 목록으로 바꿨다(사용자 11-09) */
const GN='민준 서준 도윤 예준 시우 하준 주원 지호 지후 준우 준서 건우 현우 도현 지훈 우진 선우 서진 민재 현준 연우 유준 정우 승우 승현 시윤 준혁 은우 지환 승민 유찬 윤우 민성 준영 시후 진우 지원 수호 재윤 동현 수현 태윤 민규 민우 재민 은찬 윤호 이준 민찬 시온 성민 준호 승준 성현 재현 하율 지한 우현 태민 은호 태현 민호 성준 지성 동하 준수 정민 상민 태호 준희 동욱 상현 재훈 성훈 진호 영민 현석 상훈 종현 동훈 진혁 민석 재혁 현호 성우 태훈 승훈 영훈 경민 대현 용준 정훈 형준 재성 현진 동민 우석 상우 종민 진영 태영 성진 민수 현수 재영 준형 영준 대호 성호 영호 승호 재호 원준 세진 세훈 세준 건희 동건 인호 재웅 태웅 경훈 광민 범준 병준 창민 철민 한솔 형민 주환 주형 주현 진수 진성 찬호 찬우 찬영 태준 태경 태양 해성 현성 현규 효준 희준 규민 규현 근우 다훈 도경 도훈 동규 동빈 명준 무진 민혁 병훈 상진 상혁 석진 석현 선호 성빈 성재 성환 세윤 수빈 수혁 승윤 승재 승환 시훈 영재 영빈 용현 우성 원석 원희 유성 윤성 윤재 은성 인성 인혁 재경 재우 재준 재희 정현 정환 종훈 주성 주호 준성 지웅 지혁 진욱 진환 찬희 창훈 태성 태환 한빈 현빈 현욱 형석 형우 호준 효민 경수 강민 강현 건호 광현 규호 대희 동주 동혁 두현 명수 문성 상욱 상빈 선재 성욱 승빈 시헌 영우 우빈 원빈 윤석 은혁 의진 재범 정빈 정혁 종우 준표 지석 진석 창현 태율 한결 현태 형진 혜성 희성 건영 건욱 경태 관우 광수 광훈 교현 규성 규태 기훈 기연 기웅 남훈 대성 대영 대훈 대한 덕현 도건 도성 도영 도형 동석 동수 동연 동윤 동준 동철 동환 두호 명진 명훈 무성 문수 문혁 민관 민국 민형 민환 범석 범진 병민 병우 병현 보현 봉준 상규 상수 상윤 상철 상호 서원 석민 석훈 선빈 선웅 성규 성수 성연 성용 성일 성주 성철 성태 성필 세현 세형 수민 수용 수철 승규 승원 승주 승철 승태 시혁 신우 영광 영규 영석 영수 영웅 영진 영찬 영태 영환 예찬 완수 용민 용석 용우 용재 용진 용훈 우람 우영 우준 우혁 원재 원태 유빈 유석 유진 윤수 윤찬 은석 은재 은표 의현 이현 인규 인석 인우 일권 장현 재광 재근 재덕 재학 재홍 재환 정근 정연 정욱 정웅 정태 정한 종건 종석 종수 종진 종혁 종호 주영 주완 주찬 주한 준엽 준용 준철 준태 준하 중현 지민 지범 지상 지수 지완 지용 지운 지찬 지형 진만 진형 찬규 찬민 찬성 찬수 찬혁 창용 창진 창호 철우 철호 충현 태건 태규 태빈 태섭 태수 태우 태원 태일 태하 태한 태형 택근 택현 하성 하진 한수 한울 해민 해준 현도 현민 현섭 현승 현식 현오 현웅 현일 현종 현찬 현철 형규 형근 형래 형철 형태 호석 호연 호영 홍근 홍민 홍준 효상 효섭 효원 효종 효진 희동 희수 희재 희찬'.split(' ');
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
const intlLv=r=>Math.min(3,((G.intl&&G.intl[r])||0)+(G&&G.scouts&&G.scouts.some(s=>s.role==='intl'&&s.region===r&&G.day-(s.since??-999)>=30)?1:0)); /* 파견 스카우트는 30일 적응 뒤부터 해외망 단계에 더한다(검수 11-07) */

/* 국내 이름: 현역·은퇴 선수(OB) 이름과 겹치지 않게(하루 단위로 이름 목록을 모아 둔다) */
let _nmSet=null, _nmDay=null;
function nameTaken(n){ if(typeof G==='undefined'||!G||!G.players)return false; if(_nmDay!==G.day||!_nmSet){ _nmSet=new Set(Object.values(G.players).map(p=>p.name)); for(const o of (G.ob||[]))_nmSet.add(o.name); _nmDay=G.day; } return _nmSet.has(n); }
/* 성은 한 번만 뽑고 이름만 다시 뽑는다: 겹칠 때 성까지 다시 뽑으면 흔한 성이 차면서 희성이 점점 늘었다(사용자 11-09) */
function genName(){ const s=surAt(R()); let n=s+'도윤'; for(let i=0;i<60;i++){ const m=s+pick(GN); if(BLOCK.has(m)||nameBad(m))continue; n=m; if(!nameTaken(m))break; } if(_nmSet)_nmSet.add(n); return n; }
function genFName(k){ const d=FN[k]; for(let i=0;i<30;i++){ const n=d.rev?pick(d.l)+' '+pick(d.f):pick(d.f)+' '+pick(d.l); if(!BLOCK.has(n)&&!Object.values(G.players).some(p=>p.name===n))return n; } return pick(d.f)+' '+pick(d.l); }
/* 종합 능력: 타자는 컨택·파워·선구·주력·수비가 득점에 기여하는 비중(+10 실험과 일치).
   투수는 선발 275명(8개 세계) WAR 회귀 비중 구위 .47·제구 .46·체력 .07에 맞춰 구위 .44·제구 .44·체력 .12(체력은 선발을 맡을 수 있는지가 더 크다). 리그 평균 종합 능력은 그대로 */
function ovr(p){const r=p.r;return p.isP? r.stf*.44+r.ctl*.44+r.sta*.12 : r.con*.3+r.pow*.25+r.eye*.15+r.spd*.1+r.def*.2;}
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
const healthy=p=>!(p.injOut>0)&&!(p.susp>G.day)&&!p.frehab&&!p.hold; /* hold: 연봉 미계약(41_salary_talks), 참가활동 불가 */ /* frehab: 부상 대체 외국인을 둔 재활 선수 명단(72_foreign_temp) */

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
  if(p.isP)p.delivery=o.delivery||pitchDelivery(p);
  G.players[p.id]=p; return p;
}
const playersOf=tid=>Object.values(G.players).filter(p=>p.team===tid&&!(p.joinY>G.year)&&!isAway(p));
const awayOf=tid=>Object.values(G.players).filter(p=>p.team===tid&&!(p.joinY>G.year)&&isAway(p));
const domestic=tid=>playersOf(tid).filter(p=>!p.foreign);
/* 구단이 돈을 주는 선수(계약 기준): 국가대표 차출로 잠시 빠진 선수도 소속 선수로 연봉·샐러리캡·선수 수에 넣는다. 군 복무 중인 선수만 지급에서 뺀다.
   playersOf·domestic은 '지금 경기에 뛸 수 있는 선수'라 계약·돈 계산에는 쓰지 않는다 */
const ownedOf=(tid,d=G.day)=>Object.values(G.players).filter(p=>p.team===tid&&!(p.joinY>G.year)&&!milOn(p,d)); /* d: 그날 병역 처리(입대·전역)를 마친 뒤 기준 */
const domPayOf=tid=>ownedOf(tid).filter(p=>!p.foreign);
/* 다음 시즌(s) 상한 전망: 그 시즌 정규시즌에 연봉을 받는 선수만(시즌 전체 복무·시즌 뒤 전역은 빼고, 개막 전 전역은 넣는다, 검수 11-09zk) */
const milCapOut=(p,s)=>payFrac(p,s)<=0;
const domPayNext=(tid,s)=>Object.values(G.players).filter(p=>p.team===tid&&!p.foreign&&!(p.joinY>G.year)&&!milCapOut(p,s));
const forPayOf=tid=>ownedOf(tid).filter(p=>p.foreign);
const payroll=tid=>sum(domPayOf(tid).map(p=>p.sal));
/* 그해 지급 비율: 군 복무 기간은 연봉을 주지 않는다. 입대·전역 날짜를 알면 그 해 복무하지 않는 기간 몫만(전역 예정일 기준으로 미리) */
/* 연봉을 나눠 받는 기간(정규시즌): 복무 비율과 이적 비율이 같은 기준을 써야 한다(검수 11-07: 개막 전 전역 선수가 이적 여부에 따라 83.8%/100%) */
function payWin(y){ const C=G.cal&&dobj(G.cal.open).y===y?G.cal:null; return C?[C.open,C.end+1]:[dnum(y,3,22),dnum(y,10,1)]; }
function payFrac(p,y){ const m=p&&p.mil; const f=m&&(m.from??m.pf), u=m&&(m.until||m.pu); if(!m||f==null||!u)return 1; const [a,b]=payWin(y); const s=Math.max(a,f), e=Math.min(b,u); return 1-Math.max(0,e-s)/(b-a); }
/* 한 해 국내 선수 연봉 지급액(결산·예산 전망): 복무 중인 선수도 그해 복무하지 않는 기간 몫은 넣는다 */
/* y시즌이 아직 개막 전인가(겨울): 그 시즌 연봉은 합의한 다음 시즌 기준(salNext)으로 본다. 결산 뒤 12월과 해가 바뀐 1월이 같은 값 */
function preSeason(y){ return y>G.year||(y===G.year&&dobj(G.day).m<=3&&!(G.cal&&G.cal.open>=dnum(G.year,1,1)&&G.day>=G.cal.open)); }
/* 그해 그 구단 소속 비율: 구단 사이 이동 기록(tLog)이 있으면 날짜로 나눈다 */
/* s를 주면 비율 대신 금액: 구단을 떠난 구간은 떠날 때 연봉(tLog s), 지금 소속 구간은 s(검수 11-09g: 원구단 복귀 때 첫 재임 기간까지 새 연봉) */
function payTeamFrac(p,tid,y,s){ const L=(p.tLog||[]).filter(x=>x.y===y); if(!L.length)return p.team===tid?1:0; const [a,b]=payWin(y); /* 연봉은 정규시즌 기간에 나눠 받는다 */ const m=p.mil, mf=m&&(m.from??m.pf), mu=m&&(m.until||m.pu), sv=(s,e)=>mf==null||!mu?0:Math.max(0,Math.min(e,mu)-Math.max(s,mf)); /* 그 구단 소속일 때 복무한 날은 뺀다 */ let cur=L[0].f, d0=a, n=0; for(const x of L){ const d=clamp(x.d,a,b); if((cur??x.f)===tid)n+= /* 웨이버 공시 뒤 양수되면 공시 기간은 계약을 가진 공시 구단이 낸다(검수 11-09zzb) */(d-d0-sv(d0,d))*(s==null?1:(x.s??s)/(s||1)); cur=x.t; d0=d; } if(cur===tid)n+=b-d0-sv(d0,b); return n/(b-a); }
function payYear(tid,y){ return Math.round(((G.payGone&&G.payGone[y]&&G.payGone[y][tid])||0)+sum(Object.values(G.players).filter(p=>!p.foreign&&!(p.joinY>y)&&(p.team===tid||(p.tLog||[]).some(x=>x.y===y&&(x.f===tid||x.t===tid)))).map(p=>{ const S=(p.team!==tid&&(()=>{ const x=[...(p.tLog||[])].reverse().find(x=>x.y===y&&x.f===tid&&x.s!=null); return x?x.s:null; })()||(preSeason(y)?salNext(p):p.sal)); return S /* 개막 전 겨울은 합의한 다음 시즌 연봉. 떠난 구단 몫은 떠날 때 연봉으로(새 구단 연봉이 지난 기간에 쓰이지 않게, 검수 11-08) */*(y>G.year||!(p.tLog||[]).some(x=>x.y===y)?payFrac(p,y)*(p.team===tid?1:0):payTeamFrac(p,tid,y,S))+ysAdj(p,y,tid) /* 시즌 중 육성 전환: 전환 전 기간은 원래 연봉 */ /* 이적한 해는 구단별 소속 기간에서 그 구단 소속 중 복무한 날을 빼서 나눈다(복무 비율을 따로 곱하면 어느 구단에서 복무했는지가 사라졌다, 검수 11-06) */; }))); }
/* 다음 시즌 연봉 한 가지 기준: 이미 합의한 다음 시즌 시작 다년계약(extNext) > 재계약 중 합의 연봉(newSal) > 지금 연봉 */
/* s시즌 상한에 들어갈 계약금 연 반영액: 이미 맺은 다음 시즌 시작 다년계약은 계약금을 먼저 줬으므로 그 계약의 반영액(검수 11-08: 후속 협상 예상에서 빠짐) */
function capBAt(p,s){ const x=p.extNext, b=x&&x.terms&&x.terms.bonus; if(b>0&&s>G.year)return Math.round(b/Math.max(1,x.years)); return p.capB&&p.ctT===p.team&&p.capB.until>=s?p.capB.a:0; }
function salNext(p){ if(!p)return 0; if(p.extNext)return p.extNext.annual; { const C=G.contract, n=C&&!C.done&&C.neg&&C.neg[p.id]; if(n&&n.st==='open'&&n.cur!=null)return n.cur; if(n&&n.st==='arb'&&n.arb)return n.arb.club; } /* 조정 중: 판정 전까지 구단안(양측 제시액 중 하나, 검수 11-06) */ /* 협상 중이면 마지막 제시액(확정 미리보기와 같게) */ return p.newSal??p.sal; }
/* 트레이드 뒤 상위 40명 연봉 합계(받는 선수는 옛 계약 조건의 상한 반영액이 끝난다) */
function capPayAs(tid,inIds,outIds){ const y=sponSeason(), nx=y>G.year||preSeason(y), inS=new Set(inIds||[]), out=new Set(outIds||[]); /* 겨울(개막 전 1월 포함)은 다음 시즌 기준(확정한 다음 시즌 연봉 포함, 검수 11-06·11-08) */
  const amt=(p,inn=inS.has(p.id))=>{ const wc=inn&&p.wv&&p.team==null?p.wv.c:null; /* 웨이버 양수: 승계하는 계약과 계약금 반영액(검수 11-06·11-07·11-08) */ if(nx)return wc?(wc.extNext?wc.extNext.annual:wc.sal)+(wc.capB&&wc.capB.until>=y?wc.capB.a:0):inn?salNext(p):salNext(p)+capBAt(p,y); return wc?wc.sal+(wc.capB&&wc.capB.until>=G.year?wc.capB.a:0):inn?p.newSal??p.sal:p.sal+(p.capB&&p.ctT===p.team&&p.capB.until>=G.year?p.capB.a:0); }; /* 받는 선수는 옛 계약 조건의 상한 반영액이 끝난다. 재계약 합의 연봉은 이적 때 확정(mvLog) */
  const fid=franId(tid,outIds,inIds,amt,nx?y:null); /* 예외 대상도 합계와 같은 금액으로 고른다(웨이버 양수 선수가 방출 뒤 연봉으로 뽑혔다, 검수 11-09zzb) */
  const L=(nx?domPayNext(tid,y).filter(p=>!(p.draft&&p.draft.y===y-1)):domPayOf(tid).filter(p=>!isRookie(p))).filter(p=>!out.has(p.id)).map(p=>capAmt(p,tid,amt(p,false),fid));
  for(const id of (inIds||[])){ const p=G.players[id]; if(!p||p.foreign||(nx?(p.draft&&p.draft.y===y-1)||milCapOut(p,y):isRookie(p)||milServing(p)))continue; /* 복무 선수는 실제 합계와 같게(검수 11-09g) */ L.push(capAmt(p,tid,amt(p,true),fid)); }
  return sum(L.sort((a,b)=>b-a).slice(0,40)); }
/* 다음 시즌 기준 상위 40명 연봉: 재계약 중인 선수는 새 연봉(newSal), 계약금 상한 반영도 다음 시즌까지 남는 것만 */
function capPayNext(tid){ const y=sponSeason(), fid=franId(tid,null,null,p=>salNext(p)+capBAt(p,y),y); const s=domPayNext(tid,y).filter(p=>!(p.draft&&p.draft.y===y-1)).map(p=>capAmt(p,tid,salNext(p)+capBAt(p,y),fid)).sort((a,b)=>b-a).slice(0,40); return sum(s); }
/* 계약 하나를 바꿨을 때의 상한 합계: 실제 샐러리캡과 같은 방식(선수별 금액 정렬 → 상위 40명). s는 계약이 적용되는 시즌.
   지금 시즌(sponSeason)이면 지금 연봉 기준, 그 뒤 시즌이면 다음 시즌 기준(합의한 다음 시즌 계약·재계약 중 금액, 그 시즌까지 남는 계약금 상한 반영) */
function capPayWith(tid,pid,amt,s){ const y0=sponSeason(); s=s??y0; const nxt=s>y0||preSeason(s); const cb=q=>q.capB&&q.ctT===q.team&&q.capB.until>=G.year?q.capB.a:0; const fid=franId(tid,null,pid!=null?[pid]:null,q=>q.id===pid&&amt!=null?amt /* 새 계약 금액에 이미 새 계약금 반영액이 들어 있다: 옛 계약금은 새 계약이 대신한다(검수 11-09zzb) */:nxt?salNext(q)+capBAt(q,s):q.sal+cb(q),nxt?s:null); /* 예외 선수는 바뀐 금액(계약금 연 반영액 포함)으로 다시 고른다(검수 11-09s·11-09y) */ /* 개막 전이면 합의한 인상분까지 */ const L=[];
  for(const p of (nxt?domPayNext(tid,s):domPayOf(tid))){ if(p.id===pid)continue; if(nxt){ if(p.draft&&p.draft.y===s-1)continue; L.push(capAmt(p,tid,salNext(p)+capBAt(p,s),fid)); } else { if(isRookie(p))continue; L.push(capAmt(p,tid,p.sal+(p.capB&&p.ctT===p.team&&p.capB.until>=G.year?p.capB.a:0),fid)); } }
  const so=[...L].sort((a,b)=>b-a); const base=sum(so.slice(0,40)), k40=so.length>=40?so[39]:0; const pp=pid!=null?G.players[pid]:null; if(amt!=null&&!(pp&&!nxt&&isRookie(pp))&&!(pp&&nxt&&pp.draft&&pp.draft.y===s-1)&&!(pp&&(nxt?milCapOut(pp,s):milServing(pp)))) /* 복무 선수는 기존 합계와 같은 기준으로(검수 11-09zk) */L.push(pid!=null&&pid===fid?amt*.5:amt); /* 예외 선수가 없을 때(null===null) 외부 선수가 반값으로 잡혔다(검수 11-09zzb) */ /* 신인 제외 조건은 바꾸려는 선수에게도 똑같이(검수 11-06) */ const tot=sum(L.sort((a,b)=>b-a).slice(0,40)); const room0=capOf(s)-base+k40; return {tot,base,cap:capOf(s),s,room:pid!=null&&pid===fid?room0*2:room0}; } /* 프랜차이즈 예외 선수는 보수의 절반만 들어가니 쓸 수 있는 연봉은 두 배(검수 11-06) */ /* room: 이 선수 금액으로 쓸 수 있는 최대(40번째 선수를 밀어내는 몫 포함) */
/* 프랜차이즈 예외(KBO 2025-09 의결, 2026~): 구단마다 한 해 1명, 그 구단 소속 7시즌 이상인 국내 선수 보수의 50%를 상한 산정에서 뺀다. 가장 많이 받는 대상자를 자동으로 지정한다 */
let _franC={k:null}; function franId(tid,outIds,inIds,sf,s){ const sv=p=>sf?sf(p):p.sal+(p.capB&&p.ctT===p.team&&p.capB.until>=G.year?p.capB.a:0); /* 상한 반영액(연봉+계약금 연 반영액)이 가장 큰 선수(검수 11-09y). sf: 다음 시즌 합계는 다음 시즌 금액으로(검수 11-07) */ if(G.year<2026)return null; const out=new Set(outIds||[]); const pool=(sf&&s!=null?domPayNext(tid,s):domPayOf(tid)).filter(p=>!out.has(p.id)); /* 다음 시즌 전망은 그 시즌 연봉을 받는 선수 중에서(개막 전 전역 포함, 검수 11-09zk) */ for(const id of inIds||[]){ const p=G.players[id]; if(p&&!p.foreign&&!pool.includes(p)&&!(sf&&s!=null?milCapOut(p,s):milServing(p)))pool.push(p); } /* 데려올 선수도 예외 대상 후보(예상 계산이 실제 소속 뒤 계산과 같게) */ const k=(sf?'n'+s:'c')+G.year+':'+G.day+':'+tid+':'+pool.map(p=>p.id+':'+sv(p)+':'+(p.hist||[]).filter(h=>h.t===tid).map(h=>h.y).join(',')).join(';'); if(_franC.k===k)return _franC.v; let b=null; for(const p of pool){ const ys=new Set((p.hist||[]).filter(h=>h.t===tid).map(h=>h.y)); if(ys.size<7)continue; if(!b||sv(p)>sv(b))b=p; } _franC={k,v:b?b.id:null}; return _franC.v; }
const capAmt=(p,tid,a,fid=franId(tid))=>p.id===fid?a*.5:a; /* 합계 한 번당 예외 대상도 한 번만 조회 */
function capPay(tid){ const fid=franId(tid); const s=domPayOf(tid).filter(p=>!isRookie(p)).map(p=>capAmt(p,tid,p.sal+(p.capB&&p.ctT===p.team&&p.capB.until>=G.year?p.capB.a:0),fid)).sort((a,b)=>b-a).slice(0,40); return sum(s); }
const foreignOf=tid=>playersOf(tid).filter(p=>p.foreign&&!p.frehab); /* 재활 선수 명단에 오른 외국인은 등록 인원·총액에서 빠진다(대체 선수가 그 자리) */
/* 시장가(연 환산, 백만원): 능력 60까지는 제곱으로 오르고, 그 위는 완만하게(최상위 FA 연평균 20~25억: 2026 강백호 4년 100억, 박찬호 4년 80억) */
function marketSal(o){ const x=Math.max(0,o-37); const v=o<=60?30+x*x*3.0:1617+(o-60)*95; return Math.round(Math.min(3000,v)*capOf(G.year)/15117); }
const round5=v=>Math.max(MIN_SAL,Math.round(v/5)*5);
/* 직구 평균 구속(km): 리그 평균 146 안팎(KBO 2025~26년 146.0·146.3), 구위 90(원래 능력 약 69.5)이면 155 안팎·최고 160 가까이.
   VELO_K: 구위 1당 구속. 화면과 경기 계산(직구 구종 점수)이 같은 구속을 사용한다 */
const VELO_K=.324;
const veloOf=p=>Math.min(161,Math.round(146+(p.r.stf-41.5)*VELO_K+(p.velo||0)));
const veloSim=veloOf;
const runOf=p=>(4.62-(p.r.spd-20)/60*.6+p.velo*.02).toFixed(2);


/* 부상 체질: 대부분 보통이고, 7%는 해마다 다치는 '부상 병동', 12%는 거의 안 다치는 '강철 체력'이다 */
function injRoll(){ const x=R(); return x<.07?rnd(.28,.42):x<.19?rnd(.03,.07):clamp(N(.14,.055),.05,.28); }
