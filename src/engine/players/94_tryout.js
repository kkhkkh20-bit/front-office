/* ===== 트라이아웃 · 새 선수 유입 길 =====
   원래 있던 길: 신인 드래프트(9월), 2차 드래프트, 웨이버, FA, 무적 선수(방출·FA 미계약, 44_free_agents), 새해 독립리그 출신 무적 선수(freeIndie),
   해외 복귀(2년 유예 뒤 드래프트, 35_abroad·10_draft), 외국인.
   더한 길(KBO 관행을 게임 규칙으로):
   1) 미지명 선수 육성 계약: 드래프트에서 지명받지 못한 고교·대학 선수 중 재목 TRY_UD명은 바로 지우지 않고 '미지명 신인'으로 남긴다.
      드래프트 직후부터 트라이아웃 계약 마감(1월 20일)까지 육성선수로만 계약할 수 있다(정식 등록은 기존 규정대로 이듬해 5월 1일부터). 못 데려가면 대학·독립리그로 떠난다.
   2) KBO 공개 트라이아웃: 11월 24일 참가 명단 공개 → 12월 2일 테스트 → 이듬해 1월 20일까지 계약.
      참가: 방출 선수(34세 이하 무적 선수 중 신청자) · 독립리그 선수(해마다 새로 TRY_INDIE명 안팎) · 미지명 신인 · 해외 복귀 선수.
      해외 복귀 선수는 2년 유예(KBO 규약) 중이라 테스트만 보고 계약은 못 한다(유예가 끝나는 해 신인 드래프트로 나온다).
      테스트 날 모든 구단 스카우트가 지켜본다. 단장이 직접 가면(달력 단장 일정 '트라이아웃 참관') 평가 오차가 크게 준다. 다른 구단 단장도 같은 확률로 직접 온다.
      계약: 육성선수(육성 한도 YS_MAX, 연봉 최저) 또는 정식 선수(정원 ROSTER_MAX, 최저연봉 · 방출 선수는 무적 시장 요구액 freeAsk).
   3) 독립리그 선수 능력: 대부분 2군 수준(28~46), 7%는 늦게 피는 유형(잠재력 +8~14, 스카우트 눈에 잘 안 보인다).
      포수·유격수는 드물고(야수 중 5%·4%) 대개 약하다: 포지션 희소성(01_rules TOPK)을 풀지 않는다.
   AI 구단: 조직의 포지션별 인원으로 본 필요, 빈 자리(정원·육성 한도), 자기 스카우트 오차로 본 추정치로 고른다(구단당 한 해 최대 TRY_AI_MAX명).
   사람 단장과 같은 계약 함수(trySign)·같은 한도·같은 연봉을 쓴다. 판단 난수는 해시(relU·hn)라 경기 난수를 쓰지 않는다.
   선수 수: 못 데려간 미지명 신인은 마감일에 지우고, 독립리그 선수는 무적 선수처럼 2년 뒤 은퇴한다(freeYear). 새해 freeIndie는 무적 시장 최소 인원만 채우므로 선수 풀이 계속 불어나지 않는다. */
const TRY_UD=30, TRY_INDIE=[10,14], TRY_AI_MAX=3, TRY_VET_AGE=34;
const TRY_INDIE_T=['한강 독립야구단','경기 브레이커스','남한산 파이어스','동해 레인저스','남부 스톰즈','서해 마린스','중원 타이거즈'];
const TRY_K={vet:'방출 선수',indie:'독립리그',ud:'미지명 신인',ovs:'해외 복귀'};
const tryAnnD=y=>dnum(y,11,24), tryDayD=y=>dnum(y,12,2), tryCloseD=y=>dnum(y+1,1,20);
/* 지금 열려 있는(또는 준비 중인) 트라이아웃: 드래프트 해 기준 y. 1월에는 지난해 것 */
function tryCur(){ const T=G.tryout; if(!T)return null; return G.day<=tryCloseD(T.y)&&!T.done?T:null; }
function tryIsDay(d){ return d===tryDayD(dobj(d).y); }
function tryKind(p){ return p&&(p.tryK||(p.ovsWait?'ovs':null)); }
/* 드래프트가 끝날 때(11_founding_draft finishDraft): 미지명 중 재목만 남긴다 */
function tryUdPick(cls){ const L=(cls||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&!p.ovsRet); return new Set(L.map(p=>({p,v:p.pot*.7+ovr(p)*.3+hn('tryud',p.id)*2})).sort((a,b)=>b.v-a.v).slice(0,TRY_UD).map(x=>x.p.id)); }
function tryUdKeep(p,y){ p.prospect=false; p.team=null; p.tryK='ud'; p.udY=y; delete p.press; story(p,`${y} 신인 드래프트 미지명 · 육성선수 계약을 기다리는 중`,'draft');
  const T=tryInit(y); if(!T.ids.includes(p.id))T.ids.push(p.id); }
