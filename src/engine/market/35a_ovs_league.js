/* ===== 해외 리그(MLB·트리플A·NPB·CPBL·멕시코리그): 가볍게 돌린다(사용자 11-14: "유저 플레이는 안 돼도 리그 팀 결과와 우리와 이어진 선수 성적만 보게").
   - 경기·선수를 다 만들지 않는다. 구단마다 전력 값 하나(해마다 평균 쪽으로 돌아가는 무작위 걸음)로 시즌 승수를 이항 분포 근사로 뽑고, 포스트시즌은 시리즈 단위로 굴린다.
   - 저장: 리그마다 전력(정수 배열)·올해 승수·지난 10시즌(승수 배열·가을야구 시드·우승/준우승). 한 시즌에 리그당 수백 바이트.
   - 구단 이름은 실제 도시 + 가상 별칭(상표를 피하고 KBO 별칭과 겹치지 않게). 예전 저장의 도시 이름만 있는 구단(뉴욕 등)은 그 도시 첫 구단으로 본다.
   - 트리플A(사용자 11-15: "미국도 메이저와 트리플A 정도는 나와야"): 30개 구단이 번호 그대로 MLB 구단 하나의 산하(i번 MLB 구단 ↔ i번 트리플A 구단). 인터내셔널리그 20·퍼시픽코스트리그 10.
   - CPBL·멕시코리그(LMB)는 같은 가벼운 모델로 순위·우승만(나중에 더 키운다)
   - 선수는 KBO와 이어진 선수만(해외파·KBO를 떠난 외국인·관찰하던 후보): ovsLine이 리그 수준(LG_ADJ)·나이·구단 사정으로 한 시즌 기록을 만든다 */
const OVL_LGS=['MLB','AAA','NPB','CPBL','LMB'];
const OVL_C={MLB:[['뉴욕','나이츠',0],['보스턴','하버스',0],['토론토','노스스타',0],['볼티모어','클리퍼스',0],['탬파베이','선샤인',0],
  ['시카고','윈디스',1],['클리블랜드','랜턴스',1],['디트로이트','모터스',1],['캔자스시티','스카우츠',1],['미네소타','노스맨',1],
  ['휴스턴','오비터스',2],['텍사스','론스타',2],['시애틀','파일럿츠',2],['애너하임','선셋',2],['새크라멘토','골드러시',2],
  ['뉴욕','엠파이어',3],['필라델피아','리버티',3],['애틀랜타','피치스',3],['마이애미','플라밍고스',3],['워싱턴','이글스',3],
  ['시카고','베어캣츠',4],['세인트루이스','아치스',4],['밀워키','스팀',4],['신시내티','리버보츠',4],['피츠버그','아이언스',4],
  ['LA','스타즈',5],['샌프란시스코','시라이언스',5],['샌디에이고','서퍼스',5],['애리조나','스콜피온스',5],['콜로라도','피크스',5]],
 /* 트리플A: 번호 = 모구단(MLB) 번호. 지구 0 IL 동부 · 1 IL 서부 · 2 PCL 동부 · 3 PCL 서부 */
 AAA:[['스크랜턴','콜러스',0],['우스터','하트랜더스',0],['버펄로','스노호크스',0],['노퍽','시독스',0],['더럼','파인스',0],
  ['샬럿','크라운스',0],['콜럼버스','익스플로러스',1],['털리도','글래스메이커스',1],['오마하','프레리독스',1],['세인트폴','아이스보츠',1],
  ['슈거랜드','런처스',2],['라운드록','랭글러스',2],['타코마','타이드러너스',3],['솔트레이크','와사치스',3],['라스베이거스','하이롤러스',3],
  ['시러큐스','솔티즈',0],['리하이밸리','포저스',0],['귀넷','레드클레이스',1],['잭슨빌','팜트리스',0],['로체스터','라일락스',0],
  ['아이오와','하베스터스',1],['멤피스','블루노츠',1],['내슈빌','피들러스',1],['루이빌','서러브레즈',1],['인디애나폴리스','레이서스',1],
  ['오클라호마시티','와일드캐터스',2],['새크라멘토','델타스',3],['엘패소','데저트캣츠',2],['리노','실버러시',3],['앨버커키','벌룬스',2]],
 NPB:[['도쿄','타이탄스',0],['오사카','라이징스',0],['나고야','샤치즈',0],['히로시마','피닉스',0],['요코하마','하버라이츠',0],['도쿄','레이븐스',0],
  ['후쿠오카','팔콘스',1],['삿포로','스노베어스',1],['센다이','아울스',1],['지바','오션스',1],['사이타마','퓨마스',1],['고베','블루스',1]],
 CPBL:[['타이베이','매그파이스',0],['신베이','클라우드레퍼즈',0],['타오위안','에어로스',0],['타이중','선버즈',0],['타이난','라이스킹스',0],['가오슝','마린타이거스',0]],
 LMB:[['티후아나','코요테스',0],['몬테레이','스틸호스',0],['몬클로바','아이언맨',0],['살티요','데저트로즈',0],['토레온','코튼킹스',0],
  ['치와와','실버마이너스',0],['두랑고','마운틴호크스',0],['누에보라레도','리버크로서스',0],['아과스칼리엔테스','핫스프링스',0],['산루이스포토시','실버스타스',0],
  ['멕시코시티','볼케이노스',1],['푸에블라','탈라베라스',1],['오악사카','시에라스',1],['메리다','마야스',1],['칸쿤','터쿼이즈',1],
  ['캄페체','코르세어스',1],['비야에르모사','올멕스',1],['베라크루스','레드스내퍼스',1],['레온','레더워커스',1],['케레타로','아퀴덕츠',1]]};
