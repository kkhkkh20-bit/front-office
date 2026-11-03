/* 3D presentation uses the same deterministic fielder as the existing commentary. */
function c3DScore(g,k,st,includeCurrent=false){const n=Math.min(g.pbp.length,k+(includeCurrent?1:0)),snap=castSnapshot(g,n),x=g.pbp[k],pid=cPit(g,Math.min(k,g.pbp.length-1)),bid=typeof x?.[1]==='number'?x[1]:snap.batter;return {away:tshort(g.away),home:tshort(g.home),sa:st.sa,sh:st.sh,half:st.half,inning:cHalfTxt(st.half),outs:Math.min(2,st.outs),innings:{a:snap.teams.a.innings,h:snap.teams.h.innings},hits:{a:snap.teams.a.stats.h,h:snap.teams.h.stats.h},errors:{a:snap.teams.a.stats.e,h:snap.teams.h.stats.e},batter:G.players[bid]?.name||'',pitcher:G.players[pid]?.name||'',batterLine:bid?cToday(g,n,bid,false):'',pitcherLine:pid?cToday(g,n,pid,true):'',b:0,s:0,pitch:null,playText:includeCurrent?pbpCall(g,k).c:'경기 중계'};}
function c3DActive(){return typeof Match3D!=='undefined'&&Match3D.ready();}
function c3DFielder(g,k,pos){if(pos==='P'){const id=cPit(g,k);return id?{id,pos}:null;}return cFielders(g,g.pbp[k][0],k).find(a=>a.pos===pos);}
function c3DName(f){return f?G.players[f.id]?.name||'수비수':'수비수';}
async function c3DThrow(g,k,from,fromPt,toPos,toPt,phase){const receiver=c3DFielder(g,k,toPos),wind=560,travel=500;if(!from||!receiver)return;Match3D.move('d'+receiver.id,toPt,420/cSpd());Match3D.throwing('d'+from.id,toPt,wind/cSpd());cCap(`${POSK[from.pos]||from.pos} ${c3DName(from)} → ${POSK[toPos]||toPos} ${c3DName(receiver)} 송구`);await cSleep(wind);Match3D.receive('d'+receiver.id,'stretch',travel/cSpd(),fromPt);await cBall(fromPt,toPt,travel,false);Match3D.caught('d'+receiver.id,phase);cCap(`${POSK[toPos]||toPos} ${c3DName(receiver)} · ${phase}`,phase.includes('아웃')?'bad':'');await cSleep(360);}
async function c3DContact(g,k,{x,b,spot,arc,opos,bat,after,moves,bTo}){
 const o=x[3],outPlay=['OUT','DP','SAC'].includes(o),isHR=o==='HR',fielders=cFielders(g,x[0],k).concat([{id:cPit(g,k),pos:'P'}]);let f=opos?c3DFielder(g,k,opos):null;
 if(!f)f=fielders.reduce((best,a)=>!best||cDist(CFP[a.pos],spot)<cDist(CFP[best.pos],spot)?a:best,null);
 const airOut=outPlay&&!UI.cast.errPos&&!UI.cast.gb&&!['DP','SAC'].includes(o),flight=isHR?3000:arc?1900:airOut?900:1100,runMs=3200;
 const runners=Promise.all(moves.map(async m=>{const el=document.querySelector(`#cs-stage .cc[data-k="o${m.id}"]`);if(!el)return;for(let i=m.from+1;i<=Math.min(4,m.to);i++){cPlace(el,CPATH[i],runMs);await cSleep(runMs);}if(m.out||m.score)el.classList.add('gone');}));
 const batter=(async()=>{await cSleep(650);if(!bat)return;if(bTo>0){for(let i=1;i<=Math.min(4,bTo);i++){cPlace(bat,CPATH[i],isHR?3600:runMs);await cSleep(isHR?3600:runMs);}if(bTo>=4)bat.classList.add('gone');}else{cPlace(bat,CBS[0],runMs);await cSleep(runMs);}})();
 sfx('crack',1,1);const receiveLead=480;
 if(f&&!isHR){Match3D.focus('d'+f.id,'타구 처리');Match3D.move('d'+f.id,spot,(flight-receiveLead)/cSpd());cCap(`${POSK[f.pos]||f.pos} ${c3DName(f)} 쪽 타구`);}
 Match3D.batted(o,550/cSpd());const ball=cBall([50,88],spot,flight,arc,!!UI.cast.gb);
 if(!isHR&&f){await cSleep(flight-receiveLead);Match3D.receive('d'+f.id,airOut?(arc?'fly':'line'):'ground',receiveLead/cSpd(),CHM);await ball;if(!outPlay){const landing=Match3D.landed();cCap(landing,'good');await cSleep(420);Match3D.receive('d'+f.id,'ground',280/cSpd(),CHM);await cSleep(280);}
  if(UI.cast.errPos){Match3D.focus('d'+f.id,'실책');cFx('실책','bad');await cSleep(650);}
  Match3D.caught('d'+f.id,airOut?'포구 · 아웃':'포구');
  if(outPlay&&!UI.cast.errPos){
   if(airOut){cCap(`${POSK[f.pos]||f.pos} ${c3DName(f)} 포구 · 아웃`,'bad');cFx('아웃','out');await cSleep(650);}
   else if(o==='DP'){const pat=pcPick(g,k,'dp',[['SS','2B','6-4-3'],['2B','SS','4-6-3'],['3B','2B','5-4-3']]);await c3DThrow(g,k,f,spot,pat[1],CBS[1],'포스 아웃');const pivot=c3DFielder(g,k,pat[1]);await c3DThrow(g,k,pivot,CBS[1],'1B',CBS[0],'병살 · 아웃');cFx(pat[2]+' 병살','bad');}
   else if(f.pos==='1B'){Match3D.move('d'+f.id,CBS[0],450/cSpd());await cSleep(450);Match3D.focus('d'+f.id,'베이스 터치 · 아웃');cCap(`1루수 ${c3DName(f)} 직접 베이스 터치 · 아웃`,'bad');cFx('아웃','out');}
   else await c3DThrow(g,k,f,spot,'1B',CBS[0],'아웃');
   if(!after.includes(x[1])&&bat){bat.classList.add('gone');Match3D.hide('o'+x[1]);}
  }else{await cSleep(300);const thrownOut=moves.find(m=>m.out);if(thrownOut){const pos=['','1B','2B','3B','C'][thrownOut.to];await c3DThrow(g,k,f,spot,pos,CPATH[thrownOut.to],thrownOut.to===4?'홈 태그 아웃':'주루 아웃');}else if(f.pos!=='2B')await c3DThrow(g,k,f,spot,'2B',CBS[1],'중계 플레이');cFx((o==='OUT'?'실책 출루':OUTK[o]||'안타')+(thrownOut?' · 주루 아웃':''),'hit');}
 }else{await ball;cCap(Match3D.landed(),'hr');cFlash();await cSleep(700);cFx(x[6]===4?'만루 홈런':x[6]>1?x[6]+'점 홈런':'홈런','hr');sfx('cheer_big',.85);}
 await Promise.all([runners,batter]);
}

