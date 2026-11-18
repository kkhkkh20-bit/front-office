/* ===== 올스타: 팬 투표 중간 발표 · 올스타전(시범 경기) · 홈런 더비 · 시상·올스타 역대 =====
   - 팬 투표 중간 발표(행사 28일·21일 전): 선정과 같은 점수(allStarPool: 기록 + 인기 + 수상)로 정한 득표. 난수 없음.
   - 올스타전: 본게임 엔진(simGame)으로 한 경기. 따로 씨앗을 둔 난수(withRng)라 주 난수 순서가 그대로이고,
     applyGame을 부르지 않아 시즌 기록·피로·부상·투구 부하에 남지 않는다(경기 컨디션 gc도 되돌린다).
   - 경기 MVP는 포스트시즌 경기 MVP와 같은 박스 점수(psGameMvpBox), 이긴 진영에서.
   - 홈런 더비: 홈런 상위 4명, 따로 씨앗을 둔 난수로 예선(아웃 7개)·결승(아웃 7개). */
const ASG_SIDES=['나눔','드림'];
function asgSeed(y,k){ return rngHash('asg',y,k)|0; }
/* 팬 투표 중간 발표: 진영·자리별 1위와 득표 */
function asgVoteBoard(y,frac){ const pool=allStarPool(y), out={}; for(const side of ASG_SIDES){ const P=pool.filter(x=>allStarSide(x.p.team)===side), used=new Set(), L=[];
    for(const slot of ASPOS){ const x=P.find(x=>!used.has(x.p.id)&&(slot==='DH'?!x.p.isP:x.slot===slot)); if(!x)continue; used.add(x.p.id); L.push({slot,id:x.p.id,name:x.p.name,t:x.p.team,v:Math.round(Math.max(.2,x.score)*90000*frac+clamp(x.p.pop||0,0,100)*700*frac)}); }
    out[side]=L; } return out; }
function asgVoteNews(n){ const y=G.year, V=(G.asVote=G.asVote||{}); const yv=V[y]=V[y]||{}; if(yv[n])return null; const frac=n===1?.45:.78, B=asgVoteBoard(y,frac); yv[n]={d:G.day,top:Object.fromEntries(ASG_SIDES.map(s=>[s,(B[s]||[]).map(x=>[x.slot,x.id,x.v,x.name,x.t])]))};
  for(const k of Object.keys(V))if(+k<y-30)delete V[k];
  const lab=s=>({SP:'선발',MR:'중간',CP:'마무리',OF:'외야'})[s]||POSS[s]||s;
  const txt=ASG_SIDES.map(s=>`[${s}] ${(B[s]||[]).map(x=>`${lab(x.slot)} ${x.name}(${tshort(x.t)}) ${x.v.toLocaleString()}표`).join(', ')}`).join('\n');
  const top=Object.values(B).flat().sort((a,b)=>b.v-a.v||a.id-b.id)[0], mine=Object.values(B).flat().filter(x=>x.t===G.user&&!G.unemp);
  withRng(asgSeed(y,'vote'+n),()=>news('선수',`${y} 올스타 팬 투표 ${n}차 중간 발표${top?`: ${top.name} 최다 득표`:''}`,`${txt}\n\n자리별 1위만 적었습니다. 팬 투표는 전반기 기록과 선수 인기를 함께 반영합니다. 명단은 ${dmd(G.cal.asg-14)}에 발표합니다.${mine.length?`\n우리 구단 1위: ${mine.map(x=>x.name).join(', ')}`:''}`,mine.length?1:0,{act:{l:'올스타 화면',a:'leagueEvents',v:String(y)}}));
  return yv[n]; }