const OVL_D={MLB:['AL 동부','AL 중부','AL 서부','NL 동부','NL 중부','NL 서부'],AAA:['IL 동부','IL 서부','PCL 동부','PCL 서부'],NPB:['센트럴리그','퍼시픽리그'],CPBL:['CPBL'],LMB:['북부','남부']};
const OVL_G={MLB:162,AAA:150,NPB:143,CPBL:120,LMB:90}, OVL_SD={MLB:.06,AAA:.055,NPB:.045,CPBL:.05,LMB:.06}, OVL_KEEP=10;
const OVL_PS={MLB:'월드시리즈',AAA:'트리플A 챔피언십',NPB:'재팬시리즈',CPBL:'타이완시리즈',LMB:'세리에 델 레이'}, OVL_LBL={MLB:'MLB',AAA:'트리플A',NPB:'NPB',CPBL:'CPBL',LMB:'멕시코리그'};
/* 기록 수준·계약 리그 문자열 → 리그 표 열쇠(트리플A→AAA, NPB 2군→NPB, 멕시코리그→LMB) */
const ovlKey=l=>({'트리플A':'AAA','NPB 1군':'NPB','NPB 2군':'NPB','멕시코리그':'LMB'})[l]||l;
const ovlNm=(lg,i)=>{ const L=OVL_C[ovlKey(lg)], c=L&&L[i]; return c?c[0]+' '+c[1]:''; };
/* 구단 문자열 → 번호: 전체 이름이 먼저, 예전 저장의 도시 이름은 그 도시 첫 구단 */
function ovlIdx(lg,s){ const L=OVL_C[ovlKey(lg)]; if(!L||s==null)return -1; let i=L.findIndex(c=>c[0]+' '+c[1]===s); if(i<0)i=L.findIndex(c=>c[0]===s); return i; }
/* 고정 번호(난수를 쓰지 않는다): 예전 저장 이전·외국인 후보의 트리플A 구단 */
const ovlHashIdx=(k,id,n)=>Math.abs(Math.round(hn(k,id)*9973))%n;
function ovlInit(){ const O=G.ovl=G.ovl||{v:2}; for(const lg of OVL_LGS){ if(O[lg]&&Array.isArray(O[lg].s))continue; const n=OVL_C[lg].length;
    const L=O[lg]={s:Array.from({length:n},()=>Math.round(clamp(N(0,OVL_SD[lg]),-.15,.15)*1000)),h:[]}; L.h.unshift(ovlPlay(lg,L,G.year-1,ovlWins(lg,L))); ovlDrift(lg,L); L.cur={y:G.year,w:ovlWins(lg,L)}; }
  if((O.v||1)<2){ ovsMigrate(); O.v=2; } return O; }
/* 예전 저장(v1): CPBL·멕시코리그로 간 선수는 구단이 없었다. 지난 줄은 그대로 두고, 앞으로 뛸 구단만 고정 번호로 정한다 */
function ovsMigrate(){ for(const a of G.abroad||[]){ if(a.back||a.end!=null||(a.ci!=null&&a.ci>=0))continue; const L=OVL_C[ovlKey(a.lg)]; if(!L)continue; a.ci=ovlHashIdx('ovc',a.id,L.length); a.club=ovlNm(a.lg,a.ci); } }
/* 전력: 지난해 전력의 55%를 이어받고 나머지는 새로(정상 분포 폭은 그대로). MLB 승률 표준편차 약 .07, NPB 약 .055 */
function ovlDrift(lg,L){ const rho=.55, sd=OVL_SD[lg]*Math.sqrt(1-rho*rho); L.s=L.s.map(v=>Math.round(clamp(rho*v/1000+N(0,sd),-.16,.16)*1000)); }
function ovlP(lg,L){ const s=L.s.map(v=>v/1000), m=s.reduce((a,b)=>a+b,0)/s.length; return s.map(v=>clamp(.5+v-m,.28,.72)); }
function ovlWins(lg,L){ const g=OVL_G[lg], P=ovlP(lg,L), n=P.length; const w=P.map(p=>clamp(Math.round(g*p+N(0,Math.sqrt(g*p*(1-p)))),0,g));
  let d=g*n/2-w.reduce((a,b)=>a+b,0), k=0; while(d!==0&&k++<20000){ const i=Math.floor(R()*n); if(d>0&&w[i]<g){ w[i]++; d--; } else if(d<0&&w[i]>0){ w[i]--; d++; } } return w; } /* 리그 전체 승수 = 경기 수 × 구단 수 ÷ 2 */
