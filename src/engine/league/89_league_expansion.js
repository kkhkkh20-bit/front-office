/* ===== 리그 확장: 11·12구단 (장기 기획 11-11) =====
   흐름(게임 기준, 실제 KBO 9·10구단 창단 과정을 단순화):
   1) 추진: 게임을 시작한 지 10년째(2026년 시작이면 2036년)부터 해마다 12월 20일 10% 확률로 협회가 신생 구단 창단을 추진한다(마지막 확장 뒤 6년은 쉼). 연고 후보 도시는 리그 밖 도시.
   2) 표결: 다음 해 6월 30일 구단 표결. 리그가 건강할수록(구단 평균 현금) 통과가 쉽다. 부결되면 3년 뒤 다시.
   3) 창단 단장: 승인 직후 명성이 높은(60 이상) 단장이거나 야인이면 창단 단장 제안이 온다.
   4) 특별지명(11월 20일): 기존 구단은 국내 선수 20명을 보호하고, 신생 구단은 구단마다 보호 밖 1명을 지명한다(구단마다 보상금 10억). 나머지는 신인·독립리그 선수로 채운다.
   5) 다음 시즌 1군 진입. 일정은 구단 수에 맞게(11구단 140경기, 12구단 132경기). 첫 신인 드래프트는 1라운드 첫 순번 */
const EXP_NICK=['다이노스','위즈','히어로즈','레인저스','썬더스','팰컨스','마린스','블루윙스','스타즈','유니콘스'];
/* 창단 유예(카페 11-13: 창단 첫해 구단주 목표 7위·3주 5할 지시로 1년 만에 경질). 실제 KBO도 NC(2013)·KT(2015)에 몇 해 시간을 줬다.
   1군 첫 시즌부터 3시즌(창단 겨울 포함)은 구단주 목표를 낮추고(1년차 순위 부담 없음 → 2년차 탈꼴찌 → 3년차 뒤에서 셋째), 단기 승률 지시를 내리지 않으며,
   성적 때문에 신뢰가 크게 깎이거나 단장(사용자·AI)·AI 감독이 성적으로 경질되지 않는다. 자금이 바닥나는 재정 사고는 유예와 상관없이 책임을 묻는다 */
const EXP_GRACE=3;
function expYr(tid,y){ const t=tid!=null&&typeof G!=='undefined'&&G&&G.teams?G.teams[tid]:null; if(!t||!t.born)return 0; const n=(y??G.year)-t.born+1; return n>=0&&n<=EXP_GRACE?Math.max(1,n):0; } /* 창단 n년차(유예 중일 때만, 아니면 0) */
function expGraceRank(tid,y){ const n=expYr(tid,y); if(!n)return null; const N=G.teams.length; return n===1?N:n===2?N-1:N-2; } /* 1년차는 순위 목표 없음(N위), 2년차 탈꼴찌, 3년차 뒤에서 셋째 */
function expGraceTxt(tid,y){ const n=expYr(tid,y); return n?`창단 ${n}년차 유예(${EXP_GRACE}년차까지): 구단주가 성적보다 기반을 봅니다. 성적으로는 경질되지 않습니다.`:''; }
function expFinDisaster(tid){ const t=team(tid); return (t.cash||0)<-8000*(typeof ecoIdx==='function'?ecoIdx():1); } /* 유예 중에도 책임을 묻는 재정 사고: 현금 -80억 아래 */
function expInit(){ return G.exp=G.exp||{stage:'idle',last:null,cool:null,hist:[]}; }
function expDaily(day){ const E=expInit(); const o=dobj(day);
  if(o.m===12&&o.d===31)try{ expFBonusEnd(); }catch(e){}
  if(o.m===12&&o.d===20&&E.stage==='idle'&&G.teams.length<12&&G.year>=(G.startY||2026)+10&&!(E.cool&&G.year<E.cool)&&!(E.last&&G.year-E.last<6)&&R()<.1)expPropose(); /* 사용자 11-11: 2030년보다 한참 뒤에. 게임 시작 10년째부터 해마다 10% */
  if(o.m===6&&o.d===30&&E.stage==='talk'&&E.y0<G.year)expVote();
  if(o.m===11&&o.d===20&&E.stage==='approved'&&E.ay===G.year)expDraft(); }
