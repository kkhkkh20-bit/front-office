/* 규칙 점검: '오류는 안 나지만 결과가 틀린' 버그를 잡는다. 리뷰·플레이에서 나온 버그는 고치기 전에 여기에 먼저 시나리오로 넣는다.
 각 항목은 상황을 만들고 → 기능을 실제로 부르고 → 기대한 결과인지 확인한다.
 사용: node tools/check-logic.js   (dist/engine.js 필요: bash build.sh). 일부만: ONLY=감사 node tools/check-logic.js
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
  releasePlayer(p.id); ok(p.team==null,'준비 실패: 방출 안 됨'); p.relD-=400; /* 방출한 구단은 1년 뒤에야 다시 계약할 수 있다 */ if(rosterN(G.user)>=ROSTER_MAX)trimRoster(G.user,ROSTER_MAX-1); const e=signFree(p.id,G.user); ok(p.team===G.user,'준비 실패: 재영입 안 됨 '+(e||''));
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
  ok(four.length===4,'준비 실패'); const sal=[5000,4900,4800,4700]; four.forEach((q,i)=>{ q.sal=sal[i]; q.salH=[{y:G.year-2,s:sal[i]},{y:G.year-1,s:sal[i]}]; q.svc=12; q.lastFA=null; q.faN=0; q.age=30; q.faC=false; q.ext=false; q.yrs=0; delete q.extNext; q.faSkip=G.year-1; /* 신청 확률을 1로(무작위로 3%가 남는 것 때문에 준비가 흔들리지 않게) */ for(const k in q.r)q.r[k]=Math.max(q.r[k],70); });
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

T('프랜차이즈 스타를 트레이드하면 팬이 반발한다(화면 설명대로, 바쁜 단장 시뮬에서 발견)',()=>{ fresh(); const other=G.teams.find(t=>t.id!==G.user).id; const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP); p.fr={tid:G.user,y:G.year-3};
  const q1=domestic(other).find(x=>!x.ys&&!x.foreign); prInit(); const f0=G.pr.fan; G.offers=[{id:'fr1',from:other,give:[q1.id],get:[p.id],exp:G.day+7,day:G.day}]; answerOffer('fr1',true); ok(p.team===other,'준비 실패: 트레이드 안 됨');
  ok(G.pr.fan<f0-2,'프랜차이즈 스타를 보냈는데 팬 여론 '+f0+' → '+G.pr.fan); });

/* ===== 패턴 감사(반복 처리·끝난 뒤 적용) ===== */
T('[감사] 방출한 구단은 1년 안에 같은 선수와 다시 계약할 수 없다(연봉 깎기 반복 방지)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign&&!q.faC&&q.sal>=300); ok(p,'준비 실패'); const s0=p.sal; releasePlayer(p.id); const e=signFree(p.id,G.user);
  ok(p.team!==G.user,'방출 직후 같은 구단이 다시 계약함: 연봉 '+s0+' → '+p.sal); });

T('[감사] 육성선수로 돌렸다 되돌리면 원래 연봉으로 돌아온다',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign&&!q.faC&&q.sal>MIN_SAL&&q.sal<=100); ok(p,'준비 실패'); const s0=p.sal; ok(!toYS(p.id),'준비 실패: 육성 전환');
  G.day=Math.max(G.day,KD(5,2)); const r=fromYS(p.id); ok(!r,'준비 실패: '+r); ok(p.sal===s0,'정식 복귀 뒤 연봉 '+s0+' → '+p.sal); });

T('[감사] 트레이드 요청 답변(설득·명단 올리기)은 한 번만 효과가 있다',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign); initPers(p); p.pers.loy=18; p.mor=15; p.treq={day:G.day}; keepPlayer(p.id); const m1=p.mor; keepPlayer(p.id); keepPlayer(p.id);
  ok(p.mor===m1,'설득을 누를 때마다 기분이 오름: '+m1+' → '+p.mor); const q=playersOf(G.user).find(x=>!x.foreign&&x!==p); q.mor=20; for(let i=0;i<4;i++){ listPlayer(q.id); blockRemove(q.id); } ok(q.mor<=26,'명단 올리기·내리기 반복으로 기분이 계속 오름: 20 → '+q.mor); });

T('[감사] 이직하면 옛 구단의 FA 특별 자금·지원금·감독 요청은 새 구단에 넘어오지 않는다',()=>{ fresh(); const old=G.user; G.faFund={amt:6000,due:G.day+30,done:false,used:false}; grants().length=0; grantAdd({y:G.year,mk:0,d:G.day,amt:500,pur:{k:'fa',pid:-1},ok:true,by:'gm',st:'open',until:G.day+1});
  mreqAdd('fa',{pid:-1},G.day+1).st='open'; const nt=G.teams.find(t=>t.id!==old).id; G.gmSince=G.year; switchTeam(nt); const t=team(G.user); const c0=t.cash, tr0=t.trust; const m=G.mgr[G.user]; const r0=m?m.rel:0;
  G.day+=31; try{ champDaily(); }catch(e){} try{ grantCheck(); }catch(e){} try{ mreqCheck(); }catch(e){}
  ok(t.cash===c0&&t.trust===tr0,'옛 구단 자금 문제로 새 구단 현금 '+c0+'→'+t.cash+' · 신뢰 '+tr0+'→'+t.trust); ok(!m||m.rel===r0,'옛 감독 요청으로 새 감독 관계 '+r0+'→'+m.rel); });

T('[감사] 감독이 바뀌면 전임 감독의 요청 성패는 새 감독 관계에 반영되지 않는다',()=>{ fresh(); const r=mreqAdd('fa',{pid:-1},G.day+1); r.st='open'; const nx=G.mmarket.find(x=>x.id!==G.mgr[G.user].id); hireMgr(nx.id,2); const m=G.mgr[G.user]; const r0=m.rel; G.day+=2; G.fa=G.fa||{closed:true}; mreqCheck();
  ok(m.rel===r0,'새 감독 관계가 전임 감독 요청 때문에 '+r0+' → '+m.rel); });

