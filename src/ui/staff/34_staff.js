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
    smkt:staffMarketView,
    anl:anlView,
    tc:trainCoachView,
    camp:campView,
    data:dataPage,
    fac:facView,
    lead:leadCard,
    mil:milView,
    med:()=>fmOn()?medFM():csec('부상 방지·병원',medBody(),`<span class="small muted">${PREV[G.med.prev].l} · ${esc(HOSP[G.med.hosp].name)}</span>`)}; const h=mergedBody('staff',s,H0);
  return subTabs('staff')+h;
}
/* ---------- 코치진 ---------- */
function clanName(id){ if(!id)return ''; const m=Object.values(G.mgr).find(x=>x&&x.id===id)||(G.mmarket||[]).find(x=>x.id===id); return m?m.name:''; }
function coachTag(c){ const m=G.mgr[G.user]; if(!c||!c.clan)return ''; if(m&&c.clan===m.id)return '<span class="pill good">감독 사단 +6</span>'; const n=clanName(c.clan); return n?`<span class="pill">${esc(n)} 사단</span>`:''; }
/* 코치 카드: 잘하는 분야 태그 + 세부 능력(맡은 자리 능력 먼저) */
function coachAbBox(c){ if(!c)return ''; const a=cAb(c); const D=CDOM[c.role]||[]; const S=cStrong(c), W=cWeak(c); const order=[...new Set([...D,'yng','com','ana'])],all=[...order,...Object.keys(CAB).filter(k=>!order.includes(k))];
  return `<div class="cab-t">${S.map(k=>`<span class="pill good">${CAB[k]} 강점</span>`).join('')}${W.map(k=>`<span class="pill warn">${CAB[k]} 약함</span>`).join('')}</div>
  <div class="staff-primary-grid">${[...new Set([...D,'yng'])].map(k=>`<span><i>${CAB[k]}</i>${rchip(a[k])}</span>`).join('')}</div><details class="cab"><summary class="small">세부 능력</summary><div class="cab-g">${all.map((k,i)=>`<span class="cab-r${i<D.length?' dom':''}"><span>${CAB[k]}${i<D.length?' ·':''}</span>${rchip(a[k])}</span>`).join('')}</div><p class="small muted">· 표시는 이 자리에서 쓰는 능력입니다. 지도력은 그 능력과 데이터 분석, 육성력은 그 능력과 유망주 육성에서 나옵니다. 선수 훈련은 집중 항목의 지도 능력이 속도를 바꿉니다.</p></details>`; }
function coachStats(c,tid){ const e=k=>effC(c,tid,k); const m=G.mgr[tid]; const why=v=>v>0?`${m?m.name+' ':''}감독 사단이라 손발이 맞아 +${v}(이미 반영된 값)`:`고집 센 ${m?m.name+' ':''}감독과 사단이 아니라 ${v}(이미 반영된 값, 기본 능력보다 낮게 일함)`; const d=k=>{ const v=e(k)-c[k]; return v?`<i class="${v>0?'up':'dn'}" title="${esc(why(v))}">${v>0?'+':''}${v}</i>`:''; };
  return `<span class="cst"><span>지도</span>${rchip(e('sk'))}${d('sk')}</span><span class="cst"><span>육성</span>${rchip(e('dv'))}${d('dv')}</span>`; }
/* 우리 코치 연장·승격 */
function coachDealRow(k,c){ const E=[1,2].map(a=>coachExtTerms(k,a)).filter(T=>T&&!T.why); const P=promoteTerms(k); let h='';
  if(E.length)h+=E.map(T=>`<button class="btn small" data-a="extCoach" data-v="${k}:${T.add}">${T.add}년 연장<i class="pc-s">연 ${money(T.sal)}</i></button>`).join('');
  else { const T=coachExtTerms(k,1); if(T&&T.why)h+=`<span class="small muted">${esc(T.why)}</span>`; }
  if(P&&!P.why)h+=UI.cprom===k?`<button class="btn small primary" data-a="promoteCoach" data-v="${k}">정말 ${CROLE[P.to].l}로 승격<i class="pc-s">연 ${money(P.sal)}${P.old?` · ${esc(P.old.name)}은(는) ${CROLE[k].l}로`:` · ${CROLE[k].l} 자리 빔`}</i></button><button class="btn small" data-a="cpromCancel">취소</button>`:`<button class="btn small" data-a="cpromAsk" data-v="${k}">${CROLE[P.to].l}로 승격</button>`;
  return h?`<div class="row">${h}</div>`:''; }