/* Warm only model bytes on an explicit match-view intent; no WebGL work in menus. */
for(const event of ['pointerover','focusin'])document.addEventListener(event,e=>{if(e.target.closest?.('[data-a="cast"]')&&typeof Match3D!=='undefined')Match3D.prefetch().catch(()=>{});},{passive:true});

/* A recorded steal drives the animation; timing never changes the recorded safe/out result. */
async function c3DSteal(g,k,b){const x=g.pbp[k],i=b.bases.indexOf(x[2]),to=i+2,runner=document.querySelector(`#cs-stage .cc[data-k="o${x[2]}"]`),catcher=c3DFielder(g,k,'C'),fielder=c3DFielder(g,k,to===2?'2B':'3B');if(i<0||!runner||!catcher||!fielder)return;const key='o'+x[2],target=CPATH[to],source=CPATH[i+1],safe=x[1]==='SB',name=G.players[x[2]]?.name||'주자',base=to+'루';cCap(`${name}, ${base} 도루 시도`);cPlace(runner,target,2700);const sliding=(async()=>{await cSleep(1800);Match3D.slide(key,target,900/cSpd());})();Match3D.windup(500/cSpd(),pitchDelivery(G.players[cPit(g,k)]),true);await cSleep(500);await cBall(CFP.P,CHM,450,false);Match3D.caught('d'+catcher.id,'포구');Match3D.move('d'+fielder.id,target,900/cSpd());Match3D.throwing('d'+catcher.id,target,650/cSpd());cCap(`포수 ${c3DName(catcher)}, ${base} 송구`);await cSleep(650);const travel=safe?1100:800;Match3D.receive('d'+fielder.id,'throw',travel/cSpd(),CFP.C);await cBall(CFP.C,target,travel,false);Match3D.caught('d'+fielder.id,'태그 준비');Match3D.tag('d'+fielder.id,source,300/cSpd());await cSleep(300);await sliding;Match3D.focus('d'+fielder.id,safe?'태그 · 세이프':'태그 · 아웃');if(!safe){runner.classList.add('gone');Match3D.hide(key);}cCap(`${name}, ${base} ${safe?'도루 성공 · 세이프':'도루자 · 태그 아웃'}`,safe?'good':'bad');cFx(safe?'도루 성공':'도루자',safe?'hit':'out');const st={...b,outs:x[3],bases:x[4]};cBoard(g,st,null);Match3D.scoreboard(c3DScore(g,k,st,true));await cSleep(1000);cBallHide();}
