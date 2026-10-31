/* ===== 감독이 먼저 하는 요청: 보강·정리·외국인 교체·FA·드래프트 ===== */
const MREQK={slot:'보강 요청',out:'정리 요청',frep:'외국인 교체 요청',fa:'FA 영입 요청',draft:'드래프트 기조 추천'};
function mreqs(){ return G.mreq=G.mreq||[]; }
function mreqOpen(k){ return mreqs().filter(r=>r.st==='open'&&(!k||r.k===k)); }
function mreqAdd(k,data,until){ const r={id:'r'+(G.mreqSeq=(G.mreqSeq||0)+1),k,day:G.day,y:G.year,until,data,st:'ask',mid:(G.mgr[G.user]||{}).id,tid:G.user}; mreqs().unshift(r); if(G.mreq.length>40)G.mreq.length=40; return r; }
function mgrSays(m){ return `${m.name} 감독`; }
function mreqAsk(r,title,sit,opts,def,face){ const m=G.mgr[G.user]; evNew('mreq',title,sit,opts,{from:'감독실',face:null,ref:face??null,data:{rid:r.id},def:def??opts.length-1,exp:7}); }
const DPOL={P:'투수 위주',C:'포수',IF:'내야수',OF:'외야수',HS:'고졸 유망주',COL:'대졸 즉시 전력'};
function draftFit(p,k){ if(!k||!p)return false; return k==='P'?p.isP:k==='C'?p.pos==='C':k==='IF'?['1B','2B','3B','SS'].includes(p.pos)&&!p.isP:k==='OF'?['LF','CF','RF'].includes(p.pos)&&!p.isP:k==='HS'?!p.college:k==='COL'?p.college:false; }
/* 매주: 새 요청을 꺼내고, 진행 중인 요청을 점검한다 */
function mreqWeek(){ const m=G.mgr[G.user]; if(!m||m.interim||G.gameOver||G.unemp)return; mgrFix(m); mreqCheck();
  const per=period(); const open=mreqs().filter(r=>r.st==='open'||r.st==='ask'); if(open.length>=2)return;
  const recent=mreqs().filter(r=>r.day>G.day-28).length; if(recent)return;
  const C=[];
  if(per==='season'&&tradeOpen()&&!open.some(r=>r.k==='slot')&&!mreqs().some(r=>r.k==='slot'&&r.day>G.day-50)){ const rk=slotRanks(G.user); const w=PSLOTS.filter(k=>k!=='DH').map(k=>({k,r:rk[k].rank})).sort((a,b)=>b.r-a.r)[0];
    if(w&&w.r>=8)C.push(['slot',w,1.2+(m.ego-50)/60]); }
  if(per==='season'&&G.day>G.cal.open+25&&!open.some(r=>r.k==='out')){ const bad=domestic(G.user).filter(p=>{ if(p.ys||p.age<29)return false; const h=seasonTotal(p,G.year,'1군'); if(!h)return false; return p.isP?(h.outs>=60&&pRate(h).era>6):(h.pa>=90&&bRate(h).ops<.600); }).sort((a,b)=>b.sal-a.sal)[0]; if(bad&&!mreqs().some(r=>r.k==='out'&&r.data.pid===bad.id))C.push(['out',bad,.8+(m.disc-50)/80]); }
  if(per==='season'&&G.day<=foreignDL()&&fReplLeft(G.user)>0&&!open.some(r=>r.k==='frep')){ const f=foreignOf(G.user).find(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=90&&pRate(h).era>5.4):(h.pa>=130&&bRate(h).ops<.690)); }); if(f)C.push(['frep',f,1]); }
  if(G.day>=KD(8,20)&&G.day<KD(9,10)&&!mreqs().some(r=>r.k==='draft'&&r.y===G.year))C.push(['draft',null,3]);
  if(G.fa&&G.fa.open&&!G.fa.closed&&!mreqs().some(r=>r.k==='fa'&&r.y===G.year))C.push(['fa',null,3]);
  if(!C.length||R()>.45)return; let x=R()*sum(C.map(c=>Math.max(.2,c[2]))); for(const c of C){ x-=Math.max(.2,c[2]); if(x<=0){ mreqMake(c[0],c[1]); return; } } }
