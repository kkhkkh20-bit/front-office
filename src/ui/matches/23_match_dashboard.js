/* 기록된 타석만 읽는 중계 대시보드. 최종 박스의 누적 기록은 재생 중에 쓰지 않는다. */
function castLineup(g,side,k){
  const box=g.box[side],source=box.lineup;
  let rows;
  if(source)rows=source.map(x=>({...x}));
  else{const groups=new Map();for(const x of box.bat){const o=x.o??groups.size;if(!groups.has(o))groups.set(o,[]);groups.get(o).push(x);}
    rows=[...groups].sort((a,b)=>a[0]-b[0]).slice(0,9).map(([o,L])=>{const x=L.find(x=>x.pos==null)||L[0];return {id:x.id,n:x.n,o,pos:x.pos||G.players[x.id]?.pos||'DH'};});}
  for(const change of box.changes||[])if(change.at<=k)rows=change.lineup.map(x=>({...x}));
  if(!source)for(const x of (g.pbp||[]).slice(0,k))if(typeof x[1]==='number'&&(x[0]%2?'h':'a')===side){const b=box.bat.find(b=>b.id===x[1]);if(b){const i=rows.findIndex(r=>r.o===b.o);if(i>=0)rows[i]={id:b.id,n:b.n,o:b.o,pos:b.pos||rows[i].pos};}}
  return rows;
}
function castSnapshot(g,k){
  const L=g.pbp||[],n=clamp(Math.floor(k),0,L.length),finished=n>=L.length;
  const init=side=>({lineup:castLineup(g,side,n),pitcher:g.box[side].pit[0]?.id??null,pitchers:g.box[side].pit[0]?[g.box[side].pit[0].id]:[],next:0,innings:[],hits:[],stats:{r:0,h:0,hr:0,bb:0,hbp:0,so:0,sb:0,cs:0,e:0}});
  const teams={a:init('a'),h:init('h')},players={},events=[],history=[{i:0,half:0,sa:0,sh:0,wp:wpHome({sa:0,sh:0,outs:0,bases:[0,0,0],half:0},wpMax(g))}];
  let half=-1,outs=0;
  const bat=id=>players[id]||(players[id]={ab:0,h:0,hr:0,bb:0,hbp:0,so:0,outs:0,sb:0,cs:0});
  for(let i=0;i<n;i++){
    const x=L[i],atk=x[0]%2?'h':'a',def=atk==='h'?'a':'h',T=teams[atk],D=teams[def],inn=Math.floor(x[0]/2);
    if(half!==x[0]){half=x[0];outs=0;}
    if(x[1]==='PC'){D.pitcher=x[2];if(!D.pitchers.includes(x[2]))D.pitchers.push(x[2]);events.push({i,half,type:'PC',id:x[2]});continue;}
    if(x[1]==='SB'||x[1]==='CS'){T.stats[x[1]==='SB'?'sb':'cs']++;bat(x[2])[x[1]==='SB'?'sb':'cs']++;if(D.pitcher)bat(D.pitcher).outs+=Math.max(0,x[3]-outs);outs=x[3];events.push({i,half,type:x[1],id:x[2]});{const p=history[history.length-1],o=x[3];history.push({i:i+1,half:x[0],sa:p.sa,sh:p.sh,wp:wpHome({sa:p.sa,sh:p.sh,half:o>=3?x[0]+1:x[0],outs:o>=3?0:o,bases:o>=3?[0,0,0]:x[4]},wpMax(g))});} /* 도루도 승리 확률 그래프에(검수 11-09zu) */continue;}
    if(typeof x[1]!=='number')continue;
    const B=bat(x[1]),P=bat(x[2]);D.pitcher=x[2];if(!D.pitchers.includes(x[2]))D.pitchers.push(x[2]);
    if(x[3]!=='BB'&&x[3]!=='HBP'&&x[3]!=='SAC'&&!x[13])B.ab++;
    if(['1B','2B','3B','HR'].includes(x[3])){B.h++;T.stats.h++;T.hits[inn]=(T.hits[inn]||0)+1;P.h++;}
    if(x[3]==='HR'){B.hr++;T.stats.hr++;P.hr++;}
    if(x[3]==='BB'){B.bb++;T.stats.bb++;P.bb++;}
    if(x[3]==='HBP'){B.hbp++;T.stats.hbp++;P.hbp++;}
    if(x[3]==='K'){B.so++;T.stats.so++;P.so++;}
    if(x[9])D.stats.e++;
    P.outs+=Math.max(0,x[4]-outs);outs=x[4];
    T.innings[inn]=(T.innings[inn]||0)+(x[6]||0);teams.a.stats.r=x[7];teams.h.stats.r=x[8];
    const slot=g.box[atk].bat.find(b=>b.id===x[1])?.o??T.lineup.findIndex(b=>b.id===x[1]);if(slot>=0)T.next=(slot+1)%9;
    if(x[6]||x[9]||['HR','2B','3B','DP'].includes(x[3]))events.push({i,half,type:x[3],id:x[1],runs:x[6]||0,label:paK(x)[0]}); /* 실책 출루도 주요 장면, 이름은 희생플라이·실책 출루까지 구분(검수 11-09zu) */
    const st={sa:x[7],sh:x[8],half:x[4]>=3?x[0]+1:x[0],outs:x[4]>=3?0:x[4],bases:x[4]>=3?[0,0,0]:x[5]};
    history.push({i:i+1,half:x[0],sa:x[7],sh:x[8],wp:wpHome(st,wpMax(g))});
  }
  const state=n?cBefore(g,n):{sa:0,sh:0,outs:0,bases:[0,0,0],half:L[0]?.[0]||0};
  if(finished){state.sa=g.as;state.sh=g.hs;state.bases=[0,0,0];history[history.length-1].wp=g.hs>g.as?1:0;} /* 무승부는 홈 승리가 아니다(검수 11-09zu) */
  const attack=state.half%2?'h':'a';
  return {k:n,finished,state,teams,players,events,history,attack,batter:finished?null:teams[attack].lineup[teams[attack].next]?.id??null,legacy:!g.box.h.lineup||!g.box.a.lineup};
}
const mdColor=(g,side)=>side==='a'?'#75b5df':'#69c69b';
function mdSet(id,html){const el=document.getElementById(id);if(el&&el._mdHtml!==html){el.innerHTML=html;el._mdHtml=html;}}
function mdRow(g,id){ if(!g||!g.box)return null; for(const sd of ['h','a'])for(const k of ['bat','pit']){ const q=((g.box[sd]||{})[k]||[]).find(p=>p.id===id); if(q)return q; } return null; }
function mdPlayer(g,id){ const p=G.players[id], q=mdRow(g,id); if(p)return q&&q.n&&q.n!==p.name?Object.assign(Object.create(p),{name:q.n}):p; return {id,name:q?.n||'기록 선수',th:q?.th,bt:q?.bt,isP:!!(q&&'outs' in q)}; } /* 경기 당시 이름·손잡이(박스스코어 기준): 이름을 바꾸거나 리그를 떠나도 한 경기 화면끼리 같게(검수 11-08) */
function mdTeamPanel(g,side){const tid=side==='h'?g.home:g.away;return `<aside class="md-team-panel md-panel" style="--md-team:${cTeamCol(tid)}"><header>${badge(tid,20)}<b>${esc(tshort(tid))}</b><span id="md-role-${side}"></span></header><div class="md-mini-field" id="md-field-${side}"></div><div class="md-lineup" id="md-lineup-${side}"></div><div class="md-team-note" id="md-pitcher-${side}"></div></aside>`;}
function mdMiniField(g,side,s){
  const T=s.teams[side],tid=side==='h'?g.home:g.away;
  const players=T.lineup.filter(x=>x.pos!=='DH'&&CFP[x.pos]);if(T.pitcher)players.push({id:T.pitcher,pos:'P'});
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 94 L4 48 Q50 -7 96 48 Z" class="mini-grass"/><path d="M50 84 L72 63 L50 42 L28 63 Z" class="mini-dirt"/><path d="M50 84 L64 63 L50 50 L36 63 Z" class="mini-grass"/><path d="M50 84 L4 39 M50 84 L96 39" class="mini-line"/></svg>${players.map(x=>{const p=mdPlayer(g,x.id),pt=CFP[x.pos];return `<button class="md-mini-player${x.id===s.batter?' current':''}" data-a="castPlayer" data-v="${x.id}" style="left:${pt[0]}%;top:${pt[1]*.8+5}%" title="${esc((POSS[x.pos]||'투수')+' '+p.name)}">${G.players[x.id]?avImg(p):'<span class="av ini">?</span>'}<b>${esc(p.name)}</b><i>${x.pos}</i></button>`;}).join('')}`;
}
/* 라인업 보강(사용자 11-16, OOTP 라인업 참고): 타석 방향, 시즌 타율·홈런, 오늘 기록. 현재 타자는 강조(기존) */
function mdSeasonBat(id){ try{ const h=curLine(G.players[id]); return h&&h.ab?`${fmt3(bRate(h).avg)} · ${h.hr||0}홈런`:'-'; }catch(e){ return '-'; } }
function mdLineup(g,side,s){return s.teams[side].lineup.map((x,i)=>{const p=mdPlayer(g,x.id),r=s.players[x.id]||{ab:0,h:0},active=x.id===s.batter,hand=p.bt==='좌'?'좌':p.bt==='양'?'양':'우';return `<button class="md-lineup-row${active?' current':''}" data-a="castPlayer" data-v="${x.id}"><i>${i+1}</i><span>${esc(p.name)}</span><em>${hand} · ${x.pos}</em><small>${mdSeasonBat(x.id)}</small><b>${r.ab}타수 ${r.h}안타</b></button>`;}).join('');}
/* 불펜(사용자 11-16, OOTP 불펜 위젯 참고): 1군 구원 투수와 이 시점까지 등판 여부. 경기 뒤 일을 미리 알려 주지 않도록 지금 장면까지 나온 투수만 '등판'으로 표시한다 */
function mdBullpen(g,side,s){ try{ const tid=side==='h'?g.home:g.away, seen=new Set((s.teams[side].pitchers||[]).concat(s.teams[side].pitcher?[s.teams[side].pitcher]:[])); const L=(typeof actOf==='function'?actOf(tid):[]).filter(p=>p.isP&&!isSPr(p)); if(!L.length)return ''; const latest=(G.games||[])[0]===g&&!/차전$/.test(g.kind||''); /* 등판일(lastApp·prevApp)은 지금 값이라 가장 최근 경기에서만 정확하다 */
  const rest=p=>{ if(!latest)return null; const last=p.lastApp===g.day?p.prevApp:p.lastApp; if(last==null)return {t:'휴식 충분',c:''}; const d=g.day-last; if(d<=1){ const prev=p.lastApp===g.day?null:p.prevApp; return {t:prev!=null&&last-prev<=1?'이틀 연속 등판':'어제 등판',c:'r'}; } return {t:d>=4?'휴식 충분':`휴식 ${d-1}일`,c:d===2?'y':''}; }; /* 이 경기 전 마지막 등판 기준 */
  return `<div class="md-pen"><b>불펜</b>${L.slice(0,9).map(p=>{ const r=rest(p); return `<button data-a="castPlayer" data-v="${p.id}" class="${seen.has(p.id)?'used':''}"><span>${esc(p.name)}</span><em>${p.th==='좌'?'좌':'우'}</em>${r?`<small class="md-rest ${r.c}">${r.t}</small>`:''}</button>`; }).join('')}</div>`; }catch(e){ return ''; } }
