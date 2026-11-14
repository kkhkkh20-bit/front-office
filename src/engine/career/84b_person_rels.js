/* ===== 인물 관계(사용자 11-14: AI 단장도 유저와 같은 조건으로 서로 친해지고, 모든 인물 카드에 좋아하는·싫어하는 인물이 나온다) =====
 한 그래프로 모든 사람 사이의 관계를 둔다: G.rels['키A|키B']={v,why,d}. 키는 정렬해 붙인다.
 - 키는 이직해도 그대로인 사람 키(personNetworkKey: 선수 출신은 pl:원ID, 직원은 staff:ID). 우리 단장은 'me'
 - v: -100~100(숨김). why: [[사유 코드, 연도, 주체(0=앞 키·1=뒤 키, 없으면 생략)]] 최근 3개. d: 마지막으로 바뀐 날
 - 우리 단장과 다른 구단 현 단장 사이 값은 예전부터 쓰던 t.rel(0~100)이 원본이다: v=(t.rel-50)*2로 읽고 그래프에는 사유와 마지막 값만 남긴다.
   우리 구단 감독(m.rel)·코치·스카우트(단장 관계)도 같은 식으로 읽는다
 관계가 생기는 길(우리와 AI가 같다): 식사·안부 연락(쿨다운·자주 만나면 효과 감소는 우리 식사와 같음), 트레이드(성사 +, 시즌 뒤 손해 본 쪽 -),
 선임·재계약(+)·경질·교체(-), 같은 구단에서 함께 일함(+), 감독 아래 출전 기회(+/-), 멘토 지정(+). 해마다 0 쪽으로 돌아간다(gmRelYear와 같은 비율).
 효과는 작게: AI끼리 트레이드 요구치(tradeNeed)가 친분을 따르고 아주 사이가 나쁘면 거래하지 않는다. 감독·코치를 뽑을 때 좋아하는 사람을 조금 더, 싫어하는 사람은 피한다.
 무작위는 relU(날짜·구단으로 고정)만 쓴다: 경기 난수 흐름을 건드리지 않는다 */
const REL_CAP=1600, REL_LIKE=12;
/* 고정 균등 난수 [0,1): u01은 정규 잡음을 눌러 만든 값이라 확률 문턱(p)으로 쓰면 치우친다 */
function relU(a,b){ let h=2166136261>>>0; const s=a+'|'+b; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } h^=h>>>13; h=Math.imul(h,2246822507)>>>0; h=(h^(h>>>16))>>>0; return h/4294967296; }
/* 사유 코드 → 카드에 보일 말. [주체 쪽에서 본 말, 상대 쪽에서 본 말, 좋은 일(1)/나쁜 일(-1)] */
const REL_WHY={col:['같이 일한 사이','같이 일한 사이',1],clan:['감독 사단','감독 사단',1],men:['아끼는 제자','스승',1],hir:['데려온 사람','발탁해 준 은인',1],ren:['믿어 준 사이','믿어 준 사이',1],
  fir:['내보낸 사이','경질당한 악연',-1],let:['내보낸 사이','내쳐진 사이',-1],pla:['아끼던 선수','믿어 준 감독',1],ben:['기회를 못 준 선수','기회를 안 준 감독',-1],
  trd:['거래한 사이','거래한 사이',1],fair:['서로 만족한 트레이드','서로 만족한 트레이드',1],flc:['앙금 남은 트레이드','손해 본 트레이드',-1],
  meal:['자주 식사','자주 식사',1],call:['안부 주고받는 사이','안부 주고받는 사이',1],dec:['초대를 거절한 사이','초대를 거절당한 사이',-1]};
