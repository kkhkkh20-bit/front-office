/* ===== 스토브리그 ===== */
/* 은퇴 기준(결산 뒤 비시즌): 국내 선수. 화면의 '은퇴 유력'과 9월 1일 은퇴 예상 소식이 같은 기준을 쓴다(커뮤니티 건의 11-11) */
function retireLikely(p){ if(!p||p.foreign||p.team==null||(p.retDelay===G.year&&p.age<=41))return false; const o=ovr(p); return p.age>=40||(p.age>=35&&o<45)||(p.age>=32&&o<35&&!p.faC); }
/* 선수단 표시 태그(커뮤니티 건의 11-11): 원클럽맨·FA 예정·은퇴 유력·포스팅 후보 */
function lifeTags(p){ const T=[]; if(!p||p.foreign)return T; try{ const R=(p.hist||[]).filter(h=>h.lvl==='1군'&&!h.y2); const ys=new Set(R.map(h=>h.y)); if(p.team!=null&&ys.size>=10&&R.every(h=>h.t===p.team))T.push({l:'원클럽맨',c:'good',d:`한 구단에서만 1군 ${ys.size}시즌`}); }catch(e){}
  try{ if(p.team!=null&&!p.prospect&&faLeft(p)<=1&&!(p.faC&&p.yrs>1))T.push({l:'FA 예정',c:'warn',d:'이번 시즌이 끝나면 FA 자격'}); }catch(e){}
  if(retireLikely(p))T.push({l:'은퇴 유력',c:'bad',d:'나이·능력으로 보아 이번 시즌 뒤 은퇴할 가능성이 큽니다'});
  if(p.team!=null&&p.lastFA==null&&!p.ovsY&&(p.svc||0)>=6&&p.age<=32&&ovr(p)>=58)T.push({l:'포스팅 후보',c:'acc',d:'7년차·종합 상위권이면 해외 포스팅을 요청할 수 있습니다'});
  return T; }
/* 9월 1일: 이번 시즌 뒤 은퇴가 유력한 우리 선수 미리 알림. 오래 뛴 선수에게는 은퇴 투어를 제안한다 */
/* 은퇴 면담 설득 확률: 기분이 좋고 아직 쓸 만할수록, 나이가 적을수록 */
function retTalkP(p){ return clamp(.3+((p.mor??60)-60)/150+(ovr(p)>=48?.15:0)-(p.age>=39?.2:p.age>=37?.1:0),.08,.75); }
function retireNotice(){ if(G.unemp)return; const L=playersOf(G.user).filter(retireLikely); if(!L.length)return; mail('운영팀',`시즌 뒤 은퇴가 유력한 선수 ${L.length}명`,L.map(p=>`· ${p.name}(${posLabel(p)}, ${p.age}세, 연봉 ${money(p.sal)})`).join('\n')+'\n\n나이와 능력으로 보아 이번 시즌이 끝나면 유니폼을 벗을 가능성이 큽니다. 다음 시즌 연봉 계획과 전력 구성에 참고하세요.',{kind:'선수'});
  const star=L.filter(p=>{ const ys=new Set((p.hist||[]).filter(h=>h.lvl==='1군'&&h.t===G.user).map(h=>h.y)); return ys.size>=8||p.fr; }).sort((a,b)=>(b.svc||0)-(a.svc||0))[0];
  { const ten=p=>new Set((p.hist||[]).filter(h=>h.lvl==='1군'&&h.t===G.user).map(h=>h.y)).size; /* 선수가 먼저 은퇴 의사를 밝힌다(사용자 11-11): 우리 구단 1군 3시즌 이상 뛴 선수, 많아야 3명 */
    for(const q of L.filter(p=>p.age<=40&&p.retDelay!==G.year&&ten(p)>=3).sort((a,b)=>ten(b)-ten(a)).slice(0,3)){ if((G.evs||[]).some(x=>x.k==='retTalk'&&!x.done&&x.data&&x.data.pid===q.id))continue; const pr=retTalkP(q);
      evNew('retTalk',`${q.name}: "이번 시즌을 끝으로 은퇴하고 싶습니다"`,`${q.name}(${posLabel(q)}, ${q.age}세, 우리 구단 ${(()=>{ let n=ten(q); try{ const c=careerOf(q); if(!G.fd&&c.teams.size<=1)n=Math.max(n,q.svc||0); }catch(e){} return n; })()}시즌)이(가) 면담을 청해 이번 시즌을 끝으로 유니폼을 벗고 싶다고 말했습니다. 말려 볼 수도 있고, 뜻을 존중할 수도 있습니다. (말리면 마음을 바꿀 가능성 약 ${Math.round(pr*100)}% · 기분·능력·나이에 따라 다름)`,[{l:'한 해 더 뛰자고 말린다',fx:'마음을 바꾸면 이번 겨울 은퇴하지 않습니다. 실패하면 기분 -5'},{l:'뜻을 존중한다',fx:'선수 기분 +5. 시즌 뒤 은퇴하고, 은퇴식은 그때 다시 묻습니다'}],{def:1,exp:14,data:{pid:q.id},from:q.name,ref:q.id}); } } /* 은퇴 면담 */
  if(star&&!(G.evlog||[]).some(x=>x.k==='retTour'&&x.y===G.year)){ const c=Math.round(150*ecoIdx()); evNew('retTour',`${star.name} 은퇴 투어를 열까요?`,`${star.name}(${star.age}세)이(가) 이번 시즌을 끝으로 은퇴를 고민하고 있습니다. 구단에서 오래 뛴 선수라 마지막 원정 경기마다 상대 구단과 함께 작별 행사를 여는 은퇴 투어를 제안합니다.`,[{l:'은퇴 투어',fx:`행사비 ${money(c)} · 팬 여론 +3 · 선수 기분 +10`},{l:'시즌 뒤 은퇴식만',fx:'따로 행사를 열지 않습니다'}],{def:1,exp:10,data:{pid:star.id,c},from:'홍보팀'}); } }
function offseason(){ try{ if(G.startY&&G.year>=G.startY+2&&!G.fdRev&&!G.unemp)fdReview(); }catch(e){} for(const t of G.teams){ if(t.id!==G.user&&t.cash<-5000)t.mode='rebuild'; }
  const retired=[], declared=[], obs=[];
  for(const p of Object.values(G.players)){
    /* 외국인 선수도 나이가 들면 은퇴한다(40세, 또는 37세 이상에 기량이 떨어지면) */
    if(p.foreign&&p.team!=null&&(p.age>=40||(p.age>=37&&ovr(p)<52))){ retired.push({name:p.name,team:p.team,age:p.age}); try{ story(p,`${p.age}세로 은퇴`,'move'); }catch(e){} try{ retireRecord(p); }catch(e){} /* 국내 선수와 같이 은퇴 기록·명예의 전당 심사(검수 11-09zp) */ for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; p.team=null; p.fleft=true; p.retY=G.year; continue; }
    if(p.team==null||p.foreign||p.joinY>G.year)continue;
    const o=ovr(p);
    if((p.age>=40||(p.age>=35&&o<44)||(p.age>=32&&o<34&&!p.faC))&&!(p.retDelay===G.year&&p.age<=41)){ /* 은퇴 면담으로 한 해 더 뛰기로 한 선수는 올해 은퇴하지 않는다(41세까지) */ try{ legendRetire(p); }catch(e){} retired.push({name:p.name,team:p.team,age:p.age}); const rec=retireRecord(p); try{ obs.push(obFromPlayer(p,rec)); }catch(e){} for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; dropP(p.id); }
  }
  const all=Object.values(G.players).filter(p=>p.team!=null&&!(p.joinY>G.year));
  /* FA 등록일수(실제는 시즌 145일 이상 1군 등록): 게임에서는 1군에서 시즌 대부분을 보낸 해를 인정(야수 85경기·260타석, 투수 40경기·90이닝·선발 16경기 중 하나). 팀당 한 해 16명 안팎이 채운다 */
  all.forEach(p=>{ svcCredit(p); delete p.extTried; delete p.extOk;});
  for(const p of Object.values(G.players))if(isFree(p)&&regN(p)>0)svcCredit(p); /* 시즌 중 방출돼 무적으로 넘어가도 그해 등록일수는 FA 연차에 든다(KBO 등록일수 기준, 검수 11-09zz) */
  for(const p of all){ if(p.foreign)continue; p.salH=(p.salH||[]).filter(x=>x.y!==G.year); p.salH.push({y:G.year,s:p.sal}); if(p.salH.length>4)p.salH.shift(); }
  try{ aiExtensions(all); }catch(e){}
  /* FA 등급 순위는 처리 순서와 상관없이 같은 기준(모든 계약 연차를 한 해 줄인 상태, 아무도 아직 선언하지 않은 상태)으로 매긴다 */
  const gSnap=new Map(all.map(q=>{ if(q.extNext)return [q.id,{team:q.team,faC:true,ext:true,yrs:q.extNext.years}]; const ox=ctOn(q)&&q.cOpt&&!q.cOpt.used&&(q.yrs||0)===1&&(q.cOpt.dec??cOptAI(q)), oo=ctOn(q)&&q.pOut&&!q.pOut.used&&q.pOut.y===G.year&&(q.yrs||0)>1&&pOutDecide(q); /* 구단 옵션 실행·옵트아웃 결과를 순위에 먼저 반영(검수 11-09zzb) */ const end=q.faC&&(((q.yrs||0)<=1&&!ox)||oo); return [q.id,{team:q.team,faC:q.faC&&!end,ext:q.ext&&!end,yrs:q.faC?Math.max(0,(q.yrs||0)-1+(ox?q.cOpt.y:0)):q.yrs}]; }));
  const pool=[];
  for(const p of all){
    if(p.foreign)continue;
    if(p.extNext){ termsClear(p); if(p.extNext.terms)termsApply(p,p.extNext.terms,'ext',G.year+1,true); p.sal=p.extNext.annual; p.yrs=p.extNext.years; p.cyrs=p.extNext.years; p.faC=true; p.ext=true; delete p.extNext; continue; }
    if(p.faC){
      if(ctOn(p)&&p.pOut&&!p.pOut.used&&p.pOut.y===G.year&&(p.yrs||0)>1){ p.pOut.used=true; if(pOutDecide(p)){ p.yrs=1; p.ctFree=G.year; story(p,'옵트아웃: 남은 계약을 포기하고 FA 시장으로','move'); if(p.team===G.user)mail('운영팀',`${p.name} 옵트아웃`,`${p.name}이(가) 계약의 옵트아웃 조항을 써서 남은 계약을 포기하고 FA 시장에 나갑니다. 우리 구단도 FA 협상으로 다시 잡을 수 있습니다.`,{kind:'연봉',ref:p.id}); } else story(p,'옵트아웃 하지 않고 계약 유지','move'); }
      if((p.yrs||0)===1&&ctOn(p)&&p.cOpt&&!p.cOpt.used&&p.ctFree!==G.year){ p.cOpt.used=true; const ex=p.cOpt.dec??cOptAI(p); /* 단장이 확정한 결정은 이직·사임 뒤 후임도 따른다(검수 11-09zzb) */ if(ex){ p.yrs+=p.cOpt.y; p.cyrs=(p.cyrs||0)+p.cOpt.y; p.sal=p.cOpt.a; p.cOptAdd={y:p.cOpt.y,a:p.cOpt.a}; story(p,`구단 연장 옵션 실행(${p.cOpt.y}년 연 ${money(p.cOpt.a)})`,'move'); } else { p.ctFree=G.year; story(p,(p.svc||0)>=faSvc(p)?'구단 연장 옵션 포기 → FA':'구단 연장 옵션 포기 → 보류 선수(연봉 협상)','move'); } }
      p.yrs--; if(p.yrs>0)continue; if(!p.ext)p.ctFree=G.year; /* FA 계약 만료는 재계약 협상으로: 짧은 FA 계약도 재자격 대기·신청 포기로 연봉조정에 묶이지 않는다. 비FA 다년계약은 기존 자격 기준. */ p.faC=false; p.ext=false; p.ctEnd=G.year; /* 첫 연봉은 시장가로 다시(salReset) */ delete p.cyrs; delete p.ntc; /* 보장 계약이 끝나면 거부권도 끝(검수 11-09s) */ }
    const elig=p.svc>=faSvc(p)&&(p.lastFA==null||G.year-p.lastFA>=4||p.ctFree===G.year); /* KBO는 FA 나이 제한이 없다(신청 여부는 아래 선수 판단). 옵트아웃·구단 옵션 포기로 나온 선수는 재자격 기간과 상관없이 FA */
    /* 자격이 있어도 신청은 선수 몫: 시장 가치가 낮거나 나이가 많으면 신청하지 않고 남는다 */
    const dp=faDeclP(p);
    if(elig&&p.ctFree!==G.year&&R()>=dp){ p.faSkip=G.year; if(p.team===G.user)(G._faSkip=G._faSkip||[]).push(p.name); continue; }
    if(elig){ delete p.faSkip; const grade=faGradeOf(p,all,gSnap);
      p.faFrom=p.team; p.faGrade=grade; p.faPrevSal=p.sal; faMktFix(G.year); p.ask=faAsk(p); p.ask0=p.ask.annual; try{ agentOf(p); }catch(e){} p.team=null; pool.push(p.id);
      for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k];
      if(p.faFrom===G.user)declared.push(p.id); }
  }
  try{ ovsFA(pool); }catch(e){}
  G.fa={pool,offers:{},ai:{},open:false,openDay:KD(11,6),closed:false,results:[],cap:pool.length<=20?2:3,outN:{},y0:G.year}; try{ allInPick(); }catch(e){}
  if(G._faSkip&&G._faSkip.length){ note('FA',`FA 자격이 있지만 신청하지 않고 남은 우리 선수: ${G._faSkip.join(', ')}. 내년에도 자격은 유지됩니다.`); } G._faSkip=null;
  G.retired=retired; G.rolled=G.year; try{ obRetireEvents(obs); }catch(e){} try{ abroadYear(); }catch(e){} try{ fOverseas(); }catch(e){} try{ postingSeason(); }catch(e){}
  try{ leaveSweep(); }catch(e){} /* 은퇴·FA·해외 진출로 떠난 선수에게 남은 출전 약속·매물 표시를 바로 정리(다음 날 처리 첫머리를 기다리지 않게) */
  const mine=retired.filter(r=>r.team===G.user);
  stop('스토브리그',`스토브리그가 시작되었습니다. 은퇴 ${retired.length}명(우리 ${mine.length}명), FA 자격 ${pool.length}명(우리 ${declared.length}명). 11월 2일 FA 공시, 6일부터 협상, 12월 1일 연봉 협상이 시작됩니다.`);
}
function faAnnounce(){ if(!G.fa)return; G.fa.open=true; G.fa.annDay=G.day; if(G.day>=G.fa.openDay)G.fa.openDay=G.day+1; /* 결산이 늦어 공시가 협상 시작일을 넘기면 다음 날부터: 우선 제안 기한·개장일 보고가 사라지지 않게(검수 11-08) */ try{ agYear(); agPitch(); }catch(e){} const mine=G.fa.pool.filter(id=>G.players[id]&&G.players[id].faFrom===G.user).length;
  stop('FA',`FA 승인 선수 ${G.fa.pool.length}명이 공시되었습니다. 우리 구단 ${mine}명. 다른 구단 FA는 구단마다 ${faCapN()}명까지 영입할 수 있습니다(${ASSOC.s} 규약 제173조). 11월 6일부터 모든 구단과 협상합니다. 영입·계약 → FA 시장에서 조건을 제시하세요.`); }
