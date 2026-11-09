/* ---------- 구단·재정 ---------- */

/* ---------- 구장 ---------- */
/* 구장 시설 한 단계 올렸을 때 수입 효과 문장(올해 예상 관중·가격 기준, 효과가 이어진다고 가정·공사 기간 제외). stadView·PC 시설 화면 공용 */
function stadGainTxt(k){ const tid=G.user, S=stadOf(tid); if(k==='turf')return '홈경기 부상 계수 '+((turfM(S.lv[k])-turfM(S.lv[k]+1))*100).toFixed(2)+'%p 감소'; /* 실제 경기 계수와 같은 식 */ const yr=x=>x.ticket+x.fnb+x.prem+x.ad, lv=S.lv[k], nx=lv+1; let g=0; if(lv<STAD_MAX){ const base=yr(stadProj(tid,true)); S.lv[k]=lv+1; try{ g=Math.round(yr(stadProj(tid,true))-base); }finally{ S.lv[k]=lv; } } const up=nx<=STAD_MAX?STAD_UP[nx]-STAD_UP[lv]:0, net=g-up; const pay=net>0&&nx<=STAD_MAX?STAD_COST[nx]/net:null;
    return `연 수입 약 +${money(g)}${k==='prem'?'(일반석 '+Math.round((stadPower(nx)-stadPower(lv))*300)+'석 감소분 반영)':''} · 연 순수익 ${net>=0?'+':''}${money(net)}${pay?` · 회수 약 ${pay<1?'1년 안':pay.toFixed(1)+'년'}`:' · 돈으로는 회수 어려움'}${k==='seat'?' · 팬 여론 상승':''}${(k==='seat'||k==='vis')&&g<200?' (매진이 잦아 효과 작음)':''}`; }
