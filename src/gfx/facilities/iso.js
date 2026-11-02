/* ===== 아이소메트릭 그림(시안 B): 구장 외관·구단 버스·훈련시설 =====
   투영: 오른쪽 축 u → 화면 (1, 0.5), 왼쪽 축 v → 화면 (-1, 0.5), 높이 h → 화면 위쪽(-y).
   상자 = 윗면 마름모 + 왼쪽 면(v 끝, 왼쪽 아래를 봄) + 오른쪽 면(u 끝, 오른쪽 아래를 봄).
   여기 함수들은 게임 상태를 읽지 않고 SVG 문자열만 돌려준다(순수 함수). 상태를 읽어 옵션을 만드는 일은 ui/62_iso_views.js */
const ISO={bg:'#141a22',g1:'#2f6b3d',g2:'#3a8a4d',dirt:'#c9915a',stF:'#3a4656',stT:'#56657a',wL:'#3a4656',wR:'#2b3340',rB:'#46546a',rG:'#56657a',rF:'#6b7a8f',
  mem:'#cfd8e3',lamp:'#ffe9a8',pole:'#8b98a8',sb:'#0b0f14',sbE:'#5c6b7c',b1:'#e9eef4',b2:'#cfd8e3',b3:'#b9c4d0',win:'#22303e',tire:'#1b1f24',hub:'#9aa7b4',
  plaza:'#1b222c',road:'#262e39',lot:'#1f3a2a',scaf:'#e0a100',water:'#4f8fc0'};
const isoN=x=>Math.round(x*10)/10;
/* 세계 좌표(u, v, 높이) → 화면 좌표. (ox, oy)는 u=v=0, 높이 0인 점 */
function isoXY(ox,oy,u,v,h){ return [ox+u-v, oy+(u+v)/2-(h||0)]; }
function isoPoly(pts,fill,extra){ return `<polygon points="${pts.map(p=>isoN(p[0])+','+isoN(p[1])).join(' ')}" fill="${fill}"${extra?' '+extra:''}/>`; }
/* 면 위에 평면 도형을 그리기 위한 변환: 그 안에서는 rect·circle을 평면 좌표로 쓴다 */
function isoMT(ox,oy,h){ return `matrix(1 .5 -1 .5 ${isoN(ox)} ${isoN(oy-(h||0))})`; }            /* 높이 h의 수평면: x=u, y=v */
function isoML(ox,oy,v,z){ return `matrix(1 .5 0 1 ${isoN(ox-v)} ${isoN(oy+v/2-(z||0))})`; }     /* v가 고정된 왼쪽 면: x=u, y=-높이 */
function isoMR(ox,oy,u,z){ return `matrix(-1 .5 0 1 ${isoN(ox+u)} ${isoN(oy+u/2-(z||0))})`; }    /* u가 고정된 오른쪽 면: x=v, y=-높이 */
/* 바닥 마름모 */
function isoTile(ox,oy,u,v,du,dv,fill,extra,z){ const P=(a,b)=>isoXY(ox,oy,a,b,z||0); return isoPoly([P(u,v),P(u+du,v),P(u+du,v+dv),P(u,v+dv)],fill,extra); }
/* 상자: c={t 윗면, l 왼쪽 면, r 오른쪽 면}, z는 바닥에서 띄운 높이 */
function isoBox(ox,oy,u,v,du,dv,h,c,z){ z=z||0; const P=(a,b,hh)=>isoXY(ox,oy,a,b,z+hh);
  const A=P(u,v,h),B=P(u+du,v,h),C=P(u+du,v+dv,h),D=P(u,v+dv,h);
  return isoPoly([P(u,v+dv,0),P(u+du,v+dv,0),C,D],c.l)+isoPoly([P(u+du,v+dv,0),P(u+du,v,0),B,C],c.r)+(c.t?isoPoly([A,B,C,D],c.t):''); }
/* 박공지붕: 용마루가 u 방향. 높이 h인 상자 위에 rh만큼 솟는다. 뒤 경사면 → 앞 경사면 → 박공 삼각형 순서로 칠한다 */
function isoRoof(ox,oy,u,v,du,dv,h,rh,c,z){ z=z||0; c=c||{b:ISO.rB,f:ISO.rF,g:ISO.rG}; const P=(a,b,hh)=>isoXY(ox,oy,a,b,z+hh); const m=v+dv/2;
  return isoPoly([P(u,v,h),P(u+du,v,h),P(u+du,m,h+rh),P(u,m,h+rh)],c.b)+isoPoly([P(u,v+dv,h),P(u+du,v+dv,h),P(u+du,m,h+rh),P(u,m,h+rh)],c.f)+isoPoly([P(u+du,v,h),P(u+du,v+dv,h),P(u+du,m,h+rh)],c.g); }
/* 왼쪽 면에 창 n개(lit이면 일부 불 켜짐) */
function isoWins(ox,oy,v,z,u0,u1,h0,h1,n,lit){ const gp=(u1-u0)/n; let r=''; for(let i=0;i<n;i++)r+=`<rect x="${isoN(u0+i*gp+gp*.2)}" y="${-h1}" width="${isoN(gp*.6)}" height="${h1-h0}" fill="${lit&&(i*7+3)%5<3?ISO.lamp:ISO.win}"/>`; return `<g transform="${isoML(ox,oy,v,z)}">${r}</g>`; }
/* 비계: 두 보이는 면에 격자와 반투명 막 */
function isoScaf(ox,oy,u,v,du,dv,h,z){ z=z||0; const lat=(a,len)=>{ const st=Math.max(5,len/5); let d=''; for(let i=0;i<=len+.01;i+=st)d+=`M${isoN(a+i)} 0V${-h}`; d+=`M${a} ${isoN(-h/2)}H${a+len}M${a} ${-h}H${a+len}M${a} 0L${a+len} ${-h}`; return d; };
  const st=`stroke="${ISO.scaf}" stroke-width="1.2" vector-effect="non-scaling-stroke" fill="none"`;
  return `<g class="isoscaf"><g transform="${isoMR(ox,oy,u+du,z)}"><rect x="${v}" y="${-h}" width="${dv}" height="${h}" fill="${ISO.scaf}" fill-opacity=".12"/><path d="${lat(v,dv)}" ${st}/></g><g transform="${isoML(ox,oy,v+dv,z)}"><rect x="${u}" y="${-h}" width="${du}" height="${h}" fill="${ISO.scaf}" fill-opacity=".16"/><path d="${lat(u,du)}" ${st}/></g></g>`; }
