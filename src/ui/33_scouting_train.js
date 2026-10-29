/* ---------- 스카우팅 ---------- */
function draftYears(){ const S=new Set(Object.keys(G.dlog||{}).map(Number)); for(const p of Object.values(G.players))if(p.draft&&p.draft.y)S.add(p.draft.y); const cur=G.draft&&!G.draft.done?G.draft.y:null; return [...S].filter(y=>y!==cur&&y<=G.year).sort((a,b)=>b-a).slice(0,12); }
function draftHist(ys){ const y=UI.dhy&&ys.includes(UI.dhy)?UI.dhy:ys[0]; const L=draftClass(y); const yrs=G.year-y;
  const chips=`<div class="chips">${ys.map(v=>`<button data-a="dhy" data-v="${v}" class="${v===y?'on':''}">${v}</button>`).join('')}</div>`;
  const g=draftGrades(y); const rk=g.findIndex(x=>x.t===G.user)+1; const mine=L.filter(x=>x.t===G.user).sort((a,b)=>a.n-b.n); const mw=mine.reduce((a,x)=>a+x.war,0);
  const best=[...L].filter(x=>x.p).sort((a,b)=>b.war-a.war).slice(0,10);
  const row=x=>`<tr class="${x.t===G.user?'me':''}"><td class="num">${x.rd}-${x.no}</td><td>${x.t!=null?badge(x.t,14):''}</td><td style="text-align:left">${x.p?`<button class="lnk" data-a="player" data-v="${x.id}">${esc(x.nm)}</button>`:`${esc(x.nm)} <span class="small muted">은퇴</span>`}<br><span class="small muted">${esc(x.pos||'')}${x.p&&x.now!=null&&x.now!==x.t?` · 현 ${esc(tshort(x.now))}`:''}</span></td><td class="num">${x.p?rchip(scoutReport(x.p).cur):'-'}</td><td class="num">${x.war.toFixed(1)}</td></tr>`;
  const tbl=rows=>`<table><thead><tr><th>순번</th><th></th><th style="text-align:left">선수</th><th>능력</th><th>통산 WAR</th></tr></thead><tbody>${rows.map(row).join('')}</tbody></table>`;
  const grade=rk?(rk<=2?'A':rk<=4?'B':rk<=7?'C':'D'):'-';
  return csec(`${y} 드래프트 성적표`,`${chips}<p class="small sdesc">${yrs<=0?'올해 지명한 선수들입니다. 평가는 몇 년 뒤에 의미가 있습니다.':`${yrs}년이 지났습니다. 통산 WAR는 1군 기록 기준입니다.`}</p>
    <dl class="tsum"><div><dt>우리 지명</dt><dd class="num">${mine.length}명</dd></div><div><dt>우리 WAR 합</dt><dd class="num">${mw.toFixed(1)}</dd></div><div><dt>리그 순위</dt><dd class="num">${rk?rk+'위 · '+grade:'-'}</dd></div></dl>
    <div class="eyebrow">우리 지명자</div>${mine.length?tbl(mine):'<p class="small muted">기록이 없습니다.</p>'}
    <div class="eyebrow">이 해 최고 선수 10명</div>${tbl(best)}`); }
function draftPage(){ const ys=draftYears(); const fdT=!!(G.fd&&G.fd.done&&G.fd.picks&&G.fd.picks.some(x=>x.tid===G.user&&x.pid));
  const tabs=[['now',G.draft&&!G.draft.done?'드래프트 진행':'올해 드래프트']]; if(ys.length)tabs.push(['hist','지난 드래프트 성적표']); if(fdT)tabs.push(['fd','창단 지명 평가']);
  const it=tabs.length>1?inTabs('dr',tabs):null;
  return (it?it.bar:'')+(it&&it.cur==='hist'?draftHist(ys):it&&it.cur==='fd'?fdEvalView():draftBoard()); }