function mdStats(g,s){const A=s.teams.a.stats,H=s.teams.h.stats;return [['h','안타'],['hr','홈런'],['bb','볼넷'],['so','삼진'],['sb','도루'],['e','실책']].map(([k,l])=>{const total=A[k]+H[k],pct=total?A[k]/total*100:50;return `<div class="md-stat-row"><b>${A[k]}</b><span>${l}<i><em style="width:${pct}%;background:${mdColor(g,'a')}"></em><em style="width:${100-pct}%;background:${mdColor(g,'h')}"></em></i></span><b>${H[k]}</b></div>`;}).join('');}
function mdEvents(g,s){const E=s.events.slice(-5).reverse();return E.length?E.map(e=>`<button class="md-event" data-a="castEvent" data-v="${e.i}"><i>${cHalfTxt(e.half)}</i><b>${esc(mdPlayer(g,e.id).name)}</b><span>${e.type==='PC'?'투수 교체':e.type==='SB'?'도루':e.type==='CS'?'도루 실패':e.label||OUTK[e.type]||e.type}${e.runs?' · '+e.runs+'점':''}</span></button>`).join(''):'<p class="md-empty">주요 장면이 생기면 여기에 표시됩니다.</p>';}
function mdHitBars(g,s){const N=Math.max(9,Math.floor(s.state.half/2)+1),max=Math.max(1,...s.teams.a.hits.filter(Number.isFinite),...s.teams.h.hits.filter(Number.isFinite));return `<div class="md-hit-bars">${Array.from({length:N},(_,i)=>`<div><span><i style="height:${(s.teams.a.hits[i]||0)/max*100}%;background:${mdColor(g,'a')}"></i><i style="height:${(s.teams.h.hits[i]||0)/max*100}%;background:${mdColor(g,'h')}"></i></span><b>${i+1}</b></div>`).join('')}</div><div class="md-legend"><span><i style="background:${mdColor(g,'a')}"></i>${esc(tshort(g.away))}</span><span><i style="background:${mdColor(g,'h')}"></i>${esc(tshort(g.home))}</span></div>`;}
function mdFlowChart(g,s,probability){
  const H=s.history,n=Math.max(1,H[H.length-1].i),max=probability?1:Math.max(1,...H.flatMap(x=>[x.sa,x.sh]));
  const X=x=>28+x.i/n*300,Y=v=>116-v/max*94;
  const line=(key,color)=>`<polyline fill="none" stroke="${color}" stroke-width="2" points="${H.map(x=>X(x).toFixed(1)+','+Y(x[key]).toFixed(1)).join(' ')}"/>`;
  return `<svg class="md-chart" viewBox="0 0 350 142" role="img" aria-label="${probability?'상황 기반 홈 승리 확률 추정':'중계 진행에 따른 실제 누적 득점'}">${[0,.5,1].map(t=>`<line x1="28" x2="328" y1="${Y(max*t)}" y2="${Y(max*t)}" class="grid"/><text x="22" y="${Y(max*t)+3}" text-anchor="end">${probability?Math.round(t*100)+'%':+(max*t).toFixed(1)}</text>`).join('')}${probability?line('wp',mdColor(g,'h')):line('sa',mdColor(g,'a'))+line('sh',mdColor(g,'h'))}<text x="28" y="136">시작</text><text x="328" y="136" text-anchor="end">현재</text></svg>`;
}
function mdScoreLine(g,s){const N=Math.max(9,Math.floor(s.state.half/2)+1);return `<table><thead><tr><th>구단</th>${Array.from({length:N},(_,i)=>`<th>${i+1}</th>`).join('')}<th>R</th><th>H</th><th>E</th></tr></thead><tbody>${['a','h'].map(side=>{const T=s.teams[side],tid=side==='a'?g.away:g.home;return `<tr><th>${esc(tshort(tid))}</th>${Array.from({length:N},(_,i)=>{const entered=2*i+(side==='h'?1:0)<=s.state.half;return `<td>${s.finished&&g.line?.[side]?(g.line[side][i]??''):entered?T.innings[i]||0:'–'}</td>`; /* 끝난 경기는 박스스코어와 같은 줄 점수(치르지 않은 9회말 X, 검수 11-09zu) */}).join('')}<td class="runs">${side==='a'?s.state.sa:s.state.sh}</td><td>${T.stats.h}</td><td>${T.stats.e}</td></tr>`;}).join('')}</tbody></table>`;}
/* 오늘 승리 확률 기여(사용자 11-16: 평점 제도가 없으니 승리 확률 기여로). 지금 장면까지만. +는 초록, -는 빨강 */
function mdWpa(v){ if(v==null||Math.abs(v)<.005)return '<em class="md-wpa z">±0.00</em>'; const t=(v>0?'+':'−')+Math.abs(v).toFixed(2); return `<em class="md-wpa ${v>0?'p':'n'}" title="오늘 승리 확률 기여 ${t} (지금 장면까지)">${t}</em>`; }
function mdRoster(g,s,side){
  const W=typeof wpaUpTo==='function'?wpaUpTo(g,s.k):{};
  const T=s.teams[side],roster=[...T.lineup];if(T.pitcher)roster.push({id:T.pitcher,pos:'P'});
  return roster.map((x,i)=>{const p=mdPlayer(g,x.id),r=s.players[x.id]||{ab:0,h:0,outs:0,so:0},pitch=x.pos==='P',active=x.id===s.batter||pitch&&side!==s.attack;return `<button class="md-roster-player${active?' current':''}" data-a="castPlayer" data-v="${x.id}"><span class="md-roster-pos">${pitch?'현재 투수':i+1+'번 · '+x.pos}</span>${G.players[x.id]?avImg(p):'<span class="av ini">?</span>'}<b>${esc(p.name)}</b><small>${pitch?ipStr(r.outs)+'이닝 · '+r.so+'K':r.ab+'타수 '+r.h+'안타'} ${mdWpa(W[x.id])}</small></button>`;}).join('');
}
/* 3D 화면 좌우 상시 카드(사용자 11-16, OOTP·FM 참고): 왼쪽 현재 타자, 오른쪽 현재 투수. 사진·이름·타순/포지션·시즌 성적·오늘 기록·능력치, 투수는 체력 막대 */
/* 경기 전 시즌 성적(사용자 11-17: 기본 시즌 성적부터). 경기 기록의 pre(이 경기 직전 시즌 누계)를 쓴다: 지금 시즌 누계는 이 경기·그 뒤 경기까지 섞여 결과가 보인다.
   pre가 없으면(가을야구·옛 기록) 현재 시즌 누계로 대신하고 '시즌'이라고만 적는다 */
