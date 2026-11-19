const STAFF_RET_AGE=70; /* 감독·코치 은퇴 나이: 이 나이부터 재계약·연장을 하지 않는다. 우리·AI 같음(dddddd 11-15) */
/* 겨울 결산(나이·계약 연수를 센 뒤) 은퇴 판정: 70세부터 계약이 끝나면, 72세부터는 계약이 남아도 은퇴한다. 정식 코치·보조 코치 같은 규칙(검수 11-17 #268) */
const staffRetNow=c=>(c.age||0)>=STAFF_RET_AGE&&(c.yrs<=0||(c.age||0)>=STAFF_RET_AGE+2);
/* ===== 코치진과 감독 사단 =====
 지도력(sk): 1군 경기력에 작게 영향. 육성력(dv): 맡은 선수들의 성장 속도.
 사단: 감독과 함께 다니는 코치 묶음. 같은 사단이면 손발이 맞아 실력이 더 나온다(+6). 고집 센 감독은 남의 코치와 덜 맞는다(-2). */
/* KBO 실제 편제(사용자 11-08c: 스태프가 너무 적다): 1군 감독 + 코치 11명(수석·투수·불펜·타격·보조타격·배터리·작전/3루·1루·수비·컨디셔닝·퀄리티컨트롤), 2군 감독 + 코치 4명, 잔류·재활군 코치 3명 = 코치 19명.
   늘어난 자리는 기존 자리의 몫을 나눠 가져 전체 효과 크기는 예전과 같다(좋은 코치를 다 모아도 상한은 그대로) */
const CROLE={hc:{l:'수석코치',g:1,d:'감독 보좌 · 선수단 분위기'},pc:{l:'투수코치',g:1,d:'투수 경기력·성장(선발 중심)'},bp:{l:'불펜코치',g:1,d:'구원 투수 경기력·성장'},bc:{l:'타격코치',g:1,d:'타자 경기력·성장'},ab:{l:'보조 타격코치',g:1,d:'타자 경기력·성장 보조'},cc:{l:'배터리코치',g:1,d:'포수 수비 성장·볼 배합·투수 제구'},rc:{l:'작전·3루 주루코치',g:1,d:'주루 성장·도루·추가 진루 판단'},r1:{l:'1루 주루코치',g:1,d:'주루 판단 보조·도루 스타트'},dc:{l:'수비코치',g:1,d:'내외야 수비'},cn:{l:'컨디셔닝코치',g:1,d:'체력 관리 · 부상 예방'},tc:{l:'퀄리티컨트롤코치',g:1,d:'데이터로 경기 준비 · 1군 경기력 보조'},
  fm:{l:'2군 감독',g:2,d:'2군 선수 전체 성장'},fp:{l:'2군 투수코치',g:2,d:'2군 투수 성장'},fb:{l:'2군 타격코치',g:2,d:'2군 타자 성장'},fd:{l:'2군 수비·주루코치',g:2,d:'2군 야수 수비·주루 성장'},fc:{l:'2군 배터리코치',g:2,d:'2군 포수 성장'},rs:{l:'잔류군 투수코치',g:2,d:'잔류군(3군) 투수 성장'},rb:{l:'잔류군 타격코치',g:2,d:'잔류군(3군) 타자 성장'},rh:{l:'재활군 코치',g:2,d:'부상 선수 재활 · 부상 예방 보조'}};
const CKEYS=Object.keys(CROLE);
const CCAR=['프랜차이즈 스타 출신','국가대표 코치 경력','미국 마이너리그 연수','일본 코치 연수','전력분석원 출신','2군에서 오래 지도','우승 코치진 출신','무명 선수 출신 지도자'];
/* 코치 세부 능력(20~80): 자리마다 보는 능력이 다르다. 지도력(sk)·육성력(dv)은 맡은 자리의 세부 능력에서 나온다.
   훈련 집중 항목은 그 항목의 지도 능력(60%)과 유망주 육성(40%)이 성장 속도를 정한다. 소통은 수석코치일 때 선수단 기분에, 데이터 분석은 지도력에 조금 들어간다 */
const CAB={stf:'구위 지도',ctl:'제구 지도',sta:'체력 관리',con:'컨택 지도',pow:'장타 지도',eye:'선구 지도',def:'수비 지도',spd:'주루 지도',cat:'포수 지도',yng:'유망주 육성',com:'소통',ana:'데이터 분석'};
const CDOM={pc:['stf','ctl','sta'],fp:['stf','ctl','sta'],bp:['stf','ctl'],cc:['cat','ctl'],fc:['cat','ctl'],bc:['con','pow','eye'],fb:['con','pow','eye'],ab:['con','eye'],rc:['spd'],dc:['def'],fd:['def','spd'],cn:['sta'],r1:['spd'],tc:['ana','com'],rh:['sta'],rs:['stf','ctl'],rb:['con','eye'],hc:['com','ana'],fm:['yng','com']};
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
  const c={id:'c'+Math.floor(R()*1e9),name:genName(),age:ri(36,63),role,ab:a,car:exCareer(role)+' · '+pick(CCAR),yrs:0,clan:o.clan||null}; coachSync(c); c.sal=round5(clamp(60+(Math.max(c.sk,c.dv)-50)*4.5+N(0,12),45,320)); return staffAttach(c,'coach'); }
/* 항목 지도 65% + 유망주 육성 25% + 소통 10%, 사단·관계·멘탈 보정. */
/* 코치가 지금 일하는가: 자리에 있고(호출하는 쪽이 정함) 합류 시즌이 왔고(jy) 교육·연수로 떠나 있지 않다. 성장·세부 훈련·경기력·승격·내부 승격이 모두 이 기준을 쓴다(검수 11-17 #269~#271) */
function coachActiveNow(c){ return !!c&&!staffPending(c)&&!(c.sisAway>G.day); }
function trnCoachV(c,tid,k){ if(!coachActiveNow(c))return 45; /* 연수 중이거나 다음 시즌 합류 코치면 세부 훈련도 빈자리와 같다(검수 11-09zw #19, 11-17 #269) */ const a=cAb(c); const base=(a[k]??c.dv)*.65+a.yng*.25+a.com*.1; return (base+(effC(c,tid,'dv')-c.dv))*staffQuality(c,'coach',tid); }
/* 잘하는 분야·약한 분야 */
function cStrong(c){ const a=cAb(c); return Object.keys(CAB).filter(k=>a[k]>=60).sort((x,y)=>a[y]-a[x]).slice(0,2); }
function cWeak(c){ const a=cAb(c); return (CDOM[c.role]||[]).filter(k=>a[k]<45); }
function mkClan(m){ // 이름난 감독은 사단을 거느린다
  const n=m.fame>=80?5:m.fame>=70?4:m.fame>=55?2:0; if(!n)return [];
  const roles=['hc',...['pc','bc','cc','rc','dc','fm','bp','ab'].sort(()=>R()-.5)].slice(0,n);
  return roles.map(r=>mkCoach(r,{clan:m.id,boost:3})); }
