/* ===== 래더 v3 화면 조각(사용자 11-17 "레더랑 대회 쪽 유아이랑 시스템 제대로 더 개선해야하고", "컴프매처럼 좀 재미있게") =====
   설계: docs/design/ladder-cup-v3-2026-11-17.md. 페이지 짜기는 02_uladder_pages.js, 여기는 v3에서 더한 조각:
   결과 공개 카드(순위·승강·점수·MVP·목표 진척) · 우리 연전 카드 · 리그 시작 직후 상대 9팀 · 매일·주간 목표와 꾸미기(테두리·칭호) · 시즌 결산 · 점수표 표 · 붙어 보기(친선 3경기) */
/* 탭으로 나뉜 글(점수표·타자·투수)을 표로. 탭이 없는 줄은 한 칸 전체(제목 줄) */
function ulTabTbl(txt){ const L=String(txt||'').split('\n').filter(x=>x.trim()); if(!L.some(x=>x.includes('\t')))return `<pre class="ul-pre">${esc(txt||'')}</pre>`; const n=Math.max(...L.map(x=>x.split('\t').length));
  return `<div class="ul-tw ul-box"><table class="ul-st ul-bx">${L.map((x,i)=>{ const c=x.split('\t'); return c.length<2?`<tr class="ul-bxh"><td colspan="${n}">${esc(x)}</td></tr>`:`<tr${i===0||/^팀/.test(c[0])?' class="ul-bxh"':''}>${c.map((v,j)=>`<td${j?' class="num"':''}>${esc(v.trim())}</td>`).join('')}</tr>`; }).join('')}</table></div>`; }
/* 꾸미기(테두리·칭호): 매일·주간 목표 도장으로만 생긴다 */
const ulCos=U=>FrontOfficeCore.ulCosmetic(U&&U.gl);
function ulEmbF(U,t,sz){ const c=ulCos(U); return `<span class="ul-fr ul-fr${c.frame}" title="${esc(c.frameName||'')}">${ulEmblem(t,sz)}</span>`; }
const ulTitleOf=U=>{ const T=ulCos(U).titles.filter(x=>x.on); return T.length?T[T.length-1].n:''; };
/* 매일·주간 목표 카드 */
function ulGoalsHtml(U){ const C=FrontOfficeCore, now=Date.now(), D=C.ulDailyGoals(U.hist,now), W=C.ulWeeklyGoals(U.hist,now,U.tier), g=Object.assign({ds:0,ws:0},U.gl), c=ulCos(U), dId=C.ulDayId(now), wId=C.ulWeekId(now);
  const row=m=>`<div class="ul-m${m.done?' done':''}"><span>${m.done?'✔':'○'}</span><b>${esc(m.n)}</b><em class="num">${m.cur}/${m.goal}</em><i class="ul-pbar"><i style="width:${Math.round(m.cur/m.goal*100)}%"></i></i></div>`;
  const left=ms=>{ const h=Math.max(0,Math.floor(ms/36e5)); return h>=24?`${Math.floor(h/24)}일 ${h%24}시간`:`${h}시간 ${Math.max(0,Math.floor(ms%36e5/6e4))}분`; };
  const dEnd=(dId+1)*C.UL_DAY-C.UL_KST, wEnd=(wId+1)*7*C.UL_DAY+4*C.UL_DAY-C.UL_KST;
  return `<section class="card ul-goals"><h2 class="sec">오늘의 목표 <small>${D.filter(x=>x.done).length}/3${g.dd===dId?' · 도장 받음':''}</small></h2><div class="ul-ms">${D.map(row).join('')}</div><p class="small muted">${left(dEnd-now)} 뒤 바뀝니다. 셋 다 채우면 도장 1개.</p>
    <p class="dk-t">이번 주 목표 <small>${W.filter(x=>x.done).length}/3${g.wd===wId?' · 도장 받음':''}</small></p><div class="ul-ms">${W.map(row).join('')}</div><p class="small muted">월요일 0시에 바뀝니다(${left(wEnd-now)} 남음). 다 채우면 도장 3개 몫.</p>
    <div class="ul-cos">${ulEmbF(U,U.tier|0,40)}<div><p class="small">도장 <b class="num">${g.ds}</b>(매일) · <b class="num">${g.ws}</b>(주간) · 점수 <b class="num">${c.score}</b>${c.frameName?` · <b>${esc(c.frameName)}</b>`:''}</p>
      <p class="small muted">${c.next?`${esc(c.next.name)}까지 ${c.next.need}점`:'모든 테두리를 모았습니다'} · 보상은 꾸미기뿐입니다(문장 테두리·칭호).</p></div></div>
    <div class="ul-bgs">${c.titles.map(x=>`<span class="ul-bg${x.on?' on':''}">${esc(x.n)}</span>`).join('')}</div></section>`; }
