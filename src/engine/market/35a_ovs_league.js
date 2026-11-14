/* ===== 해외 리그(MLB·NPB): 가볍게 돌린다(사용자 11-14: "유저 플레이는 안 돼도 리그 팀 결과와 우리와 이어진 선수 성적만 보게").
   - 경기·선수를 다 만들지 않는다. 구단마다 전력 값 하나(해마다 평균 쪽으로 돌아가는 무작위 걸음)로 시즌 승수를 이항 분포 근사로 뽑고, 포스트시즌은 시리즈 단위로 굴린다.
   - 저장: 리그마다 전력(정수 배열)·올해 승수·지난 10시즌(승수 배열·가을야구 시드·우승/준우승). 한 시즌에 리그당 수백 바이트.
   - 구단 이름은 실제 도시 + 가상 별칭(상표를 피한다). 예전 저장의 도시 이름만 있는 구단(뉴욕 등)은 그 도시 첫 구단으로 본다.
   - 선수는 KBO와 이어진 선수만(해외파·KBO를 떠난 외국인·관찰하던 후보): ovsLine이 리그 수준(LG_ADJ)·나이·구단 사정으로 한 시즌 기록을 만든다 */
const OVL_C={MLB:[['뉴욕','나이츠',0],['보스턴','하버스',0],['토론토','노스스타',0],['볼티모어','클리퍼스',0],['탬파베이','선샤인',0],
  ['시카고','윈디스',1],['클리블랜드','랜턴스',1],['디트로이트','모터스',1],['캔자스시티','스카우츠',1],['미네소타','노스맨',1],
  ['휴스턴','오비터스',2],['텍사스','론스타',2],['시애틀','파일럿츠',2],['애너하임','선셋',2],['새크라멘토','골드러시',2],
  ['뉴욕','엠파이어',3],['필라델피아','리버티',3],['애틀랜타','피치스',3],['마이애미','플라밍고스',3],['워싱턴','이글스',3],
  ['시카고','베어캣츠',4],['세인트루이스','아치스',4],['밀워키','스팀',4],['신시내티','리버보츠',4],['피츠버그','아이언스',4],
  ['LA','스타즈',5],['샌프란시스코','시라이언스',5],['샌디에이고','서퍼스',5],['애리조나','스콜피온스',5],['콜로라도','피크스',5]],
 NPB:[['도쿄','타이탄스',0],['오사카','라이징스',0],['나고야','샤치즈',0],['히로시마','피닉스',0],['요코하마','하버라이츠',0],['도쿄','레이븐스',0],
  ['후쿠오카','팔콘스',1],['삿포로','스노베어스',1],['센다이','아울스',1],['지바','오션스',1],['사이타마','퓨마스',1],['고베','블루스',1]]};
const OVL_D={MLB:['AL 동부','AL 중부','AL 서부','NL 동부','NL 중부','NL 서부'],NPB:['센트럴리그','퍼시픽리그']};
const OVL_G={MLB:162,NPB:143}, OVL_SD={MLB:.06,NPB:.045}, OVL_KEEP=10, OVL_PS={MLB:'월드시리즈',NPB:'재팬시리즈'};
const ovlNm=(lg,i)=>{ const c=OVL_C[lg]&&OVL_C[lg][i]; return c?c[0]+' '+c[1]:''; };
/* 구단 문자열 → 번호: 전체 이름이 먼저, 예전 저장의 도시 이름은 그 도시 첫 구단 */
function ovlIdx(lg,s){ const L=OVL_C[lg]; if(!L||s==null)return -1; let i=L.findIndex(c=>c[0]+' '+c[1]===s); if(i<0)i=L.findIndex(c=>c[0]===s); return i; }
function ovlInit(){ const O=G.ovl=G.ovl||{v:1}; for(const lg of ['MLB','NPB']){ if(O[lg]&&Array.isArray(O[lg].s))continue; const n=OVL_C[lg].length;
    const L=O[lg]={s:Array.from({length:n},()=>Math.round(clamp(N(0,OVL_SD[lg]),-.15,.15)*1000)),h:[]}; L.h.unshift(ovlPlay(lg,L,G.year-1,ovlWins(lg,L))); ovlDrift(lg,L); L.cur={y:G.year,w:ovlWins(lg,L)}; } return O; }