/* FA 등록일수(실제는 시즌 145일 이상 1군 등록): 게임에서는 1군에서 시즌 대부분을 보낸 해를 인정(야수 85경기·260타석, 투수 40경기·90이닝·선발 16경기 중 하나). 팀당 한 해 16명 안팎이 채운다 */
/* KBO 1군 등록일수: 정규시즌 동안 매일 센다. 1군 등록 중이면 1일, 등록 중 다쳐 빠졌으면 부상자 명단으로 시즌 30일까지, 국가대표 차출 기간도 등록으로 인정.
   고액 연봉(3억 원 이상) 선수가 다치지 않았는데 1군에 없으면 하루 연봉의 1/600을 감액한다(타자는 개막부터, 투수는 개막 7경기 뒤부터). */
/* 등록일 하루: 구단별 기록이 없던 옛 저장은 그때까지의 합계를 n0으로 남긴다(검수 11-09ze: 이적 한 번에 51일→0일) */
function regAdd(R,tid){ if(!R.tm){ if(R.n)R.n0=R.n; R.tm={}; } R.n++; R.tm[tid]=(R.tm[tid]||0)+1; }
function regDaily(){ const c=G.cal; if(!c||G.day<c.open||G.day>c.end)return; if(G.day===c.open)G.regTrk=G.year; if(G.regTrk!==G.year||!entryOn())return; G.sea.cut=G.sea.cut||{};
  for(const p of Object.values(G.players)){ if(p.team==null||p.prospect||p.joinY>G.year)continue; const R=p.regD&&p.regD.y===G.year?p.regD:(p.regD={y:G.year,n:0,il:0});
    const nt=p.ntAway>G.day&&p.ntFrom<=G.day; if(milServing(p))continue; /* 복무 중이면 1군 표시가 남아 있어도 등록일 없음(검수 11-07) */ if(p.e1){ regAdd(R,p.team); p.e1L=G.day; p.e1T=p.team; continue; } if(p.ys)continue; /* 육성선수(정식 등록 전)·입대한 선수는 대표 차출·재활 인정 없음 */ if(nt){ regAdd(R,p.team); continue; }
    if(p.injOut>0){ const lh=(p.injHist||[]).slice(-1)[0]; if(lh&&p.e1L!=null&&p.e1L>=lh.d-1&&(p.e1T??p.team)===p.team&&R.il<30){ /* 부상자 등록 인정은 그 구단에서 1군이었다가 다친 경우만(검수 11-07) */ regAdd(R,p.team); R.il++; } continue; }
    if(!p.foreign&&p.sal>=300&&!milServing(p)&&!p.ys&&(!p.isP||G.day>=c.open+8)){ G.sea.cut[p.team]=(G.sea.cut[p.team]||0)+p.sal/600; R.cut=(R.cut||0)+1; } } }
/* 그 구단 소속으로 쌓은 등록일수(2차 드래프트 의무 등록) */
function regNT(p,tid){ const R=p.regD&&p.regD.y===G.year?p.regD:null; return R?(R.tm?(R.tm[tid]||0):(p.team===tid&&!(p.tLog||[]).some(x=>x.y===G.year&&G.cal&&x.d>=G.cal.open&&x.d<=G.cal.end)?R.n:0)):0; } /* 구단별 기록이 없는 옛 저장: 그 정규시즌 중 이적이 없을 때만 전부 그 구단 몫(검수 11-07) */
function regN(p){ return p.regD&&p.regD.y===G.year?p.regD.n:0; }
/* 1시즌 인정: 등록 145일 이상. 모자란 해의 등록일수는 쌓아 두었다가 합쳐서 145일이 되면 1시즌(KBO). 등록일수를 세지 못한 해(예전 저장)는 예전 기준(출전량)으로 본다 */
function svcCredit(p){ if(p.foreign){ p.svc++; return; } if(G.regTrk===G.year){ const n=regN(p); if(n>=145){ p.svc++; return; } p.svcD=(p.svcD||0)+n; if(p.svcD>=145){ p.svcD-=145; p.svc++; } return; } if(faSvcOk(p))p.svc++; }
function faSvcOk(p){ if(G.regTrk===G.year){ const n=regN(p); return n>=145||((p.svcD||0)+n>=145); } const h=seasonTotal(p,G.year,'1군'); if(!h)return false; return p.isP?((h.g||0)>=40||(h.outs||0)>=270||(h.gs||0)>=16):((h.g||0)>=85||(h.pa||0)>=260); }
/* 자격이 있어도 신청은 선수 몫: 시장 가치가 낮거나 나이가 많으면 신청하지 않고 남는다(애매한 선수는 시장에 나가 봐야 헐값 1년이라 대부분 신청하지 않는다) */
function faDeclP(p){ const o2=ovr(p)+pvShift(p); let dp=o2>=58?.97:o2>=52?.8:o2>=48?.34:o2>=44?.1:.03; if(p.age>=35)dp*=.5; if(p.faSkip)dp+=.1; return dp; }
/* 올 시즌 뒤 FA 예정자(시즌 중 미리 보기): FA 계약 마지막 해, 자격을 채우고도 남았던 선수, 올해 1군 등록일수를 채우면 자격을 얻는 선수.
   why: end(계약 만료) · re(자격 보유) · svc(등록일수 필요, sure=지금 이미 채웠나) */
function faUpcoming(){ if(G.rolled===G.year||(G.fa&&G.fa.y0===G.year))return []; const L=[];
  for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.extNext||(p.joinY>G.year))continue; /* KBO FA는 나이 제한이 없다: 38세 이상도 은퇴 예상만 빼고 올린다(검수 11-06) */ if(p.age>=40||(p.age>=35&&ovr(p)<44))continue; /* 은퇴 예상 */
    let why=null, sure=true; const svcEnd=(p.svc||0)+(faSvcOk(p)?1:0);
    let free=false; /* 옵트아웃·구단 옵션 포기로 나오는 선수: 실제 공시(offseason)와 같은 규칙으로 재자격 기간을 면제하고 신청도 확정(검수 11-09r) */
    if(p.faC){ const out=ctOn(p)&&p.pOut&&!p.pOut.used&&p.pOut.y===G.year&&(p.yrs||0)>1&&pOutDecide(p,faSvcOk(p)?1:0); /* 스토브리그처럼 올해 등록일수까지 센다(검수 11-09zzb) */ if((p.yrs||0)>1&&!out)continue;
      if(!out&&p.cOpt&&!p.cOpt.used&&ctOn(p)){ if(p.cOpt.dec??cOptAI(p))continue; /* 실행할 구단 옵션: FA가 아니라 계약 연장 */ free=true; }
      if(out||!p.ext&&(p.yrs||0)<=1)free=true; why=out?'out':'end'; }
    else if((p.svc||0)>=faSvc(p))why='re';
    else if((p.svc||0)===faSvc(p)-1){ why='svc'; sure=faSvcOk(p); }
    else continue;
    if(why!=='svc'&&svcEnd<faSvc(p))continue; if(p.lastFA!=null&&G.year-p.lastFA<4&&!free)continue;
    L.push({p,why,sure,dp:free?1:faDeclP(p)}); }
  return L; }
function faCapN(){ const F=G.fa; return F&&F.cap?F.cap:(F&&F.pool&&F.pool.length>20?3:2); }
function faOutN(tid){ const F=G.fa; return F&&F.outN?(F.outN[tid]||0):0; }
function faOutBlocked(tid,p){ return tid!==p.faFrom&&faOutN(tid)>=faCapN(); }
/* 우리 제안이 살아 있는지: 선수가 거절한 조건(rej)이나 외부 FA 한도에 걸린 제안은 없는 것과 같다 */
function faOfferLive(id){ const F=G.fa; const o=F&&F.offers&&F.offers[id]; const p=G.players[id]; return !!(o&&!o.rej&&p&&!faOutBlocked(G.user,p)); }
/* AI 구단이 매기는 FA의 값: 요구액이 아니라 능력·나이로 정한다(인플레이션 억제) */
/* AI 구단의 비FA 다년계약: 상한 여유가 있으면 FA를 앞둔(또는 막 자격을 얻은) 핵심 선수를 미리 묶는다(실제 KBO의 비FA 다년계약 흐름).
   선수풀이 작아 시장에 내보내면 잡기 어렵다는 계산이다. 새 계약은 다음 시즌부터(extNext) */