function coachSlot(k){ const C=coachesOf(G.user); const c=C[k]; const r=CROLE[k];
  if(!c)return `<div class="csl empty" data-role="${k}" data-selected="${UI.cslot===k}"><div class="csl-h"><b>${r.l}</b><span class="pill bad">빈자리</span></div><p class="small muted">${r.d}</p><button class="btn small primary" data-a="coachFind" data-v="${k}">후보 보기</button></div>`;
  return `<div class="csl" data-role="${k}" data-selected="${UI.cslot===k}"><div class="csl-h"><b>${r.l}</b>${coachTag(c)}</div>
    <div class="csl-n">${avImg({persona:'coach',pid:c.id,name:c.name,age:c.age,team:G.user})}${esc(c.name)} <span class="small muted">${c.age}세</span></div>
    <div class="csl-s">${coachStats(c,G.user)}</div>${coachAbBox(c)}
    <div class="small muted">${esc(c.car)} · 연 ${money(c.sal)} · ${ctLeftTxt(c)}</div>
    ${staffBioBox(c,'coach',G.user)}<div class="csl-acts">${coachDealRow(k,c)}<div class="row"><button class="btn small" data-a="person" data-v="c:${k}">인물 카드</button><button class="btn small" data-a="coachFind" data-v="${k}">교체</button>${UI.cfire===k?`<button class="btn small danger" data-a="fireCoach" data-v="${k}">정말 계약 해지</button>`:`<button class="btn small" data-a="cfireAsk" data-v="${k}">계약 해지</button>`}</div></div></div>`; }
function chanceTxt(p){ return p>=.65?'응할 가능성 큼':p>=.45?'반반':p>=.25?'쉽지 않음':'거의 어려움'; }
function coachOther(role,srt){ const C=coachesOf(G.user); const SF={tot:c=>-(c.sk+c.dv),sk:c=>-c.sk,dv:c=>-c.dv,sal:c=>c.sal};
  const L=[]; for(const t of G.teams){ if(t.id===G.user)continue; const TC=G.coach&&G.coach[t.id]; if(!TC)continue; for(const k of CKEYS){ const c=TC[k]; if(c&&(role==='all'||k===role))L.push({t,k,c}); } }
  L.sort((a,b)=>SF[srt](a.c)-SF[srt](b.c));
  const card=({t,k,c})=>{ const cur=C[k]; const diff=cur?(c.sk+c.dv)-(cur.sk+cur.dv):null; const T1=poachTerms(t.id,k,k); const pr=PROMO[k]; const T2=pr?poachTerms(t.id,k,pr):null; const cd=G.poachCd&&G.poachCd[c.id]>G.day;
    const m=G.mgr[t.id]; const clan=c.clan&&m&&c.clan===m.id;
    const b=(T,l)=>`<button class="btn small ${T.promo?'':'primary'}" data-a="poach" data-v="${t.id}:${k}:${T.toRole}" ${cd?'disabled':''}>${l}<i class="pc-s">연 ${money(T.sal)}${T.comp?` · 보상 ${money(T.comp)}`:''} · ${chanceTxt(T.chance)}</i></button>`;
    return `<div class="csl" data-role="${k}" data-selected="${UI.cslot===k}"><div class="csl-h"><b>${badge(t.id,14)} ${esc(t.city+' '+t.nick)} ${CROLE[k].l}</b>${cur?`<span class="small muted">우리 ${esc(cur.name)} 대비 ${diff>0?'+':''}${diff}</span>`:'<span class="pill bad">우리 빈자리</span>'}</div>
      <div class="csl-n">${avImg({persona:'coach',pid:c.id,name:c.name,age:c.age,team:t.id})}${esc(c.name)} <span class="small muted">${c.age}세</span>${c.star?' <span class="pill acc">스타 코치</span>':''}${obTag(c.ob)}${clan?` <span class="pill warn">${esc(m.name)} 감독 사단</span>`:''}</div><div class="csl-s">${coachStats({...c,clan:null},G.user)}</div>
      <div class="small muted">${esc(c.car)} · 현재 연 ${money(c.sal)} · ${ctLeftTxt(c)}</div>
      ${coachAbBox(c)}${staffBioBox(c,'coach',t.id)}<div class="pcb">${b(T1,'같은 자리로 영입')}${T2?b(T2,`${CROLE[pr].l}로 승격 제의`):''}</div>${cd?`<p class="small muted">${dmd(G.poachCd[c.id])}까지 다시 만나 주지 않습니다.</p>`:''}</div>`; };
  return `<p class="small muted tipme">다른 구단 코치는 연봉을 올려 주거나(+35%) 한 단계 높은 자리를 주면(+15%, 응할 가능성 크게 오름) 옮겨 옵니다. ${poachOff()?'지금은 비시즌이라 계약이 1년 이하 남은 코치는 보상금 없이 데려올 수 있습니다.':'시즌 중에는 남은 계약에 대한 보상금을 원 소속 구단에 냅니다.'} 감독 사단 코치는 감독 곁을 잘 떠나지 않고, 우리 구단 출신은 잘 돌아옵니다. 빼 오면 그 구단 단장과 친분이 떨어집니다. 거절당하면 30일 동안 다시 제의할 수 없습니다.</p>
    ${(()=>{ const P=pager('cpo',L.slice(0,40),cardPageSize()); return `<div class="cgrid" data-pg="cpo">${P.items.map(card).join('')}</div>${P.bar}`; })()}`; }