/* 전력: 지난해 전력의 55%를 이어받고 나머지는 새로(정상 분포 폭은 그대로). MLB 승률 표준편차 약 .07, NPB 약 .055 */
function ovlDrift(lg,L){ const rho=.55, sd=OVL_SD[lg]*Math.sqrt(1-rho*rho); L.s=L.s.map(v=>Math.round(clamp(rho*v/1000+N(0,sd),-.16,.16)*1000)); }
function ovlP(lg,L){ const s=L.s.map(v=>v/1000), m=s.reduce((a,b)=>a+b,0)/s.length; return s.map(v=>clamp(.5+v-m,.28,.72)); }
function ovlWins(lg,L){ const g=OVL_G[lg], P=ovlP(lg,L), n=P.length; const w=P.map(p=>clamp(Math.round(g*p+N(0,Math.sqrt(g*p*(1-p)))),0,g));
  let d=g*n/2-w.reduce((a,b)=>a+b,0), k=0; while(d!==0&&k++<20000){ const i=Math.floor(R()*n); if(d>0&&w[i]<g){ w[i]++; d--; } else if(d<0&&w[i]>0){ w[i]--; d++; } } return w; } /* 리그 전체 승수 = 경기 수 × 구단 수 ÷ 2 */
/* 시리즈: 먼저 need승. adv는 앞선 시드의 1승 어드밴티지(NPB 클라이맥스 최종) */
function ovlSeries(P,a,b,need,adv){ const pa=P[a], pb=P[b], q=pa*(1-pb)/(pa*(1-pb)+pb*(1-pa)); let x=adv||0, y=0; while(x<need&&y<need){ if(R()<q)x++; else y++; } return x>=need?{w:a,l:b,s:`${x-(adv||0)}-${y}`}:{w:b,l:a,s:`${y}-${x-(adv||0)}`}; }
const ovlOrd=(I,w)=>[...I].sort((a,b)=>w[b]-w[a]||hn('ovo',a*31+b)-hn('ovo',b*31+a)); /* 승수가 같으면 고정 순서(다시 그려도 같게) */
function ovlPlay(lg,L,y,w){ const P=ovlP(lg,L), C=OVL_C[lg]; const H={y,w:w.slice()};
  if(lg==='MLB'){ const lgSeeds=[0,1].map(k=>{ const divs=[0,1,2].map(d=>ovlOrd(C.map((c,i)=>i).filter(i=>C[i][2]===k*3+d),w)[0]); const top=ovlOrd(divs,w); const rest=ovlOrd(C.map((c,i)=>i).filter(i=>Math.floor(C[i][2]/3)===k&&!divs.includes(i)),w).slice(0,3); return top.concat(rest); });
    const champ=S=>{ const w1=ovlSeries(P,S[3],S[4],2).w, w2=ovlSeries(P,S[2],S[5],2).w; const d1=ovlSeries(P,S[0],w1,3).w, d2=ovlSeries(P,S[1],w2,3).w; return ovlSeries(P,d1,d2,4).w; };
    const al=champ(lgSeeds[0]), nl=champ(lgSeeds[1]); const f=ovlSeries(P,al,nl,4); H.po=lgSeeds[0].concat(lgSeeds[1]); H.ch=f.w; H.ru=f.l; H.sr=f.s; H.pn=[al,nl]; }
  else { const lgSeeds=[0,1].map(k=>ovlOrd(C.map((c,i)=>i).filter(i=>C[i][2]===k),w).slice(0,3)); const champ=S=>{ const w1=ovlSeries(P,S[1],S[2],2).w; return ovlSeries(P,S[0],w1,4,1).w; };
    const ce=champ(lgSeeds[0]), pa=champ(lgSeeds[1]); const f=ovlSeries(P,ce,pa,4); H.po=lgSeeds[0].concat(lgSeeds[1]); H.ch=f.w; H.ru=f.l; H.sr=f.s; H.pn=[ce,pa]; }
  return H; }
/* 시즌 진행 비율(해외 리그 정규시즌 3월 말~9월 말). 보여 주기만 비례로 나눈다 */
function ovlFrac(y){ if(y<G.year)return 1; if(y>G.year)return 0; const a=KD(3,27), b=KD(9,28); return clamp((G.day-a)/(b-a),0,1); }
/* 새해(G.year가 오른 뒤): 지난 시즌을 아직 못 닫았으면 닫고, 전력을 움직여 올 시즌 승수를 미리 만든다 */
function ovlNewYear(){ const O=ovlInit(); for(const lg of ['MLB','NPB']){ const L=O[lg]; if(L.cur&&L.cur.y<G.year&&!L.h.some(h=>h.y===L.cur.y))ovlClose(lg,L,L.cur.y);
    if(!L.cur||L.cur.y!==G.year){ ovlDrift(lg,L); L.cur={y:G.year,w:ovlWins(lg,L)}; } }
  try{ ovsPregen(); }catch(e){} }