function tryInit(y){ let T=G.tryout; if(!T||T.y!==y)T=G.tryout={y,ids:[],att:{},res:{},n:{},ann:null,day:tryDayD(y),close:tryCloseD(y),done:false}; return T; }
/* 독립리그 선수 한 명: 대부분 2군 수준, 가끔 늦게 피는 유형. 포수·유격수는 드물고 약하다 */
function tryIndieMake(y){ const isP=R()<.55; const x=R(); const pos=isP?'P':x<.05?'C':x<.09?'SS':x<.22?'2B':x<.35?'3B':x<.5?'1B':x<.65?'LF':x<.8?'CF':'RF';
  const age=ri(21,28); let b=clamp(N(36,4.5),28,46); if(pos==='C'||pos==='SS')b=Math.min(b,40)-2; const late=R()<.07;
  const p=newPlayer({age,isP,pos,base:b,pot:b+ri(0,age<=24?8:3)+(late?ri(8,14):0)}); if(late){ p.dt='late'; p.pot=Math.min(p.pot,60); }
  p.freeSince=y; p.freeDay=G.day; p.tryK='indie'; p.indieT=pick(TRY_INDIE_T); story(p,`독립리그 ${p.indieT}에서 뛰며 프로 입단 준비`,'move'); return p; }
/* 참가 명단 공개(11월 24일) */
function tryAnnounce(y){ const T=tryInit(y); if(T.ann!=null)return T; T.ann=G.day;
  for(const p of freeList()){ if(T.ids.includes(p.id))continue; if(p.age<=TRY_VET_AGE&&ovr(p)>=28&&(p.tryK==='indie'||relU('tryvet'+y,p.id)<.65))T.ids.push(p.id); } /* 무적 선수 신청자(방출·독립리그) */
  const k=ri(TRY_INDIE[0],TRY_INDIE[1]); for(let i=0;i<k;i++)T.ids.push(tryIndieMake(y).id);
  for(const p of Object.values(G.players))if(p.ovsWait&&p.ovsWait>y&&p.team==null&&!p.prospect&&!T.ids.includes(p.id))T.ids.push(p.id); /* 해외 복귀 유예 중: 테스트만 */
  T.ids=T.ids.filter(id=>{ const p=G.players[id]; return p&&p.team==null; });
  for(const id of T.ids){ const p=G.players[id]; const kd=tryKindOf(p); T.n[kd]=(T.n[kd]||0)+1; }
  if(!G.unemp){ const n=T.n; mail('스카우트팀장',`KBO 공개 트라이아웃 명단 · ${T.ids.length}명`,`${dmd(T.day)} 테스트에 ${T.ids.length}명이 나옵니다(${Object.keys(TRY_K).filter(k=>n[k]).map(k=>TRY_K[k]+' '+n[k]).join(' · ')}). 달력에서 그날 단장 일정으로 직접 참관을 잡을 수 있습니다.`,{kind:'스카우트',acts:[{l:'트라이아웃',a:'go',v:'transfer:tryout'}]}); }
  return T; }
