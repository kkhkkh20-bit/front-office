/* ---------- 스태프·육성 ---------- */
function trainView(){ /* 예전 '훈련' 메뉴: 스태프·육성 > 훈련·육성으로 옮김 */ const s=curSub('train'); UI.tab='staff'; UI.sub=UI.sub||{}; UI.sub.staff=s; UI.it=UI.it||{}; UI.it.mg_staff_train=s; return staffView();
  /* 아래는 쓰지 않음 */
  const H={camp:campView,dev:()=>(G.camp&&!G.camp.done&&(G.camp.seen=true),campCard())+csec('선수 육성',devBody(),`<span class="small muted">${(G.ovs||[]).length?`해외 연수 ${(G.ovs||[]).length}명`:''}</span>`),lead:leadCard};
  return subTabs('train')+(H[s]||campView)(); }
function staffView(){
  const s=curSub('staff'); const m=G.mgr[G.user];
  const H0={mgr:()=>csec('감독',mgrBody(),`<span class="small muted">${m?esc(m.name):'빈자리'}</span>`),
    dev:()=>(G.camp&&!G.camp.done&&(G.camp.seen=true),campCard())+csec('선수 육성',devBody(),`<span class="small muted">${(G.ovs||[]).length?`해외 연수 ${(G.ovs||[]).length}명`:''}</span>`),
    coach:coachView,
    scouts:scoutTeamPage,
    camp:campView,
    data:dataPage,
    fac:facView,
    lead:leadCard,
    mil:milView,
    med:()=>csec('부상 방지·병원',medBody(),`<span class="small muted">${PREV[G.med.prev].l} · ${esc(HOSP[G.med.hosp].name)}</span>`)}; const h=mergedBody('staff',s,H0);
  return subTabs('staff')+h;
}
/* ---------- 코치진 ---------- */
function clanName(id){ if(!id)return ''; const m=Object.values(G.mgr).find(x=>x&&x.id===id)||(G.mmarket||[]).find(x=>x.id===id); return m?m.name:''; }
function coachTag(c){ const m=G.mgr[G.user]; if(!c||!c.clan)return ''; if(m&&c.clan===m.id)return '<span class="pill good">감독 사단 +6</span>'; const n=clanName(c.clan); return n?`<span class="pill">${esc(n)} 사단</span>`:''; }
function coachStats(c,tid){ const e=k=>effC(c,tid,k); const d=k=>{ const v=e(k)-c[k]; return v?`<i class="${v>0?'up':'dn'}">${v>0?'+':''}${v}</i>`:''; };
  return `<span class="cst"><span>지도</span>${rchip(e('sk'))}${d('sk')}</span><span class="cst"><span>육성</span>${rchip(e('dv'))}${d('dv')}</span>`; }
function coachSlot(k){ const C=coachesOf(G.user); const c=C[k]; const r=CROLE[k];
  if(!c)return `<div class="csl empty"><div class="csl-h"><b>${r.l}</b><span class="pill bad">빈자리</span></div><p class="small muted">${r.d}</p><button class="btn small primary" data-a="coachFind" data-v="${k}">후보 보기</button></div>`;
  return `<div class="csl"><div class="csl-h"><b>${r.l}</b>${coachTag(c)}</div>
    <div class="csl-n">${avImg({persona:'coach',pid:c.id,name:c.name,age:c.age,team:G.user})}${esc(c.name)} <span class="small muted">${c.age}세</span></div>
    <div class="csl-s">${coachStats(c,G.user)}</div>
    <div class="small muted">${esc(c.car)} · 연 ${money(c.sal)} · 잔여 ${Math.max(0,c.yrs)}년</div>
    <div class="row"><button class="btn small" data-a="coachFind" data-v="${k}">교체</button>${UI.cfire===k?`<button class="btn small danger" data-a="fireCoach" data-v="${k}">정말 계약 해지</button>`:`<button class="btn small" data-a="cfireAsk" data-v="${k}">계약 해지</button>`}</div></div>`; }
