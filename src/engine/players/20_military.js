/* ===== 병역: 상무·현역 입대, 올림픽 특례 =====
 KBO 실제: 상무(국군체육부대) 복무 1년 6개월, 복무 중 퓨처스리그 출전 가능. 올림픽 동메달 이상은 체육요원 편입.
 게임 규칙: 만 28세가 되는 해까지 입대하지 않으면 현역으로 입대한다. 상무 지원은 9~10월(12월 입대)과 3~4월(6월 입대) 두 번. 올림픽은 2028 LA 이후 4년마다 열린다고 가정. */
const MIL_DAYS=548, SANGMU_SLOTS=14;
function milPeriod(p){const m=p&&p.mil;if(!m)return null;const from=m.from??m.pf,until=m.until??m.pu;return Number.isFinite(from)&&Number.isFinite(until)&&until>from?{from,until,unit:m.unit}:null;}
const milOn=(p,d)=>{const m=milPeriod(p);return !!(m&&m.from<=d&&d<m.until);}, milServing=p=>milOn(p,G.day); /* 실제 입대일부터 전역일 전까지만 복무 중(milOn: 그날 병역 처리 뒤 기준, 검수 11-09zk) */
const isAway=p=>!!(milServing(p)||(p.ntAway&&p.ntAway>G.day&&p.ntFrom<=G.day)||(typeof sisFlAwayOn==='function'&&sisFlAwayOn(p)));
/* 복무 중 훈련 환경: 상무는 상무 야구단 시설·코치진 아래 퓨처스리그에서 뛰고(구단 시설·코치·감독 영향 없음), 현역은 야구 훈련을 하지 못해 늘지 않고 조금씩 떨어진다 */
const MIL_FAC={'상무':{l:'상무 야구단 시설',g:1,d:1},'현역':{l:'군 복무(야구 훈련 없음)',g:1,d:1}};
function milTrainTxt(p){ if(!p||!milServing(p))return ''; const no='우리 구단 시설·코치진·훈련 지시·포지션 전환·해외 연수는 적용되지 않습니다.';
  return p.mil.unit==='상무'?`상무(국군체육부대) 복무 중: 상무 야구단 시설·코치진 아래 퓨처스리그에서 뛰며 훈련합니다. ${no}`:`현역 복무 중: 야구 훈련을 하지 못해 능력이 늘지 않고 체력·기술이 조금씩 떨어집니다. ${no}`; }
const milFree=p=>!p.foreign&&!(p.mil&&(p.mil.done||p.mil.exempt||p.mil.until));
function milInit(p){ if(p.mil!==undefined||p.foreign)return; const a=p.age; const u=u01('mil',p.id);
  p.mil=a>=28?(u<.9?{done:true}:u<.95?{exempt:true}:null):a>=25?(u<.55?{done:true}:u<.6?{exempt:true}:null):a>=22?(u<.2?{done:true}:null):null; }
function milText(p){ if(p.foreign)return '해당 없음'; const m=p.mil; if(!m)return `미필 · ${G.year+Math.max(0,27-p.age)}년까지 입대`; if(m.exempt)return '면제(체육요원)'; if(m.done)return '군필';
  if(m.until&&m.from<=G.day&&m.until>G.day)return `${m.unit} 복무 중 · ${dmdY(m.until)} 전역`; if(m.until&&m.from>G.day)return `${m.unit} 입대 예정 · ${dmdY(m.from)}`; if(m.app)return `상무 지원 중(${m.app==='dec'?'12월':'6월'} 입대)`; return '미필'; }
