/* ===== 국제대회 실제 경기: 조별리그·토너먼트 · 상대국 선수(카드) · 대회 기록실 =====
   예전에는 대표팀 전력으로 메달을 한 번에 정했다(ntOdds). 이제 대회 기간에 실제 경기를 치르고 그 결과로 성적·특례·영웅이 정해진다.
   - 상대국은 다른 나라 리그를 돌리지 않는다. 나라마다 선수 명부(G.ntw)를 두고 해마다 나이·성장·노쇠·은퇴·신인 교체만 반영한다(가벼운 진화).
     일본·미국·대만·호주는 깊은 명부(40~50명, 가상 소속 구단), 나머지 나라는 대표팀 규모 명부.
   - 대회마다 명부에서 그 대회에 나올 수 있는 선수로 대표팀을 꾸린다: WBC는 메이저리거까지, 프리미어12·올림픽은 메이저리그(40인) 선수가 나오지 않는다.
     아시안게임 일본은 사회인야구 선발팀이다.
   - 전력 기준은 한국 리그 상위 24명 평균(ntKRef)에 나라별 차이를 더한다. 리그 능력 인플레이션·조정을 따라가게.
   - 경기는 리그와 같은 경기 엔진(simGame)을 쓴다. 상대국·해외파 선수는 경기 동안만 임시 선수로 만들고 끝나면 지운다(퓨처스리그 임시 선수와 같은 방식).
   - 한국 선수의 대회 출전은 피로·투구 부하·작은 부상 위험으로 소속 팀에 돌아온다. 활약한 선수는 인기가 오르고 우리 선수가 활약하면 팬 여론이 좋아진다 */
const NTN={
  KR:{n:'한국'},
  JP:{n:'일본',fn:'jp',off:1.5,full:46,lg:'일본 프로야구',cl:['도쿄 피닉스','도쿄 그리폰스','요코하마 오션스','나고야 썬더버즈','오사카 샤크스','고베 마스터즈','히로시마 레드윙스','후쿠오카 팰컨스','삿포로 울브스','센다이 스타즈','사이타마 라이트닝','지바 돌핀스']},
  US:{n:'미국',fn:'us',off:5,full:52,mlb:1,lg:'메이저리그',cl:['뉴욕 엠파이어스','보스턴 리버티','시카고 윈디스','샌프란시스코 베이호크스','텍사스 론스타즈','시애틀 레이니어스','애틀랜타 피치스','마이애미 웨이브스','덴버 마운티니어스','필라델피아 벨스','피닉스 선버스트','디트로이트 엔진스']},
  TW:{n:'대만',fn:'tw',off:-4,full:44,lg:'대만 프로야구',cl:['타이베이 드래곤나이츠','타이중 썬스','가오슝 시라이언스','타오위안 스카이호크스','신주 블루스','타이난 골든버펄로스']},
  AU:{n:'호주',fn:'au',off:-8,full:40,lg:'호주 프로야구',cl:['시드니 서던크로스','멜버른 오로라스','브리즈번 코럴스','퍼스 서프','애들레이드 바이퍼스','캔버라 캐피털스']},
  DOM:{n:'도미니카공화국',fn:'la',off:3,mlb:1,lg:'미국 프로야구'},
  VEN:{n:'베네수엘라',fn:'ve',off:1,mlb:1,lg:'미국 프로야구'},
  PR:{n:'푸에르토리코',fn:'la',off:-1,mlb:1,lg:'미국 프로야구'},
  MEX:{n:'멕시코',fn:'la',off:-2,mlb:1,lg:'멕시코 리그'},
  CUB:{n:'쿠바',fn:'la',off:-4,lg:'쿠바 리그'},
  NED:{n:'네덜란드',fn:'nl',off:-5,lg:'네덜란드 리그'},
  PAN:{n:'파나마',fn:'la',off:-7,lg:'미국 마이너리그'},
  CAN:{n:'캐나다',fn:'us',off:-7,lg:'미국 마이너리그'},
  COL:{n:'콜롬비아',fn:'la',off:-8,lg:'미국 마이너리그'},
  ITA:{n:'이탈리아',fn:'it',off:-9,lg:'이탈리아 리그'},
  ISR:{n:'이스라엘',fn:'us',off:-9,lg:'미국 마이너리그'},
  GBR:{n:'영국',fn:'us',off:-11,lg:'영국 리그'},
  NIC:{n:'니카라과',fn:'la',off:-11,lg:'니카라과 리그'},
  CZE:{n:'체코',fn:'cz',off:-13,lg:'체코 리그'},
  CHN:{n:'중국',fn:'cn',off:-17,lg:'중국 리그'},
  JPA:{n:'일본',fn:'jp',off:-8,lg:'일본 사회인야구',cl:['도요타 기업팀','JR 동일본 기업팀','오사카 가스 기업팀','파나소닉 기업팀','미쓰비시 중공업 기업팀','도쿄 가스 기업팀']},
  HK:{n:'홍콩',fn:'cn',off:-25,lg:'홍콩 리그'},
  THA:{n:'태국',fn:'th',off:-28,lg:'태국 리그'},
  PHI:{n:'필리핀',fn:'ph',off:-26,lg:'필리핀 리그'},
  LAO:{n:'라오스',fn:'lao',off:-32,lg:'라오스 리그'}
};
/* 이름이 없는 나라용 성·이름(가상 조합) */
const NTFN={
  nl:{f:['다닐로','유르겐','시던','레이몬드','디디','잰더','켄드릭','진','로날드','셔비'],l:['데용','반데르','마르티나','시몬스','볼란','프로퍼','케르크호프','얀선','바크','레이스']},
  it:{f:['마르코','알렉스','니코','조','도미닉','빈센트','앤서니','루카','지오','샘'],l:['로시','콜롬보','리치','마리노','그레코','브루노','갈리','콘티','데루카','파렐라']},
  cz:{f:['마르틴','온드르제이','보이테흐','야쿠프','페트르','다비드','토마시','마레크','얀','루카시'],l:['노보트니','스보보다','드보르자크','체르니','프로하스카','쿠체라','베셀리','호라크','네메츠','포코르니']},
  cn:{f:['웨이','하오','레이','쥔','펑','밍','캉','타오','신','룽'],l:['왕','리','장','류','천','양','자오','황','저우','우'],rev:true},
  th:{f:['솜차이','아피난','차이야','낫타폰','위차이','파난','끼띠삭','타나윗','삭다','수라퐁'],l:['분마','시리왓','차이완','쁘라섯','캄뺑','통쑥','락쌋','윙웡','짠타','펫차랏']},
  ph:{f:['후안','마크','제롬','레이','카를로','폴','미겔','데니스','조슈아','라이언'],l:['산토스','레예스','크루스','바우티스타','오캄포','가르시아','멘도사','토레스','델로스산토스','라모스']},
  lao:{f:['솜폰','캄판','분마','시사이','통','파이','캄씽','부아','폰','삭'],l:['폼마짠','시사왓','캄펭','분씨','락사나','칸타봉','인타봉','사이야','봉사','통달라']}
};
function ntNameOf(code,used){ const nt=NTN[code]; const d=FN[nt.fn]||NTFN[nt.fn]||FN.us; for(let i=0;i<40;i++){ const n=d.rev?pick(d.l)+' '+pick(d.f):pick(d.f)+' '+pick(d.l); if(!used.has(n)){ used.add(n); return n; } } return pick(d.f)+' '+pick(d.l); }
/* 한국 리그 상위 24명 평균(내부 능력). 해마다 한 번 */
function ntKRef(){ const W=G.ntw; if(W&&W.kr&&W.kr.y===G.year)return W.kr.v; const L=Object.values(G.players).filter(p=>p.team!=null&&!p.foreign).map(ovr).sort((a,b)=>b-a).slice(0,24); const v=L.length?L.reduce((s,x)=>s+x,0)/L.length:58; if(W)W.kr={y:G.year,v}; return v; }
const NT_RK={P:['stf','ctl','sta'],B:['con','pow','eye','spd','def','vit']};
const NT_BPOS=['C','C','C','1B','1B','2B','2B','3B','3B','SS','SS','LF','LF','CF','CF','RF','RF','1B','3B','LF','CF','SS'];
/* 명부 선수 하나: {i:id, nm, P:투수, pos, a:나이, th, bt, r:[능력], c:소속, lv:'MLB'(미국 메이저리그 40인)·m:1(일본·대만 선수 중 메이저리그 진출), cs:통산 대표 기록, md:메달} */
function ntMkPl(code,isP,pos,age,base,used){ const W=G.ntw; const q=newPlayer({isP,pos,age,base:clamp(base,25,79),foreign:'용병'}); delete G.players[q.id];
  const k=isP?'P':'B'; const pl={i:code+(W.nid=(W.nid||0)+1),nm:ntNameOf(code,used),P:isP?1:0,pos:isP?'P':q.pos,a:age,th:q.th,bt:q.bt,r:NT_RK[k].map(x=>Math.round(q.r[x]??50)),v:Math.round((q.velo||0)*10)/10};
  if(isP)pl.sp=R()<.55?1:0; const nt=NTN[code]; if(nt.cl)pl.c=pick(nt.cl); return pl; }
