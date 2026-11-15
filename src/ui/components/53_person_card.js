/* ---------- 인물 카드 공통 틀(감독·코치) ----------
   선수 상황판과 같은 틀을 쓴다: 큰 사진 카드(pf-fmcard), 능력 차트(radarSVG 큰 차트), 세부 능력 표(pf-attribute-*).
   화면에 숫자로 보이던 값만 숫자로, 말로 보이던 값(고집·인지도·성격)은 그대로 말로 보인다. 새로 드러내는 값은 없다. */
/* 사진 카드. o: {av, tid, eyebrow, name, sub, pills, keys:[[이름, 값 HTML, 작은 글]], sum:{t,d}} */
function personHero(o){
  const t=o.tid!=null&&G&&G.teams&&G.teams[o.tid]?G.teams[o.tid]:null, P=t?tpal(t):null, st=P?`--pt:${P[2]};--pt2:${P[3]}`:'';
  const pk=o.btns!=null?null:cimgKey(o.av); /* btns: 사진 버튼을 따로 줄 때(우리 단장은 단장 정보 사진) */
  return `<section class="card pf-fmcard ph pc-hero" style="${st}"><div class="pf-fm-face">${avImg(o.av,true)}${t?`<span class="pf-fm-team">${badge(o.tid,22)}</span>`:''}${o.btns!=null?o.btns:pk?cimgBtns(pk):''}</div>
    <div class="pf-fm-name">${o.eyebrow?`<span class="pc-eb">${esc(o.eyebrow)}</span>`:''}<b>${esc(o.name)}</b>${o.sub?`<span>${o.sub}</span>`:''}${o.pills?`<span class="pc-pills">${o.pills}</span>`:''}</div>
    ${o.keys&&o.keys.length?`<div class="pf-fm-key pc-keys">${o.keys.map(([l,v,s])=>`<div><span>${esc(l)}</span><b class="pc-kv">${v}</b>${s?`<small>${s}</small>`:''}</div>`).join('')}</div>`:''}
    ${o.sum?`<div class="pf-fm-role pc-sum"><b>${esc(o.sum.t)}</b>${o.sum.d?`<span>${esc(o.sum.d)}</span>`:''}</div>`:''}</section>`; }
/* 능력 차트: 축 [이름, 내부 값, 내부 값, 보일 말(없으면 화면 숫자)] */
function personRadar(ax,cap,title){
  return `<section class="card pf-radar pc-radar"><h3>${esc(title||'능력 차트')}</h3>${radarSVG(ax,false,true)}<p class="small keep pf-rd-key"><i class="k1"></i>현재 <i class="k3"></i>중간 기준</p>${cap?`<p class="small muted keep pc-cap">${cap}</p>`:''}</section>`; }
/* 세부 능력 표: cols = [[{h, rows:[[이름, 값, 'n'(숫자)|'w'(말), 설명]], html}]] */
function personAttrs(title,cols,foot){
  const row=([l,v,k,d])=>k==='r'?`<div class="pf-attribute-row"${d?` title="${esc(d)}"`:''}><span>${esc(l)}</span><b class="pf-score" style="color:${rcol(pcInv(v))}">${Math.round(v)}</b></div>` /* r: 화면에 100점 그대로 보이던 값(단장 능력) */
    :k==='n'?`<div class="pf-attribute-row"${d?` title="${esc(d)}"`:''}><span>${esc(l)}</span><b class="pf-score" style="color:${rcol(v)}">${dv(v)}</b></div>`
    :`<div class="pf-attribute-row text"${d?` title="${esc(d)}"`:''}><span>${esc(l)}</span><b class="pf-score">${esc(v)}</b></div>`;
  return `<section class="card pf-attributes pc-attrs"><div class="pf-section-title"><h3>${esc(title)}</h3></div><div class="pf-attribute-grid pc-grid${cols.length}">${cols.map(col=>`<div class="pf-attribute-column">${col.map(g=>`<section class="pf-attribute-group"><h3>${esc(g.h)}</h3>${(g.rows||[]).map(row).join('')}${g.html||''}</section>`).join('')}</div>`).join('')}</div>${foot||''}</section>`; }
