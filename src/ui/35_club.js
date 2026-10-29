/* ---------- 구단·재정 ---------- */

/* ---------- 구장 ---------- */
function stadView(part){ const tid=G.user, S=stadOf(tid), cap=stadCap(tid), P=stadProj(tid), A=(G.sea.att&&G.sea.att[tid])||{n:0,sum:0,so:0,best:0}; const per=period(); const can=per!=='season'&&per!=='post';
  const occ=A.n?A.sum/A.n/cap:0;
  const lg=G.teams.map(t=>{ const x=(G.sea.att&&G.sea.att[t.id])||{n:0,sum:0,so:0}; const c=stadCap(t.id); return {t,c,avg:x.n?Math.round(x.sum/x.n):0,occ:x.n?x.sum/x.n/c:0,so:x.so,n:x.n}; }).sort((a,b)=>b.avg-a.avg||b.c-a.c);
  const top=`<dl class="tsum"><div><dt>수용 인원</dt><dd class="num">${cap.toLocaleString('ko-KR')}석</dd></div><div><dt>올해 홈 평균</dt><dd class="num">${A.n?Math.round(A.sum/A.n).toLocaleString('ko-KR')+'명':P.n?'예상 '+P.avg.toLocaleString('ko-KR')+'명':'-'}</dd></div><div><dt>좌석 점유율</dt><dd class="num">${A.n?Math.round(occ*100)+'%':'-'}</dd></div><div><dt>매진</dt><dd class="num">${A.so}회 / ${A.n}경기</dd></div></dl>
    <p class="small sdesc">시즌 예상 관중 ${P.att.toLocaleString('ko-KR')}명(홈 ${P.n}경기) · 표값 수입 ${money(P.ticket)}${P.fnb+P.prem+P.ad>0?` · 구장 부대 수입 ${money(P.fnb+P.prem+P.ad)}`:''}${P.up?` · 시설 유지비 ${money(P.up)}`:''}</p>`;
  const price=`<div class="eyebrow">티켓 가격</div><div class="chips">${PRICE.map((x,i)=>`<button data-a="stadPrice" data-v="${i}" class="${S.price===i?'on':''}">${x.l}</button>`).join('')}</div><p class="small sdesc">${PRICE[S.price].l}: ${PRICE[S.price].d} 언제든 바꿀 수 있고, 다음 홈경기부터 반영됩니다.</p>`;
  const yr=x=>x.ticket+x.fnb+x.prem+x.ad; const base=yr(stadProj(tid,true)); const gain={}; for(const it of STAD_ITEMS){ if(it.k==='turf'){ gain.turf=null; continue; } const lv=S.lv[it.k]; if(lv>=5){ gain[it.k]=0; continue; } S.lv[it.k]=lv+1; try{ gain[it.k]=Math.round(yr(stadProj(tid,true))-base); }finally{ S.lv[it.k]=lv; } }
  const gtxt=k=>gain[k]==null?'홈경기 부상 약 5% 감소':`연 수입 약 +${money(gain[k])}${k==='seat'?' · 팬 여론 상승':''}${(k==='seat'||k==='vis')&&gain[k]<200?' (매진이 잦아 효과 작음)':''}`;
  const items=STAD_ITEMS.map(it=>{ const lv=S.lv[it.k]; const b=(S.build||[]).find(x=>x.k===it.k); const nx=lv+1;
    return `<div class="stad-i"><div class="row between"><b>${it.l}</b><span class="lvdots">${[1,2,3,4,5].map(i=>`<i class="${i<=lv?'on':''}"></i>`).join('')}</span></div><p class="small sdesc">${it.d}</p>
      <div class="row between"><span class="small">${b?`${b.lv}단계 공사 중 · ${dmd(b.done)} 완공`:lv>=5?'최고 단계':`${nx}단계 공사비 <b class="num">${money(STAD_COST[nx])}</b> · ${STAD_DAYS[nx]}일 · 유지비 연 +${money(STAD_UP[nx]-STAD_UP[lv])} · 효과: ${gtxt(it.k)}`}</span>${!b&&lv<5?`<span class="row" style="gap:4px;flex-direction:column;align-items:flex-end"><button class="btn small${can?' primary':''}" data-a="stadBuild" data-v="${it.k}" ${can?'':'disabled'}>구단 현금으로 · ${money(STAD_COST[nx])}</button><button class="btn small" data-a="capex" data-v="stad:${it.k}">지자체 분담 협의 · ${Math.round(capexOdds('stad',STAD_COST[nx])*100)}%</button>${can?'':`<span class="small muted">${period()==='season'||period()==='post'?'시즌 중에는 공사 불가':team(G.user).cash<STAD_COST[nx]?'현금 부족':'공사 불가'}</span>`}</span>`:''}</div></div>`; }).join('');
  const lgT=`<table class="tbl"><thead><tr><th>구단</th><th class="num">평균</th><th class="num">점유율</th><th class="num">매진</th></tr></thead><tbody>${lg.map(x=>`<tr class="${x.t.id===tid?'me':''}"><td>${badge(x.t.id,16)} ${esc(tshort(x.t.id))}</td><td class="num">${x.n?x.avg.toLocaleString('ko-KR'):'-'}</td><td class="num">${x.n?Math.round(x.occ*100)+'%':'-'}</td><td class="num">${x.so}</td></tr>`).join('')}</tbody></table>`;
  const sv={cur:part||'now',bar:''};
  if(sv.cur==='now')return sv.bar+csec(esc(stadName(tid)),stadIsoPic(tid)+top+price);
  if(sv.cur==='fac')return sv.bar+csec('구장 시설',`<p class="small muted">구장은 시 소유이고 구단이 임대해 운영합니다. 공사는 시즌이 끝난 뒤(10월~2월)에 시작할 수 있고, 공사비는 보유 현금에서 바로 나갑니다.</p><p class="small">보유 현금 <b class="num">${money(team(tid).cash)}</b>${can?'':' · 지금은 시즌 중이라 공사를 시작할 수 없습니다.'}</p>${UI.stadMsg?`<div class="note bad">${esc(UI.stadMsg)}</div>`:''}<div class="stad-l">${items}</div>`);
  if(sv.cur==='new')return sv.bar+csec('신구장',(()=>{ const N=S.proj; const age=G.year-stadBuilt(tid); const head=(N?stadIsoPic(tid):'')+`<p class="small">${esc(stadName(tid))} · ${stadBuilt(tid)}년 개장(${age}년째)${age>=30?' · <b class="bad">노후 구장: 관중 수요 -4%</b>':age<3?' · 새 구장 효과로 관중 증가':''}</p>`;
      if(!N){ if(age<20)return head+'<p class="small sdesc">개장 20년이 지나야 신구장을 추진할 수 있습니다.</p>'; if(S.retry&&G.year<S.retry)return head+`<p class="small sdesc">협상이 결렬됐습니다. ${S.retry}년에 다시 시도할 수 있습니다.</p>`;
        return head+`<p class="small sdesc expl">시와 협상해 새 구장을 짓습니다. 시가 공사비 대부분을 내고 구단은 분담금(90억~160억)을 3년에 나눠 냅니다. 분담금의 70%는 모기업이 출자합니다. 협상은 6개월 걸리고, 구단주 신뢰·연고 시장 크기·단장 명성에 따라 성사 가능성이 달라집니다. 구단주 신뢰 45 이상 필요.</p><button class="btn primary" data-a="nsTalk">시에 신구장 협상 제안</button>`; }
      if(N.stage==='talk')return head+`<div class="note">협상 중 · ${dmd(N.res)}쯤 결과</div>`;
      if(N.stage==='plan')return head+`<div class="note good">시와 합의했습니다. 규모를 고르세요.</div><div class="stad-l">${NEWSTAD.map(o=>`<div class="stad-i"><b>${o.l} · ${o.cap.toLocaleString('ko-KR')}석</b><p class="small sdesc">${o.d} 공사 3년, 개장 후 시설은 모두 4단계 이상.</p><button class="btn small primary" data-a="nsPick" data-v="${o.k}">${o.l}으로 착공</button></div>`).join('')}</div>`;
      return head+`<div class="note">${NEWSTAD.find(o=>o.k===N.k).l} 신구장 공사 중 · ${dmd(N.done)} ${dobj(N.done).y}년 개장 예정 · 분담금 ${money(N.paid||0)} / ${money(N.cost)} 납부 · 공사 기간 관중 수요 -2%</div>`; })());
  return sv.bar+csec('리그 관중',lgT+'<p class="small muted">2025년 실제 한국 프로야구는 경기당 평균 17,101명, 좌석 점유율 82.9%였습니다.</p>');
}
/* ---------- 구단 연대기 ---------- */
const CHK={season:'시즌',trade:'트레이드',fa:'FA',draft:'신인 지명',found:'창단',mgr:'감독',stad:'구장',cap:'주장',award:'수상',star:'프랜차이즈',legend:'레전드',fired:'단장',join:'단장',spon:'스폰서'};
function chronView(){ const tid=G.user; const t=team(tid); const C=(G.chron||[]).filter(x=>x.tid===tid); const H=(G.history||[]).filter(h=>h.y>=2026);
  const champs=H.filter(h=>h.champ===tid).map(h=>h.y); const ps=C.filter(x=>x.k==='season'&&/진출|우승|준우승/.test(x.t)).length;
  const stars=domestic(tid).filter(p=>p.fr&&p.fr.tid===tid); const leg=(G.frLeg||[]).filter(x=>x.tid===tid); const cap=captainOf(tid);
  const ys=[...new Set(C.map(x=>x.y))].sort((a,b)=>b-a);
  const top=`<dl class="tsum"><div><dt>우승</dt><dd class="num">${champs.length}회${champs.length?` <span class="small muted">(${champs.join(', ')})</span>`:''}</dd></div><div><dt>가을야구</dt><dd class="num">${ps}회</dd></div><div><dt>기록된 시즌</dt><dd class="num">${ys.length}</dd></div></dl>
    <p class="small">주장 ${cap?`<button class="lnk" data-a="player" data-v="${cap.id}">${esc(cap.name)}</button>`:'없음'}${t.cap==null?'':''} · 프랜차이즈 스타 ${stars.length?stars.map(p=>`<button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button>`).join(', '):'아직 없음'}</p>
    ${leg.length?`<p class="small">은퇴한 프랜차이즈 스타: ${leg.map(x=>`${esc(x.name)}(${x.pos}, ${x.n}시즌·WAR ${x.war})`).join(', ')}</p>`:''}
    <p class="small sdesc expl">한 팀에서 5시즌 이상 뛰며 통산 WAR 12 이상을 쌓은 선수는 프랜차이즈 스타가 됩니다. 트레이드하면 팬들이 크게 반발하고, 은퇴하면 은퇴식을 엽니다. 영구결번은 OB·레전드 메뉴에서 정합니다. 주장은 선수단 투표로 뽑힙니다.</p>`;
  const yc=y=>{ const L=C.filter(x=>x.y===y); const se=L.find(x=>x.k==='season'); const rest=L.filter(x=>x.k!=='season');
    return `<div class="chy"><div class="chy-h"><b>${y}</b><span>${se?esc(se.t):'진행 중'}</span>${champs.includes(y)?'<span class="pill good">우승</span>':''}</div>${(()=>{ const R=G.reviews&&G.reviews[y]; return R&&R.tid===tid?`<details class="mfold chrev"><summary>${y} 시즌 회고</summary>${R.L.map(l=>`<p class="small">${lk(l)}</p>`).join('')}</details>`:''; })()}${rest.length?`<ul>${rest.map(x=>`<li><i>${CHK[x.k]||x.k}</i>${x.ref!=null&&G.players[x.ref]?`<button class="lnk" data-a="player" data-v="${x.ref}">${esc(x.t)}</button>`:esc(x.t)}</li>`).join('')}</ul>`:''}</div>`; };
  return csec(`${esc(t.city)} ${esc(t.nick)} 연대기`,top)+csec('해마다 일어난 일',ys.length?ys.map(yc).join(''):'<p class="small muted">아직 기록이 없습니다. 시즌을 치르며 트레이드·지명·FA·수상·감독 교체가 여기에 쌓입니다.</p>'); }
