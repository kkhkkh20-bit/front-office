/* ---------- C: 트레이드 비교판 ---------- */
function tradeInsight(tid,give,get){
  if(!give.length&&!get.length)return '';
  const c=tradeCompare(tid,give,get); const keys=FIELDK.concat(['SP','RP']); const lab=k=>k==='SP'?'선발':k==='RP'?'불펜':POSS[k];
  const cell=(b,a)=>{ if(b==null&&a==null)return '<td class="muted">-</td>'; const A=a==null?null:dv(a), Bv=b==null?null:dv(b); const d=(A??0)-(Bv??0); return `<td class="${d>=3?'up':d<=-3?'dn':''}">${A??'-'}${d?`<i>${d>0?'+':''}${d}</i>`:''}</td>`; };
  const tbl=`<div class="tw"><table class="tcmp"><thead><tr><th></th>${keys.map(k=>`<th>${lab(k)}</th>`).join('')}</tr></thead><tbody>
    <tr><td>${badge(G.user,16)} 우리</td>${keys.map(k=>cell(c.my[0][k],c.my[1][k])).join('')}</tr>
    <tr><td>${badge(tid,16)} 상대</td>${keys.map(k=>cell(c.th[0][k],c.th[1][k])).join('')}</tr></tbody></table></div>`;
  const op=asstOpinion(tid,give,get); const hint=tradeHint(tid,give,get);
  const hintH=hint?(hint.txt?`<p class="small muted">${esc(hint.txt)}</p>`:`<div class="thint">${hint.big?'<span class="small">차이가 커서 한두 명으로는 어려워 보입니다.</span>':''}${hint.add?`<span class="small">상대는 <b>${esc(hint.add.name)}</b>(${posLabel(hint.add)})을(를) 더 얹으면 받아들일 것 같습니다.</span><button class="btn small" data-a="tpick" data-v="give:${hint.add.id}">얹기</button>`:''}${hint.drop?`<span class="small">또는 받을 선수에서 <b>${esc(hint.drop.name)}</b>을(를) 빼면 될 것 같습니다.</span><button class="btn small" data-a="tpick" data-v="get:${hint.drop.id}">빼기</button>`:''}${!hint.add&&!hint.drop&&!hint.big?'<span class="small muted">맞춰 줄 만한 선수가 보이지 않습니다.</span>':''}</div>`):'';
  const mv=mgrTradeView(tid,give,get);
  return `<div class="tins">${dealMoney(give,get)}${mv?`<p class="small">${esc(mv.txt)}</p>`:''}<div class="eyebrow">포지션별 주전 평가 (트레이드 후, 괄호 숫자는 변화)</div>${tbl}
    <div class="asst"><span class="eyebrow">부단장 의견</span>${op.map(t=>`<p class="small">${esc(t)}</p>`).join('')}</div>${hintH}
    <p class="small muted">숫자는 포지션별 주전의 현재 능력(오버롤)입니다.</p></div>`;
}

