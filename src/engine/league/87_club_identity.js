/* ===== 구단 정체성: 매각 뒤 이름 변경 · 연고 이전 (장기 기획 11-11) =====
   - 새 운영 주체가 구단을 인수하면(ownershipReplace) 새 이름을 걸 때가 있다(AI 구단 55%). 우리 구단은 단장이 고른다.
   - 시장이 작은 지방 구단이 인수되면 드물게(12%) 리그 밖 도시로 연고를 옮긴다. 수도권·우리 구단은 옮기지 않는다.
   - 옛 이름은 G.tnames에 남아, 그해 기록·연혁은 그때 이름으로 보인다(tshort(id,y)). 구단 기록·선수·계약·엠블럼은 그대로 이어진다 */
const CI_NICK=['레인저스','썬더스','팰컨스','마린스','블루윙스','파이어볼츠','스타즈','와이번즈','타이탄즈','유니콘스','레드윙스','플라잉독스','스콜피언스','라이온하츠','드래곤즈'];
const CI_CITY=[{city:'청주',region:'충청',market:.88},{city:'전주',region:'호남',market:.86},{city:'포항',region:'영남',market:.84},{city:'천안',region:'충청',market:.9},{city:'김해',region:'영남',market:.87},{city:'원주',region:'강원',market:.82},{city:'제주',region:'제주',market:.8},{city:'춘천',region:'강원',market:.8}];
function ciHist(tid){ G.tnames=G.tnames||{}; const t=team(tid); if(!G.tnames[tid])G.tnames[tid]=[Object.assign({y0:-Infinity,y1:null,city:t.city,nick:t.nick},t.disp?{disp:t.disp}:{},t.abbr?{abbr:t.abbr}:{})]; return G.tnames[tid]; }
function ciNickPool(){ const used=new Set(G.teams.map(t=>t.nick)); for(const k in (G.tnames||{}))for(const e of G.tnames[k])used.add(e.nick); for(const t of G.teams)if(t.ciPend&&t.ciPend.nick)used.add(t.ciPend.nick); return CI_NICK.filter(n=>!used.has(n)); }
function ciCityPool(){ const used=new Set(G.teams.map(t=>t.city)); for(const t of G.teams)if(t.ciPend&&t.ciPend.city)used.add(t.ciPend.city); return CI_CITY.filter(c=>!used.has(c.city)); }
/* 이름이 그날 무엇이었나(검수 11-17 #206): 이력 항목의 시작일(d0, 없으면 시작 시즌)로 찾는다. 옛 이적 장부로 연대기를 다시 만들 때 그 거래 날의 이름 */
function tnameOn(tid,d){ if(tid==null)return '-'; const L=G.tnames&&G.tnames[tid]; if(!L||d==null)return tname(tid); const y=dobj(d).y; let x=null; for(const e of L)if(e.d0!=null?e.d0<=d:e.y0<=y)x=e; return !x||x===L[L.length-1]?tname(tid):tfull(x); }
/* 시즌 중(개막 뒤·결산 전)에 정한 이름·연고 변경은 이번 시즌 결산 뒤에 적용한다(검수 11-17 #202: '다음 시즌부터'인데 그날 바로 바뀜). 사람·AI 구단 공통 */
function ciMidSeason(){ const c=G.cal; return !(G.last&&G.last.y>=G.year)&&!!c&&G.day>=c.open; }
function ciSched(tid,o,why){ const t=team(tid); if(!t)return false; if(!ciMidSeason())return clubRebrand(tid,o,why); t.ciPend={nick:o.nick||null,city:o.city||null,why:why||'',y:G.year,d:G.day}; return 'pend'; }
function ciPendApply(){ for(const t of G.teams||[]){ const P=t.ciPend; if(!P||(P.y>=G.year&&!(G.last&&G.last.y>=P.y)))continue; delete t.ciPend; clubRebrand(t.id,{nick:P.nick,city:P.city},P.why); } } /* 결산 직후(08_season_events)·불러오기 때. 두 번 불러도 같다 */
/* 이름·연고 바꾸기: 이 시즌까지는 옛 이름(시즌 중 바뀌면 다음 시즌부터 새 이름 기록) */
function clubRebrand(tid,o,why){ const t=team(tid); if(!t)return false; const L=ciHist(tid), cur=L[L.length-1]; const nick=o.nick||t.nick, city=o.city||t.city; if(nick===t.nick&&city===t.city)return false;
  const old=tshort(tid), y=sponSeason(); cur.y1=y-1; L.push({y0:y,y1:null,d0:G.day,city,nick,why:why||''}); /* 결산 뒤면 다음 시즌부터 새 이름. d0: 이름이 바뀐 날(#206) */
  if(o.city&&o.city!==t.city){ const C=CI_CITY.find(c=>c.city===o.city); ciRelocStad(tid,t.city,o.city,y); if(C){ t.market=C.market; t.region=C.region; } }
  t.city=city; t.nick=nick; delete t.disp; delete t.abbr; const nw=tshort(tid); /* 새 이름이 생기면 플레이어가 붙인 표시 이름·약칭은 옛 이름 이력(G.tnames)에만 남는다 */
  try{ chron('rebrand',`${old} → ${nw}${o.city?' · 연고 이전':''}${why?' · '+why:''}`,null,tid,{source:'rebrand:'+tid+':'+y}); }catch(e){}
  try{ wire('구단',`${old}, ${y}시즌부터 ${nw}(으)로${o.city?' 연고를 옮겨':' 이름을 바꿔'} 새 출발`,{tid}); }catch(e){} return true; }