const ntPlO=pl=>pl.P?pl.r[0]*.44+pl.r[1]*.44+pl.r[2]*.12:pl.r[0]*.3+pl.r[1]*.25+pl.r[2]*.15+pl.r[3]*.1+pl.r[4]*.2;
function ntShiftPl(pl,d){ const n=pl.P?3:5; for(let j=0;j<n;j++)pl.r[j]=clamp(Math.round(pl.r[j]+d+N(0,.6)),20,80); }
/* 나라 명부 만들기: 깊은 명부(full)는 1군 26명 + 그 밑 선수, 나머지는 대표팀 규모(26명) */
function ntMkNation(code){ const W=G.ntw, nt=NTN[code], K=ntKRef(); const size=nt.full||26; const used=new Set(); const P=[];
  const T=K+nt.off; for(let i=0;i<size;i++){ const isP=i%2===0; const deep=i>=30; const age=deep?ri(20,27):clamp(Math.round(N(28.5,3.6)),20,37);
    const base=T+(deep?-4.5:0)+(i<4?3:i<10?1.2:0)+N(0,2.4)+(age<=23?-2:0); const pos=isP?'P':NT_BPOS[(i>>1)%NT_BPOS.length];
    const pl=ntMkPl(code,isP,pos,age,base,used); if(code==='US')pl.lv=i<34?'MLB':'AAA'; P.push(pl); }
  if(code==='US')P.forEach(pl=>{ const c=pick(nt.cl); pl.c=pl.lv==='MLB'?c:`${c} 산하 트리플A`; });
  const o={s:0,p:P}; W.n[code]=o; return o; }
function ntWorld(){ if(!G.ntw)G.ntw={v:1,y:G.year,nid:0,n:{}}; const W=G.ntw; if(W.y<G.year){ for(let y=W.y;y<G.year;y++)for(const c in W.n)ntEvolve(c); W.y=G.year; } return W; }
function ntNation(code){ const W=ntWorld(); return W.n[code]||ntMkNation(code); }
/* 한 해 진화: 나이·성장/노쇠·은퇴·신인. 명부 상위 평균을 목표(한국 기준+나라 차이+흔들림)로 천천히 당긴다 */
function ntEvolve(code){ const W=G.ntw, o=W.n[code], nt=NTN[code]; if(!o||!nt)return; const used=new Set(o.p.map(x=>x.nm)); const K=ntKRef();
  for(const pl of o.p){ pl.a++; const a=pl.a; const d=a<=23?N(2.2,1.5):a<=26?N(1,1.2):a<=30?N(.1,1):a<=33?-N(1.1,.9):-N(2.3,1.2); ntShiftPl(pl,d); }
  o.p=o.p.filter(pl=>!(pl.a>=39||(pl.a>=35&&R()<.3)||(pl.a>=32&&ntPlO(pl)<K+nt.off-9&&R()<.5)));
  const size=nt.full||26; while(o.p.length<size){ const isP=o.p.filter(x=>x.P).length<size/2; const pos=isP?'P':NT_BPOS[ri(0,NT_BPOS.length-1)]; const age=ri(19,24); o.p.push(ntMkPl(code,isP,pos,age,K+nt.off-4+N(0,2.6)-(age<=21?2:0),used)); }
  o.s=clamp((o.s||0)+N(0,.5),-3,3); /* 나라 전력의 해마다 흔들림(황금세대·세대교체) */
  const top=o.p.slice().sort((a,b)=>ntPlO(b)-ntPlO(a)).slice(0,24), M=top.reduce((s,x)=>s+ntPlO(x),0)/Math.max(1,top.length); const sh=clamp((K+nt.off+o.s-M)*.3,-1.5,1.5); o.p.forEach(pl=>ntShiftPl(pl,sh));
  /* 소속: 미국은 상위 34명이 메이저리그, 나머지 트리플A. 일본·대만 정상급 젊은 선수는 가끔 메이저리그로 간다(WBC에만 나온다) */
  if(code==='US'){ const S=o.p.slice().sort((a,b)=>ntPlO(b)-ntPlO(a)); S.forEach((pl,i)=>{ const lv=i<34?'MLB':'AAA'; if(pl.lv!==lv||!pl.c){ const c=pick(nt.cl); pl.c=lv==='MLB'?c:`${c} 산하 트리플A`; } pl.lv=lv; }); }
  if(code==='JP'||code==='TW'){ const S=o.p.filter(x=>!x.m&&x.a>=24&&x.a<=31).sort((a,b)=>ntPlO(b)-ntPlO(a)).slice(0,code==='JP'?3:1); for(const pl of S)if(R()<(code==='JP'?.22:.12)){ pl.m=1; pl.c=pick(NTN.US.cl); } }
  for(const pl of o.p)if(nt.cl&&!pl.m&&R()<.07)pl.c=pick(nt.cl); }
