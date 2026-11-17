/* ===== 관리자 페이지 › 래더 현황: 유저 래더 참여도·서버 사용량 관찰 =====
   서버 v1(D1)이 켜져 있으면 GET /api/v1/admin/stats(관리자 키) 하나로: 오늘/7일/30일 활성·신규 덱·완료 리그·승격·강등, 단계별 분포, 14일 추이, 시간대별 리그 완료,
   플랫폼 비율(web/android/steam), 상위 플레이어·최근 승격·최근 등록 덱(숨김/삭제), 오늘 D1 읽기/쓰기·KV 쓰기 추정과 무료 한도 대비 %.
   D1이 아직 없으면(503 not_configured·schema_missing) 지금의 KV 래더(/api/ladder/tiers·admin/list)로 등록 덱 수·단계별만 보여 주고 'D1을 연결하면 더 자세히' 안내.
   탭 전환은 02_cup_admin.js의 cupAdminView가 ADM.tab으로 한다. 키(ADM.key)는 같은 관리자 키(CUP_ADMIN)
   srv2(11-17): 사용량 막대는 100%에서 멈추고 숫자는 실제 %(150% 등) · 막대 그래프마다 '값 보기' 표 · 숨기기/삭제 뒤 현황을 다시 받아 목록·합계를 맞춘다(공개 캐시 지연 안내) ·
     CSV는 서버 페이지(전체 수·잘림·다음 페이지, 날짜 범위) */
const LDA={st:'',d:null,kv:null,msg:'',bad:false,at:0};
const ldaApi=(p,o)=>{ o=o||{}; return fetch(p,Object.assign({cache:'no-store',credentials:'same-origin'},o,{headers:Object.assign({Authorization:'Bearer '+ADM.key},o.body!=null?{'Content-Type':'application/json'}:{})})).then(async r=>({r,j:await cupJson(r)})); };
async function ldaLoad(keep){ LDA.st='loading'; try{ render(); }catch(e){}
  try{ const {r,j}=await ldaApi('/api/v1/admin/stats');
    if(r.ok){ Object.assign(LDA,{st:'d1',d:j,kv:null,at:Date.now()}); if(!keep){ LDA.msg=''; LDA.bad=false; } try{ const x=await ldaApi('/api/v1/ladder/meta?tier=all'); LDA.meta=x.r.ok?x.j:null; }catch(e){ LDA.meta=null; } } /* 덱 구성(래더 v2, 사용자 11-17) */
    else if(r.status===503||r.status===404){ const t=await ldaApi('/api/ladder/tiers').catch(()=>null), l=await ldaApi('/api/ladder/admin/list').catch(()=>null);
      Object.assign(LDA,{st:'kv',d:null,why:j.error||'not_configured',kv:{counts:t&&t.r.ok?t.j.counts||[]:null,n:l&&l.r.ok?l.j.n:null,decks:l&&l.r.ok?(l.j.decks||[]).slice(0,20):[]},at:Date.now()}); }
    else Object.assign(LDA,{st:'err',msg:j.message||('서버 응답 '+r.status),bad:true});
  }catch(e){ Object.assign(LDA,{st:'err',msg:'서버에 연결할 수 없습니다.',bad:true}); }
  try{ render(); }catch(e){} }