function cSeasonCells(g,id,pitch){ let q=null; for(const sd of ['h','a']){ const L=(g.box&&g.box[sd]&&g.box[sd][pitch?'pit':'bat'])||[]; q=q||L.find(x=>x.id===id); }
  let t=null, pre=false; if(q&&Array.isArray(q.pre)){ const K=pitch?['outs','er','h','bb','hbp','so','hr']:['pa','ab','h','d','tr','hr','bb','hbp','so','sf']; t={}; K.forEach((k,i)=>t[k]=q.pre[i]||0); pre=true; }
  else { const h=typeof curLine==='function'?curLine(G.players[id]):null; if(h)t=h; }
  if(!t)return null;
  if(pitch){ const o=t.outs||0; return {pre,cells:[['평균자책',o?(t.er*27/o).toFixed(2):'-'],['이닝',ipStr(o)],['WHIP',o?((t.h+t.bb)*3/o).toFixed(2):'-'],['삼진',t.so||0]]}; }
  const ab=t.ab||0, obpD=ab+(t.bb||0)+(t.hbp||0)+(t.sf||0), obp=obpD?(t.h+(t.bb||0)+(t.hbp||0))/obpD:0, slg=ab?(t.h+(t.d||0)+2*(t.tr||0)+3*(t.hr||0))/ab:0;
  return {pre,cells:[['타율',ab?fmt3(t.h/ab):'-'],['홈런',t.hr||0],['출루율',obpD?fmt3(obp):'-'],['OPS',ab?fmt3(obp+slg):'-']]}; }
