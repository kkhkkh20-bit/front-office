/* ===== 업무 맡기기: 반복 업무를 직접 할지 비서·팀장에게 맡길지 고른다 =====
 맡기면 스태프가 '무난한' 선택을 한다. 직접 하면 더 좋은 결과를 낼 수 있다(예: 맡긴 연봉 협상은 요구액과 산정안의 중간쯤에서 합의, 맡긴 외국인 재계약은 기준선보다 4% 더 주고 잡음).
 큰 결정(드래프트·트레이드 협상·FA·외국인 영입·단장 계약·협회 표결)은 맡기지 않는다. */
const AUTO_AREAS=[
  ['sal','국내 연봉 협상','운영팀이 산정안과 요구액의 중간쯤을 제시하고 1월 5일에 확정합니다. 직접 하면 산정안에 더 가깝게 맞출 수 있습니다.'],
  ['fre','외국인 재계약','운영팀이 지난 시즌 WAR 1.5 이상이거나 종합 능력 {55} 이상(선수 화면과 같은 척도)인 선수만 잡습니다. 제시액은 선수가 받아들이는 재계약 하한보다 4% 더(보통 수만 달러)이고, 나머지는 보류권을 쥔 채 결별합니다. 외국인 총액 한도를 넘으면 능력이 낮은 선수부터 정리합니다.'],
  ['ev','일상 결정','기강·면담·콜업 여론·팬 행사 같은 일상 결정을 비서가 기본안으로 처리합니다(감독 갈등·징계 같은 핵심 결정은 계속 직접).'],
  ['mgr','감독 요청','감독이 올리는 영입·기용·드래프트 방향 요청에 비서가 기본안으로 답합니다. 직접 답하면 감독과의 관계를 더 잘 챙길 수 있습니다.'],
  ['scout','스카우트 배치','스카우트팀장이 시기에 맞게 배치합니다.'],
  ['tro','받은 트레이드 제안','부단장이 검토해 정중히 거절합니다(모두 거절, 또는 우리 평가로 공정에 가까운 제안(손해 1 이내)만 올리기). 주간 요약에 남깁니다.'],
  ['raid','스태프 빼가기 대응','별 4개 이상(★★★★, 5개 만점) 스카우트·분석원은 상대 제시액에 맞춰 붙잡고, 그 아래는 보내 줍니다. 상대 제시액이 지금 연봉의 1.5배를 넘으면 붙잡기 전에 단장 승인을 받습니다.']];
function autoOn(k){ if(!G)return false; if(k==='scout')return !!G.scoutAuto; if(k==='ev')return !!(G.deleg&&Object.keys(EV_NAME).every(e=>G.deleg[e])); return !!(G.auto&&G.auto[k]); }
function autoSet(k,v){ G.auto=G.auto||{}; const prev=G.auto[k]; G.auto[k]=k==='tro'&&v==='good'?'good':!!v; if(k==='tro'&&G.auto.tro&&G.auto.tro!==prev)for(const o of [...(G.offers||[])])try{ autoTradeOffer(o); }catch(e){} /* '모두 거절'로 바꾸면 이미 올라온 제안도 정리(검수 11-07) */
  if(k==='ev'){ G.deleg=G.deleg||{}; for(const e in EV_NAME)G.deleg[e]=!!v; }
  if(k==='scout'){ G.scoutAuto=!!v; G._scErr=null; if(v)try{ scoutPlanApply(true); }catch(e){ G._scErr=String(e&&e.message||e); } } }
function autoAll(v){ for(const [k] of AUTO_AREAS)autoSet(k,v); G.autoMode=v?'easy':'self'; }
function autoLogAdd(t,c,r){ (G.autoLog=G.autoLog||[]).unshift({d:G.day,t,c,r:r||'',k:'auto'}); if(G.autoLog.length>20)G.autoLog.length=20; }

