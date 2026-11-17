/* ===== 스카우트 > 지역 정보망: 한국 지도(9권역) · 권역별 고교 · 후보 (사용자 11-08) ===== */
/* 지도: 통계청 시도 경계를 9권역으로 묶은 경로(00g_korea_map.js). 글자 자리만 손으로 옮긴 권역이 있다 */
const KMAP_LBL={'인천·경기':[113,75],'서울':[99,57]};
const netCol=v=>v>=75?'#2a8a3c':v>=55?'#7aa630':v>=35?'#c9a428':v>=20?'#c96526':'#7a2f2a';
function scoutMapSVG(S,sel){ const ord=[...S].sort((a,b)=>(a.k===sel)-(b.k===sel)||(a.k==='서울')-(b.k==='서울')); /* 고른 권역 테두리가 위로, 서울은 경기 위에 */
  return `<svg class="scm-svg" viewBox="0 0 ${KMAP.w} ${KMAP.h}" role="img" aria-label="권역별 스카우트 정보망 지도">${ord.map(a=>{ const m=KMAP.a[a.k]; if(!m)return ''; const on=sel===a.k, col=netCol(a.net), c=KMAP_LBL[a.k]||m.c, sm=a.k==='서울';
    return `<g class="scm-a${on?' on':''}" data-a="scArea" data-v="${esc(a.k)}">${m.p.map(d=>`<path d="${d}" fill-rule="evenodd" fill="${col}" fill-opacity="${on?1:.85}" stroke="${on?'#fff':col}" stroke-width="${on?1.1:.6}" stroke-linejoin="round"/>`).join('')}</g>`; }).join('')}
    ${ord.map(a=>{ const m=KMAP.a[a.k]; if(!m)return ''; const c=KMAP_LBL[a.k]||m.c, sm=a.k==='서울', home=a.home;
      return `<g class="scm-l" pointer-events="none">${home?`<circle cx="${c[0]}" cy="${c[1]-(sm?10:17)}" r="3" fill="#fff" stroke="#0b1014"/>`:''}<text x="${c[0]}" y="${c[1]-(sm?2:3)}" class="scm-n${sm?' sm':''}">${esc(a.k==='부산·울산·경남'?'부울경':a.k)}</text><text x="${c[0]}" y="${c[1]+(sm?6:9)}" class="scm-v${sm?' sm':''}">${a.net}</text></g>`; }).join('')}</svg>`; }
/* 관찰 범위(사용자 11-17 "어느 선수까지 체크할지 보여야"): 권역 × 학년마다 우리 스카우트가 한 번이라도 본 선수 / 전체(부원 포함) */
let _covC=null;
function obsCoverage(){ const k=G.year+':'+G.day+':'+(G.scouts||[]).length; if(_covC&&_covC.g===G&&_covC.k===k)return _covC.r; const Y=G.year, U=amPipe().L, me=G.user;
  const r=AREA.map(a=>{ const C={1:[0,0,0],2:[0,0,0],3:[0,0,0],c:[0,0,0]}; const add=(g,n)=>{ const o=C[g]; o[1]++; if(n>0)o[0]++; if(n>=5)o[2]++; };
    for(const e of Object.values(U))if(e.a===a.k){ const g=amGrade(e,Y); if(g>=1&&g<=(e.c?4:3))add(e.c?'c':g,obsCount(e,me)); }
    for(const id of G.draftClass||[]){ const p=G.players[id]; if(p&&p.prospect&&!p.ovsRet&&p.area===a.k)add(p.college?'c':3,obsCount(p,me)); }
    for(const [n,lv] of [...a.hs.map(x=>[x,'hs']),...a.un.map(x=>[x,'col'])])for(const f of amFill(n,Y,lv,amLvOf(n)))add(lv==='col'?'c':f.gr,amFObs(n,f.ey,f.id,me));
    return {k:a.k,C}; });
  _covC={g:G,k,r}; return r; }
function obsCovTbl(sel){ const R=obsCoverage(); const cell=o=>{ const q=o[1]?o[0]/o[1]:0; return `<td class="${q<.2?'c0':q<.6?'c1':'c2'}" title="본 선수 ${o[0]}명 · 5회 이상 ${o[2]}명 · 전체 ${o[1]}명">${o[0]}/${o[1]}</td>`; };
  return `<table class="tbl scm-cov"><thead><tr><th>관찰 범위</th><th>1학년</th><th>2학년</th><th>3학년</th><th>대학</th></tr></thead><tbody>${R.map(x=>`<tr class="${x.k===sel?'on':''}" data-a="scArea" data-v="${esc(x.k)}"><td>${esc(x.k==='부산·울산·경남'?'부울경':x.k)}</td>${[1,2,3,'c'].map(g=>cell(x.C[g])).join('')}</tr>`).join('')}</tbody></table><p class="small muted">본 선수/전체(부원 포함). 스카우트가 학교를 찾으면 그 학교 전 학년이 1회씩 보입니다.</p>`; }
