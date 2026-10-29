/* ---------- 협상 테이블(FM 계약 협상 화면 구조) ----------
   위: 에이전트(또는 선수 본인)의 말  ·  가운데: 계약 조건 한 줄씩(값 조정 + 요구 조건 표시)  ·  아래: 총액·예산·상한 부담과 제안 버튼
   FA: 역할 약속·기간·계약금·연봉·옵션·거부권 / 비FA 다년: 기간·계약금·연봉·옵션·거부권 / 연봉 협상: 연봉만 */
const NGT_K={fa:'FA 계약',ext:'비FA 다년계약',sal:'연봉 협상'};
function ngtExtDem(p,y){ return round5(extDemand(p,y)*agExtMul(p)); }
/* 에이전트가 말하는 요구(비FA는 친분이 낮을수록 부풀려 말한다) */
function ngtDemand(N){ const p=G.players[N.id];
  if(N.k==='fa')return termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years});
  if(N.k==='ext'){ const y=N.T.years; const d=ngtExtDem(p,y); const ag=hasAgent(p)?agentOf(p):null; const k=ag?agRel(ag):50; const est=round5(d*(1+(k>=60?0:k>=40?.03:.06)+hn('xe'+G.year,p.id)*.02)); return termsDemand(p,'ext',{annual:est,years:y}); }
  const n=salNeg(N.id); return {years:1,annual:n?n.ask:p.sal,bonus:0,opt:0,role:null,ntc:false}; }
function ngtOpen(k,id){ const p=G.players[id]; if(!p)return; let T;
  if(k==='fa'){ const o=G.fa&&G.fa.offers[id]; T=o&&o.terms?{...o.terms}:termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years}); }
  else if(k==='ext'){ const y=p.extCounter&&p.extCounter.terms?p.extCounter.years:p.age<=29?4:p.age<=32?3:2; T=p.extCounter&&p.extCounter.terms?{...p.extCounter.terms}:{...termsDemand(p,'ext',{annual:ngtExtDem(p,y),years:y}),role:null}; T.annual=round5(Math.max(MIN_SAL,T.annual*.94)); }
  else { const n=salNeg(id); T={years:1,annual:n?(n.cur??n.off):p.sal,bonus:0,opt:0,role:null,ntc:false}; }
  UI.ngt={k,id,T,msg:null}; renderSheet(); }
