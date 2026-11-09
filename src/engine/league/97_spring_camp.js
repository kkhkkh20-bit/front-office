/* ===== 스프링캠프 장소 · 훈련 강도 · 연습경기 · 시범경기 =====
 실제 KBO(2026) 참고
 - 1월 21~25일 출국, 3월 4~9일 귀국. 1차: 미국 애리조나·플로리다, 호주, 대만 가오슝·타이난, 괌, 일본 가고시마. 2차: 일본 오키나와·미야자키(대만에 머무는 구단도 있다).
 - 미국 캠프는 환율·물가·이상 한파·시차·비자 문제로 줄었다(1차 미국 2023년 7개 구단 → 2026년 3개). 호주는 시차가 거의 없고 따뜻하지만 연습 상대가 적다.
 - 오키나와·미야자키에는 일본 구단과 한국 구단이 몰려 연습경기를 잡기 쉽다.
 - 시범경기: 3월 12일 개막, 팀당 12경기(총 60경기), 연장·더블헤더 없음, 순위에 들어가지 않는다. 정규시즌은 3월 28일 개막.
 게임 규칙
 - 장소는 11월(스토브리그)부터 1월 24일까지 예약한다. 장소마다 받을 수 있는 구단 수가 정해져 있고 다른 구단도 하나씩 채워 간다. 좋은 곳은 일찍 예약해야 한다.
 - 예약 성공과 값은 단장 명성(현지 네트워크)과 지난해에도 쓴 곳인지에 달렸다. 비용은 기본 운영비(대만·국내 기준)보다 더 드는 돈만 받는다.
 - 훈련 강도는 감독과 함께 정한다. 감독 성향(규율)으로 원하는 강도가 있고, 단장이 다르게 정하면 캠프 시작 때 감독 관계가 깎이고 효과도 조금 준다.
 - 강도: 빡센 캠프는 성장이 크고 캠프 부상이 늘며 개막 컨디션이 늦게 올라온다. 자율 훈련은 반대. */
const SPRC1={
  az:{l:'미국 애리조나',c:600,wx:1.03,wv:.07,fq:1.08,tr:3,sl:2,pg:3,ap:.55,opp:'us',d:'최고 수준의 훈련 단지입니다. 최근 이상 한파가 잦고 시차·이동 부담이 큽니다.'},
  fl:{l:'미국 플로리다',c:550,wx:1.05,wv:.04,fq:1.06,tr:3,sl:1,pg:2,ap:.45,opp:'us',d:'따뜻하고 시설이 좋습니다. 비용과 이동 부담이 큽니다.'},
  au:{l:'호주(멜버른·시드니)',c:250,wx:1.05,wv:.03,fq:1.0,tr:1,sl:3,pg:1,ap:.7,opp:'aus',d:'한여름이라 따뜻하고 시차가 거의 없습니다. 연습경기 상대가 적습니다.'},
  tw:{l:'대만(가오슝·타이난)',c:0,wx:1.0,wv:.04,fq:.96,tr:1,sl:3,pg:3,ap:.55,opp:'cpbl',d:'비용이 가장 적고 가깝습니다. 대만 프로 구단과 연습경기를 잡기 쉽습니다.'},
  gu:{l:'괌',c:200,wx:1.04,wv:.02,fq:.93,tr:1,sl:2,pg:0,ap:.4,opp:null,d:'따뜻하고 가깝지만 구장이 작고 연습 상대가 없습니다. 몸 만들기 위주입니다.'},
  jk:{l:'일본 가고시마',c:150,wx:.97,wv:.04,fq:1.0,tr:1,sl:1,pg:1,ap:.35,opp:'npb2',d:'가깝고 시설이 괜찮지만 2월 초는 쌀쌀합니다.'}};
const SPRC2={
  oki:{l:'일본 오키나와',c:200,wx:1.0,wv:.05,fq:1.02,tr:1,sl:6,pg:4,ap:.8,opp:'npb',d:'일본·한국 구단이 몰려 연습경기를 가장 많이, 강한 상대와 잡을 수 있습니다. 인기가 많아 자리가 빨리 찹니다.'},
  miy:{l:'일본 미야자키',c:150,wx:.99,wv:.05,fq:1.02,tr:1,sl:3,pg:3,ap:.6,opp:'npb',d:'일본 구단 캠프지가 모여 있어 연습경기를 잡기 좋습니다.'},
  tw:{l:'대만',c:0,wx:1.0,wv:.04,fq:.96,tr:1,sl:3,pg:2,ap:.3,opp:'cpbl',d:'1차에 이어 대만에 머뭅니다. 비용이 적고 대만 프로 구단과 붙습니다.'},
  home:{l:'국내(일찍 귀국)',c:0,wx:.86,wv:.04,fq:.95,tr:0,sl:10,pg:1,ap:.1,opp:'kr2',d:'일찍 귀국해 국내에서 마무리합니다. 춥고 실내 훈련 위주라 효과가 떨어집니다.'}};
