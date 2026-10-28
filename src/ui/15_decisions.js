/* ---------- 단장 결정 카드 ---------- */
function decisionCard(){ const open=(G.evs||[]).filter(e=>!e.done); const last=(G.evlog||[]).filter(x=>x.d>=G.day-2&&x.y===G.year).slice(0,2);
  if(!open.length&&!last.length)return '';
  const one=e=>{ const p=e.ref!=null?G.players[e.ref]:null; const pz=p?null:personaOf(e.from);
    return `<div class="dec"><div class="dec-t">${p?avImg(p):pz?avImg(pz):'<span class="tdi">!</span>'}<div><span class="eyebrow dec-k">${evIcon(e.k)} ${EV_KEY.has(e.k)?'단장 결정':'일상 결정'} · ${dmd(e.exp)}까지${e.exp-G.day<=1?' <b class="bad">내일 자동 처리</b>':''}</span><b>${esc(e.title)}</b><p>${lk(e.sit).replace(/\n/g,'<br>')}</p></div></div>
      <div class="dec-o">${e.opts.map((o,i)=>`<button class="dec-b" data-a="evPick" data-v="${e.id}:${i}"><b>${esc(o.l)}</b><span>${esc(o.fx)}</span>${i===e.def?'<i>기한이 지나면 이것으로 처리</i>':''}</button>`).join('')}</div>${!EV_KEY.has(e.k)&&EV_NAME[e.k]?`<button class="tc-i" data-a="evDeleg" data-v="${e.id}">${esc(EV_NAME[e.k])}은(는) 앞으로 비서에게 맡기기</button>`:''}</div>`; };
  const done=last.map(x=>`<div class="dec-r"><b>${lk(x.t)}</b><span>결정: ${esc(x.c)}${x.auto?' (자동)':''}</span>${x.r?`<em>${lk(x.r)}</em>`:''}${x.f?`<em class="f">${lk(x.f)}</em>`:''}</div>`).join('');
  const dl=Object.keys(G.deleg||{}).filter(k=>G.deleg[k]&&EV_NAME[k]); const dlx=dl.length?`<p class="small muted" style="margin:6px 0 0">비서에게 맡긴 일: ${dl.map(k=>EV_NAME[k]).join(', ')} <button class="tc-i" data-a="evDelegOff">모두 직접 하기</button></p>`:'';
  return `<section class="card deccard">${open.map(one).join('')}${done?`<div class="dec-rs">${done}</div>`:''}${dlx}</section>`; }
