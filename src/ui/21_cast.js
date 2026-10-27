/* ---------- 그래픽 중계: 중계 기록을 필드 위 카드로 재생 ---------- */
const CFP={C:[50,97],'1B':[74,66],'2B':[62,50],SS:[38,50],'3B':[26,66],LF:[18,31],CF:[50,17],RF:[82,31],P:[50,72]};
const CBS=[[68,73],[50,56],[32,73]], CHM=[50,89], CBAT=[40,89], CBATL=[60,89], CDUG={h:[97,80],a:[3,80]};
/* 타석 위치: 우타자는 홈 왼쪽(3루 쪽), 좌타자는 오른쪽(1루 쪽). 양타는 투수 반대 손 */
function bSide(b,p){ if(!b)return 'R'; if(b.bt==='좌')return 'L'; if(b.bt==='양')return p&&p.th==='좌'?'R':'L'; return 'R'; }
const CPATH=[CHM,CBS[0],CBS[1],CBS[2],CHM];
let CT={tok:0,run:false};
const cSpd=()=>(UI.cast&&UI.cast.spd)||1;
addEventListener('unhandledrejection',e=>{ if(e.reason==='stop')e.preventDefault(); }); /* 중계를 닫거나 건너뛸 때 멈춘 연출 대기는 오류가 아니다 */
function cSleep(ms){ const t=CT.tok; return new Promise((res,rej)=>setTimeout(()=>t===CT.tok?res():rej('stop'),ms/cSpd())); }
function cHalfTxt(h){ return `${Math.floor(h/2)+1}회${h%2?'말':'초'}`; }
function cPit(g,k){ const L=g.pbp; const par=L[Math.min(k,L.length-1)][0]%2;
  for(let i=Math.min(k,L.length)-1;i>=0;i--){ const y=L[i]; if(y[0]%2!==par)continue; if(y[1]==='PC'||typeof y[1]==='number')return y[2]; }
  for(let i=k;i<L.length;i++){ const y=L[i]; if(y[0]%2===par&&typeof y[1]==='number')return y[2]; } return null; }
function cBefore(g,k){ const L=g.pbp; if(k<=0)return {sa:0,sh:0,outs:0,bases:[0,0,0],half:L[0][0]};
  const s=pbpState(g,Math.min(k,L.length)-1); if(k<L.length&&L[k][0]!==s.half)return {sa:s.sa,sh:s.sh,outs:0,bases:[0,0,0],half:L[k][0]}; return s; }
function cFielders(g,half){ const b=g.box[half%2===0?'h':'a'].bat; const seen={}; const out=[];
  for(const x of b){ if(!CFP[x.pos]||x.pos==='P'||seen[x.pos])continue; seen[x.pos]=1; out.push({pos:x.pos,id:x.id}); } return out; }
function cTeamCol(tid){ const t=G.teams[tid]; return t?tpal(t)[3]:'#888'; }
/* 카드 배치: 키가 같은 카드는 이동, 없어진 카드는 사라지고 새 카드는 나타남 */
function cPlace(el,pt,ms){ if(ms>=250&&el.classList){ el.classList.add('mv'); clearTimeout(el._mvT); el._mvT=setTimeout(()=>el.classList.remove('mv'),ms/cSpd()); } el.style.transition=ms?`left ${ms/cSpd()}ms linear, top ${ms/cSpd()}ms linear, opacity .25s`:'none'; el.style.left=pt[0]+'%'; el.style.top=pt[1]+'%'; }
function cSync(T,ms){ const st=document.getElementById('cs-stage'); if(!st)return; st.querySelectorAll('.cc.gone').forEach(el=>el.remove()); const have={}; st.querySelectorAll('.cc').forEach(el=>have[el.dataset.k]=el);
  const keep={}; for(const t of T){ keep[t.k]=1; let el=have[t.k]; if(!el){ el=cCard(t.k,t.id,t.cls,t.lab,t.col,t); cPlace(el,t.from||t.pt,0); st.appendChild(el); if(t.from){ el.getBoundingClientRect(); cPlace(el,t.pt,ms||400); } }
    else { el.className='cc '+t.cls; cPlace(el,t.pt,ms); const kr=el.querySelector('.kr'); if(kr&&t.u){ const sig=JSON.stringify(t.u); if(kr.dataset.s!==sig){ kr.dataset.s=sig; kr.innerHTML=kPlayer({...t.u,v:el.dataset.v%5,rot:0}); } kr.style.transform=`rotate(${t.rot||0}deg)`; } const em=el.querySelector('em.cc-h'); if(em){ if(/[좌우][타투]/.test(t.lab||'')){ em.textContent=t.lab; em.className='cc-h '+(/좌/.test(t.lab)?'l':'r'); } else em.remove(); } } }
  for(const k in have)if(!keep[k])have[k].classList.add('gone'); }
