/* ===== KBO 2차 드래프트 (2023년 부활, 격년: 홀수 해 시즌 뒤 11월) =====
   출처: KBO 이사회 2023.7 부활 결정(뉴스서울·inews24 보도), 2025.11.19 시행 보도(시대일보·뉴시스 2025.11.18~19).
   - 구단마다 35명을 보호하고, 나머지 중에서 다른 구단이 직전 시즌 성적 역순으로 3라운드까지 지명한다. 하위 3개 구단은 4·5라운드도 있다(최대 5명).
   - 앞 라운드를 건너뛰어도 다음 라운드에 지명할 수 있다. 한 구단에서는 최대 4명까지만 데려갈 수 있다.
   - 양도금(지명 구단 → 원소속 구단): 1라운드 4억, 2라운드 3억, 3라운드 2억, 4라운드 이하 1억. 계약은 그대로 이어진다.
   - 지명 대상 제외: 외국인, 입단 1~3년 차(올해 지명 신인 포함), 육성선수, 군 보류 선수, 이번 겨울 FA 계약 선수.
   - 1라운드 지명자는 다음 두 시즌 안에 1군 50일, 2라운드는 30일 이상 등록해야 한다. 못 채우면 원소속 구단으로 돌아가고 양도금 50%를 돌려준다(원소속 구단이 원하지 않으면 자유계약) */
const SD_PROT=35, SD_RD=3, SD_XRD=2, SD_LOSS=4, SD_FEE=[400,300,200,100], SD_REG=[50,30], SD_OPEN=[11,12], SD_DAY=[11,19];
const sdYear=y=>y>=2023&&y%2===1;
const sdFee=rd=>SD_FEE[Math.min(rd,4)-1];
/* shortcut: 게임 시작 때 만든 선수는 지명 기록이 없어 만 21세 이하를 입단 3년 차 이내로 본다. 시작 선수가 다 지명 기록을 갖게 되면 지운다 */
function sdExempt(p){ const y=G.year; return !!(p.foreign||p.ys||p.prospect||p.joinY>y||(p.draft?p.draft.y>=y-3||(p.draft.y===y-4&&p.mil&&p.mil.pf!=null):p.age<=21)||milServing(p)||(p.lastFA!=null&&p.lastFA>=y)); }
function sdPool(tid){ return Object.values(G.players).filter(p=>p.team===tid&&!sdExempt(p)); }
function sdProtAI(tid){ return sdPool(tid).sort((a,b)=>keepScore(b)-keepScore(a)).slice(0,SD_PROT).map(p=>p.id); } /* 보호는 전력 순(연봉 비용을 빼지 않는다): 비싼 주전이 명단 밖으로 나오지 않게(카페 11-08) */
function sdSeq(order){ const s=[]; for(let rd=1;rd<=SD_RD+SD_XRD;rd++)(rd<=SD_RD?order:order.slice(0,3)).forEach(tid=>s.push({rd,tid})); return s; }
function sdLost(tid){ return G.sd2.seq.filter(s=>s.pid&&s.from===tid).length; }
/* 지명 후보: 다른 구단의 보호명단 밖 선수. 이번 드래프트로 이미 옮긴 선수와 4명을 잃은 구단 선수는 뺀다 */
function sdCands(tid){ const S=G.sd2; const taken=new Set(S.seq.map(s=>s.pid).filter(Boolean)); /* 지명이 시작되면 보호명단은 확정: 후보 조회가 명단을 다시 짜지 않는다(검수 11-06). AI 명단은 지명 시작 때(sdStart) 한 번 새로 짠다 */
  return G.teams.filter(t=>t.id!==tid&&sdLost(t.id)<SD_LOSS).flatMap(t=>sdPool(t.id).filter(q=>!taken.has(q.id)&&!(S.prot[t.id]||[]).includes(q.id)&&(!S.pool||(S.pool[t.id]||[]).includes(q.id)))); } /* 지명 시작 뒤 영입한 선수는 새 구단이 보호할 기회가 없었다: 시작 때 명단 대상만(검수 11-08) */
