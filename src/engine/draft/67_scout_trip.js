/* ===== 스카우트 2단계: 대회 출장 배정 (2026-11-17) =====
   아마추어 스카우트는 '대회'로 출장한다(s.trip={k,from,to,man}). k: 권역 주말리그 조(wl:조), 대학 U-리그 조(ul:조), 전국대회(t0~t4), 대학선수권(ct),
   학교 방문(sch, 기본), 겨울 전지훈련(camp, 12~2월 학교 방문 두 배).
   - 관찰은 출장한 대회 경기에 나온 선수에게만 쌓인다. 한 스카우트가 하루 경기 세 개까지 본다(관심 선수가 많이 나오는 경기 먼저).
     관심 선수는 한 경기 1회(+집중 0.5·보통 0.25), 그 밖의 선수는 0.35회. 같은 선수를 우리 스카우트 둘이 보면 두 번째 의견이 생긴다(오차 0.9배).
   - 출장이 없는 주(학교 방문·전지훈련)에만 학교 방문(obsVisitWeek)을 한다.
   - 매주 월요일 스카우트팀장이 앞으로 4주 출장 안을 낸다. 팀장 맡기기(기본 켬)면 그대로 보낸다(메일 없음). 끄면 출장 안 메일 한 통([그대로]·[팀장에게 맡기기]·[바꾸기]).
     설정 › 권한의 '스카우트 배치'(G.scoutAuto)를 맡기면 출장도 팀장이 정한다(G.tripAuto와 무관). 출장 안은 해시(u01)만 써서 맡기든 말든 R() 소비는 같다(사용자 11-17).
   - 다른 구단도 같은 함수로 같은 출장 안을 만들어 그대로 보낸다(같은 관찰 함수).
   - 우리 구단은 일요일마다 '현장 보고' 한 통(그 주에 본 경기·눈에 띈 선수 3명·집중 선수 소식, 출장이 있던 주만).
   - 옛 저장: 출장 기록이 없으면 처음 맞는 날 바로 출장 안을 만든다(그 주부터 적용) */
const TRIP_OTHER=.35, TRIP_PB=[0,.25,.5], TRIP_GAMES=3, TRIP_TWO=.9;
const tripAutoOn=()=>!!G.scoutAuto||G.tripAuto!==false; /* 기본 켬. 설정 › 권한의 '스카우트 배치'를 팀장에게 맡겼으면 출장도 늘 팀장이 정한다(사용자 11-17: 배치를 맡겼는데 출장 결정 메일이 계속 왔다 — 출장 따로 끈 G.tripAuto=false가 남아 있었다) */
const tripWk0=d=>d-((dobj(d).w+6)%7); /* 그 주 월요일 */
function amGroupReg(g){ return /서울|경기·강원/.test(g)?'수도권':/충청|호남/.test(g)?'호남·충청':/경상/.test(g)?'영남':null; }
/* 그 주에 열리는 대회(출장 후보) */
function tripOptions(w0,reg){ const y=dobj(w0).y, m=dobj(w0).m, w1=w0+6, out=[]; const S=G.amL&&G.amL.y===y?G.amL:null;
  const win=m===12||m<=2; out.push({k:win?'camp':'sch',n:win?'동계 전지훈련(학교 방문 두 배)':'학교 방문',days:0});
  for(const t of AM_TOURS().concat([AM_COLT])){ const [a,b]=amTourSpan(y,t); const T=S&&S.tour[t.k]; if(b<w0||a>w1||(T&&T.ch))continue; const n=Math.min(b,w1)-Math.max(a,w0)+1; out.push({k:t.k,n:t.n,days:n,nat:1}); }
  const lgD=S&&S.lgD?S.lgD:amLeagueDays(y,false), clD=S&&S.clD?S.clD:amLeagueDays(y,true);
  const nL=lgD.filter(d=>d>=w0&&d<=w1).length, nC=clD.filter(d=>d>=w0&&d<=w1).length;
  if(nL)for(const [g] of amGroups())if(!reg||amGroupReg(g)===reg)out.push({k:'wl:'+g,n:`주말리그 ${g}조`,days:nL});
  if(nC)for(const [g] of amColGroups())out.push({k:'ul:'+g,n:`대학 ${g}`,days:nC});
  return out; }