/* 시즌 결산: 시즌이 바뀐 뒤 처음 들어오면 지난 시즌 카드 한 번('확인'을 누르면 접는다) */
function ulSeasonEndHtml(U){ const C=FrontOfficeCore, se=C.ulSeason(Date.now()), S=U.seas&&U.seas.id!==se.id?U.seas:null; if(!S||U.seenS===S.id)return '';
  const tt=[S.win?'리그 우승':'',S.up?`승격 ${S.up}번`:'',`최고 ${C.ulTierName(S.best)}`].filter(Boolean), M=ulV1On()&&UL.sv.me, T=((M&&M.titles)||[]).filter(t=>t.s===S.id);
  return `<section class="card ul-send"><h2 class="sec">지난 시즌 결산 <small>${esc(S.label)}</small></h2><div class="ul-send-in">${ulEmblem(S.best|0,56)}<div><p class="ul-send-t"><b>${esc(C.ulTierName(S.best))}</b>까지 올랐습니다</p><p class="small">${esc(tt.join(' · '))}</p></div></div>
    <div class="ul-sc"><div><span>리그</span><b class="num">${S.n}</b></div><div><span>최고 점수</span><b class="num">${S.top}</b></div><div><span>승-패</span><b class="num">${S.w||0}-${S.l||0}</b></div><div><span>평균 순위</span><b class="num">${S.n&&S.rk?(S.rk/S.n).toFixed(1):'-'}</b></div></div>
    ${T.length?`<div class="ul-bgs">${T.map(t=>`<span class="ul-bg on">시즌 ${t.s} ${esc(C.ulTierName(t.tier))} ${t.rank}위</span>`).join('')}</div>`:''}<p class="small muted">단계는 그대로 이어집니다. 새 시즌 목표·순위는 처음부터 셉니다.</p><div class="btns"><button class="btn small" data-a="ulSeenS" data-v="${S.id}">확인</button></div></section>`; }
/* 리그 시작 전 미리보기(로비): 이 단계 상대 전력과 내 덱 비교 */
function ulPreviewHtml(U){ const C=FrontOfficeCore, t=U.tier|0, my=U.deck&&U.deck.e.ovr; if(!my)return ''; const M=ulMetaFor(t), avg=M&&M.agg&&M.agg.n?M.agg.t.avg:0, n=M&&M.agg?M.agg.n:0, ai=C.UL_TIER_OVR[t], ref=avg||ai, d=Math.round(((my.t||0)-ref)*10)/10;
  return `<div class="ul-prev"><p class="dk-t">이번 리그 상대 미리보기</p><p class="small">${n?`${M.src==='srv'?'서버':'이 기기에서 만난'} ${esc(C.ulTierName(t))} 덱 ${n}개 평균 OVR <b class="num">${avg}</b> · `:''}AI 구단 기준 <b class="num">${ai}</b>(±2) · 우리 <b class="num">${my.t}</b></p>
    <p class="small ${d>=1?'ul-up':d<=-1?'ul-dn':''}">${d>=2?'평균보다 셉니다. 승격을 노릴 만합니다.':d>=-1?'비슷한 전력입니다. 공은 둥그니까 해 봐야 압니다.':'평균보다 약합니다. 덱을 다듬으면 잔류가 쉬워집니다.'}</p></div>`; }