function asgVoteDaily(){ if(!G.cal||!G.cal.asg||!G.sea||G.sea.y!==G.year)return; const d=G.cal.asg-G.day; if(d===28)asgVoteNews(1); else if(d===21)asgVoteNews(2); }
/* 올스타전 한 진영: 명단의 실제 선수(행사 당일 출전 가능)로 라인업·선발·불펜 */
function asgCanPlay(p,side,d=G.day,y=G.year){ return !!(p&&p.team!=null&&!p.ys&&!p.prospect&&!(p.joinY>y)&&(!side||allStarSide(p.team)===side)&&healthyAt(p,d)&&!isAway(p)); }
function asgSide(A,side,d){ const rows=(A.teams[side]||[]).filter(x=>asgCanPlay(G.players[x.id],side,d,A.y)), L=rows.map(x=>G.players[x.id]);
  const B=L.filter(p=>!p.isP), P=L.filter(p=>p.isP); if(B.length<9||P.length<3)return null;
  const ln={},used=new Set(),star=rows.filter(x=>x.starter&&!x.isP),place=(k,x)=>{if(x&&!used.has(x.id)){ln[k]=G.players[x.id];used.add(x.id);}};
  for(const k of ['C','1B','2B','3B','SS','DH'])place(k,star.find(x=>x.slot===k));
  const of=star.filter(x=>x.slot==='OF'); for(const x of of){const pos=x.pos||G.players[x.id].pos;if(['LF','CF','RF'].includes(pos)&&!ln[pos])place(pos,x);}
  for(const x of of)if(!used.has(x.id)){const k=['LF','CF','RF'].find(k=>!ln[k]);if(k)place(k,x);}
  /* 남은 건강한 베스트 타자도 추천 선수보다 먼저 빈자리에 넣는다. */
  for(const x of star)if(!used.has(x.id)){const k=FGPOS.find(k=>!ln[k]);if(k)place(k,x);}
  for(const k of FGPOS)if(!ln[k]){const free=B.filter(p=>!used.has(p.id));const same=free.filter(p=>k==='DH'||k===p.pos||k!=='C'&&subsOf(p).includes(k)),q=(same.length?same:free).sort((a,b)=>posScore(b,k)-posScore(a,k)||a.id-b.id)[0];if(!q)return null;ln[k]=q;used.add(q.id);}
  const posOf={}; for(const k in ln)posOf[ln[k].id]=k; const start=Object.values(ln), order=orderList(ORDER.filter(k=>ln[k]).map(k=>ln[k]),null);
  const row=new Map(rows.map(x=>[x.id,x])),sp=[...P].sort((a,b)=>{const x=row.get(a.id),y=row.get(b.id),rank=z=>z.slot==='SP'?(z.starter?0:1):z.starter?2:3;return rank(x)-rank(y)||spV(b)-spV(a)||a.id-b.id;})[0],pen=P.filter(p=>p!==sp).sort((a,b)=>penV(b)-penV(a)||a.id-b.id);
  const s={tid:'asg:'+side,rot:null,order,posOf,bench:B.filter(p=>!start.includes(p)),out:[],defv:teamDefV(ln),spAll:[sp],short:false,pen,used:new Set([sp.id]),cur:sp,sp,curIsSP:true,idx:0,box:new Map(),pitchers:[sp.id],entry:{},exit:{},farm:true,pitchPool:new Set(P.map(p=>p.id))};
  s.start=order.map((p,o)=>({id:p.id,n:p.name,o,pos:posOf[p.id]})); s.changes=[]; s.box.set(sp.id,pz()); order.forEach(p=>s.box.set(p.id,bz())); sideTraits(s); return s; }
