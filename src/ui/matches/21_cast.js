/* ---------- 그래픽 중계: 중계 기록을 필드 위 카드로 재생 ---------- */
const CFP={C:[50,97],'1B':[74,66],'2B':[62,50],SS:[38,50],'3B':[26,66],LF:[18,31],CF:[50,17],RF:[82,31],P:[50,72]};
const CBS=[[68,73],[50,56],[32,73]], CHM=[50,89], CBAT=[40,89], CBATL=[60,89], CDUG={h:[97,80],a:[3,80]};
/* 타석 위치: 우타자는 홈 왼쪽(3루 쪽), 좌타자는 오른쪽(1루 쪽). 양타는 투수 반대 손 */
function bSide(b,p){ if(!b)return 'R'; if(b.bt==='좌')return 'L'; if(b.bt==='양')return p&&p.th==='좌'?'R':'L'; return 'R'; }
const CPATH=[CHM,CBS[0],CBS[1],CBS[2],CHM];
let CT={tok:0,run:false};
const cSpd=()=>((UI.cast&&UI.cast.spd)||1)*1.3; /* 기본 재생을 1.3배 빠르게(사용자 요청 11-07) */
addEventListener('unhandledrejection',e=>{ if(e.reason==='stop')e.preventDefault(); }); /* 중계를 닫거나 건너뛸 때 멈춘 연출 대기는 오류가 아니다 */
function cSleep(ms){ const t=CT.tok; return new Promise((res,rej)=>setTimeout(()=>t===CT.tok?res():rej('stop'),ms/cSpd())); }
function cHalfTxt(h){ return `${Math.floor(h/2)+1}회${h%2?'말':'초'}`; }
function cPit(g,k){ const L=g.pbp; const par=L[Math.min(k,L.length-1)][0]%2;
  for(let i=Math.min(k,L.length)-1;i>=0;i--){ const y=L[i]; if(y[0]%2!==par)continue; if(y[1]==='PC'||typeof y[1]==='number')return y[2]; }
  for(let i=k;i<L.length;i++){ const y=L[i]; if(y[0]%2===par&&typeof y[1]==='number')return y[2]; } return null; }
function cBefore(g,k){ const L=g.pbp; if(k<=0)return {sa:0,sh:0,outs:0,bases:[0,0,0],half:L[0][0]};
  const s=pbpState(g,Math.min(k,L.length)-1); if(k<L.length&&L[k][0]!==s.half)return {sa:s.sa,sh:s.sh,outs:0,bases:[0,0,0],half:L[k][0]}; return s; }
function cFielders(g,half,k){ return castLineup(g,half%2===0?'h':'a',k??0).filter(x=>CFP[x.pos]&&x.pos!=='P'); }
function cCrowd(g){ let occ=0; try{ if(g.att&&g.cap)occ=g.att/g.cap; else{ const A=G.sea&&G.sea.att&&G.sea.att[g.home], cap=typeof stadCap==='function'?stadCap(g.home):0; if(A&&A.n&&cap)occ=A.sum/A.n/cap; } }catch(e){} return {home:cTeamCol(g.home),away:cTeamCol(g.away),occ:Math.round(Math.min(1,occ)*20)/20}; } /* 3D 관중: 팀 색·좌석 점유율(이 경기 기록이 없으면 올해 홈 평균) */
/* 타구 도착점을 파울선 안쪽으로 당긴다(사용자 11-13: 1·3루수 앞 땅볼·번트·실책 타구가 파울 지역에 떨어지는데 인플레이로 처리돼, 파울 타구를 놓쳤는데 세이프가 되는 것처럼 보였다).
   3D 좌표 변환(scene.mjs point)의 파울선: 내야(y>56)는 |x-50|=(89-y)*1.09, 외야는 *0.907 */
function cFair(pt,margin=1.6){ const lim=Math.max(0,(89-pt[1])*(pt[1]>56?1.09:.907)-margin), dx=pt[0]-50; return Math.abs(dx)>lim?[50+Math.sign(dx)*lim,pt[1]]:pt; }
function cTeamCol(tid){ const t=G.teams[tid]; return t?tpal(t)[3]:'#888'; }
/* 새 기록의 송구 아웃 목적지를 우선하고, 옛 기록은 베이스·득점 변화로 복원한다. */
function cRunnerMoves(g,k){const x=g.pbp[k];if(!x||typeof x[1]!=='number')return [];const before=cBefore(g,k),after=x[5],hr=x[3]==='HR',recorded=Array.isArray(x[14])?x[14]:[],moves=[];let scores=x[6]-(hr?1:0); let outsLeft=Math.max(0,(x[4]??0)-before.outs-(['OUT','K','SAC','DP'].includes(x[3])?1:0)); /* 이 플레이에서 실제로 늘어난 아웃만큼만 주자 아웃(끝내기에서 없던 주루사가 생기던 문제, 검수 11-08) */
  for(const r of before.bases.map((id,i)=>id?{id,i}:null).filter(Boolean).sort((a,b)=>b.i-a.i)){const m=recorded.find(m=>m.id===r.id),j=after.indexOf(r.id),from=r.i+1;if(m?.result==='out')moves.push({id:r.id,from,to:m.to,out:1});else if(j>=0&&j!==r.i)moves.push({id:r.id,from,to:j+1});else if(j<0){if(scores>0){scores--;moves.push({id:r.id,from,to:4,score:1});}else if(outsLeft>0){outsLeft--;moves.push({id:r.id,from,to:Math.min(4,r.i+2),out:1});}else moves.push({id:r.id,from,to:Math.min(3,r.i+2)});}}
  return moves;
}
/* 카드 배치: 키가 같은 카드는 이동, 없어진 카드는 사라지고 새 카드는 나타남 */
function cPlace(el,pt,ms){ if(ms>=250&&el.classList){ el.classList.add('mv'); clearTimeout(el._mvT); el._mvT=setTimeout(()=>el.classList.remove('mv'),ms/cSpd()); } el.style.transition=ms?`left ${ms/cSpd()}ms linear, top ${ms/cSpd()}ms linear, opacity .25s`:'none'; el.style.left=pt[0]+'%'; el.style.top=pt[1]+'%'; if(typeof Match3D!=='undefined'&&el.dataset?.k)Match3D.move(el.dataset.k,pt,ms/cSpd()); }
function cSync(T,ms){ const st=document.getElementById('cs-stage'); if(!st)return; st.querySelectorAll('.cc.gone').forEach(el=>el.remove()); const have={}; st.querySelectorAll('.cc').forEach(el=>have[el.dataset.k]=el);
  const keep={}; for(const t of T){ keep[t.k]=1; let el=have[t.k]; if(!el){ el=cCard(t.k,t.id,t.cls,t.lab,t.col,t); cPlace(el,t.from||t.pt,0); st.appendChild(el); if(t.from){ el.getBoundingClientRect(); cPlace(el,t.pt,ms||400); } }
    else { el.className='cc '+t.cls; cPlace(el,t.pt,ms); const kr=el.querySelector('.kr'); if(kr&&t.u){ const sig=JSON.stringify(t.u); if(kr.dataset.s!==sig){ kr.dataset.s=sig; kr.innerHTML=kPlayer({...t.u,v:el.dataset.v%5,rot:0}); } kr.style.transform=`rotate(${t.rot||0}deg)`; } const em=el.querySelector('em.cc-h'); if(em){ if(/[좌우][타투]/.test(t.lab||'')){ em.textContent=t.lab; em.className='cc-h '+(/좌/.test(t.lab)?'l':'r'); } else em.remove(); } } }
  for(const k in have)if(!keep[k])have[k].classList.add('gone'); }