function castSheet(){ const c=UI.cast; const g=G.games[c.g]; if(!g)return '';
  const stripes=[...Array(9)].map((_,i)=>`<path d="M50 89 L${-40+i*20} -20 L${-30+i*20} -20 Z" class="st"/>`).join('');
  const hc=cTeamCol(g.home), ac=cTeamCol(g.away); const day=[0,6].includes(dobj(g.day).w);
  const crowd=(()=>{ const r=mulberry(g.day*31+g.home); let o=''; for(let i=0;i<420;i++){ const a=Math.PI*(1.0+r()*1.0), rr=50+r()*30; const x=50+Math.cos(a)*rr*1.05, y=89+Math.sin(a)*rr*1.12; if(y>44&&(x>14&&x<86))continue; if(y>58)continue; const v=r(); const col=v<.3?hc:v<.4?ac:v<.6?'#c9d1d8':v<.8?'#6b7680':'#3b444d'; o+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.3+r()*.2).toFixed(2)}" fill="${col}" opacity="${(.5+r()*.45).toFixed(2)}"/>`; } return o; })();
  const tower=(x,y)=>`<g class="tw"><circle cx="${x}" cy="${y}" r="9" class="glow"/><rect x="${x-.4}" y="${y}" width=".8" height="13" class="pole"/><rect x="${x-3}" y="${y-1.6}" width="6" height="2.6" rx=".4" class="lamp"/></g>`;
  const fieldBg=`<svg class="cs-bg${day?' day':''}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><clipPath id="cs-fair"><path d="M50 92 L1 43 Q50 -16 99 43 Z"/></clipPath>
      <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">${day?'<stop offset="0" stop-color="#5d8fc0"/><stop offset=".45" stop-color="#9cc1e0"/><stop offset="1" stop-color="#1c3a26"/>':'<stop offset="0" stop-color="#03060a"/><stop offset=".45" stop-color="#0b1622"/><stop offset="1" stop-color="#0d1a12"/>'}</linearGradient>
      <radialGradient id="cs-glw"><stop offset="0" stop-color="#fff7d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#cs-sky)"/>
    <path d="M-6 58 L-6 30 Q50 -38 106 30 L106 58 L99 43 Q50 -16 1 43 Z" class="stand"/>${crowd}
    <rect x="38" y="1.2" width="24" height="8" rx=".8" class="sb"/><rect x="39.2" y="2.4" width="21.6" height="5.6" class="sbi"/><text x="50" y="6.6" class="sbt">${esc(tshort(g.away))} : ${esc(tshort(g.home))}</text>
    ${day?'':tower(6,10)+tower(94,10)+tower(24,-2)+tower(76,-2)}
    <path d="M50 100 L-5 45 L-5 100 Z M50 100 L105 45 L105 100 Z" class="foul"/><path d="M50 92 L1 43 Q50 -16 99 43 Z" class="g1"/>
    <g clip-path="url(#cs-fair)">${stripes}<path d="M1 43 Q50 -16 99 43" class="trk"/></g>
    <path d="M1 43 Q50 -16 99 43" class="wall"/>
    <path d="M24 74 Q50 32 76 74 L50 95 Z" class="dirt"/><path d="M50 86 L65 73 L50 59 L35 73 Z" class="g3"/>
    <circle cx="50" cy="72" r="2.8" class="dirt"/><circle cx="50" cy="89" r="4.2" class="dirt"/>
    <path d="M50 89 L2 41 M50 89 L98 41" class="line"/>
    <rect x="10" y="81" width="18" height="1.6" rx=".5" fill="${ac}" opacity=".25"/><rect x="72" y="81" width="18" height="1.6" rx=".5" fill="${hc}" opacity=".25"/>
    <path d="M50 89 L68 73 L50 56 L32 73 Z" class="path"/><rect x="48.6" y="71.6" width="2.8" height=".8" fill="#f4f6f8"/>
    <rect x="38" y="86.2" width="4.4" height="5.8" class="box"/><rect x="57.6" y="86.2" width="4.4" height="5.8" class="box"/><circle cx="31" cy="93" r="1.5" class="odc"/><circle cx="69" cy="93" r="1.5" class="odc"/>
    <line x1="1.5" y1="43.5" x2="1.5" y2="36" class="pole2"/><line x1="98.5" y1="43.5" x2="98.5" y2="36" class="pole2"/>
    ${CBS.map((b,i)=>`<rect id="cs-b${i}" x="${b[0]-1.7}" y="${b[1]-1.7}" width="3.4" height="3.4" transform="rotate(45 ${b[0]} ${b[1]})" class="base"/>`).join('')}<path d="M48.4 88 h3.2 v1.4 l-1.6 1.5 l-1.6 -1.5z" class="base"/></svg>`;
  const sp=c.spd||1, md=c.mode||'all';
  return `<div class="cast" data-g="${c.g}" role="dialog" aria-label="그래픽 중계">
  <div class="cs-top">
    <div class="cs-board"><span class="cs-tm">${badge(g.away,24)}<i>${esc(tshort(g.away))}</i><b id="cs-sa">0</b></span><span class="cs-mid"><b id="cs-inn">1회초</b><span class="cs-cnt"><span id="cs-O"><i></i><i></i></span><em id="cs-on">0아웃</em></span></span><span class="cs-tm r"><b id="cs-sh">0</b><i>${esc(tshort(g.home))}</i>${badge(g.home,24)}</span></div>
    <div class="cs-wpw"><div class="cs-wp"><span class="wa" style="background:${ac}"></span><i id="cs-wpa" style="background:${hc}"></i><span class="cs-wpt" id="cs-wpt"></span></div></div>
    <button class="x" style="margin-left:auto" data-a="castClose" aria-label="중계 닫기">×</button></div>
  <div class="cs-body"><div class="cs-stage" id="cs-stage">${fieldBg}<svg class="cs-trail" id="cs-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg><div class="cs-ball" id="cs-ball"></div><div class="cs-sit" id="cs-sit"></div><div class="cs-cap" id="cs-cap"></div><div class="cs-fx" id="cs-fx"></div><div class="cs-flash" id="cs-flash"></div><div class="cs-bn" id="cs-bn"></div></div>
    <div class="cs-side"><div class="cs-vs" id="cs-vs"></div><div class="cs-log" id="cs-log"></div></div></div>
  <div class="cs-ctl"><div class="cs-mode">${[['all','전체'],['hl','하이라이트'],['risp','득점권']].map(([k,l])=>`<button data-a="castMode" data-v="${k}" class="${md===k?'on':''}">${l}</button>`).join('')}</div>
    <div class="cs-btns"><button data-a="castStep" data-v="-1" aria-label="이전 타석">◀</button><button class="pri" id="cs-play" data-a="castPlay">${c.play?'일시정지':'재생'}</button><button data-a="castStep" data-v="1" aria-label="다음 타석">▶</button><button data-a="castInn">다음 회</button><button data-a="castSpd" id="cs-spd">${sp}배속</button><button data-a="castEnd">끝</button></div></div>
  </div>`; }
/* 필드 카드: 얼굴 + 이름 + 능력치 하나 */
function cCard(key,id,cls,lab,col,t){ const p=G.players[id]; const el=document.createElement('button'); el.className='cc '+cls; el.dataset.k=key; el.dataset.a='castPlayer'; el.dataset.v=id; el.style.setProperty('--tc',col);
  const ov=p&&/bat|pit/.test(cls)?scoutReport(p).cur:null; const u=(t&&t.u)||{S:col,D:'#0008'};
  el.innerHTML=`<span class="cc-f"><svg class="kp" viewBox="-24 -24 48 48" aria-hidden="true"><ellipse cx="1.5" cy="2.5" rx="15" ry="13" fill="#0004"/><g class="kr" data-s='${JSON.stringify(u)}' style="transform:rotate(${(t&&t.rot)||0}deg)">${kPlayer({...u,v:id%5,rot:0})}</g></svg>${ov!=null?`<b class="cc-o" style="--c:${rcol(ov)}">${ov}</b>`:''}</span><span class="cc-n">${esc(p?fname(p):'?')}</span>${/bat|pit/.test(cls)&&/[좌우][타투]/.test(lab||'')?`<em class="cc-h ${/좌/.test(lab)?'l':'r'}">${esc(lab)}</em>`:''}`; return el; }
/* 오늘 기록 */
function cToday(g,k,id,isP){ const L=g.pbp; let pa=0,ab=0,h=0,hr=0,rbi=0,bb=0,so=0,outs=0,r=0,half=-1,o0=0;
  for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(x[0]!==half){ half=x[0]; o0=0; }
    if(x[1]==='SB'||x[1]==='CS'){ o0=x[3]; continue; } if(typeof x[1]!=='number')continue;
    if(isP&&x[2]===id){ outs+=Math.max(0,x[4]-o0); r+=x[6]; if(x[3]==='K')so++; if(x[3]==='BB')bb++; if(['1B','2B','3B','HR'].includes(x[3]))h++; }
    if(!isP&&x[1]===id){ pa++; if(x[3]!=='BB')ab++; if(['1B','2B','3B','HR'].includes(x[3]))h++; if(x[3]==='HR')hr++; rbi+=x[6]; }
    o0=x[4]; }
  if(isP)return outs||r||h?`${Math.floor(outs/3)}${outs%3?'.'+outs%3:''}이닝 ${r}실점 ${so}K`:'첫 등판';
  return pa?`${ab}타수 ${h}안타${hr?` ${hr}홈런`:''}${rbi?` ${rbi}타점`:''}`:'오늘 첫 타석'; }
