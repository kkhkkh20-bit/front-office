/* ---------- 선수 카드와 경기 기록 ---------- */
function statTable(p){
  const rows=[...p.hist].sort((a,b)=>b.y-a.y||(a.lvl<b.lvl?-1:1));
  const pre=p.prev?[Object.assign({y:G.year-1,pre:p.prev.lvl},p.prev)]:p.am?[Object.assign({y:G.year,pre:'아마'},p.am)]:[];
  const one=p.hist.filter(h=>h.lvl==='1군'); let tot=null; if(one.length>1){ tot=Object.assign({},p.isP?ZP:ZB,{y:'통산',tot:true,war:sum(one.map(h=>wOf(h,p)))}); for(const h of one)addTo(tot,h); tot.y='통산'; }
  const all=[...(tot?[tot]:[]),...rows,...pre]; if(!all.length)return '<p class="small muted">기록이 없습니다.</p>';
  const lab=h=>h.tot?'1군 합계':h.pre?h.pre:`${tshort(h.t)}${h.lvl==='퓨처스'?' F':''}`;
  if(p.isP){
    return `<table><thead><tr><th>시즌</th><th>구단</th><th class="key">ERA</th><th class="key">WAR</th><th>경기</th><th>선발</th><th>이닝</th><th>승</th><th>패</th><th>세</th><th>홀</th><th>탈삼진</th><th>볼넷</th><th>피안타</th><th>피홈런</th><th>WHIP</th><th>K/9</th><th>BB/9</th></tr></thead><tbody>${all.map(h=>{const r=pRate(h); return `<tr><td>${h.y2?`${h.y}~${String(h.y2).slice(2)}`:h.y}</td><td>${lab(h)}</td><td class="key">${h.outs?r.era.toFixed(2):'-'}</td><td class="key">${h.tot?h.war.toFixed(1):h.pre?'-':wOf(h,p).toFixed(1)}</td><td>${h.g||0}</td><td>${h.gs||0}</td><td>${ipStr(h.outs)}</td><td>${h.w||0}</td><td>${h.l||0}</td><td>${h.sv||0}</td><td>${h.hld||0}</td><td>${h.so}</td><td>${h.bb}</td><td>${h.h}</td><td>${h.hr}</td><td>${h.outs?r.whip.toFixed(2):'-'}</td><td>${h.outs?r.k9.toFixed(1):'-'}</td><td>${h.outs?r.bb9.toFixed(1):'-'}</td></tr>`}).join('')}</tbody></table>`;
  }
  return `<table><thead><tr><th>시즌</th><th>구단</th><th class="key">OPS</th><th class="key">WAR</th><th>경기</th><th>타석</th><th>타율</th><th>출루율</th><th>장타율</th><th>안타</th><th>2루타</th><th>3루타</th><th>홈런</th><th>타점</th><th>득점</th><th>도루</th><th>볼넷</th><th>삼진</th><th>볼삼비</th><th>BABIP</th></tr></thead><tbody>${all.map(h=>{const r=bRate(h); return `<tr><td>${h.y2?`${h.y}~${String(h.y2).slice(2)}`:h.y}</td><td>${lab(h)}</td><td class="key">${h.pa?fmt3(r.ops):'-'}</td><td class="key">${h.tot?h.war.toFixed(1):h.pre?'-':wOf(h,p).toFixed(1)}</td><td>${h.g||0}</td><td>${h.pa}</td><td>${fmt3(r.avg)}</td><td>${fmt3(r.obp)}</td><td>${fmt3(r.slg)}</td><td>${h.h}</td><td>${h.d}</td><td>${h.tr}</td><td>${h.hr}</td><td>${h.rbi}</td><td>${h.r}</td><td>${h.sb}</td><td>${h.bb}</td><td>${h.so}</td><td>${h.so?(h.bb/h.so).toFixed(2):'-'}</td><td>${babipOf(h)!=null?fmt3(babipOf(h)):'-'}</td></tr>`}).join('')}</tbody></table>`;
}
function keyBar(p,rp,isFA,isFM){ const cur=p.fdPool?null:rp.cur, pot=p.fdPool?null:rp.ofp; const fg=p.fdPool?fdGrade(p):null; const sal=isFM?p.ask:isFA&&p.ask?p.ask.annual:p.sal;
  const ct=p.prospect?'드래프트 대상':p.fdPool?tContract(p):isFM?`요구 · ${Math.round(p.ask/USD)}만 달러`:isFA?`FA 요구 ${p.ask?p.ask.years+'년':''}`:p.extNext?`다년 합의 ${p.extNext.years}년`:p.faC?`${p.ext?'다년':'FA'} 잔여 ${p.yrs}년`:p.foreign?'1년 계약':`FA까지 ${Math.max(0,faSvc(p)-p.svc)}년`;
  const box=(l,v,c,sub)=>`<div class="kb"><span>${l}</span><b style="color:${c}">${v}</b>${sub?`<i>${sub}</i>`:''}</div>`;
  return `<div class="kbar">${box(fg?'추정 등급':'현재',fg?fg.g:cur??'?',fg?fg.c:cur!=null?rcol(cur):'var(--muted)',fg?'스카우트 추정 · 지명 후 공개':rp.exact?'정확':'추정')}${box('잠재력',fg?(fg.up?'↑':'-'):pot??'?',pot!=null?rcol(pot):'var(--muted)',pot==null?(p.fdPool?(fg&&fg.up?'성장 여지 있음':'지명 후 공개'):'알 수 없음'):pot-(cur||0)>=8?'성장 여지 큼':pot-(cur||0)>=3?'조금 더 성장':p.age>=33?'하락 시작':p.age>=29?'전성기':'거의 완성')}${box('연봉',p.prospect?'-':money(sal||0),'#e8ecf3',ct)}</div>${valueLine(p,rp)}`; }