function relsG(){ if(!G.rels||typeof G.rels!=='object')G.rels={}; return G.rels; }
function relPK(a,b){ return a<b?a+'|'+b:b+'|'+a; }
/* 사람 키: 이직·보직 이동에도 그대로 */
function relKeyOf(s,kind){ if(!s)return null; if(s==='me')return 'me'; if(s.interim)return null; try{ return personNetworkKey(s,kind); }catch(e){ return null; } }
function relGmKey(tid){ if(tid==null)return null; if(tid===G.user&&!G.unemp)return 'me'; /* 야인이면 전 구단은 후임 AI 단장 */ const t=team(tid); return t&&t.gm&&!t.gm.interim?relKeyOf(t.gm,'gm'):null; }
/* 우리 단장과의 관계 중 기존 수치가 원본인 것: 다른 구단 현 단장(t.rel), 우리 감독(m.rel), 우리 코치·스카우트(단장 관계) */
const relMine=tid=>tid===G.user&&!G.unemp; /* 지금 우리 단장이 맡은 구단(야인이면 없음) */
function relMeLive(k){ if(!k||k==='me')return null;
  for(const t of G.teams){ if(relMine(t.id)||!t.gm||t.gm.interim)continue; if(relKeyOf(t.gm,'gm')===k)return Math.round(((t.rel??50)-50)*2); }
  if(G.unemp)return null; const m=G.mgr&&G.mgr[G.user]; if(m&&!m.interim&&m.rel!=null&&relKeyOf(m,'mgr')===k)return Math.round((m.rel-50)*2);
  try{ for(const c of Object.values(coachesOf(G.user)))if(c&&relKeyOf(c,'coach')===k)return Math.round((staffRel(c,G.user,'gm')-50)*2);
    for(const s of G.scouts||[])if(relKeyOf(s,'scout')===k)return Math.round((staffRel(s,G.user,'gm')-50)*2); }catch(e){}
  return null; }
function relMeLiveKeys(){ const L=[]; for(const t of G.teams||[])if(!relMine(t.id)&&t.gm&&!t.gm.interim)L.push(relKeyOf(t.gm,'gm')); if(!G.unemp){ const m=G.mgr&&G.mgr[G.user]; if(m&&!m.interim)L.push(relKeyOf(m,'mgr')); for(const c of Object.values(coachesOf(G.user)))if(c)L.push(relKeyOf(c,'coach')); for(const s of G.scouts||[])L.push(relKeyOf(s,'scout')); } return L.filter(Boolean); }
function relVal(a,b){ if(!a||!b||a===b)return 0; if(a==='me'||b==='me'){ const x=relMeLive(a==='me'?b:a); if(x!=null)return x; } const e=relsG()[relPK(a,b)]; return e?e.v:0; }
/* 가까울수록(나쁠수록) 같은 일로 덜 움직인다: v>20부터 줄어 v=80에서 1/4(우리 식사·연락의 gmRelDim과 같은 꼴, v=(t.rel-50)*2) */
function relDim(v,dv){ const same=dv>0?v>20:v<-20; return same?Math.max(.25,1-(Math.abs(v)-20)/80):1; }
/* 관계 더하기. 이미 가까우면(또는 이미 나쁘면) 같은 일로 덜 움직인다(gmRelDim과 같은 꼴). subj: 사유의 주체 키(경질한 사람·데려온 사람·스승·이긴 쪽) */
function relAdd(a,b,dv,code,subj,noDim){ if(!a||!b||a===b||!Number.isFinite(dv))return null; const R0=relsG(), k=relPK(a,b); let e=R0[k]; if(!e){ if(!dv&&!code)return null; e=R0[k]={v:0,why:[],d:G.day}; }
  const dim=noDim?1:relDim(e.v,dv); e.v=clamp(Math.round((e.v+dv*dim)*10)/10,-100,100); e.d=G.day;
  if(code){ const w=[code,G.year]; if(subj!=null&&subj!==''){ const s=subj===(a<b?a:b)?0:subj===(a<b?b:a)?1:null; if(s!=null)w.push(s); } e.why=[w,...(e.why||[]).filter(x=>x[0]!==code)].slice(0,3); }
  return e; }
/* 우리 단장 쪽: 값은 기존 수치가 원본이고 그래프에는 사유와 마지막 값만 */
function relNoteMe(k,code,subj){ if(!k)return; const e=relAdd('me',k,0,code,subj); if(e){ const x=relMeLive(k); if(x!=null)e.v=x; } }
function relSyncMe(){ const R0=relsG(); for(const t of G.teams){ if(relMine(t.id)||!t.gm||t.gm.interim)continue; const k=relKeyOf(t.gm,'gm'); if(!k)continue; const pk=relPK('me',k), v=Math.round(((t.rel??50)-50)*2); if(R0[pk])R0[pk].v=v; else if(Math.abs(v)>=10)R0[pk]={v,why:[],d:G.day}; } }

