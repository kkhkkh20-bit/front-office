/* ===== 자유계약(무적) 선수 =====
   방출되거나 FA 시장에서 팀을 찾지 못한 선수는 바로 은퇴하지 않고 무적 선수로 남는다.
   어느 구단이든 연봉을 낮춰 데려갈 수 있고(국내 선수는 정규시즌 종료일까지 등록 가능),
   마지막 계약이 끝난 뒤 2년 동안 계약하지 못하거나 38세가 되면 은퇴한다 */
const FREE_YEARS=2;
/* 구단을 떠나며 유니폼을 벗는 선수: 통산 은퇴 기록·명예의 전당 심사·OB를 거친 뒤 지운다(어느 경로든 같게) */
/* 리그를 떠나는 선수(은퇴·해외·방출·시장 정리): 1군 시즌 기록을 따로 보관해 시즌 결산·통산 순위에서 계속 열어 볼 수 있게 한다.
   1군 기록이 없으면 보관하지 않는다. 소속·WAR에 관계없이 선수별 기록을 영구 보관한다 */
const ARCH_K=['g','pa','ab','h','d','tr','hr','bb','so','sb','cs','e','rbi','outs','er','w','l','sv','hld','gs','hbp','sf','r','bf','sh','roe']; /* roe 실책 출루 허용(수비 타구 처리율, 검수 11-09l) */ /* cs 도루 실패·e 실책도 보관(검수 11-06) */
/* 보관 기록 한 줄 읽기: 저장할 때 0인 칸은 빼므로 읽을 때 모두 0으로 되살린다. 비율 기록은 현역과 같은 계산(bRate: 출루율 분모 타수+볼넷+희생플라이)을 쓴다 */
function archFull(r){ const o=Object.assign({},r); for(const k of ARCH_K)o[k]=o[k]||0; return o; }
function archLine(r){ const h=archFull(r); return Object.assign(bRate(h),{era:h.outs?h.er*27/h.outs:null}); }
function archPlayer(p){ if(!p||!p.hist)return; const H=p.hist.filter(h=>h.lvl==='1군'&&!h.y2&&((h.pa||0)+(h.outs||0)+(h.bf||0)+(h.er||0)+(h.g||0))>0); /* 아웃 없이 실점한 등판도 남긴다(리그 합계 유지) */ if(!H.length)return; const A=G.arch=G.arch||{};
  const rows=H.map(h=>{ const o={y:h.y,t:h.t}; for(const k of ARCH_K)if(h[k])o[k]=h[k]; if(!p.isP&&h.pos)o.pos=h.pos; if(h.pp)o.pp=h.pp; /* 그 시즌 수비 포지션(골든글러브 판정) */ if(p.use&&p.use.y===h.y&&p.use.pos)o.up=Object.assign({},p.use.pos); /* 포지션별 출장 수: 떠나도 골든글러브 자격이 바뀌지 않게(검수 11-07) */ let w=0; try{ w=warOf(h,p); }catch(e){} o.war=w; if(!p.isP&&h.y===G.year&&h.pa)try{ o.wn=w-warBat(h,lgOf(h.y)); }catch(e){} /* 리그 평균이 바뀌면 다시 계산할 몫(검수 11-09zf) */ /* 구단별로 반올림하면 합계 순서가 뒤집힌다: 반올림 없이(검수 11-09l) */ return o; });
  const last=(p.story||[]).slice(-1)[0]; A[p.id]={id:p.id,name:p.name,isP:!!p.isP,pos:p.isP?(p.role==='SP'?'선발':'불펜'):p.pos,foreign:p.foreign||null,age:p.age,y:G.year,t:p.team??(rows[rows.length-1]||{}).t,why:last&&last.y===G.year?last.t:'',rows,...(p.draft?{draft:{...p.draft}}:{}),...(p.draft&&p.draft.y!=null?{dy:p.draft.y}:{}),...(p.draft&&p.draft.tid!=null?{dt:p.draft.tid}:{}),...(p.svc?{svc:p.svc}:{}),...(p.ovsExp?{ovsExp:p.ovsExp}:{}), /* 해외 프로 경험: 은퇴 뒤에도 신인왕 자격이 같게(검수 11-09zz) */fy:Math.min(...p.hist.map(h=>h.y).concat([G.year])), /* 입단 연도·등록 연차·첫 기록 연도: 보관 뒤에도 신인 자격을 같게(검수 11-06) */...(p.aw&&p.aw.length?{aw:p.aw.slice()}:{}),...(()=>{ const F=(p.feats||[]).filter(f=>FEAT_PONLY.has(f.k)||!(G.feats||[]).some(x=>x.id===f.i)); return F.length?{feats:F}:{}; })()}; /* 리그 연표에 없는 선수 기록: 선수 전용(만루 홈런·끝내기 안타, 검수 11-09zp)과 600건 한도로 리그 연표에서 밀려난 기록(검수 11-09zz) */
}
/* 옛 저장에서 이미 합산된 시즌 기록은 유지한다. 새 선수 기록은 합산·삭제하지 않는다: 이미 치른 시즌의 팀·리그 합계(y1Rows)가 바뀌지 않게(검수 11-09zz) */
function archRestAdd(a){ const R=G.archRest=G.archRest||{}; for(const r of a.rows||[]){ const k=r.y+':'+r.t+':'+(a.isP?1:0), o=R[k]||(R[k]={y:r.y,t:r.t,isP:a.isP?1:0}); for(const x of ARCH_K)if(r[x])o[x]=(o[x]||0)+r[x]; } }
/* 지우지 않는 보관 기록: 단장이 맡았던 구단(M: 지금·예전)에서 뛴 선수, 명예의 전당·영구결번(후보)·해외 현역 선수(LG), 수상자, 우리 트레이드에 들어간 선수(기억할 이유가 WAR만은 아니다). 구조화 기록의 보호 분류(옛 저장 호환) */
function archKeep(a,M,LG){ if(!a||!a.rows)return false; M=M||new Set([G.user]); if(a.rows.some(r=>M.has(r.t))||(LG&&LG.has(String(a.id)))||(a.aw&&a.aw.length))return true; /* 수상자는 시상 기록에서 카드를 연다(검수 11-09zz) */ const id=a.id; return (G.trades||[]).some(t=>(t.gi||[]).includes(id)||(t.go||[]).includes(id)); }
function dropP(id){ const p=G.players[id]; if(p&&p.ftmp){ const o=G.players[p.ftmp.o]; if(o&&o.frehab===p.id){ delete o.frehab; if(o.team===p.team&&fBackClash(o,p))o.frehab='hold'; } try{ fTmpEvClose(p); }catch(e){} } /* 돌아오면 같은 유형 3명이면 재활 명단 유지(검수 11-09a: 대체 선수 방출로 투수 3명) */ /* 부상 대체 선수가 어떤 길로 떠나도 원 선수를 재활 명단에서 풀어 준다(검수 11-05) */ if(p)try{ archPlayer(p); }catch(e){} if(p)futLeagueCarry(p,p.hist); /* 압축 때 이미 옮긴 y2 행은 다시 더하지 않는다. */ let T=[]; const y=G.year; try{ if(p&&!p.foreign&&G.day>=payWin(y)[0])T=[...new Set([p.team,...(p.tLog||[]).filter(x=>x.y===y).flatMap(x=>[x.f,x.t])])].filter(t=>t!=null&&G.teams[t]); }catch(e){} const pre=T.map(t=>payYear(t,y)); delete G.players[id]; T.forEach((t,i)=>{ let d=pre[i]-payYear(t,y); if(t===p.team)d=Math.min(d,Math.round((p.sal||0)*ysWinF(y,-1e9,G.day))); /* 소속 중 은퇴: 지난 기간만 */ if(d>0){ for(const k in (G.payGone||{}))if(+k<y-1)delete G.payGone[k]; const P=G.payGone=G.payGone||{}; const Y=P[y]=P[y]||{}; Y[t]=(Y[t]||0)+d; } }); } /* 은퇴·삭제돼도 이미 생긴 올해 연봉은 남긴다(검수 11-08) */
function retireOut(p,why){ if(!p)return; try{ legendRetire(p); }catch(e){} /* 선수단 정리로 은퇴해도 프랜차이즈 은퇴 기록(검수 11-09zz) */ if(why)story(p,why,'move'); let rec=null; try{ rec=retireRecord(p); }catch(e){} try{ obFromPlayer(p,rec); }catch(e){} if(G.lineup)for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; if(Array.isArray(G.retired))G.retired.push({name:p.name,team:p.team,age:p.age}); dropP(p.id); }
function toFree(p,why,paid,noWv){ if(!p)return; try{ if(p.team!=null&&!p.foreign&&optEarned(p)&&p.opt.paidY!==G.year){ optPaid(p.team,p.opt.a); p.opt.paidY=G.year; if(p.team===G.user)addLog(`${p.name}이(가) 이미 달성한 성과 옵션 ${money(p.opt.a)}을(를) 방출과 함께 지급합니다.`); } }catch(e){} /* 방출해도 달성한 옵션은 준다(국내, 검수 11-06) */ if(p.team!=null){ mvLog('방출',p,p.team,null,why||''); if(!noWv)try{ wvStart(p,paid); }catch(e){} /* 웨이버 공시: 계약을 지우기 전에 남겨 둔다 */ p.relT=p.team; p.relD=G.day; const B=p.relBan=Object.assign({},p.relBan||{}); for(const k in B)if(B[k]<=G.day)delete B[k]; B[p.team]=G.day+365; } /* 구단별 재계약 제한 종료일: 다른 구단에서 다시 방출돼도 앞 구단 제한은 만료일까지 남는다 */ termsClear(p); /* 방출되면 계약 조건(상한 반영·옵션·약속·거부권)도 끝난다: 같은 구단에 다시 와도 되살아나지 않게 */ p.team=null; if(p.freeSince==null)p.freeSince=G.year; p.freeDay=G.day; p.faC=false; p.ext=false; p.yrs=0; delete p.newSal; if(G.contract){ if(G.contract.neg)delete G.contract.neg[p.id]; if(G.contract.ended)G.contract.ended=G.contract.ended.filter(x=>x!==p.id); } /* 옛 구단과의 연봉 협상(미확정 산정안)도 끝난다: 새 구단 계약이 옛 협상 금액을 읽지 않게 */
  delete p.cyrs; delete p.extNext; delete p.ys; delete p.role; delete p.faFrom; delete p.ask; delete p.listed; delete p.aiListed; delete p.hold; /* 옛 구단과의 미계약 상태도 끝난다(검수 11-08: 새 구단 계약을 덮어씀) */ if(p.mil&&p.mil.app)p.mil=null; /* 구단을 통해 낸 상무 지원도 무효: 새 구단에서 다시 지원해야 한다(검수 11-09zx) */ if(!p.injK)p.injOut=Math.min(p.injOut||0,60);
  if(why)story(p,why,'move'); }