function mreqMake(k,d){ const m=G.mgr[G.user]; const nm=mgrSays(m);
  if(k==='slot'){ if(G.day-(G.mgrReqD??-99)<45)return; G.mgrReqD=G.day; const sk=d.k; const cur=slotRanks(G.user)[sk]; const rv=cur.v;
    const cands=Object.values(G.players).filter(p=>p.team!=null&&p.team!==G.user&&!p.foreign&&!p.ys&&!(p.joinY>G.year)&&pSlot(p)===sk&&ovr(p)>=rv+4&&healthy(p)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,8);
    const t=cands.find(p=>{ try{ return findPackages(p.id).length>0; }catch(e){ return false; } })||null; const until=Math.min(G.day+30,tradeDL());
    const r=mreqAdd('slot',{sk,rank:d.r,v:rv,target:t?t.id:null},until);
    mreqAsk(r,`${nm}: ${SLOTK[sk]} 보강 요청`,`"${SLOTK[sk]} 자리가 리그 ${d.r}위입니다. 이대로는 버티기 어렵습니다.${t?` ${tname(t.team)}의 ${t.name}(${posLabel(t)}, ${t.age}세) 같은 선수가 필요합니다.`:''}" ${dmd(until)}까지 ${SLOTK[sk]}을(를) 보강해 달라고 합니다.`,
      [{l:'알겠다, 보강하겠다',fx:`${dmd(until)}까지 ${SLOTK[sk]} 자리에 지금보다 나은 선수를 데려오면 감독 관계 +6. 못 하면 -5.`},{l:'지금 전력으로 간다',fx:`감독 관계 -${m.ego>=70?5:3}.`}],1,t?t.id:null); return; }
  if(k==='out'){ const p=d; const h=seasonTotal(p,G.year,'1군'); const r=mreqAdd('out',{pid:p.id},G.day+30);
    mreqAsk(r,`${nm}: ${p.name} 정리 요청`,`"${p.name}은(는) ${statLine(h,p)}입니다. 엔트리 한 자리가 아깝습니다. 정리하고 그 자리를 다른 선수에게 주고 싶습니다." 연봉 ${money(p.sal)}${p.faC?` · 잔여 ${p.yrs}년`:''}.`,
      [{l:'트레이드 매물로 내놓는다',fx:'30일 안에 내보내면 감독 관계 +4. 매물로 내놓기만 해도 감독은 일단 받아들입니다.'},{l:'방출한다',fx:`바로 정리합니다. ${p.faC?`남은 연봉 절반(${money(Math.round(p.sal*p.yrs*.5))})을 지급합니다. `:''}감독 관계 +4, 선수단 분위기 조금 하락.`},{l:'더 기회를 준다',fx:`감독 관계 -${m.ego>=70?5:3}. 선수 기분은 오릅니다.`}],2,p.id); return; }
  if(k==='frep'){ const p=d; const alt=(G.fwatch||[]).map(w=>G.players[w.id]).filter(q=>q&&q.isP===p.isP&&q.foreign===p.foreign); const r=mreqAdd('frep',{pid:p.id},G.day+21);
    mreqAsk(r,`${nm}: 외국인 ${p.name} 교체 요청`,`"${p.name}로는 안 됩니다. 시즌을 포기할 수 없으니 바꿔 주십시오."${alt.length?` 관찰 명단의 ${alt.map(q=>q.name).join(', ')}을(를) 언급합니다.`:' 관찰 명단에 같은 유형 후보가 없습니다.'}`,
      [{l:'교체를 추진한다',fx:'21일 안에 교체하면 감독 관계 +5. 못 하면 -4.'},{l:'좀 더 지켜본다',fx:'감독 관계 -3.'}],1,p.id); return; }
  if(k==='fa'){ const rk=slotRanks(G.user); const weak=PSLOTS.filter(s=>s!=='DH').sort((a,b)=>rk[b].rank-rk[a].rank).slice(0,3);
    const pool=G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&weak.includes(pSlot(p))).sort((a,b)=>ovr(b)-ovr(a)); const p=pool[0]; if(!p)return;
    const o=dobj(G.day); const close=o.m<=2?KD(1,23):dnum(G.year+1,1,23); if(!G.fa||G.fa.closed||close-G.day<7)return;
    const r=mreqAdd('fa',{pid:p.id},Math.min(close,G.day+21)); const b=budget();
    mreqAsk(r,`${nm}: FA ${p.name} 영입 요청`,`"${SLOTK[pSlot(p)]}이(가) 우리 약점입니다. FA ${p.name}(${posLabel(p)}, ${p.age}세)만 잡아 주시면 내년은 다르게 싸울 수 있습니다." 선수 요구는 ${p.ask.years}년 연 ${money(p.ask.annual)}, 우리 예산 여유는 ${money(b.roomGoal)}입니다.`,
      [{l:'영입에 나서겠다',fx:'FA 시장이 닫히기 전에 잡으면 감독 관계 +7. 다른 팀에 뺏기면 -4.'},{l:'예산상 어렵다',fx:'감독 관계 -2. 감독도 사정은 압니다.'}],1,p.id); return; }
  if(k==='draft'){ const ps=playersOf(G.user); const pit=ps.filter(p=>p.isP).length; const C=ps.filter(p=>p.pos==='C'&&!p.isP).length; const rk=slotRanks(G.user);
    let pol=m.youth>=62?'HS':teamCtx(team(G.user)).contend?'COL':'HS'; if(pit<15||rk.SP.rank>=7)pol='P'; else if(C<3||rk.C.rank>=8)pol='C'; else if(['2B','SS','3B'].some(s=>rk[s].rank>=8))pol='IF'; else if(['LF','CF','RF'].some(s=>rk[s].rank>=8))pol='OF';
    const why={P:`투수가 ${pit}명뿐이고 선발진이 리그 ${rk.SP.rank}위입니다`,C:`포수가 ${C}명이고 포수 자리가 리그 ${rk.C.rank}위입니다`,IF:'내야가 약합니다',OF:'외야가 약합니다',HS:'당장보다 몇 년 뒤를 봐야 합니다',COL:'바로 쓸 선수가 필요합니다'}[pol];
    const r=mreqAdd('draft',{pol},G.cal.draft+1);
    mreqAsk(r,`${nm}: 드래프트는 ${DPOL[pol]}(으)로`,`"${why}. 이번 드래프트는 ${DPOL[pol]}(으)로 가 주셨으면 합니다." 스카우트팀 판단과는 다를 수 있습니다.`,
      [{l:'감독 의견대로 간다',fx:`드래프트 화면에 "감독 추천" 표시가 붙습니다. 1·2라운드에서 이 기조 선수를 뽑으면 감독 관계 +4.`},{l:'스카우트 판단을 따른다',fx:'감독 관계 -1. 감독은 크게 개의치 않습니다.'}],0); return; } }