const SPRC_INT={hard:{l:'빡센 캠프',g:1.28,inj:.035,cond:-.5,d:'훈련량이 많습니다. 성장이 크지만 캠프 부상이 늘고 개막 컨디션이 늦게 올라옵니다.'},norm:{l:'보통',g:1,inj:.015,cond:0,d:'정해진 일정대로 갑니다.'},easy:{l:'자율 훈련',g:.78,inj:.007,cond:.3,d:'베테랑 위주로 스스로 몸을 만듭니다. 부상이 적고 개막 컨디션이 좋지만 성장은 작습니다.'}};
const SPRC_INTK=['easy','norm','hard'];
const SPRC_PGN=[0,4,6,8,10,12];
const SPRC_LV={hard:'강팀 위주(일본 1군)',mix:'섞어서',easy:'실전 감각 위주(2군·국내)'};
/* 연습 상대 수준: 우리 타자·투수 기록에 주는 보정(음수면 상대가 강하다) */
const SPRC_OPP={npb1:{l:'일본 프로 1군',b:-3},npb2:{l:'일본 프로 2군',b:2},cpbl:{l:'대만 프로 구단',b:1},aus:{l:'호주리그 팀',b:3},us:{l:'미국 대학·마이너 팀',b:2},kr2:{l:'국내 대학·실업 팀',b:4}};
/* 감독이 원하는 강도(규율 성향) */
function sprcMgrPref(m){ if(!m||m.interim)return 'norm'; const d=m.disc??45; return d>=62?'hard':d<=38?'easy':'norm'; }
const sprcOpen=()=>!!(G.cal&&G.cal.y===G.year&&G.day<G.cal.camp&&(dobj(G.day).y<G.year||dobj(G.day).m===1));
function sprcInit(){ const y=G.year; if(G.scp&&G.scp.y===y)return G.scp; const prev={}; if(G.scp&&G.scp.t)for(const k in G.scp.t){ const P=G.scp.t[k]; if(P&&P.s1)prev[k]={s1:P.s1,s2:P.s2}; }
  G.scp={y,t:{},prev,pgS:{}}; return G.scp; }
function sprcPlan(tid){ const S=sprcInit(); if(!S.t[tid]){ const m=G.mgr[tid]; S.t[tid]={s1:null,s2:null,int:sprcMgrPref(m),pgN:6,pgLv:'mix',fail:{},c:0}; } return S.t[tid]; }
function sprcTaken(lvl,k){ const S=sprcInit(); return Object.values(S.t).filter(P=>P&&P[lvl===1?'s1':'s2']===k).length; }
/* 예약 성공 확률·값: 명성(현지 네트워크) · 지난해에도 쓴 곳 · 자리가 얼마나 찼는지 · 예약 시기 */
function sprcOdds(tid,lvl,k){ const D=(lvl===1?SPRC1:SPRC2)[k]; if(!D)return {q:0,c:0}; const S=sprcInit(); const pv=S.prev[tid]&&S.prev[tid][lvl===1?'s1':'s2']===k; const rep=tid===G.user?(G.rep??50):50; const m=dobj(G.day).m; const late=m===1?.1:m===12?.04:0;
  const sb=k!=='home'&&sisSite(tid,lvl,k); /* 자매구단 캠프지: 성사 +25%p, 비용 20% 할인(98_sister_club.js) */
  const q=k==='home'?1:clamp(.62+(rep-50)/100+(pv?.2:0)-sprcTaken(lvl,k)/D.sl*.25-late+(sb?.25:0),.25,.97);
  const c=Math.max(0,Math.round(D.c*(1-(rep-50)/250+late)*(sb?.8:1)/10)*10); return {q,c,pv,sb}; }
/* 예약: 성공하면 비용을 내고 자리를 잡는다. 이미 잡은 자리를 바꾸면 위약금 30%를 뺀 나머지를 돌려받는다 */
function sprcBook(lvl,k){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; if(!sprcOpen())return '캠프 장소는 11월부터 1월 24일까지 정합니다.'; lvl=+lvl; const D=(lvl===1?SPRC1:SPRC2)[k]; if(!D)return '없는 장소입니다.';
  const P=sprcPlan(G.user), key=lvl===1?'s1':'s2'; if(P[key]===k)return ''; if(sprcTaken(lvl,k)>=D.sl&&!sisSite(G.user,lvl,k))return `${D.l}은(는) 이미 다른 구단으로 꽉 찼습니다.`; /* 자매구단이 자리를 마련해 준다 */
  const f=P.fail[lvl+k]; if(f!=null&&G.day-f<7)return `${D.l} 측과 협상이 결렬된 지 얼마 안 됐습니다. ${7-(G.day-f)}일 뒤 다시 시도할 수 있습니다.`;
  const o=sprcOdds(G.user,lvl,k); if(R()>=o.q){ P.fail[lvl+k]=G.day; return `${D.l} 예약 협상이 결렬됐습니다. 현지 측이 다른 구단과 먼저 이야기 중이라고 합니다. 7일 뒤 다시 시도하거나 다른 곳을 잡으세요.`; }
  const old=P[key]&&P['c'+lvl]||0; const back=Math.round(old*.7); G.spend.etc=Math.max(0,(G.spend.etc||0)-back)+o.c; P[key]=k; P['c'+lvl]=o.c; P.c=(P.c1||0)+(P.c2||0);
  addLog(`스프링캠프 ${lvl}차 장소: ${D.l} 예약(추가 비용 ${money(o.c)}${old?`, 이전 예약 위약금 ${money(old-back)}`:''}).`); return ''; }