T('[감사] 트레이드 제안: 그 구단 선수만 받을 수 있고 우리 선수만 보낼 수 있다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+5); let bad=null;
  for(const t of G.teams){ if(bad||t.id===G.user)continue; for(const z of G.teams){ if(bad||z.id===G.user||z.id===t.id)continue; const q=domestic(z.id).filter(x=>!x.ys&&!x.foreign).sort((a,b)=>a.sal-b.sal)[3];
    const gv=domestic(G.user).filter(x=>!x.ys&&!x.foreign).sort((a,b)=>ovr(b)-ovr(a)).slice(2,3).map(x=>x.id); const r=proposeTrade(t.id,gv,[q.id],0); if(r.ok||q.team!==z.id)bad=tshort(t.id)+'에게 '+tshort(z.id)+' 선수를 받는 트레이드가 성사됨'; } }
  ok(!bad,bad); });

T('[감사] 야인 기간 하루 처리는 한 번만(월초 명성이 두 번 오르지 않음)',()=>{ fresh(); simTo(()=>period()==='season'&&dobj(G.day).d>=5); firedFlow(G.year,'테스트 해임'); G.rep=30; G.jobs=[]; let n=0;
  while(n++<60){ const r0=G.rep; advance('day'); for(const j of (G.jobs||[]))j.done=true; if(dobj(G.day).d===2)break; } const rep1=G.rep; ok(rep1<=31,'한 달에 명성이 '+(rep1-30)+' 오름(기대 1)'); });

T('[감사] 유망주 기회 합의는 바로 다시 제안해 감독 판단을 다시 굴릴 수 없다',()=>{ fresh(); const m=G.mgr[G.user]; const p=playersOf(G.user).find(q=>!q.isP&&q.age<=24)||playersOf(G.user).find(q=>!q.isP); pactPropose([p.id]); const t1=JSON.stringify(G.pact.t); const r=pactPropose([p.id]);
  ok(JSON.stringify(G.pact.t)===t1&&/얼마 전|다시/.test(r||''),'곧바로 다시 제안해 합의를 새로 굴림: '+(r||'').slice(0,60)); });

T('[감사] 영구결번 메일 버튼은 목록 위치가 아니라 선수로 찾는다',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign); p.aw=[]; G.legends=[]; for(let i=0;i<299;i++)G.legends.push({name:'옛선수'+i,war:9,aw:[],y:G.year-5,no:i%99+1}); const n0=G.mail.length;
  const war0=retWarT(); p.hist=p.hist||[]; const rec={name:'레전드A',canRetNo:true,no:7,mine:{ys:12,war:war0+5},pid:99901,tid:G.user}; G.legends.push(rec); const mv=G.legends.length-1;
  G.legends.push({name:'레전드B',canRetNo:true,no:33,mine:{ys:11,war:war0+5},pid:99902,tid:G.user}); G.legends.splice(0,1); const r=retireNumber('p99901'); ok(rec.retNo&&!G.legends.find(x=>x.name==='레전드B').retNo,'다른 선수가 결번 처리됨: '+r);
  /* 메일이 실제로 선수 id로 버튼을 만드는지 */ const src=retireRecord.toString(); ok(!src.includes("String(G.legends.length-1)"),'영구결번 메일 버튼이 아직 목록 위치를 씀'); });

T('[감사] 이미 다른 구단과 계약한 FA의 역제안은 수락할 수 없다',()=>{ fresh(); simTo(()=>G.fa&&!G.fa.closed&&(G.fa.pool||[]).length>0); const id=G.fa.pool.find(x=>G.players[x]&&G.players[x].team==null); const p=G.players[id]; const n=negOf(id); n.counter={annual:p.ask.annual,years:p.ask.years};
  const other=G.teams.find(t=>t.id!==G.user).id; p.team=other; faAcceptCounter(id); ok(p.team===other,'이미 계약한 선수가 우리 팀으로 다시 사인됨'); });

T('[감사] 기한이 지난 다년계약 역제안으로는 합의할 수 없다',()=>{ fresh(); const p=playersOf(G.user).find(q=>canExtend(q)&&hasAgent(q)&&q.age<=29&&ovr(q)>=50); if(!p)return; const y=4; const d=round5(extDemand(p,y)*agExtMul(p));
  p.extCounter={annual:round5(d*.5),years:y,until:G.day-30,y:G.year}; const r=offerExtension(p.id,p.extCounter.annual,y,true,null); ok(!r.ok,'만료된 역제안(요구의 절반)으로 합의됨: '+r.msg.slice(0,60)); });

/* ===== 패턴 감사(상태 전환 정리) ===== */
T('[감사] 이직 전 구단 이름으로 낸 FA 제안은 새 구단 계약이 되지 않는다',()=>{ fresh(); simTo(()=>G.fa&&G.fa.open&&!G.fa.closed&&G.day>G.fa.openDay); const F=G.fa; const old=G.user;
  const p=F.pool.map(id=>G.players[id]).filter(q=>q&&q.team==null&&q.faFrom!==old).sort((a,b)=>ovr(b)-ovr(a))[0]; faNegotiate(p.id,{annual:round5(p.ask.annual*1.4),years:p.ask.years});
  const nt=G.teams.find(t=>t.id!==old&&t.id!==p.faFrom).id; G.gmSince=G.year; switchTeam(nt); let g=0; while(p.team==null&&g++<60){ faDay(G.day); G.day++; } ok(p.team!==nt,'이직 전에 낸 제안으로 새 구단과 계약됨'); });

T('[감사] 연봉 협상 중 트레이드한 선수도 새 연봉이 적용된다',()=>{ fresh(); simTo(()=>G.contract&&!G.contract.done&&G.day>=KD(12,2)); const C=G.contract; salTalkInit();
  const id=C.ended.find(i=>{ const q=G.players[i]; const n=C.neg&&C.neg[i]; return q&&n&&(n.cur??n.off)>q.sal&&!q.foreign; }); ok(id!=null,'준비 실패'); const p=G.players[id]; const want=C.neg[id].cur??C.neg[id].off;
  const other=G.teams.find(t=>t.id!==G.user).id; const q1=domestic(other).find(x=>!x.ys&&!x.foreign); G.offers=[{id:'t1',from:other,give:[q1.id],get:[p.id],exp:G.day+7,day:G.day}]; answerOffer('t1',true); ok(p.team===other,'준비 실패: 트레이드 안 됨');
  simTo(()=>G.contract.done); ok(p.sal===Math.max(MIN_SAL,want)&&p.newSal==null,'트레이드한 선수 연봉 '+p.sal+'(기대 '+want+') · 남은 newSal '+p.newSal); });

