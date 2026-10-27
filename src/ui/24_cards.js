/* ---------- 공용 선수 카드 ---------- */
function amShort(p){ const h=p.am; if(!h)return ''; if(p.isP){ const o=h.outs||0; return o?`ERA ${((h.er||0)*27/o).toFixed(2)} · K/9 ${(h.so*27/o).toFixed(1)} · BB/9 ${(h.bb*27/o).toFixed(1)}`:''; } const r=bRate(h); return `OPS ${fmt3(r.ops)} · 볼삼비 ${h.so?(h.bb/h.so).toFixed(2):'-'} · ${h.hr}홈런`; }
const hideOvr=p=>!!(p&&(p.prospect||p.fdPool||(p.foreign&&p.team==null)));
function statCells(p){ // 신인·외국인 후보: 능력치 대신 기록 5칸
  const h=p.prospect?p.am:p.prev; if(!h)return '';
  const c=(l,v,cls)=>`<div><span>${l}</span><b class="${cls||''}">${v}</b></div>`;
  if(p.isP){ const o=h.outs||0; const k9=o?h.so*27/o:0, b9=o?h.bb*27/o:0, era=o?(h.er||0)*27/o:0;
    return `<div class="tc-tools sc5">${c('ERA',o?era.toFixed(2):'-')}${c('K/9',o?k9.toFixed(1):'-',k9>=9?'gd':k9<6?'bd':'')}${c('BB/9',o?b9.toFixed(1):'-',b9<=3?'gd':b9>=5?'bd':'')}${c('이닝',ipStr(o))}${p.prospect?c('최고 구속',(p.amVelo?p.amVelo+5:veloMax(p))+''):c('WHIP',o?((h.h+h.bb)*3/o).toFixed(2):'-')}</div>`; }
  const r=bRate(h); const bk=h.so?h.bb/h.so:0;
  const ev=evOf(p)-(p.prospect?(p.college?2:5):0);
  return `<div class="tc-tools sc5">${c('타구속도',ev+'',ev>=140?'gd':ev<130?'bd':'')}${c('OPS',fmt3(r.ops),r.ops>=.9?'gd':r.ops<.65?'bd':'')}${c('홈런',h.hr)}${c('볼삼비',h.so?bk.toFixed(2):'-',bk>=.8?'gd':bk<=.3?'bd':'')}${p.prospect?c('1루',(p.amRun||runOf(p))+''):c('타석',h.pa)}</div>`; }
/* 선수 카드: 능력치와 성적이 핵심, 나머지는 한 줄 */
function pcRec(p,hid){ // 성적 블록: 큰 숫자 하나 + 보조 한 줄
  let h, tag='';
  if(hid){ h=p.prospect?p.am:p.prev; tag=p.prospect?'아마추어 통산':(p.prevLvl||'지난 시즌'); }
  else { h=curLine(p); if(h)tag=(h.y===G.year?'올해':h.y+'')+(h.lvl==='퓨처스'?' 2군':''); }
  if(!h||(p.isP?!h.outs:!h.pa))return `<div class="pc-rec"><span class="pc-l">성적</span><b class="pc-big muted">-</b><span class="pc-s">기록 없음</span></div>`;
  if(p.isP){ const o=h.outs, era=(h.er||0)*27/o, k9=h.so*27/o; const c=era<=3.3?'var(--good)':era<=4.2?'var(--r50)':era>=5.8?'var(--bad)':'var(--ink)';
    const sub=hid?`${ipStr(o)}이닝 · K/9 ${k9.toFixed(1)}`:`${ipStr(o)}이닝${h.sv?` · ${h.sv}세`:h.hld?` · ${h.hld}홀`:` · ${h.w||0}승`} · WAR ${wOf(h,p).toFixed(1)}`;
    return `<div class="pc-rec"><span class="pc-l">${tag} ERA</span><b class="pc-big" style="color:${c}">${era.toFixed(2)}</b><span class="pc-s">${sub}</span></div>`; }
  const r=bRate(h); const c=r.ops>=.9?'var(--good)':r.ops>=.78?'var(--r50)':r.ops<.62?'var(--bad)':'var(--ink)';
  const sub=hid?`${fmt3(r.avg)} · ${h.hr}홈런 · 볼삼비 ${h.so?(h.bb/h.so).toFixed(2):'-'}`:`${fmt3(r.avg)} · ${h.hr}홈런 · WAR ${wOf(h,p).toFixed(1)}`;
  return `<div class="pc-rec"><span class="pc-l">${tag} OPS</span><b class="pc-big" style="color:${c}">${fmt3(r.ops)}</b><span class="pc-s">${sub}</span></div>`; }
