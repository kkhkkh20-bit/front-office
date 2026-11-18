/* ===== 퓨처스리그: 2군 경기를 실제 경기로 (사용자 11-11: "실제로 보지 않아도 기록이 남아야 한다", "KBO 잘 보고")
   - 1군과 같은 경기 엔진(simGame)을 2군 라인업으로 돌린다. 박스스코어·투구 수·승패·세이브·홀드가 1군과 같은 방식으로 나온다.
   - 북부리그(수도권 구단)·남부리그(그 밖의 구단 + 상무). 상무(국군체육부대)는 복무 중인 선수로 팀을 꾸리고 늘 원정으로 편성한다(구장 없음).
   - 경기일: 1군 경기가 있는 날 가운데 화·수·목·토·일(금요일은 쉰다). 전체 리그 한 바퀴와 같은 리그 한 바퀴를 번갈아 돌려 같은 리그끼리 더 자주 만난다.
   - 기록은 선수의 퓨처스 기록(lineFor ... '퓨처스')에 쌓인다. 상무 선수 기록은 원소속 구단 퓨처스 기록에 합친다(기존 방식 그대로).
   - 2군 감독의 주간 라인업·선발 순번은 futuresWeek(07_daily)가 그대로 짜고, 시즌 중에는 가짜 주간 성적 대신 이 경기들이 기록을 만든다.
   - 저장 크기: 순위·점수는 모두 남기고, 박스스코어는 우리 구단 경기 최근 40경기만 남긴다 */
const FL_SM='sm';
const FL_NORTH_REG=new Set(['수도권','강원']);
function flTeams(){ return G.teams.map(t=>t.id).concat([FL_SM]); }
function flName(t){ return t===FL_SM?'상무':tshort(t); }
function flLive(){ return G.flOn!==false&&period()==='season'; }
function flRoundBefore(d){ return flCalendarDays().filter(x=>x<d).length; }
/* 옛 결과의 날짜·라운드만 확정 근거로 삼는다. 없던 과거 경기나 선수 성적을 만들어 내지 않는다. */
function flMigrate(){ const F=G?.fl; if(!F||F.y!==G.year)return 0; let n=0; const end=Math.max(F.round||0,...(F.games||[]).map(g=>Number.isFinite(g.r)?g.r+1:0));
  if(F.balanceFrom==null){F.balanceFrom=end;n++;} if(F.round!==end){F.round=end;n++;} F.byDay=F.byDay||{}; F.playedDays=F.playedDays||{};
  const days=new Map(); for(const g of F.games||[]){ if(!Number.isFinite(g.d))continue; if(!days.has(g.d))days.set(g.d,[]); days.get(g.d).push(g); }
  for(const [d,L] of days)if(!F.byDay[d]){ const r=L.map(g=>g.r).find(Number.isFinite), P=L.map(g=>[g.h,g.a]), done={}; for(const [h,a]of P)done[h+':'+a]='played'; F.byDay[d]={r:r??null,P,done}; F.playedDays[d]=1;n++; } return n; }
function flInit(){ const y=G.year; if(G.fl&&G.fl.y===y){flMigrate();return G.fl;}
  const ids=G.teams.map(t=>t.id); const N=ids.filter(id=>FL_NORTH_REG.has(team(id).region)), S=ids.filter(id=>!FL_NORTH_REG.has(team(id).region)).concat([FL_SM]);
  const rec={}; for(const t of flTeams())rec[t]={w:0,l:0,d:0,rs:0,ra:0};
  G.fl={y,div:{N,S},rec,games:[],rot:{},round:flRoundBefore(G.day),balanceFrom:0,byDay:{},playedDays:{}}; try{ flSeedSM(); }catch(e){ console.error(e); } return G.fl; }
/* 상무 선수단이 모자라면(새 게임 첫해 등) AI 구단 2군의 군 미필 21~26세를 상무에 입대시켜 채운다. 우리 구단 선수는 건드리지 않는다.
   보충은 오늘 실제 입대한다. 확정된 지난 시즌 연봉·1군 출장일을 소급해 복무로 바꾸지 않는다. */