function enlist(p,unit,from){ p.mil={unit,from,until:from+MIL_DAYS}; try{ ovsEnlCheck(p); }catch(e){} const cn=G.contract&&G.contract.neg&&G.contract.neg[p.id]; if(cn&&cn.st!=='ok'){ p.mil.neg={st:cn.st,ns:p.newSal,has:'newSal' in p,v:cn.cur??cn.off,ask:cn.ask}; /* 예약 전 협상은 선수에게 남긴다: 단장이 떠났다 돌아와도 같은 결과(검수 11-09zx) */ cn.st='ok'; cn.mil=true; p.newSal=p.sal; } /* 복무 선수는 연봉 협상 없이 지금 연봉으로(복무 중 지급 없음). 예약을 취소하면 아래에서 협상 상태를 되돌린다 */ story(p,`${unit} 입대 (${dmd(from)})`,'mil'); if(from<=G.day){ p.e1=false; milChron(p,'입대',unit,from,from+MIL_DAYS); } /* 엔트리는 입대일에 뺀다(합격 발표 때 빼지 않는다) */ if(p.team===G.user)addLog(`${p.name} ${unit} 입대 확정 (${dmd(from)} 입대, ${dmd(from+MIL_DAYS)} 전역 예정).`); }
function sangmuApply(id){ const p=G.players[id]; if(!p||p.team!==G.user||!milFree(p))return '대상이 아닙니다.'; if(p.mil&&p.mil.app)return '이미 지원했습니다.'; const W=sangmuPeriod(),w=W.open?W.wave:null; if(!w)return '상무 지원 기간이 아닙니다. 3월 1일~4월 14일, 9월 1일~10월 14일에 지원할 수 있습니다.'; if(sangmuEntryAge(p,W)>27)return '상무는 입대 연도에 27세까지만 지원할 수 있습니다.';
  p.mil={app:w}; addLog(`${p.name}이(가) 상무에 지원했습니다.`); return ''; }
function sangmuFrom(wave,y=G.year){return dnum(y,wave==='dec'?12:6,10);}
function sangmuPeriod(d=G.day){const y=dobj(d).y;let year=y,wave;if(d<dnum(y,4,15))wave='jun';else if(d<dnum(y,10,15))wave='dec';else {year++;wave='jun';}const start=dnum(year,wave==='dec'?9:3,1),end=dnum(year,wave==='dec'?10:4,14);return {wave,year,start,end,from:sangmuFrom(wave,year),open:d>=start&&d<=end};}
function sangmuEntryAge(p,W=sangmuPeriod()){return p.age+dobj(W.from).y-G.year;}
function sangmuCanApply(p){const W=sangmuPeriod();return !!p&&p.team===G.user&&milFree(p)&&!p.mil?.app&&W.open&&sangmuEntryAge(p,W)<=27;}
function sangmuWave(){const W=sangmuPeriod();return W.open?W.wave:null;}
/* 단장이 예약한 현역 입대는 입대일 전까지 취소할 수 있다(28세 강제 입대·상무 합격은 제외) */
function enlistCancel(id){ const p=G.players[id]; const m=p&&p.mil; if(!p||p.team!==G.user||!m||!m.until||!m.byGM||m.from<=G.day)return '취소할 수 있는 입대 예약이 없습니다.'; p.mil=m.app0&&sangmuWave()===m.app0?{app:m.app0}:null; /* 지원 기간 안이면 상무 지원을 되살린다(검수 11-07) */ milNegBack(p,m); story(p,'현역 입대 예약 취소','mil'); return ''; }
/* 입대 확정으로 '합의'가 된 연봉 협상을 예약 전 상태로(예약 취소·병역 특례) */
function milNegBack(p,m){ { const cn=G.contract&&G.contract.neg&&G.contract.neg[p.id], q=m&&m.neg||cn&&cn.milPrev; /* milPrev: 옛 저장 */ if(q&&!(cn&&cn.mil)){ if(p.newSal==null&&(q.st==='open'||q.st==='arb')){ if(q.ask>q.v*HOLD_GAP)holdStart(p,q.v,q.ask); else p.sal=Math.max(MIN_SAL,q.v); } return; } /* 협상 기록이 이미 인계로 닫혔으면 확정 때 결과(구단안 계약 또는 미계약)로. shortcut: 조정 신청 상태도 구단안 기준, 사례가 생기면 조정 판정 */ if(cn&&cn.mil&&q){ cn.st=q.st; delete cn.mil; delete cn.milPrev; if(q.has)p.newSal=q.ns; else delete p.newSal;
    if(G.contract.done&&cn.st==='arb'){ try{ salArbDecide(); }catch(e){} if(p.newSal!=null){ p.sal=Math.max(MIN_SAL,p.newSal); delete p.newSal; } } /* 확정이 끝난 뒤 취소하면 조정을 바로 판정(미결로 남지 않게, 검수 11-06) */
    if(G.contract.done&&cn.st==='open'){ const v=cn.cur??cn.off; delete p.newSal; if(cn.ask>v*HOLD_GAP){ holdStart(p,v,cn.ask); cn.st='hold'; } else { p.sal=Math.max(MIN_SAL,v); cn.st='ok'; } } } } /* 계약을 이미 확정한 뒤 취소하면 그때 확정했을 결과(구단안 계약 또는 미계약)로 */ /* 입대 예약이 연봉 합의가 되지 않게: 예약 전 협상 상태(구단안·선수안·진행 중)로 */ }