const ldaDay=ms=>{ const d=new Date(ms+9*3600e3); return `${d.getUTCMonth()+1}월 ${d.getUTCDate()}일`; }; /* 한국시간 날짜 */
const ldaN=n=>(+n||0).toLocaleString('ko-KR');
const ldaAgo=ms=>{ if(!ms)return ''; const m=Math.round((Date.now()-ms)/60000); return m<1?'방금':m<60?m+'분 전':m<1440?Math.round(m/60)+'시간 전':Math.round(m/1440)+'일 전'; };
/* 작은 막대: 값 목록 → 세로 막대 칸(가장 큰 값이 꽉 참). 마우스를 올리면 제목(title)에 값, 화면 읽기·휴대폰은 아래 '값 보기' 표(srv2 #55). 가장 큰 값·합계는 늘 보인다 */
function ldaBars(vals,labs,cls,name){ const mx=Math.max(1,...vals), tot=vals.reduce((a,v)=>a+(+v||0),0), top=vals.indexOf(Math.max(...vals));
  return `<div class="lda-bars ${cls||''}" role="img" aria-label="${esc(name||'막대')}: ${vals.map((v,i)=>esc(labs[i])+' '+ldaN(v)).join(', ')}">${vals.map((v,i)=>`<span title="${esc(labs[i])} · ${ldaN(v)}"><i style="height:${Math.round(v/mx*100)}%"></i><em>${esc(labs[i])}</em></span>`).join('')}</div>
    <p class="small muted lda-bv">합계 <b class="num">${ldaN(tot)}</b>${vals.length&&tot?` · 가장 많음 ${esc(labs[top])} <b class="num">${ldaN(vals[top])}</b>`:''}</p>
    <details class="lda-dt small"><summary>값 보기</summary><table class="lda-t"><thead><tr><th scope="col">${cls&&/hours/.test(cls)?'시각':'날짜'}</th><th scope="col">${esc(name||'값')}</th></tr></thead><tbody>${vals.map((v,i)=>`<tr><th scope="row">${esc(labs[i])}</th><td class="num">${ldaN(v)}</td></tr>`).join('')}</tbody></table></details>`; }