function cMan(g,k,id,isP){ const p=G.players[id]; if(!p)return ''; const ov=scoutReport(p).cur;
  const sea=isP?`ERA ${eraAt(g,k,id)}`:(()=>{ const r=batAt(g,k,id); if(!r)return '시즌 기록 없음'; return `${fmt3(r.avg)} · ${r.hr}홈런 · OPS ${fmt3(r.ops)}`; })();
  return `<button class="cs-p" data-a="castPlayer" data-v="${id}">${avImg(p)}<span class="cs-pm"><span class="cs-pr"><i>${isP?'투수':'타자'}</i><b>${esc(p.name)}</b>${rchip(ov)}</span><span class="cs-ps">${sea}</span><span class="cs-pd">오늘 ${cToday(g,k,id,isP)}</span></span></button>`; }
function cSide(g,k){ const L=g.pbp; const v=document.getElementById('cs-vs'), lg=document.getElementById('cs-log'); if(!v)return; { const bd=document.querySelector('.cs-body'); if(bd)bd.classList.toggle('fin',k>=L.length); }
  const x=L[Math.min(k,L.length-1)]; const bid=k<L.length&&typeof x[1]==='number'?x[1]:null; const pid=cPit(g,Math.min(k,L.length-1));
  v.innerHTML=k>=L.length?(()=>{ const m=gameMvp(g); return `<div class="cs-fin"><div><b>경기 종료 · ${tshort(g.away)} ${g.as} : ${g.hs} ${tshort(g.home)}</b>${m?`<button class="mvp" data-a="castPlayer" data-v="${m.p.id}">${avImg(m.p)}<span><em>오늘의 선수</em><b>${esc(m.p.name)}</b><i>${m.p.isP?cToday(g,L.length,m.p.id,true):cToday(g,L.length,m.p.id,false)} · 승리 기여 +${Math.round(m.v*100)}%</i></span></button>`:''}</div><button class="btn small" data-a="castBox">박스스코어</button></div>${gmMemo(g)}`; })():ourStrip(g,k)+(bid?abPanel(g,k):(pid?cMan(g,k,pid,true):''));
  lg.innerHTML=L.slice(Math.max(0,k-8),k).reverse().map((y,i)=>`<p class="${i===0?'cur':''}${y[6]?' run':''}"><span>${cHalfTxt(y[0])}</span>${esc(pbpText(y))}</p>`).join('')||'<p class="muted">플레이볼</p>'; }