function enlistNow(id){ const p=G.players[id]; if(!p||p.team!==G.user||!milFree(p))return '대상이 아닙니다.'; const app0=p.mil&&p.mil.app; enlist(p,'현역',G.day+14); p.mil.byGM=true; if(app0)p.mil.app0=app0; return ''; }
/* 상무 추천: 스카우트팀장·감독이 선수별로 의견을 낸다.
   last(마지막 기회): 27세 이상 미필 → 올해 상무에 못 가면 현역. hold(보류): 지금 1군 주전(라인업·로테이션·필승조)이고 26세 이하 → 빠지면 전력 공백, 내년 이후.
   go(지원 권장): 1군 자리가 없는 23~26세 → 2군에 머무는 것보다 상무에서 경기를 뛰는 편이 낫다. wait: 그 밖(22세 이하 등). 합격은 지원자 중 기량 순 14명 */
function milAdvice(p){ if(!p||!milFree(p))return {k:'none',who:'',why:''};
  if(p.mil?.app)return {k:'applied',who:'운영팀',why:`상무 ${p.mil.app==='dec'?'12월':'6월'} 입대 기수에 이미 지원했습니다. 합격자 발표를 기다립니다.`};
  const W=sangmuPeriod(),entryAge=sangmuEntryAge(p,W);
  if(entryAge>27)return {k:'last',who:'운영팀',why:`${!W.open?'현재 상무 접수는 끝났거나 아직 열리지 않았습니다. ':''}다음 입대일 ${dobj(W.from).y}년 ${dmd(W.from)}에는 ${entryAge}세로 상무 지원 나이(입대 연도 27세)를 넘깁니다. 현역 입대 시기를 정해 대체 선수를 준비하세요.`};
  if(!W.open)return {k:'next',who:'운영팀',why:`지금은 상무 지원 기간이 아닙니다. 다음 접수는 ${dobj(W.start).y}년 ${dmd(W.start)}~${dmd(W.end)}, ${dmd(W.from)} 입대 기수(${entryAge}세)입니다. 접수가 열리면 기용 상황을 보고 판단하세요.`};
  const d=depth(p.team); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].filter(Boolean).map(x=>x.id)); const o=ovr(p);
  if(p.age>27)return {k:'last',who:'운영팀',why:`${p.age}세: 상무 지원 나이(27세)를 넘겨 현역 입대만 남았습니다. 입대 시기를 정해 대체 선수를 준비하세요.`}; /* 검수 11-07 */
  if(p.age>=27)return {k:'last',who:'운영팀',why:`${p.age}세: 올해 안에 입대하지 않으면 현역으로 갑니다. 상무 지원을 권합니다${o<44?'(다만 기량이 낮아 합격은 장담하기 어렵습니다)':''}.`};
  if(reg.has(p.id))return {k:'hold',who:'감독',why:`지금 1군 ${p.isP?(isSPr(p)?'선발':'필승조'):'주전'}입니다. 빠지면 1년 6개월 공백이 생기니 ${27-p.age>=2?'1~2년 뒤':'내년'}에 보내는 게 좋겠습니다.`};
  if(p.age>=23){ const room=potGapEst(p); const h1=seasonTotalT(p,G.year,'1군',p.team); /* 성장 여지는 스카우트 추정만 사용한다. 숨은 잠재력 차이를 숫자로 노출하지 않는다. */ const g1=h1?(h1.g||0):0; const tr=G.sea&&G.sea.rec&&G.sea.rec[p.team]; const tg=tr&&period()==='season'?tr.w+tr.l+(tr.t||0):0;
    /* 시즌 초 몇 경기로는 출전 비중을 말하지 않는다: 20경기 전에는 보직(기용 순서·주전), 그 뒤에는 팀 경기 수 대비 실제 출전 */
    const roleW=()=>{ if(p.isP){ const i=d.pen.findIndex(x=>x&&x.id===p.id); return i>=0?`불펜 기용 순서 ${i+1}번째로 앞에 ${i}명이 있어`:'선발·필승조 보직이 아니어서'; } const st=(d.start||[]).find(x=>x&&x.pos===p.pos); return st?`${POSS[p.pos]} 주전 ${st.name} 뒤의 백업 보직이어서`:'주전 보직이 아니어서'; };
    if(tg>=20&&g1/tg>=(p.isP?.35:.5))return {k:'hold',who:'감독',why:`팀 ${tg}경기 중 ${g1}경기 ${p.isP?'등판':'출전'}으로 1군에서 꾸준히 뛰고 있습니다. 빠지면 1년 6개월 공백이 생기니 ${27-p.age>=2?'1~2년 뒤':'내년'}에 보내는 게 좋겠습니다.`}; /* 보직이 백업이어도 실제 출전 비중으로(검수 11-09zk) */
    const now=p.e1?(tg>=20?`지금 1군${p.isP?' 불펜(추격조)':' 백업'}이고 팀 ${tg}경기 중 ${g1}경기 ${p.isP?'등판':'출전'}으로 비중이 낮아 빠져도 대체할 선수가 있습니다. 상무에서 꾸준히 뛰는 편이 낫습니다.`:`지금 1군${p.isP?' 불펜':' 백업'}이지만 ${roleW()} 빠져도 대체할 선수가 있습니다(시즌 초라 출전 기록 대신 보직으로 판단). 상무에서 꾸준히 뛰는 편이 낫습니다.`):'1군 자리가 없어 2군에 머무는 것보다 상무에서 꾸준히 뛰는 편이 낫습니다.'; return {k:'go',who:'스카우트팀장',why:`${now}${room>=4?` 스카우트가 아직 클 여지가 있다고 보므로 경기 경험이 중요합니다.`:''} 전역하면 ${milRetAge(p)}세입니다.`}; }
  return {k:'wait',who:'스카우트팀장',why:`${p.age}세로 아직 여유가 있습니다. 1~2년 더 키워 본 뒤 보내도 됩니다.`}; }