/* ---------- 구단 훈련장 전경: 시설 단계와 선수 위치를 한 장에 ---------- */
function campData(){ facInit(); const per=period(); const inSea=per==='season'||per==='post'; const camp=G.camp&&!G.camp.done;
  const ps=playersOf(G.user).filter(p=>!p.ys||true); const devIds=new Set((G.devProg||[]).map(x=>x.pid)); const devOf=id=>(G.devProg||[]).find(x=>x.pid===id);
  const out=[]; const used=new Set(); const put=(p,w)=>{ if(used.has(p.id))return; used.add(p.id); const c=condOf(p);
    const d=devOf(p.id);
    out.push({id:p.id,name:fname(p),v:p.id,isP:p.isP,where:w==='main'&&inSea&&(p.fat||0)>=60?'club':w,inj:p.injOut>0,tired:(p.fat||0)>=60,hot:c>=3,dev:d?d.prog:null}); };
  ps.filter(p=>p.injOut>0).forEach(p=>put(p,'rehab'));
  ps.filter(p=>devIds.has(p.id)&&!used.has(p.id)).forEach((p,i)=>put(p,facOf('lab')>0&&(p.isP||i%2)?'lab':'indoor'));
  const pre=per==='pre'&&!!(G.camp&&G.camp.done); /* 캠프가 끝난 뒤 개막 전(시범경기)도 1군·2군으로 나눈다 */
  if(inSea||pre){ let M=ps.filter(p=>p.e1&&!used.has(p.id)); if(!M.length){ try{ const d=depth(G.user); M=[...d.start,...d.sp,...d.pen.slice(0,7)].filter(p=>p&&!used.has(p.id)); }catch(e){ M=[]; } }
    M.forEach(p=>put(p,'main')); const f=ps.filter(p=>!used.has(p.id)&&!isAway(p));
    f.slice(0,12).forEach(p=>put(p,'fut')); f.filter(p=>!used.has(p.id)).forEach((p,i)=>put(p,p.age<=23&&i%3===0?'dorm':i%2?'weight':'indoor')); }
  else { const f=ps.filter(p=>!used.has(p.id)&&!isAway(p)); f.slice(0,9).forEach(p=>put(p,'fut')); f.filter(p=>!used.has(p.id)).forEach((p,i)=>put(p,camp?(i%2?'weight':'indoor'):(p.age<=23&&i%4===0?'dorm':i%2?'weight':'indoor'))); }
  const bmap=cpBuilds(); const B=Object.keys(bmap)[0]||null; /* 진행 중인 공사 전부(동시 2곳) */
  const P=tpal(team(G.user)); CAMP_UNI.a={S:'#f2f4f6',D:P[0],H:P[0]};
  return {view:(UI.it&&UI.it.cmap)||'home',stadName:stadName(G.user),teamCol:P[0],acc:cTeamCol(G.user),stad:stadIsoOpts(G.user),board:per==='season'&&G.sea&&G.sea.rec?`${G.sea.rec[G.user].w}승 ${G.sea.rec[G.user].l}패`:'',lv:Object.fromEntries(FACK.map(k=>[k,facOf(k)])),bld:B,bmap,pct:B?bmap[B].pct:0,bus:busLv(),players:out,
    mainNote:per==='season'?(G.cal.sched[G.day]?'경기 전 훈련':'휴식일 훈련'):per==='post'?'가을야구 준비':camp?'스프링캠프(해외)':pre?'시범경기 준비':'비시즌',futNote:inSea||pre?'2군 경기':'자율 훈련'}; }
