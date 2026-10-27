/* 타석 장면: 옆에서 본 픽토그램 선수(관절 인형)로 투구·스윙을 보여준다 */
/* 좌표: 발바닥 y=0, 앞(+x)=상대 쪽. 포즈는 엉덩이 위치·몸통 기울기·손/발 목표점으로 정하고 무릎·팔꿈치는 역기구학으로 푼다 */
const RIG={th:19,sh:19,ua:13,fa:13,to:24};
function rIK(rx,ry,tx,ty,l1,l2,bend){ let dx=tx-rx, dy=ty-ry; let d=Math.hypot(dx,dy)||.001; const mx=l1+l2-.01, mn=Math.abs(l1-l2)+.01; if(d>mx){ tx=rx+dx/d*mx; ty=ry+dy/d*mx; d=mx; } if(d<mn)d=mn;
  const a=Math.atan2(ty-ry,tx-rx), c=Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))), b=a+bend*Math.acos(c);
  return [rx+l1*Math.cos(b),ry+l1*Math.sin(b),tx,ty]; }
/* 포즈 보간 */
function rLerp(a,b,t){ const o={}; for(const k in a){ const x=a[k], y=b[k]; o[k]=Array.isArray(x)?x.map((v,i)=>v+((y?y[i]:v)-v)*t):typeof x==='number'?x+((y??x)-x)*t:x; } return o; }
const rEase=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
/* 포즈 → 관절 좌표 */
function rSolve(P){ const hx=P.hip[0], hy=P.hip[1], t=P.t*Math.PI/180; const sx=hx+Math.sin(t)*RIG.to, sy=hy-Math.cos(t)*RIG.to;
  const head=[sx+Math.sin(t)*9, sy-Math.cos(t)*9];
  const leg=(f,bend)=>rIK(hx,hy,f[0],f[1],RIG.th,RIG.sh,bend);
  const arm=(h,bend)=>rIK(sx,sy,sx+h[0],sy+h[1],RIG.ua,RIG.fa,bend);
  return {hip:[hx,hy],sh:[sx,sy],head,lf:leg(P.ff,-1),lb:leg(P.fb,-1),af:arm(P.hf,P.ef??1),ab:arm(P.hb,P.eb??1),t}; }
