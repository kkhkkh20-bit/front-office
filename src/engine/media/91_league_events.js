/* 가벼운 라이벌 뉴스와 올스타 선정. 경기 보정·징계·정규시즌 기록에는 손대지 않는다.
   별칭은 사용자 요청의 연고지 대응이다. 새 라이벌의 조건과 선정 가중치는 게임 모형이다. */
const ALL_STAR_DREAM=[1,2,3,7,8];
const allStarSide=tid=>ALL_STAR_DREAM.includes(+tid)?'드림':'나눔';
function rivalPair(a,b){const ids=[+a,+b].sort((x,y)=>x-y);return ids.join(':');}
function rivalAfterGame(day,h,a,g,post){
  if(!g||!g.score||h===a)return;
  const S=G.rivalries=G.rivalries||{pairs:{}},key=rivalPair(h,a);
  const named=key==='6:7'?'달빛대전':['0:6','0:8','6:8'].includes(key)?'엘롯기 맞대결':key==='0:1'?'서울 더비':'';
  const r=S.pairs[key]=S.pairs[key]||{a:Math.min(h,a),b:Math.max(h,a),label:named,games:0,close:0,post:0,seasons:[],wins:{},seen:[]};
  const eid=day+':'+h+':'+a+':'+(post?'p':'r');if(r.seen.includes(eid))return;
  r.seen.push(eid);if(r.seen.length>120)r.seen.shift();r.games++;
  if(!r.seasons.includes(G.year))r.seasons.push(G.year);
  const margin=g.score.h-g.score.a;if(Math.abs(margin)<=2)r.close++;
  if(post)r.post++;
  if(margin){const win=margin>0?h:a;r.wins[win]=(r.wins[win]||0)+1;}
  r.last=day;
  const born=!r.label&&r.seasons.length>=2&&r.games>=12&&r.close>=8&&r.post>=3;
  if(born){r.emerged=day;r.label=team(r.a).city+'·'+team(r.b).city+' 라이벌';}
  if(!r.label||(!born&&r.lastNews!=null&&day-r.lastNews<28))return;
  const title=born?`${r.label}, 맞대결이 쌓여 만든 새 이야기`:`${r.label}… ${tshort(h)} ${g.score.h}:${g.score.a} ${tshort(a)}`;
  const intro=born?`${r.seasons.length}시즌 동안 ${r.games}번 만나 ${r.close}번의 두 점 차 이내 승부와 ${r.post}번의 포스트시즌 맞대결을 남겼습니다. 팬들이 두 팀의 다음 대결을 기다립니다.`:key==='6:7'?'광주와 대구가 만나는 달빛대전입니다.':named==='엘롯기 맞대결'?'서울·부산·광주 구단을 함께 묶어 부르는 팬 문화에서 가져온 맞대결입니다.':'같은 연고지 두 구단의 맞대결입니다.';
  const it=news('경기',title,`${intro}\n이번 경기 ${tname(h)} ${g.score.h}:${g.score.a} ${tname(a)}. 이 게임에서 집계한 맞대결은 ${r.games}경기입니다.`,0,{tid:[h,a].includes(G.user)?G.user:h});
  if(it)r.lastNews=day;
}
function allStarPool(y){
  const L=[];
  for(const p of Object.values(G.players)){
    if(p.team==null||p.prospect||p.joinY>y||p.injOut>0||p.susp>G.day||isAway(p))continue;
    const h=seasonTotal(p,y,'1군');if(!h||(p.isP?(h.outs||0)<30:(h.pa||0)<50))continue;
    const w=warOf(h,p),rate=p.isP?pRate(h):bRate(h);
    const stats=p.isP?w*.8+(h.w||0)*.04+(h.sv||0)*.025+clamp(5-rate.era,-2,3)*.15:w*.8+(h.hr||0)*.035+(h.h||0)*.005+(h.sb||0)*.01;
    const fan=stats+clamp(p.pop||0,0,100)*.005+Math.min(4,(p.aw||[]).length)*.04;
    let slot=h.pos||p.pos;
    if(p.isP)slot=(h.gs||0)>=3?'SP':(h.sv||0)>=(h.hld||0)&&h.sv>0?'CP':'MR';
    else if(['LF','CF','RF'].includes(slot))slot='OF';
    L.push({p,h,w,slot,score:.7*fan+.3*stats});
  }
  return L.sort((a,b)=>b.score-a.score||a.p.id-b.p.id);
}
function allStarSnapshot(x,starter,reason){return {id:x.p.id,name:x.p.name,t:x.p.team,slot:x.slot,isP:!!x.p.isP,starter,reason,line:statLine(x.h,x.p),w:+x.w.toFixed(1)};}
function allStarSelect(){
  const y=G.year;G.allStars=G.allStars||{};if(G.allStars[y])return G.allStars[y];
  const pool=allStarPool(y),A={y,day:G.day,event:G.cal.asg,teams:{},withdrawn:[],played:false};
  for(const side of ['나눔','드림']){
    const P=pool.filter(x=>allStarSide(x.p.team)===side),L=[],used=new Set();
    const add=(x,starter,reason)=>{if(!x||used.has(x.p.id))return;used.add(x.p.id);L.push(allStarSnapshot(x,starter,reason));};
    for(const slot of ['SP','MR','CP','C','1B','2B','3B','SS','OF','OF','OF','DH']){
      const x=P.find(x=>!used.has(x.p.id)&&x.slot===slot)||(['SP','MR','CP'].includes(slot)?P.find(x=>x.p.isP&&!used.has(x.p.id)):slot==='DH'?P.find(x=>!x.p.isP&&!used.has(x.p.id)):null);
      add(x,true,'팬·선수 평가를 합친 베스트12');
    }
    for(const t of G.teams.filter(t=>allStarSide(t.id)===side))if(!L.some(x=>x.t===t.id))add(P.find(x=>x.p.team===t.id&&!used.has(x.p.id)),false,'구단 대표 추천');
    for(const x of P){if(L.length>=26)break;add(x,false,'전반기 기록을 바탕으로 추천');}
    A.teams[side]=L;
  }
  G.allStars[y]=A;
  for(const side of ['나눔','드림'])for(const x of A.teams[side]){
    const p=G.players[x.id],label=`${y} 올스타(${side})`;if(!(p.aw||[]).includes(label))addAward(p,label);
  }
  const mine=Object.values(A.teams).flat().filter(x=>x.t===G.user);
  news('선수',`${y} 나눔·드림 올스타 선정 발표`,`${dmd(A.event-2)}~${dmd(A.event+1)}은 올스타 휴식기입니다. ${mine.length?`${tshort(G.user)}에서는 ${mine.map(x=>x.name+(x.starter?'(베스트12)':'(추천)')).join(', ')} 선수가 뽑혔습니다.`:'우리 구단의 선정 선수는 없습니다.'} 팬·선수 평가와 추천으로 구성한 게임 내 명단이며, 해당 시즌 1군 기록을 기준으로 합니다.`,0,{tid:G.user});
  mail('홍보팀',`${y} 올스타 명단 발표`,`${dmd(A.event)} 나눔·드림 올스타 행사.\n우리 구단: ${mine.map(x=>x.name).join(', ')||'선정 선수 없음'}\n올스타 휴식기 ${dmd(A.event-2)}~${dmd(A.event+1)}에는 정규시즌 경기가 없습니다.`,{kind:'기록',acts:[{l:'올스타 명단',a:'leagueEvents'}]});
  return A;
}
function allStarDaily(){
  if(!G.cal||!G.sea||G.sea.y!==G.year||G.day<G.cal.asg-14||G.day>G.cal.asg+1)return;
  const A=allStarSelect();
  if(G.day>=G.cal.asg-1){
    const pool=allStarPool(G.year);
    for(const side of ['나눔','드림'])for(let i=0;i<A.teams[side].length;i++){
      const old=A.teams[side][i],p=G.players[old.id];
      if(p&&p.team!=null&&allStarSide(p.team)===side&&!(p.injOut>0)&&!(p.susp>G.day)&&!isAway(p))continue;
      const used=new Set(Object.values(A.teams).flat().map(x=>x.id));
      const x=pool.find(x=>allStarSide(x.p.team)===side&&!used.has(x.p.id)&&x.slot===old.slot)||pool.find(x=>allStarSide(x.p.team)===side&&!used.has(x.p.id)&&!!x.p.isP===old.isP);
      if(!x)continue;
      const next=allStarSnapshot(x,old.starter,'출전 불가 선수의 대체 추천');A.withdrawn.push({...old,replacement:next.id,day:G.day});A.teams[side][i]=next;
      const label=`${G.year} 올스타(${side})`;if(!(x.p.aw||[]).includes(label))addAward(x.p,label);
      news('선수',`${side} 올스타 ${next.name}, ${old.name} 대신 선정`,`${old.name}의 출전이 어려워 ${tshort(next.t)} ${next.name}을 대체 선수로 선정했습니다.`,0,{tid:next.t,ref:next.id});
    }
  }
  if(G.day>=G.cal.asg&&!A.played){const resume=Object.keys(G.cal.sched).map(Number).filter(d=>d>G.cal.asg+1).sort((a,b)=>a-b)[0];A.played=true;note('일정',`${G.year} 나눔·드림 올스타 행사가 열렸습니다.${resume?' '+dmd(resume)+'부터 정규시즌 일정이 재개됩니다.':''}`);}
}
