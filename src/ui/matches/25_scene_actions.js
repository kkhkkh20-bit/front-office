/* 3D presentation uses the same deterministic fielder as the existing commentary. */
function c3DScore(g,k,st,includeCurrent=false){const n=Math.min(g.pbp.length,k+(includeCurrent?1:0)),snap=castSnapshot(g,n),x=g.pbp[k],pid=cPit(g,Math.min(k,g.pbp.length-1)),bid=typeof x?.[1]==='number'?x[1]:snap.batter;return {xh:n>=g.pbp.length&&g.line&&Array.isArray(g.line.h)&&g.line.h.includes('X')?g.line.h.indexOf('X'):null, /* 끝난 경기 9회말 X(박스스코어와 같게, 검수 11-08) */away:tshort(g.away),home:tshort(g.home),sa:st.sa,sh:st.sh,half:st.half,inning:cHalfTxt(st.half),outs:Math.min(2,st.outs),innings:{a:snap.teams.a.innings,h:snap.teams.h.innings},hits:{a:snap.teams.a.stats.h,h:snap.teams.h.stats.h},errors:{a:snap.teams.a.stats.e,h:snap.teams.h.stats.e},batter:G.players[bid]?.name||'',pitcher:G.players[pid]?.name||'',batterLine:bid?cToday(g,n,bid,false):'',pitcherLine:pid?cToday(g,n,pid,true):'',b:0,s:0,pitch:null,playText:includeCurrent?pbpCall(g,k).c:'경기 중계'};}
function c3DActive(){return typeof Match3D!=='undefined'&&Match3D.ready();}
function c3DFielder(g,k,pos){if(pos==='P'){const id=cPit(g,k);return id?{id,pos}:null;}return cFielders(g,g.pbp[k][0],k).find(a=>a.pos===pos);}
function c3DRunTime(id){return FrontOfficeCore.baseRunTime(G.players[id]?.r.spd??50);}
function c3DName(f){return f?G.players[f.id]?.name||'수비수':'수비수';}
async function c3DThrow(g,k,from,fromPt,toPos,toPt,phase,by){
 const receiver=c3DFielder(g,k,toPos);if(!from||!receiver)return;
 const arm=G.players[from.id]?.r.arm??G.players[from.id]?.r.stf??50;let travel=FrontOfficeCore.throwTime(Match3D.distance(fromPt,toPt),arm);
 const cover=(Match3D.actorDistance('d'+receiver.id,toPt)??Match3D.distance(CFP[toPos],toPt))/8*1000;let wind=Math.max(220,Math.min(650,cover-travel+60)); /* 받을 선수를 오래 기다리며 공을 쥐고 있지 않게(사용자 피드백 11-07) */
 if(by){ const left=(by-performance.now())*cSpd()-120, f=left>0?Math.min(1,left/(wind+travel)):.2; if(f<1){ const s=Math.max(.2,f); wind=Math.round(wind*s); travel=Math.round(Math.max(120,travel*s)); } } /* by: 주자가 베이스에 닿는 시각. 아웃이면 공이 그보다 먼저(빠른 송구) */
 Match3D.move('d'+receiver.id,toPt,cover/cSpd());
 Match3D.throwing('d'+from.id,toPt,wind/cSpd());cSpeak(g,k,'throw',{fielder:c3DName(from),receiver:c3DName(receiver),relay:phase==='중계 플레이'});
 await cSleep(wind);sfx('pitch',.28,1.15);Match3D.receive('d'+receiver.id,toPos==='C'?'low':'stretch',travel/cSpd(),fromPt);await cBall(fromPt,toPt,travel,false);Match3D.caught('d'+receiver.id,phase);sfx('mitt',.5,1.1); /* 송구·포구 소리(사용자 11-08) */
 cCap(`${POSK[toPos]||toPos} ${c3DName(receiver)} · ${phase}`,phase.includes('아웃')?'bad':'');
 return {receiver,travel,wind};
}

