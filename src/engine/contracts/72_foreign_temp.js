/* ===== KBO 부상 대체 외국인 선수(2024 시즌 도입) =====
   출처: KBO 실행위 의결 보도(뉴스서울 '2024 시즌부터 대체 외국인선수 제도 도입')·머니투데이 2026-07-19(연장·정식 전환·포스트시즌 자격).
   - 외국인 선수가 6주 이상 치료가 필요한 부상이면 재활 선수 명단에 올리고(보류권 유지) 대체 선수를 등록한다. 교체 횟수는 쓰지 않는다.
   - 대체 선수 보수는 한 달 10만 달러까지. 첫 6주 뒤 연장 기간 제한 없음.
   - 원 선수가 돌아오면 대체 선수를 내보내거나, 대체 선수를 정식 계약하고 원 선수를 내보낸다(교체 1회 차감).
   - 8월 15일까지 정식 계약한 선수만 포스트시즌에 나가므로 대체 계약은 정규시즌 끝에 끝난다.
   shortcut: 일반 외국인만 대상(아시아쿼터 대체는 세칙 확인 전이라 뺐다), 세칙이 확인되면 넓힌다 */
const F_TMP_DAYS=42, F_TMP_MON=10*USD;
const fTmpFee=q=>Math.min(Math.round(F_TMP_MON*fEcoK()),round5(Math.min(q.ask,fNewCap())/6)); /* 한 달 지급액(시즌 6개월 기준 환산) */
/* 처음 받은 진단 일수: 42일 진단 메일을 받은 다음 날 41일로 줄어 막히지 않게(검수 11-06). 규정은 진단 기준이다 */
function fTmpDx(o){ const h=(o.injHist||[]).slice(-1)[0]; return h&&h.d!=null&&h.d+h.days>=G.day+o.injOut-1?Math.max(h.days,o.injOut):o.injOut||0; }
function fTmpErr(tid,o,q){
  if(period()!=='season'||G.day>foreignDL())return '부상 대체 외국인은 정규시즌 8월 15일까지 등록할 수 있습니다.';
  if(!o||o.team!==tid||o.foreign!=='용병')return '대체 대상은 우리 구단 일반 외국인 선수입니다.';
  if(o.frehab||o.ftmp)return `${o.name}은(는) 이미 대체 선수 관련 계약이 있습니다.`;
  if(!(o.injOut>0&&fTmpDx(o)>=F_TMP_DAYS))return `6주(${F_TMP_DAYS}일) 이상 치료 진단이 있어야 합니다. ${o.name}은(는) ${o.injOut||0}일 남았습니다.`;
  if(!q)return '';
  if(q.foreign!=='용병')return '일반 외국인 후보만 대체 선수로 등록할 수 있습니다.';
  if(foHeld(q)){ const n=foRivals(q).length; if(n)return `${q.name}은(는) ${n}개 구단의 정식 계약 제안과 비교하는 중이라 부상 대체(월 보수) 조건으로는 데려올 수 없습니다. 협상 창에서 조건을 제시하세요.`; } /* 경쟁 중인 후보는 조건 비교를 건너뛰지 않는다(검수 11-09zl) */
  const a0=q.ask; q.ask=Math.min(q.ask,fNewCap()); const e=foreignCheck(tid,q,o.id,true); q.ask=a0; return e; }
function signTempForeign(tid,oid,qid){ const o=G.players[oid], q=G.players[qid]; if(!q)return '후보를 찾을 수 없습니다.'; const err=fTmpErr(tid,o,q); if(err)return err;
  q.ask=Math.min(q.ask,fNewCap()); const fee=fTmpFee(q);
  story(q,`${tname(tid)} 입단 (부상 대체 외국인 · ${o.name} 대신, 월 ${money(fee)})`,'move'); { const h=foResFor(q); if(!(h&&h.tid===tid))q.rsy=0; } /* 전 구단 재계약 연차는 가져오지 않는다(검수 11-09a) */ q.team=tid; q.sal=q.ask; q.yrs=1; q.fy=G.year; if(q.adapt==null)q.adapt=Math.round(clamp(N(50,13),20,80));
  q.ftmp={o:o.id,d:G.day,fee,paid:F_TMP_DAYS}; delete q.fneg; /* 협상 대기 상태를 남기지 않는다 */ o.frehab=q.id; for(const k in G.lineup)if(G.lineup[k]===o.id)delete G.lineup[k];
  G.sea.fspend[tid]=(G.sea.fspend[tid]||0)+Math.round(fee*F_TMP_DAYS/30); /* 첫 6주치 */
  G.fmarket=(G.fmarket||[]).filter(x=>x!==q.id); mvLog('외국인',q,null,tid,`부상 대체 · ${o.name} 대신 월 ${money(fee)}`,fee);
  if(tid===G.user)addLog(`부상 대체 외국인 ${q.name}(${posLabel(q)})을(를) 월 ${money(fee)}에 등록했습니다. ${o.name}은(는) 재활 선수 명단으로 갑니다(교체 횟수 차감 없음).`);
  else wire('외국인',`${tshort(tid)}, ${o.name} 부상 대체로 ${q.name}(${posLabel(q)}) 영입`,{tid,ref:q.id});
  return ''; }