function sdCash(tid){ let c=team(tid).cash||0; if(tid===ME()){ const P=G.spend||{}; c+=(P.compIn||0)-(P.comp||0)-(P.trC||0); } return c; } /* 우리 양도금·보상금은 결산 장부에 쌓이고 트레이드 약정 현금도 이미 쓴 돈이다. 이직 때 장부는 옛 구단 현금으로 정산되므로 장부만 보면 이중 계산이 없다(검수 11-09f) */
/* 쓸 수 있는 돈: 모기업 구단은 보유 현금 + 구단주 지원 목표 안의 예산 여유(실제 KBO처럼 모기업이 예산 안에서 대 준다). 약정 현금·양도금 장부는 이미 예산 여유에 들어 있다. 독립구단은 현금만(피드백 11-09j) */
function spendable(tid){ const t=team(tid); if(tid!==ME()||t.indie)return sdCash(tid)-(t.indie?newStadDue(tid):0); /* 독립구단은 결산 때 낼 신구장 분담금도 쓸 수 없는 돈(AI 포함, 검수 11-09zza) */ const b=budget(); return (t.cash||0)+Math.max(0,b.roomGoal)+Math.min(0,b.roomCap); }
function spendRoom(){ const t=team(G.user); return t.indie?0:Math.max(0,spendable(G.user)-(t.cash||0)); } /* 그중 구단주 지원 여유(화면 안내용) */
/* 지출: 보유 현금에서 먼저, 모자란 몫은 단장 결정 지출로 장부에 올려 결산 때 구단주 지원(적자 보전)이 메운다 */
function spendTxt(){ const t=team(G.user), a=Math.max(0,spendable(G.user)); return t.indie?`선수 영입 자금(보유 현금만) ${money(a)}, 트레이드 약정분${newStadDue(G.user)?'·결산 때 낼 신구장 분담금':''} 제외`:`선수 영입 자금 ${money(a)} = 보유 현금 ${money(Math.max(0,t.cash||0))} + 구단주 지원 여유 ${money(spendRoom())}`; }
function spendPay(c){ const t=team(G.user), k=t.indie?c:clamp(Math.min(t.cash||0,sdCash(G.user)),0,c); t.cash-=k; if(c>k)G.spend.etc=(G.spend.etc||0)+c-k; return k; } /* 돌려주는 값: 현금에서 낸 몫. 트레이드 약정 현금·양도금처럼 이미 장부에 잡힌 돈은 현금에서 다시 쓰지 않는다(검수 11-09zza) */
const sdSubd=tid=>{ const S=G.sd2; return !!S&&(!!(S.subs&&S.subs[tid])||S.sub===tid); }; /* 구단별 제출 여부: 이직해도 전 구단 제출 명단이 남는다(검수 11-09f) */
const sdBackAI=(p,o)=>rosterN(o.from)<ROSTER_MAX&&aiVal(team(o.from),p)>=0;
function sdOpen(){ if(G.sd2&&G.sd2.y!==G.year){ const o=G.sd2; (G.sd2h=G.sd2h||{})[o.y]={y:o.y,stage:'done',done:o.done,seq:o.seq.filter(s=>s.pid)}; } /* 지난 회차는 지명 결과만 보관 */ const order=((G.last&&G.last.y===G.year&&G.last.order)||standingsNow()).map(x=>x.tid).reverse();
  const prot={}; for(const t of G.teams)if(t.id!==ME())prot[t.id]=sdProtAI(t.id);
  G.sd2={y:G.year,stage:'protect',exp:Math.max(dnum(G.year,...SD_DAY),G.day+5),order,prot,seq:sdSeq(order),cur:0};
  wire('2차 드래프트',`${G.year} 2차 드래프트: 구단별 보호선수 ${SD_PROT}명 명단 제출`,{});
  if(G.unemp)return; const my=order.indexOf(G.user)+1;
  mail('운영팀',`${G.year} 2차 드래프트: 보호선수 최대 ${SD_PROT}명을 정하세요`,`격년으로 열리는 2차 드래프트입니다. ${dmd(G.sd2.exp-1)}까지 보호선수를 최대 ${SD_PROT}명 내세요. 1명부터 낼 수 있고, 빈자리는 자동으로 채우지 않습니다. 다른 구단은 명단 밖 선수를 지명해 데려가며, 우리 구단에서는 최대 ${SD_LOSS}명이 나갈 수 있습니다.\n\n저절로 빠지는 선수: 외국인, 입단 1~3년 차, 군 복무를 마친 4년 차, 육성선수, 군 보류, 이번 겨울 FA 계약.\n지명 순서는 지난 시즌 성적 역순이고 우리는 ${my}번째입니다.${my<=3?' 하위 3개 구단이라 4·5라운드까지 최대 5명을 뽑을 수 있습니다.':''} 양도금은 1라운드 4억, 2라운드 3억, 3라운드 2억, 4라운드 이하 1억입니다.`,{imp:true,kind:'드래프트',acts:[{l:'보호명단 정하기',a:'go',v:'transfer:kbo'}]});
  mail(FROM['드래프트']||'프런트',`2차 드래프트 보호선수 최대 ${SD_PROT}명을 정하세요`,`2차 드래프트 보호선수 최대 ${SD_PROT}명을 정하세요. ${dmd(G.sd2.exp)}에 지명이 시작되며, 그 전날까지 고칠 수 있습니다.`,{imp:true,kind:'드래프트',acts:[{l:'보호명단 정하기',a:'go',v:'transfer:kbo'}]}); } /* 요약 알림도 웨이버·2차 드래프트 화면으로(검수 11-07: 신인 드래프트로 감) */
