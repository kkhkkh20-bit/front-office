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
function flInit(){ const y=G.year; if(G.fl&&G.fl.y===y)return G.fl;
  const ids=G.teams.map(t=>t.id); const N=ids.filter(id=>FL_NORTH_REG.has(team(id).region)), S=ids.filter(id=>!FL_NORTH_REG.has(team(id).region)).concat([FL_SM]);
  const rec={}; for(const t of flTeams())rec[t]={w:0,l:0,d:0,rs:0,ra:0};
  G.fl={y,div:{N,S},rec,games:[],rot:{},round:0}; try{ flSeedSM(); }catch(e){ console.error(e); } return G.fl; }
/* 상무 선수단이 모자라면(새 게임 첫해 등) AI 구단 2군의 군 미필 21~26세를 상무에 입대시켜 채운다. 우리 구단 선수는 건드리지 않는다.
   입대일을 지난 1년 사이로 흩어 전역도 나눠서 한다(복무 1년 6개월) */
function flSeedSM(){ const sv=Object.values(G.players).filter(p=>p.team!=null&&milServing(p)&&milPeriod(p).unit==='상무'); let nb=sv.filter(p=>!p.isP).length, np=sv.filter(p=>p.isP).length; if(nb>=13&&np>=10)return 0;
  const per={}; const C=Object.values(G.players).filter(p=>p.team!=null&&p.team!==G.user&&!p.foreign&&!p.prospect&&!p.e1&&!p.ys&&p.age>=21&&p.age<=26&&milFree(p)&&!(p.mil&&p.mil.app)&&healthy(p)).sort((a,b)=>ovr(b)-ovr(a)); let n=0;
  for(const p of C){ if(nb>=13&&np>=10)break; if(p.isP?np>=10:nb>=13)continue; if((per[p.team]||0)>=3)continue; per[p.team]=(per[p.team]||0)+1;
    enlist(p,'상무',G.day-ri(0,300)); try{ story(p,`${G.year} 상무 입대`,'mil'); }catch(e){} if(p.isP)np++; else nb++; n++; }
  return n; }
function flDay(d){ const w=dobj(d).w; return w!==1&&w!==5; } /* 월·금 휴식 */
/* 원 돌리기(circle method) 대진: 홀수면 '쉼'을 넣는다 */
function flRR(L,r){ const a=L.slice(); if(a.length%2)a.push(null); const n=a.length, fix=a[0], rest=a.slice(1); const k=r%(n-1); const rot=rest.slice(k).concat(rest.slice(0,k)); const A=[fix,...rot]; const P=[]; for(let i=0;i<n/2;i++){ const x=A[i], y=A[n-1-i]; if(x!=null&&y!=null)P.push((r+i)%2?[x,y]:[y,x]); } return P; }
function flPairs(F){ return flPairsR(F,F.round++); }
/* 대진은 라운드 번호만으로 정해진다(난수 없음): 앞날의 우리 2군 경기도 미리 알 수 있다 */
function flPairsR(F,r){ const all=flTeams(); const cyc=all.length+5, i=r%cyc; let P;
  if(i<all.length)P=flRR(all,Math.floor(r/cyc)*3+i); else { const j=i-all.length; P=flRR(F.div.N,j).concat(flRR(F.div.S,j)); }
  return P.map(([h,a])=>h===FL_SM?[a,h]:[h,a]); } /* 상무는 원정 */
/* 그날 퓨처스 경기가 열리는 날인지(flPlayDay와 같은 조건) */
function flOpenOn(d){ const c=G.cal; return G.flOn!==false&&!!c&&d>=c.open&&d<=c.end&&flDay(d)&&!!(c.sched&&c.sched[d]); }
/* 앞날 그 구단 2군 경기: {op,home} 또는 null. 오늘까지 치른 라운드에서 열리는 날만큼 센다(우천·인원 부족 취소는 당일에 확인) */
function flGameOn(tid,d){ d=+d; if(!flOpenOn(d)||d<=G.day)return null; const y=dobj(d).y; const F0=G.fl&&G.fl.y===y?G.fl:null; let F=F0;
  if(!F){ const ids=G.teams.map(t=>t.id); F={div:{N:ids.filter(id=>FL_NORTH_REG.has(team(id).region)),S:ids.filter(id=>!FL_NORTH_REG.has(team(id).region)).concat([FL_SM])},round:0}; }
  let r=F.round; for(let i=F0?G.day+1:G.cal.open;i<d;i++)if(flOpenOn(i))r++;
  const m=flPairsR(F,r).find(x=>x[0]===tid||x[1]===tid); return m?{op:m[0]===tid?m[1]:m[0],home:m[0]===tid}:null; }