EVH.mreq={ pick(e,i){ const r=mreqs().find(x=>x.id===e.data.rid); const m=G.mgr[G.user]; if(!r||!m)return ''; const L=e.opts.length;
    const neg=d=>{ m.rel=clamp(m.rel-d,0,100); return `감독 관계 -${d}.`; };
    if(r.k==='slot'){ if(i===0){ r.st='open'; return `${dmd(r.until)}까지 ${SLOTK[r.data.sk]} 보강을 약속했습니다.`; } r.st='no'; return neg(m.ego>=70?5:3); }
    if(r.k==='out'){ const p=G.players[r.data.pid]; if(!p||p.team!==G.user){ r.st='done'; return ''; }
      if(i===0){ p.listed=true; p.mor=clamp((p.mor??60)-4,0,100); r.st='open'; m.rel=clamp(m.rel+1,0,100); return `${p.name}을(를) 트레이드 매물로 내놓았습니다. 감독 관계 +1.`; }
      if(i===1){ const nm=p.name; releasePlayer(p.id); r.st='done'; m.rel=clamp(m.rel+4,0,100); for(const q of playersOf(G.user))q.mor=clamp((q.mor??60)-1,0,100); return `${nm}을(를) 방출했습니다. 감독 관계 +4.`; }
      r.st='no'; p.mor=clamp((p.mor??60)+5,0,100); return `${p.name}에게 기회를 더 줍니다(기분 +5). `+neg(m.ego>=70?5:3); }
    if(r.k==='frep'){ if(i===0){ r.st='open'; return '21일 안에 교체를 추진합니다. 외국인 시장과 관찰 명단을 확인하세요.'; } r.st='no'; return neg(3); }
    if(r.k==='fa'){ if(i===0){ r.st='open'; return 'FA 협상에 나섭니다.'; } r.st='no'; return neg(2); }
    if(r.k==='draft'){ if(i===0){ r.st='open'; G.draftPol={y:G.year,k:r.data.pol}; return `드래프트 기조: ${DPOL[r.data.pol]}.`; } r.st='no'; G.draftPol=null; return neg(1); }
    return ''; } };
/* 약속을 지켰는지 */
function mreqCheck(){ const m=G.mgr[G.user]; if(!m)return; for(const r of mreqs()){ if(r.st!=='open')continue; if((r.mid!=null&&r.mid!==m.id)||(r.tid!=null&&r.tid!==G.user)){ r.st='void'; continue; } /* 그 감독·그 구단과 한 약속 */ let ok=false, fail=false;
    if(r.k==='slot'){ const cur=slotRanks(G.user)[r.data.sk]; const got=r.data.target&&G.players[r.data.target]&&G.players[r.data.target].team===G.user; ok=got||cur.v>=r.data.v+3; if(!ok&&G.day>r.until)fail=true; }
    else if(r.k==='out'){ const p=G.players[r.data.pid]; ok=!p||p.team!==G.user; if(!ok&&G.day>r.until){ r.st='half'; continue; } }
    else if(r.k==='frep'){ const p=G.players[r.data.pid]; ok=!p||p.team!==G.user; if(!ok&&fReplLeft(G.user)<=0){ r.st='void'; continue; } if(!ok&&G.day>r.until)fail=true; } /* 교체 횟수를 다 쓰면 요청은 없던 일이 된다 */
    else if(r.k==='fa'){ const p=G.players[r.data.pid]; ok=p&&p.team===G.user; if(!ok&&(p&&p.team!=null&&p.team!==G.user||G.fa&&G.fa.closed))fail=true; }
    else if(r.k==='draft'){ if(G.draft&&G.draft.done&&G.draft.y===G.year){ const mine=G.draft.picks.filter(x=>x.tid===G.user&&x.pid>0&&x.rd<=2).map(x=>G.players[x.pid]).filter(Boolean); ok=mine.some(p=>draftFit(p,r.data.pol)); fail=!ok; } }
    const gain={slot:6,out:4,frep:5,fa:7,draft:4}[r.k], loss={slot:5,out:0,frep:4,fa:4,draft:1}[r.k];
    if(ok){ r.st='done'; r.end=G.day; m.rel=clamp(m.rel+gain,0,100); mail('감독실',`${m.name} 감독: "고맙습니다"`,`${MREQK[r.k]}을(를) 들어주셨습니다. 감독 관계 +${gain}.${r.k==='slot'||r.k==='fa'?' 선수단 분위기도 좋아졌습니다.':''}`,{kind:'감독'}); if(r.k==='slot'||r.k==='fa'){ if(!G.form||G.day>G.form.until)G.form={until:G.day+10,b:.4}; } }
    else if(fail){ r.st='fail'; r.end=G.day; m.rel=clamp(m.rel-loss,0,100); if(loss)mail('감독실',`${m.name} 감독: "약속은 어떻게 된 겁니까"`,`${MREQK[r.k]}이(가) 지켜지지 않았습니다. 감독 관계 -${loss}.`,{kind:'감독',imp:true}); } } }