function castSheet(){ const c=UI.cast; const g=G.games[c.g]; if(!g)return '';
  const stripes=[...Array(9)].map((_,i)=>`<path d="M50 89 L${-40+i*20} -20 L${-30+i*20} -20 Z" class="st"/>`).join('');
  const hc=cTeamCol(g.home), ac=cTeamCol(g.away); const day=[0,6].includes(dobj(g.day).w);
  const stadium=typeof MATCH_STADIUM_IMAGE==='string'?MATCH_STADIUM_IMAGE:null,skyline=hasAsset()?ASSET.stad[day?'city_day':'city_night']:null;
  const tower=(x,y)=>`<g class="tw"><circle cx="${x}" cy="${y}" r="9" class="glow"/><path d="M${x-.65} ${y+1}V${y+14}H${x+.65}V${y+1}M${x-.65} ${y+3}L${x+.65} ${y+6}L${x-.65} ${y+9}L${x+.65} ${y+12}" class="cs-mast"/><rect x="${x-3}" y="${y-1.6}" width="6" height="2.6" rx=".3" fill="#394a53"/>${Array.from({length:18},(_,i)=>`<rect x="${x-2.65+i%6*.88}" y="${y-1.2+Math.floor(i/6)*.74}" width=".66" height=".46" rx=".08" fill="#fff8d9"/>`).join('')}</g>`;
  const fieldBg=`<svg class="cs-bg${day?' day':''}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><clipPath id="cs-sky-cut"><rect width="100" height="35"/></clipPath>${stadium?`<pattern id="cs-crowd-art" patternUnits="userSpaceOnUse" width="25" height="50"><image href="${stadium}" width="25" height="50" preserveAspectRatio="none"/></pattern>`:""}<clipPath id="cs-stands"><path d="M-6 58 L-6 30 Q50 -38 106 30 L106 58 L99 43 Q50 -16 1 43 Z"/></clipPath><clipPath id="cs-fair"><path d="M50 92 L1 43 Q50 -16 99 43 Z"/></clipPath>
      <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">${day?'<stop offset="0" stop-color="#5d8fc0"/><stop offset=".45" stop-color="#9cc1e0"/><stop offset="1" stop-color="#1c3a26"/>':'<stop offset="0" stop-color="#03060a"/><stop offset=".45" stop-color="#0b1622"/><stop offset="1" stop-color="#0d1a12"/>'}</linearGradient>
      <linearGradient id="cs-grass" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="${day?'#579852':'#3b7950'}"/><stop offset=".5" stop-color="${day?'#367b43':'#275c3b'}"/><stop offset="1" stop-color="${day?'#255c36':'#1d422e'}"/></linearGradient>
      <linearGradient id="cs-earth" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="${day?'#d5ac7e':'#b79773'}"/><stop offset=".55" stop-color="${day?'#b98c60':'#97734e'}"/><stop offset="1" stop-color="${day?'#9b6e48':'#795b40'}"/></linearGradient>
      <linearGradient id="cs-wall-light" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#88b4c0"/><stop offset=".25" stop-color="#355b63"/><stop offset="1" stop-color="#173a40"/></linearGradient>
      <radialGradient id="cs-glw"><stop offset="0" stop-color="#fff7d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient></defs>
    <rect width="100" height="100" fill="#183e2a"/><rect width="100" height="40" fill="url(#cs-sky)"/>${skyline?`<image class="cs-sky-art" href="${skyline}" width="100" height="100" preserveAspectRatio="none" clip-path="url(#cs-sky-cut)"/>`:""}
    <path d="M-6 58 L-6 30 Q50 -38 106 30 L106 58 L99 43 Q50 -16 1 43 Z" class="stand"/>${stadium?`<path class="cs-stand-art" d="M-6 58 L-6 30 Q50 -38 106 30 L106 58 L99 43 Q50 -16 1 43 Z" fill="url(#cs-crowd-art)"/><g clip-path="url(#cs-stands)" stroke="#163641" stroke-width=".35" opacity=".45"><path d="M25 0V60M50 0V60M75 0V60"/></g>`:""}
    <rect x="38" y="1.2" width="24" height="8" rx=".8" class="sb"/><rect x="39.2" y="2.4" width="21.6" height="5.6" class="sbi"/><text x="50" y="6.6" class="sbt">${esc(tshort(g.away))} : ${esc(tshort(g.home))}</text>
    ${day?'':tower(6,10)+tower(94,10)+tower(24,-2)+tower(76,-2)}
    <path d="M50 100 L-5 45 L-5 100 Z M50 100 L105 45 L105 100 Z" class="foul"/><path d="M50 92 L1 43 Q50 -16 99 43 Z" class="g1"/>
    <g clip-path="url(#cs-fair)">${stripes}<path d="M1 43 Q50 -16 99 43" class="trk"/></g>
    <path d="M1 43 Q50 -16 99 43" class="wall-shadow"/><path d="M1 43 Q50 -16 99 43" class="wall"/>
    <path d="M24 74 Q50 32 76 74 L50 95 Z" class="dirt"/><path d="M50 86 L65 73 L50 59 L35 73 Z" class="g3"/>
    <circle cx="50" cy="72" r="2.8" class="dirt"/><circle cx="50" cy="89" r="4.2" class="dirt"/>
    <path d="M50 89 L2 41 M50 89 L98 41" class="line"/>
    <rect x="10" y="81" width="18" height="1.6" rx=".5" fill="${ac}" opacity=".25"/><rect x="72" y="81" width="18" height="1.6" rx=".5" fill="${hc}" opacity=".25"/>
    <path d="M50 89 L68 73 L50 56 L32 73 Z" class="path"/><rect x="48.6" y="71.6" width="2.8" height=".8" fill="#f4f6f8"/>
    <rect x="38" y="86.2" width="4.4" height="5.8" class="box"/><rect x="57.6" y="86.2" width="4.4" height="5.8" class="box"/><circle cx="31" cy="93" r="1.5" class="odc"/><circle cx="69" cy="93" r="1.5" class="odc"/>
    <line x1="1.5" y1="43.5" x2="1.5" y2="36" class="pole2"/><line x1="98.5" y1="43.5" x2="98.5" y2="36" class="pole2"/>
    ${CBS.map((b,i)=>`<rect id="cs-b${i}" x="${b[0]-1.7}" y="${b[1]-1.7}" width="3.4" height="3.4" transform="rotate(45 ${b[0]} ${b[1]})" class="base"/>`).join('')}<path d="M48.4 88 h3.2 v1.4 l-1.6 1.5 l-1.6 -1.5z" class="base"/></svg>`;
  const md=c.mode==='all'?'all':'hl'; /* 기본은 하이라이트, 득점권 모드는 없앴다 */
  return `<div class="cast match-dashboard" data-view="${c.view||'field'}" data-lineups="${castLineupsOpen()?'open':'closed'}" data-g="${c.g}" role="region" aria-label="경기 대시보드">
  <header class="cs-top"><div class="cs-board"><span class="cs-tm">${badge(g.away,26)}<i>${esc(tshort(g.away))}</i><b id="cs-sa">0</b></span><span class="cs-mid"><b id="cs-inn">1회초</b><span class="cs-cnt"><span id="cs-O"><i></i><i></i></span><em id="cs-on">0아웃</em></span></span><span class="cs-tm r"><b id="cs-sh">0</b><i>${esc(tshort(g.home))}</i>${badge(g.home,26)}</span></div>
    <div class="md-match-meta"><b id="md-status">경기 중계</b><span>${dstr(g.day)} · ${g.kind&&g.kind!=='노히트 도전'?esc(g.kind):'정규시즌'}</span></div>
    <div class="cs-mode">${[['hl','하이라이트'],['all','전체']].map(([k,l])=>`<button data-a="castMode" data-v="${k}" class="${md===k?'on':''}" aria-pressed="${md===k}">${l}</button>`).join('')}</div><button class="md-control md-play" data-a="castPlay" id="cs-play">${c.play&&!c.pre?'일시정지':'재생'}</button><button class="md-control" data-a="castSpd" id="cs-spd" title="재생 속도">${c.spd||1}배속</button><button class="md-control" data-a="castSnd" id="cs-snd" aria-pressed="${sndPref()}">${sndPref()?'소리 켬':'소리 끔'}</button><button class="md-control md-more-btn" data-a="castMore" aria-expanded="false">더보기</button><button class="md-control" data-a="castBox">박스스코어</button><button class="md-control" data-a="castExit">나가기</button><nav class="md-mobile-nav" aria-label="중계 화면">${[['field','경기'],['data','기록'],['teams','선수단']].map(([k,l])=>`<button data-a="castView" data-v="${k}" class="${(c.view||'field')===k?'on':''}">${l}</button>`).join('')}</nav></header>
  <div class="md-layout">${mdTeamPanel(g,'a')}<main class="md-center"><div class="md-top-grid"><section class="md-panel"><header><b>경기 기록</b><span>현재 시점</span></header><div id="md-stats"></div></section><section class="md-panel"><header><b>주요 장면</b><span>다시 보기</span></header><div id="md-events"></div></section><section class="md-panel"><header><b>안타 흐름</b><span>원정 / 홈</span></header><div id="md-hits"></div></section></div>
    <div class="md-play-grid"><section class="md-field-panel md-panel"><header><b>${esc(tshort(g.away))} vs ${esc(tshort(g.home))}</b><span>구장 중계</span></header><div class="md-field-body"><div class="cs-stage" id="cs-stage" data-renderer="pending"><button class="cs-board-view" data-a="castBoard">전광판 보기</button><button class="cs-lineup-view" data-a="castLineups" aria-pressed="${castLineupsOpen()}">${castLineupsOpen()?'라인업 접기':'라인업 보기'}</button><div id="cs-3d" class="cs-3d" data-state="pending"${c.pre?' data-pre="1"':''} aria-label="타자 뒤에서 보는 3D 경기장"><span class="cs-3d-status" role="status">선수들이 준비하고 있습니다 · 경기장 불러오는 중…</span>${matchPrepLineups(g)}<button class="cs-3d-retry" data-a="castRetry3d">3D 다시 시도</button></div>${fieldBg}<svg class="cs-trail" id="cs-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg><div class="cs-shd" id="cs-shd"></div><div class="cs-ball" id="cs-ball"></div><div class="cs-sit" id="cs-sit"></div><div class="cs-cap" id="cs-cap"></div><div class="cs-fx" id="cs-fx"></div><div class="cs-flash" id="cs-flash"></div><div class="cs-endcard" id="cs-endcard" hidden></div><div class="cs-bn" id="cs-bn"></div></div></div><div class="md-duel" id="cs-vs"></div></section>
    ${mdPitchDock()}<div class="md-charts"><section class="md-panel"><header><b>득점 흐름</b><span>실제 누적 득점</span></header><div id="md-flow"></div></section><section class="md-panel"><header><b>홈 승리 확률</b><span>상황 기반 추정</span></header><div id="md-prob"></div><div class="cs-wpw"><div class="cs-wp"><span class="wa" style="background:${mdColor(g,'a')}"></span><i id="cs-wpa" style="background:${mdColor(g,'h')}"></i><span class="cs-wpt" id="cs-wpt"></span></div></div></section></div></div></main>${mdTeamPanel(g,'h')}</div>
  <div class="md-ticker" id="md-ticker" aria-label="타구장 소식"></div><div class="md-comment" id="md-comment" aria-live="polite"></div><div class="md-linescore" id="md-linescore"></div>
  <section class="md-dugout"><div class="md-roster-label"><b>출전 선수</b><div>${[['a',g.away],['h',g.home]].map(([k,tid])=>`<button data-a="castTeam" data-v="${k}">${esc(tshort(tid))}</button>`).join('')}</div></div><div class="md-roster" id="md-roster"></div></section>
  <nav class="md-replay" aria-label="중계 재생"><button class="md-control" data-a="castStep" data-v="-1">이전 타석</button><button class="md-control" data-a="castStep" data-v="1">다음 타석</button><span id="md-progress"></span><input id="md-seek" data-a="castSeek" type="range" min="0" max="${g.pbp.length}" value="${c.k}" aria-label="재생 시점"><button class="md-control" data-a="castWin" title="지금 장면 다음에 나오는 득점 장면으로 건너뜁니다(결과는 미리 알려 주지 않습니다)">다음 득점</button></nav></div>`;
}
/* 필드 카드: 얼굴 + 이름 + 능력치 하나 */
function cCard(key,id,cls,lab,col,t){ const p=G.players[id]; const el=document.createElement('button'); el.className='cc '+cls; el.dataset.k=key; el.dataset.a='castPlayer'; el.dataset.v=id; el.style.setProperty('--tc',col);
  const ov=p&&/bat|pit/.test(cls)?scoutReport(p).cur:null; const u=(t&&t.u)||{S:col,D:'#0008'};
  el.innerHTML=`<span class="cc-f"><svg class="kp" viewBox="-24 -24 48 48" aria-hidden="true"><ellipse cx="1.5" cy="2.5" rx="15" ry="13" fill="#0004"/><g class="kr" data-s='${JSON.stringify(u)}' style="transform:rotate(${(t&&t.rot)||0}deg)">${kPlayer({...u,v:id%5,rot:0})}</g></svg>${ov!=null?`<b class="cc-o" style="--c:${rcol(ov)}">${dv(ov)}</b>`:''}</span><span class="cc-n">${esc(p?fname(p):'?')}</span>${/bat|pit/.test(cls)&&/[좌우][타투]/.test(lab||'')?`<em class="cc-h ${/좌/.test(lab)?'l':'r'}">${esc(lab)}</em>`:''}`; return el; }
