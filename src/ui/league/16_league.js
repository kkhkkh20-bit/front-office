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
  const tt=inTabs('stand',[['tbl','순위표'],...(live&&rankChart(false)?[['chart','순위 변동']]:[]),...(h2h?[['h2h','상대 전적']]:[]),['map','구단 전력'],['ps','포스트시즌']]);
  if(tt.cur==='teams')return tt.bar+teamsView();
  if(tt.cur==='tbl'&&fmOn())return tt.bar+standFm(order,live,y);
  if(tt.cur==='tbl')return tt.bar+`<section class="card"><div class="row between"><h2 class="sec">${live?`${G.year} 정규시즌 순위`:`${y} 최종 순위`}</h2>${msg?`<span class="small">${msg}</span>`:''}</div>
    <div class="tw"><table class="stt"><thead><tr><th class="stk">순위 · 구단</th><th>경기</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>차</th>${cols}</tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted">점선 위 1~5위가 가을야구(와일드카드·준플레이오프·플레이오프·한국시리즈)에 나갑니다. 구단 이름을 누르면 그 구단 선수단을 봅니다.</p></section>`;
  if(tt.cur==='chart')return tt.bar+`${live&&rankChart(false)?`<section class="card"><div class="row between"><h2 class="sec">순위 변동</h2><span class="small muted">굵은 선이 우리 팀 · 점선 위가 가을야구권</span></div>${rankChart(false)}</section>`:''}`;
  if(tt.cur==='h2h')return tt.bar+`${h2h?`<section class="card"><h2 class="sec">우리 팀 상대 전적</h2>${h2h}</section>`:''}`;
  if(tt.cur==='race')return tt.bar+raceCard();
  if(tt.cur==='map')return tt.bar+powerMap();
  if(tt.cur==='ps')return tt.bar+psBracket();
  const myC=G.history.filter(h=>h.champ===G.user).length;
  return tt.bar+`<section class="card"><div class="row between"><h2 class="sec">역대 우승</h2><span class="trow">${myC?`${tname(G.user)} 우승 ${myC}회 ${[...Array(Math.min(myC,8))].map(()=>trophyImg(22)).join('')}`:''}</span></div><div class="list">${[...G.history].reverse().map(h=>`<div class="item champ${h.champ===G.user?' me':''}" style="cursor:default">${ART.trophy(28)}<span class="nm">${h.y} ${badge(h.champ,18)} ${tname(h.champ)}</span><span class="sub">준우승 ${tname(h.runner)}</span></div>`).join('')}</div></section>`;
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
  if(seg==='top')return head+(fmOn()?recFm(rows,y):leaderTiles(rows,y));
  const pit=seg==='pit'; const f=UI.lrf||{q:true,t:'all'};
  let R=rows.filter(x=>x.p.isP===pit&&(f.t==='all'||(f.t==='me'?x.h.t===G.user||x.p.team===G.user:String(x.h.t)===f.t)));
  /* 규정 기준은 비율 기록(타율·OPS·ERA 등) 순위에만 건다. 홈런·타점 같은 누적 기록은 타석 수와 관계없이 모두 보여 준다 */
  const RATE=pit?['era','whip','k9','bb9']:['avg','bbk','babip','obp','slg','ops','wrc']; const sk=((UI.ls||{})[pit?'pit':'bat']||{k:pit?'era':'ops'}).k; const rateSort=RATE.includes(sk);
  if(f.q&&rateSort)R=R.filter(x=>isQual(x,y));
  const nameC={k:'name',l:'선수',v:x=>x.p.name,f:x=>`<span class="pn">${wide()?avImg(x.p):''}<span>${esc(x.p.name)}${x.p.foreign?' <span class="pill">외</span>':''}</span></span>`,cls:'stk'};
  const tmC={k:'tm',l:'팀',v:x=>tshort(x.h.t??x.p.team),f:x=>badge(x.h.t??x.p.team,18)};
  const cols=pit?[nameC,tmC,{k:'role',l:'역할',v:x=>posLabel(x.p)},{k:'g',l:'경기',v:x=>x.h.g||0},{k:'ip',l:'이닝',v:x=>x.h.outs,f:x=>ipStr(x.h.outs)},{k:'era',l:'ERA',v:x=>x.r.era,f:x=>rfmt('era',x.r.era),asc:1},{k:'w',l:'승',v:x=>x.h.w||0},{k:'l',l:'패',v:x=>x.h.l||0},{k:'sv',l:'세',v:x=>x.h.sv||0},{k:'hld',l:'홀',v:x=>x.h.hld||0},{k:'so',l:'탈삼진',v:x=>x.h.so},{k:'bb',l:'볼넷',v:x=>x.h.bb,asc:1},{k:'whip',l:'WHIP',v:x=>x.r.whip,f:x=>x.r.whip.toFixed(2),asc:1},{k:'k9',l:'K/9',v:x=>x.r.k9,f:x=>x.r.k9.toFixed(1)},{k:'bb9',l:'BB/9',v:x=>x.r.bb9,f:x=>x.r.bb9.toFixed(1),asc:1},{k:'war',l:'WAR',v:x=>x.w,f:x=>rfmt('war',x.w)}]
    :[nameC,tmC,{k:'pos',l:'포지션',v:x=>POSS[x.h.pos||x.p.pos]||x.p.pos},{k:'g',l:'경기',v:x=>x.h.g||0},{k:'pa',l:'타석',v:x=>x.h.pa},{k:'avg',l:'타율',v:x=>x.r.avg,f:x=>fmt3(x.r.avg)},{k:'h',l:'안타',v:x=>x.h.h},{k:'hr',l:'홈런',v:x=>x.h.hr},{k:'rbi',l:'타점',v:x=>x.h.rbi},{k:'r',l:'득점',v:x=>x.h.r},{k:'sb',l:'도루',v:x=>x.h.sb},{k:'bb',l:'볼넷',v:x=>x.h.bb},{k:'so',l:'삼진',v:x=>x.h.so,asc:1},{k:'bbk',l:'볼삼비',v:x=>x.h.so?x.h.bb/x.h.so:null,f:x=>x.h.so?(x.h.bb/x.h.so).toFixed(2):'-'},{k:'babip',l:'BABIP',v:x=>babipOf(x.h),f:x=>babipOf(x.h)!=null?fmt3(babipOf(x.h)):'-'},{k:'obp',l:'출루율',v:x=>x.r.obp,f:x=>fmt3(x.r.obp)},{k:'slg',l:'장타율',v:x=>x.r.slg,f:x=>fmt3(x.r.slg)},{k:'ops',l:'OPS',v:x=>x.r.ops,f:x=>rfmt('ops',x.r.ops)},{k:'wrc',l:'wRC+',v:x=>wrcPlus(x.h,y),f:x=>rfmt('wrc',wrcPlus(x.h,y))},{k:'war',l:'WAR',v:x=>x.w,f:x=>rfmt('war',x.w)}];
  const tsel=optRow('lrfT',f.t,[['all','전체'],['me','우리 구단']].concat(G.teams.filter(t=>t.id!==G.user).map(t=>[String(t.id),esc(team(t.id).nick)])),null,'wsx');
  const g=qualOf(G.user);
  return head+`<section class="card"><div class="row between"><h2 class="sec">${y} ${pit?'투수':'타자'} 기록</h2><span class="small muted">${R.length}명</span></div>
    <div class="row">${tsel}<label class="chk"><input type="checkbox" data-a="lrfQ" ${f.q?'checked':''}> 비율 기록은 규정${pit?'이닝':'타석'} 이상${y===G.year&&period()==='season'?` (${pit?Math.round(g):Math.round(g*3.1)}${pit?'이닝':'타석'})`:''}</label></div>
    ${stbl(pit?'pit':'bat',cols,R,{def:pit?{k:'era',dir:1}:{k:'ops',dir:-1},num:true,limit:UI.lrAll?120:25,me:x=>x.p.team===G.user,click:x=>` data-a="player" data-v="${x.p.id}"`})}
    ${R.length>25?`<button class="btn small" data-a="lrAll">${UI.lrAll?'25명만 보기':`전체 ${Math.min(120,R.length)}명 보기`}</button>`:''}
    <p class="small muted">머리글을 누르면 그 기록 순으로 정렬합니다. 우리 선수는 강조 표시됩니다.${pit?'':' wRC+는 리그 평균을 100으로 한 득점 창출력입니다(구장 보정 없음).'} 규정 기준(팀 경기 수 × 3.1타석, × 1이닝)은 ${pit?'ERA·WHIP·K/9·BB/9':'타율·출루율·장타율·OPS·wRC+·BABIP·볼삼비'} 같은 비율 기록 순위에만 적용되고, ${pit?'승·세이브·탈삼진':'홈런·타점·안타'} 같은 누적 기록 순위에는 모든 선수가 나옵니다.</p></section>`;
}
function leaderTiles(rows,y){
  const T=leaderCats(rows,y);
  const tile=([l,arr,v,f])=>{ const s=[...arr].sort((a,b)=>v(b)-v(a)).slice(0,5); if(!s.length)return ''; const fm=f||v; const a=s[0];
    return `<div class="ltile"><div class="lh">${l}</div><button class="l1${a.p.team===G.user?' me':''}" data-a="player" data-v="${a.p.id}">${avImg(a.p,true)}<span><b>${esc(a.p.name)}</b><i>${badge(a.p.team,14)} ${tshort(a.p.team)}</i></span><em class="num">${fm(a)}</em></button>
      <ol>${s.slice(1).map((x,i)=>`<li class="${x.p.team===G.user?'me':''}"><button data-a="player" data-v="${x.p.id}"><i>${i+2}</i>${esc(x.p.name)} <span class="muted">${tshort(x.p.team)}</span><b class="num">${fm(x)}</b></button></li>`).join('')}</ol></div>`; };
  return `<section class="card"><div class="row between"><h2 class="sec">${y} 부문별 순위</h2><span class="small muted">타율·OPS·wRC+·평균자책점·WHIP는 규정 기준 이상</span></div><div class="ltiles">${T.map(tile).join('')}</div></section>`;
}
/* 부문별 순위 항목: [이름, 대상, 정렬값, 표시] (부문별 1위 타일·PC 대회 화면 공용) */
function leaderCats(rows,y){
  const B=rows.filter(x=>!x.p.isP), P=rows.filter(x=>x.p.isP); const q=x=>isQual(x,y);
  return [['타율',B.filter(q),x=>x.r.avg,x=>fmt3(x.r.avg)],['홈런',B,x=>x.h.hr],['타점',B,x=>x.h.rbi],['안타',B,x=>x.h.h],['도루',B,x=>x.h.sb],['OPS',B.filter(q),x=>x.r.ops,x=>fmt3(x.r.ops)],['wRC+',B.filter(q),x=>wrcPlus(x.h,y)??0],['타자 WAR',B,x=>x.w,x=>x.w.toFixed(1)],
    ['평균자책점',P.filter(q),x=>-x.r.era,x=>x.r.era.toFixed(2)],['승리',P,x=>x.h.w||0],['탈삼진',P,x=>x.h.so],['세이브',P,x=>x.h.sv||0],['홀드',P,x=>x.h.hld||0],['WHIP',P.filter(q),x=>-x.r.whip,x=>x.r.whip.toFixed(2)],['투수 WAR',P,x=>x.w,x=>x.w.toFixed(1)]];
}