/* 현재 전력·잠재력 예상·구단 기여를 나눠 보여 준다. 우리 젊은 선수는 스카우트와 감독의 시각을 함께 */
function valueLine(p,rp){ if(p.prospect||p.fdPool||p.team==null)return ''; const L=[];
  const hs=p.hist.filter(h=>h.lvl==='1군'&&h.t===p.team&&h.y>=(G.startY||0)); const ys=[...new Set(hs.map(h=>h.y))]; const w=sum(ys.map(y=>{ const h=seasonTotal(p,y,'1군'); return h&&h.t===p.team?wOf(h,p):0; }));
  L.push(`<span><i>구단 기여</i>${ys.length?`${esc(tshort(p.team))} ${ys.length}시즌 · 1군 WAR <b>${w.toFixed(1)}</b>`:`${esc(tshort(p.team))} 첫 시즌`}</span>`);
  if(p.team===G.user&&!p.foreign&&p.age<=25){ if(rp.ofp!=null)L.push(`<span><i>스카우트</i>잠재력 ${rp.ofp} 전망 · 확신 ${esc(rp.conf||'보통')}</span>`);
    try{ const d=depth(G.user); const k=pSlot(p); const st=k==='SP'?d.sp[4]:k==='RP'?d.pen[3]:d.ln[k]; const reg=[...d.start,...d.sp,...d.pen.slice(0,4)].some(x=>x.id===p.id);
      const v=reg?'주전으로 씁니다':st&&ovr(st)-ovr(p)>=6?`지금은 ${esc(st.name)}(${Math.round(ovr(st))}) 뒤입니다. 1군 기용은 어렵다고 봅니다`:st?`${esc(st.name)}(${Math.round(ovr(st))})와 경쟁할 수 있다고 봅니다`:'기회를 줄 수 있다고 봅니다'; L.push(`<span><i>감독</i>${v}</span>`); }catch(e){} }
  return `<div class="vline">${L.join('')}</div>`; }