/* 시리즈: 먼저 need승. adv는 앞선 시드의 1승 어드밴티지(NPB 클라이맥스 최종) */
function ovlSeries(P,a,b,need,adv){ const pa=P[a], pb=P[b], q=pa*(1-pb)/(pa*(1-pb)+pb*(1-pa)); let x=adv||0, y=0; while(x<need&&y<need){ if(R()<q)x++; else y++; } return x>=need?{w:a,l:b,s:`${x-(adv||0)}-${y}`}:{w:b,l:a,s:`${y}-${x-(adv||0)}`}; }
const ovlOrd=(I,w)=>[...I].sort((a,b)=>w[b]-w[a]||hn('ovo',a*31+b)-hn('ovo',b*31+a)); /* 승수가 같으면 고정 순서(다시 그려도 같게) */
/* 가을야구. po: 나간 팀 · pn: 결승에 오른 두 팀(리그·지구 우승) · ch·ru·sr: 결승 */
const OVL_FN={MLB:4,AAA:1,NPB:4,CPBL:4,LMB:4}; /* 결승 승수(트리플A 챔피언십은 단판) */
function ovlPlay(lg,L,y,w){ const P=ovlP(lg,L), C=OVL_C[lg]; const H={y,w:w.slice()}; const I=C.map((c,i)=>i), inD=d=>I.filter(i=>C[i][2]===d); let a,b,po;
  if(lg==='MLB'){ const lgSeeds=[0,1].map(k=>{ const divs=[0,1,2].map(d=>ovlOrd(inD(k*3+d),w)[0]); const top=ovlOrd(divs,w); const rest=ovlOrd(I.filter(i=>Math.floor(C[i][2]/3)===k&&!divs.includes(i)),w).slice(0,3); return top.concat(rest); });
    const champ=S=>{ const w1=ovlSeries(P,S[3],S[4],2).w, w2=ovlSeries(P,S[2],S[5],2).w; const d1=ovlSeries(P,S[0],w1,3).w, d2=ovlSeries(P,S[1],w2,3).w; return ovlSeries(P,d1,d2,4).w; };
    a=champ(lgSeeds[0]); b=champ(lgSeeds[1]); po=lgSeeds[0].concat(lgSeeds[1]); }
  else if(lg==='AAA'){ /* 리그(IL·PCL)마다 두 지구 1위가 3전 2승 → 두 리그 우승팀이 단판 */ const S=[0,1,2,3].map(d=>ovlOrd(inD(d),w)[0]); a=ovlSeries(P,S[0],S[1],2).w; b=ovlSeries(P,S[2],S[3],2).w; po=S; }
  else if(lg==='CPBL'){ /* 한 리그: 2·3위 5전 3승 → 1위와 타이완시리즈 */ const S=ovlOrd(I,w).slice(0,3); a=S[0]; b=ovlSeries(P,S[1],S[2],3).w; po=S; }
  else if(lg==='LMB'){ /* 지구마다 4위까지 7전 4승 두 판 → 세리에 델 레이 */ const Z=[0,1].map(d=>ovlOrd(inD(d),w).slice(0,4)); const zc=S=>ovlSeries(P,ovlSeries(P,S[0],S[3],4).w,ovlSeries(P,S[1],S[2],4).w,4).w; a=zc(Z[0]); b=zc(Z[1]); po=Z[0].concat(Z[1]); }
  else { const lgSeeds=[0,1].map(k=>ovlOrd(inD(k),w).slice(0,3)); const champ=S=>{ const w1=ovlSeries(P,S[1],S[2],2).w; return ovlSeries(P,S[0],w1,4,1).w; };
    a=champ(lgSeeds[0]); b=champ(lgSeeds[1]); po=lgSeeds[0].concat(lgSeeds[1]); }
  const f=ovlSeries(P,a,b,OVL_FN[lg]); H.po=po; H.ch=f.w; H.ru=f.l; H.sr=f.s; H.pn=[a,b];
  return H; }
