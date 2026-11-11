/* 예전 저장 정리: 기한 임박 알림이 따로 만들던 중복 소식을 지운다(지금은 원래 소식을 끌어올림) */
function mailMigrate(){ if(G.mailMig>=1)return; G.mailMig=1; G.mail=(G.mail||[]).filter(m=>!(m.kind==='결정'&&/^내일까지 정하지 않으면/.test(m.subj||''))); }
/* ===== 드래프트 ===== */
const SCH_CITY={수도권:['서울','인천','수원','성남','부천','안산','의정부'],영남:['부산','대구','울산','창원','포항','김해','경주'],'호남·충청':['광주','대전','전주','청주','목포','천안','순천']};
const SCH_HS=['새빛고','한결고','솔뫼고','누리고','다솜고','미르고','해담고','가온고','라온고','늘품고','한울공고','푸름고'];
const SCH_UN=['한결대','누리대','새빛대','가온대','미르대','해담대'];
const AM_INJ_P=['팔꿈치 인대 접합 수술(토미 존) 이력','어깨 염증으로 3개월 공백','팔꿈치 뼛조각 제거 수술 이력','고3 시즌 혹사 논란(투구 수 과다)'];
function amHistory(b,lvl){ // 학년별 아마추어 기록. 어릴수록 조금 약하고, 선구안·제구 같은 기질은 학년이 바뀌어도 크게 변하지 않는다
  const n=b.college?4:3; const rows=[]; const tot=b.isP?{outs:0,h:0,hr:0,bb:0,so:0,tb:0,er:0,g:0}:{pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,r:0,rbi:0,sb:0,cs:0,g:0};
  for(let i=0;i<n;i++){ const back=n-1-i; const q={r:{}}; for(const k in b.r)q.r[k]=clamp(b.r[k]-back*(k==='eye'||k==='ctl'?.8:rnd(1.6,2.6)),20,80);
    const sp=Object.assign({},b,{r:q.r,sf:null});
    const lv=lvl+(i===0&&!b.college?-2:0);
    const x=b.isP?Object.assign(simPit(sp,i===0&&!b.college?ri(30,90):ri(70,190),lv),{g:i===0?ri(4,10):ri(9,18)}):Object.assign(simBat(sp,i===0&&!b.college?ri(40,80):ri(85,135),lv),{g:i===0?ri(14,26):ri(25,38)});
    rows.push(Object.assign({gr:i+1},x)); for(const k in tot)tot[k]+=x[k]||0; }
  b.amY=rows; b.am=tot; }
const AM_INJ_B=['손목 골절 이력','햄스트링 부상 반복','허리 디스크 치료 이력','무릎 연골 수술 이력'];
/* 리그 수준 유지: 해마다 신인이 은퇴 선수보다 강하면 리그 전체 능력이 계속 오른다(12시즌에 평균 +4, 60 이상 5명→50명).
   게임 시작 때 리그 평균을 기준으로 삼고, 지금 평균이 그보다 높으면 신인 잠재력을 그만큼 낮춰(낮으면 높여) 리그 수준을 비슷하게 유지한다 */
