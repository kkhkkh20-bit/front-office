/* 검수 126~157: 결산·시상 성과의 주인, 업적 달성 조건, 단장 통산·구장 재정·개인 활동.
   각 항목을 실제 엔진 함수로 재현한다. --baseline이면 실패 수만 보고하고 멈추지 않는다(수정 전 코드에서 재현 확인용). */
const path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),baseline=process.argv.includes('--baseline');let seed=11;const old=Math.random;
Math.random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
try{const engine=require('./build.cjs').build({root,write:false}).engine;new Function('assert','baseline',engine+String.raw`
DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);for(const t of G.teams)depth(t.id);
const base=JSON.stringify(G);let failed=0;const results=[];
const reset=()=>{G=JSON.parse(base);worldReset();_achMem=null;try{delete globalThis.localStorage;}catch(e){}};
const test=(id,fn)=>{reset();try{fn();results.push({id,pass:true});console.log('#'+id+' PASS');}catch(e){failed++;results.push({id,pass:false});console.log('#'+id+' FAIL '+String(e&&e.message||e).split('\n')[0]);}};
const U0=()=>G.user, other=(k=0)=>G.teams.filter(t=>t.id!==G.user)[k].id, Y=()=>G.year;
const inSeason=()=>{G.day=G.cal.open+60;};
const recAll=(f)=>{for(const t of G.teams)G.sea.rec[t.id]=f(t.id);};
const lastFor=(y,o)=>({y,ps:{champ:o.champ??-1,runner:o.runner??-1,first:o.first??-1},order:G.teams.map(t=>({tid:t.id,w:(o.w||{})[t.id]??70,l:(o.l||{})[t.id]??70,t:0})),fins:{}});
const seas=(o)=>{myCInit();(G.myC.seas=G.myC.seas||[]).push({y:Y(),rank:1,t:0,ch:0,...o});};
const has=id=>!!(G.ach&&G.ach[id]);
const batters=U=>playersOf(U).filter(p=>!p.isP);
const h1=(o)=>({...bz(),lvl:'1군',...o});

/* ===== 결산·시상·단장 교체 ===== */
test(126,()=>{const U=U0(),y=Y();const T=achT();T.seasons=9;T.psRun=4;T.psBest=4;seas({tid:U,w:90,l:54,ch:2});G.ps={seeds:[U]};G.last=lastFor(y,{w:{[U]:90},l:{[U]:54},runner:U});
  G.unemp={y,msg:'경질',since:G.day,from:U,k:'fired'}; /* 결산에서 경질된 뒤 결산 후크가 돈다 */
  achCheck({k:'season'});assert.equal(T.seasons,10);assert.ok(has('s10'),'10시즌');assert.ok(has('ps5'),'5년 연속 가을야구');});
test(127,()=>{const U=U0(),B=other(),y=Y();seas({tid:U,w:80,l:64,ch:1});G.user=B;G.gmJoin={y,tid:B,w:70,l:70,t:0,psDone:true};G.ps={seeds:[U]};G.last=lastFor(y,{champ:U,runner:B});
  achCheck({k:'season'});assert.ok(has('champ1'),'첫 우승');assert.deepEqual(achT().titles[U],[y]);});
test(128,()=>{const U=U0(),B=other(),y=Y();seas({tid:U,w:80,l:64});G.ps={seeds:[]};G.last=lastFor(y,{});achCheck({k:'season'});
  const p=batters(U)[0];p.draft={y:y-3,rd:1,tid:U};G.user=B;G.unemp=null;G.awards={[y]:{mvp:{id:p.id,t:U,name:p.name},roy:{id:p.id,t:U,name:p.name},gg:{}}};
  achCheck({k:'award',a:'mvp'});assert.ok(has('draftMvp'),'안목');assert.ok(has('draftRoy'),'될성부른 떡잎');});
test(129,()=>{const U=U0(),B=other(),y=Y();G.myC=null;myCInit();G.myC.seas=[{y,tid:U,w:0,l:0,part:1}];switchTeam(B);G.gmJoin={y,tid:B,w:80,l:64,t:0,psDone:true};
  const p=batters(B)[0];p.draft={y:y-3,rd:1,tid:B};G.awards={[y]:{mvp:{id:p.id,t:B,name:p.name},roy:{id:p.id,t:B,name:p.name},gg:{}}};G.ps={seeds:[]};G.last=lastFor(y,{});achCheck({k:'season'});
  achCheck({k:'award',a:'mvp'});assert.ok(!has('draftMvp'),'전임 시즌 MVP');assert.ok(!has('draftRoy'),'전임 시즌 신인왕');});
test(130,()=>{const store={};globalThis.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}};
  achMeta();store[ACH_KEY]=JSON.stringify({u:{stadNew:{at:1,y:Y()}},champ:{},title:null}); /* 다른 탭이 먼저 '새 집'을 깨고 저장 */
  achUnlock('champ1');const S=JSON.parse(store[ACH_KEY]);assert.ok(S.u.stadNew,'다른 탭 과제 유지');assert.ok(S.u.champ1);});
const gmRows=(tid)=>legRec().L.filter(x=>x.t===tid);
test(131,()=>{inSeason();const t=team(other()),g0=t.gm;recAll(()=>({w:0,l:0,t:0}));G.sea.rec[t.id]={w:25,l:20,t:0};legTrack();
  t.gm={...mkGM(t.id),name:'단장대행',interim:true};G.sea.rec[t.id]={w:25,l:20,t:0};legTrack();G.sea.rec[t.id]={w:27,l:21,t:0};legTrack();
  switchTeam(t.id);G.sea.rec[t.id]={w:29,l:22,t:0};G.myC.seas.push({y:Y(),tid:t.id,rank:3,w:2,l:1,t:0,ch:0});
  G.last=lastFor(Y(),{w:{[t.id]:29},l:{[t.id]:22}});legSeason(legOwners());const R=gmRows(t.id);
  const fired=R.find(x=>x.k===g0.id);assert.ok(fired,'경질 단장 기록');assert.equal(fired.w,25);assert.equal(fired.l,20);
  assert.ok(!R.some(x=>x.w===27||x.w===29&&!x.u),'대행·후임에게 넘어가지 않음');const me=R.find(x=>x.u);assert.equal(me.w,2);assert.equal(me.l,1);});
test(132,()=>{inSeason();const t=team(other()),g0=t.gm;recAll(()=>({w:0,l:0,t:0}));G.sea.rec[t.id]={w:25,l:20,t:0};legTrack();
  t.gm={...mkGM(t.id),name:'단장대행',interim:true};legTrack();G.sea.rec[t.id]={w:27,l:21,t:0};legTrack();
  G.jobs=[{tid:t.id,done:false,exp:G.day+10}];jobAnswer(t.id,false);const g1=t.gm;assert.ok(!g1.interim);legTrack();
  G.sea.rec[t.id]={w:90,l:54,t:0};G.last=lastFor(Y(),{w:{[t.id]:90},l:{[t.id]:54}});legSeason(legOwners());const R=gmRows(t.id);
  const a=R.find(x=>x.k===g0.id),b=R.find(x=>x.k===g1.id);assert.ok(a,'경질 전 단장 기록');assert.equal(a.w,25);assert.equal(a.l,20);assert.equal(b.w,63);assert.equal(b.l,33);assert.equal(b.s,1);});

/* ===== 업적 달성 조건 ===== */
test(133,()=>{inSeason();const B=other();recAll(()=>({w:30,l:30,t:0}));G.sea.rec[B]={w:45,l:30,t:0};switchTeam(B);achFirstDaily();assert.ok(!has('fWin'),'부임 전 승리');G.sea.rec[B].w++;achFirstDaily();assert.ok(has('fWin'));});
test(134,()=>{inSeason();const B=other();recAll(()=>({w:30,l:40,t:0}));G.sea.rec[B]={w:50,l:20,t:0};switchTeam(B);achFirstDaily();assert.ok(!has('fLead'),'부임 전 선두');G.sea.rec[B].w++;achFirstDaily();assert.ok(has('fLead'));});
test(135,()=>{inSeason();const U=U0();recAll(()=>({w:3,l:7,t:0}));G.sea.rec[U]={w:9,l:0,t:1};G.gmJoin=null;achFirstDaily();assert.ok(has('fLead'),'9승 1무 선두');});
test(136,()=>{const B=other(),y=Y();G.day=G.cal.end+3;G.ps={done:false,seeds:[B],order:G.teams.map(t=>({tid:t.id})),res:{},round:'po'};switchTeam(B);
  G.myC.seas.push({y,tid:B,rank:1,w:0,l:0,t:0,ch:1});G.last=lastFor(y,{champ:B});G.ps={done:true,seeds:[B]};achCheck({k:'season'});assert.ok(has('champ1'));assert.ok(!has('firstYr'),'정규시즌 뒤 부임');});
test(137,()=>{const U=U0(),y=Y();seas({tid:U,w:5,l:3});G.ps={seeds:[]};G.last=lastFor(y,{w:{[U]:90},l:{[U]:54}});achCheck({k:'season'});assert.ok(!has('w90'),'전임 승수');});
test(138,()=>{inSeason();G.gmSinceD=G.day;facInit();G.fac.dn={gym:G.day-40};achFirstDaily();assert.ok(!has('fFac'),'부임 전 완공');G.fac.dn.lab=G.day;achFirstDaily();assert.ok(has('fFac'));});
test(139,()=>{const U=U0(),y=Y();const S=stadOf(U);S.names=[{until:dnum(y,3,1),n:'옛 구장'}];S.built=y;S.proj=null;G.gmSince=y;G.gmSinceD=dnum(y,7,1);G.day=dnum(y,7,2);achFirstDaily();assert.ok(!has('stadNew'),'부임 전 개장');assert.equal(achStadN(),0);});
test(140,()=>{const U=U0(),y=Y();for(const p of Object.values(G.players))p.draft=null;const d=depth(U).start.slice(0,5);d.forEach(p=>{p.draft={y:y-2,rd:1,tid:U};p.hist=p.hist.filter(h=>h.y!==y);});
  seas({tid:U,w:70,l:70});G.ps={seeds:[]};G.last=lastFor(y,{});achCheck({k:'season'});assert.ok(!has('youth5'),'0타석 지명 선수');
  reset();for(const p of Object.values(G.players))p.draft=null;batters(U).slice(0,5).forEach(p=>{p.draft={y:y-2,rd:1,tid:U};p.hist=p.hist.filter(h=>h.y!==y).concat(h1({y,t:U,pa:400,ab:360,g:120}));});seas({tid:U,w:70,l:70});G.ps={seeds:[]};G.last=lastFor(y,{});achCheck({k:'season'});assert.ok(has('youth5'),'실제 출전');});
test(141,()=>{const U=U0(),y=Y();const p=batters(U)[0];p.hist=p.hist.filter(h=>h.y!==y).concat(h1({y,t:U,pa:600,ab:540,h:170,hr:51,g:140}));p.sct={y,h:40,hr:15,w:0,sv:0};seas({tid:U,w:70,l:70});G.ps={seeds:[]};G.last=lastFor(y,{});achCheck({k:'season'});assert.ok(has('sea50'),'공식 51홈런');});
test(142,()=>{inSeason();const U=U0(),y=Y();const p=playersOf(U).find(q=>q.isP);p.hist=[h1({y,t:U,g:1,bf:1,outs:0,h:1})];achFirstDaily();assert.ok(has('fDebut'),'아웃 없는 구원 데뷔');});
test(143,()=>{const U=U0(),y=Y();G.day=G.cal.end;G.cal.sched[G.day]=[];G.makeup=[];const p=batters(U)[0];p.hist=[h1({y,t:U,pa:3,ab:3,g:1})];playDay(G.day);assert.ok(has('fDebut'),'최종일 데뷔');});
test(144,()=>{inSeason();const B=other(),y=Y();recAll(()=>({w:30,l:30,t:0}));const p=batters(B)[0];p.hist=[h1({y,t:B,pa:110,ab:100,g:30})];for(const q of playersOf(B))if(q!==p)q.hist=q.hist.filter(h=>h.y!==y);switchTeam(B);achFirstDaily();assert.ok(!has('fDebut'),'부임 전 데뷔');});
test(145,()=>{inSeason();G.rep=80;achFirstDaily();assert.ok(has('rep80'));});

/* ===== 통산 기록·구장 재정·개인 활동 ===== */
test(146,()=>{const U=U0(),y=Y();G.day=dnum(y,10,30);G.rolled=y-1;G.ps={done:true,finDay:G.day-2};seas({tid:U,w:90,l:54});G.sea.rec[U]={w:90,l:54,t:0};G.gmJoin=null;G.last={y};const S=myCStats();assert.equal(S.w,90);assert.equal(S.now,null,'올해 중복 표시');});
test(147,()=>{const U=U0(),y=Y();G.myC=null;myCInit();G.myC.seas=[{y,tid:U,rank:5,w:20,l:20,t:0,ch:0,part:1}];G.rolled=y;const S=myCStats();assert.equal(S.n,0,'마친 시즌');assert.equal(S.w,20);});
test(148,()=>{const U=U0(),B=other();G.gmP=G.gmP||{name:'검수'};G.day=G.cal.end+5;G.gmTen={tid:U,g:999};G.ps={done:false,round:'ks',res:{},order:G.teams.map(t=>({tid:t.id})),seeds:[U,B,other(1),other(2),other(3)]};G.ps.cur=mkSeries('ks',U,B,G.day);psDay(G.day);assert.equal(G.gmTen.g,1000);});
test(149,()=>{inSeason();const U=U0();G.gmP=G.gmP||{name:'검수'};G.gmTen={tid:U,g:999};gmTenTick();assert.ok(has('gm1000'),'1000경기 즉시');});
test(150,()=>{const U=U0(),c=G.cal;const days=Object.keys(c.sched).map(Number).filter(d=>d>=c.open&&d<=c.end&&c.sched[d].some(x=>x[0]===U)).sort((a,b)=>a-b);const d0=days[20];const pair=c.sched[d0].find(x=>x[0]===U);
  const total=homeGames(U,c.open,c.end).length;G.day=d0;G.makeup=[{y:Y(),h:U,a:pair[1],d:d0}];G.sea.att={[U]:{n:20,sum:20*12000,so:0,best:0}};assert.equal(stadProj(U).n,total,'홈경기 수');});
test(151,()=>{const U=U0();const t=team(U);t.cash=50000;G.day=dnum(Y(),1,5);const S=stadOf(U);S.lv.seat=2;assert.equal(stadStart('seat'),'');const c=G.spend.stad;
  S.proj={stage:'build',k:'mid',cap:21000,cost:9000,paid:9000,done:G.day};const cash0=t.cash;newStadTeam(U);const r=t.cash-cash0;assert.ok(r>0,'환급');assert.equal(G.spend.stad,c-r,'현금 투자액에서 환급 차감');});
test(152,()=>{const U=U0(),B=other();team(U).cash=50000;G.day=dnum(Y(),1,5);assert.equal(stadStart('seat'),'');const c=G.spend.stad;assert.ok(c>0);switchTeam(B);switchTeam(U);assert.equal(G.spend.stad,c,'돌아오면 그해 현금 투자 그대로');});
test(153,()=>{const U=U0(),S=personalState();S.cash=1000;S.found={y:Y()-1,paid:Y()-1,area:teamArea(U),list:[]};const L=Object.values(schList());const before=L.map(s=>schRel(s,U));G.unemp={y:Y(),msg:'',since:G.day,from:U,k:'resign'};foundYear(S);assert.deepEqual(Object.values(schList()).map(s=>schRel(s,U)),before,'야인 장학금이 전 구단 관계를 올림');});
test(154,()=>{const S=personalState();S.cash=1000;S.trip={to:G.day+10,l:'MLB 프런트 견학'};assert.match(personalAway(),/출장 중/);assert.match(personalActivity('network',other()),/출장 중/);});
test(155,()=>{const B=other(),C=personalGMContact(B);C.bond=33;team(B).gm=mkGM(B);assert.equal(personalGMBond(B),30);assert.equal(personalGMContact(B).bond,30);});
test(156,()=>{prInit();G.pr.fan=99;const S=personalState();S.cash=1000;S.last={};const t=personalActivity('fan');assert.match(t,/팬 여론 조금 호전/);assert.equal(G.pr.fan,100);
  G.pr.press=99;S.pressLog=[];const q=pressDinner(S);if(!/새어 나갔/.test(q))assert.match(q,/언론 논조가 조금 좋아졌습니다/);});
test(157,()=>{const A=U0(),B=other(0),C=other(1);switchTeam(B);switchTeam(C);assert.ok(has('teams3'));assert.equal(achMeta().u.teams3.team,tshort(C),'달성 구단');});
test('community-clash-foreign',()=>{const U=U0();const f=Object.values(G.players).find(p=>p.foreign&&p.team!=null);assert.ok(f);f.team=U;delete f.listed;const b=playersOf(U).find(p=>!p.foreign);G.evs=[];EVH.clash.make({a:f,b});const e=G.evs[G.evs.length-1];assert.ok(!e.opts.some(o=>/트레이드/.test(o.l)),'외국인 선수 트레이드 선택지');
  const t=EVH.clash.pick({data:{a:f.id,b:b.id}},2);assert.match(t,/벌금/);assert.ok(!f.listed);listPlayer(f.id);assert.ok(!f.listed);});
test('community-trim-unsigned',()=>{const U=U0();const weak=domestic(U).filter(p=>!p.ys).sort((a,b)=>keepScore(a)-keepScore(b)).slice(0,3);G.contract={done:false,ended:weak.map(p=>p.id),foreignEnd:[],neg:{}};const pool=trimPool().map(p=>p.id);assert.ok(weak.every(p=>pool.includes(p.id)),'연봉 미계약 선수가 정리 후보에서 빠짐');
  const n0=rosterN(U);releaseMany(weak.map(p=>p.id));assert.equal(rosterN(U),n0-3);assert.equal(G.contract.ended.length,0,'방출한 미계약 선수가 협상 목록에 남음');});
console.log(JSON.stringify({checked:results.length,failed,fails:results.filter(r=>!r.pass).map(r=>r.id)}));if(failed&&!baseline)throw Error(failed+' failed');
`)(assert,baseline);}finally{Math.random=old;}
