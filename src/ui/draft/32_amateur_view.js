/* ===== 아마추어 야구 화면(13_amateur_league): 시즌 요약·주말리그·전국대회·대학·선수·학교 =====
   스카우트 화면의 하위 탭. 학교를 누르면 학교 페이지, 저학년 선수를 누르면 선수 카드(능력 수치 없이 기록과 말)로 간다 */
function amSeasonOf(){ const y=G.year; if(G.amL&&G.amL.y===y)return G.amL; if(G.amLp)return G.amLp; return null; }
const amLnkS=n=>`<button class="lnk" data-a="amSch" data-v="${esc(n)}">${esc(n)}</button>`;
function amLnkP(x){ if(x.kind==='p'&&G.players[x.id])return `<button class="lnk" data-a="player" data-v="${x.id}">${esc(x.n)}</button>`; return `<button class="lnk" data-a="amP" data-v="${x.id}">${esc(x.n)}</button>`; }
const amTw=h=>`<div class="tw">${h}</div>`;
function amEnvLine(y){ const w=amEnvWord(y,'hs'); if(!w)return ''; const c=w.c, m=w.m; return `<p><b>${y} 고교야구: ${esc(w.w)}</b></p><p class="small">타율 ${fmt3(c.avg)}${m?` (최근 평균 ${fmt3(m.avg)})`:''} · 평균자책점 ${c.era.toFixed(2)}${m?` (${m.era.toFixed(2)})`:''} · 타석당 홈런 ${c.hr.toFixed(2)}%${m?` (${m.hr.toFixed(2)}%)`:''} · ${c.g}경기</p>`; }
function amLeadTbl(y,lvl,gr){ const row=(L,f)=>L.length?L.map((x,i)=>`<tr><td>${i+1}</td><td>${amLnkP(x)}</td><td class="small">${amLnkS(x.sch)} ${x.gr}학년</td><td class="num">${f(x)}</td></tr>`).join(''):'<tr><td colspan="4" class="small muted">기록 없음</td></tr>';
  const sec=(t,L,f)=>`<h4 class="small">${t}</h4>${amTw(`<table class="tbl"><tbody>${row(L,f)}</tbody></table>`)}`;
  return sec('타율',amLeaders(y,lvl,false,'avg',5,gr),x=>fmt3(x.v))+sec('홈런',amLeaders(y,lvl,false,'hr',5,gr),x=>x.v)+sec('평균자책점',amLeaders(y,lvl,true,'era',5,gr),x=>x.v.toFixed(2))+sec('탈삼진',amLeaders(y,lvl,true,'so',5,gr),x=>x.v); }
function amStandTbl(S,g){ const L=amStand(S,g); return `<h4 class="small">${esc(g)}</h4>`+amTw(`<table class="tbl"><thead><tr><th>학교</th><th class="num">승</th><th class="num">패</th><th class="num">무</th><th class="num">득실</th></tr></thead><tbody>${L.map(x=>`<tr><td>${amLnkS(x.n)}</td><td class="num">${x.w}</td><td class="num">${x.l}</td><td class="num">${x.d}</td><td class="num">${x.rs-x.ra>0?'+':''}${x.rs-x.ra}</td></tr>`).join('')}</tbody></table>`); }
function amTourBox(T){ if(!T)return ''; const nR=T.rd.length; const lab=i=>{ const left=(T.n0?Math.pow(2,Math.ceil(Math.log2(T.n0))):64)/Math.pow(2,i); return left===2?'결승':left===4?'4강':left===8?'8강':left+'강'; };
  const show=T.rd.map((r,i)=>({r,i})).filter(x=>x.i>=nR-3);
  return `<div class="card"><div class="row between"><b>${esc(T.n)}</b><span class="small">${T.ch?`우승 ${amLnkS(T.ch)} · 준우승 ${T.ru?amLnkS(T.ru):'-'}`:`진행 중 · ${T.cur.filter(Boolean).length}개교 남음`}</span></div>${show.map(({r,i})=>`<p class="small"><b>${lab(i)}</b> ${r.filter(x=>x[1]).map(x=>`${esc(x[0])} ${x[2]}:${x[3]} ${esc(x[1])}${x[4]<9?` (${x[4]}회 콜드)`:x[4]>9?` (${x[4]}회)`:''}`).join(' · ')}</p>`).join('')}</div>`; }