function ngtStep(v){ return v>=3000?50:v>=1000?20:v>=300?10:5; }
function ngtRows(N,D){ const p=G.players[N.id]; const T=N.T; const R=[];
  const mrow=(f,l,sub,max)=>{ const v=T[f]||0, d=D[f]||0; const ok=v>=d; const st=ngtStep(Math.max(v,d,100));
    return `<div class="ngr ${d?(ok?'ok':'lo'):''}"><div class="ngl"><b>${l}</b>${sub?`<i>${sub}</i>`:''}</div>
      <div class="ngc"><button class="ngb" data-a="ngtSet" data-v="${f}:${-st*5}" aria-label="${l} 크게 내리기">«</button><button class="ngb" data-a="ngtSet" data-v="${f}:${-st}" aria-label="${l} 내리기">−</button><b class="num ngv" id="ngv-${f}">${money(v)}</b><button class="ngb" data-a="ngtSet" data-v="${f}:${st}" aria-label="${l} 올리기">+</button><button class="ngb" data-a="ngtSet" data-v="${f}:${st*5}" aria-label="${l} 크게 올리기">»</button></div>
      <div class="ngd">${d?`<span class="pill ${ok?'good':'warn'}">요구 ${money(d)}</span>`:f==='opt'?'<span class="small muted">요구 없음</span>':''}</div>
      <input type="range" class="ngrg" min="0" max="${Math.max(max,v)}" step="${st}" value="${v}" data-ngr="${f}" aria-label="${l}"></div>`; };
  if(N.k==='fa'){ const L=roleSet(p); R.push(`<div class="ngr ${T.role<=D.role?'ok':'lo'}"><div class="ngl"><b>역할 약속</b><i>${T.role===0?'지키지 못하면 매달 선수 기분 하락':'약속 없음'}</i></div><div class="ngc seg">${L.map((l,i)=>`<button data-a="ngtSet" data-v="role:=${i}" class="${T.role===i?'on':''}">${l}</button>`).join('')}</div><div class="ngd"><span class="pill ${T.role<=D.role?'good':'warn'}">요구 ${L[D.role]}</span></div></div>`); }
  if(N.k!=='sal'){ const ys=N.k==='fa'?[1,2,3,4,5,6]:[2,3,4,5,6]; R.push(`<div class="ngr ${T.years===D.years||N.k==='ext'?'ok':'lo'}"><div class="ngl"><b>계약 기간</b><i>${N.k==='fa'?'FA 기간은 길수록 선수가 좋아합니다':'기간에 따라 요구액이 바뀝니다'}</i></div><div class="ngc seg">${ys.map(y=>`<button data-a="ngtSet" data-v="years:=${y}" class="${T.years===y?'on':''}">${y}년</button>`).join('')}</div><div class="ngd">${N.k==='fa'?`<span class="pill ${T.years>=D.years?'good':'warn'}">요구 ${D.years}년</span>`:''}</div></div>`);
    R.push(mrow('bonus','계약금','계약할 때 한 번에 지급 · 상한에는 연평균으로 반영',round5(Math.max(D.bonus*2,500))));
  }
  R.push(mrow('annual','연봉',N.k==='sal'?`지금 ${money(p.sal)} · 구단 산정안 ${money((salNeg(N.id)||{}).off||p.sal)}`:'매 시즌 지급',round5(Math.max(D.annual*2,p.sal*1.5,300))));
  if(N.k!=='sal'){ R.push(mrow('opt','옵션 (연간 최대)',`${p.isP?(isSPr(p)?'120이닝':'50이닝'):'400타석'} 달성 시 지급 · 선수는 절반 아래 가치로 봅니다`,round5(Math.max(D.annual*.4,100))));
    if(D.ntc||T.ntc||ovr(p)>=60)R.push(`<div class="ngr ${!D.ntc||T.ntc?'ok':'lo'}"><div class="ngl"><b>트레이드 거부권</b><i>있으면 계약 기간 동안 이 선수를 트레이드할 수 없습니다</i></div><div class="ngc seg"><button data-a="ngtSet" data-v="ntc:=0" class="${!T.ntc?'on':''}">없음</button><button data-a="ngtSet" data-v="ntc:=1" class="${T.ntc?'on':''}">부여</button></div><div class="ngd">${D.ntc?`<span class="pill ${T.ntc?'good':'warn'}">요구</span>`:'<span class="small muted">요구 없음</span>'}</div></div>`); }
  return R.join(''); }
/* 요구 대비 지금 조건(정확한 숫자 대신 말로) */
function ngtGap(N,D){ const p=G.players[N.id]; let r;
  if(N.k==='fa'){ const ag=agentOf(p); const ai=Object.keys(G.fa.ai[p.id]||{}).length; const want=offScore(p.ask)*agWantMul(ag)*(1+.03*ai)*(p.faFrom===G.user?.95:1); r=offScore({annual:termsVal(N.T,D),years:N.T.years})/(want*.97); }
  else if(N.k==='ext')r=termsVal(N.T,D)/termsVal(D,D); else { r=N.T.annual/Math.max(1,D.annual); return r>=.99?['good','요구액에 맞췄습니다. 바로 합의됩니다']:['warn',`요구까지 ${money(D.annual-N.T.annual)} 남았습니다. 합의가 안 되면 선수가 요구를 조금 낮춰 답합니다`]; }
  const riv=N.k==='fa'&&Object.keys(G.fa.ai[p.id]||{}).length;
  return r>=1?['good',riv?'요구는 채웠습니다. 다른 구단 조건과도 비교합니다':'요구 조건을 채웠습니다']:r>=.9?['warn','조금 모자랍니다. 역제안이 올 수 있습니다']:r>=.75?['bad','차이가 큽니다. 분위기가 나빠집니다']:['bad','무리한 조건입니다. 협상이 깨질 수 있습니다']; }
