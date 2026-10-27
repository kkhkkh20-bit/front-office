/* ---------- 인물 관계도 ---------- */
const relEx=r=>r==null?null:r>=65?'smile':r<35?'angry':'flat';
const relCol=r=>r==null?'#5b6675':r>=65?'#3fbf6a':r>=45?'#e6b93b':'#e0564f';
function fanLabel(v){ return v>=70?'열광적':v>=55?'호의적':v>=40?'반신반의':v>=25?'싸늘함':'등 돌림'; }
function pressLabel(v){ return v>=70?'우호적':v>=55?'호의적':v>=40?'중립':v>=25?'비판적':'적대적'; }
function relPeople(){
  prInit(); const t=team(G.user); const B=bossOf(G.user); const m=G.mgr[G.user]; const C=G.coach?coachesOf(G.user):{};
  const top=[
    {k:'own',name:B.own.name,role:'구단주 · 모기업 회장',av:{persona:'own',pid:B.own.id,team:G.user,age:B.own.age,expr:relEx(t.trust),name:B.own.name},rel:t.trust,rl:'신뢰',lab:t.trust>=60?'두터운 신임':t.trust>=40?'지켜보는 중':t.trust>=25?'불신':'경질 검토',sub:OWNER[t.owner].label},
    {k:'ceo',name:B.ceo.name,role:'대표이사 사장',av:{persona:'staff',pid:B.ceo.id,team:G.user,age:B.ceo.age,name:B.ceo.name},rel:null,lab:'예산 창구',sub:`예산 여유 ${money(budget().roomGoal)}`}];
  const field=[];
  if(m)field.push({k:'mgr',name:m.name,role:m.interim?'감독대행':'1군 감독',av:{persona:'mgr',pid:m.id,team:G.user,age:m.age,expr:relEx(m.rel),name:m.name},rel:m.rel,rl:'관계',lab:relLabel(m.rel),sub:m.fame>=70?'스타 감독':m.ego>=70?'고집 센 편':'무난한 성격'});
  for(const r of CKEYS){ const c=C[r]; if(!c)continue; const clan=m&&c.clan===m.id;
    field.push({k:'c:'+r,name:c.name,role:CROLE[r].l,av:{persona:'coach',pid:c.id,team:G.user,age:c.age,name:c.name},rel:null,lab:clan?'감독 사단':'구단 코치',sub:`지도 ${c.sk} · 육성 ${c.dv}`}); }
  const mine=playersOf(G.user).filter(p=>!p.ys);
  const core=[...mine].sort((a,b)=>ovr(b)-ovr(a)).slice(0,6); const sad=mine.filter(p=>(p.mor??60)<40&&!core.includes(p)).sort((a,b)=>(a.mor??60)-(b.mor??60)).slice(0,4);
  const pl=[...core,...sad].map(p=>({k:'p:'+p.id,name:p.name,role:`${posLabel(p)} · ${p.age}세${p.promise&&p.promise.until>=G.day?' · 약속 중':''}`,av:p,rel:Math.round(p.mor??60),rl:'기분',lab:moodLabel(p.mor??60),sub:core.includes(p)?'핵심 전력':'불만 선수'}));
  const gms=G.teams.filter(x=>x.id!==G.user).map(x=>{ const g=gmOf(x.id); const ni=negInfo(x.id);
    return {k:'gm:'+x.id,name:g?g.name:'단장대행',role:`${x.city} ${x.nick} 단장`,av:g?{persona:'gm',pid:g.id,team:x.id,age:g.age,female:g.f,expr:relEx(x.rel),name:g.name}:{name:'?'},rel:x.rel,rl:'친분',lab:relLabel(x.rel),sub:`${g?GMT[g.trait].l:''}${g&&g.ob&&obOf(g.ob)&&obOf(g.ob).mine?' · 우리 구단 출신':''} · ${ni.free?'맞대결 중':`협상 ${ni.left}/${ni.cap}`}`,tid:x.id}; }).sort((a,b)=>b.rel-a.rel);
  const fan=Math.round(G.pr.fan), pr=Math.round(G.pr.press);
  const out=[
    {k:'fan',name:'팬',role:`${t.city} ${t.nick} 팬덤`,av:{persona:'staff',pid:'fan'+G.user,team:G.user,age:24,female:true,expr:relEx(fan),name:'팬'},rel:fan,rl:'여론',lab:fanLabel(fan),sub:`구단 인기 ${Math.round(t.pop*100)}`},
    {k:'press',name:'언론',role:'야구 담당 기자단',av:{persona:'agent',pid:'press'+G.user,team:G.user,age:38,expr:relEx(pr),name:'언론'},rel:pr,rl:'논조',lab:pressLabel(pr),sub:`최근 기사 ${(G.news||[]).filter(n=>n.d>=G.day-14).length}건`}];
  if(G.fa&&G.fa.neg&&faLive())for(const id in G.fa.neg){ const n=G.fa.neg[id]; const p=G.players[id]; if(!p||p.team!=null||n.closed)continue; const ag=agentOf(p);
    out.push({k:'ag:'+id,name:ag.name,role:`${ag.firm} · ${p.name} 담당`,av:{persona:'agent',pid:'ag'+id,age:45,expr:relEx(n.mood),name:ag.name},rel:Math.round(n.mood),rl:'분위기',lab:n.mood>=60?'우호적':n.mood>=40?'신중함':'냉랭함',sub:ag.style==='hard'?'강성 에이전트':ag.style==='soft'?'유연한 편':'보통'}); }
  return [['구단 수뇌부',top],['현장 · 코칭스태프',field],['선수단',pl],['다른 구단 단장',gms],['바깥',out]];
}
function relKey(x){ return x.k.startsWith('p:')?['player',x.k.slice(2)]:['person',x.k]; }
function dChip(k){ const d=relDelta(k); return d?`<i class="rd ${d>0?'up':'dn'}">${d>0?'▲':'▼'}${Math.abs(d)}</i>`:''; }
function relCard(x){ const [a,v]=relKey(x);
  return `<button class="rp" data-a="${a}" data-v="${v}">${avImg(x.av)}<span class="rp-t"><b>${esc(x.name)}</b><i>${esc(x.role)}</i><em>${esc(x.sub||'')}</em></span>
    <span class="rp-r">${x.rel!=null?`<span class="rp-n"><b class="num" style="color:${relCol(x.rel)}">${x.rel}</b>${dChip(x.k)}</span>${relBar(x.rel)}<i>${esc(x.rl)} · ${esc(x.lab)}</i>`:`<i class="rp-tag">${esc(x.lab)}</i>`}</span></button>`; }