function flSeedSM(){ const sv=Object.values(G.players).filter(p=>p.team!=null&&milServing(p)&&milPeriod(p).unit==='상무'); let nb=sv.filter(p=>!p.isP).length, np=sv.filter(p=>p.isP).length; if(nb>=13&&np>=10)return 0;
  const per={}; const C=Object.values(G.players).filter(p=>p.team!=null&&p.team!==ME()&&!(p.joinY>G.year)&&!p.foreign&&!p.prospect&&!p.e1&&!p.ys&&p.age>=21&&p.age<=26&&milFree(p)&&!(p.mil&&p.mil.app)&&healthy(p)).sort((a,b)=>ovr(b)-ovr(a)); let n=0;
  for(const p of C){ if(nb>=13&&np>=10)break; if(p.isP?np>=10:nb>=13)continue; if((per[p.team]||0)>=3)continue; per[p.team]=(per[p.team]||0)+1;
    if(G.unemp&&p.team===G.user)withRng(rngHash(G.year,G.day,'fl-former:'+p.id),()=>ri(0,300)); else ri(0,300); /* 기존 AI 후보의 주 난수 순서 유지. 새 야인 전 구단 경계만 격리한다. */ enlist(p,'상무',G.day); try{ story(p,`${G.year} 상무 입대`,'mil'); }catch(e){} if(p.isP)np++; else nb++; n++; }
  return n; }
/* 시즌 도중 전역 등으로 경기를 못 꾸릴 때만 보충한다. 최초 flInit의 기존 보충은 그대로 둔다. */
function flEnsureSM(d){ const P=flPool(FL_SM,d); if(P.B.length>=6&&P.P.length>=2)return 0; return withRng(rngHash(G.year,d,'fl-refill'),()=>flSeedSM()); }
function flDay(d){ const w=dobj(d).w; return w!==1&&w!==5; } /* 월·금 휴식 */
/* 원 돌리기(circle method) 대진: 홀수면 '쉼'을 넣는다 */
function flRR(L,r){ const a=L.slice(); if(a.length%2)a.push(null); const n=a.length, fix=a[0], rest=a.slice(1); const k=r%(n-1); const rot=rest.slice(k).concat(rest.slice(0,k)); const A=[fix,...rot]; const P=[]; for(let i=0;i<n/2;i++){ const x=A[i], y=A[n-1-i]; if(x!=null&&y!=null)P.push((r+i)%2?[x,y]:[y,x]); } return P; }
function flPairs(F){ return flPairsR(F,F.round++); }
/* 대진은 라운드 번호만으로 정해진다(난수 없음): 앞날의 우리 2군 경기도 미리 알 수 있다 */
function flPairsRaw(F,r){ const all=flTeams(),cyc=all.length+5,i=r%cyc; let P; if(i<all.length)P=flRR(all,Math.floor(r/cyc)*3+i); else { const j=i-all.length;P=flRR(F.div.N,j).concat(flRR(F.div.S,j)); } return P.map(([h,a])=>h===FL_SM?[a,h]:[h,a]); }
/* 달력 조회는 옛 저장에서도 flDays를 쓰거나 새로 만들지 않는다. */
function flCalendarDays(){ const c=G.cal;if(!c||G.flOn===false)return [];let days=c.flDays; if(!days){const incoming={},dates=new Set([...Object.keys(c.sched||{}),...Object.keys(c.rain||{})]);for(const rows of Object.values(c.rain||{}))for(const q of rows)if(q.to!=null){incoming[q.to]=(incoming[q.to]||0)+1;dates.add(String(q.to));}const end=c.rE0??c.end0??c.end;days=[...dates].map(Number).filter(d=>d>=c.open&&d<=end&&(c.sched?.[d]||[]).length+(c.rain?.[d]||[]).filter(q=>q.origin!=='retry').length>Math.max(incoming[d]||0,(c.mk?.[d]||[]).length));}return [...new Set(days.map(Number))].filter(d=>d>=c.open&&flDay(d)).sort((a,b)=>a-b); }
let FL_BAL_CACHE=new Map();
function flPairsR(F,r){ const from=F.balanceFrom??Math.max(F.round||0,...(F.games||[]).map(g=>g.r!=null?g.r+1:0)),n=flCalendarDays().length;if(from==null||r<from||r>=n)return flPairsRaw(F,r);const ids=flTeams(),key=JSON.stringify([G.year,ids,F.div,n,from]);let out=FL_BAL_CACHE.get(key);if(!out){
  const cmp=(a,b)=>String(a).localeCompare(String(b),'en',{numeric:true}),pk=(a,b)=>JSON.stringify([a,b].sort(cmp)),raw=Array.from({length:n-from},(_,i)=>flPairsRaw(F,from+i)),count=new Map();
  for(const P of raw)for(const[h,a]of P)if(h!==FL_SM&&a!==FL_SM){const k=pk(h,a),v=count.get(k)||{pair:[h,a].sort(cmp),n:0};v.n++;count.set(k,v);}
  /* 짝수 맞대결은 교대로 상쇄. 홀수 잔여 간선을 Euler 방향으로 정하면 구단 전체 편차도 최대 1이다. */
  const E=[],adj=new Map(),put=(a,b)=>{const i=E.length;E.push({a,b});for(const x of[a,b]){if(!adj.has(x))adj.set(x,[]);adj.get(x).push(i);}};for(const[,v]of [...count].sort((a,b)=>a[0].localeCompare(b[0])))if(v.n%2)put(...v.pair);const dummy='__fl_odd__';for(const[v,A]of [...adj].sort((a,b)=>cmp(a[0],b[0])))if(A.length%2)put(v,dummy);
  const used=new Set(),odd=new Map();for(const start of [...adj.keys()].sort(cmp)){const stack=[start],trail=[];while(stack.length){const v=stack[stack.length-1],A=adj.get(v)||[];while(A.length&&used.has(A[A.length-1]))A.pop();if(!A.length){trail.push(stack.pop());continue;}const i=A.pop(),e=E[i];used.add(i);stack.push(e.a===v?e.b:e.a);}trail.reverse();for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i];if(a!==dummy&&b!==dummy)odd.set(pk(a,b),a);}}
  const seen=new Map();out=raw.map(P=>P.map(([h,a])=>{if(h===FL_SM||a===FL_SM)return[h,a];const k=pk(h,a),v=count.get(k),i=seen.get(k)||0;seen.set(k,i+1);const h0=odd.get(k)??v.pair[0],home=i%2?v.pair.find(x=>x!==h0):h0;return home===h?[h,a]:[a,h];}));FL_BAL_CACHE.set(key,out);if(FL_BAL_CACHE.size>8)FL_BAL_CACHE.delete(FL_BAL_CACHE.keys().next().value);
 }return out[r-from].map(p=>p.slice()); }