function sprcSetInt(k){ if(!SPRC_INT[k])return '없는 강도입니다.'; if(!(sprcOpen()||(G.cal&&G.day<G.cal.camp)))return '훈련 강도는 캠프 시작 전에 정합니다.'; sprcPlan(G.user).int=k; return ''; }
function sprcSetPg(n,lv){ if(!(G.cal&&G.day<G.cal.camp))return '연습경기는 캠프 시작 전에 잡습니다.'; const P=sprcPlan(G.user); if(n!=null&&n!==''&&SPRC_PGN.includes(+n))P.pgN=+n; if(lv&&SPRC_LV[lv])P.pgLv=lv; return ''; }
/* 다른 구단 예약: 11월엔 드문드문, 12월엔 많이, 1월이면 거의 다 끝난다 */
function sprcAiPick(t,lvl){ const T=lvl===1?SPRC1:SPRC2; const S=sprcInit(); const pv=S.prev[t.id]; const rich=(t.cash||0)>3000, poor=(t.cash||0)<0;
  let best=null, bs=-9; for(const k in T){ const D=T[k]; if(sprcTaken(lvl,k)>=D.sl)continue; const s=D.ap+hn('sprc'+lvl+k,t.id)*.15+N(0,.08)+(pv&&pv[lvl===1?'s1':'s2']===k?.35:0)+(sisSite(t.id,lvl,k)?.3:0)-(D.c>=500?(rich?-.05:poor?.5:.15):0); if(s>bs){ bs=s; best=k; } } return best; }
function sprcAiBook(force){ const m=dobj(G.day).m; const pr=force?1:m===11?.03:m===12?.07:.22;
  for(const t of G.teams){ if(t.id===G.user&&!G.unemp)continue; const P=sprcPlan(t.id); if(P.s1&&P.s2)continue; if(R()>=pr)continue;
    if(!P.s1){ const k=sprcAiPick(t,1); if(k){ P.s1=k; t.cash-=SPRC1[k].c; } } if(!P.s2){ const k=sprcAiPick(t,2); if(k){ P.s2=k; t.cash-=SPRC2[k].c; } } P.int=sprcMgrPref(G.mgr[t.id]); P.pgN=SPRC2[P.s2]&&SPRC2[P.s2].pg>=3?8:4; } }
/* 우리 구단이 끝까지 안 정하면 운영팀이 남은 곳 중 싼 곳으로 잡는다 */
function sprcAutoUser(){ if(G.unemp)return; const P=sprcPlan(G.user); const L=[]; for(const lvl of [1,2]){ const key=lvl===1?'s1':'s2'; if(P[key])continue; const T=lvl===1?SPRC1:SPRC2; const k=Object.keys(T).filter(x=>sprcTaken(lvl,x)<T[x].sl).sort((a,b)=>T[a].c-T[b].c||T[b].fq-T[a].fq)[0]; if(!k)continue; P[key]=k; const c=sprcOdds(G.user,lvl,k).c; P['c'+lvl]=c; G.spend.etc=(G.spend.etc||0)+c; L.push(`${lvl}차 ${T[k].l}`); }
  if(L.length)mail('운영팀','스프링캠프 장소를 운영팀이 정했습니다',`캠프 출국 전까지 장소가 정해지지 않아 남은 곳 중 비용이 적은 곳으로 잡았습니다: ${L.join(', ')}.\n\n좋은 장소는 다른 구단이 먼저 채웁니다. 다음 해에는 11~12월에 미리 예약하세요.`,{kind:'캠프',acts:[{l:'캠프 계획',a:'goWork',v:'스프링캠프'}]}); }