function aiExtensions(all){ const done=[];
  for(const t of G.teams){ if(t.id===ME()||t.cash<-3000)continue; let room=capOf(G.year+1)*(t.mode==='contend'?1.0:.96)*aiCapMul(t)-capPay(t.id); let n=0;
    const C=all.filter(p=>p.team===t.id&&!p.foreign&&!p.ys&&!p.extNext&&!p.faC&&!p.ext&&p.age<=33&&ovr(p)>=56&&faSvc(p)-(p.svc||0)<=1&&faSvc(p)-(p.svc||0)>=0).sort((a,b)=>ovr(b)-ovr(a));
    for(const p of C){ if(n>=2)break; const ytf=faSvc(p)-(p.svc||0); const years=p.age<=29?4:p.age<=32?3:2; const d=round5(extDemand(p,years)*(hasAgent(p)?agExtMul(p):1));
      if(d-p.sal>room)continue; if(R()>(ytf===0?.4:.28)*(t.mode==='contend'?1.2:1))continue;
      p.extNext={annual:d,years}; room-=d-p.sal; n++; story(p,`비FA 다년계약 ${years}년 연 ${money(d)} (${tshort(t.id)})`,'move'); done.push({p,t,d,years}); } }
  for(const x of done.filter(x=>x.d>=800).slice(0,4))wire('계약',`${tname(x.t.id)}, ${x.p.name}와(과) 비FA 다년계약 ${x.years}년 총 ${money(x.d*x.years)}`,{tid:x.t.id,ref:x.p.id});
  return done.length; }
/* FA 기대 WAR(11-12, 커뮤니티 beeseo: AI가 능력치만 보고 1~2 WAR 선수에게 15억 넘게 썼다).
   최근 3시즌 1군 WAR을 최근 해에 더 무게(5·4·3)로 평균내고 리그 평균 쪽으로 25% 당긴 뒤, 31세부터 해마다 7%씩 깎는다(계약 기간 평균 하락).
   1군 기록이 거의 없으면(합계 1시즌 미만) null: 능력치 기준을 그대로 쓴다 */
function faExpWar(p){ const y0=G.year; const by={}; let pa=0; for(const h of (p.hist||[])){ if(h.lvl!=='1군'||h.y<y0-3||h.y>y0)continue; by[h.y]=(by[h.y]||0)+(warOf(h,p)||0); pa+=p.isP?(h.outs||0)/3*4.3:(h.pa||0); }
  if(pa<350)return null; const ys=Object.keys(by).map(Number).sort((a,b)=>b-a).slice(0,3); const W=[6,3,1]; let s=0,w=0; ys.forEach((y,i)=>{ s+=by[y]*W[i]; w+=W[i]; }); let e=w?s/w:0; e=e*.85+1*.15; /* FA 시즌·최근 해에 무게(카페 11-13: 최근 2년 스텝업한 선수가 3년 평균으로 헐값이 됐다) */ if(p.age>=31)e*=Math.max(.5,1-(p.age-30)*.07); return Math.max(0,e); }
/* AI가 내는 연봉 상한: 기대 WAR × WAR당 시장가(5.5억, 실제 KBO FA 연평균은 대략 WAR당 5~6억: 안치홍 4년 72억·채은성 6년 90억) × 물가, 우승 경쟁 구단은 15% 더 */
function faWarCap(t,p){ const e=faExpWar(p); if(e==null)return null; return Math.max(MIN_SAL*2,round5(e*550*ecoIdx(sponSeason())*(t.mode==='contend'?1.15:1))); }
function faWorth(t,p){ const pf=perfOvr(p,3); const base=(pf==null?ovr(p):pf*.6+ovr(p)*.4)+pvShift(p); const ab=gmAbOf(t.id); const af=(p.age<30?1.12:p.age<=32?1:p.age<=34?.75:.55)*(ab&&p.age>=30?1+(55-ab.money)/400:1); /* 재정 운영이 서툰 단장은 노장에게 더 쓴다 */ const w0=round5(Math.max(MIN_SAL,marketSal(base)*af*(t.id===p.faFrom?1.05:1)*(t.mode==='contend'?1.04:.94)*faMktNow()*(ovr(p)>=60?1.12:ovr(p)>=54?1.06:1))); const wc=t.id===ME()?null:faWarCap(t,p); if(wc==null)return w0; const pr=faPoolPrem(p); return round5(Math.min(w0*pr,Math.max(w0*.7,wc*pr))); }
/* FA 시장 경쟁(카페 11-13): 이번 시장 상위 매물은 성적이 조금 모자라도 몸값이 오른다(1~3위 +35%, 4~8위 +15%). 성적(WAR) 상한은 능력 기준 몸값의 70% 아래로는 깎지 않는다 */
let _fpr={k:null,m:null};
function faPoolPrem(p){ const F=G.fa; if(!F||!F.pool)return 1; const k=G.year+':'+G.day+':'+F.pool.length; if(_fpr.k!==k){ const L=F.pool.map(i=>G.players[i]).filter(q=>q&&q.team==null).sort((a,b)=>ovr(b)-ovr(a)); _fpr={k,m:new Map(L.map((q,i)=>[q.id,i]))}; } const r=_fpr.m.get(p.id); return r==null?1:r<3?1.35:r<8?1.15:1; } /* 선수풀이 작아 쓸 만한 FA에는 웃돈이 붙는다 */
function faInterest(t,p){
  const room=capOf(sponSeason())-capPay(t.id); const po=ovr(p)+hn('o'+t.id,p.id)*3;
  if(faOutBlocked(t.id,p))return 0;
  if(t.id!==ME()&&capPay(t.id)+p.ask.annual*.9>capOf(sponSeason())*((t.id===p.faFrom?1.02:1)+(t.mode==='contend'&&t.cash>3000?.04:0))*aiCapMul(t))return 0; /* 지난해 초과 구단은 더 아끼고, 올인 구단은 넘겨도 산다 */
  if(t.id!==p.faFrom&&t.cash<-3000)return 0;
  if(t.id!==p.faFrom&&ovr(p)<47)return 0;
  /* 보상 비용(보상금)을 계약 총액과 견준다: 몸값보다 보상금이 크면 외부 구단은 거의 손대지 않는다 */
  let compF=1; if(t.id!==p.faFrom){ const ps=p.faPrevSal||p.sal||0; const cc=p.faGrade==='A'?ps*2:p.faGrade==='B'?ps:ps*1.5; { const T=Math.max(1,p.ask.annual*p.ask.years); compF=p.faGrade==='C'?clamp(1.4*T/(T+cc)-.4,.08,1):clamp(1-cc/Math.max(1,T*.8),.08,1); } /* C등급(35세 이상 등, 보상선수 없이 연봉 150%)은 보상금을 계약 총액에 얹는 비용으로 본다: 노장 FA에게 외부 제안이 거의 없던 문제(카페 11-11) */
    if(t.id!==ME()&&t.cash-cc<-2500)return 0; } /* 보상금을 내면 현금이 크게 마이너스가 되는 AI 구단은 외부 FA를 포기한다 */
  const debt=t.id===p.faFrom&&t.id!==ME()&&(t.cash<-5000||capPay(t.id)>capOf(sponSeason())*1.1)?.35:1;
  if(t.cash<-8000&&t.id!==p.faFrom)return 0;
  if(p.ask.annual>room*1.15&&t.owner==='profit')return 0;
  if(p.ask.annual>room*1.5)return 0;
  /* 연봉 총액이 낮은 구단(하한 근처)은 돈을 쓸 이유가 있다 */
  const low=(capPay(t.id)<capOf(sponSeason())*.5?.22:capPay(t.id)<capOf(sponSeason())*.65?.1:0)+(t.cash>6000?.08:0);
  /* 운영 방향: 우승 도전은 상한 92%까지 채우려 적극적, 내년 도전은 25~30세를, 리빌딩은 서른 넘은 외부 FA를 거의 보지 않는다 */
  const st=t.id===ME()||t.id===p.faFrom?null:stanceOf(t); const stB=st==='win'?(capPay(t.id)<capOf(sponSeason())*.92?.15:0):st==='next'?(p.age>=25&&p.age<=30?.08:p.age>=32?-.1:0):st==='rebuild'?(p.age<=27?.06:p.age>=31?-.25:0):0;
  return compF*clamp(.12+low+stB+agDealBonus(agentOf(p),t.id)+(po-50)*.03+(t.mode==='contend'?.12:0)+needScore(t.id,p)*.18+(t.id===p.faFrom?.45:0)-(t.id!==p.faFrom&&p.faGrade==='A'?.12:0)-(rosterN(t.id)>=ROSTER_MAX-1?.25:0),0,1)*debt;
}
function faDay(day){
  const F=G.fa; const since=day-F.openDay;
  /* 우리 구단 이름의 AI 제안은 없어야 한다: 이직해 온 구단의 전임 단장이 낸 제안이 남아 있으면, 단장 모르게 그 조건으로 계약돼 버린다 */
  if(!G.unemp&&F.ai)for(const id in F.ai){ if(F.ai[id]&&F.ai[id][G.user])delete F.ai[id][G.user]; }
  /* 협상 시작일: 미리 낸 제안에 에이전트가 답한다 */
  if(day===F.openDay&&!G.unemp){ const pre=Object.keys(F.offers||{}).filter(id=>!(F.neg&&F.neg[id])); const L=[]; for(const id of pre){ const p=G.players[id]; if(!p||p.team!=null)continue; const o=F.offers[id]; try{ const r=faNegotiate(+id,{annual:o.annual,years:o.years,...(o.terms?{terms:o.terms}:{})}); L.push(`${p.name}: ${r.msg}`); }catch(e){} }
    if(L.length)mail('운영팀',`미리 낸 FA 제안 ${L.length}건에 답이 왔습니다`,L.join('\n\n'),{kind:'FA',imp:true,acts:[{l:'FA 시장',a:'go',v:'transfer:fa'}]}); }
  if(day===F.openDay){ const mine=F.pool.filter(id=>G.players[id]&&G.players[id].faFrom===G.user&&G.players[id].team==null); stop('FA',`오늘부터 모든 구단과 FA 협상이 열립니다.${mine.length?` 우리 FA ${mine.length}명(${mine.slice(0,4).map(id=>G.players[id].name).join(', ')}${mine.length>4?' 등':''})에게 다른 구단도 제안할 수 있습니다.`:''} 영입·계약 → FA 시장에서 조건을 제시하세요.`); }
  F.warned=F.warned||{};
  if(day===F.openDay&&!G.unemp){ const top=F.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.faFrom!==G.user).sort((a,b)=>ovr(b)-ovr(a)).slice(0,5);
    if(top.length)mail('스카우트팀장',`FA 시장 개장: 주요 선수 ${top.length}명`,top.map((p,i)=>`${i+1}. ${p.name} (${posLabel(p)}, ${p.age}세, ${p.faGrade}등급, 원소속 ${tshort(p.faFrom)}) · 요구 연 ${money(p.ask.annual)} ${p.ask.years}년`).join('\n')+'\n\n관심 선수로 별표를 해 두면 다른 구단이 제안할 때 바로 알려 드립니다.',{kind:'FA',acts:[{l:'FA 시장',a:'goWork',v:'FA시장'}]}); }
  /* 찾는 구단이 없으면 요구액이 매주 내려간다(최초 요구의 40%까지) */
  if(since>0&&since%7===0)for(const id of F.pool){ const p=G.players[id]; if(!p||p.team!=null)continue; faPruneAi(id); const ai=F.ai[id]||{}; if(Object.keys(ai).length||faOfferLive(id))continue; /* 선수가 거절한 우리 제안은 남은 제안으로 보지 않는다 */ const a0=p.ask0||p.ask.annual; const fl=p.age<=33?clamp(.4+(ovr(p)-52)*.04,.4,.75):.4; /* 주전급은 요구액이 덜 떨어진다(커뮤니티 피드백 11-11: 보상금 부풀리기 뒤 헐값 재계약) */ const na=round5(Math.max(a0*fl,MIN_SAL,p.ask.annual*.9)); if(na<p.ask.annual){ p.ask.annual=na; if(since>=35)p.ask.years=Math.min(p.ask.years,since>=50&&p.age>=33?1:2); } }
  for(const id of [...F.pool]){
    const p=G.players[id]; if(!p||p.team!=null)continue;
    faPruneAi(id); const ai=F.ai[id]||(F.ai[id]={});
    const po=ovr(p);
    for(const t of G.teams){ if((t.id===G.user&&!G.unemp)||ai[t.id])continue; const own=t.id===p.faFrom;
      /* 애매한 선수는 원소속 구단도 서두르지 않는다: 시장 반응을 본 뒤(협상 50일 이후) 낮춰 부른다 */
      if(own&&po<50&&since<50)continue;
      let it=faInterest(t,p); if(!own)it*=po<52?.35:.7; if(it>0&&R()<it*.1){ const w=faWorth(t,p)*(own&&po<50?.65:1); ai[t.id]={annual:round5(Math.min(p.ask.annual*rnd(.92,1.15),w)),years:own&&po<50?(p.age<=30?2:1):clamp(p.ask.years+ri(-1,0)+(p.age<=28&&po>=62&&R()<.3?1:0),p.age<=31?2:1,p.age<=28&&po>=62?5:4)}; } } /* 서른 안팎까지는 보통 2년 이상 보장한다(1+1 포함) */
    const live=faOfferLive(id);
    if(p.faFrom!==G.user&&!G.unemp&&!live&&!F.warned[id]&&((G.shortlist||[]).includes(id)||mreqOpen('fa').some(r=>r.data&&r.data.pid===id))&&Object.keys(ai).some(k=>+k!==G.user)){ F.warned[id]=1; const k0=Object.keys(ai).find(k=>+k!==G.user); stop('FA',`관심 FA ${p.name}에게 ${tname(+k0)}이(가) 제안했습니다(연 ${money(ai[k0].annual)} · ${ai[k0].years}년). 잡으려면 서둘러 조건을 제시하세요.`,id); }
    if(p.faFrom===G.user&&!live&&!F.warned[id]&&Object.keys(ai).some(k=>+k!==G.user)){ F.warned[id]=1; const k0=Object.keys(ai).find(k=>+k!==G.user); stop('FA',`우리 FA ${p.name}에게 ${tname(+k0)}이(가) 먼저 제안했습니다. 잡으려면 FA 시장에서 조건을 제시하세요.`,id); }
    const uo=F.offers[id]; const offersNow=()=>{ const L=Object.entries(ai).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})); if(live)L.push({tid:G.user,annual:uo.annual,years:uo.years,...(uo.terms?{terms:uo.terms}:{})}); return L; };
    let offers=offersNow(); if(live)faAgentPing(id);
    if(!offers.length)continue;
    /* 대어: 시장 확인 라운드를 다 돌기 전에는 사인하지 않는다. 마지막 라운드에 다른 구단이 올린 조건(시장 보고에 쓴 값)으로 다시 모아 결정한다(검수 11-09r) */
    const mk=agMk(p); if(mk&&!mk.done){ agShopTick(p,mk,ai,day); if(!mk.done)continue; offers=offersNow(); }
    const ng=F.neg&&F.neg[id];
    const pr=mk&&mk.done?1:(.04+since*.006+(offers.length>=2?.04:0)+(p.ask.annual<500?.03:0))*(ovr(p)>=52||offers.length>=2?1:.45)+(ng&&ng.deal?.35:ng&&ng.hot?.08:0);
    if(R()<pr)faSign(p,offers);
  }
}
/* 선수가 제안을 비교하는 점수: 연봉·기간, 원소속 구단 정(애착·기분), 우리 구단과의 협상 분위기·에이전트 친분, 에이전트 거래 실적.
   에이전트 시장 보고도 이 점수로 '누가 앞서는지'를 말한다(보고와 결과가 어긋나지 않게) */