/* 타워 크레인(화면 좌표, 아래 끝이 x,y) */
function isoCrane(x,y,ht,jib){ return `<g class="isocr"><path d="M${isoN(x)} ${isoN(y)}V${isoN(y-ht)}M${isoN(x-jib*.3)} ${isoN(y-ht)}H${isoN(x+jib)}M${isoN(x+jib*.8)} ${isoN(y-ht)}V${isoN(y-ht*.55)}" stroke="${ISO.scaf}" stroke-width="2" fill="none"/><rect x="${isoN(x-jib*.3-4)}" y="${isoN(y-ht-1)}" width="5" height="5" fill="${ISO.pole}"/></g>`; }
/* 진행 막대(화면 좌표, 가운데 정렬) */
function isoBar(x,y,w,pct,txt,fs){ fs=fs||8; const hh=Math.max(2.5,fs*.45);
  return `<g class="isobar"><rect x="${isoN(x-w/2)}" y="${isoN(y)}" width="${isoN(w)}" height="${isoN(hh)}" rx="${isoN(hh/2)}" fill="#0b1218" stroke="#ffffff33" stroke-width="${isoN(fs*.08)}"/><rect x="${isoN(x-w/2)}" y="${isoN(y)}" width="${isoN(Math.max(hh,w*pct))}" height="${isoN(hh)}" rx="${isoN(hh/2)}" fill="${ISO.scaf}"/>${txt?`<text class="isot" x="${isoN(x)}" y="${isoN(y-fs*.35)}" font-size="${isoN(fs)}" stroke-width="${isoN(fs*.28)}" text-anchor="middle">${txt}</text>`:''}</g>`; }
/* 조명탑(화면 좌표의 바닥점) */
function isoLight(x,y,ht,w){ w=w||9; return `<g><line x1="${isoN(x)}" y1="${isoN(y)}" x2="${isoN(x)}" y2="${isoN(y-ht)}" stroke="${ISO.pole}" stroke-width="${isoN(w*.17)}"/><circle cx="${isoN(x)}" cy="${isoN(y-ht-1)}" r="${isoN(w*.85)}" fill="${ISO.lamp}" opacity=".15"/><rect x="${isoN(x-w/2)}" y="${isoN(y-ht-w*.45)}" width="${w}" height="${isoN(w*.55)}" rx="1" fill="${ISO.lamp}"/></g>`; }

/* 작은 선수 인형: 그림자 타원 + 다리 + 몸통 + 머리(모자). 발이 (x, y). o.c 상의, o.d 하의·모자, o.bat 방망이, o.bar 바벨, o.glove 글러브 */
function isoMan(x,y,o){ o=o||{}; const c=o.c||ISO.b1, d=o.d||ISO.wL, s=o.s||1;
  const ex=o.bat?`<path class="imb" d="M3 -9L9.5 -17.5" stroke="${ISO.dirt}" stroke-width="1.7" stroke-linecap="round"/>`:o.bar?`<g class="imb"><path d="M-7 -21H7" stroke="${ISO.hub}" stroke-width="1.4"/><rect x="-8.5" y="-23.5" width="2.4" height="5" fill="${ISO.tire}"/><rect x="6.1" y="-23.5" width="2.4" height="5" fill="${ISO.tire}"/></g>`:o.glove?`<circle class="imb" cx="-4.6" cy="-9.5" r="1.9" fill="#8a5a2b"/>`:'';
  return `<g${x||y?` transform="translate(${isoN(x)} ${isoN(y)})${s!==1?` scale(${s})`:''}"`:s!==1?` transform="scale(${s})"`:''}><ellipse rx="5.6" ry="2.6" fill="#0007"/><g class="imx"><path d="M-2.2 -.4V-6.5M2.2 -.4V-6.5" stroke="${d}" stroke-width="2.3" stroke-linecap="round"/><path d="M-4.2 -5.6Q-4.4 -14 0 -14Q4.4 -14 4.2 -5.6Z" fill="${c}"/><path d="M.6 -14Q4.4 -14 4.2 -5.6H.6Z" fill="#0003"/>${ex}<circle cy="-16.9" r="3.1" fill="#e2b58f"/><path d="M-3.3 -17.3A3.3 3.3 0 0 1 3.3 -17.3Z" fill="${o.h||d}"/></g></g>`; }

/* 야구장 바닥: (ox, oy)가 홈 쪽 뒤 모서리, 한 변 F. 안쪽은 0~80 단위로 그린다. 홈(6,6)·1루(28,6)·2루(28,28)·3루(6,28)·마운드(17,17)
   o.turf 잔디 단계(1~5), o.worn 낡은 구장 */
