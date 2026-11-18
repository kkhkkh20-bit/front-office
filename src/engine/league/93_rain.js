/* ===== 우천 취소 · 더블헤더 =====
   KBO 관행을 게임 규칙으로 옮겼다(수치는 실제 시즌들의 대략 범위를 맞춘 게임 가정, 실측표 아님).
   - 경기 당일 비가 오면 취소한다. 돔구장 홈경기는 취소가 없고, 원정 팀은 상대 구장 날씨를 따른다.
   - 개방형 구장 경기당 평년 취소 확률(RAIN_M): 3월 2.5%, 4월 3.5%, 5월 4.5%, 6월 5.5%, 7월 13%(장마), 8월 7%(국지성 호우·태풍), 9월 4.5%, 10~11월 2.5%.
     권역 보정(RAIN_ZF): 남부(광주·부산·창원)는 장마가 6월 하순에 먼저 오고, 중부(수도권)는 7월이 더 많다. 남해안은 8~9월 태풍. 대구는 비가 적다.
     해마다 장마 세기가 달라 시즌 배율 0.6~1.4(가운데 1). 비는 전선처럼 같은 날 여러 구장에 함께 오는 일이 많다(전선일 + 국지성 소나기).
     → 리그 전체 시즌당 30~55경기 안팎(평균 45 전후), 구단당 5~12경기(돔 구단은 원정 경기만).
   - 재편성(rainPlace):
     1) 3~6월·9월 이후 금·토요일 경기가 취소되면 다음 날 같은 시리즈 더블헤더(7·8월 혹서기는 하지 않는다).
     2) 그 밖에는 원래 정규시즌 마지막 날 뒤 예비일. 예비일이 모자라면 9월 월요일 경기.
     3) 그래도 모자라면 9월 이후 같은 대진(같은 홈)이 있는 날 더블헤더.
     4) 끝까지 모자라면 정규시즌을 최대 RAIN_EXT일 늦춘다(포스트시즌도 그만큼 밀린다).
     올스타 휴식기와 올림픽·아시안게임 대표 소집 기간에는 잔여 경기를 넣지 않는다. 대회가 예비일과 겹치는 해는 예비일을 최대 5일 뒤로 늘리고, 모자라면 월요일·더블헤더로 채운다.
   - 더블헤더 2경기: 감독이 주전 포수를 거의 쉬게 하고, 지친 주전도 더 쉽게 뺀다(모든 구단 같은 규칙, 감독 휴식 성향 반영, 06_game gameSide).
     같은 날 두 경기라 사이에 피로 회복이 없고, 1경기에 던진 투수는 2경기에 나오지 않는다.
   - 관중: 더블헤더는 경기마다 따로 입장(1경기 -10%, 2경기 -20%). 취소 경기 입장권은 환불하고 수입이 없다. 행사·응원단 비용은 열린 경기에만 든다.
     프로모션(행사)을 잡아 둔 경기가 취소되면 promoRainout(홈, 취소일, 새 날짜)로 행사도 새 날짜로 옮긴다. 새 날짜에 다른 행사가 있거나 열 수 없으면 취소·알림(38_promotions).
     우리 경기의 직관·관전 예약도 경기를 따라 새 날짜로 옮긴다(포스트시즌과 같은 규칙, rainMovePlans).
   - 포스트시즌 경기도 비가 오면 하루 미룬다(돔 홈경기 제외, 같은 시리즈 최대 2번).
   난수: 날씨는 날짜·도시 해시(relU)로 정해 경기 난수를 쓰지 않는다. 같은 날 같은 도시(서울 두 구단)는 같은 날씨. */