/* 시즌 진행 비율(해외 리그 정규시즌 3월 말~9월 말). 보여 주기만 비례로 나눈다 */
function ovlFrac(y){ if(y<G.year)return 1; if(y>G.year)return 0; const a=KD(3,27), b=KD(9,28); return clamp((G.day-a)/(b-a),0,1); }
/* 새해(G.year가 오른 뒤): 지난 시즌을 아직 못 닫았으면 닫고, 전력을 움직여 올 시즌 승수를 미리 만든다 */
function ovlNewYear(){ const O=ovlInit(); for(const lg of OVL_LGS){ const L=O[lg]; if(L.cur&&L.cur.y<G.year&&!L.h.some(h=>h.y===L.cur.y))ovlClose(lg,L,L.cur.y);
    if(!L.cur||L.cur.y!==G.year){ ovlDrift(lg,L); L.cur={y:G.year,w:ovlWins(lg,L)}; } }
  try{ ovsPregen(); }catch(e){} }
function ovlClose(lg,L,y){ const w=L.cur&&L.cur.y===y?L.cur.w:ovlWins(lg,L); const H=ovlPlay(lg,L,y,w); L.h=L.h.filter(h=>h.y!==y); L.h.unshift(H); L.h.sort((a,b)=>b.y-a.y); if(L.h.length>OVL_KEEP)L.h.length=OVL_KEEP; if(L.cur&&L.cur.y===y)delete L.cur; return H; }
/* KBO 시즌을 마무리할 때(스토브리그 시작): 해외 리그도 그 시즌을 닫는다 */
function ovlSeasonEnd(){ const O=ovlInit(); const out=[]; for(const lg of OVL_LGS){ const L=O[lg]; if(L.h.some(h=>h.y===G.year))continue; const H=ovlClose(lg,L,G.year); out.push([lg,H]); } O.wy=out.length?G.year:O.wy; return out; }
/* 우승 소식: 해외파 기록을 만든 뒤에(우승 구단의 KBO 출신 선수를 함께 적는다). 한 시즌 한 번. 트리플A·CPBL·멕시코리그는 KBO 출신이 있을 때만 */
function ovlChampWire(){ const O=G.ovl; if(!O||O.wy!==G.year||O.wd===G.year)return; O.wd=G.year; for(const lg of OVL_LGS){ const H=((O[lg]||{}).h||[]).find(h=>h.y===G.year); if(!H)continue; const al=ovsAlumOn(lg,H.ch,G.year); if(!al.length&&lg!=='MLB'&&lg!=='NPB')continue;
    wire('해외',`${ovlNm(lg,H.ch)}, ${G.year} ${OVL_PS[lg]} 우승(${H.sr})${al.length?` · KBO 출신 ${al.map(a=>a.name).join('·')} 우승 반지`:''}`,{ref:al.length?al[0].id:null}); } }
function ovlSeason(lg,y){ lg=ovlKey(lg); const O=G.ovl, L=O&&O[lg]; if(!L||!L.h)return null; /* 화면에서도 부르므로 만들지 않고 읽기만 */ if(L.cur&&L.cur.y===y)return {y,w:L.cur.w,live:true}; return L.h.find(h=>h.y===y)||null; }
/* 순위표: 진행 중인 시즌은 지금까지 치른 만큼 비례로 */
function ovlTable(lg,y){ lg=ovlKey(lg); const S=ovlSeason(lg,y); if(!S)return null; const g=OVL_G[lg], f=S.live?ovlFrac(y):1, gp=Math.round(g*f); const C=OVL_C[lg];
  const rows=S.w.map((w,i)=>{ const W=S.live?Math.min(gp,Math.round(w*f)):w; return {i,w:W,l:gp-W,d:C[i][2]}; });
  const div=OVL_D[lg].map((nm,d)=>{ const L=rows.filter(r=>r.d===d).sort((a,b)=>b.w-a.w||a.l-b.l); const t=L[0]; for(const r of L)r.gb=((t.w-r.w)+(r.l-t.l))/2; return {nm,L}; });
  return {S,f,gp,div,live:!!S.live}; }