/* 대회 대표팀 고르기(26명: 투수 13·야수 13, 포수 2명 이상). WBC가 아니면 메이저리그 선수는 나오지 않는다(메이저리그 위주 나라는 그만큼 약해진다) */
function ntPickSquad(code,k){ const o=ntNation(code), nt=NTN[code]; const ok=pl=>k==='wbc'||!(pl.lv==='MLB'||pl.m);
  let L=o.p.filter(ok); const pen=k!=='wbc'&&nt.mlb&&code!=='US'?5:0; /* 도미니카·베네수엘라 등: 메이저리거가 빠진 만큼 */
  const by=f=>L.filter(f).sort((a,b)=>ntPlO(b)-ntPlO(a)); const P=by(x=>x.P).slice(0,13), C=by(x=>!x.P&&x.pos==='C').slice(0,2), B=by(x=>!x.P&&!C.includes(x)).slice(0,11);
  return {ids:[...P,...C,...B].map(x=>x.i),pen}; }
function ntFindPl(id){ const W=G.ntw; if(!W)return null; const code=String(id).replace(/\d+$/,''); const o=W.n[code]; return o?o.p.find(x=>x.i===id)||null:null; }

/* 아시안게임 구단당 최소 인원 2단계 수리(검수 11-17 #240, 소집일 검사 ntMedCheck 끝에서 부른다): 한 자리씩 바꾸는 수리로 0명 구단이 남을 때
   (예: 그 구단 유일한 포수가 다쳐 다른 구단 포수로 대체 → 그 구단 외야수를 넣으려면 빼야 할 외야수가 모두 1명뿐인 구단 소속)
   두 자리를 함께 바꾼다: 0명 구단 선수 c를 넣고 같은 묶음 o(구단 Z)를 빼고, Z의 다른 선수 c2를 넣고 같은 묶음 o2(여유 있는 구단)를 뺀다. 능력 합이 가장 좋은 조합. 난수 없음, 사람·AI 구단 같은 규칙 */
function ntMinChain(N,st,out){ const e=NT_EV[N.k]; if(!e||!e.min)return 0; let n=0; st=st||(()=>{});
  const tm=id=>{ const q=G.players[id]; return q?q.team:null; }, cntT=tid=>N.ids.filter(id=>tm(id)===tid).length;
  for(const t of G.teams){ if(cntT(t.id)>=e.min)continue; const have=new Set(N.ids.concat(N.ref||[])), wild=new Set(N.wild||[]); const pool=ntPool(true).filter(p=>!have.has(p.id));
    const okP=(p,w)=>!e.u25||ntU25(p)||(wild.size+w<NT_WILD&&p.age<=NT_WILD_AGE), wOf=p=>e.u25&&!ntU25(p)?1:0;
    const sq=N.ids.map(id=>G.players[id]).filter(q=>q&&!wild.has(q.id)&&q.team!==t.id); let best=null;
    for(const c of pool){ if(c.team!==t.id||!okP(c,0))continue; const b1=ntBucket(c);
      for(const o of sq){ if(ntBucket(o)!==b1)continue; const z=o.team;
        if(cntT(z)>e.min){ const v=ovr(c)-ovr(o); if(!best||v>best.v)best={v,c,o}; continue; }
        for(const c2 of pool){ if(c2.team!==z||c2===c||!okP(c2,wOf(c)))continue; const b2=ntBucket(c2);
          for(const o2 of sq){ if(o2===o||ntBucket(o2)!==b2||o2.team===z||cntT(o2.team)<=e.min)continue; const v=ovr(c)+ovr(c2)-ovr(o)-ovr(o2); if(!best||v>best.v)best={v,c,o,c2,o2}; } } } }
    if(!best)continue; const swap=(o,c)=>{ N.ids=N.ids.filter(x=>x!==o.id); (N.ref=N.ref||[]).push(o.id); N.ids.push(c.id); if(e.u25&&!ntU25(c))(N.wild=N.wild||[]).push(c.id); if(N.bk)N.bk[c.id]=ntBucket(c);
      (N.med=N.med||[]).push({id:o.id,why:'구단당 최소 인원 조정',d:G.day,rep:c.id}); st(o,`${N.y} ${e.n} 대표 제외(사유: 구단당 최소 인원 조정)`,'mil'); if(out)out.push({p:o,why:'구단당 최소 인원 조정',r:c}); n++; };
    swap(best.o,best.c); if(best.c2)swap(best.o2,best.c2); }
  return n; }

/* ===== 대회 형식 · 일정 ===== */
const NT_FMT={
  wbc:{grp:{A:['TW','NED','CUB','ITA','PAN'],B:['JP','KR','AU','CZE','CHN'],C:['US','MEX','COL','GBR','CAN'],D:['PR','VEN','DOM','ISR','NIC']},ko:'qf',gd:15},
  p12:{grp:{A:['US','MEX','PAN','NED','PR','VEN'],B:['JP','TW','KR','DOM','CUB','AU']},ko:'super',gd:11},
  ag:{grp:{A:['KR','TW','HK','THA'],B:['JPA','CHN','PHI','LAO']},ko:'sf',gd:7},
  oly:{grp:{A:['JP','DOM','MEX'],B:['KR','US','ISR']},ko:'sf',gd:6}
};
/* 대회별 전력 감소(경기 동안 능력에서 뺀다). 아시안게임: 한국은 리그 중단 없이 25세 이하·입단 4년 차 이하 + 와일드카드라 리그 상위 24명(ntKRef)보다 5쯤 낮은데,
   상대도 1군 정예가 아니다. 대만은 프로 선수에 실업·아마추어·해외 마이너리거가 섞이고, 일본(JPA)은 사회인야구 선발팀, 중국은 그 아래.
   실제 한국 금메달 1998~2026 여덟 대회 중 일곱(2006 동). 보통 전력 한국이 금메달 80%쯤, 대만·일본은 경기마다 15~20%쯤 이기는 위협으로 맞춘다(사용자 제보 11-15) */
const NT_EPEN={ag:{TW:12,JPA:9,CHN:4}};
const NT_STL={G:'조별리그',QF:'8강',SF:'4강',SR:'슈퍼라운드',B:'3위 결정전',F:'결승'};
function ntRR(L){ const T=L.slice(); if(T.length%2)T.push(null); const n=T.length, R0=[]; for(let r=0;r<n-1;r++){ const M=[]; for(let i=0;i<n/2;i++){ const a=T[i], b=T[n-1-i]; if(a!=null&&b!=null)M.push(r%2?[b,a]:[a,b]); } R0.push(M); T.splice(1,0,T.pop()); } return R0; }
/* 대회 만들기: 소집일에 명단이 정해진 뒤 */
/* 한국 대표 명단이 비었으면(발표 뒤 모두 빠짐·빈 발표) 소집일에 뽑을 수 있는 실제 선수로 다시 뽑는다(검수 11-17 #216: 대체 선수만으로 전 경기를 치르고 금·은메달).
   그래도 경기를 꾸릴 수 없으면(ntKrReady) 한국 경기는 몰수패다. 난수를 쓰지 않는다(ntSquad: 감독 눈은 해시) */
