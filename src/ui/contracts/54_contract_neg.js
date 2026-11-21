/* ---------- 협상 테이블(FM 계약 협상 화면, 계약 1단계 2026-11-17) ----------
   PC 3칸: 왼쪽 선수 보고서(시장 가치·지금 계약·별·우리 예산/상한) · 가운데 조건 줄(잠금 · −/+ · 값 · 요구) · 오른쪽 에이전트 대화 기록과 역제안 카드.
   제안하기를 눌러야 답이 온다(트레이드 수정 제안과 같은 주고받기). 한 번 주고받으면 1라운드, 성향별 한도를 넘기면 에이전트가 접는다(42_agents ctGate).
   FA: 역할 약속·기간·계약금·연봉·옵션·조항 / 비FA 다년: 기간·계약금·연봉·옵션·조항 / 연봉 협상: 연봉만 */
const NGT_K={fa:'FA 계약',ext:'비FA 다년계약',sal:'연봉 협상'};
function ngtExtDem(p,y){ return extDemandAll(p,y); }
/* 에이전트가 말하는 요구(비FA는 친분이 낮을수록 부풀려 말한다) */
function ngtDemand(N){ const p=G.players[N.id];
  if(N.k==='fa')return termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years});
  if(N.k==='ext'){ const y=N.T.years; const d=ngtExtDem(p,y); const ag=hasAgent(p)?agentOf(p):null; const k=ag?agRel(ag):50; const est=round5(d*(1+(k>=60?0:k>=40?.03:.06)+hn('xe'+G.year,p.id)*.02)); return termsDemand(p,'ext',{annual:est,years:y}); }
  const n=salNeg(N.id); return {years:1,annual:n?n.ask:p.sal,bonus:0,opt:0,role:null,ntc:false}; }
const ngtClean=T=>{ const X={...T}; delete X.ov; return X; };
function ngtOpen(k,id){ const p=G.players[id]; if(!p)return; let T;
  if(k==='fa'){ const o=G.fa&&G.fa.offers[id]; T=o&&o.terms?{...o.terms}:termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years}); }
  else if(k==='ext'){ const ec=p.extCounter&&p.extCounter.until>=G.day&&p.extCounter.terms?p.extCounter:null; /* 기한이 지난 역제안은 기본값으로 쓰지 않는다(검수 11-09s) */ const y=ec?ec.years:p.age<=29?4:p.age<=32?3:2; T=ec?{...ec.terms}:{...termsDemand(p,'ext',{annual:ngtExtDem(p,y),years:y}),role:null}; T.annual=round5(Math.max(MIN_SAL,T.annual*.94)); }
  else { const n=salNeg(id); T={years:1,annual:n?(n.cur??n.off):p.sal,bonus:0,opt:0,role:null,ntc:false}; }
  T=ngtClean(T); if(k!=='sal'&&!T.optC)T.optC=optCrit(p); if(k!=='sal')T.pm={...(T.pm||{})};
  UI.ngt={k,id,T,msg:null,ed:false,lk:k==='fa'&&G.fa&&G.fa.offers[id]?(G.fa.offers[id].lock||[]).slice():[],tab:'terms'}; renderSheet(); }
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
/* 자물쇠: 잠근 조건은 에이전트가 역제안에서 바꾸지 않는다(표시와 역제안 제약만, 분위기 벌점 없음) */
const NGT_LKI='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const NGT_ULI='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5 7V5a3 3 0 0 1 5.8-1" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
function ngtLkBtn(N,f,l){ if(N.k==='sal')return ''; const on=(N.lk||[]).includes(f); return `<button class="ng-lk${on?' on':''}" data-a="ngtLock" data-v="${f}" aria-pressed="${on}" aria-label="${l} ${on?'잠금 풀기':'잠그기'}" title="${on?'잠금: 에이전트가 이 조건은 바꾸지 않습니다':'잠그면 역제안에서 이 조건을 바꾸지 않습니다'}">${on?NGT_LKI:NGT_ULI}</button>`; }
function ngtRows(N,D){ const p=G.players[N.id]; const T=N.T; const R=[];
  const row=(f,l,sub,ctl,dem,ok)=>`<div class="ngr ${ok==null?'':ok?'ok':'lo'}${(N.lk||[]).includes(f)?' lk':''}">${ngtLkBtn(N,f,l)}<div class="ngl"><b>${l}</b>${sub?`<i>${sub}</i>`:''}</div><div class="ngc${ctl.seg?' seg':''}">${ctl.h}</div><div class="ngd">${dem}</div></div>`;
  const mrow=(f,l,sub)=>{ const v=T[f]||0, d=D[f]||0; const ok=v>=d; const st=ngtStep(Math.max(v,d,100));
    return row(f,l,sub,{h:`<button class="ngb" data-a="ngtSet" data-v="${f}:${-st}" aria-label="${l} 내리기">−</button>${contractMoneyInput('ngt',f,l,v)}<button class="ngb" data-a="ngtSet" data-v="${f}:${st}" aria-label="${l} 올리기">+</button>`},
      d?`<span class="pill ${ok?'good':'warn'}">요구 ${money(d)}</span>`:f==='opt'?'<span class="small muted">요구 없음</span>':'',d?ok:null); };
  if(N.k!=='sal'){ const ys=N.k==='fa'?[1,2,3,4,5,6]:p.age>=33?[1,2,3,4,5]:[2,3,4,5,6]; /* 베테랑 다년은 1+1·2+1(구단 연장 옵션)이 흔하다 */ const ok=N.k==='fa'?T.years>=D.years:T.years>=extMinY(p);
    R.push(row('years','계약 기간',N.k==='fa'?'FA 기간은 길수록 선수가 좋아합니다':'기간에 따라 요구액이 바뀝니다',{seg:1,h:ys.map(y=>`<button data-a="ngtSet" data-v="years:=${y}" class="${T.years===y?'on':''}">${y}년</button>`).join('')},N.k==='fa'?`<span class="pill ${ok?'good':'warn'}">요구 ${D.years}년</span>`:extMinY(p)?`<span class="pill ${ok?'good':'warn'}">최소 ${extMinY(p)}년</span>`:'',ok));
    if(N.k==='fa')R.push(mrow('bonus','계약금','계약할 때 한 번에 지급 · 상한에는 연평균으로 반영')); else R.push(`<div class="ngr ok"><div class="ngl"><b>계약금</b><i>비FA 다년계약은 계약금이 없습니다(규약상 신인·FA만). 연봉과 옵션으로 정합니다.</i></div></div>`); }
  R.push(mrow('annual','연봉',N.k==='sal'?`지금 ${money(p.sal)} · 구단 산정안 ${money((salNeg(N.id)||{}).off||p.sal)}`:'매 시즌 지급'));
  if(N.k!=='sal'){ const c=T.optC||optCrit(p), K=optKinds(p), oc=OPT_CRIT[c];
    R.push(`<div class="ngr ok${(N.lk||[]).includes('opt')?' lk':''}">${ngtLkBtn(N,'opt','옵션')}<div class="ngl"><b>옵션 (연간 최대)</b><i>${esc(oc[2])} 달성 때만 지급 · ${N.k==='ext'?'비FA 다년은 보통 총액의 10~30%':'보통 연봉의 10~20%'} · 선수는 보장액의 ${Math.round(optV({optC:c},D)*100)}% 가치로 봅니다</i></div><div class="ngc"><button class="ngb" data-a="ngtSet" data-v="opt:${-ngtStep(Math.max(T.opt||0,100))}" aria-label="옵션 내리기">−</button>${contractMoneyInput('ngt','opt','옵션',T.opt||0)}<button class="ngb" data-a="ngtSet" data-v="opt:${ngtStep(Math.max(T.opt||0,100))}" aria-label="옵션 올리기">+</button></div><div class="ngd"><span class="small muted">요구 없음</span></div><div class="ng-chips" role="group" aria-label="옵션 종류">${K.map(k=>`<button class="chip${k===c?' on':''}" data-a="ngtSet" data-v="optC:=${k}"><em>${OPT_GRP[OPT_CRIT[k][3]]}</em> ${esc(OPT_CRIT[k][2])}</button>`).join('')}</div></div>`);
    { const ys=T.years||1; R.push(row('cOpt','구단 연장 옵션','보장 기간 뒤 구단이 같은 연봉으로 더 쓸지 고릅니다 · 선수는 싫어해 연 3.5%씩 더 요구',{seg:1,h:[0,1,2].map(n=>`<button data-a="ngtSet" data-v="cOpt:=${n}" class="${(T.cOpt||0)===n?'on':''}">${n?'+'+n+'년':'없음'}</button>`).join('')},'<span class="small muted">요구 없음</span>',true));
      const pm=N.k==='fa'?1:pOutMin(p,ngtSeasons(N)[0]); const po=[0,...Array.from({length:Math.min(3,ys-1)},(_,i)=>i+1).filter(n=>n>=pm)];
      if(ys>=2&&po.length===1&&N.k==='ext')R.push(`<div class="ngr ok"><div class="ngl"><b>선수 옵트아웃</b><i>FA 자격(등록 ${faSvc(p)}시즌) 전에는 옵트아웃해도 FA로 나갈 수 없어 넣을 수 없습니다. ${pm}년 이상 계약부터 가능합니다.</i></div></div>`);
      if(ys>=2&&po.length>1)R.push(row('pOut','선수 옵트아웃',`정한 시즌 뒤 선수가 FA로 나갈 수 있습니다 · 선수에게 유리해 요구액이 줄어듭니다${N.k==='ext'?' · FA 자격이 생기는 해부터':''}`,{seg:1,h:po.map(n=>`<button data-a="ngtSet" data-v="pOut:=${n}" class="${(T.pOut||0)===n?'on':''}">${n?n+'년 뒤':'없음'}</button>`).join('')},'<span class="small muted">요구 없음</span>',true)); }
    if(D.ntc||T.ntc||ovr(p)>=60)R.push(row('ntc','트레이드 거부권','있으면 계약 기간 동안 이 선수를 트레이드할 수 없습니다',{seg:1,h:`<button data-a="ngtSet" data-v="ntc:=0" class="${!T.ntc?'on':''}">없음</button><button data-a="ngtSet" data-v="ntc:=1" class="${T.ntc?'on':''}">부여</button>`},D.ntc?`<span class="pill ${T.ntc?'good':'warn'}">요구</span>`:'<span class="small muted">요구 없음</span>',!D.ntc||T.ntc)); }
  return R.join(''); }
