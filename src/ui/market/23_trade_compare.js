/* ---------- C: 트레이드 비교판 ---------- */
function tradeInsight(tid,give,get){
  if(!give.length&&!get.length)return '';
  const c=tradeCompare(tid,give,get); const keys=FIELDK.concat(['SP','RP']); const lab=k=>k==='SP'?'선발':k==='RP'?'불펜':POSS[k];
  const cell=(b,a)=>{ if(b==null&&a==null)return '<td class="muted">-</td>'; const A=a==null?null:dv(a), Bv=b==null?null:dv(b); const d=(A??0)-(Bv??0); return `<td class="${d>=3?'up':d<=-3?'dn':''}">${A??'-'}${d?`<i>${d>0?'+':''}${d}</i>`:''}</td>`; };
  const tbl=`<div class="tw"><table class="tcmp"><thead><tr><th></th>${keys.map(k=>`<th>${lab(k)}</th>`).join('')}</tr></thead><tbody>
    <tr><td>${badge(G.user,16)} 우리</td>${keys.map(k=>cell(c.my[0][k],c.my[1][k])).join('')}</tr>
    <tr><td>${badge(tid,16)} 상대</td>${keys.map(k=>cell(c.th[0][k],c.th[1][k])).join('')}</tr></tbody></table></div>`;
  const cash0=UI.trade&&UI.trade.tid===tid?(UI.trade.cash||0):0; const op=asstOpinion(tid,give,get,cash0,UI.trade&&UI.trade.tid===tid?UI.trade.pk:null);
  const mv=mgrTradeView(tid,give,get);
  const medH=get.map(id=>G.players[id]).filter(Boolean).map(p=>{ const r=medReport(p); return `<div class="medrow"><b>${esc(p.name)}</b> <span class="pill ${r.c}">${r.g}</span>${r.L.map(t=>`<div class="small">${esc(t)}</div>`).join('')}${r.note?`<div class="small muted">${r.note}</div>`:''}</div>`; }).join('');
  const lost=[...give,...get].map(id=>G.players[id]).filter(Boolean).map(p=>{ const t=termsLostTxt(p); return t?`${p.name}: ${t}`:''; }).filter(Boolean);
  return `<div class="tins">${lost.length?`<p class="small warn">이적하면 없어지는 계약 조건 — ${esc(lost.join(' / '))}. 남은 연봉·기간은 그대로 넘어갑니다.</p>`:''}${dealMoney(give,get,cash0)}${mv?`<p class="small">${esc(mv.txt)}</p>`:''}<div class="eyebrow">트레이드 후 예상 주전</div>${tbl}${(()=>{ const mine=rosterList(G.user); const after=mine.filter(p=>!give.includes(p.id)).concat(get.map(id=>G.players[id]).filter(Boolean)); const t=posSwapTxt(mine,after); return `<p class="small">${esc(t)}</p>`; })()}${(()=>{ const x=spSwap(tid,give,get); return x?`<p class="small">${esc(spSwapTxt(x))}</p>`:''; })()}${(()=>{ const mine=rosterList(G.user); const after=mine.filter(p=>!give.includes(p.id)).concat(get.map(id=>G.players[id]).filter(Boolean)); const D=posDepthList(after); return `<details class="small"><summary>트레이드 후 포지션별 가용 자원</summary><div class="tw"><table class="sqt"><tbody>${FIELDK.map(k=>`<tr><td>${POSS[k]}</td><td>${D[k].map(x=>`${esc(x.p.name)} <span class="muted">${dv(Math.round(x.v))}${x.p.pos!==k?'·이동':''}</span>`).join(', ')||'-'}</td></tr>`).join('')}</tbody></table></div></details>`; })()}
    ${medH?`<div class="medchk"><span class="eyebrow">받는 선수 메디컬 체크</span>${medH}</div>`:''}<div class="asst"><span class="eyebrow">부단장 의견</span>${op.map(t=>`<p class="small">${esc(t)}</p>`).join('')}</div>
    <p class="small muted">숫자는 포지션별 주전의 현재 능력(오버롤)입니다. 선발은 상위 5명 평균(5명이 안 되면 불펜에서 돌려 막는 값)입니다.</p></div>`;
}