async function c3DContact(g,k,{x,b,spot,arc,opos,bat,after,moves,bTo}){
 const o=x[3],outPlay=['OUT','DP','SAC'].includes(o),isHR=o==='HR',fielders=cFielders(g,x[0],k).concat([{id:cPit(g,k),pos:'P'}]);let f=opos?c3DFielder(g,k,opos):null;
 if(!f){const of=!outPlay&&!isHR?fielders.filter(a=>['LF','CF','RF'].includes(a.pos)):[],pool=of.length?of:fielders; /* 내야를 빠져나간 안타는 외야수가 달려 나와 잡는다. 예전에는 타구 자리에 가장 가까운 야수를 골라, 내야수가 외야로 물러나 잡는 일이 있었다(사용자 11-13) */f=pool.reduce((best,a)=>!best||cDist(CFP[a.pos],spot)<cDist(CFP[best.pos],spot)?a:best,null);}
 const airOut=outPlay&&!UI.cast.errPos&&!UI.cast.gb&&!['DP','SAC'].includes(o),timing=FrontOfficeCore.contactTiming({distance:Match3D.distance(CHM,spot),fieldDistance:f?Match3D.distance(CFP[f.pos],spot):0,speed:G.players[f?.id]?.r.spd??50,arc,airOut,homer:isHR}),retired=new Set();
 // 외야 장타: 공이 펜스·잔디에 맞고 멈춘 곳까지 외야수가 가서 줍고, 중계를 거쳐 타자 주자가 가는 베이스로 던진다.
 const path=['2B','3B'].includes(o)&&['LF','CF','RF'].includes(f?.pos)?Match3D.carom(spot,o):null,chase=path?path.roll:spot,relayPos=path?(chase[0]<50?'SS':'2B'):f?.pos==='LF'?'SS':'2B',base=o==='3B'?CBS[2]:CBS[1],basePos=o==='3B'?'3B':relayPos==='SS'?'2B':'SS',relayPt=path?base.map((v,i)=>v*.62+chase[i]*.38):spot.map((v,i)=>CBS[1][i]*.72+v*.28),run0=path?Math.round(Match3D.distance(CFP[f.pos],chase)/7.2*1000):timing.run;
 /* 장타 시간 맞추기: 외야수가 갭·선상까지 뛰어가 펜스에 맞고 구르는 공을 쫓는 시간만큼 걸린다. 기록상 2루타·3루타인데 공이 주자보다 먼저 들어오면, 공이 더 굴러가 쫓는 시간이 길어진 것으로 그린다(중계는 멈추지 않는다, 사용자 피드백 11-08) */
 let run=run0,extra=0,chase2=chase; if(path&&!outPlay&&!moves.some(m=>m.out)&&f.pos!==relayPos){ const arm=id=>G.players[id]?.r.arm??50, rl=c3DFielder(g,k,relayPos), est=timing.reaction+Math.max(run0,timing.flight-timing.reaction)+timing.pickup+440+FrontOfficeCore.throwTime(Match3D.distance(chase,relayPt),arm(f.id))+FrontOfficeCore.throwTime(Match3D.distance(relayPt,base),arm(rl?.id)), need=620+(o==='3B'?3:2)*c3DRunTime(x[1]); if(est<need-100){ extra=Math.min(2500,need-100-est); run=run0+extra; /* 공이 펜스를 타고 선상·갭 쪽으로 더 굴러가 외야수가 그만큼 더 쫓는다(같은 속도로 계속 뜀) */
   const dx=chase[0]-CHM[0], dy=CHM[1]-chase[1], th=Math.atan2(dx,dy)*180/Math.PI, r=Math.hypot(dx,dy), mpu=Match3D.distance(CHM,[50,17])/72, dir=(th>=0?1:-1)*(Math.abs(th)>36?-1:1), th2=Math.max(-44,Math.min(44,th+dir*(extra/1000*7.2/mpu/r)*180/Math.PI)); chase2=cPolar(th2,r); } }
 const relayPt2=path?base.map((v,i)=>v*.62+chase2[i]*.38):relayPt;
 /* 외야수가 늘 중계에게 던지지는 않는다(사용자 11-13): 가깝거나 어깨가 좋으면 베이스로 바로 던진다. 같은 타석은 늘 같은 선택(타석 번호로 고른다). 기록은 그대로 */
 const lead3=!outPlay&&!path?moves.find(m=>!m.out&&m.to===3&&m.from<3):null,armF=G.players[f?.id]?.r.arm??50;
 const direct=!!f&&!isHR&&!outPlay&&!UI.cast.errPos&&['LF','CF','RF'].includes(f.pos)&&!moves.some(m=>m.out)&&(typeof pcH==='function'?pcH(g,k,'direct'):1)<(path?(Match3D.distance(chase2,base)<60?.3:.1):.5)+(armF-50)*.006;
 const directPos=path?basePos:lead3?'3B':basePos,directPt=path?base:lead3?CBS[2]:CBS[1];
 const cover=(pos,target)=>{const receiver=c3DFielder(g,k,pos);if(receiver&&receiver.id!==f?.id)Match3D.move('d'+receiver.id,target,Match3D.distance(CFP[pos],target)/8.5*1000/cSpd());};
 if(f&&!isHR){if(outPlay){cover('1B',CBS[0]);if(o==='DP'){const pat=pcPick(g,k,'dp',[['SS','2B','6-4-3'],['2B','SS','4-6-3'],['3B','2B','5-4-3']]);cover(pat[1],CBS[1]);}}else{const thrownOut=moves.find(m=>m.out);if(thrownOut)cover(['','1B','2B','3B','C'][thrownOut.to],CPATH[thrownOut.to]);else{if(direct)cover(directPos,directPt);else cover(relayPos,relayPt2);if(path)cover(basePos,base);}}}

 const retire=id=>{retired.add(id);document.querySelector(`#cs-stage .cc[data-k="o${id}"]`)?.classList.add('gone');if(typeof Match3D.leave==='function')Match3D.leave('o'+id,3200/cSpd());else Match3D.hide('o'+id);}; /* 아웃된 주자는 사라지지 않고 뛰어 나간다 */
 const t0=performance.now(), arrive=(id,legs,start)=>t0+(start||0)+legs*c3DRunTime(id)/cSpd(); /* 아웃 판정: 주자는 끝까지 전력으로 뛰고, 송구가 그보다 먼저 도착하게 맞춘다(사용자 피드백 11-07) */
 const slideHome=new Set();if(!isHR&&f&&['LF','CF','RF'].includes(f.pos)&&!path&&!UI.cast.errPos){const out4=moves.find(m=>m.out&&m.to===4);if(out4)slideHome.add(out4.id);else if(!outPlay&&!moves.some(m=>m.out))for(const r of (Array.isArray(x[14])?x[14]:[]))if(r.to===4&&r.result!=='out'&&moves.some(m=>m.id===r.id&&m.score)){slideHome.add(r.id);break;}} /* 홈 승부(송구가 오는 주자)는 슬라이딩으로 들어온다 */
 if(slideHome.size&&typeof Match3D.brace==='function'){const c=c3DFielder(g,k,'C');if(c)setTimeout(()=>{if(UI.cast&&g.pbp[k]===x)Match3D.brace('d'+c.id,spot);},1100/cSpd());} /* 포수는 송구가 오기 전에 홈에서 낮은 자세로 기다린다 */
 const runners=Promise.all(moves.map(async m=>{const el=document.querySelector(`#cs-stage .cc[data-k="o${m.id}"]`);if(!el)return;for(let i=m.from+1;i<=Math.min(4,isHR?m.from+1:m.to);i++){if(retired.has(m.id))return;const duration=isHR?1500:c3DRunTime(m.id);cPlace(el,CPATH[i],duration);if(i===4&&slideHome.has(m.id)&&duration>1000&&typeof Match3D.slide==='function'){await cSleep(duration-900);if(retired.has(m.id))return;Match3D.slide('o'+m.id,CHM,900/cSpd(),false);await cSleep(900);}else await cSleep(duration);}if(retired.has(m.id))return;if(m.out||m.score)retire(m.id);}));
 runners.catch(()=>{});
 const batter=(async()=>{await cSleep(isHR?430:620);if(!bat)return;if(isHR){Match3D.batFlip(bat.dataset.k,1000/cSpd());await cSleep(540);} /* 빠던: 화면이 타구로 넘어가기 전에 다 보이도록 조금 일찍 던진다(사용자 11-13) */const target=isHR?2:bTo>0?Math.min(4,bTo):1;for(let i=1;i<=target;i++){if(retired.has(x[1]))return;const duration=isHR?1500:c3DRunTime(x[1]); /* 홈런은 2루까지만 돌고 넘긴다(사용자 요청 11-07) */cPlace(bat,CPATH[i],duration);await cSleep(duration);}if(!retired.has(x[1])&&(bTo>=4||isHR))retire(x[1]);})();
 batter.catch(()=>{});
 const leap=!!(airOut&&!arc&&f&&pcH(g,k,'leap')<.3); /* 직선타 아웃 열에 셋은 뛰어올라 잡는다(기록은 그대로, 보이는 동작만) */
 sfx('crack',1,1);Match3D.batted(o,(isHR?1500:650)/cSpd(),leap); /* 홈런은 타석 화면을 1.5초 잡아 빠던을 보여 준 뒤 타구로 넘어간다 */
 const short=!path&&!outPlay&&!isHR&&f?[50+(spot[0]-50)*(UI.cast.gb?.7:.8),88+(spot[1]-88)*(UI.cast.gb?.7:.8)]:null; /* 안타: 야수 앞에 떨어져 야수 쪽으로 굴러간다(떨어진 자리에 멈춰 있지 않게, 사용자 11-13) */
 const ball=cBall([50,88],path?path.land:short||spot,timing.flight,arc,!!UI.cast.gb);if(airOut&&arc&&Match3D.distance(CHM,spot)>62)sfx('ooh',x[0]%2===1?.75:.4); /* 깊은 뜬공: 관중이 기대했다가 잡히면 아쉬워한다(녹음 한 덩어리) */
 if(f&&!isHR){
  cSpeak(g,k,'flight',{fielder:`${POSK[f.pos]||f.pos} ${c3DName(f)}`,arc,ground:!!UI.cast.gb});
  await cSleep(timing.reaction);Match3D.focus('d'+f.id,'타구 추적');Match3D.move('d'+f.id,chase,run0/cSpd());if(extra)setTimeout(()=>Match3D.move('d'+f.id,chase2,extra/cSpd()),run0/cSpd());
  if(!outPlay){await ball;const landing=Match3D.landed(true);cCap(landing,'good');if(path){const rollMs=Math.max(600,timing.reaction+run0-timing.flight);Match3D.roll(chase,rollMs/cSpd());await cSleep(rollMs);if(extra){Match3D.roll(chase2,extra/cSpd());await cSleep(extra);}}else{const wait=Math.max(short?450:0,timing.reaction+timing.run-timing.flight);if(short)Match3D.roll(spot,wait/cSpd());await cSleep(wait);}Match3D.receive('d'+f.id,'ground',timing.pickup/cSpd(),CHM);await cSleep(timing.pickup);}
  else {const lead=airOut?(leap?480:180):timing.pickup;await cSleep(Math.max(0,Math.max(timing.reaction+timing.run,timing.flight-lead)-timing.reaction));Match3D.receive('d'+f.id,airOut?(arc?'fly':'line'):'ground',lead/cSpd(),CHM);await ball;if(!airOut)await cSleep(timing.pickup);}
  if(UI.cast.errPos)await c3DError(g,k,f,spot); else {Match3D.caught('d'+f.id,airOut?'포구 · 아웃':'포구');sfx('mitt',.45,1.05);}
  if(outPlay&&!UI.cast.errPos){
   if(airOut){cCap(`${POSK[f.pos]||f.pos} ${c3DName(f)} 포구 · 아웃`,'bad');cFx('아웃','out');}
   else if(o==='DP'){const pat=pcPick(g,k,'dp',[['SS','2B','6-4-3'],['2B','SS','4-6-3'],['3B','2B','5-4-3']]);{ const fm=moves.find(m=>m.out); await c3DThrow(g,k,f,spot,pat[1],CBS[1],'포스 아웃',fm?arrive(fm.id,fm.to-fm.from):0); }for(const m of moves)if(m.out)retire(m.id);await c3DThrow(g,k,c3DFielder(g,k,pat[1]),CBS[1],'1B',CBS[0],'병살 · 아웃',arrive(x[1],1,620));cFx(pat[2]+' 병살','bad');if(x[0]%2===1)sfx('sigh',.6); /* 홈 팀 병살: 관중 탄식 */}
   else if(f.pos==='1B'){const cover=Math.min(Math.max(180,Match3D.distance(spot,CBS[0])/7*1000),Math.max(150,(arrive(x[1],1,620)-performance.now())*cSpd()-120));Match3D.move('d'+f.id,CBS[0],cover/cSpd());await cSleep(cover);Match3D.focus('d'+f.id,'베이스 터치 · 아웃');cCap(`1루수 ${c3DName(f)} 직접 베이스 터치 · 아웃`,'bad');cFx('아웃','out');}
   else await c3DThrow(g,k,f,spot,'1B',CBS[0],'아웃',arrive(x[1],1,620));
   if(!after.includes(x[1])&&bat)retire(x[1]);
  }else{
   const thrownOut=moves.find(m=>m.out);
   const homeTry=!thrownOut&&!path&&!UI.cast.errPos&&f&&['LF','CF','RF'].includes(f.pos)?(Array.isArray(x[14])?x[14]:[]).find(r=>r.to===4&&r.result!=='out'&&moves.some(m=>m.id===r.id&&m.score)):null;
   if(thrownOut){const pos=['','1B','2B','3B','C'][thrownOut.to];const thrown=await c3DThrow(g,k,f,spot,pos,CPATH[thrownOut.to],'포구',arrive(thrownOut.id,thrownOut.to-thrownOut.from));await runners;if(thrown){Match3D.tag('d'+thrown.receiver.id,CPATH[Math.max(0,thrownOut.to-1)],240/cSpd());await cSleep(240);Match3D.focus('d'+thrown.receiver.id,thrownOut.to===4?'홈 태그 아웃':'주루 아웃');}retire(thrownOut.id);}
   else if(homeTry){ /* 홈 승부(사용자 11-13): 기록에 '홈으로 뛰어 세이프'가 있는 안타는 외야수가 홈으로 던지고, 공이 주자보다 조금 늦게 들어온다. 주심이 세이프를 선언한다 */
    const arm=G.players[f.id]?.r.arm??50,travel=FrontOfficeCore.throwTime(Match3D.distance(chase2,CHM),arm),wait=(arrive(homeTry.id,4-homeTry.from)-performance.now())*cSpd()+350-(travel+450);if(wait>0)await cSleep(wait);
    const thrown=await c3DThrow(g,k,f,chase2,'C',CHM,'홈 송구');if(thrown){Match3D.focus('d'+thrown.receiver.id,'홈 · 세이프');cCap(`홈 송구 · ${G.players[homeTry.id]?.name||'주자'} 세이프`,'good');}Match3D.trackRunner('o'+x[1]);}
   else if(direct){ /* 베이스로 바로 던진다. 뛰는 주자가 있으면 공이 주자보다 조금 늦게 닿게 맞춘다(기록은 세이프) */
    const at=path?arrive(x[1],o==='3B'?3:2,620):lead3?arrive(lead3.id,3-lead3.from):0;if(at){const travel=FrontOfficeCore.throwTime(Match3D.distance(chase2,directPt),armF),wait=(at-performance.now())*cSpd()+300-(travel+450);if(wait>0)await cSleep(wait);}
    await c3DThrow(g,k,f,chase2,directPos,directPt,directPos==='3B'?'3루 직접 송구':'2루 직접 송구');Match3D.trackRunner('o'+x[1]);}
   else {if(f.pos!==relayPos&&!UI.cast.errPos){const relay=await c3DThrow(g,k,f,chase2,relayPos,relayPt2,'중계 플레이');if(path&&relay)await c3DThrow(g,k,relay.receiver,relayPt2,basePos,base,o==='3B'?'3루 송구':'2루 송구'); /* 중계 선수는 받자마자 멈추지 않고 베이스로 던진다. 커버 야수는 타구 직후부터 베이스로 가 먼저 서 있다. 공이 주자보다 늦는 것은 외야수가 갭·선상까지 뛰어가 줍는 시간 때문(사용자 피드백 11-08) */}Match3D.trackRunner('o'+x[1]);}
   cFx((o==='OUT'?'실책 출루':OUTK[o]||'안타')+(thrownOut?' · 주루 아웃':''),'hit');
  }
 }else{await ball;const landing=Match3D.landed();cSpeak(g,k,'homer',{landing},'hr');cFlash();cFireworks();cFx(x[6]===4?'만루 홈런':x[6]>1?x[6]+'점 홈런':'홈런','hr');sfx('cheer_big',.85);}
 await Promise.all([runners,batter]);if(!outPlay||UI.cast.errPos){const confirmed=Match3D.confirmLanding();if(confirmed){cCap(confirmed+' · 세이프','good');}}
}