T('[감사] 이직하면 옛 구단이 걸린 FA 보상 절차는 그 구단(AI)이 마무리한다',()=>{ fresh(); const old=G.user; const from=G.teams.find(t=>t.id!==old).id; const nt=G.teams.find(t=>t.id!==old&&t.id!==from).id;
  const p=domestic(from).find(q=>!q.foreign); p.faGrade='A'; p.faPrevSal=500; compStart(p,from,old,{id:p.id}); const c=G.comp[0]; ok(c.stage==='protect'&&c.to===old,'준비 실패');
  G.gmSince=G.year; switchTeam(nt); for(let i=0;i<5;i++){ G.day++; compDaily(); } ok(c.stage==='done','이직 뒤 보상 절차가 멈춤: '+c.stage); });

T('[감사] AI 베테랑 정리로 은퇴하는 선수도 통산 기록·명예의 전당 심사를 거친다',()=>{ fresh(); const t=G.teams.find(x=>x.id!==G.user).id; simTo(()=>G.fa&&G.fa.open); const p=domestic(t).filter(q=>!q.ys&&!q.foreign).sort((a,b)=>ovr(a)-ovr(b))[0]; p.age=34; p.sal=1200; for(const k in p.r)p.r[k]=Math.min(p.r[k],28); p.aw=[(G.year-5)+' MVP',(G.year-4)+' MVP']; const nm=p.name;
  contractStart(); ok(!G.players[p.id]||G.players[p.id].team!==t,'준비 실패: 정리되지 않음'); ok((G.hof||[]).some(r=>r.name===nm),'정리돼 은퇴한 MVP 2회 선수가 명예의 전당에 없음'); });

T('[감사] 시즌 중 이직하면 옛 구단의 캠프 효과·지원 계획이 새 구단에 남지 않는다',()=>{ fresh(); G.campInj=.78; G.supPlan={y:G.year,gf:.63}; G.form={until:G.day+30,b:2}; const nt=G.teams.find(t=>t.id!==G.user).id; G.gmSince=G.year; switchTeam(nt);
  ok(G.campInj===1&&!G.supPlan&&!G.form,'옛 구단 효과가 남음: 캠프 '+G.campInj+' · 지원 계획 '+JSON.stringify(G.supPlan)+' · 컨디션 '+JSON.stringify(G.form)); });

T('[감사] 트레이드로 보낸 선수의 매물 표시·출전 약속·전환 훈련·미리 맺은 계약 조건은 끝난다',()=>{ fresh(); const other=G.teams.find(t=>t.id!==G.user).id; const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP);
  p.listed=true; p.promise={until:G.day+30}; p.pconv={pos:'1B',d:G.day}; p.extNext={annual:p.sal,years:3,terms:{years:3,ntc:true,opt:100,role:0,bonus:0,annual:p.sal}};
  const q1=domestic(other).find(x=>!x.ys&&!x.foreign); G.offers=[{id:'t3',from:other,give:[q1.id],get:[p.id],exp:G.day+7,day:G.day}]; answerOffer('t3',true); ok(p.team===other,'준비 실패');
  ok(!p.listed&&!p.promise&&!p.pconv&&!(p.extNext&&p.extNext.terms),'트레이드 뒤에도 남음: '+JSON.stringify({listed:p.listed,promise:!!p.promise,pconv:!!p.pconv,terms:!!(p.extNext&&p.extNext.terms)})); });

T('[감사] 감독을 경질해 대행 체제가 되면 전임 감독의 육성 우대(×1.3)는 끝난다',()=>{ fresh(); const m=G.mgr[G.user]; const p=playersOf(G.user).find(q=>q.age<=25)||playersOf(G.user)[0]; G.mpick={y:G.year,mid:m.id,ids:[p.id],back:true,day:G.day};
  ok(mpickMult(p)===1.3,'준비 실패'); fireMgr(); ok(mpickMult(p)===1,'경질 뒤에도 전임 감독 우대 '+mpickMult(p)); });

T('[감사] 해외에서 돌아온 선수의 진출 전 계약 조건은 되살아나지 않는다',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP); p.faC=true; p.yrs=3; termsApply(p,{years:3,bonus:900,annual:p.sal,opt:200,role:0,ntc:true},'fa',G.year,true); p.age=33;
  ovsLeave(p,'NPB','테스트',1,100,'해외 FA'); const a=G.abroad.find(x=>x.id===p.id); a.y=G.year-1; abroadYear(); const q=G.players[p.id]; ok(q&&q.team===a.from,'준비 실패: 복귀 안 함'); ok(!hasNtc(q)&&capBOf(q)===0,'해외 복귀 뒤 옛 계약 조건이 되살아남'); });

/* ===== 패턴 감사(같은 값 두 곳 계산·기간 경계) ===== */
T('[감사] 돔구장 대관 수입은 예산 전망과 결산이 같다',()=>{ fresh(); stadOf(G.user).dome=true; const proj=stadProj(G.user).ad; simTo(()=>G.last&&G.last.y===G.year); const f=G.last.fins&&(G.last.fins[G.user]||G.last.fins.find?.(x=>x.tid===G.user));
  const inc=JSON.stringify(f||G.last.fins); const m=(f&&f.inc||[]).find(x=>x[0]==='구장 부대 수입'); ok(m,'준비 실패: 결산에 구장 부대 수입 줄 없음 '+inc.slice(0,120)); ok(m[1]>=2500,'돔 대관 수입이 결산에 없음: 전망 '+proj+' · 결산 '+m[1]); });

