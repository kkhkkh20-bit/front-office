/* ===== 아마추어 야구 화면(13_amateur_league): 시즌 요약·주말리그·전국대회·대학·선수·학교 =====
   스카우트 화면의 하위 탭. 학교를 누르면 학교 페이지, 저학년 선수를 누르면 선수 카드(능력 수치 없이 기록과 말)로 간다 */
function amSeasonOf(){ const y=G.year; if(G.amL&&G.amL.y===y)return G.amL; if(G.amLp)return G.amLp; return null; }
const amLnkS=n=>`<button class="lnk" data-a="amSch" data-v="${esc(n)}">${esc(n)}</button>`;
function amLnkP(x){ if(x.kind==='p'&&G.players[x.id])return `<button class="lnk" data-a="player" data-v="${x.id}">${esc(x.n)}</button>`; return `<button class="lnk" data-a="amP" data-v="${x.id}">${esc(x.n)}</button>`; }
function amEnvLine(y){ const w=amEnvWord(y,'hs'); if(!w)return ''; const c=w.c, m=w.m; return `<p><b>${y} 고교야구: ${esc(w.w)}</b></p><p class="small">타율 ${fmt3(c.avg)}${m?` (최근 평균 ${fmt3(m.avg)})`:''} · 평균자책점 ${c.era.toFixed(2)}${m?` (${m.era.toFixed(2)})`:''} · 타석당 홈런 ${c.hr.toFixed(2)}%${m?` (${m.hr.toFixed(2)}%)`:''} · ${c.g}경기</p>`; }
/* 기록 1위: 부문마다 작은 카드(위 5명)를 격자로(사용자 11-17: 넓은 표에 순위·이름·값이 화면 끝까지 퍼져 길게 이어졌다). keys로 부문을 고른다 */
const AM_LCATS=[['타율',0,'avg',x=>fmt3(x.v)],['OPS',0,'ops',x=>fmt3(x.v)],['홈런',0,'hr',x=>x.v],['도루',0,'sb',x=>x.v],['평균자책점',1,'era',x=>x.v.toFixed(2)],['탈삼진',1,'so',x=>x.v],['승리',1,'w',x=>x.v],['타점',0,'rbi',x=>x.v]];
function amLeadTbl(y,lvl,gr,keys,cls){ const C=keys?AM_LCATS.filter(c=>keys.includes(c[2])):AM_LCATS, c0=lvl==='col'?'대':'고';
  const card=([t,isP,k,f])=>{ const L=amLeaders(y,lvl,!!isP,k,5,gr); return `<div class="am-lc"><div class="am-lc-h">${t}</div>${L.length?`<table class="am-lt"><tbody>${L.map((x,i)=>`<tr><td class="r">${i+1}</td><td class="n">${amLnkP(x)} <span class="am-sc">${amLnkS(x.sch)} ${c0}${x.gr}</span></td><td class="num">${f(x)}</td></tr>`).join('')}</tbody></table>`:'<p class="small muted am-none">기록 없음</p>'}</div>`; };
  return `<div class="am-lg${cls?' '+cls:''}">${C.map(card).join('')}</div>`; }
/* 주말리그·U-리그 순위: 조마다 작은 카드 */
function amStandTbl(S,g,h){ const L=amStand(S,g,h); return `<div class="am-lc"><div class="am-lc-h">${esc(g)}</div><table class="am-lt am-st"><thead><tr><th class="r">#</th><th>학교</th><th class="num">승</th><th class="num">패</th><th class="num">무</th><th class="num">득실</th></tr></thead><tbody>${L.length?L.map((x,i)=>`<tr><td class="r">${i+1}</td><td class="n">${amLnkS(x.n)}</td><td class="num">${x.w}</td><td class="num">${x.l}</td><td class="num">${x.d}</td><td class="num">${x.rs-x.ra>0?'+':''}${x.rs-x.ra}</td></tr>`).join(''):'<tr><td colspan="6" class="small muted">경기 없음</td></tr>'}</tbody></table></div>`; }
function amTourBox(T){ if(!T)return ''; const nR=T.rd.length; const lab=i=>{ const left=(T.n0?Math.pow(2,Math.ceil(Math.log2(T.n0))):64)/Math.pow(2,i); return left===2?'결승':left===4?'4강':left===8?'8강':left+'강'; };
  const show=T.rd.map((r,i)=>({r,i})).filter(x=>x.i>=nR-3);
  return `<div class="am-lc am-tc"><div class="am-lc-h row between"><span>${esc(T.n)}</span><span class="small">${T.ch?`우승 ${amLnkS(T.ch)} · 준우승 ${T.ru?amLnkS(T.ru):'-'}`:`진행 중 · ${T.cur.filter(Boolean).length}개교 남음`}</span></div>${show.slice().reverse().map(({r,i})=>`<div class="am-rd"><b>${lab(i)}</b><span>${r.filter(x=>x[1]).map(x=>`<span class="am-gm">${esc(x[0])} <b>${x[2]}:${x[3]}</b> ${esc(x[1])}${x[4]<9?` <i>${x[4]}회 콜드</i>`:x[4]>9?` <i>${x[4]}회</i>`:''}</span>`).join('')}</span></div>`).join('')}</div>`; } /* 결승부터 위로, 경기마다 한 칸(사용자 11-17) */