function coachesOf(tid){ return (G.coach&&G.coach[tid])||{}; }
function effC(c,tid,k,plan){ if(!c||c.sisAway>G.day||(!plan&&!coachActiveNow(c)))return 45; /* plan: 영입·비교 화면은 합류한 뒤 일할 값으로 본다(다음 시즌 합류 코치를 빈자리 값 58로 보여 궁합 탓처럼 보이던 문제, 카페 11-09) */ /* 해외 연수 중이거나 다음 시즌부터 합류하는 코치는 빈자리와 같다(검수 11-09zv #12) */ const m=G.mgr[tid]; let v=c[k||'sk']; if(m&&c.clan&&c.clan===m.id)v+=6; else if(m&&(m.ego||0)>=70)v-=2; return v; }
function clanCount(tid){ const m=G.mgr[tid]; if(!m)return 0; return Object.values(coachesOf(tid)).filter(c=>c&&c.clan===m.id).length; }
/* 옛 저장: 새로 생긴 코치 자리(불펜·보조 타격·컨디셔닝·2군 수비주루·2군 배터리)를 채운다. undefined만 채우고, 사용자가 비워 둔 자리(null)는 그대로 둔다 */
function coachFill(){ if(!G.coach)return 0; let n=0; for(const t of G.teams){ const C=G.coach[t.id]; if(!C)continue; for(const k of CKEYS){ if(C[k]!==undefined)continue; const c=mkCoach(k,t.id===G.user?{boost:-2}:{}); staffCt(c,ri(1,2),G.year); C[k]=c; n++; } }
  if(G.cmarket&&CKEYS.some(k=>!G.cmarket.some(c=>c.role===k)))for(const k of CKEYS)if(!G.cmarket.some(c=>c.role===k))for(let i=0;i<4;i++)G.cmarket.push(mkCandCoach(k)); return n; }
/* 새 게임 코치진: 우리도 AI처럼 19자리를 모두 채워 시작한다(구단주 승인 11-17, 검수 11-17 §5).
   전에는 우리 구단만 자리마다 35% 확률로 비어 시작했다. AI에도 같은 규칙을 넣어 재 보니(리그 4개·auto/proR) 승률은 비슷했지만, 'KBO 편제로 모든 구단이 채워진다'(피드백 11-08c)와 맞지 않아 둘 다 없앴다 */
function coachInit(){ G.coach=G.coach||{}; G.cmarket=G.cmarket||[];
  for(const t of G.teams){ if(G.coach[t.id])continue; const C={}; const m=G.mgr[t.id]; const clan=m&&t.id!==ME()?(m.clan||(m.clan=mkClan(m))):[];
    for(const k of CKEYS){ const cl=clan.find(c=>c.role===k); C[k]=cl||mkCoach(k); C[k].yrs=ri(1,3); }
    if(t.id===G.user){ for(const k of CKEYS)R(); } /* 예전 빈자리 추첨(35%) 자리: 본 난수 순서를 그대로 두려고 한 번씩 뽑기만 한다(시작 세계·시드 고정 점검이 같게) */
    G.coach[t.id]=C; }
  for(const k in G.mgr){ const m=G.mgr[k]; if(m&&!m.interim&&!m.clan)m.clan=mkClan(m); }
  (G.mmarket||[]).forEach(m=>{ if(!m.clan)m.clan=mkClan(m); });
  if(!G.cmarket.length)refreshCoachMarket(); }
/* 코치 후보: 자리마다 4~5명. 스타 코치(드묾·비쌈), 베테랑, 보통, 젊은 지도자(싸지만 낮음)가 섞인다 */
function mkCandCoach(k){ const x=R(); const c=x<.1?mkCoach(k,{boost:ri(9,15)}):x<.32?mkCoach(k,{boost:ri(3,7)}):x<.78?mkCoach(k):mkCoach(k,{boost:-ri(2,6)});
  if(x>=.78){ const o=obYoungCoach(k); if(o)return o; /* 자리를 찾는 은퇴 선수가 있으면 그 사람이 젊은 지도자로 */ c.age=ri(33,41); c.car=pick(['은퇴 2년 차 젊은 지도자','전력분석원 출신','2군 코치 경력 3년','해외 코치 연수 막 마침']); c.sal=round5(Math.max(40,c.sal*.7)); }
  if(x<.1){ c.car=pick(['우승 코치진 출신','국가대표 코치 경력','레전드 선수 출신','타 구단 수석코치 출신']); c.star=true; } return c; }
function refreshCoachMarket(){ const L=[]; for(const k of CKEYS){ const n=ri(2,4); /* 자리가 늘어 자리당 무작위 후보는 줄이고, 은퇴 선수(OB)·계약 끝난 코치가 시장을 채운다(사용자 11-08c: 우리 풀 안에서) */ for(let i=0;i<n;i++)L.push(mkCandCoach(k)); } const res=(G.cmarket||[]).filter(c=>c.res!=null||loyWait(c)); /* 우선권은 구단에 남고, 감독·단장을 기다리는 사람도 재생성 때 유지한다(검수 #516~517) */
  let obc=[]; try{ obc=G.ob?obCands('coach').filter(o=>!res.some(c=>c.ob===o.id)).map(obCoach):[]; }catch(e){} G.cmarket=[...res,...obc,...L]; }
/* 매달 초: 새 후보가 들어오고 오래된 후보 일부는 다른 일을 찾아 떠난다 */
function coachMarketMonth(){ const o=dobj(G.day); const mk=o.y*100+o.m; if(G.cmMonth===mk)return; G.cmMonth=mk;
  if(o.m===8&&!G.unemp&&G.coach&&G.coach[G.user]&&G.cExpY!==G.year){ G.cExpY=G.year; staffExpNote(); } /* 같은 사람 만료 안내는 한 해 한 번(8월·9월 중복 방지, 검수 11-06) */ G.cmarket=G.cmarket||[];
  const leave=G.cmarket.filter(c=>c.res!==G.user&&!loyWait(c)&&R()<.12&&c.res==null).map(c=>c.id); /* 타 구단 우선권도 보호한다. 기존 월간 추첨 순서는 유지한다(검수 #516). */ G.cmarket=G.cmarket.filter(c=>!leave.includes(c.id)); const n=ri(3,5); for(let i=0;i<n;i++)G.cmarket.push(mkCandCoach(pick(CKEYS)));
  if(G.cmarket.length>90)G.cmarket=G.cmarket.filter((c,i,A)=>c.res!=null||loyWait(c)||i>=A.length-90); }