function lgMeanDom(){ const L=Object.values(G.players).filter(p=>!p.foreign&&!p.prospect&&(p.team!=null||p.fdPool)); return L.length?L.reduce((a,p)=>a+ovr(p),0)/L.length:null; }
/* 리그 수준 기준: 국내 선수 상위 300명(구단당 30명 안팎) 평균. 전체 평균은 신인이 늘면 내려가 버려(인원 구성 효과) 상승을 못 잡았다(커뮤니티 피드백 11-11) */
function lgTopDom(){ const V=Object.values(G.players).filter(p=>!p.foreign&&!p.prospect&&(p.team!=null||p.fdPool)).map(ovr).sort((a,b)=>b-a).slice(0,300); return V.length>=100?V.reduce((a,v)=>a+v,0)/V.length:null; }
function lgTopBase(m){ if(G.lgBaseT==null&&m!=null)G.lgBaseT=+m.toFixed(2); return G.lgBaseT; }
function draftLevelAdj(){ const m=lgMeanDom(); if(m==null)return 0; if(G.lgBase==null){ G.lgBase=+m.toFixed(2); } const t=lgTopDom(), b=lgTopBase(t); const dT=t!=null&&b!=null?t-b:0; return clamp(Math.max((m-G.lgBase)*1.6,dT*2.4),-3,8); } /* 1.6→2.4: 10시즌에 평균 표시 능력 57.3→58.9, 80 이상 4→11명(커뮤니티 피드백 11-11) */
/* 성장 안정 장치: 국내 상위 300명 평균이 시작 때보다 오른 만큼 그해 겨울 성장(플러스 쪽)을 줄인다. 원래 능력 1점에 15%, 최대 40%. 내려가면 최대 5% 더 큰다 */
function growLevelF(){ const y=G.year; if(G.lvF&&G.lvF.y===y)return G.lvF.f; const t=lgTopDom(), b=lgTopBase(t); const f=t==null||b==null?1:clamp(1-(t-b)*.15,.6,1.05); G.lvF={y,f:+f.toFixed(3)}; return G.lvF.f; }
function makeDraftClass(){
  const cls=[]; const lvAdj=draftLevelAdj();
  for(let i=0;i<DRAFT_POOL;i++){
    const college=R()<.3; const age=college?22:18; const T=clamp(N(43,8)+(R()<.04?rnd(3,8):0)-lvAdj,26,77); /* 해마다 리그 상위권(60+)으로 클 재목이 몇 명 섞인다. 커뮤니티 피드백(11-07: 탱킹 2~3년이면 주전이 대어로 채워짐)으로 폭을 줄였다 */
    const cur=clamp(T-(27-age)*rnd(2.2,3.4),20,60);
    const b=newPlayer({age,base:cur,pot:T,college}); b.prospect=true;
    if(T<56&&R()<.07){ const h=ri(6,12); b.pot=Math.min(78,b.pot+h); b.hidT=h; } /* 숨은 재능: 실제 잠재력이 겉보기보다 크다. 대부분의 스카우트는 놓치고, 능력 좋은 스카우트만 알아본다(유저 요청 11-07) */
    setProspectArea(b); b.schoolHue=Math.floor(u01('sh',b.school)*360); /* 실제 권역·고교 이름(12_scout_area, 사용자 11-08) */
    b.ht=Math.round(clamp(N(b.isP?184:179,5),168,198)); b.wt=Math.round(clamp(b.ht-100+N(b.isP?-1:-3,6),62,112));
    if(b.isP)b.amVelo=veloOf(b)-(college?ri(1,3):ri(3,6)); else b.amRun=(+runOf(b)+.04).toFixed(2);
    if(b.inj>.22&&R()<.65)b.amInj=pick(b.isP?AM_INJ_P:AM_INJ_B);
    const lvl=rnd(14.5,19.5); b.amLevel=lvl>18.5?'약팀 상대 비중이 큼':lvl<15.5?'강팀 상대 비중이 큼':'';
    amHistory(b,lvl);
    cls.push(b.id);
  }
  sonMake(cls); /* 옛 선수의 아들(2대 선수, 33_ob) */
  /* 즉시 전력 신인: 해마다 상위 재목 몇 명은 1년차부터 1군 주전급이다(실제 KBO도 매년 2~4명은 첫해부터 자리를 잡는다).
     잠재력 상위 5명 중 55%가 완성형이 되고, 35% 확률로 리그 정상급으로 클 특급이 하나 나온다 */
  { const top=cls.map(id=>G.players[id]).filter(p=>p.pot>=54).sort((a,b)=>b.pot-a.pot).slice(0,5);
    for(const p of top){ if(R()<.55){ const t=clamp(p.pot-rnd(4,9),47,56); if(ovr(p)<t){ setOvr(p,t); p.ready=true; } } }
    if(top[0]&&R()<.35){ const p=top[0]; p.pot=clamp(p.pot+rnd(3,7),60,79); setOvr(p,clamp(p.pot-rnd(5,9),53,60)); p.ready=true; p.dt=R()<.5?'early':'norm'; }
    for(const p of top.filter(q=>q.ready)){ amHistory(p,rnd(14.5,19.5)); if(p.isP)p.amVelo=veloOf(p)-(p.college?ri(0,2):ri(1,4)); else p.amRun=(+runOf(p)+.04).toFixed(2); } }
  /* 해외파 신인: 해외에서 돌아와 2년 유예를 마친 선수(KBO 규약 107조)는 이해 신인 드래프트에 나온다. 트라이아웃 기록 대신 해외 마지막 시즌 수준으로 아마 기록을 만든다 */
  for(const p of Object.values(G.players)){ if(p.ovsRet&&p.prospect&&p.team==null&&!p.retired){ if(!cls.includes(p.id))cls.push(p.id); continue; } /* 불러오기 보정으로 명단을 다시 만들 때 이미 참가한 복귀자(검수 11-09ze) */
    if(!(p.ovsWait&&G.year>=p.ovsWait&&p.team==null&&!p.prospect&&!p.retired))continue; delete p.ovsWait; p.prospect=true; p.ovsRet=true; p.school=`해외파(${p.school||'고교 직행'})`; if(!p.am)try{ amHistory(p,17.5); }catch(e){} /* 학력·아마 기록은 출국 전 것 그대로: 고교 직행을 대졸 4년으로 새로 만들지 않는다(검수 11-09ze) */ if(!cls.includes(p.id))cls.push(p.id);
    try{ wire('드래프트',`해외파 ${p.name}(${p.age}세), ${G.year} 신인 드래프트 참가`,{ref:p.id}); }catch(e){} }
  // 언론 평가: 눈에 보이는 성적과 체격·구속만으로 매긴 순위
  /* 투수와 타자는 척도가 달라 각자 안에서 표준점수로 바꾼 뒤 합친다(그래야 언론 상위권에 투수와 타자가 섞인다) */
  const raw=cls.map(id=>G.players[id]).map(p=>{ const h=p.am; let s;
    if(p.isP){ const r=pRate(h); s=-r.era*6+(h.so/Math.max(1,h.outs/3))*9*1.4+((p.amVelo||veloOf(p))-143)*1.2; }
    else { const r=bRate(h); s=r.ops*55+h.hr*.8+h.sb*.15; }
    return {p,s:s+(p.ht-180)*.15}; });
  const zs=grp=>{ const L=raw.filter(x=>!!x.p.isP===grp); const m=L.reduce((a,x)=>a+x.s,0)/Math.max(1,L.length); const sd=Math.sqrt(L.reduce((a,x)=>a+(x.s-m)**2,0)/Math.max(1,L.length))||1; L.forEach(x=>x.z=(x.s-m)/sd+(grp?.15:0)); };
  zs(true); zs(false);
  const ps=raw.map(x=>({p:x.p,s:x.z+N(0,.25)})).sort((a,b)=>b.s-a.s);
  ps.forEach((x,i)=>x.p.press=i+1);
  G.draftClass=cls;
}
/* 예전 저장: 낱말처럼 읽히는 이름(예: 탁지기)을 새 이름으로 바꾼다. 같은 사람은 어디서나 같은 새 이름, 소식 글의 이름도 함께 바꾼다. 단장 본인 이름은 그대로 */
function nameMigrate(){ if(G.nmFix>=1)return; G.nmFix=1; const M=new Map(); const seen=new Set();
  const walk=(o,d)=>{ if(!o||typeof o!=='object'||d>6||seen.has(o)||o===G.gmP||o===G.mail)return; seen.add(o);
    if(typeof o.name==='string'&&nameBad(o.name)&&/^[가-힣]{3}$/.test(o.name)){ if(!M.has(o.name))M.set(o.name,genName()); o.name=M.get(o.name); }
    for(const k in o){ const v=o[k]; if(v&&typeof v==='object')walk(v,d+1); } };
  walk(G,0); if(!M.size)return;
  const fix=s=>{ if(typeof s!=='string')return s; for(const [a,b] of M)if(s.includes(a))s=s.split(a).join(b); return s; };
  for(const m of (G.mail||[])){ m.subj=fix(m.subj); m.body=fix(m.body); if(m.from)m.from=fix(m.from); }
  for(const L of [G.news,G.wire,G.log])if(Array.isArray(L))for(const x of L){ if(!x||typeof x!=='object')continue; for(const k of ['t','h','b','title','body','txt'])if(typeof x[k]==='string')x[k]=fix(x[k]); } }