/* 사용량: 막대 폭만 100%에서 멈추고 글자는 실제 %(srv2 #47: 한도를 넘으면 150%처럼 보인다) */
function ldaMeter(lab,v,max,pct){ const real=pct??((v||0)/max*100), p=Math.min(100,real); return `<div class="lda-m${real>=80?' hot':real>=50?' warm':''}"><span>${lab}</span><b class="num">${ldaN(v)} / ${ldaN(max)}</b><span class="lda-mb" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(real*10)/10}" aria-label="${esc(lab)} 무료 한도 대비"><i style="width:${Math.max(p>0?1:0,p)}%"></i></span><span class="num small">${(Math.round(real*10)/10)}%${real>100?' (한도 넘음)':''}</span></div>`; }
const LDA_KEYS=[['active','활성 플레이어'],['decks_new','새 덱'],['leagues','완료한 리그'],['promos','승격'],['demos','강등']];
function ldaD1(){ const d=LDA.d, C=FrontOfficeCore, W=d.windows, s=d.season||{};
  const sum=`<section class="card"><h2 class="sec">참여도</h2><p class="small muted">시즌 ${s.id||'-'} · ${s.ends?ldaDay(s.starts)+' ~ '+ldaDay(s.ends-1):''} · 전체 플레이어 ${ldaN(d.totals.players)} · 등록 덱 ${ldaN(d.totals.decks)}${d.totals.hidden?` · 숨김 ${d.totals.hidden}`:''}</p>
    <table class="lda-t"><thead><tr><th></th><th>오늘</th><th>7일</th><th>30일</th></tr></thead><tbody>${LDA_KEYS.map(([k,lab])=>`<tr><th>${lab}</th>${['today','d7','d30'].map(w=>`<td class="num">${ldaN(W[w][k])}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <p class="small muted">활성 = 그날(기간 안에) 한 번이라도 접속한 플레이어. 7일·30일 활성은 겹치지 않게 센 수입니다.</p></section>`;
  const P=d.platforms||{}, pt=Math.max(1,(P.web||0)+(P.android||0)+(P.steam||0));
  const plat=`<section class="card"><h2 class="sec">플랫폼(최근 7일 접속)</h2><div class="lda-plat">${[['web','웹'],['android','안드로이드'],['steam','스팀']].map(([k,l])=>`<span class="lda-p lda-${k}" style="flex:${Math.max(.0001,(P[k]||0)/pt)}" title="${l} ${P[k]||0}"></span>`).join('')}</div>
    <p class="small">${[['web','웹'],['android','안드로이드'],['steam','스팀']].map(([k,l])=>`${l} <b class="num">${Math.round((P[k]||0)/pt*100)}%</b>`).join(' · ')}</p><p class="small muted">플레이어별 하루 첫 접속을 7일 동안 더한 비율입니다.${!(P.android||P.steam)?' 앱(플레이스토어·스팀)이 나오면 여기에 나뉘어 보입니다.':''}</p></section>`;
  const U=d.usage||{}, F=U.free||{};
  const use=`<section class="card"><h2 class="sec">서버 사용량(오늘 추정)</h2>${ldaMeter('D1 읽기',U.d1_r,F.d1_r,U.pct&&U.pct.d1_r)}${ldaMeter('D1 쓰기',U.d1_w,F.d1_w,U.pct&&U.pct.d1_w)}${ldaMeter('KV 쓰기',U.kv_w,F.kv_w,U.pct&&U.pct.kv_w)}
    <p class="small muted">무료 한도(하루) 대비입니다. ${esc(U.note||'')} 유료(월 $5)는 D1 쓰기 월 5천만 줄·KV 쓰기 월 100만 번까지 포함.</p></section>`;
  const T=d.trend||[], H=d.hours||{d7:[]};
  const trend=`<section class="card"><h2 class="sec">최근 14일</h2><p class="small muted">완료한 리그</p>${ldaBars(T.map(x=>x.leagues),T.map(x=>x.day.slice(5).replace('-','/')),'lda-trend','완료한 리그')}
    <p class="small muted">활성 플레이어</p>${ldaBars(T.map(x=>x.active),T.map(x=>x.day.slice(5).replace('-','/')),'lda-trend lda-alt','활성 플레이어')}
    <p class="small muted">시간대별 리그 완료(7일 합, 한국시간)</p>${ldaBars(H.d7||[],(H.d7||[]).map((_,h)=>h+'시'),'lda-hours','리그 완료(7일 합)')}</section>`;
  const tmx=Math.max(1,...d.tiers.map(t=>Math.max(t.players,t.decks)));
  const tiers=`<section class="card"><h2 class="sec">단계별 분포</h2><div class="lda-tiers">${d.tiers.slice().reverse().map(t=>`<div><span>${esc(t.name)}</span><span class="lda-hb"><i style="width:${t.players/tmx*100}%"></i><i class="d" style="width:${t.decks/tmx*100}%"></i></span><span class="num small">${t.players}명 · 덱 ${t.decks} · 리그 ${ldaN(t.leagues)}</span></div>`).join('')}</div>
    <p class="small muted">막대: 이번 시즌 참여한 플레이어(진한 색) · 그 단계 등록 덱(옅은 색)</p></section>`;
  const top=`<section class="card"><h2 class="sec">상위 플레이어(이번 시즌)</h2>${(d.top||[]).length?`<ol class="lda-list">${d.top.map(x=>`<li><b>${esc(x.nickname)}</b>${x.hidden?' <span class="pill">숨김</span>':''} <span class="small muted">${C.ulTierName(x.tier)} · ${ldaN(x.points)}점 · 리그 ${x.leagues} · 우승 ${x.wins}</span></li>`).join('')}</ol>`:'<p class="small muted">아직 리그를 마친 플레이어가 없습니다.</p>'}</section>`;
  const KIND={promo:'승격',demote:'강등',crown:'레전드 우승',season_top:'시즌 상위'};
  const feed=`<section class="card"><h2 class="sec">최근 소식</h2>${(d.feed||[]).length?`<ul class="lda-list">${d.feed.map(x=>`<li><b>${esc(x.nickname)}</b> <span class="small">${KIND[x.kind]||esc(x.kind)} ${x.tier_from!=null&&x.kind!=='season_top'?`${C.ulTierName(x.tier_from)} → ${C.ulTierName(x.tier_to)}`:C.ulTierName(x.tier_to)}</span> <span class="small muted">${ldaAgo(x.at)}</span></li>`).join('')}</ul>`:'<p class="small muted">아직 없습니다.</p>'}</section>`;
  const decks=`<section class="card"><h2 class="sec">최근 등록 덱</h2><div class="adm-ents">${(d.decks||[]).map(x=>`<div class="adm-day"><span><b>${esc(x.name)}</b> ${esc(x.year||'')} <span class="small muted">${esc(x.nickname)} · ${C.ulTierName(x.tier)} · OVR ${x.ovr||'-'} · ${esc(x.platform||'web')} · ${ldaAgo(x.at)}</span>${x.hidden?' <span class="pill">숨김</span>':''}</span><span class="btns"><button class="btn small" data-a="ldaHide" data-v="${esc(x.pid)}" data-u="${x.hidden?1:0}">${x.hidden?'보이기':'숨기기'}</button><button class="btn small" data-a="ldaDel" data-v="${esc(x.pid)}">삭제</button></span></div>`).join('')||'<p class="small muted">아직 없습니다.</p>'}</div>${d.cache&&d.cache.text?`<p class="small muted" data-cache-note>숨기기·삭제 반영: ${esc(d.cache.text)}</p>`:''}</section>`;
  return [sum+plat+use,trend+tiers+ldaMetaHtml(),top+feed+ldaCsvHtml()+decks]; }
/* 덱 구성(메타, 래더 v2): 서버 공용 집계(/ladder/meta?tier=all)를 그대로 */
function ldaMetaHtml(){ const M=LDA.meta, A=M&&M.agg, C=FrontOfficeCore; if(!A)return `<section class="card"><h2 class="sec">덱 구성(메타)</h2><p class="small muted">집계를 받지 못했습니다.</p></section>`;
  const an=Math.max(1,A.n), ar=Object.entries(A.arch||{}).sort((a,b)=>b[1]-a[1]);
  return `<section class="card"><h2 class="sec">덱 구성(메타)</h2><p class="small muted">최근 45일 등록 덱 ${ldaN(A.n)}개 · 평균 OVR ${A.t.avg} · 외국인 ${Math.round(A.fr*1000)/10}% · 평균 나이 ${A.aa}</p>
    <table class="lda-t"><thead><tr><th>자리</th>${C.UL_POS.map(k=>`<th>${k}</th>`).join('')}<th>SP</th><th>RP</th></tr></thead><tbody><tr><th>평균</th>${C.UL_POS.map(k=>`<td class="num">${A.pos[k].avg||'-'}</td>`).join('')}<td class="num">${A.sp.avg||'-'}</td><td class="num">${A.rp.avg||'-'}</td></tr></tbody></table>
    <div class="lda-tiers">${ar.map(([k,v])=>`<div><span>${esc(C.UL_ARCH[k])}</span><span class="lda-hb"><i style="width:${v/an*100}%"></i></span><span class="num small">${v}덱 · ${Math.round(v/an*100)}%</span></div>`).join('')}</div></section>`; }
/* CSV(srv2 #52): 한 번에 최대 2000줄. 서버가 전체 수·잘림·다음 커서를 주면 '다음 페이지'로 이어 받는다. 날짜(한국시간)로 범위를 줄일 수 있다 */
function ldaCsvHtml(){ const P=LDA.csvPage, F=LDA.csvRange||{}, lab={decks:'등록 덱',results:'리그 결과'};
  const info=P?`<p class="small${P.truncated?' warn':''}" data-csv-info>${lab[P.kind]} ${P.page}쪽: 전체 <b class="num">${ldaN(P.total)}</b>줄 중 <b class="num">${ldaN(P.from)}~${ldaN(P.to)}</b>번째 ${ldaN(P.returned)}줄을 받았습니다.${P.truncated?' 남은 줄이 있습니다(잘림).':' 마지막 쪽입니다.'}</p>${P.next?`<div class="btns"><button class="btn small" data-a="ldaCsv" data-v="${P.kind}" data-u="${esc(P.next)}">${lab[P.kind]} 다음 페이지</button></div>`:''}`:'';
  return `<section class="card"><h2 class="sec">CSV 내보내기</h2><p class="small muted">등록 덱(구성 요약 포함)·리그 결과를 최근 것부터 한 번에 2000줄씩 파일로 받습니다. 더 있으면 '다음 페이지'로 이어 받습니다.</p>
    <div class="row small" style="gap:6px;flex-wrap:wrap;align-items:center"><label>시작 <input type="date" id="lda-from" value="${esc(F.from||'')}"></label><label>끝 <input type="date" id="lda-to" value="${esc(F.to||'')}"></label><span class="muted">(비우면 전체, 한국시간)</span></div>
    <div class="btns"><button class="btn small" data-a="ldaCsv" data-v="decks">등록 덱 CSV</button><button class="btn small" data-a="ldaCsv" data-v="results">리그 결과 CSV</button></div>${info}</section>`; }
/* 서버가 알려 준 공개 캐시 지연(srv2 #62) */
const ldaCacheNote=j=>(j&&j.cache&&j.cache.text)||(LDA.d&&LDA.d.cache&&LDA.d.cache.text)||'';
function ldaKV(){ const k=LDA.kv||{}, C=FrontOfficeCore, cn=k.counts||[], mx=Math.max(1,...cn);
  const info=`<section class="card lda-kv"><h2 class="sec">지금은 기본 정보만 보입니다</h2><p class="small">서버 데이터베이스(D1)가 아직 연결되지 않아 지금의 래더 저장소(KV) 기준으로 <b>등록 덱 수와 단계별 분포</b>만 보여 줍니다.</p>
    <p class="small">D1을 연결하면 활성 플레이어·완료한 리그·승격/강등·일별 추이·시간대·플랫폼·서버 사용량까지 자세히 볼 수 있습니다. 설정 순서: <b>docs/server-setup.md</b> (D1 만들기 → 워커에 바인딩 DB → 콘솔에 SQL 붙여 넣기).</p>
    <p class="small muted">${LDA.why==='schema_missing'?'D1은 연결됐지만 표가 아직 없습니다(SQL 실행 전).':'D1 바인딩 없음'}</p></section>`;
  const tiers=`<section class="card"><h2 class="sec">등록 덱 ${k.n!=null?ldaN(k.n)+'개':''}</h2>${cn.length?`<div class="lda-tiers">${cn.map((n,t)=>[n,t]).reverse().map(([n,t])=>`<div><span>${esc(C.ulTierName(t))}</span><span class="lda-hb"><i style="width:${n/mx*100}%"></i></span><span class="num small">덱 ${n}</span></div>`).join('')}</div>`:'<p class="small muted">단계별 수를 받지 못했습니다.</p>'}</section>`;
  const recent=`<section class="card"><h2 class="sec">최근 등록 덱</h2><div class="adm-ents">${(k.decks||[]).map(x=>`<div class="adm-day"><span><b>${esc(x.name||'')}</b> ${esc(x.year||'')} <span class="small muted">${C.ulTierName(x.tier)} · OVR ${esc(C.cupOvrTxt(x.ovr))} · ${ldaAgo(x.at)}</span>${x.hidden||x.hide?' <span class="pill">숨김</span>':''}</span></div>`).join('')||'<p class="small muted">없습니다.</p>'}</div><p class="small muted">숨기기·삭제는 '프런트컵' 탭의 6. 유저 래더 관리에서 합니다.</p></section>`;
  return [info,tiers,recent]; }
function ladderAdminView(){
  if(!LDA.st)setTimeout(ldaLoad,0);
  const head=`<section class="card lda-head"><div class="row"><h2 class="sec" style="margin:0;flex:1">래더 현황</h2><span class="small muted">${LDA.at?ldaAgo(LDA.at)+' 받음':''}${LDA.st==='d1'?' · 서버 v1(D1)':LDA.st==='kv'?' · KV 기본 정보':''}</span><button class="btn small" data-a="ldaLoad"${LDA.st==='loading'?' disabled':''}>새로고침</button></div>${LDA.msg?`<div class="note${LDA.bad?' bad':''}">${esc(LDA.msg)}</div>`:''}</section>`;
  const cols=LDA.st==='d1'&&LDA.d?ldaD1():LDA.st==='kv'?ldaKV():[LDA.st==='err'?'':'<section class="card"><p class="small muted">불러오는 중입니다.</p></section>','',''];
  return `<div class="setc">${head}${cols[0]}</div><div class="setc">${cols[1]}</div><div class="setc">${cols[2]}</div>`; }
Object.assign(A,{
  ldaLoad(){ ldaLoad(); },
  /* 숨기기·삭제(srv2 #56): 성공하면 현황을 다시 받아 상위·소식·최근 덱·합계를 서버 값으로 맞춘다. 공개 화면 반영 지연은 서버가 알려 준 대로(#62) */
  async ldaHide(v,el){ const hide=el&&el.dataset.u!=='1'; const {r,j}=await ldaApi('/api/v1/admin/hide',{method:'PUT',body:JSON.stringify({pid:v,hide})}).catch(()=>({r:{ok:false},j:{}}));
    if(!r.ok){ LDA.msg=j.message||'바꾸지 못했습니다.'; LDA.bad=true; return render(); } for(const x of (LDA.d&&LDA.d.decks)||[])if(x.pid===v)x.hidden=hide?1:0;
    LDA.msg=(hide?'숨겼습니다. 순위표·소식·상대 목록에서 빠집니다. ':'다시 보이게 했습니다. ')+ldaCacheNote(j); LDA.bad=false; await ldaLoad(true); },
  async ldaDel(v){ if(!confirm('이 플레이어의 래더 덱을 지웁니다(기록은 남습니다).'))return; const {r,j}=await ldaApi('/api/v1/admin/deck/'+encodeURIComponent(v),{method:'DELETE'}).catch(()=>({r:{ok:false},j:{}}));
    if(!r.ok){ LDA.msg=j.message||'지우지 못했습니다.'; LDA.bad=true; return render(); } if(LDA.d)LDA.d.decks=(LDA.d.decks||[]).filter(x=>x.pid!==v); LDA.msg='덱을 지웠습니다. '+ldaCacheNote(j); LDA.bad=false; await ldaLoad(true); },
  async ldaCsv(v,el){ const kind=v==='results'?'results':'decks', cur=el&&el.dataset.u||'', P=LDA.csvPage;
    const f=(document.getElementById('lda-from')||{}).value||'', t=(document.getElementById('lda-to')||{}).value||'';
    const R0=cur&&LDA.csvRange?LDA.csvRange:{from:f,to:t}; /* 다음 페이지는 처음 고른 범위 그대로 */
    const q=new URLSearchParams({kind}); if(cur)q.set('cursor',cur); if(R0.from)q.set('from',R0.from); if(R0.to)q.set('to',R0.to); if(LDA.csvN)q.set('n',LDA.csvN); /* 쪽 크기(점검용, 보통은 서버 기본 2000) */
    const {r,j}=await ldaApi('/api/v1/admin/export?'+q).catch(()=>({r:{ok:false},j:{}})); if(!r.ok){ LDA.msg=j.message||'받지 못했습니다.'; LDA.bad=true; return render(); }
    const C=FrontOfficeCore, tn=t=>C.ulTierName(t), day=ms=>ms?new Date(ms+9*3600e3).toISOString().slice(0,16).replace('T',' '):'', R=j.rows||[];
    const csv=kind==='results'?C.ulCsv(R,[['nickname','닉네임'],['pid','플레이어'],['season','시즌'],[x=>tn(x.tier),'단계'],[x=>tn(x.to_tier),'다음 단계'],['rank','순위'],['teams','팀 수'],['w','승'],['l','패'],['d','무'],['delta','포인트'],[x=>day(x.at),'시각(KST)']])
      :C.ulCsv(R,[['nickname','닉네임'],['pid','플레이어'],['platform','플랫폼'],['hidden','숨김'],['name','덱'],['year','연도'],[x=>tn(x.tier),'단계'],['ovr','OVR'],['ovr_p','투'],['ovr_b','타'],[x=>x.meta&&C.UL_ARCH[x.meta.a],'성향'],[x=>x.meta&&x.meta.fr,'외국인'],[x=>x.meta&&x.meta.aa,'평균 나이'],[x=>x.meta&&x.meta.sp,'선발'],[x=>x.meta&&x.meta.rp,'불펜'],...C.UL_POS.map(k=>[x=>x.meta&&x.meta.pos[k],k]),[x=>day(x.at),'갱신(KST)']]);
    const cont=!!cur&&P&&P.kind===kind, page=cont?P.page+1:1, from=cont?P.to+1:1, total=j.total!=null?j.total:R.length;
    LDA.csvRange=R0; LDA.csvPage={kind,page,total,returned:R.length,from:R.length?from:0,to:from+R.length-1,truncated:!!j.truncated,next:j.next||null};
    const name='ladder-admin-'+kind+(R0.from||R0.to?'-'+(R0.from||'')+'_'+(R0.to||''):'')+(page>1?'-p'+page:'');
    LDA.msg=ulDownload(name,csv)?`${R.length}줄을 CSV로 받았습니다.${j.truncated?` 전체 ${ldaN(total)}줄 가운데 일부입니다. 아래 '다음 페이지'로 이어 받으세요.`:''}`:'이 브라우저에서는 파일을 받을 수 없습니다.'; LDA.bad=false; LDA.csv=csv; render(); },
  admTab(v){ ADM.tab=v==='ld'?'ld':'cup'; if(ADM.tab==='ld'&&LDA.st!=='loading')LDA.st=''; render(); },
});