function reportCard(p,noTools){
  const rp=scoutReport(p);
  if(hideOvr(p))return `<section class="card"><div class="row between"><h2 class="sec">스카우트 의견</h2><span class="small muted">${esc(rp.who)} · 정확도 ${rp.conf}</span></div>
    <div class="row">${p.team!=null&&team(p.team).cap===p.id?'<span class="pill good">주장</span>':''}${p.team!=null&&isFranchise(p)?`<span class="pill acc">${esc(tshort(p.team))} 프랜차이즈 스타 · ${teamTenure(p,p.team).n}시즌</span>`:''}<span class="pill acc">${esc(rp.arch)}</span>${rp.role?`<span class="pill">장래 ${esc(rp.role)}</span>`:'<span class="pill">잠재력 판단 불가</span>'}<span class="pill ${rp.risk==='높음'?'bad':rp.risk==='낮음'?'good':''}">위험도 ${rp.risk}</span>${rp.eta?`<span class="pill">1군까지 약 ${rp.eta}년</span>`:''}</div>
    <div class="quote">${rp.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>
    <p class="small muted">${p.fdPool?'창단 드래프트 후보는 능력치가 공개되지 않습니다. 지난 시즌 기록과 나이, 스카우트 의견으로 판단하세요. 지명하는 순간 공개됩니다.':p.prospect?'아마추어 선수는 능력치를 알 수 없습니다. 학년별 기록과 스카우트 의견으로 판단하세요. 지명하면 우리 코치진이 능력치를 파악합니다.':'영입 전에는 능력치를 알 수 없습니다. 지난 리그 기록과 스카우트 의견으로 판단하세요.'}</p></section>`;
  const bar=t=>{ const w=v=>Math.round((v-20)/60*100); const fut=rp.ofp!=null&&t.fut>t.cur; return `<div class="tool" style="--c:${rcol(t.cur)};--c2:${rcol(t.fut)}"><span>${TOOLK[t.k]}</span>${rchip(t.cur)}<span class="track"><span class="mid"></span>${fut?`<span class="fut" style="width:${w(t.fut)}%"></span>`:''}<span class="now" style="width:${w(t.cur)}%"></span></span>${fut?rchip(t.fut):'<span></span>'}</div>`; };
  return `<section class="card">
    <div class="row between"><h2 class="sec">스카우트 리포트</h2><span class="small muted">${esc(rp.who)} · 정확도 ${rp.conf}</span></div>
    <div class="tiles"><div class="tile"><span class="g" style="color:${rcol(rp.cur)}">${rp.cur}</span><span class="l">현재 종합</span></div><div class="tile key"><span class="g" style="color:${rp.ofp!=null?rcol(rp.ofp):'var(--muted)'}">${rp.ofp??'?'}</span><span class="l">잠재력</span></div><div class="tile"><span class="g" style="font-size:16px">${rp.risk}</span><span class="l">위험도</span></div>${rp.eta?`<div class="tile"><span class="g" style="font-size:16px">${rp.eta}년</span><span class="l">1군 도달 예상</span></div>`:''}</div>
    ${rp.role?`<p class="small"><span class="muted">장래 역할</span> <b>${esc(rp.role)}</b></p>`:''}
    ${noTools?'':`<div class="tools">${rp.tools.map(bar).join('')}</div>
    <p class="small muted">20~80 척도, 50이 1군 평균. 왼쪽 숫자는 현재, 오른쪽은 스카우트가 보는 미래입니다.</p>`}
    <div class="quote">${rp.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>
  </section>`;
}
function entryForm(p){
  const on=entryOn(); let st;
  if(p.ys)st=`<b>육성선수</b> · 정식 로스터(40명) 밖에서 2군 경기에 나갑니다.`;
  else if(!on)st='시즌 중이 아니라 1군 엔트리가 없습니다.';
  else if(p.e1)st=`<b>1군 등록</b> · ${p.upDay!=null?dmd(p.upDay)+' 등록':''}`;
  else st=`<b>2군</b>${p.downDay!=null?` · ${dmd(p.downDay)} 말소 · ${G.day-p.downDay>=10?'재등록 가능':dmd(p.downDay+10)+'부터 재등록 가능'}`:''}`;
  const btns=[];
  if(on&&!p.ys)btns.push(p.e1?`<button class="btn small" data-a="reqDown" data-v="${p.id}">2군 말소 요청</button>`:`<button class="btn small" data-a="reqUp" data-v="${p.id}" ${canUp(p)?'':'disabled'}>1군 콜업 요청</button>`);
  if(p.ys)btns.push(`<button class="btn small" data-a="fromYS" data-v="${p.id}">정식 선수로 등록</button>`);
  else if(!p.foreign&&!p.faC&&p.sal<=100)btns.push(`<button class="btn small" data-a="toYS" data-v="${p.id}">육성선수로 전환</button>`);
  return `<section class="card"><span class="eyebrow">엔트리</span><p class="small">${st}</p><div class="row">${btns.join('')}</div>${UI.entMsg&&UI.entMsg.id===p.id?`<div class="note">${esc(UI.entMsg.t)}</div>`:''}<p class="small muted">1군 엔트리(${entryLimit()}명)는 감독이 관리합니다. 단장은 콜업·말소를 요청할 수 있고, 감독 성향과 관계에 따라 받아들여지지 않을 수 있습니다. 말소된 선수는 10일이 지나야 다시 올라옵니다. 육성선수는 5월 1일부터 정식 선수로 등록할 수 있습니다.</p></section>`;
}
function growthCard(p){
  if(p.prospect||p.team!==G.user||!p.oh||!p.oh.length)return '';
  const pts=p.oh.map(x=>({y:x.y,v:clamp(r5(x.o+hn('gh'+x.y,p.id)*1.5),20,80)}));
  const lg=p.devLog; const pl=lg?(lg.play>=1.08?'주전급 출전':lg.play>=1?'충분한 출전':lg.play>=.92?'출전 부족':'거의 못 뜀'):'';
  return `<section class="card"><div class="row between"><span class="eyebrow">연도별 코치진 평가</span><span class="small muted">매년 겨울 성장 반영</span></div>
    <div class="growth">${pts.map(x=>`<div><i style="height:${Math.max(6,(x.v-20)*1.6)}px;background:${rcol(x.v)}"></i><b>${x.v}</b><span>${String(x.y).slice(2)}</span></div>`).join('')}</div>
    ${lg?`<p class="small muted">지난 겨울 성장 요인: ${lg.y}시즌 ${pl} · ${esc(lg.fac)}${G.mgr[G.user]?` · ${esc(G.mgr[G.user].name)} 감독 육성 ${G.mgr[G.user].youth}`:''}</p>`:''}</section>`;
}
function renderSheet(){ const el=$('#sheet'); const had=el&&!!el.querySelector('.sheet'); renderSheet0(); try{ autoLink(el); }catch(e){} if(had){ const sh=el.querySelector('.sheet'); if(sh)sh.classList.add('noanim'); } markHints(el); }
function renderSheet0(){
  const el=$('#sheet');
  if(!G){ el.innerHTML=''; return; }
  if(UI.cast&&UI.sheet==null&&!UI.menu){ const ex=el.querySelector('.cast'); if(!ex||+ex.dataset.g!==UI.cast.g){ el.innerHTML=castSheet(); castMount(); } return; }
  if(UI.menu){ el.innerHTML=menuSheet(); return; }
  if(UI.teamSh!=null&&UI.sheet==null){ el.innerHTML=teamSheet(UI.teamSh); return; }
  if(UI.myRos&&UI.sheet==null){ G.tutFlags=G.tutFlags||{}; G.tutFlags.roster=true; el.innerHTML=myRosterSheet(); return; }
  if(UI.person&&UI.sheet==null){ el.innerHTML=personSheet(UI.person); return; }
  if(UI.game!=null){ el.innerHTML=gameSheet(UI.game); return; }
  if(UI.posSheet){ el.innerHTML=UI.posSheet.includes(':')?teamPosSheet(UI.posSheet):posSheet(UI.posSheet); return; }
  if(UI.sheet==null){ el.innerHTML=''; return; }
  const p=G.players[UI.sheet]; if(!p){UI.sheet=null; el.innerHTML=''; return;}
  const rp=scoutReport(p); const h=curLine(p); const per=period();
  const isFA=G.fa&&G.fa.open&&!G.fa.closed&&G.fa.pool.includes(p.id)&&p.team==null;
  const isFM=p.foreign&&p.team==null&&(G.fmarket||[]).includes(p.id);
  const d=G.draft; const canPick=p.prospect&&d&&!d.done&&d.picks[d.cur].tid===G.user;
  let actions='';
  if(canPick)actions=`<button class="btn primary block" data-a="pick" data-v="${p.id}">${d.picks[d.cur].rd}라운드 ${d.picks[d.cur].no}순위로 지명</button>`;
  if(p.fdPool&&G.fd&&!G.fd.done){ const fk=G.fd.picks[G.fd.cur]; actions=`<div class="row" style="gap:6px">${fk&&fk.tid===G.user&&G.fd.open!==false?`<button class="btn primary" style="flex:1" data-a="fdPick" data-v="${p.id}">${fk.rd}라운드 ${fk.no}번째로 지명</button>`:''}<button class="btn" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 해제':'☆ 관심'}</button></div>`; }
  if(isFA)actions=negPanel(p)+offerForm(p)+(UI.faMsg&&UI.faMsg.id===p.id?`<div class="note">${esc(UI.faMsg.t)}</div>`:'');
  if(isFM){ const err=foreignOpen()?foreignCheck(G.user,p):'지금은 외국인 선수를 영입할 수 없습니다.'; const mid=per==='season'; const repl=mid&&(G.sea.repl[G.user]||0)>=F_REPL_MAX;
    actions=`<section class="card"><p class="small">요구 연봉 <b class="num">${money(p.ask)}</b> (약 ${Math.round(p.ask/USD)}만 달러)${mid?` · 남은 기간분 ${money(Math.round(p.ask*remainFrac()))}`:''}</p>${err||repl?`<div class="note bad">${repl?'이번 시즌 외국인 교체 횟수를 다 썼습니다.':esc(err)}</div>`:''}<button class="btn primary block" data-a="signF" data-v="${p.id}" ${err||repl?'disabled':''}>계약하기</button>${UI.fmsg?`<div class="note">${esc(UI.fmsg)}</div>`:''}</section>`; }
  if(p.team!=null&&p.team!==G.user&&!p.foreign&&!(p.joinY>G.year)){ actions=tradeOpen()?`<button class="btn block" data-a="toTrade" data-v="${p.id}">데려오기 협상</button>`:'<p class="small muted">트레이드 기간이 아닙니다.</p>'; }
  if(isFM)actions+=`<div class="row"><button class="btn" data-a="fwatch" data-v="${p.id}">${fwatchOn(p.id)?'관찰 명단에서 빼기':'대체 후보 관찰 명단에 올리기'}</button>${fwatchOn(p.id)?`<span class="small muted">스카우트 파악도 ${fwatchK(p.id)}% · 능력 오차 약 ±${Math.max(1,Math.round(rp.sd||0))}</span>`:''}</div>${UI.fwMsg?`<p class="small muted">${esc(UI.fwMsg)}</p>`:''}`;
  if(p.team===G.user&&!(p.joinY>G.year)){
    const parts=[];
    parts.push(entryForm(p));
    if(!p.foreign&&p.age<=28)parts.push(devForm(p));
    if(canExtend(p))parts.push('<div id="s-ext"></div>'+extForm(p));
    else if(UI.ext&&UI.ext.id===p.id&&UI.ext.msg)parts.push(`<div class="note ${UI.ext.ok?'good':''}">${esc(UI.ext.msg)}</div>`);
    parts.push(`<div class="row" style="margin-top:14px;justify-content:flex-end">${UI.confirmRel===p.id?`<button class="btn danger" data-a="release" data-v="${p.id}">정말 방출${p.faC?` (정산 ${money(Math.round(p.sal*p.yrs*.5))})`:''}</button><button class="btn" data-a="relCancel">취소</button>`:`<button class="btn danger" data-a="relAsk" data-v="${p.id}">방출</button>`}</div>`);
    actions=parts.join('');
  }
  const status=p.injOut>0?`<span class="pill bad">부상 · 복귀까지 약 ${p.injOut}일</span>`:'';
  const meas=p.isP?`직구 평균 ${veloOf(p)}km/h · 최고 ${veloMax(p)}km/h`:`타구속도 평균 ${evOf(p)}km/h · 홈→1루 ${runOf(p)}초`;
  const tiles=h?(p.isP?[['ERA',h.outs?pRate(h).era.toFixed(2):'-',1],['WAR',wOf(h,p).toFixed(1),1],['이닝',ipStr(h.outs)],['탈삼진',h.so],[h.sv?'세이브':h.hld?'홀드':'승',h.sv||h.hld||h.w]]
    :[['OPS',h.pa?fmt3(bRate(h).ops):'-',1],['WAR',wOf(h,p).toFixed(1),1],['타율',fmt3(bRate(h).avg)],['홈런',h.hr],['타점',h.rbi]]):null;
  const where=p.prospect?`드래프트 대상 · ${p.region}`:p.fdPool?`창단 드래프트 후보${p.fdFrom!=null?` · 전 ${tshort(p.fdFrom)}`:''}`:p.foreign&&!p.team?`외국인 영입 후보 · ${p.nat}`:p.joinY>G.year?`${tname(p.team)} 입단 예정`:tname(p.team??p.faFrom);
  const pt=p.team!=null?team(p.team):null; const pst=pt?`--pt:${tpal(pt)[2]};--pt2:${tpal(pt)[3]}`:'';
  const ownP=p.team===G.user&&!(p.joinY>G.year); const st=careerStory(p);
  const hasM=ownP;
  const tabs=[...(p.prospect||p.fdPool||isFM?[]:[['abil','능력']]),['sum','요약'],['rec','기록'],...(st?[['story','이야기']]:[]),...(hasM?[['mgmt','관리']]:[])];
  let T=UI.ptab||'abil'; if(!tabs.some(t=>t[0]===T))T='sum';
  const tabBar=`<div class="seg ptabs">${tabs.map(([k,l])=>`<button data-a="ptab" data-v="${k}" class="${T===k?'on':''}">${l}</button>`).join('')}</div>`;
  el.innerHTML=`<div class="scrim" data-a="closeSheet"><div class="sheet gut" style="${pst}" role="dialog" aria-label="${esc(p.name)} 선수 정보" data-stop="1">
   <div class="sheet-head"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${avImg(p,true)}<div><div class="eyebrow">${where}${isFA?' · FA':''}${p.foreign&&p.team?` · ${p.foreign==='아시아'?'아시아쿼터':'외국인'} · ${p.nat}`:''}</div>
    <h2 class="sec" style="font-size:24px">${esc(p.name)}</h2>${p.aw&&p.aw.length?`<div class="row" style="gap:4px;margin:2px 0">${p.aw.slice(-6).map(a=>`<span class="awp">${awArt(a,18)}${esc(a)}</span>`).join('')}</div>`:''}
    <p class="small muted">${posLabel(p)} · ${p.age}세 · ${hand(p)}${p.foreign?'':` · ${p.college?'대졸':'고졸'} · ${esc(milText(p))}`}${p.draft?` · ${p.draft.y} ${p.draft.rd}R ${p.draft.no}순위`:''}${p.dev?' · 육성선수 출신':''}</p></div></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
   ${keyBar(p,rp,isFA,isFM)}
   <div class="row"><span class="pill acc">${esc(rp.arch)}</span>${rp.role?`<span class="pill">장래 ${esc(rp.role)}</span>`:''}${status}</div>
   ${quickActs(p)}
   ${tabBar}
   ${T==='sum'?`
   ${staffCardP(p)}
   ${tiles?`<div><div class="eyebrow" style="margin-bottom:6px">${h.y} ${h.lvl==='퓨처스'?'2군':'1군'} 성적</div><div class="tiles">${tiles.map(t=>`<div class="tile${t[2]?' key':''}" data-a="recGo" data-v="${p.isP?'pit':'bat'}:${({OPS:'ops',WAR:'war',타율:'avg',홈런:'hr',타점:'rbi',ERA:'era',이닝:'ip',탈삼진:'so',세이브:'sv',홀드:'hld',승:'w'})[t[0]]||'war'}" role="button" title="리그 순위 보기"><span class="g">${t[1]}</span><span class="l">${t[0]}</span></div>`).join('')}</div></div>`:''}
   ${p.prospect?`<section class="card"><div class="row between"><span class="eyebrow">아마추어 프로필</span><button class="btn small${(G.shortlist||[]).includes(p.id)?' primary':''}" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 선수':'☆ 관심 표시'}</button></div><dl class="kv"><dt>학교</dt><dd>${esc(p.school||'-')} (${p.college?'대학 4년':'고교 3년'})</dd><dt>체격</dt><dd>${p.ht||'-'}cm · ${p.wt||'-'}kg</dd><dt>${p.isP?'최고 구속':'1루 도달'}</dt><dd>${p.isP?(p.amVelo||veloOf(p))+'km/h':(p.amRun||runOf(p))+'초'}</dd><dt>언론 순위</dt><dd>${p.press||'-'}위</dd><dt>의료 기록</dt><dd>${p.amInj?esc(p.amInj):'특이 사항 없음'}</dd>${(()=>{const sc=bestScout(p.region); return sc&&sc.skill>=3?`<dt>면담 평가</dt><dd>${esc(persText(p))}</dd>`:'';})()}</dl><div class="eyebrow">학년별 기록</div>${amYearTable(p)}${amNotes(p).map(t=>`<p class="small amn">${esc(t)}</p>`).join('')}</section>`:''}
   ${p.prospect||isFM?reportCard(p):''}
   ${hideOvr(p)&&!p.prospect?trackCard(p):''}
   ${!p.prospect&&!isFM?`<dl class="kv"><dt>연봉</dt><dd>${money(p.sal)}</dd><dt>계약</dt><dd>${p.extNext?`다년 합의(${p.extNext.years}년, 다음 시즌부터)`:p.faC?`${p.ext?'비FA 다년':'FA'} 계약 잔여 ${p.yrs}년`:p.foreign?'1년':'단년'}</dd>${p.foreign?'':`<dt>등록 연차</dt><dd>${p.svc}년 (FA 자격 ${faSvc(p)}시즌 · ${p.college?'대졸':'고졸'})</dd><dt>샐러리캡 산정</dt><dd>${isRookie(p)?'신인이라 제외':'포함'}</dd>`}</dl>`:''}
   ${!hasM&&!(p.team!=null&&p.team!==G.user)?actions:''}
   `:''}
   ${T==='abil'?`
   ${mgrOpinion(p)}${trackCard(p)}${detailCard(p)}${reportCard(p,true)}
   ${!p.isP?`<section class="card"><div class="row between"><span class="eyebrow">수비 위치</span>${p.use&&p.use.y===G.year&&p.use.g?`<span class="small muted">${esc(useText(p))}</span>`:''}</div><div class="posfit">${['C','1B','2B','3B','SS','LF','CF','RF'].map(k=>{ const main=p.pos===k, sub=subsOf(p).includes(k); const v=(main||sub)&&!hideOvr(p)?clamp(r5(defAt(p,k)+hn('pf'+k,p.id)*2),20,80):null; return `<div class="${main?'main':sub?'sub':''}"><span>${POSS[k]}</span>${v!=null?rchip(v):`<b class="rc q">${main||sub?'○':'-'}</b>`}<i>${main?'주':sub?'서브':''}</i></div>`; }).join('')}</div><p class="small muted">주 포지션과 서브 포지션만 감독이 무리 없이 맡깁니다. 숫자는 그 자리 수비 평가입니다.</p></section>`:''}
   ${p.team===G.user&&!(p.joinY>G.year)?`<section class="card"><div class="row between"><span class="eyebrow">컨디션</span><span class="small muted">피로 ${Math.round(p.fat||0)} · ${fatText(p)}</span></div>${fatBar(p)}<p class="small">${l10Text(p)||'최근 1군 경기 기록이 없습니다.'}</p><p class="small muted">연속 출장하면 피로가 쌓여 성적이 떨어지고 부상 위험이 커집니다. 감독은 지친 선수를 쉬게 합니다. ${p.isP?'투수는 투구 수만큼 지치고 체력(스태미나)이 좋을수록 빨리 회복합니다.':'포수는 더 빨리 지칩니다. 체력이 좋을수록 덜 지치고 빨리 회복하며, 시즌 후반 성적 하락도 적습니다.'}</p></section>`:''}
   ${growthCard(p)}
   `:''}
   ${T==='rec'?`
   <div><div class="row between" style="margin-bottom:6px"><span class="eyebrow">기록</span><span class="small muted">F는 2군</span></div><div class="tw">${statTable(p)}</div></div>
   ${p.injHist.length?`<p class="small"><b>부상 이력</b> ${p.injHist.map(i=>`${i.y}년 ${i.days}일`).join(' · ')}</p>`:''}
   `:''}
   ${T==='story'?`
   ${st}
   `:''}
   ${T==='mgmt'?`
   <div id="s-bond"></div>${p.team===G.user&&!(p.joinY>G.year)?bondCard(p):''}
   ${actions}
   `:''}
  </div></div>`;
}
function posSheet(pos){
  const d=depth(G.user);
  if(pos==='P'){
    const li=(p,role)=>`<button class="item" data-a="player" data-v="${p.id}"><span class="nm">${role} · ${esc(p.name)} <span class="small muted">${p.age}세</span></span><span class="sub">${esc(scoutReport(p).arch)} · ${statLine(curLine(p),p)}</span><span class="rt num">${money(p.sal)}</span></button>`;
    return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1"><div class="sheet-head"><h2 class="sec">투수진</h2><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
      <section class="card"><div class="eyebrow">선발 로테이션</div><div class="list">${d.sp.map((p,i)=>li(p,(i+1)+'선발')).join('')}</div></section>
      <section class="card"><div class="eyebrow">불펜</div><div class="list">${d.pen.map((p,i)=>li(p,i===0?'마무리':i<4?'필승조':'추격조')).join('')}</div></section></div></div>`;
  }
  const cur=d.ln[pos]; const role=p=>d.start.includes(p)?'주전':d.bench.includes(p)?'1군 백업':d.futB.includes(p)?'2군':'부상';
  const ok=p=>pos==='DH'?true:p.pos===pos||subsOf(p).includes(pos);
  const all=playersOf(G.user).filter(p=>!p.isP);
  const cands=all.filter(ok).sort((a,b)=>(b===cur)-(a===cur)||posScore(b,pos)-posScore(a,pos)).slice(0,pos==='DH'?8:99);
  const others=pos==='DH'?[]:all.filter(p=>!ok(p));
  const card=p=>{ const rp=scoutReport(p); const fitv=pos==='DH'?null:clamp(r5(defAt(p,pos)+hn('pf'+pos,p.id)*2),20,80);
    return pcard(p,{rp,on:cur&&cur.id===p.id,mark:role(p),sub:`${pos==='DH'?posLabel(p):p.pos===pos?'주 포지션':'서브 포지션'} · ${p.age}세 · ${hand(p)}`,
      tags:pos==='DH'?'':`<span class="pill">이 자리 수비 ${fitv}</span>`,stat:`${bLine(p)}`,foot:`<span>${esc(useText(p))}</span><button class="tc-i" data-a="player" data-v="${p.id}">프로필</button>`}); };
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1">
    <div class="sheet-head"><div><div class="eyebrow">포지션 · 감독 결정</div><h2 class="sec">${POSK[pos]}</h2><p class="small muted">${pos==='DH'?'타격이 좋은 순으로 보여 줍니다.':`이 자리를 맡을 수 있는 선수 ${cands.length}명 (주 포지션·서브 포지션)`}</p></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    <div class="tgrid">${cands.map(card).join('')||'<p class="small muted">이 포지션을 맡을 선수가 없습니다. 영입이 필요합니다.</p>'}</div>
    ${cands.length<=1&&pos!=='DH'?'<div class="note bad">이 포지션은 백업이 없습니다. 주전이 다치면 다른 포지션 선수가 무리해서 맡게 됩니다.</div>':''}
    ${others.length?`<details><summary class="small muted" style="cursor:pointer">이 자리를 맡기 어려운 선수 ${others.length}명 보기</summary><div class="list">${others.map(p=>`<button class="item" data-a="player" data-v="${p.id}"><span class="nm">${esc(p.name)} <span class="small muted">${POSS[p.pos]} · ${p.age}세</span></span><span class="sub">${bLine(p)}</span></button>`).join('')}</div></details>`:''}
  </div></div>`;
}
function teamPosSheet(v){
  const [tid,pos]=v.split(':'); const t=+tid; const d=depth(t);
  const arr=pos==='P'?d.sp.concat(d.pen):playersOf(t).filter(p=>!p.isP&&(p.pos===pos||subsOf(p).includes(pos)||d.ln[pos]===p)).sort((a,b)=>posScore(b,pos)-posScore(a,pos));
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1"><div class="sheet-head"><div><div class="eyebrow">${tname(t)}</div><h2 class="sec">${pos==='P'?'투수진':POSK[pos]}</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
    <section class="card"><div class="list">${arr.map(p=>playerRow(p)).join('')}</div></section></div></div>`;
}
function offerForm(p){
  const cur=(UI.offer&&UI.offer.id===p.id)?UI.offer:(G.fa.offers[p.id]||p.ask); const ann=cur.annual, yrs=cur.years;
  const min=round5(p.ask.annual*.6), max=round5(p.ask.annual*1.6); const n=Object.keys(G.fa.ai[p.id]||{}).length;
  const comp=p.faFrom===G.user?'원소속 구단이라 보상 없음':p.faGrade==='A'?`보상: 보호 ${COMP.A.prot}명 외 1명 + ${money(p.faPrevSal*2)}, 또는 선수 없이 ${money(p.faPrevSal*3)} (상대 선택)`:p.faGrade==='B'?`보상: 보호 ${COMP.B.prot}명 외 1명 + ${money(p.faPrevSal)}, 또는 선수 없이 ${money(p.faPrevSal*2)} (상대 선택)`:`보상: 현금 ${money(Math.round(p.faPrevSal*1.5))}만`;
  return `<section class="card"><div class="eyebrow">FA 조건 제시 · 선수 요구 ${p.ask.years}년 연 ${money(p.ask.annual)} · 관심 구단 ${n}곳</div>
    <label class="small" for="offA">연봉 <b class="num" id="offAv">${money(ann)}</b></label>
    <input type="range" id="offA" min="${min}" max="${max}" step="5" value="${ann}" data-a="offA" data-v="${p.id}">
    <div class="seg">${[1,2,3,4,5,6].map(y=>`<button data-a="offY" data-v="${p.id}:${y}" class="${yrs===y?'on':''}">${y}년</button>`).join('')}</div>
    <p class="small sdesc"><span id="offTot">총액 ${money(ann*yrs)}</span> · ${comp}</p>
    ${G.day<G.fa.openDay?'<p class="small muted">11월 6일부터 선수가 제안을 검토합니다.</p>':''}
    <div class="row"><button class="btn primary" data-a="offer" data-v="${p.id}">${G.fa.offers[p.id]?'조건 수정':'제시하기'}</button>${G.fa.offers[p.id]?`<button class="btn danger" data-a="unoffer" data-v="${p.id}">철회</button>`:''}</div></section>`;
}
function extForm(p){
  const e=UI.ext&&UI.ext.id===p.id?UI.ext:{id:p.id,years:4,annual:round5(p.sal*1.3),msg:''};
  UI.ext=e;
  const min=round5(Math.max(MIN_SAL,e.annual*.4)), max=round5(Math.max(e.annual*2.2,500));
  return `<section class="card"><div class="eyebrow">비FA 다년계약 제안 · FA까지 ${Math.max(0,faSvc(p)-p.svc)}년</div>
    <label class="small" for="extA">연봉 <b class="num" id="extAv">${money(e.annual)}</b></label>
    <input type="range" id="extA" min="${min}" max="${max}" step="5" value="${e.annual}" data-a="extA" data-v="${p.id}">
    <div class="seg">${[2,3,4,5,6].map(y=>`<button data-a="extY" data-v="${p.id}:${y}" class="${e.years===y?'on':''}">${y}년</button>`).join('')}</div>
    <p class="small muted"><span id="extTot">총액 ${money(e.annual*e.years)}</span> · 합의하면 다음 시즌부터 적용됩니다. 한 선수와는 일주일에 한 번 협상할 수 있습니다.</p>
    ${e.msg?`<div class="note ${e.ok?'good':''}">${esc(e.msg)}</div>`:''}
    <button class="btn primary" data-a="extOffer" data-v="${p.id}">제안하기</button></section>`;
}