T('[감사] 결산 뒤 겨울의 상한·지원 한도 축소는 다음 시즌 기준',()=>{ fresh(); simTo(()=>G.last&&G.last.y===G.year&&dobj(G.day).m===12&&dobj(G.day).d>=2); const t=team(G.user);
  ok(capInfo(G.user).cap===capOf(G.year+1),'12월 상한 검사가 끝난 시즌 상한 '+capInfo(G.user).cap+'(다음 시즌 '+capOf(G.year+1)+')');
  t.indie=false; t.trust=70; delete t.supCut; const c0=supportCap(t); ok(c0>1000,'준비 실패: 지원 한도 '+c0); t.supCut={y:G.year+1,amt:1000}; ok(supportCap(t)===c0-1000,'다음 시즌 지원 한도 축소가 겨울 전망에 반영 안 됨'); });

T('[감사] 예산 전망도 결산처럼 보유 현금 30억 초과분으로 적자를 먼저 메운다',()=>{ fresh(); const t=team(G.user); t.cash=15000; const b=budget(); ok(b.gap>0,'준비 실패: 적자 아님');
  const selfC=Math.min(b.gap,(t.cash-3000)*.5); ok(Math.abs(b.support-Math.min(b.cap,Math.max(0,b.gap-selfC)))<=1,'전망 지원 '+b.support+'(결산식 '+Math.min(b.cap,Math.max(0,b.gap-selfC))+')'); });

T('[감사] 계약이 끝난 외국인을 겨울에 방출하면 다음 시즌 지출이 생기지 않는다',()=>{ fresh(); simTo(()=>G.last&&G.last.y===G.year&&dobj(G.day).m===11&&dobj(G.day).d>=10); const p=foreignOf(G.user).find(q=>q.foreign==='용병'&&q.fy!==G.year+1); ok(p,'준비 실패');
  const d0=fDeadOf(G.user,G.year+1); releaseForeign(p.id); ok(fDeadOf(G.user,G.year+1)===d0,'재계약하지 않은 선수인데 다음 시즌 보장 연봉 '+(fDeadOf(G.user,G.year+1)-d0)+'이 잡힘'); });

T('[감사] 외국인 재계약 기간의 신규 영입은 재계약 조건까지 합쳐 한도를 본다',()=>{ fresh(); simTo(()=>G.contract&&!G.contract.done&&G.contract.foreignEnd&&G.contract.foreignEnd.length>=2&&G.day>=KD(12,2)); const C=G.contract; const f=fReCapInfo();
  let ks=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'); if(ks.length>=3){ const x=ks.pop(); C.foreignDrop.push(x.id); x.team=null; } ok(ks.length===2,'준비 실패: 재계약 대상 '+ks.length);
  for(const p of ks){ p.sal=Math.round(f.cap*.25); p.newSal=Math.round(f.cap*.45); } const g=fReCapInfo(); const cand=newForeign('용병',{}); cand.isP=!ks[0].isP||!ks[1].isP; cand.ask=Math.min(F_NEW_CAP,Math.max(100,g.cap-g.tot+50)); ok(foreignCheck(G.user,cand),'재계약 조건까지 합치면 초과인데 신규 영입 검사가 통과'); });

T('[감사] 와일드카드: 무승부가 나오면 1승을 안고 시작한 4위가 올라간다',()=>{ for(const seq of [['T','A'],['A','T']]){ fresh(); const [H,L]=G.teams.filter(t=>t.id!==G.user).map(t=>t.id); const sv=mkSeries('wc',H,L,G.day); G.ps={cur:sv,res:{},seeds:[0,0,0,H,L],round:'wc',done:false};
    const sg=simGame, ag=applyGame; let k=0; simGame=()=>{ const r=seq[k++]; return {score:r==='T'?{h:2,a:2}:(sv.homes[sv.gi]===L?{h:5,a:1}:{h:1,a:5})}; }; applyGame=()=>{};
    try{ for(let i=0;i<2&&G.ps.round==='wc';i++)psDay(sv.days[sv.gi]); } finally { simGame=sg; applyGame=ag; } ok(G.ps.res.wc&&G.ps.res.wc[0]===H,'무승부·5위 승('+seq.join(',')+')인데 5위가 진출'); } });

T('[감사] 한국시리즈 뒤 결산 전에는 트레이드·무적 영입이 닫힌다',()=>{ fresh(); G.ps={done:true,finDay:G.day+2,res:{},seeds:[]}; G.last={y:G.year-1}; const sv=G.cal.end; ok(!tradeOpen(),'결산 전인데 트레이드가 열림'); ok(!freeOpen(),'결산 전인데 무적 영입이 열림'); });

T('[감사] 홈런이 아닌 끝내기는 결승점까지만 인정한다',()=>{ fresh(); const T2=G.teams.map(t=>t.id); let bad=0, wo=0;
  for(let i=0;i<400;i++){ const g=simGame(G.day,T2[i%10],T2[(i+4)%10],false); const L=g.line.h; const last=L[L.length-1]; if(L.length>=9&&typeof last==='number'&&g.score.h>g.score.a&&last>0){ const r=g.pbp[g.pbp.length-1]; if(!r||typeof r[1]!=='number')continue; wo++; if(r[3]!=='HR'&&g.score.h-g.score.a>1)bad++; } }
  ok(wo>0,'준비 실패: 끝내기 없음'); ok(!bad,'홈런이 아닌 끝내기로 2점 이상 이긴 경기 '+bad+'개'); });

T('[감사] 8월 15일 뒤에는 육성선수를 정식으로 올릴 수 없다',()=>{ fresh(); simTo(()=>period()==='season'); const p=playersOf(G.user).find(q=>!q.foreign&&!q.faC&&q.sal<=100); toYS(p.id); G.day=KD(8,20); ok(period()==='season','준비 실패'); const r=fromYS(p.id); ok(p.ys,'마감 뒤 정식 등록이 됨: '+r); });

T('[감사] 희생플라이는 타수가 아니고 출루율 분모에 들어간다. 희생번트는 출루율 분모에 넣지 않는다',()=>{ fresh(); const T2=G.teams.map(t=>t.id); let sf=0, bad=0, txt=0;
  for(let i=0;i<300;i++){ const g=simGame(G.day,T2[i%10],T2[(i+3)%10],false); for(const k of ['h','a'])for(const [id,x] of g.S[k].box){ if(x.pa==null)continue; sf+=x.sf||0; if(x.ab+x.bb+(x.sf||0)>x.pa)bad++; } if(g.ev.some(e=>(e.t||'').includes('희생플라이')))txt++; }
  ok(sf>0,'300경기에 희생플라이 기록이 없음(득점한 범타가 타수로 잡힘)'); ok(!bad,'타수+볼넷+희생플라이가 타석보다 많은 줄 '+bad); ok(txt>0,'경기 기록에 희생플라이 문구가 없음');
  const r=bRate({pa:7,ab:4,h:1,bb:1,sf:1,d:0,tr:0,hr:0}); ok(Math.abs(r.obp-2/6)<1e-9,'출루율이 (안타+볼넷)/(타수+볼넷+희생플라이)가 아님: '+r.obp); });