/* 약속 탭(계약 2단계): 역할 · 출전량 · 다음 시즌 보강 · 포스팅 허락(비FA 다년만). 계약서 밖 구두 약속이라 잠금이 없고, 시즌 결산 때 확인한다(61 cpromSeason) */
function ngtPromRows(N,D){ const p=G.players[N.id]; const T=N.T, P=T.pm||{}, V=D.pv||{}; const R=[]; const pc=v=>`<span class="pill ${v>0?'good':''}">가치 +${(Math.round(v*1000)/10).toFixed(1).replace(/\.0$/,'')}%</span>`;
  const row=(l,sub,seg,dem,ok,extra)=>`<div class="ngr ${ok==null?'':ok?'ok':'lo'}"><div class="ngl"><b>${l}</b>${sub?`<i>${sub}</i>`:''}</div><div class="ngc seg">${seg}</div><div class="ngd">${dem}</div>${extra||''}</div>`;
  const btn=(f,v,l,on)=>`<button data-a="ngtSet" data-v="${f}:=${v}" class="${on?'on':''}">${l}</button>`;
  if(N.k==='fa'){ const L=roleSet(p); R.push(row('역할',T.role===0?'지키지 못하면 매달 선수 기분 하락':'요구보다 낮추면 크게 깎습니다',L.map((l,i)=>btn('role',i,l,T.role===i)).join(''),`<span class="pill ${T.role<=D.role?'good':'warn'}">요구 ${L[D.role]}</span>`,T.role<=D.role)); }
  else R.push(row('역할',T.role===0?'지키지 못하면 매달 선수 기분 하락':'계약 기간 첫 2시즌 확인',btn('role',-1,'약속 없음',T.role!==0)+btn('role',0,roleSet(p)[0],T.role===0),pc(T.role===0?V.rl||0:0),null));
  { const K=PM_PT[pmKind(p)], c=pmPtC(p,P.ptc); const lv=[0,1,2].map(i=>btn('pm.pt',i,i?pmPtTxt(c,K[c][i-1]):'없음',(P.pt||0)===i)).join('');
    R.push(row('출전량',`시즌 끝에 1군 기록으로 확인 · 부상으로 빠진 만큼 기준을 낮춥니다`,lv,pc(P.pt>0?(V.pt||[])[P.pt-1]||0:0),null,`<div class="ng-chips" role="group" aria-label="출전 기준">${Object.keys(K).map(k=>`<button class="chip${k===c?' on':''}" data-a="ngtSet" data-v="pm.ptc:=${k}">${PM_PTL[k]} 기준</button>`).join('')}</div>`)); }
  R.push(row('다음 시즌 보강',`그 자리에 1군급(능력 ${PM_SG_MIN}+) 선수를 데려와야 합니다 · 다음 시즌 끝에 확인`,btn('pm.sg','','없음',!P.sg)+Object.keys(PM_SG).map(k=>btn('pm.sg',k,PM_SG[k].replace(' 투수',''),P.sg===k)).join(''),pc(P.sg?V.sg||0:0),null));
  if(N.k==='ext'){ let ok=false; try{ ok=!postDone(p); }catch(e){} const ns=[2,3,4].filter(n=>n<=(T.years||1)&&(p.svc||0)+n>=7&&p.age+n<=33); /* 포스팅은 7시즌 이상·대략 32세까지(35_abroad postingSeason) */
    if(ok&&ns.length)R.push(row('포스팅 허락','그해 겨울 선수가 원하면 해외 진출을 허락합니다',btn('pm.po',0,'없음',!(P.po>0))+ns.map(n=>btn('pm.po',n,`${n}년 뒤`,P.po===n)).join(''),pc(P.po>0?(V.po||0)*(P.po<=2?1:P.po===3?.75:.5):0),null)); }
  const v=pmVal(T,D); return `${R.join('')}<p class="small muted ng-pmn">약속은 계약서에 없는 구두 약속입니다. 약속 가치 합계 +${(Math.round(v*1000)/10)}%(최대 8%). 어기면 선수 기분과 에이전트 친분이 떨어지고, 에이전트는 다음 협상에서 이를 기억합니다.</p>`; }
