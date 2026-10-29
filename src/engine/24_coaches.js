/* ===== 코치진과 감독 사단 =====
 지도력(sk): 1군 경기력에 작게 영향. 육성력(dv): 맡은 선수들의 성장 속도.
 사단: 감독과 함께 다니는 코치 묶음. 같은 사단이면 손발이 맞아 실력이 더 나온다(+6). 고집 센 감독은 남의 코치와 덜 맞는다(-2). */
const CROLE={hc:{l:'수석코치',g:1,d:'감독 보좌 · 선수단 분위기'},pc:{l:'투수코치',g:1,d:'투수 경기력·성장'},bc:{l:'타격코치',g:1,d:'타자 경기력·성장'},cc:{l:'배터리코치',g:1,d:'포수 수비·투수 제구'},rc:{l:'주루·작전코치',g:1,d:'도루·주루'},dc:{l:'수비코치',g:1,d:'내외야 수비'},
  fm:{l:'2군 감독',g:2,d:'2군 선수 전체 성장'},fp:{l:'2군 투수코치',g:2,d:'2군 투수 성장'},fb:{l:'2군 타격코치',g:2,d:'2군 타자 성장'}};
const CKEYS=Object.keys(CROLE);
const CCAR=['프랜차이즈 스타 출신','국가대표 코치 경력','미국 마이너리그 연수','일본 코치 연수','전력분석원 출신','2군에서 오래 지도','우승 코치진 출신','무명 선수 출신 지도자'];
function mkCoach(role,o){ o=o||{}; const sk=clamp(Math.round(N(55,9)+(o.boost||0)),30,88), dv=clamp(Math.round(N(CROLE[role].g===2?57:53,10)+(o.boost||0)*.6),30,88);
  return {id:'c'+Math.floor(R()*1e9),name:genName(),age:ri(36,63),role,sk,dv,car:pick(CCAR),sal:round5(clamp(60+(Math.max(sk,dv)-50)*4.5+N(0,12),45,320)),yrs:0,clan:o.clan||null}; }
function mkClan(m){ // 이름난 감독은 사단을 거느린다
  const n=m.fame>=80?5:m.fame>=70?4:m.fame>=55?2:0; if(!n)return [];
  const roles=['hc',...['pc','bc','cc','rc','dc','fm'].sort(()=>R()-.5)].slice(0,n);
  return roles.map(r=>mkCoach(r,{clan:m.id,boost:3})); }
function coachesOf(tid){ return (G.coach&&G.coach[tid])||{}; }
function effC(c,tid,k){ if(!c)return 45; const m=G.mgr[tid]; let v=c[k||'sk']; if(m&&c.clan&&c.clan===m.id)v+=6; else if(m&&(m.ego||0)>=70)v-=2; return v; }
function clanCount(tid){ const m=G.mgr[tid]; if(!m)return 0; return Object.values(coachesOf(tid)).filter(c=>c&&c.clan===m.id).length; }
function coachInit(){ G.coach=G.coach||{}; G.cmarket=G.cmarket||[];
  for(const t of G.teams){ if(G.coach[t.id])continue; const C={}; const m=G.mgr[t.id]; const clan=m&&t.id!==ME()?(m.clan||(m.clan=mkClan(m))):[];
    for(const k of CKEYS){ const cl=clan.find(c=>c.role===k); C[k]=cl||mkCoach(k); C[k].yrs=ri(1,3); }
    if(t.id===G.user){ for(const k of CKEYS)if(R()<.35)C[k]=null; }
    G.coach[t.id]=C; }
  for(const k in G.mgr){ const m=G.mgr[k]; if(m&&!m.interim&&!m.clan)m.clan=mkClan(m); }
  (G.mmarket||[]).forEach(m=>{ if(!m.clan)m.clan=mkClan(m); });
  if(!G.cmarket.length)refreshCoachMarket(); }