function personGrid(hero,radar,attrs){ return `<div class="pcx${radar?'':' pcx2'}">${hero}${radar}${attrs}</div>`; } /* 차트가 없으면(실제 축 3개 미만) 사진 카드 | 세부 표 두 칸 */
/* 100점으로 보이던 값을 차트 안쪽 척도로(radarSVG는 dvRaw로 그린다) */
function pcInv(v){ let lo=0, hi=120; for(let i=0;i<28;i++){ const m=(lo+hi)/2; if(dvRaw(m)<v)lo=m; else hi=m; } return (lo+hi)/2; }
const rawAx=(l,v)=>{ const x=pcInv(clamp(v,0,100)); return [l,x,x,String(Math.round(v))]; }; /* 숫자는 화면에 보이던 그대로 */
const wordAx=(l,p,w)=>{ const x=pcInv(p); return [l,x,x,w]; }; /* 말 구간: 대표 위치에만 찍고 말로 보인다 */
const pcStars=n=>`<span class="pc-star">${'★'.repeat(n||0)}<i>${'★'.repeat(Math.max(0,5-(n||0)))}</i></span>`;

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
function coachProfileView(c,o){ /* o.more: 성격·관계 말 줄, o.avTeam: 사진 유니폼 구단(후보) */ o=o||{}; const a=cAb(c)||{}, D=CDOM[c.role]||[], order=[...new Set([...D,'yng','com','ana','stf','con','def','ctl','pow','spd'])].slice(0,6) /* 차트는 늘 6축: 맡은 자리 능력부터 */, rest=Object.keys(CAB).filter(k=>!D.includes(k)&&!['yng','com','ana'].includes(k));
  const role=(c.ax?'보조 ':'')+(CROLE[c.role]?.l||'코치'), S=cStrong(c), W=cWeak(c);
  const hero=personHero({av:{persona:'coach',pid:c.id,name:c.name,age:c.age,team:o.avTeam!==undefined?o.avTeam:o.tid??G.user},tid:o.tid,eyebrow:o.eyebrow||role,name:c.name,sub:`${c.age}세${c.car?' · '+esc(c.car):''}`,pills:(typeof coachTag==='function'?coachTag(c):'')+(c.ob?obTag(c.ob):''),
    keys:[['기본 지도',rchip(c.sk),''],['기본 육성',rchip(c.dv),'']],sum:{t:`연 ${money(c.sal||0)}${c.ce?` · ${c.ce}년까지`:''}`,d:c.ax?'선수 육성을 돕는 보조 코치입니다.':(CROLE[c.role]?.d||'')}});
  const radar=personRadar(order.map(k=>[CAB_S(k),a[k],a[k]]),'기본 지도·육성은 세부 능력을 종합한 값입니다. 현재 근무 값에는 감독 사단·궁합이 반영됩니다.');
  const tags=`${S.map(k=>`<span class="pill good">${CAB[k]} 강점</span>`).join('')}${W.map(k=>`<span class="pill warn">${CAB[k]} 약함</span>`).join('')}`;
  const cols=[[{h:'맡은 자리 능력',rows:D.map(k=>[CAB[k],a[k],'n'])},{h:'공통 능력',rows:['yng','com','ana'].filter(k=>!D.includes(k)).map(k=>[CAB[k],a[k],'n'])}],[{h:'그 밖의 지도',rows:rest.map(k=>[CAB[k],a[k],'n'])},...(o.more&&o.more.length?[{h:'성격·관계',rows:o.more.map(([l,w,d])=>[l,w,'w',d])}]:[])]];
  return personGrid(hero,radar,personAttrs('세부 능력 · 100점 척도',cols,tags?`<div class="pc-tags">${tags}</div>`:''));
}