function cRow(k,v,cls){ return v?`<dt>${esc(k)}</dt><dd${cls?` class="${cls}"`:''}>${v}</dd>`:''; }
function mdFaces(g,s,shown=s){ if(s.finished||!s.batter)return ''; const pid=s.teams[s.attack==='a'?'h':'a'].pitcher;
  const card=(id,pitch)=>{ if(!id)return ''; const p=mdPlayer(g,id), r=shown.players[id]||{ab:0,h:0,outs:0,so:0,bb:0}, slot=s.teams[s.attack].lineup.findIndex(x=>x.id===id)+1, row=s.teams[s.attack].lineup.find(x=>x.id===id), total=pitch?cPitchTotalBefore(g,shown.k,id):null, no=G.players[id]&&typeof jno==='function'?jno(G.players[id]):null, starter=(g.box&&g.box[s.attack==='a'?'h':'a']?.pit?.[0]?.id)===id;
    const sub=pitch?`${p.th==='좌'?'좌완':'우완'} · ${DELIVERY_LABEL[pitchDelivery(p)]||''}`:`${slot?slot+'번 · ':''}${row?POSK[row.pos]||row.pos:''} · ${p.bt==='좌'?'좌타':p.bt==='양'?'양타':'우타'}`;
    const w=typeof wpaUpTo==='function'?wpaUpTo(g,shown.k)[id]:null, vs=pitch?(G.players[s.batter]?.bt==='좌'?'좌':'우'):(G.players[pid]?.th==='좌'?'좌':'우');
    const SC=cSeasonCells(g,id,pitch), season=SC?`<div class="cf-season" title="${SC.pre?'이번 시즌, 이 경기 전까지':'이번 시즌'}">${SC.cells.map(([k,v])=>`<span><small>${k}</small><b>${v}</b></span>`).join('')}</div>`:'';
    const today=pitch?`${ipStr(r.outs)}이닝 · ${r.so}삼진${total!=null?' · '+total+'구':''}`:`${r.ab}타수 ${r.h}안타${r.bb?' · 볼넷 '+r.bb:''}`;
    let rows='';
    if(!pitch){ const m=cMatchup(g,shown.k,id,pid), S=cSplits(g,shown.k,s.batter,pid);
      if(m){ const rr=m.rec; rows+=cRow('이 투수',rr?`${m.src==='season'?'시즌 ':'최근 '+rr.n+'경기 '}${rr[1]}타수 ${rr[2]}안타${rr[3]?' · '+rr[3]+'홈런':''}${rr[5]?' · '+rr[5]+'삼진':''}${m.today.length?` <span class="cf-m">(오늘 ${esc(m.today.join('·'))})</span>`:''}`:`${m.src==='season'?'시즌 첫 대결':'대결 기록 없음'}${m.today.length?` <span class="cf-m">(오늘 ${esc(m.today.join('·'))})</span>`:''}`); } const edge=m?` · <b class="${m.edge==='b'?'up':'dn'}">${m.edge==='b'?'타자 유리':'투수 유리'}</b>`:'';
      for(const t of S.bat){ if(/^득점권/.test(t))rows+=cRow('득점권',esc(t.replace(/^득점권\s*/,''))); else rows+=cRow(t.split(' 상대')[0]+' 상대',esc(t.replace(/^\S+ 상대\s*/,''))+edge); } /* 상성(유리·불리)은 좌우 상대 줄에 붙인다(카드 높이를 투수와 같게) */
      if(edge&&!S.bat.some(t=>/ 상대/.test(t)))rows+=cRow(`${G.players[pid]?.th==='좌'?'좌':'우'}투 상대`,esc(m.txt)+edge);
    } /* 타구 방향·유형은 뺐다(사용자 11-17: 타자 정보가 과하다) */
    else { const S=cSplits(g,shown.k,s.batter,pid), M=cPitchMix(g,shown.k,id);
      for(const t of S.pit)rows+=cRow(t.split(' 상대')[0]+' 상대',esc(t.replace(/^\S+ 상대\s*/,'')));
      if(M){ for(const q of M.rows.slice(0,2))rows+=cRow(q.t,`${q.n}구 · 스트 ${q.sp}% · ${q.v}km/h`); if(M.trend&&M.trend.d<=-2)rows+=cRow('구속',`${esc(M.trend.t)} ${M.trend.a} → ${M.trend.b}km/h`,M.trend.d<=-2?'dn':''); } }
    const al=pitch?cAlertChips(cPitchAlerts(g,shown.k,id,s.state&&s.state.half,starter)):'';
    const tm=pitch?(s.attack==='a'?'h':'a'):s.attack; /* 팀 패널과 같은 쪽: 원정 선수는 왼쪽, 홈 선수는 오른쪽(사용자 11-17) */
    return `<button class="cs-face ${tm==='a'?'l':'r'} ${pitch?'pit':'bat'}" style="--tc:${cTeamCol(tm==='a'?g.away:g.home)}" data-a="castPlayer" data-v="${id}"><span class="cs-face-ph">${G.players[id]?avImg(p):''}</span><span class="cs-face-tx"><i>${pitch?'투수':'타자'}${no!=null?' · #'+no:''}</i><b>${esc(p.name)}</b><em>${esc(sub)}</em></span>${al?`<span class="cf-al">${al}</span>`:''}
      <span class="cf-body">${season}<div class="cf-today"><i>오늘</i><span>${esc(today)}</span>${mdWpa(w)}</div>${rows?`<dl class="cf-rows">${rows}</dl>`:''}${mdDuelMore(g,id,pitch,vs,total,pitch&&starter)}</span></button>`; };
  return card(s.batter,false)+card(pid,true); }
/* 감독 운영(사용자 11-16): 경기 기록에 남는 감독 결정(투수 교체·도루 시도·희생번트)과 그 결과를 승리 확률 기여로. 지금 장면까지만.
   투수 교체는 바뀐 투수가 그 뒤로 막은 기여, 도루·번트는 그 장면의 기여. 대타·고의사구는 기록에 없어 다루지 않는다 */
function mdMgrEvents(g,upTo){ const L=g.pbp||[], D=typeof wpaDeltas==='function'?wpaDeltas(g):[], at=new Map(D.map(r=>[r[0],r])), W=typeof wpaUpTo==='function'?wpaUpTo(g,upTo):{}, out=[];
  const cur={a:g.box.a?.pit?.[0]?.id??null,h:g.box.h?.pit?.[0]?.id??null};
  for(let k=0;k<Math.min(upTo,L.length);k++){ const x=L[k], top=x[0]%2===0, def=top?'h':'a', off=top?'a':'h', inn=cHalfTxt(x[0]);
    if(x[1]==='PC'){ const old=cur[def]; cur[def]=x[2]; out.push({side:def,inn,kind:'투수 교체',text:`${old?mdPlayer(g,old).name+' → ':''}${mdPlayer(g,x[2]).name}`,w:W[x[2]]??0,note:'교체 뒤 기여'}); }
    else if(x[1]==='SB'||x[1]==='CS'){ const r=at.get(k); out.push({side:off,inn,kind:x[1]==='SB'?'도루 성공':'도루 실패',text:mdPlayer(g,x[2]).name,w:r?r[3]:0}); }
    else if(typeof x[1]==='number'&&(x[3]==='SAC'||x[16])){ const r=at.get(k); out.push({side:off,inn,kind:x[16]?'번트 실패':'희생번트',text:mdPlayer(g,x[1]).name,w:r?r[3]:0}); } }
  return out; }
