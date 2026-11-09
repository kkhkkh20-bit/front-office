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
  const eid=g.rvId=g.rvId||day+':'+h+':'+a+':'+(post?'p':'r')+':'+(G.rvSeq=(G.rvSeq||0)+1);if(r.seen.includes(eid))return; /* 경기마다 번호: 같은 날 두 경기(더블헤더)도 따로 센다(검수 11-09zq) */
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
  const intro=born?`${r.seasons.length}시즌 동안 ${r.games}번 만나 ${r.close}번의 두 점 차 이내 승부와 ${r.post}번의 포스트시즌 맞대결을 남겼습니다. 팬들이 두 팀의 다음 대결을 기다립니다.`:key==='6:7'?'광주와 대구가 만나는 달빛대전입니다.':named==='엘롯기 맞대결'?'서울·부산·광주 구단을 함께 묶어 부르는 팬 문화에서 가져온 맞대결입니다.':team(r.a).city===team(r.b).city?'같은 연고지 두 구단의 맞대결입니다.':`${team(r.a).city}·${team(r.b).city} 두 구단이 이어 온 맞대결입니다.`; /* 연고지가 다르면 '같은 연고지'라고 하지 않는다(검수 11-06) */
  const it=news('경기',title,`${intro}\n이번 경기 ${tname(h)} ${g.score.h}:${g.score.a} ${tname(a)}. 이 게임에서 집계한 맞대결은 ${r.games}경기입니다.`,0,{tid:[h,a].includes(G.user)?G.user:h});
  if(it)r.lastNews=day;
}
function allStarPool(y){
  const L=[];
  for(const p of Object.values(G.players)){
    if(p.team==null||p.prospect||p.ys||p.joinY>y||p.injOut>0||p.susp>G.day||isAway(p)||p.frehab)continue; /* 재활 명단(부상 대체 복귀 대기)도 출전 불가(검수 11-08) */ /* 육성선수는 1군 등록이 안 돼 올스타에 못 나간다(검수 11-09u) */
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
function allStarSnapshot(x,starter,reason,slot,d){return {id:x.p.id,name:x.p.name,t:x.p.team,t0:x.p.team,pos:x.h.pos||x.p.pos,slot:slot||x.slot,isP:!!x.p.isP,starter,reason,line:statLine(x.h,x.p),w:+x.w.toFixed(1),...(d!=null?{d}:{})};} /* d: 대체 선수 기록 기준일(검수 11-09zq) */
function allStarSelect(){
  const y=G.year;G.allStars=G.allStars||{};if(G.allStars[y])return G.allStars[y];
  const pool=allStarPool(y),A={y,day:G.day,event:G.cal.asg,teams:{},withdrawn:[],played:false};
  for(const side of ['나눔','드림']){
    const P=pool.filter(x=>allStarSide(x.p.team)===side),L=[],used=new Set();
    const add=(x,starter,reason,slot)=>{if(!x||used.has(x.p.id))return;used.add(x.p.id);L.push(allStarSnapshot(x,starter,reason,slot));};
    const SL=['SP','MR','CP','C','1B','2B','3B','SS','OF','OF','OF','DH'];
    SL.forEach((slot,i)=>{ const later=SL.slice(i+1), fp=P.filter(x=>x.p.isP&&!used.has(x.p.id));
      const x=P.find(x=>!used.has(x.p.id)&&x.slot===slot)||(['SP','MR','CP'].includes(slot)?fp.find(x=>!later.includes(x.slot))||fp[0]:slot==='DH'?P.find(x=>!x.p.isP&&!used.has(x.p.id)):null); /* 빈 투수 자리는 뒤 자리(마무리 등)에 쓸 후보를 남기고 채운다(검수 11-09zq) */
      add(x,true,'팬·선수 평가를 합친 베스트12',x&&x.slot!==slot?slot:null); /* 다른 자리로 채우면 맡은 역할로 기록(지명타자 검수 11-08, 투수 검수 11-09zq) */
    });
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
  mail('홍보팀',`${y} 올스타 명단 발표`,`${dmd(A.event)} 나눔·드림 올스타 행사.\n우리 구단: ${mine.map(x=>x.name).join(', ')||'선정 선수 없음'}\n올스타 휴식기 ${dmd(A.event-2)}~${dmd(A.event+1)}에는 정규시즌 경기가 없습니다.`,{kind:'기록',acts:[{l:'올스타 명단',a:'leagueEvents',v:y}]});
  return A;
}
function allStarDaily(){
  if(!G.cal||!G.sea||G.sea.y!==G.year||G.day<G.cal.asg-14||G.day>G.cal.asg+1)return;
  const A=allStarSelect();
  if(!A.played)for(const side of ['나눔','드림'])for(const x of A.teams[side]){ const p=G.players[x.id]; if(p&&p.team!=null&&allStarSide(p.team)===side&&x.t!==p.team)x.t=p.team; } /* 같은 진영 안 이적: 다음 날부터 지금 구단으로(검수 11-06, 11-09zq) */
  if(G.day>=G.cal.asg-1&&!A.played){ /* 행사가 끝나면 명단·수상 이력은 확정 */
    const pool=allStarPool(G.year), left=Math.max(0,G.cal.asg-G.day), ev=Math.max(G.day,G.cal.asg); /* 자격은 행사 당일 기준: 그날 돌아오는 선수는 출전(검수 11-09zq) */
    for(const side of ['나눔','드림'])for(let i=0;i<A.teams[side].length;i++){
      const old=A.teams[side][i],p=G.players[old.id];
      if(p&&p.team!=null&&!p.ys&&allStarSide(p.team)===side&&!(p.injOut>left)&&!(p.susp>ev)&&!isAway(p)&&!p.frehab)continue;
      const used=new Set([...Object.values(A.teams).flat(),...A.withdrawn].map(x=>x.id)); /* 한 해 올스타 선정은 한 번: 앞서 빠진 선수는 다른 진영 대체로도 뽑지 않는다(검수 11-09zq) */
      const F=f=>pool.find(x=>allStarSide(x.p.team)===side&&!used.has(x.p.id)&&f(x)), needRep=allStarSide(old.t)===side&&!A.teams[side].some((y,j)=>j!==i&&y.t===old.t);
      const x=(needRep&&(F(x=>x.p.team===old.t&&x.slot===old.slot)||F(x=>x.p.team===old.t&&!!x.p.isP===old.isP)||F(x=>x.p.team===old.t)))||F(x=>x.slot===old.slot)||F(x=>!!x.p.isP===old.isP); /* 구단 대표가 0명이 되면 같은 구단 후보 먼저(검수 11-09zq) */
      if(!x){ A.withdrawn.push({...old,replacement:null,day:G.day}); A.teams[side].splice(i,1); i--; continue; } /* 대체 후보가 없어도 출전 불가 선수는 확정 명단에서 뺀다(검수 11-06) */
      const next=allStarSnapshot(x,old.starter,'출전 불가 선수의 대체 추천',old.slot,G.day);A.withdrawn.push({...old,replacement:next.id,day:G.day});A.teams[side][i]=next;
      const label=`${G.year} 올스타(${side})`;if(!(x.p.aw||[]).includes(label))addAward(x.p,label);
      news('선수',`${side} 올스타 ${next.name}, ${old.name} 대신 선정`,`${old.name}의 출전이 어려워 ${tshort(next.t)} ${next.name}을 대체 선수로 선정했습니다.`,0,{tid:next.t,ref:next.id});
    }
  }
  if(G.day>=G.cal.asg&&!A.played){const resume=Object.keys(G.cal.sched).map(Number).filter(d=>d>G.cal.asg+1).sort((a,b)=>a-b)[0];A.played=true;note('일정',`${G.year} 나눔·드림 올스타 행사가 열렸습니다.${resume?' '+dmd(resume)+'부터 정규시즌 일정이 재개됩니다.':''}`);}
}
/* ===== 우승·가을야구 순간 기사 =====
   횟수·연도는 G.history(이 리그에서 치른 시즌, 올해는 아직 들어가기 전)에서만 센다. 우리 구단 우승 기사는 champCelebrate가 쓴다. */
function titleYears(tid,k){ return (G.history||[]).filter(h=>k==='first'?h.order&&h.order[0]&&h.order[0].tid===tid:k==='ps'?h.order&&h.order.slice(0,5).some(o=>o.tid===tid):h[k]===tid).map(h=>h.y); }
function titleRun(ys,y){ let n=1; for(let k=y-1;ys.includes(k);k--)n++; return n; } /* 올해를 포함한 연속 횟수 */
function titleSince(){ return (G.history||[]).length?G.history[0].y:G.year; }
function titleDrought(tid){ const ys=titleYears(tid,'champ'), last=ys.length?ys[ys.length-1]:null; return last==null?`${titleSince()}년 기록 이후 아직 우승이 없습니다`:`마지막 우승은 ${last}년, ${G.year-last}시즌째 무관입니다`; }
/* 정규시즌 순위가 확정돼 와일드카드 결정전 일정이 잡힐 때: 정규시즌 1위, 우리 구단 가을야구 진출·탈락 */
function psSeedNews(){ const P=G.ps; if(!P||P.seedNews)return; P.seedNews=1; const y=G.year, top=P.order[0], first=top.tid;
  const fy=titleYears(first,'first'), run=titleRun(fy,y);
  news('경기',`${tshort(first)}, ${y} 정규시즌 1위 확정`,`${tname(first)}이(가) ${top.w}승 ${top.l}패${top.t?` ${top.t}무`:''}로 정규시즌 1위를 차지해 한국시리즈에 직행합니다. ${run>=2?`${run}년 연속 정규시즌 1위입니다.`:fy.length?`이 리그 기록으로 ${fy.length+1}번째 정규시즌 1위(직전 ${fy[fy.length-1]}년)입니다.`:`${titleSince()}년 기록 이후 첫 정규시즌 1위입니다.`}`,first===G.user&&!G.unemp?3:0,{tid:first});
  if(G.unemp)return; const rk=P.order.findIndex(o=>o.tid===G.user)+1, me=P.order[rk-1], nm=tshort(G.user); if(!rk||first===G.user)return;
  const py=titleYears(G.user,'ps'), pr=titleRun(py,y), lastPs=py.length?py[py.length-1]:null;
  if(rk<=5)news('경기',`${nm}, 정규시즌 ${rk}위로 가을야구 진출 확정`,`${tname(G.user)}이(가) ${me.w}승 ${me.l}패로 ${rk}위에 올라 ${rk===2?'플레이오프':rk===3?'준플레이오프':'와일드카드 결정전'}부터 포스트시즌을 치릅니다. ${pr>=2?`${pr}년 연속 가을야구입니다.`:lastPs!=null?`${y-lastPs}년 만의 가을야구입니다.`:`${titleSince()}년 기록 이후 첫 가을야구입니다.`}`,2,{fanW:2});
  else { const o5=P.order[4], gb=((o5.w-me.w)-(o5.l-me.l))/2; news('경기',`${nm}, ${rk}위로 시즌 마감… 가을야구 탈락 확정`,`${tname(G.user)}이(가) ${me.w}승 ${me.l}패로 5위 ${tshort(o5.tid)}에 ${gb}경기 뒤져 포스트시즌에 나가지 못합니다. ${lastPs!=null?`마지막 가을야구는 ${lastPs}년입니다.`:`${titleSince()}년 기록 이후 아직 가을야구가 없습니다.`}`,-2); } }
/* 우리 구단이 한국시리즈 전 라운드에서 떨어질 때 */
function psOutNews(round,res){ if(G.unemp||!res||res[1]!==G.user||round==='ks'||round==='tb')return; const nm=tshort(G.user);
  news('경기',`${nm}, ${ROUNDK[round]}에서 탈락… 가을야구 마감`,`${tname(G.user)}이(가) ${tname(res[0])}에 시리즈 ${res[3]}승 ${res[2]}패로 밀려 시즌을 마쳤습니다. ${titleDrought(G.user)}.`,-1); }
/* 한국시리즈가 끝났을 때: 다른 구단 우승, 우리 구단 준우승, 라이벌 구단 우승 */
function titleNews(ch,ru){ const y=G.year, ks=G.ps&&G.ps.res&&G.ps.res.ks; if(!ks)return; const prev=titleYears(ch,'champ'), n=prev.length+1, last=prev.length?prev[prev.length-1]:null, run=titleRun(prev,y);
  const tag=run>=2?`${run}년 연속 우승`:last==null?`${titleSince()}년 기록 이후 첫 우승`:y-last>=10?`${y-last}년 만의 우승`:`통산 ${n}번째 우승`;
  if(ch!==G.user||G.unemp)news('경기',`${tname(ch)}, ${y} 한국시리즈 우승… ${tag}`,`${tname(ch)}이(가) ${tname(ru)}을(를) ${ks[2]}승 ${ks[3]}패로 꺾었습니다. 이 리그 기록으로 통산 ${n}번째 우승${last!=null?`이며 직전 우승은 ${last}년`:''}입니다.`,0,{tid:ch});
  if(G.unemp||ch===G.user)return; const nm=tshort(G.user);
  if(ru===G.user){ const rn=titleYears(G.user,'runner').length+1; news('경기',`${nm}, 한국시리즈 준우승… 정상 문턱에서 멈췄다`,`${tname(G.user)}이(가) ${tname(ch)}에 ${ks[3]}승 ${ks[2]}패로 졌습니다. 이 리그 기록으로 ${rn}번째 준우승입니다. ${titleDrought(G.user)}.`,-1); return; }
  const r=((G.rivalries||{}).pairs||{})[rivalPair(ch,G.user)];
  if(r&&r.label)news('분석',`라이벌 ${tshort(ch)} 정상에… 지켜본 ${nm} 속앓이`,`${r.label}의 상대 ${tname(ch)}이(가) ${tag}을 차지했습니다. ${tname(G.user)}은(는) 올해 정상에 오르지 못했습니다. ${titleDrought(G.user)}. 이 게임에서 두 팀은 ${r.games}번 맞붙었습니다.`,0,{tid:G.user}); }
