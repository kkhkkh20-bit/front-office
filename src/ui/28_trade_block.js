/* ---------- 트레이드 매물 ---------- */
/* 트레이드 매물 센터: 받은 제안 → 우리 매물 → 다른 구단 매물. 매물끼리 맞교환 후보를 바로 보여 준다 */
/* 받은 제안 한 줄 요약: 받는/보내는 선수 정보와 거래 뒤 변화 */
function offerSum(o){ const P=id=>G.players[id]; const inP=o.give.map(P).filter(Boolean), outP=o.get.map(P).filter(Boolean); let d=null; try{ d=depth(G.user); }catch(e){}
  const role=p=>!d?'':d.start.some(x=>x.id===p.id)?`${posLabel(p)} 주전`:d.sp.some(x=>x.id===p.id)?'선발 로테이션':d.pen.slice(0,4).some(x=>x.id===p.id)?'필승조':p.e1?'1군 백업':'2군';
  const mil=p=>p.foreign?'':p.mil&&p.mil.exempt?'면제':p.mil&&p.mil.done?'군필':milFree(p)?'미필':'';
  const ln=p=>`${esc(p.name)}(${posLabel(p)} · ${p.age}세 · ${money(p.sal)}${mil(p)?' · '+mil(p):''})`;
  const dS=sum(inP.map(p=>p.sal))-sum(outP.map(p=>p.sal)), dN=inP.filter(p=>!p.ys).length-outP.filter(p=>!p.ys).length; const gone=outP.map(p=>({p,r:role(p)})).filter(x=>/주전|선발|필승조/.test(x.r)); const mf=inP.filter(p=>mil(p)==='미필').length;
  return `<div class="small bk-sum"><div>받기: ${inP.map(ln).join(', ')||'없음'}</div><div>보내기: ${outP.map(p=>`${ln(p)} — ${role(p)}`).join(', ')||'없음'}</div><div><b>거래 뒤</b> 연봉 ${dS>=0?'+':''}${money(dS)}/년 · 정식 선수 ${dN>=0?'+':''}${dN}명${gone.length?` · <b class="warn">빠지는 역할: ${gone.map(x=>x.r).join(', ')}</b>`:''}${mf?` · 미필 ${mf}명 받음`:''}</div></div>`; }
