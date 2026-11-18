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
    for(const slot of ['SP','CP','C','1B','2B','3B','SS','OF','OF','OF','DH']){ const x=P.find(x=>!used.has(x.p.id)&&(slot==='DH'?!x.p.isP:x.slot===slot)); if(!x)continue; used.add(x.p.id); L.push({slot,id:x.p.id,name:x.p.name,t:x.p.team,v:Math.round(Math.max(.2,x.score)*90000*frac+clamp(x.p.pop||0,0,100)*700*frac)}); }
    out[side]=L; } return out; }
function asgVoteNews(n){ const y=G.year, V=(G.asVote=G.asVote||{}); const yv=V[y]=V[y]||{}; if(yv[n])return null; const frac=n===1?.45:.78, B=asgVoteBoard(y,frac); yv[n]={d:G.day,top:Object.fromEntries(ASG_SIDES.map(s=>[s,(B[s]||[]).map(x=>[x.slot,x.id,x.v])]))};
  for(const k of Object.keys(V))if(+k<y-30)delete V[k];
  const lab=s=>({SP:'선발',CP:'마무리',OF:'외야'})[s]||POSS[s]||s;
  const txt=ASG_SIDES.map(s=>`[${s}] ${(B[s]||[]).map(x=>`${lab(x.slot)} ${x.name}(${tshort(x.t)}) ${x.v.toLocaleString()}표`).join(', ')}`).join('\n');
  const top=Object.values(B).flat().sort((a,b)=>b.v-a.v||a.id-b.id)[0], mine=Object.values(B).flat().filter(x=>x.t===G.user&&!G.unemp);
  withRng(asgSeed(y,'vote'+n),()=>news('선수',`${y} 올스타 팬 투표 ${n}차 중간 발표${top?`: ${top.name} 최다 득표`:''}`,`${txt}\n\n자리별 1위만 적었습니다. 팬 투표는 전반기 기록과 선수 인기를 함께 반영합니다. 명단은 ${dmd(G.cal.asg-14)}에 발표합니다.${mine.length?`\n우리 구단 1위: ${mine.map(x=>x.name).join(', ')}`:''}`,mine.length?1:0,{act:{l:'올스타 화면',a:'leagueEvents',v:String(y)}}));
  return yv[n]; }
function asgVoteDaily(){ if(!G.cal||!G.cal.asg||!G.sea||G.sea.y!==G.year)return; const d=G.cal.asg-G.day; if(d===28)asgVoteNews(1); else if(d===21)asgVoteNews(2); }
/* 올스타전 한 진영: 명단의 실제 선수(행사 당일 출전 가능)로 라인업·선발·불펜 */
function asgSide(A,side,d){ const L=(A.teams[side]||[]).map(x=>G.players[x.id]).filter(p=>p&&p.team!=null&&!(p.injOut>0)&&!isAway(p));
  const B=L.filter(p=>!p.isP), P=L.filter(p=>p.isP); if(B.length<9||P.length<3)return null;
  const st=new Set((A.teams[side]||[]).filter(x=>x.starter).map(x=>x.id)); B.sort((a,b)=>(st.has(b.id)?1:0)-(st.has(a.id)?1:0)||a.id-b.id); /* 베스트12가 먼저 선발 라인업에 */
  const ln=ntLineup(B); for(const k of FGPOS)if(!ln[k]){ const f=B.find(p=>!Object.values(ln).includes(p)); if(f)ln[k]=f; }
  const posOf={}; for(const k in ln)posOf[ln[k].id]=k; const start=Object.values(ln), order=orderList(ORDER.filter(k=>ln[k]).map(k=>ln[k]),null);
  const sp=[...P].sort((a,b)=>(st.has(b.id)?1:0)-(st.has(a.id)?1:0)||spV(b)-spV(a)||a.id-b.id)[0], pen=P.filter(p=>p!==sp).sort((a,b)=>penV(b)-penV(a)||a.id-b.id);
  const s={tid:'asg:'+side,rot:null,order,posOf,bench:B.filter(p=>!start.includes(p)),out:[],defv:teamDefV(ln),spAll:[sp],short:false,pen,used:new Set([sp.id]),cur:sp,sp,curIsSP:true,idx:0,box:new Map(),pitchers:[sp.id],entry:{},exit:{},farm:true,pitchPool:new Set(P.map(p=>p.id))};
  s.start=order.map((p,o)=>({id:p.id,n:p.name,o,pos:posOf[p.id]})); s.changes=[]; s.box.set(sp.id,pz()); order.forEach(p=>s.box.set(p.id,bz())); sideTraits(s); return s; }
