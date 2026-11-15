/* ---------- 인물 카드 공통 틀(감독·코치) ----------
   선수 상황판과 같은 틀을 쓴다: 큰 사진 카드(pf-fmcard), 능력 차트(radarSVG 큰 차트), 세부 능력 표(pf-attribute-*).
   화면에 숫자로 보이던 값만 숫자로, 말로 보이던 값(고집·인지도·성격)은 그대로 말로 보인다. 새로 드러내는 값은 없다. */
/* 사진 카드. o: {av, tid, eyebrow, name, sub, pills, keys:[[이름, 값 HTML, 작은 글]], sum:{t,d}} */
function personHero(o){
  const t=o.tid!=null&&G&&G.teams&&G.teams[o.tid]?G.teams[o.tid]:null, P=t?tpal(t):null, st=P?`--pt:${P[2]};--pt2:${P[3]}`:'';
  const pk=cimgKey(o.av);
  return `<section class="card pf-fmcard ph pc-hero" style="${st}"><div class="pf-fm-face">${avImg(o.av,true)}${t?`<span class="pf-fm-team">${badge(o.tid,22)}</span>`:''}${pk?cimgBtns(pk):''}</div>
    <div class="pf-fm-name">${o.eyebrow?`<span class="pc-eb">${esc(o.eyebrow)}</span>`:''}<b>${esc(o.name)}</b>${o.sub?`<span>${o.sub}</span>`:''}${o.pills?`<span class="pc-pills">${o.pills}</span>`:''}</div>
    ${o.keys&&o.keys.length?`<div class="pf-fm-key pc-keys">${o.keys.map(([l,v,s])=>`<div><span>${esc(l)}</span><b class="pc-kv">${v}</b>${s?`<small>${s}</small>`:''}</div>`).join('')}</div>`:''}
    ${o.sum?`<div class="pf-fm-role pc-sum"><b>${esc(o.sum.t)}</b>${o.sum.d?`<span>${esc(o.sum.d)}</span>`:''}</div>`:''}</section>`; }
/* 능력 차트: 축 [이름, 내부 값, 내부 값, 보일 말(없으면 화면 숫자)] */
function personRadar(ax,cap){
  return `<section class="card pf-radar pc-radar"><h3>능력 차트</h3>${radarSVG(ax,false,true)}<p class="small keep pf-rd-key"><i class="k1"></i>현재 <i class="k3"></i>중간 기준</p>${cap?`<p class="small muted keep pc-cap">${cap}</p>`:''}</section>`; }
/* 세부 능력 표: cols = [[{h, rows:[[이름, 값, 'n'(숫자)|'w'(말), 설명]], html}]] */
function personAttrs(title,cols,foot){
  const row=([l,v,k,d])=>k==='n'?`<div class="pf-attribute-row"${d?` title="${esc(d)}"`:''}><span>${esc(l)}</span><b class="pf-score" style="color:${rcol(v)}">${dv(v)}</b></div>`
    :`<div class="pf-attribute-row text"${d?` title="${esc(d)}"`:''}><span>${esc(l)}</span><b class="pf-score">${esc(v)}</b></div>`;
  return `<section class="card pf-attributes pc-attrs"><div class="pf-section-title"><h3>${esc(title)}</h3></div><div class="pf-attribute-grid pc-grid${cols.length}">${cols.map(col=>`<div class="pf-attribute-column">${col.map(g=>`<section class="pf-attribute-group"><h3>${esc(g.h)}</h3>${(g.rows||[]).map(row).join('')}${g.html||''}</section>`).join('')}</div>`).join('')}</div>${foot||''}</section>`; }
function personGrid(hero,radar,attrs){ return `<div class="pcx">${hero}${radar}${attrs}</div>`; }

/* 감독: 화면에 이미 숫자로 보이는 능력 4개 + 말로만 보이는 고집·인지도(구간 말 그대로) */
const MGR_AB=[['장악력','disc','선수단 기강·불만 관리'],['운영','tac','경기 중 판단(작전·교체 타이밍)'],['안목','eye','유망주·선수 평가 정확도'],['휴식 관리','rest','주전 피로·부상 관리']];
const mgrEgoW=m=>m.ego>=70?'고집 셈':m.ego<=35?'유연함':'고집 보통', mgrFameW=m=>m.fame>=70?'스타 감독':m.fame<=35?'인지도 낮음':'인지도 보통';
function mgrRadarAx(m){ mgrAttr(m); const eg=m.ego>=70?35:m.ego<=35?68:51, fm=m.fame>=70?68:m.fame<=35?35:51; /* 말 구간의 대표 위치만 찍는다 */
  return [...MGR_AB.map(([l,k])=>[l,m[k],m[k]]),['유연성',eg,eg,mgrEgoW(m).replace('고집 보통','보통')],['인지도',fm,fm,mgrFameW(m).replace('인지도 ','').replace(' 감독','')]]; }