/* 국내 연봉: 12월 5일 1차 제시(중간값), 12월 19일 남은 선수에게 다시 제시, 1월 5일 확정 */
function autoSalRound(first){ const C=G.contract; if(!C||C.done)return; salTalkInit(); let ok=0, left=0; if(first)C.salR1=G.day; else C.salR2=G.day; /* 차수별 처리일: 예약 처리와 수동 넘기기가 겹쳐 두 번 부르지 않게(검수 11-07) */
  for(const id of Object.keys(C.neg||{})){ const n=C.neg[id]; if(n.st!=='open')continue; const base=first?round5(n.off+(n.ask-n.off)*.5):(n.ask<=n.off*1.15?n.ask:round5(n.off+(n.ask-n.off)*.6)); const amt=Math.min(n.ask,Math.max(base,n.cur??0)); /* 단장이 이미 제시한 금액 아래로 다시 부르지 않는다(검수 11-07) */ salOffer(+id,amt,true); if(C.neg[id].st==='ok')ok++; else left++; }
  autoLogAdd(first?'연봉 협상 1차(운영팀)':'연봉 협상 2차(운영팀)',`${ok}명 합의${left?`, ${left}명 남음`:''}`); note('연봉',`운영팀이 연봉 협상 ${first?'1차':'2차'} 제시를 했습니다. ${ok}명 합의${left?`, ${left}명은 더 원합니다`:''}. ${first?(G.day>=dnum(C.y,12,19)?'다음 날 한 번 더 제시한 뒤 확정합니다.':'12월 19일 한 번 더 제시하고 1월 5일에 확정합니다.'):G.day>=dnum(C.y+1,1,5)?'곧 확정합니다.':'1월 5일에 확정합니다.'}`); }
/* 외국인 재계약: 12월 3일 */
function autoFre(){ const C=G.contract; if(!C||C.done)return; C.freTry=G.day; let fail=0; const L=[];
  for(const id of C.foreignEnd){ const p=G.players[id]; if(!p||C.foreignDrop.includes(id))continue; const h=seasonTotal(p,C.y,'1군'); const war=h?warOf(h,p):0;
    if(C.fre&&C.fre[id]&&C.fre[id].ok){ L.push(`${p.name}: 이미 재계약 합의${p.newSal?` ${usdT(p.newSal)}`:''}`); continue; }
    if(war>=1.5||ovr(p)>=55){ const f=foReComfort(p); const cap=p.foreign==='아시아'?asiaReCap(p):Infinity; const g0=Math.ceil(foReFloor(p)*1.04/f/USD)*USD; const g=g0>cap?Math.max(Math.ceil(foReFloor(p)/f/USD)*USD,Math.floor(cap/USD)*USD):g0; /* 가산·올림이 아시아쿼터 상한을 넘으면 상한 안으로(검수 11-07) */ const r=foReOffer(id,Math.min(g,cap),0); if(!r.ok){ fail++; C.freFail=C.freFail||{}; C.freFail[id]=(C.freFail[id]||0)+1; if(C.freFail[id]>=3){ if(!C.foreignDrop.includes(id))C.foreignDrop.push(id); L.push(`${p.name}: 세 번 제시했지만 합의하지 못해 결별(보류권 유지)`); continue; } } L.push(`${p.name}: ${r.ok?`재계약 ${usdT(Math.min(g,cap))}`:`합의 실패(${String(r.msg||'').replace(/[.。]\s*$/,'').slice(0,40)}) · 다음 날 다시 제시`}`); }
    else { C.foreignDrop.push(id); L.push(`${p.name}: 결별(보류권 유지)`); } }
  /* 총액 한도: 아직 합의 안 한 선수부터, 그래도 넘으면 합의한 선수도 결별하되 합의 상태를 풀고 따로 알린다(검수 11-06) */
  const agreed=id=>!!(C.fre&&C.fre[id]&&C.fre[id].ok); let g=0; while(fReCapInfo().over>0&&g++<4){ const k=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id)).sort((a,b)=>agreed(a.id)-agreed(b.id)||ovr(a)-ovr(b))[0]; if(!k)break; C.foreignDrop.push(k.id);
    if(agreed(k.id)){ C.fre[k.id].ok=false; C.fre[k.id].cut=G.day; L.push(`${k.name}: 이미 합의했지만 총액 한도로 결별(합의 취소)`); } else L.push(`${k.name}: 총액 한도로 결별`); }
  if(!fail)C.freAuto=G.day; /* 실패한 선수가 있으면 다음 날 다시 시도(검수 11-07) */
  if(L.length){ autoLogAdd('외국인 재계약(운영팀)',L.join(' · ')); note('연봉',`운영팀이 외국인 재계약을 처리했습니다.\n${L.join('\n')}`); } }