/* 오늘 기록 */
function cToday(g,k,id,isP){ const L=g.pbp; let pa=0,ab=0,h=0,hr=0,rbi=0,bb=0,so=0,outs=0,r=0,bf=0,half=-1,o0=0,cp=null;
  for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(x[0]!==half){ half=x[0]; o0=0; }
    if(x[1]==='PC'){ cp=x[2]; continue; } if(x[1]==='SB'||x[1]==='CS'){ if(isP&&x[1]==='CS'&&cp===id)outs+=Math.max(0,x[3]-o0); o0=x[3]; continue; } if(typeof x[1]!=='number')continue; cp=x[2];
    if(isP&&Array.isArray(x[10]))r+=x[10].filter(z=>z===id).length;
    if(isP&&x[2]===id){ bf=(bf||0)+1; outs+=Math.max(0,x[4]-o0); if(!Array.isArray(x[10]))r+=x[6]; if(x[3]==='K')so++; if(x[3]==='BB')bb++; if(['1B','2B','3B','HR'].includes(x[3]))h++; }
    if(!isP&&x[1]===id){ pa++; if(x[3]!=='BB'&&x[3]!=='HBP'&&x[3]!=='SAC'&&!x[13])ab++; if(['1B','2B','3B','HR'].includes(x[3]))h++; if(x[3]==='HR')hr++; rbi+=x[12]!=null?x[12]:x[6]; }
    o0=x[4]; }
  if(isP)return outs||r||h||bf?`${Math.floor(outs/3)}${outs%3?'.'+outs%3:''}이닝 ${r}실점 ${so}K${bb?` ${bb}볼넷`:''}`:'첫 등판'; /* 상대한 타자가 있으면(볼넷만 줬어도) 첫 등판이 아니다 */
  return pa?`${ab}타수 ${h}안타${hr?` ${hr}홈런`:''}${rbi?` ${rbi}타점`:''}`:'오늘 첫 타석'; }
function cMan(g,k,id,isP){ const p=G.players[id]; if(!p)return ''; const ov=scoutReport(p).cur;
  const sea=isP?`ERA ${eraAt(g,k,id)}`:(()=>{ const r=batAt(g,k,id); if(!r)return '시즌 기록 없음'; return `${fmt3(r.avg)} · ${r.hr}홈런 · OPS ${fmt3(r.ops)}`; })();
  return `<button class="cs-p" data-a="castPlayer" data-v="${id}">${avImg(p)}<span class="cs-pm"><span class="cs-pr"><i>${isP?'투수':'타자'}</i><b>${esc(p.name)}</b>${rchip(ov)}</span><span class="cs-ps">${sea}</span><span class="cs-pd">오늘 ${cToday(g,k,id,isP)}</span></span></button>`; }
function cSide(g,k){ if(document.querySelector('.match-dashboard')){castDashboardUpdate(g,k);return;} const L=g.pbp; const v=document.getElementById('cs-vs'), lg=document.getElementById('cs-log'); if(!v)return; { const bd=document.querySelector('.cs-body'); if(bd)bd.classList.toggle('fin',k>=L.length); }
  const x=L[Math.min(k,L.length-1)]; const bid=k<L.length&&typeof x[1]==='number'?x[1]:null; const pid=cPit(g,Math.min(k,L.length-1));
  v.innerHTML=k>=L.length?(()=>{ const m=gameMvp(g); return `<div class="cs-fin"><div><b>경기 종료 · ${tshort(g.away)} ${g.as} : ${g.hs} ${tshort(g.home)}</b>${m?`<button class="mvp" data-a="castPlayer" data-v="${m.p.id}">${G.players[m.p.id]?avImg(m.p):''}<span><em>오늘의 선수</em><b>${esc(m.p.name)}</b><i>${m.p.isP?cToday(g,L.length,m.p.id,true):cToday(g,L.length,m.p.id,false)} · 승리 기여 +${Math.round(m.v*100)}%</i></span></button>`:''}</div><button class="btn small" data-a="castBox">박스스코어</button></div>${gmMemo(g)}`; })():ourStrip(g,k)+(bid?abPanel(g,k):(pid?cMan(g,k,pid,true):''));
  lg.innerHTML=L.slice(Math.max(0,k-8),k).reverse().map((y,i)=>{ const cl=pbpCall(g,k-1-i); return `<p class="${i===0?'cur':''}${y[6]?' run':''}"><span>${cHalfTxt(y[0])}</span>${esc(cl.c)}</p>`; }).join('')||'<p class="muted">플레이볼</p>'; }
function cSit(st,x){ const el=document.getElementById('cs-sit'); if(!el)return; const risp=!!(st.bases[1]||st.bases[2]); const late=st.half>=16&&Math.abs(st.sa-st.sh)<=2;
  const t=risp&&st.bases[0]&&st.bases[1]&&st.bases[2]?'만루 찬스':risp?'득점권 찬스':late?'승부처':''; el.textContent=t; el.className='cs-sit'+(t&&x&&typeof x[1]==='number'?' on':''); }
function cDraw(k,ms){ const boardButton=document.querySelector('.cs-board-view');if(boardButton)boardButton.textContent='전광판 보기'; CT.pitch=null; const c=UI.cast;c.completed=null; const g=G.games[c.g]; const L=g.pbp; const st=k>=L.length?{...pbpState(g,L.length-1),bases:[0,0,0]}:cBefore(g,k);
  const targets=k>=L.length?[]:cTargets(g,k,st); cSync(targets,ms); if(typeof Match3D!=='undefined')Match3D.sync({targets,crowd:cCrowd(g),away:tshort(g.away),home:tshort(g.home),sa:st.sa,sh:st.sh,inning:cHalfTxt(st.half),outs:st.outs,board:c3DScore(g,k,st)}); if(k>=L.length){ st.sa=g.as; st.sh=g.hs; } cBoard(g,st,null); cSide(g,k); cSit(st,L[k]); c.wp=k>=L.length?(g.hs===g.as?.5:g.hs>g.as?1:0):wpHome(st,wpMax(g)); try{ if(k>=L.length){ const bar=document.getElementById('cs-wpa'); if(bar)bar.style.width=(c.wp*100)+'%'; const tx=document.getElementById('cs-wpt'); if(tx)tx.textContent=g.hs===g.as?'무승부':`${tshort(g.hs>g.as?g.home:g.away)} 승리`; } else cWp(g,st,null); }catch(e){}
  cCap(c3DActive()?(k>=L.length?'경기가 끝났습니다':typeof L[k]?.[1]==='number'?'다음 투구를 준비합니다':'주루 상황을 확인합니다'):''); cPitchReset(g,k); cFx(''); cEndCard(g,k>=L.length); /* 경기가 끝나면 결과 카드 하나(점수·승리 팀·오늘의 선수·박스스코어·나가기)만 남긴다 */ const pb=document.getElementById('cs-play'); if(pb)pb.textContent=c.play&&!c.pre&&k<L.length?'일시정지':'재생'; }