function sdSubmit(ids){ const S=G.sd2; if(!S||S.stage!=='protect'||G.unemp)return '보호선수 명단을 낼 때가 아닙니다.'; const pool=new Set(sdPool(G.user).map(q=>q.id));
  const L=[...new Set(ids)].filter(x=>pool.has(x)).slice(0,SD_PROT); if(!L.length&&pool.size)return `보호선수를 한 명 이상 고르세요. 내지 않으면 ${dmd(S.exp)}에 운영팀이 대신 정합니다.`; /* 빈 명단은 제출로 보지 않는다(검수 11-06) */ S.prot[G.user]=L; S.sub=G.user; (S.subs=S.subs||{})[G.user]=1; /* 제출한 구단: 이직하면 새 구단에는 따라가지 않는다(검수 11-08d) */ return `보호선수 ${S.prot[G.user].length}명 명단을 냈습니다.${L.length<Math.min(SD_PROT,pool.size)?' 빈자리는 추가로 보호하지 않아 나머지는 명단 밖에 남습니다.':''} ${dmd(S.exp)}에 지명이 시작됩니다. 그 전까지는 고칠 수 있습니다.`; }
function sdStart(){ const S=G.sd2;
  for(const t of G.teams){ if(sdSubd(t.id)){ const L0=S.prot[t.id]||[], ids=new Set(sdPool(t.id).map(q=>q.id)), L=L0.filter(x=>ids.has(x)); for(const id of sdProtAI(t.id)){ if(L.length>=Math.min(L0.length,SD_PROT))break; if(!L.includes(id))L.push(id); } S.prot[t.id]=L; } /* 제출한 명단은 이직해도 지킨다(검수 11-09f). 그사이 떠난 보호 선수 자리는 운영팀 순서로 채운다 */
    else if(t.id!==ME())S.prot[t.id]=sdProtAI(t.id); } /* 보호 기간에 바뀐 AI 선수단을 반영해 지명 시작 때 확정 */
  if(!sdSubd(G.user)&&!G.unemp){ S.prot[G.user]=sdProtAI(G.user); note('드래프트','2차 드래프트 보호선수 명단을 운영팀 기준(현재 능력·성장 여지·나이·계약)으로 냈습니다.'); }
  S.pool={}; for(const t of G.teams)S.pool[t.id]=sdPool(t.id).map(q=>q.id); S.stage='pick'; sdRun(); }
