/* ===== 단장 계약: 연봉·계약 기간·재계약·만료 때 다른 구단 제의 =====
 단장도 구단과 계약한 한 사람이다. 연봉은 구단이 내고(결산 지출 '단장 연봉'), 계약 마지막 해 시즌이 끝나면 구단주가 재계약 여부를 정한다.
 - 재계약 의사: 구단주 신뢰 45 이상(명성 60 이상이면 35 이상). 신뢰가 높고 우승하면 기간이 길고 인상 폭이 크다.
 - 명성 58 이상이면 계약 만료 시점에 다른 구단 제의도 온다. 수락하면 그 구단으로 옮긴다.
 - 경질되면 남은 계약 기간 연봉은 구단이 정산해 준다. 단장 연봉 수치는 게임 설정이다(실제 구단 단장 연봉은 공개되지 않는다). */
const GMC_MIN=150, GMC_MAX=700;
function myCBase(tid){ const t=team(tid); const rep=G.rep??50; let s=250+(rep-50)*4; s*=clamp(t.market||1,.8,1.3); if(t.indie)s*=.8; return Math.round(clamp(s,GMC_MIN,GMC_MAX)/10)*10; }
function myCInit(){ if(G.myC||G.unemp||G.user==null)return G.myC; let y0=G.gmSince??G.year, y1=y0+2; if(y1<G.year){ y0=G.year; y1=G.year+1; } /* 예전 저장: 지금부터 2년 계약으로 본다 */ G.myC={tid:G.user,sal:myCBase(G.user),y0,y1,earn:0,stints:[],seas:[]}; return G.myC; }
function myCLeft(){ const C=myCInit(); return C?Math.max(0,C.y1-G.year):0; }
/* 새 계약 시작(취임·이직·재계약) */
function myCStart(tid,terms,why){ const old=G.myC; const sal=terms&&terms.sal||myCBase(tid), yrs=terms&&terms.yrs||3;
  const y0=period()==='season'||period()==='post'?G.year:(dobj(G.day).m>=10?G.year+1:G.year);
  G.myC={tid,sal,y0,y1:y0+yrs-1,earn:old?old.earn:0,stints:old?old.stints:[],seas:old?old.seas:[]};
  chron('join',`${tname(tid)} 단장 계약: 연봉 ${money(sal)}, ${y0}~${y0+yrs-1}년${why?` (${why})`:''}`,null,tid); }
function myCEnd(how,y){ const C=G.myC; if(!C)return; C.stints.unshift({tid:C.tid,y0:C.y0,y1:Math.min(C.y1,y??G.year),sal:C.sal,how}); C.stints.length=Math.min(C.stints.length,20); C.tid=null; }
/* 결산 지출: 단장 연봉 */
function myCPay(){ const C=myCInit(); if(!C||G.unemp)return 0; C.earn+=C.sal; return C.sal; }
/* 시즌 기록(경질 판정 전에 남긴다) */
function myCRecord(y,rank,ps,uo){ const C=myCInit(); if(!C||G.unemp)return; C.seas.push({y,tid:G.user,rank,w:uo.w,l:uo.l,ch:ps.champ===G.user?1:ps.runner===G.user?2:0}); if(C.seas.length>120)C.seas.splice(0,C.seas.length-120); }
/* 경질: 남은 기간 연봉을 구단이 정산한다 */
function myCFired(y){ const C=G.myC; if(!C||C.tid==null)return ''; const left=Math.max(0,C.y1-y); const owed=left*C.sal; if(owed>0){ team(C.tid).cash-=owed; C.earn+=owed; } myCEnd('경질',y); return owed>0?` 남은 계약 ${left}년 치 연봉 ${money(owed)}을 구단이 정산합니다.`:''; }

/* 다른 구단 제의 조건 */
function myCOffer(tid,fired){ const b=myCBase(tid); return {sal:Math.round(b*(fired?rnd(1,1.12):rnd(1.08,1.25))/10)*10,yrs:G.rep>=70?3:R()<.5?3:2}; }

