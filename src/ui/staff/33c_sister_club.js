/* ===== 스카우트 > 해외 네트워크: 일본·미국 지도 · 해외 구단 정보 · 자매결연(사용자 11-09) =====
 지도: 00h_overseas_map.js(Natural Earth·미국 인구조사국 공공 데이터). 구단은 모두 가상(98_sister_club.js OCL) */
const SIS_SITE={oki:['오키나와',127.75,26.35],miy:['미야자키',131.42,31.91],jk:['가고시마',130.56,31.6],az:['애리조나',-111.7,34.3],fl:['플로리다',-81.6,28.2]};
const sisXY=(M,lon,lat)=>[(lon-M.lon0)*M.k*M.c,(M.lat0-lat)*M.k];
/* 미국 구단은 스프링캠프 단지가 한 도시권에 몰려 있어 주(州) 가운데에 2x2로 펼친다 */
function sisPos(cl){ const M=OMAP[cl.c]; if(cl.c==='jp')return sisXY(M,cl.lon,cl.lat); const L=OCL.filter(x=>x.s[1]===cl.s[1]), i=L.indexOf(cl), s=SIS_SITE[cl.s[1]]; const [x,y]=sisXY(M,s[1],s[2]); return [x+(i%2?5:-5),y+(i<2?-5:5)]; }
const sisLvL=v=>['','최하위권','하위권','중위권','상위권','최상위권'][v]||'';
const sisOpL=v=>v>=.7?'높음':v>=.5?'보통':'낮음';
const sisSiteL=s=>`${SIS_SITE[s[1]][0]} (${s[0]}차 캠프)`;
function sisMapSVG(cn,sel){ const M=OMAP[cn]; const L=OCL.filter(c=>c.c===cn); const me=G.unemp?null:G.user;
  const sites=Object.entries(SIS_SITE).filter(([k])=>L.some(c=>c.s[1]===k));
  return `<svg class="scm-svg sis-svg ${cn}" viewBox="-4 -4 ${M.w+8} ${M.h+8}" role="img" aria-label="${OCN[cn]} 해외 구단 지도">
    <path d="${M.p}" class="sis-land"/>${cn==='us'?`<path d="${M.az}" class="sis-hl"/><path d="${M.fl}" class="sis-hl"/>`:''}
    ${cn==='jp'?sites.map(([k,s])=>{ const [x,y]=sisXY(M,s[1],s[2]); return `<g pointer-events="none"><rect x="${x-2.2}" y="${y-2.2}" width="4.4" height="4.4" transform="rotate(45 ${x} ${y})" class="sis-site"/><text x="${x+(k==='oki'?5:k==='miy'?5:-5)}" y="${y+(k==='jk'?7:2)}" class="sis-sl" text-anchor="${k==='jk'?'end':'start'}">${s[0]}</text></g>`; }).join(''):sites.map(([k,s])=>{ const [x,y]=sisXY(M,s[1],s[2]); return `<text x="${x+(k==='fl'?9:0)}" y="${y+(k==='az'?22:16)}" class="sis-sl" text-anchor="${k==='fl'?'start':'middle'}" pointer-events="none">${s[0]}</text>`; }).join('')}
    ${[...L].sort((a,b)=>(a.id===sel)-(b.id===sel)).map(c=>{ const [x,y]=sisPos(c), rel=me!=null?sisRel(me,c.id):0, pt=sisPtn(c.id), on=c.id===sel, r=cn==='us'?3.2:4;
      return `<g class="sis-m${on?' on':''}" data-a="sisSel" data-v="${c.id}"><circle cx="${x}" cy="${y}" r="${r+5}" fill="transparent"/>${pt===me&&me!=null?`<circle cx="${x}" cy="${y}" r="${r+2.2}" class="sis-mine"/>`:''}<circle cx="${x}" cy="${y}" r="${r}" fill="${netCol(rel)}" stroke="${on?'#fff':'#0b1014'}" stroke-width="${on?1.4:.8}"/>${pt!=null&&pt!==me?`<circle cx="${x}" cy="${y}" r="1.3" fill="#0b1014"/>`:''}
        ${on?cn==='jp'?`<text x="${x}" y="${y-r-3}" class="sis-cn" text-anchor="middle">${esc(c.city)}</text>`:`<text x="${sisXY(M,SIS_SITE[c.s[1]][1],0)[0]-10}" y="${y+3}" class="sis-cn" text-anchor="end">${esc(c.n.split(' ')[0])}</text>`:''}</g>`; }).join('')}</svg>`; } /* 미국은 모인 점을 가리지 않게 무리 왼쪽에 이름 */