/* 그날 퓨처스 경기가 열리는 날인지(flPlayDay와 같은 조건) */
function flOpenOn(d){ const c=G.cal; if(G.flOn===false||!c||d<c.open||!flDay(d))return false;
  /* 원래 편성일을 고정한다. 1군 우천 취소·예비일 재편성은 퓨처스 라운드를 없애거나 추가하지 않는다. */
  if(!c.flDays){ const incoming={}, dates=new Set([...Object.keys(c.sched||{}),...Object.keys(c.rain||{})]); for(const rows of Object.values(c.rain||{}))for(const r of rows)if(r.to!=null){ incoming[r.to]=(incoming[r.to]||0)+1; dates.add(String(r.to)); }
    const end=c.rE0??c.end0??c.end; c.flDays=[...dates].map(Number).filter(day=>day>=c.open&&day<=end&&(c.sched?.[day]||[]).length+(c.rain?.[day]||[]).filter(r=>r.origin!=='retry').length>Math.max(incoming[day]||0,(c.mk?.[day]||[]).length)); }
  return c.flDays.includes(+d); }
/* 앞날 그 구단 2군 경기: {op,home} 또는 null. 오늘까지 치른 라운드에서 열리는 날만큼 센다(우천·인원 부족 취소는 당일에 확인) */
function flGameOn(tid,d){ d=+d; if(!flOpenOn(d)||d<=G.day)return null; const y=dobj(d).y; const F0=G.fl&&G.fl.y===y?G.fl:null; let F=F0;
  if(!F){ const ids=G.teams.map(t=>t.id); F={div:{N:ids.filter(id=>FL_NORTH_REG.has(team(id).region)),S:ids.filter(id=>!FL_NORTH_REG.has(team(id).region)).concat([FL_SM])},round:0,balanceFrom:0}; }
  let r=F.round; for(let i=F0?G.day+1:G.cal.open;i<d;i++)if(flOpenOn(i))r++;
  const m=flPairsR(F,r).find(x=>x[0]===tid||x[1]===tid); return m?{op:m[0]===tid?m[1]:m[0],home:m[0]===tid,r}:null; }
