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
function sdExempt(p){ const y=G.year; return !!(p.foreign||p.ys||p.prospect||p.joinY>y||(p.draft?p.draft.y>=y-3:p.age<=21)||milServing(p)||(p.lastFA!=null&&p.lastFA>=y)); }
function sdPool(tid){ return Object.values(G.players).filter(p=>p.team===tid&&!sdExempt(p)); }
function sdProtAI(tid){ const t=team(tid); return sdPool(tid).sort((a,b)=>aiVal(t,b)-aiVal(t,a)).slice(0,SD_PROT).map(p=>p.id); }
function sdSeq(order){ const s=[]; for(let rd=1;rd<=SD_RD+SD_XRD;rd++)(rd<=SD_RD?order:order.slice(0,3)).forEach(tid=>s.push({rd,tid})); return s; }
function sdLost(tid){ return G.sd2.seq.filter(s=>s.pid&&s.from===tid).length; }
/* 지명 후보: 다른 구단의 보호명단 밖 선수. 이번 드래프트로 이미 옮긴 선수와 4명을 잃은 구단 선수는 뺀다 */
function sdCands(tid){ const S=G.sd2; const taken=new Set(S.seq.map(s=>s.pid).filter(Boolean)); /* 지명이 시작되면 보호명단은 확정: 후보 조회가 명단을 다시 짜지 않는다(검수 11-06). AI 명단은 지명 시작 때(sdStart) 한 번 새로 짠다 */
  return G.teams.filter(t=>t.id!==tid&&sdLost(t.id)<SD_LOSS).flatMap(t=>sdPool(t.id).filter(q=>!taken.has(q.id)&&!(S.prot[t.id]||[]).includes(q.id))); }
function sdOpen(){ const order=((G.last&&G.last.y===G.year&&G.last.order)||standingsNow()).map(x=>x.tid).reverse();
  const prot={}; for(const t of G.teams)if(t.id!==ME())prot[t.id]=sdProtAI(t.id);
  G.sd2={y:G.year,stage:'protect',exp:Math.max(dnum(G.year,...SD_DAY),G.day+5),order,prot,seq:sdSeq(order),cur:0};
  wire('2차 드래프트',`${G.year} KBO 2차 드래프트: 구단별 보호선수 ${SD_PROT}명 명단 제출`,{});
  if(G.unemp)return; const my=order.indexOf(G.user)+1;
  mail('운영팀',`${G.year} 2차 드래프트: 보호선수 ${SD_PROT}명을 정하세요`,`격년으로 열리는 2차 드래프트입니다. ${dmd(G.sd2.exp)}까지 보호선수 ${SD_PROT}명을 내면, 다른 구단이 명단 밖 선수를 지명해 데려갑니다(우리 구단에서는 최대 ${SD_LOSS}명).\n\n저절로 빠지는 선수: 외국인, 입단 1~3년 차, 육성선수, 군 보류, 이번 겨울 FA 계약.\n지명 순서는 지난 시즌 성적 역순이고 우리는 ${my}번째입니다${my<=3?'(하위 3개 구단이라 4·5라운드까지 최대 5명)':''}. 양도금은 1라운드 4억, 2라운드 3억, 3라운드 2억, 4라운드 이하 1억입니다.`,{imp:true,kind:'드래프트',acts:[{l:'보호명단 정하기',a:'go',v:'transfer:kbo'}]});
  mail(FROM['드래프트']||'프런트',`2차 드래프트 보호선수 ${SD_PROT}명을 정하세요`,`2차 드래프트 보호선수 ${SD_PROT}명을 정하세요. ${dmd(G.sd2.exp)}에 지명이 시작되며, 그 전날까지 고칠 수 있습니다.`,{imp:true,kind:'드래프트',acts:[{l:'보호명단 정하기',a:'go',v:'transfer:kbo'}]}); } /* 요약 알림도 웨이버·2차 드래프트 화면으로(검수 11-07: 신인 드래프트로 감) */
function sdSubmit(ids){ const S=G.sd2; if(!S||S.stage!=='protect'||G.unemp)return '보호선수 명단을 낼 때가 아닙니다.'; const pool=new Set(sdPool(G.user).map(q=>q.id));
  const L=[...new Set(ids)].filter(x=>pool.has(x)).slice(0,SD_PROT); if(!L.length&&pool.size)return `보호선수를 한 명 이상 고르세요. 내지 않으면 ${dmd(S.exp)}에 운영팀이 대신 정합니다.`; /* 빈 명단은 제출로 보지 않는다(검수 11-06) */ S.prot[G.user]=L; S.sub=true; return `보호선수 ${S.prot[G.user].length}명 명단을 냈습니다. ${dmd(S.exp)}에 지명이 시작됩니다. 그 전까지는 고칠 수 있습니다.`; }
function sdStart(){ const S=G.sd2; for(const t of G.teams)if(t.id!==ME())S.prot[t.id]=sdProtAI(t.id); /* 보호 기간에 바뀐 AI 선수단을 반영해 지명 시작 때 확정 */ if(!S.prot[G.user]&&!G.unemp){ S.prot[G.user]=sdProtAI(G.user); note('드래프트','2차 드래프트 보호선수 명단을 운영팀이 능력 순으로 냈습니다.'); }
  S.stage='pick'; sdRun(); }