function coachMarket(){ const role=UI.crole||'all'; const C=coachesOf(G.user); const mode=UI.cmode||'free';
  const srt=UI.csort||'tot'; const SF={tot:c=>-(c.sk+c.dv),sk:c=>-c.sk,dv:c=>-c.dv,sal:c=>c.sal}; const otherN=G.teams.filter(t=>t.id!==G.user).reduce((a,t)=>a+CKEYS.filter(k=>G.coach&&G.coach[t.id]&&G.coach[t.id][k]).length,0);
  const modeBar=''; const _mb=`<div class="seg"><button data-a="cmode" data-v="free" class="${mode==='free'?'on':''}">채용 후보 ${(G.cmarket||[]).length}</button><button data-a="cmode" data-v="other" class="${mode==='other'?'on':''}">다른 구단 코치 ${otherN}</button></div>`;
  const M=G.cmarket||[]; const L=M.filter(c=>role==='all'||c.role===role).sort((a,b)=>SF[srt](a)-SF[srt](b));
  const chips=`<div class="chips coach-role-buttons">${[['all','전체'],...CKEYS.map(k=>[k,CROLE[k].l])].map(([k,l])=>`<button data-a="crole" data-v="${k}" class="${role===k?'on':''}">${l} <i class="cnt">${k==='all'?M.length:M.filter(c=>c.role===k).length}</i>${k!=='all'&&!C[k]?' <i class="cnt" style="background:var(--bad);color:#fff">빈자리</i>':''}</button>`).join('')}</div>
    <div class="chips">${[['tot','종합순'],['sk','지도력순'],['dv','육성력순'],['sal','연봉 낮은 순']].map(([k,l])=>`<button data-a="csort" data-v="${k}" class="${srt===k?'on':''}">${l}</button>`).join('')}</div>
    <p class="small muted">자리마다 4~5명이 있고, 매달 초 새 후보가 들어오고 일부는 떠납니다. 겨울에는 다른 구단에서 정리된 코치도 시장에 나옵니다.</p>`;
  const cmpT=(c,cur)=>{ const f=(x,k)=>dv(effC(x,G.user,k)); const a=f(c,'sk')-f(cur,'sk'), b=f(c,'dv')-f(cur,'dv'); const s=v=>`${v>0?'+':''}${v}`; return `현 ${esc(cur.name)} 대비 지도 ${s(a)} · 육성 ${s(b)}`; }; /* 우리 팀에 왔을 때 실효값끼리 같은 척도로 */
  const card=c=>{ const cur=C[c.role];
    const kind=c.dv-c.sk>=12?'유망주 성장에 강한 후보':c.sk-c.dv>=12?'즉시 전력(경기력) 지도에 강한 후보':c.sal<=Math.min(...(G.cmarket||[]).filter(x=>x.role===c.role).map(x=>x.sal))?'낮은 비용으로 자리를 메우는 후보':'';
    return `<div class="csl"><div class="csl-h"><b>${CROLE[c.role].l}</b>${cur?`<span class="small muted">${cmpT(c,cur)}</span>`:'<span class="pill bad">빈자리</span>'}</div>${kind?`<p class="small muted" style="margin:2px 0">${kind}${CROLE[c.role].g===2?' · 2군 코치의 육성력은 2군에서 뛰는 선수 성장에, 지도력은 2군 경기력에 쓰입니다':''}</p>`:''}
    <div class="csl-n">${avImg({persona:'coach',pid:c.id,name:c.name,age:c.age,team:c.from!=null&&c.from!==G.user?c.from:null})}${esc(c.name)} <span class="small muted">${c.age}세</span>${c.star?' <span class="pill acc">스타 코치</span>':''}${obTag(c.ob)}${c.res===G.user?' <span class="pill warn">우선 협상</span>':''}${c.age<=41?' <span class="pill">젊은 지도자</span>':''}${c.from!=null&&c.from!==G.user&&G.teams[c.from]?` <span class="pill">전 ${esc(tshort(c.from))}</span>`:''}</div><div class="csl-s">${coachStats({...c,clan:null},G.user)}</div><div class="row csl-hire"><button class="btn small primary" data-a="hireCoach" data-v="${c.id}:1">1년 계약(${ctSeasonsTxt(1)})</button><button class="btn small" data-a="hireCoach" data-v="${c.id}:2">2년 계약(${ctSeasonsTxt(2)})</button></div>${coachAbBox(c)}
    <div class="small muted">${esc(c.car)} · 연 ${money(c.sal)}</div>
    ${staffBioBox(c,'coach',null)}</div>`; };
  if(mode==='other')return modeBar+`<div class="chips coach-role-buttons">${[['all','전체'],...CKEYS.map(k=>[k,CROLE[k].l])].map(([k,l])=>`<button data-a="crole" data-v="${k}" class="${role===k?'on':''}">${l}${k!=='all'&&!C[k]?' <i class="cnt" style="background:var(--bad);color:#fff">빈자리</i>':''}</button>`).join('')}</div><div class="chips">${[['tot','종합순'],['sk','지도력순'],['dv','육성력순'],['sal','연봉 낮은 순']].map(([k,l])=>`<button data-a="csort" data-v="${k}" class="${srt===k?'on':''}">${l}</button>`).join('')}</div>${UI.poachMsg?`<div class="note">${esc(UI.poachMsg)}</div>`:''}`+cmkCmp(role,coachOther(role,srt));
  if(!L.length)return modeBar+chips+'<p class="small muted">이 자리 후보가 없습니다. 겨울에 새 후보가 나옵니다.</p>';
  const vw=`<div class="seg smk-vw"><button data-a="cmkView" data-v="t" class="${UI.cmkView!=='c'?'on':''}">비교 표</button><button data-a="cmkView" data-v="c" class="${UI.cmkView==='c'?'on':''}">카드</button></div>`;
  if(UI.cmkView==='c'){ const P=pager('cmk'+role+srt,L,cardPageSize()); return modeBar+chips+vw+cmkCmp(role,`<div class="cgrid" data-pg="${'cmk'+role+srt}">${P.items.map(card).join('')}</div>${P.bar}`); }
  /* 비교 목록: 한 줄에 후보·지도·육성·연봉·계약 버튼, 아래 줄에 이 자리 핵심 능력. 이름을 누르면 그 줄 아래에 상세 카드 */
  const rows=L.map(c=>stRow({c,face:{persona:'coach',pid:c.id,name:c.name,age:c.age,team:c.from!=null&&c.from!==G.user?c.from:null},sub:`${CROLE[c.role].l} · ${c.age}세${c.star?' · 스타':''}`,tag:C[c.role]?'':'<span class="pill bad">빈자리</span>',cur:C[c.role],open:String(UI.cmkOpen)===String(c.id),openA:'cmkOpen',
    acts:`<button class="btn small primary" data-a="hireCoach" data-v="${c.id}:1">1년 계약</button><button class="btn small" data-a="hireCoach" data-v="${c.id}:2">2년</button>`,detail:()=>role==='all'?`<div class="cmk-pair"><div><div class="eyebrow">후보</div>${card(c)}</div><div><div class="eyebrow">지금 우리 ${CROLE[c.role].l}</div>${coachSlot(c.role)}</div></div>`:card(c)})).join('');
  return modeBar+chips+vw+cmkCmp(role,`<div class="st-list">${stHead()}${rows}</div>`)+`${role==='all'?'<p class="small muted">보직을 고르면 지금 우리 코치 카드가 옆에 나와 후보와 바로 비교할 수 있습니다. 후보 이름을 누르면 그 자리 현재 코치 카드와 나란히 펼쳐집니다.</p>':''}<p class="small muted">지도·육성 옆 숫자는 지금 그 자리 코치와의 차이(우리 팀에서 일할 때 기준). 이름을 누르면 능력 카드가 열립니다.</p>`; }
