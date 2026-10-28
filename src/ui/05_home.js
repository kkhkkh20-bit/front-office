/* ---------- 홈 ---------- */
/* 다음 일까지 진행한 동안의 요약 */
function digestCard(){ const D=G.dig; if(!D||!D.games||!D.games.length||G.res)return '';
  const gs=D.games.map(d=>{ const i=G.games.findIndex(g=>g.day===d&&(g.home===G.user||g.away===G.user)); return i>=0?{i,g:G.games[i]}:null; }).filter(Boolean);
  const w=gs.filter(x=>x.g.res==='승').length, l=gs.filter(x=>x.g.res==='패').length; const rk=userRank();
  const chips=gs.map(x=>{ const g=x.g; const home=g.home===G.user; const ms=home?g.hs:g.as, os=home?g.as:g.hs; const op=home?g.away:g.home;
    return `<button class="dg-g ${g.res==='승'?'w':g.res==='패'?'l':''}" data-a="openGame" data-v="${x.i}"><i>${dsh(g.day)}</i><b>${g.res}</b><span>${ms}:${os}</span><em>${home?'vs':'@'} ${esc(team(op).nick)}</em></button>`; }).join('');
  const rows=[]; for(const p of playersOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); if(!h)continue; const a=D.snap[p.id]||DIGK.map(()=>0); const d={}; DIGK.forEach((k,i)=>d[k]=(h[k]||0)-a[i]);
    if(p.isP){ if(d.outs<3)continue; const era=d.er*27/d.outs; rows.push({p,isP:true,sc:(d.outs/3)*(4.5-era)/9+d.w*.3+d.sv*.3+d.hld*.15,t:`${ipStr(d.outs)}이닝 ${d.er}자책${d.w?` ${d.w}승`:''}${d.l?` ${d.l}패`:''}${d.sv?` ${d.sv}세이브`:''}${d.hld?` ${d.hld}홀드`:''}`}); }
    else { if(d.pa<5)continue; const ops=d.ab?(d.h+d.bb)/Math.max(1,d.pa)+(d.h+d.d+2*d.tr+3*d.hr)/d.ab:0; rows.push({p,isP:false,sc:(ops-.72)*d.pa/10+d.hr*.2,t:`${d.pa}타석 ${d.h}안타${d.hr?` ${d.hr}홈런`:''} ${d.rbi}타점 · OPS ${fmt3(ops)}`}); } }
  rows.sort((a,b)=>b.sc-a.sc); const B=rows.filter(x=>!x.isP), P=rows.filter(x=>x.isP); const hot=[...B.slice(0,2),...P.slice(0,1)].filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc), cold=[B[B.length-1],P[P.length-1]].filter(x=>x&&x.sc<0&&!hot.includes(x));
  const li=x=>`<button class="dg-p" data-a="player" data-v="${x.p.id}">${avImg(x.p)}<span><b>${esc(x.p.name)}</b><i>${posLabel(x.p)} · ${x.t}</i></span></button>`;
  const inj=playersOf(G.user).filter(p=>p.injOut>=5).slice(0,3);
  return `<section class="card digest"><div class="row between"><span class="eyebrow">${dmd(D.from)} ~ ${dmd(D.to)} · ${gs.length}경기</span><span class="pill ${w>l?'good':w<l?'bad':''}">${w}승 ${l}패</span></div>
    <h2 class="sec">${w>l?'좋은 흐름':w<l?'아쉬운 한 주':'반타작'} · ${D.rk&&rk?(rk<D.rk?`${D.rk}위 → <b>${rk}위</b>`:rk>D.rk?`${D.rk}위 → <b class="bad">${rk}위</b>`:`${rk}위 유지`):''}</h2>
    <div class="dg-gs">${chips}</div>
    ${(()=>{ const A=(G.autoLog||[]).filter(x=>x.d>=D.from&&x.d<=D.to); return A.length?`<p class="small"><b>자동 처리 ${A.length}건</b> · ${A.map(x=>`${esc(x.t)}: ${esc(x.c)}${x.r?` (${esc(x.r.replace(/\.$/,''))})`:''}`).join(' / ')}</p>`:''; })()}
    ${hot.length?`<div class="eyebrow">잘한 선수</div><div class="dg-ps">${hot.map(li).join('')}</div>`:''}
    ${cold.length?`<div class="eyebrow">부진한 선수</div><div class="dg-ps">${cold.map(li).join('')}</div>`:''}
    ${inj.length?`<p class="small">부상: ${inj.map(p=>`${esc(p.name)}(${esc(injNow(p))}, ${p.injOut}일)`).join(', ')}</p>`:''}
    <p class="small sdesc">경기를 누르면 박스스코어를 볼 수 있습니다. 한 경기씩 보려면 위의 "1경기"를 누르세요.</p></section>`; }
