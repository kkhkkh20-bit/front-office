/* ---------- 팬 게시판: 야구 커뮤니티식 글과 댓글 ----------
   글과 댓글은 저장하지 않는다. 사건(기사·트레이드·감독·경기·순위)과 고정 시드로 매번 같은 내용을 만든다. */
function fRng(key){ let h=1779033703^key.length; for(let i=0;i<key.length;i++){ h=Math.imul(h^key.charCodeAt(i),3432918353); h=h<<13|h>>>19; }
  return ()=>{ h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); h^=h>>>16; return (h>>>0)/4294967296; }; }
const fPick=(r,a)=>a[Math.floor(r()*a.length)];
const FNICK_A=['직관','외야석','치맥','퇴근길','주말','9회말','불펜','2군','만루','삼진','도루','번트','홈런','개막전','올드','야알못','통계','유니폼','응원가','우천취소','더블헤더','끝내기','대타','마무리','에이스','포수','외국인','신인','FA','엔트리'];
const FNICK_B=['러','요정','장인','지킴이','전문가','소식통','단골','덕후','매니아','개근','수집가','관찰자','중독','사랑','고인물','뉴비','팬','아재','청년'];
function fNick(r,tid){ const t=tid!=null?team(tid):null; const x=r();
  if(t&&x<.32)return t.city+fPick(r,['토박이','사람','직관러','올드팬','지킴이','청년','아재','댁'])+(r()<.4?Math.floor(r()*99):'');
  if(t&&x<.5)return t.nick+fPick(r,['빠','사랑','만세','덕후','외길','평생팬','지킴이'])+(r()<.5?Math.floor(r()*999):'');
  return fPick(r,FNICK_A)+fPick(r,FNICK_B)+(r()<.35?Math.floor(r()*99):''); }