T('[감사] 세이브는 1이닝 이상(동점 주자 상황이면 아웃 1개 이상), 홀드는 아웃 1개 이상이 있어야 한다',()=>{ fresh(); const T2=G.teams.map(t=>t.id); let sv=0, badS=0, badH=0, miss=0;
  for(let i=0;i<600;i++){ const g=simGame(G.day,T2[i%10],T2[(i+2)%10],false); const d=g.dec; if(!d.w)continue; const wk=g.score.h>g.score.a?'h':'a'; const ws=g.S[wk];
    if(d.sv){ sv++; const el=ws.entry[d.sv], o=ws.box.get(d.sv).outs, nr=(ws.entryR||{})[d.sv]||0; const okS=(el>=1&&el<=3&&o>=3)||(el>=1&&el<=nr+2&&o>=1)||(el>=1&&o>=9); if(!okS)badS++; }
    else { const fin=ws.pitchers[ws.pitchers.length-1]; if(fin!==d.w&&fin!==ws.pitchers[0]){ const el=ws.entry[fin], o=ws.box.get(fin).outs, nr=(ws.entryR||{})[fin]||0; if((el>=1&&el<=3&&o>=3)||(el>=1&&el<=nr+2&&o>=1)||(el>=1&&o>=9))miss++; } }
    for(const id of d.hld||[]){ const s=g.S[g.S.h.pitchers.includes(id)?'h':'a']; if(!(s.box.get(id).outs>=1))badH++; } }
  ok(sv>20,'준비 실패: 세이브 '+sv); ok(!badS,'조건에 맞지 않는 세이브 '+badS+'건(아웃 수 부족)'); ok(!badH,'아웃 없이 받은 홀드 '+badH+'건'); ok(!miss,'세이브 조건을 채운 마무리에게 세이브가 없음 '+miss+'건(리드 1~2점 등판은 동점 주자가 타석·대기 타석에 있음)'); });

T('[감사] 겨울 연봉 상한 경고는 재계약 연봉(newSal)과 다음 시즌 상한으로 본다',()=>{ fresh(); G.last=Object.assign({},G.last||{},{y:G.year}); const L=domestic(G.user).filter(p=>!isRookie(p)).sort((a,b)=>b.sal-a.sal);
  const cap=capOf(sponSeason()); const pay0=capPay(G.user); ok(pay0<cap,'준비 실패: 이미 상한 초과'); const need=cap-pay0+500; L.slice(0,5).forEach(p=>{ p.newSal=p.sal+Math.ceil(need/5); });
  const n0=G.mail.length; capWarnUser(); ok(G.mail.length>n0&&G.mail.slice(0,G.mail.length-n0).some(m=>(m.body||'').includes('상한')),'재계약 연봉으로 상한을 넘는데 경고가 없음'); });

T('[감사] 구장 공사는 3월(개막 준비)에는 시작할 수 없다',()=>{ fresh(); G.day=KD(3,10); ok(period()==='pre','준비 실패: 3월이 시즌 준비 기간이 아님'); team(G.user).cash=999999; const S=stadOf(G.user); const k=STAD_ITEMS.find(x=>S.lv[x.k]<5).k;
  const r=stadStart(k); ok(typeof r==='string'&&r.includes('10월~2월'),'3월에 공사가 시작됨: '+r); ok(!(S.build||[]).some(b=>b.k===k),'공사 목록에 들어감'); });

T('[감사] 야인 기간에는 AI가 맡은 전 소속 구단도 베테랑 정리를 한다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP&&!q.ys); p.age=34; for(const k in p.r)if(k!=='spd')p.r[k]=Math.min(p.r[k],30); p.sal=900; ok(ovr(p)<44,'준비 실패: 능력 '+ovr(p));
  G.unemp={y:G.year,msg:'점검',since:G.day,from:G.user}; contractStart(); ok(p.team!==G.user||!G.players[p.id],'야인 기간 전 소속 구단의 베테랑이 정리되지 않음'); });

T('[감사] 단장이 떠나면 그 구단에서 쓴 계약금·보상금은 그 구단 현금에서 정산된다',()=>{ fresh(); const old=G.user, t=team(old); G.spend.faB=3000; G.spend.compIn=500; const c0=t.cash;
  firedFlow(G.year,'점검','resign'); ok(Math.round(t.cash-c0)===-2500,'떠난 구단 현금 변화 '+Math.round(t.cash-c0)+'(계약금 30억 지출·보상금 5억 수령이면 -2500)'); ok(!G.spend.faB,'지출 장부가 남음'); });

T('[감사] 부상 방지·병원 제휴·스카우트망·영구결번은 구단에 남고 새 구단 것을 이어받는다',()=>{ fresh(); const old=G.user; G.med.hosp='a'; G.med.prev=3; G.intl.la=2; G.retNos=[{name:'점검',no:7,y:G.year}];
  const nt=G.teams.find(t=>t.id!==old).id; switchTeam(nt); ok(G.med.hosp==='none'&&G.med.prev===1,'병원 제휴·부상 방지가 단장을 따라옴: '+G.med.hosp+'/'+G.med.prev); ok(!G.intl.la,'해외 스카우트망이 따라옴'); ok(!(G.retNos||[]).length,'영구결번이 따라옴');
  switchTeam(old); ok(G.med.hosp==='a'&&G.med.prev===3&&G.intl.la===2&&G.retNos.length===1,'옛 구단으로 돌아가도 그 구단 조직이 복원되지 않음'); });

