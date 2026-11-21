/* 훈련 시설 공사 재원 버튼(구단 현금·모기업·명명권·지자체): 시설 화면·훈련 단지 지도·휴대폰 카드가 함께 쓴다(57_club_econ) */
/* Read-only comparison: reuse the actual upfront-payment helper and contract constants. */
function facFundingHelp(k,c,I,t){ const row=(name,body,state)=>`<section><b>${name}</b><p>${body}</p>${state&&!state.ok?`<p class="small bad">현재 신청 불가: ${esc(state.why||'신청 조건 미충족')}</p>`:''}</section>`;
  const rows=[row('구단 현금',`공사비 ${money(c)}를 구단이 부담합니다.`,I.cash)];
  if(!t.indie)rows.push(row('모기업 요청','모기업에 지원을 요청합니다. 지원 여부와 금액은 심사 결과에 따라 정해집니다.',I.cap));
  if(FAC_SPON.k.includes(k))rows.push(row('명명권 후원',`착공 시 구단 부담은 ${money(facOwnPart('spon',c))}입니다. 총 후원금 ${money(Math.round(c*FAC_SPON.share))}은 ${FAC_SPON.yrs}시즌에 나눠 받습니다. ${FAC_SPON.rk}위 이내와 관중석 점유율 ${Math.round(FAC_SPON.occ*100)}% 이상을 함께 지켜야 합니다. 조건 미달이 2회 누적되면 계약이 해지되고 받은 후원금의 ${Math.round(FAC_SPON.back*100)}%를 돌려줍니다.`,I.spon));
  if(FAC_CITY.k.includes(k))rows.push(row('지자체 보조',`착공 시 구단 부담은 ${money(facOwnPart('city',c))}이고, 시가 ${money(c-facOwnPart('city',c))}을 보탭니다. ${FAC_CITY.yrs}시즌 동안 지역 야구 교실과 지역 채용을 약속합니다. 지역 교실비 연 ${money(Math.round(c*FAC_CITY.prog))}과 추가 시설 유지비가 발생하며, 교실을 열지 못한 횟수가 2회 누적되면 보조금의 ${Math.round(FAC_SPON.back*100)}%를 돌려줍니다.`,I.city));
  return `<details class="fac-funding-help"><summary>재원별 부담·조건 보기</summary><div class="fac-funding-rows">${rows.join('')}</div></details>`; }
function facRouteBtns(k,wrap){ const t=team(G.user), lv=facOf(k), c=FACI[k].c[lv+1], pre=facCanStart(G.user,k), I=facRouteInfo(G.user,k);
  if(pre)return `<p class="small muted">${esc(pre)}</p>`;
  const big=facBig(k,lv+1), b=(l,a,v,ok,tip)=>`<button class="btn small" data-a="${a}" data-v="${v}"${ok?'':' disabled'}${tip?` title="${esc(tip)}"`:''}>${l}</button>`;
  const L=[b(`구단 현금 · ${money(c)}`,'buildFacItem',k,I.cash.ok,I.cash.why)];
  if(!t.indie)L.push(b(`모기업 요청${I.cap.ok?` · 가능성 ${oddsWord(I.cap.p)}`:''}`,'capex','fac:'+k,I.cap.ok,I.cap.why));
  if(FAC_SPON.k.includes(k))L.push(b(`명명권 후원${I.spon.ok?` · ${oddsWord(I.spon.p)}`:''}`,'facFund',k+':spon',I.spon.ok,I.spon.ok?'공사비 절반을 기업이 냅니다. 성적이나 관중이 기대에 못 미치면 후원을 거두고 일부를 돌려받습니다.':I.spon.why));
  if(FAC_CITY.k.includes(k))L.push(b(`지자체 보조${I.city.ok?` · ${oddsWord(I.city.p)}`:''}`,'facFund',k+':city',I.city.ok,I.city.ok?'시가 공사비 일부를 냅니다. 대신 몇 시즌 동안 지역 야구 교실과 지역 채용을 약속합니다.':I.city.why));
  const why=[!I.cash.ok?I.cash.why:'',!t.indie&&!I.cap.ok?I.cap.why:''].filter(Boolean)[0];
  return `<div class="${wrap||'cpbtns'}">${L.join('')}</div>${facFundingHelp(k,c,I,t)}${big?'<p class="small muted">큰 공사라 시 인허가를 거친 뒤 첫 삽을 뜹니다. 공사 중에는 그 시설 훈련이 조금 불편해집니다.</p>':''}${why?`<p class="small muted">${esc(why)}</p>`:''}`; }
Object.assign(A,{ facFund(v){ const [k,r]=String(v).split(':'); const e=facFund(k,r); UI.facMsg=e&&!/^$/.test(e)?e:null; toast(e||'공사를 시작했습니다.'); save(); render(); } });
