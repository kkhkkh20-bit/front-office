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
  const init=side=>({lineup:castLineup(g,side,n),pitcher:g.box[side].pit[0]?.id??null,pitchers:g.box[side].pit[0]?[g.box[side].pit[0].id]:[],next:0,innings:[],hits:[],stats:{r:0,h:0,hr:0,bb:0,so:0,sb:0,cs:0,e:0}});
  const teams={a:init('a'),h:init('h')},players={},events=[],history=[{i:0,half:0,sa:0,sh:0,wp:wpHome({sa:0,sh:0,outs:0,bases:[0,0,0],half:0})}];
  let half=-1,outs=0;
  const bat=id=>players[id]||(players[id]={ab:0,h:0,hr:0,bb:0,so:0,outs:0,sb:0,cs:0});
  for(let i=0;i<n;i++){
    const x=L[i],atk=x[0]%2?'h':'a',def=atk==='h'?'a':'h',T=teams[atk],D=teams[def],inn=Math.floor(x[0]/2);
    if(half!==x[0]){half=x[0];outs=0;}
    if(x[1]==='PC'){D.pitcher=x[2];if(!D.pitchers.includes(x[2]))D.pitchers.push(x[2]);events.push({i,half,type:'PC',id:x[2]});continue;}
    if(x[1]==='SB'||x[1]==='CS'){T.stats[x[1]==='SB'?'sb':'cs']++;bat(x[2])[x[1]==='SB'?'sb':'cs']++;if(D.pitcher)bat(D.pitcher).outs+=Math.max(0,x[3]-outs);outs=x[3];events.push({i,half,type:x[1],id:x[2]});continue;}
    if(typeof x[1]!=='number')continue;
    const B=bat(x[1]),P=bat(x[2]);D.pitcher=x[2];if(!D.pitchers.includes(x[2]))D.pitchers.push(x[2]);
    if(x[3]!=='BB'&&x[3]!=='SAC'&&!x[13])B.ab++;
    if(['1B','2B','3B','HR'].includes(x[3])){B.h++;T.stats.h++;T.hits[inn]=(T.hits[inn]||0)+1;P.h++;}
    if(x[3]==='HR'){B.hr++;T.stats.hr++;P.hr++;}
    if(x[3]==='BB'){B.bb++;T.stats.bb++;P.bb++;}
    if(x[3]==='K'){B.so++;T.stats.so++;P.so++;}
    if(x[9])D.stats.e++;
    P.outs+=Math.max(0,x[4]-outs);outs=x[4];
    T.innings[inn]=(T.innings[inn]||0)+(x[6]||0);teams.a.stats.r=x[7];teams.h.stats.r=x[8];
    const slot=g.box[atk].bat.find(b=>b.id===x[1])?.o??T.lineup.findIndex(b=>b.id===x[1]);if(slot>=0)T.next=(slot+1)%9;
    if(x[6]||['HR','2B','3B','DP'].includes(x[3]))events.push({i,half,type:x[3],id:x[1],runs:x[6]||0});
    const st={sa:x[7],sh:x[8],half:x[4]>=3?x[0]+1:x[0],outs:x[4]>=3?0:x[4],bases:x[4]>=3?[0,0,0]:x[5]};
    history.push({i:i+1,half:x[0],sa:x[7],sh:x[8],wp:wpHome(st)});
  }
  const state=n?cBefore(g,n):{sa:0,sh:0,outs:0,bases:[0,0,0],half:L[0]?.[0]||0};
  if(finished){state.sa=g.as;state.sh=g.hs;state.bases=[0,0,0];history[history.length-1].wp=g.hs===g.as?.5:g.hs>g.as?1:0;}
  const attack=state.half%2?'h':'a';
  return {k:n,finished,state,teams,players,events,history,attack,batter:finished?null:teams[attack].lineup[teams[attack].next]?.id??null,legacy:!g.box.h.lineup||!g.box.a.lineup};
}
const mdColor=(g,side)=>side==='a'?'#75b5df':'#69c69b';
function mdSet(id,html){const el=document.getElementById(id);if(el&&el._mdHtml!==html){el.innerHTML=html;el._mdHtml=html;}}
function mdPlayer(g,id){return G.players[id]||{id,name:[...g.box.h.bat,...g.box.a.bat,...g.box.h.pit,...g.box.a.pit].find(p=>p.id===id)?.n||'기록 선수'};}
function mdTeamPanel(g,side){const tid=side==='h'?g.home:g.away;return `<aside class="md-team-panel md-panel" style="--md-team:${cTeamCol(tid)}"><header>${badge(tid,20)}<b>${esc(tshort(tid))}</b><span id="md-role-${side}"></span></header><div class="md-mini-field" id="md-field-${side}"></div><div class="md-lineup" id="md-lineup-${side}"></div><div class="md-team-note" id="md-pitcher-${side}"></div></aside>`;}
function mdMiniField(g,side,s){
  const T=s.teams[side],tid=side==='h'?g.home:g.away;
  const players=T.lineup.filter(x=>x.pos!=='DH'&&CFP[x.pos]);if(T.pitcher)players.push({id:T.pitcher,pos:'P'});
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 94 L4 48 Q50 -7 96 48 Z" class="mini-grass"/><path d="M50 84 L72 63 L50 42 L28 63 Z" class="mini-dirt"/><path d="M50 84 L64 63 L50 50 L36 63 Z" class="mini-grass"/><path d="M50 84 L4 39 M50 84 L96 39" class="mini-line"/></svg>${players.map(x=>{const p=mdPlayer(g,x.id),pt=CFP[x.pos];return `<button class="md-mini-player${x.id===s.batter?' current':''}" data-a="castPlayer" data-v="${x.id}" style="left:${pt[0]}%;top:${pt[1]*.8+5}%" title="${esc((POSS[x.pos]||'투수')+' '+p.name)}">${G.players[x.id]?avImg(p):'<span class="av ini">?</span>'}<b>${esc(p.name)}</b><i>${x.pos}</i></button>`;}).join('')}`;
}
function mdLineup(g,side,s){return s.teams[side].lineup.map((x,i)=>{const p=mdPlayer(g,x.id),r=s.players[x.id]||{ab:0,h:0},active=x.id===s.batter;return `<button class="md-lineup-row${active?' current':''}" data-a="castPlayer" data-v="${x.id}"><i>${i+1}</i><span>${esc(p.name)}</span><em>${x.pos}</em><b>${r.ab}타수 ${r.h}안타</b></button>`;}).join('');}
function mdStats(g,s){const A=s.teams.a.stats,H=s.teams.h.stats;return [['h','안타'],['hr','홈런'],['bb','볼넷'],['so','삼진'],['sb','도루'],['e','실책']].map(([k,l])=>{const total=A[k]+H[k],pct=total?A[k]/total*100:50;return `<div class="md-stat-row"><b>${A[k]}</b><span>${l}<i><em style="width:${pct}%;background:${mdColor(g,'a')}"></em><em style="width:${100-pct}%;background:${mdColor(g,'h')}"></em></i></span><b>${H[k]}</b></div>`;}).join('');}
function mdEvents(g,s){const E=s.events.slice(-5).reverse();return E.length?E.map(e=>`<button class="md-event" data-a="castEvent" data-v="${e.i}"><i>${cHalfTxt(e.half)}</i><b>${esc(mdPlayer(g,e.id).name)}</b><span>${e.type==='PC'?'투수 교체':e.type==='SB'?'도루':e.type==='CS'?'도루 실패':OUTK[e.type]||e.type}${e.runs?' · '+e.runs+'점':''}</span></button>`).join(''):'<p class="md-empty">주요 장면이 생기면 여기에 표시됩니다.</p>';}
function mdHitBars(g,s){const N=Math.max(9,Math.floor(s.state.half/2)+1),max=Math.max(1,...s.teams.a.hits.filter(Number.isFinite),...s.teams.h.hits.filter(Number.isFinite));return `<div class="md-hit-bars">${Array.from({length:N},(_,i)=>`<div><span><i style="height:${(s.teams.a.hits[i]||0)/max*70}px;background:${mdColor(g,'a')}"></i><i style="height:${(s.teams.h.hits[i]||0)/max*70}px;background:${mdColor(g,'h')}"></i></span><b>${i+1}</b></div>`).join('')}</div><div class="md-legend"><span><i style="background:${mdColor(g,'a')}"></i>${esc(tshort(g.away))}</span><span><i style="background:${mdColor(g,'h')}"></i>${esc(tshort(g.home))}</span></div>`;}
function mdFlowChart(g,s,probability){
  const H=s.history,n=Math.max(1,H[H.length-1].i),max=probability?1:Math.max(1,...H.flatMap(x=>[x.sa,x.sh]));
  const X=x=>28+x.i/n*300,Y=v=>116-v/max*94;
  const line=(key,color)=>`<polyline fill="none" stroke="${color}" stroke-width="2" points="${H.map(x=>X(x).toFixed(1)+','+Y(x[key]).toFixed(1)).join(' ')}"/>`;
  return `<svg class="md-chart" viewBox="0 0 350 142" role="img" aria-label="${probability?'상황 기반 홈 승리 확률 추정':'중계 진행에 따른 실제 누적 득점'}">${[0,.5,1].map(t=>`<line x1="28" x2="328" y1="${Y(max*t)}" y2="${Y(max*t)}" class="grid"/><text x="22" y="${Y(max*t)+3}" text-anchor="end">${probability?Math.round(t*100)+'%':+(max*t).toFixed(1)}</text>`).join('')}${probability?line('wp',mdColor(g,'h')):line('sa',mdColor(g,'a'))+line('sh',mdColor(g,'h'))}<text x="28" y="136">시작</text><text x="328" y="136" text-anchor="end">현재</text></svg>`;
}
function mdScoreLine(g,s){const N=Math.max(9,Math.floor(s.state.half/2)+1);return `<table><thead><tr><th>구단</th>${Array.from({length:N},(_,i)=>`<th>${i+1}</th>`).join('')}<th>R</th><th>H</th><th>E</th></tr></thead><tbody>${['a','h'].map(side=>{const T=s.teams[side],tid=side==='a'?g.away:g.home;return `<tr><th>${esc(tshort(tid))}</th>${Array.from({length:N},(_,i)=>{const entered=2*i+(side==='h'?1:0)<=s.state.half;return `<td>${entered?T.innings[i]||0:'–'}</td>`;}).join('')}<td class="runs">${side==='a'?s.state.sa:s.state.sh}</td><td>${T.stats.h}</td><td>${T.stats.e}</td></tr>`;}).join('')}</tbody></table>`;}
function mdRoster(g,s,side){
  const T=s.teams[side],roster=[...T.lineup];if(T.pitcher)roster.push({id:T.pitcher,pos:'P'});
  return roster.map((x,i)=>{const p=mdPlayer(g,x.id),r=s.players[x.id]||{ab:0,h:0,outs:0,so:0},pitch=x.pos==='P',active=x.id===s.batter||pitch&&side!==s.attack;return `<button class="md-roster-player${active?' current':''}" data-a="castPlayer" data-v="${x.id}"><span class="md-roster-pos">${pitch?'현재 투수':i+1+'번 · '+x.pos}</span>${G.players[x.id]?avImg(p):'<span class="av ini">?</span>'}<b>${esc(p.name)}</b><small>${pitch?ipStr(r.outs)+'이닝 · '+r.so+'K':r.ab+'타수 '+r.h+'안타'}</small></button>`;}).join('');
}
function castDashboardUpdate(g,k){
  if(!document.querySelector('.match-dashboard'))return;
  const s=castSnapshot(g,k),c=UI.cast;
  for(const side of ['a','h']){const T=s.teams[side];mdSet('md-role-'+side,s.finished?'종료':side===s.attack?'공격':'수비');mdSet('md-field-'+side,mdMiniField(g,side,s));mdSet('md-lineup-'+side,mdLineup(g,side,s));mdSet('md-pitcher-'+side,`${s.legacy?'이전 기록 · 위치 일부 참고 · ':''}마운드 <b>${T.pitcher?esc(mdPlayer(g,T.pitcher).name):'기록 없음'}</b>`);}
  mdSet('md-stats',mdStats(g,s));mdSet('md-events',mdEvents(g,s));mdSet('md-hits',mdHitBars(g,s));mdSet('md-flow',mdFlowChart(g,s,false));mdSet('md-prob',mdFlowChart(g,s,true));mdSet('md-linescore',mdScoreLine(g,s));
  mdSet('cs-vs',mdDuel(g,s));
  const team=c?.team||((g.away===G.user)?'a':'h'),roster=document.getElementById('md-roster');if(roster)roster.dataset.team=team;mdSet('md-roster',mdRoster(g,s,team));
  document.querySelectorAll('[data-a="castTeam"]').forEach(b=>b.classList.toggle('on',b.dataset.v===team));
  const last=s.k?pbpCall(g,s.k-1):null;mdSet('md-comment',last?`<span>캐스터</span><b>${esc(last.c)}</b>${last.a?`<small>${esc(last.a)}</small>`:''}`:'<span>경기 중계</span><b>플레이볼을 기다립니다.</b>');
  const range=document.getElementById('md-seek');if(range)range.value=s.k;mdSet('md-progress',s.k+' / '+(g.pbp||[]).length+' 장면');
  mdSet('md-status',s.finished?(g.hs===g.as?'경기 종료 · 무승부':'경기 종료'):cHalfTxt(s.state.half)+' · '+s.state.outs+'아웃');
}
function mdDuel(g,s){
  if(s.finished)return `<div class="md-final"><b>${g.hs===g.as?'무승부':esc(tshort(g.hs>g.as?g.home:g.away))+' 승리'} · ${g.as}:${g.hs}</b><button class="btn small" data-a="castBox">박스스코어</button></div>`;
  const pid=s.teams[s.attack==='a'?'h':'a'].pitcher;
  return [[s.batter,'이번 타자',false],[pid,'상대 투수',true]].filter(x=>x[0]).map(([id,label,pitch])=>{const p=mdPlayer(g,id),r=s.players[id]||{ab:0,h:0,outs:0,so:0};return `<button class="md-duel-player" data-a="castPlayer" data-v="${id}">${G.players[id]?avImg(p):''}<span><i>${label}</i><b>${esc(p.name)}</b><small>${pitch?ipStr(r.outs)+'이닝 · '+r.so+'K':r.ab+'타수 '+r.h+'안타'}</small></span>${!pitch?'<span class="ab-res" id="cs-abr"></span>':''}</button>`;}).join('');
}