/* 드래프트 센터(스카우트 1단계): 정답 같은 모의 지명 대신 '우리 차례에 남을 확률'과 소문. AI의 실제 지명 함수는 쓰지 않는다(65_draft_odds) */
function doChip(o){ if(!o)return ''; const v=o.av; return `<span class="do-chip ${v>=.7?'good':v>=.35?'':'warn'}" title="${esc(o.top?`가장 먼저 데려갈 듯한 구단: ${tshort(o.top.tid)} (${doPct(o.top.s)})`:'')}">남을 확률 ${doPct(v)}</span>`; }
function draftCenter(all,mine){ const O=draftOdds(G.user), live=G.draft&&!G.draft.done; const pk=O.pick;
  const L=all.slice(0,40).map(x=>Object.assign({o:O.P[x.p.id]},x)).filter(x=>x.o);
  const hi=L.filter(x=>x.o.av>=.7).slice(0,3), mid=L.filter(x=>x.o.av>=.3&&x.o.av<.7).slice(0,3), lo=L.filter(x=>x.o.av<.3).slice(0,3);
  const row=x=>`<div class="dc-r"><button class="dc-p" data-a="player" data-v="${x.p.id}">${avImg(x.p)}<span><b>${esc(x.p.name)}</b><i>${posLabel(x.p)} · ${x.p.college?'대졸':'고졸'} · 스카우트 #${x.rk} · 언론 #${x.p.press||'-'}</i><em>${x.o.top&&x.o.top.s>=.15?`${esc(tshort(x.o.top.tid))}이(가) 먼저 데려갈 수 있습니다(${doPct(x.o.top.s)})`:esc(x.rp.arch)}</em></span></button>${doChip(x.o)}${O.pick2?`<span class="small muted">2번째 차례 ${doPct(x.o.av2)}</span>`:'<span></span>'}${mine?`<button class="btn small primary" data-a="pick" data-v="${x.p.id}">지명</button>`:''}</div>`;
  const grp=[['우리 차례에도 남을 듯',hi],['반반',mid],['앞에서 데려갈 듯',lo]].filter(g=>g[1].length);
  const where=pk?`${pk.rd}라운드 ${pk.no}순위`:'우리 차례';
  const rec=`<div class="dc-rec"><div class="eyebrow">${esc(where)}까지 남을 확률</div>${grp.map(([t,G0])=>`<div class="small muted">${t}</div>${G0.map(row).join('')}`).join('')||'<p class="small muted">후보가 없습니다.</p>'}</div>`;
  const rum=(O.rum||[]).filter(r=>G.players[r.id]).slice(0,8);
  const rumH=`<div class="dc-mock"><div class="eyebrow">다른 구단 소문</div><ol>${rum.map(r=>{ const p=G.players[r.id]; return `<li>${badge(r.tid,16)}<span class="small">${esc(tshort(r.tid))}이(가) 노린다는 소문</span><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><i>${esc(doRelL(r.q))}</i></li>`; }).join('')||'<li class="small muted">들리는 소문이 없습니다.</li>'}</ol><p class="small muted">소문은 그 구단 연고 지역 정보망이 좋을수록, 그 지역 프로 담당 스카우트가 있을수록 잘 맞습니다. 매주 새로 돕니다. 확률은 우리 평가·언론 순위·공개 기록·각 구단 로스터 사정·소문으로 ${DO_N}번 모의한 값입니다. 다른 구단 속마음은 모릅니다.</p></div>`;
  const sl=all.filter(x=>amSlump(x.p)).slice(0,4).map(x=>({...x,o:O.P[x.p.id]}));
  const bet=sl.length?`<div class="dc-bet"><div class="eyebrow">3학년 부진 베팅</div>${sl.map(x=>{ const T=amTrend(x.p,!!x.p.isP).filter(t=>t.k); const a=T[T.length-2], b=T[T.length-1]; const f0=v=>x.p.isP?v.toFixed(2):fmt3(v); const h=amSlHint(x.p); const r=!x.o?'':x.o.av>=.6?`우리 ${pk?pk.rd+'R':''} 차례에도 남을 듯`:O.pick2&&x.o.av2>=.5?'2번째 차례까지 남을 수 있음':'앞에서 뽑힐 수 있음';
      return `<div class="dc-r"><button class="dc-p" data-a="player" data-v="${x.p.id}">${avImg(x.p)}<span><b>${esc(x.p.name)}</b><i>${posLabel(x.p)} · ${esc(x.p.school||'')} · 언론 #${x.p.press||'-'}</i><em>${a&&b?`${x.p.isP?'ERA':'OPS'} ${f0(a.k.v)} → ${f0(b.k.v)}`:'졸업 학년 부진'} · ${h?`스카우트 귀띔: ${esc(h)}`:'귀띔 없음(관찰 5회 이상이면 이유를 듣습니다)'}</em></span></button><span class="small">${esc(r)}</span><span></span></div>`; }).join('')}</div>`:'';
  const rn=rosterN(G.user); const nw=Object.values(G.players).filter(p=>p.team===G.user&&p.joinY>G.year&&!p.ys).length; const tot=rn+nw;
  const rl=`<p class="small ${tot>ROSTER_MAX?'bad':'muted'}" style="margin:8px 0 0">지금 로스터 ${rn}명 + 내년 입단 ${nw}명 = ${tot}명 (상한 ${ROSTER_MAX}명).${tot>ROSTER_MAX?` 개막 전까지 ${tot-ROSTER_MAX}명을 줄여야 합니다. 계약 만료·방출로 정리하세요.`:''}</p>`;
  const lost=(live&&G.draft.lost||[]).slice(-3).reverse(); const left=live?(G.shortlist||[]).filter(id=>G.players[id]&&G.players[id].prospect).length:0;
  const ll=lost.length?`<div class="note warn">${lost.map(x=>`관심 선수 <b>${esc(x.nm)}</b>을(를) ${esc(tshort(x.tid))}이(가) ${x.rd}-${x.no}에 지명`).join('<br>')}${live?` · 관심 목록 남은 선수 ${left}명`:''}</div>`:'';
  const cal=G.dOddsC&&!live?`<p class="small muted">지난 드래프트 예상 점검: 확률을 매긴 ${G.dOddsC.n}명 · 브라이어 점수 ${G.dOddsC.brier} (0에 가까울수록 잘 맞음)</p>`:'';
  return `<section class="card dcenter">${ll}<div class="dc-g">${rec}${rumH}</div>${bet}${rl}${cal}</section>`;
}
/* 선수 카드: 스태프 의견과 빠른 행동 */
function staffCardP(p){ const L=staffNotes(p); if(!L.length)return '';
  return `<div class="stn">${L.map(x=>`<div><span>${esc(x.w)}</span><p>${esc(x.t)}</p></div>`).join('')}</div>`; }