function isFree(p){ return !!p&&p.team==null&&p.freeSince!=null&&!p.foreign&&!p.prospect&&!(G.fa&&!G.fa.closed&&(G.fa.pool||[]).includes(p.id)); }
function freeList(){ return Object.values(G.players).filter(p=>isFree(p)&&!p.wv); } /* 웨이버 공시 중(7일)인 선수는 아직 자유계약이 아니다 */
/* 무적 선수의 요구 연봉: 시장가의 35%와 직전 연봉의 60% 중 낮은 쪽, 최저연봉 이상 */
function freeAsk(p){ const rm=p.retMin&&p.retMin.until>=G.day?p.retMin.sal:0; /* 해외 복귀 우선협상이 불발된 선수: 복귀 요구액에 가깝게 */ const mv=marketSal(ovr(p)+pvShift(p)), star=p.age<=33?clamp((ovr(p)-52)*.06,0,.7):0; return round5(Math.max(MIN_SAL,rm,Math.min(mv*.35,(p.sal||MIN_SAL)*.6),mv*star)); } /* 주전급 이상은 무적이 돼도 시장가의 일정 몫 아래로 내려가지 않는다: 보상금을 부풀려 FA를 막은 뒤 헐값에 다시 데려오는 우회 방지(커뮤니티 피드백 11-11) */
function freeOpen(){ return period()!=='post'&&!preSettle(); } /* 국내 무적 선수는 정규시즌 종료일까지. 외국인 마감일과 PS 신규 등록 제한은 별개다. */
function signFree(id,tid){ tid=tid??G.user; const p=G.players[id]; if(!isFree(p))return '계약할 수 없는 선수입니다.'; if((p.relT===tid&&G.day-(p.relD??-999)<365)||(p.relBan&&p.relBan[tid]>G.day))return `방출한 구단은 1년 동안 ${p.name}과(와) 다시 계약할 수 없습니다.`; /* 방출 후 헐값 재계약 반복 방지 */ if(p.wv)return `${p.name}은(는) ${dmd(p.wv.end-1)}까지 웨이버 공시 중입니다. 영입·계약 → 웨이버·2차에서 양수를 신청하세요.`; if(!freeOpen())return '포스트시즌과 결산 전에는 국내 무적 선수를 새로 등록할 수 없습니다. 결산 후 다시 계약할 수 있습니다.';
  if(rosterN(tid)>=ROSTER_MAX)return `정식 선수가 ${ROSTER_MAX}명으로 꽉 찼습니다. 먼저 한 명을 정리하세요.`;
  const sal=freeAsk(p); p.team=tid; p.sal=sal; p.yrs=1; p.joinY=undefined; const yrs=G.year-p.freeSince; delete p.freeSince; delete p.freeDay; p.mor=clamp((p.mor??55)+8,0,100); mvLog('무적 영입',p,null,tid,`연 ${money(sal)}`,sal);
  story(p,`${tname(tid)}와(과) 계약 (무적 선수, 연 ${money(sal)})`,'move');
  milLate(p,tid); /* 무적으로 해를 넘겨 새해 입대 검사를 피한 선수(검수 11-08) */
  if(tid===G.user)addLog(`무적 선수 ${p.name}(${posLabel(p)}, ${p.age}세)과(와) 연 ${money(sal)}에 계약했습니다.`); else if(ovr(p)>=50)wire('이적',`${tname(tid)}, 무적 선수 ${p.name} 영입`,{tid,ref:p.id});
  void yrs; return ''; }
