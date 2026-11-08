/* ===== KBO 부상 대체 외국인 선수(2024 시즌 도입) =====
   출처: KBO 실행위 의결 보도(뉴스서울 '2024 시즌부터 대체 외국인선수 제도 도입')·머니투데이 2026-07-19(연장·정식 전환·포스트시즌 자격).
   - 외국인 선수가 6주 이상 치료가 필요한 부상이면 재활 선수 명단에 올리고(보류권 유지) 대체 선수를 등록한다. 교체 횟수는 쓰지 않는다.
   - 대체 선수 보수는 한 달 10만 달러까지. 첫 6주 뒤 연장 기간 제한 없음.
   - 원 선수가 돌아오면 대체 선수를 내보내거나, 대체 선수를 정식 계약하고 원 선수를 내보낸다(교체 1회 차감).
   - 8월 15일까지 정식 계약한 선수만 포스트시즌에 나가므로 대체 계약은 정규시즌 끝에 끝난다.
   shortcut: 일반 외국인만 대상(아시아쿼터 대체는 세칙 확인 전이라 뺐다), 세칙이 확인되면 넓힌다 */
const F_TMP_DAYS=42, F_TMP_MON=10*USD;
const fTmpFee=q=>Math.min(F_TMP_MON,round5(Math.min(q.ask,fNewCap())/6)); /* 한 달 지급액(시즌 6개월 기준 환산) */
/* 처음 받은 진단 일수: 42일 진단 메일을 받은 다음 날 41일로 줄어 막히지 않게(검수 11-06). 규정은 진단 기준이다 */
function fTmpDx(o){ const h=(o.injHist||[]).slice(-1)[0]; return h&&h.d!=null&&h.d+h.days>=G.day+o.injOut-1?Math.max(h.days,o.injOut):o.injOut||0; }
function fTmpErr(tid,o,q){
  if(period()!=='season'||G.day>foreignDL())return '부상 대체 외국인은 정규시즌 8월 15일까지 등록할 수 있습니다.';
  if(!o||o.team!==tid||o.foreign!=='용병')return '대체 대상은 우리 구단 일반 외국인 선수입니다.';
  if(o.frehab||o.ftmp)return `${o.name}은(는) 이미 대체 선수 관련 계약이 있습니다.`;
  if(!(o.injOut>0&&fTmpDx(o)>=F_TMP_DAYS))return `6주(${F_TMP_DAYS}일) 이상 치료 진단이 있어야 합니다. ${o.name}은(는) ${o.injOut||0}일 남았습니다.`;
  if(!q)return '';
  if(q.foreign!=='용병')return '일반 외국인 후보만 대체 선수로 등록할 수 있습니다.';
  const a0=q.ask; q.ask=Math.min(q.ask,fNewCap()); const e=foreignCheck(tid,q,o.id,true); q.ask=a0; return e; }
function signTempForeign(tid,oid,qid){ const o=G.players[oid], q=G.players[qid]; if(!q)return '후보를 찾을 수 없습니다.'; const err=fTmpErr(tid,o,q); if(err)return err;
  q.ask=Math.min(q.ask,fNewCap()); const fee=fTmpFee(q);
  story(q,`${tname(tid)} 입단 (부상 대체 외국인 · ${o.name} 대신, 월 ${money(fee)})`,'move'); { const h=foResFor(q); if(!(h&&h.tid===tid))q.rsy=0; } /* 전 구단 재계약 연차는 가져오지 않는다(검수 11-09a) */ q.team=tid; q.sal=q.ask; q.yrs=1; q.fy=G.year; if(q.adapt==null)q.adapt=Math.round(clamp(N(50,13),20,80));
  q.ftmp={o:o.id,d:G.day,fee,paid:F_TMP_DAYS}; o.frehab=q.id; for(const k in G.lineup)if(G.lineup[k]===o.id)delete G.lineup[k];
  G.sea.fspend[tid]=(G.sea.fspend[tid]||0)+Math.round(fee*F_TMP_DAYS/30); /* 첫 6주치 */
  G.fmarket=(G.fmarket||[]).filter(x=>x!==q.id); mvLog('외국인',q,null,tid,`부상 대체 · ${o.name} 대신 월 ${money(fee)}`,fee);
  if(tid===G.user)addLog(`부상 대체 외국인 ${q.name}(${posLabel(q)})을(를) 월 ${money(fee)}에 등록했습니다. ${o.name}은(는) 재활 선수 명단으로 갑니다(교체 횟수 차감 없음).`);
  else wire('외국인',`${tshort(tid)}, ${o.name} 부상 대체로 ${q.name}(${posLabel(q)}) 영입`,{tid,ref:q.id});
  return ''; }