/* 오늘 치른 우리 2군 경기(박스스코어 포함) */
function flOurGame(d){ const F=G.fl; if(!F||F.y!==dobj(d).y)return null; for(let i=F.games.length-1;i>=0;i--){ const x=F.games[i]; if(x.d===d&&(x.h===G.user||x.a===G.user)&&x.box)return x; if(x.d<d)break; } return null; }
/* 그날 나갈 수 있는 2군 선수 */
function flPool(t,d){
  if(t===FL_SM){ const L=Object.values(G.players).filter(p=>p.team!=null&&milServing(p)&&milPeriod(p).unit==='상무'&&healthy(p)&&!(p.ntAway>d&&p.ntFrom<=d)); return {B:L.filter(p=>!p.isP),P:L.filter(p=>p.isP)}; }
  const dd=depth(t); const ok=p=>healthy(p)&&!futUpToday(p)&&futEligibleDay(p,t,d); return {B:dd.futB.filter(ok),P:dd.futP.filter(ok)}; }
function flRested(p,d){ const L=p.ld||[]; const last=L.length?L[L.length-1][0]:null; return last==null||d-last>=(isSPr(p)?5:1); }
/* 임시 육성 선수: 2군 인원이 모자란 날 그 경기에만 채운다(실제 KBO 구단은 정식 65명+육성 선수라 2군이 늘 9명 이상, 이 게임은 정원이 작다).
   경기 동안만 선수 명단에 두고 끝나면 지운다. 기록·피로·부상에 남지 않고, 박스스코어에는 '육성 선수'로 남는다 */