function amHubPage(){ const S=amSeasonOf(), y=S?S.y:G.year-1;
  const it=inTabs('amhub',[['sum','요약'],['lg','주말리그'],['tour','전국대회'],['col','대학'],['ply','선수'],['sch','학교']]);
  if(UI.amSch)return amSchoolView(UI.amSch); if(UI.amP)return amPlayerView(UI.amP);
  if(!S&&!(G.amH||[]).length)return it.bar+'<p class="small muted">아직 아마추어 시즌 기록이 없습니다. 3월 둘째 주말에 고교 주말리그가 시작합니다.</p>';
  let body='';
  /* 사용자 11-17: 하위 탭마다 작은 카드 격자로. PC는 바깥 화면이 스크롤되지 않고 이 칸(ws-scroll) 안에서만 */
  if(it.cur==='sum'){ const H=(G.amH||[]).slice(-6).reverse(); const ch=S?Object.values(S.tour).filter(T=>T.ch):[]; const lv=UI.amLv==='col'?'col':'hs';
    const info=csec(`${y} 아마추어 야구`,`${S&&!S.done&&S.y===G.year?`<p class="small muted">시즌 진행 중 · 고교 ${S.tot.hs.g}경기 · 대학 ${S.tot.col.g}경기</p>`:''}${amEnvLine(y)||''}${ch.length?`<div class="am-chl">${ch.map(T=>`<span class="small">${esc(T.n)} <b>${amLnkS(T.ch)}</b></span>`).join('')}</div>`:''}`)
      +(H.length?csec('지난 시즌 비교',`<table class="am-lt am-hist"><thead><tr><th>연도</th><th class="num">타율</th><th class="num">ERA</th><th class="num">HR%</th><th>경향</th></tr></thead><tbody>${H.map(h=>{ const w=amEnvWord(h.y,'hs'); return `<tr><td>${h.y}</td><td class="num">${fmt3(h.hs.avg)}</td><td class="num">${h.hs.era.toFixed(2)}</td><td class="num">${h.hs.hr.toFixed(2)}</td><td class="small">${w?esc(w.w):''}</td></tr>`; }).join('')}</tbody></table>`):'');
    const seg=`<div class="seg am-seg">${[['hs','고교'],['col','대학']].map(([v,l])=>`<button class="${lv===v?'on':''}" data-a="amLv" data-v="${v}">${l}</button>`).join('')}</div>`;
    body=`<div class="am-sum"><div class="am-sum-l">${info}</div>${csec(`${y} ${lv==='col'?'대학':'고교'} 기록 1위`,amLeadTbl(y,lv),seg)}</div>`; }
  else if(it.cur==='lg'){ const h2=S&&S.rec2&&Object.keys(S.rec2).length>0, h=UI.amHalf||(h2?2:1);
    body=S?csec(`${S.y} 고교 주말리그`,`<div class="am-grid am-g4">${amGroups().map(([g])=>amStandTbl(S,g,h)).join('')}</div><p class="small muted am-note">권역별로 전반기·후반기 한 바퀴씩 돕니다. 황금사자기는 전반기, 청룡기는 후반기 권역 상위 학교가 나갑니다(모두 32개교).</p>`,`<div class="seg am-seg">${[[1,'전반기'],[2,'후반기']].map(([v,l])=>`<button class="${h===v?'on':''}" data-a="amHalf" data-v="${v}">${l}</button>`).join('')}</div>`):''; }
  else if(it.cur==='tour'){ body=S?csec(`${S.y} 전국대회`,`<div class="am-grid am-g3">${AM_TOURS().map(t=>S.tour[t.k]?amTourBox(S.tour[t.k]):`<div class="am-lc am-tc"><div class="am-lc-h">${esc(t.n)}</div><p class="small muted am-none">${t.a[0]}월 ${t.a[1]}일 시작</p></div>`).join('')}${amU18Box()}</div>`):''; }
  else if(it.cur==='col'){ body=S?`<div class="am-col">${csec(`${S.y} 대학야구`,`<div class="am-grid am-g3">${amColGroups().map(([g])=>amStandTbl(S,g)).join('')}${S.tour.ct?amTourBox(S.tour.ct):`<div class="am-lc am-tc"><div class="am-lc-h">${esc(AM_COLT.n)}</div><p class="small muted am-none">${AM_COLT.a[0]}월 ${AM_COLT.a[1]}일 시작</p></div>`}</div>`)}${csec('대학 기록 1위',amLeadTbl(S.y,'col'))}</div>`:''; }
  else if(it.cur==='ply'){ body=amPlyPage(y); }
  else if(it.cur==='sch'){ const SL=schList(); body=csec('고교 야구부',`<div class="am-grid am-g3">${AREA.map(a=>`<div class="am-lc"><div class="am-lc-h">${esc(a.k)} <span class="muted small">${a.hs.length}개교</span></div><div class="am-schg">${a.hs.map(n=>{ const o=SL[n]; const t=amLvTrend(o); return `<span class="am-si">${amLnkS(n)}<b class="${/▲/.test(t)?'up':/▼/.test(t)?'dn':''}">${o?o.lv:'-'}${t}</b></span>`; }).join('')}</div></div>`).join('')}</div><p class="small muted am-note">숫자는 팀 전력입니다. 성적·감독·신입생에 따라 해마다 바뀝니다. ▲▼는 최근 3년 사이 4 이상 오르내린 학교입니다.</p>`); }
  return it.bar+body; }