function pcard(p,o){ o=o||{}; const rp=o.rp||scoutReport(p); const hid=hideOvr(p);
  const ab=hid?'':`<div class="pc-ab"><span class="pc-l">능력</span>${rp.cur==null?'<b class="pc-ov q">?</b>':`<b class="pc-ov" style="--c:${rcol(rp.cur)}">${rp.cur}</b>${condChip(p)}`}<span class="pc-s">${rp.ofp!=null&&rp.ofp>rp.cur?`잠재력 <b style="color:${rcol(rp.ofp)}">${rp.ofp}</b>`:rp.ofp!=null?'완성형':'잠재력 ?'}</span></div>`;
  const pos=p.isP?`<span class="pp main">${posLabel(p)}</span>`:`<span class="pp main"${p.team===G.user?` data-a="posSheet" data-v="${p.pos}"`:''}>${POSS[p.pos]}</span>`;
  return `<div class="tcard pc ${hid?'':cardTier(rp.cur)}${o.on?' on':''}${hid?' hid':''}" data-a="${o.act||'player'}" data-v="${o.v??p.id}" role="button" tabindex="0"${o.on!=null?` aria-pressed="${!!o.on}"`:''}>
    <div class="pc-top">${avImg(p)}<div class="pc-id"><b>${esc(p.name)}</b><span>${pos}${o.sub||`${p.age}세 · ${hand(p)}`}</span></div></div>
    <div class="pc-core">${ab}${pcRec(p,hid)}</div>
    ${o.tags||o.stat?`<div class="pc-x">${o.tags||''}${o.stat?`<span>${o.stat}</span>`:''}</div>`:''}
    ${o.foot?`<div class="tc-ft">${o.foot}</div>`:''}
    ${o.mark?`<span class="tc-mark">${o.mark}</span>`:''}
  </div>`;
}

/* ---------- 포지션 표시와 감독 라인업 ---------- */
function posChips(p){ const go=k=>p.team===G.user?` data-a="posSheet" data-v="${k}" title="${k==='P'?'투수진':POSK[k]} 후보 보기"`:''; if(p.isP)return `<span class="pp main"${go('P')}>${posLabel(p)}</span>`; return `<span class="pp main"${go(p.pos)}>${POSS[p.pos]}</span>${subsOf(p).map(k=>`<span class="pp"${go(k)}>${POSS[k]}</span>`).join('')}`; }
function posText(p){ if(p.isP)return posLabel(p); const s=subsOf(p); return POSK[p.pos]+(s.length?` · 서브 ${s.map(k=>POSS[k]).join('·')}`:''); }
function useText(p){ const u=p.use&&p.use.y===G.year?p.use:null; if(!u||!u.g)return '이번 시즌 선발 출장 없음';
  const ps=Object.entries(u.pos).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${POSS[k]||k} ${n}`).join(' · ');
  const sl=Object.entries(u.slot).sort((a,b)=>b[1]-a[1])[0];
  return `선발 ${u.g}경기 · 주로 ${sl[0]}번 · ${ps}`; }
function bLine(p){ const h=seasonTotal(p,G.year,'1군'); if(!h||!h.pa){ const l=curLine(p); return l&&l.pa?`<span class="muted">${l.y===G.year?'2군':l.y} OPS ${fmt3(bRate(l).ops)}</span>`:'<span class="muted">기록 없음</span>'; }
  const r=bRate(h); const c=r.ops>=.9?'var(--good)':r.ops>=.78?'var(--r50)':r.ops<.62?'var(--bad)':'inherit';
  return `<b class="num">${fmt3(r.avg)}</b> · OPS <b class="num" style="color:${c}">${fmt3(r.ops)}</b> · ${h.hr}홈런 ${h.rbi}타점${h.sb?` ${h.sb}도루`:''}`; }
function pLine(p){ const h=seasonTotal(p,G.year,'1군'); if(!h||!h.outs)return '<span class="muted">이번 시즌 기록 없음</span>'; const r=pRate(h); const c=r.era<=3.3?'var(--good)':r.era<=4.2?'var(--r50)':r.era>=5.8?'var(--bad)':'inherit';
  return `ERA <b class="num" style="color:${c}">${r.era.toFixed(2)}</b> · ${ipStr(h.outs)}이닝 · ${h.w||0}승 ${h.l||0}패${h.sv?` ${h.sv}세`:''}${h.hld?` ${h.hld}홀`:''} · 탈삼진 ${h.so}`; }
function l10Text(p){ const L=p.l10||[]; if(!L.length)return '';
  if(p.isP){ const o=sum(L.map(x=>x[0])), er=sum(L.map(x=>x[1])); if(!o)return ''; const era=er*27/o; return `최근 ${L.length}경기 ERA <b style="color:${era<=3.3?'var(--good)':era>=5.8?'var(--bad)':'inherit'}">${era.toFixed(2)}</b>`; }
  const ab=sum(L.map(x=>x[0])),h=sum(L.map(x=>x[1])),hr=sum(L.map(x=>x[2])),bb=sum(L.map(x=>x[3])),xb=sum(L.map(x=>x[5]||0)); if(!ab)return '';
  const ops=(h+bb)/(ab+bb)+(h+xb)/ab; const s=seasonTotal(p,G.year,'1군'); const so=s&&s.pa?bRate(s).ops:null;
  const tr=so==null?'':ops>so+.08?' <span class="trend up">상승</span>':ops<so-.08?' <span class="trend dn">하락</span>':'';
  return `최근 ${L.length}경기 ${fmt3(h/ab)} ${hr?hr+'홈런 ':''}OPS <b style="color:${ops>=.9?'var(--good)':ops<.6?'var(--bad)':'inherit'}">${fmt3(ops)}</b>${tr}`; }
function fatBar(p){ const f=Math.round(p.fat||0); const c=f>=70?'var(--bad)':f>=45?'var(--warn)':'var(--good)'; return `<span class="fat" title="피로 ${f}"><i style="width:${Math.max(4,f)}%;background:${c}"></i></span>`; }
function fatText(p){ const f=p.fat||0; return f>=70?'많이 지침':f>=45?'피로 누적':f>=20?'보통':'좋음'; }