const RAIN_M={3:.025,4:.035,5:.045,6:.055,7:.13,8:.07,9:.045,10:.025,11:.025};
const RAIN_ZC={서울:'c',인천:'c',수원:'c',고양:'c',성남:'c',부천:'c',용인:'c',의정부:'c',안산:'c',춘천:'c',청주:'m',대전:'m',천안:'m',전주:'m',광주:'m',대구:'d',부산:'s',창원:'s',울산:'s',포항:'s',제주:'s'};
const RAIN_ZF={c:{6:.8,7:1.15},m:{6:1.05,7:1.05},s:{6:1.2,7:.9,8:1.2,9:1.25},d:{3:.8,4:.8,5:.8,6:.85,7:.85,8:.8,9:.8,10:.8,11:.8}};
const RAIN_EXT=7;
let RAIN_GI=null; /* 지금 치르는 경기: {day,h,a,i(그날 같은 대진 몇 번째),dh} — 더블헤더 휴식·관중(playDay가 경기마다 바꾼다) */
function rainZone(tid){ const t=team(tid)||{}; return RAIN_ZC[t.city]||(t.region==='영남'?'s':t.region==='호남·충청'?'m':'c'); }
function rainYearF(y){ return .6+.4*(relU('rainY',y)+relU('rainY2',y)); }
function rainBase(day){ const o=dobj(day); return (RAIN_M[o.m]||0)*rainYearF(o.y); }
function rainP(h,day){ if(G.noRain)return 0; const S=(team(h)||{}).stad||{}; if(S.dome==null?!S.built&&/돔/.test(STAD_NM[h]||''):S.dome)return 0; const o=dobj(day), b=rainBase(day); if(!b)return 0; return b*((RAIN_ZF[rainZone(h)]||{})[o.m]||1); } /* 사전 우천 확인도 같은 계산: stadOf의 옛 저장 초기화를 일으키지 않는다 */
/* 그날 h 구장에 비로 경기를 못 하는가: 전선일(전국에 비)이면 대부분 구장, 아니면 드문 국지성 소나기. 기대값은 rainP */
function rainOut(h,day){ const p=rainP(h,day); if(!p)return false; const o=dobj(day), b=rainBase(day), pf=Math.min(.55,b*1.5), zf=p/b, city=(team(h)||{}).city||String(h);
  const front=relU('rainF:'+o.y,day)<pf; return relU('rainC:'+o.y+':'+day,city)<(front?Math.min(.95,.6*zf):.1*p); }
function rainNtSpans(y){ const L=[]; try{ for(const k of ['oly','ag']){ const e=NT_EV[k]; if(e&&e.yr(y))L.push([dnum(y,e.from[0],e.from[1]),dnum(y,e.to[0],e.to[1])]); } }catch(e){} return L; }
function rainBlocked(d){ const c=G.cal; if(d<=G.day||d<c.open)return true; if(c.asg!=null&&d>=c.asg-5&&d<=c.asg+2)return true; return rainNtSpans(dobj(d).y).some(([a,b])=>d>=a&&d<=b); }
function rainE0(){ const c=G.cal; if(c.rE0==null)c.rE0=c.end0??c.end; return c.rE0; } /* 원래 정규시즌 마지막 날(옛 저장: 처음 부를 때의 값) */
function rainCap(){ const e0=rainE0(); let cap=clamp(KD(10,3),e0+7,e0+16); for(const [a,b] of rainNtSpans(G.year)){ const ov=Math.min(b,cap)-Math.max(a,e0+1)+1; if(ov>0)cap+=Math.min(5,ov); } return cap; }
/* 한 경기의 순서는 모든 소비자가 공유한다. 재시도는 오늘/내일의 첫 경기부터, 그 뒤 정규 편성이다. 조회는 저장·난수를 바꾸지 않는다. */
function rainGames(day){ const c=G.cal; if(!c||!c.sched)return []; const rows=[], pair={}, scheduled={};
  if((day===G.day||day===G.day+1)&&day>=c.open&&day<=c.end)for(const retry of G.makeup||[])if(retry.y===G.year&&!(retry.d>=day))rows.push({h:retry.h,a:retry.a,origin:'retry',retry,from:retry.rmk??retry.from??null,schedOrdinal:0});
  for(const [h,a] of c.sched[day]||[]){ const k=h+':'+a, i=scheduled[k]=(scheduled[k]||0)+1, n=(c.sched[day]||[]).filter(m=>m[0]===h&&m[1]===a).length, mk=((c.mk||{})[day]||[]).filter(m=>m.h===h&&m.a===a); const m=i>n-mk.length?mk[i-(n-mk.length)-1]:null; rows.push({h,a,origin:'sched',schedOrdinal:i,from:m?m.from:null}); }
  const used={}, venues={}; for(const x of rows){ const k=x.h+':'+x.a; x.ordinal=pair[k]=(pair[k]||0)+1; const v=rainVenue(x.h,day); x.overflow=(used[x.h]||0)>=2||(used[x.a]||0)>=2||(venues[v]!=null&&venues[v]!==x.h); if(!x.overflow){ used[x.h]=(used[x.h]||0)+1; used[x.a]=(used[x.a]||0)+1; venues[v]=x.h; } } return rows; }