/* 대체 계약 끝: 원 선수는 재활 명단에서 돌아오고 대체 선수는 떠난다 */
function fTmpEnd(q,why){ const o=G.players[q.ftmp.o]; const tid=q.team; if(o&&o.frehab===q.id){ delete o.frehab; if(o.team===tid&&fBackErr(o,q))o.frehab='hold'; } /* 돌아오면 구성 규정·총액 한도가 깨지면 재활 명단 유지(검수 11-08: 시즌 종료로 투수 3명 등록, 11-17 #228: 총액 초과 복귀) */
  for(const k in G.lineup)if(G.lineup[k]===q.id)delete G.lineup[k]; mvLog('방출',q,tid,null,`부상 대체 계약 종료${why?' · '+why:''}`);
  if(tid===G.user)addLog(`부상 대체 외국인 ${q.name}의 계약이 끝났습니다${why?`(${why})`:''}.`); dropP(q.id); }
/* 대체 선수를 정식 계약으로 돌린다: 원 선수는 방출(남은 연봉 지급), 교체 1회 차감, 남은 경기 비율만큼 연봉 */
function fTmpConvert(q){ const e=fTmpConvertErr(q); if(e)return e; const tid=q.team, o=G.players[q.ftmp.o];
  if(o&&o.team===tid){ delete o.frehab; releaseForeign(o.id); }
  return fTmpConvertDo(q,tid); }
function fTmpConvertErr(q){ const tid=q.team, o=G.players[q.ftmp.o], oIn=!!(o&&o.team===tid);
  if(fReplLeft(tid)<=0||G.day>foreignDL())return '교체 횟수가 없거나 8월 15일이 지나 정식 계약할 수 없습니다.';
  const e=fTmpFitErr(tid,[...fYBNow(tid,o,q),q],oIn?o.id:null); /* 일반 영입과 같은 구성 제한(검수 11-06)·구단 실제 한도(신생 구단 가산, 다른 재활 명단 선수 재계약 가산 포함)에서 원 선수 가산만 뺀다(검수 11-17 #231·#232) */
  return e?`${oIn?`${o.name}을(를) 내보내고 `:''}${q.name}과(와) 정식 계약하면 ${e}.`:''; }
/* 지금 등록된 일반 외국인(재활 명단 선수는 빠진다)에서 skip을 뺀 명단 */
function fYBNow(tid,...skip){ return foreignOf(tid).filter(x=>x.foreign==='용병'&&!skip.includes(x)); }
/* 부상 대체 정리 뒤 등록될 일반 외국인 명단 L이 구성 규정(구단 유형별 정원·같은 유형 제한)과 총액 한도를 지키는가. 한도는 구단 실제 한도(fCap)에서 내보낼 선수(ex) 재계약 가산만 뺀다.
   복귀·정식 전환·안내 메일·AI가 모두 이 판정을 쓴다(검수 11-17 #228·#229·#231·#232) */