/* 이번 지원 기간에 합격하면 전역할 때 나이: 다음 입대일(6월·12월 10일)+복무, 나이는 새해마다 한 살(검수 11-09g: 봄 지원도 두 살로 안내) */
function milRetAge(p){ const f=p.mil?.app?sangmuFrom(p.mil.app):sangmuPeriod().from; /* 지금 지원할 수 있는(또는 다음에 열리는) 기수의 입대일: 봄 마감 뒤에는 12월 입대(검수 11-09zk) */ return p.age+dobj(f+MIL_DAYS).y-G.year; }
function milDaily(){ const d=G.day;
  if(d===KD(9,1)||d===KD(3,1)){ const w=d===KD(9,1)?'dec':'jun';
    for(const p of Object.values(G.players)){ if(p.team==null||p.team===ME()||!milFree(p)||p.mil&&p.mil.app)continue; /* 야인 기간에는 전 구단도 AI(검수 11-09g) */ if(p.age>=24&&p.age<=27&&R()<(p.age>=26?.7:.25))p.mil={app:w}; }
    const mine=domPayOf(G.user).filter(p=>milFree(p)&&p.age<=27); /* 지원 승인 조건(sangmuApply)과 같게: 27세 이하 전부, 대표팀 차출 중인 선수도(검수 11-09zk) */
    if(mine.length)mail('운영팀',`상무 지원 기간입니다 (${w==='dec'?'12월':'6월'} 입대)`,`상무(국군체육부대) 야구단 지원을 받습니다. 복무는 1년 6개월이고, 복무 중에도 퓨처스리그에서 뛰며 기량을 유지할 수 있습니다. 현역으로 가면 1년 6개월 동안 야구를 거의 못 해 기량이 떨어집니다.\n\n${milAdviceTxt(mine)}\n\n우리 구단 미필 선수: ${mine.map(p=>`${p.name}(${p.age}세)`).join(', ')}\n\n${p28(mine)}지원은 ${dmd((w==='dec'?KD(10,15):KD(4,15))-1)}까지입니다(다음 날 합격자 발표).`,{imp:true,kind:'병역',acts:[{l:'병역 관리',a:'go',v:'staff:mil'}]}); }
  if(d===KD(10,15)||d===KD(4,15)){ const w=d===KD(10,15)?'dec':'jun'; const apps=Object.values(G.players).filter(p=>p.mil&&p.mil.app===w&&!(p.team==null&&(p.mil=null,true))); /* 방출돼 소속이 없는 지원자는 지원 무효(검수 11-07) */
    const ranked=apps.map(p=>({p,s:ovr(p)+hn('sm'+G.year,p.id)*4+(p.injOut>30?-10:0)+smExp(p)})).sort((a,b)=>b.s-a.s); /* 퓨처스 실적을 본다(카페 11-11: 기록 없는 신인이 능력치만으로 합격) */ const from=sangmuFrom(w);
    const ok=[],no=[]; ranked.forEach((x,i)=>{ if(i<SANGMU_SLOTS){ enlist(x.p,'상무',from); ok.push(x.p);} else { x.p.mil=null; no.push(x.p);} });
    const mo=ok.filter(p=>p.team===G.user), mn=no.filter(p=>p.team===G.user);
    if(mo.length||mn.length)mail('운영팀','상무 합격자 발표',`${mo.length?`합격: ${mo.map(p=>p.name).join(', ')} (${dmd(from)} 입대)`:'합격자 없음'}${mn.length?`\n불합격: ${mn.map(p=>p.name).join(', ')}. 다음 지원 기간에 다시 지원하거나 현역으로 입대해야 합니다.`:''}`,{imp:true,kind:'병역'});
    if(mo.some(p=>ovr(p)>=52))news('선수',`${tshort(G.user)} 주축 ${mo.find(p=>ovr(p)>=52).name} 상무 합격`,`전력 공백은 불가피하지만 1년 6개월 뒤 돌아올 자원입니다.`,-1); }
  try{ milRetWarn(d); }catch(e){}
  for(const p of Object.values(G.players)){ const m=p.mil; if(m&&m.until&&m.from===d){ p.e1=false; milChron(p,'입대',m.unit,m.from,m.until); if(p.team===G.user)addLog(`${p.name} ${m.unit} 입대. 전역 예정 ${dmdY(m.until)}.`); } }
  const back={}; for(const p of Object.values(G.players)){ const m=p.mil; if(m&&m.until===d){ milChron(p,'전역',m.unit,m.from,m.until); if(p.team!=null)(back[p.team]=back[p.team]||[]).push(p); p.mil={done:true,unit:m.unit,pf:m.from,pu:m.until}; /* 지난 복무 기간: 그해 연봉 계산(payFrac)에 남긴다(검수 11-06) */ story(p,`${m.unit} 전역`,'mil'); if(p.team===G.user)mail('운영팀',`${p.name} 전역`,`${p.name}이(가) ${m.unit} 복무를 마치고 돌아왔습니다. 정식 로스터 인원을 확인해 주세요.`,{kind:'병역',ref:p.id}); } }
  try{ ntDaily(d); }catch(e){ console.error(e); } /* 국가대표(아시안게임·올림픽·WBC·프리미어12): 84_national.js. 정원 정리보다 먼저: 입상 병역 특례로 복무 중 선수가 바로 전역해도 AI가 같은 날 68명에 맞춘다(2028 SEED 7 인천 69명) */
  for(const t of G.teams){ if(t.id!==ME()&&rosterN(t.id)>ROSTER_MAX)try{ trimRoster(t.id,ROSTER_MAX); }catch(e){} }
  for(const tid in back)try{ entryUpgrade(+tid,back[tid],'전역'); }catch(e){} /* 전역한 주축은 당일 엔트리 교체를 검토한다(검수 11-09zx) */ }