function chanceTxt(p){ return p>=.65?'응할 가능성 큼':p>=.45?'반반':p>=.25?'쉽지 않음':'거의 어려움'; }
function coachOther(role,srt){ const C=coachesOf(G.user); const SF={tot:c=>-(c.sk+c.dv),sk:c=>-c.sk,dv:c=>-c.dv,sal:c=>c.sal};
  const L=[]; for(const t of G.teams){ if(t.id===G.user)continue; const TC=G.coach&&G.coach[t.id]; if(!TC)continue; for(const k of CKEYS){ const c=TC[k]; if(c&&(role==='all'||k===role))L.push({t,k,c}); } }
  L.sort((a,b)=>SF[srt](a.c)-SF[srt](b.c));
  const card=({t,k,c})=>{ const cur=C[k]; const diff=cur?(c.sk+c.dv)-(cur.sk+cur.dv):null; const T1=poachTerms(t.id,k,k); const pr=PROMO[k]; const T2=pr?poachTerms(t.id,k,pr):null; const cd=G.poachCd&&G.poachCd[c.id]>G.day;
    const m=G.mgr[t.id]; const clan=c.clan&&m&&c.clan===m.id;
    const b=(T,l)=>`<button class="btn small ${T.promo?'':'primary'}" data-a="poach" data-v="${t.id}:${k}:${T.toRole}" ${cd?'disabled':''}>${l}<i class="pc-s">연 ${money(T.sal)}${T.comp?` · 보상 ${money(T.comp)}`:''} · ${chanceTxt(T.chance)}</i></button>`;
    return `<div class="csl"><div class="csl-h"><b>${badge(t.id,14)} ${esc(t.city+' '+t.nick)} ${CROLE[k].l}</b>${cur?`<span class="small muted">우리 ${esc(cur.name)} 대비 ${diff>0?'+':''}${diff}</span>`:'<span class="pill bad">우리 빈자리</span>'}</div>
      <div class="csl-n">${avImg({persona:'coach',pid:c.id,name:c.name,age:c.age,team:t.id})}${esc(c.name)} <span class="small muted">${c.age}세</span>${c.star?' <span class="pill acc">스타 코치</span>':''}${obTag(c.ob)}${clan?` <span class="pill warn">${esc(m.name)} 감독 사단</span>`:''}</div><div class="csl-s">${coachStats({...c,clan:null},G.user)}</div>
      <div class="small muted">${esc(c.car)} · 현재 연 ${money(c.sal)} · 계약 ${Math.max(0,c.yrs)}년 남음</div>
      <div class="pcb">${b(T1,'같은 자리로 영입')}${T2?b(T2,`${CROLE[pr].l}로 승격 제의`):''}</div>${cd?`<p class="small muted">${dmd(G.poachCd[c.id])}까지 다시 만나 주지 않습니다.</p>`:''}</div>`; };
  return `<p class="small muted tipme">다른 구단 코치는 연봉을 올려 주거나(+35%) 한 단계 높은 자리를 주면(+15%, 응할 가능성 크게 오름) 옮겨 옵니다. ${poachOff()?'지금은 비시즌이라 계약이 1년 이하 남은 코치는 보상금 없이 데려올 수 있습니다.':'시즌 중에는 남은 계약에 대한 보상금을 원 소속 구단에 냅니다.'} 감독 사단 코치는 감독 곁을 잘 떠나지 않고, 우리 구단 출신은 잘 돌아옵니다. 빼 오면 그 구단 단장과 친분이 떨어집니다. 거절당하면 30일 동안 다시 제의할 수 없습니다.</p>
    ${(()=>{ const P=pager('cpo',L.slice(0,40),wide()?12:6); return `<div class="cgrid" data-pg="cpo">${P.items.map(card).join('')}</div>${P.bar}`; })()}`; }