/* 보조 코치 명단: 단장이 맡은 구단은 G.coachX, 떠난 구단(야인이면 전 구단)은 그 구단에 남긴 명단(검수 11-09zs) */
function axOf(tid){ return (tid===G.user&&!G.unemp?G.coachX:((G.orgT||{})[tid]||{}).coachX)||[]; }
function coachSal(tid,now){ return sum(Object.values(coachesOf(tid)).concat(axOf(tid)).filter(c=>c&&!(now&&c.cs!=null&&c.cs>G.year)).map(c=>c.sal))+pcSalOf(tid,now); } /* 플레잉코치 수당은 코치진 연봉에 한 번만(선수 연봉은 선수단 연봉) */ /* now: 올해 실제로 받는 코치만(다음 시즌부터인 계약 제외) */
/* 감독·코치 남은 지급 연수: 다음 시즌부터인 계약은 기간 전체, 이미 시작했으면 올해 남은 날 + 남은 다음 시즌들(결산 전이면 올해도 계약 연수에 들어 있다) */
function staffLeft(x,due){ const y=Math.max(0,x.yrs||0); if(x.cs!=null&&x.cs>G.year)return y; const rest=Math.max(0,dnum(G.year+1,1,1)-G.day)/365; return G.rolled===G.year&&!due?y+rest:Math.max(0,y-1)+rest; } /* due: 계약을 넘긴(rolled) 뒤지만 이 사람의 올해 연차를 아직 빼지 않았을 때 */
/* 시즌 넘기기(offseason)와 감독 계약 연차 빼기(offseasonMgr 끝) 사이면 그해 연도. 저장되지 않는 한 틱 안의 표식 */
let MGR_YRS_DUE=null;
const coachSev=c=>Math.round(c.sal*staffLeft(c)*.5); /* 코치 잔여 연봉 절반 정산 */
/* 코치 해지 정산: 현재 단장은 지출장부, AI는 현금과 이미 지급한 결산명세에 함께 남긴다. */
function coachPaySev(tid,c){ const pay=coachSev(c); if(pay)ledger(tid,'coach',pay,{ho:'코치진 연봉'}); return pay; }
/* 경기력: 타석 결과에 더하는 보정(보통 ±1 안팎) */
function coachBoost(p){ const C=coachesOf(p.team); if(!C)return 0; const tid=p.team; const z=(c,k)=>(effC(c,tid,k)-55)/25;
  let b=z(C.hc)*.1+z(C.tc)*.05; if(p.isP)b+=(isSPr(p)?z(C.pc)*.45:z(C.pc)*.3+z(C.bp)*.15)+z(C.cc)*.15; else b+=z(C.bc)*.34+z(C.ab)*.11; return b; } /* 늘어난 자리는 몫을 나눠 가진다(합계 비중 그대로) */
/* 올해 출전 중 1군 비율(타자 타석, 투수 아웃카운트). 기록이 없으면 2군에서 보낸 것으로 본다 */
function oneShare(p){ const y=G.year; const a=seasonTotalT(p,y,'1군',p.team), f=seasonTotalT(p,y,'퓨처스',p.team); const k=p.isP?'outs':'pa'; const x=(a&&a[k])||0, z=(f&&f[k])||0; return x+z>0?x/(x+z):0; }
function coachDevMult(p){ // 성장 배율: 1군에서 많이 뛴 선수는 1군 코치, 아니면 2군 코치진
  if(p.team==null)return 1; const C=coachesOf(p.team); const tid=p.team; const s=oneShare(p); /* 1군 출전 비율(playShare는 성장 가중치라 최소 0.8이어서 1·2군 구분에 쓸 수 없다) */
  const v1=(p.isP?(isSPr(p)?effC(C.pc,tid,'dv')*.55+effC(C.bp,tid,'dv')*.1:effC(C.pc,tid,'dv')*.4+effC(C.bp,tid,'dv')*.25)+effC(C.cc,tid,'dv')*.1:effC(C.bc,tid,'dv')*.55+effC(C.ab,tid,'dv')*.2)+effC(C.hc,tid,'dv')*.25, v2=(p.isP?effC(C.fp,tid,'dv')*.5+effC(C.rs,tid,'dv')*.1:effC(C.fb,tid,'dv')*.35+effC(p.pos==='C'?C.fc:C.fd,tid,'dv')*.15+effC(C.rb,tid,'dv')*.1)+effC(C.fm,tid,'dv')*.4;
  const v=v1*s+v2*(1-s);
  return clamp(1+(v-55)/110,.7,1.35)*axBoost(p)*(p.age<=24&&activeMentor(p.team)?1.05:1); } /* 단장만 떠나면 지정은 구단에 남고, 멘토 선수도 떠나면 성장 보너스는 끝난다(검수 11-09zs) */
/* 계약 시작 시즌: 정규시즌이 끝난 뒤(9월 이후) 맺은 계약은 다음 시즌부터 센다. 그래서 이번 겨울 차감에서 빠진다(cs: 시작 시즌) */
function ctStartS(){ return (dobj(G.day).m>=9&&G.cal&&G.day>G.cal.end)?G.year+1:G.year; }
function staffCt(x,years,start){ x.yrs=years; x.cs=start??ctStartS(); x.ce=x.cs+years-1; x.jy=x.cs; return x; } /* jy: 합류 시즌. 새 계약은 시작 시즌부터 일한다. 지금 일하는 사람의 재계약은 staffRenew */
/* 옛 계약에 시작/합류 시즌이 없으면 재직 중으로 본다. 종료 시즌만으로 미래 합류를 추정하지 않는다. */
function staffPending(x){ return !!(x&&(x.jy>G.year||x.cs>G.year)); }
function staffRenew(x,years,start){ staffCt(x,years,start); delete x.jy; return x; }
/* 연장은 기존 시작 시즌을 유지한다. 옛 저장은 현재 잔여 기간으로 종료 시즌을 복원한다. */
function staffCtExtend(x,add){ if(x&&x.role)x.raidSafe=G.day+365; /* 연장한 코치는 1년간 영입 제안 대상에서 빠진다: 우리·AI 같게 */ const left=Math.max(0,x.yrs); if(!left)return staffRenew(x,add);
  if(x.ce==null){ if(x.cs==null)x.cs=G.rolled===G.year?G.year+1:G.year; x.ce=x.cs+left-1; } x.ce+=add; x.yrs=left+add; return x; }
/* 계약 마지막 시즌: '잔여 1년'이 '올 시즌까지'라는 뜻인데 시즌이 끝난 뒤에도 1년 남은 것처럼 보여, 결산 때 한꺼번에 빠지면 갑자기 빈 것처럼 느껴졌다(카페 문의 11-07) */
function ctEndY(x){ if(x.cs!=null&&x.cs>G.year)return x.cs+Math.max(0,x.yrs)-1; return (G.rolled===G.year?G.year+1:G.year)+Math.max(0,x.yrs)-1; }
const ctLeftTxt=x=>{ const e=ctEndY(x), cur=G.rolled===G.year?G.year+1:G.year; return x.yrs<=0?'계약 끝':e<=cur&&G.rolled!==G.year&&period()!=='pre'&&period()!=='season'?`${e} 시즌으로 만료(결산 때 떠남)`:`${e} 시즌까지`; };
const ctSeasonsTxt=n=>{ const s=ctStartS(); return n>1?`${s}~${s+n-1} 시즌`:`${s} 시즌`; };
function hireCoach(id,years,o){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; years=Math.round(+years); if(!(years>=1&&years<=4))return '계약 기간은 1~4년입니다.'; const c=(G.cmarket||[]).find(x=>x.id===id); if(!c)return '후보가 없습니다.'; if(typeof schMarketWhy==='function'){ const why=schMarketWhy(c); if(why)return why; } { const why=coachHireWhy(G.user,c,{years}); if(why)return why; } /* 우선 협상권·은퇴 나이·계약 연수: AI와 같은 공통 규칙(89d_coach_rules) */ { const lost=!(o&&o.vac)&&typeof cmUserContest==='function'?cmUserContest(c):''; if(lost)return lost; } /* 노리는 구단이 있으면 코치가 고른다(89_coach_market cmContest: 우리·AI 같은 규칙). 지면 누구에게 왜 졌는지 알린다. 빈자리 자동 보강(o.vac, 89c cvacHire)은 AI 구단의 빈자리 보강과 같이 경쟁 없이 계약한다([검수 11-18 #494]) */ const C=G.coach[G.user]; const old=C[c.role];
  if(old){ const pay=coachSev(old); ledgerMe('coach',pay); addLog(`${CROLE[c.role].l} ${old.name}와(과) 결별했습니다(잔여 연봉 정산 ${money(pay)}).`); staffHistory('coach',old,'계약 종료',G.user,'단장 결정에 따른 교체'); old.yrs=0; old.clan=null; G.cmarket.push(old); }
  staffCt(c,years); C[c.role]=c; if(old)interimLeft(old); G.cmarket=G.cmarket.filter(x=>x.id!==id); delete c.res; delete c.folM; delete c.gmFol; /* 계약하면 우선 협상권과 기다림도 끝(89b_staff_loyalty) */ if(typeof schStaffJoined==='function')schStaffJoined(c,G.user); try{ obTaken(c.ob,c); }catch(e){} obHireBonus(c.ob,CROLE[c.role].l); staffHistory('coach',c,'영입',G.user,`${years}년 · 연 ${money(c.sal)}`); addLog(`${CROLE[c.role].l}(으)로 ${c.name}을(를) ${years}년(${ctSeasonsTxt(years)}) 연 ${money(c.sal)}에 영입했습니다.`); return ''; }
