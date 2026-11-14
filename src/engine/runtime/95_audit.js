/* ===== 공통 상태 점검(stateAudit): 기능 사이의 연결이 어긋났는지 한 번에 본다 =====
   리뷰에서 반복된 네 가지 원인을 규칙으로 묶었다. 점검 도구(tools/check-logic.js [공통 점검])가 여러 전환(방출·이적·해외·이직·감독 교체·연도 변경)
   뒤에 이 함수를 불러 문제 목록이 비어 있는지 본다. 게임 진행에는 쓰지 않는다(읽기만 한다).
   1) 이동 정리: 선수가 떠나면 옛 구단의 표시·약속·협상·계약 조건이 남지 않는다
   2) 시즌 구분: 금액은 '계약 대상 시즌' 기준(달력 연도 아님) — auditSeasonFlip이 따로 본다
   3) 감독 교체: 전임 감독의 요청·충돌 기록이 새 감독에게 남지 않는다
   4) 안내한 기한: 기다려 준다고 안내한 후보·요청이 기한 전에 사라지지 않는다 */
function stateAudit(){ const out=[]; const bad=(k,t)=>out.push(`[${k}] ${t}`); const U=G.user; const P=id=>G.players[id]; const nm=id=>{ const p=P(id); return p?p.name+'('+id+')':'#'+id; };
  if(G.unemp)return out;
  /* 1) 이동 정리 */
  for(const [pos,id] of Object.entries(G.lineup||{})){ const p=P(id); if(!p||p.team!==U)bad('이동',`라인업 ${pos}에 우리 선수가 아닌 ${nm(id)}`); }
  for(const id of Object.keys(G.prole||{})){ const p=P(id); if(p&&p.team!==(G.prole[id].tid??U)&&G.day>(G.prole[id].d??0))bad('이동',`투수 기용 계획에 떠난 선수 ${nm(id)}`); }
  for(const p of Object.values(G.players)){
    if(p.team!==U&&p.promise&&p.promise.until>=G.day&&(p.promise.tid??U)===U)bad('이동',`떠난 선수 ${nm(p.id)}에게 우리 구단의 출전 약속이 남음`);
    if(p.team!==U&&p.listed)bad('이동',`떠난 선수 ${nm(p.id)}가 우리 트레이드 명단에 남음`);
    if(p.team==null&&p.newSal!=null&&!(G.contract&&!G.contract.done&&(G.contract.foreignEnd||[]).includes(p.id)))bad('이동',`소속 없는 ${nm(p.id)}에게 연봉 산정안이 남음`);
    if(p.team==null&&(p.roleProm||p.ntc||p.capB))bad('이동',`소속 없는 ${nm(p.id)}에게 계약 조건(주전 약속·거부권·계약금 상한 반영)이 남음`);
    if(p.smk&&p.smk.fy===fyNow()&&p.team!==U&&!(G.smkL||[]).some(e=>e.pid===p.id&&e.d===p.smk.d&&e.end!=null)&&(G.smkL||[]).some(e=>e.pid===p.id))bad('이동',`떠난 선수 ${nm(p.id)}의 스타 마케팅이 정산되지 않음`); }
  { const C=G.contract; if(C&&!C.done&&C.neg)for(const id of Object.keys(C.neg)){ const p=P(id); if(!p||p.team!==U)bad('이동',`연봉 협상 목록에 우리 선수가 아닌 ${nm(+id)}`); } }
  for(const id of (G.fmarket||[])){ const p=P(id); if(p&&p.team!=null)bad('이동',`외국인 시장에 계약된 선수 ${nm(id)}`); }
  /* 스태프: 한 사람이 우리 구단과 시장에 동시에 있으면 안 된다 */
  { const sc=new Set((G.scouts||[]).map(s=>s.id)); for(const s of (G.scoutMarket||[]))if(sc.has(s.id))bad('이동',`스카우트 ${s.name}이(가) 우리 구단과 후보 시장에 동시에`);
    const an=new Set((G.analysts||[]).map(a=>a.id)); for(const a of (G.amarket||[]))if(an.has(a.id))bad('이동',`분석원 ${a.name}이(가) 우리 구단과 후보 시장에 동시에`);
    if(G.coach&&G.coach[U]){ const cc=new Set(Object.values(G.coach[U]).filter(Boolean).map(c=>c.id)); for(const c of (G.cmarket||[]))if(cc.has(c.id))bad('이동',`코치 ${c.name}이(가) 우리 코치진과 후보 시장에 동시에`); } }
  /* 3) 감독 교체 */
  { const m=G.mgr[U]; const mid=m&&!m.interim?m.id:null;
    for(const r of (G.mreq||[]))if(r.st==='ask'&&r.tid===U&&r.mid!==mid)bad('감독',`전임 감독의 미응답 요청이 남음(${r.k})`);
    for(const e of (G.evs||[]))if(!e.done&&e.k==='mreq'){ const r=(G.mreq||[]).find(x=>x.id===(e.data&&e.data.rid)); if(r&&r.mid!==mid)bad('감독',`전임 감독 요청의 결정 버튼이 남음(${e.title})`); }
    if(G.dirFr&&G.dirFr.y===G.year&&m&&G.dirFr.mid!=null&&G.dirFr.mid!==m.id&&Object.keys(G.dirFr).some(k=>!['y','mid'].includes(k)&&G.dirFr[k]>0))bad('감독',`전임 감독과의 지시 충돌 횟수가 남음`); }
  /* 4) 안내한 기한 */
  for(const p of Object.values(G.players))if(p.fneg&&p.fneg.dl>=G.day&&p.team==null&&p.foreign&&!(G.fmarket||[]).includes(p.id))bad('기한',`답을 기다려 준다던 외국인 ${nm(p.id)}이(가) 시장에서 빠짐`);
  for(const [k,mk] of [['스카우트',G.scoutMarket||[]],['분석원',G.amarket||[]]])for(const s of mk)if(s.bid&&s.bid.exp<G.day-1)bad('기한',`${k} ${s.name}의 재제안 기한이 지났는데 결과 처리가 안 됨`);
  for(const e of (G.evs||[]))if(!e.done&&e.exp<G.day-1)bad('기한',`결정 기한이 지난 소식이 처리되지 않음(${e.title})`);
  return out; }
