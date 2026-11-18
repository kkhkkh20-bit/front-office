/* ===== 해외 진출: 외국인 역수출 · 국내 선수 포스팅/해외 FA · 해외파 추적 ===== */
const MLBT=OVL_C.MLB.map(c=>c[0]+' '+c[1]), NPBT=OVL_C.NPB.map(c=>c[0]+' '+c[1]); /* 해외 구단 이름은 해외 리그 표(35a_ovs_league)와 같게 */
const usd=m=>Math.round(m*USD); // 만 달러 → 게임 금액
const usdKw=m=>{ m=Math.round(m); const e=Math.floor(m/10000), r=m%10000; return `${e?e+'억'+(r?' '+r.toLocaleString('ko-KR')+'만':''):r.toLocaleString('ko-KR')+'만'} 달러(약 ${money(usd(m))})`; }; /* 해외 제안 금액은 원화도 함께(커뮤니티 11-14: 달러만 나와 비교가 어려움) */
function seasonWar(p,y){ const h=seasonTotal(p,y??G.year,'1군'); return h?warOf(h,p):0; }
/* 외국인: 잘하면 MLB·NPB가 데려간다 */
const fOvsLocked=(p,y=G.year)=>{ const C=G.contract; return !!p&&(Math.max(p.fMulti||0,p.fCtY||0,p.fy||0)>y||!!(C&&!C.done&&(C.tid??G.user)===p.team&&C.y+1>y&&C.fre&&C.fre[p.id]&&C.fre[p.id].ok)); }; /* 다음 시즌 계약이 이미 있다 */
function fOverseas(){ for(const p of Object.values(G.players)){ if(!p.foreign||p.team==null||p.joinY>G.year)continue; if(fOvsLocked(p))continue; /* 다음 시즌까지 계약이 남은 외국인(2년 계약 등)은 해외 구단이 데려가지 않는다(사용자 제보 11-14: 2년 재계약 첫해 뒤 NPB행) */ const w=seasonWar(p); if(w<3.5||p.age>=35)continue;
    const mlb=p.foreign==='용병'&&p.age<=32&&w>=5.5&&R()<.35+Math.min(.25,(w-5.5)*.08), npb=!mlb&&R()<(p.foreign==='아시아'?.45:.22)+(w>=5?.2:0); if(!mlb&&!npb)continue;
    const lg=mlb?'MLB':'NPB'; const yrs=mlb?ri(1,2):ri(1,3); const amt=Math.round(mlb?clamp(150+(w-5)*120+N(0,60),120,900):clamp(120+(w-3.5)*90+N(0,40),100,500)); const club=pick(lg==='MLB'?MLBT:NPBT);
    p.ovsOffer={lg,club,yrs,amt,y:G.year};
    if(p.team!==G.user){ fovsAiResolve(p,p.ovsOffer); continue; }
    evNew('fovs',`${p.name}에게 ${lg} 제안`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) 올 시즌 WAR ${w.toFixed(1)}을 기록하자 ${club} 구단(${lg})이 ${yrs}년 총 ${usdKw(amt*yrs)} 수준을 제시했습니다. 에이전트는 국내 잔류도 열어 두었지만 ${lg==='MLB'?'메이저리그 복귀를 원합니다':'조건이 맞으면 일본으로 가겠다고 합니다'}.`,
      [{l:`잔류 설득 (연봉 ${money(fovsKeepSal(p,{amt}))})`,fx:`현재 기분을 기준으로 성공 확률은 약 ${Math.round(fovsKeepOdds(p,lg)*100)}%입니다. 실패하면 연봉 부담 없이 떠납니다. ${p.foreign==='아시아'?`보장 연봉과 인센티브 합계 ${money(asiaReCap(p))}의 개인 상한을 지켜야 합니다.`:`다음 시즌 일반 외국인 ${fMaxYB(p.team,G.year+1)}명 정원과 구단 총액 한도를 지켜야 합니다.`}`},
       {l:'축하하며 보내 준다',fx:'떠납니다. 대체 외국인을 찾아야 합니다.'}],{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id,ks:fovsKeepSal(p,{amt})},def:1,exp:12}); } } /* ks: 버튼에 적은 금액을 그대로 계약한다(그사이 연봉이 바뀌어도: 검수 11-06) */
/* 잔류 설득 성공 확률: 우리 구단(EVH.fovs)과 AI 구단이 같은 식 */
function fovsKeepOdds(p,lg){ return ((lg==='MLB'?.2:.5)+((p.mor??60)-60)/200)*(p.foreign==='아시아'?.5:1); }
/* AI 구단의 설득 판단: 우리와 같은 총액 한도(본인 인센티브 포함)·아시아쿼터 상한 안에서만. 긴축 구단은 연봉이 크게 뛰면 보내고, 유망주 수집 구단은 서른 넘은 선수에게 큰돈을 쓰지 않는다 */
function fovsCapInfo(p,ns,o){ const y=((o&&o.y)??G.year)+1, tid=p.team, own={...p,sal:ns,rsy:(p.rsy||0)+(Math.max(p.fCtY||0,p.fMulti||0)>=y?0:1)}, L=fReRoster(tid,y).filter(q=>q.id!==p.id).concat(own); if(p.foreign==='아시아'){const total=fCommit(own,y),cap=asiaReCap(p);return {ok:total<=cap,tot:total,cap,y};} const c=fYBInfo(tid,L,y); return {...c,ok:!c.over&&!c.mix,y}; }
function fovsAiTry(p,ns,o){ const t=team(p.team); if(!t)return false; const pl=planOf(t); if(!fovsCapInfo(p,ns,o).ok)return false;
  if(pl==='tight'&&ns>p.sal*1.3)return false; if(pl==='build'&&p.age>=31&&ns>p.sal*1.3)return false; if((t.cash||0)<-4000&&ns>p.sal)return false; return true; }
/* 해외 제안의 원 시즌을 기준으로 다음 시즌 계약을 한 번 확정한다. */
/* 마지막에 성립한 잔류 계약을 같은 겨울의 미완료 협상 명단에도 반영한다. */
function fovsContractSync(p,sy){const C=G.contract,k=p&&p.kept,N=p&&C&&C.fre&&C.fre[p.id];if(!p||!k||!C||C.done||(C.tid??G.user)!==p.team||C.y+1!==sy||k.y+1!==sy||p.fCtY<sy||p.sal!==k.sal||(p.fy||0)>=sy||(N&&N.ok&&p.newSal!=null))return 0;const dirty=(C.foreignEnd||[]).includes(p.id)||(C.foreignDrop||[]).includes(p.id)||!!(C.fre&&Object.prototype.hasOwnProperty.call(C.fre,p.id))||!!(C.fneg&&Object.prototype.hasOwnProperty.call(C.fneg,p.id))||p.fleft!=null||p.fInc!=null;if(!dirty)return 0;C.foreignEnd=(C.foreignEnd||[]).filter(id=>id!==p.id);C.foreignDrop=(C.foreignDrop||[]).filter(id=>id!==p.id);if(C.fre)delete C.fre[p.id];if(C.fneg)delete C.fneg[p.id];delete p.fleft;delete p.fInc;delete p.newSal;return 1;}
function fovsKeepCommit(p,ns,o){ const y=(o&&o.y)??G.year, sy=y+1; if(fOvsLocked(p,y))return false; p.kept={y,sal:ns,base:p.sal}; p.sal=ns;p.fCtY=sy;p.rsy=(p.rsy||0)+1;delete p.newSal;delete p.ovsOffer;fovsContractSync(p,sy);return true; }
function fovsDepart(p,o){ delete p.ovsOffer; if(p.fRel)foResRelease(p,p.team);else foResAdd(p,p.team); return ovsLeave(p,o.lg,o.club,o.yrs,o.amt,'외국인'); }
/* AI와 이직 인계는 같은 금액·한도·성공 확률로 기존 제안을 마무리한다. */
function fovsAiResolve(p,o){ const ns=fovsKeepSal(p,o); if(fOvsLocked(p,o.y??G.year)){delete p.ovsOffer;return {stay:true,res:'이미 확정한 국내 계약으로 잔류합니다.'};} let stay=false;if(fovsAiTry(p,ns,o)){stay=R()<fovsKeepOdds(p,o.lg);if(stay)fovsKeepCommit(p,ns,o);} if(stay){wire('외국인',`${tname(p.team)} ${p.name}, ${o.lg} 제안 뿌리치고 잔류`,{tid:p.team,ref:p.id});return {stay:true,res:`연봉 ${money(ns)}에 잔류했습니다.`};}return {stay:false,res:fovsDepart(p,o)}; }
/* 해외 제안을 받은 외국인 잔류 연봉: 버튼 안내와 실제 계약이 같은 계산 */
function fovsKeepSal(p,o){ return p.foreign==='아시아'?Math.max(0,Math.min(asiaReCap(p)-fCommit({...p,sal:0},((o&&o.y)??G.year)+1),round5(p.sal+10*USD))):round5(usd(Math.max(p.sal/USD*1.5,o.amt*.85))); }
EVH.fovs={ pick(e,i){ const p=G.players[e.data.pid];if(!p||!p.ovsOffer)return '';const o=p.ovsOffer;if(fOvsLocked(p,o.y??G.year)){delete p.ovsOffer;return '이미 확정한 국내 계약으로 잔류합니다.';}
    if(i===0){const ns=e.data.ks??fovsKeepSal(p,o),c=fovsCapInfo(p,ns,o);if(!c.ok)return `${c.mix?c.mix+'. 구성 규정에 맞지 않아':(p.foreign==='아시아'?'아시아쿼터 보장·인센티브':'외국인 연봉 총액')+' 한도('+money(c.cap)+')를 넘어'} 설득할 수 없습니다. ${fovsDepart(p,o)}`;
      const ok=R()<fovsKeepOdds(p,o.lg);if(ok){fovsKeepCommit(p,ns,o);news('선수',`${p.name}, ${o.lg} 제안 뿌리치고 잔류`,`${tshort(p.team)}이(가) 연봉 ${money(ns)}에 붙잡았습니다.`,2,{ref:p.id});return `설득 성공. 연봉 ${money(ns)}.`;}return `설득에 실패했습니다. ${fovsDepart(p,o)}`; }
    return fovsDepart(p,o); } };
/* 옛 잔류 성공은 계약 연도를 복원하고, 떠난 단장 앞으로 남은 제안은 후임이 결정한다. 이직으로 추가된 판단은 별도 난수로 실행한다. */
function fovsHandOff(tid){ let n=0;for(const p of Object.values(G.players)){if(!p.foreign||p.team!==tid||!p.ovsOffer)continue;const o=p.ovsOffer,r=withRng(rngHash('fovs-handoff',tid,p.id,o.y??G.year),()=>fovsAiResolve(p,o));n++;for(const e of (G.evs||[])){if(e.k!=='fovs'||!e.data||e.data.pid!==p.id||e.fovsDone)continue;e.done=true;e.auto=true;e.pick=r.stay?0:1;e.res=r.res;e.fovsDone=1;const m=(G.mail||[]).find(x=>x.id===e.mid);if(m){m.acts=[];m.read=true;m.imp=false;m.body+='\n\n[결정] 후임 단장 인계\n'+r.res;}G.stops=(G.stops||[]).filter(x=>x.id!==e.mid);G.evlog=G.evlog||[];if(!G.evlog.some(x=>x.id===e.id))G.evlog.unshift({id:e.id,y:G.year,d:G.day,t:e.title,k:e.k,c:r.stay?'후임 단장 잔류 결정':'후임 단장 해외 이적 결정',r:r.res,auto:true});}}if((G.evlog||[]).length>80)G.evlog.length=80;return n; }
function fovsMigrate(){if(!G||!G.players)return 0;let n=0;for(const p of Object.values(G.players)){const k=p.kept;if(!p.foreign||p.team==null||!k||!Number.isFinite(k.y)||k.y<G.year-1||k.y>G.year||k.sal!==p.sal)continue;const sy=k.y+1,C=G.contract,N=C&&C.fre&&C.fre[p.id],newer=C&&!C.done&&(C.tid??G.user)===p.team&&C.y+1===sy&&N&&N.ok&&p.newSal!=null;if(newer)continue;if(Math.max(p.fCtY||0,p.fMulti||0,p.fy||0)<sy){p.fCtY=sy;p.rsy=(p.rsy||0)+1;delete p.newSal;n++;}n+=fovsContractSync(p,sy);}const tids=new Set(Object.values(G.players).filter(p=>p.foreign&&p.team!=null&&p.team!==ME()&&p.ovsOffer).map(p=>p.team));for(const tid of tids)n+=fovsHandOff(tid);return n; }

/* 해외파 보관본: KBO 경기 단위 기록(경기 로그·타구 분포·맞대결·최근 10경기)은 그 해 국내 기록이라 빼고 남긴다(해외 활성화 2-1: 해외 국내 선수가 늘어 저장 크기가 커졌다. 한 명 약 11KB → 3KB) */
const OVS_PJ_DROP=['gl','spr','sprP','vs','l10','obsView','obsBy']; /* 해외 활성화 5: 아마추어 관찰 사본(obsView·obsBy, 직행 선수 한 명 약 12KB)도 뺀다. 프로 선수에게는 쓰지 않는다 */
const ovsPj=p=>{ const o=Object.assign({},p); for(const k of OVS_PJ_DROP)delete o[k]; return JSON.stringify(o); };
/* 떠나는 선수를 해외파 명단으로 옮긴다 (국내 선수는 나중에 돌아올 수 있다) */
function ovsLeave(p,lg,club,yrs,amt,how,fee){ const from=p.team??p.faFrom; G.abroad=G.abroad||[]; termsClear(p); delete p.newSal; delete p.hold; delete p.extNext; /* 출국 전 맺어 둔 다음 시즌 계약도 끝(복귀 계약과 겹치지 않게, 검수 11-07) */ mvLog('해외 진출',p,from,null,`${how} · ${club}(${lg}) ${yrs}년 총 ${usdKw(amt*yrs)}${fee?' · 포스팅 비용 '+money(fee):''}`); /* 이적 기록을 먼저: 복귀용 보관본에 출국일이 남게(검수 11-07) */ /* 출국 전 미확정 연봉 산정안은 보관본에 남기지 않는다(검수 11-06: 복귀 계약 뒤 옛 산정안이 되살아났다) */ if(!p.foreign)p.ovsY=G.year; p.e1=false; /* 해외로 가면 국내 1군 등록도 끝난다(복귀 계약에 따라오지 않게, 검수 11-06) */ /* 해외 진출 이력: 돌아온 뒤 다시 포스팅 대상이 되지 않게 */ /* 해외로 가면 국내 계약 조건은 끝난다(돌아와도 되살아나지 않게) */
  const rec={id:p.id,name:p.name,isP:p.isP,pos:posLabel(p),foreign:p.foreign||null,from,lg,club,how,yrs,amt,y:G.year,y1:dobj(G.day).m>=9||(how==='고교 직행'||how==='대졸 직행')?G.year+1:G.year, /* 고교 직행은 졸업 뒤 다음 해부터(검수 11-09c) */age:p.age,lines:[],fee:fee||0,back:false,d:G.day, /* y1: 첫 해외 시즌(국내 시즌을 마치고 가을·겨울에 떠나면 다음 해부터) */pj:p.foreign?null:ovsPj(p),ci:ovlIdx(lg,club)};
  if(p.foreign)rec.fr=ovsSlim(p); /* 외국인은 원본이 지워지므로 기록용 최소 사본(능력치·보직)만 남긴다 */
  rec.gmK=from===G.user&&!G.unemp?legMeK():null; /* 같은 날 세대가 바뀌어도 출국을 결정한 단장 개인에게 남긴다. AI가 보낸 기록도 구분한다(검수 11-18 #580). */
  G.abroad.unshift(rec); ovsTrackMigrate(rec); ovsTrim(); /* 재출국도 같은 ID의 과거 해외 기록을 합친 뒤 한도를 정리한다. 넘치면 이미 돌아온 기록부터 지운다(아직 해외에 있는 선수가 사라지지 않게) */
  for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; if(G.fa&&G.fa.pool)G.fa.pool=G.fa.pool.filter(x=>x!==p.id); dropP(p.id);
  const t=`${p.name}, ${club} 구단(${lg})과 ${yrs}년 계약${how==='포스팅'?` · 포스팅 비용 ${money(fee)}`:''}`; wire(lg==='MLB'?'해외':'해외',t,{tid:from});
  try{ featAdd('ovs',null,`${p.name} ${how==='외국인'?'역수출':'해외 진출'} · ${club}(${lg}) ${yrs}년 ${usdKw(amt*yrs)}`,{tid:from,name:p.name,maj:lg==='MLB'}); }catch(e){}
  if(from===G.user&&how==='포스팅'){ try{ story(p,`${club}(${lg}) 입단 · 포스팅`,'move'); G.pr.fan=clamp(G.pr.fan+1,0,100); news('선수',`${p.name} 고별 기자회견 "이 유니폼이 나를 키웠다"`,`${p.name}이(가) ${tshort(from)} 팬들에게 작별 인사를 했습니다. "언젠가 다시 이 구장에 서겠다"는 말에 박수가 쏟아졌습니다.`,2,{}); }catch(e){} }
  if(from===G.user){ news('선수',`${p.name}, ${lg} 진출 확정`,`${club} 구단과 ${yrs}년 총 ${usdKw(amt*yrs)}에 계약했습니다.${fee?` 구단은 포스팅 비용 ${money(fee)}을 받습니다.`:''}`,1,{fanW:.5}); }
  return `${p.name}이(가) ${club}(${lg})로 떠납니다.`; }
/* 국내 선수의 메이저리그 꿈: 야망 + 활약 + 언론 */
function mlbOf(p){ if(p.mlb==null){ initPers(p); p.mlb=clamp(Math.round((p.pers.amb-4)*3+N(0,10)),0,70); } return p.mlb; }
function mlbHype(){ if(period()!=='season'||G.day<G.cal.open+30)return; const cands=[]; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||milServing(p)||p.age>31||ovr(p)<POST_T.o+1)continue; const h=seasonTotal(p,G.year,'1군'); if(!h||(p.isP?h.outs<120:h.pa<150))continue; const w=warOf(h,p); if(w<2.5)continue; cands.push({p,w}); }
  if(!cands.length||R()>.45)return; cands.sort((a,b)=>b.w-a.w); const mine=cands.filter(x=>x.p.team===G.user); const x=mine.length&&R()<.5?mine[0]:pick(cands.slice(0,5)); const p=x.p; mlbOf(p);
  if(p.hyp&&p.hyp>G.day-30)return; p.hyp=G.day; const d=ri(4,9); p.mlb=clamp(p.mlb+d,0,100);
  const T=[`메이저리그 스카우트 ${ri(4,12)}명, ${p.name} 경기에 집결`,`"${p.name}, 지금 당장 메이저리그 통한다" 현지 전문가 평가`,`${p.name} 측 "해외 진출, 언젠가는 도전하고 싶다"`,`${p.name}, 일본 구단도 영입 리스트에`];
  news('언론',pick(T),`${posLabel(p)} ${p.name}의 활약에 해외 구단들의 관심이 커지고 있습니다. 서비스 연차 ${p.svc}년${ovsBeen(p)?'이지만 해외 진출 이력이 있어 포스팅 대상이 아닙니다':p.svc>=7?(postDone(p)?'이고 FA 계약 이력이 있어 선수가 먼저 포스팅을 요청할 수는 없지만, 구단이 동의하면 포스팅할 수 있습니다':'으로 포스팅 자격이 있습니다'):`, 포스팅 자격(7년)까지 ${7-p.svc}년 남았습니다`}.`,p.team===G.user?0:0,{ref:p.id});
  if(p.team===G.user)p.mor=clamp((p.mor??60)+1,0,100); }
/* 비시즌: 포스팅 요청 */
const ovsBeen=p=>p.ovsY!=null||p.retFrom!=null||(G.abroad||[]).some(a=>a.id===p.id); /* 해외 이력: 구단 주도 포스팅도 막힌다(postGMWhy) */
const postDone=p=>!!((p.faC&&!p.ext)||p.faN||p.lastFA!=null||p.ovsY!=null||p.retFrom!=null||(G.abroad||[]).some(a=>a.id===p.id));
function postWindowWhy(){return G.rolled===G.year&&G.day>=KD(11,1)&&G.day<=KD(12,5)?'':'포스팅은 11월 1일부터 12월 5일까지 신청할 수 있습니다(리그 규약).';}
function postMovedAfter(p,d){return (p.tLog||[]).some(m=>m.d>=d&&m.f!==m.t)||(G.moves||[]).some(m=>m.pid===p.id&&m.d>=d&&m.from!==m.to);}
function postSame(p,x){if(!p||p.team!==x.tid)return false;if(x.st!=null)return x.st===(p.postStint||0);return !postMovedAfter(p,x.d??(x.day>KD(12,12)?x.day-20:KD(11,1)));}
function postApplied(p){return (G.posting||[]).some(x=>x.pid===p.id&&x.y===G.year&&!x.void&&postSame(p,x));}
function postCloseRequest(e,text){e.done=true;e.res=text;const m=(G.mail||[]).find(m=>m.id===e.mid);if(m){m.acts=[];m.read=true;m.imp=false;m.closed={label:'요청 종료',text};m.body=(m.body||'')+'\n\n[종료] '+text;}G.stops=(G.stops||[]).filter(m=>m.id!==e.mid);}
function postRequestStale(e,p){const d=e.data||{};if(!p||p.team!==(d.tid??e.pt??G.user)||d.y!=null&&d.y!==G.year)return true;if(d.st!=null)return d.st!==(p.postStint||0);return e.day!=null&&postMovedAfter(p,e.day);}
function postFix(){let n=0;for(const x of G.posting||[]){if(x.done||x.void)continue;const p=G.players[x.pid];if(!postSame(p,x)){x.done=true;x.void=true;x.res='취소';x.why='신청 뒤 소속이 바뀌어 무효가 됐습니다.';n++;}else if(x.st==null){x.st=p.postStint||0;n++;}}for(const e of G.evs||[])if(e.k==='post'&&!e.done){const p=G.players[e.data?.pid];if(postRequestStale(e,p)){e.void=true;postCloseRequest(e,'선수 소속이 바뀌어 포스팅 요청이 끝났습니다.');n++;}else if(e.data.st==null){e.data.st=p.postStint||0;e.data.tid=p.team;e.data.y=G.year;n++;}}return n;}
function postMove(p,from,to){if(!p||(from??null)===(to??null)||p.foreign)return;p.postStint=(p.postStint||0)+1;for(const x of G.posting||[])if(x.pid===p.id&&!x.done&&!x.void){x.done=true;x.void=true;x.res='취소';x.why='신청 뒤 소속이 바뀌어 무효가 됐습니다.';}for(const e of G.evs||[])if(e.k==='post'&&!e.done&&e.data?.pid===p.id){e.void=true;postCloseRequest(e,'선수가 구단을 떠나 포스팅 요청이 끝났습니다.');}if(p.postPromise&&(p.postPromiseT==null||p.postPromiseT!==to)){delete p.postPromise;delete p.postPromiseT;}}
function postApplyWhy(p,tid){if(!p||p.team!==tid||p.foreign)return '소속 국내 선수만 신청할 수 있습니다.';const window=postWindowWhy();if(window)return window;if(milServing(p))return '군 복무 중에는 해외에 나갈 수 없습니다.';if(ovsBeen(p))return '해외에 다녀온 선수는 포스팅 대상이 아닙니다.';if((p.svc||0)<7)return `서비스 7년이 지나야 포스팅할 수 있습니다(지금 ${p.svc||0}년).`;const A=ovsAgeT(p.age);if(!A.m&&!A.n)return '현재 나이에는 MLB·NPB 구단의 포스팅 응찰 가능성이 없습니다.';if(postApplied(p))return '이미 포스팅을 신청했습니다.';return '';}
function postingSeason(){ G.posting=G.posting||[]; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.joinY>G.year||milServing(p))continue; /* 군 복무 중에는 해외에 나갈 수 없다(검수 11-06) */ if(p.postPromise&&p.postPromiseT!=null&&p.postPromiseT!==p.team){ delete p.postPromise; delete p.postPromiseT; } /* 약속은 약속한 구단만 지킨다(이적하면 끝). 자격 검사보다 먼저 지운다(검수 11-06) */ if(postDone(p))continue; /* KBO 포스팅은 FA 자격 전 보류 선수만: FA 계약을 한 적 있거나 해외에 다녀온 선수는 대상 아님(비FA 다년계약 ext는 FA 이력이 아님) */ if(p.faC&&p.yrs>1&&p.postPromise!==G.year&&!(p.ext&&postStar(p)>0))continue; /* 빅리그급 스타는 비FA 다년계약 중에도 요청한다(사용자 11-17: 송성문 2025년 8월 6년 계약 뒤 그해 겨울 포스팅). 허락은 구단 몫: 남은 계약이 길면 AI도 '1년 뒤 약속'을 고를 수 있다 */ /* 포스팅을 약속한 해에는 다년계약을 맺었어도 약속을 확인한다(조용히 넘어가지 않게) */ if(p.postPromise!==G.year&&(p.svc<7||p.age>32||ovr(p)<POST_T.o))continue; mlbOf(p);
    const retry=p.postRetry===G.year&&!(p.postRetryT!=null&&p.postRetryT!==p.team); const want=postWant(p)||(p.postPromise===G.year)||retry; if(!want)continue; /* 해외 활성화 5: 지난해 포스팅이 무산된 선수는 이듬해 한 번 다시 도전한다(우리·AI 같은 규칙) */ if(postApplied(p))continue;
    if(p.team!==G.user||G.unemp){ const k=aiPostDecide(p); if(k==='allow'){if(!postApplyWhy(p,p.team))postStart(p);} else if(k==='promise'){ p.postPromise=G.year+1; p.postPromiseT=p.team; p.mor=clamp((p.mor??60)+3,0,100); } /* 우리 '1년 뒤 약속'과 같은 효과 */ continue; }
    const promised=p.postPromise===G.year; const asked=(p.postAsk||0);
    evNew('post',`${p.name} 포스팅 요청`,`${p.name}(${posLabel(p)}, ${p.age}세, 서비스 ${p.svc}년)이(가) 메이저리그 도전을 위해 포스팅을 요청했습니다.${promised?' 지난해 "1년 뒤 보내 주겠다"고 약속했습니다.':asked?` 작년에도 요청했다가 거절당했습니다(${asked}회).`:retry?' 지난해 포스팅이 무산됐지만 한 번 더 도전하고 싶다고 합니다.':''} 언론은 연일 해외 진출 가능성을 다루고 있습니다. ${postEstTxt(postEst(p))}`,
      [{l:'포스팅 허락',fx:`${dmd(postDay())}에 결과가 나옵니다.`+' 계약이 성사되면 포스팅 비용(계약 보장액의 약 20%)을 받고 선수는 떠납니다. 무산되면 남습니다.'},
       {l:'1년 뒤 보내 주겠다고 약속',fx:'기분이 조금 오르고 올해는 남습니다. 내년에 약속을 어기면 크게 실망하고 팬·언론도 비판합니다.'},
       {l:'거절',fx:`기분이 크게 떨어집니다${asked?' (두 번째 거절이라 더 크게)':''}. 팬 여론은 갈리고 언론은 비판적입니다.`}],{ref:p.id,face:p.id,from:p.name,data:{pid:p.id,promised,day:postDay(),tid:p.team,st:p.postStint||0,y:G.year} /* 안내한 발표일 그대로(검수 11-07) */,def:promised||aiPostDecide(p)==='allow'?0:1,exp:12}); } } /* 답하지 않으면 AI 구단과 같은 기준으로 처리(해외 활성화 2-1: 예전 기본안은 거절) */
EVH.post={can(e,i){const p=G.players[e.data.pid];if(postRequestStale(e,p))return '선수 소속이 바뀌어 이 요청은 적용할 수 없습니다.';return i===0?postApplyWhy(p,G.user):'';},pick(e,i){ const p=G.players[e.data.pid]; if(!p)return ''; if(p.team!==G.user||G.unemp||postRequestStale(e,p))return `${p.name}은(는) 이제 이 요청의 대상 선수가 아닙니다.`; prInit(); if(postApplied(p))return `${p.name}은(는) 이미 포스팅을 신청했습니다. 이 요청은 정리합니다.`; /* 같은 시즌 이중 신청·신청 뒤 거절 페널티 방지(검수 11-08) */
    if(i===0&&milServing(p))return `${p.name}은(는) 군 복무 중이라 포스팅할 수 없습니다.`;
    if(i===0){const why=postApplyWhy(p,G.user);if(why)return why;const x=postStart(p,e.data.day); return `${p.name} 포스팅을 신청했습니다. ${dmd(x.day)}에 결과가 나옵니다.`; }
    if(i===1){ if(e.data.promised){ postPromMem(p,false); p.mor=clamp((p.mor??60)-25,0,100); G.pr.fan=clamp(G.pr.fan-3,0,100); G.pr.press=clamp(G.pr.press-4,0,100); news('언론',`${tshort(G.user)}, ${p.name}과의 약속 또 미뤄`,'약속을 어겼다는 비판이 나옵니다.',-3,{ref:p.id}); p.postPromise=G.year+1; p.postPromiseT=p.team; return '약속을 또 미뤘습니다(내년으로 다시 약속). 기분 크게 하락, 팬 여론 악화, 언론 악화.'; } /* 약속 연도도 갱신(검수 11-08) */
      p.postPromise=G.year+1; p.postPromiseT=p.team; p.mor=clamp((p.mor??60)+3,0,100); return `${p.name}에게 내년 포스팅을 약속했습니다. 기분 상승.`; }
    if(e.data.promised)postPromMem(p,false); p.postAsk=(p.postAsk||0)+1; const d=e.data.promised?28:p.postAsk>=2?20:14; p.mor=clamp((p.mor??60)-d,0,100); G.pr.press=clamp(G.pr.press-(e.data.promised?5:2),0,100); G.pr.fan=clamp(G.pr.fan-(e.data.promised?3:0),0,100);
    news('언론',`${tshort(G.user)}, ${p.name} 포스팅 불허`,e.data.promised?'약속을 뒤집었다는 비판이 거셉니다.':'구단은 전력 유지를 택했습니다.',e.data.promised?-3:-1,{ref:p.id}); return `포스팅을 거절했습니다. 기분 하락.`; } };
/* AI 구단의 포스팅 판단(사용자 11-16: AI도 유저처럼. 예전: 리빌딩 75%·그 밖 50% 무작위 허락, 거절해도 아무 대가 없음).
   사람 단장처럼 본다: 약속한 해에는 지킨다. 계약으로 묶어 둘 해가 1년 이하면(곧 FA로 공짜로 잃는다) 포스팅 비용을 받고 보낸다.
   2년 넘게 남은 주전을 우승·내년 도전 구단이 원하면 '1년 뒤'를 약속하고 남긴다(우리 선택지와 같은 효과). 그 밖에는 허락한다 */
/* 포스팅 약속을 지켰나(계약 2단계 에이전트 기억): 담당 에이전트가 그 구단과의 일로 기억한다. 어기면 친분 -3과 불만(약속) */
function postPromMem(p,kept){ try{ const ag=agentOf(p); if(!kept)grvAdd(p,'prom',5); if(!ag||p.team==null)return; agRelAdd(ag,kept?1:-3,`${p.name} 포스팅 약속 ${kept?'이행':'불이행'}`,p.team); agMemSet(ag,p.team,kept?'kept':'broke',p.id); }catch(e){} }
function aiPostDecide(p){ if(p.postPromise===G.year)return 'allow'; const t=team(p.team); if(!t)return 'allow'; const pl=planOf(t)||'next';
  let ny=1; try{ ny=ctrlYears(p); }catch(e){} if(ny<=1||pl==='build'||pl==='tight')return 'allow';
  let reg=false; try{ reg=isRegular(p); }catch(e){} if(reg&&(pl==='win'||pl==='next'||pl==='star')){ if(ny<=2){ const E=postEst(p); if(E.fee[0]+E.fee[1]>=2*POST_T.feeSell)return 'allow'; } return 'promise'; } return 'allow'; } /* 2년 뒤면 FA로 잃을 주전은 포스팅 비용 예상(2-3)이 크면 우승 도전 구단도 보낸다: 우리 화면과 같은 예상치 */
function postDay(){ return Math.max(G.day+20,KD(12,12)); } /* 결과 발표일: 안내 문구와 실제 처리일이 같은 계산 */
function postStart(p,day){ G.posting=G.posting||[];const promise=p.postPromise===G.year&&(p.postPromiseT==null||p.postPromiseT===p.team);if(promise)postPromMem(p,true);const rt=p.postRetry===G.year?1:0; delete p.postRetry; delete p.postRetryT; const x={pid:p.id,y:G.year,tid:p.team,d:G.day,mv:G.mvN||0,st:p.postStint||0,rt,day:day!=null&&day>G.day?day:postDay(), /* 요청 때 안내한 발표일(검수 11-07) */done:false}; G.posting.push(x);for(const e of G.evs||[])if(e.k==='post'&&!e.done&&e.data?.pid===p.id)postCloseRequest(e,'포스팅 신청이 완료돼 이 요청을 정리했습니다.');wire('해외',`${tname(p.team)} ${p.name}, 포스팅 신청`,{tid:p.team,ref:p.id}); if(p.team===G.user&&!G.unemp)news('선수',`${p.name}, 메이저리그 도전 공식화 · 포스팅 공시`,`${tname(p.team)}이(가) ${p.name}의 포스팅을 신청했습니다. 공시 뒤 협상 기간이 열리고 ${dmd(x.day)}에 결과가 나옵니다. 팬들은 아쉬움과 응원을 함께 보내고 있습니다.`,1,{ref:p.id}); delete p.postPromise; delete p.postPromiseT; return x; }
/* 포스팅 기준(해외 활성화 2-1). 실제: KBO 포스팅은 해마다 0~2명(2020 김하성·나성범, 2023 이정후·고우석, 2024 김혜성, 2025 송성문), 해외 FA까지 합쳐 성사는 해마다 1명 안팎.
   예전 문턱(국내 능력 60)은 창단 직후 국내 선수 580명 중 5명이라 4시즌에 포스팅이 1번이었다. 56은 상위 약 18명(김혜성·고우석급 포함). MLB 응찰 확률·연봉은 2020~2025 계약에 맞춘 추정(불확실) */
const POST_T={o:56,feeSell:300}; /* feeSell: 포스팅 비용 예상(만 달러)이 이만큼이면 우승 도전 구단도 보낸다 */
const postPm=o=>o>=66?.9:o>=62?.8:o>=59?.55:o>=57?.25:.1; /* MLB 구단이 계약을 내밀 확률. 11-17: 62~65 70→80%, 59~61 45→55%(김혜성·송성문급 포스팅이 빅리그 계약을 받는 실제 흐름. MLB 국내 선수 3~5명) */
const postAmt0=o=>350+(o-58)*140; /* MLB 보장 연봉 중심(만 달러): 58 약 350(김혜성 3년 1250), 62 약 900(김하성 4년 2800), 67 약 1600(이정후 6년 1억1300) */
const postYrs=o=>o>=66?[4,6]:o>=62?[2,4]:[1,3];
/* 선수가 포스팅을 원하는가: 메이저리그 의지에 MLB가 원할 만한 실력이 더해진다(잘할수록 덜 망설인다). 우리와 AI 구단 선수가 같은 기준 */
const postPull=p=>clamp((ovr(p)-POST_T.o)*4,0,32); /* 해외 구단이 부르는 만큼 커지는 마음(국내 능력 56부터, 64면 +32) */
/* 빅리그급 스타(국내 능력 60부터, 65면 최대)는 의지가 크지 않아도 도전을 원한다(사용자 11-17: MLB 국내 선수 3~5명. 실제로 이정후·김하성·김혜성·고우석·송성문은 자격이 되자 모두 포스팅을 요청했다). 59 이하는 예전과 같다. 우리와 AI 구단 선수가 같은 식.
   측정(씨앗 5·7·11·23, 2026~2029): 62부터 주면 포스팅이 해마다 0.75건(실제 1~3건)이라 60부터로 내렸다 */
const postStar=p=>clamp((ovr(p)-59)*5,0,30);
function postWant(p){ return mlbOf(p)+postPull(p)+postStar(p)>=52; }
/* 포스팅 예상(해외 활성화 2-3): 실제 결과 식(postPm·postAmt0·postYrs·ovsAgeT)의 기대 범위. 미국 스카우트가 보는 능력에 공개 오차(선수·해마다 고정)를 얹어 우리와 AI 구단이 같은 값을 본다.
   n: 관심 구단 수 범위, amt: 보장 연봉 범위(만 달러), yrs: 기간 범위, fee: 포스팅 비용 범위(만 달러), lv: 관심 정도 */
function postEst(p){ const o=ovr(p)+hn('post'+G.year,p.id)*1.2, A=ovsAgeT(p.age), pM=postPm(o)*A.m, Y=postYrs(o).map(y=>Math.min(A.y,y));if(!A.m&&!A.n)return {pM:0,n:[0,0],amt:[0,0],yrs:[0,0],fee:[0,0],lv:'없음',none:true};
  const a0=postAmt0(o)*A.f, amt=[Math.round(clamp(a0-130,100,2500)/10)*10,Math.round(clamp(a0+130,100,2500)/10)*10];
  const n=pM>=.8?[4,8]:pM>=.6?[2,5]:pM>=.4?[1,3]:pM>=.2?[0,2]:[0,1];
  return {pM,n,amt,yrs:Y,fee:[postFee(amt[0]*Y[0]),postFee(amt[1]*Y[1])],lv:pM>=.6?'높음':pM>=.4?'보통':pM>=.2?'낮음':'거의 없음'}; }
const postUsd=(a,b)=>{ const f=m=>{ m=Math.round(m/10)*10; return m>=10000?`${Math.floor(m/10000)}억${m%10000?' '+(m%10000).toLocaleString('ko-KR')+'만':''}`:m.toLocaleString('ko-KR')+'만'; }; return `${f(a)}~${f(b)} 달러`; }; /* 예상 범위(만 달러): 870만~1,400만 달러 */
function postEstTxt(E){if(E?.none)return '스카우트 예상: 현재 나이에는 MLB·NPB 응찰 가능성이 없어 계약 예상액을 산정하지 않습니다.';return E?`스카우트 예상: MLB 관심 ${E.lv}(${E.n[0]}~${E.n[1]}개 구단) · 보장 연 ${postUsd(E.amt[0],E.amt[1])} · ${E.yrs[0]===E.yrs[1]?E.yrs[0]:E.yrs[0]+'~'+E.yrs[1]}년 · 포스팅 비용 약 ${postUsd(E.fee[0],E.fee[1])}.`:''; }
/* 포스팅 결과: 능력이 높을수록 MLB 계약 가능성이 크다 */
function postFee(amtTot){ const a=amtTot; const f=Math.min(a,2500)*.2+Math.max(0,Math.min(a,5000)-2500)*.175+Math.max(0,a-5000)*.15; return Math.round(f); }
/* 해외 복귀 협상 정리: 우리 구단 몫이 아니거나(이직·야인) 결정할 이벤트가 없이 기한이 지난 선수는 원소속 구단(AI) 판단으로 끝낸다(예전에 꼬여 저장된 선수 복구 포함) */
function ovsBackSweep(){ ovsBackStateFix(); for(const p of Object.values(G.players)){ if(!ovsBackReady(p))continue; if(p.retFrom!==G.user||G.unemp)ovsBackAI(p); } }
function ovsDaily(){try{postFix();}catch(e){}try{ ovsBackSweep(); }catch(e){} if(!G.ovl||OVL_LGS.some(l=>!G.ovl[l]))try{ ovlInit(); }catch(e){} /* 예전 저장: 해외 리그는 다음 날짜 진행 때 만든다(불러오기만으로 난수를 쓰지 않게) */ for(const x of G.posting||[]){ if(x.done||G.day<x.day)continue; x.done=true; const p=G.players[x.pid]; if(!p||!postSame(p,x)||milServing(p)){ x.res='취소'; x.void=true; if(p&&x.tid===G.user&&!G.unemp)note('운영팀',`${p.name}의 포스팅 신청이 ${p.team!==x.tid?`${tname(p.team)}(으)로 옮겨`:'군 복무로'} 무효가 됐습니다.`,p.id); continue; } /* 신청 뒤 이적·이탈: 신청 무효(새 구단이 다시 신청할 수 있게) */ const o=ovr(p);
    const pm=postPm(o);
    /* 제안 목록: MLB·NPB 구단별 기간·연봉(만 달러). 선수는 MLB 꿈(mlb)과 금액을 보고 고르거나 모두 거절한다(커뮤니티 요청 11-07: 금액·거절 사유·리그를 보여 달라) */
    const A=ovsAgeT(p.age); const offs=[]; { const nM=R()<pm*A.m?1+(R()<pm*.6?1:0)+(R()<pm*.3?1:0):0, nN=R()<(o>=POST_T.o+1?.45:.15)*A.n?1+(R()<.3?1:0):0; const used=new Set(); const club=L=>{ let c; do c=pick(L); while(used.has(c)&&used.size<L.length); used.add(c); return c; };
      for(let i=0;i<nM;i++){ const Y=postYrs(o); const yrs=Math.min(A.y,ri(Y[0],Y[1])); offs.push({lg:'MLB',club:club(MLBT),yrs,amt:Math.round(clamp((postAmt0(o)+N(0,80))*A.f,100,2500)),minor:(o<POST_T.o+3||p.age>=34)&&R()<.5}); }
      for(let i=0;i<nN;i++)offs.push({lg:'NPB',club:club(NPBT),yrs:Math.min(A.y,ri(2,3)),amt:Math.round(clamp(((o-55)*45+N(0,30))*(p.age>=34?.8:1),80,600))}); }
    const want=mlbOf(p); const ask=Math.round(clamp((o-58)*60*A.f,100,1500)); /* MLB 최소 기대 연봉(나이만큼 눈높이도 낮다) */
    const score=f=>f.amt*f.yrs*(f.lg==='MLB'?1+want/50:1)*(f.minor?.5:1);
    const okF=offs.filter(f=>f.lg==='MLB'?(!f.minor||want>=45)&&f.amt>=ask*(want>=50?.5:.8):want<45).sort((a,b)=>score(b)-score(a)); const best=okF[0]||null;
    const offTxt=offs.length?offs.map(f=>`${f.lg} ${f.club}: ${f.yrs}년 연 ${usdKw(f.amt)}${f.minor?'(스플릿·마이너 계약)':''}`).join('\n'):'제안 없음';
    const why=!offs.length?'계약을 제시한 구단이 없었습니다.':best?'':offs.every(f=>f.lg==='NPB')?`MLB 제안이 없었고, 선수가 일본행은 원하지 않아(메이저리그 의지 ${want}) NPB 제안을 거절했습니다.`:offs.some(f=>f.lg==='MLB'&&f.minor)&&!offs.some(f=>f.lg==='MLB'&&!f.minor)?'MLB 제안이 마이너 계약(스플릿)뿐이라 선수가 거절했습니다.':`제안 금액이 선수 기대(연 ${usdKw(ask)} 이상)에 못 미쳐 선수가 거절했습니다.`;
    x.offs=offs; x.why=why;
    if(!best){ x.res=offs.length?'선수 거절':'무산'; if(!x.rt){ p.postRetry=G.year+1; p.postRetryT=x.tid; } /* 해외 활성화 5: 처음 무산된 선수는 이듬해 다시 요청한다(재도전도 무산되면 끝) */ p.mor=clamp((p.mor??60)-(offs.length?2:5),0,100); p.mlb=clamp(p.mlb-15,0,100); wire('해외',`${p.name} 포스팅 ${offs.length?'선수가 제안 거절':'무산'}, ${tshort(x.tid)} 잔류`,{tid:x.tid,ref:p.id}); if(x.tid===G.user)mail('운영팀',`${p.name} 포스팅 ${offs.length?'결과: 선수가 제안을 모두 거절':'무산'}`,`${why}\n\n받은 제안:\n${offTxt}\n\n선수는 우리 구단에 남습니다. 기분이 ${offs.length?'조금':'꽤'} 상했습니다.`,{kind:'해외',ref:p.id}); continue; }
    const lg=best.lg, yrs=best.yrs, amt=best.amt; const fee=usd(postFee(amt*yrs)); x.res=lg; x.club=best.club;
    if(x.tid===G.user&&!G.unemp)mail('운영팀',`${p.name} 포스팅 결과: ${lg} ${best.club} 선택`,`받은 제안:\n${offTxt}\n\n${p.name}은(는) ${best.club}(${lg})의 ${yrs}년 연 ${usdKw(amt)} 제안을 골랐습니다${lg==='MLB'&&want>=50?'(메이저리그 의지가 강해 금액보다 리그를 먼저 봤습니다)':''}. 구단은 포스팅 비용 ${money(fee)}을 받습니다.`,{kind:'해외',ref:p.id});
    if(x.tid===G.user&&!G.unemp){ G.ovsIncome=(G.ovsIncome||0)+fee; G.spend.postIn=(G.spend.postIn||0)+fee; note('재정',`${p.name} 포스팅 비용 ${money(fee)}은 이번 결산 때 '포스팅 수입'으로 들어옵니다(지금 현금에는 바로 더해지지 않음). 재정 > 예산에서 확인할 수 있습니다.`,p.id); } /* 카페 문의: 안내가 없어 안 들어온 줄 앎 */ else team(x.tid).cash+=fee; /* 우리 구단 포스팅 수입은 그 시즌 결산(재정 화면 '포스팅 수입' 줄)으로 들어간다 */
    ovsLeave(p,lg,best.club,yrs,amt,'포스팅',fee); } }
/* 나이별 해외 계약(카페 11-09c: 38세가 MLB 4년 3천만 달러). 실제 사례 기준: 20대 중반 최대 6년, 29세 4년, 31세 2년, 33~34세 1년(스플릿 포함), 35세 1년. 37세 넘어 국내에서 해외로 간 사례는 없다.
   y: 최대 연수, f: MLB 연봉 배율, m·n: MLB·NPB 응찰 확률 배율 */
function ovsAgeT(age){ return age<=27?{y:6,f:1,m:1,n:1}:age<=29?{y:5,f:.95,m:1,n:1}:age<=31?{y:3,f:.85,m:.9,n:1}:age<=33?{y:2,f:.65,m:.6,n:.9}:age<=36?{y:1,f:.45,m:.3,n:.5}:{y:1,f:.4,m:0,n:0}; }
/* 해외 FA: 9시즌을 채운 FA 선수는 해외로 갈 수 있다. 해외 활성화 5: 빅리그급 스타 몫(postStar, 능력 60부터 65면 +30)도 포스팅과 같은 식으로 더한다(우리·AI 구단 선수 같게) */
const ovsFAP=(p,o=ovr(p))=>clamp(mlbOf(p)+postPull(p)+postStar(p),0,100)/100*(o>=64?.8:.45);
function ovsFA(pool){ for(const id of [...pool]){ const p=G.players[id]; if(!p||p.foreign||p.svc<9||p.age>33||milServing(p))continue; const o=ovr(p); if(o<POST_T.o+1)continue; mlbOf(p);
    if(R()<ovsFAP(p,o)){ /* 의지는 포스팅(postWant)과 같은 식: 잘할수록 해외 구단이 부르니 덜 망설인다 */ const lg=o>=POST_T.o+4&&R()<.8?'MLB':'NPB'; /* 11-17: 능력 61·70% → 60·80%(해외 FA 빅리그 행이 드물어 MLB 국내 선수가 2명으로 자주 줄었다) */ const A=ovsAgeT(p.age); const yrs=Math.min(A.y,ri(1,3)); const amt=Math.round(lg==='MLB'?clamp(postAmt0(o)*.85*A.f,100,2000):clamp((o-53)*40,80,500)); ovsLeave(p,lg,pick(lg==='MLB'?MLBT:NPBT),yrs,amt,'해외 FA'); const i=pool.indexOf(id); if(i>=0)pool.splice(i,1); } } }
/* 해외파의 한 해: 그 리그 수준으로 기록을 만들고, 계약이 끝나면 일부는 돌아온다 */
function abroadYear(){ const NW=[]; for(const a of G.abroad||[]){ if(a.back)continue; if(a.foreign||a.cand){ try{ ovsForeignYear(a,NW); }catch(e){} continue; } const y1=a.y1??a.y+1; if(G.year<y1)continue; /* 아직 해외 시즌을 보내지 않았다(이번 겨울에 떠남) */ if((a.lines||[]).some(l=>l.y===G.year)){ delete a.cur; continue; } /* 같은 시즌 기록 두 번 만들지 않기 */ let p; try{ p=JSON.parse(a.pj); }catch(e){ continue; } if(!p)continue;
    if(a.ci==null)a.ci=ovlIdx(a.lg,a.club); const av=ovsAv(a,p); /* 재활 중인 기간만큼 못 뛴다 */ const line=ovsFinish(a,ovsTake(a,p,{ci:a.ci,av,gt:ovsGt(a)}),p,NW); /* 리그 수준은 LEAGUE_LV 표(ovsAdj), 기준 능력에 못 미치면 트리플A·NPB 2군 */ const ok=line.lvl===a.lg; a.lines.push(line);
    if(p.injOut>0){ p.injOut=Math.max(0,p.injOut-365); if(!p.injOut)delete p.injK; } delete p.reInj;
    { const t0=p.team; p.team=null; injRecover(p,p.isP?line.outs:line.pa); /* 해외 실전으로 후유증 회복. 아직 해외 소속이라 옛 국내 구단에 알리지 않는다(검수 11-06) */ p.team=t0; } /* 성장·나이는 새해에 국내 선수와 함께(abroadDev) */ a.pj=ovsPj(p); const yrsIn=G.year-y1+1;
    const am=a.from==null, early=yrsIn<a.yrs&&!ok&&yrsIn>=(am?2:1)&&R()<(am?(ovr(p)<45&&p.age>=21?.35:.15):.35); /* 자리를 못 잡은 선수는 계약 중에도 방출돼 일찍 돌아온다(커뮤니티 제안 11-11). 아마추어 직행 선수는 마이너에서 크는 게 계약이라 2년째부터, 드물게(해외 활성화 2-1: 실제로 심준석·장현석 등은 몇 해 마이너에 남는다). 21세가 넘도록 능력 45에 못 미치면 35%(11-17: 고교 직행 선수가 6년 내내 남아 해외 국내 선수가 15명까지 늘었다) */
    const promised=!!(a.bn&&a.bn.y===G.year&&a.bn.v),due=yrsIn>=a.yrs&&(a.bn&&a.bn.y===G.year?!!a.bn.v||!ok:ovsBackRoll(a,p,ok)); delete a.bn; /* 계약 마지막 해: 새해에 미리 정한 값(해외 활성화 1-4). 남기로 했어도 시즌 중 자리를 잃으면(능력 하락) 돌아온다 */
    if(!early){ let mv=null; try{ mv=ovsMoveKr(a,p,ok,yrsIn,due,NW,promised); }catch(e){} if(mv&&mv!=='re')continue; } /* 미리 알려 준 복귀는 해외 리그 이동보다 우선한다. */
    if(early||due){ try{ntAbroadCareerRestore(a,p);}catch(e){} if(early)a.early=1; a.why=ovsBackWhy(a,p,early,ok); a.back=true; a.backY=G.year; a.age=p.age; a.pj=null; /* 돌아온 선수는 새해에 국내 선수와 같이 나이를 먹는다 */ if(a.from==null)p.svc=(p.svc||0)+(a.lines||[]).filter(l=>l.y>=y1&&((l.pa||0)+(l.outs||0))>0).length; else a.nsv=1; /* 아마추어 직행만 해외에서 실제로 뛴 시즌을 연차로(검수 11-07). 국내 구단을 거쳐 나간 선수의 FA 연차는 KBO 1군 등록일수라 해외 시즌은 들지 않고 출국 전 연차가 이어진다(카페 11-17: 포스팅 7년차가 MLB 1년 뒤 8년차로 돌아와 바로 FA). nsv: 불러오기 수리(ovsPostFix) 표시 */ G.players[p.id]=p; if(p.mil&&!p.mil.done&&p.mil.until&&p.mil.until<=G.day)p.mil={done:true,unit:p.mil.unit,pf:p.mil.from,pu:p.mil.until}; /* 해외에 있는 동안 지난 전역일: 복귀 때 전역 처리(검수 11-06) */ p.joinY=undefined; p.mor=70; delete p.ovsOffer;
      /* 복귀 권리와 계약은 나눈다: 원소속 구단이 우선협상(요구 연봉·기간을 보고 계약하거나 거절), 거절하면 자유계약 선수 */
      if(a.from==null){ p.team=null; p.faC=false; p.ext=false; p.ovsWait=G.year+2; story(p,`${a.lg} ${yrsIn}년 마치고 귀국 · ${G.year+2}년 신인 드래프트 도전 예정`,'move'); wire('해외',`${p.name}, ${a.lg} ${yrsIn}년 마치고 귀국 · 2년 유예 뒤 국내 드래프트 도전`,{ref:p.id}); continue; } /* KBO 규약 107조: 국내 구단을 거치지 않고 해외 구단과 계약한 선수는 계약이 끝나고 2년 뒤에 신인 드래프트로만 들어온다(2026 최지만 사례) */
      p.team=null; p.faC=false; p.ext=false; ovsBackMarketClear(p); p.retFrom=a.from; p.retAsk={sal:round5(Math.max(marketSal(ovr(p)),p.sal)*ovsAskMul(a)),yrs:ri(1,3),lg:a.lg,n:yrsIn,exp:G.day+14,why:a.why,post:a.how==='포스팅'?1:0}; /* post: 포스팅 복귀(카페 11-17). 난수는 예전과 같은 순서 */ /* 해외 성적이 좋으면 요구액도 오른다: 우리와 AI 구단이 같은 요구액을 본다 */
      wire('해외',`${p.name}, ${a.lg} ${yrsIn}년 마치고 국내 복귀 추진(${a.why}) · 원소속 ${tshort(a.from)} ${a.how==='포스팅'?'보류권(원소속 구단과만 계약)':'우선협상'}`,{tid:a.from,ref:p.id});
      if(a.from===G.user&&!G.unemp)ovsBackAsk(p); else ovsBackAI(p); } }
  try{ ovpYear(); }catch(e){} /* 해외 활성화 3-3: 상주 외국인 후보군도 한 시즌 */ try{ ovsWires(NW); }catch(e){} try{ ovsSlimFix(); }catch(e){} /* 해외 활성화 5: 저장 정리(난수 없음) */ }
/* 계약을 마친 해외파가 돌아오는가: 자리를 못 잡았거나 33세 이상이면 돌아오고, 잘할수록 더 남는다(최대 90%) */
function ovsBackRoll(a,p,ok){ const thr=(a.lg==='MLB'?62:57)-(ovsGt(a)?2:0), stayP=clamp(.75+(ovr(p)-thr)*.04,.75,.95); return !ok||p.age>=36||p.age>=33&&!(ovr(p)>=thr+2&&R()<.8)||R()>=stayP; } /* 해외 활성화 3-2: 33세 넘어도 빅리그 주전급(문턱 +2)은 80% 남는다(류현진 36세·추신수 38세까지). 예전: 33세면 모두 복귀. 11-17: 절반→80%, 잔류 55~90%→75~95%(자리 잡은 빅리거는 대개 남는다: 김하성·류현진. MLB 국내 선수 3~5명 유지) */
/* 새해: 해외파도 국내 선수와 같은 날 성장·나이(카페 11-09c: 전에는 가을 해외 시즌 뒤에 먹어 떠난 해 겨울 한 살을 건너뛰고, 31세에 나가 2년 뒤 31세로 돌아왔다).
   해외 리그 환경으로 성장(옛 국내 구단의 시설·감독·코치를 쓰지 않는다) */
function abroadDev(){ try{ ovpAge(); }catch(e){} for(const a of G.abroad||[]){ if(!a.back&&a.end==null&&a.fr&&(a.foreign||a.cand)){ ovsAgeFr(a.fr); continue; } /* KBO를 떠난 외국인: 나이 곡선만 */ if(a.back||a.foreign||!a.pj)continue; let p; try{ p=JSON.parse(a.pj); }catch(e){ continue; } if(!p)continue;
    const t0=p.team; p.team=null; p.ovsEnv=a.lg; try{ develop(p); }catch(e){} p.team=t0; delete p.ovsEnv; a.age=p.age; a.pj=ovsPj(p); } }
/* 해외에서 돌아오는 까닭(제보 11-16: 빅리그 기록이 좋은 선수가 왜 돌아왔는지 보이지 않았다). 계약 중 방출, 계약 만료 뒤 빅리그 자리를 잃음, 나이, 재계약 불발 */
function ovsClubShort(a){ const c=String((a&&a.club)||'').split(' ')[0]; return c||((a&&a.lg)||'해외')+' 구단'; }
const ovsWa=s=>{ const c=String(s).charCodeAt(String(s).length-1); return c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?'과':'와'; };
function ovsBackWhy(a,p,early,ok){ const c=ovsClubShort(a), w=c+ovsWa(c); if(early)return `${c}에서 방출된 뒤 복귀`; if(!ok)return `${w} 계약 만료 · 빅리그 자리를 잃고 복귀`; if(p&&p.age>=33)return `${w} 계약 만료 · ${p.age}세라 재계약 없이 복귀`; return `${w} 계약 만료 후 재계약하지 않고 복귀`; }
/* 포스팅으로 나갔다 돌아오는 선수인가(카페 11-17): 새 저장은 retAsk.post, 예전 저장은 해외 기록(how)으로 */
function ovsRetPost(p){ const q=p&&p.retAsk; if(q&&q.post!=null)return !!q.post; const a=(G.abroad||[]).find(x=>x.id===(p&&p.id)&&!x.foreign); return !!(a&&a.how==='포스팅'); }
/* 불러오기 수리(카페 11-17): 예전 저장의 포스팅 복귀 선수는 해외 시즌이 FA 연차에 더해지고 복귀 계약이 FA 계약으로 남아, 계약이 끝나면 FA 시장에 나갔다. 우리·AI 구단 선수 같게 고친다(난수 없음).
   ① 더해진 해외 시즌 연차를 뺀다 ② 아직 복귀 계약 중이면 비FA 다년(1년이면 보류 연봉 계약)으로 ③ 그 계약이 끝나 열린 FA 시장에 나와 있고 연차가 모자라면 원소속 구단 보류 선수로 되돌린다(아직 아무 데도 계약하지 않았을 때만) */
function ovsPostFix(){ ovsBackStateFix(); let n=0; const F=G.fa, lastR=G.rolled===G.year?G.year:G.year-1;
  for(const a of G.abroad||[]){ if(!a||!a.back||a.foreign||a.from==null)continue; if(a.how!=='포스팅'){ a.nsv=1; continue; } const p=G.players[a.id]; if(!p||p.foreign)continue; const y1=a.y1??a.y+1;
    if(!a.nsv){ p.svc=Math.max(0,(p.svc||0)-(a.lines||[]).filter(l=>l.y>=y1&&((l.pa||0)+(l.outs||0))>0).length); a.nsv=1; n++; } /* nsv는 연차 차감만 표시한다. 정원으로 못 마친 보류 복원은 다음 호출에서 다시 확인한다. */
    const ret=(p.story||[]).some(e=>e&&e.y===a.backY&&String(e.t||'').includes('생활을 마치고')), noFA=p.lastFA==null||p.lastFA<a.backY; if(!ret||!noFA)continue; /* 복귀 뒤 FA 계약을 새로 했으면 그대로 */
    if(p.team!=null&&p.ext&&!p.faC&&(p.yrs||0)===1&&(p.cyrs==null||p.cyrs<=1))p.ext=false; /* 옛 단년 복귀 표시만 정리하며 다년계약의 잔여 1년은 유지한다. */
    if(p.team!=null&&p.faC&&!p.ext&&(p.cyrs||0)>=1&&p.cyrs<=3&&p.cyrs-(p.yrs||0)===lastR-a.backY){ if(p.cyrs>1)p.ext=true; else { p.faC=false; p.yrs=1; delete p.cyrs; } continue; }
    if(p.team==null&&F&&!F.closed&&(F.pool||[]).includes(p.id)&&p.ctFree===F.y0&&p.faFrom===a.from&&F.y0-a.backY<=3&&(p.svc||0)<faSvc(p)&&G.teams.some(t=>t.id===a.from)&&rosterN(a.from)<ROSTER_MAX){
      ovsBackMarketClear(p); p.team=a.from; p.faC=false; p.ext=false; p.yrs=1; delete p.cyrs; delete p.faFrom; delete p.faGrade; delete p.faPrevSal; delete p.ctFree; delete p.ask;
      story(p,'포스팅 복귀 선수라 FA가 아님 · 원소속 보류 선수로 정정','move'); if(a.from===G.user&&!G.unemp)note('FA',`${p.name}은(는) 포스팅으로 나갔다 돌아온 선수라 FA 자격(등록 ${faSvc(p)}시즌)이 아직 없습니다. FA 명단에서 빼고 우리 보류 선수로 되돌렸습니다.`,p.id); } }
  return n; }
/* 해외 복귀 협상·무적 시장·FA 시장은 한 선수에게 동시에 열리지 않는다. */
function ovsBackMarketClear(p){ for(const k of ['freeSince','freeDay','tryK','faFrom','faGrade','faPrevSal','ctFree','ask'])delete p[k]; const F=G.fa; if(F){ if(Array.isArray(F.pool)&&F.pool.includes(p.id))F.pool=F.pool.filter(id=>id!==p.id); for(const k of ['offers','ai','neg'])if(F[k])delete F[k][p.id]; } }
function ovsBackClose(p,res,choice){ const mids=new Set(); for(const e of G.evs||[]){ if(e.done||e.k!=='ovsback'||e.data?.pid!==p.id)continue; e.done=true; e.res=res; if(choice==null)e.void=true; else e.pick=choice; if(e.mid!=null)mids.add(e.mid); const m=(G.mail||[]).find(x=>x.id===e.mid); if(m){ m.acts=[]; m.imp=false; m.read=true; m.body=(m.body||'')+'\n\n[종료] '+res; } } if(mids.size)G.stops=(G.stops||[]).filter(x=>!mids.has(x.id)); }
function ovsBackStale(p){ const res='이미 체결된 계약을 유지하고 이전 해외 복귀 요청을 종료합니다.'; ovsBackClose(p,res); delete p.retAsk; delete p.retFrom; for(const k of ['freeSince','freeDay','tryK'])delete p[k]; return res; }
/* 불러오기는 계약 여부와 시장 중복만 정리한다. AI 계약 판단이나 기한 처리는 일일 진행·직접 선택에서 한다. */
function ovsBackStateFix(){ for(const p of Object.values(G.players||{})){ if(!p.retAsk)continue; if(p.team!=null)ovsBackStale(p); else ovsBackMarketClear(p); } }
function ovsBackExpired(p){ return !!p?.retAsk&&G.day>(p.retAsk.exp??0); }
function ovsBackReady(p){ if(!p?.retAsk)return false; if(p.team!=null){ ovsBackStale(p); return false; } if(ovsBackExpired(p)){ ovsBackFree(p,'해외 복귀 우선협상 기한 만료'); return false; } return p.retFrom!=null; }
/* 해외 복귀 선수: 원소속 구단 우선협상 */
function ovsBackSign(p){ if(!ovsBackReady(p))return '이미 정리되었거나 기한이 지난 복귀 요청입니다.'; const q=p.retAsk, tid=p.retFrom, post=ovsRetPost(p); ovsBackMarketClear(p); delete p.retMin; p.team=tid; p.sal=q.sal; p.yrs=q.yrs; p.cyrs=q.yrs; p.faC=true; p.ext=post&&q.yrs>1; if(post&&q.yrs<=1){ p.faC=false; p.yrs=1; delete p.cyrs; } /* 포스팅 복귀는 FA가 아니다(카페 11-17): 원소속 구단과 비FA 다년계약(류현진 2024 한화 8년·김광현 2022 SSG 4년), 1년이면 보류 선수 연봉 계약. 계약이 끝나면 FA 연차(등록 연수)로 FA인지 정한다. 해외 FA 복귀는 예전처럼 FA 계약 */ p.relT=null; p.ctT=tid; p.e1=false; /* 예전 저장본 보관 데이터의 1군 등록 상태도 지운다: 복귀 뒤 등록은 엔트리 조정이 정한다 */ story(p,`${q.lg} 생활을 마치고 ${tname(tid)} 복귀(${q.why?q.why+' · ':''}${post?(q.yrs>1?'비FA 다년계약 ':'연봉 계약 '):''}${q.yrs}년 연 ${money(q.sal)})`,'move');
  mvLog('해외 복귀',p,null,tid,`${q.lg} ${q.n}년 뒤 복귀${q.why?'('+q.why+')':''} · ${q.yrs}년 연 ${money(q.sal)}`,q.sal*q.yrs); wire('해외',`${p.name}, ${tshort(tid)}와 ${q.yrs}년 연 ${money(q.sal)} 복귀 계약`,{tid,ref:p.id}); if(tid===G.user)news('선수',`${p.name}, 친정 복귀`,`${q.lg}에서 ${q.n}년을 뛰고 돌아왔습니다.${q.why?` ${q.why}했습니다.`:''} 연봉 ${money(q.sal)} · ${q.yrs}년 계약.`,2,{ref:p.id,fanW:1.5});
  const res=`${p.name}과(와) ${q.yrs}년 연 ${money(q.sal)}에 복귀 계약을 했습니다.`; ovsBackClose(p,res,0); delete p.retAsk; delete p.retFrom; return res; }
function ovsBackFree(p,why){ if(!p?.retAsk)return; if(p.team!=null){ ovsBackStale(p); return; } const tid=p.retFrom, post=ovsRetPost(p); ovsBackClose(p,why||'해외 복귀 우선협상을 마치고 자유계약 선수로 풀립니다.',1); ovsBackMarketClear(p); p._retQ=p.retAsk; delete p.retAsk; delete p.retFrom; p.team=null; if(tid!=null){ const B=p.relBan=Object.assign({},p.relBan||{}); B[tid]=G.day+365; } /* 우선협상을 거절한 원소속 구단은 1년 동안 헐값 재계약 불가(우선협상 우회 방지) */ if(p.isP==null)return; const q0=p._retQ; wire('해외',`${p.name}, ${tshort(tid)}와 복귀 계약 불발 · ${post?'보류권을 풀어 ':''}자유계약 선수로`,{tid,ref:p.id}); /* 포스팅 복귀 선수는 원소속 구단이 보류권을 풀어 줘야(방출) 다른 구단과 계약할 수 있다(카페 11-17) */ try{ toFree(p,why||'해외 복귀 우선협상 불발'); }catch(e){} if(q0){ p.sal=Math.max(p.sal||0,Math.round(q0.sal*.85)); p.retMin={sal:Math.round(q0.sal*.85),until:G.day+120}; } delete p._retQ; } /* 다른 구단도 복귀 요구액에 가깝게 줘야 한다(검수 11-07: 최저연봉 근처 영입) */
function ovsBackAI(p){ if(!ovsBackReady(p))return; const tid=p.retFrom, t=team(tid), q=p.retAsk; const ok=t&&(t.cash||0)>-3000&&aiVal(t,p)>=Math.max(.6,q.sal/450)&&(()=>{ const s0=p.sal; p.sal=q.sal; const v=capPayAs(tid,[p.id],[]); p.sal=s0; return v; })()<=capOf(sponSeason())*aiCapMul(t); /* 복귀 연봉으로 상위 40명을 다시 센다(옛 연봉을 빼면 40명 밖 선수도 빠졌다, 검수 11-08) */ if(ok){ ovsBackSign(p); if(rosterN(tid)>ROSTER_MAX)trimRoster(tid,ROSTER_MAX); } else ovsBackFree(p); } /* 정원이 차 있으면 우리처럼 한 명을 정리하고 데려온다(해외 활성화 1-4: 예전 AI는 정원이 차면 복귀 선수를 놓쳤다) */
/* 해외 복귀 우선협상의 상한 결재(13_roster capOwnerCheck) */
function ovsCapCheck(p){ const q=p.retAsk; if(!q||G.unemp)return null; const s=sponSeason(); return capOwnerCheck(capPayWith(G.user,p.id,q.sal,s).tot,capPayWith(G.user,null,null,s).tot,s,'ovs'+p.id); }
function ovsBackAsk(p){ const q=p.retAsk, post=ovsRetPost(p); const n=rosterN(G.user); let room=''; try{ room=` · 지금 예산 여유 ${money(budget().roomGoal)}`; }catch(e){}
  evNew('ovsback',`${p.name} 해외 복귀: ${post?'원소속 단독 협상':'우선협상'}`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) ${q.lg} ${q.n}년을 마치고 국내 복귀를 원합니다${q.why?`(${q.why})`:''}. ${post?'포스팅으로 나간 선수라 FA가 아니고, 보류권을 가진 우리 구단하고만 계약할 수 있습니다':'우리 구단이 원소속이라 먼저 협상합니다'}. 요구: ${q.yrs}년 연 ${money(q.sal)}${post?(q.yrs>1?' 비FA 다년계약':' 연봉 계약'):''}(현재 능력 ${dv(Math.round(ovr(p)))}). ${post?'계약하지 않으면 보류권을 풀어 자유계약 선수가 되고, 다른 구단도 데려갈 수 있습니다.':'계약하지 않으면 자유계약 선수가 되어 다른 구단도 데려갈 수 있습니다.'}`, /* 포스팅 복귀는 FA 협상이 아니라 원소속 단독 협상(카페 11-17) */
    [{l:`계약: ${q.yrs}년 연 ${money(q.sal)}${post&&q.yrs>1?' 비FA 다년':''}`,fx:`선수단 ${n}/${ROSTER_MAX}명${n>=ROSTER_MAX?' · 정원을 넘어 진행 전에 한 명을 정리해야 합니다':''}${room}${(()=>{ const cc=ovsCapCheck(p); return cc?` · 샐러리캡: ${capOwnerTxt(cc)}`:''; })()}`},{l:post?'계약하지 않음(보류권 풀기)':'계약하지 않음',fx:'자유계약 선수로 풀립니다. 비용은 없습니다.'}],{ref:p.id,face:p.id,from:p.name,data:{pid:p.id},def:1,exp:14}); }