/* ===== 구단주와의 소통: 단장이 돈을 요청하고, 구단주가 먼저 주문하기도 한다 ===== */
/* 지원금 기록: 받는 순간의 영입 순번(an)을 함께 남긴다(그 뒤 영입만 '목적대로 씀') */
function grantAdd(g){ if(g&&g.an==null)g.an=G.acqSeq||0; grants().unshift(g); }
function grants(){ const L=G.grants=G.grants||[]; for(const g of L)if(g.an==null)g.an=G.acqSeq||0; return L; } /* an: 지원금을 받을 때까지의 영입 순번(그 뒤 영입만 '목적대로 씀'으로 센다) */
function grantAmt(y){ return sum(grants().filter(g=>g.y===(y??G.year)&&g.ok).map(g=>g.amt)); }
function ownAskLeft(){ const o=dobj(G.day); const mk=o.y*100+o.m; return grants().some(g=>g.mk===mk&&g.by==='gm')?0:1; }
/* 성사 가능성: 신뢰, 구단주 성향, 순위, 목적 */
function ownOdds(amt,pur){ const t=team(G.user); if(t.indie)return 0; const ow=t.owner; const rk=uRank(); let p=.35+(t.trust-50)/80;
  const contend=rk<=5||teamCtx(t).contend; if(ow==='win')p+=contend?.2:-.05; if(ow==='profit')p-=.18; if(ow==='pr')p+=.05;
  if(pur&&pur.k==='fa'){ const q=G.players[pur.pid]; if(q){ if(ovr(q)>=62)p+=ow==='pr'?.2:.1; } p+=.08; } if(pur&&pur.k==='frep')p+=.05;
  { const ex=budgetExtra(); if(ex>0)p+=clamp(ex/Math.max(500,amt),0,1)*.2; } /* 예상보다 수입이 늘었으면(관중·광고) 구단주도 더 내줄 여유가 있다 */
  p-=Math.max(0,amt-1000)/4000; const asked=grants().filter(g=>g.y===G.year&&g.by==='gm').length; p-=asked*.08; p+=cwRapMod(); /* 구단주·사장 친밀도(동석 관람) */ return clamp(p,.03,.92); }
function oddsTxt(p){ return p>=.7?'받아들일 가능성이 큽니다':p>=.45?'반반입니다':p>=.25?'쉽지 않습니다':'거의 어렵습니다'; }
function ownerAsk(amt,pur){ const t=team(G.user); if(t.indie)return '독립구단이라 모기업 지원이 없습니다. 스폰서와 자체 수익으로 운영합니다.'; if(!ownAskLeft())return '이번 달에는 이미 요청했습니다. 다음 달에 다시 요청할 수 있습니다.';
  const p=ownOdds(amt,pur); const ok=R()<p; const B=bossOf(G.user); const o=dobj(G.day); const g={y:G.year,mk:o.y*100+o.m,d:G.day,amt,pur:pur||null,ok,by:'gm',st:ok?'open':'no',until:pur&&pur.k==='fa'?grantFaEnd():pur&&pur.k==='frep'?Math.min(G.day+30,foreignDL()):null};
  grantAdd(g); if(G.grants.length>40)G.grants.length=40; const what=pur?pur.k==='fa'?`FA ${G.players[pur.pid]?.name||''} 영입 자금`:pur.k==='frep'?'외국인 교체 자금':'운영 자금':'운영비 증액';
  if(ok){ grantApply(amt); if(!pur)g.st='done'; mail('구단주실',`구단주 승인: ${what} ${money(amt)}`,`${B.own.name} 회장이 ${what} ${money(amt)}을(를) 승인했습니다. ${pur?'목적대로 쓰지 않으면 신뢰가 깎입니다. ':''}올해 모기업 지원 한도와 구단주 목표가 그만큼 늘었습니다.`,{kind:'구단주'}); return `승인됐습니다. ${what} ${money(amt)}.`; }
  t.trust=clamp(t.trust-1,0,100); mail('구단주실',`구단주 반려: ${what}`,`${B.own.name} 회장이 요청을 반려했습니다. "${t.owner==='profit'?'지금 적자부터 줄이세요.':t.owner==='win'?'성적으로 먼저 증명하세요.':'지금은 때가 아닙니다.'}" 구단주 신뢰 -1.`,{kind:'구단주'}); return `반려됐습니다. 구단주 신뢰 -1.`; }
/* 겨울(결산 뒤)에 받은 지원금은 다음 시즌 몫이다. FA 자금 기한은 FA 시장이 닫히는 1월 24일 */
function grantFaEnd(){ return dnum(G.year+(dobj(G.day).m>=10?1:0),1,24); }
function grantApply(amt){ const t=team(G.user); const sy=sponSeason(); const cap0=supportCap(t); t.grant=(t.grant&&t.grant.y===sy?t.grant.amt:0)+amt; t.grant={y:sy,amt:t.grant}; const g=G.goals; if(g&&g.y===sy){ const cap1=supportCap(t); g.sup=clamp((g.sup*cap0+amt)/Math.max(1,cap1),0,1.5); } } /* 지원 목표(비율×한도)가 정확히 받은 금액만큼 늘게: 한도도 함께 늘어나므로 비율은 새 한도로 다시 계산한다 */
/* 목적이 있는 지원금: 지켰는지 */
function grantCheck(){ const t=team(G.user); for(const g of grants()){ if(g.st!=='open'||!g.pur)continue; let ok=false, fail=false;
    if(g.pur.k==='fa'){ const p=G.players[g.pur.pid]; ok=p&&p.team===G.user; fail=!ok&&(p&&p.team!=null&&p.team!==G.user||G.fa&&G.fa.closed||G.day>g.until); }
    else if(g.pur.k==='frep'){ const p=G.players[g.pur.pid]; const out=!p||p.team!==G.user; const inn=foreignOf(G.user).some(q=>q.acq&&q.acq.tid===G.user&&q.acq.k==='외국인'&&(q.acq.n!=null?q.acq.n>(g.an||0):q.acq.d>g.d)); ok=out&&inn; fail=!ok&&G.day>g.until; } /* 내보내고 새로 데려와야 교체 */
    else if(g.pur.k==='boost'){ ok=Object.values(G.players).some(p=>p.team===G.user&&p.acq&&p.acq.tid===G.user&&p.acq.k!=='fd'&&p.acq.k!=='draft'&&(p.acq.n!=null?p.acq.n>(g.an||0):p.acq.d>g.d)); /* 자금을 받은 뒤 실제로 데려온 선수(트레이드·FA·외국인·무적 영입 등)가 있어야 한다 */ fail=!ok&&G.day>g.until; }
    if(ok){ g.st='done'; t.trust=clamp(t.trust+(g.by==='own'?4:2),0,100); note('구단주',`구단주가 지원한 돈이 목적대로 쓰였습니다. 구단주 신뢰 +${g.by==='own'?4:2}.`); }
    else if(fail){ g.st='fail'; t.trust=clamp(t.trust-(g.by==='own'?4:3),0,100); mail('구단주실','구단주: "그 돈은 어디에 썼습니까"',`지원 목적(${g.pur.k==='fa'?'FA 영입':g.pur.k==='frep'?'외국인 교체':'전력 보강'})이 이뤄지지 않았습니다. 구단주 신뢰 -${g.by==='own'?4:3}.`,{kind:'구단주',imp:true}); } } }
