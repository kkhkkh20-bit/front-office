/* ---------- 업무 탭 ---------- */
function upcoming(){
  const c=G.cal, y=G.year, d=G.day; const L=[];
  const add=(n,t)=>{ if(n>d)L.push([n,t]); };
  add(c.camp,'스프링캠프 시작'); add(c.campEnd,'캠프 종료'); add(c.exh,'시범경기'); add(c.open,'개막'); add(c.asg,'올스타전');
  add(tradeDL(),'트레이드 마감'); add(foreignDL(),'외국인 등록 마감'); add(c.draft,'신인 드래프트'); add(c.end,'정규시즌 종료');
  if(G.ps&&G.ps.cur)add(G.ps.cur.days[G.ps.cur.gi],ROUNDK[G.ps.cur.round]+' '+(G.ps.cur.gi+1)+'차전');
  add(KD(11,2),'FA 공시'); add(KD(12,1),'연봉 협상 시작'); add(dnum(y+1,1,1),'새해');
  return L.sort((a,b)=>a[0]-b[0]).slice(0,3);
}
function nextGameText(){
  const c=G.cal; for(let n=G.day+1;n<=c.end;n++){ const gs=c.sched[n]; if(!gs)continue; const m=gs.find(x=>x.includes(G.user)); if(m){ const home=m[0]===G.user; return `${dmd(n)} ${home?'홈':'원정'} · ${tname(home?m[1]:m[0])}`; } }
  return '';
}
function calendarCard(){
  const per=period(); const la=G.lastAdv; const hid=liveHidden();
  const ng=per==='season'||per==='pre'?nextGameText():'';
  return `<section class="card"><div class="row between"><h2 class="sec">일정</h2><span class="row"><span class="small muted">${dstr(G.day)}</span><button class="btn small" data-a="calOpen">캘린더</button></span></div>
    ${ng?`<p class="small">다음 경기 <b>${ng}</b></p>`:''}
    <div class="log">${upcoming().map(([n,t])=>`<p><span class="ticker">D-${n-G.day}</span> ${dmd(n)} · ${t}</p>`).join('')}</div>
    ${la&&la.days?`<p class="small muted">지난 진행 ${la.days}일${la.w+la.l&&!hid?` · ${la.w}승 ${la.l}패`:''}${G.stops.length?' · 중요한 소식이 와서 멈췄습니다':''}</p>`:'<p class="small muted">오른쪽 위 계속 버튼을 누르면 다음 일정까지 시간이 흐릅니다.</p>'}
  </section>`;
}
function lineScore(g,upto,cur){ // cur: 진행 중인 반 이닝 {half,r,h}
  const n=Math.max(9,g.line.a.length,g.line.h.length); const cols=[...Array(n).keys()];
  const cell=(k,i)=>{ const half=i*2+(k==='h'?1:0); if(cur&&half===cur.half)return `<b>${cur.r}</b>`; if(upto!=null&&half>=upto)return '·'; const v=g.line[k][i]; return v==null?'':v; };
  const tot=(k)=>{ if(upto==null)return [k==='h'?g.hs:g.as, sum(g.hits[k])]; let r=0,h=0; for(let i=0;i<n;i++){ const half=i*2+(k==='h'?1:0); if(half<upto){ const v=g.line[k][i]; if(typeof v==='number')r+=v; h+=g.hits[k][i]||0; } else if(cur&&half===cur.half){ r+=cur.r; h+=cur.h; } } return [r,h]; };
  const row=(k,tid)=>{ const [r,h]=tot(k); return `<tr class="${tid===G.user?'me':''}"><td>${tshort(tid)}</td>${cols.map(i=>`<td>${cell(k,i)}</td>`).join('')}<td class="key">${r}</td><td>${h}</td></tr>`; };
  return `<div class="tw"><table class="ls"><thead><tr><th></th>${cols.map(i=>`<th>${i+1}</th>`).join('')}<th class="key">R</th><th>H</th></tr></thead><tbody>${row('a',g.away)}${row('h',g.home)}</tbody></table></div>`;
}
function liveCard(){
  if(!G.live)return ''; const g=G.games[G.live.i]; if(!g){G.live=null;return '';}
  const total=g.line.a.length+g.line.h.length; const up=Math.min(G.live.upto,total); const done=up>=total;
  const inn=Math.floor(up/2)+1, top=up%2===0;
  const evs=g.ev.filter(e=>e.h<up).slice(-8).reverse();
  return `<section class="card hero"><div class="row between"><span class="eyebrow">${esc(g.kind||'경기')} · ${dmd(g.day)}</span><span class="pill ${done?(g.res==='승'?'good':g.res==='패'?'bad':''):'warn'}">${done?`경기 종료 · ${g.res}`:`${inn}회${top?'초':'말'} 시작 전`}</span></div>
    <h2 class="sec">${tname(g.away)} 대 ${tname(g.home)}</h2>
    ${lineScore(g,done?null:up)}
    <div class="log">${evs.map(e=>`<p><span class="ticker">${Math.floor(e.h/2)+1}회${e.h%2?'말':'초'}</span> ${esc(e.t)}</p>`).join('')||'<p class="small muted">아직 득점이 없습니다.</p>'}</div>
    ${done?`<div class="btns"><button class="btn" data-a="openGame" data-v="${G.live.i}">박스스코어</button><button class="btn primary" data-a="liveDone">확인</button></div>`:`<div class="btns"><button class="btn primary" data-a="liveNext">다음 이닝</button><button class="btn" data-a="liveEnd">경기 끝까지</button></div>`}
  </section>`;
}
function offersCard(){
  const OS=(G.offers||[]).filter(o=>!o.blk); if(!OS.length)return '';
  return OS.map(offerOne).join('');
}
function offerOne(o){ { const t=team(o.from); const li=id=>{const p=G.players[id]; return p?pcard(p,{foot:rosterFoot(p)}):''};
    return `<section class="card hero"><div class="row between"><span class="eyebrow">트레이드 제안 · ${dmd(o.exp)}까지</span><span class="small muted">관계 ${t.rel}</span></div>
    <h2 class="sec">${tname(o.from)}</h2>
    <div class="tcols2"><div><div class="eyebrow">받는 선수</div><div class="tgrid">${o.give.map(li).join('')}</div></div><div><div class="eyebrow">보내는 선수</div><div class="tgrid">${o.get.map(li).join('')}</div></div></div>
    ${offerAdvBox(o)}
    <div class="btns"><button class="btn primary" data-a="offerYes" data-v="${o.id}">수락</button><button class="btn" data-a="offerNo" data-v="${o.id}">거절</button></div></section>`; }
}
function campCard(){
  if(!G.camp||G.camp.done)return '';
  return `<section class="card hero" data-k="스프링캠프"><span class="eyebrow">스프링캠프 · 3월 5일 종료</span><h2 class="sec">훈련 방향</h2>
    <div class="seg">${Object.entries(CAMP).map(([k,l])=>`<button data-a="camp" data-v="${k}" class="${G.camp.focus===k?'on':''}">${l}</button>`).join('')}</div>
    <p class="small muted">${{balance:'젊은 선수 성장과 부상 방지를 조금씩 챙깁니다.',skill:'26세 이하 선수의 기술이 늘어납니다.',fitness:'올 시즌 부상 위험이 줄어듭니다.',game:'4월까지 경기 감각이 올라갑니다.'}[G.camp.focus]}</p></section>`;
}
function avImg(o,big){ const src=faceSVG(o); const nm=o==='sec'?SEC:(o.name||'?'); return src?`<img class="av${big?' big':''}" src="${src}" alt="">`:`<span class="av ini${big?' big':''}">${esc(nm.slice(0,1))}</span>`; }
const PERSONA={'구단주실':['own',63,false],'재무팀':['staff',41,false],'홍보팀':['staff',36,true],'마케팅팀':['staff',33,true],'운영팀':['staff',44,false],'스카우트팀장':['staff',53,false],'전력분석팀':['staff',31,false],'팀 닥터 · 의무팀':['doc',49,false],'육성팀':['staff',47,false],'에이전트':['agent',45,false],'코칭스태프':['coach',50,false],'선수단':['coach',50,false]};
function personaOf(from){ if(!G)return null; if(from&&from.startsWith('비서'))return 'sec'; if(from==='감독실'){ const m=G.mgr[G.user]; return m?{persona:'mgr',pid:m.id,team:G.user,age:m.age}:null; }
  if(from==='수석코치'||from==='코칭스태프'){ const c=G.coach&&coachesOf(G.user).hc; if(c)return {persona:'coach',pid:c.id,team:G.user,age:c.age}; }
  const x=PERSONA[from]; return x?{persona:x[0],pid:'st:'+from+':'+G.user,team:G.user,age:x[1],female:x[2]}:null; }