/* U-18 청소년 대표(68_u18): 명단·결과·지난 대회 */
function amU18Box(){ const U=G.u18&&G.u18.y>=G.year-1?G.u18:null, H=(G.u18H||[]).filter(h=>!U||h.y!==U.y).slice(0,3), rk=r=>r===1?'우승':r===2?'준우승':r===3?'3위':r===4?'4위':r===5?'슈퍼 라운드 탈락':'조별 탈락';
  const hist=H.length?`<p class="small muted">${H.map(h=>`${h.y} ${rk(h.rank)}`).join(' · ')}</p>`:'';
  if(!U)return `<div class="am-lc am-tc am-u18"><div class="am-lc-h">U-18 청소년 대표</div><p class="small muted am-none">8월 1일 명단 발표 · 9월 초 ${esc(U18_EV(G.year))}</p>${hist}</div>`;
  const R=U.res, GL=[['P','투수'],['C','포수'],['IF','내야'],['OF','외야']];
  return `<div class="am-lc am-tc am-u18"><div class="am-lc-h row between"><span>U-18 청소년 대표 · ${esc(U.ev)}</span><span class="small">${R?`<b>${rk(R.rank)}</b> · ${R.games.filter(g=>g.w).length}승 ${R.games.filter(g=>!g.w).length}패`:'9월 초 대회'}</span></div>
    ${R?`<p class="am-u18-r">${R.games.map(g=>`<span class="am-gm">${esc(g.st)} ${esc(g.o)} <b>${g.s[0]}:${g.s[1]}</b> ${g.w?'승':'패'}</span>`).join(' ')}</p><p class="small">눈에 띈 선수 ${amLnkP(R.star)}(${esc(R.star.sch)}) ${esc(R.star.line)}</p>`:''}
    ${GL.map(([g,l])=>`<div class="small"><b>${l}</b></div><ul>${U.L.filter(x=>x.g===g).map(x=>`<li>${amLnkP(x)} <span class="muted">${esc(x.sch)} ${x.gr}학년</span></li>`).join('')}</ul>`).join('')}
    <p class="small muted">협회가 공개 기록·언론 순위·측정 구속으로 뽑습니다. 대회는 모든 구단이 같은 중계를 봐서 대표 선수 관찰이 구단마다 1회씩 늘어납니다.</p>${hist}</div>`; }