/* 구단주가 먼저: FA 기간 스타 영입 주문, 7월 우승 보강 자금 */
function ownerPush(){ const t=team(G.user); if(t.indie||G.gameOver||G.unemp)return; const B=bossOf(G.user); const o=dobj(G.day); const mk=o.y*100+o.m; if(grants().some(g=>g.by==='own'&&g.y===G.year&&g.kind===(G.fa&&G.fa.open&&!G.fa.closed?'fa':'boost')))return;
  if(G.fa&&G.fa.open&&!G.fa.closed&&t.trust>=35&&(t.owner==='pr'||t.owner==='win')&&R()<.5){ /* 데려올 수 있는 선수만: 외부 FA 영입 한도(2~3명)를 다 채웠으면 원 소속(우리) FA만 남는다 */ const room=faOutN(G.user)<faCapN(); const star=G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&ovr(p)>=60&&(room||p.faFrom===G.user)).sort((a,b)=>ovr(b)-ovr(a))[0]; if(!star)return;
    const amt=round5(star.ask.annual*(t.owner==='pr'?1:.8)); const g={y:G.year,mk,d:G.day,amt,pur:{k:'fa',pid:star.id},ok:true,by:'own',kind:'fa',st:'open',until:grantFaEnd()}; grantAdd(g); grantApply(amt);
    mail('구단주실',`구단주 주문: "${star.name}을(를) 잡으세요"`,`${B.own.name} 회장이 직접 연락했습니다. "${t.owner==='pr'?'팬들이 원하는 스타가 필요합니다':'우승하려면 저런 선수가 있어야 합니다'}. ${star.name} 영입 자금으로 ${money(amt)}을(를) 더 내겠습니다." 영입하면 구단주 신뢰 +4, 놓치면 -4.`,{imp:true,kind:'구단주',ref:star.id,acts:[{l:`${star.name} 협상실`,a:'faOpen',v:star.id}]}); return; }
  if(period()==='season'&&G.day>=KD(7,1)&&G.day<=KD(7,10)&&t.owner==='win'&&t.trust>=40&&uRank()<=4&&R()<.6){ const amt=1500; const g={y:G.year,mk,d:G.day,amt,pur:{k:'boost'},ok:true,by:'own',kind:'boost',st:'open',until:tradeDL()}; grantAdd(g); grantApply(amt);
    mail('구단주실','구단주: "올해 우승을 노립시다"',`${B.own.name} 회장이 보강 자금 ${money(amt)}을(를) 내놨습니다. 7월 31일까지 트레이드나 외국인 교체로 전력을 보강하면 구단주 신뢰 +4, 아무것도 안 하면 -4.`,{imp:true,kind:'구단주',acts:[{l:'트레이드 센터',a:'go',v:'trade:market'}]}); } }

function uRank(){ try{ const i=standingsNow().findIndex(x=>x.tid===G.user); return i>=0?i+1:5; }catch(e){ return 5; } }

