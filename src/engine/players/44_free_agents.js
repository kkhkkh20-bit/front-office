/* ===== 자유계약(무적) 선수 =====
   방출되거나 FA 시장에서 팀을 찾지 못한 선수는 바로 은퇴하지 않고 무적 선수로 남는다.
   어느 구단이든 연봉을 낮춰 데려갈 수 있고(외국인 등록 마감 8월 15일 이후 시즌 중에는 등록 불가),
   마지막 계약이 끝난 뒤 2년 동안 계약하지 못하거나 38세가 되면 은퇴한다 */
const FREE_YEARS=2;
/* 구단을 떠나며 유니폼을 벗는 선수: 통산 은퇴 기록·명예의 전당 심사·OB를 거친 뒤 지운다(어느 경로든 같게) */
/* 리그를 떠나는 선수(은퇴·해외·방출·시장 정리): 1군 시즌 기록을 따로 보관해 시즌 결산·통산 순위에서 계속 열어 볼 수 있게 한다.
   1군 기록이 없으면 보관하지 않는다. 너무 많아지면 통산 WAR이 낮은 선수부터 지운다 */
const ARCH_K=['g','pa','ab','h','d','tr','hr','bb','so','sb','cs','e','rbi','outs','er','w','l','sv','hld','gs','hbp','sf','r','bf','sh']; /* cs 도루 실패·e 실책도 보관(검수 11-06) */
/* 보관 기록 한 줄 읽기: 저장할 때 0인 칸은 빼므로 읽을 때 모두 0으로 되살린다. 비율 기록은 현역과 같은 계산(bRate: 출루율 분모 타수+볼넷+희생플라이)을 쓴다 */
function archFull(r){ const o=Object.assign({},r); for(const k of ARCH_K)o[k]=o[k]||0; return o; }
function archLine(r){ const h=archFull(r); return Object.assign(bRate(h),{era:h.outs?h.er*27/h.outs:null}); }
function archPlayer(p){ if(!p||!p.hist)return; const H=p.hist.filter(h=>h.lvl==='1군'&&!h.y2&&((h.pa||0)+(h.outs||0)+(h.bf||0)+(h.er||0)+(h.g||0))>0); /* 아웃 없이 실점한 등판도 남긴다(리그 합계 유지) */ if(!H.length)return; const A=G.arch=G.arch||{};
  const rows=H.map(h=>{ const o={y:h.y,t:h.t}; for(const k of ARCH_K)if(h[k])o[k]=h[k]; if(!p.isP&&h.pos)o.pos=h.pos; if(h.pp)o.pp=h.pp; /* 그 시즌 수비 포지션(골든글러브 판정) */ if(p.use&&p.use.y===h.y&&p.use.pos)o.up=Object.assign({},p.use.pos); /* 포지션별 출장 수: 떠나도 골든글러브 자격이 바뀌지 않게(검수 11-07) */ let w=0; try{ w=Math.round(warOf(h,p)*10)/10; }catch(e){} o.war=w; return o; });
  const last=(p.story||[]).slice(-1)[0]; A[p.id]={id:p.id,name:p.name,isP:!!p.isP,pos:p.isP?(p.role==='SP'?'선발':'불펜'):p.pos,foreign:p.foreign||null,age:p.age,y:G.year,t:p.team??(rows[rows.length-1]||{}).t,why:last&&last.y===G.year?last.t:'',rows,...(p.draft&&p.draft.y!=null?{dy:p.draft.y}:{}),...(p.draft&&p.draft.tid!=null?{dt:p.draft.tid}:{}),...(p.svc?{svc:p.svc}:{}),fy:Math.min(...p.hist.map(h=>h.y).concat([G.year])), /* 입단 연도·등록 연차·첫 기록 연도: 보관 뒤에도 신인 자격을 같게(검수 11-06) */...(p.aw&&p.aw.length?{aw:p.aw.slice()}:{})};
  const ks=Object.keys(A).filter(id=>A[id]&&!archKeep(A[id])); if(ks.length>900){ const tw=id=>A[id].rows.reduce((a,r)=>a+(r.war||0),0); ks.sort((a,b)=>tw(a)-tw(b)).slice(0,ks.length-900).forEach(id=>delete A[id]); } }
