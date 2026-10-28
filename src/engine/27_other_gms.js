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
    return {msg:`${g.name} 단장과 저녁 식사를 했습니다(1천만 원). 친분 +${d}. ${g.trait==='hard'?'식사는 즐겁게 했지만 협상은 별개라고 선을 긋습니다.':'다음 거래 때 잘 봐 달라는 말이 오갔습니다.'}${(()=>{ /* 식사 자리에서 속내를 조금 듣는다: 우리 선수 중 누구를 탐내는지 */ try{ const L=aiInterest(tid).map(x=>typeof x==='object'?x:G.players[x]).filter(Boolean); return L.length?` 술잔이 돌자 ${L[0].name}(${posLabel(L[0])}) 이야기를 슬쩍 꺼냈습니다.`:' 지금은 우리 선수에게 특별히 눈독 들이는 사람은 없어 보입니다.'; }catch(e){ return ''; } })()}`,ok:true}; }
  return {msg:''}; }
/* 역제안: 조금 모자랄 때 상대가 조건을 바꿔 다시 제시 */
function counterOffer(tid,give,get,cash){ cash=cash||0; const e=evalTrade(tid,give,get,cash); const gap=e.need-e.gain; if(gap<=0||gap>9)return [];
  const out=[]; const U=team(G.user);
  const add=domestic(G.user).filter(p=>!give.includes(p.id)&&!(p.joinY>G.year)&&!p.ys&&healthy(p)).map(p=>({p,ng:give.concat(p.id)})).filter(x=>{ const e2=evalTrade(tid,x.ng,get,cash); return e2.ok&&e2.theirN<=ROSTER_MAX; }).map(x=>({...x,c:tval(U,x.p,'out')})).sort((a,b)=>a.c-b.c)[0];
  if(add)out.push({give:add.ng,get:[...get],why:`${add.p.name}을(를) 더 얹어 주시면 하겠습니다.`});
  if(get.length>1){ for(const id of [...get].sort((a,b)=>tval(team(tid),G.players[b],'out')-tval(team(tid),G.players[a],'out'))){ const ng=get.filter(x=>x!==id); if(evalTrade(tid,give,ng,cash).ok){ out.push({give:[...give],get:ng,why:`${G.players[id].name}은(는) 못 드립니다. 나머지로 하시죠.`}); break; } } }
  if(out.length<2&&get.length===1){ const p=G.players[get[0]]; const k=pSlot(p); const alt=domestic(tid).filter(q=>q.id!==p.id&&!q.ys&&healthy(q)&&pSlot(q)===k).map(q=>({q,e:evalTrade(tid,give,[q.id],cash)})).filter(x=>x.e.ok).sort((a,b)=>ovr(b.q)-ovr(a.q))[0];
    if(alt&&ovr(alt.q)>=ovr(p)-8)out.push({give:[...give],get:[alt.q.id],why:`${p.name} 대신 ${alt.q.name}(${posLabel(alt.q)})이면 됩니다.`}); }
  return gmTrait(tid)==='hard'?out.slice(0,1):out.slice(0,2); }
const NEG_MONTH=4;
function negTurn(tid){ G.gmc=G.gmc||{}; const c=G.gmc[tid]||(G.gmc[tid]={}); const o=dobj(G.day); const mk=o.y*100+o.m; if(c.negM!==mk){ c.negM=mk; c.neg=0; } delete c.negDay; c.seen=c.seen||{}; for(const k in c.seen)if(c.seen[k]<G.day-30)delete c.seen[k]; return c; }
/* 맞대결: 오늘(쉬는 날이면 내일) 우리와 경기하는 구단은 경기장에서 만나므로 횟수 제한이 없다 */
function seriesOpp(){ const c=G.cal; if(!c||!c.sched)return null; for(const d of [G.day,G.day+1]){ const gs=c.sched[d]; if(!gs)continue; const m=gs.find(x=>x.includes(G.user)); return m?(m[0]===G.user?m[1]:m[0]):null; } return null; }
function negInfo(tid){ const c=negTurn(tid); const free=seriesOpp()===tid; const o=dobj(G.day); const nx=o.m===12?1:o.m+1; const cap=negCap(tid); return {used:c.neg,cap,left:free?99:Math.max(0,cap-c.neg),free,next:`${nx}월 1일`}; }
const tsig=(give,get,cash)=>[...give].sort((a,b)=>a-b).join(',')+'|'+[...get].sort((a,b)=>a-b).join(',')+(cash>0?'|c'+cash:'');
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
    G.lgTrades.unshift({y:G.year,d:G.day,a:A.id,b:B.id,ag:gets.map(q=>q.id),bg:give,snap}); gets.forEach(q=>mvLog('트레이드',q,B.id,A.id)); give.forEach(id=>mvLog('트레이드',G.players[id],A.id,B.id)); if(G.lgTrades.length>60)G.lgTrades.length=60;
    wire('트레이드',`${tshort(A.id)}–${tshort(B.id)} ${gets.length}대${give.length} 트레이드: ${tshort(A.id)}은(는) ${gets.map(q=>`${q.name}(${posLabel(q)})`).join(', ')}을(를) 얻고 ${give.map(id=>G.players[id].name).join(', ')}을(를) 내줬습니다.${gets.some(q=>q.aiWhy)?' 매물로 나와 있던 선수입니다.':''}`,{tid:A.id,ref:p.id});
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
  if(per==='season'&&G.day===tradeDL()){ for(let i=0;i<2;i++){ try{ if((G.offers||[]).length<4)aiOffer(); }catch(e){} } for(let i=0;i<2;i++)aiTradeTry();  }
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
  /* 스태프는 구단에 남는다: 우리 스카우트·분석원은 옛 구단 몫으로, 새 구단의 스태프를 이어받는다 */
  try{ const L=stInit(); L[old]={sc:G.scouts||[],an:anaList()}; stSync(old); const nl=L[tid]||stMakeTeam(nt); delete L[tid]; G.scouts=nl.sc; G.analysts=nl.an; }catch(e){}
  /* 옛 구단에 묶인 계약·약속·진행 중인 일은 넘어오지 않는다 */
  G.spon=null; G.capex=null; G.ivProm=[]; G.iv=null; G.stRaid=[]; G.stPo=null; G.gmPlan={};
  try{ if(period()!=='off')setGoals(); }catch(e){}
  addLog(`${tname(old)}을(를) 떠나 ${tname(tid)} 단장으로 취임했습니다.`); chron('join',`새 단장 취임`,null,tid); try{ G.tgrow=[]; ovrSnap(); growSnap(); }catch(e){}
  mail('구단주실',`${nt.city} ${nt.nick} 단장 취임`,`${tname(tid)} 단장으로 취임하셨습니다. 선수단과 코치진, 감독은 그대로 이어받습니다. 재정과 목표는 이 구단 기준으로 새로 시작합니다.\n${needText(tid)}`,{kind:'경력'}); }