function migrateDraft(){ worldReset(); try{ psCatchUp(G.day+1); }catch(e){} /* 불러온 저장의 지난 포스트시즌 차전은 다음 진행일로(검수 11-09zo) */ try{ syncMinSal(); }catch(e){} /* 불러온 해의 최저 연봉(검수 11-06: 2027년 세이브를 열자마자 2026년 기준으로 계약됨) */ /* 불러오기·가져오기 뒤 항상 부르는 자리 */
  if(!G)return; champEventsInit(); try{ mailMigrate(); }catch(e){} try{ nameMigrate(); }catch(e){} try{ gmInit(); }catch(e){} if(!G.coach){ try{ coachInit(); }catch(e){} } else { try{ coachFill(); }catch(e){} } try{ stFill(); }catch(e){} if(G.goals&&!G.goals.v&&G.goals.y===G.year){ try{ const t=team(G.user); const base=projSupport(); const mm=t.owner==='profit'?.85:t.owner==='pr'?1:1.15; G.goals.sup=Math.max(G.goals.sup,Math.round(clamp(base*mm+.05,.2,1)*100)/100); }catch(e){} G.goals.v=2; } if(G.spend&&G.spend.coach==null)G.spend.coach=0; G.shortlist=G.shortlist||[]; for(const t of G.teams||[]){ const d=TEAM_DEF.find(x=>x.code===t.code); if(d)t.hue=d.hue; }
  for(const k in G.mgr)mgrFix(G.mgr[k]); (G.mmarket||[]).forEach(mgrFix);
  if(!G.r68){ G.r68=true; for(const t of G.teams){ if(t.id===G.user)continue; const add=fillRoster(t.id,54); for(const p of add)delete p.dev; }
    const ua=fillRoster(G.user,ROSTER_MIN); if(ua.length)mail('운영팀','소속선수 한도 확대',`협회 규정의 소속선수 한도에 맞춰 정식 등록 한도가 ${ROSTER_MAX}명으로 늘었습니다. 최소 인원(${ROSTER_MIN}명)을 맞추려고 2군 선수 ${ua.length}명을 등록했습니다.`,{kind:'운영'}); }
  for(const p of Object.values(G.players))milInit(p);
  for(const s of G.scouts.concat(G.scoutMarket||[])){ if(!s.role){ s.role='am'; s.since=-999; } }
  prInit(); if(!G.goals&&period()==='season')setGoals();
  if((period()==='season'||period()==='post')&&G.entryY!==G.year){ G.entryY=G.year; for(const t of G.teams)setEntry(t.id); }
  if(!G.intl)G.intl={us:1,la:0,jp:0,tw:0,au:0}; if(!G.data)G.data={lv:1}; if(G.spend&&G.spend.intl==null)G.spend.intl=0; if(!G.fac)G.fac={lv:2,build:null}; try{ facInit(); }catch(e){} if(G.spend.fac==null)G.spend.fac=0;
  for(const t of G.teams)if(t.fac==null)t.fac=ri(2,4); try{ aiFacAll(); }catch(e){}
  for(const p of Object.values(G.players)){ if(!p.dt)p.dt=rollDT(); if(!p.isP&&p.r.vit==null)p.r.vit=Math.round(clamp(N(55-(p.inj-.14)*90,8),25,80)); if(p.fat==null)p.fat=0; }
  if(G.formY!==G.year&&G.day>=G.cal.camp)rollForm();
  for(const p of Object.values(G.players)) if(p.foreign){ if(!p.orig)p.orig=origOf(p); if(p.adapt==null)p.adapt=Math.round(clamp(N(50,13),20,80)); }
  /* 외국인 후보 채우기는 다음 날짜 진행(07_daily)에 맡긴다: 같은 저장을 두 번 열면 후보가 달라졌다(검수 11-09zr #13) */
  migrateDraftPool(); /* 학교 정보 하나가 없거나 풀이 작다는 이유로 저장한 후보를 다시 뽑지 않는다 */
  if(G.dmemo)for(const id in G.dmemo)if(!(G.players[id]&&G.players[id].prospect))delete G.dmemo[id]; /* 실제로 사라진 후보의 메모만 정리 */
  recoverDraftLogs();
}
/* 예전 후보는 인물·능력·관찰·메모를 그대로 두고 학교/권역 표시만 보완한다. */
function migrateDraftPool(){
  const d=G.draft, live=!!(d&&!d.done), done=!!(d&&d.done&&d.y===G.year);
  const valid=L=>[...new Set((Array.isArray(L)?L:[]).filter(id=>G.players[id]&&typeof G.players[id]==='object').map(id=>G.players[id].id??id))];
  const prospects=Object.values(G.players).filter(p=>p&&p.prospect).map(p=>p.id);
  const source=Array.isArray(G.draftClass)&&G.draftClass.length?G.draftClass:live&&Array.isArray(d.cls)?d.cls:prospects;
  G.draftClass=valid(source);
  if(!G.draftClass.length&&!live&&!done){ if(prospects.length)G.draftClass=valid(prospects); else makeDraftClass(); }
  if(live)d.cls=valid(Array.isArray(d.cls)?d.cls:G.draftClass);
  for(const id of new Set([...G.draftClass,...(live?d.cls:[])])){ const p=G.players[id]; if(!p||!p.prospect)continue;
    const school=typeof p.school==='string'&&p.school.trim(), known=school&&AREA.find(a=>a.hs.includes(school)||a.un.includes(school));
    const area=areaDef(p.area)||known||areaDef(areaOf(p));
    if(!p.area&&area)p.area=area.k; if(!p.region&&area)p.region=area.reg;
    if(!school)p.school='학교 정보 없음'; /* 근거 없는 학교·아마 성적을 새로 만들지 않는다 */
    if(p.schoolHue==null)p.schoolHue=Math.floor(u01('sh',p.school)*360);
  }
}
/* 그해 신인 드래프트 지명 순서: 지난 시즌 순위의 역순(r2: 2라운드부터). 경쟁균형세 3회 연속 초과 구단은 1라운드(r1)에서 9단계 내려간다.
   드래프트 날 전에도 같은 순서를 미리 알려 줄 수 있게 따로 계산한다 */