/* 남은 외국인 재계약 결정(결별도 합의도 안 한 선수). 외국인 위임을 껐더라도 이게 없으면 국내 연봉 확정을 미루지 않는다(리뷰 2026-11-01) */
function fRePending(){ const C=G.contract; if(!C||C.done)return []; return C.foreignEnd.filter(id=>{ const p=G.players[id]; return p&&p.team===G.user&&!C.foreignDrop.includes(id)&&!(C.fre&&C.fre[id]&&C.fre[id].ok); }); }
function autoConfirm(){ const C=G.contract; if(!C||C.done)return; if(!autoOn('sal'))return; if(C.salR1&&!C.salR2&&C.salR1!==G.day){ try{ autoSalRound(false); }catch(e){} } /* 확정 전에 2차 제시를 빠뜨리지 않는다 */
  if((!C.salR1||!C.salR2)&&Object.values(C.neg||{}).some(n=>n.st==='open')){ C.autoWait={d:G.day,why:'연봉 협상 2차 제시를 한 뒤(다음 날) 확정합니다'}; return; } /* 오늘 1차를 했으면 2차를 건너뛰고 확정하지 않는다(검수 11-07) */
  if(autoOn('fre')&&fRePending().length&&C.freTry!==G.day)try{ autoFre(); }catch(e){} /* 외국인 위임: 실패한 선수는 다시 시도한 뒤에만 확정 */
  const pend=fRePending(); if(pend.length&&autoOn('fre')){ C.autoWait={d:G.day,f:1,why:`외국인 ${pend.length}명(${pend.map(id=>G.players[id].name).join(', ')}) 재계약 협상 중 — 합의하거나 결별이 정해지면 확정합니다`}; return; } /* 협상이 끝나기 전에 기본 산정 연봉으로 확정하지 않는다(검수 11-07) */
  if(pend.length&&!autoOn('fre')){ C.autoWait={d:G.day,f:1,why:`외국인 ${pend.length}명(${pend.map(id=>G.players[id].name).join(', ')}) 재계약 미결정으로 확정 대기 — 재계약 합의 또는 결별을 정하면 다음 날 확정합니다`}; return; }
  const r=confirmContracts(); if(r){ C.autoWait={d:G.day,why:String(r)}; return; } delete C.autoWait; C.autoDone={d:G.day,n:C.ended.filter(id=>{ const p=G.players[id]; return p&&p.team===G.user&&!p.hold; }).length,h:C.ended.filter(id=>G.players[id]&&G.players[id].hold).length,f:C.foreignEnd.filter(id=>!C.foreignDrop.includes(id)).length}; /* 결별한 선수는 빼고 센다(검수 11-07) */ autoLogAdd('연봉 계약 확정(운영팀)','국내·외국인 계약을 확정했습니다.'); }
