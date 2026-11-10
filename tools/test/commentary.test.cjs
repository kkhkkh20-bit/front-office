const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){const root=path.resolve(__dirname,'../..'),players={1:{id:1,name:'박진욱',th:'우',r:{stf:50,spd:50,pow:50}},2:{id:2,name:'김수호',pos:'SS',r:{spd:50}},3:{id:3,name:'이민호',pos:'SS',r:{spd:50}}};for(let id=10;id<45;id++)players[id]={id,name:'타자'+id,bt:'우',r:{spd:50,pow:50}};const safeMath=Object.create(Math);safeMath.random=()=>{throw Error('중계가 경기 난수를 소비함');};const ctx={G:{players},pNmAny:id=>players[id]?.name||'선수',Math:safeMath,tshort:id=>id===0?'홈팀':'원정팀',storedPitchSequence:r=>r[15]?.pitches||null,seasonAt:()=>({hr:5}),arsenal:()=>[['직구',50]],fieldV:()=>50,gbT:()=>.5,catArm:()=>55,mgrOf:()=>({name:'감독',small:50}),posLabel:()=> '투수',consecDays:()=>0,eraAt:()=> '0.00',pbpState(g,k){const r=g.pbp[k];return {sa:r[7]||0,sh:r[8]||0,bases:r[5]||[0,0,0],outs:r[4]||0,half:r[0]};}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'src/ui/matches/23_match_dashboard.js'),'utf8').split('function castSnapshot')[0],ctx);for(const file of ['42_commentary.js','43_live_commentary.js'])vm.runInContext(fs.readFileSync(path.join(root,'src/ui/matches',file),'utf8'),ctx);const game=pbp=>({day:900,home:0,away:1,pbp,box:{h:{bat:[],pit:[{id:1}],lineup:[]},a:{bat:[],pit:[{id:1}],lineup:[]}}});return {ctx,game};}
test('장타 멘트는 다양하고 같은 표현을 연속 반복하지 않으며 결과와 난수를 보존한다',()=>{const {ctx,game}=fixture(),g=game(Array.from({length:30},(_,i)=>[0,10+i,1,'2B',0,[0,10+i,0],i?1:0,i,0])),before=JSON.stringify([g,ctx.G]),lines=g.pbp.map((_,k)=>ctx.pbpCall(g,k));for(let k=0;k<lines.length;k++){assert.match(lines[k].c,/2루타/);assert.deepEqual(ctx.pbpCall(g,k),lines[k]);}const normalize=s=>s.replace(/타자\d+/g,'타자').replace(/\d+/g,'N'),heads=lines.slice(1).map(v=>normalize(v.c));assert.ok(new Set(heads).size>=6);for(let i=1;i<heads.length;i++)assert.notEqual(heads[i],heads[i-1],'같은 결과의 연속 문구 반복');assert.equal(JSON.stringify([g,ctx.G]),before);});
test('홈런·끝내기·밀어내기는 실제 점수에 반응하고 없는 비거리나 투구 정보를 말하지 않는다',()=>{const {ctx,game}=fixture(),normal=game([[0,10,1,'HR',0,[0,0,0],1,1,0]]),hr=ctx.pbpCall(normal,0);assert.match(hr.c,/홈런/);assert.doesNotMatch(hr.c,/비거리|\d+m|좌중간|우중간/);assert.equal(hr.a,'');assert.doesNotMatch(hr.c,/시즌 6호/,'기록 없는 옛 경기에 현재 시즌 기록을 붙이지 않음');const walk=game([[17,10,1,'1B',0,[10,0,0],0,2,1],[17,11,1,'HR',0,[0,0,0],2,2,3]]);assert.match(ctx.pbpCall(walk,1).c,/끝내기/);const loaded=game([[0,10,1,'1B',2,[10,11,12],0,0,0],[0,13,1,'BB',2,[13,10,11],1,1,0]]);assert.match(ctx.pbpCall(loaded,1).c,/밀어내기/);assert.doesNotMatch(ctx.pbpCall(loaded,1).a,/방망이|적시타/,'2아웃 밀어내기를 안타로 해설하지 않음');const legacy=game([[0,10,1,'K',1,[0,0,0],0,0,0]]);assert.doesNotMatch(ctx.pbpCall(legacy,0).c,/루킹|헛스윙|커브|슬라이더/);});
test('타석 도입은 미래 결과를 숨기고 공별 해설은 기록된 카운트·구종을 따른다',()=>{const {ctx,game}=fixture(),g=game([[0,10,1,'HR',0,[0,0,0],1,1,0]]);assert.doesNotMatch(ctx.pcAtBatIntro(g,0).c,/홈런|끝내기|2루타/);const intro=ctx.pcAtBatIntro(g,0);g.pbp[0][3]='OUT';g.pbp[0][6]=0;g.pbp[0][7]=0;assert.deepEqual(ctx.pcAtBatIntro(g,0),intro,'타석 도입 표현도 미래 결과와 독립적');g.pbp[0][3]='HR';assert.equal(ctx.pcPitchCall(g,0,{res:'타격',t:'직구',b:0,s:0},0),null);const ball=ctx.pcPitchCall(g,0,{res:'볼',t:'직구',b:2,s:0},0);assert.match(ball.c,/쓰리 볼/);assert.equal(ball.a,'');const foul=ctx.pcPitchCall(g,0,{res:'파울',t:'커브',b:0,s:2},0);assert.match(foul.c,/파울|커트/);assert.equal(foul.a,'');const strike=ctx.pcPitchCall(g,0,{res:'루킹 삼진',t:'슬라이더',b:1,s:2},0);assert.match(strike.c,/슬라이더.*루킹 삼진/);});
test('타석 도입의 표현 선택도 아직 공개하지 않은 결과와 무관하다',()=>{const {ctx,game}=fixture(),g=game([[0,10,1,'HR',0,[0,0,0],1,1,0],[0,11,1,'HR',0,[0,0,0],1,2,0]]);for(let day=0;day<40;day++){g.day=day;g.pbp[1][3]='HR';g.pbp[1][6]=1;g.pbp[1][7]=2;const before=ctx.pcAtBatIntro(g,1);g.pbp[1][3]='OUT';g.pbp[1][6]=0;g.pbp[1][7]=1;assert.deepEqual(ctx.pcAtBatIntro(g,1),before);}});
test('수비 이름은 교체가 발생한 재생 시점의 실제 라인업을 읽는다',()=>{const {ctx,game}=fixture(),g=game([[0,10,1,'OUT',1,[0,0,0],0,0,0],[0,11,1,'OUT',2,[0,0,0],0,0,0]]);g.box.h.lineup=[{id:2,pos:'SS',n:'김수호'}];g.box.h.changes=[{at:1,lineup:[{id:3,pos:'SS',n:'이민호'}]}];assert.equal(ctx.pcFielder(g,0,'SS',0),'김수호');assert.equal(ctx.pcFielder(g,0,'SS',1),'이민호');});
test('멀티홈런과 부진 탈출은 경기 전 사실과 공개된 타석만 읽는 캐스터 한 줄이다',()=>{
 const {ctx,game}=fixture(),g=game([[0,10,1,'HR',0,[0,0,0],1,1,0],[2,10,1,'HR',0,[0,0,0],1,2,0]]);
 g.broadcast={regular:true,teams:{a:'기아'},players:{10:{power:true,hitless:4,season:{hr:9,h:20},career:{hr:99,h:900}}}};
 assert.match(ctx.pbpCall(g,1).c,/또.*멀티홈런.*타자10/);assert.equal(ctx.pbpCall(g,1).a,'');
 assert.ok(ctx.pcRecords(g,0).some(r=>/시즌 10호|통산 100/.test(r.text)));
 g.pbp[0][3]='1B';assert.match(ctx.pbpCall(g,0).c,/5경기 만.*안타/);
 delete g.broadcast;assert.doesNotMatch(ctx.pbpCall(g,0).c,/경기 만/,'정보 없는 옛 저장에 부진 기록을 만들지 않음');
});
test('사이클링은 네 종류 안타를 채운 그 타석에만 알린다',()=>{
 const {ctx,game}=fixture(),g=game(['1B','2B','HR','3B','1B'].map((o,i)=>[i*2,10,1,o,0,[10,0,0],o==='HR'?1:0,1,0]));
 for(let k=0;k<3;k++)assert.equal(ctx.pcRecords(g,k).some(r=>r.kind==='cycle'),false);
 assert.match(ctx.pcRecords(g,3).find(r=>r.kind==='cycle').text,/사이클링 히트/);
 assert.equal(ctx.pcRecords(g,4).some(r=>r.kind==='cycle'),false);
});
test('노히트 도전과 달성을 구별하고 사구·실책 출루를 퍼펙트로 부르지 않는다',()=>{
 const {ctx,game}=fixture();let score=0;
 const rows=[];for(let inn=0;inn<9;inn++){for(let o=1;o<=3;o++)rows.push([inn*2,10+o,1,'K',o,[0,0,0],0,0,score]);if(inn<8){score=1;rows.push([inn*2+1,20,1,'HR',0,[0,0,0],1,0,1]);}}
 const g=game(rows);assert.ok(ctx.pcRecords(g,rows.findIndex(x=>x[0]===10&&x[4]===3)).some(r=>r.kind==='challenge'));
 assert.ok(ctx.pcRecords(g,rows.length-1).some(r=>/퍼펙트게임/.test(r.text)));
 g.pbp.unshift([0,14,1,'HBP',0,[14,0,0],0,0,0]);assert.ok(ctx.pcRecords(g,g.pbp.length-1).some(r=>/노히트 노런/.test(r.text)));
 assert.ok(ctx.pcRecords(g,g.pbp.length-1).every(r=>!/퍼펙트게임/.test(r.text)));
 g.pbp[0][3]='1B';assert.ok(ctx.pcRecords(g,g.pbp.length-1).every(r=>!['nohit','perfect'].includes(r.kind)));
});
test('팀 합작과 비자책 실점, 노히트가 깨지는 안타를 구분한다',()=>{
 const {ctx,game}=fixture(),rows=[];for(let inn=0;inn<9;inn++)for(let out=1;out<=3;out++)rows.push([inn*2,10+out,inn<5?1:3,'K',out,[0,0,0],0,0,1]);const g=game(rows);
 assert.match(ctx.pcRecords(g,26).find(r=>r.kind==='nohit').text,/팀 합작 노히트 노런/);
 g.pbp[0][6]=1;assert.equal(ctx.pcRecords(g,26).some(r=>r.kind==='nohit'),false,'비자책 실점도 노런이 아님');
 g.pbp[0][6]=0;g.pbp.push([18,14,1,'1B',0,[14,0,0],0,0,1]);assert.match(ctx.pbpCall(g,27).c,/노히트 행진을 멈/);
});
test('기록 알림도 미래 선수 수치와 무관하며 좁은 화면에서는 내용을 한 줄씩 모두 이어간다',()=>{
 const {ctx,game}=fixture(),g=game([[0,10,1,'HR',0,[0,0,0],1,1,0]]);g.broadcast={regular:true,players:{10:{season:{hr:19,h:100},career:{hr:199,h:999}}}};
 const before=JSON.stringify(ctx.pcRecords(g,0));ctx.G.players[10].r.pow=90;ctx.G.players[10].hist=[{hr:999,h:9999}];assert.equal(JSON.stringify(ctx.pcRecords(g,0)),before);
 const text='김상수, 사이클링 히트! 네 종류의 안타를 모두 해냅니다!',parts=ctx.pcCaptionParts(text,18);assert.ok(parts.every(s=>s.length<=18));assert.equal(parts.join(' '),text);assert.ok(parts.length>1);
});
test('정규시즌 부진을 포스트시즌 기록으로 부르지 않고 야수선택을 실책으로 단정하지 않는다',()=>{
 const {ctx,game}=fixture(),g=game([[0,10,1,'1B',0,[10,0,0],0,0,0]]);g.broadcast={regular:false,players:{10:{hitless:7}}};assert.doesNotMatch(ctx.pbpCall(g,0).c,/경기 만/);
 g.pbp[0][3]='OUT';g.pbp[0][4]=1;assert.doesNotMatch(ctx.pbpCall(g,0).c,/실책/);assert.match(ctx.pbpCall(g,0).c,/1루.*살아/);
});
test('1500탈삼진도 통산 이정표로 알린다',()=>{
 const {ctx,game}=fixture(),g=game([[0,10,1,'K',1,[0,0,0],0,0,0]]);g.broadcast={regular:true,players:{1:{season:{so:99},career:{so:1499}}}};assert.ok(ctx.pcRecords(g,0).some(r=>r.kind==='career'&&r.text.includes('1500탈삼진')));
});
test('마지막 아웃이 도루자여도 노히트 노런 달성을 알린다',()=>{
 const {ctx,game}=fixture(),rows=[];for(let inn=0;inn<8;inn++)for(let out=1;out<=3;out++)rows.push([inn*2,10+out,1,'K',out,[0,0,0],0,0,1]);rows.push([16,11,1,'K',1,[0,0,0],0,0,1],[16,12,1,'K',2,[0,0,0],0,0,1],[16,14,1,'HBP',2,[14,0,0],0,0,1],[16,'CS',14,3,[0,0,0]]);const g=game(rows);assert.ok(ctx.pcRecords(g,rows.length-1).some(r=>r.kind==='nohit'));assert.ok(ctx.pbpCall(g,rows.length-1).records.some(r=>r.kind==='nohit'));
});
