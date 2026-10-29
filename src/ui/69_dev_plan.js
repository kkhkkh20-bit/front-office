/* ===== 훈련 방향(선수 화면 능력 탭, 운영 > 육성 > 훈련 방향) ===== */
function trnCoachOf(p,f){ const c=trnCoach(p.team,f==='bal'?(p.isP?'stf':'con'):f); return c; }
function trnCard(p){ if(p.team!==G.user||p.foreign||p.prospect||(p.joinY>G.year))return '';
  if(p.age>33)return `<section class="card"><span class="eyebrow">훈련 방향</span><p class="small muted">34세 이상은 코치진이 몸 관리 위주로 운영합니다.</p></section>`;
  const T=G.trn&&G.trn[p.id]; const mine=T&&T.by==='gm'; const rec=trnCoachPick(p); const f=mine?T.f:rec; const D=TRN[trnG(p)];
  const c=trnCoachOf(p,f); const role=(D[f]&&D[f].c)||(p.isP?'pc':'bc');
  const chips=Object.entries(D).map(([k,v])=>`<button class="btn small ${f===k?'on':''}" data-a="trnSet" data-v="${p.id}:${k}">${v.l}${k===rec?'<i class="trn-rec">코치안</i>':''}</button>`).join('');
  const o=trnObs(p);
  return `<section class="card trn"><div class="row between"><span class="eyebrow">훈련 방향</span><span class="small muted">${mine?'단장 요청':'감독·코치진 계획'}</span></div>
  <div class="talk">${chips}${mine?`<button class="btn small" data-a="trnSet" data-v="${p.id}:coach">코치진 계획으로</button>`:''}</div>
  <p class="small">담당: ${c?`<b>${esc(c.name)}</b> ${CROLE[role]?CROLE[role].l:''} · 육성력 ${c.dv}`:`${CROLE[role]?CROLE[role].l:'코치'} 공석`}</p>
  <div class="mop"><b>코치 의견</b><span>${esc(trnOpinion(p))}</span>${!mine&&rec!=='bal'?`<span class="small muted">따로 요청하지 않으면 감독·코치진 계획(${D[rec].l} 집중)대로 갑니다.</span>`:''}</div>
  ${o?`<div class="trn-rep"><b>최근 보고</b><div class="small">${D[T.f].l} 집중 ${o.w}주 · ${esc(o.lv)}</div>${o.stat?`<div class="small muted">경기 기록: ${esc(o.stat)}</div>`:''}<div class="small muted">능력 변화는 코치 관찰이고, 경기 기록은 운과 상대에 따라 따로 움직입니다.</div></div>`:''}
  ${p.age<=28?trnEnvBox(p):''}
  <p class="small muted">한 항목에 집중하면 몇 주~몇 달에 걸쳐 그 항목이 오르고, 겨울 성장 때 다른 항목의 오름폭이 그만큼 줄어듭니다. 항목마다 늘 수 있는 여력이 달라 약점 보완이 늘 정답은 아닙니다.${p.isP?' 체력 집중은 부상 위험을 조금 낮추고, 구위 집중은 조금 높입니다.':' 수비 집중은 포지션 전환과 별개입니다.'}</p>
  ${UI.trnMsg&&UI.trnMsg.id===p.id?`<div class="note">${esc(UI.trnMsg.t)}</div>`:''}</section>`; }