/* 선수 화면 위 행동(UI 2단계 2-2): 상황별 대표 동작 1개(파란 버튼)와 나머지 동작. 기본은 모두 버튼으로 보이고, 설정에서 '간단히'를 고르면 나머지는 ⋯ 메뉴로.
   우리 선수: 계약이 곧 끝나면 연장 협상, 6주 이상 다친 외국인은 대체 외국인 고르기, 그 밖에는 면담. 다른 구단 선수: 트레이드 협상 */
function extSoon(p){ if(!canExtend(p))return false; if(p.extCounter&&p.extCounter.until>=G.day)return true; return p.faC?(p.yrs||0)<=1:faLeft(p)<=1; }
function quickActs(p){
  const d=G.draft;
  if(p.prospect){ const b=[]; if(d&&!d.done&&d.picks[d.cur].tid===G.user)b.push(`<button class="btn small primary" data-a="pick" data-v="${p.id}">지명</button>`); b.push(`<button class="btn small" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 해제':'☆ 관심'}</button>`); return `<div class="qacts">${b.join('')}</div>`; }
  let main=null; const M=[];
  if(p.team===G.user&&!(p.joinY>G.year)){
    const talk={a:'jump',v:'bond',l:'면담'}, ext=canExtend(p)?{a:'jump',v:'ext',l:'연장 협상'}:null;
    const tmp=p.foreign==='용병'&&typeof fTmpErr==='function'&&!fTmpErr(G.user,p)?{a:'fTmpStart',v:p.id,l:'부상 대체 외국인 고르기'}:null; /* 6주 이상 다친 외국인 화면에서 바로(카페 피드백 11-08) */
    main=tmp||(ext&&extSoon(p)?ext:talk);
    M.push(talk);
    if(!p.foreign&&tradeOpen())M.push({a:'findMine',v:p.id,l:'시장 가치'},{a:'toTradeGive',v:p.id,l:'트레이드 협상'});
    if(!p.foreign)M.push(p.listed?{a:'blkOff',v:p.id,l:'매물 목록에서 빼기'}:{a:'blkOn',v:p.id,l:'매물 목록에 올리기'});
    if(!p.foreign)M.push({a:'noTrade',v:p.id,l:p.noTrade?'트레이드 불가 해제':'트레이드 불가로 지정',on:!!p.noTrade,title:'다른 구단이 이 선수를 트레이드로 달라고 묻지 않습니다(우리가 먼저 제안할 수는 있음)'});
    if(!p.foreign)M.push(pcLive(p)?{a:'pcStop',v:p.id,l:'플레잉코치 해제'}:p.age>=PC_AGE&&pcOffWin()?{a:'pcOffer',v:p.id,l:'플레잉코치 제안'}:null); /* 99c_playing_coach */
    M.push(ext,tmp);
  } else if(p.team!=null&&p.team!==G.user&&!p.foreign&&!(p.joinY>G.year)){
    if(tradeOpen()){ main={a:'toTrade',v:p.id,l:'트레이드 협상'}; M.push({a:'findT',v:p.id,l:'얻을 조건 보기'}); }
    const on=(G.pwatch||[]).includes(p.id); M.push({a:'pwatch',v:p.id,l:on?'관심 해제':'관심 선수',on});
  }
  const all=actModeAll(), html=actionBar(main,M.filter(x=>x&&x!==main),{label:'더보기',all}); /* 설정 › 선수 화면 버튼: 모두 보이기(기본)·간단히 */
  return html?`<div class="qacts${all?' qacts-all':''}">${html}</div>`:''; }

