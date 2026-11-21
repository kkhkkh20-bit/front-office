/* ===== 아마 공개 기록과 소식 (스카우트 1단계) =====
   모든 구단이 똑같이 보는 공개 정보만 만든다.
   - 공개 측정 구속: 대회 중계·스피드건으로 잰 최고 구속(경기마다 그날 최고, 시즌 최고를 남김). 투수 카드·관찰 명단에 보인다.
   - 대회별 기록(주말리그 전반·후반, 전국대회, U-리그): 드래프트 후보와 우리 관심 저학년만 저장한다(저장 크기).
   - 소식: 구속(1·2학년 145km+, 졸업 학년 150km+, 그해 그 학년 최고를 넘을 때만), 대회 최우수 선수, 고교 홈런 선두, 3학년 부진.
     시즌마다 종류별 상한(amCap)으로 양을 묶는다 */
const AM_V_LOW=145, AM_V_TOP=150, AM_SPK=['w1','w2','t0','t1','t2','t3','t4','ct','ul'];
const AM_SP_N={w1:'주말리그 전반기',w2:'주말리그 후반기',ul:'대학 U-리그'};
const amSpName=k=>AM_SP_N[k]||((AM_TOURS().concat([AM_COLT]).find(t=>t.k===k)||{}).n)||k;
let _amFolU=null;
function amFolU(){ const d=G.day; if(_amFolU&&_amFolU.g===G&&_amFolU.d===d)return _amFolU.s; const s=G.user!=null&&!G.unemp?obsFollowSet(G.user):new Set(); _amFolU={g:G,d,s}; return s; }
function amSplitAdd(x,y,k,b,isP){ const S=x.sp=x.sp||{}; const R0=S[y]=S[y]||{}; const a=R0[k]=R0[k]||(isP?[0,0,0,0,0,0]:[0,0,0,0,0,0,0,0]);
  if(isP){ a[0]++; a[1]+=b.outs; a[2]+=b.er; a[3]+=b.so; a[4]+=b.bb; a[5]+=b.h; } else { a[0]++; a[1]+=b.pa; a[2]+=b.ab; a[3]+=b.h; a[4]+=b.hr; a[5]+=b.bb; a[6]+=b.so; a[7]+=b.rbi; }
  for(const yy in S)if(+yy<y-2)delete S[yy]; }
/* 대회별 기록 줄: '황금사자기 4경기 ERA 0.90 · 탈삼진 21' */
function amSplitLines(x,y){ const R0=x&&x.sp&&x.sp[y]; if(!R0)return []; const isP=!!(x.prospect?x.isP:x.P);
  return AM_SPK.filter(k=>R0[k]).map(k=>{ const a=R0[k]; return {k,n:amSpName(k),t:isP?`${a[0]}경기 ${ipStr(a[1])}이닝 ERA ${a[1]?(a[2]*27/a[1]).toFixed(2):'-'} · 탈삼진 ${a[3]}`:`${a[0]}경기 타율 ${a[2]?fmt3(a[3]/a[2]):'-'}${a[4]?` · 홈런 ${a[4]}`:''} · 타점 ${a[7]}`}; }); }
