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
const INET=[{l:'에이전트 자료',c:0,sd:9.5,d:'에이전트가 보낸 영상과 기록만 봅니다. 잠재력과 성향은 알 수 없고 능력치 오차가 큽니다.'},
  {l:'현지 통신원',c:60,sd:6.5,d:'현지 통신원이 경기를 직접 봅니다. 잠재력과 부상 체질을 대략 판단합니다.'},
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

