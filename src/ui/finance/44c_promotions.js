/* 프로모션 데이 화면: 캘린더 날짜 상세(예약·결과), 팬 마케팅 화면 목록, 캘린더 칸 표시. 엔진은 38_promotions */
const promoN=x=>Math.round(x).toLocaleString('ko-KR');
const promoSign=v=>(v>=0?'+':'')+money(v);
function promoTip(t){ return `<button type="button" class="hi-i" aria-label="설명 보기" data-tip="${esc(t)}">i</button>`; }
const PROMO_HELP=`홈경기마다 행사 하나, 시즌 ${PROMO_MAX}번까지. 행사비는 경기 날 들고, 경기가 열리지 않으면 들지 않습니다.\n\n효과는 평일·주말, 달(추위·더위·방학), 상대, 팀 성적, 팬 여론에 따라 달라집니다. 매진이면 더 들어올 자리가 없고, 같은 행사를 자주 하면 효과가 줄어듭니다.\n\n늘어난 관중 표값은 입장 수입에, 행사 매출은 '프로모션 부대 수입'에 잡힙니다. 다른 구단도 같은 규칙으로 행사를 엽니다.`;
/* 캘린더 칸·일정 목록: 잡힌 행사와 치른 행사 */
function promoCalEv(d){ if(G.unemp||!G.sea||!G.sea.promo)return []; const P=G.sea.promo[G.user]; if(!P)return []; const B=P.bk[d]; if(B&&!B.done)return [{k:'me',t:`프로모션: ${PROMO_EV[B.k].l}`}];
  const L=P.log.find(x=>x.d===d); return L?[{k:'me',t:`프로모션: ${PROMO_EV[L.k].l} +${promoN(L.xa)}명`}]:[]; }
function promoEstLine(e){ return `예상 +${promoN(e.xa)}명 · ${promoSign(e.net)}${e.fan?` · 여론 +${Math.round(e.fan*10)/10}`:''}`; }
/* 날짜 상세(27_calendar calDetail): 홈경기 날 행사 예약·결과 */
function promoBox(d){ if(G.unemp||!G.sea||G.sea.y!==G.year)return ''; const a=promoHomeOpp(G.user,d); const P=promoOf(G.user); if(a==null||!P)return '';
  const L=P.log.find(x=>x.d===d);
  if(L)return `<div class="gpl promo"><div class="row between"><span class="eyebrow">프로모션 결과</span>${promoTip(promoReport(L))}</div><div class="small"><b>${esc(PROMO_EV[L.k].l)}</b> · 관중 ${promoN(L.att)}명${L.so?'(매진)':''} · 효과 +${promoN(L.xa)}명 · 손익 ${promoSign(L.net)}</div></div>`;
  if(!(d>G.day))return '';
  const B=P.bk[d], used=promoUsed(G.user), full=!B&&used>=PROMO_MAX;
  const ks=Object.keys(PROMO_EV).filter(k=>!promoWhyNot(G.user,d,k)); const fv=PROMO_FANV*ecoIdx();
  const E=ks.map(k=>promoEst(G.user,d,k,a)).filter(Boolean).sort((x,y)=>(y.net+y.fan*fv)-(x.net+x.fan*fv));
  const cur=B?E.find(e=>e.k===B.k):null;
  const chip=e=>`<button class="btn small${B&&B.k===e.k?' primary':''}" data-a="promoBook" data-v="${d}:${e.k}" title="${esc(PROMO_EV[e.k].d)}"${full?' disabled':''}>${esc(PROMO_EV[e.k].l)} <i class="muted">${promoSign(e.net)}</i></button>`;
  const top=E.slice(0,4), rest=E.slice(4);
  return `<div class="gpl promo"><div class="row between"><span class="eyebrow">프로모션 데이 <i class="muted">${used}/${PROMO_MAX}</i></span>${promoTip(PROMO_HELP)}</div>
    ${cur?`<div class="row between"><span class="small"><span class="pill acc">${esc(PROMO_EV[cur.k].l)}</span> ${promoEstLine(cur)}</span><span class="row">${cur.why.length?promoTip(cur.why.join('\n')):''}<button class="btn small" data-a="promoCancel" data-v="${d}">취소</button></span></div>`:''}
    <div class="gpl-r">${top.map(chip).join('')}</div>${rest.length?`<details class="mfold"><summary class="small">다른 행사 ${rest.length}개</summary><div class="gpl-r">${rest.map(chip).join('')}</div></details>`:''}
    ${full?`<p class="small muted keep">올해 프로모션 ${PROMO_MAX}번을 다 잡았습니다.</p>`:''}</div>`; }
