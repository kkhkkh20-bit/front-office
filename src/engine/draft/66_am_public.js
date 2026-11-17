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
    if(meta.t&&S.live){ const T=(S.tp=S.tp||{})[meta.t]=(S.tp[meta.t]||{}); const s=u.isP?b.outs/3+b.so*.3-b.er+(b.w?2:0):b.h+b.hr*2+(b.d+b.tr)*.5+b.rbi*.6+b.bb*.3; const o=T[u.id]||(T[u.id]=[0,x.n||x.name,u.sch,u.gr,u.isP?1:0,u.kind==='p'?u.id:null]); o[0]=Math.round((o[0]+s)*10)/10; }
    if(!u.isP&&b.hr>0&&S.live&&meta.lvl==='hs'){ const tot=dep?((amFRow(u.sch,x.ey,false,x.i,y)||{}).hr||0):u.kind==='e'?((x.y.find(r=>r[0]===y)||[])[2+AM_BK.indexOf('hr')]||0):((x.amY||[]).find(r=>r.y===y)||{}).hr||0;
      if(tot>=4&&tot>(S.hrTop||3)){ S.hrTop=tot; if(amCap(S,'hr',3))wire('아마',`${amWho(u,x)}, 시즌 ${tot}호 홈런 · 올해 고교 최다`,{ref:u.kind==='p'?u.id:null}); } } } }
/* 구속 소식: 1·2학년 145km, 졸업 학년 150km를 넘고, 그해 같은 학년 무리에서 가장 빠른 공일 때 */
function amVeloNews(S,u,x,r,old,meta){ const sen=u.gr>=(meta.lvl==='col'?4:3); const thr=sen?AM_V_TOP:AM_V_LOW; if(r<thr||old>=r)return; const k='vt'+(sen?'s':'u')+meta.lvl; const best=(S.vTop=S.vTop||{})[k]||0; if(r<=best)return; S.vTop[k]=r;
  if(amCap(S,'v',6))wire('아마',`${amWho(u,x)}, ${amWhere(meta)}에서 최고 ${r}km${sen?'':' · 저학년 최고 구속'}`,{ref:u.kind==='p'?u.id:null}); }
/* 대회 최우수 선수: 우승 학교 선수 중 그 대회 활약 점수 1위 */
function amTourMvp(S,T){ const L=Object.values((S.tp||{})[T.k]||{}).filter(o=>o[2]===T.ch).sort((a,b)=>b[0]-a[0]); if(S.tp)delete S.tp[T.k]; return L[0]||null; }
/* 3학년 부진 소식(6·7월 1일): 언론 상위 20위 안 후보가 졸업 학년에 뚜렷이 주춤할 때 */
function amSlumpNews(o){ const S=G.amL; if(!S||!S.live||(o.m!==6&&o.m!==7))return; const L=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&p.press&&p.press<=20&&amSlump(p)&&p.amSlN!==G.year).sort((a,b)=>a.press-b.press);
  const p=L[0]; if(!p||!amCap(S,'sl',2))return; p.amSlN=G.year; const T=amTrend(p,!!p.isP).filter(t=>t.k); const a=T[T.length-2], b=T[T.length-1]; const f=v=>p.isP?`ERA ${v.toFixed(2)}`:`OPS ${fmt3(v)}`;
  wire('아마',`언론 순위 ${p.press}위 ${p.name}(${p.school}), 졸업 학년 들어 주춤${a&&b?` · ${f(a.k.v)} → ${f(b.k.v)}`:''}`,{ref:p.id}); }