/* 그 시즌 구단 성적(해외파 줄에 붙이는 맥락) */
function ovlTeamRec(lg,i,y){ if(i==null||i<0)return null; const T=ovlTable(lg,y); if(!T)return null; for(const D of T.div){ const k=D.L.findIndex(r=>r.i===i); if(k>=0){ const r=D.L[k], S=T.S; return {w:r.w,l:r.l,rk:k+1,dn:D.nm,live:T.live,po:!T.live&&(S.po||[]).includes(i),ch:!T.live&&S.ch===i,ru:!T.live&&S.ru===i,pn:!T.live&&(S.pn||[]).includes(i)}; } } return null; }
function ovlStr(lg,i){ const O=G.ovl, L=O&&O[ovlKey(lg)]; return L&&L.s&&i!=null&&i>=0&&L.s[i]!=null?L.s[i]/1000:0; }
/* 외국인 후보의 트리플A 구단(지난 시즌·올해 같은 구단. 저장하지 않고 번호로 정한다). 구단 이름은 보여 주기만: 우리와 AI 구단의 평가식(fRecEst)은 그대로 */
const ovlCandAaa=p=>p&&p.prevLvl==='트리플A'?ovlHashIdx('aaa',p.id,OVL_C.AAA.length):-1;
function ovlCandLvl(p,lvl,short){ lvl=lvl||(p&&p.prevLvl)||''; const i=lvl==='트리플A'&&p&&p.prevLvl==='트리플A'?ovlCandAaa(p):-1; return i>=0?`${lvl} ${short?OVL_C.AAA[i][0]:ovlNm('AAA',i)}`:lvl; }

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
/* 한 시즌 기록. lg: 계약한 리그(MLB·NPB·CPBL·ABL·멕시코리그). 능력이 기준에 못 미치면 MLB는 산하 트리플A, NPB는 2군에서 뛴다(경계선이면 한 시즌을 MLB·트리플A로 나눈다). 약한 구단은 기회를 조금 더 준다 */
function ovsLine(p,lg,o){ o=o||{}; const av=clamp(o.av??1,0,1), thr=OVS_THR[lg], hasC=!!OVL_C[ovlKey(lg)]&&o.ci!=null&&o.ci>=0; const ob=ovr(p); let m=thr==null?4:ob-thr; if(thr!=null&&hasC){ const s=ovlStr(lg,o.ci); m+=s<-.03?1:s>.04?-.7:0; }
  const sp=p.isP&&isSPr(p);
  const nFor=big=>p.isP?(sp?(big?(m>=4?ri(470,590):ri(210,430)):ri(300,450)):(big?(m>=4?ri(170,215):ri(90,170)):ri(120,190))):(big?(m>=4?ri(500,650):ri(170,420)):ri(300,520));
  const mk=(lvl,n)=>{ const A=ovsAdj(lvl); const L=p.isP?simPit(p,n,A[1]):simBat(p,n,A[0]); L.y=o.y??G.year; L.lvl=lvl; if(hasC)L.c=o.ci; /* 트리플A 줄의 c는 산하 트리플A 구단 번호(= 모구단 번호) */
    L.g=n?(p.isP?Math.max(1,Math.round(n/(sp?17.5:3.2))):Math.max(1,Math.round(n/4.1))):0; if(p.isP&&!sp)L.rp=1; return L; };
  let L;
  if(lg==='MLB'&&m>=-2.5&&m<1.5){ /* 경계선 선수: 시즌 중 콜업·강등. 빅리그 몫 f만큼 MLB, 나머지는 산하 트리플A. 더 많이 뛴 쪽이 그 시즌의 수준, 다른 쪽은 x에 붙인다 */
    const f=clamp((m+2.5)/4,.1,.9), A=mk('MLB',Math.round(nFor(true)*f*av)), B=mk('트리플A',Math.round(nFor(false)*(1-f)*av)); const tA=(A.pa||0)+(A.outs||0)*1.3, tB=(B.pa||0)+(B.outs||0)*1.3; L=tA>=tB?A:B; const X=L===A?B:A; if(((X.pa||0)+(X.outs||0))>=8){ delete X.y; L.x=X; } }
  else { const big=m>=0; L=mk(thr==null?lg:big?lg:OVS_MINOR[lg],Math.round(nFor(big)*av)); }
  L.o=Math.round(ob*10)/10; return L; } /* o: 만들 때 능력(새해에 미리 만든 기록이 그사이 능력 변화로 낡았는지 본다) */
/* 한 시즌 줄의 부분(본 줄 + 시즌 중 오르내린 다른 수준 x) */
const ovsParts=l=>l?(l.x?[l,l.x]:[l]):[];
/* 줄 부분의 구단 이름(수준에 맞는 리그 표에서: 트리플A면 산하 트리플A 구단) */
const ovsClubNm=l=>l&&l.c!=null&&l.c>=0?ovlNm(l.lvl,l.c):'';
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
function ovsPart(L,f){ if(!L)return null; if(f>=1)return L; const o={}; for(const k in L)o[k]=k==='x'?ovsPart(L.x,f):typeof L[k]==='number'&&!['y','c','o','rp'].includes(k)?Math.round(L[k]*f):L[k]; o.live=1; return o; }
/* 재활 중인 기간만큼 못 뛴다. 첫 시즌은 개막 전까지 지난 재활 기간을 빼고(검수 11-08, 11-06) */
function ovsAv(a,p){ const inj=a.d!=null&&!(a.lines||[]).length?Math.max(0,(p.injOut||0)-Math.max(0,dnum(G.year,3,22)-a.d)):(p.injOut||0); return clamp(1-inj/365,0,1); }
/* 새해: 올 시즌을 해외에서 보낼 선수의 기록을 미리 만든다(시즌 중 화면에서 진행 비율만큼 보여 주고, 시즌을 마치면 그대로 확정). 그사이 능력이 바뀌면 확정 때 다시 만든다 */
function ovsPregen(){ for(const a of G.abroad||[]){ if(a.back||a.end!=null)continue; const y1=a.y1??a.y+1; if(G.year<y1||(a.lines||[]).some(l=>l.y===G.year))continue;
    if(a.foreign){ if(!a.fr)continue; a.cur=ovsLine(a.fr,a.lg,{ci:a.ci,av:a.half&&G.year===y1?.6:1}); continue; }
    let p; try{ p=JSON.parse(a.pj); }catch(e){ continue; } if(!p)continue; if(a.ci==null)a.ci=ovlIdx(a.lg,a.club); a.cur=ovsLine(p,a.lg,{ci:a.ci,av:ovsAv(a,p)}); } }