function flPlanMatches(p,g){ return p.op!=null&&p.op===(g.h===G.user?g.a:g.h)&&p.home!=null&&p.home===(g.h===G.user)&&(p.fr==null||p.fr===g.r); }
/* 오늘 치른 우리 2군 경기(박스스코어 포함) */
function flOurGame(d){ const F=G.fl; if(!F||F.y!==dobj(d).y)return null; for(let i=F.games.length-1;i>=0;i--){ const x=F.games[i]; if(x.d===d&&(x.h===G.user||x.a===G.user)&&x.box)return x; if(x.d<d)break; } return null; }
/* 그날 나갈 수 있는 2군 선수 */
function flPool(t,d){
  if(t===FL_SM){ const L=Object.values(G.players).filter(p=>p.team!=null&&!(p.joinY>dobj(d).y)&&milOn(p,d)&&milPeriod(p).unit==='상무'&&healthy(p)&&!(p.ntAway>d&&p.ntFrom<=d)); return {B:L.filter(p=>!p.isP),P:L.filter(p=>p.isP)}; }
  const dd=depth(t); const ok=p=>healthy(p)&&!futUpToday(p)&&futEligibleDay(p,t,d); return {B:dd.futB.filter(ok),P:dd.futP.filter(ok)}; }
function flRested(p,d){ const L=p.ld||[]; const last=L.length?L[L.length-1][0]:null; return last==null||d-last>=(isSPr(p)?5:1); }
/* 임시 육성 선수: 2군 인원이 모자란 날 그 경기에만 채운다(실제 KBO 구단은 정식 65명+육성 선수라 2군이 늘 9명 이상, 이 게임은 정원이 작다).
   경기 동안만 선수 명단에 두고 끝나면 지운다. 기록·피로·부상에 남지 않고, 박스스코어에는 '육성 선수'로 남는다 */
