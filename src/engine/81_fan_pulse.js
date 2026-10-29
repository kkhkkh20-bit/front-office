/* ===== 팬 게시판·기사 반응을 소식함으로 =====
 홍보팀이 팬 게시판과 기사 반응을 모아 소식함으로 보낸다. 여론을 읽는 창구다.
 - 화제 글: 우리 구단 이야기로 게시판이 달아오르면(트레이드·연승·연패·감독 교체·대승·대패 등) 닷새에 한 번까지 바로 알린다.
 - 주간 여론: 시즌 중 매주 월요일, 비시즌에는 2주마다 팬 여론 변화, 인기 글, 우리 구단 기사와 댓글을 정리한다.
 게시판 글과 댓글은 화면 쪽(12_fanboard.js)에서 경기·기사·소식으로 만들어진다. 노드 시뮬레이션에는 없으므로 없으면 건너뛴다. */
function fpState(){ prInit(); if(!G.fpul)G.fpul={last:-99,wk:-99,seen:{},fan:Math.round(G.pr.fan),press:Math.round(G.pr.press)}; return G.fpul; }
function fpCm(c){ return `${c.best?'[베스트] ':''}${c.tid!=null&&c.tid!==G.user?`(${team(c.tid).nick} 팬) `:''}${c.nick}: ${c.t} (추천 ${c.like})`; }
function fpMood(cms){ const n=cms.length||1; const pos=cms.filter(c=>c.cat==='pos').length/n, neg=cms.filter(c=>c.cat==='neg').length/n; return pos>=.55?'호의적':neg>=.55?'싸늘함':pos>neg+.15?'대체로 좋음':neg>pos+.15?'불만이 많음':'엇갈림'; }
function fpDelta(S){ const f=Math.round(G.pr.fan), p=Math.round(G.pr.press); const df=f-S.fan, dp=p-S.press; return {f,p,t:`팬 여론 ${f}${df?` (${df>0?'+':''}${df})`:''} · 언론 논조 ${p}${dp?` (${dp>0?'+':''}${dp})`:''}`}; }
function fanPulseDaily(){ if(G.unemp||typeof fanThreads!=='function')return; const S=fpState(); const o=dobj(G.day); const per=period();
  let T=[]; try{ T=fanThreads(); }catch(e){ return; }
  const ours=T.filter(t=>t.tid===G.user&&t.d>=G.day-2&&t.d<=G.day);
  /* 1) 화제 글 */
  S.kd=S.kd||{}; const kk=t=>(String(t.id).match(/^[a-z]+/)||['x'])[0]; /* 같은 종류(경기·연승연패·순위…)는 일주일에 한 번까지 */
  const hot=ours.filter(t=>t.hot&&!S.seen[t.id]&&t.cat!=='기사'&&!(G.day-(S.kd[kk(t)]??-99)<7)).sort((a,b)=>b.views-a.views)[0];
  if(hot&&G.day-S.last>=5){ S.seen[hot.id]=G.day; S.kd[kk(hot)]=G.day; S.last=G.day; const D=fpDelta(S); S.fan=D.f; S.press=D.p;
    const cms=hot.cm.slice(0,4);
    const mm=mail('홍보팀',`[팬 게시판] ${hot.title}`,`팬 게시판에 우리 구단 글이 달아오르고 있습니다. 조회 ${hot.views.toLocaleString()} · 댓글 ${hot.cm.length}.${hot.body?`\n\n${hot.body}`:''}\n\n댓글 분위기: ${fpMood(hot.cm)}\n${cms.map(fpCm).join('\n')}\n\n${D.t}`,{kind:'언론',acts:[{l:'게시판에서 보기',a:'fbOpen',v:hot.id},{l:'여론 현황',a:'go',v:'club:media'}]}); if(mm)mm.fth=hot.id;
    fpPrune(S); return; }
  /* 2) 주간 여론 정리 */
  const wk=Math.floor(G.day/7); const due=(per==='season'||per==='post')?(o.w===1&&wk!==S.wk):(G.day-S.last>=14&&wk!==S.wk&&o.w===1);
  if(!due||G.day-S.last<2)return;
  const since=Math.max(S.last,G.day-7); const fresh=T.filter(t=>t.tid===G.user&&t.d>since&&t.cat!=='기사').sort((a,b)=>b.views-a.views).slice(0,3);
  const ns=(G.news||[]).filter(n=>n.d>since).sort((a,b)=>Math.abs(b.v||0)-Math.abs(a.v||0)).slice(0,2);
  if(!fresh.length&&!ns.length)return; S.wk=wk; S.last=G.day; for(const t of fresh)S.seen[t.id]=G.day;
  const D=fpDelta(S); S.fan=D.f; S.press=D.p; const allC=fresh.flatMap(t=>t.cm);
  const tl=fresh.map((t,i)=>{ const c=t.cm.find(c=>c.best)||t.cm[0]; return `${i+1}. ${t.title} (조회 ${t.views.toLocaleString()})${c?`\n   └ ${fpCm(c)}`:''}`; }).join('\n');
  const nl=ns.map(n=>{ let c=null; try{ c=(typeof newsComments==='function'?newsComments(n):[])[0]; }catch(e){} return `[${n.o}] ${n.t}${c?`\n   └ ${fpCm(c)}`:''}`; }).join('\n');
  const tone=D.f>=65?'팬들이 구단을 믿고 있습니다.':D.f>=50?'팬들은 지켜보는 중입니다.':D.f>=38?'팬들의 불만이 쌓이고 있습니다.':'팬들이 등을 돌리고 있습니다. 관중과 상품 수입에 영향이 갑니다.';
  mail('홍보팀',`[여론] 이번 주 팬 게시판·기사 반응 · 팬 여론 ${D.f}`,`${D.t}\n${tone}${allC.length?` 게시판 분위기: ${fpMood(allC)}.`:''}${tl?`\n\n인기 글\n${tl}`:''}${nl?`\n\n우리 구단 기사\n${nl}`:''}`,{kind:'언론',acts:[{l:'팬 게시판',a:'go',v:'club:fans'},{l:'기사',a:'go',v:'club:news'}]});
  fpPrune(S); }
function fpPrune(S){ for(const k in S.seen)if(G.day-S.seen[k]>30)delete S.seen[k]; }

/* 기사 소식에 붙일 팬 댓글 두 줄(화면 쪽 댓글 생성기가 있을 때만) */
function fpNewsReact(n){ if(!n||typeof newsComments!=='function')return ''; try{ const C=newsComments(n).slice(0,2); return C.length?`\n\n팬 반응\n${C.map(fpCm).join('\n')}`:''; }catch(e){ return ''; } }
