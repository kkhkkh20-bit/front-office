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
  const showE=upto==null&&g.box&&g.box.h&&g.box.h.bat&&g.box.h.bat.some(b=>b.e!=null); const eOf=k=>sum((g.box[k].bat||[]).map(b=>b.e||0)); /* 실책: 그 팀 야수가 범한 수 */
  const row=(k,tid)=>{ const [r,h]=tot(k); return `<tr class="${tid===G.user?'me':''}"><td>${tshort(tid)}</td>${cols.map(i=>`<td>${cell(k,i)}</td>`).join('')}<td class="key">${r}</td><td>${h}</td>${showE?`<td>${eOf(k)}</td>`:''}</tr>`; };
  return `<div class="tw"><table class="ls"><thead><tr><th></th>${cols.map(i=>`<th>${i+1}</th>`).join('')}<th class="key">R</th><th>H</th>${showE?'<th title="실책">E</th>':''}</tr></thead><tbody>${row('a',g.away)}${row('h',g.home)}</tbody></table></div>`;
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
function offerOne(o){ { const t=team(o.from); const why=offerBlockMsg(o); /* 그사이 성사될 수 없게 된 제안은 수락 대신 사유 */ const li=id=>{const p=G.players[id]; return p?pcard(p,{foot:rosterFoot(p)}):''};
    return `<section class="card hero"><div class="row between"><span class="eyebrow">트레이드 제안 · ${dmd(o.exp)}까지</span><span class="small muted">관계 ${t.rel}</span></div>
    <h2 class="sec">${tname(o.from)}</h2>
    <div class="tcols2"><div><div class="eyebrow">받는 선수</div><div class="tgrid">${o.give.map(li).join('')}</div></div><div><div class="eyebrow">보내는 선수</div><div class="tgrid">${o.get.map(li).join('')}</div></div></div>
    ${(t=>`<p class="small ${t.includes('정리 필요')?'bad':'muted'}">${t}</p>`)(tradeRosterTxt(o.get,o.give))}${offerAdvBox(o)}
    ${why?`<p class="small bad">지금은 수락할 수 없습니다: ${esc(why)}</p>`:''}<div class="btns">${why?'':`<button class="btn primary" data-a="offerYes" data-v="${o.id}">수락</button>`}<button class="btn" data-a="offerNo" data-v="${o.id}">거절</button></div></section>`; }
}
function campCard(){
  if(!G.camp||G.camp.done)return '';
  return `<section class="card hero" data-k="스프링캠프"><span class="eyebrow">스프링캠프 · 3월 5일 종료</span><h2 class="sec">훈련 방향</h2>
    <div class="seg">${Object.entries(CAMP).map(([k,l])=>`<button data-a="camp" data-v="${k}" class="${G.camp.focus===k?'on':''}">${l}</button>`).join('')}</div>
    <p class="small muted">${{balance:'젊은 선수 성장과 부상 방지를 조금씩 챙깁니다.',skill:'젊은 선수 기술이 집중적으로 늘고, 투수가 새 구종을 익힐 기회가 많습니다.',fitness:'올 시즌 부상 위험이 줄어듭니다.',game:'4월까지 경기 감각이 올라갑니다.'}[G.camp.focus]}</p></section>`;
}
function avImg(o,big){ const src=o&&o.img?o.img:big?faceBust(faceSVG(o)):faceSVG(o); /* o.img: 단장이 갤러리에서 넣은 사진 */ /* 큰 자리는 가슴까지 */ const nm=o==='sec'?SEC:(o.name||'?'); return src?`<img class="av${big?' big':''}" src="${src}" alt="">`:`<span class="av ini${big?' big':''}">${esc(nm.slice(0,1))}</span>`; }
const PERSONA={'구단주실':['own',63,false],'재무팀':['staff',41,false],'홍보팀':['staff',36,true],'마케팅팀':['staff',33,true],'운영팀':['staff',44,false],'스카우트팀장':['staff',53,false],'전력분석팀':['staff',31,false],'팀 닥터 · 의무팀':['doc',49,false],'육성팀':['staff',47,false],'에이전트':['agent',45,false],'코칭스태프':['coach',50,false],'선수단':['coach',50,false],'프런트':['staff',38,false],'재정':['staff',41,false],'엔트리':['coach',50,false],'도전과제':['staff',35,true],'단장 노트':['staff',34,true],'스카우트':['staff',53,false],'외국인':['staff',44,false],'해외':['staff',44,false],'감독':['coach',50,false]}; /* 부서 이름만 있는 발신자도 실사 얼굴(사용자 11-08: 프런트가 글자로 나옴) */
function personaOf(from){ if(!G)return null; if(from&&from.startsWith('팀 닥터'))return {persona:'staff',pid:'doc'+G.user,team:G.user,age:49}; /* 팀 닥터: 의무실 화면과 같은 v8 실사 사진(persona 'doc'는 사진 묶음이 없어 그림 얼굴로 나왔다, 사용자 11-11) */ if(from&&from.startsWith('비서'))return {persona:'staff',pid:'st:비서:'+G.user,team:G.user,age:29,female:true}; /* 비서도 직원 실사 사진(그림 얼굴과 섞이지 않게) */ if(from==='감독실'){ const m=G.mgr[G.user]; return m?{persona:'mgr',pid:m.id,team:G.user,age:m.age}:null; }
  if(from==='수석코치'||from==='코칭스태프'){ const c=G.coach&&coachesOf(G.user).hc; if(c)return {persona:'coach',pid:c.id,team:G.user,age:c.age}; }
  const x=PERSONA[from]||(from&&/팀|실$|본부|사무국/.test(from)&&!/구단주|감독/.test(from)?['staff',40,false]:null); return x?{persona:x[0],pid:'st:'+from+':'+G.user,team:G.user,age:x[1],female:x[2]}:null; } /* 목록에 없는 부서 발신자도 직원 실사 사진(글자 대신) */