const tripName=k=>!k||k==='sch'?'학교 방문':k==='camp'?'동계 전지훈련':k.startsWith('wl:')?`주말리그 ${k.slice(3)}조`:k.startsWith('ul:')?`대학 ${k.slice(3)}`:amSpName(k);
/* 출장 대회에 나오는 학교: 대회는 아직 남은 학교, 리그는 조 학교 */
function tripSchools(k,y){ const S=G.amL&&G.amL.y===y?G.amL:null; if(k.startsWith('wl:'))return ((amGroups().find(x=>x[0]===k.slice(3))||[])[1])||[]; if(k.startsWith('ul:'))return ((amColGroups().find(x=>x[0]===k.slice(3))||[])[1])||[];
  const T=S&&S.tour[k]; if(T)return T.cur.filter(Boolean); return k==='ct'?AREA.flatMap(a=>a.un):AREA.flatMap(a=>a.hs); }
/* 출장 안: 그 주 대회마다 관심 선수 무게(집중 1.5·보통 1·참고 0.5) × 경기 날 수, 다른 스카우트와 겹치면 0.4배 */
function tripPlanWeek(tid,w0,by){ by=by||obsBySchool(); const scs=clubAmScouts(tid); const F=obsFollowSet(tid), P=obsPriL(tid), y=dobj(w0).y; const out={}; const taken={};
  const val=k=>{ let v=0, b=0; for(const n of tripSchools(k,y))for(const x of by[n]||[]){ if(F.has(x.id))v+=OBS_W[P[x.id]??1]; else b+=x.prospect?.08:.02; } return v+Math.min(1.2,b); }; /* 관심 밖 선수는 하루 세 경기만 보니 무게에 상한 */
  for(const s of [...scs].sort((a,b)=>(b.skill||0)-(a.skill||0))){ const O=tripOptions(w0,s.region); let best=O[0], bs=.6; /* 학교 방문 기본 가치 */
    for(const o of O){ if(!o.days)continue; const v=val(o.k)*Math.min(1,o.days/2)*(taken[o.k]?.25:1)+(o.nat?.3:0)+(o.k.startsWith('wl:')&&amGroupReg(o.k.slice(3))===s.region?.3:0)+u01('trp'+w0+':'+tid+':'+s.id,o.k)*.2; if(v>bs){ bs=v; best=o; } }
    out[s.id]=best.k; if(best.days)taken[best.k]=1; }
  return out; }
function tripPlan4(tid,d){ const w0=tripWk0(d??G.day), by=obsBySchool(); return [0,1,2,3].map(i=>({w0:w0+i*7,P:tripPlanWeek(tid,w0+i*7,by)})); }
function tripApply(tid,P,w0){ for(const s of clubAmScouts(tid)){ if(s.trip&&s.trip.man&&s.trip.from>=w0&&tid===G.user)continue; s.trip={k:P[s.id]||'sch',from:w0,to:w0+6}; } }
const tripOf=s=>s&&s.trip&&s.trip.to>=G.day&&s.trip.from<=G.day?s.trip.k:'sch';
/* 매주 월요일(모든 구단). 우리 구단은 팀장 맡기기면 그대로, 아니면 출장 안 메일 */
function tripWeekly(day,force){ const w0=tripWk0(day); for(const t of G.teams||[]){ const tid=t.id; if(tid===G.user&&G.unemp)continue; if(!clubAmScouts(tid).length)continue; const P=tripPlanWeek(tid,w0);
    if(tid!==G.user||tripAutoOn()){ tripApply(tid,P,w0); continue; }
    G.tripSeq=(G.tripSeq||0)+1; G.tripPend={tid,w0,id:G.tripSeq,P}; const key=tripPendKey(G.tripPend); const sc=clubAmScouts(tid); const now=sc.filter(s=>tripOf(s)!==P[s.id]); /* 안마다 구단·주·번호를 붙여 메일 버튼이 그 안만 보내게 한다(리뷰② 11-17: 지난주 메일이 이번 주 다른 안을 보냈다) */
    if(!force&&now.length)mail('스카우트팀',`다음 주 출장 안: ${now.length}명 바꿈`,sc.map(s=>`${s.name}: ${tripName(tripOf(s))} → ${tripName(P[s.id])}`).join('\n')+'\n\n그대로 두면 지금 출장을 이어 갑니다.',{kind:'스카우트',acts:[{l:'그대로',a:'tripPlanGo',v:key},{l:'팀장에게 맡기기',a:'handOff',v:'scout'},{l:'바꾸기',a:'go',v:'staff:scouts'}]}); } } /* 팀장에게 맡기기: 권한 화면의 '스카우트 배치'(G.scoutAuto)를 켠다 — 배치와 출장을 함께 맡김(사용자 11-17) */