/* o: {tid, own, eyebrow, contract(HTML), rel(관계 줄 [[이름,말]])} */
function mgrProfileView(m,o){ o=o||{}; mgrFix(m); const ty=mgrType(m), v=MV[mgrVoice(m)];
  const pills=`${m.fame>=70?'<span class="pill warn">스타 감독</span>':''}${m.ego>=70?'<span class="pill bad">고집</span>':''}${m.interim?'<span class="pill">감독대행</span>':''}${obTag(m.ob)}`;
  const keys=o.own?[['연봉',money(m.sal||0),m.interim?'감독대행':'1년'],...(m.interim?[]:[['계약',`${Math.max(0,m.yrs||0)}년`,'남은 기간']])]:o.cand?[['요구 연봉',money(m.sal||0),'1년'],['계약 시작',`${ctStartS()}`,'시즌']]:[]; /* 다른 구단 감독 연봉은 원래 보이지 않는다 */
  const hero=personHero({av:{persona:'mgr',pid:m.id,name:m.name,age:m.age,team:o.tid??G.user},tid:o.tid,eyebrow:o.eyebrow||'감독',name:m.name,sub:`${m.age}세 · ${esc(m.career||'')}`,pills,keys,sum:{t:ty.n,d:ty.d}});
  const radar=personRadar(mgrRadarAx(m),'유연성·인지도는 말로만 봅니다.');
  const cols=[[{h:'능력',rows:MGR_AB.map(([l,k,d])=>[l,m[k],'n',d])},{h:'성격',rows:[['고집',mgrEgoW(m),'w','높을수록 단장 지시를 덜 받아들입니다'],['인지도',mgrFameW(m),'w','팬·언론 관심'],['말투',v?v.l:'-','w',v?v.d:''],...(o.rel||[]).map(([l,w])=>[l,w,'w'])]}],
    [{h:'운영 성향',html:mgrStyleBox(m)+`<p class="small muted keep pc-note">${esc(mgrYouthWord(m.youth))}</p>`}]];
  return personGrid(hero,radar,personAttrs('세부 능력',cols));
}

/* 코치: 기본 지도·육성과 세부 지도 능력(모두 화면 숫자) */
const CAB_S=k=>CAB[k].replace(' 지도','').replace('유망주 ','').replace('데이터 ','');
function coachProfileView(c,o){ o=o||{}; const a=cAb(c)||{}, D=CDOM[c.role]||[], order=[...new Set([...D,'yng','com','ana','stf','con','def','ctl','pow','spd'])].slice(0,6) /* 차트는 늘 6축: 맡은 자리 능력부터 */, rest=Object.keys(CAB).filter(k=>!D.includes(k)&&!['yng','com','ana'].includes(k));
  const role=(c.ax?'보조 ':'')+(CROLE[c.role]?.l||'코치'), S=cStrong(c), W=cWeak(c);
  const hero=personHero({av:{persona:'coach',pid:c.id,name:c.name,age:c.age,team:o.tid??G.user},tid:o.tid,eyebrow:o.eyebrow||role,name:c.name,sub:`${c.age}세${c.car?' · '+esc(c.car):''}`,pills:(typeof coachTag==='function'?coachTag(c):'')+(c.ob?obTag(c.ob):''),
    keys:[['기본 지도',rchip(c.sk),''],['기본 육성',rchip(c.dv),'']],sum:{t:`연 ${money(c.sal||0)}${c.ce?` · ${c.ce}년까지`:''}`,d:c.ax?'선수 육성을 돕는 보조 코치입니다.':(CROLE[c.role]?.d||'')}});
  const radar=personRadar(order.map(k=>[CAB_S(k),a[k],a[k]]),'기본 지도·육성은 세부 능력을 종합한 값입니다. 현재 근무 값에는 감독 사단·궁합이 반영됩니다.');
  const tags=`${S.map(k=>`<span class="pill good">${CAB[k]} 강점</span>`).join('')}${W.map(k=>`<span class="pill warn">${CAB[k]} 약함</span>`).join('')}`;
  const cols=[[{h:'맡은 자리 능력',rows:D.map(k=>[CAB[k],a[k],'n'])},{h:'공통 능력',rows:['yng','com','ana'].filter(k=>!D.includes(k)).map(k=>[CAB[k],a[k],'n'])}],[{h:'그 밖의 지도',rows:rest.map(k=>[CAB[k],a[k],'n'])}]];
  return personGrid(hero,radar,personAttrs('세부 능력 · 100점 척도',cols,tags?`<div class="pc-tags">${tags}</div>`:''));
}

/* 인물 창(personSheet)에서 쓰는 큰 카드. 없으면 null(옛 카드 그대로). rest: 카드 아래에 이어 붙일 면담·관계 상자 */
function personProfileOf(k){ const [kind,a]=String(k).split(':');
  if(kind==='mgr'||kind==='omgr'||kind==='xmgr'){ const m=kind==='mgr'?G.mgr[G.user]:kind==='xmgr'?exMgrOf(a):G.mgr[+a]; if(!m)return null; const tid=kind==='mgr'?G.user:kind==='omgr'?+a:null, rel=[];
    if(kind==='mgr'&&G.coach){ const C=coachesOf(G.user), cl=CKEYS.filter(r=>C[r]&&C[r].clan===m.id).map(r=>C[r].name); if(cl.length)rel.push(['감독 사단',cl.join(', ')]); }
    if(kind==='mgr'){ const fav=playersOf(G.user).filter(p=>p.promise&&p.promise.until>=G.day).map(p=>p.name); if(fav.length)rel.push(['출전 약속',fav.join(', ')]); }
    return {html:mgrProfileView(m,{own:kind==='mgr',tid,eyebrow:kind==='mgr'?(m.interim?'감독대행':'1군 감독'):kind==='omgr'?`${tname(tid)} 감독`:'전 감독',rel}),rest:networkPersonBlock(m,'mgr')}; }
  if(kind==='c'){ const st=staffPerson(k); if(!st)return null; return {html:coachProfileView(st.s,{tid:st.tid}),rest:staffBioBox(st.s,'coach',st.tid,true)+networkPersonBlock(st.s,'coach')}; }
  return null; }
