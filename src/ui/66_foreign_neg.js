/* ---------- 외국인 선수 협상 패널(선수 상세): 보장·인센티브 정하기, 우리 매력과 경쟁 구단 비교 ---------- */
function foPanel(p){ const per=period(); const mid=per==='season'; const repl=mid&&(G.sea.repl[G.user]||0)>=F_REPL_MAX; const open=foreignOpen();
  const cap=foCap(p); let F=UI.fo&&UI.fo.id===p.id?UI.fo:null; if(!F){ const g=Math.min(cap,Math.round(p.ask*.85/USD)*USD); F=UI.fo={id:p.id,g,i:Math.max(0,Math.min(cap-g,p.ask-g)),msg:''}; }
  const me=foAppeal(p,G.user); const Rv=foRivals(p); const best=Rv[0]; const N=p.fneg; const known=!!N||Rv.length===0;
  const pct=f=>{ const v=Math.round((f-1)*100); return `${v>=0?'+':''}${v}%`; };
  const parts=me.parts.map(x=>`<div class="row between small"><span>${esc(x[0])}</span><b class="${x[1]>0?'good':x[1]<0?'bad':''}">${x[1]>0?'+':''}${Math.round(x[1]*100)}%</b></div>`).join('');
  const v=foVal(F.g,F.i)*me.f, floor=foFloor(p), tgt=Math.max(floor,best?best.v*1.01:0);
  const step=(k,d,l)=>`<button class="btn small" data-a="foStep" data-v="${k}:${d}">${l}</button>`;
  const err=!open?'지금은 외국인 선수를 영입할 수 없습니다.':repl?'이번 시즌 외국인 교체 횟수를 다 썼습니다.':(()=>{ const a0=p.ask; p.ask=F.g+F.i; const e=foreignCheck(G.user,p); p.ask=a0; return e; })();
  return `<section class="card fo"><div class="row between"><h2 class="sec">계약 협상</h2><span class="small muted">상한 ${Math.round(cap/USD)}만 달러</span></div>
    <p class="small">요구 총액 <b>${usdT(p.ask)}</b>(${money(p.ask)}) · 보통 보장 85% + 인센티브 15%로 받기를 원합니다. 선수는 인센티브를 보장의 절반 정도 가치로 봅니다.${mid?` 시즌 중 계약이라 남은 기간분 ${Math.round(remainFrac()*100)}%만 지급합니다.`:''}</p>
    <div class="fo-in">
      <div><span class="muted small">보장 연봉</span><b>${usdT(F.g)}</b><i class="small muted">${money(F.g)}</i><div class="row">${step('g',-5,'-5만')}${step('g',-1,'-1만')}${step('g',1,'+1만')}${step('g',5,'+5만')}</div></div>
      <div><span class="muted small">인센티브(규정 출전 시)</span><b>${usdT(F.i)}</b><i class="small muted">${money(F.i)}</i><div class="row">${step('i',-5,'-5만')}${step('i',5,'+5만')}</div></div>
    </div>
    <p class="small">총액 ${usdT(F.g+F.i)} · 선수가 느끼는 가치 ${usdT(foVal(F.g,F.i))} x 우리 구단 매력 ${pct(me.f)}</p>
    <details class="small"${UI.foOpen?' open':''}><summary>우리 구단 매력 ${pct(me.f)} 근거</summary>${parts||'<p class="small muted">특별한 장단점이 없습니다.</p>'}</details>
    <div class="fo-cmp small"><div class="row between"><span>경쟁</span><b>${Rv.length?`${Rv.length}개 구단 관심`:'관심 구단 없음'}</b></div>
      ${best?(known?`<div class="row between"><span>가장 강한 곳: ${badge(best.tid,16)} ${esc(tshort(best.tid))}</span><span>보장 ${usdT(best.g)} + ${usdT(best.i)} · 매력 ${pct(best.f)}</span></div>`:'<p class="muted">한 번 제안하면 에이전트가 경쟁 구단 조건을 알려 줍니다.</p>'):''}
      <div class="row between"><span>지금 조건으로</span><b class="${v>=tgt?'good':'bad'}">${v>=tgt?'사인 가능':known||!best?'모자람':'경쟁 조건에 따라 다름'}</b></div>
      ${N&&N.dl?`<p class="warn">${dmd(N.dl)}까지 기다려 준다고 했습니다. 그 뒤에는 ${esc(tshort(N.dlT))}로 갑니다.</p>`:''}${N?`<p class="muted">이번 주 제안 ${N.n}/3 · 분위기 ${N.mood}</p>`:''}</div>
    ${err?`<div class="note bad">${esc(err)}</div>`:''}
    <button class="btn primary block" data-a="foGo" data-v="${p.id}" ${err?'disabled':''}>이 조건으로 제안</button>${F.msg?`<div class="note">${esc(F.msg)}</div>`:''}</section>`; }