function senderAv(m){ if(typeof m.face==='string'&&m.face.startsWith('ob:')){ const o=obOf(m.face.slice(3)); if(o)return obAv(o,{k:'free'}); } if(m.face!=='sec'&&typeof m.face!=='number'&&!(m.kind==='부상'&&m.ref!=null&&G.players[m.ref])){ const pz=personaOf(m.from); if(pz)return avImg(pz); } if(m.face==='sec')return avImg(personaOf('비서')); if(typeof m.face==='number'&&G.players[m.face])return avImg(G.players[m.face]); if(m.kind==='부상'&&m.ref!=null&&G.players[m.ref])return avImg(G.players[m.ref]); return `<span class="av ini">${esc((m.from||'?').replace('비서 ','').slice(0,1))}</span>`; }
function senderPhotoKey(m){ if(m.face==='sec')return cimgKey(personaOf('비서')); if(typeof m.face==='number'||typeof m.face==='string'&&m.face.startsWith('ob:')||m.kind==='부상'&&m.ref!=null&&G.players[m.ref])return null; return cimgKey(personaOf(m.from)); }
function tutCard(){ const t=G.tut; if(!t||t.done)return ''; const s=TUT[t.step]; if(!s||s.k==='welcome')return '';
  /* 같은 일이 '처리할 일'에 이미 있으면 안내 카드는 접는다 */
  { const W={'외국인선수':'transfer:foreign','감독':'staff:mgr','부상방지·병원':'staff:med','2군연수':'staff:dev','스카우트팀':'staff:scouts'}; const key=s.go&&s.go[0]==='goWork'?W[s.go[1]]:null;
    if(key&&TODO[key]&&key!=='staff:dev'){ const [tb,kk]=key.split(':'); try{ if(subAlert(tb,kk))return ''; }catch(e){} } }
  return `<section class="card hero"><div class="row between"><span class="eyebrow">비서 업무 안내 · ${t.step}/${TUT.length-1}</span><button class="btn small" data-a="tutSkip">건너뛰기</button></div>
  <div class="row" style="flex-wrap:nowrap;align-items:center">${avImg(personaOf('비서')||'sec')}<div><b>${esc(s.subj)}</b>${s.prog?`<p class="small">${esc(s.prog())}</p>`:''}</div></div>
  ${s.btn?`<button class="btn primary block" data-a="${s.go[0]}" data-v="${s.go[1]}">${esc(s.btn)}</button>`:''}</section>`; }
/* 감독이 추구하는 야구와 우리 선수단: 원하는 역할별 주전 현황(후보 감독이면 '이 감독이 오면') */
function mgrFitBox(x,cur){ const L=mgrRolesOf(x); const ty=mgrType(x); if(!L.length)return `<p class="small"><b>추구하는 야구</b> ${esc(ty.n)} · 특정 유형 선수를 따로 찾지 않습니다.</p>`;
  const rows=L.map(k=>{ const R0=MROLE[k]; const H=roleHave(G.user,k);
    /* 가까운 우리 선수: 한 기준만 조금(화면 8 이내) 모자란 선수 — 무엇이 몇 모자라는지 */
    const near=H.length<R0.tgt?domestic(G.user).concat(playersOf(G.user).filter(p=>p.foreign)).filter((p,i,a)=>a.indexOf(p)===i&&!roleOk(p,k)&&(R0.bat?!p.isP:p.isP)).map(p=>({p,s:roleShort(p,k)})).filter(x=>x.s>0&&x.s<=8).sort((a,b)=>a.s-b.s).slice(0,3):[];
    return `<li><b>${R0.l}</b> <span class="muted">— ${esc(R0.role)}</span><br><span class="small">기준: <b>${esc(crTxt(k))}</b></span> · 주전 ${H.length}/${R0.tgt}명${H.length?` <span class="muted">(${H.slice(0,4).map(p=>esc(p.name)).join(', ')})</span>`:''}${H.length<R0.tgt?' <span class="warn">모자람</span>':''}${near.length?`<br><span class="small muted">조금 모자란 우리 선수: ${near.map(x=>`${esc(x.p.name)}(${roleCheck(x.p,k).filter(c=>!c.ok).map(c=>`${c.l} ${c.cur}/${c.need}`).join(', ')})`).join(' · ')}</span>`:''}</li>`; }).join('');
  const st=cur?mgrPlayStat(G.user,x):''; return `<div class="small"><b>추구하는 야구</b> ${esc(ty.n)} · 원하는 선수 역할<ul class="small" style="margin:4px 0 4px 16px">${rows}</ul>${st?`<span class="muted">${esc(st)}</span>`:''}</div>`; }
