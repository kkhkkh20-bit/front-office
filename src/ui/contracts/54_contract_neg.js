/* ---------- 협상 테이블(FM 계약 협상 화면 구조) ----------
   위: 에이전트(또는 선수 본인)의 말  ·  가운데: 계약 조건 한 줄씩(값 조정 + 요구 조건 표시)  ·  아래: 총액·예산·상한 부담과 제안 버튼
   FA: 역할 약속·기간·계약금·연봉·옵션·거부권 / 비FA 다년: 기간·계약금·연봉·옵션·거부권 / 연봉 협상: 연봉만 */
const NGT_K={fa:'FA 계약',ext:'비FA 다년계약',sal:'연봉 협상'};
function ngtExtDem(p,y){ return extDemandAll(p,y); }
/* 에이전트가 말하는 요구(비FA는 친분이 낮을수록 부풀려 말한다) */
function ngtDemand(N){ const p=G.players[N.id];
  if(N.k==='fa')return termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years});
  if(N.k==='ext'){ const y=N.T.years; const d=ngtExtDem(p,y); const ag=hasAgent(p)?agentOf(p):null; const k=ag?agRel(ag):50; const est=round5(d*(1+(k>=60?0:k>=40?.03:.06)+hn('xe'+G.year,p.id)*.02)); return termsDemand(p,'ext',{annual:est,years:y}); }
  const n=salNeg(N.id); return {years:1,annual:n?n.ask:p.sal,bonus:0,opt:0,role:null,ntc:false}; }
function ngtOpen(k,id){ const p=G.players[id]; if(!p)return; let T;
  if(k==='fa'){ const o=G.fa&&G.fa.offers[id]; T=o&&o.terms?{...o.terms}:termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years}); }
  else if(k==='ext'){ const ec=p.extCounter&&p.extCounter.until>=G.day&&p.extCounter.terms?p.extCounter:null; /* 기한이 지난 역제안은 기본값으로 쓰지 않는다(검수 11-09s) */ const y=ec?ec.years:p.age<=29?4:p.age<=32?3:2; T=ec?{...ec.terms}:{...termsDemand(p,'ext',{annual:ngtExtDem(p,y),years:y}),role:null}; T.annual=round5(Math.max(MIN_SAL,T.annual*.94)); }
  else { const n=salNeg(id); T={years:1,annual:n?(n.cur??n.off):p.sal,bonus:0,opt:0,role:null,ntc:false}; }
  UI.ngt={k,id,T,msg:null,ed:false}; renderSheet(); }
/* 기간을 바꿨을 때: 금액을 직접 고치지 않았으면 새 기간 기준으로 다시 잡고(요구대로 채웠으면 새 요구로), 고쳤으면 그대로 두고 알린다 */
function ngtYears(N,y){ const p=G.players[N.id]; const T=N.T; T.years=y; if(N.k!=='ext')return;
  if(N.ed==='dem'){ const D=ngtDemand(N); Object.assign(T,{bonus:D.bonus,annual:D.annual,opt:D.opt}); N.kept=false; return; }
  if(!N.ed){ const D=termsDemand(p,'ext',{annual:ngtExtDem(p,y),years:y}); Object.assign(T,{bonus:D.bonus,opt:D.opt,annual:round5(Math.max(MIN_SAL,D.annual*.94))}); N.kept=false; return; }
  N.kept=true; }
function ngtSeasons(N){ const now=(G.rolled===G.year&&G.day>=KD(11,1))||period()==='pre'; const st=N.k==='ext'?(now?ctSeason():G.year+1):sponSeason(); return [st,st+(N.T.years||1)-1]; } /* 다년계약 시작 시즌은 실제 저장(14_salary extOffer)과 같은 기준(검수 11-08: 한국시리즈 뒤~결산 전 표시가 한 해 이름) */
function ngtMil(N){ const p=G.players[N.id]; if(p.foreign||N.k==='sal')return ''; const m=p.mil; const free=milFree(p), srv=!!(m&&m.until&&m.until>G.day); if(!free&&!srv)return '';
  const [s0,s1]=ngtSeasons(N); const due=G.year+Math.max(0,27-p.age); const inK=free&&due<=s1;
  return `<div class="ng-mil small"><b>병역</b> ${esc(milText(p))}${inK?` · 계약 기간(${s0}~${s1}) 안에 입대해야 합니다`:''}<span class="muted">복무(1년 6개월) 중에도 계약 연수는 줄어듭니다. 복무하는 동안 연봉은 예산·상한 합계에서 빠지고, 그 시즌은 FA 등록 시즌으로 치지 않습니다.</span></div>`; }