function draftOrders(){ const h=[...(G.history||[])].reverse().find(x=>x.y<G.year&&x.order); if(!h)return null; const order=[...h.order].reverse().map(o=>o.tid); for(const t of G.teams)if(!order.includes(t.id))order.unshift(t.id); /* 지난 시즌 기록이 없는 신생 구단은 첫 순번(89_league_expansion) */
  const pen=G.teams.filter(t=>t.pickPen===G.year&&order.includes(t.id)).map(t=>t.id);
  return {r1:penOrder(order,pen),r2:order,pen,y:h.y}; }
/* 1라운드 제재 반영 순서: 제재 구단은 원래 순번에서 9칸 아래 자리에 둔다. 여러 구단이 함께 받아도 서로 밀어 올리지 않게 자리를 먼저 잡고 나머지를 순서대로 채운다(검수 11-07). 지명권 예상 순번도 같은 식(검수 11-08d) */
function penOrder(order,pen){ const n=order.length; pen=pen.filter(t=>order.includes(t)).sort((a,b)=>order.indexOf(b)-order.indexOf(a)); const slot=new Array(n).fill(null);
  for(const t of pen){ let j=Math.min(n-1,order.indexOf(t)+9); while(j<n&&slot[j]!=null)j++; if(j>=n){ j=n-1; while(slot[j]!=null)j--; } slot[j]=t; }
  const rest=order.filter(t=>!pen.includes(t)); for(let j=0;j<n;j++)if(slot[j]==null)slot[j]=rest.shift(); return slot; }
