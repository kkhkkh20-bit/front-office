/* ---------- 세부 능력치 · 레이더 · 성장 차트 ---------- */
function detailOf(p,rp){ const tv={}, tf={}; for(const t of rp.tools){ tv[t.k]=t.cur; tf[t.k]=t.fut; } const id=p.id; const o=(k,s)=>hn('dt'+k,id)*(s||4);
  const c=v=>clamp(Math.round(v),20,80); const pers=p.pers||{pro:12,amb:12,loy:12,temp:12}; const ps=v=>c(20+(v-4)/16*60);
  const G2=[];
  if(!p.isP){ const L=p.bt==='좌'?-4:p.bt==='양'?0:2, Rr=p.bt==='좌'?2:p.bt==='양'?0:-1;
    G2.push(['타격',[['평균 타구속도',evOf(p)+'km/h','t'],['컨택',c(tv.con)],['갭 파워',c((tv.con+tv.pow)/2+o('gap'))],['홈런 파워',c(tv.pow)],['선구안',c(tv.eye)],['삼진 회피',c(tv.con*.6+tv.eye*.4+o('k'))],['좌투수 상대',c(tv.con+L+o('vl',3))],['우투수 상대',c(tv.con+Rr+o('vr',3))]]]);
    G2.push(['주루',[['스피드',c(tv.spd)],['도루',c(tv.spd+o('sb'))],['주루 센스',c(tv.spd*.6+tv.eye*.4+o('br'))]]]);
    const arm=['C','RF','SS','3B'].includes(p.pos)?3:p.pos==='1B'?-4:0;
    G2.push(['수비',[['수비 범위',c(tv.def+(['SS','CF'].includes(p.pos)?2:0)+o('rng'))],['포구',c(tv.def+o('fld'))],['송구(어깨)',c(tv.def+arm+o('arm'))],p.pos==='C'?['블로킹·도루 저지',c(tv.def+o('cat'))]:['병살·중계',c(tv.def+o('dp'))]]]); }
  else { const velo=veloOf(p);
    const arsenal=arsenal_(p,tv.stf).map(([k,v])=>[k,c(v)]); const best=[...arsenal].sort((a,b)=>b[1]-a[1])[0][0];
    const L=p.th==='좌'?3:-2;
    G2.push(['투구',[['구위',c(tv.stf)],['무브먼트',c((tv.stf+tv.ctl)/2+o('mv'))],['제구',c(tv.ctl)],['스태미나',c(tv.sta)],['좌타자 상대',c(tv.stf+L+o('vl',3))],['우타자 상대',c(tv.stf-L/2+o('vr',3))],['견제·수비',c(50+o('hold',8))]]]);
    G2.push(['구종',arsenal.map(([k,v])=>[k+(k===best?' · 결정구':''),v])]);
    G2.push(['투구 정보',[['직구 평균',velo+'km/h','t'],['직구 최고',veloMax(p)+'km/h','t'],['유형',(hn('gb',id)>.5?'땅볼형':hn('gb',id)<-.5?'뜬공형':'중립'),'t'],['투구 팔',p.th==='좌'?'좌완':'우완','t']]]); }
  G2.push(['체력·몸',[['체력',c(p.isP?tv.sta:tv.vit)],['내구성',c(80-(clamp(medInj(p),.03,.42)-.03)/.39*60)]]]);
  const mind=[['성실성',ps(pers.pro)],['야망',ps(pers.amb),'n'],['충성심',ps(pers.loy)],['기질 안정',ps(24-pers.temp)]];
  if(p.foreign&&p.adapt!=null)mind.push(['한국 적응력',c(p.adapt)]); if(!p.foreign&&p.team!=null)mind.push(['해외 진출 의지',c(20+mlbOf(p)*.6),'i']);
  G2.push(['성격',mind]);
  const radar=!p.isP?[['컨택',tv.con,tf.con],['파워',tv.pow,tf.pow],['선구안',tv.eye,tf.eye],['주루',tv.spd,tf.spd],['수비',tv.def,tf.def],['체력',tv.vit,tf.vit]]
    :[['구위',tv.stf,tf.stf],['제구',tv.ctl,tf.ctl],['스태미나',tv.sta,tf.sta],['무브먼트',(tv.stf+tv.ctl)/2,(tf.stf+tf.ctl)/2],['구속',c(20+(veloOf(p)-130)/25*60),c(20+(veloOf(p)-130)/25*60)],['결정구',Math.max(...G2[1][1].map(x=>x[1])),Math.max(...G2[1][1].map(x=>x[1]))]];
  return {groups:G2,radar}; }