function amHubPage(){ const S=amSeasonOf(), y=S?S.y:G.year-1;
  const it=inTabs('amhub',[['sum','요약'],['lg','주말리그'],['tour','전국대회'],['col','대학'],['ply','선수'],['sch','학교']]);
  if(UI.amSch)return amSchoolView(UI.amSch); if(UI.amP)return amPlayerView(UI.amP);
  if(!S&&!(G.amH||[]).length)return it.bar+'<p class="small muted">아직 아마추어 시즌 기록이 없습니다. 3월 둘째 주말에 고교 주말리그가 시작합니다.</p>';
  let body='';
  if(it.cur==='sum'){ const H=(G.amH||[]).slice(-6).reverse(); const ch=S?Object.values(S.tour).filter(T=>T.ch):[];
    body=csec(`${y} 아마추어 야구`,`${S&&!S.done&&S.y===G.year?`<p class="small muted">시즌 진행 중 · 고교 ${S.tot.hs.g}경기 · 대학 ${S.tot.col.g}경기</p>`:''}${amEnvLine(y)||''}${ch.length?`<p class="small">우승: ${ch.map(T=>`${esc(T.n)} ${amLnkS(T.ch)}`).join(' · ')}</p>`:''}`)
      +csec('고교 기록 1위',amLeadTbl(y,'hs'))
      +(H.length?csec('지난 시즌 비교',amTw(`<table class="tbl"><thead><tr><th>연도</th><th class="num">타율</th><th class="num">ERA</th><th class="num">HR%</th><th>경향</th></tr></thead><tbody>${H.map(h=>{ const w=amEnvWord(h.y,'hs'); return `<tr><td>${h.y}</td><td class="num">${fmt3(h.hs.avg)}</td><td class="num">${h.hs.era.toFixed(2)}</td><td class="num">${h.hs.hr.toFixed(2)}</td><td class="small">${w?esc(w.w):''}</td></tr>`; }).join('')}</tbody></table>`)):''); }
  else if(it.cur==='lg'){ body=S?csec(`${S.y} 고교 주말리그`,amGroups().map(([g])=>amStandTbl(S,g)).join('')+'<p class="small muted">권역별로 두 바퀴 돕니다. 황금사자기·청룡기는 주말리그 상위 32개교가 나갑니다.</p>'):''; }
  else if(it.cur==='tour'){ body=S?csec(`${S.y} 전국대회`,AM_TOURS().map(t=>S.tour[t.k]?amTourBox(S.tour[t.k]):`<p class="small muted">${esc(t.n)}: ${t.a[0]}월 ${t.a[1]}일 시작</p>`).join('')):''; }
  else if(it.cur==='col'){ body=S?csec(`${S.y} 대학야구`,amColGroups().map(([g])=>amStandTbl(S,g)).join('')+(S.tour.ct?amTourBox(S.tour.ct):''))+csec('대학 기록 1위',amLeadTbl(S.y,'col')):''; }
  else if(it.cur==='ply'){ const gr=UI.amGr||1; const F=amFollowL(G.user).filter(id=>typeof id==='number'); const regs=amClubRegs(G.user);
    const fl=F.map(id=>{ const e=amPipe().L[id]; if(e)return {id,n:e.n,sch:e.s,gr:amGrade(e,G.year),kind:'e'}; const p=G.players[id]; return p?{id,n:p.name,sch:p.school||'',gr:p.college?4:3,kind:'p'}:null; }).filter(Boolean);
    const sg=amSuggest(y,regs,8).filter(x=>!F.includes(x.id));
    body=csec('학년별 기록',`<div class="seg">${[1,2,3].map(g=>`<button class="${gr===g?'on':''}" data-a="amGr" data-v="${g}">${g}학년</button>`).join('')}</div>${amLeadTbl(y,'hs',gr)}`)
      +csec(`관심 선수 ${fl.length}`,fl.length?fl.map(x=>`<p class="small">${amLnkP(x)} · ${amLnkS(x.sch)} ${x.gr}학년 <button class="btn small" data-a="amFollow" data-v="${x.id}">해제</button></p>`).join(''):'<p class="small muted">관심 선수로 두면 그 선수가 나온 경기를 스카우트가 챙겨 봅니다. 졸업 학년이 되면 평가가 더 정확합니다.</p>')
      +csec('스카우트 추천',sg.length?sg.map(x=>`<p class="small">${amLnkP(x)} · ${amLnkS(x.sch)} ${x.gr}학년 · ${x.isP?`ERA ${(x.row.er*27/Math.max(1,x.row.outs)).toFixed(2)}`:`OPS ${fmt3(bRate(x.row).ops)}`} <button class="btn small" data-a="amFollow" data-v="${x.id}">관심</button></p>`).join(''):'<p class="small muted">담당 지역에서 눈에 띄는 기록이 아직 없습니다.</p>'); }
  else if(it.cur==='sch'){ const SL=schList(); body=csec('고교 야구부',AREA.map(a=>`<h4 class="small">${esc(a.k)}</h4><p class="small">${a.hs.map(n=>{ const o=SL[n]; const t=amLvTrend(o); return `${amLnkS(n)} <span class="muted">${o?o.lv:'-'}${t}</span>`; }).join(' · ')}</p>`).join('')+'<p class="small muted">숫자는 팀 전력입니다. 성적·감독·신입생에 따라 해마다 바뀝니다.</p>'); }
  return it.bar+body; }