/* 실제 드래프트 순번표(지명권 거래 반영): 사전 안내·모의 지명·드래프트 시작이 같은 표를 쓴다(검수 11-06) */
function draftPlan(){ const D=draftOrders(); if(!D)return null; const picks=[]; for(let r=0;r<DRAFT_ROUNDS;r++)(r===0?D.r1:D.r2).forEach((tid,i)=>{ const own=pkOwner(G.year,r+1,tid); picks.push(own===tid?{rd:r+1,no:i+1,tid,pid:null}:{rd:r+1,no:i+1,tid:own,from:tid,pid:null}); }); return picks; }
function draftNo(tid){ const o=draftOrders(); if(!o)return null; const r1=o.r1.indexOf(tid)+1, r2=o.r2.indexOf(tid)+1, r1o=[...o.r2].indexOf(tid)+1; const f=(draftPlan()||[]).find(k=>k.tid===tid); /* 지명권 거래를 반영한 실제 첫 지명(검수 11-07) */ return {r1,r2,pen:o.pen.includes(tid)&&r1!==r1o,y:o.y,first:f?{rd:f.rd,no:f.no}:null}; } /* pen: 실제로 순번이 내려간 때만(검수 11-07) */
/* 신인 보드 점수: 보드 화면과 추천 지명이 같은 식(잠재력 미확인은 현재 +6, 검수 11-07) */
const draftVal=rp=>(rp.ofp??rp.cur+6)+rp.cur*.2;
const draftFirstTxt=n=>n&&n.first?`${n.first.rd}라운드 ${n.first.no}순위`:'지명권 없음';
/* 3월 1일: 드래프트 시즌 시작 안내(첫 시즌 포함) */
function draftSeasonMail(){ if(G.unemp||G.user==null)return; const n=draftNo(G.user); if(!n||!G.cal||!G.cal.draft)return; const c=scoutChief&&scoutChief();
  let own1=true, pkT=''; try{ const H=pkHeld(G.user); own1=H.includes('1:'+G.user); const gone=Array.from({length:DRAFT_ROUNDS},(_,i)=>i+1).filter(rd=>!H.includes(rd+':'+G.user)) /* 모든 라운드(검수 11-07) */, got=H.filter(k=>+k.split(':')[1]!==G.user); if(gone.length||got.length)pkT=` 지명권 거래 반영: ${gone.length?`넘긴 지명권 ${gone.map(rd=>rd+'라운드').join('·')}`:''}${gone.length&&got.length?', ':''}${got.length?`받은 지명권 ${got.map(pkName).join(', ')}`:''}.`; }catch(e){} /* 거래한 지명권을 반영해 안내(검수 11-06) */
  const f1=(draftPlan()||[]).find(k=>k.tid===G.user); /* 실제 첫 지명(받은 지명권 포함) */
  mail('스카우트팀',`${G.year} 신인 드래프트: ${f1?`우리 첫 지명은 ${f1.rd}라운드 ${f1.no}순위`:'이번 드래프트 지명권이 없습니다'}`,`${dmd(G.cal.draft)}에 ${G.year} 신인 드래프트가 열립니다. 지명 순서는 지난 시즌(${n.y}) 성적의 역순이라 원래 우리 순번은 1라운드 ${n.r1}순위${n.r2!==n.r1?`, 2라운드부터 ${n.r2}순위`:''}입니다.${f1&&!(f1.rd===1&&f1.no===n.r1)?` 지명권 거래를 반영한 실제 첫 지명은 ${f1.rd}라운드 ${f1.no}순위입니다.`:''}${pkT}${n.pen?` 경쟁균형세 3회 연속 초과로 1라운드 순서가 ${n.r2}순위에서 ${n.r1}순위로 내려갔습니다.`:''}\n\n오늘부터 드래프트 시즌입니다. ${c?`${c.name} 스카우트팀장이 `:''}아마추어 담당 스카우트를 고교·대학 선수 관찰에 보냅니다. 관찰이 쌓일수록 평가가 정확해집니다.\n영입·계약 → 신인 드래프트에서 후보 순위를 보고 관심 선수를 표시해 두세요. 지명한 신인은 내년 1월에 합류합니다.`,{kind:'업무',acts:[{l:'신인 드래프트 보기',a:'go',v:'transfer:draft'}]}); }