function campView(){ const ct=inTabs('cmap',[['home','1군 홈구장'],['farm','2군 훈련장']],'home'); if(UI._czv!==ct.cur){ UI._czv=ct.cur; UI.cz=null; UI.cpSel=null; } const S=campData(); const c=k=>S.players.filter(p=>p.where===k).length; const inj=S.players.filter(p=>p.inj).length, tired=S.players.filter(p=>p.tired).length, hot=S.players.filter(p=>p.hot).length;
  const B=Object.entries(S.bmap).map(([k,b])=>`<span class="chip">공사 중 <b>${FACI[k].l} ${Math.round(b.pct*100)}%</b> · ${b.left}일 남음</span>`).join('');
  return ct.bar+`<section class="card campc"><div class="row between"><h2 class="sec">${ct.cur==='farm'?`${esc(team(G.user).city)} 2군 훈련장`:esc(stadName(G.user))}</h2><span class="small muted">${UI.cz?'선수·시설을 누르면 정보 패널에 나옵니다':'구역을 누르면 확대되고 정보 패널에 나옵니다'}</span></div>
    <div class="cpchips"><span class="chip">1군 <b>${c('main')+c('club')}</b></span><span class="chip">2군 <b>${c('fut')}</b></span><span class="chip">훈련·연수 <b>${c('indoor')+c('weight')+c('lab')}</b></span><span class="chip r">부상 <b>${inj}</b></span><span class="chip y">피로 <b>${tired}</b></span><span class="chip g">상승세 <b>${hot}</b></span>${B}</div>
    ${UI.cz?'<button class="btn small" data-a="campZoom" data-v="">전체 보기</button>':''}
    <div class="cpwrap"><div class="campst" id="campst">${renderCampus(S)}</div>${cpPanel(S,ct.cur)}</div>
    ${cpLegend(ct.cur)}
    <p class="small muted">${ct.cur==='farm'?'2군 선수와 재활·연수 선수가 지내는 별도 훈련장입니다(실제 구단처럼 홈구장과 떨어져 있습니다).':'1군 엔트리 선수는 홈구장에서 훈련합니다.'} 버스는 원정 경기 피로에 영향을 줍니다(${BUS[busLv()].l}).</p></section>`; }
function leadCard(){ if(G.unemp)return ''; const cl=climateOf(G.user); const c=cl.cap; const m=G.mgr[G.user]; const ld=c?leadOf(c):null; const adj=G.leadAdj&&G.leadAdj.until>G.day?G.leadAdj:null;
  const band={loose:['bad','느슨함','집중력이 떨어지고 기행이 잦아집니다'],ok:['','보통','큰 영향은 없습니다'],good:['good','알맞음','선수들이 집중하고 분위기가 좋습니다'],rigid:['warn','너무 엄격','경직된 플레이가 나오고 젊은 선수 불만이 쌓입니다']}[cl.band];
    return `<section class="card"><div class="row between"><h2 class="sec">선수단 리더십</h2><span class="pill ${band[0]}">기강 ${cl.S} · ${band[1]}</span></div>
    ${c?`<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:center"><button class="pm" data-a="player" data-v="${c.id}">${avImg(c)}<span><b>주장 ${esc(c.name)}</b><i>${posLabel(c)} · ${c.age}세 · 선수단 투표로 선출</i></span></button></div>
      <dl class="tsum"><div><dt>리더십 성향</dt><dd>${LEADSTY(ld.str)}</dd></div><div><dt>선수단 영향력</dt><dd>${ld.cha>=14?'큼':ld.cha>=9?'보통':'작음'}</dd></div><div><dt>감독 규율</dt><dd>${m&&m.disc!=null?(m.disc>=65?'엄격':m.disc>=40?'보통':'느슨'):'-'}</dd></div></dl>`:'<p class="small muted">주장이 없습니다. 스프링캠프 때 선수단 투표로 뽑습니다.</p>'}
    <div class="clbar"><i style="left:${cl.S}%"></i><span class="z l">느슨</span><span class="z g">알맞음</span><span class="z r">엄격</span></div>
    <p class="small">${band[2]}. 기강은 주장 성향 60%, 감독 규율 40%로 정해집니다${adj?` · 최근 구단 징계 영향(${adj.v>0?'+':''}${adj.v}, ${dmd(adj.until)}까지)`:''}.</p>
    <p class="small muted">선수단 기강은 주장과 감독이 관리합니다. 단장이 할 수 있는 일은 두 가지입니다: 규율 성향이 맞는 감독을 고르는 것, 그리고 사고가 나면 구단 차원의 징계(벌금·출장 정지)를 정하는 것.</p><div class="row"><button class="btn small" data-a="go" data-v="staff:mgr">감독 장악력 보기</button></div></section>`; }