/* 올스타전: 홈은 나눔(해마다 같은 규칙), 무승부 가능. 결과·박스·MVP를 A.game에 */
function asgPlayGame(A){ if(!A||A.game)return A&&A.game; const y=A.y, d=A.event??G.day; const keep=new Map(); let g=null;
  try{ withRng(asgSeed(y,'game'),()=>{ const sh=asgSide(A,'나눔',d), sa=asgSide(A,'드림',d); if(!sh||!sa)return; for(const s0 of [sh,sa])for(const q of [...s0.order,...s0.bench,...s0.pen,s0.sp])if(q&&!keep.has(q.id))keep.set(q.id,[q.gc,q.gcD,q.fat]);
      g=simGame(d,null,null,false,{sides:{h:sh,a:sa},pitchRecords:false}); }); }
  catch(e){ (G.flErr=(G.flErr||[]).slice(-9)).push('asg:'+String(e&&e.message).slice(0,80)); g=null; }
  finally{ for(const [id,v] of keep){ const q=G.players[id]; if(!q)continue; if(v[0]===undefined)delete q.gc; else q.gc=v[0]; if(v[1]===undefined)delete q.gcD; else q.gcD=v[1]; q.fat=v[2]; } } /* 시즌 기록·컨디션·피로에 남기지 않는다 */
  if(!g)return null;
  const box=psBoxOf(g); box.h.side='나눔'; box.a.side='드림'; for(const k of ['h','a']){ for(const r of box[k].bat)r.t=(G.players[r.id]||{}).team; for(const r of box[k].pit)r.t=(G.players[r.id]||{}).team; }
  const win=g.score.h>g.score.a?'h':g.score.a>g.score.h?'a':null, m=psGameMvpBox(box,win), who=m&&G.players[m.id];
  A.game={hs:g.score.h,as:g.score.a,inn:g.inn,line:g.line,win:win?(win==='h'?'나눔':'드림'):null,mvp:m?{id:m.id,n:m.n,t:who?who.team:null,line:m.line,side:m.t==='asg:나눔'?'나눔':'드림'}:null,box};
  for(const k of Object.keys(G.allStars||{}))if(+k!==y&&G.allStars[k].game)delete G.allStars[k].game.box; /* 박스스코어는 올해 것만 보관 */
  return A.game; }
/* 홈런 더비: 진영 상관없이 명단 타자 가운데 시즌 홈런 상위 4명(같으면 장타력·번호). 예선 상위 2명이 결승 */
function asgDerby(A){ if(!A||A.hrd)return A&&A.hrd; const y=A.y, ids=Object.values(A.teams).flat().filter(x=>!x.isP).map(x=>G.players[x.id]).filter(p=>p&&!(p.injOut>0));
  const hr=p=>{ const h=seasonTotal(p,y,'1군'); return h?h.hr||0:0; }; const L=ids.sort((a,b)=>hr(b)-hr(a)||((b.r&&b.r.pow)||0)-((a.r&&a.r.pow)||0)||a.id-b.id).slice(0,4); if(L.length<2)return null;
  const round=(p,k)=>withRng(asgSeed(y,'hrd'+k+':'+p.id),()=>{ const pr=clamp(.12+(((p.r&&p.r.pow)||50)-50)/100*.5+hr(p)*.004,.08,.55); let n=0,o=0; while(o<7){ if(R()<pr)n++; else o++; } return n; });
  const r1=L.map(p=>({id:p.id,n:p.name,t:p.team,hr:hr(p),r1:round(p,1)})), fin=[...r1].sort((a,b)=>b.r1-a.r1||b.hr-a.hr||a.id-b.id).slice(0,2);
  for(const f of fin)f.r2=round(G.players[f.id],2); const w=[...fin].sort((a,b)=>b.r2-a.r2||b.r1-a.r1||a.id-b.id)[0];
  A.hrd={L:r1.map(x=>[x.id,x.n,x.t,x.r1,x.r2??null]),w:w.id}; return A.hrd; }
