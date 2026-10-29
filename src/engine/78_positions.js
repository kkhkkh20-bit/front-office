/* ===== 수비 포지션: 뛰면서 배운다 =====
 - 선수마다 포지션별 숙련도(0~100)가 있다. 주 포지션은 100. 처음에는 아마추어 때 함께 연습한 자리(예전 서브 포지션)만 50쯤 익숙하다.
 - 그 자리에서 경기를 뛰거나(1군 출전), 전환 훈련을 하면(2군에서는 그 자리로 경기도 나간다) 숙련도가 오른다.
 - 다재다능(vers, 20~80): 높을수록 낯선 자리에서 덜 흔들리고 빨리 배운다. 낮으면 다른 자리는 어렵다.
   어려운 자리일수록 다재다능이 받쳐 줘야 전환을 시킬 수 있다(포수 50, 유격수·중견수·2루수 45, 3루·좌익·우익 35 이상, 1루는 누구나).
 - 그 자리 수비 평가 = 수비 능력 - (자리 난이도 × 다재다능 보정 × (1 - 숙련도 × 0.85)).
 - 전환 훈련으로 숙련도 90을 넘기면 감독이 그 자리를 주 포지션으로 바꾼다. 원래 자리는 숙련 100으로 남는다.
 - 수비 집중 훈련(수비 능력 자체)과는 별개다. */
const POS_F=['C','1B','2B','3B','SS','LF','CF','RF'];
const POS_NEED={C:50,SS:45,CF:45,'2B':45,'3B':35,LF:35,RF:35,'1B':0};
function versOf(p){ if(p.vers==null)p.vers=Math.round(clamp(50+hn('vers',p.id)*13+(((p.r&&p.r.spd)||50)-50)*.25+(['SS','2B','CF'].includes(p.pos)?6:p.pos==='1B'||p.pos==='DH'?-7:p.pos==='C'?-3:0),20,80)); return p.vers; }
function pexpOf(p){ if(!p.pexp){ p.pexp={}; if(SUBMAP[p.pos]){ let n=0; for(const [k,pr] of SUBMAP[p.pos]){ if(n<2&&u01('sub'+k,p.id)<pr){ p.pexp[k]=50; n++; } } } } return p.pexp; }
function posRaw(from,pos){ const IF=['2B','SS','3B'], OF=['LF','CF','RF'];
  if(pos==='C')return 25; if(pos==='1B')return 4; if(IF.includes(pos)&&IF.includes(from))return pos==='SS'?7:5; if(OF.includes(pos)&&OF.includes(from))return pos==='CF'?8:4;
  if(OF.includes(pos))return pos==='CF'?13:10; return 14; }
const versF=p=>clamp(2-versOf(p)/50,.55,1.4);
function posExp(p,pos){ return p.pos===pos?100:(pexpOf(p)[pos]||0); }
function posLearnRate(p){ return Math.pow(versOf(p)/50,1.5)*(p.age<=22?1.3:p.age<=25?1.1:p.age<=29?.9:.6); }
function posGain(p,pos,x){ if(pos===p.pos||!POS_F.includes(pos))return; const E=pexpOf(p); const e=E[pos]||0; E[pos]=Math.min(100,+(e+x*(1-e/120)).toFixed(1)); }
/* 매주: 1군에서 다른 자리로 뛴 경기만큼 배우고, 전환 훈련 중이면 훈련(2군이면 그 자리로 경기도)으로 배운다 */
function posWeek(){ const per=period(); const y=G.year; const done=[];
  for(const p of Object.values(G.players)){ if(p.isP||p.team==null)continue; const u=p.use;
    if(u&&u.y===y&&u.pos){ const seen=p.useSeen&&p.useSeen.y===y?p.useSeen.pos:{}; for(const k in u.pos){ const n=u.pos[k]-(seen[k]||0); if(n>0&&k!==p.pos)posGain(p,k,n*.9*posLearnRate(p)); } p.useSeen={y,pos:Object.assign({},u.pos)}; }
    const C=p.pconv; if(!C)continue; if(per!=='pre'&&per!=='season')continue; if(p.injOut>0)continue;
    posGain(p,C.pos,(1.5+(!p.e1&&per==='season'?2.2:0))*posLearnRate(p));
    if(posExp(p,C.pos)>=90){ const old=p.pos; pexpOf(p)[old]=100; delete p.pexp[C.pos]; p.pos=C.pos; delete p.pconv; story(p,`${y} ${POSK[old]}에서 ${POSK[C.pos]}로 포지션 전환`); if(p.team===G.user&&!G.unemp)done.push(`${p.name}: ${POSK[old]} → ${POSK[C.pos]}`); } }
  if(done.length){ const m=G.mgr[G.user]; mail('감독실',`포지션 전환 완료 (${done.length}명)`,`${m?m.name+' 감독':'코치진'}: 전환 훈련을 마쳐 주 포지션을 바꿉니다.\n\n${done.join('\n')}\n\n원래 자리도 그대로 맡을 수 있습니다.`,{kind:'감독'}); } }
/* 단장 요청: 전환 훈련 시작·중단 */
function posConv(pid,pos){ const p=G.players[pid]; if(!p||p.team!==G.user||p.isP)return '우리 야수만 정할 수 있습니다.'; const m=G.mgr[G.user]; const who=m&&!m.interim?`${m.name} 감독`:'코치진';
  if(!pos){ if(!p.pconv)return ''; const k=p.pconv.pos; delete p.pconv; return `${p.name}의 ${POSK[k]} 전환 훈련을 멈춥니다. 지금까지 익힌 숙련도는 남습니다.`; }
  if(!POS_F.includes(pos)||pos===p.pos)return ''; const v=versOf(p), need=POS_NEED[pos];
  if(v<need)return `${who}: "${p.name}은(는) ${POSK[pos]}를 맡을 만큼 몸놀림이 다양하지 않습니다. 무리입니다." (다재다능 ${dvGrade(v)}, ${POSK[pos]}는 ${dvGrade(need)} 이상 필요)`;
  if(p.age>=33)return `${who}: "이 나이에 새 자리를 익히기는 어렵습니다."`;
  p.pconv={pos,d:G.day}; let tail='';
  if(m&&!m.interim&&m.ego>=70&&isRegular(p)){ m.rel=clamp(m.rel-1,0,100); tail=` ${who}이 주전을 흔드는 게 썩 내키지 않아 합니다(관계 -1).`; }
  const wk=Math.ceil((90-posExp(p,pos))/((1.5+(p.e1?0:2.2))*posLearnRate(p)));
  return `${p.name}: ${POSK[pos]} 전환 훈련을 시작합니다. ${p.e1?'1군에 있는 동안은 훈련 위주이고, 2군에 내려가면 그 자리로 경기에도 나갑니다.':'2군에서 그 자리로 경기에도 나갑니다.'} 지금 속도면 약 ${wk}주 뒤 주 포지션으로 바꿀 수 있습니다.${tail}`; }
function dvGrade(v){ return v>=70?'A':v>=60?'B':v>=50?'C':v>=40?'D':'E'; }
/* 겨울: 한동안 안 뛴 자리는 감각이 조금 떨어진다(주 포지션과 완전히 익힌 자리는 그대로) */
function posYear(){ for(const p of Object.values(G.players)){ if(p.isP||!p.pexp)continue; for(const k in p.pexp){ if(p.pexp[k]<100)p.pexp[k]=+(p.pexp[k]*.93).toFixed(1); if(p.pexp[k]<3)delete p.pexp[k]; } } }
