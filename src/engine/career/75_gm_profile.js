/* ===== 단장 프로필: 행동으로 만들어지는 스타일 =====
 단장이 실제로 한 일(트레이드·언론 플레이·인터뷰·FA·감독 교체·외국인 교체·업무 위임·영입한 선수 나이)을 기록해
 '트레이드를 자주 한다', '언론 플레이를 즐긴다', '유망주를 선호한다' 같은 스타일과 별명을 붙인다. 다른 구단 단장도 같은 방식으로 기록한다.
 기록은 단장 개인을 따라간다(구단을 옮겨도 이어진다). */
function meInit(){ G.me=G.me||{pp:0,iv:0,ivSkip:0,fa:0,faBig:0,faAmt:0,mgrFire:0,fRep:0,since:G.gmSince??G.year}; return G.me; }
/* 단장 기본 정보(새 게임에서 직접 정한다): 이름·나이·출신·얼굴 */
const GM_BG={player:'선수 출신',scout:'스카우트 출신',data:'전력분석 출신',corp:'모기업 프런트 출신'};
/* 출신에 따른 작은 차이: 처음 취임할 때 한 번(선수 출신의 감독 관계는 감독을 선임할 때마다) */
const GM_BGD={player:'감독을 선임할 때마다 관계 +5, 처음 팬 여론 +3',scout:'다른 구단 단장 9명과 친분 +5로 시작',data:'언론 논조 +3, 우리 전력분석원 충성도 +10으로 시작',corp:'구단주 신뢰 +5로 시작'};
function gmBgApply(){ const P=G.gmP; if(!P||P.bgDone)return; P.bgDone=true; try{ prInit(); const t=team(G.user);
  if(P.bg==='player'){ G.pr.fan=clamp(G.pr.fan+3,0,100); const m=G.mgr[G.user]; if(m&&!m.interim)m.rel=clamp(m.rel+5,0,100); }
  else if(P.bg==='scout'){ for(const o of G.teams)if(o.id!==G.user)o.rel=clamp((o.rel??50)+5,0,100); }
  else if(P.bg==='data'){ G.pr.press=clamp(G.pr.press+3,0,100); for(const a of (typeof anaList==='function'?anaList():[]))a.loy=clamp((a.loy??50)+10,0,100); }
  else if(P.bg==='corp'){ t.trust=clamp((t.trust??55)+5,0,100); } }catch(e){} }
function meName(){ return (G&&G.gmP&&G.gmP.name)||''; }
function meAge(){ const P=G.gmP; return P&&P.age?P.age+(G.year-(P.y0||G.year)):null; }
function meInc(k,n){ if(G.unemp)return; const M=meInit(); M[k]=(M[k]||0)+(n??1); }
/* 다른 구단 단장 기록(사람에게 붙는다: 단장이 바뀌면 새로 시작) */
function gmSt(tid){ const g=tid===G.user?null:team(tid).gm; if(!g)return null; g.st=g.st||{fa:0,faBig:0,mgrFire:0}; return g.st; }
function gmInc(tid,k,n){ if(tid===ME()){ meInc(k,n); return; } const s=gmSt(tid); if(s)s[k]=(s[k]||0)+(n??1); }

function meSeasons(){ const C=G.myC; const n=C&&C.seas?new Set(C.seas.map(s=>s.y)).size:0; return Math.max(1,n+(period()==='season'||period()==='post'?1:0)); }
/* 이 단장(사람)이 한 트레이드: 후임은 취임일부터(검수 11-07: 전임 실적·별명을 물려받음) */
function meTrades(){ const d0=G.gmP&&G.gmP.d0; return (G.trades||[]).filter(t=>t.gi&&(d0==null||(t.d??0)>=d0)); }
function meTradeStats(){ const T=meTrades(); let net=0, best=null, worst=null, yIn=0, oIn=0, aIn=0;
  for(const t of T){ const r=tradeReport(t); if(r){ net+=r.net; if(!best||r.net>best.r.net)best={t,r}; if(!worst||r.net<worst.r.net)worst={t,r}; }
    for(const id of t.gi){ const p=G.players[id]; if(!p)continue; const a=p.age-(G.year-t.y); aIn++; if(a<=24)yIn++; else if(a>=30)oIn++; } }
  return {n:T.length,net,best,worst,yIn,oIn,aIn}; }