/* ---------- PC(FM '대회' 화면 배치): 대회별 세로 칸 ----------
   정규시즌·포스트시즌·경기 일정·부문별 1위. 칸마다 머리·내용(안에서만 스크롤)·아래 이동 버튼. 휴대폰은 위 순위표 그대로 */
const fxBox=(cls,head,body,foot)=>`<section class="fbox ${cls}">${head?`<header class="fx-h">${head}</header>`:''}<div class="fx-b">${body}</div>${foot?`<footer class="fx-f">${foot}</footer>`:''}</section>`;
const fxBtn=(a,v,l)=>`<button class="btn small" data-a="${a}" data-v="${v}">${l} ›</button>`;
const fxHead=(t,s,ic)=>`${ic||''}<div><b>${t}</b>${s?`<span>${s}</span>`:''}</div>`;
const fxFact=(l,v)=>`<div class="fx-fact"><span>${l}</span><b>${v}</b></div>`;
/* 운영진 기대(구단주 목표)와 성과 막대: 한 줄 가로 막대(순위가 높을수록 길게), 막대 위 눈금은 쓰지 않는다 */
const fxExp=(goal,bar,mark,ok,txt)=>`<div class="fx-exp"><div><span>운영진 기대</span><b>${goal}</b></div><div><span>성과${txt?' · '+txt:''}</span><p class="fx-bar">${bar!=null?`<i class="${ok==null?'':ok?'good':'bad'}" style="width:${clamp(bar,2,100)}%"></i>`:''}</p></div></div>`;
/* 우리 순위 추이: 점이 찍힌 선 그래프(재정 화면 fmArea). 위가 1위, 점은 최대 10개 */
function fxRankLine(){ const R=(G.sea&&G.sea.rh)||[], n=G.teams.length; if(R.length<2)return ''; const st=Math.max(1,Math.ceil((R.length-1)/9));
  return fmArea(R.filter((s,i)=>i%st===0||i===R.length-1).map(s=>({v:n+1-s[1][G.user],l:dsh(s[0])})),'var(--team-hi)',v=>Math.round(n+1-v)+'위',null,null,{lo:1,hi:n}); }
/* 최근 경기 막대: 승 초록·패 빨강·무 회색(오래된 경기부터) */
const fxForm=L=>`<span class="fx-form">${L.map(x=>`<i class="${x[0]>0?'w':x[0]<0?'l':'t'}" title="${x[1]}:${x[2]}"></i>`).join('')}</span>`;
const fxTop=(arr,f)=>arr.length?arr.reduce((a,b)=>f(b)>f(a)?b:a):null;
const fxStar=(l,x,v)=>x?`<button class="fx-pl" data-a="player" data-v="${x.p.id}">${avImg(x.p)}<span><i>${l}</i><b>${esc(x.p.name)}</b><em>${v(x)}</em></span></button>`:`<div class="fx-pl"><span><i>${l}</i><b class="muted">기록 없음</b></span></div>`;
/* 가을야구 대진: 정규시즌 1~5위 계단식(4위는 와일드카드 1승 안고 시작). 끝나기 전에는 지금 순위로 */
function psLadder(order){ const P=G.ps, S=P&&P.seeds&&P.seeds.length?P.seeds:(order||[]).slice(0,5).map(o=>o.tid), R=(P&&P.res)||{}, cur=P&&!P.done?P.cur:null, win=k=>R[k]?R[k][0]:null;
  const tm=(t,alt)=>t!=null&&(order||P)?`<span class="psl-t${t===G.user?' me':''}">${badge(t,20)}<b>${esc(team(t).nick)}</b><i>${S.indexOf(t)+1}위</i></span>`:`<span class="psl-t tbd"><b>${alt}</b></span>`;
  return [['ks',S[0],win('po'),'플레이오프 승자','7전 4선승'],['po',S[1],win('spo'),'준플레이오프 승자','5전 3선승'],['spo',S[2],win('wc'),'와일드카드 승자','5전 3선승'],['wc',S[3],S[4],'정규시즌 5위','4위 1승 안고 시작 · 최대 2경기']].map(([k,a,b,alt,f],j)=>{
    const r=R[k], c=cur&&cur.round===k?cur:null, x=r?[r[0],r[1],`${r[2]}-${r[3]}`]:c?[c.hi,c.lo,`${c.wh}-${c.wl}`]:[a,b,'vs'];
    return `<div class="psl${r?' done':c?' live':''}"><div class="psl-h"><b>${ROUNDK[k]}</b><span>${r?'종료':c?'진행 중':f}</span></div><div class="psl-m">${tm(x[0],`정규시즌 ${j+1}위`)}<em>${x[2]}</em>${tm(x[1],alt)}</div></div>`; }).join(''); }