/* 캠프 효과 배수(79_camps.js campGrow가 스프링캠프 성장에 곱한다). 계획이 없는 옛 저장은 1 */
function sprcGrowMul(tid){ const S=G.scp; const P=S&&S.y===G.year&&S.t[tid]; if(!P||!P.eff)return 1; return P.eff; }
/* 연습경기 일정: 1차 장소 2월 8~18일, 2차 장소 2월 21일~3월 4일. 잡을 수 있는 수는 장소에 따라 다르고, 경기마다 성사 여부를 굴린다 */
function sprcPgCap(P){ const a=SPRC1[P.s1], b=SPRC2[P.s2]; return (a?a.pg:0)+(b?b.pg*2:0); }
function sprcSchedule(tid){ const P=sprcPlan(tid); const a=SPRC1[P.s1], b=SPRC2[P.s2]; const want=Math.min(P.pgN||0,sprcPgCap(P)); const n2=Math.min(want,b?b.pg*2:0), n1=Math.min(want-n2,a?a.pg:0);
  const rep=tid===G.user?(G.rep??50):50; const rel=avg(G.teams.filter(t=>t.id!==tid).map(t=>t.rel??50)); const q=clamp(.62+(rep-50)/120+(rel-50)/200+(sisSite(tid,1,P.s1)||sisSite(tid,2,P.s2)?.1:0),.35,.95); /* 자매구단이 연습경기를 주선 */
  const mates=lvl=>G.teams.filter(t=>t.id!==tid&&(G.scp.t[t.id]||{})[lvl===1?'s1':'s2']===(lvl===1?P.s1:P.s2)).map(t=>t.id);
  const oppOf=(lvl,D)=>{ const M=mates(lvl); const r=R(); if(D.opp==='npb'){ const lv=P.pgLv; if(M.length&&r<(lv==='hard'?.2:lv==='mix'?.35:.45))return {k:'kbo',tid:pick(M)}; return {k:R()<(lv==='hard'?.8:lv==='mix'?.5:.15)?'npb1':'npb2'}; } if(M.length&&r<.35)return {k:'kbo',tid:pick(M)}; return D.opp?{k:D.opp}:null; };
  const days=(d0,d1,n)=>{ const L=[]; for(let d=d0;d<=d1;d++)L.push(d); shuffle(L); return L.slice(0,n).sort((x,y)=>x-y); };
  const out=[]; let miss=0;
  for(const [lvl,D,n,d0,d1] of [[1,a,n1,KD(2,8),KD(2,18)],[2,b,n2,KD(2,21),KD(3,4)]]){ if(!D||!n)continue; for(const d of days(d0,d1,n)){ if(R()>=q){ miss++; continue; } const o=oppOf(lvl,D); if(o&&o.k!=='kbo'){ const cid=sisOppClub(tid,lvl,lvl===1?P.s1:P.s2); if(cid)o.cid=cid; } if(o)out.push(Object.assign({d},o)); else miss++; } }
  P.pg=out; P.pgMiss=miss; P.pgR=[]; return out; }
/* 가벼운 경기 모형: 선발 9명 3타석 + 교체 3명 2타석, 선발 투수가 정한 아웃만큼 던지고 나머지는 계투(젊은 투수 포함)가 한 이닝씩.
   득점 = 우리 타자 득점 추정과 상대 투수 자책을 반씩. 연장 없음(비기면 무승부). 기록은 정규 기록(hist)에 남지 않는다 */
function lightSide(tid,b,spOuts,rotKey,store){ const d=depth(tid); const ok=p=>p&&healthy(p)&&!isAway(p)&&!(p.joinY>G.year); const st=d.start.filter(ok).slice(0,9); const subs=d.bench.concat(d.futB||[]).filter(ok).sort((x,y)=>x.age-y.age).slice(0,3);
  const sps=d.sp.filter(ok); const R0=G.exhRot=G.exhRot||{}; const ri0=(R0[rotKey+tid]||0); R0[rotKey+tid]=ri0+1; const sp=sps.length?sps[ri0%sps.length]:null;
  const pen=d.pen.concat(d.futP||[]).filter(p=>ok(p)&&p!==sp); shuffle(pen); let r=0, er=0; const L=store||{};
  const addB=(p,pa)=>{ const o=simBat(p,pa,b); r+=o.r; const a=L[p.id]||(L[p.id]=[0,0,0,0,0,0,0,0]); a[0]++; a[1]+=o.pa; a[2]+=o.ab; a[3]+=o.h; a[4]+=o.hr; a[5]+=o.bb; a[6]+=o.so; a[7]+=o.h+o.d+2*o.tr+3*o.hr; /* 루타 */ };
  for(const p of st)addB(p,3); for(const p of subs)addB(p,2);
  let outs=27; const addP=(p,n)=>{ const o=simPit(p,n,b); /* b<0: 상대가 강하면 우리 투수도 더 맞는다 */ er+=o.er; outs-=o.outs; const a=L[p.id]||(L[p.id]=[0,0,0,0,0,0]); a[0]++; a[1]+=o.outs; a[2]+=o.h; a[3]+=o.er; a[4]+=o.bb; a[5]+=o.so; };
  if(sp)addP(sp,spOuts); for(const p of pen){ if(outs<=0)break; addP(p,Math.min(3,outs)); } return {r,er}; }
