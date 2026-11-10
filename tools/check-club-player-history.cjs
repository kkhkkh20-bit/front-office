const assert=require('node:assert/strict'),path=require('node:path');
const {build}=require('./build.cjs');
const engine=build({root:path.resolve(__dirname,'..'),write:false}).engine;
new Function('assert',engine+`
{
DEMO.on=false;newGame(6);const calls=[],originalChron=chron;
chron=function(...a){calls.push({k:a[0],t:a[1],ref:a[2],tid:a[3],opt:a[4]});return originalChron(...a);};
fdStart();fdAdvance(false);let guard=0;while(G.fd&&!G.fd.done&&guard++<500)fdAdvance(true);
const teams=G.teams.map(t=>t.id),ai=teams.find(t=>t!==G.user),ai2=teams.find(t=>t!==G.user&&t!==ai);
assert.ok(teams.every(tid=>calls.some(x=>x.k==='draft'&&x.tid===tid)),'창단 지명은 AI 포함 전 구단');
console.log('창단 지명·추가 배분 전 구단 기록 통과');
calls.length=0;const p=playersOf(ai).find(p=>!p.foreign),nm=p.name;
mvLog('트레이드',p,ai,ai2,'연봉 덜어내기',0,mvTr());
assert.deepEqual(calls.map(x=>x.tid),[ai,ai2]);assert.ok(calls.every(x=>x.ref===p.id&&x.t.includes(nm)&&x.t.includes('연봉 덜어내기')));
const snap=calls[0].t;p.name='나중 이름';p.team=G.user;assert.equal(calls[0].t,snap);assert.ok(!snap.includes('나중 이름'));
console.log('AI 간 트레이드 양쪽 구단·이름/원인 스냅숏 통과');
for(const type of ['FA','보상선수','웨이버 양수','2차 드래프트']){calls.length=0;mvLog(type,p,ai,ai2,'3년 연 2억 · 양도금 1억',600);assert.deepEqual(calls.map(x=>x.tid),[ai,ai2]);assert.ok(calls.every(x=>x.t.includes('3년 연 2억')));}
calls.length=0;mvLog('FA',p,ai,ai,'잔류 3년 연 2억',600);assert.equal(calls.length,1);assert.equal(calls[0].tid,ai);assert.match(calls[0].t,/잔류/);
console.log('FA·보상·웨이버·2차드래프트 양 구단, 잔류 1회 통과');
const cashNote=mvTradeNote(ai,ai2,300,{give:[],get:[]});assert.ok(cashNote.includes(tname(ai))&&cashNote.includes(tname(ai2))&&cashNote.includes(money(300)));const reverseNote=mvTradeNote(ai,ai2,-300,{give:[],get:[]});assert.ok(reverseNote.indexOf(tname(ai2))<reverseNote.indexOf(tname(ai)));calls.length=0;mvLog('트레이드',p,ai,ai2,cashNote,0,mvTr());assert.ok(calls.every(x=>x.t.includes('승계 연봉')));
console.log('현금 지급 방향·트레이드 승계 계약 조건 스냅숏 통과');
calls.length=0;p.team=ai;toFree(p,'전력 외 방출',0,true);assert.equal(calls.length,1);assert.equal(calls[0].tid,ai);assert.match(calls[0].t,/무소속/);assert.match(calls[0].t,/전력 외 방출/);
G.day=KD(9,20);G.cal.end=Math.max(G.cal.end,G.day+5);G.last={y:G.year-1};G.ps=null;assert.equal(signFree(p.id,ai2),'');assert.equal(calls.at(-1).tid,ai2);assert.match(calls.at(-1).t,/무소속/);
console.log('실제 방출→국내 무적 영입의 올바른 소속·조건 기록 통과');
calls.length=0;const unsigned=newPlayer({age:35,base:33,pot:34,team:null,isP:false,pos:'LF'});for(const k of Object.keys(unsigned.r))unsigned.r[k]=38;unsigned.faFrom=G.user;unsigned.ask={annual:100,years:1};unsigned.faPrevSal=100;G.fa={pool:[unsigned.id],ai:{},offers:{},results:[],y0:G.year};faClose();assert.equal(unsigned.team,null);assert.ok(calls.some(x=>x.ref===unsigned.id&&x.tid===G.user&&x.t.includes('FA 미계약')));
calls.length=0;const foreign=newForeign('용병',{market:true,isP:false});foreign.team=ai;foreign.age=28;for(const k of Object.keys(foreign.r))foreign.r[k]=70;const fc={foreignEnd:[foreign.id],foreignDrop:[foreign.id],fFree:[foreign.id],y:G.year};fReFinish(fc,ai);assert.ok(calls.some(x=>x.ref===foreign.id&&x.tid===ai&&x.t.includes('외국인 계약 종료')));assert.equal(foreign.team,null);
console.log('실제 FA 미계약·외국인 재계약 결렬의 원소속 기록 통과');
calls.length=0;mvLog('해외 진출',p,ai2,null,'포스팅 · Example(MLB) 3년 총 900만 달러 · 포스팅 비용 5억');assert.equal(calls.length,1);assert.match(calls[0].t,/해외 구단/);assert.ok(!calls[0].t.includes('무소속'));
mvLog('해외 복귀',p,null,ai,'MLB 3년 뒤 복귀 · 2년 연 3억',600);assert.equal(calls.at(-1).tid,ai);assert.match(calls.at(-1).t,/2년 연 3억/);
console.log('해외 진출·복귀는 무소속과 구분하고 당시 계약조건 기록 통과');
calls.length=0;G.draftClass=[];makeDraftClass();startDraft();const d=G.draft;d.picks=[{tid:ai,rd:4,no:7},{tid:G.user,rd:8,no:6}];d.cur=0;assert.equal(doPick(d.cls[0]),true);assert.equal(calls.filter(x=>x.k==='draft').length,1);let ev=calls.find(x=>x.k==='draft');assert.equal(ev.tid,ai);assert.match(ev.t,/4라운드 7순위/);assert.match(ev.t,/계약금/);const text=ev.t;G.players[ev.ref].team=G.user;assert.equal(ev.t,text);assert.equal(doPick(d.cls.find(id=>G.players[id]&&G.players[id].prospect)),true);assert.ok(calls.some(x=>x.k==='draft'&&x.tid===G.user&&x.t.includes('8라운드')));
console.log('실제 AI 4라운드·유저 8라운드 지명·계약금·차년도 합류 기록 통과');
calls.length=0;const m=playersOf(ai).find(q=>!q.foreign);m.mil=null;enlist(m,'현역',G.day+2);assert.equal(calls.filter(x=>x.k==='mil').length,0,'예약은 실제입대가 아님');G.day+=2;milDaily();assert.ok(calls.some(x=>x.k==='mil'&&x.tid===ai&&x.ref===m.id&&x.t.includes('입대')));calls.length=0;G.day=m.mil.until;milDaily();assert.ok(calls.some(x=>x.k==='mil'&&x.tid===ai&&x.ref===m.id&&x.t.includes('전역')));
console.log('AI 실제 입대·전역 기록, 예약 제외 통과');
const military=clubChron(ai).filter(x=>x.k==='mil'&&x.ref===m.id),beforeRepeat=military.length;milChron(m,'전역',m.mil.unit,m.mil.pf,m.mil.pu);assert.equal(clubChron(ai).filter(x=>x.k==='mil'&&x.ref===m.id).length,beforeRepeat,'같은 실제 복무 이벤트는 중복하지 않는다');
const firstSeq=(G.mvN||0)+1;for(let i=0;i<605;i++)mvLog('검수 이동',p,null,ai,'영속 검수 '+i);assert.equal(G.moves.length,600);const oldest=clubChron(ai).find(x=>x.source==='mv:'+firstSeq+':in');assert.ok(oldest);assert.match(oldest.t,/영속 검수 0/);G.user=ai2;G.unemp=true;assert.ok(clubChron(ai).some(x=>x.id===oldest.id));
console.log('군 복무 이벤트 중복 방지·600건 장부 초과·이직/야인 후 AI 연대기 보존 통과');
G=JSON.parse(JSON.stringify(G));worldReset();assert.ok(clubChron(ai).some(x=>x.ref===m.id&&x.k==='mil'));assert.ok(clubChron(ai).some(x=>x.source==='mv:'+firstSeq+':in'));
console.log('이동·지명·병역 구단 기록 JSON 저장/복원 통과');
}
`)(assert);
console.log('전 구단 선수 이동·지명 이력 검사 통과');