/* 행사 당일(allStarDaily): 홈런 더비 → 올스타전 → 기사 */
function asgEvent(A){ if(!A||A.evDone)return; A.evDone=1; const y=A.y; let H=null, gm=null;
  try{ H=asgDerby(A); }catch(e){ console.error(e); } try{ gm=asgPlayGame(A); }catch(e){ console.error(e); }
  withRng(asgSeed(y,'news'),()=>{
    if(H){ const w=H.L.find(x=>x[0]===H.w); news('선수',`${y} 홈런 더비 우승 ${w[1]}`,`${tshort(w[2])} ${w[1]}이(가) 결승에서 ${w[4]}개를 넘겨 홈런 더비 정상에 올랐습니다.\n${H.L.map(x=>`${x[1]}(${tshort(x[2])}) 예선 ${x[3]}개${x[4]!=null?` · 결승 ${x[4]}개`:''}`).join('\n')}`,w[2]===G.user&&!G.unemp?1:0,{ref:w[0],act:{l:'올스타 화면',a:'leagueEvents',v:String(y)}}); }
    if(gm){ const m=gm.mvp; news('경기',`${y} 올스타전: 나눔 ${gm.hs} : ${gm.as} 드림${gm.win?` · ${gm.win} 승리`:' · 무승부'}`,`${m?`올스타전 MVP는 ${m.side} ${m.n}(${tshort(m.t)}) · ${m.line}.`:''} 올스타전 기록은 정규시즌 기록에 넣지 않습니다.`,m&&m.t===G.user&&!G.unemp?1:0,{ref:m?m.id:null,act:{l:'올스타전 결과',a:'leagueEvents',v:String(y)}}); }
  }); }
/* ---- 시상·올스타 역대: 해마다 MVP·신인왕·골든글러브·포스트시즌 MVP·올스타(전 MVP·홈런 더비) 한 줄 ----
   저장된 시상(G.awards)·올스타(G.allStars)·포스트시즌 MVP(G.psMvp, 없으면 한국시리즈 기록으로 같은 식) 그대로 읽는다. 새로 저장하는 값이 없어 옛 저장도 그대로 보인다 */
function awardHistoryRows(){ const ys=new Set([...Object.keys(G.awards||{}),...Object.keys(G.allStars||{}),...Object.keys(G.psMvp||{})].map(Number)); const W=x=>x?{id:x.id,name:x.name??x.n,t:x.t}:null;
  return [...ys].sort((a,b)=>b-a).map(y=>{ const A=(G.awards||{})[y], S=(G.allStars||{})[y], M=(G.psMvp||{})[y]; const o={y};
    if(A&&awShown(A,'mvp')){ o.mvp=W(A.mvp); o.roy=W(A.roy); } if(A&&awShown(A,'gg'))o.gg=['P','C','1B','2B','3B','SS','OF0','OF1','OF2','DH'].filter(k=>A.gg&&A.gg[k]).map(k=>({k,...W(A.gg[k])}));
    const s={...(M&&M.s||{})}; if(!s.ks){ try{ const h=(G.history||[]).find(h=>h.y===y&&h.champ!=null); const r=h&&psSeriesMvp(y,'ks',h.champ); if(r)s.ks={id:r.id,n:r.n,t:h.champ}; }catch(e){} } o.ps=Object.keys(s).length?Object.fromEntries(Object.entries(s).map(([k,v])=>[k,{id:v.id,name:v.n,t:v.t}])):null;
    if(S){ o.as={n:Object.values(S.teams||{}).flat().length,st:Object.fromEntries(ASG_SIDES.map(sd=>[sd,(S.teams[sd]||[]).filter(x=>x.starter).map(x=>({id:x.id,name:x.name,t:x.t,slot:x.slot}))])),game:S.game?{hs:S.game.hs,as:S.game.as,win:S.game.win,mvp:S.game.mvp}:null,hrd:S.hrd?S.hrd.L.find(x=>x[0]===S.hrd.w):null}; }
    return o; }); }