function cSit(st,x){ const el=document.getElementById('cs-sit'); if(!el)return; const risp=!!(st.bases[1]||st.bases[2]); const late=st.half>=16&&Math.abs(st.sa-st.sh)<=2;
  const t=risp&&st.bases[0]&&st.bases[1]&&st.bases[2]?'만루 찬스':risp?'득점권 찬스':late?'승부처':''; el.textContent=t; el.className='cs-sit'+(t&&x&&typeof x[1]==='number'?' on':''); }
function cDraw(k,ms){ const c=UI.cast; const g=G.games[c.g]; const L=g.pbp; const st=k>=L.length?{...pbpState(g,L.length-1),bases:[0,0,0]}:cBefore(g,k);
  cSync(k>=L.length?[]:cTargets(g,k,st),ms); if(k>=L.length){ st.sa=g.as; st.sh=g.hs; } cBoard(g,st,null); cSide(g,k); cSit(st,L[k]); c.wp=k>=L.length?(g.hs>g.as?1:0):wpHome(st); try{ if(k>=L.length){ const bar=document.getElementById('cs-wpa'); if(bar)bar.style.width=(c.wp*100)+'%'; const tx=document.getElementById('cs-wpt'); if(tx)tx.textContent=`${tshort(g.hs>g.as?g.home:g.away)} 승리`; } else cWp(g,st,null); }catch(e){}
  cCap(''); if(k>=L.length)cFx(`경기 종료 ${g.as} : ${g.hs}`,'end',true); else cFx(''); const pb=document.getElementById('cs-play'); if(pb)pb.textContent=c.play&&k<L.length?'일시정지':'재생'; }