/* 올스타전: 홈은 나눔(해마다 같은 규칙), 무승부 가능. 결과·박스·MVP를 A.game에 */
function asgPlayGame(A){ if(!A||A.game)return A&&A.game; const y=A.y, d=Math.max(A.event??G.day,G.day); if(y!==G.year)return null; const keep=new Map(); let g=null;
  try{ withRng(asgSeed(y,'game'),()=>{ const sh=asgSide(A,'나눔',d), sa=asgSide(A,'드림',d); if(!sh||!sa)return; for(const s0 of [sh,sa])for(const q of [...s0.order,...s0.bench,...s0.pen,s0.sp])if(q&&!keep.has(q.id))keep.set(q.id,[q.gc,q.gcD,q.fat]);
      g=simGame(d,null,null,false,{sides:{h:sh,a:sa},pitchRecords:false}); }); }
  catch(e){ (G.flErr=(G.flErr||[]).slice(-9)).push('asg:'+String(e&&e.message).slice(0,80)); g=null; }
  finally{ for(const [id,v] of keep){ const q=G.players[id]; if(!q)continue; if(v[0]===undefined)delete q.gc; else q.gc=v[0]; if(v[1]===undefined)delete q.gcD; else q.gcD=v[1]; q.fat=v[2]; } } /* 시즌 기록·컨디션·피로에 남기지 않는다 */
  if(!g)return null;
  const box=psBoxOf(g); box.h.side='나눔'; box.a.side='드림'; for(const k of ['h','a']){ for(const r of box[k].bat)r.t=(G.players[r.id]||{}).team; for(const r of box[k].pit)r.t=(G.players[r.id]||{}).team; }
  const win=g.score.h>g.score.a?'h':g.score.a>g.score.h?'a':null, m=psGameMvpBox(box,win), who=m&&G.players[m.id];
  A.game={day:d,hs:g.score.h,as:g.score.a,inn:g.inn,line:g.line,win:win?(win==='h'?'나눔':'드림'):null,mvp:m?{id:m.id,n:m.n,t:who?who.team:null,line:m.line,side:m.t==='asg:나눔'?'나눔':'드림'}:null,box};
  for(const k of Object.keys(G.allStars||{}))if(+k!==y&&G.allStars[k].game)delete G.allStars[k].game.box; /* 박스스코어는 올해 것만 보관 */
  return A.game; }
/* 홈런 더비: 진영 상관없이 명단 타자 가운데 시즌 홈런 상위 4명(같으면 장타력·번호). 예선 상위 2명이 결승 */
function asgDerby(A){ if(!A||A.hrd)return A&&A.hrd; const y=A.y, ids=Object.values(A.teams).flat().filter(x=>!x.isP).map(x=>G.players[x.id]).filter(p=>asgCanPlay(p,null,G.day,y));
  const hr=p=>{ const h=seasonTotal(p,y,'1군'); return h?h.hr||0:0; }; const L=ids.sort((a,b)=>hr(b)-hr(a)||((b.r&&b.r.pow)||0)-((a.r&&a.r.pow)||0)||a.id-b.id).slice(0,4); if(L.length<2)return null;
  const round=(p,k)=>withRng(asgSeed(y,'hrd'+k+':'+p.id),()=>{ const pr=clamp(.12+(((p.r&&p.r.pow)||50)-50)/100*.5+hr(p)*.004,.08,.55); let n=0,o=0; while(o<7){ if(R()<pr)n++; else o++; } return n; });
  const r1=L.map(p=>({id:p.id,n:p.name,t:p.team,hr:hr(p),r1:round(p,1)})), fin=[...r1].sort((a,b)=>b.r1-a.r1||b.hr-a.hr||a.id-b.id).slice(0,2);
  for(const f of fin)f.r2=round(G.players[f.id],2); const w=[...fin].sort((a,b)=>b.r2-a.r2||b.r1-a.r1||a.id-b.id)[0];
  A.hrd={L:r1.map(x=>[x.id,x.n,x.t,x.r1,x.r2??null]),w:w.id}; return A.hrd; }
