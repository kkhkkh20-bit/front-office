/* ===== 관중석 증설(증축) =====
   사용자 11-15: "경기장 증축은 안 되나요? 수용 인원 늘려서 티켓값 좀 더 받고 싶은데."
   실제 KBO 구장은 시 소유라 좌석을 늘리려면 시와 합의해야 하고, 공사는 주로 비시즌에 한다. 게임에서는
   1) 명분: 지난 시즌(또는 올해 홈 36경기 이상) 좌석 점유율 85% 이상이거나 매진이 홈경기의 30% 이상이어야 시가 검토한다
   2) 시 협의 45일: 지역 관계·구단주 신뢰·연고 시장·점유율로 성사 가능성이 정해진다. 결렬되면 180일 뒤 다시
   3) 합의하면 다음 공사 기간(10월~2월) 안에 착공: 공사비의 40%는 시, 60%는 구단(보유 현금, 모기업 구단은 구단주 지원 여유)
   4) 시 인허가(지역 관계 따라 30~120일) 뒤 공사. 공사가 시즌과 겹치면 그 구역 좌석을 막는다
   5) 완공: 수용 인원이 늘고 유지비가 붙는다. 관중 수요는 원래 좌석 기준이라 늘린 자리는 원래 구장이 넘칠 때만 찬다(37_stadium attOf)
   한도: 구장당 두 번, 일반 구장 2만5천 석·돔 1만9천 석(지붕 구조)까지. 개장 3년 안 된 구장은 설계대로 쓴다. 신구장을 지으면 새로 센다.
   AI 구단도 같은 함수·같은 조건으로 추진한다(stadXpAI). 비용·좌석 수는 게임 설정 근사치(실측 근거 없음) */
const STADX=[
  {k:'of',l:'외야 관중석 증설',seats:1500,c:7000,days:110,close:800,up:60,d:'외야 뒤편에 좌석을 놓습니다. 공사가 짧아 비시즌 안에 끝나기 쉽습니다.'},
  {k:'up',l:'내야 상단 증설',seats:3000,c:15000,days:220,close:2000,up:130,d:'내야 위에 상단 관중석을 올립니다. 공사가 길어 시즌 초반과 겹치기 쉽습니다.'}];
const STADX_K=Object.fromEntries(STADX.map(x=>[x.k,x]));
const STADX_RULE={max:25000,domeMax:19000,n:2,occ:.85,so:.3,city:.4,talk:45,retry:180,trust:40,minAge:3};
function stadXpSeats(S,d){ let x=S.xp||0; const q=S.xq, X=q&&STADX_K[q.k]; if(X&&q.stage==='build'){ if(d>=q.done)x+=X.seats; else if(d>=q.pm)x-=X.close; } return x; } /* 완공일부터 늘고, 인허가가 끝나 공사하는 동안은 그 구역을 막는다 */
function stadXpReset(S){ S.xp=0; S.xpN=0; S.xpUp=0; S.xq=null; delete S.xpRetry; delete S.xd; } /* 신구장 개장: 옛 구장 증설 기록은 이력에만 */
function stadXpRaw(tid){ const S=stadOf(tid); return (S.cap||STAD_CAP[tid])+(S.xp||0); }
function stadXpMax(tid){ return stadOf(tid).dome?STADX_RULE.domeMax:STADX_RULE.max; }
function stadXpCost(k){ const X=STADX_K[k]; const c=Math.round(X.c*ecoIdx()/10)*10, club=Math.round(c*(1-STADX_RULE.city)/10)*10; return {c,club,city:c-club}; }
/* 증설 명분: 끝난 시즌 기록(S.xd) 또는 올해 홈 36경기 이상 치른 기록 */
function stadXpDem(tid){ const S=stadOf(tid), A=G.sea&&G.sea.att&&G.sea.att[tid]; if(A&&A.n>=36&&A.cap)return {y:G.year,occ:A.sum/A.cap,so:A.so||0,n:A.n,cur:true}; return S.xd||null; }
function stadXpDemOk(D){ return !!D&&(D.occ>=STADX_RULE.occ||D.so/Math.max(1,D.n)>=STADX_RULE.so); }
/* 시즌이 끝나면 모든 구단 관중 기록을 구장에 남긴다(새해에 시즌 기록이 지워져도 비시즌 내내 명분으로 쓴다) */
function stadXpRec(){ const c=G.cal; if(!c||!G.sea||!G.sea.att||G.day<=c.end)return; for(const t of G.teams){ const A=G.sea.att[t.id], S=t.stad; if(!S||!A||!A.n||A.n<20||!A.cap)continue; if(S.xd&&S.xd.y>=G.year)continue; S.xd={y:G.year,occ:Math.round(A.sum/A.cap*1000)/1000,so:A.so||0,n:A.n}; } }
/* 추진할 수 없는 이유(빈 문자열이면 가능). 사람·AI 같은 조건 */
function stadXpWhy(tid,k){ const X=STADX_K[k]; if(!X)return '없는 공사입니다.'; const S=stadOf(tid), t=team(tid);
  if(S.proj)return '신구장 사업 중에는 옛 구장을 늘리지 않습니다.'; if(S.xq)return S.xq.stage==='build'?'증설 공사가 진행 중입니다.':'이미 시와 증설을 협의하고 있습니다.';
  if((S.xpN||0)>=STADX_RULE.n)return `이 구장은 증설을 ${STADX_RULE.n}번 마쳐 더 늘릴 수 없습니다(구조 안전 한도).`;
  if((G.year-stadBuilt(tid))<STADX_RULE.minAge)return '개장 3년이 안 된 구장은 설계대로 씁니다.';
  const raw=stadXpRaw(tid), mx=stadXpMax(tid); if(raw+X.seats>mx)return `${S.dome?'돔 지붕 구조상 ':''}이 구장은 ${mx.toLocaleString('ko-KR')}석까지만 늘릴 수 있습니다(지금 ${raw.toLocaleString('ko-KR')}석).`;
  if(S.xpRetry>G.day)return `시와 다시 협의하려면 ${dmd(S.xpRetry)}까지 기다려야 합니다.`;
  const D=stadXpDem(tid); if(!D)return '증설 명분이 될 관중 기록이 아직 없습니다(홈 36경기 이상 또는 지난 시즌 기록).';
  if(!stadXpDemOk(D))return `좌석 점유율 ${Math.round(D.occ*100)}%, 매진 ${D.so}회로는 시가 증설을 검토하지 않습니다. 점유율 85% 이상이거나 매진이 잦아야 합니다.`;
  if(t.trust<STADX_RULE.trust)return `구단주 신뢰(${t.trust})가 ${STADX_RULE.trust} 이상이어야 구단주가 증설을 허락합니다.`;
  const cc=stadXpCost(k).club; if(spendable(tid)<cc)return `구단 부담분 ${money(cc)}을(를) 낼 여력이 없어 구단주가 미룹니다(쓸 수 있는 돈 ${money(Math.max(0,spendable(tid)))}).`;
  return ''; }