/* 요구 대비 지금 조건(정확한 숫자 대신 말로). 제안하기 전에는 판정하지 않고 '제안서' 상태만 알려 준다 */
function ngtGap(N,D){ const p=G.players[N.id]; let r;
  if(N.k==='fa'){ const P=ngtPrev(N); if(P&&P.r!=null)return [P.brk||P.st==='bad'||P.st==='far'?'bad':P.st==='counter'?'warn':'good',faPreviewTxt(P)]; r=offScore({annual:termsVal(N.T,D),years:N.T.years})/(faWantFor(p,G.user)*.97); } /* FA: 엔진과 같은 표로 예상 반응(수락 가능·역제안 예상·분위기 하락·결렬 위험) */
  else if(N.k==='ext'){ if(N.T.years<extMinY(p))return ['bad',`에이전트가 최소 ${extMinY(p)}년 계약을 요구합니다`]; { const fl=extFloor(p); if(fl&&(N.T.annual||0)<fl)return ['bad',fl>=p.sal?`다년계약은 연봉이 지금(${money(p.sal)}) 이상이어야 합니다`:`감액 한도(연 ${money(fl)}) 아래입니다`]; } r=termsVal(N.T,D)/termsVal(D,D); } else { return salAccepts(p,salNeg(N.id),Math.max(MIN_SAL,Math.round(N.T.annual)))?['good','요구액 수준입니다']:['warn',`요구까지 ${money(D.annual-N.T.annual)} 남았습니다`]; }
  return r>=1?['good','요구 수준입니다']:r>=.9?['warn','요구에 조금 못 미칩니다']:r>=.75?['bad','요구와 차이가 큽니다']:['bad','요구와 차이가 매우 큽니다']; }
/* FA 제안 전 예상 반응(21_block_agents faPreview): 화면에 보이는 요구·분위기만으로 */
function ngtPrev(N){ if(!N||N.k!=='fa')return null; try{ return faPreview(N.id,{annual:N.T.annual,years:N.T.years,terms:ngtClean(N.T)}); }catch(e){ return null; } }
const ngtMoodLab=m=>m>=70?'좋음':m>=50?'보통':m>=35?'냉랭':m>=FA_CLOSE_MOOD?'결렬 직전':'결렬';
/* 다시 제안할 수 있는 날과 그 규칙(접음 14일 · 결렬 45일+14일 · 원소속 유예 14일) */
function ngtReopenTxt(N,R){ const p=G.players[N.id]; if(R.st==='closed'){ if(N.k!=='fa'||!G.fa||G.fa.closed)return '이 에이전트는 이번 겨울 더 이상 우리와 협상하지 않습니다.'; const n=G.fa.neg&&G.fa.neg[p.id]; return `${dmd(faReopenDay(p.id))}부터 다시 제안할 수 있습니다. 결렬 규칙: FA 시장 개장 45일 뒤(${dsh(G.fa.openDay+45)})이면서 마지막 협상 14일 뒤(${n&&n.lastD!=null?dsh(n.lastD+14):'-'}).`; }
  if(R.next==null)return ''; const ng=N.k==='fa'&&G.fa&&G.fa.neg&&G.fa.neg[p.id]; if(R.st==='grace'||(ng&&ng.grace!=null&&ng.grace===R.next))return `${dmd(R.next)}부터 다시 제안할 수 있습니다. 원소속 구단 유예: 결렬 대신 ${CT_COOL_DAYS}일 협상 중단(이번 겨울 한 번). 다시 결렬되면 45일+14일 규칙이 적용됩니다.`;
  return `${dmd(R.next)}부터 다시 제안할 수 있습니다(협상 접음: ${CT_COOL_DAYS}일 뒤 다시 열림).`; }
/* 라운드 상태(FA: G.fa.neg · 비FA: p.extNg) */
function ngtRound(N){ const p=G.players[N.id]; if(N.k==='sal')return null; const S=N.k==='fa'?(G.fa&&G.fa.neg&&G.fa.neg[p.id])||{}:p.extNg||{}; const ag=hasAgent(p)||N.k==='fa'?agentOf(p):null; const RM=N.k==='fa'?agRoundsMax(p):ctRoundsMax(ag);
  const cool=S.fold!=null&&S.fold>G.day?S.fold:null; return {S,RM,n:S.rounds||0,cool,last:!cool&&(S.rounds||0)===RM-1,end:S.d0!=null?S.d0+CT_ROUND_DAYS:null}; }
/* 제안 결과 줄: 합의·역제안·거절·검토 중·결렬·접음과 다음에 할 수 있는 일 */
function ngtResOf(N){ const p=G.players[N.id]; if(N.res){ if(N.k==='fa'&&N.res.st==='wait'&&!(G.fa&&G.fa.offers&&G.fa.offers[N.id]))return null; /* 철회한 제안은 '검토 중'이 아니다(검수 11-09r) */ return N.res; }
  if(N.k==='ext'&&p.extLast&&G.day-p.extLast.d<=6){ const c=p.extCounter&&p.extCounter.until>=G.day; const nx=extNextDay(p); if(p.extLast.st==='counter'&&c)return {st:'counter'}; if(nx)return {st:'fold',next:nx}; }
  if(N.k==='fa'){ const n=G.fa&&G.fa.neg&&G.fa.neg[p.id]; if(n&&n.closed&&!faReopenOk(p.id))return {st:'closed'}; if(n&&n.fold!=null&&n.fold>G.day)return {st:n.grace===n.fold?'grace':'fold',next:n.fold}; }
  return null; }
