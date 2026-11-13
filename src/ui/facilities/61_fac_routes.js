/* 훈련 시설 공사 재원 버튼(구단 현금·모기업·명명권·지자체): 시설 화면·훈련 단지 지도·휴대폰 카드가 함께 쓴다(57_club_econ) */
function facRouteBtns(k,wrap){ const t=team(G.user), lv=facOf(k), c=FACI[k].c[lv+1], pre=facCanStart(G.user,k), I=facRouteInfo(G.user,k);
  if(pre)return `<p class="small muted">${esc(pre)}</p>`;
  const big=facBig(k,lv+1), b=(l,a,v,ok,tip)=>`<button class="btn small${a==='buildFacItem'?' primary':''}" data-a="${a}" data-v="${v}"${ok?'':' disabled'}${tip?` title="${esc(tip)}"`:''}>${l}</button>`;
  const L=[b(`구단 현금 · ${money(c)}`,'buildFacItem',k,I.cash.ok,I.cash.why)];
  if(!t.indie)L.push(b(`모기업 요청${I.cap.ok?` · 가능성 ${oddsWord(I.cap.p)}`:''}`,'capex','fac:'+k,I.cap.ok,I.cap.why));
  if(FAC_SPON.k.includes(k))L.push(b(`명명권 후원${I.spon.ok?` · ${oddsWord(I.spon.p)}`:''}`,'facFund',k+':spon',I.spon.ok,I.spon.ok?'공사비 절반을 기업이 냅니다. 성적이나 관중이 기대에 못 미치면 후원을 거두고 일부를 돌려받습니다.':I.spon.why));
  if(FAC_CITY.k.includes(k))L.push(b(`지자체 보조${I.city.ok?` · ${oddsWord(I.city.p)}`:''}`,'facFund',k+':city',I.city.ok,I.city.ok?'시가 공사비 일부를 냅니다. 대신 몇 시즌 동안 지역 야구 교실과 지역 채용을 약속합니다.':I.city.why));
  const why=[!I.cash.ok?I.cash.why:'',!t.indie&&!I.cap.ok?I.cap.why:''].filter(Boolean)[0];
  return `<div class="${wrap||'cpbtns'}">${L.join('')}</div>${big?'<p class="small muted">큰 공사라 시 인허가를 거친 뒤 첫 삽을 뜹니다. 공사 중에는 그 시설 훈련이 조금 불편해집니다.</p>':''}${why?`<p class="small muted">${esc(why)}</p>`:''}`; }
Object.assign(A,{ facFund(v){ const [k,r]=String(v).split(':'); const e=facFund(k,r); UI.facMsg=e&&!/^$/.test(e)?e:null; toast(e||'공사를 시작했습니다.'); save(); render(); } });