function meStats(){ const M=meInit(); const S=meSeasons(); const T=meTradeStats(); const m=G.unemp?null:G.mgr[G.user];
  const autos=typeof AUTO_AREAS!=='undefined'?AUTO_AREAS.filter(([k])=>autoOn(k)).length:0;
  return {S,M,T,mrel:m&&!m.interim?m.rel:null,trust:G.unemp?null:team(G.user).trust,autos,ppS:M.pp/S,trS:T.n/S}; }
/* 스타일 태그: 조건을 넘은 것만, 강한 순 */
function meTags(){ const s=meStats(), M=s.M, T=s.T; const L=[];
  if(M.pp>=3&&s.ppS>=1)L.push({k:'pp',l:'언론 플레이를 즐긴다',d:`언론 플레이 ${M.pp}회(시즌당 ${s.ppS.toFixed(1)}회)`,nick:'입담꾼 단장',w:s.ppS});
  if(M.ivSkip>=3&&M.ivSkip>=M.iv*.4)L.push({k:'quiet',l:'언론과 거리를 둔다',d:`인터뷰 거절 ${M.ivSkip}회 · 응함 ${M.iv}회`,nick:'침묵의 단장',w:M.ivSkip/s.S});
  else if(M.iv>=6&&M.ivSkip<=M.iv*.15)L.push({k:'open',l:'언론 앞에 자주 선다',d:`인터뷰 ${M.iv}회 · 거절 ${M.ivSkip}회`,nick:'',w:.5});
  if(T.n>=4&&s.trS>=2)L.push({k:'tr',l:'트레이드를 자주 한다',d:`트레이드 ${T.n}건(시즌당 ${s.trS.toFixed(1)}건)`,nick:'트레이드 매니아',w:s.trS});
  if(T.n>=3&&T.net>=5)L.push({k:'trw',l:'트레이드에 강하다',d:`트레이드 뒤 WAR 차 합계 +${T.net.toFixed(1)}`,nick:'트레이드 귀재',w:T.net/3});
  else if(T.n>=3&&T.net<=-5)L.push({k:'trl',l:'트레이드에서 자주 손해 본다',d:`트레이드 뒤 WAR 차 합계 ${T.net.toFixed(1)}`,nick:'',w:-T.net/4});
  if(T.aIn>=4&&T.yIn>=T.aIn*.55)L.push({k:'young',l:'유망주를 선호한다',d:`트레이드로 받은 ${T.aIn}명 중 24세 이하 ${T.yIn}명`,nick:'육성 신봉자',w:T.yIn/T.aIn*2});
  else if(T.aIn>=4&&T.oIn>=T.aIn*.55)L.push({k:'now',l:'즉시 전력을 원한다',d:`트레이드로 받은 ${T.aIn}명 중 30세 이상 ${T.oIn}명`,nick:'윈나우 단장',w:T.oIn/T.aIn*2});
  if(M.faBig>=2||M.fa>=4)L.push({k:'fa',l:'FA 시장의 큰손',d:`외부 FA ${M.fa}명 영입 · 대형 계약 ${M.faBig}건`,nick:'큰손 단장',w:M.fa/s.S+M.faBig});
  if(s.mrel!=null&&s.mrel>=72)L.push({k:'mgr',l:'감독과 가깝다',d:`감독과의 관계 ${Math.round(s.mrel)}`,nick:'',w:.8});
  if(M.mgrFire>=2)L.push({k:'mgrF',l:'감독을 자주 바꾼다',d:`감독 경질 ${M.mgrFire}회`,nick:'',w:M.mgrFire/s.S*2});
  if(M.fRep>=3)L.push({k:'fRep',l:'외국인 교체를 망설이지 않는다',d:`시즌 중 외국인 교체 ${M.fRep}회`,nick:'',w:M.fRep/s.S});
  if(s.autos>=5)L.push({k:'deleg',l:'실무를 맡기는 단장',d:`업무 ${s.autos}가지를 비서·팀장에게 넘김`,nick:'',w:.3}); else if(s.autos===0&&s.S>=2)L.push({k:'hands',l:'실무를 손수 챙긴다',d:'반복 업무도 직접 처리',nick:'',w:.3});
  if(s.trust!=null&&s.trust>=72)L.push({k:'trust',l:'구단주의 신임',d:`구단주 신뢰 ${Math.round(s.trust)}`,nick:'',w:.6});
  return L.sort((a,b)=>b.w-a.w); }