function ngtResHtml(N){ const R=ngtResOf(N); if(!R)return ''; const nx=ngtReopenTxt(N,R);
  const M={ok:['good','합의',R.sub||'계약이 확정됐습니다.'],
    counter:['warn','역제안','에이전트가 조건을 바꿔 내놓았습니다. 오른쪽 카드에서 수락·거절하거나 고쳐서 다시 제안하세요. 카드 조건을 그대로 내도 받아들입니다.'],
    no:['bad','거절',N.k==='sal'?'선수가 요구액을 조금 낮춰 답했습니다. 그 금액이면 바로 합의됩니다.':'조건을 바꿔 다시 제안할 수 있습니다.'],
    market:['bad','거절 · FA 시장을 보겠다고 합니다',nx],
    fold:['bad','에이전트가 협상을 접었습니다',nx||'잠시 뒤 다시 제안할 수 있습니다.'],
    cool:['bad','지금은 협상하지 않습니다',nx],
    locked:['bad','이번 주 협상은 끝났습니다',N.k==='sal'?'요구액 이상이면 지금도 바로 합의됩니다. 더 낮게 부르려면 다음 주에 다시 하세요.':nx],
    wait:['warn','검토 중 · 아직 계약 아님',R.shop?`선수가 시장 반응을 보고 ${dsh(R.shop)}쯤 답합니다. 결과는 소식으로 알려 드립니다.`:'다른 구단 조건과 비교해 결정합니다. 사인하면(또는 다른 구단으로 가면) 소식으로 알려 드립니다.'],
    closed:['bad','협상 결렬',nx],
    grace:['bad','결렬 직전 · 원소속 구단이라 한 번 더 기회',nx],
    funds:['bad','FA 계약 자금 부족','선수에게 내밀지 못했습니다(라운드·분위기는 그대로). 계약금을 줄이고 연봉으로 돌리거나, 구단주에게 FA 영입 자금을 요청하세요.'],
    owner:['bad','구단주 결재 거절','선수에게 내밀지 못했습니다(라운드·분위기는 그대로). 조건을 낮추거나 연봉이 많은 선수를 먼저 정리하세요.']};
  const m=M[R.st]; if(!m)return ''; return `<div class="ng-res ${m[0]}"><b>${m[1]}</b>${m[2]?`<span>${esc(m[2])}</span>`:''}</div>`; }
/* 지금 걸린 역제안(FA neg.counter · 비FA extCounter · 연봉 협상은 선수가 낮춰 부른 요구액) */
function ngtCtr(N){ const p=G.players[N.id]; if(N.ctrNo)return null;
  if(N.k==='fa'){ const c=G.fa&&G.fa.neg&&G.fa.neg[p.id]&&G.fa.neg[p.id].counter; return c?{terms:c.terms||{years:c.years,annual:c.annual,bonus:0,opt:0},until:null}:null; }
  if(N.k==='ext'){ const c=p.extCounter&&p.extCounter.until>=G.day?p.extCounter:null; return c?{terms:c.terms||{years:c.years,annual:c.annual,bonus:0,opt:0},until:c.until}:null; }
  const n=salNeg(N.id); return n&&n.st==='open'&&n.cur!=null&&n.ask>n.cur?{terms:{years:1,annual:n.ask,bonus:0,opt:0},until:null}:null; }
/* 역제안 카드: 우리 조건과 바뀐 항목만 줄로 보여 준다(트레이드 수정 제안 카드와 같은 모양) */
function ngtCtrCard(N,C){ const p=G.players[N.id]; const T=N.T, X=C.terms; const L=[]; const mv=(l,a,b)=>{ if((a||0)!==(b||0))L.push(`<li><b>${l}</b> ${money(a||0)} → <em>${money(b||0)}</em></li>`); };
  if((T.years||1)!==(X.years||1))L.push(`<li><b>계약 기간</b> ${T.years}년 → <em>${X.years}년</em></li>`); mv('계약금',T.bonus,X.bonus); mv('연봉',T.annual,X.annual); mv('옵션',T.opt,X.opt);
  if((T.cOpt||0)!==(X.cOpt||0))L.push(`<li><b>구단 연장 옵션</b> ${T.cOpt?'+'+T.cOpt+'년':'없음'} → <em>${X.cOpt?'+'+X.cOpt+'년':'없음'}</em></li>`);
  if(N.k==='fa'&&X.role!=null&&T.role!==X.role)L.push(`<li><b>역할 약속</b> ${roleSet(p)[T.role]||'-'} → <em>${roleSet(p)[X.role]}</em></li>`); if(!!T.ntc!==!!X.ntc)L.push(`<li><b>트레이드 거부권</b> ${T.ntc?'부여':'없음'} → <em>${X.ntc?'부여':'없음'}</em></li>`);
  const k=(N.lk||[]).length; return `<div class="ctr ng-ctr"><span class="eyebrow">에이전트 역제안${C.until?` · ${dsh(C.until)}까지 유효`:''}</span><div class="ctr-o"><p>${esc(N.k==='sal'?`연봉 ${money(X.annual)}`:termsTxt(X,true))}</p>${L.length?`<ul class="ng-diff">${L.join('')}</ul>`:'<span class="small muted">지금 제안서와 같은 조건입니다.</span>'}${k?`<span class="small muted">잠근 조건 ${k}개는 그대로 두었습니다.</span>`:''}<div class="row"><button class="btn small primary" data-a="ngtCounter">수락</button><button class="btn small" data-a="ngtCtrNo">거절</button><button class="btn small" data-a="ngtCtrEdit">고쳐서 다시 제안</button></div></div></div>`; }