/* 그리기: 뒤쪽 팔다리는 어둡게, 몸통·앞쪽은 유니폼 색 */
function rDraw(J,P,u){ const ln=(a,b,c,w)=>`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}${c?`L${c[0].toFixed(1)} ${c[1].toFixed(1)}`:''}" stroke="${w[0]}" stroke-width="${w[1]}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const limb=(root,j,col,w)=>ln(root,[j[0],j[1]],[j[2],j[3]],[col,w]);
  const o=[];
  o.push(limb(J.sh,J.ab,u.dk,6.2)); o.push(limb(J.hip,J.lb,u.pd,7));
  if(u.bat&&P.bat!=null){ const hd=[J.af[2],J.af[3]], a=P.bat*Math.PI/180; o.push(`<path d="M${hd[0].toFixed(1)} ${hd[1].toFixed(1)}l${(Math.cos(a)*34).toFixed(1)} ${(Math.sin(a)*34).toFixed(1)}" stroke="#d9b27a" stroke-width="3.6" stroke-linecap="round"/><path d="M${(hd[0]+Math.cos(a)*16).toFixed(1)} ${(hd[1]+Math.sin(a)*16).toFixed(1)}l${(Math.cos(a)*18).toFixed(1)} ${(Math.sin(a)*18).toFixed(1)}" stroke="#c99a5c" stroke-width="5" stroke-linecap="round"/>`); }
  o.push(ln(J.hip,J.sh,null,[u.jr,11])); o.push(limb(J.hip,J.lf,u.pn,7.4));
  const hr=6.6; o.push(`<circle cx="${J.head[0].toFixed(1)}" cy="${J.head[1].toFixed(1)}" r="${hr}" fill="${u.sk}"/>`);
  const ca=J.t; const cx=J.head[0], cy=J.head[1];
  if(u.helm)o.push(`<path d="M${(cx-hr-.6).toFixed(1)} ${(cy+1).toFixed(1)}a${hr+.6} ${hr+.6} 0 0 1 ${(2*hr+1.2).toFixed(1)} 0h3z" fill="${u.cap}" transform="rotate(${(ca*180/Math.PI).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`);
  else if(u.mask)o.push(`<path d="M${(cx-hr-.4).toFixed(1)} ${(cy-1).toFixed(1)}a${hr+.4} ${hr+.4} 0 0 1 ${(2*hr+.8).toFixed(1)} 0z" fill="${u.cap}"/><rect x="${(cx+2).toFixed(1)}" y="${(cy-4).toFixed(1)}" width="6" height="9" rx="2" fill="none" stroke="#222" stroke-width="1.6"/>`);
  else o.push(`<path d="M${(cx-hr).toFixed(1)} ${(cy-1).toFixed(1)}a${hr} ${hr} 0 0 1 ${(2*hr).toFixed(1)} 0h4.5v1.6h-${(2*hr+4.5).toFixed(1)}z" fill="${u.cap}" transform="rotate(${(ca*180/Math.PI).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`);
  o.push(limb(J.sh,J.af,u.jr,6.6));
  if(u.glove){ const g=u.glove==='b'?J.ab:J.af; o.push(`<circle cx="${g[2].toFixed(1)}" cy="${g[3].toFixed(1)}" r="${u.mitt?5.4:4.4}" fill="#8a5a2b" stroke="#4a2c12" stroke-width="1"/>`); }
  if(P.ball){ const g=P.ball==='b'?J.ab:J.af; o.push(`<circle cx="${g[2].toFixed(1)}" cy="${g[3].toFixed(1)}" r="2.2" fill="#fff"/>`); }
  return o.join(''); }

