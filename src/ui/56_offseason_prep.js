/* ---------- 다음 시즌 준비표: 포스트시즌이 끝난 뒤부터 개막 전까지 홈에 한 장으로 ----------
   스폰서 만료·코치 빈자리·외국인 재계약·신인 합류 후 로스터·내년 보장 지출과 예산 여유를 한 줄씩 보이고, 각 줄에서 해당 화면으로 간다 */
function offPrepOn(){ if(!G||G.unemp||G.demoEnd||G.gameOver||(G.fd&&!G.fd.done)||!G.cal)return false; const per=period(); return per==='off'||(per==='pre'&&!!G.last); }
/* 다음 스폰서 제안일(비시즌 정기 제안) */
function opzSponNext(){ const per=period(); const y=G.year; const L=per==='off'?[KD(11,10),KD(12,1),dnum(y+1,1,10),dnum(y+1,2,1),dnum(y+1,3,1)]:[KD(1,10),KD(2,1),KD(3,1)]; return L.find(d=>d>G.day)??null; }
function opzSpon(){ const S=sponInit(); const t=team(G.user); const y=sponSeason();
  const ks=Object.keys(SPON_SLOT).filter(k=>!(SPON_SLOT[k].indie&&!t.indie));
  const open=ks.filter(k=>sponOpen(k)); const prev=Math.round(sum(Object.values(S.c).filter(c=>c.y0<=y-1&&c.until>=y-1).map(c=>c.amt)));
  const lost=Math.round(sum(open.map(k=>S.c[k]&&S.c[k].until===y-1?S.c[k].amt:0))); const inc=sponIncome(y); const off=(S.off||[]).filter(x=>x.exp>=G.day).length; const nx=opzSponNext();
  const d=[`${y}시즌 확정 ${money(inc)}`,prev?`지난 시즌 ${money(prev)}`:'',open.length?`빈자리 ${open.length}곳${lost?`(만료로 연 ${money(lost)} 빠짐)`:''}`:'모든 자리 계약',off?`받은 제안 ${off}건`:open.length&&nx?`다음 제안 ${dmd(nx)}`:''].filter(Boolean);
  return {k:'spon',l:'스폰서',st:open.length?(off?'act':'warn'):'ok',d:d.join(' · '),sub:open.length?open.map(k=>SPON_SLOT[k].l).join(', '):'',b:[['go','club:spon','스폰서']]}; }
function opzCoach(){ const C=coachesOf(G.user); const pre11=period()==='off'&&G.day<KD(11,1);
  const vac=CKEYS.filter(k=>!C[k]); const exp=pre11?CKEYS.filter(k=>C[k]&&C[k].yrs<=1):[];
  const med=k=>{ const L=(G.cmarket||[]).filter(c=>c.role===k).map(c=>c.sal).sort((a,b)=>a-b); return L.length?L[Math.floor(L.length/2)]:150; };
  const cost=Math.round(sum(vac.concat(exp).map(med)));
  const m=G.mgr[G.user]; const mgrIss=!m?'감독 공석':m.interim?'감독대행 체제(개막 전 선임 필요)':m.yrs<=0?'감독 계약이 올해로 끝남':'';
  const R=[];
  if(mgrIss)R.push({k:'mgr',l:'감독',st:'warn',d:mgrIss,b:[['goWork','감독','감독 후보']]});
  const d=vac.length||exp.length?[vac.length?`빈자리 ${vac.length}곳`:'',exp.length?`11월 1일 계약 만료 ${exp.length}명`:'',`채용 예상 연 ${money(cost)}(시장 중간값)`].filter(Boolean).join(' · '):`${CKEYS.length}자리 모두 계약 · 연봉 합계 ${money(coachSal(G.user))}`;
  R.push({k:'coach',l:'코치진',st:vac.length?'warn':exp.length?'act':'ok',d,sub:vac.concat(exp).map(k=>CROLE[k].l).join(', '),b:[['go','staff:coach','코치진']]});
  return R; }