/* 위임 업무 처리 상태(처리 예정·완료·대기와 이유). 지금은 연봉 계약 */
function delegStatus(k){ if(k!=='sal'||!autoOn('sal'))return ''; const C=G.contract; if(!C)return '';
  if(C.done)return C.autoDone?`처리 완료: ${dmd(C.autoDone.d)} 국내 ${C.autoDone.n}명·외국인 ${C.autoDone.f}명 계약 확정${C.autoDone.h?` · 미계약 ${C.autoDone.h}명`:''}`:'처리 완료: 올해 연봉 계약 확정';
  if(C.autoWait){ if(C.autoWait.f){ const pend=fRePending(); if(!pend.length||autoOn('fre'))return `처리 예정: 외국인 결정이 끝나 ${G.day<dnum(C.y+1,1,5)?'1월 5일':'다음 날'} 운영팀이 확정`; return `대기: 외국인 ${pend.length}명(${pend.map(id=>G.players[id]?G.players[id].name:'?').join(', ')}) 재계약 미결정 — 재계약 합의 또는 결별을 정하면 다음 날 확정합니다`; } return `대기: ${C.autoWait.why}`; } /* 지난 사유가 아니라 지금 남은 사유 */ return `처리 예정: ${G.day<dnum(C.y+1,1,5)?'1월 5일':'다음 날'} 운영팀이 확정`; } /* 12월에는 KD(1,5)가 지난 1월이라 '다음 날'로 나왔다(검수 11-06) */
function autoDaily(day){ if(!G.auto||G.unemp)return;
  if(autoOn('fre')&&G.contract&&!G.contract.done&&!G.contract.freAuto&&G.contract.freTry!==day&&(day>=KD(12,3)||dobj(day).m<=2))try{ autoFre(); }catch(e){} /* 12월 3일이 지난 뒤 맡겨도 다음 날 처리한다(검수 11-06) */
  { const C=G.contract; if(autoOn('sal')&&C&&!C.done){ const y=C.y; /* 1차 12월 5일, 2차 12월 19일. 늦게 맡겨 1차가 늦었으면 1차 7일 뒤(확정 하루 전까지)에 2차(검수 11-07) */
    if(!C.salR1&&day>=dnum(y,12,5))try{ autoSalRound(true); }catch(e){}
    else if(C.salR1&&!C.salR2&&C.salR1!==day&&(day>=dnum(y,12,19)&&day-C.salR1>=7||day>=dnum(y+1,1,4)))try{ autoSalRound(false); }catch(e){} } }
  if(dobj(day).m<=2&&day>=KD(1,5))try{ autoConfirm(); }catch(e){} } /* 확정일이 지난 뒤 위임하거나 대기 사유가 풀려도 다음 날부터 다시 확인 */
/* 받은 트레이드 제안: 맡겼으면 부단장이 바로 거절한다 */
/* 우리 평가(부단장 의견과 같은 기준)로 받는 쪽 가치 - 주는 쪽 가치 */
function troDiff(off){ return tradeValueDiff(off.get,off.give,off.cash,off.pk); }
function autoTradeOffer(off){ if(!autoOn('tro'))return false;
  if(G.auto.tro==='good'){ let df=-99; try{ df=troDiff(off); }catch(e){} if(df>=-1){ off.asst=`부단장 1차 검토: 우리 평가로 ${df>=0?'공정 이상':'공정에 가까운(손해 1 이내)'} 제안이라 직접 보시도록 올립니다.`; autoLogAdd(`${tshort(off.from)} 트레이드 제안`,'부단장이 올림','유망한 제안'); return false; } } G.offers=(G.offers||[]).filter(x=>x.id!==off.id); offerMailDone(off.id); const d=`${off.give.map(id=>G.players[id]?G.players[id].name:'?').join(', ')}을(를) 주고 ${off.get.map(id=>G.players[id]?G.players[id].name:'?').join(', ')}을(를) 원한 제안`; autoLogAdd(`${tshort(off.from)} 트레이드 제안`,'부단장 거절',d); if(!off.blk)mail('부단장',`${tshort(off.from)} 트레이드 제안: 부단장이 거절`,`${tname(off.from)}이(가) ${d}을 보냈고, 맡기신 대로 부단장이 정중히 거절했습니다. 직접 검토하려면 설정 · 권한에서 '받은 트레이드 제안'을 가져오세요.`,{kind:'트레이드'}); /* 매물 제안은 매일 올 수 있어 메일 없이 위임 기록만 */ return true; }