T('[감사] 평가 오차는 화면 점수 척도로 보여 준다',()=>{ fresh(); const p=Object.values(G.players).find(q=>q.team!=null&&q.team!==G.user&&!q.isP); const rp=Object.assign({},scoutReport(p),{cur:65,sd:4,exact:false});
  const L=curExplain(p,rp)||[]; const line=L.find(l=>(l||'').startsWith('평가 오차'))||''; ok(line.includes('±'+dvSd(65,4)+'(')&&dvSd(65,4)!==4,'오차가 내부 척도로 나옴: '+line); });

T('[감사] 패전 투수는 결승 주자를 내보낸 투수다',()=>{ fresh(); const T2=G.teams.map(t=>t.id); let n=0, bad=0;
  for(let i=0;i<500;i++){ const g=simGame(G.day,T2[i%10],T2[(i+1)%10],false); if(!g.dec.w||g.pbp.length>=260)continue; const wk=g.score.h>g.score.a?'h':'a'; let last=null;
    for(const x of g.pbp){ if(typeof x[1]!=='number'||!Array.isArray(x[10]))continue; const hb=x[0]%2===1; if((hb?'h':'a')!==wk)continue; const after=wk==='h'?x[8]-x[7]:x[7]-x[8], before=after-x[6]; if(before<=0&&after>0)last={chg:x[10],i:-before}; }
    if(!last)continue; const lp=last.chg[last.i]; const ls=g.S[wk==='h'?'a':'h']; if(!ls.pitchers.includes(lp))continue; n++; if(g.dec.l!==lp)bad++; }
  ok(n>50,'준비 실패: 확인한 경기 '+n); ok(!bad,'결승 주자를 내보내지 않은 투수가 패전 '+bad+'경기/'+n); });

T('[감사] 골든글러브 후보 포지션은 가장 많이 선 자리, 신인왕은 이전 시즌 누적으로 본다',()=>{ fresh(); const y=G.year; const ps=playersOf(G.user).filter(q=>!q.isP&&!q.foreign); const p=ps[0], q=ps[1];
  for(const x of [p,q])x.hist=x.hist.filter(h=>h.lvl!=='1군'); const big=pos=>Object.assign({},ZB,{y,t:G.user,lvl:'1군',g:135,pa:600,ab:530,h:200,hr:45,rbi:130,bb:60,d:35,tr:3,r:110,sb:15,so:80,pos});
  p.hist.push(big('CF')); p.use={y,g:135,pos:{C:125,CF:10},slot:{}};
  q.age=24; const mk=yy=>Object.assign({},ZB,{y:yy,t:G.user,lvl:'1군',g:30,pa:55,ab:50,h:12,bb:5}); q.hist.push(mk(y-3),mk(y-2),mk(y-1),big('1B'));
  const A=seasonAwards(y); ok((A.cand.gg.C||[]).some(c=>c.id===p.id),'포수로 125경기 선 선수가 포수 후보에 없음'); ok(!((A.cand.gg.OF||[]).some(c=>c.id===p.id)),'마지막 경기 자리(중견수)로 분류됨');
  ok(!(A.cand.roy||[]).some(c=>c.id===q.id),'이전 시즌 누적 165타석 선수가 신인왕 후보'); });

T('[감사] 포스트시즌 경기는 정규시즌 연승에 잇지 않는다',()=>{ fresh(); G.day=G.cal.end+1; G.ps={done:false,round:'semi',res:{}}; ok(period()==='post','준비 실패'); prInit(); G.sea.streak=4; const n0=(G.news||[]).length;
  const op=G.teams.find(t=>t.id!==G.user).id; prAfterGame({day:G.day,kind:'준플레이오프 1차전',home:G.user,away:op,hs:5,as:2,res:'승',hits:{h:[],a:[]},box:{h:{bat:[],pit:[]},a:{bat:[],pit:[]}}});
  ok(G.sea.streak===4,'포스트시즌 승리가 정규시즌 연승에 붙음: '+G.sea.streak); ok(!(G.news||[]).slice(0,(G.news||[]).length-n0+1).some(x=>(x.t||'').includes('5연승')),'5연승 기사가 나옴'); });

T('[감사] 육성 목표는 이적 전 다른 구단 기록을 세지 않고, 시즌 뒤 순위 목표는 최종 순위로 본다',()=>{ fresh(); G.goals={y:G.year,rank:5,sup:99999,fan:0,youth:1}; const y=G.year; const p=domestic(G.user).find(q=>!q.isP); p.age=23; p.hist=p.hist.filter(h=>!(h.y===y&&h.lvl==='1군'));
  const c0=goalStatus().youth.cur; const op=G.teams.find(t=>t.id!==G.user).id; p.hist.push(Object.assign({},ZB,{y,t:op,lvl:'1군',g:100,pa:400,ab:360,h:100,bb:40}));
  ok(goalStatus().youth.cur===c0,'다른 구단에서 뛴 기록으로 육성 목표가 채워짐');
  G.day=G.cal.end+5; G.ps={done:true,res:{},finDay:G.day-1}; const order=standingsNow(); G.last=Object.assign({},G.last||{},{y,order}); ok(period()==='off','준비 실패'); const gs=goalStatus(); ok(gs.rank.cur===order.findIndex(o=>o.tid===G.user)+1,'시즌 뒤 순위 목표 현재값 '+gs.rank.cur); });

T('[감사] 결산을 사이에 둔 월간 재정 보고는 두 시즌 예산을 비교하지 않는다',()=>{ fresh(); G.finSnap=finSnapNow(); const n0=(G.finLog||[]).length; G.last=Object.assign({},G.last||{},{y:G.year}); finMonth(10);
  ok((G.finLog||[]).length===n0,'결산 전 예산과 결산 뒤(다음 시즌) 예산을 한 달 변화로 비교함'); });

T('[감사] 결산이 11월 2일보다 늦어도 FA 공시가 열린다',()=>{ fresh(); simTo(()=>G.rolled===G.year); ok(G.day<KD(11,2),'준비 실패: 결산이 이미 11월 2일 뒤 '+dmd(G.day)); ok(G.fa&&!G.fa.open,'준비 실패: 이미 공시됨');
  G.day=KD(11,3); simTo(()=>G.day>=KD(11,6)); ok(G.fa.open||G.fa.closed||G.faAnnY===G.year,'11월 2일을 넘긴 뒤 FA 공시가 열리지 않음'); });