/* PC 3D 중계: 좌우 라인업 칸(각 약 200px)은 기본으로 접어 3D 화면을 넓힌다. 펼침 여부는 이 브라우저에만 기억 */
function castLineupsOpen(){ try{ return localStorage.getItem('fo-cast-lineups')==='1'; }catch(e){ return false; } }
/* 경기 종료 카드: 예전에는 빈 구장 위에 '경기 종료' 큰 글씨·자막·빈 투구판·나가기 버튼이 따로 떠 있었다 */
/* 경기 결과 화면(사용자 11-13): 경기 전 선발 라인업 소개와 같은 틀. 머리글 + 구단색 패널 두 개(원정·홈) + 아래 해설·버튼 */
function cEndCard(g,on){ const el=document.getElementById('cs-endcard'); if(!el)return; const dash=el.closest('.match-dashboard'); if(dash)dash.classList.toggle('md-ended',!!on); el.hidden=!on; if(!on){ el.innerHTML=''; return; }
  const m=gameMvp(g), tie=g.hs===g.as, win=tie?null:g.hs>g.as?g.home:g.away, key=typeof gmKey==='function'?gmKey(g):{};
  const panel=side=>{ const tid=side==='a'?g.away:g.home, B=g.box[side], col=cTeamCol(tid), sc=side==='a'?g.as:g.hs, res=tie?'무승부':win===tid?'승리':'패배';
    const pos=new Map(castLineup(g,side,g.pbp.length).map(r=>[r.id,r.pos])), bats=B.bat.filter(x=>(x.ab||0)+(x.bb||0)+(x.hbp||0)+(x.sh||0)+(x.sf||0)>0).slice(0,10);
    const H=B.bat.reduce((n,x)=>n+(x.h||0),0), E=B.bat.reduce((n,x)=>n+(x.e||0),0);
    const dec=B.pit.find(q=>q.d==='승')||B.pit.find(q=>q.d==='패')||B.pit[0], sv=B.pit.find(q=>q.d==='세');
    const pl=q=>`${ipStr(q.outs)}이닝 ${q.r??q.er}실점 · 삼진 ${q.so}`;
    return `<div class="cs-pl" style="--tc:${col}"><header>${badge(tid,40)}<div><b>${esc(tname(tid))}</b><small>${side==='a'?'원정':'홈'} · ${res} · 안타 ${H} · 실책 ${E}</small></div><strong class="cs-rs">${sc}</strong></header><div class="cs-pl-h"><span>#</span><span>선수</span><span>포지션</span><span>타수</span><span>안타</span><span>타점</span></div><ol>${bats.map((x,i)=>`<li><i>${i+1}</i><b>${esc(G.players[x.id]?.name||x.n||'')}${x.hr?`<small>홈런${x.hr>1?' '+x.hr:''}</small>`:''}</b><span>${esc(POSK[pos.get(x.id)]||pos.get(x.id)||'')}</span><em>${x.ab||0}</em><em>${x.h||0}</em><em>${x.rbi||0}</em></li>`).join('')}</ol>${dec?`<div class="cs-pl-sp"><span>${dec.d==='승'?'승리투수':dec.d==='패'?'패전투수':'선발투수'}</span><b>${esc(G.players[dec.id]?.name||dec.n||'')}</b><em>${pl(dec)}${sv?` · 세이브 ${esc(sv.n)}`:''}</em></div>`:''}</div>`; };
  const talk=[tie?`${tshort(g.away)} ${g.as} : ${g.hs} ${tshort(g.home)}, 무승부로 끝났습니다.`:`${tshort(win)}이(가) ${Math.max(g.as,g.hs)} : ${Math.min(g.as,g.hs)}로 이겼습니다.`, key.gw?`결승 장면: ${key.gw}`:'', key.dec||''].filter(Boolean);
  el.innerHTML=`<div class="cs-prep cs-result" role="dialog" aria-label="경기 결과"><div class="cs-prep-heading"><b>경기 결과</b><span>${esc(stadName(g.home))} · ${dstr(g.day)}</span></div><div class="cs-prep-teams"><section class="cs-pcard cs-rcard">${panel('a')}${panel('h')}</section></div><div class="cs-prep-foot"><div class="cs-prep-talk"><span>해설</span>${talk.map(t=>`<p>${esc(t)}</p>`).join('')}${m?`<button class="cs-rmvp" data-a="castPlayer" data-v="${m.p.id}">${G.players[m.p.id]?avImg(m.p):''}<span><em>오늘의 선수</em><b>${esc(m.p.name)}</b><i>${cToday(g,g.pbp.length,m.p.id,!!m.p.isP)}</i></span></button>`:''}</div><div class="cs-prep-go"><button class="btn" data-a="castBox">박스스코어</button><button class="btn primary cs-prep-start cs-endbtn" id="cs-endbtn" data-a="castClose">나가기</button></div></div></div>`; }
/* 연출 */
function cFx(t,cls,stay){ if(t==='삼진')umpCall('스트라이크 아웃'); else if(/아웃$|병살$/.test(t||''))umpCall('아웃'); const el=document.getElementById('cs-fx'); if(!el)return; el.className='cs-fx'; void el.offsetWidth; if(!t){ el.textContent=''; return; } el.textContent=t; el.className='cs-fx on '+(cls||'')+(stay?' stay':''); el.style.animationDuration=(1.5/cSpd())+'s'; }
/* 홈런 축포: 구장 위 하늘에 폭죽 몇 발(사용자 피드백 11-06). 2.6초 뒤 스스로 지운다. 움직임 줄이기 설정이면 생략 */
function cFireworks(){ const st=document.getElementById('cs-stage'); if(!st||matchMedia('(prefers-reduced-motion: reduce)').matches)return; const cv=document.createElement('canvas'); cv.className='cs-fw'; const r=st.getBoundingClientRect(), dpr=Math.min(2,devicePixelRatio||1); cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr); st.appendChild(cv); const x=cv.getContext('2d'); if(!x){ cv.remove(); return; } x.scale(dpr,dpr);
  const W=r.width, H=r.height, P=[], cols=['#ffd54a','#ff6b6b','#6be3ff','#ffffff','#9cff7a','#ff9df2']; const burst=(t)=>{ const cx=W*(.18+Math.random()*.64), cy=H*(.1+Math.random()*.25), c=cols[Math.floor(Math.random()*cols.length)]; for(let i=0;i<46;i++){ const a=Math.PI*2*i/46, v=1.6+Math.random()*2.2; P.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,c,t0:t,life:1100+Math.random()*500}); } };
  const t0=performance.now(); const shots=[0,280,620,900,1250]; let n=0; const step=now=>{ const t=now-t0; while(n<shots.length&&t>=shots[n]){ burst(t); n++; } x.clearRect(0,0,W,H); for(const p of P){ const a=t-p.t0; if(a<0||a>p.life)continue; p.x+=p.vx; p.y+=p.vy; p.vy+=.035; p.vx*=.985; p.vy*=.985; x.globalAlpha=1-a/p.life; x.fillStyle=p.c; x.beginPath(); x.arc(p.x,p.y,1.8,0,7); x.fill(); } if(t<2600&&cv.isConnected)requestAnimationFrame(step); else cv.remove(); }; requestAnimationFrame(step); }
function cFlash(){ const el=document.getElementById('cs-flash'); if(!el)return; el.className='cs-flash'; void el.offsetWidth; el.className='cs-flash on'; }
function cBurst(pt,col,n){ const st=document.getElementById('cs-stage'); if(!st)return; for(let i=0;i<(n||22);i++){ const d=document.createElement('i'); d.className='cs-pt'; const a=Math.random()*Math.PI*2, r=8+Math.random()*18;
  d.style.left=pt[0]+'%'; d.style.top=pt[1]+'%'; d.style.setProperty('--dx',(Math.cos(a)*r)+'cqw'); d.style.setProperty('--dy',(Math.sin(a)*r)+'cqw'); d.style.background=i%3?col:'#ffd24d'; d.style.animationDuration=(0.9+Math.random()*.5)/cSpd()+'s'; st.appendChild(d); setTimeout(()=>d.remove(),1600/cSpd()); } }
function cScorePop(side){ const el=document.getElementById(side==='h'?'cs-sh':'cs-sa'); if(!el)return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function cTrail(from,to,arc,ms,cls){ const sv=document.getElementById('cs-trail'); if(!sv)return; const cx=(from[0]+to[0])/2, cy=(from[1]+to[1])/2-(arc?cDist(from,to)*.28:0);
  const p=document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d',`M${from[0]} ${from[1]} Q${cx} ${cy} ${to[0]} ${to[1]}`); p.setAttribute('class','tr '+(cls||'')); sv.appendChild(p);
  const len=p.getTotalLength?p.getTotalLength():60; p.style.strokeDasharray=len; p.style.strokeDashoffset=len;
  p.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:ms/cSpd(),fill:'forwards'}); setTimeout(()=>{ p.style.transition='opacity .6s'; p.style.opacity=0; setTimeout(()=>p.remove(),700); },(ms+700)/cSpd()); }
function cTrailClear(){ const sv=document.getElementById('cs-trail'); if(sv)sv.innerHTML=''; }
async function cBanner(g,half){ const el=document.getElementById('cs-bn'); if(!el)return; const at=half%2?g.home:g.away;
  el.innerHTML=`<div>${badge(at,40)}<b>${cHalfTxt(half)}</b><span>${esc(tname(at))} 공격</span></div>`; el.className='cs-bn on'; sfx('bong',.55); try{ await cSleep(850); }finally{ el.className='cs-bn'; } /* 멈춤·넘기기로 대기가 끊겨도 이닝 배너가 화면에 남지 않게 */ await cSleep(150); }
