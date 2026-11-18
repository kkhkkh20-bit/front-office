/* ===== 관리자 페이지 › 래더 현황: 유저 래더 참여도·서버 사용량 관찰 =====
   서버 v1(D1)이 켜져 있으면 GET /api/v1/admin/stats(관리자 키) 하나로: 오늘/7일/30일 활성·신규 덱·완료 리그·승격·강등, 단계별 분포, 14일 추이, 시간대별 리그 완료,
   플랫폼 비율(web/android/steam), 상위 플레이어·최근 승격·최근 등록 덱(숨김/삭제), 오늘 D1 읽기/쓰기·KV 쓰기 추정과 무료 한도 대비 %.
   D1이 아직 없으면(503 not_configured·schema_missing) 지금의 KV 래더(/api/ladder/tiers·admin/list)로 등록 덱 수·단계별만 보여 주고 'D1을 연결하면 더 자세히' 안내.
   탭 전환은 02_cup_admin.js의 cupAdminView가 ADM.tab으로 한다. 키(ADM.key)는 같은 관리자 키(CUP_ADMIN)
   srv2(11-17): 사용량 막대는 100%에서 멈추고 숫자는 실제 %(150% 등) · 막대 그래프마다 '값 보기' 표 · 숨기기/삭제 뒤 현황을 다시 받아 목록·합계를 맞춘다(공개 캐시 지연 안내) ·
     CSV는 서버 페이지(전체 수·잘림·다음 페이지, 날짜 범위) */