/* 이 조건을 냈을 때의 상한 결재(13_roster capOwnerCheck): 엔진의 FA·다년계약·연봉 협상 판정과 같은 함수 */
function ngtCapC(N){ const p=G.players[N.id], T=N.T; if(!p||p.foreign)return null; try{ if(N.k==='fa')return faCapCheck(p,{annual:T.annual,years:T.years,terms:T}); if(N.k==='ext')return extCapCheck(p,T.annual,T.bonus,T.years); return salCapCheck(p,salNeg(N.id),Math.round(T.annual)); }catch(e){ return null; } }
function ngtStep(v){ return v>=3000?50:v>=1000?20:v>=300?10:5; }
function ngtRows(N,D){ const p=G.players[N.id]; const T=N.T; const R=[];
  const mrow=(f,l,sub,max)=>{ const v=T[f]||0, d=D[f]||0; const ok=v>=d; const st=ngtStep(Math.max(v,d,100));
    return `<div class="ngr ${d?(ok?'ok':'lo'):''}"><div class="ngl"><b>${l}</b>${sub?`<i>${sub}</i>`:''}</div>
      <div class="ngc"><button class="ngb" data-a="ngtSet" data-v="${f}:${-st*5}" aria-label="${l} 크게 내리기">«</button><button class="ngb" data-a="ngtSet" data-v="${f}:${-st}" aria-label="${l} 내리기">−</button>${contractMoneyInput('ngt',f,l,v)}<button class="ngb" data-a="ngtSet" data-v="${f}:${st}" aria-label="${l} 올리기">+</button><button class="ngb" data-a="ngtSet" data-v="${f}:${st*5}" aria-label="${l} 크게 올리기">»</button></div>
      <div class="ngd">${d?`<span class="pill ${ok?'good':'warn'}">요구 ${money(d)}</span>`:f==='opt'?'<span class="small muted">요구 없음</span>':''}</div>
      <input type="range" class="ngrg" min="${f==='annual'?MIN_SAL:0}" max="${Math.max(max,v)}" step="1" value="${v}" data-ngr="${f}" aria-label="${l}"></div>`; };
  if(N.k==='fa'){ const L=roleSet(p); R.push(`<div class="ngr ${T.role<=D.role?'ok':'lo'}"><div class="ngl"><b>역할 약속</b><i>${T.role===0?'지키지 못하면 매달 선수 기분 하락':'약속 없음'}</i></div><div class="ngc seg">${L.map((l,i)=>`<button data-a="ngtSet" data-v="role:=${i}" class="${T.role===i?'on':''}">${l}</button>`).join('')}</div><div class="ngd"><span class="pill ${T.role<=D.role?'good':'warn'}">요구 ${L[D.role]}</span></div></div>`); }
  if(N.k!=='sal'){ const ys=N.k==='fa'?[1,2,3,4,5,6]:[2,3,4,5,6]; R.push(`<div class="ngr ${T.years===D.years||(N.k==='ext'&&T.years>=extMinY(p))?'ok':'lo'}"><div class="ngl"><b>계약 기간</b><i>${N.k==='fa'?'FA 기간은 길수록 선수가 좋아합니다':'기간에 따라 요구액이 바뀝니다'}</i></div><div class="ngc seg">${ys.map(y=>`<button data-a="ngtSet" data-v="years:=${y}" class="${T.years===y?'on':''}">${y}년</button>`).join('')}</div><div class="ngd">${N.k==='fa'?`<span class="pill ${T.years>=D.years?'good':'warn'}">요구 ${D.years}년</span>`:''}</div></div>`);
    R.push(mrow('bonus','계약금','계약할 때 한 번에 지급 · 상한에는 연평균으로 반영',round5(Math.max(D.bonus*2,500))));
  }
  R.push(mrow('annual','연봉',N.k==='sal'?`지금 ${money(p.sal)} · 구단 산정안 ${money((salNeg(N.id)||{}).off||p.sal)}`:'매 시즌 지급',round5(Math.max(D.annual*2,p.sal*1.5,300))));
  if(N.k!=='sal'){ R.push(mrow('opt','옵션 (연간 최대)',`${p.isP?(isSPr(p)?'120이닝':'50이닝'):'400타석'} 달성 시 지급 · 선수는 절반 아래 가치로 봅니다`,round5(Math.max(D.annual*.4,100))));
    { const ys=T.years||1; R.push(`<div class="ngr ok"><div class="ngl"><b>구단 연장 옵션</b><i>보장 기간이 끝나면 구단이 같은 연봉으로 더 쓸지 고릅니다 · 선수는 싫어해 연 3.5%씩 더 요구</i></div><div class="ngc seg">${[0,1,2].map(n=>`<button data-a="ngtSet" data-v="cOpt:=${n}" class="${(T.cOpt||0)===n?'on':''}">${n?'+'+n+'년':'없음'}</button>`).join('')}</div><div class="ngd"><span class="small muted">요구 없음</span></div></div>`);
      const pm=N.k==='fa'?1:pOutMin(p,ngtSeasons(N)[0]); const po=[0,...Array.from({length:Math.min(3,ys-1)},(_,i)=>i+1).filter(n=>n>=pm)];
      if(ys>=2&&po.length===1&&N.k==='ext')R.push(`<div class="ngr ok"><div class="ngl"><b>선수 옵트아웃</b><i>FA 자격(등록 ${faSvc(p)}시즌) 전에는 옵트아웃해도 FA로 나갈 수 없어 넣을 수 없습니다. ${pm}년 이상 계약부터 가능합니다.</i></div></div>`);
      if(ys>=2&&po.length>1)R.push(`<div class="ngr ok"><div class="ngl"><b>선수 옵트아웃</b><i>정한 시즌을 마치고 선수가 남은 계약을 버리고 FA로 나갈 수 있습니다 · 선수에게 유리해 요구액이 줄어듭니다${N.k==='ext'?' · FA 자격이 생기는 해부터 고를 수 있습니다':''}</i></div><div class="ngc seg">${po.map(n=>`<button data-a="ngtSet" data-v="pOut:=${n}" class="${(T.pOut||0)===n?'on':''}">${n?n+'년 뒤':'없음'}</button>`).join('')}</div><div class="ngd"><span class="small muted">요구 없음</span></div></div>`); }
    if(D.ntc||T.ntc||ovr(p)>=60)R.push(`<div class="ngr ${!D.ntc||T.ntc?'ok':'lo'}"><div class="ngl"><b>트레이드 거부권</b><i>있으면 계약 기간 동안 이 선수를 트레이드할 수 없습니다</i></div><div class="ngc seg"><button data-a="ngtSet" data-v="ntc:=0" class="${!T.ntc?'on':''}">없음</button><button data-a="ngtSet" data-v="ntc:=1" class="${T.ntc?'on':''}">부여</button></div><div class="ngd">${D.ntc?`<span class="pill ${T.ntc?'good':'warn'}">요구</span>`:'<span class="small muted">요구 없음</span>'}</div></div>`); }
  return R.join(''); }