function fireCoach(role){ if(G.unemp)return; const C=G.coach[G.user]; const c=C[role]; if(!c)return; const pay=coachSev(c); ledgerMe('coach',pay); C[role]=null; staffHistory('coach',c,'계약 종료',G.user,'단장 해임'); c.yrs=0; c.clan=null; G.cmarket.push(c); addLog(`${CROLE[role].l} ${c.name}을(를) 내보냈습니다(잔여 연봉 정산 ${money(pay)}).`); interimLeft(c); }
/* 떠난 코치가 감독대행이었으면 남은 코치로 대행을 다시 정한다(해고 검수 11-08, 시장 교체 검수 11-09m) */
function interimLeft(c,tid=G.user){ const m=G.mgr&&G.mgr[tid]; if(c&&m&&m.interim&&(m.cid===c.id||(m.cid==null&&m.name===`${c.name}(감독대행)`))){ staffHistory('mgr',m,'감독대행 임무 종료',tid,`${c.name} 코치 퇴임`); G.mgr[tid]=mkInterim(tid); staffHistory('mgr',G.mgr[tid],'감독대행 선임',tid,'전임 대행 코치 퇴임에 따른 교체'); if(tid===ME())addLog(`감독대행은 ${G.mgr[tid].name.replace('(감독대행)','')}이(가) 맡습니다.`); } }
/* 구버전 대행과 겨울 인사 뒤에도 실제 현직·합류·연수 상태를 다시 확인한다. 외부 대행은 코치가 없을 때 유지한다. */
function interimRefresh(tid){ const m=G.mgr&&G.mgr[tid]; if(!m||!m.interim)return; const active=Object.values(coachesOf(tid)).filter(coachActiveNow),c=active.find(c=>m.cid!=null?c.id===m.cid:m.name===`${c.name}(감독대행)`); if(c||(m.cid==null&&m.name==='감독대행'&&!active.length))return; const n=mkInterim(tid); staffHistory('mgr',m,'감독대행 임무 종료',tid,'현직 코치 근무 상태 변경'); G.mgr[tid]=n; staffHistory('mgr',n,'감독대행 선임',tid,'현재 근무 가능한 코치로 교체'); }
/* 코치 중도 재계약: 계약 중 언제든 1~2년 연장(계약은 최대 4년). 연장 1년마다 연봉 3%(스타 코치 6%) 인상. 64세 이상은 은퇴를 생각해 1년만. 한 해 한 번 */
function coachExtTerms(role,add){ const c=coachesOf(G.user)[role]; if(!c)return null; const sal=round5(c.sal*(1+(c.star?.06:.03)*add)); let why='';
  if((c.age||0)>=STAFF_RET_AGE)why=`${c.name} 코치(${c.age}세)가 이번 계약을 끝으로 은퇴하겠다고 합니다.`; else if(c.extY===G.year)why=`${c.name} 코치와는 올해 이미 계약을 손봤습니다.`; else if(c.age>=64&&add>1)why=`${c.name} 코치(${c.age}세)는 은퇴를 생각하고 있어 1년만 연장합니다.`; else if(c.yrs+add>4)why='코치 계약은 최대 4년까지입니다.';
  return {c,add,sal,why}; }
function extendCoach(role,add){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; if(!(+add===1||+add===2))return '연장은 1~2년입니다.'; const T=coachExtTerms(role,+add); if(!T)return '그 자리에 코치가 없습니다.'; if(T.why)return T.why; const c=T.c;
  staffCtExtend(c,T.add); c.sal=T.sal; c.extY=G.year; c.raidSafe=G.day+365; /* 연장 뒤 1년은 다른 구단이 영입 제안하지 않는다(커뮤니티 11-15) */ staffHistory('coach',c,'연장 계약',G.user,`${T.add}년 연장 · 연 ${money(c.sal)}`); addLog(`${CROLE[role].l} ${c.name}와(과) ${T.add}년 연장 계약했습니다(연 ${money(c.sal)}, 계약 ${c.yrs}년 남음).`); return ''; }
/* 계약이 올해로 끝나는 코치를 한 번에 1년씩 연장(카페 11-09: 코치가 19명이라 하나씩 계약하기 번거롭다). 조건·연봉은 하나씩 할 때와 같다 */
const coachBulkList=()=>G.unemp?[]:CKEYS.filter(k=>{ const c=coachesOf(G.user)[k]; if(!c||c.yrs>1||staffPending(c))return false; const T=coachExtTerms(k,1); return T&&!T.why; });
function extendCoachesAll(){ const L=coachBulkList(); let n=0; for(const k of L)if(!extendCoach(k,1))n++; return n; }
/* 우리 코치 승격(PROMO): 2군 투수·타격코치는 1군 같은 자리로, 1군 코치·2군 감독은 수석코치로. 연봉 15% 인상.
   올라갈 자리에 코치가 있으면 그 코치는 비게 되는 자리로 옮긴다(보직 맞교환, 연봉 그대로). 그 코치가 감독 사단이면 감독 관계가 조금 떨어진다. 같은 해 두 번 승격하지 않는다 */