/* Warm only model bytes on an explicit match-view intent; no WebGL work in menus. */
for(const event of ['pointerover','focusin'])document.addEventListener(event,e=>{if(e.target.closest?.('[data-a="cast"]')&&typeof Match3D!=='undefined')Match3D.prefetch().catch(()=>{});},{passive:true});

/* A recorded steal drives the animation; timing never changes the recorded safe/out result. */
/* 수비 실책 장면(사용자 11-08): 내야 땅볼은 포구 실책(공이 글러브를 맞고 튀어 다시 줍는다) 또는 1루 악송구(공이 1루수를 지나 파울 지역으로 구른다), 뜬공은 낙구.
   같은 타석은 늘 같은 장면(타석 번호로 고른다) */
async function c3DError(g,k,f,spot){ const inf=['P','C','1B','2B','3B','SS'].includes(f.pos), gb=!!UI.cast.gb, kind=gb&&inf&&f.pos!=='1B'&&k%2===0?'throw':gb?'fumble':'drop', nm=`${POSK[f.pos]||f.pos} ${c3DName(f)}`;
  if(kind==='throw'){ Match3D.caught('d'+f.id,'포구');sfx('mitt',.45,1.05); const fb=c3DFielder(g,k,'1B'); const wide=[CBS[0][0]+5,CBS[0][1]+3]; /* 1루 뒤 파울 지역(더그아웃 앞) */ Match3D.throwing('d'+f.id,CBS[0],320/cSpd()); await cSleep(320); if(fb)Match3D.receive('d'+fb.id,'throw',520/cSpd(),spot); await cBall(spot,[CBS[0][0]+2,CBS[0][1]-1],520,false); cCap(`${nm} 악송구 · 공이 1루수 뒤로 빠집니다`,'bad'); if(fb)Match3D.focus('d'+fb.id,'송구 실책'); cFx('송구 실책','bad'); Match3D.roll(wide,900/cSpd()); if(fb)Match3D.move('d'+fb.id,wide,1000/cSpd()); await cSleep(1000); if(fb)Match3D.caught('d'+fb.id,'공 줍기'); return; }
  const side=spot[0]<50?-1:1, by=kind==='drop'?[spot[0]+side*1.5,spot[1]+1.5]:[spot[0]+side*3,spot[1]+3.5]; /* 글러브를 맞고 옆·뒤로 튄 곳 */
  Match3D.focus('d'+f.id,kind==='drop'?'낙구':'포구 실책'); cCap(`${nm} ${kind==='drop'?'공을 놓칩니다':'포구 실책 · 공이 글러브를 맞고 튑니다'}`,'bad'); cFx(kind==='drop'?'낙구 실책':'포구 실책','bad'); sfx('mitt',.3,.8);
  Match3D.roll(by,600/cSpd()); Match3D.move('d'+f.id,by,750/cSpd()); await cSleep(750); Match3D.caught('d'+f.id,'공 줍기'); await cSleep(200); }