/* 리그 시작 직후(0라운드): 상대 9팀을 전력 순으로 */
function ulRosterHtml(L){ const C=FrontOfficeCore, R=L.teams.map((t,i)=>({t,i,o:(t.e.ovr&&t.e.ovr.t)||0})).sort((a,b)=>b.o-a.o), me=R.findIndex(x=>x.i===0)+1;
  return `<div class="ul-next ul-ros"><p class="dk-t">이번 리그 10팀 · 전력 순</p><p class="small">우리 덱은 OVR로 <b>${me}번째</b>입니다. ${me<=2?'승격 후보입니다.':me>=9?'강등권 전력입니다. 덱을 다듬어 보세요.':'중위권 전력입니다.'}</p>
    ${R.map((x,k)=>`<p class="small ul-rr${x.i===0?' me':''}"><span class="num">${k+1}</span><button class="lnk" data-a="ulOpp" data-v="${x.i}">${esc(x.t.name)}</button> <span class="ul-k ul-k-${x.t.kind}">${ulKind(x.t)}</span><b class="num">${C.cupOvrTxt(x.t.e.ovr)}</b></p>`).join('')}</div>`; }
/* 우리 연전 카드: 마지막 우리 연전 3경기(처음 그릴 때만 차례로 나타난다) */
function ulSeriesHtml(L){ const x=L.series.filter(s=>s.a===0||s.b===0).slice(-1)[0]; if(!x)return ''; const mine=x.a===0, op=L.teams[mine?x.b:x.a], G3=x.g.map(g=>{ const a=mine?g[0]:g[1], b=mine?g[1]:g[0]; return {a,b,inn:g[2],walk:g[3]}; });
  const w=G3.filter(g=>g.a>g.b).length, l=G3.filter(g=>g.a<g.b).length, an=UL.rv===x.id?' ul-anim':'';
  return `<div class="ul-ser${an} ${w>l?'win':l>w?'loss':''}"><p class="dk-t">${x.r}라운드 우리 연전 · vs ${esc(op.name)}</p><div class="ul-g3">${G3.map((g,i)=>`<span class="ul-g ${g.a>g.b?'w':g.a<g.b?'l':'t'}" style="--d:${i*.25}s"><em>${i+1}차전</em><b class="num">${g.a}:${g.b}</b><small>${g.a>g.b?'승':g.a<g.b?'패':'무'}${g.walk?' · 끝내기':g.inn>9?` · ${g.inn}회`:''}</small></span>`).join('')}</div>
    <p class="ul-serr"><b>${w}승 ${l}패${G3.length-w-l?` ${G3.length-w-l}무`:''}</b> ${w===3?'· 싹쓸이!':w>l?'· 위닝 시리즈':l===3?'· 스윕패':l>w?'· 루징 시리즈':''}</p></div>`; }