/* 지명할 수 없는 이유(정원·양도금 현금·다음 시즌 상한): AI 지명·우리 지명·지명 화면이 같은 판정(검수 11-09ze). pid 없으면 구단 전체 조건만 */
function sdWhy(tid,rd,pid){ if(rosterN(tid)>=ROSTER_MAX)return {k:'정원 초과',t:`정식 선수가 ${ROSTER_MAX}명으로 꽉 찼습니다. 한 명을 정리해야 지명할 수 있습니다.`};
  if(spendable(tid)<sdFee(rd))return {k:'현금 부족',t:`양도금 ${money(sdFee(rd))}을(를) 낼 돈이 모자랍니다(${tid===ME()?spendTxt():'보유 현금 '+money(Math.max(0,sdCash(tid)))}).`}; /* 양도금을 낼 현금(검수 11-07·11-08) */
  if(pid!=null){ const a=capPayAs(tid,[pid],[]), c=capOf(sponSeason())*aiCapMul(team(tid)); if(a>c)return {k:'상한 초과',t:`지명하면 다음 시즌 샐러리캡 반영액이 ${money(a)}(으)로 상한 ${money(c)}을(를) 넘습니다. 넘긴 만큼 경쟁균형세를 냅니다.`,soft:tid===G.user}; } return null; } /* 상한 초과는 실제 규정처럼 막지 않고 세금을 낸다(우리 구단은 경고만, AI는 상한 안에서만 지명) */
function sdAiPick(tid,rd){ if(sdWhy(tid,rd))return null; const t=team(tid); let best=null,bv=-1e9; for(const q of sdCands(tid)){ if(sdWhy(tid,rd,q.id))continue; /* 다음 시즌 샐러리캡 안에서만 */ const v=aiVal(t,q); if(v>bv){ bv=v; best=q; } } return best&&bv>=sdFee(rd)/100?best.id:null; }
function sdTake(s,pid){ const q=G.players[pid]; const from=q.team, fee=sdFee(s.rd); const keep=q.ctT===from; delete q.capB; delete q.roleProm; q.team=s.tid; if(keep)q.ctT=s.tid; else termsClear(q); /* 계약은 이어진다: 성과 옵션·구단 옵션·옵트아웃·거부권도 승계(계약금 상한 반영·주전 약속은 원구단 몫) */ q.listed=false; if(from===G.user&&G.lineup)for(const k in G.lineup)if(G.lineup[k]===pid)delete G.lineup[k];
  payOut(s.tid,fee,'comp'); payIn(from,fee); Object.assign(s,{pid,from,fee,nm:q.name});
  if(s.rd<=SD_REG.length)q.sd2={y:G.year,rd:s.rd,from,to:s.tid,fee,need:SD_REG[s.rd-1],reg:0};
  story(q,`${G.year} 2차 드래프트 ${s.rd}라운드로 ${tname(s.tid)} 이적`,'move'); acqStamp(q,'2차 드래프트',s.tid,{rd:s.rd}); mvLog('2차 드래프트',q,from,s.tid,`${s.rd}라운드 · 양도금 ${money(fee)}`,fee);
  wire('2차 드래프트',`${tshort(s.tid)}, ${s.rd}라운드 ${q.name}(${posLabel(q)}, 전 ${tshort(from)}) 지명`,{tid:s.tid,ref:pid});
  if(from===G.user)note('드래프트',`2차 드래프트: ${tname(s.tid)}이(가) ${s.rd}라운드로 ${q.name}을(를) 데려갔습니다. 양도금 ${money(fee)}을(를) 받습니다.`,pid); }