/* 대체 계약 끝: 원 선수는 재활 명단에서 돌아오고 대체 선수는 떠난다 */
function fTmpEnd(q,why){ const o=G.players[q.ftmp.o]; const tid=q.team; if(o&&o.frehab===q.id){ delete o.frehab; if(o.team===tid&&fBackClash(o,q))o.frehab='hold'; } /* 돌아오면 같은 유형 3명이면 재활 명단 유지(검수 11-08: 시즌 종료로 투수 3명 등록) */
  for(const k in G.lineup)if(G.lineup[k]===q.id)delete G.lineup[k]; mvLog('방출',q,tid,null,`부상 대체 계약 종료${why?' · '+why:''}`);
  if(tid===G.user)addLog(`부상 대체 외국인 ${q.name}의 계약이 끝났습니다${why?`(${why})`:''}.`); dropP(q.id); }
/* 대체 선수를 정식 계약으로 돌린다: 원 선수는 방출(남은 연봉 지급), 교체 1회 차감, 남은 경기 비율만큼 연봉 */
function fTmpConvert(q){ const e=fTmpConvertErr(q); if(e)return e; const tid=q.team, o=G.players[q.ftmp.o];
  if(o&&o.team===tid){ delete o.frehab; releaseForeign(o.id); }
  return fTmpConvertDo(q,tid); }
function fTmpConvertErr(q){ const tid=q.team, o=G.players[q.ftmp.o];
  if(fReplLeft(tid)<=0||G.day>foreignDL())return '교체 횟수가 없거나 8월 15일이 지나 정식 계약할 수 없습니다.';
  { const yb=foreignOf(tid).filter(x=>x.foreign==='용병'&&x!==o&&x!==q), cap=F_TOTAL_CAP+10*USD*sum(yb.map(x=>x.rsy||0)), tot=sum(yb.map(fCommit))+q.sal; if(q.foreign==='용병'&&tot>cap)return `${o?o.name+'을(를) 내보내면 ':''}외국인 총액 한도가 ${money(cap)}(으)로 줄어 ${q.name}과(와) 정식 계약하면 ${money(tot-cap)} 넘습니다.`;
    if(yb.length>=3||(yb.length===2&&yb.every(x=>x.isP===q.isP)))return `정식 계약하면 일반 외국인 3명이 모두 ${q.isP?'투수':'타자'}가 됩니다.`; } /* 일반 영입과 같은 구성 제한(검수 11-06) */ /* 원 선수 재계약 가산분이 빠진 한도로 다시 확인(검수 11-06) */
  return ''; }
function fTmpConvertDo(q,tid){
  { const f=q.ftmp, pre=Math.round(f.fee*Math.max(0,f.d+f.paid-G.day)/30); if(pre>0)G.sea.fspend[tid]=Math.max(0,(G.sea.fspend[tid]||0)-pre); } /* 이미 낸 대체 보수 중 전환 뒤 기간은 돌려받는다: 정식 연봉과 겹치지 않게(검수 11-08) */
  delete q.ftmp; G.sea.repl[tid]=(G.sea.repl[tid]||0)+1; G.sea.fspend[tid]=(G.sea.fspend[tid]||0)+Math.round(q.sal*remainFrac());
  story(q,`${tname(tid)}과(와) 정식 계약 전환 (${money(q.sal)})`,'move'); mvLog('외국인',q,null,tid,'부상 대체 → 정식 계약',q.sal);
  if(tid===G.user)addLog(`${q.name}을(를) 정식 외국인 선수로 계약했습니다. 교체 횟수 1회를 썼습니다.`); else wire('외국인',`${tshort(tid)}, 부상 대체 ${q.name}과(와) 정식 계약`,{tid,ref:q.id});
  return ''; }