function todoCard(){
  const it=[]; const b=blockNow();
  if(b&&!G.live)it.push({t:b,s:'',btn:blkLink(b).replace('<button ','<button class="btn small" ')});
  for(const [tab,arr] of Object.entries(SUBS)) for(const [k,l] of arr){ const key=tab+':'+k; if(key==='trade:offers'||key==='train:dev')continue; if(TODO[key]&&subAlert(tab,k)&&!(b&&key==='staff:mgr'&&/감독/.test(b)))it.push({t:TODO[key][0],s:TODO[key][1],btn:`<button class="btn small" data-a="go" data-v="${key}">${l}</button>`}); }
  if(subAlert('staff','mil'))it.push({t:TODO['staff:mil'][0],s:TODO['staff:mil'][1],btn:'<button class="btn small" data-a="go" data-v="staff:mil">병역</button>'});
  for(const o of (G.offers||[]).filter(o=>o.exp!=null&&o.exp-G.day<=2&&o.exp>=G.day).slice(0,2)){ const gp=o.get&&G.players[o.get[0]]; it.push({t:`${tshort(o.from)} 트레이드 제안 ${o.exp-G.day<=0?'오늘':o.exp-G.day+'일 뒤'} 만료`,s:gp?`상대가 원하는 선수: ${gp.name}`:'',btn:'<button class="btn small" data-a="go" data-v="trade:offers">제안 보기</button>'}); }
  const imp=G.mail.filter(m=>m.imp&&!m.read&&m.kind!=='결정'&&G.day-m.day<=20&&!(m.kind==='트레이드'&&/원한다/.test(m.subj))).slice(0,4);
  for(const m of imp)it.push({t:m.subj,s:`${m.from} · ${dsh(m.day)}`,btn:`<button class="btn small" data-a="openMail" data-v="${m.id}">읽기</button>`,mail:m});
  const unread=G.mail.filter(mailNeeds).length;
  const per=period();
  const body=it.length?`<div class="todo">${it.map(x=>`<div class="td">${x.mail?senderAv(x.mail):'<span class="tdi">!</span>'}<div><b>${esc(x.t)}</b>${x.s?`<span>${esc(x.s)}</span>`:''}</div>${x.btn||''}</div>`).join('')}</div>`
    :`<p class="small muted">급한 일이 없습니다. ${per==='season'?'오른쪽 위 <b>계속</b>은 다음 소식까지(최대 한 주), <b>1경기</b>는 한 경기씩 진행합니다.':per==='post'?'오른쪽 위 <b>다음 경기</b>로 진행하세요.':'오른쪽 위 <b>계속</b>을 누르면 다음 일정까지 진행합니다.'}</p>`;
  return `<section class="card"><div class="row between"><h2 class="sec">처리할 일${it.length?` <span class="cntb">${it.length}</span>`:''}</h2><button class="btn small" data-a="tab" data-v="inbox">소식함${unread?` ${unread}`:''}</button></div>${body}</section>`;
}
function nextGames(n){
  const c=G.cal; const L=[]; for(let d=G.day+(G.res?1:1);d<=c.end&&L.length<n;d++){ const gs=c.sched[d]; if(!gs)continue; const m=gs.find(x=>x.includes(G.user)); if(m)L.push({d,home:m[0]===G.user,op:m[0]===G.user?m[1]:m[0]}); }
  if(G.ps&&G.ps.cur){ const s=G.ps.cur; if(s.hi===G.user||s.lo===G.user){ const d=s.days[s.gi]; if(d>G.day&&!L.some(x=>x.d===d))L.unshift({d,home:s.hi===G.user?s.gi<2||s.gi>=5:!(s.gi<2||s.gi>=5),op:s.hi===G.user?s.lo:s.hi,ps:`${ROUNDK[s.round]} ${s.gi+1}차전`}); } }
  return L;
}
function miniStand(){
  const {order,live,y}=standOrder(); if(!order||!order.length)return '';
  if(!live&&G.startY===G.year){ /* 창단 첫해 개막 전: 지난 시즌 순위는 의미가 없으니 전문가 전력 평가를 보여 준다 */
    if(!UI._trk||UI._trk.k!==G.day+':'+G.user)UI._trk={k:G.day+':'+G.user,R:G.teams.map(t=>({tid:t.id,r:teamRating(t.id)})).sort((a,b)=>b.r-a.r)}; const R=UI._trk.R;
    return `<section class="card"><div class="row between"><h2 class="sec">${ctSeason()} 전력 예상</h2><span class="small muted">외국인 영입 반영 · 매주 바뀜</span></div><div class="tw"><table class="mst"><tbody>${R.map((x,i)=>`<tr class="${x.tid===G.user?'me':''}${i===4?' cut':''}"><td class="rk">${i+1}</td><td>${badge(x.tid,16)} ${esc(tshort(x.tid))}</td></tr>`).join('')}</tbody></table></div></section>`; }
  const top=order[0]; const hasTl=tlOf(G.user).length>0&&live; const od=live?playoffOdds():null; const nar=!wide()&&!!od;
  const rows=order.map((o,i)=>{ const l=l10Of(o.tid); return `<tr class="${o.tid===G.user?'me':''}${i===4?' cut':''}"><td class="rk">${i+1}</td><td><button class="lnk tname" data-a="lteamGo" data-v="${o.tid}">${badge(o.tid,18)}${tshort(o.tid)}</button></td><td class="num">${wlStr(o)}</td><td class="num">${i?gbStr(gbOf(top,o)):'-'}</td>${hasTl?`${nar?'':`<td class="num">${l.n?wlStr(l):'-'}</td>`}<td>${strkPill(o.tid)}</td>`:''}${od?`<td class="num ppc">${pct((od.find(x=>x.tid===o.tid)||{}).ps)}</td>`:''}</tr>`; }).join('');
  return `<section class="card"><div class="row between"><h2 class="sec">${live?'현재 순위':`${y} 최종 순위`}</h2><button class="btn small" data-a="go" data-v="league:stand">순위</button></div>
    <div class="tw"><table class="mst"><thead><tr><th></th><th>구단</th><th>승-패-무</th><th>차</th>${hasTl?`${nar?'':'<th>최근10</th>'}<th>연속</th>`:''}${od?'<th>가을야구</th>':''}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted">점선 위 5개 팀이 가을야구에 나갑니다.${od?' 가을야구는 남은 일정을 모의 진행한 진출 확률입니다.':''}</p></section>`;
}
function formCard(){
  const per=period(); if(per!=='season'&&per!=='post')return '';
  const L=tlOf(G.user).slice(-10); if(!L.length)return '';
  const T=teamStats(G.year); const me=T[G.user]; const sp=splitOf(G.user); const rd=sp.rs-sp.ra;
  const sq=L.map(x=>`<span class="fsq ${x[0]>0?'w':x[0]<0?'l':'t'}" title="${dsh(x[5])} ${tshort(x[4])} ${x[1]}:${x[2]}"><b>${x[0]>0?'승':x[0]<0?'패':'무'}</b><i>${x[1]}:${x[2]}</i><em class="fsqb">${badge(x[4],16)}</em></span>`).join('');
  const st=(l,v,r)=>`<div><dt>${l}</dt><dd class="num">${v}</dd>${r?rkPill(r):''}</div>`;
  return `<section class="card"><div class="row between"><h2 class="sec">최근 흐름</h2><span class="small">${strkPill(G.user)}</span></div>
    <div class="fsqs">${sq}</div>${rankChart(true)?`<div class="rmini"><span class="small muted">시즌 순위 흐름</span>${rankChart(true)}</div>`:''}
    <dl class="tstat">${st('팀 타율',fmt3(me.avg),rankIn(T,G.user,'avg'))}${st('팀 OPS',fmt3(me.ops),rankIn(T,G.user,'ops'))}${st('홈런',me.hr,rankIn(T,G.user,'hr'))}${st('팀 ERA',me.era.toFixed(2),rankIn(T,G.user,'era',true))}${st('득실차',(rd>0?'+':'')+rd,rankIn(T.map(t=>Object.assign({},t,{rd:t.rs-t.ra})),G.user,'rd'))}${st('홈 · 원정',`${sp.home} · ${sp.away}`,0)}</dl>
    <div class="row"><button class="btn small" data-a="go" data-v="league:score">일정·결과</button><button class="btn small" data-a="go" data-v="league:rec">리그 기록</button></div></section>`;
}
function myLeaders(){
  const per=period(); const y=per==='season'||per==='post'?G.year:G.year-1;
  const rows=playerRows(y).filter(x=>x.p.team===G.user); if(!rows.length)return '';
  const g=qualOf(G.user)||144;
  const bat=rows.filter(x=>!x.p.isP&&x.h.pa>=Math.max(10,g*2)).sort((a,b)=>b.r.ops-a.r.ops).slice(0,3);
  const pit=rows.filter(x=>x.p.isP).sort((a,b)=>b.w-a.w).slice(0,3);
  const li=x=>`<button class="item wa" data-a="player" data-v="${x.p.id}">${avImg(x.p)}<span class="nm">${esc(x.p.name)} <span class="small muted">${posLabel(x.p)}</span></span><span class="sub">${statLine(x.h,x.p)}</span><span class="rt num">${x.p.isP?`<b>${x.w.toFixed(1)}</b>`:`<b>${fmt3(x.r.ops)}</b>`}</span></button>`;
  return `<section class="card"><div class="row between"><h2 class="sec">${y===G.year?'우리 팀 주요 선수':`${y} 우리 팀 주요 선수`}</h2><button class="btn small" data-a="tab" data-v="roster">선수단</button></div>
    <div class="eyebrow">타자 · OPS</div><div class="list">${bat.map(li).join('')||'<p class="small muted" style="padding:6px 12px">기록이 쌓이면 표시됩니다.</p>'}</div>
    <div class="eyebrow">투수 · WAR</div><div class="list">${pit.map(li).join('')}</div></section>`;
}
function newsSeen(){ return G.newsSeen||0; }
function newsCard(){ const ns=(G.news||[]).slice(0,4); if(!ns.length)return '';
  const nn=(G.news||[]).filter(n=>(n.id||0)>newsSeen()).length;
  return `<section class="card"><div class="row between"><h2 class="sec">뉴스${nn?` <span class="cntb">${nn}</span>`:''}</h2><button class="btn small" data-a="go" data-v="league:news">전체 기사</button></div>${ns.map(n=>newsItem(n,false)).join('')}</section>`; }
