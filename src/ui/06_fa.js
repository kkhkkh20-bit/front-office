/* ---------- FA 센터 ---------- */
function agAv(ag,expr){ return avImg({persona:'agent',pid:'agt'+ag.id+ag.name,age:ag.size==='big'?52:ag.size==='mid'?46:39,female:!!ag.female,expr:expr||null,name:ag.name}); }
function agentAv(p,expr){ return agAv(agentOf(p),expr); }
/* 에이전트 소개 한 줄: 규모 · 스타일 · 친분 · 우리와 계약 실적 */
function agLine(ag){ const st=AG_STYLE[ag.style]||AG_STYLE.rel; const r=agRel(ag); const dl=(ag.deals&&ag.deals[G.user])||0;
  return `<span class="pill ${ag.size==='big'?'acc':''}">${AG_SIZE[ag.size]}</span><span class="pill" title="${esc(st.d)}">${st.l}</span><span class="pill ${r>=60?'good':r<40?'bad':''}">친분 ${r} · ${agRelLab(r)}</span>${dl?`<span class="small muted">우리와 계약 ${dl}건</span>`:''}`; }
function agClients(ag){ const F=G.fa; if(!F)return []; return F.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null&&agentOf(p)===ag).sort((a,b)=>ovr(b)-ovr(a)); }
/* 에이전트 명단: 이번 겨울 누가 어떤 고객을 맡았는지, 우리와 친분은 어떤지 */
function agDirCard(){ const A=agInit(); const rows=A.map(ag=>{ const cl=agClients(ag); return `<div class="agr">${agAv(ag)}<div class="agm"><b>${esc(ag.name)} <span class="small muted">${esc(ag.firm)}</span></b><span class="agl">${agLine(ag)}</span><span class="small">${cl.length?`이번 겨울 고객 ${cl.length}명: ${cl.slice(0,4).map(p=>`<button class="lnk" data-a="faSel" data-v="${p.id}">${esc(p.name)}</button>`).join(', ')}${cl.length>4?' 등':''}`:'<span class="muted">이번 겨울 FA 고객 없음</span>'}</span></div></div>`; }).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">에이전트</h2><span class="small muted">친분이 높으면 요구가 낮아지고, 우선 제안·라스트 룩을 받습니다</span></div><div class="agdir">${rows}</div>
    <details class="frule"><summary class="small">에이전트 규칙 보기</summary><p class="small muted">대형 에이전시는 대어를 많이 맡고 자존심이 셉니다. 낮은 제안, 역제안 무시, 협상 결렬은 친분을 크게 깎습니다. 친분이 높거나 우리와 계약을 여러 번 한 에이전트는 협상이 열리기 전에 고객을 먼저 보여 줍니다(우선 제안). 대어 FA는 바로 사인하지 않고 4~6일마다 다른 구단 제안을 모아 다시 묻는 시장 확인 라운드를 거칩니다(대어 3라운드, 준척 2라운드, 경매형은 1라운드 더, 실속형은 1라운드 덜). 마지막 라운드에서 우리 제안이 조금 밀리면, 친한 에이전트는 같은 조건을 맞출 기회(라스트 룩)를 줍니다. 친분은 해마다 조금씩 보통으로 돌아옵니다.</p></details></section>`; }
function faHeat(id){ return Object.keys((G.fa&&G.fa.ai[id])||{}).length; }
function faBig(p){ const o=G.fa.offers[p.id]; const ai=Object.keys(G.fa.ai[p.id]||{}).map(Number); const rp=scoutReport(p); const h=curLine(p);
  const st=!h?'기록 없음':p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:'-'):(h.pa?`OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'-');
  return `<div class="fab-c ${UI.faSel===p.id?'on':''}"><div class="fab-h">${avImg(p,true)}<div><span class="pill acc">${p.faGrade}등급</span><b>${esc(p.name)}</b><span>${posLabel(p)} · ${p.age}세 · ${tshort(p.faFrom)}</span><span>${st}</span></div><b class="pc-ov" style="--c:${rcol(rp.cur)}">${dv(rp.cur)}</b></div>
    <div class="fab-r"><span class="small muted">요구</span><b>${p.ask.years}년 연 ${money(p.ask.annual)}</b>${p.ask0&&p.ask.annual<p.ask0?`<span class="small muted">처음 ${money(p.ask0)}에서 낮춤</span>`:""}</div>
    <div class="fab-r"><span class="small muted">영입 경쟁</span><span class="heat"><i style="width:${Math.min(100,ai.length*20)}%"></i></span><span class="fab-t">${ai.slice(0,5).map(t=>badge(t,16)).join('')||'<span class="small muted">아직 없음</span>'}</span></div>
    ${o?`<div class="note good">우리 제시 ${o.years}년 연 ${money(o.annual)}</div>`:''}
    <button class="btn small ${UI.faSel===p.id?'':'primary'}" data-a="faSel" data-v="${p.id}">${UI.faSel===p.id?'협상실 닫기':'협상실 열기'}</button></div>`; }