/* ---------- 포스트시즌 대진표(리그 → 순위 → 포스트시즌) ----------
   KBO 포스터식 계단: 아래에 5위·4위·3위·2위·1위 구단(왼쪽→오른쪽), 위로 와일드카드 → 준플레이오프 → 플레이오프 → 한국시리즈 칸이 점점 높아진다.
   진행 중인 해는 G.ps, 지난 시즌은 G.history[].ps(저장된 해만), 포스트시즌 전에는 지금 순위로 예상 대진 */
const BK_R=[['wc',3,4,'2선승제 · 4위 1승 안고 시작'],['spo',2,'wc','3선승제(5전)'],['po',1,'spo','3선승제(5전)'],['ks',0,'po','4선승제(7전)']];
const BK_S={wc:'와일드카드',spo:'준플레이오프',po:'플레이오프'};
/* PC 배치(%): 열 왼쪽, 칸 위치·크기. CSS(.bk-wc 등)와 같은 값이어야 선이 맞는다 */
const BK_X=[1,20.8,40.6,60.4,80.2], BK_Y=[51,35,19,3], BK_W=16, BK_H=20, BK_SY=86;
function psYearOf(P){ const d=Object.values(P.resD||{})[0]; return d!=null?dobj(d).y:(P.cur&&P.cur.days?dobj(P.cur.days[0]).y:G.year); }
function bkYears(){ const S=new Set(G.history.filter(h=>h.ps&&h.ps.ks).map(h=>h.y)); if(G.last&&G.last.ps&&G.last.ps.ks)S.add(G.last.y); if(G.ps)S.add(psYearOf(G.ps)); return [...S].sort((a,b)=>a-b); }
function bkData(y){ const P=G.ps;
  if(P&&psYearOf(P)===y)return {y,seeds:P.seeds,order:P.order,res:P.res,cur:P.done?null:P.cur,resD:P.resD||{},days:P.days||{},now:true};
  const h=G.history.find(x=>x.y===y&&x.ps&&x.ps.ks)||(G.last&&G.last.y===y&&G.last.ps&&G.last.ps.ks?{order:G.last.order,ps:G.last.ps}:null);
  if(h)return {y,seeds:h.order.slice(0,5).map(o=>o.tid),order:h.order,res:h.ps,resD:{},days:h.ps.days||{}};
  const so=standOrder(); return {y:G.year,seeds:so.order.slice(0,5).map(o=>o.tid),order:so.order,res:{},resD:{},days:{},proj:true,live:so.live}; }
/* 한 라운드의 두 팀·승수·상태·차전 일정(진행 중이면 지금 일정, 끝났으면 치른 날짜) */
function bkSeries(D,[k,hs,src]){ const R=D.res||{}, r=R[k], c=D.cur&&D.cur.round===k?D.cur:null, hi=D.seeds[hs];
  let lo=typeof src==='number'?D.seeds[src]:R[src]?R[src][0]:null, wh=null, wl=null;
  if(r){ lo=r[0]===hi?r[1]:r[0]; wh=r[0]===hi?r[2]:r[3]; wl=r[0]===hi?r[3]:r[2]; } else if(c){ lo=c.lo; wh=c.wh; wl=c.wl; }
  const sc=c?{d:c.days,h:c.homes,gi:c.gi,p:c.pts}:D.days[k]?{d:D.days[k].d,h:D.days[k].h,gi:D.days[k].d.length,p:D.days[k].p}:null;
  return {k,hi,lo,wh,wl,r,c,sc,win:r?r[0]:null}; }
function bkSlot(D,t,w,win,alt){ if(t==null)return `<span class="bk-s tbd"><b>TBD</b><i>${alt}</i></span>`;
  const P=tpal(t); return `<span class="bk-s${win==null?'':win===t?' win':' out'}${t===G.user?' me':''}" style="--c1:${P[0]};--c2:${P[2]}">${badge(t,40)}<b title="${esc(tshort(t))}"><s>${esc(team(t).city)} </s>${esc(team(t).nick)}<sup>${D.seeds.indexOf(t)+1}</sup></b><em>${w??''}</em></span>`; }
function bkCard(D,x,sel){ const s=bkSeries(D,x), [k,,src]=x;
  const st=s.r?'종료':s.c?'진행 중':D.proj?'예상':'';
  return `<button class="bk-c bk-${k}${s.r?' done':s.c?' live':''}${sel===k?' sel':''}" data-a="psSel" data-v="${k}" aria-label="${ROUNDK[k]} 결과 보기"><span class="bk-h"><b>${ROUNDK[k]}</b><i>${st}</i></span>${bkSlot(D,s.hi,s.wh,s.win,'')}${bkSlot(D,s.lo,s.wl,s.win,typeof src==='number'?'정규시즌 5위':BK_S[src]+' 승자')}</button>`; }
/* 차전별 날짜·홈·점수: 엔진이 남긴 차전 점수(G.ps 시리즈 pts → days[k].p), 없으면(옛 저장) 우리 경기 기록(G.sea.ulog)만 */
function bkGames(D,x){ const s=bkSeries(D,x), S=s.sc; if(!S)return null;
  const L=D.now?(G.sea.ulog||[]).filter(g=>(g.k||'').startsWith(ROUNDK[x[0]]+' ')):[];
  return S.d.map((d,i)=>{ const h=S.h[i], a=h===s.hi?s.lo:s.hi, u=L.find(g=>g.d===d), p=i<S.gi?(S.p&&S.p[i]?{hs:S.p[i][0],as:S.p[i][1]}:u?{hs:u.hs,as:u.as}:null):null;
    return {i,d,h,a,p,w:p?(p.hs>p.as?h:p.as>p.hs?a:null):null,u:u?G.games.findIndex(r=>r.day===d&&r.kind===u.k):-1,st:i<S.gi?'past':i===S.gi&&s.c?'now':''}; }); }
const bkRes=(g,sz)=>g.p?g.w!=null?`<u class="bk-rs">${badge(g.w,sz)}<b>${esc(team(g.w).nick)}</b><em>${Math.max(g.p.hs,g.p.as)}:${Math.min(g.p.hs,g.p.as)}</em><s>승</s></u>`:`<u class="bk-rs t"><em>${g.p.hs}:${g.p.as}</em><s>무</s></u>`:'';
/* 칸 아래 차전별 날짜·홈 구장·결과(일정이 정해진 시리즈만) */
function bkSched(D,x){ const L=bkGames(D,x);
  return `<div class="bk-sc bk-sc-${x[0]}"><b>${x[3]}</b>${L?L.map(g=>`<span class="${g.st}" title="${g.i+1}차전 ${dmd(g.d)} ${esc(stadName(g.h))}"><i>${g.i+1}차전</i><time>${dobj(g.d).m}/${dobj(g.d).d}</time><em>${esc(stadName(g.h))}</em>${bkRes(g,14)}</span>`).join(''):`<span class="muted">${D.proj?'정규시즌이 끝나면 일정이 정해집니다':'앞 시리즈가 끝나면 일정이 정해집니다'}</span>`}</div>`; }