/* ===== 감독과의 공생: 선수 보는 눈 · 미는 선수 · 휴식/투수 관리 성향과 단장 지시 ===== */
function mgrAttr(m){ if(!m)return m; const k=m.id||'x'; if(m.rest==null)m.rest=Math.round(clamp(30+u01('mrest',k)*55+(m.youth-50)*.25,20,90)); if(m.arm==null)m.arm=Math.round(clamp(25+u01('marm',k)*60-(m.pen-50)*.2,20,90)); if(m.dfn==null)m.dfn=Math.round(clamp(22+u01('mdfn',k)*62+((m.small??50)-50)*.2,20,90)); if(m.eye==null)m.eye=Math.round(clamp(m.tac*.45+(m.youth||50)*.2+m.fame*.15+u01('meye',k)*25,25,90)); return m; }
function mgrDir(){ return G.mgrDir=G.mgrDir||{}; }
/* 단장 지시가 반영된 실제 성향 */
function mgrRestEff(m){ mgrAttr(m); const d=mgrDir(); return d.rest&&d.rest.ok&&m.id===d.rest.mid?Math.max(m.rest,70):m.rest; }
/* 우리 구단에 '투수 혹사 금지' 지시가 걸려 있나(지금 감독이 받아들인 지시) */
function armDirOn(tid){ if(tid!==G.user||G.unemp)return false; const m=G.mgr&&G.mgr[tid]; const d=mgrDir(); return !!(m&&d.arm&&d.arm.ok&&d.arm.mid===m.id); }
function mgrArmEff(m){ mgrAttr(m); const d=mgrDir(); return d.arm&&d.arm.ok&&m.id===d.arm.mid?Math.min(m.arm,35):m.arm; }
/* 거절된 지시는 관계가 5 이상 오르거나 30일이 지나야 다시 꺼낼 수 있다(같은 날 다시 눌러 관계만 깎이지 않게) */
function mgrDirWait(k){ const m=G.mgr[G.user]; const x=mgrDir()[k]; if(!m||!x||x.ok||x.mid!==m.id)return null; const dd=x.day+30-G.day, need=(x.rel0??m.rel)+5; if(dd<=0||m.rel>=need)return null; return `관계 개선 후 재논의(관계 ${need} 이상 또는 ${dmd(x.day+30)}부터)`; }
function setMgrDir(k,on){ const m=G.mgr[G.user]; if(!m||m.interim)return '감독이 없습니다.'; mgrAttr(m); mgrFix(m); const d=mgrDir();
  if(on){ const w=mgrDirWait(k); if(w)return `${m.name} 감독이 얼마 전 거절한 지시입니다. ${w}.`; }
  if(!on){ delete d[k]; return k==='arm'?'투수 관리 지시를 풀었습니다. 감독 본래 성향대로 운영합니다.':'휴식 보장 지시를 풀었습니다.'; }
  const gap=k==='arm'?Math.max(0,m.arm-35)/55:Math.max(0,70-m.rest)/50; const s=1-gap*.45-(m.ego-50)/70+(m.rel-60)/80; const ok=R()<clamp(s,.15,.97);
  d[k]={ok,mid:m.id,day:G.day}; if(ok){ m.rel=clamp(m.rel-(gap>.5?2:0),0,100); return `${m.name} 감독: "알겠습니다. ${k==='arm'?'투수들 무리시키지 않겠습니다':'주전도 쉬게 하면서 가겠습니다'}."${gap>.5?' (본래 성향과 달라 관계 -2)':''}`; }
  m.rel=clamp(m.rel-4,0,100); d[k].rel0=m.rel; return `${m.name} 감독: "${k==='arm'?'이길 수 있는 경기는 잡아야 합니다. 투수 운용은 제게 맡겨 주십시오':'주전은 뛰어야 주전입니다'}." 지시를 따르지 않습니다(관계 -4). 관계가 더 좋아지면 다시 지시해 보세요.`; }
/* 감독의 눈: 잠재력 예측. 안목이 좋을수록 실제와 가깝다 */
function mgrView(p){ const m=G.mgr[G.user]; if(!m||m.interim||!p||p.team!==G.user)return null; mgrAttr(m); if(m.rel<30)return {mute:true};
  const sd=Math.max(1.5,9.5-m.eye/10); const fut=clamp(Math.round(p.pot+hn('meye'+m.id+':'+G.year,p.id)*sd),20,80); const cur=Math.round(ovr(p));
  const line=fut-cur>=8?(fut>=62?'2~3년 안에 팀의 기둥이 됩니다':'꾸준히 쓰면 1군 주전감입니다'):fut-cur>=3?'조금 더 올라옵니다':p.age>=31?'내려가는 길입니다. 길게 보지 않는 게 좋습니다':'지금이 거의 다 큰 모습입니다';
  return {fut,line,sd,eye:m.eye}; }
/* 감독이 미는 선수: 시즌마다 1~2명. 단장이 함께 밀어주면 성장이 빨라진다 */
function mpickPlan(){ const m=G.mgr[G.user]; if(!m||m.interim)return; mgrAttr(m); const P=G.mpick; if(P&&P.y===G.year&&P.mid===m.id)return;
  const cands=domestic(G.user).filter(p=>p.age<=26&&!p.ys&&!(p.joinY>G.year)).map(p=>({p,v:mgrView(p)})).filter(x=>x.v&&!x.v.mute&&x.v.fut-ovr(x.p)>=5).sort((a,b)=>(b.v.fut-ovr(b.p)*.3)-(a.v.fut-ovr(a.p)*.3)).slice(0,2);
  G.mpick={y:G.year,mid:m.id,ids:cands.map(x=>x.p.id),back:null,day:G.day}; if(!cands.length)return;
  evNew('mpick',`${m.name} 감독이 미는 선수`,`"${cands.map(x=>`${x.p.name}(${posLabel(x.p)}, ${x.p.age}세)`).join(', ')}. 제가 보기엔 ${cands[0].v.line.replace(/[.]$/,'')}. 올해 출전 기회와 훈련을 몰아주고 싶습니다." 감독의 선수 보는 눈(안목) ${m.eye}.`,
    [{l:'함께 밀어준다',fx:'올해 이 선수들의 성장 속도가 30% 빨라지고 기분이 오릅니다. 감독 관계 +4. 시즌 중 트레이드하면 감독이 크게 서운해합니다(-6).'},{l:'성적이 먼저다',fx:'변화 없음. 감독 관계 -2.'}],{from:'감독실',ref:cands[0].p.id,data:{ids:cands.map(x=>x.p.id)},def:0,exp:7}); }
