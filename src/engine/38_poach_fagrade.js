/* ===== 다른 구단 코치 빼 오기 ===== */
const PROMO={fp:'pc',fb:'bc',fm:'hc',pc:'hc',bc:'hc',cc:'hc',rc:'hc',dc:'hc'};
function poachOff(){ const per=period(); return per!=='season'&&per!=='post'; }
function poachTerms(tid,role,toRole){ const c=G.coach&&G.coach[tid]&&G.coach[tid][role]; if(!c)return null; const promo=toRole!==role; const sal=round5(c.sal*(promo?1.15:1.35));
  const comp=poachOff()&&c.yrs<=1?0:Math.round(c.sal*Math.max(.5,c.yrs-(poachOff()?1:.5))*.5); const m=G.mgr[tid]; const clan=!!(c.clan&&m&&c.clan===m.id);
  let ch=.42+(promo?.25:0)-(clan?.35:0)-(c.yrs>=2&&!poachOff()?.08:0); const ur=uRank(); const st=standingsNow(); const tr=st.findIndex(x=>x.tid===tid)+1; if(period()==='season'&&tr>0)ch+=(tr-ur)*.015;
  const um=G.mgr[G.user]; if(um&&!um.interim&&um.fame>=70)ch+=.06; const ob=c.ob&&G.ob?G.ob.find(o=>o.id===c.ob):null; if(ob&&ob.mine)ch+=.2+Math.min(.1,ob.bond/200);
  if(team(tid).rel<35)ch-=.1; return {c,sal,comp,promo,clan,chance:clamp(ch,.05,.9),toRole}; }
function poachCoach(tid,role,toRole){ if(!G.coach||tid===G.user)return '대상이 아닙니다.'; const T=poachTerms(tid,role,toRole); if(!T)return '그 자리에 코치가 없습니다.'; const c=T.c; G.poachCd=G.poachCd||{};
  if(G.poachCd[c.id]>G.day)return `${c.name} 코치는 ${dmd(G.poachCd[c.id])}까지 다시 만나 주지 않습니다.`; const t=team(tid);
  if(R()>=T.chance){ G.poachCd[c.id]=G.day+30; t.rel=clamp(t.rel-1,0,100); return `${c.name} 코치가 제의를 거절했습니다. "${T.clan?`${G.mgr[tid].name} 감독님을 두고 갈 수 없습니다`:'지금 팀에서 하던 일을 마무리하고 싶습니다'}." (${tshort(tid)} 단장 친분 -1)`; }
  const C=G.coach[G.user]; const old=C[toRole]; if(old){ const pay=Math.round(old.sal*Math.max(0,old.yrs-.5)*.5); G.spend.coach=(G.spend.coach||0)+pay; addLog(`${CROLE[toRole].l} ${old.name}와(과) 결별했습니다(잔여 연봉 정산 ${money(pay)}).`); old.yrs=0; old.clan=null; G.cmarket.push(old); }
  if(T.comp){ G.spend.coach=(G.spend.coach||0)+T.comp; t.cash+=T.comp; }
  G.coach[tid][role]=null; const rep=obAiCoach(tid,role)||mkCoach(role); if(!rep.yrs)rep.yrs=ri(1,3); G.coach[tid][role]=rep;
  c.role=toRole; c.sal=T.sal; c.yrs=2; c.clan=null; c.from=tid; C[toRole]=c; t.rel=clamp(t.rel-(T.comp?2:4),0,100); obHireBonus(c.ob,CROLE[toRole].l);
  wire('코치',`${tshort(G.user)}, ${tshort(tid)} ${CROLE[role].l} ${c.name} 영입${T.promo?` (${CROLE[toRole].l} 승격)`:''}`,{tid}); addLog(`${tname(tid)}에서 ${c.name} 코치를 ${CROLE[toRole].l}로 데려왔습니다. 연 ${money(T.sal)}${T.comp?` · 보상금 ${money(T.comp)}`:''}.`);
  return `${c.name} 코치가 ${CROLE[toRole].l}로 합류합니다. 연 ${money(T.sal)} 2년${T.comp?`, ${tshort(tid)}에 보상금 ${money(T.comp)}`:''}. ${tshort(tid)} 단장 친분 -${T.comp?2:4}.`; }

/* ===== FA 등급제 (2021 FA부터): 최근 3년 연봉의 구단 내·리그 순위, 나이, FA 횟수로 정한다 =====
   순위를 셀 때 기존 FA 계약 선수는 빼고, 2025년 1월 이사회 개정으로 비FA 다년계약 선수도 뺀다(계약 마지막 해에는 포함).
   보상: A 직전 연봉 200%+보호 20인 외 1명 또는 300%, B 100%+보호 25인 외 1명 또는 200%, C 150%(선수 없음) */