function ntAutoSquad(N){ if((N.ids||[]).some(id=>G.players[id])||(N.ovs||[]).length)return 0; let S=[]; try{ S=ntSquad(N.k,N.ref||[]); }catch(err){} if(!S.length)return 0; const e=NT_EV[N.k], to=KD(e.to[0],e.to[1]);
  N.ids=S.map(x=>x.id); N.wild=S.filter(x=>x.wild).map(x=>x.id); N.bk=Object.assign(N.bk||{},Object.fromEntries(S.map(x=>[x.id,ntBucket(G.players[x.id])]))); N.auto=G.day;
  for(const id of N.ids){ const p=G.players[id]; p.ntFrom=G.day; p.ntAway=to; p.e1=false; }
  try{ if(N.ids.some(id=>G.players[id].team===G.user))ntShortGuard(G.day); }catch(err){}
  try{ addLog(`${e.n} 대표 명단이 비어 소집일에 ${N.ids.length}명을 새로 뽑았습니다.`); }catch(err){} return N.ids.length; }
function ntTourInit(N){ const k=N.k, F=NT_FMT[k], e=NT_EV[k]; if(!F)return null; ntWorld(); const res=KD(e.res[0],e.res[1]); ntAutoSquad(N);
  const teams=[].concat(...Object.values(F.grp)); const T={k,y:N.y,teams,grp:F.grp,games:[],sq:{},pen:{},st:{},ps:{},done:false};
  for(const c of teams)if(c!=='KR'){ const s=ntPickSquad(c,k); T.sq[c]=s.ids; const ep=(NT_EPEN[k]&&NT_EPEN[k][c])||0; if(s.pen+ep)T.pen[c]=s.pen+ep; }
  /* 조별리그: 조마다 라운드로빈, 마지막 조별 경기는 결승 F.gd일 전부터 하루 한 라운드 */
  for(const g in F.grp){ const RR=ntRR(F.grp[g]); RR.forEach((M,r)=>M.forEach(([h,a])=>T.games.push({st:'G',g,d:res-F.gd+r,h,a}))); }
  const W=(i)=>['W',i], L=(i)=>['L',i], S=(g,n)=>['S',g,n];
  if(F.ko==='qf'){ T.games.push({st:'QF',d:res-8,h:S('A',1),a:S('B',2)},{st:'QF',d:res-8,h:S('B',1),a:S('A',2)},{st:'QF',d:res-7,h:S('C',1),a:S('D',2)},{st:'QF',d:res-7,h:S('D',1),a:S('C',2)});
    const q=T.games.length-4; T.games.push({st:'SF',d:res-3,h:W(q),a:W(q+1)},{st:'SF',d:res-2,h:W(q+2),a:W(q+3)}); const s=T.games.length-2; T.games.push({st:'F',d:res,h:W(s),a:W(s+1)}); }
  else if(F.ko==='super'){ const P=[S('A',1),S('B',2),S('B',1),S('A',2)]; ntRR([0,1,2,3]).forEach((M,r)=>M.forEach(([h,a])=>T.games.push({st:'SR',d:res-4+r,h:P[h],a:P[a]}))); T.games.push({st:'B',d:res,h:['SR',3],a:['SR',4]},{st:'F',d:res,h:['SR',1],a:['SR',2]}); }
  else { T.games.push({st:'SF',d:res-2,h:S('A',1),a:S('B',2)},{st:'SF',d:res-2,h:S('B',1),a:S('A',2)}); const s=T.games.length-2; T.games.push({st:'B',d:res,h:L(s),a:L(s+1)},{st:'F',d:res,h:W(s),a:W(s+1)}); }
  T.games.forEach((x,i)=>x.n=i); N.tour=T; return T; }
/* 순위: 승 → (같으면) 실점 대비 득점 차 → 상대 전적 생략. 무승부는 반 승 */
function ntStand(T,list,st){ const R0={}; for(const c of list)R0[c]={c,w:0,l:0,t:0,rs:0,ra:0}; for(const g of T.games){ if(!g.done||g.st!==st||!(g.hc in R0)||!(g.ac in R0))continue; const H=R0[g.hc], A=R0[g.ac]; H.rs+=g.hs; H.ra+=g.as; A.rs+=g.as; A.ra+=g.hs; if(g.hs>g.as){ H.w++; A.l++; } else if(g.as>g.hs){ A.w++; H.l++; } else { H.t++; A.t++; } }
  return Object.values(R0).sort((a,b)=>(b.w+b.t/2)-(a.w+a.t/2)||(b.rs-b.ra)-(a.rs-a.ra)||b.rs-a.rs||a.c.localeCompare(b.c)); }
function ntRef(T,x){ if(typeof x==='string')return x; const [t,a,b]=x; if(t==='W'||t==='L'){ const g=T.games[a]; if(!g||!g.done)return null; const hw=g.win==='h'; return (t==='W')===hw?g.hc:g.ac; }
  if(t==='S'){ if(T.games.some(g=>g.st==='G'&&g.g===a&&!g.done))return null; const s=ntStand(T,T.grp[a],'G'); return s[b-1]?s[b-1].c:null; }
  if(t==='SR'){ if(T.games.some(g=>g.st==='SR'&&!g.done))return null; const L=[...new Set(T.games.filter(g=>g.st==='SR').flatMap(g=>[g.hc,g.ac]))]; const s=ntStand(T,L,'SR'); return s[a-1]?s[a-1].c:null; } return null; }

/* ===== 경기 ===== */
let NT_TMP=[];
function ntTmpP(src,o){ const p=newPlayer({isP:!!o.isP,pos:o.isP?'P':(o.pos||'1B'),age:o.age||27,base:o.base||50,foreign:'용병'}); p.team=null; p.flTemp=1; p.ntTmp=1; p.name=o.name||p.name; if(o.r){ const K=o.isP?NT_RK.P:NT_RK.B; K.forEach((k,j)=>{ if(o.r[j]!=null)p.r[k]=clamp(o.r[j]-(o.pen||0)*(k==='vit'?0:1),20,80); }); }
  if(o.th)p.th=o.th; if(o.bt)p.bt=o.bt; if(o.v!=null)p.velo=o.v; p.ntKey=src; if(o.fill)p.ntFill=1; NT_TMP.push(p.id); return p; }