function amLvTrend(o){ const L=o&&o.lh; if(!L||L.length<2)return ''; const d=L[L.length-1][1]-L[Math.max(0,L.length-4)][1]; return d>=4?' ▲':d<=-4?' ▼':''; }
/* 학교 페이지 */
function amSchoolView(n){ const SL=schList(), S=SL[n], C=amCols()[n], o=S||C; const col=!S; const Y=G.year, Ss=amSeasonOf();
  const back=`<button class="btn small" data-a="amBack">← 아마추어 야구</button>`;
  if(!o)return back+emptyState('학교 정보가 없습니다.');
  const c=S&&S.coach; const fol=amFollowing(G.user,'s:'+n);
  const yy=Ss&&Ss.y===Y?Y:Y-1; const roster=amRosterHtml(n,col,Ss,yy);
  const res=Ss&&Ss.res&&Ss.res[n]||[]; const TN=Object.fromEntries(AM_TOURS().concat([AM_COLT]).map(t=>[t.k,t.n]));
  const recent=res.length?res.slice().reverse().map(r=>`<p class="small">${dmd(r[0])} ${r[2]>r[3]?'<b>승</b>':r[2]<r[3]?'패':'무'} ${r[2]}:${r[3]} ${amLnkS(r[1])} <span class="muted">${r[4]?esc(TN[r[4]]||''):'리그'}${r[5]<9?' · 콜드':''}</span></p>`).join(''):emptyState('올해 치른 경기가 없습니다.');
  const hist=(G.amH||[]).filter(h=>Object.values(h.ch||{}).some(x=>x[0]===n||x[1]===n)).reverse().slice(0,8).map(h=>`${h.y} ${Object.entries(h.ch).filter(([k,x])=>x[0]===n||x[1]===n).map(([k,x])=>`${TN[k]||k} ${x[0]===n?'우승':'준우승'}`).join(', ')}`);
  const al=Object.values(G.players).filter(p=>p.school===n&&!p.prospect&&p.team!=null&&!p.retired).sort((a,b)=>ovr(b)-ovr(a));
  const lh=(o.lh||[]).map(x=>`${x[0]} ${x[1]}`).join(' → ');
  return `${back}<div class="am-schv"><div class="am-sch-l">${csec(esc(n),`<p class="small">${col?'대학':'고교'} · ${esc(o.area)} · 전력 <b>${o.lv}</b>${amLvTrend(o)}${lh?` <span class="muted">(${lh})</span>`:''}</p>
    ${c?`<p class="small">${esc(c.name)} 감독 ${c.age}세 · <span class="pill">${esc(c.sty)}</span> ${esc(HS_STY_D[c.sty]||'')} · 친분 ${schRelLbl(schRel(S))}</p><p class="small muted">${esc(AM_STY_TXT[c.sty]||'')}</p>`:''}
    <p><button class="btn small" data-a="amFollow" data-v="s:${esc(n)}">${fol?'관심 학교 해제':'관심 학교'}</button>${S?(schGave(S)?' <span class="small muted">올해 후원함</span>':` <button class="btn small" data-a="schGift" data-v="${esc(n)}">야구부 후원 ${money(10)}</button>`):''}</p>`)}
    ${csec('최근 경기',recent)}
    ${csec('대회 성적',hist.length?hist.map(x=>`<p class="small">${esc(x)}</p>`).join(''):emptyState('최근 전국대회 결승 기록이 없습니다.'))}
    ${csec(`프로 졸업생 ${al.length}`,al.length?`<p class="small">${al.slice(0,12).map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><i class="small muted">(${esc(tshort(p.team))})</i>`).join(' · ')}</p>`:emptyState('지금 프로에 있는 졸업생이 없습니다.'))}</div>
    <div class="am-sch-r">${csec(`선수단 · ${yy} 기록`,roster||emptyState('선수 정보가 없습니다.'))}</div></div>`; } /* 왼쪽 칸이 닫히지 않고 선수단이 빠져 있었다(사용자 11-17 정리) */
const AM_STY_TXT={육성형:'겨울마다 선수들이 조금 더 자랍니다.',엄격형:'에이스를 규정 안에서 길게 던지게 합니다.',데이터형:'타자들이 공을 잘 고릅니다.',자율형:'장타가 많지만 성장 폭은 들쭉날쭉합니다.'};
/* 저학년 선수 카드: 능력 수치 없이 기록·체격·스카우트 한마디 */
function amWord(e){ const T=amTier(amEstU(e,G.user)); return T.lo===T.hi?`${T.t}(${T.w})`:`${T.t}(${T.lo}~${T.hi} · ${T.w})`; }
function amPlayerView(id){ const e=amPipe().L[id]||(typeof id==='string'&&id[0]==='f'?amDepE(id):null); /* 부원도 한 사람(13b_am_depth, 사용자 11-17) */ const back=`<button class="btn small" data-a="amBack">← 아마추어 야구</button>`;
  if(!e){ const p=G.players[id]; if(p){ UI.amP=null; return back+`<p class="small"><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button> 선수 화면에서 볼 수 있습니다.</p>`; } return back+emptyState('선수 정보가 없습니다.'); }
  const p={isP:!!e.P,college:!!e.c,amY:e.y.map(r=>amRowObj(e,r)).sort((a,b)=>a.y-b.y)}; const K=e.P?AM_PK:AM_BK; p.am=p.amY.length?{}:null; if(p.am)for(const k of K)p.am[k]=p.amY.reduce((a,r)=>a+(r[k]||0),0); /* 기록이 없는 부원은 '기록 없음'(0 합계 줄을 만들지 않는다) */
  const fol=amFollowing(G.user,e.id);
  return `${back}${csec(esc(e.n),`<p class="small">${amLnkS(e.s)} ${amGrade(e,G.year)>(e.c?4:3)?'졸업':amGrade(e,G.year)+'학년'}${e.dep?' 부원':''} · ${e.P?'투수':POSK[e.pos]||e.pos} · ${esc(e.t)}투${esc(e.b)}타 · ${e.ht}cm ${e.wt}kg · ${e.gy} 드래프트 대상</p>
    <p class="small">스카우트 평가: ${amWord(e)}${u18Of(e)?' · <span class="pill acc">U-18 대표</span>':''}</p><p class="small">학년별: ${amTrendHtml(e,!!e.P,!!e.c,true)}</p><p class="small">${esc(amObsTxt(e))}${e.gy-G.year>0?` · 졸업까지 ${e.gy-G.year}년이 남아 범위가 넓습니다.`:''}</p>${e.ai&&e.ig<=G.year?`<p class="small muted">${esc(e.ai)}</p>`:''}
    <p><button class="btn small" data-a="amFollow" data-v="${e.id}">${fol?'관심 해제':'관심 선수'}</button></p>`)}${csec('학년별 기록',amYearTable(p))}`; }
const amGoHub=()=>{ UI.it=Object.assign(UI.it||{},{scoutpg:'am'}); if(UI.tab==='staff'&&UI.sub&&UI.sub.staff==='scouts'&&!UI.modal)render(); else A.go('staff:scouts'); };
Object.assign(A,{ amSch(v){ UI.amSch=v; UI.amP=null; amGoHub(); }, amP(v){ UI.amP=String(v)[0]==='f'?String(v):+v; UI.amSch=null; amGoHub(); },
  amBack(){ UI.amSch=null; UI.amP=null; render(); }, amHalf(v){ UI.amHalf=+v; render(); }, amLv(v){ UI.amLv=v==='col'?'col':'hs'; render(); }, amGr(v){ UI.amGr=+v; render(); },
  amFollow(v){ const id=String(v).startsWith('s:')||String(v)[0]==='f'?String(v):+v; const on=amFollow(id); toast(on?'관심 목록에 넣었습니다.':'관심 목록에서 뺐습니다.'); save(); render(); } });
/* 학년별 흐름 한 줄: 고1 .812 · 고2 .905↑ · 고3 .701↓ (타자 OPS, 투수 ERA). full이면 타율·K/9까지 */
function amTrendHtml(x,isP,col,full){ const T=amTrend(x,isP); if(!T.length)return '<span class="muted">기록 없음</span>'; const c=col?'대':'고';
  return T.map(t=>`<span class="am-tr${t.d>0?' up':t.d<0?' dn':''}">${c}${t.gr} ${t.k?(isP?`${t.k.v.toFixed(2)}${full?` K/9 ${t.k.k9.toFixed(1)}`:''}`:`${fmt3(t.k.v)}${full?` 타율 ${fmt3(t.k.avg)}`:''}`):'<i class="muted">표본 적음</i>'}${t.d>0?'↑':t.d<0?'↓':''}</span>`).join(' · ')+`<i class="muted"> ${isP?'ERA':'OPS'}</i>`; }
const amSlTag=p=>amSlump(p)?' <span class="pill warn">3학년 부진</span>':'';
/* ---------- 선수 탭: 1~3학년(대학 1~4학년) 전체 목록 ---------- */
const AM_GRS=[['h1','고1'],['h2','고2'],['h3','고3'],['c1','대1'],['c2','대2'],['c3','대3'],['c4','대4']];
const AM_PGS=[['all','전체'],['P','투수'],['C','포수'],['IF','내야'],['OF','외야']];
const amPg=x=>x.isP?'P':x.pos==='C'?'C':['1B','2B','3B','SS','DH'].includes(x.pos)?'IF':'OF';
const amPosT=x=>x.isP?'투수':POSK[x.pos]||x.pos||'-';
/* 기록을 보여 줄 시즌: 올해 경기가 시작됐으면 올해, 아니면 지난 시즌 */
function amRecYear(){ const S=G.amL; return S&&S.y===G.year&&(S.tot.hs.g+S.tot.col.g)>0?G.year:G.year-1; }
function amRecLine(isP,h){ if(!h)return '<span class="muted">기록 없음</span>'; if(isP)return h.outs?`ERA ${(h.er*27/h.outs).toFixed(2)} · ${ipStr(h.outs)}이닝 · 탈삼진 ${h.so}`:'<span class="muted">등판 없음</span>';
  return h.pa?`타율 ${h.ab?fmt3(h.h/h.ab):'-'} · OPS ${fmt3(bRate(h).ops)} · 홈런 ${h.hr} · ${h.pa}타석`:'<span class="muted">출전 없음</span>'; }
const amRecScore=(isP,h)=>{ if(!h)return -10; if(isP)return h.outs<15?-9+h.outs*.01:(4.5-h.er*27/h.outs)*.6+(h.so*27/h.outs-7)*.25; return h.pa<20?-9+h.pa*.01:(bRate(h).ops-.8)*5; };
/* 학년 하나의 후보 행: 저학년(G.amU)·졸업 학년(드래프트 후보) */
function amProspectRows(gk){ const col=gk[0]==='c', gr=+gk[1], Y=G.year, yy=amRecYear(), out=[];
  if(gr===(col?4:3)){ for(const id of G.draftClass||[]){ const p=G.players[id]; if(!p||!p.prospect||p.ovsRet||p.team!=null||!!p.college!==col)continue; const h=(p.amY||[]).find(r=>r.y===yy&&!r.syn);
      out.push({id,kind:'p',p,n:p.name,sch:p.school||'',a:areaOf(p),gr,isP:!!p.isP,pos:p.pos,t:p.th,b:p.bt,ht:p.ht,wt:p.wt,h}); } }
  else for(const e of Object.values(amPipe().L)){ if(!!e.c!==col||amGrade(e,Y)!==gr)continue; const r=e.y.find(x=>x[0]===yy); out.push({id:e.id,kind:'e',e,n:e.n,sch:e.s,a:e.a,gr,isP:!!e.P,pos:e.pos,t:e.t,b:e.b,ht:e.ht,wt:e.wt,h:r?amRowObj(e,r):null}); }
  return out; }
function amPlyPage(y){ const f=UI.amF=Object.assign({gr:'h1',pg:'all',ar:'all',srt:'rec'},UI.amF||{}); const yy=amRecYear(); const F=amFollowL(G.user);
  const L=amProspectRows(f.gr).filter(x=>(f.pg==='all'||amPg(x)===f.pg)&&(f.ar==='all'||x.a===f.ar)&&(f.srt!=='sl'||x.kind==='p'&&amSlump(x.p)));
  for(const x of L){ x.fol=F.includes(x.id); x.obs=amObsN(x.kind==='e'?x.e:x.p); x.rs=amRecScore(x.isP,x.h); }
  const est=x=>x.est||(x.est=x.kind==='e'?amEstU(x.e,G.user):amEstP(x.p,G.user));
  const S0={rec:(a,b)=>b.rs-a.rs,est:(a,b)=>est(b).v-est(a).v,fol:(a,b)=>(b.fol-a.fol)||(b.obs-a.obs)||(b.rs-a.rs)}; S0.sl=S0.est; L.sort(S0[f.srt]||S0.rec);
  const N=L.length, show=L.slice(0,150);
  const chips=(k,opts)=>`<div class="chips">${opts.map(([v,l])=>`<button data-a="amF" data-v="${k}:${v}" class="${f[k]===v?'on':''}">${l}</button>`).join('')}</div>`;
  const senior=f.gr==='h3'||f.gr==='c4';
  const row=x=>{ const T=amTier(est(x)); return `<tr><td><button class="am-star${x.fol?' on':''}" data-a="amFollow" data-v="${x.id}" title="관심 선수" aria-label="관심 선수" aria-pressed="${!!x.fol}">${x.fol?'★':'☆'}</button> ${amLnkP(x)}<small class="block">${esc(amPosT(x))} · ${esc(x.t||'')}투${esc(x.b||'')}타 · ${x.ht||'-'}cm ${x.wt||'-'}kg</small></td><td>${amLnkS(x.sch)}<small class="block">${esc(x.a||'')}</small></td><td class="am-rec">${amRecLine(x.isP,x.h)}${x.kind==='p'?amSlTag(x.p):''}<small class="block">${amTrendHtml(x.kind==='e'?x.e:x.p,x.isP,f.gr[0]==='c')}</small>${x.kind==='p'&&amSlHint(x.p)?`<small class="block">스카우트: ${esc(amSlHint(x.p))}</small>`:''}</td><td><span class="pill">${esc(T.t)}</span><small class="block">${T.lo===T.hi?esc(T.w):`${esc(T.lo)}~${esc(T.hi)} · ${esc(T.w)}`}${x.obs?` · 관찰 ${x.obs}회`:''}</small></td></tr>`; };
  const list=`<section class="card am-plist candidate-list"><div class="row between wrapr"><h2 class="sec">선수 목록 · ${esc((AM_GRS.find(g=>g[0]===f.gr)||[,''])[1])}</h2><span class="small muted">${N}명${N>show.length?` · 위 ${show.length}명 표시`:''} · ${yy} 기록</span></div>
    <div class="am-pfilt">${chips('gr',AM_GRS)}${chips('pg',AM_PGS)}${chips('srt',[['rec','기록순'],['est','스카우트 평가순'],['fol','관심순'],['sl','3학년 부진']])}${chips('ar',[['all','전 권역'],...AREA.map(a=>[a.k,a.k])])}</div>
    <div class="tw am-pscroll"><table class="sqt candidate-table am-ptable"><thead><tr><th>선수</th><th>학교</th><th>${yy} 기록 · 학년별</th><th>스카우트 평가</th></tr></thead><tbody>${show.map(row).join('')||`<tr><td colspan="4" class="small muted">${f.srt==='sl'?'3학년 부진 선수가 없습니다. 졸업 학년 기록이 2학년보다 뚜렷이 나쁜 선수(두 해 모두 40타석·15이닝 이상)만 나옵니다.':'조건에 맞는 선수가 없습니다.'}</td></tr>`}</tbody></table></div>
    <p class="small muted">${senior?'졸업 학년은 드래프트 보드와 같은 평가입니다.':'저학년은 능력 수치 대신 등급과 범위만 봅니다. 졸업까지 남은 해가 많을수록 범위가 넓습니다.'} 관심 선수는 졸업 학년에 드래프트 관심 목록으로 이어집니다.</p></section>`;
  const fl=F.filter(id=>typeof id==='number').map(id=>{ const e=amPipe().L[id]; if(e)return {id,n:e.n,sch:e.s,gr:amGrade(e,G.year),c:e.c,kind:'e',o:e}; const p=G.players[id]; return p&&p.prospect?{id,n:p.name,sch:p.school||'',gr:p.college?4:3,c:p.college,kind:'p',o:p}:null; }).filter(Boolean).sort((a,b)=>b.gr-a.gr);
  const sg=amSuggest(y,amClubRegs(G.user),6,G.user).filter(x=>!F.includes(x.id));
  const side=`<aside class="am-pside">${csec(`관심 선수 ${fl.length}`,fl.length?fl.map(x=>`<p class="small">${amLnkP(x)} · ${amLnkS(x.sch)} ${x.c?'대':'고'}${x.gr} <span class="muted">${esc(amObsTxt(x.o))}</span> <button class="btn small am-fb" data-a="amFollow" data-v="${x.id}">해제</button></p>`).join(''):'<p class="small muted">관심 선수로 두면 그 선수 경기를 스카우트가 챙겨 봅니다.</p>')}
    ${csec('스카우트 추천',sg.length?sg.map(x=>`<p class="small">${amLnkP(x)} · ${amLnkS(x.sch)} ${x.gr}학년 · ${x.isP?`ERA ${(x.row.er*27/Math.max(1,x.row.outs)).toFixed(2)}`:`OPS ${fmt3(bRate(x.row).ops)}`} <button class="btn small am-fb" data-a="amFollow" data-v="${x.id}">관심</button></p>`).join(''):'<p class="small muted">담당 지역에서 눈에 띄는 기록이 아직 없습니다.</p>')}
    ${csec(`${y} 고교 학년별 1위`,`<div class="seg am-seg">${[1,2,3].map(g=>`<button class="${(UI.amGr||1)===g?'on':''}" data-a="amGr" data-v="${g}">${g}학년</button>`).join('')}</div>${amLeadTbl(y,'hs',UI.amGr||1,['avg','hr','era','so'],'am-g2')}`)}</aside>`;
  return `<div class="am-ply">${list}${side}</div>`; }
/* 학교 선수단: 학년별 전체(드래프트 관심권 + 일반 부원). 저학년은 능력 수치 없이 기록만 */
function amRosterHtml(n,col,Ss,yy){ const Y=G.year, nG=col?4:3, lvl=col?'col':'hs', ent=[];
  for(const e of Object.values(amPipe().L))if(e.s===n){ const r=e.y.find(x=>x[0]===yy); ent.push({id:e.id,n:e.n,kind:'e',gr:amGrade(e,Y),isP:!!e.P,pos:e.pos,ht:e.ht,h:r?amRowObj(e,r):null,key:1}); }
  for(const p of Object.values(G.players))if(p.prospect&&p.school===n&&p.team==null&&!p.ovsRet)ent.push({id:p.id,n:p.name,kind:'p',gr:nG,isP:!!p.isP,pos:p.pos,ht:p.ht,h:(p.amY||[]).find(r=>r.y===yy&&!r.syn),key:1});
  const fs=Ss&&Ss.y===yy?Ss:G.amLp&&G.amLp.y===yy?G.amLp:null;
  for(const f of amFill(n,Y,lvl,amLvOf(n)))ent.push({id:f.id,n:f.n,kind:'f',gr:f.gr,isP:f.isP,pos:f.pos,ht:f.ht,h:amFRow(n,f.ey,f.isP,f.i,yy),key:amFollowing(G.user,f.id)?1:0}); /* 부원도 눌러 기록·평가를 본다 */
  return Array.from({length:nG},(_,i)=>nG-i).map(g=>{ const R0=ent.filter(x=>x.gr===g).sort((a,b)=>(b.key||0)-(a.key||0)||(a.isP-b.isP)||a.n.localeCompare(b.n)); if(!R0.length)return '';
    return `<h4 class="small">${g}학년 ${R0.length}명${g===nG?' · 올해 드래프트 후보':''}</h4><div class="am-roster"><table class="am-lt"><tbody>${R0.map(x=>`<tr><td>${amLnkP(x)}${x.key&&x.kind!=='f'?' <span class="pill">관심권</span>':x.key?' <span class="pill">관심</span>':''}</td><td class="small">${esc(amPosT(x))}</td><td class="small num">${x.ht||'-'}cm</td><td class="small am-rl">${amRecLine(x.isP,x.h)}</td></tr>`).join('')}</tbody></table></div>`; }).join(''); }
Object.assign(A,{ amF(v){ const [k,x]=String(v).split(':'); UI.amF=Object.assign({gr:'h1',pg:'all',ar:'all',srt:'rec'},UI.amF||{},{[k]:x}); render(); } });