function faScore(p,o){ const home=1.08+((p.pers?p.pers.loy:10)-10)/100+((p.mor??60)-60)/300; const ng=G.fa&&G.fa.neg&&G.fa.neg[p.id]; const ag=agentOf(p);
  const relK=(agRel(ag)-50)/1000*(ag.size==='big'?2:1)*(ag.style==='rel'?2:1);
  if(o.tid===G.user&&ng&&ng.closed)return -1;
  return o.annual*(1+.06*(o.years-1))*(o.tid===p.faFrom?home:1)*(o.tid===G.user&&ng?(ng.deal?1.06:ng.hot?1.02:1)*(.9+ng.mood/500):1)*(o.tid===G.user?1+relK:1)*(1+agDealBonus(ag,o.tid)*.25)*faAppeal(p,o.tid).f*(o.tid===G.user&&HARD()?.92:1); /* 구단 매력: 명성·우승 가능성·출전 기회·연고. 하드 모드: 우리 제안은 8% 덜 끌린다 */ }
/* 고향 팀으로 온 FA: 팬과 구단주에게 명분이 선다. 우리 구단은 기사(팬 여론)·구단주 신뢰 +1(33세 이상 귀향은 +2), 다른 구단은 인기 조금 */
function homeReturn(p,tid,h){ h=h||homeTie(p,tid); /* h: 소속을 바꾸기 전에 구한 판정(바꾼 뒤엔 친정 여부가 사라진다, 검수 11-09s) */ if(!h)return null; const n=h.vet?2:1;
  if(tid===G.user&&!G.unemp){ const t=team(G.user); news('FA',`고향 팀으로 돌아온 ${p.name}`,`${h.sch} 출신 ${p.name}이(가) ${h.vet?'선수 생활의 마지막을 ':''}고향 ${t.city} 팀 ${tname(G.user)} 유니폼을 입습니다.${h.first?' 처음 지명받은 친정이기도 합니다.':''} 지역 팬들이 반기고 있습니다.`,n,{ref:p.id});
    t.trust=clamp(t.trust+n,0,100); note('구단주',`고향 선수 ${p.name} 영입을 구단주가 반깁니다. 구단주 신뢰 +${n}.`); }
  else { const t=team(tid); if(t)t.pop=clamp(t.pop+.003*n,.7,1.5); if(h.vet||ovr(p)>=58)wire('FA',`${p.name}, 고향 팀 ${tshort(tid)}로 (${h.sch} 출신)`,{ref:p.id,tid}); }
  story(p,`고향 팀 ${tname(tid)}로 (${h.sch} 출신)`); return h; }