/* 걸린 출장 안의 식별값(구단:주 시작일:번호). 옛 저장의 안은 구단·번호가 없다 */
const tripPendKey=T=>T?`${T.tid??''}:${T.w0}:${T.id??''}`:'';
/* 이 출장 안(key)을 지금 보낼 수 없는 이유('' 이면 보낼 수 있음). key가 없으면 지금 걸린 안. 옛 메일(key=주 시작일)은 주만 맞춘다.
   지난주 안·다른 번호의 안·이전 구단의 안은 보내지 않는다 */
function tripGoWhy(key){ const T=G.tripPend; key=key==null?'':String(key); const [kt,kw,ki]=key.includes(':')?key.split(':'):['',key,''];
  if(G.unemp)return '지금은 구단 업무를 볼 수 없습니다.';
  if(kt!==''&&+kt!==G.user)return '이전 구단의 출장 안입니다.';
  if(!T)return !key?'출장 안이 없습니다.':+kw<tripWk0(G.day)?'지난 출장 안입니다.':'이 출장 안은 이미 처리했습니다.';
  if(T.tid!=null&&T.tid!==G.user)return key?'지난 출장 안입니다.':'출장 안이 없습니다.'; /* 이직 전 구단에서 받은 안이 남은 경우 */
  if(key&&(String(T.w0)!==kw||(ki!==''&&String(T.id??'')!==ki)))return '지난 출장 안입니다. 새 출장 안을 확인하세요.';
  return ''; }
function tripPlanGo(key){ const why=tripGoWhy(key); if(why)return why; const T=G.tripPend; tripApply(G.user,T.P,T.w0); delete G.tripPend; return '팀장 출장 안대로 보냈습니다.'; }
/* 지금 우리 구단에 걸린 출장 안(이전 구단 것은 없음으로 본다) */
const tripPendNow=()=>G.tripPend&&(G.tripPend.tid==null||G.tripPend.tid===G.user)?G.tripPend:null;
function tripSet(sid,k){ const s=(G.scouts||[]).find(x=>String(x.id)===String(sid)); if(!s)return '스카우트가 없습니다.'; const w0=tripWk0(G.day); s.trip={k,from:G.day,to:w0+6,man:true}; return `${s.name} 스카우트를 ${tripName(k)}(으)로 보냅니다. 이번 주 일요일까지입니다.`; }
/* 경기 날: 출장 중인 스카우트가 그 대회 경기를 본다(모든 구단 같은 식) */
function tripWatchDaily(d){ if(!amTodayOk(d)||!_amToday.L.length)return; const games={}; for(const x of _amToday.L){ if(!x.ev)continue; (games[x.ev+'|'+x.gk]=games[x.ev+'|'+x.gk]||{ev:x.ev,L:[]}).L.push(x); }
  const GL=Object.values(games); if(!GL.length)return;
  for(const t of G.teams){ const tid=t.id; if(tid===G.user&&G.unemp)continue; const F=obsFollowSet(tid), P=obsPriL(tid); const seenBy={};
    for(const s of clubAmScouts(tid)){ const k=tripOf(s); if(k==='sch'||k==='camp')continue; const mine=GL.filter(g=>g.ev===k); if(!mine.length)continue;
      const pick=mine.map(g=>({g,v:g.L.reduce((a,x)=>a+(F.has(x.id)?OBS_W[P[x.id]??1]:0),0)+u01('tg'+d+':'+tid+':'+s.id,g.L[0].id)*.1})).sort((a,b)=>b.v-a.v).slice(0,TRIP_GAMES);
      for(const {g} of pick)for(const x of g.L){ const o=x.kind==='e'?amPipe().L[x.id]:G.players[x.id]; if(!o)continue; const f=F.has(x.id); const key=s.id+':'+x.id; if(seenBy[key])continue; seenBy[key]=1;
        obsAdd(o,tid,f?1+TRIP_PB[P[x.id]??1]:TRIP_OTHER); obsByAdd(o,tid,s.id);
        if(tid!==G.user)continue; if(f)try{ obsLogGame(o,x,s.region,d,s.name,tripName(k)); }catch(e){}
        if(f||tripStand(x.b)){ const W=G.tripWk=G.tripWk&&G.tripWk.w0===tripWk0(d)?G.tripWk:{w0:tripWk0(d),L:[]}; if(W.L.length<200)W.L.push([s.name,k,x.id,x.b,x.kind]); } } } }
  try{ _dcc=null; }catch(e){} }