/* 스태프 한 줄(시장·우리 코치진 공용) */
const stHead=()=>`<div class="st-r st-h"><span>코치</span><span>지도</span><span>육성</span><span>연봉</span><span>이 자리 핵심 능력</span></div>`;
function stRow(o){ const c=o.c, a=cAb(c), cur=o.cur;
  const dl=k=>{ if(!cur||cur===c)return ''; const v=dv(effC(c,G.user,k))-dv(effC(cur,G.user,k)); return `<em class="${v>0?'good':v<0?'bad':'muted'}">${v>0?'+':''}${v}</em>`; };
  const ca=cur&&cur!==c?cAb(cur):null; /* 핵심 능력도 지금 그 자리 코치와의 차이(카페 11-08: 화면을 오가며 비교하던 불편) */
  const ab=[...new Set([...(CDOM[c.role]||[]),'yng'])].map(k=>{ const v=ca&&a[k]!=null&&ca[k]!=null?dv(a[k])-dv(ca[k]):null; return `<span class="st-ab"><i>${CAB[k].replace(' 지도','').replace(' 관리','').replace('유망주 육성','유망주')}</i>${rchip(a[k])}${v?`<em class="${v>0?'good':'bad'}">${v>0?'+':''}${v}</em>`:''}</span>`; }).join('');
  return `<div class="st-r${o.open?' on':''}"><button class="st-n" data-a="${o.openA}" data-v="${o.key??c.id}">${avImg(o.face)}<span><b>${esc(c.name)}${o.tag?' '+o.tag:''}</b><i>${o.sub}</i></span></button>
    <span class="st-v"><i>지도</i>${rchip(effC(c,G.user,'sk'))}${dl('sk')}</span><span class="st-v"><i>육성</i>${rchip(effC(c,G.user,'dv'))}${dl('dv')}</span><span class="st-sal">${money(c.sal)}${o.yrs!=null?`<i>${o.ct||`잔여 ${o.yrs}년`}</i>`:''}</span>
    <span class="st-act">${o.acts}</span><span class="st-abs">${ab}</span></div>${o.open?`<div class="st-x">${o.detail()}</div>`:''}`; }
