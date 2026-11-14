/* 기자 성향별 가상 투표 모형. 공식 배점이나 실제 기자의 국적 선호를 뜻하지 않는다.
   국내 선수의 작은 가산과 이정표 비중은 사용자 요청. 실제 기사 대조는 별도 검증 대상이다. */
function ggCandidate(x,pos){
  const {p,h}=x,rate=p.isP?pRate(h):bRate(h);
  const record=p.isP?(h.w||0)*.045+(h.sv||0)*.025+(h.hld||0)*.008+(h.so||0)*.002+clamp(5-rate.era,-2,4)*.25:(h.hr||0)*.055+(h.rbi||0)*.008+(h.h||0)*.004+(h.sb||0)*.008+clamp(rate.avg-.25,-.1,.15)*10;
  const milestones=[];let milestone=0;
  const mark=(yes,n,v)=>{if(yes){milestones.push(n);milestone+=v;}};
  if(p.isP){mark((h.w||0)>=20,'20승',1.6);mark((h.so||0)>=200,'200탈삼진',.5);mark((h.sv||0)>=40,'40세이브',.8);}
  else{mark((h.h||0)>=200,'200안타',1.5);mark((h.hr||0)>=40,'40홈런',.8);mark((h.hr||0)>=30&&(h.sb||0)>=30,'30홈런·30도루',1.1);}
  const tt=awTeamOf(p,h); /* 성적을 낸 구단: MVP 후보(awCand)와 같은 기준(검수 11-08) */ let rank=5;try{rank=G.ps.order.findIndex(t=>t.tid===tt);}catch(e){}
  const merit={war:x.w,record,milestone,domestic:p.foreign?0:.25,team:rank>=0&&rank<3?.2:0};
  return {id:p.id,name:p.name,t:awClub(p,h),line:statLine(h,p),w:+x.w.toFixed(1),s:x.w*.65+record+milestone+merit.domestic+merit.team,merit,milestones,pos,v:0};
}
function ggReporterVote(cands,voters,seats,y){
  cands.forEach(c=>c.v=0);const ballots=[];
  for(let i=0;i<voters;i++){
    const key='ggReporter'+y+':'+i,warW=.45+u01(key,'war')*.5,recordW=.65+u01(key,'record')*.7,mileW=.7+u01(key,'mile')*.7;
    const scored=cands.map(c=>{const m=c.merit||{war:c.s,record:0,milestone:0,domestic:0,team:0};const u=clamp(u01(key,c.id),.00001,.99999),noise=-Math.log(-Math.log(u))*.85;return {c,s:m.war*warW+m.record*recordW+m.milestone*mileW+m.domestic*(.5+u01(key,'local'))+m.team+noise};});
    scored.sort((a,b)=>b.s-a.s||a.c.id-b.c.id);const picks=scored.slice(0,Math.min(seats,cands.length)).map(x=>x.c.id);
    for(const x of scored.slice(0,picks.length))x.c.v++;ballots.push(picks);
  }
  cands.sort((a,b)=>b.v-a.v||b.s-a.s||a.id-b.id);return ballots;
}
/* 전망 기사에는 비공개 득표를 사용하지 않는다. */
function ggPublicRace(A){
  return Object.entries(A.cand.gg||{}).map(([pos,C])=>({pos,candidates:[...C].sort((a,b)=>(b.s+u01('ggPreview'+A.y,b.id)*.6)-(a.s+u01('ggPreview'+A.y,a.id)*.6)||a.id-b.id).slice(0,pos==='OF'?5:2).map(c=>({id:c.id,name:c.name,t:c.t,line:c.line,milestones:c.milestones||[]}))}));
}
function ggVotingDaily(){
  const A=G.awards&&G.awards[G.year];if(!A||!A.ggVote||!A.pend||!A.pend.gg)return;
  const V=A.ggVote;if(G.day<V.start||G.day>dnum(A.y,12,9))return;
  V.received=Math.min(V.voters,Math.max(0,Math.floor(V.voters*(G.day-V.start+1)/(V.end-V.start+1))));
  const stage=G.day>=V.end?'closed':G.day>=V.start+5?'mid':'start';V.news=V.news||{};if(V.news[stage])return;
  V.news[stage]=G.day;const race=ggPublicRace(A);
  const text=race.map(x=>`${x.pos==='P'?'투수':x.pos==='OF'?'외야수':POSS[x.pos]||x.pos}: ${x.candidates.map(c=>`${c.name}(${tshort(c.t)})${c.milestones.length?' · '+c.milestones.join('·'):''}`).join(', ')}`).join('\n');
  const title=stage==='closed'?`${A.y} 골든글러브 기자단 투표 마감`:stage==='mid'?`${A.y} 골든글러브 기자단 투표 진행 중… 유력 후보는`: `${A.y} 골든글러브 기자단 투표 시작`;
  news('분석',title,`기자 ${V.voters}명이 포지션별로 투표합니다. 외야수는 기자 한 명이 서로 다른 세 명을 고릅니다. 수상자는 ${dmd(dnum(A.y,12,9))}에 발표합니다.\n\n유력 후보 전망\n${text}\n\nWAR와 주요 타격·투구 기록, 200안타·20승 같은 이정표, 팀 성적을 함께 본 전망입니다. 실제 득표와 다를 수 있습니다.`,0,{tid:G.user});
}
