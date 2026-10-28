/* 구단 훈련장 전경(아이소메트릭, 시안 B): 시설 단계와 선수 상황을 한 장의 지도에 그린다.
   그림 조각은 gfx/iso.js. 지도는 viewBox 0 0 1000 690 고정(확대는 33_scouting_train.js의 campZoomTo).
   구역(.plot)마다 data-b(확대 범위), data-poly(바닥 마름모), data-hp(건물 윤곽)를 남겨 클릭 판정에 쓴다 */
let CAMP_UNI={a:{S:'#f2f4f6',D:'#CE0E2D',H:'#CE0E2D'},f:{S:'#9aa4ad',D:'#4b5560',H:'#4b5560'},r:{S:'#5b8fd6',D:'#2c4f80',H:'#2c4f80'},y:{S:'#e8eef3',D:'#6b7a88',H:'#6b7a88'}};
let CPID=0;
/* 선수 한 명: 아이소 인형 + 클릭 영역 + 상태 표시. 발 위치가 (x, y). anim은 SVG 애니메이션 조각 */
function cpPlayer(p,x,y,o={}){ CPID++; const u=CAMP_UNI[o.uni||'a'];
  const badge=p.inj?`<g transform="translate(8 -30)"><circle r="5.5" fill="#d6333f" stroke="#fff" stroke-width="1"/><path d="M-3 0h6M0 -3v6" stroke="#fff" stroke-width="1.8"/></g>`:p.tired?`<g transform="translate(8 -30)"><circle r="5.5" fill="#e0a100" stroke="#fff" stroke-width="1"/><text y="2.6" text-anchor="middle" font-size="7" font-weight="700" fill="#111">z</text></g>`:p.hot?`<g transform="translate(8 -30)"><circle r="5.5" fill="#1fa463" stroke="#fff" stroke-width="1"/><path d="M-2.5 1.5 0 -2 2.5 1.5" fill="none" stroke="#fff" stroke-width="1.6"/></g>`:'';
  const dev=p.dev?`<g transform="translate(-8 -30)"><rect x="-5" y="-5" width="10" height="10" rx="2" fill="#18a5b5" stroke="#fff" stroke-width="1"/><path d="M-2.5 2.5 0 -2.5 2.5 2.5" fill="none" stroke="#fff" stroke-width="1.5"/></g>`:'';
  const act=o.act?` ${o.act}`:''; const sty=o.act?` style="--ad:${o.dur||2.6}s;--dl:${o.dl!=null?o.dl:-((p.id*0.37)%2).toFixed(2)}s"`:'';
  return `<g class="cpp${act}" data-pid="${p.id}" transform="translate(${isoN(x)} ${isoN(y)})" tabindex="0" role="button" aria-label="${p.name}"${sty}>
    ${o.anim||''}<g transform="scale(${o.s||1.15})">${isoMan(0,0,{c:u.S,d:u.D,h:o.helm?u.H:u.D,bat:o.bat,bar:o.bar,glove:o.glove})}</g>${dev}${badge}
    <text class="cpn" y="${o.ny||12}">${p.name}</text></g>`; }
function cpWalk(path,dur,begin){ return `<animateMotion dur="${dur}s" begin="${begin||0}s" repeatCount="indefinite" path="${path}"/>`; }
function cpBob(d){ return `<animateTransform attributeName="transform" additive="sum" type="translate" values="0 0;0 -2;0 0" dur="${d||1.2}s" repeatCount="indefinite"/>`; }
/* 화면 점 목록 → 닫힌 경로 */
function cpPath(pts,close){ return 'M'+pts.map(p=>isoN(p[0])+' '+isoN(p[1])).join(' L')+(close?' Z':''); }