let FL_TMP=[];
/* 상무 휴식 순번에는 해당 복무·시즌에서 상무로 뛴 경기만 센다. 원구단 2군 누적 기록과 구분한다. */
function flSmGames(p){ const u=p.flSmUse,m=milPeriod(p); return u&&m&&u.y===G.year&&u.from===m.from?u.g||0:0; }
function flTemp(t,isP,pos){ const p=newPlayer({isP,pos,age:ri(19,23)}); for(const k in p.r)if(typeof p.r[k]==="number")p.r[k]=clamp(Math.round(N(44,4)),36,52); /* 2군 하위권 수준 */ p.team=t===FL_SM?null:t; p.flTemp=1; p.name='육성 '+p.name; FL_TMP.push(p.id); return p; }
/* 경기 도중 교체된 선발도 실제 출전한 선수다. 임시 선수는 applyFarm에서 제외한다. */
function flFarmBatterUse(p,s,id,pos,d,x){ const played=s.order.some(q=>q.id===id)||(s.out||[]).some(q=>q.id===id)||(s.start||[]).some(q=>q.id===id)||(x.pa||x.ab||x.bb||x.hbp||0)>0; if(played)p.fat=clamp((p.fat||0)+((pos==='C'?12:pos==='DH'?4:8)-(p.r.vit||52)*.04),0,100); return played; }
function flSide(t,d){ const F=G.fl, {B,P}=flPool(t,d); if(B.length<6||P.length<2)return null; /* 그래도 너무 적으면(6명·2명 미만) 경기 취소 */
  const cached=t!==FL_SM&&G.futLn&&G.futLn[t],requests=t===FL_SM?[]:futReqList(t),ids=cached?[...Object.values(cached.ln||{}),...(cached.rot||[])]:[];
  const courses=P.filter(p=>rpPlanOf(t,p)==='sp2');
  const stale=!!cached&&(courses.some(p=>!(cached.rot||[]).slice(0,courses.length).includes(p.id))||requests.some(p=>!(p.isP?cached.rot||[]:Object.values(cached.ln||{})).includes(p.id))||playersOf(t).some(p=>{const r=p.futReq;return r&&ids.includes(p.id)&&(r.d??r.until-42)<=cached.d&&r.until>=cached.d&&!futReqOn(p);}));
  const W=stale?null:cached; let ln=null;
  if(W&&W.ln){ const L={}; let ok=true; for(const k in W.ln){ const p=B.find(q=>q.id===W.ln[k]); if(!p){ ok=false; break; } L[k]=p; } if(ok&&Object.keys(L).length>=9){ const c=L.C, realC=B.some(p=>p.pos==='C'&&!p.pconv); if(!(c&&c.pconv&&c.pconv.pos==='C'&&realC&&posExp(c,'C')<40&&(d+c.id)%3))ln=L; } } /* 2군 감독의 주간 라인업 그대로 */
  if(!ln&&t===FL_SM&&B.length>10){ const gp=flSmGames; const S=B.slice().sort((x,y)=>gp(y)-gp(x)); const rest=new Set(S.slice(0,B.length-10)); const B2=B.filter(q=>!rest.has(q)); if(B2.length>=9)ln=futLineupE(t,B2); } /* 상무: 복무 선수가 고르게 뛰도록 많이 뛴 선수부터 번갈아 쉰다 */
  if(!ln)ln=futLineupE(t,B);
  if(t===FL_SM){ const gp=flSmGames; const inL=new Set(Object.values(ln)); const low=B.filter(q=>!inL.has(q)).sort((x,y)=>gp(x)-gp(y))[0]; const lo=Object.values(ln).reduce((m,q)=>Math.min(m,gp(q)),1e9);
    if(low&&gp(low)<=lo-3){ ln.DH=low; } } /* 상무: 오래 못 뛴 선수는 지명타자로라도 내보낸다 */
  for(const k of FGPOS)if(!ln[k])ln[k]=flTemp(t,false,k==='DH'?'1B':k); /* 빈 자리는 임시 육성 선수 */
  const posOf={}; for(const k in ln)posOf[ln[k].id]=k; const start=Object.values(ln); const order=orderList(ORDER.filter(k=>ln[k]).map(k=>ln[k]),t===FL_SM?null:t);
  const requested=stale||requests.some(p=>p.isP)||courses.length>0,rotIds=(W&&W.rot)||P.slice().sort((a,b)=>requested?Number(futReqOn(b))-Number(futReqOn(a))||(rpPlanOf(t,b)==='sp2')-(rpPlanOf(t,a)==='sp2')||(spV(b)+roleBias(t,b))-(spV(a)+roleBias(t,a)):spV(b)-spV(a)).slice(0,requested?Math.max(5,P.filter(p=>rpPlanOf(t,p)==='sp2'||futReqOn(p)).length):5).map(p=>p.id); const rot=rotIds.map(id=>P.find(p=>p.id===id)).filter(Boolean);
  const ri0=stale||(!W&&courses.length)?0:F.rot[t]||0; let sp=null,nextRot=null; for(let i=0;i<rot.length&&!sp;i++){ const p=rot[(ri0+i)%rot.length]; if(flRested(p,d)&&(p.fat||0)<70){ sp=p; nextRot=(ri0+i+1)%rot.length; } }
  if(!sp)sp=P.filter(p=>flRested(p,d)&&(p.fat||0)<70).sort((a,b)=>spV(b)-spV(a))[0]||null; if(!sp)sp=flTemp(t,true);
  const pen=P.filter(p=>p!==sp&&!rot.includes(p)&&(p.fat||0)<80).sort((a,b)=>penV(b)-penV(a)).slice(0,8); if(pen.length<2)pen.push(...rot.filter(p=>p!==sp&&(p.fat||0)<80&&flRested(p,d)).slice(0,2)); while(pen.length<4)pen.push(flTemp(t,true));
  const bench=B.filter(p=>!start.includes(p));
  const s={tid:t,rot:null,nextRot,order,posOf,bench,out:[],defv:teamDefV(ln),spAll:rot,short:false,pen,pitchPool:new Set([...P,...pen,sp].map(p=>p.id)),used:new Set([sp.id]),cur:sp,sp,curIsSP:true,idx:0,box:new Map(),pitchers:[sp.id],entry:{},exit:{},farm:true};
  s.start=order.map((p,o)=>({id:p.id,n:p.name,o,pos:posOf[p.id]})); s.changes=[]; s.box.set(sp.id,pz()); order.forEach(p=>s.box.set(p.id,bz())); sideTraits(s); return s; }