/* ---------- 아마추어 기록: 학년별 ---------- */
function amYearTable(p){ const Y=p.amY; if(!Y||!Y.length)return `<p class="small">${esc(amLine(p))}</p>`;
  const sch=p.college?'대':'고'; const rows=Y.concat([Object.assign({gr:'합계',tot:true},p.am)]);
  if(p.isP)return `<div class="tw"><table class="amy"><thead><tr><th>학년</th><th>경기</th><th>이닝</th><th class="key">ERA</th><th>탈삼진</th><th>볼넷</th><th class="key">K/9</th><th class="key">BB/9</th><th>K/BB</th></tr></thead><tbody>${rows.map(x=>`<tr class="${x.tot?'tot':''}"><td>${x.tot?'합계':(x.y?x.y+' ':'')+sch+x.gr+(x.inj?' (부상)':'')}</td><td>${x.g}</td><td>${ipStr(x.outs)}</td><td>${x.outs?((x.er||0)*27/x.outs).toFixed(2):'-'}</td><td>${x.so}</td><td>${x.bb}</td><td>${x.outs?(x.so*27/x.outs).toFixed(1):'-'}</td><td>${x.outs?(x.bb*27/x.outs).toFixed(1):'-'}</td><td>${x.bb?(x.so/x.bb).toFixed(2):'-'}</td></tr>`).join('')}</tbody></table></div>`;
  return `<div class="tw"><table class="amy"><thead><tr><th>학년</th><th>경기</th><th>타석</th><th>타율</th><th class="key">OPS</th><th>홈런</th><th>볼넷</th><th>삼진</th><th class="key">볼삼비</th><th>도루</th></tr></thead><tbody>${rows.map(x=>{ const r=bRate(x); return `<tr class="${x.tot?'tot':''}"><td>${x.tot?'합계':(x.y?x.y+' ':'')+sch+x.gr+(x.inj?' (부상)':'')}</td><td>${x.g}</td><td>${x.pa}</td><td>${fmt3(r.avg)}</td><td>${fmt3(r.ops)}</td><td>${x.hr}</td><td>${x.bb}</td><td>${x.so}</td><td>${x.so?(x.bb/x.so).toFixed(2):'-'}</td><td>${x.sb}</td></tr>`; }).join('')}</tbody></table></div>`; }
function amLine(p){ const h=p.am; if(!h)return '기록 없음';
  if(p.isP){ const r=pRate(h); return `ERA ${h.outs?r.era.toFixed(2):'-'} · ${ipStr(h.outs)}이닝 · K/9 ${h.outs?(h.so*27/h.outs).toFixed(1):'-'} · BB/9 ${h.outs?(h.bb*27/h.outs).toFixed(1):'-'} · 최고 ${amVmax(p)}km/h`; }
  const r=bRate(h); return `타율 ${fmt3(r.avg)} · OPS ${fmt3(r.ops)} · 홈런 ${h.hr} · 볼삼비 ${h.so?(h.bb/h.so).toFixed(2):'-'} · 1루 ${p.amRun||runOf(p)}초`; }