/* 지우지 않는 보관 기록: 우리 구단에서 뛴 선수, 우리 트레이드에 들어간 선수(기억할 이유가 WAR만은 아니다). 나머지만 900명 한도로 통산 WAR 낮은 순 정리 */
function archKeep(a){ if(!a||!a.rows)return false; if(a.rows.some(r=>r.t===G.user))return true; const id=a.id; return (G.trades||[]).some(t=>(t.gi||[]).includes(id)||(t.go||[]).includes(id)); }
function dropP(id){ const p=G.players[id]; if(p&&p.ftmp){ const o=G.players[p.ftmp.o]; if(o&&o.frehab===p.id)delete o.frehab; } /* 부상 대체 선수가 어떤 길로 떠나도 원 선수를 재활 명단에서 풀어 준다(검수 11-05) */ if(p)try{ archPlayer(p); }catch(e){} delete G.players[id]; }
function retireOut(p,why){ if(!p)return; if(why)story(p,why,'move'); let rec=null; try{ rec=retireRecord(p); }catch(e){} try{ obFromPlayer(p,rec); }catch(e){} if(G.lineup)for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; if(Array.isArray(G.retired))G.retired.push({name:p.name,team:p.team,age:p.age}); dropP(p.id); }
function toFree(p,why,paid,noWv){ if(!p)return; try{ if(p.team!=null&&!p.foreign&&optEarned(p)&&p.opt.paidY!==G.year){ payOut(p.team,p.opt.a,'rel'); p.opt.paidY=G.year; if(p.team===G.user)addLog(`${p.name}이(가) 이미 달성한 성과 옵션 ${money(p.opt.a)}을(를) 방출과 함께 지급합니다.`); } }catch(e){} /* 방출해도 달성한 옵션은 준다(국내, 검수 11-06) */ if(p.team!=null){ mvLog('방출',p,p.team,null,why||''); if(!noWv)try{ wvStart(p,paid); }catch(e){} /* 웨이버 공시: 계약을 지우기 전에 남겨 둔다 */ p.relT=p.team; p.relD=G.day; const B=p.relBan=Object.assign({},p.relBan||{}); for(const k in B)if(B[k]<=G.day)delete B[k]; B[p.team]=G.day+365; } /* 구단별 재계약 제한 종료일: 다른 구단에서 다시 방출돼도 앞 구단 제한은 만료일까지 남는다 */ termsClear(p); /* 방출되면 계약 조건(상한 반영·옵션·약속·거부권)도 끝난다: 같은 구단에 다시 와도 되살아나지 않게 */ p.team=null; if(p.freeSince==null)p.freeSince=G.year; p.freeDay=G.day; p.faC=false; p.ext=false; p.yrs=0; delete p.newSal; if(G.contract){ if(G.contract.neg)delete G.contract.neg[p.id]; if(G.contract.ended)G.contract.ended=G.contract.ended.filter(x=>x!==p.id); } /* 옛 구단과의 연봉 협상(미확정 산정안)도 끝난다: 새 구단 계약이 옛 협상 금액을 읽지 않게 */
  delete p.cyrs; delete p.extNext; delete p.ys; delete p.role; delete p.faFrom; delete p.ask; delete p.listed; delete p.aiListed; delete p.hold; /* 옛 구단과의 미계약 상태도 끝난다(검수 11-08: 새 구단 계약을 덮어씀) */ if(!p.injK)p.injOut=Math.min(p.injOut||0,60);
  if(why)story(p,why,'move'); }