EVH.ovsback={canAuto:true,can(e,i){const p=G.players[e.data.pid];if(i!==0||!p?.retAsk||p.team!=null||ovsBackExpired(p)||G.unemp||p.retFrom!==G.user)return '';const cc=ovsCapCheck(p);return cc&&!cc.ok?`${cc.msg} 협상과 보류권은 유지됩니다. 선수단 연봉을 조정한 뒤 다시 계약할 수 있습니다.`:'';},pick(e,i){ const p=G.players[e.data.pid]; if(!ovsBackReady(p))return '이미 정리되었거나 기한이 지난 복귀 요청입니다.'; if(G.unemp||p.retFrom!==G.user){ ovsBackAI(p); return ''; } if(i===0){ const cc=ovsCapCheck(p); if(cc&&!cc.ok)return `${cc.msg} 협상과 보류권은 유지됩니다. 선수단 연봉을 조정한 뒤 다시 계약할 수 있습니다.`;const r=ovsBackSign(p); capOwnerOk(cc,`해외 복귀 ${p.name} 계약`); return r; } ovsBackFree(p,'해외 복귀 우선협상: 구단이 계약하지 않음'); return `${p.name}과(와) 계약하지 않았습니다. 자유계약 선수로 풀립니다.`; } };
/* 대체 외국인 관찰 명단 */
function fwatchOn(id){ return (G.fwatch||[]).some(w=>String(w.id)===String(id)); }
/* 화면의 관찰 의도와 실제 시장 조사 회원은 다르다: 이전 대기는 해외 추적으로 남는다. */
function fwatchIntent(id){ return fwatchOn(id)||(typeof ovwOn==='function'&&ovwOn(id)); }
function fwatchToggle(id){ if(fwatchIntent(id)){ G.fwNo=[...new Set([...(G.fwNo||[]),id])]; G.fwatch=(G.fwatch||[]).filter(x=>String(x.id)!==String(id)); if(typeof ovwForget==='function')ovwForget(id); return '관찰 명단에서 뺐습니다.'; }
  if((G.fwatch||[]).length>=8)return '관찰 명단은 8명까지입니다.'; G.fwNo=(G.fwNo||[]).filter(x=>String(x)!==String(id)); (G.fwatch=G.fwatch||[]).push({id,since:G.day,k:0}); if(typeof ovwForget==='function')ovwForget(id); return '관찰 명단에 올렸습니다. 매주 스카우트 보고가 쌓여 평가가 정확해집니다.'; }