/* ---------- 선수 이야기 ---------- */
const STK={draft:'지명',debut:'데뷔',first:'첫 기록',mile:'기록',high:'커리어 하이',award:'수상',move:'이적·계약',inj:'부상',mil:'병역'};
const STC={draft:'acc',debut:'good',first:'good',mile:'warn',high:'warn',award:'warn',move:'',inj:'bad',mil:''};
function careerStory(p){
  const ev=(p.story||[]).slice(); const one=[...new Set(p.hist.filter(h=>h.lvl==='1군').map(h=>h.y))].sort((a,b)=>a-b);
  const fut=[...new Set(p.hist.filter(h=>h.lvl==='퓨처스'&&!h.y2).map(h=>h.y))];
  if(!ev.length&&!one.length&&!p.draft&&!fut.length)return '';
  const wars=one.map(y=>wOf(seasonTotal(p,y,'1군'),p)); const best=wars.length>1?one[wars.indexOf(Math.max(...wars))]:null;
  const years=[...new Set(ev.map(e=>e.y).concat(one).concat(fut).concat(p.draft&&!ev.some(e=>e.k==='draft')?[p.draft.y]:[]))].sort((a,b)=>b-a);
  const row=y=>{ const h=seasonTotal(p,y,'1군'), f=seasonTotal(p,y,'퓨처스'); const es=ev.filter(e=>e.y===y).sort((a,b)=>b.d-a.d);
    if(p.draft&&p.draft.y===y&&!es.some(e=>e.k==='draft'))es.push({t:`${y} 신인 드래프트 ${p.draft.rd}라운드 ${p.draft.no}순위`,k:'draft'});
    const line=h?`${tshort(h.t)} · ${statLine(h,p)}`:f?`2군 · ${statLine(f,p)}`:'';
    const aw=(p.aw||[]).filter(a=>a.startsWith(String(y)));
    return `<li class="${y===best?'best':''}"><div class="sy"><b>${y}</b>${p.age!=null?`<i>${p.age-(G.year-y)}세</i>`:''}</div><div class="sb">${line?`<p class="sl">${esc(line)}${y===best?' <span class="pill warn">최고 시즌</span>':''}${aw.map(a=>` <span class="pill warn">${esc(a.replace(String(y)+' ',''))}</span>`).join('')}</p>`:''}${es.filter(e=>e.k!=='award').map(e=>`<p class="se"><span class="pill ${STC[e.k]||''}">${STK[e.k]||'소식'}</span> ${lk(e.t)}</p>`).join('')}</div></li>`; };
  const c=careerOf(p);
  const head=one.length?`<p class="small muted">1군 ${one.length}시즌 · ${p.isP?`${c.w}승 ${c.sv}세이브 · 탈삼진 ${c.so}`:`${c.h}안타 · ${c.hr}홈런`} · 통산 WAR ${c.war.toFixed(1)}${p.school?` · ${esc(p.school)} 출신`:''}</p>`:p.school?`<p class="small muted">${esc(p.school)} 출신</p>`:'';
  return `<section class="card"><div class="row between"><span class="eyebrow">커리어 이야기</span><span class="small muted">최근 시즌부터</span></div>${head}<ol class="story">${years.map(row).join('')}</ol></section>`; }

/* ---------- 상황판: 리그 판도 · 우리 구단 진단 · 구단별 전력 ---------- */
let _psC={k:null};
function allStrength(){ const k=G.day+':'+G.games.length+':'+G.year; if(_psC.k===k&&_psC.g===G)return _psC.v; const v={}; for(const t of G.teams)v[t.id]=posStrength(rosterList(t.id)); _psC={k,v,g:G}; return v; }
function pct(v){ return v==null?'-':v>=.995?'99%+':v<=.005&&v>0?'1% 미만':v===0?'0%':Math.round(v*100)+'%'; }
function raceCard(){
  const per=period(); const {order,live,y}=standOrder(); const odds=playoffOdds(); const top=order[0];
  if(!live||!odds)return csec(live&&per==='season'?`${G.year} 현재 순위`:`${y} 정규시즌 최종 순위`,`<div class="tw">${standingsTable(order)}</div>${live&&per==='season'?'<p class="small muted">가을야구 확률은 팀당 20경기를 치른 뒤부터 계산합니다.</p>':''}`);
  const om=new Map(odds.map(o=>[o.tid,o]));
  const zone=o=>{ const x=om.get(o.tid); return x.first>=.15?'선두 경쟁':x.ps>=.08?'가을야구 경쟁':'하위권'; };
  const groups=['선두 경쟁','가을야구 경쟁','하위권'].map(z=>[z,order.filter(o=>zone(o)===z)]).filter(g=>g[1].length);
  const left=144-(G.sea.rec[G.user].w+G.sea.rec[G.user].l+(G.sea.rec[G.user].t||0));
  return `<section class="card"><div class="row between"><h2 class="sec">리그 판도</h2><span class="small muted">남은 경기 ${left} · 남은 일정을 400번 모의 진행</span></div>
    ${groups.map(([z,arr])=>`<div class="zone"><div class="eyebrow">${z}</div>${arr.map(o=>{ const x=om.get(o.tid); const i=order.indexOf(o); return `<button class="race${o.tid===G.user?' me':''}" data-a="lteamGo" data-v="${o.tid}"><span class="rk">${i+1}</span>${badge(o.tid,20)}<b>${tshort(o.tid)}</b><span class="num rcd">${wlStr(o)}</span><span class="num gb">${i?gbStr(gbOf(top,o)):'-'}</span><span class="bar"><i style="width:${Math.max(2,x.ps*100)}%"></i></span><span class="num ppc">${pct(x.ps)}</span>${strkPill(o.tid)}</button>`; }).join('')}</div>`).join('')}
    <p class="small muted">막대는 가을야구(5위 안) 진출 확률입니다. ${hiI('지금 성적과 개막 전 전력 평가를 섞은 팀 전력으로 남은 경기를 모의 진행한 결과입니다. 실제 결과와 다를 수 있습니다.')}</p></section>`; }