function amLvTrend(o){ const L=o&&o.lh; if(!L||L.length<2)return ''; const d=L[L.length-1][1]-L[Math.max(0,L.length-4)][1]; return d>=4?' ▲':d<=-4?' ▼':''; }
/* 학교 페이지 */
function amSchoolView(n){ const SL=schList(), S=SL[n], C=amCols()[n], o=S||C; const col=!S; const Y=G.year, Ss=amSeasonOf();
  const back=`<button class="btn small" data-a="amBack">← 아마추어 야구</button>`;
  if(!o)return back+'<p class="small muted">학교 정보가 없습니다.</p>';
  const c=S&&S.coach; const fol=amFollowing(G.user,'s:'+n);
  const U=Object.values(amPipe().L).filter(e=>e.s===n), P=Object.values(G.players).filter(p=>p.prospect&&p.school===n&&p.team==null);
  const yy=Ss&&Ss.y===Y?Y:Y-1;
  const line=(isP,h)=>!h?'<span class="muted">기록 없음</span>':isP?`${ipStr(h.outs)}이닝 ERA ${h.outs?(h.er*27/h.outs).toFixed(2):'-'} · ${h.so}탈삼진`:`${h.pa}타석 타율 ${h.ab?fmt3(h.h/h.ab):'-'} · ${h.hr}홈런 · OPS ${h.pa?fmt3(bRate(h).ops):'-'}`;
  const rows=[...P.map(p=>({id:p.id,n:p.name,kind:'p',gr:p.college?4:3,isP:!!p.isP,pos:posLabel(p),h:(p.amY||[]).find(r=>r.y===yy)})),...U.map(e=>{ const r=e.y.find(x=>x[0]===yy); return {id:e.id,n:e.n,kind:'e',gr:amGrade(e,Y),isP:!!e.P,pos:e.P?'투수':POSK[e.pos]||e.pos,h:r?amRowObj(e,r):null}; })].sort((a,b)=>b.gr-a.gr||a.n.localeCompare(b.n));
  const grs=[...new Set(rows.map(r=>r.gr))];
  const roster=grs.map(g=>`<h4 class="small">${g}학년${g===(col?4:3)?' · 올해 드래프트 후보':''}</h4>${rows.filter(r=>r.gr===g).map(r=>`<p class="small">${amLnkP(r)} ${esc(r.pos)} · ${line(r.isP,r.h)}</p>`).join('')}`).join('')||'<p class="small muted">눈에 띄는 선수가 없습니다.</p>';
  const res=Ss&&Ss.res&&Ss.res[n]||[]; const TN=Object.fromEntries(AM_TOURS().concat([AM_COLT]).map(t=>[t.k,t.n]));
  const recent=res.length?res.slice().reverse().map(r=>`<p class="small">${dmd(r[0])} ${r[2]>r[3]?'<b>승</b>':r[2]<r[3]?'패':'무'} ${r[2]}:${r[3]} ${amLnkS(r[1])} <span class="muted">${r[4]?esc(TN[r[4]]||''):'리그'}${r[5]<9?' · 콜드':''}</span></p>`).join(''):'<p class="small muted">올해 치른 경기가 없습니다.</p>';
  const hist=(G.amH||[]).filter(h=>Object.values(h.ch||{}).some(x=>x[0]===n||x[1]===n)).reverse().slice(0,8).map(h=>`${h.y} ${Object.entries(h.ch).filter(([k,x])=>x[0]===n||x[1]===n).map(([k,x])=>`${TN[k]||k} ${x[0]===n?'우승':'준우승'}`).join(', ')}`);
  const al=Object.values(G.players).filter(p=>p.school===n&&!p.prospect&&p.team!=null&&!p.retired).sort((a,b)=>ovr(b)-ovr(a));
  const lh=(o.lh||[]).map(x=>`${x[0]} ${x[1]}`).join(' → ');
  return `${back}${csec(esc(n),`<p class="small">${col?'대학':'고교'} · ${esc(o.area)} · 전력 <b>${o.lv}</b>${amLvTrend(o)}${lh?` <span class="muted">(${lh})</span>`:''}</p>
    ${c?`<p class="small">${esc(c.name)} 감독 ${c.age}세 · <span class="pill">${esc(c.sty)}</span> ${esc(HS_STY_D[c.sty]||'')} · 친분 ${schRelLbl(schRel(S))}</p><p class="small muted">${esc(AM_STY_TXT[c.sty]||'')}</p>`:''}
    <p><button class="btn small" data-a="amFollow" data-v="s:${esc(n)}">${fol?'관심 학교 해제':'관심 학교'}</button>${S?(schGave(S)?' <span class="small muted">올해 후원함</span>':` <button class="btn small" data-a="schGift" data-v="${esc(n)}">야구부 후원 ${money(10)}</button>`):''}</p>`)}
    ${csec(`선수단 (${yy} 기록)`,roster+'<p class="small muted">드래프트 관심권 선수만 보입니다. 나머지는 일반 부원입니다.</p>')}
    ${csec('최근 경기',recent)}
    ${csec('대회 성적',hist.length?hist.map(x=>`<p class="small">${esc(x)}</p>`).join(''):'<p class="small muted">최근 전국대회 결승 기록이 없습니다.</p>')}
    ${csec(`프로 졸업생 ${al.length}`,al.length?`<p class="small">${al.slice(0,12).map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><i class="small muted">(${esc(tshort(p.team))})</i>`).join(' · ')}</p>`:'<p class="small muted">지금 프로에 있는 졸업생이 없습니다.</p>')}`; }
const AM_STY_TXT={육성형:'겨울마다 선수들이 조금 더 자랍니다.',엄격형:'에이스를 규정 안에서 길게 던지게 합니다.',데이터형:'타자들이 공을 잘 고릅니다.',자율형:'장타가 많지만 성장 폭은 들쭉날쭉합니다.'};
/* 저학년 선수 카드: 능력 수치 없이 기록·체격·스카우트 한마디 */
function amWord(e){ const sd=6*(1.3-areaNet(G.user,e.a)*.0055)*amObsM(e,G.user); const v=e.pot-(e.hidT||0)+hn('amwd'+G.user,e.id)*sd+(amGrade(e,G.year)-2)*0; return v>=60?'대형 재목으로 봅니다':v>=52?'프로 지명감으로 봅니다':v>=45?'더 지켜볼 만합니다':'아직 판단하기 이릅니다'; }
function amPlayerView(id){ const e=amPipe().L[id]; const back=`<button class="btn small" data-a="amBack">← 아마추어 야구</button>`;
  if(!e){ const p=G.players[id]; if(p){ UI.amP=null; return back+`<p class="small"><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button> 선수 화면에서 볼 수 있습니다.</p>`; } return back+'<p class="small muted">선수 정보가 없습니다.</p>'; }
  const p={isP:!!e.P,college:!!e.c,amY:e.y.map(r=>amRowObj(e,r)).sort((a,b)=>a.y-b.y)}; const K=e.P?AM_PK:AM_BK; p.am={}; for(const k of K)p.am[k]=p.amY.reduce((a,r)=>a+(r[k]||0),0);
  const fol=amFollowing(G.user,e.id); const nObs=e.amObs&&e.amObs[G.user]||0;
  return `${back}${csec(esc(e.n),`<p class="small">${amLnkS(e.s)} ${amGrade(e,G.year)}학년 · ${e.P?'투수':POSK[e.pos]||e.pos} · ${esc(e.t)}투${esc(e.b)}타 · ${e.ht}cm ${e.wt}kg · ${e.gy} 드래프트 대상</p>
    <p class="small">스카우트 한마디: ${amWord(e)}${nObs?` · 경기 관찰 ${Math.round(nObs)}회`:''}</p>${e.ai&&e.ig<=G.year?`<p class="small muted">${esc(e.ai)}</p>`:''}
    <p><button class="btn small" data-a="amFollow" data-v="${e.id}">${fol?'관심 해제':'관심 선수'}</button></p>`)}${csec('학년별 기록',amYearTable(p))}`; }
const amGoHub=()=>{ UI.it=Object.assign(UI.it||{},{scoutpg:'am'}); if(UI.tab==='staff'&&UI.sub&&UI.sub.staff==='scouts'&&!UI.modal)render(); else A.go('staff:scouts'); };
Object.assign(A,{ amSch(v){ UI.amSch=v; UI.amP=null; amGoHub(); }, amP(v){ UI.amP=+v; UI.amSch=null; amGoHub(); },
  amBack(){ UI.amSch=null; UI.amP=null; render(); }, amGr(v){ UI.amGr=+v; render(); },
  amFollow(v){ const id=String(v).startsWith('s:')?v:+v; const on=amFollow(id); toast(on?'관심 목록에 넣었습니다.':'관심 목록에서 뺐습니다.'); save(); render(); } });