function isoField(ox,oy,F,o){ o=o||{}; const k=F/80, t=o.turf||2; const g2=t>=3?ISO.g2:ISO.g1; let s='';
  if(o.worn)s+=`<rect width="80" height="80" fill="#3f5a36"/><g fill="${ISO.dirt}" opacity=".32">${[[40,20,9,5],[58,46,7,6],[30,60,11,5],[66,14,6,4],[50,68,8,4]].map(([a,b,rx,ry])=>`<ellipse cx="${a}" cy="${b}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`;
  else { s+=`<rect width="80" height="80" fill="${ISO.g1}"/>`; if(t>=3)s+=[0,1,2,3,4,5,6,7].map(i=>`<rect x="${i*10+5}" width="5" height="80" fill="${ISO.g2}"/>`).join(''); if(t>=4)s+=`<g fill="${ISO.g1}" opacity=".45">${[0,1,2,3,4,5,6,7].map(i=>`<rect y="${i*10+5}" width="80" height="5"/>`).join('')}</g>`; }
  s+=`<path d="M73 0H80V80H0V73H73Z" fill="${ISO.dirt}" opacity="${o.worn?.3:.5}"/><rect x="3" y="3" width="28" height="28" fill="${ISO.dirt}"/><rect x="10" y="10" width="14" height="14" fill="${o.worn?'#3f5a36':g2}"/><circle cx="17" cy="17" r="2.6" fill="${ISO.dirt}"/>`;
  s+=`<path d="M6 6H80M6 6V80" stroke="#fff" stroke-opacity=".75" stroke-width="1" vector-effect="non-scaling-stroke" fill="none"/><g fill="#fff"><rect x="27" y="5" width="2" height="2"/><rect x="27" y="27" width="2" height="2"/><rect x="5" y="27" width="2" height="2"/><rect x="5" y="5" width="2" height="2"/></g>`;
  return `<g transform="matrix(${isoN(k)} ${isoN(k/2)} ${isoN(-k)} ${isoN(k/2)} ${isoN(ox)} ${isoN(oy)})">${s}</g>`; }
/* 필드 좌표(0~80) → 화면 좌표 */
function isoFieldPt(ox,oy,F,a,b){ const k=F/80; return isoXY(ox,oy,a*k,b*k,0); }

/* 구장 외관. 지역 좌표: 필드 뒤 모서리(홈 뒤)가 (100,40), 필드 한 변 80.
   o.lv={seat,fnb,prem,vis,turf}(1~5), o.build=[{k,pct}], o.col 우리 구단 색, o.dome, o.fs 글자 크기, o.proj={stage,pct,label} 신구장, o.labels 공사 글자 표시 */