function radarSVG(ax,showFut){ const n=ax.length, cx=110, cy=104, R=78; const pt=(i,v)=>{ const a=-Math.PI/2+i*2*Math.PI/n, r=R*clamp((v-20)/60,0,1); return [cx+r*Math.cos(a),cy+r*Math.sin(a)]; };
  const ring=v=>ax.map((_,i)=>pt(i,v).map(x=>x.toFixed(1)).join(',')).join(' ');
  const poly=k=>ax.map((a,i)=>pt(i,a[k]).map(x=>x.toFixed(1)).join(',')).join(' ');
  const lab=ax.map((a,i)=>{ const [x,y]=pt(i,92); const anc=Math.abs(x-cx)<8?'middle':x>cx?'start':'end'; return `<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="${anc}" class="rd-l">${a[0]} <tspan fill="${rcol(Math.round(a[1]))}" font-weight="800">${dv(a[1])}</tspan></text>`; }).join('');
  return `<svg class="radar" viewBox="-30 0 280 208" role="img" aria-label="능력치 레이더">
    ${[35,50,65,80].map(v=>`<polygon points="${ring(v)}" fill="none" stroke="${v===50?'#55606e':'#2a333e'}" stroke-dasharray="${v===50?'3 3':''}"/>`).join('')}
    ${ax.map((_,i)=>{ const [x,y]=pt(i,80); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#2a333e"/>`; }).join('')}
    ${showFut?`<polygon points="${poly(2)}" fill="rgba(230,185,59,.08)" stroke="#e6b93b" stroke-dasharray="4 3" stroke-width="1.4"/>`:''}
    <polygon points="${poly(1)}" fill="color-mix(in srgb, var(--acc) 28%, transparent)" stroke="var(--acc)" stroke-width="2"/>${lab}</svg>`; }
function growthSVG(p){ const H=(p.oh||[]).slice(-10).filter(h=>h.y!==G.year).concat(hideOvr(p)?[]:[{y:G.year,o:Math.round(ovr(p))}]).slice(-10); const wars=[...new Set(p.hist.filter(h=>h.lvl==='1군').map(h=>h.y))].sort().slice(-10).map(y=>({y,w:wOf(seasonTotal(p,y,'1군'),p)}));
  if(H.length<2&&wars.length<2)return ''; const ys=[...new Set([...H.map(x=>x.y),...wars.map(x=>x.y)])].sort((a,b)=>a-b); const W=300, Hh=120, x=y=>14+(ys.indexOf(y))*(W-28)/Math.max(1,ys.length-1);
  const oy=v=>Hh-14-(clamp(v,20,80)-20)/60*(Hh-30); const wy=v=>Hh-14-clamp(v,-2,10)/12*(Hh-30)-(Hh-30)*2/12;
  const bars=wars.map(w=>{ const y0=wy(0), y1=wy(w.w); return `<rect x="${(x(w.y)-7).toFixed(1)}" y="${Math.min(y0,y1).toFixed(1)}" width="14" height="${Math.abs(y1-y0).toFixed(1)}" fill="${w.w>=0?'#3fbf6a55':'#e0564f55'}"/><text x="${x(w.y).toFixed(1)}" y="${(Math.min(y0,y1)-3).toFixed(1)}" text-anchor="middle" class="gr-w">${w.w.toFixed(1)}</text>`; }).join('');
  const line=H.length>=2?`<polyline points="${H.map(h=>`${x(h.y).toFixed(1)},${oy(h.o).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--acc)" stroke-width="2.2"/>${H.map(h=>`<circle cx="${x(h.y).toFixed(1)}" cy="${oy(h.o).toFixed(1)}" r="3" fill="var(--acc)"/><text x="${x(h.y).toFixed(1)}" y="${(oy(h.o)-7).toFixed(1)}" text-anchor="middle" class="gr-o">${dv(h.o)}</text>`).join('')}`:'';
  return `<svg class="growth" viewBox="0 0 ${W} ${Hh+14}" role="img" aria-label="성장 추이">${bars}${line}${ys.map(y=>`<text x="${x(y).toFixed(1)}" y="${Hh+8}" text-anchor="middle" class="gr-y">${String(y).slice(2)}</text>`).join('')}</svg>
    <p class="small muted"><span class="lg" style="background:var(--acc)"></span>종합 능력(해마다 겨울 기준) <span class="lg" style="background:#3fbf6a88"></span>1군 WAR</p>`; }
/* 측정 데이터(트래킹): 능력치를 모르는 선수도 볼 수 있는 객관적 수치 */
function trackCard(p){ if(p.prospect)return ''; const T=trackOf(p); if(!T)return ''; const it=(l,v,sub)=>`<div class="kb"><span>${l}</span><b>${v}</b>${sub?`<i>${sub}</i>`:''}</div>`;
  const L=p.isP?[it('직구 평균',T.velo+'km',`최고 ${T.vmax}km`),it('직구 회전수',T.rpm+'rpm'),it('익스텐션',T.ext.toFixed(2)+'m'),it('헛스윙 유도',T.whiff+'%'),it('CSW',T.csw+'%','루킹+헛스윙'),it('땅볼 비율',T.gb+'%')]
    :[it('평균 타구속도',T.ev+'km',`최고 ${T.evmax}km`),it('강한 타구',T.hh+'%','150km 이상'),it('헛스윙률',T.whiff+'%'),it('볼 스윙률',T.chase+'%'),it('1루 도달',T.run.toFixed(2)+'초'),it('송구 속도',T.arm+'km')];
  return `<section class="card"><div class="row between"><h2 class="sec">측정 데이터</h2><span class="small muted">트래킹 · 리그 평균 대비는 드래프트 표 '측정'에서</span></div><div class="trk">${L.join('')}</div></section>`; }
function detailCard(p){ const rp=scoutReport(p); if(hideOvr(p)||!rp.tools||!rp.tools.length)return ''; const d=detailOf(p,rp); const fut=rp.ofp!=null&&rp.tools.some(t=>t.fut>t.cur);
  /* 능력치 변화(FM 화살표): 우리 선수는 약 6개월 전 능력과 비교해 오른 항목은 ▲와 막대의 밝은 부분, 떨어진 항목은 ▼ */
  const OLD={}; let RT=''; const DL=p.team===G.user&&rp.exact?rDelta(p):null; if(DL&&rp.tools.some(t=>Math.abs(DL.d[t.k]||0)>=.5)){ RT=`${dsh(DL.from)} 대비`; const od=detailOf(p,{...rp,tools:rp.tools.map(t=>({...t,cur:t.cur-(DL.d[t.k]||0)}))}); for(const [,L] of od.groups)for(const [l,v,t] of L)if(!t)OLD[String(l).split(' · ')[0]]=v; }
  const bar=([l,v,t])=>t==='t'?`<div class="dt"><span>${esc(l)}</span><b class="dt-t">${esc(String(v))}</b></div>`:t==='n'||t==='i'?`<div class="dt" title="${t==='n'?'성향: 좋고 나쁨이 없습니다':'낮을수록 구단에 유리합니다'}"><span>${esc(l)}</span><b class="num" style="text-align:center;color:${t==='n'?'var(--ink)':rcol(100-v)}">${Math.round(v)}</b><span class="track"><span class="mid"></span><span class="now" style="width:${Math.round((v-20)/60*100)}%;--c:${t==='n'?'var(--dim)':rcol(100-v)}"></span></span></div>`:(()=>{ const o=OLD[String(l).split(' · ')[0]]; const dv=o!=null?Math.round(v)-Math.round(o):0; const w=x=>Math.round((clamp(x,20,80)-20)/60*100);
    const ar=dv>=1?`<i class="dar up" title="${esc(RT)} ${Math.round(o)} → ${Math.round(v)}">▲${dv}</i>`:dv<=-1?`<i class="dar dn" title="${esc(RT)} ${Math.round(o)} → ${Math.round(v)}">▼${-dv}</i>`:'';
    const gb=dv>=1?`<span class="gain" style="left:${w(o)}%;width:${Math.max(1,w(v)-w(o))}%"></span>`:dv<=-1?`<span class="loss" style="left:${w(v)}%;width:${Math.max(1,w(o)-w(v))}%"></span>`:'';
    return `<div class="dt"><span>${esc(l)}</span><span class="dtv">${rchip(v)}${ar}</span><span class="track"><span class="mid"></span><span class="now" style="width:${w(dv>=1?o:v)}%;--c:${rcol(v)}"></span>${gb}</span></div>`; })();
  const gr=growthSVG(p);
  return `<section class="card"><div class="row between"><h2 class="sec">능력치</h2><span class="small muted">${rp.exact?'코치진 평가':'스카우트 추정'} · 20~80, 50이 1군 평균</span></div>
    <div class="dgrid"><div class="dradar">${radarSVG(d.radar,fut)}<p class="small muted"><span class="lg" style="background:var(--acc)"></span>현재${fut?' <span class="lg" style="background:#e6b93b"></span>잠재력(점선)':''} · 점선 고리가 1군 평균(50)</p></div>
      <div class="dgroups">${d.groups.map(([h,L])=>`<div class="dg"><div class="eyebrow">${h}</div>${L.map(bar).join('')}</div>`).join('')}</div></div>
    ${RT?`<p class="small muted dleg"><i class="dar up">▲</i> 오른 항목 · <i class="dar dn">▼</i> 떨어진 항목 (${RT}, 막대의 밝은 부분이 오른 만큼)</p>`:''}
    ${gr?`<div class="eyebrow" style="margin-top:10px">성장 추이</div>${gr}`:''}
    <p class="small muted">세부 항목은 핵심 능력치(${p.isP?'구위·제구·스태미나':'컨택·파워·선구안·주루·수비·체력'})를 선수 특성에 따라 나눠 보여 주는 값입니다. 경기 계산은 핵심 능력치와 좌우 손잡이로 합니다. ${rp.exact?'':'영입 전 선수는 스카우트 추정이라 오차가 있습니다.'}</p></section>`; }