function clubView(){ return subTabs('club')+clubBody(curSub('club')); }
function clubBody(s){
  const H0={auth:authView,rel:relView,ob:obView,owner:()=>gmCardView()+prestigeCard()+ownerView()+starPanel()+ownerAskView(),media:mediaView,fans:fanBoard,news:ourNewsView,fin:moneyView,spon:sponView,stad:()=>stadView('now'),inv:invView,chron:chronView,ach:achView,
    result:()=>G.last?csec(`${G.last.y} 시즌 결산`,resultBody()):csec('시즌 결산','<p class="small muted">첫 시즌을 마치면 결산이 올라옵니다.</p>'),
    mkt:()=>csec('마케팅 예산',period()==='pre'?marketingBody():`<p>올 시즌 예산 <b class="num">${money(G.marketing)}</b></p><p class="small muted">마케팅 예산은 개막 전(스프링캠프 기간)에만 바꿀 수 있습니다.</p>`),
    log:()=>csec('구단 일지',`<div class="log">${G.log.filter(l=>!/만료되었습니다|만료됐습니다/.test(l.t)).slice(0,60).map(l=>`<p><span class="ticker">${l.d!=null?`${String(l.y).slice(2)}년 ${dsh(l.d)}`:l.y}</span> ${lk(l.t)}</p>`).join('')||'<p class="small muted">기록이 없습니다.</p>'}</div>`),
    set:()=>`<section class="card"><div class="row between"><span class="small muted">버전 ${GAME_VER} · 진행 상황은 자동 저장됩니다.</span><button class="btn small" data-a="toTitle">처음 화면으로</button></div></section>`+slotsCard(false)+exportCard()+devCard()+`<section class="card">${creditsLine()}</section>`+`<section class="card"><h2 class="sec">영구결번 기준</h2><div class="chips">${[[40,'WAR 40 · 8시즌'],[60,'WAR 60 · 10시즌'],[100,'WAR 100 · 10시즌']].map(([v,l])=>`<button data-a="retWar" data-v="${v}" class="${retWarT()===v?'on':''}">${l}</button>`).join('')}</div><p class="small muted">우리 구단에서 쌓은 WAR와 시즌 수가 기준을 넘는 선수가 은퇴할 때 영구결번을 지정할 수 있습니다. 이 게임의 시즌 WAR는 리그 1위가 7~9 정도라, 100은 15년 내내 리그 최상위급이어야 닿는 수치입니다.</p></section>`+`<section class="card"><h2 class="sec">게임 관리</h2><p class="small muted">진행 상황은 이 브라우저의 현재 슬롯에 자동 저장됩니다(압축 저장). 선수 얼굴은 faces.js(ZenGM, Apache License 2.0), 메뉴 아이콘은 Lucide(ISC), 저장 압축은 lz-string(MIT)을 썼습니다. 효과음: 관중 함성·관중석 소리 Gregor Quendel "Free Crowd Cheering Sounds"(CC-BY 4.0, OpenGameArt), 타격음 Jordan Irwin "Thwack Sounds"(CC0), 미트·알림음 Kenney(CC0). 구단 엠블럼·경기장·트로피 그림과 오르간·사이렌 소리는 이 게임을 위해 직접 만든 것입니다.</p>
    ${UI.confirmNew?`<div class="note bad">지금 구단을 포기하고 새로 시작합니다. 저장된 진행이 지워집니다.</div><div class="row"><button class="btn danger" data-a="newgame">새로 시작</button><button class="btn" data-a="cancelNew">취소</button></div>`:`<button class="btn" data-a="askNew">새 게임</button>`}</section>`}; const h=mergedBody('club',s,H0);
  return h;
}
/* 설정 · 권한: 구단 메뉴에서 빼서 톱니(사이드바 아래·전체 메뉴 아래)로 */
function cfgView(){ const s=curSub('cfg'); return subTabs('cfg')+clubBody(s==='auth'?'auth':'set'); }
function gamesView(){
  if(!G.games.length)return csec('우리 경기','<p class="small muted">아직 치른 경기가 없습니다.</p>');
  return csec('우리 경기',`<div class="list">${G.games.slice(0,30).map((g,i)=>{ const home=g.home===G.user; const op=home?g.away:g.home; return `<button class="item wa" data-a="openGame" data-v="${i}">${badge(op,26)}<span class="nm"><span class="pill ${g.res==='승'?'good':g.res==='패'?'bad':''}">${g.res}</span> ${home?'vs':'@'} ${tname(op)}${g.kind?` <span class="small muted">${esc(g.kind)}</span>`:''}</span><span class="sub">${dmd(g.day)}${g.inn>9?` · 연장 ${g.inn}회`:''}</span><span class="rt num">${home?g.hs:g.as} : ${home?g.as:g.hs}</span></button>`; }).join('')}</div>`);
}