function startDraft(){
  const D=draftOrders(); const order=D.r2, o1=D.r1;
  if(D.pen.includes(G.user)){ const a=D.r2.indexOf(G.user)+1, b=D.r1.indexOf(G.user)+1; if(b!==a)note('드래프트',`경쟁균형세 3회 연속 초과로 1라운드 지명 순서가 ${a}순위에서 ${b}순위로 내려갔습니다.`); } /* 실제로 바뀐 만큼만(검수 11-07) */
  pkClean(); const picks=draftPlan(); void order; void o1; /* 트레이드로 넘겨받은 지명권은 원래 구단 순번에 쓴다 */
  G.draft={cls:G.draftClass||[],picks,cur:0,done:false,y:G.year}; { const P=draftRestPre(); if(P)G.draft.rest={mode:P.mode,min:P.min,tid:P.tid}; delete G.drestPre; } /* 준비 화면에서 정해 둔 자동 지명 기준 */
  stop('드래프트',`${G.year} 신인 드래프트가 열립니다. 참가 ${G.draft.cls.length}명, ${DRAFT_ROUNDS}라운드 지명 순번은 ${picks.length}개입니다(구단은 어느 라운드든 지명을 건너뛸 수 있어 실제 지명 인원은 이보다 적을 수 있습니다). 순서는 지난 시즌 성적의 역순이고, ${(()=>{ const f=picks.find(k=>k.tid===G.user); return f?`우리 첫 지명은 ${f.rd}라운드 ${f.no}순위입니다.`:'우리 구단은 이번 드래프트 지명권이 없습니다.'; })()}`);
}
/* 드래프트 성적표: 한 해 지명자 전체의 현재 모습 */
function draftTidOf(p){ const st=(p.story||[]).find(x=>x.k==='draft'); if(!st)return null; const t=G.teams.find(t=>st.t.includes(tname(t.id))); return t?t.id:null; }
/* 누락된 지명 장부만 현역/보관 기록의 명시적 지명 정보로 복원한다. 팀 소속·이름으로는 추정하지 않는다. */
function draftRecoveredRows(y){ const L=[],seen=new Set(),add=(p,a)=>{ const d=p.draft||{}, year=d.y??(a?p.dy:null); if(year!==y||p.id==null||seen.has(String(p.id)))return;
    const tid=d.tid??(a?p.dt:draftTidOf(p)); if(tid==null||!team(tid))return;
    seen.add(String(p.id)); L.push({id:p.id,nm:p.name,t:tid,rd:d.rd??'?',no:d.no??'?',pos:a?(p.isP?p.pos:POSK[p.pos]||p.pos):posLabel(p),pr:p.press||null}); };
  for(const p of Object.values(G.players))if(p)add(p,false);
  for(const p of Object.values(G.arch||{}))if(p&&!seen.has(String(p.id)))add(p,true);
  return L;
}
function recoverDraftLogs(){ const years=new Set(); for(const p of Object.values(G.players).concat(Object.values(G.arch||{}))){ if(!p)continue; const y=p.draft&&p.draft.y!=null?p.draft.y:p.dy; if(Number.isInteger(y)&&y<=G.year)years.add(y); }
  for(const y of years)if(!Array.isArray(G.dlog&&G.dlog[y])){ const L=draftRecoveredRows(y); if(L.length)(G.dlog=G.dlog||{})[y]=L; }
}
function draftClass(y){ const L=Array.isArray(G.dlog&&G.dlog[y])?G.dlog[y]:draftRecoveredRows(y), seen=new Set();
  return L.filter(x=>x&&x.id!=null&&!seen.has(String(x.id))&&seen.add(String(x.id))).map(x=>{ const p=G.players[x.id]; const c=p?careerOf(p):null; const a=!p&&G.arch&&G.arch[x.id]; /* 은퇴해도 지명 성과는 보관 기록으로 */ return Object.assign({},x,{p,war:c?c.war:a?(a.rows||[]).reduce((s,r)=>s+(r.war||0),0):0,now:p?p.team:null,ovr:p?Math.round(ovr(p)):null,n:Number.isInteger(x.rd)&&Number.isInteger(x.no)?(x.rd-1)*10+x.no:null}); }); }
