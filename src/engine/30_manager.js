/* ===== 감독 ===== */
const MCAR=['투수코치','타격코치','수비코치','작전·주루코치','배터리코치','수석코치','2군 감독'];
function mkMgr(){ const tac=ri(35,82); const fame=R()<.16?ri(70,92):ri(18,62); const ego=clamp(ri(20,85)+(fame>=70?12:0),20,95);
  return {id:'g'+Math.floor(R()*1e9),name:genName(),age:ri(44,63),small:ri(15,88),pen:ri(15,88),youth:ri(15,88),disc:ri(20,88),tac,ego,fame,rel:60,
  sal:round5(clamp(220+(tac-50)*9+Math.max(0,fame-55)*9+N(0,40),180,1200)),yrs:0,career:fame>=70?`${pick(['국가대표 출신 스타','레전드 투수 출신','레전드 타자 출신','우승 감독 출신'])} · 지도자 경력 ${ri(6,22)}년`:`${pick(MCAR)} 출신 · 지도자 경력 ${ri(6,22)}년`}; }
function mgrFix(m){ if(!m)return m; if(m.ego==null)m.ego=ri(20,85); if(m.fame==null)m.fame=ri(18,62); if(m.rel==null)m.rel=60; mgrAttr(m); return m; }
/* 운영 기조: 단장이 지시하고, 감독이 성향대로 받아들인다 */
const POL={win:{l:'성적 우선',lean:-1,d:'지금 이기는 데 집중합니다. 검증된 선수가 우선 출전합니다.'},bal:{l:'균형',lean:0,d:'성적과 육성을 함께 봅니다.'},youth:{l:'육성 우선',lean:1,d:'젊은 유망주에게 출전 기회를 줍니다. 당장 성적은 떨어질 수 있습니다.'}};
function mgrLean(m){ return clamp((m.youth-50)/40,-1,1); }
function teamLean(tid){ const m=mgrOf(tid);
  if(tid!==G.user){ const want=team(tid).mode==='rebuild'?.6:-.5; return clamp(want*.5+mgrLean(m)*.5,-1,1); }
  if(!G.policy)return mgrLean(m); const f=G.policy.follow??1; return clamp(POL[G.policy.k].lean*f+mgrLean(m)*(1-f),-1,1); }
function polBonus(tid,p,lean){ if(lean==null)lean=teamLean(tid); const pa=tid===G.user?pactB(p):0; if(Math.abs(lean)<.05)return pa;
  if(lean>0){ const gap=Math.max(0,p.pot-ovr(p)); return pa+lean*(p.age<=24?3+gap*.18:p.age<=26?1.5:p.age>=31?-1:0); }
  return pa-lean*(p.age>=28?1.5:p.age<=23?-1.5:0); }
/* 감독과의 유망주 기회 합의: 단장이 대상을 정하고 감독이 받아들인 만큼 기용에 반영된다. 매달 감독이 근거와 함께 보고한다 */
function pactB(p){ const P=G.pact; if(!P||P.y!==G.year||!P.on)return 0; const x=P.t.find(t=>t.id===p.id); return x?x.b:0; }
function pactPropose(ids){ const m=G.mgr[G.user]; if(!m||m.interim)return '감독이 없습니다.'; mgrAttr(m); ids=ids.filter(id=>G.players[id]&&G.players[id].team===G.user).slice(0,2); if(!ids.length)return '대상 선수를 고르세요.';
  const d=depth(G.user); const t=ids.map(id=>{ const p=G.players[id]; const k=pSlot(p); const st=k==='SP'?d.sp[4]:k==='RP'?d.pen[3]:d.ln[k]; const gap=st&&st.id!==p.id?ovr(st)-ovr(p):0;
    const ch=clamp(.7+(m.rel-60)/100+(m.youth-50)/90-(m.ego-50)/120-Math.max(0,gap)*.035,.08,.95); const r=R();
    const lv=r<ch?'full':r<ch+.25?'part':'no'; const b=lv==='full'?4:lv==='part'?1.6:0;
    const why=lv==='full'?`"${p.name}에게 꾸준히 기회를 주겠습니다."`:lv==='part'?`"${st?`${st.name}(${Math.round(ovr(st))})와 차이가 있어서`:'아직은'} 대타·대수비나 승부가 기운 경기 위주로 쓰겠습니다."`:`"지금 ${p.name}(${Math.round(ovr(p))})로는 ${st?`${st.name}(${Math.round(ovr(st))}) 자리를`:'1군 자리를'} 맡기기 어렵습니다. 2군에서 더 보겠습니다."`;
    const h=seasonTotal(p,G.year,'1군'); return {id,lv,b,why,s0:{pa:h?h.pa:0,outs:h?h.outs:0}}; });
  G.pact={y:G.year,on:true,day:G.day,mid:m.id,t,log:[]};
  return t.map(x=>`${G.players[x.id].name}: ${x.lv==='full'?'합의':x.lv==='part'?'부분 합의':'거절'} · ${x.why}`).join('\n'); }
