/* ===== 코치진과 감독 사단 =====
 지도력(sk): 1군 경기력에 작게 영향. 육성력(dv): 맡은 선수들의 성장 속도.
 사단: 감독과 함께 다니는 코치 묶음. 같은 사단이면 손발이 맞아 실력이 더 나온다(+6). 고집 센 감독은 남의 코치와 덜 맞는다(-2). */
const CROLE={hc:{l:'수석코치',g:1,d:'감독 보좌 · 선수단 분위기'},pc:{l:'투수코치',g:1,d:'투수 경기력·성장'},bc:{l:'타격코치',g:1,d:'타자 경기력·성장'},cc:{l:'배터리코치',g:1,d:'포수 수비 성장·볼 배합·투수 제구'},rc:{l:'주루·작전코치',g:1,d:'주루 성장·도루·추가 진루 판단'},dc:{l:'수비코치',g:1,d:'내외야 수비'},
  fm:{l:'2군 감독',g:2,d:'2군 선수 전체 성장'},fp:{l:'2군 투수코치',g:2,d:'2군 투수 성장'},fb:{l:'2군 타격코치',g:2,d:'2군 타자 성장'}};
const CKEYS=Object.keys(CROLE);
const CCAR=['프랜차이즈 스타 출신','국가대표 코치 경력','미국 마이너리그 연수','일본 코치 연수','전력분석원 출신','2군에서 오래 지도','우승 코치진 출신','무명 선수 출신 지도자'];
/* 코치 세부 능력(20~80): 자리마다 보는 능력이 다르다. 지도력(sk)·육성력(dv)은 맡은 자리의 세부 능력에서 나온다.
   훈련 집중 항목은 그 항목의 지도 능력(60%)과 유망주 육성(40%)이 성장 속도를 정한다. 소통은 수석코치일 때 선수단 기분에, 데이터 분석은 지도력에 조금 들어간다 */
const CAB={stf:'구위 지도',ctl:'제구 지도',sta:'체력 관리',con:'컨택 지도',pow:'장타 지도',eye:'선구 지도',def:'수비 지도',spd:'주루 지도',cat:'포수 지도',yng:'유망주 육성',com:'소통',ana:'데이터 분석'};
const CDOM={pc:['stf','ctl','sta'],fp:['stf','ctl','sta'],cc:['cat','ctl'],bc:['con','pow','eye'],fb:['con','pow','eye'],rc:['spd'],dc:['def'],hc:['com','ana'],fm:['yng','com']};
function coachSync(c){ const a=c.ab, D=CDOM[c.role]; const dom=avg(D.map(k=>a[k])); c.sk=Math.round(clamp(dom*.8+a.ana*.2,30,90)); c.dv=Math.round(clamp(dom*.5+a.yng*.5,30,90)); }
/* 예전 저장의 코치: 지금 지도력·육성력은 그대로 두고 세부 능력만 그에 맞춰 나눈다 */
function cAb(c){ if(!c)return null; if(c.ab)return c.ab; const h=k=>hn('cab'+k,String(c.id)); const D=CDOM[c.role]||[]; const a={};
  for(const k in CAB)a[k]=clamp(Math.round(46+h(k)*7),25,85); D.forEach(k=>a[k]=clamp(Math.round(c.sk+h('d'+k)*6),25,88)); a.yng=clamp(Math.round(c.dv*2-avg(D.map(k=>a[k]))),25,88); c.ab=a; return a; }
function cGrow(c,d){ cAb(c); for(const k of CDOM[c.role].concat('yng'))c.ab[k]=clamp(c.ab[k]+d,25,90); c.sk=clamp(c.sk+d,30,90); c.dv=clamp(c.dv+d,30,90); }
function mkCoach(role,o){ o=o||{}; const b=o.boost||0; const L=N(53,8)+b; const a={}; for(const k in CAB)a[k]=N(45,7); const D=CDOM[role];
  for(const k of D)a[k]=L+N(0,4); if(D.length>=2){ const s=pick(D); a[s]+=rnd(5,12); if(R()<.5){ const w=pick(D.filter(x=>x!==s)); a[w]-=rnd(3,9); } } else a[D[0]]+=rnd(0,6); /* 같은 자리라도 잘하는 분야가 다르다 */
  a.yng=N(CROLE[role].g===2?57:51,9)+b*.6; a.com=N(50,9)+(role==='hc'||role==='fm'?b*.4:0); a.ana=N(48,10)+(role==='hc'?b*.4:0);
  if(R()<.3){ const x=pick(Object.keys(CAB).filter(k=>!D.includes(k)&&k!=='yng')); a[x]+=rnd(8,15); } /* 자리 밖에도 강점이 있는 코치 */
  for(const k in a)a[k]=clamp(Math.round(a[k]),25,85);
  const c={id:'c'+Math.floor(R()*1e9),name:genName(),age:ri(36,63),role,ab:a,car:pick(CCAR),yrs:0,clan:o.clan||null}; coachSync(c); c.sal=round5(clamp(60+(Math.max(c.sk,c.dv)-50)*4.5+N(0,12),45,320)); return staffAttach(c,'coach'); }