function rainVenue(h,d){ const t=team(h)||{}, S=t.stad||{}; for(const x of S.names||[])if(d<x.until)return x.n; if(!(S.names&&S.names.length)&&S.name&&S.built&&dobj(d).y<S.built)return STAD_NM[h]||t.city+' 야구장'; return S.name||STAD_NM[h]||t.city+' 야구장'; }
const rainHas=(t,d)=>rainGames(d).some(x=>x.h===t||x.a===t);
const rainPairN=(h,a,d)=>rainGames(d).filter(x=>!x.overflow&&x.h===h&&x.a===a).length;
const rainDhOn=(t,d)=>rainGames(d).filter(x=>!x.overflow&&(x.h===t||x.a===t)).length>=2;
const rainVenueFree=(h,d)=>!rainGames(d).some(x=>x.h!==h&&rainVenue(x.h,d)===rainVenue(h,d));
const rainHeat=d=>{ const m=dobj(d).m; return m===7||m===8; };
/* 취소된 h-a 경기를 다시 넣을 날: {d, dh(1이면 더블헤더), k(series·reserve·mon·late·ext)} */
function rainPlace(h,a,day){ const c=G.cal, o=dobj(day), e0=rainE0(), cap=rainCap();
  const free=d=>d>day&&!rainBlocked(d)&&!rainHas(h,d)&&!rainHas(a,d)&&rainVenueFree(h,d);
  const dhOk=(d,heatOk)=>d>day&&!rainBlocked(d)&&rainPairN(h,a,d)===1&&!rainDhOn(h,d)&&!rainDhOn(a,d)&&rainVenueFree(h,d)&&(heatOk||!rainHeat(d));
  if(!rainHeat(day)&&(o.w===5||o.w===6)&&dhOk(day+1))return {d:day+1,dh:1,k:'series'};
  for(let d=e0+1;d<=cap;d++)if(free(d))return {d,dh:0,k:'reserve'};
  for(let d=Math.max(day+1,KD(9,1));d<=e0;d++)if(dobj(d).w===1&&free(d))return {d,dh:0,k:'mon'};
  for(let d=Math.max(day+2,KD(9,1));d<=cap;d++)if(dhOk(d))return {d,dh:1,k:'late'};
  for(let d=day+2;d<=cap;d++)if(dhOk(d))return {d,dh:1,k:'late'}; /* 9월 전이라도 같은 대진이 남은 날 더블헤더(혹서기 제외) */
  for(let d=cap+1;d<=cap+RAIN_EXT;d++)if(free(d))return {d,dh:0,k:'ext'};
  for(let d=day+2;d<=cap+RAIN_EXT;d++)if(dhOk(d,true))return {d,dh:1,k:'ext'}; /* 끝까지 모자라면 혹서기 더블헤더까지 */
  let d=Math.max(day+1,c.end+1); while(!free(d))d++; return {d,dh:0,k:'ext'}; }
/* 정규시즌 하루: 경기 전에 날씨를 보고 취소·재편성한다(07_daily processDay, playDay 직전) */
function rainDay(day){ const c=G.cal; if(!c||!c.sched||G.noRain||period()!=='season'||c.rChk===day)return 0; const L=rainGames(day); if(!L.length)return 0; c.rChk=day;
  const out=L.filter(m=>rainOut(m.h,day)); if(!out.length)return 0;
  rainE0(); const canceled=new Set(out), keep=L.filter(x=>x.origin==='sched'&&!canceled.has(x)).map(x=>[x.h,x.a]); if(keep.length)c.sched[day]=keep; else delete c.sched[day];
  const retryOut=new Set(out.filter(x=>x.origin==='retry').map(x=>x.retry)); G.makeup=(G.makeup||[]).filter(x=>!retryOut.has(x));
  const R=c.rain=c.rain||{}, MK=c.mk=c.mk||{}, rows=[], moves=[];
  const watch=(G.watchPlanned&&G.watchPlanned.day===day)||(G.simPlanned&&G.simPlanned.day===day)||(()=>{ const q=gmPlanAt(day); return !!(q&&q.k==='attend'&&!q.done); })();
  { const outH=new Set(out.map(m=>m.h)); if(MK[day]){ MK[day]=MK[day].filter(x=>!outH.has(x.h)); if(!MK[day].length)delete MK[day]; } }
  for(const source of out){ const {h,a}=source, pl=rainPlace(h,a,day); (c.sched[pl.d]=c.sched[pl.d]||[]).push([h,a]); if(pl.d>c.end){ if(c.end0==null)c.end0=c.end; c.end=pl.d; }
    const targetOrdinal=rainGames(pl.d).filter(x=>x.h===h&&x.a===a).length;
    (MK[pl.d]=MK[pl.d]||[]).push({h,a,from:day,dh:pl.dh,k:pl.k}); const r={h,a,to:pl.d,dh:pl.dh,k:pl.k,ordinal:source.ordinal,schedOrdinal:source.schedOrdinal,origin:source.origin,targetOrdinal,sourcePairN:L.filter(x=>x.h===h&&x.a===a).length}; (R[day]=R[day]||[]).push(r); rows.push(r);
    try{ if(typeof gamePlansMove==='function'){ const move=gamePlansMove(day,pl.d,h,a,r); if(move&&move.text)moves.push(move.text); }else if(typeof promoRainout==='function')promoRainout(h,day,pl.d,r); }catch(e){} }
  try{ rainNews(day,rows,{watch,moves}); }catch(e){ console.error(e); } return rows.length; }