/* ----- 식사·안부 연락: 우리 식사·연락(gmContact)과 같은 식. 쿨다운(식사 30일·연락 14일)·크기·성향(상대 단장)·가까울수록 덜 오름(gmRelDim)·반올림까지 같다 ----- */
const relTraitMul=g=>g&&g.trait==='loyal'?1.5:g&&g.trait==='hard'?.6:1;
/* 우리 연락·식사와 같은 상한(gmTalkRel, t.rel 60 = v 20) */
function relTalkCap(e0,d){ const v=e0?e0.v:0, cap=(GM_TALK_CAP-50)*2; return d<=0?d:v>=cap?0:Math.min(d,cap-v); }
function relMeet(t,o,kind){ const a=relKeyOf(t.gm,'gm'), b=relKeyOf(o.gm,'gm'); if(!a||!b)return 0; const R0=relsG(), pk=relPK(a,b); const e0=R0[pk]; const dim=relDim(e0?e0.v:0,1);
  if(kind==='meal'){ if(e0&&e0.m!=null&&G.day-e0.m<30)return 0; const u=relU('rmeal'+G.day,t.id*17+o.id); const base=3+Math.floor(u*3); /* ri(3,5)과 같은 폭 */
    const d=relTalkCap(e0,Math.round(base*relTraitMul(o.gm)*dim)*2); /* 0~100 눈금(t.rel)의 값을 -100~100 눈금으로 */ const e=relAdd(a,b,d,'meal',null,true); e.m=G.day; t.cash=(t.cash||0)-10; /* 1천만 원: 우리 식사와 같은 비용 */ return d; }
  if(e0&&e0.c!=null&&G.day-e0.c<14)return 0; const u=relU('rcall'+G.day,t.id*19+o.id); const tr=o.gm.trait; const d=relTalkCap(e0,Math.round(Math.max(0,(tr==='loyal'?2:1)*(1+Math.floor(u*2))-(tr==='hard'?1:0))*dim)*2); const e=relAdd(a,b,d,d>0?'call':null,null,true); if(e)e.c=G.day; return d; }
/* 매달 1일: AI 단장끼리 만난다. 의리파는 자주, 강경파는 드물게. 상대는 거의 고르게 고른다(친한 사이는 아주 조금 더): 가까운 둘만 매달 만나 저절로 더 가까워지지 않게 */
function relNetMonth(){ if(!G.teams)return 0; const L=G.teams.filter(t=>t.id!==ME()&&t.gm&&!t.gm.interim); let n=0;
  for(const t of L){ const g=t.gm, p=g.trait==='loyal'?.7:g.trait==='hard'?.25:.45; if(relU('rnet'+G.day,t.id)>=p)continue; const a=relKeyOf(g,'gm');
    const C=L.filter(o=>o!==t).map(o=>{ const e=relsG()[relPK(a,relKeyOf(o.gm,'gm'))]; return {o,e,s:clamp(e?e.v:0,-20,20)*.15+relU('rnetp'+G.day,t.id*31+o.id)*50}; }).sort((x,y)=>y.s-x.s);
    for(const x of C.slice(0,3)){ const ok=x.e&&x.e.m!=null&&G.day-x.e.m<30; const d=relMeet(t,x.o,ok?'call':'meal'); if(d||!ok){ n++; break; } } }
  return n; }

/* ----- 경력: 선임·재계약·경질·교체(staffHistory에서 부른다) ----- */
const REL_HIRE=['선임','영입','정식 감독 승격','보직 승격','감독대행 선임','보조 코치 영입'], REL_RENEW=['재계약','연장 계약','잔류 계약','계약 연장'];
function relCareer(kind,s,action,tid,detail){ if(!s||tid==null||!G.teams)return; const k=relKeyOf(s,kind), boss=relGmKey(tid); if(!k)return; const me=boss==='me';
  const add=(dv,code)=>{ if(!boss)return; if(me)relNoteMeWork(k,dv,code); else relAdd(k,boss,dv,code,boss); };
  if(action==='경질')add(-40,'fir'); else if(action==='계약 종료'||action==='보조 코치 계약 종료')add(-8,'let'); else if(action==='계약 만료'&&detail&&/후임/.test(detail))add(-4,'let');
  else if(REL_HIRE.includes(action)){ add(12,'hir'); if(kind==='coach'&&detail&&/사단/.test(detail)){ const m=G.mgr&&G.mgr[tid], mk=relKeyOf(m,'mgr'); if(mk)relAdd(k,mk,10,'clan',mk); } }
  else if(REL_RENEW.includes(action))add(6,'ren'); }