/* 인물 창(personSheet)에서 쓰는 큰 카드. 없으면 null(옛 카드 그대로). rest: 카드 아래에 이어 붙일 면담·관계 상자 */
function personProfileOf(k){ const [kind,a]=String(k).split(':');
  if(kind==='mgr'||kind==='omgr'||kind==='xmgr'){ const m=kind==='mgr'?G.mgr[G.user]:kind==='xmgr'?exMgrOf(a):G.mgr[+a]; if(!m)return null; const tid=kind==='mgr'?G.user:kind==='omgr'?+a:null, rel=[];
    if(kind==='mgr'&&G.coach){ const C=coachesOf(G.user), cl=CKEYS.filter(r=>C[r]&&C[r].clan===m.id).map(r=>C[r].name); if(cl.length)rel.push(['감독 사단',cl.join(', ')]); }
    if(kind==='mgr'){ const fav=playersOf(G.user).filter(p=>p.promise&&p.promise.until>=G.day).map(p=>p.name); if(fav.length)rel.push(['출전 약속',fav.join(', ')]); }
    return {html:mgrProfileView(m,{own:kind==='mgr',tid,eyebrow:kind==='mgr'?(m.interim?'감독대행':'1군 감독'):kind==='omgr'?`${tname(tid)} 감독`:'전 감독',rel}),rest:networkPersonBlock(m,'mgr')}; }
  if(kind==='c'){ const st=staffPerson(k); if(!st)return null; return {html:coachProfileView(st.s,{tid:st.tid}),rest:staffBioBox(st.s,'coach',st.tid,true)+networkPersonBlock(st.s,'coach')}; }
  if(kind==='sc'||kind==='an'||kind==='ost'){ const st=staffPerson(k); if(!st)return null; const J=st.kind==='scout'?'스카우트':'전력분석원';
    return {html:staffProfileView(st.s,st.kind,{tid:st.tid,eyebrow:st.tid!==G.user?`${tname(st.tid)} ${J}`:J}),rest:staffBioBox(st.s,st.kind,st.tid,true,true)+networkPersonBlock(st.s,st.kind)}; } /* 분야 능력 숫자는 카드 안 차트·표로, 아래 상자는 희망 보직·멘탈·관계·면담 */
  if(kind==='oc'){ const tid=+a, role=String(k).split(':')[2], c=G.coach&&coachesOf(tid)[role]; if(!c)return null; const h=u01('cpers',c.id), m=G.mgr[tid];
    const more=[['성격',h<.33?'원칙형':h<.66?'소통형':'열정형',h<.33?'규율을 중시합니다':h<.66?'선수와 대화를 많이 합니다':'훈련량이 많고 목소리가 큽니다'],['감독',m?m.name:'-'],...(c.clan&&m&&c.clan===m.id?[['감독 사단','감독과 함께 온 코치']]:[])];
    return {html:coachProfileView(c,{tid,eyebrow:`${tname(tid)} ${CROLE[role]?.l||'코치'}`,more}),rest:staffBioBox(c,'coach',tid,true)}; }
  if(kind==='gm'){ const tid=+a, g=team(tid)&&gmOf(tid); if(!g)return null; return {html:ogmProfileView(g,tid),rest:''}; }
  if(kind==='own'||kind==='ceo')return {html:bossProfileView(kind,G.user),rest:''};
  if(kind==='oown'||kind==='oceo'){ const tid=+a; if(!team(tid)||tid===G.user)return null; return {html:bossProfileView(kind,tid),rest:''}; }
  if(kind==='rep'){ const r=repById(a); return r?{html:repProfileView(r),rest:''}:null; }
  if(kind==='agt'){ const ag=agById(+a); return ag?{html:agtProfileView(ag),rest:''}:null; }
  return null; }