const rainWhere=d=>`${dmd(d)}(${WD[dobj(d).w]})`;
function rainNews(day,rows,plans){ const ours=rows.filter(r=>r.h===G.user||r.a===G.user), cities=[...new Set(rows.map(r=>(team(r.h)||{}).city).filter(Boolean))];
  wire('리그',`우천 취소 ${rows.length}경기${cities.length?` · ${cities.join('·')}`:''}`,{});
  if(!ours.length||G.unemp)return;
  const t=ours.map((r,i)=>`${ours.length>1?(i+1)+'경기 ':''}${tshort(r.h===G.user?r.a:r.h)}전이 비로 취소됐습니다. ${rainWhere(r.to)}${r.dh?' 더블헤더':''}로 다시 잡혔고, 입장권은 환불합니다.`).join(' ');
  const watch=plans?plans.watch:(G.watchPlanned&&G.watchPlanned.day===day)||(G.simPlanned&&G.simPlanned.day===day)||(()=>{ const q=gmPlanAt(day); return !!(q&&q.k==='attend'&&!q.done); })();
  const mv=plans?plans.moves.join(' '):ours.map(r=>rainMovePlans(day,r.to,r.h===G.user?r.a:r.h,r)).filter(Boolean).join(' ');
  (watch?stop:note)('일정',t+(mv?' '+mv:'')); }
/* 우리 경기가 비로 밀리면 그 경기를 고른 직관·관전 예약도 새 날짜로 옮긴다(포스트시즌 psShiftDays와 같은 규칙). 새 날짜에 다른 일정이 있으면 직관만 취소하고 알린다(검수 11-17 #167) */
function rainMovePlans(day,to,op,meta){ const P=G.gmPlan||{}, q=P[day]; let msg='';
  const h=meta&&meta.h, a=meta&&meta.a, i=meta&&meta.ordinal||1;
  if(meta&&meta.sourcePairN>1&&q&&q.k==='attend'&&!q.done&&!q.gk&&(q.tid==null||q.tid===G.user)&&(q.op==null||q.op===op)){ q.done=true; q.cancelled='옛 예약 경기 순번 확인 불가'; if(q.mid){ G.mail=(G.mail||[]).filter(m=>m.id!==q.mid); G.stops=(G.stops||[]).filter(m=>m.id!==q.mid); } delete q.mid; msg='예약한 더블헤더 경기 순번을 확인할 수 없어 직관 일정을 취소했습니다. 다시 예약할 수 있습니다.'; }
  const matches=p=>{ if(!meta)return p.op==null||p.op===op; if(p.gk)return gmGameMatches(p,day,h,a,i); if(meta.sourcePairN>1)return false; if(p.op!=null)return p.op===op&&(p.home==null||p.home===(h===G.user))&&i===1; const rows=[...gmGameRows(day),...((G.cal.rain||{})[day]||[])].filter(m=>m.h===G.user||m.a===G.user); return rows.length===1&&rows[0].h===h&&rows[0].a===a; };
  const key=meta?gmGameKey(to,h,a,meta.targetOrdinal||gmGameRows(to).filter(m=>m.h===h&&m.a===a).slice(-1)[0]?.ordinal||1):null;
  for(const k of ['watchPlanned','simPlanned'])if(G[k]&&G[k].day===day&&matches(G[k]))G[k]={...G[k],day:to,op,...(key?{gk:key}:{})};
  if(q&&q.k==='attend'&&!q.done&&(q.tid==null||q.tid===G.user)&&matches(q)){ delete P[day]; if(q.mid){ G.mail=(G.mail||[]).filter(m=>m.id!==q.mid); G.stops=(G.stops||[]).filter(m=>m.id!==q.mid); } delete q.mid; delete q.warned;
    if(P[to]&&!P[to].done){ q.done=true; q.cancelled='순연 일정 충돌'; (G.gmPlanCx=G.gmPlanCx||[]).push({...q,d:day,to,reason:meta&&meta.reason||'우천 순연'}); if(G.gmPlanCx.length>40)G.gmPlanCx.shift(); msg=`${rainWhere(to)}에 이미 다른 일정이 있어 직관 예약은 취소했습니다. 기존 일정은 그대로이고, 직관은 다시 예약할 수 있습니다.`; }
    else { P[to]={...q,op:q.op??op,...(key?{gk:key,fromGk:q.gk}:{}),mv:day,mvWhy:meta&&meta.reason||'우천 순연'}; msg=`직관 예약도 ${rainWhere(to)}로 옮겼습니다.`; } }
  return msg; }