/* 관계 지도: 나를 가운데 두고 안쪽은 구단 사람, 바깥 오른쪽은 다른 구단 단장 */
function relMap(groups){ const by={}; for(const [,L] of groups)for(const x of L)by[x.k]=x;
  const cx=158, cy=214; const nodes=[];
  const inner=[['own',-90],['ceo',-138],['mgr',180],['c:hc',142],[ (groups[2][1][0]||{}).k,104],['fan',58],['press',-42]];
  for(const [k,deg] of inner){ const x=by[k]; if(!x)continue; const r=deg===-90?100:94; nodes.push({x,px:cx+r*1.02*Math.cos(deg*Math.PI/180),py:cy+r*1.12*Math.sin(deg*Math.PI/180),s:22}); }
  const g=groups[3][1].slice().sort((a,b)=>a.tid-b.tid); g.forEach((x,i)=>{ const dy=-184+i*(368/Math.max(1,g.length-1)); nodes.push({x,gm:1,px:cx+82+58*Math.sqrt(Math.max(0,1-(dy/196)**2)),py:cy+dy,s:18}); });
  const line=n=>`<line x1="${cx}" y1="${cy}" x2="${n.px.toFixed(1)}" y2="${n.py.toFixed(1)}" stroke="${relCol(n.x.rel)}" stroke-opacity="${n.x.rel==null?.35:.75}" stroke-width="${n.x.rel==null?1.2:1+Math.max(0,n.x.rel-30)/22}" ${n.x.rel==null?'stroke-dasharray="3 3"':''}/>`;
  const node=(n,i)=>{ const [a,v]=relKey(n.x); const src=faceSVG(n.x.av); const lab=n.x.k.startsWith('gm:')?tshort(n.x.tid):n.x.k==='c:hc'?'수석코치':n.x.k==='mgr'?'감독':n.x.k==='own'?'구단주':n.x.k==='ceo'?'사장':n.x.name;
    return `<g class="rm-n" data-a="${a}" data-v="${v}"><circle cx="${n.px.toFixed(1)}" cy="${n.py.toFixed(1)}" r="${n.s+2.5}" fill="#0f141a" stroke="${relCol(n.x.rel)}" stroke-width="2.5"/>
      ${src?`<image href="${src}" x="${(n.px-n.s).toFixed(1)}" y="${(n.py-n.s).toFixed(1)}" width="${n.s*2}" height="${n.s*2}" clip-path="url(#rmc${i})"/>`:''}
      <clipPath id="rmc${i}"><circle cx="${n.px.toFixed(1)}" cy="${n.py.toFixed(1)}" r="${n.s}"/></clipPath>
      <text x="${(n.gm?n.px+n.s+6:n.px).toFixed(1)}" y="${(n.gm?n.py+4:n.py+n.s+14).toFixed(1)}" text-anchor="${n.gm?'start':'middle'}" class="rm-l">${esc(lab)}${n.x.rel!=null?` <tspan fill="${relCol(n.x.rel)}">${n.x.rel}</tspan>`:''}</text></g>`; };
  const t=team(G.user);
  return `<svg class="relmap" style="max-width:520px" viewBox="0 0 400 432" role="img" aria-label="관계 지도">
    <ellipse cx="${cx}" cy="${cy}" rx="96" ry="105" fill="none" stroke="#2a333e" stroke-dasharray="2 4"/>
    <text x="8" y="18" class="rm-g">구단 안</text><text x="392" y="18" text-anchor="end" class="rm-g">다른 구단 단장</text>
    ${nodes.map(line).join('')}
    <circle cx="${cx}" cy="${cy}" r="27" fill="${tpal(t)[0]}" stroke="#e8ecf3" stroke-width="2"/><text x="${cx}" y="${cy-2}" text-anchor="middle" class="rm-me">단장</text><text x="${cx}" y="${cy+12}" text-anchor="middle" class="rm-me2">${esc(t.city)}</text>
    ${nodes.map(node).join('')}</svg>
    <p class="small muted">선 색은 관계(초록 좋음 · 노랑 보통 · 빨강 나쁨), 굵기는 관계의 깊이입니다. 점선은 수치로 관리하지 않는 관계입니다. 얼굴을 누르면 인물 정보가 열립니다.</p>`; }