function faBestOf(p,offers){ let b=null,bs=-1; for(const o of offers){ const s=faScore(p,o); if(s>bs){bs=s;b=o;} } return b; }
function faSign(p,offers){
  offers=offers.filter(o=>!faOutBlocked(o.tid,p)&&rosterN(o.tid)<ROSTER_MAX); if(!offers.length)return; /* 정식 선수가 꽉 찬 구단은 계약할 수 없다(검수 11-09r) */
  let best=null,bs=-1; const shop=agShopN(p)>0; const ng=G.fa&&G.fa.neg&&G.fa.neg[p.id];
  for(const o of offers){ if(o.tid===G.user&&ng&&ng.closed)continue; const sc=faScore(p,o)*(shop?1:rnd(.96,1.04)); if(sc>bs){bs=sc;best=o;} } /* 대어는 시장 보고 결과대로 결정한다 */
  if(!best)best=offers.find(o=>o.tid!==G.user); if(!best)return; /* 우리와 협상을 접은 선수는 우리 제안만 남아 있어도 사인하지 않는다 */
  try{ agDealAdd(p,best.tid); const ag=agentOf(p); if(best.tid===G.user)agRelAdd(ag,5,`${p.name} 계약`); else if(G.fa.offers[p.id])agRelAdd(ag,1,`${p.name} 끝까지 경쟁`); }catch(e){}
  if(G.faFund&&!G.faFund.done&&best.tid===(G.faFund.tid??G.user)&&p.faFrom!==best.tid)G.faFund.used=true; /* 받은 구단 기준(이직 뒤에도, 검수 11-09zn) */
  let ht=null; try{ ht=homeTie(p,best.tid); }catch(e){} const from=p.faFrom; p.team=best.tid; p.sal=Math.max(MIN_SAL,best.annual); p.yrs=best.years; p.cyrs=best.years; p.faC=true; p.ext=false; p.lastFA=stoveY(); /* 같은 겨울 계약은 1월에 해도 그 시즌 회차 */ p.faN=(p.faN||0)+1; p.faPrevGrade=p.faGrade;
  termsClear(p); const BT=best.tid===G.user&&best.terms?best.terms:null; if(BT){ p.sal=Math.max(MIN_SAL,BT.annual); termsApply(p,BT,'fa',ctSeason()); }
  const rec={id:p.id,name:p.name,from,to:best.tid,annual:BT?BT.annual+Math.round((BT.bonus||0)/best.years):best.annual,years:best.years,grade:p.faGrade,kind:p.ask0&&best.annual<p.ask0*.6?'cheap':'sign',day:G.day,ask0:p.ask0||null,...(BT?{terms:BT}:{})};
  story(p,best.tid===from?`FA 잔류 · ${tname(best.tid)} ${best.years}년 연 ${money(p.sal)}`:`FA 이적 · ${tname(best.tid)} ${best.years}년 연 ${money(p.sal)}`,'move');
  if(best.tid!==from){ try{ gmInc(best.tid,'fa'); if(rec.annual*best.years>=6000)gmInc(best.tid,'faBig'); }catch(e){} /* 단장 프로필: 외부 FA, 총액 60억 이상은 대형 */ if(G.fa){ G.fa.outN=G.fa.outN||{}; G.fa.outN[best.tid]=(G.fa.outN[best.tid]||0)+1; }
    if(best.tid===G.user&&!G.unemp&&faOutN(G.user)>=faCapN()){ const gone=Object.keys(G.fa.offers).map(Number).filter(x=>x!==p.id&&G.players[x]&&G.players[x].faFrom!==G.user); gone.forEach(x=>delete G.fa.offers[x]); /* 외부 FA 한도를 채웠다: 남은 외부 FA 제안은 효력이 없다 */
      if(gone.length)stop('FA',`외부 FA 영입 한도(${faCapN()}명)를 채웠습니다. 다른 구단 FA에게 낸 제안 ${gone.length}건(${gone.map(x=>G.players[x].name).join(', ')})은 효력이 없어 거둬들였습니다. 우리 FA 잔류 협상은 계속할 수 있습니다.`); }
    try{ compStart(p,from,best.tid,rec); }catch(e){}
  }
  if(best.tid!==from)try{ homeReturn(p,best.tid,ht); }catch(e){} /* 고향 팀 귀향(11-09d) */
  const uo0=G.fa.offers[p.id]; const userOffered=!!uo0; const whyLost=!uo0?'':uo0.rej?' 우리 제안은 선수가 이미 거절한 조건이었습니다.':faOutBlocked(G.user,p)?` 우리 구단은 외부 FA 영입 한도(${faCapN()}명)를 채워 계약할 수 없었습니다.`:' 우리 제안은 밀렸습니다.';
  delete G.fa.offers[p.id]; G.fa.pool=G.fa.pool.filter(x=>x!==p.id); G.fa.results.unshift(rec); prFA(rec); try{ if(rec.to===G.user&&from!==G.user&&rec.annual>=700)ivRequest('fa_sign',{pid:p.id}); else if(from===G.user&&rec.to!==G.user&&rec.annual>=500)ivRequest('fa_lost',{pid:p.id}); }catch(e){} mvLog('FA',p,from,rec.to,`${from===rec.to?'잔류 ':''}${ctRecShort(rec)}`,rec.terms?ctRecMoney(rec).tot:rec.annual*rec.years);
  const tx=rec.terms?`${termsTxt(rec.terms,true)} · ${ctRecMoney(rec).txt}`:`${rec.years}년 연 ${money(rec.annual)}`;
  const t=rec.to===G.user?(from===G.user?`${p.name}와(과) 잔류 계약했습니다. ${tx}.`:`FA ${p.name}을(를) 영입했습니다. ${tx}.${rec.compPlayer?` 보상선수로 ${rec.compPlayer}이(가) 떠났습니다.`:''}${rec.compCash?` 보상금 ${money(rec.compCash)}.`:''}`)
    :from===G.user?`${p.name}이(가) ${tname(rec.to)}와(과) 계약했습니다(${rec.years}년 연 ${money(rec.annual)}).${rec.compPlayer?` 보상선수로 ${rec.compPlayer}을(를) 받았습니다.`:''}${rec.compCash?` ${rec.grade}등급 보상금 ${money(rec.compCash)}을(를) 받았습니다(결산에 반영).`:''}`
    :`${tname(rec.to)}이(가) FA ${p.name}(${p.faGrade}등급)을 ${rec.years}년 연 ${money(rec.annual)}에 잡았습니다.${whyLost}`;
  if(rec.to===G.user)addLog(t);
  if(rec.to===G.user||from===G.user||userOffered)stop('FA',t,p.id); else if(rec.grade!=='C'||rec.annual>=500)wire('FA',t,{ref:p.id,tid:rec.to});
  delete p.faFrom; delete p.ask;
}
/* AI 제안이 지금도 유효한가: 영입 한도·정원·샐러리캡·관심(faInterest가 0이면 새로 입찰하지 않을 구단)을 다시 본다(검수 11-08: 계약할 수 없는 구단의 제안이 몸값을 올리고 마감 때 계약까지 됨) */
function faAiOk(tid,p){ if(tid===G.user&&!G.unemp)return false; /* 전임 단장의 AI 제안은 우리 구단 이름으로 남지 않는다 */ return !faOutBlocked(tid,p)&&rosterN(tid)<ROSTER_MAX&&faInterest(team(tid),p)>0; }
function faPruneAi(id){ const ai=G.fa&&G.fa.ai&&G.fa.ai[id]; const p=G.players[id]; if(!ai||!p)return; for(const k of Object.keys(ai))if(!faAiOk(+k,p))delete ai[k]; }
function faClose(){
  const F=G.fa; let cheap=0, gone=0, floorN=0;
  for(const id of F.pool)faPruneAi(id);
  for(const id of [...F.pool]){ const p=G.players[id]; if(!p||p.team!=null)continue;
    faPruneAi(id); /* 앞선 계약으로 정원이 찬 구단의 제안은 선수마다 다시 정리(검수 11-09r) */ const ai=F.ai[id]||{}; const offers=Object.entries(ai).map(([tid,o])=>({tid:+tid,annual:o.annual,years:o.years})).filter(o=>!faOutBlocked(o.tid,p));
    if(F.offers[id]&&!F.offers[id].rej&&!faOutBlocked(G.user,p))offers.push(Object.assign({tid:G.user},F.offers[id])); /* 선수가 거절한 조건·한도에 걸린 제안은 마감 때도 계약되지 않는다 */
    if(offers.length){ faSign(p,offers); continue; }
    const from=p.faFrom, t=team(from); const low=round5(Math.max(MIN_SAL,Math.min((p.faPrevSal||p.sal)*.5,marketSal(ovr(p))*.45)));
    /* 원소속 AI 구단이 쓸모를 인정하면 헐값 계약으로 붙잡는다(실제 2025년 하주석 1년 1억1천만원 등). 20대는 1+1처럼 2년으로 묶는 경우가 많다 */
    if(from!==G.user&&t&&p.age<=35&&aiVal(t,p)>=1&&capPay(from)+low<=capOf(sponSeason())&&rosterN(from)<ROSTER_MAX){ faSign(p,[{tid:from,annual:low,years:p.age<=28?2:1}]); const r=F.results[0]; if(r&&r.id===p.id){ r.kind='cheap'; } cheap++; wire('FA',`${p.name}, 원소속 ${tname(from)}와(과) ${p.yrs}년 연 ${money(low)} 헐값 계약`,{tid:from,ref:p.id}); continue; }
    /* 연봉 하한에 못 미치는 구단은 남은 FA로 채운다 */
    { const fl=floorOf(G.year); const lt=G.teams.filter(x=>x.id!==ME()&&x.id!==from&&capPay(x.id)<fl&&rosterN(x.id)<ROSTER_MAX&&!faOutBlocked(x.id,p)).sort((a,b)=>capPay(a.id)-capPay(b.id))[0];
      if(lt&&p.age<=35&&ovr(p)>=42){ const an=round5(Math.max(low,Math.min(p.ask.annual,(fl-capPay(lt.id))*.6))); faSign(p,[{tid:lt.id,annual:an,years:p.age<=31?2:1}]); if(p.team===lt.id)floorN++; continue; } }
    /* 아무도 찾지 않은 선수: 유니폼을 벗는다 */
    F.pool=F.pool.filter(x=>x!==id);
    if(p.age<=35&&ovr(p)>=33){ mvLog('FA 미계약',p,from,null,'FA 시장 종료 · 무적 선수'); toFree(p,'FA 미계약 · 무적 선수'); gone++; continue; } /* 2년 동안 다른 구단을 기다린다 */
    wire('FA',`${p.name}(${p.age}세)이(가) 새 팀을 찾지 못하고 은퇴했습니다.`,{ref:p.id}); if(from===G.user)note('FA',`우리 구단 출신 FA ${p.name}이(가) 계약하지 못하고 은퇴했습니다.`);
    { let rec=null; try{ rec=retireRecord(p); }catch(e){} try{ p.team=from; obFromPlayer(p,rec); p.team=null; }catch(e){} } dropP(id); gone++; } /* 정상 은퇴와 같이 통산 기록·명예의 전당 심사 */
  F.closed=true; F.cheapN=cheap; F.retN=gone;
  note('FA',`FA 시장이 사실상 끝났습니다. 스프링캠프 전까지 계약하지 못한 선수 중 ${cheap}명은 원소속 구단과 헐값 계약했고, ${floorN?`${floorN}명은 연봉 하한을 채워야 하는 구단과 계약했고, `:''}${gone}명은 무적 선수로 남거나 은퇴했습니다. 무적 선수는 풀린 해 다음 해까지(두 번째 새해를 맞기 전) 계약하지 못하면 은퇴합니다.`); }
/* 1월 10일: 우리 구단 출신 미계약 FA가 있으면 알린다 */
function faUnsignedNote(){ const F=G.fa; if(!F||F.closed)return; const L=F.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.faFrom===G.user); if(!L.length)return;
  stop('FA',`우리 구단 출신 미계약 FA ${L.length}명: ${L.map(p=>`${p.name}(요구 ${p.ask.years}년 연 ${money(p.ask.annual)})`).join(', ')}. 스프링캠프 전날(1월 24일)까지 아무 데서도 계약하지 못하면 원소속 구단 헐값 재계약이나 연봉 하한을 채워야 하는 구단의 영입이 없는 한, 35세 이하로 기량이 남은 선수는 무적 선수로 남고(2년 안에 계약하지 못하면 은퇴), 그 밖에는 은퇴합니다. 잡으려면 FA 시장에서 제안하세요.`); }
/* 다른 구단의 예비 FA 대우: 팀 연봉 상위 핵심이고 붙잡을 생각이 있으면 프리미엄을 얹는다(돈 사정이 나쁘면 못 한다) */
function aiPreFA(p){ if(!preFA(p)||p.newSal==null)return; const t=team(p.team); if(!t||t.cash<-3000||p.age>=33)return;
  const ps=domestic(p.team).filter(q=>!q.ys); const rk=ps.filter(q=>ovr(q)>ovr(p)).length+1; if(rk>8||ovr(p)<52)return;
  if(p.newSal<preCap(p)&&R()<(t.mode==='contend'?.75:.5)){ p.newSal=preFAPremium(p,p.newSal); p.mor=clamp((p.mor??60)+3,0,100); p.prem=G.year; } }
function contractStart(){
  const ended=[], foreignEnd=[];
  for(const p of Object.values(G.players)){
    if(p.team==null||p.joinY>G.year)continue;
    if(p.foreign&&p.fy>G.year)continue; /* 12월 1일 계약해 다음 시즌부터 뛰는 외국인은 재계약 심사 대상이 아니다(검수 11-09zl) */
    if(p.foreign&&p.fMulti>G.year){ p.rsy=(p.rsy||0)+1; continue; } /* 2년 계약 중인 외국인은 이번 겨울 재계약 없이 같은 연봉(커뮤니티 요청 11-07) */
    if(p.foreign){ p.newSal=newSalary(p); if(p.team===ME())foreignEnd.push(p.id); else { const pf=perfOf(seasonTotal(p,G.year,'1군'),p.isP); if(p.age>=35||pf==null||pf<52||ovr(p)<(p.foreign==='아시아'?48:54)){ if(!p.fRel)try{ foResAdd(p,p.team); }catch(e){} dropP(p.id); } /* 재계약하지 않으면 우리와 같이 보류권을 남긴다(검수 11-09zzb) */ /* 성적이 평범하거나 국내 주전급보다 약한 외국인은 놓고 시장에서 더 나은 선수를 찾는다 */ else { p.sal=p.newSal; p.rsy=(p.rsy||0)+1; p.fCtY=G.year+1; if(p.foreign==='용병'){ const yb=foreignOf(p.team).filter(x=>x.foreign==='용병'); if(sum(yb.map(x=>x.sal))>fCap(p.team)){ const w=[...yb].sort((a,b)=>ovr(a)-ovr(b))[0]; if(ovr(w)>=55&&w.age<=33&&R()<.5){ const ot=w.team; w.team=null; w.fsrc='agent'; w.fday=G.day; w.fpub=G.day; w.ask=round5(fAsk(w)); w.ask0=w.ask; G.fmarket=(G.fmarket||[]).concat(w.id); wire('외국인',`${tshort(ot)}, 외국인 ${w.name} 보류권 해제. 다른 구단과 계약 가능`,{tid:ot,ref:w.id}); } else { try{ foResAdd(w,w.team); }catch(e){} dropP(w.id); } } } } } continue; }
    if(p.faC)continue;
    if(p.ctEnd==null&&p.lastFA!=null)p.ctEnd=G.year; /* 예전 저장본: 끝난 FA 계약 연봉이 그대로 남아 있으면 한 번 시장가로 */
    p.newSal=newSalary(p); if(p.team===ME())ended.push(p.id); else /* 야인이면 전 구단도 AI가 처리(검수 11-09zx) */ { aiPreFA(p); p.sal=p.newSal; delete p.newSal; }
  }
  G.contract={y:G.year,tid:G.user,ended,foreignEnd,foreignDrop:[],released:[],done:false}; for(const id of foreignEnd)initPers(G.players[id]); salTalkInit();
  /* AI 구단: 기량이 크게 떨어진 고액 연봉 베테랑은 정리한다 */
  for(const t of G.teams){ if(t.id===ME())continue; /* 야인 기간에는 AI가 맡은 전 소속 구단도 정리한다 */ for(const p of domestic(t.id)){ if(p.age>=32&&ovr(p)<44&&p.sal>=800&&!p.ys){ wire('방출',`${tname(t.id)}, 베테랑 ${p.name} 방출`,{tid:t.id,ref:p.id}); const c=relCost(p).tot; payOut(t.id,c,'rel'); /* 일반 방출과 같은 보장계약 정산(검수 11-09g) */ if(p.age<=35&&ovr(p)>=30)toFree(p,`${tname(t.id)}에서 방출`,c); else retireOut(p,`${tname(t.id)}에서 방출된 뒤 은퇴`); } } }
  for(const t of G.teams) if(t.id!==ME()) trimRoster(t.id,60);
  refreshFMarket(12,99);
  if(!G.unemp){ stop('연봉',`연봉 협상이 시작되었습니다. 국내 선수 ${ended.length}명의 구단 산정안(직전 시즌 성적 기준)과 외국인 선수 ${foreignEnd.length}명의 재계약안이 올라왔습니다. 1월 31일까지 계약하세요.`); if(G.mail[0])G.mail[0].auto=foreignEnd.length?['sal','fre']:['sal']; }
}
/* 외국인 재계약: 잘한 선수는 더 달라고 한다. 3명 총액 한도(400만 달러 + 재계약 연차당 10만 달러)를 넘으면 확정할 수 없다 */
function fReCapInfo(){ const C=G.contract; if(!C)return null; const FE=C.foreignEnd||[], FD=C.foreignDrop||[]; /* 일부 계약 상태에는 외국인 목록이 없을 수 있다(검수 11-12) */ const keep=FE.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!FD.includes(p.id));
  const others=foreignOf(G.user).filter(x=>x.foreign==='용병'&&!FE.includes(x.id)); const tot=sum(keep.map(p=>p.newSal+(p.fInc||0)))+sum(others.map(fCommit)); /* 총액 한도에는 인센티브도 들어간다 */
  const cap=fTotCap()+10*USD*sum(keep.map(p=>(p.rsy||0)+1))+10*USD*sum(others.map(p=>p.rsy||0)); return {tot,cap,over:Math.max(0,tot-cap),n:keep.length+others.length}; }