/* 한 나라 선수단(경기용 선수 객체): 한국은 실제 선수 + WBC 해외파(임시), 상대국은 명부 선수(임시) */
function ntRosterObjs(T,code,N){ const out=[];
  if(code==='KR'){ for(const id of N.ids){ const p=G.players[id]; if(p&&healthy(p)&&!(p.injOut>0))out.push(p); }
    for(const x of (N.ovs||[])){ const p=ntTmpP('o'+x.id,{isP:x.isP,pos:x.pos,base:x.o,name:x.name,age:28}); out.push(p); } }
  else for(const id of (T.sq[code]||[])){ const pl=ntFindPl(id); if(!pl)continue; out.push(ntTmpP(id,{isP:pl.P,pos:pl.pos,age:pl.a,r:pl.r,name:pl.nm,th:pl.th,bt:pl.bt,v:pl.v,pen:T.pen[code]||0})); }
  return out; }
const ntKey=p=>p.ntKey||p.id;
/* 투수 휴식(대회 안): 마지막 등판일·투구 수로 본다(검수 11-17 #237·#238). 구원으로만 던진 투수도 선발 휴식 판정에 들고(예전: 선발 기록이 없으면 늘 '휴식 부족'),
   선발 4일이 지났어도 그 뒤 구원으로 많이 던졌으면 선발로 내지 않는다. 마지막 등판이 선발이면 선발 4일 규칙, 구원이면 투구 수만큼(등판일과의 차이):
   선발로 내려면 50구+ 4일 · 30구+ 2일 · 그 밑 1일, 구원으로 내려면 50구+ 3일 · 30구+ 2일 · 그 밑 1일 */
const ntRestNeed=(pc,sp)=>sp?(pc>=50?4:pc>=30?2:1):(pc>=50?3:pc>=30?2:1);
function ntRest(T,p,d,sp){ const x=T.ps[ntKey(p)]; if(!x)return true; if(sp&&x.ls!=null&&d-x.ls<4)return false; if(x.la==null)return true; if(sp&&x.la===x.ls)return true; return d-x.la>=ntRestNeed(x.lpc||0,sp); }
/* 대표팀 라인업(검수 11-17 #239): 소속 구단의 포지션 전환 훈련(pconv)·2군 기용 요청·주간 순번을 보지 않고 실제 포지션 수비 능력으로 자리마다 가장 나은 선수(난수 없음) */
function ntLineup(B){ const ln={}, used=new Set(); for(const k of FGPOS){ const free=B.filter(p=>!used.has(p.id)); if(!free.length)break;
    const sc=p=>(k==='DH'?offV(p):posScore(p,k))-(k!=='DH'&&k!==p.pos&&posExp(p,k)<50?6:0)-(k==='C'&&p.pos!=='C'&&posExp(p,'C')<40?30:0)-(p.ntFill?50:0); /* 대체 선수는 실제 선수가 없는 자리만 */
    const c=free.slice().sort((a,b)=>sc(b)-sc(a)||String(ntKey(a)).localeCompare(String(ntKey(b))))[0]; ln[k]=c; used.add(c.id); } return ln; }
/* 한국 대표가 경기를 꾸릴 수 있는가(검수 11-17 #216): 뛸 수 있는 실제 선수(해외파 포함)가 야수 9명·투수 5명 이상(ntResult의 '경기를 꾸릴 수 없음'과 같은 기준). 대체 선수는 이 명단의 빈자리만 메운다 */
function ntKrReady(N){ let b=0, p=0; for(const id of (N.ids||[])){ const q=G.players[id]; if(q&&healthy(q)&&!(q.injOut>0)){ if(q.isP)p++; else b++; } } for(const x of (N.ovs||[])){ if(x.isP)p++; else b++; } return b>=9&&p>=5; }
function ntSide(T,code,d,N){ const L=ntRosterObjs(T,code,N); const B=L.filter(p=>!p.isP), P=L.filter(p=>p.isP); const fb=ntKRef()+(NTN[code]&&NTN[code].off||0)-6;
  /* 대체 선수 기록 키는 나라마다 따로(검수 11-17 #217: 두 나라의 fillB0이 한 기록으로 합쳐짐). 개인 기록에는 넣지 않는다 */
  while(B.length<9)B.push(ntTmpP(`fill${code}B${B.length}`,{isP:false,pos:['C','1B','2B','3B','SS','LF','CF','RF','1B'][B.length],base:fb,name:'대체 선수',fill:1}));
  while(P.length<6)P.push(ntTmpP(`fill${code}P${P.length}`,{isP:true,base:fb,name:'대체 투수',fill:1}));
  const tid='nt:'+code; const ln=ntLineup(B); for(const k of FGPOS)if(!ln[k]){ const f=B.find(p=>!Object.values(ln).includes(p)); if(f)ln[k]=f; }
  const posOf={}; for(const k in ln)posOf[ln[k].id]=k; const start=Object.values(ln); const order=orderList(ORDER.filter(k=>ln[k]).map(k=>ln[k]),null);
  const rot=P.slice().sort((a,b)=>spV(b)-spV(a)).slice(0,5); let sp=rot.find(p=>ntRest(T,p,d,true))||P.find(p=>ntRest(T,p,d,true))||rot[0];
  for(const p of P){ const x=T.ps[ntKey(p)]; if(x&&p.ntTmp){ p.lastApp=x.la; p.lastPc=x.lpc; } }
  const pen=P.filter(p=>p!==sp&&ntRest(T,p,d,false)&&!(T.ps[ntKey(p)]&&T.ps[ntKey(p)].ls===d-1)).sort((a,b)=>penV(b)-penV(a)).slice(0,9);
  const bench=B.filter(p=>!start.includes(p));
  const s={tid,rot:null,order,posOf,bench,out:[],defv:teamDefV(ln),spAll:rot,short:false,pen,used:new Set([sp.id]),cur:sp,sp,curIsSP:true,idx:0,box:new Map(),pitchers:[sp.id],entry:{},exit:{},farm:true};
  s.start=order.map((p,o)=>({id:p.id,n:p.name,o,pos:posOf[p.id]})); s.changes=[]; s.box.set(sp.id,pz()); order.forEach(p=>s.box.set(p.id,bz())); sideTraits(s); return s; }
/* 대회 기록(타자: g pa ab h d tr hr r rbi bb so sb · 투수: g gs outs h er bb so w l sv) */
function ntStatAdd(T,key,isP,x,dec,ids){ let S=T.st[key]||(T.st[key]={P:isP?1:0,g:0}); if(!!S.P!==!!isP)S=S.x||(S.x={P:isP?1:0,g:0}); /* 대회 중 투타 역할이 바뀌면 다른 역할 기록은 S.x에 따로(검수 11-17 #215: 타자 안타와 피안타가 한 칸에 합쳐짐) */ S.g++;
  if(isP){ for(const k of ['outs','h','er','bb','so','hr'])S[k]=(S[k]||0)+(x[k]||0); S.gs=(S.gs||0)+(ids.sp?1:0); if(dec.w===ids.tid)S.w=(S.w||0)+1; if(dec.l===ids.tid)S.l=(S.l||0)+1; if(dec.sv===ids.tid)S.sv=(S.sv||0)+1; }
  else for(const k of ['pa','ab','h','d','tr','hr','r','rbi','bb','so','sb'])S[k]=(S[k]||0)+(x[k]||0); return S; }
