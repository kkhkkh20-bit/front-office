/* ===== 우천 취소 · 더블헤더 =====
   KBO 관행을 게임 규칙으로 옮겼다(수치는 실제 시즌들의 대략 범위를 맞춘 게임 가정, 실측표 아님).
   - 경기 당일 비가 오면 취소한다. 돔구장 홈경기는 취소가 없고, 원정 팀은 상대 구장 날씨를 따른다.
   - 개방형 구장 경기당 평년 취소 확률(RAIN_M): 3월 2.5%, 4월 3.5%, 5월 4.5%, 6월 5.5%, 7월 13%(장마), 8월 7%(국지성 호우·태풍), 9월 4.5%, 10월 2.5%.
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
     프로모션(행사)을 잡아 둔 경기가 취소되면 promoRainout(홈, 취소일, 새 날짜)를 부른다(행사 모듈이 있을 때만).
   - 포스트시즌 경기도 비가 오면 하루 미룬다(돔 홈경기 제외, 같은 시리즈 최대 2번).
   난수: 날씨는 날짜·도시 해시(relU)로 정해 경기 난수를 쓰지 않는다. 같은 날 같은 도시(서울 두 구단)는 같은 날씨. */
const RAIN_M={3:.025,4:.035,5:.045,6:.055,7:.13,8:.07,9:.045,10:.025};
const RAIN_ZC={서울:'c',인천:'c',수원:'c',고양:'c',성남:'c',부천:'c',용인:'c',의정부:'c',안산:'c',춘천:'c',청주:'m',대전:'m',천안:'m',전주:'m',광주:'m',대구:'d',부산:'s',창원:'s',울산:'s',포항:'s',제주:'s'};
const RAIN_ZF={c:{6:.8,7:1.15},m:{6:1.05,7:1.05},s:{6:1.2,7:.9,8:1.2,9:1.25},d:{3:.8,4:.8,5:.8,6:.85,7:.85,8:.8,9:.8,10:.8}};
const RAIN_EXT=7;
let RAIN_GI=null; /* 지금 치르는 경기: {day,h,a,i(그날 같은 대진 몇 번째),dh} — 더블헤더 휴식·관중(playDay가 경기마다 바꾼다) */
function rainZone(tid){ const t=team(tid)||{}; return RAIN_ZC[t.city]||(t.region==='영남'?'s':t.region==='호남·충청'?'m':'c'); }
function rainYearF(y){ return .6+.4*(relU('rainY',y)+relU('rainY2',y)); }
function rainBase(day){ const o=dobj(day); return (RAIN_M[o.m]||0)*rainYearF(o.y); }
function rainP(h,day){ if(G.noRain)return 0; const S=stadOf(h); if(S&&S.dome)return 0; const o=dobj(day), b=rainBase(day); if(!b)return 0; return b*((RAIN_ZF[rainZone(h)]||{})[o.m]||1); }
/* 그날 h 구장에 비로 경기를 못 하는가: 전선일(전국에 비)이면 대부분 구장, 아니면 드문 국지성 소나기. 기대값은 rainP */
function rainOut(h,day){ const p=rainP(h,day); if(!p)return false; const o=dobj(day), b=rainBase(day), pf=Math.min(.55,b*1.5), zf=p/b, city=(team(h)||{}).city||String(h);
  const front=relU('rainF:'+o.y,day)<pf; return relU('rainC:'+o.y+':'+day,city)<(front?Math.min(.95,.6*zf):.1*p); }
function rainNtSpans(y){ const L=[]; try{ for(const k of ['oly','ag']){ const e=NT_EV[k]; if(e&&e.yr(y))L.push([dnum(y,e.from[0],e.from[1]),dnum(y,e.to[0],e.to[1])]); } }catch(e){} return L; }
function rainBlocked(d){ const c=G.cal; if(d<=G.day||d<c.open)return true; if(c.asg!=null&&d>=c.asg-5&&d<=c.asg+2)return true; return rainNtSpans(dobj(d).y).some(([a,b])=>d>=a&&d<=b); }
function rainE0(){ const c=G.cal; if(c.rE0==null)c.rE0=c.end0??c.end; return c.rE0; } /* 원래 정규시즌 마지막 날(옛 저장: 처음 부를 때의 값) */
function rainCap(){ const e0=rainE0(); let cap=clamp(KD(10,3),e0+7,e0+16); for(const [a,b] of rainNtSpans(G.year)){ const ov=Math.min(b,cap)-Math.max(a,e0+1)+1; if(ov>0)cap+=Math.min(5,ov); } return cap; }
const rainHas=(t,d)=>(G.cal.sched[d]||[]).some(x=>x.includes(t));
const rainPairN=(h,a,d)=>(G.cal.sched[d]||[]).filter(x=>x[0]===h&&x[1]===a).length;
const rainDhOn=(t,d)=>(G.cal.sched[d]||[]).filter(x=>x.includes(t)).length>=2;
const rainHeat=d=>{ const m=dobj(d).m; return m===7||m===8; };
/* 취소된 h-a 경기를 다시 넣을 날: {d, dh(1이면 더블헤더), k(series·reserve·mon·late·ext)} */
function rainPlace(h,a,day){ const c=G.cal, o=dobj(day), e0=rainE0(), cap=rainCap();
  const free=d=>d>day&&!rainBlocked(d)&&!rainHas(h,d)&&!rainHas(a,d);
  const dhOk=(d,heatOk)=>d>day&&!rainBlocked(d)&&rainPairN(h,a,d)===1&&!rainDhOn(h,d)&&!rainDhOn(a,d)&&(heatOk||!rainHeat(d));
  if(!rainHeat(day)&&(o.w===5||o.w===6)&&dhOk(day+1))return {d:day+1,dh:1,k:'series'};
  for(let d=e0+1;d<=cap;d++)if(free(d))return {d,dh:0,k:'reserve'};
  for(let d=Math.max(day+1,KD(9,1));d<=e0;d++)if(dobj(d).w===1&&free(d))return {d,dh:0,k:'mon'};
  for(let d=Math.max(day+2,KD(9,1));d<=cap;d++)if(dhOk(d))return {d,dh:1,k:'late'};
  for(let d=day+2;d<=cap;d++)if(dhOk(d))return {d,dh:1,k:'late'}; /* 9월 전이라도 같은 대진이 남은 날 더블헤더(혹서기 제외) */
  for(let d=cap+1;d<=cap+RAIN_EXT;d++)if(free(d))return {d,dh:0,k:'ext'};
  for(let d=day+2;d<=cap+RAIN_EXT;d++)if(dhOk(d,true))return {d,dh:1,k:'ext'}; /* 끝까지 모자라면 혹서기 더블헤더까지 */
  let d=Math.max(day+1,c.end+1); while(rainHas(h,d)||rainHas(a,d)||rainBlocked(d))d++; return {d,dh:0,k:'ext'}; }