/* 포즈 사전 (모두 오른쪽=앞 기준) */
const RP={
  bStance:{hip:[0,-34],t:-6,ff:[11,0],fb:[-11,0],hf:[-4,4],hb:[-6,2],ef:1,eb:1,bat:-110},
  bLoad:{hip:[-3,-35],t:-10,ff:[6,-5],fb:[-12,0],hf:[-9,2],hb:[-10,0],ef:1,eb:1,bat:-125},
  bStride:{hip:[3,-32],t:-4,ff:[17,0],fb:[-11,0],hf:[-9,4],hb:[-10,3],ef:1,eb:1,bat:-120},
  bContact:{hip:[6,-32],t:6,ff:[17,0],fb:[-8,-2],hf:[17,8],hb:[15,9],ef:-1,eb:-1,bat:-8},
  bFollow:{hip:[6,-33],t:2,ff:[17,0],fb:[-3,-5],hf:[-2,-15],hb:[-4,-13],ef:-1,eb:-1,bat:-150},
  bTake:{hip:[3,-32],t:-4,ff:[17,0],fb:[-11,0],hf:[-7,6],hb:[-8,5],ef:1,eb:1,bat:-100},
  bDrop:{hip:[2,-35],t:0,ff:[10,0],fb:[-8,0],hf:[4,22],hb:[-2,22],ef:1,eb:1,bat:80},
  pSet:{hip:[0,-35],t:0,ff:[9,0],fb:[-8,0],hf:[6,9],hb:[5,10],ef:-1,eb:-1,ball:'b'},
  pKick:{hip:[-2,-37],t:-6,ff:[4,-20],fb:[-6,0],hf:[5,8],hb:[4,9],ef:-1,eb:-1,ball:'b'},
  pStride:{hip:[8,-31],t:4,ff:[26,0],fb:[-12,0],hf:[16,2],hb:[-22,-2],ef:-1,eb:1,ball:'b'},
  pCock:{hip:[13,-30],t:14,ff:[27,0],fb:[-9,-1],hf:[14,8],hb:[-10,-18],ef:-1,eb:1,ball:'b'},
  pRelease:{hip:[17,-29],t:30,ff:[27,0],fb:[-4,-3],hf:[4,14],hb:[16,-10],ef:-1,eb:-1,ball:'b'},
  pFollow:{hip:[19,-28],t:46,ff:[27,0],fb:[6,-10],hf:[2,16],hb:[12,20],ef:-1,eb:-1},
  cSquat:{hip:[0,-15],t:18,ff:[7,0],fb:[-7,0],hf:[16,6],hb:[6,12],ef:1,eb:1},
  cCatch:{hip:[0,-15],t:18,ff:[7,0],fb:[-7,0],hf:[17,0],hb:[6,12],ef:1,eb:1},
  cThrow:{hip:[0,-30],t:5,ff:[9,0],fb:[-8,0],hf:[10,6],hb:[-6,-14],ef:-1,eb:1},
  uSet:{hip:[0,-27],t:28,ff:[8,0],fb:[-8,0],hf:[9,18],hb:[6,19],ef:1,eb:1},
  uPunch:{hip:[0,-34],t:4,ff:[8,0],fb:[-8,0],hf:[2,14],hb:[-18,-10],ef:1,eb:1},
  uStand:{hip:[0,-35],t:0,ff:[6,0],fb:[-6,0],hf:[3,22],hb:[-2,22],ef:1,eb:1},
};
/* 한 인물: 위치·좌우·크기·유니폼 + 포즈 재생기 */
function rFig(id,x,y,s,flip,u,pose){ return {id,x,y,s,flip,u,cur:{...RP[pose]},q:[],t0:0}; }
function rFigSvg(f){ const J=rSolve(f.cur); return `<g id="${f.id}" transform="translate(${f.x} ${f.y}) scale(${f.flip?-f.s:f.s} ${f.s})"><ellipse cx="0" cy="1" rx="18" ry="3" fill="#0004"/>${rDraw(J,f.cur,f.u)}</g>`; }
/* 포즈 순서 [[포즈이름, ms], ...] 를 재생한다 */
function rPlay(f,seq){ f.q=seq.map(([k,ms])=>({to:typeof k==='string'?RP[k]:k,ms})); f.from={...f.cur}; f.t0=performance.now(); }
function rTick(f,now){ if(!f.q.length)return false; const s=f.q[0]; const k=Math.min(1,(now-f.t0)/Math.max(1,s.ms)); f.cur=rLerp(f.from,s.to,rEase(k)); if(k>=1){ f.cur={...s.to}; f.q.shift(); f.from={...f.cur}; f.t0=now; } return true; }

/* ---------- 타석 장면(중계 화면의 투구·스윙) ---------- */
const CAM={on:false,raf:0,F:{},ball:null};
function camShade(h,k){ const n=parseInt(h.slice(1),16); const f=v=>Math.max(0,Math.min(255,Math.round(v*k))).toString(16).padStart(2,'0'); return '#'+f(n>>16&255)+f(n>>8&255)+f(n&255); }
function camUni(g,tid,o){ const P=tpal(G.teams[tid]); const home=tid===g.home; const cap=cLum(P[0])<.08?P[3]:P[0];
  const jr=home?'#f1f3f5':(cLum(P[0])<.12?P[3]:P[0]); const pn=home?'#f1f3f5':'#aab2ba';
  return {jr,dk:camShade(jr,.72),pn,pd:camShade(pn,.78),sk:'#e2b98f',cap,...(o||{})}; }