/* 스태프 빼가기: 맡겼으면 바로 정한다 */
function autoRaid(){ if(!autoOn('raid'))return; for(const r of [...(G.stRaid||[])]){ const s=(r.k==='sc'?G.scouts:anaList()).find(x=>x.id===r.id); if(!s)continue;
    if(s.skill>=4&&r.sal>s.sal*1.5){ if(!r.ask){ r.ask=true; autoLogAdd(`${s.name} 영입 제안 대응`,'단장 승인 요청',`상대 제시 연 ${money(r.sal)}(지금 ${money(s.sal)}의 ${Math.round(r.sal/s.sal*100)}%)`); mail('운영팀',`${s.name} 붙잡기: 단장 승인이 필요합니다`,`${tshort(r.tid)}이(가) 연 ${money(r.sal)}을(를) 제시했습니다. 지금 연봉 ${money(s.sal)}의 1.5배를 넘어 운영팀이 바로 맞추지 않았습니다. ${dmd(r.exp)}까지 정해 주세요.`,{kind:'스태프',imp:true,acts:[{l:`맞춰서 붙잡기(연 ${money(r.sal)})`,a:'stKeep',v:s.id+':1'},{l:'조금 올려 설득(+10%)',a:'stKeep',v:s.id+':0'},{l:'보내 주기',a:'stLet',v:s.id}]}); } /* 승인 요청에도 바로 답할 버튼과 기한(검수 11-09za) */ continue; } /* 비용 한도를 넘는 인상은 단장 승인 */
    const m=(s.skill>=4?stKeep(r.id,true):stLeave(r)); const still=(r.k==='sc'?G.scouts:anaList()).some(x=>x.id===r.id), open=(G.stRaid||[]).includes(r); const res=s.skill>=4?(still&&!open?'붙잡음':'붙잡기 실패'):(!still?'보내 줌':'보내기 실패'); /* 실제 결과로 기록(검수 11-07) */ autoLogAdd(`${s.name} 영입 제안 대응`,res,m); mail('운영팀',`${tshort(r.tid)}의 ${s.name} 영입 제안: 운영팀이 ${res}`,`${m}\n맡기신 대로 운영팀이 처리했습니다(별 4개 이상은 상대 조건에 맞춰 붙잡고 그 아래는 보냅니다. 지금 연봉의 1.5배를 넘으면 단장 승인).`,{kind:'스태프'}); } }

/* ===== 비서에게 넘기기: 알림마다 '비서에게 넘기기' 버튼. 누르면 그 업무를 앞으로 비서·팀장이 맡고, 지금 걸린 일도 바로 처리한다.
   설정 · 권한 탭에서 언제든 다시 가져올 수 있다 ===== */
const AUTO_WHO={sal:'운영팀',fre:'운영팀',ev:'비서',mgr:'비서',scout:'스카우트팀장',tro:'부단장',raid:'운영팀'};
function autoNow(k){ const C=G.contract; const out=[];
  if(k==='sal'&&C&&!C.done&&!C.salR1&&G.day>=dnum(C.y,12,5)){ autoSalRound(true); out.push('연봉 협상 1차 제시를 마쳤습니다'); } /* 1차는 한 번만(예약 처리와 겹치지 않게). 12월 5일 전에 맡기면 그날 제시 */ /* 맡기기를 반복해도 강제 제시는 주 1회 */
  if(k==='fre'&&C&&!C.done){ const d0=C.foreignDrop.length; if(C.freTry!==G.day)autoFre(); /* 하루 한 번만 제시(가져왔다 다시 넘겨도 같은 날 재시도를 다 쓰지 않게, 검수 11-07) */ const cut=C.foreignDrop.slice(d0).map(id=>G.players[id]).filter(Boolean); out.push(`외국인 재계약을 처리했습니다${cut.length?`(결별: ${cut.map(p=>p.name).join(', ')})`:''}`); }
  if(k==='tro'){ for(const o of [...(G.offers||[])])autoTradeOffer(o); out.push('받은 트레이드 제안을 정리했습니다'); }
  if(k==='raid'){ autoRaid(); out.push('스태프 영입 제안에 대응했습니다'); }
  if(k==='scout'){ out.push(G._scErr?`스카우트 배치는 맡았지만 지금 배치 조정에 실패했습니다(${G._scErr.slice(0,40)}). 다음 달 다시 시도합니다`:'스카우트 배치를 맡았습니다'); } /* 실제 결과대로 안내(검수 11-07) */
  if(k==='ev'||k==='mgr'){ let nd=0,nv=0; for(const e of [...(G.evs||[])]){ if(e.done)continue; if((k==='ev'&&!EV_KEY.has(e.k)&&EV_NAME[e.k])||(k==='mgr'&&(e.k==='mreq'||e.k==='mpick'))){ e.deleg=true; evPick(e.id,e.def,true); if(e.void)nv++; else if(e.done)nd++; } } out.push(nd||!nv?`걸려 있던 결정 ${nd}건을 기본안으로 처리했습니다`:''); if(nv)out.push(`${nv}건은 대상이 떠나 효력을 잃어 처리하지 않았습니다`); }
  if(C&&!C.done&&autoOn('sal')&&G.day>=KD(1,5)&&dobj(G.day).m<=2)autoConfirm();
  return out.filter(Boolean).join('. '); }