function meNick(){ const t=meTags().find(x=>x.nick); return t?t.nick:''; }
/* 다른 구단 단장 */
function aiGmStats(tid){ const t=team(tid), g=t.gm; if(!g)return null; const st=gmSt(tid)||{}; const yrs=Math.max(1,G.year-(g.since??G.year)+1);
  const tr=(G.lgTrades||[]).filter(x=>(x.a===tid||x.b===tid)&&x.y>=(g.since??0)).length+(G.trades||[]).filter(x=>x.with===tid&&x.y>=(g.since??0)).length;
  return {yrs,tr,fa:st.fa||0,faBig:st.faBig||0,mgrFire:st.mgrFire||0}; }
function aiGmTags(tid){ const s=aiGmStats(tid); if(!s)return []; const L=[];
  if(s.tr>=3&&s.tr/s.yrs>=1.5)L.push({l:'트레이드를 자주 한다',d:`재임 ${s.yrs}년 트레이드 ${s.tr}건`});
  if(s.faBig>=2||s.fa>=3)L.push({l:'FA 시장의 큰손',d:`FA ${s.fa}명 영입 · 대형 계약 ${s.faBig}건`});
  if(s.mgrFire>=2)L.push({l:'감독을 자주 바꾼다',d:`감독 교체 ${s.mgrFire}회`});
  if(s.yrs>=6)L.push({l:'장수 단장',d:`재임 ${s.yrs}년`});
  return L; }
/* 기사에서 단장을 부르는 말: 별명이 붙었으면 '트레이드 귀재' 광주 단장처럼 */
function meCall(){ let n=''; try{ n=meNick(); }catch(e){} return n?`'${n}' ${tshort(G.user)} 단장`:`${tshort(G.user)} 단장`; }
/* ===== 단장 세대 교체(100년 플레이): 단장도 나이를 먹는다. 물러날 때 구단·세계는 그대로 두고 후임 단장으로 이어 한다.
 물러난 단장은 G.gmLine(단장 계보)에 남는다. 65세부터 구단주가 해마다 세대 교체를 묻고, 78세가 되는 해 1월 1일에는 구단이 정한 후임에게 넘어간다 */
const GM_SUCC_ASK=65, GM_SUCC_FORCE=78;
function gmSuccInfo(){ const P=G.gmP||{}; const from=Math.min(G.gmSince??(G.myC&&G.myC.y0)??P.y0??G.year,G.year); /* 이 구단 첫 부임 해(재계약 시작 해가 아님, 검수 11-07) */ const H=(G.history||[]).filter(h=>h.y>=from&&h.y<G.year+1);
  return {name:P.name||'단장',face:P.face||null,female:!!P.female,mod:P.mod||null,bg:P.bg||null,tid:G.user,from,to:G.year,age:meAge(),champ:H.filter(h=>h.champ===G.user).length,seas:H.length,rep:G.rep??50}; }
