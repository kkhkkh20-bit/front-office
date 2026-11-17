/* ===== 코치 영입 공통 규칙 (외부 검수 11-17 #255~#267) =====
 코치를 데려오는 길이 여럿이다: 단장의 시장 영입(hireCoach)·다른 구단 코치 빼 오기(poachCoach)·AI 월간 영입과 빼 오기(cmAiMonthly)·
 겨울 계약 정리(coachYear)·빈자리 보강(89c_coach_vacancy)·다른 구단이 우리 코치에게 낸 제안(cmRaid/cmLeave)·감독 사단·단장 동반 합류(89b_staff_loyalty).
 길마다 검사가 조금씩 달라 한쪽에서 막힌 일이 다른 쪽에서 됐다. 이제 모두 아래 두 가지를 쓴다. 우리·AI 같음.
 1) coachHireWhy: 'tid 구단이 지금 이 코치를 이 자리에 데려올 수 있나'. 막히면 이유 문장, 되면 ''.
    - 은퇴 나이(STAFF_RET_AGE) 이상은 새 계약을 맺지 않고, 64세부터는 1년 계약만(연장 규칙과 같음)
    - 다른 구단의 우선 협상 후보(c.res)는 그 구단만. 단장이 떠나 AI가 된 구단의 우선 협상권도 그대로
    - 다른 구단 코치(빼 오기): 아직 합류 전(다음 시즌 계약)이면 안 되고, 재계약·잔류 뒤 1년 보호(raidSafe) 중이면 안 되며, 비시즌 빼 오기 한도(POACH_MAX)를 넘지 못한다
    - 자동 결정(AI·위임·제안 수락): 그 자리에 다음 시즌 합류할 코치가 이미 계약돼 있으면 밀어내지 않고, AI는 시장과 같은 연봉 여력(cmCanPay) 안에서만
 2) coachRelease·coachCompPay: 자리를 비우는 정산(잔여 연봉 절반)과 빼 오기 보상금(데려가는 구단 → 원 소속 구단). 누가 누구에게서 데려가든 같은 금액.
 난수를 쓰지 않는다 */
const COACH_OLD_AGE=64; /* 이 나이부터 새 계약·연장은 1년만(coachExtTerms와 같은 기준) */
const coachMaxYrs=c=>(c&&(c.age||0)>=COACH_OLD_AGE)?1:4;
/* o: {to: 앉힐 자리(기본 c.role), from: 지금 소속 구단(빼 오기), years: 계약 연수, sal: 줄 연봉(기본 c.sal), auto: AI·위임·제안 수락처럼 단장이 직접 누르지 않은 결정} */
function coachHireWhy(tid,c,o){ o=o||{}; if(!c||typeof c!=='object')return '후보가 없습니다.'; const nm=c.name||'그'; const to=o.to||c.role;
  if((c.age||0)>=STAFF_RET_AGE)return `${nm} 코치(${c.age}세)는 은퇴 나이라 새 계약을 맺지 않습니다.`;
  if(o.years!=null&&o.years>coachMaxYrs(c))return `${nm} 코치(${c.age}세)는 은퇴를 앞둬 1년 계약만 맺습니다.`;
  if(o.from==null&&c.res!=null&&c.res!==tid)return `${nm} 코치는 ${team(c.res)?tshort(c.res):'다른 구단'}이(가) 우선 협상권을 가진 후보입니다.`;
  if(o.from!=null){ if(staffPending(c))return '아직 합류 전인 코치에게는 영입을 제의할 수 없습니다.';
    if(c.raidSafe>G.day)return `${nm} 코치는 ${dmd(c.raidSafe)}까지 재계약 보호 기간이라 영입을 제의할 수 없습니다.`;
    if(poachN(tid)>=POACH_MAX)return `${team(tid)?tshort(tid):'그 구단'}은(는) 이번 겨울에 이미 코치 ${POACH_MAX}명을 데려왔습니다.`; }
  const C=G.coach&&G.coach[tid], cur=o.cur!==undefined?o.cur:C?C[to]:null;
  if(o.auto&&cur&&cur!==c&&staffPending(cur))return `${CROLE[to]?CROLE[to].l:'그 자리'}에는 다음 시즌 합류할 ${cur.name} 코치가 이미 계약돼 있습니다.`;
  if(o.auto&&tid!==ME()&&team(tid)&&!cmCanPay(team(tid),{sal:o.sal??c.sal},cur))return `${tshort(tid)}은(는) 연봉 여력이 없습니다.`;
  return ''; }