/* 미리 만든 기록을 쓸 수 있으면 쓰고(능력이 같을 때), 아니면 새로 만든다 */
function ovsTake(a,p,o){ const c=a.cur; delete a.cur; const L=c&&c.y===G.year&&Math.abs((c.o??-99)-ovr(p))<.6?c:ovsLine(p,a.lg,o); delete L.o; L.y=G.year; if(L.c==null&&a.ci!=null&&a.ci>=0&&OVL_C[ovlKey(L.lvl)])L.c=a.ci; /* 예전 저장에서 미리 만든 기록(구단 없음) */ return L; }
/* 그 구단·그 시즌의 KBO 출신 선수 */
function ovsAlumOn(lg,ci,y){ const K=ovlKey(lg); return (G.abroad||[]).filter(a=>(a.lines||[]).some(l=>l.y===y&&ovsParts(l).some(q=>q.c===ci&&q.lvl!=='NPB 2군'&&ovlKey(q.lvl)===K))); }
/* 시즌을 마친 해외파 한 줄에 붙이는 처리: 시상·소식 후보 */
function ovsFinish(a,L,p,N){ const first=!(a.lines||[]).some(l=>l.lvl===a.lg); const A=ovsAwards(L,p,a.lg,first); if(A.length)L.aw=A; const v=ovsVal(L,p.isP);
  const nm=a.name, cl=a.ci!=null&&a.ci>=0?ovlNm(a.lg,a.ci):a.club||a.lg, lc=ovsClubNm(L);
  if(A.length)N.push({pr:(A.includes('MVP')||A.includes('CY')?9:A.includes('ROY')?8:6)+(a.from===G.user?2:0),t:`${a.foreign?'KBO 출신 ':''}${nm}(${cl}), ${a.lg} ${A.map(k=>ovsAwNm(k,a.lg)).join('·')}`,a});
  else if(!a.foreign&&!a.cand&&!(a.lines||[]).length&&ovsBig(L.lvl))N.push({pr:4+(a.from===G.user?2:0),t:`${nm}, ${a.lg} 첫 시즌 ${ovsLineTxt(L,p.isP)}`,a});
  else if(!a.foreign&&!a.cand&&!(a.lines||[]).length)N.push({pr:2+(a.from===G.user?2:0),t:`${nm}, 해외 첫 시즌은 ${L.lvl}${lc&&L.lvl==='트리플A'?` ${lc}`:''}에서 · ${ovsLineTxt(L,p.isP)}`,a});
  else if((a.foreign||a.cand)&&ovsBig(L.lvl)&&v>=3.5)N.push({pr:a.cand?5:3,t:a.cand?`관찰하던 후보 ${nm}, ${a.lg}에서 활약 · ${ovsLineTxt(L,p.isP)}`:`KBO 출신 ${nm}, ${a.lg}에서 활약 · ${ovsLineTxt(L,p.isP)}`,a});
  return L; }