/* 우리 단장이 한 인사: 지금 함께 일하는 사람은 기존 수치가 원본이라 사유만, 떠나는 사람(경질·교체)은 그래프 값으로 남긴다 */
function relNoteMeWork(k,dv,code){ const x=relMeLive(k); const e=relAdd('me',k,0,code,'me'); if(!e)return; e.v=clamp(Math.round(((x!=null?x:e.v)+(x!=null&&dv>0?0:dv))*10)/10,-100,100); }

/* ----- 트레이드 ----- */
/* AI끼리 거래 직후(G.lgTrades에 넣은 뒤): 성사 +, 그때 가치 차이(trueVal, 우리 거래 평가와 같은 잣대)를 남겨 시즌 뒤 손해 본 쪽이 앙금을 갖는다 */
function relTradeLog(tr){ if(!tr||tr.rl)return; tr.rl=1; const a=relGmKey(tr.a), b=relGmKey(tr.b); if(!a||!b)return; relAdd(a,b,4,'trd');
  try{ const tv=L=>sum((L||[]).map(id=>G.players[id]?trueVal(G.players[id]):0)); tr.dv=Math.round((tv(tr.ag)-tv(tr.bg))*10)/10; }catch(e){} tr.ka=a; tr.kb=b; }
/* 그 시즌 거래와 지난 결산 뒤 겨울 거래(연도가 하나 앞)를 모두 본다: 비시즌 거래도 한 번은 평가받는다 */
const relTrDue=(tr,y)=>tr.y<=y&&tr.y>=y-1;
function relTradeYear(y){ for(const tr of G.lgTrades||[]){ if(!relTrDue(tr,y)||tr.rv||!tr.ka||!tr.kb)continue; tr.rv=1; const d=tr.dv||0;
    if(!tr.pk&&Math.abs(d)>7){ const win=d>0?tr.ka:tr.kb, lose=d>0?tr.kb:tr.ka; relAdd(win,lose,-20,'flc',win); } else relAdd(tr.ka,tr.kb,4,'fair'); }
  /* 우리 거래: 값은 t.rel(손해 보면 -6, 08_season_events)이고 사유만 */
  for(const tr of G.trades||[]){ if(!relTrDue(tr,y)||tr.rlv)continue; tr.rlv=1; const g=relGmById(tr.gw); const k=g&&relKeyOf(g,'gm'); if(!k)continue; relNoteMe(k,tr.diff>7?'flc':'trd',tr.diff>7?'me':null); } }
function relGmById(id){ if(id==null)return null; for(const t of G.teams)if(t.gm&&t.gm.id===id)return t.gm; const x=(G.exGM||[]).find(x=>x.g&&x.g.id===id); return x?x.g:null; }

/* ----- 시즌 뒤(새해 첫날, 연도가 넘어가기 전): 함께 일함·출전 기회·멘토·트레이드 평가·되돌림·정리 ----- */
function relStaffOf(tid){ const me=tid===G.user&&!G.unemp; const gm=relGmKey(tid); const m=G.mgr&&G.mgr[tid]; const mk=m&&!m.interim&&!m.act?relKeyOf(m,'mgr'):null;
  const C=Object.values(coachesOf(tid)).filter(Boolean).map(c=>({k:relKeyOf(c,'coach'),clan:!!(m&&c.clan===m.id)})).filter(x=>x.k);
  const S=(me?G.scouts:(G.lgStaff&&G.lgStaff[tid]&&G.lgStaff[tid].sc))||[]; return {gm,mk,C,S:S.map(s=>relKeyOf(s,'scout')).filter(Boolean)}; }
function relWorkYear(){ for(const t of G.teams){ const X=relStaffOf(t.id); const add=(a,b,v,code)=>{ if(!a||!b)return; if(a==='me'||b==='me')relNoteMe(a==='me'?b:a,code); else relAdd(a,b,v,code); };
    add(X.gm,X.mk,5,'col'); for(const c of X.C){ add(X.gm,c.k,2,'col'); if(X.mk)relAdd(X.mk,c.k,c.clan?5:3,c.clan?'clan':'col',c.clan?X.mk:null); } for(const s of X.S)add(X.gm,s,2,'col'); } }
