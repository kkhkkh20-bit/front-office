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
function keyBar(p,rp,isFA,isFM){ if((p.fdPool&&G.fd)||fdHideNow(p))return fdKeyBar(p); const fsx=p.foreign&&p.team==null?fScout(p,rp):null; /* 외국인 후보: 스카우트 평가와 기록을 합친 종합 추정 */ const cur=p.fdPool?null:fsx&&fsx.raw!=null?fsx.raw:rp.cur, pot=p.fdPool?null:rp.ofp; const fg=p.fdPool?fdGrade(p):null; const sal=isFM?p.ask:isFA&&p.ask?p.ask.annual:p.sal;
  const ct=p.prospect?'드래프트 대상':p.fdPool?tContract(p):isFM?`요구 · ${Math.round(p.ask/USD)}만 달러`:isFA?`FA 요구 ${p.ask?p.ask.years+'년':''}`:ctText(p);
  const box=(l,v,c,sub,st)=>`<div class="kb"><span>${l}</span><b style="color:${c}">${v}</b>${st||''}${sub?`<i>${sub}</i>`:''}</div>`;
  return `<div class="kbar">${box(fg?'추정 등급':'현재',fg?fg.g:dv(cur)??'?',fg?fg.c:cur!=null?rcol(cur):'var(--muted)',fg?'스카우트 추정 · 지명 후 공개':rp.exact?'정확':fsx&&cur!=null?`종합 추정 ${fsx.lo}~${fsx.hi} · ${fsx.l}`:'추정',fg||cur==null?'':starsH(dv(cur)))}${box('잠재력',fg?(fg.up?'↑':'-'):pot!=null?potTierP(rp,p).s:'?',pot!=null?['','var(--muted)','var(--muted)','var(--ink)','#5aa9ff','#6fe39a','#ffd166'][potTierP(rp,p).n]:'var(--muted)',pot==null?(p.fdPool?(fg&&fg.up?'성장 여지 있음':'지명 후 공개'):'알 수 없음'):pot-(cur||0)>=8?'성장 여지 큼':pot-(cur||0)>=3?'조금 더 성장':p.age>=33?'하락 시작':p.age>=29?'전성기':'거의 완성','')}${box('연봉',p.prospect?'-':money(sal||0),'#e8ecf3',ct)}</div>${valueLine(p,rp)}`; }
/* 현재 전력·잠재력 예상·구단 기여를 나눠 보여 준다. 우리 젊은 선수는 스카우트와 감독의 시각을 함께 */
/* 타자 포지션 가치: 같은 종합 능력이라도 유격·포수·2루는 귀하고 1루·지명은 흔하다. 구단들이 트레이드·FA·연봉에서 이 값으로 본다 */
function posValLine(p,rp){ if(p.isP||p.prospect||p.fdPool||hideOvr(p)||!p.r)return ''; const b=posBest(p); const d=dv(b.v)-dvo(p);
  return `<div class="pvline small"><span class="muted">포지션 가치</span> <b class="num">${dv(b.v)}</b> <span class="muted">${POSK[b.pos]||b.pos} 기준 · 종합보다 ${d>0?'+':''}${d}</span> <span class="i" title="종합 능력은 수비를 어느 자리든 같게 칩니다. 실제로는 유격·3루·2루·중견 수비가 실점을 훨씬 크게 바꾸고, 포수·유격·2루는 쓸 만한 선수가 드뭅니다. 구단들은 트레이드·FA·연봉에서 이 포지션 가치로 봅니다. 1루·지명타자로는 누구나 옮길 수 있어 가치가 낮습니다.">?</span></div>`; }
function valueLine(p,rp){ if(p.prospect||p.fdPool||p.team==null)return ''; const L=[];
  const hs=p.hist.filter(h=>h.lvl==='1군'&&h.t===p.team&&h.y>=(G.startY||0)); const ys=[...new Set(hs.map(h=>h.y))]; const w=sum(ys.map(y=>{ const h=seasonTotal(p,y,'1군'); return h&&h.t===p.team?wOf(h,p):0; }));
  L.push(`<span><i>구단 기여</i>${ys.length?`${esc(tshort(p.team))} ${ys.length}시즌 · 1군 WAR <b>${w.toFixed(1)}</b>`:`${esc(tshort(p.team))} 첫 시즌`}</span>`);
  if(p.team===G.user&&!p.foreign&&p.age<=25){ if(rp.ofp!=null)L.push(`<span><i>스카우트</i>${esc(potLine(p,rp,{who:false}))}</span>`);
    try{ const d=depth(G.user); const k=pSlot(p); const st=k==='SP'?d.sp[4]:k==='RP'?d.pen[3]:d.ln[k]; const reg=[...d.start,...d.sp,...d.pen.slice(0,4)].some(x=>x.id===p.id);
      const v=reg?'주전으로 씁니다':st&&ovr(st)-ovr(p)>=6?`지금은 ${esc(st.name)}(${dvo(st)}) 뒤입니다. 1군 기용은 어렵다고 봅니다`:st?`${esc(st.name)}(${dvo(st)})와 경쟁할 수 있다고 봅니다`:'기회를 줄 수 있다고 봅니다'; L.push(`<span><i>감독</i>${v}</span>`); }catch(e){} }
  return `<div class="vline">${L.join('')}</div>`; }
