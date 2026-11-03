/* Capture facts before a game. Replays must not read future season totals or form. */
function broadcastFormOf(p){
  if(p.castForm?.y===G.year)return {...p.castForm};
  const f={y:G.year,hitless:0,streak:0,known:false};
  if(p.gl?.y!==G.year)return f;
  for(const x of p.gl.g||[]){if(!x[1])continue;if(x[3]>0){f.hitless=0;f.known=true;f.streak++;}else{f.hitless++;if(x[2]>0)f.streak=0;}}
  return f;
}
function broadcastFormUpdate(p,x){
  if(!x.pa)return;
  const f=broadcastFormOf(p);
  if(x.h){f.hitless=0;f.known=true;f.streak++;}
  else{f.hitless++;if(x.ab>0||x.sf>0)f.streak=0;}
  p.castForm=f;
}
function gameBroadcastContext(day,S,regular){
  if(S.h.tid!==G.user&&S.a.tid!==G.user)return null;
  const players={};
  for(const side of ['h','a'])for(const id of S[side].box.keys()){
    const p=G.players[id];if(!p)continue;
    const rows=(p.hist||[]).filter(h=>h.lvl==='1군'&&h.y<=G.year),season={},career={};
    for(const key of ['h','hr','so']){career[key]=sum(rows.map(h=>h[key]||0));season[key]=sum(rows.filter(h=>h.y===G.year&&!h.y2).map(h=>h[key]||0));}
    const f=p.isP?null:broadcastFormOf(p);
    players[id]={season,career,power:!p.isP&&(p.r.pow||0)>=65,hitless:f?.known?f.hitless:null,streak:f?.streak||0};
  }
  return {v:1,day,year:G.year,regular,teams:{h:tshort(S.h.tid),a:tshort(S.a.tid)},players};
}
