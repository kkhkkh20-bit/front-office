/* 구단 훈련장 전경: 시설 단계와 선수 상황을 한 장의 지도에 그린다 */
let CAMP_UNI={a:{S:'#f2f4f6',D:'#CE0E2D',H:'#CE0E2D'},f:{S:'#9aa4ad',D:'#4b5560',H:'#4b5560'},r:{S:'#5b8fd6',D:'#2c4f80',H:'#2c4f80'},y:{S:'#e8eef3',D:'#6b7a88',H:'#6b7a88'}};
let CPID=0;
/* 선수 한 명: 위에서 본 그림 + 클릭 영역 + 상태 표시. anim은 SVG 애니메이션 조각 */
function cpPlayer(p,x,y,o={}){ const id='cp'+(++CPID); const u=CAMP_UNI[o.uni||'a'];
  const badge=p.inj?`<g transform="translate(9 -14)"><circle r="5.5" fill="#d6333f" stroke="#fff" stroke-width="1"/><path d="M-3 0h6M0 -3v6" stroke="#fff" stroke-width="1.8"/></g>`:p.tired?`<g transform="translate(9 -14)"><circle r="5.5" fill="#e0a100" stroke="#fff" stroke-width="1"/><text y="2.6" text-anchor="middle" font-size="7" font-weight="700" fill="#111">z</text></g>`:p.hot?`<g transform="translate(9 -14)"><circle r="5.5" fill="#1fa463" stroke="#fff" stroke-width="1"/><path d="M-2.5 1.5 0 -2 2.5 1.5" fill="none" stroke="#fff" stroke-width="1.6"/></g>`:'';
  const dev=p.dev?`<g transform="translate(-10 -14)"><rect x="-5" y="-5" width="10" height="10" rx="2" fill="#18a5b5" stroke="#fff" stroke-width="1"/><path d="M-2.5 2.5 0 -2.5 2.5 2.5" fill="none" stroke="#fff" stroke-width="1.5"/></g>`:'';
  const act=o.act?` ${o.act}`:''; const sty=o.act?` style="--ad:${o.dur||2.6}s;--dl:${o.dl!=null?o.dl:-((p.id*0.37)%2).toFixed(2)}s"`:'';
  return `<g class="cpp${act}" data-pid="${p.id}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${p.name}"${sty}>
    ${o.anim||''}<g transform="scale(${o.s||.62})"><ellipse cx="1" cy="2" rx="14" ry="12" fill="#0003"/><g transform="rotate(${o.rot||0})">${kPlayer({...u,v:p.v%5,rot:0,helm:o.helm?u.H:null,glove:o.glove,bat:o.bat,pose:o.pose})}</g></g>${dev}${badge}
    <text class="cpn" y="${o.ny||19}">${p.name}</text></g>`; }
function cpWalk(path,dur,begin){ return `<animateMotion dur="${dur}s" begin="${begin||0}s" repeatCount="indefinite" rotate="auto" path="${path}"/>`; }
function cpBob(d){ return `<animateTransform attributeName="transform" additive="sum" type="translate" values="0 0;0 -2;0 0" dur="${d||1.2}s" repeatCount="indefinite"/>`; }

/* 투구와 타격이 맞물리는 공: 투수 손을 떠나(56%) 타자에게 닿고(72%), 맞은 공은 멀리 날아간다 */
function cpPitchBall(px,py,hx,hy,fx,fy,dur,r){ const rr=r||3; return `<circle r="${rr}" fill="#fff" opacity="0"><animateMotion dur="${dur}s" repeatCount="indefinite" keyTimes="0;0.56;0.72;1" keyPoints="0;0;1;1" calcMode="linear" path="M${px} ${py} L${hx} ${hy}"/><animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" keyTimes="0;0.55;0.56;0.72;0.73;1" values="0;0;1;1;0;0"/></circle>`
  +(fx!=null?`<circle r="${rr}" fill="#fff" opacity="0"><animateMotion dur="${dur}s" repeatCount="indefinite" keyTimes="0;0.73;0.97;1" keyPoints="0;0;1;1" calcMode="linear" path="M${hx} ${hy} Q${(hx+fx)/2} ${Math.min(hy,fy)-120} ${fx} ${fy}"/><animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" keyTimes="0;0.72;0.73;0.96;0.97;1" values="0;0;1;1;0;0"/></circle>`:''); }