/* 해외 소식은 한 시즌 6건까지, 중요한 것부터(우리 구단 출신 우선) */
function ovsWires(N){ N.sort((x,y)=>y.pr-x.pr); for(const x of N.slice(0,6))wire('해외',x.t,{tid:x.a.from??null,ref:x.a.id}); }
/* KBO를 떠난 외국인·관찰 후보의 한 해: 기록·나이·은퇴 */
function ovsForeignYear(a,N){ if(a.end!=null||!a.fr)return; const y1=a.y1??a.y+1; if(G.year<y1||(a.lines||[]).some(l=>l.y===G.year)){ delete a.cur; return; } const p=a.fr;
  const L=ovsFinish(a,ovsTake(a,p,{ci:a.ci,av:a.half&&G.year===y1?.6:1}),p,N); for(const q of ovsParts(L))for(const k of ['r','rbi','sb','cs','g'])delete q[k]; /* 저장 크기: 외국인 해외파 줄은 화면에 쓰는 값만 */ (a.lines=a.lines||[]).push(L); if(a.lines.length>5)a.lines.splice(0,a.lines.length-5);
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
  const CL=OVL_C[ovlKey(lg)], ci=CL?Math.floor(R()*CL.length):-1; const from=p.team??H[H.length-1].t; const m=dobj(G.day).m;
  const rec={id:p.id,name:p.name,isP:!!p.isP,pos:posLabel(p),foreign:p.foreign,from,lg,club:ci>=0?ovlNm(lg,ci):lg,ci,how:'KBO 퇴단',yrs:0,amt:0,y:G.year,y1:m>=6?G.year+1:G.year,age,lines:[],fee:0,back:false,d:G.day,pj:null,fr:ovsSlim(p)}; if(m<6)rec.half=1;
  G.abroad=G.abroad||[]; G.abroad.unshift(rec); ovsTrim(); }
/* 관찰하던 외국인 후보가 MLB 콜업·NPB 계약으로 빠지면 우리 해외파 화면에서 계속 본다(놓친 후보가 어떻게 됐는지) */
function ovsTrackCand(p,lg){ if(!p||(G.abroad||[]).some(a=>a.id===p.id))return; G.abroad=G.abroad||[]; if(G.abroad.filter(a=>a.cand&&a.end==null).length>=10)return; const ac=lg==='MLB'?ovlCandAaa(p):-1, ci=ac>=0?ac:Math.floor(R()*OVL_C[lg].length); /* 트리플A 후보는 그 구단의 모구단으로 콜업 */
  G.abroad.unshift({id:p.id,name:p.name,isP:!!p.isP,pos:posLabel(p),foreign:p.foreign,from:null,cand:1,lg,club:ovlNm(lg,ci),ci,how:lg==='MLB'?'MLB 콜업':'NPB 계약',yrs:0,amt:0,y:G.year,y1:G.year,half:1,age:p.age,lines:[],fee:0,back:false,d:G.day,pj:null,fr:ovsSlim(p)}); ovsTrim(); }
/* 해외파 명단 120명 한도: 넘치면 끝난 기록(복귀·은퇴)·외국인 기록부터, 오래된 것부터 지운다(아직 해외에 있는 국내 선수가 사라지지 않게) */
const OVS_FMAX=30; /* 외국인·관찰 후보 해외파 기록 한도(10시즌 저장 크기 측정: 이 한도로 약 20KB) */
function ovsTrim(){ const A=G.abroad||[]; const fo=a=>a.foreign||a.cand;
  while(A.filter(fo).length>OVS_FMAX){ let i=-1; for(const f of [a=>fo(a)&&a.end!=null,fo]){ for(let j=A.length-1;j>=0;j--)if(f(A[j])){ i=j; break; } if(i>=0)break; } A.splice(i,1); } /* 외국인 기록은 끝난(은퇴) 것부터, 오래된 것부터 */
  while(A.length>120){ let i=-1; for(const f of [a=>a.back||a.end!=null,fo]){ for(let j=A.length-1;j>=0;j--)if(f(A[j])){ i=j; break; } if(i>=0)break; } A.splice(i>=0?i:A.length-1,1); } }
/* 해외파 한 명의 해외 기록 요약(UI·복귀 협상 공통): 빅리그 시즌 수·최근 가치 */
function ovsSum(a){ const L=(a&&a.lines)||[]; const big=L.filter(l=>ovsParts(l).some(q=>ovsBig(q.lvl)&&((q.pa||0)>=200||(q.outs||0)>=(q.rp?120:240)))); const last=L[L.length-1]; return {n:L.length,big:big.length,v:last?ovsVal(last,a.isP):0,aw:L.flatMap(l=>l.aw||[])}; }
/* 해외 기록 한 줄 글(엔진 소식용. 화면의 lineTxt와 같은 모양) */
function ovsLineTxt(h,isP){ if(!h)return '-'; if(isP){ const e=h.outs?h.er*27/h.outs:0; return `${ipStr(h.outs||0)}이닝 · ERA ${e.toFixed(2)} · ${h.so||0}K`; } const r=bRate(h); return `${h.pa||0}타석 · 타율 ${fmt3(r.avg)} · ${h.hr||0}홈런 · OPS ${fmt3(r.ops)}`; }
/* 해외 복귀 요구액 배율: 빅리그에서 자리 잡은 시즌·마지막 시즌 가치·해외 시상. 원소속 구단이 우리든 AI든 같은 값 */
function ovsAskMul(a){ const S=ovsSum(a); return clamp(1+S.big*.04+Math.max(0,S.v)*.025+(S.aw.length?.05:0),1,1.3); }
/* ----- 화면·선수 기록 표가 함께 쓰는 읽기 전용 도우미(만들지 않는다) ----- */
const ovsLvlL=l=>l==='NPB'?'NPB 1군':l||'';
/* 그 시즌 그 구단에서 뛴(뛰는) KBO 출신: 줄의 수준(트리플A면 산하 구단)으로 리그 표를 고른다 */
function ovlAlumMap(lg,y){ const M={}; for(const a of G.abroad||[]){ const ls=(a.lines||[]).filter(l=>l.y===y); if(a.cur&&a.cur.y===y&&!a.back&&a.end==null)ls.push(a.cur); const seen=new Set();
    for(const l of ls)for(const q of ovsParts(l)){ if(q.c==null||q.c<0||ovlKey(q.lvl)!==lg||seen.has(q.c))continue; seen.add(q.c); (M[q.c]=M[q.c]||[]).push(a); } } return M; }