function clubCard(){
  prInit(); const t=team(G.user); const ci=capInfo(G.user); const s=goalStatus();
  const g=(l,v,lo,hi)=>`<div><dt>${l}</dt><dd class="num">${v}</dd>${gauge(v,lo,hi)}</div>`;
  const goal=s?`<div class="gl">${[['순위',s.rank.cur?`${s.rank.cur}위 / 목표 ${s.rank.t}위`:`목표 ${s.rank.t}위`,s.rank.cur?s.rank.ok:null],['재정',`${Math.round(s.sup.cur*100)}% / 목표 ${Math.round(s.sup.t*100)}%`,s.sup.ok],['여론',`${s.fan.cur} / 목표 ${s.fan.t}`,s.fan.ok]].concat(s.youth?[['육성',`${s.youth.cur}명 / 목표 1명`,s.youth.ok]]:[]).map(([l,v,ok])=>`<span class="${ok==null?'':ok?'ok':'ng'}"><b>${l}</b> ${v}</span>`).join('')}</div>`:'';
  return `<section class="card"><div class="row between"><h2 class="sec">구단 상태</h2><button class="btn small" data-a="go" data-v="club:owner">구단주</button></div>
    <dl class="tsum">${g('구단주 신뢰',t.trust,25,60)}${g('팬 여론',Math.round(G.pr.fan),40,60)}${g('언론 논조',Math.round(G.pr.press),40,60)}</dl>
    ${goal}
    <p class="small muted keep">자금 <b class="num">${money(t.cash)}</b> · 연봉 캡 <b class="num">${money(ci.pay)}</b> / ${money(ci.cap)}</p></section>`;
}

