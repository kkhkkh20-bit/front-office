/* 창단 드래프트 화면의 선수 칩: 지명된 선수도 실제 능력 대신 우리 스카우트 추정 등급만 보여 준다 */
function fdChip(p){ if(p&&p.team!=null&&!p.fdPool)return `<b class="rc fde-g fde-real" style="--c:${rcol(ovr(p))}" title="실제 현재 능력(지명되면 공개). 잠재력은 추정입니다">${GRD(ovr(p))}</b>`; return fdEstChip(fdEstOf(p)); }
/* ---------- 창단 드래프트: 우리 팀 빈자리 보드 ---------- */
const FDPOS={C:[50,90],'1B':[85,62],'2B':[68,36],SS:[32,36],'3B':[15,62],LF:[14,14],CF:[50,10],RF:[86,14]};
function fdLineupOf(list){ const used=new Set(), ln={}; const KS=['C','SS','2B','CF','3B','RF','LF','1B'];
  /* 먼저 원래 포지션에 세우고, 남은 빈자리만 보조 포지션으로 채운다(3루수를 2루에 먼저 세우지 않게) */
  for(const pass of [0,1])for(const k of KS){ if(ln[k])continue; const ok=list.filter(p=>!used.has(p.id)&&(pass===0?p.pos===k:(subsOf(p)||[]).includes(k))).sort((a,b)=>posScore(b,k)-posScore(a,k)); if(ok[0]){ ln[k]=ok[0]; used.add(ok[0].id); } }
  const rest=list.filter(p=>!used.has(p.id)).sort((a,b)=>offV(b)-offV(a)); if(rest[0]){ ln.DH=rest[0]; used.add(rest[0].id); } return {ln,bench:list.filter(p=>!used.has(p.id))}; }
function fdBoard(myPicks,ci,justId){ const bats=myPicks.filter(p=>!p.isP), pits=myPicks.filter(p=>p.isP); const {ln,bench}=fdLineupOf(bats);
  const slot=k=>{ const p=ln[k]; const [x,y]=FDPOS[k]||[0,0]; const st=k==='DH'?'':`left:${x}%;top:${y}%`;
    return p?`<button class="fbs on${p.id===justId?' just':''}" style="${st}" data-a="player" data-v="${p.id}"><i>${SLK[k]}</i><b>${esc(p.name)}</b>${fdChip(p)}</button>`
      :`<button class="fbs empty" style="${st}" data-a="fdSlot" data-v="${k}"><i>${SLK[k]}</i><b>빈자리</b><em>찾기</em></button>`; };
  const P=[...pits].sort((a,b)=>(spV(b)+roleBias(G.user,b))-(spV(a)+roleBias(G.user,a)));
  const pc=(p,i)=>`<button class="fpp${p.id===justId?' just':''}" data-a="player" data-v="${p.id}"><i>${i<5?'선발형':'불펜형'}</i><b>${esc(p.name)}</b>${fdChip(p)}</button>`;
  const empties=Math.max(0,FD_TGT.P-pits.length);
  const miss=['C','1B','2B','3B','SS','LF','CF','RF'].filter(k=>!ln[k]).map(k=>SLK[k]);
  const pitN=pits.length;
  return `<section class="card fdbd"><div class="row between"><h2 class="sec">우리 팀 ${myPicks.length}명</h2>${(()=>{ const M=fdMoney(); return M?`<span class="small ${M.room<0?'bad':'muted'}">연봉 ${money(M.spent)} / 한도 ${money(M.lim)}</span>`:`<span class="small muted">연봉 ${money(ci.pay)} / 상한 ${money(ci.cap)}</span>`; })()}</div>
    <p class="small ${miss.length?'':'good'}">${miss.length?`빈 수비 위치 ${['C','1B','2B','3B','SS','LF','CF','RF'].filter(k=>!ln[k]).map(k=>`<button class="pill lnkp" data-a="fdSlot" data-v="${k}">${SLK[k]}</button>`).join('')}`:'수비 위치 8곳 완료'} · <button class="pill lnkp" data-a="fdSlot" data-v="P">투수 ${pitN}/${FD_TGT.P}</button> · <span class="muted">연봉 ${money(ci.pay)}</span></p>
    <div class="fld"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 96 L88 58 L50 20 L12 58 Z" class="dia"/><path d="M50 96 L2 48 Q50 -14 98 48 Z" class="ofl"/></svg>${['C','1B','2B','SS','3B','LF','CF','RF'].map(slot).join('')}</div>
    <div class="fdh2"><span>지명타자</span>${slot('DH')}${bench.length?`<span>벤치</span>${bench.map(p=>`<button class="fpp${p.id===justId?' just':''}" data-a="player" data-v="${p.id}"><i>${SLK[p.pos]}</i><b>${esc(p.name)}</b>${fdChip(p)}</button>`).join('')}`:''}</div>
    <div class="row between fdpgh" style="margin-top:8px"><b class="small">투수진 ${pits.length}/${FD_TGT.P}</b><span class="small muted">보직은 감독이 체력·투구를 보고 정합니다</span></div>
    <div class="fdpg">${P.map(pc).join('')}${empties?`<button class="fpp empty" data-a="fdSlot" data-v="P"><i>투수 빈자리</i><b>${empties}명 더 · 찾기</b></button>`:''}</div></section>`; }
/* 창단 직후: 구단주 환영과 재정 전망, 그다음 드래프트 */
function fdWaitView(){ const t=team(G.user); const B=bossOf(G.user); const f=fdFin(); const ok=f.avail>=f.cap, mid=f.avail>=f.cap*.75;
  const row=(l,v,c)=>`<div class="row between"><span>${l}</span><b class="num ${c||''}">${v}</b></div>`;
  return `${fdSteps(2)}<section class="card hero"><div class="eyebrow">${tname(G.user)} 창단</div><div class="row" style="flex-wrap:nowrap;gap:12px">${badge(G.user,48)}<div><h2 class="sec">${esc(B.own.name)} 회장이 반깁니다</h2><p class="small">"${esc(OWNVOICE[t.owner])}"</p></div></div></section>
  <section class="card"><h2 class="sec">올해 재정 전망</h2>
    <details class="frule"><summary class="small">항목별 수입·지출 보기</summary>
    ${f.inc.map(x=>row(x[0],money(x[1]))).join('')}${row('<b>예상 수입 합계</b>',money(f.I))}
    <div style="height:6px"></div>${f.otherRows.map(x=>row(x[0],'-'+money(x[1]),'bad')).join('')}${row('<b>선수 연봉 외 지출</b>','-'+money(f.other),'bad')}
    <div style="height:6px"></div>${row(t.indie?'모기업 지원':'모기업 지원 한도',t.indie?'없음':money(f.sup))}${row('보유 현금',money(f.cash))}</details>
    <div class="note ${ok?'':mid?'warn':'bad'}" style="margin-top:8px"><div class="fdm3"><div><span>재정 여력</span><b>${money(Math.max(0,f.avail))}</b><i>모기업 지원 포함</i></div><div><span>리그 상한</span><b>${money(f.cap)}</b><i>경쟁균형세</i></div><div><span>드래프트 한도</span><b>${money(Math.min(f.cap,Math.max(0,f.avail)))}</b><i>둘 중 작은 쪽</i></div></div>${ok?'재정 여력이 상한보다 커서, 상한까지 채워도 버틸 수 있습니다.':mid?'캡을 꽉 채우면 적자입니다. 여력 안쪽으로 뽑는 게 안전합니다.':'비싼 선수를 여럿 뽑으면 적자가 납니다. 연봉 대비 기록이 좋은 선수를 찾아야 합니다.'} 재정 여력은 모기업 지원을 한도까지 받는다고 가정한 값입니다. 드래프트가 끝나면 구단주가 올해 지원 목표를 정하고, 그 기준으로 화면 위 '예산 여유'가 표시됩니다.</div></section>
  <section class="card"><h2 class="sec">다음 단계: 창단 드래프트</h2><p class="small">리그 국내 선수 전원을 10개 구단이 ${FD_ROUNDS}라운드에 걸쳐 나눕니다. 단장은 주전급을 뽑는 앞 ${FD_MAN}라운드를 직접 지명합니다. 그다음 나머지를 스카우트에게 맡길지, ${FD_MORE}라운드 더 뽑을지 고릅니다. 시작하면 먼저 후보를 둘러볼 시간이 있고, 준비되면 1라운드를 엽니다.</p>
    <button class="btn primary block" data-a="fdBegin">창단 드래프트 열기</button></section>`; }
