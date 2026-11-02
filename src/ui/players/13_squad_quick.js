/* ---------- 우리 선수단 빠르게 보기 ---------- */
/* 우리 팀 상황 요약: 성적·목표·돈·빠진 선수·다음 경기 */
function teamStatusBox(){ const per=period(); const gs=goalStatus(); const ci=capInfo(G.user); let b=null; try{ b=budget(); }catch(e){}
  const st=(per==='season'||per==='post')&&G.sea&&G.sea.rec?standingsNow():null; const i=st?st.findIndex(x=>x.tid===G.user):-1; const me=i>=0?st[i]:null;
  const gb=me&&i>0?((st[0].w-me.w)+(me.l-st[0].l))/2:0; const fifth=st&&st[4]?st[4]:null; const g5=me&&fifth&&i>4?((fifth.w-me.w)+(me.l-fifth.l))/2:null;
  const pr=me?null:projNow().findIndex(x=>x.tid===G.user)+1||null; /* 홈 상단·오른쪽 전력 예상과 같은 기준 */
  const rec=me?`<b>${i+1}위</b> ${me.w}승 ${me.l}패${me.t?` ${me.t}무`:''} · 승률 ${fmt3(me.w/Math.max(1,me.w+me.l))}${i>0?` · 1위와 ${gb}경기`:''}${g5!=null?` · 5위와 ${g5}경기`:''}`:`${PERIOD[per]}${pr?` · 예상 ${pr}위`:''}`;
  const ok=x=>x?'<b class="good">달성 중</b>':'<b class="bad">미달</b>';
  const goal=gs?`목표 ${gs.rank.t}위 이내 ${gs.rank.cur!=null?ok(gs.rank.ok):''} · 지원 ${Math.round(gs.sup.cur*100)}%/${Math.round(gs.sup.t*100)}% ${ok(gs.sup.ok)} · 팬 ${gs.fan.cur}/${gs.fan.t} ${ok(gs.fan.ok)}`:'올해 목표 미정';
  const out=playersOf(G.user).filter(p=>!healthy(p)); const ng=(G.cal&&per!=='off')?nextGames(1)[0]:null;
  const r=(l,v)=>`<div class="tsb-r"><span>${l}</span><span>${v}</span></div>`;
  return `<div class="tsbox">${r('성적',rec)}${r('구단주',goal)}${r('돈',`캡 ${money(ci.pay)} / ${money(ci.cap)}${ci.over>0?' <b class="bad">초과</b>':''}${b?` · 예산 여유 <b class="${b.roomGoal<0?'bad':'good'}">${money(b.roomGoal)}</b>`:''}`)}
    ${r('빠진 선수',out.length?out.slice(0,5).map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button>(${outTxt(p)})`).join(', ')+(out.length>5?` 외 ${out.length-5}명`:''):'없음')}
    ${ng?r('다음 경기',`${dsh(ng.d)} ${ng.home?'홈':'원정'} ${esc(tshort(ng.op))}${ng.ps?` · ${ng.ps}`:''}`):''}</div>`; }
function myRosterSheet(){ const d=depth(G.user); const tro=tradeOpen(); const rk=slotRanks(G.user); const order=orderList(d.start,G.user); const posOf={}; for(const k in d.ln)posOf[d.ln[k].id]=k;
  const row=(p,lab)=>{ const rp=scoutReport(p); const h=curLine(p); const st=!h?'-':yrTag(h)+' '+(p.isP?(h.outs?`ERA ${pRate(h).era.toFixed(2)}`:'-'):(h.pa?`OPS ${fmt3(bRate(h).ops)}`:'-'));
    return `<div class="mr${tro?' tro':''}"><span class="mr-l">${lab}</span><button class="mr-p" data-a="player" data-v="${p.id}">${avImg(p)}<span><b>${esc(p.name)}</b><i>${p.age}세 · ${st} · ${money(p.sal)}</i></span></button><span class="mr-o">${rchip(rp.cur)}${condChip(p)}</span>${tro?(!p.foreign?`<button class="tc-i mr-t" data-a="toTradeGive" data-v="${p.id}" title="트레이드 협상에 내놓을 선수로 올립니다">트레이드</button>`:'<span class="mr-t"></span>'):''}</div>`; };
  const fut=[...d.futB,...d.futP].filter(p=>!p.ys).map(p=>({p,f:scoutReport(p).ofp||0})).sort((a,b)=>b.f-a.f).slice(0,6).map(x=>x.p);
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="우리 선수단">
    <div class="sheet-head"><div><div class="eyebrow">${esc(tname(G.user))}</div><h2 class="sec">우리 팀 현황</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    ${teamStatusBox()}
    <div class="eyebrow">포지션별 리그 순위 <span class="muted">(10개 구단 중)</span></div>
    ${slotBar(rk)}
    ${tro?'<p class="small muted">선수 옆 "트레이드"를 누르면 트레이드 협상 화면에 내줄 선수로 올라갑니다.</p>':''}
    <div class="eyebrow">타순</div>${order.map((p,i)=>row(p,`${i+1}번 ${POSS[posOf[p.id]]||''}`)).join('')}
    <div class="eyebrow">선발 로테이션</div>${d.sp.map((p,i)=>row(p,`${i+1}선발`)).join('')}
    <div class="eyebrow">불펜</div>${d.pen.slice(0,7).map((p,i)=>row(p,i===0?'마무리':i<4?'필승조':'추격조')).join('')}
    <div class="eyebrow">벤치</div>${d.bench.slice(0,6).map(p=>row(p,POSS[p.pos]||posLabel(p))).join('')}
    ${fut.length?`<div class="eyebrow">2군 유망주</div>${fut.map(p=>row(p,posLabel(p))).join('')}`:''}
  </div></div>`; }

