/* Explicit fixtures exercise current source only; no generated bundles or full-season simulation. */
const assert=require('node:assert/strict'),path=require('node:path');
const engine=require('./build.cjs').build({root:path.resolve(__dirname,'..'),write:false}).engine;
new Function('assert',engine+'\n'+String.raw`
DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);const base=JSON.stringify(G);let tests=0,failed=0;
function reset(){G=JSON.parse(base);worldReset();G.day=KD(7,1);G.mreq=[];G.mgrReq=null;G.mgr[G.user].rel=60;}
function test(name,fn){tests++;reset();try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.stack);}}
function weak(){for(const p of Object.values(G.players))if(p.team===G.user)for(const k of Object.keys(p.r))p.r[k]=20;worldReset();G._rg=null;}
function fill(){const sample=Object.values(G.players).find(p=>p.team===G.user&&!p.prospect);let id=900000;while(rosterN(G.user)<ROSTER_MAX){const p=JSON.parse(JSON.stringify(sample));p.id=id++;p.ys=false;p.mil={done:true};p.joinY=G.year;delete p.frehab;G.players[p.id]=p;}}
const event=r=>({data:{rid:r.id},opts:[{},{},{},{}]});
function request(k,data,days=20){const r=mreqAdd(k,data,G.day+days);r.st='open';return r;}
function acquired(r,state){const p=Object.values(G.players).find(p=>p.team!==G.user&&!p.isP&&!p.prospect);p.team=G.user;p.ys=false;p.joinY=G.year;p.mil={done:true};p.injOut=0;p.susp=0;delete p.ntAway;delete p.frehab;delete p.hold;for(const k of Object.keys(p.r))p.r[k]=75;p.pos='SS';acqStamp(p,'트레이드',G.user,{from:0});if(state==='injured')p.injOut=50;if(state==='ys')p.ys=true;if(state==='hold')p.hold=true;if(state==='next')p.joinY=G.year+1;if(state==='mil')p.mil={from:G.day-1,until:G.day+100};if(state==='ps'){G.day=G.cal.end+1;G.ps={done:false};p.acq.d=KD(8,16);}return p;}
test('공통 즉시전력 판정 제공',()=>assert.equal(typeof mgrReinforceReady,'function'));
test('7/31·8/1·8/16 및 PS 시장 실제 차이',()=>{G.day=KD(7,31);assert.ok(tradeOpen()&&foreignOpen()&&freeOpen());G.day=KD(8,1);assert.ok(!tradeOpen()&&foreignOpen()&&freeOpen());G.day=KD(8,16);assert.ok(!tradeOpen()&&!foreignOpen()&&freeOpen());G.day=G.cal.end+1;G.ps={done:false};assert.ok(!tradeOpen()&&!foreignOpen()&&!freeOpen());});
test('정원 만석이면 직접 보강 요청 생성 안 함',()=>{weak();fill();mreqMake('fit',{k:'pow',have:0});assert.equal(G.mreq.length,0);});
test('실제로 부족한 역할의 정상 요청 생성·수락·중복응답 방지',()=>{weak();mreqMake('fit',{k:'pow',have:0});assert.equal(G.mreq.length,1);const r=G.mreq[0];assert.equal(r.st,'ask');EVH.mreq.pick(event(r),0);assert.equal(r.st,'open');const rel=G.mgr[G.user].rel;EVH.mreq.pick(event(r),1);assert.equal(r.st,'open');assert.equal(G.mgr[G.user].rel,rel);});
test('주간 요청도 정원·기간 가드를 통과해야 생성',()=>{weak();fill();for(let i=0;i<40;i++)mreqWeek();assert.equal(G.mreq.filter(r=>MREQ_PLAYER.has(r.k)).length,0);});
test('트레이드 종료 뒤 직접 slot/fit 요청 차단',()=>{weak();G.day=KD(8,1);mreqMake('slot',{k:'SS',r:10});mreqMake('fit',{k:'pow',have:0});assert.equal(G.mreq.length,0);});
test('요청 후 수락 전 만석이면 무벌점 종료',()=>{weak();const r=mreqAdd('fit',{role:'pow'},G.day+20),m=G.mgr[G.user];fill();const rel=m.rel;EVH.mreq.pick(event(r),0);assert.equal(r.st,'void');assert.equal(m.rel,rel);});
test('타 구단·전임 감독 요청 응답 차단',()=>{const m=G.mgr[G.user],r=mreqAdd('out',{pid:playersOf(G.user)[0].id},G.day+10);r.tid=G.teams.find(t=>t.id!==G.user).id;const rel=m.rel;EVH.mreq.pick(event(r),0);assert.equal(r.st,'void');assert.equal(m.rel,rel);});
test('90 단순 보강 요청과 36 상세 보강 요청 중복 차단',()=>{weak();const m=G.mgr[G.user];G.mgrReq={k:'rp',mid:m.id,tid:G.user,until:G.day+30};mreqMake('fit',{k:'pow',have:0});assert.equal(G.mreq.length,0);const r=mreqAdd('fit',{role:'pow'},G.day+20);EVH.mreq.pick(event(r),0);assert.equal(r.st,'void');});
test('분석원 요청은 선수 보강 요청과 별도로 유지',()=>{weak();const m=G.mgr[G.user];G.mgrReq={k:'an',mid:m.id,tid:G.user,until:G.day+30};assert.equal(mreqGate('fit',{k:'pow'}),'');});
test('이미 충족한 역할은 요청 안 함',()=>{for(const p of playersOf(G.user))if(!p.isP){p.r.pow=80;p.r.con=80;p.e1=true;}worldReset();G._rg=null;assert.equal(roleGap(G.user,'pow'),0);mreqMake('fit',{k:'pow',have:0});assert.equal(G.mreq.length,0);});
for(const state of ['injured','ys','hold','next','mil','ps'])test('slot 보강 완료 제외: '+state,()=>{weak();const r=request('slot',{sk:'SS',v:0,target:null},200),p=acquired(r,state);r.data.target=p.id;mreqCheck();assert.equal(r.st,'open');assert.equal(G.mgr[G.user].rel,60);});
test('요청 이전 소속 선수 복귀는 새 영입 아님',()=>{weak();const p=playersOf(G.user).find(p=>!p.isP);p.mil={from:G.day-1,until:G.day+1};const r=request('slot',{sk:'SS',v:0,target:p.id});G.day++;mreqCheck();assert.equal(r.st,'open');});
test('요청 후 기한 안의 실제 출전가능 영입만 완료',()=>{weak();const r=request('slot',{sk:'SS',v:0,target:null}),p=acquired(r);r.data.target=p.id;mreqCheck();assert.equal(r.st,'done');assert.equal(G.mgr[G.user].rel,66);mreqCheck();assert.equal(G.mgr[G.user].rel,66);});
test('기한 뒤 영입은 보강 완료 아님',()=>{weak();const r=request('slot',{sk:'SS',v:0,target:null},1);G.day+=2;const p=acquired(r);r.data.target=p.id;mreqCheck();assert.equal(r.st,'fail');});
test('약속 뒤 스스로 정원 소비해도 자동 면책 없음',()=>{weak();const r=request('slot',{sk:'SS',v:0,target:null},1);fill();G.day+=2;mreqCheck();assert.equal(r.st,'fail');assert.equal(G.mgr[G.user].rel,55);});
test('외국인 교체 기한 뒤 등록은 완료 아님',()=>{const old=newForeign('용병',{isP:true});old.team=G.user;const r=request('frep',{pid:old.id,foreign:'용병'},1);old.team=null;G.day+=2;const p=newForeign('용병',{isP:true});p.team=G.user;acqStamp(p,'외국인',G.user);mreqCheck();assert.equal(r.st,'half');assert.equal(G.mgr[G.user].rel,60);});
test('기존 외국인 삭제 뒤 다른 쿼터 영입으로 교체 완료 안 됨',()=>{const old=newForeign('용병',{isP:true});old.team=G.user;const r=request('frep',{pid:old.id,foreign:'용병'});delete G.players[old.id];const p=newForeign('아시아',{isP:true});p.team=G.user;acqStamp(p,'외국인',G.user);mreqCheck();assert.equal(r.st,'open');});
test('약속 뒤 다른 외국인 교체로 횟수를 써도 기존 약속은 유지',()=>{const old=newForeign('용병',{isP:true});old.team=G.user;const r=request('frep',{pid:old.id,foreign:'용병'},1);G.sea.repl=G.sea.repl||{};G.sea.repl[G.user]=99;G.day+=2;mreqCheck();assert.equal(r.st,'fail');assert.equal(G.mgr[G.user].rel,56);});
test('이미 2군인 선수나 트레이드 종료 후 정리 요청 생성 안 함',()=>{const p=playersOf(G.user).find(p=>!p.isP);p.e1=false;mreqMake('out',p);assert.equal(G.mreq.length,0);p.e1=true;G.day=KD(8,1);mreqMake('out',p);assert.equal(G.mreq.length,0);});
test('겨울 FA 다음 시즌 합류 약속은 즉시전력 규정과 구분',()=>{G.day=KD(12,5);G.ps={done:true};G.last={y:G.year};G.rolled=G.year;const r=request('fa',{pid:0}),p=acquired(r,'next');r.data.pid=p.id;G.fa={open:true,closed:false,pool:[],offers:{},results:[{id:p.id,to:G.user,day:G.day}]};mreqCheck();assert.equal(r.st,'done');assert.equal(G.mgr[G.user].rel,67);});
console.log(tests+' manager event checks, '+failed+' failed');if(failed)throw Error(failed+' manager event checks failed');
`)(assert);