function ovlClose(lg,L,y){ const w=L.cur&&L.cur.y===y?L.cur.w:ovlWins(lg,L); const H=ovlPlay(lg,L,y,w); L.h=L.h.filter(h=>h.y!==y); L.h.unshift(H); L.h.sort((a,b)=>b.y-a.y); if(L.h.length>OVL_KEEP)L.h.length=OVL_KEEP; if(L.cur&&L.cur.y===y)delete L.cur; return H; }
/* KBO 시즌을 마무리할 때(스토브리그 시작): 해외 리그도 그 시즌을 닫는다 */
function ovlSeasonEnd(){ const O=ovlInit(); const out=[]; for(const lg of ['MLB','NPB']){ const L=O[lg]; if(L.h.some(h=>h.y===G.year))continue; const H=ovlClose(lg,L,G.year); out.push([lg,H]); } O.wy=out.length?G.year:O.wy; return out; }
/* 우승 소식: 해외파 기록을 만든 뒤에(우승 구단의 KBO 출신 선수를 함께 적는다). 한 시즌 한 번 */
function ovlChampWire(){ const O=G.ovl; if(!O||O.wy!==G.year||O.wd===G.year)return; O.wd=G.year; for(const lg of ['MLB','NPB']){ const H=(O[lg].h||[]).find(h=>h.y===G.year); if(!H)continue; const al=ovsAlumOn(lg,H.ch,G.year);
    wire('해외',`${ovlNm(lg,H.ch)}, ${G.year} ${OVL_PS[lg]} 우승(${H.sr})${al.length?` · KBO 출신 ${al.map(a=>a.name).join('·')} 우승 반지`:''}`,{ref:al.length?al[0].id:null}); } }
function ovlSeason(lg,y){ const O=G.ovl, L=O&&O[lg]; if(!L||!L.h)return null; /* 화면에서도 부르므로 만들지 않고 읽기만 */ if(L.cur&&L.cur.y===y)return {y,w:L.cur.w,live:true}; return L.h.find(h=>h.y===y)||null; }
/* 순위표: 진행 중인 시즌은 지금까지 치른 만큼 비례로 */
function ovlTable(lg,y){ const S=ovlSeason(lg,y); if(!S)return null; const g=OVL_G[lg], f=S.live?ovlFrac(y):1, gp=Math.round(g*f); const C=OVL_C[lg];
  const rows=S.w.map((w,i)=>{ const W=S.live?Math.min(gp,Math.round(w*f)):w; return {i,w:W,l:gp-W,d:C[i][2]}; });
  const div=OVL_D[lg].map((nm,d)=>{ const L=rows.filter(r=>r.d===d).sort((a,b)=>b.w-a.w||a.l-b.l); const t=L[0]; for(const r of L)r.gb=((t.w-r.w)+(r.l-t.l))/2; return {nm,L}; });
  return {S,f,gp,div,live:!!S.live}; }
/* 그 시즌 구단 성적(해외파 줄에 붙이는 맥락) */
function ovlTeamRec(lg,i,y){ if(i==null||i<0)return null; const T=ovlTable(lg,y); if(!T)return null; for(const D of T.div){ const k=D.L.findIndex(r=>r.i===i); if(k>=0){ const r=D.L[k], S=T.S; return {w:r.w,l:r.l,rk:k+1,dn:D.nm,live:T.live,po:!T.live&&(S.po||[]).includes(i),ch:!T.live&&S.ch===i,ru:!T.live&&S.ru===i,pn:!T.live&&(S.pn||[]).includes(i)}; } } return null; }
function ovlStr(lg,i){ const O=G.ovl, L=O&&O[lg]; return L&&L.s&&i!=null&&i>=0&&L.s[i]!=null?L.s[i]/1000:0; }