function sisDetail(c){ const me=G.user, rel=sisRel(me,c.id), pt=sisPtn(c.id), mine=pt===me; const S=sisInit(); const out=[];
  out.push(`<div class="row between"><h3 class="sec">${esc(c.n)}</h3><span>${mine?'<span class="pill good">우리 자매구단</span>':pt!=null?`<span class="pill">${esc(tshort(pt))}와(과) 결연</span>`:'<span class="pill">결연 없음</span>'}</span></div>
    <dl class="tsum"><div><dt>연고</dt><dd>${esc(c.city)}</dd></div><div><dt>${c.c==='jp'?'홈구장':'캠프 단지'}</dt><dd>${esc(c.st)}</dd></div><div><dt>${c.c==='jp'?'1군 전력':'조직 전력'}</dt><dd>${sisLvL(c.lv)}</dd></div><div><dt>${c.c==='jp'?'2군 전력':'마이너 전력'}</dt><dd>${c.f2}</dd></div><div><dt>훈련 시설</dt><dd>${c.fac}</dd></div><div><dt>한국 구단에 대한 개방성</dt><dd>${sisOpL(c.op)}</dd></div><div><dt>스프링캠프</dt><dd>${sisSiteL(c.s)}</dd></div><div><dt>연회비</dt><dd>${money(sisFee(c))}</dd></div></dl>
    <div class="row between"><span class="eyebrow">우리 구단과의 관계</span><b style="color:${netCol(rel)}">${rel}</b></div><div class="scm-bar"><i style="width:${rel}%;background:${netCol(rel)}"></i></div>
    <p class="small muted">관계는 이 구단 캠프지에서 캠프를 차리면(+5), 이 구단과 연습경기를 하면(경기당 +2), 단장이 ${c.c==='jp'?'NPB':'MLB'} 프런트 견학을 다녀오면(+5, 단장 개인 > 사비 쓰기), 교류 방문단을 보내면(+6) 오릅니다. 매달 1씩 식습니다. 55 이상이면 결연을 제안할 수 있습니다.</p>`);
  const v=S.vis[c.id], vok=v==null||G.day-v>=60;
  const no=sisCan(c.id), o=sisOdds(c.id);
  out.push(`<div class="talk"><button class="btn small" data-a="sisVis" data-v="${c.id}" ${vok?'':'disabled'}>교류 방문단 · ${money(SIS_VIS)}${vok?'':` · ${60-(G.day-v)}일 뒤`}</button>${mine?`<button class="btn small" data-a="sisEnd" data-v="${c.id}">결연 끝내기</button>`:`<button class="btn small primary" data-a="sisProp" data-v="${c.id}" ${no?'disabled':''}>자매결연 제안${no?'':` · 수락 가능성 ${o.q>=.6?'높음':o.q>=.35?'보통':'낮음'}`}</button>`}</div>${!mine&&no?`<p class="small warn">${esc(no)}</p>`:''}`);
  if(mine){ const F=S.fl&&S.fl.y===G.year&&S.fl.cid===c.id?S.fl:null, open=fallOpen();
    const el=domestic(me).filter(sisFlElig).sort((a,b)=>(F&&F.ids.includes(b.id))-(F&&F.ids.includes(a.id))||(b.pot-ovr(b))-(a.pot-ovr(a))).slice(0,8);
    out.push(`<div class="eyebrow">가을 교육리그 파견 · ${money(SIS_FL[c.c].c)}/명 · 최대 4명</div><p class="small muted">9월 1일~10월 10일에 신청, 10월 11일 출국해 약 5주 동안 ${esc(c.n)} 2군과 실전을 치르고 11월 15일 결과 보고. 25세 이하 국내 선수만. 성장 폭은 상대 시설이 좋을수록 큽니다.</p>
      ${F&&F.go?`<p class="small">파견 중: ${F.ids.map(id=>esc((G.players[id]||{}).name||'')).join(', ')}</p>`:open?`<div class="talk">${el.map(p=>`<button class="btn small ${F&&F.ids.includes(p.id)?'on':''}" data-a="sisFl" data-v="${c.id}:${p.id}">${esc(p.name)} <span class="small">${posLabel(p)} ${p.age}세</span></button>`).join('')||'<span class="small muted">보낼 수 있는 선수가 없습니다.</span>'}</div>`:'<p class="small muted">지금은 신청 기간이 아닙니다.</p>'}`);
    const C=(G.coach&&G.coach[me])||{}, T=S.ct&&S.ct.tid===me&&!S.ct.done?S.ct:null, om=dobj(G.day), cto=om.m===11||(om.m===12&&om.d<=15);
    out.push(`<div class="eyebrow">코치 연수 · ${money(SIS_CT[c.c])} · ${SIS_CTD/7}주</div><p class="small muted">11월 1일~12월 15일에 1년 한 명. 연수 동안 그 자리는 비운 셈이고, 돌아오면 지도·육성 능력이 1~3 오릅니다.</p>
      ${T?`<p class="small">연수 중: ${esc(CROLE[T.role].l)} · ${dmd(T.to)} 귀국</p>`:cto&&!(S.ct&&S.ct.tid===me&&S.ct.y===om.y)?`<div class="talk">${CKEYS.filter(k=>C[k]).map(k=>`<button class="btn small" data-a="sisCt" data-v="${c.id}:${k}">${esc(CROLE[k].l)} ${esc(C[k].name)}</button>`).join('')}</div>`:'<p class="small muted">지금은 보낼 수 없습니다(기간 밖이거나 올해 이미 보냄).</p>'}`);
    out.push(`<div class="eyebrow">선수 정보 교환</div><p class="small muted">관계 50 이상이면 ${c.c==='jp'?'일본 리그':'마이너리그'}에서 눈여겨본 외국인 후보를 가끔 알려 줍니다. 오래 지켜본 구단의 정보라 평가 오차가 작습니다. ${rel>=50?'지금 정보를 받고 있습니다.':'지금은 관계가 낮아 정보가 오지 않습니다.'}</p>`); }
  return out.join(''); }