function powerMap(){
  const S=allStrength(); const keys=FIELDK.concat(['SP','RP']); const lab=k=>k==='SP'?'선발':k==='RP'?'불펜':POSS[k];
  const {order,live}=standOrder(); const odds=playoffOdds(); const om=new Map((odds||[]).map(o=>[o.tid,o]));
  const cell=v=>v==null?'<td class="hm q">?</td>':`<td class="hm" style="--c:${rcol(v)}">${dv(v)}</td>`;
  const sell=t=>{ const o=om.get(t.id); if(!live||!o)return t.mode==='contend'?'우승 도전':'리빌딩'; return o.ps>=.6?'영입 쪽(우승 도전)':o.ps<=.1?'판매 쪽(정리)':'관망'; };
  return `<section class="card"><div class="row between"><h2 class="sec">구단별 전력 지도</h2><span class="small muted">포지션별 주전 평가 · 구단 이름을 누르면 선수단</span></div>
    <div class="tw"><table class="pmap"><thead><tr><th class="stk">구단</th>${live?'<th>순위</th><th>가을야구</th>':''}${keys.map(k=>`<th>${lab(k)}</th>`).join('')}<th>트레이드 성향</th><th>담당 스카우트</th></tr></thead><tbody>
    ${order.map((o,i)=>{ const t=team(o.tid); const cv=coverOf(o.tid); const x=om.get(o.tid); return `<tr class="${o.tid===G.user?'me':''}"><td class="stk"><button class="lnk tname" data-a="lteamGo" data-v="${o.tid}">${badge(o.tid,16)}${tshort(o.tid)}</button></td>${live?`<td>${i+1}</td><td>${x?pct(x.ps):'-'}</td>`:''}${keys.map(k=>cell(S[o.tid][k])).join('')}<td class="tx">${o.tid===G.user?'-':sell(t)}</td><td class="tx">${o.tid===G.user?'-':cv.sc?esc(cv.sc.name):'<span class="muted">없음</span>'}</td></tr>`; }).join('')}
    </tbody></table></div>
    <p class="small muted">색이 진할수록 강합니다. 담당 스카우트가 있는 지역 구단은 선수 잠재력까지 보입니다. 트레이드 성향은 가을야구 확률로 짐작한 것입니다.</p></section>`; }

