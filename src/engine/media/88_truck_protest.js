/* ===== 팬 트럭 시위 =====
 실제 KBO 사례를 본떴다(언론 보도 기준):
  - 2021년 겨울 한화·두산 팬 트럭 시위, 2023년 한화 팬이 감독 경질 과정을 문제 삼아 그룹 본사·상암·백화점 앞을 나흘간 돈 시위
  - 2022년 7월 롯데 팬 50여 명이 1톤 LED 트럭으로 잠실 롯데월드타워 앞 8시간 시위(구단주에게 단장·감독 경질 요구, 23점 차 패배·4연패 뒤)
  - 2023년 KIA 팬 '감독 퇴진' 트럭 시위: 온라인 모금 900여만 원, 뒤에 모금액 정산 논란으로 고소까지
  - 2026년 5월 한화 팬 연대가 그룹 본사 앞에서 감독·단장 동반 사퇴 요구(투수 운용·전력 보강 실패)
 공통점: 온라인 커뮤니티에서 모금 → LED 전광판 트럭을 그룹 본사·홈구장 앞에 세움 → 구단주에게 감독·단장·대표 책임을 묻는다. 구단은 대개 공식 입장을 내지 않는다.
 이 게임에서는
  - 계기: 하위권 + 연패, 팬 여론 바닥, 큰 실망(성적 기대와 차이). 가끔은 별것 아닌 이유(굿즈·응원·티켓)로도 트럭이 오고, 그럴 때 구단은 신경 쓰지 않는다
  - 강도 1(하루, 홈구장 앞, 구단 무시) · 2(이틀, 홈구장 앞) · 3(나흘, 그룹 본사 앞, 구단주가 직접 압박)
  - 강도 2·3은 단장이 대응을 고른다(사과 입장문·팬 간담회·무대응). 무대응이면 구단주 신뢰와 팬 여론이 더 깎인다
  - 한 시즌 두 번까지, 40일 간격. 가끔 모금 정산 논란 후속 기사 */
const TRUCK_LINE={
  mgr:[m=>`${m} 감독 OUT, 더는 못 참는다`,m=>`작전도 계획도 없는 야구, ${m} 감독은 물러나라`,()=>'불펜은 소모품이 아니다, 투수 운용 책임져라',()=>'이기는 법을 잊은 벤치, 팬들은 지쳤다'],
  gm:[g=>`보강 없는 겨울, 하위권은 예고된 결과였다`,g=>`${g} 단장은 책임지고 물러나라`,()=>'팬은 기다렸다, 프런트는 무엇을 했나',()=>"'리빌딩'이라는 말, 이제 그만 듣고 싶다"],
  both:[(m,g)=>`${m} 감독·${g} 단장 동반 사퇴하라`,(m,g,t)=>`${t} 팬은 더 이상 침묵하지 않는다`,(m,g,t,o)=>`${o}님, ${t} 야구를 살려 주십시오`,()=>'꼴찌에 익숙해지라는 말입니까'],
  mild:[()=>'원정 유니폼 예전 디자인으로 돌려내라',()=>'홈 경기 먹거리 가격 너무 비싸다',p=>`${p} 선수 1군에서 보고 싶다`,()=>'주말 예매 대기열 개선하라',()=>'응원가 원곡 그대로 돌려 달라',()=>'굿즈 재고 좀 넉넉히 만들어 주세요']};
function truckState(){ const S=G.truck=G.truck||{y:G.year,n:0,last:-99,log:[]}; if(S.y!==G.year){ S.y=G.year; S.n=0; } return S; }
function truckStreak(tid){ const L=(G.sea&&G.sea.tl&&G.sea.tl[tid])||[]; let n=0; for(let i=L.length-1;i>=0&&L[i][0]<0;i--)n++; return n; }
/* 이번 주 시위 위험: 점수와 대상 */
function truckRisk(){ const u=G.user, r=G.sea&&G.sea.rec&&G.sea.rec[u]; prInit(); const fan=G.pr.fan; const n=G.teams.length;
  const g=r?r.w+r.l+(r.t||0):0; let rank=null; try{ rank=standingsNow().findIndex(x=>x.tid===u)+1||null; }catch(e){}
  const st=truckStreak(u); let s=0; const why=[];
  if(period()==='season'&&g>=20&&rank){ if(rank>=n-2){ s+=2; why.push(`${rank}위`); } if(rank===n)s+=1; }
  if(st>=5){ s+=st>=8?2:1; why.push(`${st}연패`); }
  if(fan<35){ s+=fan<25?2:1; why.push('팬 여론 바닥'); }
  return {s,why,st,rank,fan}; }
function truckWeekly(){ if(G.unemp||G.user==null)return; const o=dobj(G.day); if(o.w!==1)return; const S=truckState(); if(S.n>=2||G.day-S.last<40)return;
  const K=truckRisk(); let sev=K.s>=5?3:K.s>=3?2:K.s>=2?1:0;
  if(!sev){ if(period()==='season'&&K.st>=3&&R()<.025){ truckFire(1,'mild',K); } return; } /* 별것 아닌 이유로도 가끔 */
  if(R()<(sev===3?.45:sev===2?.2:.06))truckFire(sev,null,K); }
