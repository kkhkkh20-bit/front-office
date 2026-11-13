/* ---------- 팬 게시판: 야구 커뮤니티식 글과 댓글 ----------
   글과 댓글은 저장하지 않는다. 사건(기사·트레이드·감독·경기·순위)과 고정 시드로 매번 같은 내용을 만든다. */
/* 우리 팬 분위기: 여론 지수 50 기준 */
/* 지명 반응: 전체 순번과 언론 순위 차이로 스틸·오버드래프트를 가른다 */
function draftFan(p){ const d=p.draft; if(!d)return {mood:'mix',bank:'drOk',lines:[]}; const n=(d.rd-1)*10+d.no; const r=p.press||n;
  const bank=r<=n-6?'drSteal':r>=n+12&&d.rd<=3?'drReach':'drOk'; const mood=bank==='drSteal'?'pos':bank==='drReach'?'neg':'mix';
  return {bank,mood,n,r,lines:fComments('dr'+p.id,bank,mood,{p:p.name,n,r,pos:posLabel(p)},3,G.user,fanAdj())}; }
const sn=id=>{ const p=G.players[id]; return p?p.name:''; };
/* ---- 글 만들기 ---- */
/* 연승·연패 글 쿨다운(플레이테스트 3: '3연승 실화냐'가 한 시즌에 여러 번): 최근 3주 안에 같은 쪽 3연속이 이미 있었으면 5연속 이상일 때만 다시 올린다 */
function fbStreakCool(me,n,w){ if(n>=5)return false; const gs=(G.games||[]).filter(g=>(g.home===me||g.away===me)&&g.res&&g.day<=G.day&&g.day>G.day-21).sort((a,b)=>a.day-b.day); const prev=gs.slice(0,Math.max(0,gs.length-n)); let run=0,best=0; for(const g of prev){ if((g.res==='승')===w&&g.res!=='무'){ run++; best=Math.max(best,run); } else run=0; } return best>=3; }
function fanThreads(){ const T=[]; const me=G.user; const MN=team(me).nick; const fa=fanAdj();
  const add=(o)=>{ o.views=o.views||Math.floor(200+fRng(o.id+'v')()*(o.hot?9000:2600)); T.push(o); };
  /* 1) 최근 우리 경기 */
  for(const g of (G.games||[]).slice(0,6)){ if(!g.box)continue; const meS=g.home===me?'h':'a', op=g.home===me?g.away:g.home; const won=g.res==='승';
    const bat=g.box[meS].bat.map(b=>({b,p:G.players[b.id]})).filter(x=>x.p); const pit=g.box[meS].pit.map(q=>({q,p:G.players[q.id]})).filter(x=>x.p);
    const star=[...bat].sort((a,c)=>(c.b.h*2+c.b.hr*4+c.b.rbi*1.5)-(a.b.h*2+a.b.hr*4+a.b.rbi*1.5))[0]; const goat=[...bat].sort((a,c)=>(a.b.h*2-a.b.so)-(c.b.h*2-c.b.so))[0];
    const sp=pit[0]; const worstP=[...pit].sort((a,c)=>c.q.er-a.q.er)[0];
    const rr=won?(sp&&sp.q.er<=1?sp.p.name:star?.p.name):(worstP&&worstP.q.er>=3?worstP.p.name:goat?.p.name);
    const vars={p:star?star.p.name:'',q:sp?sp.p.name:'',r:rr||'',O:team(op).nick,T:MN};
    const sc=`${g.home===me?g.hs:g.as}:${g.home===me?g.as:g.hs}`;
    const title=won?fPick(fRng('gt'+g.day),[`${tshort(op)}전 ${sc} 승리 후기`,(vars.p?`오늘 ${vars.p} 보신 분`:'오늘 경기 총평'),`${sc} 승! 오늘 경기 총평`,`이기니까 좋네요 (${sc})`]):fPick(fRng('gt'+g.day),[`${tshort(op)}전 ${sc} 패배... 총평`,(vars.r?`${vars.r} 오늘 왜 그랬냐`:'오늘 경기 총평'),`오늘 경기 보고 화나신 분`,`${sc} 패, 할 말이 없다`]);
    add({id:'g'+g.day,d:g.day,cat:'경기',title,body:`${team(op).city} ${team(op).nick}전 ${sc} ${won?'승리':g.res==='무'?'무승부':'패배'}.${star?` ${star.p.name} ${star.b.ab}타수 ${star.b.h}안타${star.b.hr?` ${star.b.hr}홈런`:''}.`:''}`,tid:me,ref:won?star?.p.id:null,
      cm:fComments('gc'+g.day,(g.kind&&/차전/.test(g.kind))?(won?'psWin':'psLoss'):(()=>{ const c=typeof gameChar==='function'?gameChar(g):null; return c&&['blown','comeback','rout','nobat'].includes(c.k)?c.k:(won?'win':'loss'); })(),won?'pos':(g.kind&&/차전/.test(g.kind))?'mix':'neg',vars,6,me,fa),hot:Math.abs(g.hs-g.as)>=5}); }
  /* 1-2) 포스트시즌 시리즈 결과: 올라갔는지·탈락했는지·업셋인지(정규시즌 연승·연패 글은 정규시즌 중에만) */
  try{ const P=G.ps; if(P&&P.res&&P.resD){ for(const [rd,r] of Object.entries(P.res)){ const d=P.resD[rd]; if(d==null||d<G.cal.open||(r[0]!==me&&r[1]!==me))continue;
      const won=r[0]===me, op=won?r[1]:r[0], R=ROUNDK[rd]||rd; const si=t=>{ const i=(P.seeds||[]).indexOf(t); return i<0?9:i; }; const upset=won&&si(me)>si(op); const champ=won&&rd==='ks';
      const bank=champ?'psChamp':!won?'psOut':upset?'psUpset':'psAdv';
      add({id:'ps'+G.year+rd,d,cat:'경기',title:champ?`한국시리즈 우승!!! ${r[2]}승 ${r[3]}패`:!won?`${R} ${r[3]}승 ${r[2]}패 탈락... 올 시즌 총평`:upset?`${R} 업셋! ${tshort(op)} 잡았다 (${r[2]}승 ${r[3]}패)`:`${R} 통과! (${r[2]}승 ${r[3]}패)`,
        body:`${R}: ${tname(r[0])} ${r[2]}승 ${r[3]}패로 승리.`,tid:me,hot:true,cm:fComments('psc'+G.year+rd,bank,won?'pos':'mix',{R,O:team(op).nick},7,me,fa)}); } } }catch(e){ console.error(e); }
  /* 2) 연승·연패: 정규시즌 중에만(시즌이 끝나면 정규시즌 마지막 흐름 이야기를 계속 올리지 않는다) */
  if(period()==='season')try{ const st=streakOf(me)||''; const m=st.match(/(\d+)\s*(연승|연패)/); if(m&&+m[1]>=3&&!fbStreakCool(me,+m[1],m[2]==='연승')){ const w=m[2]==='연승'; const k=`s${G.day}`; const n=m[1]; const TT=w?[`${n}연승 실화냐`,`${n}연승 달린다`,`요즘 우리 팀 왜 이렇게 잘함? ${n}연승`,`${n}연승 기념 글`,`이 기세 언제까지 가냐 (${n}연승)`]:[`${n}연패... 다들 괜찮으세요`,`${n}연패 중 정신 승리 스레드`,`${n}연패, 뭐가 문제냐`,`오늘도 졌다 (${n}연패)`,`${n}연패 끊을 사람 구함`]; const tt=TT[Math.floor(fRng('stt'+G.year+G.day)()*TT.length)]; add({id:'st'+G.day,d:G.day,cat:'잡담',title:tt,body:'',tid:me,cm:fComments('stc'+G.day,w?'wstreak':'lstreak',w?'pos':'neg',{n:m[1]},6,me,fa),hot:true}); } }catch(e){}
  /* 3) 이번 주 순위(정규시즌 중에만) */
  if(period()==='season')try{ const wk=Math.floor(G.day/7); const order=standingsNow(); const rk=order.findIndex(x=>x.tid===me)+1; const gp=(G.sea.rec[me].w+G.sea.rec[me].l);
    if(gp>=10){ const T2=gmTrend(); const weak=T2&&T2.weak?SLOTS_S[T2.weak.k]:'';
      const bank=rk<=3?'rankTop':rk<=6?'rankMid':'rankLow'; add({id:'rk'+wk,d:wk*7,cat:'잡담',title:rk<=3?`${rk}위... 올해 진짜 다르다`:rk<=6?`현재 ${rk}위, 5강 가능하냐`:`${rk}위 실화냐`,body:'',tid:me,cm:fComments('rkc'+wk,bank,rk<=3?'pos':rk<=6?'mix':'neg',{n:rk,pos:weak},6,me,fa)}); } }catch(e){}
  /* 4) 요즘 잘하는·못하는 우리 선수 */
  try{ const wk0=Math.floor(G.day/7); const HC=G.fanHC=(G.fanHC&&G.fanHC.y===G.year)?G.fanHC:{y:G.year,w:{}};
    if(!HC.w[wk0]){ const L=playersOf(me).filter(p=>!p.isP&&p.l10&&p.l10.length>=6).map(p=>{ const a=p.l10; const ab=sum(a.map(x=>x[0])),h=sum(a.map(x=>x[1])),bb=sum(a.map(x=>x[3])),xb=sum(a.map(x=>x[5]||0)),sf=sum(a.map(x=>x[6]||0)); return {p,ops:ab?(h+bb)/(ab+bb+sf)+(h+xb)/ab:0}; });
      if(L.length){ const hot=[...L].sort((a,b)=>b.ops-a.ops)[0], cold=[...L].sort((a,b)=>a.ops-b.ops)[0]; HC.w[wk0]={h:hot.ops>=.95?[hot.p.id,+hot.ops.toFixed(3)]:null,c:cold.ops<.55&&cold!==hot?[cold.p.id,+cold.ops.toFixed(3)]:null};
        const ks=Object.keys(HC.w).map(Number).sort((x,y)=>y-x); ks.slice(4).forEach(k=>delete HC.w[k]); } }
    for(const [wk_,e] of Object.entries(HC.w)){ const wk=+wk_; const hp=e.h&&G.players[e.h[0]], cp=e.c&&G.players[e.c[0]];
      if(hp)add({id:'hot'+wk+hp.id,d:wk*7+1,cat:'선수',title:fPick(fRng('ht'+wk),[`${hp.name} 요즘 폼 미쳤다`,`${hp.name} 최근 10경기 OPS ${fmt3(e.h[1])}`,`${hp.name} 연봉 협상 걱정된다 (좋은 의미)`]),body:'',tid:me,ref:hp.id,cm:fComments('hc'+wk+hp.id,hp.foreign?'forGood':'hot','pos',{p:hp.name},5,me,fa)});
      if(cp)add({id:'cold'+wk+cp.id,d:wk*7+1,cat:'선수',title:fPick(fRng('ct'+wk),[`${cp.name} 언제 살아나냐`,`${cp.name} 최근 10경기 OPS ${fmt3(e.c[1])}...`,`${cp.name} 2군 보내야 하지 않나`]),body:'',tid:me,ref:cp.id,cm:fComments('cc'+wk+cp.id,cp.foreign?'forBad':'cold','neg',{p:cp.name},5,me,fa)}); } }catch(e){}
  /* 4-2) 우리 드래프트 총평 */
  try{ const mine=Object.values(G.players).filter(p=>p.team===G.user&&p.draft&&p.draft.y===G.year&&p.draft.rd<=3).sort((a,b)=>a.draft.rd-b.draft.rd||a.draft.no-b.draft.no);
    if(mine.length&&G.cal&&G.day>=G.cal.draft){ const sc=sum(mine.map(p=>{ const n=(p.draft.rd-1)*10+p.draft.no, r=p.press||n; return clamp((n-r)/10,-1.5,1.5); }))/mine.length; const mood=sc>.25?'pos':sc<-.25?'neg':'mix';
      add({id:'dr'+G.year,d:G.cal.draft,cat:'잡담',title:`${G.year} 드래프트 우리 픽 총평: ${mine.slice(0,3).map(p=>p.name).join(', ')}`,body:mine.map(p=>`${p.draft.rd}R ${p.draft.no}순위 ${p.name}(${posLabel(p)}, 언론 ${p.press||'-'}위)`).join(' / '),tid:me,ref:mine[0].id,cm:fComments('drs'+G.year,'drSum',mood,{},6,me,fa)}); } }catch(e){}
  /* 5) 우리 트레이드 */
  for(const t of (G.trades||[]).slice(-6)){ const gets=(t.gi||[]).map(sn).filter(Boolean), gives=(t.go||[]).map(sn).filter(Boolean); if(!gets.length&&!gives.length)continue;
    const gr=t.grade||'C'; const good=/[AB]/.test(gr), bad=/[DF]/.test(gr); const p0=G.players[(t.gi||[])[0]]; const pos=p0?(p0.isP?(isSPr(p0)?'선발':'불펜'):POSS[p0.pos]||''):'';
    const vars={p:gets[0]||'',q:gives[0]||'',pos,O:team(t.with).nick};
    add({id:'tr'+t.d+(t.gi||[]).join('.'),d:t.d,cat:'오피셜',title:`${gets.join('·')} ↔ ${gives.join('·')} 트레이드`,body:`${tname(t.with)}와(과) 트레이드. 언론 평점 ${gr}(A 최고~F 최저, 받은 선수와 내준 선수 가치 비교).`,tid:me,ref:t.gi&&t.gi[0],hot:true,
      cm:fComments('tc'+t.d+gets.join(),good?'tradeG':bad?'tradeB':'tradeE',good?'pos':bad?'neg':'mix',vars,8,me,fa).concat(fComments('tr2'+t.d,'rival',bad?'pos':good?'neg':'mix',{...vars,O:team(t.with).nick,p:gives[0]||'',q:gets[0]||''},2,t.with,0))}); }
  /* 6) 다른 구단 트레이드 */
  for(const x of (G.lgTrades||[]).slice(0,5)){ const A=x.ag.map(id=>G.players[id]).filter(Boolean), B=x.bg.map(id=>G.players[id]).filter(Boolean); if(!A.length||!B.length)continue;
    const v=s=>sum(s.map(p=>ovr(p)+(p.age<=25?4:p.age>=33?-4:0))); const dv=v(A)-v(B); const aw=dv>4?'pos':dv<-4?'neg':'mix';
    add({id:'lt'+x.d+x.a+x.b,d:x.d,cat:'트레이드',title:`${tshort(x.a)}-${tshort(x.b)} ${A[0].name}↔${B[0].name} 트레이드 어떻게 봄?`,body:`${tname(x.a)}은(는) ${A.map(p=>p.name).join('·')}을(를) 얻고 ${B.map(p=>p.name).join('·')}을(를) 내줬다.`,tid:null,
      cm:fComments('ltc'+x.d+x.a,'rival',aw,{O:team(x.a).nick,p:A[0].name,q:B[0].name},3,x.a,0).concat(fComments('ltd'+x.d+x.b,'rival',aw==='pos'?'neg':aw==='neg'?'pos':'mix',{O:team(x.b).nick,p:B[0].name,q:A[0].name},3,x.b,0))}); }
  /* 7) 리그 소식: 감독·기록·외국인 */
  for(const w of (G.wire||[]).slice(0,60)){
    if(w.k==='감독'){ const text=String(w.t||''); if(!text)continue; const fire=!!w.x?.fire, article={id:'wire:manager:'+w.d+':'+w.tid+':'+text,d:w.d,k:'감독',t:text,b:text,v:0,tid:w.tid??null,ref:null};
      const ours=w.tid===me; add({id:'mg'+w.d+w.tid+(fire?'f':''),d:w.d,cat:'감독',title:fire?`[속보] ${text}`:`${text} 어떻게 봄?`,body:text,tid:w.tid,hot:ours,cm:newsComments(article)}); }
    else if(w.k==='기록'){ const p=w.ref!=null?G.players[w.ref]:null; const nm=p?p.name:(w.t.split(' ')[0]); add({id:'ft'+w.d+w.t.length,d:w.d,cat:'기록',title:`ㄷㄷ ${w.t}`,body:'',tid:p?p.team:null,ref:p?p.id:null,hot:true,cm:fComments('ftc'+w.d+nm,'feat','pos',{p:nm},5,p?p.team:null,0)}); }
    else if(w.k==='외국인'&&w.tid===me){ add({id:'fo'+w.d+w.t.length,d:w.d,cat:'외국인',title:w.t,body:'',tid:me,cm:fComments('foc'+w.d,'forChg','mix',{},4,me,fa)}); } }
  /* 8) 기사와 본문 옆 반응은 같은 엔진 경로를 사용한다. */
  for(const n of (G.news||[]).slice(0,14)){ if(n.k==='경기')continue; const c=newsContext(n);
    add({id:'n'+(n.id??('legacy:'+newsContextStamp(n))),d:n.d,cat:'기사',title:`[${n.o}] ${n.t}`,body:n.b||'',tid:c.tid,ref:n.ref,nid:n.id,cm:newsComments(n)}); }
  const seen=new Set(); return T.filter(t=>{ if(seen.has(t.id))return false; seen.add(t.id); return true; }).sort((a,b)=>b.d-a.d||(b.hot?1:0)-(a.hot?1:0)).slice(0,40); }