/* 운영 > 육성: 우리 선수 훈련 방향 한눈에. 줄마다 버튼으로 바로 고르고, 바꾼 것을 모아 한 번에 감독에게 제안한다 */
function trnListBody(){ const ps=domestic(G.user).filter(p=>p.age<=33&&!(p.joinY>G.year)).sort((a,b)=>(a.isP-b.isP)||(ovr(b)-ovr(a)));
  const pend=UI.trnPend||{}; const nP=Object.keys(pend).length;
  const row=p=>{ const T=G.trn&&G.trn[p.id]; const mine=T&&T.by==='gm'; const rec=trnCoachPick(p); const cur=mine?T.f:rec; const pk=pend[p.id]; const D=TRN[trnG(p)]; const o=mine?trnObs(p):null;
    const sel=pk||cur;
    return `<div class="trn-row${pk?' pend':''}"><div class="trn-h"><button class="nm lnk" data-a="trnOpen" data-v="${p.id}">${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세</span></button>
      <span class="small">${mine?'<span class="pill good">단장 요청</span>':'<span class="pill">코치진</span>'} 지금 <b>${D[cur].l}</b>${o?` · ${o.w}주 · ${esc(o.lv)}`:''}</span></div>
      <div class="seg trn-seg">${Object.entries(D).map(([k,v])=>`<button data-a="trnPick" data-v="${p.id}:${k}" class="${sel===k?'on':''}">${v.l}${k===rec?'<i>·</i>':''}</button>`).join('')}</div></div>`; };
  const bar=nP?`<div class="trn-bar"><span>${nP}명 바꿈</span><button class="btn small" data-a="trnPendClear">되돌리기</button><button class="btn small primary" data-a="trnApply">감독에게 제안하기</button></div>`:'';
  return `<p class="small muted">훈련의 주안점은 감독과 코치진이 상의해 선수마다 하나씩 정합니다(다른 구단도 같은 방식). 바꾸고 싶은 선수의 버튼을 누른 뒤 '감독에게 제안하기'로 한 번에 요청하세요. 점(·)은 코치진 추천안입니다. 이름을 누르면 코치 의견과 최근 보고를 볼 수 있습니다.</p>
  ${UI.trnApplyMsg?`<div class="note">${esc(UI.trnApplyMsg).replace(/\n/g,'<br>')}</div>`:''}${bar}
  <div class="eyebrow">야수</div><div class="trn-list">${ps.filter(p=>!p.isP).map(row).join('')}</div>
  <div class="eyebrow">투수</div><div class="trn-list">${ps.filter(p=>p.isP).map(row).join('')}</div>${bar}`; }
Object.assign(A,{ trnPick(v){ const [id,f]=v.split(':'); const p=G.players[+id]; if(!p)return; const T=G.trn&&G.trn[p.id]; const cur=T&&T.by==='gm'?T.f:trnCoachPick(p); UI.trnPend=UI.trnPend||{}; if(f===cur)delete UI.trnPend[id]; else UI.trnPend[id]=f; UI.trnApplyMsg=''; render(); },
  trnPendClear(){ UI.trnPend={}; render(); },
  trnApply(){ const P=UI.trnPend||{}; const L=[]; for(const id in P){ const p=G.players[+id]; if(!p)continue; const f=P[id]; const t=f===trnCoachPick(p)?trnSet(+id,'coach'):trnSet(+id,f); if(t)L.push(t); } UI.trnPend={}; UI.trnApplyMsg=L.join('\n'); save(); render(); } });
Object.assign(A,{ trnSet(v){ const [id,f]=v.split(':'); const t=trnSet(+id,f); UI.trnMsg=t?{id:+id,t}:null; save(); if(UI.sheet!=null)renderSheet(); render(); },
  trnOpen(v){ UI.ptab='abil'; A.player(v); } });
/* 성장 환경: 일반 훈련 속도를 정하는 것들 */
function trnEnvBox(p){ const f=tbFactors(p,isRegular(p)?new Set([p.id]):null); const g=potGapEst(p); const lv=(v,a,b)=>v>=a?'좋음':v>=b?'보통':'아쉬움';
  const m=G.mgr[G.user]; const tg=p.tg&&p.tg.y===G.year?p.tg.s:0;
  const L=[['1군 출장',isRegular(p)?'주전: 훈련 시간이 적은 대신 겨울 성장 때 출전량으로 큽니다':'훈련 시간이 많아 주중 훈련 효과가 큽니다'],
    ['잠재력 여지',g>=8?'많음(스카우트 추정)':g>=4?'보통(스카우트 추정)':g>=1?'적음(스카우트 추정)':'거의 없음(스카우트 추정)'],
    ['성장 의지',f.will>=1.1?'강함':f.will>=.92?'보통':'약함'],
    ['훈련 시설',`${esc(facEff(p).l)} · ${lv(f.fac,1.04,.97)}`],
    ['코치 수준',lv(f.coach,1.08,.97)],
    ['감독 육성 성향',m?`${esc(m.name)} ${m.youth}`:'감독 없음']];
  return `<div class="trn-env"><b>성장 환경</b>${L.map(([k,v])=>`<div class="small"><span class="muted">${k}</span> ${v}</div>`).join('')}<div class="small muted">올해 일반 훈련 성장: ${tg>=1.2?'많이 쌓임':tg>=.6?'보통':tg>=.15?'조금':'아직 거의 없음'}</div></div>`; }