const coachCanHire=(tid,c,o)=>!coachHireWhy(tid,c,o);
const coachSeatId=(tid,k)=>{ const x=G.coach&&G.coach[tid]&&G.coach[tid][k]; return x?x.id:null; };
/* 빼 오기 보상금: 원 소속 구단 계약이 많이 남을수록. 비시즌 마지막 해 코치는 없음(poachTerms와 같은 식) */
function coachPoachComp(c){ if(!c)return 0; const off=poachOff(); return off&&(c.yrs||0)<=1?0:Math.round((c.sal||0)*Math.max(.5,(c.yrs||0)-(off?1:.5))*.5); }
function coachCompPay(payer,recv,amt){ if(!(amt>0))return 0; payOut(payer,amt,'coach'); payIn(recv,amt);
  if(payer!==ME())try{ hoBook(payer,[],[['코치 보상금',amt]]); }catch(e){} if(recv!==ME())try{ hoBook(recv,[['코치 보상금',amt]],[]); }catch(e){} return amt; }
/* 자리에 있던 코치를 내보내는 정산: 잔여 연봉 절반, 기록, 시장으로(mkt: 시장에 내놓는 조건). 감독대행이었으면 대행도 다시 정한다 */
function coachRelease(tid,cur,why,mkt){ if(!cur)return 0; staffHistory('coach',cur,'계약 종료',tid,why||'후임 코치 영입'); const pay=coachPaySev(tid,cur);
  cur.yrs=0; cur.clan=null; cur.from=tid; cur.fromY=G.year; G.cmarket=(G.cmarket||[]).filter(x=>x!==cur); if(mkt??(cur.age<64&&!cur.ob))G.cmarket.push(cur); coachInterimLeft(tid,cur); return pay; }
/* 감독대행이던 코치가 떠나면 그 구단 대행을 다시 정한다(우리는 interimLeft, AI 구단도 같게: 단장이 떠난 구단에 남은 대행) */
function coachInterimLeft(tid,c){ if(!c||!G.mgr)return; if(tid===ME()&&!G.unemp)return interimLeft(c); const m=G.mgr[tid];
  if(m&&m.interim&&(m.cid===c.id||(m.cid==null&&m.name===`${c.name}(감독대행)`))){ staffHistory('mgr',m,'감독대행 임무 종료',tid,`${c.name} 코치 퇴임`); G.mgr[tid]=mkInterim(tid); staffHistory('mgr',G.mgr[tid],'감독대행 선임',tid,'전임 대행 코치 퇴임에 따른 교체'); } }
/* 다른 구단 제안(G.cmRaid)이 아직 유효한가: 그 구단 한도·자리 사정이 바뀌면 없던 일(검수 #261·#263·#266) */
function cmRaidStale(r,c){ const TC=G.coach&&G.coach[r.tid]; if(!TC||!c)return '그 구단과 이야기가 끝났습니다.'; if(staffPending(c))return `${c.name} 코치는 아직 합류 전입니다.`;
  if(poachN(r.tid)>=POACH_MAX)return `${tshort(r.tid)}이(가) 이번 겨울 코치 영입 한도(${POACH_MAX}명)를 채웠습니다.`;
  const occ=TC[r.to]; if((r.occ!==undefined&&(occ?occ.id:null)!==r.occ)||staffPending(occ))return `${tshort(r.tid)}이(가) 그 자리(${CROLE[r.to].l})에 다른 코치를 앉혔습니다.`; return ''; }
/* 옛 저장 정리(불러올 때, 여러 번 해도 같음): 떠난 코치를 가리키는 감독대행, 자리 정보가 없는 열린 제안 */
function coachRulesMigrate(){ if(!G||!G.coach||!G.mgr)return;
  for(const t of G.teams||[]){ const m=G.mgr[t.id], C=G.coach[t.id]; if(!m||!m.interim||m.cid==null||!C)continue; if(CKEYS.some(k=>C[k]&&C[k].id===m.cid))continue; if(t.id===G.user&&G.unemp)continue;
    G.mgr[t.id]=mkInterim(t.id); staffHistory('mgr',G.mgr[t.id],'감독대행 선임',t.id,'전임 대행 코치 이적에 따른 교체'); }
  for(const r of G.cmRaid||[]){ if(r.occ!==undefined)continue; const TC=G.coach[r.tid], x=TC&&TC[r.to]; r.occ=x?x.id:null; } }