function ngtLog(N){ const p=G.players[N.id]; if(N.k!=='fa'||!G.fa||!G.fa.neg||!G.fa.neg[p.id])return ''; const ag=agentOf(p);
  let L=G.fa.neg[p.id].log.slice(); if(L.length&&L[L.length-1].w==='에이전트')L.pop(); /* 마지막 답은 위 말풍선에 이미 나온다 */ L=L.slice(-6); if(!L.length)return '';
  return `<details class="ng-log"><summary class="small muted">지난 협상 기록 ${L.length}건</summary>${L.map(x=>x.w==='구단'?`<div class="ngm me"><i>우리 제안${x.acc?' (역제안 수락)':''}</i>${esc(x.tm?termsTxt(x.tm,true):`${x.y}년 연 ${money(x.a)}`)}</div>`:`<div class="ngm ag"><i>${esc(ag.name)}</i>${esc(x.t)}</div>`).join('')}</details>`; }
function ngtSheet(){ const N=UI.ngt; const p=G.players[N.id]; if(!p)return ''; const D=ngtDemand(N); const T=N.T;
  const ag=hasAgent(p)?agentOf(p):null; const fn=N.k==='fa'&&G.fa&&G.fa.neg?G.fa.neg[p.id]:null;
  const lastAg=fn&&fn.log.length&&fn.log[fn.log.length-1].w==='에이전트'?fn.log[fn.log.length-1].t:null;
  const say=N.msg||lastAg||(N.k==='sal'?`${ag?'선수와 이야기를 나눠 봤습니다. ':''}구단 산정안은 ${money((salNeg(p.id)||{}).off||p.sal)}이지만, ${ag?'저희는':'저는'} ${money(D.annual)}은(는) 받아야 한다고 봅니다.`:`${ag?'제 의뢰인이 원하는 조건입니다. ':'제가 원하는 조건입니다. '}${termsTxt(D,true)}${D.role===0?` · ${roleSet(p)[0]}`:''}${D.ntc?' · 트레이드 거부권':''}. 이 선에서 맞춰 주시면 바로 이야기가 됩니다.`);
  const expr=fn?(fn.counter?'flat':fn.hot||fn.deal?'smile':fn.mood<40?'angry':null):null;
  const [gc,gt]=ngtGap(N,D);
  const tot=(T.bonus||0)+T.annual*(T.years||1); const capAvg=T.annual+Math.round((T.bonus||0)/(T.years||1)); const ci=capInfo(G.user); const b=budget();
  const capRoom=ci.cap-ci.pay+(p.team===G.user?p.sal+capBOf(p):0);
  const ctr=N.k==='fa'?fn&&fn.counter:N.k==='ext'?(p.extCounter&&p.extCounter.until>=G.day?p.extCounter:null):null;
  const ctrTx=ctr?(ctr.terms?termsTxt(ctr.terms,true):`${ctr.years}년 연 ${money(ctr.annual)}`):'';
  const rounds=fn?`협상 ${fn.rounds}/${agRoundsMax(p)}회 · 분위기 ${fn.mood}`:N.k==='sal'?'한 주에 한 번 제시':'한 주에 한 번 제안';
  const closed=fn&&fn.closed;
  return `<div class="scrim" data-a="ngtClose"><div class="sheet gut ngt" data-stop="1" role="dialog" aria-label="계약 협상">
    <div class="sheet-head"><div class="ng-h">${avImg(p)}<div><span class="eyebrow">${NGT_K[N.k]} · ${esc(posLabel(p))} · ${p.age}세</span><h2 class="sec">${esc(p.name)}</h2><span class="small muted">${N.k==='fa'?`${p.faGrade}등급 FA · 관심 구단 ${Object.keys(G.fa.ai[p.id]||{}).length}곳`:`지금 연봉 ${money(p.sal)} · ${ctText(p)}`}</span></div></div><button class="x" data-a="ngtClose" aria-label="닫기">×</button></div>
    <div class="ng-ag">${ag?agAv(ag,expr):avImg(p)}<div class="ng-say"><span class="small muted">${ag?`${esc(ag.name)} 에이전트 · ${esc(ag.firm)} · ${esc((AG_STYLE[ag.style]||AG_STYLE.rel).l)}`:`${esc(p.name)} 본인`} · ${rounds}</span><p>${esc(say)}</p>${fn?`<span class="gauge"><i style="width:${fn.mood}%;background:${fn.mood>=60?'var(--good)':fn.mood>=35?'var(--warn)':'var(--bad)'}"></i></span>`:''}</div></div>
    ${N.k==='ext'?(()=>{ const x=extParts(p,T.years); const m=Math.round((x.mkt-1)*100); return `<div class="ng-why"><span class="eyebrow">요구액 근거 · 전력분석팀</span><p class="small">${x.ytf?`FA까지 ${x.ytf}시즌`:'지금 FA 자격'} · FA 시장 분위기 <b>${faMktLabel(x.mkt)}</b>(${m>=0?'+':''}${m}%) · 예상 FA 시장가 연 <b>${money(x.expFA)}</b></p><p class="small muted keep">${x.why.map(esc).join(' · ')}${x.yadj!==1?` · ${T.years}년 계약 기간 ${x.yadj>1?'+':''}${Math.round((x.yadj-1)*100)}%`:''}</p></div>`; })():''}
    ${ngtLog(N)}
    <div class="ng-rows">${ngtRows(N,D)}</div>
    ${N.k==='sal'?(()=>{ const sb=salBasis(p); const d=T.annual-p.sal; return `<div class="ng-sum"><div><i>직전 시즌</i><b>${sb.h?`WAR ${sb.war.toFixed(1)}`:'1군 기록 없음'}</b><em>${esc(sb.band)} · 인상 상한 +${sb.cap}%</em></div><div><i>인상률</i><b class="num ${d>0?'warn':''}">${d>=0?'+':''}${p.sal?Math.round(d/p.sal*100):0}%</b><em>${money(p.sal)} → ${money(T.annual)}</em></div><div><i>올해 예산 여유</i><b class="num">${money(b.roomGoal)}</b><em>${dobj(G.day).m<=3&&G.day>KD(1,10)?'1월 31일 마감 · 미합의면 구단 마지막 제시액으로 확정':(p.svc||0)>=ARB_SVC?'1월 10일까지 안 되면 연봉조정 신청 가능':'연봉조정 신청 대상 아님'}</em></div><div class="ng-gap ${gc}"><i>요구 대비</i><b>${gt}</b></div></div>`; })():`<div class="ng-sum">
      <div><i>보장 총액</i><b class="num">${money(tot)}</b>${T.opt?`<em>옵션 포함 최대 ${money(tot+T.opt*T.years)}</em>`:''}</div>
      <div><i>상한 반영(연평균)</i><b class="num">${money(capAvg)}</b><em class="${capAvg>capRoom?'bad':''}">상한 여유 ${money(capRoom)}</em></div>
      <div><i>올해 예산 여유</i><b class="num">${money(b.roomGoal)}</b><em class="${T.bonus>b.roomGoal?'bad':''}">${T.bonus?`계약금 ${money(T.bonus)} 즉시 지급${T.bonus>b.roomGoal?' · 예산 여유를 넘습니다':''}`:'계약금 없음'}</em></div>
      <div class="ng-gap ${gc}"><i>요구 대비</i><b>${gt}</b></div>
    </div>`}
    <div class="ng-acts">
      ${closed?'<div class="note bad">에이전트가 우리와의 협상을 끝냈습니다.</div>':`<button class="btn" data-a="ngtDemand">요구 조건대로 채우기</button>${ctr?`<button class="btn" data-a="ngtCounter">역제안 수락 · ${esc(ctrTx)}</button>`:''}<button class="btn primary" data-a="ngtSubmit">제안하기</button>`}
      ${N.k==='fa'&&G.fa.offers[p.id]?'<button class="btn danger" data-a="ngtWithdraw">제안 철회</button>':''}<button class="btn ng-close" data-a="ngtClose">협상 마치기</button></div></div></div>`; }