/* 이동 정리(공통): 우리 구단 소속이 아닌 선수에게서 우리 구단이 붙인 표시·약속을 걷는다. 이동 경로(트레이드·방출·해외·이직·AI 영입)마다 따로 지우지 않아도
   하루 처리 첫머리와 주요 이동 직후에 한 번 돌면 같은 결과가 된다 */
function leaveSweep(){ if(!G||!G.players)return; const U=G.user;
  for(const p of Object.values(G.players)){ if(p.team===U)continue; if(p.promise&&(p.promise.tid??U)!==p.team)delete p.promise; if(p.listed)delete p.listed; } /* 그 구단이 한 약속(tid)은 남긴다 */
  for(const k of Object.keys(G.lineup||{})){ const p=G.players[G.lineup[k]]; if(!p||p.team!==U)delete G.lineup[k]; }
  const C=G.contract; if(C&&!C.done&&C.neg)for(const id of Object.keys(C.neg)){ const p=G.players[id]; if(!p||p.team!==U)delete C.neg[id]; } }
/* 2) 시즌 구분: 겨울(다음 시즌 계약 기간)에 계산한 '다음 시즌' 금액이, 달력 연도만 바뀌었을 때 같은 시즌 금액과 같아야 한다 */
function auditMoney(tid){ const sy=ctSeason(); const yb=foreignOf(tid).filter(p=>p.foreign==='용병'); return {fTot:sum(yb.map(p=>fCommit(p))),fCap:fCap(tid),pay:payYear(tid,sy)}; }