/* 운영 > 육성 > 해외 연수 */
function ovsBody(){ const y=G.year; const T={big:'크게 늘어 옴',good:'성장 확인',flat:'변화 없음',form:'폼 흐트러짐',inj:'부상'};
  const fk=G.fall&&G.fall.y===y?G.fall.k:undefined; const fo=fallOpen();
  const fall=`<section class="card"><div class="row between"><span class="eyebrow">가을 교육리그 · 구단 단위</span><span class="small muted">${fo?'10월 10일까지 신청':'신청 9월 1일~10월 10일'}</span></div>
    <p class="small">25세 이하 선수 20명 안팎이 10월 중순부터 한 달 실전을 치릅니다. 대부분 작은 성장이고, 가끔 눈에 띄게 좋아지는 선수가 나옵니다.</p>
    ${fo?`<div class="talk">${Object.entries(FALL).map(([k,v])=>`<button class="btn small ${fk===k?'on':''}" data-a="fallSet" data-v="${k}">${v.l} ${money(v.c)}</button>`).join('')}<button class="btn small ${fk===null?'on':''}" data-a="fallSet" data-v="">불참(자체 마무리 훈련)</button></div>`:`<p class="small muted">올해: ${fk?FALL[fk].l:fk===null?'불참':'정하지 않음(불참)'}</p>`}
    <p class="small muted">${Object.values(FALL).map(v=>`${v.l}: ${v.d}`).join(' ')}</p></section>`;
  const used=new Set((G.ovs||[]).map(x=>x.pid));
  const prog=Object.entries(OVS).map(([k,o])=>{ const mine=(G.ovs||[]).filter(x=>x.prog===k); const open=ovsOpen(k);
    const cands=open&&mine.length<o.lim?domestic(G.user).filter(p=>ovsElig(p)&&p.age<=27&&!used.has(p.id)&&(k!=='us'||p.isP||p.r.pow<60)).sort((a,b)=>potGapEst(b)-potGapEst(a)).slice(0,6):[];
    return `<section class="card"><div class="row between"><span class="eyebrow">${o.l}</span><span class="small muted">1인 ${money(o.c)} · 동행 ${money(o.fix)} · ${o.lim}명까지</span></div>
      <p class="small">${o.d}</p>
      ${mine.length?`<div class="list">${mine.map(x=>{ const p=G.players[x.pid]; return p?`<div class="item"><button class="nm lnk" data-a="player" data-v="${p.id}">${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세</span></button><span class="sub">${x.go?'연수 중':'출발 대기'}</span>${x.go?'':`<button class="btn small danger" data-a="ovsSet" data-v="${p.id}:">취소</button>`}</div>`:''; }).join('')}</div>`:''}
      ${cands.length?`<div class="eyebrow">추천 후보(더 클 여지가 큰 순)</div><div class="list">${cands.map(p=>`<div class="item"><button class="nm lnk" data-a="player" data-v="${p.id}">${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세</span></button><button class="btn small" data-a="ovsSet" data-v="${p.id}:${k}">보내기</button></div>`).join('')}</div>`:open?'':`<p class="small muted">신청 기간: 9월 1일~${o.close[0]}월 ${o.close[1]}일</p>`}</section>`; }).join('');
  const A=G.ovsAi&&G.ovsAi.y===y?G.ovsAi:null;
  const lg=A?`<section class="card"><span class="eyebrow">올해 다른 구단</span>${G.teams.filter(t=>t.id!==G.user).map(t=>{ const f=A.fall[t.id]; const a=(A.abl[t.id]||[]).length, u=(A.us[t.id]||[]).length, j=(A.jpl[t.id]||[]).length; const L=[f?(f==='jp'?'미야자키':'울산'):'교육리그 불참',a?`호주 ${a}명`:'',u?`미국 ${u}명`:'',j?`일본 연수 ${j}명`:''].filter(Boolean); return `<div class="small"><b>${esc(tshort(t.id))}</b> ${L.join(' · ')}</div>`; }).join('')}</section>`:'';
  const past=domestic(G.user).filter(p=>(p.ovsH||[]).length).flatMap(p=>p.ovsH.map(h=>({p,h}))).sort((a,b)=>b.h.y-a.h.y).slice(0,10);
  const ps=past.length?`<section class="card"><span class="eyebrow">지난 연수 결과</span>${past.map(({p,h})=>`<div class="small">${h.y} ${esc(h.k)} · ${esc(p.name)}: ${T[h.t]||''}</div>`).join('')}</section>`:'';
  return `${UI.devMsg?`<div class="note bad">${esc(UI.devMsg)}</div>`:''}<p class="small muted">해외 연수는 돈이 드는 프로젝트입니다. 모든 구단이 보내지는 않고, 결과도 선수마다 크게 갈립니다. 어린 선수, 배우는 속도가 빠른 선수, 더 클 여지가 큰 선수일수록 크게 늘 가능성이 높고, 부상 체질이면 다칠 위험이 큽니다.</p>${fall}${prog}${lg}${ps}`; }