function mdMgr(g,s){ if(!g.box)return ''; const E=mdMgrEvents(g,s.k), name=side=>{ const tid=side==='h'?g.home:g.away, m=G.mgr&&G.mgr[tid]; return `${esc(tshort(tid))}${m&&m.name?' · '+esc(m.name)+' 감독':''}`; };
  const sum=side=>E.filter(e=>e.side===side).reduce((a,e)=>a+e.w,0), row=e=>`<li style="--tc:${cTeamCol(e.side==='h'?g.home:g.away)}"><i>${e.inn}</i><b>${e.kind}</b><span>${esc(e.text)}</span>${mdWpa(e.w)}</li>`;
  return `<button class="cs-mgr-h" data-a="castMgr" aria-expanded="${castPref('mgr')}">감독 운영 ${castPref('mgr')?'▾':'▴'}</button><div class="cs-mgr-sum">${['a','h'].map(sd=>`<span style="--tc:${cTeamCol(sd==='h'?g.home:g.away)}">${name(sd)} <em>${E.filter(e=>e.side===sd).length}건</em> ${mdWpa(sum(sd))}</span>`).join('')}</div><ol class="cs-mgr-list">${E.length?E.slice(-6).reverse().map(row).join(''):'<li class="z">아직 감독 결정이 없습니다</li>'}</ol>`; }
function castDashboardUpdate(g,k){
  if(!document.querySelector('.match-dashboard'))return;
  const s=castSnapshot(g,k),c=UI.cast;
  for(const side of ['a','h']){const T=s.teams[side];mdSet('md-role-'+side,s.finished?'종료':side===s.attack?'공격':'수비');mdSet('md-field-'+side,mdMiniField(g,side,s));mdSet('md-lineup-'+side,mdLineup(g,side,s));mdSet('md-pitcher-'+side,`${s.legacy?'이전 기록 · 위치 일부 참고 · ':''}마운드 <b>${T.pitcher?esc(mdPlayer(g,T.pitcher).name):'기록 없음'}</b>${mdBullpen(g,side,s)}`);}
  mdSet('md-ticker',mdTicker(g,s));  mdSet('md-stats',mdStats(g,s));mdSet('md-events',mdEvents(g,s));mdSet('md-hits',mdHitBars(g,s));mdSet('md-flow',mdFlowChart(g,s,false));mdSet('md-prob',mdFlowChart(g,s,true));mdSet('md-linescore',mdScoreLine(g,s));
  mdSet('cs-vs',mdDuel(g,s,c?.completed===k?castSnapshot(g,k+1):s));mdSet('cs-faces',mdFaces(g,s,c?.completed===k?castSnapshot(g,k+1):s));mdSet('cs-mgr',mdMgr(g,s));
  const team=c?.team||((g.away===G.user)?'a':'h'),roster=document.getElementById('md-roster');if(roster)roster.dataset.team=team;mdSet('md-roster',mdRoster(g,s,team));
  document.querySelectorAll('[data-a="castTeam"]').forEach(b=>b.classList.toggle('on',b.dataset.v===team));
  const last=s.k?pbpCall(g,s.k-1):null;mdSet('md-comment',last?`<span>캐스터</span><b>${esc(last.c)}</b>`:'<span>경기 중계</span><b>플레이볼을 기다립니다.</b>');
  const range=document.getElementById('md-seek');if(range)range.value=s.k;mdSet('md-progress',s.k+' / '+(g.pbp||[]).length+' 장면');
  mdSet('md-status',s.finished?(g.hs===g.as?'경기 종료 · 무승부':'경기 종료'):cHalfTxt(s.state.half)+' · '+s.state.outs+'아웃');
}
/* 투수 체력(사용자 11-16, OOTP 체력 막대 참고): 스카우트 평가 스태미나로 정한 한도 대비 남은 비율. 선발·구원 한도는 엔진과 같은 식(PW.l0·ls, 구원 18+0.3×스태미나)에 조금 여유를 둔다 */
function cStamCap(pid,starter){ const p=G.players[pid]; if(!p)return null; let sta=45; try{ const grp=(detailOf(p,scoutReport(p)).groups||[]).find(x=>x[0]==='투구'), it=grp&&grp[1].find(r=>/^스태미나/.test(r[0])); if(it&&typeof it[1]==='number')sta=it[1]; }catch(e){} return Math.round(starter?PW.l0+sta*PW.ls+12:18+sta*.3+8); }
function cStam(g,pid,pc,starter){ if(pc==null)return null; const cap=cStamCap(pid,starter); if(!cap)return null; return clamp(1-pc/cap,0,1); }
/* 투수 상태 경고(사용자 11-16, 교체 판단을 숫자로): 지금 장면 전까지의 기록만 본다. 빨강=위험, 노랑=주의. 최대 3개 */
function cPitchAlerts(g,k,pid,half,starter){ if(!pid||!g.pbp)return []; let bf=0,pc=0,ir=0,iob=0,ipc=0,ibf=0,pcOk=true;
  for(let i=0;i<Math.min(k,g.pbp.length);i++){ const x=g.pbp[i]; if(typeof x[1]!=='number'||x[2]!==pid)continue; bf++; const seq=storedPitchSequence(x), n=seq?seq.length:0; if(!seq)pcOk=false; pc+=n;
    if(x[0]===half){ ibf++; ipc+=n; ir+=x[6]||0; if(['1B','2B','3B','HR','BB','HBP'].includes(x[3]))iob++; } }
  const A=[], stam=pcOk?cStam(g,pid,pc,starter):null;
  const cap=pcOk?cStamCap(pid,starter):null; if(cap&&pc>cap)A.push(['r',`예상 한계 +${pc-cap}구`]); /* 한계를 넘겨 던지면 얼마나 넘겼는지(감독의 투수 운용을 판단하게, 사용자 11-16) */
  else if(stam!=null&&stam<=.15)A.push(['r',`체력 ${Math.round(stam*100)}%`]); else if(stam!=null&&stam<=.3)A.push(['y',`체력 ${Math.round(stam*100)}%`]);
  if(ir>=3)A.push(['r',`이번 이닝 ${ir}실점`]); else if(ir===2)A.push(['y','이번 이닝 2실점']);
  if(iob>=3&&ir<3)A.push([iob>=4?'r':'y',`이번 이닝 ${iob}명 출루`]);
  if(pcOk&&ipc>=25)A.push([ipc>=35?'r':'y',`이번 이닝 ${ipc}구`]);
  if(starter&&bf>=18)A.push(['y',`타순 ${bf>=27?'네':'세'} 바퀴째`]);
  return A.slice(0,3); }