/* 우리 차례에서 멈춘다. quiet: 화면에서 지명한 직후라 따로 알리지 않는다 */
function sdRun(quiet){ const S=G.sd2; if(!S||S.stage!=='pick')return;
  while(S.cur<S.seq.length){ const s=S.seq[S.cur];
    if(s.tid===ME()){ const can=rosterN(s.tid)<ROSTER_MAX&&sdCands(s.tid).length; if(can&&spendable(s.tid)<sdFee(s.rd))note('드래프트',`2차 드래프트 ${s.rd}라운드: 양도금 ${money(sdFee(s.rd))}을(를) 낼 현금이 없어 건너뛰었습니다.`); /* 아무도 지명할 수 없으면 멈추지 않는다(검수 11-09f) */
      else if(can){ if(S.wait!==S.cur){ S.wait=S.cur; S.exp=G.day+1; if(!quiet)stop('드래프트',`2차 드래프트 ${s.rd}라운드, 우리 차례입니다. 지명하거나 건너뛰세요(내일까지 정하지 않으면 건너뜁니다).`); } return; } }
    else { const id=sdAiPick(s.tid,s.rd); if(id)sdTake(s,id); }
    if(!s.pid)s.pass=true; S.cur++; }
  S.stage='done'; S.done=G.day; const P=S.seq.filter(s=>s.pid);
  news('드래프트',`${G.year} 2차 드래프트 ${P.length}명 이동`,P.length?P.map(s=>`${s.rd}라운드 ${tshort(s.tid)}: ${s.nm}(전 ${tshort(s.from)})`).join('\n'):'지명된 선수가 없습니다.',0);
  if(!G.unemp){ const got=P.filter(s=>s.tid===G.user), lost=P.filter(s=>s.from===G.user); note('드래프트',`2차 드래프트가 끝났습니다. 데려온 선수 ${got.length}명${got.length?`(${got.map(s=>s.nm).join(', ')})`:''}, 내준 선수 ${lost.length}명${lost.length?`(${lost.map(s=>s.nm).join(', ')})`:''}.`); } }
function sdPick(pid){ const S=G.sd2; if(!S||S.stage!=='pick')return '2차 드래프트 지명 시간이 아닙니다.'; const s=S.seq[S.cur]; if(!s||s.tid!==G.user)return '우리 차례가 아닙니다.';
  if(pid!=null){ if(!sdCands(G.user).some(q=>q.id===pid))return '지명할 수 없는 선수입니다(보호선수이거나 원소속 구단이 이미 4명을 잃음).'; const w=sdWhy(G.user,s.rd,pid); if(w&&!w.soft)return w.t; sdTake(s,pid); } /* 검수 11-08: 플레이어만 현금 없이 지명하던 차이 */ else s.pass=true;
  S.cur++; sdRun(true); return pid!=null?`${s.rd}라운드에서 ${G.players[pid].name}을(를) 지명했습니다. 양도금 ${money(s.fee)}.`:`${s.rd}라운드 지명을 건너뛰었습니다.`; }
/* 정규시즌이 끝난 다음 날: 1·2라운드 지명자의 1군 등록일수를 더하고, 두 시즌 안에 못 채우면 원소속 구단으로 돌려보낸다 */
/* 올해 원소속 구단이 아닌 곳에서 1군에 등록한 날. 등록 기록이 없는 옛 저장은 1군 경기 수로 어림한다(검수 11-09f: 전부 채운 것으로 보던 것) */
function sdRegN(p,o){ if(G.regTrk===G.year){ const R=p.regD&&p.regD.y===G.year?p.regD:null; if(!R)return 0;
    /* 구단 구분 없는 옛 기록(R.n, 구단별 기록을 시작한 뒤에는 그 전 몫 R.n0): 올해 원소속 구단을 거치지 않았으면 모두 다른 구단 몫. 다른 두 구단 사이 이적으로 0일이 되지 않게(검수 11-09ze) */
    const old=R.tm?(R.n0||0):R.n, home=(p.tLog||[]).some(x=>x.y===G.year&&G.cal&&x.d>=G.cal.open&&x.d<=G.cal.end&&(x.f===o.from||x.t===o.from));
    return (R.tm?Object.keys(R.tm).reduce((a,k)=>a+(+k===o.from?0:R.tm[k]||0),0):0)+(home?0:old); }
  /* shortcut: 투수 1경기=3일·야수 1경기=1.2일 어림. 옛 저장이 사라지면 지운다 */ return Math.round(p.hist.filter(h=>h.y===G.year&&!h.y2&&h.lvl==='1군'&&h.t!==o.from).reduce((a,h)=>a+(h.g||0)*(p.isP?3:1.2),0)); }
