/* Overseas cards use public records and the same scouting limits as the lists. */
function ovCardOpen(k){
  if(UI.person===k&&UI.sheet==null)return;
  const old=UI.ovCardTrail;
  const trail=old&&old.g===G&&old.current===UI.person?old:{g:G,views:[]};
  trail.views.push({person:UI.person||null,sheet:UI.sheet,tab:UI.ptab,y:sheetScrollY()});
  trail.current=k;UI.ovCardTrail=trail;
  A.person(k);
}
function ovCardBack(){
  const trail=UI.ovCardTrail;
  if(!trail||trail.g!==G||trail.current!==UI.person||UI.sheet!=null||!trail.views.length)return false;
  const v=trail.views.pop();
  if(!v.person&&v.sheet==null){closeSheets();return true;}
  UI.person=v.person;UI.sheet=v.sheet;UI.ptab=v.tab;trail.current=v.person;
  renderSheet();sheetScrollTo(v.y);return true;
}
function ovCardShell(title,sub,body,kind){
  return `<div class="scrim" data-a="closeSheet"><section class="sheet gut ov-card ${kind||''}" aria-label="${esc(title)}"><header class="sheet-head"><div><span class="eyebrow">${esc(sub)}</span><h2 class="sec">${esc(title)}</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></header>${body}</section></div>`;
}
function ovPlayerData(id){
  const t=ovqTarget(id);if(!t||!['wps','pool'].includes(t.k))return null;
  const e=t.w||t.e,isP=!!e.P;
  if(t.k==='wps'){
    const K=wkKnow(G.user,e.lg),v=wkView(G.user,e,K);if(v.s==='hide')return null;
    return {t,e,isP,K,v,lines:wpsLines(e),lg:e.lg,c:e.c,pos:wpsPos(e)};
  }
  const lines=(e.L||[]).map(l=>wpsH(l,isP)),fr=ovlFrac(G.year);
  if(e.cur&&e.cur.y===G.year&&fr>0){const l=wpsH(ovpCurrent(e,fr),isP);l.live=fr<1?1:0;lines.push(l);}
  const lg=ovlKey(e.l),last=lines.filter(l=>ovlKey(l.lvl)===lg).slice(-1)[0];
  return {t,e,isP,lines,lg,c:e.c??last?.c,pos:e.P?(e.ro==='SP'?'선발':'불펜'):POSK[e.ps]||'타자'};
}
function ovPlayerSheet(id){
  const d=ovPlayerData(id);
  if(!d)return ovCardShell('해외 선수','선수 정보',emptyState('현재 확인할 수 없는 선수입니다.'));
  const {t,e,lines,isP}=d,last=lines[lines.length-1],club=OVL_C[d.lg]&&Number.isInteger(d.c)?ovqTeamBtn(d.lg,d.c,ovlNm(d.lg,d.c)):esc(ovsLvlL(last?.lvl||e.l||d.lg));
  const facts=`<dl class="ov-card-facts"><div><dt>나이</dt><dd>${e.a}세</dd></div><div><dt>포지션</dt><dd>${esc(d.pos)}</dd></div><div><dt>국적</dt><dd>${esc(e.na||'미확인')}</dd></div><div><dt>소속</dt><dd>${club}</dd></div></dl>`;
  const report=t.k==='wps'?`<section class="ov-card-section"><h3>스카우트 보고</h3><div class="ov-card-report">${wpsEstH(d.v)}<span>${esc(wpsCtTxt(e,d.K))}</span></div>${d.v.s==='stat'?'<p class="small muted">현재는 공개 기록만 확인할 수 있습니다.</p>':`<p class="small muted">추정 범위 ${d.v.lo}~${d.v.hi} · 리그 지식 ${d.K}%</p>`}${wpsDeepH(e,d.v)}<div class="ov-card-flags">${wpsFlagH(e)}</div></section>`:'<p class="small muted">해외 후보군 선수입니다. 영입 문의로 계약 가능 여부를 확인하세요.</p>';
  const records=`<section class="ov-card-section"><h3>시즌 기록</h3>${wpsHistT({P:isP,lg:d.lg},lines)}</section>`;
  const actions=t.k==='wps'?ovqBtns(e.i)+'<p class="small muted">현재는 관찰만 가능합니다.</p>':ovqRowActs(e.i);
  return ovCardShell(e.n,'해외 선수',facts+report+records+`<div class="ov-card-actions">${actions}</div>`,'ov-player-card');
}
function ovClubPlayers(lg,c,y){
  const rows=new Map(),add=r=>{if(r.h&&r.h.y===y&&r.lvl!=='NPB 2군'&&ovlKey(r.lvl)===lg&&r.h.c===c)rows.set(String(r.id),r);};
  for(const r of ovlTopPool().R)add(r);
  for(const a of G.abroad||[]){
    const lines=[...(a.lines||[])],cur=ovqLine(a);if(cur&&!lines.includes(cur)&&cur.live)lines.push(cur);
    for(const l of lines)for(const h of ovsParts(l))add({id:a.id,abr:1,name:a.name,pos:a.pos,isP:!!a.isP,lvl:h.lvl,h:{...h,y:l.y}});
  }
  for(const e of G.ovp?.L||[]){
    const d=ovPlayerData(e.i);if(!d)continue;
    for(const l of d.lines){const h={...l,c:l.c??(l.lvl==='트리플A'&&e.l==='트리플A'?e.c:undefined)};add({id:e.i,pool:1,name:e.n,pos:d.pos,isP:d.isP,lvl:h.lvl,h});}
    if(y===G.year&&d.lg===lg&&d.c===c&&!rows.has(String(e.i)))rows.set(String(e.i),{id:e.i,pool:1,name:e.n,pos:d.pos,isP:d.isP,lvl:d.lg,h:d.lines[d.lines.length-1]||null});
  }
  for(const e of G.wps?.L||[]){
    if(wkView(G.user,e).s==='hide')continue;
    const lines=wpsLines(e);
    for(const h of lines)add({id:e.i,wps:1,name:e.n,pos:wpsPos(e),isP:!!e.P,lvl:h.lvl,h});
    if(y===G.year&&e.lg===lg&&e.c===c&&!rows.has(String(e.i)))rows.set(String(e.i),{id:e.i,wps:1,name:e.n,pos:wpsPos(e),isP:!!e.P,lvl:WPS_LV[e.lg],h:lines[lines.length-1]||null});
  }
  return [...rows.values()].sort((a,b)=>Number(a.isP)-Number(b.isP)||a.name.localeCompare(b.name,'ko'));
}
function ovClubSheet(value){
  const [lg,rawC,rawY]=String(value).split(':'),c=Number(rawC),years=OVL_C[lg]&&G.ovl?.[lg]?ovlYears(lg):[];
  if(!OVL_C[lg]||!Number.isInteger(c)||c<0||c>=OVL_C[lg].length)return ovCardShell('해외 구단','구단 정보',emptyState('구단을 찾을 수 없습니다.'));
  const requested=Number(rawY),y=Number.isInteger(requested)&&requested>0&&requested<=G.year?requested:(years[0]??G.year),r=ovlTeamRec(lg,c,y),players=ovClubPlayers(lg,c,y);
  const facts=r?`<dl class="ov-card-facts"><div><dt>시즌</dt><dd>${y}${r.live?' · 진행 중':''}</dd></div><div><dt>소속</dt><dd>${esc(r.dn)}</dd></div><div><dt>순위</dt><dd>${r.rk}위</dd></div><div><dt>성적</dt><dd>${r.w}승 ${r.l}패</dd></div></dl>`:emptyState(`${y}년 구단 성적은 보관되어 있지 않습니다.`);
  const titles=(G.ovl?.[lg]?.h||[]).filter(h=>h.ch===c).map(h=>h.y);
  const titleText=titles.length?`우승 · ${titles.join(', ')}`:'보관된 우승 기록이 없습니다.';
  const affiliates=lg==='AAA'?`<p class="small">MLB ${ovqTeamBtn('MLB',c,ovlNm('MLB',c))} 산하</p>`:lg==='MLB'?`<p class="small">트리플A ${ovqTeamBtn('AAA',c,ovlNm('AAA',c))}</p>`:'';
  const list=players.length?`<div class="ov-card-roster">${players.map(p=>`<div class="ov-card-player"><button class="lnk" data-a="${p.abr?'ovlPerson':'ovlPlayer'}" data-v="${esc(String(p.abr?'abr:'+p.id:p.id))}">${esc(p.name)}</button><span>${esc(p.pos||'선수')}</span><span class="small">${p.h?`${p.h.y} · ${lineTxt(p.h,p.isP)}`:'시즌 기록 없음'}</span></div>`).join('')}</div>`:emptyState('확인된 선수 기록이 없습니다.');
  const body=facts+affiliates+`<p class="small muted">${esc(titleText)}</p><section class="ov-card-section"><h3>${y} 확인된 선수 ${players.length}명</h3><p class="small muted">공개 기록과 스카우트가 확인한 선수만 표시합니다.</p>${list}</section><div class="ov-card-actions"><button class="btn" data-a="ovlTeam" data-v="${lg}:${c}:${y}">${years.includes(y)?'리그 순위 보기':'최근 리그 순위 보기'}</button></div>`;
  return ovCardShell(ovlNm(lg,c),`${OVL_LBL[lg]} · 구단 정보`,body,'ov-club-card');
}
Object.assign(A,{
  ovlPlayer(v){const t=ovqTarget(v);if(!t)return toast('선수를 찾을 수 없습니다.');if(t.k==='mkt')return A.player(t.p.id);if(t.k==='abr')return ovCardOpen('abr:'+t.id);if(!ovPlayerData(v))return toast('아직 확인하지 못한 선수입니다.');ovCardOpen('ovp:'+String(v));},
  ovlClub(v){ovCardOpen('ovc:'+String(v));},
  ovlPerson(v){ovCardOpen(String(v));}
});