/* 고른 시리즈 결과: 우리 경기는 경기별 기록(박스스코어)이 남고, 다른 구단 시리즈는 승패 결과만 남는다 */
function bkDet(D,k){ const x=BK_R.find(r=>r[0]===k), s=bkSeries(D,x), nm=t=>`${badge(t,20)} ${esc(tname(t))}`;
  let b='';
  if(D.proj)b=`<p>${s.lo!=null?`${nm(s.hi)} 대 ${nm(s.lo)}`:`${nm(s.hi)}이(가) ${BK_S[x[2]]} 승자를 기다립니다`}</p><p class="muted">${D.live?'지금 순위대로라면 이렇게 붙습니다.':'지난 시즌 최종 순위 기준입니다.'}</p>`;
  else if(s.r)b=`<p class="bk-big">${nm(s.r[0])} <b>${s.r[2]}승 ${s.r[3]}패</b> 승리</p><p class="muted">${nm(s.r[1])} 탈락${D.resD[k]!=null?` · ${dmd(D.resD[k])} 종료`:''}</p>`;
  else if(s.c)b=`<p class="bk-big">${nm(s.c.hi)} <b>${s.c.wh} : ${s.c.wl}</b> ${nm(s.c.lo)}</p><p class="muted">다음 ${s.c.gi+1}차전 ${dmd(s.c.days[s.c.gi])} · ${esc(stadName(s.c.homes[s.c.gi]))}</p>`;
  else b=`<p>${s.hi!=null?nm(s.hi):''}${s.lo!=null?` 대 ${nm(s.lo)}`:` · ${BK_S[x[2]]||''} 승자를 기다리는 중`}</p><p class="muted">아직 시작 전입니다.</p>`;
  const L=D.proj?null:bkGames(D,x), me=G.user;
  const gl=L?`<h4>차전별 결과</h4><div class="bk-gr">${L.map(g=>{ const tg=g.u>=0?'button':'span', o=g.w==null?'t':[g.h,g.a].includes(me)?(g.w===me?'w':'l'):'';
    return `<${tg}${g.u>=0?` data-a="openGame" data-v="${g.u}"`:''} class="bk-g ${g.p?o:'yet'}"${g.p?` title="${esc(tshort(g.a))} ${g.p.as} : ${g.p.hs} ${esc(tshort(g.h))}(원정 : 홈)"`:''}><i>${g.i+1}차전</i><span>${dmd(g.d)} · ${esc(stadName(g.h))}</span>${g.p?bkRes(g,16):`<b class="muted">${g.st==='now'?'다음 경기':'예정'}</b>`}</${tg}>`; }).join('')}</div>${L.some(g=>g.st==='past'&&!g.p)?'<p class="small muted">이 시리즈는 점수가 남지 않은 차전이 있습니다(우리 구단 경기만 기록된 저장).</p>':''}${L.some(g=>g.u>=0)?'<p class="small muted">우리 경기는 눌러서 박스스코어를 봅니다.</p>':''}`:'';
  return `<section class="bk-box bk-det"><h3>${ROUNDK[k]}</h3>${b}${gl}${k==='wc'?'<p class="small muted">4위는 1승을 안고 시작해 한 번만 이기거나 비겨도 올라갑니다. 칸의 숫자는 실제로 이긴 경기 수입니다.</p>':''}</section>`; }
function psBracket(){
  const ys=bkYears(), so=standOrder(), projOk=!G.ps&&so.live, def=G.ps?psYearOf(G.ps):projOk||!ys.length?G.year:ys[ys.length-1];
  const y=UI.psY!=null&&(ys.includes(UI.psY)||(projOk&&UI.psY===G.year))?UI.psY:def, D=bkData(y), R=D.res||{};
  const sel=BK_R.some(r=>r[0]===UI.psSel)?UI.psSel:D.cur&&BK_R.some(r=>r[0]===D.cur.round)?D.cur.round:R.ks?'ks':'wc';
  const opts=ys.map(v=>[v,v+'']); if(projOk)opts.push([G.year,G.year+' 예상']);
  const st=D.proj?(D.live?'지금 순위대로라면 이렇게 붙습니다(예상 대진)':'지난 시즌 최종 순위 기준 예상 대진'):R.ks?`${tname(R.ks[0])} 우승 · 준우승 ${tname(R.ks[1])}`:D.cur?(D.cur.round==='tb'?'순위 결정전 진행 중 · 끝나면 시드가 정해집니다':`${ROUNDK[D.cur.round]} 진행 중`):'포스트시즌';
  const head=`<div class="bk-hd"><span class="eyebrow">가을야구 대진표</span><h2>${D.y} 포스트시즌</h2><p>${esc(st)}</p>${opts.length>1?optRow('psY',y,opts):''}<div class="bk-sum">${BK_R.map(x=>{ const s=bkSeries(D,x), r=s.r; return `<div class="${[s.hi,s.lo].includes(G.user)?'me':''}"><i>${BK_S[x[0]]||'한국시리즈'}</i><span>${r?`${badge(r[0],16)} ${esc(tshort(r[0]))} ${r[2]}승 ${r[3]}패로 ${esc(tshort(r[1]))} 꺾음`:s.c?`${esc(tshort(s.c.hi))} ${s.c.wh} : ${s.c.wl} ${esc(tshort(s.c.lo))} · 진행 중`:`${s.hi!=null?esc(tshort(s.hi)):'TBD'} 대 ${s.lo!=null?esc(tshort(s.lo)):'TBD'}${D.proj?' (예상)':''}`}</span></div>`; }).join('')}</div></div>`;
  /* 아래 줄: 5위 → 1위(왼쪽→오른쪽), 정규시즌 성적 */
  const seeds=`<div class="bk-sd">${[4,3,2,1,0].map(i=>{ const o=D.order[i]; return o?`<div class="bk-q bk-q${i+1}${o.tid===G.user?' me':''}">${badge(o.tid,44)}<span title="${esc(tshort(o.tid))}"><i>${i+1}위</i><b><s>${esc(team(o.tid).city)} </s>${esc(team(o.tid).nick)}</b><em>${o.w}승 ${o.l}패${o.t?` <s>${o.t}무</s>`:''}</em></span></div>`:''; }).join('')}</div>`;
  const ruleT='정규시즌 1~5위가 나갑니다. 아래 단계에서 이긴 팀이 위에서 기다리는 상위 팀과 붙습니다. 칸을 누르면 그 시리즈 결과를 봅니다.';
  /* PC 대진표에서는 칸이 작아 긴 설명은 i 버튼으로, 짧은 안내만 남긴다 */
  const rule=`<section class="bk-box bk-rule"><h3>진행 방식 ${hiI(ruleT)}</h3><p class="bk-rule-l">${ruleT}</p><p class="bk-rule-s">1~5위 · 아래 단계 승자가 위 칸 상위 팀과 붙습니다.</p></section>`;
  const ks=R.ks, ch=`<div class="bk-ch${ks?' on':''}${ks&&ks[0]===G.user?' me':''}"><span class="eyebrow">${D.y} 우승</span>${ks?`${champTrophyImg(80)}<span class="bk-cht">${badge(ks[0],48)}<b>${esc(tname(ks[0]))}</b></span><i>한국시리즈 ${ks[2]}승 ${ks[3]}패</i>`:'<b class="muted">TBD</b><i>한국시리즈 승자</i>'}</div>`;
  /* 선: 칸(두 팀 사이) → 다음 칸 아래 팀, 아래 줄 구단 → 그 구단이 들어가는 칸 */
  const my=i=>BK_Y[i]+BK_H*.61, lowY=i=>BK_Y[i]+BK_H*.805, bot=i=>BK_Y[i]+BK_H;
  const ln=BK_R.map(([k],i)=>{ const x0=BK_X[i]+BK_W, x1=BK_X[i+1], y0=my(i), y1=i<3?lowY(i+1):my(i), m=(x0+x1)/2;
    return `<path class="${R[k]?'on':''}" d="M${x0} ${y0}H${m}V${y1}H${x1}"/>`; }).join('')
    +[[0,BK_W*.25],[0,BK_W*.75],[1,BK_W/2],[2,BK_W/2],[3,BK_W/2]].map(([c,dx])=>`<path d="M${BK_X[c]+dx} ${BK_SY}V${bot(c)}"/>`).join(''); /* 일정 칸이 줄기를 덮는다 */
  return `<div class="bk ws-own"${v3('bracket')?` style="--bk-bg:url(${v3('bracket')})"`:''}>${head}<svg class="bk-ln" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${ln}</svg>${BK_R.map(x=>bkCard(D,x,sel)+bkSched(D,x)).join('')}${ch}${bkDet(D,sel)}${seeds}${rule}</div>`; }