/* 투수 보직(선수 화면 능력 탭) */
function roleCard(p){ if(!p.isP||p.team!==G.user||(p.joinY>G.year))return ''; const g=G.prole&&G.prole[p.id]; const cur=g?g.k:'auto'; const m=G.mgr[G.user]; const v=m&&!m.interim?rpMgrView(p):null;
  const chips=Object.entries(PROLE).filter(([k])=>k!=='sp2'||p.age<=27).map(([k,l])=>`<button class="btn small ${cur===k?'on':''}" data-a="proleSet" data-v="${p.id}:${k}">${l}</button>`).join('');
  return `<section class="card trn"><div class="row between"><span class="eyebrow">보직</span><span class="small muted">지금: ${esc(rpNow(p))}</span></div>
  <div class="talk">${chips}</div>
  ${v?`<div class="mop"><b>감독 의중${g?'':' · 지금 적용 중'}</b><span>"${esc(v.t)}"</span>${g?`<span class="small muted">단장 요청(${PROLE[g.k]})이 적용 중입니다.</span>`:''}</div>`:''}
  <p class="small muted">선발 5명은 감독이 체력과 투구 내용으로 고르고 매주 다시 봅니다. 선발 체력 기준은 감독 성향에 따라 다르고(스몰볼 감독은 낮게, 불펜 의존이 큰 감독은 높게), 신인은 보통 1군 계투나 2군 선발 수업으로 시작합니다. 2군 선발 수업 중인 투수는 2군에서 선발로 던지며 체력을 키우고 1군에 올라오지 않습니다.</p>
  ${UI.roleMsg&&UI.roleMsg.id===p.id?`<div class="note">${esc(UI.roleMsg.t)}</div>`:''}</section>`; }