/* 요구 대비 지금 조건(정확한 숫자 대신 말로) */
function ngtGap(N,D){ const p=G.players[N.id]; let r;
  if(N.k==='fa'){ const ag=agentOf(p); const ai=Object.keys(G.fa.ai[p.id]||{}).length; const want=offScore(p.ask)*agWantMul(ag)*(1+.03*ai)*(p.faFrom===G.user?.95:1); r=offScore({annual:termsVal(N.T,D),years:N.T.years})/(want*.97); }
  else if(N.k==='ext'){ if(N.T.years<extMinY(p))return ['bad',`에이전트가 최소 ${extMinY(p)}년 계약을 요구합니다`]; r=termsVal(N.T,D)/termsVal(D,D); } else { return salAccepts(p,salNeg(N.id),Math.max(MIN_SAL,Math.round(N.T.annual)))?['good',N.T.annual>=D.annual?'요구액에 맞췄습니다. 바로 합의됩니다':'요구액에 조금 못 미치지만 바로 합의됩니다']:['warn',`요구까지 ${money(D.annual-N.T.annual)} 남았습니다. 합의가 안 되면 선수가 요구를 조금 낮춰 답합니다`]; }
  const riv=N.k==='fa'&&Object.keys(G.fa.ai[p.id]||{}).length;
  return r>=1?['good',riv?'요구는 채웠습니다. 다른 구단 조건과도 비교합니다':'요구 조건을 채웠습니다']:r>=.9?['warn','조금 모자랍니다. 역제안이 올 수 있습니다']:r>=.75?['bad','차이가 큽니다. 분위기가 나빠집니다']:['bad','무리한 조건입니다. 협상이 깨질 수 있습니다']; }
/* 제안 결과 줄: 말풍선과 따로, 합의·역제안·거절·검토 중·결렬과 다음에 할 수 있는 일을 한 줄로 못 박는다 */
function ngtResOf(N){ const p=G.players[N.id]; if(N.res){ if(N.k==='fa'&&N.res.st==='wait'&&!(G.fa&&G.fa.offers&&G.fa.offers[N.id]))return null; /* 철회한 제안은 '검토 중'이 아니다(검수 11-09r) */ return N.res; }
  if(N.k==='ext'&&p.extLast&&G.day-p.extLast.d<=6){ const c=p.extCounter&&p.extCounter.until>=G.day; const nx=extNextDay(p); if(p.extLast.st==='counter'&&c)return {st:'counter'}; if(nx)return {st:p.extLast.st,next:nx}; }
  if(N.k==='fa'){ const n=G.fa&&G.fa.neg&&G.fa.neg[p.id]; if(n&&n.closed&&!faReopenOk(p.id))return {st:'closed'}; }
  return null; }
