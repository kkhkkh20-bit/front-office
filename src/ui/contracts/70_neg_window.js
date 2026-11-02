/* ===== 협상 창: 선수 정보와 따로 띄운다 =====
 선수 정보 화면에는 협상 상태 한 줄과 '협상 창 열기'만 두고, 길어지는 협상 패널(FA·외국인 영입·외국인 재계약)은 별도 창에서 한다.
 협상 창을 닫으면 선수 정보로 돌아간다. 계약 조건을 한 줄씩 정하는 '협상 테이블'은 이 창에서 연다. */
const NEGW={fa:'FA 협상',fm:'외국인 영입 협상',fre:'외국인 재계약 협상'};
function negSummary(k,p){
  if(k==='fa'){ const o=G.fa&&G.fa.offers[p.id]; const n=G.fa&&G.fa.neg?G.fa.neg[p.id]:null; return o?`지금 우리 제안: ${o.terms?termsTxt(o.terms,true):`${o.years}년 연 ${money(o.annual)}`}${n&&n.deal?' · 합의':''}`:`요구 ${p.ask.years}년 연 ${money(p.ask.annual)} 수준 · 아직 제안 전`; }
  if(k==='fm'){ const R=foRivals(p); return `요구 ${usdT(p.ask)} 수준${R.length?` · 관심 구단 ${R.length}곳`:''}${p.fneg?' · 협상 중':''}`; }
  if(k==='fre'){ const N=((G.contract||{}).fre||{})[p.id]; return `재계약 기준선 근처 ${usdT(Math.round(foReFloor(p)/USD)*USD)}${N?' · 협상 중':''}`; }
  return ''; }
function negDoor(k,p){ return `<button class="mt-door negdoor" data-a="negOpen" data-v="${k}:${p.id}">${avImg(p)}<span><b>${NEGW[k]} 창 열기</b><i>${esc(negSummary(k,p))}</i></span><em>›</em></button>`; }
function negBody(k,p){
  if((k==='fa'||k==='fm')&&p.team!=null)return `<div class="note good">${p.team===G.user?'계약을 마쳤습니다.':`${esc(tname(p.team))}과(와) 계약했습니다.`}</div>${UI.faMsg&&UI.faMsg.id===p.id?`<div class="note">${esc(UI.faMsg.t)}</div>`:''}`;
  if(k==='fre'){ const C=G.contract; if(!C||C.done||!C.foreignEnd.includes(p.id)||C.foreignDrop.includes(p.id))return '<div class="note">재계약 협상이 끝났습니다.</div>'; }
  if(k==='fa')return negPanel(p)+ngtDoor('fa',p)+pitchCard(p)+(UI.faMsg&&UI.faMsg.id===p.id?`<div class="note">${esc(UI.faMsg.t)}</div>`:'');
  if(k==='fm')return foPanel(p);
  if(k==='fre')return foRePanel(p);
  return ''; }
function negWinSheet(){ const W=UI.negWin; const p=G.players[W.id]; if(!p)return ''; const rp=scoutReport(p); const cv=curView(p,rp);
  return `<div class="scrim" data-a="negClose"><div class="sheet gut negw" data-stop="1" role="dialog" aria-label="${NEGW[W.k]}">
    <div class="sheet-head"><div class="row" style="flex-wrap:nowrap">${avImg(p)}<div><div class="eyebrow">${NEGW[W.k]}</div><h2 class="sec">${esc(p.name)}</h2><p class="small muted">${posLabel(p)} · ${p.age}세${p.foreign?` · ${esc(p.nat||'')}`:''} · ${cv.est?'예상':'현재'} ${cv.v!=null?rchip(cv.v):'?'}${cv.est&&cv.lo!=null?` <span class="muted">범위 ${cv.lo}~${cv.hi}</span>`:''}</p></div></div><button class="x" data-a="negClose" aria-label="닫기">×</button></div>
    ${UI.sheet!=null?`<button class="btn small" data-a="negClose">‹ 선수 정보로</button>`:`<div class="row"><button class="btn small" data-a="negClose">닫기</button><button class="btn small" data-a="negInfo" data-v="${p.id}">선수 정보 보기</button></div>`}
    <div class="negw-body">${negBody(W.k,p)}</div></div></div>`; }
Object.assign(A,{ negInfo(v){ UI.negWin=null; A.player(v); },
  negOpen(v){ const [k,id]=v.split(':'); UI.negWin={k,id:+id}; renderSheet(); },
  negClose(v,el,e){ if(el&&el.classList.contains('scrim')&&e&&e.target.closest('[data-stop]'))return; UI.negWin=null; renderSheet(); render(); } });