/* 스카우트·전력분석원(우리·다른 구단): 화면에 숫자로 보이던 분야 능력 3개 + 말로만 보이던 멘탈 3개(구간 대표 위치) */
const STAFF_OF={scout:[['pitch','투수 평가','투수'],['bat','타자 평가','타자'],['potential','잠재력 판별','잠재력']],analyst:[['opp','상대 전력분석','상대 분석'],['trk','트래킹 해석','트래킹'],['vid','영상 분석','영상']]};
const traitPos=v=>v>=78?86:v>=62?70:v>=42?52:v>=28?35:22; /* staffTraitWord 구간의 가운데 */
function staffJob(s,kind){ if(kind!=='scout')return AROLE[s.role]?.l||''; return s.role==='intl'?`해외 ${IREG[s.region]?IREG[s.region].l:s.region||''}`:`${SROLE[s.role||'am']}${s.region?' · '+s.region:''}`; }
function staffProfileView(s,kind,o){ o=o||{}; stAttr(s); const P=staffProfile(s,kind), F=STAFF_OF[kind], sc=kind==='scout', tid=o.tid??G.user;
  const sumD=sc?(s.role==='intl'?'해외 리그 선수를 봅니다.':s.role==='pro'?'다른 구단 선수를 봅니다.':'아마추어 선수를 봅니다.'):(AROLE[s.role]?.d||'');
  const hero=personHero({av:{persona:'staff',role:sc?'scout':'ana',pid:s.id,team:tid,age:s.age,name:s.name},tid,eyebrow:o.eyebrow,name:s.name,sub:`${s.age}세${s.car?' · '+esc(s.car):''}`,pills:sc&&s.spec?`<span class="pill acc">${esc(SC_SPEC[s.spec])}</span>`:'',
    keys:[['능력',pcStars(s.skill),''],['연봉',money(s.sal||0),'1년']],sum:{t:staffJob(s,kind),d:sumD}});
  const radar=personRadar([...F.map(([k,,l])=>{ const v=staffOfficeV(s,kind,k); return [l,v,v]; }),...Object.entries(STAFF_MENTAL).map(([k,l])=>wordAx(l,traitPos(P.mental[k]),staffTraitWord(P.mental[k])))],'프로의식·인내심·적응력은 말로만 봅니다.');
  const duty=[['보직',staffJob(s,kind),'w'],...(sc&&s.spec?[['특기',SC_SPEC[s.spec],'w','그 유형 선수를 볼 때 한 단계 정확합니다']]:[]),...(sc&&typeof scHomeTxt==='function'?[['고향',scHomeTxt(s),'w']]:[]),['소속',tname(tid),'w']];
  const cols=[[{h:'업무 능력',rows:F.map(([k,l])=>[l,staffOfficeV(s,kind,k),'n'])}],[{h:'담당',rows:duty}]];
  return personGrid(hero,radar,personAttrs('세부 능력',cols));
}

/* 다른 구단 단장: 화면에 100점으로 보이던 능력 4개(선수 보는 눈·협상력·구단 설계·재정 운영) */
const GM_AB=[['선수 보는 눈','eye','성적 운에 덜 속습니다'],['협상력','neg','트레이드에서 부르는 조건'],['구단 설계','plan','감독 야구에 맞는 선수를 찾는 일관성'],['재정 운영','money','노장 FA에 돈을 덜 씁니다']];
function ogmProfileView(g,tid){ const A=gmAbil(g), rc=gmRecord(tid), gc=gmCon(g,tid), v=gmVoice(g), T=GMT[g.trait]||{l:'단장대행',d:''};
  const tags=(typeof aiGmTags==='function'?aiGmTags(tid):[]).map(x=>`<span class="pill" title="${esc(x.d)}">${esc(x.l)}</span>`).join('');
  const hero=personHero({av:{persona:'gm',pid:g.id,team:tid,age:g.age,female:g.f,name:g.name},tid,eyebrow:`${tname(tid)} 단장`,name:g.name,sub:`${g.age?g.age+'세':''}${g.car?' · '+esc(g.car):''}`,pills:(g.ob?obTag(g.ob):'')+tags,
    keys:[...(gc?[['연봉',money(gc.sal),`${gc.y1}년까지`]]:[]),['재임',rc&&rc.n?`${rc.n}시즌`:`${g.since}년~`,rc&&rc.n?`평균 ${rc.avg.toFixed(1)}위${rc.ch?` · 우승 ${rc.ch}회`:''}`:'취임']],sum:{t:T.l,d:T.d}});
  const radar=A?personRadar(GM_AB.map(([l,k])=>rawAx(l,A[k]))):'';
  const rel=[['성향',T.l,'w',T.d],...(v&&GMV[v]?[['말투',GMV[v].l,'w',GMV[v].d]]:[]),['우리와 친분',relLabel(team(tid).rel),'w']];
  const cols=A?[[{h:'능력 · 100점',rows:GM_AB.map(([l,k,d])=>[l,A[k],'r',d])}],[{h:'성향·관계',rows:rel}]]:[[{h:'성향·관계',rows:rel}]];
  return personGrid(hero,radar,personAttrs('세부 능력',cols));
}