function opzForeign(){ const fs=foreignOf(G.user); const C=G.contract; const per=period();
  if(per==='off'&&G.day<KD(12,1)){ const now=sum(fs.map(p=>p.sal)), ask=sum(fs.map(p=>{ try{ return newSalary(p); }catch(e){ return p.sal; } }));
    return {k:'for',l:'외국인 선수',st:fs.length?'act':'warn',d:fs.length?`${fs.length}명 계약 종료 · 12월 1일 재계약안 · 예상 요구 합계 ${money(ask)}(현재 ${money(now)})`:'외국인 선수 없음 · 새로 영입해야 합니다',sub:fs.map(p=>`${p.name} ${money(p.sal)}→${money((()=>{ try{ return newSalary(p); }catch(e){ return p.sal; } })())}`).join(', '),b:[['go','transfer:foreign','외국인']]}; }
  if(C&&!C.done&&(C.foreignEnd||[]).length){ const E=C.foreignEnd.map(id=>G.players[id]).filter(Boolean); const drop=E.filter(p=>C.foreignDrop.includes(p.id)); const keep=E.filter(p=>!C.foreignDrop.includes(p.id)); const f=fReCapInfo();
    return {k:'for',l:'외국인 재계약',st:f&&f.over>0?'warn':'act',d:`재계약 예정 ${keep.length}명(요구 합계 ${money(sum(keep.map(p=>p.newSal||p.sal)))})${drop.length?` · 결별 ${drop.length}명(대체 영입 필요)`:''}${f&&f.over>0?` · 3명 총액 한도 ${money(f.over)} 초과`:''}`,sub:keep.map(p=>p.name).join(', '),b:[['go','transfer:contract','재계약 결정'],['go','transfer:foreign','대체 후보']]}; }
  const nd=fNeed(G.user); const yb=fs.filter(p=>p.foreign==='용병').length, as=fs.filter(p=>p.foreign==='아시아').length;
  return {k:'for',l:'외국인 선수',st:nd?'warn':'ok',d:`용병 ${yb}/3 · 아시아쿼터 ${as}/1${nd?` · 빈자리: ${nd.kind==='아시아'?'아시아쿼터':nd.isP===true?'용병 투수':nd.isP===false?'용병 타자':'용병'}`:' · 구성 완료'} · 연봉 합계 ${money(sum(fs.map(p=>p.sal)))}`,b:[['go','transfer:foreign','외국인']]}; }
function opzRoster(){ const n=rosterN(G.user); const rk=Object.values(G.players).filter(p=>p.team===G.user&&p.joinY>G.year&&!p.ys).length; const tot=n+rk; const over=tot-ROSTER_MAX;
  return {k:'ros',l:'로스터 인원',st:over>0?'warn':'ok',d:`${rk?`현재 ${n}명 + 신인 ${rk}명 합류 = ${tot}명`:`현재 ${n}명`} / 한도 ${ROSTER_MAX}명${over>0?` · 개막 전까지 ${over}명 정리 필요`:` · 여유 ${-over}명`}`,b:[['tab','roster','선수단'],['go','roster:plan','선수단 계획']]}; }
function opzMoney(){ let b; try{ b=budget(); }catch(e){ return null; } const C=G.contract; const ds=domestic(G.user); const sy=ctSeason();
  const multi=ds.filter(p=>p.extNext||(p.faC&&(p.yrs||0)>=1)); const mSal=sum(multi.map(p=>p.extNext?p.extNext.annual:p.sal));
  const pend=C&&!C.done?(C.ended||[]).map(id=>G.players[id]).filter(p=>p&&p.team===G.user&&p.newSal!=null):[]; const dR=sum(pend.map(p=>p.newSal-p.sal));
  const faB=(G.spend&&G.spend.faB)||0; const fRow=b.exp.find(x=>x[2]==='for'); const fA=fRow?fRow[1]:0; const fL=fRow&&/배정/.test(fRow[0])?'외국인 배정 예산':'외국인';
  const d=[`국내 연봉 ${money(b.ci.all)}(다년·FA 계약 ${multi.length}명 ${money(mSal)})`,faB?`계약금 지급 ${money(faB)}`:'',`${fL} ${money(fA)}`,pend.length?`연봉 협상 미확정 ${pend.length}명(산정안 기준 ${dR>=0?'+':''}${money(dR)})`:''].filter(Boolean).join(' · ');
  const room=b.roomGoal;
  return {k:'fin',l:`${sy}시즌 지출`,st:room<0||(pend.length&&room-dR<0)?'warn':pend.length?'act':'ok',d,sub:`예산 여유 ${money(room)}${room<0?'(구단주 목표 초과)':''}${pend.length&&dR?` → 연봉 확정 후 약 ${money(room-dR)}${room-dR<0?'(목표 초과)':''}`:''} · 지출 합계 ${money(b.E)} · 예상 수입 ${money(b.I)}`,b:[['go','club:fin','재정'],...(pend.length?[['go','transfer:contract','연봉 협상']]:[])]}; }