/* 소속 없이 해를 넘겨 새해 입대 검사(milNewYear)를 피한 28세 이상 미필: 새 구단에 들어가면 2주 뒤 현역(무적 계약·웨이버 양수) */
function milLate(p,tid){ try{ milInit(p); if(milFree(p)&&p.age>=28&&!(p.mil&&p.mil.app)){ enlist(p,'현역',G.day+14); if(tid===G.user)mail('운영팀',`${p.name} 현역 입대 예정 · ${dmd(G.day+14)}`,`${p.name}은(는) 입대 연기 한도(28세)를 넘긴 미필 선수라 합류 2주 뒤 현역으로 입대합니다.`,{kind:'병역',ref:p.id}); } }catch(e){} }
/* 새해: 2년 동안 계약하지 못한 선수, 38세 이상은 은퇴 */
function freeYear(){ let n=0; for(const p of freeList()){ if(G.year-p.freeSince>=FREE_YEARS||p.age>=38||ovr(p)<26){ story(p,'무적 선수로 지내다 은퇴','move'); let rec=null; try{ rec=retireRecord(p); }catch(e){} try{ obFromPlayer(p,rec); }catch(e){} if(Array.isArray(G.retired))G.retired.push({name:p.name,team:null,age:p.age}); dropP(p.id); n++; /* 정상 은퇴와 같이 통산 기록·명예의 전당 심사를 거친다 */ } } try{ freeIndie(); }catch(e){} return n; }
/* 독립리그·입단 테스트 출신(카페 11-09e): KBO 구단은 방출 선수뿐 아니라 독립리그(경기도·스코어본 등)에서 뛰거나 입단 테스트를 보는 선수를 해마다 몇 명씩 데려간다.
   장기 플레이에서 방출이 은퇴로 바로 이어지는 고참이 늘면 무적 시장이 20명대로 마르므로, 새해마다 최소 FREE_MIN명이 되게 채우고 그보다 많아도 FREE_NEW명은 새로 나온다.
   나이 22~30세(지명받지 못했거나 방출된 뒤 독립리그에서 뛰는 연령대), 능력 38±5(28~52): 신인 보충(fillRoster 34 안팎)보다 조금 위, 리그 중간값(45 안팎)보다 아래라 대부분 백업 경쟁이고 가끔 1군 자원이 나온다.
   못 데려가면 다른 무적 선수처럼 2년 뒤 은퇴하므로 시장이 끝없이 늘지 않는다 */
