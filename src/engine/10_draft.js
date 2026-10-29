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
function draftLevelAdj(){ const m=lgMeanDom(); if(m==null)return 0; if(G.lgBase==null){ G.lgBase=+m.toFixed(2); return 0; } return clamp((m-G.lgBase)*1.6,-3,6); }
function makeDraftClass(){
  const cls=[]; const lvAdj=draftLevelAdj();
  for(let i=0;i<DRAFT_POOL;i++){
    const college=R()<.3; const age=college?22:18; const T=clamp(N(44,9)+(R()<.06?rnd(4,9):0)-lvAdj,26,79); /* 해마다 리그 상위권(60+)으로 클 재목이 7~8명 섞인다. 사실성보다 '대어'가 꾸준히 나오는 쪽을 택했다 */
    const cur=clamp(T-(27-age)*rnd(2.2,3.4),20,60);
    const b=newPlayer({age,base:cur,pot:T,college}); b.prospect=true;
    b.school=pick(SCH_CITY[b.region])+(college?pick(SCH_UN):pick(SCH_HS)); b.schoolHue=Math.floor(u01('sh',b.school)*360);
    b.ht=Math.round(clamp(N(b.isP?184:179,5),168,198)); b.wt=Math.round(clamp(b.ht-100+N(b.isP?-1:-3,6),62,112));
    if(b.isP)b.amVelo=veloOf(b)-(college?ri(1,3):ri(3,6)); else b.amRun=(+runOf(b)+.04).toFixed(2);
    if(b.inj>.22&&R()<.65)b.amInj=pick(b.isP?AM_INJ_P:AM_INJ_B);
    const lvl=rnd(14.5,19.5); b.amLevel=lvl>18.5?'약팀 상대 비중이 큼':lvl<15.5?'강팀 상대 비중이 큼':'';
    amHistory(b,lvl);
    cls.push(b.id);
  }
  /* 즉시 전력 신인: 해마다 상위 재목 몇 명은 1년차부터 1군 주전급이다(실제 KBO도 매년 2~4명은 첫해부터 자리를 잡는다).
     잠재력 상위 5명 중 55%가 완성형이 되고, 35% 확률로 리그 정상급으로 클 특급이 하나 나온다 */
  { const top=cls.map(id=>G.players[id]).filter(p=>p.pot>=54).sort((a,b)=>b.pot-a.pot).slice(0,5);
    for(const p of top){ if(R()<.55){ const t=clamp(p.pot-rnd(4,9),47,56); if(ovr(p)<t){ setOvr(p,t); p.ready=true; } } }
    if(top[0]&&R()<.35){ const p=top[0]; p.pot=clamp(p.pot+rnd(3,7),60,79); setOvr(p,clamp(p.pot-rnd(5,9),53,60)); p.ready=true; p.dt=R()<.5?'early':'norm'; }
    for(const p of top.filter(q=>q.ready)){ amHistory(p,rnd(14.5,19.5)); if(p.isP)p.amVelo=veloOf(p)-(p.college?ri(0,2):ri(1,4)); else p.amRun=(+runOf(p)+.04).toFixed(2); } }
  // 언론 평가: 눈에 보이는 성적과 체격·구속만으로 매긴 순위
  /* 투수와 타자는 척도가 달라 각자 안에서 표준점수로 바꾼 뒤 합친다(그래야 언론 상위권에 투수와 타자가 섞인다) */
  const raw=cls.map(id=>G.players[id]).map(p=>{ const h=p.am; let s;
    if(p.isP){ const r=pRate(h); s=-r.era*6+(h.so/Math.max(1,h.outs/3))*9*1.4+((p.amVelo||veloOf(p))-140)*1.2; }
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
function migrateDraft(){
  if(!G)return; try{ mailMigrate(); }catch(e){} try{ nameMigrate(); }catch(e){} try{ gmInit(); }catch(e){} if(!G.coach){ try{ coachInit(); }catch(e){} } if(G.goals&&!G.goals.v&&G.goals.y===G.year){ try{ const t=team(G.user); const base=projSupport(); const mm=t.owner==='profit'?.85:t.owner==='pr'?1:1.15; G.goals.sup=Math.max(G.goals.sup,Math.round(clamp(base*mm+.05,.2,1)*100)/100); }catch(e){} G.goals.v=2; } if(G.spend&&G.spend.coach==null)G.spend.coach=0; G.shortlist=G.shortlist||[]; for(const t of G.teams||[]){ const d=TEAM_DEF.find(x=>x.code===t.code); if(d)t.hue=d.hue; }
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
  if(foreignOpen())refreshFMarket(0); /* 매주 최소 후보 수를 채운다 */
  if(!(G.draft&&!G.draft.done)&&(!G.draftClass||G.draftClass.length<DRAFT_POOL-10||G.draftClass.some(id=>G.players[id]&&!G.players[id].school))){
    for(const id of (G.draftClass||[])){ const p=G.players[id]; if(p&&p.prospect)delete G.players[id]; }
    if(G.draft&&G.draft.done&&G.draft.cls)G.draft.cls=[]; makeDraftClass(); }
}
function startDraft(){
  const last=G.history[G.history.length-1].order; const order=[...last].reverse().map(o=>o.tid);
  /* 경쟁균형세 3회 연속 초과 구단은 1라운드 지명 순서가 9단계 내려간다 */
  const o1=[...order]; for(const t of G.teams){ if(t.pickPen!==G.year)continue; const i=o1.indexOf(t.id); if(i<0)continue; o1.splice(i,1); o1.splice(Math.min(o1.length,i+9),0,t.id); if(t.id===G.user)note('드래프트','경쟁균형세 3회 연속 초과로 1라운드 지명 순서가 9단계 내려갔습니다.'); }
  const picks=[]; for(let r=0;r<DRAFT_ROUNDS;r++)(r===0?o1:order).forEach((tid,i)=>picks.push({rd:r+1,no:i+1,tid,pid:null}));
  G.draft={cls:G.draftClass||[],picks,cur:0,done:false,y:G.year};
  stop('드래프트',`${G.year} 신인 드래프트가 열립니다. 참가 ${G.draft.cls.length}명 중 ${DRAFT_ROUNDS}라운드 ${picks.length}명을 지명합니다. 순서는 지난 시즌 성적의 역순이고, 우리 첫 지명은 ${order.indexOf(G.user)+1}순위입니다. 3라운드부터는 지명을 건너뛸 수 있습니다.`);
}
/* 드래프트 성적표: 한 해 지명자 전체의 현재 모습 */
function draftTidOf(p){ const st=(p.story||[]).find(x=>x.k==='draft'); if(!st)return null; const t=G.teams.find(t=>st.t.includes(tname(t.id))); return t?t.id:null; }
function draftClass(y){ const L=(G.dlog&&G.dlog[y])||Object.values(G.players).filter(p=>p.draft&&p.draft.y===y).map(p=>({id:p.id,nm:p.name,t:p.draft.tid??draftTidOf(p),rd:p.draft.rd,no:p.draft.no,pos:posLabel(p),pr:p.press||null}));
  return L.map(x=>{ const p=G.players[x.id]; const c=p?careerOf(p):null; return Object.assign({},x,{p,war:c?c.war:0,now:p?p.team:null,ovr:p?Math.round(ovr(p)):null,n:(x.rd-1)*10+x.no}); }); }
function draftGrades(y){ const L=draftClass(y); const by={}; for(const x of L){ const t=x.t??(x.p&&x.p.draft?null:null); if(t==null)continue; by[t]=(by[t]||0)+x.war; } const arr=Object.entries(by).map(([t,v])=>({t:+t,v})).sort((a,b)=>b.v-a.v); return arr; }
/* 지명 3년·5년 뒤 돌아보기: 스틸픽과 실패한 상위 지명 */
function draftRetro(){ const now=G.year; for(const back of [3,5]){ const y=now-back; const L=draftClass(y).filter(x=>x.p); if(L.length<20)continue;
  const top=[...L].sort((a,b)=>b.war-a.war); const steal=top.find(x=>x.n>=15&&x.war>=3&&top.indexOf(x)<5); const bust=L.filter(x=>x.n<=3&&x.war<.5).sort((a,b)=>a.war-b.war)[0];
  if(steal)news('분석',`${y} 드래프트 ${back}년 뒤: ${steal.n}순위 ${steal.nm}, 최고의 스틸픽`,`${tname(steal.t)}이(가) ${steal.rd}라운드 ${steal.no}순위로 뽑은 ${steal.nm}이(가) 통산 WAR ${steal.war.toFixed(1)}로 같은 해 지명자 중 ${top.indexOf(steal)+1}위입니다.`,steal.t===G.user?2:0,{ref:steal.id});
  if(bust)news('분석',`${y} 드래프트 ${back}년 뒤: ${bust.n}순위 ${bust.nm}, 아직 물음표`,`${tname(bust.t)}이(가) 전체 ${bust.n}순위로 뽑은 ${bust.nm}의 통산 WAR는 ${bust.war.toFixed(1)}입니다. 같은 해 최고는 ${top[0].nm}(${top[0].war.toFixed(1)}).`,bust.t===G.user?-2:0,{ref:bust.id});
  const mine=L.filter(x=>x.t===G.user); if(mine.length){ const g=draftGrades(y); const rk=g.findIndex(x=>x.t===G.user)+1; note('드래프트',`${y} 드래프트 ${back}년 뒤 성적표: 우리 지명자 통산 WAR 합 ${mine.reduce((a,x)=>a+x.war,0).toFixed(1)}, 리그 ${rk||'-'}위. 영입·계약 → 신인 드래프트 → 성적표에서 자세히 볼 수 있습니다.`); } } }

/* 창단 드래프트 전 재정 전망: 국내 선수 연봉을 뺀 나머지 지출과 수입으로 '선수 연봉에 쓸 수 있는 돈'을 계산 */
function fdFin(tid){ const u0=G.user; if(tid!=null)G.user=tid; try{ const t=team(G.user); const b=budget(); const dom=sum(b.exp.filter(x=>x[2]==='pay').map(x=>x[1])); const other=b.E-dom; const sup=t.indie?0:b.cap;
    return {inc:b.inc,I:b.I,other,otherRows:b.exp.filter(x=>x[2]!=='pay'),sup,cash:t.cash,avail:b.I+sup-other-(G.fd&&!G.fd.done?foundReserve().tot:0),res:G.fd&&!G.fd.done?foundReserve():null,cap:capOf(G.year),indie:!!t.indie,owner:t.owner,market:t.market}; } finally{ G.user=u0; } }
function fdWelcome(){ const t=team(G.user); const B=bossOf(G.user); const f=fdFin(); G.fdWait=true;
  G.mail=G.mail.filter(m=>m.subj!=='구단주 서신'&&m.subj!==`${G.year} 시즌 구단 목표`); G.stops=(G.stops||[]).filter(m=>m.subj!==`${G.year} 시즌 구단 목표`); G.goals=null;
  /* 비서 업무 안내와 기존 선수단 기준 재정 경고는 드래프트가 끝난 뒤로 미룬다 */ G.mail=G.mail.filter(m=>m.kind!=='업무'&&m.subj!=='재정 압박 구단입니다'); delete t.tight; if(G.tut&&!G.tut.done)G.tut.step=0;
  const L=[`예상 수입 ${money(f.I)} (${f.inc.map(x=>`${x[0]} ${money(x[1])}`).join(', ')})`,`선수 연봉 외 지출 ${money(f.other)} (외국인 선수 예산, 감독·코치, 운영비 등)`,t.indie?'모기업 지원 없음: 수입 안에서 꾸려야 합니다':`모기업 지원 한도 ${money(f.sup)}`,`보유 현금 ${money(f.cash)}`]; if(f.res)L.push(`창단 첫해 예비비 ${money(f.res.tot)}: 비어 있는 감독·코치 자리 채용비 ${money(f.res.vac)}과 운영 여유분 ${money(f.res.cush)}을 예산 여유에서 미리 뺐습니다`);
  const verdict=f.avail>=f.cap?`국내 선수 연봉으로 샐러리캡(${money(f.cap)})까지 써도 버틸 수 있습니다.`:f.avail>=f.cap*.75?`국내 선수 연봉은 ${money(f.avail)} 안쪽이 안전합니다. 샐러리캡(${money(f.cap)})을 꽉 채우면 적자입니다.`:`국내 선수 연봉에 쓸 수 있는 돈은 ${money(Math.max(0,f.avail))} 정도입니다. 샐러리캡(${money(f.cap)})보다 한참 적으니, 비싼 선수를 여럿 뽑으면 적자가 납니다.`;
  mail('구단주실',`${B.own.name} 회장: 창단을 함께해 주셔서 반갑습니다`,`${tname(G.user)} 창단 단장으로 와 주셔서 반갑습니다. ${OWNVOICE[t.owner]}\n\n올해 구단 재정 전망입니다.\n${L.map(x=>'· '+x).join('\n')}\n\n${verdict}\n\n리그가 국내 선수 전원을 다시 나누는 창단 드래프트를 엽니다. 선수 연봉과 계약은 그대로 따라오니 재정을 보면서 뽑아 주세요. 준비되면 시작하겠습니다.`,{kind:'구단주',imp:false,acts:[{l:'창단 드래프트 시작',a:'fdBegin'}]});
  addLog(`${tname(G.user)} 창단 단장으로 부임했습니다.`); }

/* 드래프트 언론 보도: 6월 15일 '최대어 TOP 10', 8월 25일 '1라운드 모의 지명'. 언론 순위는 눈에 보이는 성적·구속·체격으로 매긴 것이라 잠재력과 다를 수 있다 */
function draftPressLine(p){ const h=p.am; if(!h)return ''; if(p.isP){ const r=pRate(h); return `ERA ${r.era.toFixed(2)} · 탈삼진 ${h.so}${p.amVelo?` · 최고 ${p.amVelo}km`:''}`; } const r=bRate(h); return `OPS ${fmt3(r.ops)} · 홈런 ${h.hr}${h.sb>=10?` · 도루 ${h.sb}`:''}`; }
function draftPressNews(day){ if(G.unemp||!G.draftClass||!G.draftClass.length||(G.draft&&!G.draft.done&&G.draft.y===G.year))return;
  const cls=G.draftClass.map(id=>G.players[id]).filter(p=>p&&p.prospect&&p.press).sort((a,b)=>a.press-b.press);
  if(day===KD(6,15)&&cls.length){ const L=cls.slice(0,10).map((p,i)=>`${i+1}. ${p.name}(${p.school||p.region}, ${posLabel(p)}) ${draftPressLine(p)}`);
    news('드래프트',`${G.year} 신인 드래프트 최대어 TOP 10`,`언론이 꼽은 올해 드래프트 상위 10명입니다. 고교·대학 기록과 구속·체격 같은 눈에 보이는 것으로 매긴 순위라, 프로에서 얼마나 클지는 구단 스카우트의 판단이 다를 수 있습니다.\n\n${L.join('\n')}`,0); }
  if(day===KD(8,25)&&cls.length){ const O=draftPickOrder(); const pool=[...cls]; const L=[]; for(const pk of O){ const p=pool.shift(); if(!p)break; L.push(`${pk.no}순위 ${tshort(pk.tid)}: ${p.name}(${p.school||p.region}, ${posLabel(p)})`); }
    const mine=O.find(x=>x.tid===G.user);
    news('드래프트',`${G.year} 신인 드래프트 1라운드 모의 지명`,`지난 시즌 순위 역순으로 정해진 1라운드 순서에, 언론 순위대로 뽑는다고 가정한 예상입니다. 실제로는 구단마다 스카우트 평가와 필요한 자리가 달라 순서가 바뀝니다.\n\n${L.join('\n')}${mine?`\n\n${tname(G.user)}은(는) 1라운드 ${mine.no}순위입니다.`:''}`,0); } }