function pactMonth(mo){ const P=G.pact; const m=G.mgr[G.user]; if(!P||P.y!==G.year||!P.on||!m||P.mid!==m.id||G.unemp)return; const L=[];
  for(const x of P.t){ const p=G.players[x.id]; if(!p||p.team!==G.user){ L.push('대상 선수가 팀을 떠났습니다.'); continue; } const h=seasonTotal(p,G.year,'1군'); const pa=(h?h.pa:0)-x.s0.pa, outs=(h?h.outs:0)-x.s0.outs; x.s0={pa:h?h.pa:0,outs:h?h.outs:0};
    const enough=p.isP?outs>=27:pa>=35; const amt=p.isP?`${ipStr(outs)}이닝`:`${pa}타석`; let r='';
    if(enough)r='약속대로 기회를 줬습니다.'; else if(p.injOut>0||(p.injHist||[]).some(z=>z.y===G.year&&z.d>=G.day-31))r='부상으로 쓰지 못했습니다.'; else if(!p.e1)r=x.lv==='no'?'합의 때 말씀드린 대로 2군에서 보고 있습니다.':'1군 엔트리 경쟁에서 밀렸습니다. 지금 능력으로는 다른 선수가 먼저입니다.'; else { const hh=h&&(p.isP?h.outs>=30:h.pa>=40)?h:null; r=hh?(p.isP?`부진(ERA ${pRate(hh).era.toFixed(2)})해서 비중을 줄였습니다.`:`부진(OPS ${fmt3(bRate(hh).ops)})해서 비중을 줄였습니다.`):'경기 상황상 기회가 적었습니다.'; }
    L.push(`${p.name}(${x.lv==='full'?'합의':x.lv==='part'?'부분 합의':'2군 육성'}): ${mo}월 1군 ${amt} · ${r}`); }
  if(!L.length)return; P.log.push({m:mo,L});
  mail('감독실',`${mo}월 유망주 기회 점검`,`${m.name} 감독의 보고입니다.\n\n${L.join('\n')}\n\n합의는 그대로 두거나, 대상을 바꾸거나, 끝낼 수 있습니다. 결과만으로 자동 평가하지 않습니다.`,{kind:'감독',acts:[{l:'합의 유지',a:'pactKeep',v:''},{l:'대상 바꾸기',a:'go',v:'staff:pact'},{l:'합의 끝내기',a:'pactEnd',v:''}]}); }