/* 투구와 타격이 맞물리는 공: 투수 손을 떠나(56%) 타자에게 닿고(72%), 맞은 공은 멀리 날아간다 */
function cpPitchBall(px,py,hx,hy,fx,fy,dur,r){ const rr=r||3; return `<circle r="${rr}" fill="#fff" opacity="0"><animateMotion dur="${dur}s" repeatCount="indefinite" keyTimes="0;0.56;0.72;1" keyPoints="0;0;1;1" calcMode="linear" path="M${isoN(px)} ${isoN(py)} L${isoN(hx)} ${isoN(hy)}"/><animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" keyTimes="0;0.55;0.56;0.72;0.73;1" values="0;0;1;1;0;0"/></circle>`
  +(fx!=null?`<circle r="${rr}" fill="#fff" opacity="0"><animateMotion dur="${dur}s" repeatCount="indefinite" keyTimes="0;0.73;0.97;1" keyPoints="0;0;1;1" calcMode="linear" path="M${isoN(hx)} ${isoN(hy)} Q${isoN((hx+fx)/2)} ${isoN(Math.min(hy,fy)-120)} ${isoN(fx)} ${isoN(fy)}"/><animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" keyTimes="0;0.72;0.73;0.96;0.97;1" values="0;0;1;1;0;0"/></circle>`:''); }

/* 클릭 구역: 바닥 다각형(poly)과 건물 윤곽(hp). 선택 강조는 첫 다각형(.pso) 테두리 */
function cpBox(pts,m){ const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]); const a=Math.min(...xs)-m, b=Math.min(...ys)-m; return [a,b,Math.max(...xs)+m-a,Math.max(...ys)+m-b].map(v=>Math.round(v)); }
function cpPts(pts){ return pts.map(p=>isoN(p[0])+','+isoN(p[1])).join(' '); }
function isoPlot(key,poly,hp,tag){ const bb=cpBox(poly.concat(hp||[],tag?[[tag[0]-80,tag[1]+44],[tag[0]+80,tag[1]+44]]:[]),10);
  return `<g class="plot" data-k="${key}" data-b="${bb.join(',')}" data-poly="${cpPts(poly)}"${hp?` data-hp="${cpPts(hp)}"`:''}><polygon class="pso" points="${cpPts(poly)}"/></g>`; }
/* 마름모 위로 높이 h만큼 솟은 윤곽(육각형) */
function cpRaise(top,right,bottom,left,h){ return [[top[0],top[1]-h],[right[0],right[1]-h],right,bottom,left,[left[0],left[1]-h]]; }
/* 구역 이름표: 이름 + 단계 칸 + 둘째 줄 */
function cpTag(x,y,title,lv,max,bld,sub){ const tw=[...title].reduce((a,c)=>a+(/[가-힣]/.test(c)?11.2:5.6),0); const pw=max?max*11+6:0; const w=tw+pw+16;
  const pips=max?[...Array(max)].map((_,i)=>`<rect x="${isoN(x-w/2+tw+12+i*11)}" y="${y-3}" width="8" height="4" rx="1" fill="${i+1<=lv?'#4fd27c':bld&&i+1===lv+1?'#e0a100':'#ffffff33'}"/>`).join(''):'';
  return `<g class="cptag"><rect x="${isoN(x-w/2)}" y="${y-12}" width="${isoN(w)}" height="17" rx="4" fill="#0b1218e0" stroke="#ffffff26"/><text class="pt" x="${isoN(x-w/2+8)}" y="${y+1}">${title}</text>${pips}${sub?`<text class="pl" x="${isoN(x)}" y="${y+18}" text-anchor="middle">${sub}</text>`:''}</g>`; }