function ngtSet(v){ const N=UI.ngt; if(!N)return; const [f,x]=v.split(':'); const T=N.T;
  if(x[0]==='='){ const val=+x.slice(1); if(f==='ntc')T.ntc=!!val; else T[f]=val; if(f==='years'&&N.k==='ext'){ N.msg=null; } }
  else T[f]=Math.max(f==='annual'?MIN_SAL:0,round5((T[f]||0)+(+x))||0);
  if(f==='bonus'||f==='opt')T[f]=Math.max(0,Math.round((T[f]||0)/5)*5); }
function ngtSubmit(){ const N=UI.ngt; const p=G.players[N.id]; const T={...N.T};
  if(N.k==='fa'){ if(faOutBlocked(G.user,p)){ N.msg=`이번 겨울 다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다(${ASSOC.s} 규약 제173조).`; return; }
    if(G.day<G.fa.openDay){ const D=termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years}); G.fa.offers[p.id]={annual:Math.round(termsVal(T,D)),years:T.years,terms:T}; N.msg='11월 6일 협상이 열리면 에이전트가 답합니다. 조건은 미리 넣어 두었습니다.'; return; }
    const n0=negOf(p.id).log.length; const r=faNegotiate(p.id,{annual:T.annual,years:T.years,terms:T}); UI.faMsg={id:p.id,t:r.msg}; N.msg=negOf(p.id).log.length>n0?null:r.msg.replace(/^[^:]+: /,''); return; }
  if(N.k==='ext'){ const r=offerExtension(p.id,T.annual,T.years,false,T); N.msg=r.msg.replace(/^[^:]+: /,''); if(r.ok){ UI.stamp={title:'다년계약 합의',msg:`${p.name} · ${termsTxt(T,true)}`}; UI.ngt=null; } return; }
  const r=salOffer(p.id,T.annual); N.msg=r.replace(/^[^:]+: /,''); UI.ctMsg=r; if((salNeg(p.id)||{}).st==='ok')UI.ngt=null; }
