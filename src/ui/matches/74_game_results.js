/* ---------- 경기 결과 정리 창 ----------
   스페이스바(다음 일까지)로 며칠을 넘기면 경기가 소식 한 통으로만 지나가서 와닿지 않았다.
   진행이 끝나면 그동안의 우리 경기를 한 장에 정리해 띄운다: 경기마다 점수·결승 장면·승패 투수·우리 팀 수훈 선수,
   그리고 그 기간 성적·순위 변화·잘한/부진한 선수·부상. 경기를 누르면 박스스코어, 확인(스페이스바)으로 닫는다.
   소식함의 경기 정리 소식에서 다시 열 수 있다(최근 경기 기록이 남아 있는 동안). */
/* 한 경기의 핵심: 결승 장면(이긴 팀이 마지막으로 앞서 나간 득점), 승·패·세이브 투수, 우리 팀 수훈 타자·선발 */
function gmKey(g){ const W=g.hs>g.as?'h':g.as>g.hs?'a':null; const all=[...g.box.h.pit,...g.box.a.pit]; const f=d=>all.find(q=>q.d===d);
  const w=f('승'), l=f('패'), s=f('세'); const dec=[w&&`승 ${w.n}`,l&&`패 ${l.n}`,s&&`세 ${s.n}`].filter(Boolean).join(' · ');
  let gw=null; if(W){ let prev=0; for(const e of (g.ev||[])){ if(!e.run)continue; const m=/(\d+):(\d+)\s*$/.exec(e.t); if(!m)continue; const ld=W==='h'?(+m[2])-(+m[1]):(+m[1])-(+m[2]); if(prev<=0&&ld>0)gw=e; prev=ld; } }
  const me=g.home===G.user?'h':'a'; const ms=g.box[me];
  const bt=[...ms.bat].sort((a,b)=>(b.h*2+b.hr*3+b.rbi*1.5)-(a.h*2+a.hr*3+a.rbi*1.5))[0]; const sp=ms.pit[0];
  return {dec,
    gw:gw?`${Math.floor(gw.h/2)+1}회${gw.h%2?'말':'초'} ${gw.t.replace(/\s*·\s*\d+:\d+\s*$/,'')}`:null,
    bat:bt&&bt.h?{id:bt.id,t:`${bt.n} ${bt.ab}타수 ${bt.h}안타${bt.hr?` ${bt.hr}홈런`:''}${bt.rbi?` ${bt.rbi}타점`:''}`}:null,
    sp:sp?{id:sp.id,t:`선발 ${sp.n} ${ipStr(sp.outs)}이닝 ${sp.er}실점${sp.so?` ${sp.so}삼진`:''}`}:null}; }
/* 기간 안의 우리 경기(최근 기록에 남은 것) */
function wkGames(from,to){ const L=[]; G.games.forEach((g,i)=>{ if(g.day>=from&&g.day<=to&&(g.home===G.user||g.away===G.user))L.push({g,i}); }); return L.sort((a,b)=>a.g.day-b.g.day); }
/* 잘한·부진한 선수: 진행 직전 기록(G.dig.snap)과 비교. 그 기간 정리가 아직 남아 있을 때만 */
function wkPlayers(D){ if(!D||!D.snap)return {hot:[],cold:[]}; const rows=[];
  for(const p of playersOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); if(!h)continue; const a=D.snap[p.id]||DIGK.map(()=>0); const d={}; DIGK.forEach((k,i)=>d[k]=(h[k]||0)-(a[i]||0));
    if(p.isP){ if(d.outs<3)continue; const era=d.er*27/d.outs; rows.push({p,isP:true,sc:(d.outs/3)*(4.5-era)/9+d.w*.3+d.sv*.3+d.hld*.15,t:`${ipStr(d.outs)}이닝 ${d.er}자책${d.w?` ${d.w}승`:''}${d.l?` ${d.l}패`:''}${d.sv?` ${d.sv}세이브`:''}${d.hld?` ${d.hld}홀드`:''}`}); }
    else { if(d.pa<4)continue; const ops=d.ab?obpOf(d)+(d.h+d.d+2*d.tr+3*d.hr)/d.ab:0; rows.push({p,isP:false,sc:(ops-.72)*d.pa/10+d.hr*.2,t:`${d.pa}타석 ${d.h}안타${d.hr?` ${d.hr}홈런`:''} ${d.rbi}타점 · OPS ${fmt3(ops)}`}); } }
  rows.sort((a,b)=>b.sc-a.sc); const B=rows.filter(x=>!x.isP), P=rows.filter(x=>x.isP);
  const hot=[...B.slice(0,2),...P.slice(0,1)].filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc); const cold=[B[B.length-1],P[P.length-1]].filter(x=>x&&x.sc<0&&!hot.includes(x));
  return {hot,cold}; }