T('[감사] 희생플라이는 팀 기록 합계에 들어가고, 안타 없이 희생플라이만 친 경기는 연속 경기 안타를 끊는다',()=>{ fresh(); const y=G.year; const p=domestic(G.user).find(q=>!q.isP); p.hist.push(Object.assign({},ZB,{y,t:G.user,lvl:'1군',g:1,pa:4,ab:3,h:1,sf:1}));
  tsArchive(y); const A=G.tsArch[y]; ok((A[G.user].b.sf||0)>=1,'팀 기록 보관에 희생플라이가 빠짐');
  p.hstk=12; featBat(p,{ab:0,bb:0,sf:1,h:0,d:0,tr:0,hr:0,rbi:1},0); ok(p.hstk===0,'희생플라이만 친 경기 뒤에도 연속 안타 '+p.hstk);
  p.hstk=12; featBat(p,{ab:0,bb:2,h:0,d:0,tr:0,hr:0,rbi:0},0); ok(p.hstk===12,'볼넷만 고른 경기에 연속 안타가 끊김'); });

T('외국인 후보 조사 단계: 추정 범위가 실제 능력을 대부분 담고, 관찰이 쌓이면 범위가 좁아진다(조사 표시 개선)',()=>{ fresh(); const L=Object.values(G.players).filter(p=>p.foreign&&p.team==null); ok(L.length>=20,'준비 실패: 후보 '+L.length);
  let n=0, hit=0, w0=0, w1=0; for(const p of L){ G.fwatch=[]; const a=fScout(p); n++; if(dvo(p)>=a.lo&&dvo(p)<=a.hi)hit++; w0+=a.hi-a.lo; G.fwatch=[{id:p.id,k:100}]; const b=fScout(p); w1+=b.hi-b.lo; ok(b.n>=a.n,'관찰했는데 조사 단계가 내려감'); }
  G.fwatch=[]; ok(hit/n>=.7,'추정 범위 안에 든 후보 '+Math.round(hit/n*100)+'%'); ok(w1<w0*.7,'관찰 파악도 100%인데 범위가 충분히 좁아지지 않음'); });

T('외국인 예상 능력순: 기록·MLB 경력·스카우트를 합친 예상이 스카우트 평가 하나보다 실제 실력을 잘 고르고, 트리플A·MLB 출신을 앞에 둔다',()=>{ fresh(); const L=[]; for(let i=0;i<300;i++){ const p=newForeign('용병',{market:true}); const rp=scoutReport(p); L.push({p,rp,f:fScout(p,rp)}); }
  const top=(a,k)=>[...a].sort(k).slice(0,20); const mean=a=>a.reduce((s,x)=>s+ovr(x.p),0)/a.length;
  const A=top(L,(a,b)=>b.f.score-a.f.score), B=top(L,(a,b)=>b.rp.cur-a.rp.cur); ok(mean(A)>mean(B),'추천 상위 20명 실제 평균 '+mean(A).toFixed(1)+' ≤ 스카우트 평가순 '+mean(B).toFixed(1));
  const sh=a=>a.filter(x=>['트리플A','MLB'].includes(x.p.prevLvl)).length/a.length; ok(sh(A)>=sh(L),'추천 상위의 트리플A·MLB 비중 '+Math.round(sh(A)*100)+'%가 후보 전체 '+Math.round(sh(L)*100)+'%보다 낮음');
  L.forEach(x=>delete G.players[x.p.id]); });

T('리그 수준: 트리플A는 우리 리그보다 살짝 높아 같은 타자도 성적이 조금 덜 나온다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP); const a=batProbs(p,LG_ADJ['트리플A'][0]), k=batProbs(p,0); ok(a.k>k.k&&a.babip<k.babip,'트리플A에서 삼진이 더 적거나 BABIP가 더 높음(우리 리그보다 쉬운 리그로 잡힘)'); const q=G.players[domestic(G.user).find(x=>x.isP).id]; ok(pitProbs(q,LG_ADJ['트리플A'][1]).k<pitProbs(q,0).k,'트리플A에서 투수 삼진율이 더 높음'); });

T('외국인 예상 능력순: 우리 발굴 후보라고 앞에 끼우지 않고 예상 능력으로만 줄 세운다(1위가 더 낮게 보이던 문제)',()=>{ fresh(); const a=newForeign('용병',{market:true}), b=newForeign('용병',{market:true}); a.fsrc='scout'; a.fknow=[G.user]; a.fpub=G.day+30; ok(fMineFind(a),'준비 실패: 발굴 후보가 아님');
  const L=[a,b].map(p=>{ const rp=scoutReport(p); return {p,rp,fs:fScout(p,rp)}; }); L[0].fs.score=40; L[1].fs.score=60; L.sort(fSortBy('rk')); ok(L[0].p===b,'점수가 낮은 우리 발굴 후보가 추천순 맨 앞'); delete G.players[a.id]; delete G.players[b.id]; });

T('외국인 타자 포지션: 1루·코너 외야가 대부분이고 2루·유격·포수는 드물며, 거포는 1루·코너 외야에 몰린다(실제 KBO 영입 비중)',()=>{ fresh(); const C={}, P={}; let n=0;
  for(let i=0;i<1500;i++){ const p=newForeign('용병',{isP:false,market:true}); n++; C[p.pos]=(C[p.pos]||0)+1; (P[p.pos]=P[p.pos]||[]).push(p.r.pow); delete G.players[p.id]; }
  const sh=k=>k.reduce((s,x)=>s+(C[x]||0),0)/n, mp=k=>{ const a=k.flatMap(x=>P[x]||[]); return a.reduce((s,v)=>s+v,0)/a.length; };
  ok(sh(['1B','LF','RF'])>=.6,'1루·코너 외야 비중 '+Math.round(sh(['1B','LF','RF'])*100)+'%'); ok(sh(['2B','SS','C'])<=.12,'2루·유격·포수 비중 '+Math.round(sh(['2B','SS','C'])*100)+'%');
  ok(mp(['1B','LF','RF'])-mp(['CF','2B','SS'])>=8,'1루·코너 외야와 중앙 수비 포지션의 장타력 차이 '+(mp(['1B','LF','RF'])-mp(['CF','2B','SS'])).toFixed(1)); });

T('포지션 가치: 같거나 조금 낮은 능력이라도 수비 좋은 유격·포수가 1루보다 귀하게 평가된다(구단 판단·연봉)',()=>{ fresh();
  const mk=(pos,disp,def)=>{ const p=newPlayer({age:28,isP:false,base:50,pos,team:null}); p.age=28; let raw=20; while(dv(raw)<disp)raw+=.1; setOvr(p,raw); p.r.def=def; setOvr(p,raw); return p; };
  const fb=mk('1B',70,48), ss=mk('SS',60,62), c=mk('C',60,57); const avg=q=>G.teams.reduce((s,t)=>s+aiVal(t,q),0)/G.teams.length;
  ok(dvo(fb)-dvo(ss)>=8,'준비 실패: 종합 차이 '+(dvo(fb)-dvo(ss)));
  ok(posBest(ss).v>posBest(fb).v,'유격(종합 '+dvo(ss)+')의 포지션 가치 '+dv(posBest(ss).v)+' ≤ 1루(종합 '+dvo(fb)+') '+dv(posBest(fb).v));
  ok(avg(ss)>avg(fb),'구단 평가 평균: 유격 '+avg(ss).toFixed(1)+' ≤ 1루 '+avg(fb).toFixed(1)); ok(posBest(c).v>posBest(fb).v,'포수 포지션 가치가 1루보다 낮음');
  ok(newSalary(ss)>=newSalary(fb)*.95,'연봉 기준이 1루 쪽으로 크게 기욺: 유격 '+newSalary(ss)+' / 1루 '+newSalary(fb)); [fb,ss,c].forEach(q=>delete G.players[q.id]); });

T('포지션 가치: 수비 1점의 무게는 유격이 1루의 2배 이상이고, 1루수를 유격수로 평가하지 않는다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP); const lg=lgOf(G.year); const h=Object.assign({},ZB,{y:G.year,t:G.user,lvl:'1군',g:140,pa:600,ab:530,h:150,bb:60,d:30,hr:15});
  const w=(pos,def)=>{ p.pos=pos; p.r.def=def; h.pos=pos; return warRaw(h,p); }; const ds=w('SS',70)-w('SS',50), d1=w('1B',70)-w('1B',50);
  ok(ds>=d1*2,'유격 수비 20점 차 WAR '+ds.toFixed(2)+' / 1루 '+d1.toFixed(2)); p.pos='1B'; p.r.def=60; ok(posBest(p).pos==='1B'||posBest(p).pos==='DH','1루수의 가치 자리가 '+posBest(p).pos); });