/* 행사 당일(allStarDaily): 홈런 더비 → 올스타전 → 기사 */
function asgKnownEvent(A){return !!(A&&(A.evAttempt!=null||A.evDone||A.hrd||A.game||A.eventNews));}
function asgRetryDue(A){if(!A||A.y!==G.year||G.day<(A.event??G.cal.asg)||A.evDone&&A.game&&A.hrd)return false;return G.day<=(A.event??G.cal.asg)+1||asgKnownEvent(A);}
function asgEventStatus(A){if(!A)return '';if(A.game&&A.hrd&&(A.evDone||A.played&&!A.eventNews))return '행사 종료';const event=A.event??Infinity;if(A.y!==G.year||A.played&&!A.game&&!asgKnownEvent(A)&&G.day>event+1)return A.game?'경기 종료 · 일부 행사 기록 없음':'경기 기록 없음';if(A.game)return '경기 종료 · 행사 처리 대기';return G.day>=event?'경기 진행 대기':'행사 예정';}
/* 기사/안내가 저장된 뒤 예외가 나도 실제 발행물을 확인해 한 번만 확정한다. */
function asgPublish(A,k,title,fn,kind='news'){const N=A.eventNews||(A.eventNews={}),find=()=>kind==='mail'?(G.mail||[]).some(x=>x.body===title||k==='note'&&String(x.body||'').startsWith(`${A.y} 나눔·드림 올스타 행사가 열렸습니다.`)):(G.news||[]).some(x=>x.t===title);if(N[k])return true;if(find()){N[k]=1;return true;}try{fn();}finally{if(find())N[k]=1;}return !!N[k];}
function asgReplacementNews(A){for(const old of A.withdrawn||[]){if(old.replacement==null||old.returned)continue;const next=Object.values(A.teams).flat().find(x=>x.id===old.replacement);if(!next)continue;const side=allStarSide(next.t),title=`${side} 올스타 ${next.name}, ${old.name} 대신 선정`;try{withRng(asgSeed(A.y,'rep:'+old.id+':'+next.id),()=>asgPublish(A,'rep:'+old.id+':'+next.id,title,()=>news('선수',title,`${old.name}의 출전이 어려워 ${tshort(next.t)} ${next.name}을 대체 선수로 선정했습니다.`,0,{tid:next.t,ref:next.id})));}catch(e){console.error(e);}}for(const e of A.extra||[]){const next=(A.teams[e.side]||[]).find(x=>x.id===e.id);if(!next)continue;const title=`${e.side} 올스타 ${next.name}, 경기 편성을 위해 추가 선정`;try{withRng(asgSeed(A.y,'extra:'+e.id),()=>asgPublish(A,'extra:'+e.id,title,()=>news('선수',title,`건강한 출전 명단을 채우기 위해 ${tshort(next.t)} ${next.name}을 추가 추천했습니다.`,0,{tid:next.t,ref:next.id})));}catch(err){console.error(err);}}}
/* 대체 후보가 없었던 빈자리도 다음 호출에서 실제 건강 자격을 다시 확인한다. */
function asgFillPending(A,pool,ev){for(const old of A.withdrawn||[]){if(old.replacement!=null||old.pending===false)continue;const side=allStarSide(old.t0??old.t),L=A.teams[side];if(!L)continue;const used=new Set([...Object.values(A.teams).flat(),...A.withdrawn].map(x=>x.id)),p=G.players[old.id];let next=null;
    if(!Object.values(A.teams).flat().some(x=>x.id===old.id)&&asgCanPlay(p,side,ev,A.y)){next={...old,t:p.team,reason:'출전 가능 회복'};for(const k of ['replacement','pending','day','returned'])delete next[k];old.returned=G.day;}
    else {const F=f=>pool.find(x=>allStarSide(x.p.team)===side&&!used.has(x.p.id)&&asgCanPlay(x.p,side,ev,A.y)&&f(x)),rep=!L.some(x=>x.t===old.t),x=(rep&&(F(x=>x.p.team===old.t&&x.slot===old.slot)||F(x=>x.p.team===old.t&&!!x.p.isP===old.isP)||F(x=>x.p.team===old.t)))||F(x=>x.slot===old.slot)||F(x=>!!x.p.isP===old.isP);if(x)next=allStarSnapshot(x,old.starter,'출전 불가 선수의 대체 추천',old.slot,G.day);}
    if(!next)continue;old.replacement=next.id;old.pending=false;L.push(next);const q=G.players[next.id],label=`${A.y} 올스타(${side})`;if(q&&!(q.aw||[]).includes(label))addAward(q,label);}
  /* 선정 당시부터 모자랐던 명단도 실제 자격을 갖춘 미선정 후보로 최소 편성만 보충한다. */
  const used=new Set([...Object.values(A.teams).flat(),...(A.withdrawn||[])].map(x=>x.id));for(const side of ASG_SIDES){const L=A.teams[side]||[];for(const [isP,min] of [[false,9],[true,3]])while(L.filter(x=>{const p=G.players[x.id];return asgCanPlay(p,side,ev,A.y)&&!!p.isP===isP;}).length<min){const x=pool.find(x=>!used.has(x.p.id)&&!!x.p.isP===isP&&asgCanPlay(x.p,side,ev,A.y));if(!x)break;const next=allStarSnapshot(x,false,'경기 편성을 위한 추가 추천',null,G.day);L.push(next);used.add(next.id);(A.extra||(A.extra=[])).push({id:next.id,side,d:G.day});const label=`${A.y} 올스타(${side})`;if(!(x.p.aw||[]).includes(label))addAward(x.p,label);}}}