function ngtCounter(){ const N=UI.ngt; const p=G.players[N.id];
  if(N.k==='fa'){ const r=faAcceptCounter(p.id); UI.faMsg={id:p.id,t:r}; N.msg=r; if(p.team===G.user)UI.ngt=null; return; }
  const c=p.extCounter; if(!c)return; const r=offerExtension(p.id,c.annual,c.years,true,c.terms||null); N.msg=r.msg.replace(/^[^:]+: /,''); if(r.ok)UI.ngt=null; }
/* 입구 버튼: 지금 우리 제안 요약 */
function ngtDoor(k,p){ const o=k==='fa'?G.fa.offers[p.id]:null; const ag=hasAgent(p)?agentOf(p):null;
  const cur=o?(o.terms?termsTxt(o.terms,true):`${o.years}년 연 ${money(o.annual)}`):null;
  return `<button class="mt-door" data-a="ngtOpen" data-v="${k}:${p.id}">${ag?agAv(ag):avImg(p)}<span><b>협상 테이블 열기</b><i>${ag?`${esc(ag.name)} 에이전트 · ${esc(ag.firm)}`:`${esc(p.name)} 본인과 협상`}</i><i>${cur?`지금 우리 제안: ${esc(cur)}`:k==='fa'?`요구 ${p.ask.years}년 연 ${money(p.ask.annual)} 수준`:'기간 · 계약금 · 연봉 · 옵션을 정해 제안합니다'}</i></span><em>›</em></button>`; }
/* 슬라이더: 움직이는 동안은 숫자만, 놓으면 다시 그린다 */
function ngtRange(el,fin){ const N=UI.ngt; if(!N)return; const f=el.dataset.ngr; N.T[f]=f==='annual'?Math.max(MIN_SAL,+el.value):+el.value; if(fin){ renderSheet(); return; } const o=document.getElementById('ngv-'+f); if(o)o.textContent=money(N.T[f]); }
document.addEventListener('input',e=>{ const el=e.target.closest('[data-ngr]'); if(el)ngtRange(el,false); });
document.addEventListener('change',e=>{ const el=e.target.closest('[data-ngr]'); if(el)ngtRange(el,true); });