function coachMarket(){ const role=UI.crole||'all'; const C=coachesOf(G.user); const mode=UI.cmode||'free';
  const srt=UI.csort||'tot'; const SF={tot:c=>-(c.sk+c.dv),sk:c=>-c.sk,dv:c=>-c.dv,sal:c=>c.sal}; const otherN=G.teams.filter(t=>t.id!==G.user).reduce((a,t)=>a+CKEYS.filter(k=>G.coach&&G.coach[t.id]&&G.coach[t.id][k]).length,0);
  const modeBar=''; const _mb=`<div class="seg"><button data-a="cmode" data-v="free" class="${mode==='free'?'on':''}">자유 계약 후보 ${(G.cmarket||[]).length}</button><button data-a="cmode" data-v="other" class="${mode==='other'?'on':''}">다른 구단 코치 ${otherN}</button></div>`;
  const M=G.cmarket||[]; const L=M.filter(c=>role==='all'||c.role===role).sort((a,b)=>SF[srt](a)-SF[srt](b));
  const chips=`<div class="chips">${[['all','전체'],...CKEYS.map(k=>[k,CROLE[k].l])].map(([k,l])=>`<button data-a="crole" data-v="${k}" class="${role===k?'on':''}">${l} <i class="cnt">${k==='all'?M.length:M.filter(c=>c.role===k).length}</i>${k!=='all'&&!C[k]?' <i class="cnt" style="background:var(--bad)">빈자리</i>':''}</button>`).join('')}</div>
    <div class="chips">${[['tot','종합순'],['sk','지도력순'],['dv','육성력순'],['sal','연봉 낮은 순']].map(([k,l])=>`<button data-a="csort" data-v="${k}" class="${srt===k?'on':''}">${l}</button>`).join('')}</div>
    <p class="small muted">자리마다 4~5명이 있고, 매달 초 새 후보가 들어오고 일부는 떠납니다. 겨울에는 다른 구단에서 정리된 코치도 시장에 나옵니다.</p>`;
  const card=c=>{ const cur=C[c.role]; const diff=cur?(c.sk+c.dv)-(cur.sk+cur.dv):null;
    return `<div class="csl"><div class="csl-h"><b>${CROLE[c.role].l}</b>${cur?`<span class="small muted">현 ${esc(cur.name)} 대비 ${diff>0?'+':''}${diff}</span>`:'<span class="pill bad">빈자리</span>'}</div>
    <div class="csl-n">${avImg({persona:'coach',pid:c.id,name:c.name,age:c.age,team:c.from!=null&&c.from!==G.user?c.from:null})}${esc(c.name)} <span class="small muted">${c.age}세</span>${c.star?' <span class="pill acc">스타 코치</span>':''}${obTag(c.ob)}${c.res===G.user?' <span class="pill warn">우선 협상</span>':''}${c.age<=41?' <span class="pill">젊은 지도자</span>':''}${c.from!=null&&c.from!==G.user&&G.teams[c.from]?` <span class="pill">전 ${esc(tshort(c.from))}</span>`:''}</div><div class="csl-s">${coachStats({...c,clan:null},G.user)}</div>
    <div class="small muted">${esc(c.car)} · 연 ${money(c.sal)}</div>
    <div class="row"><button class="btn small primary" data-a="hireCoach" data-v="${c.id}:1">1년 계약</button><button class="btn small" data-a="hireCoach" data-v="${c.id}:2">2년 계약</button></div></div>`; };
  if(mode==='other')return modeBar+`<div class="chips">${[['all','전체'],...CKEYS.map(k=>[k,CROLE[k].l])].map(([k,l])=>`<button data-a="crole" data-v="${k}" class="${role===k?'on':''}">${l}${k!=='all'&&!C[k]?' <i class="cnt" style="background:var(--bad)">빈자리</i>':''}</button>`).join('')}</div><div class="chips">${[['tot','종합순'],['sk','지도력순'],['dv','육성력순'],['sal','연봉 낮은 순']].map(([k,l])=>`<button data-a="csort" data-v="${k}" class="${srt===k?'on':''}">${l}</button>`).join('')}</div>${UI.poachMsg?`<div class="note">${esc(UI.poachMsg)}</div>`:''}`+coachOther(role,srt);
  return modeBar+chips+(L.length?(()=>{ const P=pager('cmk'+role+srt,L,wide()?12:6); return `<div class="cgrid" data-pg="${'cmk'+role+srt}">${P.items.map(card).join('')}</div>${P.bar}`; })():'<p class="small muted">이 자리 후보가 없습니다. 겨울에 새 후보가 나옵니다.</p>'); }