/* 코치 후보: 자리마다 4~5명. 스타 코치(드묾·비쌈), 베테랑, 보통, 젊은 지도자(싸지만 낮음)가 섞인다 */
function mkCandCoach(k){ const x=R(); const c=x<.1?mkCoach(k,{boost:ri(9,15)}):x<.32?mkCoach(k,{boost:ri(3,7)}):x<.78?mkCoach(k):mkCoach(k,{boost:-ri(2,6)});
  if(x>=.78){ c.age=ri(33,41); c.car=pick(['은퇴 2년 차 젊은 지도자','전력분석원 출신','2군 코치 경력 3년','해외 코치 연수 막 마침']); c.sal=round5(Math.max(40,c.sal*.7)); }
  if(x<.1){ c.car=pick(['우승 코치진 출신','국가대표 코치 경력','레전드 선수 출신','타 구단 수석코치 출신']); c.star=true; } return c; }
function refreshCoachMarket(){ const L=[]; for(const k of CKEYS){ const n=ri(6,8); for(let i=0;i<n;i++)L.push(mkCandCoach(k)); } const res=(G.cmarket||[]).filter(c=>c.res===G.user);
  let obc=[]; try{ obc=G.ob?obCands('coach').filter(o=>!res.some(c=>c.ob===o.id)).map(obCoach):[]; }catch(e){} G.cmarket=[...res,...obc,...L]; }
/* 매달 초: 새 후보가 들어오고 오래된 후보 일부는 다른 일을 찾아 떠난다 */
function coachMarketMonth(){ const o=dobj(G.day); const mk=o.y*100+o.m; if(G.cmMonth===mk)return; G.cmMonth=mk; G.cmarket=G.cmarket||[];
  const leave=G.cmarket.filter(()=>R()<.12).map(c=>c.id); G.cmarket=G.cmarket.filter(c=>!leave.includes(c.id)); const n=ri(3,5); for(let i=0;i<n;i++)G.cmarket.push(mkCandCoach(pick(CKEYS)));
  if(G.cmarket.length>90)G.cmarket=G.cmarket.slice(-90); }
function coachSal(tid){ return sum(Object.values(coachesOf(tid)).filter(Boolean).map(c=>c.sal)); }
/* 경기력: 타석 결과에 더하는 보정(보통 ±1 안팎) */
function coachBoost(p){ const C=coachesOf(p.team); if(!C)return 0; const tid=p.team; const z=(c,k)=>(effC(c,tid,k)-55)/25;
  let b=z(C.hc)*.15; if(p.isP)b+=z(C.pc)*.45+z(C.cc)*.15; else b+=z(C.bc)*.45; return b; }
/* 올해 출전 중 1군 비율(타자 타석, 투수 아웃카운트). 기록이 없으면 2군에서 보낸 것으로 본다 */
function oneShare(p){ const y=G.year; const a=seasonTotal(p,y,'1군'), f=seasonTotal(p,y,'퓨처스'); const k=p.isP?'outs':'pa'; const x=(a&&a[k])||0, z=(f&&f[k])||0; return x+z>0?x/(x+z):0; }
function coachDevMult(p){ // 성장 배율: 1군에서 많이 뛴 선수는 1군 코치, 아니면 2군 코치진
  if(p.team==null)return 1; const C=coachesOf(p.team); const tid=p.team; const s=oneShare(p); /* 1군 출전 비율(playShare는 성장 가중치라 최소 0.8이어서 1·2군 구분에 쓸 수 없다) */
  const v1=(p.isP?effC(C.pc,tid,'dv')*.65+effC(C.cc,tid,'dv')*.1:effC(C.bc,tid,'dv')*.75)+effC(C.hc,tid,'dv')*.25, v2=(p.isP?effC(C.fp,tid,'dv'):effC(C.fb,tid,'dv'))*.6+effC(C.fm,tid,'dv')*.4;
  const v=v1*s+v2*(1-s);
  return clamp(1+(v-55)/110,.7,1.35)*(G.mentor&&G.mentor.y===G.year&&p.team===G.user&&p.age<=24?1.05:1); }