function amWhere(meta){ return meta.t?amSpName(meta.t):meta.lvl==='col'?'U-리그':'주말리그'; }
const amWho=(u,x)=>`${u.sch} ${u.gr}학년 ${u.isP?'투수':POSK[x.pos]||'야수'} ${x.n||x.name}`;
/* amRecord 끝에서: 공개 측정 구속·대회별 기록·대회 최우수 선수 집계·홈런 소식 */
function amPubRec(S,g,d,meta){ const y=S.y, fol=S.live?amFolU():new Set(), key=meta.g?(meta.lvl==='col'?'ul':(meta.h2?'w2':'w1')):meta.t;
  for(const b of g.M.values()){ const u=b.u; if(u.kind!=='p'&&u.kind!=='e'&&u.kind!=='f')continue; const x=u.src; if(!x)continue; const dep=u.kind==='f'; /* 부원도 대회 최우수·홈런 선두 후보(사용자 11-17) */
    if(u.isP&&b.bf>=4&&!dep){ const top=amVeloTop(x); if(top!=null){ const r=Math.round(top-Math.abs(hn('vg'+d,u.id))*2.4); const old=x.vm&&x.vm[0]===y?x.vm[1]:0; if(r>old){ x.vm=[y,r]; if(S.live)amVeloNews(S,u,x,r,old,meta); } } }
    if(key&&!dep&&(u.kind==='p'||fol.has(u.id)))amSplitAdd(x,y,key,b,u.isP);
    if(meta.t&&S.live)amTourLineAdd(S,meta.t,u,x,b);
    if(meta.t&&S.live){ const T=(S.tp=S.tp||{})[meta.t]=(S.tp[meta.t]||{}); const s=u.isP?b.outs/3+b.so*.3-b.er+(b.w?2:0):b.h+b.hr*2+(b.d+b.tr)*.5+b.rbi*.6+b.bb*.3; const o=T[u.id]||(T[u.id]=[0,x.n||x.name,u.sch,u.gr,u.isP?1:0,u.kind==='p'?u.id:null]); o[0]=Math.round((o[0]+s)*10)/10; }
    if(!u.isP&&b.hr>0&&S.live&&meta.lvl==='hs'){ const tot=dep?((amFRow(u.sch,x.ey,false,x.i,y)||{}).hr||0):u.kind==='e'?((x.y.find(r=>r[0]===y)||[])[2+AM_BK.indexOf('hr')]||0):((x.amY||[]).find(r=>r.y===y)||{}).hr||0;
      if(tot>=4&&tot>(S.hrTop||3)){ S.hrTop=tot; if(amCap(S,'hr',3))wire('아마',`${amWho(u,x)}, 시즌 ${tot}호 홈런 · 올해 고교 최다`,{ref:u.kind==='p'?u.id:null}); } } } }
/* 구속 소식: 1·2학년 145km, 졸업 학년 150km를 넘고, 그해 같은 학년 무리에서 가장 빠른 공일 때 */
function amVeloNews(S,u,x,r,old,meta){ const sen=u.gr>=(meta.lvl==='col'?4:3); const thr=sen?AM_V_TOP:AM_V_LOW; if(r<thr||old>=r)return; const k='vt'+(sen?'s':'u')+meta.lvl; const best=(S.vTop=S.vTop||{})[k]||0; if(r<=best)return; S.vTop[k]=r;
  if(amCap(S,'v',6))wire('아마',`${amWho(u,x)}, ${amWhere(meta)}에서 최고 ${r}km${sen?'':' · 저학년 최고 구속'}`,{ref:u.kind==='p'?u.id:null}); }
/* Per-tournament stat lines for every player (live seasons only, RNG-free): S.tl[t][uid]={n,s,g,P,ref,kind,b}. b batter [g,pa,ab,h,d,tr,hr,bb,hbp,so,rbi,sb], pitcher [g,outs,er,so,bb,h,w,l].
   Kept only while the tournament runs; at the final the top lines are frozen into T.ld (amTourFreeze) and S.tl[t] is dropped. */
function amTourLineAdd(S,t,u,x,b){ const L=(S.tl=S.tl||{})[t]||(S.tl[t]={}); const o=L[u.id]||(L[u.id]={id:u.id,n:x.n||x.name,s:u.sch,g:u.gr,P:u.isP?1:0,ref:u.kind==='p'?u.id:null,kind:u.kind,b:u.isP?[0,0,0,0,0,0,0,0]:[0,0,0,0,0,0,0,0,0,0,0,0]}); const a=o.b, v=k=>b[k]||0;
  if(u.isP){ a[0]++; a[1]+=v('outs'); a[2]+=v('er'); a[3]+=v('so'); a[4]+=v('bb'); a[5]+=v('h'); a[6]+=b.w?1:0; a[7]+=b.l?1:0; }
  else { a[0]++; a[1]+=v('pa'); a[2]+=v('ab'); a[3]+=v('h'); a[4]+=v('d'); a[5]+=v('tr'); a[6]+=v('hr'); a[7]+=v('bb'); a[8]+=v('hbp'); a[9]+=v('so'); a[10]+=v('rbi'); a[11]+=v('sb'); } }
/* Derived numbers of one tournament line (batters: avg obp slg ops; pitchers: era whip) */
function amTlNum(o){ const a=o.b; if(o.P){ const ip=a[1]/3; return {g:a[0],outs:a[1],er:a[2],so:a[3],bb:a[4],h:a[5],w:a[6],l:a[7],era:ip?a[2]*9/ip:99,whip:ip?(a[4]+a[5])/ip:99}; }
  const [g,pa,ab,h,d,tr,hr,bb,hbp,so,rbi,sb]=a, tb=h+d+2*tr+3*hr, obp=pa?(h+bb+hbp)/pa:0, slg=ab?tb/ab:0; return {g,pa,ab,h,d,tr,hr,bb,hbp,so,rbi,sb,avg:ab?h/ab:0,obp,slg,ops:obp+slg}; }