Object.assign(A,{ proleSet(v){ const [id,k]=v.split(':'); const t=proleSet(+id,k); UI.roleMsg=t?{id:+id,t}:null; if(UI.mail!=null&&t)toast(t); save(); if(UI.sheet!=null)renderSheet(); render(); } });
/* 수비 위치(선수 화면 능력 탭): 자리별 숙련도와 수비 평가, 전환 훈련 */
function posCard(p){ const own=p.team===G.user&&!(p.joinY>G.year); const hid=hideOvr(p); const v=versOf(p); const C=p.pconv;
  const cells=POS_F.map(k=>{ const main=p.pos===k, e=posExp(p,k), ok=main||e>=50; const val=ok&&!hid?clamp(r5(defAt(p,k)+hn('pf'+k,p.id)*2),20,80):null;
    return `<div class="${main?'main':ok?'sub':''}${C&&C.pos===k?' conv':''}"><span>${POSS[k]}</span>${val!=null?rchip(val):`<b class="rc q">${ok?'○':e>0?Math.round(e):'-'}</b>`}<i>${main?'주':ok?`숙련 ${Math.round(e)}`:e>0?'익히는 중':''}</i></div>`; }).join('');
  const conv=own&&p.age<33?`<div class="eyebrow" style="margin-top:8px">전환 훈련 ${C?`· ${POSK[C.pos]} 숙련 ${Math.round(posExp(p,C.pos))}/90`:''}</div><div class="talk">${POS_F.filter(k=>k!==p.pos).map(k=>`<button class="btn small ${C&&C.pos===k?'on':''}" data-a="posConv" data-v="${p.id}:${k}" ${versOf(p)<POS_NEED[k]?'disabled':''}>${POSK[k]}</button>`).join('')}${C?`<button class="btn small danger" data-a="posConv" data-v="${p.id}:">멈춤</button>`:''}</div>`:'';
  return `<section class="card"><div class="row between"><span class="eyebrow">수비 위치</span><span class="small muted">다재다능 ${hid?'?':dvGrade(v)}</span></div>${(p.use&&p.use.y===G.year&&p.use.g)||futText(p)?`<p class="small muted">${[p.use&&p.use.y===G.year&&p.use.g?'1군 '+esc(useText(p)):'',esc(futText(p))].filter(Boolean).join(' / ')}</p>`:''}<div class="posfit">${cells}</div>
  <p class="small muted">숫자는 그 자리 수비 평가입니다. 숙련 50 이상인 자리는 감독이 무리 없이 맡기고, 경기에 뛰거나 전환 훈련을 하면 숙련이 오릅니다. 다재다능이 높을수록 낯선 자리에서 덜 흔들리고 빨리 배웁니다. 어려운 자리(포수·유격수·중견수·2루수)는 다재다능이 받쳐 줘야 전환할 수 있습니다.</p>
  ${conv}${UI.posMsg&&UI.posMsg.id===p.id?`<div class="note">${esc(UI.posMsg.t)}</div>`:''}</section>`; }
Object.assign(A,{ posConv(v){ const [id,k]=v.split(':'); const t=posConv(+id,k||null); UI.posMsg=t?{id:+id,t}:null; save(); if(UI.sheet!=null)renderSheet(); render(); } });
/* 선수 화면 요약: 올해 2군 기록과 2군에서 뛴 자리 */
function fut2Card(p){ if(p.prospect||p.team==null)return ''; const y=period()==='pre'?G.year-1:G.year; const h=seasonTotal(p,y,'퓨처스'); if(!h||!(p.isP?h.outs:h.pa))return '';
  const T=p.isP?[['경기',`${h.g||0}${h.gs?` (선발 ${h.gs})`:''}`],['ERA',pRate(h).era.toFixed(2)],['이닝',ipStr(h.outs)],['삼진',h.so],['볼넷/9',pRate(h).bb9.toFixed(1)]]
    :[['경기',h.g||0],['타율',fmt3(bRate(h).avg)],['OPS',fmt3(bRate(h).ops)],['홈런',h.hr],['볼넷',h.bb]];
  const ft=!p.isP&&p.fuse&&p.fuse.y===y?futText(p):''; const sp2=p.isP&&p.team!=null&&rpPlanOf(p.team,p)==='sp2';
  return `<section class="card"><div class="row between"><span class="eyebrow">${y} 2군 성적</span>${ft||sp2?`<span class="small muted">${esc(ft||'2군 선발 수업 중')}</span>`:''}</div><div class="tiles">${T.map(t=>`<div class="tile"><b>${t[1]}</b><span>${t[0]}</span></div>`).join('')}</div></section>`; }
