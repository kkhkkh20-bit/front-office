/* ===== 구단 정체성: 매각 뒤 이름 변경 · 연고 이전 (장기 기획 11-11) =====
   - 새 운영 주체가 구단을 인수하면(ownershipReplace) 새 이름을 걸 때가 있다(AI 구단 55%). 우리 구단은 단장이 고른다.
   - 시장이 작은 지방 구단이 인수되면 드물게(12%) 리그 밖 도시로 연고를 옮긴다. 수도권·우리 구단은 옮기지 않는다.
   - 옛 이름은 G.tnames에 남아, 그해 기록·연혁은 그때 이름으로 보인다(tshort(id,y)). 구단 기록·선수·계약·엠블럼은 그대로 이어진다 */
const CI_NICK=['레인저스','썬더스','팰컨스','마린스','블루윙스','파이어볼츠','스타즈','와이번즈','타이탄즈','유니콘스','레드윙스','플라잉독스','스콜피언스','라이온하츠','드래곤즈'];
const CI_CITY=[{city:'청주',region:'충청',market:.88},{city:'전주',region:'호남',market:.86},{city:'포항',region:'영남',market:.84},{city:'천안',region:'충청',market:.9},{city:'김해',region:'영남',market:.87},{city:'원주',region:'강원',market:.82},{city:'제주',region:'제주',market:.8},{city:'춘천',region:'강원',market:.8}];
function ciHist(tid){ G.tnames=G.tnames||{}; const t=team(tid); if(!G.tnames[tid])G.tnames[tid]=[{y0:-Infinity,y1:null,city:t.city,nick:t.nick}]; return G.tnames[tid]; }
function ciNickPool(){ const used=new Set(G.teams.map(t=>t.nick)); for(const k in (G.tnames||{}))for(const e of G.tnames[k])used.add(e.nick); return CI_NICK.filter(n=>!used.has(n)); }
function ciCityPool(){ const used=new Set(G.teams.map(t=>t.city)); return CI_CITY.filter(c=>!used.has(c.city)); }
/* 이름·연고 바꾸기: 이 시즌까지는 옛 이름(시즌 중 바뀌면 다음 시즌부터 새 이름 기록) */
function clubRebrand(tid,o,why){ const t=team(tid); if(!t)return false; const L=ciHist(tid), cur=L[L.length-1]; const nick=o.nick||t.nick, city=o.city||t.city; if(nick===t.nick&&city===t.city)return false;
  const old=tshort(tid), y=sponSeason(); cur.y1=y-1; L.push({y0:y,y1:null,city,nick,why:why||''}); /* 결산 뒤면 다음 시즌부터 새 이름 */
  if(o.city&&o.city!==t.city){ const S=stadOf(tid), C=CI_CITY.find(c=>c.city===o.city); (S.names=S.names||[]).push({n:stadName(tid),until:G.day}); S.name=`${o.city} 야구장`; if(C){ t.market=C.market; t.region=C.region; } S.cap=Math.min(S.cap||STAD_CAP[tid]||20000,17000); }
  t.city=city; t.nick=nick; const nw=tshort(tid);
  try{ chron('rebrand',`${old} → ${nw}${o.city?' · 연고 이전':''}${why?' · '+why:''}`,null,tid,{source:'rebrand:'+tid+':'+y}); }catch(e){}
  try{ wire('구단',`${old}, ${y}시즌부터 ${nw}(으)로${o.city?' 연고를 옮겨':' 이름을 바꿔'} 새 출발`,{tid}); }catch(e){} return true; }
/* 인수 완료 뒤 호출: AI 구단은 확률로, 우리 구단은 단장에게 묻는다 */
function ciOnSale(tid){ const t=team(tid); if(!t)return; const N=ciNickPool(); if(!N.length)return;
  if(tid===G.user&&!G.unemp){ const a=pick(N), b=pick(N.filter(x=>x!==a))||a, own=bossOf(tid).own.name;
    evNew('rebrand',`새 구단주가 구단 이름을 바꾸고 싶어 합니다`,`새 구단주 ${own}: "새 출발을 알리고 싶습니다. 연고와 기록은 그대로 두고 이름만 바꾸면 어떻겠습니까?"`,[{l:`${t.city} ${a}`,fx:'다음 시즌부터 새 이름. 구단주 신뢰 상승'},{l:`${t.city} ${b}`,fx:'다음 시즌부터 새 이름. 구단주 신뢰 상승'},{l:'지금 이름 유지',fx:'팬 여론은 반기지만 구단주 신뢰 하락'}],{def:2,exp:14,data:{tid,a,b},from:'구단주'}); return; }
  if(tid===G.user)return; const C=ciCityPool(); const small=(t.market||1)<=1&&t.region!=='수도권'&&!t.indie;
  if(small&&C.length&&R()<.12){ const c=pick(C); clubRebrand(tid,{city:c.city,nick:R()<.6?pick(N):null},'새 운영 주체의 연고 이전'); return; }
  if(R()<.55)clubRebrand(tid,{nick:pick(N)},'새 운영 주체');
}
EVH.rebrand={ pick(e,i){ const t=team(e.data.tid); if(!t||e.data.tid!==G.user)return ''; if(i<2){ clubRebrand(e.data.tid,{nick:i===0?e.data.a:e.data.b},'새 구단주'); t.trust=clamp((t.trust||50)+3,0,100); return `${tshort(e.data.tid)}(으)로 새 출발합니다.`; } t.trust=clamp((t.trust||50)-4,0,100); return '지금 이름을 지키기로 했습니다.'; } };