function ngtResHtml(N){ const R=ngtResOf(N); if(!R)return ''; const p=G.players[N.id]; const nx=R.next!=null?`다음 제안은 ${dsh(R.next)}부터 할 수 있습니다(한 선수와 한 주에 한 번).`:'';
  const c=N.k==='ext'?p.extCounter:N.k==='fa'?(G.fa&&G.fa.neg&&G.fa.neg[p.id]||{}).counter:null;
  const M={ok:['good','합의',R.sub||'계약이 확정됐습니다.'],
    counter:['warn','역제안',`에이전트가 조건을 내놓았습니다. 아래 '역제안 수락'을 누르면 ${N.k==='fa'?'우리 제안이 그 조건으로 바뀌고, 지금 우리 조건이 가장 좋으면 그 자리에서 사인합니다':'바로 계약됩니다'}${N.k==='ext'&&c&&c.until?` · ${dsh(c.until)}까지 유효`:''}. 다시 제안해도 됩니다.`],
    no:['bad','거절',N.k==='sal'?'선수가 요구액을 조금 낮춰 답했습니다(위 말풍선). 요구액 이상이면 바로 합의됩니다.':N.k==='fa'?'역제안도 없습니다. 조건을 올려 다시 제안할 수 있습니다.':nx],
    market:['bad','거절 · FA 시장을 보겠다고 합니다',nx],
    locked:['bad','이번 주 협상은 끝났습니다',N.k==='sal'?'요구액 이상이면 지금도 바로 합의됩니다. 더 낮게 부르려면 다음 주에 다시 하세요.':nx],
    wait:['warn','검토 중 · 아직 계약 아님',R.shop?`선수가 시장 반응을 보고 ${dsh(R.shop)}쯤 답합니다. 결과는 소식으로 알려 드립니다.`:'다른 구단 조건과 비교해 결정합니다. 사인하면(또는 다른 구단으로 가면) 소식으로 알려 드립니다.'],
    closed:['bad','협상 결렬','이 에이전트는 더 이상 우리와 협상하지 않습니다.'],
    owner:['bad','구단주 결재 거절','선수에게 내밀지 못했습니다(협상 횟수·분위기는 그대로). 조건을 낮추거나 연봉이 많은 선수를 먼저 정리하세요.']};
  const m=M[R.st]; if(!m)return ''; return `<div class="ng-res ${m[0]}"><b>${m[1]}</b>${m[2]?`<span>${esc(m[2])}</span>`:''}</div>`; }
function ngtLog(N){ const p=G.players[N.id]; if(N.k!=='fa'||!G.fa||!G.fa.neg||!G.fa.neg[p.id])return ''; const ag=agentOf(p);
  let L=G.fa.neg[p.id].log.slice(); if(L.length&&L[L.length-1].w==='에이전트')L.pop(); /* 마지막 답은 위 말풍선에 이미 나온다 */ L=L.slice(-6); if(!L.length)return '';
  return `<details class="ng-log"><summary class="small muted">지난 협상 기록 ${L.length}건</summary>${L.map(x=>x.w==='구단'?`<div class="ngm me"><i>우리 제안${x.acc?' (역제안 수락)':''}</i>${esc(x.tm?termsTxt(x.tm,true):`${x.y}년 연 ${money(x.a)}`)}</div>`:`<div class="ngm ag"><i>${esc(ag.name)}</i>${esc(x.t)}</div>`).join('')}</details>`; }