function handOff(k){ autoSet(k,true); const r=autoNow(k); const a=AUTO_AREAS.find(x=>x[0]===k); return `${a?a[1]:'이 업무'}을(를) ${AUTO_WHO[k]||'비서'}에게 넘겼습니다.${r?' '+r+'.':''} 설정 · 권한에서 다시 가져올 수 있습니다.`; }
function takeBack(k){ autoSet(k,false); const a=AUTO_AREAS.find(x=>x[0]===k); return `${a?a[1]:'이 업무'}을(를) 다시 직접 합니다.`; }
/* 결정 한 건만 넘기기(핵심 결정 포함): 비서가 기본안으로 처리 */
function handOffEv(id){ const e=(G.evs||[]).find(x=>x.id===id); if(!e||e.done)return '이미 정한 일입니다.'; if(EV_GM.has(e.k))return '단장 계약과 협회 표결은 단장이 직접 정합니다.'; e.deleg=true; const r=evPick(e.id,e.def,true); if(e.void||!e.done)return r||'처리하지 못했습니다.'; /* 효력을 잃은 결정은 처리했다고 하지 않는다(검수 11-07) */ return `비서가 "${e.opts[e.pick??e.def].l}"(으)로 처리했습니다.${r?' '+r:''}`; /* 처리 중 바뀐 실제 선택으로(검수 11-09z) */ }
/* 스카우트: 맡기지 않았으면 팀장이 달마다 배치 제안을 보낸다(적용은 단장이) */
function scoutSuggest(){ if(G.scoutAuto||G.unemp)return; let P=[]; try{ P=scoutPlan().filter(x=>x.move); }catch(e){ return; } if(!P.length)return; const sig=(G.year*100+dobj(G.day).m)+'#'+P.map(x=>x.s.id+x.role+x.key).join('|'); if(G.scSugSig===sig)return; /* 지난달 제안은 기한이 끝나므로 같은 내용이라도 달마다 새로 보낸다(검수 11-09e #22) */ G.scSugSig=sig;
  const c=scoutChief(); mail('스카우트팀',`스카우트팀장 배치 제안 ${P.length}명`,`${c?`${c.name} 팀장`:'스카우트팀장'}의 이번 달 배치 제안입니다.\n${P.map(x=>`${x.s.name}: ${scoutSlotTxt(x.role,x.key)} (${x.why})`).join('\n')}\n바꾼 스카우트는 30일 동안 적응 기간입니다.`,{kind:'스카우트',acts:[{l:'제안대로 배치',a:'scoutPlanGo',v:P.map(x=>x.s.id+':'+x.role+':'+x.key).join('|')}]}); if(G.mail[0])G.mail[0].auto=['scout']; }
