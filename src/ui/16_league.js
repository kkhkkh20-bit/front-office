/* ---------- 리그: 순위 ---------- */
function standView(){
  const {order,live,y}=standOrder(); const top=order[0]; const hasTl=G.teams.some(t=>tlOf(t.id).length);
  const cols=hasTl?'<th>최근10</th><th>연속</th><th>홈</th><th>원정</th><th>득점</th><th>실점</th><th>득실</th>':'';
  const rows=order.map((o,i)=>{ const sp=splitOf(o.tid); const l=l10Of(o.tid); const g=o.w+o.l+(o.t||0);
    return `<tr class="${o.tid===G.user?'me':''}${i===4?' cut':''}"><td class="stk"><button class="lnk tname" data-a="lteamGo" data-v="${o.tid}"><span class="ticker">${i+1}</span>${badge(o.tid,18)}${tname(o.tid)}</button></td><td>${g}</td><td>${o.w}</td><td>${o.l}</td><td>${o.t||0}</td><td class="key">${pctStr(o)}</td><td>${i?gbStr(gbOf(top,o)):'-'}</td>${hasTl?`<td>${l.n?wlStr(l):'-'}</td><td>${strkPill(o.tid)}</td><td>${sp.home}</td><td>${sp.away}</td><td>${sp.rs}</td><td>${sp.ra}</td><td class="${sp.rs-sp.ra>0?'pos':sp.rs-sp.ra<0?'neg':''}">${sp.rs-sp.ra>0?'+':''}${sp.rs-sp.ra}</td>`:''}</tr>`; }).join('');
  const fifth=order[4]; const mi=order.findIndex(o=>o.tid===G.user); const me=order[mi];
  const msg=live&&period()==='season'?(mi<=4?`가을야구권 ${mi+1}위 · 6위와 ${Math.max(0,gbOf(me,order[5])).toFixed(1)}경기 차`:`5위 ${tshort(fifth.tid)}와(과) ${gbOf(fifth,me).toFixed(1)}경기 차`):'';
  // 상대 전적
  const h2h=hasTl?`<div class="tw"><table class="h2h"><thead><tr><th>상대</th>${G.teams.filter(t=>t.id!==G.user).map(t=>`<th>${badge(t.id,16)}</th>`).join('')}</tr></thead><tbody><tr class="me"><td>${tshort(G.user)}</td>${G.teams.filter(t=>t.id!==G.user).map(t=>{ const r=h2hOf(G.user,t.id); return `<td class="${r.w>r.l?'pos':r.w<r.l?'neg':''}">${r.w+r.l+r.t?`${r.w}-${r.l}${r.t?'-'+r.t:''}`:'-'}</td>`; }).join('')}</tr></tbody></table></div>`:'';
  const tt=inTabs('stand',[['tbl','순위표'],...(live&&rankChart(false)?[['chart','순위 변동']]:[]),...(h2h?[['h2h','상대 전적']]:[]),['map','구단 전력'],...(G.ps?[['ps','포스트시즌']]:[])]);
  if(tt.cur==='teams')return tt.bar+teamsView();
  if(tt.cur==='tbl')return tt.bar+`<section class="card"><div class="row between"><h2 class="sec">${live?`${G.year} 정규시즌 순위`:`${y} 최종 순위`}</h2>${msg?`<span class="small">${msg}</span>`:''}</div>
    <div class="tw"><table class="stt"><thead><tr><th class="stk">순위 · 구단</th><th>경기</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>차</th>${cols}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted">점선 위 1~5위가 가을야구(와일드카드·준플레이오프·플레이오프·한국시리즈)에 나갑니다. 구단 이름을 누르면 그 구단 선수단을 봅니다.</p></section>`;
  if(tt.cur==='chart')return tt.bar+`${live&&rankChart(false)?`<section class="card"><div class="row between"><h2 class="sec">순위 변동</h2><span class="small muted">굵은 선이 우리 팀 · 점선 위가 가을야구권</span></div>${rankChart(false)}</section>`:''}`;
  if(tt.cur==='h2h')return tt.bar+`${h2h?`<section class="card"><h2 class="sec">우리 팀 상대 전적</h2>${h2h}</section>`:''}`;
  if(tt.cur==='race')return tt.bar+raceCard();
  if(tt.cur==='map')return tt.bar+powerMap();
  if(tt.cur==='ps')return tt.bar+`${G.ps?`<section class="card"><h2 class="sec">포스트시즌</h2>${psBody()}</section>`:''}`;
  const myC=G.history.filter(h=>h.champ===G.user).length;
  return tt.bar+`<section class="card"><div class="row between"><h2 class="sec">역대 우승</h2><span class="trow">${myC?`${tname(G.user)} 우승 ${myC}회 ${[...Array(Math.min(myC,8))].map(()=>ART.trophy(22)).join('')}`:''}</span></div><div class="list">${[...G.history].reverse().map(h=>`<div class="item champ${h.champ===G.user?' me':''}" style="cursor:default">${ART.trophy(28)}<span class="nm">${h.y} ${badge(h.champ,18)} ${tname(h.champ)}</span><span class="sub">준우승 ${tname(h.runner)}</span></div>`).join('')}</div></section>`;
}
function teamRecCard(){
  const per=period(); const y=per==='season'||per==='post'||(G.sea&&G.sea.y===G.year&&G.cal&&G.day>G.cal.open)?G.year:G.year-1; const T=teamStats(y);
  const cols=[{k:'tm',l:'구단',v:r=>tshort(r.tid),f:r=>`${badge(r.tid,16)} ${tshort(r.tid)}`,cls:'stk'},
    {k:'avg',l:'타율',v:r=>r.avg,f:r=>fmt3(r.avg)},{k:'obp',l:'출루율',v:r=>r.obp,f:r=>fmt3(r.obp)},{k:'slg',l:'장타율',v:r=>r.slg,f:r=>fmt3(r.slg)},{k:'ops',l:'OPS',v:r=>r.ops,f:r=>fmt3(r.ops)},
    {k:'hr',l:'홈런',v:r=>r.hr},{k:'sb',l:'도루',v:r=>r.sb},{k:'rs',l:'득점',v:r=>r.rs},
    {k:'era',l:'ERA',v:r=>r.era,f:r=>r.era.toFixed(2),asc:1},{k:'whip',l:'WHIP',v:r=>r.whip,f:r=>r.whip.toFixed(2),asc:1},{k:'ra',l:'실점',v:r=>r.ra??999,f:r=>r.ra==null?'-':r.ra,asc:1},{k:'so',l:'탈삼진',v:r=>r.so},{k:'hra',l:'피홈런',v:r=>r.hra,asc:1}];
  return `<section class="card"><div class="row between"><h2 class="sec">${y} 팀 기록</h2><span class="small muted">머리글을 누르면 정렬</span></div>${stbl('team',cols,T,{def:{k:'ops',dir:-1},me:r=>r.tid===G.user,rank:true})}
    <p class="small muted">각 칸의 순위 색: 상위 3개 팀은 초록, 하위 3개 팀은 빨강입니다.</p></section>`;
}

