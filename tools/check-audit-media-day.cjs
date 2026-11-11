const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
let seed=11; const old=Math.random; Math.random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
try {
const baseline=process.argv.includes('--baseline');
let engine=require('./build.cjs').build({root,write:false}).engine;
if(baseline){const media='src/engine/media/80_media_day.js';engine=engine.replace(fs.readFileSync(path.join(root,media),'utf8'),fs.readFileSync(process.argv[3],'utf8'));}
engine=engine.replace('createRandom(Math.random)','createRandom(()=>Math.random())'); /* 엔진이 매번 현재 Math.random을 부르게: 아래 시나리오가 Math.random을 0으로 고정해 감독 수락을 재현한다 */
new Function('assert','baseline',engine+`
DEMO.on=false; newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);for(const t of G.teams)depth(t.id);
const base=JSON.stringify(G), reset=()=>{G=JSON.parse(base);worldReset();G.day=G.cal.open-9;mdPlan();};
const pass=(id,ok)=>{console.log('#'+id+': '+(ok?'PASS':'REPRODUCED'));assert.equal(!!ok,!baseline,'미디어데이 #'+id);};
reset();let c=G.players[G.md.cap];c.susp=G.cal.open+5;G.day=G.cal.open-2;mdRun();pass(29,G.md.out.cap!==c.id);
reset();let alt=G.players[G.md.alts[0]];alt.injOut=14;let answer=mdSuggest(String(alt.id));pass(30,G.md.rep!==alt.id&&/참석|불가|상태/.test(answer));
reset();let r=G.players[G.md.rep];r.ntFrom=G.day;r.ntAway=G.cal.open+20;G.day=G.cal.open-2;mdRun();pass(31,G.md.out.rep!==r.id);
reset();c=G.players[G.md.cap];r=G.players[G.md.rep];c.team=G.teams.find(t=>t.id!==G.user).id;team(G.user).cap=r.id;answer=mdSuggest('ok');pass(32,G.md.cap!==G.md.rep&&!answer.includes(r.name+', '+r.name));
reset();G.day=G.cal.open-2;mdRun();const origin=G.user,other=G.teams.find(t=>t.id!==origin).id;switchTeam(other);G.day++;mdDaily();let articles=G.news.filter(x=>x.t.includes('미디어데이')||x.b.includes('개막 미디어데이'));pass(33,articles.some(x=>x.t.startsWith(tshort(origin)+' '))&&!articles.some(x=>x.t.startsWith(tshort(other)+' '))&&!G.mail.some(x=>x.day===G.day&&x.subj==='[기사] 개막 미디어데이 기사가 나왔습니다'));
reset();alt=G.players[G.md.alts[0]];const savedR=Math.random;Math.random=()=>0;mdSuggest(String(alt.id));Math.random=savedR;alt.injOut=14;G.day=G.cal.open-2;let replacement=mdRepPool(G.user)[0];replacement.age=23;for(const p of playersOf(G.user))p.mor=50;mdRun();pass(34,G.players[G.md.out.rep].mor===54+(G.md.out.jab?1:0));
reset();G.day=G.cal.end+5;G.ps={done:false};const s=mkSeries('spo',G.user,G.teams.find(t=>t.id!==G.user).id,G.day+1);r=playersOf(G.user).find(p=>!p.isP&&healthy(p));for(const p of playersOf(G.user)){p.hist=[];p.sea=null;}r.hist=[{y:G.year,lvl:'1군',t:G.user,...bz(),pa:600,ab:550,h:250,hr:80}];r.acq={tid:G.user,y:G.year,d:foreignDL()+1,k:'free'};let observed=[];const savedLine=initPers;initPers=p=>{observed.push(p.id);savedLine(p);};mdPsRun(s);initPers=savedLine;pass(35,!observed.includes(r.id));
reset();G.day=G.cal.end+5;for(const p of playersOf(G.user))p.injOut=30;mdPsRun(mkSeries('spo',G.user,G.teams.find(t=>t.id!==G.user).id,G.day+1));G.day++;mdPsPub();pass(36,!G.mail[0].body.includes('나간 선수들은 기분이 올랐습니다'));
reset();G.day=G.cal.end;const tied=G.teams.find(t=>t.id!==G.user).id;for(const t of G.teams){const rec=G.sea.rec[t.id];rec.w=t.id===G.user||t.id===tied?100:65-t.id;rec.l=144-rec.w;rec.t=0;}seasonEnd();assert.equal(G.ps.cur.round,'tb');assert.ok([G.ps.cur.hi,G.ps.cur.lo].includes(G.user));G.day=G.ps.cur.days[0]-1;mdDaily();pass(37,!(G.mdPsQ||[]).length);
reset();G.day=G.cal.open-2;mdRun();resignGM();G.day++;ivDaily();const published=G.md.pubd;G.day+=30;switchTeam(G.teams.find(t=>t.id!==G.user).id);const before=G.news.length;mdDaily();pass(38,published&&G.news.length===before);
if(!baseline){
reset();alt=G.players[G.md.alts[0]];alt.age=23;const rand=Math.random;Math.random=()=>0;mdSuggest(String(alt.id));Math.random=rand;assert.equal(G.md.res,'acc');G=JSON.parse(JSON.stringify(G));worldReset();for(const p of playersOf(G.user))p.mor=50;G.day=G.cal.open-2;mdRun();assert.equal(G.md.out.rep,alt.id);assert.equal(G.players[alt.id].mor,56+(G.md.out.jab?1:0));G.day++;ivDaily();assert.ok(G.mail.some(x=>x.subj==='[기사] 개막 미디어데이 기사가 나왔습니다'));
reset();G.day=G.cal.end+5;r=playersOf(G.user).find(p=>!p.isP&&healthy(p));for(const p of playersOf(G.user))p.hist=[];r.hist=[{y:G.year,lvl:'1군',t:G.user,...bz(),pa:600,ab:550,h:200,hr:30}];r.mor=50;G.ps={done:false};mdPsRun(mkSeries('spo',G.user,G.teams.find(t=>t.id!==G.user).id,G.day+1));assert.equal(G.mdPsQ[0].players,1);assert.equal(r.mor,53);G.day++;mdPsPub();assert.ok(G.mail[0].body.includes('나간 선수들은 기분이 올랐습니다'));
console.log('정상 건의 +6 / 저장 복원 / 소속 구단 기사 메일 / 자격 있는 PS 선수 +3 검증 통과');
}
console.log('미디어데이: 현재 소스 메모리 빌드 / 통제 상태 10개 검사 완료');
`)(assert,baseline);
}finally{Math.random=old;}