/* ---------- 소식함 서랍: 옆에서 열고 바로 다음 메일 ---------- */
/* ---------- 도움말 문장 접기 ---------- */
function toast(t){ let el=document.getElementById('toast'); if(!el){ el=document.createElement('div'); el.id='toast'; el.setAttribute('role','status'); document.body.appendChild(el); } el.textContent=t; try{ josaFix(el); }catch(e){} el.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('on'),2400); }
/* 설명 문단은 기본으로 보인다. 익숙해지면 ? 버튼으로 숨긴다 */
function helpOn(){ try{ return localStorage.getItem('danjang-help')==='1'; }catch(e){ return false; } } /* 기본은 설명을 접고 ⓘ로 */
/* 설명 문단은 화면에서 접고 ⓘ로 바꾼다: 같은 카드의 제목 옆에 ⓘ 하나, 누르면 말풍선. '?' 버튼을 켜면 예전처럼 펼쳐 보인다 */
function markHints(root){ if(!root)return; root.querySelectorAll('p.small.muted, p.muted.small, .row.between > span.small.muted, .row.between > div > span.small.muted, p.small.expl, p.tipme, details.frule, p.small:not(.muted):not(.expl):not(.tipme)').forEach(el=>{ if(el.tagName==='DETAILS'){ if(el.dataset.hk||el.closest('.mailbody,.sheet.ngt,.sheet.meet')||el.querySelector('button,input,select,a,table'))return; } if(el.tagName==='SPAN'&&((el.textContent||'').trim().length<40||el.closest('.item,.mrow,.ibr,.fdt,table')))return; if(el.dataset.hk)return; if(el.closest('.mailbody,.news,.dl-empty,.td,.quote,.fdtip-none'))return; const t=(el.textContent||'').trim(); if(el.classList.contains('keep')&&!el.classList.contains('tipme'))return; /* 짧은 빈 상태·막힌 이유와 기한·되돌릴 수 없는 일의 경고는 그대로 보인다. 긴 설명문은 '없습니다'가 섞여 있어도 접는다(사용자 11-13) */ if(!el.classList.contains('tipme')&&(/기한|마감|되돌릴 수 없|취소할 수 없|복구할 수 없|지금은[^.]{0,40}(수 없|없습니다)/.test(t)||(/없습니다|수 없|아닙니다|만 시작/.test(t)&&t.length<=70)))return; if(t.length<24)return; if(el.matches('p.small:not(.muted):not(.expl):not(.tipme)')&&(el.querySelector('b,button,input,select,a,table,svg,i')||!/(니다|세요|입니다|됩니다)[.)]?$/.test(t)))return;
    el.dataset.hk='1'; el.classList.add('hint'); const box=el.closest('section,.card,.fdl-main,.sheet')||el.parentElement; let h=box&&[...box.querySelectorAll('h2.sec,h2,h3,.eyebrow')].find(x=>!x.closest('table')&&(x.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING));
    if(h){ let ic=h.querySelector(':scope > .hi-i'); if(!ic){ ic=document.createElement('button'); ic.type='button'; ic.className='hi-i'; ic.textContent='i'; ic.setAttribute('aria-label','설명 보기'); ic.dataset.tip=''; h.appendChild(ic); } { const nz=s=>s.replace(/[\d.,]+/g,'#'), had=(ic.dataset.tip||'').split('\n\n').map(nz); if(!had.includes(nz(t)))ic.dataset.tip=(ic.dataset.tip?ic.dataset.tip+'\n\n':'')+t; } } /* 후보 카드마다 같은 문단(숫자만 다른)이 겹쳐 쌓이지 않게(플레이테스트 4 #21) */
    else { const ic=document.createElement('button'); ic.type='button'; ic.className='hi-i solo'; ic.textContent='i'; ic.setAttribute('aria-label','설명 보기'); ic.dataset.tip=t; el.parentNode.insertBefore(ic,el); } });
  /* 설명만 있던 카드가 비어 보이지 않게: 제목 말고 남는 내용이 없으면 설명을 그대로 펼친다 */
  root.querySelectorAll('section.card').forEach(sec=>{ const H=[...sec.querySelectorAll('.hint')].filter(h=>h.closest('section.card')===sec); if(!H.length)return;
    const rest=[...sec.children].filter(c=>!c.matches('h2,h3,.eyebrow,.hint,.hi-i')&&!(c.matches('.row.between')&&!c.querySelector('button:not(.hi-i),input,select,b,.pill,.num')));
    if(rest.length)return; H.forEach(h=>h.classList.remove('hint')); sec.querySelectorAll('.hi-i').forEach(i=>{ if(i.closest('section.card')===sec)i.remove(); }); });
  mergeHints(root); }
/* 도움말 ⓘ 줄이기(UI 검수 2026-11-15 1-4): 한 구역(가장 바깥 카드, 설정은 묶음 칸) 안에 ⓘ가 여러 개면 맨 위 하나로 합친다.
   지운 ⓘ의 설명은 남는 ⓘ 말풍선에 차례로 붙여 내용은 그대로 둔다. 표 머리글 안의 ⓘ는 그 열 설명이라 그대로 둔다 */
function hintGroup(el,root){ const g=el.closest('[data-hgrp],.setc'); if(g&&root.contains(g))return g; let c=el.closest('section.card,.card'), up=c; while(up&&up!==root){ up=up.parentElement&&up.parentElement.closest('section.card,.card'); if(up&&root.contains(up)&&up!==root&&!up.matches('.sheet'))c=up; else break; } return c&&root.contains(c)?c:null; }
function mergeHints(root){ if(!root)return; const G2=new Map(); root.querySelectorAll('.hi-i').forEach(i=>{ if(i.closest('table,.mailbody'))return; const g=hintGroup(i,root); if(!g)return; if(!G2.has(g))G2.set(g,[]); G2.get(g).push(i); });
  G2.forEach((L,g)=>{ if(L.length<2)return; const keep=L[0], nz=s=>s.replace(/[\d.,]+/g,'#'); let tips=(keep.dataset.tip||keep.getAttribute('title')||'').split('\n\n').filter(Boolean);
    L.slice(1).forEach(i=>{ (i.dataset.tip||i.getAttribute('title')||'').split('\n\n').filter(Boolean).forEach(t=>{ if(!tips.map(nz).includes(nz(t)))tips.push(t); }); i.remove(); });
    keep.dataset.tip=tips.join('\n\n'); keep.removeAttribute('title'); const gh=g.querySelector(':scope>.set-g'); if(gh){ keep.classList.remove('solo'); gh.appendChild(keep); } /* 설정 묶음은 묶음 제목(진행·저장·구단·기록) 옆에 */ keep.setAttribute('aria-label','이 구역 설명 보기'); }); }