/* 타자·투수 맞대결(사용자 11-16): 좌우 상성, 이번 시즌 맞대결(b.vs에서 이 경기와 그 뒤 경기 몫을 뺀 값. 뺄 기록이 없으면 최근 경기 기록), 오늘 앞선 대결 결과 */
const MU_RES={K:'삼진',BB:'볼넷',HBP:'사구','1B':'안타','2B':'2루타','3B':'3루타',HR:'홈런',DP:'병살',SAC:'희생번트'};
function cMatchup(g,k,bid,pid){ const b=G.players[bid], p=G.players[pid]; if(!b||!p)return null; const today=[];
  for(let i=0;i<Math.min(k,(g.pbp||[]).length);i++){ const x=g.pbp[i]; if(typeof x[1]==='number'&&x[1]===bid&&x[2]===pid)today.push(MU_RES[x[3]]||(x[13]?'희생플라이':'범타')); }
  const ps=q=>/차전$/.test(q.kind||''), add=(a,x)=>{ const noAB=x[3]==='BB'||x[3]==='HBP'||x[3]==='SAC'||!!x[13]; a[0]++; if(!noAB)a[1]++; if(['1B','2B','3B','HR'].includes(x[3]))a[2]++; if(x[3]==='HR')a[3]++; if(x[3]==='BB'||x[3]==='HBP')a[4]++; if(x[3]==='K')a[5]++; };
  let rec=null, src='season';
  const row=b.vs&&b.vs.y===G.year&&b.vs.m&&b.vs.m[pid];
  if(row&&!ps(g)){ const sub=[0,0,0,0,0,0]; let ok=true; for(const q of G.games||[]){ if(ps(q)||!(q===g||q.day>=g.day))continue; if(!q.pbp){ ok=false; break; } for(const x of q.pbp)if(typeof x[1]==='number'&&x[1]===bid&&x[2]===pid)add(sub,x); } /* 이 경기와 그 뒤 경기 몫을 뺀다: 결과를 미리 보여 주지 않게 */ if(ok){ const r=row.map((v,i)=>Math.max(0,v-sub[i])); if(r[0])rec=r; } else src='recent'; }
  else if(row&&ps(g)&&row[0]) rec=row.slice(); /* 가을야구: 정규시즌 맞대결 전체(가을야구 경기는 b.vs에 들어가지 않는다) */
  if(src==='recent'){ const a=[0,0,0,0,0,0]; let n=0; for(const q of G.games||[]){ if(q===g||!q.pbp||!(q.day<g.day))continue; const before=a[0]; for(const x of q.pbp)if(typeof x[1]==='number'&&x[1]===bid&&x[2]===pid)add(a,x); if(a[0]>before)n++; } if(a[0])rec=a; rec&&(rec.n=n); }
  const bh=b.bt==='양'?(p.th==='좌'?'우':'좌'):b.bt, edge=bh!==p.th?'b':'p';
  return {today,rec,src,edge,txt:`${b.bt==='양'?'양타':bh+'타'} vs ${p.th}투`}; }
/* 시즌 스플릿(사용자 11-16, OOTP Splits 참고): 저장된 시즌 누계(spl)에서 이 경기의 지금 장면 뒤 몫과 그 뒤 경기 몫을 뺀다. 뺄 기록이 없으면 보여 주지 않는다.
   행: [타석, 타수, 안타, 루타, 볼넷, 삼진, 홈런, 사구, 희생번트] */
function cSplitRow(g,k,who,key,pred){ const S=who.spl&&who.spl.y===G.year&&who.spl[key]; if(!S||/차전$/.test(g.kind||''))return null; const sub=[0,0,0,0,0,0,0,0,0];
  const add=(x,a)=>{ const o=x[3], tb={'1B':1,'2B':2,'3B':3,HR:4}[o]||0, noAB=o==='BB'||o==='HBP'||o==='SAC'||!!x[13]; a[0]++; if(!noAB)a[1]++; if(tb){a[2]++;a[3]+=tb;} if(o==='BB')a[4]++; if(o==='K')a[5]++; if(o==='HR')a[6]++; if(o==='HBP')a[7]++; if(o==='SAC')a[8]++; };
  for(const q of G.games||[]){ if(/차전$/.test(q.kind||'')||!(q===g||q.day>=g.day))continue; if(!q.pbp)return null; q.pbp.forEach((x,i)=>{ if(typeof x[1]!=='number'||q===g&&i<k)return; if(pred(q,x,i))add(x,sub); }); }
  const r=S.map((v,i)=>Math.max(0,(v||0)-(sub[i]||0))); return r[0]?r:null; }
function cSplitTxt(r,minAB){ if(!r||r[1]<minAB)return null; const avg=r[2]/r[1], obpD=r[0]-(r[8]||0), obp=obpD?(r[2]+r[4]+(r[7]||0))/obpD:0, slg=r[3]/r[1]; return {avg:fmt3(avg),ops:fmt3(obp+slg),ab:r[1]}; }
function cSplits(g,k,bid,pid){ const b=G.players[bid], p=G.players[pid]; if(!b||!p)return {bat:[],pit:[]}; const bat=[], pit=[];
  const ph=p.th==='좌'?'L':'R', bs=b.bt==='양'?(p.th==='좌'?'R':'L'):(b.bt==='좌'?'L':'R');
  const hv=r=>{ const t=cSplitTxt(r,10); return t; };
  const v1=hv(cSplitRow(g,k,b,ph,(q,x)=>x[1]===bid&&G.players[x[2]]?.th===p.th)); if(v1)bat.push(`${p.th}투 상대 ${v1.avg} · OPS ${v1.ops}`);
  if(g.pbp&&g.pbp[k]&&typeof g.pbp[k][1]==='number'){ const st=cBefore(g,k); if(st.bases[1]||st.bases[2]){ const rs=cSplitTxt(cSplitRow(g,k,b,'RS',(q,x,i)=>{ if(x[1]!==bid)return false; const s0=cBefore(q,i); return !!(s0.bases[1]||s0.bases[2]); }),5); if(rs)bat.push(`득점권 ${rs.avg} (${rs.ab}타수)`); } }
  const v2=hv(cSplitRow(g,k,p,bs,(q,x)=>{ if(x[2]!==pid)return false; const bb=G.players[x[1]]; if(!bb)return false; const sd=bb.bt==='양'?(p.th==='좌'?'R':'L'):(bb.bt==='좌'?'L':'R'); return sd===bs; })); if(v2)pit.push(`${bs==='L'?'좌':'우'}타 상대 피안타율 ${v2.avg} · 피OPS ${v2.ops}`);
  return {bat,pit}; }