/* 경기 결과를 선수 퓨처스 기록·피로·부상·재활에 반영(applyGame의 2군판) */
function applyFarm(d,g){ const y=G.year;
  for(const k of ['h','a']){ const s=g.S[k];
    for(const [id,x] of s.box){ const p=G.players[id]; if(!p||p.flTemp)continue; const t=p.team; if(t==null)continue; const mil=milServing(p)&&milPeriod(p).unit==='상무'; if(mil){ const from=milPeriod(p).from; if(!p.flSmUse||p.flSmUse.y!==y||p.flSmUse.from!==from)p.flSmUse={y,from,g:0}; p.flSmUse.g++; }
      if(p.isP){ const sp=id===s.sp.id; const o={g:1,gs:sp?1:0,outs:x.outs,h:x.h,hr:x.hr,bb:x.bb,hbp:x.hbp||0,so:x.so,er:x.er,r:x.r||0,w:g.dec.w===id?1:0,l:g.dec.l===id?1:0,sv:g.dec.sv===id?1:0,hld:(g.dec.hld||[]).includes(id)?1:0,bf:x.bf||0};
        addTo(lineFor(p,y,t,'퓨처스'),o); injRecover(p,x.outs); const cd=pitchApp(p,d,x.pc||0,sp); p.fat=clamp((p.fat||0)+pitFatGain(p,x.pc||0,sp),0,100);
        if(!(p.injOut>0)&&R()<p.inj*(sp?.075*(x.pc||0)/95:.026*(x.pc||0)/17)*injMult(p)*loadMult(p,cd,d)/LOAD_NORM)injure(p,d,{sp,pc:x.pc||0,farm:1}); }
      else { const h=lineFor(p,y,t,'퓨처스'); addTo(h,Object.assign({g:1},x)); const pos=s.posOf[id]||null; futUse(p,pos,1,{mil,days:[d]}); { const u=p.fuse; const top=Object.entries(u.pos).sort((a,b)=>b[1]-a[1])[0]; h.pos=top?top[0]:(pos||p.pos); }
        const inLn=flFarmBatterUse(p,s,id,pos,d,x);
        if(p.injFx)injRecover(p,x.pa??((x.ab||0)+(x.bb||0))); if(R()<p.inj*.026*injMult(p)*(inLn?1:.3))injure(p,d,{farm:1,hbp:x.hbp||0}); } } } }
function flRecord(F,d,h,a,g,round=F.round-1){ const hs=g.score.h, as=g.score.a; const R0=F.rec; const add=(t,w,l,tt,rs,ra)=>{ const r=R0[t]||(R0[t]={w:0,l:0,d:0,rs:0,ra:0}); r.w+=w; r.l+=l; r.d+=tt; r.rs+=rs; r.ra+=ra; };
  if(hs>as){ add(h,1,0,0,hs,as); add(a,0,1,0,as,hs); } else if(as>hs){ add(a,1,0,0,as,hs); add(h,0,1,0,hs,as); } else { add(h,0,0,1,hs,as); add(a,0,0,1,as,hs); }
  const nm=id=>(G.players[id]||{}).name||''; const x={d,h,a,r:round,hs,as,inn:g.inn,w:g.dec.w??null,l:g.dec.l??null,sv:g.dec.sv??null,hr:[]};
  for(const k of ['h','a'])for(const [id,b] of g.S[k].box)if(!G.players[id]?.isP&&!G.players[id]?.flTemp&&b.hr)x.hr.push([id,b.hr,k]);
  const mine=h===G.user||a===G.user; if(mine){ const S=k=>{ const s=g.S[k]; return {sp:s.sp.id,bat:[...(s.start||[]).map(p=>p.id),...s.order.map(p=>p.id),...(s.out||[]).map(p=>p.id),...s.bench.filter(p=>s.box.has(p.id)).map(p=>p.id)].filter((v,i,A)=>A.indexOf(v)===i&&s.box.has(v)).map(id=>{ const b=s.box.get(id)||bz(); return [id,s.posOf[id]||'',b.ab,b.r,b.h,b.rbi,b.hr,b.bb,b.so,(G.players[id]||{}).name||'']; }),pit:s.pitchers.map(id=>{ const b=s.box.get(id)||pz(); return [id,b.outs,b.h,b.r,b.er,b.bb,b.so,b.pc||0,(G.players[id]||{}).name||'']; }),line:g.line[k]}; }; x.box={h:S('h'),a:S('a')}; }
  F.games.push(x); { let n=0; for(let i=F.games.length-1;i>=0;i--){ const q=F.games[i]; if(q.box){ n++; if(n>40)delete q.box; } } } void nm; }
