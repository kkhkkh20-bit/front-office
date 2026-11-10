const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),baseline=process.argv.includes('--baseline');
function baseSource(f){try{return cp.execFileSync('git',['show','01ffefcf:'+f],{cwd:root,encoding:'utf8'});}catch(e){if(e.status===0&&e.stdout)return e.stdout;throw e;}}
let engine=require('./build.cjs').build({root,write:false}).engine;
if(baseline)for(const f of ['src/engine/career/33_ob.js','src/engine/players/83_stars.js','src/engine/media/22_club_history.js','src/engine/career/27_other_gms.js'])engine=engine.replace(fs.readFileSync(path.join(root,f),'utf8'),()=>baseSource(f));
// Fix only the commemorative-demand normal draw so the upper-tail regression is deterministic.
engine=engine.replace('Math.exp(N(0,.35))','Math.exp(1.7)');
new Function('assert','baseline',engine+String.raw`
DEMO.on=false;newGame(6);const initial=JSON.stringify(G),results=[];
function fresh(){G=JSON.parse(initial);G.evs=[];G.evRecent={};G.mail=[];G.spend={};G.pr.fan=50;G.unemp=null;return playersOf(G.user)[0];}
function check(n,bug,detail){assert.equal(!!bug,baseline,'#'+n+' '+detail);results.push({n,observed:baseline?'재현':'수정 확인',detail});}
function father(p){G.ob=[];const o=obMake({fid:'father-fixture',name:'김가족',team:G.user,age:74,retY:G.year-10,isP:false,pos:'외야수',ys:10,seasons:15,war:30});o.no=99;o.path='media';o.readyY=G.year+10;p.father=o.id;p.draft={rd:1,no:1,y:G.year,tid:G.user};for(const q of playersOf(G.user))q.no=1; p.no=2;p.noT=p.team;return o;}
{const p=fresh(),o=father(p);obYear();check(20,!fatherOf(p),'75세 아버지 인물 연결');}
{const p=fresh(),o=father(p);G.retNos=[{name:o.name,no:99,ob:'different-person'}];sonDrafted(p);check(21,G.evs.some(e=>e.k==='son2'),'동명이인 다른 ID 결번');}
{const p=fresh(),o=father(p);G.retNos=[{name:o.name,no:99,ob:o.id}];sonDrafted(p);const e=G.evs.find(e=>e.k==='son2'),q=playersOf(G.user).find(x=>x!==p);q.no=99;q.noT=q.team;evPick(e.id,0);check(22,p.no===q.no,'승인 직전 등번호 중복');}
{const p=fresh(),o=father(p);G.retNos=[{name:o.name,no:99,ob:o.id}];sonDrafted(p);evPick(G.evs.find(e=>e.k==='son2').id,0);assert.equal(p.no,99);assert.equal(setPlayerNo(p.id,98),'');check(23,setPlayerNo(p.id,99)!=='','허락 받은 선수의 번호 재사용');}
{const p=fresh();G.pr.fan=1;const a=memoDemand(p);G.pr.fan=0;const b=memoDemand(p);check(24,b>a,'팬 여론 0과 1 수요 연속성');}
{const p=fresh(),q=playersOf(G.user).find(x=>x!==p),f={maj:true,k:'mile',txt:'통산 2000안타'};memoAsk(f,p);memoAsk(f,q);const first=G.evs.find(e=>e.k==='memo');evPick(first.id,2);check(25,!G.evs.some(e=>e.k==='memo'&&!e.done&&e.data.pid===q.id),'다른 선수의 같은 날 기념상품 제안 보존');}
{const p=fresh();team(G.user).indie=true;team(G.user).cash=0;memoAsk({maj:true,k:'mile',txt:'통산 2000안타'},p);const e=G.evs.find(e=>e.k==='memo');evPick(e.id,1);check(26,(G.spend.fan||0)>0,'현금 없는 독립구단 제작 승인');if(!baseline)assert.equal(e.done,false,'자금 부족이면 결정 미완료');}
{const p=fresh();team(G.user).indie=false;const expected=memoDemand(p);EVH.memo.pick({data:{pid:p.id,nm:'검사 상품'}},1);const sold=G.memoL[0].sold;check(27,sold>Math.round(expected*1.5),'강한 수요 난수의 안내 범위 초과');}
{fresh();G.spend={fanIn:600,goods:600};G.unemp0=true;const tid=G.user,cash=team(tid).cash;spendHandOff(tid);const ledger=G.hoL[fyNow()+':'+tid];assert.equal(team(tid).cash,cash+600,'전 구단 현금 보존');check(28,!ledger.inc['기념 유니폼 판매'],'이직 전 구단 기념상품 장부 항목');}
if(!baseline){
 {const p=fresh(),o=father(p);assert.equal(sonRetOwn({name:o.name,no:99,ob:'wrong'},o),false);assert.equal(sonRetOwn({name:o.name,no:99,pid:'wrong'},o),false);assert.equal(sonRetOwn({name:o.name,no:99},o),true,'이름만 있던 옛 저장 호환');G.retNos=[{name:o.name,no:99,ob:o.id}];sonDrafted(p);evPick(G.evs.find(e=>e.k==='son2').id,0);const q=playersOf(G.user).find(q=>q!==p);assert.notEqual(setPlayerNo(q.id,99),'','아들 이외의 선수는 허락 재사용 불가');p.team=G.teams.find(t=>t.id!==G.user).id;assert.equal(playerNoPermit(p,G.retNos[0]),false,'다른 구단으로 허락 유출 금지');}
 {const p=fresh();team(G.user).indie=true;team(G.user).cash=500;memoAsk({maj:true,k:'mile',txt:'첫 기록'},p);const e=G.evs.find(e=>e.k==='memo');assert.equal(EVH.memo.can(e,0),'');evPick(e.id,0);assert.ok(G.spend.fan>0);assert.notEqual(EVH.memo.can(e,0),'','이미 약정된 제작비를 재사용하지 않음');memoAsk({maj:true,k:'mile',txt:'다른 기록'},p);assert.equal(G.evs.filter(e=>e.k==='memo').length,1,'같은 선수 120일 제안 제한 유지');}
 console.log('추가 검사: 결번 ID 우선·옛 저장 호환·허락 대상/구단 제한·제작비 예약·동일 선수 제한 통과');
}
console.log(JSON.stringify({mode:baseline?'baseline 01ffefcf':'current',results},null,2));
`)(assert,baseline);
