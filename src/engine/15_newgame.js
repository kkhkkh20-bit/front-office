/* ===== 새 게임 ===== */
function buildWorld(){ const userTid=0;
  G={ver:4,year:2026,day:0,user:userTid,teams:[],players:{},nextId:1,history:[],log:[],lg:{},lineup:{},mail:[],stops:[],games:[],offers:[],mgr:{},mmarket:[],med:{prev:1,hosp:'none'},spend:{mgr:0,med:0,hosp:0,dev:0,intl:0,fac:0},intl:{us:1,la:0,jp:0,tw:0,au:0},fac:{lv:2,build:null},devProg:[],ovs:[],tut:{step:0,done:false},tutFlags:{},
     scouts:[],scoutMarket:[],marketing:2000,draft:null,fa:null,trades:[],last:null,gameOver:null,contract:null,fmarket:[],live:null};
  TEAM_DEF.forEach((d,i)=>G.teams.push(Object.assign({id:i,cash:4000,pop:1,trust:55,rel:50,owner:d.indie?'profit':pick(['win','profit','pr','win']),
    mode:'contend',scoutSd:rnd(4,9),capOver:0,expW:.5,rot:0,fac:ri(2,4)},d)));
  const bpos=['C','C','1B','1B','2B','2B','3B','3B','SS','SS','LF','LF','CF','CF','RF','RF','3B'];
  for(const t of G.teams){
    const tb=N(0,1.6);
    const mk=(isP,pos)=>{ const age=clamp(Math.round(N(27,4.6)),19,37); const T=clamp(N(48+tb,7.5),30,75);
      const cur=age<27?T-(27-age)*rnd(1.8,3.2):age<=31?T:T-(age-31)*rnd(.9,1.9);
      return newPlayer({age,isP,pos,base:clamp(cur,22,76),pot:age<27?T+N(0,3):cur,team:t.id,svc:clamp(age-19-ri(0,3),0,18)}); };
    for(let i=0;i<14;i++)mk(true);
    // 2군 선수층: 젊은 유망주와 대기 전력 (정식 선수 약 58명)
    for(let i=0;i<27;i++){ const age=clamp(Math.round(N(23,2.8)),19,30); const T=clamp(N(44+tb,7.5)+(R()<.06?rnd(4,9):0),28,74); const cur=clamp(age<26?T-(26-age)*rnd(1.6,2.8):T-rnd(2,6),20,52);
      newPlayer({age,isP:i<15,pos:i<15?undefined:pick(['C','1B','2B','3B','SS','LF','CF','RF','C','SS','2B','CF']),base:cur,pot:Math.max(cur,T),team:t.id,svc:clamp(age-19-ri(0,2),0,8)}); }
    bpos.forEach(pos=>mk(false,pos));
  }
  G.year=2025;
  for(const p of Object.values(G.players)){ const f=p.svc<4?.45:p.svc<7?.7:1; p.sal=round5(marketSal(ovr(p))*f);
    if(p.svc>=FA_SVC){ if(R()<.6){ p.faC=true; p.yrs=ri(1,4); p.cyrs=4; p.lastFA=2025-(4-p.yrs)-ri(0,2); p.faN=1; } else p.svc=FA_SVC-1-ri(0,5); } } /* 시작 시점 FA 계약은 남은 연수에 맞춰 체결 연도를 흩어 놓는다: 재자격 시기가 한 해에 몰리지 않는다 */
  for(const t of G.teams){ const target=(t.indie?8600:11100*Math.pow(t.market,.8))*rnd(.92,1.08); const ps=domestic(t.id); const cur=sum(ps.map(p=>p.sal));
    ps.forEach(p=>p.sal=round5(p.sal*target/cur));
    /* 보류권 선수는 연차별 상한을 넘지 않게 하고, 넘친 몫은 FA 계약 선수 쪽으로 돌린다 */
    let over=0; for(const p of ps){ if(!p.faC&&p.svc<faSvc(p)){ const c=PRE_CAP[clamp((p.svc||0)-1,0,PRE_CAP.length-1)]; if(p.sal>c){ over+=p.sal-c; p.sal=c; } } }
    const fc=ps.filter(p=>p.faC); const fs=sum(fc.map(p=>p.sal)); if(fs>0&&over>0)fc.forEach(p=>p.sal=round5(p.sal*(1+over/fs))); }
  G.scouts=[mkScout(ri(2,3)),mkScout(2),mkScout(2)]; G.scouts[0].role='am'; G.scouts[1].role='am'; G.scouts[1].region=REG.find(r=>r!==G.scouts[0].region); G.scouts[2].role='pro'; G.scouts[2].region='영남';
  if(G.scouts[0].region===G.scouts[1].region)G.scouts[1].region=REG.find(r=>r!==G.scouts[0].region);
  refreshScoutMarket();
  for(const t of G.teams){ const m=mkMgr(); m.yrs=ri(1,3); G.mgr[t.id]=m; }
  // 지난 시즌(2025) 기록을 실제 경기로 만든다
  G.cal=buildCalendar(2025); G.day=G.cal.open-1;
  G.sea={y:2025,rec:G.teams.map(()=>({w:0,l:0,t:0})),months:[],fspend:{},repl:{},mark:null};
  for(const t of G.teams){ for(const isP of [true,true,false]){ const p=newForeign('용병',{isP}); while(foreignCheck(t.id,p)&&p.ask>300)p.ask=round5(p.ask*.85); signForeign(t.id,p.id);} signForeign(t.id,newForeign('아시아').id); }
  G.stops=[];
  let pd=null; for(const d of Object.keys(G.cal.sched).map(Number).sort((a,b)=>a-b)){ if(pd!=null)recoverAll(d-pd); pd=d; G.day=d; for(const p of Object.values(G.players))if(p.injOut>0)p.injOut--; for(const [h,a] of G.cal.sched[d]){ const g=simGame(d,h,a,false); applyGame(d,h,a,g,false);} if(dobj(d).w===0)futuresWeek(); }
  updateLg(2025); try{ featSeason(2025); }catch(e){} const st=standingsNow();
  G.history.push({y:2025,order:st,champ:st[0].tid,runner:st[1].tid});
  for(const p of Object.values(G.players)){ p.svc++; p.injOut=0; develop(p); delete p.lastStart; delete p.lastApp; delete p.prevApp; }
  /* 시작 시점에는 'FA 자격을 채웠지만 신청하지 않고 남은 선수' 같은 특수한 경우를 만들지 않는다: FA 계약이 없는 선수는 많아야 예비 FA(올 시즌 뒤 자격) */
  /* 자격을 채운 선수는 대부분 이미 FA 계약을 맺은 것으로 본다(남은 연수를 흩어 재자격 시기가 한 해에 몰리지 않게). 나머지는 예비 FA.
     실제 KBO는 해마다 FA 자격 취득자 20~30명 수준이므로 예비 FA가 한 해에 몰리지 않게 일부는 한두 해 뒤로 미룬다 */
  for(const p of Object.values(G.players)){ if(p.foreign||p.faC)continue;
    if(p.svc>=faSvc(p)){ if(R()<.75){ p.faC=true; p.yrs=ri(1,4); p.cyrs=4; p.lastFA=2025-(4-p.yrs)-ri(0,1); p.faN=1; } else p.svc=faSvc(p)-1; }
    if(!p.faC&&p.svc===faSvc(p)-1&&R()<.45)p.svc=faSvc(p)-1-ri(1,2); }
  // 시즌을 치르고 나이 든 뒤의 능력으로 연봉을 다시 매긴다. FA 계약 선수는 계약 당시 웃돈이 조금 남아 있다
  for(const p of Object.values(G.players)){ if(p.foreign||p.team==null)continue; const f=nonFaF(p,!p.faC&&p.svc>=faSvc(p)); let v=marketSal(ovr(p))*f; if(p.faC)v*=rnd(1,1.3)*(p.yrs>=3?1.05:1); p.sal=round5(clamp(v,MIN_SAL,2500)); }
  for(const t of G.teams){ const target=(t.indie?8600:11100*Math.pow(t.market,.8))*rnd(.92,1.05); const ps=domestic(t.id); const cur=sum(ps.map(p=>p.sal)); const k=clamp(target/Math.max(1,cur),.9,1.3); ps.forEach(p=>p.sal=round5(Math.min(2600,p.sal*(p.faC?k:1+(k-1)*.4))));
    const fl=floorOf(G.year)*1.1, now=sum(ps.map(p=>p.sal)); if(now<fl){ const top=[...ps].sort((a,b)=>ovr(b)-ovr(a)).slice(0,10); const ts=sum(top.map(p=>p.sal)); const kk=(ts+fl-now)/Math.max(1,ts); top.forEach(p=>p.sal=round5(p.sal*kk)); } }
  /* 보류권 선수 연봉 상한(연차별 KBO 최고 수준). 넘친 몫은 FA 계약 선수에게 돌려 팀 연봉 규모는 유지한다 */
  for(const t of G.teams){ const ps=domestic(t.id); let over=0; for(const p of ps){ if(!p.faC){ const c=p.svc<faSvc(p)?preCap(p):700; if(p.sal>c){ over+=p.sal-c; p.sal=c; } } } const fc=ps.filter(p=>p.faC); const fs=sum(fc.map(p=>p.sal)); if(fs>0&&over>0)fc.forEach(p=>p.sal=round5(Math.max(p.sal,Math.min(p.sal*(1+over/fs),marketSal(ovr(p))*1.3,2500)))); }
  /* 오래 한 팀에서 뛴 간판 선수는 처음부터 프랜차이즈 스타 */
  for(const t of G.teams){ const L=domestic(t.id).filter(p=>p.svc>=6&&p.age>=28&&ovr(p)>=55&&(!p.faC||hn("frc",p.id)>-.2)).sort((a,b)=>ovr(b)-ovr(a)); L.slice(0,L[1]&&ovr(L[1])>=62?2:1).forEach(p=>p.fr={tid:t.id,y:2025}); }
  /* 실제 2025년처럼 대부분 구단은 상한 아래(상위권 89~96%)에 있다 */
  for(const t of G.teams){ const cap=capOf(2026), cp=capPay(t.id); const lim=cap*rnd(.88,.96); if(cp>lim){ const ps=domestic(t.id); const k=lim/cp; ps.forEach(p=>p.sal=round5(Math.max(MIN_SAL,p.sal*(p.sal>200?k:1)))); } }
  // 2026년 1월 2일에서 시작
  G.year=2026; G.cal=buildCalendar(2026); G.day=dnum(2026,1,2); G.ps=null;
  G.sea={y:2026,rec:G.teams.map(()=>({w:0,l:0,t:0})),months:[],fspend:{},repl:{},mark:null};
  G.teams.forEach(t=>{t.cash=ri(3000,5000);});
  G.fmarket=[]; refreshFMarket(12); updateModes(); makeDraftClass();
  G.stops=[]; G.games=[];
  for(const t of G.teams){ const rs=G.teams.map(x=>({id:x.id,r:teamRating(x.id)})); const a=avg(rs.map(x=>x.r)); t.expW=clamp(.5+(teamRating(t.id)-a)*.03,.36,.64); }
  G.proj=G.teams.map(x=>({id:x.id,r:teamRating(x.id)+hn('proj'+G.year,x.id)*.7})).sort((p,q)=>q.r-p.r).map(x=>x.id);
  try{ G.preview=worldPreview(); }catch(e){ G.preview=null; }
}
function claimTeam(userTid){ G.user=userTid; G.gmSince=G.year; delete G.preview; G.lineup={}; team(userTid).cash=4000;
  if(G.scouts[2])G.scouts[2].region=TEAM_DEF[userTid].region==='수도권'?'영남':'수도권';
  for(const p of foreignOf(userTid)) delete G.players[p.id];
  G.r68=true; for(const p of Object.values(G.players)){ delete p.story; delete p.cum; delete p.fl; cumInit(p); } G.mgr[userTid]=null; refreshMgrMarket(); G.coach=null; coachInit(); for(const t of G.teams)delete t.gm; G.rep=50; G.jobs=[]; G.lgTrades=[]; G.gmc={}; gmInit(); G.ob=null; G.obFace={}; try{ obInit(); refreshCoachMarket(); refreshScoutMarket(); }catch(e){} G.mail=[]; G.stops=[]; G.spend={mgr:0,med:0,hosp:0,dev:0,intl:0,fac:0}; G.intl={us:1,la:0,jp:0,tw:0,au:0}; G.fac={lv:2,build:null}; G.pr=null; G.news=[]; G.ownerLog=[]; prInit(); for(const p of Object.values(G.players))milInit(p);
  for(const p of Object.values(G.players)){ if(p.team!=null){ p.mor=clamp(Math.round(N(62,9)),30,88);} }
  addLog(`${tname(userTid)} 단장에 취임했습니다. ${OWNER[team(userTid).owner].msg}`); chron('join','단장 취임',null,userTid);
  mail('구단주실','구단주 서신',`${tname(userTid)}의 새 단장을 맡아 주셔서 감사합니다. ${OWNER[team(userTid).owner].msg} 기대 승률은 약 ${fmt3(team(userTid).expW)}입니다. 구단 운영을 믿고 맡기겠습니다.`,{kind:'구단주'});
  planSup(); try{ ovrSnap(); growSnap(); }catch(e){}
  try{ const b=budget(); const ci=capInfo(userTid); if(b.roomGoal<0||ci.over>0){ team(userTid).tight=G.year;
    mail('운영팀','재정 압박 구단입니다',`올해 예상 지출이 구단주가 정한 지원 한도를 ${money(-Math.min(0,b.roomGoal))} 넘습니다.${ci.over>0?` 연봉 총액(${money(ci.pay)})이 샐러리캡(${money(ci.cap)})도 ${money(ci.over)} 넘어 경쟁균형세가 붙습니다.`:''}\n\n이 구단의 첫 과제는 연봉 정리입니다. 고액 연봉 선수를 트레이드하거나, 외국인 선수 몸값을 낮추거나, 구단주에게 지원을 요청할 수 있습니다. 한도를 넘긴 채 시즌을 마치면 구단주 신뢰가 떨어집니다.`,{kind:'재정',acts:[{l:'재정 보기',a:'go',v:'club:fin'}]}); } }catch(e){}
  sendTut(); tutTick(); G.stops=[];
}
function newGame(userTid){ buildWorld(); claimTeam(userTid); G.moves=[]; }