let FL_TMP=[];
function flTemp(t,isP,pos){ const p=newPlayer({isP,pos,age:ri(19,23)}); for(const k in p.r)if(typeof p.r[k]==="number")p.r[k]=clamp(Math.round(N(44,4)),36,52); /* 2군 하위권 수준 */ p.team=t===FL_SM?null:t; p.flTemp=1; p.name='육성 '+p.name; FL_TMP.push(p.id); return p; }
function flSide(t,d){ const F=G.fl, {B,P}=flPool(t,d); if(B.length<6||P.length<2)return null; /* 그래도 너무 적으면(6명·2명 미만) 경기 취소 */
  const W=t!==FL_SM&&G.futLn&&G.futLn[t]; let ln=null;
  if(W&&W.ln){ const L={}; let ok=true; for(const k in W.ln){ const p=B.find(q=>q.id===W.ln[k]); if(!p){ ok=false; break; } L[k]=p; } if(ok&&Object.keys(L).length>=9)ln=L; } /* 2군 감독의 주간 라인업 그대로 */
  if(!ln&&t===FL_SM&&B.length>10){ const gp=q=>(seasonTotal(q,G.year,'퓨처스')||{}).g||0; const S=B.slice().sort((x,y)=>gp(y)-gp(x)); const rest=new Set(S.slice(0,B.length-10)); const B2=B.filter(q=>!rest.has(q)); if(B2.length>=9)ln=futLineupE(t,B2); } /* 상무: 복무 선수가 고르게 뛰도록 많이 뛴 선수부터 번갈아 쉰다 */
  if(!ln)ln=futLineupE(t,B);
  if(t===FL_SM){ const gp=q=>(seasonTotal(q,G.year,'퓨처스')||{}).g||0; const inL=new Set(Object.values(ln)); const low=B.filter(q=>!inL.has(q)).sort((x,y)=>gp(x)-gp(y))[0]; const lo=Object.values(ln).reduce((m,q)=>Math.min(m,gp(q)),1e9);
    if(low&&gp(low)<=lo-3){ ln.DH=low; } } /* 상무: 오래 못 뛴 선수는 지명타자로라도 내보낸다 */
  for(const k of FGPOS)if(!ln[k])ln[k]=flTemp(t,false,k==='DH'?'1B':k); /* 빈 자리는 임시 육성 선수 */
  const posOf={}; for(const k in ln)posOf[ln[k].id]=k; const start=Object.values(ln); const order=orderList(ORDER.filter(k=>ln[k]).map(k=>ln[k]),t===FL_SM?null:t);
  const rotIds=(W&&W.rot)||P.slice().sort((a,b)=>spV(b)-spV(a)).slice(0,5).map(p=>p.id); const rot=rotIds.map(id=>P.find(p=>p.id===id)).filter(Boolean);
  const ri0=F.rot[t]||0; let sp=null; for(let i=0;i<rot.length&&!sp;i++){ const p=rot[(ri0+i)%rot.length]; if(flRested(p,d)&&(p.fat||0)<70){ sp=p; F.rot[t]=(ri0+i+1)%rot.length; } }
  if(!sp)sp=P.filter(p=>flRested(p,d)).sort((a,b)=>spV(b)-spV(a))[0]||null; if(!sp)sp=flTemp(t,true);
  const pen=P.filter(p=>p!==sp&&!rot.includes(p)&&(p.fat||0)<80).sort((a,b)=>penV(b)-penV(a)).slice(0,8); if(pen.length<2)pen.push(...rot.filter(p=>p!==sp&&flRested(p,d)).slice(0,2)); while(pen.length<4)pen.push(flTemp(t,true));
  const bench=B.filter(p=>!start.includes(p));
  const s={tid:t,rot:null,order,posOf,bench,out:[],defv:teamDefV(ln),spAll:rot,short:false,pen,used:new Set([sp.id]),cur:sp,sp,curIsSP:true,idx:0,box:new Map(),pitchers:[sp.id],entry:{},exit:{},farm:true};
  s.start=order.map((p,o)=>({id:p.id,n:p.name,o,pos:posOf[p.id]})); s.changes=[]; s.box.set(sp.id,pz()); order.forEach(p=>s.box.set(p.id,bz())); sideTraits(s); return s; }
/* 경기 결과를 선수 퓨처스 기록·피로·부상·재활에 반영(applyGame의 2군판) */
function applyFarm(d,g){ const y=G.year;
  for(const k of ['h','a']){ const s=g.S[k];
    for(const [id,x] of s.box){ const p=G.players[id]; if(!p||p.flTemp)continue; const t=p.team; if(t==null)continue; const mil=milServing(p)&&milPeriod(p).unit==='상무';
      if(p.isP){ const sp=id===s.sp.id; const o={g:1,gs:sp?1:0,outs:x.outs,h:x.h,hr:x.hr,bb:x.bb,hbp:x.hbp||0,so:x.so,er:x.er,r:x.r||0,w:g.dec.w===id?1:0,l:g.dec.l===id?1:0,sv:g.dec.sv===id?1:0,hld:(g.dec.hld||[]).includes(id)?1:0,bf:x.bf||0};
        addTo(lineFor(p,y,t,'퓨처스'),o); injRecover(p,x.outs); const cd=pitchApp(p,d,x.pc||0,sp); p.fat=clamp((p.fat||0)+pitFatGain(p,x.pc||0,sp),0,100);
        if(!(p.injOut>0)&&R()<p.inj*(sp?.075*(x.pc||0)/95:.026*(x.pc||0)/17)*injMult(p)*loadMult(p,cd,d)/LOAD_NORM)injure(p,d,{sp,pc:x.pc||0,farm:1}); }
      else { const h=lineFor(p,y,t,'퓨처스'); addTo(h,Object.assign({g:1},x)); const pos=s.posOf[id]||null; futUse(p,pos,1,{mil,days:[d]}); { const u=p.fuse; const top=Object.entries(u.pos).sort((a,b)=>b[1]-a[1])[0]; h.pos=top?top[0]:(pos||p.pos); }
        const inLn=s.order.some(q=>q.id===id); if(inLn)p.fat=clamp((p.fat||0)+((pos==='C'?12:pos==='DH'?4:8)-(p.r.vit||52)*.04),0,100);
        if(p.injFx)injRecover(p,x.pa??((x.ab||0)+(x.bb||0))); if(R()<p.inj*.026*injMult(p)*(inLn?1:.3))injure(p,d,{farm:1}); } } } }