function fTmpFitErr(tid,L,ex){ const mx=fYBMixErr(tid,L); if(mx)return mx; const cap=fCap(tid,ex), tot=sum(L.map(x=>fCommit(x))); return tot>cap?`외국인 연봉 총액이 ${money(tot)}(으)로 한도 ${money(cap)}를 ${money(tot-cap)} 넘습니다`:''; }
function fTmpConvertDo(q,tid){
  { const f=q.ftmp, pre=Math.round(f.fee*Math.max(0,f.d+f.paid-G.day)/30); if(pre>0)G.sea.fspend[tid]=Math.max(0,(G.sea.fspend[tid]||0)-pre); } /* 이미 낸 대체 보수 중 전환 뒤 기간은 돌려받는다: 정식 연봉과 겹치지 않게(검수 11-08) */
  delete q.ftmp; fTmpEvClose(q,`${q.name}과(와) 정식 계약해 이 결정은 끝났습니다.`); /* 열려 있던 복귀·마감 안내 결정도 닫는다(검수 11-17 #234) */ G.sea.repl[tid]=(G.sea.repl[tid]||0)+1; G.sea.fspend[tid]=(G.sea.fspend[tid]||0)+Math.round(q.sal*remainFrac());
  story(q,`${tname(tid)}과(와) 정식 계약 전환 (${money(q.sal)})`,'move'); mvLog('외국인',q,tid,tid,'부상 대체 → 정식 계약',q.sal); /* 이미 우리 선수: 무소속 → 영입으로 두 번 세지 않는다(검수 11-09c) */
  if(tid===G.user)addLog(`${q.name}을(를) 정식 외국인 선수로 계약했습니다. 교체 횟수 1회를 썼습니다.`); else wire('외국인',`${tshort(tid)}, 부상 대체 ${q.name}과(와) 정식 계약`,{tid,ref:q.id});
  return ''; }
/* 대체 선수가 방출 등 다른 길로 떠나면 열려 있던 거취 결정도 닫는다(검수 11-09c: 방출 뒤에도 미처리로 남음). dropP에서 부른다 */
function fTmpEvClose(q,why,only){ for(const e of G.evs||[]){ if(e.done||!/^ftmp[23]?$/.test(e.k)||(only&&e.k!==only)||!e.data||e.data.qid!==q.id)continue; fTmpEvVoid(e,why||`대체 선수 ${q.name}이(가) 떠나 결정이 끝났습니다.`); } } /* 마감 안내(ftmp3)도 함께(검수 11-17 #233) */
function fTmpEvVoid(e,why){ e.done=true; e.void=true; e.res=why; const m=(G.mail||[]).find(x=>x.id===e.mid); if(m){ m.acts=[]; m.read=true; m.imp=false; m.body+=`\n\n[종료] ${why}`; } G.stops=(G.stops||[]).filter(x=>x.id!==e.mid); }
/* 복귀 결정을 보낸 뒤 원 선수가 다시 다치면 그 결정을 닫고, 회복하면 다시 묻는다(검수 11-17 #235: 다시 다친 원 선수를 복귀시켜 대체 선수만 떠남) */
function fTmpReinj(q){ const o=q&&q.ftmp?G.players[q.ftmp.o]:null; if(!(o&&o.team===q.team&&o.frehab===q.id&&o.injOut>0))return ''; const why=`${o.name}이(가) 다시 다쳐 재활이 ${o.injOut}일 남았습니다. ${q.name}이(가) 대체 선수로 계속 뛰고, ${o.name}이(가) 회복하면 다시 묻습니다.`; delete q.ftmp.ask; fTmpEvClose(q,why,'ftmp'); return why; }
/* 옛 저장 수리(불러올 때, 여러 번 불러도 같음): 이미 정리된 대체 선수의 결정 버튼, 다시 다친 원 선수의 복귀 결정을 닫는다(검수 11-17 #233·#235) */
function fTmpStaleFix(){ let n=0; for(const e of (G&&G.evs)||[]){ if(e.done||!/^ftmp[23]?$/.test(e.k)||!e.data)continue; const q=G.players[e.data.qid]; if(!q||!q.ftmp){ fTmpEvVoid(e,'이미 정리된 대체 선수 계약이라 결정이 끝났습니다.'); n++; } else if(e.k==='ftmp'&&fTmpReinj(q))n++; } return n; }
/* 원 선수가 돌아오면(대체 선수 q는 떠남) 구성 규정·총액 한도가 깨지는가: 깨지면 이유, 아니면 ''. 지금 등록된 선수로 센다: 다른 부상 대체 선수는 넣고 재활 명단 선수는 뺀다(검수 11-09zl).
   신생 구단(일반 외국인 4명)은 정원·같은 유형 제한이 다르다(검수 11-17 #229), 그사이 다른 영입으로 총액이 늘었으면 복귀도 한도를 지킨다(검수 11-17 #228) */