function truckFire(sev,kind,K){ const S=truckState(); S.n++; S.last=G.day; const t=team(G.user), m=G.mgr[G.user], tn=`${t.city} ${t.nick}`;
  const mn=m&&!m.interim?m.name:'감독대행', gn=meName()||'단장', on='구단주'; let who=kind;
  if(!who){ const newMgr=m&&m.hD!=null&&G.day-m.hD<120; /* 새 감독은 아직 탓하지 않는다 */ who=sev===3?'both':newMgr?'gm':(K.st>=5?'mgr':R()<.5?'gm':'mgr'); }
  const pool=TRUCK_LINE[who]; const pk=pool[Math.floor(R()*pool.length)]; let pl='';
  if(who==='mild'){ const q=domestic(G.user).filter(x=>!x.e1&&!x.ys&&x.age<=25).sort((a,b)=>ovr(b)-ovr(a))[0]; pl=q?q.name:'유망주'; }
  const line=who==='mild'?pk(pl):pk(who==='gm'?gn:mn,gn,tn,on);
  const days=sev===3?4:sev===2?2:1, where=sev===3?'모기업 본사 앞':`${t.city} 홈구장 앞`; const fund=Math.round((sev===3?900+R()*1100:sev===2?400+R()*500:120+R()*180)/10)*10; const ppl=sev===3?Math.round(60+R()*60):sev===2?Math.round(25+R()*30):Math.round(5+R()*10);
  const cause=K.why.length?K.why.join(' · '):'';
  const body=`${tn} 팬 ${ppl}여 명이 온라인 커뮤니티에서 ${fund}만 원을 모아 LED 전광판 트럭을 ${where}에 ${days}일 동안 세웠습니다. 전광판 문구: "${line}"${cause?` (계기: ${cause})`:''}`;
  S.log.unshift({d:G.day,sev,who,line,where}); if(S.log.length>12)S.log.length=12;
  if(sev===1){ news('구단',`${tshort(G.user)} 팬, ${where}에 트럭 시위`,body+' 구단은 "특별한 입장은 없다"는 반응입니다.',0,{fanW:.3});
    note('홍보팀',`${where}에 팬 트럭이 하루 서 있었습니다. 문구는 "${line}". 규모가 작아 구단은 따로 대응하지 않기로 했습니다.`); return; }
  news('구단',sev===3?`성난 ${t.nick} 팬, ${where}까지 트럭 시위…"${line}"`:`${tshort(G.user)} 팬 트럭 시위…"${line}"`,body,sev===3?-3:-2,{fanW:1});
  if(sev===3){ const C=contactRecord('own:'+G.user); C.bond=clamp((C.bond??30)-3,0,100);
    mail('구단주실','본사 앞 트럭 시위에 대해',`${on}: 본사 앞에 ${days}일째 우리 팬들 트럭이 서 있습니다. 전광판에 "${line}"라고 떠 있더군요. 그룹 안에서도 말이 많습니다.\n남은 시즌을 어떻게 수습할지 단장이 직접 정리해서 움직여 주세요. 결과로 보여 주길 바랍니다.`,{imp:true,kind:'구단주'}); }
  const F=sev===3?{fan:[3,5,-4],own:[0,0,-5],cost:400}:{fan:[2,4,-2],own:[0,0,-1],cost:250};
  evNew('truck',`팬 트럭 시위 대응 (${where})`,`${body}\n기자들이 구단 입장을 묻고 있습니다.`,[
    {l:'사과 입장문 발표',fx:`팬 여론 +${F.fan[0]}, 언론 +1. 책임을 인정하는 모양이 됩니다`},
    {l:'팬 간담회 열기',fx:`비용 ${money(F.cost)}, 팬 여론 +${F.fan[1]}. 단장이 직접 팬 대표를 만납니다`},
    {l:'무대응',fx:`팬 여론 ${F.fan[2]}, 구단주 신뢰 ${F.own[2]}. "특별한 입장 없다"`}],{def:2,exp:3,from:sev===3?'구단주실':'홍보팀',data:{sev,F,line}});
  if(R()<.1)evFollow(20+Math.floor(R()*20),'truck',{fund,line}); }
EVH.truck={ pick(e,i){ const {F}=e.data; prInit(); const C=contactRecord('own:'+G.user);
    if(i===0){ G.pr.fan=clamp(G.pr.fan+F.fan[0],0,100); G.pr.press=clamp(G.pr.press+1,0,100); return '입장문이 나갔습니다. "팬 여러분의 질책을 무겁게 받아들입니다." 시위대는 일단 해산했습니다.'; }
    if(i===1){ G.spend.etc=(G.spend.etc||0)+F.cost; G.pr.fan=clamp(G.pr.fan+F.fan[1],0,100); return '팬 대표들과 두 시간 넘게 이야기했습니다. 다 풀리지는 않았지만 "들어 주긴 했다"는 반응입니다.'; }
    G.pr.fan=clamp(G.pr.fan+F.fan[2],0,100); C.bond=clamp((C.bond??30)+F.own[2],0,100); return '구단은 입장을 내지 않았습니다. 커뮤니티에서는 "역시 무시한다"는 글이 쏟아지고 있습니다.'; },
  follow(d){ news('구단',`트럭 시위 모금액 정산 논란`,`지난 트럭 시위("${d.line}")에 쓰인 팬 모금 ${d.fund}만 원의 사용 내역이 공개되지 않아 일부 참여자가 문제를 제기했습니다. 구단과는 무관한 일입니다.`,0); } };