/* 대화 기록: FA는 협상 기록(G.fa.neg.log), 비FA는 p.extNg.log, 연봉 협상은 협상 기록(salNeg.log). 첫 줄(요구 조건)은 저장하지 않고 다시 만든다 */
function ngtMsgs(N,D,ag){ const p=G.players[N.id]; let L=[];
  if(N.k==='fa'){ const n=G.fa&&G.fa.neg&&G.fa.neg[p.id]; L=n?n.log.slice():[]; } else if(N.k==='ext')L=(p.extNg&&p.extNg.log||[]).slice(); else L=((salNeg(N.id)||{}).log||[]).slice();
  const open=N.k==='sal'?`구단 산정안은 ${money((salNeg(p.id)||{}).off||p.sal)}입니다. ${ag?'저희는':'저는'} ${money(D.annual)}은 받아야 한다고 봅니다.`:`${ag?'의뢰인이 원하는 조건입니다.':'제가 원하는 조건입니다.'} ${termsTxt(D,true)}${D.role===0?` · ${roleSet(p)[0]}`:''}${D.ntc?' · 트레이드 거부권':''}.${N.k==='ext'&&agExtTestMarket(p)?' 시장 평가를 받아 보고 싶은 몫까지 넣었습니다.':''}`;
  const who=ag?esc(ag.name):esc(p.name); const mem=ag?agMemTxt(ag,G.user):''; /* 지난 협상 기억(계약 2단계) */
  const line=x=>x.w==='구단'?`<div class="ngm me"><i>우리 제안${x.acc?' · 역제안 수락':''}${x.lk&&x.lk.length?` · 잠금 ${x.lk.length}`:''} <s>${dsh(x.d)}</s></i>${esc(x.tm?termsTxt(x.tm,true):x.t?x.t:x.a!=null?`${x.y?x.y+'년 ':''}연 ${money(x.a)}`:'')}</div>`:`<div class="ngm ag${x.k==='fold'?' bad':''}"><i>${who} <s>${dsh(x.d)}</s></i>${esc(x.t)}</div>`;
  const tail=N.msg?`<div class="ngm sys"><i>운영팀</i>${esc(N.msg)}</div>`:'';
  return `${mem?`<div class="ngm ag"><i>${who} · 지난 협상</i>${esc(mem)}</div>`:''}<div class="ngm ag"><i>${who}</i>${esc(open)}</div>${L.map(line).join('')}${tail}`; }
/* 왼쪽 선수 보고서 */
function ngtReport(N,D){ const p=G.players[N.id]; const T=N.T; const b=budget(); let rp=null; try{ rp=scoutReport(p); }catch(e){}
  const v=Math.round(termsEq(D,D)); const lo=round5(v*.9), hi=round5(v*1.1);
  const stars=`<div class="ng-st"><span><i>현재</i>${rp?(()=>{ try{ return currentAbilityStars(rp); }catch(e){ return '-'; } })():'-'}</span><span><i>잠재</i>${potChipP(p)||'-'}</span></div>`;
  const tot=(T.bonus||0)+T.annual*(T.years||1); const capAvg=T.annual+Math.round((T.bonus||0)/(T.years||1));
  if(N.k==='sal'){ const sb=salBasis(p); const d=T.annual-p.sal; const cc=ngtCapC(N); return `<aside class="ng-rep"><div class="ng-sum">
    <div><i>지금 연봉 · 계약</i><b class="num">${money(p.sal)}</b><em>${esc(ctText(p))}</em></div>${stars}
    <div><i>직전 시즌</i><b>${sb.h?`WAR ${sb.war.toFixed(1)}`:'1군 기록 없음'}</b><em>${esc(sb.band)} · 산정안 인상 기준 +${sb.cap}%</em></div>
    <div><i>인상률</i><b class="num ${d>0?'warn':''}">${d>=0?'+':''}${p.sal?Math.round(d/p.sal*100):0}%</b><em>${money(p.sal)} → ${money(T.annual)}</em></div>
    <div><i>예산 여유(구단주 목표 기준)</i><b class="num">${money(b.roomGoal)}</b><em>${dobj(G.day).m<=3&&G.day>KD(1,10)?'1월 31일 마감 · 미합의면 구단 마지막 제시액으로 확정':(p.svc||0)>=ARB_SVC?'1월 10일까지 안 되면 연봉조정 신청 가능':'연봉조정 신청 대상 아님'}</em></div>
    ${cc?`<div><i>${cc.hard?'구단주 허용 한도 초과':'구단주 결재 필요'}</i><b class="num ${cc.hard?'bad':'warn'}">${cc.hard?'승인 불가':`승인 가능성 ${capPLabel(cc.p)}`}</b><em>${cc.s}시즌 상위 40명 연봉이 상한을 ${money(cc.over)} 넘습니다</em></div>`:''}</div></aside>`; }
  const [s0]=ngtSeasons(N); const PX=N.k==='fa'&&!p.foreign?postCapOut(G.user,s0):null; const W=capPayWith(G.user,p.id,p.foreign?null:capAvg,s0,PX&&PX.ids.size?PX.ids:null); const over=W.tot-W.cap; /* FA 결재와 같은 기준: 포스팅 신청 선수는 이적 예상으로 뺀다 */ const cc=over>0?ngtCapC(N):null; const X=over>0?capTaxEst(over):null;
  return `<aside class="ng-rep"><div class="ng-sum">
    <div><i>시장 가치(운영팀 추정)</i><b class="num">연 ${money(lo)}~${money(hi)}</b><em>${N.k==='fa'?`${p.faGrade}등급 FA · 관심 구단 ${Object.keys(G.fa.ai[p.id]||{}).length}곳`:'예상 FA 시장가 기준'}</em></div>
    <div><i>지금 연봉 · 계약</i><b class="num">${money(p.faPrevSal&&N.k==='fa'?p.faPrevSal:p.sal)}</b><em>${N.k==='fa'?`원소속 ${esc(tshort(p.faFrom))}`:esc(ctText(p))}</em></div>${stars}
    <div><i>적용 시즌 · 보장 총액</i><b class="num">${ngtSeasons(N).join('~')} · ${money(tot)}</b><em>${T.opt?`옵션 포함 최대 ${money(tot+T.opt*(T.years||1))}`:'옵션 없음'}</em></div>
    ${ngtCashRow(T,s0,p.foreign?null:capAvg)}
    <div><i>${W.s}시즌 상한 합계(계약 후)</i><b class="num ${over>0?'bad':''}">${money(W.tot)}</b><em>상한 ${money(W.cap)}${over>0?` · ${money(over)} 초과`:` · 여유 ${money(-over)}`} · 상한 반영 연 ${money(capAvg)}${PX&&PX.amt>0?` · ${esc(postCapTxt(PX))}`:''}</em></div>
    ${over>0?`<div><i>${cc?(cc.hard?'구단주 허용 한도 초과':'구단주 결재 필요'):'넘겨도 계약할 수 있습니다'}</i><b class="num ${cc&&cc.hard?'bad':'warn'}">${cc?(cc.hard?'승인 불가':`승인 가능성 ${capPLabel(cc.p)}`):`제재금 약 ${money(X.tax)}`}</b><em>시즌 끝까지 넘으면 초과분의 ${Math.round(capRate(X.n)*100)}%를 냅니다(${X.n}회 연속). 트레이드 마감 전에 줄이면 내지 않습니다.</em></div>`:''}
    <div><i>예산 여유</i><b class="num">${money(b.roomGoal)}</b><em class="${T.bonus>b.roomGoal?'bad':''}">${T.bonus?`계약금 ${money(T.bonus)} 즉시 지급${T.bonus>b.roomGoal?' · 예산 여유를 넘습니다':''}`:'계약금 없음'}</em></div>
    ${N.k==='fa'&&faCompTxt(p)?`<div><i>영입 보상</i><em>${esc(faCompTxt(p))}</em></div>`:''}</div></aside>`; }