function offPrepRows(){ const R=[]; const f=(fn)=>{ try{ const x=fn(); if(Array.isArray(x))R.push(...x.filter(Boolean)); else if(x)R.push(x); }catch(e){} };
  f(opzSpon); f(opzCoach); f(opzForeign); f(opzRoster); f(opzMoney); return R; }
const OPZ_ST={ok:['good','정리됨'],act:['acc','진행 중'],warn:['warn','확인 필요']};
function offPrepCard(){ if(!offPrepOn())return ''; const R=offPrepRows(); if(!R.length)return ''; const per=period(); const y=per==='off'?G.year+1:G.year;
  const n=R.filter(r=>r.st==='warn').length; const dd=per==='pre'&&G.cal.open>G.day?` · 개막 ${dmd(G.cal.open)} (D-${G.cal.open-G.day})`:'';
  return `<section class="card opz"><div class="row between opz-h"><h2 class="sec">다음 시즌 준비표</h2><span class="small muted">${y}시즌${dd}${n?` · 확인 필요 ${n}건`:' · 모두 정리됨'}</span></div>
    <div class="opz-l">${R.map(r=>{ const [c,t]=OPZ_ST[r.st]||OPZ_ST.ok; return `<div class="opz-r ${r.st}"><div class="opz-m"><div class="opz-t"><b>${esc(r.l)}</b><span class="pill ${c}">${t}</span></div><div class="opz-d">${esc(r.d)}</div>${r.sub?`<div class="opz-s small muted">${esc(r.sub)}</div>`:''}</div><div class="opz-b">${r.b.map(([a,v,l],i)=>`<button class="btn small${i===0&&r.st!=='ok'?' primary':''}" data-a="${a}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div></div>`; }).join('')}</div>
    <p class="small muted opz-f">스폰서 계약이 끝나면 다음 시즌 기본 수입이 그만큼 줄어듭니다. 재계약·신규 계약은 스폰서 화면에서 받습니다.</p></section>`; }

/* 선수 시트 계약 금액: 그 시즌 현금 지출 · 보장 총액 · 연평균(상한 반영)을 한 줄씩 */
function ctMoneyKv(p){ const m=ctMoney(p); if(!m)return ''; return `<dt>${m.sy}시즌 현금 지출</dt><dd class="ctm-dd">${money(m.cash)}${m.bNow?`<i>계약금 ${money(m.bNow)} 포함</i>`:''}</dd><dt>보장 총액</dt><dd class="ctm-dd">${money(m.tot)}<i>${m.yrs}년${m.bTot?` · 계약금 ${money(m.bTot)}`:''}</i></dd><dt>연평균(상한 반영)</dt><dd class="ctm-dd">${money(m.avg)}</dd>${m.opt?`<dt>옵션</dt><dd class="ctm-dd">최대 연 ${money(m.opt)}</dd>`:''}`; }
/* ---------- 외국인 재계약 "15% 깎아 협상" 위험 표시: 엔진 fReNegChance와 같은 식 ---------- */
function fNegRiskH(p){ const C=G.contract; if(!C||C.done)return ''; if((C.fneg||{})[p.id])return `<span class="opz-risk small muted">이미 한 번 협상했습니다 · 다시 협상할 수 없습니다</span>`;
  let r; try{ r=fReNegChance(p); }catch(e){ return ''; } const b=1-r.ch; const lv=b>=.55?['높음','bad']:b>=.35?['보통','warn']:['낮음','good'];
  return `<span class="opz-risk small"><span class="${lv[1]}">결렬 가능성 ${lv[0]}(약 ${Math.round(b*100)}%)</span> · 결렬되면 다시 협상할 수 없고 선수는 떠납니다${r.star?' · 지난 시즌 WAR 3 이상이라 잘 받아들이지 않습니다':''}</span>`; }

/* ---------- 시즌 회고 메일: 선수별 후속 조치(유지 · 재계약 검토 · 대체 후보 찾기) ---------- */
function rvExt(p,y){ if(canExtend(p))return {a:'ngtOpen',v:'ext:'+p.id};
  if(p.foreign){ const C=G.contract; if(C&&!C.done&&(C.foreignEnd||[]).includes(p.id))return {a:'go',v:'transfer:contract'}; if(C&&C.done&&C.y!=null&&C.y>=y)return {why:'이번 겨울 외국인 재계약을 이미 마쳤습니다'}; return {why:'외국인 선수는 12월 1일 재계약안이 올라온 뒤 계약 화면에서 정합니다'}; }
  if(p.extNext)return {why:'이미 다년계약에 합의했습니다'}; if(p.faC&&p.yrs>1)return {why:`계약이 ${p.yrs}시즌 남아 있어 아직 재계약을 논의할 수 없습니다`};
  if(p.age>34)return {why:'34세가 넘어 다년계약을 제안할 수 없습니다'}; return {why:'지금은 다년계약을 제안할 수 없습니다'}; }
function rvActsH(m){ const R=m.rv; const L=(R.L||[]).map(x=>({...x,p:G.players[x.id]})).filter(x=>x.p&&x.p.team===G.user); if(!L.length)return ''; const K=G.rvKeep||{};
  return `<div class="rva"><div class="eyebrow">선수별 후속 조치</div>${L.map(x=>{ const p=x.p; const e=rvExt(p,R.y); const kept=K[p.id]===R.y; const slot=pSlot(p);
    return `<div class="rva-r"><button class="rva-n lnk" data-a="player" data-v="${p.id}"><b>${esc(p.name)}</b><span class="small muted">${esc(posLabel(p))} · ${esc(x.k)} · WAR ${(+x.w).toFixed(1)} · ${esc(p.foreign?'1년 계약':ctText(p))}</span></button>
      <div class="rva-b"><button class="btn small${kept?' primary':''}" data-a="rvKeep" data-v="${p.id}:${R.y}" aria-pressed="${kept}">${kept?'유지 확정':'유지'}</button>${e.a?`<button class="btn small" data-a="${e.a}" data-v="${e.v}">재계약 검토</button>`:`<button class="btn small" disabled title="${esc(e.why)}">재계약 검토</button>`}<button class="btn small" data-a="rvFind" data-v="${p.id}" title="${p.foreign?'외국인 선수 시장 보기':esc(SLOTK[slot]||'')+' 자리 다른 구단 선수 보기'}">대체 후보 찾기</button></div>
      ${!e.a?`<div class="rva-w small muted">${esc(e.why)}</div>`:''}</div>`; }).join('')}</div>`; }

Object.assign(A,{
  rvKeep(v){ const [id,y]=String(v).split(':').map(Number); G.rvKeep=G.rvKeep||{}; if(G.rvKeep[id]===y)delete G.rvKeep[id]; else G.rvKeep[id]=y; save(); render(); },
  rvFind(v){ const p=G.players[+v]; if(!p)return; if(p.foreign){ UI.mail=null; A.go('transfer:foreign'); return; } const k=pSlot(p); UI.mail=null; UI.findPos=PSLOTS.includes(k)&&k!=='DH'?k:'all'; UI.findT=null; UI.findM=null; UI.findTeam='all'; A.go('trade:find'); }
});