/* 계약 마지막 해 결산 뒤: 구단주의 재계약 의사, 다른 구단 제의 */
function myCSeasonEnd(y,ps){ const C=myCInit(); if(!C||G.unemp||C.y1!==y)return; const t=team(G.user); const tr=t.trust, rep=G.rep??50;
  const champ=ps.champ===G.user, recent=(C.seas||[]).filter(s=>s.y>y-3&&s.ch===1).length;
  /* 명성이 높으면 다른 구단이 먼저 연락해 온다 */
  if(rep>=58){ const cands=G.teams.filter(x=>x.id!==G.user&&!(G.jobs||[]).some(j=>!j.done&&j.tid===x.id)).map(x=>({x,rk:G.last&&G.last.order?G.last.order.findIndex(o=>o.tid===x.id)+1:5,g:gmOf(x.id)})).sort((a,b)=>b.rk-a.rk+(b.g&&b.g.age>=60?2:0)-(a.g&&a.g.age>=60?2:0));
    for(const c of cands.slice(0,rep>=75?2:1)){ if(R()<.25)continue; jobOffer(c.x.id,false,myCOffer(c.x.id,false),true); } }
  const will=tr>=45||(tr>=35&&rep>=60);
  if(!will){ firedFlow(y,`${y}시즌으로 계약이 끝났고, 구단주가 재계약하지 않기로 했습니다(구단주 신뢰 ${tr}).`,'expire'); return; }
  const yrs=champ||recent>=2?4:tr>=70?3:2; const raise=(tr>=70?.15:tr>=55?.08:0)+(champ?.1:0)+(rep>=70?.05:0);
  const sal=Math.round(clamp(Math.min(Math.max(C.sal,myCBase(G.user))*(1+raise),C.sal*1.35),GMC_MIN,GMC_MAX)/10)*10; /* 한 번에 35%까지만 오른다 */ const B=bossOf(G.user);
  C.offer={y,sal,yrs};
  evNew('gmRenew',`재계약 제안: 연봉 ${money(sal)}, ${yrs}년`,`${B.own.name} 회장이 재계약을 제안했습니다. "${tr>=70?'단장님 없이는 다음 시즌을 생각하기 어렵습니다.':tr>=55?'지금처럼만 해 주시면 됩니다.':'기대만큼은 아니었지만 한 번 더 맡겨 보겠습니다.'}"
지금 계약: 연봉 ${money(C.sal)}, ${C.y0}~${C.y1}년. 제안: 연봉 ${money(sal)}(${sal>=C.sal?'+':''}${Math.round((sal/C.sal-1)*100)}%), ${y+1}~${y+yrs}년.
구단주 신뢰 ${tr} · 단장 명성 ${rep}.${(G.jobs||[]).some(j=>!j.done&&j.exp0)?' 다른 구단 제의도 와 있습니다. 소식함에서 조건을 비교해 보세요.':''}`,
    [{l:'수락',fx:`연봉 ${money(sal)}, ${yrs}년 계약.`},
     {l:'연봉 인상 요구(+15%)',fx:'구단주 신뢰가 높을수록 받아들입니다. 거절되면 원래 조건으로 계약하고 신뢰가 조금 내려가며, 신뢰가 낮으면 제안을 거둘 수도 있습니다.'},
     {l:'재계약 거절',fx:'계약이 끝나 구단을 떠납니다. 명성에 따라 다른 구단 제의를 기다립니다.'}],{from:'구단주실',exp:14,def:0}); }
EVH.gmRenew={ pick(e,i){ const C=G.myC; const O=C&&C.offer; if(!O||G.unemp)return ''; const t=team(G.user); delete C.offer;
  const sign=(sal)=>{ C.stints.unshift({tid:C.tid,y0:C.y0,y1:C.y1,sal:C.sal,how:'재계약'}); C.sal=sal; C.y0=O.y+1; C.y1=O.y+O.yrs; chron('join',`재계약: 연봉 ${money(sal)}, ${C.y0}~${C.y1}년`,null,G.user); return `재계약했습니다. 연봉 ${money(sal)}, ${C.y0}~${C.y1}년.`; };
  if(i===0)return sign(O.sal);
  if(i===1){ const p=clamp((t.trust-40)/60+((G.rep??50)-50)/100,.1,.9); if(R()<p){ t.trust=clamp(t.trust-1,0,100); return '구단주가 인상을 받아들였습니다. '+sign(Math.round(Math.min(GMC_MAX,O.sal*1.15)/10)*10)+' 신뢰 -1.'; }
    if(t.trust<55&&R()<.3){ firedFlow(O.y,`연봉 인상을 요구하자 구단주가 재계약 제안을 거뒀습니다.`,'expire'); return '구단주가 제안을 거뒀습니다. 계약이 끝나 구단을 떠납니다.'; }
    t.trust=clamp(t.trust-3,0,100); return '구단주가 인상은 어렵다고 했습니다. '+sign(O.sal)+' 신뢰 -3.'; }
  firedFlow(O.y,`${O.y}시즌으로 계약이 끝나 재계약을 고사했습니다.`,'leave'); return '재계약을 고사했습니다. 이제 다른 구단 제의를 기다립니다.'; } };
EV_KEY.add('gmRenew');
/* 새해: 계약 마지막 해 알림 */
function myCNewYear(){ const C=myCInit(); if(!C||G.unemp)return; if(C.y1===G.year)note('구단주',`올해가 단장 계약 마지막 해입니다(연봉 ${money(C.sal)}). 시즌이 끝나면 구단주가 재계약 여부를 정합니다. 구단주 신뢰 45 이상이면 재계약 제안이 오고, 명성 58 이상이면 다른 구단 제의도 올 수 있습니다.`); }
/* 단장 카드용 통산 */
function myCStats(){ const C=myCInit()||G.myC; if(!C)return null; const S=C.seas||[]; const w=sum(S.map(s=>s.w)), l=sum(S.map(s=>s.l));
  const teams=new Set(S.map(s=>s.tid)); return {n:S.length,w,l,pct:w+l?w/(w+l):0,ch:S.filter(s=>s.ch===1).length,ru:S.filter(s=>s.ch===2).length,ps:S.filter(s=>s.rank<=5).length,teams:teams.size,chT:[...new Set(S.filter(s=>s.ch===1).map(s=>s.tid))]}; }