/* 연도별 현금 지출(접는 줄): 계약금은 합의 때 바로(지금 결산 연도), 연봉은 계약 시즌마다, 옵션은 달성할 때만. 상한 반영액(연봉 + 계약금 ÷ 기간)은 따로 적는다(외부 검수 11-17: 3칸 협상 화면에서 빠짐) */
function ngtCashRow(T,s0,capAvg){ if(!T||(T.years||1)<2&&!(T.bonus>0))return ''; let cy=[]; try{ cy=ctCashYears(T,s0); }catch(e){ return ''; } if(!cy.length)return '';
  const row=x=>`<li><span class="num">${x.y}</span><b class="num">${money(x.v)}</b><em>${[x.bon?`계약금 ${money(x.bon)}`:'',x.sal?`연봉 ${money(x.sal)}`:'',T.opt>0&&x.sal?`옵션(달성 시) 최대 +${money(T.opt)}`:'',capAvg!=null&&x.y>=s0?`상한 반영 ${money(capAvg)}`:''].filter(Boolean).join(' · ')}</em></li>`;
  return `<details class="ng-cash"><summary><i>연도별 지출</i><b class="num">${cy.map(x=>money(x.v)).join(' / ')}</b></summary><ul>${cy.map(row).join('')}</ul><p class="small muted">${T.bonus>0?`계약금은 합의 때 바로 지급(${sponSeason()} 결산) · `:''}연봉은 ${s0}시즌부터${T.opt>0?' · 옵션은 달성한 해에만 더 나갑니다':''}${capAvg!=null?' · 상한 반영액은 연봉에 계약금을 기간으로 나눠 더한 값':''}</p></details>`; }
/* 오른쪽 에이전트 칸 */
function ngtChat(N,D){ const p=G.players[N.id]; const ag=hasAgent(p)||N.k==='fa'?agentOf(p):null; const fn=N.k==='fa'&&G.fa&&G.fa.neg?G.fa.neg[p.id]:null; const R=ngtRound(N); const C=ngtCtr(N);
  const expr=fn?(fn.counter?'flat':fn.hot||fn.deal?'smile':fn.mood<40?'angry':null):null; const st=ag?(AG_STYLE[ag.style]||AG_STYLE.rel):null; const pf=ag?agPref(ag):null;
  const head=`<div class="ng-agc">${ag?agAv(ag,expr):avImg(p)}<div><b>${ag?esc(ag.name):esc(p.name)+' 본인'}</b><span class="small muted">${ag?`<button class="lnk" data-a="agSel" data-v="${ag.id}">${esc(ag.firm)}</button> · ${esc(st.l)} · 경력 ${ag.exp||1}년 · 친분 ${agRelLab(agRel(ag))}`:'에이전트 없이 직접 협상합니다 · 수수료 없음'}</span>${ag&&N.k!=='sal'?`<span class="small muted ng-fee">수수료는 선수가 냅니다(${agFee(ag)}%, 상한 ${AG_FEE_CAP}%). 그래서 ${AG_PREF_L[pf]}을(를) 먼저 챙깁니다.</span>`:!ag&&N.k!=='sal'?'<span class="small muted ng-fee">요구가 소박한 대신 원소속 구단 정을 크게 봅니다.</span>':''}</div></div>`;
  const left=R?Math.max(0,R.RM-Math.min(R.n,R.RM)):0; const md=fn?fn.mood:N.k==='fa'?faMood0(p):null; const mc=md==null?'':md>=60?'good':md>=35?'warn':'bad';
  const rd=R?`<div class="ng-rdw"><div class="ng-kpi"><div class="ng-kp ${R.cool?'bad':left<=1?'warn':''}"><i>남은 제안 횟수</i><b class="num">${R.cool?'중단':`${left}회`}</b><em>${R.cool?`${dsh(R.cool)}부터 다시`:`${R.RM}회 중 ${Math.min(R.n,R.RM)}회 사용${R.end!=null?` · ${dsh(R.end)}까지`:''}`}</em></div>${md!=null?`<div class="ng-kp ${mc}"><i>협상 분위기</i><b class="num">${md} · ${ngtMoodLab(md)}</b><em>${FA_CLOSE_MOOD} 아래로 내려가면 결렬</em><span class="gauge"><i style="width:${md}%;background:var(--${mc})"></i></span></div>`:''}</div>${R.last?'<div class="ng-rd small"><span class="warn">다음 제안이 마지막입니다</span></div>':''}</div>`:'<div class="ng-rd small"><span>한 주에 한 번 제시</span></div>';
  return `<aside class="ng-chat${N.chatOpen?' open':''}">${head}${rd}<div class="ng-msgs" aria-live="polite">${ngtMsgs(N,D,ag)}</div><button class="ng-more small" data-a="ngtChat">${N.chatOpen?'대화 접기':'대화 전체 보기'}</button>${C?ngtCtrCard(N,C):''}</aside>`; }