/* ---------- 창단 드래프트 화면 ---------- */
function fdView(){ const F=G.fd; const pk=F.picks[F.cur]; const pre=F.open===false; const mine=!pre&&pk&&pk.tid===G.user;
  const myPicks=F.picks.filter(x=>x.tid===G.user&&x.pid).map(x=>G.players[x.pid]).filter(Boolean);
  const ci=capInfo(G.user); const sl=new Set(G.shortlist||[]);
  const TK=new Map(F.picks.filter(x=>x.pid).map(x=>[x.pid,x]));
  const gk=UI.fdG||'B', f=UI.fdF||'all', so=UI.fdS||'', dir=UI.fdD||0, young=!!UI.fdY, onlyS=!!UI.fdO, hide=UI.fdHide==null?true:!!UI.fdHide; const X=fdCtx(G.user); const ly=(F.y||G.year)-1;
  const posOk=p=>gk==='P'?p.isP&&(f==='SP'?isSPr(p):f==='RP'?!isSPr(p):true):!p.isP&&(f==='all'||p.pos===f||(f==='OF'&&['LF','CF','RF'].includes(p.pos)));
  /* 지명된 선수도 목록에서 빠지지 않고 제자리에 회색으로 남는다 */
  const ALL=(F.all||Object.keys(F.est||{}).map(Number)).map(id=>G.players[id]).filter(p=>p&&(p.fdPool||TK.has(p.id)));
  const left=ALL.filter(p=>p.fdPool);
  let L=ALL.filter(p=>posOk(p)&&(!young||p.age<=24)&&(!onlyS||sl.has(p.id))&&(!hide||p.fdPool)).map(p=>({p,t:TK.get(p.id)||null,s:fdStatLine(p,ly),v:fdScore(G.user,p,true,X)}));
  const cntB=left.filter(p=>!p.isP).length, cntP=left.length-cntB;
  /* 세 탭: 성적(기본, 지난 3년) · 스카우트(툴·체격·의견) · 데이터팀(세부 데이터·의견). 이름 칸에 뺏길 확률과 연봉을 함께 둔다 */
  const RK=pre||F.done?{}:fdRisk(); const ANA=dataLv(G.user)>=1; const MM=fdMoney(); const isP=gk==='P';
  const V=['rec','sc','dt'].includes(UI.fdV)?UI.fdV:'rec';
  const TO=isP?[['stf','구위'],['ctl','제구'],['sta','체력']]:[['pow','파워'],['con','컨택'],['eye','선구'],['spd','주력'],['def','수비']];
  const tv=(x,k)=>{ const z=fdScoutTools(x.p).L.find(q=>q.k===k); return z?z.v:null; };
  const tz=(x,k)=>fdScoutTools(x.p).L.find(q=>q.k===k)||{g:'C',v:50}; const tg=(x,k)=>tz(x,k).g; const GL=FD_GL;
  const wv=x=>sOK(x)&&x.s.lvl===1?x.s.war:-5; /* 같은 등급 안에서는 작년 WAR 순 */
  const yl=(x,yy)=>{ const h1=seasonTotal(x.p,yy,'1군'); return h1&&(isP?h1.outs>=9:h1.pa>=10)?h1:null; };
  const T3=x=>x._t3!==undefined?x._t3:(x._t3=fdThree(x.p,ly));
  const D=x=>x._d!==undefined?x._d:(x._d=fdDetail(x.p,ly));
  const c=(k,h,sv,td,tip)=>({k,h,sv,td,tip});
  const n1=v=>v==null||Number.isNaN(v)?'-':v.toFixed(1), n2=v=>v==null||Number.isNaN(v)?'-':v.toFixed(2), f3=v=>v==null||Number.isNaN(v)?'-':fmt3(v), pc=v=>v==null?'-':Math.round(v)+'%';
  const td=(v,cls)=>`<td class="${cls||''}">${v}</td>`;
  const sOK=x=>x.s&&(isP?x.s.n>=10:x.s.n>=30);
  let COL, CR, CS, CD;
  { /* 성적: 2025 세부 + 2024·2023 핵심 + 3년 합계 */
    CR=isP?[
      c('war','WAR',x=>sOK(x)&&x.s.lvl===1?x.s.war:-99,x=>td(sOK(x)&&x.s.lvl===1?x.s.war.toFixed(1):'-',sOK(x)&&x.s.lvl===1&&x.s.war>=3?'hi':''),`${ly} 1군 WAR`),
      c('era','ERA',x=>sOK(x)?-x.s.era:-99,x=>td(sOK(x)?n2(x.s.era):'-')),
      c('ip','이닝',x=>x.s?x.s.n:0,x=>td(x.s?ipStr(Math.round(x.s.n*3)):'-')),
      c('g','경기',x=>x.s?x.s.g:0,x=>td(x.s?`${x.s.g}${x.s.gs?`<i class="sm">(${x.s.gs})</i>`:''}`:'-'),'괄호는 선발 등판'),
      c('whip','WHIP',x=>sOK(x)?-x.s.whip:-99,x=>td(sOK(x)?n2(x.s.whip):'-'),'이닝당 안타+볼넷'),
      c('k9','K/9',x=>sOK(x)?x.s.k9:-99,x=>td(sOK(x)?n1(x.s.k9):'-'),'9이닝당 삼진'),
      c('bb9','BB/9',x=>sOK(x)?-x.s.h.bb*9/x.s.n:-99,x=>td(sOK(x)?n1(x.s.h.bb*9/x.s.n):'-'),'9이닝당 볼넷'),
      c('w','승-패',x=>x.s?(x.s.h.w||0):0,x=>td(x.s?`${x.s.h.w||0}-${x.s.h.l||0}${x.s.h.sv?`<i class="sm"> ${x.s.h.sv}세</i>`:x.s.h.hld?`<i class="sm"> ${x.s.h.hld}홀</i>`:''}`:'-')),
]
    :[
      c('war','WAR',x=>sOK(x)&&x.s.lvl===1?x.s.war:-99,x=>td(sOK(x)&&x.s.lvl===1?x.s.war.toFixed(1):'-',sOK(x)&&x.s.lvl===1&&x.s.war>=3?'hi':''),`${ly} 1군 WAR`),
      c('ops','OPS',x=>sOK(x)?x.s.ops:-99,x=>td(sOK(x)?`<b>${f3(x.s.ops)}</b>`:'-')),
      c('wrc','wRC+',x=>sOK(x)&&x.s.wrc!=null?x.s.wrc:-999,x=>td(sOK(x)&&x.s.wrc!=null?x.s.wrc:'-',sOK(x)&&x.s.wrc>=140?'hi':''),'조정 득점 창출력(리그 평균 100, 퓨처스 기록은 퓨처스 기준)'),
      c('hr','홈런',x=>x.s?x.s.hr:-1,x=>td(x.s?x.s.hr:'-')),
      c('pa','타석',x=>x.s?x.s.n:0,x=>td(x.s?x.s.n:'-')),
      c('avg','타율',x=>sOK(x)?x.s.avg:-99,x=>td(sOK(x)?f3(x.s.avg):'-')),
      c('obp','출루',x=>sOK(x)?x.s.obp:-99,x=>td(sOK(x)?f3(x.s.obp):'-')),
      c('slg','장타',x=>sOK(x)?x.s.slg:-99,x=>td(sOK(x)?f3(x.s.slg):'-')),
      c('sb','도루',x=>x.s?x.s.sb:-1,x=>td(x.s?x.s.sb:'-')),
]; }
  { /* 스카우트: 툴 숫자 · 체격 · 한 줄 의견 */
    CS=[
      ...(isP?[c('velo','구속',x=>fdScoutTools(x.p).velo,x=>td(`${fdScoutTools(x.p).velo}<i class="sm"> ${veloMax(x.p)}</i>`),'직구 평균 · 최고(km)')]:[]),
      ...TO.map(([k,l])=>c('t:'+k,l,x=>GL[tg(x,k)]*100+wv(x),x=>{ const z=tz(x,k); return `<td class="fdg" style="color:${fdGc(z.g)}">${z.g}</td>`; },`스카우트가 눈으로 본 ${l} 등급(S·A·B·C·D·E). 스카우트마다 버릇이 있고, 경기에서 드러나는 실전 감각은 못 봅니다`)),
      ...(isP?[c('pit','구종',x=>arsenal(x.p,tz(x,'stf').raw).length,x=>{ const A=arsenal(x.p,tz(x,'stf').raw); const best=[...A].sort((a,b)=>b[1]-a[1])[0]; return td(`${A.length}개<i class="sm"> ${best?esc(best[0]):''}</i>`,'tl2'); },'구종 수 · 가장 좋은 공')]:[]),
      c('body','체격',x=>fdScoutTools(x.p).ht,x=>{ const S=fdScoutTools(x.p); return td(`${S.ht}<i class="sm">/${S.wt}</i>`); },'키(cm)/몸무게(kg)'),
      c('sop','스카우트 의견',x=>0,x=>`<td class="op">${esc(fdScoutLine(x.p))}</td>`)]; }
  { /* 데이터팀: 실제 세부 데이터(최근 3년 합산 기준, 측정은 지난해) · 한 줄 의견 */
    const dOK=ANA;
    CD=isP?[
      c('dk','삼진%',x=>D(x)?D(x).k:-1,x=>td(D(x)?pc(D(x).k):'-'),'상대 타자 중 삼진 비율(3년)'),
      c('db','볼넷%',x=>D(x)?-D(x).bb:-99,x=>td(D(x)?pc(D(x).bb):'-'),'볼넷 비율(3년)'),
      c('dh','피홈런/9',x=>D(x)?-D(x).hr9:-99,x=>td(D(x)?n2(D(x).hr9):'-'),'9이닝당 피홈런(3년)'),
      c('df','FIP',x=>D(x)?-D(x).fip:-99,x=>td(D(x)?n2(D(x).fip):'-'),'수비·운을 뺀 실점 지표(3년). 낮을수록 좋음'),
      c('dg','ERA−FIP',x=>D(x)&&D(x).gap!=null?D(x).gap:0,x=>{ const g=D(x)&&D(x).gap; return td(g==null?'-':`${g>0?'+':''}${n2(g)}`,g==null?'':g<=-.6?'lk':g>=.6?'ul':''); },`${ly} ERA에서 FIP를 뺀 값. −면 운이 좋았고 +면 불운`),
      ...(dOK?[c('dwh','헛스윙%',x=>trackOf(x.p).whiff,x=>td(pc(trackOf(x.p).whiff)),'트래킹 측정(지난해)'),c('dcsw','CSW%',x=>trackOf(x.p).csw,x=>td(pc(trackOf(x.p).csw)),'루킹+헛스윙 스트라이크 비율'),c('drpm','회전수',x=>trackOf(x.p).rpm,x=>td(trackOf(x.p).rpm),'직구 회전수')]:[]),
      c('dop','데이터팀 의견',x=>0,x=>`<td class="op">${esc(fdDataLine(x.p,ly))}</td>`)]
    :[
      c('dk','삼진%',x=>D(x)?-D(x).k:-99,x=>td(D(x)?pc(D(x).k):'-'),'타석 중 삼진 비율(3년)'),
      c('db','볼넷%',x=>D(x)?D(x).bb:-1,x=>td(D(x)?pc(D(x).bb):'-'),'볼넷 비율(3년)'),
      c('di','순장타',x=>D(x)?D(x).iso:-1,x=>td(D(x)?f3(D(x).iso):'-'),'장타율−타율(3년). 장타 힘'),
      c('dbp','BABIP',x=>D(x)&&D(x).babip!=null?D(x).babip:-1,x=>{ const v=D(x)&&D(x).babip; return td(v==null?'-':f3(v),v==null?'':v>=.345?'lk':v<=.265?'ul':''); },`${ly} 인플레이 타구 안타 비율. .340 이상은 운이 섞였을 수 있음`),
      ...(dOK?[c('dev','타구속도',x=>evOf(x.p),x=>td(evOf(x.p)),'평균 타구속도 km(지난해)'),c('dhh','강한타구%',x=>trackOf(x.p).hh,x=>td(pc(trackOf(x.p).hh)),'150km 이상 타구 비율'),c('dwh','헛스윙%',x=>-trackOf(x.p).whiff,x=>td(pc(trackOf(x.p).whiff)),'스윙 중 헛스윙'),c('dch','볼 스윙%',x=>-trackOf(x.p).chase,x=>td(pc(trackOf(x.p).chase)),'볼에 방망이가 나간 비율'),c('drun','1루 도달',x=>-trackOf(x.p).run,x=>td(n2(trackOf(x.p).run)),'초')]:[]),
      c('dop','데이터팀 의견',x=>0,x=>`<td class="op">${esc(fdDataLine(x.p,ly))}</td>`)]; }
  COL={rec:CR,sc:CS,dt:CD}[V]; const ALLC=[...CR,...CS,...CD]; const so2=ALLC.some(z=>z.k===so&&z.k!=='sop'&&z.k!=='dop')?so:'war';
  /* 능력 필터(스카우트 툴 60 이상) · 빈자리 */
  const AB=new Set(UI.fdAb||[]); const abK=TO.map(t=>t[0]).concat(isP?['velo']:[]);
  L=L.filter(x=>{ for(const k of AB){ if(!abK.includes(k))continue; if(k==='velo'){ if(fdScoutTools(x.p).velo<150)return false; } else if(GL[tg(x,k)]<5)return false; } return true; });
  if(UI.fdNeed){ const {ln}=fdLineupOf(myPicks.filter(p=>!p.isP)); const need=new Set(['C','1B','2B','3B','SS','LF','CF','RF'].filter(k=>!ln[k])); const pN=myPicks.filter(p=>p.isP).length<FD_TGT.P; L=L.filter(x=>x.t||(x.p.isP?pN:(need.has(x.p.pos)||(subsOf(x.p)||[]).some(k=>need.has(k))))); }
  const scol=ALLC.find(z=>z.k===so2); L.sort((a,b)=>((scol.sv(b)??-1e9)-(scol.sv(a)??-1e9))*(dir?-1:1)||a.p.id-b.p.id);
  const more=UI.fdMore||60; const shown=L.slice(0,more);
  const hd=z=>`<th><button data-a="fdS" data-v="${z.k}" class="${so2===z.k?'on':''}"${z.tip?` title="${esc(z.tip)}"`:''}>${z.h}${so2===z.k?(dir?'▲':'▼'):''}</button></th>`; /* 열 설명은 제목 옆 i 대신 목록 위 i 한 곳에 모은다(휴대폰에서 칸을 아끼려고) */
  const trow=x=>{ const p=x.p; const lv=x.s&&x.s.lvl===2; const t=x.t; const me=t&&t.tid===G.user; const r=RK[p.id]||0;
    const lead=t?`<span class="fdtk">${badge(t.tid,18)}</span>`:`<button class="fds${sl.has(p.id)?' on':''}" data-a="star" data-v="${p.id}" aria-label="관심">${sl.has(p.id)?'★':'☆'}</button>`;
    const tail=t?`<span class="fdtk2"><i>${me?'우리':esc(tshort(t.tid))} ${t.rd}-${t.no}</i>${fdChip(p)}</span>`:mine?`<button class="fdgo" data-a="fdPick" data-v="${p.id}">지명</button>`:'';
    return `<tr class="${lv?'f2':''}${!t&&sl.has(p.id)?' st':''}${t?(me?' gone me':' gone'):''}"><th><div class="fdn">${lead}<button class="fdnm" data-a="player" data-v="${p.id}"><b>${esc(p.name)}${!t&&r>=.1?`<em class="rkp ${r>=.6?'r3':r>=.3?'r2':'r1'}" title="다음 우리 차례 전에 다른 구단이 지명할 확률">${Math.round(r*100)}%</em>`:''}</b><i>${p.age}세·${p.isP?(isSPr(p)?'선발':'불펜'):SLK[p.pos]||posLabel(p)}·<span class="${!t&&MM&&p.sal>MM.room-MM.W?'lo':''}">${money(p.sal)}</span>${lv?'·2군':''}${isAway(p)?'·군':''}</i></button>${tail}</div></th>${COL.map(z=>z.td(x)).join('')}</tr>`; };
  const nF=[...AB].filter(k=>abK.includes(k)).length+(young?1:0); const fOpen=!!UI.fdFiltOpen;
  const quick=`<div class="chips fdq"><button data-a="fdFilt" class="${nF?'on':''}">필터 ${nF}${fOpen?' ▴':' ▾'}</button><button data-a="fdNeed" class="${UI.fdNeed?'on':''}">우리 빈자리만</button><button data-a="fdO" class="${onlyS?'on':''}">관심 ${[...sl].filter(id=>G.players[id]&&G.players[id].fdPool).length||''}</button></div>`;
  const abChips=!fOpen?'':`<div class="chips fdab"><span class="small muted">스카우트 평가</span>${abK.map(k=>`<button data-a="fdAb" data-v="${k}" class="${AB.has(k)?'on':''}">${k==='velo'?'구속 150km+':`${({pow:'파워',con:'컨택',eye:'선구',def:'수비',spd:'주력',ctl:'제구',stf:'구위',sta:'체력'})[k]} A 이상`}</button>`).join('')}<button data-a="fdY" class="${young?'on':''}">24세 이하</button></div>`;
  const vtab=`<div class="seg fdvt"><button data-a="fdV" data-v="rec" class="${V==='rec'?'on':''}">성적</button><button data-a="fdV" data-v="sc" class="${V==='sc'?'on':''}">스카우트</button><button data-a="fdV" data-v="dt" class="${V==='dt'?'on':''}">데이터팀</button></div>`;
  const vnote=V==='rec'?`${ly} 시즌 기록(1군, 없으면 2군) · 지난 시즌들은 선수 정보의 '최근 3년'에서`:V==='sc'?'스카우트가 눈과 스피드건으로 본 툴 등급(S·A·B·C·D·E, C가 1군 평균쯤)과 체격. 기록은 보지 않고, 경기에서 드러나는 실전 감각은 못 봅니다. 스카우트마다 후하게 보는 툴과 짜게 보는 툴이 있습니다':ANA?'데이터팀이 실제 기록과 트래킹으로 본 세부 데이터. 툴은 보지 않습니다':'분석원이 없어 기록에서 계산한 지표만 있습니다(트래킹 데이터와 데이터팀 의견 일부 없음)';
  const listPane=`<section class="card">${F.done?'':fdPosBoardH(gk,f)}${F.done?'':fdOwnCard(gk,f)}<div class="fdgk"><b>${isP?'투수':'야수'} ${f==='all'?'전체':({SP:'선발형',RP:'불펜형',OF:'외야'})[f]||SLK[f]||f}</b> <span class="muted">${L.length}명 · 정렬 ${scol.h} ${dir?'▲':'▼'}</span> <button type="button" class="hi-i" data-tip="${esc(`이름 옆 %는 다음 우리 차례 전에 다른 구단이 데려갈 확률입니다. 탭을 바꿔도 같은 선수·같은 순서이고 보이는 정보만 바뀝니다. 열 제목을 누르면 그 기준으로 정렬합니다.\n\n${vnote}${COL.some(z=>z.tip)?`\n\n[열 설명]\n${COL.filter(z=>z.tip).map(z=>`${z.h}: ${z.tip}`).join('\n')}`:''}`)}">i</button></div>
    ${quick}${abChips}${vtab}${V==='sc'&&fdScoutProfileTxt(isP)?`<p class="small fdscp"><b>우리 스카우트 성향</b> ${esc(fdScoutProfileTxt(isP))}</p>`:''}
    <div class="fdt-w"><table class="fdt v-${V}"><thead><tr><th class="c0">선수</th>${COL.map(hd).join('')}</tr></thead><tbody>${shown.map(trow).join('')}</tbody></table></div>
    ${L.length>shown.length?`<button class="btn block" data-a="fdListMore">${Math.min(60,L.length-shown.length)}명 더 보기 (${shown.length}/${L.length})</button>`:''}</section>`;
  const tab=UI.fdTab==='team'?'team':'list';
  const miss=(()=>{ const {ln}=fdLineupOf(myPicks.filter(p=>!p.isP)); return ['C','1B','2B','3B','SS','LF','CF','RF'].filter(k=>!ln[k]).length; })(); const pitN=myPicks.filter(p=>p.isP).length;
  return `${UI.fdMsg?`<div class="note bad">${esc(UI.fdMsg)}</div>`:''}<div class="seg fdseg"><button data-a="fdTab" data-v="list" class="${tab==='list'?'on':''}">후보 선수</button><button data-a="fdTab" data-v="team" class="${tab==='team'?'on':''}">우리 팀 <i class="fdsg">빈자리 ${miss+Math.max(0,FD_TGT.P-pitN)}</i></button></div>
  <div class="fdlay t-${tab}"><div class="fdl-side">${fdBoard(myPicks,ci,pre?null:(UI.fdJust||null))}</div><div class="fdl-main">${listPane}</div></div>${revView()}`; }