const lightRuns=(own,opp)=>Math.max(0,Math.round(own.r*.5+opp.er*.5+(R()<.25?1:0)));
/* 하루 진행에서 부른다(07_daily.js) */
function sprcDaily(day){ const c=G.cal; if(!c)return;
  if(sprcOpen()){ sprcInit(); try{ sprcAiBook(false); }catch(e){} const o=dobj(day);
    if(!G.unemp&&o.m===1&&o.d===10){ const P=sprcPlan(G.user); if(!P.s1||!P.s2)stop('캠프',`스프링캠프 장소가 아직 ${!P.s1&&!P.s2?'정해지지 않았습니다':!P.s1?'1차가 비어 있습니다':'2차가 비어 있습니다'}. 1월 24일까지 정하지 않으면 운영팀이 남은 곳 중 싼 곳으로 잡습니다. 훈련 강도와 연습경기도 감독과 함께 정해 두세요.`); }
    if(day===c.camp-1){ sprcAiBook(true); sprcAutoUser(); } }
  if(day===c.camp)try{ sprcCampStart(); }catch(e){ console.error(e); }
  if(day>c.camp&&day<c.campEnd)try{ sprcCampDay(day); }catch(e){ console.error(e); }
  if(day===c.campEnd)try{ sprcCampEnd(); }catch(e){ console.error(e); }
  if(day>=c.campEnd&&day<=c.exh&&!(G.exh&&G.exh.y===G.year))exhBuild();
  if(day===c.open-1)try{ sprcOpenCond(); }catch(e){ console.error(e); }
  if(G.exh&&G.exh.y===G.year&&G.exh.days[day])try{ exhDay(day); }catch(e){ console.error(e); }
  if(G.exh&&G.exh.y===G.year&&!G.exh.done&&day===G.exh.last)try{ exhEnd(); }catch(e){ console.error(e); } }
function sprcCampStart(){ sprcInit(); for(const t of G.teams){ const P=sprcPlan(t.id); if(!P.s1)P.s1='tw'; if(!P.s2)P.s2='home'; const a=SPRC1[P.s1], b=SPRC2[P.s2]||SPRC2.home;
    P.wx1=clamp(a.wx+N(0,a.wv),.8,1.15); P.wx2=clamp(b.wx+N(0,b.wv),.75,1.12); const m=G.mgr[t.id]; const pref=sprcMgrPref(m); const gap=Math.abs(SPRC_INTK.indexOf(P.int)-SPRC_INTK.indexOf(pref)); P.pref=pref; P.gap=gap;
    P.eff=Math.round((P.wx1*a.fq*.65+P.wx2*b.fq*.35)*SPRC_INT[P.int].g*(gap?.93:1)*1000)/1000; sprcSchedule(t.id);
    if(t.id===G.user&&!G.unemp&&m&&!m.interim){ m.rel=clamp((m.rel??50)+(gap?-3*gap:1),0,100);
      const wx=P.wx1<a.wx-.04?` 1차 ${a.l}은(는) 올해 날씨가 좋지 않다고 합니다.`:P.wx1>a.wx+.04?` 1차 ${a.l} 날씨가 아주 좋습니다.`:'';
      mail(`${m.name} 감독`,gap?`캠프 강도, 제 생각과는 다릅니다`:'캠프 출발합니다',gap?`단장님이 정한 ${SPRC_INT[P.int].l}로 갑니다. 다만 저는 ${SPRC_INT[pref].l}이(가) 맞다고 봤습니다. 선수들 앞에서는 티 내지 않겠지만, 제 방식이 아니라 코치진도 손에 덜 익을 겁니다(감독 관계 -${3*gap}, 캠프 효과 조금 감소).${wx}`:`말씀 나눈 대로 ${SPRC_INT[P.int].l}로 갑니다. 1차 ${a.l}, 2차 ${b.l}. 연습경기는 ${P.pg.length}경기 잡혔습니다${P.pgMiss?`(원한 ${P.pg.length+P.pgMiss}경기 중 ${P.pgMiss}경기는 상대를 못 구함)`:''}.${wx} (감독 관계 +1)`,{kind:'감독',acts:[{l:'캠프 계획',a:'goWork',v:'스프링캠프'}]}); } }
  const L={}; for(const t of G.teams){ const P=G.scp.t[t.id]; (L[P.s1]=L[P.s1]||[]).push(tshort(t.id)); }
  try{ sisCampStart(); }catch(e){ console.error(e); }
  news('리그',`${G.year} 스프링캠프 출국`,Object.entries(L).map(([k,v])=>`${SPRC1[k].l}: ${v.join(', ')}`).join('\n'),0); }