function fBackErr(o,q){ if(!o||o.foreign!=='용병'||o.team==null)return ''; const e=fTmpFitErr(o.team,[...fYBNow(o.team,o,q),o],null); return e?`${o.name}이(가) 돌아오면 ${e}`:''; }
const fBackClash=(o,q)=>!!fBackErr(o,q);
EVH.ftmp={ can(e,i){ const q=G.players[e.data.qid]; if(!q||!q.ftmp)return ''; if(i===1)return fTmpConvertErr(q); /* 정식 계약이 안 되면 결정으로 남기지 않는다(검수 11-08: 거절된 뒤 대체 선수까지 방출) */ return fTmpReinj(q); }, /* 누를 때 다시 본다: 원 선수가 다시 다쳤으면 결정을 닫고 이유를 알린다(검수 11-17 #235) */
  pick(e,i){ const q=G.players[e.data.qid]; if(!q||!q.ftmp)return '이미 정리된 계약입니다.'; let pre=''; if(i===1){ const err=fTmpConvert(q); if(!err)return `${q.name}과(와) 정식 계약했습니다.`; pre=err+' 원 선수 복귀로 처리합니다. '; } /* 자동 처리 중 전환이 막히면 기본(원 선수 복귀)으로 */
    { const w=fTmpReinj(q); if(w){ e.void=true; return pre+w; } } /* 기한 자동 처리도 다시 다친 원 선수는 복귀시키지 않는다(검수 11-17 #235) */
    const o=G.players[q.ftmp.o], be=o&&o.team===q.team?fBackErr(o,q):''; fTmpEnd(q,'원 선수 복귀');
    if(be){ o.frehab='hold'; return pre+`${q.name}의 대체 계약을 끝냈습니다. ${be}. 그래서 ${o.name}은(는) 다른 외국인을 정리할 때까지 재활 선수 명단에 남습니다(보류권 유지).`; } /* 복귀를 골랐는데 두 선수가 다 떠나지 않게(검수 11-06), 총액 한도도 같은 판정(검수 11-17 #228) */
    return pre+'원 선수가 돌아오고 대체 선수는 떠납니다.'; } };
EVH.ftmp2={ can(e,i){ const q=G.players[e.data.qid]; return i===0&&q&&q.ftmp&&!/불가/.test((e.opts&&e.opts[0]&&e.opts[0].l)||'')?fTmpConvertErr(q):''; }, pick(e,i){ const q=G.players[e.data.qid]; if(!q||!q.ftmp)return '이미 정리된 계약입니다.'; if(i===0){ const err=fTmpConvert(q); if(!err)return `${q.name}과(와) 정식 계약했습니다.`; fTmpEnd(q,'정식 전환 불가'); return err; } fTmpEnd(q,'원 선수 이탈'); return `${q.name}의 대체 계약을 끝냈습니다.`; } };
/* 8월 15일 외국인 등록 마감 7일 전 안내(커뮤니티 11-13 리아네트: 마감이 지나 대체 선수를 정식 계약할 수 없게 되고 외국인 한 명이 사라졌다) */
EVH.ftmp3={ can(e,i){ const q=G.players[e.data.qid]; return i===0&&q&&q.ftmp?fTmpConvertErr(q):''; }, pick(e,i){ const q=G.players[e.data.qid]; if(!q||!q.ftmp)return '이미 정리된 계약입니다.'; if(i===0){ const err=fTmpConvert(q); return err||`${q.name}과(와) 정식 계약했습니다.`; } return `${q.name}은(는) 대체 선수로 남습니다. 8월 15일이 지나면 정식 계약은 할 수 없고, 원 선수가 돌아오면 대체 계약이 끝납니다.`; } };
function fTmpDLWarn(){ if(G.unemp||period()!=='season')return; const dl=foreignDL(); if(G.day!==dl-7&&G.day!==dl-1)return;
  for(const q of playersOf(G.user).filter(x=>x.ftmp)){ const o=G.players[q.ftmp.o]; if((G.evs||[]).some(e=>!e.done&&e.k==='ftmp3'&&e.data&&e.data.qid===q.id))continue; const can=!fTmpConvertErr(q);
    evNew('ftmp3',`외국인 등록 마감 ${dl-G.day}일 전: 대체 선수 ${q.name}`,`KBO 규정상 8월 15일까지 정식 계약한 외국인만 남은 시즌·포스트시즌을 뜁니다. 부상 대체 선수 ${q.name}(${posLabel(q)}, 능력 ${dvo(q)})을(를) 남기려면 마감 전에 ${o?`${o.name}을(를) 방출하고 `:''}정식 계약해야 합니다. 마감이 지나면 대체 선수는 원 선수가 돌아오거나 정규시즌이 끝날 때까지만 뜁니다. 원 선수를 먼저 방출하면 마감 뒤에는 대체 선수도 정식 계약할 수 없어 외국인 자리가 빕니다.`,
      [{l:`${o?`${o.name} 방출 · `:''}${q.name} 정식 계약`,fx:can?`교체 횟수 1회 차감, 남은 경기 비율만큼 연봉 ${money(Math.round(q.sal*remainFrac()))}.`:`지금은 할 수 없습니다: ${fTmpConvertErr(q)}`},{l:'지금은 그대로',fx:'원 선수 복귀를 기다립니다.'}],{from:'운영팀',cat:'must',ref:q.id,data:{qid:q.id},def:1,exp:Math.max(1,dl-G.day)}); } }