/* 우리 코치진 표: 보직마다 한 줄, 빈자리는 후보 보기. 이름을 누르면 그 줄 아래에 능력 카드(연장·승격·해지 버튼 포함) */
function coachTable(){ const C=coachesOf(G.user); const slots=[...CKEYS.filter(k=>C[k]),...CKEYS.filter(k=>!C[k])];
  const row=k=>{ const c=C[k], r=CROLE[k];
    if(!c)return `<div class="st-r st-emp"><span class="st-n"><span class="av ini">-</span><span><b>${r.l}</b><i class="bad">빈자리</i></span></span><span class="st-act"><button class="btn small primary" data-a="coachFind" data-v="${k}">후보 보기</button></span><span class="st-abs small muted">${r.d}</span></div>`;
    return stRow({c,key:k,face:{persona:'coach',pid:c.id,name:c.name,age:c.age,team:G.user},sub:`${r.l} · ${c.age}세`,tag:'',cur:null,open:UI.cslotOpen===k,openA:'cslotOpen',yrs:Math.max(0,c.yrs),ct:ctLeftTxt(c),
      acts:`<button class="btn small" data-a="coachFind" data-v="${k}">교체</button>`,detail:()=>coachSlot(k)}); };
  return `<div class="st-list">${stHead()}${slots.map(row).join('')}</div>`; }