function stadXpOdds(tid){ const t=team(tid), D=stadXpDem(tid)||{occ:.8,so:0,n:1}; return clamp(.3+(cityRel(tid)-50)/100+((t.trust??50)-50)/150+((t.market||1)-1)*.4+(D.occ-STADX_RULE.occ)*2+Math.min(.5,D.so/Math.max(1,D.n))*.3,.1,.85); }
/* 1) 시에 협의 제안 */
function stadXpTalk(tid,k){ const e=stadXpWhy(tid,k); if(e)return e; const S=stadOf(tid), X=STADX_K[k], t=team(tid), me=tid===ME();
  S.xq={k,stage:'talk',st:G.day,res:G.day+STADX_RULE.talk,p:stadXpOdds(tid)};
  if(me){ addLog(`${t.city}시와 ${stadName(tid)} ${X.l}(+${X.seats.toLocaleString('ko-KR')}석) 협의를 시작했습니다. 결과는 ${dmd(S.xq.res)}쯤 나옵니다.`); news('구단',`${t.city} ${t.nick}, 관중석 증설 추진`,`표가 모자란 ${stadName(tid)}. 구단이 ${t.city}시에 ${X.l}을(를) 제안했습니다.`,1); }
  return ''; }
/* 합의가 유효한 마지막 날: 다음 공사 기간(10월~2월)의 끝 */
function stadXpExp(){ const o=dobj(G.day); return dnum(o.m>=3?G.year+1:G.year,3,1)-1; }
/* 2) 합의 뒤 착공: 구단 몫을 내고 인허가를 신청한다 */
function stadXpStart(tid){ const S=stadOf(tid), q=S.xq; if(!q||q.stage!=='ok')return '시와 합의한 증설이 없습니다.'; if(!stadWindow())return '증설 공사는 시즌이 끝난 뒤(10월~2월)에만 시작할 수 있습니다.'; if(S.proj)return '신구장 사업 중에는 옛 구장을 늘리지 않습니다.';
  const X=STADX_K[q.k], C=stadXpCost(q.k), t=team(tid), me=tid===ME(); if(spendable(tid)<C.club)return `구단 부담분 ${money(C.club)}이 필요합니다(${me?spendTxt():'쓸 수 있는 돈 '+money(Math.max(0,spendable(tid)))}).`;
  let sup=0; if(me){ const k0=spendPay(C.club); sup=C.club-k0; G.spend.stad=(G.spend.stad||0)+k0; } else t.cash-=C.club;
  q.stage='build'; q.c=C.club; q.total=C.c; q.sup=sup; q.ep=me?G.spEp:null; q.st=G.day; q.pm=G.day+facPermitDays(tid); q.done=q.pm+X.days;
  clubFacilityHistory('stad',tid,`${stadName(tid)} ${X.l}`,'착공',{c:C.c,src:`구단 ${money(C.club)} · 지자체 ${money(C.city)}`,done:q.done});
  if(me)addLog(`${stadName(tid)} ${X.l} 공사를 시작했습니다(구단 ${money(C.club)} · ${t.city}시 ${money(C.city)}). 시 인허가 뒤 ${dmd(q.pm)}쯤 첫 삽, ${dmd(q.done)} 완공 예정.`);
  return ''; }