function asgEvent(A){if(A?.evDone&&A.game&&A.hrd)return true;if(!A||!asgRetryDue(A))return false;A.evAttempt=A.evAttempt??G.day;if(!A.game)A.played=false;delete A.evDone;const y=A.y;let H=null,gm=null;
  try{H=asgDerby(A);}catch(e){console.error(e);}try{gm=asgPlayGame(A);}catch(e){console.error(e);}A.played=!!A.game;
  withRng(asgSeed(y,'news'),()=>{
    if(H){const w=H.L.find(x=>x[0]===H.w),title=`${y} 홈런 더비 우승 ${w[1]}`;try{asgPublish(A,'derby',title,()=>news('선수',title,`${tshort(w[2])} ${w[1]}이(가) 결승에서 ${w[4]}개를 넘겨 홈런 더비 정상에 올랐습니다.\n${H.L.map(x=>`${x[1]}(${tshort(x[2])}) 예선 ${x[3]}개${x[4]!=null?` · 결승 ${x[4]}개`:''}`).join('\n')}`,w[2]===G.user&&!G.unemp?1:0,{ref:w[0],act:{l:'올스타 화면',a:'leagueEvents',v:String(y)}}));}catch(e){console.error(e);}}
    if(gm){const m=gm.mvp,title=`${y} 올스타전: 나눔 ${gm.hs} : ${gm.as} 드림${gm.win?` · ${gm.win} 승리`:' · 무승부'}`;try{asgPublish(A,'game',title,()=>news('경기',title,`${m?`올스타전 MVP는 ${m.side} ${m.n}(${tshort(m.t)}) · ${m.line}.`:''} 올스타전 기록은 정규시즌 기록에 넣지 않습니다.`,m&&m.t===G.user&&!G.unemp?1:0,{ref:m?m.id:null,act:{l:'올스타전 결과',a:'leagueEvents',v:String(y)}}));}catch(e){console.error(e);}}
    if(!H||!gm){const resume=Object.keys(G.cal.sched).map(Number).filter(d=>d>(A.event??G.cal.asg)+1).sort((a,b)=>a-b)[0],body=`${y} 올스타전은 출전 명단과 경기 처리를 기다리고 있습니다.${resume?' '+dmd(resume)+(resume>G.day?'부터 정규시즌 일정이 재개됩니다.':'에 정규시즌 일정이 재개됐습니다.'):''}`;try{asgPublish(A,'pending',body,()=>note('일정',body),'mail');}catch(e){console.error(e);}}
    if(H&&gm&&A.eventNews?.derby&&A.eventNews?.game){const resume=Object.keys(G.cal.sched).map(Number).filter(d=>d>(A.event??G.cal.asg)+1).sort((a,b)=>a-b)[0],body=`${y} 나눔·드림 올스타 행사가 열렸습니다.${resume?' '+dmd(resume)+(resume>G.day?'부터 정규시즌 일정이 재개됩니다.':'에 정규시즌 일정이 재개됐습니다.'):''}`;try{asgPublish(A,'note',body,()=>note('일정',body),'mail');}catch(e){console.error(e);}}
  });if(H&&gm&&A.eventNews?.derby&&A.eventNews?.game&&A.eventNews?.note)A.evDone=1;return !!A.evDone;}
