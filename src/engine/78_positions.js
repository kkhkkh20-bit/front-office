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
  if(OF.includes(pos))return pos==='CF'?13:(from==='3B'||from==='1B'?8:10); return 14; } /* 3루·1루 → 코너 외야는 조금 덜 어렵다 */
const versF=p=>clamp(2-versOf(p)/50,.55,1.4);
function posExp(p,pos){ return p.pos===pos?100:(pexpOf(p)[pos]||0); }
function posLearnRate(p){ return Math.pow(versOf(p)/50,1.5)*(p.age<=22?1.3:p.age<=25?1.1:p.age<=29?.9:.6); }
function posGain(p,pos,x){ if(pos===p.pos||!POS_F.includes(pos))return; const E=pexpOf(p); const e=E[pos]||0; E[pos]=Math.min(100,+(e+x*(1-e/120)).toFixed(1)); }
/* 매주: 1군에서 다른 자리로 뛴 경기만큼 배우고, 전환 훈련 중이면 훈련(2군이면 그 자리로 경기도)으로 배운다 */
function posWeek(){ const per=period(); const y=G.year; const done=[];
  for(const p of Object.values(G.players)){ if(p.isP||p.team==null)continue; const u=p.use;
    if(u&&u.y===y&&u.pos){ const seen=p.useSeen&&p.useSeen.y===y?p.useSeen.pos:{}; for(const k in u.pos){ const n=u.pos[k]-(seen[k]||0); if(n>0&&k!==p.pos)posGain(p,k,n*.9*posLearnRate(p)); } p.useSeen={y,pos:Object.assign({},u.pos)}; }
    const f=p.fuse; if(f&&f.y===y&&f.pos){ const seen=p.fuseSeen&&p.fuseSeen.y===y?p.fuseSeen.pos:{}; for(const k in f.pos){ const n=f.pos[k]-(seen[k]||0); if(n>0&&k!==p.pos)posGain(p,k,n*.9*.75*posLearnRate(p)); } p.fuseSeen={y,pos:Object.assign({},f.pos)}; }
    const C=p.pconv; if(!C)continue; if(per!=='pre'&&per!=='season')continue; if(p.injOut>0||milServing(p))continue; /* 군 복무 중에는 구단 훈련을 받지 못한다 */
    posGain(p,C.pos,1.5*posLearnRate(p)); /* 훈련. 2군에 있으면 2군 라인업에서 그 자리로 경기에도 나가 따로 쌓인다 */
    if(posExp(p,C.pos)>=90){ const old=p.pos; pexpOf(p)[old]=100; delete p.pexp[C.pos]; p.pos=C.pos; delete p.pconv; story(p,`${y} ${POSK[old]}에서 ${POSK[C.pos]}로 포지션 전환`); if(p.team===G.user&&!G.unemp)done.push(`${p.name}: ${POSK[old]} → ${POSK[C.pos]}`); } }
  if(done.length){ const m=G.mgr[G.user]; mail('감독실',`포지션 전환 완료 (${done.length}명)`,`${m?m.name+' 감독':'코치진'}: 전환 훈련을 마쳐 주 포지션을 바꿉니다.\n\n${done.join('\n')}\n\n원래 자리도 그대로 맡을 수 있습니다.`,{kind:'감독'}); } }
/* 단장 요청: 전환 훈련 시작·중단 */
function posConv(pid,pos){ const p=G.players[pid]; if(!p||p.team!==G.user||p.isP)return '우리 야수만 정할 수 있습니다.'; const m=G.mgr[G.user]; const who=m&&!m.interim?`${m.name} 감독`:'코치진';
  if(!pos){ if(!p.pconv)return ''; const k=p.pconv.pos; delete p.pconv; return `${p.name}의 ${POSK[k]} 전환 훈련을 멈춥니다. 지금까지 익힌 숙련도는 남습니다.`; }
  if(!POS_F.includes(pos)||pos===p.pos)return ''; if(p.pconv&&p.pconv.pos===pos)return `${p.name}은(는) 이미 ${POSK[pos]} 전환 훈련 중입니다.`; /* 같은 전환을 다시 눌러도 바뀌는 것이 없다(감독 반응도 다시 없음) */ const v=versOf(p), need=POS_NEED[pos];
  if(v<need)return `${who}: "${p.name}은(는) ${POSK[pos]}를 맡을 만큼 몸놀림이 다양하지 않습니다. 무리입니다." (다재다능 ${dvGrade(v)}, ${POSK[pos]}는 ${dvGrade(need)} 이상 필요)`;
  if(p.age>=33)return `${who}: "이 나이에 새 자리를 익히기는 어렵습니다."`;
  p.pconv={pos,d:G.day}; let tail='';
  if(m&&!m.interim&&m.ego>=70&&!mplOn('listen')&&isRegular(p)){ m.rel=clamp(m.rel-1,0,100); tail=` ${who}이 주전을 흔드는 게 썩 내키지 않아 합니다(관계 -1).`; }
  const wk=Math.ceil((90-posExp(p,pos))/((1.5+(p.e1?0:2))*posLearnRate(p)));
  return `${p.name}: ${POSK[pos]} 전환 훈련을 시작합니다. ${p.e1?'1군에 있는 동안은 훈련 위주이고, 2군에 내려가면 그 자리로 경기에도 나갑니다.':'2군에서 그 자리로 경기에도 나갑니다.'} 지금 속도면 약 ${wk}주 뒤 주 포지션으로 바꿀 수 있습니다.${tail}`; }