/* 파악 완료(100%)까지 남은 주: 지금의 망·파견 인력으로 다음 주에 늘어날 양을 쓴다. dk는 지난 보고 기록이다. */
function fwatchRate(p){ const r=origOf(p), isc=intlScoutFor(r); return 3+intlLv(r)*3+(isc?isc.skill*2:0); }
function fwatchEta(w){ if(!w||w.k>=100)return 0; const p=G.players[w.id]; return p?Math.ceil((100-w.k)/fwatchRate(p)):null; }
function fwatchK(id){ const w=(G.fwatch||[]).find(x=>x.id===id); return w?w.k:0; }
/* ===== AI 구단 관찰 명단과 관찰 소문(사용자 11-17: 해외 활성화 3-3) =====
   AI 구단도 우리처럼 관찰 명단을 둔다: 영입이 필요한 자리(fNeed)의 상위 후보, 시즌 중에는 교체할 만한 후보를 4명까지. 같은 정보(공개 기록·자기 스카우트 추정)로 고르고,
   매주 파악도가 우리와 같은 식(3 + 스카우트망 단계×3)으로 오른다. 난수를 쓰지 않는다(본게임 난수 순서 그대로).
   소문: 어느 구단이든 3주 넘게 지켜본 후보는 '다른 구단 관심'이 붙는다. 우리 관찰도 AI 관찰도 같은 규칙으로 몸값(요구액 인상·경쟁 제시액)에 실린다.
   예전: 우리 관찰만 경쟁 구단 하나로 쳤고(foRivals), 그보다 전에는 AI가 우리 관찰 후보에 +2점·계약 확률 1.8배를 줬다(한쪽만, 1-2에서 지움) */