function blockCenter(){ const open=tradeOpen(); const OS=(G.offers||[]);
  const mine=domestic(G.user).filter(p=>p.listed); const f=UI.blkF||'all';
  const ai=Object.values(G.players).filter(p=>p.aiListed&&p.team!=null&&p.team!==G.user).filter(p=>f==='all'||(f==='urg'&&p.aiUrg)||(f==='p'&&p.isP)||(f==='b'&&!p.isP)).sort((a,b)=>(b.aiUrg?1:0)-(a.aiUrg?1:0)||ovr(b)-ovr(a));
  const sw={}; if(open)for(const q of ai)for(const m of mine){ try{ const e=evalTrade(q.team,[m.id],[q.id]); if(e.ok){ (sw[q.id]=sw[q.id]||[]).push(m); } }catch(err){} }
  const pRow=(p,right,extra)=>`<div class="bk-r">${avImg(p)}<button class="bk-m" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b><i>${posLabel(p)} · ${p.age}세 · ${esc(tContract(p))}</i>${extra||''}</button><span class="bk-o">${rchip(Math.round(scoutReport(p).cur))}<em>${money(p.sal)}</em></span>${right||''}</div>`;
  const offs=OS.map(o=>{ const t=team(o.from); const nm=ids=>ids.map(id=>G.players[id]?`${esc(G.players[id].name)} ${rchip(Math.round(scoutReport(G.players[id]).cur))}`:'').join(' · ');
    return `<div class="bk-of">${badge(o.from,24)}<div class="bk-om"><b>${esc(tshort(o.from))}${o.blk?' · 매물 제안':''}</b><span>받기 ${nm(o.give)}</span><span>주기 ${nm(o.get)}</span><i>${dmd(o.exp)}까지${gmHeat(o.from)>=.4?' · 단장이 급합니다':''}</i>${offerSum(o)}</div><div class="bk-ob"><button class="btn small primary" data-a="offerYes" data-v="${o.id}">수락</button>${o.blk?`<button class="btn small" data-a="offerMore" data-v="${o.id}" ${o.more?'disabled':''}>더 올려 달라</button>`:''}<button class="btn small" data-a="offerNo" data-v="${o.id}">거절</button></div>${UI.blkMsg&&UI.blkMsg.id===o.id?`<div class="note">${esc(UI.blkMsg.t)}</div>`:''}</div>`; }).join('');
  const cand=domestic(G.user).filter(p=>!p.listed&&!p.ys&&!(p.joinY>G.year)).sort((a,b)=>ovr(b)-ovr(a));
  const mineRows=mine.map(p=>{ const n=OS.filter(o=>o.get.includes(p.id)).length; return pRow(p,`<div class="bk-c"><select data-a="blkWant" data-v="${p.id}" aria-label="원하는 대가">${Object.entries(WANT).map(([k,l])=>`<option value="${k}" ${(p.lw||'any')===k?'selected':''}>${l}</option>`).join('')}</select><button class="bk-u${p.urgent?' on':''}" data-a="blkUrg" data-v="${p.id}">${p.urgent?'급매 중':'급매'}</button><button class="tc-i" data-a="blkOff" data-v="${p.id}">내리기</button></div>`,n?`<span class="pill acc">제안 ${n}건</span>`:''); }).join('');
  const aiRowsA=ai.map(p=>{ const days=G.day-(p.aiLd||G.day); const s2=sw[p.id]||[];
    return pRow(p,`<div class="bk-c"><button class="btn small primary" data-a="toTrade" data-v="${p.id}">제안하기</button>${s2.length?`<button class="btn small" data-a="blkSwap" data-v="${p.id}:${s2[0].id}">${esc(s2[0].name)}과(와) 맞교환</button>`:''}</div>`,`<span class="bk-t">${badge(p.team,14)} ${esc(tshort(p.team))}${p.aiUrg?' <em class="bk-urg">급매</em>':''} <span class="pill">${BLKWHY[p.aiWhy]||'매물'}</span> <span class="small muted">${days}일째</span></span>${s2.length?`<span class="small good">우리 매물 ${esc(s2.map(m=>m.name).join(', '))}와(과) 맞교환 가능</span>`:''}`); });
  const PGb=pager('blk'+f,aiRowsA,8);
  const bt=inTabs('blkv',[['off',`받은 제안 ${OS.length}`],['mine',`우리 매물 ${mine.length}`],['lg',`다른 구단 매물 ${ai.length}`]],OS.length?'off':'lg');
  return `${!open?'<div class="note">지금은 트레이드 기간이 아닙니다. 매물 정리는 미리 해 둘 수 있습니다.</div>':deadlineBanner()}`+bt.bar+(bt.cur==='off'?`  <section class="card"><div class="row between"><h2 class="sec">받은 제안 ${OS.length}건</h2></div>${offs||'<p class="small muted">받은 제안이 없습니다. 선수를 매물로 내놓으면 관심 있는 구단이 제안을 보냅니다.</p>'}</section>`:bt.cur==='mine'?`  <section class="card"><div class="row between"><h2 class="sec">우리 매물 ${mine.length}명</h2></div>
    ${mineRows||'<p class="small muted">매물로 내놓은 선수가 없습니다.</p>'}
    <div class="row" style="gap:6px;margin-top:6px"><select id="blkAddSel" aria-label="매물로 내놓을 선수">${cand.map(p=>`<option value="${p.id}">${esc(p.name)} · ${posLabel(p)} · ${dvo(p)} · ${money(p.sal)}</option>`).join('')}</select><button class="btn small" data-a="blkAdd">매물로 등록</button></div>
    <p class="small muted keep">급매로 표시하면 제안이 더 자주 오지만, 상대도 우리가 급한 걸 알고 조금 덜 줍니다.</p></section>`:`  <section class="card"><div class="row between"><h2 class="sec">다른 구단 매물 ${ai.length}명</h2><div class="chips">${[['all','전체'],['urg','급매'],['p','투수'],['b','야수']].map(([k,l])=>`<button data-a="blkF" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div></div>
    ${PGb.items.join('')||'<p class="small muted">조건에 맞는 매물이 없습니다.</p>'}${PGb.bar}
    <p class="small muted keep">매물로 나온 선수는 그 구단이 정리하고 싶은 선수라 시세보다 싸게 거래됩니다. 급매는 더 쌉니다. 매물 등록은 최대 6주 동안 유지됩니다.</p></section>`); }
function negPanel(p){ const F=G.fa; if(!F||!F.neg)return ''; const n=F.neg[p.id]; const ag=agentOf(p);
  const log=n?n.log.slice(-8).map(x=>x.w==='구단'?`<div class="chat me"><span>우리 제안</span><b>${x.tm?esc(termsTxt(x.tm,true)):`${x.y}년 연 ${money(x.a)}`}${x.acc?' (역제안 수락)':''}</b></div>`:`<div class="chat ag"><span>${esc(ag.name)}</span><p>${esc(x.t)}</p></div>`).join(''):'';
  return `<section class="card"><div class="row between"><span class="eyebrow">에이전트 협상 · ${esc(ag.name)} (${esc(ag.firm)})</span><span class="small muted">${(AG_STYLE[ag.style]||AG_STYLE.rel).l} · 친분 ${agRel(ag)}${n?` · 협상 ${n.rounds}/${agRoundsMax(p)}회 · 분위기 ${n.mood}`:''}</span></div>
    ${n?`<span class="gauge"><i style="width:${n.mood}%;background:${n.mood>=60?'var(--good)':n.mood>=35?'var(--warn)':'var(--bad)'}"></i></span>`:''}
    ${log?`<div class="chats">${log}</div>`:'<p class="small muted">아직 제안하지 않았습니다. 조건을 내면 에이전트가 바로 답합니다. 너무 낮은 조건을 계속 내면 협상이 깨집니다.</p>'}
    ${n&&n.counter?`<div class="row"><button class="btn primary" data-a="faAccept" data-v="${p.id}">역제안 수락 (${n.counter.terms?esc(termsTxt(n.counter.terms,true)):`${n.counter.years}년 연 ${money(n.counter.annual)}`})</button></div>`:''}
    ${n&&n.closed?'<div class="note bad">에이전트가 우리와의 협상을 끝냈습니다.</div>':''}</section>`; }