/* 결별하지 않은 일반 외국인이 3명 모두 투수거나 모두 타자인가(결별 취소·계약 확정이 인원수만 보던 문제, 검수 11-09a) */
function fReMixBad(){ const C=G.contract; const yb=foreignOf(G.user).filter(x=>x.foreign==='용병'&&!(C&&!C.done&&C.foreignDrop.includes(x.id))); return yb.length>=3&&yb.every(x=>x.isP===yb[0].isP); }
/* 15% 깎아 협상의 합의 확률: 구단 충성심·적응력이 높을수록 받아들이고, 지난 시즌 WAR 3 이상 스타는 잘 받아들이지 않는다.
   성적은 계약 협상이 열린 시즌(C.y) 기준. 1월 1일이 지나도 지난 시즌 성적으로 본다 */
function fReNegChance(p){ const C=G.contract; initPers(p); const y=(C&&C.y)??(period()==='pre'?G.year-1:G.year); const h=seasonTotal(p,y,'1군'); const star=!!(h&&warOf(h,p)>=3);
  return {ch:clamp(.62+(p.pers.loy-10)*.03+((p.adapt||50)-50)/150-(star?.2:0),.1,.9),star}; }
function fReNeg(id){ const C=G.contract; const p=G.players[id]; if(!C||!p||C.done)return ''; if(C.fre&&C.fre[id]&&C.fre[id].ok)return '이미 재계약에 합의한 선수입니다.'; if((C.foreignDrop||[]).includes(id))return '이미 결별하기로 한 선수입니다.'; /* 새 협상 합의와 겹치지 않게(검수 11-06) */ C.fneg=C.fneg||{}; if(C.fneg[id])return '이미 한 번 협상했습니다.'; C.fneg[id]=true;
  const ask=p.newSal; const off=round5(ask*.85); const {ch,star}=fReNegChance(p);
  if(R()<ch){ p.newSal=off; return `${p.name} 측이 ${money(off)}에 동의했습니다. (요구액 ${money(ask)})`; }
  C.foreignDrop.includes(id)||C.foreignDrop.push(id); p.fleft=true; return `${p.name} 측이 거절했습니다. ${star?'일본 구단에서 더 좋은 조건을 받았다고 합니다.':'다른 리그를 알아보겠다고 합니다.'} 결별로 처리됩니다. 보류권은 우리에게 있어 국내 다른 구단에는 갈 수 없습니다.`; }
/* 외국인 재계약 마무리(한 구단): 결별은 보류권 처리, 합의한 인센티브는 계약 옵션으로. 계약 확정과 이직 인계가 같은 처리를 쓴다 */
/* 협상하지 않고 둔 외국인: 해외 제안이 요구액보다 확실히 좋으면 그쪽으로 떠난다(협상하면 그 이상을 줘야 하므로, 방치가 더 싸지 않게) */
function fReIdleOut(p){ const O=foReOut(p); return O&&!O.none&&O.v*.97>p.newSal?O:null; }
function fReFinish(C,tid){ const me=tid===G.user;
  for(const id of C.foreignEnd){ const p=G.players[id]; if(!p||p.team!==tid)continue;
    if(!C.foreignDrop.includes(id)&&!(C.fre&&C.fre[id]&&C.fre[id].ok)){ const O=fReIdleOut(p); if(O){ const rel=(C.fFree||[]).includes(id)||p.fRel; /* 계약에 보류권 해제 조항이 있으면 그대로 지킨다(검수 11-06) */ if(me)addLog(`외국인 선수 ${p.name}이(가) 재계약 협상 없이 ${O.k} 구단 제안(${usdT(O.v)})을 받아들여 떠났습니다(${rel?'계약 조항대로 보류권 해제':'보류권 유지: 5년간 국내 다른 구단 입단 불가'}).`); if(!rel)try{ foResAdd(p,tid); }catch(e){} { const lg=O.k==='미국'?'MLB':O.k==='일본'?'NPB':'CPBL'; ovsLeave(p,lg,lg==='MLB'?pick(MLBT):lg==='NPB'?pick(NPBT):'타이베이',1,Math.round(O.v/USD),'외국인'); } /* 해외파 이력에도 남긴다(검수 11-09b) */ continue; } }
    if(C.foreignDrop.includes(id)){ const free=((C.fFree||[]).includes(id)||p.fRel); /* 조항은 누가 결렬시켰든 지킨다(선수가 거절해도 보류권을 다시 잡지 않음, 검수 11-06) */ /* 계약 때 보류권 해제 조항을 넣었으면 약속대로 푼다 */ const mkt=free&&ovr(p)>=50&&p.age<=34; if(me)addLog(`외국인 선수 ${p.name}와(과) 재계약하지 않았습니다(${!free?'보류권 유지: 5년간 국내 다른 구단 입단 불가':mkt?'보류권 해제: 다른 구단과 계약 가능':'보류권은 풀었지만 국내에서 찾는 구단이 없어 해외로 떠났습니다'}).`);
      mvLog('외국인 계약 종료',p,tid,null,!free?'재계약 결렬 · 보류권 유지(5년)':mkt?'재계약 결렬 · 보류권 해제 · 다른 구단과 계약 가능':'재계약 결렬 · 보류권 해제 · 국내 활동 종료');
      if(mkt){ delete p.newSal; delete p.fInc; delete p.fRel; delete p.fleft; termsClear(p); /* 옛 계약 조항은 새 계약으로 따라가지 않는다 */ p.team=null; p.fsrc='agent'; p.fday=G.day; p.fpub=G.day; p.ask=round5(fAsk(p)); p.ask0=p.ask; G.fmarket=(G.fmarket||[]).concat(p.id); wire('외국인',`${tshort(tid)}, ${p.name} 보류권 해제. 다른 구단과 계약 가능`,{tid}); } else { if(!free)try{ foResAdd(p,tid); }catch(e){} dropP(id); } }
    else { if(p.newSal!=null)p.sal=p.newSal; delete p.newSal; p.rsy=(p.rsy||0)+1; p.fCtY=C.y+1; delete p.fleft; if(p.fInc){ p.ctT=p.team; p.opt={a:p.fInc,from:C.y+1,until:C.y+1,c:optCrit(p)}; delete p.fInc; } } } }
/* 이직할 때: 떠나는 구단의 남은 연봉 협상은 그 구단(이제 AI)이 정리하고, 새 구단은 이미 연봉을 마친 상태로 시작한다 */
function contractHandOff(oldTid){ const C=G.contract; if(!C||C.done)return; for(const [id,n] of Object.entries(C.neg||{})){ const p=G.players[id]; if(n.st==='arb'&&p&&p.team===oldTid){ p.arbP={club:n.arb.club,player:n.arb.player}; n.st='arbOut'; } } /* 조정 신청은 1월 20일 위원회 결정까지 그대로(검수 11-09zzb) */ try{ salTalkClose(true); }catch(e){} /* 사인 거부 선수는 전 구단에서도 미계약으로 남아 holdDaily 일정대로 정리된다(검수 11-09zzb) */
  { let g=0; while(fReCapInfo().over>0&&g++<4){ const k=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id)).sort((a,b)=>b.newSal-a.newSal)[0]; if(!k)break; C.foreignDrop.push(k.id); } } /* 외국인 총액 한도를 넘는 재계약은 비싼 선수부터 포기(평소 확정과 같은 한도) */
  for(const id of C.ended){ const p=G.players[id]; if(p&&p.team===oldTid&&p.newSal!=null){ p.sal=Math.max(MIN_SAL,p.newSal); delete p.newSal; } }
  fReFinish(C,oldTid); /* 단장이 내린 결별·합의(인센티브 포함)를 그대로 마무리한다 */
  G.contract={y:C.y,tid:null,ended:[],foreignEnd:[],foreignDrop:[],released:[],done:true}; }
function confirmContracts(force){ /* force: 1월 31일 마감·이직 정리(조정도 바로 판정) */
  const C=G.contract; if(!C||C.done)return; if(C.tid!=null&&C.tid!==G.user){ C.done=true; return; } /* 이직 전 구단의 계약은 확정하지 않는다 */
  { const own=id=>{ const p=G.players[id]; return p&&p.team===G.user; }; C.ended=C.ended.filter(own); C.foreignEnd=C.foreignEnd.filter(own); } /* 그사이 떠난 선수는 빼고 */ { const f=fReCapInfo(); if(f&&f.over>0)return `외국인 3명 연봉 총액이 한도를 ${money(f.over)} 넘습니다. 한 명과 재계약하지 않거나 금액을 낮춰 협상하세요.`; }
  if(fReMixBad()){ if(!force)return '재계약 선수까지 합치면 일반 외국인 3명이 모두 투수(또는 타자)입니다. 한 명과 결별하세요.'; const k=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id)).sort((a,b)=>b.newSal-a.newSal)[0]; if(k){ C.foreignDrop.push(k.id); addLog(`외국인 3명이 모두 ${k.isP?'투수':'타자'}가 돼 ${k.name}와(과)는 재계약하지 않았습니다.`); } } /* 마감 확정은 재계약 선수 중 가장 비싼 한 명과 결별 */
  if(!force&&C.neg&&G.day<dnum((C.y??G.year)+1,1,20)&&Object.entries(C.neg).some(([id,n])=>n.st==='arb'&&G.players[id]&&G.players[id].team===G.user))return '연봉조정 중인 선수가 있어 1월 20일 결정이 나온 뒤에 확정됩니다. 그 전에 선수안을 받아들이면 바로 확정할 수 있습니다.'; /* 일괄 확정으로 조정이 앞당겨 끝나지 않게(검수 11-06) */
  salTalkClose();
  for(const id of C.ended){ const p=G.players[id]; if(p&&p.newSal!=null){p.sal=Math.max(MIN_SAL,p.newSal); delete p.newSal;} }
  fReFinish(C,G.user);
  C.done=true; addLog('연봉 계약을 마쳤습니다.');
}
/* 저장 용량: 3시즌 전 2군 기록은 구단별 한 줄로 합치고, 프로 3년차 이상의 아마추어 연도별 기록은 지운다(1군 기록·이야기는 그대로) */
function compactPlayers(){ const y=G.year; let n=0;
  for(const p of Object.values(G.players)){
    if(p.hist&&p.hist.length>3){ const old=p.hist.filter(h=>h.lvl==='퓨처스'&&!h.y2&&h.y<y-2); if(old.length>=2){ const by={};
        for(const h of old){ const k=h.t; const m=by[k]=by[k]||Object.assign({},p.isP?ZP:ZB,{y:h.y,y2:h.y,t:h.t,lvl:'퓨처스'}); for(const f in (p.isP?ZP:ZB))m[f]=(m[f]||0)+(h[f]||0); m.y=Math.min(m.y,h.y); m.y2=Math.max(m.y2,h.y); }
        const prevAgg=p.hist.filter(h=>h.lvl==='퓨처스'&&h.y2); for(const a of prevAgg){ const m=by[a.t]; if(m){ for(const f in (p.isP?ZP:ZB))m[f]+=(a[f]||0); m.y=Math.min(m.y,a.y); m.y2=Math.max(m.y2,a.y2); } }
        futLeagueCarry(p,old); /* 원본 연도 행을 없애기 전에 리그 평균의 분자·분모를 보존한다. */
        p.hist=p.hist.filter(h=>!(h.lvl==='퓨처스'&&(old.includes(h)||(h.y2&&by[h.t])))).concat(Object.values(by)); n++; } }
    if(p.amY&&!p.prospect&&p.draft&&p.draft.y<y-2){ delete p.amY; n++; }
    if(p.story&&p.story.length>45)p.story.splice(1,p.story.length-45);
  }
  return n; }