function mgrRow(x,act){ mgrFix(x); return `<div class="item wa" style="cursor:default">${avImg({persona:'mgr',pid:x.id,name:x.name,age:x.age,team:G.user})}<span class="nm">${esc(x.name)} <span class="small muted">${x.age}세</span>${x.fame>=70?' <span class="pill warn">스타 감독</span>':''}${obTag(x.ob)}${x.ego>=70?' <span class="pill bad">고집</span>':''}</span><span class="sub">${esc(x.career)}</span><span class="rt num">${money(x.sal)}</span></div>
  ${(()=>{ const ty=mgrType(x); return `<div class="mtype"><b>${esc(ty.n)}</b><span class="small">${esc(ty.d)}</span></div>`; })()}
  ${mgrFitBox(x,G.mgr[G.user]===x)}<div class="eyebrow mlab">성향</div>${mgrStyleBox(x)}<div class="eyebrow mlab">능력</div>${mgrAbilBox(x)}${mgrPersLine(x)}${act||''}`; }
function policyCard(m){
  const p=G.policy; const lean=teamLean(G.user); const cd=p&&G.day-p.day<14;
  const leanTxt=lean>.35?'육성 쪽':lean<-.35?'성적 쪽':'균형';
  return `<section class="card polc"><div class="row between"><span class="eyebrow">운영 기조 지시 ${hiI('단장이 방향을 정하면 감독이 성향에 따라 받아들입니다. 출전 시간이 곧 성장이므로, 유망주를 키우려면 육성 기조가 필요합니다.\n고집이 센 감독일수록, 본래 성향과 다른 지시일수록, 관계가 나쁠수록 덜 따릅니다. 2주에 한 번 바꿀 수 있습니다.')}</span>${p?`<span class="small muted">감독이 ${followWord(p.follow)} · 관계 ${m.rel}</span>`:`<span class="small muted">지시 없음 · 감독 본래 성향대로 운영 · 관계 ${m.rel}</span>`}</div>
    <div class="seg">${Object.entries(POL).map(([k,x])=>`<button data-a="setPol" data-v="${k}" class="${p&&p.k===k?'on':''}" ${cd?'disabled':''}>${x.l}</button>`).join('')}</div>
    ${p?`<p class="small">${esc(POL[p.k].d)}</p>`:''}
    <div class="leanbar"><span>성적</span><div><i style="left:${(lean+1)*50}%"></i></div><span>육성</span></div>
    <p class="small">실제 운영: <b>${leanTxt}</b>${cd?` · 다음 변경 ${dmd(p.day+14)}`:''}</p>
    ${UI.polMsg?`<div class="note">${esc(UI.polMsg)}</div>`:''}</section>`;
}
function mgrChatCard(compact){ const m=G.mgr[G.user]; if(!m||m.interim||G.unemp)return ''; const C=(G.mgrChat||[]).filter(c=>!compact||G.day-c.d<=14).slice(0,1); /* 지난 대화는 감독실에서: 화면에는 가장 최근 답 하나만 */
  const T=[['now','지금 팀 상황은?'],['foreign','어떤 외국인을 원하나?'],['need','가장 급한 자리는?'],['young','눈여겨보는 젊은 선수는?']];
  const tt=G.ttDay!=null&&G.day-G.ttDay<14;
  return `<section class="card mchat"><div class="row between"><h2 class="sec">${compact?'감독실':'감독과 대화'}</h2><span class="small muted">${esc(m.name)} 감독 · ${esc(mgrType(m).n)} · 말투 ${MV[mgrVoice(m)].l} · 관계 ${m.rel}</span></div>${compact?'':`<p class="small muted keep">${esc(m.career||'')} · ${MV[mgrVoice(m)].d}</p>`}
    ${meetDoor('mgr')}
    ${C.length?`<div class="mc-l">${C.map(c=>`<div class="mc-a"><i>${dsh(c.d)} · ${esc((T.find(x=>x[0]===c.t)||['',''])[1])}</i><p>${esc(c.a)}</p></div>`).join('')}</div>`:''}
    
    ${UI.mgrMsg?`<div class="note">${esc(UI.mgrMsg)}</div>`:''}</section>`; }