const FW_AI={max:4,long:21};
/* 관찰은 구단의 지식이다. 전임 인계 사본과 현재 AI 관찰이 겹치면 오래 본 날짜와 높은 파악도를 한 번만 읽는다. */
function fwatchTeam(tid){ if(tid==null||tid===ME())return G.fwatch||[]; const M=new Map(); for(const w of [...((G.fwatchT||{})[tid]||[]),...((G.fwAI||{})[tid]||[])]){ if(!w||w.id==null)continue; const o=M.get(w.id); M.set(w.id,o?{...o,...w,since:Math.min(o.since??G.day,w.since??G.day),k:Math.max(o.k||0,w.k||0)}:{...w}); } return [...M.values()]; }
function fwatchKT(tid,id){ const w=fwatchTeam(tid).find(x=>x.id===id); return w?w.k:0; }
/* 3주 넘게 지켜본 구단(우리 포함). 야인 개인 목록은 구단 관심으로 세지 않는다. */
function fWatchers(q){ const id=q&&q.id, out=[], d0=G.day-FW_AI.long; if(id==null)return out; for(const t of G.teams){const w=fwatchTeam(t.id).find(x=>x.id===id);if(w&&w.since<=d0)out.push(t.id);}return out; }

/* 보는 구단(viewer)을 뺀 소문 구단 수: 우리 화면은 viewer=우리, AI 판단은 viewer=그 구단 */
function fRumorN(q,viewer){ const v=viewer??ME(); return fWatchers(q).filter(t=>t!==v).length; }
function fwAiWeek(){ const W=G.fwAI=G.fwAI||{}, me=ME(); delete W[me]; const M=new Set(G.fmarket||[]), sea=period()==='season', open=foreignOpen()&&(!sea||G.day<=foreignDL());
  for(const t of G.teams){ if(t.id===me)continue; const old=fwatchTeam(t.id).filter(w=>M.has(w.id)&&G.players[w.id]&&G.players[w.id].team==null); let C=[];
    if(open){ const nd=fNeed(t.id); if(nd)C=fTop3(t.id,nd); /* 영입 후보 상위 3명(계약할 수 있는 후보만): AI가 실제로 고르는 목록 그대로 */
      else if(sea&&fReplLeft(t.id,'용병')>0){ const w=foreignOf(t.id).filter(x=>x.foreign==='용병').sort((a,b)=>ovr(a)-ovr(b))[0]; /* 시즌 중: 가장 약한 용병보다 나아 보이는 같은 유형 후보(aiForeignReview와 같은 비교) */
        if(w)C=(G.fmarket||[]).map(id=>G.players[id]).filter(x=>x&&x.team==null&&x.foreign==='용병'&&x.isP===w.isP&&fKnows(t.id,x)&&!foHeld(x)&&fScoreBy(t.id,x)>ovr(w)+3).sort((a,b)=>fScoreBy(t.id,b)-fScoreBy(t.id,a)).slice(0,2); } }
    const ids=[...new Set(C.map(x=>x.id))].slice(0,FW_AI.max), lv=Math.min(2,Math.floor(fScoutLv(t.id)||0));
    const L=ids.map(id=>{ const w=old.find(x=>x.id===id); if(w){ w.k=clamp(w.k+3+lv*3,0,100); return w; } return {id,since:G.day,k:0}; }); /* 관심에서 빠진 후보는 명단에서도 빠진다 */
    if(L.length)W[t.id]=L; else delete W[t.id]; if(Object.prototype.hasOwnProperty.call(G.fwatchT||{},t.id))G.fwatchT[t.id]=L.map(w=>({...w})); } }