function ntBoxOf(s,dec){ const nm=id=>{ const p=G.players[id]; return p?p.name:''; }; const key=id=>{ const p=G.players[id]; return p?ntKey(p):id; };
  const bat=[...s.order,...(s.out||[])].filter((p,i,a)=>a.indexOf(p)===i).map(p=>{ const b=s.box.get(p.id)||bz(); return [key(p.id),s.posOf[p.id]||'',b.ab,b.r,b.h,b.rbi,b.hr,b.bb,b.so,p.name]; });
  const pit=s.pitchers.map(id=>{ const b=s.box.get(id)||pz(); return [key(id),b.outs,b.h,b.r||0,b.er,b.bb,b.so,b.pc||0,nm(id),dec.w===id?'승':dec.l===id?'패':dec.sv===id?'세':'']; }); return {bat,pit}; }
/* 연장 무승부(토너먼트): 승부치기를 가정해 전력이 조금 센 쪽이 조금 더 유리하게 정한다 */
const ntTbP=(T,g)=>{ const sv=c=>c==='KR'?ntKRef():ntKRef()+(NTN[c].off||0)-(T.pen[c]||0); return clamp(.5+(sv(g.hc)-sv(g.ac))*.02,.3,.7); };
/* 승부치기 한 이닝을 경기 기록에 남긴다(검수 11-17 #220: 최종 4:3인데 이닝 합계 3:3, 결승점·승패 투수 없음).
   무사 2루(앞 타자가 주자)에서 이긴 쪽이 1점: 주자 득점(비자책), 다음 타자 희생플라이 타점. 이긴 쪽 마지막 투수 승, 진 쪽 마지막 투수 패. 난수는 예전과 같은 한 번 */
function ntTieBreak(T,g,r){ const hw=R()<ntTbP(T,g); const wk=hw?'h':'a', lk=hw?'a':'h'; const W=r.S[wk], L=r.S[lk];
  const bx=(s,id,z)=>{ if(!s.box.has(id))s.box.set(id,z()); return s.box.get(id); }; const n=W.order.length||1, run=W.order[((W.idx||0)-1+n*9)%n], bat=W.order[(W.idx||0)%n];
  if(run)bx(W,run.id,bz).r++; if(bat){ const b=bx(W,bat.id,bz); b.pa++; b.rbi++; } else if(run)bx(W,run.id,bz).rbi++;
  /* 이긴 쪽 투수는 상대 공격 3아웃. 진 쪽 투수: 끝내기(홈 승)면 희생플라이 1아웃, 원정 승이면 3아웃 */
  const wp=bx(W,W.cur.id,pz), lp=bx(L,L.cur.id,pz); lp.r=(lp.r||0)+1; wp.outs+=3; wp.pc+=12; wp.bf+=3; if(hw){ lp.outs+=1; lp.pc+=6; lp.bf+=1; } else { lp.outs+=3; lp.pc+=14; lp.bf+=4; }
  r.line.a.push(hw?0:1); r.line.h.push(hw?1:0); if(r.hits){ r.hits.a.push(0); r.hits.h.push(0); } r.score[wk]++; r.inn=(r.inn||0)+1;
  r.dec=Object.assign({},r.dec,{w:W.cur.id,l:L.cur.id,sv:null}); r.dec.hld=(r.dec.hld||[]).filter(id=>id!==W.cur.id&&id!==L.cur.id);
  (r.ev=r.ev||[]).push({h:hw?1:0,t:`승부치기 ${r.inn}회: ${run?run.name:''} 득점${bat?` · ${bat.name} 희생플라이`:''} · ${r.score.a}:${r.score.h}`,run:true}); g.tb=1; }
function ntPlayGame(T,g,N,d){ g.hc=ntRef(T,g.h); g.ac=ntRef(T,g.a); if(!g.hc||!g.ac){ g.skip=1; return; }
  /* 한국이 경기를 꾸릴 실제 선수가 없으면 몰수패(0:9). 대체 선수만으로 메달을 따지 않게(검수 11-17 #216) */
  if((g.hc==='KR'||g.ac==='KR')&&N&&!ntKrReady(N)){ const kh=g.hc==='KR'; g.hs=kh?0:9; g.as=kh?9:0; g.ff=kh?'h':'a'; g.win=kh?'a':'h'; g.done=1; return; }
  NT_TMP=[]; let r=null; const fat0=new Map(); try{ const sh=ntSide(T,g.hc,d,N), sa=ntSide(T,g.ac,d,N); for(const s0 of [sh,sa])for(const q of [...s0.order,...s0.bench,...s0.pen,s0.sp])if(q&&!q.ntTmp&&!fat0.has(q.id)){ fat0.set(q.id,q.fat||0); q.fat=Math.min(q.fat||0,15); } /* 소집 뒤 며칠 쉬고 나온다: 리그 시즌 피로를 그대로 들고 오지 않게(상대국 임시 선수와 같은 출발) */ r=simGame(d,null,null,false,{sides:{h:sh,a:sa},pitchRecords:false}); }catch(e){ (G.flErr=(G.flErr||[]).slice(-9)).push('nt:'+String(e&&e.message).slice(0,80)); }
  for(const [id,f] of fat0){ const q=G.players[id]; if(q)q.fat=f; }
  try{ if(!r){ /* 엔진 오류: 전력 차로 점수만 */ const sv=c=>c==='KR'?ntKRef():ntKRef()+(NTN[c].off||0)-(T.pen[c]||0); const lam=x=>Math.max(.5,4.2*Math.exp((x)*.06)); const pois=l=>{ let n=0,p=Math.exp(-l),s=p,u=R(); while(u>s&&n<20){ n++; p*=l/n; s+=p; } return n; }; g.hs=pois(lam(sv(g.hc)-sv(g.ac))); g.as=pois(lam(sv(g.ac)-sv(g.hc))); }
    else { for(const [id,f] of fat0){ const q=G.players[id]; if(q)q.fat=f; } fat0.clear(); if(r.score.h===r.score.a&&g.st!=='G')ntTieBreak(T,g,r); g.hs=r.score.h; g.as=r.score.a; g.inn=r.inn;
      for(const k of ['h','a']){ const s=r.S[k]; for(const [id,x] of s.box){ const p=G.players[id]; if(!p)continue; const key=ntKey(p); const isP=s.pitchers.includes(id); if(!isP&&!x.pa&&!x.ab)continue; if(!p.ntFill)ntStatAdd(T,key,isP&&p.isP,x,r.dec,{tid:id,sp:id===s.sp.id}); /* 대체 선수는 개인 기록에 넣지 않는다(검수 11-17 #217) */
          if(isP&&p.isP){ const q=T.ps[key]||(T.ps[key]={}); q.la=d; q.lpc=x.pc||0; if(id===s.sp.id)q.ls=d; }
          /* 한국 실제 선수: 피로·투구 부하·작은 부상 위험이 소속 팀으로 돌아간다 */
          if(!p.ntTmp&&p.team!=null){ if(isP&&p.isP){ const sp=id===s.sp.id; try{ pitchApp(p,d,x.pc||0,sp); }catch(e){} p.fat=clamp((p.fat||0)+pitFatGain(p,x.pc||0,sp),0,100); if(!(p.injOut>0)&&R()<(p.inj||.03)*(sp?.06*(x.pc||0)/95:.02*(x.pc||0)/17)*injMult(p))try{ injure(p,d,{nt:1}); }catch(e){} }
            else { const pos=s.posOf[id]; p.fat=clamp((p.fat||0)+((pos==='C'?12:pos==='DH'?4:8)-(p.r.vit||52)*.04),0,100); if(!(p.injOut>0)&&R()<(p.inj||.03)*.02*injMult(p))try{ injure(p,d,{nt:1}); }catch(e){} } } } }
      if(g.hc==='KR'||g.ac==='KR'||g.st!=='G'){ g.box={h:ntBoxOf(r.S.h,r.dec),a:ntBoxOf(r.S.a,r.dec),lh:r.line.h,la:r.line.a}; g.ev=(r.ev||[]).filter(x=>x&&x.t).slice(0,14).map(x=>x.t); if(g.tb){ const t=r.ev[r.ev.length-1].t; if(!g.ev.includes(t))g.ev[Math.min(13,g.ev.length)]=t; } }
      const key=id=>{ const p=G.players[id]; return p?ntKey(p):null; }; g.wp=r.dec.w!=null?key(r.dec.w):null; g.lp=r.dec.l!=null?key(r.dec.l):null; } }
  finally{ for(const id of NT_TMP)delete G.players[id]; NT_TMP=[]; }
  if(g.hs===g.as&&g.st!=='G'){ if(R()<ntTbP(T,g))g.hs++; else g.as++; g.tb=1; } /* 엔진 오류로 점수만 낸 경기 */
  g.win=g.hs>g.as?'h':g.as>g.hs?'a':null; g.done=1; }