/* ===== KBO와 이어진 선수의 해외 시즌 ===== */
const OVS_THR={MLB:62,NPB:57}; /* 이 능력(국내 기준)이면 그 리그 1군(빅리그)에서 자리를 잡는다 */
const OVS_MINOR={MLB:'트리플A',NPB:'NPB 2군'};
/* 리그 수준 보정 [타자, 투수]. 마이너·대만·호주·멕시코는 외국인 후보 이전 리그 기록과 같은 표(LG_ADJ).
   빅리그는 KBO 출신 실제 성적에 맞춰 따로(같은 국내 능력 기준: MLB 62 타자 OPS 약 .73·투수 ERA 약 4.2, 66이면 .78·3.8 / NPB는 투고타저라 57 타자 .73·투수 4.3).
   외국인 후보 MLB 기록(LG_ADJ)은 콜업·백업 선수의 짧은 기록이라 더 가혹하게 둔다 */
const OVS_ADJ={MLB:[-19,-18],NPB:[-10,-8]};
const ovsAdj=lvl=>OVS_ADJ[lvl]||LG_ADJ[lvl]||[0,0];
/* 리그 평균 선수 기준(그 수준에서 자리 잡은 선수의 기록): [OPS, ERA] */
const OVS_NORM={MLB:[.735,4.2],'트리플A':[.82,3.9],NPB:[.735,4.25],'NPB 2군':[.78,3.6],CPBL:[.82,3.9],ABL:[.82,3.8],'멕시코리그':[.83,4.6]};
const ovsBig=l=>l==='MLB'||l==='NPB';
/* 해외파 기록용 최소 사본: 능력치·보직만(외국인 선수는 리그를 떠나면 원본이 지워진다) */
function ovsSlim(p){ const o={id:p.id,isP:!!p.isP,age:p.age,r:Object.assign({},p.r)}; if(p.role)o.role=p.role; if(p.velo)o.velo=p.velo; if(p.addP&&p.addP.length)o.addP=p.addP; if(!p.isP&&p.pos)o.pos=p.pos; return o; }
/* 한 시즌 기록. lg: 계약한 리그(MLB·NPB·CPBL·ABL·멕시코리그). 능력이 기준에 못 미치면 MLB는 트리플A, NPB는 2군에서 뛴다. 약한 구단은 기회를 조금 더 준다 */
function ovsLine(p,lg,o){ o=o||{}; const av=clamp(o.av??1,0,1), thr=OVS_THR[lg]; const ob=ovr(p); let m=thr==null?4:ob-thr; if(thr!=null&&o.ci!=null&&o.ci>=0){ const s=ovlStr(lg,o.ci); m+=s<-.03?1:s>.04?-.7:0; }
  const big=m>=0, lvl=thr==null?lg:big?lg:OVS_MINOR[lg]; const sp=p.isP&&isSPr(p); let n;
  if(p.isP)n=sp?(big?(m>=4?ri(470,590):ri(210,430)):ri(300,450)):(big?(m>=4?ri(170,215):ri(90,170)):ri(120,190)); else n=big?(m>=4?ri(500,650):ri(170,420)):ri(300,520);
  n=Math.round(n*av); const A=ovsAdj(lvl); const L=p.isP?simPit(p,n,A[1]):simBat(p,n,A[0]); L.y=o.y??G.year; L.lvl=lvl; if(o.ci!=null&&o.ci>=0&&thr!=null)L.c=o.ci;
  L.g=n?(p.isP?Math.max(1,Math.round(n/(sp?17.5:3.2))):Math.max(1,Math.round(n/4.1))):0; if(p.isP&&!sp)L.rp=1; L.o=Math.round(ob*10)/10; return L; } /* o: 만들 때 능력(새해에 미리 만든 기록이 그사이 능력 변화로 낡았는지 본다) */