function senderAv(m){ if(typeof m.face==='string'&&m.face.startsWith('ob:')){ const o=obOf(m.face.slice(3)); if(o)return obAv(o,{k:'free'}); } if(m.face!=='sec'&&typeof m.face!=='number'&&!(m.kind==='부상'&&m.ref!=null&&G.players[m.ref])){ const pz=personaOf(m.from); if(pz)return avImg(pz); } if(m.face==='sec')return avImg('sec'); if(typeof m.face==='number'&&G.players[m.face])return avImg(G.players[m.face]); if(m.kind==='부상'&&m.ref!=null&&G.players[m.ref])return avImg(G.players[m.ref]); return `<span class="av ini">${esc((m.from||'?').replace('비서 ','').slice(0,1))}</span>`; }
function tutCard(){ const t=G.tut; if(!t||t.done)return ''; const s=TUT[t.step]; if(!s||s.k==='welcome')return '';
  /* 같은 일이 '처리할 일'에 이미 있으면 안내 카드는 접는다 */
  { const W={'외국인선수':'transfer:foreign','감독':'staff:mgr','부상방지·병원':'staff:med','2군연수':'staff:dev','스카우트팀':'staff:scouts'}; const key=s.go&&s.go[0]==='goWork'?W[s.go[1]]:null;
    if(key&&TODO[key]&&key!=='staff:dev'){ const [tb,kk]=key.split(':'); try{ if(subAlert(tb,kk))return ''; }catch(e){} } }
  return `<section class="card hero"><div class="row between"><span class="eyebrow">비서 업무 안내 · ${t.step}/${TUT.length-1}</span><button class="btn small" data-a="tutSkip">건너뛰기</button></div>
  <div class="row" style="flex-wrap:nowrap;align-items:center">${avImg('sec')}<div><b>${esc(s.subj)}</b>${s.prog?`<p class="small">${esc(s.prog())}</p>`:''}</div></div>
  ${s.btn?`<button class="btn primary block" data-a="${s.go[0]}" data-v="${s.go[1]}">${esc(s.btn)}</button>`:''}</section>`; }