EVH.mpick={ pick(e,i){ const m=G.mgr[G.user]; if(!m)return ''; if(i===0){ G.mpick.back=true; m.rel=clamp(m.rel+4,0,100); for(const id of e.data.ids){ const p=G.players[id]; if(p)p.mor=clamp((p.mor??60)+5,0,100); } return '감독과 함께 밀어주기로 했습니다. 감독 관계 +4.'; } G.mpick.back=false; m.rel=clamp(m.rel-2,0,100); return '감독 관계 -2.'; } };
function mpickMult(p){ const P=G.mpick; const m=G.mgr[G.user]; return P&&P.back&&P.y===G.year&&P.ids.includes(p.id)&&p.team===G.user&&m&&!m.interim&&(P.mid==null||P.mid===m.id)?1.3:1; } /* 그 감독이 밀던 선수: 감독이 바뀌거나 대행 체제면 끝 */
/* 감독 안목 성적표: 예측과 실제 성장 비교 (시즌 끝에) */
function mgrEyeReport(){ const m=G.mgr[G.user]; const P=G.mpick; if(!m||!P||P.y!==G.year||!P.ids.length)return; const L=P.ids.map(id=>G.players[id]).filter(Boolean); if(!L.length)return;
  const txt=L.map(p=>{ const h=(p.oh||[]).slice(-2); const d=h.length===2?h[1].o-h[0].o:0; return `${p.name} ${d>=0?'+':''}${d}`; }).join(', '); (G.mpickLog=G.mpickLog||[]).unshift({y:G.year,mid:m.id,txt,back:P.back}); if(G.mpickLog.length>10)G.mpickLog.length=10; }
/* 관계가 주는 것: 선수단 분위기(경기력), 좋으면 공개 지지, 나쁘면 언론 불화설·사퇴 */
function mgrRelBoost(p){ if(p.team!==G.user)return 0; const m=G.mgr[G.user]; if(!m||m.interim)return 0; return clamp((m.rel-55)/60,-.5,.4); }
function mgrRelWeek(){ const m=G.mgr[G.user]; if(!m||m.interim||period()!=='season')return; mgrFix(m); prInit();
  if(m.rel>=78&&R()<.08){ news('언론',`${m.name} 감독 "단장님과 호흡 최고"`,'프런트와 현장이 한 방향을 보고 있다는 평가입니다.',2); G.pr.press=clamp(G.pr.press+1,0,100); }
  if(m.rel<=25&&R()<.15){ news('언론',`${tshort(G.user)} 감독-단장 불화설`,`${m.name} 감독이 프런트 결정에 불만을 드러냈습니다.`,-2); G.pr.fan=clamp(G.pr.fan-1,0,100); G.pr.press=clamp(G.pr.press-2,0,100);
    if(m.ego>=65&&m.rel<=15&&R()<.3){ const nm=m.name; resignMgr(); mail('감독실',`${nm} 감독 자진 사퇴`,`${nm} 감독이 "더는 함께하기 어렵다"며 물러났습니다. 수석코치가 감독대행을 맡습니다. 새 감독을 선임하세요.`,{imp:true,kind:'감독',acts:[{l:'감독 후보',a:'go',v:'staff:mgr'}]}); } } }
/* ===== 스타 파워: 수상·기록·활약이 마케팅 수입이 된다 ===== */
function starPower(p){ let s=0; for(const a of (p.aw||[])){ const y=+String(a).slice(0,4); const age=G.year-y; if(age>2||isNaN(y))continue; const w=age===0?1:age===1?.7:.4;
    s+=(a.includes('대표팀 영웅')?22:a.includes('MVP')?40:a.includes('신인왕')?20:a.includes('골든')?15:5)*w; }
  const f=(G.feats||[]).filter(x=>x.pid===p.id&&x.maj&&x.y>=G.year-1).length; s+=f*8; const h=seasonTotal(p,G.year,'1군'); if(h){ const w=warOf(h,p); if(w>=4)s+=(w-3)*5; } if(p.hype&&p.hype.until>=G.day)s+=p.hype.v||0; /* 언론 플레이로 띄운 선수 */ if(p.foreign)s*=.6; return Math.round(s); }
