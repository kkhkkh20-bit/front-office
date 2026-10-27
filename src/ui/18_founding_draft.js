/* ---------- 창단 드래프트: 우리 팀 빈자리 보드 ---------- */
const FDPOS={C:[50,90],'1B':[85,62],'2B':[68,36],SS:[32,36],'3B':[15,62],LF:[14,14],CF:[50,10],RF:[86,14]};
function fdLineupOf(list){ const used=new Set(), ln={}; for(const k of ['C','SS','2B','CF','3B','RF','LF','1B']){ const ok=list.filter(p=>!used.has(p.id)&&(p.pos===k||(subsOf(p)||[]).includes(k))).sort((a,b)=>posScore(b,k)-posScore(a,k)); if(ok[0]){ ln[k]=ok[0]; used.add(ok[0].id); } }
  const rest=list.filter(p=>!used.has(p.id)).sort((a,b)=>offV(b)-offV(a)); if(rest[0]){ ln.DH=rest[0]; used.add(rest[0].id); } return {ln,bench:list.filter(p=>!used.has(p.id))}; }
function fdBoard(myPicks,ci,justId){ const bats=myPicks.filter(p=>!p.isP), pits=myPicks.filter(p=>p.isP); const {ln,bench}=fdLineupOf(bats);
  const slot=k=>{ const p=ln[k]; const [x,y]=FDPOS[k]||[0,0]; const st=k==='DH'?'':`left:${x}%;top:${y}%`;
    return p?`<button class="fbs on${p.id===justId?' just':''}" style="${st}" data-a="player" data-v="${p.id}"><i>${SLK[k]}</i><b>${esc(p.name)}</b>${rchip(Math.round(ovr(p)))}</button>`
      :`<button class="fbs empty" style="${st}" data-a="fdSlot" data-v="${k}"><i>${SLK[k]}</i><b>빈자리</b><em>찾기</em></button>`; };
  const P=[...pits].sort((a,b)=>(spV(b)+roleBias(G.user,b))-(spV(a)+roleBias(G.user,a)));
  const pc=(p,i)=>`<button class="fpp${p.id===justId?' just':''}" data-a="player" data-v="${p.id}"><i>${i<5?'선발형':'불펜형'}</i><b>${esc(p.name)}</b>${rchip(Math.round(ovr(p)))}</button>`;
  const empties=Math.max(0,FD_TGT.P-pits.length);
  const miss=['C','1B','2B','3B','SS','LF','CF','RF'].filter(k=>!ln[k]).map(k=>SLK[k]);
  const pitN=pits.length;
  return `<section class="card fdbd"><div class="row between"><h2 class="sec">우리 팀 ${myPicks.length}명</h2>${(()=>{ const M=fdMoney(); return M?`<span class="small ${M.room<0?'bad':'muted'}">연봉 ${money(M.spent)} / 한도 ${money(M.lim)}</span>`:`<span class="small muted">연봉 ${money(ci.pay)} / 상한 ${money(ci.cap)}</span>`; })()}</div>
    <p class="small ${miss.length?'':'good'}">${miss.length?`빈 수비 위치 ${['C','1B','2B','3B','SS','LF','CF','RF'].filter(k=>!ln[k]).map(k=>`<button class="pill lnkp" data-a="fdSlot" data-v="${k}">${SLK[k]}</button>`).join('')}`:'수비 위치 8곳 완료'} · <button class="pill lnkp" data-a="fdSlot" data-v="P">투수 ${pitN}/${FD_TGT.P}</button> · <span class="muted">연봉 ${money(ci.pay)}</span></p>
    <div class="fld"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 96 L88 58 L50 20 L12 58 Z" class="dia"/><path d="M50 96 L2 48 Q50 -14 98 48 Z" class="ofl"/></svg>${['C','1B','2B','SS','3B','LF','CF','RF'].map(slot).join('')}</div>
    <div class="fdh2"><span>지명타자</span>${slot('DH')}${bench.length?`<span>벤치</span>${bench.map(p=>`<button class="fpp${p.id===justId?' just':''}" data-a="player" data-v="${p.id}"><i>${SLK[p.pos]}</i><b>${esc(p.name)}</b>${rchip(Math.round(ovr(p)))}</button>`).join('')}`:''}</div>
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
  <section class="card"><h2 class="sec">다음 단계: 창단 드래프트</h2><p class="small">리그 국내 선수 전원을 10개 구단이 ${FD_ROUNDS}라운드에 걸쳐 나눕니다. 시작하면 먼저 후보를 둘러볼 시간이 있고, 준비되면 1라운드를 엽니다.</p>
    <button class="btn primary block" data-a="fdBegin">창단 드래프트 열기</button></section>`; }