/* 감독 아래 출전 기회: 많이 뛴 주축은 그 감독을 좋아하고, 쓸 만한데 거의 못 뛴 선수는 서운해한다(구단마다 많이 뛴 4명·못 뛴 2명까지) */
function relPlayYear(y){ for(const t of G.teams){ const m=G.mgr&&G.mgr[t.id]; const mk=m&&!m.interim?relKeyOf(m,'mgr'):null; if(!mk)continue;
    const L=playersOf(t.id).filter(p=>!p.prospect&&!p.ys&&(p.hist||[]).some(h=>h.y===y&&h.t===t.id)).map(p=>{ let h=null; try{ h=seasonTotalT(p,y,'1군',t.id); }catch(e){} const n=h?(p.isP?(h.outs||0)/3*3.2:(h.pa||0)):0; return {p,n}; });
    for(const x of L.filter(x=>x.n>=380).sort((a,b)=>b.n-a.n).slice(0,4))relAdd('pl:'+x.p.id,mk,8,'pla',mk);
    const top=new Set([...L].sort((a,b)=>ovr(b.p)-ovr(a.p)).slice(0,14).map(x=>x.p.id)); for(const x of L.filter(x=>x.n<100&&top.has(x.p.id)&&!(x.p.injOut>0)&&ovr(x.p)>=52).slice(0,2))relAdd('pl:'+x.p.id,mk,-10,'ben',mk); } }
function relMentorYear(){ for(const t of G.teams){ const M=t.id===G.user?G.mentor:((G.clubT||{})[t.id]||{}).mentor; if(!M||M.y!==G.year)continue; const v=G.players[M.id]; if(!v||v.team!==t.id)continue;
    for(const p of playersOf(t.id).filter(p=>p.age<=24&&!p.prospect).sort((a,b)=>b.pot-a.pot).slice(0,3))relAdd('pl:'+v.id,'pl:'+p.id,6,'men','pl:'+v.id); } }
/* 크기 관리: 2년 넘게 그대로인 옅은 관계는 지우고, 상한을 넘으면 옅은 것부터 */
function relPrune(){ const R0=relsG(); for(const k in R0){ const e=R0[k]; if(!e||!Number.isFinite(e.v)){ delete R0[k]; continue; } if(Math.abs(e.v)<5&&G.day-(e.d||0)>730)delete R0[k]; }
  const K=Object.keys(R0); if(K.length>REL_CAP){ K.sort((a,b)=>Math.abs(R0[a].v)-Math.abs(R0[b].v)||(R0[a].d||0)-(R0[b].d||0)); for(const k of K.slice(0,K.length-REL_CAP))delete R0[k]; } }
function relsYear(){ if(!G.teams)return; const y=G.year; const R0=relsG();
  for(const k in R0){ const e=R0[k]; e.v=Math.round(e.v*.75*10)/10; } /* gmRelYear와 같은 비율로 0 쪽으로 */
  try{ relWorkYear(); }catch(e){} relSyncMe(); relPrune(); }
/* 시즌 결산 직후(감독이 바뀌기 전): 출전 기회·멘토·트레이드 평가 */
function relsSeason(y){ if(!G.teams||G.relSea===y)return; G.relSea=y; try{ relPlayYear(y); }catch(e){} try{ relMentorYear(); }catch(e){} try{ relTradeYear(y); }catch(e){} }
function relsMonth(){ try{ relNetMonth(); }catch(e){} try{ gmInvMonth(); }catch(e){} relSyncMe(); }