function relView(){ const groups=relPeople();
  const warn=[]; const t=team(G.user); const m=G.mgr[G.user];
  if(t.trust<25)warn.push(`구단주 신뢰 ${t.trust}: 시즌 종료 때 12 아래면 경질됩니다.`); if(m&&m.rel<35)warn.push(`감독과의 관계 ${m.rel}: 콜업·말소 요청과 운영 기조가 잘 먹히지 않습니다.`);
  const sad=groups[2][1].filter(x=>x.rel<40).length; if(sad)warn.push(`불만 선수 ${sad}명: 기분이 낮으면 경기력이 떨어집니다.`);
  return csec('관계 지도',relMap(groups))+(warn.length?`<div class="note bad">${warn.map(esc).join('<br>')}</div>`:'')
    +groups.filter(([,L])=>L.length).map(([h,L])=>csec(h,`<div class="rpg">${L.map(relCard).join('')}</div>`)).join(''); }
/* 홈: 핵심 관계 한 줄 */
function relStrip(){ if(G.gameOver||G.unemp)return ''; const gs=relPeople(); const pick2=k=>{ for(const [,L] of gs)for(const x of L)if(x.k===k)return x; return null; };
  const L=['own','mgr','fan','press'].map(pick2).filter(Boolean); const g=gs[3][1]; if(g.length)L.push(g[0],g[g.length-1]);
  return `<section class="card relstrip"><div class="row between"><h2 class="sec">관계</h2><button class="btn small" data-a="go" data-v="club:rel">관계도</button></div>
    <div class="rs">${L.map(x=>{ const [a,v]=relKey(x); return `<button data-a="${a}" data-v="${v}">${avImg(x.av)}<b>${esc(x.k==='own'?'구단주':x.k==='mgr'?'감독':x.k==='fan'?'팬':x.k==='press'?'언론':tshort(x.tid)+' 단장')}</b><span style="color:${relCol(x.rel)}">${x.rel}${dChip(x.k)}</span></button>`; }).join('')}</div></section>`; }
