/* ---------- 스태프·육성 > 훈련·육성 > 스프링캠프: 장소 예약 · 훈련 강도 · 연습경기 · 시범경기 기록 ---------- */
function sprcSiteBtns(lvl){ const T=lvl===1?SPRC1:SPRC2, P=sprcPlan(G.user), cur=P[lvl===1?'s1':'s2'], open=sprcOpen();
  return `<div class="talk sprc-sites">${Object.entries(T).map(([k,D])=>{ const left=Math.max(0,D.sl-sprcTaken(lvl,k)), mine=cur===k, o=sprcOdds(G.user,lvl,k); const full=left<=0&&!mine&&!o.sb;
    const odds=k==='home'?'':o.q>=.8?' · 성사 높음':o.q>=.55?' · 성사 보통':' · 성사 낮음';
    return `<button class="btn small ${mine?'on':''}" data-a="sprcBook" data-v="${lvl}:${k}" ${!open||full?'disabled':''}><b>${esc(D.l)}</b> <span class="small">${mine?'예약됨':full?'마감':`+${money(o.c)} · ${!left&&o.sb?'일반 예약 마감 · 자매구단 우선 예약':left+'자리 남음'}${odds}`}${o.pv&&!mine?' · 지난해 사용':''}${o.sb?' · 자매구단':''}</span></button>`; }).join('')}</div>`; }
function sprcStatTable(st,isP){ const rows=lightRows(st,G.user).filter(x=>!!x.p.isP===isP&&x.a.length===(isP?6:8)).sort((x,y)=>y.a[1]-x.a[1]).slice(0,14),legacy=!isP&&lightLegacyCount(st)?'<p class="small muted">이전 형식의 합계 기록은 출전 구단을 확인할 수 없어 별도 보관합니다. 아래 구단별 기록에는 합산하지 않습니다.</p>':'';
  if(!rows.length)return legacy;
  const ip=o=>`${Math.floor(o/3)}${o%3?'.'+o%3:''}`;
  return legacy+`<div class="tw"><table class="mst"><thead><tr>${isP?'<th>투수</th><th>경기</th><th>이닝</th><th>ERA</th><th>삼진</th><th>볼넷</th>':'<th>타자</th><th>타석</th><th>타율</th><th>홈런</th><th>OPS</th>'}</tr></thead><tbody>${rows.map(({p,a})=>isP?`<tr><td><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button></td><td>${a[0]}</td><td>${ip(a[1])}</td><td>${exhEra(a).toFixed(2)}</td><td>${a[5]}</td><td>${a[4]}</td></tr>`:`<tr><td><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button></td><td>${a[1]}</td><td>${exhF3(exhAvg(a))}</td><td>${a[4]}</td><td>${exhF3(exhOps(a))}</td></tr>`).join('')}</tbody></table></div>`; }