/* ----- 다른 구단 단장이 우리 단장을 부른다: 사이가 좋거나 거래하고 싶을 때 더 자주. 리그 전체에서 한 시즌 몇 번 ----- */
function gmInvOpen(){ return (G.evs||[]).some(e=>e.k==='gmInv'&&!e.done); }
function gmInvMonth(){ if(G.unemp||G.gameOver||G.user==null||!G.teams||gmInvOpen())return null; if(G.gmInvD!=null&&G.day-G.gmInvD<25)return null; try{ if(personalAway())return null; }catch(e){}
  const L=G.teams.filter(t=>t.id!==G.user&&t.gm&&!t.gm.interim).map(t=>{ const g=t.gm, c=(G.gmc||{})[t.id]||{}; const meal=!(c.meal!=null&&c.meal>G.day-30), call=!(c.call!=null&&c.call>G.day-14); if(!meal&&!call)return null;
      let want=false; try{ want=(t.rel??50)>=45&&aiInterest(t.id).length>0; }catch(e){}
      const p=(.03+((t.rel??50)>=65?.025:(t.rel??50)<35?-.02:0)+(want?.02:0))*(g.trait==='loyal'?1.5:g.trait==='hard'?.5:1); return {t,g,meal,want,p}; }).filter(Boolean);
  const P=L.filter(x=>relU('ginv'+G.day,x.t.id)<x.p); if(!P.length)return null; const x=P[Math.min(P.length-1,Math.floor(relU('ginvw'+G.day,P.length)*P.length))]; /* 문턱을 넘은 단장 중 고르게(구단 번호 순으로 앞 구단만 부르지 않게) */
  return gmInvite(x.t.id,x.meal&&relU('ginvk'+G.day,x.t.id)<(x.want||(x.t.rel??50)>=60?.7:.35)?'meal':'call',x.want); }
function gmInvite(tid,kind,want){ const t=team(tid), g=gmOf(tid); if(!g||g.interim)return null; G.gmInvD=G.day; const nm=`${tshort(tid)} ${g.name} 단장`;
  const sit=kind==='meal'?`${nm}이 저녁 식사를 하자고 연락해 왔습니다.${want?' 우리 선수 이야기를 꺼내고 싶은 눈치입니다.':' 시즌 이야기나 하자고 합니다.'}${aiQ(tid,'hello')}`:`${nm}이 통화하자고 연락해 왔습니다.${want?' 거래 이야기를 슬쩍 떠보려는 것 같습니다.':' 안부를 묻고 싶다고 합니다.'}`;
  const e=evNew('gmInv',kind==='meal'?`${nm}의 식사 초대`:`${nm}의 연락`,sit,[{l:kind==='meal'?'식사 자리에 나간다':'통화한다',fx:kind==='meal'?'우리가 청한 식사와 같습니다. 구단 운영비 1천만 원이 들고 친분이 오릅니다.':'우리가 건 안부 연락과 같습니다. 친분이 조금 오릅니다.'},{l:'정중히 거절',fx:'친분이 조금 식습니다.'}],{from:nm,data:{tid,gid:g.id,kind},def:1,exp:7});
  return e; }
EVH.gmInv={ can(e,i){ if(i!==0)return ''; try{ const w=personalAway(); if(w)return w; }catch(x){} return ''; },
  pick(e,i){ const D=e.data||{}, tid=D.tid, g=team(tid)&&team(tid).gm; if(G.unemp||tid===G.user||!g||g.id!==D.gid)return '그 단장은 이미 자리를 떠났습니다.'; const t=team(tid), k=relKeyOf(g,'gm');
    if(i===0){ const r=gmContact(tid,D.kind==='meal'?'meal':'call'); if(r&&r.ok)relNoteMe(k,D.kind==='meal'?'meal':'call'); return r&&r.msg||''; }
    t.rel=clamp((t.rel??50)-1,0,100); relNoteMe(k,'dec','me'); return `${g.name} 단장의 초대를 거절했습니다. 친분이 조금 식었습니다.`; } };

/* ----- 효과(작게) ----- */
/* AI끼리 트레이드: tradeNeed가 우리와의 친분(t.rel) 대신 두 단장 사이 친분을 같은 눈금(0~100)으로 본다 */
const REL_AS_CAP=20; /* 친분이 거래 요구치를 움직이는 폭: 0~100 눈금으로 30~70까지만(아무리 친해도 요구치가 음수가 되지 않게) */
function relAsRel(tid,otherTid){ const a=relGmKey(tid), b=relGmKey(otherTid); if(!a||!b)return 50; return 50+clamp(relVal(a,b)/2,-REL_AS_CAP,REL_AS_CAP); }
/* tradeNeed의 친분 몫만(창단·계획 보강처럼 따로 값을 매기는 AI끼리 거래용): 친하면 덜, 사이가 나쁘면 더 받으려 한다 */
function relNeedAdj(tid,otherTid){ return -(relAsRel(tid,otherTid)-50)/15*(gmTrait(tid)==='loyal'?2:1); }
function relTradeRefuse(tid,otherTid){ const a=relGmKey(tid), b=relGmKey(otherTid); return !!(a&&b&&relVal(a,b)<=-50); }
/* 감독·코치 선임: 단장이 좋아하는 사람은 조금 더, 많이 싫어하는 사람은 피한다 */
function relHireBias(tid,s,kind){ const a=relGmKey(tid); if(!a||a==='me')return 0; const k=relKeyOf(s,kind); if(!k)return 0; const v=relVal(a,k); return v<=-50?-30:v/12; }