function campAfter(){ const svg=document.querySelector('#campst svg.campus'); if(svg&&UI.cz)svg.setAttribute('viewBox',UI.cz.join(' ')); cpMark(); }
function campZoomTo(to){ const svg=document.querySelector('#campst svg.campus'); const fr=UI.cz||[0,0,1000,690]; UI.cz=to; if(!svg){ render(); return; } const t0=performance.now(); const tgt=to||[0,0,1000,690];
  (function step(t){ const k=Math.min(1,(t-t0)/320), e=1-Math.pow(1-k,3); svg.setAttribute('viewBox',fr.map((a,i)=>a+(tgt[i]-a)*e).join(' ')); if(k<1)requestAnimationFrame(step); else render(); })(t0); }
/* 아이소 지도 클릭 판정: 앞쪽 구역부터, 건물 윤곽(data-hp)을 먼저 보고 바닥(data-poly)을 본다. 다각형이 없으면 data-b 사각형 */
function campInPoly(s,x,y){ const v=s.trim().split(/\s+/).map(t=>t.split(',').map(Number)); let c=false; for(let i=0,j=v.length-1;i<v.length;j=i++){ const [xi,yi]=v[i],[xj,yj]=v[j]; if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c; } return c; }
function campHit(svg,q){ const L=[...svg.querySelectorAll('.plot')].reverse();
  return L.find(x=>x.dataset.hp&&campInPoly(x.dataset.hp,q.x,q.y))||L.find(x=>x.dataset.poly&&campInPoly(x.dataset.poly,q.x,q.y))||L.find(x=>{ if(x.dataset.poly)return false; const [a,b,w,h]=x.dataset.b.split(',').map(Number); return q.x>=a&&q.x<=a+w&&q.y>=b&&q.y<=b+h; }); }
function campClick(e){ const svg=e.target.closest('svg.campus'); if(!svg)return false; const pl=e.target.closest('.cpp')||(UI.cz&&cpNear(svg,e)); if(pl){ cpPick({t:'p',id:+pl.dataset.pid}); return true; }
  const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const q=pt.matrixTransform(svg.getScreenCTM().inverse());
  const g=campHit(svg,q); if(!g)return true;
  const k=g.dataset.k; if(!UI.cz){ UI.cpSel={t:'f',k}; UI.facMsg=null; const [a,b,w,h]=g.dataset.b.split(',').map(Number); campZoomTo([a-8,b-8,w+16,h+16]); return true; }
  cpPick({t:'f',k}); return true; }