function coachView(){ const C=coachesOf(G.user); const m=G.mgr[G.user]; const g=coachGrade(G.user); const cn=clanCount(G.user);
  const empty=CKEYS.filter(k=>!C[k]).length;
  const gc=(l,x)=>`<div class="cg"><span>${l}</span><b class="g${x.l}">${x.l}</b></div>`;
  const sumC=`<section class="card"><div class="row between"><h2 class="sec">코치진</h2><span class="small muted">연봉 합계 ${money(coachSal(G.user))}${empty?` · <b style="color:var(--bad)">빈자리 ${empty}</b>`:''}</span></div>
    <div class="cgr">${gc('타격',g.bat)}${gc('투수',g.pit)}${gc('주루',g.run)}${gc('수비',g.def)}${gc('1군 육성',g.dev1)}${gc('2군 육성',g.dev2)}</div>
    <p class="small">${m?`${esc(m.name)} 감독 사단 코치 <b>${cn}명</b>${cn?' · 사단 코치는 지도·육성 +6':''}${(m.ego||0)>=70?' · 고집 센 감독이라 사단 밖 코치는 -2':''}`:'감독이 없습니다.'}</p>
    <p class="small muted">지도력은 1군 경기력(투수·타격·주루·수비)에, 육성력은 선수 성장 속도에 반영됩니다. 1군에서 많이 뛴 선수는 1군 코치, 나머지는 2군 코치진이 키웁니다. 비어 있는 자리는 낮은 수준으로 계산됩니다.</p></section>`;
  const cs=coachesOf(G.user); const vac1=CKEYS.some(k=>CROLE[k].g===1&&!cs[k]), vac2=CKEYS.some(k=>CROLE[k].g===2&&!cs[k]);
  const it=inTabs('coach',[['g1',`1군 코치${vac1?' · 빈자리':''}`],['g2',`2군 코치${vac2?' · 빈자리':''}`],['mk',`자유 계약 후보 ${(G.cmarket||[]).length}`],['po','다른 구단 코치']],!vac1&&vac2?'g2':'g1');
  const body=it.cur==='mk'||it.cur==='po'?(UI.cmode=it.cur==='po'?'other':'free',coachMarket()):`<div class="cgrid">${CKEYS.filter(k=>CROLE[k].g===(it.cur==='g2'?2:1)).map(coachSlot).join('')}</div>`;
  return sumC+it.bar+(UI.cMsg?`<div class="note">${esc(UI.cMsg)}</div>`:'')+body; }
/* 감독 후보의 사단 */
function clanBox(x){ const L=x.clan||[]; if(!L.length)return '<p class="small muted">사단 없음 · 코치진은 그대로 유지됩니다.</p>';
  return `<div class="clan"><div class="eyebrow">${esc(x.name)} 사단 ${L.length}명</div><span class="clan-c hd"><b></b><span></span><em>지도</em><i></i><em>육성</em></span>${L.map(c=>`<span class="clan-c"><b>${CROLE[c.role].l}</b><span>${esc(c.name)}</span>${rchip(c.sk+6)}<i>/</i>${rchip(c.dv+6)}</span>`).join('')}<p class="small muted">연봉 합계 ${money(sum(L.map(c=>c.sal)))} · 함께 오면 지도·육성 +6. 같은 자리 기존 코치는 정리됩니다(잔여 연봉 절반 정산).</p></div>`; }