/* 팬 마케팅 화면 목록 */
function promoCard(){ if(G.unemp||!G.sea||!G.cal)return ''; const P=promoOf(G.user); if(!P)return ''; const used=promoUsed(G.user);
  const bk=Object.keys(P.bk).map(Number).filter(d=>!P.bk[d].done).sort((x,y)=>x-y);
  const row=(d,k,txt,btn)=>`<div class="promo-r"><span class="promo-d">${dmd(d)} ${WD[dobj(d).w]}</span><b>${esc(PROMO_EV[k].l)}</b><span class="small muted">${txt}</span>${btn||''}</div>`;
  const bkH=bk.map(d=>{ const e=promoEst(G.user,d,P.bk[d].k); return row(d,P.bk[d].k,`${e?tshort(e.a)+'전 · '+promoEstLine(e):''}`,`<button class="btn small" data-a="promoCancel" data-v="${d}">취소</button>`); }).join('');
  const lgH=P.log.slice().reverse().slice(0,6).map(L=>row(L.d,L.k,`${tshort(L.a)}전 · +${promoN(L.xa)}명 · ${promoSign(L.net)}`,promoTip(promoReport(L)))).join('');
  const net=P.xtk+P.inc-P.cost; const left=PROMO_MAX-used;
  const per=period(), can=(per==='season'||per==='pre')&&G.day<G.cal.end;
  return csec(`프로모션 데이 ${promoTip(PROMO_HELP)}`,`<div class="fo-sum small"><span>올해 <b>${used}/${PROMO_MAX}</b></span>${P.log.length?`<span>추가 관중 <b>${promoN(P.xatt)}명</b></span><span>손익 <b>${promoSign(net)}</b></span>`:''}</div>
    ${bkH?`<div class="eyebrow">잡아 둔 행사</div>${bkH}`:`<p class="small muted keep">캘린더에서 홈경기 날을 눌러 행사를 잡습니다.</p>`}
    ${can&&left>0?`<div class="row"><button class="btn small primary" data-a="promoAuto">추천대로 ${left}개 채우기</button><span class="small muted">남은 홈경기에서 예상 손익·여론이 좋은 날로 잡습니다.</span></div>`:''}
    ${lgH?`<details class="mfold"${bkH?'':' open'}><summary class="small">치른 행사 ${P.log.length}번</summary>${lgH}</details>`:''}`).replace('<section class="card"','<section class="card promo-card"'); }
/* 구장 화면: 스타가 부르는 관중 */
function starDrawTxt(tid){ const L=starDrawLines(tid); return L.length?`<p class="small sdesc">${L.map(esc).join(' · ')}</p>`:''; }
Object.assign(A,{
  promoBook(v){ const [d,k]=String(v).split(':'); toast(promoBook(G.user,+d,k)); save(); render(); },
  promoCancel(v){ toast(promoCancel(G.user,+v)); save(); render(); },
  promoAuto(){ const n=promoAuto(G.user); toast(n?`프로모션 ${n}개를 잡았습니다. 캘린더에서 바꿀 수 있습니다.`:'더 잡을 만한 홈경기가 없습니다.'); save(); render(); }
});