function coachView(){ if(fmOn()&&!UI.coachCards&&!UI._smk)return staffFM(); /* PC: FM식 스태프 개요(34b_staff_fm.js), '보직 카드 보기'로 아래 카드 화면 */ const C=coachesOf(G.user); const m=G.mgr[G.user]; const g=coachGrade(G.user); const cn=clanCount(G.user);
  const empty=CKEYS.filter(k=>!C[k]).length;
  const gc=(l,x)=>`<div class="cgg"><span>${l}</span><b class="g${x.l}">${x.l}</b></div>`;
  const sumC=`<section class="card"><div class="row between"><h2 class="sec">코치진</h2><span class="small muted">연봉 합계 ${money(coachSal(G.user))}${empty?` · <b style="color:var(--bad)">빈자리 ${empty}</b>`:''}</span></div>
    <div class="cgr">${gc('타격',g.bat)}${gc('투수',g.pit)}${gc('주루',g.run)}${gc('수비',g.def)}${gc('1군 육성',g.dev1)}${gc('2군 육성',g.dev2)}</div>
    <p class="small">${m?`${esc(m.name)} 감독 사단 코치 <b>${cn}명</b>${cn?` · 사단 코치는 지도·육성 +6 · 감독이 바뀌면 사단 코치 ${cn}명(${Object.values(coachesOf(G.user)).filter(c=>c&&c.clan===m.id).map(c=>esc(c.name)).join('·')})이 함께 떠날 수 있고 +6도 사라집니다`:''}${(m.ego||0)>=70?' · 고집 센 감독이라 사단 밖 코치는 -2(카드 숫자에 이미 반영)':''}`:'감독이 없습니다.'}</p>
    <details class="coach-guide"><summary class="small muted">지도 효과와 육성 적용 기준</summary><p class="small muted">분야별 지도는 해당 선수 능력의 성장에 반영됩니다. 배터리코치는 포수 수비 성장·볼 배합을, 주루코치는 주루 성장·도루·추가 진루의 보내기/정지 판단을 돕습니다. 타격·투수코치는 각 타격·투구 항목을 지도합니다. 선수 성장에는 그해 1군·2군 출전 비율만큼 1군 코치와 2군 코치진의 육성력이 섞여 들어갑니다(2군에서만 뛰면 2군 코치진). 비어 있는 자리는 낮은 수준으로 계산됩니다.</p></details></section>`;
  const cs=coachesOf(G.user); const vac1=CKEYS.some(k=>CROLE[k].g===1&&!cs[k]), vac2=CKEYS.some(k=>CROLE[k].g===2&&!cs[k]);
  if(UI._smk){ UI.cmode=UI.smkSrc==='oth'?'other':'free'; return (UI.cMsg?`<div class="note">${esc(UI.cMsg)}</div>`:'')+coachMarket(); } /* 스태프 시장 */
  const slots=[...CKEYS.filter(k=>cs[k]),...CKEYS.filter(k=>!cs[k])],PG=pager('coachSlots',slots,cardPageSize());
  return (fmOn()?'<div class="ws-own sfw">':'')+(UI.cMsg?`<div class="note">${esc(UI.cMsg)}</div>`:'')+(fmOn()?'<div class="row" style="margin-bottom:8px"><button class="btn small" data-a="sfCards">◀ 스태프 개요</button></div>':'')+csec('1군·2군 코치 보직',coachTable(),`<span class="small muted">${slots.length}개 보직 · ${vac1||vac2?'빈 보직은 아래쪽':'전원 배치'}</span>`)+axSec()+sumC+smkLink('coach','코치 채용')+(fmOn()?'</div>':''); }