function cMatchupHtml(m){ if(!m)return ''; const r=m.rec; return `<span class="cs-mu"><i class="${m.edge}">${esc(m.txt)} · ${m.edge==='b'?'타자 유리':'투수 유리'}</i>${r?`<i title="${m.src==='season'?'이번 시즌, 이 경기 전까지':'경기 기록이 남은 최근 경기'}">${m.src==='season'?'시즌':'최근 '+r.n+'경기'} ${r[1]}타수 ${r[2]}안타${r[3]?' '+r[3]+'홈런':''}${r[4]?' '+r[4]+'볼넷':''}${r[5]?' '+r[5]+'삼진':''}</i>`:`<i>${m.src==='season'?'시즌 첫 대결':'대결 기록 없음'}</i>`}${m.today.length?`<i>오늘 ${esc(m.today.join('·'))}</i>`:''}</span>`; }
/* 투수 오늘 구종(사용자 11-16, OOTP 투구 기록 참고): 지금 장면 전까지 던진 공을 구종별로 세고 스트라이크 비율·평균 구속, 직구(투심) 구속이 처음 15구보다 최근 15구에서 얼마나 변했는지 */
const MIX_BALL={'볼':1,'볼넷':1,'몸에 맞는 공':1};
function cPitchMix(g,k,pid){ const P=[]; for(let i=0;i<Math.min(k,(g.pbp||[]).length);i++){ const x=g.pbp[i]; if(typeof x[1]!=='number'||x[2]!==pid)continue; const seq=storedPitchSequence(x); if(!seq)return null; P.push(...seq); } if(!P.length)return null;
  const M={}; for(const q of P){ const m=M[q.t]||(M[q.t]={t:q.t,n:0,s:0,v:0}); m.n++; if(!MIX_BALL[q.res])m.s++; m.v+=q.v; }
  const rows=Object.values(M).sort((a,b)=>b.n-a.n).map(m=>({t:m.t,n:m.n,sp:Math.round(m.s/m.n*100),v:Math.round(m.v/m.n)}));
  const fbT=['직구','투심'].map(t=>M[t]).filter(Boolean).sort((a,b)=>b.n-a.n)[0], fb=fbT?P.filter(q=>q.t===fbT.t):[];
  let trend=null; if(fb.length>=20){ const avg=a=>a.reduce((s,q)=>s+q.v,0)/a.length, a=avg(fb.slice(0,15)), b=avg(fb.slice(-15)); trend={t:fbT.t,a:Math.round(a),b:Math.round(b),d:Math.round((b-a)*10)/10}; }
  return {rows,trend,n:P.length}; }
function cMixHtml(m){ if(!m)return ''; return `<span class="cs-mix">${m.rows.slice(0,3).map(r=>`<i title="${esc(r.t)} ${r.n}구 · 스트라이크 ${r.sp}% · 평균 ${r.v}km/h"><b>${esc(r.t)}</b> ${r.n}구 · S ${r.sp}% · ${r.v}km/h</i>`).join('')}${m.trend?`<i class="tr ${m.trend.d<=-2?'dn':''}">${esc(m.trend.t)} 구속 처음 ${m.trend.a} → 최근 ${m.trend.b}km/h${m.trend.d<=-2?' ↓':''}</i>`:''}</span>`; }
/* 타구 성향(사용자 11-16, OOTP 스프레이 차트 참고): 시즌 타구 구역(spr.z)·유형(spr.t). 이 경기 몫을 정확히 뺄 수 없어 가장 최근 경기에서만, 20타구 이상일 때 */
function cSprayTxt(g,bid,pid){ const b=G.players[bid], p=G.players[pid]; if(!b||!p||(G.games||[])[0]!==g)return []; const S=b.spr&&b.spr.y===G.year?b.spr:null; if(!S)return [];
  const Z=S.z||{}, n=k=>(Z[k]||[0])[0], left=n('LF')+n('3B')+n('SS'), mid=n('CF'), right=n('RF')+n('1B')+n('2B'), tot=left+mid+right; const out=[];
  if(tot>=20){ const side=b.bt==='양'?(p.th==='좌'?'R':'L'):(b.bt==='좌'?'L':'R'), pull=side==='R'?left:right, oppo=side==='R'?right:left, pc=v=>Math.round(v/tot*100); out.push(`타구 당겨 ${pc(pull)} · 가운데 ${pc(mid)} · 밀어 ${pc(oppo)}%`); }
  const T=S.t||{}, tt=Object.values(T).reduce((a,x)=>a+x[0],0); if(tt>=20){ const q=k=>Math.round(((T[k]||[0])[0])/tt*100); out.push(`땅볼 ${q('GB')} · 뜬공 ${q('FB')+q('PU')} · 라인 ${q('LD')}%`); }
  return out; }
function cAlertChips(A){ return A.length?`<span class="cs-alerts">${A.map(([l,t])=>`<i class="${l}">${esc(t)}</i>`).join('')}</span>`:''; }
function cStamBar(left,cls){ if(left==null)return ''; const pct=Math.round(left*100); return `<span class="${cls||'md-stam'}" title="체력 ${pct}%"><i style="width:${pct}%;background:${left>.5?'#5fcf8a':left>.25?'#e7c55a':'#e9675d'}"></i></span>`; }
/* 대결 카드 보강(사용자 11-16, OOTP 타자·투수 카드 참고): 시즌 성적 한 줄, 핵심 능력치 셋(상대 투수·타자 손에 맞춘 상대 능력치 포함), 투수는 투구 수로 줄어드는 체력 막대. 능력치는 선수 상세 화면과 같은 스카우트 평가 값 */
function mdDuelMore(g,id,pitch,vs,pc,starter){ try{ const p=G.players[id]; if(!p)return ''; const grp=detailOf(p,scoutReport(p)).groups||[], val=(gn,re)=>{ const gp=grp.find(x=>x[0]===gn); const it=gp&&gp[1].find(r=>re.test(r[0])); return it&&typeof it[1]==='number'?(typeof dv==='function'?dv(Math.round(it[1])):Math.round(it[1])):null; };
  const h=typeof curLine==='function'?curLine(p):null; let season='시즌 기록 없음';
  if(h){ const yr=`${h.y}${h.lvl==='퓨처스'?' 2군':''}`; if(pitch){ const r=pRate(h); season=`${yr} ERA ${h.outs?r.era.toFixed(2):'-'} · ${ipStr(h.outs)}이닝 · ${h.w||0}승 ${h.l||0}패`; } else { const r=bRate(h); season=`${yr} 타율 ${h.ab?fmt3(r.avg):'-'} · ${h.hr||0}홈런 · OPS ${h.pa?fmt3(r.ops):'-'}`; } }
  const vsL=vs==='좌', R=pitch?[['구위',val('투구',/^구위/)],['제구',val('투구',/^제구/)],[vsL?'좌타 상대':'우타 상대',val('투구',vsL?/좌타자 상대/:/우타자 상대/)]]:[['컨택',val('타격',/^컨택/)],['파워',val('타격',/홈런 파워/)],[vsL?'좌투 상대':'우투 상대',val('타격',vsL?/좌투수 상대/:/우투수 상대/)]];
  const rates=R.filter(x=>x[1]!=null).map(([k,v])=>`<em style="--c:${typeof rcol==='function'?rcol(v):'#fff'}">${k} <b>${v}</b></em>`).join('');
  const bar=pitch?cStamBar(cStam(g,id,pc,starter)):'';
  return `<span class="md-duel-more"><small>${esc(season)}</small><span class="md-duel-rt">${rates}</span>${bar}</span>`; }catch(e){ return ''; } }