function sdObMark(p,o,v){ const S=sdRounds()[o.y]||(G.sd2&&G.sd2.y===o.y?G.sd2:null); const s=S&&S.seq.find(x=>x.pid===p.id); if(s){ s.ob=v; s.obN=Math.min(o.reg||0,o.need); } } /* 결과표에 의무 결과와 그때 등록일을 남긴다(지난 회차 포함, 검수 11-09ze) */
/* 끝난 회차 결과: 해마다 따로 보관한다. 새 회차가 열려도 지난 결과·의무 이력을 덮어쓰지 않는다(검수 11-09ze) */
function sdRounds(){ const o=Object.assign({},G.sd2h||{}); if(G.sd2&&G.sd2.stage==='done')o[G.sd2.y]=G.sd2; return o; }
function sdRegCheck(day){ if(!G.cal||day!==G.cal.end+1)return;
  for(const p of Object.values(G.players)){ const o=p.sd2; if(!o||o.y>=G.year||o.ly===G.year)continue; if(p.team==null||p.team===o.from){ o.reg+=sdRegN(p,o); delete p.sd2; sdObMark(p,o,o.reg>=o.need?'ok':p.team==null?'rel':'home'); continue; } /* 방출되거나 원소속으로 돌아가면 의무도 끝: 결과표에 사유를 남긴다(검수 11-09ze) */
    o.reg+=sdRegN(p,o); o.ly=G.year; o.to=p.team; /* 제3 구단으로 옮겨도 의무는 선수를 따라가 새 구단이 진다. 원소속 구단의 복귀 권리는 남는다(검수 11-09f) */
    if(o.reg>=o.need){ delete p.sd2; sdObMark(p,o,'ok'); continue; } if(G.year<o.y+2)continue; delete p.sd2;
    if(o.from===G.user&&!G.unemp){ sdObMark(p,o,'wait'); /* 복귀 결정 대기도 결과표에(검수 11-09ze) */ evNew('sd2back',`${p.name} 2차 드래프트 복귀 여부`,`${p.name}(${posLabel(p)}, ${p.age}세, 능력 ${dvo(p)})이(가) ${tname(o.to)}에서 의무 등록(두 시즌 1군 ${o.need}일)을 채우지 못했습니다. 원소속 구단으로서 복귀를 받을지 정해야 합니다.`,[{l:'복귀를 받는다',fx:`양도금 절반 ${money(Math.round(o.fee/2))}을(를) ${tshort(o.to)}에 돌려줍니다.`},{l:'받지 않는다',fx:'선수는 자유계약으로 풀립니다.'}],{def:0,exp:5,from:'운영팀',cat:'must',ref:p.id,data:{pid:p.id,o}}); continue; } /* 우리 구단으로 돌아오는 선수는 단장이 정한다 */
    sdBackDo(p,o,sdBackAI(p,o)); } } /* 야인이면 전 구단도 AI 기준(검수 11-09f) */