function tryKindOf(p){ if(!p)return 'vet'; if(p.ovsWait&&p.ovsWait>((G.tryout&&G.tryout.y)||G.year)&&p.team==null)return 'ovs'; return p.tryK==='ud'?'ud':p.tryK==='indie'?'indie':'vet'; }
/* 공개 측정(모두에게 같은 정보): 투수 최고 구속, 야수 홈→1루 */
function tryMeasure(p,y){ if(p.isP)return `최고 ${clamp(veloOf(p)+Math.round((relU('tryv'+y,p.id)-.5)*4),128,158)}km/h`; return `1루까지 ${(+runOf(p)+(relU('tryr'+y,p.id)-.5)*.12).toFixed(2)}초`; }
/* 테스트(12월 2일): 측정 기록을 남기고 직접 온 단장을 기록한다 */
function tryRun(){ const T=tryCur(); if(!T||T.ran)return; T.ran=G.day; T.ids=T.ids.filter(id=>{ const p=G.players[id]; return p&&p.team==null; });
  for(const id of T.ids){ const p=G.players[id]; T.res[id]=tryMeasure(p,T.y); }
  const q=gmPlanAt(G.day); if(!G.unemp&&q&&q.k==='tryout'&&!q.done){ q.done=true; T.att[G.user]=1; }
  for(const t of G.teams)if(t.id!==ME()&&t.gm&&!t.gm.interim&&relU('tryatt'+T.y,t.id)<.5)T.att[t.id]=1; /* 다른 구단 단장도 절반쯤 직접 온다 */
  if(!G.unemp){ const L=T.ids.map(id=>G.players[id]).filter(p=>p&&tryKindOf(p)!=='ovs').map(p=>({p,e:tryEst(p,G.user)})).sort((a,b)=>tryVal(b.e,b.p)-tryVal(a.e,a.p)).slice(0,4);
    mail('스카우트팀장',`트라이아웃 결과${T.att[G.user]?' · 단장 참관':''}`,`${T.ids.length}명이 테스트를 받았습니다.${T.att[G.user]?' 직접 보신 덕분에 평가가 더 정확합니다.':''}\n\n눈에 띈 선수\n${L.map(x=>`${x.p.name}(${posLabel(x.p)}, ${x.p.age}세, ${TRY_K[tryKindOf(x.p)]}) ${T.res[x.p.id]||''} · ${x.e.cw}`).join('\n')||'없음'}\n\n계약은 ${dmd(T.close)}까지입니다.`,{kind:'스카우트',acts:[{l:'트라이아웃',a:'go',v:'transfer:tryout'}]}); } }
/* 구단 tid가 본 추정: 현재·성장 여지를 말로, 확신은 오차로. 단장이 직접 보면 오차 0.55배 */
function trySd(p,tid){ const T=G.tryout, k=tryKindOf(p); let sd={vet:3.5,indie:6.5,ud:6,ovs:6.5}[k]||6;
  let f; if(tid===G.user){ const sk=(G.scouts||[]).reduce((a,s)=>Math.max(a,s.skill||0),0); f=SCOUT_SD[clamp(sk,0,5)]/SCOUT_SD[3]; } else f=((team(tid)||{}).scoutSd||6)/SCOUT_SD[3];
  sd*=clamp(f,.7,1.6); if(T&&T.att&&T.att[tid])sd*=.55; if(!(T&&T.ran))sd*=1.2; return sd; }
function tryEst(p,tid){ const sd=trySd(p,tid), y=(G.tryout&&G.tryout.y)||G.year; const cur=ovr(p)+hn('tryc'+tid+':'+y,p.id)*sd*.6, pot=Math.max(cur,p.pot+hn('tryp'+tid+':'+y,p.id)*sd);
  const cw=cur>=45?'1군 백업감':cur>=40?'1.5군':cur>=34?'2군 주전급':'2군 하위', g=pot-cur, pw=p.age<=25&&g>=10?'크게 클 여지':g>=5?'조금 더 클 여지':'지금이 거의 완성';
  return {cur,pot,sd,cw,pw,conf:sdConf(sd)}; }