function newYear(){
  try{ compactPlayers(); }catch(e){}
  try{ gmRelYear(); }catch(e){}
  for(const p of Object.values(G.players))p.fat=0; /* 겨울을 지나면 피로는 모두 풀린다 */
  if(G.mgr[G.user]&&G.mgr[G.user].yrs<=0&&!G.mgr[G.user].interim){ const m=G.mgr[G.user]; staffHistory('mgr',m,'계약 만료',G.user); G.mgr[G.user]=null; try{ mreqCloseOld(); }catch(e){} mail('운영팀','감독 계약 종료',`${m.name} 감독과의 계약이 끝났습니다. 개막 전까지 새 감독을 선임해야 합니다.`,{imp:true,kind:'감독',acts:[{l:'감독 후보 보기',a:'goWork',v:'감독'}]}); }
  if(G.mgr[G.user]&&G.mgr[G.user].interim){ G.mgr[G.user]=null; mail('운영팀','감독대행 체제 종료','감독대행 체제가 끝났습니다. 개막 전까지 새 감독을 선임해야 합니다.',{imp:true,kind:'감독',acts:[{l:'감독 후보 보기',a:'goWork',v:'감독'}]}); }
  if(G.tut&&!G.tut.done)G.tut.done=true; /* 비서 업무 안내는 창단 첫해에만 */
  try{ warFreeze(G.year); }catch(e){} /* 능력치가 바뀌기 전에 올해 WAR을 고정 */
  const before={}; for(const p of domestic(G.user))before[p.id]=ovr(p);
  try{ trnYearNote(G.year); }catch(e){} /* 집중훈련 회고는 겨울 성장·노화 전 능력으로 */
  for(const p of Object.values(G.players)){ if(p.devY===G.year){ delete p.devY; continue; } if(p.team!=null||(!p.prospect&&!p.foreign&&!p.fdPool)){ if(p.devQ)for(let j=p.devQ.i;j<3;j++)devQApply(p,j); /* 지난 시즌 남은 분기 몫 정리 */ const B={...p.r}; develop(p); try{ devSplit(p,B); }catch(e){} } } /* 분기 성장: 겨울엔 일부, 나머지는 시즌 중 세 번(04_growth) */ /* 소속 없는 FA·무적 선수도 나이를 먹는다 */ try{ abroadDev(); }catch(e){}
  if(G.draftClass)for(const id of G.draftClass){ const p=G.players[id]; if(p&&p.prospect)dropP(id); }
  G.year++; try{ trnNewYear(); }catch(e){} try{ posYear(); }catch(e){} syncMinSal(); for(const p of Object.values(G.players))if(!p.foreign&&p.sal>0&&p.sal<MIN_SAL)p.sal=MIN_SAL; /* 군 복무·해외 등 소속이 잠시 비어 있는 선수도 함께 올린다 */
  milNewYear(); delete G.futLn; /* 지난 시즌 2군 라인업을 새 시즌에 보여 주지 않는다(검수 11-09zi) */
  for(const p of Object.values(G.players)){ if(!(p.injOut>0))delete p.injK; delete p.lastStart; delete p.lastApp; delete p.prevApp; } /* 남은 재활 기간은 새해로 그대로 넘긴다(매일 줄어 0이 되면 평소처럼 복귀·재발 위험 처리). 예전에는 45일 이하를 1월 1일에 한꺼번에 지웠다 */
  for(const t of G.teams){ if(t.id!==ME()){ try{ aiYsPrune(t.id); }catch(e){} trimRoster(t.id,61); fillRoster(t.id,56);} t.rot=0; }
  const added=fillRoster(G.user,ROSTER_MIN); if(added.length)addLog(`정식 선수 최소 인원(${ROSTER_MIN}명)을 맞추려고 선수 ${added.length}명을 등록했습니다.`);
  for(const k in G.lineup){ const p=G.players[G.lineup[k]]; if(!p||p.team!==G.user)delete G.lineup[k]; }
  G.cal=buildCalendar(G.year); G.ps=null; G.camp=null; G.campInj=1; G.form=null; G.draft=null;
  G.sea={y:G.year,rec:G.teams.map(()=>({w:0,l:0,t:0})),months:[],fspend:{},repl:{},asiaRepl:{},mark:null};
  refreshScoutMarket(); if(!G.fmarket||G.fmarket.length<4)refreshFMarket(8); updateModes();
  makeDraftClass();
  if(G.fa&&G.fa.closed)G.fa=null;
  const ch=domestic(G.user).filter(p=>before[p.id]!=null).map(p=>({p,d:ovr(p)-before[p.id]})).sort((a,b)=>b.d-a.d);
  const up=ch.filter(x=>x.d>=2.5).slice(0,3), dn=ch.filter(x=>x.d<=-2.5).slice(-3);
  { const n=rosterN(G.user); if(n>ROSTER_MAX)mail('운영팀','로스터 정원 초과',`신인 합류로 로스터가 ${n}명입니다. 개막 전까지 ${ROSTER_MAX}명 이하로 줄여야 합니다. 선수단 화면의 로스터 정리에서 방출 후보를 볼 수 있습니다.`,{imp:false,kind:'일반',acts:[{l:'로스터 정리',a:'tab',v:'roster'}]}); }
  stop('새해',`${G.year}년이 밝았습니다. 모든 선수가 한 살 먹었습니다.${up.length?` 코치진이 성장을 확인한 선수: ${up.map(x=>x.p.name).join(', ')}.`:''}${dn.length?` 기량이 떨어진 선수: ${dn.map(x=>x.p.name).join(', ')}.`:''} 신인 ${domestic(G.user).filter(isRookie).length}명이 합류했습니다.`);
}
function aiWeekly(){
  const per=period();
  if(per==='season'&&G.day<=foreignDL()) for(const t of G.teams) if(t.id!==ME()) aiForeignReview(t.id);
  blockDaily(); aiBlockWeekly(); try{ marketWeek(); }catch(e){} try{ fBidWeek(); }catch(e){} try{ mlbHype(); }catch(e){} try{ fwatchWeek(); }catch(e){} try{ facWeek(); }catch(e){} try{ climateWeek(); }catch(e){} try{ mreqWeek(); }catch(e){} try{ mcfWeek(); }catch(e){} try{ mgrRelWeek(); if(period()==='season'&&G.day>=G.cal.open+7)mpickPlan(); }catch(e){} try{ grantCheck(); ownerPush(); }catch(e){}
  const dl=per==='season'&&G.day>=KD(7,1)&&G.day<=tradeDL(); if(tradeOpen()&&per!=='post'&&!G.unemp){ const pr=domestic(G.user).some(p=>p.listed)?.65:dl?.7:per==='season'?.45:.25; for(let i=0;i<(dl?2:1);i++)if(R()<pr&&(G.offers||[]).length<3)aiOffer(); }
}
/* 단장의 압박: 예상보다 성적이 나쁘거나 승부사 기질이면 트레이드로 살길을 찾는다 (0~1) */
function gmHeat(tid){ const t=team(tid); let h=gmTrait(tid)==='gambler'?.25:0; const per=period();
  if(per==='season'&&G.cal&&G.day>G.cal.open+20&&G.proj){ const st=standingsNow(); const rk=st.findIndex(x=>x.tid===tid)+1; const pr=G.proj.indexOf(tid)+1; if(pr>0)h+=clamp((rk-pr)/5,0,.6); if(rk>=8)h+=.15; }
  const g=t.gm; if(g&&G.year-g.since>=3)h+=.1; return clamp(h,0,1); }
function incomingOfferFair(receive,give){const U=team(G.user),a=receive.map(id=>G.players[id]).filter(Boolean),b=give.map(id=>G.players[id]).filter(Boolean);if(!a.length||!b.length)return false;const incoming=a.map(p=>tval(U,p,'in')),outgoing=b.map(p=>tval(U,p,'out')),total=sum(outgoing),value=stackIn(incoming),top=Math.max(...outgoing),core=startersOf(G.user);if(value<Math.max(0,total)*.97)return false;if(a.length>b.length&&Math.max(...incoming)<top*(b.some(p=>core.has(p.id))?.9:.8))return false;return true;}
function offerContactOk(tid,pid){const c=G.offerContact||{},pending=G.offers||[];if(pending.length>=2||pending.some(o=>o.from===tid))return false;const last=Object.values(c).filter(Number.isFinite);if(last.length&&G.day-Math.max(...last)<10)return false;if(c[tid+':*']!=null&&G.day-c[tid+':*']<21)return false;if(pid!=null&&c['p:'+pid]!=null&&G.day-c['p:'+pid]<45)return false;return true;}
function aiOffer(){ const ts=G.teams.filter(x=>x.id!==G.user&&!tradeCool(x.id)) /* 막 거래한 구단은 30일 동안 새 제안을 하지 않는다 */.map(t=>({t,w:gmHeat(t.id)+R()*.8})).sort((a,b)=>b.w-a.w).slice(0,3);
  for(const x of ts){ if(aiOfferFrom(x.t))return true; } return false; }