/* 최근 우리 트레이드 반응 두 줄 (트레이드 성사 도장에 붙인다) */
function tradeFanLines(){ const t=(G.trades||[])[G.trades.length-1]; if(!t)return []; const th=fanThreads().find(x=>x.id==='tr'+t.d+(t.gi||[]).join('.')); return th?th.cm.filter(c=>!c.re).slice(0,3):[]; }
function gameFanLines(g){ if(!g)return []; const th=fanThreads().find(x=>x.id==='g'+g.day); return th?th.cm.filter(c=>!c.re).slice(0,2):[]; }
/* ---- 화면 ---- */
const FCAT={경기:'',트레이드:'tr',오피셜:'of',감독:'mg',선수:'pl',기록:'ft',외국인:'fo',잡담:'',기사:'nw'};
function cmtRow(c){ return `<div class="fcm${c.best?' best':''}${c.re?' re':''}"><div class="fcm-h">${c.re?'<i class="fre">└</i>':''}${c.best?'<i class="fbest">베스트</i>':''}${c.tid!=null?badge(c.tid,12):''}<b>${esc(c.nick)}</b><span>${c.ago<60?c.ago+'분 전':Math.floor(c.ago/60)+'시간 전'}</span><em>추천 ${c.like}${c.dis?` · 비추 ${c.dis}`:''}</em></div><p>${lk(c.t)}</p></div>`; }
function fanBoard(){ const L=fanThreads(); const f=UI.fbf||'all'; const cats=['all','경기','트레이드','감독','선수','기사'];
  const pass=t=>f==='all'||(f==='트레이드'?(t.cat==='트레이드'||t.cat==='오피셜'):f==='선수'?(t.cat==='선수'||t.cat==='외국인'||t.cat==='기록'):t.cat===f);
  const R=L.filter(pass); const open=UI.fbo;
  const row=t=>{ const o=open===t.id; const best=t.cm.filter(c=>c.best).length; return `<div class="fth${o?' open':''}"><button class="fth-h" data-a="fbo" data-v="${esc(t.id)}"><span class="fcat ${FCAT[t.cat]||''}">${t.cat}</span><span class="fth-t"><b>${lk(t.title)}</b> <i class="fcn">[${t.cm.length}]</i>${t.hot?'<i class="fhot">인기</i>':''}</span><span class="fth-m">${t.tid!=null?badge(t.tid,12):''}${esc(fNick(fRng(t.id+'w'),t.tid))} · ${dsh(Math.max(0,t.d))} · 조회 ${t.views.toLocaleString()} · 추천 ${Math.floor(t.views/40)}</span></button>
      ${o?`<div class="fth-b">${t.body?`<p class="fbody">${lk(t.body)}</p>`:''}${t.ref!=null&&G.players[t.ref]?`<button class="tc-i" data-a="player" data-v="${t.ref}">${esc(G.players[t.ref].name)} 카드</button>`:''}<div class="fcms">${t.cm.map(cmtRow).join('')}</div></div>`:''}</div>`; };
  return `<section class="card"><div class="row between"><h2 class="sec">팬 게시판</h2><span class="small muted">팬 여론 ${Math.round(G.pr?G.pr.fan:50)} · 글을 누르면 댓글</span></div>
    <div class="chips">${cats.map(k=>`<button data-a="fbf" data-v="${k}" class="${f===k?'on':''}">${k==='all'?'전체':k}</button>`).join('')}</div>
    ${R.length?`<div class="fboard">${R.map(row).join('')}</div>`:'<p class="small muted">아직 글이 없습니다. 경기가 시작되면 팬들이 글을 올립니다.</p>'}
    <p class="small muted">팬 게시판은 경기·트레이드·감독 선임·선수 성적·기사를 보고 팬들이 남기는 반응입니다. 팬 여론이 높을수록 우리 구단에 너그럽습니다.</p></section>`; }
function fanLinesHtml(L,title){ return L.length?`<div class="fanl"><span class="eyebrow">${title||'팬 반응'}</span>${L.map(c=>`<p><b>${esc(c.nick)}</b> ${lk(c.t)} <em>추천 ${c.like}</em></p>`).join('')}</div>`:''; }