/* 우리 단장: 능력 수치가 따로 없다. 이미 화면에 보이는 실적(트레이드 WAR 차·다른 단장 친분·평균 순위·결산 손익)을 같은 네 축의 말로 */
function meAxes(){ const T=meTradeStats(), seas=((G.myC&&G.myC.seas)||[]).filter(x=>!x.part&&x.rank), N=G.teams.length;
  const ys=new Set(seas.map(x=>x.y)), nets=(G.history||[]).filter(h=>ys.has(h.y)&&h.user&&h.user.net!=null).map(h=>h.user.net);
  const gr=G.unemp?[]:G.teams.filter(t=>t.id!==G.user&&t.rel!=null).map(t=>t.rel), R=[];
  R.push(T.n?{l:'선수 보는 눈',p:clamp(50+T.net*4,20,95),w:`${T.net>=0?'+':''}${T.net.toFixed(1)} WAR`,t:`트레이드 ${T.n}건 · 거래 뒤 WAR 차 합계`}:{l:'선수 보는 눈',t:'트레이드를 하면 거래 뒤 WAR 차로 봅니다'});
  if(gr.length){ const r=avg(gr); R.push({l:'협상력',p:r>=80?85:r>=65?72:r>=45?55:r>=30?38:25,w:r>=80?'막역':r>=65?'친함':r>=45?'무난':r>=30?'서먹':'껄끄러움',wl:relLabel(r),t:'다른 구단 단장들과의 평균 친분. 친할수록 같은 선수를 싸게 받습니다'}); } else R.push({l:'협상력',t:'구단을 맡으면 다른 단장과의 친분으로 봅니다'});
  if(seas.length){ const a=avg(seas.map(x=>x.rank)); R.push({l:'구단 설계',p:clamp(95-(a-1)/Math.max(1,N-1)*70,20,95),w:`평균 ${a.toFixed(1)}위`,t:`마친 ${seas.length}시즌 순위 평균`}); } else R.push({l:'구단 설계',t:'시즌을 마치면 순위로 봅니다'});
  if(nets.length){ const n=avg(nets); R.push({l:'재정 운영',p:clamp(50+n/100*1.5,20,92),w:`${n>=0?'흑자':'적자'} ${money(Math.abs(n))}`,t:`마친 ${nets.length}시즌 결산 손익 평균`}); } else R.push({l:'재정 운영',t:'시즌 결산이 나오면 손익으로 봅니다'});
  return R; }