const LDA={st:'',d:null,kv:null,msg:'',bad:false,at:0};
const ldaApi=(p,o)=>{ o=o||{}; return fetch(p,Object.assign({cache:'no-store',credentials:'same-origin'},o,{headers:Object.assign({Authorization:'Bearer '+ADM.key},o.body!=null?{'Content-Type':'application/json'}:{})})).then(async r=>({r,j:await cupJson(r)})); };
async function ldaLoad(keep,quiet){ if(!(quiet&&LDA.st==='d1'))LDA.st='loading'; LDA.ref=!!quiet; try{ render(); }catch(e){}
  try{ const {r,j}=await ldaApi('/api/v1/admin/stats');
    if(r.ok){ try{ await ldbLoad(); }catch(e){} Object.assign(LDA,{st:'d1',d:j,kv:null,at:Date.now(),ref:false}); if(!keep){ LDA.msg=''; LDA.bad=false; } try{ const x=await ldaApi('/api/v1/ladder/meta?tier=all'); LDA.meta=x.r.ok?x.j:null; }catch(e){ LDA.meta=null; } } /* 덱 구성(래더 v2, 사용자 11-17) · 한눈 보기(래더 v4: ldbLoad) */
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
  return [ldbRegHtml()+ldbFlagHtml()+sum+plat+use,ldbLeagueHtml()+ldbSeasonHtml()+trend+tiers+ldaMetaHtml(),ldbDeckHtml()+top+feed+ldaCsvHtml()+decks]; } /* 래더 v4 한눈 보기(구단주 11-18 §10)를 칸마다 맨 위에: 등록·이상 | 리그·시즌 판 | 덱 목록 */
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
  const head=`<section class="card lda-head"><div class="row"><h2 class="sec" style="margin:0;flex:1">래더 현황</h2><span class="small muted" data-lda-at>${LDA.ref?'새로 받는 중 · ':''}${LDA.at?ldaAgo(LDA.at)+' 받음 · 30초마다 새로고침':''}${LDA.st==='d1'?' · 서버 v1(D1)':LDA.st==='kv'?' · KV 기본 정보':''}</span><button class="btn small" data-a="ldaLoad"${LDA.st==='loading'?' disabled':''}>새로고침</button></div>${LDA.msg?`<div class="note${LDA.bad?' bad':''}">${esc(LDA.msg)}</div>`:''}</section>`;
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
/* ===== 래더 v4 관리자 한눈 보기(구단주 11-18, docs/design/ladder-v4-2026-11-18.md §10) =====
   GET /api/v1/admin/dash(등록 현황·리그 상황·시즌 판·이상 감지) + admin/decks(검색·단계 필터) + admin/league(들여다보기). 30초마다 조용히 새로 받는다(입력 중이면 미룬다).
   PC는 세 칸이 안에서만 스크롤(한 화면), 휴대폰은 위에서 아래로 */
const LDB={dash:null,decks:null,q:'',tier:'all',lg:null,lgSt:'',bt:null,dErr:''};
async function ldbLoad(){ const q=new URLSearchParams({n:'80'}); if(LDB.q)q.set('q',LDB.q); if(LDB.tier!=='all')q.set('tier',LDB.tier);
  const [a,b]=await Promise.all([ldaApi('/api/v1/admin/dash').catch(()=>null),ldaApi('/api/v1/admin/decks?'+q).catch(()=>null)]);
  LDB.dash=a&&a.r.ok?a.j:LDB.dash; LDB.decks=b&&b.r.ok?b.j:LDB.decks; LDB.dErr=a&&a.r.ok?'':'한눈 보기 자료를 받지 못했습니다.'; }
const ldbT=t=>FrontOfficeCore.ulTierName(t);
const ldbFlagTxt=f=>String(f||'').split(',').filter(Boolean).map(x=>x==='mismatch'?'결과 불일치':x==='winrate'?'비정상 승률':x).join(' · ');
function ldbRegHtml(){ const D=LDB.dash; if(!D)return `<section class="card ldb-reg"><h2 class="sec">등록 현황</h2><p class="small muted">${esc(LDB.dErr||'받는 중입니다.')}</p></section>`; const R=D.reg;
  return `<section class="card ldb-reg"><h2 class="sec">등록 현황</h2><div class="ldb-kpi">${[['등록 덱',R.total],['자동',R.auto],['직접',R.manual],['오늘 새로',R.new_today],['7일 새로',R.new_7d],['상한 초과',R.over],['자동 참가 끔',R.off]].map(([l,v])=>`<div><span>${l}</span><b class="num">${ldaN(v)}</b></div>`).join('')}</div>
    <table class="lda-t ldb-t"><thead><tr><th scope="col">단계</th><th scope="col">덱</th><th scope="col">자동</th><th scope="col">직접</th><th scope="col">상한 초과</th></tr></thead><tbody>${R.tiers.slice().reverse().map(t=>`<tr><th scope="row">${esc(t.name)}</th><td class="num">${t.n}</td><td class="num">${t.auto}</td><td class="num">${t.manual}</td><td class="num${t.over?' ldb-warn':''}">${t.over}</td></tr>`).join('')}</tbody></table>
    <p class="small muted">상한 초과 덱은 등록은 되지만 그 단계 리그(상대 목록·리그 시작)에는 나가지 않습니다.</p></section>`; }
function ldbFlagHtml(){ const D=LDB.dash; if(!D)return ''; const F=D.flags||{}, n=(F.results||[]).length+(F.winrate||[]).length+(F.dev||[]).length;
  const li=(L,f)=>L.length?`<ul class="lda-list ldb-fl">${L.map(f).join('')}</ul>`:'<p class="small muted">없음</p>';
  return `<section class="card ldb-flags${n?' ldb-hot':''}"><h2 class="sec">이상 감지 <small>${n}</small></h2>
    <p class="dk-t">결과 대조 불일치·비정상 승률(리그)</p>${li(F.results||[],x=>`<li><button class="lnk" data-a="ldbLg" data-v="${x.id}">${esc(x.nickname||x.pid)}</button> <span class="small">${ldbT(x.tier)} ${x.rank}위 ${x.w}승 ${x.l}패${x.d?` ${x.d}무`:''} · <b class="ldb-warn">${esc(ldbFlagTxt(x.flag))}</b></span> <span class="small muted">${ldaAgo(x.at)}</span></li>`)}
    <p class="dk-t">이번 시즌 승률 9할 넘음(리그 2번 이상)</p>${li(F.winrate||[],x=>`<li><b>${esc(x.nickname)}</b> <span class="small">리그 ${x.leagues} · ${x.w}승 ${x.l}패${x.d?` ${x.d}무`:''}</span> <button class="btn small" data-a="ldaDkHide" data-v="${esc(x.pid)}" data-u="0">숨기기</button></li>`)}
    <p class="dk-t">같은 기기에서 여러 덱</p>${li(F.dev||[],x=>`<li><span class="small muted">기기 ${esc(x.dev)}…</span> <b>${x.n}덱</b> <span class="small">${esc(x.nicks||'')}</span></li>`)}
    <p class="small muted">기기는 기기에서 만든 무작위 번호의 해시로만 구분합니다(이름·IP 아님).</p></section>`; }
/* 서버가 마지막으로 보고받은 단계만 표시합니다. 구형 보고는 준결승·결승을 추측하지 않습니다. */
function ldbLiveProgress(x){ const labels={'regular-done':'정규 9라운드 완료 · 준결승 전','semi-ready':'준결승 전','semi-one-done':'준결승 1/2 완료','final-ready':'준결승 2/2 완료 · 결승 전','complete':'결승 완료'};
  return labels[x.stage]||(x.post?'포스트시즌 · 세부 단계 미기록':`${x.round}/9라운드`); }
function ldbLeagueHtml(){ const D=LDB.dash; if(!D)return ''; const lv=D.live||[], rc=D.recent||[];
  const live=lv.length?`<table class="lda-t ldb-t"><thead><tr><th scope="col">유저</th><th scope="col">단계</th><th scope="col">덱</th><th scope="col">진행</th></tr></thead><tbody>${lv.map(x=>`<tr><th scope="row"><button class="lnk" data-a="ldbLive" data-v="${esc(x.pid)}">${esc(x.nickname||x.pid)}</button></th><td>${ldbT(x.tier)}</td><td class="num">${x.decks}${x.users?` <span class="muted">(유저 ${x.users})</span>`:''}</td><td>${esc(ldbLiveProgress(x))} <span class="muted small">${ldaAgo(x.at)}</span></td></tr>`).join('')}</tbody></table>`:'<p class="small muted">최근 3일 동안 받은 진행 보고가 없습니다.</p>';
  const ps=x=>x.ps==='c'?' · <b>우승</b>':x.ps==='r'?' · 준우승':'';
  const rec=rc.length?`<ul class="lda-list ldb-rc">${rc.map(x=>`<li><button class="lnk" data-a="ldbLg" data-v="${x.id}">${esc(x.nickname||x.pid)}</button> <span class="small">${ldbT(x.tier)} 정규 ${x.rank}위${ps(x)} · 우승 <b>${esc(x.champ||'-')}</b> · 준우승 ${esc(x.runner||'-')} · 정규 1위 ${esc(x.top||'-')}</span>${x.flag?` <span class="pill ldb-warn">${esc(ldbFlagTxt(x.flag))}</span>`:''} <span class="small muted">${ldaAgo(x.at)}</span></li>`).join('')}</ul>`:'<p class="small muted">아직 끝난 리그가 없습니다.</p>';
  return `<section class="card ldb-lg"><h2 class="sec">리그 상황</h2><p class="dk-t">최근 진행 보고 <small>${lv.length}</small></p><p class="small muted">마지막 보고 기준입니다. 연결이 끊긴 기기의 종료는 다시 연결되면 반영됩니다.</p>${live}<p class="dk-t">최근 끝난 리그</p>${rec}${ldbLgView()}</section>`; }
function ldbLgView(){ const G0=LDB.lg; if(LDB.lgSt==='loading')return '<p class="small muted ldb-lgv">리그를 받는 중입니다.</p>'; if(!G0)return LDB.lgSt==='err'?'<p class="small muted ldb-lgv">리그를 받지 못했습니다.</p>':'';
  const L=G0.league, st=L.st||[], T=G0.team, lines=G0.lines||[];
  const tbl=st.length?`<table class="lda-t ldb-t"><thead><tr><th scope="col">순위</th><th scope="col">팀</th><th scope="col">승</th><th scope="col">패</th><th scope="col">무</th></tr></thead><tbody>${st.map((r,i)=>`<tr class="${r[4]==='me'?'ldb-me':''}"><td class="num">${i+1}</td><th scope="row">${esc(r[0])} <span class="muted small">${r[4]==='me'?'이 유저':r[4]==='ai'?'AI':r[4]==='cup'?'우승 덱':'유저'}</span></th><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td></tr>`).join('')}</tbody></table>`:'<p class="small muted">순위표가 없는 예전 결과입니다.</p>';
  const B=lines.filter(x=>x.kind==='b'), P=lines.filter(x=>x.kind==='p'), avg=x=>x.ab?(x.h/x.ab).toFixed(3).replace(/^0/,''):'-', era=x=>x.outs?(x.er*27/x.outs).toFixed(2):'-';
  const rec=T||lines.length?`<p class="small">${T?`팀 ${esc(T.team||'')} · 득점 ${T.rs} · 실점 ${T.ra} · 홈런 ${T.hr}`:''}</p>${B.length?`<p class="small">타자 ${B.slice(0,6).map(x=>`${esc(x.name)} ${avg(x)} ${x.hr}홈런 ${x.rbi}타점`).join(' · ')}</p>`:''}${P.length?`<p class="small">투수 ${P.slice(0,5).map(x=>`${esc(x.name)} ERA ${era(x)} ${x.so}K${x.sv?` ${x.sv}세`:''}`).join(' · ')}</p>`:''}`:'';
  return `<div class="ldb-lgv" data-ldb-lg><p class="dk-t">${esc(L.nickname||L.pid)} · ${ldbT(L.tier)} ${G0.live?`마지막 보고: ${esc(ldbLiveProgress(L))}`:`정규 ${L.rank}위${L.champ?` · 우승 ${esc(L.champ)}`:''}`} <button class="btn small" data-a="ldbLgClose">닫기</button></p>${L.flag?`<p class="small ldb-warn">${esc(ldbFlagTxt(L.flag))}</p>`:''}${tbl}${rec}</div>`; }
function ldbSeasonHtml(){ const D=LDB.dash; if(!D)return ''; const B=D.board||[], first=B.find(x=>x.rows.length), bt=LDB.bt!=null?LDB.bt:first?first.tier:4, cur=B.find(x=>x.tier===bt)||{rows:[]}, Ld=D.leaders||{}, S=D.season||{};
  const LAB=[['hr','홈런'],['avg','타율'],['ops','OPS'],['rbi','타점'],['sb','도루'],['era','평균자책점'],['so','탈삼진'],['sv','세이브'],['w','승리'],['titles','최다 우승']];
  const lead=LAB.filter(([k])=>Ld[k]).map(([k,l])=>`<div><span>${l}</span><b>${esc(Ld[k].nick||'')}</b> <span class="small">${esc(Ld[k].name||Ld[k].team||'')}</span> <em class="num">${esc(String(Ld[k].v))}</em></div>`).join('');
  return `<section class="card ldb-season"><h2 class="sec">시즌 판 <small>시즌 ${S.id||'-'} · ${S.days_left!=null?`${S.days_left}일 남음`:''}</small></h2><div class="chips">${B.map(x=>`<button data-a="ldbBt" data-v="${x.tier}" class="${x.tier===bt?'on':''}" aria-pressed="${x.tier===bt}">${esc(x.name)} <small>${x.rows.length}</small></button>`).join('')}</div>
    ${cur.rows.length?`<table class="lda-t ldb-t"><thead><tr><th scope="col">순위</th><th scope="col">유저 · 팀</th><th scope="col">포인트</th><th scope="col">리그</th><th scope="col">우승</th></tr></thead><tbody>${cur.rows.map(x=>`<tr><td class="num">${x.rank}</td><th scope="row">${esc(x.nickname)} <span class="small muted">${esc(x.team||'')}</span></th><td class="num">${x.points}</td><td class="num">${x.leagues}</td><td class="num">${x.wins}</td></tr>`).join('')}</tbody></table>`:'<p class="small muted">이 단계에서 리그를 마친 유저가 아직 없습니다.</p>'}
    <p class="dk-t">서버 기록 1위</p>${lead?`<div class="ldb-lead">${lead}</div>`:'<p class="small muted">아직 기록이 없습니다.</p>'}</section>`; }
function ldbDeckHtml(){ const K=LDB.decks, rows=K?K.decks||[]:null;
  const tools=`<div class="ldb-find"><input type="search" id="ldbQ" value="${esc(LDB.q)}" placeholder="닉네임·구단·pid" aria-label="덱 찾기"><select id="ldbTier" aria-label="단계">${[['all','모든 단계'],...FrontOfficeCore.UL_TIERS.map((n,i)=>[String(i),n])].map(([v,l])=>`<option value="${v}"${String(LDB.tier)===v?' selected':''}>${l}</option>`).join('')}</select><button class="btn small" data-a="ldbFind">찾기</button></div>`;
  const list=!rows?'<p class="small muted">받는 중입니다.</p>':rows.length?`<div class="ldb-dl">${rows.map(x=>`<div class="ldb-dk${x.hidden?' hid':''}"><div class="ldb-dn"><b>${esc(x.nickname||'')}</b> <span class="small">${esc(x.name)}</span>${x.hidden?' <span class="pill">숨김</span>':''}${x.cap_ok?'':' <span class="pill ldb-warn">상한 초과</span>'} <span class="pill">${x.auto?'자동':'직접'}</span></div>
      <div class="ldb-dm small muted">${ldbT(x.tier)} · OVR <b class="num">${x.ovr||'-'}</b> · 연봉 ${x.pay_x!=null?`<b class="num">${x.pay_x}</b>배`:'-'} · ${ldaAgo(x.at)} 갱신 · 진행 중 리그 <b class="num">${x.active||0}</b></div>
      <div class="btns"><button class="btn small" data-a="ldaDkHide" data-v="${esc(x.pid)}" data-u="${x.hidden?1:0}">${x.hidden?'보이기':'숨기기'}</button><button class="btn small" data-a="ldaDkDel" data-v="${esc(x.pid)}">삭제</button></div></div>`).join('')}</div><p class="small muted">${K.total}개 가운데 ${K.returned}개(최근 갱신 순). 연봉 = 덱 연봉 ÷ 첫 시즌 샐러리캡.</p>`:'<p class="small muted">찾는 덱이 없습니다.</p>';
  return `<section class="card ldb-decks"><h2 class="sec">덱 목록</h2>${tools}${list}</section>`; }
Object.assign(A,{
  ldbFind(){ LDB.q=String((document.getElementById('ldbQ')||{}).value||'').trim().slice(0,20); LDB.tier=String((document.getElementById('ldbTier')||{}).value||'all'); LDB.decks=null; render();
    const q=new URLSearchParams({n:'80'}); if(LDB.q)q.set('q',LDB.q); if(LDB.tier!=='all')q.set('tier',LDB.tier); ldaApi('/api/v1/admin/decks?'+q).then(({r,j})=>{ LDB.decks=r.ok?j:{decks:[],total:0,returned:0}; }).catch(()=>{ LDB.decks={decks:[],total:0,returned:0}; }).finally(()=>render()); },
  ldbBt(v){ LDB.bt=+v; render(); },
  ldbLg(v){ LDB.lgSt='loading'; LDB.lg=null; render(); ldaApi('/api/v1/admin/league?id='+encodeURIComponent(v)).then(({r,j})=>{ LDB.lg=r.ok?j:null; LDB.lgSt=r.ok?'ok':'err'; }).catch(()=>{ LDB.lgSt='err'; }).finally(()=>{ render(); try{ const el=document.querySelector('[data-ldb-lg]'); if(el&&el.scrollIntoView)el.scrollIntoView({block:'nearest'}); }catch(e){} }); },
  ldbLive(v){ LDB.lgSt='loading'; LDB.lg=null; render(); ldaApi('/api/v1/admin/league?live='+encodeURIComponent(v)).then(({r,j})=>{ LDB.lg=r.ok?j:null; LDB.lgSt=r.ok?'ok':'err'; }).catch(()=>{ LDB.lgSt='err'; }).finally(()=>render()); },
  ldbLgClose(){ LDB.lg=null; LDB.lgSt=''; render(); },
  /* 덱 목록·이상 감지의 숨기기·삭제(지금 기능과 같은 서버 요청) */
  async ldaDkHide(v,el){ const hide=el&&el.dataset.u!=='1'; const {r,j}=await ldaApi('/api/v1/admin/hide',{method:'PUT',body:JSON.stringify({pid:v,hide})}).catch(()=>({r:{ok:false},j:{}}));
    if(!r.ok){ LDA.msg=j.message||'바꾸지 못했습니다.'; LDA.bad=true; return render(); } LDA.msg=(hide?'숨겼습니다. 순위표·소식·상대 목록에서 빠집니다. ':'다시 보이게 했습니다. ')+ldaCacheNote(j); LDA.bad=false; await ldaLoad(true,true); },
  async ldaDkDel(v){ if(!confirm('이 플레이어의 래더 덱을 지웁니다(기록은 남습니다).'))return; const {r,j}=await ldaApi('/api/v1/admin/deck/'+encodeURIComponent(v),{method:'DELETE'}).catch(()=>({r:{ok:false},j:{}}));
    if(!r.ok){ LDA.msg=j.message||'지우지 못했습니다.'; LDA.bad=true; return render(); } LDA.msg='덱을 지웠습니다. '+ldaCacheNote(j); LDA.bad=false; await ldaLoad(true,true); },
});
/* 30초마다 새로고침: 래더 현황이 열려 있고, 화면이 보이고, 검색 칸에 입력 중이 아닐 때만 */
const LDA_REFRESH_MS=30e3;
try{ setInterval(()=>{ try{ if(typeof ADM==='undefined'||ADM.tab!=='ld'||LDA.st!=='d1'||!document.querySelector('.ldax')||document.visibilityState==='hidden')return; const f=document.activeElement; if(f&&f.closest&&f.closest('.ldax')&&/INPUT|SELECT|TEXTAREA/.test(f.tagName))return; if(Date.now()-LDA.at>=LDA_REFRESH_MS-1e3)ldaLoad(true,true); }catch(e){} },5e3); }catch(e){}