/* ===== 2군 훈련장 ===== 세계 좌표 원점 (460,150), 땅 u 0~520 × v 0~420 */
const FARM_LOT={fut:[6,6,288,250],weight:[6,284,146,130],indoor:[322,6,192,134],rehab:[156,284,140,130],lab:[322,146,192,110],dorm:[322,284,192,130]};
const FARM_NM={fut:'2군 구장',indoor:'실내 연습장',weight:'웨이트·컨디셔닝',rehab:'재활·회복 센터',lab:'피칭·타격 랩',dorm:'선수 숙소·식당'};
function renderFarm(S){ CPID=0; const P=S.players; const g=[], pl=[], top=[], plots=[]; const by=k=>P.filter(p=>p.where===k); const col=S.acc||S.teamCol||'#d6333f';
  const OX=460, OY=150, W=(u,v,h)=>isoXY(OX,OY,u,v,h);
  g.push(`<rect width="1000" height="690" fill="${ISO.bg}"/>`+isoTile(OX,OY,-8,-8,536,436,ISO.plaza)+isoTile(OX,OY,300,-8,16,436,ISO.road)+isoTile(OX,OY,-8,262,536,16,ISO.road)
    +`<g transform="${isoMT(OX,OY,0)}"><path d="M308 -8V428M-8 270H528" stroke="#ffffff38" stroke-width="1" stroke-dasharray="8 8" vector-effect="non-scaling-stroke" fill="none"/></g>`);
  for(const k of ['fut','weight','indoor','rehab','lab','dorm']){ const [u,v,du,dv]=FARM_LOT[k]; const lv=S.lv[k]||0, b=S.bmap&&S.bmap[k]; const D=FACI[k];
    const c0=W(u,v), c1=W(u+du,v), c2=W(u+du,v+dv), c3=W(u,v+dv);
    g.push(isoTile(OX,OY,u,v,du,dv,ISO.lot));
    const s=Math.min(du/100,dv/70), cu=u+(du-100*s)/2, cv=v+(dv-70*s)/2; const [bx,by0]=W(cu,cv); const pt=(a,c)=>[bx+s*(a-c), by0+s*(a+c)/2];
    let hp=null;
    if(k==='fut'){ const F=Math.min(du,dv)-18, fu=u+(du-F)/2, fv=v+(dv-F)/2; const [fx,fy]=W(fu,fv); g.push(isoFarmField(fx,fy,F,lv,col));
      const FP=(a,c)=>isoFieldPt(fx,fy,F,a,c); const Fp=by('fut');
      const sp=[[17,17],[31,9],[36,23],[23,36],[9,31],[34,64],[62,62],[64,34]];
      Fp.slice(0,8).forEach((p,i)=>{ const [x,y]=FP(...sp[i]); pl.push(cpPlayer(p,x,y,{uni:'f',glove:1,act:i===0?'th':null,dur:2.8,dl:0})); });
      if(Fp[8]){ const [x,y]=FP(3,9); pl.push(cpPlayer(Fp[8],x,y,{uni:'f',bat:1,helm:1,act:'sw',dur:2.8,dl:0})); }
      if(Fp[0]&&Fp[8]){ const m=FP(17,17), h=FP(4,8), f=FP(60,70); pl.push(cpPitchBall(m[0],m[1]-16,h[0]+4,h[1]-10,f[0],f[1]-6,2.8,2.6)); }
      if(Fp.length>9){ const [x,y]=FP(16,1); top.push(`<text class="pl" x="${isoN(x)}" y="${isoN(y)}" text-anchor="middle">벤치 ${Fp.length-9}명</text>`); } }
    else { g.push(`<g transform="translate(${isoN(bx)} ${isoN(by0)}) scale(${isoN(s*100)/100})">${isoBuilding(k,lv,{lot:false,col,bld:b?b.pct:null})}</g>`);
      if(lv>0||b){ const H=(k==='dorm'?46:k==='indoor'?36:30)*s; hp=cpRaise(pt(8,8),pt(96,8),pt(96,40),pt(8,40),H); }
      if(lv===0&&!b){ const [x,y]=pt(50,36); top.push(`<text class="pl" x="${isoN(x)}" y="${isoN(y)}" text-anchor="middle">빈 부지 · 눌러서 공사</text>`); }
      if(lv>0){ /* 앞마당 선수 */
        if(k==='indoor'){ const cages=[0,2,4,5][lv]; const L=by('indoor'); L.slice(0,cages).forEach((p,i)=>{ const [x,y]=pt(16+i*17,54); pl.push(cpPlayer(p,x,y,{bat:1,helm:1,uni:p.uni||'a',act:'sw',dur:(1.6+i*.25).toFixed(2),dl:0})); });
          if(L.length>cages){ const [x,y]=pt(4,66); top.push(`<text class="pl" x="${isoN(x)}" y="${isoN(y)}" text-anchor="middle">외 ${L.length-cages}명</text>`); } }
        if(k==='weight'){ const L=by('weight'); L.slice(0,4).forEach((p,i)=>{ const [x,y]=pt(14+i*20,54); pl.push(cpPlayer(p,x,y,{bar:1,act:'lift',dur:(1.5+i*.2).toFixed(1),dl:0})); });
          if(L.length>4){ const [x,y]=pt(4,68); top.push(`<text class="pl" x="${isoN(x)}" y="${isoN(y)}" text-anchor="middle">외 ${L.length-4}명</text>`); } }
        if(k==='rehab'){ const R=by('rehab'); let j=0; R.slice(0,4).forEach((p,i)=>{ if(i===0&&lv>=2){ const [x,y]=pt(78,23); pl.push(`<ellipse cx="${isoN(x)}" cy="${isoN(y)}" rx="8" ry="4" fill="none" stroke="#fff" opacity=".6"><animate attributeName="rx" values="6;18" dur="2.4s" repeatCount="indefinite"/><animate attributeName="ry" values="3;9" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="2.4s" repeatCount="indefinite"/></ellipse>`+cpPlayer(p,x,y,{uni:'r'})); return; }
            const [x,y]=pt(16+j*18,54); j++; pl.push(cpPlayer(p,x,y,{uni:'r'})); });
          if(R.length>4){ const [x,y]=pt(4,68); top.push(`<text class="pl" x="${isoN(x)}" y="${isoN(y)}" text-anchor="middle">외 ${R.length-4}명</text>`); } }
        if(k==='lab'){ const L=by('lab'); const p=L[0]; if(p){ const [x,y]=pt(30,54); pl.push(cpPlayer(p,x,y,{glove:1,act:'th',dur:2.2,dl:0})); const t=lv>=2?pt(66,22):pt(66,50); pl.push(cpPitchBall(x+4,y-16,t[0],t[1]-8,null,null,2.2,2.4)); top.push(`<text class="pl" x="${isoN(t[0])}" y="${isoN(t[1]+14)}" text-anchor="middle">${140+(p.id%9)}km/h</text>`); }
          const q=L[1]; if(q){ const [x,y]=pt(52,62); pl.push(cpPlayer(q,x,y,{anim:cpBob(2)})); } }
        if(k==='dorm'){ by('dorm').forEach((p,i)=>{ const loop=[pt(8+i*6,46),pt(92,46),pt(92,64),pt(8+i*6,64)]; pl.push(cpPlayer(p,0,0,{uni:'y',act:'ar',dur:.5,anim:cpWalk(cpPath(loop,true),12+i*2,-i*3)})); }); } } }
    plots.push(isoPlot(k,[c0,c1,c2,c3],hp,[c2[0],c2[1]-(b?52:30)]));
    /* 이름표·공사 막대: 부지 앞 모서리 아래 */
    const tx=c2[0], ty=c2[1]-(b?52:30); top.push(cpTag(tx,ty,FARM_NM[k],lv,3,b,D?D.lv[lv]:''));
    if(b)top.push(isoBar(tx,ty+36,150,b.pct,`${D.lv[b.lv]} 공사 ${Math.round(b.pct*100)}% · ${b.left}일 남음`,10)); }
  /* 도로를 오가는 선수 */
  by('road').forEach((p,i)=>{ const a=W(0,270), z=W(520,270); pl.push(cpPlayer(p,0,0,{uni:'f',act:'ar',dur:.5,anim:cpWalk(`M${isoN(a[0]+i*24)} ${isoN(a[1]+i*12)} L${isoN(z[0])} ${isoN(z[1])} L${isoN(a[0]+i*24)} ${isoN(a[1]+i*12)}`,26+i*4,-i*7)})); });
  return `<svg class="campus iso" viewBox="0 0 1000 690" xmlns="http://www.w3.org/2000/svg">${g.join('')}${plots.join('')}${pl.join('')}${top.join('')}</svg>`; }