/* 연출 */
function cFx(t,cls,stay){ const el=document.getElementById('cs-fx'); if(!el)return; el.className='cs-fx'; void el.offsetWidth; if(!t){ el.textContent=''; return; } el.textContent=t; el.className='cs-fx on '+(cls||'')+(stay?' stay':''); el.style.animationDuration=(1.5/cSpd())+'s'; }
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
  el.innerHTML=`<div>${badge(at,40)}<b>${cHalfTxt(half)}</b><span>${esc(tname(at))} 공격</span></div>`; el.className='cs-bn on'; sfx('bong',.55); await cSleep(850); el.className='cs-bn'; await cSleep(150); }
/* 볼 수 있는 장면 고르기 */
function cKeep(g,k,mode){ if(mode==='all')return true; const L=g.pbp; const x=L[k]; if(typeof x[1]!=='number')return false; const b=cBefore(g,k); const risp=!!(b.bases[1]||b.bases[2]);
  if(mode==='risp')return risp; return x[6]>0||['HR','3B','2B','DP'].includes(x[3])||(x[3]==='K'&&risp)||k===L.length-1||(x[4]>=3&&b.half>=16&&Math.abs(x[7]-x[8])<=1); }
function cTargets(g,k,st){ const L=g.pbp; const half=st.half; const top=half%2===0; const dT=top?g.home:g.away, oT=top?g.away:g.home;
  const dc=cTeamCol(dT), oc=cTeamCol(oT); const T=[]; const dU=cUni(g,dT), oU=cUni(g,oT);
  const gl=id=>{ const q=G.players[id]; return q&&q.th==='좌'?'R':'L'; };
  for(const f of cFielders(g,half))T.push({k:'d'+f.id,id:f.id,pt:CFP[f.pos],cls:'df'+(f.pos==='C'?' ctch':''),lab:POSS[f.pos],col:dc,u:{...dU,glove:gl(f.id)},rot:f.pos==='C'?-90:cAng(CFP[f.pos],CHM)});
  const pid=cPit(g,k); const pp=pid&&G.players[pid]; if(pid)T.push({k:'d'+pid,id:pid,pt:CFP.P,cls:'df pit'+(pp&&pp.th==='좌'?' lhp':''),lab:pp&&pp.th==='좌'?'좌투':'우투',col:dc,u:{...dU,glove:gl(pid),pose:'set'},rot:90});
  st.bases.forEach((id,i)=>{ if(id)T.push({k:'o'+id,id,pt:CBS[i],cls:'of run',lab:['1루','2루','3루'][i],col:oc,u:{...oU,helm:oU.H},rot:cAng(CBS[i],CPATH[i+2])}); });
  const x=L[k]; if(x&&typeof x[1]==='number'&&x[0]===half){ const bp=G.players[x[1]]; const side=bSide(bp,pp); T.push({k:'o'+x[1],id:x[1],pt:side==='L'?CBATL:CBAT,cls:'of bat '+(side==='L'?'lhb':'rhb'),lab:side==='L'?'좌타':'우타',col:oc,u:{...oU,helm:oU.H,bat:side},rot:side==='L'?180:0}); }
  return T; }
/* 유니폼: 홈 팀은 흰 바탕에 팀 색 테두리, 원정 팀은 팀 색 바탕. 두 팀 색이 비슷해도 구분된다 */
function cLum(h){ const n=parseInt(h.slice(1),16); return (.2126*(n>>16&255)+.7152*(n>>8&255)+.0722*(n&255))/255; }
function cUni(g,tid){ const P=tpal(G.teams[tid]); if(tid===g.home)return {S:'#f2f4f6',D:P[0],H:P[0]}; const S=cLum(P[0])<.12?P[3]:P[0]; return {S,D:P[2],H:P[2]}; }
function cAng(a,b){ return Math.round(Math.atan2((b[1]-a[1]),(b[0]-a[0]))*180/Math.PI); }
function cBoard(g,st,cnt){ const s=id=>document.getElementById(id); if(!s('cs-sa'))return;
  s('cs-sa').textContent=st.sa; s('cs-sh').textContent=st.sh; s('cs-inn').textContent=cHalfTxt(st.half);
  const dots=(id,n)=>s(id).querySelectorAll('i').forEach((el,i)=>el.classList.toggle('on',i<n));
  dots('cs-O',Math.min(2,st.outs)); s('cs-on').textContent=Math.min(3,st.outs)+'아웃';
  CBS.forEach((b,i)=>{ const el=s('cs-b'+i); if(el)el.classList.toggle('on',!!st.bases[i]); }); }