const tryVal=(e,p)=>e.cur*.55+e.pot*.45-Math.max(0,p.age-27)*1.2;
/* 조직(1·2군·육성·내년 합류)의 포지션별 인원 → 모자란 자리 */
const TRY_NEED={P:38,C:6,SS:4,IF:12,OF:12};
const tryBk=p=>p.isP?'P':p.pos==='C'?'C':p.pos==='SS'?'SS':['LF','CF','RF'].includes(p.pos)?'OF':'IF';
function tryNeed(tid){ const n={P:0,C:0,SS:0,IF:0,OF:0}; for(const p of Object.values(G.players))if(p.team===tid&&!p.foreign)n[tryBk(p)]++; const o={}; for(const k in TRY_NEED)o[k]=Math.max(0,TRY_NEED[k]-n[k]); return o; }
const tryNextY=()=>dobj(G.day).m>=9; /* 9월 뒤 계약은 다음 시즌부터(신인과 같게) */
function tryYsN(tid){ return Object.values(G.players).filter(p=>p.team===tid&&p.ys&&!milServing(p)).length; } /* 내년 합류 육성선수까지 센다 */
function tryRegN(tid){ return rosterN(tid)+Object.values(G.players).filter(p=>p.team===tid&&!p.ys&&p.joinY>G.year).length; }
/* 계약 가능 여부(사람·AI 같은 규칙). ys: 육성선수 계약 */
function tryWhy(p,tid,ys){ const T=tryCur(); if(!T||!p||!T.ids.includes(p.id))return '트라이아웃 대상이 아닙니다.'; if(p.team!=null)return '이미 다른 구단과 계약했습니다.';
  const k=tryKindOf(p); if(k==='ovs')return `해외 복귀 2년 유예 중이라 ${p.ovsWait}년 신인 드래프트로만 데려올 수 있습니다.`;
  if(k!=='ud'&&!(T.ran&&G.day>=T.day))return `${dmd(T.day)} 테스트가 끝나야 계약할 수 있습니다.`; if(k==='ud'&&!ys)return '미지명 신인은 육성선수로만 계약할 수 있습니다.';
  if(G.day>T.close)return '계약 기간이 끝났습니다.';
  if((p.relT===tid&&G.day-(p.relD??-999)<365)||(p.relBan&&p.relBan[tid]>G.day))return '방출한 구단은 1년 동안 다시 계약할 수 없습니다.';
  if(p.wv)return '웨이버 공시 중입니다.';
  if(ys){ if(tryYsN(tid)>=YS_MAX)return `육성선수가 ${YS_MAX}명으로 꽉 찼습니다.`; if(k==='vet'&&freeAsk(p)>100)return '요구 연봉이 1억 원을 넘어 육성선수로는 계약할 수 없습니다.'; }
  else if(tryRegN(tid)>=ROSTER_MAX)return `정식 선수 자리가 없습니다(${ROSTER_MAX}명).`;
  if(tid===G.user&&G.unemp)return '구단을 맡고 있지 않습니다.'; return ''; }
function trySal(p,ys){ return tryKindOf(p)==='vet'?(ys?Math.max(MIN_SAL,Math.min(100,freeAsk(p))):freeAsk(p)):MIN_SAL; }
function trySign(id,tid,ys){ tid=tid??G.user; const p=G.players[id]; const why=tryWhy(p,tid,!!ys); if(why)return why; const T=tryCur(), k=tryKindOf(p), sal=trySal(p,!!ys);
  if(tid===G.user&&sal>MIN_SAL){ const s=sponSeason(); const cc=capOwnerCheck(capPayWith(G.user,p.id,sal,s).tot,capPayWith(G.user,null,null,s).tot,s,'try'+p.id); if(cc&&!cc.ok)return cc.msg; if(cc)capOwnerOk(cc,`트라이아웃 ${p.name} 영입`); }
  p.team=tid; p.sal=sal; p.yrs=1; p.ys=!!ys; p.e1=false; delete p.freeSince; delete p.freeDay; delete p.udY; if(tryNextY())p.joinY=G.year+1; else delete p.joinY; p.mor=clamp((p.mor??55)+8,0,100);
  p.tryS={y:T.y,k,ys:!!ys,tid,d:G.day}; delete p.tryK;
  mvLog('트라이아웃',p,null,tid,`${ys?'육성선수':'정식 선수'} · 연 ${money(sal)}`,sal); story(p,`${T.y} ${k==='ud'?'드래프트 미지명 뒤':'KBO 공개 트라이아웃'} · ${tname(tid)} ${ys?'육성선수':'정식'} 계약`,'move');
  try{ milLate(p,tid); }catch(e){}
  (G.tryLog=G.tryLog||[]).push({y:T.y,id:p.id,tid,k,ys:!!ys,d:G.day,pos:p.isP?'P':p.pos,age:p.age}); if(G.tryLog.length>300)G.tryLog.shift();
  if(tid===G.user)addLog(`${TRY_K[k]} ${p.name}(${posLabel(p)}, ${p.age}세)과(와) ${ys?'육성선수':'정식 선수'} 계약을 맺었습니다.`); else wire('이적',`${tshort(tid)}, ${TRY_K[k]} ${p.name}(${posLabel(p)}) ${ys?'육성':'정식'} 계약`,{tid,ref:p.id});
  return ''; }