/* 캠프 기간: 강도·이동 부담에 따른 캠프 부상(캠프 동안 고르게) · 우리 연습경기 */
function sprcCampDay(day){ const c=G.cal; const len=Math.max(20,c.campEnd-c.camp);
  for(const t of G.teams){ const P=G.scp&&G.scp.t[t.id]; if(!P||!P.int)continue; const rate=(SPRC_INT[P.int].inj+((SPRC1[P.s1]||{}).tr||0)*.002)/len;
    for(const p of campWho(t.id,'spring'))if(healthy(p)&&!isAway(p)&&R()<rate*(p.inj||.15)/.15)try{ injure(p,day,{}); }catch(e){} }
  const P=!G.unemp&&G.scp&&G.scp.t[G.user]; const g=P&&(P.pg||[]).find(x=>x.d===day); if(!g)return;
  const S=G.scp.pgS; const me=lightSide(G.user,g.k==='kbo'?0:SPRC_OPP[g.k].b,6,'pg',S); let them;
  if(g.k==='kbo')them=lightSide(g.tid,0,6,'pg',null); else { const b=SPRC_OPP[g.k].b; them={r:Math.max(0,4.4-b*.35+N(0,1.6)),er:Math.max(0,4.4-b*.35+N(0,1.6))}; }
  const us=lightRuns(me,them), op=lightRuns(them,me); const nm=sprcOppName(g); P.pgR.push({d:day,o:nm,us,op});
  addLog(`연습경기 ${nm}전 ${us}:${op} ${us>op?'승':us<op?'패':'무'}`); }
/* 캠프 끝: 개막 컨디션(강도·이동·실전 수) 반영, 감독의 캠프 총평 */
function sprcCampEnd(){ const S=G.scp; if(!S||S.y!==G.year)return;
  for(const t of G.teams){ const P=S.t[t.id]; if(!P||!P.int)continue; const nPg=t.id===G.user?(P.pgR||[]).length:(P.pg||[]).length; const cond=SPRC_INT[P.int].cond-((SPRC1[P.s1]||{}).tr||0)*.12-((SPRC2[P.s2]||{}).tr||0)*.06+Math.min(8,nPg)*.04;
    P.cond=Math.round(cond*100)/100; }
  const P=S.t[G.user], m=G.mgr[G.user]; if(G.unemp||!P||!m||m.interim)return; const R0=P.pgR||[]; const w=R0.filter(x=>x.us>x.op).length, l=R0.filter(x=>x.us<x.op).length;
  const top=exhLeaders(S.pgS,G.user,8,9); const cd=P.cond>=.2?'몸이 일찍 올라왔습니다. 개막 초반 컨디션이 좋을 겁니다.':P.cond<=-.3?'훈련량이 많았고 이동도 길어 선수들 몸이 무겁습니다. 4월 초반엔 감이 늦게 올라올 수 있습니다.':'개막에 맞춰 몸 상태는 무난합니다.';
  mail(`${m.name} 감독`,`캠프 총평: 연습경기 ${w}승 ${l}패${R0.length-w-l?` ${R0.length-w-l}무`:''}`,`${SPRC1[P.s1].l} · ${SPRC2[P.s2].l} 캠프를 마쳤습니다. 훈련 강도 ${SPRC_INT[P.int].l}.\n${cd}\n\n${R0.length?`연습경기\n${R0.map(x=>`${dmd(x.d)} ${x.o} ${x.us}:${x.op}`).join('\n')}\n\n`:'연습경기는 없었습니다.\n\n'}${top.b.length?`방망이가 좋았던 선수: ${top.b.map(x=>`${x.p.name}(${x.t})`).join(', ')}\n`:''}${top.p.length?`공이 좋았던 투수: ${top.p.map(x=>`${x.p.name}(${x.t})`).join(', ')}`:''}`,{kind:'감독',acts:[{l:'캠프·시범경기',a:'goWork',v:'스프링캠프'}]}); }
/* 개막 전날: 캠프에서 만든 몸 상태를 개막 컨디션(주간 기세 sf.m)에 싣는다. 몇 주 지나면 원래대로 돌아온다 */
function sprcOpenCond(){ const S=G.scp; if(!S||S.y!==G.year||S.condY===G.year)return; S.condY=G.year; for(const t of G.teams){ const P=S.t[t.id]; if(!P||P.cond==null)continue; for(const p of playersOf(t.id))if(p.sf&&p.sf.y===G.year)p.sf.m=clamp((p.sf.m||0)+P.cond+N(0,.2),-2.5,2.5); } }
/* 기록 정리: 타자 [경기,타석,타수,안타,홈런,볼넷,삼진,루타], 투수 [경기,아웃,피안타,자책,볼넷,삼진] */
const exhOps=a=>{ const obp=(a[3]+a[5])/Math.max(1,a[2]+a[5]); return obp+a[7]/Math.max(1,a[2]); };
const exhEra=a=>a[1]?a[3]*27/a[1]:99;
const exhAvg=a=>a[2]?a[3]/a[2]:0;
const exhF3=v=>v.toFixed(3).replace(/^0/,'');
function exhLeaders(st,tid,minPa,minOuts){ const rows=Object.entries(st||{}).map(([id,a])=>({p:G.players[id],a})).filter(x=>x.p&&x.p.team===tid);
  const b=rows.filter(x=>!x.p.isP&&x.a.length===8&&x.a[1]>=minPa).sort((x,y)=>exhOps(y.a)-exhOps(x.a)), p=rows.filter(x=>x.p.isP&&x.a.length===6&&x.a[1]>=minOuts).sort((x,y)=>exhEra(x.a)-exhEra(y.a));
  const tb=x=>`타율 ${exhF3(exhAvg(x.a))} ${x.a[4]}홈런 OPS ${exhF3(exhOps(x.a))}`, tp=x=>`${Math.floor(x.a[1]/3)}${x.a[1]%3?'.'+x.a[1]%3:''}이닝 평균자책 ${exhEra(x.a).toFixed(2)} 삼진 ${x.a[5]}`;
  return {b:b.slice(0,3).map(x=>({p:x.p,t:tb(x),a:x.a})),p:p.slice(0,3).map(x=>({p:x.p,t:tp(x),a:x.a})),bw:b.slice(-3).reverse().map(x=>({p:x.p,t:tb(x),a:x.a})),pw:p.slice(-3).reverse().map(x=>({p:x.p,t:tp(x),a:x.a}))}; }