function faRoom(p){ const ag=agentOf(p); const n=G.fa.neg&&G.fa.neg[p.id]; const expr=n?(n.counter?'flat':n.hot||n.deal?'smile':n.mood<40?'angry':null):null; const ai=Object.keys(G.fa.ai[p.id]||{}).map(Number); const b=budget();
  const mk=G.fa.mk&&G.fa.mk[p.id]; const need=agShopN(p); const st=AG_STYLE[ag.style]||AG_STYLE.rel;
  const mkTxt=need?(mk&&mk.done?'시장 확인 끝 · 곧 결정':mk&&mk.ll?`라스트 룩 · ${dsh(mk.ll.until)}까지 ${mk.ll.years}년 연 ${money(mk.ll.annual)}`:`시장 확인 ${mk?mk.round:0}/${need}라운드${mk&&mk.next?` · 다음 보고 ${dsh(mk.next)}`:''}`):'조건이 맞으면 바로 결정하는 선수';
  return `<section class="card faroom"><div class="tgm">${agentAv(p,expr)}<div><b>${esc(ag.name)} 에이전트 · ${esc(ag.firm)}</b><span class="agl">${agLine(ag)}</span><span class="small muted">${esc(st.d)} · ${esc(p.name)} 담당${ai.length?` · 경쟁 구단 ${ai.length}곳: ${ai.map(t=>esc(tshort(t))).join(', ')}`:''}</span></div></div>
    <div class="note ${mk&&mk.ll?'warn':''}">${mkTxt}${need?` <span class="small muted">· ${agTier(p)==='star'?'대어':'준척'} FA는 바로 사인하지 않고 다른 구단 제안을 받아 본 뒤 결정합니다</span>`:''}</div>
    ${mk&&mk.ll?`<div class="row"><button class="btn primary" data-a="faLL" data-v="${p.id}">라스트 룩 맞추기 (${mk.ll.years}년 연 ${money(mk.ll.annual)})</button></div>`:''}
    ${G.fa.pitch&&G.fa.pitch[p.id]&&G.day<=G.fa.pitch[p.id].until?`<div class="row"><button class="btn primary" data-a="agPitchOk" data-v="${p.id}">우선 제안 수락 (${G.fa.pitch[p.id].years}년 연 ${money(G.fa.pitch[p.id].annual)})</button></div>`:''}
    ${UI.faMsg&&UI.faMsg.id===p.id?`<div class="note">${esc(UI.faMsg.t)}</div>`:''}
    <div class="row">${budgetTag(Math.round(((UI.offer&&UI.offer.id===p.id?UI.offer:(G.fa.offers[p.id]||p.ask)).annual)*b.rem))}<span class="small muted">예산 여유 ${money(b.roomGoal)}</span></div>
    ${offerForm(p)}${negPanel(p)}</section>`; }