/* 항목 지도 65% + 유망주 육성 25% + 소통 10%, 사단·관계·멘탈 보정. */
function trnCoachV(c,tid,k){ if(!c)return 45; const a=cAb(c); const base=(a[k]??c.dv)*.65+a.yng*.25+a.com*.1; return (base+(effC(c,tid,'dv')-c.dv))*staffQuality(c,'coach',tid); }
/* 잘하는 분야·약한 분야 */
function cStrong(c){ const a=cAb(c); return Object.keys(CAB).filter(k=>a[k]>=60).sort((x,y)=>a[y]-a[x]).slice(0,2); }
function cWeak(c){ const a=cAb(c); return (CDOM[c.role]||[]).filter(k=>a[k]<45); }
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
function coachMarketMonth(){ const o=dobj(G.day); const mk=o.y*100+o.m; if(G.cmMonth===mk)return; G.cmMonth=mk;
  if(o.m===8&&!G.unemp&&G.coach&&G.coach[G.user]&&G.cExpY!==G.year){ G.cExpY=G.year; const L=CKEYS.filter(k=>{ const c=G.coach[G.user][k]; return c&&c.yrs<=1; }); if(L.length)mail('운영팀','올해로 계약이 끝나는 코치',`${L.map(k=>{ const c=G.coach[G.user][k]; return `${CROLE[k].l} ${c.name}(${c.age}세)`; }).join(', ')}의 계약이 올 시즌으로 끝납니다. 남기려면 시즌이 끝나기 전에 코치진 화면에서 연장하세요. 그대로 두면 겨울에 코치 시장으로 나갑니다.`,{kind:'감독',acts:[{l:'코치진 보기',a:'go',v:'staff:coach'}]}); } G.cmarket=G.cmarket||[];
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
/* 계약 시작 시즌: 정규시즌이 끝난 뒤(9월 이후) 맺은 계약은 다음 시즌부터 센다. 그래서 이번 겨울 차감에서 빠진다(cs: 시작 시즌) */
function ctStartS(){ return (dobj(G.day).m>=9&&G.cal&&G.day>G.cal.end)?G.year+1:G.year; }
function staffCt(x,years,start){ x.yrs=years; x.cs=start??ctStartS(); x.ce=x.cs+years-1; return x; }
/* 연장은 기존 시작 시즌을 유지한다. 옛 저장은 현재 잔여 기간으로 종료 시즌을 복원한다. */
function staffCtExtend(x,add){ const left=Math.max(0,x.yrs); if(!left)return staffCt(x,add);
  if(x.ce==null){ if(x.cs==null)x.cs=G.rolled===G.year?G.year+1:G.year; x.ce=x.cs+left-1; } x.ce+=add; x.yrs=left+add; return x; }
const ctSeasonsTxt=n=>{ const s=ctStartS(); return n>1?`${s}~${s+n-1} 시즌`:`${s} 시즌`; };
function hireCoach(id,years){ const c=(G.cmarket||[]).find(x=>x.id===id); if(!c)return '후보가 없습니다.'; const C=G.coach[G.user]; const old=C[c.role];
  if(old){ const pay=Math.round(old.sal*Math.max(0,old.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; addLog(`${CROLE[c.role].l} ${old.name}와(과) 결별했습니다(잔여 연봉 정산 ${money(pay)}).`); old.yrs=0; old.clan=null; G.cmarket.push(old); }
  staffCt(c,years); C[c.role]=c; G.cmarket=G.cmarket.filter(x=>x.id!==id); try{ obTaken(c.ob,c); }catch(e){} obHireBonus(c.ob,CROLE[c.role].l); addLog(`${CROLE[c.role].l}로 ${c.name}을(를) ${years}년(${ctSeasonsTxt(years)}) 연 ${money(c.sal)}에 영입했습니다.`); return ''; }
function fireCoach(role){ const C=G.coach[G.user]; const c=C[role]; if(!c)return; const pay=Math.round(c.sal*Math.max(0,c.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; C[role]=null; c.yrs=0; c.clan=null; G.cmarket.push(c); addLog(`${CROLE[role].l} ${c.name}을(를) 내보냈습니다(잔여 연봉 정산 ${money(pay)}).`); }
/* 코치 중도 재계약: 계약 중 언제든 1~2년 연장(계약은 최대 4년). 연장 1년마다 연봉 3%(스타 코치 6%) 인상. 64세 이상은 은퇴를 생각해 1년만. 한 해 한 번 */
function coachExtTerms(role,add){ const c=coachesOf(G.user)[role]; if(!c)return null; const sal=round5(c.sal*(1+(c.star?.06:.03)*add)); let why='';
  if(c.extY===G.year)why=`${c.name} 코치와는 올해 이미 계약을 손봤습니다.`; else if(c.age>=64&&add>1)why=`${c.name} 코치(${c.age}세)는 은퇴를 생각하고 있어 1년만 연장합니다.`; else if(c.yrs+add>4)why='코치 계약은 최대 4년까지입니다.';
  return {c,add,sal,why}; }
function extendCoach(role,add){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; const T=coachExtTerms(role,+add); if(!T)return '그 자리에 코치가 없습니다.'; if(T.why)return T.why; const c=T.c;
  staffCtExtend(c,T.add); c.sal=T.sal; c.extY=G.year; addLog(`${CROLE[role].l} ${c.name}와(과) ${T.add}년 연장 계약했습니다(연 ${money(c.sal)}, 계약 ${c.yrs}년 남음).`); return ''; }
/* 우리 코치 승격(PROMO): 2군 투수·타격코치는 1군 같은 자리로, 1군 코치·2군 감독은 수석코치로. 연봉 15% 인상.
   올라갈 자리에 코치가 있으면 그 코치는 비게 되는 자리로 옮긴다(보직 맞교환, 연봉 그대로). 그 코치가 감독 사단이면 감독 관계가 조금 떨어진다. 같은 해 두 번 승격하지 않는다 */
function promoteTerms(role){ const C=coachesOf(G.user); const c=C[role]; const to=PROMO[role]; if(!c||!to)return null; return {c,to,sal:round5(c.sal*1.15),old:C[to]||null,why:c.prY===G.year?`${c.name} 코치는 올해 이미 승격했습니다.`:''}; }
function promoteCoach(role){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; const C=G.coach&&G.coach[G.user]; if(!C||!C[role])return '그 자리에 코치가 없습니다.'; const T=promoteTerms(role); if(!T)return `${CROLE[role].l}보다 높은 코치 자리는 없습니다(감독 선임은 감독 화면에서).`; if(T.why)return T.why;
  const {c,to,old}=T; staffAttach(c,'coach');if(old)staffAttach(old,'coach'); c.sal=T.sal; c.prY=G.year; c.role=to; coachSync(c); C[to]=c; C[role]=null; let note=''; /* 새 보직의 세부 능력으로 지도력·육성력을 다시 계산 */
  if(old){ old.role=role; coachSync(old); C[role]=old; const m=G.mgr[G.user]; if(m&&!m.interim&&old.clan&&old.clan===m.id){ m.rel=clamp(m.rel-4,0,100); note=` ${m.name} 감독 사단인 ${old.name} 코치가 밀려나 감독이 서운해합니다(관계 -4).`; } }
  const msg=`${c.name} 코치를 ${CROLE[to].l}로 승격했습니다(연 ${money(c.sal)}).${old?` 기존 ${CROLE[to].l} ${old.name}은(는) ${CROLE[role].l}로 옮겼습니다.`:` ${CROLE[role].l} 자리는 비었습니다.`}${note}`; addLog(msg); return {msg}; }
function clanSev(m){ const C=G.coach&&G.coach[G.user]; if(!C)return 0; return sum((m.clan||[]).map(c=>{ const o=C[c.role]; return o?Math.round(o.sal*Math.max(0,o.yrs-.5)*.5):0; })); }
function hireClan(m,years){ // 감독과 함께 사단 코치를 데려온다
  const C=G.coach[G.user]; const got=[];
  for(const c of (m.clan||[])){ const old=C[c.role]; if(old){ const pay=Math.round(old.sal*Math.max(0,old.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; old.yrs=0; old.clan=null; G.cmarket.push(old); } staffCt(c,years); C[c.role]=c; got.push(`${CROLE[c.role].l} ${c.name}`); }
  if(got.length)addLog(`${m.name} 감독 사단 합류: ${got.join(', ')}`); return got; }
function clanLeave(m){ // 감독이 떠나면 사단 코치 상당수가 함께 떠난다
  if(!m||!m.id)return []; const C=G.coach[G.user]; const out=[]; for(const k of CKEYS){ const c=C[k]; if(c&&c.clan===m.id&&R()<.7){ C[k]=null; out.push(`${CROLE[k].l} ${c.name}`); } } return out; }
function coachYear(){ // 겨울: 계약 정리
  for(const t of G.teams){ const C=G.coach[t.id]; if(!C)continue; for(const k of CKEYS){ const c=C[k]; if(!c)continue; { const o=c.ob&&G.ob?G.ob.find(x=>x.id===c.ob):null; if(o)c.age=o.age; else c.age++; } /* OB 출신은 OB 기록의 나이를 따른다(OB 연간 처리에서 이미 한 살 먹음) */ if(c.cs!=null&&c.cs>G.year)continue; /* 다음 시즌부터 시작하는 계약은 이번 겨울에 줄이지 않는다 */ c.yrs--; if(c.yrs<=0){ if(t.id===ME()){ C[k]=null; c.from=G.user; c.fromY=G.year; G.cmarket.push(c); } else if((()=>{ const v=x=>(x.sk||45)+(x.dv||45), b=(G.cmarket||[]).filter(x=>x.role===k&&x.age<66&&x.from!==t.id&&!x.ob&&x.fromY!==G.year).sort((a,b)=>v(b)-v(a))[0]; if(b&&v(b)>=v(c)+4){ G.cmarket=G.cmarket.filter(x=>x!==b); staffCt(b,ri(1,3),G.year+1); C[k]=b; if(c.age<62&&!c.ob){ c.yrs=0; c.clan=null; c.from=t.id; c.fromY=G.year; G.cmarket.push(c); } return true; } return false; })()){} /* 계약이 끝나면 시장의 더 나은 코치를 데려온다(검수 11-05: AI 코치는 자동 유지뿐이라 약한 보직이 그대로 남았다) */ else if((c.age||0)<70&&R()<.55)staffCt(c,ri(1,2),G.year+1); else { if(c.age<62&&!c.ob){ c.yrs=0; c.clan=null; c.from=t.id; c.fromY=G.year; G.cmarket.push(c); } C[k]=obAiCoach(t.id,k)||mkCoach(k); staffCt(C[k],C[k].yrs||ri(1,3),G.year+1); } } } }
  const kept=(G.cmarket||[]).filter(c=>c.fromY===G.year); refreshCoachMarket(); { const ko=new Set(kept.map(c=>c.ob).filter(Boolean)); G.cmarket=G.cmarket.filter(c=>!(c.ob&&ko.has(c.ob))); } /* 계약이 끝난 OB 코치는 원래 보직 그대로 한 번만 후보에 오른다 */ G.cmarket=G.cmarket.concat(kept.filter(c=>c.age<64)); const C=G.coach[G.user]; const empty=CKEYS.filter(k=>!C[k]); if(empty.length)mail('운영팀','코치 자리가 비어 있습니다',`계약이 끝나거나 떠나서 ${empty.map(k=>CROLE[k].l).join(', ')} 자리가 비었습니다. 스태프·육성 → 코치진에서 채워 주세요. 계약이 끝난 우리 코치도 코치 후보 목록에 남아 있어 다시 영입(재계약)할 수 있습니다.`,{imp:true,kind:'감독',acts:[{l:'코치진 보기',a:'go',v:'staff:coach'}]}); }
function coachGrade(tid){ const C=coachesOf(tid); const g=(ks,k)=>{ const v=avg(ks.map(r=>effC(C[r],tid,k))); return {v:Math.round(v),l:v>=66?'A':v>=59?'B':v>=52?'C':'D'}; };
  return {bat:g(['bc','hc'],'sk'),pit:g(['pc','cc'],'sk'),run:g(['rc'],'sk'),def:g(['dc','cc'],'sk'),dev1:g(['pc','bc','hc'],'dv'),dev2:g(['fm','fp','fb'],'dv')}; }

/* 계약 만료 예고(사용자 피드백 11-05: 코치 재계약이 안 되는 줄 알았다): 9월 1일, 올해로 계약이 끝나는 우리 코치를 알리고 연장 방법을 안내한다 */
function coachExpNote(){ if(G.unemp||!G.coach||!G.coach[G.user])return; const C=G.coach[G.user]; const L=CKEYS.map(k=>C[k]).filter(c=>c&&c.yrs<=1&&!(c.cs!=null&&c.cs>G.year)); if(!L.length)return;
  mail('운영팀',`올해로 계약이 끝나는 코치 ${L.length}명`,`${L.map(c=>`${CROLE[c.role].l} ${c.name}(${c.age}세)`).join(', ')}의 계약이 이번 시즌으로 끝납니다.\n남기려면 시즌이 끝나기 전에 스태프·육성 → 코치진에서 코치를 눌러 1~2년 연장하세요(연장 1년마다 연봉 3%, 스타 코치 6% 인상, 계약은 최대 4년).\n연장하지 않으면 시즌 뒤 코치 후보로 나가고, 그때도 코치 후보 목록에서 다시 영입할 수 있습니다.`,{kind:'감독',acts:[{l:'코치진 보기',a:'go',v:'staff:coach'}]}); }