function ngtSheet(){ const N=UI.ngt; const p=G.players[N.id]; if(!p)return ''; const D=ngtDemand(N); const T=N.T;
  const ag=hasAgent(p)?agentOf(p):null; const fn=N.k==='fa'&&G.fa&&G.fa.neg?G.fa.neg[p.id]:null;
  const lastAg=fn&&fn.log.length&&fn.log[fn.log.length-1].w==='에이전트'?fn.log[fn.log.length-1].t:null;
  const lastExt=N.k==='ext'&&p.extLast&&G.day-p.extLast.d<=6&&ngtResOf(N)?p.extLast.t:null;
  const say=N.msg||lastAg||lastExt||(N.k==='sal'?`${ag?'선수와 이야기를 나눠 봤습니다. ':''}구단 산정안은 ${money((salNeg(p.id)||{}).off||p.sal)}이지만, ${ag?'저희는':'저는'} ${money(D.annual)}은(는) 받아야 한다고 봅니다.`:`${ag?'제 의뢰인이 원하는 조건입니다. ':'제가 원하는 조건입니다. '}${termsTxt(D,true)}${D.role===0?` · ${roleSet(p)[0]}`:''}${D.ntc?' · 트레이드 거부권':''}. ${N.k==='fa'?(Object.keys((G.fa&&G.fa.ai[p.id])||{}).length?'이 선을 맞춰 주시면 다른 구단 제안과 비교해 며칠 안에 답을 드리겠습니다.':'이 선을 맞춰 주시면 큰 변수가 없는 한 며칠 안에 사인합니다.'):(agExtTestMarket(p)?'시장 평가를 받아 보고 싶어 하는 몫까지 넣은 조건입니다. 이 선이면 바로 사인합니다.':'이 선에서 맞춰 주시면 바로 사인합니다.')}`); /* FA는 계약이 하루 단위로 정해져 '바로'가 아니다(플레이 테스트 11-13) */
  const expr=fn?(fn.counter?'flat':fn.hot||fn.deal?'smile':fn.mood<40?'angry':null):null;
  const [gc,gt]=ngtGap(N,D);
  const tot=(T.bonus||0)+T.annual*(T.years||1); const capAvg=T.annual+Math.round((T.bonus||0)/(T.years||1)); const ci=capInfo(G.user); const b=budget();
  const capRoom=capPayWith(G.user,p.id,null,ngtSeasons(N)[0]).room; /* 실제 샐러리캡처럼 상위 40명 기준, 계약 적용 시즌 상한 */
  const ctr=N.k==='fa'?fn&&fn.counter:N.k==='ext'?(p.extCounter&&p.extCounter.until>=G.day?p.extCounter:null):null;
  const ctrTx=ctr?(ctr.terms?termsTxt(ctr.terms,true):`${ctr.years}년 연 ${money(ctr.annual)}`):'';
  const rounds=fn?`협상 ${fn.rounds}/${agRoundsMax(p)}회 · 분위기 ${fn.mood}`:N.k==='sal'?'한 주에 한 번 제시':'한 주에 한 번 제안';
  const closed=fn&&fn.closed&&!(N.k==='fa'&&faReopenOk(p.id)); /* 다시 열 수 있는 날이 되면 제안 버튼을 살린다 */
  return `<div class="scrim" data-a="ngtClose"><div class="sheet gut ngt" data-stop="1" role="dialog" aria-label="계약 협상">
    <div class="sheet-head"><div class="ng-h">${avImg(p)}<div><span class="eyebrow">${NGT_K[N.k]} · ${esc(posLabel(p))} · ${p.age}세</span><h2 class="sec">${esc(p.name)}</h2><span class="small muted">${N.k==='fa'?`${p.faGrade}등급 FA · 관심 구단 ${Object.keys(G.fa.ai[p.id]||{}).length}곳`:`지금 연봉 ${money(p.sal)} · ${ctText(p)}`}${!p.foreign&&N.k!=='sal'?` · ${esc(milText(p))}`:''}</span></div></div><button class="x" data-a="ngtClose" aria-label="닫기">×</button></div>
    ${ngtResHtml(N)}
    <div class="ng-ag">${ag?agAv(ag,expr):avImg(p)}<div class="ng-say"><span class="small muted">${ag?`${esc(ag.name)} 에이전트 · ${esc(ag.firm)} · ${esc((AG_STYLE[ag.style]||AG_STYLE.rel).l)}`:`${esc(p.name)} 본인`} · ${rounds}</span><p>${esc(say)}</p>${fn?`<span class="gauge"><i style="width:${fn.mood}%;background:${fn.mood>=60?'var(--good)':fn.mood>=35?'var(--warn)':'var(--bad)'}"></i></span>`:''}</div></div>
    ${N.k==='ext'?(()=>{ const x=extParts(p,T.years); const m=Math.round((x.mkt-1)*100); return `<div class="ng-why"><span class="eyebrow">요구액 근거 · 전력분석팀</span><p class="small">${x.ytf?`FA까지 ${x.ytf}시즌`:'지금 FA 자격'} · FA 시장 분위기 <b>${faMktLabel(x.mkt)}</b>(${m>=0?'+':''}${m}%) · 예상 FA 시장가 연 <b>${money(x.expFA)}</b></p><p class="small muted keep">${x.why.map(esc).join(' · ')}${x.yadj!==1?` · ${T.years}년 계약 기간 ${x.yadj>1?'+':''}${Math.round((x.yadj-1)*100)}%`:''}</p></div>`; })():''}
    ${ngtLog(N)}
    ${ngtMil(N)}${p.postPromise&&p.team===G.user?`<div class="ng-mil small"><b>포스팅 약속</b> ${p.postPromise}년 포스팅 허락을 약속했습니다. 이 계약을 맺어도 약속은 남고, 그해 포스팅 요청 때 지키거나 어겨야 합니다.</div>`:''}
    <div class="ng-rows">${ngtRows(N,D)}</div>
    ${N.k==='ext'&&N.kept?`<div class="note warn small">기간을 바꿨지만 직접 정한 금액은 그대로 두었습니다. ${T.years}년 기준 요구는 ${esc(termsTxt(D,true))}입니다.</div>`:''}
    ${N.k==='sal'?(()=>{ const sb=salBasis(p); const d=T.annual-p.sal; return `<div class="ng-sum"><div><i>직전 시즌</i><b>${sb.h?`WAR ${sb.war.toFixed(1)}`:'1군 기록 없음'}</b><em>${esc(sb.band)} · 구단 산정안 인상 기준 +${sb.cap}%(협상 한도 아님)</em></div><div><i>인상률</i><b class="num ${d>0?'warn':''}">${d>=0?'+':''}${p.sal?Math.round(d/p.sal*100):0}%</b><em>${money(p.sal)} → ${money(T.annual)}</em></div><div><i>예산 여유(구단주 목표 기준)</i><b class="num">${money(b.roomGoal)}</b><em>${dobj(G.day).m<=3&&G.day>KD(1,10)?'1월 31일 마감 · 미합의면 구단 마지막 제시액으로 확정':(p.svc||0)>=ARB_SVC?'1월 10일까지 안 되면 연봉조정 신청 가능':'연봉조정 신청 대상 아님'}</em></div>${(()=>{ const cc=ngtCapC(N); return cc?`<div><i>${cc.hard?'구단주 허용 한도 초과':'구단주 결재 필요'}</i><b class="num ${cc.hard?'bad':'warn'}">${cc.hard?'승인 불가':`승인 가능성 ${capPLabel(cc.p)}`}</b><em>산정안보다 더 주는 몫으로 ${cc.s}시즌 상위 40명 연봉이 상한을 ${money(cc.over)} 넘습니다${cc.hard?` · 구단주 한도 ${money(cc.lim)}`:''}</em></div>`:''; })()}<div class="ng-gap ${gc}"><i>요구 대비</i><b>${gt}</b></div></div>`; })():`<div class="ng-sum">
      <div><i>적용 시즌</i><b class="num">${ngtSeasons(N).join('~')}</b><em>${N.k==='ext'?(period()==='season'||period()==='post'?'시즌 중 합의는 다음 시즌부터':'개막 전 합의는 다가오는 시즌부터'):'다가오는 시즌부터'}</em></div>
      <div><i>보장 총액</i><b class="num">${money(tot)}</b>${T.opt?`<em>옵션 포함 최대 ${money(tot+T.opt*T.years)}</em>`:''}${(()=>{ if(N.k!=='ext')return ''; const dt=(D.bonus||0)+D.annual*(D.years||T.years); const over=tot-dt; return over>Math.max(50,dt*.03)?`<em class="warn">요구(${money(dt)})보다 ${money(over)} 더 주는 조건</em>`:''; })()}</div>
      ${N.k==='ext'?(()=>{ const [s0]=ngtSeasons(N); const ys=Array.from({length:T.years||1},(_,i)=>s0+i); const cy=ctCashYears(T,s0); return `<div><i>연도별 현금 지출</i><b class="num small">${cy.map(x=>`${x.y} ${money(x.v)}${x.bon?`(계약금${x.sal?' 포함':''})`:''}`).join(' · ')}</b><em>${T.bonus?`계약금 ${money(T.bonus)}은 합의 때 바로 지급(${sponSeason()} 결산) · 연봉은 ${s0}시즌부터`:'계약금 없음'}${T.opt?` · 옵션 달성 시 해마다 최대 +${money(T.opt)}`:''}</em></div>`; })():''}
      ${(()=>{ const [s0]=ngtSeasons(N); const W=capPayWith(G.user,p.id,p.foreign?null:capAvg,s0); const over=W.tot-W.cap; const d=W.tot-capPayWith(G.user,null,null,s0).tot; return `<div><i>${W.s}시즌 예상 상한 합계(계약 후)</i><b class="num ${over>0?'bad':''}">${money(W.tot)}</b><em>${W.s}시즌 상한 ${money(W.cap)}${over>0?` · ${money(over)} 초과(경쟁균형세 대상)`:` · 여유 ${money(-over)}`} · 상위 40명 다시 계산(${d>=0?'+':''}${money(d)})</em></div>${over>0?(()=>{ const X=capTaxEst(over); const cc=ngtCapC(N); return `<div><i>${cc?(cc.hard?'구단주 허용 한도 초과':'구단주 결재 필요'):'넘겨도 계약할 수 있습니다'}</i><b class="num ${cc&&cc.hard?'bad':'warn'}">${cc?(cc.hard?'승인 불가':`승인 가능성 ${capPLabel(cc.p)}`):`제재금 약 ${money(X.tax)}`}</b><em>${cc&&cc.hard?`구단주는 상한의 ${Math.round(cc.L*100)}%(${money(cc.lim)})를 넘는 지출은 허락하지 않습니다. 이 조건으로는 제안할 수 없습니다. `:cc?`제안하면 구단주 결재를 먼저 받습니다(성향·신뢰·연속 초과·초과 폭에 따라 다름). 승인되면 계약 때 구단주 신뢰 하락. `:''}시즌 끝까지 넘으면 초과분의 ${Math.round(capRate(X.n)*100)}%(약 ${money(X.tax)})를 야구발전기금으로 냅니다(${X.n}회 연속${X.pen?' · 다음 해 1라운드 지명 순서 9단계 하락':''}). 트레이드 마감(7월 31일) 전에 줄이면 내지 않습니다. 개막 뒤 방출한 선수 연봉은 그해 산정에 남습니다.</em></div>`; })():''}`; })()}
      <div><i>상한 반영(연평균)</i><b class="num">${money(capAvg)}</b><em class="${capAvg>capRoom?'bad':''}">연봉 상한까지 ${money(capRoom)}</em></div>
      <div><i>연봉 여유(예산 기준)</i><b class="num">${money(b.roomGoal)}</b><em class="${T.bonus>b.roomGoal?'bad':''}">${T.bonus?`계약금 ${money(T.bonus)} 즉시 지급${T.bonus>b.roomGoal?' · 예산 여유를 넘습니다':''}`:'계약금 없음'}</em></div>
      <div class="ng-gap ${gc}"><i>요구 대비</i><b>${gt}</b></div>${N.k==='fa'&&faCompTxt(p)?`<div class="note small"><b>영입 보상</b> · ${esc(faCompTxt(p))}</div>`:''}
    </div>`}
    <div class="ng-acts">
      ${closed?`<div class="note bad">에이전트가 우리와의 협상을 끝냈습니다.${N.k==='fa'&&!G.fa.closed?` ${dmd(faReopenDay(p.id))}부터 다시 제안할 수 있습니다.`:''}</div>`:`<button class="btn" data-a="ngtDemand">요구 조건대로 채우기</button>${ctr?`<button class="btn" data-a="ngtCounter">역제안 수락 · ${esc(ctrTx)}</button>`:''}${N.k==='ext'&&extNextDay(p)?`<button class="btn primary" data-a="ngtSubmit" disabled>다음 제안 ${dsh(extNextDay(p))}부터</button>`:'<button class="btn primary" data-a="ngtSubmit">제안하기</button>'}`}
      ${N.k==='fa'&&G.fa.offers[p.id]?'<button class="btn danger" data-a="ngtWithdraw">제안 철회</button>':''}<button class="btn ng-close" data-a="ngtClose">협상 마치기</button></div></div></div>`; }