/* 말풍선: ⓘ(.hi-i)와 표 머리글 ⓘ(.ti)를 누르면 근처에 뜨고, 다른 곳을 누르면 닫힌다 */
function tipShow(el){ let b=document.getElementById('tipb'); if(!b){ b=document.createElement('div'); b.id='tipb'; b.setAttribute('role','tooltip'); document.body.appendChild(b); }
  if(b._for===el&&b.classList.contains('on')){ tipHide(); return; } b._for=el; b._y=scrollY; b.textContent=el.dataset.tip||el.getAttribute('title')||''; b.classList.add('on');
  const z=uiZ(); const r=el.getBoundingClientRect(); const W=Math.min(320,innerWidth/z-24); b.style.maxWidth=W+'px'; const bw=Math.min(W,b.offsetWidth)*z,bh=b.offsetHeight*z; let x=r.left+r.width/2-bw/2; x=Math.max(12,Math.min(innerWidth-bw-12,x)); const below=r.bottom+bh+16<innerHeight; /* 화면 좌표는 확대 배율로 나눠 스타일 px로 */
  b.style.left=(x+scrollX)/z+'px'; b.style.top=((below?r.bottom+8:r.top-bh-8)+scrollY)/z+'px'; b.classList.toggle('up',!below); b.style.setProperty('--ax',(r.left+r.width/2-x)/z+'px'); }
function tipHide(){ const b=document.getElementById('tipb'); if(b){ b.classList.remove('on'); b._for=null; } }
if(typeof document!=='undefined'){ document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('.hi-i,.fdt .ti,.ptier[data-tip],.gl[data-tip],.trtag[data-tip]'); if(t){ e.preventDefault(); e.stopPropagation(); tipShow(t); return; } if(!(e.target.closest&&e.target.closest('#tipb')))tipHide(); },true); addEventListener('scroll',()=>{ const b=document.getElementById('tipb'); if(b&&b.classList.contains('on')&&Math.abs(scrollY-(b._y||0))>40)tipHide(); },{passive:true}); }

/* ---------- 화면 안 탭 ---------- */
function inTabs(key,tabs,def){ const cur=(UI.it||{})[key]||def||tabs[0][0]; const ok=tabs.some(t=>t[0]===cur)?cur:tabs[0][0];
  const wrapT=tabs.length>=5||tabs.reduce((a,t)=>a+String(t[1]).replace(/<[^>]*>/g,'').length,0)>20;
  const nc=tabs.length<=4?tabs.length:tabs.length===6?3:tabs.length===5?3:4; /* 휴대폰: 남는 탭 하나가 다음 줄에 홀로 떨어지지 않게 열 수를 맞춘다 */
  return {cur:ok,bar:`<div class="seg itabs${wrapT?' wrapt':''}" style="--nc:${nc}">${tabs.map(([k,l])=>`<button data-a="itab" data-v="${key}:${k}" class="${ok===k?'on':''}">${l}</button>`).join('')}</div>`}; }

/* 긴 목록은 쪽으로 나눈다: 스크롤 대신 넘기기 */
function pager(key,arr,per){ UI.pg=UI.pg||{}; const n=Math.max(1,Math.ceil(arr.length/per)); let i=Math.min(UI.pg[key]||0,n-1); if(i<0)i=0;
  const items=arr.slice(i*per,i*per+per); const bar=n<=1?'':`<div class="pgr"><button class="btn small" data-a="pgGo" data-v="${key}:${i-1}" ${i<=0?'disabled':''} aria-label="이전">‹ 이전</button><span class="num">${i+1} / ${n}</span><button class="btn small" data-a="pgGo" data-v="${key}:${i+1}" ${i>=n-1?'disabled':''} aria-label="다음">다음 ›</button></div>`;
  return {items,bar,i,n}; }

function cardPageSize(){const cols=innerWidth>=1100?3:innerWidth>=700?2:1;return cols*(innerHeight>=850&&innerWidth>=700?2:1);}