/* 하루치 경기 */
function ntTourDay(N,d){ const T=N.tour; if(!T||T.done)return; for(const g of T.games)if(!g.done&&!g.skip&&g.d===d)ntPlayGame(T,g,N,d);
  if(T.games.every(g=>g.done||g.skip)||d>=KD(...NT_EV[T.k].res))ntTourFinish(T); }
/* 최종 순위와 한국 성적(lv 1 우승·금, 2 준우승·은, 3 4강·동, 4 그 밖) */
function ntTourFinish(T){ if(T.done)return; T.done=true; const F=T.games.filter(g=>g.st==='F'&&g.done)[0], B=T.games.filter(g=>g.st==='B'&&g.done)[0]; const rank={};
  if(F){ rank[F.win==='h'?F.hc:F.ac]=1; rank[F.win==='h'?F.ac:F.hc]=2; }
  if(B){ rank[B.win==='h'?B.hc:B.ac]=3; rank[B.win==='h'?B.ac:B.hc]=4; } else for(const g of T.games.filter(x=>x.st==='SF'&&x.done)){ const l=g.win==='h'?g.ac:g.hc; if(!rank[l])rank[l]=3; }
  T.rank=rank; const kr=rank.KR; T.lv=kr&&kr<=3?kr:4;
  const medal=T.k==='ag'||T.k==='oly'; const reach=T.games.some(g=>(g.hc==='KR'||g.ac==='KR')&&g.st==='QF'), reachSR=T.games.some(g=>(g.hc==='KR'||g.ac==='KR')&&g.st==='SR');
  T.res=medal?(kr===1?'금메달':kr===2?'은메달':kr===3?'동메달':kr===4?'4위':'노메달'):(kr===1?'우승':kr===2?'준우승':kr===3?(B?'3위':'4강'):kr===4?'4위':reach?'8강':reachSR?'슈퍼라운드':'조별 탈락');
  /* 대회 MVP: 우승국 선수 중 활약 점수 최고, 한국 MVP는 따로 */
  const sc=(key)=>{ const S=T.st[key]; if(!S)return -99; if(S.P){ const ip=(S.outs||0)/3; if(ip<3)return -99; return ip*.6+(S.so||0)*.25-(S.er||0)*1.2+(S.w||0)*1.5+(S.sv||0); } if((S.pa||0)<6)return -99; const ob=(S.h+S.bb)/Math.max(1,S.pa), sl=(S.h+S.d+2*S.tr+3*S.hr)/Math.max(1,S.ab); return (ob+sl-.65)*S.pa*.6+S.hr*1.2+S.rbi*.3; };
  const ofC=key=>/^\d+$/.test(String(key))?'KR':String(key).startsWith('o')?'KR':String(key).replace(/\d+$/,'');
  const champ=Object.keys(rank).find(c=>rank[c]===1); const keys=Object.keys(T.st);
  const mvp=keys.filter(x=>ofC(x)===champ).sort((a,b)=>sc(b)-sc(a))[0]; T.mvp=mvp||null; T.krMvp=keys.filter(x=>ofC(x)==='KR').sort((a,b)=>sc(b)-sc(a))[0]||null; T.sc=Object.fromEntries(keys.map(x=>[x,Math.round(sc(x)*10)/10]));
  /* 상대국 선수 통산 대표 기록·메달 */
  for(const key of keys){ const c=ofC(key); if(c==='KR')continue; const pl=ntFindPl(key); if(!pl)continue; const S=T.st[key]; const cs=pl.cs||(pl.cs={}); for(const k in S)if(typeof S[k]==='number'&&k!=='P')cs[k]=(cs[k]||0)+S[k]; cs.ev=(cs.ev||0)+1; const rk=rank[c]; if(rk&&rk<=3)(pl.md=pl.md||[]).push(`${T.y} ${NT_EV[T.k].n} ${rk===1?(medal?'금':'우승'):rk===2?(medal?'은':'준우승'):(medal?'동':'3위')}`); } }
/* 한국 선수 통산 대표 기록(선수 프로필): p.ntcr={ev:[대회], b:{타격}, p:{투구}}.
   예전에는 p.ntc에 두어 트레이드 거부권(p.ntc=계약 끝 연도 숫자)과 칸이 겹쳤다(검수 11-17 #213: 트레이드 정산·새 계약이 통산 기록을 지움, #214: 거부권 선수에서 집계가 멈춰 뒤 선수 기록이 빠짐).
   타격·투구는 따로 쌓는다(#215: 투수 전향 선수의 안타와 피안타가 합쳐지고 모든 경기가 투수로 보임). 선수 하나가 실패해도 다음 선수는 집계한다 */