/* 매일: 시즌 기록 보관, 협의 결과, 합의 만료, 완공(모든 구단) */
function stadXpDaily(){ if(!G||!G.teams)return; try{ stadXpRec(); }catch(e){} for(const t of G.teams){ const S=t.stad, q=S&&S.xq; if(!q)continue; const me=t.id===ME(), X=STADX_K[q.k]; if(!X){ S.xq=null; continue; }
    if(q.stage==='talk'&&G.day>=q.res){ if(R()<(q.p??stadXpOdds(t.id))){ q.stage='ok'; q.exp=stadXpExp(); cityRelAdd(t.id,1);
        if(me){ stop('구장',`${t.city}시가 ${X.l}에 합의했습니다. 공사비의 40%를 시가 냅니다. ${dmd(q.exp)}까지 구장 관리 → 구장 시설에서 착공하세요.`); news('구단',`${t.city}시-${t.nick}, 관중석 증설 합의`,`${stadName(t.id)}에 ${X.seats.toLocaleString('ko-KR')}석이 늘어납니다.`,2); } }
      else { S.xq=null; S.xpRetry=G.day+STADX_RULE.retry; if(me)stop('구장',`${t.city}시가 ${X.l}을(를) 올해 예산에 넣기 어렵다고 합니다. ${dmd(S.xpRetry)} 뒤 다시 협의할 수 있습니다. 지역 관계가 좋을수록 잘 됩니다.`); }
      continue; }
    if(q.stage==='ok'){ if(!me&&stadWindow())stadXpStart(t.id); if(S.xq&&S.xq.stage==='ok'&&G.day>q.exp){ S.xq=null; if(me)mail('운영팀','관중석 증설 합의 만료',`공사 기간 안에 착공하지 않아 ${X.l} 합의가 끝났습니다. 다시 하려면 시와 새로 협의해야 합니다.`,{kind:'구장'}); } continue; }
    if(q.stage==='build'&&G.day>=q.done){ S.xp=(S.xp||0)+X.seats; S.xpN=(S.xpN||0)+1; S.xpUp=(S.xpUp||0)+X.up; (S.xh=S.xh||[]).push({k:q.k,y:G.year,d:G.day,seats:X.seats,c:q.total??q.c}); S.xq=null;
      clubFacilityHistory('stad',t.id,`${stadName(t.id)} ${X.l}`,'완공',{c:q.total??q.c,cap:stadCap(t.id)});
      if(!me){ wire('구장',`${t.city} ${t.nick}, ${stadName(t.id)} ${X.seats.toLocaleString('ko-KR')}석 증설 완공`,{tid:t.id}); continue; }
      note('구장',`${X.l} 공사가 끝났습니다. 수용 인원 ${stadCap(t.id).toLocaleString('ko-KR')}석.`); news('구단',`${stadName(t.id)}, ${X.seats.toLocaleString('ko-KR')}석 늘었다`,`${X.l}이(가) 끝나 수용 인원이 ${stadCap(t.id).toLocaleString('ko-KR')}석이 됐습니다. 표 구하기가 조금 쉬워집니다.`,2); } } }
/* 예상 효과: 다음 시즌 전망(지금 가격·시설)으로 좌석만 늘려 본 차이. 관중·표값·매점 수입·유지비·회수 기간 */
function stadXpGain(tid,k){ const S=stadOf(tid), X=STADX_K[k]; const keep={xp:S.xp,xpUp:S.xpUp,xq:S.xq}; let a,b; try{ S.xq=null; a=stadProj(tid,true); S.xp=(S.xp||0)+X.seats; S.xpUp=(S.xpUp||0)+X.up; b=stadProj(tid,true); } finally{ S.xp=keep.xp; S.xpUp=keep.xpUp; S.xq=keep.xq; if(S.xp==null)delete S.xp; if(S.xpUp==null)delete S.xpUp; if(S.xq==null)delete S.xq; }
  const att=b.att-a.att, inc=(b.ticket+b.fnb)-(a.ticket+a.fnb), up=X.up, net=inc-up, C=stadXpCost(k); return {att,inc,up,net,club:C.club,pay:net>0?C.club/net:null}; }
/* AI 구단: 매진이 잦고 돈이 넉넉하면 같은 조건으로 시에 제안한다(비시즌 11월, stadAI에서) */
function stadXpAI(t){ const S=stadOf(t.id); if(S.xq||S.proj)return; const D=stadXpDem(t.id); if(!stadXpDemOk(D)||D.occ<.9&&D.so/Math.max(1,D.n)<.4)return; /* 사람보다 조금 보수적으로: 꽉 찬 구장만 */
  const k=['of','up'].find(x=>!stadXpWhy(t.id,x)&&spendable(t.id)>=stadXpCost(x).club*1.5); if(!k||R()>.6)return; stadXpTalk(t.id,k); }