/* 우천과 처리 실패가 같은 예약 이동 규칙을 쓴다. 큐·편성을 먼저 옮긴 뒤 호출한다. */
function gamePlansInsert(to,h,a,ordinal,retry){ if(!retry||retry.bookingRebased===to)return false; retry.bookingRebased=to;
  const rebase=p=>{ if(p&&p.gk&&p.gk.d===to&&p.gk.h===h&&p.gk.a===a&&p.gk.i>=ordinal)p.gk={...p.gk,i:p.gk.i+1}; };
  rebase((G.gmPlan||{})[to]); rebase(G.sea&&G.sea.promo&&G.sea.promo[h]&&G.sea.promo[h].bk[to]);
  for(const k of ['watchPlanned','simPlanned'])if(G[k]&&G[k].day===to)rebase(G[k]); return true; }
function gamePlansMove(day,to,h,a,meta={}){ const m={...meta,h,a}; const result=typeof promoRainout==='function'?promoRainout(h,day,to,m):0;
  const text=(h===G.user||a===G.user)?rainMovePlans(day,to,h===G.user?a:h,m):''; if(text&&meta.reason)note('일정',`${meta.reason}: ${text}`); return {promo:result,text}; }
/* 그날 경기가 더블헤더(같은 대진 두 경기)인가, 몇 번째 경기인가: playDay 순서와 같은 목록 */
function rainGameInfo(day,h,a,i){ const rows=rainGames(day).filter(x=>!x.overflow&&x.h===h&&x.a===a), x=rows.find(x=>x.ordinal===i); return {dh:rows.length>=2?i:0,mk:x?x.from:null}; }
/* 더블헤더 관중: 경기마다 따로 입장. 37_stadium attOf가 경기 중에만 곱한다(관중 전망·예산에는 안 곱한다) */
function rainAttM(h,day){ const x=RAIN_GI; return x&&x.day===day&&x.h===h&&x.dh?(x.i===1?.9:.8):1; }
/* 관중 전망(37_stadium stadProj): 실제 경기와 같은 더블헤더 배율을 넣어 잰다. seen은 같은 날 같은 대진 몇 번째인가(playDay와 같은 순서, 검수 11-17 #168) */
function rainAttFc(h,a,d,seen){ const k=d+':'+h+':'+a, i=seen[k]=(seen[k]||0)+1; let dh=0; try{ dh=rainGameInfo(d,h,a,i).dh; }catch(e){} if(!dh)return attOf(h,a,d,null); const keep=RAIN_GI; RAIN_GI={day:d,h,a,i,dh:true}; try{ return attOf(h,a,d,null); } finally{ RAIN_GI=keep; } }
/* 옛 저장 수리(불러오기, 여러 번 해도 같다): 다시 비로 취소된 순연 경기 표시를 지운다(#166) */
function rainMigrate(){ const c=G&&G.cal; if(!c||!c.mk||!c.rain)return 0; let n=0; for(const d of Object.keys(c.mk)){ const R=c.rain[d]; if(!R||!R.length)continue; const L=c.mk[d].filter(x=>!R.some(r=>r.h===x.h)); n+=c.mk[d].length-L.length; if(L.length)c.mk[d]=L; else delete c.mk[d]; } return n; }
/* 더블헤더 2경기 휴식(06_game gameSide): 그 구단이 오늘 이미 한 경기를 치렀는가 */
function rainDh2(tid,day){ const x=RAIN_GI; return !!(x&&x.day===day&&x.dh&&x.i>=2&&(x.h===tid||x.a===tid)); }
/* 경기 기록 꼬리표(박스스코어·결과 목록·캘린더). kind에 '차전'을 쓰면 포스트시즌으로 읽히므로 따로 둔다 */
function rainTag(g){ if(!g)return ''; return g.dh?`더블헤더 ${g.dh}차전`:g.rmk!=null?`우천 순연(${dmd(g.rmk)} 취소분)`:''; }
/* 하루 경기를 마친 뒤: 더블헤더 결과 한 줄(리그 소식) */
function rainDhWire(day,res){ for(const k in res){ const L=res[k]; if(L.length<2)continue; const [h,a]=k.split(':').map(Number); wire('리그',`${tshort(a)}-${tshort(h)} 더블헤더 1·2차전 ${L.map(s=>s[1]+':'+s[0]).join(', ')}`,{}); } }
/* 포스트시즌 비: 그날 경기를 하루 미룬다(돔 홈 제외, 같은 시리즈 2번까지) */
function rainPS(day,h,s){ if(G.noRain||!s||(s.rn||0)>=2)return false; const p=rainP(h,day); if(!p||relU('rainPS:'+G.year+':'+day,h)>=p)return false; s.rn=(s.rn||0)+1; return true; }
/* 캘린더 표시(27_calendar calEvents): 우리 경기 취소·순연·더블헤더, 리그 취소 수 */
function rainCalEv(d){ const c=G.cal, out=[]; if(!c||c.y!==dobj(d).y||G.unemp)return out; const me=x=>x.h===G.user||x.a===G.user;
  const R=(c.rain||{})[d]||[], M=(c.mk||{})[d]||[];
  for(const r of R.filter(me))out.push({k:'lg',t:`우천 취소 → ${rainWhere(r.to)}${r.dh?' 더블헤더':''}`});
  for(const m of M.filter(me))out.push({k:'lg',t:m.dh?'더블헤더 1·2차전':`우천 순연 경기(${dmd(m.from)} 취소분)`});
  const n=R.filter(r=>!me(r)).length; if(n)out.push({k:'lg',t:`리그 우천 취소 ${n}경기`}); return out; }