function mdDuel(g,s,shown=s){
  if(s.finished)return `<div class="md-final"><b>${g.hs===g.as?'무승부':esc(tshort(g.hs>g.as?g.home:g.away))+' 승리'} · ${g.as}:${g.hs}</b><button class="btn small" data-a="castBox">박스스코어</button></div>`;
  const pid=s.teams[s.attack==='a'?'h':'a'].pitcher;
  return [[s.batter,'현재 타자',false],[pid,'현재 투수',true]].filter(x=>x[0]).map(([id,label,pitch])=>{const p=mdPlayer(g,id),r=shown.players[id]||{ab:0,h:0,outs:0,so:0},slot=s.teams[s.attack].lineup.findIndex(x=>x.id===id)+1,total=pitch?cPitchTotalBefore(g,shown.k,id):null;return `<button class="md-duel-player" data-a="castPlayer" data-v="${id}">${G.players[id]?avImg(p):''}<span><i>${label} · ${pitch?(p.th==='좌'?'좌완':'우완')+' · '+DELIVERY_LABEL[pitchDelivery(p)]:(slot?slot+'번 · ':'')+(p.bt==='좌'?'좌타':p.bt==='양'?'양타':'우타')}</i><b>${esc(p.name)}</b><small>${pitch?ipStr(r.outs)+'이닝 · '+r.so+'K · <em id="cs-pitcher-count">'+(total==null?'투구 수 미기록':total+'구')+'</em>':'오늘 '+r.ab+'타수 '+r.h+'안타'}</small>${!pitch?cMatchupHtml(cMatchup(g,shown.k,id,pid)):''}${(()=>{ const S=cSplits(g,shown.k,s.batter,pid), L=pitch?S.pit:S.bat.concat(cSprayTxt(g,s.batter,pid)); return L.length?`<span class="cs-mu cs-spl">${L.map(t=>`<i>${esc(t)}</i>`).join('')}</span>`:''; })()}${pitch?cMixHtml(cPitchMix(g,shown.k,id)):''}${pitch?cAlertChips(cPitchAlerts(g,shown.k,id,s.state&&s.state.half,(g.box&&g.box[s.attack==='a'?'h':'a']?.pit?.[0]?.id)===id)):''}${mdDuelMore(g,id,pitch,pitch?G.players[s.batter]?.bt==='좌'?'좌':'우':G.players[pid]?.th==='좌'?'좌':'우',total,pitch&&((g.box&&g.box[s.attack==='a'?'h':'a']?.pit?.[0]?.id)===id))}</span>${!pitch?'<span class="ab-res" id="cs-abr"></span>':''}</button>`;}).join('')+(()=>{ try{ const b=G.players[s.batter], p=G.players[pid]; if(!b||!p)return ''; const st=s.state||{}; const t=cStory(g,s.k,b,p,!!(st.bases&&(st.bases[1]||st.bases[2]))); return t?`<div class="ab-story md-story">${t}</div>`:''; }catch(e){ return ''; } })();
}

function mdDuelResult(g,k){if(UI.cast)UI.cast.completed=k;const before=castSnapshot(g,k),after=castSnapshot(g,k+1);mdSet('cs-vs',mdDuel(g,before,after));mdSet('cs-faces',mdFaces(g,before,after));}

/* 타구장 소식(경기 화면 연출 11-11): 같은 날 다른 구장 점수를 우리 경기 진행 이닝까지만 보여 준다. 우리 경기가 끝나면 최종 점수 */
function mdTicker(g,s){ const O=g.others||[]; if(!O.length)return ''; const fin=s.finished, n=fin?99:Math.floor(((s.state&&s.state.half)||0)/2);
  const sum=(L,m)=>(L||[]).slice(0,m).reduce((a,v)=>a+(+v||0),0);
  const items=O.map(o=>{ const len=Math.max((o.lh||[]).length,(o.la||[]).length), m=Math.min(n,len), done=fin||m>=len&&len>0; const ra=sum(o.la,m), rh=sum(o.lh,m);
    return `<span class="mdt-g${m===0?' pre':''}"><b>${esc(tshort(o.a))}</b><em>${m?ra:'-'}</em><i>:</i><em>${m?rh:'-'}</em><b>${esc(tshort(o.h))}</b><small>${done?'종료':m?m+'회':'경기 전'}</small></span>`; }).join('');
  return `<span class="mdt-h">타구장</span><div class="mdt-l">${items}</div>`; }
/* 결정적 순간(경기 화면 연출 11-11): 역전·동점·끝내기·만루 홈런·8회 이후 1점 차 득점권 위기 탈출(삼진·병살 또는 주자 둘 이상)이면 구장 위에 장면 카드를 잠깐 띄운다. 재생 중 실제로 그 타석이 끝났을 때만(되감기·건너뛰기에는 띄우지 않음) */
function cClutchOf(g,k){ const m=pcMoment(g,k), x=m.x; if(!x||typeof x[1]!=='number')return null; const res=x[3];
  const bName=pcName(g,x[1]), pName=pcName(g,x[2]); const sc=`${tshort(g.away)} ${x[7]} : ${x[8]} ${tshort(g.home)}`;
  if(m.walkoff)return {t:'끝내기!',s:`${bName} · ${sc}`,tid:m.team,big:1};
  if(res==='HR'&&m.pre.bases.every(Boolean))return {t:'만루 홈런!',s:`${bName} · ${sc}`,tid:m.team,big:1};
  if(m.before<0&&m.after>0)return {t:'역전!',s:`${bName} · ${sc}`,tid:m.team,big:m.inn>=7?1:0};
  if(m.before<0&&m.after===0&&m.inn>=6)return {t:'동점!',s:`${bName} · ${sc}`,tid:m.team};
  if(m.inn>=8&&m.risp&&Math.abs(m.before)<=1&&!m.runs&&(res==='K'||res==='DP'||m.pre.bases.filter(Boolean).length>=2)){ const nb=g.pbp.slice(k+1).find(r=>typeof r[1]==='number'); const ended=!nb||nb[0]!==x[0]; if(ended&&['K','DP','OUT'].includes(res)){ const def=m.top?g.home:g.away; return {t:m.pre.bases.every(Boolean)?'만루 위기 탈출!':'위기 탈출!',s:`${pName} · ${res==='K'?'삼진으로':res==='DP'?'병살로':'범타로'} 이닝 종료`,tid:def}; } }
  return null; }
function cClutch(g,k){ const c=cClutchOf(g,k); if(!c)return; const st=document.getElementById('cs-stage'); if(!st)return; st.querySelectorAll('.md-clutch').forEach(e=>e.remove());
  const el=document.createElement('div'); el.className='md-clutch'+(c.big?' big':''); el.style.setProperty('--cl',cTeamCol(c.tid)); el.setAttribute('role','status');
  el.innerHTML=`<span class="mdc-tm">${badge(c.tid,22)} ${esc(tshort(c.tid))}</span><b>${esc(c.t)}</b><span class="mdc-s">${esc(c.s)}</span>`; st.appendChild(el);
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),450); },c.big?2600:1900); }