function tradeMood(tid,give,get,cash){
  if(!give.length&&!get.length)return null;
  const t=team(tid); const e=evalTrade(tid,give,get,cash);
  const sd=1.2+Math.max(0,75-t.rel)/10; // 관계가 좋을수록 상대 속내를 정확히 읽는다
  const key=[...give].sort((a,b)=>a-b).join('-')+'|'+[...get].sort((a,b)=>a-b).join('-');
  const x=e.gain-e.need+hn('tm'+tid+'|'+key,G.year)*sd;
  const lv=x>=3?{l:'받아들일 것 같습니다',c:'var(--good)'}:x>=0?{l:'긍정적으로 검토할 것 같습니다',c:'var(--r50)'}:x>=-4?{l:'조금 더 원할 것 같습니다',c:'var(--warn)'}:x>=-12?{l:'많이 부족하다고 볼 것 같습니다',c:'var(--r35)'}:{l:'불쾌하게 여길 수 있습니다',c:'var(--bad)'};
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
  const strip=`<div class="tstrip">${G.teams.filter(t=>t.id!==G.user).map(t=>`<button data-a="tpartner" data-v="${t.id}" class="${tr.tid===t.id?'on':''}">${gmAv(t.id)}<span><b>${badge(t.id,14)} ${esc(t.city+' '+t.nick)}</b><i>${esc(gmOf(t.id).name)} · ${GMT[gmOf(t.id).trait].l} · 친분 ${t.rel}</i><em class="${negInfo(t.id).free?'free':negInfo(t.id).left?'':'out'}">${negInfo(t.id).free?'맞대결 · 제한 없음':`이번 달 ${negInfo(t.id).left}/${negInfo(t.id).cap}`}</em></span></button>`).join('')}</div>`;
  if(tr.tid==null){ const gv0=tr.give.map(id=>G.players[id]).filter(p=>p&&p.team===G.user);
    return `${gv0.length?`<section class="card"><div class="eyebrow">보낼 선수 · ${gv0.length}명</div>${gv0.map(p=>tmini(p,'give')).join('')}<p class="small muted">이제 아래에서 협상할 구단을 고르세요.</p></section>`:''}<section class="card"><div class="eyebrow">상대 구단</div>${strip.replace('class="tstrip"','class="tstrip grid"')}<p class="small muted">상대 구단을 고르면 그 팀 선수 목록이 펼쳐집니다. 관계 숫자가 높을수록 상대 단장의 반응을 정확히 읽을 수 있습니다.</p></section>`; }
  const t=team(tr.tid);
  const ok=p=>p&&!p.foreign&&!(p.joinY>G.year);
  tr.give=tr.give.filter(id=>ok(G.players[id])&&G.players[id].team===G.user);
  tr.get=tr.get.filter(id=>ok(G.players[id])&&G.players[id].team===tr.tid);
  const gv=tr.give.map(id=>G.players[id]), gt=tr.get.map(id=>G.players[id]);
  const dPay=sum(gt.map(p=>p.sal))-sum(gv.map(p=>p.sal));
  const capAfter=capPay(G.user)+dPay, cap=capOf(G.year);
  const myN=playersOf(G.user).length-gv.length+gt.length, thN=playersOf(tr.tid).length+gv.length-gt.length;
  const mood=tradeMood(tr.tid,tr.give,tr.get,tr.cash||0);
  const want=tr.want&&G.players[tr.want]&&G.players[tr.want].team===G.user&&!tr.give.includes(tr.want)?G.players[tr.want]:null;
  const board=`<section class="card tboard">
    <div class="tgm">${gmAv(t.id,mood?(mood.l.includes('받아들일')?'smile':mood.l.includes('긍정')?null:mood.l.includes('조금')?'flat':'angry'):null)}<div><b>${badge(t.id,16)} ${esc(tname(t.id))} · ${esc(gmOf(t.id).name)} 단장</b><span class="small muted">${GMT[gmOf(t.id).trait].l} · 친분 ${t.rel}(${relLabel(t.rel)}) · ${esc(needText(t.id))}</span></div></div>
    ${(()=>{ if(!interestKnown(t.id))return '<p class="small muted">친분이 35 미만이라 상대가 우리 누구를 원하는지 읽기 어렵습니다.</p>'; const L=aiInterest(t.id).map(id=>G.players[id]).filter(Boolean); return L.length?`<div class="intl"><span class="small muted">상대가 원하는 우리 선수</span>${L.map(p=>`<button class="pill ${tr.give.includes(p.id)?'acc':'good'}" data-a="tpick" data-v="give:${p.id}">${tr.give.includes(p.id)?'보냄 ':'+ '}${esc(p.name)} · ${esc(interestWhy(t.id,p))}</button>`).join('')}</div><p class="small muted">이 선수를 넣으면 상대가 20% 더 높게 쳐 주고 요구 조건도 조금 낮아집니다.</p>`:''; })()}
    <div class="tcols">
      <div><div class="eyebrow">보냄 · ${gv.length}명</div>${gv.map(p=>tmini(p,'give')).join('')||'<button class="btn small tempty" data-a="tsideGo" data-v="give">우리 선수에서 고르기</button>'}</div>
      <div><div class="eyebrow">받음 · ${gt.length}명</div>${gt.map(p=>tmini(p,'get')).join('')||'<button class="btn small tempty" data-a="tsideGo" data-v="get">상대 선수에서 고르기</button>'}</div>
    </div>
    <dl class="tsum"><div><dt>연봉 변화</dt><dd class="num" style="color:${dPay>0?'var(--warn)':dPay<0?'var(--good)':'inherit'}">${dPay>=0?'+':''}${money(dPay)}</dd></div><div><dt>트레이드 후 캡</dt><dd class="num" style="color:${capAfter>cap?'var(--bad)':'inherit'}">${money(capAfter)} / ${money(cap)}</dd></div><div><dt>로스터</dt><dd class="num">우리 ${myN} · 상대 ${thN}</dd></div></dl>
    ${mood?`<div class="tmood"><div class="row between"><span class="small muted">상대 단장 반응 예상</span><b style="color:${mood.c}">${mood.l}</b></div><div class="tbarm"><span style="width:${mood.w}%;background:${mood.c}"></span><i></i></div><p class="small muted">관계 ${t.rel} 기준 예측입니다. ${mood.sd>3.5?'관계가 낮아 오차가 큽니다.':'비교적 정확합니다.'}</p></div>`:''}
    ${tr.msg?`<div class="note ${tr.ok?'good':''}">${esc(tr.msg)}${want?` <button class="btn small" data-a="tpick" data-v="give:${want.id}">${esc(want.name)} 얹기</button>`:''}</div>`:''}
    ${tr.counters&&tr.counters.length?`<div class="ctr"><span class="eyebrow">역제안</span>${tr.counters.map((c,i)=>`<div class="ctr-o"><p>${esc(c.why)}</p><span class="small muted">보냄 ${c.give.map(id=>G.players[id]?G.players[id].name:'?').join(', ')||'-'} · 받음 ${c.get.map(id=>G.players[id]?G.players[id].name:'?').join(', ')||'-'}</span><button class="btn small primary" data-a="tcounter" data-v="${i}">이 조건 수락</button></div>`).join('')}</div>`:''}
    ${tradeInsight(tr.tid,tr.give,tr.get)}
    ${gt.length?`<div class="tcash"><span class="small">현금 얹기</span><div class="chips">${[0,100,300,500,1000,2000,3000].map(v=>`<button data-a="tcash" data-v="${v}" class="${(tr.cash||0)===v?'on':''}">${v?money(v):'없음'}</button>`).join('')}</div><span class="small muted">실제 한국 프로야구도 선수와 현금을 섞은 트레이드가 있습니다. 돈을 중시하는 구단(독립구단·수익형 구단주·샐러리캡 초과·리빌딩)일수록 현금을 높게 칩니다. 예산 여유에서 빠집니다.</span></div>`:''}
    ${(()=>{ const ni=negInfo(tr.tid); const nt=negTurn(tr.tid); const sg=tsig(tr.give,tr.get,tr.cash||0); const isC=nt.ctr&&nt.ctr[sg]===G.day; const dup=!isC&&(gv.length||gt.length)&&nt.seen[sg]!=null; const left=ni.left||isC; return `<div class="row"><button class="btn primary" data-a="tpropose" ${(gv.length||gt.length)&&left&&!dup?'':'disabled'}>제안하기</button><button class="btn" data-a="treset">비우기</button>${negChip(tr.tid)}</div>${dup?'<p class="small" style="color:#ffb547">이미 거절된 안과 같습니다. 선수를 바꾸거나 더해야 제안할 수 있습니다.</p>':''}`; })()}
  </section>`;
  const side=tr.side||'get', seg=tr.seg||'bat', sort=tr.sort||'cur';
  let pool=(side==='get'?domestic(tr.tid):domestic(G.user)).filter(p=>ok(p)&&(seg==='bat'?!p.isP:p.isP)).map(p=>({p,rp:scoutReport(p)}));
  const sf={cur:(a,b)=>(b.rp.cur??-1)-(a.rp.cur??-1)||(b.rp.ofp??0)-(a.rp.ofp??0),fut:(a,b)=>(b.rp.ofp??0)-(a.rp.ofp??0)||(b.rp.cur??-1)-(a.rp.cur??-1),sal:(a,b)=>b.p.sal-a.p.sal,age:(a,b)=>a.p.age-b.p.age}[sort];
  pool.sort(sf); const INT=side==='give'&&interestKnown(tr.tid)?aiInterest(tr.tid):[]; if(INT.length)pool.sort((a,b)=>(INT.includes(b.p.id)?1:0)-(INT.includes(a.p.id)?1:0));
  const sel=tr[side]; const PGt=pager('tpool'+side+seg+sort+tr.tid,pool,wide()?16:12);
  const poolCard=`<section class="card">
    <div class="seg" id="tpick"><button data-a="tside" data-v="get" class="${side==='get'?'on':''}">상대 선수 (${esc(t.city+' '+t.nick)})</button><button data-a="tside" data-v="give" class="${side==='give'?'on':''}">우리 선수</button></div>
    <div class="row between wrapr"><div class="seg sm"><button data-a="tseg" data-v="bat" class="${seg==='bat'?'on':''}">야수</button><button data-a="tseg" data-v="pit" class="${seg==='pit'?'on':''}">투수</button></div>
    <div class="chips">${[['cur','현재순'],['fut','잠재력순'],['sal','연봉순'],['age','나이순']].map(([k,l])=>`<button data-a="tsort" data-v="${k}" class="${sort===k?'on':''}">${l}</button>`).join('')}</div></div>
    <p class="small muted">"${side==='get'?'받기':'보내기'}"를 누르면 위 협상안에 올라갑니다. 이름을 누르면 선수 정보가 열립니다. 현재 능력은 정확한 값이고, 잠재력은 우리 선수와 프로 담당 스카우트가 있는 지역 구단만 보입니다. 외국인 선수와 올해 입단 신인은 제외됩니다.</p>
    <div class="trws" data-pg="tpool${side}${seg}${sort}${tr.tid}"><div class="trw-h"><span>선수</span><span>현재 · 잠재력</span><span></span></div>${PGt.items.map(({p})=>trow(p,side,sel.includes(p.id),INT.includes(p.id)?interestWhy(tr.tid,p):'')).join('')||'<p class="small muted">대상 선수가 없습니다.</p>'}</div>${PGt.bar}
  </section>`;
  return `<section class="card"><div class="eyebrow">상대 구단</div>${strip}</section><div class="tlay">${board}${poolCard}</div>`;
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
  const P=G.ps; const rows=[]; for(const k of ['wc','spo','po','ks']){ const r=P.res[k]; if(r)rows.push(`<div class="item" style="cursor:default"><span class="nm">${ROUNDK[k]}</span><span class="sub">${tname(r[0])} ${r[2]}-${r[3]} ${tname(r[1])}</span></div>`); }
  const s=P.cur; if(s)rows.push(`<div class="item" style="cursor:default"><span class="nm">${ROUNDK[s.round]} 진행 중</span><span class="sub">${tname(s.hi)} ${s.wh}-${s.wl} ${tname(s.lo)} · 다음 경기 ${dmd(s.days[s.gi])}</span></div>`);
  return `<div class="list">${rows.join('')}</div><p class="small muted">정규시즌 1~5위가 진출합니다. 4위는 와일드카드에서 1승만 하면 올라갑니다. 한국시리즈는 2-3-2 방식입니다.</p>`;
}
function resultBody(){ return champHero()+resultBody0(); }
function champHero(){ const L=G.last; if(!L)return ''; const h=G.history.find(x=>x.y===L.y); if(!h||h.champ!==G.user)return ''; const n=G.history.filter(x=>x.champ===G.user&&x.y<=L.y).length;
  return `<div class="champ-hero">${ART.trophy(96)}<div><span class="eyebrow">${L.y} 한국시리즈</span><b>${esc(tname(G.user))} 우승</b><span>구단 통산 ${n}번째 우승</span></div></div>`; }