/* 감독 영입 면담: 받을 약속 고르기 */
function mplPickCard(){ const sel=UI.mplSel||[];
  return `<section class="card"><span class="eyebrow">영입 면담: 받아 둘 약속</span><p class="small">단장은 감독에게 건의만 할 수 있고 기용 권한은 없습니다. 영입할 때 약속을 받아 두면 계약 기간 동안 지킵니다. 후보마다 그대로 수용하거나, 연봉 10%를 더 요구하거나, 거절합니다.</p>
  <div class="chips">${Object.entries(MPL).map(([k,v])=>`<button data-a="mplSel" data-v="${k}" class="${sel.includes(k)?'on':''}">${v.l}</button>`).join('')}</div>
  <p class="small muted">${Object.values(MPL).map(v=>`${v.l}: ${v.d}`).join(' ')}</p>${UI.mgrMsg?`<div class="note bad">${esc(UI.mgrMsg)}</div>`:''}</section>`; }
function mplStanceBox(x){ const sel=UI.mplSel||[]; if(!sel.length)return ''; const st=sel.map(k=>[k,mplStance(x,k)]); const pay=st.filter(s=>s[1]==='pay').length;
  return `<div class="mpl">${st.map(([k,s])=>`<div class="small"><span class="pill ${s==='ok'?'good':s==='pay'?'warn':'bad'}">${MPL_ST[s]}</span> ${MPL[k].l}</div>`).join('')}${st.some(s=>s[1]==='no')?'<div class="small muted">거절한 약속을 빼야 계약할 수 있습니다.</div>':pay?`<div class="small muted">연봉 ${money(round5(x.sal*(1+.1*pay)))}로 계약됩니다.</div>`:''}</div>`; }