function wkResSheet(){ const R=UI.wkres; const gs=wkGames(R.from,R.to); if(!gs.length){ UI.wkres=null; return ''; }
  const w=gs.filter(x=>x.g.res==='승').length, l=gs.filter(x=>x.g.res==='패').length, t=gs.length-w-l;
  const st=(()=>{ try{ return standingsNow(); }catch(e){ return []; } })(); const rk=st.findIndex(x=>x.tid===G.user)+1; const me=st[rk-1], top=st[0];
  const gb=me&&top&&rk>1?((top.w-me.w)+(me.l-top.l))/2:0; const post=gs.some(x=>/차전/.test(x.g.kind||''));
  const D=G.dig&&G.dig.from===R.from&&G.dig.to===R.to?G.dig:null; const {hot,cold}=wkPlayers(D);
  const rkLine=post?'':R.rk0&&rk?(rk<R.rk0?`${R.rk0}위 → <b class="good">${rk}위</b>`:rk>R.rk0?`${R.rk0}위 → <b class="bad">${rk}위</b>`:`${rk}위 유지`):rk?`${rk}위`:'';
  const title=gs.length===1?(w?'승리':l?'패배':'무승부'):w>l?'좋은 흐름':w<l?'아쉬운 결과':'반타작';
  const row=({g,i})=>{ const home=g.home===G.user; const op=home?g.away:g.home; const ms=home?g.hs:g.as, os=home?g.as:g.hs; const k=gmKey(g);
    return `<div class="wk-g ${g.res==='승'?'w':g.res==='패'?'l':''}">
      <div class="wk-top"><span class="wk-d">${dsh(g.day)} ${WD[dobj(g.day).w]}${g.kind?` · ${esc(g.kind)}`:''}</span><span class="pill ${g.res==='승'?'good':g.res==='패'?'bad':''}">${g.res}</span>${badge(op,22)}<b class="wk-op">${home?'vs':'@'} ${esc(tname(op))}</b><span class="num wk-sc">${ms} : ${os}</span><button class="btn small" data-a="openGame" data-v="${i}">박스스코어</button></div>
      ${k.gw?`<p class="wk-gw"><span class="eyebrow">결승</span> ${esc(k.gw)}</p>`:''}
      <p class="small muted">${esc(k.dec)}</p>
      <p class="small wk-us">${k.bat?`<button class="lnk" data-a="player" data-v="${k.bat.id}">${esc(k.bat.t)}</button>`:''}${k.bat&&k.sp?' · ':''}${k.sp?`<button class="lnk" data-a="player" data-v="${k.sp.id}">${esc(k.sp.t)}</button>`:''}</p></div>`; };
  const li=x=>`<button class="dg-p" data-a="player" data-v="${x.p.id}">${avImg(x.p)}<span><b>${esc(x.p.name)}</b><i>${posLabel(x.p)} · ${esc(x.t)}</i></span></button>`;
  const inj=playersOf(G.user).filter(p=>p.injOut>=5).slice(0,4);
  const sr=G.sea&&G.sea.rec&&G.sea.rec[G.user];
  return `<div class="scrim" data-a="wkClose"><div class="sheet gut wkres" data-stop="1" role="dialog" aria-label="경기 결과">
    <div class="sheet-head"><div><div class="eyebrow">경기 결과 · ${dmd(gs[0].g.day)}${gs.length>1?` ~ ${dmd(gs[gs.length-1].g.day)}`:''} · ${gs.length}경기</div><h2 class="sec">${title} · ${w}승 ${l}패${t?` ${t}무`:''}</h2></div><button class="x" data-a="wkClose" aria-label="닫기">×</button></div>
    ${!post&&sr?`<div class="wk-sum"><span>시즌 <b>${sr.w}승 ${sr.l}패${sr.t?` ${sr.t}무`:''}</b></span>${rkLine?`<span>순위 ${rkLine}</span>`:''}${rk>1?`<span>1위와 <b>${gb}</b>경기 차</span>`:rk===1&&st[1]?`<span>2위와 <b>${((me.w-st[1].w)+(st[1].l-me.l))/2}</b>경기 차</span>`:''}</div>`:''}
    <div class="wk-list">${gs.map(row).join('')}</div>
    ${hot.length?`<div class="eyebrow">이 기간 잘한 선수</div><div class="dg-ps">${hot.map(li).join('')}</div>`:''}
    ${cold.length?`<div class="eyebrow">이 기간 부진한 선수</div><div class="dg-ps">${cold.map(li).join('')}</div>`:''}
    ${inj.length?`<p class="small">부상: ${inj.map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button>(${esc(injNow(p))}, ${p.injOut}일)`).join(', ')}</p>`:''}
    <div class="wk-acts"><button class="btn primary" data-a="wkClose">확인 (Space)</button><button class="btn" data-a="wkStand">순위 보기</button></div>
  </div></div>`; }
Object.assign(A,{
  wkClose(){ UI.wkres=null; renderSheet(); },
  wkStand(){ UI.wkres=null; A.go('league:stand'); },
  /* 소식함의 경기 정리 소식에서 다시 열기: v = "시작일:끝일" */
  wkOpen(v){ const [f,t]=String(v).split(':').map(Number); if(!wkGames(f,t).length){ toast('그 기간 경기 기록이 더는 남아 있지 않습니다. 리그 → 일정·결과에서 볼 수 있습니다.'); return; } closeSheets(); UI.wkres={from:f,to:t,rk0:null}; renderSheet(); }
});