/* 정규시즌 하루: 경기 전에 날씨를 보고 취소·재편성한다(07_daily processDay, playDay 직전) */
function rainDay(day){ const c=G.cal; if(!c||!c.sched||G.noRain||period()!=='season'||c.rChk===day)return 0; const L=c.sched[day]; if(!L||!L.length)return 0; c.rChk=day;
  const keep=[], out=[]; for(const m of L)(rainOut(m[0],day)?out:keep).push(m); if(!out.length)return 0;
  rainE0(); if(keep.length)c.sched[day]=keep; else delete c.sched[day];
  const R=c.rain=c.rain||{}, MK=c.mk=c.mk||{}, rows=[];
  for(const [h,a] of out){ const pl=rainPlace(h,a,day); (c.sched[pl.d]=c.sched[pl.d]||[]).push([h,a]); if(pl.d>c.end){ if(c.end0==null)c.end0=c.end; c.end=pl.d; }
    (MK[pl.d]=MK[pl.d]||[]).push({h,a,from:day,dh:pl.dh,k:pl.k}); const r={h,a,to:pl.d,dh:pl.dh,k:pl.k}; (R[day]=R[day]||[]).push(r); rows.push(r);
    try{ if(typeof promoRainout==='function')promoRainout(h,day,pl.d); }catch(e){} }
  try{ rainNews(day,rows); }catch(e){ console.error(e); } return rows.length; }
const rainWhere=d=>`${dmd(d)}(${WD[dobj(d).w]})`;
function rainNews(day,rows){ const ours=rows.find(r=>r.h===G.user||r.a===G.user), cities=[...new Set(rows.map(r=>(team(r.h)||{}).city).filter(Boolean))];
  wire('리그',`우천 취소 ${rows.length}경기${cities.length?` · ${cities.join('·')}`:''}`,{});
  if(!ours||G.unemp)return; const op=ours.h===G.user?ours.a:ours.h;
  const t=`오늘 ${tshort(op)}전이 비로 취소됐습니다. ${rainWhere(ours.to)}${ours.dh?' 더블헤더':''}로 다시 잡혔고, 입장권은 환불합니다.`;
  const watch=(G.watchPlanned&&G.watchPlanned.day===day)||(G.simPlanned&&G.simPlanned.day===day)||(()=>{ const q=gmPlanAt(day); return !!(q&&q.k==='attend'&&!q.done); })();
  if(G.watchPlanned&&G.watchPlanned.day===day)G.watchPlanned=null; if(G.simPlanned&&G.simPlanned.day===day)G.simPlanned=null;
  (watch?stop:note)('일정',t); }
/* 그날 경기가 더블헤더(같은 대진 두 경기)인가, 몇 번째 경기인가: playDay 순서와 같은 목록 */
function rainGameInfo(day,h,a,i){ const c=G.cal, n=rainPairN(h,a,day), mk=((c&&c.mk||{})[day]||[]).filter(x=>x.h===h&&x.a===a); return {dh:n>=2?i:0,mk:mk.length&&i>n-mk.length?mk[i-(n-mk.length)-1].from:null}; }
/* 더블헤더 관중: 경기마다 따로 입장. 37_stadium attOf가 경기 중에만 곱한다(관중 전망·예산에는 안 곱한다) */
function rainAttM(h,day){ const x=RAIN_GI; return x&&x.day===day&&x.h===h&&x.dh?(x.i===1?.9:.8):1; }
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
  for(const d in (c&&c.sched)||{}){ const seen={}; for(const [h,a] of c.sched[d]){ const k=h+':'+a; seen[k]=(seen[k]||0)+1; if(seen[k]===2){ dhN++; dh[h]=(dh[h]||0)+1; dh[a]=(dh[a]||0)+1; } } }
  return {y:c&&c.y,tot,dhN,n,dh,end:c&&c.end,e0:c&&(c.rE0??c.end0??c.end)}; }
function rainSeasonEnd(){ const s=rainSum(); const H=G.rainHist=(G.rainHist||[]).filter(x=>x.y!==s.y); H.push({y:s.y,tot:s.tot,dh:s.dhN,end:s.end,e0:s.e0}); if(H.length>15)H.shift(); }