function isFree(p){ return !!p&&p.team==null&&p.freeSince!=null&&!p.foreign&&!p.prospect&&!(G.fa&&!G.fa.closed&&(G.fa.pool||[]).includes(p.id)); }
function freeList(){ return Object.values(G.players).filter(p=>isFree(p)&&!p.wv); } /* 웨이버 공시 중(7일)인 선수는 아직 자유계약이 아니다 */
/* 무적 선수의 요구 연봉: 시장가의 35%와 직전 연봉의 60% 중 낮은 쪽, 최저연봉 이상 */
function freeAsk(p){ const rm=p.retMin&&p.retMin.until>=G.day?p.retMin.sal:0; /* 해외 복귀 우선협상이 불발된 선수: 복귀 요구액에 가깝게 */ return round5(Math.max(MIN_SAL,rm,Math.min(marketSal(ovr(p)+pvShift(p))*.35,(p.sal||MIN_SAL)*.6))); }
function freeOpen(){ const per=period(); return !((per==='season'&&G.day>foreignDL())||per==='post'||preSettle()); } /* 8월 15일 뒤부터 포스트시즌이 끝날 때까지 등록 불가 */
function signFree(id,tid){ tid=tid??G.user; const p=G.players[id]; if(!isFree(p))return '계약할 수 없는 선수입니다.'; if((p.relT===tid&&G.day-(p.relD??-999)<365)||(p.relBan&&p.relBan[tid]>G.day))return `방출한 구단은 1년 동안 ${p.name}과(와) 다시 계약할 수 없습니다.`; /* 방출 후 헐값 재계약 반복 방지 */ if(p.wv)return `${p.name}은(는) ${dmd(p.wv.end-1)}까지 웨이버 공시 중입니다. 영입·계약 → 웨이버·2차에서 양수를 신청하세요.`; if(!freeOpen())return '8월 15일 이후에는 시즌이 끝날 때까지 새 선수를 등록할 수 없습니다.';
  if(rosterN(tid)>=ROSTER_MAX)return `정식 선수가 ${ROSTER_MAX}명으로 꽉 찼습니다. 먼저 한 명을 정리하세요.`;
  const sal=freeAsk(p); mvLog('무적 영입',p,null,tid,`연 ${money(sal)}`,sal); p.team=tid; p.sal=sal; p.yrs=1; p.joinY=undefined; const yrs=G.year-p.freeSince; delete p.freeSince; delete p.freeDay; p.mor=clamp((p.mor??55)+8,0,100);
  story(p,`${tname(tid)}와(과) 계약 (무적 선수, 연 ${money(sal)})`,'move');
  try{ milInit(p); if(milFree(p)&&p.age>=28&&!(p.mil&&p.mil.app)){ enlist(p,'현역',G.day+14); if(tid===G.user)mail('운영팀',`${p.name} 현역 입대 예정 · ${dmd(G.day+14)}`,`${p.name}은(는) 입대 연기 한도(28세)를 넘긴 미필 선수라 계약 2주 뒤 현역으로 입대합니다.`,{kind:'병역',ref:p.id}); } }catch(e){} /* 무적으로 해를 넘겨 새해 입대 검사를 피한 선수(검수 11-08) */
  if(tid===G.user)addLog(`무적 선수 ${p.name}(${posLabel(p)}, ${p.age}세)과(와) 연 ${money(sal)}에 계약했습니다.`); else if(ovr(p)>=50)wire('이적',`${tname(tid)}, 무적 선수 ${p.name} 영입`,{tid,ref:p.id});
  void yrs; return ''; }
/* 새해: 2년 동안 계약하지 못한 선수, 38세 이상은 은퇴 */
function freeYear(){ let n=0; for(const p of freeList()){ if(G.year-p.freeSince>=FREE_YEARS||p.age>=38||ovr(p)<26){ story(p,'무적 선수로 지내다 은퇴','move'); let rec=null; try{ rec=retireRecord(p); }catch(e){} try{ obFromPlayer(p,rec); }catch(e){} if(Array.isArray(G.retired))G.retired.push({name:p.name,team:null,age:p.age}); dropP(p.id); n++; /* 정상 은퇴와 같이 통산 기록·명예의 전당 심사를 거친다 */ } } return n; }
/* 매달 1일: 부상자가 많거나 자리가 빈 AI 구단은 쓸 만한 무적 선수를 데려간다 */
function freeAiMonthly(){ if(!freeOpen())return; const L=freeList().sort((a,b)=>ovr(b)-ovr(a)); if(!L.length)return;
  for(const t of G.teams){ if(t.id===ME())continue; const n=rosterN(t.id); if(n>=ROSTER_MAX-1)continue; const hurt=playersOf(t.id).filter(p=>p.injOut>14).length;
    if(n>=ROSTER_MAX-6&&hurt<3)continue; const own=domestic(t.id).map(ovr).sort((a,b)=>b-a); const bar=own[Math.min(own.length-1,35)]||35;
    const c=L.find(p=>p.team==null&&ovr(p)>=bar&&p.age<=35); if(c&&R()<.5)signFree(c.id,t.id); } }