function aiOfferFrom(t){if(!offerContactOk(t.id))return false; const U=team(G.user);
  const mine=domestic(G.user).filter(p=>!(p.joinY>G.year)&&healthy(p)&&!hasNtc(p)&&!faLock(p)&&!p.noTrade&&offerContactOk(t.id,p.id)) /* 단장이 '트레이드 불가'로 정한 선수는 다른 구단이 묻지 않는다(커뮤니티 11-12) */.map(p=>({p,v:tval(t,p,'in')})).filter(x=>x.v>(x.p.listed?1.5:3)).sort((a,b)=>b.v-a.v).slice(0,8);
  if(!mine.length)return false; const listed=mine.filter(x=>x.p.listed); const tg=listed.length&&R()<.7?pick(listed):pick(mine);
  const tgU=tval(U,tg.p,'out'); // 우리가 그 선수를 내줄 때 느끼는 가치
  const core=new Set(domestic(t.id).map(p=>({p,v:tval(t,p,'out')})).sort((a,b)=>b.v-a.v).slice(0,3).map(x=>x.p.id));
  const pool=domestic(t.id).filter(p=>!core.has(p.id)&&healthy(p)&&!p.ys&&!hasNtc(p)).map(p=>({p,v:tval(t,p,'out'),u:tval(U,p,'in')})).filter(x=>x.v>0&&x.u>.3).sort((a,b)=>a.v-b.v);
  const need=tradeNeed(t,0); const cap=tg.v-need,topRatio=startersOf(G.user).has(tg.p.id)?.9:.8; let best=null,bu=Infinity;
  /* 실제 단장처럼 상대(우리)가 받아들일 만한 가장 아까운 쪽 조합을 내민다: 우리 평가로 내주는 가치의 .97배 이상 중 가장 작은 것. 예전에는 조건 안에서 우리에게 가장 이득인 조합을 골라 받은 제안이 늘 후했다.
     성적 압박이 큰 단장(gmHeat)만 조금 더 얹을 수 있다. 우리 쪽 이득이 그 한도를 넘는 조합은 만들지 않는다 */
  const hi=tgU*(1.08+Math.min(.12,Math.max(0,gmHeat(t.id))*.2))+.3;
  for(let i=0;i<pool.length;i++){ const a=pool[i]; if(a.v<=cap&&a.u>=tgU*.97&&a.u<=hi&&a.u<bu&&!offerBlockMsg({from:t.id,give:[a.p.id],get:[tg.p.id]})){ best=[a]; bu=a.u; }
    for(let j=i+1;j<pool.length;j++){ const b=pool[j]; const tv=a.v+b.v; const uv=stackIn([a.u,b.u]); if(tv<=cap&&uv>=tgU*.97&&uv<=hi&&Math.max(a.u,b.u)>=tgU*topRatio&&uv<bu&&!offerBlockMsg({from:t.id,give:[a.p.id,b.p.id],get:[tg.p.id]})){ best=[a,b]; bu=uv; } } }
  if(!best||!incomingOfferFair(best.map(x=>x.p.id),[tg.p.id]))return false;
  const off={id:'o'+Math.floor(R()*1e9),from:t.id,give:best.map(x=>x.p.id),get:[tg.p.id],exp:period()==='season'?Math.min(G.day+3,tradeDL()):G.day+3,day:G.day};
  { const key=off.from+':'+[...off.give].sort().join(',')+':'+off.get.join(','); G.offSeen=G.offSeen||{}; if(G.offSeen[key]!=null&&G.day-G.offSeen[key]<40)return false; G.offSeen[key]=G.day; } /* 같은 제안을 한 달 안에 되풀이하지 않는다 */
  G.offerContact=G.offerContact||{};G.offerContact[t.id+':*']=G.day;G.offerContact['p:'+tg.p.id]=G.day;
  try{ off.pot=offScoutNote(off); }catch(e){} try{ off.why=mgrFitWhy(t.id,tg.p); }catch(e){}
  G.offers=(G.offers||[]).concat(off);
  if(autoTradeOffer(off))return true; /* 업무 맡기기: 부단장이 거절. 맡기지 않았으면 진행을 멈추지 않는 소식으로 보낸다(할 일 목록·만료 임박 알림에 뜬다) */
  mail(FROM['트레이드']||'프런트',`${tshort(t.id)} 트레이드 제안: ${best.map(x=>x.p.name).join('·')} ↔ ${tg.p.name}`,`${off.asst?off.asst+'\n':''}${off.why?`${off.why}을(를) 찾는다는 감독 요청을 받고 움직인 제안입니다.\n`:''}${tname(t.id)} 단장이 ${best.map(x=>x.p.name).join(', ')}을(를) 주고 ${tg.p.name}을(를) 원한다는 트레이드를 제안했습니다. ${off.exp<G.day+3?'트레이드 마감일까지':'3일 안에'} 답해야 합니다.${gmHeat(t.id)>=.4?' 성적 압박을 받는 단장이라 적극적입니다.':''}${(()=>{ const x=aiSay(t.id,'pitch'); return x?`\n${gmOf(t.id).name} 단장: "${x}"`:''; })()}${off.pot?`\n\n[잠재력 추정 보고]\n${off.pot}`:''}`,{kind:'트레이드',acts:kindActs('트레이드')}); /* 제목은 거래 요약(플레이 테스트 11-13: 설명 문장이 제목) */ if(G.mail[0]){ G.mail[0].oid=off.id; G.mail[0].auto=['tro']; } return true;
}
/* 받은 제안이 지금 성사될 수 있는지(거부권·소속·상대 정원·샐러리캡). 막히면 사유, 되면 null.
   수락할 때와 AI가 제안을 만들 때 같은 판정을 쓴다: 예전에는 만들 때 이 검사를 안 해 수락하면 샐러리캡으로 취소되는 제안이 잦았다 */
function offerBlockMsg(o){ { const m=faLockMsg([...(o.get||[]),...(o.give||[])]); if(m)return m; } /* AI 제안 수락도 FA 공시 전 잠금을 따른다(코드 리뷰 11-13) */
  { const nt=ntcOfFor(o.get,o.from); if(nt)return `${nt.name}은(는) 트레이드 거부권이 있어 보낼 수 없습니다. 선수에게 ${tshort(o.from)}행 동의를 구할 수 있습니다.`; }
  { const nt=ntcOf(o.give); if(nt)return `${tname(o.from)} ${nt.name}은(는) 트레이드 거부권이 있어 데려올 수 없습니다.`; }
  if([...o.give,...o.get].some(id=>!G.players[id]))return '선수 상황이 바뀌어 성사되지 않았습니다.';
  if(o.give.some(id=>G.players[id].team!==o.from)||o.get.some(id=>G.players[id].team!==G.user))return '선수 상황이 바뀌어 성사되지 않았습니다.';
  const cash=o.cash==null?0:+o.cash,pk=pkNorm(o.pk); const t0=team(o.from);
  if(!Number.isSafeInteger(cash)||Math.abs(cash)>3000)return '현금 조건이 올바르지 않습니다(최대 30억 원).';
  if(cash>0&&spendable(G.user)<cash)return '우리 구단의 트레이드 현금 여유가 부족합니다.';
  if(cash<0&&(t0.cash||0)<-cash)return '상대 구단의 트레이드 현금 여유가 부족합니다.';
  {const why=pkCheck(o.from,o.get,o.give,pk);if(why)return why;}
  const ev=evalTrade(o.from,o.get,o.give,cash,pk);
  if(ev.theirN>ROSTER_MAX||ev.theirN<ROSTER_MIN)return `${t0.city} ${t0.nick} 로스터 사정이 바뀌어 성사되지 않았습니다(정식 ${ev.theirN}명).`;
  { const cy=sponSeason(); if(ev.theirPay>capOf(cy)&&ev.theirPay>(preSeason(cy)?capPayNext(o.from):capPay(o.from)))return `${t0.city} ${t0.nick} 단장: 그사이 샐러리캡 여유가 줄어 이 제안을 지킬 수 없습니다.`; } /* 양쪽 모두 같은 시즌 기준(검수 11-08b) */
  return null;
}
function answerOffer(id,yes){
  const o=(G.offers||[]).find(x=>x.id===id); if(!o)return {ok:false,msg:'제안이 없습니다.'};
  G.offers=G.offers.filter(x=>x.id!==id);
  if(!yes){ addLog(`${tname(o.from)}의 트레이드 제안을 거절했습니다.`); return {ok:true,msg:'거절했습니다.'}; }
  if(!tradeOpen())return {ok:false,msg:'트레이드 기간이 아닙니다.'};
  if(o.exp<G.day){ offerMailDone(o.id); return {ok:false,msg:'기한이 지난 제안입니다.'}; } /* 일일 정리 전이라도 만료 제안은 받지 않는다(검수 11-06) */
  /* 성사 여부(거부권·소속)를 먼저 보고, 구단주 승인(신뢰 비용)은 실제로 성사될 때만 반영한다 */
  { const why=offerBlockMsg(o); if(why)return {ok:false,msg:why}; }
  { const cd=tradeCool(o.from,o.give); if(cd){ offerMailDone(o.id); /* 거래 한도·간격에 걸린 제안은 다시 받을 수 없으니 목록에 되돌리지 않는다(카페 11-09) */ return {ok:false,msg:cd.cap?`올해 ${tshort(o.from)}와(과)는 이미 ${cd.n}번 거래해 더 거래할 수 없습니다.`:`${tshort(o.from)}와(과)는 ${dmd(cd.until)}까지 다시 거래할 수 없습니다(거래 뒤 ${TRADE_COOL}일).`}; } } /* 받아 둔 제안도 수락할 때 거래 간격을 다시 본다 */
  { const oc=tradeOwnerCheck(o.get,o.give,+(o.cash||0)); if(oc&&!oc.ok){ G.offers.unshift(o); return {ok:false,owner:true,msg:oc.msg}; } if(oc&&oc.ok)tradeOwnerOk(oc); } /* AI 제안은 우리가 o.get을 보내고 o.give를 받는다 */
  const t=team(o.from); const mv=mgrTradeView(o.from,o.get,o.give); const snap=tradeSnap([...o.give,...o.get]); const cash=+(o.cash||0),pk=pkNorm(o.pk); const grade=tradeGrade(o.from,o.get,o.give,cash,pk);
  o.give.forEach(id=>{ tradeTerms(G.players[id]); G.players[id].team=G.user; story(G.players[id],`트레이드로 ${tname(G.user)} 이적`,'move'); }); o.get.forEach(id=>{tradeTerms(G.players[id]); G.players[id].team=o.from; delete G.players[id].listed; /* 트레이드로 옮기면 계약한 구단에만 걸린 조건은 끝난다(돌아와도 되살아나지 않음) */ story(G.players[id],`트레이드로 ${tname(o.from)} 이적`,'move');});
  for(const k in G.lineup) if(o.get.includes(G.lineup[k]))delete G.lineup[k];
  const diff=sum(o.give.map(id=>trueVal(G.players[id])))-sum(o.get.map(id=>trueVal(G.players[id])))-cashVal(t,cash)+cashCost(t,cash);
  try{ frBacklash(o.get); }catch(e){}
  G.trades.push({me:G.user,y:G.year,d:G.day,with:o.from,gw:(team(o.from).gm||{}).id,give:o.get.map(id=>G.players[id].name),get:o.give.map(id=>G.players[id].name),diff,revealed:false,gi:[...o.give],go:[...o.get],snap,grade,...(cash?{cash}:{})});
  if(cash>0){payOut(G.user,cash,'etc');payIn(o.from,cash);G.spend.trC=(G.spend.trC||0)+cash;}else if(cash<0){payOut(o.from,-cash,'etc');payIn(G.user,-cash,'tradeIn');}
  if(pk.give.length||pk.get.length){pkMove(pk,o.from);const T=G.trades[G.trades.length-1];T.pk={give:pk.give.map(pkName),get:pk.get.map(pkName)};T.pkk={y:pk.y,give:[...pk.give],get:[...pk.get]};}
  t.rel=clamp(t.rel+3,0,100); prTrade(o.get,o.give,o.from); const tr=mvTr(),trNote=mvTradeNote(G.user,o.from,cash,pk); o.give.forEach(id=>mvLog('트레이드',G.players[id],o.from,G.user,trNote,0,tr)); try{ if(o.get.some(id=>ovr(G.players[id])>=55))ivRequest('trade',{}); }catch(e){} o.get.forEach(id=>mvLog('트레이드',G.players[id],G.user,o.from,trNote,0,tr)); offerDropMoved([...o.get,...o.give]);
  mgrTradeApply(mv); churnCheck(); mpickTraded(o.get); addLog(`${tname(o.from)}의 제안을 받아들였습니다: ${o.get.map(id=>G.players[id].name).join(', ')} ↔ ${o.give.map(id=>G.players[id].name).join(', ')}`);
  offerDropCool(); return {ok:true,grade,msg:'트레이드가 성사되었습니다.'};
}

