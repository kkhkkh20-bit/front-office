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
  const crowd=(()=>{ const r=mulberry(g.day*31+g.home); let o=''; for(let i=0;i<950;i++){ const a=Math.PI*(1.0+r()*1.0), rr=50+r()*30; /* 기본 만석 */ const x=50+Math.cos(a)*rr*1.05, y=89+Math.sin(a)*rr*1.12; if(y>44&&(x>14&&x<86))continue; if(y>58)continue; const v=r(); const col=v<.3?hc:v<.4?ac:v<.6?'#c9d1d8':v<.8?'#6b7680':'#3b444d'; o+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.36+r()*.22).toFixed(2)}" fill="${col}" opacity="${(.62+r()*.38).toFixed(2)}"/>`; } return o; })();
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
  const sp=c.spd||1, md=c.mode==='all'?'all':'hl'; /* 기본은 하이라이트, 득점권 모드는 없앴다 */
  return `<div class="cast" data-g="${c.g}" role="dialog" aria-label="그래픽 중계">
  <div class="cs-top">
    <div class="cs-board"><span class="cs-tm">${badge(g.away,24)}<i>${esc(tshort(g.away))}</i><b id="cs-sa">0</b></span><span class="cs-mid"><b id="cs-inn">1회초</b><span class="cs-cnt"><span id="cs-O"><i></i><i></i></span><em id="cs-on">0아웃</em></span></span><span class="cs-tm r"><b id="cs-sh">0</b><i>${esc(tshort(g.home))}</i>${badge(g.home,24)}</span></div>
    <div class="cs-wpw"><div class="cs-wp"><span class="wa" style="background:${ac}"></span><i id="cs-wpa" style="background:${hc}"></i><span class="cs-wpt" id="cs-wpt"></span></div></div>
    <button class="x" style="margin-left:auto" data-a="castClose" aria-label="중계 닫기">×</button></div>
  <div class="cs-body"><div class="cs-stage" id="cs-stage">${fieldBg}<svg class="cs-trail" id="cs-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg><div class="cs-shd" id="cs-shd"></div><div class="cs-ball" id="cs-ball"></div><div class="cs-pitch" id="cs-pitch" aria-live="polite"></div><div class="cs-sit" id="cs-sit"></div><div class="cs-cap" id="cs-cap"></div><div class="cs-fx" id="cs-fx"></div><div class="cs-flash" id="cs-flash"></div><div class="cs-bn" id="cs-bn"></div></div>
    <div class="cs-side"><div class="cs-vs" id="cs-vs"></div><div class="cs-log" id="cs-log"></div></div></div>
  <div class="cs-ctl"><div class="cs-mode">${[['hl','하이라이트'],['all','전체 보기']].map(([k,l])=>`<button data-a="castMode" data-v="${k}" class="${md===k?'on':''}">${l}</button>`).join('')}</div>
    <div class="cs-btns"><button data-a="castStep" data-v="-1" aria-label="이전 타석">◀</button><button data-a="castStep" data-v="1" aria-label="다음 타석">▶</button><button data-a="castSpd" id="cs-spd">${sp}배속</button><button data-a="castEnd">결과 바로 보기</button><button class="pri" data-a="castClose">나가기</button></div></div>
  </div>`; }
/* 필드 카드: 얼굴 + 이름 + 능력치 하나 */
function cCard(key,id,cls,lab,col,t){ const p=G.players[id]; const el=document.createElement('button'); el.className='cc '+cls; el.dataset.k=key; el.dataset.a='castPlayer'; el.dataset.v=id; el.style.setProperty('--tc',col);
  const ov=p&&/bat|pit/.test(cls)?scoutReport(p).cur:null; const u=(t&&t.u)||{S:col,D:'#0008'};
  el.innerHTML=`<span class="cc-f"><svg class="kp" viewBox="-24 -24 48 48" aria-hidden="true"><ellipse cx="1.5" cy="2.5" rx="15" ry="13" fill="#0004"/><g class="kr" data-s='${JSON.stringify(u)}' style="transform:rotate(${(t&&t.rot)||0}deg)">${kPlayer({...u,v:id%5,rot:0})}</g></svg>${ov!=null?`<b class="cc-o" style="--c:${rcol(ov)}">${dv(ov)}</b>`:''}</span><span class="cc-n">${esc(p?fname(p):'?')}</span>${/bat|pit/.test(cls)&&/[좌우][타투]/.test(lab||'')?`<em class="cc-h ${/좌/.test(lab)?'l':'r'}">${esc(lab)}</em>`:''}`; return el; }