function draftGrades(y){ const L=draftClass(y); const by={}; for(const x of L){ const t=x.t??(x.p&&x.p.draft?null:null); if(t==null)continue; by[t]=(by[t]||0)+x.war; } const arr=Object.entries(by).map(([t,v])=>({t:+t,v})).sort((a,b)=>b.v-a.v); return arr; }
/* 지명 3년·5년 뒤 돌아보기: 스틸픽과 실패한 상위 지명 */
function draftRetro(){ const now=G.year; for(const back of [3,5]){ const y=now-back; const L=draftClass(y); if(L.length<20)continue; /* 은퇴 선수도 보관 기록으로 넣는다: 성적표(draftGrades)와 같은 합계(검수 11-06) */
  const top=[...L].sort((a,b)=>b.war-a.war); const steal=top.find(x=>x.n!=null&&x.n>=15&&x.war>=3&&top.indexOf(x)<5); const bust=L.filter(x=>x.n!=null&&x.n<=3&&x.war<.5).sort((a,b)=>a.war-b.war)[0];
  if(steal)news('분석',`${y} 드래프트 ${back}년 뒤: ${steal.n}순위 ${steal.nm}, 최고의 스틸픽`,`${tname(steal.t)}이(가) ${steal.rd}라운드 ${steal.no}순위로 뽑은 ${steal.nm}이(가) 통산 WAR ${steal.war.toFixed(1)}로 같은 해 지명자 중 ${top.indexOf(steal)+1}위입니다.`,steal.t===G.user?2:0,{ref:steal.id});
  if(bust)news('분석',`${y} 드래프트 ${back}년 뒤: ${bust.n}순위 ${bust.nm}, 아직 물음표`,`${tname(bust.t)}이(가) 전체 ${bust.n}순위로 뽑은 ${bust.nm}의 통산 WAR는 ${bust.war.toFixed(1)}입니다. 같은 해 최고는 ${top[0].nm}(${top[0].war.toFixed(1)}).`,bust.t===G.user?-2:0,{ref:bust.id});
  const mine=L.filter(x=>x.t===G.user); if(mine.length){ const g=draftGrades(y); const rk=g.findIndex(x=>x.t===G.user)+1; note('드래프트',`${y} 드래프트 ${back}년 뒤 성적표: 우리 지명자 통산 WAR 합 ${mine.reduce((a,x)=>a+x.war,0).toFixed(1)}, 리그 ${rk||'-'}위. 영입·계약 → 신인 드래프트 → 성적표에서 자세히 볼 수 있습니다.`); } } }

/* 창단 드래프트 전 재정 전망: 국내 선수 연봉을 뺀 나머지 지출과 수입으로 '선수 연봉에 쓸 수 있는 돈'을 계산 */
function fdFin(tid){ const u0=G.user; if(tid!=null)G.user=tid; try{ const t=team(G.user); const b=budget(); const dom=sum(b.exp.filter(x=>x[2]==='pay').map(x=>x[1])); const other=b.E-dom; const sup=t.indie?0:b.cap;
    return {inc:b.inc,I:b.I,other,otherRows:b.exp.filter(x=>x[2]!=='pay'),sup,cash:t.cash,avail:b.I+sup-other-(G.fd&&!G.fd.done?foundReserve().tot:0),res:G.fd&&!G.fd.done?foundReserve():null,cap:capOf(G.year),indie:!!t.indie,owner:t.owner,market:t.market}; } finally{ G.user=u0; } }
function fdWelcome(){ const t=team(G.user); const B=bossOf(G.user); const f=fdFin(); G.fdWait=true;
  G.mail=G.mail.filter(m=>m.subj!=='구단주 서신'&&m.subj!==`${G.year} 시즌 구단 목표`); G.stops=(G.stops||[]).filter(m=>m.subj!==`${G.year} 시즌 구단 목표`); G.goals=null;
  /* 비서 업무 안내와 기존 선수단 기준 재정 경고는 드래프트가 끝난 뒤로 미룬다 */ G.mail=G.mail.filter(m=>m.kind!=='업무'&&m.subj!=='재정 압박 구단입니다'); delete t.tight; if(G.tut&&!G.tut.done)G.tut.step=0;
  const L=[`예상 수입 ${money(f.I)} (${f.inc.map(x=>`${x[0]} ${money(x[1])}`).join(', ')})`,`선수 연봉 외 지출 ${money(f.other)} (외국인 선수 예산, 감독·코치, 운영비 등)`,t.indie?'모기업 지원 없음: 수입 안에서 꾸려야 합니다':`모기업 지원 한도 ${money(f.sup)}`,`보유 현금 ${money(f.cash)}`]; { const a=austOn(t); if(a)L.push(`창단 지명 1라운드 ${a.k}순위 조건: ${a.y1}시즌까지 모기업 지원 한도 ${a.d<0?Math.round(-a.d*100)+'% 감액':a.d>0?Math.round(a.d*100)+'% 증액':'그대로'}${a.strict?', 시설·추가 지원 요청 승인 가능성 낮음':''}`); } if(f.res)L.push(`창단 첫해 예비비 ${money(f.res.tot)}: 비어 있는 감독·코치 자리 채용비 ${money(f.res.vac)}과 운영 여유분 ${money(f.res.cush)}을 예산 여유에서 미리 뺐습니다`);
  const verdict=f.avail>=f.cap?`국내 선수 연봉으로 샐러리캡(${money(f.cap)})까지 써도 버틸 수 있습니다.`:f.avail>=f.cap*.75?`국내 선수 연봉은 ${money(f.avail)} 안쪽이 안전합니다. 샐러리캡(${money(f.cap)})을 꽉 채우면 적자입니다.`:`국내 선수 연봉에 쓸 수 있는 돈은 ${money(Math.max(0,f.avail))} 정도입니다. 샐러리캡(${money(f.cap)})보다 한참 적으니, 비싼 선수를 여럿 뽑으면 적자가 납니다.`;
  mail('구단주실',`${B.own.name} 회장: 창단을 함께해 주셔서 반갑습니다`,`${tname(G.user)} 창단 단장으로 와 주셔서 반갑습니다. ${OWNVOICE[t.owner]}\n\n올해 구단 재정 전망입니다.\n${L.map(x=>'· '+x).join('\n')}\n\n${verdict}\n\n리그가 국내 선수 전원을 다시 나누는 창단 드래프트를 엽니다. 선수 연봉과 계약은 그대로 따라오니 재정을 보면서 뽑아 주세요. 준비되면 시작하겠습니다.`,{kind:'구단주',imp:false,acts:[{l:'창단 드래프트 시작',a:'fdBegin'}]});
  addLog(`${tname(G.user)} 창단 단장으로 부임했습니다.`); }