/* 반응 문구: pos 좋음 · neg 나쁨 · mix 반반 · fun 잡담. {p}선수 {q}다른 선수 {T}우리 별칭 {O}상대 별칭 {m}감독 {n}숫자 {pos}포지션 */
const FB={
  win:{pos:['오늘 {p} 미쳤다 진짜','{p} 연봉 올려줘라 제발','이 맛에 야구 본다','직관 갔는데 이겼다 ㅋㅋ 집 가는 길 행복','{q} 오늘 공 좋더라','{p} 타석 들어올 때마다 뭔가 해줄 것 같음','오늘 같은 경기만 해라','{O} 상대로 이기니까 더 좋네','수훈선수 {p} 인정합니다','중계 보다가 소리 질렀다 ㅋㅋㅋ'],
       mix:['이겼으니 됐다 근데 불펜은 좀...','이긴 건 좋은데 {r} 오늘 왜 저럼','점수 차 벌릴 때 못 벌린 건 아쉽다','이겨도 불안한 이 느낌 뭐냐'],
       fun:['오늘 치킨 맛있게 먹었다','내일도 이 기세로 가자','다음 주 직관 예매 완료','응원가 아직도 귀에서 맴돈다']},
  loss:{neg:['{r} 오늘 왜 저럼','{r} 2군 한 번 보내라 제발','불펜 방화 언제까지 볼 거냐','치킨 시켰는데 체함','오늘 경기는 기억에서 지운다','투수 교체 타이밍 실화냐','득점권에서 한 방이 그렇게 어렵냐','{O}한테 이렇게 털릴 일이냐','타선 집단 슬럼프 아님?','이럴 거면 리빌딩이나 하자'],
       mix:['그래도 {p} 하나는 잘했다','질 수도 있지 내일 이기면 됨','144경기 중 하나일 뿐이다 진정하자','{p} 혼자 야구하네'],
       fun:['중계 끄고 산책 나감','오늘은 일찍 잔다','야구 끊는다 (내일 또 봄)']},
  psWin:{pos:['이게 가을야구지 소름 돋았다','{p} 큰 경기에 강하네','한 경기만 더 가자','오늘 직관 간 사람 평생 자랑해라','{q} 오늘 미쳤다 진짜'],mix:['이겼지만 내일이 더 중요하다','긴장돼서 끝까지 못 봤다','불펜만 버텨 주면 된다'],fun:['목 다 쉬었다','내일 연차 냈다']},
  psAdv:{pos:['{R} 통과! 이 기세로 끝까지 가자','{O} 잡고 올라간다','가을에 강한 팀 맞네','다음 시리즈도 이렇게만 하자','선수들 표정이 정규시즌이랑 다르다'],mix:['올라간 건 좋은데 투수 소모가 걱정','다음 상대가 훨씬 세다, 방심 금지'],fun:['다음 시리즈 표 구한 사람?']},
  psUpset:{pos:['업셋 실화냐 ㅋㅋㅋ','{O} 상대로 업셋 미쳤다','정규시즌 막판 연패는 다 잊었다','이게 가을야구지','하위 시드의 반란 제대로 보여 줬다'],mix:['업셋은 좋은데 다음은 더 세다','투수 다 쓰고 올라가서 걱정이긴 함'],fun:['단톡방 난리 났다']},
  psOut:{neg:['여기서 끝이네...','{R}에서 탈락, 아쉽다','결국 투수 깊이 차이','큰 경기 경험이 부족했다'],mix:['그래도 가을야구 맛은 봤다','여기까지 온 것도 잘했다','선수들 한 해 고생 많았다','내년엔 더 높은 곳에서 시작하자','스토브리그에서 보강 제대로 하자']},
  psChamp:{pos:['우승이다!!!','이 순간을 위해 응원했다','올해 선수들 전부 레전드','단장님 감독님 다 고생했다','평생 기억할 시즌'],fun:['내일 출근 못 함']},
  psLoss:{neg:['가을에 이렇게 무너지면 어떡하냐','{r} 큰 경기에서 왜 저래','여기까지 와서 이렇게 지냐','단기전은 투수 교체가 전부인데','오늘 경기는 두고두고 생각날 듯'],mix:['그래도 여기까지 온 게 어디냐','아직 끝난 거 아니다 다음 경기 이기자','올해 정말 고생 많았다','{p} 혼자 끝까지 싸웠다'],fun:['오늘은 말없이 잔다','내년 가을에 다시 보자']},
  wstreak:{pos:['{n}연승 실화냐 ㅋㅋ','이 기세면 가을야구 간다','연승할 때는 뭘 해도 됨','요즘 야구 볼 맛 난다','작년이랑 완전 다른 팀이네'],mix:['연승 끝나면 연패 올까 봐 무섭다']},
  lstreak:{neg:['{n}연패... 프런트 책임론 나와야 함','연패 끊을 생각은 있냐','분위기 너무 안 좋다','감독이랑 단장 둘 다 뭐 하냐','이 정도면 선수단 문제 맞음'],mix:['이럴 때 에이스가 끊어줘야 하는데','연패는 언젠가 끝난다... 언젠가']},
  tradeG:{pos:['와 이걸 받아준다고? 단장 협상 잘하네','{p} 데려오고 {q} 보낸 거면 이득 아님?','솔직히 이 트레이드는 박수 쳐줘야 함','상대 단장 무슨 생각임 ㅋㅋㅋ','드디어 프런트가 일을 하네','{pos} 구멍 이걸로 메웠다','{q} 아깝긴 한데 {p} 정도면 납득','단장 일 잘한다 인정'],
          mix:['일단 시즌 끝나고 판단하자','{q} 정들었는데 아쉽다 ㅠ','윈나우 하겠다는 거네']},
  tradeB:{neg:['{q} 왜 줌? 미쳤냐','이거 손해 아님? 누가 설명 좀','{p} 성적 보고 데려온 거 맞냐','단장 나가라 진짜','{q} 저쪽 가서 터지면 어쩔 건데','또 퍼주기 시작이네','트레이드 소식 보고 밥 먹다 체함','이게 맞는 트레이드냐 진짜 모르겠다'],
          mix:['{p} 우리 구장 오면 다를 수도','결과 보고 욕하자 일단','{q} 보낸 건 아깝다']},
  tradeE:{mix:['등가교환 같은데','서로 필요한 거 맞바꾼 듯','윈윈 트레이드로 보임','{q} 잘 가라 그동안 고마웠다','{p} 환영한다 잘해보자','둘 다 어떻게 될지 모르겠다'],pos:['{pos} 보강은 필요했지'],neg:['굳이 지금?']},
  rival:{pos:['{O}팬인데 우리가 이득 본 듯 ㅋㅋ','저쪽 단장 감사합니다','{p} 우리 팀 와서 잘해라'],neg:['{O}팬인데 우리 단장 뭐 하냐','{q} 보낸 거 실화냐 우리 팀','이거 우리가 손해 아님?'],mix:['{O}팬인데 일단 지켜봄']},
  mgrHire:{pos:['검증된 감독 데려왔네','경력 보니까 믿음 간다','{m} 감독 야구 스타일 좋아함','{ob}','이번엔 제대로 뽑은 듯'],neg:['처음 듣는 이름인데?','왜 하필 이 감독임','돈 아끼려고 뽑은 거 아니냐','전 팀에서 어땠는지 아는 사람?'],mix:['일단 시즌 보고 판단','선수단이랑 잘 맞으면 좋겠다','코치진은 누가 오는지가 더 중요함']},
  mgrFire:{pos:['늦었다 진짜','이제라도 바꾸네','결단 잘했다'],neg:['감독이 무슨 죄냐 선수 구성이 문제지','시즌 중에 이게 맞냐','단장도 같이 책임져라'],mix:['감독대행 체제로 버틸 수 있나','새 감독 누가 올지 궁금하다']},
  hot:{pos:['{p} 요즘 폼 미쳤다','{p} 최근 10경기 보고 놀람','{p} 국대 가자','{p} 다년 계약 잡아라 단장아','{p} 타석은 화장실도 못 감','{p} 없었으면 어쩔 뻔'],mix:['{p} 이 폼 오래 가야 할 텐데']},
  cold:{neg:['{p} 슬럼프 너무 길다','{p} 언제 살아나냐','{p} 2군 가서 조정 좀 하고 와라','{p} 라인업에서 빼라','{p} 자리 다른 선수 써보자'],mix:['{p} 원래 이런 선수 아닌데','{p} 믿고 기다려 보자','{p} 몸이 안 좋은 거 아님?']},
  forBad:{neg:['{p} 교체 언제 함?','외국인 스카우트 누가 했냐','{p} 이 돈 주고 데려온 거 맞냐','대체 외국인 알아봐라 제발'],mix:['{p} 적응 기간이라 치자','{p} 한 달만 더 보자']},
  forGood:{pos:['{p} 재계약 무조건','{p} 해외 갈까 봐 벌써 무섭다','{p} 역대급 외국인 아님?','외국인 이번엔 잘 뽑았네'],mix:['{p} 내년에도 이렇게 할까']},
  rankTop:{pos:['솔직히 올해 우승 각 아님?','{n}위 실화냐 행복하다','시즌 끝까지 이대로만','가을야구 예매 준비해라'],mix:['아직 시즌 길다 방심 금지','윗팀들도 만만치 않음']},
  rankMid:{mix:['5강 싸움 피 말린다','한 경기 한 경기가 결승이다','트레이드로 한 자리만 보강하면 될 듯','{pos} 하나만 채우면 위로 간다'],pos:['요즘 분위기 나쁘지 않다'],neg:['이도 저도 아닌 시즌 될 듯']},
  rankLow:{neg:['이럴 거면 리빌딩이나 하자','꼴찌 싸움 실화냐','단장 경질 언제 함?','올해도 가을야구 글렀다','리빌딩 할 거면 확실하게 해라','{pos} 자리가 구멍인데 프런트는 뭐 하냐'],mix:['내년 드래프트나 기대하자','그래도 응원은 한다']},
  feat:{pos:['ㄷㄷ {p} 미쳤다','이걸 실시간으로 봤다','{p} 이름 기록에 남겠네','역사적인 날이다'],fun:['오늘 중계 본 사람 승리자','하이라이트 열 번 돌려봄']},
  forChg:{mix:['교체 빠르네','새 외국인 영상 찾아봤는데 괜찮아 보임','이번엔 제대로 된 선수 오길'],neg:['또 바꿈? 처음부터 잘 뽑지']},
  drSteal:{pos:['{n}순위에 {p}? 이건 스틸이다','언론 {r}위를 여기서 줍네 ㅋㅋ','스카우트팀 일했다','{p} 고교 때 영상 봤는데 물건임','올해 드래프트 성공한 듯'],mix:['남아 있던 데는 이유가 있겠지','일단 몸부터 만들어라']},
  drReach:{neg:['{p}? 처음 듣는 이름인데','이 순번에 이 선수는 좀...','언론 {r}위를 {n}순위에? 오버드래프트 아님?','다른 좋은 선수 남았는데 왜','스카우트 무슨 생각이냐'],mix:['스카우트가 뭘 봤겠지 믿어보자','몇 년 뒤에 판단하자','{pos} 급했나 보네']},
  drOk:{mix:['무난한 픽','예상대로 갔네','{pos} 보강 필요했지','{p} 잘 커라','군대 문제부터 잘 풀자'],pos:['{p} 환영한다','이 정도면 괜찮은 지명']},
  drSum:{pos:['올해 드래프트 만족한다','상위 라운드 잘 뽑은 듯','몇 년 뒤가 기대된다'],neg:['올해 드래프트 망한 듯','스카우트팀 교체해라','상위 픽 아깝다'],mix:['드래프트는 5년 뒤에 평가하는 거다','신인은 키우기 나름','2군 코치들 어깨가 무겁다']},
  newsPos:{pos:['좋은 기사네','이런 기사 보고 싶었다','{p} 응원한다','기자님 일 잘하시네'],mix:['기사 제목 좀 과장 아님?']},
  newsNeg:{neg:['기사 뼈 때리네','반박 불가','프런트 이 기사 보고 있냐','팩트라 할 말이 없다'],mix:['기자가 너무 몰아가는 듯','한두 경기로 판단하긴 이르지']},
  newsNeu:{mix:['그렇구나','다음 소식 기다림','이건 좀 더 지켜보자','{p} 관련 소식 더 없냐','결국 성적으로 말하는 거지','오 이건 몰랐네','프런트 일 하긴 하네','시즌 끝나고 다시 보자','기사 잘 봤습니다','이게 우리한테 득일지 실일지'],fun:['ㅋㅋㅋ 기사 제목','댓글 1등','출근길에 읽음','점심 먹으면서 봄']}
};
const FMOOD_W={pos:{pos:.72,mix:.2,neg:.03,fun:.05},neg:{neg:.68,mix:.25,pos:.02,fun:.05},mix:{mix:.5,pos:.22,neg:.22,fun:.06}};
function fFill(t,v){ return t.replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null&&v[k]!==''?v[k]:''); }
function fComments(key,bank,mood,vars,n,tid,fanAdj){ const r=fRng(key); const B=FB[bank]||FB.newsNeu; const W={...(FMOOD_W[mood]||FMOOD_W.mix)};
  if(fanAdj){ W.pos=(W.pos||0)*(1+fanAdj); W.neg=(W.neg||0)*(1-fanAdj); }
  const out=[]; const used=new Set();
  for(let i=0;i<n;i++){ let x=r()*Object.values(W).reduce((a,b)=>a+b,0), cat='mix'; for(const [k,w] of Object.entries(W)){ if((x-=w)<=0){ cat=k; break; } }
    let L=B[cat]||B.mix||B.pos||B.neg; if(!L||!L.length)L=FB.newsNeu.mix; let t=null; for(let a=0;a<4;a++){ const c=fPick(r,L); if(!used.has(c)){ t=c; break; } } if(!t)continue; used.add(t);
    const txt=fFill(t,vars).replace(/\s+/g,' ').trim(); if(!txt||/^[ ,.]/.test(txt))continue;
    const like=Math.floor(Math.pow(r(),2.2)*(cat==='fun'?60:240)); const ftid=vars.rivalTid!=null&&r()<.3?vars.rivalTid:tid;
    out.push({nick:fNick(r,ftid),tid:ftid,t:txt,like,cat,ago:Math.floor(r()*180)}); }
  out.sort((a,b)=>b.like-a.like); if(out[0]&&out[0].like>=40)out[0].best=true; if(out[1]&&out[1].like>=80)out[1].best=true; return out; }