/* 창단 드래프트 연봉 계산: 지금까지 쓴 돈, 쓸 수 있는 한도, 남은 지명과 자동 배분까지 감안한 1명당 여유 */
function fdMoney(){ const F=G.fd; if(!F)return null; const key=G.day+':'+G.user; if(!UI._fdf||UI._fdf.k!==key){ try{ UI._fdf={k:key,f:fdFin()}; }catch(e){ return null; } } const f=UI._fdf.f;
  const mine=Object.values(G.players).filter(p=>p.team===G.user&&!p.foreign); const spent=sum(mine.map(p=>p.sal));
  const lim=Math.min(f.cap,Math.max(0,f.avail)); const left=F.picks.slice(F.cur).filter(x=>x.tid===G.user).length;
  const pool=F.pool.map(id=>G.players[id]).filter(p=>p&&p.fdPool).map(p=>p.sal).sort((a,b)=>a-b); const cheap=pool.slice(0,Math.max(1,Math.round(pool.length*.4))); const avgC=cheap.length?sum(cheap)/cheap.length:MIN_SAL;
  const autoN=Math.max(0,52-mine.length-left); const W=Math.round(autoN*avgC); const room=lim-spent; const per=left?Math.max(0,(room-W)/left):0;
  const fr=(f.otherRows||[]).find(x=>/외국인/.test(x[0])); return {spent,lim,room,left,autoN,W,per,capBound:f.avail>=f.cap,fres:fr?fr[1]:0,res:f.res}; }