const FREE_MIN=50, FREE_NEW=5;
function freeIndie(){ const k=Math.max(FREE_NEW,FREE_MIN-freeList().length);
  for(let i=0;i<k;i++){ const age=ri(22,30), b=clamp(N(38,5),28,52); const p=newPlayer({age,base:b,pot:b+ri(0,age<=25?10:4)}); p.freeSince=G.year; story(p,R()<.6?'독립리그에서 뛰며 프로 입단을 준비':'구단 입단 테스트 응시','move'); } }
/* 매달 1일: 부상자가 많거나 자리가 빈 AI 구단은 쓸 만한 무적 선수를 데려간다 */
function freeAiMonthly(){ if(!freeOpen())return; const L=freeList().sort((a,b)=>ovr(b)-ovr(a)); if(!L.length)return;
  for(const t of G.teams){ if(t.id===ME())continue; const n=rosterN(t.id); if(n>=ROSTER_MAX-1)continue; const hurt=playersOf(t.id).filter(p=>p.injOut>14).length;
    if(n>=ROSTER_MAX-6&&hurt<3)continue; const own=domestic(t.id).map(ovr).sort((a,b)=>b-a); const bar=own[Math.min(own.length-1,35)]||35;
    const c=L.find(p=>p.team==null&&ovr(p)>=bar&&p.age<=35); if(c&&R()<.5)signFree(c.id,t.id); } }
