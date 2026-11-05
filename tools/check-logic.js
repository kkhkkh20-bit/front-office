/* 규칙 점검: '오류는 안 나지만 결과가 틀린' 버그를 잡는다. 리뷰·플레이에서 나온 버그는 고치기 전에 여기에 먼저 시나리오로 넣는다.
 각 항목은 상황을 만들고 → 기능을 실제로 부르고 → 기대한 결과인지 확인한다.
 사용: node tools/check-logic.js   (dist/engine.js 필요: bash build.sh). 일부만: ONLY=감사 node tools/check-logic.js
 주의: 시나리오는 큰 백틱 문자열 안에 있다. 안쪽에서 백틱을 쓰지 말고, 정규식의 \[ 같은 역슬래시는 두 번 써야 한다(한 번이면 사라져 엉뚱한 정규식이 된다). 가능하면 includes·startsWith를 쓴다. */
const fs=require('fs'), path=require('path');
const ENGINE=path.join(__dirname,'..','dist','engine.js'); if(!fs.existsSync(ENGINE)){ console.error('dist/engine.js가 없습니다. bash build.sh를 먼저 실행하세요.'); process.exit(2); }
{ let a=11; globalThis.__seed=v=>{ a=v; }; globalThis.__rngState=()=>a; /* 통계 시나리오가 같은 난수로 비교할 수 있게 */ Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const results=[]; const T=(name,fn)=>results.push({name,fn});
const oe=console.error; console.error=()=>{};
const env=new Function('T',fs.readFileSync(ENGINE,'utf8')+`
const ok=(c,msg)=>{ if(!c)throw new Error(msg); };
const fresh=()=>{ DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); let g=0; while(G.fd&&!G.fd.done&&g++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true;
  for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; try{ if(p&&!foreignCheck(G.user,p))signForeign(G.user,id); }catch(e){} } };
const simTo=cond=>{ let n=0; while(n++<800&&!cond()){ G.live=null; G.res=null; G.stops=[]; for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; }
  if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); } if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,false); }catch(x){} if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(x){}
  (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(x){} }); try{ if(rosterN(G.user)>ROSTER_MAX)trimRoster(G.user,ROSTER_MAX); }catch(x){} const d0=G.day; try{ advance('day'); }catch(e){ throw new Error('simTo: '+dmd(G.day)+' 하루 진행 중 오류 — '+e.message); } if(G.day===d0&&!cond()&&n>=799)break; }
  if(!cond())throw new Error('simTo: 목표 조건에 도달하지 못함(멈춘 날 '+dmd(G.day)+(blocker&&blocker()?' · 진행 막힘: '+String(blocker()).slice(0,80):'')+')'); }; /* 예외를 날짜만 넘겨 숨기지 않고, 조건에 못 가면 실패(거짓 통과 방지) */

T('[사구] 출루율·타수·밀어내기·공별·시즌 기록이 볼넷과 구분된다',()=>{fresh();G.day=G.cal.open;for(const t of G.teams)setEntry(t.id);for(const p of Object.values(G.players))if(p.r)p.r.spd=0;const op=G.teams.find(t=>t.id!==G.user).id,original=outcome;let n=0,g;try{outcome=()=>++n<=4?'HBP':'K';g=simGame(G.day,G.user,op,false);}finally{outcome=original;}
 const first=g.pbp.find(x=>typeof x[1]==='number'),side=g.S.a,bat=side.box.get(first[1]);ok(first[3]==='HBP'&&bat.hbp===1&&bat.bb===0&&bat.h===0&&bat.ab===g.pbp.filter(x=>x[1]===first[1]&&x[3]==='K').length,'사구가 안타/볼넷/타수로 기록됨');ok(g.score.a===1,'만루 사구 밀어내기 득점 실패');ok(g.pbp.filter(x=>x[3]==='HBP').length===4,'사구 기록 누락');ok(storedPitchSequence(first).at(-1).res==='몸에 맞는 공','마지막 공이 타격임');ok(Math.abs(obpOf({ab:9,h:2,bb:0,hbp:1})-.3)<1e-9,'출루율 사구 누락');const rec=gameRecord(G.day,G.user,op,g,'');ok(rec.box.a.bat.find(x=>x.id===first[1]).hbp===1,'박스 저장 누락');applyGame(G.day,G.user,op,g,false);const h=seasonTotal(G.players[first[1]],G.year,'1군');ok(h.hbp>=1,'시즌 사구 누락');});
T('[중계 기록] 경기 전 문맥은 조회 난수·선수를 보존하고 다음 경기 기록에 오염되지 않는다',()=>{fresh();G.day=G.cal.open;for(const t of G.teams)setEntry(t.id);const op=G.teams.find(t=>t.id!==G.user).id,S={h:gameSide(G.user,G.day,false),a:gameSide(op,G.day,false)},p=G.players[S.h.order[0].id];p.castForm={y:G.year,known:true,hitless:4,streak:0};const before=JSON.stringify(G),rng=globalThis.__rngState(),ctx=gameBroadcastContext(G.day,S,true);ok(JSON.stringify(G)===before&&globalThis.__rngState()===rng,'중계 문맥 조회 부작용');ok(ctx.players[p.id].hitless===4,'부진 길이 누락');const text=JSON.stringify(ctx);broadcastFormUpdate(p,{pa:4,ab:4,h:2});ok(JSON.stringify(ctx)===text&&p.castForm.hitless===0,'과거 경기 문맥이 다음 기록에 바뀜');});

T('[대기록] 타석 기록으로 만루 홈런·연타석 홈런·끝내기를 남기고 몇 번째인지 센다(난수 소비 없음, 옛 저장 호환)',()=>{fresh();const b=playersOf(G.user).find(p=>!p.isP),op=G.teams.find(t=>t.id!==G.user).id,q=playersOf(op).find(p=>p.isP);G.feats=[];delete G.featN;delete b.feats;delete b.hrab;
  const mk=(rows,walk)=>({S:{h:{tid:G.user,pitchers:[],box:new Map([[b.id,{}]])},a:{tid:op,pitchers:[],box:new Map()}},score:{h:5,a:4},walk:!!walk,inn:9,pbp:rows.map(([o,n])=>[1,b.id,q.id,o,0,[0,0,0],n,0,0])});
  const r0=__rngState();featGame(G.day,mk([['HR',4],['HR',1]]));ok(__rngState()===r0,'기록 감지가 난수를 썼다');
  ok((b.feats||[]).some(x=>x.k==='gs'),'만루 홈런이 선수 기록에 없음');ok(!G.feats.some(x=>x.k==='gs'),'만루 홈런이 리그 연표를 채운다');ok(b.hrab===2&&!b.feats.some(x=>x.k==='hrc'),'2연타석은 기록이 아니다');
  featGame(G.day+1,mk([['HR',1],['K',0],['HR',2]],true));const h=b.feats.find(x=>x.k==='hrc');ok(h&&h.txt==='3연타석 홈런','경기를 넘어 3연타석 홈런이 기록되지 않음: '+JSON.stringify(b.feats));ok(G.feats.some(x=>x.k==='hrc'&&x.n===1),'리그 연표에 첫 번째 연타석 홈런이 없음');ok(b.hrab===1,'삼진 뒤 연타석이 끊기지 않음');
  ok(b.feats.some(x=>x.k==='wohr'&&x.txt.includes('9회말')),'끝내기 홈런이 없음');featGame(G.day+2,mk([['1B',1]],true));ok(b.feats.some(x=>x.k==='woh'),'끝내기 안타가 없음');featGame(G.day+3,mk([['BB',1]],true));ok(b.feats.filter(x=>x.k.startsWith('wo')).length===2,'밀어내기 볼넷을 끝내기 안타로 셈');
  featGame(G.day+4,mk([['HR',4]]));ok(b.feats.filter(x=>x.k==='gs').length===2&&b.feats.find(x=>x.k==='gs').n===2,'만루 홈런 두 번째 순번이 틀림');
  G.feats=[{id:900,y:G.year,d:1,k:'cyc',pid:b.id,name:b.name,tid:G.user,txt:'사이클링 히트',vs:''}];delete G.featN;delete b.feats;featAdd('cyc',b,'사이클링 히트');ok(G.feats[0].n===2&&b.feats.length===2,'옛 저장에서 누계·선수 기록을 이어받지 못함');});
T('[대기록] 비자책 실점도 노히트노런 연표에서 제외하고 사구 완봉은 무사사구가 아니다',()=>{fresh();const p=playersOf(G.user).find(p=>p.isP),op=G.teams.find(t=>t.id!==G.user).id;storyGame(p,{outs:27,h:0,bb:0,hbp:1,er:0,so:9},G.day,op,{},{runsAllowed:1,solo:true});ok(!(p.story||[]).some(x=>x.t.includes('노히트노런')),'비자책 실점인데 노히트노런');G.feats=[];const s={tid:G.user,pitchers:[p.id],box:new Map([[p.id,{outs:27,h:2,bb:0,hbp:1,bf:30}]])};featGame(G.day,{S:{h:s,a:{tid:op,pitchers:[],box:new Map()}},score:{h:1,a:0}});ok(!G.feats.some(f=>f.k==='cg0'),'사구가 있는데 무사사구 완봉');});

T('[실플레이 11-05] 올해 트레이드로 내준 선수를 그 구단 단장이 곧바로 다시 원한다고 나오지 않는다',()=>{fresh();const op=G.teams.find(t=>t.id!==G.user).id,p=playersOf(op).find(q=>!q.isP&&!q.foreign&&!q.prospect);ok(p,'준비 실패: 상대 야수 없음');p.team=G.user;p.age=27;for(const k in p.r)if(typeof p.r[k]==='number')p.r[k]=Math.max(p.r[k],78);G.trades=G.trades||[];G.trades.push({y:G.year,d:G.day,with:op,give:[],get:[p.name],gi:[p.id],go:[]});ok(!aiInterest(op).includes(p.id),'방금 받아 온 선수를 원래 구단이 관심 선수로 꼽음');});
T('[실플레이 11-05] 시즌 중 트레이드로 데려온 1군 선수는 10일 재등록 제한 없이 바로 1군에 올릴 수 있다(KBO: 말소 10일 규정은 같은 구단 재등록)',()=>{fresh();simTo(()=>period()==='season'&&G.day>=G.cal.open+7);const op=G.teams.find(t=>t.id!==G.user).id,p=playersOf(op).find(q=>q.e1&&!q.isP&&healthy(q)&&!q.foreign);ok(p,'준비 실패: 상대 1군 야수 없음');p.team=G.user;mvLog('트레이드',p,op,G.user);ok(!p.e1,'옛 구단 1군 등록이 남음');ok(canUp(p),'트레이드 직후 10일 재등록 제한에 걸려 2군에 묶임');});
T('[실플레이 11-05] 신인왕: 등록 연차 7년(입단 6년 이상) 선수는 1군 기록이 올해 처음이어도 후보가 아니다(KBO 표창규정 5년 이내)',()=>{fresh();const y=G.year;const src=Object.values(G.players).map(q=>!q.isP&&(q.hist||[]).find(h=>h.y===y-1&&h.lvl==='1군'&&(h.pa||0)>=450)).find(Boolean);ok(src,'준비 실패: 기준 기록 없음');const P=domestic(G.user).filter(q=>!q.isP&&!q.foreign);const old=P[0],kid=P[1];for(const [p,svc] of [[old,7],[kid,1]]){p.draft=null;p.svc=svc;p.hist=[{y:y-1,lvl:'퓨처스',pa:200,ab:180,h:50,t:G.user},{...src,y,t:G.user}];}seasonAwards(y);const R=((G.awards[y]||{}).cand||{}).roy||[];const ids=R.map(c=>c.id);ok(ids.includes(kid.id),'준비 실패: 1년 차가 후보가 아님 '+R.map(c=>c.name).join(','));ok(!ids.includes(old.id),'입단 7년 차 선수가 신인왕 후보');});
T('[계약 직접 입력] 연봉 제안의 100만원 끝자리가 합의와 저장에 남는다',()=>{fresh();const p=domestic(G.user).find(q=>!q.foreign&&!q.prospect);p.newSal=120;G.contract={done:false,y:G.year,ended:[p.id],neg:{[p.id]:{off:120,ask:120,cur:null,st:'open',wk:-1}}};salOffer(p.id,123);ok(p.newSal===123&&salNeg(p.id).cur===123,'1.23억이 다른 금액으로 반올림됨');ok(JSON.parse(JSON.stringify(p)).newSal===123,'저장 금액 손실');});
T('[계약 직접 입력] 비정상 연봉 제안은 협상 횟수와 선수 상태를 바꾸지 않는다',()=>{fresh();const p=domestic(G.user).find(q=>!q.foreign&&!q.prospect);p.newSal=120;G.contract={done:false,y:G.year,ended:[p.id],neg:{[p.id]:{off:120,ask:120,cur:null,st:'open',wk:-1}}};const before=JSON.stringify(G.contract);for(const x of [NaN,Infinity,'invalid'])salOffer(p.id,x);ok(JSON.stringify(G.contract)===before&&p.newSal===120,'잘못된 숫자로 협상 상태 변경');});

T('[공별 기록] 새 경기의 공별 합계는 투수 투구 수와 일치하고 저장 후 유지된다',()=>{fresh();G.day=G.cal.open;for(const t of G.teams)setEntry(t.id);const other=G.teams.find(t=>t.id!==G.user).id,g=simGame(G.day,G.user,other,false),rec=gameRecord(G.day,G.user,other,g,'');const totals={};for(const row of rec.pbp){if(typeof row[1]!=='number')continue;const seq=storedPitchSequence(row);ok(seq&&seq.length,'공별 기록 누락');totals[row[2]]=(totals[row[2]]||0)+seq.length;const last=seq[seq.length-1],count=FrontOfficeCore.pitchCountAfter(last);ok((row[3]==='BB')===(count.b===4),'볼넷 카운트');ok((row[3]==='K')===(count.s===3),'삼진 카운트');}for(const side of ['h','a'])for(const p of rec.box[side].pit)ok(totals[p.id]===p.pc,'투구 수 합계 불일치');const saved=JSON.parse(JSON.stringify(rec));ok(JSON.stringify(saved)===JSON.stringify(rec),'공별 저장 손실');});
T('[공별 기록] 투구 기록 생성은 경기 난수와 선수 상태를 바꾸지 않는다',()=>{fresh();const p=playersOf(G.user).find(p=>p.isP),profile=pitchProfile(p),before=JSON.stringify(p),rng=globalThis.__rngState(),args=[G.day,0,1,0,3,10,p.id,'K',5,profile];const a=gamePitchRecord(...args),b=gamePitchRecord(...args);ok(JSON.stringify(a)===JSON.stringify(b),'같은 경기 재구성 변동');ok(globalThis.__rngState()===rng&&JSON.stringify(p)===before,'투구 생성 부작용');const row=[0,10,p.id,'K'];row[15]=a;const text=JSON.stringify(row);p.r.stf=80;p.velo=160;ok(JSON.stringify(storedPitchSequence(row))===JSON.stringify(a.pitches)&&JSON.stringify(row)===text,'현재 능력으로 과거 공 변경');});
T('[공별 기록] 옛 기록과 잘못된 좌표는 저장된 투구 기록으로 취급하지 않는다',()=>{ok(storedPitchSequence([0,1,2,'K'])===null,'옛 기록을 실제 공으로 표시');const row=[0,1,2,'K'];row[15]={v:1,pitches:[{t:'직구',v:145,x:NaN,y:.5,res:'헛스윙 삼진',b:1,s:2}]};ok(storedPitchSequence(row)===null,'비정상 좌표 허용');row[15].pitches[0].x=99;ok(storedPitchSequence(row)===null,'화면 밖 비정상 좌표 허용');});

T('[리뷰 11-03g] 감독 분위기 답변은 같은 날 바뀐 기분·주장·선수 이름을 즉시 반영한다',()=>{fresh();const m=G.mgr[G.user],P=domestic(G.user),a=P[0],b=P[1];for(const p of playersOf(G.user))p.mor=60;team(G.user).cap=a.id;mgrTalk('clubhouse');const before=G.mgrChat[0].a;ok(before.includes(a.name),'최초 주장 준비');const rng=globalThis.__rngState(),rel=m.rel;b.mor=8;mgrTalk('clubhouse');ok(G.mgrChat[0].a.includes(b.name)&&G.mgrChat[0].a.includes('기분이 낮은'),'기분 변경 미반영');team(G.user).cap=b.id;mgrTalk('clubhouse');ok(G.mgrChat[0].a.includes('주장은 '+b.name),'주장 변경 미반영');b.name='검수선수';mgrTalk('clubhouse');ok(G.mgrChat[0].a.includes('검수선수'),'선수 이름 변경 미반영');ok(m.rel===rel&&globalThis.__rngState()===rng,'새 답변으로 관계/경기 난수 중복');});

T('[감독 대화] 문장 선택은 감독 식별자 전체를 쓰고 경기 난수를 소비하지 않는다',()=>{fresh();const m=G.mgr[G.user],a=Array.from({length:40},(_,i)=>'문장'+i),rng=globalThis.__rngState();const L=['g1234567','g7654321','g9876543','g2468135'].map(id=>mvPick({...m,id},'검수',a));ok(new Set(L).size>=2,'같은 길이 감독 ID의 말투 선택이 전부 같음');ok(globalThis.__rngState()===rng,'대화 선택으로 경기 난수 변경');});
T('[감독 대화] 최근 표현과 상황 기억은 감독별로 저장되고 다른 감독에게 섞이지 않는다',()=>{fresh();const m=G.mgr[G.user],other={...m,id:'other-manager'};delete m.dialogue;delete other.dialogue;const words=['검수 문장 하나','검수 문장 둘','검수 문장 셋'];const b=mvFresh(other,'독립',words);delete other.dialogue;for(let i=0;i<3;i++)mvFresh(m,'독립',words);ok(mvFresh(other,'독립',words)===b,'전임 감독의 문장 기억이 새 감독에게 섞임');const P=JSON.parse(JSON.stringify(m));ok(P.dialogue?.said.length===3,'대화 기억 저장 누락');});
T('[감독 대화] 같은 사실을 다시 물으면 답변과 주간 관계 효과가 중복되지 않고 상황 변화에는 새로 답한다',()=>{fresh();const m=G.mgr[G.user];G.mgrTalkW=null;mgrTalk('now');const first=G.mgrChat[0].a,rel=m.rel,rng=globalThis.__rngState();mgrTalk('now');ok(G.mgrChat[0].a===first,'같은 날 같은 사실인데 긴 설명을 다시 조립');ok(m.rel===rel&&globalThis.__rngState()===rng,'반복 질문으로 관계/경기 난수 변경');const p=playersOf(G.user).find(p=>ovr(p)>=48);p.injOut=17;mgrTalk('now');ok(G.mgrChat[0].a.includes(p.name)&&G.mgrChat[0].a!==first,'새 부상 미반영');});
T('[감독 대화] 세부 화제는 실제 선수·피로를 말하고 다섯 성향이 다른 판단을 제시한다',()=>{fresh();const m=G.mgr[G.user];G.day=G.cal.open+10;const p=playersOf(G.user).find(p=>p.isP);p.fat=82;const L=[];for(const voice of Object.keys(MV)){m.voice=voice;delete m.dialogue;L.push(mvDetailed(m,'workload'));}ok(new Set(L).size===5,'성향별 피로 판단이 같음');ok(L.every(x=>x.includes(p.name)),'실제 피로 선수 누락');for(const t of ['pitch','bat','defense','run','clubhouse','plan'])ok(mvDetailed(m,t).length>20,'세부 화제 답변 없음 '+t);});

T('[코칭 확장] 직원 조회는 난수·원본을 바꾸지 않고 저장 후 성격과 희망 보직을 유지한다',()=>{fresh();const c=mkCoach('pc'),before=JSON.stringify(c),rng=globalThis.__rngState(),p=staffProfile(c,'coach');ok(JSON.stringify(c)===before&&globalThis.__rngState()===rng,'조회 부작용');staffAttach(c,'coach');c.role='hc';ok(staffProfile(JSON.parse(JSON.stringify(c)),'coach').pref===p.pref,'보직 변경·저장으로 희망 보직 변경');});
T('[코칭 확장] OB 스카우트는 재생성해도 이름값이 같은 인물의 성격·희망 보직·나이를 유지한다',()=>{fresh();const ob={id:'staff-test-ob',name:'검수',sc:3,isP:false,pos:'C',team:G.user,age:47,fid:12345};const a=obScout(ob),b=obScout(ob);ok(a.age===47&&b.age===47,'OB 나이 불일치');ok(JSON.stringify(staffProfile(a,'scout'))===JSON.stringify(staffProfile(b,'scout')),'OB 스카우트 재생성으로 성격 변경');});
T('[코칭 확장] 직원 구성 전 사전 기록 생성은 중립 진루 모형과 난수 소비를 유지한다',()=>{fresh();const C=G.coach,r=playersOf(G.user).find(p=>!p.isP),fs={ofArm:OF0};delete G.coach;try{let n=0;const x=runAdvance(r,fs,{base:.4,from:3,to:4},()=>{n++;return .5;});ok(n===1&&x.safe&&x.send===(.5<.4+runAdj(r,fs)),'사전 모형·난수 소비 변경');}finally{G.coach=C;}});
T('[코칭 확장] 지도 분야별 성장은 타격·투구·주루·포수 코치를 구분한다',()=>{fresh();const C=coachesOf(G.user);for(const k of CKEYS){C[k]=mkCoach(k);for(const a in cAb(C[k]))C[k].ab[a]=55;C[k].sk=C[k].dv=55;}const b=playersOf(G.user).find(p=>!p.isP),p=playersOf(G.user).find(p=>p.isP);b.e1=p.e1=true;b.pos='C';const con=coachToolV(b,'con'),spd=coachToolV(b,'spd'),def=coachToolV(b,'def'),stf=coachToolV(p,'stf');C.rc.ab.spd=85;ok(coachToolV(b,'spd')>spd&&coachToolV(b,'con')===con,'주루 코치 분야 구분 실패');C.cc.ab.cat=85;ok(coachToolV(b,'def')>def,'배터리 코치가 포수 수비 성장에 미반영');C.pc.ab.stf=85;ok(coachToolV(p,'stf')>stf,'투수 지도 미반영');C.bc.ab.con=85;ok(coachToolV(b,'con')>con,'타격 지도 미반영');});
T('[코칭 확장] 겨울의 실제 능력 성장은 주루·포수·타격·투구 지도를 구분한다',()=>{fresh();const C=coachesOf(G.user);for(const [role,ability,key,isP,pos]of [['rc','spd','spd',false,'SS'],['cc','cat','def',false,'C'],['bc','con','con',false,'LF'],['pc','stf','stf',true,'P']]){C[role]=mkCoach(role);const base=JSON.parse(JSON.stringify(playersOf(G.user).find(p=>p.isP===isP&&!p.foreign)));develop(JSON.parse(JSON.stringify(base)));base.age=19;base.dt='norm';base.pot=78;base.e1=true;base.pos=pos;for(const k in base.r)base.r[k]=45;let low=0,high=0;for(let i=0;i<24;i++){const a=JSON.parse(JSON.stringify(base)),b=JSON.parse(JSON.stringify(base));C[role].ab[ability]=25;globalThis.__seed(91+i);develop(a);C[role].ab[ability]=85;globalThis.__seed(91+i);develop(b);low+=a.r[key];high+=b.r[key];if(role==='rc')ok(Math.abs(a.r.con-b.r.con)<.02,'주루 코치로 타격까지 변경');}ok(high>low+.5,role+' 실제 겨울 성장에 담당 코치 미반영');}});
T('[코칭 확장] 볼 배합 지도는 포수 리드와 별도로 실제 투구 계산에 작게 반영된다',()=>{fresh();const C=coachesOf(G.user);C.cc=mkCoach('cc');const fs=gameSide(G.user,G.day,false),p=fs.sp,b=playersOf((G.user+1)%10).find(p=>!p.isP),original=pitProbs;let boost=0;try{pitProbs=(p,v)=>{boost=v;return original(p,v);};C.cc.ab.cat=25;outcome(b,p,fs.defv,0,fs);const low=boost,lo=coachBatteryPlan(G.user);C.cc.ab.cat=85;outcome(b,p,fs.defv,0,fs);const hi=coachBatteryPlan(G.user);ok(boost>low&&hi>lo&&hi<=.75&&lo>=-.75,'실제 볼 배합 지도 범위·방향 오류');}finally{pitProbs=original;}});
T('[코칭 확장] 좋은 주루 코치는 불리한 홈 승부를 줄이고 유리한 추가 진루를 살린다',()=>{fresh();const C=coachesOf(G.user);C.rc=mkCoach('rc');const r=playersOf(G.user).find(p=>!p.isP),fs={ofArm:OF0};r.r.spd=50;for(const base of [.12,.85]){let lo=0,hi=0,slo=0,shi=0;for(let i=0;i<12000;i++){const u=(i+.5)/12000,v=((i*367)%12000+.5)/12000,w=((i*2897)%12000+.5)/12000;C.rc.ab.spd=25;let n=0;const a=runAdvance(r,fs,{base,from:3,to:4},()=>[u,v,w][n++]);C.rc.ab.spd=85;n=0;const b=runAdvance(r,fs,{base,from:3,to:4},()=>[u,v,w][n++]);lo+=a.send;hi+=b.send;slo+=a.send&&a.safe;shi+=b.send&&b.safe;}ok(base<.5?hi<=lo:hi>=lo,'진루 판단 방향 오류');if(base>.5)ok(shi>=slo,'유리한 승부 성공 감소');else ok(hi-shi<=lo-slo,'불리한 홈 승부 아웃 증가');}ok(coachRunAdj(G.user)<=.035,'주루 보정 과다');});
T('[코칭 확장] 주루 아웃은 실제 경기 아웃과 중계 기록에 남고 한 이닝 3아웃을 넘기지 않는다',()=>{fresh();G.day=G.cal.open;for(const t of G.teams)setEntry(t.id);const fn=runAdvance;let found=0;try{runAdvance=()=>({send:true,safe:false});for(let i=0;i<12;i++){const g=simGame(G.day,G.user,(G.user+1)%10,false);for(const x of g.pbp){if(typeof x[1]==='number'){ok(x[4]<=3,'이닝 3아웃 초과');found+=(x[14]||[]).filter(m=>m.result==='out').length;}}for(const side of ['h','a'])for(const [,b]of g.S[side].box)if(b.pa!=null)ok(b.ab+b.bb+(b.sf||0)<=b.pa,'주루 아웃이 타자 기록 중복');}}finally{runAdvance=fn;}ok(found>0,'실제 경기가 주루 판단을 쓰지 않음');});
T('[코칭 확장] 직원 면담은 소속·기한을 검사하고 관계는 저장 후 유지한다',()=>{fresh();const c=Object.values(coachesOf(G.user)).find(Boolean),before=staffRel(c,G.user,'gm');staffTalk('coach',c.id,'listen');ok(staffRel(c,G.user,'gm')>before,'관계 미반영');const snap=JSON.stringify(c);staffTalk('coach',c.id,'listen');ok(JSON.stringify(c)===snap,'면담 반복 효과');ok(staffRel(JSON.parse(snap),G.user,'gm')===staffRel(c,G.user,'gm'),'저장 후 관계 소실');const all=JSON.stringify(coachesOf(G.user));staffTalk('coach','missing','listen');ok(JSON.stringify(coachesOf(G.user))===all,'무효 직원 부작용');});
T('[코칭 확장] 스카우트와 분석원의 분야 능력은 실제 오차·분석 효과에 연결된다',()=>{fresh();const s=G.scouts[0],p=playersOf(G.user).find(p=>!p.isP);staffAttach(s,'scout');s.staff.office.bat=-8;const lo=scSd(s,p);s.staff.office.bat=8;ok(scSd(s,p)<lo,'스카우트 분야 능력 미반영');const a=anaList().find(x=>x.role==='vid');staffAttach(a,'analyst');a.staff.office.vid=-8;const low=anaEff(G.user).bat;a.staff.office.vid=8;ok(anaEff(G.user).bat>low,'영상 분석 능력 미반영');const tid=(G.user+1)%10,sc=G.lgStaff[tid].sc[0];staffAttach(sc,'scout');sc.staff.office.potential=-8;stSync(tid);const sd=team(tid).scoutSd;sc.staff.office.potential=8;stSync(tid);ok(team(tid).scoutSd<sd,'AI 스카우트 분야 능력 미반영');});

T('[중계 기록] 선발 명단은 경기 종료 명단과 독립되어 저장되고 불러와도 유지된다',()=>{ fresh(); G.day=G.cal.open;for(const t of G.teams)setEntry(t.id);const a=G.teams.find(t=>t.id!==G.user).id,g=simGame(G.day,G.user,a,false);const start=JSON.stringify(g.S.h.start);ok(g.S.h.start.length===9&&new Set(g.S.h.start.map(x=>x.id)).size===9,'선발 9명 스냅샷 없음');ok(g.S.h.start.every((x,i)=>x.o===i&&x.pos&&x.n),'타순·포지션·이름 누락');g.S.h.order.reverse();const rec=gameRecord(G.day,G.user,a,g,''),saved=JSON.parse(JSON.stringify(rec));ok(JSON.stringify(saved.box.h.lineup)===start,'종료 명단 변경으로 선발 기록 변경');ok(Array.isArray(saved.box.h.changes)&&saved.box.h.changes.every(c=>c.at>=0&&c.at<=saved.pbp.length&&c.lineup.length===9),'수비 교체 시점 저장 오류'); });

T('[투수 정보] 평균 구속이 높아져도 최고 구속 상한은 평균보다 낮아지지 않는다',()=>{ fresh(); const p=playersOf(G.user).find(p=>p.isP); p.r.stf=80;p.velo=5; ok(veloMax(p)>=veloOf(p),'최고 구속이 평균보다 낮음'); });

T('[투수 정보] 배운 구종 완성도가 오르면 화면과 실제 삼진 보정도 함께 갱신된다',()=>{ fresh(); const p=playersOf(G.user).find(p=>p.isP); p.addP=[{k:PITCHES.find(k=>!pitchOwnK(p).includes(k)),q:1}]; arsenalK(p); p.addP[0].q=25; const best=Math.max(...arsenal(p,p.r.stf).map(x=>x[1])); const expected=clamp((best-p.r.stf-4)*.0016,-.012,.025); ok(Math.abs(arsenalK(p)-expected)<1e-9,'같은 구종 수에서 완성도 변화 무시'); });

T('[투수 정보] 화면과 경기 계산은 같은 평균 구속을 사용한다',()=>{ fresh(); const p=playersOf(G.user).find(p=>p.isP); for(const stf of [25,40,55,70,80]){p.r.stf=stf; ok(veloSim(p)===veloOf(p),'표시·경기 구속 불일치 '+stf); } });
T('[투수 정보] 구종 카드의 보유·사용 구종과 효과가 실제 경기 함수와 일치한다',()=>{ fresh(); const p=playersOf(G.user).find(p=>p.isP); p.role='SP'; const a=pitchProfile(p); const real=arsenal(p,p.r.stf); ok(a.activeCount===real.length&&a.third===ttoPen(p,18),'구종 수·타순 페널티 불일치'); ok(Math.abs(a.bonus-arsenalK(p))<1e-9,'삼진 효과 불일치'); ok(JSON.stringify(a.pitches.filter(x=>x.active).map(x=>[x.name,x.value]))===JSON.stringify(real),'사용 구종과 점수 불일치'); });
T('[투수 정보] 보직을 바꾸면 비사용 구종은 보유로 남고 다시 선발로 돌아오면 활성화된다',()=>{ fresh(); const p=playersOf(G.user).find(p=>p.isP); p.role='SP'; const all=pitchProfile(p).pitches.map(x=>x.name).sort(); p.role='RP'; const rp=pitchProfile(p); ok(rp.pitches.some(x=>!x.active),'보유와 사용 구분 없음'); ok(JSON.stringify(rp.pitches.map(x=>x.name).sort())===JSON.stringify(all),'보직 변경으로 보유 구종 소실'); p.role='SP'; ok(pitchProfile(p).pitches.every(x=>x.active),'선발 복귀 후 미사용 구종'); });
T('[투수 정보] 추정 구종 점수는 보고된 구위로만 계산하고 조회로 선수·난수를 바꾸지 않는다',()=>{ fresh(); const p=playersOf(G.user).find(p=>p.isP); const before=JSON.stringify(p); globalThis.__seed(14); const next=R(); globalThis.__seed(14); const a=pitchProfile(p,40); ok(R()===next&&JSON.stringify(p)===before,'조회 부작용'); p.r.stf=80; ok(JSON.stringify(pitchProfile(p,40))===JSON.stringify(a),'추정 점수에 실제 구위 누출'); });
T('[선수 상태] 부상·징계·합류 예정은 등록·건강 상태보다 먼저 드러난다',()=>{ fresh(); const p=playersOf(G.user).find(p=>p.isP); p.e1=true;p.injOut=15; let s=playerState(p); ok(s.blocked&&s.labels.some(x=>x.includes('부상')),'부상 선수 정상 출전 표시'); p.injOut=0;p.susp=G.day+3; ok(playerState(p).labels.some(x=>x.includes('출장정지')),'징계 누락'); p.susp=0;p.joinY=G.year+1; ok(playerState(p).labels.some(x=>x.includes('합류')),'입단 예정 누락'); });
T('[선수 상태] 최근 등판·피로·팔 부하는 실제 저장값으로 읽으며 보직을 변경하지 않는다',()=>{ fresh(); const p=playersOf(G.user).find(p=>p.isP); p.role='RP'; p.lastApp=G.day-2;p.lastPc=32;p.fat=61;p.armw=200; const before=JSON.stringify(p); const s=playerState(p); ok(s.rest===2&&s.lastPc===32&&s.fat===61&&s.arm===armRatio(p),'실제 상태와 불일치'); ok(JSON.stringify(p)===before,'조회가 상태 변경'); });

T('[선수 분석] 기록이 없거나 투수면 타자 기대 지표와 존을 만들지 않는다',()=>{ fresh(); const b=playersOf(G.user).find(p=>!p.isP); ok(b,'준비 실패'); b.spr=null; const a=playerAnalysis(b,G.year); ok(a.expected===null&&a.zones.length===0,'기록 없는 선수의 추정값 생성'); const p=playersOf(G.user).find(p=>p.isP); ok(playerAnalysis(p,G.year).expected===null,'투수에게 타자 지표 생성'); });
T('[선수 분석] 경기 기록 없는 기대 지표와 코스별 강약점을 만들어내지 않는다',()=>{ fresh(); const b=playersOf(G.user).find(p=>!p.isP); b.hist=[{...ZB,y:G.year,lvl:'1군',t:G.user,pa:50,ab:40,h:10,bb:10,so:10}]; b.spr={y:G.year,t:{LD:[30,10]},z:{CF:[30,10,0,0]}}; const a=playerAnalysis(b,G.year); ok(a.expected===null&&a.zones.length===0,'경기에서 쓰거나 관측하지 않은 기대값·존 생성'); });
T('[선수 분석] 실제 시즌 타율과 wOBA는 해당 시즌의 기록과 일치한다',()=>{ fresh(); const b=playersOf(G.user).find(p=>!p.isP); b.hist=[{...ZB,y:G.year,lvl:'1군',t:G.user,pa:50,ab:40,h:10,bb:10,so:10}]; const a=playerAnalysis(b,G.year); ok(a.observed&&a.observed.avg===.25&&Math.abs(a.observed.woba-(.69*10+.89*10)/50)<1e-9,'관측 지표 불일치'); ok(playerAnalysis(b,G.year-1).observed===null,'과거 시즌 혼입'); });
T('[선수 분석] 타격 런 밸류는 리그 평균 대비 득점으로 계산하고 주루는 도루·실패를 반영한다',()=>{ fresh(); const b=playersOf(G.user).find(p=>!p.isP); b.hist=[{...ZB,y:G.year,lvl:'1군',t:G.user,pa:100,ab:90,h:40,bb:10,hr:10,d:5,sb:5,cs:2}]; const a=playerAnalysis(b,G.year); const h=seasonTotal(b,G.year,'1군'),l=lgBat(G.year,'1군'); ok(Math.abs(a.runs.bat-(wobaOf(h)-l.woba)/l.scale*100)<1e-9,'타격 가치 계산 오류'); ok(Math.abs(a.runs.run-.2)<1e-9,'도루 실패 미반영'); });
T('[선수 분석] 타구 점도 기록은 결과·방향을 보존하며 난수를 소비하지 않고 저장 후 유지된다',()=>{ fresh(); const b=playersOf(G.user).find(p=>!p.isP),p=playersOf(G.user).find(p=>p.isP); b.spr=null; globalThis.__seed(31); const expected=R(); globalThis.__seed(31); sprAdd(b,p,'3B',{t:'LD',pos:'RF'}); ok(R()===expected,'집계가 경기 난수 소비'); ok(JSON.stringify(b.spr.points)==='[["RF","3B"]]','타구 결과·방향 누락'); const id=b.id; G=JSON.parse(JSON.stringify(G)); ok(G.players[id].spr.points[0][1]==='3B','저장 시 소실'); });
T('[선수 분석] 새 시즌 타구 점도는 초기화하고 지난해 기록을 따로 보존한다',()=>{ fresh(); const b=playersOf(G.user).find(p=>!p.isP),p=playersOf(G.user).find(p=>p.isP); b.spr=null; sprAdd(b,p,'HR',{t:'FB',pos:'LF'}); const y=G.year; G.year++; sprAdd(b,p,'OUT',{t:'GB',pos:'SS'}); ok(b.spr.points.length===1&&b.sprP.y===y&&b.sprP.points[0][1]==='HR','시즌별 점도 혼합'); });

T('[자체 리뷰 1] 현재 감독의 유효한 소식 요청은 재계약하고 재실행해도 한 번만 반영한다',()=>{ fresh(); G.day=KD(11,15); const m=G.mgr[G.user]; m.yrs=1; offseasonMgr(); const msg=G.mail.find(x=>(x.acts||[]).some(a=>a.a==='renewMgr')); ok(msg,'소식 준비 실패'); const a=msg.acts.find(a=>a.a==='renewMgr'), args=String(a.v).split(':'); ok(args.length===3&&+args[1]===G.user&&args[2]===m.id,'소식에 요청 대상 없음'); ok(!renewMgr(+args[0],args[1],args[2]),'유효한 요청 거절'); ok(m.yrs===2&&m.cs===G.year+1&&m.ce===G.year+2,'재계약 정보 오류'); const after=JSON.stringify(m); renewMgr(+args[0],args[1],args[2]); ok(JSON.stringify(m)===after,'재계약 중복'); });
T('[자체 리뷰 1] AI 갱신 후 원 구단에 돌아와 연장하면 종료 시즌도 연장된다',()=>{ fresh(); const tid=G.user; G.day=KD(7,1); hireMgr(G.mmarket[0].id,1); switchTeam(G.teams.find(t=>t.id!==tid).id); G.day=KD(11,15); offseasonMgr(); switchTeam(tid); const m=G.mgr[tid]; ok(m&&m.yrs>0,'준비 실패'); const ce=m.ce, yrs=m.yrs; m.rel=80; delete m.extY; ok(!extendMgr(1),'연장 실패'); ok(m.yrs===yrs+1&&m.ce===ce+1&&m.ce===G.year+m.yrs,'복귀 후 연장 정보 불일치'); });

T('[자체 리뷰 1] 감독 재계약 요청은 요청한 구단과 감독이 달라지면 거절한다',()=>{ fresh(); const old=G.user, mid=G.mgr[old].id; switchTeam(G.teams.find(t=>t.id!==old).id); const m=G.mgr[G.user]; m.yrs=0; const before=JSON.stringify(m); const r=renewMgr(2,old,mid); ok(typeof r==='string'&&JSON.stringify(m)===before,'옛 구단 요청이 새 감독에게 적용됨'); });
T('[자체 리뷰 1] 구단을 떠나면 옛 감독 재계약 소식의 실행 버튼을 제거한다',()=>{ fresh(); G.day=KD(11,15); G.mgr[G.user].yrs=1; offseasonMgr(); const mail0=G.mail.find(x=>(x.acts||[]).some(a=>a.a==='renewMgr')); ok(mail0,'소식 준비 실패'); switchTeam(G.teams.find(t=>t.id!==G.user).id); ok(!(mail0.acts||[]).some(a=>a.a==='renewMgr'),'이직 뒤 옛 재계약 버튼 유지'); });

T('[자체 리뷰 1] 이직해 AI가 갱신한 감독 계약의 종료 시즌은 실제 잔여 기간과 같다',()=>{ fresh(); const tid=G.user; G.day=KD(7,1); const cand=G.mmarket[0]; ok(cand,'준비 실패'); hireMgr(cand.id,1); const to=G.teams.find(t=>t.id!==tid).id; switchTeam(to); G.day=KD(11,15); offseasonMgr(); const m=G.mgr[tid]; ok(m&&m.yrs>0,'AI 후임 준비 실패'); ok(m.cs===G.year+1&&m.ce===G.year+m.yrs,'AI 감독 계약 시즌 불일치: '+JSON.stringify({cs:m.cs,ce:m.ce,yrs:m.yrs})); });
T('[자체 리뷰 1] AI가 갱신하거나 교체한 코치 계약도 다음 시즌부터 센다',()=>{ fresh(); const tid=G.user; G.day=KD(7,1); refreshCoachMarket(); const c=G.cmarket.find(x=>!x.ob); ok(c,'준비 실패'); hireCoach(c.id,1); const role=c.role; switchTeam(G.teams.find(t=>t.id!==tid).id); G.day=KD(11,15); coachYear(); const n=coachesOf(tid)[role]; ok(n&&n.yrs>0,'AI 코치 준비 실패'); ok(n.cs===G.year+1&&n.ce===G.year+n.yrs,'AI 코치 계약 시즌 불일치: '+JSON.stringify({cs:n.cs,ce:n.ce,yrs:n.yrs})); });
T('[자체 리뷰 1] 사임한 단장은 옛 소식함의 감독 재계약을 실행할 수 없다',()=>{ fresh(); G.day=KD(11,15); const m=G.mgr[G.user]; m.yrs=1; offseasonMgr(); ok(m.yrs===0&&G.mail.some(x=>(x.acts||[]).some(a=>a.a==='renewMgr')),'재계약 소식 준비 실패'); firedFlow(G.year,'자체 검수','resign'); const before=JSON.stringify({m,spend:G.spend,cash:team(G.user).cash}); const result=renewMgr(2); ok(typeof result==='string'&&result.length,'권한 없는 재계약을 거절하지 않음'); ok(JSON.stringify({m,spend:G.spend,cash:team(G.user).cash})===before,'사임 후 옛 구단 계약 변경'); });

T('[리뷰 11-02x] 겨울 정리 뒤 신규 코치와 감독도 다음 시즌부터 계약한다',()=>{ fresh(); G.day=KD(11,15); G.rolled=G.year; refreshCoachMarket(); const c=G.cmarket.find(x=>!x.ob); ok(c,'준비 실패'); ok(hireCoach(c.id,1)==='','채용 실패'); const m=G.mmarket[0]; ok(m,'준비 실패'); hireMgr(m.id,2); ok(c.cs===G.year+1&&c.ce===G.year+1,'정리 후 코치 계약 시즌 오류'); ok(m.cs===G.year+1&&m.ce===G.year+2,'정리 후 감독 계약 시즌 오류'); });
T('[리뷰 11-02x] 코치와 감독 연장은 종료 시즌을 늘리고 만료 감독 재계약은 새 시즌부터 시작한다',()=>{ fresh(); G.day=KD(7,1); const c=mkCoach('bc'); staffCt(c,1); G.coach[G.user].bc=c; const cy=c.ce; ok(!extendCoach('bc',1),'코치 연장 실패'); ok(c.ce===cy+1&&c.cs===G.year,'코치 종료 시즌 불변'); const m=G.mgr[G.user]; staffCt(m,1); m.rel=80; delete m.extY; const my=m.ce; ok(!extendMgr(1),'감독 연장 실패'); ok(m.ce===my+1,'감독 종료 시즌 불변'); G.day=KD(11,15); G.rolled=G.year; m.yrs=0; renewMgr(2); ok(m.cs===G.year+1&&m.ce===G.year+2,'만료 감독 재계약 시즌 오류'); });
T('[리뷰 11-02x] 야인 상태에도 원 우승 구단 홈경기에서 반지 수여식을 한 번 연다',()=>{ champNow(); const tid=G.user; firedFlow(G.year,'검수','resign'); ok(G.unemp,'야인 전환 실패'); G.year++; const a=G.teams.find(t=>t.id!==tid).id; stadGame(G.day,tid,a); ok(G.ringDone===G.year,'야인 상태가 원 구단 반지 수여식을 막음'); const morale=playersOf(tid).map(p=>p.mor); stadGame(G.day+1,tid,a); ok(JSON.stringify(morale)===JSON.stringify(playersOf(tid).map(p=>p.mor)),'반지 효과 중복'); });
T('[리뷰 11-02x] AI 우승 구단에 부임하면 남은 행사를 이어받고 저장 후에도 한 번만 실행한다',()=>{ fresh(); const tid=G.teams.find(t=>t.id!==G.user).id; G.ps={champ:tid,runner:G.user,res:{},done:true}; champCelebrate(); switchTeam(tid); ok(G.parade&&G.parade.tid===tid,'AI 우승 행사 인계 누락'); G=JSON.parse(JSON.stringify(G)); G.day=G.parade.d; champParade(); const pop=team(tid).pop; champParade(); ok(team(tid).pop===pop,'퍼레이드 중복'); G.year++; const a=G.teams.find(t=>t.id!==tid).id; stadGame(G.day,tid,a); ok(G.ringDone===G.year,'부임 구단 반지 수여식 누락'); });
T('[리뷰 11-02x] 구단 ID 없는 옛 우승 저장은 이직 전에 원 구단에 귀속한다',()=>{ champNow(); const tid=G.user; delete G.parade.tid; delete G.ringT; delete G.champPop0.tid; G=JSON.parse(JSON.stringify(G)); const to=G.teams.find(t=>t.id!==tid).id; switchTeam(to); G.day=G.parade.d; const pop=team(to).pop; champParade(); ok(team(to).pop===pop&&G.parade.tid===tid,'옛 우승 행사가 새 구단에 적용됨'); G.year++; stadGame(G.day,to,tid); ok(G.ringDone!==G.year,'새 구단에 옛 반지 효과'); stadGame(G.day,tid,to); ok(G.ringDone===G.year,'원 구단 반지 누락'); });

T('[리뷰 11-02x] 겨울 신규 코치는 다음 시즌을 마친 뒤 만료되고 감독은 한 해만 차감된다',()=>{ fresh(); G.day=KD(11,15); G.rolled=G.year; refreshCoachMarket(); const c=G.cmarket.find(x=>!x.ob); ok(c,'준비 실패'); hireCoach(c.id,1); const m=G.mmarket[0]; ok(m,'준비 실패'); hireMgr(m.id,2); offseasonMgr(); ok(coachesOf(G.user)[c.role]===c&&c.yrs===1&&m.yrs===2,'계약 시작 전 기간 차감'); G.year++; G.day=KD(11,15); offseasonMgr(); ok(coachesOf(G.user)[c.role]!==c&&c.yrs===0,'한 시즌 뒤 코치 만료 누락'); ok(G.mgr[G.user]===m&&m.yrs===1,'감독 기간 차감 오류'); });
T('[리뷰 11-02x] 이직 후 원 우승 구단 복귀와 불러오기가 행사 완료 상태를 보존한다',()=>{ champNow(); const tid=G.user, to=G.teams.find(t=>t.id!==tid).id; switchTeam(to); G=JSON.parse(JSON.stringify(G)); migrateDraft(); switchTeam(tid); G.day=G.parade.d; champParade(); ok(G.parade.done&&G.parade.tid===tid,'복귀 후 행사 인계 누락'); const pop=team(tid).pop; switchTeam(to); G=JSON.parse(JSON.stringify(G)); switchTeam(tid); champParade(); ok(team(tid).pop===pop&&G.parade.done,'복귀 후 행사 중복'); });
T('[리뷰 11-02x] 외국인 결정 대기 해소 후 연봉 자동 확정은 다음 날 한 번만 실행된다',()=>{ fresh(); const f=foreignOf(G.user)[0]; ok(f,'준비 실패'); G.auto=Object.assign({},G.auto||{},{sal:true,fre:false}); G.contract={y:G.year-1,tid:G.user,ended:[],foreignEnd:[f.id],foreignDrop:[],released:[],done:false,fre:{}}; f.newSal=f.sal; G.day=KD(1,5); autoDaily(G.day); ok(G.contract.autoWait,'대기 준비 실패'); G.contract.fre[f.id]={ok:true}; G.day++; autoDaily(G.day); ok(G.contract.done&&!G.contract.autoWait,'다음 날 확정 누락'); const snap=JSON.stringify({sal:f.sal,contract:G.contract,cash:team(G.user).cash}); G.day++; autoDaily(G.day); ok(JSON.stringify({sal:f.sal,contract:G.contract,cash:team(G.user).cash})===snap,'확정 계약 중복 처리'); });

T('[리뷰 11-02x] 시작 시즌 없는 옛 계약 연장은 겨울 정리 전 잔여 시즌을 중복으로 세지 않는다',()=>{ fresh(); G.day=KD(10,31); G.rolled=G.year-1; const c=mkCoach('bc'); c.yrs=1; G.coach[G.user].bc=c; ok(!extendCoach('bc',1),'준비 실패'); ok(c.cs===G.year&&c.ce===G.year+1,'기존 계약의 이번 시즌을 다음 시즌으로 미룸'); });

T('[공통 점검] 보상: 완료된 정산은 두 번 호출하거나 저장 후 재실행해도 한 번만 지급한다',()=>{ fresh(); const to=G.teams.find(t=>t.id!==G.user).id; const c={id:'cp반복',pid:-1,name:'검수',grade:'A',from:G.user,to,prev:100,day:G.day,stage:'pick',prot:[]}; G.comp=[c];
  compResolve(c,null); const after=JSON.stringify({cash:team(to).cash,spend:G.spend,moves:G.moves}); compResolve(c,null);
  ok(JSON.stringify({cash:team(to).cash,spend:G.spend,moves:G.moves})===after,'완료 정산을 반복하면 보상금이 중복 지급됨');
  G=JSON.parse(JSON.stringify(G)); compResolve(G.comp[0],null); ok(JSON.stringify({cash:team(to).cash,spend:G.spend,moves:G.moves})===after,'저장 후 재실행하면 보상금이 중복 지급됨'); });
T('[공통 점검] 보상: 무효 선수·보호 선수·잘못된 단계는 비용과 소속을 바꾸기 전에 거절한다',()=>{ fresh(); const to=G.teams.find(t=>t.id!==G.user).id;
  const q=compPool(to)[0]; ok(q,'준비 실패: 보상 후보 없음'); const c={id:'cp자격',pid:-1,name:'검수',grade:'A',from:G.user,to,prev:100,day:G.day,stage:'pick',prot:[q.id]}; G.comp=[c];
  const before=JSON.stringify({spend:G.spend,cash:team(to).cash,team:q.team,comp:G.comp,moves:G.moves}); let thrown=false; try{ compResolve(c,-999999); }catch(e){ thrown=true; }
  ok(!thrown,'없는 선수를 지정했을 때 정산 중 예외 발생'); ok(JSON.stringify({spend:G.spend,cash:team(to).cash,team:q.team,comp:G.comp,moves:G.moves})===before,'무효 선수 검사 전에 보상금·단계가 변경됨');
  compResolve(c,q.id); ok(JSON.stringify({spend:G.spend,cash:team(to).cash,team:q.team,comp:G.comp,moves:G.moves})===before,'보호 선수를 데려오거나 보상금을 지급함');
  c.stage='protect'; const b2=JSON.stringify({spend:G.spend,cash:team(to).cash,comp:G.comp}); compResolve(c,null); ok(JSON.stringify({spend:G.spend,cash:team(to).cash,comp:G.comp})===b2,'보호명단 단계에서 정산됨'); });
T('[공통 점검] 결정: 없는 선택값은 예외나 완료 표시 없이 거절하고 정상 결정은 한 번만 적용한다',()=>{ fresh(); EVH.fan.make({fan:50}); const e=G.evs[G.evs.length-1]; const snap=()=>JSON.stringify({event:e,spend:G.spend,fan:G.pr.fan,mail:G.mail,log:G.evlog});
  const before=snap(); let thrown=false; try{ evPick(e.id,99); }catch(x){ thrown=true; } ok(!thrown,'범위 밖 선택값으로 진행 예외'); ok(snap()===before,'유효하지 않은 선택이 완료 처리됨');
  evPick(e.id,0); const after=snap(); evPick(e.id,0); ok(snap()===after,'같은 결정이 두 번 반영됨'); });
T('[공통 점검] 협상: 새해에 늦게 초기화해도 계약의 기준 시즌은 직전 시즌으로 유지한다',()=>{ fresh(); G.day=KD(12,1); contractStart(); const y=G.contract.y; delete G.contract.neg;
  G.day=dnum(G.year+1,1,2); G.year++; salTalkInit(); ok(G.contract.y===y,'협상 초기화가 계약 기준 시즌을 '+y+'에서 '+G.contract.y+'로 바꿈'); });
T('[공통 점검] 위임: 1월 5일 이후 맡긴 연봉은 이전 대기 기록이 없어도 다음 일일 처리에서 확정한다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.ys); ok(p,'준비 실패');
  G.day=KD(1,6); p.newSal=p.sal; G.contract={y:G.year-1,tid:G.user,ended:[p.id],foreignEnd:[],foreignDrop:[],released:[],done:false,neg:{[p.id]:{off:p.sal,ask:p.sal,cur:p.sal,st:'ok'}}};
  const keep=JSON.stringify(G); for(const d of [4,5,6]){ G=JSON.parse(keep); G.day=KD(1,d); autoSet('sal',true); autoDaily(G.day); ok(G.contract.done===(d>=5),'1월 '+d+'일 위임 확정 시점 오류'); } });
T('[공통 점검] 진행: 새해를 하루 넘겼을 때 지난 시즌 승패를 음수로 표시하지 않는다',()=>{ fresh(); G.day=KD(12,31); G.sea.rec[G.user]={w:71,l:73,t:0}; G.res=null; G.live=null; G.stops=[];
  const a=advance('day'); ok(a.days===1&&a.to-a.from===1,'새해 하루 진행 일수 오류'); ok(a.w===0&&a.l===0,'경기 없는 새해 진행에서 '+a.w+'승 '+a.l+'패 표시'); });
T('[공통 점검] 진행: 체험 종료로 날짜가 되돌려지면 실제 진행 일수는 0일이다',()=>{ fresh(); const on=DEMO.on; try{ DEMO.on=true; G.day=KD(10,31); G.startY=G.year; G.res=null; G.live=null; G.stops=[];
    const a=advance('day'); ok(G.demoEnd&&a.to===a.from,'준비 실패: 체험 종료가 아님'); ok(a.days===0,'날짜가 안 바뀌었는데 '+a.days+'일 진행으로 표시'); } finally { DEMO.on=on; } });
T('[공통 점검] 캐시: 같은 날 연봉 변경·실제 방출 뒤 프랜차이즈 대상과 상한은 강제 재계산과 같다',()=>{ fresh(); const L=domestic(G.user).filter(p=>!p.ys&&p.age<=32&&ovr(p)>=35&&!hasNtc(p)); ok(L.length>=2,'준비 실패: 대상 부족'); const [a,b]=L;
  for(const p of domestic(G.user))p.hist=(p.hist||[]).filter(h=>h.t!==G.user); for(const p of [a,b])p.hist=Array.from({length:7},(_,i)=>Object.assign({},p.isP?ZP:ZB,{y:G.year-7+i,t:G.user,lvl:'1군'}));
  a.sal=1500; b.sal=1400; _franC={k:null}; ok(franId(G.user)===a.id,'준비 실패: 첫 대상이 다름'); b.sal=1600; ok(franId(G.user)===b.id,'같은 날 연봉 변경 후 예전 대상이 남음');
  const projected=capPayAs(G.user,[],[b.id]); const err=releasePlayer(b.id); ok(!err&&b.team!==G.user,'준비 실패: 실제 방출 실패 '+err); ok(franId(G.user)===a.id,'방출한 선수가 프랜차이즈 캐시에 남음');
  const cached=capPay(G.user); ok(projected===cached,'제외 인원으로 계산한 상한 전망 '+projected+' ≠ 실제 이동 뒤 '+cached); _franC={k:null}; const uncached=capPay(G.user); ok(cached===uncached,'캐시 유무에 따라 상한 '+cached+' / '+uncached); });

T('[포스팅] FA 계약을 한 적 있거나 해외에서 돌아온 선수에게는 포스팅 요청이 오지 않는다',()=>{ fresh(); const ps=playersOf(G.user).filter(p=>!p.foreign).slice(0,3); ok(ps.length===3,'준비 실패');
  for(const p of ps){ p.svc=8; p.age=27; p.mlb=90; p.joinY=G.year-8; delete p.faC; delete p.faN; delete p.lastFA; delete p.ovsY; delete p.retFrom; }
  ps[0].faC=true; ps[0].faN=1; ps[0].yrs=1; ps[1].ovsY=G.year-3; ps[1].retFrom=G.user; G.posting=[]; const n0=(G.evs||[]).length; postingSeason();
  const asked=id=>(G.evs||[]).slice(n0).some(e=>e.k==='post'&&e.data&&e.data.pid===id);
  ok(!asked(ps[0].id),'FA 계약 선수에게 포스팅 요청이 옴'); ok(!asked(ps[1].id),'해외 복귀 선수에게 포스팅 요청이 옴'); ok(asked(ps[2].id)||ovr(ps[2])<60,'보류 선수(서비스 8년)에게 포스팅 요청이 안 옴'); });
T('[외국인 규정 검수] 아시아쿼터 교체는 일반 외국인 횟수와 별도로 한 번만 가능하다',()=>{ fresh(); G.day=G.cal.open+20; G.sea.repl[G.user]=F_REPL_MAX;
  for(const p of foreignOf(G.user).filter(p=>p.foreign==='아시아'))releaseForeign(p.id);
  const q=newForeign('아시아',{market:true}); q.ask=ASIA_CAP/2; q.fknow=[G.user]; q.fpub=G.day; G.fmarket.push(q.id);
  const r=foOffer(q.id,ASIA_CAP,0); ok(r.ok&&q.team===G.user,'일반 교체 소진으로 아시아 첫 교체가 막힘: '+r.msg);
  ok(G.sea.repl[G.user]===F_REPL_MAX,'아시아 교체가 일반 횟수를 사용함'); releaseForeign(q.id);
  const next=newForeign('아시아',{market:true}); const before=JSON.stringify(G); const r2=foOffer(next.id,ASIA_CAP,0);
  ok(!r2.ok&&/교체/.test(r2.msg),'아시아 두 번째 교체가 허용됨'); ok(JSON.stringify(G)===before,'거절 뒤 상태가 바뀜'); });
T('[외국인 규정 검수] 아시아 교체를 소진해도 일반 외국인 계약은 가능하며 저장 상태에 각각 남는다',()=>{ fresh(); G.day=G.cal.open+20; const asia=foreignOf(G.user).find(p=>p.foreign==='아시아'); releaseForeign(asia.id);
  const a=newForeign('아시아',{market:true}); a.ask=100; signForeign(G.user,a.id); const f=foreignOf(G.user).find(p=>p.foreign==='용병'); releaseForeign(f.id);
  const q=newForeign('용병',{isP:f.isP,market:true}); q.ask=100; ok(!signForeign(G.user,q.id),'일반 외국인 첫 계약이 실패함');
  G=JSON.parse(JSON.stringify(G)); ok(fReplLeft(G.user,'아시아')===0,'저장 상태에서 아시아 잔여 횟수가 복원되지 않음'); ok(fReplLeft(G.user)===F_REPL_MAX-1,'일반 외국인 잔여 횟수가 아시아와 섞임');
  G.sea={y:G.year+1,repl:{},fspend:{}}; G.year++; ok(fReplLeft(G.user,'아시아')===1&&fReplLeft(G.user)===F_REPL_MAX,'새 시즌 카운터가 초기화되지 않음'); });
T('[외국인 규정 검수] 직접 계약도 교체 한도와 소속을 검사하고 실패 시 아무것도 바꾸지 않는다',()=>{ fresh(); G.day=G.cal.open+20; G.sea.repl[G.user]=F_REPL_MAX; const f=foreignOf(G.user).find(p=>p.foreign==='용병'); releaseForeign(f.id);
  const q=newForeign('용병',{isP:f.isP,market:true}); q.ask=100; const before=JSON.stringify(G); const err=signForeignT(G.user,q.id,100,10);
  ok(!!err&&q.team==null,'직접 계약이 교체 한도를 우회함'); ok(JSON.stringify(G)===before,'실패한 계약이 연봉·현금·시장·상태를 바꿈');
  const own=foreignOf(G.user)[0]; const before2=JSON.stringify(G); ok(!!signForeign(G.user,own.id),'이미 소속된 선수를 다시 계약함'); ok(JSON.stringify(G)===before2,'중복 계약이 상태를 바꿈'); });
T('[외국인 규정 검수] 보류권은 선수 식별자로 타 구단 계약을 막고 원 구단·만료 뒤에는 허용한다',()=>{ fresh(); const owner=G.teams.find(t=>t.id!==G.user).id;
  for(const p of [...foreignOf(G.user),...foreignOf(owner)])p.team=null;
  const q=newForeign('용병',{market:true}); q.ask=300; foResAdd(q,owner); G.fmarket.push(q.id);
  ok(/보류/.test(foreignCheck(G.user,q)),'보류권 선수를 타 구단이 영입할 수 있음'); const before=JSON.stringify(G); ok(!!signForeign(G.user,q.id),'직접 계약이 보류권을 우회함'); ok(JSON.stringify(G)===before,'보류권 위반 계약이 상태를 바꿈');
  ok(!foreignCheck(owner,q),'원 구단도 계약할 수 없음'); const other=newForeign('용병',{market:true}); other.name=q.name; other.nat=q.nat; other.ask=300; ok(!foreignCheck(G.user,other),'식별자가 다른 동명이인까지 차단함');
  G.year+=6; ok(!foreignCheck(G.user,q),'기존 보류 만료 연도 뒤에도 계약을 차단함'); });
T('[외국인 규정 검수] 유효한 보류권은 40명 제한이나 중복 기록으로 유실되지 않고 옛 저장도 검사한다',()=>{ fresh(); for(const p of foreignOf(G.user))p.team=null;
  const owner=G.teams.find(t=>t.id!==G.user).id; const q=newForeign('용병',{market:true}); q.ask=300; foResAdd(q,owner); foResAdd(q,owner);
  for(let i=0;i<45;i++){ const p=newForeign('용병',{market:true}); foResAdd(p,owner); }
  ok((G.fRes||[]).filter(r=>r.pid===q.id).length===1,'보류 기록 중복 또는 40명 제한으로 권리 유실'); ok(/보류/.test(foreignCheck(G.user,q)),'새 기록이 늘면 기존 유효 보류권을 잃음');
  G.fRes=[{name:q.name,nat:q.nat,tid:owner,y:G.year,until:G.year+5}]; G=JSON.parse(JSON.stringify(G)); ok(/보류/.test(foreignCheck(G.user,G.players[q.id])),'선수 식별자가 없던 옛 저장 보류권을 무시함'); });

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
  releasePlayer(p.id); ok(p.team==null,'준비 실패: 방출 안 됨'); delete p.wv; /* 웨이버 공시 7일은 지난 것으로 */ p.relD-=400; if(p.relBan)p.relBan[G.user]=G.day-1; /* 방출한 구단은 1년 뒤에야 다시 계약할 수 있다 */ if(rosterN(G.user)>=ROSTER_MAX)trimRoster(G.user,ROSTER_MAX-1); const e=signFree(p.id,G.user); ok(p.team===G.user,'준비 실패: 재영입 안 됨 '+(e||''));
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
T('이직: 외국인 재계약 결정(결별·인센티브)은 이직해도 그대로 지켜진다(e4305cc 리뷰)',()=>{ fresh(); simTo(()=>G.contract&&!G.contract.done&&G.contract.foreignEnd&&G.day>=KD(12,1)); { const C0=G.contract; let g=0; while(C0.foreignEnd.filter(id=>G.players[id]&&G.players[id].foreign==='용병').length<2&&g++<4){ const q=newForeign('용병',{}); q.team=G.user; q.sal=q.ask||30000; q.newSal=q.sal; initPers(q); C0.foreignEnd.push(q.id); } } /* 시즌 중 교체·방출로 용병이 모자랄 수 있어 재계약 대상을 채운다 */ 
  const C=G.contract; const old=G.user; const [a,b]=C.foreignEnd.filter(id=>G.players[id].foreign==='용병').map(id=>G.players[id]); ok(a&&b,'준비 실패: 재계약 대상 용병 2명 없음');
  C.foreignDrop.push(a.id); a.fleft=true; b.newSal=b.sal; b.fInc=200; C.fre=C.fre||{}; C.fre[b.id]={ok:true};
  G.gmSince=G.year; switchTeam(otherT()); const A=G.players[a.id]; ok(!(A&&A.team===old),'결별한 선수가 이전 구단과 재계약됨');
  ok(b.team===old,'준비 실패: 합의한 선수가 이전 구단에 없음'); ok(b.opt&&b.opt.a===200&&ctOn(b),'합의한 인센티브 2억이 빠짐: '+JSON.stringify(b.opt||null)); });

T('이직: 이전 구단의 신구장 공사는 그 구단이 이어서 완공한다(e4305cc 리뷰)',()=>{ fresh(); const old=G.user; const S=stadOf(old); S.proj={stage:'build',k:'mid',cap:21000,cost:9000,paid:0,done:G.day+5};
  G.gmSince=G.year; switchTeam(otherT()); G.day+=5; newStadDaily(); ok(!stadOf(old).proj&&stadCap(old)===21000,'이전 구단 신구장이 완공일이 지나도 공사 중: '+JSON.stringify(stadOf(old).proj)); });

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

T('무적 선수로 은퇴해도 은퇴 기록·명예의 전당 심사를 거친다(52ea599 리뷰)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP); p.aw=[(G.year-3)+' MVP',(G.year-2)+' MVP']; toFree(p,'테스트 방출'); delete p.wv; /* 웨이버 공시 7일은 지난 것으로 */ p.freeSince=G.year-10; const nm=p.name;
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
  const q1=domestic(other).filter(x=>!x.ys&&!x.foreign).sort((a,b)=>a.sal-b.sal)[0]; /* 연봉이 가장 적은 선수: 예산 초과로 구단주 결재에 걸리지 않게 */ G.offers=[{id:'t1',from:other,give:[q1.id],get:[p.id],exp:G.day+7,day:G.day}]; answerOffer('t1',true); ok(p.team===other,'준비 실패: 트레이드 안 됨');
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
  const q1=domestic(other).filter(x=>!x.ys&&!x.foreign).sort((a,b)=>a.sal-b.sal)[0]; /* 연봉이 가장 적은 선수: 예산 초과로 구단주 결재에 걸리지 않게 */ prInit(); const f0=G.pr.fan; G.offers=[{id:'fr1',from:other,give:[q1.id],get:[p.id],exp:G.day+7,day:G.day}]; answerOffer('fr1',true); ok(p.team===other,'준비 실패: 트레이드 안 됨');
  ok(G.pr.fan<f0-2,'프랜차이즈 스타를 보냈는데 팬 여론 '+f0+' → '+G.pr.fan); });

/* ===== 패턴 감사(반복 처리·끝난 뒤 적용) ===== */
T('[감사] 방출한 구단은 1년 안에 같은 선수와 다시 계약할 수 없다(연봉 깎기 반복 방지)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign&&!q.faC&&q.sal>=300)||(()=>{ const q=playersOf(G.user).find(x=>!x.foreign&&!x.faC&&!x.ys); if(q)q.sal=300; return q; })(); /* 만든 리그에 따라 그런 선수가 없을 수 있어 연봉을 맞춘다 */ ok(p,'준비 실패'); const s0=p.sal; releasePlayer(p.id); const e=signFree(p.id,G.user);
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
  const choices=G.teams.filter(t=>t.id!==G.user).flatMap(t=>domestic(t.id).filter(q=>!q.ys&&!q.foreign&&!hasNtc(q)).map(q=>({other:t.id,q}))).sort((a,b)=>Math.abs(a.q.sal-p.sal)-Math.abs(b.q.sal-p.sal));const legal=choices.find(({other,q})=>{const e=evalTrade(other,[p.id],[q.id],0),o=tradeOwnerCheck([p.id],[q.id],0);return e.theirN>=ROSTER_MIN&&e.theirN<=ROSTER_MAX&&(e.theirPay<=capOf(G.year)||e.theirPay<=capPay(other))&&(!o||o.ok);});ok(legal,'준비 실패: 규정·예산에 맞는 트레이드 상대 없음');const {other,q:q1}=legal;G.offers=[{id:'t1',from:other,give:[q1.id],get:[p.id],exp:G.day+7,day:G.day}]; answerOffer('t1',true); ok(p.team===other,'준비 실패: 트레이드 안 됨');
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
  const q1=domestic(other).filter(x=>!x.ys&&!x.foreign).sort((a,b)=>a.sal-b.sal)[0]; /* 연봉이 가장 적은 선수: 예산 초과로 구단주 결재에 걸리지 않게 */ G.offers=[{id:'t3',from:other,give:[q1.id],get:[p.id],exp:G.day+7,day:G.day}]; answerOffer('t3',true); ok(p.team===other,'준비 실패');
  ok(!p.listed&&!p.promise&&!p.pconv&&!(p.extNext&&p.extNext.terms),'트레이드 뒤에도 남음: '+JSON.stringify({listed:p.listed,promise:!!p.promise,pconv:!!p.pconv,terms:!!(p.extNext&&p.extNext.terms)})); });

T('[감사] 감독을 경질해 대행 체제가 되면 전임 감독의 육성 우대(×1.3)는 끝난다',()=>{ fresh(); const m=G.mgr[G.user]; const p=playersOf(G.user).find(q=>q.age<=25)||playersOf(G.user)[0]; G.mpick={y:G.year,mid:m.id,ids:[p.id],back:true,day:G.day};
  ok(mpickMult(p)===1.3,'준비 실패'); fireMgr(); ok(mpickMult(p)===1,'경질 뒤에도 전임 감독 우대 '+mpickMult(p)); });

T('[감사] 해외에서 돌아온 선수의 진출 전 계약 조건은 되살아나지 않는다',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP); p.faC=true; p.yrs=3; termsApply(p,{years:3,bonus:900,annual:p.sal,opt:200,role:0,ntc:true},'fa',G.year,true); p.age=33;
  ovsLeave(p,'NPB','테스트',1,100,'해외 FA'); const a=G.abroad.find(x=>x.id===p.id); a.y=G.year-1; a.y1=G.year; abroadYear(); const q=G.players[p.id]; if(q&&q.retAsk)ovsBackSign(q); /* 복귀는 원소속 우선협상: 계약을 고른 뒤 */ ok(q&&q.team===a.from,'준비 실패: 복귀 안 함'); ok(!hasNtc(q)&&capBOf(q)===0,'해외 복귀 뒤 옛 계약 조건이 되살아남'); });

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

T('[감사] 외국인 재계약 기간의 신규 영입은 재계약 조건까지 합쳐 한도를 본다',()=>{ fresh(); simTo(()=>G.contract&&!G.contract.done&&G.contract.foreignEnd&&G.day>=KD(12,2)); { const C0=G.contract; let g=0; while(C0.foreignEnd.filter(id=>G.players[id]&&G.players[id].foreign==='용병').length<2&&g++<4){ const q=newForeign('용병',{}); q.team=G.user; q.sal=q.ask||30000; q.newSal=q.sal; initPers(q); C0.foreignEnd.push(q.id); } } /* 시즌 중 교체·방출로 용병이 모자랄 수 있어 재계약 대상을 채운다 */ const C=G.contract; const f=fReCapInfo();
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
  const cap=capOf(sponSeason()); { let k=0; while(capPay(G.user)>=cap-300&&k++<40){ const q=L[k%L.length]; q.sal=Math.max(MIN_SAL,Math.round(q.sal*.7)); } } /* 세계에 따라 창단 직후 이미 상한을 넘는 경우가 있어 먼저 상한 아래로 맞춘다 */ const pay0=capPay(G.user); ok(pay0<cap,'준비 실패: 이미 상한 초과'); const need=cap-pay0+500; L.slice(0,5).forEach(p=>{ p.newSal=p.sal+Math.ceil(need/5); });
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

T('외국인 후보 조사 단계: 여러 세계의 추정 범위가 실제 능력을 대부분 담고 관찰이 쌓이면 좁아진다',()=>{ fresh();
  let n=0,hit=0,w0=0,w1=0; const sample=()=>{ const L=Object.values(G.players).filter(p=>p.foreign&&p.team==null); ok(L.length>=20,'준비 실패: 후보 '+L.length); for(const p of L){G.fwatch=[];const a=fScout(p);n++;if(dvo(p)>=a.lo&&dvo(p)<=a.hi)hit++;w0+=a.hi-a.lo;G.fwatch=[{id:p.id,k:100}];const b=fScout(p);w1+=b.hi-b.lo;ok(b.n>=a.n,'관찰했는데 조사 단계 하락');}G.fwatch=[]; };
  sample(); const resume=globalThis.__rngState(), world=G;
  try{ for(const seed of [101,211,307,401]){globalThis.__seed(seed);fresh();sample();} }finally{G=world;globalThis.__seed(resume);}
  console.log('  외국인 후보 범위 검증: '+hit+'/'+n+'명 · '+Math.round(hit/n*100)+'%'); ok(hit/n>=.7,'5개 세계 추정 범위 안에 든 후보 '+Math.round(hit/n*100)+'%');ok(w1<w0*.75,'관찰 후 범위가 25% 이상 좁아지지 않음'); });

T('외국인 예상 능력순: 기록·MLB 경력·스카우트를 합친 예상이 스카우트 평가 하나보다 실제 실력을 잘 고르고, 트리플A·MLB 출신을 앞에 둔다',()=>{ fresh(); const L=[]; for(let i=0;i<300;i++){ const p=newForeign('용병',{market:true}); const rp=scoutReport(p); L.push({p,rp,f:fScout(p,rp)}); }
  const top=(a,k)=>[...a].sort(k).slice(0,20); const mean=a=>a.reduce((s,x)=>s+ovr(x.p),0)/a.length;
  const A=top(L,(a,b)=>b.f.score-a.f.score); const cor=(f)=>{ const xs=L.map(f), ys=L.map(x=>ovr(x.p)); const mx=xs.reduce((s,v)=>s+v,0)/xs.length, my=ys.reduce((s,v)=>s+v,0)/ys.length; let a=0,b=0,c=0; xs.forEach((v,i)=>{ a+=(v-mx)*(ys[i]-my); b+=(v-mx)**2; c+=(ys[i]-my)**2; }); return a/Math.sqrt(b*c); };
  const c1=cor(x=>x.f.score), c0=cor(x=>x.rp.cur); ok(c1>c0,'예상 능력과 실제의 상관 '+c1.toFixed(3)+' ≤ 스카우트 평가 하나 '+c0.toFixed(3)); /* 상위 몇 명 평균은 표본에 흔들려 전체 상관으로 본다 */
  const sh=a=>a.filter(x=>['트리플A','MLB'].includes(x.p.prevLvl)).length/a.length; ok(sh(A)>=sh(L),'추천 상위의 트리플A·MLB 비중 '+Math.round(sh(A)*100)+'%가 후보 전체 '+Math.round(sh(L)*100)+'%보다 낮음');
  L.forEach(x=>delete G.players[x.p.id]); });

T('[시즌 운] 그날 컨디션·사기 같은 일시적 기세는 삼진·홈런보다 인플레이 타구 결과에 더 실린다(삼진·홈런은 실력이 빨리 드러남)',()=>{ fresh(); const p={r:{con:60,eye:55,pow:65,spd:50,stf:60,ctl:55},trt:{}}; const a=batProbs(p,0),b=batProbs(p,2),c=pitProbs(p,0),d=pitProbs(p,2); const dB=b.babip-a.babip;
  ok(a.k-b.k<dB,'타자 삼진 변화 '+(a.k-b.k).toFixed(4)+' < BABIP 변화 '+dB.toFixed(4)); ok(b.hr-a.hr<dB*.6,'타자 홈런 변화 '+(b.hr-a.hr).toFixed(4)+' < BABIP 변화의 60%'); ok(d.k-c.k<.004,'투수 삼진 변화 '+(d.k-c.k).toFixed(4)+' < .004'); });
T('[국가대표] 아시안게임: 25세 이하 또는 입단 4년 차 이하(둘 중 하나), 와일드카드 3명은 29세 이하, 구단당 1~3명, 24명(투수 11)',()=>{ fresh(); G.year=2026;
  ok(ntU25({age:27,draft:{y:2022}}),'27세라도 2023년 입단(4년 차)이면 자격'); ok(ntU25({age:24,draft:{y:2018}}),'입단 오래됐어도 25세 이하면 자격'); ok(!ntU25({age:27,draft:{y:2018}}),'26세 이상이고 5년 차 이상이면 자격 없음');
  const S=ntSquad('ag'); const ps=S.map(x=>({x,p:G.players[x.id]})); ok(S.length===24,'명단 '+S.length+'명'); ok(ps.filter(o=>o.p.isP).length===11,'투수 11명');
  const per={}; ps.forEach(o=>per[o.p.team]=(per[o.p.team]||0)+1); const cs=G.teams.map(t=>per[t.id]||0); ok(Math.max(...cs)<=3,'구단당 최대 3명: '+cs.join(',')); ok(Math.min(...cs)>=1,'구단당 최소 1명: '+cs.join(','));
  const W=ps.filter(o=>o.x.wild); ok(W.length<=3,'와일드카드 '+W.length+'명'); ok(W.every(o=>o.p.age<=29&&!ntU25(o.p)),'와일드카드는 자격 밖·29세 이하'); ok(ps.filter(o=>!o.x.wild).every(o=>ntU25(o.p)),'와일드카드 아닌 선수는 모두 자격 있음'); });
T('[국가대표] 예비 명단 → 최종 명단 → 소집 기간엔 소속 팀에서 빠지고 → 금메달이면 미필 선수 병역 특례 → 복귀',()=>{ fresh(); G.year=2026;
  G.day=KD(4,15); ntDaily(G.day); ok(G.ntPre&&G.ntPre.k==='ag'&&G.ntPre.ids.length>=40,'4월 예비 명단 '+(G.ntPre?G.ntPre.ids.length:0)+'명');
  G.day=KD(6,11); ntDaily(G.day); const N=G.nt; ok(N&&N.k==='ag'&&N.ids.length===24,'6월 최종 24명'); const inPre=N.ids.filter(id=>G.ntPre.ids.includes(id)).length; ok(inPre>=20,'최종 명단 대부분이 예비 명단에서: '+inPre);
  const sq=N.ids.map(id=>G.players[id]); const free=sq.filter(milFree); ok(free.length>0,'미필 선수 포함');
  G.day=KD(9,16); ntDaily(G.day); ok(sq.every(p=>isAway(p)),'소집 기간에는 소속 팀에서 빠짐'); ok(sq.every(p=>!playersOf(p.team).includes(p)),'팀 선수 목록에서 빠짐');
  free[0].mil={unit:'상무',from:G.day+60,until:G.day+60+MIL_DAYS}; /* 입대 예정 선수도 특례 대상 */ const r=ntResult('ag',0); ok(r==='금메달','강제 금메달'); ok(free.every(p=>p.mil&&p.mil.exempt),'미필 선수 병역 특례'); ok((G.ntHist||[]).some(x=>x.k==='ag'&&x.y===2026),'지난 대회 기록');
  G.day=KD(9,28); ntDaily(G.day); ok(sq.every(p=>!isAway(p)),'대회 끝나면 복귀'); });
T('[국가대표] 우리 선수 차출 거부: 대체 선수가 들어오고 팬·언론 여론과 선수 사기가 떨어진다. 소집 뒤에는 거부할 수 없다',()=>{ fresh(); G.year=2026; G.day=KD(6,11); ntAnnounce('ag'); const N=G.nt;
  let id=N.ids.find(x=>G.players[x].team===G.user); if(id==null){ const p=domestic(G.user).filter(q=>ntU25(q)&&ntBucket(q)==='P')[0]; const out=N.ids.find(x=>ntBucket(G.players[x])==='P'); N.ids[N.ids.indexOf(out)]=p.id; id=p.id; }
  const p=G.players[id]; prInit(); const f0=G.pr.fan, m0=p.mor??60; const msg=ntRefuse(id); ok(/거부/.test(msg),msg); ok(!N.ids.includes(id)&&N.ref.includes(id),'명단에서 빠짐'); ok(N.ids.length===24,'대체 선수로 24명 유지'); ok(G.pr.fan<f0,'팬 여론 하락'); ok((p.mor??60)<m0,'선수 사기 하락');
  const id2=N.ids.find(x=>G.players[x].team===G.user)||N.ids[0]; G.day=KD(9,16); ok(/이미|대상/.test(ntRefuse(id2)),'소집 뒤에는 거부 불가'); });
T('[국가대표] 예전 저장의 올림픽 대표 기록을 국가대표 상태로 옮긴다',()=>{ fresh(); const ids=domestic(G.user).slice(0,3).map(p=>p.id); G.oly={y:G.year,ids:ids.slice()}; G.nt=null; const N=ntState(); ok(N&&N.k==='oly'&&N.ids.length===3,'G.oly → G.nt'); });
T('[감독 관계] 감독이 정리해 달라고 한 선수를 트레이드로 보내면 "주전을 내줬다"고 반대하지 않는다(요청을 들어준 것)',()=>{ fresh(); const m=G.mgr[G.user]; m.youth=50; m.ego=50;
  const p=depth(G.user).start.map(x=>G.players[x.id]).filter(Boolean).sort((a,b)=>ovr(b)-ovr(a))[0]; ok(p&&isRegular(p),'주전 선수'); const tid=G.teams.find(t=>t.id!==G.user).id;
  const r=mreqAdd('out',{pid:p.id},G.day+30); r.st='open'; p.listed=true; const v=mgrTradeView(tid,[p.id],[]); ok(v.r>=0,'관계 변화 '+v.r+' · '+v.txt); ok(!/주전/.test(v.txt),v.txt); });
T('[캠프 결산] 첫 줄에 주목할 선수(최대 성장·예상 밖 부진·새 구종)를 먼저 보여 주고, 집계는 그 뒤에',()=>{ fresh(); campStart(); G.camp.focus='skill';
  const _cg=campGrowAll; const ps=domestic(G.user); const a=ps.find(p=>!p.isP), b=ps.find(p=>!p.isP&&p!==a), c=ps.find(p=>p.isP);
  campGrowAll=function(k,f){ const L=_cg(k,f); a.r.pow+=3; return Object.assign(L.concat([campEvLine(b,{t:'form-',k:'con',d:-1.2}),campEvLine(c,{t:'pitch',k:'슬라이더',q:-2})]),{ev:(L.ev||[]).concat([{p:b,e:{t:'form-',k:'con',d:-1.2}},{p:c,e:{t:'pitch',k:'슬라이더',q:-2}}])}); };
  try{ campEnd(); }finally{ campGrowAll=_cg; } const m=G.mail.find(x=>/스프링캠프 결산/.test(x.subj)); ok(m,'결산 소식');
  ok(/주목할 선수/.test(m.body.split('\\n\\n').slice(0,2).join('\\n')),'첫머리에 주목할 선수: '+m.body.slice(0,200));
  ok(m.body.indexOf('최대 성장')>=0&&m.body.indexOf('최대 성장')<m.body.indexOf('능력이 오른 선수'),'최대 성장이 집계보다 앞'); ok(/예상 밖 부진: /.test(m.body),'예상 밖 부진에 폼 수정 실패 선수'); ok(/새 구종: /.test(m.body),'새 구종 습득 선수'); });
T('[나이] 시작 세계에도 20대 초반 주전급이 있다(일찍 크는 선수): 새 세계 12개 평균 23세 이하 1군 평균 이상 선수와 상위 50명 안의 23세 이하',()=>{ let y=0,t50=0; const N=12; for(let r=0;r<N;r++){ DEMO.on=false; newGame(6); fdStart(); const P=(G.fd.all||G.fd.pool).map(id=>G.players[id]).filter(Boolean);
  y+=P.filter(p=>p.age<=23&&ovr(p)>=53).length/N; t50+=[...P].sort((a,b)=>ovr(b)-ovr(a)).slice(0,50).filter(p=>p.age<=23).length/N; } /* 새 세계 24개 측정: 평균 9.1명 · 7.0명(세계마다 3~18명으로 편차가 커서 12개 평균으로 본다. 8개일 때는 경기 엔진 난수 흐름만 바뀌어도 6.4로 떨어지는 세계가 있었다(24개 평균은 8.9 그대로)). 예전 세계는 5명 · 3.7명 */
  ok(y>=6.5,'23세 이하 주전급 평균 '+y.toFixed(1)+'명'); ok(t50>=4.5,'상위 50명 중 23세 이하 평균 '+t50.toFixed(1)+'명'); });
T('[창단 드래프트] 장래성(최대 예상, 사용자 2026-11-01 20:02): 지금보다 낮지 않고, 젊을수록 크며, 다 큰 선수는 지금 그대로, 24세 이하는 실제 잠재력과 맞는 방향이다',()=>{ fresh(); DEMO.on=false; newGame(6); fdStart(); const P=(G.fd.all||G.fd.pool).map(id=>G.players[id]).filter(Boolean);
  ok(typeof fdPotEst==='function','장래성 추정 함수'); const E=P.map(p=>({p,e:fdPotEst(p),s:fdSeenBy(G.user,p).sc}));
  ok(E.every(x=>x.e>=x.s-.01),'장래성이 지금 추정보다 낮음(최대치가 아님)'); const O=E.filter(x=>x.p.age>=30); ok(O.length&&O.every(x=>Math.abs(x.e-x.s)<.01),'30세 이상은 이미 전성기라 지금 추정 그대로여야 함');
  const Yg=E.filter(x=>x.p.age<=22&&x.p.pot-ovr(x.p)>=8); ok(Yg.length&&Yg.reduce((a,x)=>a+x.e-x.s,0)/Yg.length>=4,'어린 유망주의 성장 여지가 장래성에 거의 안 들어감');
  const q=P.find(x=>x.age>=30); q.team=G.user; ok(Math.abs(fdPotEst(q)-ovr(q))<.01,'우리 선수는 실제 현재 능력이 공개됐으니 다 큰 선수의 장래성은 실제 능력과 같아야 함: '+fdPotEst(q).toFixed(1)+' vs '+ovr(q).toFixed(1)); q.team=null;
  const cor=(L,f,g)=>{ const n=L.length, mx=L.reduce((a,x)=>a+f(x),0)/n, my=L.reduce((a,x)=>a+g(x),0)/n; let sxy=0,sx=0,sy=0; for(const x of L){ const dx=f(x)-mx, dy=g(x)-my; sxy+=dx*dy; sx+=dx*dx; sy+=dy*dy; } return sxy/Math.sqrt(sx*sy); };
  const Y=E.filter(x=>x.p.age<=24); const c=cor(Y,x=>x.e,x=>x.p.pot); ok(c>=.6,'24세 이하 장래성 추정과 실제 잠재력 상관 '+c.toFixed(2)); });
T('[감독 지시] 거절된 지시를 바로 다시 꺼내도 관계가 또 깎이지 않는다(관계가 5 오르거나 30일 뒤 재논의)',()=>{ fresh(); const m=G.mgr[G.user]; m.rel=60; mgrDir().arm={ok:false,mid:m.id,day:G.day,rel0:56}; m.rel=56;
  const r=setMgrDir('arm',true); ok(m.rel===56,'관계 '+m.rel); ok(/재논의/.test(r),r); ok(mgrDirWait('arm'),'버튼 대신 재논의 안내'); m.rel=61; ok(!mgrDirWait('arm'),'관계가 5 오르면 다시 지시 가능'); m.rel=56; G.day+=31; ok(!mgrDirWait('arm'),'30일 지나면 다시 지시 가능'); });
T('[2군 포수] 전문 포수가 있으면 포수 경험이 거의 없는 선수(전환 훈련 중 포함)가 매일 마스크를 쓰지 않는다',()=>{ fresh(); const d=depth(G.user); const B=d.futB.filter(healthy); const ss=B.find(p=>p.pos==='SS'||p.pos==='2B'); let cat=B.find(p=>p.pos==='C'); if(!cat&&ss){ cat=B.find(p=>p!==ss&&p.pos!=='SS'&&p.pos!=='2B'); if(cat){ cat.pos='C'; (cat.pexp=cat.pexp||{}).C=95; } } /* 세계에 따라 2군에 전문 포수가 없을 수 있어 한 명을 포수로 둔다 */ ok(cat&&ss,'준비 실패');
  ss.pconv={pos:'C',d:G.day}; (ss.pexp=ss.pexp||{}).C=2; let n=0; for(let i=0;i<9;i++){ G.day++; const ln=futLineupE(G.user,B); if(ln.C===ss)n++; } ok(n<=3,'9경기 중 전환 훈련생 포수 선발 '+n+'번'); delete ss.pconv; let m=0; for(let i=0;i<5;i++){ G.day++; const ln=futLineupE(G.user,B); if(ln.C&&ln.C.pos!=='C')m++; } ok(m===0,'전환 훈련이 아닐 때 비포수가 포수로 '+m+'번'); });
T('[기록 해설] 아마 타자 삼진·볼넷 해설은 실제 비율을 쓴다(13볼넷 98삼진을 3배 가까이라 하지 않음)',()=>{ fresh(); const p=Object.values(G.players).find(q=>!q.isP); const Y=[{pa:120,ab:110,h:30,bb:3,so:29,hr:1,d:3,tr:0},{pa:130,ab:118,h:35,bb:4,so:31,hr:2,d:4,tr:0},{pa:140,ab:126,h:40,bb:6,so:38,hr:3,d:5,tr:1}]; const am={pa:390,ab:354,h:105,bb:13,so:98,hr:6,d:12,tr:1};
  const o={amY:p.amY,am:p.am}; p.amY=Y; p.am=am; const L=amNotes(p).join(' '); p.amY=o.amY; p.am=o.am; ok(!/3배 가까이/.test(L),L); ok(/7\.5배/.test(L),'실제 비율 7.5배: '+L); });
T('[병역 추천] 지금 1군에 있는 선수에게 "1군 자리가 없어"라고 하지 않는다',()=>{ fresh(); const d=depth(G.user); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); const p=domestic(G.user).find(q=>!reg.has(q.id)&&!q.ys&&q.isP); ok(p,'준비 실패'); p.mil=null; p.age=24; p.e1=true;
  const a=milAdvice(p); ok(a.k==='go','추천 '+a.k); ok(!/1군 자리가 없어/.test(a.why),a.why); ok(/1군/.test(a.why),'지금 1군이라는 사실: '+a.why); });
T('[병역] 단장이 예약한 현역 입대는 입대일 전까지 취소할 수 있다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.ys&&q.age<=26); p.mil=null; ok(enlistNow(p.id)==='','입대 예약'); ok(p.mil&&p.mil.from>G.day,'2주 뒤 입대'); ok(enlistCancel(p.id)==='','취소'); ok(!p.mil&&milFree(p),'다시 미필'); enlistNow(p.id); G.day=p.mil.from; ok(enlistCancel(p.id)!=='','입대일이 되면 취소 불가'); });
T('[주장] 선수단 투표로 뽑는 주장은 적어도 주전급(주전·선발·필승조 또는 팀 상위 12명)이다',()=>{ fresh(); const d=depth(G.user); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); const top=new Set(domestic(G.user).filter(p=>!p.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,12).map(p=>p.id));
  const bk=domestic(G.user).filter(p=>!p.ys&&!reg.has(p.id)&&!top.has(p.id)&&p.age>=25); for(const p of bk){ p.pers=Object.assign({},p.pers||{},{pro:20,loy:20}); p.age=31; } let bad=0; for(let i=0;i<6;i++){ const c=electCaptain(G.user,'점검'+i); if(c&&!reg.has(c.id)&&!top.has(c.id))bad++; } ok(bad===0,'백업이 주장으로 '+bad+'번'); });
T('[연대기] 시설 완공과 주장 교체(사유·전임)가 구단 역사에 남는다',()=>{ fresh(); facInit(); const k=FACK.find(x=>G.fac.it[x]<3); G.fac.bld[k]={lv:G.fac.it[k]+1,done:G.day,c:100}; facDaily(); ok((G.chron||[]).some(c=>c.k==='fac'&&/완공/.test(c.t)),'시설 완공 기록');
  const t=team(G.user); const c0=electCaptain(G.user,'첫 투표'); const others=domestic(G.user).filter(p=>p.id!==c0.id); c0.injOut=30; const c1=electCaptain(G.user,'주장 부상'); const e=(G.chron||[]).filter(c=>c.k==='cap').pop(); if(c1&&c1.id!==c0.id)ok(/주장 부상/.test(e.t)&&/전임/.test(e.t),'교체 사유·전임: '+e.t); });
T('[외국인 발굴] 우리만 아는 후보가 곧 알려질 때(3일 전)와 알려졌을 때 소식이 온다',()=>{ fresh(); const p=(G.fmarket||[]).map(id=>G.players[id]).find(q=>q&&q.team==null); ok(p,'준비 실패'); p.fsrc='scout'; p.fknow=[G.user]; p.fpub=G.day+3;
  fPubDaily(); ok(G.mail.some(m=>/공개 임박/.test(m.subj)&&m.subj.includes(p.name)),'3일 전 알림'); G.day+=3; fPubDaily(); ok(G.mail.some(m=>/퍼졌습니다/.test(m.subj)&&m.subj.includes(p.name)),'공개 당일 알림'); });
T('[감독이 미는 선수] 함께 밀어주면 같은 자리 경쟁자의 기분이 내려간다(얻는 것과 포기하는 것)',()=>{ fresh(); const m=G.mgr[G.user]; const ps=playersOf(G.user).filter(p=>!p.ys&&!p.isP); const a=ps.find(p=>ps.some(q=>q!==p&&pSlot(q)===pSlot(p))); ok(a,'준비 실패'); const rival=ps.find(q=>q!==a&&pSlot(q)===pSlot(a)); rival.mor=60;
  G.mpick={y:G.year,mid:m.id,ids:[a.id]}; const e={data:{ids:[a.id]}}; EVH.mpick.pick(e,0); ok(rival.mor<60,'경쟁자 기분 '+rival.mor); });
T('[영입 경로] 창단 드래프트 자동 지명은 경로(자동)와 지명 당시 우리 추정을 남긴다',()=>{ fresh(); const L=playersOf(G.user).filter(p=>p.acq&&p.acq.k==='fd'&&!p.acq.auto); ok(L.length,'준비 실패');
  ok(L.every(p=>p.acq.how==='auto'&&p.acq.e0!=null),'경로·추정 누락 '+JSON.stringify(L[0].acq)); ok(/자동 지명/.test(originLabel(L[0].acq)),'라벨 '+originLabel(L[0].acq)); });
T('[트레이드 위임] 유망한 제안만 보고: 유리한 제안은 남기고 불리한 제안만 거절',()=>{ fresh(); autoSet('tro','good'); const tid=G.teams.find(t=>t.id!==G.user).id;
  const them=domestic(tid).filter(p=>!p.prospect), us=domestic(G.user).filter(p=>!p.prospect).sort((a,b)=>ovr(b)-ovr(a)); const mk=(id,g,w)=>({id,from:tid,give:[g.id],get:[w.id],exp:G.day+3});
  const good=them.map(g=>mk(9001,g,us[us.length-1])).sort((a,b)=>troDiff(b)-troDiff(a))[0], bad=them.map(g=>mk(9002,g,us[0])).sort((a,b)=>troDiff(a)-troDiff(b))[0]; ok(troDiff(good)>=-1&&troDiff(bad)<-1,'준비 실패 '+troDiff(good)+' '+troDiff(bad)); G.offers=[good,bad];
  ok(autoTradeOffer(good)===false&&G.offers.some(o=>o.id===9001),'유리한 제안까지 거절'); ok(autoTradeOffer(bad)===true&&!G.offers.some(o=>o.id===9002),'불리한 제안이 남음'); autoSet('tro',false); });
T('[첫걸음] 첫 승은 기록만 남기고 소식함에는 보내지 않는다',()=>{ fresh(); G.sea.rec[G.user].w=1; const n0=G.mail.length; achFirstDaily(); ok(achHas('fWin'),'첫 승 미달성'); ok(!G.mail.slice(0,G.mail.length-n0+1).some(m=>/첫 승/.test(m.subj)),'소식함으로 보냄'); });
T('[동석 관람] 경기 중 반응: 리드를 빼앗긴 순간과 뒤집은 순간에 구단주 한마디',()=>{ fresh(); const me=G.user; const b=playersOf(me).find(p=>!p.isP), o=playersOf(G.teams.find(t=>t.id!==me).id).find(p=>!p.isP);
  const g={home:me,away:-1,pbp:[[0,o.id,1,'HR',0,[0,0,0],2,2,0],[1,b.id,2,'HR',0,[0,0,0],3,2,3]]}; const L=cwLive(g,'own'); ok(L.some(z=>z.t==='lost')&&L.some(z=>z.t==='flip'),'반응 '+JSON.stringify(L)); ok(L.every(z=>z.l&&!/\{/.test(z.l)),'문구'); });
T('[캠프 구종] 결정구가 된 새 구종으로 처음 삼진을 여럿 잡으면 캠프와 이어 기록',()=>{ fresh(); const p=playersOf(G.user).find(q=>q.isP&&!q.foreign); const k=addPitch(p,25); ok(k,'준비 실패'); const rec={home:G.user,away:-1,day:G.day,box:{h:{pit:[{id:p.id,n:p.name,outs:18,er:1,so:6}]},a:{pit:[]}}};
  campPitchHit(rec); const e=p.addP.find(x=>x.k===k); ok(e.hit&&e.hit.so===6,'기록 '+JSON.stringify(e)); ok(JSON.stringify(p.story).includes(k),'선수 이야기'); });
T('[역할] 팀 내 역할 문구: 주전·선발 순번·마무리·벤치 성향',()=>{ fresh(); const d=depth(G.user); ok(d.start.every(p=>/^주전/.test(squadRole(p))),'주전'); ok(squadRole(d.sp[0])==='1선발','1선발 '+squadRole(d.sp[0])); ok(squadRole(d.pen[0])==='마무리','마무리 '+squadRole(d.pen[0])); ok(d.bench.every(p=>/대타|대주자|수비 강화|백업/.test(squadRole(p))),'벤치 '+d.bench.map(squadRole)); });
T('[역할] 출전 없는 선수의 보유 이유와 기분 vs 기회 만족',()=>{ fresh(); G.day=G.cal.open+30; G.sea.rec[G.user].w=15; G.sea.rec[G.user].l=15; const d=depth(G.user); const f=d.futB.filter(p=>!p.foreign&&!seasonTotal(p,G.year,'1군')); ok(f.length>=2,'준비 실패');
  const a=f[0]; a.injOut=0; a.mil=null; a.age=30; a.pot=ovr(a); a.pos='1B'; a.sal=100; ok(/1군 자리/.test(keepWhy(a)),'보유 이유 '+keepWhy(a));
  const b=f[1]; b.injOut=0; b.mil=null; b.age=21; b.pot=ovr(b)+12; ok(/2군에서.*키우/.test(keepWhy(b)),'육성 '+keepWhy(b));
  a.sal=800; a.mor=80; const o=oppSat(a); ok(o&&o.lv==='불만'&&/기회가 계속 없으면/.test(o.gap),'기회 만족 '+JSON.stringify(o)); });
T('[우승 기사] 연속 우승·준우승·라이벌 우승·탈락·정규시즌 1위 기사는 리그 기록의 실제 횟수를 쓴다',()=>{fresh();const me=G.user,[a,b]=G.teams.filter(t=>t.id!==me).map(t=>t.id),y=G.year;const ord=first=>[first,...G.teams.map(t=>t.id).filter(t=>t!==first)].map(tid=>({tid,w:70,l:70,t:4}));G.history=[y-3,y-2,y-1].map(k=>({y:k,order:ord(a),champ:a,runner:b}));G.news=[];G.rivalries={pairs:{[rivalPair(a,me)]:{label:'검수 더비',games:7}}};
 G.ps={res:{ks:[a,me,4,2]},done:true,champ:a,runner:me};titleNews(a,me);const t=x=>G.news.find(n=>n.t.includes(x));ok(t('4년 연속 우승')&&t('4년 연속 우승').b.includes('통산 4번째 우승이며 직전 우승은 '+(y-1)),'연속 우승 횟수 오류');const ru=t('한국시리즈 준우승');ok(ru&&ru.b.includes('2승 4패')&&ru.b.includes('1번째 준우승')&&ru.b.includes((y-3)+'년 기록 이후 아직 우승이 없습니다'),'준우승 기사 수치 오류');
 G.news=[];G.ps.res.ks=[a,b,4,0];titleNews(a,b);const rv=t('라이벌');ok(rv&&rv.b.includes('검수 더비')&&rv.b.includes('7번'),'라이벌 우승 기사 없음');
 G.news=[];psOutNews('po',[b,me,3,1]);ok(t('플레이오프에서 탈락')&&t('플레이오프에서 탈락').b.includes('1승 3패'),'탈락 기사 오류');psOutNews('ks',[a,me,4,1]);ok(!t('한국시리즈에서 탈락'),'준우승을 탈락으로 씀');
 G.news=[];const o=ord(b);o[4].w=75;o[4].l=65;const mi=o.findIndex(x=>x.tid===me);o.push(o.splice(mi,1)[0]);G.ps={order:o,res:{},seeds:o.slice(0,5).map(x=>x.tid)};psSeedNews();psSeedNews();ok(G.news.filter(n=>n.t.includes('정규시즌 1위 확정')).length===1&&t('정규시즌 1위 확정').b.includes('기록 이후 첫 정규시즌 1위'),'정규시즌 1위 기사 오류');const out=t('가을야구 탈락 확정');ok(out&&out.b.includes('5경기 뒤져'),'가을야구 탈락 기사 수치 오류');});
T('[리그 행사] 올스타 팀은 구단 식별자로 나눔·드림을 구분한다',()=>{fresh();ok(typeof allStarSide==='function','올스타 구분 없음');ok([1,2,3,7,8].every(t=>allStarSide(t)==='드림')&&[0,4,5,6,9].every(t=>allStarSide(t)==='나눔'),'구단 배정 오류');});
T('[리그 행사] 올스타는 실제 해당 시즌 기록으로 선발하며 부상·군복무·입단 예정 선수를 빼고 중복 선정하지 않는다',()=>{fresh();G.day=G.cal.asg-14;for(const p of Object.values(G.players)){if(p.team==null)continue;const h=lineFor(p,G.year,p.team,'1군');Object.assign(h,p.isP?{g:20,gs:10,outs:210,er:20,so:60,bb:15,w:6}:{g:60,pa:240,ab:210,h:65,hr:12,bb:25,rbi:40});}const p=playersOf(G.user).find(p=>!p.isP);p.injOut=10;const before=JSON.stringify(Object.values(G.players).map(p=>[p.id,p.hist,p.fat,p.armw,p.e1]));allStarDaily();const A=G.allStars[G.year],L=Object.values(A.teams).flat();ok(L.length===52&&new Set(L.map(x=>x.id)).size===52,'선정 인원·중복 오류');ok(!L.some(x=>x.id===p.id),'부상 선수 선정');ok(Object.values(A.teams).every(L=>L.filter(x=>x.starter).length===12),'베스트12 누락');ok(new Set(L.map(x=>x.t)).size===10,'구단 대표 누락');ok(before===JSON.stringify(Object.values(G.players).map(p=>[p.id,p.hist,p.fat,p.armw,p.e1])),'선정이 정규시즌 기록·피로·엔트리 변경');const n=G.news.length,aw=JSON.stringify(L.map(x=>G.players[x.id].aw));G=JSON.parse(JSON.stringify(G));allStarDaily();ok(G.news.length===n&&JSON.stringify(L.map(x=>G.players[x.id].aw))===aw,'저장 후 중복 선정·포상');});
T('[리그 행사] 올스타 발표 뒤 부상자는 실제 대체 선수로 기록하고 휴식기에는 정규 경기가 없다',()=>{fresh();G.day=G.cal.asg-14;for(const p of Object.values(G.players)){if(p.team!=null)Object.assign(lineFor(p,G.year,p.team,'1군'),p.isP?{g:20,gs:8,outs:180,er:20,so:60,w:6}:{g:60,pa:240,ab:200,h:65,hr:10});}allStarDaily();const A=G.allStars[G.year],p=G.players[A.teams.나눔[0].id];p.injOut=30;G.day=G.cal.asg-1;allStarDaily();ok(A.withdrawn.some(x=>x.id===p.id),'부상 교체 이력 없음');ok(!A.teams.나눔.some(x=>x.id===p.id)&&A.teams.나눔.length===26,'대체 선정 실패');for(let d=G.cal.asg-2;d<=G.cal.asg+1;d++)ok(!G.cal.sched[d],'휴식기 정규 경기');const n=G.news.length;allStarDaily();ok(G.news.length===n,'교체 뉴스 중복');});
T('[리그 행사] 라이벌 기사는 실제 맞대결만 집계하고 중립 뉴스·쿨다운·재실행을 지킨다',()=>{fresh();const fan=G.pr.fan,press=G.pr.press;const game={score:{h:4,a:3}};rivalAfterGame(G.day,6,7,game,false);const r=G.rivalries.pairs['6:7'];ok(r&&r.games===1&&r.close===1&&r.label==='달빛대전','달빛 맞대결 집계 누락');const n=G.news.length;rivalAfterGame(G.day,6,7,game,false);ok(r.games===1&&G.news.length===n,'같은 경기 중복');rivalAfterGame(G.day+1,7,6,game,false);ok(r.games===2&&G.news.length===n,'기사 쿨다운 미작동');ok(G.pr.fan===fan&&G.pr.press===press,'라이벌 기사에 불필요한 여론 페널티');});
T('[리그 행사] 가상 라이벌은 여러 시즌의 접전과 가을 맞대결에서 생기며 저장 후 이어진다',()=>{fresh();const d=G.day,g={score:{h:3,a:2}};for(let i=0;i<3;i++)rivalAfterGame(d+i,3,5,g,true);G.year++;for(let i=0;i<9;i++)rivalAfterGame(d+370+i,3,5,g,false);const r=G.rivalries.pairs['3:5'];ok(r.emerged&&r.games===12&&r.seasons.length===2,'역사형 라이벌이 안 생김');G=JSON.parse(JSON.stringify(G));rivalAfterGame(d+380,3,5,g,false);ok(G.rivalries.pairs['3:5'].games===13,'저장 후 역사 단절');});
T('[리그 행사] 기자 투표는 근소한 WAR 차이를 200안타·20승 기록으로 뒤집을 수 있다',()=>{fresh();const b=playersOf(G.user).find(p=>!p.isP),p=playersOf(G.user).find(p=>p.isP);const h={...ZB,g:140,pa:600,ab:550,h:200,hr:20,rbi:90,sb:5};const B=[ggCandidate({p:b,h,w:5},'1B'),ggCandidate({p:{...b,id:b.id+10000,name:'WAR 우위'},h:{...h,h:180},w:6},'1B')];ggReporterVote(B,288,1,G.year);ok(B[0].id===b.id,'200안타가 작은 WAR 차이를 뒤집지 못함');const hP={...ZB,g:30,gs:30,outs:600,er:60,so:180,w:20};const P=[ggCandidate({p,h:hP,w:5},'P'),ggCandidate({p:{...p,id:p.id+10000,name:'WAR 우위'},h:{...hP,w:19},w:6},'P')];ggReporterVote(P,288,1,G.year);ok(P[0].id===p.id,'20승이 작은 WAR 차이를 뒤집지 못함');});
T('[리그 행사] 올스타의 정규시즌 재개 안내는 실제 편성된 첫 경기 날짜와 같다',()=>{fresh();G.day=G.cal.asg;const resume=Object.keys(G.cal.sched).map(Number).filter(d=>d>G.cal.asg+1).sort((a,b)=>a-b)[0];allStarDaily();ok(G.mail.some(m=>String(m.body).includes(dmd(resume))||String(m.text).includes(dmd(resume))||String(m.subj).includes(dmd(resume))),'실제 재개 경기 날짜 안내 누락');});

T('[리그 행사] 골든글러브 기자 투표는 외야 세 명을 중복 없이 고르고 표 총수·개인 상한을 보존한다',()=>{fresh();const C=Array.from({length:5},(_,i)=>({id:i+1,name:'후보'+i,t:0,s:5-i*.2,merit:{war:5-i*.2,record:1,milestone:0,domestic:i%2,team:0},v:0}));const B=ggReporterVote(C,288,3,G.year);ok(B.length===288&&B.every(b=>b.length===3&&new Set(b).size===3),'기자별 고유 3표 아님');ok(sum(C.map(c=>c.v))===864&&C.every(c=>c.v<=288),'외야 득표 총수·상한 오류');const votes=JSON.stringify(C.map(c=>[c.id,c.v]));ggReporterVote(C,288,3,G.year);ok(JSON.stringify(C.map(c=>[c.id,c.v]))===votes,'같은 투표 재계산 결과 다름');});
T('[리그 행사] 골든글러브는 기록 이정표와 국내 선수 선호를 고려하지만 능력 원값을 읽지 않는다',()=>{fresh();const p=playersOf(G.user).find(p=>!p.isP),q=playersOf(G.user).find(p=>p.isP);const h={...ZB,g:140,pa:600,ab:550,h:200,hr:20,rbi:95,sb:5};const x={p,h,w:5};const a=ggCandidate(x,'1B');p.r.pow+=15;p.r.def+=15;const b=ggCandidate(x,'1B');ok(JSON.stringify(a.merit)===JSON.stringify(b.merit),'숨은 능력 원값에 투표가 바뀜');ok(a.merit.milestone>ggCandidate({...x,h:{...h,h:199}},'1B').merit.milestone,'200안타 이정표 미반영');const m=ggCandidate({p:q,h:{...ZB,g:30,gs:30,outs:600,er:60,so:180,w:20},w:5},'P'),n=ggCandidate({p:q,h:{...ZB,g:30,gs:30,outs:600,er:60,so:180,w:19},w:5},'P');ok(m.merit.milestone>n.merit.milestone,'20승 이정표 미반영');const foreign=ggCandidate({...x,p:{...p,foreign:'용병'}},'1B');ok(a.merit.domestic>foreign.merit.domestic&&a.merit.domestic<.5,'국내 선호 누락·과도한 가산');});
T('[리그 행사] 투표 전 유력 후보 보도는 비공개 득표를 읽지 않고 투표 진행 뉴스가 한 번만 나온다',()=>{fresh();const p=playersOf(G.user).find(p=>!p.isP),h={...ZB,g:140,pa:600,ab:550,h:200,hr:20,rbi:95,sb:5};const C=[ggCandidate({p,h,w:5},'1B'),ggCandidate({p:{...p,id:p.id+999,name:'다른 후보'},h:{...h,h:170},w:5.2},'1B')];ggReporterVote(C,288,1,G.year);const A={y:G.year,cand:{gg:{'1B':C}},gg:{},pend:{gg:true},ggVote:{voters:288,start:KD(11,25),end:KD(12,5),news:{}}};const race=JSON.stringify(ggPublicRace(A));C.reverse();C.forEach(c=>c.v=288-c.v);ok(JSON.stringify(ggPublicRace(A))===race,'보도가 비공개 득표·정렬에 의존');G.awards={[G.year]:A};G.day=KD(11,25);ggVotingDaily();const count=G.news.length;ggVotingDaily();ok(G.news.length===count&&G.news.some(x=>x.t.includes('기자단 투표')),'투표 진행 뉴스 누락·중복');ok(!awShown(A,'gg'),'투표 시작에 수상자 공개');});

T('[구종 수] 타순 세 바퀴째부터 맞기 시작하고, 구종이 많을수록 덜하다',()=>{ fresh(); const a=playersOf(G.user).filter(p=>p.isP).map(p=>({p,n:pitchN(p)})).sort((x,y)=>x.n-y.n); const lo=a[0], hi=a[a.length-1]; ok(hi.n>lo.n,'구종 수 차이 없음');
  ok(ttoPen(lo.p,10)===0,'첫 바퀴 벌점'); ok(ttoPen(lo.p,20)>ttoPen(hi.p,20)&&ttoPen(hi.p,20)>0,'구종 수 반영'); ok(ttoPen(lo.p,28)>ttoPen(lo.p,20),'네 번째 바퀴'); });
T('[감독 연장] 계약 중에도 연장할 수 있고(연봉 인상·관계 상승), 한 해 한 번이며, 관계가 나쁘면 거절한다',()=>{ fresh(); const m=G.mgr[G.user]; m.rel=60; const y0=m.yrs, s0=m.sal, r0=m.rel;
  ok(typeof extendMgr==='function','연장 기능 없음'); const r=extendMgr(2); ok(!r,'연장 실패: '+r); ok(m.yrs===y0+2&&m.sal>s0&&m.rel>r0,'연장 반영 '+[m.yrs,m.sal,m.rel]); ok(extendMgr(1),'한 해에 두 번 연장됨');
  fresh(); const m2=G.mgr[G.user]; m2.rel=20; const y2=m2.yrs; ok(/응하지 않/.test(extendMgr(1))&&m2.yrs===y2,'관계가 나쁜데 연장됨'); });
T('[코치 연장] 계약 중인 코치를 연장하면 기간이 늘고 연봉이 조금 오르며, 같은 해 다시는 못 한다',()=>{ fresh(); const C=G.coach[G.user]; C.bc=mkCoach('bc'); C.bc.yrs=1; C.bc.age=50; const c=C.bc, s0=c.sal;
  ok(typeof extendCoach==='function','연장 기능 없음'); const r=extendCoach('bc',2); ok(!r,'연장 실패: '+r); ok(c.yrs===3&&c.sal>s0,'연장 반영 '+[c.yrs,c.sal]); ok(extendCoach('bc',1),'한 해에 두 번 연장됨'); });
T('[코치 승격] 투수코치를 수석코치로 올리면 연봉이 오르고 기존 수석코치는 비는 투수코치 자리로 옮긴다',()=>{ fresh(); const C=G.coach[G.user]; C.pc=mkCoach('pc'); C.hc=mkCoach('hc'); C.pc.yrs=C.hc.yrs=2; const a=C.pc, b=C.hc, s0=a.sal;
  ok(typeof promoteCoach==='function','승격 기능 없음'); const r=promoteCoach('pc'); ok(typeof r!=='string'||!/없습니다/.test(r),'승격 실패: '+r); ok(C.hc===a&&C.pc===b&&a.role==='hc'&&b.role==='pc','보직 맞교환'); ok(a.sal>s0,'승격 연봉');
  ok(/없습니다|이미/.test(promoteCoach('hc')||''),'수석코치는 더 올라갈 자리가 없다');
  C.fp=mkCoach('fp'); C.fp.yrs=2; C.bc=null; const f=C.fp; C.fb=mkCoach('fb'); C.fb.yrs=2; const fb=C.fb; promoteCoach('fb'); ok(C.bc===fb&&C.fb==null,'2군 타격코치 → 1군 타격코치(빈자리)'); });
T('[구단 이동] 시즌 중 옮기면 최근 경기·월별 성적·상세 경기가 새 구단 것으로 바뀐다(옛 구단 경기가 섞이지 않게)',()=>{ fresh(); simTo(()=>period()==='season'&&(G.sea.ulog||[]).length>=40);
  const tid=G.teams.find(t=>t.id!==G.user).id; G.jobs=[]; jobOffer(tid,true); const r=jobAnswer(tid,true); ok(G.user===tid,'이동 실패 '+r);
  const L=G.sea.ulog||[]; ok(L.length>=30,'새 구단 기록 '+L.length); ok(L.every(x=>x.h===tid||x.a===tid),'옛 구단 경기가 남음');
  const tl=G.sea.tl[tid]; const last=L[L.length-1], z=tl[tl.length-1]; ok(last.d===z[5]&&((last.h===tid?last.hs:last.as)===z[1]),'결과·점수가 새 구단 기준'); ok(last.res===(z[0]>0?'승':z[0]<0?'패':'무'),'승패');
  ok((G.games||[]).every(g=>g.home===tid||g.away===tid),'상세 경기에 옛 구단 경기'); const mw=G.sea.months.reduce((a,o)=>a+o.w,0); ok(mw<=G.sea.rec[tid].w,'월별 성적이 새 구단 기준'); });
T('[구단 이동] 야인에게 온 제의에는 지금 구단과 작별한다는 말 대신 경력을 다시 시작한다고 쓰고, 제의에 현재 순위·연봉 상한·장기 부상·내년 연봉·구단주 성향을 적는다',()=>{ fresh(); const tid=G.teams.find(t=>t.id!==G.user).id; G.unemp={y:G.year,d:G.day}; jobOffer(tid,true); const m=G.mail[0]; G.unemp=null;
  ok(!/작별/.test(m.body)&&/다시 시작/.test(m.body),'야인 문구 '+m.body.slice(-80)); ok(typeof jobBrief==='function','제의 요약 없음'); const b=jobBrief(tid).join(' '); ok(/상한/.test(b)&&/장기 부상/.test(b)&&/내년/.test(b)&&/구단주/.test(b),'제의 요약 '+b); });
T('[야인 경력] 물러날 때 재임 구단의 마지막 시즌 결산과 사유를 경력에 보관한다',()=>{ fresh(); simTo(()=>G.year>=2027&&period()==='pre'); const tid=G.user; ok(G.last&&G.last.fins&&G.last.fins[tid],'결산 없음');
  firedFlow(G.year,'점검'); const st=G.myC.stints[0]; ok(st&&st.tid===tid&&st.how,'퇴임 기록'); ok(st.fin&&st.fin.y===G.last.y&&st.fin.f&&Array.isArray(st.fin.f.inc),'퇴임 시점 결산 보관 '+JSON.stringify(st.fin||null).slice(0,80)); });
T('[재임 성과] 내가 데려온 선수는 떠나도 재임 성과 목록에 남고, 주전 9자리 구성과 취임 당시 주전 나이를 기록한다',()=>{ fresh(); ok(G.tbSnap&&G.tbSnap.tid===G.user&&G.tbSnap.age>0,'창단 뒤 취임 당시 기록 '+JSON.stringify(G.tbSnap||null));
  const L=G.mineL||[]; ok(L.length>=20,'데려온 선수 기록 '+L.length); const p=L.map(x=>G.players[x.id]).find(q=>q&&q.team===G.user); const to=G.teams.find(t=>t.id!==G.user).id; p.team=to; ok(tbMineAll().some(x=>x.p===p&&x.gone),'떠난 선수가 목록에서 빠짐'); p.team=G.user;
  const K=tbKpi(); ok(K.comp.inh+K.comp.dr+K.comp.ext===K.ln&&K.ln>=8,'주전 구성 '+JSON.stringify(K.comp)); ok(K.age>0,'주전 평균 나이');
  const tid=G.teams.find(t=>t.id!==G.user).id; G.jobs=[]; jobOffer(tid,true); jobAnswer(tid,true); ok(G.tbSnap.tid===tid,'이직 뒤 취임 당시 기록'); });
T('[떠난 선수 기록] 리그를 떠나는 선수(은퇴·해외·방출)는 1군 시즌 기록을 보관해 나중에도 열어 볼 수 있다',()=>{ fresh(); const p=Object.values(G.players).find(q=>q.foreign&&q.hist.some(h=>h.lvl==='1군'&&(h.pa>=100||h.outs>=150))); ok(p,'준비 실패'); const id=p.id, nm=p.name;
  ok(typeof dropP==='function','보관 함수 없음'); dropP(id); ok(!G.players[id],'삭제 안 됨'); const a=G.arch&&G.arch[id]; ok(a&&a.name===nm&&a.rows.length>=1&&a.rows.every(r=>r.war!=null&&r.t!=null),'보관 '+JSON.stringify(a||null).slice(0,120));
  const q=Object.values(G.players).find(x=>x.prospect); if(q){ dropP(q.id); ok(!G.arch[q.id],'1군 기록 없는 선수까지 보관'); } });
T('[감독 야구] 스몰볼 감독은 발 빠르고 출루하는 타자를 주전 선정에서 더 쳐주고, AI 구단도 자기 감독 야구에 맞는 선수를 더 비싸게 본다',()=>{ fresh(); const m=G.mgr[G.user]; Object.assign(m,{small:85,dfn:50,pen:50,arm:50,youth:50}); ok(typeof mgrRolesOf==='function'&&mgrRolesOf(m).includes('runSPD'),'역할 '+(typeof mgrRolesOf==='function'?mgrRolesOf(m):'-'));
  const p=domestic(G.user).find(q=>!q.isP); const r0={...p.r}; Object.assign(p.r,{spd:76,eye:56}); const a=polBonus(G.user,p); Object.assign(p.r,{spd:40}); const b=polBonus(G.user,p); p.r=r0; ok(a-b>=1,'빠른 선수 기용 가산 '+a+' vs '+b);
  const t=G.teams.find(x=>x.id!==G.user); const tm=G.mgr[t.id]; Object.assign(tm,{small:20,dfn:30,pen:50,arm:50,youth:50}); const q=domestic(G.user).find(x=>!x.isP&&x.r.pow<55); const q0={...q.r}; const v1=mgrFitMul(t.id,q,'in'); Object.assign(q.r,{pow:72,con:55}); const v2=mgrFitMul(t.id,q,'in'); q.r=q0; ok(v2>v1,'빅볼 구단이 장타자를 더 쳐줌 '+v1+' '+v2); });
T('[감독 야구] 맞는 주전이 모자라면 역할 조건으로 요청하고, 그 조건을 채우는 선수를 데려오면(추천 선수가 아니어도) 들어준 것으로 본다',()=>{ fresh(); const m=G.mgr[G.user]; Object.assign(m,{small:85,dfn:50,pen:50,arm:50,youth:50}); m.rel=50; G.mreq=[]; G.mgrFitD=null;
  for(const p of domestic(G.user))if(!p.isP)p.r.spd=Math.min(p.r.spd,45); const need=mgrNeedRole(G.user); ok(need&&/^run/.test(need.k),'필요 역할 '+JSON.stringify(need));
  mreqMake('fit',need); const r=mreqs().find(x=>x.k==='fit'); ok(r,'요청 없음'); ok((r.data.cands||[]).length>=1&&r.data.cands.every(id=>roleOk(G.players[id],r.data.role)),'후보가 역할 조건을 채우지 않음');
  r.st='open'; const other=Object.values(G.players).find(p=>p.team!=null&&p.team!==G.user&&!p.foreign&&!p.ys&&roleOk(p,r.data.role)&&!r.data.cands.includes(p.id)); ok(other,'준비 실패'); other.team=G.user; acqStamp(other,'트레이드',G.user,{from:null}); mreqCheck(); ok(r.st==='done'&&m.rel>50,'조건 충족 인정 '+r.st+' '+m.rel); });
T('[단장 능력] AI 단장의 선수 보는 눈·협상력·구단 설계·재정 운영이 실제 판단을 바꾼다',()=>{ fresh(); const t=G.teams.find(x=>x.id!==G.user); const g=gmOf(t.id); ok(typeof gmAbil==='function'&&gmAbil(g)&&gmAbil(g).eye>0,'능력 없음');
  const p=Object.values(G.players).find(q=>q.team!=null&&q.team!==t.id&&!q.isP&&statLuck(q)&&Math.abs(statLuck(q).d)>=2); ok(p,'준비 실패'); g.ab.eye=90; const a=Math.abs(seenDelta(t,p)); g.ab.eye=35; const b=Math.abs(seenDelta(t,p)); ok(b>a,'눈이 좋을수록 운에 덜 속음 '+a+' '+b);
  g.ab.neg=90; const n1=tradeNeed(t,5); g.ab.neg=35; const n2=tradeNeed(t,5); ok(n1>n2,'협상력이 높을수록 더 요구 '+n1+' '+n2);
  const v=Object.values(G.players).filter(q=>!q.isP&&q.age>=31&&q.team!=null&&q.team!==t.id).sort((x,y)=>ovr(y)-ovr(x))[0]; /* 최저 연봉에 걸리지 않는 쓸 만한 노장 */ g.ab.money=90; const f1=faWorth(t,v); g.ab.money=35; const f2=faWorth(t,v); ok(f1<f2,'재정 운영이 좋으면 노장에게 덜 씀 '+f1+' '+f2); });
T('[AI 계획] AI 단장은 형편에 맞는 계획(우승 도전·전력 정비·재건)을 세우고, 재건으로 돌면 비싼 베테랑을 시장에 내놓는다',()=>{ fresh(); ok(typeof aiPlanBase==='function','계획 함수 없음');
  ok(aiPlanBase(2,27,'pr',0)==='contend'&&aiPlanBase(9,31,'pr',0)==='rebuild'&&aiPlanBase(6,28,'pr',0)==='mid'&&aiPlanBase(5,28,'win',0)==='contend','계획 판단');
  const t=G.teams.find(x=>x.id!==G.user); t.mode='contend'; const n0=domestic(t.id).filter(p=>p.aiListed).length; aiPlanApply(t,'rebuild'); ok(t.mode==='rebuild','계획 반영'); ok(domestic(t.id).filter(p=>p.aiListed).length>n0,'재건인데 매물이 없음'); ok(G.news&&G.news.some(n=>/재건/.test(n.t||'')),'재건 소식 없음'); });
T('[AI 감독 선임] 구단 설계가 좋은 AI 단장은 선수단에 맞는 감독을 고른다',()=>{ fresh(); const t=G.teams.find(x=>x.id!==G.user); ok(typeof aiMgrPick==='function','함수 없음'); gmAbil(t.gm).plan=95;
  for(const p of domestic(t.id))if(!p.isP){ p.r.spd=Math.max(p.r.spd,66); p.r.eye=Math.max(p.r.eye,60); p.r.con=Math.max(p.r.con,55); }
  const C=[mkMgr(),mkMgr(),mkMgr(),mkMgr()]; C.forEach((m,i)=>{ Object.assign(m,{small:i===2?88:30,dfn:50,pen:50,arm:50,youth:50,fame:50}); delete m.ty; }); const m=aiMgrPick(t,C); ok(m===C[2],'맞는 감독을 고르지 않음 '+C.indexOf(m)); });
T('[국가대표] 병역 특례가 걸린 올림픽·아시안게임은 같은 실력이면 미필 선수를 먼저 뽑는다(올스타처럼 에이스만 가지 않게)',()=>{ fresh(); ok(typeof ntMilB==='function'&&ntMilB('oly')>0&&ntMilB('wbc')===0,'미필 가산');
  const sq=ntSquad('oly').map(x=>G.players[x.id]); const share=L=>L.filter(p=>milFree(p)).length/L.length; const top=ntPool().sort((a,b)=>ovr(b)-ovr(a)).slice(0,24); ok(share(sq)>share(top)+.1,'미필 비율 '+share(sq).toFixed(2)+' vs 실력순 '+share(top).toFixed(2)); });
T('[가을야구] 단기전은 총력전: 탈락 위기면 에이스가 3일 쉬고 선발로 나오고, 최종전 접전에는 선발 에이스가 불펜으로 나온다',()=>{ fresh(); const tid=G.user; const d=depth(tid); const sp=[...d.sp].sort((a,b)=>spV(b)-spV(a)); ok(sp.length>=4,'준비 실패'); const day=G.day+40;
  sp.forEach(p=>p.lastStart=day-1); sp[0].lastStart=day-3; sp[sp.length-1].lastStart=day-5; /* 정규시즌이면 5일 쉰 하위 선발 차례 */ const a=pickStarter(tid,d,day,{elim:true}); ok(a===sp[0],'탈락 위기에 3일 쉰 에이스가 아님: '+(a&&a.name));
  const b=pickStarter(tid,d,day,null); ok(b!==sp[0],'정규시즌에는 3일 쉬고 나오지 않음');
  const fs={tid,sp:sp[2],spAll:d.sp,used:new Set([sp[2].id])}; sp[0].lastStart=day-4; sp[0].lastApp=day-4; ok(typeof psAceRelief==='function'&&psAceRelief(fs,8,1,day,{fin:true})===sp[0],'최종전 접전 에이스 불펜'); ok(!psAceRelief(fs,8,1,day,null),'정규시즌에는 안 함'); });
T('[구단 사정] 다른 구단도 기강이 느슨하면 사고가 나고, 기회 없는 주전급은 불만 끝에 트레이드를 요청해 매물로 나오며 우리 소식함에도 온다',()=>{ fresh(); ok(typeof aiDisc==='function'&&typeof aiGripe==='function','함수 없음'); simTo(()=>period()==='season'); const t=G.teams.find(x=>x.id!==G.user);
  const m=G.mgr[t.id]; m.disc=20; t.cap=null; G._cl=null; let n=0; for(let i=0;i<300&&!(G.wire||[]).some(w=>w.k==='구단 사정'&&w.tid===t.id);i++){ G._cl=null; aiDisc(t); } ok((G.wire||[]).some(w=>w.k==='구단 사정'&&w.tid===t.id&&/징계/.test(w.t)),'느슨한 구단인데 사고가 없음');
  const d=depth(t.id); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); const p=domestic(t.id).find(q=>!q.isP&&!reg.has(q.id)&&!q.ys); ok(p,'준비 실패'); for(const k in p.r)p.r[k]=Math.max(p.r[k],70); p.e1=false; if(typeof isRegular==='function'){} p.mor=10; G._dc=null;
  const n0=G.mail.length; for(let i=0;i<40&&!p.aiListed;i++){ p.gripeY=null; aiGripe(t); } ok(p.aiListed&&p.aiWhy==='mood','트레이드 요청 매물 아님'); ok(G.mail.length>n0&&G.mail.slice(0,G.mail.length-n0).some(x=>/트레이드 요청/.test(x.subj)),'소식함에 안 옴'); });
T('[트레이드 비교] 선발을 보내면 선발 평가가 오르지 않고, 빠지는 선발·대신 들어갈 후보·선발 인원 변화를 따로 보여 준다',()=>{ fresh(); const L=rosterList(G.user).filter(p=>p.isP&&isSPr(p)&&healthy(p)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,4); ok(L.length===4,'준비 실패');
  const s0=posStrength(L).SP, s1=posStrength(L.slice(0,3)).SP; ok(s1<s0,'선발 4명에서 1명을 빼는데 평가 '+s0+'→'+s1);
  ok(typeof spSwap==='function','spSwap 없음'); const g=L[3]; const tid=G.teams.find(t=>t.id!==G.user).id; const x=spSwap(tid,[g.id],[]); ok(x&&x.out.some(o=>o.p.id===g.id)&&x.n1===x.n0-1,'빠지는 선발·인원 변화 없음'); });
T('[병역 조언] 시즌 초에는 몇 경기 안 된 출전 기록 대신 보직·앞선 선수로 설명한다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+2);
  const tg=(r=>r.w+r.l+(r.t||0))(G.sea.rec[G.user]); ok(tg<20,'준비 실패 '+tg); let a=null, p=null;
  for(const q of domestic(G.user).filter(q=>milFree(q)&&q.age>=23&&q.age<=26).sort((x,y)=>ovr(x)-ovr(y))){ q.e1=true; G._dc=null; const r=milAdvice(q); if(r.k==='go'){ a=r; p=q; break; } }
  ok(a,'상무 추천 대상 없음'); ok(!/올해 1군 \\d+경기/.test(a.why),'적은 표본으로 판단: '+a.why); ok(/보직|주전|기용 순서/.test(a.why),'보직 근거 없음: '+a.why); });
T('[드래프트] 같은 투수의 최고 구속은 어디서나 같고, 기록과 반대인 관찰 의견은 근거 부족을 밝히며, 미래는 상한 전망과 확신으로, 위험도는 원인을 나눈다',()=>{ fresh(); ok(typeof amVmax==='function'&&typeof draftView==='function'&&typeof riskWhy==='function','함수 없음');
  const p=Object.values(G.players).find(q=>q.prospect&&q.isP&&q.am&&q.am.outs>=90); ok(p,'준비 실패'); p.amVelo=133; ok(amVmax(p)===133,'최고 구속 불일치');
  p.am.bb=Math.round(p.am.outs/27*7.5); const rp0=scoutReport(p); const rp=Object.assign({},rp0,{tools:rp0.tools.map(t=>t.k==='ctl'?Object.assign({},t,{cur:78}):t)}); const v=draftView(p,rp);
  ok(/기록/.test(v.obs)&&/근거/.test(v.obs),'기록과 반대인데 설명 없음: '+v.obs); ok(rp.ofp==null||/상한/.test(v.fut)&&/확신/.test(v.fut),'성장 전망 표현: '+v.fut);
  p.amInj='토미 존 수술(2학년)'; ok(riskWhy(p,rp).some(x=>/건강/.test(x)),'건강 위험 원인 없음'); p.amInj=null; });
T('[면담] 고민 묻기는 다른 이야기를 막지 않고, 방금 진 경기를 성격대로 알아들으며, 면담 내용이 남는다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+3);
  const g=G.games.find(x=>x.home===G.user||x.away===G.user); ok(g,'경기 없음'); g.day=G.day; const me=g.home===G.user?'h':'a'; const B=g.box[me]; const x=B.pit[B.pit.length-1]; const p=G.players[x.id]; ok(p,'투수 없음');
  x.er=4; x.d='패'; initPers(p); p.pers.temp=5; p.pers.amb=10; p.tk={}; p.talkWk=null;
  const r1=talk(p.id,'ask'); ok(/만회/.test(r1.msg),'방금 경기를 모름: '+r1.msg);
  const r2=talk(p.id,'praise'); ok(!/이미/.test(r2.msg),'고민 묻기 뒤 칭찬이 막힘: '+r2.msg);
  const r3=talk(p.id,'push'); ok(/이미/.test(r3.msg),'칭찬 뒤 같은 주 분발 촉구가 또 됨');
  const r4=talk(p.id,'ask'); ok(!/이미/.test(r4.msg)&&!r4.d,'고민 묻기는 다시 할 수 있고 기분은 한 주에 한 번만');
  ok((p.talkLog||[]).length>=2&&p.talkLog[0].a,'면담 기록 없음'); });
T('[코치] 코치는 세부 능력이 있고, 제구 훈련은 담당 코치의 제구 지도가 성장 속도를 바꾸며, 은퇴 선수는 선수 시절 강점이 지도 강점이 된다',()=>{ fresh(); ok(typeof cAb==='function'&&typeof trnCoachV==='function','함수 없음');
  const c=mkCoach('pc'); ok(c.ab&&c.ab.ctl!=null&&c.ab.yng!=null,'세부 능력 없음');
  const c2=JSON.parse(JSON.stringify(c)); c2.ab.ctl=c.ab.ctl+20; ok(trnCoachV(c2,G.user,'ctl')>trnCoachV(c,G.user,'ctl'),'제구 지도가 훈련에 안 들어감');
  const p=Object.values(G.players).find(q=>q.team!=null&&q.isP&&!q.foreign&&q.age>=30); ok(p,'준비 실패'); p.r.ctl=78; p.r.stf=40; p.r.sta=50; const ob=obFromPlayer(p,{war:20,seasons:12}); ok(ob,'OB 없음'); const a=cAb(obCoach(ob)); ok(a.ctl>a.stf+5,'제구 좋던 투수인데 제구 지도가 높지 않음: '+a.ctl+'/'+a.stf); });
T('[훈련 보고] 집중 훈련 성과는 시작일·시작 당시 등급·지금 등급·다음 등급까지를 보여 주고, 코치 평가와 실전 확인을 나눈다',()=>{ fresh(); const p=domestic(G.user).find(q=>q.isP&&q.age<=26&&!q.ys); ok(p,'준비 실패'); trnSet(p.id,'ctl'); const T=G.trn[p.id]; T.since=G.day-84; T.base.ctl=p.r.ctl-1.2;
  const o=trnObs(p); ok(o&&o.since===T.since&&o.g0&&o.g1&&o.next!=null,'시작·현재 등급 없음'); ok(typeof o.real==='string'&&/기록/.test(o.real),'실전 확인 없음: '+o.real); });
T('[감독 지시] 투수 보호 요청을 처음 거절당해도 관계(선수단 경기력)가 바로 떨어지지 않고, 같은 해 반복되면 그때 떨어진다',()=>{ fresh(); const m=G.mgr[G.user]; mgrAttr(m); m.arm=95; m.ego=95; let ref=false;
  for(let i=0;i<80&&!ref;i++){ delete mgrDir().arm; G.dirFr=null; m.rel=50; setMgrDir('arm',true); ref=!mgrDir().arm.ok; } ok(ref,'거절 재현 실패'); ok(m.rel===50,'첫 거절에 관계가 바로 떨어짐: '+m.rel);
  let ref2=false; for(let i=0;i<80&&!ref2;i++){ mgrDir().arm={ok:false,mid:m.id,day:G.day-31,rel0:50}; G.dirFr={y:G.year,mid:m.id,arm:1}; /* 충돌 횟수는 감독마다(mid) */ m.rel=50; setMgrDir('arm',true); ref2=!mgrDir().arm.ok; } ok(ref2,'두 번째 거절 재현 실패'); ok(m.rel<50,'반복 거절인데 관계 변화 없음'); });
T('[위임] 스태프 빼가기를 맡겨도 별 4개 이상이라도 기존 연봉의 1.5배를 넘는 조건이면 단장 승인을 받는다',()=>{ fresh(); stInit(); const s=(G.scouts||[]).find(x=>x.skill>=1); ok(s,'준비 실패'); s.skill=4; const tid=G.teams.find(t=>t.id!==G.user).id; G.stRaid=[{id:s.id,k:'sc',tid,sal:round5(s.sal*2),d:G.day}]; G.auto=G.auto||{}; G.auto.raid=true; const sal0=s.sal;
  autoRaid(); ok(s.sal===sal0&&(G.stRaid||[]).some(r=>r.id===s.id),'한도를 넘는 인상인데 운영팀이 바로 붙잡음'); });
T('[데이터 보고] 월간 전력 분석 보고에 득실·피타고리안·최근 흐름·백분위 상하위가 붙고, 통계 화면으로 이어 준다',()=>{ fresh(); simTo(()=>period()==='season'&&((G.sea.tl||[])[G.user]||[]).length>=12); ok(typeof dataLines==='function','함수 없음'); ok(anaList().length>0,'분석원 없음');
  const n0=G.mail.length; dataReport(dobj(G.day).m); const m=G.mail.find(x=>x.from==='전력분석팀'&&/전력 분석 보고/.test(x.subj)); ok(G.mail.length>n0&&m,'보고가 안 옴'); ok(/피타고리안/.test(m.body)&&/최근 10경기/.test(m.body)&&/백분위/.test(m.body),'내용 부족'); ok(m.acts.some(a=>a.v==='league:stat'),'통계 연결 없음'); });
T('[기록 시스템] 투수 상대 타자 수, 좌우 상대 기록, 우리 선수 경기별 기록이 쌓인다',()=>{ fresh(); simTo(()=>period()==='season'&&((G.sea.tl||[])[G.user]||[]).length>=15); const y=G.year;
  const pp=playersOf(G.user).filter(p=>p.isP).map(p=>({p,h:seasonTotal(p,y,'1군')})).find(x=>x.h&&x.h.outs>=30); ok(pp,'준비 실패'); ok((pp.h.bf||0)>=pp.h.outs/3,'상대 타자 수 없음');
  const bq=playersOf(G.user).filter(p=>!p.isP).map(p=>({p,h:seasonTotal(p,y,'1군')})).find(x=>x.h&&x.h.pa>=40); ok(bq,'타자 준비 실패'); const S=bq.p.spl; ok(S&&S.y===y,'좌우 기록 없음'); const n=(S.L?S.L[0]:0)+(S.R?S.R[0]:0); ok(n<=bq.h.pa&&n>=bq.h.pa-8,'좌우 타석 합이 맞지 않음: '+n+'/'+bq.h.pa);
  const gl=bq.p.gl; ok(gl&&gl.y===y&&gl.g.length===bq.h.g,'경기별 기록 수가 출장 경기와 다름: '+(gl&&gl.g.length)+'/'+bq.h.g); });
T('[타구 모델] 인플레이 타구는 유형·방향이 먼저 정해지고 그 자리 야수의 수비가 안타를 가른다(땅볼형 투수는 땅볼, 타자는 방향별 기록이 쌓임)',()=>{ fresh(); ok(typeof bipMix==='function'&&typeof bipResolve==='function','함수 없음');
  const b=playersOf(G.user).find(q=>!q.isP), p=playersOf(G.teams.find(t=>t.id!==G.user).id).find(q=>q.isP); const keep=p.r; const g0=bipMix(b,p).GB; const id0=p.id; const hn0=hn; ok(g0>.25&&g0<.62,'땅볼 비율 범위: '+g0);
  const fsA={cur:p,order:[],posOf:{}}; const ss=playersOf(G.teams.find(t=>t.id!==G.user).id).find(q=>!q.isP); fsA.order=[ss]; fsA.posOf[ss.id]='SS';
  const run=v=>{ const d0=ss.r.def; ss.r.def=v; let h=0,n=0; globalThis.__seed(99); for(let i=0;i<6000;i++){ const o=bipResolve(b,p,.30,{d2:.2,d3:.02},{x2:1},fsA); if(LBIP&&LBIP.pos==='SS'){ n++; if(o!=='OUT')h++; } } ss.r.def=d0; return h/Math.max(1,n); };
  const lo=run(35), hi=run(80); ok(hi<lo-.03,'유격수 수비가 좋아도 유격수 방향 땅볼 안타가 줄지 않음: '+lo.toFixed(3)+' → '+hi.toFixed(3));
  simTo(()=>period()==='season'&&((G.sea.tl||[])[G.user]||[]).length>=10); const q=playersOf(G.user).filter(x=>!x.isP&&x.spr&&x.spr.y===G.year).sort((a,b)=>sum(Object.values(b.spr.z||{}).map(x=>x[0]))-sum(Object.values(a.spr.z||{}).map(x=>x[0])))[0]; ok(q&&Object.keys(q.spr.z||{}).length>=3,'방향별 타구 기록 없음'); });
T('[구장] 담장이 가깝고 낮은 구장은 홈런이 늘고, 멀고 높은 구장은 줄며(높은 담장은 2루타로), 리그 평균 구장은 1에 가깝다',()=>{ fresh(); ok(typeof parkHRM==='function'&&typeof stadDim==='function','함수 없음');
  const ms=G.teams.map(t=>(parkHRM(t.id,'R')+parkHRM(t.id,'L'))/2); const avgM=ms.reduce((a,b)=>a+b,0)/ms.length; ok(Math.abs(avgM-1)<.03,'리그 평균 구장 지수가 1이 아님: '+avgM.toFixed(3));
  const S=stadOf(G.teams[0].id); const keep=JSON.stringify(stadDim(G.teams[0].id)); S.dim={lf:94,cf:118,rf:94,wl:2,wc:2,wr:2}; const m1=parkHRM(G.teams[0].id,'R'); S.dim={lf:104,cf:127,rf:104,wl:5,wc:5,wr:5}; const m2=parkHRM(G.teams[0].id,'R'); S.dim=JSON.parse(keep); ok(m1>1.15&&m2<.85,'담장 거리·높이가 홈런에 반영되지 않음: '+m1.toFixed(2)+' / '+m2.toFixed(2));
  simTo(()=>period()==='season'&&((G.sea.tl||[])[G.user]||[]).length>=8); const e=(G.sea.tl[G.user]||[])[0]; ok(e&&e.length>=8,'경기 기록에 홈런 수가 없음'); });
T('[창단 지명] 역할 표기는 능력 수준과 맞는다(사용자 2026-11-01 20:02: 현재 71인 선발이 장래 로테이션 후보): 표시 69 이상 주전급은 후보·경쟁으로 적지 않고, 높을수록 역할이 내려가지 않는다',()=>{ fresh(); ok(typeof fdRole==='function','fdRole 없음');
  const inv=d=>{ let lo=20,hi=78; for(let i=0;i<40;i++){ const m=(lo+hi)/2; if(dvRaw(m)<d)lo=m; else hi=m; } return (lo+hi)/2; };
  const sp=Object.values(G.players).find(p=>isSPr(p)), rp=Object.values(G.players).find(p=>p.isP&&!isSPr(p)), bt=Object.values(G.players).find(p=>!p.isP&&p.pos==='SS');
  for(const p of [sp,rp,bt]){ const L=[50,57,60,64,66,70,72,77,81,86].map(d=>fdRole(p,inv(d)));
    for(let i=5;i<L.length;i++)ok(!/후보|경쟁|2군|백업/.test(L[i]),(p.isP?(isSPr(p)?'선발':'불펜'):'유격수')+' 표시 '+[50,57,60,64,66,70,72,77,81,86][i]+'인데 '+L[i]);
    const rk=L.map(r=>FD_ROLE_RANK(r)); for(let i=1;i<rk.length;i++)ok(rk[i]>=rk[i-1],'높은 능력의 역할이 더 낮음: '+L[i-1]+' → '+L[i]); }
});
T('[리그 분포] 연봉 축은 그 시즌 연봉을 쓴다: 기록이 생길 때 그해 연봉을 남기고, 나중에 연봉이 바뀌어도 지난 시즌 값은 그대로, 기록 없는 해는 비운다(사용자 문서 2026-11-01 20:06)',()=>{ fresh(); ok(typeof salOfY==='function','salOfY 없음');
  simTo(()=>period()==='season'&&((G.sea.tl||[])[G.user]||[]).length>=5); const y=G.year; const p=playersOf(G.user).find(q=>q.hist.some(h=>h.y===y&&h.lvl==='1군')); ok(p,'기록 있는 선수 없음');
  ok(p.salYr&&p.salYr[y]===p.sal,'그해 연봉 기록 없음'); const s0=p.sal; p.sal=s0+5000; ok(salOfY(p,y)===s0,'연봉이 바뀌자 이번 시즌 값도 바뀜: '+salOfY(p,y)+' vs '+s0); p.sal=s0;
  ok(salOfY(p,y-5)==null,'기록 없는 해에 지금 연봉을 붙임');
});
T('[분석 문구] ERA−FIP·BABIP·기대 홈런 차이를 운·불운·반등으로 단정하지 않고, 함께 볼 요인(수비·타구 특성·주력·표본)을 적는다(리뷰 2026-11-01 21:12)',()=>{ DEMO.on=false; newGame(6); fdStart(); const y=G.fd.y-1;
  const BAD=/운이 따름|운이 따른|불운|운이 없었|반등 여지|반등 후보|반등을 기대할 만|운 좋았|운이 좋았|타율에 운이 섞|운이 섞여|운의 도움/;
  const P=Object.values(G.players).filter(p=>p.fdPool); const T=[]; for(const p of P){ try{ T.push(fdDataLine(p,y)); }catch(e){} try{ T.push(...statNotes(p)); }catch(e){} try{ T.push(...((scoutReport0(p)||{}).notes||[])); }catch(e){} }
  try{ const M=fdDataAll(); for(const id in M){ const d=M[id]; if(d&&d.luck)T.push(d.luck.join(' ')); } }catch(e){}
  const bad=T.filter(x=>BAD.test(String(x))); ok(!bad.length,'단정 문구 '+bad.length+'건: '+bad.slice(0,3).join(' / '));
  const fip=T.filter(x=>/FIP보다/.test(String(x))), bab=T.filter(x=>/BABIP/.test(String(x))&&/높|낮/.test(String(x)));
  ok(fip.length&&fip.every(x=>/수비|타구/.test(x)),'ERA−FIP 문구에 수비·타구 결과 언급 없음: '+(fip[0]||'(문구 없음)')); ok(bab.length&&bab.every(x=>/타구|주력|표본/.test(x)),'BABIP 문구에 타구 특성·주력·표본 언급 없음: '+(bab[0]||'(문구 없음)'));
  ok(!BAD.test(String(statNotes))&&!BAD.test(String(amNotes))&&!BAD.test(String(scoutReport0)),'선수 메모 함수에 단정 문구가 남음'); });
T('[구단 로고] 플레이어가 구단 로고(상징·색·글자·이미지)를 바꿀 수 있고, 잘못된 값은 거절하며, 기본으로 되돌릴 수 있다(사용자 2026-11-01 21:15)',()=>{ fresh(); ok(typeof setTeamLogo==='function','setTeamLogo 없음'); const t=G.teams[3];
  ok(setTeamLogo(3,{emb:'별'})===''&&t.logo&&t.logo.emb==='별','상징 바꾸기 실패'); ok(setTeamLogo(3,{emb:'없는상징'})!=='','없는 상징을 받아들임');
  ok(setTeamLogo(3,{c1:'#123456'})===''&&tpal(3)[0]==='#123456','주색이 구단 색(tpal)에 반영되지 않음'); ok(setTeamLogo(3,{c1:'red;x'})!=='','잘못된 색을 받아들임');
  ok(setTeamLogo(3,{code:'ab1'})===''&&t.logo.code==='AB1','글자는 대문자 3자까지'); ok(setTeamLogo(3,{code:'<s>'})!=='','글자에 기호를 받아들임');
  const png='data:image/png;base64,'+'A'.repeat(200); ok(setTeamLogo(3,{img:png})===''&&t.logo.img===png,'이미지 로고 저장 실패'); ok(setTeamLogo(3,{img:'javascript:alert(1)'})!==''&&t.logo.img===png,'이미지가 아닌 주소를 받아들임'); ok(setTeamLogo(3,{img:'data:image/png;base64,'+'A'.repeat(90000)})!=='','너무 큰 이미지를 받아들임');
  ok(setTeamLogo(3,{img:null})===''&&!t.logo.img,'이미지 지우기 실패'); ok(JSON.parse(JSON.stringify(t)).logo.emb==='별','저장 형식(JSON)으로 남지 않음');
  setTeamLogo(3,null); ok(!t.logo&&tpal(3)[0]===TPAL[t.code][0],'기본 로고로 되돌리지 못함'); });
T('[진행 멈춤] 멈춤 조건은 위임과 따로 고른다: 계약·등록·규정은 항상 멈추고, 스폰서·언론·부상 등은 끄면 소식만 오고 진행은 안 멈추며, 일반 소식은 기본으로 멈추지 않는다(리뷰 2026-11-01 21:12 5번)',()=>{ fresh(); ok(typeof stopCat==='function'&&typeof stopOn==='function'&&typeof evStops==='function','멈춤 조건 함수 없음');
  const M=(f,k,subj,acts)=>({from:f,kind:k,subj,acts:acts||[]});
  const C=[[M('마케팅팀','스폰서','스폰서 제안 2건',[1]),'spon'],[M('홍보팀','언론','[인터뷰 요청] 야구일보',[1,2]),'press'],[M('팀 닥터 · 의무팀','부상','누가 이탈합니다',[1]),'inj'],[M('운영팀','결정','훈련 지각',[1,2,3]),'squad'],[M('감독실','결정','감독: 선발진 보강 요청',[1,2]),'mgr'],[M('구단주실','결정','구단주의 초대',[1,2]),'owner'],
    [M('운영팀','FA','우리 FA에게 먼저 제안',[1,2]),'must'],[M('운영팀','연봉','연봉 계약 마감일입니다',[1]),'must'],[M('운영팀','병역','상무 지원 기간입니다',[1]),'must'],[M('구단주실','구단주','구단주 주문',[1]),'must'],[M('비서 서하린','일정','내일 개막합니다',[]),'info'],[M('홍보팀','기록','골든글러브 시상식',[1]),'info'],[M('운영팀','트레이드','트레이드 제안',[1,2]),'trade']];
  for(const [m,c] of C)ok(stopCat(m)===c,m.subj+' → '+stopCat(m)+' (기대 '+c+')');
  G.stopCfg={}; ok(!stopOn({kind:'일정',from:'비서 서하린',subj:'x'}),'일반 소식이 기본으로 멈춤'); ok(stopOn({kind:'스폰서',from:'마케팅팀',subj:'x'}),'스폰서는 기본으로 멈춰야 함(지금까지와 같게)');
  for(const [k] of STOP_CATS)if(k!=='must')G.stopCfg[k]=false; const n0=G.stops.length; const sp=mail('마케팅팀','스폰서 제안 9건','본문',{imp:true,kind:'스폰서',acts:[{l:'보기'}]});
  ok(G.stops.length===n0&&G.mail.includes(sp)&&sp.imp&&!sp.read,'끈 분류인데 진행을 멈추거나 소식이 사라짐'); const fa=mail('운영팀','연봉 계약 마감일입니다','본문',{imp:true,kind:'연봉'}); ok(G.stops.includes(fa),'계약 마감은 설정과 상관없이 멈춰야 함');
  const e={mid:sp.id}; ok(!evStops(e),'끈 분류의 결정이 진행을 멈춤'); ok(evStops({mid:fa.id}),'필수 결정이 진행을 안 멈춤'); G.stopCfg.spon=true; ok(evStops(e),'다시 켜도 안 멈춤'); G.stopCfg={}; });
T('[트레이드 전력표] 예상 주전은 한 선수를 한 자리에만 배치하고, 다포지션 선수를 보내면 두 자리 손실이 그대로 드러난다(리뷰 2026-11-01 22:35 1번)',()=>{ fresh(); ok(typeof posStarters==='function','posStarters 없음');
  const L=rosterList(G.user); const S=posStarters(L); const ids=FIELDK.map(k=>S.who[k]&&S.who[k].id).filter(x=>x!=null); ok(ids.length===new Set(ids).size,'같은 선수가 두 자리 이상: '+FIELDK.map(k=>k+'='+(S.who[k]?S.who[k].name:'-')).join(' '));
  for(const k of FIELDK){ const p=S.who[k]; if(p)ok(canAt(p,k),p.name+'은(는) '+k+'를 못 하는데 배치됨'); }
  const ps=posStrength(L); for(const k of FIELDK)ok(ps[k]===(S.who[k]?S.val[k]:null),'전력표 '+k+' 값이 예상 주전 배치와 다름');
  const multi=L.find(p=>!p.isP&&healthy(p)&&FIELDK.filter(k=>canAt(p,k)).length>=2&&FIELDK.some(k=>S.who[k]===p)); if(multi){ const a=posStrength(L), b=posStrength(L.filter(p=>p!==multi)); const tot=x=>FIELDK.reduce((s,k)=>s+(x[k]||0),0); ok(tot(b)<=tot(a),'주전을 보냈는데 야수 합계가 늘어남'); ok(posSwapTxt(L,L.filter(p=>p!==multi)).indexOf(multi.name)>=0,'빠지는 주전 이름이 변화 설명에 없음'); }
  ok(typeof posSwapTxt==='function'&&/빠짐|들어감|그대로/.test(posSwapTxt(L,L.filter(p=>p!==S.who.SS))),'야수 주전 변화 설명 없음'); });
T('[장기 기록] 은퇴(목록에서 빠진) 선수의 트레이드 이후 WAR은 보관 기록으로 계속 센다 · 우리 구단 출신·우리 트레이드 선수는 보관 한도로 지우지 않는다(리뷰 2026-11-01 23:00 ②④)',()=>{ fresh(); const y0=G.year; simTo(()=>period()==='season'&&((G.sea.tl||[])[G.user]||[]).length>=40);
  const p=playersOf(G.user).find(q=>!q.isP&&seasonTotal(q,G.year,'1군')&&seasonTotal(q,G.year,'1군').pa>=80); ok(p,'기록 있는 선수 없음'); const tr={y:G.year,d:G.day-30,with:1,gi:[p.id],go:[],snap:{}}; G.trades=(G.trades||[]).concat([tr]);
  const w0=tradeReport(tr).got; ok(Math.abs(w0)>0.01,'WAR이 0이라 점검 불가'); dropP(p.id); ok(!G.players[p.id],'목록에서 빠지지 않음'); const w1=tradeReport(tr).got; ok(Math.abs(w1-w0)<0.15,'은퇴 뒤 트레이드 WAR 바뀜: '+w0.toFixed(1)+' → '+w1.toFixed(1));
  const A=G.arch; const keep=Object.assign({},A); for(let i=0;i<950;i++)A['zz'+i]={id:'zz'+i,name:'x',rows:[{y:2020,t:3,war:1}]}; const q=playersOf(G.user).find(x=>x.hist.some(h=>h.lvl==='1군'&&h.t===G.user&&((h.pa||0)+(h.outs||0))>0)&&x.id!==p.id); ok(q,'우리 선수 없음'); dropP(q.id);
  ok(!!G.arch[q.id],'보관 한도 때문에 우리 구단 출신 기록이 지워짐'); ok(!!G.arch[p.id],'우리 트레이드 선수 기록이 지워짐'); ok(Object.keys(G.arch).length<=Math.max(900,Object.keys(G.arch).filter(id=>archKeep(G.arch[id])).length+900),'보관 한도가 아예 없어짐'); G.arch=keep; G.arch[p.id]=G.arch[p.id]||null; });
T('[구단 기여·계약] 구단 기여는 우리 구단에서 낸 기록만 · 다음 시즌 시작 다년계약도 확정 잔여 보장액에 넣는다(리뷰 2026-11-01 23:00 ①③)',()=>{ fresh(); ok(typeof clubWar==='function','clubWar 없음'); simTo(()=>period()==='season'&&((G.sea.tl||[])[G.user]||[]).length>=30);
  const p=Object.values(G.players).find(q=>!q.isP&&q.team!=null&&q.team!==G.user&&seasonTotal(q,G.year,'1군')&&seasonTotal(q,G.year,'1군').pa>=100); const y=G.year; const full=warOf(seasonTotal(p,y,'1군'),p); p.team=G.user; p.hist.push(Object.assign({y,t:G.user,lvl:'1군'},ZB,{pa:40,ab:38,h:9,bb:2,so:8,g:10})); const c=clubWar(p,G.user); const ours=warOf(seasonTotalT(p,y,'1군',G.user),p);
  ok(c.ys.length===1&&Math.abs(c.w-ours)<0.05&&Math.abs(full)>0.3,'이전 구단 기록이 구단 기여에 들어감: '+c.w.toFixed(1)+' (우리 구단 '+ours.toFixed(1)+' · 시즌 전체 '+full.toFixed(1)+')');
  const q=playersOf(G.user).find(x=>!x.foreign&&!x.faC&&!x.extNext); q.extNext={annual:1000,years:4}; ok(typeof guarLeft==='function'&&guarLeft(q)>=4000,'다음 시즌 시작 다년계약 보장액 누락: '+(typeof guarLeft==='function'?guarLeft(q):'함수 없음')); });
T('[위임·옵션] 국내 연봉만 맡겨도 외국인 결정이 끝났으면 자동 확정하고, 남은 외국인 결정이 있으면 이유를 남긴다 · 옵션 달성 기준은 계약 때 보직으로 고정(리뷰 2026-11-01 23:07)',()=>{ fresh(); ok(typeof fRePending==='function'&&typeof delegStatus==='function','함수 없음');
  const f=foreignOf(G.user)[0]; ok(f,'외국인 없음'); G.auto=Object.assign({},G.auto||{},{sal:true,fre:false}); G.contract={y:G.year,tid:G.user,ended:[],foreignEnd:[f.id],foreignDrop:[],released:[],done:false,fre:{}}; f.newSal=f.sal;
  autoConfirm(); ok(!G.contract.done,'외국인 결정이 남았는데 확정함'); ok(/외국인/.test(delegStatus('sal')),'대기 이유가 없음: '+delegStatus('sal'));
  G.contract.fre[f.id]={ok:true}; autoConfirm(); ok(G.contract.done,'외국인 재계약을 직접 끝냈는데 국내 연봉 자동 확정이 안 됨'); ok(/완료/.test(delegStatus('sal')),'완료 상태가 없음: '+delegStatus('sal'));
  const sp=playersOf(G.user).find(p=>p.isP&&isSPr(p)&&!p.foreign); termsApply(sp,{years:2,annual:sp.sal,opt:500},'fa'); ok(sp.opt&&sp.opt.c==='sp','옵션에 계약 때 기준이 저장되지 않음'); sp.role='RP';
  const keep=sp.hist; sp.hist=[Object.assign({y:G.year,t:G.user,lvl:'1군'},ZP,{outs:240,g:40})]; ok(!optEarned(sp),'선발 계약(120이닝)인데 불펜으로 바뀌자 80이닝으로 옵션 달성'); sp.hist=keep; });
T('[밸런스] 규정 타석 wRC+ 분포가 실제 KBO 비율에 가깝다(2026 KBO 1위 175·5위 149·10위 140·20위 125·30위 110, 사용자 2026-11-01 22:37·22:58)',()=>{ fresh(); const y0=G.year; simTo(()=>G.year>y0); const R=[]; for(const p of Object.values(G.players)){ if(p.isP)continue; const h=seasonTotal(p,y0,'1군'); if(!h||h.pa<446)continue; R.push(wrcPlus(h,y0)); } R.sort((a,b)=>b-a);
  const at=i=>R[Math.min(R.length-1,i)]; ok(R.length>=40,'규정 타석 '+R.length+'명'); ok(at(4)<=170,'5위 '+at(4)+'(KBO 149)'); ok(at(9)<=158,'10위 '+at(9)+'(KBO 140)'); ok(at(19)>=110&&at(19)<=140,'20위 '+at(19)+'(KBO 125)'); ok(at(R.length-3)>=25,'규정 타석 하위권이 너무 낮음: '+R.slice(-3).join('/'));
  const E=Object.values(G.players).filter(p=>p.isP).map(p=>seasonTotal(p,y0,'1군')).filter(h=>h&&h.outs>=432).map(h=>h.er*27/h.outs).sort((a,b)=>a-b); ok(E.length>=12,'규정 이닝 '+E.length+'명'); ok(E[0]>=1.1,'평균자책점 1위 '+E[0].toFixed(2)+'(KBO 1위는 해마다 1.9~2.7 안팎)'); ok(E[4]>=2.3,'평균자책점 5위 '+E[4].toFixed(2)); });
T('[리뷰 11-02] 국가대표 차출 중에도 연봉 합계·샐러리캡·구단 선수 수는 그대로이고, 경기 출전 명단에서만 빠진다(군 복무는 지급 제외 유지)',()=>{ fresh(); const p=domestic(G.user).filter(q=>!isRookie(q)).sort((a,b)=>b.sal-a.sal)[0]; const b={pay:payroll(G.user),cap:capPay(G.user),n:rosterN(G.user),nx:capPayNext(G.user)};
  p.ntFrom=G.day; p.ntAway=G.day+10; ok(!playersOf(G.user).includes(p),'차출 선수가 출전 가능 명단에 남음');
  ok(payroll(G.user)===b.pay,'국내 연봉 합계 '+b.pay+' → '+payroll(G.user)); ok(capPay(G.user)===b.cap,'샐러리캡 산정액 '+b.cap+' → '+capPay(G.user)); ok(capPayNext(G.user)===b.nx,'내년 산정액이 바뀜'); ok(rosterN(G.user)===b.n,'구단 선수 수 '+b.n+' → '+rosterN(G.user));
  delete p.ntAway; delete p.ntFrom; p.mil={from:G.day,until:G.day+500}; ok(payroll(G.user)===b.pay-p.sal,'군 복무 선수 연봉이 빠지지 않음'); delete p.mil; });
T('[리뷰 11-02] 다음 시즌부터 시작하는 다년계약도 방출 정산금(남은 보장액 50%)에 들어가고, 확인창 금액과 실제 지출이 같다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.faC&&!q.extNext&&!isRookie(q)); p.extNext={annual:1000,years:4}; const c=relCost(p);
  ok(c.cur===0&&c.next===2000&&c.tot===2000,'정산금 계산 '+JSON.stringify(c)); const s0=G.spend.rel||0; releasePlayer(p.id); ok((G.spend.rel||0)-s0===2000,'실제 지출 '+((G.spend.rel||0)-s0)+'(2000이어야 함)');
  const q=domestic(G.user).find(x=>x.faC&&(x.yrs||0)>=1); if(q){ const c2=relCost(q); ok(c2.cur===Math.round(q.sal*q.yrs*.5),'현재 다년 계약 정산금이 달라짐'); } });
T('[리뷰 11-02] 내년 연봉은 한 계산(salNext)으로: 합의한 다음 시즌 다년계약이 내년 샐러리캡 산정에 반영된다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.faC&&!q.extNext&&!isRookie(q)&&q.sal<=150); const b=capPayNext(G.user);
  p.extNext={annual:1000,years:4}; ok(salNext(p)===1000,'salNext '+salNext(p)); ok(capPayNext(G.user)>b,'내년 산정액이 그대로 '+b+' → '+capPayNext(G.user)); });
T('[리뷰 11-02] 은퇴 선수 보관 기록: 비율 기록은 현역과 같은 계산(희생번트 타석 차이로 OPS가 바뀌지 않음), 0이라 빠진 칸은 0으로 되살린다(무자책 ERA NaN)',()=>{ fresh();
  const h={y:2025,t:G.user,lvl:'1군',g:120,pa:520,ab:440,h:140,d:30,tr:2,hr:25,bb:60,so:90,sf:5,sh:15}; const r={y:2025,t:G.user}; for(const k of ARCH_K)if(h[k])r[k]=h[k];
  ok(Math.abs(archLine(r).ops-bRate(h).ops)<1e-9,'보관 OPS '+archLine(r).ops.toFixed(3)+' ≠ 현역 '+bRate(h).ops.toFixed(3));
  const pr={y:2025,t:G.user,g:3,outs:15}; const e=archLine(pr).era; ok(e===0,'무자책 5이닝 ERA '+e); });
T('[이름·등번호] 같은 구단 안에서 등번호가 겹치지 않고, 이름·등번호를 고칠 수 있으며 겹치는 번호·영구결번·잘못된 값은 막는다(사용자 2026-11-01 23:49)',()=>{ fresh();
  for(const t of G.teams){ const L=Object.values(G.players).filter(p=>p.team===t.id).map(jno); ok(new Set(L).size===L.length,tshort(t.id)+' 등번호 겹침 '+L.length+'명 중 '+new Set(L).size+'개'); ok(L.every(n=>n>=0&&n<=99),'0~99 밖 등번호'); }
  const [a,b]=playersOf(G.user); ok(setPlayerNo(a.id,String(jno(b))).includes(b.name),'겹치는 등번호가 저장됨'); const free=[...Array(100).keys()].find(n=>!teamNos(G.user).has(n)); ok(setPlayerNo(a.id,String(free))===''&&jno(a)===free,'빈 번호 저장 실패');
  ok(setPlayerNo(a.id,'100')!==''&&setPlayerNo(a.id,'ab')!=='','잘못된 등번호가 저장됨'); G.retNos=[{name:'전설',no:(free+1)%100,y:2020}]; if(!teamNos(G.user,a).has((free+1)%100)||G.retNos.length)ok(/영구결번/.test(setPlayerNo(a.id,String((free+1)%100))),'영구결번 번호가 저장됨');
  ok(setPlayerName(a.id,'  홍 길동 ')===''&&a.name==='홍 길동','이름 저장 실패: '+a.name); ok(setPlayerName(a.id,'')!==''&&setPlayerName(a.id,'가'.repeat(13))!=='','빈 이름·긴 이름이 저장됨'); setPlayerName(a.id,'<b>x</b>'); ok(!/[<>]/.test(a.name),'꺾쇠가 이름에 남음');
  const t2=G.teams.find(t=>t.id!==G.user).id; const q=playersOf(t2)[0]; a.no=jno(q); a.team=t2; const L2=Object.values(G.players).filter(p=>p.team===t2).map(jno); ok(new Set(L2).size===L2.length,'옮긴 팀에서 등번호가 겹침'); });
T('[리뷰 11-02b] 보상선수 자동 보호: 같은 스토브리그(12월→1월)에 계약한 FA는 해가 바뀌어도 보호되고, 막 지명한 신인(입단 예정)도 1월에 보호된다',()=>{ fresh(); const [p,q]=domestic(G.user).filter(x=>!x.draft||x.draft.y<G.year-1);
  G.day=KD(12,20); ok(stoveY()===G.year,'12월 스토브리그 연도 '+stoveY()); p.lastFA=stoveY(); q.draft={y:G.year,rd:1,no:3,tid:G.user}; ok(autoProt(p)&&autoProt(q),'12월에 보호 안 됨');
  G.year++; G.day=KD(1,5); ok(stoveY()===G.year-1,'1월 스토브리그 연도 '+stoveY()+'(직전 시즌이어야 함)'); ok(autoProt(p),'해가 바뀌자 같은 겨울 FA 보호가 풀림'); ok(autoProt(q),'1월에 막 지명한 신인 보호가 풀림'); ok(!compPool(G.user).some(x=>x===p||x===q),'보상선수 후보에 들어감'); G.year--; });
T('[리뷰 11-02b] AI 샐러리캡 정리도 트레이드 거부권을 지킨다(우리가 맡던 구단이 AI로 넘어가도 계약은 유효)',()=>{ fresh(); const tid=G.user; const keep=G.user; const L=domestic(tid).filter(p=>!isRookie(p)&&p.sal>=150); L.forEach(p=>{ p.ctT=p.team; p.ntc=G.year+2; });
  G.user=G.teams.find(t=>t.id!==tid).id; L.forEach(p=>p.sal=Math.max(p.sal,2500)); aiCapFix(tid); const moved=L.filter(p=>p.team!==tid); G.user=keep; ok(!moved.length,'거부권 선수가 정리됨: '+moved.map(p=>p.name).join(',')); ok(L.every(p=>p.ntc>=G.year),'거부권 정보가 지워짐'); });
T('[리뷰 11-02b] 역할 약속은 약속한 보직으로 확인한다: 선발 보장인데 마무리면 불이행, 필승조 보장인데 선발이면 불이행, 주전 보장은 주전 배치',()=>{ fresh(); const p=domestic(G.user).find(x=>x.isP); const b=domestic(G.user).find(x=>!x.isP);
  const r={k:0,t:'SP',l:'선발 로테이션 보장'}; ok(!promKept(p,r,{start:[],sp:[],pen:[p]}),'선발 보장인데 마무리를 지킨 것으로 봄'); ok(promKept(p,r,{start:[],sp:[p],pen:[]}),'선발인데 불이행');
  const r2={k:0,t:'RP',l:'필승조 보장'}; ok(!promKept(p,r2,{start:[],sp:[p],pen:[]}),'필승조 보장인데 선발을 지킨 것으로 봄'); ok(promKept(p,r2,{start:[],sp:[],pen:[{id:-1},p]}),'셋업인데 불이행');
  ok(promKept(b,{k:0,l:'주전 보장'},{start:[b],sp:[],pen:[]})&&!promKept(b,{k:0,l:'주전 보장'},{start:[],sp:[],pen:[]}),'주전 보장 판정(옛 저장: 종류 없음)'); ok(promKept(p,{k:0,l:'선발 로테이션 보장'},{start:[],sp:[p],pen:[]})&&!promKept(p,{k:0,l:'선발 로테이션 보장'},{start:[],sp:[],pen:[p]}),'옛 저장 문구로 종류를 못 읽음'); });
T('[리뷰 11-02b] FA 재자격: 선수 계약 설명·보유 가능 기간(장기 연봉표·계획)이 같은 시즌 수를 쓴다',()=>{ fresh(); const p=domestic(G.user).find(x=>!x.faC&&!x.extNext&&!x.foreign); p.svc=faSvc(p)+1; p.lastFA=ctSeason()-2;
  const m=+(ctText(p).match(/([0-9]+)시즌 뒤 FA/)||[])[1]; ok(m===3,'계약 설명 '+ctText(p)); ok(ctrlYears(p)===m,'보유 가능 기간 '+ctrlYears(p)+' ≠ 설명 '+m); p.lastFA=null; ok(ctrlYears(p)===1&&/올 시즌 뒤|다음 시즌 뒤/.test(ctText(p)),'재자격 없는 선수 '+ctrlYears(p)+' '+ctText(p)); });
T('[리뷰 11-02b] 드래프트 성적표: 지명 선수가 은퇴해도 보관 기록으로 WAR를 그대로 센다(구단별 순위 유지)',()=>{ fresh(); const p=Object.values(G.players).filter(x=>x.team!=null&&!x.foreign&&careerOf(x).war>=1).sort((a,b)=>careerOf(b).war-careerOf(a).war)[0]; ok(p,'준비 실패: WAR 있는 선수 없음'); const y=2019; p.draft={y,rd:1,no:1,tid:p.team};
  G.dlog=G.dlog||{}; G.dlog[y]=[{id:p.id,nm:p.name,t:p.team,rd:1,no:1,pos:posLabel(p)}]; const w0=draftClass(y).find(x=>x.id===p.id).war, g0=JSON.stringify(draftGrades(y).map(x=>x.t));
  dropP(p.id); const w1=(draftClass(y).find(x=>x.id===p.id)||{}).war||0; ok(Math.abs(w1-w0)<=.3,'은퇴 전 '+w0.toFixed(2)+' → 은퇴 후 '+w1.toFixed(2)); ok(JSON.stringify(draftGrades(y).map(x=>x.t))===g0,'구단별 드래프트 순위가 바뀜'); });
T('[리뷰 11-02b] 전역하는 해 연봉: 복무 기간을 뺀 몫(전역일 기준)을 미리 잡고, 전역 뒤에도 그해 금액이 바뀌지 않는다',()=>{ fresh(); const p=domestic(G.user).find(x=>!x.faC&&!isRookie(x)); p.sal=1000; G.day=KD(3,1); p.mil={from:G.day-300,until:KD(7,1)};
  const f=payFrac(p,G.year), want=(dnum(G.year+1,1,1)-KD(7,1))/(dnum(G.year+1,1,1)-dnum(G.year,1,1)); ok(Math.abs(f-want)<1e-9,'올해 지급 비율 '+f.toFixed(3)+'(전역일 기준 '+want.toFixed(3)+')'); const a=capInfo(G.user).all;
  G.day=KD(7,5); const b2=capInfo(G.user).all; ok(a===b2,'전역 전 '+a+' → 전역 후 '+b2+'(같아야 함)'); ok(payFrac(p,G.year+1)===1,'다음 해 비율'); });
T('[리뷰 11-02b] 스폰서 중도 해지: 해지 전까지 지난 몫은 결산에 남고 남은 몫만 취소, 해지 날짜·사유는 이력에 남는다',()=>{ fresh(); simTo(()=>period()==='season'); sponInit(); const S=G.spon; const slot='helmet'; delete S.c[slot]; G.day=G.cal.open-5;
  sponSign({slot,co:'시험상사',ind:'금융',amt:1000,yrs:3,id:'t1'},true); const full=sponIncome(G.year); G.day=Math.round((G.cal.open+G.cal.end)/2); sponCancel(slot,'팬 여론 악화'); const half=sponIncome(G.year)-(full-1000);
  ok(half>=450&&half<=550,'해지 뒤 올해 남은 수입 '+half+'(지난 몫 약 500이어야 함)'); ok(sponOpen(slot),'해지한 자리에 새 계약을 못 함'); ok((S.cutL||[]).some(x=>x.co==='시험상사'&&x.cut&&x.cut.d===G.day&&/팬 여론/.test(x.cut.why)),'해지 기록이 없음'); ok(sponIncome(G.year+1)<=full-1000+1e-9,'내년 몫이 남음');
  const r=sponSettle(G.year,null); ok(r.L.join(' ').includes('시험상사')||r.base>=half,'결산에 해지 전 몫이 없음'); ok(S.hist.some(x=>x.co==='시험상사'&&x.cut),'결산 뒤 이력에 해지 계약이 없음'); });
T('[리뷰 11-02c] 자책점: 실책이 없었다고 보고 이닝을 다시 세운다(삼진 1아웃 → 실책 출루 → 2점 홈런이면 홈런 타자 득점은 자책)',()=>{ fresh(); simTo(()=>period()==='season'); const day=G.cal.open+20, T=G.teams.map(t=>t.id); let cases=0, bad=0, er=0, r=0;
  for(let i=0;i<500;i++){ const h=T[i%10], a=T[(i*3+1)%10]===h?T[(i+1)%10]:T[(i*3+1)%10]; for(const q of Object.values(G.players))q.fat=0; const g=simGame(day+(i%3),h,a,true); const eN={};
    for(const row of (g.pbp||[])){ if(typeof row[1]!=='number')continue; const hf=row[0]; if(row[3]==='OUT'&&row.length>9&&row[9])eN[hf]=(eN[hf]||0)+1; if(row[3]==='HR'&&row.length>11){ const e=eN[hf]||0; if(e>0&&row[4]+e<3){ cases++; if(!(row[11]||[]).length)bad++; } } }
    for(const k of ['h','a'])for(const id of g.S[k].pitchers){ const x=g.S[k].box.get(id); er+=x.er||0; } r+=g.score.h+g.score.a; }
  ok(cases>=3,'준비 실패: 실책 뒤 홈런 '+cases+'건'); ok(bad===0,'실책 뒤(재구성 3아웃 전) 홈런 '+cases+'건 중 '+bad+'건이 전부 비자책'); ok(er<=r&&er>=r*.75,'자책 '+er+' / 실점 '+r); });
T('[리뷰 11-02c] 좌우 상대 기록 합계가 박스스코어(시즌 기록) 타석·타수·안타와 같다(번트·희생플라이 포함)',()=>{ fresh(); simTo(()=>period()==='season'); for(const k in G.mgr)if(G.mgr[k])G.mgr[k].small=95; const y=G.year; simTo(()=>G.day>=G.cal.open+20); let n=0; const bad=[];
  for(const q of Object.values(G.players)){ if(q.isP)continue; const h=seasonTotal(q,y,'1군'); if(!h||!h.pa)continue; const S=q.spl&&q.spl.y===y?q.spl:{}; const L=S.L||[0,0,0], Rr=S.R||[0,0,0]; n++; for(const [i,k] of [[0,'pa'],[1,'ab'],[2,'h']]){ if(L[i]+Rr[i]!==(h[k]||0))bad.push(q.name+' '+k+' '+(L[i]+Rr[i])+'≠'+h[k]); } }
  ok(n>=100,'준비 실패 '+n); ok(!bad.length,'좌우 합계 불일치 '+bad.length+'건: '+bad.slice(0,3).join(', ')); });
T('[리뷰 11-02c] 시즌 WAR의 포지션: 자리별 타석 비율로 계산하고(마지막 출전 자리로 시즌 전체를 보지 않음), 경기마다 자리별 타석이 쌓인다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP); const base={y:G.year-1,t:G.user,lvl:'1군',pa:500,ab:440,h:130,d:25,tr:2,hr:15,bb:50,so:90,sf:5};
  const wSS=warRaw(Object.assign({},base,{pos:'SS'}),p), wDH=warRaw(Object.assign({},base,{pos:'DH'}),p), w=warRaw(Object.assign({},base,{pos:'DH',pp:{SS:480,DH:20}}),p); ok(Math.abs(w-(.96*wSS+.04*wDH))<1e-9,'가중 WAR '+w.toFixed(3)+' (유격 '+wSS.toFixed(3)+'·지명 '+wDH.toFixed(3)+')');
  const keep=p.hist; p.hist=[Object.assign({},base,{y:G.year,pp:{SS:300},pos:'SS'}),Object.assign({},base,{y:G.year,t:otherT(),pp:{DH:40},pos:'DH'})]; const st=seasonTotal(p,G.year,'1군'); ok(st.pos==='SS'&&st.pp.SS===300&&st.pp.DH===40,'시즌 합계 대표 자리 '+st.pos); p.hist=keep;
  simTo(()=>period()==='season'); simTo(()=>G.day>=G.cal.open+6); let n=0, bad=0; for(const q of Object.values(G.players)){ if(q.isP)continue; for(const h of q.hist){ if(h.y!==G.year||h.lvl!=='1군'||!h.pa)continue; n++; const t=Object.values(h.pp||{}).reduce((a,b)=>a+b,0); if(t!==h.pa)bad++; } } ok(n>50&&!bad,'자리별 타석 합이 타석과 다름 '+bad+'/'+n); });
T('[리뷰 11-02c] 시즌 중 떠난 선수의 기록도 팀·리그 합계에 남는다(보관 기록 포함)',()=>{ fresh(); simTo(()=>period()==='season'); simTo(()=>G.day>=G.cal.open+15); const y=G.year; const q=Object.values(G.players).find(x=>!x.isP&&x.foreign&&x.team!=null&&(seasonTotal(x,y,'1군')||{}).pa>=20); ok(q,'준비 실패');
  const tot=t=>y1Rows(y).filter(z=>!z.isP&&z.h.t===t).reduce((a,z)=>a+(z.h.ab||0),0); const t=q.team, a0=tot(t), w0=lgBat(y,'1군').woba; dropP(q.id); _lgbC={k:'',m:{}}; ok(tot(t)===a0,'팀 타수 '+a0+' → '+tot(t)); ok(Math.abs(lgBat(y,'1군').woba-w0)<1e-9,'리그 wOBA가 바뀜'); });
T('[리뷰 11-02c] 이직 후 돌아와도 스폰서 계약이 그대로이고, 이미 떠난 해외 연수는 옛 구단에서 마무리된다',()=>{ fresh(); sponInit(); const S=G.spon; const k='helmet'; delete S.c[k]; sponSign({slot:k,co:'유지상사',ind:'금융',amt:700,yrs:3,id:'t2'},true); const c0=JSON.stringify(S.c[k]); const old=G.user;
  const p=domestic(G.user).find(ovsElig); G.ovs=[{pid:p.id,prog:'us',go:true}]; G.ovsAi=G.ovsAi||{y:G.year,fall:{},abl:{},us:{},jpl:{}}; const nt=otherT(); switchTeam(nt); ok(!(G.ovs||[]).some(x=>x.pid===p.id),'옛 구단 연수가 새 구단 목록에 남음'); ok((G.ovsAi.us[old]||[]).includes(p.id),'떠난 연수가 옛 구단으로 넘어가지 않음');
  ok(!G.spon||!G.spon.c||!G.spon.c[k]||G.spon.c[k].co!=='유지상사','옛 구단 스폰서가 새 구단에 따라옴'); switchTeam(old); ok(G.spon&&JSON.stringify(G.spon.c[k])===c0,'돌아왔는데 스폰서 계약이 복원되지 않음'); });
T('[리뷰 11-02c] 연수 출발일에 소속·복무·부상을 다시 확인한다: 다른 구단으로 간 선수는 출발하지 않고 참가비를 돌려받으며 동행 비용도 붙지 않는다',()=>{ fresh(); G.day=dnum(G.year,11,20); G.spend.dev=0; const p=domestic(G.user).find(ovsElig); ok(setOvs(p.id,'us')===''||(G.ovs||[]).some(x=>x.pid===p.id),'준비 실패: 예약 안 됨'); const s1=G.spend.dev; p.team=otherT();
  tabDaily(dnum(G.year,12,1)); ok(!(G.ovs||[]).some(x=>x.pid===p.id),'다른 구단 선수가 출발함'); ok(G.spend.dev===s1-OVS.us.c,'비용 '+G.spend.dev+'(참가비 환불·동행비 없음이어야 함: '+(s1-OVS.us.c)+')'); });
T('[리뷰 11-02c] 캠프 중 이직하면 새 구단 캠프를 합류 시점 기준으로 이어받는다(옛 구단 훈련 방향·비교 기록이 따라오지 않음)',()=>{ fresh(); G.camp={focus:'skill',done:false,snap:campSnap()}; const nt=otherT(); switchTeam(nt); ok(G.camp&&G.camp.focus==='balance'&&G.camp.join===G.day,'캠프 상태 '+JSON.stringify(G.camp&&{f:G.camp.focus,j:G.camp.join}));
  const ids=Object.keys(G.camp.snap).map(Number); ok(ids.length>20&&ids.every(id=>G.players[id]&&G.players[id].team===G.user),'비교 기록이 새 구단 선수가 아님'); });
T('[리뷰 11-02d] 처리 실패 시 비용·신뢰·제안 상태가 바뀌지 않는다: 거부권으로 실패한 트레이드는 구단주 승인 신뢰 비용을 물지 않는다',()=>{ fresh(); simTo(()=>period()==='season'); G.day=G.cal.open+10; const t=team(G.user); t.trust=60; const ot=otherT(); const mine=domestic(G.user).find(p=>!p.foreign&&!isRookie(p)), th=domestic(ot).find(p=>!p.foreign);
  mine.ctT=mine.team; mine.ntc=G.year+2; G.offers=[{id:'nt1',from:ot,give:[th.id],get:[mine.id],exp:G.day+7,day:G.day}]; const oc0=tradeOwnerCheck; tradeOwnerCheck=()=>({ok:true,over:300,msg:''}); let r; try{ r=answerOffer('nt1',true); }finally{ tradeOwnerCheck=oc0; }
  ok(r&&!r.ok&&/거부권/.test(r.msg),'거부권 실패가 아님: '+JSON.stringify(r)); ok(t.trust===60,'실패한 거래인데 구단주 신뢰 60 → '+t.trust); ok(mine.team===G.user&&th.team===ot,'선수가 움직임'); });
T('[리뷰 11-02d] 확인창이 실제 실행과 같은 계산: 연봉조정 중 선수는 구단안/선수안으로 나눠 보이고, 확정 결과는 둘 중 하나다',()=>{ fresh(); const ps=domestic(G.user).filter(p=>!isRookie(p)&&!p.faC).slice(0,3); const [a,b,c]=ps; a.newSal=a.sal+50; b.newSal=b.sal; c.newSal=c.sal;
  G.contract={y:G.year,tid:G.user,ended:ps.map(p=>p.id),foreignEnd:[],foreignDrop:[],released:[],done:false,neg:{[b.id]:{st:'arb',arb:{club:200,player:1000},ask:1000,off:200}}};
  const V=confirmPreview(); ok(V.arb.length===1&&V.arb[0].club===200&&V.arb[0].player===1000,'조정 선수가 따로 안 보임'); ok(!V.fix.some(x=>x.p===b),'조정 선수가 확정 금액으로 섞임'); ok(V.fix.find(x=>x.p===a).to===a.newSal,'합의 선수 금액 다름');
  confirmContracts(); ok(b.sal===200||b.sal===1000,'조정 결과 '+b.sal+'(구단안 또는 선수안이어야 함)'); ok(a.sal===V.fix.find(x=>x.p===a).to,'확정 금액이 미리보기와 다름'); });
T('[리뷰 11-02d] 육성선수는 다년계약을 맺을 수 없다(정식 등록 먼저) — 계약 뒤에도 육성선수 조건(1억 이하·FA·다년 아님)이 깨지지 않는다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.faC&&!q.extNext&&q.sal<=100&&q.age<=30&&!q.prospect); p.ys=true; ok(!canExtend(p),'육성선수에게 다년계약 제안이 열림');
  const r=offerExtension(p.id,3000,4,false); ok(!r.ok&&!p.extNext&&!p.faC,'육성선수가 다년계약을 맺음: '+JSON.stringify(r).slice(0,80)); });
T('[리뷰 11-02d] 계약금 지급 연도: 합의 때 바로 나가는 계약금은 지금 결산 연도로, 연봉은 계약 적용 시즌마다 따로 적는다',()=>{ fresh(); simTo(()=>period()==='season'); const s0=G.year+1; const L=ctCashYears({annual:500,years:3,bonus:300},s0);
  ok(JSON.stringify(L.map(x=>[x.y,x.v]))===JSON.stringify([[G.year,300],[s0,500],[s0+1,500],[s0+2,500]]),'연도별 현금 '+JSON.stringify(L.map(x=>[x.y,x.v]))); });
T('[리뷰 11-02d] 감독 정산금: 연장 비교(sev0)·재정 화면·경질이 같은 계산(약속 위반 2회면 절반)',()=>{ fresh(); const m=G.mgr[G.user]; m.sal=200; m.yrs=3; m.plv=[{y:G.year},{y:G.year}]; m.interim=false; const sp=mgrSevPay(m); ok(sp.brk&&sp.pay===Math.round(200*2.5*.5),'정산금 '+sp.pay);
  const T1=mgrExtTerms(1); ok(!T1||T1.sev0===sp.pay,'연장 화면 지금 정산금 '+(T1&&T1.sev0)+' ≠ '+sp.pay); const s0=G.spend.mgr||0; fireMgr(); ok((G.spend.mgr||0)-s0===sp.pay,'실제 경질 지출 '+((G.spend.mgr||0)-s0)); });
T('[리뷰 11-02d] AI 매물: 트레이드 거부권 선수는 매물로 올리지 않는다(동의 절차가 없어 데려올 수 없음)',()=>{ fresh(); simTo(()=>period()==='season'); G.day=G.cal.open+10; const L=[]; for(const t of G.teams){ if(t.id===G.user)continue; for(const p of domestic(t.id)){ p.ctT=p.team; p.ntc=G.year+2; L.push(p); } }
  for(let i=0;i<6;i++)aiBlockWeekly(); const bad=L.filter(p=>p.aiListed); ok(!bad.length,'거부권 선수 매물 '+bad.length+'명'); });
T('[리뷰 11-02e] 입대 예약은 연봉 합의가 아니다: 예약하면 복무 예외로 지금 연봉이 되지만, 예약을 취소하면 협상 상태(구단안·선수안·진행 중)가 돌아온다',()=>{ fresh(); const p=domestic(G.user).find(q=>milFree(q)&&!q.faC&&!isRookie(q)); ok(p,'준비 실패'); p.sal=100; delete p.newSal;
  G.contract={y:G.year,tid:G.user,ended:[p.id],foreignEnd:[],foreignDrop:[],released:[],done:false,neg:{[p.id]:{st:'open',off:200,cur:200,ask:250}}}; ok(enlistNow(p.id)==='','입대 예약 실패'); ok(G.contract.neg[p.id].st==='ok'&&p.newSal===100,'예약 때 복무 예외가 적용되지 않음');
  ok(enlistCancel(p.id)==='','예약 취소 실패'); const n=G.contract.neg[p.id]; ok(n.st==='open'&&n.off===200&&n.ask===250&&p.newSal===undefined,'취소 뒤 협상 상태 '+JSON.stringify(n)+' newSal '+p.newSal); });
T('[리뷰 11-02e] 협상 화면 상한 예상은 실제 샐러리캡처럼 상위 40명을 다시 뽑고, 계약 적용 시즌의 상한·합의한 미래 계약을 쓴다',()=>{ fresh(); simTo(()=>period()==='season'); const tid=G.user; const L=domPayOf(tid).filter(p=>!isRookie(p)).map(p=>({p,v:p.sal+(p.capB&&p.ctT===p.team&&p.capB.until>=G.year?p.capB.a:0)})).sort((a,b)=>b.v-a.v); ok(L.length>=45,'준비 실패 '+L.length);
  const k40=L[39].v, low=L[L.length-1]; const W=capPayWith(tid,low.p.id,Math.max(low.v,Math.min(k40-10,low.v+70)),G.year); ok(W.tot===capPay(tid),'40위 밖 그대로인데 상한 합계 '+W.tot+' ≠ '+capPay(tid));
  const W2=capPayWith(tid,low.p.id,k40+500,G.year); ok(W2.tot===capPay(tid)-k40+k40+500,'40위 안으로 들어올 때 밀려나는 40번째 몫 계산 '+W2.tot);
  const s1=G.year+1, W3=capPayWith(tid,null,null,s1); ok(W3.s===s1&&W3.cap===capOf(s1),'다음 시즌 계약인데 '+W3.s+' 상한 '+W3.cap); const q=L[5].p; const t0=W3.tot; q.extNext={annual:q.sal+3000,years:3}; ok(capPayWith(tid,null,null,s1).tot===t0+3000,'합의한 다음 시즌 계약이 반영되지 않음'); delete q.extNext; });
T('[리뷰 11-02e] FA 보상: 저장·불러오기 뒤 현금 보상을 골라도 FA 계약 결과 기록에 보상금이 남는다(객체 대신 식별자로 찾기)',()=>{ fresh(); const ot=otherT(); const p=domestic(G.user)[0]; p.faGrade='A'; p.faPrevSal=300; const rec={id:p.id,from:G.user,to:ot,annual:500,years:3}; G.fa={results:[rec],pool:[],offers:{},ai:{},open:true};
  compStart(p,G.user,ot,rec); const c=G.comp[0]; ok(c&&c.stage==='pick'&&c.from===G.user,'준비 실패: 보상금 선택 단계가 아님'); ok(!('_rec' in c),'보상 절차가 계약 결과 객체를 직접 들고 있음');
  G=JSON.parse(JSON.stringify(G)); const c2=G.comp[0]; compResolve(c2,null); const R=G.fa.results.find(r=>r.id===p.id); ok(R&&R.compCash===900&&c2.cash===900,'저장 뒤 보상금 기록 '+(R&&R.compCash)+' / 받은 '+c2.cash); });
T('[리뷰 11-02e] 병원을 바꾸면 재활 중인 선수(남은 14일 이상)의 남은 기간에도 새 병원 효과가 적용되고, 짧은 부상은 그대로다',()=>{ fresh(); G.med.hosp='none'; const [a,b]=domestic(G.user); a.injOut=60; b.injOut=7; setHospital('a'); ok(a.injOut===Math.round(60*(1-HOSP.a.rec)),'60일 부상 → '+a.injOut); ok(b.injOut===7,'짧은 부상이 바뀜 '+b.injOut); setHospital('none'); ok(Math.abs(a.injOut-60)<=1,'되돌리면 원래 비율로 '+a.injOut); });
T('[리뷰 11-02f] 해외 진출: 가을·겨울에 떠난 선수는 그해 해외 기록이 생기지 않고(첫 해외 시즌은 다음 해), 같은 시즌 기록을 두 번 만들지 않는다',()=>{ fresh(); const p=domestic(otherT()).find(q=>!q.isP&&ovr(q)>=55)||domestic(otherT())[0]; G.day=KD(11,1); const id=p.id; ovsLeave(p,'NPB','테스트',2,200,'해외 FA');
  const a=G.abroad.find(x=>x.id===id); abroadYear(); ok(!a.lines.length,'떠난 해에 해외 기록 '+a.lines.map(l=>l.y+' '+(l.pa||l.outs)).join(',')); G.year++; abroadYear(); ok(a.lines.length===1&&a.lines[0].y===G.year,'첫 해외 시즌 기록 '+a.lines.map(l=>l.y).join(',')); if(!a.back){ abroadYear(); ok(a.lines.filter(l=>l.y===G.year).length===1,'같은 시즌 기록이 두 번'); } G.year--; });
T('[리뷰 11-02f] 해외에서 성장할 때 옛 국내 구단의 시설·감독·코치를 쓰지 않는다',()=>{ fresh(); const p=domestic(G.user).find(q=>q.age<=26)||domestic(G.user)[0]; let seen=[]; const d0=develop; develop=function(q){ seen.push(q.team); return d0.apply(this,arguments); };
  try{ G.day=KD(11,1); const id=p.id; ovsLeave(p,'NPB','테스트',3,200,'포스팅',0); G.year++; abroadYear(); G.year--; }finally{ develop=d0; } ok(seen.length>=1&&seen.every(t=>t==null),'해외 성장 중 소속 '+JSON.stringify(seen)); });
T('[리뷰 11-02f] 해외 복귀는 원소속 구단 우선협상: 계약을 고르기 전에는 등록·연봉이 확정되지 않고, 거절하면 자유계약 선수가 된다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP&&ovr(q)>=50); const id=p.id; G.day=KD(11,1); ovsLeave(p,'NPB','테스트',1,200,'해외 FA'); const a=G.abroad.find(x=>x.id===id); { const pj=JSON.parse(a.pj); pj.age=33; a.pj=JSON.stringify(pj); } /* 33세 이상은 계약이 끝나면 돌아온다 */
  const n0=rosterN(G.user); G.year++; abroadYear(); const q=G.players[id]; ok(a.back&&q,'준비 실패: 복귀 안 함'); ok(q.team==null&&q.retAsk&&q.retFrom===G.user,'협상 전에 등록됨 team='+q.team); ok(rosterN(G.user)===n0,'선수 수가 바로 늘어남');
  const e=(G.evs||[]).find(x=>x.k==='ovsback'&&!x.done); ok(e,'우선협상 결정이 없음'); evPick(e.id,1,true); ok(q.team==null&&q.freeSince!=null&&!q.retAsk,'거절했는데 자유계약 선수가 아님'); G.year--; });
T('[리뷰 11-02f] 포스팅 약속: 약속한 해에는 다년계약을 맺었어도 포스팅 요청(약속 확인)이 온다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP&&!q.foreign); p.postPromise=G.year; p.faC=true; p.yrs=4; p.ext=true; p.svc=8; p.age=Math.min(p.age,30); G.evs=(G.evs||[]).filter(e=>e.k!=='post'); postingSeason(); ok((G.evs||[]).some(e=>e.k==='post'&&e.data&&e.data.pid===p.id),'약속한 해인데 포스팅 요청이 오지 않음'); });
T('[FA 옵션] 구단 연장 옵션·선수 옵트아웃: 계약 조건에 넣을 수 있고 가치에 반영되며, 스토브리그에서 실행·포기·옵트아웃이 처리된다(커뮤니티 제안 2026-11-02)',()=>{ fresh(); const base={years:3,annual:1000,bonus:0,opt:0,role:null,ntc:false};
  ok(termsVal({...base,cOpt:2})<termsVal(base),'구단 옵션이 선수에게 불리하게 계산되지 않음'); ok(termsVal({...base,pOut:1})>termsVal(base),'옵트아웃이 선수에게 유리하게 계산되지 않음'); ok(/구단 옵션 2년/.test(termsTxt({...base,cOpt:2},true))&&/옵트아웃/.test(termsTxt({...base,pOut:1},true)),'조건 문구 없음');
  const ps=domestic(G.user).filter(q=>!q.isP&&!isRookie(q)&&q.age<=31).sort((x,y)=>ovr(y)-ovr(x)).slice(0,3); ok(ps.length===3,'준비 실패'); const [a,b,c]=ps;
  for(const q of ps){ q.svc=Math.max(q.svc||0,faSvc(q)+1); q.lastFA=G.year-1; }
  a.faC=true; a.yrs=1; termsApply(a,{years:1,annual:a.sal,cOpt:2},'fa',G.year); a.cOpt.dec=true;
  b.faC=true; b.yrs=3; b.sal=MIN_SAL; termsApply(b,{years:3,annual:MIN_SAL,pOut:1},'fa',G.year);
  c.faC=true; c.yrs=1; termsApply(c,{years:1,annual:c.sal,cOpt:1},'fa',G.year); c.cOpt.dec=false;
  ok(b.pOut&&b.pOut.y===G.year&&a.cOpt.y===2,'조건 저장 실패'); offseason();
  ok(a.team===G.user&&a.faC&&a.yrs===2,'구단 옵션 실행 뒤 '+JSON.stringify({t:a.team,f:a.faC,y:a.yrs})); ok(b.team==null&&b.faFrom===G.user,'옵트아웃 선수가 FA로 나가지 않음 team='+b.team); ok(c.team==null&&c.faFrom===G.user,'옵션 포기 선수가 FA가 아님(재자격 기간과 상관없이) team='+c.team); });
T('[구단 색] 구단 테마 주색이 구단 배지 바탕색(같은 지역 KBO 구단 색)과 같다(사용자 2026-11-02 09:06)',()=>{ const E={"서울 코메츠": "#A50034", "서울 하운즈": "#131230", "인천 시걸스": "#CE0E2D", "수원 스파크스": "#141414", "고양 스톰": "#570514", "대전 레드폭스": "#F37321", "광주 블레이즈": "#EA0029", "대구 썬더스": "#074CA1", "부산 웨이브스": "#041E42", "창원 앵커스": "#1D467B"}; const bad=[]; for(const t of TEAM_DEF){ const nm=t.city+' '+t.nick; const c=(TPAL[t.code]||[])[0]; if(!E[nm]||String(c).toUpperCase()!==E[nm])bad.push(nm+' '+c+'≠'+E[nm]); } ok(!bad.length,bad.join(', ')); });
T('[리뷰 11-02g] 감독 외국인 교체 요청: 기존 선수를 내보내기만 하면 완료가 아니고 새 외국인까지 와야 완료(구단주 지원금과 같은 판정), 기한은 등록 마감을 넘지 않는다',()=>{ fresh(); simTo(()=>period()==='season'); G.day=foreignDL()-5; const m=G.mgr[G.user]; m.rel=60; const f=foreignOf(G.user)[0]; G.mreq=[];
  mreqMake('frep',f); const r=G.mreq.find(x=>x.k==='frep'); ok(r&&r.until<=foreignDL(),'요청 기한 '+(r&&dsh(r.until))+'이 등록 마감 '+dsh(foreignDL())+'보다 늦음'); r.st='open';
  f.team=null; mreqCheck(); ok(r.st==='open'&&m.rel===60,'내보내기만 했는데 '+r.st+' 관계 '+m.rel); const q=newForeign('용병',{market:true,isP:f.isP}); q.team=G.user; q.acq={tid:G.user,k:'외국인',n:(r.an||0)+1,d:G.day}; mreqCheck(); ok(r.st==='done'&&m.rel===65,'새 외국인까지 왔는데 '+r.st+' 관계 '+m.rel); });
T('[리뷰 11-02g] 출전 기회 약속: 약속한 뒤 늘어난 출전량으로 판정하고(약속 전 기록은 세지 않음), 부상으로 못 뛰면 평가를 미룬다',()=>{ fresh(); simTo(()=>period()==='season'); simTo(()=>G.day>=G.cal.open+40); const p=playersOf(G.user).filter(q=>!q.isP&&(seasonTotal(q,G.year,'1군')||{}).pa>=60).pop(); ok(p,'준비 실패');
  p.promise=mkPromise(p,30); ok(p.promise.b&&p.promise.b.pa>=60,'약속 때 기준 출전량이 저장되지 않음'); ok(!playPromKept(p),'약속 뒤 출전이 없는데 지킨 것으로 판정'); const h=lineFor(p,G.year,G.user,'1군'); h.pa+=30; ok(playPromKept(p),'약속 뒤 30타석을 뛰었는데 못 지킨 것으로 판정'); h.pa-=30;
  const q=playersOf(G.user).find(x=>!x.isP&&x!==p); q.promise=mkPromise(q,30); q.promise.until=G.day; q.injOut=40; const u0=q.promise.until; moraleWeek(); ok(q.promise&&q.promise.until>u0,'부상 중인데 약속 평가를 미루지 않음'); });
T('[리뷰 11-02h] 방출하면 옛 구단 연봉 협상(미확정 산정안)도 끝나, 다른 구단 계약 뒤 내년 연봉이 옛 금액을 읽지 않는다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.faC&&!isRookie(q)); p.sal=100; p.newSal=500; G.contract={y:G.year,tid:G.user,ended:[p.id],foreignEnd:[],foreignDrop:[],released:[],done:false,neg:{[p.id]:{st:'open',off:500,cur:500,ask:600}}};
  releasePlayer(p.id); ok(!(p.id in G.contract.neg)&&!G.contract.ended.includes(p.id)&&p.newSal===undefined,'방출 뒤 옛 협상이 남음'); p.team=otherT(); p.sal=60; ok(salNext(p)===60,'새 구단 연봉 60인데 내년 연봉 '+salNext(p)); });
T('[리뷰 11-02h] 비FA 다년계약의 옵트아웃은 FA 자격이 생기는 해부터만 넣을 수 있고, 그 전 옵트아웃은 효력이 없다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.faC&&!q.foreign); p.svc=2; ok(pOutMin(p,G.year)>3,'자격 전 최소 옵트아웃 해 '+pOutMin(p,G.year)); termsApply(p,{years:4,annual:p.sal,pOut:1},'ext',G.year); ok(!p.pOut,'FA 자격 전 옵트아웃이 저장됨');
  p.svc=faSvc(p)-1; termsApply(p,{years:3,annual:p.sal,pOut:2},'ext',G.year); ok(p.pOut&&p.pOut.y===G.year+1,'자격이 생기는 해 옵트아웃이 저장되지 않음 '+JSON.stringify(p.pOut)); });
T('[리뷰 11-02h] 군 복무 중인 선수의 구단 연장 옵션도 단장에게 묻는다(계약을 가진 선수 전부)',()=>{ fresh(); const p=domestic(G.user).find(q=>milFree(q)&&!isRookie(q)); p.faC=true; p.yrs=1; termsApply(p,{years:2,annual:p.sal,cOpt:1},'fa',G.year-1); p.mil={unit:'현역',from:G.day-30,until:G.day+400}; ok(milServing(p),'준비 실패');
  G.evs=(G.evs||[]).filter(e=>e.k!=='copt'); cOptAsk(); ok((G.evs||[]).some(e=>e.k==='copt'&&e.data.pid===p.id),'복무 중 선수 옵션 결정을 묻지 않음'); });
T('[리뷰 11-02h] 구단 옵션을 실행해도 계약금이 계약 총액에서 빠지지 않는다(상한 반영 기간과 총액 기록은 별개)',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.foreign); p.faC=true; p.yrs=1; p.cyrs=4; termsApply(p,{years:4,annual:500,bonus:1000,cOpt:1},'fa',G.year-3,true); p.sal=500;
  p.yrs=2; p.cyrs=5; p.cOptAdd={y:1,a:500}; const keep=G.year; G.year=keep+1; const m=ctMoney(p); G.year=keep; ok(m&&m.tot===1000+500*5,'옵션 실행 뒤 보장 총액 '+(m&&m.tot)+'(3500이어야 함)'); });
T('[리뷰 11-02i] 외부 FA 한도를 채운 뒤 남은 역제안은 수락할 수 없고, 실제 계약이 된 경우에만 사인 완료라고 알린다',()=>{ fresh(); simTo(()=>G.fa&&G.fa.open&&!G.fa.closed); const ps=G.fa.pool.map(id=>G.players[id]).filter(q=>q&&q.team==null&&q.faFrom!==G.user); ok(ps.length>=1,'준비 실패');
  const p=ps[0]; const n=negOf(p.id); n.counter={annual:p.ask.annual,years:p.ask.years||2,until:G.day+7}; G.fa.outN=G.fa.outN||{}; G.fa.outN[G.user]=faCapN(); ok(faOutBlocked(G.user,p),'준비 실패: 한도');
  const msg=faAcceptCounter(p.id); ok(!/사인했습니다/.test(msg),'한도를 채웠는데 사인했다고 안내: '+msg); ok(p.team==null&&n.counter,'한도 실패인데 역제안이 사라지거나 소속이 바뀜'); });
T('[리뷰 11-02i] 해외 복귀 우선협상 중 이직하면 옛 구단(AI)이 계약하거나 거절해 끝내고, 이미 꼬인 저장도 기한이 지나면 정리된다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP&&ovr(q)>=50); const id=p.id; G.day=KD(11,1); ovsLeave(p,'NPB','테스트',1,200,'해외 FA'); const a=G.abroad.find(x=>x.id===id); { const pj=JSON.parse(a.pj); pj.age=33; a.pj=JSON.stringify(pj); }
  G.year++; abroadYear(); const q=G.players[id]; ok(q&&q.retAsk&&q.retFrom===G.user,'준비 실패'); const old=G.user; switchTeam(otherT()); ok(!q.retAsk&&(q.team===old||q.freeSince!=null),'이직 뒤 복귀 협상이 남음 team='+q.team);
  G.year--; });
T('[리뷰 11-02i] 이미 이벤트 없이 남은 해외 복귀 협상(예전 저장)은 기한이 지나면 자유계약으로 풀린다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP); p.team=null; p.retFrom=G.user; p.retAsk={sal:300,yrs:1,lg:'NPB',n:1,exp:G.day-1}; ovsBackSweep(); ok(!p.retAsk&&p.freeSince!=null,'꼬인 복귀 협상이 정리되지 않음'); });
T('[리뷰 11-02j] 포지션 전환 뒤에도 익힌 기존 포지션 가치가 평가에 남는다(유격수→1루 전환 성공으로 시장 가치가 떨어지지 않음)',()=>{ fresh(); const p=Object.values(G.players).filter(q=>!q.isP&&q.pos==='SS'&&q.team!=null).sort((a,b)=>ovr(b)-ovr(a))[0]; ok(p,'준비 실패'); const v0=posBest(p).v;
  const E=pexpOf(p); E.SS=100; p.pexp=Object.assign({},p.pexp||{},{SS:100,'1B':100}); p.pos='1B'; const b=posBest(p); ok(b.v>=v0-2.5&&b.pos==='SS','전환 뒤 가치 '+b.v.toFixed(2)+'('+b.pos+') / 전환 전 '+v0.toFixed(2)); });
T('[리뷰 11-02j] 1군 선수를 육성선수로 돌렸다가 정식 등록해도 말소 뒤 10일 재등록 제한이 걸린다',()=>{ fresh(); simTo(()=>period()==='season'); G.day=Math.max(G.day,KD(5,10)); const p=playersOf(G.user).find(q=>q.e1&&!q.faC&&q.sal<=100&&!q.foreign); ok(p,'준비 실패'); ok(toYS(p.id)==='','육성 전환 실패'); ok(fromYS(p.id)==='','정식 등록 실패: '+fromYS(p.id)); ok(!canUp(p),'같은 날 다시 1군에 올릴 수 있음(10일 제한 우회)'); });
T('[리뷰 11-02k] 12월 31일에 재활 30일 남은 선수는 새해에도 남은 기간이 그대로 이어진다(1월 1일 일괄 완치 없음)',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP); p.injOut=30; p.injK=Object.keys(INJ)[0]; newYear(); const q=G.players[p.id]; ok(q.injOut===30,'새해 뒤 남은 재활 '+q.injOut+'일'); ok(!!q.injK,'부상 종류가 지워짐'); });
T('[리뷰 11-02k] 대표 발탁 뒤 다친 선수는 소집일에 의료 사유로 빠지고 대체 선수가 뽑히며, 여론 불이익·대회 성과·병역 특례를 받지 않는다',()=>{ fresh(); G.year=2026; G.day=KD(6,11); ntAnnounce('ag'); const N=G.nt; const p=N.ids.map(id=>G.players[id]).find(q=>q&&q.team===G.user)||N.ids.map(id=>G.players[id]).find(Boolean); ok(p,'준비 실패');
  p.injOut=90; p.injK=Object.keys(INJ)[0]; if(p.mil)delete p.mil.exempt; prInit(); const f0=G.pr.fan, m0=p.mor??60; const n0=N.ids.length; G.day=KD(9,16); ntDaily(G.day);
  ok(!N.ids.includes(p.id),'다친 선수가 그대로 소집됨'); ok(N.ids.length===n0,'대체 선수가 안 뽑힘: '+N.ids.length+'/'+n0); ok(!(p.ntFrom>0&&p.ntAway>G.day),'다친 선수가 대표팀 차출 상태'); ok((N.med||[]).some(x=>x.id===p.id),'의료 사유 제외 기록 없음'); ok(G.pr.fan===f0&&(p.mor??60)>=m0-0.001,'의료 제외인데 여론·사기 불이익');
  const r=ntResult('ag',0); ok(r==='금메달','강제 금메달'); ok(!(p.aw||[]).some(l=>l.includes('아시안게임')),'빠진 선수가 메달을 받음'); ok(!(p.mil&&p.mil.exempt),'빠진 선수가 병역 특례를 받음'); });
T('[리뷰 11-02k] 병원을 바꿨다가 원래 병원으로 돌아오면 재활 기간도 원래대로 돌아온다(왕복으로 단축이 남지 않음)',()=>{ fresh(); G.med.hosp='none'; const L=domestic(G.user).filter(q=>!q.isP).slice(0,3); const D=[15,20,60]; L.forEach((p,i)=>{ p.injOut=D[i]; p.injK=Object.keys(INJ).find(k=>INJ[k].d[0]<240); });
  const best=Object.keys(HOSP).sort((a,b)=>HOSP[b].rec-HOSP[a].rec)[0]; setHospital(best); ok(L[2].injOut<60,'준비 실패: 병원 효과 없음'); setHospital('none'); L.forEach((p,i)=>ok(p.injOut===D[i],p.name+' 왕복 뒤 '+p.injOut+'일 / 원래 '+D[i]+'일'));
  setHospital(best); for(let i=0;i<5;i++)L.forEach(p=>p.injOut--); const mid=L[2].injOut; setHospital('none'); ok(Math.abs(L[2].injOut-Math.round((mid)/(1-HOSP[best].rec)))<=1,'며칠 지난 뒤 되돌린 기간 '+L[2].injOut); });
T('[리뷰 11-02l] 시상식 전에 해외로 떠난 MVP도 개인 이력에 MVP가 남고, 국내 복귀 뒤에도 이어진다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP&&!q.foreign); ok(p,'준비 실패'); const y=G.year; G.awards=G.awards||{}; G.awards[y]={y,gg:{},cand:{gg:{},mvp:[],roy:[]},pend:{mvp:true,gg:false},mvp:{id:p.id,name:p.name,t:p.team,line:'',v:100},roy:null};
  ovsLeave(p,'NPB','테스트',1,100,'해외 FA'); ok(!G.players[p.id],'준비 실패: 출국 안 됨'); awardCeremony('mvp'); const a=G.abroad.find(x=>x.id===p.id); ok(JSON.parse(a.pj).aw.includes(y+' MVP'),'해외 보관 정보에 MVP 없음');
  a.y=G.year-1; a.y1=G.year; G.year++; abroadYear(); const q=G.players[p.id]; if(q&&q.retAsk)ovsBackSign(q); ok(q,'준비 실패: 복귀 안 함'); ok((q.aw||[]).includes(y+' MVP'),'복귀 뒤 개인 이력에 MVP 없음'); });
T('[리뷰 11-02m] 시즌이 끝난 뒤 표값을 올려도 이미 치른 경기 입장 수입은 그대로다(경기 당시 가격으로 쌓음)',()=>{ fresh(); const c=G.cal, S=stadOf(G.user); S.price=1; for(const [d,a] of homeGames(G.user,c.open,c.end))stadGame(d,G.user,a); G.day=c.end+1;
  const t0=stadProj(G.user).ticket; S.price=3; const t1=stadProj(G.user).ticket; ok(t0>0,'준비 실패: 입장 수입 0'); ok(Math.abs(t1-t0)<=1,'시즌 뒤 가격 변경으로 올해 입장 수입 '+t0+' → '+t1); });
T('[리뷰 11-02m] 시즌 내내 쓴 스카우트를 결산 전에 해고해도 그해 일한 기간 연봉은 비용에 남는다(재직 기간만큼 누적)',()=>{ fresh(); G.spend.scout=0; const s=G.scouts[0]; s.sal=130; const d0=G.day; for(let i=0;i<300;i++){ G.day++; G.spend.scout=scoutSpent()+sum(G.scouts.map(x=>x.sal||0))/365; }
  const before=scoutSpent(); scoutFire(s.id); ok(!G.scouts.includes(s),'준비 실패: 해고 안 됨'); ok(Math.abs(scoutSpent()-before)<1e-6,'해고로 쌓인 비용이 사라짐 '+before.toFixed(1)+' → '+scoutSpent().toFixed(1)); ok(before>=sum(G.scouts.map(x=>x.sal))*300/365+130*300/365-1,'300일 재직 연봉이 쌓이지 않음');
  const b=budget(); const row=b.exp.find(x=>x[0]==='스카우트 운영'); ok(row&&row[1]>=Math.round(130*300/365),'예산의 스카우트 운영비에 떠난 스카우트 몫 없음: '+(row&&row[1])); });
T('[리뷰 11-02m] 마무리캠프 도중 이직하면 새 구단은 그 팀 기준으로 캠프를 잇고(기본 방향·합류일 시작 기록), 옛 구단은 정해 둔 방향으로 마친다',()=>{ fresh(); const old=G.user; G.fcamp=null; fcampStart(); fcampSet('conv'); const nt=G.teams.find(t=>t.id!==old).id; G.gmSince=G.year; switchTeam(nt);
  const F=G.fcamp; ok(F&&!F.done,'준비 실패: 캠프 없음'); ok(F.focus!=='conv','새 구단이 옛 구단 훈련 방향(포지션 전환)을 이어받음'); ok(F.byT&&F.byT[old]==='conv','옛 구단 방향 보관 안 됨'); const mine=domestic(nt); ok(mine.some(p=>F.snap[p.id]),'새 구단 선수의 캠프 시작 기록이 없음'); });
T('[리뷰 11-02m] 신구장 규모 선택 때 안내한 좌석 수가 개장 뒤 실제 수용 인원과 같다',()=>{ fresh(); const S=stadOf(G.user); S.proj={stage:'plan'}; ok(newStadPick('dome')==='','준비 실패: 착공 안 됨'); G.day=S.proj.done; newStadDaily(); ok(!S.proj,'준비 실패: 개장 안 됨'); ok(stadCap(G.user)===23000,'돔 2만3천 석 안내 / 실제 '+stadCap(G.user)); });
T('[리뷰 11-02m] 내년 합류 예정 신인은 합류 전까지 구단 집중 훈련으로 성장하지 않는다',()=>{ fresh(); simTo(()=>period()==='season'); const p=domestic(G.user).find(q=>!q.isP&&q.age<=24); ok(p,'준비 실패'); p.joinY=G.year+1; G.trn=G.trn||{}; G.trn[p.id]={by:'gm',f:Object.keys(TRN[trnG(p)]).find(k=>k!=='bal')}; p.r[TRN[trnG(p)][G.trn[p.id].f].k[0]]=40; const r0=JSON.stringify(p.r), s0=p.trD&&p.trD.y===G.year?p.trD.s:0; for(let i=0;i<4;i++)trnWeek(); ok(JSON.stringify(p.r)===r0&&(p.trD&&p.trD.y===G.year?p.trD.s:0)===s0,'합류 전 신인이 집중 훈련으로 성장'); delete p.joinY; });
T('[리뷰 11-02m] 선발을 계투로 바꿔도 보유 구종은 남고(계투는 쓰는 구종만 줄임), 다시 선발로 돌리면 같은 구종을 다시 쓴다',()=>{ fresh(); const p=Object.values(G.players).find(q=>q.isP&&!q.foreign&&q.team!=null&&pitchOwnK(q).length>=4); ok(p,'준비 실패'); p.role='SP'; const sp=arsenal(p,p.r.stf).map(x=>x[0]), all0=arsenalAll(p,p.r.stf).map(x=>x[0]);
  p.role='RP'; const rp=arsenal(p,p.r.stf).map(x=>x[0]), all1=arsenalAll(p,p.r.stf).map(x=>x[0]); ok(JSON.stringify(all0)===JSON.stringify(all1),'계투 전환으로 보유 구종이 바뀜: '+all0+' / '+all1); ok(rp.length<sp.length&&rp.every(k=>all1.includes(k)),'계투가 쓰는 구종이 보유 구종 밖');
  ok(addPitch(p,0)===null||!all1.includes((p.addP||[]).slice(-1)[0].k),'계투가 이미 보유한 구종을 새로 익힘'); p.role='SP'; ok(JSON.stringify(arsenal(p,p.r.stf).map(x=>x[0]).slice(0,sp.length))===JSON.stringify(sp),'선발 복귀 뒤 구종이 달라짐'); });
T('[리뷰 11-02n] 시즌 중 방출된 외국인의 성적도 타이틀 경쟁에 남는다(보관 기록 포함, 중복 없음, 수상도 보관 기록에)',()=>{ fresh(); const y=G.year; const p=Object.values(G.players).find(q=>q.foreign&&!q.isP&&q.team!=null); ok(p,'준비 실패'); p.hist=p.hist.filter(h=>h.y!==y);
  p.hist.push(Object.assign({},ZB,{y,t:p.team,lvl:'1군',g:100,pa:450,ab:400,h:120,hr:999,rbi:100,bb:40})); const id=p.id; dropP(id); ok(!G.players[id]&&G.arch[id],'준비 실패: 보관 안 됨');
  const B=titleBoard(y,'hr',false); ok(B[0]&&B[0].p.id===id,'방출 선수가 홈런 경쟁에서 빠짐'); ok(B.filter(x=>x.p.id===id).length===1,'같은 선수 중복 집계'); const T=seasonTitles(y); const hr=T.find(x=>x.stat==='hr'); ok(hr&&hr.ids.includes(id),'홈런왕 '+(hr&&hr.names)); ok((G.arch[id].aw||[]).includes(y+' 홈런왕'),'보관 기록에 수상 없음'); });
T('[리뷰 11-02n] 트레이드된 투수의 구단별 WAR 합이 시즌 전체 WAR와 같다(마무리 보정은 시즌 전체 세이브로 정해 구단별에도 같은 배수)',()=>{ fresh(); const y=G.year; const p=Object.values(G.players).find(q=>q.isP&&q.team!=null); p.hist=p.hist.filter(h=>h.y!==y);
  const mk=t=>Object.assign({},ZB,{y,t,lvl:'1군',g:20,outs:60,er:3,sv:3,bf:80}); p.hist.push(mk(0),mk(1)); const a=warOf(p.hist[p.hist.length-2],p)+warOf(p.hist[p.hist.length-1],p), b=warOf(seasonTotal(p,y,'1군'),p); ok(Math.abs(a-b)<.01,'구단별 합 '+a.toFixed(2)+' / 시즌 전체 '+b.toFixed(2)); });
T('[리뷰 11-02n] 재제안 기한이 남은 스태프 후보는 월초 후보 교체·AI 채용으로 사라지지 않는다',()=>{ fresh(); stInit(); const ot=G.teams.find(t=>t.id!==G.user).id;
  for(const [kind,mk] of [['an',()=>anaMarket()],['sc',()=>scoutMkt()]]){ G.amarketM=-1; G.scoutMarketM=-1; const s=mk().find(x=>!x.ob); ok(s,'준비 실패 '+kind); s.bid={t:ot,sal:s.sal,v:999,k:kind,exp:G.day+3};
    for(let i=0;i<15;i++){ if(kind==='an')G.amarketM=-1; else G.scoutMarketM=-1; mk(); try{ stAiMonthly(); }catch(e){} ok(mk().includes(s),kind+' 협상 중 후보가 사라짐('+i+'회째)'); } } });
T('[리뷰 11-02n] 다른 구단을 거쳐 다시 방출돼도 처음 방출한 구단의 1년 재계약 제한은 남는다',()=>{ fresh(); const A=G.user, Bt=G.teams.find(t=>t.id!==A).id; const p=domestic(A).find(q=>!q.foreign&&!q.faC); ok(p,'준비 실패'); toFree(p,'테스트'); ok(/1년/.test(signFree(p.id,A)),'준비 실패: 첫 제한 없음');
  p.team=Bt; delete p.freeSince; toFree(p,'테스트'); G.day+=1; ok(/1년/.test(signFree(p.id,A)),'다른 구단 방출 뒤 처음 구단 제한이 풀림'); });
T('[리뷰 11-02n] 같은 분석원은 AI 구단·유저 구단 어디서나 같은 적응 계산을 쓴다(취임 순간 효과가 줄지 않음)',()=>{ fresh(); stInit(); const tid=G.teams.find(t=>t.id!==G.user).id; const L=G.lgStaff[tid]; const a=mkAnalyst(4,'opp'); a.since=G.day; L.an=[a];
  const v0=anaPow('opp',tid); G.gmSince=G.year; switchTeam(tid); const v1=anaPow('opp',tid); ok(Math.abs(v0-v1)<1e-9,'AI '+v0+' / 취임 직후 '+v1); });
T('[리뷰 11-02n] 계투의 부하 한도는 반년 전 긴 등판 하나로 선발 기준이 되지 않고, 최근 긴 등판은 점점 덜 반영된다',()=>{ fresh(); const p=Object.values(G.players).find(q=>q.isP&&q.team!=null); p.role='RP'; const s=p.r.sta||50, RP=540+(s-50)*9, SP=1150+(s-50)*18;
  p.ld=[[G.day-180,80]]; ok(Math.abs(armCap(p)-RP)<1e-6,'180일 전 80구로 한도 '+armCap(p)); p.ld=[[G.day-1,80]]; ok(armCap(p)>RP+(SP-RP)*.9,'어제 80구 한도 '+armCap(p)); p.ld=[[G.day-30,80]]; ok(armCap(p)<SP&&armCap(p)>RP,'30일 전 80구 한도 '+armCap(p)); });
T('[리뷰 11-02n] 스타 마케팅 대상 선수가 떠나면 진행한 기간 몫은 수입으로 정산되고 이후 예상만 빠진다',()=>{ fresh(); const p=domestic(G.user)[0]; p.aw=(p.aw||[]).concat([G.year+' MVP',G.year+' 홈런왕']); G.day=Math.max(G.day,KD(3,1)); ok(smStart(p.id,'m')!==undefined,'준비 실패'); ok(smActive(p),'준비 실패: 캠페인 없음'); const a=smEst(p,'m'); ok(a>0,'준비 실패: 스타 파워 0');
  G.day+=61; try{ smCheck(); }catch(e){} toFree(p,'테스트'); G.day+=1; try{ smCheck(); }catch(e){} const b=smBonus(G.user); ok(b>0,'떠난 뒤 캠페인 수입 0'); ok(Math.abs(b-Math.round(a*62/365))<=Math.max(2,a*.05),'정산 '+b+' / 기대 '+Math.round(a*62/365)); });
T('[리뷰 11-02o] 자동 연봉 확정이 외국인 결정으로 대기했다가 결정을 마치면 다음 날 자동 처리가 다시 확정하고, 상태는 지금 남은 사유를 보인다',()=>{ fresh(); const f=foreignOf(G.user)[0]; ok(f,'외국인 없음'); G.auto=Object.assign({},G.auto||{},{sal:true,fre:false}); G.contract={y:G.year,tid:G.user,ended:[],foreignEnd:[f.id],foreignDrop:[],released:[],done:false,fre:{}}; f.newSal=f.sal;
  autoDaily(KD(1,5)); ok(!G.contract.done&&G.contract.autoWait,'준비 실패: 대기 안 함'); G.contract.fre[f.id]={ok:true}; ok(!/대기/.test(delegStatus('sal')),'결정을 마쳤는데 지난 대기 사유를 보임: '+delegStatus('sal')); autoDaily(KD(1,6)); ok(G.contract.done,'결정을 마친 다음 날에도 확정 안 됨'); });
T('[리뷰 11-02o] 정규시즌이 끝난 뒤 채용한 코치·감독 계약은 다음 시즌부터 세어 이번 겨울 계약 정리에서 줄지 않는다',()=>{ fresh(); G.day=Math.max(G.day,G.cal.end+5); if(dobj(G.day).m<9)G.day=KD(10,31); G.rolled=G.year-1; refreshCoachMarket(); const c=G.cmarket.find(x=>!x.ob); ok(c,'준비 실패: 코치 후보 없음'); ok(hireCoach(c.id,1)==='','준비 실패: 채용 실패'); const m=G.mmarket[0]; hireMgr(m.id,2);
  coachYear(); ok(Object.values(G.coach[G.user]).includes(c)&&c.yrs===1,'1년 계약 코치가 하루 만에 만료: '+c.yrs); offseasonMgr(); const M=G.mgr[G.user]; ok(M&&M.yrs===2,'2년 계약 감독이 1년으로 줄어듦: '+(M&&M.yrs)); ok(c.cs===G.year+1&&c.ce===G.year+1,'코치 계약 시즌 '+c.cs+'~'+c.ce); });
T('[리뷰 11-02o] 우승 뒤 이직하면 퍼레이드·반지 수여식은 우승 구단에서 열리고 새 구단은 받지 않는다',()=>{ const op=champNow(); const champ=G.user; ok(G.parade&&G.ringY===G.year+1,'준비 실패'); const nt=G.teams.find(t=>t.id!==champ).id; const popN=team(nt).pop, popC=team(champ).pop; G.gmSince=G.year; switchTeam(nt);
  G.day=G.parade.d; champParade(); ok(team(nt).pop===popN,'새 구단이 우승 퍼레이드 인기 효과를 받음'); ok(team(champ).pop>popC,'우승 구단 퍼레이드 효과 없음'); ok(!(G.mail||[]).some(m=>/퍼레이드를 마쳤/.test(m.subj||'')&&m.day===G.day),'새 구단 단장에게 퍼레이드 완료 메일');
  G.year++; const day=G.day; const r1=stadGame(day,nt,champ); ok(G.ringDone!==G.year,'새 구단 홈경기에서 반지 수여식'); stadGame(day,champ,nt); ok(G.ringDone===G.year,'우승 구단 홈 개막전 반지 수여식 없음'); });
T('[리뷰 11-02p] 신구장 개장 뒤 옛 구장에서 시작한 낮은 단계 공사가 끝나도 시설이 내려가지 않고, 개장 때 취소·환급된다',()=>{ fresh(); const S=stadOf(G.user); const t=team(G.user); S.lv.seat=2; S.build=[{k:'seat',lv:3,done:G.day+60,c:1200}]; S.proj={stage:'build',k:'mid',cap:21000,cost:9000,paid:0,done:G.day+10};
  G.day+=10; newStadDaily(); ok(S.lv.seat>=4,'준비 실패: 개장 안 됨'); G.day+=60; stadDaily(); ok(S.lv.seat>=4,'옛 공사 완공으로 관람석 '+S.lv.seat+'단계로 내려감'); ok(!(S.build||[]).some(b=>b.k==='seat'&&b.lv<=4),'낮은 단계 공사가 남음'); });
T('[리뷰 11-02p] 우리 답을 기다리는(협상 기한이 남은) 외국인 후보는 월초 시장 정리·교체로 사라지지 않는다',()=>{ fresh(); refreshFMarket(); const id=G.fmarket.find(i=>G.players[i]&&G.players[i].fsrc!=='scout'); ok(id,'준비 실패'); const q=G.players[id]; q.fday=G.day-200; q.fneg={n:1,mood:60,since:G.day,wk:G.day,dl:G.day+2};
  refreshFMarket(0,40); ok(G.players[id]&&G.fmarket.includes(id),'협상 기한이 남은 후보가 시장에서 삭제됨'); q.fneg.dl=G.day-1; refreshFMarket(0,0); ok(!G.players[id],'기한이 지난 뒤에도 오래된 후보가 남음'); });
T('[리뷰 11-02p] 전임 감독의 미응답 요청은 감독이 바뀌면 끝나고, 답해도 새 감독 관계·선수에 영향이 없으며 충돌 횟수도 감독마다 센다',()=>{ fresh(); const A=G.mgr[G.user]; const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP); const r=mreqAdd('out',{pid:p.id},G.day+20); mreqAsk(r,'정리 요청','테스트',[{l:'더 기회를 준다'},{l:'방출한다'}],0);
  const e=G.evs.find(x=>x.k==='mreq'&&x.data&&x.data.rid===r.id&&!x.done); ok(e,'준비 실패: 요청 없음'); G.dirFr={y:G.year,arm:2}; hireMgr(G.mmarket[0].id,2); const B=G.mgr[G.user]; ok(B&&B.id!==A.id,'준비 실패: 감독 교체 안 됨'); const rel0=B.rel;
  const res=evPick(e.id,1); ok(G.players[p.id]&&G.players[p.id].team===G.user,'전임 감독 요청에 답해 선수가 방출됨: '+res); ok(B.rel===rel0,'새 감독 관계가 변함 '+rel0+' → '+B.rel); ok(r.st==='void','전임 감독 요청이 끝나지 않음: '+r.st);
  B.arm=90; B.ego=95; B.rel=60; let msg=''; for(let i=0;i<30;i++){ delete (mgrDir()||{}).arm; msg=setMgrDir('arm',true); if(/따르지 않습니다/.test(msg))break; } ok(/첫 의견 충돌/.test(msg),'새 감독 첫 충돌인데 반복 충돌로 처리: '+msg); });
T('[리뷰 11-02p] 보직을 바꾸면 같은 날에도 전력 비교(자리별 순위)가 새 구성으로 다시 계산된다',()=>{ fresh(); const v0=leagueSlots(); const d=depth(G.user); const rp=d.pen.find(q=>q.role!=='SP')||d.pen[0]; ok(rp,'준비 실패'); rp.role='SP'; rp.r.stf=95; rp.r.ctl=95; rp.r.sta=90; const v1=leagueSlots(); ok(v1!==v0,'보직 변경 뒤에도 같은 계산 재사용'); ok(JSON.stringify(PSLOTS.map(k=>v1[G.user][k].v))===JSON.stringify(PSLOTS.map(k=>slotOf(G.user)[k].v)),'비교 자료가 실제 배치와 다름'); });
T('[리뷰 11-02p] 지난 시즌 백분위 비교 집단은 그 시즌 기준을 채운 선수로 정하고, 지금 방출·은퇴로 바뀌지 않는다',()=>{ fresh(); const y=G.year-1; const L=Object.values(G.players).filter(q=>!q.isP&&!q.fdPool&&pctQual(false,seasonTotal(q,y,'1군'))); ok(L.length>=15,'준비 실패: 지난 시즌 기준 충족 '+L.length+'명');
  const n0=pctPool(false,y).length; const x=L.find(q=>q.team!==G.user); toFree(x,'테스트'); G.day++; const n1=pctPool(false,y).length; ok(n1===n0,'방출로 지난 시즌 비교 집단 '+n0+' → '+n1); const id=x.id; dropP(id); G.day++; const n2=pctPool(false,y).length; ok(n2===n0,'리그를 떠난 선수 보관 기록이 빠짐 '+n0+' → '+n2); });
T('[리뷰 11-02q] 퓨처스 선발 등판도 마지막 선발일·등판일·투구 수·피로에 남아 이틀 뒤 1군 선발로 바로 뽑히지 않는다',()=>{ fresh(); simTo(()=>period()==='season'); const p=Object.values(G.players).find(q=>q.isP&&q.team===G.user&&!q.foreign); p.role='SP'; delete p.lastStart; delete p.lastApp; p.fat=0; p.ld=[];
  futPit(p,G.user); ok(p.lastStart===G.day&&p.lastApp===G.day&&p.lastPc>0,'퓨처스 선발 뒤 기록 '+JSON.stringify({ls:p.lastStart,la:p.lastApp,pc:p.lastPc})); ok(p.fat>0,'퓨처스 선발 피로 없음');
  const d={sp:[p],pen:[]}; const t=team(G.user); t.rot=0; const day=G.day+2; const q=Object.values(G.players).find(x=>x.isP&&x.team===G.user&&x!==p); q.role='SP'; delete q.lastStart; d.sp=[p,q]; ok(pickStarter(G.user,d,day,null)===q,'이틀 전 퓨처스 선발이 다시 선발로 뽑힘'); });
T('[리뷰 11-02q] 1군·퓨처스 등판이 섞여도 등판 기록은 날짜순이라 3연투를 3연투로 센다',()=>{ fresh(); const p=Object.values(G.players).find(q=>q.isP&&q.team!=null); p.role='RP'; p.ld=[]; const D=G.day; loadLog(p,D-1,20,false); loadLog(p,D-2,20,false); loadLog(p,D,19,false);
  ok(JSON.stringify(p.ld.map(x=>x[0]))===JSON.stringify([D-2,D-1,D]),'기록 순서 '+JSON.stringify(p.ld)); ok(consecDays(p,D+1)===3,'연속 등판 '+consecDays(p,D+1)+'일'); loadLog(p,D,5,false); ok(p.ld.filter(x=>x[0]===D).length===1&&p.ld[p.ld.length-1][1]===24,'같은 날 기록이 합쳐지지 않음'); });
T('[리뷰 11-02q] 열리지 않은 포스트시즌 경기 직관 예약은 정리되고, 지난 예약이 다음 예약 한도를 막지 않는다',()=>{ fresh(); const P=gmPlans(); P[G.day-3]={k:'attend',x:'owner',done:false}; P[G.day-2]={k:'attend',x:'owner',done:false}; gmPlanDaily(); ok(P[G.day-3].done&&P[G.day-2].done,'지난 예약이 남음(오늘 일정이 없을 때 정리 안 됨)');
  P[G.day-3].done=false; P[G.day-2].done=false; const g=Object.keys(G.cal.sched).map(Number).filter(d=>d>G.day&&(G.cal.sched[d]||[]).some(m=>m.includes(G.user)))[0]; ok(g,'준비 실패'); ok(!/두 경기까지만/.test(gmPlanSet(g,'attend','owner')),'지난 예약이 한도를 막음'); });
T('[리뷰 11-02q] 겨울에 다음 시즌 외국인 영입 한도를 볼 때 올해로 끝나는 인센티브는 빼고, 다음 시즌 유효한 인센티브만 더한다',()=>{ fresh(); simTo(()=>G.rolled===G.year&&dobj(G.day).m===12); const f=foreignOf(G.user).find(p=>p.foreign==='용병'); ok(f,'준비 실패'); f.ctT=f.team; f.opt={a:500,until:G.year,c:'x'};
  ok(fCommit(f)===f.sal,'올해로 끝난 인센티브를 다음 시즌 총액에 넣음: '+fCommit(f)+' / 연봉 '+f.sal); f.opt.until=G.year+1; ok(fCommit(f)===f.sal+500,'다음 시즌 인센티브를 빼먹음'); });
T('[리뷰 11-02r] 출발 전 연수 취소: 결산 전이면 예정 지출에서 빼고, 결산을 지난 뒤면 환급 수입으로 돌려받는다',()=>{ fresh(); G.day=KD(9,5); G.last={y:G.year-1}; const p=domestic(G.user).find(q=>ovsElig(q)); ok(p,'준비 실패'); const d0=G.spend.dev||0; ok(setOvs(p.id,'us')==='','준비 실패: 예약 실패'); ok((G.spend.dev||0)-d0===OVS.us.c,'준비 실패: 참가비 지출 없음');
  G.last={y:G.year}; G.spend={mgr:0,coach:0,med:0,hosp:0,dev:0,intl:0,fac:0,etc:0,scout:0}; G.day=KD(11,5); setOvs(p.id,null); ok(!(G.ovs||[]).some(x=>x.pid===p.id),'예약이 남음'); ok((G.spend.devRef||0)===OVS.us.c,'결산 뒤 취소인데 환급 없음: '+(G.spend.devRef||0)); });
T('[리뷰 11-02r] 연수 기간 중 입대 예정인 선수는 출발 전에 빠지고(환급), 연수 도중 입대·차출된 선수는 결과를 받지 않는다',()=>{ fresh(); G.day=KD(9,5); G.last={y:G.year-1}; const L=domestic(G.user).filter(q=>ovsElig(q)); const p=L[0], q=L[1]; ok(p&&q,'준비 실패'); ok(setOvs(p.id,'abl')==='','준비 실패');
  p.mil={unit:'상무',from:KD(12,10),until:KD(12,10)+MIL_DAYS}; G.day=KD(11,15); const d0=G.spend.dev||0; ovsGoCheck('abl'); ok(!(G.ovs||[]).some(x=>x.pid===p.id),'연수 기간 중 입대할 선수가 출국'); ok((G.spend.dev||0)===d0-OVS.abl.c,'출발 전 취소 환급 없음');
  G.ovs=[{pid:q.id,prog:'abl',go:true,c:OVS.abl.c,fy:fyNow()}]; q.mil={unit:'상무',from:G.day-5,until:G.day+500}; const s0=(q.story||[]).length, r0=JSON.stringify(q.r); ovsFin('abl'); ok(JSON.stringify(q.r)===r0&&!(q.story||[]).slice(s0).some(x=>/호주/.test(x.t)),'군 복무 중인 선수가 연수 결과를 받음'); });
T('[리뷰 11-02r] 대표팀 차출·군 복무로 잠시 빠진 선수도 내가 꾸린 선수 집계에 남는다',()=>{ fresh(); const L=tbMineAll(); ok(L.length,'준비 실패: 집계 대상 없음'); const p=L[0].p; p.ntFrom=G.day; p.ntAway=G.day+10; ok(isAway(p),'준비 실패: 차출 아님'); const M=tbMineAll(); ok(M.some(x=>x.p===p&&!x.gone&&x.away),'차출된 선수가 집계에서 빠짐'); });
T('[KBO 규정] 시상 후보 자격: 투수는 규정이닝 또는 10승·30세이브·30홀드(50세이브 70이닝 마무리도 MVP·투수 골든글러브 후보), MVP 후보는 투수 8·야수 10명 안팎',()=>{ fresh(); const y=G.year-1; const p=Object.values(G.players).find(q=>q.isP&&q.team!=null&&!q.foreign); p.hist=p.hist.filter(h=>!(h.y===y&&h.lvl==='1군'));
  p.hist.push(Object.assign({},ZB,{y,t:p.team,lvl:'1군',g:65,outs:210,er:4,sv:50,so:90,bb:12,h:40,bf:260})); G.mail=[]; const A=seasonAwards(y); ok((A.cand.mvp||[]).some(c=>c.id===p.id),'50세이브 마무리가 MVP 후보에서 빠짐'); ok((A.cand.gg.P||[]).some(c=>c.id===p.id),'50세이브 마무리가 투수 골든글러브 후보에서 빠짐');
  const nP=(A.cand.mvp||[]).filter(c=>G.players[c.id]&&G.players[c.id].isP).length, nB=(A.cand.mvp||[]).length-nP; ok(nP>=8&&nB>=10,'MVP 후보 투수 '+nP+' · 야수 '+nB); });
T('[KBO 규정] 순위: 승률이 같으면 상대 전적 → 다득점 순, 1위·5위 동률은 결정전 한 경기(상대 전적 우위 팀 홈)',()=>{ fresh(); const T=G.teams.map(t=>t.id); const r=G.sea.rec; T.forEach((id,i)=>{ r[id].w=80-i*3; r[id].l=60+i*3; r[id].t=0; }); const a=T[1], b=T[0]; r[a].w=r[b].w; r[a].l=r[b].l; G.sea.tl=T.map(()=>[]);
  for(let i=0;i<9;i++){ G.sea.tl[a].push([1,5,3,1,b,i]); G.sea.tl[b].push([-1,3,5,0,a,i]); } for(let i=0;i<7;i++){ G.sea.tl[a].push([-1,2,4,0,b,20+i]); G.sea.tl[b].push([1,4,2,1,a,20+i]); }
  const st=standingsNow(); ok(st[0].tid===a,'승률 동률인데 상대 전적 우위(9승 7패) 팀이 1위가 아님'); seasonEnd(); ok(G.ps.round==='tb'&&G.ps.cur&&G.ps.cur.round==='tb'&&G.ps.cur.hi===a,'1위 동률인데 결정전이 없음: '+(G.ps.cur&&G.ps.cur.round)); });
T('[KBO 규정] 경쟁균형세 하한 미달 제재(1회 30%·2회 50%·3회 100%)와 프랜차이즈 예외(7시즌 이상 1명, 보수 50% 제외)',()=>{ fresh(); ok(floorRate(1)===.3&&floorRate(2)===.5&&floorRate(3)===1,'하한 제재율 '+[floorRate(1),floorRate(2),floorRate(3)]);
  G.year=Math.max(G.year,2026); const p=domPayOf(G.user).sort((x,y)=>y.sal-x.sal)[0]; p.sal=2000; const c0=capPay(G.user); p.hist=p.hist.filter(h=>h.t!==G.user).concat([0,1,2,3,4,5,6].map(i=>Object.assign({},ZB,{y:G.year-7+i,t:G.user,lvl:'1군'}))); G.day++; ok(franId(G.user)===p.id,'7시즌 이상 고액 선수가 프랜차이즈 예외로 지정되지 않음'); ok(Math.abs(capPay(G.user)-(c0-1000))<=1,'상한 합계 '+c0+' → '+capPay(G.user)+'(1,000 줄어야 함)'); });
T('[KBO 규정] FA 1시즌은 1군 등록 145일, 모자란 해는 합산 · 고액 연봉 선수 2군 체류 감액 · 아시안게임 해 후반기 엔트리 30명',()=>{ fresh(); G.regTrk=G.year; const L=domestic(G.user).slice(0,2); const [p,q]=L; const s0=p.svc, s1=q.svc; p.regD={y:G.year,n:150,il:0}; q.regD={y:G.year,n:100,il:0}; q.svcD=0;
  svcCredit(p); svcCredit(q); ok(p.svc===s0+1,'145일 넘는데 1시즌 인정 안 됨'); ok(q.svc===s1&&q.svcD===100,'100일은 1시즌 미달·합산 대기여야 함'); q.regD={y:G.year,n:50,il:0}; svcCredit(q); ok(q.svc===s1+1&&q.svcD===5,'합산 145일인데 인정 안 됨 '+q.svc+'/'+q.svcD);
  simTo(()=>period()==='season'&&G.day>=G.cal.open+10); const h=playersOf(G.user).find(x=>!x.foreign&&!x.e1&&healthy(x)&&!x.isP&&!x.ys); ok(h,'준비 실패'); h.sal=600; const c0=(G.sea.cut||{})[G.user]||0, k0=(h.regD&&h.regD.cut)||0; regDaily(); ok(h.regD.cut===k0+1&&((G.sea.cut||{})[G.user]||0)-c0>=1-1e-9,'연봉 6억 2군 선수 하루 감액이 안 쌓임');
  const y0=G.year; G.year=2026; G.day=G.cal.asg+3; const lim=entryLimit(); G.year=y0; ok(lim===ENTRY_BASE+1||!(G.cal.y===2026),'2026 후반기 엔트리 '+lim); });
T('[멘탈·포수] 멘탈·꾸준함은 리그 평균 0(프로의식이 높을수록 조금 높음), 승부처에서만 더해지고, 포수 리드는 수비가 좋을수록 높으며 배터리 호흡은 같이 뛸수록 좋아진다',()=>{ fresh(); const P=Object.values(G.players).filter(p=>p.team!=null); P.forEach(initPers); const m=P.reduce((a,p)=>a+mentalOf(p),0)/P.length, c=P.reduce((a,p)=>a+consOf(p),0)/P.length;
  ok(Math.abs(m)<.15&&Math.abs(c)<.15,'리그 평균 멘탈 '+m.toFixed(2)+' · 꾸준함 '+c.toFixed(2)); const hi=P.filter(p=>p.pers.pro>=17), lo=P.filter(p=>p.pers.pro<=7); const av=(L,f)=>L.reduce((a,p)=>a+f(p),0)/L.length; ok(av(hi,consOf)>av(lo,consOf),'프로의식 높은 선수가 더 꾸준하지 않음');
  const C=P.find(p=>p.pos==='C'); const l0=catLead(C); C.r.def+=15; ok(catLead(C)>l0+5,'포수 수비가 올라도 리드가 그대로'); C.r.def-=15; const q=P.find(p=>p.isP); q.chem={}; ok(chemOf(q,C.id)===0,'처음 만난 배터리가 0이 아님'); q.chem[C.id]=60; ok(chemOf(q,C.id)>0,'60경기 호흡이 이점 없음'); ok(DWR.C>=.9,'포수 수비 비중 '+DWR.C);
  const b=P.find(p=>!p.isP); const pp=P.find(p=>p.isP); const sv=mentalOf; mentalOf=x=>x===b?2:0; CLUTCH=0; const f0=pitProbs; let seen=[]; const bp0=batProbs; batProbs=(x,bb)=>{ if(x===b)seen.push(bb); return bp0(x,bb); }; try{ CLUTCH=0; outcome(b,pp,50,0,null); CLUTCH=1; outcome(b,pp,50,0,null); }finally{ batProbs=bp0; mentalOf=sv; CLUTCH=0; } ok(seen.length===2&&seen[1]-seen[0]>1.5,'승부처 멘탈 보정이 타석에 안 들어감 '+seen.map(v=>v.toFixed(2))); });
/* ===== 공통 점검: 리뷰에서 반복된 네 가지 원인(이동 정리·시즌 구분·감독 교체·안내한 기한)을 여러 전환 뒤 한꺼번에 본다(95_audit.js stateAudit) ===== */
const auditOk=(where)=>{ const L=stateAudit(); ok(!L.length,where+': '+L.slice(0,6).join(' / ')+(L.length>6?' 외 '+(L.length-6)+'건':'')); };
const auditDays=(n,where)=>{ for(let i=0;i<n;i++){ G.live=null; G.res=null; G.stops=[]; for(const e of (G.evs||[]))if(!e.done&&e.exp<=G.day)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; } processDay(); auditOk(where+' +'+(i+1)+'일'); } };
T('[공통 점검] 시즌 중 이동(트레이드·방출)과 감독 교체 뒤 옛 구단·전임 감독 상태가 남지 않는다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+20); auditOk('시즌 중 시작');
  const mine=playersOf(G.user).filter(q=>!q.foreign&&!q.isP); const A=mine[mine.length-1], B=mine[mine.length-2]; for(const p of [A,B]){ p.promise=mkPromise(p,30); p.listed=true; }
  try{ smStart(A.id,'s'); }catch(e){} const pos=Object.keys(G.lineup||{})[0]; if(pos)G.lineup[pos]=A.id; const op=G.teams.find(t=>t.id!==G.user).id;
  G.offers=[{id:'oT',from:op,give:[],get:[A.id],exp:G.day+7,day:G.day}]; const r=answerOffer('oT',true); ok(r&&r.ok&&A.team===op,'준비 실패: 실제 트레이드 진입점으로 보내지 못함 '+(r&&r.msg)); auditDays(2,'트레이드 뒤');
  releasePlayer(B.id); auditDays(2,'방출 뒤');
  const rq=mreqAdd('out',{pid:mine[0].id},G.day+20); mreqAsk(rq,'정리 요청','테스트',[{l:'기회'},{l:'방출'}],0); G.dirFr={y:G.year,mid:G.mgr[G.user].id,arm:2}; hireMgr(G.mmarket[0].id,2); auditOk('감독 교체 직후'); auditDays(2,'감독 교체 뒤'); });
T('[공통 점검] 겨울 전환(시즌 종료·스토브리그·이직·새해) 동안 매일 상태 점검이 비어 있다',()=>{ fresh(); simTo(()=>G.rolled===G.year); auditOk('스토브리그 시작'); auditDays(20,'스토브리그');
  const nt=G.teams.find(t=>t.id!==G.user).id; G.gmSince=G.year-2; switchTeam(nt); auditOk('이직 직후'); auditDays(10,'이직 뒤'); simTo(()=>dobj(G.day).m===1&&dobj(G.day).d>=3); auditOk('새해'); auditDays(5,'새해 뒤'); });
T('[공통 점검] 소속: 구단 결정은 실행 시점의 소속에만 적용된다(징계 결정 전에 방출하면 옛 결정이 떠난 선수에게 남지 않음)',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+5); const p=playersOf(G.user).find(q=>!q.foreign&&!q.isP&&q.sal<=300); ok(p,'준비 실패');
  EVH.scandal.make({p,ty:'drink'}); const e=G.evs.find(x=>x.k==='scandal'&&!x.done); ok(e,'준비 실패: 징계 결정 없음'); releasePlayer(p.id); ok(p.team!==G.user,'준비 실패: 방출 안 됨'); const m0=p.mor, s0=p.susp||0; prInit(); const fan0=G.pr.fan;
  evPick(e.id,2); ok(p.mor===m0&&(p.susp||0)===s0,'떠난 선수에게 구단 징계 적용: 기분 '+m0+'→'+p.mor+' 정지 '+s0+'→'+p.susp); ok(G.pr.fan===fan0,'떠난 선수 징계로 우리 여론이 바뀜'); ok(e.void,'결정이 종료 처리되지 않음'); });
T('[공통 점검] 거래: 받은 트레이드 제안도 수락하는 시점의 상태로 직접 제안과 같은 규칙(상대 정원·샐러리캡)을 다시 본다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+5); const op=G.teams.find(t=>t.id!==G.user).id; const mine=playersOf(G.user).find(q=>!q.foreign&&!q.ys&&!q.faC&&!hasNtc(q));
  G.offers=[{id:'oC',from:op,give:[],get:[mine.id],exp:G.day+7,day:G.day}]; const add=[]; while(rosterN(op)<ROSTER_MAX){ const t3=G.teams.find(t=>t.id!==G.user&&t.id!==op).id; const q=Object.values(G.players).find(x=>x.team===t3&&!x.foreign&&!x.ys&&!milServing(x)&&!(x.joinY>G.year)&&!add.includes(x)); if(!q)break; /* 준비: 다른 AI 구단 선수로 상대 정원을 채운다 */ q.team=op; add.push(q); } ok(rosterN(op)===ROSTER_MAX,'준비 실패: 상대 정원 채우기');
  const r=answerOffer('oC',true); ok(!(r&&r.ok)&&mine.team===G.user,'상대 정원 초과 상태에서도 받은 제안이 성사됨'); });
T('[공통 점검] 거래: AI가 보내는 트레이드 제안은 수락 검사(상대 정원·샐러리캡)를 미리 통과하고, 그사이 막힌 제안은 다음 날 자동 철회된다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+5);
  const c0=capOf; capOf=()=>1; /* 모든 구단이 상한을 넘긴 상태: 연봉을 더 떠안는 제안은 수락 때 막힌다 */ const got=[]; let tried=0;
  try{ for(let k=0;k<30;k++)for(const t of G.teams.filter(x=>x.id!==G.user)){ G.offers=[]; G.offerContact={}; G.offSeen={}; tried++; if(aiOfferFrom(t))got.push(...G.offers); } blockDaily(); got.push(...(G.offers||[]).filter(o=>o.blk));
    const bad=got.filter(o=>offerBlockMsg(o)); ok(!bad.length,'수락하면 막힐 제안을 보냄 '+bad.length+'/'+got.length+'건: '+(bad[0]&&offerBlockMsg(bad[0]))); }
  finally{ capOf=c0; G.offers=[]; }
  const op=G.teams.find(t=>t.id!==G.user).id; const mine=playersOf(G.user).find(q=>!q.foreign&&!q.ys&&!q.faC&&!hasNtc(q)); G.offers=[{id:'oW',from:op,give:[],get:[mine.id],exp:G.day+7,day:G.day}];
  const add=[]; while(rosterN(op)<ROSTER_MAX){ const t3=G.teams.find(t=>t.id!==G.user&&t.id!==op).id; const q=Object.values(G.players).find(x=>x.team===t3&&!x.foreign&&!x.ys&&!milServing(x)&&!(x.joinY>G.year)&&!add.includes(x)); if(!q)break; q.team=op; add.push(q); }
  ok(offerBlockMsg(G.offers[0]),'준비 실패: 정원이 찼는데 제안이 막히지 않음');
  G.live=null; G.res=null; G.stops=[]; const d0=G.day; processDay(); ok(G.day>d0,'준비 실패: 하루 진행 안 됨'); ok(!(G.offers||[]).some(o=>o.id==='oW'&&offerBlockMsg(o)),'하루가 지나도 막힌 제안이 남아 있음'); });
T('[연봉 미계약] 요구와 15% 넘게 차이 나면 마감에 사인하지 않고, 미계약 동안 경기·훈련에 못 나가며 계약하면 돌아온다',()=>{ fresh(); G.day=KD(12,1); contractStart(); const C=G.contract; salTalkInit(); const id=C.ended[0]; const n=C.neg[id]; const p=G.players[id]; ok(n&&p,'준비 실패: 협상 대상 없음');
  n.st='open'; n.off=10000; n.cur=10000; n.ask=13000; confirmContracts(); ok(C.done,'확정되지 않음'); ok(p.hold&&p.hold.off===10000&&p.hold.ask===13000,'요구 차이 30%인데 미계약이 아님'); ok(!healthy(p),'미계약 선수가 출전 가능으로 나옴');
  const r=holdPay(id); ok(!p.hold&&p.sal===13000&&healthy(p)||(p.injOut>0),'요구액 계약 뒤에도 미계약이거나 연봉이 다름: '+r); });
T('[단장 이직] 현직 단장에게 오는 다른 구단 제의는 지금 연봉보다 높고, 수락하면 그 구단으로 옮긴다',()=>{ fresh(); myCInit(); const C=G.myC; ok(C&&C.tid!=null,'준비 실패: 단장 계약 없음'); C.sal=50000;
  const tid=G.teams.find(t=>t.id!==G.user).id; for(let i=0;i<20;i++){ const o=myCOffer(tid,false); ok(o.sal>C.sal,'제의 연봉이 지금 연봉보다 높지 않음: '+o.sal+' / '+C.sal); }
  G.jobs=G.jobs||[]; jobOffer(tid,false); const j=G.jobs.find(x=>x.tid===tid&&!x.done); ok(j&&j.terms.sal>C.sal,'제의가 만들어지지 않음'); const sal=j.terms.sal; jobAnswer(tid,true); ok(G.user===tid&&G.myC.tid===tid&&G.myC.sal===sal,'수락했는데 새 구단·새 연봉으로 옮기지 않음'); });
T('[드래프트] 신인 드래프트 일괄 처리(주전감 이상만 지명)는 1라운드 우리 첫 지명부터 적용되고, 1·2라운드에 기준 미달이면 건너뛰지 않고 멈춘다',()=>{ fresh(); ok(draftOrders(),'준비 실패: 지명 순서 없음'); startDraft(); const d=G.draft;
  draftRestSet('cond',4); let g=0; while(g++<40&&d.picks[d.cur].tid!==G.user)amStep(); const pk=d.picks[d.cur]; ok(pk.tid===G.user&&pk.rd===1,'준비 실패: 1라운드 우리 차례 아님');
  const tp=potTierP; let r; potTierP=()=>({n:4}); try{ r=draftRestPick(); }finally{ potTierP=tp; } ok(r&&r.me&&pk.pid>0&&pk.rule,'1라운드에서 주전감 이상 방침으로 지명하지 않음');
  g=0; while(g++<40&&!(d.picks[d.cur].tid===G.user&&d.picks[d.cur].rd===2))amStep(); const pk2=d.picks[d.cur]; ok(pk2.rd===2&&pk2.tid===G.user,'준비 실패: 2라운드 우리 차례 아님'); const c1=d.cur;
  potTierP=()=>({n:3}); try{ r=draftRestPick(); }finally{ potTierP=tp; } ok(!r&&d.cur===c1&&!pk2.pass,'2라운드 기준 미달 후보를 건너뛰거나 지명함'); });
T('[공통 점검] 정원: 정식 인원은 선수 신분·합류일로 센다(육성선수를 보내면 상대 정식 인원은 그대로)',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+5); const op=G.teams.find(t=>t.id!==G.user).id; let y=playersOf(G.user).find(q=>q.ys); if(!y){ const q=playersOf(G.user).find(x=>!x.foreign&&!x.faC&&x.sal<=100&&!x.e1); ok(q,'준비 실패'); ok(toYS(q.id)==='','준비 실패: 육성 전환'); y=q; }
  const n0=rosterN(op); const ev=evalTrade(op,[y.id],[],0); G.offers=[{id:'oY',from:op,give:[],get:[y.id],exp:G.day+7,day:G.day}]; const r=answerOffer('oY',true); ok(r&&r.ok,'준비 실패: 트레이드 '+(r&&r.msg)); ok(rosterN(op)===n0,'육성선수를 받았는데 상대 정식 인원이 '+n0+'→'+rosterN(op)); ok(ev.theirN===rosterN(op),'예상 정식 인원 '+ev.theirN+' / 실제 '+rosterN(op)); });
T('[공통 점검] 보직: 코치 승격·맞교환 뒤 지도력·육성력은 새 보직의 세부 능력으로 계산된 값이다',()=>{ fresh(); const C=G.coach[G.user]; /* 초기 감독 사단에 빈자리가 있어도 승격/맞교환 시나리오를 명시적으로 준비한다. */ if(!C.pc)C.pc=mkCoach('pc');if(!C.hc)C.hc=mkCoach('hc');const role=Object.keys(PROMO).find(k=>C[k]&&C[PROMO[k]]&&JSON.stringify(CDOM[k])!==JSON.stringify(CDOM[PROMO[k]])); /* 담당 분야가 다른 자리로 올라가는 경우 */ ok(role,'준비 실패: 승격할 자리 없음'); const c=C[role], old=C[PROMO[role]]; const r=promoteCoach(role); ok(c.role===PROMO[role],'준비 실패: 승격 안 됨 '+r);
  const want=x=>{ const D=CDOM[x.role], a=x.ab; const dom=D.reduce((s2,k)=>s2+a[k],0)/D.length; return [Math.round(clamp(dom*.8+a.ana*.2,30,90)),Math.round(clamp(dom*.5+a.yng*.5,30,90))]; };
  for(const x of [c,old])ok(JSON.stringify([x.sk,x.dv])===JSON.stringify(want(x)),x.name+' '+CROLE[x.role].l+' 저장 '+[x.sk,x.dv]+' / 새 보직 기준 '+want(x)); });
T('[공통 점검] 시즌 구분: 겨울에 본 다음 시즌 외국인 총액·한도·국내 연봉이 달력 연도만 바뀐 같은 상태의 값과 같다',()=>{ fresh(); simTo(()=>G.rolled===G.year&&dobj(G.day).m===12); const S=JSON.stringify(G);
  for(const t of G.teams){ const f=foreignOf(t.id).find(p=>p.foreign==='용병'); if(f&&t.id===G.user){ f.ctT=f.team; f.opt={a:500,until:G.year,c:'x'}; } }
  const A=G.teams.map(t=>auditMoney(t.id)); const y=G.year; G.year=y+1; G.day=dnum(y+1,1,2); const B=G.teams.map(t=>auditMoney(t.id));
  G.teams.forEach((t,i)=>ok(JSON.stringify(A[i])===JSON.stringify(B[i]),tshort(t.id)+' 12월 '+JSON.stringify(A[i])+' / 1월 '+JSON.stringify(B[i]))); G=JSON.parse(S); });
T('[KBO 웨이버] 방출하면 7일 공시 뒤 하위 구단이 계약을 그대로 이어받고 방출 정산금은 돌려받는다',()=>{ fresh(); G.teams.forEach((t,i)=>{ G.sea.rec[t.id]={w:i,l:10-i,t:0}; }); const p=domestic(G.user).find(q=>!q.ys&&!q.foreign); ok(p&&period()!=='season','준비 실패 '+period()); setOvr(p,75); p.faC=true; p.yrs=2; p.cyrs=3; p.sal=300;
  const s0=G.spend.rel||0; releasePlayer(p.id); ok(p.team==null&&p.wv&&p.wv.ok&&p.wv.end===G.day+7,'웨이버 공시 안 됨'); ok((G.spend.rel||0)-s0===300,'정산금 '+((G.spend.rel||0)-s0)); ok(!freeList().includes(p)&&String(signFree(p.id,G.teams.find(t=>t.id!==G.user).id)).includes('웨이버'),'공시 중인데 자유계약으로 영입됨');
  const w=JSON.parse(JSON.stringify(p.wv)); const exp=wvOrder().find(t=>t!==G.user&&wvWants(t,p,w)); ok(exp!=null,'준비 실패: 데려갈 구단 없음'); G.day=w.end-1; wvDaily(); ok(p.wv&&p.team==null,'7일 전에 처리됨'); G.day=w.end; wvDaily();
  ok(p.team===exp,'우선권(성적 역순) 구단이 아님: '+p.team+' / '+exp); ok(p.sal===300&&p.yrs===2&&p.faC&&p.cyrs===3,'계약 승계 안 됨 '+JSON.stringify([p.sal,p.yrs,p.faC,p.cyrs])); ok((G.spend.rel||0)===s0,'정산금 반환 안 됨'); ok(!p.wv&&p.freeSince==null,'공시 상태가 남음'); });
T('[KBO 웨이버] 우리 양수 신청은 성적 역순으로 우선권을 받고, 7월 24일 뒤 공시와 11월 보류 정리는 양수 대상이 아니다',()=>{ fresh(); const A=G.teams.find(t=>t.id!==G.user).id; G.teams.forEach((t,i)=>{ G.sea.rec[t.id]={w:5+i,l:5,t:0}; }); G.sea.rec[G.user]={w:0,l:10,t:0};
  const q=domestic(A).find(x=>!x.ys&&!x.foreign); setOvr(q,74); q.sal=200; q.yrs=1; toFree(q,'테스트'); ok(q.wv&&q.wv.from===A,'AI 방출이 공시 안 됨'); if(rosterN(G.user)>=ROSTER_MAX)trimRoster(G.user,ROSTER_MAX-2);
  ok(String(wvClaim(q.id)).includes('신청'),'신청 실패'); ok(q.wv.cl.includes(G.user),'신청 기록 없음'); G.day=q.wv.end; wvDaily(); ok(q.team===G.user&&q.sal===200,'최하위인 우리가 못 데려옴 '+q.team); ok((G.wvLog||[])[0].to===G.user,'기록 없음');
  const r=domestic(A).find(x=>!x.ys&&!x.foreign); G.day=KD(7,26); ok(period()==='season','준비 실패 '+period()); toFree(r,'테스트'); ok(r.wv&&!r.wv.ok,'마감 뒤 공시가 양수 가능'); ok(String(wvClaim(r.id)).includes('양도'),'마감 뒤 신청이 받아짐'); G.day=r.wv.end; wvDaily(); ok(r.team==null&&!r.wv&&freeList().includes(r),'마감 뒤 공시 선수가 자유계약이 안 됨');
  G.day=KD(11,10); G.ps=null; ok(period()==='off','준비 실패'); const s=domestic(A).find(x=>!x.ys&&!x.foreign); toFree(s,'보류 제외'); ok(!s.wv&&freeList().includes(s),'11월 보류 정리가 웨이버로 감'); });
T('[KBO 2차 드래프트] 격년·보호 35명·성적 역순 3라운드(하위 3팀 5라운드)·구단당 4명·양도금·제외 대상을 지킨다',()=>{ fresh(); ok(sdYear(2025)&&sdYear(2027)&&!sdYear(2026)&&!sdYear(2021),'시행 연도'); G.teams.forEach((t,i)=>{ G.sea.rec[t.id]={w:i,l:10-i,t:0}; }); G.day=KD(11,12); G.ps=null;
  const rk=domestic(G.user).find(x=>!x.foreign); rk.draft={y:G.year-1,rd:1,no:1,tid:G.user}; const ml=domestic(G.user).find(x=>!x.foreign&&x!==rk); ml.mil={unit:'현역',from:G.day-10,until:G.day+400}; const ys=domestic(G.user).find(x=>!x.foreign&&x!==rk&&x!==ml); ys.ys=true;
  sdOpen(); const S=G.sd2; ok(S&&S.stage==='protect'&&S.exp>=G.day,'보호 단계 아님'); ok(S.seq.length===36,'지명 순번 '+S.seq.length); ok(S.seq.filter(s=>s.rd>3).every(s=>S.order.slice(0,3).includes(s.tid)),'4·5라운드가 하위 3팀 밖'); ok(S.order[0]===standingsNow().slice(-1)[0].tid,'1순위가 최하위가 아님');
  const pool=sdPool(G.user); ok(![rk,ml,ys].some(x=>pool.includes(x))&&!pool.some(x=>x.foreign),'제외 대상이 명단에 있음'); ok(Object.values(S.prot).every(a=>a.length<=35),'보호 35명 초과');
  ok(String(sdSubmit([])).includes('0명'),'제출 실패'); const c0=G.teams.map(t=>t.cash); const sp0=G.spend.comp||0; sdStart(); let guard=0, mine=0;
  while(S.stage==='pick'&&guard++<40){ const s=S.seq[S.cur]; ok(s.tid===G.user&&S.wait===S.cur,'우리 차례가 아닌데 멈춤'); if(!mine){ const c=sdCands(G.user)[0]; ok(c&&c.team!==G.user,'후보 없음'); sdPick(c.id); ok(c.team===G.user,'지명 선수가 안 옴'); ok((G.spend.comp||0)-sp0===sdFee(s.rd),'양도금 '+((G.spend.comp||0)-sp0)); mine=1; } else sdPick(null); }
  ok(S.stage==='done','끝나지 않음'); const P=S.seq.filter(s=>s.pid); ok(P.length>0,'아무도 안 뽑음'); for(const t of G.teams)ok(P.filter(s=>s.from===t.id).length<=4,tshort(t.id)+' 4명 초과 유출');
  for(const s of P){ const q=G.players[s.pid]; ok(q.team===s.tid&&s.from!==s.tid,'이적 안 됨'); ok(!(S.prot[s.from]||[]).includes(s.pid),'보호선수 지명'); ok(s.fee===[400,300,200,100][Math.min(s.rd,4)-1],'양도금 표 '+s.fee); ok(s.rd>2||q.sd2&&q.sd2.need===(s.rd===1?50:30),'의무 등록 기록 없음'); }
  ok(![rk,ml,ys].some(x=>x.team!==G.user),'제외 대상이 지명됨'); const ai=P.find(s=>s.tid!==G.user&&s.from!==G.user); if(ai){ const i=G.teams.findIndex(t=>t.id===ai.tid); ok(G.teams[i].cash<=c0[i]-ai.fee+P.filter(s=>s.from===ai.tid).reduce((a,s)=>a+s.fee,0),'AI 양도금 미지급'); } });
T('[KBO 2차 드래프트] 기한이 지나면 운영팀이 보호명단을 내고 우리 차례는 건너뛰며, 의무 등록 미달 선수는 원소속으로 돌아간다',()=>{ fresh(); G.teams.forEach((t,i)=>{ G.sea.rec[t.id]={w:i,l:10-i,t:0}; }); G.day=KD(11,12); G.ps=null; sdOpen(); const S=G.sd2; G.day=S.exp; sd2Daily(G.day); ok(S.stage!=='protect'&&S.prot[G.user]&&S.prot[G.user].length===Math.min(35,sdPool(G.user).length),'자동 보호명단 아님');
  let g=0; while(S.stage==='pick'&&g++<10){ G.day=Math.max(G.day,S.exp); sd2Daily(G.day); } ok(S.stage==='done','자동으로 끝나지 않음'); ok(S.seq.filter(s=>s.tid===G.user).every(s=>!s.pid),'동의 없이 양도금을 쓰고 지명함');
  const s=S.seq.find(s=>s.pid&&s.rd===1&&s.tid!==G.user)||S.seq.find(s=>s.pid&&s.rd<=2); ok(s,'준비 실패: 1·2라운드 지명 없음'); const x=G.players[s.pid], o=x.sd2; ok(o&&o.to===s.tid,'의무 기록 없음');
  o.y=G.year-2; o.reg=0; G.regTrk=G.year; x.regD={y:G.year,n:o.need-1,il:0}; const back=rosterN(o.from)<ROSTER_MAX&&(o.from===G.user||aiVal(team(o.from),x)>=0); const ca=o.from===G.user?null:team(o.from).cash; sdRegCheck(G.cal.end+1);
  ok(!x.sd2,'의무 기록이 남음'); if(back){ ok(x.team===o.from,'원소속 복귀 안 됨'); if(ca!=null)ok(team(o.from).cash===ca-Math.round(o.fee/2),'양도금 50% 반환 안 됨'); } else ok(x.team==null&&!x.wv,'복귀 거부인데 자유계약 아님');
  const s2=S.seq.find(t=>t.pid&&t.rd<=2&&t!==s&&G.players[t.pid].sd2); if(s2){ const y=G.players[s2.pid]; y.sd2.y=G.year-2; y.regD={y:G.year,n:60,il:0}; sdRegCheck(G.cal.end+1); ok(y.team===s2.tid&&!y.sd2,'의무 등록을 채웠는데 돌려보냄'); } });
T('[리뷰 11-04] 구장 6~8단계 프리미엄석·전광판 결산 수입은 예산 전망(stadPower)과 같다',()=>{ fresh(); const S=stadOf(G.user); S.lv.prem=8; S.lv.vis=8; S.lv.fnb=2; const P=stadProj(G.user); simTo(()=>G.last&&G.last.y===G.year); const f=G.last.fins&&(G.last.fins[G.user]||G.last.fins.find?.(x=>x.tid===G.user)); const m=(f&&f.inc||[]).find(x=>x[0]==='구장 부대 수입'); ok(m,'준비 실패'); ok(Math.abs(m[1]-(P.prem+P.ad))<=2,'결산 '+m[1]+' / 전망 '+(P.prem+P.ad)); });
T('[리뷰 11-04] 경쟁균형세 하한은 2027년 60억6,538만 원(KBO)에서 시작한다',()=>{ fresh(); ok(Math.abs(floorOf(2027)-6065)<=1,'2027 하한 '+floorOf(2027)); ok(floorOf(2028)>floorOf(2027),'이후 상향 안 됨'); });
T('[리뷰 11-04] 우승 포상의 시설 선택은 3단계 위로도 올린다(FAC_MAX)',()=>{ fresh(); facInit(); for(const k of FACK){ G.fac.it[k]=3; delete G.fac.bld[k]; } facRecalc(); const t=team(G.user); const c0=t.cash; const e={data:{}}; const r=EVH.champGift.pick(e,3); ok(FACK.some(k=>G.fac.it[k]===4),'3단계 시설이 안 오름: '+r); ok(t.cash===c0,'대신 20억을 받음'); });
T('[리뷰 11-04] 엔트리: 포스트시즌 30명, 아시안게임 해 확대 엔트리 34명(KBO 2026)',()=>{ fresh(); const per0=period; try{ period=()=>'post'; ok(entryLimit()===ENTRY_BASE+1,'포스트시즌 '+entryLimit()); period=()=>'season'; const y0=G.year; G.year=2026; G.day=KD(8,26); const ag=NT_EV.ag.yr(2026); const L=entryLimit(); G.year=y0; ok(!ag||L===ENTRY_BASE+1+ENTRY_EXP,'AG 해 8/26 '+L); } finally{ period=per0; } });
T('[리뷰 11-04] KBO 개인 타이틀 14개 부문, 규정타석 446(144경기 반올림)·지명타자 골든글러브 297타석',()=>{ fresh(); const ks=TITLES.map(x=>x[1]); for(const k of ['r','h','obp','slg','wpct','hld'])ok(ks.includes(k),'타이틀 '+k+' 없음'); ok(ttVal({ab:400,h:120,bb:40,hbp:5,sf:5},'obp')===165/450,'출루율 계산');
  const y=G.year-1; const p=Object.values(G.players).find(q=>!q.isP&&q.team!=null); const r0=G.sea.rec[p.team]; r0.w=72; r0.l=72; r0.t=0; const g=tgp(p.team); ok(g===144,'준비 실패: 경기 수 '+g); const need=Math.round(g*3.1); p.hist=p.hist.filter(h=>!(h.y===y&&h.lvl==='1군')); p.hist.push(Object.assign({},ZB,{y,t:p.team,lvl:'1군',g:140,pa:need,ab:need-50,h:Math.round((need-50)*.6),bb:50}));
  ok(titleBoard(y,'obp',false).some(x=>x.p===p),'규정타석('+need+') 정확히 채운 선수가 출루율 순위에서 빠짐'); });
T('[리뷰 11-04] 시즌 중 교체 외국인은 KBO 월 10만 달러 상한(연 60만 달러 기준)으로 계약한다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+10); const q=newForeign('용병',{market:true}); ok(q.ask<=60*USD,'시즌 중 새 후보 요구액 '+q.ask); q.ask=100*USD; const f=foreignOf(G.user).find(x=>x.foreign==='용병'); if(f){ G.players[f.id].team=null; } q.team=null; signForeign(G.user,q.id); ok(q.sal<=60*USD,'시즌 중 계약 연봉 '+q.sal); });
T('[리뷰 11-04] FA는 나이 제한이 없다(KBO): 38세도 자격을 얻는다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.foreign); p.age=38; p.svc=20; p.lastFA=null; p.faC=false; p.yrs=1; const src=String(offseason); ok(!/p\.age<=37/.test(src),'FA 자격에 37세 제한이 남음'); });
T('[리뷰 11-04] 저장 크기: 타구 분포 좌표는 선수당 최근 250개, 골든글러브 투표지 원본은 남기지 않는다',()=>{ fresh(); const p=Object.values(G.players).find(q=>!q.isP&&q.team!=null); for(let i=0;i<400;i++)sprAdd(p,p,'OUT',{pos:'SS',t:'GB'}); ok(p.spr.points.length===250,'좌표 '+p.spr.points.length); ok(p.spr.z.SS[0]>=400,'구역 집계는 전체'); const y=G.year-1; G.mail=[]; const A=seasonAwards(y); for(const k in A.ggVote.ballots)ok(typeof A.ggVote.ballots[k]==='number','투표지 원본이 저장됨 '+k); });
T('[리뷰 11-04] 사구가 경기별 기록·최근 10경기·좌우 기록 출루율에 들어간다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP); glAdd(p,G.day,{pa:4,ab:2,h:1,bb:1,hbp:1,so:0,hr:0,d:0,tr:0}); const r=p.gl.g[p.gl.g.length-1]; ok(r[8]===1,'경기별 기록에 사구 없음 '+JSON.stringify(r)); });
/*KBO-BEGIN*/
T('[KBO 부상 대체 외국인] 6주 이상 부상만 대체 가능하고 교체 횟수를 쓰지 않으며 월 10만 달러 한도를 지킨다',()=>{ fresh(); G.day=G.cal.open+20; const yb=foreignOf(G.user).filter(p=>p.foreign==='용병'); ok(yb.length>=2,'준비 실패: 외국인 '+yb.length); const o=yb[0], o2=yb[1];
  o.injOut=50; o2.injOut=20; const used=fReplUsed(G.user); const q=newForeign('용병',{isP:o.isP,market:true}); q.ask=900; G.fmarket.push(q.id);
  ok(fTmpErr(G.user,o2)!=='','6주 미만 부상도 대체 가능'); ok(signTempForeign(G.user,o2.id,q.id)!=="",'6주 미만 부상인데 대체 계약됨'); ok(q.team==null,'실패한 계약이 선수를 바꿈');
  const err=signTempForeign(G.user,o.id,q.id); ok(!err,'대체 계약 실패: '+err); ok(q.team===G.user&&o.frehab===q.id&&q.ftmp&&q.ftmp.o===o.id,'대체 상태가 저장되지 않음');
  ok(fReplUsed(G.user)===used,'부상 대체가 교체 횟수를 씀'); ok(q.ftmp.fee<=F_TMP_MON&&q.ftmp.fee>0,'월 보수 한도 위반 '+q.ftmp.fee); ok(!foreignOf(G.user).includes(o)&&foreignOf(G.user).includes(q),'재활 명단 선수가 외국인 인원에 남음');
  o.injOut=0; ok(!healthy(o),'재활 명단 선수가 결정 전에 출전 가능'); const r=G.players[o.id]; ok(r&&r.team===G.user,'원 선수 보류권이 사라짐');
  G=JSON.parse(JSON.stringify(G)); const q2=G.players[q.id], o3=G.players[o.id]; ok(q2.ftmp&&o3.frehab===q2.id,'저장 후 대체 상태 유실');
  fTmpDaily(); const e=(G.evs||[]).find(x=>x.k==='ftmp'&&!x.done); ok(e&&e.opts.length===2,'원 선수 복귀 결정이 오지 않음'); evPick(e.id,1);
  ok(!G.players[q.id].ftmp&&G.players[q.id].team===G.user,'정식 전환 실패'); ok(!(G.players[o.id]&&G.players[o.id].team===G.user),'원 선수가 남아 있음'); ok(fReplUsed(G.user)===used+1,'정식 전환이 교체 1회를 쓰지 않음'); });
T('[KBO 부상 대체 외국인] 원 선수가 돌아오면 대체 선수가 떠나고, 정규시즌이 끝나면 대체 계약도 끝난다',()=>{ fresh(); G.day=G.cal.open+20; const o=foreignOf(G.user).find(p=>p.foreign==='용병'); o.injOut=60; const q=newForeign('용병',{isP:o.isP,market:true}); G.fmarket.push(q.id);
  const sp0=G.sea.fspend[G.user]||0; ok(!signTempForeign(G.user,o.id,q.id),'준비 실패'); ok((G.sea.fspend[G.user]||0)>sp0,'대체 보수가 지출에 안 잡힘');
  G.day+=45; const paid=q.ftmp.paid; fTmpDaily(); ok(q.ftmp.paid===paid+30,'6주 뒤 연장 비용이 붙지 않음'); o.injOut=0; fTmpDaily(); const e=G.evs.find(x=>x.k==='ftmp'&&!x.done); ok(e,'결정 없음'); G.day=e.exp; evDaily();
  ok(!G.players[q.id],'기본 선택(원 선수 복귀)인데 대체 선수가 남음'); ok(!o.frehab&&healthy(o)&&foreignOf(G.user).includes(o),'원 선수가 돌아오지 않음');
  const o2=foreignOf(G.user).find(p=>p.foreign==='용병'); o2.injOut=60; const q3=newForeign('용병',{isP:o2.isP,market:true}); G.fmarket.push(q3.id); ok(!signTempForeign(G.user,o2.id,q3.id),'두 번째 대체 실패');
  G.day=G.cal.end+1; fTmpDaily(); ok(!G.players[q3.id]&&!o2.frehab,'정규시즌 뒤에도 대체 선수가 남음(포스트시즌 출전 불가)'); });
T('[KBO 부상 대체 외국인] AI 구단도 시즌 안에 돌아올 외국인 부상에 대체 선수를 쓰고, 8월 15일 뒤에는 막힌다',()=>{ fresh(); G.day=G.cal.open+20; const t=G.teams.find(x=>x.id!==G.user&&foreignOf(x.id).some(p=>p.foreign==='용병')); const o=foreignOf(t.id).find(p=>p.foreign==='용병'); o.injOut=50;
  for(let i=0;i<4;i++){ const q=newForeign('용병',{isP:o.isP,market:true}); G.fmarket.push(q.id); } const used=fReplUsed(t.id); aiForeignReview(t.id);
  ok(o.frehab&&G.players[o.frehab]&&G.players[o.frehab].ftmp,'AI가 부상 대체를 쓰지 않음'); ok(fReplUsed(t.id)===used,'AI 부상 대체가 교체 횟수를 씀');
  const u=foreignOf(G.user).find(p=>p.foreign==='용병'); u.injOut=50; G.day=foreignDL()+1; ok(fTmpErr(G.user,u).includes('8월 15일'),'8월 15일 뒤에도 대체 가능'); });
T('[KBO 지명권 트레이드] 다음 드래프트 지명권만, 선수와 맞바꿀 때만 넘기고, 넘겨받은 지명권은 원래 구단 순번에 쓴다',()=>{ fresh(); ok(tradeOpen(),'준비 실패: 트레이드 기간 아님 '+period()); const y=pkYear(); ok(pkHeld(G.user).length===DRAFT_ROUNDS,'처음 지명권 수 '+pkHeld(G.user).length);
  const t=G.teams.filter(x=>x.id!==G.user&&rosterN(x.id)<ROSTER_MAX-1).sort((a,b)=>capPay(a.id)-capPay(b.id))[0]; ok(t,'준비 실패: 받을 구단 없음'); const tid=t.id; const mine=domestic(G.user).filter(p=>!p.ys&&!p.foreign&&!(p.joinY>G.year)&&!hasNtc(p));
  ok(String(proposeTrade(tid,[mine[0].id],[],0,{give:['1:'+G.user]}).msg).includes('선수와 맞바꿀'),'선수 없이 지명권을 넘김');
  const k='3:'+tid; ok(evalTrade(tid,[mine[0].id],[],0,{get:[k]}).gain<evalTrade(tid,[mine[0].id],[],0).gain,'상대가 지명권 가치를 치지 않음'); ok(pkVal(t,'1:'+tid)>pkVal(t,'5:'+tid),'1라운드가 5라운드보다 싸게 매겨짐');
  const p=mine.filter(q=>evalTrade(tid,[q.id],[],0,{get:[k]}).ok&&capPayAs(tid,[q.id],[])<=capOf(G.year)).sort((a,b)=>b.sal-a.sal)[0]; ok(p,'준비 실패: 받아들일 선수 없음');
  const r=proposeTrade(tid,[p.id],[],0,{get:[k]}); ok(r.ok,'트레이드 실패: '+r.msg); ok(p.team===tid,'선수 이동 안 됨'); ok(pkOwner(y,3,tid)===G.user&&pkHeld(G.user).includes(k)&&!pkHeld(tid).includes(k),'지명권 이동 안 됨');
  ok(G.trades[G.trades.length-1].pk&&G.trades[G.trades.length-1].pk.get.length===1,'거래 기록에 지명권 없음');
  if(y===G.year&&draftOrders()){ startDraft(); const P=G.draft.picks; ok(P.length===DRAFT_ROUNDS*G.teams.length,'지명 수 '+P.length); const x=P.find(q=>q.rd===3&&q.from===tid); ok(x&&x.tid===G.user,'넘겨받은 지명권이 우리 차례가 아님'); const no=draftOrders().r2.indexOf(tid)+1; ok(x.no===no,'원래 구단 순번이 아님 '+x.no+'/'+no);
    ok(String(pkCheck(tid,[p.id],[],{give:['2:'+G.user]})).includes('진행 중'),'드래프트 중 지명권 거래 허용'); ok(pkYear()===G.year+1&&pkHeld(G.user).length===DRAFT_ROUNDS,'드래프트가 열린 뒤 다음 해 지명권이 아님'); } });
T('[KBO ABS·피치 클락] 연도별 존·제한 시간, 정식 도입 뒤 경기 시간 단축, 경기 기록·리그 평균·개막 안내',()=>{ fresh(); ok(absZone(2024).top===56.35&&absZone(2025).top===55.75&&absZone(2026).bot===27.04&&absZone(2023)===null,'ABS 존');
  ok(pClock(2024).trial&&pClock(2025).none===20&&pClock(2025).on===25&&pClock(2026).none===18&&pClock(2026).on===23,'피치 클락 시간'); ok(gtBase(2024)-gtBase(2025)===8,'정식 도입 뒤 8분 단축이 아님');
  G.day=G.cal.open; for(const t of G.teams)setEntry(t.id); const op=G.teams.find(t=>t.id!==G.user).id; const g=simGame(G.day,G.user,op,false); const rec=gameRecord(G.day,G.user,op,g,''); const pc=sum(['h','a'].map(k=>sum(rec.box[k].pit.map(x=>x.pc||0))));
  ok(rec.min===Math.round(gtBase(G.year)*pc/GT_PC)&&rec.min>100&&rec.min<300,'경기 시간 '+rec.min+' / 투구 '+pc); const y0=G.year; G.year=2024; const m24=gameMin(g); G.year=y0; ok(m24>rec.min,'시범 운영 해가 더 짧음');
  G.gt=null; gtAdd(180); gtAdd(190); ok(gtAvg()===185,'리그 평균 '+gtAvg()); G.mail=[]; gameRulesMail(G.cal.open); const m=G.mail.find(x=>String(x.subj).includes('ABS'));
  ok(m&&String(m.body).includes('55.75')&&String(m.body).includes(pClock(G.year).none+'초'),'개막 규정 안내 없음'); });
/*KBO-END*/
T('리그 수준: 트리플A는 우리 리그보다 살짝 높아 같은 타자도 성적이 조금 덜 나온다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP); const a=batProbs(p,LG_ADJ['트리플A'][0]), k=batProbs(p,0); ok(a.k>k.k&&a.babip<k.babip,'트리플A에서 삼진이 더 적거나 BABIP가 더 높음(우리 리그보다 쉬운 리그로 잡힘)'); const q=G.players[domestic(G.user).find(x=>x.isP).id]; ok(pitProbs(q,LG_ADJ['트리플A'][1]).k<pitProbs(q,0).k,'트리플A에서 투수 삼진율이 더 높음'); });

T('[리뷰 설계] 트레이드 확인은 우리 정식 인원과 정리해야 할 인원을 보여 준다(우리 쪽 초과는 막지 않는다)',()=>{ fresh(); const o=G.teams.find(t=>t.id!==G.user).id; const n=rosterN(G.user); const give=ownedOf(G.user).filter(p=>!p.ys&&!p.foreign).slice(0,1).map(p=>p.id); const pool=ownedOf(o).filter(p=>!p.ys&&!p.foreign).map(p=>p.id); const k=ROSTER_MAX-n+3; ok(pool.length>=k,'준비 실패: 상대 선수 부족');
  const tx=tradeRosterTxt(give,pool.slice(0,k)); ok(tx.includes('트레이드 후 정식 '+(ROSTER_MAX+2)+'/'+ROSTER_MAX+'명')&&tx.includes('2명 정리 필요'),'초과 안내 틀림: '+tx);
  const t0=tradeRosterTxt(give,[]); ok(t0.includes((n-1)+'/'+ROSTER_MAX)&&!t0.includes('정리 필요'),'한도 안인데 정리 안내: '+t0); });
T('[리뷰 설계] AI 연봉 하한 맞추기는 올린 선수의 계약 이력에 이전→새 연봉과 연수를 남긴다',()=>{ fresh(); G.year=2027; const t=G.teams.find(t=>t.id!==G.user); t.cash=0; for(const p of domestic(t.id))p.sal=Math.min(p.sal,40); const s0={}; for(const p of domestic(t.id))s0[p.id]=p.sal; aiFloorFix(t.id);
  const ch=domestic(t.id).filter(p=>p.sal!==s0[p.id]); ok(ch.length>0,'준비 실패: 하한 맞추기가 일어나지 않음');
  for(const p of ch){ const st=(p.story||[]).find(x=>x.t.includes('연봉 하한')); ok(st&&st.k==='move'&&st.t.includes(money(s0[p.id]))&&st.t.includes(money(p.sal)),p.name+' 계약 이력 없음'); ok(st.t.includes(p.yrs+'년'),p.name+' 계약 연수 없음: '+st.t); } });
T('[리뷰 설계] 상무 복무 선수 성장에는 우리 구단 시설·코치·감독 성향이 적용되지 않는다',()=>{ fresh(); const p=domestic(G.user).filter(q=>!q.foreign&&q.age<=23).sort((a,b)=>(b.pot-ovr(b))-(a.pot-ovr(a)))[0]; ok(p,'준비 실패'); p.dt='norm'; p.pot=Math.max(p.pot,ovr(p)+15); p.mil={unit:'상무',from:G.day-1,until:G.day+400}; ok(milServing(p),'준비 실패: 복무 아님');
  const snap=JSON.stringify(p), f0=facEff, c0=coachDevMult, m=G.mgr[G.user], y0=m.youth;
  const run=(fx,cx,yo)=>{ for(const k of Object.keys(p))delete p[k]; Object.assign(p,JSON.parse(snap)); facEff=()=>fx; coachDevMult=()=>cx; m.youth=yo; globalThis.__seed(77); develop(p); return JSON.stringify(p.r); };
  let a,b; try{ run(FAC[3],1,50); /* 첫 성장 때 한 번만 만드는 전역 값(캐시)을 먼저 채운다 */ a=run(FAC[1],.7,20); b=run(FAC[5],1.4,90); } finally { facEff=f0; coachDevMult=c0; m.youth=y0; } ok(a===b,'우리 구단 시설·코치·감독이 상무 선수 성장에 반영됨'); });
T('[리뷰 설계] 현역 복무 선수는 야구 훈련을 못 해 능력이 늘지 않는다(조금씩 떨어진다)',()=>{ fresh(); const p=domestic(G.user).filter(q=>!q.foreign&&q.age<=22).sort((a,b)=>(b.pot-ovr(b))-(a.pot-ovr(a)))[0]; ok(p,'준비 실패'); p.dt='norm'; p.pot=Math.min(80,ovr(p)+25); p.mil={unit:'현역',from:G.day-1,until:G.day+400};
  const snap=JSON.stringify(p); let up=0, down=0; for(let s=1;s<=6;s++){ for(const k of Object.keys(p))delete p[k]; Object.assign(p,JSON.parse(snap)); const r0={...p.r}; globalThis.__seed(s); develop(p); for(const k in r0){ if(p.r[k]>r0[k]+1e-9)up++; if(p.r[k]<r0[k])down++; } }
  ok(up===0,'현역 복무 중 능력이 오름 '+up+'건'); ok(down>0,'현역 복무 중 하락이 없음'); });
T('[리뷰 설계] 군 복무 중에는 구단 훈련 지시·포지션 전환·구단 생활 사고가 없고 육성 탭 안내 문구가 있다',()=>{ fresh(); G.day=G.cal.open+10; const p=domestic(G.user).find(q=>!q.isP&&!q.foreign&&milFree(q)); ok(p,'준비 실패'); p.mil={unit:'상무',from:G.day-1,until:G.day+400}; ok(milServing(p),'준비 실패: 복무 아님');
  const f=Object.keys(TRN[trnG(p)]).find(k=>k!=='bal'); const r=trnSet(p.id,f); ok(!(G.trn&&G.trn[p.id])&&String(r).includes('군 복무'),'복무 중 훈련 지시가 걸림');
  const pos=POS_F.find(k=>k!==p.pos); posConv(p.id,pos); ok(!p.pconv,'복무 중 포지션 전환이 시작됨');
  ok(milTrainTxt(p).includes('상무 야구단')&&milTrainTxt(p).includes('적용되지 않'),'상무 훈련 환경 안내 없음'); p.mil.unit='현역'; ok(milTrainTxt(p).includes('늘지 않'),'현역 훈련 환경 안내 없음'); p.mil.unit='상무';
  initPers(p); p.pers.pro=1; p.injOut=0; delete p.badY; for(let i=0;i<300;i++)misbehaveMonth(); ok(!p.badY,'복무 중 선수에게 구단 생활 사고(통금·지각)가 생김'); });
T('외국인 예상 능력순: 우리 발굴 후보라고 앞에 끼우지 않고 예상 능력으로만 줄 세운다(1위가 더 낮게 보이던 문제)',()=>{ fresh(); const a=newForeign('용병',{market:true}), b=newForeign('용병',{market:true}); a.fsrc='scout'; a.fknow=[G.user]; a.fpub=G.day+30; ok(fMineFind(a),'준비 실패: 발굴 후보가 아님');
  const L=[a,b].map(p=>{ const rp=scoutReport(p); return {p,rp,fs:fScout(p,rp)}; }); L[0].fs.score=40; L[1].fs.score=60; L.sort(fSortBy('rk')); ok(L[0].p===b,'점수가 낮은 우리 발굴 후보가 추천순 맨 앞'); delete G.players[a.id]; delete G.players[b.id]; });

T('외국인 타자 포지션: 1루·코너 외야가 대부분이고 2루·유격·포수는 드물며, 거포는 1루·코너 외야에 몰린다(실제 KBO 영입 비중)',()=>{ fresh(); const C={}, P={}; let n=0;
  for(let i=0;i<1500;i++){ const p=newForeign('용병',{isP:false,market:true}); n++; C[p.pos]=(C[p.pos]||0)+1; (P[p.pos]=P[p.pos]||[]).push(p.r.pow); delete G.players[p.id]; }
  const sh=k=>k.reduce((s,x)=>s+(C[x]||0),0)/n, mp=k=>{ const a=k.flatMap(x=>P[x]||[]); return a.reduce((s,v)=>s+v,0)/a.length; };
  ok(sh(['1B','LF','RF'])>=.6,'1루·코너 외야 비중 '+Math.round(sh(['1B','LF','RF'])*100)+'%'); ok(sh(['2B','SS','C'])<=.12,'2루·유격·포수 비중 '+Math.round(sh(['2B','SS','C'])*100)+'%');
  ok(mp(['1B','LF','RF'])-mp(['CF','2B','SS'])>=8,'1루·코너 외야와 중앙 수비 포지션의 장타력 차이 '+(mp(['1B','LF','RF'])-mp(['CF','2B','SS'])).toFixed(1)); });

T('포지션 가치: 같거나 조금 낮은 능력이라도 수비 좋은 유격·포수가 1루보다 귀하게 평가된다(구단 판단·연봉)',()=>{ fresh();
  const mk=(pos,disp,def)=>{ const p=newPlayer({age:28,isP:false,base:50,pos,team:null}); p.age=28; let raw=20; while(dv(raw)<disp)raw+=.1; setOvr(p,raw); p.r.def=def; setOvr(p,raw); return p; };
  const fb=mk('1B',70,46), ss=mk('SS',60,70), c=mk('C',60,58); /* 유격 수비 70: 66이면 구단별 평가 잡음(선수 번호로 정해짐) 평균 안에서 1루와 뒤집히기도 했다 */ /* 구단별 평가 편차(±3)보다 차이가 크게 */ const avg=q=>G.teams.reduce((s,t)=>s+aiVal(t,q),0)/G.teams.length;
  ok(dvo(fb)-dvo(ss)>=8,'준비 실패: 종합 차이 '+(dvo(fb)-dvo(ss)));
  ok(posBest(ss).v>posBest(fb).v,'유격(종합 '+dvo(ss)+')의 포지션 가치 '+dv(posBest(ss).v)+' ≤ 1루(종합 '+dvo(fb)+') '+dv(posBest(fb).v));
  ok(avg(ss)>avg(fb),'구단 평가 평균: 유격 '+avg(ss).toFixed(1)+' ≤ 1루 '+avg(fb).toFixed(1)); ok(posBest(c).v>posBest(fb).v,'포수 포지션 가치가 1루보다 낮음');
  ok(newSalary(ss)>=newSalary(fb)*.95,'연봉 기준이 1루 쪽으로 크게 기욺: 유격 '+newSalary(ss)+' / 1루 '+newSalary(fb)); [fb,ss,c].forEach(q=>delete G.players[q.id]); });

T('포지션 가치: 수비 1점의 무게는 유격이 1루의 2배 이상이고, 1루수를 유격수로 평가하지 않는다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP); const lg=lgOf(G.year); const h=Object.assign({},ZB,{y:G.year,t:G.user,lvl:'1군',g:140,pa:600,ab:530,h:150,bb:60,d:30,hr:15});
  const w=(pos,def)=>{ p.pos=pos; p.r.def=def; h.pos=pos; return warRaw(h,p); }; const ds=w('SS',70)-w('SS',50), d1=w('1B',70)-w('1B',50);
  ok(ds>=d1*2,'유격 수비 20점 차 WAR '+ds.toFixed(2)+' / 1루 '+d1.toFixed(2)); p.pos='1B'; p.r.def=60; p.pexp={}; /* 익힌 부 포지션이 없는 1루수(익힌 포지션은 [리뷰 11-02j]대로 가치 후보) */ ok(posBest(p).pos==='1B'||posBest(p).pos==='DH','1루수의 가치 자리가 '+posBest(p).pos); });

T('실책: 공이 간 자리 수비수 실력대로 난다(수비가 약한 유격수는 팀 실책을 크게 늘린다)',()=>{ fresh(); const d=depth(G.user); const ss=d.ln.SS; ok(ss,'준비 실패: 유격수 없음');
  const fs={order:Object.values(d.ln).filter(Boolean),posOf:{}}; for(const k in d.ln)if(d.ln[k])fs.posOf[d.ln[k].id]=k; const r0=JSON.stringify(ss.r);
  const team=def=>{ ss.r=JSON.parse(r0); ss.r.def=def; let t=0, w=0; for(const p of fs.order){ const k=fs.posOf[p.id]; if(!ERRW[k])continue; t+=ERRW[k]*errChance([p,k]); w+=ERRW[k]; } return t/w; };
  const lo=team(32), hi=team(80); ss.r=JSON.parse(r0); ok(lo>=hi*1.4,'유격 수비 32와 80일 때 타구당 팀 실책 확률 '+(lo*1000).toFixed(1)+'‰ / '+(hi*1000).toFixed(1)+'‰(1.4배 이상이어야)'); });

T('자리별 대형 선수의 드묾: 포수·유격 수는 줄이지 않되, 최상위 재능은 1루·코너보다 훨씬 드물고 포수는 같은 종합이라도 방망이가 약하다',()=>{ fresh(); const C={}, E={}, O={}; const inc=(o,k,v=1)=>o[k]=(o[k]||0)+v;
  for(let i=0;i<4000;i++){ const b=clamp(N(47,7),25,72); const p=newPlayer({age:27,isP:false,base:b,pot:b,team:null}); inc(C,p.pos); if(ovr(p)>=57)inc(E,p.pos); inc(O,p.pos,offV(p)-ovr(p)); delete G.players[p.id]; }
  const sh=k=>(E[k]||0)/C[k]; ok(C.C>=C['1B']*.8&&C.SS>=C['1B']*.8,'포수·유격 선수 수가 줄어듦: 포수 '+C.C+' · 유격 '+C.SS+' · 1루 '+C['1B']);
  ok(sh('C')<=sh('1B')*.5&&sh('SS')<=sh('1B')*.6,'최상위(종합 57 이상) 비율: 포수 '+(sh('C')*100).toFixed(1)+'% · 유격 '+(sh('SS')*100).toFixed(1)+'% · 1루 '+(sh('1B')*100).toFixed(1)+'%');
  ok(O.C/C.C<O['1B']/C['1B']-3,'같은 종합에서 포수 방망이가 1루와 비슷함'); });

T('포지션 운용: 포수는 포수·지명 말고는 나가지 않고, 외야 셋 중 중견 수비가 가장 나은 선수가 중견을 맡는다',()=>{ fresh(); const me=G.user; { const mm=G.mgr[me]; mgrAttr(mm); mm.dfn=60; } /* 수비를 아주 가볍게 보는 감독(dfn 10대)은 낯선 자리 부담 때문에 일부러 안 바꾸기도 한다: 보통 감독 기준으로 본다 */ const L=makeLineup(me); const of=['LF','CF','RF'].map(k=>L[k]); ok(of.every(Boolean),'준비 실패: 외야 3명');
  const [a,b,c]=of; a.r.def=40; b.r.def=42; c.r.def=78; for(const k of ['con','pow','eye','spd'])c.r[k]=Math.max(a.r[k],b.r[k]); /* 방망이는 같게: 수비 차이로만 중견을 고르는지 본다 */ c.pexp=c.pexp||{}; c.pexp.CF=90; /* 중견 경험이 많은 코너 외야수: 60이면 어깨 좋은 우익수와 모형상 거의 동점이라 로스터에 따라 결과가 갈렸다 */ const cs=domestic(me).filter(q=>q.pos==='C').slice(0,3); ok(cs.length>=2,'준비 실패: 포수 '+cs.length); cs.forEach(q=>{ for(const k of ['con','pow','eye'])q.r[k]=80; });
  const L2=makeLineup(me); ok(L2.CF===c||defAt(L2.CF,'CF')>=defAt(c,'CF')-2,'중견 수비 '+Math.round(defAt(c,'CF'))+'인 외야수 대신 '+Math.round(defAt(L2.CF,'CF'))+'가 중견');
  for(const k in L2)if(L2[k].pos==='C')ok(k==='C'||k==='DH','포수가 '+k+'로 나감'); });

T('포지션 정착: 지난 시즌 다른 자리에서 주로 뛰어 숙련이 오르면 그 자리로 굳는다(포수는 그대로)',()=>{ fresh(); const y=G.year; const ps=domestic(G.user).filter(q=>!q.isP); const s=ps.find(q=>q.pos==='SS')||ps.find(q=>q.pos!=='C'), c=ps.find(q=>q.pos==='C'); ok(s&&c,'준비 실패');
  const to=s.pos==='2B'?'SS':'2B'; delete s.pconv; s.use={y,g:130,pos:{[to]:110,[s.pos]:20},slot:{}}; pexpOf(s)[to]=82; c.use={y,g:120,pos:{'1B':110,C:10},slot:{}}; pexpOf(c)['1B']=85; const p0=s.pos;
  G.year++; posYear(); ok(s.pos===to,p0+' 선수가 '+to+'에서 110경기 뛰었는데 주 포지션이 '+s.pos); ok(posExp(s,p0)===100,'원래 자리 숙련이 남지 않음'); ok(c.pos==='C','포수가 '+c.pos+'로 바뀜'); });

T('포지션 숙련: 낯선 자리라도 1군에서 뛴 경기만큼 숙련이 오른다',()=>{ fresh(); const p=domestic(G.user).find(q=>q.pos==='3B')||domestic(G.user).find(q=>!q.isP&&q.pos!=='1B'); delete p.pconv; p.age=25; p.vers=55; /* 배우는 속도를 보통으로(나이·다재다능에 따라 다르다) */ if(p.pexp)delete p.pexp['1B']; const e0=posExp(p,'1B');
  p.use={y:G.year,g:60,pos:{'1B':60},slot:{}}; delete p.useSeen; posWeek(); ok(posExp(p,'1B')-e0>=20,'1루 60경기 뒤 숙련 '+e0+' → '+posExp(p,'1B')); });

T('자리 돌리기: 수비가 약한 유격수라도 방망이가 좋으면 감독이 수비 부담이 적은 자리로 돌리고, 거기서도 밀리면 또 옮긴다(우리 구단은 제안만)',()=>{ fresh(); const t=G.teams.find(x=>x.id!==G.user&&domestic(x.id).filter(q=>!q.isP&&!q.ys&&q.pos==='SS').length>=2)||G.teams.find(x=>x.id!==G.user); /* 창단 직후 AI 보강 트레이드로 유격수가 한 명뿐인 구단이 생길 수 있다 */ { const mm=mgrOf(t.id); if(mm){ mgrAttr(mm); mm.dfn=60; } } /* 수비를 아주 가볍게 보는 감독은 방망이 좋은 유격수를 그대로 쓰기도 한다: 보통 감독 기준 */ const ps=domestic(t.id).filter(q=>!q.isP&&!q.ys);
  const ss=ps.filter(q=>q.pos==='SS'); ok(ss.length>=2,'준비 실패: 유격수 '+ss.length); const x=ss[0], y=ss[1]; y.r.def=Math.max(y.r.def,68); for(const k of ['con','pow','eye'])y.r[k]=Math.max(y.r[k],50); /* 대신 유격을 맡을 선수가 1군감 방망이는 돼야 한다(방망이가 너무 약하면 감독이 그를 빼고 x를 유격에 둔다) */ for(const k of ['con','pow','eye'])x.r[k]=82; x.r.def=30; x.vers=70; x.age=26; delete x.pconv; if(x.pexp){ for(const k in x.pexp)delete x.pexp[k]; }
  posPlanAll(); ok(x.pconv,'방망이 좋은 수비 약한 유격수를 돌리지 않음'); const k1=x.pconv.pos; ok(DSPEC[k1]<DSPEC.SS&&k1!=='C','유격에서 '+k1+'로(더 쉬운 자리여야)');
  pexpOf(x)[k1]=95; posWeek(); ok(x.pos===k1,'전환 훈련을 마쳤는데 주 포지션이 '+x.pos); delete x.pconv;
  const others=domestic(t.id).filter(q=>!q.isP&&q!==x&&q.pos===k1); others.forEach(q=>{ q.r.def=Math.max(q.r.def,70); for(const k of ['con','pow','eye'])q.r[k]=Math.max(q.r[k],70); });
  posPlanAll(); if(x.pconv)ok(DSPEC[x.pconv.pos]<=DSPEC[k1],'두 번째 이동이 더 어려운 자리로: '+x.pconv.pos);
  const me=domestic(G.user).filter(q=>!q.isP&&q.pos==='SS'); if(me.length>=2){ const a=me[0]; for(const k of ['con','pow','eye'])a.r[k]=82; a.r.def=30; a.vers=70; a.age=26; delete a.pconv; if(a.pexp){ for(const k in a.pexp)delete a.pexp[k]; } /* 33세 이상이거나 이미 다른 자리를 익힌 선수면 감독이 돌리지 않는다(세계에 따라 달라지던 점검) */ me[1].r.def=Math.max(me[1].r.def,68); for(const k of ['con','pow','eye'])me[1].r[k]=Math.max(me[1].r[k],50); const n0=G.mail.length; posPlanAll(); ok(!a.pconv,'우리 선수를 단장 허락 없이 전환 훈련시킴'); ok(G.mail.length>n0&&G.mail.slice(0,G.mail.length-n0).some(m=>(m.acts||[]).some(z=>z.a==='posConv')),'감독 제안 메일이 없음'); } });

T('코치 계약 만료: 우리와 계약이 끝난 OB 코치를 같은 날 AI 구단이 먼저 데려가지 않는다(단장이 후보에서 볼 기회)',()=>{ const {ob,c}=obCoachSetup(); G.coach[G.user].pc=null; c.yrs=0; c.from=G.user; c.fromY=G.year; G.cmarket=(G.cmarket||[]).concat(c);
  const other=G.teams.find(t=>t.id!==G.user).id; let took=0; for(let i=0;i<300;i++){ const r=obAiCoach(other,'pc'); if(r&&r.ob===ob.id){ took++; G.cmarket.push(c); } } ok(!took,'같은 날 AI가 우리 코치를 '+took+'번 데려감'); });

T('자리 도전: 주전에 밀린 젊은 타자가 다른 자리를 익혀 1군에 서고 싶다고 찾아오고, 단장이 허락하면 전환 훈련·기분 상승, 기다리라 하면 실망',()=>{ fresh(); G.day=KD(4,1); const me=G.user; const ln=makeLineup(me);
  const p=domestic(me).find(q=>!q.isP&&q.pos!=='C'&&!Object.values(ln).includes(q)&&healthy(q)); ok(p,'준비 실패: 벤치 타자 없음'); p.age=24; p.vers=72; p.pers.amb=20; for(const k of ['con','pow','eye'])p.r[k]=80; delete p.pconv; delete p.posReq;
  const ln2=makeLineup(me); if(Object.values(ln2).includes(p)){ ok(true,''); return; } /* 방망이가 좋아져 바로 주전이면 도전할 이유가 없다 */
  let m=null; for(let i=0;i<30&&!m;i++){ delete p.posReq; const n0=G.mail.length; posReqMonth(); m=G.mail.slice(0,G.mail.length-n0).find(x=>(x.acts||[]).some(a=>a.a==='posReqOk'&&a.v===String(p.id))); }
  ok(m,'밀린 선수가 자리 도전을 요청하지 않음'); const q=p.posReq.q; const m0=p.mor; posReqAnswer(p.id,true); ok(p.pconv&&p.pconv.pos===q,'허락했는데 '+POSK[q]+' 전환 훈련이 시작되지 않음'); ok(p.mor>m0,'허락했는데 기분이 그대로');
  ok(/이미/.test(posReqAnswer(p.id,true)),'같은 요청을 두 번 처리함');
  delete p.pconv; p.posReq={q,d:G.day,open:true}; const m1=p.mor; posReqAnswer(p.id,false); ok(p.mor<m1&&!p.pconv,'기다리라 했는데 기분이 그대로거나 훈련이 시작됨'); });

T('자리 도전: 주전은 찾아오지 않고, AI 구단은 2군 감독이 된다고 하면 바로 전환 훈련을 시킨다',()=>{ fresh(); G.day=KD(5,1); for(const t of G.teams){ const ln=makeLineup(t.id); for(const q of Object.values(ln))ok(!posChallenge(q,ln),'주전 '+q.name+'이(가) 자리 도전 대상'); }
  const t=G.teams.find(x=>x.id!==G.user); const ln=makeLineup(t.id); const p=domestic(t.id).find(q=>!q.isP&&q.pos!=='C'&&!Object.values(ln).includes(q)&&healthy(q)); ok(p,'준비 실패'); p.age=23; p.vers=75; p.pers.amb=20; for(const k of ['con','pow','eye'])p.r[k]=80; delete p.pconv;
  if(Object.values(makeLineup(t.id)).includes(p))return; let ok1=false; for(let i=0;i<30&&!ok1;i++){ delete p.posReq; delete p.pconv; posReqMonth(); ok1=!!p.pconv; } ok(ok1,'AI 구단 선수가 전환 도전을 시작하지 않음'); });

T('2군 코치진: 육성력이 좋을수록 2군에서 하는 포지션 전환이 빠르다',()=>{ fresh(); const p=domestic(G.user).find(q=>!q.isP&&q.pos!=='C'); p.e1=false; p.age=24; p.vers=60; delete p.pexp; const q=p.pos==='3B'?'1B':'3B'; const C=G.coach[G.user]=G.coach[G.user]||{};
  const run=dv=>{ for(const k of ['fm','fb'])C[k]=Object.assign(mkCoach(k),{dv}); pexpOf(p)[q]=0; p.pconv={pos:q,d:G.day}; delete p.fuseSeen; p.fuse=null; G.day=KD(4,1); posWeek(); return posExp(p,q); };
  const lo=run(30), hi=run(80); delete p.pconv; ok(hi>lo*1.2,'2군 코치 육성력 80일 때 '+hi.toFixed(1)+' · 30일 때 '+lo.toFixed(1)); });

T('감독은 본 만큼만 안다: 외국인 후보는 영상·스카우트 보고서로만 판단하고(숨은 실력을 꿰뚫지 못함), 갓 부임하면 어린 선수를 아직 모른다고 말한다',()=>{ fresh(); const m=G.mgr[G.user]; const p=(G.fmarket||[]).map(id=>G.players[id]).find(q=>q&&q.team==null&&q.foreign==='용병'&&intlLv(origOf(q))<3&&!fMineFind(q)); ok(p,'준비 실패: 외국인 후보');
  G.fwatch=[]; const e0=mgrEst(m,p); for(const k in p.r)p.r[k]=clamp(p.r[k]+8,20,95); p.sx=(p.sx||0)+8; const e1=mgrEst(m,p); ok(Math.abs(e1-e0)<2,'스카우트도 못 보는 실전 감각을 감독이 알아챔: '+e0.toFixed(1)+' → '+e1.toFixed(1));
  ok(/영상|보고서|자료/.test(mgrOnForeign(p)),'외국인 후보를 직접 본 것처럼 말함: '+mgrOnForeign(p));
  m.hD=G.day; m.youth=50; const a=mgrTalk('young').a; ok(/직접 보지 못했|캠프/.test(a)||!playersOf(G.user).some(q=>!q.foreign&&q.age<=24),'갓 부임한 감독이 어린 선수를 다 아는 것처럼 말함: '+a.slice(0,80)); });

T('스프링캠프: 모든 구단 젊은 선수가 크고, 투수는 새 구종을 익혀 오기도 한다(구종이 늘면 탈삼진 힘이 바뀐다)',()=>{ fresh(); const t=G.teams.find(x=>x.id!==G.user).id; const L=domestic(t).filter(p=>p.age<=24&&!p.prospect); ok(L.length>=5,'준비 실패');
  const o0=L.reduce((a,p)=>a+ovr(p),0); campGrowAll('spring','skill'); const o1=L.reduce((a,p)=>a+ovr(p),0); ok(o1>o0,'AI 구단 젊은 선수가 캠프에서 크지 않음: '+(o1-o0).toFixed(2));
  const q=domestic(G.user).find(x=>x.isP); const k0=arsenalK(q), n0=arsenal(q,q.r.stf).length; const k=addPitch(q,8); ok(k&&arsenal(q,q.r.stf).length===n0+1,'새 구종이 구종 목록에 없음'); ok(arsenalK(q)>=k0,'좋은 새 구종을 익혔는데 탈삼진 힘이 그대로 아래'); });

T('마무리캠프: 26세 이하와 주전이 아닌 30세 이하만 가고, 단장이 훈련 방향을 고른다(구종 개발이면 새 구종이 훨씬 많다)',()=>{ fresh(); const d=depth(G.user); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); const W=new Set(campWho(G.user,'fall').map(p=>p.id));
  for(const p of domestic(G.user)){ if(p.prospect)continue; const want=p.age<=26||(p.age<=30&&!reg.has(p.id)); ok(W.has(p.id)===want,p.name+'('+p.age+'세, '+(reg.has(p.id)?'주전':'비주전')+') 참가 '+W.has(p.id)); }
  G.day=KD(11,5); delete G.fcamp; const n0=G.mail.length; fcampStart(); const m=G.mail.slice(0,G.mail.length-n0).find(x=>(x.acts||[]).some(a=>a.a==='fcampSet')); ok(m,'마무리캠프 방향 고르기 메일이 없음'); fcampSet('pitch'); ok(G.fcamp.focus==='pitch','방향이 바뀌지 않음');
  const P0=new Map(); for(const t of G.teams)for(const p of campWho(t.id,'fall'))if(p.isP)P0.set(p.id,JSON.stringify({a:p.addP||null,r:p.r,pa:p.pa||null})); const back=()=>{ for(const [id,j] of P0){ const p=G.players[id], o=JSON.parse(j); if(o.a)p.addP=o.a; else delete p.addP; p.r=o.r; if(o.pa)p.pa=o.pa; } };
  const cnt=foc=>{ __seed(321); let n=0; for(let i=0;i<4;i++)for(const t of G.teams)for(const p of campWho(t.id,'fall'))if(p.isP){ const b=(p.addP||[]).length; campGrow(p,'fall',foc); n+=(p.addP||[]).length-b; } back(); return n; }; const a=cnt('skill'), b=cnt('pitch'); /* 같은 선수·같은 난수로 두 방향을 비교한다(앞의 방향이 구종을 먼저 늘려 놓으면 뒤가 불리했다) */ ok(b>a*2,'구종 개발 '+b+'개 · 기술 훈련 '+a+'개'); });

T('성장: 능력은 잠재력을 넘지 못하고(잠재력 자체는 오르내림), 같은 환경에서도 프로의식·야망이 높을수록 더 크고 낮으면 일찍 꺾인다',()=>{ fresh(); const base=domestic(G.user).find(q=>!q.isP&&q.age<=23&&!q.prospect); ok(base,'준비 실패');
  const snap=JSON.stringify(base), save={age:base.age}; const run=(pro,amb)=>{ __seed(99); /* 두 성격에 같은 난수를 써서 앞 시나리오 순서와 상관없이 성격 차이만 본다 */ let tot=0, over=0; { for(let i=0;i<80;i++){ const p=Object.assign(JSON.parse(snap),{id:base.id}); p.pers.pro=pro; p.pers.amb=amb; p.dt='norm'; p.pot=ovr(p)+10; G.players[p.id]=p; const o=ovr(p); develop(p); if(ovr(p)>Math.max(p.pot,o)+.06)over++; tot+=ovr(p)-o; } } G.players[base.id]=base; return {g:tot/80,over}; };
  const lo=run(5,5), hi=run(19,19); ok(!lo.over&&!hi.over,'잠재력을 넘김 '+lo.over+'/'+hi.over); ok(hi.g>lo.g*1.4,'프로의식·야망 높음 +'+hi.g.toFixed(2)+' · 낮음 +'+lo.g.toFixed(2));
  const a=Object.assign(JSON.parse(snap),{dt:'norm'}); a.pers.pro=5; const b=Object.assign(JSON.parse(snap),{dt:'norm'}); b.pers.pro=18; ok(dtSpan(a).fall<dtSpan(b).fall,'프로의식이 낮아도 꺾이는 나이가 같음');
  const q=domestic(G.user).find(x=>x.isP&&x.age<=25)||base; const o0=ovr(q); q.pot=o0+.5; for(let i=0;i<6;i++)campGrow(q,'spring','skill'); ok(ovr(q)<=Math.max(q.pot,o0)+.06,'캠프에서 잠재력을 넘김: '+ovr(q).toFixed(1)+' / '+q.pot); });

T('사고: 프로의식이 낮은 선수만 사고를 치고, 우리 구단이면 징계 결정이 오며 그해 성장이 깎인다',()=>{ fresh(); G.day=KD(5,1); const ps=domestic(G.user).filter(q=>!q.prospect&&!q.foreign); ps.forEach(q=>{ initPers(q); q.pers.pro=18; delete q.badY; }); const x=ps.find(q=>q.age>=30)||ps[0]; x.age=Math.max(x.age,31); x.pers.pro=4; x.injOut=0; delete G.misbD; /* 고참은 선수단 문화에 덜 휩쓸린다(젊은 선수는 좋은 리더 밑에서 사고가 준다) */
  let n=0; for(let i=0;i<400&&!(x.badY&&x.badY.n);i++){ misbehaveMonth(); n++; } /* 한 달 확률이 2~3%라 넉넉히 */ ok(x.badY&&x.badY.n,'프로의식 4인 선수가 '+n+'달 동안 사고 없음'); ok(ps.filter(q=>q!==x).every(q=>!q.badY),'프로의식 높은 선수가 사고를 침');
  ok((G.evs||[]).some(e=>e.k==='lead'&&e.data&&e.data.pid===x.id),'우리 선수 사고에 징계 결정이 없음'); const f0=persGrowF(Object.assign({},x,{badY:null})), f1=persGrowF(x); ok(f1<f0,'사고를 쳐도 성장 계수가 그대로'); });

T('리더: 선수들은 프로의식 있는 고참을 주장으로 뽑고, 리더들의 프로의식이 젊은 선수 성장·사고·습관으로 퍼진다',()=>{ fresh(); const tid=G.user; const ps=domestic(tid).filter(p=>!p.ys&&healthy(p)&&!(p.joinY>G.year)&&p.age>=25); ok(ps.length>=3,'준비 실패'); /* 주장 투표 대상과 같은 조건 */
  ps.forEach(p=>{ initPers(p); p.pers.pro=5; leadOf(p).cha=8; }); const top12=new Set(domestic(tid).filter(p=>!p.ys).sort((x,y)=>ovr(y)-ovr(x)).slice(0,12).map(p=>p.id)); const a=ps.find(p=>p.age>=28&&top12.has(p.id))||ps.find(p=>top12.has(p.id))||ps[0]; /* 주장은 주전급에서(외부 리뷰) */ a.pers.pro=19; leadOf(a).cha=12; a.age=Math.max(a.age,30); electCaptain(tid,'점검'); /* 영향력(cha)을 비슷하게 맞춘다: 영향력이 아주 큰 오래된 선수는 프로의식이 낮아도 뽑히기도 한다 */ ok(team(tid).cap===a.id,'프로의식 19인 고참 대신 '+(G.players[team(tid).cap]||{}).name+'(프로의식 '+((G.players[team(tid).cap]||{}).pers||{}).pro+')이 주장');
  const y=domestic(tid).find(p=>p.age<=23&&!p.prospect); ok(y,'준비 실패: 젊은 선수'); y.pers.pro=5; G._cl=null; _ldC.clear(); const L=teamLeaders(tid); L.forEach(p=>{ p.pers.pro=19; leadOf(p).cha=14; }); _ldC.clear(); const good=effPro(y), gf=persGrowF(y);
  L.forEach(p=>{ p.pers.pro=4; }); _ldC.clear(); const bad=effPro(y), bf=persGrowF(y); ok(good>y.pers.pro+2&&bad<=y.pers.pro,'리더 프로의식 19일 때 '+good.toFixed(1)+' · 4일 때 '+bad.toFixed(1)+'(본인 '+y.pers.pro+')'); ok(gf>bf,'리더가 좋아도 성장 계수가 그대로');
  L.forEach(p=>{ p.pers.pro=19; }); _ldC.clear(); let up=0; for(let i=0;i<40;i++){ y.pers.pro=5; up+=proDrift(y); } ok(up>=5,'좋은 리더 밑에서 40번 중 프로의식이 '+up+'번만 오름'); });

const faOpenNow=()=>{ fresh(); simTo(()=>G.fa&&!G.fa.closed&&G.day>=KD(11,8)); ok(G.fa&&!G.fa.closed,'FA 시장 준비 실패'); return G.fa.pool.map(i=>G.players[i]).filter(p=>p&&p.team==null&&p.faFrom!==G.user&&p.ask); };
const reNow=()=>{ fresh(); simTo(()=>G.contract&&!G.contract.done&&G.contract.foreignEnd&&G.contract.foreignEnd.length&&G.day>=KD(12,2)); const C=G.contract; ok(C&&C.foreignEnd.length,'외국인 재계약 준비 실패'); return C; };
T('[외국인·FA] 거절당한 FA 제안은 마감 때 계약되지 않는다(외국인·FA 플레이 점검)',()=>{ const L=faOpenNow(); const p=L[0]; G.fa.ai[p.id]={}; G.fa.offers[p.id]={annual:MIN_SAL,years:1,rej:true}; faClose(); ok(G.players[p.id].team!==G.user,'선수가 거절한 조건으로 우리와 계약됨: '+p.name); });
T('[외국인·FA] 외부 FA 한도를 채우면 남은 외부 FA 제안은 정리하고 알린다(외국인·FA 플레이 점검)',()=>{ const L=faOpenNow(); const [a,b]=L; G.fa.outN={[G.user]:faCapN()-1}; G.fa.offers[b.id]={annual:b.ask.annual,years:b.ask.years};
  const n0=G.mail.length; faSign(a,[{tid:G.user,annual:a.ask.annual,years:a.ask.years}]); ok(a.team===G.user,'준비 실패: 영입 안 됨'); ok(!G.fa.offers[b.id],'한도를 채웠는데 다른 외부 FA 제안이 그대로 남음'); const M=JSON.stringify(G.mail.slice(0,12)); ok(M.includes('한도')&&M.includes(b.name),'한도로 제안이 정리됐다는 알림이 없음'); /* 소식함이 꽉 차면 개수 차이로 자를 수 없다 */ });
T('[외국인·FA] 우리 C등급 FA가 떠나면 받은 보상금을 알린다(외국인·FA 플레이 점검)',()=>{ const L=faOpenNow(); const p=L[0]; p.faFrom=G.user; p.faGrade='C'; p.faPrevSal=400; const to=G.teams.find(t=>t.id!==G.user).id; const n0=G.mail.length;
  faSign(p,[{tid:to,annual:p.ask.annual,years:2}]); const M=JSON.stringify(G.mail.slice(0,G.mail.length-n0+2)); ok(M.includes('보상금'),'C등급 보상금 소식이 없음'); });
T('[외국인·FA] 외국인 재계약을 그냥 두면 더 좋은 해외 제안이 있는 선수는 떠난다(외국인·FA 플레이 점검)',()=>{ const C=reNow(); const id=C.foreignEnd.find(i=>!C.foreignDrop.includes(i)); const p=G.players[id]; p.fout={y:C.y,k:'일본',v:Math.round(p.newSal*1.4)};
  const ask=p.newSal; fReFinish(C,G.user); const q=G.players[id]; ok(!(q&&q.team===G.user&&q.sal===ask),'해외 제안(요구액의 1.4배)을 무시하고 요구액으로 자동 재계약됨'); });
T('[외국인·FA] 재계약 기간에 결별하기로 한 외국인은 외국인 자리를 차지하지 않는다(외국인·FA 플레이 점검)',()=>{ const C=reNow(); { let g=0; while(foreignOf(G.user).filter(x=>x.foreign==='용병').length<3&&g++<5){ const q=newForeign('용병',{}); q.team=G.user; q.sal=q.ask||30000; } } /* 앞 시나리오 난수에 따라 2명일 수 있어 3명으로 채운다 */ const yb=foreignOf(G.user).filter(x=>x.foreign==='용병'); ok(yb.length===3,'준비 실패: 용병 '+yb.length+'명');
  const d=yb.find(x=>C.foreignEnd.includes(x.id)); ok(d,'준비 실패: 재계약 대상 용병 없음'); C.foreignDrop.push(d.id); const q=(G.fmarket||[]).map(i=>G.players[i]).find(x=>x&&x.foreign==='용병'&&x.isP===d.isP);
  ok(q,'준비 실패: 같은 유형 후보 없음'); const e=foreignCheck(G.user,q); ok(!e.includes('3명까지'),'결별한 선수 때문에 대체 영입이 막힘: '+e); });
T('[외국인·FA] 외국인 협상: 기다려 준 기한 처리가 AI 영입보다 먼저 돈다(외국인·FA 플레이 점검)',()=>{ fresh(); const seen=[]; const a0=aiForeignDaily, f0=foDaily; aiForeignDaily=()=>{ seen.push('ai'); }; foDaily=()=>{ seen.push('fo'); };
  try{ marketDaily(); }finally{ aiForeignDaily=a0; foDaily=f0; } ok(seen.indexOf('fo')>=0&&seen.indexOf('fo')<seen.indexOf('ai'),'순서: '+seen.join(',')); });
T('[외국인·FA] 보류권을 풀었어도 시장에 못 나가는 선수는 다른 구단 가능이라고 적지 않는다(외국인·FA 플레이 점검)',()=>{ const C=reNow(); const id=C.foreignEnd[0]; const p=G.players[id]; setOvr(p,44); C.foreignDrop.push(id); C.fFree=[id];
  fReFinish(C,G.user); const l=(G.log.find(x=>x.t.includes(p.name))||{}).t||''; ok(l&&!l.includes('다른 구단과 계약 가능'),'기록: '+l); ok(!(G.fmarket||[]).includes(id),'준비 확인: 시장에 나옴'); });
T('[외국인·FA] 결산 뒤 겨울에도 지출을 늘리면 예산 여유가 줄어든다(외국인·FA 플레이 점검)',()=>{ fresh(); simTo(()=>G.last&&G.last.y>=G.year&&G.day>=KD(11,20)); ok(G.last&&G.last.y>=G.year,'결산 전'); team(G.user).cash=0; /* 보유 현금으로 메우는 몫을 빼고 본다 */ const b1=budget().roomGoal; G.spend.etc=(G.spend.etc||0)+1000; const b2=budget().roomGoal;
  ok(b2<=b1-900,'지출 10억을 늘렸는데 예산 여유 '+money(b1)+' → '+money(b2)); });
T('[외국인·FA] 외국인 재계약 거절 문구의 조사(일본으로)(외국인·FA 플레이 점검)',()=>{ const C=reNow(); const id=C.foreignEnd.find(i=>!C.foreignDrop.includes(i)); const p=G.players[id]; p.fout={y:C.y,k:'일본',v:Math.round(p.newSal*2)}; let r;
  for(let i=0;i<3;i++){ r=foReOffer(id,MIN_SAL,0); if(C.foreignDrop.includes(id))break; } ok(r&&!r.msg.includes('일본로')&&r.msg.includes('일본으로'),'문구: '+(r&&r.msg)); });

T('[스타] 능력치 변화: 우리 선수는 매달 능력치를 남기고, 약 6개월 전과 비교한 변화를 낸다(FM 화살표)',()=>{ fresh(); const p=playersOf(G.user).find(q=>!q.isP); rSnapAll(); ok(p.rS&&p.rS.length&&p.rS[p.rS.length-1].d===G.day,'이번 달 기록이 남지 않음');
  p.rS=[{d:G.day-400,r:{...p.r,con:p.r.con-9}},{d:G.day-200,r:{...p.r,con:p.r.con-3,pow:p.r.pow+2}},{d:G.day-30,r:{...p.r}}]; const D=rDelta(p); ok(D&&D.from===G.day-200,'기준 시점이 6개월 전쯤이 아님: '+(D&&G.day-D.from));
  ok(Math.abs(D.d.con-3)<1e-9&&Math.abs(D.d.pow+2)<1e-9,'변화량이 틀림: '+JSON.stringify(D.d)); const q=Object.values(G.players).find(x=>x.team!=null&&x.team!==G.user); rSnapAll(); ok(!q.rS,'다른 구단 선수까지 기록함'); });
T('[스타] 개인 타이틀: 홈런왕·타격왕·평균자책점왕 등을 정하고 수상 경력에 남긴다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+50); const y=G.year; const T0=seasonTitles(y);
  const hrMax=Math.max(...Object.values(G.players).filter(p=>!p.isP).map(p=>{ const h=seasonTotal(p,y,'1군'); return h?h.hr||0:0; })); const hr=T0.find(t=>t.k==='홈런왕'); ok(hr&&hr.v===hrMax,'홈런왕이 최다 홈런이 아님: '+(hr&&hr.v)+' / '+hrMax);
  const w=G.players[hr.ids[0]]; ok((w.aw||[]).includes(y+' 홈런왕'),'수상 경력에 없음'); const era=T0.find(t=>t.k==='평균자책점왕'); ok(era,'평균자책점왕 없음'); const ep=G.players[era.ids[0]]; const eh=seasonTotal(ep,y,'1군'); const gp=(G.sea.rec[ep.team].w+G.sea.rec[ep.team].l+(G.sea.rec[ep.team].t||0)); ok(eh.outs>=gp*3,'규정이닝 미달 투수가 평균자책점왕');
  ok(['타격왕','타점왕','도루왕','다승왕','탈삼진왕','세이브왕'].every(k=>T0.some(t=>t.k===k)),'빠진 타이틀: '+T0.map(t=>t.k).join(',')); });
T('[스타] 시즌 중 타이틀 경쟁 기사가 나오고, 우리 선수가 경쟁 중이면 따로 알린다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+50); const n0=(G.news||[]).length, m0=G.mail.length; const p=playersOf(G.user).find(q=>!q.isP&&seasonTotal(q,G.year,'1군'));
  const h=p.hist.find(x=>x.y===G.year&&x.lvl==='1군'&&!x.y2); h.hr=(h.hr||0)+60; titleRaceNews(); const N=JSON.stringify((G.news||[]).slice(0,(G.news||[]).length-n0+1)); ok(N.includes('경쟁'),'타이틀 경쟁 기사가 없음'); const M=JSON.stringify(G.mail.slice(0,G.mail.length-m0+1)); ok(M.includes(p.name),'우리 선수가 홈런 1위인데 알림이 없음'); });
T('[스타] 언론 플레이로 우리 선수 띄우기: 스타성이 오르고, 띄운 뒤 부진하면 거품 역풍이 분다',()=>{ fresh(); const r=pressInit()[0]; r.rel=80; const p=playersOf(G.user).filter(q=>!q.foreign).sort((a,b)=>ovr(b)-ovr(a))[0]; const s0=starPower(p);
  const msg=pressPlay(r.id,'hype',p.id); ok(p.hype&&p.hype.until>G.day,'띄우기가 기록되지 않음: '+msg); ok(starPower(p)>s0,'스타성이 오르지 않음'); const f0=G.pr.fan; const h0=hypeForm; hypeForm=()=>'bad'; try{ G.day+=50; ppDaily(); }finally{ hypeForm=h0; }
  const N=JSON.stringify((G.news||[]).slice(0,4)); ok(N.includes('거품'),'부진했는데 역풍 기사가 없음'); ok(G.pr.fan<f0,'팬 여론이 떨어지지 않음'); ok(!(p.hype&&p.hype.until>=G.day&&p.hype.v>0),'거품 뒤에도 스타성 보너스가 남음'); });

T('[스타] 스타 마케팅 캠페인: 비용을 쓰고, 스타 파워에 비례해 스타 마케팅 수입이 늘고, 기사가 난다',()=>{ fresh(); const p=playersOf(G.user).filter(q=>!q.foreign).sort((a,b)=>ovr(b)-ovr(a))[0]; p.aw=[G.year+' MVP'];
  const i0=starIncome(G.user), e0=G.spend.etc||0, f0=G.pr.fan; const est=smEst(p,'m'); ok(est>0,'예상 수입 0'); const msg=smStart(p.id,'m'); ok(smActive(p),'캠페인이 시작되지 않음: '+msg);
  ok((G.spend.etc||0)-e0===300,'비용이 3억이 아님: '+((G.spend.etc||0)-e0)); const add=starIncome(G.user)-i0; ok(add>0&&Math.abs(add-Math.round(est*p.smk.f))<=2,'수입 증가가 예상과 다름: '+add+' / '+Math.round(est*p.smk.f)); ok(G.pr.fan>f0,'팬 관심이 오르지 않음');
  ok(JSON.stringify((G.news||[]).slice(0,3)).includes(p.name),'캠페인 기사가 없음'); ok(smStart(p.id,'s').includes('이미'),'같은 선수에 겹쳐 시작됨'); const d0=G.day, L0=G.last; G.day=p.smk.until+10; ok(smActive(p),'결산이 예상보다 늦어지면 결산 전에 캠페인이 끝남'); G.last={...(L0||{}),y:G.year}; ok(!smActive(p),'결산 뒤에도 캠페인 수입이 다음 해로 이어짐'); G.day=d0; G.last=L0;
  const q=playersOf(G.user).find(x=>x!==p&&starPower(x)===0); ok(!q||smEst(q,'l')===0,'스타 파워 0인데 예상 수입이 있음'); });
T('[스타] 캠페인 중에는 매달 기사가 나고, 스타가 떠오르면 그해 한 번 알린다',()=>{ fresh(); const p=playersOf(G.user).filter(q=>!q.foreign).sort((a,b)=>ovr(b)-ovr(a))[0]; p.aw=[G.year+' MVP']; smStart(p.id,'s');
  const n0=(G.news||[]).length; smNews(); ok((G.news||[]).length>n0&&JSON.stringify(G.news.slice(0,2)).includes(p.name),'캠페인 기간 월간 기사가 없음');
  const q=playersOf(G.user).filter(x=>!x.foreign&&x!==p)[0]; q.aw=[G.year+' 신인왕',G.year+' 골든글러브(1루수)']; const m0=G.mail.length; starCheck(); const M=JSON.stringify(G.mail.slice(0,G.mail.length-m0+1)); ok(M.includes(q.name),'스타 탄생 알림이 없음');
  const m1=G.mail.length; starCheck(); ok(G.mail.length===m1,'같은 해에 또 알림'); });

T('[엔진] 능력이 성적에 반영된다: 규정타석 타자의 한 시즌 OPS를 능력 기대치가 50% 이상, 세부 능력치 직선 관계만으로도 40% 이상 설명한다(방승환: 파워 평균인데 장타율 .514 · KBO 실력 폭 기준 2026-11-02)',()=>{ const R=[];
  for(const tid of [1,2,3]){ const snap={}; const u0=updateLg; updateLg=function(y){ if(y===2025)for(const p of Object.values(G.players)){ if(p.isP)continue; const e=simBat(p,6000,0); snap[p.id]={r:{...p.r},e:bRate(e).ops}; } return u0.apply(this,arguments); }; try{ DEMO.on=false; newGame(tid); }finally{ updateLg=u0; }
    for(const p of Object.values(G.players)){ const s=snap[p.id]; if(!s||p.isP)continue; const h=seasonTotal(p,2025,'1군'); if(!h||h.pa<446)continue; R.push({x:[1,s.r.con,s.r.pow,s.r.eye,s.r.spd],e:s.e,y:obpOf(h)+(h.h+h.d+2*h.tr+3*h.hr)/h.ab}); } }
  ok(R.length>=150,'준비 실패: 규정타석 '+R.length); const n=R.length, p=5; const A=Array.from({length:p},()=>Array(p).fill(0)), b=Array(p).fill(0);
  for(const r of R)for(let i=0;i<p;i++){ b[i]+=r.x[i]*r.y; for(let j=0;j<p;j++)A[i][j]+=r.x[i]*r.x[j]; }
  for(let i=0;i<p;i++){ for(let j=i+1;j<p;j++){ const f=A[j][i]/A[i][i]; for(let c=i;c<p;c++)A[j][c]-=f*A[i][c]; b[j]-=f*b[i]; } } const w=Array(p).fill(0); for(let i=p-1;i>=0;i--){ let s2=b[i]; for(let c=i+1;c<p;c++)s2-=A[i][c]*w[c]; w[i]=s2/A[i][i]; }
  const my=R.reduce((s2,r)=>s2+r.y,0)/n; let sst=0, sse=0; for(const r of R){ const pr=r.x.reduce((s2,v,i)=>s2+v*w[i],0); sst+=(r.y-my)**2; sse+=(r.y-pr)**2; } const r2=1-sse/sst;
  const me=R.reduce((s2,r)=>s2+r.e,0)/n; let sxy=0, sxx=0; for(const r of R){ sxy+=(r.e-me)*(r.y-my); sxx+=(r.e-me)**2; } const re=sxy*sxy/(sxx*sst);
  /* 실제 KBO 규정 타석 wRC+는 실력 차가 MLB보다 좁아(2026 1위 175·10위 140), 600타석 운(wRC+ 약 18)과 합치면 한 시즌 기록을 실력이 설명하는 정도가 60% 안팎이다 */
  ok(re>=.5,'능력 기대 OPS가 실제 OPS를 설명하는 정도 '+(re*100).toFixed(0)+'%(50% 이상이어야 함)'); ok(r2>=.4,'세부 능력치(컨택·파워·선구·주루) 직선 관계가 OPS를 설명하는 정도 '+(r2*100).toFixed(0)+'%(40% 이상이어야 함)'); });

T('[엔진] 투수도 능력이 성적에 반영된다: 100이닝 이상 투수의 평균자책점을 능력치(구위·제구·체력)가 45% 이상 설명한다',()=>{ const R=[];
  for(const tid of [1,2,3]){ const snap={}; const u0=updateLg; updateLg=function(y){ if(y===2025)for(const p of Object.values(G.players))snap[p.id]={...p.r}; return u0.apply(this,arguments); }; try{ DEMO.on=false; newGame(tid); }finally{ updateLg=u0; }
    for(const p of Object.values(G.players)){ const s=snap[p.id]; if(!s||!p.isP)continue; const h=seasonTotal(p,2025,'1군'); if(!h||h.outs<300)continue; R.push({x:[1,s.stf,s.ctl,s.sta],y:h.er*27/h.outs}); } }
  ok(R.length>=120,'준비 실패: 100이닝 투수 '+R.length); const n=R.length, p=4; const A=Array.from({length:p},()=>Array(p).fill(0)), b=Array(p).fill(0);
  for(const r of R)for(let i=0;i<p;i++){ b[i]+=r.x[i]*r.y; for(let j=0;j<p;j++)A[i][j]+=r.x[i]*r.x[j]; }
  for(let i=0;i<p;i++){ for(let j=i+1;j<p;j++){ const f=A[j][i]/A[i][i]; for(let c=i;c<p;c++)A[j][c]-=f*A[i][c]; b[j]-=f*b[i]; } } const w=Array(p).fill(0); for(let i=p-1;i>=0;i--){ let s2=b[i]; for(let c=i+1;c<p;c++)s2-=A[i][c]*w[c]; w[i]=s2/A[i][i]; }
  const my=R.reduce((s2,r)=>s2+r.y,0)/n; let sst=0, sse=0; for(const r of R){ const pr=r.x.reduce((s2,v,i)=>s2+v*w[i],0); sst+=(r.y-my)**2; sse+=(r.y-pr)**2; } const r2=1-sse/sst; ok(r2>=.45,'능력치가 평균자책점을 설명하는 정도 '+(r2*100).toFixed(0)+'%(45% 이상이어야 함)'); });

T('[트레이드] 고액 연봉이라도 성적·능력이 멀쩡한 선수는 공짜로 내주지 않는다(연봉 정리 매물·리빌딩 구단이라도)(커뮤니티 피드백)',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+10);
  const t=G.teams.find(x=>x.id!==G.user); t.mode='rebuild'; const ds=domestic(t.id).filter(q=>!q.ys&&healthy(q)&&!(q.joinY>G.year)); const p=ds.filter(q=>q.age>=28&&q.age<=31).sort((a,b)=>ovr(b)-ovr(a))[0]; ok(p,'준비 실패');
  setOvr(p,Math.max(ovr(p),60)); p.sal=2500; p.faC=true; p.yrs=3; p.aiListed=true; p.aiWhy='sal'; p.aiUrg=true; p.aiLd=G.day; p.injOut=0;
  const mine=domestic(G.user).filter(q=>!q.ys&&!(q.joinY>G.year)&&q.sal<=100).sort((a,b)=>ovr(a)-ovr(b)); const scrub=mine[0]; ok(scrub,'준비 실패: 우리 저연봉 선수');
  const sw=seasonWorth(projO(p,0)+seenDelta(t,p)); /* AI 단장 눈에 보이는 능력(성적 반영) 기준 */ const v=tval(t,p,'out'); ok(v>=sw*.25-.01,'연봉 정리 매물인 능력 60 선수의 값이 '+v.toFixed(1)+'(시즌 가치 '+sw.toFixed(1)+')');
  const r=proposeTrade(t.id,[scrub.id],[p.id],0); ok(!r.ok,'능력 60 고액 연봉 선수를 '+scrub.name+'(능력 '+Math.round(ovr(scrub))+')와 바꿔 줌'); });

T('[트레이드] AI가 연봉 정리 매물로 내놓는 선수는 고액 연봉 순이 아니라 몸값 대비 성적이 나쁜 선수(노장)다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+10);
  const t=G.teams.find(x=>x.id!==G.user&&x.id!==ME()); const ds=domestic(t.id).filter(q=>!q.ys&&healthy(q)&&!(q.joinY>G.year)).sort((a,b)=>ovr(b)-ovr(a)); ok(ds.length>=8,'준비 실패');
  const PP=ds.slice(3).filter(q=>q.isP); const star=PP[0], vet=PP[1]; /* 투수끼리(포지션 가치 보정 pvShift가 섞이지 않게) */ for(const q of ds.slice(0,3))setOvr(q,Math.max(ovr(q),66)); /* 핵심 3명 밖의 주전 */ star.age=29; setOvr(star,62); star.pot=62; star.sal=2600; star.faC=true; star.yrs=3; vet.age=34; setOvr(vet,50); vet.pot=50; vet.sal=1500; star.hist=[]; vet.hist=[]; /* 기록이 몸값 판단(projO)에 섞이지 않게: 능력만으로 비교 */ vet.faC=true; vet.yrs=2; for(const q of ds)if(q!==star&&q!==vet&&q.sal>1500)q.sal=900;
  const ci=capInfo(t.id); const extra=Math.max(0,ci.cap*.99-ci.pay); ds.slice(0,3).forEach(q=>q.sal+=Math.round(extra/3)); /* 상한 근처로: 매물 후보가 아닌 핵심 3명에게 얹는다 */ ok(capInfo(t.id).pay>capInfo(t.id).cap*.97,'준비 실패: 상한 근처가 아님');
  let g=0; while(!ds.some(q=>q.aiListed&&q.aiWhy==='sal')&&g++<60){ for(const q of ds){ delete q.aiListed; delete q.aiWhy; } aiBlockWeekly(); }
  const L=ds.find(q=>q.aiListed&&q.aiWhy==='sal'); ok(L,'연봉 정리 매물이 안 나옴'); ok(L!==star,'능력 62 주전(연봉 26억)을 노장 대신 연봉 정리 매물로 내놓음'); ok(L.sal>marketSal(projO(L,0))*1.3,'몸값보다 크게 비싸지 않은 '+L.name+'(능력 '+Math.round(ovr(L))+', '+L.age+'세, 연봉 '+money(L.sal)+')을(를) 내놓음'); /* 그 팀에 더 심한 노장이 있으면 그 선수가 먼저다 */ });

const champNow=()=>{ fresh(); const op=G.teams.find(t=>t.id!==G.user).id; G.ps={champ:G.user,runner:op,res:{},done:true,seeds:[G.user,op],round:'ks'}; champCelebrate(); return op; };
T('[우승] 구단주 포상은 현금을 줄이고(운영 20억·FA 30억), 선수단 보너스를 고를 수 있다',()=>{ champNow(); const e=(G.evs||[]).find(x=>x.k==='champGift'&&!x.done); ok(e,'포상 결정이 없음');
  const t=team(G.user); const opts=e.opts.map(o=>o.l).join(' / '); ok(opts.includes('선수단'),'선수단 보너스 선택지가 없음: '+opts); for(let i=0;i<e.opts.length;i++){ const c0=t.cash; const sv=JSON.stringify({c:t.cash}); const r=EVH.champGift.pick(e,i); ok(t.cash-c0<=3000,'포상 '+e.opts[i].l+'이 현금 '+money(t.cash-c0)); t.cash=c0; G.faFund=null; } });
T('[우승] 우승 며칠 뒤 퍼레이드가 열리고, 다음 시즌 홈 개막전은 반지 수여식과 함께 매진된다',()=>{ champNow(); ok(G.parade&&G.parade.d>G.day,'퍼레이드 일정이 없음'); const n0=(G.news||[]).length; G.day=G.parade.d; champDaily(); ok(JSON.stringify((G.news||[]).slice(0,(G.news||[]).length-n0+1)).includes('퍼레이드'),'퍼레이드 기사가 없음');
  ok(G.ringY===G.year+1,'다음 시즌 반지 수여식 예정이 없음'); G.year++; G.sea.att={}; const op=G.teams.find(t=>t.id!==G.user).id; const n1=(G.news||[]).length; const r=stadGame(G.day,G.user,op); ok(r.att===stadCap(G.user),'반지 수여식 경기가 매진이 아님: '+r.att+'/'+stadCap(G.user));
  ok(JSON.stringify((G.news||[]).slice(0,(G.news||[]).length-n1+1)).includes('반지'),'반지 수여식 기사가 없음'); const r2=stadGame(G.day+1,G.user,op); ok(G.ringDone===G.year,'수여식이 한 번으로 끝나지 않음'); });
T('[우승] 우승하면 다음 시즌 관중·굿즈 판매가 늘고(인기), 구단 명성이 크게 오른다',()=>{ fresh(); const t=team(G.user); const pop0=t.pop; const pr0=clubPrestige(G.user); const op=G.teams.find(x=>x.id!==G.user).id; G.ps={champ:G.user,runner:op,res:{},done:true,seeds:[G.user,op],round:'ks'}; champCelebrate();
  ok(t.pop-pop0>=.09,'우승 뒤 인기 상승 '+(t.pop-pop0).toFixed(3)); const ord=G.teams.map(x=>({tid:x.id,w:72,l:72})); const raw=()=>sum(clubPrestigeParts(G.user).map(x=>x[1])); G.history.push({y:G.year,order:ord,champ:op,runner:G.user}); const a0=raw(); G.history[G.history.length-1].champ=G.user; const a1=raw(); ok(a1-a0>=11.95,'같은 시즌을 우승하면 명성 +'+(a1-a0).toFixed(1)+'(12 이상이어야 함)'); /* 99 상한·지난 시즌 가중치 이동과 무관하게 비교 */
  const m0=G.mail.length; G.year++; champSalesNote(); ok(JSON.stringify(G.mail.slice(0,G.mail.length-m0+1)).includes('우승 효과'),'다음 시즌 판매 증가 안내가 없음'); });

T('스페이스바 자동 진행 설정 기본값은 "묻지 않음"',()=>{ fresh(); ok(!G.advAsk,'새 게임에서 진행 전에 묻기가 켜져 있음'); });
T('[드래프트] 첫 시즌부터 신인 드래프트 지명 순서(지난 시즌 역순)를 미리 알리고, 실제 지명 순서와 같다',()=>{ fresh(); const o=draftOrders(); ok(o&&o.r1.length===G.teams.length,'지명 순서를 미리 계산하지 못함'); const n=o.r1.indexOf(G.user)+1;
  const fm=G.mail.find(x=>x.subj.includes('창단 드래프트 결과')); ok(fm&&fm.body.includes('1라운드 '+n+'순위'),'창단 드래프트 결과 메일에 신인 드래프트 순위 안내 없음');
  simTo(()=>G.day>=KD(3,1)); const m=G.mail.slice(0,40).find(x=>x.subj.includes('신인 드래프트')&&x.subj.includes('순위')); ok(m&&m.subj.includes(n+'순위'),'3월 1일 드래프트 시즌 안내 메일 없음 또는 순위 틀림');
  simTo(()=>G.draft); ok(G.draft.picks.slice(0,G.teams.length).map(x=>x.tid).join()===o.r1.join(),'미리 알린 순서와 실제 1라운드 순서가 다름'); });
T('[스태프] 영입 경쟁은 소식함에 쌓지 않고 후보 카드에서 다시 제안하며, 결과(영입 완료·무산)만 소식함에 남는다',()=>{ fresh(); stInit(); while(G.scouts.length>=SCOUT_MAX)G.scouts.pop(); const M=scoutMkt(); const s=M[0], s2=M[1]; const rv=G.teams.find(t=>t.id!==G.user).id;
  s._im=s2._im=G.year*100+dobj(G.day).m; s.int=[rv]; s2.int=[]; const old=stScore; stScore=(x,tid,sal)=>tid===G.user?sal/100:1e9;
  const r=stOffer('sc',s.id,0); ok(r.bid,'경쟁 상황을 만들지 못함'); ok(!G.mail.slice(0,8).some(m=>m.subj.includes('영입 경쟁')),'영입 경쟁 메일이 소식함에 쌓임');
  G.day+=4; stBidExpire(); stScore=old; ok(G.mail.slice(0,8).some(m=>m.subj.includes(s.name)&&m.subj.includes('무산')),'경쟁에서 진 결과(무산)가 소식함에 없음');
  const r2=stOffer('sc',s2.id,0); ok(r2.ok,'경쟁 없는 영입 실패'); ok(G.mail.slice(0,8).some(m=>m.subj.includes(s2.name)&&m.subj.includes('영입 완료')),'영입 완료가 소식함에 없음'); });
T('[투수] 혹사 금지 지시를 하면 선발 투구 수가 실제로 줄어든다(선발을 오래 끄는 감독이어도 평균 100구 이하), 리그 선발 평균은 KBO 수준(85~95구)',()=>{ fresh(); const m=G.mgr[G.user]; mgrAttr(m); m.pen=15; G.mgrDir={arm:{ok:true,mid:m.id}};
  const U=[], A=[]; const _ll=loadLog; loadLog=(p,d,pc,isS)=>{ if(isS&&p.e1&&period()==='season')(p.team===G.user?U:A).push(pc); return _ll(p,d,pc,isS); };
  simTo(()=>period()==='season'&&G.day>=G.cal.open+40); loadLog=_ll; const av=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
  ok(U.length>=20,'우리 선발 등판 부족 '+U.length); ok(av(U)<=100,'혹사 금지인데 우리 선발 평균 '+av(U).toFixed(1)+'구'); ok(av(A)>=82&&av(A)<=95,'리그(AI) 선발 평균 '+av(A).toFixed(1)+'구(82~95, KBO 구단별 80~91구)'); });
T('[투수] 투수 부하 주의 메일은 같은 투수·같은 단계면 매주 되풀이하지 않고, 최근 7일 등판 수를 함께 적는다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+14); const p=playersOf(G.user).find(q=>q.isP&&isSPr(q)&&q.ld&&q.ld.length); ok(p,'선발 없음'); p.armw=armCap(p)*1.35;
  const n0=G.mail.filter(m=>m.subj.startsWith('투수 부하 주의')).length; loadWeekly(); const m1=G.mail.find(m=>m.subj.startsWith('투수 부하 주의')); ok(m1&&G.mail.filter(m=>m.subj.startsWith('투수 부하 주의')).length===n0+1,'첫 경고 메일 없음');
  ok(/최근 7일 [0-9]+경기 [0-9]+구/.test(m1.body),'최근 7일 등판 수가 없음: '+m1.body.slice(0,120)); m1.read=true; G.day+=7; loadWeekly(); ok(G.mail.filter(m=>m.subj.startsWith('투수 부하 주의')).length===n0+1,'같은 투수·같은 단계인데 다시 경고'); });
T('[FA] 시즌 중에 올 시즌 뒤 FA가 될 선수(다른 구단 포함)를 미리 볼 수 있고, 실제 FA 공시 명단이 그 안에 있다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=KD(9,25)); const L=faUpcoming(); ok(L.length>=10,'예정자 '+L.length+'명'); ok(L.some(x=>x.p.team!==G.user),'다른 구단 예정자 없음'); const ids=new Set(L.map(x=>x.p.id));
  simTo(()=>G.fa&&G.fa.pool&&G.fa.y0===G.year); const miss=G.fa.pool.map(id=>G.players[id]).filter(q=>q&&!q.foreign&&!q.abroad&&q.faFrom!=null&&!ids.has(q.id)); ok(!miss.length,'예정자 명단에 없던 FA '+miss.length+'명: '+miss.slice(0,3).map(q=>q.name+'('+q.svc+','+q.faC+')').join(', ')); });
T('[구단주] 외부 FA 영입 한도를 다 채웠으면 구단주가 FA 영입을 주문하지 않는다(데려올 수 없는 선수 주문)',()=>{ fresh(); const t=team(G.user); t.owner='pr'; t.trust=70; const s=Object.values(G.players).filter(p=>p.team!=null&&p.team!==G.user&&!p.foreign).sort((a,b)=>ovr(b)-ovr(a))[0]; s.faFrom=s.team; s.team=null; s.ask={annual:800,years:4};
  G.fa={pool:[s.id],offers:{},ai:{},open:true,openDay:G.day,closed:false,results:[],cap:2,outN:{[G.user]:2},y0:G.year}; for(let k=0;k<30;k++){ try{ ownerPush(); }catch(e){} }
  ok(!grants().some(g=>g.by==='own'&&g.kind==='fa'),'한도를 다 채웠는데 구단주가 '+s.name+' 영입을 주문함'); G.fa.outN[G.user]=0; for(let k=0;k<30;k++){ try{ ownerPush(); }catch(e){} } ok(grants().some(g=>g.by==='own'&&g.kind==='fa'),'한도가 남았을 때도 주문이 없음(점검 설정 확인)'); });
T('[트레이드] 개막 전·시즌 중 올해 가치는 지금 능력 그대로다(성장·노화는 1월 1일에 한 번): 33세 주전의 올해 값을 미리 깎지 않는다',()=>{ fresh(); ok(period()==='pre','준비 실패: 개막 전 아님'); const p=Object.values(G.players).find(q=>q.team!=null&&q.age>=33&&!q.foreign); const y=Object.values(G.players).find(q=>q.team!=null&&q.age<=21&&q.pot>ovr(q)+8);
  const base=q=>ovr(q)+pvShift(q)+condOf(q)*.3; ok(Math.abs(projO(p,0)-base(p))<.01,'33세 올해 값 '+projO(p,0).toFixed(1)+' vs 지금 '+base(p).toFixed(1)); ok(Math.abs(projO(y,0)-base(y))<.01,'21세 올해 값을 미리 부풀림 '+projO(y,0).toFixed(1)+' vs '+base(y).toFixed(1)); ok(projO(p,2)<base(p),'2년 뒤 노화 반영 안 됨'); });
T('[트레이드] 리빌딩이 아닌 AI 구단은 주전(라인업 9명·로테이션·필승조)을 훨씬 못한 선수 하나와 바꿔 주지 않는다(다른 자리에서 뛰는 주전 포함)',()=>{ fresh(); const ours=domestic(G.user).filter(p=>!p.foreign&&!(p.joinY>G.year)); let bad=[];
  for(const t of G.teams){ if(t.id===G.user)continue; const d=depth(t.id); const S=[...d.start,...d.sp,...d.pen.slice(0,4)].filter(q=>q&&!q.foreign&&!q.aiListed&&ovr(q)>=56&&(t.mode!=='rebuild'||q.age<=28));
    for(const q of S)for(const p of ours){ if(t.mode==='rebuild'&&p.age<q.age)continue; /* 리빌딩 구단은 올해 값 60%만 받으면 더 어린 선수와 바꾼다(evalTrade 설계: 28세 고액 투수 ↔ 25세 저연봉 주전 야수). 리빌딩 구단은 같은 나이 이상인 선수와 바꿔 주는지만 본다 */ const sv=x=>ovr(x)+pvShift(x)+seenDelta(t,x); if(sv(p)>sv(q)-8)continue; /* 포지션 가치와 그 단장이 기록으로 본 차이(seenDelta)까지 넣어 8점 넘게 못한 경우만(1루수 63과 유격수 53은 포지션 가치로 보면 비슷할 수 있다) */ let e; try{ e=evalTrade(t.id,[p.id],[q.id],0); }catch(x){ continue; } if(e.ok)bad.push(tshort(t.id)+' '+q.name+'('+Math.round(ovr(q))+','+q.age+')<-'+p.name+'('+Math.round(ovr(p))+','+p.age+')'); } }
  ok(!bad.length,'주전을 싸게 내줌 '+bad.length+'건: '+bad.slice(0,3).join(', ')); });
T('[트레이드] 한 시즌에 트레이드를 많이 할수록 다른 단장들도 값을 올린다(리그 전체 눈치)',()=>{ fresh(); const t=G.teams.find(x=>x.id!==G.user); const q=domestic(t.id).filter(x=>!x.foreign).sort((a,b)=>ovr(b)-ovr(a))[5]; const p=domestic(G.user).filter(x=>!x.foreign)[3];
  const n0=evalTrade(t.id,[p.id],[q.id],0).need; const o=G.teams.filter(x=>x.id!==G.user&&x.id!==t.id); for(let k=0;k<4;k++)G.trades.push({y:G.year,d:G.day,with:o[k].id,give:[],get:[]}); const n1=evalTrade(t.id,[p.id],[q.id],0).need; ok(n1>n0+.5,'트레이드 4건 뒤에도 요구치 그대로 '+n0.toFixed(2)+' -> '+n1.toFixed(2)); });
T('[트레이드] 한 구단과 트레이드를 마치면 30일 동안은 그 구단과 다시 거래하지 않는다(새 선수가 자리 잡는 기간)',()=>{ fresh(); const t=G.teams.find(x=>x.id!==G.user); G.trades.push({y:G.year,d:G.day,with:t.id,give:[],get:[]}); const q=domestic(t.id).filter(x=>!x.foreign)[8], p=domestic(G.user).filter(x=>!x.foreign)[8];
  const r=proposeTrade(t.id,[p.id],[q.id],0); ok(!r.ok&&r.cool,'거래 직후 같은 구단과 또 협상됨: '+(r.msg||'').slice(0,60)); G.day+=31; const r2=proposeTrade(t.id,[p.id],[q.id],0); ok(!r2.cool,'30일이 지났는데도 막힘'); });
T('[트레이드] 예산을 넘겨 연봉을 떠안는 트레이드는 구단주 승인이 필요하다(신뢰가 낮거나 초과가 크면 막힌다)',()=>{ fresh(); const u=team(G.user); u.trust=30; const b=budget(); G.spend=G.spend||{}; G.spend.etc=(G.spend.etc||0)+Math.max(0,b.roomGoal);
  const t=G.teams.find(x=>x.id!==G.user); const q=domestic(t.id).filter(x=>!x.foreign).sort((a,c)=>c.sal-a.sal)[0]; const p=domestic(G.user).filter(x=>!x.foreign).sort((a,c)=>a.sal-c.sal)[0];
  const r=proposeTrade(t.id,[p.id],[q.id],0); ok(!r.ok&&r.owner,'예산 초과 '+money(q.sal-p.sal)+' 연봉 증가인데 구단주 확인 없이 진행: '+(r.msg||'').slice(0,60));
  G.offers=[{id:'tchk',from:t.id,give:[q.id],get:[p.id]}]; const r2=answerOffer('tchk',true); ok(!r2.ok&&r2.owner,'AI 제안 수락도 구단주 확인 없이 진행'); });
T('[리그] 창단 드래프트 뒤 AI 구단끼리 보강 트레이드가 일어나 상위 구단이 리빌딩 구단의 베테랑을 사 온다(강팀·약팀 차이)',()=>{const original=fdStrengthen;try{fdStrengthen=()=>0;fresh();}finally{fdStrengthen=original;} const ai=G.teams.filter(t=>t.id!==G.user); let B=ai.find(t=>t.mode==='rebuild'); if(!B){ B=ai[ai.length-1]; B.mode='rebuild'; }
  const p=domestic(B.id).filter(q=>!q.foreign&&!q.ys&&q.age>=29&&healthy(q)).sort((a,b)=>ovr(b)-ovr(a))[0]; ok(p,'준비 실패: 리빌딩 구단 베테랑 없음'); setOvr(p,66); /* 상위 구단이 탐낼 베테랑 */
  for(const A of ai.filter(t=>t.mode!=='rebuild')){ const y=domestic(A.id).filter(q=>!q.foreign&&!q.ys&&q.age<=24).sort((a,b)=>ovr(a)-ovr(b))[0]; if(y)y.pot=Math.max(y.pot,78); } /* 리빌딩 구단이 원할 유망주 */
  const n0=(G.lgTrades||[]).length; const n=fdStrengthen(); const L=(G.lgTrades||[]).slice(0,(G.lgTrades||[]).length-n0); ok(n>=1&&L.length>=1,'AI 보강 트레이드 '+n+'건');
  ok(L.every(x=>team(x.a).mode!=='rebuild'&&team(x.b).mode==='rebuild'),'사는 쪽이 리빌딩이거나 파는 쪽이 리빌딩이 아님'); });
T('[난이도] 우리 구단이 샐러리캡을 넘기면 구단주 신뢰 감점과 다음 시즌 모기업 지원 한도 축소(초과분의 절반)가 붙고, 안 넘기면 없다',()=>{ fresh(); const u=team(G.user); u.indie=false; delete u.supCut; const cap=capOf(sponSeason());
  ok(capOverOwner(u,G.year)===0||capPay(G.user)>cap,'상한 안인데 감점'); const ps=domestic(G.user).filter(p=>!isRookie(p)).sort((a,b)=>b.sal-a.sal); const add=cap*1.2-capPay(G.user); ps[0].sal+=Math.max(0,Math.round(add));
  const pen=capOverOwner(u,G.year); const ci=capInfo(G.user); ok(ci.over>0,'준비 실패: 초과 아님'); ok(pen<=-2&&pen>=-10,'신뢰 감점 '+pen); ok(u.supCut&&u.supCut.y===G.year+1&&Math.abs(u.supCut.amt-Math.round(ci.over*.5))<=1,'지원 한도 축소 '+JSON.stringify(u.supCut)); });
T('[난이도] 창단 드래프트 AI 지명: 우승 도전 구단은 상한 근처의 비싼 주전을, 리빌딩 구단은 젊은 선수를 더 높게 본다',()=>{ fresh(); const ai=G.teams.find(t=>t.id!==G.user); const old=newPlayer({age:31,isP:false,base:64,pos:'1B',team:null}), yg=newPlayer({age:21,isP:false,base:54,pos:'1B',team:null}); old.pot=64; yg.pot=70; old.sal=1500; yg.sal=MIN_SAL; if(!G.fd)G.fd={est:{},ana:{}};
  const X={c:{},cp:capOf(G.year)*.84,cap:capOf(G.year)}; ai.mode='contend'; ai.stance='win'; const w=fdScore(ai.id,old,false,X)-fdScore(ai.id,yg,false,X); ai.mode='rebuild'; const r=fdScore(ai.id,old,false,X)-fdScore(ai.id,yg,false,X);
  ok(w>r,'우승 도전 '+w.toFixed(2)+' · 리빌딩 '+r.toFixed(2)); });
T('[트레이드] 같은 구단과는 한 시즌에 두 번까지만 거래한다(그쪽 단장: 여론과 받은 선수 적응이 먼저)',()=>{ fresh(); const t=G.teams.find(x=>x.id!==G.user); G.trades.push({y:G.year,d:G.day-80,with:t.id,give:[],get:[]},{y:G.year,d:G.day-50,with:t.id,give:[],get:[]}); const q=domestic(t.id).filter(x=>!x.foreign)[8], p=domestic(G.user).filter(x=>!x.foreign)[8];
  const r=proposeTrade(t.id,[p.id],[q.id],0); ok(!r.ok&&r.cool&&r.msg.includes('여론'),'올해 두 번 거래한 구단과 또 협상됨: '+(r.msg||'').slice(0,80)); ok(!G.teams.filter(x=>x.id!==G.user&&tradeCool(x.id)).some(x=>x.id!==t.id),'다른 구단까지 막힘'); });
T('[트레이드] 급매 매물은 같은 구단 거래 제한(간격·횟수)이 없고, 맞대결 기간에는 30일 간격 없이 시즌 3번까지 된다',()=>{ fresh(); const t=G.teams.find(x=>x.id!==G.user); G.trades.push({y:G.year,d:G.day-40,with:t.id,give:[],get:[]},{y:G.year,d:G.day-5,with:t.id,give:[],get:[]}); const D=domestic(t.id).filter(x=>!x.foreign); const q=D[8], u=D[10]; u.aiListed=true; u.aiUrg=true; const p=domestic(G.user).filter(x=>!x.foreign)[8];
  ok(tradeCool(t.id,[q.id]),'점검 설정: 두 번 거래했는데 제한이 없음'); ok(!tradeCool(t.id,[u.id]),'급매 매물인데 막힘'); const so=seriesOpp; seriesOpp=()=>t.id; try{ ok(!tradeCool(t.id,[q.id]),'맞대결 기간인데 막힘(시즌 2번째 뒤 5일)'); G.trades.push({y:G.year,d:G.day-2,with:t.id,give:[],get:[]}); ok(tradeCool(t.id,[q.id]),'맞대결 기간이어도 시즌 3번을 넘김'); } finally { seriesOpp=so; } });
T('[예산] 시즌 예산은 개막 때 정한 금액이다: 시즌 중 구단주 신뢰가 오르거나 수입이 늘어도 예산 여유가 저절로 늘지 않는다(늘어난 수입은 구단주 몫)',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+5); const t=team(G.user); const b0=budget();
  t.trust=clamp(t.trust+30,0,100); const b1=budget(); ok(Math.abs(b1.roomGoal-b0.roomGoal)<=1,'신뢰 +30에 예산 여유 '+money(b0.roomGoal)+' -> '+money(b1.roomGoal));
  t.pop=(t.pop||1)*1.5; const b2=budget(); ok(Math.abs(b2.roomGoal-b0.roomGoal)<=1,'수입 증가에 예산 여유가 늘어남 '+money(b0.roomGoal)+' -> '+money(b2.roomGoal)); ok(b2.extra>0,'예상보다 늘어난 수입이 따로 표시되지 않음');
  t.trust=40; const o0=(()=>{ const L=G.bLock, k=L.I; L.I=budget().I; const v=ownOdds(1000,null); L.I=k; return v; })(); const o1=ownOdds(1000,null); /* 같은 상태에서 '예상보다 더 들어온 수입'만 0으로 바꿔 비교 */ /* 신뢰가 높으면 승인 가능성이 상한(0.92)에 붙어 차이가 안 보인다 */ ok(o1>o0,'늘어난 수입이 구단주 요청 근거가 되지 않음 '+o0.toFixed(2)+' / '+o1.toFixed(2)); });
T('[트레이드] AI 단장은 능력과 함께 최근 성적도 본다: 운 좋게 성적이 능력보다 좋은 선수는 비싸게, 운 나쁘게 부진한 선수는 싸게 본다(우리 평가는 그대로)',()=>{ fresh(); const A=G.teams.filter(x=>x.id!==G.user); const t=A[0], b=A[1];
  const p=A.slice(1).flatMap(x=>domestic(x.id)).filter(q=>!q.isP&&!q.foreign&&q.age>=25&&q.age<=31&&ovr(q)>=48&&ovr(q)<=60)[0]; ok(p,'준비 실패'); /* 나이 곡선을 바꿔도 대상이 있게 여러 구단에서 찾는다 */
  const rs=()=>{ try{ _lkC={k:'',m:new Map()}; }catch(e){} try{ _tcC={k:'',m:{}}; }catch(e){} }; rs(); const v0=tval(t,p,'in'), u0=tval(team(G.user),p,'in');
  const h=lineFor(p,G.year,p.team,'1군'); const keep=Object.assign({},h); addTo(h,{g:100,pa:420,ab:370,h:132,d:28,tr:2,hr:22,bb:45,hbp:3,sf:2,so:60}); rs(); const v1=tval(t,p,'in'), u1=tval(team(G.user),p,'in');
  for(const k in h)if(typeof h[k]==='number')h[k]=keep[k]??0; addTo(h,{g:100,pa:420,ab:375,h:70,d:10,tr:0,hr:2,bb:38,hbp:2,sf:5,so:110}); rs(); const v2=tval(t,p,'in');
  for(const k in h)if(typeof h[k]==='number')h[k]=keep[k]??0; rs();
  ok(v1>v0*1.08,'OPS 1.000대 운 좋은 시즌인데 평가가 그대로 '+v0.toFixed(1)+' -> '+v1.toFixed(1)); ok(v2<v0*.92,'OPS .500대 부진인데 평가가 그대로 '+v0.toFixed(1)+' -> '+v2.toFixed(1)); ok(Math.abs(u1-u0)<.01,'우리 구단 평가(실제 능력 기준)가 성적에 흔들림'); });
T('[구단 이름] 플레이어가 구단 별칭을 바꿀 수 있고(연고지는 고정), 겹치거나 빈 이름은 막으며, 기본 이름으로 되돌릴 수 있다',()=>{ fresh(); const a=G.teams[0], b=G.teams[1];
  const r=applyTeamNames([{id:a.id,city:'서울',nick:'점검트윈스'},{id:b.id,city:'서울',nick:'점검베어스'}]); ok(!r,'이름 바꾸기 실패: '+r); ok(tshort(a.id)==='서울 점검트윈스'&&tshort(b.id)==='서울 점검베어스','바뀐 이름이 안 보임 '+tshort(a.id));
  ok(applyTeamNames([{id:a.id,city:'서울',nick:'점검베어스'}]),'다른 구단과 같은 별칭을 허용함'); ok(applyTeamNames([{id:a.id,nick:''}]),'빈 별칭을 허용함'); ok(tshort(a.id)==='서울 점검트윈스','거절된 변경이 일부 반영됨');
  ok(!applyTeamNames([{id:a.id,city:'부산',nick:'점검트윈스'}])&&team(a.id).city===TEAM_DEF[a.id].city,'연고지가 바뀜(별칭만 바꿀 수 있어야 함)');
  resetTeamNames(); ok(tshort(a.id)===TEAM_DEF[a.id].city+' '+TEAM_DEF[a.id].nick,'기본 이름으로 안 돌아옴 '+tshort(a.id)); });
T('[병역] 상무 지원 기간에 스카우트팀장·감독이 선수별로 추천(지원 권장·마지막 기회·보류)을 보낸다',()=>{ fresh(); const ms=domestic(G.user).filter(p=>!p.foreign&&!p.ys&&!(p.joinY>G.year)); const d=depth(G.user); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id));
  const last=ms.find(p=>!reg.has(p.id)), star=ms.find(p=>reg.has(p.id)&&p!==last), dev=ms.filter(p=>!reg.has(p.id)&&p!==last&&p!==star).sort((a,b)=>ovr(a)-ovr(b))[0]; /* 확실히 1군 자리가 없는 선수(잠재력을 올려도 주전으로 안 올라오게 가장 낮은 능력) */ ok(last&&star&&dev,'준비 실패');
  for(const p of [last,star,dev]){ p.mil=null; } last.age=27; star.age=24; dev.age=23; dev.pot=Math.max(dev.pot,ovr(dev)+8);
  ok(milAdvice(last).k==='last','27세 미필이 마지막 기회로 안 나옴: '+milAdvice(last).k); ok(milAdvice(star).k==='hold','1군 주전이 보류로 안 나옴: '+milAdvice(star).k); ok(milAdvice(dev).k==='go','1군 자리 없는 23세 유망주가 지원 권장으로 안 나옴: '+milAdvice(dev).k);
  G.day=KD(9,1); const n0=G.mail.length; milDaily(); const m=G.mail.slice(0,G.mail.length-n0).find(x=>x.subj.includes('상무 지원 기간')); ok(m&&m.body.includes('추천')&&m.body.includes(dev.name)&&m.body.includes(last.name),'상무 지원 안내에 추천 명단이 없음'); });
T('[인터뷰] 경기 뒤 감독 인터뷰는 경기 내용(선발 호투·영웅 타자·연승 등)을 담고, 같은 말을 되풀이하지 않는다',()=>{ fresh(); simTo(()=>G.games&&G.games.length>=3); const rec=G.games.find(g=>g.res==='승')||G.games[0]; const me=rec.home===G.user?'h':'a'; const m=G.mgr[G.user];
  const sp=rec.box[me].pit[0]; sp.outs=24; sp.er=0; sp.so=9; const Q=[]; for(let i=0;i<20;i++)Q.push(mgrGameQuote(rec,m)); const uniq=new Set(Q).size;
  ok(uniq>=12,'같은 경기 20번에 서로 다른 말 '+uniq+'개'); ok(Q.filter(q=>q.includes(sp.n)).length>=10,'8이닝 무실점 선발('+sp.n+')을 거의 언급하지 않음: '+Q[0]); });
T('[기록] wRC+: 리그 평균 타자는 100 안팎, 잘 치면 100보다 높고 못 치면 낮다(가중출루율 기반, 리그 득점 환경 보정)',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+40); const y=G.year;
  const B=Object.values(G.players).filter(p=>!p.isP).map(p=>({p,h:seasonTotal(p,y,'1군')})).filter(x=>x.h&&x.h.pa>=80); ok(B.length>=40,'준비 실패: 타자 '+B.length);
  const W=B.map(x=>({w:wrcPlus(x.h,y),pa:x.h.pa,ops:bRate(x.h).ops})); const avgW=W.reduce((a,x)=>a+x.w*x.pa,0)/W.reduce((a,x)=>a+x.pa,0);
  ok(avgW>=90&&avgW<=110,'타석 가중 평균 wRC+ '+avgW.toFixed(1)); const hi=W.slice().sort((a,b)=>b.ops-a.ops)[0], lo=W.slice().sort((a,b)=>a.ops-b.ops)[0]; ok(hi.w>130&&lo.w<70,'OPS 최고 '+hi.ops.toFixed(3)+' wRC+ '+hi.w+' · 최저 '+lo.ops.toFixed(3)+' wRC+ '+lo.w); });
T('구속: 리그 평균 직구가 실제 KBO(2025~26년 146km 안팎)와 비슷하고, 구위가 아주 높으면(90 이상) 155km 넘게 던지고 최고 160 가까이 찍는다',()=>{ fresh();
  const P=Object.values(G.players).filter(p=>p.isP&&p.team!=null&&!p.prospect); const V=P.map(p=>({v:veloOf(p),mx:veloMax(p),s:dv(p.r.stf)})); const avg=V.reduce((a,x)=>a+x.v,0)/V.length;
  ok(avg>=145&&avg<=147.5,'리그 평균 구속 '+avg.toFixed(1)); const n155=V.filter(x=>x.mx>=155).length/V.length; ok(n155>=.04,'최고 155km 이상 투수 '+(n155*100).toFixed(1)+'%');
  /* 구위 90(원래 능력 약 69.5)인 투수: 구속 보정이 0일 때 */ const q={r:{stf:69.5},velo:0,id:'x'}; ok(veloOf(q)>=154,'구위 90 평균 구속 '+veloOf(q)); ok(veloOf(q)+4>=158,'구위 90 최고 구속 '+(veloOf(q)+4)); ok(V.every(x=>x.mx<=161),'최고 구속 161 초과');
  /* 표시와 실제 경기 계산이 같은 구속을 사용한다. */ const p=P[0]; ok(Math.abs(arsenal(p,p.r.stf)[0][1]-(p.r.stf+(veloOf(p)-145)*.8+trt(p,'fb',3)))<1e-9,'화면 구속과 실제 직구 점수 불일치'); });
T('창단 드래프트: 눈에 보이는 툴(구위·체력·파워·주력·수비)은 스카우트 등급이 정확하고, 오차 큼 표시 툴(제구·컨택·선구)만 크게 틀린다',()=>{ DEMO.on=false; newGame(6); fdStart();
  const P=Object.values(G.players).filter(p=>p.fdPool); const st={v:{e:0,n:0,b2:0},h:{e:0,n:0,b2:0}}; const per=[];
  for(const isP of [false,true]) for(const [k,l,vis] of FD_TOOLS[isP?'P':'B']){ let e=0,n=0,b2=0; for(const p of P.filter(q=>q.isP===isP)){ const d=Math.abs(FD_GL[fdScoutTools(p).L.find(t=>t.k===k).g]-FD_GL[fdToolTrue(p,k).g]); e+=d; n++; if(d>=2)b2++; }
    const o=st[vis?'v':'h']; o.e+=e; o.n+=n; o.b2+=b2; per.push(l+' '+(e/n).toFixed(2)+'/'+Math.round(b2/n*100)+'%'); }
  const mv=st.v.e/st.v.n, mh=st.h.e/st.h.n, bv=st.v.b2/st.v.n; console.log('  툴 오차(평균 등급차/2등급 이상):',per.join(' · '));
  ok(mv<=.6,'보이는 툴 평균 등급 오차 '+mv.toFixed(2)); ok(bv<=.04,'보이는 툴 2등급 이상 빗나감 '+Math.round(bv*100)+'%'); ok(mh>=mv*1.6,'오차 큼 툴 '+mh.toFixed(2)+' · 보이는 툴 '+mv.toFixed(2)); });
T('창단 드래프트 데이터팀: 능력치를 모르고도 지난 2년 기록과 타구 질(트래킹)로 기대 홈런을 내서, 한 해 홈런 거품·불운을 짚는다',()=>{ DEMO.on=false; newGame(6); fdStart(); const y=G.fd.y-1;
  const B=Object.values(G.players).filter(p=>!p.isP&&!p.foreign).map(p=>({p,h:seasonTotal(p,y,'1군'),e:fdHrExp(p,y)})).filter(x=>x.h&&x.h.pa>=300&&x.e);
  ok(B.length>=40,'준비 실패: '+B.length); const tal=x=>{ const o=simBat(x.p,4000,0); return o.hr/o.pa*x.h.pa; };
  const bub=B.filter(x=>x.e.k==='bub'), low=B.filter(x=>x.e.k==='low'); ok(bub.length>=1,'거품 판정 '+bub.length+'명');
  const m=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length); const gB=m(bub.map(x=>x.h.hr-tal(x))); ok(gB>=2.5,'거품 판정 선수의 지난해 홈런이 실력 기대보다 평균 '+gB.toFixed(1)+'개 많아야 함(2.5개 이상)');
  if(low.length>=3){ const gL=m(low.map(x=>tal(x)-x.h.hr)); ok(gL>=1,'불운 판정 선수의 실력 기대가 지난해 홈런보다 평균 '+gL.toFixed(1)+'개 많아야 함'); }
  const err=a=>m(a.map(x=>Math.abs(x.v-tal(x.x)))); const eE=err(B.map(x=>({x,v:x.e.exp}))), eH=err(B.map(x=>({x,v:x.h.hr}))); ok(eE<eH,'기대 홈런 오차 '+eE.toFixed(1)+'가 지난해 홈런 오차 '+eH.toFixed(1)+'보다 작아야 함');
  ok(/홈런/.test(fdDataLine(bub[0].p,y)),'데이터팀 의견에 홈런 거품이 없음: '+fdDataLine(bub[0].p,y)); });
T('창단 드래프트 성적 탭 최근 3년: 1군 3년 합산(타석·홈런 합, WAR 합, wRC+는 타석 가중)',()=>{ DEMO.on=false; newGame(6); fdStart(); const y=G.fd.y-1;
  const p=Object.values(G.players).find(q=>q.fdPool&&!q.isP&&[y-2,y-1,y].every(yy=>{ const h=seasonTotal(q,yy,'1군'); return h&&h.pa>=100; })); ok(!!p,'준비 실패');
  const L=fdStatLine3(p,y), H=[y-2,y-1,y].map(yy=>seasonTotal(p,yy,'1군')); ok(L.n===H.reduce((a,h)=>a+h.pa,0),'타석 합 '+L.n); ok(L.hr===H.reduce((a,h)=>a+h.hr,0),'홈런 합');
  ok(Math.abs(L.war-H.reduce((a,h)=>a+warPub(h,p),0))<1e-9,'WAR 합'); ok(L.wrc===wrcMulti(H),'wRC+'); ok(L.y3===3,'연수'); });
T('투수 종합 능력: 구위·제구·체력 비중이 경기에서 실제로 WAR을 만드는 비중(구위·제구 비슷하게 크고 체력은 작다)에 맞는다',()=>{ const p={isP:true,r:{stf:60,ctl:50,sta:40}}; ok(Math.abs(ovr(p)-(60*.44+50*.44+40*.12))<1e-9,'종합 '+ovr(p));
  /* 실측: 선발 투수 WAR을 구위·제구·체력으로 회귀하면 구위와 제구 기여가 비슷해야 한다(예전엔 구위 .62·제구 .34로 구위형 투수가 종합 능력보다 훨씬 잘했다) */
  /* 한 세계(선발 40명 안팎)로는 회귀 비율이 0.3~1.8로 크게 흔들려(같은 엔진에서도) 세계 4개를 합쳐 본다(2026-11-02 측정: 합치면 0.64~0.94) */
  const X=[],Y=[]; for(const w of [7,11,23,31]){ globalThis.__seed(w); DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); let g0=0; while(G.fd&&!G.fd.done&&g0++<500)fdAdvance(true); const y=G.year-1;
    Object.values(G.players).filter(q=>q.isP&&!q.foreign).map(q=>({q,h:seasonTotal(q,y,'1군')})).filter(x=>x.h&&x.h.outs>=300&&(x.h.gs||0)>=10).forEach(x=>{ X.push([x.q.r.stf,x.q.r.ctl]); Y.push(warOf(x.h,x.q)); }); }
  ok(X.length>=100,'준비 실패 '+X.length); const c=olsFit(X,Y,X.map(()=>1)); ok(c[1]>0&&c[2]>0&&c[2]/c[1]>=.6,'구위 '+c[1].toFixed(3)+' · 제구 '+c[2].toFixed(3)); });
T('[나이] 전성기는 20대 후반(실제 KBO처럼 20대 중반에도 리그 정상급이 있고, 30대 초반까지 유지, 35세 전후 급락): 시작 세계 상위 선수 나이 분포',()=>{ DEMO.on=false; newGame(6); fdStart();
  const L=Object.values(G.players).filter(p=>!p.foreign&&!p.prospect&&(p.team!=null||p.fdPool)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,60); const f=t=>L.filter(t).length/L.length;
  ok(f(p=>p.age<=25)>=.12,'25세 이하 '+(f(p=>p.age<=25)*100).toFixed(0)+'%'); ok(f(p=>p.age>=32)<=.2,'32세 이상 '+(f(p=>p.age>=32)*100).toFixed(0)+'%'); ok(f(p=>p.age>=35)<=.05,'35세 이상 '+(f(p=>p.age>=35)*100).toFixed(0)+'%'); });
T('[나이] 18세 1라운드급 유망주도 해마다 조금씩 커서 20대 중반에 정점(20~21세에 바로 리그 정상급이 되지 않는다)',()=>{ fresh(); const A=[]; for(let i=0;i<120;i++){ const p=newPlayer({age:18,base:40,pot:68,isP:i%2===0}); p.dt='norm'; p.prospect=false; A.push(p); }
  const at=a=>A.reduce((s,p)=>s+ovr(p),0)/A.length; const pot=A.reduce((s,p)=>s+p.pot,0)/A.length; const M={}; for(let a=18;a<=27;a++){ M[a]=at(); for(const p of A){ try{ develop(p); }catch(e){ p.age++; } } }
  const fr=(M[21]-M[18])/Math.max(.1,M[26]-M[18]); ok(fr<=.5,'18~21세에 18~26세 성장의 '+(fr*100).toFixed(0)+'%를 끝냄(절반 이하여야 함) · 평균 '+[18,21,24,26].map(a=>a+'세 '+M[a].toFixed(1)).join(' ')); ok(M[26]-M[24]>=.5,'24~26세에도 자라야 함'); for(const p of A)delete G.players[p.id]; });
T('[데이터 연결] 트래킹·세부 능력이 그 지표가 말하는 경기 결과(실력 기대치)와 맞는다: 타구 질↔홈런, 헛스윙↔삼진, 추격 스윙↔볼넷, CSW↔삼진, 땅볼 성향↔피홈런, 삼진 회피↔삼진',()=>{ fresh();
  const corr=(a,b)=>{ const m=v=>v.reduce((s,x)=>s+x,0)/v.length; const ma=m(a),mb=m(b); let s=0,sa=0,sb=0; for(let i=0;i<a.length;i++){ s+=(a[i]-ma)*(b[i]-mb); sa+=(a[i]-ma)**2; sb+=(b[i]-mb)**2; } return s/Math.sqrt(sa*sb); };
  const B=Object.values(G.players).filter(p=>!p.isP&&p.team!=null&&!p.prospect).slice(0,160), tb=B.map(p=>simBat(p,4000,0)), T=B.map(trackOf);
  const P=Object.values(G.players).filter(p=>p.isP&&p.team!=null&&!p.prospect).slice(0,160), tp=P.map(p=>simPit(p,6000,0)), TP=P.map(trackOf), bf=x=>x.outs+x.h+x.bb;
  const C=[['평균 타구속도↔홈런%',corr(T.map(x=>x.ev),tb.map(x=>x.hr/x.pa)),.75],['강한타구%↔홈런%',corr(T.map(x=>x.hh),tb.map(x=>x.hr/x.pa)),.75],['최고 타구속도↔홈런%',corr(T.map(x=>x.evmax),tb.map(x=>x.hr/x.pa)),.75],
    ['타자 헛스윙%↔삼진%',corr(T.map(x=>x.whiff),tb.map(x=>x.so/x.pa)),.7 /* 세계 6개 측정 0.77~0.82, 세계에 따라 0.73까지 내려간다 */],['추격 스윙%↔볼넷%(반대)',-corr(T.map(x=>x.chase),tb.map(x=>x.bb/x.pa)),.75],['삼진 회피↔삼진%(반대)',-corr(B.map(kAvoidV),tb.map(x=>x.so/x.pa)),.95],
    ['투수 헛스윙%↔탈삼진%',corr(TP.map(x=>x.whiff),tp.map(x=>x.so/bf(x))),.8],['CSW%↔탈삼진%',corr(TP.map(x=>x.csw),tp.map(x=>x.so/bf(x))),.7],['땅볼%↔피홈런%(반대)',-corr(TP.map(x=>x.gb),tp.map(x=>x.hr/bf(x))),.3]];
  for(const [l,v,th] of C)ok(v>=th,l+' 상관 '+v.toFixed(2)+' (기준 '+th+')'); });
T('[체력] 체력이 좋은 불펜은 연투를 더 버티고(피로가 덜 쌓이고 빨리 풀림), 부상 위험·시즌 누적 부하가 낮고, 선발은 시즌 이닝을 더 먹는다',()=>{ fresh(); const t=G.teams.find(x=>x.id!==G.user);
  const rp=domestic(t.id).filter(q=>q.isP&&!isSPr(q))[0]; ok(!!rp,'준비 실패'); const keep={sta:rp.r.sta,fat:rp.fat,la:rp.lastApp};
  const run=sta=>{ rp.r.sta=sta; rp.fat=0; let n=0; for(let d=1;d<=10;d++){ rp.lastApp=-99; if(!relAvail(rp,G.day+d))break; n++; rp.fat=clamp(rp.fat+pitFatGain(rp,18,false),0,100); const f0=rp.fat; recoverAll(1); void f0; } return n; };
  const lo=run(32), hi=run(68); rp.r.sta=keep.sta; rp.fat=keep.fat; rp.lastApp=keep.la; ok(hi>=lo+1,'매일 18구씩: 체력 32는 '+lo+'일, 체력 68은 '+hi+'일 연속 가능(더 길어야 함)');
  ok(staF({r:{sta:70}})<staF({r:{sta:40}})&&staI({r:{sta:70}})<staI({r:{sta:40}}),'체력 높을수록 부상·피로 배수가 낮아야 함'); ok(armCap({r:{sta:70},ld:[[1,90]]})>armCap({r:{sta:40},ld:[[1,90]]})*1.3,'선발 누적 부하 한도 차이가 작음');
  /* 시즌 이닝: 같은 조건에서 체력 +10이면 선발 이닝이 늘어난다는 것은 능력치 반영 점검(check-sens)이 본다(구단별 투수 운용이 섞인 단면 비교는 흔들려 쓰지 않는다) */ });
T('새 게임을 다시 만들면 이전 세계에서 계산해 둔 값(툴 기준·기대 홈런 회귀 등)을 쓰지 않는다',()=>{ DEMO.on=false; newGame(6); fdStart(); const a=fdToolRef(); newGame(3); fdStart(); const b=fdToolRef(); ok(a!==b,'이전 세계의 툴 기준을 그대로 씀'); });
T('창단 드래프트 툴 등급: 1군 주전 평균이 C 중급(70점대)이고, S 특급은 리그에 몇 명, A 상급은 구단 간판 정도다',()=>{ DEMO.on=false; newGame(6); fdStart(); const ly=G.fd.y-1;
  const P=Object.values(G.players).filter(p=>!p.foreign&&!p.prospect&&(p.team!=null||p.fdPool)).filter(p=>{ const h=seasonTotal(p,ly,'1군'); return h&&(p.isP?h.outs>=90:h.pa>=250); });
  for(const isP of [false,true]) for(const [k,l] of FD_TOOLS[isP?'P':'B']){ const A=P.filter(p=>p.isP===isP); const G2={}; let sn=0; for(const p of A){ const t=fdToolTrue(p,k); G2[t.g]=(G2[t.g]||0)+1; sn+=fdToolNum(t.v); } const n=A.length, f=g=>(G2[g]||0)/n, mean=sn/n;
    ok(mean>=72&&mean<=76,l+' 주전 평균 점수 '+mean.toFixed(1)); ok(f('S')<=.06,l+' S 비율 '+(f('S')*100).toFixed(1)+'%'); ok(f('A')+f('S')>=.03&&f('A')+f('S')<=.15,l+' A 이상 비율 '+((f('A')+f('S'))*100).toFixed(1)+'%');
    ok(f('C')>=.25&&['S','A','B','D','E'].every(g=>f(g)<=f('C')+.04),l+' C가 가장 많은 쪽이어야 함 '+JSON.stringify(G2)); }
  ok(FD_G(52.5)==='C'&&fdToolNum(52.5)===74,'주전 평균 = 74점 C'); ok(!/F/.test(['S','A','B','C','D','E'].map(g=>g).join('')+FD_G(5)),'F 등급이 남아 있음'); });
T('[리뷰 11-04] 포스트시즌 대진표 차전 점수: 모든 시리즈의 차전별 점수가 남고 승수·우리 경기 기록과 맞는다',()=>{ fresh(); simTo(()=>G.ps&&G.ps.done); ok(G.ps&&G.ps.done,'준비 실패: 포스트시즌이 끝나지 않음');
  for(const k of ['wc','spo','po','ks']){ const r=G.ps.res[k], D=G.ps.days[k]; ok(D&&D.p&&D.p.length===D.d.length,k+' 차전 점수 수 '+(D&&D.p?D.p.length:'없음')+' / 경기 '+(D?D.d.length:0));
    const w={}; D.p.forEach(([hs,as],i)=>{ const h=D.h[i], a=h===r[0]?r[1]:r[0]; if(hs!==as){ const t=hs>as?h:a; w[t]=(w[t]||0)+1; } }); ok((w[r[0]]||0)===r[2]&&(w[r[1]]||0)===r[3],k+' 점수로 센 승수가 결과와 다름: '+JSON.stringify(w)+' / '+r.join(','));
    for(const g of (G.sea.ulog||[]).filter(g=>(g.k||'').startsWith(ROUNDK[k]+' '))){ const i=D.d.indexOf(g.d); ok(i>=0&&D.p[i][0]===g.hs&&D.p[i][1]===g.as,k+' 우리 경기 '+g.d+' 점수가 기록과 다름'); } } });
T('창단 드래프트: 지명 뒤 공개하는 실제 툴 등급은 스카우트 등급과 같은 기준이다(추정 A → 실제 C처럼 기준 차이로 어긋나지 않게)',()=>{ DEMO.on=false; newGame(6); fdStart();
  const P=Object.values(G.players).filter(p=>p.fdPool); const out=[];
  for(const isP of [false,true]) for(const [k,l] of FD_TOOLS[isP?'P':'B']){ const A=P.filter(p=>p.isP===isP); if(A.length<20)continue; let dNew=0,dOld=0;
    for(const p of A){ const sg=fdScoutTools(p).L.find(t=>t.k===k).g; dNew+=FD_GL[sg]-FD_GL[fdToolTrue(p,k).g]; dOld+=FD_GL[sg]-FD_GL[FD_G(p.r[k])]; }
    const SP=fdScoutProfile(), bk=SP?(SP[isP?'P':'B'].find(t=>t.k===k)||{b:0}).b/9:0; /* 알려 준 스카우트 버릇(등급 단위)은 일부러 넣은 차이라 빼고 본다(버릇이 맞는지는 아래에서 따로) */
    out.push(l+' 새 '+(dNew/A.length).toFixed(2)+' 옛 '+(dOld/A.length).toFixed(2)+' 버릇 '+bk.toFixed(2)); ok(Math.abs(dNew/A.length-bk)<=.8,l+': 스카우트와 실제 등급 평균 차이 '+(dNew/A.length).toFixed(2)+'(버릇 '+bk.toFixed(2)+' 제외)'); }
  const pw=P.find(p=>!p.isP); const a=fdToolTrue(pw,'pow'); ok(a.v>=20&&a.v<=80&&FD_G(a.v)===a.g,'등급 계산');
  /* 스카우트 성향(지명 전에 공개): 알려 준 버릇이 실제로 후보 전체에서 스카우트 등급과 실제 등급의 평균 차이와 맞아야 한다 */
  const S=fdScoutProfile(); ok(S&&S.B.length===5&&S.P.length===3,'성향 없음'); for(const isP of [false,true]) for(const t of S[isP?'P':'B']){ const A=P.filter(p=>p.isP===isP); const m=A.reduce((a,p)=>a+fdScoutTools(p).L.find(x=>x.k===t.k).v-fdToolTrue(p,t.k).v,0)/A.length;
    ok(Math.abs(m-t.b)<=2.5,t.l+': 알려 준 버릇 '+t.b.toFixed(1)+' · 실제 평균 차이 '+m.toFixed(1)); } ok(/스카우트 기록/.test(fdScoutProfileTxt(false)),'성향 문구'); });
T('[기록] wRC+: 창단 드래프트 기록에도 들어가고, 퓨처스 기록은 퓨처스 리그 평균 기준으로 계산한다',()=>{ DEMO.on=false; newGame(6); fdStart(); const y=G.year-1;
  const P=Object.values(G.players).filter(p=>p.fdPool&&!p.isP); const one=P.map(p=>({p,s:fdStatLine(p,y)})).filter(x=>x.s&&x.s.lvl===1&&x.s.n>=150); ok(one.length>=10,'준비 실패: 1군 기록 '+one.length);
  ok(one.every(x=>typeof x.s.wrc==='number'),'창단 드래프트 기록에 wrc 없음');
  const fut=P.map(p=>(p.hist||[]).find(h=>h.y===y&&h.lvl==='퓨처스'&&h.pa>=100)).filter(Boolean); if(fut.length>=8){ const a=fut.reduce((s,h)=>s+wrcPlus(h,y)*h.pa,0)/fut.reduce((s,h)=>s+h.pa,0); ok(a>=80&&a<=120,'퓨처스 타석 가중 wRC+ '+a.toFixed(1)); }
  ok(wrcMulti([])==null,'빈 기록 통산 wRC+'); });
T('[난이도] 1위 견제: 우리가 선두를 달리면 경쟁 구단은 같은 트레이드에 더 많은 값을 요구하고, 선두가 아니면 요구가 그대로다',()=>{ fresh(); simTo(()=>period()==='season'&&G.day>=G.cal.open+3);
  const op=G.teams.find(t=>t.id!==G.user&&t.mode!=='rebuild')||G.teams.find(t=>t.id!==G.user); const mine=domestic(G.user).filter(q=>!q.foreign).sort((a,b)=>ovr(b)-ovr(a))[3], their=domestic(op.id).filter(q=>!q.foreign).sort((a,b)=>ovr(b)-ovr(a))[3];
  const R0=JSON.parse(JSON.stringify(G.sea.rec)); for(const t of G.teams)G.sea.rec[t.id]={w:15,l:15,t:0}; G.sea.rec[G.user]={w:30,l:5,t:0}; ok(leaderGap()>=1.5,'준비 실패: 독주 '+leaderGap());
  const a=evalTrade(op.id,[mine.id],[their.id],0).need; G.sea.rec[G.user]={w:10,l:25,t:0}; ok(leaderGap()===0,'선두가 아닌데 견제 '+leaderGap()); const b=evalTrade(op.id,[mine.id],[their.id],0).need; G.sea.rec=R0;
  ok(a>b+.1,'선두일 때 요구 '+a.toFixed(2)+' · 아닐 때 '+b.toFixed(2)); });
T('[실플레이 11-05b] FA 미계약 선수: 12월·1월에도 다른 구단 FA에게 제안할 수 있다',()=>{ fresh(); simTo(()=>G.fa&&!G.fa.closed&&G.day>=dnum(G.fa.y0,12,20)); const F=G.fa;
  const L=F.pool.map(id=>G.players[id]).filter(q=>q&&q.team==null&&q.faFrom!==G.user&&q.ask); ok(L.length,'준비 실패: 12월 20일에 남은 FA 없음'); const p=L[0]; const ng=F.neg&&F.neg[p.id];
  const r=faNegotiate(p.id,{annual:round5(p.ask.annual*1.2),years:p.ask.years}); ok(!/협상할 수 없는/.test(r.msg||''),'12월 제안 막힘: '+r.msg+' · unemp '+!!G.unemp+' · neg '+JSON.stringify(ng||null).slice(0,160)+' · out '+faOutN(G.user)+'/'+faCapN());
  const fr=freeList().filter(q=>!(q.relBan&&q.relBan[G.user]>G.day)&&q.relT!==G.user); ok(freeOpen(),'12월 무적 선수 등록 기간 닫힘: '+period()+' · preSettle '+preSettle()); if(fr.length){ while(rosterN(G.user)>=ROSTER_MAX)toFree(domestic(G.user).sort((x,y)=>ovr(x)-ovr(y))[0],'테스트'); const e=signFree(fr[0].id); ok(e==='','12월 무적 선수 계약 막힘: '+e); } });
`);
try{ env(T); }catch(e){ console.error=oe; console.log('준비 실패: '+e.stack.slice(0,400)); process.exit(1); }
let fail=0; const ONLY=process.env.ONLY; if(ONLY){ const L=results.filter(t=>t.name.includes(ONLY)); results.length=0; results.push(...L); if(!L.length){ console.log('실패  ONLY='+ONLY+' 에 해당하는 시나리오가 없습니다(0개 실행은 통과가 아님)'); process.exit(1); } } /* ONLY=문구: 이름에 그 문구가 든 시나리오만 */ const nameSeed=n=>{ let h=2166136261>>>0; for(let i=0;i<n.length;i++){ h^=n.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h|0; }; /* 시나리오마다 이름으로 난수 시작점을 정한다: 앞에 시나리오를 더해도 뒤 시나리오의 세계가 바뀌지 않게 */
for(const t of results){ try{ globalThis.__seed(nameSeed(t.name)); t.fn(); console.log('통과  '+t.name); }catch(e){ fail++; console.log('실패  '+t.name+'\n      → '+String(e.message).slice(0,300)); } }
console.error=oe;
console.log(fail?`규칙 점검: ${results.length}개 중 ${fail}개 실패`:`규칙 점검: ${results.length}개 모두 통과`); process.exit(fail?1:0);