/* 하루치 퓨처스 경기 */
function flFarmUndo(F,h,a,g){ const back=boxSnap(g), games=F.games, len=games.length, boxes=games.filter(x=>x.box).map(x=>[x,x.box]), rec=[h,a].map(t=>[t,F.rec[t],F.rec[t]?{...F.rec[t]}:null]);
  return ()=>{back();games.length=len;F.games=games;for(const [x,b]of boxes)x.box=b;for(const[t,r,v]of rec){if(!v){delete F.rec[t];continue;}F.rec[t]=r;for(const k of Object.keys(r))if(!Object.hasOwn(v,k))delete r[k];Object.assign(r,v);} }; }
/* 당일 컨디션(gc)도 시뮬레이션 중 갱신된다. 선수 사본은 경기 편성 전에 잡는다. */
function flBeforeGame(F,h,a,d){ const side=t=>({tid:t,box:new Map((t===FL_SM?Object.values(G.players).filter(p=>p.team!=null&&milOn(p,d)&&milPeriod(p).unit==='상무'):playersOf(t)).map(p=>[p.id,0]))}); return flFarmUndo(F,h,a,{S:{h:side(h),a:side(a)}}); }
function flPlayDay(d){ if(!flLive()||!flOpenOn(d))return; const F=flInit(); if(F.playedDays[d])return 0;
  let D=F.byDay[d]; if(!D){const r=F.round;D=F.byDay[d]={r,P:flPairsR(F,r),done:{}};F.round=r+1;} let n=0;
  if(D.P.some(p=>p.includes(FL_SM)&&!D.done[p[0]+':'+p[1]]))flEnsureSM(d);
  for(const[h,a]of D.P){const key=h+':'+a;if(D.done[key])continue;let sh=null,sa=null,committed=false;const nid=G.nextId,back=flBeforeGame(F,h,a,d);FL_TMP=[];
    try{sh=flSide(h,d);sa=flSide(a,d);if(!sh||!sa){back();(G.flSkip=G.flSkip||{})[sh?a:h]=((G.flSkip||{})[sh?a:h]||0)+1;D.done[key]='skip';continue;}
      const g=simGame(d,h,a,false,{sides:{h:sh,a:sa},pitchRecords:false});applyFarm(d,g);flRecord(F,d,h,a,g,D.r);
      if(sh.nextRot!=null)F.rot[h]=sh.nextRot;if(sa.nextRot!=null)F.rot[a]=sa.nextRot;D.done[key]='played';committed=true;n++;
    }catch(e){if(back)back();(G.flErr=(G.flErr||[]).slice(-9)).push(String(e&&e.message).slice(0,80));}
    finally{for(const id of FL_TMP)delete G.players[id];FL_TMP=[];if(!committed)G.nextId=nid;}}
  if(D.P.every(([h,a])=>D.done[h+':'+a]))F.playedDays[d]=1;return n; }
/* 순위: 리그별 승률(무승부 제외) */
function flStand(div){ const F=G.fl; if(!F)return []; return (F.div[div]||[]).map(t=>({...(F.rec[t]||{w:0,l:0,d:0,rs:0,ra:0}),t})).map(r=>({...r,pct:r.w+r.l?r.w/(r.w+r.l):0})).sort((a,b)=>b.pct-a.pct||(b.rs-b.ra)-(a.rs-a.ra)); }
