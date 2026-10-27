/* ---------- FA 센터 ---------- */
function agentAv(p,expr){ const ag=agentOf(p); return avImg({persona:'agent',pid:'ag:'+ag.name+ag.firm,age:46,female:u01('agf',p.id)>.8,expr:expr||null,name:ag.name}); }
function faHeat(id){ return Object.keys((G.fa&&G.fa.ai[id])||{}).length; }
function faBig(p){ const o=G.fa.offers[p.id]; const ai=Object.keys(G.fa.ai[p.id]||{}).map(Number); const rp=scoutReport(p); const h=curLine(p);
  const st=!h?'기록 없음':p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)} · ${ipStr(h.outs)}이닝`:'-'):(h.pa?`OPS ${fmt3(bRate(h).ops)} · ${h.hr}홈런`:'-');
  return `<div class="fab-c ${UI.faSel===p.id?'on':''}"><div class="fab-h">${avImg(p,true)}<div><span class="pill acc">${p.faGrade}등급</span><b>${esc(p.name)}</b><span>${posLabel(p)} · ${p.age}세 · ${tshort(p.faFrom)}</span><span>${st}</span></div><b class="pc-ov" style="--c:${rcol(rp.cur)}">${rp.cur}</b></div>
    <div class="fab-r"><span class="small muted">요구</span><b>${p.ask.years}년 연 ${money(p.ask.annual)}</b>${p.ask0&&p.ask.annual<p.ask0?`<span class="small muted">처음 ${money(p.ask0)}에서 낮춤</span>`:""}</div>
    <div class="fab-r"><span class="small muted">영입 경쟁</span><span class="heat"><i style="width:${Math.min(100,ai.length*20)}%"></i></span><span class="fab-t">${ai.slice(0,5).map(t=>badge(t,16)).join('')||'<span class="small muted">아직 없음</span>'}</span></div>
    ${o?`<div class="note good">우리 제시 ${o.years}년 연 ${money(o.annual)}</div>`:''}
    <button class="btn small ${UI.faSel===p.id?'':'primary'}" data-a="faSel" data-v="${p.id}">${UI.faSel===p.id?'협상실 닫기':'협상실 열기'}</button></div>`; }
function faRoom(p){ const ag=agentOf(p); const n=G.fa.neg&&G.fa.neg[p.id]; const expr=n?(n.counter?'flat':n.hot||n.deal?'smile':n.mood<40?'angry':null):null; const ai=Object.keys(G.fa.ai[p.id]||{}).map(Number); const b=budget();
  return `<section class="card faroom"><div class="tgm">${agentAv(p,expr)}<div><b>${esc(ag.name)} 에이전트 · ${esc(ag.firm)}</b><span class="small muted">${ag.style==='hard'?'깐깐한 협상가':ag.style==='soft'?'유연한 편':'보통'} · ${esc(p.name)} 담당${ai.length?` · 경쟁 구단 ${ai.length}곳: ${ai.map(t=>esc(tshort(t))).join(', ')}`:''}</span></div></div>
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
    <section class="card"><div class="row between"><h2 class="sec">빅 네임</h2><span class="small muted">선수는 매일 제안을 비교하다가 계약합니다. 관심 구단이 많을수록 빨리 결정합니다.</span></div><div class="fabg">${ids.filter(id=>G.players[id]&&ovr(G.players[id])>=55).slice(0,3).map(id=>faBig(G.players[id])).join('')||'<p class="small muted">능력 55 이상인 대어는 남아 있지 않습니다.</p>'}</div></section>
    ${ours.length?`<section class="card"><h2 class="sec">우리 구단 FA · 잔류 협상</h2><div class="fl">${ours.map(p=>`<div class="flr">${pMini(p)}<span class="small muted">요구 ${p.ask.years}년 ${money(p.ask.annual)} · 관심 ${faHeat(p.id)}곳</span><button class="tc-i go" data-a="faSel" data-v="${p.id}">협상</button></div>`).join('')}</div></section>`:''}
    <section class="card"><div class="row between"><h2 class="sec">전체 FA</h2><div class="chips">${[['all','전체'],['H','타자'],['P','투수'],['gA','A등급'],['gB','B등급'],['gC','C등급']].map(([k,l])=>`<button data-a="faPos" data-v="${k}" class="${pf===k?'on':''}">${l}</button>`).join('')}</div></div>
      <div class="fl">${list.slice(0,40).map(p=>{ const o=F.offers[p.id]; return `<div class="flr">${pMini(p)}<span class="small"><span class="pill acc">${p.faGrade}</span> ${p.ask.years}년 ${money(p.ask.annual)}${faHeat(p.id)?` · <b style="color:#ffb547">경쟁 ${faHeat(p.id)}</b>`:''}${o?' · <b style="color:#6fe39a">제시함</b>':''}</span><button class="tc-i ${o?'':'go'}" data-a="faSel" data-v="${p.id}">협상</button></div>`; }).join('')||'<p class="small muted">조건에 맞는 FA가 없습니다.</p>'}</div>
      <p class="small muted">${compRuleTxt()}</p></section>
    <section class="card"><h2 class="sec">FA 계약 소식</h2>${F.results.length?`<div class="feed">${F.results.slice(0,14).map(r=>`<div class="fd"><span class="pill ${r.to===G.user?'good':''}">${r.grade}</span><span>${esc(r.name)} · ${esc(tshort(r.from))} → <b>${badge(r.to,14)} ${esc(tshort(r.to))}</b> ${r.years}년 ${money(r.annual)}${r.kind==='cheap'?' <span class="pill warn">헐값</span>':''}${r.ask0&&r.kind!=='cheap'&&r.annual<r.ask0*.85?` <span class="small muted">요구 ${money(r.ask0)}</span>`:''}${r.compPlayer?` · 보상 ${esc(r.compPlayer)}`:''}</span><i>${dsh(r.day)}</i></div>`).join('')}</div>`:'<p class="small muted">아직 계약 소식이 없습니다.</p>'}</section>`; }
function faHomeCard(){ if(!faLive())return ''; const F=G.fa; const ids=F.pool.filter(id=>G.players[id]&&G.players[id].team==null); if(!ids.length)return ''; const top=ids.sort((a,b)=>G.players[b].ask.annual-G.players[a].ask.annual).slice(0,3).map(id=>G.players[id]);
  return `<section class="card fahome"><div class="row between"><h2 class="sec">FA 시장 ${G.day>=F.openDay?'진행 중':'개장 임박'}</h2><button class="btn small primary" data-a="go" data-v="transfer:fa">FA 시장으로</button></div><div class="fl">${top.map(p=>`<div class="flr">${pMini(p)}<span class="small muted">경쟁 ${faHeat(p.id)}곳</span><button class="tc-i go" data-a="faOpen" data-v="${p.id}">협상</button></div>`).join('')}</div></section>`; }