/* 곧 군에서 돌아오는 우리 선수(정식 로스터로 바로 복귀한다) */
function milReturns(days){ return awayOf(G.user).filter(p=>!p.ys&&p.mil&&p.mil.until>G.day&&p.mil.until<=G.day+days).sort((a,b)=>a.mil.until-b.mil.until); }
function milRetTxt(L){ return L.map(p=>`${p.name}(${posLabel(p)}, ${dmdY(p.mil.until)})`).join(', '); }
/* 복귀 7일 전: 시즌 중 로스터가 넘칠 것 같으면 미리 알린다 */
function milRetWarn(d){ if(G.unemp)return; const L=milReturns(7); if(!L.some(p=>p.mil.until===d+7))return; /* 스토브리그 전역도 미리 알림(검수 11-09zk) */
  const n=rosterN(G.user); let pk=n, pd=d; for(let k=1;k<=7;k++){ const v=rosterN(G.user,d+k); if(v>pk){ pk=v; pd=d+k; } } const need=pk-ROSTER_MAX; if(need<=0)return; /* 하루씩 실제 병역 처리 기준으로 세어 중간에 넘치는 날도 잡는다(검수 11-09zk) */
  mail('운영팀',`군 복귀 예정 ${L.length}명 · 로스터 ${need}자리 부족`,`앞으로 7일 안에 ${milRetTxt(L)}이(가) 전역해 정식 로스터로 돌아옵니다.\n\n지금 ${n}명이고, 입대·전역을 날짜별로 반영하면 ${dmd(pd)}에 ${pk}명(한도 ${ROSTER_MAX}명)이 됩니다. ${need}자리를 비워야 합니다. 연봉 1억 원 이하 선수는 방출 대신 육성선수로 돌릴 수 있습니다.`,{imp:true,kind:'병역',acts:[{l:'로스터 정리',a:'tab',v:'roster'}]}); }