/* 드래프트 센터: 스카우트 추천과 모의 지명 */
function draftCenter(all,mine){
  const top=all.slice(0,3);
  const rec=`<div class="dc-rec"><div class="eyebrow">스카우트 추천 3명</div>${top.map(x=>`<div class="dc-r"><button class="dc-p" data-a="player" data-v="${x.p.id}">${avImg(x.p)}<span><b>${esc(x.p.name)}</b><i>${posLabel(x.p)} · ${x.p.age}세 · ${x.p.college?'대졸':'고졸'} · ${esc(x.p.region)}</i><em>${esc(x.rp.arch)}${x.rp.role?` · 장래 ${esc(x.rp.role)}`:''}</em></span></button><span class="dc-st small">${esc(amShort(x.p))}</span><span></span>${mine?`<button class="btn small primary" data-a="pick" data-v="${x.p.id}">지명</button>`:''}</div>`).join('')}</div>`;
  const mk=mockDraft(12); const live=G.draft&&!G.draft.done;
  const mock=mk.length?`<div class="dc-mock"><div class="eyebrow">${live?'우리 다음 순번까지 예상 지명':'1라운드 모의 드래프트'}</div><ol>${mk.map(m=>{ const p=G.players[m.id]; return `<li class="${m.mine?'me':''}"><span class="num">${m.pk.rd}-${m.pk.no}</span>${badge(m.pk.tid,16)}<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><i>${posLabel(p)}</i></li>`; }).join('')}</ol><p class="small muted">우리 스카우트가 본 평가와 각 구단 성향으로 짐작한 예상입니다. 실제 지명과 다를 수 있습니다.</p></div>`:'';
  const rn=rosterN(G.user); const nw=Object.values(G.players).filter(p=>p.team===G.user&&p.joinY>G.year&&!p.ys).length; const tot=rn+nw;
  const rl=`<p class="small ${tot>ROSTER_MAX?'bad':'muted'}" style="margin:8px 0 0">지금 로스터 ${rn}명 + 내년 입단 ${nw}명 = ${tot}명 (상한 ${ROSTER_MAX}명).${tot>ROSTER_MAX?` 개막 전까지 ${tot-ROSTER_MAX}명을 줄여야 합니다. 계약 만료·방출로 정리하세요.`:''}</p>`;
  const lost=(live&&G.draft.lost||[]).slice(-3).reverse(); const left=live?(G.shortlist||[]).filter(id=>G.players[id]&&G.players[id].prospect).length:0;
  const ll=lost.length?`<div class="note warn">${lost.map(x=>`관심 선수 <b>${esc(x.nm)}</b>을(를) ${esc(tshort(x.tid))}이(가) ${x.rd}-${x.no}에 지명`).join('<br>')}${live?` · 관심 목록 남은 선수 ${left}명`:''}</div>`:'';
  return `<section class="card dcenter">${ll}<div class="dc-g">${rec}${mock}</div>${rl}</section>`;
}

/* 선수 카드: 스태프 의견과 빠른 행동 */
function staffCardP(p){ const L=staffNotes(p); if(!L.length)return '';
  return `<div class="stn">${L.map(x=>`<div><span>${esc(x.w)}</span><p>${esc(x.t)}</p></div>`).join('')}</div>`; }
function quickActs(p){
  const b=[]; const d=G.draft;
  if(p.prospect){ if(d&&!d.done&&d.picks[d.cur].tid===G.user)b.push(`<button class="btn small primary" data-a="pick" data-v="${p.id}">지명</button>`); b.push(`<button class="btn small" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 해제':'☆ 관심'}</button>`); }
  else if(p.team===G.user&&!(p.joinY>G.year)){
    b.push(`<button class="btn small" data-a="jump" data-v="bond">면담</button>`);
    if(!p.foreign&&tradeOpen()){ b.push(`<button class="btn small" data-a="findMine" data-v="${p.id}">시장 가치</button>`); b.push(`<button class="btn small" data-a="toTradeGive" data-v="${p.id}">트레이드에 내놓기</button>`); }
    if(!p.foreign)b.push(p.listed?`<button class="btn small" data-a="blkOff" data-v="${p.id}">매물 해제</button>`:`<button class="btn small" data-a="blkOn" data-v="${p.id}">매물로 등록</button>`);
    if(entryOn()&&!p.ys)b.push(`<button class="btn small" data-a="${p.e1?'reqDown':'reqUp'}" data-v="${p.id}">${p.e1?'말소 요청':'1군 요청'}</button>`);
    if(canExtend(p))b.push(`<button class="btn small" data-a="jump" data-v="ext">연장 협상</button>`);
  } else if(p.team!=null&&p.team!==G.user&&!p.foreign&&!(p.joinY>G.year)){ if(tradeOpen()){ b.push(`<button class="btn small primary" data-a="findT" data-v="${p.id}">얻을 조건 보기</button>`); b.push(`<button class="btn small" data-a="toTrade" data-v="${p.id}">데려오기 협상</button>`); } b.push(`<button class="btn small" data-a="pwatch" data-v="${p.id}">${(G.pwatch||[]).includes(p.id)?'관심 해제':'관심 선수'}</button>`); }
  return b.length?`<div class="qacts">${b.join('')}</div>`:''; }