function sprcView(){ if(G.unemp)return csec('스프링캠프','<p class="small muted">구단을 맡고 있지 않습니다.</p>'); const c=sprcCal(); const pre=G.day<c.camp, inCamp=G.day>=c.camp&&G.day<c.campEnd; const out=[];
  const m=G.mgr[G.user]; const P=(pre&&!sprcOpen())?null:sprcPlan(G.user);
  if(pre&&!sprcOpen())out.push(csec('스프링캠프 계획','<p class="small">캠프 장소 예약은 시즌 결산이 끝난 뒤(11월)부터 1월 24일까지 합니다. 좋은 곳은 다른 구단이 11~12월에 먼저 채웁니다.</p>'));
  if(pre&&P){ const pref=sprcMgrPref(m), cap=sprcPgCap(P); const S=G.scp; const mates={}; for(const t of G.teams){ if(t.id===G.user)continue; const Q=S.t[t.id]; if(Q&&Q.s2)(mates[Q.s2]=mates[Q.s2]||[]).push(tshort(t.id)); }
    const left=c.camp-1-G.day; const d1=SPRC1[P.s1], d2=SPRC2[P.s2];
    out.push(csec('스프링캠프 계획',`${UI.sprcMsg?`<div class="note bad">${esc(UI.sprcMsg)}</div>`:''}
      <p class="small">${dmd(c.camp)} 출국 · 1차 ${dmd(c.camp)}~2월 19일 · 2차 2월 20일~${dmd(c.campEnd)} 귀국. 비용은 기본 운영비(대만·국내 기준)보다 더 드는 돈입니다. 예약 성사와 값은 단장 명성(현지 네트워크)과 지난해에도 쓴 곳인지에 달렸습니다.</p>
      <div class="eyebrow">1차 캠프 · 몸 만들기와 기술 훈련</div>${sprcSiteBtns(1)}${d1?`<p class="small muted">${esc(d1.l)}: ${esc(d1.d)}</p>`:''}
      <div class="eyebrow">2차 캠프 · 실전과 연습경기</div>${sprcSiteBtns(2)}${d2?`<p class="small muted">${esc(d2.l)}: ${esc(d2.d)}${mates[P.s2]?` 같은 곳: ${esc(mates[P.s2].join(', '))}.`:''}</p>`:''}
      <div class="eyebrow">훈련 강도 · 감독과 함께</div><div class="talk">${SPRC_INTK.map(k=>`<button class="btn small ${P.int===k?'on':''}" data-a="sprcInt" data-v="${k}">${SPRC_INT[k].l}${k===pref?' · 감독 희망':''}</button>`).join('')}</div>
      <p class="small muted">${esc(SPRC_INT[P.int].d)}</p>
      ${m&&!m.interim?`<div class="mop"><b>${esc(m.name)} 감독</b><span>"${pref==='hard'?'캠프는 빡세게 가야 시즌을 버팁니다.':pref==='easy'?'선수들이 알아서 몸을 만들게 두는 게 맞습니다.':'정해진 일정대로 무리 없이 가겠습니다.'}"</span>${P.int!==pref?`<span class="small warn">감독 희망과 다릅니다. 캠프 시작 때 감독 관계가 깎이고 캠프 효과도 조금 줄어듭니다.</span>`:''}</div>`:''}
      <div class="eyebrow">연습경기</div><div class="talk">${[...new Set(SPRC_PGN.concat(cap))].sort((a,b)=>a-b).map(n=>`<button class="btn small ${P.pgN===n?'on':''}" data-a="sprcPg" data-v="${n}:" ${!P.s1||!P.s2||n>cap?`disabled title="${esc(!P.s1||!P.s2?'1차·2차 캠프 장소를 먼저 정하세요':sprcPgWhy(P,cap))}"`:''}>${n}경기</button>`).join('')}</div>${P.s1&&P.s2&&SPRC_PGN.some(n=>n>cap)?`<p class="small warn">${esc(sprcPgWhy(P,cap))}</p>`:!P.s1||!P.s2?'<p class="small warn">1차·2차 캠프 장소를 먼저 정해야 연습경기 수를 고를 수 있습니다.</p>':''}
      <div class="talk">${Object.entries(SPRC_LV).map(([k,l])=>`<button class="btn small ${P.pgLv===k?'on':''}" data-a="sprcPg" data-v=":${k}">${l}</button>`).join('')}</div>
      <p class="small muted">${P.s1&&P.s2?`지금 장소로 잡을 수 있는 연습경기는 최대 ${cap}경기입니다.`:'장소를 정하면 잡을 수 있는 연습경기 수가 나옵니다.'} 상대 구단 사정에 따라 몇 경기는 못 잡을 수 있습니다. 일본 1군 상대는 2차가 일본일 때만 잡힙니다.</p>
      <p class="small">${left>0?`예약 마감까지 ${left}일`:'오늘 예약 마감'} · ${c.y}년 캠프 추가 비용 ${money((P.c1||0)+(P.c2||0))}</p>`));
    out.push(csec('다른 구단 예약 현황',`<div class="list">${[...Object.entries(SPRC1).map(([k,D])=>[1,k,D]),...Object.entries(SPRC2).map(([k,D])=>[2,k,D])].map(([lvl,k,D])=>{ const L=G.teams.filter(t=>(S.t[t.id]||{})[lvl===1?'s1':'s2']===k).map(t=>tshort(t.id)); return L.length?`<div class="small"><b>${lvl}차 ${esc(D.l)}</b> ${esc(L.join(', '))} (${L.length}/${D.sl})</div>`:''; }).join('')||'<p class="small muted">아직 예약한 구단이 없습니다.</p>'}</div>`)); }
  if(!pre&&G.scp&&G.scp.y===G.year&&G.scp.t[G.user]&&G.scp.t[G.user].s1){ const Q=G.scp.t[G.user]; const R0=Q.pgR||[]; const w=R0.filter(x=>x.us>x.op).length, l=R0.filter(x=>x.us<x.op).length;
    const wx=v=>v>=1.04?'맑고 따뜻함':v>=.97?'무난함':'쌀쌀하고 비가 잦음';
    out.push((inCamp?campCard():'')+csec(`${G.year} 스프링캠프`,`<dl class="tsum"><div><dt>1차</dt><dd>${esc(SPRC1[Q.s1].l)}${Q.wx1?` · ${wx(Q.wx1/SPRC1[Q.s1].wx)}`:''}</dd></div><div><dt>2차</dt><dd>${esc((SPRC2[Q.s2]||SPRC2.home).l)}${Q.wx2?` · ${wx(Q.wx2/(SPRC2[Q.s2]||SPRC2.home).wx)}`:''}</dd></div><div><dt>훈련 강도</dt><dd>${SPRC_INT[Q.int].l}${Q.gap?' · 감독과 이견':''}</dd></div><div><dt>연습경기</dt><dd>${w}승 ${l}패${R0.length-w-l?` ${R0.length-w-l}무`:''} · ${R0.length}/${(Q.pg||[]).length}경기</dd></div></dl>
      ${(Q.pg||[]).length?`<div class="list">${Q.pg.map(g=>{ const r=R0.find(x=>x.d===g.d); const nm=sprcOppName(g); return `<div class="small">${dmd(g.d)} ${esc(nm)} ${r?`<b>${r.us}:${r.op}</b> ${r.us>r.op?'승':r.us<r.op?'패':'무'}`:'<span class="muted">예정</span>'}</div>`; }).join('')}</div>`:'<p class="small muted">잡힌 연습경기가 없습니다.</p>'}
      ${sprcStatTable(G.scp.pgS,false)}${sprcStatTable(G.scp.pgS,true)}`)); }
  const E=G.exh&&G.exh.y===G.year?G.exh:null;
  if(E){ const st=exhStand(); const ds=Object.keys(E.days).map(Number).sort((a,b)=>a-b); const mine=E.res.filter(x=>x.h===G.user||x.a===G.user); const nx=ds.find(d=>d>G.day);
    out.push(csec(`${G.year} 시범경기`,`<p class="small muted">${dmd(ds[0])}~${dmd(ds[ds.length-1])} · 팀당 ${ds.length}경기 · 연장·더블헤더 없음 · 정규시즌 순위와 무관${E.done?' · 종료':nx?` · 다음 ${dmd(nx)}`:''}</p>
      <div class="tw"><table class="mst"><thead><tr><th>순위</th><th>구단</th><th>승</th><th>패</th><th>무</th></tr></thead><tbody>${st.map((x,i)=>`<tr class="${x.tid===G.user?'me':''}"><td>${i+1}</td><td>${esc(tshort(x.tid))}</td><td>${x.r[0]}</td><td>${x.r[1]}</td><td>${x.r[2]}</td></tr>`).join('')}</tbody></table></div>
      ${mine.length?`<div class="list">${mine.map(x=>{ const me=x.h===G.user, us=me?x.hs:x.as, op=me?x.as:x.hs; return `<div class="small">${dmd(x.d)} ${me?'홈':'원정'} ${esc(tshort(me?x.a:x.h))} <b>${us}:${op}</b> ${us>op?'승':us<op?'패':'무'}</div>`; }).join('')}</div>`:''}
      <div class="eyebrow">시범경기 기록 · 우리 구단</div>${sprcStatTable(E.ps,false)||'<p class="small muted">아직 기록이 없습니다.</p>'}${sprcStatTable(E.ps,true)}`)); }
  return out.join('')||csec('스프링캠프','<p class="small muted">올해 캠프 기록이 없습니다.</p>'); }