function milAdviceTxt(ms){ const A=ms.map(p=>({p,a:milAdvice(p)})); const sec=(k,t)=>{ const L=A.filter(x=>x.a.k===k); return L.length?`[${t}]\n${L.map(x=>`${x.p.name}(${posLabel(x.p)}, ${x.p.age}세) - ${x.a.who}: ${x.a.why}`).join('\n')}`:''; };
  return ['코치진·스카우트 추천', sec('last','마지막 기회'), sec('go','지원 추천'), sec('hold','보류 의견')].filter(Boolean).join('\n\n'); }
function p28(ms){ const u=ms.filter(p=>p.age>=27); return u.length?`올해 안에 입대해야 하는 선수(27세 이상): ${u.map(p=>p.name).join(', ')}. 해를 넘기면 현역으로 입대합니다.\n\n`:''; }
function milNewYear(){ // 해가 바뀌면 28세 이상 미필은 현역 입대
  for(const p of Object.values(G.players)){ milInit(p); if(p.team==null||!milFree(p)||p.mil&&p.mil.app)continue; if(p.team!==ME()&&p.age>=20&&p.age<=24&&ovr(p)<40&&R()<.22){ enlist(p,'현역',dnum(G.year,1,20)); continue; } if(p.age>=28){ enlist(p,'현역',dnum(G.year,1,20)); if(p.team===G.user)mail('운영팀',`${p.name} 현역 입대 예정 · ${dmd(dnum(G.year,1,20))}`,`${p.name}이(가) 28세가 되어 입대 연기 한도를 넘겼습니다. ${dmd(dnum(G.year,1,20))}에 현역으로 입대합니다. 1년 6개월 뒤 돌아오지만 기량이 떨어질 수 있습니다.`,{imp:true,kind:'병역',ref:p.id}); } } }