function sdBackDo(p,o,back){
  sdObMark(p,o,back?'back':'free');
  if(back){ const r=Math.round(o.fee/2); payOut(o.from,r,'comp'); payIn(o.to,r); { const keep=p.ctT===o.to; delete p.capB; delete p.roleProm; p.team=o.from; if(keep)p.ctT=o.from; else termsClear(p); } /* 지명 이적 때처럼 남은 계약 조건(옵션·거부권)은 이어진다(검수 11-06) */ p.listed=false; if(o.to===G.user&&G.lineup)for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k];
      story(p,`2차 드래프트 의무 등록(1군 ${o.need}일) 미달로 ${tname(o.from)} 복귀`,'move'); mvLog('2차 드래프트',p,o.to,o.from,`의무 등록 미달 복귀 · 양도금 반환 ${money(r)}`,r);
      if(o.to===G.user||o.from===G.user)note('드래프트',`${p.name}이(가) 2차 드래프트 의무 등록(두 시즌 1군 ${o.need}일)을 채우지 못해 ${tname(o.from)}(으)로 돌아갑니다. 양도금 절반 ${money(r)}을(를) ${tname(o.from)}이(가) 돌려줍니다.`,p.id); }
    else { const c=relCost(p).tot; payOut(o.to,c,'rel'); if(o.to===G.user&&G.lineup)for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; /* 일반 방출과 같은 보장계약 정산(검수 11-09f) */
      toFree(p,`2차 드래프트 의무 등록 미달 · ${tname(o.from)} 복귀 거부`,c,true); if(o.to===G.user)note('드래프트',`${p.name}이(가) 의무 등록을 채우지 못했고 ${tname(o.from)}이(가) 복귀를 원하지 않아 자유계약 선수가 됐습니다.${c?` 남은 보장계약 정산금 ${money(c)}을(를) 지급합니다.`:''}`,p.id); }
}
EVH.sd2back={ can(e,i){ return i===0&&rosterN(G.user)>=ROSTER_MAX?`정원 ${ROSTER_MAX}명이 꽉 차 복귀를 받을 수 없습니다. 선수를 한 명 정리한 뒤 다시 고르거나 '받지 않는다'를 고르세요.`:''; },
  pick(e,i){ const p=G.players[e.data.pid]; const o=e.data.o; if(!p||p.team!==o.to){sdObMark(p||{id:e.data.pid},o,p&&p.team===o.from?'home':!p||p.team==null?'rel':'moved');return '이미 정리된 일입니다.';} if(G.unemp){ const b=sdBackAI(p,o); e.pick=b?0:1; sdBackDo(p,o,b); return b?`${tname(o.from)}이(가) ${p.name}의 복귀를 받았습니다.`:`${tname(o.from)}이(가) 복귀를 받지 않아 ${p.name}은(는) 자유계약 선수가 됐습니다.`; } /* 야인이 된 뒤 기한이 지나면 전 구단(AI)이 평가해 정한다(검수 11-09f) */
    const full=i===0&&rosterN(G.user)>=ROSTER_MAX; if(full){ i=1; e.pick=1; } sdBackDo(p,o,i===0); return i===0?`${p.name}이(가) 돌아옵니다.`:full?`정원이 꽉 차 복귀를 받지 못했습니다. ${p.name}은(는) 자유계약 선수가 됐습니다.`:`${p.name}은(는) 자유계약 선수가 됐습니다.`; } };
function sd2Daily(day){ try{ sdRegCheck(day); }catch(e){}
  if(sdYear(G.year)&&day>=dnum(G.year,...SD_OPEN)&&!(G.sd2&&G.sd2.y===G.year)&&G.last&&G.last.y===G.year&&period()==='off')sdOpen();
  const S=G.sd2; if(!S||S.y!==G.year)return;
  if(S.stage==='protect'&&day>=S.exp)sdStart();
  else if(S.stage==='pick'&&S.wait===S.cur&&S.seq[S.cur].tid!==ME())sdRun(); /* 우리 차례에서 멈춘 뒤 이직: 전 구단 차례는 AI가 지명한다(검수 11-08d) */
  else if(S.stage==='pick'&&S.wait===S.cur&&day>S.exp){ /* '내일까지' 안내한 날까지는 고를 수 있다(검수 11-06) */ const s=S.seq[S.cur]; s.pass=true; note('드래프트',`2차 드래프트 ${s.rd}라운드 지명 기한이 지나 건너뛰었습니다.`); S.cur++; sdRun(); } }