/* 스태프 시장(FM의 스태프 찾기처럼 한 곳): 감독·코치·스카우트·분석원 후보와 다른 구단 소속 스태프 */
function smkLink(k,l){ return `<div class="row" style="margin:8px 0"><button class="btn small" data-a="smkGo" data-v="${k}">${l} → 스태프 시장</button></div>`; }
/* 분석원 관리(사용자 11-06: 전력분석원 채용·해지가 데이터 화면 오른쪽 좁은 칸에 묻혀 있었다): 우리 분석원·역할·해지와 채용 후보를 한 화면에 크게 */
function anlView(){ UI._smk=true; let mine='', mk=''; try{ UI._anlMine=true; mine=dataPage(); UI._anlMine=false; mk=dataPage(); }finally{ UI._smk=false; UI._anlMine=false; } const out=csec('우리 전력분석팀 · 역할·해지',mine,`<span class="small muted">${anaList().length}/${ANA_MAX}명 · 연 ${money(anaSal())}</span>`)+csec('채용 후보',mk,`<span class="small muted">${anaList().length}/${ANA_MAX}명 · 연 ${money(anaSal())}</span>`); return fmOn()?`<div class="ws-own sfw">${out}</div>`:out; }
function staffMarketView(){ const k=UI.smkK||'mgr'; const src=UI.smkSrc||'free'; const K=[['mgr','감독'],['coach','코치'],['sc','스카우트'],['an','분석원']];
  const chips=`<div class="chips staff-market-modes" style="margin:4px 0 8px">${K.map(([v,l])=>`<button data-a="smkK" data-v="${v}" class="${k===v?'on':''}">${l}</button>`).join('')}</div>${k==='coach'||k==='sc'?`<div class="chips" style="margin:0 0 10px">${[['free','자유 계약 후보'],['oth','다른 구단 소속']].map(([v,l])=>`<button data-a="smkSrc" data-v="${v}" class="${src===v?'on':''}">${l}</button>`).join('')}</div>`:''}`;
  UI._smk=true; let h=''; try{ h=k==='mgr'?mgrBody():k==='coach'?coachView():k==='sc'?scoutBody():dataPage(); }finally{ UI._smk=false; }
  const out=csec('스태프 시장',chips+h,`<span class="small muted">${esc(stPrestigeLine())}</span>`); return fmOn()?`<div class="ws-own sfw">${out}</div>`:out; } /* PC: 자동 칸 나누기가 버튼 줄을 카드 아래로 보내던 문제. 버튼 위, 카드는 칸 안 스크롤 */
/* 감독 후보의 사단 */
function clanBox(x){ const L=x.clan||[]; if(!L.length)return '<p class="small muted">사단 없음 · 코치진은 그대로 유지됩니다.</p>';
  return `<div class="clan"><div class="eyebrow">${esc(x.name)} 사단 ${L.length}명</div><span class="clan-c hd"><b></b><span></span><em>지도</em><i></i><em>육성</em></span>${L.map(c=>`<span class="clan-c"><b>${CROLE[c.role].l}</b><span>${esc(c.name)}</span>${rchip(c.sk+6)}<i>/</i>${rchip(c.dv+6)}</span>`).join('')}<p class="small muted">연봉 합계 ${money(sum(L.map(c=>c.sal)))} · 함께 오면 지도·육성 +6. 같은 자리 기존 코치는 정리됩니다(잔여 연봉 절반 정산).</p></div>`; }

/* 보조 코치: 시설 4단계 이상 하나마다 1자리(최대 3) */
function axSec(){ const n=axSlots(), X=G.coachX||[]; const rows=X.map(c=>`<div class="item row between"><span><b>${esc(c.name)}</b> <span class="small muted">보조 ${axP(c)?'투수':'타격'}코치 · 육성 ${c.dv} · ${c.yrs}년 · 연 ${money(c.sal)}</span></span><button class="btn small" data-a="fireAsst" data-v="${c.id}">내보내기</button></div>`).join('');
  const cand=X.length<n?(G.cmarket||[]).filter(c=>AX_ROLES.includes(c.role)).sort((a,b)=>b.dv-a.dv).slice(0,5).map(c=>`<div class="item row between"><span>${esc(c.name)} <span class="small muted">${CROLE[c.role].l} 출신 · 육성 ${c.dv} · 연 ${money(c.sal)}</span></span><button class="btn small primary" data-a="hireAsst" data-v="${c.id}:2">2년 영입</button></div>`).join(''):'';
  return csec('보조 코치',`<p class="small muted">세부 훈련 시설이 4단계 이상인 곳마다 보조 코치 1자리(최대 3)가 열립니다. 보조 코치는 투수 또는 타자 성장에 1명당 최대 +2.5%를 보탭니다.</p>${rows||(n?'':'<p class="small muted">아직 열린 자리가 없습니다.</p>')}${cand?`<div class="eyebrow">후보</div>${cand}`:''}`,`<span class="small muted">${X.length}/${n}자리</span>`); }

/* 코치 시장: 보직을 고르면 지금 우리 코치 카드를 옆(휴대폰은 위)에 붙여 후보와 나란히 비교(카페 11-08) */
function cmkCmp(role,inner){ if(role==='all')return inner; return `<div class="cmk-split"><aside class="cmk-cur"><div class="eyebrow">지금 우리 ${CROLE[role].l}</div>${coachSlot(role)}</aside><div class="cmk-list">${inner}</div></div>`; }