/* 결과 공개 카드(리그 탭, 리그가 끝난 뒤): 순위 · 승강 · 점수 · MVP · 목표 진척 · 다음 리그 */
function ulResultCard(U,R){ const C=FrontOfficeCore, S=C.ulSummary(U.hist,U.tier,U.car), L=U.league, T=C.ulTierName(U.tier), an=UL.reveal===R.id?' ul-anim':'', se=C.ulSeason(Date.now());
  const lab=R.move==='up'?'승격!':R.move==='down'?'강등':'잔류', mv=R.move==='up'?`<b class="ul-up">${C.ulTierName(R.to)} 승격</b>`:R.move==='down'?`<b class="ul-dn">${C.ulTierName(R.to)} 강등</b>`:`${C.ulTierName(R.to)} 잔류`;
  const badge=`<div class="ul-badge ul-b-${R.move}"><span class="ul-rvf">${ulEmblem(R.tier,44)}</span>${R.move!=='stay'?`<span class="ul-arrow">${R.move==='up'?'▲':'▼'}</span><span class="ul-rvt">${ulEmblem(R.to,52)}</span>`:''}<span class="ul-rvl"><b>${lab}</b><span class="small">${esc(C.ulTierName(R.tier))}${R.move!=='stay'?` → ${esc(C.ulTierName(R.to))}`:''}</span></span></div>`;
  const pts=R.pts!=null?`<span class="ul-chip"><small>리그 점수</small><b class="num">${R.pts}</b></span>`:'', sp=R.srv&&!R.srv.queued?`<span class="ul-chip"><small>서버 시즌 포인트</small><b class="num">+${R.srv.delta}</b></span>`:'';
  const SS=U.seas&&U.seas.id===R.season?U.seas:null, best=SS&&R.pts!=null&&R.pts>=SS.top?'<span class="ul-chip hot"><small>시즌 최고</small><b>갱신</b></span>':'';
  const mm=R.myMvp, mp=mm&&U.deck?(U.deck.e.P||[]).find(p=>String(p.id)===String(mm.key).split(':')[1]):null, f=mp?cupFaceOf(mp,U.deck.e):null;
  const mvp=mm?`<div class="ul-mvp">${f?`<img class="dk-f" src="${esc(f)}" alt="" loading="lazy">`:'<span class="dk-f dk-f0"></span>'}<div><p class="dk-t">우리 MVP</p><p><b>${esc(mm.name)}</b></p><p class="small ul-dim">${esc(mm.txt)}</p></div></div>`:'';
  const ms=C.ulMissions(U.seas,U.hist,se.id,U.tier), md=ms.filter(m=>m.done).length, gl=R.gl||{}, gn=gl.ms1!=null&&gl.ms0!=null?gl.ms1-gl.ms0:0, D=C.ulDailyGoals(U.hist,Date.now()), dd=D.filter(x=>x.done).length;
  const prog=`<div class="ul-rvp"><div><span class="small">시즌 목표 <b>${md}/${ms.length}</b>${gn>0?` <b class="ul-up">+${gn}</b>`:''}</span><i class="ul-pbar"><i style="width:${md/ms.length*100}%"></i></i></div><div><span class="small">오늘의 목표 <b>${dd}/3</b>${gl.day?' <b class="ul-up">도장!</b>':''}${gl.week?' <b class="ul-up">주간 도장!</b>':''}</span><i class="ul-pbar"><i style="width:${dd/3*100}%"></i></i></div></div>`;
  const gift=[gl.frame?`<span class="ul-bg on">새 테두리 · ${esc(gl.frame)}</span>`:'',...(gl.titles||[]).map(n=>`<span class="ul-bg on">새 칭호 · ${esc(n)}</span>`)].join('');
  return `<section class="card ul-rv ul-rv-${R.move}${an}"><h2 class="sec">${C.ulTierName(R.tier)} 리그 결과</h2>
    <div class="ul-rvtop"><div class="ul-rvrank"><b class="num">${R.rank}</b><span>위</span></div><div class="ul-rvmid">${badge}<p class="ul-res">${R.w}승 ${R.l}패 ${R.t}무 · ${mv}${R.rank===1?' · <b>리그 우승</b>':''}</p></div></div>
    <div class="ul-chips2">${pts}${sp}${best}${R.srv&&R.srv.queued?(R.srv.mem?'<span class="small ul-dn">기기 저장 공간이 모자라 결과를 이번 실행 동안만 들고 있습니다. 게임을 닫기 전에 연결되면 보냅니다(저장 공간을 비워 주세요).</span>':'<span class="small">서버에 연결되지 않아 결과를 이 기기에 두었습니다. 다음 연결 때 차례로 보냅니다.</span>'):''}${R.kv==='fail'?'<span class="small ul-dn">단계를 서버에 맞추지 못했습니다. <button class="lnk small" data-a="ulKvRetry">다시 보내기</button></span>':R.kv==='sending'?'<span class="small">단계를 서버에 맞추는 중입니다.</span>':''}</div>
    ${R.srv&&!R.srv.queued?`<p class="small ul-srv">서버 시즌 포인트 +${R.srv.delta}${R.srv.points?` (이번 시즌 ${R.srv.points})`:''} · 서버 단계 <b>${C.ulTierName(R.srv.tier)}</b> <button class="lnk small" data-a="ulGoPg" data-v="rank">순위 보기</button></p>`:''}
    ${mvp}${R.mvp?`<p class="small">시즌 MVP <b>${esc(R.mvp.name)}</b>(${esc(R.mvp.team)}) ${esc(R.mvp.txt)}</p>`:''}${prog}${ulNewBadges(U)}${gift?`<p class="ul-newb">${gift}</p>`:''}
    <p class="small ul-dim">내 최고 단계 <b>${C.ulTierName(S.best)}</b>${S.stay?` · 이 덱 ${C.ulTierName(S.stay.tier)} ${S.stay.n}리그째`:''} · 지금까지 ${S.leagues}리그${R.rs!=null?` · 득실 ${R.rs}-${R.ra}`:''} · 상대 유저 ${R.src.user} · 우승 덱 ${R.src.cup} · AI ${R.src.ai}${R.edits?` · 덱 고침 ${R.edits}번`:''}</p>${ulMsgHtml()}
    <div class="btns ul-again"><button class="btn primary ul-big" data-a="ulStart"${UL.busy||!U.deck||L?' disabled':''}>다음 리그 · ${T} 리그 시작</button><button class="btn" data-a="ulGoPg" data-v="deck">덱 고치고 시작</button></div></section>`; }