/* 매일: 연장 비용, 원 선수 복귀 처리, 시즌 종료 정리, 우리 선수 장기 부상 안내 */
function fTmpDaily(){ const per=period(); try{ fTmpDLWarn(); }catch(e){}
  const evOpen=(k,q)=>(G.evs||[]).some(e=>!e.done&&e.k===k&&e.data&&e.data.qid===q.id);
  for(const t of G.teams)for(const q of playersOf(t.id).filter(x=>x.ftmp)){ const o=G.players[q.ftmp.o]; if(t.id===G.user){ if(q.ftmp.ask&&!evOpen('ftmp',q))delete q.ftmp.ask; if(q.ftmp.left&&!evOpen('ftmp2',q))delete q.ftmp.left; } /* 이직으로 결정 메일이 닫혔으면 다시 묻는다(재활 명단에 묶이지 않게, 검수 11-06) */
    if(per!=='season'){ fTmpEnd(q,'정규시즌 종료'); continue; }
    if(!o||o.team!==t.id||o.frehab!==q.id){ if(t.id===G.user&&!G.unemp){ if(q.ftmp.left)continue; q.ftmp.left=G.day; const ce=fTmpConvertErr(q), can=!ce; /* 안내도 실제 정식 계약 판정으로(검수 11-17 #236) */ /* 우리 구단은 자동 전환하지 않고 묻는다(검수 11-06: 원 선수를 방출했더니 대체 선수가 저절로 정식 계약됨) */
        evNew('ftmp2',`대체 선수 ${q.name} 거취`,`원 선수가 팀을 떠났습니다. 부상 대체로 뛰는 ${q.name}(${posLabel(q)}, 능력 ${dvo(q)})을(를) 어떻게 할지 정해야 합니다.`,[...(can?[{l:`${q.name} 정식 계약`,fx:`교체 횟수 1회 차감, 남은 경기 비율만큼 연봉 ${money(Math.round(q.sal*remainFrac()))}.`}]:[{l:'정식 계약 불가',fx:`${ce} 고르면 대체 계약을 끝냅니다.`}]),{l:'대체 계약 종료',fx:`${q.name}이(가) 떠납니다. 교체 횟수는 그대로입니다.`}],{from:'운영팀',cat:'must',ref:q.id,data:{qid:q.id},def:1,exp:5}); continue; }
      if(fTmpConvert(q))fTmpEnd(q,'원 선수 이탈'); continue; } /* AI: 원 선수가 떠났으면 정식 계약으로(못 하면 계약 종료) */
    if(o.injOut>0){ if(t.id===G.user&&q.ftmp.ask)fTmpReinj(q); continue; } /* 원 선수 재활 중. 복귀 결정을 보낸 뒤 다시 다쳤으면 그 결정을 닫는다(검수 11-17 #235) */
    if(t.id!==G.user||G.unemp){ if(fBackErr(o,q)){ if(!fTmpConvert(q))continue; fTmpEnd(q,'원 선수 복귀'); continue; } if(ovr(q)>ovr(o)+3&&!fTmpConvert(q))continue; fTmpEnd(q,'원 선수 복귀'); continue; } /* AI도 우리와 같은 길: 복귀가 막히면 정식 전환, 그것도 안 되면 대체 선수만 떠나고 원 선수는 재활 명단에 남는다(검수 11-17 #230: 두 선수를 다 잃음) */
    if(q.ftmp.ask)continue; q.ftmp.ask=G.day; const ce=fTmpConvertErr(q), can=!ce, be=fBackErr(o,q); /* 메일도 누를 때와 같은 판정으로 보여 준다(검수 11-17 #236) */
    evNew('ftmp',`${o.name} 복귀: 대체 선수 ${q.name} 거취`,`${o.name}(${posLabel(o)}, 능력 ${dvo(o)})이(가) 재활을 마쳤습니다. 부상 대체로 뛴 ${q.name}(${posLabel(q)}, 능력 ${dvo(q)})을(를) 어떻게 할지 정해야 합니다. 정할 때까지 ${o.name}은(는) 재활 선수 명단에 남습니다.`,
      [{l:`${o.name} 복귀`,fx:`${q.name}의 대체 계약을 끝냅니다. 교체 횟수는 그대로입니다.${be?` 다만 지금은 ${be}. 그래서 ${o.name}은(는) 다른 외국인을 정리할 때까지 재활 선수 명단에 남습니다.`:''}`},{l:`${o.name} 방출 · ${q.name} 정식 계약`,fx:can?`${o.name}을(를) 방출하고(남은 연봉 지급) ${q.name}과(와) 정식 계약합니다. 교체 횟수 1회 차감, 남은 경기 비율만큼 연봉 ${money(Math.round(q.sal*remainFrac()))}.`:`지금은 할 수 없습니다: ${ce}`}],
      {from:'운영팀',cat:'must',ref:q.id,data:{qid:q.id},def:0,exp:5}); }
  if(per==='season')for(const t of G.teams)for(const q of playersOf(t.id).filter(x=>x.ftmp&&G.day-x.ftmp.d>=x.ftmp.paid&&x.ftmp.ask!==G.day&&x.ftmp.left!==G.day)){ const nd=Math.min(30,Math.max(0,G.cal.end-G.day+1)); q.ftmp.paid+=30; G.sea.fspend[t.id]=(G.sea.fspend[t.id]||0)+Math.round(q.ftmp.fee*nd/30); } /* 그날 복귀·이탈 처리 뒤에도 남은 대체 선수만 한 달치 연장(검수 11-09zl: 복귀일에 연장 비용). 정규시즌 남은 날만큼만(검수 11-08). 결정을 미뤄도 등록돼 있는 동안은 지급(검수 11-06) */
  for(const t of G.teams)for(const o of playersOf(t.id))if(o.frehab==='hold'&&!fBackErr(o,null)){ delete o.frehab; if(t.id===G.user)note('운영팀',`${o.name}이(가) 재활 선수 명단에서 돌아와 다시 뛸 수 있습니다.`); } /* 다른 외국인을 정리하면 복귀 */
  if(per==='season'&&G.day<=foreignDL()&&!G.unemp)for(const o of foreignOf(G.user)){ if(fTmpErr(G.user,o)||o.ftmpM>=G.day-60)continue; o.ftmpM=G.day;
    mail('운영팀',`${o.name} ${fTmpDx(o)}일 진단: 부상 대체 외국인 등록 가능`,`${o.name}(${posLabel(o)})이(가) ${fTmpDx(o)}일 치료 진단을 받았습니다(남은 재활 ${o.injOut}일). 리그 규정상 6주 이상 부상이면 재활 선수 명단에 올리고 대체 외국인을 등록할 수 있습니다. 교체 횟수는 쓰지 않고, 보수는 한 달 10만 달러(약 ${money(F_TMP_MON)})까지입니다. 원 선수가 돌아오면 둘 중 한 명을 고릅니다.`,{kind:'외국인',ref:o.id,acts:[{l:'대체 선수 고르기',a:'fTmpStart',v:o.id}]}); } }
/* AI: 시즌 안에 돌아올 부상이면 대체 선수, 시즌 아웃이면 기존처럼 교체 */
function aiForeignTemp(tid){ const left=Math.max(0,G.cal.end-G.day); /* 남은 날짜로 비교(경기 수와 재활 일수를 비교해 대체를 건너뛰었다, 검수 11-08) */
  for(const o of foreignOf(tid)){ if(fTmpErr(tid,o)||o.injOut>left*1.1)continue;
    const L=(G.fmarket||[]).map(id=>G.players[id]).filter(q=>q&&q.team==null&&!foHeld(q)&&fKnows(tid,q)&&q.isP===o.isP&&!fTmpErr(tid,o,q)).sort((a,b)=>fScoreBy(tid,b)-fScoreBy(tid,a));
    if(L[0]&&!signTempForeign(tid,o.id,L[0].id))return true; }
  return false; }