function ngtSet(v){ const N=UI.ngt; if(!N)return; const [f,x]=v.split(':'); const T=N.T;
  if(x[0]==='='){ const val=+x.slice(1); if(f==='ntc')T.ntc=!!val; else if(f==='years'){ ngtYears(N,val); if(N.k==='ext')N.msg=null; } else T[f]=val; }
  else { T[f]=Math.max(f==='annual'?MIN_SAL:0,Math.round((T[f]||0)+(+x))||0); N.ed=true; N.kept=false; }
  if(T.pOut&&(T.pOut>=(T.years||1)||(N.k==='ext'&&T.pOut<pOutMin(G.players[N.id],ngtSeasons(N)[0]))))T.pOut=0; /* 옵트아웃은 계약 기간 안쪽, 비FA는 FA 자격이 생기는 해부터 */
  if(f==='bonus'||f==='opt')T[f]=Math.max(0,Math.round(T[f]||0)); }
function ngtSubmit(){ if(!contractMoneyValid())return; const N=UI.ngt; const p=G.players[N.id]; const T={...N.T};
  if(N.k==='fa'){ if(faOutBlocked(G.user,p)){ N.msg=`이번 겨울 다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다(${ASSOC.s} 규약 제173조).`; return; }
    { const cc=ngtCapC(N); if(cc&&!cc.ok){ N.msg=cc.msg; N.res={st:'owner'}; return; } } /* 협상이 열리기 전에 미리 넣는 조건도 결재부터 */
    if(G.day<G.fa.openDay){ const D=termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years}); G.fa.offers[p.id]={annual:Math.round(termsVal(T,D)),years:T.years,terms:T}; N.msg='11월 6일 협상이 열리면 에이전트가 답합니다. 조건은 미리 넣어 두었습니다.'; return; }
    const n0=negOf(p.id).log.length; const r=faNegotiate(p.id,{annual:T.annual,years:T.years,terms:T}); UI.faMsg={id:p.id,t:r.msg}; if(r.owner){ N.msg=r.msg; N.res={st:'owner'}; return; } N.msg=negOf(p.id).log.length>n0?null:r.msg.replace(/^[^:]+: /,''); N.res=r.st?{st:r.st,shop:r.shop}:null; return; }
  if(N.k==='ext'){ const r=offerExtension(p.id,T.annual,T.years,false,T); N.msg=r.st==='owner'?r.msg:r.msg.replace(/^[^:]+: /,''); N.res=r.st?{st:r.st,next:r.next??(p.extLast||{}).next}:null; if(r.ok){ UI.stamp={title:'다년계약 합의',msg:`${p.name} · ${termsTxt(T,true)} · ${r.now?'바로 적용':'다음 시즌부터 적용'}`}; UI.ngt=null; } return; }
  const cc0=ngtCapC(N); const r=salOffer(p.id,T.annual); if(cc0&&!cc0.ok&&r===cc0.msg){ N.msg=r; N.res={st:'owner'}; return; } N.msg=r.replace(/^[^:]+: /,''); UI.ctMsg=r; const sn=salNeg(p.id)||{};
  if(sn.st==='ok'){ UI.stamp={title:'연봉 합의',msg:`${p.name} · ${money(p.newSal??T.annual)}`}; UI.ngt=null; } else N.res={st:/이번 주에는/.test(r)?'locked':'no'}; }