function teamStar(tid){ const L=playersOf(tid??G.user).map(p=>({p,s:starPower(p)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,3); return {v:sum(L.map(x=>x.s)),L}; }

/* ===== FA 영입 설득: 꼭 잡아야 하는 FA를 위해 구단주에게 근거를 들고 가서 자금을 받아 온다 =====
   샐러리캡(경쟁균형세 상한) 안에서만 요청할 수 있다. 근거는 실제 데이터로 힘이 정해지고, 구단주 성향마다 귀에 들어오는 근거가 다르다.
   목표를 약속하면 승인 가능성이 오르지만, 그 약속은 다음 시즌 구단주 목표에 그대로 들어간다 */
const PITCH_ARG={
  win:{l:'전력 보강',d:'이 자리가 약점이고, 이 선수가 오면 순위가 오른다'},
  star:{l:'흥행·마케팅',d:'스타가 오면 관중·광고·상품 수입이 오른다'},
  value:{l:'계약 가치',d:'나이와 기량을 보면 이 금액이 오히려 싸다'},
  keep:{l:'우리 선수 지키기',d:'떠나면 전력과 팬심을 함께 잃는다'}};
const PITCH_W={win:{win:1,star:.45,value:.35,keep:.6},profit:{win:.35,star:.55,value:1,keep:.45},pr:{win:.5,star:1,value:.3,keep:.9}};
const PITCH_CMT={rank:{l:'시즌 목표 순위 한 계단 상향',v:1},fan:{l:'팬 여론 목표 +5',v:5},sup:{l:'모기업 적자 보전 목표 5%p 축소',v:.05}};
function pitchInfo(pid){ const p=G.players[pid]; const t=team(G.user); if(!p||!p.ask)return null; const amt=p.ask.annual;
  const capRoom=capOf(G.year)-capPay(G.user); const capOK=amt<=capRoom; let room=0; try{ room=budget().roomGoal; }catch(e){}
  const k=pSlot(p); const sr=slotRanks(G.user)[k]; const cur=k==='SP'||k==='RP'?null:depth(G.user).ln[k]; const gap=cur?ovr(p)-ovr(cur):ovr(p)-50;
  const own=p.faFrom===G.user; const S={
    win:clamp((sr.rank-2)/7,0,1)*clamp((gap+2)/9,0,1)*(uRank()<=7?1:.7),
    star:clamp((ovr(p)-53)/10,0,1)+(p.aw&&p.aw.length?.15:0)+(p.fr?.1:0),
    value:clamp((31-p.age)/6,0,1)*clamp(1.15-amt/Math.max(1,faWorth(t,p)),0,1)+(p.age<=28?.15:0),
    keep:own?(p.fr?1:.6):0};
  for(const x in S)S[x]=Math.round(clamp(S[x],0,1)*100)/100;
  const w=PITCH_W[t.owner]||PITCH_W.win; return {p,amt,capOK,capRoom,room,need:Math.max(0,amt-room),S,w,own,done:(G.pitched||{})[pid]===G.year,slot:SLOTK[k]||posLabel(p),rank:sr.rank,gap}; }
function pitchOdds(pid,args,cmts){ const I=pitchInfo(pid); if(!I)return 0; const t=team(G.user); let o=ownOdds(I.amt,{k:'fa',pid});
  for(const a of (args||[]).slice(0,2))o+=.22*(I.w[a]||0)*(I.S[a]||0);
  for(const c of (cmts||[]))o+=c==='rank'?(t.owner==='win'?.12:.06):c==='fan'?(t.owner==='pr'?.1:.04):c==='sup'?(t.owner==='profit'?.12:.05):0;
  return clamp(o,.03,.95); }
function ownerPitch(pid,args,cmts){ const I=pitchInfo(pid); const t=team(G.user); const B=bossOf(G.user); if(!I)return '대상 선수가 없습니다.';
  if(t.indie)return '독립구단이라 모기업 지원이 없습니다.'; if(!I.capOK)return `샐러리캡 안에서만 요청할 수 있습니다. 남은 캡 ${money(I.capRoom)}, 필요 ${money(I.amt)}.`;
  if(I.done)return '이 선수 건은 올해 이미 구단주에게 보고했습니다.'; if(!ownAskLeft())return '이번 달에는 이미 구단주에게 요청했습니다.';
  args=(args||[]).filter(a=>PITCH_ARG[a]).slice(0,2); cmts=(cmts||[]).filter(c=>PITCH_CMT[c]); if(!args.length)return '설득할 근거를 하나 이상 고르세요.';
  const pr=pitchOdds(pid,args,cmts); const ok=R()<pr; (G.pitched=G.pitched||{})[pid]=G.year; const o=dobj(G.day);
  const best=[...args].sort((a,b)=>I.w[b]*I.S[b]-I.w[a]*I.S[a])[0]; const weak=args.filter(a=>I.S[a]<.35);
  const g={y:G.year,mk:o.y*100+o.m,d:G.day,amt:I.amt,pur:{k:'fa',pid},ok,by:'gm',st:ok?'open':'no',until:grantFaEnd(),pitch:{args,cmts}}; grantAdd(g); if(G.grants.length>40)G.grants.length=40;
  if(ok){ grantApply(I.amt); const ny=G.year+(period()==='off'||period()==='post'?1:0); for(const c of cmts)(G.pitchCommit=G.pitchCommit||[]).push({y:ny,k:c,v:PITCH_CMT[c].v,l:PITCH_CMT[c].l});
    mail('구단주실',`구단주 승인: FA ${I.p.name} 영입 자금 ${money(I.amt)}`,`${B.own.name} 회장: "${PITCH_ARG[best].l} 이야기가 설득력 있었습니다. ${I.p.name}을(를) 꼭 잡으세요."\n\n올해 모기업 지원 한도가 ${money(I.amt)} 늘었습니다.${cmts.length?`\n약속한 목표: ${cmts.map(c=>PITCH_CMT[c].l).join(', ')}. 다음 시즌 구단주 목표에 들어갑니다.`:''}\n영입하지 못하면 구단주 신뢰가 깎입니다.`,{kind:'구단주',imp:true,acts:[{l:'FA 시장',a:'go',v:'transfer:fa'}]});
    return `승인: ${money(I.amt)}을(를) 받았습니다.`; }
  t.trust=clamp(t.trust-1,0,100);
  const why=weak.length?`${weak.map(a=>PITCH_ARG[a].l).join(', ')} 근거가 약합니다.`:t.owner==='profit'?'숫자로 보면 아직 확신이 안 섭니다.':t.owner==='win'?'그 돈이면 다른 데 쓰는 게 낫겠습니다.':'지금은 때가 아닙니다.';
  mail('구단주실',`구단주 반려: FA ${I.p.name} 영입 자금`,`${B.own.name} 회장: "${why}" 구단주 신뢰 -1.`,{kind:'구단주'});
  return `반려: ${why}`; }
