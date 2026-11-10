/* ===== 팬 트럭 시위 =====
 실제 KBO 사례를 본떴다(언론 보도 기준):
  - 2021년 이후 여러 구단 팬이 성적 부진·감독 경질 과정을 문제 삼아 LED 트럭으로 홈구장·그룹 본사 앞에서 하루~나흘 시위
  - 대패·연패 직후에 모이는 경우가 많고, 온라인 모금 뒤 정산 논란이 이어진 사례도 있다
 공통점: 온라인 커뮤니티에서 모금 → LED 전광판 트럭을 그룹 본사·홈구장 앞에 세움 → 구단주에게 감독·단장·대표 책임을 묻는다. 구단은 대개 공식 입장을 내지 않는다.
 이 게임에서는
  - 계기: 하위권 + 연패, 팬 여론 바닥, 큰 실망(성적 기대와 차이). 가끔은 별것 아닌 이유(굿즈·응원·티켓)로도 트럭이 오고, 그럴 때 구단은 신경 쓰지 않는다
  - 강도 1(하루, 홈구장 앞, 구단 무시) · 2(이틀, 홈구장 앞) · 3(나흘, 그룹 본사 앞, 구단주가 직접 압박)
  - 강도 2·3은 단장이 대응을 고른다(사과 입장문·팬 간담회·무대응). 무대응이면 구단주 신뢰와 팬 여론이 더 깎인다
  - 한 시즌 두 번까지, 40일 간격. 가끔 모금 정산 논란 후속 기사 */
/* 문구는 실제 트럭 시위 보도에 나온 구호 형식을 참고했다(구단·인물 이름은 게임 것을 쓴다) */
const TRUCK_LINE={
  mgr:[m=>`${m} 감독 OUT`,m=>`${m} 감독, 뒤로 숨지 마라`,()=>'선수 기용은 실험실급, 팬심은 이미 임상 실패',()=>'이닝 쪼개기, 구시대 야구, 나갈 이유가 차고 넘친다',()=>'똑같은 패턴으로 지는데 팬들 혈압은 누가 책임지나',()=>'불펜은 소모품이 아니다, 투수 운용 책임져라'],
  gm:[g=>`${g?g+' ':''}단장 OUT`,()=>'답이 없는 육성 시스템, 프런트는 철밥통',()=>'돈 아끼고 성적 포기한 실리야구',()=>'트레이드 해 줘, 용병 바꿔 줘',()=>'유니폼 판매에만 혈안, 스포츠 구단이 유통업인가',()=>'요구에는 책임이 따른다, 과연 누가 책임지고 있는가'],
  both:[(m,g)=>`${m} OUT ${g?g+' ':'단장 '}OUT`,()=>'감독·단장만 바꾸면 끝인가, 무능한 프런트까지 갈아엎어라',(m,g,t)=>`기업의 무관심이 ${t}를 망친다`,()=>'이제는 모기업의 결단이 필요하다',()=>'단장·감독을 안 바꾸면 남는 건 텅 빈 관중석뿐',()=>'프로라는 이름 떼라, 창피하다',(m,g,t,o,dr)=>dr>=3?`결과는 ${dr}년 연속 가을야구 탈락뿐이다`:'팬들은 경쟁을 원한다']};
function truckState(){ const S=G.truck=G.truck||{y:G.year,n:0,last:-99,log:[]}; if(S.y!==G.year){ S.y=G.year; S.n=0; } return S; }
function truckStreak(tid){ const L=(G.sea&&G.sea.tl&&G.sea.tl[tid])||[]; let n=0; for(let i=L.length-1;i>=0&&L[i][0]<0;i--)n++; return n; }
/* 이번 주 시위 위험: 점수와 대상 */
function truckRisk(){ const u=G.user, r=G.sea&&G.sea.rec&&G.sea.rec[u]; prInit(); const fan=G.pr.fan; const n=G.teams.length;
  const g=r?r.w+r.l+(r.t||0):0; let rank=null; try{ rank=standingsNow().findIndex(x=>x.tid===u)+1||null; }catch(e){}
  const st=truckStreak(u); let s=0; const why=[];
  if(period()==='season'&&g>=20&&rank){ if(rank>=n-2){ s+=2; why.push(`${rank}위`); } if(rank===n)s+=1; }
  if(st>=5&&period()==='season'){ s+=st>=8?2:1; why.push(`${st}연패`); } /* 지난 시즌 마지막 연패는 겨울 사유가 아니다 */
  if(fan<35){ s+=fan<25?2:1; why.push('팬 여론 바닥'); }
  return {s,why,st,rank,fan}; }
function truckWeekly(){ if(G.unemp||G.user==null)return; const o=dobj(G.day); if(o.w!==1)return; const S=truckState(); if(S.n>=2||G.day-S.last<40)return;
  const K=truckRisk(); let sev=K.s>=5?3:K.s>=3?2:K.s>=2?1:0;
  if(!sev)return; /* 사소한 이유로는 트럭이 오지 않는다(사용자 11-06) */
  if(R()<(sev===3?.45:sev===2?.2:.06))truckFire(sev,null,K); }
