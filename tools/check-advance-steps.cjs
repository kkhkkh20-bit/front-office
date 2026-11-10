/* 분할 UI와 기존 동기 엔진의 날짜·경기·선수 상태가 같은지 비교한다. */
const assert=require('node:assert/strict'),path=require('node:path');const {build}=require('./build.cjs');const engine=build({root:path.resolve(__dirname,'..'),write:false}).engine;
const run=new Function('mode','kind',engine+`
DEMO.on=false;newGame(6);fdStart();fdAdvance(false);let n=0;while(G.fd&&!G.fd.done&&n++<500)fdAdvance(true);hireMgr(G.mmarket[0].id,3);G.day=KD(3,1);G.evs=[];G.stops=[];G.res=null;const original=processDay;processDay=function(){original();G.stops=[];G.offers=[];for(const e of G.evs||[])e.done=true;};const start=G.day;if(kind==='sync')advance(mode);else{const it=advanceSteps(mode);let r;do{r=it.next();if(kind==='cancel'){it.return();break;}}while(!r.done);}
return {start,day:G.day,last:G.lastAdv,sea:G.sea,dig:G.dig,games:G.games,players:Object.values(G.players).map(p=>({id:p.id,team:p.team,hist:p.hist,injOut:p.injOut,fat:p.fat})),mail:G.mail.map(m=>({day:m.day,subj:m.subj,body:m.body}))};
`);
const save=Math.random;function seeded(){let a=31;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
try{for(const mode of ['day','week','event','month']){Math.random=seeded();const a=run(mode,'sync');Math.random=seeded();const b=run(mode,'steps');assert.deepEqual(b,a,mode+' 동기/분할 엔진 결과');console.log(mode+' 동기·분할 결과 일치');}Math.random=seeded();const p=run('week','cancel');assert.equal(p.day,p.start+1);assert.equal(p.last.days,1);assert.equal(p.last.to,p.day);console.log('분할 진행 중단 시 실제 하루만 반영·진행 통계 정산');}finally{Math.random=save;}