function standFm(order,live,y){
  const me=G.user, n=order.length, top=order[0], rk=order.findIndex(o=>o.tid===me)+1, gs=G.unemp?null:goalStatus(), od=live?playoffOdds():null, om=new Map((od||[]).map(o=>[o.tid,o]));
  const R=playerRows(y), mine=R.filter(x=>(x.h.t??x.p.team)===me), B=mine.filter(x=>!x.p.isP), P=mine.filter(x=>x.p.isP), rc=fxRankLine();
  /* 1. 정규시즌 */
  const rows=order.map((o,i)=>{ const sp=splitOf(o.tid), d=sp.rs-sp.ra;
    return `<tr class="${o.tid===me?'me':''}${i===4?' cut':''}"><td>${i+1}</td><td><button class="lnk tname" data-a="lteamGo" data-v="${o.tid}">${badge(o.tid,16)}${esc(team(o.tid).nick)}</button></td><td>${o.w+o.l+(o.t||0)}</td><td>${o.w}</td><td>${o.l}</td><td>${o.t||0}</td><td class="key">${pctStr(o)}</td><td>${i?gbStr(gbOf(top,o)):'-'}</td><td class="${d>0?'pos':d<0?'neg':''}">${sp.n?(d>0?'+':'')+d:'-'}</td><td>${fxForm(tlOf(o.tid).slice(-5))}</td></tr>`; }).join('');
  const reg=fxBox('fx-reg',fxHead(`${y} 정규시즌`,`${n}개 구단 · 팀당 144경기 · 5위까지 가을야구`),
    (live&&rk?fxExp(gs?`${gs.rank.t}위 이내`:'목표 없음',(n+1-rk)/n*100,gs?(n+1-gs.rank.t)/n*100:null,gs?rk<=gs.rank.t:null,`${rk}위`):fxExp(gs?`${G.year} ${gs.rank.t}위 이내`:'목표 없음',null,null,null,rk?`${y} 최종 ${rk}위 · 개막 전`:'개막 전'))
    +`<div class="fx-two"><div><h4>최근 경기력</h4>${tlOf(me).length?fxForm(tlOf(me).slice(-10)):'<p class="fx-none">경기 전</p>'}</div><div><h4>리그 순위</h4>${rc||'<p class="fx-none">사흘 이상 치르면 그립니다</p>'}</div></div>`
    +`<div class="fx-tw"><table class="fx-t fx-st"><thead><tr><th>순위</th><th>구단</th><th>경기</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>차</th><th>득실</th><th>최근 5</th></tr></thead><tbody>${rows}</tbody></table></div>`
    +`<h4>우리 팀 선수</h4><div class="fx-pls">${fxStar('최다 홈런',fxTop(B,x=>x.h.hr),x=>x.h.hr+'홈런')}${fxStar('최다 승리',fxTop(P,x=>x.h.w||0),x=>(x.h.w||0)+'승')}${fxStar('타자 최고 WAR',fxTop(B,x=>x.w),x=>'WAR '+x.w.toFixed(1))}${fxStar('투수 최고 WAR',fxTop(P,x=>x.w),x=>'WAR '+x.w.toFixed(1))}${fxStar('최다 타점',fxTop(B,x=>x.h.rbi),x=>x.h.rbi+'타점')}${fxStar('최다 탈삼진',fxTop(P,x=>x.h.so),x=>x.h.so+'탈삼진')}</div>`,
    fxBtn('recGo','team:ops','팀 기록')+fxBtn('recGo','bat:ops','선수 기록')+(rc?fxBtn('itab','stand:chart','순위 변동'):''));
  /* 2. 포스트시즌 */
  const seeds=G.ps&&G.ps.seeds&&G.ps.seeds.length?G.ps.seeds:null, mo=om.get(me), inPs=seeds?seeds.includes(me):null, fifth=order[4];
  const odds=od?order.map((o,i)=>{ const x=om.get(o.tid); return `<div class="fx-odd${o.tid===me?' me':''}${i===4?' cut':''}"><span>${i+1}</span>${badge(o.tid,16)}<b>${esc(team(o.tid).nick)}</b><p class="fx-bar"><i class="${x.ps>=.5?'good':''}" style="width:${Math.max(2,x.ps*100)}%"></i></p><em>${pct(x.ps)}</em></div>`; }).join('')
    :order.map((o,i)=>{ const v=gbOf(fifth,o); return `<div class="fx-odd${o.tid===me?' me':''}${i===4?' cut':''}"><span>${i+1}</span>${badge(o.tid,16)}<b>${esc(team(o.tid).nick)}</b><p></p><em class="${v<0?'pos':v>0?'neg':''}">${i===4?'5위':v<0?'+'+(-v).toFixed(1):v>0?'-'+v.toFixed(1):'0.0'}</em></div>`; }).join('');
  const ps=fxBox('fx-ps',fxHead(`${live||seeds?y:G.year} 포스트시즌`,'정규시즌 1~5위 · 계단식 진행',compMark('ps',30)),
    fxExp(gs?(gs.rank.t<=5?'가을야구 진출':`요구 없음(목표 ${gs.rank.t}위)`):'목표 없음',inPs!=null?(inPs?100:0):mo?mo.ps*100:null,null,inPs!=null?inPs:mo?mo.ps>=.5:null,inPs!=null?(inPs?'진출':'탈락'):mo?'진출 확률 '+pct(mo.ps):'팀당 20경기 뒤 계산')
    +`<h4>${seeds?'대진':live?'대진(지금 순위대로라면)':'대진'}</h4><div class="psl-l">${psLadder(live?order:null)}</div><h4>${od?'가을야구 진출 확률':live?'5위와 승차':y+' 최종 순위 · 5위와 승차'}</h4><div class="fx-odds">${odds}</div>`
    +(tlOf(me).length?`<h4>우리 팀 상대 전적</h4><div class="fx-h2h">${order.filter(o=>o.tid!==me).map(o=>{ const r=h2hOf(me,o.tid); return `<div class="${r.w>r.l?'pos':r.w<r.l?'neg':''}">${badge(o.tid,16)}<span>${esc(team(o.tid).nick)}</span><b>${r.w+r.l+r.t?wlStr(r):'-'}</b></div>`; }).join('')}</div>`:''),
    fxBtn('itab','stand:ps','대진표')+fxBtn('itab','stand:map','구단 전력')+(tlOf(me).length?fxBtn('itab','stand:h2h','상대 전적'):''));
  /* 3. 경기 일정: 다음 경기 크게, 다음 경기일 전체 대진, 우리 일정·최근 결과 */
  const nx=nextGames(6), g0=nx[0], recA=t=>{ const i=order.findIndex(o=>o.tid===t); return `${live&&i>=0?i+1+'위 · ':''}${ibdRec(t)}`; }, cs=!g0&&G.ps&&!G.ps.done&&G.ps.cur;
  let dd=null; for(let d=G.day+1;d<=G.cal.end&&dd==null;d++)if((G.cal.sched[d]||[]).length)dd=d;
  const vsT=(t,h)=>`<div class="fx-vt">${badge(t,64)}<b>${esc(team(t).nick)}</b><span>${h} · ${recA(t)}</span></div>`;
  const sch=fxBox('fx-sch',fxHead('경기 일정',g0?`다음 경기 ${dmd(g0.d)} ${WD[dobj(g0.d).w]}`:'남은 경기 없음'),
    (g0?`<div class="fx-vs">${vsT(g0.home?me:g0.op,'홈')}<em>${g0.ps?esc(g0.ps):'vs'}</em>${vsT(g0.home?g0.op:me,'원정')}</div>`:cs?`<h4>${ROUNDK[cs.round]} 진행 중 · 다음 ${dmd(cs.days[cs.gi])}</h4><div class="fx-vs">${vsT(cs.hi,cs.wh+'승')}<em>${cs.wh} : ${cs.wl}</em>${vsT(cs.lo,cs.wl+'승')}</div>`:'')
    +(dd?`<h4>${dmd(dd)} ${WD[dobj(dd).w]} 전체 대진 <i>왼쪽이 홈</i></h4>${G.cal.sched[dd].map(([h,a])=>`<div class="fx-fx${h===me||a===me?' me':''}"><span>${badge(h,16)}${esc(team(h).nick)}</span><em>vs</em><span>${esc(team(a).nick)}${badge(a,16)}</span></div>`).join('')}`:'')
    +(nx.length>1?`<h4>우리 다음 경기</h4>${nx.slice(1).map(x=>`<div class="ibd-gm"><span>${dmd(x.d)} ${WD[dobj(x.d).w]}</span><span class="pill">${x.ps?esc(x.ps):x.home?'홈':'원정'}</span><b>${badge(x.op,14)} ${esc(tshort(x.op))}</b><em>${ibdRank(x.op)?ibdRank(x.op)+'위':''}</em></div>`).join('')}`:'')
    +(G.games.length?`<h4>최근 결과</h4>${G.games.slice(0,5).map((g,i)=>{ const h=g.home===me, op=h?g.away:g.home; return `<button class="fx-res" data-a="openGame" data-v="${i}"><span class="pill ${g.res==='승'?'good':g.res==='패'?'bad':''}">${g.res}</span><span>${dmd(g.day)}</span><b>${h?'vs':'@'} ${badge(op,14)} ${esc(team(op).nick)}</b><em>${h?g.hs:g.as} : ${h?g.as:g.hs}</em></button>`; }).join('')}`:''),
    fxBtn('go','league:score','일정·결과'));
  /* 4. 부문별 1위와 역대 우승 */
  const L=leaderCats(R,y).filter(c=>!/wRC|WHIP|안타/.test(c[0])).map(([l,arr,v,f])=>{ const a=fxTop(arr,v); const tt=a&&(a.h.t??a.p.team); /* 스토브리그에는 FA·은퇴로 소속이 없을 수 있어 그 시즌 소속으로 */
    return a?`<button class="fx-ld${tt===me?' me':''}" data-a="player" data-v="${a.p.id}"><span>${l}</span>${avImg(a.p)}<b>${esc(a.p.name)}<i>${tt!=null?badge(tt,12)+' '+esc(team(tt).nick):'무소속'}</i></b><em>${(f||v)(a)}</em></button>`:''; }).join('');
  const hist=[...G.history].filter(h=>h.champ!=null).reverse().slice(0,6).map(h=>`<div class="fx-li${h.champ===me?' me':''}"><b>${h.y}</b><span>${badge(h.champ,14)} ${esc(tshort(h.champ))}</span></div>`).join('');
  const lead=fxBox('fx-lead',fxHead(`${y} 부문별 1위`,'비율 기록은 규정 기준 이상'),(L||'<p class="fx-none">아직 기록이 없습니다.</p>')+(hist?`<h4>역대 한국시리즈 우승</h4>${hist}`:''),fxBtn('go','league:rec','기록')+fxBtn('go','league:hist','역사'));
  return `<div class="fmx fmx-fit fmx-league nolink ws-own">${reg}${ps}${sch}${lead}</div>`;
}