/* 인수 완료 뒤 호출: AI 구단은 확률로, 우리 구단은 단장에게 묻는다 */
function ciOnSale(tid){ const t=team(tid); if(!t)return; const N=ciNickPool(); if(!N.length)return;
  if(tid===G.user&&!G.unemp){ const a=pick(N), b=pick(N.filter(x=>x!==a))||a, own=bossOf(tid).own.name;
    const when=ciMidSeason()?'이번 시즌은 지금 이름, 결산 뒤 다음 시즌부터 새 이름':'다음 시즌부터 새 이름';
    evNew('rebrand',`새 구단주가 구단 이름을 바꾸고 싶어 합니다`,`새 구단주 ${own}: "새 출발을 알리고 싶습니다. 연고와 기록은 그대로 두고 이름만 바꾸면 어떻겠습니까?"`,[{l:`${t.city} ${a}`,fx:when+'. 구단주 신뢰 +3'},{l:`${t.city} ${b}`,fx:when+'. 구단주 신뢰 +3'},{l:'지금 이름 유지',fx:'팬 여론 +3(팬들이 반김) · 구단주 신뢰 -4'}],{def:2,exp:14,data:{tid,a,b},from:'구단주'}); return; }
  if(tid===G.user)return; const C=ciCityPool(); const small=(t.market||1)<=1&&t.region!=='수도권'&&!t.indie;
  if(small&&C.length&&R()<.12){ const c=pick(C); ciSched(tid,{city:c.city,nick:R()<.6?pick(N):null},'새 운영 주체의 연고 이전'); return; }
  if(R()<.55)ciSched(tid,{nick:pick(N)},'새 운영 주체');
}
EVH.rebrand={ pick(e,i){ const t=team(e.data.tid); if(!t||e.data.tid!==G.user)return ''; if(i<2){ const nk=i===0?e.data.a:e.data.b, r=ciSched(e.data.tid,{nick:nk},'새 구단주'); t.trust=clamp((t.trust||50)+3,0,100); return r==='pend'?`이번 시즌은 ${tshort(e.data.tid)}(으)로 치르고, 결산 뒤 ${t.city} ${nk}(으)로 새 출발합니다.`:`${tshort(e.data.tid)}(으)로 새 출발합니다.`; }
  t.trust=clamp((t.trust||50)-4,0,100); prInit(); G.pr.fan=clamp(G.pr.fan+3,0,100); return '지금 이름을 지키기로 했습니다. 팬들은 반기지만 구단주는 아쉬워합니다.'; } }; /* 선택지 안내와 같은 효과(검수 11-17 #203: 팬 여론이 그대로였다) */
/* 연고 이전 때 구장(검수 11-17 #204·#205): 옛 구장은 옛 도시에 남는다. 새 연고지에서는 그 도시 기본 구장으로 시작한다
   (CI_CITY에 따로 적지 않으면 지붕 없는 구장, 첫 시즌을 개장 연도로, 시설 기본 2단계, 표준 규격, 지역 관계 50, 비는 새 도시 날씨).
   옛 구장에 걸린 사업은 새 구장으로 옮기지 않고 정리한다:
   - 시설 공사: 취소하고 남은 공사 기간만큼 공사비 환급(신구장 개장 때와 같은 규칙)
   - 관중석 증설: 협의·합의 단계는 떼어 둔 부담분 반환. 공사 중이면 구단 부담분 중 남은 공사분 환급(인허가 전이면 전액), 시 부담분은 옛 도시 몫
   - 신구장 사업: 협상·규모 선택 단계는 끝. 공사 중이면 이미 낸 분담금은 돌려받지 못하고(옛 도시 구장에 들어감) 남은 분담금은 내지 않는다
   - 이미 개장한 구장의 남은 분담금: 떠나면서 한 번에 정산
   정산 내역은 소식(우리 구단이면 메일)으로 남기고 문장 목록을 돌려준다. 난수를 쓰지 않는다. fix: 옛 저장 수리(이전 뒤 손본 시설 단계·좌석·구장 이름은 그대로) */
