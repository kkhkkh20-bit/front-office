/* 확정 부상 복귀일은 남은 재활 기간과 관계없이 표시한다. 독립 엔진 + 현재 UI 함수 검사. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),engine=process.argv[2]||path.join(root,'dist/engine.js');
const ui=fs.readFileSync(path.join(root,'src/ui/league/27_calendar.js'),'utf8');
const results=new Function(fs.readFileSync(engine,'utf8')+'\n'+ui.slice(0,ui.indexOf('function calGame('))+'\n'+
  "DEMO.on=false;newGame(6);const p=Object.values(G.players).find(p=>p.team===G.user);p.injK='tj';p.injOut=353;const ret=G.day+353;const a=calEvents(ret).filter(x=>x.t.includes(p.name+' 복귀 예정'));G.day=ret-121;p.injOut=121;const b=calEvents(ret).filter(x=>x.t.includes(p.name+' 복귀 예정'));G.day++;p.injOut--;const c=calEvents(ret).filter(x=>x.t.includes(p.name+' 복귀 예정'));return [a.length,b.length,c.length];")();
assert.deepEqual(results,[1,1,1]);console.log('#447 캘린더 장기재활: 353·121·120일 전 모두 같은 확정 복귀일 표시 통과');