/* ---------- 아마추어 기록: 학년별 ---------- */
function amYearTable(p){ const Y=p.amY; if(!Y||!Y.length)return `<p class="small">${esc(amLine(p))}</p>`;
  const sch=p.college?'대':'고'; const rows=Y.concat([Object.assign({gr:'합계',tot:true},p.am)]);
  if(p.isP)return `<div class="tw"><table class="amy"><thead><tr><th>학년</th><th>경기</th><th>이닝</th><th class="key">ERA</th><th>탈삼진</th><th>볼넷</th><th class="key">K/9</th><th class="key">BB/9</th><th>K/BB</th></tr></thead><tbody>${rows.map(x=>`<tr class="${x.tot?'tot':''}"><td>${x.tot?'합계':sch+x.gr}</td><td>${x.g}</td><td>${ipStr(x.outs)}</td><td>${x.outs?((x.er||0)*27/x.outs).toFixed(2):'-'}</td><td>${x.so}</td><td>${x.bb}</td><td>${x.outs?(x.so*27/x.outs).toFixed(1):'-'}</td><td>${x.outs?(x.bb*27/x.outs).toFixed(1):'-'}</td><td>${x.bb?(x.so/x.bb).toFixed(2):'-'}</td></tr>`).join('')}</tbody></table></div>`;
  return `<div class="tw"><table class="amy"><thead><tr><th>학년</th><th>경기</th><th>타석</th><th>타율</th><th class="key">OPS</th><th>홈런</th><th>볼넷</th><th>삼진</th><th class="key">볼삼비</th><th>도루</th></tr></thead><tbody>${rows.map(x=>{ const r=bRate(x); return `<tr class="${x.tot?'tot':''}"><td>${x.tot?'합계':sch+x.gr}</td><td>${x.g}</td><td>${x.pa}</td><td>${fmt3(r.avg)}</td><td>${fmt3(r.ops)}</td><td>${x.hr}</td><td>${x.bb}</td><td>${x.so}</td><td>${x.so?(x.bb/x.so).toFixed(2):'-'}</td><td>${x.sb}</td></tr>`; }).join('')}</tbody></table></div>`; }