function sdAiPick(tid,rd){ if(rosterN(tid)>=ROSTER_MAX)return null; const t=team(tid); if((t.cash||0)<sdFee(rd))return null; /* 양도금을 낼 현금(검수 11-07) */ let best=null,bv=-1e9; for(const q of sdCands(tid)){ if(capPayAs(tid,[q.id],[])>capOf(sponSeason())*aiCapMul(t))continue; /* 다음 시즌 샐러리캡 안에서만 */ const v=aiVal(t,q); if(v>bv){ bv=v; best=q; } } return best&&bv>=sdFee(rd)/100?best.id:null; }
function sdTake(s,pid){ const q=G.players[pid]; const from=q.team, fee=sdFee(s.rd); const keep=q.ctT===from; delete q.capB; delete q.roleProm; q.team=s.tid; if(keep)q.ctT=s.tid; else termsClear(q); /* 계약은 이어진다: 성과 옵션·구단 옵션·옵트아웃·거부권도 승계(계약금 상한 반영·주전 약속은 원구단 몫) */ q.listed=false; if(from===G.user&&G.lineup)for(const k in G.lineup)if(G.lineup[k]===pid)delete G.lineup[k];
  payOut(s.tid,fee,'comp'); payIn(from,fee); Object.assign(s,{pid,from,fee,nm:q.name});
  if(s.rd<=SD_REG.length)q.sd2={y:G.year,rd:s.rd,from,to:s.tid,fee,need:SD_REG[s.rd-1],reg:0};
  story(q,`${G.year} 2차 드래프트 ${s.rd}라운드로 ${tname(s.tid)} 이적`,'move'); acqStamp(q,'2차 드래프트',s.tid,{rd:s.rd}); mvLog('2차 드래프트',q,from,s.tid,`${s.rd}라운드 · 양도금 ${money(fee)}`,fee);
  wire('2차 드래프트',`${tshort(s.tid)}, ${s.rd}라운드 ${q.name}(${posLabel(q)}, 전 ${tshort(from)}) 지명`,{tid:s.tid,ref:pid});
  if(from===G.user)note('드래프트',`2차 드래프트: ${tname(s.tid)}이(가) ${s.rd}라운드로 ${q.name}을(를) 데려갔습니다. 양도금 ${money(fee)}을(를) 받습니다.`,pid); }
/* 우리 차례에서 멈춘다. quiet: 화면에서 지명한 직후라 따로 알리지 않는다 */
function sdRun(quiet){ const S=G.sd2; if(!S||S.stage!=='pick')return;
  while(S.cur<S.seq.length){ const s=S.seq[S.cur];
    if(s.tid===ME()){ if(rosterN(s.tid)<ROSTER_MAX&&sdCands(s.tid).length){ if(S.wait!==S.cur){ S.wait=S.cur; S.exp=G.day+1; if(!quiet)stop('드래프트',`2차 드래프트 ${s.rd}라운드, 우리 차례입니다. 지명하거나 건너뛰세요(내일까지 정하지 않으면 건너뜁니다).`); } return; } }
    else { const id=sdAiPick(s.tid,s.rd); if(id)sdTake(s,id); }
    if(!s.pid)s.pass=true; S.cur++; }
  S.stage='done'; S.done=G.day; const P=S.seq.filter(s=>s.pid);
  news('드래프트',`${G.year} 2차 드래프트 ${P.length}명 이동`,P.length?P.map(s=>`${s.rd}라운드 ${tshort(s.tid)}: ${s.nm}(전 ${tshort(s.from)})`).join('\n'):'지명된 선수가 없습니다.',0);
  if(!G.unemp){ const got=P.filter(s=>s.tid===G.user), lost=P.filter(s=>s.from===G.user); note('드래프트',`2차 드래프트가 끝났습니다. 데려온 선수 ${got.length}명${got.length?`(${got.map(s=>s.nm).join(', ')})`:''}, 내준 선수 ${lost.length}명${lost.length?`(${lost.map(s=>s.nm).join(', ')})`:''}.`); } }
function sdPick(pid){ const S=G.sd2; if(!S||S.stage!=='pick')return '2차 드래프트 지명 시간이 아닙니다.'; const s=S.seq[S.cur]; if(!s||s.tid!==G.user)return '우리 차례가 아닙니다.';
  if(pid!=null){ if(rosterN(G.user)>=ROSTER_MAX)return `정식 선수가 ${ROSTER_MAX}명으로 꽉 찼습니다.`; if(!sdCands(G.user).some(q=>q.id===pid))return '지명할 수 없는 선수입니다(보호선수이거나 원소속 구단이 이미 4명을 잃음).'; sdTake(s,pid); } else s.pass=true;
  S.cur++; sdRun(true); return pid!=null?`${s.rd}라운드에서 ${G.players[pid].name}을(를) 지명했습니다. 양도금 ${money(s.fee)}.`:`${s.rd}라운드 지명을 건너뛰었습니다.`; }
