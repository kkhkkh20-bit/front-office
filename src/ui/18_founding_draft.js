/* 지명 공개 카드가 열리기 전에는 방금 뽑은 선수의 능력을 다른 곳에서도 감춘다 */
function fdChip(p){ return UI.rev&&!UI.rev.open&&UI.rev.pid===p.id?rchip(null):rchip(Math.round(ovr(p))); }
/* ---------- 창단 드래프트: 우리 팀 빈자리 보드 ---------- */
const FDPOS={C:[50,90],'1B':[85,62],'2B':[68,36],SS:[32,36],'3B':[15,62],LF:[14,14],CF:[50,10],RF:[86,14]};
function fdLineupOf(list){ const used=new Set(), ln={}; for(const k of ['C','SS','2B','CF','3B','RF','LF','1B']){ const ok=list.filter(p=>!used.has(p.id)&&(p.pos===k||(subsOf(p)||[]).includes(k))).sort((a,b)=>posScore(b,k)-posScore(a,k)); if(ok[0]){ ln[k]=ok[0]; used.add(ok[0].id); } }
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
  return `<section class="card hero"><div class="eyebrow">${tname(G.user)} 창단</div><div class="row" style="flex-wrap:nowrap;gap:12px">${badge(G.user,48)}<div><h2 class="sec">${esc(B.own.name)} 회장이 반깁니다</h2><p class="small">"${esc(OWNVOICE[t.owner])}"</p></div></div></section>
  <section class="card"><h2 class="sec">올해 재정 전망</h2>
    <details class="frule"><summary class="small">항목별 수입·지출 보기</summary>
    ${f.inc.map(x=>row(x[0],money(x[1]))).join('')}${row('<b>예상 수입 합계</b>',money(f.I))}
    <div style="height:6px"></div>${f.otherRows.map(x=>row(x[0],'-'+money(x[1]),'bad')).join('')}${row('<b>선수 연봉 외 지출</b>','-'+money(f.other),'bad')}
    <div style="height:6px"></div>${row(t.indie?'모기업 지원':'모기업 지원 한도',t.indie?'없음':money(f.sup))}${row('보유 현금',money(f.cash))}</details>
    <div class="note ${ok?'':mid?'warn':'bad'}" style="margin-top:8px">국내 선수 예산 여유 <b>${money(Math.max(0,f.avail))}</b> · 샐러리캡 ${money(f.cap)}. ${ok?'캡까지 채워도 버틸 수 있습니다.':mid?'캡을 꽉 채우면 적자입니다. 여력 안쪽으로 뽑는 게 안전합니다.':'비싼 선수를 여럿 뽑으면 적자가 납니다. 연봉 대비 기록이 좋은 선수를 찾아야 합니다.'} 모기업 지원을 한도까지 받는다고 가정한 값입니다. 드래프트가 끝나면 구단주가 올해 지원 목표를 정하고, 그 기준으로 예산 여유가 화면 위 예산 여유로 표시됩니다.</div></section>
  <section class="card"><h2 class="sec">다음 단계: 창단 드래프트</h2><p class="small">리그 국내 선수 전원을 10개 구단이 ${FD_ROUNDS}라운드에 걸쳐 나눕니다. 단장은 주전급을 뽑는 앞 ${FD_MAN}라운드를 직접 지명합니다. 그다음 나머지를 스카우트에게 맡길지, ${FD_MORE}라운드 더 뽑을지 고릅니다. 시작하면 먼저 후보를 둘러볼 시간이 있고, 준비되면 1라운드를 엽니다.</p>
    <button class="btn primary block" data-a="fdBegin">창단 드래프트 열기</button></section>`; }