function fwatchWeek(){ G.fwatch=G.fwatch||[]; const out=[]; try{ fwAiWeek(); }catch(e){}
  for(const w of G.fwatch){ const p=G.players[w.id]; if(!p||p.team!=null){ if(p&&p.team!=null&&p.team!==G.user)out.push(`${p.name}은(는) ${tshort(p.team)}와(과) 계약했습니다`); w.gone=true; continue; }
    const k0=w.k; w.k=clamp(w.k+fwatchRate(p),0,100); w.dk=w.k-k0; /* 이번 주 파악도 증가(관찰 명단 표시, 스카우트 1단계) */ if(!w.rum&&fRumorN(p,G.user)){ w.rum=1; out.push(`${p.name}: 다른 구단 스카우트도 3주 넘게 지켜본다는 소문입니다(몸값이 오를 수 있습니다)`); } /* 사용자 11-17: AI 관찰 소문 */
  }
  /* 시즌 중 MLB 콜업·NPB 계약으로 후보가 빠진다: 시장의 모든 후보가 같은 확률(해외 활성화 1-2: 예전에는 우리가 관찰하는 후보만 빠져 관찰할수록 후보를 잃었다). 해외 기록은 관찰 후보만 남긴다(저장 크기) */
  if(period()==='season')for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; if(!p||p.team!=null||!p.foreign||foHeld(p))continue; /* 답을 기다려 주는 기한에는 해외로 빠지지 않는다(검수 11-09b) */
    if(R()>=(p.age<=29&&ovr(p)>=60?.03:.015))continue; const lg=R()<.6?'MLB 콜업':'NPB 계약', w=G.fwatch.find(x=>x.id===id); G.fmarket=G.fmarket.filter(x=>x!==id);
    if(w){ out.push(`${p.name}이(가) ${lg}(으)로 후보에서 빠졌습니다`); w.gone=true; try{ ovsTrackCand(p,lg==='MLB 콜업'?'MLB':'NPB'); }catch(e){} } /* 놓친 관찰 후보는 해외 리그 화면에서 계속 본다 */
    else if(p.fkbo)wire('외국인',`KBO 경력 외국인 ${p.name}, ${lg}(으)로 한국행 접어`,{ref:p.id});
    p._ovsLg=lg==='MLB 콜업'?'MLB':'NPB'; dropP(id); }
  /* 올해 기록: 시장의 모든 외국인 후보가 그 리그 수준대로 매주 쌓는다(공개 기록이라 우리와 AI 구단이 똑같이 본다. 예전에는 우리 관찰 후보만 쌓였다) */
  if(period()==='season')for(const id of G.fmarket||[]){ const p=G.players[id]; if(!p||p.team!=null||!p.prevLvl)continue; const r=origOf(p); const LA=lgAdjF(p.prevLvl)||[r==='jp'?-1:r==='la'?4:2,r==='jp'?-1:r==='la'?4:2]; const add=p.isP?simPit(p,ri(9,21),LA[1]):simBat(p,ri(14,26),LA[0]); const n=p.now&&p.now.y===G.year?p.now:(p.now={y:G.year,lvl:p.prevLvl}); for(const k in add)if(typeof add[k]==='number')n[k]=(n[k]||0)+add[k]; }
  G.fwatch=G.fwatch.filter(w=>!w.gone);
  /* 스카우트 자동 관찰: 빈자리가 있으면 감독이 원하는 유형(없으면 우리 팀에 필요한 유형) 후보를 주 1~2명씩 올린다(자동 3명까지) */
  try{ if(!G.unemp&&(foreignOpen()||period()==='season')&&G.fwatch.length<8&&G.fwatch.filter(w=>w.auto).length<3){ const W=mgrWantForeign(); const need=fNeed(G.user); const on=new Set(G.fwatch.map(w=>w.id).concat(G.fwNo||[])); /* fwNo: 지금 구단에서 뺀 기록(이직하면 구단별로 바뀐다) */
    const C=(G.fmarket||[]).map(id=>G.players[id]).filter(q=>q&&q.team==null&&!on.has(q.id)&&fKnows(G.user,q)&&(q.foreign==='용병'||(need&&need.kind==='아시아')));
    const fit=q=>(W&&mgrFitF(q,W)?2:0)+(need&&need.isP!=null&&q.isP===need.isP?1:0)+(need&&need.kind==='아시아'&&q.foreign==='아시아'?1:0); const val=q=>{ const r=scoutReport(q); return (r.ofp??((r.cur??40)+3))+(r.cur??40)*.3; };
    const pickL=C.filter(q=>fit(q)>0).sort((a,b)=>fit(b)-fit(a)||val(b)-val(a)).slice(0,Math.min(2,3-G.fwatch.filter(w=>w.auto).length,8-G.fwatch.length));
    if(pickL.length){ for(const q of pickL)G.fwatch.push({id:q.id,since:G.day,k:0,auto:true}); const pkN=pickL.filter(fNewsOk); if(pkN.length)mail('스카우트팀장','관찰 명단에 후보를 올렸습니다',`${pkN.map(q=>`${q.name}(${posLabel(q)}, ${q.nat||''}, ${q.age}세 · 요구 ${usdKw(Math.round(q.ask/USD))})`).join('\n')}\n\n${W&&W.want?'감독이 원하는 유형':'우리 팀에 필요한 유형'}이라 지켜보겠습니다. 매주 보고가 쌓이면 평가가 정확해집니다. 필요 없으면 관찰 명단에서 빼 주세요(스카우트가 올린 후보는 3명까지).`,{kind:'외국인',acts:[{l:'관찰 명단',a:'go',v:'transfer:watch'}]}); } } }catch(e){}
  if(out.length)mail('스카우트팀장','관찰 명단 변동',out.join('.\n')+'.',{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]});
  // 우리 외국인이 흔들리면 대체 후보를 올린다
  if(period()!=='season'||G.day>foreignDL()||G.day<G.cal.open+30)return; for(const p of foreignOf(G.user)){ if(fReplLeft(G.user,p.foreign)<=0)continue; const h=seasonTotal(p,G.year,'1군'); const bad=p.injOut>=30||(h&&(p.isP?(h.outs>=90&&pRate(h).era>5.6):(h.pa>=120&&bRate(h).ops<.680)));
    if(!bad||p.fwarn===G.year*100+dobj(G.day).m)continue; p.fwarn=G.year*100+dobj(G.day).m; const alt=(G.fwatch||[]).map(w=>G.players[w.id]).filter(q=>q&&q.isP===p.isP&&q.foreign===p.foreign);
    mail('스카우트팀장',`${p.name} 교체 검토`,`${p.name}이(가) ${p.injOut>=30?`부상으로 약 ${p.injOut}일 빠집니다`:'부진합니다'}. ${alt.length?`관찰 명단의 ${p.isP?'투수':'타자'} 후보: ${alt.map(q=>q.name).join(', ')}.`:'관찰 명단에 같은 유형 후보가 없습니다. 외국인 시장에서 후보를 관찰 명단에 올려 두세요.'}`,{imp:!!alt.length,kind:'외국인',ref:p.id,acts:[...alt.slice(0,2).map(q=>({l:`${q.name} 보기`,a:'player',v:q.id})),{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); } }

/* 상대 구단이 눈여겨보는 우리 선수: 그 팀 약한 자리에 맞고 그 팀 눈에 값어치가 큰 선수 3명. 매주 바뀐다 */
let _intC={};
function aiInterest(tid,actorTid){ const actor=actorTid??G.user; if(tid===actor||!G.teams[tid])return []; const wk=G.year*100+Math.floor(G.day/7); const n=tradeActorCount(actor); const k=actor+':'+wk+':'+n+':'+(G.trades||[]).length+':'+(G.lgTrades||[]).length; const ck=tid+':'+actor;
  if(_intC[ck]&&_intC[ck].g===G&&_intC[ck].k===k)return _intC[ck].v; const t=team(tid); let weak=[]; try{ weak=teamNeeds(tid).weak||[]; }catch(e){}
  const back=new Set([...(G.trades||[]).filter(r=>r.y===G.year).flatMap(r=>{ const me=r.me??G.user; return me===actor&&r.with===tid?r.gi||[]:r.with===actor&&me===tid?r.go||[]:[]; }),...(G.lgTrades||[]).filter(r=>r.y===G.year).flatMap(r=>r.a===actor&&r.b===tid?r.ag||[]:r.b===actor&&r.a===tid?r.bg||[]:[])]); /* 올해 이 구단에서 받아 온 선수는 되찾으려 하지 않는다 */
  const v=domestic(actor).filter(p=>!p.ys&&!p.noTrade&&!(p.joinY>G.year)&&healthy(p)&&!back.has(p.id)).map(p=>{ const val=tval(t,p,'in'); const fit=weak.includes(pSlot(p))?1.35:1; return {id:p.id,s:val*fit+hn('int'+tid+':'+wk,p.id)*.6}; }).filter(x=>x.s>.6).sort((a,b)=>b.s-a.s).slice(0,3).map(x=>x.id);
  _intC[ck]={k,v,g:G}; return v; }
function interestKnown(tid){ return team(tid).rel>=35; }

function interestWhy(tid,p){ const w=[]; let weak=[]; try{ weak=teamNeeds(tid).weak||[]; }catch(e){} if(weak.includes(pSlot(p)))w.push(`${SLOTK[pSlot(p)]} 보강`); const tr=gmTrait(tid);
  if(tr==='prospect'&&p.age<=24)w.push('유망주 선호'); if(tr==='miser'&&p.sal<=150)w.push('싼 연봉'); if(tr==='gambler'&&ovr(p)>=60)w.push('즉시 전력'); if(teamCtx(team(tid)).contend&&ovr(p)>=55)w.push('우승 경쟁용'); if(!teamCtx(team(tid)).contend&&p.age<=25)w.push('리빌딩 자원'); return w.slice(0,2).join(' · ')||'전력 보강'; }


/* 단장이 먼저 포스팅 신청(카페 문의 11-07): 11월 1일~12월 5일(KBO 포스팅 신청 기간), 서비스 7년 이상 보류 선수. 선수가 해외 진출을 원하지 않으면 거절한다 */
function postGMWhy(p){ if(!p||p.team!==G.user||G.unemp||p.foreign)return '우리 국내 선수만 신청할 수 있습니다.';return postApplyWhy(p,G.user);}
function postGM(id){ const p=G.players[id]; const why=postGMWhy(p); if(why)return why; if(mlbOf(p)<25){ return `${p.name}은(는) 지금 해외 진출을 원하지 않습니다(메이저리그 의지 ${p.mlb}).`; }
  const x=postStart(p);story(p,`${G.year} 구단 주도 포스팅 신청`,'move'); return `${p.name} 포스팅을 신청했습니다. ${dmd(x.day)}에 MLB·NPB 구단 제안과 결과가 나옵니다.`; }

/* ===== 해외 진출 이야기(사용자 11-08): MLB 스카우트 방문 보도 · 포스팅 중간 보도 · 고교 선수 MLB 직행과 1순위 구단의 설득 =====
   실제 바탕: 해외 진출 후보 경기에는 메이저리그 스카우트가 몰려 보도되고, 포스팅은 공시 뒤 30일 협상 기간 동안 현지 보도가 이어진다.
   고교 최대어가 드래프트 전에 미국 구단과 계약하는 일이 있다(2023 심준석 등). 지명 순번이 앞선 구단은 계약금·면담으로 설득을 시도한다 */
function ovsStoryDaily(){ try{ ovsScoutVisit(); }catch(e){} try{ ovsPostRumor(); }catch(e){} try{ hsUsDaily(); }catch(e){} }
/* MLB 스카우트 방문: 정규시즌 화요일마다, 해외 진출을 바라볼 만한 국내 정상급 선수 경기 */
function ovsScoutVisit(){ if(period()!=='season'||dobj(G.day).w!==2||R()>.4)return;
  const L=Object.values(G.players).filter(p=>p.team!=null&&!p.foreign&&!p.prospect&&p.age<=31&&!milServing(p)&&!(p.injOut>0)&&!p.frehab&&ovr(p)>=POST_T.o+1&&((p.svc||0)>=5||mlbOf(p)>=55)&&p.ovsY==null&&p.retFrom==null).sort((a,b)=>ovr(b)-ovr(a)); if(!L.length)return;
  const p=L[Math.floor(R()*Math.min(5,L.length))]; G.ovsVisit=G.ovsVisit||{}; if((G.ovsVisit[p.id]??-999)>=G.day-40)return; G.ovsVisit[p.id]=G.day;
  const n=ovr(p)>=POST_T.o+6?ri(5,9):ri(2,5); const clubs=[...MLBT].sort(()=>R()-.5).slice(0,Math.min(3,n)).join('·');
  p.mlbSeen=p.mlbSeenY===G.year?(p.mlbSeen||0)+1:1; p.mlbSeenY=G.year; /* 올해 방문 횟수: 해가 바뀌면 새로 센다(검수 11-09c) */ p.mlb=clamp(mlbOf(p)+2,0,100);
  wire('해외',`${p.name}(${tshort(p.team)}) 경기에 MLB ${n}개 구단 스카우트 집결`,{tid:p.team,ref:p.id});
  if(p.team===G.user&&!G.unemp)news('선수',`MLB 스카우트, ${p.name} 보러 왔다`,`${clubs} 등 메이저리그 ${n}개 구단 스카우트가 ${p.name}의 경기를 지켜봤습니다. ${p.isP?'백네트 뒤에 스피드건이 줄지어 섰습니다.':'타석마다 스카우트들의 메모가 바빴습니다.'} 선수의 해외 진출 의지가 조금 커졌습니다(올해 ${p.mlbSeen}번째 방문).`,1,{ref:p.id}); }
/* 포스팅 중간 보도: 결과 8일 전 현지 보도(관심 구단 수는 실제 결과와 같은 기준으로 추정) */
function ovsPostRumor(){ for(const x of G.posting||[]){ if(x.done||x.rum||x.void||G.day<x.day-8)continue; x.rum=true; const p=G.players[x.pid]; if(!p||p.team!==x.tid)continue; const o=ovr(p);
    const E=postEst(p); void o; const n=ri(E.n[0],E.n[1]); const cl=[...MLBT].sort(()=>R()-.5).slice(0,Math.min(3,n));
    const t=n?`현지 보도 "${cl.join('·')} 등 ${n}개 구단 관심"`:'현지 반응 미지근, 관심 구단 확인 안 돼';
    wire('해외',`${p.name} 포스팅 · ${t}`,{tid:x.tid,ref:p.id});
    if(x.tid===G.user&&!G.unemp)news('선수',`${p.name} 포스팅 협상 막바지 · ${n?`${n}개 구단 관심`:'관심 구단 없어'}`,n?`미국 현지 기자들이 ${cl.join('·')} 등을 유력 행선지로 꼽고 있습니다. ${dmd(x.day)}에 결과가 나옵니다. ${n>=4?'몸값이 예상보다 오를 수 있다는 전망입니다.':''}`:`아직 적극적인 구단이 보이지 않습니다. 일본 구단 제안이나 잔류 가능성도 거론됩니다. 결과는 ${dmd(x.day)}.`,n?1:0,{ref:p.id}); } }
/* 미국 직행 빈도(해외 활성화 1-3): 실제 고교·대학 아마추어 미국 직행은 해마다 1~3명 안팎(2023 심준석, 2024 장현석 등). 잠재력 문턱을 넘는 최대어 5명 중 60%로 제안(3명까지), 설득 없이 30%는 남는다 */
const US_HS={top:5,p:.6,max:2,stay:.3,hs:58,co:60,coO:48}; /* hs·co: 미국 구단이 보는 잠재력 문턱(고교·대학), coO: 대학 선수 지금 능력 문턱. max 3→2(11-17: 해마다 2~3명이 미국으로 가 해외 국내 선수가 15명까지 늘었다. 실제 고교·대학 직행은 한 해 1~2명) */
/* 설득: 1순위 구단이 우리든 AI든 같은 두 선택지·같은 비용(계약금 1.3배, 성공했을 때만)·같은 확률 */
function usHsCh(tid,p,i){ const mv=mlbOf(p); return i===0?clamp(.92-(mv-50)/120,.55,.95):clamp(.55-(mv-50)/90+(p.gmVis&&p.gmVis.t===tid&&p.gmVis.y===G.year?.08:0),.15,.75); } /* 고교 방문을 기억하는 선수는 직접 설득이 조금 낫다 */
const usHsCost=(p,i)=>i===0?Math.round(p.usOff.bonus*1.3):0;
function usHsTry(tid,p,i){ const cost=usHsCost(p,i); if(R()<usHsCh(tid,p,i)){ p.usStay=true; delete p.usOff; if(cost){ if(tid===G.user)spendPay(cost); else team(tid).cash-=cost; } p.usKeepT=tid;
    const t=`${p.name}, 미국 대신 국내 잔류 · ${tshort(tid)} 설득 통했다`, b=i===0?`${tshort(tid)}이(가) 최고 대우를 약속했다는 후문입니다.`:`단장이 직접 집을 찾아가 육성 계획을 설명한 것이 마음을 돌렸다는 후문입니다.`;
    if(tid===G.user)news('드래프트',t,b,1,{ref:p.id}); else wire('드래프트',t,{tid,ref:p.id}); return true; }
  p.mlb=clamp(mlbOf(p)+5,0,100); if(tid!==G.user)wire('드래프트',`${tshort(tid)}, ${p.name} 설득 실패 · 미국행 기울어`,{tid,ref:p.id}); return false; }
/* AI 1순위 구단: 자기 지명 순위 1위인 선수만 설득한다. 유망주 수집·흥행 구단은 현금이 넉넉하면(비용의 2배) 최고 대우, 아니면 직접 설득(돈이 들지 않는다) */
function usHsAi(tid,p,C){ const t=team(tid); if(!t)return; let need={}; try{ need=draftNeed(tid); }catch(e){} const L=C.slice().sort((a,b)=>aiDraftScore(tid,b,need)-aiDraftScore(tid,a,need)); if(L[0]!==p)return;
  const pl=planOf(t), i=(pl==='build'||pl==='star'||pl==='next')&&spendable(tid)>=usHsCost(p,0)*2?0:1; usHsTry(tid,p,i); }
/* 고교 선수 MLB 직행: 7월 10일 무렵 고교 최대어 일부에게 미국 구단 제안. 1라운드 1순위 구단이 우리면 설득을 시도할 수 있다. 8월 20일까지 남지 않으면 떠난다 */
function hsUsDaily(){ const D=G.draftClass; if(!D||!D.length||G.unemp&&false)return; const C=D.map(id=>G.players[id]).filter(p=>p&&p.prospect);
  if(G.day===KD(7,10)){ /* 대졸 최대어도 미국 구단이 본다(사용자 11-11: 대학 4년 최대어가 그대로 드래프트에 나옴). 미국 스카우트는 실제 능력을 본다: 잠재력과 지금 능력을 함께 */ const usV=p=>p.pot+(p.college?Math.max(0,ovr(p)-50)*.5:0); const top=C.filter(p=>p.college?p.pot>=US_HS.co&&ovr(p)>=US_HS.coO:p.pot>=US_HS.hs).sort((a,b)=>usV(b)-usV(a)).slice(0,US_HS.top); let k=0;
    for(const p of top){ if(k>=US_HS.max||R()>=US_HS.p)continue; k++; const bonus=Math.round(clamp((p.pot-56)*25+N(0,20),60,300)); p.usOff={club:pick(MLBT),bonus,y:G.year};
      wire('드래프트',`${p.college?'대학':'고교'} 최대어 ${p.name}(${p.school}), MLB 직행 검토 · ${p.usOff.club} 계약금 ${usdKw(bonus)} 제시설`,{ref:p.id});
      let first=null; try{ first=draftPickOrder()[0]; }catch(e){}
      if(first&&(first.tid!==G.user||G.unemp)){ usHsAi(first.tid,p,C); continue; } /* AI 1순위 구단도 같은 선택지로 설득한다(해외 활성화 1-3) */
      if(first&&first.tid===G.user&&!G.unemp){ const mv=mlbOf(p);
        evNew('usHs',`${p.name}, 미국 직행이냐 우리 1순위냐`,`${p.school} ${posLabel(p)} ${p.name}에게 ${p.usOff.club} 구단이 계약금 ${usdKw(bonus)}를 제시했습니다. 우리 구단이 올해 1라운드 1순위입니다. 선수는 메이저리그 의지 ${mv}로 고민 중입니다.`,
          [{l:'최고 대우로 설득',fx:`계약금 외 추가 ${money(Math.round(bonus*1.3))}을 약속합니다(지금 구단 현금에서 나감). 성공 가능성이 큽니다.`},{l:'단장이 직접 찾아가 설득',fx:'돈은 들지 않습니다. 선수와 부모를 만나 1군 기회와 육성 계획을 설명합니다. 성공은 반반 아래입니다.'},{l:'보내 준다',fx:'설득하지 않습니다. 다른 후보를 1순위로 준비합니다.'}],{ref:p.id,from:'스카우트팀장',data:{pid:p.id},def:2,exp:20}); } } }
  if(G.day===KD(8,20))for(const p of C){ if(!p.usOff||p.usOff.y!==G.year||p.usStay)continue; if(R()<US_HS.stay){ p.usStay=true; wire('드래프트',`${p.name}, 미국 대신 국내 드래프트 참가 결정`,{ref:p.id}); continue; }
    const club=p.usOff.club, bonus=p.usOff.bonus; G.draftClass=G.draftClass.filter(id=>id!==p.id); p.prospect=false; { const yrs=ri(3,6); ovsLeave(p,'MLB',club,yrs,Math.round(bonus/yrs),p.college?'대졸 직행':'고교 직행'); }
    if(!G.unemp)news('드래프트',`${p.name}, ${club}과 계약 · ${p.college?'대학':'고교'} 졸업 뒤 미국 직행`,`드래프트를 앞두고 ${p.college?'대학':'고교'} 최대어 한 명이 빠졌습니다. 계약금 ${usdKw(bonus)}. 드래프트 상위 지명 판도가 바뀝니다.`,0,{}); } }
/* 설득 자격·비용: 지금도 1순위를 쥐고 있고(검수 11-09c: 지명권을 넘긴 뒤에도 설득), 최고 대우는 보유 현금 안에서만(현금 0원에서 결제) */
function usHsWhy(e,i){ const p=G.players[e.data.pid]; if(i===2||!p||!p.usOff)return ''; let first=null; try{ first=draftPickOrder()[0]; }catch(x){} if(!first||first.tid!==G.user||G.unemp)return '1라운드 1순위 지명권이 이제 우리 구단에 없어 설득할 수 없습니다.';
  const cost=Math.round(p.usOff.bonus*1.3); if(i===0&&spendable(G.user)<cost)return `추가 약속 ${money(cost)}을 낼 수 없습니다(${spendTxt()}).`; return ''; }
EVH.usHs={ can:usHsWhy, pick(e,i){ const p=G.players[e.data.pid]; if(!p||!p.prospect||!p.usOff)return '이미 정리된 일입니다.';
  if(i===2){ return `${p.name}의 선택을 존중하기로 했습니다.`; } { const why=usHsWhy(e,i); if(why){ e.pick=2; return why+' 설득하지 않았습니다.'; } } /* 자동 처리로 와도 같은 조건 */
  const cost=usHsCost(p,i);
  if(usHsTry(G.user,p,i))return `설득에 성공했습니다. ${p.name}은(는) 국내 신인 드래프트에 나옵니다${cost?`(추가 약속 ${money(cost)} 지출)`:''}. 1순위로 지명하세요.`;
  return `설득에 실패했습니다. ${p.name}은(는) 미국행 쪽으로 기울었습니다. 8월 20일 전후로 결정합니다.`; } };