/* 붙어 보기(친선 3경기): 상태는 UL.ex = {res, k(어디서 눌렀나), v} */
function ulMyDeckForEx(){ const U=uld(); if(U&&U.deck)return U.deck.e; try{ if(G&&!G.unemp)return cupEntryNow({name:team(G.user).nick}); }catch(e){} return null; }
function ulExHtml(where){ const X=UL.ex; if(!X||X.where!==where)return ''; const r=X.res;
  return `<div class="ulx ul-exw"><section class="card ul-ex"><h2 class="sec">붙어 보기 <small>친선 3경기 · 기록에 남지 않음</small></h2><p class="ul-exh"><b>${esc(r.a)}</b> <span class="num">${FrontOfficeCore.cupOvrTxt(r.oa)}</span> <b class="num ul-exs">${r.wa}-${r.wb}${r.t?`-${r.t}`:''}</b> <b>${esc(r.b)}</b> <span class="num">${FrontOfficeCore.cupOvrTxt(r.ob)}</span></p>
    <p class="small ${r.wa>r.wb?'ul-up':r.wb>r.wa?'ul-dn':''}">${r.wa>r.wb?'우리 덱이 이겼습니다.':r.wb>r.wa?'우승 덱이 한 수 위였습니다.':'팽팽했습니다.'} 다시 붙으면 결과가 달라집니다(공은 둥그니까).</p>
    ${ulKeysHtml(r.keys,'ex').replace('명경기 · 이 경기 보기','경기 보기').replace(/ <span class="muted">\d+R<\/span>/g,'')}<div class="btns"><button class="btn small primary" data-a="ulEx" data-k="${esc(X.k)}" data-v="${esc(X.v)}"${UL.busy?' disabled':''}>다시 붙기</button><button class="btn small" data-a="ulExClose">닫기</button></div></section></div>`; }
function ulExTarget(k,v){ if(k==='hof'){ const c=(HOF.data&&HOF.data.cups||[]).find(x=>x.id===v); return c&&c.champ&&c.champ.deck?Object.assign({},c.champ.deck,{name:c.champ.deck.name||c.champ.name}):null; } const d=ulDecks().find(x=>x.h===v); return d?d.e:null; }
Object.assign(A,{
  ulSeenS(v){ const U=uld(); if(U){ U.seenS=+v; ulSave(); render(); } },
  ulRun3(){ return ulSim(3); },
  async ulEx(v,el){ if(UL.busy)return; const k=(el&&el.dataset.k)||'dk', me=ulMyDeckForEx(), op=ulExTarget(k,v); if(!me)return toast('구단을 맡고 있을 때 붙어 볼 수 있습니다.'); if(!op)return toast('이 덱을 찾지 못했습니다.');
    UL.busy=true; toast('친선 3경기를 돌리는 중입니다.'); await new Promise(r=>setTimeout(r,30)); let r; try{ r=ulExhibit(me,op); }catch(e){ console.error(e); r={ok:false,msg:'경기를 돌리지 못했습니다.'}; } UL.busy=false;
    if(!r.ok){ toast(r.msg); return render(); } UL.ex={res:r,k,v,where:UI.tab==='uld'?'ul':'cup'}; UL.view=null; render(); try{ const el2=document.querySelector('.ul-ex'); if(el2)el2.scrollIntoView({block:'nearest',behavior:'smooth'}); }catch(e){} },
  ulExClose(){ UL.ex=null; render(); },
});