/* AI 구단 하루 판단(테스트 다음 날부터 6일, 미지명은 드래프트 이틀 뒤부터 5일): 필요한 자리 + 자기 추정 + 정원/육성 여유 */
function tryAiDay(udOnly){ const T=tryCur(); if(!T)return 0; const C=T.ids.map(id=>G.players[id]).filter(p=>p&&p.team==null&&tryKindOf(p)!=='ovs'&&(!udOnly||tryKindOf(p)==='ud')); if(!C.length)return 0; let n=0;
  for(const t of G.teams){ if(t.id===ME()||G.tryLog&&G.tryLog.filter(x=>x.y===T.y&&x.tid===t.id).length>=TRY_AI_MAX)continue; if(relU('tryai'+G.day,t.id)>=.45)continue;
    const need=tryNeed(t.id); let ysRoom=YS_MAX-tryYsN(t.id); const regRoom=ROSTER_MAX-3-tryRegN(t.id);
    const own=domestic(t.id).filter(p=>!p.ys).map(ovr).sort((a,b)=>b-a), bar=own[Math.min(own.length-1,40)]||38;
    let best=null, bv=-1e9; for(const p of C){ if(p.team!=null)continue; const e=tryEst(p,t.id); const v=tryVal(e,p)+(need[tryBk(p)]||0)*1.2; if(v>bv){ bv=v; best={p,e,v}; } }
    if(!best)continue; const {p,e}=best, k=tryKindOf(p), young=p.age<=26;
    const reg=k!=='ud'&&regRoom>0&&e.cur>=bar-1, ysWant=!reg&&young&&e.pot>=40&&(k!=='vet'||freeAsk(p)<=100);
    /* 육성 자리가 꽉 찼으면 가장 기대가 낮은 육성선수(22세 이상)보다 확실히 나을 때만 그 선수를 내보내고 데려간다. 사람 단장도 방출 뒤 같은 계약을 할 수 있다 */
    if(ysWant&&ysRoom<=0){ const w=Object.values(G.players).filter(q=>q.team===t.id&&q.ys&&!milServing(q)&&q.age>=22&&!(q.tryS&&q.tryS.y===T.y)).map(q=>({q,v:ovr(q)*.55+q.pot*.45-Math.max(0,q.age-27)*1.2})).sort((a,b)=>a.v-b.v)[0];
      if(w&&best.v-(need[tryBk(p)]||0)*1.2>w.v+4){ const q=w.q; if(q.age<=33&&ovr(q)>=30)toFree(q,`${tname(t.id)}에서 방출(육성선수 정리)`); else retireOut(q,`${tname(t.id)}에서 방출된 뒤 은퇴`); ysRoom=YS_MAX-tryYsN(t.id); } }
    const ys=ysWant&&ysRoom>0;
    if(!reg&&!ys)continue; if(!trySign(p.id,t.id,ys))n++; }
  return n; }
/* 마감(1월 20일): 남은 미지명 신인은 떠나고, 독립리그·방출 선수는 무적 선수로 남는다 */
function tryClose(){ const T=G.tryout; if(!T||T.done)return; T.done=true; let gone=0;
  for(const id of T.ids){ const p=G.players[id]; if(p&&p.team==null&&p.tryK==='ud'){ if(G.shortlist)G.shortlist=G.shortlist.filter(x=>x!==id); delete G.players[id]; gone++; } }
  T.ids=T.ids.filter(id=>G.players[id]); const L=(G.tryLog||[]).filter(x=>x.y===T.y), mine=L.filter(x=>x.tid===G.user);
  if(!G.unemp)note('스카우트',`트라이아웃 계약 마감 · 리그 ${L.length}명(우리 ${mine.length}명). 남은 미지명 신인 ${gone}명은 대학·독립리그로 갔습니다.`); }
function tryDaily(day){ const y=dobj(day).y, m=dobj(day).m;
  if(m>=11&&day>=tryAnnD(y)&&day<=tryDayD(y)){ const T=tryInit(y); if(T.ann==null)tryAnnounce(y); }
  if(m===12&&day===tryDayD(y))tryRun();
  const T=G.tryout; if(!T||T.done)return;
  if(T.ran&&day>T.ran&&day<=T.ran+6)tryAiDay(false);
  else if(T.ud0!=null&&day>=T.ud0+2&&day<=T.ud0+6)tryAiDay(true);
  if(day>=T.close)tryClose(); }
/* 드래프트 마감 직후(11_founding_draft finishDraft에서): 미지명 신인 명단 */
function tryAfterDraft(y,kept){ if(!kept)return; const T=tryInit(y); T.ud0=G.day; if(!G.unemp&&kept>0)note('드래프트',`미지명 신인 ${kept}명과 육성선수 계약을 할 수 있습니다(${dmd(T.close)}까지). 영입·계약 → 트라이아웃에서 봅니다.`); }