/* 우리 팬 분위기: 여론 지수 50 기준 */
/* 지명 반응: 전체 순번과 언론 순위 차이로 스틸·오버드래프트를 가른다 */
function draftFan(p){ const d=p.draft; if(!d)return {mood:'mix',bank:'drOk',lines:[]}; const n=(d.rd-1)*10+d.no; const r=p.press||n;
  const bank=r<=n-6?'drSteal':r>=n+12&&d.rd<=3?'drReach':'drOk'; const mood=bank==='drSteal'?'pos':bank==='drReach'?'neg':'mix';
  return {bank,mood,n,r,lines:fComments('dr'+p.id,bank,mood,{p:p.name,n,r,pos:posLabel(p)},3,G.user,fanAdj())}; }
function fanAdj(){ const f=G.pr?G.pr.fan:50; return clamp((f-50)/80,-.45,.45); }
const sn=id=>{ const p=G.players[id]; return p?p.name:''; };
/* ---- 글 만들기 ---- */
function fanThreads(){ const T=[]; const me=G.user; const MN=team(me).nick; const fa=fanAdj();
  const add=(o)=>{ o.views=o.views||Math.floor(200+fRng(o.id+'v')()*(o.hot?9000:2600)); T.push(o); };
  /* 1) 최근 우리 경기 */
  for(const g of (G.games||[]).slice(0,6)){ if(!g.box)continue; const meS=g.home===me?'h':'a', op=g.home===me?g.away:g.home; const won=g.res==='승';
    const bat=g.box[meS].bat.map(b=>({b,p:G.players[b.id]})).filter(x=>x.p); const pit=g.box[meS].pit.map(q=>({q,p:G.players[q.id]})).filter(x=>x.p);
    const star=[...bat].sort((a,c)=>(c.b.h*2+c.b.hr*4+c.b.rbi*1.5)-(a.b.h*2+a.b.hr*4+a.b.rbi*1.5))[0]; const goat=[...bat].sort((a,c)=>(a.b.h*2-a.b.so)-(c.b.h*2-c.b.so))[0];
    const sp=pit[0]; const worstP=[...pit].sort((a,c)=>c.q.er-a.q.er)[0];
    const rr=won?(sp&&sp.q.er<=1?sp.p.name:star?.p.name):(worstP&&worstP.q.er>=3?worstP.p.name:goat?.p.name);
    const vars={p:star?star.p.name:'',q:sp?sp.p.name:'',r:rr||'',O:team(op).nick,T:MN};
    const sc=`${g.home===me?g.hs:g.as}:${g.home===me?g.as:g.hs}`;
    const title=won?fPick(fRng('gt'+g.day),[`${tshort(op)}전 ${sc} 승리 후기`,(vars.p?`오늘 ${vars.p} 보신 분`:'오늘 경기 총평'),`${sc} 승! 오늘 경기 총평`,`이기니까 좋네요 (${sc})`]):fPick(fRng('gt'+g.day),[`${tshort(op)}전 ${sc} 패배... 총평`,(vars.r?`${vars.r} 오늘 왜 그랬냐`:'오늘 경기 총평'),`오늘 경기 보고 화나신 분`,`${sc} 패, 할 말이 없다`]);
    add({id:'g'+g.day,d:g.day,cat:'경기',title,body:`${team(op).city} ${team(op).nick}전 ${sc} ${won?'승리':g.res==='무'?'무승부':'패배'}.${star?` ${star.p.name} ${star.b.ab}타수 ${star.b.h}안타${star.b.hr?` ${star.b.hr}홈런`:''}.`:''}`,tid:me,ref:won?star?.p.id:null,
      cm:fComments('gc'+g.day,(g.kind&&/차전/.test(g.kind))?(won?'psWin':'psLoss'):(won?'win':'loss'),won?'pos':(g.kind&&/차전/.test(g.kind))?'mix':'neg',vars,6,me,fa),hot:Math.abs(g.hs-g.as)>=5}); }
  /* 1-2) 포스트시즌 시리즈 결과: 올라갔는지·탈락했는지·업셋인지(정규시즌 연승·연패 글은 정규시즌 중에만) */
  try{ const P=G.ps; if(P&&P.res&&P.resD){ for(const [rd,r] of Object.entries(P.res)){ const d=P.resD[rd]; if(d==null||d<G.cal.open||(r[0]!==me&&r[1]!==me))continue;
      const won=r[0]===me, op=won?r[1]:r[0], R=ROUNDK[rd]||rd; const si=t=>{ const i=(P.seeds||[]).indexOf(t); return i<0?9:i; }; const upset=won&&si(me)>si(op); const champ=won&&rd==='ks';
      const bank=champ?'psChamp':!won?'psOut':upset?'psUpset':'psAdv';
      add({id:'ps'+G.year+rd,d,cat:'경기',title:champ?`한국시리즈 우승!!! ${r[2]}승 ${r[3]}패`:!won?`${R} ${r[3]}승 ${r[2]}패 탈락... 올 시즌 총평`:upset?`${R} 업셋! ${tshort(op)} 잡았다 (${r[2]}승 ${r[3]}패)`:`${R} 통과! (${r[2]}승 ${r[3]}패)`,
        body:`${R}: ${tname(r[0])} ${r[2]}승 ${r[3]}패로 승리.`,tid:me,hot:true,cm:fComments('psc'+G.year+rd,bank,won?'pos':'mix',{R,O:team(op).nick},7,me,fa)}); } } }catch(e){ console.error(e); }
  /* 2) 연승·연패: 정규시즌 중에만(시즌이 끝나면 정규시즌 마지막 흐름 이야기를 계속 올리지 않는다) */
  if(period()==='season')try{ const st=streakOf(me)||''; const m=st.match(/(\d+)\s*(연승|연패)/); if(m&&+m[1]>=3){ const w=m[2]==='연승'; const k=`s${G.day}`; add({id:'st'+G.day,d:G.day,cat:'잡담',title:w?`${m[1]}연승 실화냐`:`${m[1]}연패... 다들 괜찮으세요`,body:'',tid:me,cm:fComments('stc'+G.day,w?'wstreak':'lstreak',w?'pos':'neg',{n:m[1]},6,me,fa),hot:true}); } }catch(e){}
  /* 3) 이번 주 순위(정규시즌 중에만) */
  if(period()==='season')try{ const wk=Math.floor(G.day/7); const order=standingsNow(); const rk=order.findIndex(x=>x.tid===me)+1; const gp=(G.sea.rec[me].w+G.sea.rec[me].l);
    if(gp>=10){ const T2=gmTrend(); const weak=T2&&T2.weak?SLOTS_S[T2.weak.k]:'';
      const bank=rk<=3?'rankTop':rk<=6?'rankMid':'rankLow'; add({id:'rk'+wk,d:wk*7,cat:'잡담',title:rk<=3?`${rk}위... 올해 진짜 다르다`:rk<=6?`현재 ${rk}위, 5강 가능하냐`:`${rk}위 실화냐`,body:'',tid:me,cm:fComments('rkc'+wk,bank,rk<=3?'pos':rk<=6?'mix':'neg',{n:rk,pos:weak},6,me,fa)}); } }catch(e){}
  /* 4) 요즘 잘하는·못하는 우리 선수 */
  try{ const wk0=Math.floor(G.day/7); const HC=G.fanHC=(G.fanHC&&G.fanHC.y===G.year)?G.fanHC:{y:G.year,w:{}};
    if(!HC.w[wk0]){ const L=playersOf(me).filter(p=>!p.isP&&p.l10&&p.l10.length>=6).map(p=>{ const a=p.l10; const ab=sum(a.map(x=>x[0])),h=sum(a.map(x=>x[1])),bb=sum(a.map(x=>x[3])),xb=sum(a.map(x=>x[5]||0)),sf=sum(a.map(x=>x[6]||0)); return {p,ops:ab?(h+bb)/(ab+bb+sf)+(h+xb)/ab:0}; });
      if(L.length){ const hot=[...L].sort((a,b)=>b.ops-a.ops)[0], cold=[...L].sort((a,b)=>a.ops-b.ops)[0]; HC.w[wk0]={h:hot.ops>=.95?[hot.p.id,+hot.ops.toFixed(3)]:null,c:cold.ops<.55&&cold!==hot?[cold.p.id,+cold.ops.toFixed(3)]:null};
        const ks=Object.keys(HC.w).map(Number).sort((x,y)=>y-x); ks.slice(4).forEach(k=>delete HC.w[k]); } }
    for(const [wk_,e] of Object.entries(HC.w)){ const wk=+wk_; const hp=e.h&&G.players[e.h[0]], cp=e.c&&G.players[e.c[0]];
      if(hp)add({id:'hot'+wk+hp.id,d:wk*7+1,cat:'선수',title:fPick(fRng('ht'+wk),[`${hp.name} 요즘 폼 미쳤다`,`${hp.name} 최근 10경기 OPS ${fmt3(e.h[1])}`,`${hp.name} 연봉 협상 걱정된다 (좋은 의미)`]),body:'',tid:me,ref:hp.id,cm:fComments('hc'+wk+hp.id,hp.foreign?'forGood':'hot','pos',{p:hp.name},5,me,fa)});
      if(cp)add({id:'cold'+wk+cp.id,d:wk*7+1,cat:'선수',title:fPick(fRng('ct'+wk),[`${cp.name} 언제 살아나냐`,`${cp.name} 최근 10경기 OPS ${fmt3(e.c[1])}...`,`${cp.name} 2군 보내야 하지 않나`]),body:'',tid:me,ref:cp.id,cm:fComments('cc'+wk+cp.id,cp.foreign?'forBad':'cold','neg',{p:cp.name},5,me,fa)}); } }catch(e){}
  /* 4-2) 우리 드래프트 총평 */
  try{ const mine=Object.values(G.players).filter(p=>p.team===G.user&&p.draft&&p.draft.y===G.year&&p.draft.rd<=3).sort((a,b)=>a.draft.rd-b.draft.rd||a.draft.no-b.draft.no);
    if(mine.length&&G.cal&&G.day>=G.cal.draft){ const sc=sum(mine.map(p=>{ const n=(p.draft.rd-1)*10+p.draft.no, r=p.press||n; return clamp((n-r)/10,-1.5,1.5); }))/mine.length; const mood=sc>.25?'pos':sc<-.25?'neg':'mix';
      add({id:'dr'+G.year,d:G.cal.draft,cat:'잡담',title:`${G.year} 드래프트 우리 픽 총평: ${mine.slice(0,3).map(p=>p.name).join(', ')}`,body:mine.map(p=>`${p.draft.rd}R ${p.draft.no}순위 ${p.name}(${posLabel(p)}, 언론 ${p.press||'-'}위)`).join(' / '),tid:me,ref:mine[0].id,cm:fComments('drs'+G.year,'drSum',mood,{},6,me,fa)}); } }catch(e){}
  /* 5) 우리 트레이드 */
  for(const t of (G.trades||[]).slice(-6)){ const gets=(t.gi||[]).map(sn).filter(Boolean), gives=(t.go||[]).map(sn).filter(Boolean); if(!gets.length&&!gives.length)continue;
    const gr=t.grade||'C'; const good=/[AB]/.test(gr), bad=/[DF]/.test(gr); const p0=G.players[(t.gi||[])[0]]; const pos=p0?(p0.isP?(isSPr(p0)?'선발':'불펜'):POSS[p0.pos]||''):'';
    const vars={p:gets[0]||'',q:gives[0]||'',pos,O:team(t.with).nick};
    add({id:'tr'+t.d+(t.gi||[]).join('.'),d:t.d,cat:'오피셜',title:`${gets.join('·')} ↔ ${gives.join('·')} 트레이드`,body:`${tname(t.with)}와(과) 트레이드. 언론 평점 ${gr}.`,tid:me,ref:t.gi&&t.gi[0],hot:true,
      cm:fComments('tc'+t.d+gets.join(),good?'tradeG':bad?'tradeB':'tradeE',good?'pos':bad?'neg':'mix',vars,8,me,fa).concat(fComments('tr2'+t.d,'rival',bad?'pos':good?'neg':'mix',{...vars,O:team(t.with).nick,p:gives[0]||'',q:gets[0]||''},2,t.with,0))}); }
  /* 6) 다른 구단 트레이드 */
  for(const x of (G.lgTrades||[]).slice(0,5)){ const A=x.ag.map(id=>G.players[id]).filter(Boolean), B=x.bg.map(id=>G.players[id]).filter(Boolean); if(!A.length||!B.length)continue;
    const v=s=>sum(s.map(p=>ovr(p)+(p.age<=25?4:p.age>=33?-4:0))); const dv=v(A)-v(B); const aw=dv>4?'pos':dv<-4?'neg':'mix';
    add({id:'lt'+x.d+x.a+x.b,d:x.d,cat:'트레이드',title:`${tshort(x.a)}-${tshort(x.b)} ${A[0].name}↔${B[0].name} 트레이드 어떻게 봄?`,body:`${tname(x.a)}은(는) ${A.map(p=>p.name).join('·')}을(를) 얻고 ${B.map(p=>p.name).join('·')}을(를) 내줬다.`,tid:null,
      cm:fComments('ltc'+x.d+x.a,'rival',aw,{O:team(x.a).nick,p:A[0].name,q:B[0].name},3,x.a,0).concat(fComments('ltd'+x.d+x.b,'rival',aw==='pos'?'neg':aw==='neg'?'pos':'mix',{O:team(x.b).nick,p:B[0].name,q:A[0].name},3,x.b,0))}); }
  /* 7) 리그 소식: 감독·기록·외국인 */
  for(const w of (G.wire||[]).slice(0,60)){
    if(w.k==='감독'){ const fire=w.x&&w.x.fire; const m=w.tid!=null?G.mgr[w.tid]:null; const good=m&&!fire&&((m.fame||0)>=65||(m.tac||0)>=66||m.ob); const bad=m&&!fire&&(m.fame||0)<45&&(m.tac||0)<55;
      const ours=w.tid===me; add({id:'mg'+w.d+w.tid+(fire?'f':''),d:w.d,cat:'감독',title:fire?`[속보] ${w.t}`:`${w.t.replace(/가 (.+) 감독을 새로 선임했습니다\./,' 새 감독 $1')} 어떻게 봄?`,body:m&&!fire?`${m.name} 감독 · ${m.career||'경력 정보 없음'}`:'',tid:w.tid,hot:ours,
        cm:fComments('mgc'+w.d+w.tid,fire?'mgrFire':'mgrHire',fire?'mix':good?'pos':bad?'neg':'mix',{m:m?m.name:'',ob:m&&m.ob?'우리 팀 출신 레전드 귀환 ㄷㄷ':''},ours?7:4,w.tid,ours?fa:0)}); }
    else if(w.k==='기록'){ const p=w.ref!=null?G.players[w.ref]:null; const nm=p?p.name:(w.t.split(' ')[0]); add({id:'ft'+w.d+w.t.length,d:w.d,cat:'기록',title:`ㄷㄷ ${w.t}`,body:'',tid:p?p.team:null,ref:p?p.id:null,hot:true,cm:fComments('ftc'+w.d+nm,'feat','pos',{p:nm},5,p?p.team:null,0)}); }
    else if(w.k==='외국인'&&w.tid===me){ add({id:'fo'+w.d+w.t.length,d:w.d,cat:'외국인',title:w.t,body:'',tid:me,cm:fComments('foc'+w.d,'forChg','mix',{},4,me,fa)}); } }
  /* 8) 우리 구단 기사 */
  for(const n of (G.news||[]).slice(0,14)){ if(n.k==='경기')continue; const p=n.ref!=null?G.players[n.ref]:null;
    const bank=n.k==='선수'&&p&&p.foreign?(n.v<0?'forBad':'forGood'):n.v>=1?'newsPos':n.v<=-1?'newsNeg':'newsNeu';
    add({id:'n'+n.id,d:n.d,cat:'기사',title:`[${n.o}] ${n.t}`,body:n.b||'',tid:me,ref:n.ref,nid:n.id,cm:fComments('nc'+n.id,bank,n.v>=1?'pos':n.v<=-1?'neg':'mix',{p:p?p.name:''},5,me,fa)}); }
  const seen=new Set(); return T.filter(t=>{ if(seen.has(t.id))return false; seen.add(t.id); return true; }).sort((a,b)=>b.d-a.d||(b.hot?1:0)-(a.hot?1:0)).slice(0,40); }