function flRecord(F,d,h,a,g){ const hs=g.score.h, as=g.score.a; const R0=F.rec; const add=(t,w,l,tt,rs,ra)=>{ const r=R0[t]||(R0[t]={w:0,l:0,d:0,rs:0,ra:0}); r.w+=w; r.l+=l; r.d+=tt; r.rs+=rs; r.ra+=ra; };
  if(hs>as){ add(h,1,0,0,hs,as); add(a,0,1,0,as,hs); } else if(as>hs){ add(a,1,0,0,as,hs); add(h,0,1,0,hs,as); } else { add(h,0,0,1,hs,as); add(a,0,0,1,as,hs); }
  const nm=id=>(G.players[id]||{}).name||''; const x={d,h,a,hs,as,inn:g.inn,w:g.dec.w??null,l:g.dec.l??null,sv:g.dec.sv??null,hr:[]};
  for(const k of ['h','a'])for(const [id,b] of g.S[k].box)if(!G.players[id]?.isP&&!G.players[id]?.flTemp&&b.hr)x.hr.push([id,b.hr,k]);
  const mine=h===G.user||a===G.user; if(mine){ const S=k=>{ const s=g.S[k]; return {sp:s.sp.id,bat:s.order.map(p=>p.id).concat(s.bench.filter(p=>s.box.has(p.id)).map(p=>p.id)).filter((v,i,A)=>A.indexOf(v)===i).map(id=>{ const b=s.box.get(id)||bz(); return [id,s.posOf[id]||'',b.ab,b.r,b.h,b.rbi,b.hr,b.bb,b.so,(G.players[id]||{}).name||'']; }),pit:s.pitchers.map(id=>{ const b=s.box.get(id)||pz(); return [id,b.outs,b.h,b.r,b.er,b.bb,b.so,b.pc||0,(G.players[id]||{}).name||'']; }),line:g.line[k]}; }; x.box={h:S('h'),a:S('a')}; }
  F.games.push(x); { let n=0; for(let i=F.games.length-1;i>=0;i--){ const q=F.games[i]; if(q.box){ n++; if(n>40)delete q.box; } } } void nm; }
/* 하루치 퓨처스 경기 */
function flPlayDay(d){ if(!flLive()||!flDay(d)||!G.cal.sched[d])return; const F=flInit(); const P=flPairs(F); let n=0;
  for(const [h,a] of P){ let sh=null, sa=null; FL_TMP=[]; try{ sh=flSide(h,d); sa=flSide(a,d); }catch(e){ for(const id of FL_TMP)delete G.players[id]; FL_TMP=[]; (G.flErr=(G.flErr||[]).slice(-9)).push(String(e&&e.message).slice(0,80)); continue; } if(!sh||!sa){ for(const id of FL_TMP)delete G.players[id]; FL_TMP=[]; (G.flSkip=G.flSkip||{})[sh?a:h]=((G.flSkip||{})[sh?a:h]||0)+1; continue; }
    let g=null; try{ g=simGame(d,h,a,false,{sides:{h:sh,a:sa},pitchRecords:false}); }catch(e){ (G.flErr=(G.flErr||[]).slice(-9)).push(String(e&&e.message).slice(0,80)); }
    if(g){ try{ applyFarm(d,g); }catch(e){ console.error(e); } try{ flRecord(F,d,h,a,g); n++; }catch(e){ console.error(e); } }
    for(const id of FL_TMP)delete G.players[id]; FL_TMP=[]; }
  return n; }
/* 순위: 리그별 승률(무승부 제외) */
function flStand(div){ const F=G.fl; if(!F)return []; return (F.div[div]||[]).map(t=>({...(F.rec[t]||{w:0,l:0,d:0,rs:0,ra:0}),t})).map(r=>({...r,pct:r.w+r.l?r.w/(r.w+r.l):0})).sort((a,b)=>b.pct-a.pct||(b.rs-b.ra)-(a.rs-a.ra)); }