function isoStadium(o){ o=o||{}; const L=Object.assign({seat:2,fnb:2,prem:2,vis:2,turf:2},o.lv||{}); const col=o.col||'#d6333f'; const X=100,Y=40; const fs=o.fs||7;
  const B={}; (o.build||[]).forEach(b=>{ B[b.k]=b; });
  const sl=L.seat, H=sl>=4?36:sl>=3?26:14, T=sl>=4?28:sl>=3?22:14; const P=(u,v,h)=>isoXY(X,Y,u,v,h); const g=[]; const top=[];
  const nT=L.turf>=4?4:L.turf>=3?3:2; const tH=H+26;
  g.push(isoTile(X,Y,-T-10,-T-10,T+108,T+108,ISO.plaza));
  /* 관중석 뒤 조명탑(관중석보다 먼저 그려 아래가 가려지게) */
  const tw=(u,v)=>{ const [x,y]=P(u,v,0); return isoLight(x,y,tH,9); };
  if(nT>=4){ g.push(tw(-T-4,40)); g.push(tw(40,-T-4)); } else if(nT>=3)g.push(tw(-T-4,-T-4)); g.push(tw(-T-4,74)); g.push(tw(74,-T-4));
  g.push(isoField(X,Y,80,{turf:L.turf}));
  /* 잔디 공사: 외야 일부를 걷어 낸 흙 */
  if(B.turf)g.push(`<g transform="${isoMT(X,Y,0)}"><rect x="40" y="40" width="33" height="33" fill="${ISO.dirt}" opacity=".85"/><path d="M40 48H73M40 56H73M40 64H73" stroke="#8a5a2b" stroke-width="1" vector-effect="non-scaling-stroke"/></g>`);
  /* 관중석: 홈 뒤 모서리 → 1루 쪽(오른쪽 뒤) → 3루 쪽(왼쪽 뒤). 필드를 보는 면이 앞면 */
  g.push(isoBox(X,Y,-T,-T,T,T,H,{t:ISO.stT,l:ISO.stF,r:ISO.stF}));
  g.push(isoBox(X,Y,0,-T,80,T,H,{t:ISO.stT,l:ISO.stF,r:ISO.wR}));
  g.push(isoBox(X,Y,-T,0,T,80,H,{t:ISO.stT,l:ISO.wR,r:ISO.stF}));
  const rows=[.28,.52,.76].map(f=>`M2 ${isoN(-H*f)}H78`).join('');
  const rowSt=`stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke" fill="none" opacity=".9"`;
  g.push(`<g transform="${isoML(X,Y,0)}"><path d="${rows}" ${rowSt}/></g><g transform="${isoMR(X,Y,0)}"><path d="${rows}" ${rowSt}/></g>`);
  /* 윗면 통로 줄무늬 */
  g.push(`<g transform="${isoMT(X,Y,H)}"><path d="M${-T/2} ${-T/2}H80M${-T/2} ${-T/2}V80" stroke="#46546a" stroke-width="1" vector-effect="non-scaling-stroke" fill="none"/></g>`);
  /* 프리미엄석: 홈 뒤 관중석 위 유리 띠(스카이박스). 단계가 오를수록 길어진다 */
  if(L.prem>=3){ const len=L.prem>=5?60:L.prem>=4?44:26; const ph=6;
    g.push(isoBox(X,Y,-6,-6,6,6,ph,{t:ISO.stT,l:ISO.win,r:ISO.win},H)+isoBox(X,Y,0,-6,len,6,ph,{t:ISO.stT,l:ISO.win,r:ISO.wR},H)+isoBox(X,Y,-6,0,6,len,ph,{t:ISO.stT,l:ISO.wR,r:ISO.win},H));
    const lit=len=>{ let d=''; for(let i=3;i<len-2;i+=6)d+=`<rect x="${i}" y="${-ph+1.6}" width="3" height="${ph-3.2}" fill="${ISO.lamp}" opacity=".85"/>`; return d; };
    g.push(`<g transform="${isoML(X,Y,0,H)}">${lit(len)}</g><g transform="${isoMR(X,Y,0,H)}">${lit(len)}</g>`); }
  /* 최고 단계 관람석: 관중석 위 지붕막 + 지붕 조명 */
  if(sl>=5){ const r1=H+16, r0=H+9; const rb=-T*.6; const mem=`<g opacity=".9">${isoPoly([P(rb,rb,r1),P(80,rb,r1),P(80,5,r0),P(5,5,r0),P(5,80,r0),P(rb,80,r1)],ISO.mem)}</g>`;
    const posts=[[10,0],[40,0],[70,0],[0,10],[0,40],[0,70]].map(([u,v])=>{ const a=P(u,v,H), b=P(u+(u?0:4),v+(v?0:4),r0); return `M${isoN(a[0])} ${isoN(a[1])}L${isoN(b[0])} ${isoN(b[1])}`; }).join('');
    g.push(`<path d="${posts}" stroke="${ISO.pole}" stroke-width="1" fill="none"/>`+mem+[10,26,42,58,74].map(u=>{ const a=P(u,5,r0), b=P(5,u,r0); return `<circle cx="${isoN(a[0])}" cy="${isoN(a[1]+1)}" r="1.5" fill="${ISO.lamp}"/><circle cx="${isoN(b[0])}" cy="${isoN(b[1]+1)}" r="1.5" fill="${ISO.lamp}"/>`; }).join('')); }
  /* 프리미엄석 최고 단계: 1루 쪽 파울 지역 캠핑존 */
  if(L.prem>=5)[60,66,72].forEach(u=>{ const [x,y]=P(u,2.5,0); g.push(`<path d="M${isoN(x-4)} ${isoN(y+1)}L${isoN(x)} ${isoN(y-6)}L${isoN(x+4)} ${isoN(y+1)}Z" fill="${col}"/><path d="M${isoN(x)} ${isoN(y-6)}L${isoN(x+4)} ${isoN(y+1)}L${isoN(x+6)} ${isoN(y-1)}Z" fill="#0004"/>`); });
  /* 전광판: 3단계부터, 좌익수 뒤. 단계가 오를수록 넓다 */
  const sbW=L.vis>=5?34:L.vis>=4?26:18, sbZ=8, sbH=isoN(sbW*.55), sbV=84;
  if(L.vis>=3){ const lg=[sbV+3,sbV+sbW-3].map(v=>{ const a=P(-2,v,0), b=P(-2,v,sbZ); return `M${isoN(a[0])} ${isoN(a[1])}L${isoN(b[0])} ${isoN(b[1])}`; }).join('');
    g.push(`<path d="${lg}" stroke="${ISO.pole}" stroke-width="1.6"/>`+isoBox(X,Y,-4,sbV,3,sbW,sbH,{t:'#3a4656',l:'#2b3340',r:ISO.sb},sbZ)
      +`<g transform="${isoMR(X,Y,-1,sbZ)}"><rect x="${sbV+1}" y="${-sbH+1}" width="${sbW-2}" height="${sbH-2}" fill="none" stroke="${ISO.sbE}" stroke-width="1.2" vector-effect="non-scaling-stroke"/>${L.vis>=5?`<rect x="${sbV+3}" y="${-sbH+3}" width="${isoN(sbW*.45)}" height="${isoN(sbH-6)}" fill="${col}" opacity=".75"/>`:`<rect x="${sbV+3}" y="${-sbH+3}" width="6" height="4" fill="${col}"/>`}${[0,1,2].map(i=>`<rect x="${isoN(sbV+(L.vis>=5?sbW*.5+2:12))}" y="${isoN(-sbH+3+i*(sbH-5)/3)}" width="${isoN(L.vis>=5?sbW*.4:sbW-16)}" height="1.6" fill="${ISO.lamp}" opacity=".8"/>`).join('')}</g>`); }
  /* 식음료·굿즈 매장: 우익 펜스 밖 매대, 단계만큼 */
  const nK=Math.max(0,Math.min(4,L.fnb-1)); for(let i=0;i<nK;i++){ const v=12+i*16; g.push(isoBox(X,Y,85,v,7,9,7,{t:col,l:ISO.wL,r:ISO.wR})+`<g transform="${isoML(X,Y,v+9)}"><rect x="86.5" y="-5" width="4" height="2.6" fill="${ISO.lamp}"/></g>`); }
  if(o.dome){ const [lx,ly]=P(-T,82,0), [rx]=P(82,-T,0); const cy=ly-6; g.push(`<path d="M${isoN(lx-4)} ${isoN(cy)}C${isoN(lx)} ${isoN(cy-140)} ${isoN(rx)} ${isoN(cy-140)} ${isoN(rx+4)} ${isoN(cy)}Z" fill="${ISO.mem}" fill-opacity=".14" stroke="${ISO.mem}" stroke-opacity=".7" stroke-width="1.2"/><path d="M${isoN((lx+rx)/2)} ${isoN(cy-105)}V${isoN(cy)}M${isoN(lx+40)} ${isoN(cy-78)}Q${isoN((lx+rx)/2)} ${isoN(cy-30)} ${isoN(rx-40)} ${isoN(cy-78)}" stroke="${ISO.mem}" stroke-opacity=".35" fill="none"/>`); }
  /* 공사 중 항목: 비계 + 진행 막대 */
  const lab=(k,u,v,h,txt)=>{ const b=B[k]; const [x,y]=P(u,v,h); top.push(isoBar(x,y,Math.max(30,fs*5),b.pct,o.labels===false?'':`${txt} ${Math.round(b.pct*100)}%`,fs)); };
  if(B.seat){ g.push(isoScaf(X,Y,0,-T,80,T,H+6)+isoScaf(X,Y,-T,0,T,80,H+6)); const [x,y]=P(50,-T,0); g.push(isoCrane(x,y,H+30,30)); lab('seat',40,0,H+12,'관람석'); }
  if(B.prem){ g.push(isoScaf(X,Y,-8,-8,40,8,8,H)); lab('prem',8,-4,H+16,'프리미엄석'); }
  if(B.vis){ g.push(isoScaf(X,Y,-5,sbV,5,sbW,sbZ+sbH+2)); lab('vis',-2,sbV+sbW/2,sbZ+sbH+8,'전광판'); }
  if(B.fnb){ const v=12+Math.min(3,nK)*16; g.push(isoScaf(X,Y,85,v,7,9,9)); lab('fnb',88,v+4,16,'매장'); }
  if(B.turf)lab('turf',56,56,4,'그라운드');
  /* 신구장: 오른쪽 옆 부지 */
  if(o.proj){ const N=o.proj, X2=262, Y2=58, S2=52; const PP=(u,v,h)=>isoXY(X2,Y2,u,v,h);
    if(N.stage==='build'){ const hh=6+30*N.pct; g.push(isoTile(X2,Y2,0,0,S2,S2,'#2b3340')+`<g transform="${isoMT(X2,Y2,0)}"><rect x="10" y="10" width="${S2-14}" height="${S2-14}" fill="${ISO.dirt}" opacity=".55"/></g>`+isoScaf(X2,Y2,0,0,S2,8,hh)+isoScaf(X2,Y2,0,8,8,S2-8,hh)); const [cx,cy]=PP(S2*.7,S2*.5,0); g.push(isoCrane(cx,cy,48,34)); const [bx,by]=PP(S2,S2,0); top.push(isoBar(bx,by+6,70,N.pct,N.label||`신구장 ${Math.round(N.pct*100)}%`,fs)); }
    else { g.push(isoTile(X2,Y2,0,0,S2,S2,'none',`stroke="${ISO.pole}" stroke-dasharray="4 3" stroke-width="1.2"`)); const [bx,by]=PP(S2/2,S2/2,0); top.push(`<text class="isot" x="${isoN(bx)}" y="${isoN(by)}" font-size="${fs}" stroke-width="${isoN(fs*.28)}" text-anchor="middle">${N.label||'신구장 부지'}</text>`); } }
  return g.join('')+top.join(''); }
