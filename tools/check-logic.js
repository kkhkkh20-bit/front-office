/* 규칙 점검: '오류는 안 나지만 결과가 틀린' 버그를 잡는다. 리뷰·플레이에서 나온 버그는 고치기 전에 여기에 먼저 시나리오로 넣는다.
 각 항목은 상황을 만들고 → 기능을 실제로 부르고 → 기대한 결과인지 확인한다.
 사용: node tools/check-logic.js   (dist/engine.js 필요: bash build.sh)
 주의: 시나리오는 큰 백틱 문자열 안에 있다. 안쪽에서 백틱을 쓰지 말고, 정규식의 \[ 같은 역슬래시는 두 번 써야 한다(한 번이면 사라져 엉뚱한 정규식이 된다). 가능하면 includes·startsWith를 쓴다. */
const fs=require('fs'), path=require('path');
const ENGINE=path.join(__dirname,'..','dist','engine.js'); if(!fs.existsSync(ENGINE)){ console.error('dist/engine.js가 없습니다. bash build.sh를 먼저 실행하세요.'); process.exit(2); }
{ let a=11; Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const results=[]; const T=(name,fn)=>results.push({name,fn});
const oe=console.error; console.error=()=>{};
const env=new Function('T',fs.readFileSync(ENGINE,'utf8')+`
const ok=(c,msg)=>{ if(!c)throw new Error(msg); };
const fresh=()=>{ DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); let g=0; while(G.fd&&!G.fd.done&&g++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true;
  for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; try{ if(p&&!foreignCheck(G.user,p))signForeign(G.user,id); }catch(e){} } };
const simTo=cond=>{ let n=0; while(n++<800&&!cond()){ G.live=null; G.res=null; G.stops=[]; for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; }
  if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); } if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,false); }catch(x){} if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(x){}
  (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(x){} }); try{ if(rosterN(G.user)>ROSTER_MAX)trimRoster(G.user,ROSTER_MAX); }catch(x){} try{ advance('day'); }catch(e){ G.day++; } } };

T('훈련 비용: 돌려 막기로 겨울 기회비용을 피할 수 없다(1b82f85 리뷰)',()=>{ fresh(); const p=playersOf(G.user).find(q=>q.isP); const ks=TRN_TOOLS[trnG(p)].filter(k=>k in p.r);
  p.trD={y:G.year,f:ks[0],s:3,by:{[ks[0]]:3}}; const one=trnCost(p); const s1=Object.values(one).reduce((a,b)=>a+b,0);
  p.trD={y:G.year,f:ks[0],s:ks.length,by:Object.fromEntries(ks.map(k=>[k,1]))}; const rot=trnCost(p); const s2=rot?Object.values(rot).reduce((a,b)=>a+b,0):0;
  ok(Math.abs(s1-3.3)<1e-6,'한 항목 집중 비용 합이 3.3이 아님: '+s1); ok(!one[ks[0]],'집중한 항목에 비용이 붙음'); ok(Math.abs(s2-ks.length*1.1)<1e-6,'돌려 막기 비용 합이 '+(ks.length*1.1)+'이 아님: '+s2); });

T('선수 출신 단장: 감독을 선임하면 관계 65, 그 밖의 출신은 60(9a32d31 이후 리뷰)',()=>{ fresh(); refreshMgrMarket(); G.gmP={name:'점검',age:40,bg:'corp',y0:G.year}; const a=G.mmarket[0]; hireMgr(a.id,2); const r1=G.mgr[G.user].rel;
  refreshMgrMarket(); G.gmP.bg='player'; const b=G.mmarket[0]; hireMgr(b.id,2); const r2=G.mgr[G.user].rel; ok(r1===60,'모기업 출신 관계 '+r1); ok(r2===65,'선수 출신 관계 '+r2+'(65여야 함)'); });

T('이직: 전임 단장이 데려온 선수는 내가 데려온 선수가 아니다(1b82f85 리뷰)',()=>{ fresh(); const p=playersOf(G.user)[0]; acqStamp(p,'트레이드',G.user,{from:0}); G.day+=10; G.gmSinceD=G.day; G.gmSince=G.year;
  ok(!mineOf(p),'취임 전에 온 선수가 내 선수로 잡힘'); G.day+=3; const q=playersOf(G.user)[1]; acqStamp(q,'트레이드',G.user,{from:0}); ok(mineOf(q),'취임 뒤 데려온 선수가 내 선수로 안 잡힘');
  delete G.gmSinceD; G.gmSince=G.year+1; if(G.myC)G.myC.y0=G.year+1; /* 실제로는 취임 때 단장 계약 시작 해도 함께 바뀐다(예산 전망이 단장 계약을 먼저 만들어 둘 수 있음) */ ok(!mineOf(q),'날짜 기록이 없는 예전 저장: 취임 전년도 영입이 내 선수로 잡힘'); });

T('외국인 재계약 위임: 이미 합의한 선수를 다시 처리해도 "떠남"으로 보고하지 않는다(1b82f85 리뷰)',()=>{ fresh(); simTo(()=>G.contract&&!G.contract.done&&G.contract.foreignEnd&&G.contract.foreignEnd.length&&G.day>=KD(12,1));
  const C=G.contract; ok(C&&C.foreignEnd.length,'외국인 재계약 대상이 없음(시나리오 준비 실패)'); const id=C.foreignEnd.find(i=>!C.foreignDrop.includes(i)); const p=G.players[id];
  const r=foReOffer(id,Math.ceil(foReFloor(p)*3/USD)*USD,0); ok(r.ok,'넉넉한 제안에도 합의 실패: '+r.msg);
  const n0=G.mail.length; autoFre(); const m=G.mail.slice(0,G.mail.length-n0+1).find(x=>/외국인 재계약/.test(x.body)); const line=(m&&m.body||'').split('\\n').find(l=>l.startsWith(p.name+':'))||'';
  ok(line,'위임 보고에 그 선수 줄이 없음'); ok(!/떠남|거절/.test(line),'합의한 선수가 보고에 거절·떠남으로 나옴: '+line); ok(C.fre[id].ok&&!C.foreignDrop.includes(id),'합의 상태가 바뀜'); });

T('새해: 작년 훈련 방향·기간·관찰이 시즌 회고에 남는다(개선 제안)',()=>{ fresh(); const p=playersOf(G.user).find(q=>q.isP&&q.age<=30); trnSet(p.id,'ctl'); G.trn[p.id].since=G.day-60; G.year++; trnNewYear();
  const R=G.reviews&&G.reviews[G.year-1]; ok(R&&R.L.some(l=>l.startsWith('[훈련 방향]')&&l.includes(p.name)),'회고에 훈련 방향 줄이 없음'); });

T('훈련 성적 비교: 1군과 2군을 나눠 보여 준다(개선 제안)',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+20); const p=playersOf(G.user).find(q=>!q.isP&&seasonTotal(q,G.year,'1군')); trnSet(p.id,'eye'); simTo(()=>G.day>=G.cal.open+50);
  const s=trnStatLine(p,'eye',G.trn[p.id].snap); ok(!/합산/.test(s),'아직 합산으로 보여 줌: '+s); ok(/1군|2군|아직 경기 기록/.test(s),'1군·2군 구분이 없음: '+s); });

T('이직: 협상 중 구단을 옮겨도 이전 구단 선수의 연봉을 바꿀 수 없다(d4a8da8 리뷰)',()=>{ fresh(); simTo(()=>G.contract&&!G.contract.done&&G.day>=KD(12,1)); const C=G.contract; ok(C&&C.ended.length,'연봉 협상 대상이 없음(준비 실패)');
  const old=G.user; salTalkInit(); const id=C.ended.find(i=>{ const q=G.players[i], n=C.neg&&C.neg[i]; return q&&n&&n.off!==q.sal; }); ok(id!=null,'준비 실패: 연봉이 바뀔 협상 대상 없음'); const p=G.players[id]; const sal0=p.sal; const nt=G.teams.find(t=>t.id!==old).id; G.gmSince=G.year; switchTeam(nt); const s1=p.sal;
  const C2=G.contract; let r=null; try{ r=confirmContracts(); }catch(e){ throw new Error('계약 확정 중 예외: '+e.message); } ok(p.team===old,'준비 실패: 선수 소속이 바뀜'); if(C2&&!C2.done&&r)throw new Error('준비 실패: 계약 확정이 막힘 · '+r); ok(p.sal===s1,'이전 구단 선수의 연봉이 새 구단 계약 확정으로 바뀜: '+s1+' → '+p.sal); ok(!G.contract||G.contract.done||G.contract.tid===G.user,'이직 뒤에도 이전 구단 계약 대상이 남음'); });

T('외국인 총액 한도: 기존 선수의 인센티브도 합산한다(d4a8da8 리뷰)',()=>{ fresh(); const yb=foreignOf(G.user).filter(x=>x.foreign==='용병'); ok(yb.length>=2,'준비 실패: 용병 2명 미만');
  const keep=yb.slice(0,2); for(const q of yb.slice(2)){ q.team=null; } const cap=fCap(G.user); const g=Math.round(cap*.39); keep.forEach(q=>{ q.sal=g; q.ctT=G.user; q.opt={a:Math.round(cap*.07),until:G.year+1}; });
  const cand=newForeign('용병',{isP:!keep[0].isP||!keep[1].isP?true:false}); cand.isP=keep[0].isP===keep[1].isP?!keep[0].isP:cand.isP; cand.ask=cap-2*g-Math.round(cap*.05); /* 보장만 더하면 한도 안, 인센티브까지 더하면 초과 */
  const err=foreignCheck(G.user,cand); ok(/한도/.test(err||''),'인센티브를 빼고 계산해 한도 초과인데 통과함: '+(err||'(통과)')); });

T('우리 팀 WAR: 이적 전 다른 구단에서 낸 기록은 넣지 않는다(d4a8da8 리뷰)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.isP); const y=G.year; const other=G.teams.find(t=>t.id!==G.user).id;
  p.hist=p.hist.filter(h=>h.y!==y); const mk=(t,pa,h,hr)=>({y,lvl:'1군',t,pos:p.pos,g:Math.round(pa/4),pa,ab:pa-8,h,d:Math.round(h*.2),tr:0,hr,bb:8,so:Math.round(pa*.2),rbi:hr*3,r:hr*3,sb:0,cs:0,hbp:0,sf:0,e:0});
  p.hist.push(mk(other,400,130,25)); p.hist.push(mk(G.user,80,14,0)); p.acq={k:'트레이드',y,d:G.day,tid:G.user,o0:60};
  const onlyUs=warOf(seasonTotalT(p,y,'1군',G.user),p); const W=warWithUs(p); ok(Math.abs(W.sum-onlyUs)<0.05,'우리 팀 WAR '+W.sum.toFixed(2)+' ≠ 우리 구단 기록만 '+onlyUs.toFixed(2)); });

T('해외 연수 변경: 새 프로그램 신청이 실패하면 기존 예약을 그대로 둔다(d4a8da8 리뷰)',()=>{ fresh(); simTo(()=>G.day>=KD(9,2)); const ks=Object.keys(OVS).filter(k=>ovsOpen(k)); ok(ks.length>=2,'준비 실패: 열린 프로그램 2개 미만');
  const [a,b]=ks; const pool=playersOf(G.user).filter(ovsElig); const lim=OVS[b].lim; ok(pool.length>lim+1,'준비 실패: 보낼 선수 부족');
  const P=pool[0]; ok(!setOvs(P.id,a),'첫 예약 실패'); for(const q of pool.slice(1,1+lim))setOvs(q.id,b); const spend=G.spend.dev; const msg=setOvs(P.id,b);
  ok(msg,'정원이 찬 프로그램 변경이 성공함(준비 실패)'); const cur=(G.ovs||[]).find(x=>x.pid===P.id); ok(cur&&cur.prog===a,'변경 실패 뒤 기존 예약이 사라짐'); ok(G.spend.dev===spend,'변경 실패 뒤 비용이 바뀜(환불·재청구)'); });

T('상무 합격: 입대일 전까지는 선수단에 남아 뛴다(f507415 리뷰)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign&&q.age<=26); ok(p,'준비 실패: 26세 이하 국내 선수 없음');
  for(const q of Object.values(G.players))if(q.mil&&q.mil.app)q.mil=null; p.mil={app:'jun'}; G.day=KD(4,15); milDaily(); ok(p.mil&&p.mil.unit==='상무'&&p.mil.from===KD(6,10),'준비 실패: 상무 합격·6월 10일 입대가 아님 '+JSON.stringify(p.mil));
  ok(playersOf(G.user).includes(p),'합격 직후(입대 56일 전) 출전 가능 선수 목록에서 빠짐'); ok(!isAway(p),'입대 전인데 복무 중(isAway)으로 처리됨'); ok(!/복무 중/.test(milText(p)),'입대 전인데 표시가 복무 중: '+milText(p));
  G.day=KD(6,10); milDaily(); ok(isAway(p)&&!playersOf(G.user).includes(p),'입대일에 선수단에서 빠지지 않음'); ok(!p.e1,'입대일에 1군 엔트리에 남아 있음'); });

T('해외 복귀: 복귀한 해에 나이·능력 변화가 한 번만 적용된다(f507415 리뷰)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP); p.age=34; p.svc=Math.max(p.svc||0,9);
  ovsLeave(p,'NPB','테스트',1,100,'해외 FA'); const a=(G.abroad||[]).find(x=>x.id===p.id); ok(a&&!G.players[p.id],'준비 실패: 해외 이적 안 됨'); a.y=G.year-1; /* 계약 1년이 끝난 시점 */
  abroadYear(); const q=G.players[p.id]; ok(a.back&&q,'준비 실패: 복귀하지 않음'); ok(q.age===35,'복귀하면서 나이가 '+q.age+'세(기대 35세)'); const r0=JSON.stringify(q.r);
  newYear(); const q2=G.players[p.id]; ok(q2,'준비 실패: 새해 뒤 선수가 사라짐'); ok(q2.age===35,'복귀 직후 새해에 한 살 더 먹음: '+q2.age+'세'); ok(JSON.stringify(q2.r)===r0,'복귀 직후 새해에 능력 변화가 한 번 더 적용됨'); });

T('훈련 회고: 새해 회고에 지난 시즌 경기 기록이 남는다(f507415 리뷰)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.isP&&!q.foreign); trnSet(p.id,'pow'); ok(G.trn&&G.trn[p.id]&&G.trn[p.id].f==='pow','준비 실패: 훈련 방향 설정'); const y=G.year;
  p.hist=p.hist.filter(h=>h.y!==y); p.hist.push({y,lvl:'1군',t:G.user,pos:p.pos,g:100,pa:400,ab:350,h:95,d:20,tr:1,hr:16,bb:40,so:70,rbi:60,r:55,sb:3,cs:1,hbp:5,sf:5,e:4});
  G.trn[p.id].since=G.day-70; const now=trnObs(p); ok(now&&/400타석/.test(now.stat),'준비 실패: 시즌 중 표시에 400타석이 없음: '+(now&&now.stat));
  G.year++; trnNewYear(); const RV=(G.reviews&&G.reviews[y]&&G.reviews[y].L||[]).find(x=>x.startsWith('[훈련 방향]'))||''; ok(RV,'시즌 회고에 훈련 방향 줄이 없음');
  const mine=RV.split(' / ').find(x=>x.includes(p.name))||''; ok(!mine.includes('아직 경기 기록이 없습니다')&&mine.includes('400타석'),'새해 회고에 지난 시즌 기록이 없음: '+mine.slice(0,160)); });

T('방출 뒤 재영입: 옛 계약 조건(상한 반영·옵션·주전 약속·거부권)이 되살아나지 않는다(f507415 2차 리뷰)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP&&ovr(q)>=45)||playersOf(G.user).find(q=>!q.foreign);
  p.faC=true; p.yrs=3; p.sal=1000; termsApply(p,{years:3,bonus:900,annual:1000,opt:200,role:0,ntc:true},'fa',G.year,true); ok(capBOf(p)>0&&hasNtc(p)&&p.opt&&p.roleProm,'준비 실패: 계약 조건이 붙지 않음');
  releasePlayer(p.id); ok(p.team==null,'준비 실패: 방출 안 됨'); if(rosterN(G.user)>=ROSTER_MAX)trimRoster(G.user,ROSTER_MAX-1); const e=signFree(p.id,G.user); ok(p.team===G.user,'준비 실패: 재영입 안 됨 '+(e||''));
  ok(capBOf(p)===0,'옛 계약의 상한 반영액이 되살아남: '+capBOf(p)); ok(!hasNtc(p),'옛 계약의 트레이드 거부권이 되살아남'); ok(!(ctOn(p)&&p.opt),'옛 계약의 옵션이 되살아남'); ok(!(ctOn(p)&&p.roleProm),'옛 계약의 주전 약속이 되살아남'); });

T('트레이드 거부권: 상대 팀 선수의 거부권도 지킨다(f507415 2차 리뷰)',()=>{ fresh(); const tid=G.teams.find(t=>t.id!==G.user).id; const q=domestic(tid).filter(x=>!x.ys).sort((a,b)=>ovr(a)-ovr(b))[0];
  q.faC=true; q.yrs=3; termsApply(q,{years:3,bonus:0,annual:q.sal,opt:0,role:null,ntc:true},'fa',G.year,true); ok(hasNtc(q),'준비 실패: 상대 선수에게 거부권이 없음');
  const give=domestic(G.user).filter(x=>!x.foreign).sort((a,b)=>ovr(b)-ovr(a)).slice(0,2).map(x=>x.id); const r=proposeTrade(tid,give,[q.id],0);
  ok(q.team===tid,'거부권이 있는 상대 선수가 트레이드로 넘어옴: '+(r&&r.msg||'')); ok(r&&!r.ok&&(r.msg||'').includes('거부권'),'거부권 때문에 막혔다는 안내가 없음: '+(r&&r.msg||''));
  const o={id:'oT',from:tid,give:[q.id],get:[give[0]],exp:G.day+7,day:G.day}; G.offers=[o]; const r2=answerOffer('oT',true); ok(q.team===tid&&!(r2&&r2.ok),'상대가 낸 제안으로는 거부권 선수가 넘어옴');
  ok(!corePool(tid).some(x=>x.id===q.id),'AI가 거부권 선수를 트레이드 카드로 내놓음'); });

T('예산 전망: 단장 연봉을 예상 지출에 넣는다(f507415 2차 리뷰)',()=>{ fresh(); myCInit(); ok(G.myC&&G.myC.sal>0,'준비 실패: 단장 계약 없음'); const E1=budget().E; G.myC.sal+=100; const E2=budget().E;
  ok(E2-E1===100,'단장 연봉을 1억 올려도 예상 지출 변화가 '+(E2-E1)+'(기대 100)'); });

T('2군 코치: 2군에서만 뛴 선수의 성장 배율은 2군 코치진 육성력을 따른다(33833ed 리뷰)',()=>{ fresh(); G.coach=G.coach||{}; const C=G.coach[G.user]=G.coach[G.user]||{}; for(const k of ['hc','bc','fb','fm'])if(!C[k])C[k]={name:'테스트',dv:55,sk:55}; const y=G.year;
  const mk=(q,lvl,pa)=>{ q.hist=q.hist.filter(h=>h.y!==y); if(pa)q.hist.push({y,lvl,t:G.user,pos:q.pos,g:Math.round(pa/4),pa,ab:pa-50,h:Math.round(pa*.25),d:20,tr:1,hr:10,bb:40,so:90,rbi:50,r:50,sb:5,cs:2,hbp:4,sf:4,e:5}); };
  const bats=playersOf(G.user).filter(q=>!q.isP&&!q.foreign); const f2=bats[0], f1=bats[1]; mk(f2,'1군',0); mk(f2,'퓨처스',500); mk(f1,'퓨처스',0); mk(f1,'1군',500);
  C.fb.dv=30; C.fm.dv=30; const a0=coachDevMult(f2), b0=coachDevMult(f1); C.fb.dv=88; C.fm.dv=88; const a1=coachDevMult(f2), b1=coachDevMult(f1);
  ok(a1>a0+.1,'2군 코치 육성력을 30→88로 올려도 2군 선수 성장 배율 변화 없음: '+a0.toFixed(3)+' → '+a1.toFixed(3)); ok(Math.abs(b1-b0)<1e-9,'1군에서만 뛴 선수가 2군 코치 영향을 받음');
  const s0=coachDevMult(f1); C.bc.dv=(C.bc.dv||50)+30; ok(coachDevMult(f1)>s0,'1군 선수가 1군 타격코치 영향을 받지 않음'); });

T('FA 등급: 같은 구단 동료가 먼저 FA를 선언해도 등급이 바뀌지 않는다(33833ed 리뷰)',()=>{ fresh(); simTo(()=>period()==='post'||(G.sea&&G.sea.over)); const four=domestic(G.user).filter(q=>!q.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,4).sort((a,b)=>a.id-b.id);
  ok(four.length===4,'준비 실패'); const sal=[5000,4900,4800,4700]; four.forEach((q,i)=>{ q.sal=sal[i]; q.salH=[{y:G.year-2,s:sal[i]},{y:G.year-1,s:sal[i]}]; q.svc=12; q.lastFA=null; q.faN=0; q.age=30; q.faC=false; q.ext=false; q.yrs=0; delete q.extNext; delete q.faSkip; for(const k in q.r)q.r[k]=Math.max(q.r[k],70); });
  for(const q of domestic(G.user))if(!four.includes(q)&&q.sal>=4000){ q.sal=500; q.salH=[]; }
  const X=four[3]; offseason(); ok(X.faGrade,'준비 실패: 대상 선수가 FA를 선언하지 않음'); ok(four.slice(0,3).every(q=>q.faFrom===G.user),'준비 실패: 고연봉 동료가 먼저 FA를 선언하지 않음');
  ok(X.faRank&&X.faRank.tm===4&&X.faGrade==='B','구단 연봉 4위 선수의 등급이 처리 순서 때문에 바뀜: 구단 '+(X.faRank&&X.faRank.tm)+'위 · '+X.faGrade+'등급(기대 4위 · B등급)'); });

T('입대한 선수의 옵션: 이미 달성한 옵션은 정산에 들어간다(33833ed 리뷰)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.isP&&!q.foreign); p.faC=true; p.yrs=2; termsApply(p,{years:2,bonus:0,annual:p.sal,opt:200,role:null,ntc:false},'fa',G.year,true);
  p.hist=p.hist.filter(h=>h.y!==G.year); p.hist.push({y:G.year,lvl:'1군',t:G.user,pos:p.pos,g:120,pa:450,ab:400,h:110,d:20,tr:2,hr:12,bb:40,so:80,rbi:60,r:60,sb:5,cs:2,hbp:5,sf:5,e:5});
  ok(optSettle(G.user)>=200,'준비 실패: 입대 전 옵션 미달성'); p.mil={unit:'현역',from:G.day-1,until:G.day+500}; ok(isAway(p),'준비 실패: 복무 중 아님');
  const got=optSettle(G.user); ok(got>=200,'입대 뒤 이미 달성한 옵션 2억이 정산에서 빠짐: '+got); });

T('AI 상한 정리: 받을 구단이 없어 방출한 선수는 무적 선수로 남는다(33833ed 리뷰)',()=>{ fresh(); const tid=G.teams.find(t=>t.id!==G.user).id; for(const t of G.teams)if(t.id!==tid)t.cash=-3000;
  const before=domestic(tid).filter(q=>q.age<=35&&ovr(q)>=30).map(q=>q.id); for(const id of before)G.players[id].age=Math.min(G.players[id].age,28);
  aiCapFix(tid,.3); const gone=before.filter(id=>!G.players[id]||G.players[id].team!==tid); ok(gone.length,'준비 실패: 방출된 선수 없음');
  const lost=gone.filter(id=>!G.players[id]); ok(!lost.length,'방출된 '+lost.length+'명이 무적 시장에 나오지 않고 데이터에서 사라짐'); ok(gone.every(id=>!G.players[id]||isFree(G.players[id])||G.players[id].team!=null),'방출 선수가 무적 선수 목록에 없음'); });

T('현역 복무 중에는 포지션 전환 훈련이 쌓이지 않는다(33833ed 리뷰)',()=>{ fresh(); if(period()!=='pre'&&period()!=='season')simTo(()=>period()==='pre'||period()==='season'); const p=playersOf(G.user).find(q=>!q.isP&&!q.foreign&&q.pos!=='1B');
  pexpOf(p)['1B']=10; p.pconv={pos:'1B',d:G.day}; p.mil={unit:'현역',from:G.day-1,until:G.day+500}; ok(isAway(p),'준비 실패: 복무 중 아님'); const e0=posExp(p,'1B'); posWeek(); const e1=posExp(p,'1B');
  ok(e1===e0,'현역 복무 중인데 전환 숙련도가 '+e0+' → '+e1); });

T('예산 전망: 받은 FA 보상금을 예상 수입에 넣는다(33833ed 리뷰)',()=>{ fresh(); const I1=budget().I; G.spend.compIn=(G.spend.compIn||0)+1000; const I2=budget().I; ok(I2-I1===1000,'보상금 10억을 받아도 예상 수입 변화가 '+(I2-I1)); });

const otherT=()=>G.teams.find(t=>t.id!==G.user).id;
T('이직: 외국인 재계약 결정(결별·인센티브)은 이직해도 그대로 지켜진다(e4305cc 리뷰)',()=>{ fresh(); simTo(()=>G.contract&&!G.contract.done&&G.contract.foreignEnd&&G.contract.foreignEnd.filter(id=>G.players[id]&&G.players[id].foreign==='용병').length>=2&&G.day>=KD(12,1));
  const C=G.contract; const old=G.user; const [a,b]=C.foreignEnd.filter(id=>G.players[id].foreign==='용병').map(id=>G.players[id]); ok(a&&b,'준비 실패: 재계약 대상 용병 2명 없음');
  C.foreignDrop.push(a.id); a.fleft=true; b.newSal=b.sal; b.fInc=200; C.fre=C.fre||{}; C.fre[b.id]={ok:true};
  G.gmSince=G.year; switchTeam(otherT()); const A=G.players[a.id]; ok(!(A&&A.team===old),'결별한 선수가 이전 구단과 재계약됨');
  ok(b.team===old,'준비 실패: 합의한 선수가 이전 구단에 없음'); ok(b.opt&&b.opt.a===200&&ctOn(b),'합의한 인센티브 2억이 빠짐: '+JSON.stringify(b.opt||null)); });

T('이직: 이전 구단의 신구장 공사는 그 구단이 이어서 완공한다(e4305cc 리뷰)',()=>{ fresh(); const old=G.user; const S=stadOf(old); S.proj={stage:'build',k:'mid',cap:21000,cost:9000,paid:0,done:G.day+5};
  G.gmSince=G.year; switchTeam(otherT()); G.day+=5; newStadDaily(); ok(!stadOf(old).proj&&stadOf(old).cap===21000,'이전 구단 신구장이 완공일이 지나도 공사 중: '+JSON.stringify(stadOf(old).proj)); });

T('이직: 이전 구단에서 한 투자 약속으로 새 구단이 벌점을 받지 않는다(e4305cc 리뷰)',()=>{ fresh(); G.pledges=[{k:'invest',base:capPay(G.user)*3,day:G.day,until:G.day+2,rep:null,done:false}];
  G.gmSince=G.year; switchTeam(otherT()); prInit(); const nt=team(G.user); const fan0=G.pr.fan, tr0=nt.trust; G.day+=3; ppDaily();
  ok(G.pr.fan===fan0&&nt.trust===tr0,'이전 구단 투자 약속으로 새 구단 여론·신뢰가 바뀜: 팬 '+fan0+'→'+G.pr.fan+', 신뢰 '+tr0+'→'+nt.trust); });

T('구단주 지원금: 받은 금액만큼만 예산 여유(지원 목표)가 늘어난다(e4305cc 리뷰)',()=>{ fresh(); try{ if(!G.goals)setGoals(); }catch(e){} ok(G.goals&&G.goals.y===sponSeason(),'준비 실패: 올해 구단 목표 없음'); const g0=budget().goalSup; grantApply(1000); const g1=budget().goalSup;
  ok(Math.abs(g1-g0-1000)<=5,'지원금 10억에 지원 목표가 '+(g1-g0)+' 늘어남(기대 1000)'); });

T('이직: 이전 구단 동석 관람의 건의 기회는 새 구단에서 쓸 수 없다(e4305cc 리뷰)',()=>{ fresh(); G.cwS={id:'cwT',day:G.day,gk:{d:G.day,h:G.user,a:otherT()},who:'own',why:'self',ms:7,res:'승',tags:['rout'],until:G.day+3,done:false,sugg:null,gift:null,lines:[]};
  G.gmSince=G.year; switchTeam(otherT()); const r=cwSuggest('fund'); ok(!G.cwS||G.cwS.done,'이직 뒤에도 이전 구단 동석 관람 건의 기회가 열려 있음: '+r); });

T('이직: 이전 구단에서 한 인터뷰는 새 구단 단장 발언으로 기사화되지 않는다(e4305cc 리뷰)',()=>{ fresh(); const old=G.user; (G.ivNewsQ=G.ivNewsQ||[]).push({day:G.day+1,k:'pre',outlet:'테스트일보',rep:'홍기자',ans:[{q:'각오는?',a:'"이직테스트 발언입니다"',tone:'',fx:{fan:3,press:0},outlet:'테스트일보',rep:'홍기자'}],md:false});
  G.gmSince=G.year; switchTeam(otherT()); G.day+=1; try{ ivNewsPub(); }catch(e){} ok(!(G.news||[]).some(x=>(x.t||'').includes('이직테스트')),'이전 구단 인터뷰가 새 구단 단장 발언으로 기사화됨'); });

T('스태프 영입 경쟁: 상대 구단으로 가면 상대가 제시한 연봉으로 계약한다(e4305cc 리뷰)',()=>{ fresh(); const mk=scoutMkt(); const s=mk[0]; ok(s,'준비 실패: 스카우트 후보 없음'); const t=otherT(); const bid=round5(s.sal*1.15); s.bid={t,sal:bid,v:99,k:'sc',exp:G.day-1};
  stBidExpire(); const L=stTeamL(t); const got=L.sc.find(x=>x.id===s.id); ok(got,'준비 실패: 상대 구단으로 가지 않음'); ok(got.sal===bid,'상대 제시 '+bid+'인데 실제 계약 '+got.sal); });

T('주장: 선수단 주장과 미디어데이 주장이 같은 선수다(e4305cc 리뷰)',()=>{ fresh(); const c=electCaptain(G.user); ok(c,'준비 실패: 주장 선출 안 됨'); const t=team(G.user); const other=domestic(G.user).find(p=>p.id!==c.id&&!p.foreign); t.capt=other.id;
  const m=mdCaptain(G.user); ok(m&&m.id===t.cap,'미디어데이 주장('+(m&&m.name)+')이 선수단 주장('+c.name+')과 다름'); });

T('무승부를 패배로 보도하지 않는다(e4305cc 리뷰)',()=>{ fresh(); simTo(()=>period()==='season'); const op=otherT(); let made=0; const n0=(G.news||[]).length;
  for(let i=0;i<300&&made<3;i++){ const rec={day:G.day,home:G.user,away:op,hs:3,as:3,res:'무'}; const k=(G.news||[]).length; G.news=(G.news||[]).filter(x=>!(x.k==='경기'&&x.d===G.day)); ivNewsAfterGame(rec); if((G.news||[]).length>k-0&&(G.news||[]).some(x=>x.k==='경기'&&x.d===G.day))made++; }
  ok(made,'준비 실패: 무승부 뒤 감독 기사가 나오지 않음'); ok(!(G.news||[]).some(x=>(x.b||'').includes('패배(3:3)')),'무승부 경기를 "패배(3:3)"로 보도함'); });

T('한국시리즈: 3승 3패에서 무승부가 나오면 4승을 할 때까지 경기를 더 한다(4213e4e 리뷰)',()=>{ fresh(); const [A,B]=G.teams.filter(t=>t.id!==G.user).map(t=>t.id); const sv=mkSeries('ks',A,B,G.day); sv.wh=3; sv.wl=3; sv.gi=6; sv.days[6]=G.day;
  G.ps={cur:sv,res:{},seeds:[A,B,0,0,0],round:'ks',done:false}; const sg=simGame, ag=applyGame; simGame=()=>({score:{h:3,a:3}}); applyGame=()=>{}; try{ psDay(G.day); } finally { simGame=sg; applyGame=ag; }
  ok(!G.ps.done,'3승 3패 무승부로 시리즈가 끝남: 우승 '+(G.ps.champ!=null?tname(G.ps.champ):'-')+' '+JSON.stringify(G.ps.res.ks||null)); ok(G.ps.cur&&G.ps.cur.days.length>7,'추가 경기 일정이 없음'); });

T('트레이드 샐러리캡: 상위 40명을 다시 골라 계산한다(4213e4e 리뷰)',()=>{ fresh(); const tid=G.teams.find(t=>t.id!==G.user).id; const D=()=>domestic(tid).filter(p=>!isRookie(p)).sort((a,b)=>b.sal-a.sal);
  let L=D(); while(L.length<44){ fillRoster(tid,L.length+4); L=D(); } const out=L[L.length-1]; const mine=domestic(G.user).filter(p=>!isRookie(p)&&!p.foreign).sort((a,b)=>a.sal-b.sal)[0]; mine.sal=Math.max(out.sal, L[41].sal); /* 받는 선수도 상위 40명 밖: 실제 합계는 그대로 */
  const before=capPay(tid); const e=evalTrade(tid,[mine.id],[out.id],0); const o1=mine.team, o2=out.team; mine.team=tid; out.team=o1; const real=capPay(tid); mine.team=o1; out.team=o2;
  ok(e.theirPay===real,'트레이드 뒤 실제 상위 40명 합계 '+real+'(전 '+before+')인데 계산은 '+e.theirPay); });

T('포스트시즌 경기도 부상 후유증 회복에 들어간다(4213e4e 리뷰)',()=>{ fresh(); simTo(()=>period()==='season'); const op=G.teams.find(t=>t.id!==G.user).id; const st=depth(G.user).start.filter(q=>!q.isP); ok(st.length,'준비 실패: 선발 타자 없음');
  for(const q of st){ q.injFx=[{n:'테스트',L:{con:2},P:{},need:1000,got:0,ap:{}}]; q.inj=0; q.injOut=0; }
  const g=simGame(G.day,G.user,op,true); applyGame(G.day,G.user,op,g,true); const got=sum(st.map(q=>q.injFx&&q.injFx[0]?q.injFx[0].got:0));
  ok(got>0,'포스트시즌 경기를 뛰었는데 후유증 회복 누적이 0'); });

T('상무 복무 선수는 퓨처스 경기에 나간다(4213e4e 리뷰)',()=>{ fresh(); simTo(()=>period()==='season'); const p=playersOf(G.user).find(q=>!q.isP&&!q.foreign); p.mil={unit:'상무',from:G.day-1,until:G.day+500}; ok(isAway(p),'준비 실패: 복무 중 아님');
  const pa=()=>{ const h=seasonTotal(p,G.year,'퓨처스'); return h?h.pa:0; }; const a0=pa(); for(let i=0;i<4;i++)futuresWeek(); ok(pa()>a0,'상무 복무 4주 동안 퓨처스 타석 0'); });

T('보상선수: 다른 구단으로 옮겨도 남은 다년계약은 그대로다(ae93216 리뷰)',()=>{ fresh(); const [A,B]=G.teams.filter(t=>t.id!==G.user).map(t=>t.id); const q=domestic(B).find(x=>!x.ys&&!x.foreign);
  q.sal=900; q.faC=true; q.ext=false; q.yrs=3; q.cyrs=4; const c={id:'cpT',pid:-1,name:'테스트',grade:'A',from:A,to:B,prev:500,day:G.day,stage:'pick',prot:[]}; compResolve(c,q.id);
  ok(q.team===A,'준비 실패: 보상선수가 옮기지 않음'); ok(q.yrs===3&&q.faC&&q.sal===900,'보상선수의 남은 계약이 바뀜: '+q.yrs+'년 · 연봉 '+q.sal+' · FA계약 '+q.faC); });

T('FA: 단장이 거절당한 제안으로는 계약하지 않는다(ae93216 리뷰)',()=>{ fresh(); simTo(()=>G.fa&&!G.fa.closed&&(G.fa.pool||[]).length>0); const F=G.fa; const id=F.pool.find(x=>G.players[x]&&G.players[x].team==null&&G.players[x].ask); ok(id!=null,'준비 실패: FA 후보 없음'); const p=G.players[id];
  p.ask={annual:1000,years:4}; F.ai[id]={}; negOf(id).mood=95; /* 기분이 좋아 협상을 접지는 않는 경우 */ const r=faNegotiate(id,{annual:30,years:4}); ok(!negOf(id).closed,'준비 실패: 협상이 닫힘'); ok(r&&r.msg,'준비 실패: 협상 응답 없음'); for(const t of G.teams)F.ai[id][t.id]=undefined; F.ai[id]={};
  ok(F.offers[id]||negOf(id).closed,'준비 실패: 제안 기록 없음'); for(let i=0;i<90&&p.team==null;i++){ G.day++; F.ai[id]={}; try{ faDay(G.day); }catch(e){} if(G.fa&&G.fa.ai)G.fa.ai[id]={}; }
  ok(!(p.team===G.user&&p.sal<=30),'거절당한 연 3000만원 제안으로 계약됨: '+(r.msg||'').slice(0,60)); });

T('감독 교체: 약속 위반 감면은 경질 후 선임과 바로 선임이 같다(ae93216 리뷰)',()=>{ const run=direct=>{ fresh(); const m=G.mgr[G.user]; m.sal=500; m.yrs=1.5; m.plv=[{d:G.day,k:'youth',t:''},{d:G.day,k:'youth',t:''}]; const s0=G.spend.mgr||0;
    const nx=G.mmarket.find(x=>x.id!==m.id); if(!direct)fireMgr(); hireMgr(nx.id,2); return (G.spend.mgr||0)-s0; };
  const a=run(false), b=run(true); ok(a===b,'경질 후 선임 '+a+' · 바로 선임 '+b+'(같아야 함)'); });

T('겨울에 받은 다음 시즌 지원금도 지원 한도·예산 여유에 들어간다(ae93216 재정 리뷰)',()=>{ fresh(); simTo(()=>G.last&&G.last.y===G.year); ok(sponSeason()===G.year+1,'준비 실패: 결산 뒤가 아님'); const t=team(G.user);
  const c0=supportCap(t), r0=budget().roomCap; grantApply(1000); const c1=supportCap(t), r1=budget().roomCap;
  ok(c1-c0===1000,'겨울 지원금 10억이 지원 한도에 안 들어감: '+(c1-c0)); ok(r1-r0===1000,'겨울 지원금 10억이 예산 여유(한도 기준)에 안 들어감: '+(r1-r0)); });

T('전력 보강 자금: 실제 영입 없이 선수 소식만으로 목적 달성이 되지 않는다(ae93216 재정 리뷰)',()=>{ fresh(); const t=team(G.user); const g={y:G.year,mk:0,d:G.day,amt:1500,pur:{k:'boost'},ok:true,by:'own',st:'open',until:G.day+30}; grants().unshift(g);
  const f=foreignOf(G.user)[0]; ok(f,'준비 실패: 외국인 선수 없음'); f.fy=G.year; G.day+=1; story(f,'부상으로 2주 이탈','inj'); const tr0=t.trust; grantCheck();
  ok(g.st==='open'&&t.trust===tr0,'영입 없이 부상 소식만으로 보강 완료 처리: 신뢰 '+tr0+'→'+t.trust);
  const other=G.teams.find(x=>x.id!==G.user).id; const q=domestic(other).find(x=>!x.ys); q.team=G.user; mvLog('트레이드',q,other,G.user,'테스트'); grantCheck(); ok(g.st==='done','실제 영입 뒤에도 보강 완료로 처리되지 않음'); });

T('훈련 일괄 선택: 코치 추천과 같은 항목을 골라도 단장 요청으로 남는다(63ca683 리뷰)',()=>{ fresh(); const p=playersOf(G.user).find(q=>q.isP&&!q.foreign); const rec=trnCoachPick(p); const ks=Object.keys(TRN[trnG(p)]).filter(k=>k!=='bal'&&k!==rec);
  trnSet(p.id,ks[0]); trnSetMany({[p.id]:rec}); const T=G.trn&&G.trn[p.id]; ok(T&&T.by==='gm'&&T.f===rec,'일괄 선택한 '+rec+'이(가) 자동 위임으로 바뀜: '+JSON.stringify(T&&{by:T.by,f:T.f})); });

T('현역 복무 중에는 선발 수업으로 체력이 늘지 않는다(63ca683 리뷰)',()=>{ fresh(); simTo(()=>period()==='season'); const p=playersOf(G.user).find(q=>q.isP&&!q.foreign); G.prole=G.prole||{}; G.prole[p.id]={k:'sp2',y:G.year}; p.e1=false; p.r.sta=25;
  p.mil={unit:'현역',from:G.day-1,until:G.day+500}; ok(rpPlanOf(G.user,p)==='sp2'&&isAway(p),'준비 실패'); for(let i=0;i<8;i++)try{ rpWeek(); }catch(e){} ok(p.r.sta===25,'현역 복무 중 체력이 25 → '+p.r.sta); });

T('포지션 전환: 이미 하는 전환을 다시 눌러도 감독 관계가 내려가지 않는다(63ca683 리뷰)',()=>{ fresh(); const m=G.mgr[G.user]; m.ego=80; m.rel=60; delete m.pl; const p=depth(G.user).start.find(q=>!q.isP&&q.pos!=='1B'); ok(p,'준비 실패'); p.age=25; G.players[p.id]=p;
  const r1=posConv(p.id,'1B'); ok(p.pconv&&p.pconv.pos==='1B','준비 실패: 전환 시작 안 됨 '+r1); const a=m.rel; posConv(p.id,'1B'); posConv(p.id,'1B'); ok(m.rel===a,'같은 전환을 다시 눌러 관계가 '+a+' → '+m.rel); });

T('개막 전 방출한 외국인 선수의 보장 연봉도 그 시즌 지출에 들어간다(ba9e8f9 리뷰)',()=>{ fresh(); ok(G.day<G.cal.open,'준비 실패: 개막 전이 아님'); const p=foreignOf(G.user).find(q=>q.foreign==='용병'); ok(p,'준비 실패: 외국인 없음'); p.sal=1000;
  const others=sum(foreignOf(G.user).filter(q=>q!==p).map(q=>q.sal)); releaseForeign(p.id); openingDay(); const fs=G.sea.fspend[G.user]||0; ok(fs-others===1000,'방출한 선수 보장 연봉 10억이 지출에서 빠짐: 외국인 지출 '+fs+'(남은 선수 '+others+')'); });

T('로스터 최소 인원: 육성선수는 빼고 정식 선수 수로 보충한다(ba9e8f9 리뷰)',()=>{ fresh(); const tid=G.teams.find(t=>t.id!==G.user).id; let ps=playersOf(tid).filter(p=>!p.ys); const ys=playersOf(tid).filter(p=>p.ys);
  for(const p of ps.slice(40))delete G.players[p.id]; let k=ys.length; for(const p of playersOf(tid).filter(q=>!q.ys).slice(0,Math.max(0,8-k))){ } while(playersOf(tid).filter(q=>q.ys).length<8){ const q=newPlayer({age:20,isP:false,base:30,pot:40,team:tid,dev:true}); q.ys=true; }
  ok(rosterN(tid)===40,'준비 실패: 정식 '+rosterN(tid)); fillRoster(tid,45); ok(rosterN(tid)>=45,'정식 40명+육성 8명인데 45명 보충 뒤 정식 '+rosterN(tid)+'명'); });

T('포스트시즌 엔트리: 확장 엔트리는 정리되고, 등록 마감 뒤 데려온 선수는 뛸 수 없다(ba9e8f9 포스트시즌 리뷰)',()=>{ fresh(); simTo(()=>period()==='post'&&G.ps&&!G.ps.done); for(let i=0;i<2;i++){ G.stops=[]; G.live=null; G.res=null; try{ advance('day'); }catch(e){} }
  ok(period()==='post','준비 실패: 포스트시즌이 아님'); const lim=entryLimit(); const over=G.teams.map(t=>({t:t.id,n:playersOf(t.id).filter(p=>p.e1).length})).filter(x=>x.n>lim);
  ok(!over.length,'포스트시즌 엔트리 한도 '+lim+'명을 넘는 구단: '+over.map(x=>tshort(x.t)+' '+x.n+'명').join(', '));
  const fp=freeList()[0]; if(fp){ const e=signFree(fp.id,G.user); ok(fp.team!==G.user,'포스트시즌 중 무적 선수 영입이 됨'); void e; }
  const other=G.teams.find(t=>t.id!==G.user).id; const q=domestic(other).find(x=>!x.ys&&healthy(x)&&!x.e1); q.team=G.user; mvLog('무적 영입',q,other,G.user,'테스트'); delete q.downDay; ok(!canUp(q),'등록 마감 뒤 데려온 선수를 포스트시즌 1군에 올릴 수 있음'); });

T('무적 선수로 은퇴해도 은퇴 기록·명예의 전당 심사를 거친다(52ea599 리뷰)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP); p.aw=[(G.year-3)+' MVP',(G.year-2)+' MVP']; toFree(p,'테스트 방출'); p.freeSince=G.year-10; const nm=p.name;
  freeYear(); ok(!G.players[p.id],'준비 실패: 은퇴하지 않음'); ok((G.hof||[]).some(r=>r.name===nm),'MVP 2회 선수가 무적 은퇴 경로에서 명예의 전당에 빠짐'); ok((G.legends||[]).some(r=>r.name===nm),'통산 은퇴 기록에 빠짐'); });

T('감독 재계약: 같은 제안을 다시 눌러도 연봉이 또 오르지 않는다(52ea599 리뷰)',()=>{ fresh(); const m=G.mgr[G.user]; m.yrs=0; m.sal=100; renewMgr(2); const s1=m.sal; renewMgr(2); renewMgr(2); ok(m.sal===s1&&m.yrs===2,'재계약을 다시 눌러 연봉 '+s1+' → '+m.sal); });

const obCoachSetup=()=>{ fresh(); obInit(); let ob=G.ob.find(o=>o.isP&&o.path==='coach'&&obWhere(o).k==='free')||G.ob.find(o=>obWhere(o).k==='free'); ok(ob,'준비 실패: OB 없음'); ob.isP=true; ob.cy=8; ob.path='coach'; ob.age=45; G.coach[G.user]=G.coach[G.user]||{};
  const c=obCoach(ob); c.role='pc'; c.yrs=1; c.age=45; G.coach[G.user].pc=c; return {ob,c}; };
T('OB 코치: 계약이 끝난 코치가 다른 보직 후보로 겹쳐 올라오지 않고, 고른 보직으로 채용된다(52ea599 코치 리뷰)',()=>{ const {ob,c}=obCoachSetup(); obYear(); coachYear(); /* 실제 새해 처리 순서 */ const same=(G.cmarket||[]).filter(x=>x.ob===ob.id);
  ok(same.length===1,'같은 코치가 후보 목록에 '+same.length+'번('+same.map(x=>CROLE[x.role].l).join(', ')+')'); const pick1=same[0]; const role=pick1.role; const want=same.find(x=>x.role==='pc')||pick1; hireCoach(want.id,2); ok(G.coach[G.user][want.role]&&G.coach[G.user][want.role].ob===ob.id,'고른 '+CROLE[want.role].l+' 자리에 채용되지 않음'); });

T('OB 코치: 같은 코치의 나이가 OB 목록과 코치 목록에서 같다(52ea599 코치 리뷰)',()=>{ const {ob,c}=obCoachSetup(); obYear(); coachYear(); const all=[...(G.cmarket||[]),...Object.values(G.coach).flatMap(C=>CKEYS.map(k=>C[k]).filter(Boolean))].filter(x=>x.ob===ob.id);
  ok(all.length,'준비 실패: 코치 기록 없음'); ok(all.every(x=>x.age===ob.age),'OB '+ob.age+'세인데 코치 목록 '+all.map(x=>x.age).join('/')+'세'); });

T('선수 평가: 우리 주전과의 차이는 화면 점수(100점 척도) 차이로 말한다(81ceeb7 리뷰)',()=>{ fresh(); let hit=0; for(const p of Object.values(G.players).filter(q=>q.team!=null&&q.team!==G.user&&!q.foreign).slice(0,80)){ const r=curExplain(p); const t=[].concat(r||[]).join(' ');
    const m=t.match(/\\((\\d+)\\)보다 ([+-]?\\d+)/); const c=t.match(/종합 (\\d+)/); if(!m||!c)continue; hit++; ok(+c[1]-+m[1]===+m[2],'종합 '+c[1]+', 주전 '+m[1]+'인데 차이를 '+m[2]+'로 표시'); }
  ok(hit,'준비 실패: 비교 문장이 나온 선수 없음'); });

T('예상 평균자책점 범위: 아래쪽 값이 위쪽 값보다 크게 뒤집히지 않는다(81ceeb7 리뷰)',()=>{ fresh(); const pf=projFit; projFit=()=>({a:1,b:-.1,r:.3,n:40,y:G.year}); let r; try{ r=projKBO({isP:true},60,0); } finally { projFit=pf; }
  const m=r.txt.match(/([\\d.-]+)~([\\d.-]+)/); ok(m&&+m[1]<=+m[2],'범위가 뒤집힘: '+r.txt); });

T('투수 이닝: 도루 실패로 잡은 아웃도 투수 아웃 수에 들어간다(c1f41cf 리뷰)',()=>{ fresh(); const T2=G.teams.map(t=>t.id); let cs=0, bad=[];
  for(let i=0;i<160;i++){ const h=T2[i%T2.length], a=T2[(i+3)%T2.length]; const g=simGame(G.day,h,a,false); const pit=[...g.S.h.box.values()].filter(x=>x.outs!=null); const outs=sum(pit.map(x=>x.outs||0));
    cs+=sum([...g.S.a.box.values()].map(x=>x.cs||0)); if(outs!==3*g.line.a.length)bad.push(outs+'/'+3*g.line.a.length); }
  ok(cs>0,'준비 실패: 도루 실패가 한 번도 없음'); ok(!bad.length,'홈 투수 아웃 합계가 이닝×3과 다른 경기 '+bad.length+'개 (예: '+bad.slice(0,3).join(', ')+')'); });

T('자책점: 승계주자가 들어오면 그 주자를 내보낸 투수의 자책점이다(c1f41cf 리뷰)',()=>{ fresh(); const [A,B]=G.teams.filter(t=>t.id!==G.user).map(t=>t.id); for(const t of [A,B]){ const m=G.mgr[t]; if(m){ m.small=0; m.interim=false; } }
  const oOut=outcome, oMP=mgrPush, oST=stealTry, oRA=relAvail; relAvail=()=>true; let k=0; outcome=()=>{ k++; return k===1?'BB':k===2?'HR':'K'; }; mgrPush=t=>k>=1?-1000:oMP(t); /* 첫 타석(볼넷) 뒤 투수를 바꾸게 */ stealTry=()=>0;
  let g; try{ g=simGame(G.day,A,B,false); } finally { outcome=oOut; mgrPush=oMP; stealTry=oST; relAvail=oRA; }
  const pit=[...g.S.h.box.values()].filter(x=>x.outs!=null&&(x.bf||0)>0); const ers=pit.map(x=>x.er||0); ok(g.score.a===2,'준비 실패: 원정 2점이 아님('+g.score.a+')'); ok(pit.length>=2,'준비 실패: 투수 교체 없음');
  ok(pit[0].er===1&&sum(ers)===2&&ers.filter(x=>x===1).length===2,'선발 '+(pit[0].er||0)+'자책 · 구원 '+ers.slice(1).join('/')+'자책(기대 선발 1 · 구원 1)'); });

T('퍼펙트게임: 실책으로 주자가 나가면 퍼펙트가 아니다(c1f41cf 기록 리뷰)',()=>{ fresh(); const [A,B]=G.teams.filter(t=>t.id!==G.user).map(t=>t.id); const sp=domestic(A).find(p=>p.isP); G.feats=[];
  const g={S:{h:{tid:A,pitchers:[sp.id],box:new Map([[sp.id,{outs:27,h:0,bb:0,bf:28,er:0,so:5}]])},a:{tid:B,pitchers:[],box:new Map()}},score:{h:1,a:0}};
  featGame(G.day,g); ok(!(G.feats||[]).some(f=>f.k==='pg'),'실책 출루(28타자 27아웃)가 있는데 퍼펙트게임으로 기록됨'); ok((G.feats||[]).some(f=>f.k==='nh'),'노히트노런으로는 기록돼야 함'); });

T('타점: 실책으로 들어온 득점에는 타점을 주지 않는다(c1f41cf 기록 리뷰)',()=>{ fresh(); const T2=G.teams.map(t=>t.id); let er=0, bad=0;
  for(let i=0;i<300;i++){ const h=T2[i%T2.length], a=T2[(i+5)%T2.length]; const g=simGame(G.day,h,a,false);
    for(const k of ['a','h']){ const half=k==='a'?0:1; const eRuns=sum(g.pbp.filter(r=>r.length>=10&&r[0]%2===half&&r[9]).map(r=>r[6]||0)); er+=eRuns; const rbi=sum([...g.S[k].box.values()].map(x=>x.rbi||0)); if(rbi>g.score[k]-eRuns)bad++; } }
  ok(er>0,'준비 실패: 실책 득점이 한 번도 없음'); ok(!bad,'실책 득점에 타점이 붙은 경우 '+bad+'번'); });

T('감독 교체: 전임 감독과 한 기용 합의는 새 감독에게 이어지지 않는다(c1f41cf 감독 리뷰)',()=>{ fresh(); const m=G.mgr[G.user]; const p=playersOf(G.user).find(q=>!q.isP); G.pact={y:G.year,on:true,day:G.day,mid:m.id,t:[{id:p.id,b:4}],log:[]};
  ok(pactB(p)===4,'준비 실패: 합의 가산점 없음'); const nx=G.mmarket.find(x=>x.id!==m.id); hireMgr(nx.id,2); ok(pactB(p)===0,'새 감독인데 전임 감독 합의 가산점 '+pactB(p)+'이 남음'); });

T('노히트노런 알림: 실점한 경기는 노히트노런이 아니다(c1f41cf 감독 리뷰)',()=>{ fresh(); const sp=playersOf(G.user).find(q=>q.isP); const op=G.teams.find(t=>t.id!==G.user).id; const n0=(G.news||[]).length, s0=JSON.stringify(G.stops||[]).length;
  const g={S:{h:{tid:G.user,sp:{id:sp.id},box:new Map([[sp.id,{outs:27,h:0,bb:2,er:1,so:8,pc:110}]])},a:{tid:op,box:new Map()}},score:{h:2,a:1}}; milestones(g,'h');
  const txt=JSON.stringify((G.news||[]).slice(0))+JSON.stringify(G.stops||[]); ok(!txt.includes('노히트노런'),'1실점 경기에 노히트노런 알림'); });

T('스폰서: 정규시즌이 끝난 뒤 맺은 다음 시즌 계약은 올해 성과 보너스를 주지 않는다(c1f41cf 스폰서 리뷰)',()=>{ fresh(); sponInit(); const S=G.spon; const k=Object.keys(SPON_SLOT)[0]; for(const x in S.c)delete S.c[x];
  S.c[k]={co:'테스트상사',ind:'유통',amt:500,y0:G.year,until:G.year+1,first:0,ps:200,champ:200}; G.ps={seeds:[G.user],res:{}}; const r=sponSettle(G.year,{champ:G.user});
  ok(r.base===0,'준비 실패: 올해 기본 수입이 0이 아님'); ok(r.bonus===0,'올해 효력이 없는 계약이 성과 보너스 '+r.bonus+' 지급'); });

T('트레이드로 떠났다 돌아온 선수의 끝난 계약 조건이 되살아나지 않는다(c1f41cf 스폰서 리뷰)',()=>{ fresh(); const other=G.teams.find(t=>t.id!==G.user).id; const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP&&ovr(q)>=40);
  p.faC=true; p.yrs=3; termsApply(p,{years:3,bonus:900,annual:p.sal,opt:200,role:0,ntc:false},'fa',G.year,true); ok(capBOf(p)>0&&p.roleProm,'준비 실패');
  const q1=domestic(other).find(x=>!x.ys&&!x.foreign); G.offers=[{id:'t1',from:other,give:[q1.id],get:[p.id],exp:G.day+7,day:G.day}]; answerOffer('t1',true); ok(p.team===other,'준비 실패: 트레이드 안 됨');
  G.offers=[{id:'t2',from:other,give:[p.id],get:[q1.id],exp:G.day+7,day:G.day}]; answerOffer('t2',true); ok(p.team===G.user,'준비 실패: 되돌아오지 않음');
  ok(capBOf(p)===0,'상한 반영액이 되살아남: '+capBOf(p)); ok(!(ctOn(p)&&p.opt),'옵션이 되살아남'); ok(!(ctOn(p)&&p.roleProm),'주전 약속이 되살아남'); });

T('포스트시즌: 로스터 초과·건강한 야수 부족이면 진행을 막는다(90e6fa8 리뷰)',()=>{ fresh(); simTo(()=>period()==='post'&&G.ps&&!G.ps.done); ok(period()==='post','준비 실패');
  while(rosterN(G.user)<=ROSTER_MAX)newPlayer({age:22,isP:false,base:30,pot:35,team:G.user}); G.res=null; G.live=null; ok(/로스터/.test(blocker()),'포스트시즌에 정원 '+rosterN(G.user)+'명인데 진행됨');
  trimRoster(G.user,ROSTER_MAX); for(const p of playersOf(G.user))if(!p.isP)p.injOut=20; ok(blocker().includes('야수'),'건강한 야수가 없는데 진행됨: '+blocker()); });

T('보강 자금: 받은 직후 영입해도 목적대로 쓴 것으로 본다(90e6fa8 리뷰)',()=>{ fresh(); simTo(()=>period()==='season'); G.day=KD(7,2); const t=team(G.user); t.owner='win'; t.trust=60; const ur=uRank; uRank=()=>1;
  try{ for(let i=0;i<80&&!(G.grants||[]).some(g=>g.pur&&g.pur.k==='boost');i++)ownerPush(); } finally { uRank=ur; } const g=(G.grants||[]).find(x=>x.pur&&x.pur.k==='boost'); /* 지원 목록을 다시 읽지 않고 바로 영입(실제 흐름) */ ok(g,'준비 실패: 보강 자금 없음');
  const other=G.teams.find(x=>x.id!==G.user).id; const q=domestic(other).find(x=>!x.ys); q.team=G.user; mvLog('트레이드',q,other,G.user,'테스트'); grantCheck(); ok(g.st==='done','지원 직후 영입했는데 목적 달성으로 보지 않음(상태 '+g.st+')'); });

T('외국인 교체 자금: 방출만 하고 새로 데려오지 않으면 목적 달성이 아니다(90e6fa8 리뷰)',()=>{ fresh(); const f=foreignOf(G.user).find(q=>q.foreign==='용병'); ok(f,'준비 실패'); const oo=ownOdds; ownOdds=()=>1; try{ ownerAsk(500,{k:'frep',pid:f.id}); } finally { ownOdds=oo; }
  const g=grants().find(x=>x.pur&&x.pur.k==='frep'); ok(g&&g.ok,'준비 실패: 자금 승인 안 됨'); const t=team(G.user); const tr0=t.trust; releaseForeign(f.id); grantCheck(); ok(g.st==='open'&&t.trust===tr0,'대체 영입 없이 방출만으로 목적 달성(신뢰 '+tr0+'→'+t.trust+')');
  const nf=(G.fmarket||[]).map(id=>G.players[id]).find(q=>q&&q.team==null&&q.foreign==='용병'&&!foreignCheck(G.user,q)); if(nf){ signForeign(G.user,nf.id); grantCheck(); ok(g.st==='done','대체 외국인을 데려왔는데도 목적 달성으로 보지 않음'); } });

T('FA 미계약으로 은퇴해도 명예의 전당 심사를 거친다(90e6fa8 리뷰)',()=>{ fresh(); simTo(()=>G.fa&&!G.fa.closed&&(G.fa.pool||[]).length>0); const F=G.fa; const id=F.pool.find(x=>G.players[x]&&G.players[x].team==null); const p=G.players[id]; ok(p,'준비 실패');
  p.age=37; p.aw=[(G.year-3)+' MVP',(G.year-2)+' MVP']; for(const x of [...F.pool])if(x!==id){ const q=G.players[x]; if(q&&q.team==null){ delete G.players[x]; } } F.pool=[id]; F.ai[id]={}; delete F.offers[id]; const nm=p.name; faClose();
  ok(!G.players[id]||G.players[id].team==null,'준비 실패'); if(G.players[id]&&G.players[id].team==null&&isFree(G.players[id]))throw new Error('준비 실패: 무적 선수로 남음'); ok((G.hof||[]).some(r=>r.name===nm),'MVP 2회 FA 미계약 은퇴자가 명예의 전당에 없음'); });

T('스페이스바 자동 진행 설정 기본값은 "묻지 않음"',()=>{ fresh(); ok(!G.advAsk,'새 게임에서 진행 전에 묻기가 켜져 있음'); });
`);
try{ env(T); }catch(e){ console.error=oe; console.log('준비 실패: '+e.stack.slice(0,400)); process.exit(1); }
let fail=0; for(const t of results){ try{ t.fn(); console.log('통과  '+t.name); }catch(e){ fail++; console.log('실패  '+t.name+'\n      → '+String(e.message).slice(0,300)); } }
console.error=oe;
console.log(fail?`규칙 점검: ${results.length}개 중 ${fail}개 실패`:`규칙 점검: ${results.length}개 모두 통과`); process.exit(fail?1:0);