function camBg(g){ const P=tpal(G.teams[g.home]); const r=mulberry(g.home*131+7); const crowd=[];
  for(let row=0;row<9;row++){ const y=92+row*8.6; for(let i=0;i<46;i++){ const x=i*8.8+(row%2)*4.4+r()*2; const c=r(); crowd.push(`<rect x="${x.toFixed(1)}" y="${(y+r()*2).toFixed(1)}" width="4.2" height="5" rx="2" fill="${c<.34?P[0]:c<.5?P[3]:c<.75?'#d9dee3':'#3b4652'}" opacity="${(.45+r()*.4).toFixed(2)}"/>`); } }
  const tower=x=>`<rect x="${x-2}" y="20" width="4" height="70" fill="#2b3742"/><rect x="${x-18}" y="10" width="36" height="16" rx="2" fill="#38444f"/>${[0,1,2,3].map(i=>`<circle cx="${x-13+i*8.7}" cy="18" r="3" fill="#fffbe6"/>`).join('')}<circle cx="${x}" cy="18" r="46" fill="url(#cmGlow)"/>`;
  const boards=[...Array(7)].map((_,i)=>`<rect x="${i*58}" y="174" width="56" height="18" fill="${i%2?P[0]:'#e6eaee'}"/><rect x="${i*58+8}" y="181" width="${20+(i*13)%22}" height="4" rx="2" fill="${i%2?'#ffffffaa':P[0]}"/>`).join('');
  const bands=[202,211,222,236,253,274,300,330,366,400]; let gr=''; for(let i=0;i<bands.length-1;i++)gr+=`<rect x="0" y="${bands[i]}" width="400" height="${bands[i+1]-bands[i]}" fill="${i%2?'#2c7a42':'#33884a'}"/>`;
  return `<defs><linearGradient id="cmSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050d17"/><stop offset="1" stop-color="#14304a"/></linearGradient>
    <radialGradient id="cmGlow"><stop offset="0" stop-color="#fff8d0" stop-opacity=".55"/><stop offset="1" stop-color="#fff8d0" stop-opacity="0"/></radialGradient>
    <linearGradient id="cmStand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2833"/><stop offset="1" stop-color="#2a3946"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#cmSky)"/>${tower(92)}${tower(318)}
    <path d="M0 84 L400 84 L400 172 L0 172 Z" fill="url(#cmStand)"/>${crowd.join('')}<rect x="0" y="168" width="400" height="5" fill="#11181f"/>
    ${boards}<rect x="0" y="192" width="400" height="10" fill="#9c7448"/>${gr}
    <ellipse cx="296" cy="312" rx="96" ry="16" fill="#b0865a"/><ellipse cx="296" cy="312" rx="96" ry="16" fill="none" stroke="#8f6a43" stroke-width="1"/>
    <path d="M50 303 Q118 284 186 303 Z" fill="#b0865a"/><ellipse cx="118" cy="303" rx="70" ry="9" fill="#b0865a"/><rect x="110" y="296" width="16" height="2.4" fill="#f4f4f4"/>
    <path d="M240 306 h34 l3 10 h-40 z M300 306 h34 l3 10 h-40 z" fill="none" stroke="#f1f1f1" stroke-width="1.2" opacity=".85"/><path d="M278 309 h14 l2 3 h-18 z" fill="#fafafa"/>`; }