/* 인물 카드 시트 */
function personSheet(k){ const gs=relPeople(); let x=null; for(const [,L] of gs)for(const y of L)if(y.k===k)x=y; if(!x)return '';
  const t=team(G.user); const sec=(h,b)=>b?`<div class="ps-s"><div class="eyebrow">${h}</div>${b}</div>`:''; const li=a=>`<ul class="ps-l">${a.map(s=>`<li>${s}</li>`).join('')}</ul>`;
  const btn=(l,a,v,pri)=>`<button class="btn ${pri?'primary':''}" data-a="${a}" data-v="${v}">${l}</button>`;
  let info='', moves=[], fx=[], acts=[], recent='';
  if(k==='own'){ const B=bossOf(G.user); const s=goalStatus(); const w=OWNER[t.owner].w;
    info=`<p>${esc(OWNER[t.owner].msg)} ${esc(OWNTRAIT[t.owner])}</p><p class="small muted">평가 비중 · 순위 ${w[0]} · 재정 ${w[2]} · 여론 ${w[3]}</p>${s?`<p class="small">목표: ${s.rank.t}위 이내 ${s.rank.ok==null?'':s.rank.ok?'(달성 중)':'(미달)'} · 팬 여론 ${s.fan.t} 이상 ${s.fan.ok?'(달성 중)':'(미달)'}</p>`:''}`;
    moves=['매달 말 보고: 순위, 팬 여론, 언론 논조, 예상 적자 보전','시즌 결산: 목표 달성 여부와 언론 논조가 크게 반영'];
    fx=[`모기업 지원 한도가 신뢰에 따라 달라집니다. 지금 한도 ${money(supportCap(t))}`,'시즌이 끝날 때 12 아래면 경질됩니다'];
    recent=(G.ownerLog||[]).slice(0,3).map(o=>`<div class="ps-r"><span class="pill ${o.mood==='만족'?'good':o.mood==='관망'?'':'bad'}">${o.m}월 ${o.mood}</span> <span class="small">신뢰 ${o.trust} (${o.delta>=0?'+':''}${o.delta})</span></div>`).join('');
    acts=[btn('구단주에게 요청','go','club:owner',1),btn('재정','go','club:fin')]; }
  else if(k==='ceo'){ const B=bossOf(G.user); const b=budget();
    info=`<p>${esc(B.ceo.car)}. 구단주의 뜻을 단장에게 전하고, 연봉·운영비 집행을 맡습니다.</p><p class="small">올해 예산 여유 <b>${money(b.roomGoal)}</b> · 지원 한도 ${money(supportCap(t))}</p>`;
    moves=['사장과의 관계는 따로 수치가 없습니다. 구단주 신뢰가 오르면 사장이 쓸 수 있는 돈(지원 한도)도 커집니다'];
    fx=['예산을 넘겨 쓰면 구단주 재정 평가가 나빠집니다'];
    acts=[btn('재정','go','club:fin',1),btn('구단주·목표','go','club:owner')]; }
  else if(k==='mgr'){ const m=G.mgr[G.user]; const C=coachesOf(G.user); const clan=CKEYS.filter(r=>C[r]&&C[r].clan===m.id).map(r=>C[r].name);
    info=`<p class="small">${esc(m.career||'')} · ${m.age}세 · 계약 ${m.yrs}년 남음 · 연봉 ${money(m.sal)}</p><p class="small muted">자존심 ${m.ego} · 명성 ${m.fame} · 작전 ${m.small} · 불펜 운용 ${m.pen} · 젊은 선수 기용 ${m.youth}</p>${clan.length?`<p class="small">사단: ${clan.map(esc).join(', ')}</p>`:''}`;
    moves=['트레이드: 포지션별 전력이 좋아지면 오르고, 약해지거나 주전·유망주(육성형 감독)를 내주면 내려갑니다','결정 이벤트: 연패 때 감독을 믿어 주면 오르고, 출전을 약속하는 등 감독 권한에 끼어들면 내려갑니다','보강 약속: 지키면 크게 오르고, 어기면 크게 내려갑니다','운영 기조 지시: 감독이 받아들이면 +2, 거부하면 -6'];
    fx=['선수단 경기력 보정(관계 55 기준, 최대 +0.4 / -0.5)','콜업·말소 요청, 운영 기조, 휴식·투수 관리 지시를 따르는 정도','관계 30 이상이면 선수 정보에서 감독의 잠재력 예측을 볼 수 있음','자존심이 높고 명성이 높을수록 같은 관계에서도 덜 따릅니다'];
    acts=[btn('감독·요청','go','staff:mreq',1),btn('코치진','go','staff:coach')];
    recent=(G.mail||[]).filter(x=>x.from==='감독실').slice(0,3).map(x=>`<div class="ps-r small">${dsh(x.day)} · ${esc(x.subj)}</div>`).join(''); }
  else if(k.startsWith('c:')){ const r=k.slice(2); const c=coachesOf(G.user)[r]; const m=G.mgr[G.user];
    info=`<p class="small">${esc(c.car)} · ${c.age}세 · 연봉 ${money(c.sal)}</p><p>${esc(CROLE[r].d)}</p><p class="small">지도력 ${c.sk} · 육성 ${c.dv}</p>`;
    moves=[c.clan&&m&&c.clan===m.id?`${m.name} 감독 사단입니다. 감독이 바뀌면 함께 떠날 수 있습니다`:'감독 사단이 아닌 구단 코치입니다'];
    fx=[CROLE[r].g===2?'2군 선수 성장 속도':'1군 경기력과 성장 속도'];
    acts=[btn('코치진','go','staff:coach',1)]; }
  else if(k.startsWith('gm:')){ const tid=+k.slice(3); const o=team(tid); const g=gmOf(tid); const ni=negInfo(tid); const c=(G.gmc||{})[tid]||{};
    info=`<p class="small">${g?`${g.age}세 · ${esc(g.car)} · ${g.since}년부터 재임`:'단장대행 체제'}${g&&g.ob?obTag(g.ob):''}</p>${g&&g.ob&&obOf(g.ob)?`<p class="small muted">선수 시절: ${esc(tshort(obOf(g.ob).team))} ${esc(obOf(g.ob).pos)} · ${obOf(g.ob).seasons}시즌 · 통산 WAR ${obOf(g.ob).war}</p>`:''}${g?`<p><span class="pill acc">${GMT[g.trait].l}</span> ${esc(GMT[g.trait].d)}</p>`:''}<p class="small">${esc(needText(tid))}</p>
      <p class="small">${ni.free?'<b style="color:#6fe39a">맞대결 중 · 협상 제한 없음</b>':`이번 달 협상 <b>${ni.left}</b>/${ni.cap} ${ni.cap>NEG_MONTH?' (기본 4회, 친분 70 이상 +1)':ni.cap<NEG_MONTH?' (기본 4회, 친분 30 미만 -1)':''}`}</p>`;
    moves=['안부 연락(2주 1회) 보통 +1~2 · 식사(한 달 1회, 1천만 원) 보통 +3~5. 의리파는 더 오르고 강경파는 덜 오릅니다','거래 성사 +2 · 헐값 제안 -2','강경파 단장에게 한 달 3번 이상 거절당하면 -1'];
    fx=['친분이 높을수록 같은 선수를 덜 비싸게 넘깁니다','친분 70 이상이면 월 협상 1회 추가, 30 미만이면 1회 감소','친분 35 미만이면 상대가 원하는 것을 읽기 어렵습니다'];
    const tr=(G.trades||[]).filter(z=>z.with===tid).slice(-3).reverse(); recent=tr.map(z=>`<div class="ps-r small">${z.y} ${dsh(z.d)} · 보냄 ${esc(z.give.join(', ')||'없음')} ↔ 받음 ${esc(z.get.join(', ')||'없음')}</div>`).join('');
    acts=[btn('트레이드 협상','tpartnerGo',tid,1),`<button class="btn" data-a="gmCall" data-v="${tid}" ${c.call!=null&&c.call>G.day-14?'disabled':''}>안부 연락</button>`,`<button class="btn" data-a="gmMeal" data-v="${tid}" ${c.meal!=null&&c.meal>G.day-30?'disabled':''}>식사 (1천만)</button>`]; }
  else if(k==='fan'){ const g=G.goals;
    info=`<p>팬 여론 ${x.rel} · ${x.lab}. 구단 인기 ${Math.round(t.pop*100)}.</p>${g&&g.y===G.year?`<p class="small">구단주 목표: 여론 ${g.fan} 이상</p>`:''}`;
    moves=['승패와 연승·연패','트레이드·FA 평가 기사, 신인 활약, 외국인 부진','콜업 여론 같은 결정 이벤트, 팬 행사'];
    fx=['관중 수입과 광고·상품 수입','구단주 월말 평가와 시즌 목표'];
    acts=[btn('언론·여론','go','club:media',1),btn('마케팅','go','club:mkt')]; }
  else if(k==='press'){ info=`<p>언론 논조 ${x.rel} · ${x.lab}.</p>`;
    moves=['기사 하나하나가 논조를 움직입니다. 우호적 기사 +, 비판 기사 -','감독·선수의 불만 표출, 트레이드 평점이 기사가 됩니다'];
    fx=['스폰서(광고) 수입','시즌 결산 때 구단주 신뢰에 직접 반영 (50 기준 10점당 신뢰 1)'];
    recent=(G.news||[]).slice(0,3).map(n=>`<div class="ps-r small">${dsh(n.d)} · ${esc(n.o)} · ${esc(n.t)}</div>`).join('');
    acts=[btn('언론·여론','go','club:media',1)]; }
  else if(k.startsWith('ag:')){ const id=+k.slice(3); const p=G.players[id]; const ag=agentOf(p); const n=negOf(id);
    info=`<p class="small">${esc(ag.firm)} · ${esc(p.name)} 담당 · ${ag.style==='hard'?'강성':ag.style==='soft'?'유연':'보통'}</p><p class="small">협상 ${n.rounds}/4회 사용</p>`;
    moves=['요구에 가까운 제시는 분위기를 올리고, 큰 차이는 크게 떨어뜨립니다','25 아래로 떨어지면 우리와의 협상을 끝냅니다'];
    fx=['역제안을 줄지, 협상을 접을지'];
    acts=[btn('협상실','faOpen',id,1)]; }
  const d=relDelta(k);
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut ps" data-stop="1" role="dialog" aria-label="인물 정보">
    <div class="sheet-head"><div class="row" style="flex-wrap:nowrap">${avImg(x.av,true)}<div><div class="eyebrow">${esc(x.role)}</div><h2 class="sec">${esc(x.name)}</h2><span class="small muted">${esc(x.sub||'')}</span></div></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    ${x.rel!=null?`<div class="ps-rel"><b class="num" style="color:${relCol(x.rel)}">${x.rel}</b><div>${relBar(x.rel)}<span>${esc(x.rl)} · ${esc(x.lab)}${d?` · 최근 4주 ${d>0?'+':''}${d}`:''}</span></div></div>`:`<div class="ps-rel"><span class="rp-tag">${esc(x.lab)}</span></div>`}
    ${info}${sec('관계를 움직이는 것',moves.length?li(moves.map(esc)):'')}${sec('관계가 주는 영향',fx.length?li(fx.map(esc)):'')}${sec('최근',recent)}
    <div class="btns">${acts.join('')}</div>${UI.personMsg?`<p class="note">${esc(UI.personMsg)}</p>`:''}</div></div>`; }