function resultBody0(){
  const L=G.last; const ps=L.ps; const f=L.fins[G.user]; const uo=L.order.find(o=>o.tid===G.user);
  const rank=L.order.findIndex(o=>o.tid===G.user)+1; const tr=L.trust;
  const psRow=(label,s)=>s?`<div class="item" style="cursor:default"><span class="nm">${label}</span><span class="sub">${tname(s[0])} ${s[2]}-${s[3]} ${tname(s[1])}</span></div>`:'';
  return `<p><b>${recStr(uo)} · ${rank}위</b> · ${ps.champ===G.user?'한국시리즈 우승':rank<=5?'가을야구 진출':'가을야구 탈락'}</p>
    <div class="months">${(L.months||[]).map(x=>`<div><span>${x.m}</span><b>${x.w}-${x.l}${x.t?`-${x.t}`:''}</b></div>`).join('')}${(()=>{ const M=L.months||[]; if(!M.length)return ''; const w=sum(M.map(x=>x.w)), l=sum(M.map(x=>x.l)), t=sum(M.map(x=>x.t||0)); return `<div class="tot"><span>합계</span><b>${w}-${l}${t?`-${t}`:''}</b></div>`; })()}</div>
    <p class="small">구단주 신뢰 ${tr.before} → <b>${tr.after}</b> <span class="pill ${tr.delta>=0?'good':'bad'}">${tr.delta>=0?'+':''}${tr.delta}</span></p>
    ${L.notes.map(n=>`<div class="note bad">${esc(n)}</div>`).join('')}
    ${L.awards&&awShown(L.awards,'mvp')?`<div class="eyebrow">시상</div><p class="small">MVP ${L.awards.mvp?esc(L.awards.mvp.name)+'('+tshort(L.awards.mvp.t)+')':'-'} · 신인왕 ${L.awards.roy?esc(L.awards.roy.name)+'('+tshort(L.awards.roy.t)+')':'-'} · 우리 골든글러브 ${!awShown(L.awards,'gg')?'12월 발표':Object.values(L.awards.gg).filter(x=>x.t===G.user).map(x=>esc(x.name)).join(', ')||'없음'}</p>`:''}
    ${L.goals&&L.goals.length?`<div class="eyebrow">구단주 목표 평가</div><div class="list">${L.goals.map(g=>`<div class="item" style="cursor:default"><span class="nm">${esc(g)}</span></div>`).join('')}</div>`:''}${L.pr?`<p class="small">시즌 말 팬 여론 ${L.pr.fan} · 언론 논조 ${L.pr.press}</p>`:''}
    <div class="eyebrow">포스트시즌</div><div class="list">${psRow('와일드카드',ps.wc)}${psRow('준플레이오프',ps.spo)}${psRow('플레이오프',ps.po)}${psRow('한국시리즈',ps.ks)}</div>
    <p class="small muted">포스트시즌 입장 수입 ${money(L.gate)} 중 운영비를 뺀 ${money(L.pool)}을 배당. 정규시즌 1위 20%, 나머지는 우승 50%, 준우승 24%, 플레이오프 14%, 준플레이오프 9%, 와일드카드 3%.</p>
    <div class="eyebrow">결산</div>${finTable(f)}
    <div class="eyebrow">시즌 리더</div><div class="list">${L.leaders.map(l=>{const p=G.players[l.id]; return `<button class="item" data-a="player" data-v="${l.id}" ${p?'':'disabled'}><span class="nm">${l.k} · ${esc(l.nm||(p?p.name:'은퇴 선수'))}</span><span class="sub">${l.t!=null&&G.teams[l.t]?tname(l.t):p&&p.team!=null?tname(p.team):''}</span><span class="rt num">${l.v}</span></button>`}).join('')}</div>`;
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
    return `<div class="salr"><div class="salr-h"><button class="lnk" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b></button><span class="small muted">${posLabel(p)} · ${p.age}세 · ${p.svc}년차${(p.svc||0)>=ARB_SVC&&!(dobj(G.day).m<=3&&G.day>KD(1,10))?' · 조정 신청 가능':''} · ${hasAgent(p)?`협상 ${esc(agentOf(p).name)} 에이전트`:'본인 협상'}</span>${pfa?'<span class="pill acc">예비 FA</span>':''}${st}</div>
      ${pfa?`<p class="small salr-fa">다음 시즌 뒤 FA입니다. 지금 연봉 순위로는 ${pc.g}등급 예상. 이 연봉(${money(shown)})이면 다른 구단이 데려갈 때 보상금 ${pc.withP?`${money(pc.withP)}+선수 1명 또는 `:''}${money(pc.cash)}을 받습니다. 연봉을 올리면 보상금이 커져 다른 구단이 쉽게 못 데려가고, 선수도 붙잡으려는 뜻으로 받아들입니다.</p>`:''}
      <div class="salr-b"><span><i>직전 시즌</i><b>${b.h?(()=>{ const t=statLine(b.h,p); return /WAR/.test(t)?t:`${t} · WAR ${b.war.toFixed(1)}`; })():'1군 기록 없음'}</b><em>${b.band} · 인상 상한 +${b.cap}%</em></span><span><i>연봉</i><b class="num">${money(p.sal)} → ${money(n.st==='ok'?p.newSal:(n.cur??n.off))}</b><em class="${d>0?'warn':d<0?'good':''}">${d>=0?'+':''}${p.sal?Math.round(d/p.sal*100):0}% · 산정안 ${money(n.off)}</em></span></div>
      <div class="row salr-a">${acts}${n.st==='open'&&!lock?`<button class="btn small" data-a="ngtOpen" data-v="sal:${p.id}">협상 테이블</button>`:''}<button class="btn small danger" data-a="relNow" data-v="${p.id}">방출</button></div></div>`; };
  return `<div class="eyebrow">국내 선수 연봉 협상 · 미합의 ${open.length}명</div>
    ${fresh.length?`<button class="btn primary block" data-a="salOffAll">구단 산정안으로 ${fresh.length}명에게 일괄 제시</button>`:''}
    <details class="frule"><summary class="small">연봉 산정 기준 보기</summary><div class="small">
      <p><b>1. 직전 시즌 1군 WAR로 인상 폭 상한을 정합니다.</b> WAR 0 이하 +10%, 1이면 +45%, 2이면 +80%, 3이면 +115%, 5 이상이면 +190%까지. 1군 표본이 적으면(타자 120타석, 투수 25이닝 미만) 15% 안에서만 움직입니다.</p>
      <p><b>2. 같은 연차·능력의 보류권 기준액 쪽으로 맞춥니다.</b> FA 시장가의 3년 미만 14%, 6년 미만 22%, FA 직전 32%. 연차별 최고 기록(4년차 5억 등)을 넘지 않습니다.</p>
      <p><b>3. 잘한 선수는 깎지 않습니다.</b> WAR 3 이상 5% 이상 인상, 2 이상 동결 이상. 부진하면 깎습니다. 실제 한국 프로야구 규약의 삭감 제한은 2008년에 없어졌고, 구단 관행상 3억 미만은 최대 40%, 3억 이상은 최대 50%까지 깎습니다(김도영 5억→2.5억).</p>
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
    <p>국내 선수 ${ended.length}명은 직전 시즌 성적으로 구단이 산정한 연봉안을 단장이 제시하고, 외국인 ${fEnd.length}명은 재계약 여부를 정합니다. 1월 31일까지 계약하지 못한 선수는 구단의 마지막 제시액에 사인합니다.</p>
    <p class="small">국내 선수 인상 총액(현재 합의·제시 기준) <b class="num">${raise>=0?'+':''}${money(raise)}</b></p>
    ${UI.ctMsg?`<div class="note ${/넘습니다|거절/.test(UI.ctMsg)?'bad':''}">${esc(UI.ctMsg)}</div>`:''}
    <button class="btn primary block" data-a="confirmContracts">연봉 계약 확정</button>
    ${fEnd.length?`<div class="eyebrow">외국인 재계약</div>${(()=>{ const f=fReCapInfo(); const keep=fEnd.filter(p=>!C.foreignDrop.includes(p.id)); const dRaise=sum(keep.map(p=>p.newSal-p.sal)); let room=null; try{ room=budget().roomGoal; }catch(e){}
  return f?`<p class="small ${f.over>0?'bad':''}"><b>외국인 선수 3명 총액 ${money(f.tot)} / 리그 한도 ${money(f.cap)}</b> (${Math.round(f.tot/USD)}만 / ${Math.round(f.cap/USD)}만 달러)${f.over>0?` · ${money(f.over)} 초과: 결별하거나 깎아서 협상해야 확정됩니다`:''}</p><p class="small">재계약 인상 합계 <b class="${dRaise>0?'bad':'good'}">${dRaise>=0?'+':''}${money(dRaise)}</b>${room!=null?` · 예산 여유 ${money(room)} → <b class="${room-dRaise<0?'bad':''}">${money(room-dRaise)}</b>${room-dRaise<0?' (구단주 지원 한도를 넘습니다)':''}`:''}</p>`:''; })()}<p class="small muted">잘한 선수는 더 달라고 합니다(최대 1.7배). 재계약은 100만 달러 상한이 없지만 3명 총액 한도(인센티브 포함)가 있습니다. 보류권: 우리가 재계약을 제안한 외국인은 국내 다른 구단과 협상할 수 없어서, 경쟁 상대는 해외 제안뿐입니다. 제안은 세 번까지이고 끝내 거절하면 선수는 해외로 떠나며 5년 동안 국내 다른 구단에 갈 수 없습니다. 결별할 때 보류권을 풀어 주면 시장에 나와 다른 구단이 데려갈 수 있습니다.</p><div class="list">${fEnd.map(p=>{const drop=C.foreignDrop.includes(p.id); return `<div class="item" style="cursor:default"><button class="nm lnk" data-a="player" data-v="${p.id}">${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세</span></button><span class="sub">${statLine(curLine(p),p)}</span><span class="rt"><span class="num">${money(p.sal)} → <b>${money(p.newSal)}</b></span><br>${(()=>{ const N=(C.fre||{})[p.id]; return !drop&&!(N&&N.ok)?`<button class="btn small primary" data-a="foRe" data-v="${p.id}">재계약 협상</button> `:N&&N.ok?`<span class="pill good">합의${p.fInc?` · 인센티브 ${usdT(p.fInc)}`:''}</span> `:''; })()}${p.fleft?'<span class="pill bad">떠남 · 보류권 유지</span>':`<button class="btn small ${drop?'':'danger'}" data-a="fdrop" data-v="${p.id}">${drop?'재계약으로 변경':'결별'}</button>${drop?` <button class="btn small" data-a="ffree" data-v="${p.id}">${(C.fFree||[]).includes(p.id)?'보류권 해제(다른 구단 가능)':'보류권 유지(5년 국내 이적 불가)'}</button>`:''}`}</span>`}).join('')}</div>`:''}
    ${salTalkView(ended)}
  </section>`;
}