function mgrRow(x,act){ mgrFix(x); return `<div class="item wa" style="cursor:default">${avImg({persona:'mgr',pid:x.id,name:x.name,age:x.age,team:G.user})}<span class="nm">${esc(x.name)} <span class="small muted">${x.age}세</span>${x.fame>=70?' <span class="pill warn">스타 감독</span>':''}${obTag(x.ob)}${x.ego>=70?' <span class="pill bad">고집</span>':''}</span><span class="sub">${esc(x.career)}</span><span class="rt num">${money(x.sal)}</span></div>
  ${(()=>{ const ty=mgrType(x); return `<div class="mtype"><b>${esc(ty.n)}</b><span class="small">${esc(ty.d)}</span></div>`; })()}
  <div class="eyebrow mlab">성향</div>${mgrStyleBox(x)}<div class="eyebrow mlab">능력</div>${mgrAbilBox(x)}${mgrPersLine(x)}${act||''}`; }
function policyCard(m){
  const p=G.policy; const lean=teamLean(G.user); const cd=p&&G.day-p.day<14;
  const leanTxt=lean>.35?'육성 쪽':lean<-.35?'성적 쪽':'균형';
  return `<section class="card polc"><div class="row between"><span class="eyebrow">운영 기조 지시</span>${p?`<span class="small muted">감독 수용도 ${Math.round(p.follow*100)}% · 관계 ${m.rel}</span>`:`<span class="small muted">지시 없음 · 감독 본래 성향대로 운영 · 관계 ${m.rel}</span>`}</div>
    <div class="seg">${Object.entries(POL).map(([k,x])=>`<button data-a="setPol" data-v="${k}" class="${p&&p.k===k?'on':''}" ${cd?'disabled':''}>${x.l}</button>`).join('')}</div>
    <p class="small">${p?esc(POL[p.k].d):'단장이 방향을 정하면 감독이 성향에 따라 받아들입니다. 출전 시간이 곧 성장이므로, 유망주를 키우려면 육성 기조가 필요합니다.'}</p>
    <div class="leanbar"><span>성적</span><div><i style="left:${(lean+1)*50}%"></i></div><span>육성</span></div>
    <p class="small muted">실제 운영: <b>${leanTxt}</b>. 고집이 센 감독일수록, 본래 성향과 다른 지시일수록, 관계가 나쁠수록 덜 따릅니다. 2주에 한 번 바꿀 수 있습니다.${cd?` 다음 변경 ${dmd(p.day+14)}.`:''}</p>
    ${UI.polMsg?`<div class="note">${esc(UI.polMsg)}</div>`:''}</section>`;
}
function mgrChatCard(compact){ const m=G.mgr[G.user]; if(!m||m.interim||G.unemp)return ''; const C=(G.mgrChat||[]).filter(c=>!compact||G.day-c.d<=14).slice(0,1); /* 지난 대화는 감독실에서: 화면에는 가장 최근 답 하나만 */
  const T=[['now','지금 팀 상황은?'],['foreign','어떤 외국인을 원하나?'],['need','가장 급한 자리는?'],['young','눈여겨보는 젊은 선수는?']];
  const tt=G.ttDay!=null&&G.day-G.ttDay<14;
  return `<section class="card mchat"><div class="row between"><h2 class="sec">${compact?'감독실':'감독과 대화'}</h2><span class="small muted">${esc(m.name)} 감독 · ${MV[mgrVoice(m)].l} · 관계 ${m.rel}</span></div>${compact?'':`<p class="small muted keep">${esc(m.career||'')} · ${MV[mgrVoice(m)].d}</p>`}
    ${meetDoor('mgr')}
    ${C.length?`<div class="mc-l">${C.map(c=>`<div class="mc-a"><i>${dsh(c.d)}${G.day-c.d>30?' (지난 답변, 다시 물어보세요)':''} · ${esc((T.find(x=>x[0]===c.t)||['',''])[1])}</i><p>${esc(c.a)}</p></div>`).join('')}</div>`:'<p class="small muted">자주 물어볼수록 감독과의 관계가 좋아집니다(한 주에 한 번 반영).</p>'}
    
    ${UI.mgrMsg?`<div class="note">${esc(UI.mgrMsg)}</div>`:''}</section>`; }