function fdMoneyLine(){ const M=fdMoney(); if(!M)return ''; const c=M.room-M.W<0?'bad':M.room-M.W<M.lim*.1?'warn':'good';
  const tip=`국내 연봉 ${money(M.spent)}을 썼고 한도는 ${money(M.lim)}입니다(${M.capBound?'리그 상한 기준: 재정 여력이 상한보다 큼':'재정 여력 기준: 상한보다 재정이 먼저 막힘'}). 지명이 끝나면 남은 선수 ${M.autoN}명이 자동 배분되고 약 ${money(M.W)}이 듭니다. 지명당 권장액은 남은 한도에서 이 자동 배분분을 빼고 남은 지명 수로 나눈 값입니다. 외국인 4명 예산 ${money(M.fres)}은 따로 잡아 두었습니다.${M.res?` 감독·코치 빈자리 채용비 ${money(M.res.vac)}과 운영 여유분 ${money(M.res.cush)}도 한도에서 미리 뺐습니다.`:''}`;
  return `<div class="fdm1">한도 <b class="${c}">${money(M.room)}</b> · 남은 <b>${M.left}번</b> · 권장 <b>${M.left?money(M.per):'-'}</b> <button type="button" class="hi-i" data-tip="${esc(tip)}">i</button></div><div class="fdm3 tk0m"><div><span>남은 연봉 한도</span><b class="${c}">${money(M.room)}</b><i>${M.capBound?'리그 상한 기준':'재정 기준'}</i></div><div><span>남은 지명</span><b>${M.left}번</b><i>자동 배분 ${M.autoN}명 별도</i></div><div><span>지명당 권장</span><b>${M.left?money(M.per):'-'}</b><i>계산 근거 <button type="button" class="hi-i" data-tip="${esc(tip)}">i</button></i></div></div>`; }