/* 시즌 가치(WAR 비슷한 값): 그 리그 평균 선수가 한 시즌 약 2 */
function ovsVal(L,isP){ const nm=OVS_NORM[L.lvl]||[.8,4]; if(isP){ const ip=(L.outs||0)/3; if(!ip)return 0; const era=L.er*27/L.outs; return (nm[1]-era)*ip/90+ip/(L.rp?150:90); } if(!L.pa)return 0; return (2+(bRate(L).ops-nm[0])*30)*L.pa/600; }
/* 해외 시상(빅리그만, 실제와 비슷하게 드물게): AS 올스타 · ROY 신인왕(MLB만, NPB는 해외 프로 경력 선수 제외) · GG 골드글러브(NPB 골든글러브) · SS 실버슬러거(NPB 베스트나인) · CY 사이영상(NPB 사와무라상) · MVP */
const OVS_AW={AS:['올스타','올스타'],ROY:['신인왕','신인왕'],GG:['골드글러브','골든글러브'],SS:['실버슬러거','베스트나인'],CY:['사이영상','사와무라상'],MVP:['MVP','MVP']};
const ovsAwNm=(k,lg)=>(OVS_AW[k]||[k,k])[lg==='NPB'?1:0];
function ovsAwards(L,p,lg,first){ if(!ovsBig(L.lvl))return []; const v=ovsVal(L,p.isP), A=[];
  if(p.isP&&L.rp){ if(v>=1.6&&R()<clamp((v-1.4)/2.5,0,.5))A.push('AS'); }
  else if(R()<clamp((v-3)/3,0,.85))A.push('AS');
  if(first&&lg==='MLB'&&((L.pa||0)>=300||(L.outs||0)>=(L.rp?150:270))&&R()<clamp((v-2.3)/3.2,0,.7))A.push('ROY');
  if(!p.isP){ if(v>=2.5&&(p.r.def||0)>=60&&R()<clamp(((p.r.def||0)-58)/25,0,.5))A.push('GG'); if(v>=4.5&&R()<clamp((v-4.5)/3+.2,0,.7))A.push('SS'); if(v>=7&&R()<.3)A.push('MVP'); }
  else if(!L.rp&&v>=5.5&&R()<clamp((v-5.5)/3+.1,0,.5))A.push('CY');
  return A; }
/* 진행 중인 시즌 기록: 미리 만든 한 시즌 기록을 지금까지 치른 비율만큼 */
function ovsPart(L,f){ if(!L)return null; if(f>=1)return L; const o={}; for(const k in L)o[k]=typeof L[k]==='number'&&!['y','c','o','rp'].includes(k)?Math.round(L[k]*f):L[k]; o.live=1; return o; }
/* 재활 중인 기간만큼 못 뛴다. 첫 시즌은 개막 전까지 지난 재활 기간을 빼고(검수 11-08, 11-06) */
function ovsAv(a,p){ const inj=a.d!=null&&!(a.lines||[]).length?Math.max(0,(p.injOut||0)-Math.max(0,dnum(G.year,3,22)-a.d)):(p.injOut||0); return clamp(1-inj/365,0,1); }
/* 새해: 올 시즌을 해외에서 보낼 선수의 기록을 미리 만든다(시즌 중 화면에서 진행 비율만큼 보여 주고, 시즌을 마치면 그대로 확정). 그사이 능력이 바뀌면 확정 때 다시 만든다 */
function ovsPregen(){ for(const a of G.abroad||[]){ if(a.back||a.end!=null)continue; const y1=a.y1??a.y+1; if(G.year<y1||(a.lines||[]).some(l=>l.y===G.year))continue;
    if(a.foreign){ if(!a.fr)continue; a.cur=ovsLine(a.fr,a.lg,{ci:a.ci,av:a.half&&G.year===y1?.6:1}); continue; }
    let p; try{ p=JSON.parse(a.pj); }catch(e){ continue; } if(!p)continue; if(a.ci==null)a.ci=ovlIdx(a.lg,a.club); a.cur=ovsLine(p,a.lg,{ci:a.ci,av:ovsAv(a,p)}); } }