/* ---------- 리그: 경기 결과(스코어보드) ---------- */
function scoreHub(){ const fm=fmOn(), t=inTabs('sres',[['mine',fm?'시즌 일정':'우리 경기'],['day','날짜별 결과'],['cal','월별 일정']],fm||G.games.length?'mine':'cal'); /* 개막 전에는 일정부터(PC는 첫 칸이 시즌 전체 일정) */ return t.bar+(t.cur==='mine'?(fm?scoreFm():gamesView()):t.cur==='day'?scoreView():schedView()); }
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
/* 리그 소식: 다른 구단 외국인 교체·감독 선임·FA 이적 */
function wireView(){ if(fmOn())return wireFm(); const all=G.wire||[]; const ks=[...new Set(all.map(w=>w.k))]; const W=UI.wk?all.filter(w=>w.k===UI.wk):all;
  const kc=ks.length>1?`<div class="chips"><button data-a="wk" data-v="" class="${!UI.wk?'on':''}">전체</button>${ks.map(k=>`<button data-a="wk" data-v="${esc(k)}" class="${UI.wk===k?'on':''}">${esc(k)}</button>`).join('')}</div>`:'';
  return csec('리그 소식',kc+(W.length?(()=>{ const P=pager('wire',W.slice(0,120),20); return `<div class="list">${P.items.map(w=>`<div class="item wa" ${w.ref!=null&&G.players[w.ref]?`data-a="player" data-v="${w.ref}"`:'style="cursor:default"'}>${w.tid!=null?badge(w.tid,24):`<span class="av ini">${ASSOC.s}</span>`}<span class="nm">${lk(w.t)}</span><span class="sub"><span class="pill">${esc(w.k)}</span> ${dsh(w.d)}</span></div>`).join('')}</div>${P.bar}`; })():'<p class="small muted">다른 구단의 외국인 교체, 감독 선임, FA 이적 소식이 여기에 쌓입니다.</p>')); }
/* 우리 구단 기사(구단 > 팬·언론) */
function ourNewsView(){ G.newsSeen=Math.max(newsSeen(),...(G.news||[]).map(n=>n.id||0));
  const kinds=[...new Set((G.news||[]).map(n=>n.k).filter(Boolean))]; const ns=(G.news||[]).filter(n=>!UI.nk||n.k===UI.nk);
  const kc=`<div class="chips"><button data-a="nk" data-v="" class="${!UI.nk?'on':''}">전체</button>${kinds.map(k=>`<button data-a="nk" data-v="${esc(k)}" class="${UI.nk===k?'on':''}">${esc(k)}</button>`).join('')}</div>`;
  return csec('우리 구단 기사',kc+(ns.length?(()=>{ const P=pager('news'+(UI.nk||''),ns.slice(0,120),8); return `<div class="newslist">${P.items.map(n=>newsItem(n,true)).join('')}</div>${P.bar}`; })():'<p class="small muted">기사가 없습니다.</p>')); }
function newsView(){ return ourNewsView(); }


/* ---------- PC(FM '주요 일정' 배치): 일정·결과 ----------
   왼쪽 시즌 전체 일정 한 줄 표(다음 경기 근처로 맞춤), 가운데 날짜별 리그 결과와 다음 경기일 대진, 오른쪽 다음 경기와 시즌 성적 요약.
   값은 일정(G.cal.sched)·우리 정규시즌 기록(G.sea.ulog)·구단별 경기 기록(tlOf)만 쓴다 */