/* 드래프트 상황판: 화면 위에 고정. 목록을 보면서 다른 구단 지명을 같이 본다 */
function fdTicker(){ const F=G.fd; if(!F||F.done)return ''; const pk=F.picks[F.cur]; const pre=F.open===false; const ask=fdManDone(); const mine=!pre&&!ask&&pk&&pk.tid===G.user;
  if(!pre&&!mine&&!ask&&pk&&!(UI.dl&&UI.dl.kind==='fd')&&!UI.dlAuto&&!UI.rev){ UI.dlAuto=1; setTimeout(()=>{ UI.dlAuto=0; const p2=G.fd&&G.fd.picks[G.fd.cur]; if(G.fd&&!G.fd.done&&G.fd.open!==false&&p2&&p2.tid!==G.user&&!(UI.dl&&UI.dl.kind==='fd')&&!UI.rev)dliveStart('fd'); },700); }
  const L=UI.dl&&UI.dl.kind==='fd'?UI.dl:null; const on=!!(L&&L.on); const top=L&&L.feed&&L.feed[0]; const st=L&&L.stolen&&L.stolen[0]; const fresh=st&&top&&st.pid===top.pid;
  const k=F.picks.slice(F.cur).findIndex(x=>x.tid===G.user); const sp=UI.dspeed||'norm';
  let r1;
  if(pre){ const first=F.picks.findIndex(x=>x.tid===G.user)+1; r1=`<div class="fd-go"><div class="fd-got"><b>아직 드래프트가 시작되지 않았습니다</b><span>지금은 지명 전 탐색 시간입니다. 선수를 살펴보고 관심(☆)을 표시해 두세요. <b>시작을 눌러야 지명할 수 있습니다.</b> 우리 첫 지명은 ${first}번째입니다.</span></div><button class="btn primary fd-gob" data-a="fdOpen">드래프트 시작 (1라운드) ▶</button></div>`; } /* 작은 버튼이라 못 찾고 '왜 지명이 안 되지' 하던 문제: 크게, 설명과 함께 */
  else if(ask){ const left=F.picks.slice(F.cur).filter(x=>x.tid===G.user).length; r1=`<b class="good">${F.man}라운드 직접 지명을 마쳤습니다</b><span class="muted">남은 우리 지명 ${left}번은 주로 2군·백업 자원입니다</span>${fdPolSel()}<button class="btn small primary" data-a="fdAuto" title="고른 방침대로 스카우트가 남은 지명을 모두 뽑고 드래프트를 끝냅니다">나머지 스카우트에게 맡기기</button><button class="btn small" data-a="fdPlus">${Math.min(FD_ROUNDS,F.man+FD_MORE)}라운드까지 더 뽑기</button>`; }
  else if(mine){ r1=`<b class="good">우리 차례 · ${pk.rd}라운드 ${pk.no}번째</b><button class="btn small tk-delb${UI.tkDel?' on':''}" data-a="tkDel">맡기기 ${UI.tkDel?'▴':'▾'}</button><span class="tk-del${UI.tkDel?' open':''}">${fdPolSel()}<button class="btn small" data-a="fdAutoN" data-v="5" title="우리 지명 5번을 고른 방침대로 스카우트가 뽑고 다시 멈춥니다">5번 맡기기</button><button class="btn small" data-a="fdAuto" title="남은 우리 지명을 고른 방침대로 스카우트가 모두 뽑고 드래프트를 끝냅니다">나머지 맡기기</button></span><span class="muted">${F.man||FD_ROUNDS}라운드까지 직접 지명</span>`; }
  else if(!on&&!UI.rev){ r1=`<div class="fd-go"><div class="fd-got"><b>${esc(tshort(pk.tid))} 차례에서 멈춰 있습니다 · ${pk.rd}-${pk.no}</b><span class="fd-left">우리 차례까지 ${k<0?'-':k}번</span></div><button class="btn primary fd-gob" data-a="fdAdv">다른 구단 지명 진행 ▶</button></div>`; } /* 멈춘 상태가 작은 '진행' 버튼뿐이라 못 찾던 문제 */
  else r1=`${on?'<span class="dl-dot"></span>':''}${badge(pk.tid,18)}<b>${esc(tshort(pk.tid))} 지명 중 · ${pk.rd}-${pk.no}</b><span class="muted">우리 차례까지 ${k<0?'-':k}번</span><span class="tk-sp"><button data-a="dlSpdC" class="on">속도 ${({slow:'느리게',norm:'보통',fast:'빠르게'})[sp]}</button>${on?'<button data-a="dlStop">멈춤</button>':'<button data-a="fdAdv">진행</button>'}</span>`;
  const r2=fresh?`<div class="tk2 steal"><b>뺏겼습니다</b><span>${esc(st.tg)} <button class="lnk" data-a="player" data-v="${st.pid}">${esc(st.nm)}</button>을(를) ${esc(tshort(st.tid))}이(가) ${st.rd}-${st.no}에 지명</span>${fdTrue(top)}</div>`
    :top?`<div class="tk2">${badge(top.tid,16)}<i>${top.rd}-${top.no}</i><button class="lnk" data-a="player" data-v="${top.pid}">${esc(top.nm)}</button><span class="muted">${esc(top.pos)}${top.age!=null?` · ${top.age}세`:''}</span>${top.me?'<em class="good">우리 지명</em>':fdTrue(top)}${L.stN?`<span class="tk-l">놓친 관심 ${L.stN}명</span>`:''}</div>`:'';
  const risk=(()=>{ if(pre||ask)return ''; const RK=fdRisk(); const S=(G.shortlist||[]).map(id=>G.players[id]).filter(p=>p&&p.fdPool&&(RK[p.id]||0)>=.35).sort((a,b)=>RK[b.id]-RK[a.id]).slice(0,4); if(!S.length)return ''; return `<div class="tk2 risk"><b>${mine?'지금 안 뽑으면':'우리 차례 전에'} 빠질 수 있는 관심 선수</b>${S.map(p=>`<span class="rk-i"><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><em>${Math.round(RK[p.id]*100)}%</em></span>`).join('')}</div>`; })();
  const minB=`<button class="tk-minb" data-a="tkMin" aria-label="${UI.tkMin?'상황판 펼치기':'상황판 접기'}">${UI.tkMin?'펼치기 ▾':'접기 ▴'}</button>`; /* 휴대폰: 위에 고정된 상황판을 한 줄로 접어 선수 목록을 넓게 */
  return `<div class="tk${UI.tkMin?' min':''}"><div class="tk1">${r1}${minB}</div>${fdMoneyLine()}${risk}${r2}${fdPickLog()}</div>`; }
