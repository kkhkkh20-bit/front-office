/* ===== 리그 확장: 11·12구단 (장기 기획 11-11) =====
   흐름(게임 기준, 실제 KBO 9·10구단 창단 과정을 단순화):
   1) 추진: 2030년 이후 해마다 12월 20일 12% 확률로 협회가 신생 구단 창단을 추진한다(마지막 확장 뒤 5년은 쉼). 연고 후보 도시는 리그 밖 도시.
   2) 표결: 다음 해 6월 30일 구단 표결. 리그가 건강할수록(구단 평균 현금) 통과가 쉽다. 부결되면 3년 뒤 다시.
   3) 창단 단장: 승인 직후 명성이 높은(60 이상) 단장이거나 야인이면 창단 단장 제안이 온다.
   4) 특별지명(11월 20일): 기존 구단은 국내 선수 20명을 보호하고, 신생 구단은 구단마다 보호 밖 1명을 지명한다(구단마다 보상금 10억). 나머지는 신인·독립리그 선수로 채운다.
   5) 다음 시즌 1군 진입. 일정은 구단 수에 맞게(11구단 140경기, 12구단 132경기). 첫 신인 드래프트는 1라운드 첫 순번 */
const EXP_NICK=['다이노스','위즈','히어로즈','레인저스','썬더스','팰컨스','마린스','블루윙스','스타즈','유니콘스'];
function expInit(){ return G.exp=G.exp||{stage:'idle',last:null,cool:null,hist:[]}; }
function expDaily(day){ const E=expInit(); const o=dobj(day);
  if(o.m===12&&o.d===20&&E.stage==='idle'&&G.teams.length<12&&G.year>=2030&&!(E.cool&&G.year<E.cool)&&!(E.last&&G.year-E.last<5)&&R()<.12)expPropose();
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
  t.cash-=pay;
  /* 나머지: 독립리그·신인급으로 국내 선수 50명까지 */
  const bpos=['C','C','C','1B','2B','2B','3B','SS','SS','LF','CF','CF','RF']; let i=0; while(domestic(tid).length<50&&i<80){ const isP=domestic(tid).filter(p=>p.isP).length<26; const age=ri(20,31), b=clamp(N(41,5),28,56);
    const p=newPlayer({age,isP,pos:isP?undefined:bpos[i%bpos.length],base:b,pot:b+ri(0,age<=25?12:4),team:tid,svc:clamp(age-20,0,8)}); p.sal=round5(Math.max(MIN_SAL,marketSal(ovr(p))*.5)); i++; }
  E.stage='done'; E.last=G.year; E.tid=tid; E.hist.push({y:G.year,city:E.city,ok:true,tid});
  news('리그',`${tshort(tid)} 특별지명 결과`,`구단마다 보호선수 20명 밖에서 1명씩 지명했습니다(보상금 구단당 10억).\n`+L.join('\n'),2,{tid});
  if(E.userGm&&!G.gameOver){ try{ switchTeam(tid); mail(E.parent,`${tshort(tid)} 창단 단장 부임`,`특별지명으로 ${L.length}명을 데려왔습니다. 외국인 선수와 코칭스태프를 채우고 첫 시즌을 준비해 주십시오.\n\n`+L.join('\n'),{kind:'구단',imp:true}); }catch(e){} }
  return tid; }