function faCelebrate(){ const F=G.fa; if(!F||!F.results)return; G.faCel=G.faCel||[]; const r=F.results.find(x=>x.to===G.user&&x.from!==G.user&&!G.faCel.includes(x.id+':'+x.day)); if(!r)return;
  G.faCel.push(r.id+':'+r.day); if(G.faCel.length>40)G.faCel.splice(0,10); UI.stamp={title:'FA 영입',msg:`${r.name} · ${r.years}년 연 ${money(r.annual)}${r.compPlayer?` · 보상선수 ${r.compPlayer} 이탈`:''}`}; sfx('cheer_big',.7); }
function faCenter(){ return compView()+faCenter0(); }
function faCenter0(){ const F=G.fa;
  if(!faLive()){ const nx=domestic(G.user).filter(p=>!p.foreign&&p.svc>=faSvc(p)-1&&!p.faC).sort((a,b)=>ovr(b)-ovr(a));
    const res=F&&F.results&&F.results.length?`<div class="feed">${F.results.slice(0,10).map(r=>`<div class="fd"><span class="pill">${r.grade}</span><span>${esc(r.name)} · ${esc(tshort(r.from))} → <b>${esc(tshort(r.to))}</b> ${r.years}년 ${money(r.annual)}</span><i>${dsh(r.day)}</i></div>`).join('')}</div>`:'';
    return `<div class="fahero"><b>FA 시장</b><span>포스트시즌 뒤 11월 2일 공시 · 11월 6일 협상 시작 · 1월 24일(캠프 전날) 사실상 마감</span></div>
      <section class="card"><h2 class="sec">올겨울 FA가 될 우리 선수</h2>${nx.length?`<div class="fl">${nx.map(p=>`<div class="flr">${pMini(p)}<span class="small muted">예상 ${faGradeOf(p,Object.values(G.players).filter(q=>q.team!=null))}등급(FA 보상 기준)</span>${canExtend(p)?`<button class="tc-i go" data-a="extOpen" data-v="${p.id}">연장 협상</button>`:'<span class="flx"></span>'}</div>`).join('')}</div>`:'<p class="small muted">없습니다.</p>'}<p class="small muted">FA가 되기 전에 비FA 다년계약으로 묶어 둘 수 있습니다.</p></section>
      ${res?`<section class="card"><h2 class="sec">지난 FA 계약</h2>${res}</section>`:''}`; }
  const ids=F.pool.filter(id=>G.players[id]&&G.players[id].team==null).sort((a,b)=>G.players[b].ask.annual-G.players[a].ask.annual);
  const open=G.day>=F.openDay; const d1=open?G.day-F.openDay+1:F.openDay-G.day; const left=KD(1,24)>G.day?KD(1,24)-G.day:dnum(G.year+1,1,24)-G.day;
  const mine=Object.keys(F.offers).length; const signed=F.results.length; const b=budget();
  const pf=UI.faPos||'all'; const list=ids.map(id=>G.players[id]).filter(p=>pf==='all'||(pf==='P'?p.isP:pf==='H'?!p.isP:p.faGrade===pf.slice(1)));
  const sel=UI.faSel&&G.players[UI.faSel]&&ids.includes(UI.faSel)?G.players[UI.faSel]:null;
  const ours=ids.map(id=>G.players[id]).filter(p=>p.faFrom===G.user);
  return `<div class="fahero live"><b>FA 시장 ${open?`협상 ${d1}일째`:`협상 시작까지 ${d1}일`}</b><span>${open?`캠프 전 마감까지 ${Math.max(0,left)}일 · `:''} 남은 FA ${ids.length}명 · 계약 ${signed}건 · 우리 제시 ${mine}건 · 예산 여유 ${money(b.roomGoal)}</span></div>
    ${sel?faRoom(sel):''}
    ${agDirCard()}
    <section class="card"><div class="row between"><h2 class="sec">빅 네임</h2><span class="small muted">선수는 매일 제안을 비교하다가 계약합니다. 관심 구단이 많을수록 빨리 결정합니다.</span></div><div class="fabg">${ids.filter(id=>G.players[id]&&ovr(G.players[id])>=55).slice(0,3).map(id=>faBig(G.players[id])).join('')||'<p class="small muted">능력 69 이상인 대어는 남아 있지 않습니다.</p>'}</div></section>
    ${ours.length?`<section class="card"><h2 class="sec">우리 구단 FA · 잔류 협상</h2><div class="fl">${ours.map(p=>`<div class="flr">${pMini(p)}<span class="small muted">요구 ${p.ask.years}년 ${money(p.ask.annual)} · 관심 ${faHeat(p.id)}곳</span><button class="tc-i go" data-a="faSel" data-v="${p.id}">협상</button></div>`).join('')}</div></section>`:''}
    <section class="card"><div class="row between"><h2 class="sec">전체 FA</h2><div class="chips">${[['all','전체'],['H','타자'],['P','투수'],['gA','A등급'],['gB','B등급'],['gC','C등급']].map(([k,l])=>`<button data-a="faPos" data-v="${k}" class="${pf===k?'on':''}">${l}</button>`).join('')}</div></div>
      <div class="fl">${list.slice(0,40).map(p=>{ const o=F.offers[p.id]; return `<div class="flr">${pMini(p)}<span class="small"><span class="pill acc">${p.faGrade}</span> ${p.ask.years}년 ${money(p.ask.annual)}${faHeat(p.id)?` · <b style="color:#ffb547">경쟁 ${faHeat(p.id)}</b>`:''}${o?' · <b style="color:#6fe39a">제시함</b>':''}</span><button class="tc-i ${o?'':'go'}" data-a="faSel" data-v="${p.id}">협상</button></div>`; }).join('')||'<p class="small muted">조건에 맞는 FA가 없습니다.</p>'}</div>
      <p class="small muted">${compRuleTxt()}</p></section>
    <section class="card"><h2 class="sec">FA 계약 소식</h2>${F.results.length?`<div class="feed">${F.results.slice(0,14).map(r=>`<div class="fd"><span class="pill ${r.to===G.user?'good':''}">${r.grade}</span><span>${esc(r.name)} · ${esc(tshort(r.from))} → <b>${badge(r.to,14)} ${esc(tshort(r.to))}</b> ${r.years}년 ${money(r.annual)}${r.kind==='cheap'?' <span class="pill warn">헐값</span>':''}${r.ask0&&r.kind!=='cheap'&&r.annual<r.ask0*.85?` <span class="small muted">요구 ${money(r.ask0)}</span>`:''}${r.compPlayer?` · 보상 ${esc(r.compPlayer)}`:''}</span><i>${dsh(r.day)}</i></div>`).join('')}</div>`:'<p class="small muted">아직 계약 소식이 없습니다.</p>'}</section>`; }
function faHomeCard(){ if(!faLive())return ''; const F=G.fa; const ids=F.pool.filter(id=>G.players[id]&&G.players[id].team==null); if(!ids.length)return ''; const top=ids.sort((a,b)=>G.players[b].ask.annual-G.players[a].ask.annual).slice(0,3).map(id=>G.players[id]);
  return `<section class="card fahome"><div class="row between"><h2 class="sec">FA 시장 ${G.day>=F.openDay?'진행 중':'개장 임박'}</h2><button class="btn small primary" data-a="go" data-v="transfer:fa">FA 시장으로</button></div><div class="fl">${top.map(p=>`<div class="flr">${pMini(p)}<span class="small muted">경쟁 ${faHeat(p.id)}곳</span><button class="tc-i go" data-a="faOpen" data-v="${p.id}">협상</button></div>`).join('')}</div></section>`; }