function camMount(g,k,x,b){ const st=document.getElementById('cs-stage'); if(!st)return null; let el=document.getElementById('cs-cam');
  if(!el){ el=document.createElement('div'); el.id='cs-cam'; el.className='cs-cam'; st.appendChild(el); }
  const top=x[0]%2===0; const fT=top?g.home:g.away, bT=top?g.away:g.home; const pid=x[2], bid=x[1]; const pp=G.players[pid]||{}, bp=G.players[bid]||{};
  const side=typeof bSide==='function'?bSide(bp,pp):'R';
  const F={ P:rFig('cmP',118,298,1.6,false,camUni(g,fT,{glove:'f'}),'pSet'),
    B:rFig('cmB',262,310,1.62,true,camUni(g,bT,{helm:1,bat:1,cap:tpal(G.teams[bT])[0]}),'bStance'),
    C:rFig('cmC',316,313,1.52,true,camUni(g,fT,{mask:1,glove:'f',mitt:1}),'cSquat'),
    U:rFig('cmU',350,313,1.48,true,{jr:'#1d2833',dk:'#121a22',pn:'#56606a',pd:'#3b434b',sk:'#e2b98f',cap:'#1d2833'},'uSet') };
  CAM.F=F; CAM.side=side;
  const bases=b.bases.map((v,i)=>`<i class="${v?'on':''}" style="--i:${i}"></i>`).join('');
  const nm=p=>esc(p.name||''); const tc=t=>tpal(G.teams[t])[0];
  el.innerHTML=`<svg viewBox="50 74 306 306" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${camBg(g)}<g id="cmFigs">${['U','C','B','P'].map(q=>rFigSvg(F[q])).join('')}</g><ellipse id="cmBs" rx="3.2" ry="1.2" fill="#0006" opacity="0"/><circle id="cmBall" r="2.8" fill="#fff" stroke="#0008" stroke-width=".6" opacity="0"/><path id="cmTr" fill="none" stroke="#ffffffaa" stroke-width="1.6" stroke-linecap="round"/></svg>
    <div class="cm-dia">${bases}<em>${b.outs}아웃</em></div>
    <div class="cm-lt"><span style="--c:${tc(fT)}"><i>투수</i><b>${nm(pp)}</b></span><span style="--c:${tc(bT)}"><i>${side==='L'?'좌타':'우타'}</i><b>${nm(bp)}</b></span></div>`;
  return el; }