async function c3DSteal(g,k,b){const x=g.pbp[k],i=b.bases.indexOf(x[2]),to=i+2,runner=document.querySelector(`#cs-stage .cc[data-k="o${x[2]}"]`),catcher=c3DFielder(g,k,'C'),fielder=c3DFielder(g,k,to===2?'2B':'3B');if(i<0||!runner||!catcher||!fielder)return;const key='o'+x[2],target=CPATH[to],source=CPATH[i+1],safe=x[1]==='SB',name=G.players[x[2]]?.name||'주자',base=to+'루';cSpeak(g,k,'steal',{runner:name,base});cPlace(runner,target,2700);const sliding=(async()=>{await cSleep(1800);Match3D.slide(key,target,900/cSpd(),pcH(g,k,'slide')<.4); /* 도루 열에 넷은 머리부터 */})();Match3D.windup(500/cSpd(),pitchDelivery(G.players[cPit(g,k)]),true);await cSleep(500);await cBall(CFP.P,CHM,450,false);Match3D.caught('d'+catcher.id,'포구');Match3D.move('d'+fielder.id,target,900/cSpd());Match3D.throwing('d'+catcher.id,target,650/cSpd());cCap(`포수 ${c3DName(catcher)}, ${base} 송구`);await cSleep(650);const travel=safe?1100:800;Match3D.receive('d'+fielder.id,'throw',travel/cSpd(),CFP.C);await cBall(CFP.C,target,travel,false);Match3D.caught('d'+fielder.id,'태그 준비');Match3D.tag('d'+fielder.id,source,300/cSpd());await cSleep(300);await sliding;if(safe)Match3D.move(key,target,0);Match3D.focus('d'+fielder.id,safe?'태그 · 세이프':'태그 · 아웃');if(!safe){runner.classList.add('gone');if(typeof Match3D.leave==='function')Match3D.leave(key,2800/cSpd());else Match3D.hide(key);} /* 도루자: 일어나서 걸어 나간다 */const final=pbpCall(g,k);cCap(final.c,safe?'good':'bad',final.a);cFx(safe?'도루 성공':'도루자',safe?'hit':'out');const st={...b,outs:x[3],bases:x[4]};cBoard(g,st,null);Match3D.scoreboard(c3DScore(g,k,st,true));await cSleep(1000);cBallHide();}