function stadView(part){ const tid=G.user, S=stadOf(tid), cap=stadCap(tid), P=stadProj(tid), A=(G.sea.att&&G.sea.att[tid])||{n:0,sum:0,so:0,best:0}; const per=period(); const can=stadWindow();
  const occ=A.n?Math.min(1,A.sum/(A.cap||A.n*cap)):0; /* 경기 당시 좌석 수 기준 */
  const lg=G.teams.map(t=>{ const x=(G.sea.att&&G.sea.att[t.id])||{n:0,sum:0,so:0}; const c=stadCap(t.id); return {t,c,avg:x.n?Math.round(x.sum/x.n):0,occ:x.n?Math.min(1,x.sum/(x.cap||x.n*c)):0, /* 경기 당시 좌석 수 합으로(홈구장 화면과 같은 기준) */so:x.so,n:x.n}; }).sort((a,b)=>b.avg-a.avg||b.c-a.c);
  const top=bgHero('city_day',`<dl class="tsum"><div><dt>수용 인원</dt><dd class="num">${cap.toLocaleString('ko-KR')}석</dd></div><div><dt>올해 홈 평균</dt><dd class="num">${A.n?Math.round(A.sum/A.n).toLocaleString('ko-KR')+'명':P.n?'예상 '+P.avg.toLocaleString('ko-KR')+'명':'-'}</dd></div><div><dt>좌석 점유율</dt><dd class="num">${A.n?Math.round(occ*100)+'%':'-'}</dd></div><div><dt>매진</dt><dd class="num">${A.so}회 / ${A.n}경기</dd></div></dl>
    <p class="small sdesc">시즌 예상 관중 ${P.att.toLocaleString('ko-KR')}명(홈 ${P.n}경기) · 표값 수입 ${money(P.ticket)}${P.fnb+P.prem+P.ad>0?` · 구장 부대 수입 ${money(P.fnb+P.prem+P.ad)}`:''}${P.up?` · 시설 유지비 ${money(P.up)}`:''}</p>`,'stad-hero');
  const price=`<div class="eyebrow">티켓 가격</div><div class="chips">${PRICE.map((x,i)=>`<button data-a="stadPrice" data-v="${i}" class="${S.price===i?'on':''}">${x.l}</button>`).join('')}</div><p class="small sdesc">${PRICE[S.price].l}: ${PRICE[S.price].d} 언제든 바꿀 수 있고, 다음 홈경기부터 반영됩니다.</p>`;
  const gtxt=stadGainTxt;
  const premise='<p class="small muted">수입 효과는 올해 예상 관중·가격 기준이고, 그 효과가 이어진다고 보고 셈한 값입니다(공사 기간·팬 여론 변화 제외). 6단계부터 효과 증가폭이 완만해지고 공사비·기간·유지비가 커집니다.</p>';
  const items=STAD_ITEMS.map(it=>{ const lv=S.lv[it.k]; const b=(S.build||[]).find(x=>x.k===it.k); const nx=lv+1;
    return `<div class="stad-i"><div class="row between"><b>${it.l}</b><span class="lvdots">${Array.from({length:STAD_MAX},(_,i)=>i+1).map(i=>`<i class="${i<=lv?'on':''}"></i>`).join('')}</span></div><p class="small sdesc">${it.d}${it.k==='prem'?` 단계당 일반석이 5단계까지 300석, 6~8단계 135석, 9단계부터 90석 줄고(${lv<STAD_MAX?`다음 단계 ${Math.round((stadPower(lv+1)-stadPower(lv))*300)}석 감소, `:''}지금 수용 ${stadCap(tid).toLocaleString('ko-KR')}석) 프리미엄석 수입이 생깁니다.`:''}</p>
      <div class="row between"><span class="small">${b?`${b.lv}단계 공사 중 · ${dmd(b.done)} 완공`:lv>=STAD_MAX?'최고 단계':`${nx}단계 공사비 <b class="num">${money(STAD_COST[nx])}</b> · ${STAD_DAYS[nx]}일 · 유지비 연 +${money(STAD_UP[nx]-STAD_UP[lv])} · 효과: ${gtxt(it.k)}`}</span>${!b&&lv<STAD_MAX?`<span class="row" style="gap:4px;flex-direction:column;align-items:flex-end"><button class="btn small${can?' primary':''}" data-a="stadBuild" data-v="${it.k}" ${can?'':'disabled'}>구단 현금으로 · ${money(STAD_COST[nx])}</button><button class="btn small" data-a="capex" data-v="stad:${it.k}" ${stadWindow()?'':'disabled title="공사는 10월~2월에만 할 수 있어 협의도 그때 합니다"'}>지자체 분담 협의 · ${Math.round(capexOdds('stad',STAD_COST[nx])*100)}%</button>${can?'':`<span class="small muted">${!stadWindow()?'공사는 10월~2월에만':team(G.user).cash<STAD_COST[nx]?'현금 부족':'공사 불가'}</span>`}</span>`:''}</div></div>`; }).join('');
  const lgT=`<table class="tbl"><thead><tr><th>구단</th><th class="num">평균</th><th class="num">점유율</th><th class="num">매진</th></tr></thead><tbody>${lg.map(x=>`<tr class="${x.t.id===tid?'me':''}"><td>${badge(x.t.id,16)} ${esc(tshort(x.t.id))}</td><td class="num">${x.n?x.avg.toLocaleString('ko-KR'):'-'}</td><td class="num">${x.n?Math.round(x.occ*100)+'%':'-'}</td><td class="num">${x.so}</td></tr>`).join('')}</tbody></table>`;
  const sv={cur:part||'now',bar:''};
  if(sv.cur==='now')return sv.bar+csec(esc(stadName(tid)),stadIsoPic(tid)+top+price);
  if(sv.cur==='fac')return sv.bar+csec('구장 시설',`<p class="small muted">구장은 시 소유이고 구단이 임대해 운영합니다. 공사는 시즌이 끝난 뒤(10월~2월)에 시작할 수 있고, 공사비는 보유 현금에서 바로 나갑니다.</p><p class="small">보유 현금 <b class="num">${money(team(tid).cash)}</b>${can?'':' · 지금은 시즌 중이라 공사를 시작할 수 없습니다.'}</p>${UI.stadMsg?`<div class="note bad">${esc(UI.stadMsg)}</div>`:''}<div class="stad-l">${premise}${items}</div>`);
  if(sv.cur==='new')return sv.bar+csec('신구장',(()=>{ const N=S.proj; const age=G.year-stadBuilt(tid); const head=(N?stadIsoPic(tid):'')+`<p class="small">${esc(stadName(tid))} · ${stadBuilt(tid)}년 개장(${age}년째)${age>=30?' · <b class="bad">노후 구장: 관중 수요 -4%</b>':age<3?' · 새 구장 효과로 관중 증가':''}</p>`;
      if(!N){ if(age<20)return head+'<p class="small sdesc">개장 20년이 지나야 신구장을 추진할 수 있습니다.</p>'; if(S.retry&&G.year<S.retry)return head+`<p class="small sdesc">협상이 결렬됐습니다. ${S.retry}년에 다시 시도할 수 있습니다.</p>`;
        return head+`<p class="small sdesc expl">시와 협상해 새 구장을 짓습니다. 시가 공사비 대부분을 내고 구단은 분담금(${NEWSTAD.map(o=>money(o.cost)).join('·')})을 3년에 나눠 냅니다. ${team(G.user).indie?'<b>독립구단이라 모기업 출자가 없어 분담금 전액을 구단 현금으로 냅니다.</b> 착공하려면 첫 회차 분담금을 낼 현금이 있어야 합니다.':`<b>모기업 출연(70%)을 빼면 구단 실부담은 약 ${NEWSTAD.map(o=>money(Math.round(o.cost*.3))).join('·')}, 해마다 ${NEWSTAD.map(o=>money(Math.round(o.cost*.1))).join('·')}</b>입니다. 분담금의 70%는 모기업이 출자합니다.`} 협상은 6개월 걸리고, 구단주 신뢰·연고 시장 크기·단장 명성에 따라 성사 가능성이 달라집니다. 구단주 신뢰 45 이상 필요.</p><button class="btn primary" data-a="nsTalk">시에 신구장 협상 제안</button>`; }
      if(N.stage==='talk')return head+`<div class="note">협상 중 · ${dmd(N.res)}쯤 결과</div>`;
      if(N.stage==='plan')return head+`<div class="note good">시와 합의했습니다. 규모를 고르세요.</div><div class="stad-l">${NEWSTAD.map(o=>`<div class="stad-i"><b>${o.l} · ${o.cap.toLocaleString('ko-KR')}석</b><p class="small sdesc">${o.d} 공사 3년, 개장 후 시설은 모두 4단계 이상.</p><p class="small">구단 분담금 <b>${money(o.cost)}</b> · 결산 때 3년에 나눠 냄(첫 회차 ${money(Math.round(o.cost/3))}) · 지금 구단 현금 ${money(team(G.user).cash||0)}</p><button class="btn small primary" data-a="nsPick" data-v="${o.k}">${o.l}으로 착공</button></div>`).join('')}</div>`;
      return head+`<div class="note">${NEWSTAD.find(o=>o.k===N.k).l} 신구장 공사 중 · ${dmd(N.done)} ${dobj(N.done).y}년 개장 예정 · 분담금 ${money(N.paid||0)} / ${money(N.cost)} 납부 · 공사 기간 관중 수요 -2%</div>`; })());
  return sv.bar+csec('리그 관중',lgT+'<p class="small muted">2025년 실제 한국 프로야구는 경기당 평균 17,101명, 좌석 점유율 82.9%였습니다.</p>');
}
/* ---------- 구단 연대기 ---------- */
const CHK={season:'시즌',trade:'트레이드',fa:'FA',draft:'신인 지명',found:'창단',mgr:'감독',stad:'구장',cap:'주장',award:'수상',star:'프랜차이즈',legend:'레전드',fired:'단장',join:'단장',spon:'스폰서'};
function chronView(){ const tid=G.user; const t=team(tid); const C=(G.chron||[]).filter(x=>x.tid===tid); const H=(G.history||[]).filter(h=>h.y>=2026);
  const champs=H.filter(h=>h.champ===tid).map(h=>h.y); const ps=C.filter(x=>x.k==='season'&&/진출|우승|준우승/.test(x.t)).length;
  const stars=domestic(tid).filter(p=>p.fr&&p.fr.tid===tid); const leg=(G.frLeg||[]).filter(x=>x.tid===tid); const cap=captainOf(tid);
  const ys=[...new Set(C.map(x=>x.y))].sort((a,b)=>b-a);
  const top=uniRow(tid)+`<dl class="tsum"><div><dt>우승</dt><dd class="num">${champs.length}회${champs.length?` <span class="small muted">(${champs.join(', ')})</span>`:''}</dd></div><div><dt>가을야구</dt><dd class="num">${ps}회</dd></div><div><dt>기록된 시즌</dt><dd class="num">${ys.length}</dd></div></dl>
    <p class="small">주장 ${cap?`<button class="lnk" data-a="player" data-v="${cap.id}">${esc(cap.name)}</button>`:'없음'}${t.cap==null?'':''} · 프랜차이즈 스타 ${stars.length?stars.map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button>`).join(', '):'아직 없음'}</p>
    ${leg.length?`<p class="small">은퇴한 프랜차이즈 스타: ${leg.map(x=>`${esc(x.name)}(${x.pos}, ${x.n}시즌·WAR ${x.war})`).join(', ')}</p>`:''}
    <p class="small sdesc expl">한 팀에서 5시즌 이상 뛰며 통산 WAR 12 이상을 쌓은 선수는 프랜차이즈 스타가 됩니다. 트레이드하면 팬들이 크게 반발하고, 은퇴하면 은퇴식을 엽니다. 영구결번은 OB·레전드 메뉴에서 정합니다. 주장은 선수단 투표로 뽑힙니다.</p>`;
  const yc=y=>{ const L=C.filter(x=>x.y===y); const se=L.find(x=>x.k==='season'); const rest=L.filter(x=>x.k!=='season');
    return `<div class="chy"><div class="chy-h"><b>${y}</b><span>${se?esc(se.t):'진행 중'}</span>${champs.includes(y)?'<span class="pill good">우승</span>':''}</div>${(()=>{ const R=G.reviews&&G.reviews[y]; return R&&R.tid===tid?`<details class="mfold chrev"><summary>${y} 시즌 회고</summary>${R.L.map(l=>`<p class="small">${lk(l)}</p>`).join('')}</details>`:''; })()}${rest.length?`<ul>${rest.map(x=>`<li><i>${CHK[x.k]||x.k}</i>${x.ref!=null&&G.players[x.ref]?`<button class="lnk" data-a="player" data-v="${x.ref}">${esc(x.t)}</button>`:esc(x.t)}</li>`).join('')}</ul>`:''}</div>`; };
  return csec(`${esc(t.city)} ${esc(t.nick)} 연대기`,top)+csec('우승 트로피 진열장',trophyCase(tid)+'<div class="row"><button class="btn small" data-a="trophyGo">다른 구단 진열장</button></div>')+csec('해마다 일어난 일',ys.length?ys.map(yc).join(''):'<p class="small muted">아직 기록이 없습니다. 시즌을 치르며 트레이드·지명·FA·수상·감독 교체가 여기에 쌓입니다.</p>'); }
function clubView(){ return subTabs('club')+clubBody(curSub('club')); }
/* PC(FM '구단 정보' 배치): 구단 기본 정보·시설·재정·선발 명단·구장·주요 인물·인물·명예의 전당·유니폼·경기 일정. 모두 지금 게임 데이터(없는 값은 지어내지 않음) */
function clubFm(){ const tid=G.user, t=team(tid), F=fxFact, H=G.history||[];
  const A=(G.sea.att&&G.sea.att[tid])||{n:0,sum:0,so:0}, pv=clubPrestige(tid), prk=G.teams.filter(x=>clubPrestige(x.id)>pv).length+1, mrk=G.teams.filter(x=>x.market>t.market).length+1, rk=ibdRank(tid);
  const info=fxBox('fxc-info',fxHead(esc(tname(tid)),`명성 ${pv}점 · 리그 ${prk}위`),
    `<div class="fx-facts">${F('구단 명성',`<em class="stars-t">${starTxt(prestigeStars(pv))}</em>`)}${F('구단주 성향',OWNER[t.owner]?OWNER[t.owner].label:'-')}${F('운영 방침',t.mode==='contend'?'우승 경쟁':'리빌딩')}${F('홈 평균 관중',A.n?Math.round(A.sum/A.n).toLocaleString('ko-KR')+'명':'-')}</div>
    <div class="fx-id">${F('연고지',esc(t.city)+(t.region?`<small>${esc(t.region)}</small>`:''))}${badge(tid,104)}${F('리그 순위',rk?`${rk}위<small>${ibdRec(tid)}</small>`:'-')}</div>
    <div class="fx-facts">${F('홈구장',esc(stadName(tid)))}${F('구단주 신뢰',t.trust??'-')}${F('팬 여론',Math.round(G.pr.fan))}${F('연고 시장 규모',`리그 ${mrk}위`)}</div>`);
  const stars=lv=>`<em class="stars-t" title="${lv}/${FAC_MAX}단계">${starTxt(clamp(Math.round(lv/FAC_MAX*5),0,5))}</em>`;
  const fac=fxBox('fxc-fac',fxHead('훈련 시설',FAC[facLv(tid)]?FAC[facLv(tid)].l:''),FACK.map(k=>`<div class="fx-fac"><span>${FACI[k].l}</span>${stars(facOf(k))}<i>${esc(FACI[k].lv[facOf(k)])}</i></div>`).join('')+`<div class="fx-fac"><span>구단 버스</span><em></em><i>${BUS[busLv()].l}</i></div>`,fxBtn('go','club:inv','시설 투자'));
  const b=budget(), ci=capInfo(tid), mo=v=>`<span class="${v<0?'neg':''}">${v<0?'-'+money(-v):money(v)}</span>`;
  const fin=fxBox('fxc-fin',fxHead('재정',`${sponSeason()}년 예상`),F('보유 현금',mo(t.cash))+F('예상 수입',mo(b.I))+F('예상 지출',mo(b.E))+F('모기업 지원',mo(b.support))+F('연말 예상 현금',mo(b.endCash))+F('예산 여유',mo(b.roomGoal))+F('연봉(샐러리캡 기준)',`${money(ci.pay)} / ${money(ci.cap)}`),fxBtn('go','club:fin','재정'));
  const form=fxBox('fxc-form',fxHead('선발 명단','숫자는 타순 · 색은 종합 능력'),ibdForm(tid,''),fxBtn('go','roster:depth','전력 구성'));
  const S=stadOf(tid), cap=stadCap(tid), D=stadDim(tid);
  const stad=fxBox('fxc-stad',fxHead(esc(stadName(tid)),`${stadBuilt(tid)}년 개장 · ${Math.max(0,G.year-stadBuilt(tid))}년째`),`<div class="fx-pic">${stadIsoPic(tid)}</div><div class="fx-facts">${F('수용 인원',cap.toLocaleString('ko-KR')+'석')}${F('좌석 점유율',A.n?Math.round(A.sum/A.n/cap*100)+'%':'-')}${F('매진',`${A.so||0}회`)}${F('담장(좌·중·우)',`${D.lf}·${D.cf}·${D.rf}m`)}${F('티켓 가격',PRICE[S.price].l)}${F('올해 홈경기',`${A.n||0}경기`)}</div>`,fxBtn('go','club:stad','구장'));
  /* 주요 인물: 감독·주장·핵심 선수(우리 선수 중 종합 최고)·유망주(23세 이하 잠재력 최고) */
  const m=G.mgr[tid], c=captainOf(tid), own=playersOf(tid).filter(p=>!hideOvr(p)), key=[...own].sort((a,b)=>ovr(b)-ovr(a)).find(p=>p!==c);
  const yp=own.filter(p=>p.age<=23&&p!==c&&p!==key).map(p=>({p,rp:scoutReport(p)})).sort((a,b)=>(b.rp.ofp??0)-(a.rp.ofp??0))[0];
  const who=(role,p,extra)=>p?`<button class="fx-who" data-a="player" data-v="${p.id}">${avImg(p,true)}<div><i>${role}</i><b>${esc(p.name)}</b><span>${posLabel(p)} · ${p.age}세 · ${money(p.sal)}</span><span>종합 <em style="color:${rcol(ovr(p))}">${dv(ovr(p))}</em>${extra?' · '+extra:''}</span></div></button>`:`<div class="fx-who"><div><i>${role}</i><b class="muted">없음</b></div></div>`;
  const ppl=fxBox('fxc-ppl',fxHead('주요 인물'),(m?`<button class="fx-who" data-a="go" data-v="staff:mgr">${avImg({persona:'mgr',pid:m.id,name:m.name,age:m.age,team:tid},true)}<div><i>감독</i><b>${esc(m.name)}</b><span>${m.age}세 · 연봉 ${money(m.sal)}</span><span>${m.interim?'감독대행':`계약 잔여 ${Math.max(0,m.yrs)}년`}</span></div></button>`:`<div class="fx-who"><div><i>감독</i><b class="muted">공석</b></div></div>`)
    +who('주장',c)+who('핵심 선수',key)+who('유망주',yp&&yp.p,yp&&yp.rp.ofp!=null?'잠재 '+potTierP(yp.rp,yp.p).s:''));
  /* 인물·여론 탭 */
  const pt=inTabs('clubppl',[['ppl','인물'],['pr','팬·여론']],'ppl');
  const col=(h,L,none)=>`<div class="fx-col"><h4>${h}</h4>${L.length?L.join(''):`<p class="fx-none">${none}</p>`}</div>`;
  const pers=fxBox('fxc-pers',pt.bar,pt.cur==='pr'?(()=>{ const g=G.goals||{}, h=(G.pr.hist||[]).slice(-12), lg=(G.ownerLog||[]).slice(0,6);
    return `<div class="fx-prs"><div class="fx-facts">${F('팬 여론',Math.round(G.pr.fan)+(g.fan!=null?`<small>구단주 목표 ${g.fan}</small>`:''))}${F('언론 논조',Math.round(G.pr.press))}${F('구단주 신뢰',t.trust??'-')}${F('목표 순위',g.rank?`${g.rank}위 이내<small>지금 ${rk||'-'}위</small>`:'-')}</div>${h.length?`<h4>월별 팬 여론</h4>${fmArea(h.map(x=>({v:x.fan,l:x.m.split('.')[1]+'월'})),'var(--team-hi)',v=>Math.round(v))}`:''}</div><div class="fx-col fx-col2"><h4>구단주 평가 기록</h4>${lg.map(x=>`<div class="fx-li"><span>${x.m}월</span><b>${esc(x.mood)} · 신뢰 ${x.trust} (${x.delta>=0?'+':''}${x.delta})</b></div>`).join('')||'<p class="fx-none">아직 없음</p>'}</div>`; })().replace(/^/,'<div class="fx-cols">')+'</div>':`<div class="fx-cols">${col('구단 전설',(G.ob||[]).filter(o=>o.mine).sort((a,b)=>(b.mineWar||0)-(a.mineWar||0)).slice(0,12).map(o=>`<div class="fx-li"><b>${esc(o.name)}</b><span>${esc(o.pos)}${o.retNo?' · 영구결번':''}</span></div>`),'아직 없음')}
    ${col('프랜차이즈 스타',domestic(tid).filter(isFranchise).map(p=>`<button class="fx-li" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b><span>${posLabel(p)}</span></button>`),'아직 없음')}
    ${col('영구결번',(G.retNos||[]).map(r=>`<div class="fx-li"><b>${r.no}번 ${esc(r.name)}</b><span>${r.y}년</span></div>`),'아직 없음')}
    ${col('부상 선수',playersOf(tid).filter(p=>p.injOut>0).sort((a,b)=>b.injOut-a.injOut).map(p=>`<button class="fx-li fx-li-v" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b><span class="neg">${esc(injNow(p))} ${p.injOut}일</span></button>`),'없음')}
    <div class="fx-col fx-col2"><h4>최근 구단 기록</h4>${(G.chron||[]).filter(x=>x.tid===tid).slice(-12).reverse().map(x=>`<div class="fx-li"><span>${x.y} ${CHK[x.k]||esc(x.k)}</span><b>${esc(x.t)}</b></div>`).join('')||'<p class="fx-none">아직 없음</p>'}</div></div>`,
    fxBtn('go','club:chron','연대기')+fxBtn('go','club:rel','관계도'));
  /* 명예의 전당: 지금까지 쌓인 리그 역사(G.history)와 구단 기록 */
  const yrs=f=>H.filter(f).map(h=>h.y), tro=(ic,ys,l,n)=>`<div class="fx-tro${(n??ys.length)?'':' none'}">${ic}<b>${n??ys.length}</b><span>${l}</span><i>${ys.slice(-3).join(', ')}</i></div>`;
  const hof=fxBox('fxc-hof',fxHead('명예의 전당'),`<div class="fx-tros">${tro(trophyImg(44),yrs(h=>h.champ===tid),'한국시리즈 우승')}${tro(cupImg('r',44),yrs(h=>h.runner===tid),'한국시리즈 준우승')}${tro(cupImg('f',44),yrs(h=>h.order&&h.order[0]&&h.order[0].tid===tid),'정규시즌 1위')}${tro(compMark('ps',40)||ART.trophy(36),yrs(h=>h.order&&h.order.slice(0,5).some(o=>o.tid===tid)),'가을야구 진출')}${tro(`<span class="fx-no">${(G.retNos||[]).length}</span>`,[],'영구결번',(G.retNos||[]).length)}</div>`,fxBtn('trophyGo','','트로피 진열장'));
  const uni=fxBox('fxc-uni',fxHead('유니폼'),uniRow(tid,{sz:120})||'<p class="fx-none">유니폼 그림이 없습니다.</p>');
  /* 경기 일정 및 결과: 다음 5경기·최근 5경기 */
  const gt=(op,a,bt,cls,act)=>`<${act?'button':'div'} class="fx-g ${cls||''}"${act||''}>${badge(op,22)}<b>${esc(team(op).nick)}</b><span>${a}</span><em>${bt}</em></${act?'button':'div'}>`;
  const sch=fxBox('fxc-sch',fxHead('경기 일정 및 결과'),`<div class="fx-gs"><h4>다음</h4>${nextGames(5).map(x=>gt(x.op,(x.ps?esc(x.ps):x.home?'홈':'원정')+' '+dsh(x.d),'')).join('')||'<p class="fx-none">남은 경기 없음</p>'}<h4>최근</h4>${G.games.slice(0,5).map((g,i)=>{ const h=g.home===tid, op=h?g.away:g.home; return gt(op,h?'홈':'원정',`${g.res} ${h?g.hs:g.as}-${h?g.as:g.hs}`,g.res==='승'?'w':g.res==='패'?'l':'',` data-a="openGame" data-v="${i}"`); }).join('')||'<p class="fx-none">아직 없음</p>'}</div>`);
  return `<div class="fmx fmx-club nolink ws-own">${info}${fac}${fin}${form}${stad}${ppl}${pers}${hof}${uni}${sch}</div>`; }
function clubBody(s){
  const H0={auth:authView,rel:relView,ob:obView,owner:()=>fmOn()?ownerDash():fmCols(prestigeCard()+ownerView()+starPanel()+ownerAskView()),media:mediaView,fans:()=>fanOpsCard()+fanBoard(),crew:()=>G.unemp?'':csec('응원단장 · 치어리더 팀장',crewView())+csec('치어리더 단원',cheerView()),build:teamBuildView,news:ourNewsView,fin:moneyView,spon:sponView,stad:()=>stadView('now'),inv:invView,chron:chronView,ach:achView,
    result:()=>G.last?csec(`${G.last.y} 시즌 결산`,resultBody()):csec('시즌 결산','<p class="small muted">첫 시즌을 마치면 결산이 올라옵니다.</p>'),
    mkt:()=>csec('마케팅 예산',period()==='pre'?marketingBody():`<p>올 시즌 예산 <b class="num">${money(G.marketing)}</b></p><p class="small muted">마케팅 예산은 개막 전(스프링캠프 기간)에만 바꿀 수 있습니다.</p>`),
    log:()=>csec('구단 일지',`<div class="log">${G.log.filter(l=>!/만료되었습니다|만료됐습니다/.test(l.t)).slice(0,60).map(l=>`<p><span class="ticker">${l.d!=null?`${String(l.y).slice(2)}년 ${dsh(l.d)}`:l.y}</span> ${lk(l.t)}</p>`).join('')||'<p class="small muted">기록이 없습니다.</p>'}</div>`),
    set:()=>{ /* 설정 한 페이지(사용자 11-08): 칸을 묶음으로 넘기지 않고 세 줄로. 패치 노트·크레딧은 접어 둔다 */
      const fb=`<section class="card set-cafe"><div class="set-cafe-t"><span class="eyebrow">공식 카페</span><h2>프런트야구 네이버 카페</h2><p>질문·건의·버그 제보는 카페에 남겨 주세요. 올라온 의견은 업데이트에 바로 반영합니다. 버그는 '제보용 정보 복사'로 게임 정보(버전·날짜·화면·기기)를 붙여 넣으면 빨리 고칠 수 있습니다.</p></div><div class="set-cafe-b"><a class="btn primary" href="${FEEDBACK_URL}" target="_blank" rel="noopener">카페 가기 ›</a><button class="btn small" data-a="fbInfo">제보용 정보 복사</button></div><div class="set-ver"><span>버전 ${GAME_VER} · 진행은 자동 저장</span><button class="btn small" data-a="toTitle">처음 화면으로</button></div></section>`;
      const ret=`<section class="card"><h2 class="sec">영구결번 기준</h2><div class="chips">${[[40,'WAR 40 · 8시즌'],[60,'WAR 60 · 10시즌'],[100,'WAR 100 · 10시즌']].map(([v,l])=>`<button data-a="retWar" data-v="${v}" class="${retWarT()===v?'on':''}">${l}</button>`).join('')}</div><p class="small muted">우리 구단에서 쌓은 WAR와 시즌 수가 기준을 넘는 선수가 은퇴하면 영구결번을 지정할 수 있습니다. 시즌 WAR는 리그 1위가 7~9 정도라, 100은 15년 내내 최상위급이어야 닿습니다.</p></section>`;
      const more=`<section class="card"><details class="mfold"><summary>패치 노트</summary>${patchCard()}</details>${creditsLine()}</section>`;
      return `<div class="setx ws-own">${fb}<div class="setc"><h3 class="set-g">진행</h3>${advSetCard()}${stopCard()}</div><div class="setc"><h3 class="set-g">저장</h3>${slotsCard(false)}${exportCard()}${teleCard()}</div><div class="setc"><h3 class="set-g">구단·기록</h3>${teamNameCard()}${ret}${more}</div></div>`; }}; if(s==='info')return fmOn()?clubFm():prestigeCard()+csec('우승 트로피 진열장',trophyCase(G.user))+(uniRow(G.user)?csec('유니폼',uniRow(G.user)):'')+H0.stad(); /* 구단 정보: 하위 메뉴로 따로(사용자 11-08). 휴대폰은 FM 배치 대신 카드로 */
  const h=mergedBody('club',s,H0);
  return h;
}
/* 설정 · 권한: 구단 메뉴에서 빼서 톱니(사이드바 아래·전체 메뉴 아래)로 */
function cfgView(){ const s=curSub('cfg'); return subTabs('cfg')+clubBody(s==='auth'?'auth':'set'); }
function gamesView(){
  if(!G.games.length)return csec('우리 경기','<p class="small muted">아직 치른 경기가 없습니다.</p>');
  return csec('우리 경기',`<div class="list">${G.games.slice(0,30).map((g,i)=>{ const home=g.home===G.user; const op=home?g.away:g.home; return `<button class="item wa" data-a="openGame" data-v="${i}">${badge(op,26)}<span class="nm"><span class="pill ${g.res==='승'?'good':g.res==='패'?'bad':''}">${g.res}</span> ${home?'vs':'@'} ${tname(op)}${g.kind?` <span class="small muted">${esc(g.kind)}</span>`:''}</span><span class="sub">${dmd(g.day)}${g.inn>9?` · 연장 ${g.inn}회`:''}</span><span class="rt num">${home?g.hs:g.as} : ${home?g.as:g.hs}</span></button>`; }).join('')}</div>`);
}

function tradeMood(tid,give,get,cash,pk){
  if(!give.length&&!get.length)return null;
  const t=team(tid); const e=evalTrade(tid,give,get,cash,pk);
  const sd=1.2+Math.max(0,75-t.rel)/10; // 관계가 좋을수록 상대 속내를 정확히 읽는다
  const key=[...give].sort((a,b)=>a-b).join('-')+'|'+[...get].sort((a,b)=>a-b).join('-');
  const x=e.gain-e.need+hn('tm'+tid+'|'+key,G.year)*sd;
  /* 세 단계로만: 수락 가능 · 추가 대가 필요 · 거절 가능. 경계 근처(0~3)는 예측 오차 때문에 추가 대가 쪽으로 본다 */
  const lv=x>=3?{k:'ok',l:'수락 가능',s:'이 조건이면 받아들일 것 같습니다',c:'var(--good)'}:x>=-12?{k:'more',l:'추가 대가 필요',s:x>=0?'조금만 더 얹으면 됩니다':x>=-4?'선수 한 명 정도 더 원할 것 같습니다':'차이가 커서 큰 대가가 필요합니다',c:x>=-4?'var(--warn)':'var(--r35)'}:{k:'no',l:'거절 가능',s:'불쾌하게 여길 수 있습니다',c:'var(--bad)'};
  return {...lv,w:Math.round(clamp((x+14)/20,0.03,1)*100),sd};
}
function tContract(p){ if(!p.faC&&!p.extNext&&p.team==null&&G.fa&&(G.fa.pool||[]).includes(p.id))return 'FA 시장'; const t=ctText(p); return t==='올 시즌 뒤 FA'&&G.last&&G.last.y>=G.year?'FA 자격 취득':t; }
function trow(p,side,on,hot){ const rp=scoutReport(p); const tag=hot?`<em class="good">상대 관심 · ${esc(hot)}</em>`:p.aiListed?'<em class="warn">매물</em>':'';
  const flags=(p.injOut>0?' · <b class="bad">부상</b>':'')+(p.mor!=null&&p.mor<35?' · <b class="warn">불만</b>':'');
  return `<div class="trw${on?' on':''}"><button class="mr-p" data-a="player" data-v="${p.id}">${avImg(p)}<span><b>${esc(p.name)} <small>${posLabel(p)} · ${p.age}세</small></b><i>${money(p.sal)} · ${tContract(p)}${flags}</i>${tag?`<i>${tag}</i>`:''}</span></button><span class="trw-r">${rchip(rp.cur)}${potChip(rp,p)}</span><button class="tc-i trw-b${on?' on':''}" data-a="tpick" data-v="${side}:${p.id}">${on?'빼기':(side==='give'?'보내기':'받기')}</button></div>`; }
function tmini(p,side){ const rp=scoutReport(p);
  return `<div class="tmini">${avImg(p)}<div class="tm-id"><b>${esc(p.name)}</b><span>${posLabel(p)} · ${p.age}세 · ${money(p.sal)}</span></div><span class="tm-r">${rchip(rp.cur)}${potChip(rp,p)}</span><button class="x" data-a="tpick" data-v="${side}:${p.id}" aria-label="${esc(p.name)} 빼기">×</button></div>`; }
function tradeView(){
  const tr=UI.trade;
  if(!tradeOpen())return `<section class="card"><h2 class="sec">트레이드 기간이 아닙니다</h2><p class="small muted">7월 31일 트레이드 마감 이후에는 포스트시즌이 끝날 때까지 트레이드할 수 없습니다.</p></section>`;
  const strip=`<div class="trade-partner"><span class="small muted">상대 구단</span>${optRow('tpartner',tr.tid,G.teams.filter(t=>t.id!==G.user).map(t=>[t.id,`${badge(t.id,14)} ${esc(t.nick)}`]),null,'wsx')}<button class="btn small" data-a="tradeGm">상대 단장</button></div>`;
  /* 상대를 고르기 전: 선택 상자 대신 구단 카드(순위·단장 성향·친분·보강 원하는 자리)를 눌러 고른다 */
  /* PC: 카드에 그 구단 주요 선수 3명과 매물 수(칸을 정보로 채움) */
  const tpStars=tid=>{ const L=domestic(tid).filter(p=>!p.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,3), n=Object.values(G.players).filter(p=>p.team===tid&&p.aiListed).length;
    return `<span class="tp-st">${L.map(p=>`<span>${rchip(Math.round(scoutReport(p).cur))}<b>${esc(p.name)}</b><i>${posLabel(p)} · ${p.age}세 · ${money(p.sal)}</i></span>`).join('')}<i>매물 ${n}명</i></span>`; };
  const pick=()=>{ const st=standingsNow?standingsNow():[]; return `<div class="tp-grid">${G.teams.filter(t=>t.id!==G.user).map(t=>{ const rk=st.findIndex(x=>x.tid===t.id)+1, r=G.sea&&G.sea.rec&&G.sea.rec[t.id];
    const g=gmOf(t.id)||{}; return `<button class="tp-card" data-a="opt" data-k="tpartner" data-v="${t.id}"><span class="tp-h">${gmAv(t.id)}<span><b>${badge(t.id,16)} ${esc(t.city+' '+t.nick)}</b><i>${g.interim?'단장대행':esc(g.name||'')+' 단장'}${rk?` · ${rk}위${r?` ${r.w}승 ${r.l}패`:''}`:''}</i></span>${g.trait&&GMT[g.trait]?`<span class="pill ${g.trait==='hard'||g.trait==='miser'?'warn':g.trait==='loyal'?'good':'acc'}">${GMT[g.trait].l}</span>`:''}</span><span class="tp-rel"><i>친분</i>${relBar(t.rel)}<b>${t.rel}</b></span><span class="tp-meta"><i>${esc(needText(t.id))}</i></span>${fmOn()?tpStars(t.id):''}<em>이 구단과 협상 ›</em></button>`; }).join('')}</div>`; };
  if(tr.tid==null){ const gv0=tr.give.map(id=>G.players[id]).filter(p=>p&&p.team===G.user);
    return `${gv0.length?`<section class="card"><div class="eyebrow">보낼 선수 · ${gv0.length}명</div>${gv0.map(p=>tmini(p,'give')).join('')}<p class="small muted">이제 아래에서 협상할 구단을 고르세요.</p></section>`:''}<section class="card"><div class="eyebrow">상대 구단</div>${pick()}<p class="small muted">상대 구단을 고르면 그 팀 선수 목록이 펼쳐집니다. 관계 숫자가 높을수록 상대 단장의 반응을 정확히 읽을 수 있습니다.</p></section>`; }
  const t=team(tr.tid);
  const ok=p=>p&&!p.foreign&&!(p.joinY>G.year);
  tr.give=tr.give.filter(id=>ok(G.players[id])&&G.players[id].team===G.user);
  tr.get=tr.get.filter(id=>ok(G.players[id])&&G.players[id].team===tr.tid);
  const gv=tr.give.map(id=>G.players[id]), gt=tr.get.map(id=>G.players[id]);
  const dPay=sum(gt.map(p=>p.sal))-sum(gv.map(p=>p.sal));
  const capAfter=capPayAs(G.user,tr.get||[],tr.give||[]), cap=capOf(sponSeason()); /* 엔진과 같이 상위 40명을 다시 고른다 */
  const myN=rosterN(G.user)-tr.give.filter(tradeCntN).length+tr.get.filter(tradeCntN).length, thN=rosterN(tr.tid)+tr.give.filter(tradeCntN).length-tr.get.filter(tradeCntN).length; /* 엔진·확인창과 같은 정식 선수 기준(육성·복무 제외, 검수 11-08c) */
  { const P=pkNorm(tr.pk), hm=pkHeld(G.user), ht=pkHeld(tr.tid), same=P.y===pkYear(); tr.pk={give:same?P.give.filter(k=>hm.includes(k)):[],get:same?P.get.filter(k=>ht.includes(k)):[],y:pkYear()}; } /* 지명권 보유가 바뀌었으면 뺀다 */
  const mood=tradeMood(tr.tid,tr.give,tr.get,tr.cash||0,tr.pk);
  const want=tr.want&&G.players[tr.want]&&G.players[tr.want].team===G.user&&!tr.give.includes(tr.want)?G.players[tr.want]:null;
  const board=`<section class="card tboard">
    <div class="tgm">${gmAv(t.id,mood?(mood.k==='ok'?'smile':mood.k==='more'?'flat':'angry'):null)}<div><b>${badge(t.id,16)} ${esc(tname(t.id))} · ${esc(gmOf(t.id).name)} 단장</b><span class="small muted">${GMT[gmOf(t.id).trait].l} · 친분 ${t.rel}(${relLabel(t.rel)}) · ${esc(needText(t.id))}</span></div></div>
    ${(()=>{ if(!interestKnown(t.id))return '<p class="small muted">친분이 35 미만이라 상대가 우리 누구를 원하는지 읽기 어렵습니다.</p>'; const L=aiInterest(t.id).map(id=>G.players[id]).filter(Boolean); return L.length?`<div class="intl"><span class="small muted">상대가 원하는 우리 선수</span>${L.map(p=>`<button class="pill ${tr.give.includes(p.id)?'acc':'good'}" data-a="tpick" data-v="give:${p.id}">${tr.give.includes(p.id)?'보냄 ':'+ '}${esc(p.name)} · ${esc(interestWhy(t.id,p))}</button>`).join('')}</div><p class="small muted">이 선수를 넣으면 상대가 20% 더 높게 쳐 주고 요구 조건도 조금 낮아집니다.</p>`:''; })()}
    <div class="tcols">
      <div><div class="eyebrow">보냄 · ${gv.length}명</div>${gv.map(p=>tmini(p,'give')).join('')||'<button class="btn small tempty" data-a="tsideGo" data-v="give">우리 선수에서 고르기</button>'}</div>
      <div><div class="eyebrow">받음 · ${gt.length}명</div>${gt.map(p=>tmini(p,'get')).join('')||'<button class="btn small tempty" data-a="tsideGo" data-v="get">상대 선수에서 고르기</button>'}</div>
    </div>
    <dl class="tsum"><div><dt>연봉 변화</dt><dd class="num" style="color:${dPay>0?'var(--warn)':dPay<0?'var(--good)':'inherit'}">${dPay>=0?'+':''}${money(dPay)}</dd></div><div><dt>트레이드 후 캡</dt><dd class="num" style="color:${capAfter>cap?'var(--bad)':'inherit'}">${money(capAfter)} / ${money(cap)}</dd></div><div><dt>로스터</dt><dd class="num">우리 ${myN} · 상대 ${thN}</dd></div></dl>
    ${mood?`<div class="tmood"><div class="row between"><span class="small muted">상대 단장 반응 예상</span><b style="color:${mood.c}">${mood.l}</b></div><p class="small" style="margin:2px 0">${mood.s}</p><div class="tbarm"><span style="width:${mood.w}%;background:${mood.c}"></span><i></i></div><p class="small muted">관계 ${t.rel} 기준 예측입니다. ${mood.sd>3.5?'관계가 낮아 오차가 큽니다.':'비교적 정확합니다.'}</p></div>`:''}
    ${tr.msg?`<div class="note ${tr.ok?'good':''}">${esc(tr.msg)}${want?` <button class="btn small" data-a="tpick" data-v="give:${want.id}">${esc(want.name)} 얹기</button>`:''}</div>`:''}
    ${tr.counters&&tr.counters.length?`<div class="ctr"><span class="eyebrow">역제안</span>${tr.counters.map((c,i)=>`<div class="ctr-o"><p>${esc(c.why)}</p><span class="small muted">보냄 ${c.give.map(id=>G.players[id]?G.players[id].name:'?').join(', ')||'-'} · 받음 ${c.get.map(id=>G.players[id]?G.players[id].name:'?').join(', ')||'-'}</span><button class="btn small primary" data-a="tcounter" data-v="${i}">이 조건 수락</button></div>`).join('')}</div>`:''}
    <details class="trade-analysis"><summary>선수 비교·메디컬·검토 의견</summary>${tradeInsight(tr.tid,tr.give,tr.get)}</details>
    ${gt.length||gv.length?`<div class="tcash"><span class="small">현금</span><div class="chips">${[...(gv.length?[-3000,-1000,-500,-300,-100]:[]),0,...(gt.length?[100,300,500,1000,2000,3000]:[])].map(v=>`<button data-a="tcash" data-v="${v}" class="${(tr.cash||0)===v?'on':''}">${v>0?money(v)+' 주기':v<0?money(-v)+' 받기':'없음'}</button>`).join('')}</div><span class="small muted">실제 한국 프로야구도 선수와 현금을 섞은 트레이드가 있습니다. 돈을 중시하는 구단(독립구단·수익형 구단주·샐러리캡 초과·리빌딩)일수록 현금을 높게 치고, 내주기는 아까워합니다. 주는 현금은 예산 여유에서 빠지고, 받는 현금은 이번 시즌 결산 수입으로 잡히고, 보유 현금에는 결산 때 들어옵니다(상대 보유 현금 안에서). 그 전에는 시설 투자 같은 보유 현금 지출에 쓸 수 없습니다.</span></div>`:''}
    ${pkRow(tr)}
    ${(()=>{ const ni=negInfo(tr.tid); const nt=negTurn(tr.tid); const sg=tsig(tr.give,tr.get,tr.cash||0)+pkSig(tr.pk); const isC=!!(nt.ctr&&nt.ctr[sg]!=null&&G.day-nt.ctr[sg]<=7); const dup=!isC&&(gv.length||gt.length)&&nt.seen[sg]!=null; const left=ni.left||isC; return `<div class="row"><button class="btn primary" data-a="tpropose" ${(gv.length||gt.length)&&left&&!dup?'':'disabled'}>제안하기</button><button class="btn" data-a="treset">비우기</button>${negChip(tr.tid)}</div>${dup?'<p class="small" style="color:#ffb547">이미 거절된 안과 같습니다. 선수를 바꾸거나 더해야 제안할 수 있습니다.</p>':''}${(()=>{ const cd=tradeCool(tr.tid,tr.get); if(cd)return `<p class="small" style="color:#ffb547">${cd.cap?`${esc(tshort(tr.tid))}와(과)는 올해 이미 ${cd.n}번 거래했습니다(같은 구단과는 한 시즌 ${cd.max}번까지, 맞대결 기간에는 한 번 더). 급매 매물은 이 제한 없이 데려올 수 있습니다.`:`${esc(tshort(tr.tid))}와(과)는 ${dsh(cd.d)}에 거래했습니다. ${dsh(cd.until)}부터 다시 거래할 수 있습니다. 맞대결 기간이나 급매 매물은 바로 됩니다.`}</p>`; const oc=(gv.length||gt.length)?tradeOwnerCheck(tr.give,tr.get,tr.cash||0):null; return oc?`<p class="small" style="color:${oc.ok?'#ffb547':'#ff6b6b'}">연봉 ${money(oc.dSal)} 증가 · 예산 초과 ${money(oc.over)} (구단주 허용 ${money(oc.lim)}) — ${oc.ok?'성사되면 구단주가 승인하지만 신뢰 -2':'구단주가 승인하지 않습니다'}</p>`:''; })()}`; })()}
  </section>`;
  const side=tr.side||'get', seg=tr.seg||'bat', sort=tr.sort||'cur';
  let pool=(side==='get'?domestic(tr.tid):domestic(G.user)).filter(p=>ok(p)&&(seg==='bat'?!p.isP:p.isP)).map(p=>({p,rp:scoutReport(p)}));
  const sf={cur:(a,b)=>(b.rp.cur??-1)-(a.rp.cur??-1)||(b.rp.ofp??0)-(a.rp.ofp??0),fut:(a,b)=>(b.rp.ofp??0)-(a.rp.ofp??0)||(b.rp.cur??-1)-(a.rp.cur??-1),sal:(a,b)=>b.p.sal-a.p.sal,age:(a,b)=>a.p.age-b.p.age}[sort];
  pool.sort(sf); const INT=side==='give'&&interestKnown(tr.tid)?aiInterest(tr.tid):[]; if(INT.length)pool.sort((a,b)=>(INT.includes(b.p.id)?1:0)-(INT.includes(a.p.id)?1:0));
  const sel=tr[side]; const PGt=pager('tpool'+side+seg+sort+tr.tid,pool,innerWidth<700?tradeListSize():wide()?16:8);
  const poolCard=`<section class="card">
    <div class="seg" id="tpick"><button data-a="tside" data-v="get" class="${side==='get'?'on':''}">상대 선수 (${esc(t.city+' '+t.nick)})</button><button data-a="tside" data-v="give" class="${side==='give'?'on':''}">우리 선수</button></div>
    <div class="trade-pool-options"><div class="seg" role="group" aria-label="협상 선수 구분">${[['bat','야수'],['pit','투수']].map(([v,l])=>`<button data-a="tseg" data-v="${v}" class="${seg===v?'on':''}">${l}</button>`).join('')}</div><div class="seg" role="group" aria-label="협상 선수 정렬">${[['cur','능력순'],['fut','잠재력순'],['sal','연봉순'],['age','나이순']].map(([v,l])=>`<button data-a="tsort" data-v="${v}" class="${sort===v?'on':''}">${l}</button>`).join('')}</div></div>
    <p class="small muted">"${side==='get'?'받기':'보내기'}"를 누르면 위 협상안에 올라갑니다. 이름을 누르면 선수 정보가 열립니다. 현재 능력은 정확한 값이고, 잠재력은 우리 선수와 프로 담당 스카우트가 있는 지역 구단만 보입니다. 외국인 선수와 올해 입단 신인은 제외됩니다.</p>
    <div class="trws" data-pg="tpool${side}${seg}${sort}${tr.tid}"><div class="trw-h"><span>선수</span><span>현재 · 잠재력</span><span></span></div>${PGt.items.map(({p})=>trow(p,side,sel.includes(p.id),INT.includes(p.id)?interestWhy(tr.tid,p):'')).join('')||'<p class="small muted">대상 선수가 없습니다.</p>'}</div>${PGt.bar}
  </section>`;
  const basket=`<div class="trade-basket"><span>보냄 <b>${gv.length}</b> · 받음 <b>${gt.length}</b></span><button class="btn small primary" data-a="tradeReview" ${gv.length||gt.length?'':'disabled'}>제안 확인</button></div>`;
  return strip+(innerWidth<700?(tr.stage==='review'?`<button class="btn small" data-a="tradePick">‹ 선수 다시 고르기</button>${board}`:basket+poolCard):`<div class="tlay">${board}${poolCard}</div>`);
}
function extBody(){
  const c=domestic(G.user).filter(canExtend).sort((a,b)=>scoutReport(b).ofp-scoutReport(a).ofp).slice(0,6);
  const done=domestic(G.user).filter(p=>p.extNext);
  return `<p class="small muted">FA가 되기 전에 핵심 선수를 묶어 둘 수 있습니다. 선수는 자기 실력을 알고 요구하므로, 스카우트 평가가 높을수록 비쌉니다. 한 선수와는 일주일에 한 번 협상할 수 있습니다.</p>
    ${done.length?`<div class="note good">합의 완료: ${done.map(p=>`${esc(p.name)} ${p.extNext.years}년 연 ${money(p.extNext.annual)}`).join(', ')}</div>`:''}
    ${cgrid(c,p=>({sub:`${p.age}세 · ${p.svc}년차`,foot:`<b class="num">${money(p.sal)}</b><span>${ctText(p)}</span><button class="tc-i go" data-a="extOpen" data-v="${p.id}">연장 협상</button>`}))}`;
}
function standingsTable(order){
  return `<table><thead><tr><th>순위 · 구단</th><th>승</th><th>패</th><th>무</th><th>승률</th><th>차</th></tr></thead><tbody>${order.map((o,i)=>`<tr class="${o.tid===G.user?'me':''}"><td><button class="lnk tname" data-a="lteamGo" data-v="${o.tid}"><span class="ticker">${i+1}</span>${badge(o.tid,18)}${tname(o.tid)}</button></td><td>${o.w}</td><td>${o.l}</td><td>${o.t||0}</td><td>${o.w+o.l?fmt3(o.w/(o.w+o.l)):'-'}</td><td>${i?((order[0].w-o.w-(order[0].l-o.l))/2).toFixed(1):'-'}</td></tr>`).join('')}</tbody></table>`;
}
function psBody(){
  const P=G.ps; const PY=(()=>{ const d=Object.values(P.resD||{})[0]; return d!=null?dobj(d).y:(P.cur&&P.cur.days?dobj(P.cur.days[0]).y:G.year); })(); /* 해가 바뀐 뒤에도 그 포스트시즌의 해 */ const rows=[]; const tm=t=>`<span class="ps-t${t===G.user?' me':''}">${badge(t,24)}${esc(tshort(t))}</span>`;
  for(const k of ['wc','spo','po','ks']){ const r=P.res[k]; if(r)rows.push(`<div class="item ps-r${k==='ks'?' ks':''}" style="cursor:default">${k==='ks'?compMark('ks',28):''}<span class="nm">${ROUNDK[k]}</span><span class="sub ps-m">${tm(r[0])}<b class="num">${r[2]}-${r[3]}</b>${tm(r[1])}</span></div>`); }
  const s=P.cur; if(s)rows.push(`<div class="item ps-r${s.round==='ks'?' ks':''}" style="cursor:default">${s.round==='ks'?compMark('ks',28):''}<span class="nm">${ROUNDK[s.round]} 진행 중</span><span class="sub ps-m">${tm(s.hi)}<b class="num">${s.wh}-${s.wl}</b>${tm(s.lo)}<span class="small muted">다음 경기 ${dmd(s.days[s.gi])}</span></span></div>`);
  const RL=['한국시리즈 직행','플레이오프 직행','준플레이오프 직행','와일드카드(1승 어드밴티지)','와일드카드'];
  const seeds=(P.seeds||[]).length?`<div class="ps-seeds">${P.seeds.map((t,i)=>`<div class="ps-seed${t===G.user?' me':''}"><span class="num">${i+1}위</span>${badge(t,40)}<b>${esc(tshort(t))}</b><i>${RL[i]||''}</i></div>`).join('')}</div>`:'';
  const ks=P.res.ks; const champ=ks?`<div class="ps-champ">${trophyImg(64)}<div><span class="eyebrow">${PY} 한국시리즈</span><b>${badge(ks[0],32)} ${esc(tname(ks[0]))} 우승</b><span class="small">${esc(tshort(ks[1]))} 상대 ${ks[2]}승 ${ks[3]}패</span></div></div>`:'';
  return bgHero('city_night',`<div class="ps-head">${compMark('ps',40)}<div><b>${PY} 포스트시즌</b><span class="small">진출 ${(P.seeds||[]).length}개 구단 · ${P.done?'종료':P.cur?ROUNDK[P.cur.round]+' 진행 중':'대기'}</span></div></div>`,'ps-hero')+champ+seeds+`<div class="list">${rows.join('')}</div><p class="small muted">정규시즌 1~5위가 진출합니다. 4위는 와일드카드에서 1승만 하면 올라갑니다. 한국시리즈는 2-3-2 방식입니다.</p>`;
}
function resultBody(){ return champHero()+resultBody0(); }
function champHero(){ const L=G.last; if(!L)return ''; const me=L.tid??G.user; const h=G.history.find(x=>x.y===L.y); if(!h||h.champ!==me)return ''; const n=G.history.filter(x=>x.champ===me&&x.y<=L.y).length;
  return `<div class="champ-hero">${trophyImg(96)}<div><span class="eyebrow">${L.y} 한국시리즈</span><b>${esc(tname(me))} 우승</b><span>구단 통산 ${n}번째 우승</span></div></div>`; }
function resultBody0(){
  const L=G.last; const me=L.tid??G.user; /* 결산 뒤 이직해도 성적·월별·신뢰·결산표 모두 결산한 구단 기준(검수 11-09h) */ const ps=L.ps; const f=L.fins[me]; const uo=L.order.find(o=>o.tid===me);
  const rank=L.order.findIndex(o=>o.tid===me)+1; const tr=L.trust;
  const psRow=(label,s)=>s?`<div class="item" style="cursor:default"><span class="nm">${label}</span><span class="sub">${tname(s[0])} ${s[2]}-${s[3]} ${tname(s[1])}</span></div>`:'';
  return `<p>${me!==G.user?`${esc(tname(me))} · `:''}<b>${recStr(uo)} · ${rank}위</b> · ${ps.champ===me?'한국시리즈 우승':rank<=5?'가을야구 진출':'가을야구 탈락'}</p>
    <div class="months">${(L.months||[]).map(x=>`<div><span>${x.m}</span><b>${x.w}-${x.l}${x.t?`-${x.t}`:''}</b></div>`).join('')}${(()=>{ const M=L.months||[]; if(!M.length)return ''; const w=sum(M.map(x=>x.w)), l=sum(M.map(x=>x.l)), t=sum(M.map(x=>x.t||0)); return `<div class="tot"><span>합계</span><b>${w}-${l}${t?`-${t}`:''}</b></div>`; })()}</div>
    <p class="small">구단주 신뢰 ${tr.before} → <b>${tr.after}</b> <span class="pill ${tr.delta>=0?'good':'bad'}">${tr.delta>=0?'+':''}${tr.delta}</span></p>
    ${L.notes.map(n=>`<div class="note bad">${esc(n)}</div>`).join('')}
    ${L.awards&&awShown(L.awards,'mvp')?`<div class="eyebrow">시상</div><p class="small">MVP ${L.awards.mvp?esc(L.awards.mvp.name)+'('+tshort(L.awards.mvp.t)+')':'-'} · 신인왕 ${L.awards.roy?esc(L.awards.roy.name)+'('+tshort(L.awards.roy.t)+')':'-'} · 우리 골든글러브 ${!awShown(L.awards,'gg')?'12월 발표':Object.values(L.awards.gg).filter(x=>x.t===me).map(x=>esc(x.name)).join(', ')||'없음'}</p>`:''}
    ${L.goals&&L.goals.length?`<div class="eyebrow">구단주 목표 평가</div><div class="list">${L.goals.map(g=>`<div class="item" style="cursor:default"><span class="nm">${esc(g)}</span></div>`).join('')}</div>`:''}${L.pr?`<p class="small">시즌 말 팬 여론 ${L.pr.fan} · 언론 논조 ${L.pr.press}</p>`:''}
    <div class="eyebrow">포스트시즌</div><div class="list">${psRow('와일드카드',ps.wc)}${psRow('준플레이오프',ps.spo)}${psRow('플레이오프',ps.po)}${psRow('한국시리즈',ps.ks)}</div>
    <p class="small muted">포스트시즌 입장 수입 ${money(L.gate)} 중 운영비를 뺀 ${money(L.pool)}을 배당. 정규시즌 1위 20%, 나머지는 우승 50%, 준우승 24%, 플레이오프 14%, 준플레이오프 9%, 와일드카드 3%.</p>
    <div class="eyebrow">결산</div>${finTable(f)}
    <div class="eyebrow">시즌 리더</div><div class="list">${L.leaders.map(l=>{const p=G.players[l.id]; return `<button class="item" data-a="player" data-v="${l.id}" ${p||(G.arch&&G.arch[l.id])?'':'disabled'}><span class="nm">${l.k} · ${esc(l.nm||(p?p.name:'은퇴 선수'))}</span><span class="sub">${l.t!=null&&G.teams[l.t]?tname(l.t):p&&p.team!=null?tname(p.team):''}</span><span class="rt num">${l.v}</span></button>`}).join('')}</div>`;
}
function finTable(f){
  return `<dl class="kv">${f.inc.map(x=>`<dt>${x[0]}</dt><dd>+${money(x[1])}</dd>`).join('')}${f.exp.map(x=>`<dt>${x[0]}</dt><dd>-${money(x[1])}</dd>`).join('')}
    <dt class="tot">순이익</dt><dd class="tot" style="color:${f.net>=0?'var(--good)':'var(--bad)'}">${f.net>=0?'+':''}${money(f.net)}</dd>${f.selfC?`<dt>적자 자체 충당(보유 현금)</dt><dd>${money(f.selfC)}</dd>`:''}${f.div?`<dt>투자사 배당(80억 초과분의 절반)</dt><dd>${money(f.div)}</dd>`:''}
    <dt>관중</dt><dd>${Math.round(f.att/1e4)}만 명</dd>${f.supCap?`<dt>모기업 적자 보전 한도</dt><dd>${money(f.supCap)}${f.supCut?` <span class="small muted">(쌓인 현금 때문에 ${money(f.supCut)} 줄어든 한도)</span>`:''}</dd>`:''}<dt>시즌 후 보유 현금</dt><dd>${money(f.cash)}</dd></dl>`;
}
/* 국내 선수 연봉 협상 표: 직전 성적 → 구단 산정안 → 선수 요구 → 단장 제시 */
function salTalkView(ended){ salTalkInit(); const C=G.contract; const wk=Math.floor(G.day/7);
  const L=ended.map(p=>({p,n:C.neg[p.id],b:salBasis(p)})).filter(x=>x.n).sort((a,b)=>({open:0,arb:1,ok:2}[a.n.st]-{open:0,arb:1,ok:2}[b.n.st])||((b.n.ask-b.n.off)-(a.n.ask-a.n.off)));
  const open=L.filter(x=>x.n.st==='open'), fresh=open.filter(x=>x.n.cur==null);
  const row=({p,n,b})=>{ const d=(n.st==='ok'?p.newSal:(n.cur??n.off))-p.sal; const lock=n.wk===wk;
    const mid=round5((Math.max(n.cur??n.off,n.off)+n.ask)/2);
    const pfa=preFA(p); const shown=n.st==='ok'?p.newSal:(n.cur??n.off); const pc=pfa?preFAComp(p,shown):null; const prem=pfa?preFAPremium(p,n.off):0;
    const st=n.mil?`<span class="pill">입대 · 연봉 동결 ${money(p.newSal)}</span>`:n.st==='ok'?`<span class="pill good">합의 ${money(p.newSal)}</span>`:n.st==='arb'?`<span class="pill warn">연봉조정 · 구단 ${money(n.arb.club)} / 선수 ${money(n.arb.player)}</span>`:n.cur==null?'<span class="pill">미제시</span>':`<span class="pill bad">미합의 · 요구 ${money(n.ask)}</span>`;
    const acts=n.st==='open'?(lock?`<span class="small muted">이번 주 협상 끝</span><button class="btn small primary" data-a="salOff" data-v="${p.id}:${n.ask}">요구 수용 ${money(n.ask)}</button>`:`${n.cur==null?`<button class="btn small" data-a="salOff" data-v="${p.id}:${n.off}">산정안 ${money(n.off)}</button>`:''}${n.ask>(n.cur??n.off)&&mid<n.ask?`<button class="btn small" data-a="salOff" data-v="${p.id}:${mid}">중간안 ${money(mid)}</button>`:''}<button class="btn small primary" data-a="salOff" data-v="${p.id}:${n.ask}">요구 수용 ${money(n.ask)}</button>${pfa&&prem>n.ask?`<button class="btn small" data-a="salOff" data-v="${p.id}:${prem}">예비 FA 대우 ${money(prem)}</button>`:''}`)
      :n.st==='arb'?`<button class="btn small primary" data-a="salArbAccept" data-v="${p.id}">선수안 수용 ${money(n.arb.player)}</button>`:'';
    return `<div class="salr"><div class="salr-h"><button class="lnk" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b></button>${potChipP(p)}<span class="small muted">${posLabel(p)} · ${p.age}세 · ${p.svc}년차${(p.svc||0)>=ARB_SVC&&!(dobj(G.day).m<=3&&G.day>KD(1,10))?' · 조정 신청 가능':''} · ${hasAgent(p)?`협상 ${esc(agentOf(p).name)} 에이전트`:'본인 협상'}</span>${pfa?'<span class="pill acc">예비 FA</span>':''}${st}</div>
      ${pfa?`<p class="small salr-fa">다음 시즌 뒤 FA입니다. 지금 연봉 순위로는 ${pc.g}등급 예상. 이 연봉(${money(shown)})이면 다른 구단이 데려갈 때 보상금 ${pc.withP?`${money(pc.withP)}+선수 1명 또는 `:''}${money(pc.cash)}을 받습니다. 연봉을 올리면 보상금이 커져 다른 구단이 쉽게 못 데려가고, 선수도 붙잡으려는 뜻으로 받아들입니다.</p>`:''}
      <div class="salr-b"><span><i>직전 시즌</i><b>${b.h?(()=>{ const t=statLine(b.h,p); return /WAR/.test(t)?t:`${t} · WAR ${b.war.toFixed(1)}`; })():'1군 기록 없음'}</b><em>${b.band} · 인상 상한 +${b.cap}%</em></span><span><i>연봉</i><b class="num">${money(p.sal)} → ${money(n.st==='ok'?p.newSal:(n.cur??n.off))}</b><em class="${d>0?'warn':d<0?'good':''}">${d>=0?'+':''}${p.sal?Math.round(d/p.sal*100):0}% · 산정안 ${money(n.off)}</em></span></div>
      <div class="row salr-a">${acts}${n.st==='open'&&!lock?`<button class="btn small" data-a="ngtOpen" data-v="sal:${p.id}">협상 테이블</button>`:''}<button class="btn small danger" data-a="relNow" data-v="${p.id}">방출</button></div></div>`; };
  return `<div class="eyebrow">국내 선수 연봉 협상 · 미합의 ${open.length}명</div>
    ${fresh.length?`<button class="btn primary block" data-a="salOffAll">구단 산정안으로 ${fresh.length}명에게 일괄 제시</button>`:''}
    <details class="frule"><summary class="small">연봉 산정 기준 보기</summary><div class="small">
      <p><b>1. 직전 시즌 1군 WAR로 인상 폭 상한을 정합니다.</b> WAR 0 이하 동결, 0.5면 +20%, 1이면 +40%, 2이면 +80%, 3이면 +120%, 5 이상이면 +190%까지. 1군 표본이 적으면(타자 120타석, 투수 25이닝 미만) 15% 안에서만 움직입니다.</p>
      <p><b>2. 같은 연차·능력의 보류권 기준액 쪽으로 맞춥니다.</b> FA 시장가의 3년 미만 18%, 6년 미만 30%, FA 직전 42%, FA 자격을 얻고도 신청하지 않은 선수 55%. 연차별 최고 기록(4년차 5억 등)을 넘지 않습니다.</p>
      <p><b>3. 잘한 선수는 깎지 않습니다.</b> WAR 3 이상 15% 이상 인상, 2 이상 8% 이상 인상, 1 이상 동결 이상, 0 이상은 최대 15%까지만 삭감. 그보다 부진하면 더 깎습니다. 실제 한국 프로야구 규약의 삭감 제한은 2008년에 없어졌고, 구단 관행상 3억 미만은 최대 40%, 3억 이상은 최대 50%까지 깎습니다(김도영 5억→2.5억).</p>
      <p><b>예비 FA:</b> 다음 시즌 뒤 FA가 되는 선수입니다. 실제 구단들은 핵심 예비 FA의 마지막 보류 시즌 연봉을 크게 올리곤 합니다. 붙잡겠다는 신호이면서, 떠나면 받는 보상금(직전 연봉 × A등급 2배+선수 또는 3배, B등급 1배+선수 또는 2배, C등급 1.5배)을 키우는 계산입니다. 다른 구단도 핵심 예비 FA에게는 이렇게 합니다. 최저 연봉은 2027년부터 3,300만 원입니다.</p>
      <p><b>4. 선수는 성적이 좋을수록, 야망이 클수록 산정안보다 더 원합니다.</b> 한 선수와는 한 주에 한 번 협상합니다. 거절하면 요구액을 조금씩 낮춥니다.</p>
      <p><b>5. 연봉조정:</b> 1월 10일까지 합의하지 못한 3년차 이상 선수는 신청할 수 있고, 1월 20일 조정위원회가 구단안과 선수안 중 하나를 고릅니다. 실제 한국 프로야구에서 조정위원회까지 간 20건 중 선수가 이긴 것은 2번(2002 류지현, 2021 주권)입니다. 조정에서 진 선수는 기분이 크게 떨어집니다.</p></div></details>
    <div class="salrs">${L.filter(x=>x.n.st!=='ok').map(row).join('')||'<p class="small muted">모든 국내 선수와 합의했습니다. 위의 "연봉 계약 확정"을 누르면 끝납니다.</p>'}</div>
    ${(()=>{ const ok=L.filter(x=>x.n.st==='ok'); return ok.length?`<details class="frule"><summary class="small">합의 완료 ${ok.length}명 · 합계 ${money(sum(ok.map(x=>x.p.newSal)))}</summary><div class="salok">${ok.map(({p,b})=>`<div class="salok-r"><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><span class="small muted">${posLabel(p)} · WAR ${b.war.toFixed(1)}</span><span class="num">${money(p.sal)} → <b>${money(p.newSal)}</b></span></div>`).join('')}</div></details>`:''; })()}`; }
function contractView(){
  const C=G.contract;
  const ended=C.ended.map(id=>G.players[id]).filter(Boolean).sort((a,b)=>b.newSal-a.newSal);
  const fEnd=C.foreignEnd.map(id=>G.players[id]).filter(Boolean);
  salTalkInit(); const raise=sum(ended.map(p=>{ const n=C.neg&&C.neg[p.id]; return (n?(n.st==='ok'?p.newSal:(n.cur??n.off)):p.newSal)-p.sal; }));
  return `
  <section class="card hero" data-k="연봉협상">
    <div class="eyebrow">연봉 협상 · 1월 10일 연봉조정 신청 · 1월 31일 마감</div>
    <p>국내 선수 ${ended.length}명은 직전 시즌 성적으로 구단이 산정한 연봉안을 단장이 제시하고, 외국인 ${fEnd.length}명은 재계약 여부를 정합니다. 1월 31일까지 계약하지 못한 선수는 구단의 마지막 제시액에 사인합니다. 다만 요구액과 차이가 크게 남은 선수는 사인하지 않고 미계약으로 남아 훈련·경기에 나갈 수 없습니다.</p>
    <p class="small">국내 선수 인상 총액(현재 합의·제시 기준) <b class="num">${raise>=0?'+':''}${money(raise)}</b></p>
    ${UI.ctMsg?`<div class="note ${/넘습니다|거절/.test(UI.ctMsg)?'bad':''}">${esc(UI.ctMsg)}</div>`:''}
    ${(()=>{ const V=confirmPreview(); return V&&V.hold.length?`<div class="note bad">지금 확정하면 사인 거부 예상 ${V.hold.length}명: ${V.hold.map(x=>`${esc(x.p.name)}(제시 ${money(x.to)} · 요구 ${money(x.ask)})`).join(', ')}</div>`:''; })()}
    <button class="btn primary block" data-a="confirmContracts">연봉 계약 확정</button>
    ${fEnd.length?`<div class="eyebrow">외국인 재계약</div>${(()=>{ const f=fReCapInfo(); const keep=fEnd.filter(p=>!C.foreignDrop.includes(p.id)); const dRaise=sum(keep.map(p=>p.newSal-p.sal)); let room=null; try{ room=budget().roomGoal; }catch(e){}
  return f?`<p class="small ${f.over>0?'bad':''}"><b>외국인 선수 ${f.n}명 총액 ${money(f.tot)} / 리그 한도 ${money(f.cap)}</b> (${Math.round(f.tot/USD)}만 / ${Math.round(f.cap/USD)}만 달러)${f.over>0?` · ${money(f.over)} 초과: 재계약하지 않을 선수를 고르거나 깎아서 협상해야 확정됩니다`:''}</p><p class="small">재계약 인상 합계 <b class="${dRaise>0?'bad':'good'}">${dRaise>=0?'+':''}${money(dRaise)}</b>${room!=null?` · 예산 여유 ${money(room)} → <b class="${room-dRaise<0?'bad':''}">${money(room-dRaise)}</b>${room-dRaise<0?' (구단주 지원 한도를 넘습니다)':''}`:''}</p>`:''; })()}<details class="frule"><summary class="small">외국인 재계약 규칙(요구액·보류권)</summary><p class="small muted">잘한 선수는 더 달라고 합니다(최대 1.7배). 재계약은 100만 달러 상한이 없지만 3명 총액 한도(인센티브 포함)가 있습니다. 보류권: 우리가 재계약을 제안한 외국인은 국내 다른 구단과 협상할 수 없어서, 경쟁 상대는 해외 제안뿐입니다. 제안은 세 번까지이고 끝내 거절하면 선수는 해외로 떠나며 5년 동안 국내 다른 구단에 갈 수 없습니다. 재계약하지 않을 때 보류명단에서 빼 주면 자유계약이 되어 다른 구단이 데려갈 수 있습니다.</p></details><div class="list fre-l">${fEnd.map(p=>{const drop=C.foreignDrop.includes(p.id); return `<div class="item fre-i" style="cursor:default"><button class="nm lnk" data-a="player" data-v="${p.id}">${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세</span></button><span class="sub">${statLine(curLine(p),p)}</span><span class="rt"><span class="num">${money(p.sal)} → <b>${money(p.newSal)}</b></span><br>${(()=>{ const N=(C.fre||{})[p.id]; return !drop&&!(N&&N.ok)?`<span class="small ${fReIdleOut(p)?'bad':'muted'}">그냥 두면: ${fReIdleOut(p)?'해외 제안이 더 좋아 떠납니다':`요구액 ${money(p.newSal)}으로 재계약`}</span><br><button class="btn small primary" data-a="foRe" data-v="${p.id}">재계약 협상</button> `:N&&N.ok?`<span class="pill good">합의${p.fInc?` · 인센티브 ${usdT(p.fInc)}`:''}</span> `:''; })()}${p.fleft?'<span class="pill bad">떠남 · 보류권 유지</span>':`<button class="btn small ${drop?'':'danger'}" data-a="fdrop" data-v="${p.id}">${drop?'재계약 제의로 변경':'재계약 안 함'}</button>${drop?` <button class="btn small" data-a="ffree" data-v="${p.id}">${(C.fFree||[]).includes(p.id)?'보류명단 제외(자유계약)':'보류권 유지(재계약 의사 통보·5년 묶음)'}</button>`:''}`}</span></div>`}).join('')}</div>`:''}
    ${salTalkView(ended)}
  </section>`;
}

/* 진행 설정: 스페이스바·계속 버튼으로 진행할 때 확인 창 */
/* 진행 멈춤 조건(위임과 별개): 어떤 소식에서 진행을 멈출지 고른다. 끈 분류는 소식함에만 남고, 결정은 기한이 지나면 기본안으로 처리된다 */
function stopCard(){ const S=G.stopCfg||{}; return `<section class="card" id="stopCard"><h2 class="sec">진행 멈춤</h2><p class="small muted">'진행하기'를 눌렀을 때 어떤 소식에서 멈출지 고릅니다. 업무 위임(누가 처리하나)과는 따로입니다. 끈 분류는 소식함에 중요 표시로 남고 진행만 멈추지 않습니다. 그 안의 결정은 기한이 지나면 적힌 기본안으로 처리됩니다.</p>
  <div class="stop-l">${STOP_CATS.map(([k,l,d])=>{ const lock=k==='must'; const on=lock||(S[k]!=null?!!S[k]:STOP_DEF[k]); return `<label class="chk stop-r${lock?' lock':''}"><input type="checkbox" ${lock?'checked disabled':`data-a="stopTg" data-v="${k}" ${on?'checked':''}`}> <b>${l}</b> <span class="small muted">${d}${lock?'':STOP_DEF[k]?'':' · 기본은 멈추지 않음'}</span></label>`; }).join('')}</div></section>`; }
function advSetCard(){ const on=!!G.advAsk; return `<section class="card"><div class="row between"><h2 class="sec">진행 방식</h2><button class="btn small" data-a="advAskTog">${on?'묻지 않기':'매번 묻기'}</button></div><p class="small muted">${on?'지금: 진행할 때마다 어디까지 갈지 확인 창을 띄웁니다.':'지금: 남은 결정·트레이드 제안·안 읽은 중요 소식이 없으면 묻지 않고 바로 진행합니다. 있으면 진행 전에 알려 줍니다.'}</p></section>`; }

/* 신인 지명권 얹기(KBO 2020~): 다음 드래프트 지명권만, 선수와 맞바꿀 때만 */
function pkRow(tr){ if(G.draft&&!G.draft.done)return ''; const P=pkNorm(tr.pk);
  const chip=(side,k,on)=>{ const [rd,o]=k.split(':').map(Number); const own=side==='give'?G.user:tr.tid; return `<button data-a="pkT" data-v="${side}:${k}" class="${on?'on':''}">${rd}R${o!==own?`(${esc(tshort(o))})`:''}</button>`; };
  return `<div class="tcash"><span class="small">신인 지명권 · ${pkYear()} 드래프트</span>
    <div class="small muted">우리 지명권 보내기</div><div class="chips">${pkHeld(G.user).map(k=>chip('give',k,P.give.includes(k))).join('')||'<span class="small muted">없음</span>'}</div>
    <div class="small muted">상대 지명권 받기</div><div class="chips">${pkHeld(tr.tid).map(k=>chip('get',k,P.get.includes(k))).join('')||'<span class="small muted">없음</span>'}</div>
    <span class="small muted">KBO 규약(2020~): 다음에 열릴 신인 드래프트 지명권만 주고받을 수 있고, 지명권은 선수와 맞바꿀 때만 넘길 수 있습니다. 넘겨받은 지명권은 원래 구단 순번에 씁니다. 리빌딩 구단일수록 지명권을 높게 칩니다.</span></div>`; }
