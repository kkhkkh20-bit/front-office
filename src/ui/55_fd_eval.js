/* ---------- 창단 드래프트: 지명 직후에는 추정만, 평가는 나중에 ---------- */
/* 드래프트가 진행되는 동안 이미 지명된 선수(우리·다른 구단)는 능력을 공개하지 않는다 */
let _fdAllSet=null;
function fdAllSet(){ const F=G.fd; if(!F)return new Set(); const k=F.y+':'+(F.all||[]).length; if(!_fdAllSet||_fdAllSet.k!==k){ _fdAllSet=new Set(F.all||[]); _fdAllSet.k=k; } return _fdAllSet; }
function fdHideNow(p){ return false; } /* 우리가 지명한 선수는 바로 현재 능력이 보인다(매일 보는 코치진이 안다). 다른 구단 지명 선수는 드래프트가 끝날 때까지 숨긴다. 잠재력은 누구든 추정 */
/* 우리 스카우트 추정(원래 능력 단위): 지명 때 남긴 값 우선 */
function fdEstOf(p){ if(!p||!G.fd)return null; const pk=G.fd.picks.find(x=>x.pid===p.id); if(pk&&pk.e0!=null)return pk.e0; try{ return fdSeenBy(G.user,p).sc; }catch(e){ return null; } }
/* 추정 등급 칩: 숫자 대신 등급 글자. 실제 능력이 아니라 우리 스카우트가 본 값 */
function fdEstChip(v){ return v==null?rchip(null):`<b class="rc fde-g" style="--c:${rcol(v)}" title="우리 스카우트 추정 등급. 실제 능력과 다를 수 있습니다">${GRD(v)}</b>`; }

/* 지명 직후 카드: 스카우트 평가(툴 등급·오차)와 능력 추정 범위, 예상 역할. 실제 능력·순위·잘 뽑았는지는 말하지 않는다 */
function revMake(pid,pk,n){ const p=G.players[pid]; if(!p)return null; return {pid,rd:pk.rd,no:pk.no,n,open:true}; }
function revView(){ const R=UI.rev; if(!R)return ''; const p=G.players[R.pid]; if(!p){ UI.rev=null; return ''; }
  const S=fdScoutTools(p); const vis=new Set(FD_TOOLS[p.isP?'P':'B'].filter(t=>t[2]).map(t=>t[0]));
  const pk=fdPickOf(p.id); const r=fdRange(p); const est=fdEstOf(p); const role=(pk&&pk.role)||fdRole(p,est);
  const tl=`${p.isP?`<span class="fde-t"><i>구속</i><b>${S.velo}</b><em>km</em></span>`:''}${S.L.map(t=>`<span class="fde-t${vis.has(t.k)?'':' fz'}"><i>${t.l}</i><b style="color:${rcol(t.v)}">${t.g}</b><em>${vis.has(t.k)?'':'오차 큼'}</em></span>`).join('')}`;
  const dl=fdDataLine(p,(G.fd&&G.fd.y||G.year)-1);
  return `<div class="rv-w"><div class="rv fde-rv">
    <div class="eyebrow">${R.rd}라운드 ${R.no}번째 · 전체 ${R.n}순위 지명</div>
    <div class="row" style="flex-wrap:nowrap">${avImg(p,true)}<div><h2 class="sec" style="font-size:22px">${esc(p.name)}</h2><p class="small muted">${posLabel(p)} · ${p.age}세${p.fdFrom!=null?` · 전 ${esc(tshort(p.fdFrom))}`:''} · 연봉 ${money(p.sal||0)}</p></div></div>
    <div><div class="eyebrow">스카우트 평가</div><div class="fde-ts">${tl}</div></div>
    <div class="fde-bx"><div><span>현재 능력</span><b style="color:${rcol(ovr(p))}">${dv(ovr(p))} <small>${GRD(ovr(p))}</small></b><i>지명과 함께 공개</i></div><div><span>지명 때 추정</span><b>${(()=>{ const e=fdEstOf(p); const w=fdEsd()*1.15+.8; return e==null?'-':`${dv(e-w)}~${dv(e+w)}`; })()}</b><i>우리 스카우트</i></div><div><span>예상 역할</span><b class="fde-role">${esc(role)}</b><i>추정 기준</i></div></div>
    <p class="small"><b>스카우트</b> ${esc(fdScoutLine(p))}</p>
    <p class="small"><b>데이터팀</b> ${esc(dl)}</p>
    <p class="small muted">능력 63이 1군 평균, 69가 주전급입니다. 우리 선수가 되면 현재 능력은 바로 보입니다. 잠재력은 여전히 추정입니다. 7월 1일 중간 평가와 정규시즌 뒤 평가에서 이 지명을 돌아봅니다.</p>
    <button class="btn primary block" data-a="revClose">계속</button>
  </div></div>`; }