const AM_TL_CATS=[['avg',0,'타율'],['ops',0,'OPS'],['hr',0,'홈런'],['rbi',0,'타점'],['h',0,'안타'],['sb',0,'도루'],['era',1,'평균자책점'],['so',1,'탈삼진'],['w',1,'승리']];
/* Leaders of one tournament (live S.tl or frozen T.ld). Rate stats need playing time: batters 2.0 PA per team game (min 6), pitchers 1 inning per team game (min 9 outs) */
function amTlLeaders(S,T,k,isP,n=5){ if(T&&T.ld)return ((T.ld[k])||[]).slice(0,n); const L=Object.values(((S&&S.tl)||{})[T&&T.k]||{}).filter(o=>!!o.P===!!isP); if(!L.length)return [];
  const gmax=Math.max(...L.map(o=>o.b[0])), rate=k==='avg'||k==='ops'||k==='era'; const qual=o=>!rate||(isP?o.b[1]>=Math.max(9,gmax*3):o.b[1]>=Math.max(6,gmax*2));
  const R=L.filter(qual).map(o=>({o,v:amTlNum(o)[k]})).filter(r=>k==='era'||r.v>0).sort((a,b)=>k==='era'?a.v-b.v:b.v-a.v).slice(0,n);
  return R.map(({o,v})=>({id:o.id,n:o.n,s:o.s,g:o.g,P:o.P,ref:o.ref,kind:o.kind,v:Math.round(v*1000)/1000})); }
/* At the final: keep the top 5 of each category and the MVP on the tournament itself (saved with G.amL / G.amLp and summarised into G.amH) */
function amTourFreeze(S,T,mv){ if(!S.live)return; const ld={}; for(const [k,isP] of AM_TL_CATS)ld[k]=amTlLeaders(S,{k:T.k},k,isP,10); T.ld=ld; if(mv)T.mvp={n:mv[1],s:mv[2],g:mv[3],P:mv[4],ref:mv[5]||null}; if(S.tl)delete S.tl[T.k]; }
/* Season awards (live seasons only, read-only leaders): batting title, HR, RBI, steals, ERA, strikeouts, wins for HS and college */
const AM_AW=[['avg',0,'타격상'],['hr',0,'홈런상'],['rbi',0,'타점상'],['sb',0,'도루상'],['era',1,'평균자책점상'],['so',1,'탈삼진상'],['w',1,'다승상']];
function amSeasonAwards(S){ const out={}; for(const lv of ['hs','col']){ const A={}; for(const [k,isP,t] of AM_AW){ const L=amLeaders(S.y,lv,!!isP,k,1); const x=L[0]; if(x)A[k]={n:x.n,s:x.sch,g:x.gr,P:isP,ref:x.kind==='p'?x.id:null,v:Math.round(x.v*1000)/1000}; } out[lv]=A; } return out; }
/* 대회 최우수 선수: 우승 학교 선수 중 그 대회 활약 점수 1위 */
function amTourMvp(S,T){ const L=Object.values((S.tp||{})[T.k]||{}).filter(o=>o[2]===T.ch).sort((a,b)=>b[0]-a[0]); if(S.tp)delete S.tp[T.k]; return L[0]||null; }
/* 3학년 부진 소식(6·7월 1일): 언론 상위 20위 안 후보가 졸업 학년에 뚜렷이 주춤할 때 */
function amSlumpNews(o){ const S=G.amL; if(!S||!S.live||(o.m!==6&&o.m!==7))return; const L=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&p.press&&p.press<=20&&amSlump(p)&&p.amSlN!==G.year).sort((a,b)=>a.press-b.press);
  const p=L[0]; if(!p||!amCap(S,'sl',2))return; p.amSlN=G.year; const T=amTrend(p,!!p.isP).filter(t=>t.k); const a=T[T.length-2], b=T[T.length-1]; const f=v=>p.isP?`ERA ${v.toFixed(2)}`:`OPS ${fmt3(v)}`;
  wire('아마',`언론 순위 ${p.press}위 ${p.name}(${p.school}), 졸업 학년 들어 주춤${a&&b?` · ${f(a.k.v)} → ${f(b.k.v)}`:''}`,{ref:p.id}); }