/* 오늘 기록 */
function cToday(g,k,id,isP){ const L=g.pbp; let pa=0,ab=0,h=0,hr=0,rbi=0,bb=0,so=0,outs=0,r=0,half=-1,o0=0,cp=null;
  for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(x[0]!==half){ half=x[0]; o0=0; }
    if(x[1]==='PC'){ cp=x[2]; continue; } if(x[1]==='SB'||x[1]==='CS'){ if(isP&&x[1]==='CS'&&cp===id)outs+=Math.max(0,x[3]-o0); o0=x[3]; continue; } if(typeof x[1]!=='number')continue; cp=x[2];
    if(isP&&Array.isArray(x[10]))r+=x[10].filter(z=>z===id).length;
    if(isP&&x[2]===id){ outs+=Math.max(0,x[4]-o0); if(!Array.isArray(x[10]))r+=x[6]; if(x[3]==='K')so++; if(x[3]==='BB')bb++; if(['1B','2B','3B','HR'].includes(x[3]))h++; }
    if(!isP&&x[1]===id){ pa++; if(x[3]!=='BB'&&x[3]!=='SAC')ab++; if(['1B','2B','3B','HR'].includes(x[3]))h++; if(x[3]==='HR')hr++; rbi+=x[12]!=null?x[12]:x[6]; }
    o0=x[4]; }
  if(isP)return outs||r||h?`${Math.floor(outs/3)}${outs%3?'.'+outs%3:''}이닝 ${r}실점 ${so}K`:'첫 등판';
  return pa?`${ab}타수 ${h}안타${hr?` ${hr}홈런`:''}${rbi?` ${rbi}타점`:''}`:'오늘 첫 타석'; }
function cMan(g,k,id,isP){ const p=G.players[id]; if(!p)return ''; const ov=scoutReport(p).cur;
  const sea=isP?`ERA ${eraAt(g,k,id)}`:(()=>{ const r=batAt(g,k,id); if(!r)return '시즌 기록 없음'; return `${fmt3(r.avg)} · ${r.hr}홈런 · OPS ${fmt3(r.ops)}`; })();
  return `<button class="cs-p" data-a="castPlayer" data-v="${id}">${avImg(p)}<span class="cs-pm"><span class="cs-pr"><i>${isP?'투수':'타자'}</i><b>${esc(p.name)}</b>${rchip(ov)}</span><span class="cs-ps">${sea}</span><span class="cs-pd">오늘 ${cToday(g,k,id,isP)}</span></span></button>`; }
function cSide(g,k){ const L=g.pbp; const v=document.getElementById('cs-vs'), lg=document.getElementById('cs-log'); if(!v)return; { const bd=document.querySelector('.cs-body'); if(bd)bd.classList.toggle('fin',k>=L.length); }
  const x=L[Math.min(k,L.length-1)]; const bid=k<L.length&&typeof x[1]==='number'?x[1]:null; const pid=cPit(g,Math.min(k,L.length-1));
  v.innerHTML=k>=L.length?(()=>{ const m=gameMvp(g); return `<div class="cs-fin"><div><b>경기 종료 · ${tshort(g.away)} ${g.as} : ${g.hs} ${tshort(g.home)}</b>${m?`<button class="mvp" data-a="castPlayer" data-v="${m.p.id}">${avImg(m.p)}<span><em>오늘의 선수</em><b>${esc(m.p.name)}</b><i>${m.p.isP?cToday(g,L.length,m.p.id,true):cToday(g,L.length,m.p.id,false)} · 승리 기여 +${Math.round(m.v*100)}%</i></span></button>`:''}</div><button class="btn small" data-a="castBox">박스스코어</button></div>${gmMemo(g)}`; })():ourStrip(g,k)+(bid?abPanel(g,k):(pid?cMan(g,k,pid,true):''));
  lg.innerHTML=L.slice(Math.max(0,k-8),k).reverse().map((y,i)=>{ const cl=pbpCall(g,k-1-i); return `<p class="${i===0?'cur':''}${y[6]?' run':''}"><span>${cHalfTxt(y[0])}</span>${esc(cl.c)}${i===0&&cl.a?`<em class="pc-an2">해설: ${esc(cl.a)}</em>`:''}</p>`; }).join('')||'<p class="muted">플레이볼</p>'; }