/* 정렬되는 표 공용 */
function stbl(id,cols,rows,o){
  UI.ls=UI.ls||{}; const st=UI.ls[id]||o.def; const c=cols.find(x=>x.k===st.k)||cols[0];
  if(!wide()&&o.num&&c.k!=='name'&&c.k!=='tm'){ const i=cols.indexOf(c); const at=cols.findIndex(x=>x.k==='tm')+1; if(i>at){ cols=cols.slice(); cols.splice(i,1); cols.splice(at,0,c); } }
  const sorted=[...rows].sort((a,b)=>{ const va=c.v(a), vb=c.v(b); if(va==null&&vb==null)return 0; if(va==null)return 1; if(vb==null)return -1; const d=typeof va==='string'?va.localeCompare(vb):va-vb; return st.dir*d; }).slice(0,o.limit||999);
  // 열별 상·하위 표시(팀 표 등 소규모일 때)
  const tier={}; if(o.rank){ for(const cc of cols){ if(cc.k==='tm'||cc.k==='name')continue; const s=[...rows].map(r=>cc.v(r)).filter(v=>v!=null).sort((a,b)=>cc.asc?a-b:b-a); tier[cc.k]=s; } }
  const tcls=(cc,r)=>{ const s=tier[cc.k]; if(!s)return ''; const v=cc.v(r); const i=s.indexOf(v); return i<3?' t-hi':i>=s.length-3?' t-lo':''; };
  const th=cc=>`<th data-a="lsort" data-v="${id}:${cc.k}" class="sortable${cc.cls?' '+cc.cls:''}${cc.k===c.k?' on':''}">${cc.l}${cc.k===c.k?(st.dir<0?' ▼':' ▲'):''}</th>`;
  return `<div class="tw"><table class="sqt rt lst"><thead><tr>${o.num?'<th class="n">#</th>':''}${cols.map(th).join('')}</tr></thead><tbody>${sorted.map((r,i)=>`<tr class="${o.click?'click ':''}${o.me&&o.me(r)?'me':''}"${o.click?o.click(r):''}>${o.num?`<td class="n">${i+1}</td>`:''}${cols.map(cc=>`<td class="${cc.cls||''}${cc.k===c.k?' key':''}${tcls(cc,r)}">${cc.f?cc.f(r):cc.v(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

/* ---------- 리그: 기록 ---------- */
function recView(){
  const per=period(); const y=per==='pre'||per==='off'?(per==='off'?G.year:G.year-1):G.year;
  const seg=UI.lrec||'top';
  const head=`<div class="seg">${[['top','부문별 1위'],['bat','타자 기록'],['pit','투수 기록'],['team','팀 기록']].map(([k,l])=>`<button data-a="lrec" data-v="${k}" class="${seg===k?'on':''}">${l}</button>`).join('')}</div>`;
  const rows=playerRows(y);
  if(!rows.length)return head+csec(`${y} 기록`,'<p class="small muted">아직 기록이 없습니다.</p>');
  if(seg==='team')return head+teamRecCard();
  if(seg==='top')return head+leaderTiles(rows,y);
  const pit=seg==='pit'; const f=UI.lrf||{q:true,t:'all'};
  let R=rows.filter(x=>x.p.isP===pit&&(f.t==='all'||(f.t==='me'?x.h.t===G.user||x.p.team===G.user:String(x.h.t)===f.t)));
  if(f.q)R=R.filter(x=>isQual(x,y));
  const nameC={k:'name',l:'선수',v:x=>x.p.name,f:x=>`<span class="pn">${wide()?avImg(x.p):''}<span>${esc(x.p.name)}${x.p.foreign?' <span class="pill">외</span>':''}</span></span>`,cls:'stk'};
  const tmC={k:'tm',l:'팀',v:x=>tshort(x.h.t??x.p.team),f:x=>badge(x.h.t??x.p.team,18)};
  const cols=pit?[nameC,tmC,{k:'role',l:'역할',v:x=>posLabel(x.p)},{k:'g',l:'경기',v:x=>x.h.g||0},{k:'ip',l:'이닝',v:x=>x.h.outs,f:x=>ipStr(x.h.outs)},{k:'era',l:'ERA',v:x=>x.r.era,f:x=>rfmt('era',x.r.era),asc:1},{k:'w',l:'승',v:x=>x.h.w||0},{k:'l',l:'패',v:x=>x.h.l||0},{k:'sv',l:'세',v:x=>x.h.sv||0},{k:'hld',l:'홀',v:x=>x.h.hld||0},{k:'so',l:'탈삼진',v:x=>x.h.so},{k:'bb',l:'볼넷',v:x=>x.h.bb,asc:1},{k:'whip',l:'WHIP',v:x=>x.r.whip,f:x=>x.r.whip.toFixed(2),asc:1},{k:'k9',l:'K/9',v:x=>x.r.k9,f:x=>x.r.k9.toFixed(1)},{k:'bb9',l:'BB/9',v:x=>x.r.bb9,f:x=>x.r.bb9.toFixed(1),asc:1},{k:'war',l:'WAR',v:x=>x.w,f:x=>rfmt('war',x.w)}]
    :[nameC,tmC,{k:'pos',l:'포지션',v:x=>POSS[x.h.pos||x.p.pos]||x.p.pos},{k:'g',l:'경기',v:x=>x.h.g||0},{k:'pa',l:'타석',v:x=>x.h.pa},{k:'avg',l:'타율',v:x=>x.r.avg,f:x=>fmt3(x.r.avg)},{k:'h',l:'안타',v:x=>x.h.h},{k:'hr',l:'홈런',v:x=>x.h.hr},{k:'rbi',l:'타점',v:x=>x.h.rbi},{k:'r',l:'득점',v:x=>x.h.r},{k:'sb',l:'도루',v:x=>x.h.sb},{k:'bb',l:'볼넷',v:x=>x.h.bb},{k:'so',l:'삼진',v:x=>x.h.so,asc:1},{k:'bbk',l:'볼삼비',v:x=>x.h.so?x.h.bb/x.h.so:null,f:x=>x.h.so?(x.h.bb/x.h.so).toFixed(2):'-'},{k:'babip',l:'BABIP',v:x=>babipOf(x.h),f:x=>babipOf(x.h)!=null?fmt3(babipOf(x.h)):'-'},{k:'obp',l:'출루율',v:x=>x.r.obp,f:x=>fmt3(x.r.obp)},{k:'slg',l:'장타율',v:x=>x.r.slg,f:x=>fmt3(x.r.slg)},{k:'ops',l:'OPS',v:x=>x.r.ops,f:x=>rfmt('ops',x.r.ops)},{k:'war',l:'WAR',v:x=>x.w,f:x=>rfmt('war',x.w)}];
  const tsel=`<select data-a="lrfT" aria-label="구단">${[['all','전체 구단'],['me','우리 구단']].concat(G.teams.filter(t=>t.id!==G.user).map(t=>[String(t.id),t.city+' '+t.nick])).map(([v,l])=>`<option value="${v}" ${f.t===v?'selected':''}>${l}</option>`).join('')}</select>`;
  const g=qualOf(G.user);
  return head+`<section class="card"><div class="row between"><h2 class="sec">${y} ${pit?'투수':'타자'} 기록</h2><span class="small muted">${R.length}명</span></div>
    <div class="row">${tsel}<label class="chk"><input type="checkbox" data-a="lrfQ" ${f.q?'checked':''}> 규정${pit?'이닝':'타석'} 이상${y===G.year&&period()==='season'?` (${pit?Math.round(g):Math.round(g*3.1)}${pit?'이닝':'타석'})`:''}</label></div>
    ${stbl(pit?'pit':'bat',cols,R,{def:pit?{k:'era',dir:1}:{k:'ops',dir:-1},num:true,limit:UI.lrAll?120:25,me:x=>x.p.team===G.user,click:x=>` data-a="player" data-v="${x.p.id}"`})}
    ${R.length>25?`<button class="btn small" data-a="lrAll">${UI.lrAll?'25명만 보기':`전체 ${Math.min(120,R.length)}명 보기`}</button>`:''}
    <p class="small muted">머리글을 누르면 그 기록 순으로 정렬합니다. 우리 선수는 강조 표시됩니다. 규정 기준은 팀 경기 수 × 3.1타석, × 1이닝입니다.</p></section>`;
}
function leaderTiles(rows,y){
  const B=rows.filter(x=>!x.p.isP), P=rows.filter(x=>x.p.isP); const q=x=>isQual(x,y);
  const T=[['타율',B.filter(q),x=>x.r.avg,x=>fmt3(x.r.avg)],['홈런',B,x=>x.h.hr],['타점',B,x=>x.h.rbi],['안타',B,x=>x.h.h],['도루',B,x=>x.h.sb],['OPS',B.filter(q),x=>x.r.ops,x=>fmt3(x.r.ops)],['타자 WAR',B,x=>x.w,x=>x.w.toFixed(1)],
    ['평균자책점',P.filter(q),x=>-x.r.era,x=>x.r.era.toFixed(2)],['승리',P,x=>x.h.w||0],['탈삼진',P,x=>x.h.so],['세이브',P,x=>x.h.sv||0],['홀드',P,x=>x.h.hld||0],['WHIP',P.filter(q),x=>-x.r.whip,x=>x.r.whip.toFixed(2)],['투수 WAR',P,x=>x.w,x=>x.w.toFixed(1)]];
  const tile=([l,arr,v,f])=>{ const s=[...arr].sort((a,b)=>v(b)-v(a)).slice(0,5); if(!s.length)return ''; const fm=f||v; const a=s[0];
    return `<div class="ltile"><div class="lh">${l}</div><button class="l1${a.p.team===G.user?' me':''}" data-a="player" data-v="${a.p.id}">${avImg(a.p,true)}<span><b>${esc(a.p.name)}</b><i>${badge(a.p.team,14)} ${tshort(a.p.team)}</i></span><em class="num">${fm(a)}</em></button>
      <ol>${s.slice(1).map((x,i)=>`<li class="${x.p.team===G.user?'me':''}"><button data-a="player" data-v="${x.p.id}"><i>${i+2}</i>${esc(x.p.name)} <span class="muted">${tshort(x.p.team)}</span><b class="num">${fm(x)}</b></button></li>`).join('')}</ol></div>`; };
  return `<section class="card"><div class="row between"><h2 class="sec">${y} 부문별 순위</h2><span class="small muted">타율·OPS·평균자책점·WHIP는 규정 기준 이상</span></div><div class="ltiles">${T.map(tile).join('')}</div></section>`;
}

/* ---------- 리그: 경기 결과(스코어보드) ---------- */
function scoreHub(){ const t=inTabs('sres',[['mine','우리 경기'],['day','날짜별 결과'],['cal','월별 일정']],G.games.length?'mine':'cal'); /* 개막 전에는 일정부터 */ return t.bar+(t.cur==='mine'?gamesView():t.cur==='day'?scoreView():schedView()); }
function scoreView(){
  const days=[...new Set(G.teams.flatMap(t=>tlOf(t.id).map(x=>x[5])))].sort((a,b)=>a-b);
  if(!days.length)return csec('날짜별 결과','<p class="small muted">아직 치른 경기가 없습니다.</p>');
  let d=UI.sbd; if(d==null||!days.includes(d))d=days[days.length-1];
  const i=days.indexOf(d); const gs=[]; for(const t of G.teams) for(const x of tlOf(t.id)) if(x[5]===d&&x[3]===1)gs.push({h:t.id,a:x[4],hs:x[1],as:x[2]});
  const card=s=>{ const gi=G.games.findIndex(g=>g.day===d&&g.home===s.h&&g.away===s.a); const me=s.h===G.user||s.a===G.user;
    const tr=(tid,r,o)=>`<div class="sbr ${r>o?'w':''}">${badge(tid,22)}<a class="tl" data-a="lteam" data-v="${tid}">${tshort(tid)}</a><span class="small muted">${wlStr(G.sea.rec[tid])}</span><b class="num">${r}</b></div>`;
    return `<div class="sbc${me?' me':''}"${gi>=0?` data-a="openGame" data-v="${gi}" role="button" tabindex="0"`:''}>${tr(s.a,s.as,s.hs)}${tr(s.h,s.hs,s.as)}<span class="small muted">${gi>=0?'박스스코어 보기':'종료'}</span></div>`; };
  return `<section class="card"><div class="row between"><h2 class="sec">경기 결과</h2><div class="row"><button class="btn small" data-a="sbd" data-v="${days[i-1]??''}" ${i<=0?'disabled':''}>← 이전</button><b class="num">${dmd(d)} ${WD[dobj(d).w]}</b><button class="btn small" data-a="sbd" data-v="${days[i+1]??''}" ${i>=days.length-1?'disabled':''}>다음 →</button></div></div>
    <div class="sbg">${gs.map(card).join('')}</div>
    <p class="small muted">우리 경기는 박스스코어를 볼 수 있습니다(최근 25경기 보관). 다른 구장은 최종 점수만 기록합니다.</p></section>`;
}

/* ---------- 리그: 뉴스 ---------- */
function newsView(){
  G.newsSeen=Math.max(newsSeen(),...(G.news||[]).map(n=>n.id||0));
  const seg=UI.nseg||'news';
  const head=`<div class="seg">${[['news','기사'],['fans','팬 게시판'],['wire','리그 소식']].map(([k,l])=>`<button data-a="nseg" data-v="${k}" class="${seg===k?'on':''}">${l}</button>`).join('')}</div>`;
  if(seg==='fans')return head+fanBoard();
  if(seg==='wire'){ const W=G.wire||[];
    return head+csec('리그 소식',W.length?(()=>{ const P=pager('wire',W.slice(0,120),20); return `<div class="list">${P.items.map(w=>`<div class="item wa" ${w.ref!=null&&G.players[w.ref]?`data-a="player" data-v="${w.ref}"`:'style="cursor:default"'}>${w.tid!=null?badge(w.tid,24):'<span class="av ini">KBO</span>'}<span class="nm">${lk(w.t)}</span><span class="sub"><span class="pill">${esc(w.k)}</span> ${dsh(w.d)}</span></div>`).join('')}</div>${P.bar}`; })():'<p class="small muted">다른 구단의 외국인 교체, 감독 선임, FA 이적 소식이 여기에 쌓입니다.</p>'); }
  const kinds=[...new Set((G.news||[]).map(n=>n.k).filter(Boolean))]; const ns=(G.news||[]).filter(n=>!UI.nk||n.k===UI.nk);
  const kc=`<div class="chips"><button data-a="nk" data-v="" class="${!UI.nk?'on':''}">전체</button>${kinds.map(k=>`<button data-a="nk" data-v="${esc(k)}" class="${UI.nk===k?'on':''}">${esc(k)}</button>`).join('')}</div>`;
  return head+csec('기사',kc+(ns.length?(()=>{ const P=pager('news'+(UI.nk||''),ns.slice(0,120),12); return `<div class="newslist">${P.items.map(n=>newsItem(n,true)).join('')}</div>${P.bar}`; })():'<p class="small muted">기사가 없습니다.</p>'),`<button class="btn small" data-a="go" data-v="club:media">여론 현황</button>`);
}