/* 구장 그림을 담은 svg: 신구장 부지가 있으면 오른쪽으로 넓힌다 */
function isoStadTop(o){ const L=Object.assign({seat:2,prem:2,turf:2},(o&&o.lv)||{}); const sl=L.seat, H=sl>=4?36:sl>=3?26:14, T=sl>=4?28:sl>=3?22:14, tH=H+26;
  const st=40-T-H-(sl>=5?16:L.prem>=3?6:0); const tw=L.turf>=4?40+(36-T)/2-tH-8:L.turf>=3?40-(T+4)-tH-8:40+(70-T)/2-tH-8;
  return Math.floor(Math.min(st,tw,o&&o.dome?-34:99,o&&o.proj&&o.proj.stage==='build'?-2:99)-6); }
function isoStadiumSvg(o,cls){ const t=isoStadTop(o); const vb=`-28 ${t} ${o&&o.proj?360:244} ${142-t}`; return `<svg class="${cls||'isosvg'}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="구장 외관">${isoStadium(o)}</svg>`; }

/* 2군 구장(필드 + 단계별 부속). (ox, oy)가 필드 뒤 모서리, 한 변 F */
function isoFarmField(ox,oy,F,lv,col){ const k=F/80, P=(a,b,h)=>isoXY(ox,oy,a*k,b*k,(h||0)*k); const g=[];
  if(lv>=3){ g.push(isoBox(ox,oy,-6*k,-6*k,6*k,6*k,7*k,{t:ISO.stT,l:ISO.stF,r:ISO.stF})+isoBox(ox,oy,0,-6*k,60*k,6*k,7*k,{t:ISO.stT,l:ISO.stF,r:ISO.wR})+isoBox(ox,oy,-6*k,0,6*k,60*k,7*k,{t:ISO.stT,l:ISO.wR,r:ISO.stF}));
    g.push(`<g transform="${isoML(ox,oy,0)}"><path d="M2 ${isoN(-3.5*k)}H${isoN(58*k)}" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/></g><g transform="${isoMR(ox,oy,0)}"><path d="M2 ${isoN(-3.5*k)}H${isoN(58*k)}" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/></g>`); }
  if(lv>=2){ const lt=(a,b)=>{ const [x,y]=P(a,b,0); return isoLight(x,y,34*k,7*k); }; g.push(lt(-8,72)+lt(72,-8)); if(lv>=3)g.push(lt(-8,-8)); }
  g.push(isoField(ox,oy,F,{turf:lv>=3?4:lv>=2?3:2,worn:lv<=0}));
  if(lv>=2)g.push(`<g transform="${isoMT(ox,oy,0)}"><rect x="${isoN(62*k)}" y="${isoN(1*k)}" width="${isoN(12*k)}" height="${isoN(3.5*k)}" fill="${ISO.dirt}"/><rect x="${isoN(1*k)}" y="${isoN(62*k)}" width="${isoN(3.5*k)}" height="${isoN(12*k)}" fill="${ISO.dirt}"/></g>`);
  if(lv>=3){ const sbH=8*k; g.push(isoBox(ox,oy,-3*k,82*k,2*k,16*k,sbH,{t:'#3a4656',l:'#2b3340',r:ISO.sb},3*k)); }
  return g.join(''); }