function setPolicy(k){
  const m=G.mgr[G.user]; if(!m)return {msg:'감독이 없습니다.'};
  if(G.policy&&G.policy.k===k)return {msg:'이미 그 기조입니다.'};
  if(G.policy&&G.day-G.policy.day<14)return {msg:`운영 기조는 2주에 한 번만 바꿀 수 있습니다. (${dmd(G.policy.day+14)}부터)`};
  mgrFix(m); const diff=Math.abs(POL[k].lean-mgrLean(m));
  let s=1-diff*.32-(m.ego-50)/55-(m.fame-50)/110+(m.rel-60)/90+(G.policy?-.05:0);
  const follow=clamp(s,.12,1); G.policy={k,day:G.day,follow};
  let msg;
  if(follow>=.8){ msg=`${m.name} 감독: 알겠습니다. ${POL[k].l} 기조로 운영하겠습니다.`; m.rel=clamp(m.rel+2,0,100); }
  else if(follow>=.5){ msg=`${m.name} 감독: 취지는 이해합니다. 다만 현장 상황을 보면서 일부만 반영하겠습니다.`; }
  else { msg=`${m.name} 감독: 선수 기용은 감독의 권한입니다. 제 방식대로 하겠습니다.`; m.rel=clamp(m.rel-6,0,100); if(m.fame>=70||m.ego>=75)prLeak('mgr',null,`${m.name} 감독 "기용은 감독 권한"… 프런트와 엇박자`); }
  mail('감독실',`운영 기조 지시: ${POL[k].l}`,`${msg}\n\n감독 수용도 ${Math.round(follow*100)}%. 실제 운영은 지시와 감독 본래 성향(${mgrLean(m)>.2?'육성 쪽':mgrLean(m)<-.2?'성적 쪽':'균형'})이 섞여 정해집니다.`,{kind:'감독'});
  addLog(`운영 기조를 ${POL[k].l}(으)로 지시했습니다. 감독 수용도 ${Math.round(follow*100)}%.`);
  return {msg,follow};
}
function mgrStyle(m){ const t=[]; t.push(m.small>=62?'스몰볼':m.small<=38?'빅볼':'균형 공격'); t.push(m.pen>=62?'불펜 적극 운용':m.pen<=38?'선발에 긴 이닝':'보통 투수 운용'); if(m.youth>=62)t.push('육성형'); if(m.disc>=65)t.push('강한 장악력'); else if(m.disc<=35)t.push('자율형'); return t.join(' · '); }
function refreshMgrMarket(){ G.mmarket=[1,2,3,4,5].map(mkMgr); if(!G.mmarket.some(m=>m.fame>=70)){ for(let i=0;i<60;i++){ const m=mkMgr(); if(m.fame>=70){ G.mmarket[0]=m; break; } } } G.mmarket.forEach(m=>m.clan=mkClan(m)); try{ if(G.ob)for(const ob of obMgrCands().sort((a,b)=>b.fame-a.fame).slice(0,2))G.mmarket.push(obMgr(ob)); }catch(e){} }
function hireMgr(id,years,withClan){
  const m=(G.mmarket||[]).find(x=>x.id===id); if(!m)return '후보가 없습니다.';
  const cur=G.mgr[G.user]; if(G.coach&&cur&&!cur.interim){ const gone=clanLeave(cur); if(gone.length)addLog(`${cur.name} 감독 사단이 함께 떠났습니다: ${gone.join(', ')}`); }
  if(cur&&!cur.interim){ const pay=Math.round(cur.sal*Math.max(0,cur.yrs-.5)); G.spend.mgr+=pay; addLog(`${cur.name} 감독을 경질했습니다. 잔여 연봉 ${money(pay)}.`); }
  m.yrs=years; G.mgr[G.user]=m; G.mmarket=G.mmarket.filter(x=>x.id!==id);
  if(G.coach&&withClan&&m.clan&&m.clan.length){ const got=hireClan(m,years); if(got.length)note('감독',`${m.name} 감독 사단이 함께 왔습니다: ${got.join(', ')}. 감독과 손발이 맞아 제 실력보다 더 잘 해낼 것입니다.`); }
  addLog(`${m.name} 감독과 ${years}년 연 ${money(m.sal)}에 계약했습니다.`); chron('mgr',`${m.name} 감독 선임 (${years}년)`);
  mail('운영팀',`${m.name} 감독 선임`,`${m.name} 감독과 ${years}년 연 ${money(m.sal)}에 계약했습니다. ${mgrStyle(m)} 성향입니다.`,{kind:'감독'});
  wire('감독',`${tname(G.user)}, ${m.name} 감독 선임`,{tid:G.user,x:{mid:m.id,hire:1}});
  mgrFix(m); m.rel=60; G.policy=null; try{ obHireBonus(m.ob,'감독'); }catch(e){} if(m.fame>=70){ const t=team(G.user); t.pop=clamp(t.pop+(m.fame-60)/400,0,1.5); note('감독',`스타 감독 ${m.name} 선임 소식에 팬들의 관심이 커졌습니다. 구단 인기가 올랐습니다.`); }
  for(const p of playersOf(G.user)){ initPers(p); p.mor=clamp(p.mor+(m.disc-50)/10+(m.fame>=70?3:0),0,100); }
  return '';
}
function fireMgr(){ const cur=G.mgr[G.user]; if(!cur||cur.interim)return; if(G.coach){ const gone=clanLeave(cur); if(gone.length)addLog(`${cur.name} 감독 사단이 함께 떠났습니다: ${gone.join(', ')}`); } const pay=Math.round(cur.sal*Math.max(0,cur.yrs-.5)); G.spend.mgr+=pay;
  addLog(`${cur.name} 감독을 경질했습니다. 잔여 연봉 ${money(pay)}.`); chron('mgr',`${cur.name} 감독 경질`);
  G.mgr[G.user]={id:'interim',name:'수석코치(감독대행)',age:50,small:50,pen:50,youth:50,disc:42,tac:45,sal:150,yrs:1,career:'감독대행',interim:true};
  for(const p of playersOf(G.user))p.mor=clamp(p.mor-4,0,100);
  wire('감독',`${tname(G.user)}, ${cur.name} 감독 경질`,{tid:G.user,x:{fire:1,nm:cur.name}});
  stop('감독',`${cur.name} 감독을 경질했습니다. 남은 기간은 수석코치가 감독대행을 맡습니다. 새 감독은 스태프 → 감독에서 선임하세요.`); }
/* 감독 자진 사퇴: 잔여 연봉·경질 기사·선수 기분 하락 없이 감독대행 체제로 */
function resignMgr(){ const cur=G.mgr[G.user]; if(!cur||cur.interim)return; if(G.coach){ const gone=clanLeave(cur); if(gone.length)addLog(`${cur.name} 감독 사단이 함께 떠났습니다: ${gone.join(', ')}`); }
  addLog(`${cur.name} 감독이 자진 사퇴했습니다. 잔여 연봉은 없습니다.`); chron('mgr',`${cur.name} 감독 자진 사퇴`);
  G.mgr[G.user]={id:'interim',name:'수석코치(감독대행)',age:50,small:50,pen:50,youth:50,disc:42,tac:45,sal:150,yrs:1,career:'감독대행',interim:true};
  wire('감독',`${tname(G.user)}, ${cur.name} 감독 자진 사퇴`,{tid:G.user,x:{fire:1,nm:cur.name}}); }
const mgrOf=tid=>G.mgr[tid]||{small:50,pen:50,youth:50,disc:45,tac:45};