/* 볼 수 있는 장면 고르기 */
function cKeep(g,k,mode){ if((g.incidents||[]).some(e=>e.k===k))return true;if(mode==='all'||pcRecords(g,k).length)return true; const L=g.pbp; const x=L[k]; if(typeof x[1]!=='number')return false; const b=cBefore(g,k); const risp=!!(b.bases[1]||b.bases[2]);
  if(mode==='risp')return risp; return x[6]>0||['HR','3B','2B','DP','HBP'].includes(x[3])||(x[3]==='K'&&risp)||k===L.length-1||(x[4]>=3&&b.half>=16&&Math.abs(x[7]-x[8])<=1); }
function cTargets(g,k,st){ const L=g.pbp; const half=st.half; const top=half%2===0; const dT=top?g.home:g.away, oT=top?g.away:g.home;
  const dc=cTeamCol(dT), oc=cTeamCol(oT); const T=[]; const dU=cUni(g,dT), oU=cUni(g,oT);
  const gl=id=>{ const q=mdPlayer(g,id); return q&&q.th==='좌'?'R':'L'; };
  for(const f of cFielders(g,half,k))T.push({k:'d'+f.id,id:f.id,pt:CFP[f.pos],cls:'df'+(f.pos==='C'?' ctch':''),lab:POSS[f.pos],col:dc,u:{...dU,glove:gl(f.id)},rot:f.pos==='C'?-90:cAng(CFP[f.pos],CHM)});
  const pid=cPit(g,k); const pp=pid&&mdPlayer(g,pid); if(pid)T.push({k:'d'+pid,id:pid,pt:CFP.P,cls:'df pit'+(pp&&pp.th==='좌'?' lhp':''),lab:pp&&pp.th==='좌'?'좌투':'우투',col:dc,u:{...dU,glove:gl(pid),pose:'set'},rot:90});
  st.bases.forEach((id,i)=>{ if(id)T.push({k:'o'+id,id,pt:CBS[i],cls:'of run',lab:['1루','2루','3루'][i],col:oc,u:{...oU,helm:oU.H},rot:cAng(CBS[i],CPATH[i+2])}); });
  const x=L[k]; if(x&&typeof x[1]==='number'&&x[0]===half){ const bp=mdPlayer(g,x[1]); const side=bSide(bp,pp); T.push({k:'o'+x[1],id:x[1],pt:side==='L'?CBATL:CBAT,cls:'of bat '+(side==='L'?'lhb':'rhb'),lab:side==='L'?'좌타':'우타',col:oc,u:{...oU,helm:oU.H,bat:side},rot:0}); }
  return T.map(t=>({...t,ht:G.players[t.id]&&typeof bodyOf==='function'?bodyOf(G.players[t.id]).ht:null,name:pcName(g,t.id)||'기록 선수',delivery:t.cls.includes('pit')&&G.players[t.id]?pitchDelivery(G.players[t.id]):null,position:t.k[0]==='d'?(t.cls.includes('pit')?(mdPlayer(g,t.id).th==='좌'?'좌완':'우완')+(G.players[t.id]?' '+DELIVERY_LABEL[pitchDelivery(G.players[t.id])]:''):t.lab):t.cls.includes('bat')?'타자':t.lab})); }
/* 유니폼: 홈 팀은 흰 바탕에 팀 색 테두리, 원정 팀은 팀 색 바탕. 두 팀 색이 비슷해도 구분된다 */
function cLum(h){ const n=parseInt(h.slice(1),16); return (.2126*(n>>16&255)+.7152*(n>>8&255)+.0722*(n&255))/255; }
function cUni(g,tid){ const P=tpal(G.teams[tid]); if(tid===g.home)return {S:'#f2f4f6',D:P[0],H:P[0]}; const S=cLum(P[0])<.12?P[3]:P[0]; return {S,D:P[2],H:P[2]}; }
function cAng(a,b){ return Math.round(Math.atan2((b[1]-a[1]),(b[0]-a[0]))*180/Math.PI); }
function cBoard(g,st,cnt){if(c3DActive())Match3D.scoreboard(c3DScore(g,UI.cast.k,st)); const s=id=>document.getElementById(id); if(!s('cs-sa'))return;
  s('cs-sa').textContent=st.sa; s('cs-sh').textContent=st.sh; s('cs-inn').textContent=cHalfTxt(st.half);
  const dots=(id,n)=>s(id).querySelectorAll('i').forEach((el,i)=>el.classList.toggle('on',i<n));
  dots('cs-O',Math.min(2,st.outs)); { const ob=s('cs-Ob'); if(ob)dots('cs-Ob',Math.min(2,st.outs)); } s('cs-on').textContent=Math.min(3,st.outs)+'아웃';const bso=s('cs-bso');if(bso)bso.dataset.outs=Math.min(3,st.outs);const summary=s('cs-count-summary');if(summary){const b=s('cs-B')?.querySelectorAll('.on').length||0,ss=s('cs-S')?.querySelectorAll('.on').length||0;summary.textContent=b+'볼 · '+ss+'스트라이크 · '+Math.min(3,st.outs)+'아웃';}
  mdSet('cs-bases',st.bases.map((id,i)=>`<span class="md-base-pill${id?' occupied':''}" title="${i+1}루 · ${id?esc(mdPlayer(g,id).name):'주자 없음'}"><i>${i+1}루</i><b>${id?esc(mdPlayer(g,id).name):'비어 있음'}</b></span>`).join(''));
  CBS.forEach((b,i)=>{ const el=s('cs-b'+i); if(el)el.classList.toggle('on',!!st.bases[i]); }); try{ mdBug(g,st); }catch(e){} }
/* 중계 스코어 버그(실제 중계 화면 오른쪽 아래처럼): 타순·타자·시즌 타율 / 투수·투구 수 / 두 팀 점수 / 이닝 / 주자 / 볼카운트(cs-bso 그대로) */
/* 점수판 자리: 휴대폰(1000px 이하)은 경기장 안 오른쪽 위에 겹치고, PC는 투구판 묶음 안. 창 크기·회전으로 기준을 넘나들면 castFit이 다시 맞춘다(점수 갱신 전까지 스타일 없이 보이던 문제) */
function mdBugPlace(){ try{ const el=document.getElementById('md-bug'),pn=el&&el.parentElement,sg=document.getElementById('cs-stage'); if(!pn||!sg||!pn.classList.contains('md-count-panel'))return; if(innerWidth<=1000){ if(pn.parentElement!==sg)sg.appendChild(pn); }else if(pn.parentElement===sg){ const dock=document.querySelector('.md-pitch-dock'); if(dock)dock.appendChild(pn); } }catch(e){} }
function mdBug(g,st){const el=document.getElementById('md-bug');if(!el)return; mdBugPlace();const k=UI.cast?UI.cast.k:0,x=g.pbp[k]||g.pbp[g.pbp.length-1]||[],top=st.half%2===0;
 const bid=typeof x[1]==='number'?x[1]:null,pid=typeof x[2]==='number'?x[2]:null,side=top?'a':'h',bl=bid!=null&&g.box[side].bat.find(b=>b.id===bid);
 const bs=bid!=null&&typeof prepSeason==='function'?prepSeason(g,bid,bl):null,pc0=pid!=null&&typeof cPitchTotalBefore==='function'?cPitchTotalBefore(g,k,pid):null,pc=pc0==null?null:pc0+(UI.cast?.pitch?.k===k?UI.cast.pitch.shown||0:0); /* 타석 중 던진 공까지 센다(PC는 아래 타자·투수 줄이 숨겨져 이 숫자만 보인다) */
 const row=(tid,sc,at)=>`<div class="mb-t${at?' at':''}"><i style="background:${cTeamCol(tid)}"></i><span>${esc(team(tid).nick)}</span><b>${sc}</b></div>`;
 el.innerHTML=`<div class="mb-who">${bid!=null?`<span>${bl&&bl.o!=null?bl.o+1+'. ':''}${esc(mdPlayer(g,bid).name)}</span><em>${bs?'시즌 '+bs.avg:''}</em>`:'<span>&nbsp;</span>'}</div><div class="mb-who"><span>${pid!=null?'P '+esc(mdPlayer(g,pid).name):'&nbsp;'}</span><em id="md-bug-pc">${pc!=null?pc+'구':''}</em></div><div class="mb-main"><div class="mb-teams">${row(g.away,st.sa,top)}${row(g.home,st.sh,!top)}</div><div class="mb-inn"><b>${Math.floor(st.half/2)+1}</b><i>${top?'▲':'▼'}</i></div><div class="mb-dia">${[1,0,2].map(i=>`<i class="b${i}${st.bases[i]?' on':''}"></i>`).join('')}</div></div>`;}