function pactCard(m){ const P=G.pact&&G.pact.y===G.year&&G.pact.on?G.pact:null; const sel=UI.pactSel||[];
  const dd=depth(G.user); const REGS=new Set([...dd.start,...dd.sp,...dd.pen.slice(0,4)].map(x=>x.id)); const cands=playersOf(G.user).filter(p=>!p.foreign&&p.age<=25&&!REGS.has(p.id)).sort((a,b)=>(scoutReport(b).ofp||0)-(scoutReport(a).ofp||0)).slice(0,12);
  const cur=P?`<ul class="rec-w">${P.t.map(x=>{ const p=G.players[x.id]; return p?`<li><b>${esc(p.name)}</b> ${x.lv==='full'?'<span class="pill good">합의</span>':x.lv==='part'?'<span class="pill warn">부분 합의</span>':'<span class="pill bad">거절</span>'} ${esc(x.why)}</li>`:''; }).join('')}</ul>${P.log.length?`<p class="small muted">최근 점검: ${esc(P.log[P.log.length-1].m)}월 · ${esc(P.log[P.log.length-1].L.join(' / '))}</p>`:''}<div class="row"><button class="btn small" data-a="pactEnd">합의 끝내기</button></div>`:'';
  const pick=cands.length?`<div class="chips">${cands.map(p=>`<button data-a="pactSel" data-v="${p.id}" class="${sel.includes(p.id)?'on':''}">${esc(p.name)} <i>${posLabel(p)} ${p.age}세</i></button>`).join('')}</div><div class="row"><button class="btn small primary" data-a="pactGo" ${sel.length?'':'disabled'}>감독과 합의하기 (${sel.length}/2)</button></div>`:'<p class="small muted">기회를 줄 만한 25세 이하 비주전 선수가 없습니다.</p>';
  return `<section class="card"><div class="row between"><span class="eyebrow">유망주 기회 합의</span><span class="small muted">감독 관계 ${m.rel} · 육성 ${m.youth??'-'}</span></div>
    <p class="small expl">${mplOn('youth')?'영입 때 유망주 기회 보장을 약속받아 합의가 잘 됩니다. ':''}1군 기회를 줄 유망주를 2명까지 정해 감독과 합의합니다(영입 면담의 '유망주 기회 보장'은 전반적인 방침, 여기는 특정 선수). 감독은 실력 차이와 성향에 따라 받아들이거나 일부만 받아들이고, 매달 근거와 함께 보고합니다. 결과만으로 감독을 자동 평가하지 않습니다.</p>
    ${cur}${P?`<div class="eyebrow" style="margin-top:8px">대상 다시 정하기</div>`:''}${pick}${UI.pactMsg?`<div class="note">${esc(UI.pactMsg).replace(/\n/g,'<br>')}</div>`:''}</section>`; }