function promoteTerms(role){ const C=coachesOf(G.user); const c=C[role]; const to=PROMO[role]; if(!c||!to)return null; return {c,to,sal:round5(c.sal*1.15),old:C[to]||null,why:c.prY===G.year?`${c.name} 코치는 올해 이미 승격했습니다.`:!coachActiveNow(c)?(c.sisAway>G.day?`${c.name} 코치는 교육·연수 중이라(${dmd(c.sisAway)} 복귀) 지금 승격할 수 없습니다. 복귀한 뒤 승격하세요.`:`${c.name} 코치는 아직 합류 전이라(${c.jy??c.cs} 시즌 합류) 지금 승격할 수 없습니다.`):staffPending(C[to])?`${CROLE[to].l}에는 합류 전인 ${C[to].name} 코치가 이미 계약돼 있어 승격할 수 없습니다.`:''}; } /* 일하지 않는 코치를 올리면 지금 일하는 1군 코치가 밀려나 1군 자리가 빈자리처럼 된다(검수 11-17 #270) */
function promoteCoach(role){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; const C=G.coach&&G.coach[G.user]; if(!C||!C[role])return '그 자리에 코치가 없습니다.'; const T=promoteTerms(role); if(!T)return `${CROLE[role].l}보다 높은 코치 자리는 없습니다(감독 선임은 감독 화면에서).`; if(T.why)return T.why;
  const {c,to,old}=T; staffAttach(c,'coach');if(old)staffAttach(old,'coach'); c.sal=T.sal; c.prY=G.year; c.role=to; coachSync(c); C[to]=c; C[role]=null; let note=''; /* 새 보직의 세부 능력으로 지도력·육성력을 다시 계산 */
  if(old){ old.role=role; coachSync(old); C[role]=old; const m=G.mgr[G.user]; if(m&&!m.interim&&old.clan&&old.clan===m.id){ m.rel=clamp(m.rel-4,0,100); note=` ${m.name} 감독 사단인 ${old.name} 코치가 밀려나 감독이 서운해합니다. 관계 악화.`; } }
  staffHistory('coach',c,'보직 승격',G.user,`${CROLE[role].l}에서 ${CROLE[to].l}`); if(old)staffHistory('coach',old,'보직 이동',G.user,`${CROLE[to].l}에서 ${CROLE[role].l}`); const msg=`${c.name} 코치를 ${CROLE[to].l}(으)로 승격했습니다(연 ${money(c.sal)}).${old?` 기존 ${CROLE[to].l} ${old.name}은(는) ${CROLE[role].l}(으)로 옮겼습니다.`:` ${CROLE[role].l} 자리는 비었습니다.`}${note}`; addLog(msg); return {msg}; }
function clanSev(m){ const C=G.coach&&G.coach[G.user]; if(!C)return 0; return sum((m.clan||[]).map(c=>{ const o=C[c.role]; return o&&o!==c&&!coachHireWhy(G.user,c,{years:coachContractYears(c,Math.min(4,m.yrs||2)),auto:true})?coachSev(o):0; })); }
function hireClan(m,years){ // 감독과 함께 사단 코치를 데려온다
  const C=G.coach[G.user]; const got=[];
  m.clan=clanNow(m); for(const c of (m.clan||[])){ const y=coachContractYears(c,Math.min(4,years)); if(!CKEYS.includes(c.role)||coachHireWhy(G.user,c,{years:y,auto:true}))continue; G.cmarket=(G.cmarket||[]).filter(x=>x!==c); delete c.folM; delete c.res; c.clan=m.id; const old=C[c.role]; if(old&&old!==c){ const pay=coachSev(old); ledgerMe('coach',pay); staffHistory('coach',old,'계약 종료',G.user,'단장 결정에 따른 교체'); old.yrs=0; old.clan=null; G.cmarket.push(old); } staffCt(c,y); C[c.role]=c; if(old&&old!==c)coachInterimLeft(G.user,old); staffHistory('coach',c,'영입',G.user,`${m.name} 감독 사단 합류 · ${y}년`); got.push(`${CROLE[c.role].l} ${c.name}`); }
  if(got.length)addLog(`${m.name} 감독 사단 합류: ${got.join(', ')}`); return got; }
function coachYear(){ // 겨울: 계약 정리
  const vacWhy=Object.fromEntries(G.teams.map(t=>[t.id,{}])); /* AI 빈자리 사유(새 시장에서 채울 때 기록) */ const myExp=[]; /* 올겨울 계약이 끝난 우리 코치(빈자리 안내에 실제로 후보에 남았는지 적는다) */
  G.cmarket=(G.cmarket||[]).filter(c=>(c.age||0)<STAFF_RET_AGE); /* 은퇴 나이 코치는 시장에서도 빠진다 */
  for(const t of G.teams){ const C=G.coach[t.id]; if(!C)continue;
    for(const k of CKEYS){ const c=C[k]; if(!c)continue;
      const o=c.ob&&G.ob?G.ob.find(x=>x.id===c.ob):null; if(o)c.age=o.age; else c.age++;
      if(c.cs!=null&&c.cs>G.year)continue;
      c.yrs--;
      const ret=staffRetNow(c); /* 70세부터 계약이 끝나면, 72세부터는 계약이 남아도 은퇴한다. 우리·AI 같음(dddddd 11-16: 해를 넘겨도 그대로) */
      if(ret){ C[k]=null; staffHistory('coach',c,'은퇴',t.id,`${c.age}세`); if(t.id===ME()){ interimLeft(c); cvacMail(mail('운영팀',`${c.name} 코치 은퇴`,`${c.name} 코치(${c.age}세)가 지도자 생활을 마치고 은퇴했습니다. 빈 자리는 코치 시장에서 채워 주세요.`,{kind:'코치',acts:[{l:'코치 시장',a:'goWork',v:'코치진'}]})); } else vacWhy[t.id][k]=`${c.name} 코치 은퇴`; continue; } /* AI 빈자리는 아래에서 새 시장으로 채운다(89c_coach_vacancy) */
      if(c.yrs>0)continue;
      if(t.id===ME()){ C[k]=null; c.from=G.user; c.fromY=G.year; G.cmarket.push(c); myExp.push(c); staffHistory('coach',c,'계약 만료',t.id); interimLeft(c); continue; }
      const v=x=>(x.sk||45)+(x.dv||45), b=(G.cmarket||[]).filter(x=>x.role===k&&x.age<66&&x.from!==t.id&&!x.ob&&x.fromY!==G.year&&coachCanHire(t.id,x,{auto:true,cur:null})).sort((a,b)=>v(b)-v(a))[0];
      if(b&&v(b)>=v(c)+4){ G.cmarket=G.cmarket.filter(x=>x!==b); delete b.folM; delete b.gmFol; staffCt(b,Math.min(ri(1,3),coachMaxYrs(b)),G.year+1); C[k]=b; /* 연봉 여력·우선 협상권은 시장 영입과 같은 검사(검수 11-17 #257) */
        if(c.age<62&&!c.ob){ c.yrs=0; c.clan=null; c.from=t.id; c.fromY=G.year; G.cmarket.push(c); }
        staffHistory('coach',c,'계약 만료',t.id,'후임 코치 선임'); staffHistory('coach',b,'영입',t.id,`${c.name} 코치 계약 만료 · ${b.yrs}년`);
      } else if((c.age||0)<STAFF_RET_AGE&&R()<.55){ staffRenew(c,coachContractYears(c,ri(1,2)),G.year+1); staffHistory('coach',c,'재계약',t.id,`${c.yrs}년`);
      } else { if(c.age<62&&!c.ob){ c.yrs=0; c.clan=null; c.from=t.id; c.fromY=G.year; G.cmarket.push(c); }
        C[k]=null; staffHistory('coach',c,'계약 만료',t.id,'후임 코치 선임'); vacWhy[t.id][k]=`${c.name} 코치 계약 만료`; }
    }
  }
  const kept=(G.cmarket||[]).filter(c=>c.fromY===G.year||(loyWait(c)&&c.res!==G.user)); /* 감독·단장을 따라 나와 기다리는 코치도 남는다(89b_staff_loyalty) */
  const held=new Set((G.cmarket||[]).filter(c=>(c.age||0)<STAFF_RET_AGE&&((c.res!=null&&team(c.res))||(c.folM&&c.folM.id&&G.year-c.folM.y>=0&&G.year-c.folM.y<=CLAN_WAIT))));
  refreshCoachMarket(); { const ko=new Set(kept.map(c=>c.ob).filter(Boolean)); G.cmarket=G.cmarket.filter(c=>held.has(c)||!(c.ob&&ko.has(c.ob))); } /* 재생성한 OB 중복만 제거하고 유효 우선권·감독 대기 원본은 지킨다(검수 #516~517). */
  G.cmarket=G.cmarket.concat(kept.filter(c=>c.age<64&&!G.cmarket.includes(c)));
  try{ coachVacRound(tid=>vacWhy[tid]||{},G.year+1); }catch(e){} /* 새 시장이 열린 뒤 AI 구단과 (맡겼으면) 우리 구단이 같은 규칙·무작위 순서로 빈자리를 채운다 */
  for(const t of G.teams)interimRefresh(t.id); /* 은퇴·계약 만료·후임 영입이 끝난 현직 명단으로 대행을 정한다. */
  const C=G.coach[G.user]; const empty=CKEYS.filter(k=>!C[k]); if(empty.length)cvacMail(mail('운영팀','코치 자리가 비어 있습니다',`계약이 끝나거나 떠나서 ${empty.map(k=>CROLE[k].l).join(', ')} 자리가 비었습니다. 스태프·육성 → 코치진에서 채워 주세요.${cExpMarketTxt(myExp)}`,{imp:true,kind:'감독',acts:[{l:'코치진 보기',a:'go',v:'staff:coach'}]})); }
