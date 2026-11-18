/* Capture facts before a game. Replays must not read future season totals or form. */
function broadcastFormOf(p){
  if(p.castForm?.y===G.year)return {...p.castForm};
  const f={y:G.year,hitless:0,streak:0,known:false};
  if(p.gl?.y!==G.year)return f;
  for(const x of p.gl.g||[]){if(!x[1])continue;if(x[3]>0){f.hitless=0;f.known=true;f.streak++;}else {let sf=x[9];if(sf==null){const seen=new Set(),rows=[];for(const g of [...(G.games||[]),...(G.gamesOff||[])]){if(g.day!==x[0])continue;const key=g.gid??JSON.stringify([g.day,g.home,g.away,g.hs,g.as]);if(seen.has(key))continue;seen.add(key);const b=['h','a'].flatMap(k=>g.box?.[k]?.bat||[]).find(b=>b.id===p.id&&b.pa===x[1]&&b.ab===x[2]&&b.h===x[3]);if(b)rows.push(b);}if(rows.length===1)sf=rows[0].sf;}if(x[2]>0||sf>0){f.hitless++;f.streak=0;}}} /* 볼넷·사구·희생번트만인 경기는 유지, 희생플라이는 중단. 옛 로그는 남은 박스의 실제 SF만 보완한다. */
  return f;
}
function broadcastFormUpdate(p,x){
  if(!x.pa)return;
  const f=broadcastFormOf(p);
  if(x.h){f.hitless=0;f.known=true;f.streak++;}
  else if(x.ab>0||x.sf>0){f.hitless++;f.streak=0;}
  p.castForm=f;
}
/* Compact pregame team facts. Only already-applied games are present at this capture point. */
function broadcastTeamFacts(day,home,away){
  const year=dobj(day).y;if((G.sea?.y??G.year)!==year)return null;
  const rec=L=>({w:L.filter(x=>x[0]>0).length,l:L.filter(x=>x[0]<0).length,t:L.filter(x=>x[0]===0).length}),teams={};
  const logs={};for(const t of seaTeams(year)){const L=logs[t.id]=(G.sea?.tl?.[t.id]||[]).filter(x=>x[5]<=day),last=L.length?Math.sign(L[L.length-1][0]):0;let n=0;for(let i=L.length-1;i>=0&&Math.sign(L[i][0])===last;i--)n++;teams[t.id]={rec:rec(L),recent:rec(L.slice(-5)),streak:{s:last,n}};}
  /* 순위표(standingsNow/standFm)와 같은 동률 묶음 규칙. 과거 중계에는 그 날짜까지의 경기만 쓴다. */
  const pct=tid=>{const r=teams[tid].rec;return r.w/Math.max(1,r.w+r.l);},prev=G.last?.order||[],prior=tid=>{const i=prev.findIndex(x=>(x.tid??x)===tid);return i<0?99:i;},order=Object.keys(teams).map(Number).sort((a,b)=>pct(b)-pct(a)),ranked=[];
  for(let i=0;i<order.length;){let j=i;while(j<order.length&&Math.abs(pct(order[j])-pct(order[i]))<1e-12)j++;const group=order.slice(i,j),ids=new Set(group),vs=tid=>{let w=0,l=0,r=0;for(const x of logs[tid])if(ids.has(x[4])&&x[4]!==tid){if(x[0]>0)w++;else if(x[0]<0)l++;r+=x[1]||0;}return {p:w+l?w/(w+l):.5,r};},scores=new Map(group.map(tid=>[tid,vs(tid)]));ranked.push(...group.sort((a,b)=>scores.get(b).p-scores.get(a).p||scores.get(b).r-scores.get(a).r||prior(a)-prior(b)||a-b));i=j;}ranked.forEach((tid,i)=>teams[tid].rank=i+1);
  const h2h=rec((G.sea?.tl?.[away]||[]).filter(x=>x[5]<=day&&x[4]===home));return {year,teams,h2h};
}
function broadcastSeriesFacts(day,home,away){const s=G.ps?.cur;if(!s||![s.hi,s.lo].includes(home)||![s.hi,s.lo].includes(away))return null;const round=ROUNDK[s.round];if(!round)return null;
  const seen=new Set(),games=(G.games||[]).concat(G.gamesOff||[]).filter(g=>{const key=g.gid??g.day+':'+g.home+':'+g.away+':'+g.kind;if(seen.has(key))return false;seen.add(key);return dobj(g.day).y===dobj(day).y&&g.day<=day&&g.kind?.startsWith(round)&&[g.home,g.away].includes(home)&&[g.home,g.away].includes(away);}).sort((a,b)=>a.day-b.day||(a.gid??0)-(b.gid??0)).map(g=>({gid:g.gid,day:g.day,kind:g.kind,home:g.home,away:g.away,hs:g.hs,as:g.as,box:JSON.parse(JSON.stringify(g.box))}));return {round,games,wins:{[s.hi]:s.wh||0,[s.lo]:s.wl||0}};}
function gameBroadcastContext(day,S,regular){
  if(S.h.tid!==G.user&&S.a.tid!==G.user)return null;
  const players={},year=dobj(day).y;
  for(const side of ['h','a'])for(const id of new Set([...S[side].box.keys(),...playersOf(S[side].tid).filter(p=>p.e1||!entryOn()).map(p=>p.id)])){
    const p=G.players[id];if(!p)continue;
    const rows=(p.hist||[]).filter(h=>h.lvl==='1군'&&!h.y2&&h.y<=year),season={},career={},t=seasonTotal(p,year,'1군'),pre={};
    for(const key of ['h','hr','so']){career[key]=sum(rows.map(h=>h[key]||0));season[key]=sum(rows.filter(h=>h.y===year).map(h=>h[key]||0));}
    for(const key of ['pa','ab','h','d','tr','hr','bb','hbp','so','sf','rbi','outs','er','w','l','gs','g'])pre[key]=t?.[key]||0;
    const f=p.isP?null:broadcastFormOf(p);
    players[id]={season,career,pre,power:!p.isP&&(p.r.pow||0)>=65,hitless:f?.known?f.hitless:null,streak:f?.streak||0};
  }
  return {v:2,day,year,regular,teams:{h:tshort(S.h.tid),a:tshort(S.a.tid)},players,pregame:{...broadcastTeamFacts(day,S.h.tid,S.a.tid),series:regular?null:broadcastSeriesFacts(day,S.h.tid,S.a.tid)}};
}