/* 정규시즌이 끝난 다음 날: 1·2라운드 지명자의 1군 등록일수를 더하고, 두 시즌 안에 못 채우면 원소속 구단으로 돌려보낸다 */
function sdRegCheck(day){ if(!G.cal||day!==G.cal.end+1)return;
  for(const p of Object.values(G.players)){ const o=p.sd2; if(!o||o.y>=G.year)continue; if(p.team!==o.to){ delete p.sd2; continue; }
    o.reg+=G.regTrk===G.year?regNT(p,o.to):o.need; /* 지명 구단에서 등록한 날만 */ /* 시즌 중 불러온 옛 저장은 등록일수를 몰라 채운 것으로 본다 */
    if(o.reg>=o.need){ delete p.sd2; continue; } if(G.year<o.y+2)continue; delete p.sd2;
    if(o.from===G.user&&!G.unemp){ evNew('sd2back',`${p.name} 2차 드래프트 복귀 여부`,`${p.name}(${posLabel(p)}, ${p.age}세, 능력 ${dvo(p)})이(가) ${tname(o.to)}에서 의무 등록(두 시즌 1군 ${o.need}일)을 채우지 못했습니다. 원소속 구단으로서 복귀를 받을지 정해야 합니다.`,[{l:'복귀를 받는다',fx:`양도금 절반 ${money(Math.round(o.fee/2))}을(를) ${tshort(o.to)}에 돌려줍니다.`},{l:'받지 않는다',fx:'선수는 자유계약으로 풀립니다.'}],{def:0,exp:5,from:'운영팀',ref:p.id,data:{pid:p.id,o}}); continue; } /* 우리 구단으로 돌아오는 선수는 단장이 정한다 */
    sdBackDo(p,o,rosterN(o.from)<ROSTER_MAX&&(o.from===ME()||aiVal(team(o.from),p)>=0)); } }
function sdBackDo(p,o,back){
  if(back){ const r=Math.round(o.fee/2); payOut(o.from,r,'comp'); payIn(o.to,r); { const keep=p.ctT===o.to; delete p.capB; delete p.roleProm; p.team=o.from; if(keep)p.ctT=o.from; else termsClear(p); } /* 지명 이적 때처럼 남은 계약 조건(옵션·거부권)은 이어진다(검수 11-06) */ p.listed=false; if(o.to===G.user&&G.lineup)for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k];
      story(p,`2차 드래프트 의무 등록(1군 ${o.need}일) 미달로 ${tname(o.from)} 복귀`,'move'); mvLog('2차 드래프트',p,o.to,o.from,`의무 등록 미달 복귀 · 양도금 반환 ${money(r)}`,r);
      if(o.to===G.user||o.from===G.user)note('드래프트',`${p.name}이(가) 2차 드래프트 의무 등록(두 시즌 1군 ${o.need}일)을 채우지 못해 ${tname(o.from)}(으)로 돌아갑니다. 양도금 절반 ${money(r)}을(를) ${tname(o.from)}이(가) 돌려줍니다.`,p.id); }
    else { toFree(p,`2차 드래프트 의무 등록 미달 · ${tname(o.from)} 복귀 거부`,0,true); if(o.to===G.user)note('드래프트',`${p.name}이(가) 의무 등록을 채우지 못했고 ${tname(o.from)}이(가) 복귀를 원하지 않아 자유계약 선수가 됐습니다.`,p.id); }
}
EVH.sd2back={ can(e,i){ return i===0&&rosterN(G.user)>=ROSTER_MAX?`정원 ${ROSTER_MAX}명이 꽉 차 복귀를 받을 수 없습니다. 선수를 한 명 정리한 뒤 다시 고르거나 '받지 않는다'를 고르세요.`:''; },
  pick(e,i){ const p=G.players[e.data.pid]; const o=e.data.o; if(!p||p.team!==o.to)return '이미 정리된 일입니다.'; const full=i===0&&rosterN(G.user)>=ROSTER_MAX; if(full){ i=1; e.pick=1; } sdBackDo(p,o,i===0); return i===0?`${p.name}이(가) 돌아옵니다.`:full?`정원이 꽉 차 복귀를 받지 못했습니다. ${p.name}은(는) 자유계약 선수가 됐습니다.`:`${p.name}은(는) 자유계약 선수가 됐습니다.`; } };
function sd2Daily(day){ try{ sdRegCheck(day); }catch(e){}
  if(sdYear(G.year)&&day>=dnum(G.year,...SD_OPEN)&&!(G.sd2&&G.sd2.y===G.year)&&G.last&&G.last.y===G.year&&period()==='off')sdOpen();
  const S=G.sd2; if(!S||S.y!==G.year)return;
  if(S.stage==='protect'&&day>=S.exp)sdStart();
  else if(S.stage==='pick'&&S.wait===S.cur&&day>S.exp){ /* '내일까지' 안내한 날까지는 고를 수 있다(검수 11-06) */ const s=S.seq[S.cur]; s.pass=true; note('드래프트',`2차 드래프트 ${s.rd}라운드 지명 기한이 지나 건너뛰었습니다.`); S.cur++; sdRun(); } }