/* 계약이 끝난 우리 코치 중 실제로 코치 후보에 남은 사람과 빠진 사람(64세 이상은 은퇴를 앞둬 후보로 남지 않는다)을 이름으로 알린다(검수 11-17 #272) */
function cExpMarketTxt(L){ if(!L||!L.length)return ''; const M=new Set(G.cmarket||[]), inM=L.filter(c=>M.has(c)), out=L.filter(c=>!M.has(c)), nm=c=>`${c.name}(${CROLE[c.role]?CROLE[c.role].l:'코치'}, ${c.age}세)`;
  return (inM.length?` 계약이 끝난 우리 코치 ${inM.map(nm).join(', ')}은(는) 후보 목록에 남아 있어 다시 데려올 수 있습니다.`:'')+(out.length?` ${out.map(nm).join(', ')}은(는) 은퇴를 앞두고 있어 후보 목록에 남지 않았습니다.`:''); }
const COACH_GRADE={bat:{l:'타격',ks:['bc','ab','hc'],k:'sk'},pit:{l:'투수',ks:['pc','bp','cc'],k:'sk'},run:{l:'주루',ks:['rc','r1'],k:'sk'},def:{l:'수비',ks:['dc','cc'],k:'sk'},dev1:{l:'1군 육성',ks:['pc','bp','bc','ab','hc'],k:'dv'},dev2:{l:'2군 육성',ks:['fm','fp','fb','fd','fc','rs','rb'],k:'dv'}};
function coachGrade(tid){ const C=coachesOf(tid); return Object.fromEntries(Object.entries(COACH_GRADE).map(([key,{ks,k}])=>{ const v=avg(ks.map(r=>effC(C[r],tid,k)));return [key,{v:Math.round(v),l:v>=66?'A':v>=59?'B':v>=52?'C':'D'}]; })); }

/* 63세 이상은 겨울에 한 살 먹어 64세가 되면 코치 후보로 남지 않는다(coachYear의 age<64, 검수 11-09zw #24) */
function cRetTxt(L){ const o=L.filter(c=>c.age>=63); return o.length?`\n단, ${o.map(c=>`${c.name}(${c.age}세)`).join(', ')}은(는) 은퇴를 앞둬 계약이 끝나면 코치 후보로 남지 않습니다. 함께하려면 시즌 중에 연장해야 합니다.`:''; }
/* 계약 만료 예고(사용자 피드백 11-05: 코치 재계약이 안 되는 줄 알았다): 9월 1일, 올해로 계약이 끝나는 우리 코치를 알리고 연장 방법을 안내한다 */
/* 계약 만료 알림(커뮤니티 11-17 랄프111112: 끝날 때쯤 재계약 요청까지): 8월 1일(시즌 끝 두 달 전)과 9·10월 1일에 올해로 끝나는 코치·보조 코치·감독을 한 통에 모아
   사람마다 '재계약 제안'(기존 연장 함수·조건 그대로, 1년)과 '모두 재계약 제안'을 붙인다. 돈은 단장이 눌러야 나간다(직원 계약 위임은 없다). 같은 사람은 한 해 한 번 */
function staffExpList(){ if(G.unemp||!G.coach||!G.coach[G.user])return []; const L=[], end=x=>x&&x.yrs<=1&&!staffPending(x);
  for(const k of CKEYS){ const c=G.coach[G.user][k]; if(end(c))L.push({key:'c:'+k+':'+c.id,s:c,name:c.name,l:CROLE[k].l,age:c.age}); }
  for(const c of G.coachX||[])if(end(c))L.push({key:'x:'+c.id,s:c,name:c.name,l:'보조 코치',age:c.age});
  const m=G.mgr&&G.mgr[G.user]; if(m&&!m.interim&&end(m)&&m.yrs>0)L.push({key:'m:'+m.id,s:m,name:m.name,l:'감독',age:m.age}); return L; }