function amLine(p){ const h=p.am; if(!h)return '기록 없음';
  if(p.isP){ const r=pRate(h); return `ERA ${h.outs?r.era.toFixed(2):'-'} · ${ipStr(h.outs)}이닝 · K/9 ${h.outs?(h.so*27/h.outs).toFixed(1):'-'} · BB/9 ${h.outs?(h.bb*27/h.outs).toFixed(1):'-'} · 최고 ${p.amVelo||veloOf(p)}km/h`; }
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
function allStrength(){ const k=G.day+':'+G.games.length+':'+G.year; if(_psC.k===k)return _psC.v; const v={}; for(const t of G.teams)v[t.id]=posStrength(rosterList(t.id)); _psC={k,v}; return v; }
function pct(v){ return v==null?'-':v>=.995?'99%+':v<=.005&&v>0?'1% 미만':v===0?'0%':Math.round(v*100)+'%'; }
function raceCard(){
  const per=period(); const {order,live,y}=standOrder(); const odds=playoffOdds(); const top=order[0];
  if(!live||!odds)return csec(live?`${G.year} 현재 순위`:`${y} 최종 순위`,`<div class="tw">${standingsTable(order)}</div>${live?'<p class="small muted">가을야구 확률은 팀당 20경기를 치른 뒤부터 계산합니다.</p>':''}`);
  const om=new Map(odds.map(o=>[o.tid,o]));
  const zone=o=>{ const x=om.get(o.tid); return x.first>=.15?'선두 경쟁':x.ps>=.08?'가을야구 경쟁':'하위권'; };
  const groups=['선두 경쟁','가을야구 경쟁','하위권'].map(z=>[z,order.filter(o=>zone(o)===z)]).filter(g=>g[1].length);
  const left=144-(G.sea.rec[G.user].w+G.sea.rec[G.user].l+(G.sea.rec[G.user].t||0));
  return `<section class="card"><div class="row between"><h2 class="sec">리그 판도</h2><span class="small muted">남은 경기 ${left} · 남은 일정을 400번 모의 진행</span></div>
    ${groups.map(([z,arr])=>`<div class="zone"><div class="eyebrow">${z}</div>${arr.map(o=>{ const x=om.get(o.tid); const i=order.indexOf(o); return `<button class="race${o.tid===G.user?' me':''}" data-a="lteamGo" data-v="${o.tid}"><span class="rk">${i+1}</span>${badge(o.tid,20)}<b>${tshort(o.tid)}</b><span class="num rcd">${wlStr(o)}</span><span class="num gb">${i?gbStr(gbOf(top,o)):'-'}</span><span class="bar"><i style="width:${Math.max(2,x.ps*100)}%"></i></span><span class="num ppc">${pct(x.ps)}</span>${strkPill(o.tid)}</button>`; }).join('')}</div>`).join('')}
    <p class="small muted">막대는 가을야구(5위 안) 진출 확률입니다. 지금 성적과 개막 전 전력 평가를 섞은 팀 전력으로 남은 경기를 모의 진행한 결과이고, 실제 결과와 다를 수 있습니다.</p></section>`; }
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
function mailFilter(f){ const isTask=m=>m.imp&&!(m.kind==='트레이드'&&/원한다/.test(m.subj)&&!(G.offers||[]).some(o=>o.id===m.oid));
  return G.mail.filter(m=>f==='all'||(f==='task'&&isTask(m))||(f==='unread'&&!m.read)||(f==='player'&&typeof m.face==='number')); }
/* ---------- 도움말 문장 접기 ---------- */
function toast(t){ let el=document.getElementById('toast'); if(!el){ el=document.createElement('div'); el.id='toast'; el.setAttribute('role','status'); document.body.appendChild(el); } el.textContent=t; el.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('on'),2400); }
/* 설명 문단은 기본으로 보인다. 익숙해지면 ? 버튼으로 숨긴다 */
function helpOn(){ try{ return localStorage.getItem('danjang-help')!=='0'; }catch(e){ return true; } }
function markHints(root){ if(!root)return; root.querySelectorAll('p.small.muted, p.muted.small').forEach(el=>{ if(el.closest('.mailbody,.news,.dl-empty,.td,.quote'))return; const t=el.textContent||''; if(el.classList.contains('keep')||/없습니다|수 없|아닙니다|만 시작|기한|마감/.test(t))return; if(t.length>=42)el.classList.add('hint'); }); }

/* ---------- 화면 안 탭 ---------- */
function inTabs(key,tabs,def){ const cur=(UI.it||{})[key]||def||tabs[0][0]; const ok=tabs.some(t=>t[0]===cur)?cur:tabs[0][0];
  const wrapT=tabs.length>=5||tabs.reduce((a,t)=>a+String(t[1]).replace(/<[^>]*>/g,'').length,0)>20;
  return {cur:ok,bar:`<div class="seg itabs${wrapT?' wrapt':''}">${tabs.map(([k,l])=>`<button data-a="itab" data-v="${key}:${k}" class="${ok===k?'on':''}">${l}</button>`).join('')}</div>`}; }

/* 긴 목록은 쪽으로 나눈다: 스크롤 대신 넘기기 */
function pager(key,arr,per){ UI.pg=UI.pg||{}; const n=Math.max(1,Math.ceil(arr.length/per)); let i=Math.min(UI.pg[key]||0,n-1); if(i<0)i=0;
  const items=arr.slice(i*per,i*per+per); const bar=n<=1?'':`<div class="pgr"><button class="btn small" data-a="pgGo" data-v="${key}:${i-1}" ${i<=0?'disabled':''} aria-label="이전">‹ 이전</button><span class="num">${i+1} / ${n}</span><button class="btn small" data-a="pgGo" data-v="${key}:${i+1}" ${i>=n-1?'disabled':''} aria-label="다음">다음 ›</button></div>`;
  return {items,bar,i,n}; }