/* 창단 지명 평가: 우리 지명 선수별 지명 때 추정 → 지금 코치진 평가 범위, 올해 기록, 중간·첫해 평가 */
function fdEvalView(){ const F=G.fd; if(!F||!F.done)return csec('창단 지명 평가','<p class="small muted">창단 드래프트가 끝나면 볼 수 있습니다.</p>');
  const E=G.fdEval||{}; const ev=E.end||E.mid||null; const isEnd=!!E.end; const Rm=new Map(ev?ev.rows.map(r=>[r.pid,r]):[]);
  const L=F.picks.filter(x=>x.tid===G.user&&x.pid&&G.players[x.pid]).map(x=>({x,p:G.players[x.pid]}));
  const w0=fdEsd()*1.15+.8;
  const head=ev?`${isEnd?`${ev.y} 정규시즌 뒤 첫해 평가`:`${ev.y} 7월 1일 중간 평가`} 기준입니다. 같은 순번대(앞뒤 8순번) 지명자들이 그해 1군에서 낸 WAR과 비교했습니다.${isEnd?'':' 첫해 평가는 정규시즌이 끝난 다음 날 나옵니다.'}`
    :`아직 평가 전입니다. 중간 평가는 ${F.y}년 7월 1일, 첫해 평가는 정규시즌이 끝난 다음 날 나옵니다. 지명 때 스카우트 추정과 지금 현재 능력을 비교해 보세요.`;
  const sum=ev?`<dl class="tsum"><div><dt>우리 지명 WAR 합</dt><dd class="num">${ev.tot.toFixed(1)}</dd></div><div><dt>10개 구단 중</dt><dd class="num">${ev.rk||'-'}위</dd></div><div><dt>기대 이상</dt><dd class="num">${ev.rows.filter(r=>r.k==='good').length}명</dd></div><div><dt>기대 이하</dt><dd class="num">${ev.rows.filter(r=>r.k==='bad').length}명</dd></div></dl>`:'';
  const row=({x,p})=>{ const e0=fdE0(p,x); const r=fdRange(p); const ev1=Rm.get(p.id); const s=fdSample(p); const w=fdWarY(p,F.y,G.user);
    const play=p.isP?(s.outs1?`${ipStr(Math.round(s.outs1))}이닝`:'1군 등판 없음'):(s.pa1?`${Math.round(s.pa1)}타석`:'1군 출전 없음');
    const v=ev1?`<span class="pill ${ev1.k==='good'?'good':ev1.k==='bad'?'bad':''}">${ev1.k==='good'?'기대 이상':ev1.k==='bad'?'기대 이하':'순번만큼'}</span>`:'<span class="pill">평가 전</span>';
    return `<div class="fde-r"><div class="fde-m"><button class="lnk" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b></button> <span class="small muted">${x.rd}라운드 ${x.no}번째 · ${posLabel(p)}${x.auto?' · 스카우트 맡김':''}${p.team!==G.user?` · 지금 ${esc(tshort(p.team))}`:''}</span>
      <span class="small">지명 때 추정 ${dv(e0-w0)}~${dv(e0+w0)} · ${esc(x.role||fdRole(p,e0))}</span>
      <span class="small">현재 능력 <b>${fdRangeTxt(r)}</b></span>
      <span class="small muted">${F.y} 1군 ${play} · 우리 팀 WAR ${w.toFixed(1)}${ev1?` · 같은 순번대 중앙값 ${ev1.med.toFixed(1)}`:''}</span>${ev1?`<span class="small ${ev1.k==='good'?'good':ev1.k==='bad'?'bad':''}">${esc(ev1.t)}</span>`:''}</div>${v}</div>`; };
  const st=ev&&ev.steal?`<p class="small muted">다른 구단 포함 최고의 스틸: <button class="lnk" data-a="player" data-v="${ev.steal.pid}">${esc(ev.steal.nm)}</button>(${esc(tshort(ev.steal.tid))} ${ev.steal.rd}라운드) WAR ${ev.steal.w.toFixed(1)}</p>`:'';
  return csec('창단 지명 평가',`<p class="small sdesc">${head}</p>${sum}${st}<div class="fde-l">${L.map(row).join('')}</div>`); }

Object.assign(A,{
  fdEvalGo(){ UI.it=UI.it||{}; UI.it.dr='fd'; A.go('transfer:draft'); }
});