/* 끝내기·우승 세리머니(사용자 11-13): 이긴 팀 선수들이 더그아웃에서 뛰어나와 모여 환호한다. 끝내기는 홈 플레이트, 우승 확정은 마운드. 기록은 바꾸지 않는 연출 */
function c3DPartyKind(g,k){const L=g.pbp,x=L[k];if(k!==L.length-1||!x||typeof x[1]!=='number'||g.hs===g.as)return null;const winner=g.hs>g.as?g.home:g.away;
 const title=/한국시리즈/.test(g.kind||'')&&G.ps&&G.ps.champ===winner&&!(G.games||[]).some(q=>q!==g&&/한국시리즈/.test(q.kind||'')&&q.day>g.day);
 const walkoff=winner===g.home&&x[0]%2===1&&(x[6]||0)>0;return title?'title':walkoff?'walkoff':null;}
async function c3DParty(g,k,kind){if(!c3DActive()||typeof Match3D.celebrate!=='function')return;const winner=g.hs>g.as?g.home:g.away,side=winner===g.home?'h':'a',box=g.box[side],center=kind==='title'?CFP.P:CHM,dug=CDUG[side],u=cUni(g,winner);
 const ids=[...new Set([...(box.bat||[]).map(r=>r.id),...(box.pit||[]).map(r=>r.id)])].filter(id=>G.players[id]),on=id=>!!document.querySelector(`#cs-stage .cc[data-k="d${id}"]:not(.gone),#cs-stage .cc[data-k="o${id}"]:not(.gone)`);
 const field=ids.filter(on),bench=ids.filter(id=>!on(id)).slice(0,kind==='title'?12:9),spot=i=>{const ring=i<6?0:1,n=ring?10:6,a=(i-(ring?6:0))/n*Math.PI*2+ring*.3,r=ring?4.6:2.6;return [center[0]+Math.cos(a)*r,center[1]+Math.sin(a)*r*.75];};
 const targets=bench.map((id,i)=>({k:'party-'+id,id,name:G.players[id].name,cls:'df',position:'',u:{...u,glove:G.players[id].th==='좌'?'R':'L'},from:[dug[0]+(i%3-1)*1.2,dug[1]+(i%2)*1.5],pt:spot(i)}));
 if(kind==='title')field.forEach((id,i)=>{const key=document.querySelector(`#cs-stage .cc[data-k="d${id}"]`)?'d'+id:'o'+id;targets.push({k:key,id,pt:spot(bench.length+i)});});
 if(!targets.length)return;cCap(kind==='title'?'우승 확정! 선수들이 마운드로 달려 나옵니다':'끝내기! 선수들이 홈으로 달려 나옵니다','good');cFx(kind==='title'?'우승':'끝내기','hr');sfx('cheer_big',winner===g.home?1:.45);
 Match3D.celebrate(targets,1900/cSpd(),center);await cSleep(1900);Match3D.celebrateCheer(center);if(kind==='title'){cFireworks();sfx('cheer_big',winner===g.home?1:.45);}await cSleep(kind==='title'?4200:3000);cCap('');}