/* 해외 리그 주목 선수: 게임이 기록을 쌓는 선수(KBO 출신 해외파·외국인 시장 후보·관찰 명단)만 리그별 TOP 10. 공개 기록뿐(후보 능력·추정은 쓰지 않는다).
   시즌 진행 20% 전에는 지난 시즌 기록. 최소 타석·이닝은 진행 비율만큼 */
const ovlTopKey=l=>l==='MLB'?'MLB':l==='트리플A'?'AAA':l==='NPB'||l==='NPB 1군'?'NPB':'etc';
function ovlTopPool(){ const fr=ovlFrac(G.year), last=fr<.2, y=last?G.year-1:G.year, f=last?1:fr, R=[], seen=new Set(), W=new Set((G.fwatch||[]).map(w=>w.id));
  for(const a of G.abroad||[]){ if(a.back||a.end!=null||seen.has(String(a.id)))continue; let l=(a.lines||[]).find(z=>z.y===y); if(!l&&!last&&a.cur&&a.cur.y===y)l=ovsPart(a.cur,fr); if(!l)continue; seen.add(String(a.id));
    for(const q0 of ovsParts(l)){ const {o,x,...q}=q0; /* o: 만들 때 능력(숨은 값)은 빼고 기록만 */ R.push({id:a.id,abr:1,name:a.name,isP:!!a.isP,pos:a.pos,tag:a.cand?'관찰했던 후보':'KBO 출신',lvl:q.lvl,club:ovsClubNm(q)||(ovlTopKey(q.lvl)==='etc'?ovsLvlL(q.lvl):a.club||a.lg),h:q}); } }
  for(const id of new Set([...(G.fmarket||[]),...W])){ const p=G.players[id]; if(!p||p.team!=null||!p.foreign||seen.has(String(p.id)))continue; const h=last?p.prev:p.now&&p.now.y===G.year?p.now:null; const lvl=h&&(h.lvl||p.prevLvl); if(!lvl)continue; seen.add(String(p.id));
    R.push({id:p.id,abr:0,name:p.name,isP:!!p.isP,pos:posLabel(p),tag:W.has(p.id)?'관찰 중':'외국인 후보',lvl,club:ovlCandLvl(p,lvl),h}); }
  return {y,last,minPA:Math.max(20,Math.round(200*f)),minOuts:Math.max(24,Math.round(150*f)),R}; }
function ovlTop(k,pool){ const P=pool||ovlTopPool(), L=P.R.filter(r=>ovlTopKey(r.lvl)===k);
  const bat=L.filter(r=>!r.isP&&(r.h.pa||0)>=P.minPA).map(r=>Object.assign({},r,{s:bRate(r.h)})).sort((a,b)=>b.s.ops-a.s.ops||b.h.pa-a.h.pa).slice(0,10);
  const pit=L.filter(r=>r.isP&&(r.h.outs||0)>=P.minOuts).map(r=>Object.assign({},r,{s:pRate(r.h)})).sort((a,b)=>a.s.era-b.s.era||b.h.outs-a.h.outs).slice(0,10);
  return {y:P.y,last:P.last,minPA:P.minPA,minOuts:P.minOuts,n:L.length,bat,pit}; }
/* 선수 기록 표에 넣을 해외 시즌 줄(복귀 선수·다시 온 선수) */
function ovsStatRows(p){ const out=[]; for(const a of G.abroad||[]){ if(String(a.id)!==String(p.id))continue; for(const l of a.lines||[])for(const q of ovsParts(l)){ const cn=ovsClubNm(q), {x,...r}=q; out.push(Object.assign({r:0,rbi:0,sb:0,cs:0,g:0},r,{y:l.y,pre:`${ovsLvlL(q.lvl)}${cn?' '+cn.split(' ')[0]:''}`})); } } return out; }