/* 미리 만든 기록을 쓸 수 있으면 쓰고(능력이 같을 때), 아니면 새로 만든다 */
function ovsTake(a,p,o){ const c=a.cur; delete a.cur; const L=c&&c.y===G.year&&Math.abs((c.o??-99)-ovr(p))<.6?c:ovsLine(p,a.lg,o); delete L.o; L.y=G.year; return L; }
/* 그 구단·그 시즌의 KBO 출신 선수 */
function ovsAlumOn(lg,ci,y){ return (G.abroad||[]).filter(a=>a.lg===lg&&a.ci===ci&&(a.lines||[]).some(l=>l.y===y&&l.lvl===lg)); }
/* 시즌을 마친 해외파 한 줄에 붙이는 처리: 시상·소식 후보 */
function ovsFinish(a,L,p,N){ const first=!(a.lines||[]).some(l=>l.lvl===a.lg); const A=ovsAwards(L,p,a.lg,first); if(A.length)L.aw=A; const v=ovsVal(L,p.isP);
  const nm=a.name, cl=a.ci!=null&&a.ci>=0?ovlNm(a.lg,a.ci):a.club||a.lg;
  if(A.length)N.push({pr:(A.includes('MVP')||A.includes('CY')?9:A.includes('ROY')?8:6)+(a.from===G.user?2:0),t:`${a.foreign?'KBO 출신 ':''}${nm}(${cl}), ${a.lg} ${A.map(k=>ovsAwNm(k,a.lg)).join('·')}`,a});
  else if(!a.foreign&&!a.cand&&!(a.lines||[]).length&&ovsBig(L.lvl))N.push({pr:4+(a.from===G.user?2:0),t:`${nm}, ${a.lg} 첫 시즌 ${ovsLineTxt(L,p.isP)}`,a});
  else if(!a.foreign&&!a.cand&&!(a.lines||[]).length)N.push({pr:2+(a.from===G.user?2:0),t:`${nm}, 해외 첫 시즌은 ${L.lvl}에서 · ${ovsLineTxt(L,p.isP)}`,a});
  else if((a.foreign||a.cand)&&ovsBig(L.lvl)&&v>=3.5)N.push({pr:a.cand?5:3,t:a.cand?`관찰하던 후보 ${nm}, ${a.lg}에서 활약 · ${ovsLineTxt(L,p.isP)}`:`KBO 출신 ${nm}, ${a.lg}에서 활약 · ${ovsLineTxt(L,p.isP)}`,a});
  return L; }
/* 해외 소식은 한 시즌 6건까지, 중요한 것부터(우리 구단 출신 우선) */
function ovsWires(N){ N.sort((x,y)=>y.pr-x.pr); for(const x of N.slice(0,6))wire('해외',x.t,{tid:x.a.from??null,ref:x.a.id}); }
/* KBO를 떠난 외국인·관찰 후보의 한 해: 기록·나이·은퇴 */
function ovsForeignYear(a,N){ if(a.end!=null||!a.fr)return; const y1=a.y1??a.y+1; if(G.year<y1||(a.lines||[]).some(l=>l.y===G.year)){ delete a.cur; return; } const p=a.fr;
  const L=ovsFinish(a,ovsTake(a,p,{ci:a.ci,av:a.half&&G.year===y1?.6:1}),p,N); for(const k of ['r','rbi','sb','cs','g'])delete L[k]; /* 저장 크기: 외국인 해외파 줄은 화면에 쓰는 값만 */ (a.lines=a.lines||[]).push(L); if(a.lines.length>5)a.lines.splice(0,a.lines.length-5);
  const big=ovsBig(L.lvl), pr=p.age>=38?1:p.age>=36?.5:p.age>=34?.25:p.age>=32&&!big?.2:!big?.08:.03; if(R()<pr){ a.end=G.year; delete a.fr; } }
/* 외국인 해외파 나이·능력(새해): 국내 성장 규칙 대신 나이 곡선만 */
function ovsAgeFr(fr){ fr.age++; const d=fr.age<=27?.8:fr.age<=30?0:fr.age<=32?-.8:fr.age<=34?-1.6:-2.5; const z=N(0,.8); for(const k in fr.r)fr.r[k]=clamp(Math.round((fr.r[k]+d+z)*10)/10,20,80); }
/* KBO를 떠나는 외국인(재계약 불발·방출): 1군에서 자리를 잡았던 선수만 해외 행선지를 정해 기록을 이어 본다. 은퇴하거나 갈 곳이 없으면 남기지 않는다 */
function ovsTrackGone(p){ if(!p||!p.foreign||p._rt||p.ftmp&&!(p.hist||[]).length)return; if((G.abroad||[]).some(a=>a.id===p.id))return;
  const H=(p.hist||[]).filter(h=>h.lvl==='1군'&&h.t!=null&&G.teams[h.t]); const n=H.reduce((s,h)=>s+(h.pa||0)+(h.outs||0),0); if(n<300)return; /* 주전급으로 뛴 외국인만 */
  if(G.abroad&&G.abroad.filter(a=>a.foreign&&a.end==null&&!a.back).length>=OVS_FMAX-6)return; /* 저장 크기: 기록 중인 외국인 해외파는 OVS_FMAX-6명까지 */
  const o=ovr(p), age=p.age; if(age>=37||(age>=34&&R()<.35&&o<60))return; let lg;
  if(p.foreign==='아시아')lg=p.orig==='tw'?'CPBL':p.orig==='au'?'ABL':'NPB';
  else { const u=R(); lg=o>=58&&age<=33&&u<.4?'NPB':age<=33&&u<.85?'MLB':o<52||age>=33?pick(['멕시코리그','CPBL']):'MLB'; }
  const ci=OVL_C[lg]?Math.floor(R()*OVL_C[lg].length):-1; const from=p.team??H[H.length-1].t; const m=dobj(G.day).m;
  const rec={id:p.id,name:p.name,isP:!!p.isP,pos:posLabel(p),foreign:p.foreign,from,lg,club:ci>=0?ovlNm(lg,ci):lg,ci,how:'KBO 퇴단',yrs:0,amt:0,y:G.year,y1:m>=6?G.year+1:G.year,age,lines:[],fee:0,back:false,d:G.day,pj:null,fr:ovsSlim(p)}; if(m<6)rec.half=1;
  G.abroad=G.abroad||[]; G.abroad.unshift(rec); ovsTrim(); }