function plotFrame(x,y,w,h,title,lv,max,bld,key){ const pips=[1,2,3].map(i=>`<rect x="${x+w-46+i*12}" y="${y+7}" width="9" height="4" rx="1" fill="${i<=lv?'#4fd27c':bld&&i===lv+1?'#e0a100':'#ffffff33'}"/>`).join('');
  return `<g class="plot" data-k="${key}" data-b="${x},${y},${w},${h}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="none" stroke="#ffffff22"/>
    <rect x="${x}" y="${y}" width="${w}" height="18" rx="6" fill="#0b1218cc"/><text class="pt" x="${x+8}" y="${y+13}">${title}</text>${max?pips:''}</g>`; }

/* 공사 중: 비계 무늬 + 크레인 + 진행 막대 */
function construction(x,y,w,h,pct,label){ const pid='hatch'+x+y;
  return `<defs><pattern id="${pid}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#c8a35a"/><rect width="5" height="10" fill="#2b2b2b"/></pattern></defs>
  <rect x="${x+8}" y="${y+26}" width="${w-16}" height="${h-44}" fill="#8d7a5a"/><rect x="${x+8}" y="${y+26}" width="${w-16}" height="${h-44}" fill="none" stroke="url(#${pid})" stroke-width="5"/>
  <g transform="translate(${x+w*.62} ${y+h*.45})"><rect x="-4" y="-4" width="8" height="8" fill="#e0a100"/><g><line x1="0" y1="0" x2="${-w*.45}" y2="-6" stroke="#e0a100" stroke-width="4"/><line x1="0" y1="0" x2="${w*.18}" y2="3" stroke="#e0a100" stroke-width="4"/><rect x="${w*.18-6}" y="-2" width="10" height="10" fill="#555"/><line x1="${-w*.38}" y1="-5" x2="${-w*.38}" y2="18" stroke="#ddd" stroke-width="1"/><rect x="${-w*.38-7}" y="18" width="14" height="8" fill="#9aa4ad"/>
    <animateTransform attributeName="transform" type="rotate" values="-8;14;-8" dur="7s" repeatCount="indefinite"/></g></g>
  <rect x="${x+12}" y="${y+h-14}" width="${w-24}" height="6" rx="3" fill="#ffffff22"/><rect x="${x+12}" y="${y+h-14}" width="${(w-24)*pct}" height="6" rx="3" fill="#e0a100"/>
  <text class="pl" x="${x+w/2}" y="${y+h-19}" text-anchor="middle">${label}</text>`; }