T('실책: 공이 간 자리 수비수 실력대로 난다(수비가 약한 유격수는 팀 실책을 크게 늘린다)',()=>{ fresh(); const d=depth(G.user); const ss=d.ln.SS; ok(ss,'준비 실패: 유격수 없음');
  const fs={order:Object.values(d.ln).filter(Boolean),posOf:{}}; for(const k in d.ln)if(d.ln[k])fs.posOf[d.ln[k].id]=k; const r0=JSON.stringify(ss.r);
  const team=def=>{ ss.r=JSON.parse(r0); ss.r.def=def; let t=0, w=0; for(const p of fs.order){ const k=fs.posOf[p.id]; if(!ERRW[k])continue; t+=ERRW[k]*errChance([p,k]); w+=ERRW[k]; } return t/w; };
  const lo=team(32), hi=team(80); ss.r=JSON.parse(r0); ok(lo>=hi*1.4,'유격 수비 32와 80일 때 타구당 팀 실책 확률 '+(lo*1000).toFixed(1)+'‰ / '+(hi*1000).toFixed(1)+'‰(1.4배 이상이어야)'); });

T('자리별 대형 선수의 드묾: 포수·유격 수는 줄이지 않되, 최상위 재능은 1루·코너보다 훨씬 드물고 포수는 같은 종합이라도 방망이가 약하다',()=>{ fresh(); const C={}, E={}, O={}; const inc=(o,k,v=1)=>o[k]=(o[k]||0)+v;
  for(let i=0;i<4000;i++){ const b=clamp(N(47,7),25,72); const p=newPlayer({age:27,isP:false,base:b,pot:b,team:null}); inc(C,p.pos); if(ovr(p)>=57)inc(E,p.pos); inc(O,p.pos,offV(p)-ovr(p)); delete G.players[p.id]; }
  const sh=k=>(E[k]||0)/C[k]; ok(C.C>=C['1B']*.8&&C.SS>=C['1B']*.8,'포수·유격 선수 수가 줄어듦: 포수 '+C.C+' · 유격 '+C.SS+' · 1루 '+C['1B']);
  ok(sh('C')<=sh('1B')*.5&&sh('SS')<=sh('1B')*.6,'최상위(종합 57 이상) 비율: 포수 '+(sh('C')*100).toFixed(1)+'% · 유격 '+(sh('SS')*100).toFixed(1)+'% · 1루 '+(sh('1B')*100).toFixed(1)+'%');
  ok(O.C/C.C<O['1B']/C['1B']-3,'같은 종합에서 포수 방망이가 1루와 비슷함'); });

T('스페이스바 자동 진행 설정 기본값은 "묻지 않음"',()=>{ fresh(); ok(!G.advAsk,'새 게임에서 진행 전에 묻기가 켜져 있음'); });
`);
try{ env(T); }catch(e){ console.error=oe; console.log('준비 실패: '+e.stack.slice(0,400)); process.exit(1); }
let fail=0; const ONLY=process.env.ONLY; if(ONLY){ const L=results.filter(t=>t.name.includes(ONLY)); results.length=0; results.push(...L); } /* ONLY=문구: 이름에 그 문구가 든 시나리오만 */ for(const t of results){ try{ t.fn(); console.log('통과  '+t.name); }catch(e){ fail++; console.log('실패  '+t.name+'\n      → '+String(e.message).slice(0,300)); } }
console.error=oe;
console.log(fail?`규칙 점검: ${results.length}개 중 ${fail}개 실패`:`규칙 점검: ${results.length}개 모두 통과`); process.exit(fail?1:0);