function curExBox(p,rp){ let L=null; try{ L=curExplain(p,rp); }catch(e){} return L&&L.length?`<div class="curex"><div class="eyebrow">현재 평가 근거</div><ul>${L.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''; }
/* 외국인 후보: 얼마나 조사했는지, 그래서 추정을 얼마나 믿을 수 있는지 한눈에 */
function fsBox(p,rp){ const f=fScout(p,rp); const st=[0,1,2,3].map(i=>`<i class="${i<=f.n?'on':''}"></i>`).join('');
  return `<div class="fsbox ${f.cls}"><div class="fs-h"><span class="fs-st">${st}</span><b>${f.l}</b>${f.mid!=null?`<span class="fs-r">종합 추정 <b class="num">${f.mid}</b> <span class="muted">(실제는 대체로 ${f.lo}~${f.hi})</span></span>`:''}</div>${f.sc!=null||f.rec!=null?`<p class="small">${f.sc!=null?`스카우트 평가 <b class="num">${f.sc}</b>`:''}${f.sc!=null&&f.rec!=null?' · ':''}${f.rec!=null?`기록으로 본 수준 <b class="num">${f.rec}</b>`:''} <span class="muted">→ 믿을 만한 쪽에 더 무게를 둬 합쳤습니다</span></p>`:''}
    <p class="small">${esc(f.d)}</p><p class="small fs-why">근거: ${esc(f.why.join(' · '))}</p>${f.tip?`<p class="small">${esc(f.tip)}</p>`:''}</div>`; }
function reportCard(p,noTools){
  const rp=scoutReport(p);
  if(hideOvr(p))return `<section class="card"><div class="row between"><h2 class="sec">스카우트 의견</h2><span class="small muted">${fdHideNow(p)?'우리 스카우트 추정':p.foreign&&p.team==null?`조사 단계 · ${fScout(p,rp).l}`:`${esc(rp.who)} · 정확도 ${rp.conf}`}</span></div>${p.foreign&&p.team==null?fsBox(p,rp):''}
    <div class="row">${(()=>{ const fv=ppFond(p,G.user); return fv&&p.team!==G.user?`<span class="pill good" title="단장이 언론을 통해 공개적으로 원한 선수입니다. FA 때 우리 구단을 더 좋게 봅니다">우리 구단에 호감 +${fv}</span>`:''; })()}${p.team!=null&&team(p.team).cap===p.id?'<span class="pill good">주장</span>':''}${p.team!=null&&!p.foreign&&p.region&&team(p.team).region===p.region?`<span class="pill good" title="구단 연고 지역(${esc(p.region)}) 출신. 팬 인기가 더 오르고 FA·재계약 때 이 구단을 조금 더 원합니다">연고 출신</span>`:''}${p.team!=null&&isFranchise(p)?`<span class="pill acc">${esc(tshort(p.team))} 프랜차이즈 스타 · ${teamTenure(p,p.team).n}시즌</span>`:''}${fdHideNow(p)?`<span class="pill">예상 역할 ${esc(fdRole(p,fdEstOf(p)))}</span>`:`<span class="pill acc">${esc(rp.arch)}</span>${p.foreign?(rp.role?`<span class="pill">올해 예상 ${esc(rp.role)}</span>`:''):rp.role?`<span class="pill">장래 ${esc(rp.role)}</span>`:'<span class="pill">잠재력 판단 불가</span>'}<span class="pill ${rp.risk==='높음'?'bad':rp.risk==='낮음'?'good':''}">위험도 ${rp.risk}</span>`}${rp.eta?`<span class="pill">1군까지 약 ${rp.eta}년</span>`:''}</div>
    <div class="quote">${(fdHideNow(p)?[fdScoutLine(p),fdDataLine(p,G.fd.y-1)]:p.prospect&&draftClaim(p)?[draftClaimTxt(draftClaim(p))+'. 스카우트 의견이라 틀릴 수 있습니다.',...rp.notes]:rp.notes).map(n=>`<p>${esc(n)}</p>`).join('')}</div>${p.foreign?curExBox(p,rp):''}
    <p class="small muted">${p.fdPool||fdHideNow(p)?'창단 드래프트 선수는 능력치가 공개되지 않습니다. 지난 시즌 기록과 나이, 스카우트 의견으로 판단하세요. 지명되면(우리든 다른 구단이든) 현재 능력은 바로 공개되고, 잠재력은 추정으로 남습니다.':p.prospect?'아마추어 선수는 능력치를 알 수 없습니다. 학년별 기록과 스카우트 의견으로 판단하세요. 지명하면 우리 코치진이 능력치를 파악합니다.':'위 능력치는 스카우트 추정입니다. 조사 단계가 낮을수록 실제와 차이가 크니 지난 리그 기록과 함께 보세요. 영입하면 코치진이 정확히 파악합니다.'}</p></section>`;
  const bar=t=>{ const w=v=>Math.round((v-20)/60*100); const fut=rp.ofp!=null&&t.fut>t.cur; return `<div class="tool" style="--c:${rcol(t.cur)};--c2:${rcol(t.fut)}"><span>${TOOLK[t.k]}</span>${rchip(t.cur)}<span class="track"><span class="mid"></span>${fut?`<span class="fut" style="width:${w(t.fut)}%"></span>`:''}<span class="now" style="width:${w(t.cur)}%"></span></span>${fut?'<span class="small muted">성장 예상</span>':'<span></span>'}</div>`; };
  return `<section class="card">
    <div class="row between"><h2 class="sec">스카우트 리포트</h2><span class="small muted">${esc(rp.who)} · 정확도 ${rp.conf}</span></div>
    <div class="tiles"><div class="tile"><span class="g" style="color:${rcol(rp.cur)}">${dv(rp.cur)}</span><span class="l">현재 종합</span></div>${p.foreign?(()=>{ const pj=projKBO(p,rp.cur,rp.exact?0:rp.sd); return `<div class="tile key"><span class="g" style="font-size:16px">${pj?pj.mid:'?'}</span><span class="l">올해 예상 ${pj?(pj.k==='era'?'ERA':'OPS'):''}</span></div>`; })():`<div class="tile key"><span class="g" style="font-size:16px">${rp.ofp!=null?potTierP(rp,p).s:'?'}</span><span class="l">잠재력 추정</span></div>`}<div class="tile"><span class="g" style="font-size:16px">${rp.risk}</span><span class="l">위험도</span></div>${rp.eta?`<div class="tile"><span class="g" style="font-size:16px">${rp.eta}년</span><span class="l">1군 도달 예상</span></div>`:''}</div>
    ${rp.role&&!p.fdPool?`<p class="small"><span class="muted">${p.foreign?'올해 예상 역할':'장래 역할'}</span> <b>${esc(rp.role)}</b></p>`:''}${curExBox(p,rp)}
    ${noTools?'':`<div class="tools">${rp.tools.map(bar).join('')}</div>
    <p class="small muted">${p.foreign?'외국인 선수는 올해 기량만 평가합니다. 막대는 현재 수준입니다.':'왼쪽 숫자는 현재, 막대 끝은 스카우트가 보는 미래(추정)입니다.'}</p>`}
    <div class="quote">${rp.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>
  </section>`;
}
function entryForm(p){
  const on=entryOn(); let st;
  if(p.ys)st=`<b>육성선수</b> · 정식 로스터(${ROSTER_MAX}명) 밖에서 2군 경기에 나갑니다.`;
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
    <div class="growth">${pts.map(x=>`<div><i style="height:${Math.max(6,(x.v-20)*1.6)}px;background:${rcol(x.v)}"></i><b>${dv(x.v)}</b><span>${String(x.y).slice(2)}</span></div>`).join('')}</div>
    ${lg?`<p class="small muted">지난 겨울 성장 요인: ${lg.y}시즌 ${pl} · ${esc(lg.fac)}${G.mgr[G.user]?` · ${esc(G.mgr[G.user].name)} 감독 육성 ${G.mgr[G.user].youth}`:''}</p>`:''}</section>`;
}
function renderSheet(){ const el=$('#sheet'); const had=el&&!!el.querySelector('.sheet'); renderSheet0(); try{ autoLink(el); }catch(e){} if(had){ const sh=el.querySelector('.sheet'); if(sh)sh.classList.add('noanim'); } markHints(el); try{ twPager(); }catch(e){} }
function renderSheet0(){
  const el=$('#sheet');
  if(!G){ el.innerHTML=''; return; }
  if(UI.ngt&&!UI.menu){ const sc=el.querySelector('.ng-rows'); const top=sc?sc.scrollTop:0; el.innerHTML=ngtSheet(); const s2=el.querySelector('.sheet.ngt'); if(s2&&UI._ngtY!=null)s2.scrollTop=UI._ngtY; return; }
  if(UI.negWin&&!UI.menu&&G.players[UI.negWin.id]){ const sc=el.querySelector('.sheet.negw'); const y=sc?sc.scrollTop:0; el.innerHTML=negWinSheet(); const s2=el.querySelector('.sheet.negw'); if(s2&&sc)s2.scrollTop=y; return; }
  if(UI.meet&&!UI.menu){ el.innerHTML=meetSheet(); const lg=el.querySelector('#mt-log'); if(lg)lg.scrollTop=lg.scrollHeight; return; }
  if(UI.sheet==null&&UI.game==null&&!UI.posSheet&&cwSheetOn()){ el.innerHTML=cwSheet(); const lg=el.querySelector('#mt-log'); if(lg)lg.scrollTop=lg.scrollHeight; return; } /* 동석 관람 */
  if(UI.cast&&UI.sheet==null&&!UI.menu){ const ex=el.querySelector('.cast'); if(!ex||+ex.dataset.g!==UI.cast.g){ el.innerHTML=castSheet(); castMount(); } return; }
  if(UI.cer&&UI.sheet==null&&!UI.menu){ el.innerHTML=cerSheet(); return; }
  if(UI.ivSh&&UI.sheet==null&&!UI.menu){ el.innerHTML=ivSheet(); return; }
  if(UI.cmpSh&&UI.sheet==null&&!UI.menu){ el.innerHTML=`<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="전력 비교"><div class="sheet-head"><h2 class="sec">전력 비교</h2><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>${cmpView()}</div></div>`; return; }
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
  if(canPick)actions=`<button class="btn primary block" data-a="pick" data-v="${p.id}">${d.picks[d.cur].rd}라운드 ${d.picks[d.cur].no}순위로 지명 · 계약금 약 ${money(bonusOf(d.picks[d.cur].rd,d.picks[d.cur].no,p))}</button>`;
  if(p.fdPool&&G.fd&&!G.fd.done){ const fk=G.fd.picks[G.fd.cur]; actions=`<div class="row" style="gap:6px">${fk&&fk.tid===G.user&&G.fd.open!==false?`<button class="btn primary" style="flex:1" data-a="fdPick" data-v="${p.id}">${fk.rd}라운드 ${fk.no}번째로 지명</button>`:''}<button class="btn" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 해제':'☆ 관심'}</button></div>`; }
  if(isFA)actions=''; /* 협상은 위쪽 '협상 창 열기'에서 */
  if(isFM){ const err=foreignOpen()?foreignCheck(G.user,p):'지금은 외국인 선수를 영입할 수 없습니다.'; const mid=per==='season'; const repl=mid&&(G.sea.repl[G.user]||0)>=F_REPL_MAX;
    actions=''; }
  if(p.team!=null&&p.team!==G.user&&!p.foreign&&!(p.joinY>G.year)){ actions=tradeOpen()?`<button class="btn block" data-a="toTrade" data-v="${p.id}">데려오기 협상</button>`:'<p class="small muted">트레이드 기간이 아닙니다.</p>'; }
  if(isFM)actions+=`<div class="row"><button class="btn" data-a="fwatch" data-v="${p.id}">${fwatchOn(p.id)?'관찰 명단에서 빼기':'대체 후보 관찰 명단에 올리기'}</button>${fwatchOn(p.id)?`<span class="small muted">스카우트 파악도 ${fwatchK(p.id)}% · 능력 오차 약 ±${dvSd(rp.cur,rp.sd)}</span>`:''}</div>${UI.fwMsg?`<p class="small muted">${esc(UI.fwMsg)}</p>`:''}`;
  if(p.team===G.user&&!(p.joinY>G.year)){
    const parts=[];
    parts.push(entryForm(p));
    if(canExtend(p))parts.push('<div id="s-ext"></div>'+`<section class="card"><div class="eyebrow">비FA 다년계약 · ${ctText(p)}</div>${p.extCounter&&p.extCounter.until>=G.day?`<p class="small">역제안이 와 있습니다(${dsh(p.extCounter.until)}까지): ${esc(p.extCounter.terms?termsTxt(p.extCounter.terms,true):`${p.extCounter.years}년 연 ${money(p.extCounter.annual)}`)}</p>`:extNextDay(p)?`<p class="small bad">지난 제안(${dsh((p.extLast||{}).d??G.day)})은 거절됐습니다. 다음 제안은 ${dsh(extNextDay(p))}부터 할 수 있습니다.</p>`:''}${ngtDoor('ext',p)}<p class="small muted">시즌 중 합의는 다음 시즌부터, 시즌이 끝난 뒤~개막 전 합의는 다가오는 시즌부터 적용됩니다. 한 선수와는 일주일에 한 번 협상할 수 있습니다.</p></section>`);
    else if(UI.ext&&UI.ext.id===p.id&&UI.ext.msg)parts.push(`<div class="note ${UI.ext.ok?'good':''}">${esc(UI.ext.msg)}</div>`);
    parts.push(`<div class="row" style="margin-top:14px;justify-content:flex-end">${UI.confirmRel===p.id?`<button class="btn danger" data-a="release" data-v="${p.id}">정말 방출${p.faC?` (정산 ${money(Math.round(p.sal*p.yrs*.5))})`:''}</button><button class="btn" data-a="relCancel">취소</button>`:`<button class="btn danger" data-a="relAsk" data-v="${p.id}">방출</button>`}</div>`);
    actions=parts.join('');
  }
  const status=p.injOut>0?`<span class="pill bad">${esc(injNow(p))} · 복귀까지 약 ${p.injOut>=300?Math.round(p.injOut/30)+'개월':p.injOut+'일'} (${injRetTxt(p)})</span>`:'';
  const injFx=injFxText(p); const injBox=injFx.length?`<div class="injfx"><b>${p.injOut>0?'부상 · 재활 중':'부상 후유증'}</b>${injFx.map(x=>`<div class="small">${x.y}년 ${esc(x.n)}: ${esc(x.t)}</div>`).join('')}<div class="small muted">회복 중인 능력은 1군·2군 실전을 뛰면서 되찾습니다. 1년 이상 걸린 부상과 수술은 일부가 돌아오지 않을 수 있습니다.</div></div>`:'';
  const meas=p.isP?`직구 평균 ${veloOf(p)}km/h · 최고 ${veloMax(p)}km/h`:`타구속도 평균 ${evOf(p)}km/h · 홈→1루 ${runOf(p)}초`;
  const tiles=h?(p.isP?[['ERA',h.outs?pRate(h).era.toFixed(2):'-',1],['WAR',wOf(h,p).toFixed(1),1],['이닝',ipStr(h.outs)],['탈삼진',h.so],[h.sv?'세이브':h.hld?'홀드':'승',h.sv||h.hld||h.w]]
    :[['OPS',h.pa?fmt3(bRate(h).ops):'-',1],['WAR',wOf(h,p).toFixed(1),1],['타율',fmt3(bRate(h).avg)],['홈런',h.hr],['타점',h.rbi]]):null;
  const where=p.prospect?`드래프트 대상 · ${p.region}`:p.fdPool?`창단 드래프트 후보${p.fdFrom!=null?` · 전 ${tshort(p.fdFrom)}`:''}`:p.foreign&&p.team==null?`외국인 영입 후보 · ${p.nat}`:p.joinY>G.year?`${tname(p.team)} 입단 예정`:tname(p.team??p.faFrom);
  const pt=p.team!=null?team(p.team):null; const pst=pt?`--pt:${tpal(pt)[2]};--pt2:${tpal(pt)[3]}`:'';
  const ownP=p.team===G.user&&!(p.joinY>G.year); const st=careerStory(p);
  const hasM=ownP;
  const tabs=[...(p.prospect||p.fdPool||isFM?[]:[['abil','능력']]),...(hasM?[['dev','육성']]:[]),['sum','요약'],['rec','기록'],...(st?[['story','이야기']]:[]),...(hasM?[['mgmt','관리']]:[])]; /* 능력(정보) 다음에 육성(보직·훈련·전환·연수) */
  let T=UI.ptab||'abil'; if(!tabs.some(t=>t[0]===T))T='sum';
  const tabBar=`<div class="seg ptabs">${tabs.map(([k,l])=>`<button data-a="ptab" data-v="${k}" class="${T===k?'on':''}">${l}</button>`).join('')}</div>`;
  el.innerHTML=`<div class="scrim" data-a="closeSheet"><div class="sheet gut" style="${pst}" role="dialog" aria-label="${esc(p.name)} 선수 정보" data-stop="1">
   <div class="sheet-head"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${avImg(p,true)}<div><div class="eyebrow">${where}${isFA?' · FA':''}${p.foreign&&p.team!=null?` · ${p.foreign==='아시아'?'아시아쿼터':'외국인'} · ${p.nat}`:''}</div>
    <h2 class="sec" style="font-size:24px">${esc(p.name)}${condChip(p)}</h2>${p.aw&&p.aw.length?`<div class="row" style="gap:4px;margin:2px 0">${p.aw.slice(-6).map(a=>`<span class="awp">${awArt(a,18)}${esc(a)}</span>`).join('')}</div>`:''}
    <p class="pinfo keep"><b class="pinfo-pos">${posLabel(p)}</b>${!p.isP&&typeof subsOf==='function'&&subsOf(p).length?`<span class="pinfo-sub">(${subsOf(p).map(k=>POSK[k]||k).join('·')} 가능)</span>`:''} · <b>${p.age}세</b> · ${hand(p)}${p.foreign?'':` · ${p.college?'대졸':'고졸'} · ${esc(milText(p))}`}${p.draft?` · ${p.draft.y} ${p.draft.rd}R ${p.draft.no}순위`:''}${p.dev?' · 육성선수 출신':''}</p></div></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
   ${keyBar(p,rp,isFA,isFM)}${posValLine(p,rp)}
   <div class="row">${p.fdPool||fdHideNow(p)?'':`<span class="pill acc">${esc(rp.arch)}</span>`}${rp.role&&!p.fdPool&&!fdHideNow(p)?`<span class="pill">${p.foreign?'올해 예상':'장래'} ${esc(rp.role)}</span>`:''}${status}</div>
   ${quickActs(p)}
   ${isFA?negDoor('fa',p):isFM?negDoor('fm',p):p.team===G.user&&p.foreign&&G.contract&&!G.contract.done&&G.contract.foreignEnd.includes(p.id)&&!G.contract.foreignDrop.includes(p.id)?negDoor('fre',p):''}
   ${tabBar}
   ${T==='sum'?`
   ${staffCardP(p)}
   ${p.team===G.user&&!(p.joinY>G.year)?`<section class="card"><div class="row between"><span class="eyebrow">컨디션</span><span class="small muted">피로 ${Math.round(p.fat||0)} · ${fatText(p)}</span></div>${fatBar(p)}<p class="small">${l10Text(p)||'최근 1군 경기 기록이 없습니다.'}${p.isP?`</p><p class="small">투구 부하: ${esc(loadText(p))}`:''}</p><p class="small muted">연속 출장하면 피로가 쌓여 성적이 떨어지고 부상 위험이 커집니다. 감독은 지친 선수를 쉬게 합니다. ${p.isP?'투수는 투구 수만큼 지치고 체력(스태미나)이 좋을수록 빨리 회복합니다.':'포수는 더 빨리 지칩니다. 체력이 좋을수록 덜 지치고 빨리 회복하며, 시즌 후반 성적 하락도 적습니다.'}</p></section>`:''}
   ${tiles?`<div><div class="eyebrow" style="margin-bottom:6px">${h.y} ${h.lvl==='퓨처스'?'2군':'1군'} 성적</div><div class="tiles">${tiles.map(t=>`<div class="tile${t[2]?' key':''}" data-a="recGo" data-v="${p.isP?'pit':'bat'}:${({OPS:'ops',WAR:'war',타율:'avg',홈런:'hr',타점:'rbi',ERA:'era',이닝:'ip',탈삼진:'so',세이브:'sv',홀드:'hld',승:'w'})[t[0]]||'war'}" role="button" title="리그 순위 보기"><span class="g">${t[1]}</span><span class="l">${t[0]}</span></div>`).join('')}</div></div>`:''}
   ${h&&h.lvl==='퓨처스'?'':fut2Card(p)}
   ${!p.prospect&&h?recent3(p,h.y):''}
   ${p.prospect?`<section class="card"><div class="row between"><span class="eyebrow">아마추어 프로필</span><button class="btn small${(G.shortlist||[]).includes(p.id)?' primary':''}" data-a="star" data-v="${p.id}">${(G.shortlist||[]).includes(p.id)?'★ 관심 선수':'☆ 관심 표시'}</button></div><dl class="kv"><dt>학교</dt><dd>${esc(p.school||'-')} (${p.college?'대학 4년':'고교 3년'})</dd><dt>체격</dt><dd>${p.ht||'-'}cm · ${p.wt||'-'}kg</dd><dt>${p.isP?'최고 구속':'1루 도달'}</dt><dd>${p.isP?(p.amVelo||veloOf(p))+'km/h':(p.amRun||runOf(p))+'초'}</dd><dt>언론 순위</dt><dd>${p.press||'-'}위</dd><dt>의료 기록</dt><dd>${p.amInj?esc(p.amInj):'특이 사항 없음'}</dd>${(()=>{const sc=bestScout(p.region); return sc&&sc.skill>=3?`<dt>면담 평가</dt><dd>${esc(persText(p))}</dd>`:'';})()}</dl><div class="eyebrow">학년별 기록</div>${amYearTable(p)}${amNotes(p).map(t=>`<p class="small amn">${esc(t)}</p>`).join('')}</section>`:''}
   ${p.prospect||isFM?reportCard(p):''}
   ${hideOvr(p)&&!p.prospect?trackCard(p):''}
   ${!p.prospect&&!isFM?`<dl class="kv"><dt>연봉</dt><dd>${money(p.sal)}</dd><dt>계약</dt><dd>${p.extNext?`다년 합의(${p.extNext.years}년, 다음 시즌부터)`:p.faC?`${ctText(p)} · ${ctSeason()+Math.max(1,p.yrs)-1}시즌까지`:p.foreign?'1년':`단년 · ${ctText(p)}`}</dd>${ctMoneyKv(p)}${p.foreign?'':`<dt>등록 연차</dt><dd>${p.svc}년 (FA 자격 ${faSvc(p)}시즌 · ${p.college?'대졸':'고졸'})</dd><dt>샐러리캡 산정</dt><dd>${isRookie(p)?'신인이라 제외':'포함'}</dd>`}</dl>`:''}
   ${!hasM&&!(p.team!=null&&p.team!==G.user)?actions:''}
   `:''}
   ${T==='abil'?`
   ${injBox}${mgrOpinion(p)}${detailCard(p)}${trackCard(p)}${reportCard(p,true)}
   ${!p.isP?posCard(p,true):''}
   ${hasM?'':growthCard(p)}
   `:''}
   ${T==='dev'?devTab(p):''}
   ${T==='rec'?`
   <div><div class="row between" style="margin-bottom:6px"><span class="eyebrow">기록</span><span class="small muted">F는 2군</span></div><div class="tw">${statTable(p)}</div></div>
   ${p.injHist.length?`<p class="small"><b>부상 이력</b> ${p.injHist.map(i=>`${i.y}년 ${i.k?esc(injName(i.k))+' ':''}${i.days}일`).join(' · ')}</p>`:''}
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
  /* 슬라이더 범위는 에이전트 요구 수준을 기준으로 잡는다(요구액까지 올릴 수 있게) */
  const dem=y=>round5(extDemand(p,y)*agExtMul(p)); const e=UI.ext&&UI.ext.id===p.id?UI.ext:{id:p.id,years:4,annual:round5(Math.max(p.sal,dem(4)*.92)),msg:''};
  UI.ext=e; const d=dem(e.years);
  const min=round5(Math.max(MIN_SAL,Math.min(p.sal,d*.5))), max=round5(Math.max(d*1.6,p.sal*1.5,min+100));
  const agk=hasAgent(p)?agRel(agentOf(p)):50; const est=round5(d*(1+(agk>=60?0:agk>=40?.03:.06)+hn('xe'+G.year,p.id)*.02));
  const ag=hasAgent(p)?agentOf(p):null;
  return `<section class="card"><div class="eyebrow">비FA 다년계약 제안 · ${ctText(p)}</div>
    ${ag?`<div class="tgm" style="margin:6px 0">${agAv(ag)}<div><b>${esc(ag.name)} 에이전트 · ${esc(ag.firm)}</b><span class="agl">${agLine(ag)}</span><span class="small muted">${esc((AG_STYLE[ag.style]||AG_STYLE.rel).d)}${agExtTestMarket(p)?' FA를 1년 앞둔 대어라 시장 평가를 받아 보려 합니다.':''}</span></div></div>`:'<p class="small muted">에이전트 없이 선수 본인과 협상합니다.</p>'}
    <label class="small" for="extA">연봉 <b class="num" id="extAv">${money(e.annual)}</b></label>
    <input type="range" id="extA" min="${min}" max="${max}" step="5" value="${e.annual}" data-a="extA" data-v="${p.id}">
    <div class="seg">${[2,3,4,5,6].map(y=>`<button data-a="extY" data-v="${p.id}:${y}" class="${e.years===y?'on':''}">${y}년</button>`).join('')}</div>
    <p class="small muted"><span id="extTot">총액 ${money(e.annual*e.years)}</span> · ${e.years}년 기준 예상 요구 연 <b>${money(est)}</b> 안팎(친분이 높을수록 정확) · 시즌 중 합의는 다음 시즌부터, 시즌이 끝난 뒤~개막 전 합의는 다가오는 시즌부터 적용됩니다. 한 선수와는 일주일에 한 번 협상할 수 있습니다.</p>
    ${e.msg?`<div class="note ${e.ok?'good':''}">${esc(e.msg)}</div>`:''}
    ${p.extCounter&&p.extCounter.until>=G.day?`<button class="btn primary" data-a="extAcc" data-v="${p.id}">역제안 수락 (${p.extCounter.years}년 연 ${money(p.extCounter.annual)})</button> `:''}<button class="btn ${p.extCounter&&p.extCounter.until>=G.day?'':'primary'}" data-a="extOffer" data-v="${p.id}">제안하기</button></section>`;
}


/* FA 영입 설득 카드: 근거 2개까지, 약속(선택), 승인 가능성 */
function pitchCard(p){ if(G.unemp||team(G.user).indie)return ''; const I=pitchInfo(p.id); if(!I)return ''; const st=UI.pitch&&UI.pitch.id===p.id?UI.pitch:(UI.pitch={id:p.id,args:[],cmts:[]});
  const B=bossOf(G.user); const t=team(G.user); const od=pitchOdds(p.id,st.args,st.cmts);
  const lv=v=>v>=.7?'강함':v>=.4?'보통':v>0?'약함':'해당 없음';
  const argB=Object.entries(PITCH_ARG).map(([k,a])=>`<button class="pa${st.args.includes(k)?' on':''}" data-a="pitchArg" data-v="${k}" ${I.S[k]<=0?'disabled':''}><b>${a.l}</b><span>${a.d}</span><em>근거 ${lv(I.S[k])} · 회장 관심 ${I.w[k]>=.9?'높음':I.w[k]>=.5?'보통':'낮음'}</em></button>`).join('');
  const cmtB=Object.entries(PITCH_CMT).map(([k,c])=>`<label class="chk"><input type="checkbox" data-a="pitchCmt" data-v="${k}" ${st.cmts.includes(k)?'checked':''}> ${c.l}</label>`).join('');
  const blocked=!I.capOK?`샐러리캡을 넘습니다(남은 캡 ${money(I.capRoom)}).`:I.done?'올해 이미 보고했습니다.':!ownAskLeft()?'이번 달에는 이미 구단주에게 요청했습니다.':'';
  return `<section class="card pitch"><div class="row between"><h3 class="sec">구단주 설득: 영입 자금 요청</h3><span class="small muted">${esc(B.own.name)} 회장 · ${OWNER[t.owner].label} · 신뢰 ${t.trust}</span></div>
    <p class="small">요구 연봉 <b>${money(I.amt)}</b> · 지금 예산 여유 ${money(I.room)}${I.need>0?` · <b class="bad">${money(I.need)} 부족</b>`:' · 예산 안에서 가능'} · 남은 캡 ${money(I.capRoom)}</p>
    <p class="small muted">${I.slot} 리그 ${I.rank}위 자리${I.gap>0?`, 지금 주전보다 능력 +${Math.round(I.gap)}`:''}. 근거를 2개까지 고르세요. 근거의 힘은 실제 기록·나이·순위로 정해지고, 회장 성향에 맞는 근거가 잘 먹힙니다.</p>
    <div class="pag">${argB}</div>
    <div class="eyebrow" style="margin-top:6px">약속(선택) · 다음 시즌 구단주 목표에 들어갑니다</div><div class="row" style="gap:10px;flex-wrap:wrap">${cmtB}</div>
    <div class="row between" style="margin-top:8px"><span class="small">승인 가능성 <b>${Math.round(od*100)}%</b> · ${oddsTxt(od)}</span><button class="btn primary small" data-a="pitchGo" data-v="${p.id}" ${blocked||!st.args.length?'disabled':''}>회장에게 보고</button></div>
    ${blocked?`<p class="small bad">${blocked}</p>`:''}${UI.pitchMsg&&UI.pitchMsg.id===p.id?`<div class="note">${esc(UI.pitchMsg.t)}</div>`:''}</section>`; }

/* 최근 3년 한눈에: 한 해 기록의 운(컨디션·타구 운)을 걸러 보게 한다 */
function recent3(p,y){ const R=recentLines(p,y,3); if(R.length<2)return '';
  const row=x=>{ const h=x.h; if(p.isP){ const ip=h.outs/3, era=h.er*9/ip, fip=(13*(h.hr||0)+3*h.bb-2*h.so)/ip+3.2; const d=era-fip; return `<tr><td>${x.y}</td><td>${x.lvl===1?'1군':'2군'}</td><td class="num">${era.toFixed(2)}</td><td class="num">${fip.toFixed(2)}</td><td class="num ${d<=-.6?'lk':d>=.6?'ul':''}">${d>0?'+':''}${d.toFixed(2)}</td><td class="num">${ipStr(h.outs)}</td></tr>`; }
    const r=bRate(h), bp=(h.h-h.hr)/Math.max(1,h.ab-h.so-h.hr); return `<tr><td>${x.y}</td><td>${x.lvl===1?'1군':'2군'}</td><td class="num">${fmt3(r.ops)}</td><td class="num">${fmt3(r.avg)}</td><td class="num">${h.hr}</td><td class="num ${bp>=.34?'lk':bp<=.27?'ul':''}">${fmt3(bp)}</td><td class="num">${h.pa}</td></tr>`; };
  return `<div class="r3"><div class="eyebrow">최근 ${R.length}년</div><table class="r3t"><thead><tr><th>시즌</th><th></th>${p.isP?'<th>ERA</th><th>FIP</th><th>ERA−FIP</th><th>이닝</th>':'<th>OPS</th><th>타율</th><th>홈런</th><th>BABIP</th><th>타석</th>'}</tr></thead><tbody>${R.map(row).join('')}</tbody></table>
    <p class="small muted">${p.isP?'ERA−FIP가 크게 음수면 운이 좋았던 해, 양수면 불운했던 해입니다.':'BABIP(인플레이 타구 안타 비율)가 .340을 넘으면 운이 좋았던 해, .270 아래면 불운했던 해일 수 있습니다.'} 한 해만 튀면 거품, 해마다 비슷하면 실력입니다.</p></div>`; }

/* 창단 드래프트 후보: 종합 등급 대신 스카우트(툴)·데이터팀(기록) 의견을 나란히 */
function fdKeyBar(p){ const S=fdScoutTools(p); const d=fdData(p);
  const box=(l,v,sub)=>`<div class="kb"><span>${l}</span><b>${v}</b>${sub?`<i>${sub}</i>`:''}</div>`;
  return `<div class="kbar fdk">${box('스카우트 · 툴',esc(fdScoutLine(p)),`${S.ht}cm · ${S.wt}kg`)}${box('데이터팀 · 기록',esc(fdDataLine(p,G.fd.y-1)),'최근 3년 실제 기록 기준')}${box('연봉',money(p.sal||0),tContract(p))}</div>
    <div class="fdop">${S.L.map(t=>`<span class="fdtg" style="--c:${rcol(t.v)}">${t.l} <b>${t.g}</b></span>`).join('')}</div>`; }