function avgSal3(p){ const H=(p.salH||[]).slice(-3); return H.length?avg(H.map(x=>x.s)):p.sal; }
function faGradeOf(p,all,snap){ if(p.age>=35)return 'C'; const n=p.faN||(p.lastFA!=null?1:0); if(n>=2)return 'C'; if(n===1)return p.faPrevGrade==='C'?'C':'B';
  const gs=q=>avgSal3(q); const S=q=>(snap&&snap.get(q.id))||q; /* snap: 스토브리그 시작 때 상태(먼저 선언한 동료도 원래 구단에 있는 것으로 센다) */
  const D=all.filter(q=>{ const z=S(q); return !q.foreign&&(q.id===p.id||!(z.faC&&!z.ext)&&!(z.ext&&z.faC&&(z.yrs||0)>1)); }); const v=gs(p); const myT=S(p).team; const lg=D.filter(q=>gs(q)>v).length+1; const tm=D.filter(q=>S(q).team===myT&&gs(q)>v).length+1; p.faRank={lg,tm};
  if(tm<=3&&lg<=30)return 'A'; if(tm<=10&&lg<=60)return 'B'; return 'C'; }
/* 실제 KBO는 소속선수 65명 중 A 20명·B 25명을 보호한다. 이 게임 등록 상한은 40명이라 같은 비율(약 31%·38%)로 줄인다 */
const COMP={A:{prot:20,kbo:20,withP:2,cash:3},B:{prot:25,kbo:25,withP:1,cash:2},C:{prot:0,kbo:0,withP:0,cash:1.5}};
/* 보호선수에서 저절로 빠지는 선수: 외국인, 올해 신인·입단 예정, 군 복무 중, 이번 겨울 FA로 계약한 선수 */
function autoProt(q){ return !!(q.foreign||q.joinY>G.year||(q.draft&&q.draft.y>=G.year)||isAway(q)||q.lastFA===G.year); }
function compPool(tid){ return domestic(tid).concat(awayOf(tid).filter(q=>!q.foreign)).filter(q=>!autoProt(q)); }
function aiProtect(tid,n){ const t=team(tid); return compPool(tid).sort((a,b)=>aiVal(t,b)-aiVal(t,a)).slice(0,n).map(q=>q.id); }
/* 우리 구단의 일회성 현금 지출·수입은 결산 장부(G.spend)에 올려 예산 여유와 결산에 함께 반영한다 */
function payOut(tid,amt,key){ if(!amt)return; if(tid===G.user){ G.spend[key]=(G.spend[key]||0)+amt; } else team(tid).cash-=amt; }
function payIn(tid,amt){ if(!amt)return; if(tid===G.user){ G.spend.compIn=(G.spend.compIn||0)+amt; } else team(tid).cash+=amt; }
function compStart(p,from,to,rec){ const g=COMP[p.faGrade]; const prev=p.faPrevSal;
  if(p.faGrade==='C'){ const cash=Math.round(prev*1.5); payOut(to,cash,'comp'); payIn(from,cash); rec.compCash=cash; return; }
  const c={id:'cp'+(G.compSeq=(G.compSeq||0)+1),pid:p.id,name:p.name,grade:p.faGrade,from,to,prev,day:G.day,stage:'protect',exp:G.day+3,prot:null,rec:rec.id,_rec:rec};
  (G.comp=G.comp||[]).unshift(c); if(G.comp.length>30)G.comp.length=30;
  if(to!==G.user){ c.prot=aiProtect(to,g.prot); c.stage='pick'; c.exp=G.day+3;
    if(from!==G.user){ compAiPick(c); return; }
    mail('운영팀',`보상선수 지명: ${tname(to)} 보호명단 도착`,`${p.name}(${p.faGrade}등급)을 데려간 ${tname(to)}이(가) 보호선수 ${g.prot}명 명단을 보냈습니다. 명단 밖 선수 1명과 직전 연봉 ${g.withP*100}%(${money(prev*g.withP)})를 받거나, 선수 없이 ${g.cash*100}%(${money(prev*g.cash)})를 받을 수 있습니다. ${dmd(c.exp)}까지 정하세요.`,{imp:true,kind:'FA',acts:[{l:'보상선수 고르기',a:'go',v:'trade:fa'}]}); stop('FA',`${tname(to)}의 보호선수 명단이 왔습니다. 보상선수를 고르세요.`); return; }
  mail('운영팀',`보호선수 명단 제출: ${p.name} 영입 보상`,`${p.name}(${p.faGrade}등급) 영입으로 ${tname(from)}에 보상해야 합니다. 보호선수 ${g.prot}명을 정해 ${dmd(c.exp)}까지 제출하세요. 외국인, 올해 신인, 군 복무 중인 선수, 이번 겨울 FA 계약 선수는 저절로 보호됩니다. ${tname(from)}은(는) 명단 밖에서 1명을 데려가거나 돈으로 받습니다.`,{imp:true,kind:'FA',acts:[{l:'보호명단 정하기',a:'go',v:'trade:fa'}]}); stop('FA',`${p.name} 영입 보상: 보호선수 ${g.prot}명을 정하세요.`); }