const CAP_DEF=/삼진|아웃|병살|호수비|잡아|잡습니다|잡았|처리|막아|막았|무실점|돌려세|견제사|도루 저지|태그/, CAP_ATK=/홈런|안타|득점|적시|볼넷|몸에 맞|실책|세이프|진루|역전|동점/;
function cCap(t,cls){const el=document.getElementById('cs-cap');if(!el)return;if(!t&&c3DActive())return;el.className='cs-cap'+(t?' on':'');el.innerHTML=t?`<span class="cs-voice"><b>${esc(t)}</b></span>`:''; try{ const c=UI.cast,g=c&&G.games[c.g],x=g&&(g.pbp[c.k]||g.pbp[g.pbp.length-1]),atk=x?(x[0]%2?g.home:g.away):null; const def=atk==null?null:atk===g.home?g.away:g.home; const tid=CAP_DEF.test(t||'')&&!CAP_ATK.test(t||'')?def:atk; /* 내용별 색: 삼진·아웃·병살·호수비처럼 수비가 잘한 장면은 수비 팀 색, 나머지는 공격 팀 색(문장 내용으로 정해 결과를 미리 알리지 않는다) */ if(tid!=null){ const col=cTeamCol(tid); el.style.setProperty('--cap-bg',col); el.style.setProperty('--cap-fg',cLum(col)>.6?'#111':'#fff'); } }catch(e){} /* 자막은 그 장면 공격 팀 색 바탕(FM 중계 자막처럼) */if(cls){void el.offsetWidth;el.className+=' '+cls;}el.title=t||'';if(t&&document.querySelector('.match-dashboard'))mdSet('md-comment','<span>캐스터</span><b>'+esc(t)+'</b>');}
/* 공 */
/* 공: arc=뜬공(가운데서 커지고 바닥에 그림자), gb=땅볼(작게 튀며 굴러감), 그 밖은 직선(라인드라이브·송구) */
function cBall(from,to,ms,arc,gb){ if(typeof Match3D!=='undefined'&&Match3D.flight(from,to,ms/cSpd(),arc,gb,CT.pitch)){CT.pitch=null;return cSleep(ms);} const b=document.getElementById('cs-ball'); if(!b)return Promise.resolve(); const d=ms/cSpd(),token=CT.tok;
  const P=(f)=>[from[0]+(to[0]-from[0])*f,from[1]+(to[1]-from[1])*f]; let kf;
  if(arc){ const mid=P(.5); kf=[{left:from[0]+'%',top:from[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1},{left:mid[0]+'%',top:(mid[1]-cDist(from,to)*.18)+'%',transform:'translate(-50%,-50%) scale(2.2)',opacity:1,offset:.5},{left:to[0]+'%',top:to[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1}];
    const sh=document.getElementById('cs-shd'); if(sh)sh.animate([{left:from[0]+'%',top:from[1]+'%',opacity:.15,transform:'translate(-50%,-50%) scale(.6)'},{left:P(.5)[0]+'%',top:P(.5)[1]+'%',opacity:.45,transform:'translate(-50%,-50%) scale(1.3)',offset:.5},{left:to[0]+'%',top:to[1]+'%',opacity:.6,transform:'translate(-50%,-50%) scale(.9)'}],{duration:d,easing:'linear',fill:'forwards'}).onfinish=function(){ sh.getAnimations().forEach(a=>a.cancel()); }; }
  else if(gb){ kf=[0,.18,.32,.5,.62,.8,1].map((f,i)=>{ const q=P(f); return {left:q[0]+'%',top:(q[1]-(i%2?1.2*(1-f):0))+'%',transform:`translate(-50%,-50%) scale(${i%2?1.25:1})`,opacity:1,offset:f}; }); }
  else kf=[{left:from[0]+'%',top:from[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1},{left:to[0]+'%',top:to[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1}];
  const an=b.animate(kf,{duration:d,easing:gb?'ease-out':'linear',fill:'forwards'}); return new Promise((resolve,reject)=>{const done=()=>token===CT.tok?resolve():reject('stop');an.onfinish=done;an.oncancel=done;}); }
function cBallHide(){ if(typeof Match3D!=='undefined')Match3D.hideBall(); const b=document.getElementById('cs-ball'); if(b)b.getAnimations().forEach(a=>a.cancel()); }
const cPolar=(th,d)=>[50+d*Math.sin(th*Math.PI/180),89-d*Math.cos(th*Math.PI/180)];
const cDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
async function cAnim(k){ const c=UI.cast; const g=G.games[c.g]; const L=g.pbp; const x=L[k]; const b=cBefore(g,k); const st=document.getElementById('cs-stage'); if(!st)return;
  const card=key=>st.querySelector(`.cc[data-k="${key}"]`);if(c.incident?.k===k&&c.incident.pending){const pending=(g.incidents||[]).find(e=>e.k===k&&e.pitch===c.incident.index);if(pending)await c3DBenchClear(g,k,pending);}
  if(x[1]==='PC'){ const top=x[0]%2===0; const dug=CDUG[top?'h':'a']; const old=cPit(g,k); const oc=old&&card('d'+old);
    cCap(`투수 교체 · ${(G.players[x[2]]||{}).name||''}`); if(oc){ cPlace(oc,dug,700); oc.classList.add('gone'); }
    const ne=cCard('d'+x[2],x[2],'df','투',cTeamCol(top?g.home:g.away)); cPlace(ne,dug,0); st.appendChild(ne); ne.getBoundingClientRect(); cPlace(ne,CFP.P,900); await cSleep(1100); if(oc)oc.remove(); cCap(''); return; }
  if((x[1]==='SB'||x[1]==='CS')&&c3DActive()){await c3DSteal(g,k,b);const records=pcRecords(g,k);if(records.length)await cResultCall({beats:[],records});return;}
  if(x[1]==='SB'||x[1]==='CS'){ const i=b.bases.indexOf(x[2]); const el=card('o'+x[2]); cCap(x[1]==='SB'?'도루 시도':'도루 시도');
    const to=Math.min(3,i+2); cBall(CFP.P,CHM,300); await cSleep(300); cBall(CHM,CPATH[to],450); if(el)cPlace(el,CPATH[to],500); await cSleep(550);
    if(x[1]==='CS'&&el){ el.classList.add('gone'); cCap('도루 실패 · 아웃','bad'); } else cCap('도루 성공','good');
    cBoard(g,{...b,outs:x[3],bases:x[4]},null); await cSleep(700);const records=pcRecords(g,k);if(records.length)await cResultCall({beats:[],records}); cCap(''); cBallHide(); return; }
  /* 타석 */
  if(typeof x[1]!=='number')return;const intro=pcAtBatIntro(g,k);cCap(intro.c,'',intro.a);
  const o=x[3], rnd=mulberry((g.day*977+k*131+(g.home*7+g.away))|0); const bid=x[1]; const bat=card('o'+bid);
  const homeBat=x[0]%2===1; if(homeBat&&(b.bases[1]||b.bases[2]))sndLoop('chant','chant',.45,.5);
  if(c.mode&&c.mode!=='all')await cSleep(250);
  /* 타구 방향은 먼저 정한다(타석 장면과 필드 장면이 같은 타구를 보여주도록) */
  let spot=null, arc=false, flight=650, kind='', opos=null; c.gb=false; c.errPos=null;
  if(o==='HR'){ const th=-38+rnd()*76; spot=cPolar(th,96); arc=true; flight=1100; kind='홈런'; }
  /* 장타는 외야수 사이(좌중간·우중간)를 가르거나 선상으로 빠진다. 외야수 바로 앞뒤가 아니라 뛰어가서 줍는 거리(사용자 피드백 11-08). 외야수 자리: 좌·우 약 ±29도, 중견 0도, 홈에서 66~72 */
  else if(o==='3B'){ const gap=rnd()<.6, th=(rnd()<.5?-1:1)*(gap?11+rnd()*8:39+rnd()*5); spot=cPolar(th,gap?84+rnd()*8:76+rnd()*8); arc=true; flight=900; kind='3루타'; }
  else if(o==='2B'){ const gap=rnd()<.65, th=(rnd()<.5?-1:1)*(gap?11+rnd()*8:38+rnd()*6); spot=cPolar(th,gap?76+rnd()*12:64+rnd()*12); arc=rnd()<.6; flight=800; kind='2루타'; }
  else if(o==='1B'){ c.gb=false; if(rnd()<.6){ const th=-36+rnd()*72; spot=cPolar(th,44+rnd()*10); arc=rnd()<.5; } else { const th=[-28,-9,9,28][Math.floor(rnd()*4)]+rnd()*6-3; spot=cPolar(th,46); c.gb=true; } flight=650; kind='안타';  /* 해설이 말하는 방향·종류와 화면을 맞춘다(좌전·중전·우전·3유간·1·2루간·유격수 키). 예전에는 화면 방향을 따로 뽑아 해설과 어긋날 수 있었다(사용자 11-13) */
    try{ const bp=G.players[x[1]], h=t=>pcH(g,k,t), inf=bp&&bp.r.spd>=64&&h('if')<.25;
      if(!inf){ /* 내야 안타(해설: 느린 땅볼, 1루 세이프)는 아직 화면에 따로 그리지 않는다: 늦은 1루 송구 장면이 필요하다 */ const t=pcPick(g,k,'t1',['좌전','중전','우전','3유간을 빠지는','1·2루간을 꿰뚫는','유격수 키를 넘기는']), j=h('t1j')*2-1;
        if(t==='좌전'){ spot=cPolar(-26+j*8,48+h('t1r')*6); arc=h('t1a')<.5; c.gb=!arc&&h('t1g')<.6; }
        else if(t==='중전'){ spot=cPolar(j*8,48+h('t1r')*6); arc=h('t1a')<.5; c.gb=!arc&&h('t1g')<.6; }
        else if(t==='우전'){ spot=cPolar(26+j*8,48+h('t1r')*6); arc=h('t1a')<.5; c.gb=!arc&&h('t1g')<.6; }
        else if(t==='3유간을 빠지는'){ spot=cPolar(-31+j*3,46); arc=false; c.gb=true; }
        else if(t==='1·2루간을 꿰뚫는'){ spot=cPolar(31+j*3,46); arc=false; c.gb=true; }
        else { spot=cPolar(-17+j*4,46+h('t1r')*4); arc=true; c.gb=false; } } }catch(e){} }
  else if(o==='SAC'){ opos=['P','3B','1B'][Math.floor(rnd()*3)]; const base=CFP[opos]; spot=[base[0]+rnd()*4-2,base[1]+rnd()*6]; arc=false; flight=420; kind='희생번트'; }
  else if(o==='OUT'||o==='DP'){ /* 해설과 같은 결정(어느 야수 쪽, 땅볼·뜬공·직선타)을 그대로 쓴다 */
    const pk=(t,a)=>{ try{ return pcPick(g,k,t,a); }catch(e){ return a[0]; } }; const H=t=>{ try{ return pcH(g,k,t); }catch(e){ return rnd(); } };
    const half=x[0]; const ePos=(()=>{ try{ return pcErrPos(g,k); }catch(e){ return null; } })(); const batSafe0=x[5].includes(x[1]);
    let typ='gb'; if(o==='DP'){ opos=pk('dp',[['SS','2B','6-4-3'],['2B','SS','4-6-3'],['3B','2B','5-4-3']])[0]; }
    else if(x[16]){ opos=pk('bp',['P','3B','1B']); typ='gb'; } /* 번트 실패 포스아웃: 실책이 아니다(검수 11-08) */
    else if(batSafe0){ opos=ePos||pk('ep',['SS','3B','2B']); typ='err'; }
    else if(x[6]>0&&(x[13]||x.length<=10)){ opos=pk('sf',['LF','CF','RF']); typ='fly'; }
    else if(x[6]>0){ opos=pk('gp',['SS','2B','3B','1B']); typ='gb'; } /* 득점 땅볼(검수 11-08) */
    else { const pp=G.players[x[2]]; const r=H('ot'), gbB=pp?gbT(pp)*.08:0; if(r<.45+gbB)opos=pk('gp',['SS','2B','3B','1B','SS','2B','P']); else if(r<.85){ opos=pk('fp',['LF','CF','RF','CF']); typ='fly'; } else { opos=pk('lp',['SS','2B','3B','1B']); typ='ld'; } }
    const base=CFP[opos]||CFP.SS; spot=[base[0]+rnd()*6-3,base[1]+rnd()*5-2.5]; const ofE=typ==='err'&&['LF','CF','RF'].includes(opos); arc=typ==='fly'||ofE; c.gb=typ==='gb'||(typ==='err'&&!ofE); c.errPos=typ==='err'?opos:null; flight=arc?950:typ==='ld'?380:560;
    kind=typ==='fly'?(x[6]>0?'희생플라이':'뜬공 아웃'):typ==='gb'&&x[6]>0&&o!=='DP'?(x[12]>0?'땅볼 타점':'땅볼 득점'):typ==='ld'?'직선타 아웃':typ==='err'?'실책':x[16]?'번트 실패 · 포스아웃':(o==='DP'?'병살타':'땅볼 아웃'); }
  if(spot)spot=cFair(spot); /* 인플레이 타구는 늘 페어 지역에 떨어진다 */
  const cam=false,scene3d=c3DActive();
  { const seq=cPitchSeq(g,k); const fast=c.mode&&c.mode!=='all'; const show=fast&&!(g.incidents||[]).some(e=>e.k===k)?Math.min(2,seq.length):seq.length;
    const throwOne=async(q,i,last)=>{const delivery=pitchDelivery(G.players[x[2]]),pc=st.querySelector('.cc.pit'),sw=last?(o!=='BB'&&o!=='HBP'&&!/루킹/.test(q.res)):/헛스윙|파울/.test(q.res),stretch=true /* 주자가 없어도 모든 투구를 세트 포지션에서(사용자 11-12) */,wind=scene3d?(Math.round(Match3D.pitchReleaseMs(delivery,stretch))):(fast?150:220),travel=scene3d?Math.round(18.44/(Math.max(80,q.v)/3.6)*1000):(fast?240:300),lead=scene3d&&sw?Math.min(wind,Math.max(0,Match3D.swingContactMs()*.8-travel)):0; /* 스윙은 빠르게(접촉까지 약 0.75초), 동작 프레임은 클립을 촘촘히 다시 뽑아 부드럽게(사용자 피드백 11-07) */
      const bunt=last&&(o==='SAC'||!!x[16]); /* 희생번트·번트 실패 타석의 마지막 공: 풀스윙 대신 번트 */if(scene3d)Match3D.windup(wind/cSpd(),delivery,stretch);if(scene3d&&bunt)Match3D.swing((wind+travel)/cSpd(),'bunt');if(pc){pc.classList.remove('th');void pc.offsetWidth;pc.classList.add('th');}
      await cSleep(wind-lead);if(scene3d&&sw&&!bunt)Match3D.swing((lead+travel)/cSpd());if(sw&&!bunt)setTimeout(()=>sfx('swing',.6,.95+Math.random()*.1),Math.max(0,(lead+travel)/cSpd()-160));if(lead)await cSleep(lead);sfx('pitch',.45,.9+Math.random()*.2);CT.pitch=q;if(scene3d){const catcher=c3DFielder(g,k,'C');if(catcher)Match3D.receive('d'+catcher.id,q.y<.18?'pitch_high':q.y>.82?'pitch_low':'pitch',travel/cSpd(),CFP.P); /* 높은 공·낮은 공 포구 자세 */}await cBall(CFP.P,[50+(q.x-.5)*4,88+(q.y-.5)*2],travel,false);cBallHide();if(scene3d&&!/타격|파울|번트|몸에 맞는 공/.test(q.res)){const catcher=c3DFielder(g,k,'C');if(catcher)Match3D.caught('d'+catcher.id,'투구 포구');}
      if(bat&&sw){bat.classList.remove('sw');void bat.offsetWidth;bat.classList.add('sw');}cShowPitch(g,k,seq,i);const pitchCall=pcPitchCall(g,k,q,i);if(pitchCall)cCap(pitchCall.c,/삼진/.test(q.res)?'bad':'',pitchCall.a);const incident=(g.incidents||[]).find(e=>e.k===k&&e.pitch===i);if(incident)await c3DBenchClear(g,k,incident);if(!last){if(q.res==='파울')sfx('crack',.25,1.3);else sfx('mitt',.35);if(q.res==='스트라이크'||q.res==='헛스윙')umpCall('스트라이크');else if(q.res==='파울')umpCall('파울'); /* 주심 스트라이크 콜 동작 */await cSleep(scene3d?700:fast?230:420);}};
    for(let i=0;i<seq.length;i++){ const last=i===seq.length-1; if(i<seq.length-show||c.pitch?.k===k&&i<c.pitch.shown){continue;} await throwOne(seq[i],i,last); }
    if(!seq.length){ await cSleep(220); await cBall(CFP.P,[50,88],300,false); cBallHide(); } }
  cCap('');
  const after=x[5], runs=x[6], outsA=x[4];
  const fieldCards=[...st.querySelectorAll('.cc.df')].filter(el=>!el.classList.contains('gone'));
  const posOf=el=>[parseFloat(el.style.left),parseFloat(el.style.top)];
  const nearest=pt=>{ let best=null,bd=1e9; for(const el of fieldCards){ const d=cDist(posOf(el),pt); if(d<bd){bd=d;best=el;} } return best; };
  /* 주자 이동 계산 */
  const isHR=o==='HR'; const batSafe=after.includes(bid)||isHR;
  const moves=cRunnerMoves(g,k);
  const bTo=isHR?4:after.indexOf(bid)+1;
  const runAll2=async(per)=>Promise.all(moves.map(async m=>{ const el=card('o'+m.id); if(!el)return; for(let i=m.from+1;i<=Math.min(4,m.to);i++){ cPlace(el,CPATH[i],per); await cSleep(per); } if(m.out||m.score)el.classList.add('gone'); }));
  let cap='', cls='';
  const oc=cTeamCol(x[0]%2?g.home:g.away);
  if(o==='K'){ if(!cam){ sfx('mitt',.9); cFx('삼진','k'); } else umpCall('스트라이크 아웃'); if(homeBat&&(b.bases[1]||b.bases[2]))sfx('sigh',.5); /* 홈 팀 득점권 삼진: 관중 탄식 */ if(scene3d)await cSleep(650);if(bat)bat.classList.add('gone'); await cSleep(cam?200:900); }
  else if(o==='BB'||o==='HBP'){if(o==='HBP'&&scene3d){Match3D.hitByPitch();await cSleep(650);} if(!cam)cFx(o==='HBP'?'몸에 맞는 공':'볼넷','bb'); const pr=[]; if(bat){ cPlace(bat,CBS[0],700); pr.push(cSleep(700)); } pr.push(runAll2(600)); await Promise.all(pr); }
  else if(scene3d){await c3DContact(g,k,{x,b,spot,arc,opos,bat,after,moves,bTo});}
  else {
    const fl=nearest(spot); const flFrom=fl?posOf(fl):null; const outPlay=o==='OUT'||o==='DP'||o==='SAC';
    const chaseTo=fl?(outPlay?spot:[flFrom[0]+(spot[0]-flFrom[0])*.8,flFrom[1]+(spot[1]-flFrom[1])*.8]):null;
    if(fl&&o!=='HR')cPlace(fl,chaseTo,flight*.95);
    if(!cam)sfx('crack',1,.94+rnd()*.12); cTrail([50,88],spot,arc,flight,(o==='HR'?'hr':outPlay&&!c.errPos?'out':'hit')+(c.gb?' gb':'')); const pr=[cBall([50,88],spot,flight,arc,c.gb)];
    if(bat&&bTo>=1){ pr.push((async()=>{ for(let i=1;i<=Math.min(4,bTo);i++){ cPlace(bat,CPATH[i],o==='HR'?520:560); await cSleep(o==='HR'?520:560); } if(bTo>=4)bat.classList.add('gone'); })()); }
    else if(bat){ pr.push((async()=>{ cPlace(bat,[(CHM[0]+CBS[0][0])/2,(CHM[1]+CBS[0][1])/2],600); await cSleep(600); })()); }
    pr.push(runAll2(o==='HR'?520:560));
    await Promise.all([pr[0]]);
    if(c.errPos){ if(fl){ fl.classList.add('err'); setTimeout(()=>fl.classList.remove('err'),1600/cSpd()); } cFx('실책','bad'); sfx('cheer_hit',homeBat?.7:.25); } else if(outPlay)sfx('mitt',.55); else if(o!=='HR')sfx('cheer_hit',homeBat?.85:.3);
    if(o==='HR'){ sfx('cheer_big',homeBat?1:.45); if(homeBat)setTimeout(()=>organ(ORG_CHARGE,.2),600/cSpd()); buzz(90); cFlash(); cFireworks(); cBurst(spot,oc,28); cFx(runs===4?'만루 홈런':runs>1?`${runs}점 홈런`:'홈런','hr'); }
    else if(o==='DP')cFx('병살','bad'); else if(['2B','3B'].includes(o))cFx(kind,'xb');
    if(outPlay&&!c.errPos){ if(o==='DP'){ await cBall(spot,CBS[1],380,false); await cBall(CBS[1],CBS[0],380,false); } else if(!arc){ await cBall(spot,CBS[0],420,false); } if(!batSafe&&bat)bat.classList.add('gone'); }
    else if(o!=='HR'&&fl){ await cSleep(150); await cBall(spot,CBS[1],480,false); }
    await Promise.all(pr.slice(1));
    if(c.errPos){ const ef=G.players[x[9]]; cCap(`${POSK[c.errPos]||''} ${ef?ef.name:''} 실책 · 타자 출루`,'bad'); }
    else if(o!=='HR'&&o!=='DP'&&!['2B','3B'].includes(o))cFx(runs?`${kind} +${runs}`:kind,runs?'run':outPlay?'out':'hit'); else if(runs&&o!=='HR')cCap(`+${runs}점`,'good'); }
  if(document.querySelector('.match-dashboard'))mdDuelResult(g,k);{ const r=paK(x); cAbRes(r[0],r[1]); } try{ cClutch(g,k); }catch(e){}
  cBallHide();
  const st2={sa:x[7],sh:x[8],outs:outsA,bases:outsA>=3?[0,0,0]:after,half:x[0]};
  sndStop('chant',.9); if(runs){ cScorePop(x[0]%2?'h':'a'); cBurst(CHM,oc,12); if(o==='OUT'||o==='BB')sfx('cheer_hit',homeBat?.6:.25); }
  const finalCall=pbpCall(g,k);cBoard(g,st2,null);if(scene3d)Match3D.scoreboard(c3DScore(g,k,st2,true)); { const prev=c.wp; const s3=outsA>=3?{...st2,half:x[0]+1,outs:0,bases:[0,0,0]}:st2; const w=k===L.length-1?(g.hs>g.as?1:0):wpHome(s3,wpMax(g)); c.wp=cWp(g,s3,prev)??w;  }
  await cResultCall(finalCall,o==='HR'?'hr':runs?'good':'');cCap('');
  if(scene3d){const party=c3DPartyKind(g,k);if(party)await c3DParty(g,k,party);}
  { const S=G.cwS; const z=UI.cwAfter&&S&&S.id===UI.cwAfter&&(S.live||[]).find(q=>q.k===k); if(z){ cCap(`${cwNm(S.who)} "${z.l}"`,'good'); await cSleep(1700); cCap(''); } } /* 함께 보는 구단주·사장 반응 */ }
/* Pausing resets the pose; replay the terminal pitch so contact still has a swing. */
function castResumePitch(){const c=UI.cast;if(!c||c.pitch?.k!==c.k)return;const seq=cPitchSeq(G.games[c.g],c.k);if(seq.length&&c.pitch.shown>=seq.length)c.pitch.shown=seq.length-1;}
function castRestart(){CT.tok++;CT.run=false;cBallHide();castResumePitch();castLoop();}
async function castLoop(){ const host=document.getElementById('cs-3d');if(CT.run||UI.cast?.pre||host&&['pending','loading'].includes(host.dataset.state))return; CT.run=true; const my=CT.tok;
  if(UI.cast&&UI.cast.play)sndLoop('amb','amb',.4,1.2);
  try{ while(UI.cast&&UI.cast.play&&my===CT.tok){ const c=UI.cast; const g=G.games[c.g]; const L=g.pbp; if(c.k>=L.length){ c.play=false; cDraw(c.k,300); sndStop('amb',1.8); sndStop('chant',.5); /* 경기 종료 효과음(사이렌·함성·오르간)은 뺐다(사용자 11-08) */ break; }
      const x=L[c.k]; const md=c.mode||'all'; if(md!=='all'&&!cKeep(g,c.k,md)){ c.k++; continue; }
      cDraw(c.k,md==='all'?300:0); await cSleep(md==='all'?260:200);
      if(c.lastHalf!==x[0]){ c.lastHalf=x[0]; await cBanner(g,x[0]); }
      await cAnim(c.k); c.k++; } }
  catch(e){if(e!=='stop')console.error('중계 재생 오류',e);} finally{ if(my===CT.tok)CT.run=false; } }
function castMount(){ const c=UI.cast; if(!c)return; CT.tok++; CT.run=false; setTimeout(()=>castStart2D(c),12000); requestAnimationFrame(async()=>{if(UI.cast!==c)return; cDraw(c.k,0); const host=document.getElementById('cs-3d'); const ok=host&&typeof Match3D!=='undefined'&&await Match3D.mount(host,{day:[0,6].includes(dobj(G.games[c.g].day).w)}); if(UI.cast!==c||!host?.isConnected)return; cPrepDone(ok); cDraw(c.k,0); if(c.play&&!CT.run){castResumePitch();castLoop();} }); }
/* 결승점: 이긴 팀이 마지막으로 앞서기 시작한 타석(그 뒤로 다시 따라잡히지 않음) */
function castWinIdx(g){ const L=g.pbp||[]; if(!L.length||g.hs===g.as)return -1; const W=g.hs>g.as?'h':'a'; let last=-1, prev=0; for(let i=0;i<L.length;i++){ const a=L[i][7], h=L[i][8]; if(typeof a!=='number'||typeof h!=='number')continue; /* 도루·투구 수 줄은 점수가 없다: 리드를 끊지 않는다(검수 11-06) */ const lead=h>a?'h':a>h?'a':''; if(lead===W&&prev!==W)last=i; prev=lead||'t'; } return last; }
function castJump(k,play){ const c=UI.cast; if(c.pre)cPrepClose(c); const L=G.games[c.g].pbp; c.k=clamp(k,0,L.length); if(c.hold)save(); /* 옮긴 장면을 저장 예약: 일시 정지한 채 닫아도 그 위치로 다시 열린다(검수 11-09) */ c.pitch=null;c.lastHalf=null; CT.tok++; CT.run=false; cBallHide(); cTrailClear(); cDraw(c.k,250); if(play!=null)c.play=play; if(c.play&&c.k<L.length)castLoop(); else { sndStop('amb'); sndStop('chant'); const pb=document.getElementById('cs-play'); if(pb)pb.textContent='재생'; } }


/* ---------- 투구 연출: 타석 결과에 맞는 볼카운트 순서를 투수의 실제 구종표로 만든다(해설과 같은 결정을 쓴다) ---------- */
function cPitchSeq(g,k){const row=g?.pbp?.[k];return storedPitchSequence(row)||legacyPitchSequence(g,k);}
/* 볼카운트 신호등: 이 공 결과 뒤 카운트. 볼넷·삼진·타격으로 끝나는 마지막 공 뒤에는 다음 타자 때 0-0으로 돌아간다 */
function cCountAfter(q){ let b=q.b, s=q.s; if(q.res==='볼')b=Math.min(3,b+1); else if(q.res==='파울')s=Math.min(2,s+1); else if(q.res==='스트라이크'||q.res==='헛스윙')s=Math.min(2,s+1); return {b,s}; }
function cCount(b,s){ const set=(id,n)=>{ const el=document.getElementById(id); if(el)el.querySelectorAll('i').forEach((x,i)=>x.classList.toggle('on',i<n)); }; set('cs-B',b); set('cs-S',s);const summary=document.getElementById('cs-count-summary'),outs=document.getElementById('cs-bso')?.dataset.outs||0;if(summary)summary.textContent=b+'볼 · '+s+'스트라이크 · '+outs+'아웃'; }
function cPitchTxt(q,i){ return `<span class="md-pitch-main"><b>${i+1}구 · ${esc(q.t)}</b><strong>${Number.isFinite(q.v)?q.v+'<small> km/h</small>':'<small>구속 미기록</small>'}</strong></span><em class="${cPitchClass(q)}">${esc(q.res)}</em><small class="md-pitch-location">${q.legacy?'추정 재현 · ':''}${esc(cPitchLocationText(q))}</small>`; }