/* 원 선수가 돌아오면 같은 유형 외국인 3명이 되는가(그사이 다른 외국인을 바꿨을 때) */
function fBackClash(o,q){ if(!o||o.foreign!=='용병')return false; const yb=Object.values(G.players).filter(x=>x.team===o.team&&x.foreign==='용병'&&x!==o&&x!==q&&!x.ftmp); return yb.length>=3||(yb.length===2&&yb.every(x=>x.isP===o.isP)); }
/* 복귀하면 규정이 깨지는 경우: 대체 선수를 정식 계약으로(원 선수 방출), 못 하면 원 선수 방출·대체 계약 종료 */
function fBackResolve(q,o){ if(!fTmpConvert(q))return `${o.name}이(가) 돌아오면 외국인 3명이 모두 ${o.isP?'투수':'타자'}가 돼 ${q.name}과(와) 정식 계약하고 ${o.name}은(는) 방출했습니다.`; delete o.frehab; try{ releaseForeign(o.id); }catch(e){} fTmpEnd(q,'원 선수 복귀 불가'); return `${o.name}이(가) 돌아오면 외국인 3명이 모두 ${o.isP?'투수':'타자'}가 돼 복귀시킬 수 없어 방출했고, ${q.name}의 대체 계약도 끝났습니다.`; }
EVH.ftmp={ can(e,i){ const q=G.players[e.data.qid]; return i===1&&q&&q.ftmp?fTmpConvertErr(q):''; }, /* 정식 계약이 안 되면 결정으로 남기지 않는다(검수 11-08: 거절된 뒤 대체 선수까지 방출) */
  pick(e,i){ const q=G.players[e.data.qid]; if(!q||!q.ftmp)return '이미 정리된 계약입니다.'; let pre=''; if(i===1){ const err=fTmpConvert(q); if(!err)return `${q.name}과(와) 정식 계약했습니다.`; pre=err+' 원 선수 복귀로 처리합니다. '; } /* 자동 처리 중 전환이 막히면 기본(원 선수 복귀)으로 */ { const o=G.players[q.ftmp.o]; if(fBackClash(o,q)){ fTmpEnd(q,'원 선수 복귀'); o.frehab='hold'; return pre+`${q.name}의 대체 계약을 끝냈습니다. ${o.name}이(가) 돌아오면 외국인 3명이 모두 ${o.isP?'투수':'타자'}라서, 다른 외국인을 정리할 때까지 재활 선수 명단에 남습니다(보류권 유지).`; } } /* 복귀를 골랐는데 두 선수가 다 떠나지 않게(검수 11-06) */ fTmpEnd(q,'원 선수 복귀'); return pre+'원 선수가 돌아오고 대체 선수는 떠납니다.'; } };