/* 지명 기록: 지금까지 나온 지명을 펼쳐 본다(최근 순, 구단별로 거르기) */
function fdPickLog(){ const F=G.fd; if(!F)return ''; const done=F.picks.slice(0,F.cur).filter(x=>x.pid&&G.players[x.pid]); if(!done.length)return '';
  const open=!!UI.fdLog; const ft=UI.fdLogT??'all'; const btn=`<button class="lnk tk-log" data-a="fdLog">지명 기록 ${open?'접기':'펼치기'} (${done.length}명)</button>`; if(!open)return btn;
  const L=done.filter(x=>ft==='all'||(ft==='other'?x.tid!==G.user:x.tid===+ft)).slice().reverse();
  const tsel=`<select class="fdlogt" data-a="fdLogT" aria-label="구단"><option value="all" ${ft==='all'?'selected':''}>모든 구단</option><option value="other" ${ft==='other'?'selected':''}>다른 구단만</option>${G.teams.map(t=>`<option value="${t.id}" ${String(ft)===String(t.id)?'selected':''}>${esc(tshort(t.id))}${t.id===G.user?' (우리)':''}</option>`).join('')}</select>`;
  const row=x=>{ const p=G.players[x.pid]; const me=x.tid===G.user; return `<div class="fdlg${me?' me':''}">${badge(x.tid,16)}<i>${x.rd}-${x.no}</i><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><span class="muted">${esc(posLabel(p))} · ${p.age}세 · ${money(p.sal)}</span>${me?`<em class="good">우리</em>${fdChip(p)}`:fdTrue({pid:p.id})}</div>`; };
  return `${btn}<div class="fdlog"><div class="row between">${tsel}<span class="small muted">${L.length}명 · 최근 순</span></div><div class="fdlog-l">${L.map(row).join('')||'<p class="small muted">없습니다.</p>'}</div></div>`; }