function expPropose(){ const E=expInit(); const C=(typeof ciCityPool==='function'?ciCityPool():[]).filter(c=>!G.teams.some(t=>t.city===c.city)); if(!C.length)return; const c=pick(C);
  const used=new Set(G.teams.map(t=>t.nick)); const nick=pick(EXP_NICK.filter(n=>!used.has(n)))||'뉴스타즈'; const par=(typeof ownershipParent==='function'?ownershipParent({id:G.teams.length,indie:false},7).name:'새 기업');
  Object.assign(E,{stage:'talk',y0:G.year,city:c.city,region:c.region,market:c.market,nick,parent:par});
  news('리그',`${ASSOC.s}, ${G.teams.length+1}번째 구단 창단 추진`,`${par}이(가) ${c.city}를 연고로 하는 신생 구단 창단을 신청했습니다. 내년 6월 30일 구단 표결로 승인 여부를 정합니다.`,2,{});
  if(!G.unemp)mail(ASSOC.s,`${G.teams.length+1}번째 구단 창단 추진 안내`,`${c.city} 연고, ${par} 운영 예정. 승인되면 그해 11월 특별지명(구단마다 보호 20명 밖 1명, 보상금 10억)을 거쳐 다음 시즌 1군에 들어옵니다.`,{kind:'리그'}); }
function expVote(){ const E=expInit(); const cashOk=avg(G.teams.map(t=>t.cash||0))>-500; const yes=G.teams.filter(t=>R()<(cashOk?.72:.45)+(t.market<1?.05:-.05)).length, need=Math.ceil(G.teams.length*2/3);
  E.votes={yes,no:G.teams.length-yes,need};
  if(yes<need){ E.stage='idle'; E.cool=G.year+3; E.hist.push({y:G.year,city:E.city,ok:false}); news('리그',`${E.city} 신생 구단 창단안 부결`,`찬성 ${yes} · 반대 ${G.teams.length-yes}(필요 ${need}). ${E.cool}년 이후 다시 논의할 수 있습니다.`,1,{}); return; }
  E.stage='approved'; E.ay=G.year; news('리그',`${E.city} ${E.nick}, ${G.teams.length+1}번째 구단 창단 승인`,`찬성 ${yes} · 반대 ${G.teams.length-yes}. 11월 20일 특별지명을 거쳐 ${G.year+1}시즌 1군에 들어옵니다.`,2,{});
  expGmOffer(); }
function expGmOffer(){ const E=expInit(); if(G.gameOver||!(G.unemp||(G.rep??50)>=60))return; E.gmAsk=G.year;
  evNew('expGm',`신생 구단 ${E.city} ${E.nick}의 창단 단장 제안`,`${E.parent}: "새 구단의 첫 단장을 맡아 주십시오. 특별지명부터 코칭스태프 구성까지 처음부터 함께 만들고 싶습니다."`,[{l:'창단 단장 수락',fx:`11월 20일 특별지명 때 ${E.city} ${E.nick} 단장으로 옮깁니다. 지금 구단은 그때 떠납니다.`},{l:'정중히 거절',fx:'지금 자리에 남습니다.'}],{def:1,exp:30,data:{},from:E.parent}); }
EVH.expGm={ pick(e,i){ const E=expInit(); if(i===0){ E.userGm=true; return `${E.city} ${E.nick} 창단 단장으로 가기로 했습니다. 11월 20일 특별지명 때 부임합니다.`; } E.userGm=false; return '제안을 거절했습니다.'; } };
/* 새 구단 만들기 */
function expAddTeam(){ const E=expInit(), id=G.teams.length; const t={id,city:E.city,nick:E.nick,code:E.city.slice(0,2),hue:Math.round(u01('expHue',id)*360),market:E.market||.88,region:E.region||'충청',cash:4000,pop:.9,trust:60,rel:50,owner:'pr',mode:'rebuild',scoutSd:rnd(4,9),capOver:0,expW:.5,rot:0,fac:2,born:G.year+1};
  G.teams.push(t); const S=stadOf(id); S.name=`${E.city} 야구장`; S.cap=17000; S.built=G.year-ri(5,25); S.dim={lf:98,cf:121,rf:98,wl:3,wc:3,wr:3};
  G.mgr[id]=mkMgr(); G.mgr[id].yrs=3; try{ coachInit(); }catch(e){} if(G.sea&&G.sea.rec&&!G.sea.rec[id])G.sea.rec[id]={w:0,l:0,t:0}; try{ ownershipInit(); }catch(e){} try{ if(G.lgStaff&&!G.lgStaff[id]){ G.lgStaff[id]=stMakeTeam(t); stSync(id); } }catch(e){} /* 스카우트·분석원 */
  try{ chron('found',`${E.city} ${E.nick} 창단 · ${G.year+1}시즌 1군 진입`,null,id,{source:'found:'+id}); }catch(e){} return id; }