/* ---------- 창단 드래프트 화면 ---------- */
function fdView(){ const F=G.fd; const pk=F.picks[F.cur]; const pre=F.open===false; const mine=!pre&&pk&&pk.tid===G.user;
  const myPicks=F.picks.filter(x=>x.tid===G.user&&x.pid).map(x=>G.players[x.pid]).filter(Boolean);
  const ci=capInfo(G.user); const sl=new Set(G.shortlist||[]);
  const TK=new Map(F.picks.filter(x=>x.pid).map(x=>[x.pid,x]));
  const gk=UI.fdG||'B', f=UI.fdF||'all', so=UI.fdS||'avg', dir=UI.fdD||0, young=!!UI.fdY, onlyS=!!UI.fdO, hide=UI.fdHide==null?true:!!UI.fdHide; const X=fdCtx(G.user); const ly=(F.y||G.year)-1;
  const posOk=p=>gk==='P'?p.isP&&(f==='SP'?isSPr(p):f==='RP'?!isSPr(p):true):!p.isP&&(f==='all'||p.pos===f||(f==='OF'&&['LF','CF','RF'].includes(p.pos)));
  /* 지명된 선수도 목록에서 빠지지 않고 제자리에 회색으로 남는다 */
  const ALL=(F.all||Object.keys(F.est||{}).map(Number)).map(id=>G.players[id]).filter(p=>p&&(p.fdPool||TK.has(p.id)));
  const left=ALL.filter(p=>p.fdPool);
  let L=ALL.filter(p=>posOk(p)&&(!young||p.age<=24)&&(!onlyS||sl.has(p.id))&&(!hide||p.fdPool)).map(p=>({p,t:TK.get(p.id)||null,s:fdStatLine(p,ly),v:fdScore(G.user,p,true,X)}));
  const cntB=left.filter(p=>!p.isP).length, cntP=left.length-cntB;
  /* 표: [스카우트가 본 능력] → [작년 성적] → [데이터팀 3년 요약] → 뺏길 확률 · 연봉 · 계약. 같은 지표를 두 번 보여 주지 않는다 */
  const RK=pre||F.done?{}:fdRisk(); const ANA=dataLv(G.user)>=1; const MM=fdMoney();
  const TO=gk==='P'?[['ctl','제구'],['stf','구위'],['sta','체력']]:[['pow','파워'],['con','컨택'],['def','수비'],['spd','주력']];
  const tv=(x,k)=>{ const S=fdScoutTools(x.p); const z=S.L.find(q=>q.k===k); return z?z:{v:null,vis:true}; };
  const avg=x=>{ const v=TO.map(([k])=>tv(x,k).v); return v.reduce((a,b)=>a+b,0)/v.length; };
  const num=(v,f)=>v==null||Number.isNaN(v)?'-':f(v);
  const sOK=x=>x.s&&(gk==='P'?x.s.n>=10:x.s.n>=30);
  const COL=[
    {k:'avg',g:'sc',h:'능력 평균',sub:`${TO.map(t=>t[1]).join('·')}`,sv:x=>avg(x),td:x=>`<td class="fda" style="--c:${rcol(avg(x))}"><b>${dv(avg(x))}</b></td>`},
    ...TO.map(([k,l])=>({k:'t:'+k,g:'sc',h:l,sub:k==='con'||k==='ctl'?'눈으로 보기 어려움':'',sv:x=>tv(x,k).v,td:x=>{ const z=tv(x,k); return `<td class="fdtv${z.vis?'':' fz'}" style="--c:${rcol(z.v)}">${dv(z.v)}${z.vis?'':'<i>?</i>'}</td>`; }})),
    ...(gk==='P'?[{k:'t:velo',g:'sc',h:'구속',sub:'km',sv:x=>fdScoutTools(x.p).velo,td:x=>`<td>${fdScoutTools(x.p).velo}</td>`}]:[]),
    {k:'war',g:'ly',h:'WAR',sv:x=>sOK(x)&&x.s.lvl===1?x.s.war:-99,td:x=>`<td class="${sOK(x)&&x.s.lvl===1&&x.s.war>=3?'hi':''}">${sOK(x)&&x.s.lvl===1?x.s.war.toFixed(1):'-'}</td>`},
    ...(gk==='P'?[
      {k:'era',g:'ly',h:'ERA',sv:x=>sOK(x)?-x.s.era:-99,td:x=>`<td>${sOK(x)?x.s.era.toFixed(2):'-'}</td>`},
      {k:'ip',g:'ly',h:'이닝',sv:x=>x.s?x.s.n:0,td:x=>`<td>${x.s?ipStr(Math.round(x.s.n*3)):'-'}</td>`},
      {k:'k9',g:'ly',h:'삼진/9',sv:x=>sOK(x)?x.s.k9:-99,td:x=>`<td>${sOK(x)?x.s.k9.toFixed(1):'-'}</td>`},
      {k:'bb9',g:'ly',h:'볼넷/9',sv:x=>sOK(x)?-x.s.h.bb*9/x.s.n:-99,td:x=>`<td>${sOK(x)?(x.s.h.bb*9/x.s.n).toFixed(1):'-'}</td>`}]
    :[
      {k:'ops',g:'ly',h:'OPS',sv:x=>sOK(x)?x.s.ops:-99,td:x=>`<td>${sOK(x)?fmt3(x.s.ops):'-'}</td>`},
      {k:'avg2',g:'ly',h:'타율',sv:x=>sOK(x)?x.s.avg:-99,td:x=>`<td>${sOK(x)?fmt3(x.s.avg):'-'}</td>`},
      {k:'hr',g:'ly',h:'홈런',sv:x=>x.s?x.s.hr:-1,td:x=>`<td>${x.s?x.s.hr:'-'}</td>`},
      {k:'pa',g:'ly',h:'타석',sv:x=>x.s?x.s.n:0,td:x=>`<td>${x.s?x.s.n:'-'}</td>`}]),
    ...(ANA?[
      {k:'d',g:'dt',h:gk==='P'?'실점 억제':'생산력',sub:'최근 3년',sv:x=>{ const d=fdData(x.p); return d?d.it[3][1]-(d.small?20:0):-1; },td:x=>{ const d=fdData(x.p); if(!d)return '<td class="muted">기록 부족</td>'; const v=d.it[3][1]; return `<td class="fdx-d" title="최근 ${d.ys}시즌 · 다른 후보 중 상위 ${100-v}%"><b style="color:${pctC(v)}">${pctW(v)}</b>${d.small?'<em class="tg w">표본 적음</em>':''}${d.lv===2?'<em class="tg">2군</em>':''}</td>`; }},
      {k:'luck',g:'dt',h:'지난해 운',sv:x=>{ const d=fdData(x.p); return d&&d.luck?(d.luck[0].includes('불운')?1:-1):0; },td:x=>{ const d=fdData(x.p); return d&&d.luck?`<td title="${esc(d.luck[1])}"><em class="tg ${d.luck[0].includes('불운')?'u':'l'}">${d.luck[0].includes('불운')?'불운':'행운'}</em></td>`:'<td class="muted">-</td>'; }}]:[]),
    {k:'risk',g:'etc',h:'뺏길 확률',sub:'다음 우리 차례 전',sv:x=>RK[x.p.id]||0,td:x=>{ const r=RK[x.p.id]||0; return `<td class="${r>=.6?'rk3':r>=.3?'rk2':r>=.1?'rk1':'muted'}">${r>=.05?Math.round(r*100)+'%':'-'}</td>`; }},
    {k:'sal',g:'etc',h:'연봉',sv:x=>-x.p.sal,td:x=>`<td class="${MM&&x.p.sal>MM.room-MM.W?'lo':''}">${money(x.p.sal)}</td>`},
    {k:'ct',g:'etc',h:'계약',sv:x=>0,td:x=>`<td class="small">${esc(tContract(x.p))}</td>`}];
  const so2=COL.some(c=>c.k===so)?so:'avg';
  /* 능력 필터: 스카우트가 본 능력 60(백점 환산 67) 이상만 */
  const AB=new Set(UI.fdAb||[]); const abK=TO.map(t=>t[0]).concat(gk==='P'?['velo']:[]);
  L=L.filter(x=>{ for(const k of AB){ if(!abK.includes(k))continue; if(k==='velo'){ if(fdScoutTools(x.p).velo<148)return false; } else if((tv(x,k).v||0)<60)return false; } return true; });
  if(UI.fdNeed){ const {ln}=fdLineupOf(myPicks.filter(p=>!p.isP)); const need=new Set(['C','1B','2B','3B','SS','LF','CF','RF'].filter(k=>!ln[k])); const pN=myPicks.filter(p=>p.isP).length<FD_TGT.P; L=L.filter(x=>x.t||(x.p.isP?pN:(need.has(x.p.pos)||(subsOf(x.p)||[]).some(k=>need.has(k))))); }
  const sc=COL.find(c=>c.k===so2); L.sort((a,b)=>((sc.sv(b)??-1e9)-(sc.sv(a)??-1e9))*(dir?-1:1)||a.p.id-b.p.id);
  const more=UI.fdMore||60; const shown=L.slice(0,more);
  const GN={sc:'스카우트가 본 능력',ly:`${ly} 성적`,dt:'데이터팀',etc:''};
  const grpRow=(()=>{ const out=[]; let cur=null,n=0; for(const c of COL){ if(c.g!==cur){ if(cur)out.push([cur,n]); cur=c.g; n=0; } n++; } out.push([cur,n]); return `<tr class="fdgrp"><th class="c0"></th>${out.map(([g,n])=>`<th colspan="${n}" class="g-${g}">${GN[g]}</th>`).join('')}</tr>`; })();
  const hd=c=>`<th class="g-${c.g}"><button data-a="fdS" data-v="${c.k}" class="${so2===c.k?'on':''}">${c.h}${so2===c.k?(dir?'▲':'▼'):''}${c.sub?`<i class="vmx">${c.sub}</i>`:''}</button></th>`;
  const trow=x=>{ const p=x.p; const lv=x.s&&x.s.lvl===2; const t=x.t; const me=t&&t.tid===G.user;
    const lead=t?`<span class="fdtk">${badge(t.tid,18)}</span>`:`<button class="fds${sl.has(p.id)?' on':''}" data-a="star" data-v="${p.id}" aria-label="관심">${sl.has(p.id)?'★':'☆'}</button>`;
    const tail=t?`<span class="fdtk2"><i>${me?'우리':esc(tshort(t.tid))} ${t.rd}-${t.no}</i>${fdChip(p)}</span>`:mine?`<button class="fdgo" data-a="fdPick" data-v="${p.id}">지명</button>`:'';
    return `<tr class="${lv?'f2':''}${!t&&sl.has(p.id)?' st':''}${t?(me?' gone me':' gone'):''}"><th><div class="fdn">${lead}<button class="fdnm" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b><i>${p.age}세 · ${p.isP?(isSPr(p)?'선발형':'불펜형'):SLK[p.pos]||posLabel(p)}${lv?' · 2군 기록':''}${isAway(p)?' · 군':''}</i></button>${tail}</div></th>${COL.map(c=>c.td(x)).join('')}</tr>`; };
  const abChips=`<div class="chips fdab"><span class="small muted">능력 필터</span>${abK.map(k=>`<button data-a="fdAb" data-v="${k}" class="${AB.has(k)?'on':''}">${k==='velo'?'구속 148km+':`${({pow:'파워',con:'컨택',def:'수비',spd:'주력',ctl:'제구',stf:'구위',sta:'체력'})[k]} 좋음`}</button>`).join('')}<button data-a="fdY" class="${young?'on':''}">24세 이하</button><button data-a="fdNeed" class="${UI.fdNeed?'on':''}">우리 빈자리만</button><button data-a="fdO" class="${onlyS?'on':''}">관심 ${[...sl].filter(id=>G.players[id]&&G.players[id].fdPool).length||''}</button></div>`;
  const listPane=`<section class="card">${F.done?'':fdPosBoardH(gk,f)}<div class="fdgk"><b>${gk==='P'?'투수':'야수'} ${f==='all'?'전체':({SP:'선발형',RP:'불펜형',OF:'외야'})[f]||SLK[f]||f}</b> <span class="muted">${L.length}명</span></div>
    ${abChips}
    <p class="small muted keep">맨 앞은 <b>스카우트가 눈과 스피드건으로 본 능력</b>(60이 1군 평균쯤, ${gk==='P'?'제구':'컨택'}은 눈으로 보기 어려워 오차가 큼)입니다. 그다음 <b>${ly} 성적</b>${ANA?', 그리고 <b>데이터팀</b>이 최근 3년 기록으로 본 '+(gk==='P'?'실점 억제':'타격 생산')+' 순위와 지난해 운':''}입니다. 열 제목을 누르면 그 기준으로 정렬됩니다.</p>
    <div class="fdt-w"><table class="fdt"><thead>${grpRow}<tr><th class="c0">선수</th>${COL.map(hd).join('')}</tr></thead><tbody>${shown.map(trow).join('')}</tbody></table></div>
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
  return `<div class="tk0"><span>국내 연봉 <b>${money(M.spent)}</b> / 한도 <b>${money(M.lim)}</b><i>${M.capBound?'샐러리캡':'재정 여력'}</i></span><span>예산 여유 <b class="${c}">${money(M.room)}</b></span>${M.left?`<span>남은 지명 ${M.left}번 · 1명당 약 <b>${money(M.per)}</b></span>`:''}<span class="muted" title="지명이 끝나면 남은 선수 ${M.autoN}명이 자동 배분됩니다(약 ${money(M.W)}). 외국인 4명 예산 ${money(M.fres)}은 따로 잡아 두었습니다.${M.res?` 감독·코치 빈자리 채용비 ${money(M.res.vac)}과 운영 여유분 ${money(M.res.cush)}도 한도에서 미리 뺐습니다.`:''}">자동 배분 ${M.autoN}명(${money(M.W)}) 포함 · 외국인 예산·감독·코치 채용비 별도</span></div>`; }
/* 드래프트 상황판: 화면 위에 고정. 목록을 보면서 다른 구단 지명을 같이 본다 */
function fdTicker(){ const F=G.fd; if(!F||F.done)return ''; const pk=F.picks[F.cur]; const pre=F.open===false; const ask=fdManDone(); const mine=!pre&&!ask&&pk&&pk.tid===G.user;
  if(!pre&&!mine&&!ask&&pk&&!(UI.dl&&UI.dl.kind==='fd')&&!UI.dlAuto&&!UI.rev){ UI.dlAuto=1; setTimeout(()=>{ UI.dlAuto=0; const p2=G.fd&&G.fd.picks[G.fd.cur]; if(G.fd&&!G.fd.done&&G.fd.open!==false&&p2&&p2.tid!==G.user&&!(UI.dl&&UI.dl.kind==='fd')&&!UI.rev)dliveStart('fd'); },700); }
  const L=UI.dl&&UI.dl.kind==='fd'?UI.dl:null; const on=!!(L&&L.on); const top=L&&L.feed&&L.feed[0]; const st=L&&L.stolen&&L.stolen[0]; const fresh=st&&top&&st.pid===top.pid;
  const k=F.picks.slice(F.cur).findIndex(x=>x.tid===G.user); const sp=UI.dspeed||'norm';
  let r1;
  if(pre){ const first=F.picks.findIndex(x=>x.tid===G.user)+1; r1=`<b>지명 전 탐색 시간</b><span class="muted">우리 첫 지명 ${first}번째</span><button class="btn small primary" data-a="fdOpen">1라운드 시작</button>`; }
  else if(ask){ const left=F.picks.slice(F.cur).filter(x=>x.tid===G.user).length; r1=`<b class="good">${F.man}라운드 직접 지명을 마쳤습니다</b><span class="muted">남은 우리 지명 ${left}번은 주로 2군·백업 자원입니다</span>${fdPolSel()}<button class="btn small primary" data-a="fdAuto" title="고른 방침대로 스카우트가 남은 지명을 모두 뽑고 드래프트를 끝냅니다">나머지 스카우트에게 맡기기</button><button class="btn small" data-a="fdPlus">${Math.min(FD_ROUNDS,F.man+FD_MORE)}라운드까지 더 뽑기</button>`; }
  else if(mine){ r1=`<b class="good">우리 차례 · ${pk.rd}라운드 ${pk.no}번째</b><span class="tk-del">${fdPolSel()}<button class="btn small" data-a="fdAutoN" data-v="5" title="우리 지명 5번을 고른 방침대로 스카우트가 뽑고 다시 멈춥니다">5번 맡기기</button><button class="btn small" data-a="fdAuto" title="남은 우리 지명을 고른 방침대로 스카우트가 모두 뽑고 드래프트를 끝냅니다">나머지 맡기기</button></span><span class="muted">${F.man||FD_ROUNDS}라운드까지 직접 지명</span>`; }
  else r1=`${on?'<span class="dl-dot"></span>':''}${badge(pk.tid,18)}<b>${esc(tshort(pk.tid))} 지명 중 · ${pk.rd}-${pk.no}</b><span class="muted">우리 차례까지 ${k<0?'-':k}번</span><span class="tk-sp"><button data-a="dlSpdC" class="on">속도 ${({slow:'느리게',norm:'보통',fast:'빠르게'})[sp]}</button>${on?'<button data-a="dlStop">멈춤</button>':'<button data-a="fdAdv">진행</button>'}</span>`;
  const r2=fresh?`<div class="tk2 steal"><b>뺏겼습니다</b><span>${esc(st.tg)} <button class="lnk" data-a="player" data-v="${st.pid}">${esc(st.nm)}</button>을(를) ${esc(tshort(st.tid))}이(가) ${st.rd}-${st.no}에 지명</span>${top.o!=null?rchip(top.o):''}</div>`
    :top?`<div class="tk2">${badge(top.tid,16)}<i>${top.rd}-${top.no}</i><button class="lnk" data-a="player" data-v="${top.pid}">${esc(top.nm)}</button><span class="muted">${esc(top.pos)}${top.age!=null?` · ${top.age}세`:''}</span>${top.me?'<em class="good">우리 지명</em>':top.o!=null?rchip(top.o):''}${L.stN?`<span class="tk-l">놓친 관심 ${L.stN}명</span>`:''}</div>`:'';
  const risk=(()=>{ if(pre||ask)return ''; const RK=fdRisk(); const S=(G.shortlist||[]).map(id=>G.players[id]).filter(p=>p&&p.fdPool&&(RK[p.id]||0)>=.35).sort((a,b)=>RK[b.id]-RK[a.id]).slice(0,4); if(!S.length)return ''; return `<div class="tk2 risk"><b>${mine?'지금 안 뽑으면':'우리 차례 전에'} 빠질 수 있는 관심 선수</b>${S.map(p=>`<span class="rk-i"><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><em>${Math.round(RK[p.id]*100)}%</em></span>`).join('')}</div>`; })();
  return `<div class="tk"><div class="tk1">${r1}</div>${fdMoneyLine()}${risk}${r2}</div>`; }
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
  const today=[cerHomeCard(),resultHome(),liveCard(),digestCard(),todoCard(),decisionCard(),tutCard(),offersCard(),reqHomeCard(),mgrChatCard(true),faHomeCard(),campCard(),nextCard(),upcomingGames(10),desk].filter(Boolean).join('');
  const league=[miniStand(),mvHomeCard(),formCard(),newsCard()].filter(Boolean).join('');
  const moreBody=[myLeaders(),clubCard(),calendarCard()].filter(Boolean).join('');
  const o=UI.open.homeMore??false;
  const more=moreBody?`<details class="moreg" data-k="homeMore" ${o?'open':''}><summary><span>더 보기</span><i>우리 팀 주요 선수 · 구단 상태 · 일정</i></summary><div class="moreb">${moreBody}</div></details>`:'';
  const gh=t=>`<h2 class="grp-t">${t}</h2>`;
  if(wide())return `${stripBar()}${dashTiles()}<div class="homeg"><div class="col">${gh('오늘 할 일')}${today}</div><div class="col">${gh('리그 현황')}${league}${more}</div></div>`;
  const todo=[cerHomeCard(),todoCard(),decisionCard(),tutCard(),offersCard(),reqHomeCard(),mgrChatCard(true),faHomeCard(),campCard()].filter(Boolean).join('');
  const games=[resultHome(),liveCard(),digestCard(),nextCard(),upcomingGames(10)].filter(Boolean).join('');
  if(G.res&&UI._hres!==G.res.i+':'+G.day){ UI._hres=G.res.i+':'+G.day; UI.it=UI.it||{}; UI.it.home='game'; } /* 경기가 막 끝나면 경기 탭을 먼저 */
  const ht=inTabs('home',[['today','할 일'],...(games?[['game','경기']]:[]),['league','리그'],['team','우리 팀']]);
  return `${stripBar()}${ht.cur==='today'?dashTiles():''}${ht.bar}${ht.cur==='today'?todo:ht.cur==='game'?games:ht.cur==='league'?[miniStand(),mvHomeCard(),newsCard()].filter(Boolean).join(''):[desk,teamIdCard(),formCard(),myLeaders(),clubCard()].filter(Boolean).join('')}`;
}


/* 스카우트 칸: 구속(투수) · 툴 · 체격. 눈으로 보기 어려운 툴은 흐리게 */
const FD_TS={pow:'파워',spd:'발',def:'수비',con:'컨택',eye:'선구',stf:'구위',sta:'체력',ctl:'제구'};
function fdScoutCell(p){ const S=fdScoutTools(p); return `<td class="fdsc" title="${esc(fdScoutLine(p))}">${p.isP?`<b class="velo">${S.velo}<i>km</i></b>`:''}${S.L.map(t=>`<span class="ftl${t.vis?'':' fz'}" style="--c:${rcol(t.v)}" title="${t.vis?'':'눈으로 판단하기 어려워 오차가 큽니다'}">${FD_TS[t.k]} <b>${dv(t.v)}</b>${t.vis?'':'?'}</span>`).join('')}<span class="bd">${S.ht}·${S.wt}</span></td>`; }
/* 데이터팀 칸: 항목별 순위 말(상~하)과 운 · 표본 */
const FD_DS={'삼진 적음':'컨택','볼넷':'선구','장타력':'장타','생산력':'생산','탈삼진':'탈삼진','볼넷 억제':'제구','피홈런 억제':'피홈런','실점 억제(FIP)':'실점억제'};
function fdDataCell(p){ const d=fdData(p); if(!d)return '<td class="muted fddt">기록 부족</td>'; return `<td class="fddt">${d.it.map(([l,v])=>`<span class="dt-i" title="${l} 상위 ${100-v}%"><i>${FD_DS[l]}</i><b style="color:${pctC(v)}">${pctW(v)}</b></span>`).join('')}${d.lv===2?'<em class="tg">2군 기록</em>':''}${d.small?'<em class="tg w">표본 적음</em>':''}${d.luck?`<em class="tg ${d.luck[0].includes('불운')?'u':'l'}" title="${esc(d.luck[1])}">${d.luck[0]}</em>`:''}</td>`; }
function fdSortSel(gk,so,ana){ const o=[['war','WAR(지난해)'],['risk','뺏길 확률'],['sal','연봉 낮은 순'],...(gk==='P'?[['t:velo','스카우트: 구속'],['t:stf','스카우트: 구위'],['t:sta','스카우트: 체력'],['t:ctl','스카우트: 제구(추정)']]:[['t:pow','스카우트: 파워'],['t:spd','스카우트: 발'],['t:def','스카우트: 수비'],['t:con','스카우트: 컨택(추정)']]),...(ana?(gk==='P'?[['d:3','데이터: 실점 억제'],['d:0','데이터: 탈삼진'],['d:1','데이터: 제구']]:[['d:3','데이터: 생산력'],['d:2','데이터: 장타'],['d:1','데이터: 선구'],['d:0','데이터: 컨택']]):[])];
  return `<select class="fdsort" data-a="fdSsel" aria-label="정렬">${o.map(([k,l])=>`<option value="${k}" ${so===k?'selected':''}>정렬: ${l}</option>`).join('')}</select>`; }
/* 포지션 현황판: 남은 후보 · 툴 좋은 선수 · 기록 좋은 선수 · 다음 우리 차례 전 빠질 예상. 누르면 그 포지션만 */
function fdPosBoardH(gk,f){ const B=fdPosBoard(); const nm={SP:'선발형',RP:'불펜형'}; const F=G.fd;
  const my=F.picks.filter(x=>x.tid===G.user&&x.pid).map(x=>G.players[x.pid]).filter(Boolean); const {ln}=fdLineupOf(my.filter(p=>!p.isP)); const sp=my.filter(p=>p.isP&&isSPr(p)).length, rp=my.filter(p=>p.isP&&!isSPr(p)).length;
  const mine=k=>k==='SP'?`우리 ${sp}/6`:k==='RP'?`우리 ${rp}/7`:ln[k]?`우리 ${esc(ln[k].name)}`:'<b class="emp">우리 빈자리</b>';
  const cur=(gk==='P'?'P:':'B:')+f;
  const card=x=>{ const g=['SP','RP'].includes(x.k)?'P':'B'; const v=g+':'+x.k; return `<button class="fdpb-i${cur===v?' on':''}" data-a="fdPos" data-v="${cur===v?g+':all':v}"><span class="r1"><b>${nm[x.k]||SLK[x.k]}</b><i>${x.n}명</i></span><span class="r0">${mine(x.k)}</span><span class="r2" title="툴 좋은 선수 · 기록 좋은 선수 · 다음 우리 차례 전 빠질 예상">툴 <em>${x.tool}</em>${x.dat!=null?` · 기록 <em>${x.dat}</em>`:''} · <u class="${x.exp>=1.5?'hot':''}">−${x.exp.toFixed(1)}</u></span></button>`; };
  const all=(g,l)=>`<button class="fdpb-i all${cur===g+':all'?' on':''}" data-a="fdPos" data-v="${g}:all"><span class="r1"><b>${l}</b></span><span class="r0">전체 보기</span></button>`;
  return `<div class="fdpb"><p class="fdpb-k small muted">포지션을 누르면 그 자리 후보만 봅니다 · 툴 좋은 / 기록 좋은 선수 수 · −는 다음 우리 차례 전에 빠질 예상 인원</p>${all('B','야수')}${B.filter(x=>!['SP','RP'].includes(x.k)).map(card).join('')}${all('P','투수')}${B.filter(x=>['SP','RP'].includes(x.k)).map(card).join('')}</div>`; }