function fdPolSel(){ const v=G.fdPol||'need'; return `<select class="fdpol" data-a="fdPol" aria-label="맡길 때 방침" title="스카우트에게 맡길 때 무엇을 먼저 볼지">${Object.entries(FD_POL).map(([k,l])=>`<option value="${k}" ${v===k?'selected':''}>맡길 방침: ${l}</option>`).join('')}</select>`; }
function teamIdCard(){ const tid=G.user; if(G.unemp)return ''; const cap=captainOf(tid); const st=domestic(tid).filter(p=>p.fr&&p.fr.tid===tid).sort((a,b)=>ovr(b)-ovr(a)); const C=(G.chron||[]).filter(x=>x.tid===tid); const last=C.filter(x=>x.k!=='season').slice(-3).reverse();
  const champs=(G.history||[]).filter(h=>h.y>=2026&&h.champ===tid).length; const yrs=G.gmSince!=null?G.year-G.gmSince+1:1;
  return `<section class="card"><div class="row between"><h2 class="sec">우리 팀</h2><button class="btn small" data-a="go" data-v="club:chron">연대기</button></div>
    <p class="small">재임 ${yrs}년째${champs?` · 우승 ${champs}회`:''} · 주장 ${cap?`<button class="lnk" data-a="player" data-v="${cap.id}">${esc(cap.name)}</button>`:'없음'}</p>
    <p class="small">프랜차이즈 스타 ${st.length?st.map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button>`).join(', '):'아직 없음 · 한 팀에서 5시즌, 통산 WAR 12면 탄생'}</p>
    ${last.length?`<div class="eyebrow">최근 구단사</div>${last.map(x=>`<p class="small">${x.y} · ${esc(x.t)}</p>`).join('')}`:''}</section>`; }
/* 체험판 종료 화면: 한 시즌 기록과 다음 버전 안내 */
const FEEDBACK_URL='';
function demoEndView(){ const y=G.year; const H=(G.history||[]).find(h=>h.y===y); const u=H&&H.user; const gs=goalStatus(); const L=G.last&&G.last.y===y?G.last:null;
  const ps=L&&L.ps; const psr=ps?(ps.champ===G.user?'한국시리즈 우승':ps.runner===G.user?'한국시리즈 준우승':ps.poLose===G.user?'플레이오프 탈락':ps.spoLose===G.user?'준플레이오프 탈락':ps.wcLose===G.user?'와일드카드 탈락':'가을야구 탈락'):'';
  const best=playersOf(G.user).map(p=>({p,h:seasonTotal(p,y,'1군')})).filter(x=>x.h).map(x=>({...x,w:wOf(x.h,x.p)})).sort((a,b)=>b.w-a.w).slice(0,3);
  const tr=(G.trades||[]).filter(t=>t.y===y).length; const fdp=G.fd?G.fd.picks.filter(x=>x.tid===G.user&&x.pid).length:0;
  const row=(l,v)=>`<div class="row between"><span class="muted">${l}</span><b>${v}</b></div>`;
  return `<section class="card hero demo-end"><div class="eyebrow">무료 체험판 · 버전 ${GAME_VER}</div><h2 class="sec" style="font-size:24px">${y}시즌을 마쳤습니다</h2>
    <p>${esc(tname(G.user))} 창단 첫 시즌 기록입니다. 체험판은 여기까지입니다.</p>
    ${u?row('정규시즌',`${u.rank}위 · ${u.w}승 ${u.l}패${u.t?` ${u.t}무`:''}`):''}${psr?row('포스트시즌',psr):''}
    ${gs?row('구단주 목표',`${gs.rank.t}위 이내 ${gs.rank.ok?'<span class="good">달성</span>':'<span class="bad">미달</span>'}`):''}
    ${row('창단 드래프트 지명',`${fdp}명`)}${row('트레이드',`${tr}건`)}
    ${best.length?`<div class="eyebrow" style="margin-top:8px">올해의 우리 선수</div>${best.map(x=>`<p class="small"><button class="lnk" data-a="player" data-v="${x.p.id}">${esc(x.p.name)}</button> · ${statLine(x.h,x.p)}</p>`).join('')}`:''}
    <p class="small" style="margin-top:8px">정식판에서는 스토브리그(FA·연봉 협상·외국인 재계약), 신인 드래프트, 2년차 이후 팀 성장이 이어집니다. 저장은 그대로 남아 있습니다.</p>
    <div class="row" style="gap:6px;margin-top:6px">${FEEDBACK_URL?`<a class="btn primary" href="${FEEDBACK_URL}" target="_blank" rel="noopener">피드백 남기기</a>`:''}<button class="btn" data-a="toTitle">처음 화면</button></div></section>`; }
function homeView(){
  if(G.demoEnd)return demoEndView()+[miniStand(),newsCard()].filter(Boolean).join('');
  if(G.gameOver)return gameOverView();
  if(G.fdWait)return fdWaitView();
  if(G.fd&&!G.fd.done)return fdView();
  if(G.unemp)return unempView()+[miniStand(),newsCard()].filter(Boolean).join('');
  faCelebrate(); const dO=UI.open.homeDesk??false;
  const desk=G.gameOver?'':`<details class="moreg" data-k="homeDesk" data-lazy="${dO?0:1}" ${dO?'open':''}><summary><span>전력 요약</span><i>자리별 전력 순위 · 추천 트레이드 · 사람들과의 관계</i></summary><div class="moreb">${dO?[deskCard(),relStrip()].filter(Boolean).join(''):''}</div></details>`;
  const today=[champHomeCard(),cerHomeCard(),resultHome(),liveCard(),digestCard(),fdBudgetCard(),gapCard(),autoCard(),rebuildCard(),todoCard(),offPrepCard(),decisionCard(),tutCard(),reqHomeCard(),mgrChatCard(true),faHomeCard(),campCard(),nextCard(),upcomingGames(10),desk].filter(Boolean).join('');
  const league=[miniStand(),mvHomeCard(),formCard(),newsCard()].filter(Boolean).join('');
  const moreBody=[myLeaders(),clubCard(),calendarCard()].filter(Boolean).join('');
  const o=UI.open.homeMore??false;
  const more=moreBody?`<details class="moreg" data-k="homeMore" ${o?'open':''}><summary><span>더 보기</span><i>우리 팀 주요 선수 · 구단 상태 · 일정</i></summary><div class="moreb">${moreBody}</div></details>`:'';
  const gh=t=>`<h2 class="grp-t">${t}</h2>`;
  if(wide())return `${stripBar()}${dashTiles()}${stBand()}<div class="homeg"><div class="col">${gh('오늘')}${today}</div><div class="col">${gh('리그 현황')}${league}${more}</div></div>`;
  const todo=[cerHomeCard(),fdBudgetCard(),gapCard(),autoCard(),rebuildCard(),todoCard(),offPrepCard(),decisionCard(),tutCard(),reqHomeCard(),mgrChatCard(true),faHomeCard(),campCard()].filter(Boolean).join('');
  const games=[resultHome(),liveCard(),digestCard(),nextCard(),upcomingGames(10)].filter(Boolean).join('');
  if(G.res&&UI._hres!==G.res.i+':'+G.day){ UI._hres=G.res.i+':'+G.day; UI.it=UI.it||{}; UI.it.home='game'; } /* 경기가 막 끝나면 경기 탭을 먼저 */
  const ht=inTabs('home',[['today','할 일'],...(games?[['game','경기']]:[]),['league','리그'],['team','우리 팀']]);
  const prep=G.fd&&G.fd.done&&G.gmSince===G.year&&G.cal&&G.day<G.cal.open?fdSteps(3):''; /* 창단 첫해 개막 전: 진행 표시 3단계 */
  return `${prep}${stripBar()}${champHomeCard()}${ht.cur==='today'?stBand()+dashTiles():''}${ht.bar}${ht.cur==='today'?todo:ht.cur==='game'?games:ht.cur==='league'?[miniStand(),mvHomeCard(),newsCard()].filter(Boolean).join(''):[desk,teamIdCard(),formCard(),myLeaders(),clubCard()].filter(Boolean).join('')}`;
}


/* 스카우트 칸: 구속(투수) · 툴 · 체격. 눈으로 보기 어려운 툴은 흐리게 */
const FD_TS={pow:'파워',spd:'발',def:'수비',con:'컨택',eye:'선구',stf:'구위',sta:'체력',ctl:'제구'};
function fdScoutCell(p){ const S=fdScoutTools(p); return `<td class="fdsc" title="${esc(fdScoutLine(p))}">${p.isP?`<b class="velo">${S.velo}<i>km</i></b>`:''}${S.L.map(t=>`<span class="fdtg${t.vis?'':' fz'}" style="--c:${fdGc(t.g)}" title="${t.vis?'':'눈으로 판단하기 어려워 오차가 큽니다'}">${FD_TS[t.k]} <b>${fdToolNum(t.v)}</b>${t.vis?'':'?'}</span>`).join('')}<span class="bd">${S.ht}·${S.wt}</span></td>`; }
/* 데이터팀 칸: 항목별 순위 말(상~하)과 운 · 표본 */
const FD_DS={'삼진 적음':'컨택','볼넷':'선구','장타력':'장타','생산력':'생산','탈삼진':'탈삼진','볼넷 억제':'제구','피홈런 억제':'피홈런','실점 억제(FIP)':'실점억제'};
function fdDataCell(p){ const d=fdData(p); if(!d)return '<td class="muted fddt">기록 부족</td>'; return `<td class="fddt">${d.it.map(([l,v])=>`<span class="dt-i" title="${l} 상위 ${100-v}%"><i>${FD_DS[l]}</i><b style="color:${pctC(v)}">${pctW(v)}</b></span>`).join('')}${d.lv===2?'<em class="tg">2군 기록</em>':''}${d.small?'<em class="tg w">표본 적음</em>':''}${d.luck?`<em class="tg ${d.luck[0].includes('불운')?'u':'l'}" title="${esc(d.luck[1])}">${d.luck[0]}</em>`:''}</td>`; }
function fdSortSel(gk,so,ana){ const o=[['war','WAR(지난해)'],['risk','뺏길 확률'],['sal','연봉 낮은 순'],...(gk==='P'?[['t:velo','스카우트: 구속'],['t:stf','스카우트: 구위'],['t:sta','스카우트: 체력'],['t:ctl','스카우트: 제구(추정)']]:[['t:pow','스카우트: 파워'],['t:spd','스카우트: 발'],['t:def','스카우트: 수비'],['t:con','스카우트: 컨택(추정)']]),...(ana?(gk==='P'?[['d:3','데이터: 실점 억제'],['d:0','데이터: 탈삼진'],['d:1','데이터: 제구']]:[['d:3','데이터: 생산력'],['d:2','데이터: 장타'],['d:1','데이터: 선구'],['d:0','데이터: 컨택']]):[])];
  return `<select class="fdsort" data-a="fdSsel" aria-label="정렬">${o.map(([k,l])=>`<option value="${k}" ${so===k?'selected':''}>정렬: ${l}</option>`).join('')}</select>`; }
/* 포지션 현황판: 남은 후보 · 툴 좋은 선수 · 기록 좋은 선수 · 다음 우리 차례 전 빠질 예상. 누르면 그 포지션만 */
/* 포지션 칩 줄: 짧게 한두 줄. 우리 선수가 있으면 이름을 초록으로, 비었으면 '빈자리', 곧 바닥나면 '급함' */
function fdPosBoardH(gk,f){ const B=fdPosBoard(); const nm={SP:'선발',RP:'불펜'}; const F=G.fd;
  const my=F.picks.filter(x=>x.tid===G.user&&x.pid).map(x=>G.players[x.pid]).filter(Boolean); const {ln}=fdLineupOf(my.filter(p=>!p.isP)); const sp=my.filter(p=>p.isP&&isSPr(p)).length, rp=my.filter(p=>p.isP&&!isSPr(p)).length;
  const cur=(gk==='P'?'P:':'B:')+f;
  const chip=x=>{ const g=['SP','RP'].includes(x.k)?'P':'B'; const v=g+':'+x.k; const own=g==='P'?(x.k==='SP'?`${sp}/6`:`${rp}/7`):ln[x.k]?esc(ln[x.k].name):'';
    const filled=g==='P'?(x.k==='SP'?sp>=6:rp>=7):!!ln[x.k];
    return `<button class="fpc${cur===v?' on':''}${filled?' ok':' need'}" data-a="fdPos" data-v="${cur===v?g+':all':v}" title="남은 후보 ${x.n}명 · 다음 우리 차례 전에 약 ${x.exp.toFixed(1)}명 빠질 예상"><b>${nm[x.k]||SLK[x.k]}</b>${own?`<span class="own">${own}</span>`:'<span class="emp">빈자리</span>'}${x.exp>=1.5?'<em>급함</em>':''}</button>`; };
  const all=(g,l)=>`<button class="fpc all${cur===g+':all'?' on':''}" data-a="fdPos" data-v="${g}:all"><b>${l} 전체</b></button>`;
  /* 야수/투수를 먼저 고르고, 그 그룹의 포지션만 칩으로 보인다(모바일에서 칩이 화면 밖으로 밀리지 않게) */
  const isP=gk==='P'; const seg=`<div class="seg fpseg"><button data-a="fdPos" data-v="B:all" class="${isP?'':'on'}">야수</button><button data-a="fdPos" data-v="P:all" class="${isP?'on':''}">투수 <i class="fdsg">선발 ${sp}/6 · 불펜 ${rp}/7</i></button></div>`;
  return `${seg}<div class="fpcs">${isP?all('P','투수')+B.filter(x=>['SP','RP'].includes(x.k)).map(chip).join(''):all('B','야수')+B.filter(x=>!['SP','RP'].includes(x.k)).map(chip).join('')}</div>`; }
/* 고른 포지션에 우리 선수가 이미 있으면 위에 크게 보여 준다 */
function fdOwnCard(gk,f){ if(gk==='P'||f==='all'||f==='OF'||f==='DH')return ''; const F=G.fd; const my=F.picks.filter(x=>x.tid===G.user&&x.pid).map(x=>G.players[x.pid]).filter(Boolean); const {ln}=fdLineupOf(my.filter(p=>!p.isP)); const p=ln[f]; if(!p)return '';
  const L=fdStatLine(p,F.y-1); return `<div class="fdown"><span class="eyebrow">우리 ${SLK[f]}</span><button class="fdown-c" data-a="player" data-v="${p.id}">${avImg(p)}<span><b>${esc(p.name)}</b><i>${p.age}세 · ${money(p.sal)}${L?` · ${F.y-1} ${L.lvl===1?'':'2군 '}OPS ${fmt3(L.ops)} · WAR ${(L.war||0).toFixed(1)}`:''}</i></span>${fdChip(p)}</button><span class="small muted">이미 채운 자리입니다. 아래는 백업·경쟁 후보입니다.</span></div>`; }

/* 지명된 선수: 우리 스카우트 추정 → 실제 현재 능력(지명되면 공개) */
function fdTrue(x){ const p=x&&G.players[x.pid]; if(!p)return x&&x.o!=null?fdEstChip(x.o):''; const e=x.o!=null?x.o:fdEstOf(p); return `<span class="fdtrue">${e!=null?`<span class="fdt-l">추정</span>${fdEstChip(e)}<span class="fdt-l">→ 실제</span>`:''}${fdChip(p)}</span>`; }