/* 시범경기 일정: 3월 12일부터 월요일 쉬고, 개막 사흘 전까지 최대 12일. 같은 상대와 2연전(같은 구장) 6번 = 팀당 12경기 */
function exhBuild(){ const c=G.cal; const days=[]; for(let d=c.exh;d<=c.open-3&&days.length<12;d++)if(dobj(d).w!==1)days.push(d);
  const T=G.teams.length, ids=G.teams.map(t=>t.id); let arr=[...ids.keys()]; const rounds=[]; for(let r=0;r<T-1;r++){ const pr=[]; for(let i=0;i<T/2;i++)pr.push([ids[arr[i]],ids[arr[T-1-i]]]); rounds.push(pr); arr=[arr[0],arr[T-1],...arr.slice(1,T-1)]; }
  shuffle(rounds); const sched={}; days.forEach((d,i)=>{ const pr=rounds[Math.floor(i/2)%rounds.length]; sched[d]=pr.map(([a,b])=>R()<.5?[a,b]:[b,a]); }); for(let i=1;i<days.length;i+=2)sched[days[i]]=sched[days[i-1]].map(x=>x.slice()); /* 2연전은 같은 구장 */
  G.exh={y:G.year,days:sched,last:days[days.length-1],rec:Object.fromEntries(ids.map(id=>[id,[0,0,0]])),ps:{},res:[],done:false}; G.exhRot={}; }
function exhDay(day){ const E=G.exh; const gi=Object.keys(E.days).map(Number).sort((a,b)=>a-b).indexOf(day); const spOuts=Math.min(15,9+gi); /* 시범경기 선발은 3이닝에서 5이닝까지 늘린다 */
  for(const [h,a] of E.days[day]){ const H=lightSide(h,0,spOuts,'ex',E.ps), A=lightSide(a,0,spOuts,'ex',E.ps); const hs=lightRuns(H,A), as=lightRuns(A,H); E.res.push({d:day,h,a,hs,as});
    const k=hs>as?[0,1]:hs<as?[1,0]:[2,2]; E.rec[h][k[0]]++; E.rec[a][k[1]]++;
    if(!G.unemp&&(h===G.user||a===G.user)){ const me=h===G.user, us=me?hs:as, op=me?as:hs; addLog(`시범경기 ${tshort(me?a:h)}전 ${us}:${op} ${us>op?'승':us<op?'패':'무'}`); } }
  if(gi===0&&!G.unemp)note('일정',`시범경기가 시작됩니다. 팀당 ${Object.keys(E.days).length}경기, 연장·더블헤더 없이 치르고 순위에는 들어가지 않습니다. 개막(${dmd(G.cal.open)})까지 선수 상태를 점검하세요.`); }