/* 증축 중인 시설 아래쪽 진행 막대 + "다음 단계 · 진행률 · 남은 일수" */
function bldBar(x,y,w,h,b,name){ return `<g class="cpbld"><rect x="${x+12}" y="${y+h-24}" width="${w-24}" height="6" rx="3" fill="#0b1218aa"/><rect x="${x+12}" y="${y+h-24}" width="${Math.max(2,(w-24)*b.pct)}" height="6" rx="3" fill="#e0a100"/><text class="pl" x="${x+w-14}" y="${y+h-29}" text-anchor="end">${name} 공사 ${Math.round(b.pct*100)}% · ${b.left}일 남음</text></g>`; }
function emptyLot(x,y,w,h,txt){ return `<rect x="${x+8}" y="${y+26}" width="${w-16}" height="${h-36}" fill="#5f7d4a" stroke="#d9d2bd" stroke-dasharray="4 3"/><text class="pl" x="${x+w/2}" y="${y+h/2+12}" text-anchor="middle">${txt}</text>`; }
/* 지붕을 걷어낸 건물: 벽 두께 + 바닥 */
function bldg(x,y,w,h,floor){ return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${floor}" stroke="#d8dde2" stroke-width="5"/><rect x="${x+w/2-9}" y="${y+h-3}" width="18" height="6" fill="${floor}"/>`; }

function renderFarm(S){ CPID=0; const P=S.players; const g=[];
  const by=k=>P.filter(p=>p.where===k);
  /* 바탕: 잔디·도로·주차장 */
  g.push(`<rect width="1000" height="700" fill="#3c8a4f"/>${[...Array(14)].map((_,i)=>`<rect x="${i*72}" width="36" height="700" fill="#ffffff07"/>`).join('')}
    <path d="M0 352 H1000 M246 352 V610 M492 352 V610 M738 352 V610 M0 618 H1000" stroke="#8b939b" stroke-width="16" fill="none"/><path d="M0 352 H1000 M246 352 V610 M492 352 V610 M738 352 V610 M0 618 H1000" stroke="#ffffff55" stroke-width="1" stroke-dasharray="8 8" fill="none"/>
    ${[...Array(12)].map((_,i)=>`<rect x="${40+i*16}" y="640" width="11" height="20" rx="2" fill="${['#c94b4b','#3b6fb6','#e7e7e7','#2e2e2e','#d9b440'][i%5]}"/>`).join('')}<rect x="28" y="632" width="210" height="36" fill="none" stroke="#ffffff44"/><text class="pl" x="250" y="656">2군 선수단 주차장</text>`);

  /* 2군 구장 */
  { const x=16,y=16,w=560,h=322, lv=S.lv.fut; g.push(plotFrame(x,y,w,h,`2군 구장 · ${['낡은 공용 구장','천연잔디','조명·불펜 개선','퓨처스 전용 구장'][lv]}`,lv,3,S.bmap&&S.bmap.fut,'fut'));
    const cx=x+w/2, cy=y+h-30; const grass=lv>=1?'#2f8a45':'#7d8f4e', stripe=lv>=1?'#ffffff0c':'#6b5a3a40';
    if(lv>=3)g.push(`<path d="M${cx} ${cy+16} L${x+12} ${y+118} Q${cx} ${y-30} ${x+w-12} ${y+118} Z" fill="#5d6670"/>`);
    g.push(`<path d="M${cx} ${cy} L${x+34} ${y+124} Q${cx} ${y+16} ${x+w-34} ${y+124} Z" fill="${grass}"/>${lv>=1?[...Array(10)].map((_,i)=>`<path d="M${cx} ${cy} L${x+34+i*50} ${y+40} L${x+58+i*50} ${y+40} Z" fill="${stripe}"/>`).join(''):`<g fill="#8a7650" opacity=".55">${[...Array(18)].map((_,i)=>`<ellipse cx="${x+60+(i*53)%320}" cy="${y+70+(i*37)%180}" rx="${8+i%4*3}" ry="${4+i%3*2}"/>`).join('')}</g>`}
      <path d="M${cx} ${cy} L${cx+60} ${cy-60} L${cx} ${cy-120} L${cx-60} ${cy-60} Z" fill="#a9824f"/><path d="M${cx} ${cy-8} L${cx+46} ${cy-56} L${cx} ${cy-102} L${cx-46} ${cy-56} Z" fill="${grass}"/><circle cx="${cx}" cy="${cy-56}" r="9" fill="#a9824f"/>`);
    if(lv>=2){ g.push([[x+20,y+40],[x+w-20,y+40],[x+24,y+250],[x+w-24,y+250]].map(([lx,ly])=>`<g><circle cx="${lx}" cy="${ly}" r="14" fill="#fff7d6" opacity=".18"/><rect x="${lx-6}" y="${ly-3}" width="12" height="6" rx="1" fill="#f3f0e0" stroke="#555"/></g>`).join('')
      +`<rect x="${x+26}" y="${y+150}" width="44" height="12" fill="#a9824f"/><rect x="${x+w-70}" y="${y+150}" width="44" height="12" fill="#a9824f"/><text class="pl" x="${x+48}" y="${y+175}" text-anchor="middle">불펜</text>`); }
    const F=by('fut'); const sp=[[cx,cy-56,90],[cx+50,cy-68,135],[cx+26,cy-112,100],[cx-26,cy-112,80],[cx-50,cy-68,45],[cx-120,cy-150,60],[cx,cy-196,90],[cx+120,cy-150,120]];
    F.slice(0,8).forEach((p,i)=>{ const [px,py,r]=sp[i]; g.push(cpPlayer(p,px,py,{uni:'f',rot:r,glove:'L',pose:i===0?'set':null,act:i===0?'th':null,dur:2.8,dl:0})); });
    if(F[8]) g.push(cpPlayer(F[8],cx-15,cy-2,{uni:'f',bat:'R',helm:1,act:'sw',dur:2.8,dl:0}));
    if(F[0]&&F[8]) g.push(cpPitchBall(cx+4,cy-58,cx-8,cy-8,cx+90,cy-190,2.8,2.6));
    if(lv>=3) g.push(`<rect x="${x+w-112}" y="${y+26}" width="90" height="22" fill="#0a0d10" stroke="#3a4652"/><text x="${x+w-67}" y="${y+41}" text-anchor="middle" class="sb">${S.futNote||'퓨처스 훈련'}</text>`);
    if(F.length>9) g.push(`<text class="pl" x="${x+16}" y="${y+h-10}">벤치 ${F.length-9}명</text>`);
    if(S.bmap&&S.bmap.fut) g.push(bldBar(x+w*.62,y,w*.38,h,S.bmap.fut,['낡은 공용 구장','천연잔디','조명·불펜 개선','퓨처스 전용 구장'][lv+1]||'')); }

  /* 아래 줄 시설들 */
  const row=(key,x,w,title,lvNames,draw,Y,H)=>{ const y=Y||370,h=H||226, lv=S.lv[key], b=S.bmap&&S.bmap[key]; g.push(plotFrame(x,y,w,h,title,lv,3,b,key)); g.push(`<text class="pl" x="${x+8}" y="${y+h-4}">${lvNames[lv]}</text>`);
    if(b&&lv===0){ g.push(construction(x,y,w,h,b.pct,`${lvNames[1]} 공사 ${Math.round(b.pct*100)}% · ${b.left}일 남음`)); return; }
    if(lv===0){ g.push(emptyLot(x,y,w,h,'빈 부지 · 눌러서 공사')); return; }
    draw(x,y,w,h,lv); if(b)g.push(bldBar(x,y,w,h,b,lvNames[lv+1])); };

  row('indoor',592,392,'실내 연습장',['없음','간이 연습장','실내 연습장','실내 훈련동'],(x,y,w,h,lv)=>{ const bw=lv===1?w-200:lv===2?w-60:w-20; g.push(bldg(x+10,y+28,bw,h-48,'#3f8f55'));
    const cages=lv===1?2:lv===2?4:5; for(let i=0;i<cages;i++){ const cx=x+22+i*70, cy=y+40; g.push(`<rect x="${cx}" y="${cy}" width="52" height="${h-74}" fill="#00000022" stroke="#ffffff55" stroke-dasharray="3 2"/><rect x="${cx+20}" y="${cy+8}" width="12" height="8" fill="#555"/>`);
      const p=by('indoor')[i]; if(p){ const d=(1.6+i*.25).toFixed(2); g.push(cpPlayer(p,cx+22,cy+h-98,{bat:'R',helm:1,uni:p.uni||'a',act:'sw',dur:d,dl:0})); g.push(cpPitchBall(cx+26,cy+16,cx+26,cy+h-108,cx+26+(i%2?-14:14),cy+20,d,2.2)); } } },16,322);

  row('weight',16,214,'웨이트·컨디셔닝',['없음','기본 웨이트장','컨디셔닝 센터','퍼포먼스 센터'],(x,y,w,h,lv)=>{ g.push(bldg(x+10,y+28,w-20,h-48,'#39424c'));
    const n=2+lv*2; for(let i=0;i<n;i++){ const ex=x+28+(i%4)*40, ey=y+46+Math.floor(i/4)*58; g.push(`<rect x="${ex}" y="${ey}" width="26" height="8" rx="2" fill="#20262c"/><rect x="${ex-4}" y="${ey-2}" width="4" height="12" fill="#8b939b"/><rect x="${ex+26}" y="${ey-2}" width="4" height="12" fill="#8b939b"/>`); }
    by('weight').slice(0,4).forEach((p,i)=>g.push(`<rect x="${x+40+(i%2)*80-16}" y="${y+86+Math.floor(i/2)*60-2}" width="32" height="4" rx="2" fill="#8b939b"><animate attributeName="width" values="32;24;32" dur="${(1.5+i*.2).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="x" values="${x+40+(i%2)*80-16};${x+40+(i%2)*80-12};${x+40+(i%2)*80-16}" dur="${(1.5+i*.2).toFixed(1)}s" repeatCount="indefinite"/></rect>`+cpPlayer(p,x+40+(i%2)*80,y+86+Math.floor(i/2)*60,{rot:90,act:'lift',dur:(1.5+i*.2).toFixed(1),dl:0})));
    if(lv>=2)g.push(`<rect x="${x+w-50}" y="${y+40}" width="30" height="80" rx="4" fill="#2a6f97"/><text class="pl" x="${x+w-35}" y="${y+135}" text-anchor="middle">러닝 트랙</text>`); });

  row('rehab',262,214,'재활·회복 센터',['없음','물리치료실','재활센터(수중)','회복 센터'],(x,y,w,h,lv)=>{ g.push(bldg(x+10,y+28,w-20,h-48,'#e6ebef'));
    if(lv>=2){ g.push(`<rect x="${x+22}" y="${y+40}" width="${w-44}" height="70" rx="10" fill="#4fa3d8"/><rect x="${x+22}" y="${y+40}" width="${w-44}" height="70" rx="10" fill="none" stroke="#bfe3f7" stroke-width="3"/>`); }
    g.push([0,1,2].map(i=>`<rect x="${x+24+i*46}" y="${y+130}" width="30" height="48" rx="3" fill="#cfd8de" stroke="#9aa4ad"/>`).join(''));
    if(lv>=3)g.push(`<circle cx="${x+w-36}" cy="${y+58}" r="12" fill="#9fd8f0" stroke="#fff"/><text class="pl dk" x="${x+w-36}" y="${y+84}" text-anchor="middle">냉각</text>`);
    const RH=by('rehab'); if(RH.length>4)g.push(`<text class="pl dk" x="${x+w-16}" y="${y+h-26}" text-anchor="end">외 ${RH.length-4}명</text>`);
    RH.slice(0,4).forEach((p,i)=>{ if(i===0&&lv>=2)g.push(`<g><circle cx="${x+70}" cy="${y+76}" r="10" fill="none" stroke="#fff" opacity=".6"><animate attributeName="r" values="8;22" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="2.4s" repeatCount="indefinite"/></circle></g>`+cpPlayer(p,x+70,y+76,{uni:'r',rot:90,anim:`<animateTransform attributeName="transform" additive="sum" type="translate" values="0 0;30 0;0 0" dur="8s" repeatCount="indefinite"/>`,ny:20}));
      else g.push(cpPlayer(p,x+39+((i-(lv>=2?1:0))%3)*46,y+152,{uni:'r',rot:90,ny:28})); }); });

  row('lab',508,214,'피칭·타격 랩',['없음','랩소도·영상','트래킹 랩','바이오메카닉스 랩'],(x,y,w,h,lv)=>{ g.push(bldg(x+10,y+28,w-20,h-48,'#2c3440'));
    g.push(`<circle cx="${x+50}" cy="${y+110}" r="16" fill="#a9824f"/><rect x="${x+w-46}" y="${y+60}" width="10" height="100" fill="#00000055" stroke="#ffffff77"/>
      <rect x="${x+w-64}" y="${y+40}" width="40" height="14" rx="2" fill="#0b1218"/><rect x="${x+w-62}" y="${y+42}" width="36" height="10" fill="#4fd27c"><animate attributeName="opacity" values="1;.3;1" dur="1.4s" repeatCount="indefinite"/></rect>
      ${lv>=2?`<g fill="#e0a100">${[[x+20,y+40],[x+20,y+170],[x+90,y+40]].map(([a,b])=>`<rect x="${a}" y="${b}" width="8" height="6"/><circle cx="${a+4}" cy="${b+3}" r="1.6" fill="#d6333f"/>`).join('')}</g>`:''}`);
    const p=by('lab')[0]; if(p){ g.push(cpPlayer(p,x+50,y+110,{rot:0,pose:'set',glove:'L',act:'th',dur:2.2,dl:0})); g.push(cpPitchBall(x+60,y+108,x+w-42,y+110,null,null,2.2,2.4)); g.push(`<text class="pl" x="${x+w-41}" y="${y+170}" text-anchor="middle"><tspan>${140+(p.id%9)}km/h</tspan></text>`); }
    const q=by('lab')[1]; if(q)g.push(cpPlayer(q,x+60,y+170,{rot:-90,anim:cpBob(2)})); });

  row('dorm',754,230,'선수 숙소·식당',['없음','기숙사','기숙사·식당','선수촌'],(x,y,w,h,lv)=>{ g.push(bldg(x+10,y+28,w-20,h-48,'#d9c7a6'));
    const rooms=lv*4; for(let i=0;i<rooms;i++)g.push(`<rect x="${x+18+(i%4)*28}" y="${y+36+Math.floor(i/4)*26}" width="22" height="20" fill="#c3ad86" stroke="#a48f6a"/>`);
    if(lv>=2)g.push(`<rect x="${x+20}" y="${y+130}" width="${w-40}" height="36" fill="#efe4cf"/><text class="pl dk" x="${x+w/2}" y="${y+182}" text-anchor="middle">식당</text>`);
    by('dorm').forEach((p,i)=>g.push(cpPlayer(p,0,0,{uni:'y',act:'ar',dur:.5,anim:cpWalk(`M${x+24+i*20} ${y+h-30} L${x+w-24} ${y+h-30} L${x+w-24} ${y+120} L${x+24+i*20} ${y+120} Z`,12+i*2,-i*3)}))); });

  /* 도로를 오가는 선수 */
  by('road').forEach((p,i)=>g.push(cpPlayer(p,0,0,{uni:'f',act:'ar',dur:.5,anim:cpWalk(`M${30+i*60} 352 H970 V354 H${30+i*60}`,26+i*4,-i*7)})));
  return `<svg class="campus" viewBox="0 0 1000 690" xmlns="http://www.w3.org/2000/svg">${g.join('')}</svg>`; }
/* 1군 홈구장: 큰 구장 + 클럽하우스 + 구단 버스 */
function renderHome(S){ CPID=0; const P=S.players; const g=[]; const by=k=>P.filter(p=>p.where===k);
  g.push(`<rect width="1000" height="690" fill="#3c8a4f"/><rect x="0" y="0" width="724" height="690" fill="#2a3138"/>`);
  { const x=16,y=16,w=692,h=658; g.push(plotFrame(x,y,w,h,`${S.stadName||'홈구장'} · 1군 ${by('main').length+by('club').length}명`,0,0,null,'main'));
    const cx=x+w/2, cy=y+h-60;
    const tc=S.teamCol||'#CE0E2D';
    g.push(`<path d="M${cx} ${cy+46} L${x+6} ${y+250} Q${cx} ${y-120} ${x+w-6} ${y+250} Z" fill="#5d6670"/>${[0,1,2,3,4,5].map(i=>`<path d="M${x+14+i*5} ${y+250-i*2} Q${cx} ${y-108+i*12} ${x+w-14-i*5} ${y+250-i*2}" fill="none" stroke="${i%2?tc:'#6f7a85'}" stroke-width="5" opacity="${i%2?.55:.7}"/>`).join('')}${[...Array(26)].map((_,i)=>`<path d="M${cx} ${cy+46} L${x+6+i*26.6} ${y+250-Math.sin(i/25*Math.PI)*340} " stroke="#4c545c" stroke-width="1"/>`).join('')}
      <rect x="${cx-70}" y="${y+2}" width="140" height="10" rx="2" fill="${tc}" opacity=".85"/>${[x+70,x+w-70].map(lx=>`<g><rect x="${lx-3}" y="${y+150}" width="6" height="40" fill="#3a4652"/><rect x="${lx-16}" y="${y+140}" width="32" height="12" rx="2" fill="#d8dde2"/><circle cx="${lx}" cy="${y+146}" r="26" fill="#fff8d0" opacity=".12"/></g>`).join('')}
      <path d="M${cx} ${cy+20} L${x+40} ${y+262} Q${cx} ${y-40} ${x+w-40} ${y+262} Z" fill="#2f8a45"/>${[...Array(12)].map((_,i)=>`<path d="M${cx} ${cy} L${x+40+i*52} ${y+70} L${x+66+i*52} ${y+70} Z" fill="#ffffff08"/>`).join('')}
      <path d="M${x+40} ${y+262} Q${cx} ${y-40} ${x+w-40} ${y+262}" fill="none" stroke="#c9d3da" stroke-width="2"/>
      <path d="M${cx} ${cy} L${cx+120} ${cy-120} L${cx} ${cy-240} L${cx-120} ${cy-120} Z" fill="#a9824f"/><path d="M${cx} ${cy-16} L${cx+92} ${cy-112} L${cx} ${cy-208} L${cx-92} ${cy-112} Z" fill="#2f8a45"/>
      <circle cx="${cx}" cy="${cy-112}" r="16" fill="#a9824f"/><rect x="${cx-5}" y="${cy-113}" width="10" height="2" fill="#fff"/>${[[cx+120,cy-120],[cx,cy-240],[cx-120,cy-120]].map(b=>`<rect x="${b[0]-6}" y="${b[1]-6}" width="12" height="12" fill="#fff" transform="rotate(45 ${b[0]} ${b[1]})"/>`).join('')}<path d="M${cx-8} ${cy-5} h16 v6 l-8 6 l-8 -6z" fill="#fff"/>
      <path d="M${cx} ${cy} L${x+40} ${y+262} M${cx} ${cy} L${x+w-40} ${y+262}" stroke="#e4eaee" stroke-width="1.2" opacity=".7"/>
      <rect x="${cx-200}" y="${cy+8}" width="120" height="22" rx="3" fill="#1d242b" stroke="#ffffff33"/><text class="pl" x="${cx-140}" y="${cy+44}" text-anchor="middle">3루 더그아웃</text>
      <rect x="${cx+80}" y="${cy+8}" width="120" height="22" rx="3" fill="#1d242b" stroke="#ffffff33"/><text class="pl" x="${cx+140}" y="${cy+44}" text-anchor="middle">1루 더그아웃</text>
      <rect x="${x+70}" y="${y+300}" width="70" height="16" fill="#a9824f" transform="rotate(-45 ${x+105} ${y+308})"/><text class="pl" x="${x+86}" y="${y+346}">불펜</text>
      <rect x="${cx-90}" y="${y+40}" width="180" height="44" rx="4" fill="#0a0d10" stroke="#3a4652"/><text x="${cx}" y="${y+60}" text-anchor="middle" class="sb">${S.mainNote||'훈련 중'}</text><text x="${cx}" y="${y+76}" text-anchor="middle" class="pl">${S.board||''}</text>`);
    const M=by('main'); const pit=M.filter(p=>p.isP), bat=M.filter(p=>!p.isP);
    const spots=[[cx+92,cy-124,135],[cx+50,cy-200,100],[cx-50,cy-200,80],[cx-92,cy-124,45],[cx-220,cy-300,60],[cx,cy-370,90],[cx+220,cy-300,120],[cx,cy+20,-90]];
    const fld=bat.slice(0,8); fld.forEach((p,i)=>{ const [px,py,r]=spots[i];
      if(i>=4&&i<7){ const dx=(i===4?-1:i===6?1:0)*40, dy=i===5?-30:-20; g.push(cpPlayer(p,0,0,{rot:r,glove:'L',s:.8,act:'ar',dur:.45,anim:`<animateMotion dur="5.2s" repeatCount="indefinite" keyTimes="0;0.4;0.6;1" keyPoints="0;1;1;0" calcMode="linear" path="M${px} ${py} L${px+dx} ${py+dy}"/>`})); }
      else g.push(cpPlayer(p,px,py,{rot:r,glove:'L',s:.8})); });
    if(pit[0]) g.push(cpPlayer(pit[0],cx,cy-112,{rot:90,pose:'set',glove:'L',s:.8,act:'th',dur:2.6,dl:0}));
    const bt=bat[8]; if(bt){ g.push(cpPlayer(bt,cx-30,cy-6,{rot:0,bat:'R',helm:1,s:.8,act:'sw',dur:2.6,dl:0})); }
    if(bt) g.push(`<path d="M${cx-58} ${cy+14} L${cx-58} ${cy-30} Q${cx} ${cy-62} ${cx+58} ${cy-30} L${cx+58} ${cy+14}" fill="#00000026" stroke="#e8edf1" stroke-width="1.6" stroke-dasharray="3 2"/><text class="pl" x="${cx-64}" y="${cy-30}" text-anchor="end">타격 케이지</text>`);
    if(pit[0]) g.push(`<path d="M${cx-14} ${cy-96} h22 v4 h-18 v8 h-4z" fill="#1d242b" stroke="#e8edf1" stroke-width="1"/><g transform="translate(${cx+22} ${cy-122})"><rect x="-6" y="-6" width="12" height="12" rx="2" fill="#8a8f96"/>${[[-3,-2],[1,-3],[2,2],[-2,3]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="1.6" fill="#fff"/>`).join('')}</g>`);
    if(pit[0]&&bt) g.push(cpPitchBall(cx,cy-104,cx-14,cy-12,cx+120,cy-360,2.6,3.2));
    /* 펑고: 1루 라인 쪽 코치가 내야수에게 땅볼을 쳐 준다 */
    if(fld[1]){ const fx=cx+104, fy=cy-74; g.push(`<g transform="translate(${fx} ${fy})"><circle r="6" fill="#1d242b" stroke="#fff" stroke-width="1"/><text class="pl" y="16" text-anchor="middle">코치</text></g><circle r="2.6" fill="#fff"><animateMotion dur="3.4s" repeatCount="indefinite" keyTimes="0;0.2;0.55;1" keyPoints="0;0;1;1" calcMode="linear" path="M${fx} ${fy} L${spots[1][0]} ${spots[1][1]+6}"/></circle><circle r="2.6" fill="#fff"><animateMotion dur="3.4s" begin="1.7s" repeatCount="indefinite" keyTimes="0;0.2;0.55;1" keyPoints="0;0;1;1" calcMode="linear" path="M${fx} ${fy} L${spots[2][0]} ${spots[2][1]+6}"/></circle>`); }
    pit.slice(1,3).forEach((p,i)=>g.push(cpPlayer(p,x+96+i*30,y+330-i*30,{rot:20,pose:'set',glove:'L',s:.7,act:'th',dur:2.2+i*.4})));
    /* 외야 워닝트랙을 뛰는 투수들 */
    pit.slice(3,6).forEach((p,i)=>g.push(cpPlayer(p,0,0,{s:.62,act:'ar',dur:.4,ny:16,anim:`<animateMotion dur="${16+i*2}s" begin="${-i*5}s" repeatCount="indefinite" path="M${x+60} ${y+262} Q${cx} ${y-24} ${x+w-60} ${y+262} Q${cx} ${y-24} ${x+60} ${y+262}"/>`})));
    const bench=bat.slice(9).concat(pit.slice(4)); bench.slice(0,5).forEach((p,i)=>g.push(cpPlayer(p,cx+92+i*22,cy+19,{rot:-90,s:.55,ny:16})));
    if(bench.length>5)g.push(`<text class="pl" x="${cx+140}" y="${cy+60}" text-anchor="middle">벤치 외 ${bench.length-5}명</text>`); }
  /* 클럽하우스: 지친 1군 선수가 쉬는 곳 */
  { const x=740,y=16,w=244,h=214; g.push(plotFrame(x,y,w,h,'클럽하우스',0,0,null,'club')); g.push(bldg(x+10,y+28,w-20,h-48,'#4b4036'));
    for(let i=0;i<10;i++)g.push(`<rect x="${x+20+(i%5)*44}" y="${y+38+Math.floor(i/5)*128}" width="34" height="14" rx="2" fill="#6b5a48" stroke="#2c241d"/>`);
    g.push(`<rect x="${x+30}" y="${y+64}" width="${w-60}" height="78" rx="6" fill="#2d6a7a"/><text class="pl" x="${x+w/2}" y="${y+158}" text-anchor="middle">휴식·치료 공간</text>`);
    by('club').slice(0,6).forEach((p,i)=>g.push(cpPlayer(p,x+56+(i%3)*66,y+84+Math.floor(i/3)*38,{rot:90,s:.6,ny:16})));
    if(by('club').length>6)g.push(`<text class="pl" x="${x+w-16}" y="${y+h-20}" text-anchor="end">외 ${by('club').length-6}명</text>`);
    if(!by('club').length)g.push(`<text class="pl" x="${x+w/2}" y="${y+108}" text-anchor="middle">쉬는 선수 없음</text>`); }
  /* 구장 시설: 홈구장 투자 단계 + 1군도 함께 쓰는 훈련 시설 */
  { const x=740,y=242,w=244,h=226; g.push(plotFrame(x,y,w,h,'구장·1군 시설',0,0,null,'stadfac')); g.push(`<rect x="${x+8}" y="${y+24}" width="${w-16}" height="${h-32}" rx="4" fill="#1d242b"/>`);
    const SL=S.stLv||{}; const rows=[['관람석',SL.seat,5],['식음료·굿즈',SL.fnb,5],['프리미엄석',SL.prem,5],['전광판',SL.vis,5],['그라운드',SL.turf,5]];
    const L2=S.lv||{}; const sh=[['웨이트',L2.weight,3],['재활·회복',L2.rehab,3],['피칭·타격 랩',L2.lab,3]];
    const pip=(v,m,yy)=>[...Array(m)].map((_,i)=>`<rect x="${x+w-18-(m-i)*12}" y="${yy-7}" width="9" height="7" rx="1.5" fill="${i<(v||0)?'#4fd27c':'#ffffff26'}"/>`).join('');
    rows.forEach(([l,v,m],i)=>{ const yy=y+42+i*19; g.push(`<text class="pl" x="${x+16}" y="${yy}">${l}</text>${pip(v,m,yy)}`); });
    g.push(`<line x1="${x+16}" y1="${y+140}" x2="${x+w-16}" y2="${y+140}" stroke="#ffffff22"/><text class="pl" x="${x+16}" y="${y+154}" fill="#9fb0bf">훈련 단지 · 1군도 함께 씀</text>`);
    sh.forEach(([l,v,m],i)=>{ const yy=y+172+i*18; g.push(`<text class="pl" x="${x+16}" y="${yy}">${l}</text>${pip(v,m,yy)}`); }); }
  /* 주차장·구단 버스 */
  { const bl=S.bus||0; const x=740,y=480,w=244,h=194; g.push(plotFrame(x,y,w,h,'구단 버스',bl,2,null,'bus'));
    g.push(`<rect x="${x+10}" y="${y+28}" width="${w-20}" height="${h-40}" fill="#59616a"/>${[...Array(3)].map((_,i)=>`<line x1="${x+10}" y1="${y+60+i*36}" x2="${x+60}" y2="${y+60+i*36}" stroke="#fff" stroke-width="2"/>`).join('')}`);
    const col=bl>=2?'#1b2a44':bl>=1?'#3b4f6b':'#8a8f96', L=bl>=2?150:126, txt=['일반 버스 · 원정 피로 +10%','우등 버스 · 원정 피로 +2%','리무진 버스 · 원정 피로 -6%'][bl];
    g.push(`<g transform="translate(${x+70} ${y+92})"><g><rect x="0" y="-15" width="${L}" height="30" rx="6" fill="${col}" stroke="#ffffff66"/><rect x="8" y="-11" width="${L-20}" height="8" rx="2" fill="#9fd8f0aa"/><rect x="4" y="4" width="${L-8}" height="4" fill="${S.teamCol||'#CE0E2D'}"/></g></g>
      <text class="pl" x="${x+w/2}" y="${y+h-20}" text-anchor="middle">${txt}</text>`); }
  return `<svg class="campus" viewBox="0 0 1000 690" xmlns="http://www.w3.org/2000/svg">${g.join('')}</svg>`; }

function renderCampus(S){ return S.view==='farm'?renderFarm(S):renderHome(S); }