/* 기사 하나의 댓글 */
function newsComments(n){ const p=n.ref!=null?G.players[n.ref]:null; const bank=n.k==='선수'&&p&&p.foreign?(n.v<0?'forBad':'forGood'):n.k==='경기'?(n.v>=0?'win':'loss'):n.v>=1?'newsPos':n.v<=-1?'newsNeg':'newsNeu';
  return fComments('nc'+n.id,bank,n.v>=1?'pos':n.v<=-1?'neg':'mix',{p:p?p.name:'',r:p?p.name:'',O:''},5,G.user,fanAdj()); }
/* 최근 우리 트레이드 반응 두 줄 (트레이드 성사 도장에 붙인다) */
function tradeFanLines(){ const t=(G.trades||[])[G.trades.length-1]; if(!t)return []; const th=fanThreads().find(x=>x.id==='tr'+t.d+(t.gi||[]).join('.')); return th?th.cm.slice(0,3):[]; }
function gameFanLines(g){ if(!g)return []; const th=fanThreads().find(x=>x.id==='g'+g.day); return th?th.cm.slice(0,2):[]; }
/* ---- 화면 ---- */
const FCAT={경기:'',트레이드:'tr',오피셜:'of',감독:'mg',선수:'pl',기록:'ft',외국인:'fo',잡담:'',기사:'nw'};
function cmtRow(c){ return `<div class="fcm${c.best?' best':''}"><div class="fcm-h">${c.best?'<i class="fbest">베스트</i>':''}${c.tid!=null?badge(c.tid,12):''}<b>${esc(c.nick)}</b><span>${c.ago<60?c.ago+'분 전':Math.floor(c.ago/60)+'시간 전'}</span><em>추천 ${c.like}</em></div><p>${lk(c.t)}</p></div>`; }
function fanBoard(){ const L=fanThreads(); const f=UI.fbf||'all'; const cats=['all','경기','트레이드','감독','선수','기사'];
  const pass=t=>f==='all'||(f==='트레이드'?(t.cat==='트레이드'||t.cat==='오피셜'):f==='선수'?(t.cat==='선수'||t.cat==='외국인'||t.cat==='기록'):t.cat===f);
  const R=L.filter(pass); const open=UI.fbo;
  const row=t=>{ const o=open===t.id; const best=t.cm.filter(c=>c.best).length; return `<div class="fth${o?' open':''}"><button class="fth-h" data-a="fbo" data-v="${esc(t.id)}"><span class="fcat ${FCAT[t.cat]||''}">${t.cat}</span><span class="fth-t"><b>${lk(t.title)}</b> <i class="fcn">[${t.cm.length}]</i>${t.hot?'<i class="fhot">인기</i>':''}</span><span class="fth-m">${t.tid!=null?badge(t.tid,12):''}${esc(fNick(fRng(t.id+'w'),t.tid))} · ${dsh(Math.max(0,t.d))} · 조회 ${t.views.toLocaleString()} · 추천 ${Math.floor(t.views/40)}</span></button>
      ${o?`<div class="fth-b">${t.body?`<p class="fbody">${lk(t.body)}</p>`:''}${t.ref!=null&&G.players[t.ref]?`<button class="tc-i" data-a="player" data-v="${t.ref}">${esc(G.players[t.ref].name)} 카드</button>`:''}<div class="fcms">${t.cm.map(cmtRow).join('')}</div></div>`:''}</div>`; };
  return `<section class="card"><div class="row between"><h2 class="sec">팬 게시판</h2><span class="small muted">팬 여론 ${Math.round(G.pr?G.pr.fan:50)} · 글을 누르면 댓글</span></div>
    <div class="chips">${cats.map(k=>`<button data-a="fbf" data-v="${k}" class="${f===k?'on':''}">${k==='all'?'전체':k}</button>`).join('')}</div>
    ${R.length?`<div class="fboard">${R.map(row).join('')}</div>`:'<p class="small muted">아직 글이 없습니다. 경기가 시작되면 팬들이 글을 올립니다.</p>'}
    <p class="small muted">팬 게시판은 경기·트레이드·감독 선임·선수 성적·기사를 보고 팬들이 남기는 반응입니다. 팬 여론이 높을수록 우리 구단에 너그럽습니다.</p></section>`; }
function fanLinesHtml(L,title){ return L.length?`<div class="fanl"><span class="eyebrow">${title||'팬 반응'}</span>${L.map(c=>`<p><b>${esc(c.nick)}</b> ${lk(c.t)} <em>추천 ${c.like}</em></p>`).join('')}</div>`:''; }