Object.assign(A,{ mplSel(v){ const s=new Set(UI.mplSel||[]); s.has(v)?s.delete(v):s.add(v); UI.mplSel=[...s]; UI.mgrMsg=''; render(); } });
/* 선수단 > 2군: 2군 선수단이 따로 돌아가는 모습 */
function futSquadView(tid){ const own=tid===G.user; const d=depth(tid); const vis=p=>own||!scoutReport(p).unseen||publicP(p);
  const FL=G.futLn&&G.futLn[tid]&&period()==='season'?G.futLn[tid]:null; const B=d.futB.filter(p=>!p.ys&&vis(p)), P=d.futP.filter(p=>!p.ys&&vis(p));
  const ln=FL?Object.fromEntries(Object.entries(FL.ln).map(([k,id])=>[k,G.players[id]]).filter(([k,p])=>p&&p.team===tid&&!p.e1&&healthy(p))):futLineup(B);
  const inLn=new Set(Object.values(ln).map(p=>p.id)); const R=(p,l)=>glanceRow(p,l,own,'2');
  const conv=p=>p.pconv?` ${POSS[p.pconv.pos]} 전환 중`:'';
  const lnRows=FGPOS.filter(k=>ln[k]).map(k=>R(ln[k],`${POSS[k]}${ln[k].pconv&&ln[k].pconv.pos===k?'*':''}`)).join('');
  const rest=B.filter(p=>!inLn.has(p.id)).map(p=>R(p,'대기')).join('');
  const sp=P.filter(p=>isSPr(p)), rp=P.filter(p=>!isSPr(p));
  const spRows=sp.map(p=>R(p,rpPlanOf(tid,p)==='sp2'?'수업':'선발')).join(''), rpRows=rp.map(p=>R(p,'불펜')).join('');
  let rk=null; if(own)try{ rk=slotRanks(G.user); }catch(e){}
  const W=own?playersOf(tid).map(p=>({p,w:callWish(p,rk)})).filter(x=>x.w):[];
  const wish=own&&entryOn()?`<section class="card"><div class="row between"><span class="eyebrow">1군에 올려 달라는 선수</span><span class="small muted">단장은 건의만, 결정은 감독</span></div>
    ${W.length?W.map(({p,w})=>`<div class="item"><button class="nm lnk" data-a="player" data-v="${p.id}">${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세</span></button><span class="sub">${esc(w.t)}${(p.wishW||0)>3?' · 기다림이 길어져 기분이 떨어지는 중':''}</span><button class="btn small" data-a="reqUp" data-v="${p.id}">감독에게 콜업 건의</button></div>`).join(''):'<p class="small muted">지금은 없습니다. 2군에서 잘하고 1군 같은 자리와 견줄 만한 선수 가운데 욕심이 있거나 나이가 찬 선수가 올려 달라고 합니다.</p>'}
    ${UI.entMsg?`<div class="note">${esc(UI.entMsg.t)}</div>`:''}<p class="small muted">감독이 건의를 자주 거절하면 관계가 떨어집니다. 영입 면담에서 '단장 건의 존중'을 약속받은 감독은 거의 받아들입니다. 끝내 맞지 않으면 경질할 수 있습니다.</p></section>`:'';
  const away=playersOf(tid).filter(p=>!healthy(p)&&!p.e1&&vis(p));
  return `${wish}<section class="card"><div class="row between"><h2 class="sec">2군 야수 ${B.length}명</h2><span class="small muted">${FL?`${dmd(FL.d)} 2군 라인업`:'예상 라인업'}</span></div>
    <div class="eyebrow">2군 라인업</div>${lnRows||'<p class="small muted">야수가 없습니다.</p>'}${rest?`<div class="eyebrow">대기 (한 주 1경기 정도)</div>${rest}`:''}
    <p class="small muted">자리 옆 *는 전환 훈련 중인 자리입니다. 라인업에 든 선수는 한 주 3경기에 나가고, 2군에서 뛴 자리는 숙련으로 쌓입니다. 2군 감독은 24세 이하에게 기회를 더 주며 조금씩 돌려 씁니다.</p></section>
  <section class="card"><h2 class="sec">2군 투수 ${P.length}명</h2><div class="eyebrow">선발${sp.some(p=>rpPlanOf(tid,p)==='sp2')?' (수업 = 2군 선발 수업)':''}</div>${spRows||'<p class="small muted">없습니다.</p>'}<div class="eyebrow">불펜</div>${rpRows||'<p class="small muted">없습니다.</p>'}</section>
  ${own&&d.futB.concat(d.futP).some(p=>p.ys)?`<section class="card"><h2 class="sec">육성선수</h2>${d.futB.concat(d.futP).filter(p=>p.ys).map(p=>R(p,'육성')).join('')}</section>`:''}
  ${away.length?`<section class="card"><h2 class="sec">부상·재활</h2><p class="small">${away.map(p=>`${esc(p.name)}(${outTxt(p)})`).join(', ')}</p></section>`:''}`; }
/* 지난 시즌과 비교: 무엇이 올랐고 내렸는지만(화살표) */
function cmpCard(p){ if(p.team!==G.user||p.prospect||!p.rh)return ''; const y0=p.rh[G.year-1]?G.year-1:p.rh[G.year]?G.year:null; if(y0==null)return ''; const R0=p.rh[y0];
  const ks=(p.isP?['stf','ctl','sta']:['con','pow','eye','spd','def']).filter(k=>R0[k]!=null);
  const ar=k=>{ const d=p.r[k]-R0[k]; return d>=.5?'<em class="gr up">▲</em>':d<=-.5?'<em class="gr dn">▼</em>':'<em class="gr">-</em>'; };
  return `<section class="card"><div class="row between"><span class="eyebrow">${y0===G.year?'올 시즌 시작과 비교':'지난 시즌 시작과 비교'}</span><span class="small muted">${y0}년 1월 기준</span></div>
  <div class="cmpt">${ks.map(k=>`<div><span>${OVS_TOOLN[k]}</span>${ar(k)}</div>`).join('')}</div></section>`; }