function camFrame(){ const F=CAM.F; const now=performance.now(); let busy=false;
  for(const q in F){ const f=F[q]; if(rTick(f,now)||f.dirty){ f.dirty=false; const el=document.getElementById(f.id); if(el)el.innerHTML=`<ellipse cx="0" cy="1" rx="18" ry="3" fill="#0004"/>`+rDraw(rSolve(f.cur),f.cur,f.u); } if(f.q.length)busy=true; }
  if(CAM.ball){ const B=CAM.ball; const t=Math.min(1,(now-B.t0)/B.ms); const [x,y,s,gy]=B.fn(t); const bl=document.getElementById('cmBall'), sh=document.getElementById('cmBs');
    if(bl){ bl.setAttribute('cx',x.toFixed(1)); bl.setAttribute('cy',y.toFixed(1)); bl.setAttribute('r',(3*s).toFixed(2)); bl.setAttribute('opacity',1); }
    if(sh){ sh.setAttribute('cx',x.toFixed(1)); sh.setAttribute('cy',(gy??312).toFixed(1)); sh.setAttribute('opacity',gy==null?0:.8); }
    B.tr.push([x,y]); if(B.tr.length>7)B.tr.shift(); const tr=document.getElementById('cmTr'); if(tr)tr.setAttribute('d',B.tr.length>1?'M'+B.tr.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L'):'');
    if(t>=1){ const done=B.done; CAM.ball=null; if(done)done(); } else busy=true; }
  if(CAM.on)CAM.raf=requestAnimationFrame(camFrame); }
function camPose(q,seq){ const f=CAM.F[q]; if(f)rPlay(f,seq.map(([k,ms])=>[k,ms/cSpd()])); }
function camBall(fn,ms){ return new Promise(res=>{ CAM.ball={fn,ms:ms/cSpd(),t0:performance.now(),tr:[],done:res}; }); }
function camHandW(q,hand){ const f=CAM.F[q]; const J=rSolve(f.cur); const h=hand==='b'?J.ab:J.af; const sx=f.flip?-f.s:f.s; return [f.x+h[2]*sx,f.y+h[3]*f.s]; }
function camPtW(q,pose,hand,along){ const f=CAM.F[q]; const P=RP[pose]; const J=rSolve(P); const h=hand==='b'?J.ab:J.af; let lx=h[2], ly=h[3]; if(along){ const a=P.bat*Math.PI/180; lx+=Math.cos(a)*along; ly+=Math.sin(a)*along; } const sx=f.flip?-f.s:f.s; return [f.x+lx*sx,f.y+ly*f.s]; }
function camShow(){ const el=document.getElementById('cs-cam'); if(!el)return; el.classList.add('on'); CAM.on=true; cancelAnimationFrame(CAM.raf); CAM.raf=requestAnimationFrame(camFrame); }
function camHide(){ const el=document.getElementById('cs-cam'); if(el)el.classList.remove('on'); CAM.on=false; CAM.ball=null; cancelAnimationFrame(CAM.raf); }
const qB=(a,c,b,t)=>{ const u=1-t; return [u*u*a[0]+2*u*t*c[0]+t*t*b[0],u*u*a[1]+2*u*t*c[1]+t*t*b[1]]; };
/* 한 타석의 투구 장면. res: 'K','BB','in' / play: {kind:'hr'|'fly'|'line'|'gb'} */
async function camAtBat(g,k,x,b,res,play,rnd){ if(!camMount(g,k,x,b))return; camShow(); await cSleep(160);
  const look=res==='K'&&rnd()<.3, take=res==='BB'||look;
  camPose('P',[['pSet',140],['pKick',380],['pStride',210],['pCock',120],['pRelease',90],['pFollow',300]]);
  await cSleep(330); camPose('B',[['bLoad',320],['bStride',260]]);
  await cSleep(610); /* 공을 놓는 순간 */
  const rel=camHandW('P','b'); const mitt=camPtW('C','cCatch','f');
  const target=res==='in'?camPtW('B','bContact','f',24):res==='BB'?[mitt[0]+2,mitt[1]+(rnd()<.5?14:-12)]:mitt;
  const flight=280;
  if(!take){ setTimeout(()=>camPose('B',[['bContact',120],['bFollow',260]]),Math.max(0,(flight-150))/cSpd()); }
  if(take)setTimeout(()=>camPose('B',[['bTake',150]]),40/cSpd());
  const mid=[(rel[0]+target[0])/2,Math.min(rel[1],target[1])-6];
  if(res==='in'){ await camBall(t=>{ const p=qB(rel,mid,target,t); return [p[0],p[1],1,312]; },flight);
    sfx('crack',1,.94+rnd()*.12); cFlash();
    const C=target; let end,ctl,ms=420,gy=312;
    if(play.kind==='hr'){ ctl=[200,-40]; end=[-20,-70]; ms=560; }
    else if(play.kind==='fly'){ ctl=[260,-140]; end=[200,-60]; ms=520; }
    else if(play.kind==='deep'){ ctl=[160,40]; end=[-30,60]; ms=480; }
    else if(play.kind==='line'){ ctl=[160,236]; end=[-30,226]; ms=360; }
    else { ctl=[230,318]; end=[-30,296]; ms=380; }
    await camBall(t=>{ const p=qB(C,ctl,end,t); return [p[0],p[1],1+(play.kind==='hr'||play.kind==='fly'?-.4*t:0),play.kind==='gb'?null:gy]; },ms);
    await cSleep(60); camHide(); return; }
  /* 공이 미트에 들어간다 */
  await camBall(t=>{ const p=qB(rel,mid,target,t); return [p[0],p[1],1,312]; },flight); sfx('mitt',.9); camPose('C',[[res==='BB'?{...RP.cCatch,hf:[17,target[1]>mitt[1]?9:-9]}:'cCatch',70]]);
  const bl=document.getElementById('cmBall'); if(bl)bl.setAttribute('opacity',0); const tr=document.getElementById('cmTr'); if(tr)tr.setAttribute('d','');
  if(res==='K'){ if(look)camPose('U',[['uPunch',220]]); cFx('삼진','k'); await cSleep(900); }
  else { camPose('B',[['bDrop',380]]); cFx('볼넷','bb'); await cSleep(700); }
  camHide(); }