function compAiPick(c){ const g=COMP[c.grade]; const ft=team(c.from); const cand=compPool(c.to).filter(q=>!c.prot.includes(q.id)).sort((a,b)=>aiVal(ft,b)-aiVal(ft,a)); const best=cand[0];
  const cashDiff=c.prev*(g.cash-g.withP)/100; return compResolve(c,best&&aiVal(ft,best)>=Math.max(.8,cashDiff*.15)?best.id:null); }
function compResolve(c,pid){ const g=COMP[c.grade]; const mult=pid?g.withP:g.cash; const cash=Math.round(c.prev*mult); payOut(c.to,cash,'comp'); payIn(c.from,cash); c.cash=cash; c.stage='done'; c.done=G.day;
  const R0=c._rec||(G.fa&&G.fa.results||[]).find(r=>r.id===c.pid&&r.to===c.to); delete c._rec; if(R0)R0.compCash=cash;
  if(pid){ const q=G.players[pid]; q.team=c.from; q.faC=false; q.ext=false; q.yrs=0; q.listed=false; for(const k in G.lineup)if(G.lineup[k]===q.id)delete G.lineup[k]; story(q,`FA ${c.name} 보상선수로 ${tname(c.from)} 이적`,'move'); mvLog('보상선수',q,c.to,c.from,`FA ${c.name} 보상`); c.player=q.name; c.cpid=q.id; if(R0)R0.compPlayer=q.name;
    wire('FA',`${tname(c.from)}, ${c.name} 보상선수로 ${tname(c.to)} ${q.name}(${posLabel(q)}) 지명`,{tid:c.from,ref:q.id}); }
  else wire('FA',`${tname(c.from)}, ${c.name} 보상으로 선수 대신 현금 ${money(cash)}`,{tid:c.from});
  if(c.from===G.user)note('FA',pid?`보상선수로 ${G.players[pid].name}을(를) 지명했습니다. 보상금 ${money(cash)}.`:`선수 대신 보상금 ${money(cash)}을(를) 받았습니다.`,pid);
  if(c.to===G.user)note('FA',pid?`${tname(c.from)}이(가) 보상선수로 ${G.players[pid].name}을(를) 데려갔습니다. 보상금 ${money(cash)}.`:`${tname(c.from)}이(가) 선수 대신 보상금 ${money(cash)}을(를) 받았습니다.`,pid);
  return c; }
function compSubmit(id,prot){ const c=(G.comp||[]).find(x=>x.id===id); if(!c||c.stage!=='protect'||c.to!==G.user)return '처리할 명단이 없습니다.'; const g=COMP[c.grade]; const pool=compPool(G.user).map(q=>q.id); const P=prot.filter(x=>pool.includes(x)).slice(0,g.prot);
  c.prot=P; c.stage='pick'; compAiPick(c); return c.player?`${tname(c.from)}이(가) ${c.player}을(를) 지명했습니다.`:`${tname(c.from)}이(가) 선수 대신 보상금을 택했습니다.`; }
function compAuto(c){ if(c.stage==='protect'&&c.to===G.user){ compSubmit(c.id,aiProtect(G.user,COMP[c.grade].prot)); note('FA','보호선수 명단을 운영팀이 능력 순으로 제출했습니다.'); }
    else if(c.stage==='pick'&&c.from===G.user){ const ft=team(G.user); const best=compPool(c.to).filter(q=>!c.prot.includes(q.id)).sort((a,b)=>aiVal(ft,b)-aiVal(ft,a))[0]; compResolve(c,best?best.id:null); } }
function compDaily(){ for(const c of (G.comp||[])){ if(c.stage==='done'||G.day<c.exp)continue; compAuto(c); } }