/* 특수 아카데미 제휴(육성 > 해외 연수 · 시설 투자) */
function acadCard(){ if(G.unemp)return ''; const lv=acadLv(), nx=ACAD[lv+1], t=team(G.user);
  return `<section class="card"><div class="row between"><span class="eyebrow">특수 아카데미 제휴 · ${lv}/3단계</span><span class="small muted">${esc(ACAD[lv].l)}</span></div>
    <p class="small">미국 피칭 랩·컨디셔닝 센터·국내 아카데미 같은 곳에 구단 돈으로 선수를 보내는 인프라입니다. ${esc(ACAD[lv].d)}</p>
    ${nx?`<div class="row between"><span class="small">다음: <b>${esc(nx.l)}</b> · ${esc(nx.d)}</span><button class="btn small primary" data-a="acadUp" data-v="${lv+1}" ${spendable(G.user)<nx.c?'disabled':''}>구단 자금으로 · ${money(nx.c)}</button></div>`:'<span class="pill good">최고 단계</span>'}
    ${UI.acadMsg?`<div class="note bad">${esc(UI.acadMsg)}</div>`:''}</section>`; }
Object.assign(A,{
  sprcBook(v){ const [l,k]=String(v).split(':'); const r=sprcBook(+l,k); UI.sprcMsg=r||null; if(!r)toast(`${l}차 캠프 예약: ${(+l===1?SPRC1:SPRC2)[k].l}`); save(); render(); },
  sprcInt(v){ UI.sprcMsg=sprcSetInt(v)||null; save(); render(); },
  sprcPg(v){ const [n,lv]=String(v).split(':'); UI.sprcMsg=sprcSetPg(n===''?null:+n,lv||null)||null; save(); render(); },
  acadUp(){ UI.acadMsg=acadUp()||null; save(); render(); } });
Object.assign(GUARD,{ acadUp(v){ const n=ACAD[+v]; if(!n||+v!==acadLv()+1)return null; const t=team(G.user); return {subj:`특수 아카데미 제휴: ${n.l}`,kind:'시설',lines:[`비용 ${money(n.c)} · ${spendTxt()}`,n.d],warn:'비용은 현금에서 바로 나가고 되돌릴 수 없습니다.'}; } });
/* 연습경기 수가 막힌 이유(플레이테스트 4 #11): 캠프지마다 연습 상대를 잡을 수 있는 수가 정해져 있다 */
function sprcPgWhy(P,cap){ const a=SPRC1[P.s1], b=SPRC2[P.s2]; return `${cap}경기보다 많이는 잡을 수 없습니다. 연습 상대는 1차 캠프지(${a?a.l:'-'})에서 최대 ${a?a.pg:0}경기, 2차 캠프지(${b?b.l:'-'})에서 최대 ${b?b.pg*2:0}경기입니다. 더 치르려면 상대 팀이 많은 캠프지(2차 오키나와 최대 8경기 등)를 고르세요.`; }