/* ===== 1군 홈구장 ===== 구장(실제 구장 단계 반영) + 클럽하우스 + 구단 버스 */
function renderHome(S){ CPID=0; const P=S.players; const g=[], pl=[], top=[], plots=[]; const by=k=>P.filter(p=>p.where===k); const col=S.acc||S.teamCol||'#d6333f';
  g.push(`<rect width="1000" height="690" fill="${ISO.bg}"/>`);
  /* 구장: 지역 좌표(필드 뒤 모서리 100,40)를 SC배 */
  const SC=2.7, TX=86, TY=180; const loc=(x,y)=>[TX+SC*x, TY+SC*y]; const hp=(a,b)=>loc(100+a-b,40+(a+b)/2);
  g.push(`<g transform="translate(${TX} ${TY}) scale(${SC})">${isoStadium(Object.assign({},S.stad||{},{col,fs:4,proj:null}))}</g>`);
  { const T=34, c0=hp(-T,-T), c1=hp(88,-T), c2=hp(88,88), c3=hp(-T,88); plots.push(isoPlot('main',[c0,c1,c2,c3],cpRaise(c0,c1,c2,c3,70*SC),[c2[0],c2[1]+16]));
    top.push(cpTag(c2[0],c2[1]+16,`${S.stadName||'홈구장'} · 1군 ${by('main').length+by('club').length}명`,0,0,null,`${S.mainNote||''}${S.board?' · '+S.board:''}`)); }
  const M=by('main'); const pit=M.filter(p=>p.isP), bat=M.filter(p=>!p.isP);
  const spots=[[35,11],[42,27],[27,42],[11,35],[38,68],[66,66],[68,38],[2.5,2.5]];
  const fld=bat.slice(0,8); fld.forEach((p,i)=>{ const [x,y]=hp(...spots[i]);
    if(i>=4&&i<7){ const d=i===4?[-6,4]:i===6?[4,-6]:[5,5]; const [x2,y2]=hp(spots[i][0]+d[0],spots[i][1]+d[1]); pl.push(cpPlayer(p,0,0,{glove:1,s:1.25,act:'ar',dur:.45,anim:`<animateMotion dur="5.2s" repeatCount="indefinite" keyTimes="0;0.4;0.6;1" keyPoints="0;1;1;0" calcMode="linear" path="M${isoN(x)} ${isoN(y)} L${isoN(x2)} ${isoN(y2)}"/>`})); }
    else pl.push(cpPlayer(p,x,y,{glove:1,s:1.25})); });
  const md=hp(17,17), hm=hp(4,8);
  if(pit[0])pl.push(cpPlayer(pit[0],md[0],md[1],{glove:1,s:1.25,act:'th',dur:2.6,dl:0}));
  const bt=bat[8]; if(bt){ const [x,y]=hp(3,9); pl.push(cpPlayer(bt,x,y,{bat:1,helm:1,s:1.25,act:'sw',dur:2.6,dl:0})); }
  if(pit[0]&&bt){ const f=hp(58,72); pl.push(cpPitchBall(md[0]+3,md[1]-20,hm[0]+4,hm[1]-12,f[0],f[1]-8,2.6,3.2)); }
  /* 펑고: 3루 파울 지역의 코치가 유격수·3루수에게 땅볼 */
  if(fld[2]||fld[3]){ const [cx,cy]=hp(2.5,20); pl.push(isoMan(cx,cy,{c:'#1d242b',d:'#0b0f14',s:1.2})+`<text class="pl" x="${isoN(cx)}" y="${isoN(cy+12)}" text-anchor="middle">코치</text>`);
    [[2,0],[3,1.7]].forEach(([i,dl])=>{ if(!fld[i])return; const [tx,ty]=hp(...spots[i]); pl.push(`<circle r="2.8" fill="#fff"><animateMotion dur="3.4s" begin="${dl}s" repeatCount="indefinite" keyTimes="0;0.2;0.55;1" keyPoints="0;0;1;1" calcMode="linear" path="M${isoN(cx+3)} ${isoN(cy-14)} L${isoN(tx)} ${isoN(ty-4)}"/></circle>`); }); }
  /* 불펜(1루 쪽 파울 지역) */
  pit.slice(1,3).forEach((p,i)=>{ const [x,y]=hp(60+i*9,2.6); pl.push(cpPlayer(p,x,y,{glove:1,s:1.15,act:'th',dur:2.2+i*.4})); });
  /* 외야 워닝트랙을 뛰는 투수들 */
  const trk=[hp(76,9),hp(76.5,76.5),hp(9,76)]; pit.slice(3,6).forEach((p,i)=>pl.push(cpPlayer(p,0,0,{s:1.1,act:'ar',dur:.4,anim:`<animateMotion dur="${16+i*2}s" begin="${-i*5}s" repeatCount="indefinite" path="${cpPath([trk[0],trk[1],trk[2],trk[1],trk[0]])}"/>`})));
  /* 3루 쪽 파울 지역 벤치 */
  const bench=bat.slice(9).concat(pit.slice(6)); bench.slice(0,5).forEach((p,i)=>{ const [x,y]=hp(2.6,44+i*6); pl.push(cpPlayer(p,x,y,{s:1.05})); });
  if(bench.length>5){ const [x,y]=hp(1,76); top.push(`<text class="pl" x="${isoN(x)}" y="${isoN(y)}" text-anchor="middle">벤치 외 ${bench.length-5}명</text>`); }
  /* 클럽하우스: 지친 1군 선수가 쉬는 곳 */
  { const CX=800, CY=150, s=1.3; const pt=(a,c)=>[CX+s*(a-c), CY+s*(a+c)/2]; const c0=pt(0,0), c1=pt(100,0), c2=pt(100,70), c3=pt(0,70);
    g.push(`<g transform="translate(${CX} ${CY}) scale(${s})">${isoBuilding('club',1,{col})}</g>`);
    plots.push(isoPlot('club',[c0,c1,c2,c3],cpRaise(pt(8,8),pt(82,8),pt(82,38),pt(8,38),24*s),[c2[0],c2[1]+16]));
    const C=by('club'); C.slice(0,6).forEach((p,i)=>{ const [x,y]=pt(16+(i%3)*22,50+Math.floor(i/3)*12); pl.push(cpPlayer(p,x,y,{s:1.1})); });
    if(C.length>6){ const [x,y]=pt(96,66); top.push(`<text class="pl" x="${isoN(x)}" y="${isoN(y)}" text-anchor="end">외 ${C.length-6}명</text>`); }
    if(!C.length){ const [x,y]=pt(50,56); top.push(`<text class="pl" x="${isoN(x)}" y="${isoN(y)}" text-anchor="middle">쉬는 선수 없음</text>`); }
    top.push(cpTag(c2[0],c2[1]+16,'클럽하우스',0,0,null,'휴식·치료 공간')); }
  /* 주차장·구단 버스 */
  { const bl=S.bus||0; const BX=840, BY=372, s=.78; const L=[140,160,176][bl], Wd=[46,50,52][bl], H=[54,58,60][bl]; const pt=(a,c,h)=>[BX+s*(a-c), BY+s*((a+c)/2-(h||0))];
    const pu=-22, pv=-30, pdu=L+44, pdv=Wd+48;
    g.push(`<g transform="translate(${BX} ${BY}) scale(${s})">${isoTile(0,0,pu,pv,pdu,pdv,ISO.road)}<g transform="${isoMT(0,0,0)}"><path d="M${pu} ${pv+8}H${pu+pdu}M${pu} ${pv+pdv-8}H${pu+pdu}" stroke="#ffffff55" stroke-width="1.2" vector-effect="non-scaling-stroke" stroke-dasharray="14 8"/></g>${isoBus(bl,{col})}</g>`);
    const c2=pt(pu+pdu,pv+pdv); plots.push(isoPlot('bus',[pt(pu,pv),pt(pu+pdu,pv),pt(pu+pdu,pv+pdv),pt(pu,pv+pdv)],cpRaise(pt(0,0),pt(L,0),pt(L,Wd),pt(0,Wd),(H+7)*s),[c2[0]-30,c2[1]+16]));
    top.push(cpTag(c2[0]-30,c2[1]+16,'구단 버스',bl,2,null,['일반 버스 · 원정 피로 +10%','우등 버스 · 원정 피로 +2%','리무진 버스 · 원정 피로 -6%'][bl])); }
  return `<svg class="campus iso" viewBox="0 0 1000 690" xmlns="http://www.w3.org/2000/svg">${g.join('')}${plots.join('')}${pl.join('')}${top.join('')}</svg>`; }

function renderCampus(S){ return S.view==='farm'?renderFarm(S):renderHome(S); }