const CI_DIM={lf:98,cf:121,rf:98,wl:3,wc:3,wr:3};
function ciRelocStad(tid,from,city,y,d,fix){ const t=team(tid), S=stadOf(tid); d=d??G.day; const L=[], oldN=fix?((S.names||[]).slice(-1)[0]||{}).n||`${from} 야구장`:stadName(tid), C=CI_CITY.find(c=>c.city===city)||{};
  S.build=(S.build||[]).filter(b=>{ if((b.st??b.done-STAD_DAYS[b.lv])>d)return true; const c=b.c??STAD_COST[b.lv], r=Math.round(c*clamp((b.done-G.day)/Math.max(1,STAD_DAYS[b.lv]),0,1)); if(r>0)stadRefund(t,b,r); L.push(`${STAD_ITEMS.find(x=>x.k===b.k).l} ${b.lv}단계 공사 취소(남은 공사분 ${money(r)} 환급)`); return false; });
  const q=S.xq, X=q&&STADX_K[q.k]; if(q&&X&&!(q.st>d)){ if(q.stage==='build'){ const r=G.day<q.pm?(q.c||0):Math.round((q.c||0)*clamp((q.done-G.day)/Math.max(1,q.done-q.pm),0,1)); if(r>0)stadRefund(t,{c:q.c||0,sup:q.sup,ep:q.ep},r); L.push(`${X.l} 공사 취소(구단 부담분 중 ${money(r)} 환급, 시 부담분은 ${from}시 몫)`); } else { const e=q.esc||0; stadXpRefund(t,S); L.push(`${X.l} 협의 취소${e?`(떼어 둔 부담분 ${money(e)} 반환)`:''}`); } S.xq=null; }
  const N=S.proj; if(N&&!(N.start>d)){ L.push(N.stage==='build'?`신구장 공사 중단(낸 분담금 ${money(N.paid||0)}은 ${from} 구장 몫으로 돌려받지 않고, 남은 분담금 ${money(Math.max(0,(N.cost||0)-(N.paid||0)))}은 내지 않음)`:`${from}시와의 신구장 협상 종료`); S.proj=null; }
  if(S.debt&&S.debt.paid<S.debt.cost){ const left=S.debt.cost-S.debt.paid; t.cash-=left; L.push(`${oldN} 남은 분담금 ${money(left)} 일시 정산`); } delete S.debt; delete S.retry;
  if(fix){ const H=(S.xh||[]).filter(e=>STADX_K[e.k]&&e.d-STADX_K[e.k].days>=d); S.xp=sum(H.map(e=>e.seats||0)); S.xpN=H.length; S.xpUp=sum(H.map(e=>STADX_K[e.k].up)); } /* 이전 뒤 새 구장에서 시작한 증설만 남긴다 */
  else { stadXpReset(S); delete S.xdh; (S.names=S.names||[]).push({n:oldN,until:d}); S.name=C.stad||`${city} 야구장`; S.cap=C.cap||Math.min(S.cap||STAD_CAP[tid]||20000,17000); for(const k of Object.keys(S.lv))S.lv[k]=2; }
  newStadMegaSet(S,null); S.dome=!!C.dome; S.built=y; S.dim={...CI_DIM}; t.cityRel=50; S.reloc={y,d,from,to:city,...(fix?{fix:1}:{})};
  if(L.length)try{ const msg=`연고 이전으로 ${oldN} 사업 정리: ${L.join(' · ')}`; if(tid===ME())mail('운영팀','연고 이전: 옛 구장 사업 정리',msg,{kind:'구장'}); else wire('구장',`${tfull(t)}, ${msg}`,{tid}); }catch(e){}
  return L; }
/* 불러오기(migrateDraft): 결산이 끝났는데 남은 이름 변경 적용, 이름 이력 시작일(d0) 채우기(연대기의 이름 변경 날짜), 옛 구장 속성을 그대로 들고 간 연고 이전 구단 수리. 두 번 불러도 같다 */
function ciMigrate(){ if(!G||!G.teams)return; try{ ciPendApply(); }catch(e){ console.error(e); }
  for(const k in (G.tnames||{})){ const tid=+k, L=G.tnames[k], t=team(tid); if(!t||!Array.isArray(L))continue; let C=null;
    for(let i=1;i<L.length;i++){ const e=L[i]; if(e.d0!=null)continue; if(!C){ C=[]; try{ C=clubChron(tid); }catch(err){} } const c=C.find(x=>x.k==='rebrand'&&x.source==='rebrand:'+tid+':'+e.y0); if(c&&Number.isFinite(c.d))e.d0=c.d; }
    const i=L.length-1, S=t.stad; if(i<1||!S||S.reloc||L[i].city!==t.city||L[i-1].city===t.city)continue;
    const d=L[i].d0??dnum(L[i].y0-1,11,1); if(stadBuilt(tid)>L[i].y0){ S.reloc={y:L[i].y0,d,from:L[i-1].city,to:t.city,fix:1}; continue; } /* 이전한 뒤 새 구장을 지었으면 그 구장 그대로 */
    ciRelocStad(tid,L[i-1].city,t.city,L[i].y0,d,true); } }