const NT_BK=['g','pa','ab','h','d','tr','hr','r','rbi','bb','so','sb'], NT_PK=['g','gs','outs','h','er','bb','so','hr','w','l','sv'];
function ntCrAdd(c,S){ if(!S)return; const P=!!S.P, o=P?(c.p||(c.p={})):(c.b||(c.b={})); for(const k of (P?NT_PK:NT_BK))if(typeof S[k]==='number')o[k]=(o[k]||0)+S[k]; }
function ntCareerAdd(T){ if(T.cr)return 0; T.cr=1; const tag=`${T.y} ${NT_EV[T.k].n} ${T.res}`; let n=0;
  for(const key of Object.keys(T.st)){ if(!/^\d+$/.test(key))continue; try{ const p=G.players[+key]; if(!p)continue; const S=T.st[key], c=p.ntcr||(p.ntcr={ev:[]}); if(!Array.isArray(c.ev))c.ev=[];
      ntCrAdd(c,S); if(S.x&&typeof S.x==='object')ntCrAdd(c,S.x); c.ev.push(tag); n++; }catch(err){ (G.flErr=(G.flErr||[]).slice(-9)).push('ntCr:'+key+':'+String(err&&err.message).slice(0,60)); } }
  return n; }
/* 예전 저장 수리(불러오기마다, 두 번 해도 같다): p.ntc가 객체(대표 통산 모양: ev 배열·경기 수)면 p.ntcr로 옮기고 p.ntc는 거부권 숫자만 남긴다.
   예전 모양은 타격·투구가 한 칸에 섞였다: 타격에만 있는 칸(타석·타수·타점…)과 투구에만 있는 칸(아웃·자책·승패…)으로 나누고, 함께 쓰는 칸(경기·안타·볼넷·삼진·홈런)은
   둘 다 있으면 지금 대회(G.nt.tour) 기록으로 그 대회 역할 몫을 떼어 내고 나머지를 다른 역할로 본다. 알 수 없으면 마지막 역할(P) 쪽에 둔다 */
function ntCrFromOld(o,id){ const c={ev:Array.isArray(o.ev)?o.ev.slice():[]}; const has=L=>L.some(k=>(o[k]||0)>0);
  const bOnly=['pa','ab','d','tr','r','rbi','sb'], pOnly=['gs','outs','er','w','l','sv'], sh=['g','h','bb','so','hr'];
  const hb=has(bOnly), hp=has(pOnly); const put=(P,keys,src)=>{ const t=P?(c.p||(c.p={})):(c.b||(c.b={})); for(const k of keys)if(typeof src[k]==='number'&&src[k])t[k]=(t[k]||0)+src[k]; };
  if(hb)put(false,bOnly,o); if(hp)put(true,pOnly,o);
  if(hb&&hp){ const T=G.nt&&G.nt.tour, S=T&&T.done&&T.st&&NT_EV[T.k]&&(o.ev||[]).includes(`${T.y} ${NT_EV[T.k].n} ${T.res}`)&&T.st[id]; /* 그 대회가 통산에 들어간 경우만 */ if(S&&!S.x){ const P=!!S.P, rest={}; for(const k of sh)rest[k]=Math.max(0,(o[k]||0)-(S[k]||0)); put(P,sh,S); put(!P,sh,rest); } else put(!!o.P,sh,o); }
  else put(hp||(!hb&&!!o.P),sh,o);
  if(!c.b&&!c.p&&(o.g||0)>0)put(!!o.P,sh,o); return c; }
function ntCrMerge(c,x){ for(const r of ['b','p'])if(x[r]){ const t=c[r]||(c[r]={}); for(const k in x[r])if(typeof x[r][k]==='number')t[k]=(t[k]||0)+x[r][k]; } c.ev=(c.ev||[]).concat((x.ev||[]).filter(e=>!(c.ev||[]).includes(e))); return c; }
function ntSaveFix(){ if(!G||!G.players)return 0; let n=0;
  for(const p of Object.values(G.players)){ if(!p||p.ntc==null||typeof p.ntc!=='object')continue; const x=ntCrFromOld(p.ntc,p.id); delete p.ntc; p.ntcr=p.ntcr?ntCrMerge(p.ntcr,x):x; n++; }
  /* 예전 대회 기록에 남은 대체 선수(fillB0 등 두 나라가 같은 키를 썼다, #217): 개인 기록이 아니므로 뺀다 */
  for(const T of [G.nt&&G.nt.tour].filter(Boolean))for(const k of Object.keys(T.st||{}))if(String(k).startsWith('fill')){ delete T.st[k]; if(T.sc)delete T.sc[k]; n++; }
  return n; }
/* 대회가 끝나면: 기록실에 남기고(G.ntArc), 활약 선수 인기·우리 팬 여론 */
function ntTourArchive(T,N){ const e=NT_EV[T.k]; const nm=key=>{ if(/^\d+$/.test(String(key))){ const p=G.players[+key]; return p?p.name:''; } if(String(key).startsWith('o')){ const x=(N.ovs||[]).find(o=>'o'+o.id===key); return x?x.name:''; } const pl=ntFindPl(key); return pl?pl.nm:''; };
  const krTop=Object.keys(T.st).filter(k=>/^\d+$/.test(k)||k.startsWith('o')).sort((a,b)=>(T.sc[b]||-99)-(T.sc[a]||-99)).slice(0,3).map(k=>({k,n:nm(k),s:T.st[k]}));
  const A={k:T.k,y:T.y,res:T.res,lv:T.lv,rank:T.rank,mvp:T.mvp,mvpN:T.mvp?nm(T.mvp):'',mvpC:T.mvp?(/^\d+$/.test(T.mvp)||String(T.mvp).startsWith('o')?'KR':String(T.mvp).replace(/\d+$/,'')):'',kmvp:T.krMvp,kmvpN:T.krMvp?nm(T.krMvp):'',top:krTop,ros:N.ids.map(id=>{ const p=G.players[id]; return p?[id,p.name,p.team,posLabel(p)]:null; }).filter(Boolean)};
  (G.ntArc=G.ntArc||[]).push(A); if(G.ntArc.length>40)G.ntArc.shift();
  /* 활약 선수 인기: 점수·메달 크기만큼(최대 +16), 우리 선수가 활약하면 팬 여론 */
  let mineUp=0; for(const x of krTop.concat(Object.keys(T.st).filter(k=>/^\d+$/.test(k)).map(k=>({k}))).filter((v,i,a)=>a.findIndex(y=>y.k===v.k)===i)){ const p=/^\d+$/.test(x.k)?G.players[+x.k]:null; if(!p)continue; const s=T.sc[x.k]||-99; if(s<2)continue;
    const v=Math.round(clamp(s*1.2+(T.lv<=3?4-T.lv:0)*1.5,3,16)); if(!p.hype||p.hype.until<G.day||(p.hype.v||0)<v)p.hype={...(p.hype||{}),v,until:G.day+120,d:G.day,base:(typeof hypeSnap==='function'?hypeSnap(p):null)}; if(p.team===G.user){ mineUp+=v; p.mor=clamp((p.mor??60)+3,0,100); } }
  if(mineUp&&!G.unemp&&G.pr){ G.pr.fan=clamp(G.pr.fan+Math.min(4,Math.round(mineUp/8)),0,100); } }