function truckFire(sev,kind,K){ const S=truckState(); S.n++; S.last=G.day; const t=team(G.user), m=G.mgr[G.user], tn=`${t.city} ${t.nick}`;
  const mn=m&&!m.interim?m.name:'감독대행', gn=meName()||'', on='구단주'; let who=kind;
  if(!who){ const newMgr=m&&m.hD!=null&&G.day-m.hD<120; /* 새 감독은 아직 탓하지 않는다 */ who=sev===3?'both':newMgr?'gm':(K.st>=5?'mgr':R()<.5?'gm':'mgr'); }
  const pool=TRUCK_LINE[who]; const pk=pool[Math.floor(R()*pool.length)]; 
  const dr=(()=>{ let n=0; for(const h of [...(G.history||[])].reverse()){ const i=(h.order||[]).findIndex(o=>(o.tid??o)===G.user); if(i>=0&&i<5)break; n++; /* 정규시즌 5위 안 = 가을야구 */ } return n; })(); const line=pk(who==='gm'?gn:mn,gn,tn,on,dr);
  const days=sev===3?4:sev===2?2:1, where=sev===3&&!t.indie?'모기업 본사 앞':sev===3?`${t.city} 구단 사무실 앞`:`${t.city} 홈구장 앞`; /* 독립구단은 모기업이 없다 */ const fund=Math.round((sev===3?900+R()*1100:sev===2?400+R()*500:120+R()*180)/10)*10; const ppl=sev===3?Math.round(60+R()*60):sev===2?Math.round(25+R()*30):Math.round(5+R()*10);
  const cause=K.why.length?K.why.join(' · '):'';
  const body=`${tn} 팬 ${ppl}여 명이 온라인 커뮤니티에서 ${fund}만 원을 모아 LED 전광판 트럭을 ${where}에 ${days}일 동안 세웠습니다. 전광판 문구: "${line}"${cause?` (계기: ${cause})`:''}`;
  S.log.unshift({d:G.day,sev,who,line,where}); if(S.log.length>12)S.log.length=12;
  if(sev===1){ news('구단',`${tshort(G.user)} 팬, ${where}에 트럭 시위`,body+' 구단은 "특별한 입장은 없다"는 반응입니다.',0,{fanW:.3,img:{k:'truck',line,where,tid:G.user,sev}});
    note('홍보팀',`${where}에 팬 트럭이 하루 서 있었습니다. 문구는 "${line}". 규모가 작아 구단은 따로 대응하지 않기로 했습니다.`); return; }
  news('구단',sev===3?`성난 ${t.nick} 팬, ${where}까지 트럭 시위…"${line}"`:`${tshort(G.user)} 팬 트럭 시위…"${line}"`,body,sev===3?-3:-2,{fanW:1,img:{k:'truck',line,where,tid:G.user,sev}});
  if(sev===3&&!t.indie){ const t0=team(G.user); t0.trust=clamp((t0.trust??50)-3,0,100);
    mail('구단주실','본사 앞 트럭 시위에 대해',`${on}: 본사 앞에 ${days}일째 우리 팬들 트럭이 서 있습니다. 전광판에 "${line}"라고 떠 있더군요. 그룹 안에서도 말이 많습니다.\n남은 시즌을 어떻게 수습할지 단장이 직접 정리해서 움직여 주세요. 결과로 보여 주길 바랍니다.`,{imp:true,kind:'구단주'}); }
  const F=sev===3?{fan:[3,5,-4],own:[0,0,t.indie?-1:-5],cost:400}:{fan:[2,4,-2],own:[0,0,-1],cost:250}; /* 독립구단은 모기업 본사가 없어 구단주실이 나서지 않는다(검수 11-08) */
  evNew('truck',`팬 트럭 시위 대응 (${where})`,`${body}\n기자들이 구단 입장을 묻고 있습니다.`,[
    {l:'사과 입장문 발표',fx:`팬 여론 +${F.fan[0]}, 언론 +1. 책임을 인정하는 모양이 됩니다`},
    {l:'팬 간담회 열기',fx:`비용 ${money(F.cost)}, 팬 여론 +${F.fan[1]}. 단장이 직접 팬 대표를 만납니다`},
    {l:'무대응',fx:`팬 여론 ${F.fan[2]}, 구단주 신뢰 ${F.own[2]}. "특별한 입장 없다"`}],{def:2,exp:3,from:sev===3&&!t.indie?'구단주실':'홍보팀',data:{sev,F,line}});
  if(R()<.1)evFollow(20+Math.floor(R()*20),'truck',{fund,line}); }
function truckCostWhy(e,i){ return i===1&&team(G.user).indie&&spendable(G.user)-Math.max(0,(G.spend.etc||0)-(G.spend.trC||0))-(G.spend.fan||0)<e.data.F.cost?`독립구단의 가용 현금이 부족합니다(${money(e.data.F.cost)} 필요).`:''; }
EVH.truck={ can:truckCostWhy, pick(e,i){ const why=truckCostWhy(e,i); if(why)return why; const {F}=e.data; prInit();
    if(i===0){ G.pr.fan=clamp(G.pr.fan+F.fan[0],0,100); G.pr.press=clamp(G.pr.press+1,0,100); return '입장문이 나갔습니다. "팬 여러분의 질책을 무겁게 받아들입니다." 시위대는 일단 해산했습니다.'; }
    if(i===1){ if(team(G.user).indie)spendPay(F.cost); else G.spend.etc=(G.spend.etc||0)+F.cost; G.pr.fan=clamp(G.pr.fan+F.fan[1],0,100); return '팬 대표들과 두 시간 넘게 이야기했습니다. 다 풀리지는 않았지만 "들어 주긴 했다"는 반응입니다.'; }
    G.pr.fan=clamp(G.pr.fan+F.fan[2],0,100); { const t=team(G.user); t.trust=clamp((t.trust??50)+F.own[2],0,100); } /* 구단주 신뢰(평가)에서 깎는다 */ return '구단은 입장을 내지 않았습니다. 커뮤니티에서는 "역시 무시한다"는 글이 쏟아지고 있습니다.'; },
  follow(d){ news('구단',`트럭 시위 모금액 정산 논란`,`지난 트럭 시위("${d.line}")에 쓰인 팬 모금 ${d.fund}만 원의 사용 내역이 공개되지 않아 일부 참여자가 문제를 제기했습니다. 구단과는 무관한 일입니다.`,0); } };