/* 눈에 띈 경기: 투수 7탈삼진 이상·6이닝 무실점, 타자 3안타 이상·홈런 */
function tripStand(b){ b=b||''; const k=/(\d+)탈삼진/.exec(b), h=/(\d+)안타/.exec(b); return !!(k&&+k[1]>=7||/^[6-9](\.\d)?이닝 0실점/.test(b)||h&&+h[1]>=3||/홈런/.test(b)); }
/* 두 번째 의견: 우리(또는 그 구단) 스카우트 둘 이상이 본 선수 */
function obsByAdd(o,tid,sid){ const B=o.obsBy=o.obsBy||{}; const L=B[tid]=B[tid]||[]; if(!L.includes(sid)){ L.push(sid); if(L.length>3)L.shift(); } }
const obsTwo=(o,tid)=>!!(o&&o.obsBy&&(o.obsBy[tid??G.user]||[]).length>=2);
const obsTwoM=(o,tid)=>obsTwo(o,tid)?TRIP_TWO:1;
/* 두 스카우트 의견(우리 화면): 같은 관찰을 각자 눈으로 본 등급 */
function obsOpinions(o){ const L=(o&&o.obsBy&&o.obsBy[G.user]||[]).map(id=>(G.scouts||[]).find(s=>s.id===id)).filter(Boolean).slice(0,2); if(L.length<2)return null;
  const est=o.prospect?(()=>{ const r=scoutReport(o); return {v:r.ofp??r.cur+6,sd:r.sd>=50?SCOUT_SD[0]:r.sd}; })():amEstU(o,G.user);
  return L.map(s=>({s,t:amTierOf(est.v+hn('so'+s.id+G.year,o.id)*Math.max(2,est.sd)*.7)})); }
/* 현장 보고(우리 구단, 일요일, 출장이 있던 주만) */
function tripReport(day){ const W=G.tripWk; if(!W||W.w0!==tripWk0(day)||!W.L.length||G.unemp){ return null; } const by={}; for(const r of W.L)(by[r[0]]=by[r[0]]||{k:r[1],L:[]}).L.push(r);
  const F=obsFollowSet(G.user), P=obsPriL(G.user); const nm=r=>{ const o=r[4]==='e'?amPipe().L[r[2]]:G.players[r[2]]; return o?`${o.n||o.name}(${o.s||o.school||''})`:''; };
  const lines=Object.entries(by).map(([who,v])=>{ const top=[...v.L].sort((a,b)=>(F.has(b[2])?OBS_W[P[b[2]]??1]:0)+tripStand(b[3])-(F.has(a[2])?OBS_W[P[a[2]]??1]:0)-tripStand(a[3])).filter((r,i,A)=>A.findIndex(z=>z[2]===r[2])===i).slice(0,3);
    return `${who} · ${tripName(v.k)}\n${top.map(r=>`  ${nm(r)}: ${r[3]}${F.has(r[2])&&P[r[2]]===2?' (집중)':''}`).join('\n')}`; });
  delete G.tripWk; mail('스카우트팀',`현장 보고 ${dmd(W.w0)}~${dmd(W.w0+6)}`,lines.join('\n\n')+'\n\n본 선수들은 관찰이 쌓여 평가가 정확해졌습니다.',{kind:'스카우트',acts:[{l:'관찰 명단',a:'go',v:'staff:scouts'}]}); return lines.length; }
function tripDaily(day){ if(!G.teams)return; const o=dobj(day); if(G.tripV!==1){ G.tripV=1; try{ tripWeekly(day,true); if(G.tripPend&&!tripAutoOn())tripPlanGo(); }catch(e){ console.error(e); } }
  else if(o.w===1)tripWeekly(day); if(o.w===0)try{ tripReport(day); }catch(e){ console.error(e); } }