/* 시즌 집계: 구단별 취소·더블헤더 수, 정규시즌 마지막 날 */
function rainSum(c){ c=c||G.cal; const n={}, dh={}; let tot=0, dhN=0; for(const d in (c&&c.rain)||{})for(const r of c.rain[d]){ tot++; n[r.h]=(n[r.h]||0)+1; n[r.a]=(n[r.a]||0)+1; }
  const actual={}; if(c===G.cal&&G.sea&&G.sea.y===c.y)for(const t of G.teams)for(const x of (G.sea.tl||[])[t.id]||[])if(x[3]===1){ const d=x[5], k=t.id+':'+x[4], seen=actual[d]=actual[d]||{}; seen[k]=(seen[k]||0)+1; }
  const dates=new Set([...Object.keys(c&&c.sched||{}),...Object.keys(c&&c.playedDh||{}),...Object.keys(actual)]);
  for(const d of dates){ let seen={}; if(c&&c.playedDh&&c.playedDh[d]||c&&c.gameDone&&c.gameDone[d])seen=(c.playedDh||{})[d]||{};
    else if(c===G.cal&&+d<=G.day&&G.sea&&G.sea.y===c.y&&G.sea.tl)seen=actual[d]||{};
    else for(const [h,a] of c.sched[d]||[]){ const k=h+':'+a; seen[k]=(seen[k]||0)+1; }
    for(const k of Object.keys(seen))if(seen[k]>=2){ const [h,a]=k.split(':').map(Number); dhN++; dh[h]=(dh[h]||0)+1; dh[a]=(dh[a]||0)+1; } }
  return {y:c&&c.y,tot,dhN,n,dh,end:c&&c.end,e0:c&&(c.rE0??c.end0??c.end)}; }
function rainSeasonEnd(){ const s=rainSum(); const H=G.rainHist=(G.rainHist||[]).filter(x=>x.y!==s.y); H.push({y:s.y,tot:s.tot,dh:s.dhN,end:s.end,e0:s.e0}); if(H.length>15)H.shift(); }