document.addEventListener('click',e=>{ if((UI.tab==='train'||UI.tab==='staff')&&e.target.closest&&e.target.closest('#campst')){ if(campClick(e)){ e.preventDefault(); e.stopPropagation(); } } },true);
function dataPage(){ const L=anaList(); const E=anaEff(G.user); const M=anaMarket(); const stars=k=>'★'.repeat(k)+'<i class="off">'+'★'.repeat(5-k)+'</i>';
  const pw=r=>anaPow(r); const last=(G.mail||[]).find(m=>m.from==='전력분석팀');
  const card=(a,mine)=>`<div class="tcard anc" style="cursor:default"><div class="row between" style="flex-wrap:nowrap"><div style="min-width:0">${avImg({persona:'staff',pid:a.id,name:a.name,age:a.age})}<b> ${esc(a.name)}</b> <span class="small muted">${a.age}세 · 연 ${money(a.sal)}</span></div><span class="anstar">${stars(a.skill)}</span></div>
    ${mine?`<div class="row" style="gap:6px;margin-top:6px"><select data-a="anaRole" data-v="${a.id}" aria-label="역할">${Object.entries(AROLE).map(([k,r])=>`<option value="${k}" ${a.role===k?'selected':''}>${r.l}</option>`).join('')}</select>${G.day-a.since<30?'<span class="pill warn">적응 중</span>':''}<span class="small muted">충성도 ${Math.round(stAttr(a).loy)}</span><button class="btn small" data-a="person" data-v="an:${a.id}">카드</button><button class="btn small" data-a="anaFire" data-v="${a.id}" style="margin-left:auto">계약 해지</button></div>`
      :`<p class="small muted" style="margin:6px 0">${AROLE[a.role].l} 전문${a.car?` · ${esc(a.car)}`:''}</p>${stMktInfo(a)}<div class="row" style="gap:6px"><button class="btn small primary" data-a="anaHire" data-v="${a.id}:0" ${L.length>=ANA_MAX?'disabled':''}>제안 · 연 ${money(a.sal)}</button><button class="btn small" data-a="anaHire" data-v="${a.id}:0.2" ${L.length>=ANA_MAX?'disabled':''}>20% 더 · ${money(round5(a.sal*1.2))}</button></div>`}</div>`;
  const it=inTabs('ana',[['mine',`우리 분석원 ${L.length}/${ANA_MAX}`],['mk','채용 후보'],['rep','분석 보고']],'mine');
  const eff=`<dl class="tsum"><div><dt>상대 전력분석</dt><dd>${pw('opp').toFixed(1)} · 실점 억제</dd></div><div><dt>트래킹 데이터</dt><dd>${pw('trk').toFixed(1)} · 평가 오차 -${Math.round((1-E.sdm)*100)}%</dd></div><div><dt>영상 분석</dt><dd>${pw('vid').toFixed(1)} · 타격 공략</dd></div></dl>`;
  const body=it.cur==='mk'?`<p class="small muted">매달 1일 후보가 일부 바뀝니다. 다른 구단도 같은 후보를 노립니다. ${esc(stPrestigeLine())}</p>${(()=>{ const f=UI.anF||'all'; return `<div class="chips" style="margin:6px 0">${[['all','전체'],...Object.entries(AROLE).map(([k,v])=>[k,v.l]),['hi','능력 4 이상']].map(([k,l])=>`<button data-a="anF" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div>`; })()}<div class="tgrid">${M.filter(a=>{ const f=UI.anF||'all'; return f==='all'||(f==='hi'?a.skill>=4:a.role===f); }).sort((a,b)=>b.skill-a.skill||a.sal-b.sal).map(a=>card(a,false)).join('')}</div>${stOtherView('an')}`
    :it.cur==='rep'?(last?`<div class="eyebrow">${dsh(last.day)} 보고</div><p class="small" style="white-space:pre-line">${esc(last.body)}</p>`:'<p class="small muted">시즌 중 매달 말 보고가 옵니다.</p>')
    :`${eff}<p class="small muted">역할마다 가장 뛰어난 분석원의 능력이 가장 크게, 두 번째는 60%, 세 번째는 30%만 반영됩니다. 새로 오거나 역할을 바꾼 분석원은 30일 동안 절반만 일합니다.</p>${L.length?`<div class="tgrid">${L.map(a=>card(a,true)).join('')}</div>`:'<p class="small muted">분석원이 없습니다. 채용 후보에서 뽑으세요.</p>'}
      <div class="eyebrow" style="margin-top:8px">역할</div><div class="list">${Object.entries(AROLE).map(([k,r])=>`<div class="item" style="cursor:default"><span class="nm"><b>${r.l}</b></span><span class="sub">${esc(r.d)}</span></div>`).join('')}</div>`;
  return csec('전력분석·데이터팀',it.bar+body,`<span class="small muted">연 ${money(anaSal())}</span>`); }
function scoutTeamPage(){ return csec('스카우트 팀',scoutBody(),`<span class="small muted">${G.scouts.length}/${SCOUT_MAX}</span>`); }
/* 예전 '스카우팅' 탭: 드래프트는 영입·계약, 스카우트 팀은 스태프, 해외 스카우트망은 외국인 화면으로 옮겼다 */
function scoutView(){ return transferView(); }