/* 특별지명 */
function expDraft(){ const E=expInit(); const tid=expAddTeam(); const t=team(tid); const L=[]; let pay=0;
  for(const o of G.teams){ if(o.id===tid)continue; const pool=domestic(o.id).filter(p=>!p.prospect&&!(p.joinY>G.year)&&!(p.mil&&p.mil.until>G.day));
    const prot=new Set(pool.slice().sort((a,b)=>aiVal(o,b)-aiVal(o,a)).slice(0,20).map(p=>p.id)); const cand=pool.filter(p=>!prot.has(p.id)).sort((a,b)=>aiVal(t,b)-aiVal(t,a))[0]; if(!cand)continue;
    mvLog('특별지명',cand,o.id,tid); cand.team=tid; delete cand.listed; delete cand.aiListed; L.push(`${tshort(o.id)} ${cand.name}(${posLabel(cand)}, ${dv(ovr(cand))})`); o.cash+=1000; pay+=1000; }
  E.comp=pay; /* 보상금은 모기업이 창단 출자금으로 따로 낸다(실제 KBO 신생 구단처럼). 구단 운영 자금에서 빼면 첫 시즌 전부터 -60억으로 시작해 빚이 불어났다(창단 테스트 11-13) */
  /* 나머지: 독립리그·신인급으로 국내 선수 50명까지 */
  const bpos=['C','C','C','1B','2B','2B','3B','SS','SS','LF','CF','CF','RF']; let i=0; while(domestic(tid).length<50&&i<80){ const isP=domestic(tid).filter(p=>p.isP).length<26; const age=ri(20,31), b=clamp(N(41,5),28,56);
    const p=newPlayer({age,isP,pos:isP?undefined:bpos[i%bpos.length],base:b,pot:b+ri(0,age<=25?12:4),team:tid,svc:clamp(age-20,0,8)}); p.sal=round5(Math.max(MIN_SAL,marketSal(ovr(p))*.5)); i++; }
  E.stage='done'; E.last=G.year; E.tid=tid; E.hist.push({y:G.year,city:E.city,ok:true,tid});
  news('리그',`${tshort(tid)} 특별지명 결과`,`구단마다 보호선수 20명 밖에서 1명씩 지명했습니다(보상금 구단당 10억, ${E.parent} 창단 출자금으로 지급).\n`+L.join('\n'),2,{tid});
  if(E.userGm&&!G.gameOver){ try{ const wasU=!!G.unemp; if(!wasU&&G.myC&&G.myC.tid!=null){ myCEnd('이직'); myCRenewClose(); } G.gmSince=G.year; G.gmSinceD=G.day; switchTeam(tid);
      try{ myCStart(tid,{sal:Math.max(myCBase(tid),wasU?0:(G.myC&&G.myC.sal)||0),yrs:EXP_GRACE+1},'창단 단장'); }catch(e){} /* 단장 계약도 새 구단으로(창단 테스트 11-13: 옛 구단 계약이 남아 유예 중 계약 만료 판정) */ mail(E.parent,`${tshort(tid)} 창단 단장 부임`,`특별지명으로 ${L.length}명을 데려왔습니다. 외국인 선수와 코칭스태프를 채우고 첫 시즌을 준비해 주십시오.\n\n당장 성적을 바라지는 않습니다. ${G.year+1}~${G.year+EXP_GRACE}시즌(창단 ${EXP_GRACE}년차까지)은 순위보다 선수 육성과 팬 기반을 보겠습니다. 첫해 순위 목표는 두지 않고, 2년차 탈꼴찌, 3년차부터 조금씩 올려 가겠습니다.\n\n`+L.join('\n'),{kind:'구단',imp:true}); }catch(e){} }
  return tid; }

/* 신생 구단 외국인 혜택이 끝나는 겨울(12월 31일): 일반 외국인이 3명을 넘으면 가장 낮은 선수를 내보낸다(우리 구단이면 소식으로 알린다) */
function expFBonusEnd(){ for(const t of G.teams){ if(!t.born||!fNewBonus(t.id,G.year)||fNewBonus(t.id,G.year+1))continue; /* 혜택이 올해로 끝나는 신생 구단만(플레이 테스트 11-13: 일반 구단에 '신생 구단 혜택 종료' 방출) */ const yb=fStayOf(t.id).filter(p=>p.foreign==='용병'); /* 재계약 기간에 결별하기로 한 선수는 이미 빈자리(영입 검사와 같은 기준) */ const max=fMaxYB(t.id,G.year+1); if(yb.length<=max)continue;
  for(const p of yb.sort((a,b)=>ovr(a)-ovr(b)).slice(0,yb.length-max)){ const nm=p.name; try{ toFree(p,'신생 구단 외국인 혜택 종료'); }catch(e){ p.team=null; } if(t.id===G.user&&!G.unemp)mail(ASSOC.s,`신생 구단 외국인 혜택 종료: ${nm} 방출`,`신생 구단 혜택(일반 외국인 4명)이 끝나 3명 한도를 넘는 ${nm}을(를) 방출했습니다.`,{kind:'구단',imp:true}); } } }