EVH.ftmp2={ can(e,i){ const q=G.players[e.data.qid]; return i===0&&q&&q.ftmp&&!/불가/.test((e.opts&&e.opts[0]&&e.opts[0].l)||'')?fTmpConvertErr(q):''; }, pick(e,i){ const q=G.players[e.data.qid]; if(!q||!q.ftmp)return '이미 정리된 계약입니다.'; if(i===0){ const err=fTmpConvert(q); if(!err)return `${q.name}과(와) 정식 계약했습니다.`; fTmpEnd(q,'정식 전환 불가'); return err; } fTmpEnd(q,'원 선수 이탈'); return `${q.name}의 대체 계약을 끝냈습니다.`; } };
/* 매일: 연장 비용, 원 선수 복귀 처리, 시즌 종료 정리, 우리 선수 장기 부상 안내 */
function fTmpDaily(){ const per=period();
  const evOpen=(k,q)=>(G.evs||[]).some(e=>!e.done&&e.k===k&&e.data&&e.data.qid===q.id);
  for(const t of G.teams)for(const q of playersOf(t.id).filter(x=>x.ftmp)){ const o=G.players[q.ftmp.o]; if(t.id===G.user){ if(q.ftmp.ask&&!evOpen('ftmp',q))delete q.ftmp.ask; if(q.ftmp.left&&!evOpen('ftmp2',q))delete q.ftmp.left; } /* 이직으로 결정 메일이 닫혔으면 다시 묻는다(재활 명단에 묶이지 않게, 검수 11-06) */
    if(per!=='season'){ fTmpEnd(q,'정규시즌 종료'); continue; }
    if(G.day-q.ftmp.d>=q.ftmp.paid){ const nd=Math.min(30,Math.max(0,G.cal.end-G.day+1)); q.ftmp.paid+=30; G.sea.fspend[t.id]=(G.sea.fspend[t.id]||0)+Math.round(q.ftmp.fee*nd/30); } /* 정규시즌 남은 날만큼만(검수 11-08: 하루 남았는데 한 달치) */ /* 등록돼 있는 동안은 한 달씩 지급(복귀 결정을 미뤄도, 검수 11-06) */
    if(!o||o.team!==t.id||o.frehab!==q.id){ if(t.id===G.user&&!G.unemp){ if(q.ftmp.left)continue; q.ftmp.left=G.day; const can=fReplLeft(t.id)>0&&G.day<=foreignDL(); /* 우리 구단은 자동 전환하지 않고 묻는다(검수 11-06: 원 선수를 방출했더니 대체 선수가 저절로 정식 계약됨) */
        evNew('ftmp2',`대체 선수 ${q.name} 거취`,`원 선수가 팀을 떠났습니다. 부상 대체로 뛰는 ${q.name}(${posLabel(q)}, 능력 ${dvo(q)})을(를) 어떻게 할지 정해야 합니다.`,[...(can?[{l:`${q.name} 정식 계약`,fx:`교체 횟수 1회 차감, 남은 경기 비율만큼 연봉 ${money(Math.round(q.sal*remainFrac()))}.`}]:[{l:'정식 계약 불가',fx:'교체 횟수가 없거나 8월 15일이 지났습니다. 고르면 대체 계약을 끝냅니다.'}]),{l:'대체 계약 종료',fx:`${q.name}이(가) 떠납니다. 교체 횟수는 그대로입니다.`}],{from:'운영팀',ref:q.id,data:{qid:q.id},def:1,exp:5}); continue; }
      if(fTmpConvert(q))fTmpEnd(q,'원 선수 이탈'); continue; } /* AI: 원 선수가 떠났으면 정식 계약으로(못 하면 계약 종료) */
    if(o.injOut>0)continue; /* 원 선수 재활 중 */
    if(t.id!==G.user||G.unemp){ if(fBackClash(o,q)){ fBackResolve(q,o); continue; } if(ovr(q)>ovr(o)+3&&!fTmpConvert(q))continue; fTmpEnd(q,'원 선수 복귀'); continue; }
    if(q.ftmp.ask)continue; q.ftmp.ask=G.day; const can=fReplLeft(t.id)>0&&G.day<=foreignDL();
    evNew('ftmp',`${o.name} 복귀: 대체 선수 ${q.name} 거취`,`${o.name}(${posLabel(o)}, 능력 ${dvo(o)})이(가) 재활을 마쳤습니다. 부상 대체로 뛴 ${q.name}(${posLabel(q)}, 능력 ${dvo(q)})을(를) 어떻게 할지 정해야 합니다. 정할 때까지 ${o.name}은(는) 재활 선수 명단에 남습니다.`,
      [{l:`${o.name} 복귀`,fx:`${q.name}의 대체 계약을 끝냅니다. 교체 횟수는 그대로입니다.${fBackClash(o,q)?` 다만 지금은 ${o.name}이(가) 돌아오면 외국인 3명이 모두 ${o.isP?'투수':'타자'}가 되므로, 다른 외국인을 정리할 때까지 재활 선수 명단에 남습니다.`:''}`},...(can?[{l:`${q.name} 정식 계약`,fx:`${o.name}을(를) 방출하고(남은 연봉 지급) ${q.name}과(와) 정식 계약합니다. 교체 횟수 1회 차감, 남은 경기 비율만큼 연봉 ${money(Math.round(q.sal*remainFrac()))}.`}]:[])],
      {from:'운영팀',ref:q.id,data:{qid:q.id},def:0,exp:5}); }
  for(const t of G.teams)for(const o of playersOf(t.id))if(o.frehab==='hold'&&!fBackClash(o,null)){ delete o.frehab; if(t.id===G.user)note('운영팀',`${o.name}이(가) 재활 선수 명단에서 돌아와 다시 뛸 수 있습니다.`); } /* 다른 외국인을 정리하면 복귀 */
  if(per==='season'&&G.day<=foreignDL()&&!G.unemp)for(const o of foreignOf(G.user)){ if(fTmpErr(G.user,o)||o.ftmpM>=G.day-60)continue; o.ftmpM=G.day;
    mail('운영팀',`${o.name} ${o.injOut}일 진단: 부상 대체 외국인 등록 가능`,`${o.name}(${posLabel(o)})이(가) ${o.injOut}일 치료 진단을 받았습니다. KBO 규정상 6주 이상 부상이면 재활 선수 명단에 올리고 대체 외국인을 등록할 수 있습니다. 교체 횟수는 쓰지 않고, 보수는 한 달 10만 달러(약 ${money(F_TMP_MON)})까지입니다. 원 선수가 돌아오면 둘 중 한 명을 고릅니다.`,{kind:'외국인',ref:o.id,acts:[{l:'대체 선수 고르기',a:'fTmpStart',v:o.id}]}); } }
/* AI: 시즌 안에 돌아올 부상이면 대체 선수, 시즌 아웃이면 기존처럼 교체 */
function aiForeignTemp(tid){ const left=Math.max(0,G.cal.end-G.day); /* 남은 날짜로 비교(경기 수와 재활 일수를 비교해 대체를 건너뛰었다, 검수 11-08) */
  for(const o of foreignOf(tid)){ if(fTmpErr(tid,o)||o.injOut>left*1.1)continue;
    const L=(G.fmarket||[]).map(id=>G.players[id]).filter(q=>q&&q.team==null&&!foHeld(q)&&fKnows(tid,q)&&q.isP===o.isP&&!fTmpErr(tid,o,q)).sort((a,b)=>fScoreBy(tid,b)-fScoreBy(tid,a));
    if(L[0]&&!signTempForeign(tid,o.id,L[0].id))return true; }
  return false; }