function pactCard(m){ const P=G.pact&&G.pact.y===G.year&&G.pact.on&&G.pact.mid===m.id&&(G.pact.tid==null||G.pact.tid===G.user)?G.pact:null; let sel=UI.pactSel||[];
  const dd=depth(G.user); const REGS=new Set([...dd.start,...dd.sp,...dd.pen.slice(0,4)].map(x=>x.id)); const cands=playersOf(G.user).filter(p=>pactPeriodOpen()&&pactCandidate(p,REGS)).sort((a,b)=>(scoutReport(b).ofp||0)-(scoutReport(a).ofp||0)).slice(0,12);
  sel=sel.filter(id=>cands.some(p=>p.id===id)); const cur=P?`<ul class="rec-w">${P.t.map(x=>{ const p=G.players[x.id]; return p?`<li><b>${esc(p.name)}</b> ${x.lv==='full'?'<span class="pill good">합의</span>':x.lv==='part'?'<span class="pill warn">부분 합의</span>':'<span class="pill bad">거절</span>'} ${esc(x.why)}</li>`:''; }).join('')}</ul>${P.log.length?`<p class="small muted">최근 점검: ${esc(P.log[P.log.length-1].m)}월 · ${esc(P.log[P.log.length-1].L.join(' / '))}</p>`:''}<div class="row"><button class="btn small" data-a="pactEnd">합의 끝내기</button></div>`:'';
  const pick=cands.length?`<div class="chips">${cands.map(p=>`<button data-a="pactSel" data-v="${p.id}" class="${sel.includes(p.id)?'on':''}">${esc(p.name)} <i>${posLabel(p)} ${p.age}세</i></button>`).join('')}</div><div class="row"><button class="btn small primary" data-a="pactGo" ${sel.length?'':'disabled'}>감독과 합의하기 (${sel.length}/2)</button></div>`:`<p class="small muted">${pactPeriodOpen()?'지금 출전 기회를 합의할 수 있는 25세 이하 비주전 선수가 없습니다.':'시즌이 끝나 출전 기회 합의는 다음 시즌 준비 때 다시 논의합니다.'}</p>`;
  return `<section class="card"><div class="row between"><span class="eyebrow">유망주 기회 합의</span><span class="small muted">감독 관계 ${m.rel} · ${mgrYouthWord(m.youth)}</span></div>
    <p class="small expl">${mplOn('youth')?'영입 때 유망주 기회 보장을 약속받아 합의가 잘 됩니다. ':''}1군 기회를 줄 유망주를 2명까지 정해 감독과 합의합니다. 감독은 실력 차이와 성향에 따라 받아들이거나 일부만 받아들이고, 매달 근거와 함께 보고합니다. 결과만으로 감독을 자동 평가하지 않습니다.</p>
    ${cur}${P?`<div class="eyebrow" style="margin-top:8px">대상 다시 정하기</div>`:''}${pick}${UI.pactMsg?`<div class="note">${esc(UI.pactMsg).replace(/\n/g,'<br>')}</div>`:''}</section>`; }
/* 감독 중도 재계약: 연장 기간별 요구 연봉과 경질 정산금 변화 */
function mgrExtBox(m){ const T1=mgrExtTerms(1); if(!T1)return ''; const re=m.yrs<=0; const L=[1,2,3].map(a=>mgrExtTerms(a)).filter(T=>T&&!(T.why&&/최대/.test(T.why)));
  if(T1.why&&!/최대/.test(T1.why))return `<p class="small muted">${esc(T1.why)}</p>`; if(!L.length)return '<p class="small muted">감독 계약은 남은 기간 합계 최대 5년까지라 더 연장할 수 없습니다.</p>';
  return `<div class="row">${L.map(T=>`<button class="btn small" data-a="extMgr" data-v="${T.add}">${T.add}년 ${re?'재계약':'연장'}<i class="pc-s">연 ${money(T.sal)}(${T.up>=0?'+':''}${Math.round(T.up*100)}%)</i></button>`).join('')}</div>
    <p class="small muted">연장하면 감독 관계 개선. 대신 경질할 때 줄 정산금이 커집니다(지금 ${money(T1.sev0)} → 1년 연장 시 ${money(T1.sev1)}). 요구 인상률은 명성${T1.rk!=null?'·현재 순위':''}·관계로 정해집니다. 한 해 한 번.</p>`; }