/* 고른 권역에서 기록은 좋은데 우리가 아직 한 번도 못 본 선수 */
function obsUnseenTop(sel,n){ const S=amSeasonOf(), y=S?S.y:G.year-1, A=areaDef(sel); if(!A)return []; const sch=new Set([...A.hs,...A.un]);
  const ob=x=>x.kind==='p'?obsCount(x.p):x.kind==='e'?obsCount(x.e):(q=>q?amFObs(q.sch,q.ey,x.id,G.user):0)(amFId(x.id));
  const sc=x=>{ const h=x.row; if(x.isP)return h.outs<30?-9:(4.5-h.er*27/h.outs)*.6+(h.so*27/h.outs-7)*.25; return h.pa<35?-9:(bRate(h).ops-.8)*5; };
  return amYearRows(y).filter(x=>sch.has(x.sch)&&(y<G.year?x.gr<(x.sch&&A.un.includes(x.sch)?4:3):true)).map(x=>Object.assign({s:sc(x)},x)).filter(x=>x.s>-9&&!ob(x)).sort((a,b)=>b.s-a.s).slice(0,n||5); }
function scoutMapPage(){ const S=areaSummary(G.user), home=teamArea(G.user); const sel=S.find(a=>a.k===UI.scArea)?UI.scArea:home||S[0].k; const A=S.find(a=>a.k===sel), D=areaDef(sel);
  const scs=(G.scouts||[]).filter(s=>(s.role||'am')==='am'&&s.region===A.reg), con=scs.filter(s=>scHome(s)===sel); /* 정보망 계산과 같게: 이 지역 아마추어 담당만 고향 연줄이 붙는다(검수 11-09e #19) */
  const why=[sel===home?'연고 권역: 오래 다닌 학교 감독·코치 인맥':D.reg===(areaDef(home)||{}).reg?`${D.reg} 이웃 권역`:'연고에서 먼 권역',
    scs.length?`${A.reg} 담당 ${scs.map(s=>esc(s.name)).join('·')}`:`${A.reg} 담당 아마추어 스카우트 없음`, con.length?`${con.map(s=>esc(s.name)).join('·')} 고향(연줄)`:'', areaVisits(G.user)[sel]?`단장 직접 관전 ${areaVisits(G.user)[sel]}회`:''].filter(Boolean);
  /* 학교별 후보: 우리 평가(오차 포함)로 줄 세운다 */
  const ev=p=>{ try{ const r=scoutReport(p); return r.ofp??r.cur??0; }catch(e){ return 0; } };
  const bySch={}; for(const p of A.L){ (bySch[p.school]=bySch[p.school]||[]).push(p); }
  const schools=[...new Set([...D.hs,...D.un,...Object.keys(bySch)])].map(n=>({n,L:(bySch[n]||[]).sort((a,b)=>ev(b)-ev(a)),un:D.un.includes(n)})).sort((a,b)=>b.L.length-a.L.length||a.un-b.un);
  const SL=schList(); /* 고교 감독·친분(11-08c) */
  const coachS=S=>{ if(!S)return ''; const c=S.coach, r=schRel(S); return `<div class="scm-hc small"><span><button class="lnk" data-a="person" data-v="hsc:${esc(S.n)}">${esc(c.name)}</button> 감독 ${c.age}세 · ${esc(c.sty)}${c.alma?' · 모교':''}</span><span class="muted">${esc(c.car)}</span><span>친분 <b style="color:${netCol(r)}">${schRelLbl(r)}</b> · 전력 ${S.lv}${c.from===G.user&&c.ob?' · <span class="pill good">우리 구단 출신</span>':''}</span>${schGave(S)?'<span class="muted">올해 후원함</span>':`<button class="btn small" data-a="schGift" data-v="${esc(S.n)}">야구부 후원 ${money(10)}</button>`}</div>`; };
  const rowS=s=>`<div class="scm-sch${s.L.length||SL[s.n]?'':' none'}">${!s.un&&SL[s.n]?`<button class="lnk" data-a="person" data-v="hs:${esc(s.n)}"><b>${esc(s.n)}</b></button>`:`<b>${esc(s.n)}</b>`}<span class="small muted">${s.un?'대학':'고교'} · 후보 ${s.L.length}명</span><div>${s.L.slice(0,3).map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><i class="small muted">${posLabel(p)}${schTipKnown(p)?' · 감독 귀띔':''}</i>`).join(' ')}</div>${s.un?'':coachS(SL[s.n])}</div>`;
  const map=`<div class="scm-map">${scoutMapSVG(S,sel)}<p class="small muted scm-key">${[[75,'촘촘함'],[55,'좋음'],[35,'보통'],[20,'약함'],[0,'거의 없음']].map(([v,l])=>`<i style="background:${netCol(v)}"></i>${l}`).join(' ')} · 흰 점 = 연고</p></div>`;
  const list=`<table class="tbl scm-tbl"><thead><tr><th>권역</th><th class="num">정보망</th><th class="num">후보</th></tr></thead><tbody>${S.map(a=>`<tr class="${a.k===sel?'on':''}" data-a="scArea" data-v="${esc(a.k)}"><td>${esc(a.k)}${a.home?' <span class="pill">연고</span>':''}</td><td class="num"><b style="color:${netCol(a.net)}">${a.net}</b> <span class="small muted">${netLbl(a.net)}</span></td><td class="num">${a.n}</td></tr>`).join('')}</tbody></table>`;
  const mo=dobj(G.day).m, det=`<div class="scm-det">${sceneImg(sceneOf(mo===12||mo<=2?'scout_winter':period()==='season'&&mo>=6&&mo<=8?'scout_tournament':'scout_weekend',sel),'스카우트 출장','scm-scene')}<div class="row between"><h3 class="sec">${esc(sel)}</h3><span><b style="color:${netCol(A.net)}">정보망 ${A.net}</b> · ${netLbl(A.net)}</span></div>
    <div class="scm-bar"><i style="width:${A.net}%;background:${netCol(A.net)}"></i></div>
    ${(()=>{ const L=obsUnseenTop(sel,5); return L.length?`<p class="small"><b>기록은 좋은데 아직 못 본 선수</b> ${L.map(x=>`${amLnkP(x)} <span class="muted">${esc(x.sch)} ${x.gr}학년 · ${x.isP?'ERA '+(x.row.er*27/x.row.outs).toFixed(2):'OPS '+fmt3(bRate(x.row).ops)}</span>`).join(' · ')}</p>`:''; })()}
    <p class="small">${why.join(' · ')}</p>
    <details class="scm-covd" data-k="scmCov" ${UI.open&&UI.open.scmCov===false?'':'open'}><summary class="small"><b>관찰 범위</b> · 권역 × 학년, 우리 스카우트가 본 선수/전체</summary>${obsCovTbl(sel)}</details>
    <p class="small muted">정보망이 높을수록 이 권역 후보를 더 정확히 보고 숨은 재능도 잘 찾습니다. ${hiI(`${A.reg} 담당 스카우트를 오래 둘수록, 이 권역이 고향인 스카우트가 있을수록, 단장이 이 권역 대회를 직접 볼수록 정보망이 올라갑니다. 학교 감독과 친할수록 그 학교 선수 평가가 정확해지고, 감독이 좋은 선수를 먼저 귀띔합니다. 친분은 스카우트 방문, 대회 관전, 그 학교 선수 지명, 후원으로 쌓입니다.`)}</p>
    <div class="row between"><h4 class="small">학교 · 올해 드래프트 후보 ${A.n}명</h4>${G.unemp?'':(()=>{ const n=schGiftTargets(sel).length; return (n?`<button class="btn small" data-a="schGiftMany" data-v="${esc(sel)}">이 권역 ${n}곳 모두 후원 · ${money(10*n)}</button>`:'<span class="small muted">이 권역 올해 후원 완료</span>')+autoScopeBtn('schg',sel,'이 권역 후원'); })()}</div><div class="scm-schs">${schools.map(rowS).join('')}</div></div>`;
  return `<div class="scm ws-own"><section class="card scm-l">${map}${list}</section><section class="card scm-r">${det}</section></div>`; }
function scoutPage2(base){ const nW=G.unemp?0:obsRowsAll().length; /* 관찰 명단(스카우트 1단계): 타구단 관심 선수·아마추어 관심·드래프트 보드·외국인 관찰·해외파를 한 탭에 */
  const it=inTabs('scoutpg',[['team','스카우트 팀'],['map','지역 정보망'],['ovs','해외 네트워크'],['am','아마추어 야구'],['watch',`관찰 명단${nW?' '+nW:''}`]]); if(it.cur==='team')return it.bar+base(); return it.bar+`<div class="ws-scroll scout-sub-scroll${it.cur==='watch'?' obs-host':''}" tabindex="0">${it.cur==='map'?scoutMapPage():it.cur==='ovs'?sisPage():it.cur==='am'?amHubPage():obsWatchPage()}</div>`; } /* 지역 정보망·해외 네트워크·관심 선수: 낮은 화면(휴대폰 가로)에서 작업 틀이 넘친 부분을 숨겨 아래가 안 보이던 문제(일고회장 11-12) → 하위 탭 내용 전체를 스크롤 칸으로 */
Object.assign(A,{ schGift(v){ toast(schGift(v)); save(); render(); }, schGiftMany(v){ toast(schGiftMany(v)); save(); render(); }, scArea(v){ UI.scArea=v; UI.it=Object.assign(UI.it||{},{scoutpg:'map'}); render(); } });