function dvGrade(v){ return v>=70?'A':v>=60?'B':v>=50?'C':v>=40?'D':'E'; }
/* 자리 정착: 지난 시즌 1군 선발의 6할 이상을 다른 자리에서 뛰었고(50경기 이상) 그 자리 숙련이 75를 넘으면, 감독이 그 자리를 주 포지션으로 바꾼다.
   유격↔2루, 3루→1루, 코너 외야 거포→1루, 우익→중견처럼 성적을 내려고 옮긴 자리가 그대로 굳는다. 포수는 바뀌지 않는다 */
function posSettle(y){ const out=[]; for(const p of Object.values(G.players)){ if(p.isP||p.team==null||p.pos==='C'||p.pconv)continue; const u=p.use; if(!u||u.y!==y||!u.pos)continue;
    const tot=Object.values(u.pos).reduce((a,b)=>a+b,0); let k=null,n=0; for(const q in u.pos)if(q!=='DH'&&q!==p.pos&&u.pos[q]>n){ n=u.pos[q]; k=q; }
    if(!k||n<50||n<tot*.6||posExp(p,k)<75)continue; const old=p.pos; pexpOf(p)[old]=100; delete p.pexp[k]; p.pos=k; story(p,`${y} ${POSK[old]}에서 ${POSK[k]}로 자리를 옮겨 정착`); if(p.team===G.user&&!G.unemp)out.push(`${p.name}: ${POSK[old]} → ${POSK[k]} (지난 시즌 ${k==='1B'?'1루':POSK[k]} 선발 ${n}경기)`); }
  if(out.length){ const m=G.mgr[G.user]; mail('감독실',`주 포지션 정착 (${out.length}명)`,`${m&&!m.interim?m.name+' 감독':'코치진'}: 지난 시즌 주로 뛴 자리를 주 포지션으로 굳힙니다.\n\n${out.join('\n')}\n\n원래 자리도 그대로 맡을 수 있습니다.`,{kind:'감독'}); } }
/* 감독의 자리 돌리기: 캠프 시작(2월 1일)과 6월 1일에 감독이 이기는 라인업을 짜 보고, 다른 자리에 넣은 주전은 그 자리 전환 훈련을 시킨다.
   수비가 약한 유격수라도 방망이가 좋으면 3루·2루로, 거기서도 밀리면 1루·코너 외야로 옮겨 다니다 수비 부담이 적은 자리에 자리 잡는다.
   다른 사람이 없어 원래 자리를 지키는 선수는 그대로 둔다. 포수는 돌리지 않는다. 우리 구단은 감독이 제안하고 단장이 정한다 */
/* 한 단계 쉬운 자리: 유격→3루·2루, 2루→3루·1루, 3루→1루·코너 외야, 중견→코너 외야, 코너 외야→1루 */
const POS_STEP={SS:['3B','2B'],'2B':['3B','1B'],'3B':['1B','LF','RF'],CF:['LF','RF'],LF:['1B'],RF:['1B']};
function posValLearn(p,q){ const dl=p.r.def-posRaw(p.pos,q)*versF(p)*(1-.9*.85); return ovr(p)-(p.r.def-50)*.2+((POS_ADJ[q]||0)+(dl-DAVG[q])*DWR[q])/RUN_PER_OVR; } /* 그 자리를 익혔다고(숙련 90) 칠 때의 가치 */
function posPlan(tid){ const ln=makeLineup(tid); const out=[];
  for(const k in ln){ const p=ln[k]; if(!p||p.pos==='C'||p.pos==='DH'||p.age>=33||p.pconv)continue; let to=null;
    if(k==='DH'){ /* 방망이로 주전인데 수비 자리가 없다: 한 단계 쉬운 자리 중 익히면 가장 나은 곳 */ const c=(POS_STEP[p.pos]||[]).filter(q=>versOf(p)>=POS_NEED[q]&&posExp(p,q)<90).sort((a,b)=>posValLearn(p,b)-posValLearn(p,a))[0]; if(c&&posValLearn(p,c)>posValAt(p,p.pos))to=c; }
    else if(k!=='C'&&k!==p.pos&&posExp(p,k)<90&&versOf(p)>=POS_NEED[k])to=k;
    if(to)out.push({p,k:to}); } return out; }