/* 2군 월간 리포트: 5~9월 1일 육성팀 보고 */
function futuresReport(){ if(G.unemp)return; const y=G.year; const all=playersOf(G.user).filter(p=>!p.foreign), ps=all.filter(p=>!p.e1); /* 2군 성적은 보고 전에 콜업된 선수도 넣는다(검수 11-09zx) */
  const B=all.filter(p=>!p.isP).map(p=>({p,h:seasonTotalT(p,y,'퓨처스',G.user)})).filter(x=>x.h&&x.h.pa>=40).map(x=>({...x,v:bRate(x.h).ops})).sort((a,b)=>b.v-a.v).slice(0,3);
  const P=all.filter(p=>p.isP).map(p=>({p,h:seasonTotalT(p,y,'퓨처스',G.user)})).filter(x=>x.h&&x.h.outs>=45).map(x=>({...x,v:pRate(x.h).era})).sort((a,b)=>a.v-b.v).slice(0,3);
  const base=G.fut0&&G.fut0.y===y?G.fut0.m:{}; const up=ps.filter(p=>base[p.id]!=null).map(p=>({p,d:ovr(p)-base[p.id]})).filter(x=>x.d>=1).sort((a,b)=>b.d-a.d).slice(0,3);
  const rk=slotRanks(G.user); const call=ps.filter(canUp).map(p=>{ const k=pSlot(p); const sl=rk[k]; const worst=sl&&sl.ps&&sl.ps.length?Math.min(...sl.ps.map(q=>ovr(q))):0; return {p,k,gap:ovr(p)-worst}; }).filter(x=>x.gap>=-1).sort((a,b)=>b.gap-a.gap).slice(0,2);
  const L=[]; if(B.length)L.push('2군 타격: '+B.map(x=>`${x.p.name}(${posLabel(x.p)}, OPS ${fmt3(x.v)}, ${x.h.pa}타석${x.p.e1?', 1군 콜업':''})`).join(', '));
  if(P.length)L.push('2군 투구: '+P.map(x=>`${x.p.name}(${posLabel(x.p)}, ERA ${x.v.toFixed(2)}, ${ipStr(x.h.outs)}이닝${x.p.e1?', 1군 콜업':''})`).join(', '));
  if(up.length)L.push('올해 눈에 띄게 성장: '+up.map(x=>`${x.p.name}(+${x.d.toFixed(1)})`).join(', '));
  { const cv=ps.filter(p=>p.pconv).map(p=>`${p.name}(${POSK[p.pconv.pos]} 숙련 ${Math.round(posExp(p,p.pconv.pos))}/90${p.fuse&&p.fuse.y===y&&p.fuse.pos[p.pconv.pos]?`, 2군에서 그 자리 ${p.fuse.pos[p.pconv.pos]}경기`:''})`); if(cv.length)L.push('포지션 전환 훈련: '+cv.join(', ')); }
  { const s2=ps.filter(p=>p.isP&&rpPlanOf(G.user,p)==='sp2').map(p=>{ const h=seasonTotalT(p,y,'퓨처스',G.user); return `${p.name}(${h?`${h.gs||0}선발 ${ipStr(h.outs)}이닝 ERA ${pRate(h).era.toFixed(2)}`:'등판 전'})`; }); if(s2.length)L.push('2군 선발 수업: '+s2.join(', ')); }
  if(call.length)L.push('1군 콜업 후보: ' /* 실제 콜업과 같은 조건(재등록 대기·선발 수업·출장 정지 제외, 검수 11-09zi) */+call.map(x=>`${x.p.name}(${posLabel(x.p)}) — 1군 같은 자리 선수와 비슷하거나 낫습니다`).join(', '));
  if(!L.length)return; /* 콜업 후보만 있는 달도 보낸다(검수 11-09zx) */
  mail('육성팀',`${dobj(G.day).m}월 2군 리포트`,`육성팀입니다. 이번 달 2군 현황을 보고드립니다.\n\n${L.join('\n\n')}\n\n1군 기용은 감독 권한입니다. 콜업 후보는 감독에게 건의하거나 출전 기회를 약속하는 면담으로 밀어줄 수 있습니다.`,{kind:'육성',acts:[{l:'선수 육성',a:'goWork',v:'2군연수'}]}); }