function cCap(t,cls){ const el=document.getElementById('cs-cap'); if(!el)return; el.className='cs-cap'+(t?' on':'')+(cls?' '+cls:''); el.textContent=t||''; }
/* 공 */
function cBall(from,to,ms,arc){ const b=document.getElementById('cs-ball'); if(!b)return Promise.resolve(); const d=ms/cSpd();
  const mid=[(from[0]+to[0])/2,(from[1]+to[1])/2];
  const kf=[{left:from[0]+'%',top:from[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1},{left:mid[0]+'%',top:mid[1]+'%',transform:`translate(-50%,-50%) scale(${arc?2.1:1})`,opacity:1,offset:.5},{left:to[0]+'%',top:to[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1}];
  const an=b.animate(kf,{duration:d,easing:'linear',fill:'forwards'}); return new Promise(r=>{ an.onfinish=r; an.oncancel=r; }); }
function cBallHide(){ const b=document.getElementById('cs-ball'); if(b)b.getAnimations().forEach(a=>a.cancel()); }
const cPolar=(th,d)=>[50+d*Math.sin(th*Math.PI/180),89-d*Math.cos(th*Math.PI/180)];
const cDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
async function cAnim(k){ const c=UI.cast; const g=G.games[c.g]; const L=g.pbp; const x=L[k]; const b=cBefore(g,k); const st=document.getElementById('cs-stage'); if(!st)return;
  const card=key=>st.querySelector(`.cc[data-k="${key}"]`);
  if(x[1]==='PC'){ const top=x[0]%2===0; const dug=CDUG[top?'h':'a']; const old=cPit(g,k); const oc=old&&card('d'+old);
    cCap(`투수 교체 · ${(G.players[x[2]]||{}).name||''}`); if(oc){ cPlace(oc,dug,700); oc.classList.add('gone'); }
    const ne=cCard('d'+x[2],x[2],'df','투',cTeamCol(top?g.home:g.away)); cPlace(ne,dug,0); st.appendChild(ne); ne.getBoundingClientRect(); cPlace(ne,CFP.P,900); await cSleep(1100); if(oc)oc.remove(); cCap(''); return; }
  if(x[1]==='SB'||x[1]==='CS'){ const i=b.bases.indexOf(x[2]); const el=card('o'+x[2]); cCap(x[1]==='SB'?'도루 시도':'도루 시도');
    const to=Math.min(3,i+1); cBall(CFP.P,CHM,300); await cSleep(300); cBall(CHM,CPATH[to],450); if(el)cPlace(el,CPATH[to],500); await cSleep(550);
    if(x[1]==='CS'&&el){ el.classList.add('gone'); cCap('도루 실패 · 아웃','bad'); } else cCap('도루 성공','good');
    cBoard(g,{...b,outs:x[3],bases:x[4]},null); await cSleep(700); cCap(''); cBallHide(); return; }
  /* 타석 */
  const o=x[3], rnd=mulberry((g.day*977+k*131+(g.home*7+g.away))|0); const bid=x[1]; const bat=card('o'+bid);
  const homeBat=x[0]%2===1; if(homeBat&&(b.bases[1]||b.bases[2]))sndLoop('chant','chant',.45,.5);
  if(c.mode&&c.mode!=='all')await cSleep(250);
  /* 타구 방향은 먼저 정한다(타석 장면과 필드 장면이 같은 타구를 보여주도록) */
  let spot=null, arc=false, flight=650, kind='', opos=null;
  if(o==='HR'){ const th=-38+rnd()*76; spot=cPolar(th,96); arc=true; flight=1100; kind='홈런'; }
  else if(o==='3B'){ const th=(rnd()<.5?-1:1)*(26+rnd()*14); spot=cPolar(th,70+rnd()*6); arc=true; flight=900; kind='3루타'; }
  else if(o==='2B'){ const th=(rnd()<.5?-1:1)*(10+rnd()*28); spot=cPolar(th,60+rnd()*12); arc=rnd()<.6; flight=800; kind='2루타'; }
  else if(o==='1B'){ if(rnd()<.6){ const th=-36+rnd()*72; spot=cPolar(th,44+rnd()*10); arc=rnd()<.5; } else { const th=[-28,-9,9,28][Math.floor(rnd()*4)]+rnd()*6-3; spot=cPolar(th,46); } flight=650; kind='안타'; }
  else if(o==='OUT'||o==='DP'){ const r=rnd(); const pool=o==='DP'?['SS','2B','3B','SS','2B']:r<.45?['SS','2B','3B','1B','SS','2B','P']:r<.85?['LF','CF','RF','CF']:['SS','2B','3B','1B'];
    opos=pool[Math.floor(rnd()*pool.length)]; const base=CFP[opos]; spot=[base[0]+rnd()*8-4,base[1]+rnd()*6-3]; arc=['LF','CF','RF'].includes(opos)||(r>=.85&&rnd()<.5); flight=arc?950:520; kind=arc?(['LF','CF','RF'].includes(opos)?'뜬공 아웃':'직선타 아웃'):(o==='DP'?'병살타':'땅볼 아웃'); }
  const cam=false;
  { const pc=st.querySelector('.cc.pit'); if(pc){ pc.classList.remove('th'); void pc.offsetWidth; pc.classList.add('th'); } await cSleep(220); await cBall(CFP.P,[50,88],300,false); cBallHide(); if(bat&&o!=='BB'&&!(o==='K'&&rnd()<.3)){ bat.classList.remove('sw'); void bat.offsetWidth; bat.classList.add('sw'); } }
  cCap('');
  const after=x[5], runs=x[6], outsA=x[4];
  const fieldCards=[...st.querySelectorAll('.cc.df')].filter(el=>!el.classList.contains('gone'));
  const posOf=el=>[parseFloat(el.style.left),parseFloat(el.style.top)];
  const nearest=pt=>{ let best=null,bd=1e9; for(const el of fieldCards){ const d=cDist(posOf(el),pt); if(d<bd){bd=d;best=el;} } return best; };
  /* 주자 이동 계산 */
  const isHR=o==='HR'; const batSafe=after.includes(bid)||isHR;
  const runners=b.bases.map((id,i)=>id?{id,i}:null).filter(Boolean).sort((p,q)=>q.i-p.i);
  let scoreLeft=runs-(isHR?1:0); const moves=[];
  for(const r of runners){ const j=after.indexOf(r.id); if(j>=0&&j!==r.i)moves.push({id:r.id,from:r.i,to:j}); else if(j<0){ if(scoreLeft>0){ scoreLeft--; moves.push({id:r.id,from:r.i,to:3,score:1}); } else moves.push({id:r.id,from:r.i,to:Math.min(3,r.i+1),out:1}); } }
  const bTo=isHR?4:after.indexOf(bid);
  // m.from은 베이스 번호(0=1루) → 경로 번호는 +1
  moves.forEach(m=>{ m.from=m.from+1; if(!m.out)m.to=m.score?4:m.to+1; else m.to=m.to+1; });
  const runAll2=async(per)=>Promise.all(moves.map(async m=>{ const el=card('o'+m.id); if(!el)return; for(let i=m.from+1;i<=Math.min(4,m.to);i++){ cPlace(el,CPATH[i],per); await cSleep(per); } if(m.out||m.score)el.classList.add('gone'); }));
  let cap='', cls='';
  const oc=cTeamCol(x[0]%2?g.home:g.away);
  cAbRes((PAK[o]||['',''])[0],(PAK[o]||['',''])[1]);
  if(o==='K'){ if(!cam){ sfx('mitt',.9); cFx('삼진','k'); } if(bat)bat.classList.add('gone'); await cSleep(cam?200:900); }
  else if(o==='BB'){ if(!cam)cFx('볼넷','bb'); const pr=[]; if(bat){ cPlace(bat,CBS[0],700); pr.push(cSleep(700)); } pr.push(runAll2(600)); await Promise.all(pr); }
  else {
    const fl=nearest(spot); const flFrom=fl?posOf(fl):null; const outPlay=o==='OUT'||o==='DP';
    const chaseTo=fl?(outPlay?spot:[flFrom[0]+(spot[0]-flFrom[0])*.8,flFrom[1]+(spot[1]-flFrom[1])*.8]):null;
    if(fl&&o!=='HR')cPlace(fl,chaseTo,flight*.95);
    if(!cam)sfx('crack',1,.94+rnd()*.12); cTrail([50,88],spot,arc,flight,o==='HR'?'hr':outPlay?'out':'hit'); const pr=[cBall([50,88],spot,flight,arc)];
    if(bat&&bTo>=1){ pr.push((async()=>{ for(let i=1;i<=Math.min(4,bTo);i++){ cPlace(bat,CPATH[i],o==='HR'?520:560); await cSleep(o==='HR'?520:560); } if(bTo>=4)bat.classList.add('gone'); })()); }
    else if(bat){ pr.push((async()=>{ cPlace(bat,[(CHM[0]+CBS[0][0])/2,(CHM[1]+CBS[0][1])/2],600); await cSleep(600); })()); }
    pr.push(runAll2(o==='HR'?520:560));
    await Promise.all([pr[0]]);
    if(outPlay)sfx('mitt',.55); else if(o!=='HR')sfx('cheer_hit',homeBat?.85:.3);
    if(o==='HR'){ sfx('cheer_big',homeBat?1:.45); if(homeBat)setTimeout(()=>organ(ORG_CHARGE,.2),600/cSpd()); buzz(90); cFlash(); cBurst(spot,oc,28); cFx(runs===4?'만루 홈런':runs>1?`${runs}점 홈런`:'홈런','hr'); }
    else if(o==='DP')cFx('병살','bad'); else if(['2B','3B'].includes(o))cFx(kind,'xb');
    if(outPlay){ if(o==='DP'){ await cBall(spot,CBS[1],380,false); await cBall(CBS[1],CBS[0],380,false); } else if(!arc){ await cBall(spot,CBS[0],420,false); } if(!batSafe&&bat)bat.classList.add('gone'); }
    else if(o!=='HR'&&fl){ await cSleep(150); await cBall(spot,CBS[1],480,false); }
    await Promise.all(pr.slice(1));
    if(o!=='HR'&&o!=='DP'&&!['2B','3B'].includes(o))cFx(runs?`${kind} +${runs}`:kind,runs?'run':outPlay?'out':'hit'); else if(runs&&o!=='HR')cCap(`+${runs}점`,'good'); }
  cBallHide();
  const st2={sa:x[7],sh:x[8],outs:outsA,bases:outsA>=3?[0,0,0]:after,half:x[0]};
  sndStop('chant',.9); if(runs){ cScorePop(x[0]%2?'h':'a'); cBurst(CHM,oc,12); if(o==='OUT'||o==='BB')sfx('cheer_hit',homeBat?.6:.25); }
  cBoard(g,st2,null); { const prev=c.wp; const s3=outsA>=3?{...st2,half:x[0]+1,outs:0,bases:[0,0,0]}:st2; const w=k===L.length-1?(g.hs>g.as?1:0):wpHome(s3); c.wp=cWp(g,s3,prev)??w; if(prev!=null&&Math.abs(w-prev)>=.18&&k<L.length-1){ cCap(`승부를 흔든 한 방 · 승리 확률 ${Math.round(Math.abs(w-prev)*100)}%p 이동`,'good'); } }
  await cSleep(runs?1300:850); cCap(''); }
async function castLoop(){ if(CT.run)return; CT.run=true; const my=CT.tok;
  if(UI.cast&&UI.cast.play)sndLoop('amb','amb',.4,1.2);
  try{ while(UI.cast&&UI.cast.play&&my===CT.tok){ const c=UI.cast; const g=G.games[c.g]; const L=g.pbp; if(c.k>=L.length){ c.play=false; cDraw(c.k,300); sndStop('amb',1.8); sndStop('chant',.5); siren(); if(g.hs>g.as)sfx('cheer_big',.8); if(g.res==='승'){ setTimeout(()=>organ(ORG_WIN,.18),900); } break; }
      const x=L[c.k]; const md=c.mode||'all'; if(md!=='all'&&!cKeep(g,c.k,md)){ c.k++; continue; }
      cDraw(c.k,md==='all'?300:0); await cSleep(md==='all'?260:200);
      if(c.lastHalf!==x[0]){ c.lastHalf=x[0]; await cBanner(g,x[0]); }
      await cAnim(c.k); c.k++; } }
  catch(e){} finally{ if(my===CT.tok)CT.run=false; } }
function castMount(){ const c=UI.cast; if(!c)return; CT.tok++; CT.run=false; requestAnimationFrame(()=>{ cDraw(c.k,0); if(c.play)castLoop(); }); }
function castJump(k,play){ const c=UI.cast; const L=G.games[c.g].pbp; c.k=clamp(k,0,L.length); c.lastHalf=null; CT.tok++; CT.run=false; cBallHide(); cTrailClear(); cDraw(c.k,250); if(play!=null)c.play=play; if(c.play&&c.k<L.length)castLoop(); else { sndStop('amb'); sndStop('chant'); const pb=document.getElementById('cs-play'); if(pb)pb.textContent='재생'; } }