/* 드래프트 언론 보도: 6월 15일 '최대어 TOP 10', 8월 25일 '1라운드 모의 지명'. 언론 순위는 눈에 보이는 성적·구속·체격으로 매긴 것이라 잠재력과 다를 수 있다 */
function draftPressLine(p){ const h=p.am; if(!h)return ''; if(p.isP){ const r=pRate(h); return `ERA ${r.era.toFixed(2)} · 탈삼진 ${h.so}${p.amVelo?` · 최고 ${amVmax(p)}km`:''}`; } const r=bRate(h); return `OPS ${fmt3(r.ops)} · 홈런 ${h.hr}${h.sb>=10?` · 도루 ${h.sb}`:''}`; }
function draftPressNews(day){ if(G.unemp||!G.draftClass||!G.draftClass.length||(G.draft&&!G.draft.done&&G.draft.y===G.year))return;
  const cls=G.draftClass.map(id=>G.players[id]).filter(p=>p&&p.prospect&&p.press).sort((a,b)=>a.press-b.press);
  if(day===KD(6,15)&&cls.length){ const L=cls.slice(0,10).map((p,i)=>`${i+1}. ${p.name}(${p.school||p.region}, ${posLabel(p)}) ${draftPressLine(p)}`);
    for(const p of cls){ const o=fatherOf(p); if(o&&(obMine(o)||o.retNo))news('드래프트',`${o.name}의 아들 ${p.name}, 올해 드래프트에 나온다`,`${obMine(o)?`${tname(G.user)}에서 ${obMineC(o).ys}시즌을 뛴`:`${tshort(o.team)} 출신`}${o.retNo?` 영구결번 ${o.no}번`:''} ${o.name}의 아들 ${p.name}(${p.school||p.region}, ${posLabel(p)})이(가) ${G.year} 신인 드래프트에 나옵니다. 스카우트팀은 '아버지 이름값과 별개로 지켜봐야 할 선수'라고 보고했습니다.`,0,{ref:p.id}); } /* 우리 구단 출신·영구결번 OB의 아들은 드래프트 전에 한 번 알린다(11-09r) */
    news('드래프트',`${G.year} 신인 드래프트 최대어 TOP 10`,`언론이 꼽은 올해 드래프트 상위 10명입니다. 고교·대학 기록과 구속·체격 같은 눈에 보이는 것으로 매긴 순위라, 프로에서 얼마나 클지는 구단 스카우트의 판단이 다를 수 있습니다.\n\n${L.join('\n')}`,0); }
  if(day===KD(8,25)&&cls.length){ const O=draftPickOrder(); const pool=[...cls]; const L=[]; for(const pk of O){ const p=pool.shift(); if(!p)break; L.push(`${pk.no}순위 ${tshort(pk.tid)}: ${p.name}(${p.school||p.region}, ${posLabel(p)})`); }
    const mine=O.find(x=>x.tid===G.user);
    news('드래프트',`${G.year} 신인 드래프트 1라운드 모의 지명`,`지난 시즌 순위 역순으로 정해진 1라운드 순서에, 언론 순위대로 뽑는다고 가정한 예상입니다. 실제로는 구단마다 스카우트 평가와 필요한 자리가 달라 순서가 바뀝니다.\n\n${L.join('\n')}${mine?`\n\n${tname(G.user)}은(는) 1라운드 ${mine.no}순위입니다.`:''}`,0); } }