async function c3DBenchClear(g,k,event){const c=UI.cast,token=CT.tok;if(!c)return;c.incident={k,index:event.pitch,pending:true};const targets=(event.participants||[]).map((p,i)=>{const side=p.team===g.home?1:-1;return {k:'bench-'+p.id,id:p.id,name:p.name,cls:'df',position:'벤치',u:{...cUni(g,p.team),glove:p.th==='좌'?'R':'L'},from:[50+side*10,82],pt:[45+(i%3)*5,80+Math.floor(i/3)*3]};});
 if(!c3DActive()){cCap('몸쪽 공 뒤 언쟁 · 양 팀 벤치가 나와 선수들을 진정시킵니다','bad');await cSleep(2400);c.incident.pending=false;return;}
 Match3D.benchClear(targets,1800/cSpd());cSpeak(g,k,'bench-start',{},'bad');cFx('벤치 클리어링','bad');await cSleep(1800);Match3D.benchGather();cSpeak(g,k,'bench-talk');await cSleep(2200);Match3D.benchGather(true);Match3D.benchReturn(1800/cSpd());cSpeak(g,k,'bench-back');await cSleep(1800);if(token!==CT.tok)throw 'stop';c.incident.pending=false;const st=cBefore(g,k);Match3D.sync({targets:cTargets(g,k,st),board:c3DScore(g,k,st)});cPitchReset(g,k);cFx('');
}