function mgrBody(){
  const m=G.mgr[G.user];
  const pol=m?policyCard(m)+(m.interim?'':pactCard(m)):'';
  const cur=m?`<div class="eyebrow">현재 감독</div>${mgrRow(m,`<p class="small muted">${m.interim?'감독대행 체제입니다.':`계약 잔여 ${Math.max(0,m.yrs)}년`}${m.pl?` · 영입 때 받은 약속: ${Object.keys(m.pl).map(k=>MPL[k].l).join(', ')}`:''}</p>${(m.plv||[]).length?`<p class="small bad">약속 위반 ${m.plv.length}회${m.plv.length>=2?' · 경질하면 잔여 연봉 절반, 선수단 동요 없음':''}</p><ul class="small muted">${m.plv.slice(-3).reverse().map(v=>`<li>${dmd(v.d)} ${esc(MPL[v.k].l)}: ${esc(v.t)}</li>`).join('')}</ul>`:''}${m.interim?'':UI.confirmFire?`<div class="row"><button class="btn danger" data-a="fireMgr">정말 경질 (잔여 연봉 지급)</button><button class="btn" data-a="fireCancel">취소</button></div>`:`<div class="row">${m.yrs<=0?'<button class="btn" data-a="renewMgr" data-v="2">2년 재계약</button>':''}<button class="btn danger" data-a="fireAsk">경질</button></div>`}`)}`:'<div class="note bad">감독이 없습니다. 개막 전까지 반드시 선임해야 합니다.</div>';
  const mgrCandCard=x=>`<div class="tcard mgrc" style="cursor:default">${mgrRow(x,`${mplStanceBox(x)}${G.coach?clanBox(x):''}<div class="row">${(()=>{ const b=budget(); const cur=G.mgr[G.user]; const pay=cur&&!cur.interim?Math.round(cur.sal*Math.max(0,cur.yrs-.5)):0; const clan=G.coach&&(x.clan||[]).length?sum(x.clan.map(c=>c.sal)):0; return budgetTag(Math.round(x.sal*b.rem)+pay+Math.round(clan*b.rem)+(clan?clanSev(x):0))+(pay?`<span class="small muted">현 감독 경질 정산금 ${money(pay)} 포함</span>`:''); })()}</div><div class="row">${G.coach&&(x.clan||[]).length?`<button class="btn small primary" data-a="hireMgr" data-v="${x.id}:2:1">사단과 2년</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:3:1">사단과 3년</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:2:0">감독만 2년</button>`:`<button class="btn small primary" data-a="hireMgr" data-v="${x.id}:2">2년 계약</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:3">3년 계약</button>`}</div>`)}</div>`;
  const mv=inTabs('mgrv',[['cur','현재 감독'],...(m&&!m.interim?[['rel','지시·요청']]:[]),['cand',`채용 후보 ${(G.mmarket||[]).length}`]],m&&!m.interim?'cur':'cand');
  const PGm=pager('mgc',(G.mmarket||[]),3);
  if(mv.cur==='rel')return mv.bar+mgrBondView()+mreqView()+pol;
  if(mv.cur==='cur'&&m&&!m.interim)return mv.bar+cur+mgrChatCard(false)+`<p class="small muted">고집이 셀수록 단장의 지시를 덜 받아들이고, 스타 감독은 팬 관심과 구단 인기를 끌어올리지만 연봉이 비싸고 자기 방식이 강합니다.</p>`;
  return mv.bar+(mv.cur==='cur'?cur+`<p class="small muted">고집이 셀수록 단장의 지시를 덜 받아들이고, 스타 감독은 팬 관심과 구단 인기를 끌어올리지만 연봉이 비싸고 자기 방식이 강합니다. 작전 수치가 높으면 도루를 많이 시도하고, 불펜 운용 수치가 높으면 선발을 일찍 내립니다. 육성은 26세 이하 선수 성장, 장악력은 선수단 기분, 경기 운영은 전반적인 경기력에 영향을 줍니다. 감독을 바꾸면 남은 계약 연봉은 그대로 나갑니다.</p>`:mv.cur==='pol'?pol:((G.mmarket||[]).length?`<p class="small muted">능력치에서 고집·투수 혹사는 낮을수록 좋습니다. 작전(번트·도루 선호)과 스타성(관중·홍보 효과)은 성향입니다. 사단은 감독과 함께 오는 코치입니다.</p>${mplPickCard()}<div class="tgrid" data-pg="mgc">${PGm.items.map(mgrCandCard).join('')}</div>${PGm.bar}`:'<p class="small muted">후보가 없습니다. 11월에 새 후보가 나옵니다.</p>'));
}
function medBody(){
  return `<div class="eyebrow">부상 방지 프로그램</div>
  <div class="chips prevc">${PREV.map((x,i)=>`<button data-a="setPrev" data-v="${i}" class="${G.med.prev===i?'on':''}">${x.l}<small>${x.c?`연 ${money(x.c)}`:'비용 없음'}</small></button>`).join('')}</div>
  <p class="small muted">연 ${money(PREV[G.med.prev].c)} · 경기 중 부상 위험 ${Math.round((1-PREV[G.med.prev].m)*100)}% 감소</p>
  <div class="eyebrow">제휴 병원</div>
  <div class="list">${Object.entries(HOSP).map(([k,h])=>`<button class="item" data-a="setHosp" data-v="${k}"><span class="nm">${G.med.hosp===k?'<span class="pill good">선택됨</span> ':''}${esc(h.name)}</span><span class="sub">${esc(h.d)}${h.rec?` 재활 기간 ${Math.round(h.rec*100)}% 단축.`:''}</span><span class="rt num">${h.c?money(h.c):'-'}</span></button>`).join('')}</div>
  <p class="small muted">병원 이름은 모두 가상입니다. 비용은 하루 단위로 쌓여 시즌 결산 때 나갑니다. 지난 결산 이후 ${money(G.spend.med+G.spend.hosp)}.</p>
  ${G.medSet?'':'<button class="btn primary block" data-a="medOk">이대로 운영</button>'}`;
}
function devBody(){
  const dv=inTabs('devv',[['trn','훈련 방향'],['ovs',`해외 연수${(G.ovs||[]).length?' '+(G.ovs||[]).length+'명':''}`]],'trn');
  return dv.bar+(dv.cur==='ovs'?ovsBody():trnListBody());
}
function marketingBody(){
  return `<div class="row between"><span class="small">올 시즌 예산</span><b class="num" id="mktv">${money(G.marketing)}</b></div>
    <input type="range" id="mkt" min="500" max="6000" step="250" value="${G.marketing}" data-a="mkt" aria-label="마케팅 예산">
    <p class="small muted">광고·상품 수입과 인기에 영향을 줍니다. 개막 전에만 바꿀 수 있고, 비용은 시즌 결산 때 나갑니다.</p>`;
}
function capCard(ci){
  const pct=Math.min(100,ci.pay/ci.cap*100), fl=ci.floor/ci.cap*100;
  return `<section class="card">
    <div class="row between"><h2 class="sec">샐러리캡</h2><span class="pill ${ci.over?'bad':'good'}">${ci.over?'초과 '+money(ci.over):'여유 '+money(ci.cap-ci.pay)}</span></div>
    <div class="bar"><i class="${ci.over?'over':''}" style="width:${pct}%"></i><b style="left:${fl}%"></b></div>
    <p class="small muted">외국인과 신인을 뺀 연봉 상위 40명 합계 ${money(ci.pay)} · 상한 ${money(ci.cap)} · 하한 ${money(ci.floor)}(세로선). 넘기면 초과분의 30%, 2년 연속이면 50%를 야구발전기금으로 냅니다.${G.year>2028?' 2029년 이후 상한액은 연 3% 인상으로 가정했습니다.':''}</p>
  </section>`;
}
function scoutBody(){
  const L=scoutLoad(); const cell=(role,key,label)=>{ const sc=role==='intl'?null:scoutOf(role,key); const n=L[role+':'+key]||0; const lv=role==='intl'?intlLv(key):null;
    return `<div class="cov ${(role==='intl'?lv>=1:n)?'on':''}"><span>${label}${role==='intl'&&n?' · 파견':''}</span><b>${role==='intl'?lv+'단계':n?'★'.repeat(sc.skill):'빈자리'}</b></div>`; };
  const matrix=`<div class="covm"><div class="covr"><i>아마추어</i>${REG.map(r=>cell('am',r,r)).join('')}</div><div class="covr"><i>프로</i>${REG.map(r=>cell('pro',r,r)).join('')}</div><div class="covr"><i>해외</i>${Object.keys(IREG).map(r=>cell('intl',r,IREG[r].l)).join('')}</div></div>`;
  const opt=s=>{ const cur=(s.role||'am')+':'+s.region; const os=[...REG.map(r=>['am:'+r,'아마추어 · '+r]),...REG.map(r=>['pro:'+r,'프로 · '+r+' 구단']),...Object.keys(IREG).map(r=>['intl:'+r,'해외 · '+IREG[r].l])];
    return `<select data-a="sAssign" data-v="${s.id}" aria-label="담당 업무">${os.map(([v,l])=>`<option value="${v}" ${v===cur?'selected':''}>${l}</option>`).join('')}</select>`; };
  const it=inTabs('scv',[['team',`우리 스카우트 ${G.scouts.length}/${SCOUT_MAX}`],['mkt',`채용 후보 ${scoutMkt().length}`],['oth','다른 구단']],'team');
  const TEAM=`<p class="small muted">스카우트 한 명은 한 가지 업무만 맡습니다. 투수 감별·타자 감별 특기가 있으면 그 유형 선수를 볼 때 능력이 한 단계 높습니다. 아마추어는 그 지역 고교·대학 선수(드래프트), 프로는 그 지역 연고 구단 선수, 해외는 그 나라 외국인 시장을 봅니다. 해외 담당을 보내면 그 나라 정보 수준이 한 단계 올라갑니다. 업무를 바꾸면 30일 동안 적응 기간이라 능력이 1 낮게 적용됩니다. 최대 ${SCOUT_MAX}명.</p>
    ${matrix}${scoutChiefBox()}
    <div class="tgrid">${G.scouts.map(s=>scoutCard(s,`${opt(s)}${G.day-(s.since??-999)<30?`<span class="pill warn">적응 중 · ${dmd(s.since+30)}까지</span>`:''}<span class="small muted">충성도 ${Math.round(stAttr(s).loy)} · 야망 ${s.amb}</span><button class="tc-i" data-a="person" data-v="sc:${s.id}">인물 카드</button><button class="tc-i" data-a="fireScout" data-v="${s.id}">계약 해지</button>`)).join('')||'<p class="small muted">스카우트가 없습니다.</p>'}</div>`;
  const MK=`<div class="eyebrow">고용 ${G.scouts.length}/${SCOUT_MAX}명 · ${stPrestigeLine()}</div>
    ${(()=>{ const f=UI.scF||'all'; return `<div class="row between"><span class="small muted">채용 후보 ${scoutMkt().length}명 · 매달 일부가 바뀝니다</span><div class="chips">${[['all','전체'],['P','투수 감별'],['B','타자 감별'],['hi','능력 4 이상']].map(([k,l])=>`<button data-a="scF" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div></div>`; })()}
    <div class="tgrid">${(()=>{ const SL=scoutMkt().filter(s=>{ const f=UI.scF||'all'; return f==='all'||(f==='hi'?s.skill>=4:s.spec===f); }).sort((a,b)=>b.skill-a.skill||a.sal-b.sal); const PG=pager('scm'+(UI.scF||''),SL,6); UI._scPg=PG.bar; return PG.items; })().map(s=>scoutCard(s,stMktInfo(s)+`<button class="tc-i go" data-a="hireScout" data-v="${s.id}:0" ${G.scouts.length>=SCOUT_MAX?'disabled':''}>제안 · 연 ${money(s.sal||0)}</button><button class="tc-i" data-a="hireScout" data-v="${s.id}:0.2" ${G.scouts.length>=SCOUT_MAX?'disabled':''}>20% 더 · ${money(round5(s.sal*1.2))}</button>`)).join('')}</div>${UI._scPg||''}`;
  return it.bar+(it.cur==='mkt'?MK:it.cur==='oth'?stOtherView('sc'):TEAM);
}

/* 감독 카드 정리: 성향(어느 쪽이냐)은 양 끝 이름이 있는 한 줄 눈금, 능력(높을수록 좋음)은 점수 막대, 성격은 한 줄 */
const MSTY=[['small','빅볼','스몰볼'],['dfn','타격 중시','수비 중시'],['pen','선발 중심','불펜 중심'],['arm','투수 보호','투수 혹사'],['youth','성적 우선','육성 우선']];
function mgrStyleBox(m){ mgrAttr(m); return `<div class="msty">${MSTY.map(([k,a,b])=>{ const v=clamp(m[k],0,100); const side=v>=62?'r':v<=38?'l':''; return `<div class="msty-r"><span class="${side==='l'?'on':''}">${a}</span><span class="msty-t"><i style="left:${v}%"></i></span><span class="${side==='r'?'on':''}">${b}</span></div>`; }).join('')}</div>`; }
function mgrAbilBox(m){ mgrAttr(m); return `<div class="mabil">${[['장악력',m.disc,'선수단 기강·불만 관리'],['운영',m.tac,'경기 중 판단(작전·교체 타이밍)'],['안목',m.eye,'유망주·선수 평가 정확도'],['휴식 관리',m.rest,'주전 피로·부상 관리']].map(([l,v,d])=>`<div class="mabil-r" title="${d}"><span>${l}</span>${rchip(v)}<span class="track"><span class="now" style="width:${v}%;background:${rcol(v)}"></span></span></div>`).join('')}</div>`; }
function mgrPersLine(m){ return `<p class="small muted mpers keep">${m.ego>=70?'<b class="bad">고집 셈</b> · 단장 지시를 잘 안 받아들입니다':m.ego<=35?'유연함 · 단장 지시를 잘 받아들입니다':'고집 보통'} · ${m.fame>=70?'<b>스타 감독</b> · 팬 관심↑ 연봉↑':m.fame<=35?'인지도 낮음':'인지도 보통'}</p>`; }