function cSit(st,x){ const el=document.getElementById('cs-sit'); if(!el)return; const risp=!!(st.bases[1]||st.bases[2]); const late=st.half>=16&&Math.abs(st.sa-st.sh)<=2;
  const t=risp&&st.bases[0]&&st.bases[1]&&st.bases[2]?'만루 찬스':risp?'득점권 찬스':late?'승부처':''; el.textContent=t; el.className='cs-sit'+(t&&x&&typeof x[1]==='number'?' on':''); }
function cDraw(k,ms){ const c=UI.cast; const g=G.games[c.g]; const L=g.pbp; const st=k>=L.length?{...pbpState(g,L.length-1),bases:[0,0,0]}:cBefore(g,k);
  cSync(k>=L.length?[]:cTargets(g,k,st),ms); if(k>=L.length){ st.sa=g.as; st.sh=g.hs; } cBoard(g,st,null); cSide(g,k); cSit(st,L[k]); c.wp=k>=L.length?(g.hs>g.as?1:0):wpHome(st); try{ if(k>=L.length){ const bar=document.getElementById('cs-wpa'); if(bar)bar.style.width=(c.wp*100)+'%'; const tx=document.getElementById('cs-wpt'); if(tx)tx.textContent=`${tshort(g.hs>g.as?g.home:g.away)} 승리`; } else cWp(g,st,null); }catch(e){}
  cCap(''); { const pe=document.getElementById('cs-pitch'); if(pe)pe.className='cs-pitch'; } if(k>=L.length)cFx(`경기 종료 ${g.as} : ${g.hs}`,'end',true); else cFx(''); const pb=document.getElementById('cs-play'); if(pb)pb.textContent=c.play&&k<L.length?'일시정지':'재생'; }
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
  const x=L[k]; if(x&&typeof x[1]==='number'&&x[0]===half){ const bp=G.players[x[1]]; const side=bSide(bp,pp); T.push({k:'o'+x[1],id:x[1],pt:side==='L'?CBATL:CBAT,cls:'of bat '+(side==='L'?'lhb':'rhb'),lab:side==='L'?'좌타':'우타',col:oc,u:{...oU,helm:oU.H,bat:side},rot:0}); }
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
/* 공: arc=뜬공(가운데서 커지고 바닥에 그림자), gb=땅볼(작게 튀며 굴러감), 그 밖은 직선(라인드라이브·송구) */
function cBall(from,to,ms,arc,gb){ const b=document.getElementById('cs-ball'); if(!b)return Promise.resolve(); const d=ms/cSpd();
  const P=(f)=>[from[0]+(to[0]-from[0])*f,from[1]+(to[1]-from[1])*f]; let kf;
  if(arc){ const mid=P(.5); kf=[{left:from[0]+'%',top:from[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1},{left:mid[0]+'%',top:(mid[1]-cDist(from,to)*.18)+'%',transform:'translate(-50%,-50%) scale(2.2)',opacity:1,offset:.5},{left:to[0]+'%',top:to[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1}];
    const sh=document.getElementById('cs-shd'); if(sh)sh.animate([{left:from[0]+'%',top:from[1]+'%',opacity:.15,transform:'translate(-50%,-50%) scale(.6)'},{left:P(.5)[0]+'%',top:P(.5)[1]+'%',opacity:.45,transform:'translate(-50%,-50%) scale(1.3)',offset:.5},{left:to[0]+'%',top:to[1]+'%',opacity:.6,transform:'translate(-50%,-50%) scale(.9)'}],{duration:d,easing:'linear',fill:'forwards'}).onfinish=function(){ sh.getAnimations().forEach(a=>a.cancel()); }; }
  else if(gb){ kf=[0,.18,.32,.5,.62,.8,1].map((f,i)=>{ const q=P(f); return {left:q[0]+'%',top:(q[1]-(i%2?1.2*(1-f):0))+'%',transform:`translate(-50%,-50%) scale(${i%2?1.25:1})`,opacity:1,offset:f}; }); }
  else kf=[{left:from[0]+'%',top:from[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1},{left:to[0]+'%',top:to[1]+'%',transform:'translate(-50%,-50%) scale(1)',opacity:1}];
  const an=b.animate(kf,{duration:d,easing:gb?'ease-out':'linear',fill:'forwards'}); return new Promise(r=>{ an.onfinish=r; an.oncancel=r; }); }
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
  let spot=null, arc=false, flight=650, kind='', opos=null; c.gb=false; c.errPos=null;
  if(o==='HR'){ const th=-38+rnd()*76; spot=cPolar(th,96); arc=true; flight=1100; kind='홈런'; }
  else if(o==='3B'){ const th=(rnd()<.5?-1:1)*(26+rnd()*14); spot=cPolar(th,70+rnd()*6); arc=true; flight=900; kind='3루타'; }
  else if(o==='2B'){ const th=(rnd()<.5?-1:1)*(10+rnd()*28); spot=cPolar(th,60+rnd()*12); arc=rnd()<.6; flight=800; kind='2루타'; }
  else if(o==='1B'){ c.gb=false; if(rnd()<.6){ const th=-36+rnd()*72; spot=cPolar(th,44+rnd()*10); arc=rnd()<.5; } else { const th=[-28,-9,9,28][Math.floor(rnd()*4)]+rnd()*6-3; spot=cPolar(th,46); c.gb=true; } flight=650; kind='안타'; }
  else if(o==='SAC'){ opos=['P','3B','1B'][Math.floor(rnd()*3)]; const base=CFP[opos]; spot=[base[0]+rnd()*4-2,base[1]+rnd()*6]; arc=false; flight=420; kind='희생번트'; }
  else if(o==='OUT'||o==='DP'){ /* 해설과 같은 결정(어느 야수 쪽, 땅볼·뜬공·직선타)을 그대로 쓴다 */
    const pk=(t,a)=>{ try{ return pcPick(g,k,t,a); }catch(e){ return a[0]; } }; const H=t=>{ try{ return pcH(g,k,t); }catch(e){ return rnd(); } };
    const half=x[0]; const ePos=(()=>{ try{ return pcErrPos(g,k); }catch(e){ return null; } })(); const batSafe0=x[5].includes(x[1]);
    let typ='gb'; if(o==='DP'){ opos=pk('dp',[['SS','2B','6-4-3'],['2B','SS','4-6-3'],['3B','2B','5-4-3']])[0]; }
    else if(batSafe0){ opos=ePos||pk('ep',['SS','3B','2B']); typ='err'; }
    else if(x[6]>0){ opos=pk('sf',['LF','CF','RF']); typ='fly'; }
    else { const pp=G.players[x[2]]; const r=H('ot'), gbB=pp?gbT(pp)*.08:0; if(r<.45+gbB)opos=pk('gp',['SS','2B','3B','1B','SS','2B','P']); else if(r<.85){ opos=pk('fp',['LF','CF','RF','CF']); typ='fly'; } else { opos=pk('lp',['SS','2B','3B','1B']); typ='ld'; } }
    const base=CFP[opos]||CFP.SS; spot=[base[0]+rnd()*6-3,base[1]+rnd()*5-2.5]; const ofE=typ==='err'&&['LF','CF','RF'].includes(opos); arc=typ==='fly'||ofE; c.gb=typ==='gb'||(typ==='err'&&!ofE); c.errPos=typ==='err'?opos:null; flight=arc?950:typ==='ld'?380:560;
    kind=typ==='fly'?(x[6]>0?'희생플라이':'뜬공 아웃'):typ==='ld'?'직선타 아웃':typ==='err'?'실책':(o==='DP'?'병살타':'땅볼 아웃'); }
  const cam=false;
  { const seq=cPitchSeq(g,k); const pe=document.getElementById('cs-pitch'); const fast=c.mode&&c.mode!=='all'; const show=fast?Math.min(2,seq.length):seq.length;
    const throwOne=async(q,i,last)=>{ const pc=st.querySelector('.cc.pit'); if(pc){ pc.classList.remove('th'); void pc.offsetWidth; pc.classList.add('th'); } await cSleep(fast?150:220); await cBall(CFP.P,[50,88],fast?240:300,false); cBallHide();
      const sw=last?(o!=='BB'&&!/루킹/.test(q.res)):/헛스윙|파울/.test(q.res); if(bat&&sw){ bat.classList.remove('sw'); void bat.offsetWidth; bat.classList.add('sw'); }
      if(pe){ pe.innerHTML=cPitchTxt(q,i); pe.className='cs-pitch on'; } if(!last){ if(q.res==='파울')sfx('crack',.25,1.3); else sfx('mitt',.35); await cSleep(fast?230:420); } };
    for(let i=0;i<seq.length;i++){ const last=i===seq.length-1; if(i<seq.length-show){ continue; } await throwOne(seq[i],i,last); }
    if(!seq.length){ await cSleep(220); await cBall(CFP.P,[50,88],300,false); cBallHide(); } }
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
    const fl=nearest(spot); const flFrom=fl?posOf(fl):null; const outPlay=o==='OUT'||o==='DP'||o==='SAC';
    const chaseTo=fl?(outPlay?spot:[flFrom[0]+(spot[0]-flFrom[0])*.8,flFrom[1]+(spot[1]-flFrom[1])*.8]):null;
    if(fl&&o!=='HR')cPlace(fl,chaseTo,flight*.95);
    if(!cam)sfx('crack',1,.94+rnd()*.12); cTrail([50,88],spot,arc,flight,(o==='HR'?'hr':outPlay&&!c.errPos?'out':'hit')+(c.gb?' gb':'')); const pr=[cBall([50,88],spot,flight,arc,c.gb)];
    if(bat&&bTo>=1){ pr.push((async()=>{ for(let i=1;i<=Math.min(4,bTo);i++){ cPlace(bat,CPATH[i],o==='HR'?520:560); await cSleep(o==='HR'?520:560); } if(bTo>=4)bat.classList.add('gone'); })()); }
    else if(bat){ pr.push((async()=>{ cPlace(bat,[(CHM[0]+CBS[0][0])/2,(CHM[1]+CBS[0][1])/2],600); await cSleep(600); })()); }
    pr.push(runAll2(o==='HR'?520:560));
    await Promise.all([pr[0]]);
    if(c.errPos){ if(fl){ fl.classList.add('err'); setTimeout(()=>fl.classList.remove('err'),1600/cSpd()); } cFx('실책','bad'); sfx('cheer_hit',homeBat?.7:.25); } else if(outPlay)sfx('mitt',.55); else if(o!=='HR')sfx('cheer_hit',homeBat?.85:.3);
    if(o==='HR'){ sfx('cheer_big',homeBat?1:.45); if(homeBat)setTimeout(()=>organ(ORG_CHARGE,.2),600/cSpd()); buzz(90); cFlash(); cBurst(spot,oc,28); cFx(runs===4?'만루 홈런':runs>1?`${runs}점 홈런`:'홈런','hr'); }
    else if(o==='DP')cFx('병살','bad'); else if(['2B','3B'].includes(o))cFx(kind,'xb');
    if(outPlay&&!c.errPos){ if(o==='DP'){ await cBall(spot,CBS[1],380,false); await cBall(CBS[1],CBS[0],380,false); } else if(!arc){ await cBall(spot,CBS[0],420,false); } if(!batSafe&&bat)bat.classList.add('gone'); }
    else if(o!=='HR'&&fl){ await cSleep(150); await cBall(spot,CBS[1],480,false); }
    await Promise.all(pr.slice(1));
    if(c.errPos){ const ef=G.players[x[9]]; cCap(`${POSK[c.errPos]||''} ${ef?ef.name:''} 실책 · 타자 출루`,'bad'); }
    else if(o!=='HR'&&o!=='DP'&&!['2B','3B'].includes(o))cFx(runs?`${kind} +${runs}`:kind,runs?'run':outPlay?'out':'hit'); else if(runs&&o!=='HR')cCap(`+${runs}점`,'good'); }
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


/* ---------- 투구 연출: 타석 결과에 맞는 볼카운트 순서를 투수의 실제 구종표로 만든다(해설과 같은 결정을 쓴다) ---------- */
function cPitchSpd(p,t,r){ const v=veloOf(p), vm=veloMax(p); const off={'직구':0,'투심':-3,'커터':-5,'슬라이더':-12,'스위퍼':-14,'체인지업':-15,'포크':-13,'커브':-22}[t]??-10; return Math.min(vm,Math.round(v+off+(r()-.5)*4)); }
function cPitchSeq(g,k){ const x=g.pbp[k]; if(!x||typeof x[1]!=='number')return []; const p=G.players[x[2]]; if(!p)return []; const o=x[3]; const r=mulberry((g.day*613+k*97+(x[1]||0))|0);
  let ars=['직구']; try{ ars=arsenal(p,p.r.stf).map(a=>a[0]); }catch(e){} const best=(()=>{ try{ return pcBest(p)||ars[ars.length-1]; }catch(e){ return ars[ars.length-1]; } })();
  const pickT=(fin)=>fin&&r()<.6?best:r()<.5?'직구':ars[Math.floor(r()*ars.length)];
  let bN, sN; if(o==='BB'){ bN=3; let ph=''; try{ ph=pcPick(g,k,'bb',['볼넷으로 걸어 나갑니다.','풀카운트 끝에 볼넷.','공 네 개가 모두 빠집니다. 스트레이트 볼넷.','끈질기게 커트하더니 볼넷을 얻어 냅니다.']); }catch(e){} sN=/스트레이트/.test(ph)?0:/풀카운트|커트/.test(ph)?2:Math.floor(r()*3); }
  else if(o==='K'){ sN=2; bN=[0,0,1,1,2,3][Math.floor(r()*6)]; } else { bN=[0,0,1,1,2,3][Math.floor(r()*6)]; sN=Math.floor(r()*3); }
  const pre=[...Array(bN).fill('B'),...Array(sN).fill('S')].sort(()=>r()-.5); let fouls=sN===2&&o!=='BB'?Math.floor(r()*3):0; if(o==='BB'&&sN===2)fouls=1+Math.floor(r()*3);
  const out=[]; let b=0,s=0; const add=(res,fin)=>{ const t=pickT(fin); out.push({t,v:cPitchSpd(p,t,r),res,b,s}); };
  for(const e of pre){ if(e==='B'){ add('볼'); b++; } else { add(r()<.5?'스트라이크':'헛스윙'); s++; } }
  for(let i=0;i<fouls;i++)add('파울');
  let look=false; try{ look=pcH(g,k,'kl')<.28; }catch(e){}
  const fin=o==='K'?(look?'루킹 삼진':'헛스윙 삼진'):o==='BB'?'볼넷':o==='SAC'?'번트':'타격';
  add(fin,o==='K'); if(o==='K'&&!look){ try{ if(pcH(g,k,'kb')<.6)out[out.length-1].t=best; }catch(e){} out[out.length-1].v=cPitchSpd(p,out[out.length-1].t,r); }
  return out; }
function cPitchTxt(q,i){ return `<b>${q.b}-${q.s}</b> ${i+1}구 ${q.t} ${q.v}km · <em class="${/볼|볼넷/.test(q.res)?'pb':/타격|번트/.test(q.res)?'pi':'ps'}">${q.res}</em>`; }