function staffRenewFind(key){ const P=String(key||'').split(':'); if(G.unemp)return null; if(P[0]==='c'){ const c=coachesOf(G.user)[P[1]]; return c&&c.id===P.slice(2).join(':')?{kind:'c',s:c,role:P[1]}:null; } if(P[0]==='x'){ const c=(G.coachX||[]).find(x=>x.id===P.slice(1).join(':')); return c?{kind:'x',s:c}:null; } if(P[0]==='m'){ const m=G.mgr&&G.mgr[G.user]; return m&&!m.interim&&m.id===P.slice(1).join(':')?{kind:'m',s:m}:null; } return null; }
function asstExtTerms(c,add){ const sal=round5(c.sal*(1+(c.star?.06:.03)*add)); let why=''; if((c.age||0)>=STAFF_RET_AGE)why=`${c.name} 코치(${c.age}세)가 이번 계약을 끝으로 은퇴하겠다고 합니다.`; else if(c.extY===G.year)why=`${c.name} 코치와는 올해 이미 계약을 손봤습니다.`; else if(c.yrs+add>3)why='보조 코치 계약은 최대 3년까지입니다.'; return {c,add,sal,why}; }
function extendAsst(id,add){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; const c=(G.coachX||[]).find(x=>x.id===id); if(!c)return '보조 코치가 없습니다.'; const T=asstExtTerms(c,1); if(T.why)return T.why; staffCtExtend(c,1); c.sal=T.sal; c.extY=G.year; staffHistory('coach',c,'연장 계약',G.user,`보조 코치 1년 연장 · 연 ${money(c.sal)}`); addLog(`보조 코치 ${c.name}와(과) 1년 연장 계약했습니다(연 ${money(c.sal)}).`); return ''; }
/* 지금 제안할 수 없는 이유('', 가능). 이미 연장했으면 그 사실을 말한다 */
function staffRenewWhy(key){ const f=staffRenewFind(key); if(!f)return '이미 떠났거나 바뀐 사람입니다.'; const s=f.s; if(s.yrs>1)return `${s.name}: 이미 계약을 연장했습니다.`; if(f.kind==='c')return coachExtTerms(f.role,1).why; if(f.kind==='x')return asstExtTerms(s,1).why; const T=mgrExtTerms(1); return T?T.why:'감독이 없습니다.'; }
function staffRenewSal(key){ const f=staffRenewFind(key); if(!f)return null; const T=f.kind==='c'?coachExtTerms(f.role,1):f.kind==='x'?asstExtTerms(f.s,1):mgrExtTerms(1); return T?T.sal:null; }
function staffRenewOffer(key){ const why=staffRenewWhy(key); if(why)return {ok:false,msg:why}; const f=staffRenewFind(key), r=f.kind==='c'?extendCoach(f.role,1):f.kind==='x'?extendAsst(f.s.id,1):extendMgr(1); return r?{ok:false,msg:r}:{ok:true,msg:`${f.s.name}와(과) 1년 재계약했습니다(연 ${money(f.s.sal)}).`}; }
function staffRenewAll(keys){ const L=(keys||staffExpList().map(x=>x.key)).filter(k=>!staffRenewWhy(k)); const done=[]; for(const k of L){ const r=staffRenewOffer(k); if(r.ok)done.push(staffRenewFind(k).s.name); } return {n:done.length,names:done,msg:done.length?`${done.length}명과 1년씩 재계약했습니다: ${done.join(', ')}.`:'재계약할 수 있는 사람이 없습니다.'}; }
function staffExpNote(){ const L=staffExpList().filter(x=>x.s.expN!==G.year); if(!L.length)return null; L.forEach(x=>x.s.expN=G.year); const ok=L.filter(x=>!staffRenewWhy(x.key));
  const line=x=>{ const why=staffRenewWhy(x.key), sal=staffRenewSal(x.key); return `· ${x.l} ${x.name}(${x.age}세): ${why?why:`1년 재계약 · 연 ${money(sal)}${sal!==x.s.sal?` (지금 ${money(x.s.sal)})`:''}`}`; };
  const acts=[...(ok.length>1?[{l:`모두 재계약 제안(${ok.length}명)`,a:'stRenewAll',v:ok.map(x=>x.key).join(',')}]:[]),...ok.map(x=>({l:`재계약 제안 · ${x.name}`,a:'stRenew',v:x.key})),{l:'코치진 보기',a:'go',v:'staff:coach'}];
  return mail('운영팀',`올해로 계약이 끝나는 코치·감독 ${L.length}명`,`이번 시즌으로 계약이 끝납니다.\n${L.map(line).join('\n')}\n\n재계약 제안은 1년 연장이고 조건은 코치진·감독 화면의 연장과 같습니다. 그대로 두면 시즌 뒤 코치 후보로 나가지만 후보 목록에서 다시 영입할 수 있습니다.${cRetTxt(L.filter(x=>!x.key.startsWith('m:')).map(x=>x.s))}`,{kind:'스태프',acts}); }
function coachExpNote(){ return staffExpNote(); }

/* 보조 코치(커뮤니티 요청 11-07: 훈련 시설 단계가 높으면 코치를 더 둘 수 있게): 4단계 이상 세부 시설 하나마다 1자리, 최대 3자리.
   투수·타격 쪽 후보(1·2군 투수·타격·배터리 코치)를 데려와 그 분야 선수 성장에 작게 보탠다(1명당 육성력에 따라 최대 +2.5%) */
const AX_ROLES=['pc','fp','bc','fb','cc'], AX_MAX=3;
function axSlots(tid){ return Math.min(AX_MAX,FACK.filter(k=>(tid==null||tid===G.user?facOf(k):facLvK(tid,k))>=4).length); } /* 어느 구단이든 그 구단 시설 단계로(다른 구단은 99_ai_parity가 코치 시장에서 채운다) */
const axP=c=>['pc','fp','cc'].includes(c.role);
function axBoost(p){ const X=p.team!=null?axOf(p.team).slice(0,Math.max(0,axSlots(p.team)-pcN(p.team))):[]; /* 정원 밖 코치는 일일 계약 정리 전에도 지도 효과를 주지 않는다. */ const pc=pcAxBoost(p); /* 플레잉코치(99c_playing_coach): 보조 코치의 절반 */ if(!X.length)return 1+pc; return 1+pc+sum(X.filter(c=>axP(c)===!!p.isP&&coachActiveNow(c)).map(c=>clamp((c.dv-50)/800,0,.025))); }
/* 시설 단계가 시즌 중 내려가도 실제 계약을 정리한다. 먼저 플레잉코치를 풀고, 남은 보조 코치는 기존 잔여 연봉 절반 규칙으로 정산한다. */
function asstCapacity(tid){ const X=axOf(tid); pcTrim(tid); const n=Math.max(0,axSlots(tid)-pcN(tid)); if(X.length<=n)return []; const out=X.splice(n); for(const c of out){ coachPaySev(tid,c); staffHistory('coach',c,'보조 코치 계약 종료',tid,'시설 축소로 인한 정원 조정'); delete c.ax; c.yrs=0; (G.cmarket=G.cmarket||[]).push(c); } if(tid===ME())mail('운영팀','보조 코치 자리 축소',`시설 단계가 내려가 보조 코치 ${out.map(c=>c.name).join(', ')}와(과) 계약을 정리했습니다(잔여 연봉 절반 정산).`,{kind:'코치'}); return out; }
function asstCapacityDaily(){ for(const t of G.teams||[])asstCapacity(t.id); }
function hireAsst(id,years){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; years=Math.round(+years); if(!(years>=1&&years<=3))return '보조 코치 계약은 1~3년입니다.'; const X=G.coachX=G.coachX||[]; if(axRoom(G.user)<=0)return `보조 코치 자리가 없습니다(4단계 이상 세부 시설 하나마다 1자리, 지금 ${axSlots()}자리${pcN(G.user)?' · 플레잉코치 1명 포함':''}).`;
  const c=(G.cmarket||[]).find(x=>x.id===id); if(!c||!AX_ROLES.includes(c.role))return '투수·타격·배터리 코치 후보만 보조 코치로 둘 수 있습니다.';
  if(typeof schMarketWhy==='function'){ const why=schMarketWhy(c); if(why)return why; } { const why=coachHireWhy(G.user,c,{years,cur:null}); if(why)return why; } staffCt(c,years); c.ax=true; delete c.res; delete c.folM; delete c.gmFol; X.push(c); G.cmarket=G.cmarket.filter(x=>x.id!==id); if(typeof schStaffJoined==='function')schStaffJoined(c,G.user); try{ obTaken(c.ob,c); }catch(e){} staffHistory('coach',c,'보조 코치 영입',G.user,`${years}년 · 연 ${money(c.sal)}`); addLog(`${c.name}을(를) 보조 ${axP(c)?'투수':'타격'}코치로 ${years}년 연 ${money(c.sal)}에 영입했습니다.`); return ''; }
