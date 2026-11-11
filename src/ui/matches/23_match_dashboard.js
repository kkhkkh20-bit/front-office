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
function mdLineup(g,side,s){return s.teams[side].lineup.map((x,i)=>{const p=mdPlayer(g,x.id),r=s.players[x.id]||{ab:0,h:0},active=x.id===s.batter;return `<button class="md-lineup-row${active?' current':''}" data-a="castPlayer" data-v="${x.id}"><i>${i+1}</i><span>${esc(p.name)}</span><em>${x.pos}</em><b>${r.ab}타수 ${r.h}안타</b></button>`;}).join('');}
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
function mdRoster(g,s,side){
  const T=s.teams[side],roster=[...T.lineup];if(T.pitcher)roster.push({id:T.pitcher,pos:'P'});
  return roster.map((x,i)=>{const p=mdPlayer(g,x.id),r=s.players[x.id]||{ab:0,h:0,outs:0,so:0},pitch=x.pos==='P',active=x.id===s.batter||pitch&&side!==s.attack;return `<button class="md-roster-player${active?' current':''}" data-a="castPlayer" data-v="${x.id}"><span class="md-roster-pos">${pitch?'현재 투수':i+1+'번 · '+x.pos}</span>${G.players[x.id]?avImg(p):'<span class="av ini">?</span>'}<b>${esc(p.name)}</b><small>${pitch?ipStr(r.outs)+'이닝 · '+r.so+'K':r.ab+'타수 '+r.h+'안타'}</small></button>`;}).join('');
}
function castDashboardUpdate(g,k){
  if(!document.querySelector('.match-dashboard'))return;
  const s=castSnapshot(g,k),c=UI.cast;
  for(const side of ['a','h']){const T=s.teams[side];mdSet('md-role-'+side,s.finished?'종료':side===s.attack?'공격':'수비');mdSet('md-field-'+side,mdMiniField(g,side,s));mdSet('md-lineup-'+side,mdLineup(g,side,s));mdSet('md-pitcher-'+side,`${s.legacy?'이전 기록 · 위치 일부 참고 · ':''}마운드 <b>${T.pitcher?esc(mdPlayer(g,T.pitcher).name):'기록 없음'}</b>`);}
  mdSet('md-ticker',mdTicker(g,s));  mdSet('md-stats',mdStats(g,s));mdSet('md-events',mdEvents(g,s));mdSet('md-hits',mdHitBars(g,s));mdSet('md-flow',mdFlowChart(g,s,false));mdSet('md-prob',mdFlowChart(g,s,true));mdSet('md-linescore',mdScoreLine(g,s));
  mdSet('cs-vs',mdDuel(g,s,c?.completed===k?castSnapshot(g,k+1):s));
  const team=c?.team||((g.away===G.user)?'a':'h'),roster=document.getElementById('md-roster');if(roster)roster.dataset.team=team;mdSet('md-roster',mdRoster(g,s,team));
  document.querySelectorAll('[data-a="castTeam"]').forEach(b=>b.classList.toggle('on',b.dataset.v===team));
  const last=s.k?pbpCall(g,s.k-1):null;mdSet('md-comment',last?`<span>캐스터</span><b>${esc(last.c)}</b>`:'<span>경기 중계</span><b>플레이볼을 기다립니다.</b>');
  const range=document.getElementById('md-seek');if(range)range.value=s.k;mdSet('md-progress',s.k+' / '+(g.pbp||[]).length+' 장면');
  mdSet('md-status',s.finished?(g.hs===g.as?'경기 종료 · 무승부':'경기 종료'):cHalfTxt(s.state.half)+' · '+s.state.outs+'아웃');
}
function mdDuel(g,s,shown=s){
  if(s.finished)return `<div class="md-final"><b>${g.hs===g.as?'무승부':esc(tshort(g.hs>g.as?g.home:g.away))+' 승리'} · ${g.as}:${g.hs}</b><button class="btn small" data-a="castBox">박스스코어</button></div>`;
  const pid=s.teams[s.attack==='a'?'h':'a'].pitcher;
  return [[s.batter,'현재 타자',false],[pid,'현재 투수',true]].filter(x=>x[0]).map(([id,label,pitch])=>{const p=mdPlayer(g,id),r=shown.players[id]||{ab:0,h:0,outs:0,so:0},slot=s.teams[s.attack].lineup.findIndex(x=>x.id===id)+1,total=pitch?cPitchTotalBefore(g,shown.k,id):null;return `<button class="md-duel-player" data-a="castPlayer" data-v="${id}">${G.players[id]?avImg(p):''}<span><i>${label} · ${pitch?(p.th==='좌'?'좌완':'우완')+' · '+DELIVERY_LABEL[pitchDelivery(p)]:(slot?slot+'번 · ':'')+(p.bt==='좌'?'좌타':p.bt==='양'?'양타':'우타')}</i><b>${esc(p.name)}</b><small>${pitch?ipStr(r.outs)+'이닝 · '+r.so+'K · <em id="cs-pitcher-count">'+(total==null?'투구 수 미기록':total+'구')+'</em>':'오늘 '+r.ab+'타수 '+r.h+'안타'}</small></span>${!pitch?'<span class="ab-res" id="cs-abr"></span>':''}</button>`;}).join('');
}

function mdDuelResult(g,k){if(UI.cast)UI.cast.completed=k;const before=castSnapshot(g,k),after=castSnapshot(g,k+1);mdSet('cs-vs',mdDuel(g,before,after));}

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