function mgrCandidateCard(x){
  mgrFix(x);mgrAttr(x);const type=mgrType(x),b=budget(),cur=G.mgr[G.user];
  const pay=cur&&!cur.interim?mgrSevPay(cur).pay:0,clan=G.coach&&(x.clan||[]).length?sum(x.clan.map(c=>c.sal)):0;
  const cost=Math.round(x.sal*b.rem)+pay+Math.round(clan*b.rem)+(clan?clanSev(x):0);
  const deals=G.coach&&(x.clan||[]).length?`<button class="btn small primary" data-a="hireMgr" data-v="${x.id}:2:1">사단과 2년</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:3:1">사단과 3년</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:2:0">감독만 2년</button>`:`<button class="btn small primary" data-a="hireMgr" data-v="${x.id}:2">2년 계약</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:3">3년 계약</button>`;
  return `<div class="manager-overview"><aside class="card manager-bio">${avImg({persona:'mgr',pid:x.id,name:x.name,age:x.age,team:G.user},true)}<h3>${esc(x.name)} · ${x.age}세</h3><p class="small keep">${esc(x.career||'')}</p><p><b>${esc(type.n)}</b></p><p class="small keep">${esc(type.d)}</p>${mgrPersLine(x)}${obTag(x.ob)}</aside><section class="card"><h3>감독 능력</h3>${mgrAbilBox(x)}<h3>운영 성향</h3>${mgrStyleBox(x)}${mgrFitBox(x,false)}<p class="small muted">능력과 성향을 구분합니다. 고집·투수 혹사는 낮을수록 좋으며, 육성 우선·작전 선호는 운영 방식입니다.</p></section><aside class="card manager-contract"><h3>계약 검토</h3><dl class="kv"><dt>연봉</dt><dd>${money(x.sal)}</dd><dt>계약 시작</dt><dd>${ctStartS()} 시즌</dd>${pay?`<dt>현 감독 정산금</dt><dd>${money(pay)}</dd>`:''}</dl><div class="row">${budgetTag(cost)}</div>${mplPickCard()}${mplStanceBox(x)}<div class="row manager-deals">${deals}</div>${G.coach?clanBox(x):''}</aside></div>`;
}
function mgrCandidatePage(){
  const x=(G.mmarket||[]).find(x=>x.id===UI.mgrCandidate);
  if(!x){UI.mgrCandidate=null;return '';}
  return `<div class="scrim"><div class="sheet gut manager-profile" data-stop="1" aria-label="${esc(x.name)} 감독 후보"><div class="sheet-head"><h2 class="sec">감독 후보 · ${esc(x.name)}</h2></div>${UI.mgrMsg?`<p class="note bad">${esc(UI.mgrMsg)}</p>`:''}${mgrCandidateCard(x)}</div></div>`;
}
function mgrBody(){
  const m=G.mgr[G.user];
  const pol=m?policyCard(m)+(m.interim?'':pactCard(m)):'';
  const cur=m?`<div class="eyebrow">현재 감독</div>${mgrRow(m,`<p class="small muted">${m.interim?'감독대행 체제입니다.':`계약 잔여 ${Math.max(0,m.yrs)}년`}${m.pl?` · 영입 때 받은 약속: ${Object.keys(m.pl).map(k=>MPL[k].l).join(', ')}`:''}</p>${(m.plv||[]).length?`<p class="small bad">약속 위반 ${m.plv.length}회${m.plv.length>=2?' · 경질하면 잔여 연봉 절반, 선수단 동요 없음':''}</p><ul class="small muted">${m.plv.slice(-3).reverse().map(v=>`<li>${dmd(v.d)} ${esc(MPL[v.k].l)}: ${esc(v.t)}</li>`).join('')}</ul>`:''}${m.interim?'':UI.confirmFire?`<div class="row"><button class="btn danger" data-a="fireMgr">구단주 동의를 받았습니다. 정말 경질 (잔여 연봉 지급)</button><button class="btn" data-a="fireCancel">취소</button></div>`:`${mgrExtBox(m)}${(()=>{ const F=G.mcf&&G.mcf.fire; return F&&F.msg&&G.day-F.day<=21?`<p class="small ${F.k==='ok'?'good':F.k==='cond'?'warn':'bad'}">${esc(F.msg)}</p>`:''; })()}<div class="row"><button class="btn danger" data-a="fireAsk">${mgrFireOk()?'경질':'경질 요청(구단주 동의 필요)'}</button></div>`}`)}`:'<div class="note bad">감독이 없습니다. 개막 전까지 반드시 선임해야 합니다.</div>';

  const mgrCandCard=x=>`<div class="tcard mgrc" style="cursor:default">${mgrRow(x,`${ctStartS()>G.year?`<p class="small muted">정규시즌이 끝난 뒤 맺는 계약이라 ${ctStartS()} 시즌부터 셉니다(2년이면 ${ctSeasonsTxt(2)}).</p>`:''}${mplStanceBox(x)}${G.coach?clanBox(x):''}<div class="row">${(()=>{ const b=budget(); const cur=G.mgr[G.user]; const pay=cur&&!cur.interim?mgrSevPay(cur).pay:0; /* 실제 경질과 같은 정산금(약속 위반 절반 포함) */ const clan=G.coach&&(x.clan||[]).length?sum(x.clan.map(c=>c.sal)):0; return budgetTag(Math.round(x.sal*b.rem)+pay+Math.round(clan*b.rem)+(clan?clanSev(x):0))+(pay?`<span class="small muted">현 감독 경질 정산금 ${money(pay)} 포함</span>`:''); })()}</div><div class="row">${G.coach&&(x.clan||[]).length?`<button class="btn small primary" data-a="hireMgr" data-v="${x.id}:2:1">사단과 2년</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:3:1">사단과 3년</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:2:0">감독만 2년</button>`:`<button class="btn small primary" data-a="hireMgr" data-v="${x.id}:2">2년 계약</button><button class="btn small" data-a="hireMgr" data-v="${x.id}:3">3년 계약</button>`}</div>`)}<button class="tc-i" data-a="mgrCandidate" data-v="${x.id}">상세 평가</button></div>`;
  const mv=inTabs('mgrv',[['cur','현재 감독'],...(m&&!m.interim?[['rel','지시·요청']]:[]),['cand',`채용 후보 ${(G.mmarket||[]).length}`]],m&&!m.interim?'cur':'cand');
  if(UI._smk){ mv.cur='cand'; mv.bar=''; } const PGm=pager('mgc',(G.mmarket||[]),fmOn()?8:3);
  if(mv.cur==='rel')return mv.bar+mgrBondView()+mreqView()+pol;
  if(mv.cur==='cur'&&m&&!m.interim&&fmOn())return mv.bar+`<div class="mgfm"><section class="mgfm-c">${cur}</section><section class="mgfm-c"><h3>지시·요청</h3>${mgrBondView()}${mreqView()}</section><section class="mgfm-c">${mgrChatCard(false)}${pol}</section></div>`; /* PC: 감독 정보 | 지시·요청 | 대화·운영 방침을 한 화면에 */
  if(mv.cur==='cur'&&m&&!m.interim)return mv.bar+cur+mgrChatCard(false)+`<p class="small muted">고집이 셀수록 단장의 지시를 덜 받아들이고, 스타 감독은 팬 관심과 구단 인기를 끌어올리지만 연봉이 비싸고 자기 방식이 강합니다.</p>`;
  return mv.bar+(mv.cur==='cur'?cur+`<p class="small muted">고집이 셀수록 단장의 지시를 덜 받아들이고, 스타 감독은 팬 관심과 구단 인기를 끌어올리지만 연봉이 비싸고 자기 방식이 강합니다. 작전 수치가 높으면 도루를 많이 시도하고, 불펜 운용 수치가 높으면 선발을 일찍 내립니다. 육성은 26세 이하 선수 성장, 장악력은 선수단 기분, 경기 운영은 전반적인 경기력에 영향을 줍니다. 감독을 바꾸면 남은 계약 연봉은 그대로 나갑니다.</p>`:mv.cur==='pol'?pol:((G.mmarket||[]).length?`<p class="small muted">능력치에서 고집·투수 혹사는 낮을수록 좋습니다. 작전(번트·도루 선호)과 스타성(관중·홍보 효과)은 성향입니다. 사단은 감독과 함께 오는 코치입니다.</p>${mplPickCard()}<div class="tgrid mgrg" data-pg="mgc">${PGm.items.map(mgrCandCard).join('')}</div>${PGm.bar}`:'<p class="small muted">후보가 없습니다. 11월에 새 후보가 나옵니다.</p>'));
}
/* 지금 빠져 있거나 복귀 뒤 실전으로 기량을 되찾는 중인 우리 선수 */
function injNowList(){ const L=[]; for(const p of Object.values(G.players)){ if(p.team!==G.user||p.joinY>G.year)continue; const I=p.injK&&INJ[p.injK], sv=milServing(p)?p.mil.unit+' 복무 중 · ':''; /* 육성선수·상무 복무 선수도 의무 명단에(검수 11-09zy) */
    if(p.injOut>0)L.push({p,st:'out',t:`${sv}${I?I.part+' ':''}부상 · 복귀까지 ${p.injOut}일(${dmd(G.day+p.injOut)} 예상)`,n:p.injOut});
    else { const fx=(p.injFx||[]).find(f=>f.need&&(f.got||0)<f.need); if(fx)L.push({p,st:'rec',t:`${sv}${p.susp>G.day?'출장 정지 중':p.frehab?'외국인 재등록 대기':p.hold?'연봉 미계약으로 출전 불가':'출전 가능'} · ${fx.n||'부상'} 뒤 실전 회복 중 ${Math.round((fx.got||0)/fx.need*100)}%(뛰면서 기량을 되찾음)`,n:-1}); } }
  return L.sort((a,b)=>b.n-a.n); }