function hireCoach(id,years){ const c=(G.cmarket||[]).find(x=>x.id===id); if(!c)return '후보가 없습니다.'; const C=G.coach[G.user]; const old=C[c.role];
  if(old){ const pay=Math.round(old.sal*Math.max(0,old.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; addLog(`${CROLE[c.role].l} ${old.name}와(과) 결별했습니다(잔여 연봉 정산 ${money(pay)}).`); old.yrs=0; old.clan=null; G.cmarket.push(old); }
  c.yrs=years; C[c.role]=c; G.cmarket=G.cmarket.filter(x=>x.id!==id); obHireBonus(c.ob,CROLE[c.role].l); addLog(`${CROLE[c.role].l}로 ${c.name}을(를) ${years}년 연 ${money(c.sal)}에 영입했습니다.`); return ''; }
function fireCoach(role){ const C=G.coach[G.user]; const c=C[role]; if(!c)return; const pay=Math.round(c.sal*Math.max(0,c.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; C[role]=null; c.yrs=0; c.clan=null; G.cmarket.push(c); addLog(`${CROLE[role].l} ${c.name}을(를) 내보냈습니다(잔여 연봉 정산 ${money(pay)}).`); }
function clanSev(m){ const C=G.coach&&G.coach[G.user]; if(!C)return 0; return sum((m.clan||[]).map(c=>{ const o=C[c.role]; return o?Math.round(o.sal*Math.max(0,o.yrs-.5)*.5):0; })); }
function hireClan(m,years){ // 감독과 함께 사단 코치를 데려온다
  const C=G.coach[G.user]; const got=[];
  for(const c of (m.clan||[])){ const old=C[c.role]; if(old){ const pay=Math.round(old.sal*Math.max(0,old.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; old.yrs=0; old.clan=null; G.cmarket.push(old); } c.yrs=years; C[c.role]=c; got.push(`${CROLE[c.role].l} ${c.name}`); }
  if(got.length)addLog(`${m.name} 감독 사단 합류: ${got.join(', ')}`); return got; }
function clanLeave(m){ // 감독이 떠나면 사단 코치 상당수가 함께 떠난다
  if(!m||!m.id)return []; const C=G.coach[G.user]; const out=[]; for(const k of CKEYS){ const c=C[k]; if(c&&c.clan===m.id&&R()<.7){ C[k]=null; out.push(`${CROLE[k].l} ${c.name}`); } } return out; }
function coachYear(){ // 겨울: 계약 정리
  for(const t of G.teams){ const C=G.coach[t.id]; if(!C)continue; for(const k of CKEYS){ const c=C[k]; if(!c)continue; { const o=c.ob&&G.ob?G.ob.find(x=>x.id===c.ob):null; if(o)c.age=o.age; else c.age++; } /* OB 출신은 OB 기록의 나이를 따른다(OB 연간 처리에서 이미 한 살 먹음) */ c.yrs--; if(c.yrs<=0){ if(t.id===ME()){ C[k]=null; c.from=G.user; c.fromY=G.year; G.cmarket.push(c); } else if((c.age||0)<70&&R()<.55)c.yrs=ri(1,2); else { if(c.age<62&&!c.ob){ c.yrs=0; c.clan=null; c.from=t.id; c.fromY=G.year; G.cmarket.push(c); } C[k]=obAiCoach(t.id,k)||mkCoach(k); if(!C[k].yrs)C[k].yrs=ri(1,3); } } } }
  const kept=(G.cmarket||[]).filter(c=>c.fromY===G.year); refreshCoachMarket(); { const ko=new Set(kept.map(c=>c.ob).filter(Boolean)); G.cmarket=G.cmarket.filter(c=>!(c.ob&&ko.has(c.ob))); } /* 계약이 끝난 OB 코치는 원래 보직 그대로 한 번만 후보에 오른다 */ G.cmarket=G.cmarket.concat(kept.filter(c=>c.age<64)); const C=G.coach[G.user]; const empty=CKEYS.filter(k=>!C[k]); if(empty.length)mail('운영팀','코치 자리가 비어 있습니다',`계약이 끝나거나 떠나서 ${empty.map(k=>CROLE[k].l).join(', ')} 자리가 비었습니다. 스태프·육성 → 코치진에서 채워 주세요.`,{imp:true,kind:'감독',acts:[{l:'코치진 보기',a:'go',v:'staff:coach'}]}); }
function coachGrade(tid){ const C=coachesOf(tid); const g=(ks,k)=>{ const v=avg(ks.map(r=>effC(C[r],tid,k))); return {v:Math.round(v),l:v>=66?'A':v>=59?'B':v>=52?'C':'D'}; };
  return {bat:g(['bc','hc'],'sk'),pit:g(['pc','cc'],'sk'),run:g(['rc'],'sk'),def:g(['dc','cc'],'sk'),dev1:g(['pc','bc','hc'],'dv'),dev2:g(['fm','fp','fb'],'dv')}; }