/* 구단 버스. 단계 0 일반, 1 우등, 2 리무진: 단계가 오를수록 길고 창이 많고 띠가 굵고 색이 고급스럽다. (o.x, o.y)가 차체 뒤 모서리 */
function isoBus(lv,o){ o=o||{}; lv=Math.max(0,Math.min(2,lv|0)); const col=o.col||'#d6333f'; const L=[140,160,176][lv], W=[46,50,52][lv], H=[54,58,60][lv], nw=[5,6,7][lv]; const X=o.x||0, Y=o.y||0, z=7; const g=[];
  g.push(isoTile(X,Y,-4,-3,L+10,W+8,'#000',`fill-opacity=".38"`));
  g.push(isoBox(X,Y,0,0,L,W,H,{t:ISO.b1,l:ISO.b2,r:ISO.b3},z));
  /* 옆면(왼쪽 면): 아래 띠 → 창 → 문 → 바퀴 */
  let s='';
  if(lv>=2)s+=`<rect x="0" y="-22" width="${L}" height="22" fill="${col}"/><rect x="0" y="-24" width="${L}" height="1.6" fill="${ISO.lamp}"/>`;
  else if(lv===1)s+=`<rect x="0" y="-19" width="${L}" height="7" fill="${col}"/><rect x="0" y="-10" width="${L}" height="1.6" fill="${col}" opacity=".7"/>`;
  else s+=`<rect x="0" y="-17" width="${L}" height="3" fill="${ISO.pole}"/>`;
  const w0=8, w1=L-26, wt=-H+6, wb=lv>=2?-28:-30;
  if(lv>=2){ s+=`<rect x="${w0}" y="${wt}" width="${w1-w0}" height="${wb-wt}" rx="2" fill="${ISO.win}"/>`; const gp=(w1-w0)/nw; for(let i=1;i<nw;i++)s+=`<rect x="${isoN(w0+i*gp-.6)}" y="${wt}" width="1.2" height="${wb-wt}" fill="${ISO.b3}" opacity=".6"/>`; s+=`<rect x="${w0+2}" y="${wt+2}" width="${w1-w0-4}" height="2" fill="#ffffff22"/>`; }
  else { const gp=(w1-w0)/nw; for(let i=0;i<nw;i++)s+=`<rect x="${isoN(w0+i*gp+1.5)}" y="${wt}" width="${isoN(gp-3)}" height="${wb-wt}" rx="1.5" fill="${ISO.win}"/>`; }
  s+=`<rect x="${L-21}" y="${-H+5}" width="11" height="${H-9}" rx="1.5" fill="${ISO.win}" stroke="${lv>=2?ISO.lamp:ISO.b3}" stroke-width=".9"/>`;
  [L*.17,L*.8].forEach(u=>{ s+=`<circle cx="${isoN(u)}" cy="-1" r="11.5" fill="#0005"/><circle cx="${isoN(u)}" cy="-1.5" r="9.5" fill="${ISO.tire}"/><circle cx="${isoN(u)}" cy="-1.5" r="4" fill="${ISO.hub}"/>`; });
  g.push(`<g transform="${isoML(X,Y,W,z)}">${s}</g>`);
  /* 앞면(오른쪽 면): 앞 유리·띠·등·행선판 */
  let f=`<rect x="4" y="${-H+5}" width="${W-8}" height="24" rx="2" fill="${ISO.win}"/><rect x="6" y="${-H+7}" width="${W-12}" height="2.4" fill="#ffffff26"/>`;
  f+=`<rect x="0" y="${lv>=2?-22:-19}" width="${W}" height="${lv>=2?6:lv===1?7:3}" fill="${lv>=1?col:ISO.pole}"/><rect x="4" y="-12" width="7" height="3.2" rx="1" fill="${ISO.lamp}"/><rect x="${W-11}" y="-12" width="7" height="3.2" rx="1" fill="${ISO.lamp}"/>`;
  if(lv>=1)f+=`<rect x="8" y="${-H+1}" width="${W-16}" height="3.2" fill="${ISO.lamp}" opacity=".85"/>`;
  g.push(`<g transform="${isoMR(X,Y,L,z)}">${f}</g>`);
  /* 지붕: 우등부터 냉방기, 리무진은 구단 색 지붕 띠 */
  if(lv>=1)g.push(isoBox(X,Y,L*.28,W*.25,L*.32,W*.5,4,{t:ISO.b2,l:ISO.b3,r:ISO.b3},z+H));
  if(lv>=2)g.push(`<g transform="${isoMT(X,Y,z+H)}"><rect x="6" y="${W/2-1.2}" width="${L*.2}" height="2.4" fill="${col}"/><rect x="${L*.66}" y="${W/2-1.2}" width="${L*.3}" height="2.4" fill="${col}"/></g>`);
  return g.join(''); }
function isoBusVB(lv){ const L=[140,160,176][lv]||160, W=[46,50,52][lv]||50, H=[54,58,60][lv]||58; return [-W-8,-(H+16),L+W+16,(L+W)/2+H+28]; }