function scoreFm(){ const me=G.user, c=G.cal, U=(G.sea.ulog||[]).filter(x=>!/차전/.test(x.k)), log=new Map(U.map(x=>[x.d,x])), so=standOrder(), rkOf=t=>{ const i=(so.order||[]).findIndex(o=>o.tid===t); return so.live&&i>=0?i+1:null; };
  const days=Object.keys(c.sched).map(Number).filter(d=>c.sched[d].some(m=>m.includes(me))).sort((a,b)=>a-b), ni=days.findIndex(d=>!log.has(d)&&d>=G.day);
  let w=0,l=0,t=0,mo=0; const rows=days.map((d,i)=>{ const m=c.sched[d].find(x=>x.includes(me)), h=m[0]===me, op=h?m[1]:m[0], r=log.get(d), o=dobj(d), gi=G.games.findIndex(g=>g.day===d&&!g.kind);
    if(r){ if(r.res==='승')w++; else if(r.res==='패')l++; else t++; }
    const sep=o.m!==mo?`<tr class="fx-mo"><td colspan="7">${G.year}년 ${o.m}월</td></tr>`:''; mo=o.m; const rk=rkOf(op);
    return sep+`<tr class="${i===ni?'now ':''}${r?'':'up'}${gi>=0?' click':''}"${gi>=0?` data-a="openGame" data-v="${gi}"`:''}><td>${o.m}/${o.d} <i>${WD[o.w]}</i></td><td>${r?'':d>G.day?`${d-G.day}일 뒤`:''}</td><td>${h?'홈':'원정'}</td><td>${badge(op,16)} ${esc(team(op).nick)}${rk?` <i>${rk}위</i>`:''}</td><td>${r?`<span class="pill ${r.res==='승'?'good':r.res==='패'?'bad':''}">${r.res}</span>`:d<G.day?'<span class="muted">-</span>':''}</td><td>${r?`${h?r.hs:r.as} : ${h?r.as:r.hs}`:''}</td><td>${r?`${w}-${l}${t?'-'+t:''}`:''}</td></tr>`; }).join('');
  const all=fxBox('fxs-all',fxHead(`${G.year} 정규시즌 일정`,`144경기 중 ${U.length}경기 치름 · 남은 ${Math.max(0,days.length-U.length)}경기`),
    days.length?`<div class="fx-scr" data-snap><table class="fx-t fx-sch"><thead><tr><th>날짜</th><th>남은 날</th><th>장소</th><th>상대 · 지금 순위</th><th>결과</th><th>점수</th><th>누적</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="fx-none">일정이 아직 나오지 않았습니다.</p>',
    fxBtn('itab','sres:cal','월별 일정')+fxBtn('go','league:stand','순위'));
  /* 날짜별 리그 결과(왼쪽이 홈) */
  const rd=[...new Set(G.teams.flatMap(x=>tlOf(x.id).map(z=>z[5])))].sort((a,b)=>a-b); let d=UI.sbd; if(d==null||!rd.includes(d))d=rd[rd.length-1]; const di=rd.indexOf(d);
  const gs=[]; if(d!=null)for(const x of G.teams)for(const z of tlOf(x.id))if(z[5]===d&&z[3]===1)gs.push({h:x.id,a:z[4],hs:z[1],as:z[2]});
  const res=gs.map(s=>{ const gi=G.games.findIndex(g=>g.day===d&&g.home===s.h&&g.away===s.a), mine=s.h===me||s.a===me;
    return `<${gi>=0?`button data-a="openGame" data-v="${gi}"`:'div'} class="fx-fx fx-sc${mine?' me':''}"><span>${badge(s.h,16)}${esc(team(s.h).nick)}</span><em><b class="${s.hs>s.as?'w':''}">${s.hs}</b> : <b class="${s.as>s.hs?'w':''}">${s.as}</b></em><span>${esc(team(s.a).nick)}${badge(s.a,16)}</span></${gi>=0?'button':'div'}>`; }).join('');
  let dd=null; for(let x=G.day+1;x<=c.end&&dd==null;x++)if((c.sched[x]||[]).length)dd=x;
  const day=fxBox('fxs-day',fxHead('날짜별 결과',d!=null?`${dmd(d)} ${WD[dobj(d).w]} · 왼쪽이 홈`:'아직 치른 경기가 없습니다'),
    (res||'<p class="fx-none">치른 경기가 쌓이면 날짜별 점수가 보입니다.</p>')+((so.order||[]).length?`<h4>${so.live?'지금 순위':so.y+' 최종 순위'}</h4><table class="fx-t fx-mst"><tbody>${so.order.map((o,i)=>`<tr class="${o.tid===me?'me':''}${i===4?' cut':''}"><td>${i+1}</td><td>${badge(o.tid,14)} ${esc(team(o.tid).nick)}</td><td>${o.w}-${o.l}${o.t?'-'+o.t:''}</td><td>${pctStr(o)}</td><td>${i?gbStr(gbOf(so.order[0],o)):'-'}</td></tr>`).join('')}</tbody></table>`:'')+(dd?`<h4>다음 경기일 ${dmd(dd)} ${WD[dobj(dd).w]} 대진</h4>${c.sched[dd].map(([h,a])=>`<div class="fx-fx${h===me||a===me?' me':''}"><span>${badge(h,16)}${esc(team(h).nick)}</span><em>vs</em><span>${esc(team(a).nick)}${badge(a,16)}</span></div>`).join('')}`:''),
    (di>0?`<button class="btn small" data-a="sbd" data-v="${rd[di-1]}">‹ 이전 날</button>`:'')+(di>=0&&di<rd.length-1?`<button class="btn small" data-a="sbd" data-v="${rd[di+1]}">다음 날 ›</button>`:'')+fxBtn('itab','sres:day','크게 보기'));
  /* 다음 경기 */
  const nx=nextGames(6), g0=nx[0], vsT=(x,s)=>`<div class="fx-vt">${badge(x,56)}<b>${esc(team(x).nick)}</b><span>${s} · ${ibdRec(x)}</span></div>`;
  const nxt=fxBox('fxs-nx',fxHead('다음 경기',g0?`${dmd(g0.d)} ${WD[dobj(g0.d).w]}${g0.d>G.day?` · ${g0.d-G.day}일 뒤`:''}`:'남은 경기 없음'),
    (g0?`<div class="fx-vs">${vsT(g0.home?me:g0.op,'홈')}<em>${g0.ps?esc(g0.ps):'vs'}</em>${vsT(g0.home?g0.op:me,'원정')}</div>`:'')
    +(nx.length>1?`<h4>이어지는 경기</h4>${nx.slice(1).map(x=>`<div class="ibd-gm"><span>${dmd(x.d)} ${WD[dobj(x.d).w]}</span><span class="pill">${x.ps?esc(x.ps):x.home?'홈':'원정'}</span><b>${badge(x.op,14)} ${esc(tshort(x.op))}</b><em>${ibdRank(x.op)?ibdRank(x.op)+'위':''}</em></div>`).join('')}`:'')
    +(G.ps?`<h4>포스트시즌</h4><div class="psl-l">${psLadder(null)}</div>`:''),fxBtn('go','league:stand','순위')+(G.ps?fxBtn('itab','stand:ps','포스트시즌'):''));
  /* 시즌 성적 요약: 홈·원정·1점 차·최근 10경기, 월별 */
  const wl=L=>{ const a=L.filter(x=>x.res==='승').length, b=L.filter(x=>x.res==='패').length, e=L.length-a-b; return L.length?`${a}-${b}${e?'-'+e:''}`:'-'; }, run=(x,mine)=>(x.h===me)===mine?x.hs:x.as;
  const M=[...new Set(U.map(x=>dobj(x.d).m))].map(m=>{ const L=U.filter(x=>dobj(x.d).m===m), a=L.filter(x=>x.res==='승').length, b=L.filter(x=>x.res==='패').length; return `<tr><td>${m}월</td><td>${L.length}</td><td>${a}</td><td>${b}</td><td>${L.length-a-b}</td><td>${a+b?fmt3(a/(a+b)):'-'}</td><td>${sum(L.map(x=>run(x,true)))}</td><td>${sum(L.map(x=>run(x,false)))}</td></tr>`; }).join('');
  const sm=fxBox('fxs-sum',fxHead('시즌 성적',U.length?`${wl(U)} · 정규시즌`:'개막 전'),
    `<div class="fx-facts">${fxFact('홈',wl(U.filter(x=>x.h===me)))}${fxFact('원정',wl(U.filter(x=>x.h!==me)))}${fxFact('1점 차',wl(U.filter(x=>Math.abs(x.hs-x.as)===1)))}${fxFact('최근 10경기',wl(U.slice(-10)))}</div>`
    +(tlOf(me).length?`<h4>최근 경기력</h4>${fxForm(tlOf(me).slice(-20))}`:'')
    +(M?`<h4>월별 성적</h4><table class="fx-t fx-mt"><thead><tr><th>월</th><th>경기</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>득점</th><th>실점</th></tr></thead><tbody>${M}</tbody></table>`:'<p class="fx-none">경기를 치르면 월별 성적이 쌓입니다.</p>'),
    fxBtn('go','league:stat','구단 지표'));
  return `<div class="fmx fmx-fit fmx-sch nolink ws-own">${all}${day}${nxt}${sm}</div>`; }

/* ---------- PC(FM '대회' 기록 배치): 부문별 1위 ----------
   네 칸에 부문 네 개씩, 부문마다 1위는 얼굴과 함께 크게, 2~5위는 한 줄. 마지막 자리는 우리 선수의 부문별 최고 순위 */
function recFm(rows,y){ const me=G.user, C=leaderCats(rows,y), by=l=>C.find(c=>c[0]===l), tt=x=>x.h.t??x.p.team, srt=([,arr,v])=>[...arr].sort((a,b)=>v(b)-v(a));
  const cat=c=>{ const [l,,v,f]=c, s=srt(c).slice(0,5), fm=f||v; if(!s.length)return `<div class="fx-cat"><h4>${l}</h4><p class="fx-none">기록 없음</p></div>`; const a=s[0];
    return `<div class="fx-cat"><h4>${l}</h4><button class="fx-l1${tt(a)===me?' me':''}" data-a="player" data-v="${a.p.id}">${avImg(a.p)}<b>${esc(a.p.name)}<i>${tt(a)!=null?badge(tt(a),12)+' '+esc(team(tt(a)).nick):'무소속'}</i></b><em>${fm(a)}</em></button>${s.slice(1).map((x,i)=>`<button class="fx-rk${tt(x)===me?' me':''}" data-a="player" data-v="${x.p.id}"><i>${i+2}</i><b>${esc(x.p.name)}</b><span>${tt(x)!=null?esc(team(tt(x)).nick):''}</span><em>${fm(x)}</em></button>`).join('')}</div>`; };
  const ours=`<div class="fx-cat"><h4>우리 선수 최고 순위</h4>${C.map(c=>{ const s=srt(c), i=s.findIndex(x=>tt(x)===me); return i<0?'':`<button class="fx-rk${i<3?' me':''}" data-a="player" data-v="${s[i].p.id}"><i>${i+1}</i><b>${esc(s[i].p.name)}</b><span>${c[0]}</span><em>${(c[3]||c[2])(s[i])}</em></button>`; }).join('')||'<p class="fx-none">기록 없음</p>'}</div>`;
  const col=(cls,t,s,ls,foot,extra)=>fxBox('fxr '+cls,fxHead(t,s),ls.map(by).filter(Boolean).map(cat).join('')+(extra||''),foot);
  return `<div class="fmx fmx-fit fmx-rec nolink ws-own">${col('fxr-b1',`${y} 타격 · 정확성`,'타율·OPS·wRC+는 규정타석 이상',['타율','안타','OPS','wRC+'],fxBtn('lrec','bat','타자 기록'))}${col('fxr-b2',`${y} 타격 · 힘과 발`,'누적 기록은 모든 타자',['홈런','타점','도루','타자 WAR'],fxBtn('go','league:stat','리그 통계'))}${col('fxr-p1',`${y} 투수 · 실점 억제`,'평균자책점·WHIP는 규정이닝 이상',['평균자책점','승리','탈삼진','WHIP'],fxBtn('lrec','pit','투수 기록'))}${col('fxr-p2',`${y} 투수 · 불펜과 종합`,'누적 기록은 모든 투수',['세이브','홀드','투수 WAR'],fxBtn('lrec','team','팀 기록'),ours)}</div>`; }

/* ---------- PC(FM 뉴스 배치): 리그 소식 ----------
   왼쪽 전체 소식 한 줄 목록(분류 버튼), 오른쪽 이적·계약과 감독·스태프 소식을 따로 */
const WIRE_G={mv:['트레이드','FA','외국인','이적','계약','방출','은퇴','해외'],st:['감독','코치','스태프','단장']};
function wireFm(){ const all=G.wire||[], ks=[...new Set(all.map(w=>w.k))], W=UI.wk?all.filter(w=>w.k===UI.wk):all;
  const line=w=>`<div class="fx-wr"${w.ref!=null&&G.players[w.ref]?` data-a="player" data-v="${w.ref}"`:''}><span>${dsh(w.d)}</span><span class="pill">${esc(w.k)}</span>${w.tid!=null?badge(w.tid,16):`<span class="av ini">${ASSOC.s}</span>`}<b>${lk(w.t)}</b></div>`; /* 본문 안 이름 링크(lk)가 있어 버튼 대신 div */
  const kc=ks.length>1?`<div class="chips fx-chips"><button data-a="wk" data-v="" class="${!UI.wk?'on':''}">전체 ${all.length}</button>${ks.map(k=>`<button data-a="wk" data-v="${esc(k)}" class="${UI.wk===k?'on':''}">${esc(k)} ${all.filter(w=>w.k===k).length}</button>`).join('')}</div>`:'';
  const side=(cls,t,g,none)=>{ const L=all.filter(w=>WIRE_G[g].includes(w.k)); return fxBox(cls,fxHead(t,L.length?`${L.length}건 · 최근 순`:'소식 없음'),L.length?`<div class="fx-scr">${L.slice(0,40).map(line).join('')}</div>`:`<p class="fx-none">${none}</p>`); };
  return `<div class="fmx fmx-fit fmx-wire nolink ws-own">${fxBox('fxw-all',fxHead('리그 소식',`${W.length}건${UI.wk?' · '+esc(UI.wk):''} · 최근 150건 보관`),kc+(W.length?`<div class="fx-scr">${W.slice(0,150).map(line).join('')}</div>`:'<p class="fx-none">다른 구단의 외국인 교체, 감독 선임, FA 이적 소식이 여기에 쌓입니다.</p>'),fxBtn('go','transfer:moves','이적 현황')+fxBtn('go','club:fans','우리 구단 기사'))}${side('fxw-mv','이적·계약','mv','트레이드·FA·외국인 계약 소식이 쌓입니다.')}${side('fxw-st','감독·스태프','st','감독 선임·코치·스태프 변동 소식이 쌓입니다.')}</div>`; }