function fireAsst(id){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; const X=G.coachX||[]; const c=X.find(x=>x.id===id); if(!c)return '보조 코치가 없습니다.'; const pay=coachSev(c); ledgerMe('coach',pay); G.coachX=X.filter(x=>x!==c); staffHistory('coach',c,'보조 코치 계약 종료',G.user,'단장 해임'); c.yrs=0; delete c.ax; G.cmarket.push(c); addLog(`보조 코치 ${c.name}을(를) 내보냈습니다(잔여 연봉 정산 ${money(pay)}).`); return ''; }
function asstYear(){ for(const [tid,o] of Object.entries(G.orgT||{})){ if(!o||!o.coachX||!o.coachX.length)continue; for(const c of o.coachX){ const ob=c.ob&&G.ob?G.ob.find(x=>x.id===c.ob):null; if(ob)c.age=ob.age; else c.age++; if(c.cs!=null&&c.cs>G.year)continue; c.yrs--; } const ret=o.coachX.filter(c=>!(c.cs!=null&&c.cs>G.year)&&staffRetNow(c)); for(const c of ret){ staffHistory('coach',c,'은퇴',+tid,`보조 코치 · ${c.age}세`); delete c.ax; c.yrs=0; } const gone=o.coachX.filter(c=>c.yrs<=0&&!ret.includes(c)); o.coachX=o.coachX.filter(c=>c.yrs>0&&!ret.includes(c)); for(const c of gone){ staffHistory('coach',c,'보조 코치 계약 만료',+tid); delete c.ax; c.fromY=G.year; (G.cmarket=G.cmarket||[]).push(c); } } /* 떠난 구단에 남겨 둔 보조 코치도 나이·계약이 흐른다(검수 11-08) */
  const X=G.coachX||[]; for(const c of X){ { const o=c.ob&&G.ob?G.ob.find(x=>x.id===c.ob):null; if(o)c.age=o.age; else c.age++; } /* OB 출신은 OB 기록 나이(검수 11-07) */ if(c.cs!=null&&c.cs>G.year)continue; c.yrs--; } const ret=X.filter(c=>!(c.cs!=null&&c.cs>G.year)&&staffRetNow(c)); /* 정식 코치와 같은 은퇴 규칙: 72세면 계약이 남아도 은퇴(검수 11-17 #268) */ for(const c of ret){ staffHistory('coach',c,'은퇴',G.user,`보조 코치 · ${c.age}세`); delete c.ax; c.yrs=0; } if(ret.length&&!G.unemp)mail('운영팀','보조 코치 은퇴',`${ret.map(c=>`${c.name}(${c.age}세)`).join(', ')} 보조 코치가 지도자 생활을 마치고 은퇴했습니다. 빈 자리는 코치 시장에서 채워 주세요.`,{kind:'코치'}); const gone=X.filter(c=>c.yrs<=0&&!ret.includes(c)); G.coachX=X.filter(c=>c.yrs>0&&!ret.includes(c)); for(const c of gone){ staffHistory('coach',c,'보조 코치 계약 만료',G.user); delete c.ax; c.fromY=G.year; G.cmarket.push(c); }
  asstCapacityDaily();
  if(gone.length)mail('운영팀','보조 코치 계약 만료',`${gone.map(c=>c.name).join(', ')}의 보조 코치 계약이 끝났습니다.`,{kind:'코치'}); }

/* 구단 지원 코치 교육. 이력은 사람에게, 지원 인연은 비용을 댄 구단에 남는다. */
const COACH_STUDY_LIMIT=12;
function coachEmployer(c){if(!c)return null;for(const t of G.teams||[])if(Object.values(G.coach?.[t.id]||{}).includes(c))return t.id;if((G.coachX||[]).includes(c))return G.user;for(const [tid,o]of Object.entries(G.orgT||{}))if((o.coachX||[]).includes(c))return +tid;return null;}
function coachStudyLedger(c){const L=Array.isArray(c?.studyHist)?c.studyHist:[],seen=new Set();return L.filter(h=>{if(!h||typeof h!=='object')return false;const key=h.key??[h.tid,h.program,h.from,h.to,h.status].join(':');if(seen.has(key))return false;seen.add(key);return true;});}
function coachStudyCopy(h){return {...h,...(h.before?{before:{...h.before,...(h.before.ab?{ab:{...h.before.ab}}:{})}}:{}),...(h.after?{after:{...h.after,...(h.after.ab?{ab:{...h.after.ab}}:{})}}:{})};}
function coachSupportView(c,tid){const base=Number.isFinite(c?.loy)?clamp(c.loy,0,100):20,history=coachStudyLedger(c).filter(h=>h.status==='completed'&&h.tid===tid).map(coachStudyCopy),active=tid!=null&&coachEmployer(c)===tid;let bonus=0;if(active)for(const h of history){if(!Number.isFinite(h.to)||!Number.isFinite(h.loyalty)||h.loyalty<=0)continue;const age=G.day-h.to;if(age<0)continue;bonus+=h.loyalty*(age<=365?1:age<=730?.5:age<=1095?.25:0);}bonus=Math.min(18,Math.round(bonus*10)/10);return {base,bonus,loyalty:clamp(base+bonus,0,100),history};}
function coachLoyalty(c,tid){return coachSupportView(c,tid).loyalty;}
function coachStudyAttrs(c){if(c?.ab)return {...c.ab};if(!c)return {};return {...cAb({...c})};}
function coachStudyGained(c){return Math.round(sum(coachStudyLedger(c).filter(h=>h.status==='completed'&&Number.isFinite(h.gain)).map(h=>Math.max(0,h.gain)))*10)/10;}
function coachStudyFields(c){const A=coachStudyAttrs(c);return [...new Set([...(CDOM[c?.role]||[]),'yng','com','ana'])].filter(k=>CAB[k]).map(k=>({k,l:CAB[k],value:A[k]??45}));}
function coachStudyForecast(c,focus,raw){const value=coachStudyAttrs(c)[focus]??90,remaining=Math.max(0,COACH_STUDY_LIMIT-coachStudyGained(c)),room=Math.max(0,90-value),d=raw*clamp((90-value)/30,.2,1);return Math.max(0,Math.floor(Math.min(room,remaining,d)*10+1e-6)/10);}
function coachStudyGrow(c,focus,raw){const A=cAb(c),model0={...c,ab:{...A}};coachSync(model0);const before={value:focus&&A[focus]!=null?A[focus]:null,sk:c.sk,dv:c.dv,ab:{...A}},keys=focus&&CAB[focus]?[focus]:[...new Set([...(CDOM[c.role]||[]),'yng'])];let room=Math.max(0,COACH_STUDY_LIMIT-coachStudyGained(c)),gain=0;
  for(let i=0;i<keys.length;i++){const k=keys[i],v=A[k]??45,want=raw*clamp((90-v)/30,.2,1),d=Math.max(0,Math.floor(Math.min(90-v,want,room/(keys.length-i))*10+1e-6)/10);A[k]=d>0?Math.round((v+d)*10)/10:v;gain+=d;room-=d;}
  const model1={...c,ab:{...A}};coachSync(model1);for(const k of ['sk','dv']){const old=Number.isFinite(before[k])?before[k]:model0[k];c[k]=Math.max(old,Math.min(90,old+Math.max(0,model1[k]-model0[k])));}return {before,after:{value:focus&&A[focus]!=null?A[focus]:null,sk:c.sk,dv:c.dv,ab:{...A}},gain:Math.round(gain*10)/10};}