function ngtSheet(){ const N=UI.ngt; const p=G.players[N.id]; if(!p)return ''; const D=ngtDemand(N); const T=N.T;
  const fn=N.k==='fa'&&G.fa&&G.fa.neg?G.fa.neg[p.id]:null; const [gc,gt]=ngtGap(N,D); const R=ngtRound(N); const C=ngtCtr(N);
  const closed=fn&&fn.closed&&!(N.k==='fa'&&faReopenOk(p.id)); /* 다시 열 수 있는 날이 되면 제안 버튼을 살린다 */
  const cool=R&&R.cool; const salLock=N.k==='sal'&&(()=>{ const n=salNeg(N.id); return n&&n.wk===Math.floor(G.day/7)&&T.annual<n.ask; })();
  const tot=(T.bonus||0)+T.annual*(T.years||1); const nAI=N.k==='fa'?Object.keys(G.fa.ai[p.id]||{}).length:0; const dl=N.k==='fa'?faDL():null;
  const allLk=N.k!=='sal'&&['annual','bonus'].every(f=>(N.lk||[]).includes(f));
  return `<div class="scrim" data-a="ngtClose"><div class="sheet gut ngt ngt3" data-stop="1" role="dialog" aria-label="계약 협상">
    <div class="sheet-head"><div class="ng-h">${avImg(p)}<div><span class="eyebrow">${NGT_K[N.k]} · ${esc(posLabel(p))} · ${p.age}세</span><h2 class="sec">${esc(p.name)}</h2><span class="small muted">${N.k==='fa'?`${p.faGrade}등급 FA · 관심 구단 ${nAI}곳 · 마감 ${dsh(dl)}(D-${Math.max(0,dl-G.day)})`:`지금 연봉 ${money(p.sal)} · ${ctText(p)}`}${!p.foreign&&N.k!=='sal'?` · ${esc(milText(p))}`:''}</span></div></div><button class="x" data-a="ngtClose" aria-label="닫기">×</button></div>
    ${ngtResHtml(N)}
    <div class="ng3">
      ${ngtReport(N,D)}
      <section class="ng-mid">
        ${N.k==='ext'?(()=>{ const x=extParts(p,T.years); const m=Math.round((x.mkt-1)*100); return `<div class="ng-why"><span class="eyebrow">요구액 근거 · 전력분석팀</span><p class="small">${x.ytf?`FA까지 ${x.ytf}시즌`:'지금 FA 자격'} · FA 시장 분위기 <b>${faMktLabel(x.mkt)}</b>(${m>=0?'+':''}${m}%) · 예상 FA 시장가 연 <b>${money(x.expFA)}</b></p><p class="small muted keep">${x.why.map(esc).join(' · ')}${x.yadj!==1?` · ${T.years}년 계약 기간 ${x.yadj>1?'+':''}${Math.round((x.yadj-1)*100)}%`:''}</p></div>`; })():''}
        ${ngtMil(N)}${p.postPromise&&p.team===G.user?`<div class="ng-mil small"><b>포스팅 약속</b> ${p.postPromise}년 포스팅 허락을 약속했습니다. 이 계약을 맺어도 약속은 남습니다.</div>`:''}
        ${N.k!=='sal'?`<div class="seg ng-tabs" role="tablist" aria-label="협상 탭"><button role="tab" aria-selected="${N.tab!=='prom'}" class="${N.tab!=='prom'?'on':''}" data-a="ngtTab" data-v="terms">조건</button><button role="tab" aria-selected="${N.tab==='prom'}" class="${N.tab==='prom'?'on':''}" data-a="ngtTab" data-v="prom">약속${pmCount(T)?` ${pmCount(T)}`:''}</button></div>`:''}
        <div class="ng-rows">${N.k!=='sal'&&N.tab==='prom'?ngtPromRows(N,D):ngtRows(N,D)}</div>
        ${N.k==='ext'&&N.kept?`<div class="note warn small">기간을 바꿨지만 직접 정한 금액은 그대로 두었습니다. ${T.years}년 기준 요구는 ${esc(termsTxt(D,true))}입니다.</div>`:''}
        <div class="ng-tot ng-gap ${gc}"><span><i>제안서</i><b class="num">${N.k==='sal'?money(T.annual):`${T.years}년 총 ${money(tot)}`}</b></span><span><i>요구 대비</i><b>${gt}</b></span>${allLk?'<span class="small warn">금액을 모두 잠갔습니다. 모자라면 에이전트가 풀 잠금을 알려 줍니다.</span>':''}${N.k==='fa'?`<span class="small muted">${esc(agCtxTxt(p,nAI,dl)||'아직 다른 구단 제안은 없습니다.')}</span>`:''}</div>
      </section>
      ${ngtChat(N,D)}
    </div>
    ${N.k==='fa'&&!closed&&G.day>=G.fa.openDay?faRivalHtml(p,false):''}
    <div class="ng-acts">
      ${closed?`<span class="note bad small">에이전트가 협상을 끝냈습니다. ${esc(ngtReopenTxt(N,{st:'closed'}))}</span>`:''}
      <button class="btn" data-a="ngtDemand"${closed?' disabled':''}>요구대로 채우기</button>${N.k==='fa'&&!closed&&G.day>=G.fa.openDay&&(()=>{ try{ const V=faRivalView(p.id); return V&&!V.dBeats; }catch(e){ return false; } })()?'<button class="btn" data-a="ngtBeat" title="요구 묶음 모양 그대로, 다른 구단 최고 조건보다 앞서는 금액으로 채웁니다(결재·예산은 제안할 때 확인)">다른 구단 넘기기</button>':''}${N.k==='fa'&&G.fa.offers[p.id]?'<button class="btn danger" data-a="ngtWithdraw">제안 철회</button>':''}
      <button class="btn ng-close" data-a="ngtClose">닫기</button>
      <button class="btn" data-a="ngtCounter"${C&&!closed?'':' disabled'}>역제안 수락</button>
      <button class="btn primary" data-a="ngtSubmit"${closed||cool||salLock?' disabled':''}>${cool?`제안 ${dsh(cool)}부터`:R&&R.last?'제안(마지막 라운드)':'제안'}</button></div></div></div>`; }
function ngtSet(v){ const N=UI.ngt; if(!N)return; const [f,x]=v.split(':'); const T=N.T;
  if(x[0]==='='&&f.startsWith('pm.')){ const k=f.slice(3), raw=x.slice(1), p=G.players[N.id]; const P=T.pm={...(T.pm||{})}; if(k==='ptc')P.ptc=pmPtC(p,raw); else if(k==='sg')P.sg=PM_SG[raw]?raw:''; else if(k==='pt'||k==='po')P[k]=clamp(Math.round(+raw)||0,0,k==='pt'?2:4);
    P.ptc=pmPtC(p,P.ptc); P.n=P.pt>0?pmPtN(p,P.ptc,P.pt):0; if(!P.sg)delete P.sg; return; } /* 약속 탭 */
  if(x[0]==='='){ const raw=x.slice(1); if(f==='optC'){ if(OPT_CRIT[raw])T.optC=raw; return; } const val=+raw; if(f==='role'&&val<0){ T.role=null; return; } if(f==='ntc')T.ntc=!!val; else if(f==='years'){ ngtYears(N,val); if(N.k==='ext')N.msg=null; } else T[f]=val; }
  else { T[f]=Math.max(f==='annual'?MIN_SAL:0,Math.round((T[f]||0)+(+x))||0); N.ed=true; N.kept=false; }
  if(T.pOut&&(T.pOut>=(T.years||1)||(N.k==='ext'&&T.pOut<pOutMin(G.players[N.id],ngtSeasons(N)[0]))))T.pOut=0; /* 옵트아웃은 계약 기간 안쪽, 비FA는 FA 자격이 생기는 해부터 */
  if(f==='bonus'||f==='opt')T[f]=Math.max(0,Math.round(T[f]||0)); }