function gmSucceed(np,why){ if(G.unemp||G.user==null||!G.gmP)return '지금은 넘길 수 없습니다.'; if(period()==='season'||period()==='post')return '시즌이 끝난 뒤(10월 말~3월)에 넘길 수 있습니다.';
  if(!np||!np.name||String(np.name).length<2)return '후임 이름을 두 글자 이상 적어 주세요.';
  const old=gmSuccInfo(); if(G.myC){ try{ const S0=myCStats(); old.w=S0.w; old.l=S0.l; old.n=S0.n; }catch(e){} } (G.gmLine=G.gmLine||[]).push(old);
  for(const j of [...(G.jobs||[])])if(!j.done)try{ jobAnswer(j.tid,false,true); }catch(e){} /* 전임에게 온 단장직 제의는 끝낸다(검수 11-07) */
  G.gmP={name:np.name,age:clamp(+np.age||42,30,65),bg:np.bg||'corp',female:!!np.female,face:np.face||('gm'+Math.floor(R()*1e6)),mod:np.mod||null,y0:G.year,d0:G.day,bgDone:false};
  G.me=null; G.gmSince=G.year; G.gmSinceD=G.day; try{ tbTakeSnap(); }catch(e){} /* 후임의 영입 판정·취임 당시 비교는 후임 취임일부터(검수 11-07) */ meInit(); G.personal=null; G.rep=Math.round(clamp(35+((G.rep??50)-50)*.3,30,55)); /* 명성은 사람을 따른다: 후임은 전임 덕을 조금만 본다 */
  const st=(G.myC&&G.myC.stints)||[]; st.unshift({tid:G.user,y0:old.from,y1:G.year,how:`${old.name} 단장 용퇴(${why||'세대 교체'})`}); myCStart(G.user,{yrs:3},'후임 단장 취임'); G.myC.stints=[]; G.myC.seas=[]; G.myC.earn=0; delete G.myC.offer; G.gmJoin=null; void st; /* 새 사람의 경력은 새로 시작(검수 11-07: 전임 승패·우승을 물려받음). 전임 기록은 단장 계보에 */
  gmBgApply(); const t=team(G.user); t.trust=clamp(Math.round(((t.trust??55)+60)/2),0,100);
  chron('join',`${old.name} 단장 퇴임(${old.from}~${old.to}, 우승 ${old.champ}회) · ${G.gmP.name} 단장 취임`,null,G.user);
  try{ news('구단',`${tshort(G.user)}, ${old.name} 단장 용퇴… 후임 ${G.gmP.name}`,`${old.from}년부터 ${old.seas}시즌 동안 구단을 이끈 ${old.name} 단장이 물러났습니다(한국시리즈 우승 ${old.champ}회). 구단은 ${G.gmP.name} 단장에게 다음 시대를 맡깁니다.`,3); }catch(e){}
  mail('구단주실',`${G.gmP.name} 단장 취임`,`${old.name} 단장이 ${old.from}~${old.to}년 ${old.seas}시즌을 마치고 물러났습니다. 이제 ${G.gmP.name} 단장(${G.gmP.age}세)이 구단을 맡습니다.\n선수단·시설·재정·코치진은 그대로 이어집니다. 명성은 새로 쌓아야 합니다(지금 ${G.rep}). 단장 계약은 ${G.myC.y0}~${G.myC.y1}년.\n물러난 단장은 단장 화면의 '단장 계보'에 남습니다.`,{imp:true,kind:'경력'});
  return ''; }
function gmAutoSucc(){ return {name:(()=>{ try{ return genName(); }catch(e){ return '김단장'; } })(),age:ri(40,48),bg:pick(['player','scout','data','corp']),female:R()<.15}; }
/* 1월 1일: 65세부터 해마다 묻고, 78세면 구단이 정한 후임에게 넘긴다(시즌 밖이라 바로 넘길 수 있다) */
function gmAgeYear(){ if(G.unemp||!G.gmP)return; const a=meAge(); if(a==null)return;
  if(a>=GM_SUCC_FORCE){ const r=gmSucceed(gmAutoSucc(),'정년'); if(!r)return; }
  if(a>=GM_SUCC_ASK)mail('구단주실',`세대 교체를 생각해 볼 때입니다`,`단장님이 올해 ${a}세가 됩니다. 원하시면 이번 겨울(3월 개막 전까지) 후임을 직접 정하고 물러날 수 있습니다. 선수단·시설·재정은 그대로 후임에게 이어집니다.\n${GM_SUCC_FORCE}세가 되는 해에는 구단이 정한 후임에게 자동으로 넘어갑니다.`,{kind:'경력',acts:[{l:'후임 정하기',a:'go',v:'me'}]}); }