function resultHome(){
  if(!G.res||G.live)return ''; const g=G.games[G.res.i]; if(!g){G.res=null;return '';}
  const me=g.home===G.user?'h':'a'; const ms=g.box[me];
  const n=(G.sea.ulog||[]).filter(x=>!/차전/.test(x.k)).length; const reg=!/차전/.test(g.kind||'')&&period()==='season';
  const star=[...ms.bat].sort((a,b)=>(b.h*2+b.hr*3+b.rbi*1.5)-(a.h*2+a.hr*3+a.rbi*1.5))[0];
  const sp=ms.pit[0]; const dec=ms.pit.filter(q=>q.d&&q!==sp);
  const pf=[]; if(star&&star.h)pf.push(`<button class="pf" data-a="player" data-v="${star.id}">${G.players[star.id]?avImg(G.players[star.id]):''}<span><b>${esc(star.n)}</b><i>${star.ab}타수 ${star.h}안타${star.hr?` ${star.hr}홈런`:''}${star.rbi?` ${star.rbi}타점`:''}</i></span></button>`);
  if(sp)pf.push(`<button class="pf" data-a="player" data-v="${sp.id}">${G.players[sp.id]?avImg(G.players[sp.id]):''}<span><b>${esc(sp.n)}${sp.d?` <em class="${sp.d==='승'?'g':sp.d==='패'?'b':''}">${sp.d}</em>`:''}</b><i>선발 ${ipStr(sp.outs)}이닝 ${sp.er}실점 ${sp.so}K</i></span></button>`);
  for(const q of dec.slice(0,1))pf.push(`<button class="pf" data-a="player" data-v="${q.id}">${G.players[q.id]?avImg(G.players[q.id]):''}<span><b>${esc(q.n)} <em class="${q.d==='승'?'g':q.d==='패'?'b':''}">${q.d==='세'?'세이브':q.d==='홀'?'홀드':q.d}</em></b><i>${ipStr(q.outs)}이닝 ${q.er}실점</i></span></button>`);
  const runs=g.ev.filter(e=>e.run).slice(-3);
  const others=tlOf(g.home).length?otherScores(g.day,[g.home,g.away]):'';
  return `<section class="card hero rescard">
    <div class="row between"><span class="eyebrow">${g.kind?esc(g.kind)+' · ':''}${dmd(g.day)} ${WD[dobj(g.day).w]}${reg?` · ${n}/144경기`:''}${g.att?` · 관중 ${g.att.toLocaleString('ko-KR')}${g.so?'(매진)':''}`:''}</span><span class="pill ${g.res==='승'?'good':g.res==='패'?'bad':''}">${g.res}</span></div>
    <div class="scoreline">${badge(g.away,34)}<b class="tn2"><i>${team(g.away).city}</i>${team(g.away).nick}</b><span class="num">${g.as}</span><i>:</i><span class="num">${g.hs}</span><b class="tn2"><i>${team(g.home).city}</i>${team(g.home).nick}</b>${badge(g.home,34)}</div>
    ${lineScore(g,null)}
    ${pf.length?`<div class="pfs">${pf.join('')}</div>`:''}
    ${others}
    ${(()=>{ try{ return fanLinesHtml(gameFanLines(g),'팬 반응'); }catch(e){ return ''; } })()}
    <div class="btns3">${g.pbp&&g.pbp.length?`<button class="btn primary" data-a="cast" data-v="${G.res.i}">그래픽 중계</button><button class="btn" data-a="watch" data-v="${G.res.i}">문자 중계</button>`:''}<button class="btn" data-a="openGame" data-v="${G.res.i}">박스스코어</button><button class="btn" data-a="resNext" ${blockNow()?'disabled':''}>다음 경기</button><button class="btn primary" data-a="watchNext" ${blockNow()?'disabled':''}>다음 경기 중계로 보기</button></div>
  </section>`;
}
function otherScores(day,skip){
  const gs=[]; for(const t of G.teams){ for(const x of tlOf(t.id)) if(x[5]===day&&x[3]===1&&!(skip||[]).includes(t.id))gs.push({h:t.id,a:x[4],hs:x[1],as:x[2]}); }
  if(!gs.length)return '';
  return `<div class="oscores"><span class="eyebrow">다른 구장</span>${gs.map(s=>`<span class="os"><b class="${s.as>s.hs?'w':''}">${tshort(s.a)} ${s.as}</b><i>:</i><b class="${s.hs>s.as?'w':''}">${s.hs} ${tshort(s.h)}</b></span>`).join('')}</div>`;
}
const TODO={
  'trade:offers':['트레이드 제안이 와 있습니다','트레이드 → 트레이드 매물에서 답하세요'],
  'transfer:foreign':['외국인 선수 자리가 비어 있습니다','외국인 자리 4개 중 빈 자리를 채우세요'],
  'transfer:fa':['FA 시장이 열려 있습니다','에이전트와 협상할 선수를 고르세요'],
  'transfer:contract':['연봉 협상이 남아 있습니다','계약 화면에서 확정하세요'],
  'transfer:draft':['신인 드래프트 진행 중','우리 순번에 지명하세요'],
  'staff:scouts':['스카우트 배치가 부족합니다','아마추어 담당을 3곳 이상 맡기세요'],
  'staff:mgr':['감독이 없습니다','개막 전에 감독을 선임해야 합니다'],
  'staff:coach':['코치 자리가 비어 있습니다','스태프 → 코치진에서 채우세요'],
  'staff:med':['의무 체계를 정하지 않았습니다','부상 방지 투자와 지정 병원'],
  'staff:mil':['상무 지원 기간입니다','입대 대상 선수를 확인하세요']};