function sisPage(){ if(G.unemp)return '<section class="card"><p class="small muted">구단을 맡고 있지 않습니다.</p></section>'; sisInit(); const cn=UI.sisC==='us'?'us':'jp'; const L=OCL.filter(c=>c.c===cn); const sel=L.find(c=>c.id===UI.sisSel)?UI.sisSel:(sisMine(G.user,cn)||L[0].id); const C=OCL_BY[sel];
  const tabs=`<div class="talk">${['jp','us'].map(k=>`<button class="btn small ${cn===k?'on':''}" data-a="sisC" data-v="${k}">${OCN[k]}${sisMine(G.user,k)?' · 결연 1':''}</button>`).join('')}</div>`;
  const map=`<div class="scm-map">${sisMapSVG(cn,sel)}<p class="small muted scm-key">${[[75,'매우 가까움'],[55,'가까움'],[35,'보통'],[20,'서먹함']].map(([v,l])=>`<i style="background:${netCol(v)}"></i>${l}`).join(' ')} · 금색 고리 = 우리 자매구단 · 가운데 점 = 다른 구단과 결연${cn==='jp'?' · 마름모 = 캠프지':''}</p></div>`;
  const list=`<table class="tbl scm-tbl"><thead><tr><th>구단</th><th class="num">관계</th><th>결연</th></tr></thead><tbody>${L.map(c=>{ const r=sisRel(G.user,c.id), p=sisPtn(c.id); return `<tr class="${c.id===sel?'on':''}" data-a="sisSel" data-v="${c.id}"><td>${esc(c.n)} <span class="small muted">${SIS_SITE[c.s[1]][0]}</span></td><td class="num"><b style="color:${netCol(r)}">${r}</b></td><td>${p===G.user?'<span class="pill good">우리</span>':p!=null?esc(tshort(p)):'<span class="muted">-</span>'}</td></tr>`; }).join('')}</tbody></table>`;
  const all=Object.entries(sisInit().p).map(([id,x])=>`${tshort(x.tid)}-${OCL_BY[id].n}`);
  return `<div class="scm ws-own"><section class="card scm-l">${tabs}${map}${list}<p class="small muted">국내 구단 자매결연 현황: ${all.length?esc(all.join(', ')):'없음'}</p></section><section class="card scm-r">${UI.sisMsg?`<div class="note bad">${esc(UI.sisMsg)}</div>`:''}<div class="scm-det">${sisDetail(C)}</div></section></div>`; }
Object.assign(A,{
  sisC(v){ UI.sisC=v; UI.sisSel=null; UI.sisMsg=null; render(); },
  sisSel(v){ UI.sisSel=v; UI.sisC=(OCL_BY[v]||{}).c||UI.sisC; UI.sisMsg=null; UI.it=Object.assign(UI.it||{},{scoutpg:'ovs'}); render(); },
  sisProp(v){ const r=sisPropose(v); UI.sisMsg=r||null; if(!r)toast(`${OCL_BY[v].n}와(과) 자매결연`); save(); render(); },
  sisVis(v){ UI.sisMsg=sisVisit(v)||null; save(); render(); },
  sisEnd(v){ const d=!UI._cfmPass&&GUARD.sisEnd(v); if(d){ UI.cfm={k:'sisEnd',v,doc:d}; cfmRender(); return; } /* 41_guard_boot보다 늦게 실려 결재 창을 직접 띄운다 */ UI.sisMsg=sisEnd(v)||null; save(); render(); },
  sisFl(v){ const [c,id]=String(v).split(':'); UI.sisMsg=sisFlToggle(c,+id||id)||null; save(); render(); },
  sisCt(v){ const [c,k]=String(v).split(':'); UI.sisMsg=sisCoachSend(c,k)||null; save(); render(); } });
Object.assign(GUARD,{ sisEnd(v){ const c=OCL_BY[v]; if(!c||sisPtn(v)!==G.user)return null; return {subj:`${c.n} 자매결연 끝내기`,kind:'캠프',lines:['캠프지 예약 우선·할인, 교육리그·코치 연수, 정보 교환 혜택이 사라집니다.','관계가 10 떨어집니다.'],warn:'끝낸 뒤 다시 맺으려면 관계를 55 이상으로 쌓고 다시 제안해야 합니다.'}; } });