function posPlanAll(){ for(const t of G.teams){ const L=posPlan(t.id); if(t.id===ME()){ if(!L.length)continue; const m=G.mgr[G.user]; if(!m)continue; const who=m.interim?'감독대행':`${m.name} 감독`;
      mail(who,`자리 돌리기 제안 (${L.length}명)`,`${who}: 이기는 라인업을 짜 보니 이 선수들은 다른 자리에서 쓰는 편이 낫습니다. 그 자리 전환 훈련을 시키겠습니다.\n\n${L.map(x=>`${x.p.name}: ${POSK[x.p.pos]} → ${POSK[x.k]} (지금 숙련 ${Math.round(posExp(x.p,x.k))})`).join('\n')}\n\n단장님이 정하시면 시작합니다. 육성 탭에서도 정할 수 있습니다.`,{kind:'감독',acts:L.slice(0,3).map(x=>({l:`${x.p.name} ${POSK[x.k]} 훈련`,a:'posConv',v:`${x.p.id}:${x.k}`}))}); continue; }
    for(const x of L){ x.p.pconv={pos:x.k,d:G.day}; story(x.p,`${G.year} ${POSK[x.p.pos]}에서 ${POSK[x.k]}로 전환 훈련 시작`); } } }
function posYear(){ const y=G.year-1; try{ posSettle(y); }catch(e){} for(const p of Object.values(G.players)){ if(p.isP||!p.pexp)continue; const used=k=>(p.use&&p.use.y===y&&p.use.pos&&p.use.pos[k])||(p.fuse&&p.fuse.y===y&&p.fuse.pos&&p.fuse.pos[k]);
  for(const k in p.pexp){ const e=p.pexp[k]; if(e<50&&!used(k)&&!(p.pconv&&p.pconv.pos===k))p.pexp[k]=+(e*.9).toFixed(1); if(p.pexp[k]<3)delete p.pexp[k]; } } } /* 반쯤 익히다 만 자리(숙련 50 미만)는 그해 안 뛰었으면 감각이 떨어진다. 한 번 맡을 만해진 자리는 남는다 */
/* ===== 2군 경기: 누가 어느 자리로 뛰는지 =====
 2군 감독이 매주 라인업을 짠다. 전환 훈련 중인 선수를 그 자리에 먼저 넣고, 나머지는 자리별로 가장 나은 선수를 넣되 24세 이하에게 기회를 더 준다(조금씩 돌려 쓴다).
 선발 9명은 한 주 3경기, 나머지는 1경기 정도 나간다. 2군에서 그 자리로 뛴 경기도 숙련으로 쌓인다(1군 경기의 75%). */
const FGPOS=['C','SS','2B','CF','3B','RF','LF','1B','DH'];
function futLineupE(tid,list){ const used=new Set(), ln={};
  for(const p of list){ const c=p.pconv; if(c&&POS_F.includes(c.pos)&&!ln[c.pos]){ ln[c.pos]=p; used.add(p.id); } }
  const nz=new Map(list.map(p=>[p.id,N(0,2.5)]));
  for(const k of FGPOS){ if(ln[k])continue; const free=list.filter(p=>!used.has(p.id)); if(!free.length)break;
    const sc=p=>(k==='DH'?offV(p):posScore(p,k))+(p.age<=24?3:0)-(k!=='DH'&&k!==p.pos&&posExp(p,k)<50?6:0)+nz.get(p.id);
    const c=free.sort((a,b)=>sc(b)-sc(a))[0]; ln[k]=c; used.add(c.id); }
  return ln; }
function futUse(p,pos,g){ const y=G.year; if(!p.fuse||p.fuse.y!==y)p.fuse={y,g:0,pos:{}}; p.fuse.g+=g; if(pos)p.fuse.pos[pos]=(p.fuse.pos[pos]||0)+g; }
function futText(p){ const u=p.fuse&&p.fuse.y===G.year?p.fuse:null; if(!u||!u.g)return ''; const L=Object.entries(u.pos).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${POSK[k]||k} ${n}`); return `2군 ${u.g}경기${L.length?' · '+L.join(' · '):''}`; }
/* 해마다 1월 1일(겨울 성장 뒤) 능력치를 남겨 둔다: 선수 화면에서 지난 시즌과 비교 */
function rhSnap(){ const y=G.year; for(const p of Object.values(G.players)){ if(p.team==null||p.prospect)continue; p.rh=p.rh||{}; p.rh[y]=Object.assign({},p.r); for(const k of Object.keys(p.rh))if(+k<y-2)delete p.rh[k]; } }