function meProfileView(){ const P=G.gmP, C=G.unemp?null:(()=>{ try{ return myCInit(); }catch(e){ return null; } })(), age=meAge(), nick=meNick(), rep=G.rep??50, R=meAxes(), real=R.filter(x=>x.p!=null);
  const btns=`<span class="cimg-b"><label class="btn small" title="갤러리 사진으로 바꾸기">사진<input type="file" accept="image/*" data-meimg hidden></label>${P.img?'<button class="btn small" data-a="meImgDel">원래대로</button>':''}<button class="btn small" data-a="gpEdit">고치기</button></span>`;
  const hero=personHero({av:meAv(),tid:G.unemp?null:G.user,btns,eyebrow:G.unemp?'야인':`${tname(G.user)} 단장${C&&C.y0?` · ${C.y0}년부터`:''}`,name:P.name,sub:`${age}세 · ${esc(GM_BG[P.bg]||'')}`,
    pills:`${nick?`<span class="pill acc">별명: ${esc(nick)}</span>`:''}${GMV[P.voice]?`<span class="pill">말투 · ${esc(GMV[P.voice].l)}</span>`:''}`,
    keys:[['명성',String(rep),esc(repLabel(rep))],...(G.unemp?[]:[['구단주 신뢰',String(Math.round(team(G.user).trust)),'']])],sum:{t:GM_BG[P.bg]||'',d:GM_BGD[P.bg]?GM_BGD[P.bg]+'.':''}});
  const radar=real.length>=3?personRadar(R.map(x=>x.p!=null?wordAx(x.l,x.p,x.w):wordAx(x.l,50,'기록 없음')),'실적으로 봅니다. 기록이 쌓일수록 정확해집니다.','실적 차트'):'';
  const cols=[[{h:'실적',rows:R.map(x=>[x.l,x.p!=null?(x.wl||x.w):'기록 없음','w',x.t])}],[{h:'단장 정보',rows:[['출신',GM_BG[P.bg]||'-','w',GM_BGD[P.bg]||''],['말투',GMV[P.voice]?GMV[P.voice].l:'담백','w'],...meTags().slice(0,3).map(x=>['스타일',x.l,'w',x.d])]}]];
  return personGrid(hero,radar,personAttrs('세부 정보',cols,radar?'':`<p class="small muted keep pc-note">시즌을 마치고 트레이드가 쌓이면 실적 차트가 나옵니다.</p>`));
}

/* 구단주·사장(우리·다른 구단): 수치 축이 적다. 구단주는 평가 비중 3축, 사장은 차트 없이 말로만 */
const OW_AX=[['순위',0,'순위 성적'],['재정',2,'재정'],['여론',3,'팬 여론']], owW=w=>w>=1.3?'가장 중시':w>=.8?'중시':'덜 봄';
function bossProfileView(kind,tid){ const mine=tid===G.user, t=team(tid), B=bossOf(tid), isOwn=kind==='own'||kind==='oown', x=isOwn?B.own:B.ceo, ow=OWNER[t.owner];
  const c=u01('ceoP',B.ceo.id), bud=40+c*40, fld=30+u01('ceoQ',B.ceo.id)*50;
  const keys=isOwn?(mine?[['신뢰',String(Math.round(t.trust)),t.trust>=60?'두터운 신임':t.trust>=40?'지켜보는 중':t.trust>=25?'불신':'경질 검토']]:[['올해 목표',`${goalRankOf(tid)}위 이내`,'']]):(mine?[['예산 여유',money(budget().roomGoal),'올해']]:[]);
  const hero=personHero({av:isOwn?{persona:'own',pid:x.id,team:tid,age:x.age,name:x.name}:{persona:'staff',pid:x.id,team:tid,age:x.age,name:x.name},tid,eyebrow:mine?(isOwn?'구단주 · 모기업 회장':'대표이사 사장'):`${tname(tid)} ${isOwn?'구단주':'사장'}`,name:x.name,sub:`${x.age}세${!isOwn&&x.car?' · '+esc(x.car):''}`,
    keys,sum:isOwn?{t:ow.label,d:OWNTRAIT[t.owner]||ow.msg}:{t:c>.5?'진취적':'보수적',d:c>.5?'투자에 비교적 열려 있습니다.':'지출 하나하나를 따집니다.'}});
  if(isOwn){ const radar=personRadar(OW_AX.map(([l,i])=>wordAx(l,clamp(25+ow.w[i]*40,20,95),owW(ow.w[i]))),'단장을 평가할 때 보는 비중입니다.','평가 비중');
    const cols=[[{h:'평가 비중',rows:OW_AX.map(([,i,l])=>[l,owW(ow.w[i]),'w'])}],[{h:'구단',rows:[['사장',B.ceo.name,'w'],['단장',mine?(G.gmP?.name||'-'):(gmOf(tid)?gmOf(tid).name:'-'),'w'],...(mine?[['친밀도',cwRapLbl(cwRap('own')),'w','홈경기 동석으로 오릅니다']]:[['운영',modeLabel(t),'w']]),['구단 형태',t.indie?'독립구단(투자사)':'모기업 구단','w']]}]];
    return personGrid(hero,radar,personAttrs('세부 정보',cols)); }
  const cols=[[{h:'성향',rows:[['투자',c>.5?'진취적':'보수적','w'],['예산 재량',bud>=65?'넓음':bud>=52?'보통':'좁음','w'],['현장 이해',fld>=62?'깊음':fld>=46?'보통':'얕음','w']]}],[{h:'관계',rows:[['구단주',B.own.name,'w','구단주의 뜻을 단장에게 전합니다'],...(mine?[['친밀도',cwRapLbl(cwRap('ceo')),'w','홈경기를 함께 보면 오릅니다']]:[])]}]];
  return personGrid(hero,'',personAttrs('세부 정보',cols)); }