function medBody(){ const IL=injNowList();
  return `<div class="eyebrow">지금 부상 · 회복 중 ${IL.length}명</div>${IL.length?`<div class="list">${IL.map(x=>`<button class="item" data-a="player" data-v="${x.p.id}"><span class="nm">${esc(x.p.name)} <span class="small muted">${posLabel(x.p)} · ${x.p.age}세</span> ${x.st==='out'?'<span class="pill bad">이탈</span>':'<span class="pill warn">회복 중</span>'}</span><span class="sub">${esc(x.t)}</span></button>`).join('')}</div>`:'<p class="small muted">지금 빠져 있는 선수가 없습니다.</p>'}
  <div class="eyebrow">부상 방지 프로그램</div>
  <div class="chips prevc">${PREV.map((x,i)=>`<button data-a="setPrev" data-v="${i}" class="${G.med.prev===i?'on':''}">${x.l}<small>${x.c?`연 ${money(x.c)}`:'비용 없음'}</small></button>`).join('')}</div>
  <p class="small muted">연 ${money(PREV[G.med.prev].c)} · 경기 중 부상 위험 ${Math.round((1-PREV[G.med.prev].m)*100)}% 감소</p>
  <div class="eyebrow">제휴 병원 ${hiI('병원을 바꾸면 새 부상은 물론, 지금 재활 중인 선수(남은 기간 14일 이상)의 남은 기간에도 그날부터 새 병원의 재활 효과가 적용됩니다. 짧은 부상은 그대로입니다.\n병원 이름은 모두 가상입니다. 비용은 하루 단위로 쌓여 시즌 결산 때 나갑니다.')}</div><div class="list">${Object.entries(HOSP).map(([k,h])=>`<button class="item" data-a="setHosp" data-v="${k}"><span class="nm">${G.med.hosp===k?'<span class="pill good">선택됨</span> ':''}${esc(h.name)}</span><span class="sub">${esc(h.d.replace(/ ?재활 기간이 [^.]*\./,''))}${h.rec?` 재활 ${Math.round(h.rec*100)}% 단축 · 장기 수술 ${Math.round((1-Math.sqrt(1-h.rec))*100)}%`:''}</span><span class="rt num">${h.c?money(h.c):'-'}</span></button>`).join('')}</div>
  <p class="small muted">지난 결산 이후 의료비 ${money(G.spend.med+G.spend.hosp)}</p>
  ${G.medSet?'':'<button class="btn primary block" data-a="medOk">이대로 운영</button>'}`;
}
function devBody(){
  const dv=inTabs('devv',[['trn','훈련 방향'],['ovs',`해외 연수${(G.ovs||[]).length?' '+(G.ovs||[]).length+'명':''}`]],'trn');
  return dv.bar+(dv.cur==='ovs'?ovsBody():trnListBody());
}
function devPage(){
  if(G.camp&&!G.camp.done)G.camp.seen=true;
  const dv=inTabs('devv',[['trn','훈련 방향'],['ovs',`해외 연수${(G.ovs||[]).length?' '+(G.ovs||[]).length+'명':''}`]],'trn');
  return dv.cur==='ovs'?`<section class="card ovs-page ws-own"><div class="row between"><h2 class="sec">선수 육성</h2><span class="small muted">해외 연수 ${(G.ovs||[]).length}명</span></div>${dv.bar}${ovsBody()}</section>`
    :campCard()+csec('선수 육성',dv.bar+trnListBody());
}
function marketingBody(){
  return `<div class="row between"><span class="small">올 시즌 예산</span><b class="num" id="mktv">${money(G.marketing)}</b></div>
    <div class="row" style="gap:6px;align-items:center"><button class="btn small" data-a="mktStep" data-v="-100" aria-label="1억 줄이기">−1억</button><input type="range" id="mkt" min="500" max="6000" step="100" value="${G.marketing}" data-a="mkt" aria-label="마케팅 예산" style="flex:1"><button class="btn small" data-a="mktStep" data-v="100" aria-label="1억 늘리기">+1억</button></div>
    <p class="small"><b>늘리면</b> 그만큼 지출이 늘어 <b>예산 여유가 바로 줄고</b>, 광고·상품 수입과 인기는 시즌 동안 서서히 늘어 <b>예상 수지</b>에 반영됩니다.</p>
    <p class="small muted">구단 전체의 연간 홍보비입니다. 광고·상품 수입과 인기에 영향을 줍니다. 개막 전에만 바꿀 수 있고, 비용은 시즌 결산 때 나갑니다. 구단주 화면의 선수별 추가 홍보와는 별도입니다.</p>`;
}
function capCard(ci){
  const pct=Math.min(100,ci.pay/ci.cap*100), fl=ci.floor/ci.cap*100;
  return `<section class="card">
    <div class="row between"><h2 class="sec">샐러리캡</h2><span class="pill ${ci.over?'bad':'good'}">${ci.over?'초과 '+money(ci.over):'여유 '+money(ci.cap-ci.pay)}</span></div>
    <div class="bar"><i class="${ci.over?'over':''}" style="width:${pct}%"></i>${ci.floor?`<b style="left:${fl}%"></b>`:''}</div>
    <p class="small muted">외국인과 신인을 뺀 연봉 상위 40명 합계 ${money(ci.pay)} · 상한 ${money(ci.cap)}${ci.floor?` · 하한 ${money(ci.floor)}(세로선)`:' · 하한은 2027년부터 적용'}. 넘기면 초과분의 30%, 2년 연속이면 50%를 야구발전기금으로 냅니다. 3년 연속이면 초과분 전액을 내고 다음 해 1라운드 지명 순서가 9단계 내려갑니다.${(y=>y>2028&&!(G.capY&&G.capY[y])?` ${y}년 상한은 아직 이사회가 정하지 않아 연 3% 인상으로 가정했습니다.`:'')(sponSeason())}</p>
  </section>`;
}
function scoutBody(){
  const L=scoutLoad(); const cell=(role,key,label)=>{ const sc=role==='intl'?null:scoutOf(role,key); const n=L[role+':'+key]||0; const lv=role==='intl'?intlLv(key):null;
    return `<div class="cov ${(role==='intl'?lv>=1:n)?'on':''}"><span>${label}${role==='intl'&&n?' · 파견':''}</span><b>${role==='intl'?lv+'단계':n?'★'.repeat(sc.skill):'빈자리'}</b></div>`; };
  const matrix=`<div class="covm"><div class="covr"><i>아마추어</i>${REG.map(r=>cell('am',r,r)).join('')}</div><div class="covr"><i>프로</i>${REG.map(r=>cell('pro',r,r)).join('')}</div><div class="covr"><i>해외</i>${Object.keys(IREG).map(r=>cell('intl',r,IREG[r].l)).join('')}</div></div>`;
  /* 담당 업무: 드롭다운 대신 아마추어·프로·해외 세 줄 버튼(optRow) */
  const opt=s=>{ const cur=(s.role||'am')+':'+s.region; const G3=[['아마',REG.map(r=>['am:'+r,r])],['프로',REG.map(r=>['pro:'+r,r])],['해외',Object.keys(IREG).map(r=>['intl:'+r,IREG[r].l])]];
    return `<div class="sasg" aria-label="담당 업무">${G3.map(([l,os])=>`<div><i>${l}</i>${optRow('sAssign',cur,os,s.id,'wsx')}</div>`).join('')}</div>`; };
  const it={cur:UI._smk?(UI.smkSrc==='oth'?'oth':'mkt'):'team',bar:''}; /* 채용 후보·다른 구단은 스태프 시장으로 */
  const TEAM=`<p class="small muted">스카우트 한 명은 한 가지 업무만 맡습니다. 투수 감별·타자 감별 특기가 있으면 그 유형 선수를 볼 때 능력이 한 단계 높습니다. 아마추어는 그 지역 고교·대학 선수(드래프트), 프로는 그 지역 연고 구단 선수, 해외는 그 나라 외국인 시장을 봅니다. 해외 담당을 보내면 그 나라 정보 수준이 한 단계 올라갑니다. 업무를 바꾸면 30일 동안 적응 기간이라 능력이 1 낮게 적용됩니다. 최대 ${scoutMax()}명.</p>
    ${matrix}${scoutChiefBox()}
    <div class="tgrid">${G.scouts.map(s=>scoutCard(s,`${opt(s)}${G.day-(s.since??-999)<30?`<span class="pill warn">적응 중 · ${dmd(s.since+30)}까지</span>`:''}<span class="small muted">${staffLoyWord(stAttr(s).loy)}</span><button class="tc-i" data-a="person" data-v="sc:${s.id}">인물 카드</button><button class="tc-i" data-a="fireScout" data-v="${s.id}">계약 해지</button>`)).join('')||'<p class="small muted">스카우트가 없습니다.</p>'}</div>`;
  const MK=`<div class="eyebrow">고용 ${G.scouts.length}/${scoutMax()}명 · ${stPrestigeLine()}</div>
    ${(()=>{ const f=UI.scF||'all'; return `<div class="row between"><span class="small muted">채용 후보 ${scoutMkt().length}명 · 매달 일부가 바뀝니다</span><div class="chips">${[['all','전체'],['P','투수 감별'],['B','타자 감별'],['hi','능력 4 이상']].map(([k,l])=>`<button data-a="scF" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div></div>`; })()}
    <div class="tgrid">${(()=>{ const SL=scoutMkt().filter(s=>{ const f=UI.scF||'all'; return f==='all'||(f==='hi'?s.skill>=4:s.spec===f); }).sort((a,b)=>b.skill-a.skill||a.sal-b.sal); const PG=pager('scm'+(UI.scF||''),SL,cardPageSize()); UI._scPg=PG.bar; return PG.items; })().map(s=>scoutCard(s,stMktInfo(s)+(stBidLive(s)?stBidBtns('sc',s,'tc-i'):`<button class="tc-i go" data-a="hireScout" data-v="${s.id}:0" ${G.scouts.length>scoutMax()?'disabled':''}>제안 · 연 ${money(s.sal||0)}</button><button class="tc-i" data-a="hireScout" data-v="${s.id}:0.2" ${G.scouts.length>scoutMax()?'disabled':''}>20% 더 · ${money(round5(s.sal*1.2))}</button>`))).join('')}</div>${UI._scPg||''}`;
  return it.cur==='mkt'?MK:it.cur==='oth'?stOtherView('sc'):TEAM+smkLink('sc','스카우트 채용');
}

/* 감독 카드 정리: 성향(어느 쪽이냐)은 양 끝 이름이 있는 한 줄 눈금, 능력(높을수록 좋음)은 점수 막대, 성격은 한 줄 */
const MSTY=[['small','빅볼','스몰볼'],['dfn','타격 중시','수비 중시'],['pen','선발 중심','불펜 중심'],['arm','투수 보호','투수 혹사'],['youth','성적 우선','육성 우선']];
function mgrStyleBox(m){ mgrAttr(m); return `<div class="msty">${MSTY.map(([k,a,b])=>{ const v=clamp(m[k],0,100); const side=v>=62?'r':v<=38?'l':''; return `<div class="msty-r"><span class="${side==='l'?'on':''}">${a}</span><span class="msty-t"><i style="left:${v}%"></i></span><span class="${side==='r'?'on':''}">${b}</span></div>`; }).join('')}</div>`; }
function mgrAbilBox(m){ mgrAttr(m); return `<div class="mabil">${[['장악력',m.disc,'선수단 기강·불만 관리'],['운영',m.tac,'경기 중 판단(작전·교체 타이밍)'],['안목',m.eye,'유망주·선수 평가 정확도'],['휴식 관리',m.rest,'주전 피로·부상 관리']].map(([l,v,d])=>`<div class="mabil-r" title="${d}"><span>${l}</span>${rchip(v)}<span class="track"><span class="now" style="width:${v}%;background:${rcol(v)}"></span></span></div>`).join('')}</div>`; }
function mgrPersLine(m){ return `<p class="small muted mpers keep">${m.ego>=70?'<b class="bad">고집 셈</b>':m.ego<=35?'유연함':'고집 보통'} · ${m.fame>=70?'<b>스타 감독</b>':m.fame<=35?'인지도 낮음':'인지도 보통'}</p>`; }