/* 훈련시설 건물. 표준 부지 u 0~100 × v 0~70(뒤쪽에 건물, 앞마당 v 44~66은 선수 자리), (o.x, o.y)가 부지 뒤 모서리.
   kind: indoor·weight·rehab·lab·dorm·club·fut, lv 0~3(0이면 건물 없음). o.bld가 숫자(0~1)이면 다음 단계 공사 비계 */
const ISO_FP={indoor:[null,[12,10,40,26,12],[10,10,60,28,16],[8,8,64,30,20]],weight:[null,[10,12,34,24,14],[10,12,44,24,14],[10,12,50,24,14]],
  rehab:[null,[10,10,30,24,14],[10,10,40,24,14],[10,10,48,24,16]],lab:[null,[12,10,28,22,16],[12,10,38,22,16],[12,10,46,22,18]],
  dorm:[null,[10,10,40,22,22],[10,10,42,22,28],[10,10,46,24,36]],club:[null,[10,10,70,26,18],[10,10,70,26,18],[10,10,70,26,18]]};
function isoBuilding(kind,lv,o){ o=o||{}; const X=o.x||0, Y=o.y||0, col=o.col||'#d6333f'; const g=[]; const P=(u,v,h)=>isoXY(X,Y,u,v,h);
  if(o.lot!==false)g.push(isoTile(X,Y,0,0,100,70,ISO.lot));
  if(kind==='fut'){ g.push(isoFarmField(...isoXY(X,Y,17,2,0),66,lv,col)); if(o.bld!=null){ const [x,y]=P(70,60,0); g.push(isoCrane(x,y,40,26)); } return g.join(''); }
  const W={t:null,l:ISO.wL,r:ISO.wR}, FL={t:ISO.rG,l:ISO.wL,r:ISO.wR};
  const fpN=(ISO_FP[kind]||ISO_FP.indoor)[Math.min(3,Math.max(1,lv+1))];
  if(lv<=0){ /* 빈 부지 또는 공사장 */
    if(o.bld==null){ g.push(isoTile(X,Y,8,8,84,54,'none',`stroke="${ISO.pole}" stroke-dasharray="4 3" stroke-width="1"`)); return g.join(''); }
    const [u,v,du,dv,h]=fpN; g.push(isoTile(X,Y,u-2,v-2,du+4,dv+4,ISO.dirt,`fill-opacity=".55"`)+isoScaf(X,Y,u,v,du,dv,6+h*o.bld)); const [x,y]=P(u+du*.7,v+dv*.5,0); g.push(isoCrane(x,y,h+30,26)); return g.join(''); }
  const [u,v,du,dv,h]=ISO_FP[kind][Math.min(3,lv)];
  if(kind==='indoor'){ g.push(isoBox(X,Y,u,v,du,dv,h,W)+isoRoof(X,Y,u,v,du,dv,h,lv>=2?11:8)); g.push(isoWins(X,Y,v+dv,0,u+4,u+du-14,h-6,h-2,Math.round(du/8),true));
    g.push(`<g transform="${isoML(X,Y,v+dv)}"><rect x="${u+du-11}" y="-9" width="7" height="9" fill="${ISO.win}"/><rect x="${u+du-11}" y="-10.5" width="7" height="1.5" fill="${col}"/></g>`);
    if(lv>=2){ g.push(isoBox(X,Y,u+du+3,v+8,lv>=3?20:14,dv-8,lv>=3?14:10,FL)); g.push(isoWins(X,Y,v+dv,0,u+du+5,u+du+(lv>=3?21:15),5,9,2,true)); }
    if(lv>=3)g.push(`<g transform="${isoMT(X,Y,0)}">${[0,1,2].map(i=>`<rect x="${14+i*24}" y="46" width="16" height="12" fill="none" stroke="#cfd8e3" stroke-opacity=".5" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('')}</g>`); }
  else if(kind==='weight'){ g.push(isoBox(X,Y,u,v,du,dv,h,W)+isoRoof(X,Y,u,v,du,dv,h,7)); g.push(isoWins(X,Y,v+dv,0,u+12,u+du-3,h-7,h-2,Math.max(2,Math.round(du/9)),true));
    g.push(`<g transform="${isoML(X,Y,v+dv)}"><rect x="${u+3}" y="-10" width="6" height="10" fill="${ISO.win}"/><path d="M${u+2} -${h-3}h7M${u+2} -${h-1.5}v-3M${u+9} -${h-1.5}v-3" stroke="${ISO.lamp}" stroke-width="1.3" vector-effect="non-scaling-stroke"/></g>`);
    if(lv>=2)g.push(`<g transform="${isoMT(X,Y,0)}"><rect x="66" y="8" width="28" height="32" rx="12" fill="${ISO.dirt}" opacity=".85"/><rect x="71" y="13" width="18" height="22" rx="8" fill="${ISO.g1}"/></g>`);
    if(lv>=3)g.push(isoBox(X,Y,u+4,v+4,22,dv-8,9,FL,h+3)); }
  else if(kind==='rehab'){ g.push(isoBox(X,Y,u,v,du,dv,h,FL)); g.push(isoWins(X,Y,v+dv,0,u+3,u+du-12,h-8,h-3,Math.max(2,Math.round(du/9)),true));
    g.push(`<g transform="${isoML(X,Y,v+dv)}"><rect x="${u+du-10}" y="-9" width="7" height="9" fill="${ISO.win}"/></g><g transform="${isoMT(X,Y,h)}"><path d="M${u+du/2-4} ${v+dv/2}h8M${u+du/2} ${v+dv/2-4}v8" stroke="${col}" stroke-width="2.4" vector-effect="non-scaling-stroke"/></g>`);
    if(lv>=2)g.push(`<g transform="${isoMT(X,Y,0)}"><rect x="62" y="10" width="32" height="26" rx="3" fill="#cfd8e3"/><rect x="64" y="12" width="28" height="22" rx="2" fill="${ISO.water}"/><path d="M68 18h20M68 24h20M68 30h20" stroke="#ffffff55" stroke-width="1" vector-effect="non-scaling-stroke"/></g>`);
    if(lv>=3)g.push(`<g transform="${isoMT(X,Y,0)}"><circle cx="70" cy="44" r="4.5" fill="#cfd8e3"/><circle cx="70" cy="44" r="3.4" fill="#9fd8f0"/><circle cx="84" cy="44" r="4.5" fill="#cfd8e3"/><circle cx="84" cy="44" r="3.4" fill="#9fd8f0"/></g>`); }
  else if(kind==='lab'){ g.push(isoBox(X,Y,u,v,du,dv,h,{t:'#2b3340',l:ISO.wL,r:ISO.wR})); g.push(isoWins(X,Y,v+dv,0,u+3,u+du-3,h-9,h-3,Math.max(2,Math.round(du/8)),false));
    const [ax,ay]=P(u+6,v+6,h); g.push(`<path d="M${isoN(ax)} ${isoN(ay)}v-9" stroke="${ISO.pole}" stroke-width="1.2"/><circle cx="${isoN(ax)}" cy="${isoN(ay-9)}" r="1.6" fill="${col}"/>`);
    g.push(`<g transform="${isoML(X,Y,v+dv)}"><rect x="${u+4}" y="${-h+4}" width="${du-8}" height="2" fill="#4fd27c" opacity=".8"/></g>`);
    if(lv>=2){ const cu=58,cv=10,cdu=36,cdv=22,ch=14; g.push(`<g fill="none" stroke="#cfd8e3" stroke-opacity=".55" stroke-width="1" vector-effect="non-scaling-stroke">${isoPoly([P(cu,cv,ch),P(cu+cdu,cv,ch),P(cu+cdu,cv+cdv,ch),P(cu,cv+cdv,ch)],'none','stroke="#cfd8e3"')}${[[cu,cv],[cu+cdu,cv],[cu+cdu,cv+cdv],[cu,cv+cdv]].map(([a,b])=>{ const p0=P(a,b,0),p1=P(a,b,ch); return `<line x1="${isoN(p0[0])}" y1="${isoN(p0[1])}" x2="${isoN(p1[0])}" y2="${isoN(p1[1])}"/>`; }).join('')}</g>`+`<g transform="${isoMT(X,Y,0)}"><rect x="${cu}" y="${cv}" width="${cdu}" height="${cdv}" fill="#0003"/><circle cx="${cu+6}" cy="${cv+cdv/2}" r="3" fill="${ISO.dirt}"/></g>`);
      if(lv>=3)[[cu,cv],[cu+cdu,cv],[cu+cdu,cv+cdv]].forEach(([a,b])=>{ const p=P(a,b,ch+5); g.push(`<rect x="${isoN(p[0]-2)}" y="${isoN(p[1]-1.5)}" width="4" height="3" fill="${ISO.scaf}"/><circle cx="${isoN(p[0])}" cy="${isoN(p[1])}" r="1" fill="#d6333f"/>`); }); } }
  else if(kind==='dorm'){ g.push(isoBox(X,Y,u,v,du,dv,h,W)+isoRoof(X,Y,u,v,du,dv,h,8)); const fl=Math.max(2,Math.round(h/10)); for(let i=0;i<fl;i++)g.push(isoWins(X,Y,v+dv,0,u+2,u+du-2,h-(i+1)*(h/fl)+3,h-i*(h/fl)-3,Math.round(du/7),true));
    g.push(`<g transform="${isoMR(X,Y,u+du)}">${[...Array(fl)].map((_,i)=>`<rect x="${v+5}" y="${isoN(-h+i*(h/fl)+3)}" width="${dv-10}" height="${isoN(h/fl-6)}" fill="${ISO.win}"/>`).join('')}</g>`);
    if(lv>=2){ g.push(isoBox(X,Y,58,12,30,20,10,FL)); g.push(`<g transform="${isoML(X,Y,32)}"><rect x="58" y="-10" width="30" height="3" fill="${col}"/><rect x="61" y="-6" width="24" height="4" fill="${ISO.lamp}" opacity=".85"/></g>`); } }
  else { /* 클럽하우스 */ g.push(isoBox(X,Y,u,v,du,dv,h,FL)); g.push(`<g transform="${isoML(X,Y,v+dv)}"><rect x="${u}" y="${-h}" width="${du}" height="3" fill="${col}"/></g>`); g.push(isoWins(X,Y,v+dv,0,u+4,u+du-14,h-12,h-5,6,true));
    g.push(`<g transform="${isoML(X,Y,v+dv)}"><rect x="${u+du-11}" y="-10" width="8" height="10" fill="${ISO.win}"/></g>`); }
  if(o.bld!=null&&lv<3){ const n=ISO_FP[kind][lv+1]; const [nu,nv,ndu,ndv,nh]=n; g.push(isoScaf(X,Y,nu-2,nv-2,ndu+4,ndv+4,nh+(kind==='dorm'?2:8))); const [x,y]=P(nu+ndu*.8,nv-2,0); g.push(isoCrane(x,y,nh+34,24)); }
  return g.join(''); }
/* 시설 카드용 작은 그림 */
function isoThumb(kind,lv,col,bld){ return `<svg class="isoth" viewBox="-56 -38 146 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${isoBuilding(kind,lv,{col,bld})}</svg>`; }