const exhPct=r=>(r[0]+r[1])?r[0]/(r[0]+r[1]):.5;
function exhStand(){ const E=G.exh; return E?Object.entries(E.rec).map(([id,r])=>({tid:+id,r})).sort((x,y)=>exhPct(y.r)-exhPct(x.r)||y.r[0]-x.r[0]):[]; }
/* 시범경기 끝: 감독이 기록을 보고 개막 엔트리·타순을 건의, 리그·팬 반응 */
function exhEnd(){ const E=G.exh; E.done=true; const st=exhStand(); const top=st[0];
  news('리그',`${G.year} 시범경기 마감, 1위 ${tshort(top.tid)}`,`${tname(top.tid)}이(가) ${top.r[0]}승 ${top.r[1]}패${top.r[2]?` ${top.r[2]}무`:''}로 시범경기 1위에 올랐습니다. 시범경기 순위는 정규시즌과 무관합니다.`,0,{tid:top.tid});
  if(G.unemp)return; const rk=st.findIndex(x=>x.tid===G.user)+1, my=E.rec[G.user]; const L=exhLeaders(E.ps,G.user,12,12);
  news('팬',rk<=3?`시범경기 ${rk}위, "올해는 다르다?"`:rk>=8?`시범경기 ${rk}위에 팬들 한숨`:`시범경기 ${rk}위, 팬들 "본게임은 지금부터"`,rk<=3?`"시범경기 성적은 의미 없다지만 그래도 기분은 좋다." ${L.b[0]?`${L.b[0].p.name} 타격감에 기대가 크다는 글이 많습니다.`:''}`:rk>=8?`"시범경기니까 괜찮다"는 글과 "이대로면 큰일"이라는 글이 엇갈립니다.${L.bw[0]?` ${L.bw[0].p.name} 부진을 걱정하는 글이 많습니다.`:''}`:'성적보다 주전 경쟁 결과에 관심이 쏠립니다.',rk<=3?1:rk>=8?-1:0);
  const m=G.mgr[G.user]; if(!m||m.interim)return; const d=depth(G.user); const reg=new Set([...d.start,...d.sp].map(p=>p.id));
  const up=L.b.filter(x=>!reg.has(x.p.id)).concat(L.p.filter(x=>!reg.has(x.p.id))).slice(0,2), dn=L.bw.filter(x=>reg.has(x.p.id)).concat(L.pw.filter(x=>reg.has(x.p.id))).slice(0,2);
  const tone=m.disc>=62?'결과로 말하는 겁니다.':m.disc<=38?'시범경기는 시범경기입니다. 너무 신경 쓰지 않으려 합니다.':'숫자만 보지는 않겠지만 참고는 하겠습니다.';
  const sug=[...up.map(x=>`${x.p.name}(${posLabel(x.p)}): ${x.t}. 개막 엔트리에 넣고 ${x.p.isP?'초반 계투로 써 보고 싶습니다':'선발 출전 기회를 주고 싶습니다'}.`),...dn.map(x=>`${x.p.name}(${posLabel(x.p)}): ${x.t}. ${x.p.isP?'감이 안 올라와 첫 턴은 뒤로 미루겠습니다':'감이 늦게 올라와 개막 초반엔 하위 타순에 두겠습니다'}.`)];
  mail(`${m.name} 감독`,`시범경기 ${my[0]}승 ${my[1]}패${my[2]?` ${my[2]}무`:''}(${rk}위) — 개막 엔트리 건의`,`시범경기를 마쳤습니다. ${tone}\n\n${L.b.length?`잘 친 선수: ${L.b.map(x=>`${x.p.name}(${x.t})`).join(', ')}\n`:''}${L.p.length?`잘 던진 투수: ${L.p.map(x=>`${x.p.name}(${x.t})`).join(', ')}\n`:''}${L.bw.length?`안 맞은 선수: ${L.bw.map(x=>`${x.p.name}(${x.t})`).join(', ')}\n`:''}\n${sug.length?`개막 엔트리·타순 건의\n${sug.join('\n')}`:'개막 엔트리는 지금 구상대로 가겠습니다.'}\n\n개막 엔트리는 ${dmd(G.cal.open-1)}에 정해집니다.`,{kind:'감독',acts:[{l:'선수단 보기',a:'go',v:'roster:glance'},{l:'시범경기 기록',a:'goWork',v:'스프링캠프'}]}); }

/* ===== 특수 아카데미 제휴(육성 인프라) =====
 실제: 한 구단은 2024년 말 투수 5명을, 2024년 6월 4명을 미국 사설 투구 아카데미에 구단 비용으로 보냈다(코치·데이터팀·트레이너 동행).
 게임: 해외 연수 프로그램(31_dev_medical.js OVS)에 보낼 수 있는 인원과 성과를 제휴 단계가 올린다. 한 번 투자하는 구단 시설 투자다 */
const ACAD=[{l:'제휴 없음',c:0,d:'프로그램마다 정해진 인원만 보냅니다.'},{l:'연구소 단기 제휴',c:300,d:'프로그램마다 1명 더 보내고, 현지 측정 자료를 받아 크게 늘 가능성이 조금 오릅니다.'},{l:'아카데미 연간 제휴',c:700,d:'프로그램마다 2명 더, 우리 코치가 현지 과정을 함께 받아 부상 위험이 줄어듭니다.'},{l:'R&D 공동 연구 협약',c:1200,d:'프로그램마다 3명 더, 선수별 맞춤 과정을 짜 성과가 가장 좋습니다.'}];
const acadLv=()=>Math.min(3,(G.acad&&G.acad.lv)||0);
const ovsLim=o=>o.lim+acadLv();
function acadUp(){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; const lv=acadLv(); if(lv>=3)return '이미 최고 단계입니다.'; const n=ACAD[lv+1], t=team(G.user); if(spendable(G.user)<n.c)return `쓸 수 있는 돈이 부족합니다(${money(n.c)} 필요, ${spendTxt()}).`;
  const k0=spendPay(n.c); G.spend.facB=(G.spend.facB||0)+k0; facInit(); G.fac.inv=(G.fac.inv||0)+n.c; (G.fac.hist=G.fac.hist||[]).push({d:G.day,k:'acad',lv:lv+1,c:n.c,src:'cash',...(k0<n.c?{sup:n.c-k0}:{})}); G.acad={lv:lv+1,d:G.day}; addLog(`특수 아카데미 제휴: ${n.l}(${money(n.c)}).`); return ''; }