/* 관찰하던 외국인 후보가 MLB 콜업·NPB 계약으로 빠지면 우리 해외파 화면에서 계속 본다(놓친 후보가 어떻게 됐는지) */
function ovsTrackCand(p,lg){ if(!p||(G.abroad||[]).some(a=>a.id===p.id))return; G.abroad=G.abroad||[]; if(G.abroad.filter(a=>a.cand&&a.end==null).length>=10)return; const ci=Math.floor(R()*OVL_C[lg].length);
  G.abroad.unshift({id:p.id,name:p.name,isP:!!p.isP,pos:posLabel(p),foreign:p.foreign,from:null,cand:1,lg,club:ovlNm(lg,ci),ci,how:lg==='MLB'?'MLB 콜업':'NPB 계약',yrs:0,amt:0,y:G.year,y1:G.year,half:1,age:p.age,lines:[],fee:0,back:false,d:G.day,pj:null,fr:ovsSlim(p)}); ovsTrim(); }
/* 해외파 명단 120명 한도: 넘치면 끝난 기록(복귀·은퇴)·외국인 기록부터, 오래된 것부터 지운다(아직 해외에 있는 국내 선수가 사라지지 않게) */
const OVS_FMAX=30; /* 외국인·관찰 후보 해외파 기록 한도(10시즌 저장 크기 측정: 이 한도로 약 20KB) */
function ovsTrim(){ const A=G.abroad||[]; const fo=a=>a.foreign||a.cand;
  while(A.filter(fo).length>OVS_FMAX){ let i=-1; for(const f of [a=>fo(a)&&a.end!=null,fo]){ for(let j=A.length-1;j>=0;j--)if(f(A[j])){ i=j; break; } if(i>=0)break; } A.splice(i,1); } /* 외국인 기록은 끝난(은퇴) 것부터, 오래된 것부터 */
  while(A.length>120){ let i=-1; for(const f of [a=>a.back||a.end!=null,fo]){ for(let j=A.length-1;j>=0;j--)if(f(A[j])){ i=j; break; } if(i>=0)break; } A.splice(i>=0?i:A.length-1,1); } }
/* 해외파 한 명의 해외 기록 요약(UI·복귀 협상 공통): 빅리그 시즌 수·최근 가치 */
function ovsSum(a){ const L=(a&&a.lines)||[]; const big=L.filter(l=>ovsBig(l.lvl)&&((l.pa||0)>=200||(l.outs||0)>=(l.rp?120:240))); const last=L[L.length-1]; return {n:L.length,big:big.length,v:last?ovsVal(last,a.isP):0,aw:L.flatMap(l=>l.aw||[])}; }
/* 해외 기록 한 줄 글(엔진 소식용. 화면의 lineTxt와 같은 모양) */
function ovsLineTxt(h,isP){ if(!h)return '-'; if(isP){ const e=h.outs?h.er*27/h.outs:0; return `${ipStr(h.outs||0)}이닝 · ERA ${e.toFixed(2)} · ${h.so||0}K`; } const r=bRate(h); return `${h.pa||0}타석 · 타율 ${fmt3(r.avg)} · ${h.hr||0}홈런 · OPS ${fmt3(r.ops)}`; }
/* 해외 복귀 요구액 배율: 빅리그에서 자리 잡은 시즌·마지막 시즌 가치·해외 시상. 원소속 구단이 우리든 AI든 같은 값 */
function ovsAskMul(a){ const S=ovsSum(a); return clamp(1+S.big*.04+Math.max(0,S.v)*.025+(S.aw.length?.05:0),1,1.3); }