Object.assign(A,{ foRe(v){ A.player(v); UI.ptab='mgmt'; renderSheet(); },
  foStep(v){ const [k,d]=String(v).split(':'); const F=UI.fo; if(!F)return; const p=G.players[F.id]; if(!p)return; const cap=foCap(p);
    const top=F.re?Math.round(p.newSal*2):cap; if(k==='g')F.g=clamp(F.g+(+d)*USD,MIN_SAL,top-F.i); else F.i=clamp(F.i+(+d)*USD,0,top-F.g); F.msg=''; renderSheet(); },
  foGo(v){ const F=UI.fo; if(!F||F.id!==+v)return; const r=F.re?foReOffer(+v,F.g,F.i):foOffer(+v,F.g,F.i); if(F.re){ F.msg=r.msg; save(); render(); return; } F.msg=r.msg; if(r.ok){ UI.fo=null; toast(r.msg); UI.sheet=null; save(); render(); return; } save(); renderSheet(); } });
/* 우리 외국인 재계약 협상(보류권: 경쟁 상대는 해외 제안뿐) */
function foRePanel(p){ const C=G.contract; const N=(C.fre||{})[p.id]; let F=UI.fo&&UI.fo.id===p.id?UI.fo:null;
  if(!F){ F=UI.fo={id:p.id,g:Math.round(p.newSal*.85/USD)*USD,i:0,msg:'',re:true}; }
  const O=foReOut(p); const f=foReComfort(p); const v=foVal(F.g,F.i)*f, tgt=foReFloor(p);
  const step=(k,d,l)=>`<button class="btn small" data-a="foStep" data-v="${k}:${d}">${l}</button>`; const h=seasonTotal(p,C.y,'1군');
  return `<section class="card fo"><div class="row between"><h2 class="sec">재계약 협상</h2><span class="small muted">보류권 · 국내 경쟁 없음</span></div>
    <p class="small">지금 ${usdT(p.sal)} · 요구 ${usdT(p.newSal)}(${money(p.newSal)}) · 지난 시즌 ${h?statLine(h,p):'기록 없음'}${h?` · WAR ${warOf(h,p).toFixed(1)}`:''}</p>
    <p class="small">보류권 때문에 국내 다른 구단은 이 선수와 협상할 수 없습니다. 경쟁 상대는 해외 제안뿐입니다: <b>${O&&!O.none?`${O.k} 구단 ${usdT(O.v)} 수준`:'해외 제안 없음'}</b></p>
    <div class="fo-in">
      <div><span class="muted small">보장 연봉</span><b>${usdT(F.g)}</b><i class="small muted">${money(F.g)}</i><div class="row">${step('g',-5,'-5만')}${step('g',-1,'-1만')}${step('g',1,'+1만')}${step('g',5,'+5만')}</div></div>
      <div><span class="muted small">인센티브(규정 출전 시)</span><b>${usdT(F.i)}</b><i class="small muted">${money(F.i)}</i><div class="row">${step('i',-5,'-5만')}${step('i',5,'+5만')}</div></div>
    </div>
    <div class="fo-cmp small"><div class="row between"><span>남고 싶은 마음(적응·재계약 연차·충성)</span><b>${f>=1?'+':''}${Math.round((f-1)*100)}%</b></div>
      <div class="row between"><span>지금 조건으로</span><b class="${v>=tgt?'good':'bad'}">${v>=tgt?'합의 가능':'모자람'}</b></div>
      ${N?`<p class="muted">제안 ${N.n}/3 · 분위기 ${N.mood}</p>`:''}</div>
    ${N&&N.ok?'<div class="note">이미 합의했습니다. 연봉 계약 확정 때 반영됩니다.</div>':`<button class="btn primary block" data-a="foGo" data-v="${p.id}">이 조건으로 재계약 제안</button>`}${F.msg?`<div class="note">${esc(F.msg)}</div>`:''}</section>`; }