/* ---- 시상·올스타 역대: 해마다 MVP·신인왕·골든글러브·포스트시즌 MVP·올스타(전 MVP·홈런 더비) 한 줄 ----
   저장된 시상(G.awards)·올스타(G.allStars)·포스트시즌 MVP(G.psMvp, 없으면 한국시리즈 기록으로 같은 식) 그대로 읽는다. 새로 저장하는 값이 없어 옛 저장도 그대로 보인다 */
/* 옛 시즌은 우승 구단과 실제 한국시리즈 기록이 함께 있을 때만 MVP를 읽는다. */
function awardLegacyKs(y){ const h=(G.history||[]).find(h=>h.y===y&&h.champ!=null), K=G.psSer&&G.psSer[y]&&G.psSer[y].ks; if(!h||!K)return null;
  const r=psSeriesMvp(y,'ks',h.champ), o=r&&K[r.id]; if(!o||o.t!==h.champ||!['g','pa','ab','outs'].some(k=>(o[k]||0)>0))return null;
  return {id:r.id,n:r.n,t:h.champ,line:r.line}; }
/* 결과를 읽는 모든 화면이 같은 공개 범위를 쓴다. 저장된 MVP 자체는 바꾸지 않는다. */
function awardPsPublic(y,hidden=typeof spoilG==='function'?spoilG():null){ const raw=(G.psMvp||{})[y], s={...(raw&&raw.s||{})};
  let g=Array.isArray(raw&&raw.g)?raw.g.filter(Array.isArray).map(r=>({rd:r[0],n:r[1],id:r[2],t:r[3],name:r[4],line:r[5],d:r[6]})):[];
  if(!s.ks){ const k=awardLegacyKs(y); if(k)s.ks=k; }
  const rd=hidden&&psRoundOf(hidden.kind), hy=hidden&&psGameSeason(hidden), same=hidden&&(hy===y||hy==null&&G.ps&&G.ps.y===y);
  if(same&&rd){ const order=['wc','spo','po','ks'], at=order.indexOf(rd); if(at>=0)for(const k of order.slice(at))delete s[k];
    g=g.filter(r=>Number.isFinite(r.d)&&r.d<hidden.day); }
  return {g,s}; }
function awardHistoryYears(){ const ys=new Set([...Object.keys(G.awards||{}),...Object.keys(G.allStars||{}),...Object.keys(G.psMvp||{})].map(Number).filter(Number.isInteger));
  for(const h of G.history||[])if(Number.isInteger(h.y)&&!ys.has(h.y)&&awardLegacyKs(h.y))ys.add(h.y); return [...ys].sort((a,b)=>b-a); }
function awardHistoryRows(hidden=typeof spoilG==='function'?spoilG():null){ const ys=awardHistoryYears(); const W=x=>x?{id:x.id,name:x.name??x.n,t:x.t}:null;
  return [...ys].sort((a,b)=>b-a).map(y=>{ const A=(G.awards||{})[y], S=(G.allStars||{})[y]; const o={y};
    if(A&&awShown(A,'mvp')){ o.mvp=W(A.mvp); o.roy=W(A.roy); } if(A&&awShown(A,'gg'))o.gg=['P','C','1B','2B','3B','SS','OF0','OF1','OF2','DH'].filter(k=>A.gg&&A.gg[k]).map(k=>({k,...W(A.gg[k])}));
    const s=awardPsPublic(y,hidden).s; o.ps=Object.keys(s).length?Object.fromEntries(Object.entries(s).map(([k,v])=>[k,{id:v.id,name:v.n,t:v.t}])):null;
    if(S){ o.as={n:Object.values(S.teams||{}).flat().length,st:Object.fromEntries(ASG_SIDES.map(sd=>[sd,(S.teams[sd]||[]).filter(x=>x.starter).map(x=>({id:x.id,name:x.name,t:x.t,slot:x.slot}))])),game:S.game?{hs:S.game.hs,as:S.game.as,win:S.game.win,mvp:S.game.mvp}:null,hrd:S.hrd?S.hrd.L.find(x=>x[0]===S.hrd.w):null}; }
    return o; }); }
