/* Presentation incidents are saved with the game. They never consume the simulation RNG
 * or change outs, runs, fatigue, suspensions or injuries. Only actual inside balls qualify. */
function gameIncidents(day,home,away,g){
 const random=seededRand(`bench:${day}:${home}:${away}`);if(random()>=.012)return [];
 const eligible=[];for(let k=0;k<g.pbp.length;k++){const row=g.pbp[k];if(typeof row[1]!=='number')continue;const b=G.players[row[1]],p=G.players[row[2]],seq=storedPitchSequence(row);if(!b||!seq)continue;const left=b.bt==='좌'||b.bt==='양'&&p?.th!=='좌';for(let i=0;i<seq.length;i++){const q=seq[i];if(q.res==='볼'&&(left?q.x>1.12:q.x<-.12))eligible.push({k,pitch:i});}}
 if(!eligible.length)return [];const chosen=eligible[Math.floor(random()*eligible.length)],occupied=new Set([...(g.S.h.start||[]),...(g.S.a.start||[])].map(p=>p.id).concat(g.S.h.pitchers||[],g.S.a.pitchers||[]));
 const participants=[home,away].flatMap(tid=>actOf(tid).filter(p=>!occupied.has(p.id)&&healthy(p)&&!isAway(p)).slice(0,3).map(p=>({id:p.id,name:p.name,team:tid,th:p.th})));
 return [{kind:'bench',...chosen,reason:'몸쪽 공 이후 언쟁',participants}];
}