/* ----- 카드용: 좋아하는·싫어하는 인물(수치 없이 이름과 사유 말만) ----- */
let _relWho=null;
function relWho(){ if(_relWho&&_relWho.g===G&&_relWho.d===G.day&&_relWho.u===G.user&&_relWho.x===!!G.unemp)return _relWho.m; const M=new Map(); const put=(k,o)=>{ if(k)M.set(k,o); };
  const safe=f=>{ try{ f(); }catch(e){} };
  safe(()=>{ for(const [id,a] of Object.entries(G.arch||{}))if(a&&a.name)put('pl:'+id,{n:a.name,r:'은퇴 선수',link:{a:'player',v:String(id)}}); });
  safe(()=>{ for(const o of G.ob||[])put(personNetworkKey(o,'ob'),{n:o.name,r:'은퇴 선수',link:{a:'person',v:'ob:'+o.id}}); });
  safe(()=>{ for(const p of Object.values(G.players||{}))if(!p.prospect)put('pl:'+p.id,{n:p.name,r:p.team!=null?tshort(p.team)+' 선수':'무적 선수',link:{a:'player',v:String(p.id)}}); });
  safe(()=>{ for(const x of G.exGM||[])if(x.g)put(relKeyOf(x.g,'gm'),{n:x.g.name,r:'전 단장'}); });
  safe(()=>{ for(const m of G.exMgr||[])put(relKeyOf(m,'mgr'),{n:m.name,r:'전 감독',link:{a:'person',v:'xmgr:'+m.id}}); });
  safe(()=>{ for(const m of G.mmarket||[])put(relKeyOf(m,'mgr'),{n:m.name,r:'감독 후보',link:{a:'person',v:'xmgr:'+m.id}}); });
  safe(()=>{ for(const c of G.cmarket||[])put(relKeyOf(c,'coach'),{n:c.name,r:'코치 · 구직 중'}); });
  safe(()=>{ for(const s of G.scoutMarket||[])put(relKeyOf(s,'scout'),{n:s.name,r:'스카우트 · 구직 중'}); });
  for(const t of G.teams||[]){ const me=t.id===G.user&&!G.unemp;
    safe(()=>{ if(!me&&t.gm&&!t.gm.interim)put(relKeyOf(t.gm,'gm'),{n:t.gm.name,r:tshort(t.id)+' 단장',link:{a:'person',v:'gm:'+t.id}}); });
    safe(()=>{ const m=G.mgr&&G.mgr[t.id]; if(m&&!m.interim)put(relKeyOf(m,'mgr'),{n:m.name,r:tshort(t.id)+' 감독',link:{a:'person',v:me?'mgr':'omgr:'+t.id}}); });
    safe(()=>{ for(const [role,c] of Object.entries(coachesOf(t.id)))if(c)put(relKeyOf(c,'coach'),{n:c.name,r:tshort(t.id)+' '+((CROLE[role]||{}).l||'코치'),link:{a:'person',v:me?'c:'+role:'oc:'+t.id+':'+role}}); });
    safe(()=>{ const S=me?G.scouts||[]:(G.lgStaff&&G.lgStaff[t.id]&&G.lgStaff[t.id].sc)||[]; for(const s of S)put(relKeyOf(s,'scout'),{n:s.name,r:tshort(t.id)+' 스카우트',link:{a:'person',v:me?'sc:'+s.id:'ost:sc:'+t.id+':'+s.id}}); }); }
  put('me',{n:meName()||'우리 단장',r:G.unemp?'야인 단장':tshort(G.user)+' 단장 · 나',me:1});
  _relWho={g:G,d:G.day,u:G.user,x:!!G.unemp,m:M}; return M; }