/* ---------- 창단 드래프트 화면 ---------- */
function fdView(){ const F=G.fd; const pk=F.picks[F.cur]; const pre=F.open===false; const mine=!pre&&pk&&pk.tid===G.user;
  const myPicks=F.picks.filter(x=>x.tid===G.user&&x.pid).map(x=>G.players[x.pid]).filter(Boolean);
  const ci=capInfo(G.user); const sl=new Set(G.shortlist||[]);
  const TK=new Map(F.picks.filter(x=>x.pid).map(x=>[x.pid,x]));
  const gk=UI.fdG||'B', f=UI.fdF||'all', so=UI.fdS||'rec', dir=UI.fdD||0, young=!!UI.fdY, onlyS=!!UI.fdO, hide=UI.fdHide==null?true:!!UI.fdHide; const X=fdCtx(G.user); const ly=(F.y||G.year)-1;
  const posOk=p=>gk==='P'?p.isP:!p.isP&&(f==='all'||p.pos===f||(f==='OF'&&['LF','CF','RF'].includes(p.pos)));
  /* 지명된 선수도 목록에서 빠지지 않고 제자리에 회색으로 남는다 */
  const ALL=(F.all||Object.keys(F.est||{}).map(Number)).map(id=>G.players[id]).filter(p=>p&&(p.fdPool||TK.has(p.id)));
  const left=ALL.filter(p=>p.fdPool);
  let L=ALL.filter(p=>posOk(p)&&(!young||p.age<=24)&&(!onlyS||sl.has(p.id))&&(!hide||p.fdPool)).map(p=>({p,t:TK.get(p.id)||null,s:fdStatLine(p,ly),v:fdScore(G.user,p,true,X)}));
  const cntB=left.filter(p=>!p.isP).length, cntP=left.length-cntB;
  /* 열 정의: [키, 제목, 값, 표시, 높을수록 좋은가, 표본 기준] */
  const n2=x=>x.toFixed(2), ipS=n=>{ const o=Math.round(n*3); return `${Math.floor(o/3)}${o%3?'.'+o%3:''}`; };
  const W=['war','WAR',s=>s.lvl===1?s.war:-99,v=>v<=-90?'-':v.toFixed(1),1];
  const VW=UI.fdV==='trk'; const pct=v=>v+'%';
  const COLS=VW?(gk==='P'?[W,['velo','구속<i class="vmx">직구 평균·최고</i>',s=>s.velo,(v,st)=>`${v}<i class="vmx">최고 ${st&&st.vmax||'-'}</i>`,1,1],['rpm','회전수<i class="vmx">직구 RPM</i>',s=>s.t.rpm,v=>v,1,1],['ext','익스텐션',s=>s.t.ext,v=>v.toFixed(2)+'m',1,1],['pwh','헛스윙 유도',s=>s.t.whiff,pct,1,1],['csw','CSW<i class="vmx">루킹+헛스윙</i>',s=>s.t.csw,pct,1,1],['gb','땅볼 비율',s=>s.t.gb,pct,1]]
    :[W,['ev','타구속도<i class="vmx">평균</i>',s=>s.ev,v=>`${v}km`,1,1],['evm','최고 타구속도',s=>s.t.evmax,v=>`${v}km`,1,1],['hh','강한 타구<i class="vmx">150km 이상</i>',s=>s.t.hh,pct,1,1],['bwh','헛스윙률',s=>s.t.whiff,pct,0,1],['chase','볼 스윙률',s=>s.t.chase,pct,0,1],['run','1루 도달',s=>s.t.run,v=>v.toFixed(2)+'초',0,1],['arm','송구 속도',s=>s.t.arm,v=>`${v}km`,1,1]])
    :gk==='P'?[W,['velo','구속<i class="vmx">직구 평균·최고</i>',s=>s.velo,(v,st)=>`${v}<i class="vmx">최고 ${st&&st.vmax||'-'}</i>`,1,1],['era','ERA',s=>s.era,n2,0,1],['fip','FIP',s=>s.fip,n2,0,1],['whip','WHIP',s=>s.whip,n2,0,1],['ip','이닝',s=>s.n,ipS,1],['g','경기(선발)',s=>s.g,(v,s)=>`${v}${s&&s.gs?`(${s.gs})`:''}`,1],['k9','삼진/9',s=>s.k9,v=>v.toFixed(1),1,1],['bb9','볼넷/9',s=>s.h.bb*9/s.n,v=>v.toFixed(1),0,1]]
    :[W,['ev','타구속도<i class="vmx">평균</i>',s=>s.ev,v=>`${v}km`,1,1],['ops','OPS',s=>s.ops,fmt3,1,1],['obp','출루율',s=>s.obp,fmt3,1,1],['slg','장타율',s=>s.slg,fmt3,1,1],['avg','타율',s=>s.avg,fmt3,1,1],['hr','홈런',s=>s.hr,v=>v,1],['bbk','볼삼비',s=>s.bbk,n2,1,1],['sb','도루',s=>s.sb,v=>v,1],['pa','타석',s=>s.n,v=>v,1]];
  const minN=gk==='P'?20:100; const lg={};
  { const Q=ALL.filter(p=>(gk==='P')===p.isP).map(p=>fdStatLine(p,ly)).filter(s=>s&&s.lvl===1&&s.n>=minN); if(Q.length)for(const c of COLS){ if(!c[5])continue; const v=Q.map(s=>c[2](s)).sort((a,b)=>a-b); lg[c[0]]=v[Math.floor(v.length/2)]; } }
  const col=COLS.find(c=>c[0]===so);
  const key=x=>{ if(so==='rec')return x.v; if(so==='sal')return -x.p.sal; if(so==='grd'){ const g=fdGrade(x.p); return g?g.o+(g.up?1.5:0):-99; } if(!col||!x.s)return -1e9; const ok=!col[5]||x.s.n>=minN; const v=col[2](x.s); return (ok?0:-1e6)+(col[4]?v:-v)+(x.s.lvl===1?0:-5e5); };
  L.sort((a,b)=>(key(b)-key(a))*(dir?-1:1)||a.p.id-b.p.id);
  const more=UI.fdMore||60; const shown=L.slice(0,more);
  const hd=(k,l)=>`<th><button data-a="fdS" data-v="${k}" class="${so===k?'on':''}">${l}${so===k?(dir?'▲':'▼'):''}</button></th>`;
  const cell=(c,x)=>{ if(!x.s)return '<td class="muted">-</td>'; const v=c[2](x.s); let cl=''; if(!x.t){ if(c[0]==='war'&&v>-90)cl=v>=3?'hi':v<0?'lo':''; if(c[5]&&lg[c[0]]!=null&&x.s.n>=minN&&x.s.lvl===1){ const d=(v-lg[c[0]])/(Math.abs(lg[c[0]])||1)*(c[4]?1:-1); cl=d>.12?'hi':d<-.12?'lo':''; } } return `<td class="${cl}">${c[3](v,x.s)}</td>`; };
  const MM=fdMoney();
  const trow=x=>{ const p=x.p; const lv=x.s&&x.s.lvl===2; const t=x.t; const me=t&&t.tid===G.user;
    const lead=t?`<span class="fdtk">${badge(t.tid,18)}</span>`:`<button class="fds${sl.has(p.id)?' on':''}" data-a="star" data-v="${p.id}" aria-label="관심">${sl.has(p.id)?'★':'☆'}</button>${gchip(fdGrade(p))}`;
    const tail=t?`<span class="fdtk2"><i>${me?'우리':esc(tshort(t.tid))} ${t.rd}-${t.no}</i>${rchip(Math.round(ovr(p)))}</span>`:mine?`<button class="fdgo" data-a="fdPick" data-v="${p.id}">지명</button>`:'';
    return `<tr class="${lv?'f2':''}${!t&&sl.has(p.id)?' st':''}${t?(me?' gone me':' gone'):''}"><th><div class="fdn">${lead}<button class="fdnm" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b><i>${p.age}세 · ${p.isP?'투수':SLK[p.pos]||posLabel(p)}${lv?' · 2군':''}${isAway(p)?' · 군':''}</i></button>${tail}</div></th>${cell(COLS[0],x)}<td class="${!t&&MM&&p.sal>MM.room-MM.W?'lo':''}" title="${!t&&MM&&p.sal>MM.room-MM.W?'지명하면 연봉 한도를 넘을 수 있습니다':''}">${money(p.sal)}</td>${COLS.slice(1).map(c=>cell(c,x)).join('')}<td class="small">${esc(tContract(p))}</td><td class="small">${p.fdFrom!=null?esc(tshort(p.fdFrom)):''}</td></tr>`; };
  const listPane=`<section class="card"><div class="seg"><button data-a="fdG" data-v="B" class="${gk==='B'?'on':''}">야수 남은 ${cntB}</button><button data-a="fdG" data-v="P" class="${gk==='P'?'on':''}">투수 남은 ${cntP}</button></div>
    ${gk==='B'?`<div class="chips">${[['all','전체'],['C','포수'],['1B','1루'],['2B','2루'],['3B','3루'],['SS','유격'],['OF','외야'],['LF','좌익'],['CF','중견'],['RF','우익'],['DH','지명']].map(([k,l])=>`<button data-a="fdF" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div>`:''}
    <div class="chips"><span class="seg sm" style="display:inline-flex"><button data-a="fdV" data-v="rec" class="${UI.fdV!=='trk'?'on':''}">기록</button><button data-a="fdV" data-v="trk" class="${UI.fdV==='trk'?'on':''}">측정</button></span><button data-a="fdS" data-v="rec" class="${so==='rec'?'on':''}">추천순</button><button data-a="fdS" data-v="grd" class="${so==='grd'?'on':''}">등급순${so==='grd'?(dir?'▲':'▼'):''}</button><button data-a="fdY" class="${young?'on':''}">24세 이하</button><button data-a="fdO" class="${onlyS?'on':''}">관심만 ${[...sl].filter(id=>G.players[id]&&G.players[id].fdPool).length||''}</button><button data-a="fdHide" class="${hide?'on':''}">남은 선수만</button></div>
    <p class="small muted keep">${ly}시즌 기록 · 글자는 스카우트 추정 등급(틀릴 수 있음, S 75+ · A 65+ · B 55+ · C 50+ · D 45+, 능력 50이 리그 평균) · 회색 줄은 이미 지명된 선수 · 열 제목으로 정렬</p>
    <div class="fdt-w"><table class="fdt"><thead><tr><th class="c0">선수</th>${hd(COLS[0][0],COLS[0][1])}${hd('sal','연봉')}${COLS.slice(1).map(c=>hd(c[0],c[1])).join('')}<th>계약</th><th>전 소속</th></tr></thead><tbody>${shown.map(trow).join('')}</tbody></table></div>
    ${L.length>shown.length?`<button class="btn block" data-a="fdMore">${Math.min(60,L.length-shown.length)}명 더 보기 (${shown.length}/${L.length})</button>`:''}</section>`;
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
  return `<div class="tk0"><span>국내 연봉 <b>${money(M.spent)}</b> / 한도 <b>${money(M.lim)}</b><i>${M.capBound?'샐러리캡':'재정 여력'}</i></span><span>예산 여유 <b class="${c}">${money(M.room)}</b></span>${M.left?`<span>남은 지명 ${M.left}번 · 1명당 약 <b>${money(M.per)}</b></span>`:''}<span class="muted" title="지명이 끝나면 남은 선수 ${M.autoN}명이 자동 배분됩니다(약 ${money(M.W)}). 외국인 4명 예산 ${money(M.fres)}은 따로 잡아 두었습니다.${M.res?` 감독·코치 빈자리 채용비 ${money(M.res.vac)}와 운영 여유분 ${money(M.res.cush)}도 한도에서 미리 뺐습니다.`:''}">자동 배분 ${M.autoN}명(${money(M.W)}) 포함 · 외국인 예산·감독·코치 채용비 별도</span></div>`; }
/* 드래프트 상황판: 화면 위에 고정. 목록을 보면서 다른 구단 지명을 같이 본다 */
function fdTicker(){ const F=G.fd; if(!F||F.done)return ''; const pk=F.picks[F.cur]; const pre=F.open===false; const mine=!pre&&pk&&pk.tid===G.user;
  if(!pre&&!mine&&pk&&!(UI.dl&&UI.dl.kind==='fd')&&!UI.dlAuto&&!UI.rev){ UI.dlAuto=1; setTimeout(()=>{ UI.dlAuto=0; const p2=G.fd&&G.fd.picks[G.fd.cur]; if(G.fd&&!G.fd.done&&G.fd.open!==false&&p2&&p2.tid!==G.user&&!(UI.dl&&UI.dl.kind==='fd')&&!UI.rev)dliveStart('fd'); },700); }
  const L=UI.dl&&UI.dl.kind==='fd'?UI.dl:null; const on=!!(L&&L.on); const top=L&&L.feed&&L.feed[0]; const st=L&&L.stolen&&L.stolen[0]; const fresh=st&&top&&st.pid===top.pid;
  const k=F.picks.slice(F.cur).findIndex(x=>x.tid===G.user); const sp=UI.dspeed||'norm';
  let r1;
  if(pre){ const first=F.picks.findIndex(x=>x.tid===G.user)+1; r1=`<b>지명 전 탐색 시간</b><span class="muted">우리 첫 지명 ${first}번째</span><button class="btn small primary" data-a="fdOpen">1라운드 시작</button>`; }
  else if(mine){ const rec=fdUserRec(1)[0]; r1=`<b class="good">우리 차례 · ${pk.rd}라운드 ${pk.no}번째</b>${rec?`<button class="btn small primary" data-a="fdRec">추천 ${esc(rec.name)} 지명</button>`:''}<button class="btn small" data-a="fdAutoN" data-v="5" title="우리 지명 5번을 스카우트 추천대로 뽑고 다시 멈춥니다">5번 자동</button><button class="btn small" data-a="fdAuto">남은 자동</button>`; }
  else r1=`${on?'<span class="dl-dot"></span>':''}${badge(pk.tid,18)}<b>${esc(tshort(pk.tid))} 지명 중 · ${pk.rd}-${pk.no}</b><span class="muted">우리 차례까지 ${k<0?'-':k}번</span><span class="tk-sp"><button data-a="dlSpdC" class="on">속도 ${({slow:'느리게',norm:'보통',fast:'빠르게'})[sp]}</button>${on?'<button data-a="dlStop">멈춤</button>':'<button data-a="fdAdv">진행</button>'}</span>`;
  const r2=fresh?`<div class="tk2 steal"><b>뺏겼습니다</b><span>${esc(st.tg)} <button class="lnk" data-a="player" data-v="${st.pid}">${esc(st.nm)}</button>을(를) ${esc(tshort(st.tid))}이(가) ${st.rd}-${st.no}에 지명</span>${top.o!=null?rchip(top.o):''}</div>`
    :top?`<div class="tk2">${badge(top.tid,16)}<i>${top.rd}-${top.no}</i><button class="lnk" data-a="player" data-v="${top.pid}">${esc(top.nm)}</button><span class="muted">${esc(top.pos)}${top.age!=null?` · ${top.age}세`:''}</span>${top.me?'<em class="good">우리 지명</em>':top.o!=null?rchip(top.o):''}${L.stN?`<span class="tk-l">놓친 관심 ${L.stN}명</span>`:''}</div>`:'';
  return `<div class="tk"><div class="tk1">${r1}</div>${fdMoneyLine()}${r2}</div>`; }
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
  const today=[resultHome(),liveCard(),digestCard(),todoCard(),decisionCard(),tutCard(),offersCard(),reqHomeCard(),mgrChatCard(true),faHomeCard(),campCard(),nextCard(),desk].filter(Boolean).join('');
  const league=[miniStand(),formCard(),newsCard()].filter(Boolean).join('');
  const moreBody=[myLeaders(),clubCard(),calendarCard()].filter(Boolean).join('');
  const o=UI.open.homeMore??false;
  const more=moreBody?`<details class="moreg" data-k="homeMore" ${o?'open':''}><summary><span>더 보기</span><i>우리 팀 주요 선수 · 구단 상태 · 일정</i></summary><div class="moreb">${moreBody}</div></details>`:'';
  const gh=t=>`<h2 class="grp-t">${t}</h2>`;
  if(wide())return `${stripBar()}<div class="homeg"><div class="col">${gh('오늘 할 일')}${today}</div><div class="col">${gh('리그 현황')}${league}${more}</div></div>`;
  const todo=[todoCard(),decisionCard(),tutCard(),offersCard(),reqHomeCard(),mgrChatCard(true),faHomeCard(),campCard()].filter(Boolean).join('');
  const games=[resultHome(),liveCard(),digestCard(),nextCard()].filter(Boolean).join('');
  if(G.res&&UI._hres!==G.res.i+':'+G.day){ UI._hres=G.res.i+':'+G.day; UI.it=UI.it||{}; UI.it.home='game'; } /* 경기가 막 끝나면 경기 탭을 먼저 */
  const ht=inTabs('home',[['today','할 일'],...(games?[['game','경기']]:[]),['league','리그'],['team','우리 팀']]);
  return `${stripBar()}${ht.bar}${ht.cur==='today'?todo:ht.cur==='game'?games:ht.cur==='league'?[miniStand(),newsCard()].filter(Boolean).join(''):[desk,teamIdCard(),formCard(),myLeaders(),clubCard()].filter(Boolean).join('')}`;
}