function ngtCounter(){ const N=UI.ngt; const p=G.players[N.id];
  if(N.k==='fa'){ const cc=faCapCheck(p,(G.fa&&G.fa.neg&&G.fa.neg[p.id]||{}).counter); if(cc&&!cc.ok){ N.msg=cc.msg+' 역제안은 그대로 둡니다.'; N.res={st:'owner'}; return; } const r=faAcceptCounter(p.id); UI.faMsg={id:p.id,t:r}; N.msg=r; if(p.team===G.user){ UI.ngt=null; UI.stamp={title:'FA 계약',msg:r}; } else N.res={st:'wait'}; return; }
  const c=p.extCounter; if(!c)return; const r=offerExtension(p.id,c.annual,c.years,true,c.terms||null); N.msg=r.st==='owner'?r.msg:r.msg.replace(/^[^:]+: /,''); N.res=r.st?{st:r.st,next:r.next}:null; if(r.ok){ UI.stamp={title:'다년계약 합의',msg:`${p.name} · ${c.terms?termsTxt(c.terms,true):`${c.years}년 연 ${money(c.annual)}`} · ${r.now?'바로 적용':'다음 시즌부터 적용'}`}; UI.ngt=null; } }
/* 입구 버튼: 지금 우리 제안 요약 */
function ngtDoor(k,p){ const o=k==='fa'?G.fa.offers[p.id]:null; const ag=hasAgent(p)?agentOf(p):null;
  const cur=o?(o.terms?termsTxt(o.terms,true):`${o.years}년 연 ${money(o.annual)}`)+(o.rej?' (선수가 거절함)':''):null;
  return `<button class="mt-door" data-a="ngtOpen" data-v="${k}:${p.id}">${ag?agAv(ag):avImg(p)}<span><b>협상 테이블 열기</b><i>${ag?`${esc(ag.name)} 에이전트 · ${esc(ag.firm)}`:`${esc(p.name)} 본인과 협상`}</i><i>${cur?`지금 우리 제안: ${esc(cur)}`:k==='fa'?`요구 ${p.ask.years}년 연 ${money(p.ask.annual)} 수준`:'기간 · 계약금 · 연봉 · 옵션을 정해 제안합니다'}</i></span><em>›</em></button>`; }
/* 슬라이더: 움직이는 동안은 숫자만, 놓으면 다시 그린다 */
function ngtRange(el,fin){ const N=UI.ngt; if(!N)return; const f=el.dataset.ngr; N.T[f]=f==='annual'?Math.max(MIN_SAL,+el.value):+el.value; N.ed=true; N.kept=false; if(fin){ renderSheet(); return; } const o=document.querySelector(`[data-money="ngt:${f}"]`); if(o){o.value=(N.T[f]/100).toFixed(2);contractMoneyEdit(o);} }
document.addEventListener('input',e=>{ const el=e.target.closest('[data-ngr]'); if(el)ngtRange(el,false); });
document.addEventListener('change',e=>{ const el=e.target.closest('[data-ngr]'); if(el)ngtRange(el,true); });