/* 기자: 영향력(별) 하나뿐이라 차트 없이 */
function repProfileView(r){ const O=(typeof OUTLET_DEF!=='undefined'&&OUTLET_DEF[r.outlet])||{}, S=PR_STYLE[r.style]||{l:'',d:''};
  const hero=personHero({av:{persona:'agent',pid:r.id+r.name,age:r.age,female:r.female,expr:relEx(r.rel),name:r.name},eyebrow:`${r.outlet} 기자`,name:r.name,sub:`${r.age?r.age+'세 · ':''}${esc(r.field||'')}`,
    keys:[['영향력',`<span class="pc-star">${'★'.repeat(r.inf||0)}</span>`,''],['관계',esc(relLabel(r.rel)),'']],sum:{t:S.l,d:S.d}});
  const cols=[[{h:'기자',rows:[['매체',r.outlet,'w'],['매체 논조',OUTLET_LEAN[O.lean]||'-','w'],['분야',r.field||'-','w'],['성향',S.l,'w']]}],[{h:'관계',rows:[['단장과 관계',relLabel(r.rel),'w'],...(r.last?[['최근 변화',`${dsh(r.last.d)} ${r.last.why} · ${r.last.dv>0?'가까워짐':r.last.dv<0?'멀어짐':'그대로'}`,'w']]:[]),['귀띔','아주 가까우면 다른 구단 동향을 알려 줍니다','w']]}]];
  return personGrid(hero,'',personAttrs('세부 정보',cols)); }

/* 에이전트: 협상력·시장 정보는 회사 규모에서 나온 말 */
function agtProfileView(ag){ const st=AG_STYLE[ag.style]||AG_STYLE.rel, cl=faLive()?agClients(ag):[], r=agRel(ag), dl=(ag.deals&&ag.deals[G.user])||0;
  const hero=personHero({av:{persona:'agent',pid:'agt'+ag.id+ag.name,age:ag.size==='big'?52:ag.size==='mid'?46:39,female:!!ag.female,expr:relEx(r),name:ag.name},eyebrow:ag.firm,name:ag.name,sub:esc(AG_SIZE[ag.size]||''),
    keys:[['우리와 계약',`${dl}건`,''],['FA 고객',`${cl.length}명`,'이번 겨울']],sum:{t:st.l,d:st.d}});
  const cols=[[{h:'에이전트',rows:[['소속',ag.firm,'w'],['규모',AG_SIZE[ag.size]||'-','w'],['협상력',ag.size==='big'?'강함':ag.size==='mid'?'보통':'약함','w'],['시장 정보',ag.size==='big'?'넓음':'보통','w']]}],[{h:'관계',rows:[['친분',agRelLab(r),'w'],...(cl.length?[['FA 고객',cl.map(p=>p.name).join(', '),'w']]:[])]}]];
  return personGrid(hero,'',personAttrs('세부 정보',cols)); }