/* 사유 한 마디: 좋아하는 쪽이면 좋은 일, 싫어하는 쪽이면 나쁜 일 중 가장 최근 것 */
function relWhyWord(e,owner,other,pos){ const lo=owner<other?owner:other; const W=(e&&e.why)||[]; const pick=W.find(w=>REL_WHY[w[0]]&&(REL_WHY[w[0]][2]>0)===pos)||W.find(w=>REL_WHY[w[0]]); if(!pick)return pos?'가까운 사이':'껄끄러운 사이';
  const L=REL_WHY[pick[0]]; if(pick[2]==null)return L[1]; const subj=pick[2]===0?lo:(owner<other?other:owner); return subj===owner?L[0]:L[1]; }
/* k: 사람 키. 좋아하는 3명·싫어하는 3명 {k,n,r,w,link}. 사라진 사람(목록에 없는 키)은 빼고 본다 */
function relLikes(k,n){ n=n||3; if(!k)return {like:[],dis:[]}; const W=relWho(), R0=relsG(), rows=[];
  for(const pk in R0){ const i=pk.indexOf('|'), a=pk.slice(0,i), b=pk.slice(i+1); if(a!==k&&b!==k)continue; const o=a===k?b:a; const who=W.get(o); if(!who)continue; rows.push({o,e:R0[pk],v:relVal(k,o),who}); }
  /* 우리 단장과의 관계는 기존 수치(t.rel·감독 관계·단장 관계)가 원본이라 그래프에 줄이 없어도 넣는다 */
  if(k==='me'){ for(const o of relMeLiveKeys())if(!rows.some(r=>r.o===o)&&W.get(o))rows.push({o,e:R0[relPK('me',o)],v:relVal('me',o),who:W.get(o)}); }
  else if(!rows.some(r=>r.o==='me')&&relMeLive(k)!=null)rows.push({o:'me',e:R0[relPK('me',k)],v:relVal('me',k),who:W.get('me')});
  const mk=(r,pos)=>({k:r.o,n:r.who.n,r:r.who.r,w:relWhyWord(r.e,k,r.o,pos),link:r.who.link||null,me:!!r.who.me});
  return {like:rows.filter(r=>r.v>=REL_LIKE).sort((x,y)=>y.v-x.v).slice(0,n).map(r=>mk(r,true)),dis:rows.filter(r=>r.v<=-REL_LIKE).sort((x,y)=>x.v-y.v).slice(0,n).map(r=>mk(r,false))}; }
/* 인물 카드 키 → 사람(카드에 좋아하는·싫어하는 인물을 붙일 때) */
function relCardPerson(k){ const P=String(k||'').split(':'), kind=P[0];
  try{ if(kind==='mgr')return {s:G.mgr[G.user],kind:'mgr'}; if(kind==='omgr')return {s:G.mgr[+P[1]],kind:'mgr'}; if(kind==='xmgr'){ const id=P.slice(1).join(':'); return {s:(G.mmarket||[]).find(x=>x.id===id)||(G.exMgr||[]).find(x=>x.id===id),kind:'mgr'}; }
    if(kind==='c'){ const ref=P.slice(1).join(':'); return {s:coachesOf(G.user)[ref]||staffOwned('coach',ref),kind:'coach'}; } if(kind==='oc')return {s:coachesOf(+P[1])[P[2]],kind:'coach'};
    if(kind==='sc')return {s:(G.scouts||[]).find(x=>x.id===P[1]),kind:'scout'}; if(kind==='ost'&&P[1]==='sc')return {s:((G.lgStaff&&G.lgStaff[+P[2]]&&G.lgStaff[+P[2]].sc)||[]).find(x=>x.id===P[3]),kind:'scout'};
    if(kind==='gm'){ const tid=+P[1]; if(relMine(tid))return {s:'me',kind:'gm'}; const t=team(tid); return {s:t&&t.gm,kind:'gm'}; } if(kind==='ob')return {s:(G.ob||[]).find(o=>o.id===P.slice(1).join(':')),kind:'ob'}; }catch(e){}
  return null; }
function relCardKey(k){ const x=relCardPerson(k); return x&&x.s?relKeyOf(x.s,x.kind):null; }