/* ---------- 전력 요약: 전력 한눈에 + 추천 트레이드 ---------- */
const SLOTS_S={C:'포수','1B':'1루','2B':'2루','3B':'3루',SS:'유격',LF:'좌익',CF:'중견',RF:'우익',DH:'지명',SP:'선발',RP:'불펜'};
const rkCls=r=>r<=3?'hi':r<=7?'md':'lo';
function pMini(p,tag){ const rp=scoutReport(p); const h=curLine(p); const st=!h?'기록 없음':p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)}`:'-'):(h.pa?`OPS ${fmt3(bRate(h).ops)}`:'-');
  return `<button class="pm" data-a="player" data-v="${p.id}">${avImg(p)}<span><b>${esc(p.name)}${p.team!=null&&team(p.team).cap===p.id?' <em class="capb">C</em>':''}${p.fr&&p.fr.tid===p.team?' <em class="frb">프랜차이즈</em>':''}</b><i>${posLabel(p)} · ${p.age}세 · ${st}</i><i>${money(p.sal)} · ${tContract(p)}</i></span><span class="pm-o">${rchip(rp.cur)}${condChip(p)}</span></button>`; }
function outTxt(p){ return p.injOut>0?`${p.injK&&INJ[p.injK]?INJ[p.injK].part+' ':''}부상 ${p.injOut}일`:p.susp>G.day?`출장 정지 ${p.susp-G.day}일`:isAway(p)?'군 복무':'출전 불가'; }
/* 컨디션 화살표(FM 방식): 시즌 폼·최근 흐름·기분·피로를 합친 값(-5~+5)을 다섯 단계 방향으로 보여 준다 */
const CND=[{min:2,deg:-90,c:'#3fd07f',l:'최상'},{min:1,deg:-45,c:'#9be27a',l:'좋음'},{min:-1,deg:0,c:'#9aa7b4',l:'보통'},{min:-2,deg:45,c:'#ffb547',l:'나쁨'},{min:-99,deg:90,c:'#ff6b6b',l:'최악'}];
function condLv(p){ const c=condOf(p); return {c,...CND.find(x=>c>=x.min)}; }
function condChip(p){ if(!p||p.team==null)return ''; const L=condLv(p); const f=p.sf&&p.sf.y===G.year?(p.sf.v*.5+(p.sf.m||0)):0;
  return `<i class="cnd ca" style="--cc:${L.c}" title="컨디션 ${L.l} (${L.c>0?'+':''}${L.c}) · 폼 ${f>=0?'+':''}${f.toFixed(1)} · 기분 ${Math.round(p.mor??60)} · 피로 ${Math.round(p.fat||0)}"><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="transform:rotate(${L.deg}deg)"><path d="M1.5 6h8M6.5 2.5 10 6l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></i>`; }