/* 올해 시작 시점 능력(성장 표시용)과 매달 팀 성장 기록 */
function ovrSnap(){ if(G.unemp)return; G.ovr0={y:G.year,m:Object.fromEntries(playersOf(G.user).concat(Object.values(G.players).filter(p=>p.team===G.user&&p.joinY>G.year)).map(p=>[p.id,ovr(p)]))}; }
function growSnap(){ if(G.unemp)return; const tid=G.user; const pr=playersOf(tid).filter(p=>p.age<=24&&!p.foreign).map(p=>{ try{ const r=scoutReport(p); return r.ofp??r.cur??ovr(p); }catch(e){ return ovr(p); } }).sort((a,b)=>b-a).slice(0,10); const o=dobj(G.day);
  (G.tgrow=G.tgrow||[]).push({y:o.y,m:o.m,r1:+teamRating(tid).toFixed(2),pot:pr.length?+(pr.reduce((a,b)=>a+b,0)/pr.length).toFixed(2):0,tid}); G.tgrow=G.tgrow.filter(x=>x.tid===tid).slice(-60); }
function milWarn(){ const L=domestic(G.user).filter(p=>{ milInit(p); return milFree(p)&&!(p.mil&&(p.mil.app||p.mil.until))&&p.age>=27; }); if(!L.length)return;
  stop('병역',`해가 바뀌면 현역으로 입대하는 선수(27세 미필): ${L.map(p=>`${p.name}(${posLabel(p)}, 능력 ${dvo(p)})`).join(', ')}. 1월 20일 입대해 1년 6개월 동안 빠집니다. 대체 선수를 미리 구하세요.`,L[0].id); }
/* 올림픽 */
const olyYear=y=>y>=2028&&(y-2028)%4===0;
/* 올림픽 명단·결과는 국가대표(84_national.js)로 옮겼다 */

/* 병역 상태 한 줄(사용자 피드백 11-05: 상무 복무 중인 선수가 검색표에서 군필·면제로 보였다). k: free 미필 · svc 복무 중·입대 예정 · done 군필·면제 */
function milState(p){ if(p.foreign)return {k:'done',l:'-'}; const m=p.mil; if(m&&m.until&&!m.done){ if(m.from<=G.day&&m.until>G.day)return {k:'svc',l:`${m.unit||'복무'} 중 · ${dmdY(m.until)} 전역`}; if(m.from>G.day)return {k:'svc',l:`입대 예정 · ${dmdY(m.from)}`}; } return milFree(p)?{k:'free',l:'미필'}:{k:'done',l:'군필·면제'}; }

/* 실제 입대·복귀만 구단 연대기에 남긴다. 예약·취소는 소속 이력이 아니다. */
function milChron(p,kind,unit,from,until){ if(!p||p.team==null)return; chron('mil',`${p.name} ${unit} ${kind} · 복무 ${dmd(from)}~${dmdY(until)}${kind==='입대'?' · 전역 예정':''}`,p.id,p.team,{source:'mil:'+p.id+':'+from+':'+kind}); }

/* 상무 합격 심사의 실적: 상무는 퓨처스리그 팀이라 2군 기록을 주로 본다(사용자 11-11). 올해·지난해 퓨처스 합계(게임 기준값)
   타자 100타석↑: (OPS-.700)×20, 투수 20이닝↑: (4.50-ERA)×1.5 (각 -4~+6) · 기록이 거의 없으면 -4 · 2군 출장 30경기마다 +1(최대 +3) · 1군 경험 30경기마다 +1(최대 +2) */
function smExp(p){ const y=G.year, F={}; for(const yy of [y,y-1]){ const h=seasonTotal(p,yy,'퓨처스'); if(h)for(const k in h)if(typeof h[k]==='number')F[k]=(F[k]||0)+h[k]; }
  let s=0; if(p.isP){ const o=F.outs||0; if(o>=60){ const era=(F.er||0)*27/o; s+=clamp((4.5-era)*1.5,-4,6); } else if(o<30)s-=4; }
  else { const pa=F.pa||0; if(pa>=100){ try{ s+=clamp((bRate(F).ops-.7)*20,-4,6); }catch(e){} } else if(pa<30)s-=4; }
  s+=Math.min(3,(F.g||0)/30); const g1=sum((p.hist||[]).filter(h=>h.lvl==='1군'&&!h.y2).map(h=>h.g||0)); s+=Math.min(2,g1/30); return s; }