function ngtLock(f){ const N=UI.ngt; if(!N)return; const L=N.lk=N.lk||[]; const i=L.indexOf(f); if(i>=0)L.splice(i,1); else L.push(f); }
function ngtSubmit(){ if(!contractMoneyValid())return; const N=UI.ngt; const p=G.players[N.id]; const T=ngtClean(N.T); const lk=(N.lk||[]).slice(); N.ctrNo=false;
  if(N.k==='fa'){ if(faOutBlocked(G.user,p)){ N.msg=`이번 겨울 다른 구단 FA는 ${faCapN()}명까지만 영입할 수 있습니다(${ASSOC.s} 규약 제173조).`; return; }
    { const cc=ngtCapC(N); if(cc&&!cc.ok){ N.msg=cc.msg; N.res={st:'owner'}; return; } } /* 협상이 열리기 전에 미리 넣는 조건도 결재부터 */
    if(G.day<G.fa.openDay){ const D=termsDemand(p,'fa',{annual:faWantA(p),years:p.ask.years}); G.fa.offers[p.id]={annual:Math.round(termsVal(T,D)),years:T.years,terms:T,lock:lk}; N.msg=dmd(G.fa.openDay)+' 협상이 열리면 에이전트가 답합니다. 조건은 미리 넣어 두었습니다.'; return; }
    const n0=negOf(p.id).log.length; const r=faNegotiate(p.id,{annual:T.annual,years:T.years,terms:T,lock:lk}); UI.faMsg={id:p.id,t:r.msg}; if(p.team===G.user){ UI.ngt=null; UI.stamp={title:'FA 계약',msg:r.msg}; return; } if(r.owner){ N.msg=r.msg; N.res={st:r.funds?'funds':'owner'}; return; } N.msg=negOf(p.id).log.length>n0?null:r.msg.replace(/^[^:]+: /,''); N.res=r.st?{st:r.st,shop:r.shop,next:r.st==='fold'||r.st==='cool'||r.st==='grace'?negOf(p.id).fold:null}:null; return; }
  if(N.k==='ext'){ const r=offerExtension(p.id,T.annual,T.years,false,T,lk); N.msg=r.st==='owner'||r.st==='na'?r.msg:null; N.res=r.st?{st:r.st,next:r.next??(p.extLast||{}).next}:null; if(r.ok){ UI.stamp={title:'다년계약 합의',msg:`${p.name} · ${termsTxt(T,true)} · ${r.now?'바로 적용':'다음 시즌부터 적용'}`}; UI.ngt=null; } return; }
  const cc0=ngtCapC(N); const n=salNeg(N.id); const r=salOffer(p.id,T.annual); if(cc0&&!cc0.ok&&r===cc0.msg){ N.msg=r; N.res={st:'owner'}; return; } UI.ctMsg=r; const sn=salNeg(p.id)||{};
  if(n&&!/이번 주에는/.test(r)){ const L=n.log=n.log||[]; L.push({d:G.day,w:'구단',a:Math.round(T.annual)},{d:G.day,w:'에이전트',t:r.replace(/^[^:]+: /,'')}); if(L.length>8)L.splice(0,L.length-8); } else N.msg=r.replace(/^[^:]+: /,''); /* 연봉 협상 대화 기록(그 겨울 협상이 끝나면 함께 지워진다) */
  if(sn.st==='ok'){ UI.stamp={title:'연봉 합의',msg:`${p.name} · ${money(p.newSal??T.annual)}`}; UI.ngt=null; } else N.res={st:/이번 주에는/.test(r)?'locked':'no'}; }
function ngtCounter(){ const N=UI.ngt; const p=G.players[N.id]; N.ctrNo=false;
  if(N.k==='fa'){ const cc=faCapCheck(p,(G.fa&&G.fa.neg&&G.fa.neg[p.id]||{}).counter); if(cc&&!cc.ok){ N.msg=cc.msg+' 역제안은 그대로 둡니다.'; N.res={st:'owner'}; return; } const r=faAcceptCounter(p.id); UI.faMsg={id:p.id,t:r}; N.msg=r; if(p.team===G.user){ UI.ngt=null; UI.stamp={title:'FA 계약',msg:r}; } else N.res={st:'wait'}; return; }
  if(N.k==='sal'){ const C=ngtCtr(N); if(!C)return; N.T.annual=C.terms.annual; ngtSubmit(); return; }
  const c=p.extCounter; if(!c)return; const r=offerExtension(p.id,c.annual,c.years,true,c.terms||null); N.msg=r.st==='owner'?r.msg:null; N.res=r.st?{st:r.st,next:r.next}:null; if(r.ok){ UI.stamp={title:'다년계약 합의',msg:`${p.name} · ${c.terms?termsTxt(c.terms,true):`${c.years}년 연 ${money(c.annual)}`} · ${r.now?'바로 적용':'다음 시즌부터 적용'}`}; UI.ngt=null; } }
/* 역제안 거절: 카드를 내리고 지금 제안서로 돌아간다(에이전트 쪽 조건은 지운다) */
function ngtCtrNo(){ const N=UI.ngt; const p=G.players[N.id]; if(N.k==='fa'){ const n=G.fa&&G.fa.neg&&G.fa.neg[p.id]; if(n&&n.counter){ n.counter=null; n.log.push({d:G.day,w:'구단',t:'역제안 거절',a:null}); } } else if(N.k==='ext')delete p.extCounter; N.ctrNo=true; N.res=null; N.msg='역제안을 거절했습니다. 조건을 바꿔 다시 제안할 수 있습니다.'; }
/* 역제안을 바탕으로 고치기: 카드 조건을 제안서로 옮긴다(그대로 내면 수락과 같다) */
function ngtCtrEdit(){ const N=UI.ngt; const C=ngtCtr(N); if(!C)return; N.T={...N.T,...ngtClean(C.terms)}; if(N.k!=='sal'&&!N.T.optC)N.T.optC=optCrit(G.players[N.id]); N.ed=true; N.kept=false; N.msg='역제안 조건을 제안서로 옮겼습니다. 고쳐서 제안하세요.'; }
/* 입구 버튼: 지금 우리 제안 요약 */
function ngtDoor(k,p){ const o=k==='fa'?G.fa.offers[p.id]:null; const ag=hasAgent(p)?agentOf(p):null;
  const cur=o?(o.terms?termsTxt(o.terms,true):`${o.years}년 연 ${money(o.annual)}`)+(o.rej?' (선수가 거절함)':''):null;
  return `<button class="mt-door" data-a="ngtOpen" data-v="${k}:${p.id}">${ag?agAv(ag):avImg(p)}<span><b>협상</b><i>${ag?`${esc(ag.name)} 에이전트 · ${esc(ag.firm)}`:`${esc(p.name)} 본인과 협상`}</i><i>${cur?`지금 우리 제안: ${esc(cur)}`:k==='fa'?`요구 ${p.ask.years}년 연 ${money(p.ask.annual)} 수준`:'기간 · 계약금 · 연봉 · 옵션을 정해 제안합니다'}</i></span><em>›</em></button>`; }