function roomAfter(give,get){ const b0=budget(); const sv=[]; const mv=(id,t)=>{ const p=G.players[id]; if(!p)return; sv.push([p,p.team]); p.team=t; };
  const other=get.length&&G.players[get[0]]?G.players[get[0]].team:-9; give.forEach(id=>mv(id,other)); get.forEach(id=>mv(id,G.user));
  let b1=b0; try{ b1=budget(); }finally{ sv.reverse().forEach(([p,t])=>p.team=t); } return {before:Math.round(b0.roomGoal),after:Math.round(b1.roomGoal),dE:Math.round(b1.E-b0.E),dI:Math.round(b1.I-b0.I)}; }
function dealMoney(give,get){ const inS=sum(get.map(id=>G.players[id]?G.players[id].sal:0)), outS=sum(give.map(id=>G.players[id]?G.players[id].sal:0)); const d=inS-outS; const ra=roomAfter(give,get); const cost=ra.before-ra.after;
  const yrs=id=>{ const p=G.players[id]; return p?ctrlYears(p):1; }; const commit=sum(get.map(id=>(G.players[id]?G.players[id].sal:0)*yrs(id)))-sum(give.map(id=>(G.players[id]?G.players[id].sal:0)*yrs(id)));
  return `<div class="deal-m"><span>연봉 ${d>=0?'+':''}${money(d)}/년</span><span class="small muted">남은 계약 총액 ${commit>=0?'+':''}${money(commit)}</span><span class="pill ${ra.after>=0?(cost>0?'warn':'good'):'bad'}" title="경쟁균형세 변화 포함">예산 여유 ${money(ra.before)} → ${money(ra.after)}</span></div>`; }
function dealCard(s,i,src){ const p=G.players[s.id]; if(!p)return ''; const op=asstOpinion(s.tid,s.give,[s.id]);
  return `<div class="deal"><div class="deal-h"><b>${SLOTK[s.k]} 보강${(()=>{ const q=G.players[s.id]; if(!q)return ''; const sl=pSlot(q); return sl&&sl!==s.k&&SLOTK[sl]?` <span class="small muted">(${SLOTK[sl]} 자원)</span>`:''; })()}</b><span class="small muted">리그 ${s.rank0}위${s.rank1?` → 약 ${s.rank1}위`:''}</span><span class="deal-t">${badge(s.tid,16)}${tshort(s.tid)}</span></div>
    <div class="deal-b"><div><span class="eyebrow">받는 선수</span>${pMini(p)}</div><div><span class="eyebrow">주는 선수</span>${s.give.map(id=>G.players[id]?pMini(G.players[id]):'').join('')}</div></div>
    ${dealMoney(s.give,[s.id])}${(()=>{ const mv=mgrTradeView(s.tid,s.give,[s.id]); return mv?`<p class="deal-o">${esc(mv.txt)}</p>`:''; })()}
    ${op.length?`<p class="deal-o">부단장: ${esc(op.slice(0,2).join(' '))}</p>`:''}
    <div class="row"><button class="btn small primary" data-a="tsugGo" data-v="${src}:${i}">이 조건으로 제안</button><button class="btn small" data-a="tsugEdit" data-v="${src}:${i}">조건 고치기</button></div></div>`; }
function deskCard(){ const per=period(); if(G.gameOver)return ''; const rk=slotRanks(G.user);
  const bar=slotBar(rk,true);
  const setup=!G.mgr[G.user]||(foreignOpen()&&foreignOf(G.user).length<3&&period()!=='season');
  const open=tradeOpen()&&!setup; const L=open?tradeSuggest(false):[]; UI._tsug=L; const S=open?sellSuggest():[];
  const deals=setup?`<p class="small muted">감독 선임과 외국인 선수 구성을 먼저 마치면 트레이드 추천을 드립니다.</p>`:!open?`<p class="small muted">트레이드 기간이 아닙니다(7월 31일 마감, 포스트시즌 뒤 다시 열림).</p>`:L.length?(()=>{ const oi=UI.dealOpen!=null&&UI.dealOpen<L.length?UI.dealOpen:0; return dealCard(L[oi],oi,'d')+L.map((x,i)=>{ if(i===oi)return ''; const q=G.players[x.id]; return `<button class="dealmini" data-a="dealOpen" data-v="${i}"><b>${SLOTK[x.k]} 보강</b><span>${badge(x.tid,14)} ${q?esc(q.name):''} 받고 ${x.give.map(id=>G.players[id]?esc(G.players[id].name):'').join('·')} 주기</span><i>보기</i></button>`; }).join(''); })():'<p class="small muted">지금 바로 성사될 만한 보강 트레이드가 없습니다. "다른 추천"을 눌러 보세요.</p>';
  return `<section class="card desk"><div class="row between"><h2 class="sec">전력 요약</h2><span class="row"><button class="btn small" data-a="cmpT" data-v="">전력 비교</button><button class="btn small primary" data-a="go" data-v="trade:market">트레이드 센터</button></span></div>${deadlineBanner()}
    <div class="eyebrow">우리 전력 · 자리별 리그 순위 (누르면 비교)</div>${bar}
    ${UI.deskMsg?`<div class="note ${UI.deskOk?'':'bad'}">${esc(UI.deskMsg)}</div>`:''}
    <div class="row between"><span class="eyebrow">추천 트레이드 · 상대가 받아들일 조건</span>${open?'<button class="tc-i" data-a="tsugMore">다른 추천</button>':''}</div>${deals}
    ${S.length?`<div class="eyebrow">팔 만한 벤치 자원 · 매물로 내놓으면 제안이 옵니다</div><div class="sells">${S.map(x=>`<div class="sell">${pMini(x.p)}<span class="small muted">${tshort(x.t.id)} 관심</span><button class="tc-i go" data-a="listP" data-v="${x.p.id}">매물로 등록</button></div>`).join('')}</div>`:''}
  </section>`; }
/* 전력 비교 */
function cmpView(){ const L=nextGames(1); const def=L.length?L[0].op:standOrder().order.find(o=>o.tid!==G.user).tid;
  const T=UI.cmpT!=null&&UI.cmpT!==G.user?UI.cmpT:def; const a=slotRanks(G.user), b=slotRanks(T);
  const chips=`<div class="chips cmpchips">${G.teams.filter(t=>t.id!==G.user).map(t=>`<button data-a="cmpT" data-v="${t.id}" class="${t.id===T?'on':''}">${badge(t.id,16)} ${tshort(t.id)}</button>`).join('')}</div>`;
  const side=(x,k)=>{ const ps=x.ps; const nm=ps.length?(k==='SP'||k==='RP'?`${esc(ps[0].name)} 외 ${ps.length-1}명`:esc(ps[0].name)):'빈자리'; const p=ps[0];
    return `<div class="cmp-s">${p?avImg(p):''}<span><b>${nm}</b><i>${x.rank}위</i></span>${rchip(Math.round(x.v))}</div>`; };
  let w=0,l=0; const rows=PSLOTS.map(k=>{ const d=a[k].v-b[k].v; const c=d>=2?'win':d<=-2?'lose':''; if(c==='win')w++; if(c==='lose')l++;
    return `<button class="cmp-r ${c}${UI.cmpK===k?' on':''}" data-a="cmpK" data-v="${k}">${side(a[k],k)}<span class="cmp-k">${SLOTS_S[k]}<i>${d>=2?'우위':d<=-2?'열세':'비슷'}</i></span>${side(b[k],k)}</button>`; }).join('');
  const hh=h2hOf(G.user,T);
  let help=''; if(UI.cmpK){ const k=UI.cmpK; const LL=tradeOpen()?tradeSuggest(false,k):[]; UI._tsugK=LL;
    help=`<section class="card"><div class="row between"><h2 class="sec">${SLOTK[k]} 보강 추천</h2><span class="small muted">우리 ${a[k].rank}위</span></div>${!tradeOpen()?'<p class="small muted">트레이드 기간이 아닙니다.</p>':LL.length?LL.map((x,i)=>dealCard(x,i,'k')).join(''):'<p class="small muted">이 자리를 바로 보강할 만한 조건이 보이지 않습니다.</p>'}</section>`; }
  return `<section class="card cmp"><div class="row between"><h2 class="sec">전력 비교</h2><span class="small muted">상대 전적 ${hh.w}승 ${hh.l}패${hh.t?` ${hh.t}무`:''}</span></div>${chips}
    <div class="cmp-hd"><span>${badge(G.user,22)} ${esc(tshort(G.user))} <b class="ok">우위 ${w}</b></span><span>${badge(T,22)} ${esc(tshort(T))} <b class="bad">우위 ${l}</b></span></div>
    <div class="cmp-rows">${rows}</div><p class="small muted">숫자는 자리별 전력(현재 능력 기준), 순위는 10개 구단 중 순위입니다. 자리를 누르면 그 자리 보강 트레이드를 찾습니다.</p></section>${help}`; }
