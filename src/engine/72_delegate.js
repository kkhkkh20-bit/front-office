/* ===== 업무 맡기기: 반복 업무를 직접 할지 비서·팀장에게 맡길지 고른다 =====
 맡기면 스태프가 '무난한' 선택을 한다. 직접 하면 더 좋은 결과를 낼 수 있다(예: 맡긴 연봉 협상은 요구액과 산정안의 중간쯤에서 합의, 맡긴 외국인 재계약은 기준선보다 4% 더 주고 잡음).
 큰 결정(드래프트·트레이드 협상·FA·외국인 영입·단장 계약·협회 표결)은 맡기지 않는다. */
const AUTO_AREAS=[
  ['sal','국내 연봉 협상','운영팀이 산정안과 요구액의 중간쯤을 제시하고 1월 5일에 확정합니다. 직접 하면 산정안에 더 가깝게 맞출 수 있습니다.'],
  ['fre','외국인 재계약','운영팀이 쓸 만한 선수(WAR 1.5 이상 또는 능력 55 이상)만 기준선보다 4% 더 주고 잡고, 나머지는 보류권을 쥔 채 결별합니다.'],
  ['ev','일상 결정','기강·면담·콜업 여론·팬 행사 같은 일상 결정을 비서가 기본안으로 처리합니다(감독 갈등·징계 같은 핵심 결정은 계속 직접).'],
  ['mgr','감독 요청','감독이 올리는 영입·기용·드래프트 방향 요청에 비서가 기본안으로 답합니다. 직접 답하면 감독과의 관계를 더 잘 챙길 수 있습니다.'],
  ['scout','스카우트 배치','스카우트팀장이 시기에 맞게 배치합니다.'],
  ['tro','받은 트레이드 제안','부단장이 검토해 모두 정중히 거절합니다. 주간 요약에 남깁니다.'],
  ['raid','스태프 빼가기 대응','능력 4 이상은 상대 조건에 맞춰 붙잡고, 그 아래는 보내 줍니다.']];
function autoOn(k){ if(!G)return false; if(k==='scout')return !!G.scoutAuto; if(k==='ev')return !!(G.deleg&&Object.keys(EV_NAME).every(e=>G.deleg[e])); return !!(G.auto&&G.auto[k]); }
function autoSet(k,v){ G.auto=G.auto||{}; G.auto[k]=!!v;
  if(k==='ev'){ G.deleg=G.deleg||{}; for(const e in EV_NAME)G.deleg[e]=!!v; }
  if(k==='scout'){ G.scoutAuto=!!v; if(v)try{ scoutPlanApply(true); }catch(e){} } }
function autoAll(v){ for(const [k] of AUTO_AREAS)autoSet(k,v); G.autoMode=v?'easy':'self'; }
function autoLogAdd(t,c,r){ (G.autoLog=G.autoLog||[]).unshift({d:G.day,t,c,r:r||'',k:'auto'}); if(G.autoLog.length>20)G.autoLog.length=20; }

/* 국내 연봉: 12월 5일 1차 제시(중간값), 12월 19일 남은 선수에게 다시 제시, 1월 5일 확정 */
function autoSalRound(first){ const C=G.contract; if(!C||C.done)return; salTalkInit(); let ok=0, left=0;
  for(const id of Object.keys(C.neg||{})){ const n=C.neg[id]; if(n.st!=='open')continue; const amt=first?round5(n.off+(n.ask-n.off)*.5):(n.ask<=n.off*1.15?n.ask:round5(n.off+(n.ask-n.off)*.6)); salOffer(+id,amt,true); if(C.neg[id].st==='ok')ok++; else left++; }
  autoLogAdd(first?'연봉 협상 1차(운영팀)':'연봉 협상 2차(운영팀)',`${ok}명 합의${left?`, ${left}명 남음`:''}`); note('연봉',`운영팀이 연봉 협상 ${first?'1차':'2차'} 제시를 했습니다. ${ok}명 합의${left?`, ${left}명은 더 원합니다`:''}. ${first?'12월 19일 한 번 더 제시하고 1월 5일에 확정합니다.':'1월 5일에 확정합니다.'}`); }
/* 외국인 재계약: 12월 3일 */
function autoFre(){ const C=G.contract; if(!C||C.done)return; const L=[];
  for(const id of C.foreignEnd){ const p=G.players[id]; if(!p||C.foreignDrop.includes(id))continue; const h=seasonTotal(p,C.y,'1군'); const war=h?warOf(h,p):0;
    if(war>=1.5||ovr(p)>=55){ const f=foReComfort(p); const g=Math.ceil(foReFloor(p)*1.04/f/USD)*USD; const r=foReOffer(id,g,0); L.push(`${p.name}: ${r.ok?`재계약 ${usdT(g)}`:'거절(떠남)'}`); }
    else { C.foreignDrop.push(id); L.push(`${p.name}: 결별(보류권 유지)`); } }
  let g=0; while(fReCapInfo().over>0&&g++<4){ const k=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id)).sort((a,b)=>ovr(a)-ovr(b))[0]; if(!k)break; C.foreignDrop.push(k.id); L.push(`${k.name}: 총액 한도로 결별`); }
  if(L.length){ autoLogAdd('외국인 재계약(운영팀)',L.join(' · ')); note('연봉',`운영팀이 외국인 재계약을 처리했습니다.\n${L.join('\n')}`); } }
function autoConfirm(){ const C=G.contract; if(!C||C.done)return; if(C.foreignEnd.length&&!autoOn('fre'))return; if(!autoOn('sal'))return; const r=confirmContracts(); if(!r)autoLogAdd('연봉 계약 확정(운영팀)','국내·외국인 계약을 확정했습니다.'); }
function autoDaily(day){ if(!G.auto||G.unemp)return;
  if(day===KD(12,3)&&autoOn('fre'))try{ autoFre(); }catch(e){}
  if(day===KD(12,5)&&autoOn('sal'))try{ autoSalRound(true); }catch(e){}
  if(day===KD(12,19)&&autoOn('sal'))try{ autoSalRound(false); }catch(e){}
  if(day===KD(1,5))try{ autoConfirm(); }catch(e){} }
/* 받은 트레이드 제안: 맡겼으면 부단장이 바로 거절한다 */
function autoTradeOffer(off){ if(!autoOn('tro'))return false; G.offers=(G.offers||[]).filter(x=>x.id!==off.id); const d=`${off.give.map(id=>G.players[id]?G.players[id].name:'?').join(', ')}을(를) 주고 ${off.get.map(id=>G.players[id]?G.players[id].name:'?').join(', ')}을(를) 원한 제안`; autoLogAdd(`${tshort(off.from)} 트레이드 제안`,'부단장 거절',d); mail('부단장',`${tshort(off.from)} 트레이드 제안: 부단장이 거절`,`${tname(off.from)}이(가) ${d}을 보냈고, 맡기신 대로 부단장이 정중히 거절했습니다. 직접 검토하려면 설정 · 권한에서 '받은 트레이드 제안'을 가져오세요.`,{kind:'트레이드'}); return true; }
/* 스태프 빼가기: 맡겼으면 바로 정한다 */
function autoRaid(){ if(!autoOn('raid'))return; for(const r of [...(G.stRaid||[])]){ const s=(r.k==='sc'?G.scouts:anaList()).find(x=>x.id===r.id); if(!s)continue; const m=(s.skill>=4?stKeep(r.id,true):stLeave(r)); autoLogAdd(`${s.name} 영입 제안 대응`,s.skill>=4?'붙잡음':'보내 줌',m); mail('운영팀',`${tshort(r.tid)}의 ${s.name} 영입 제안: 운영팀이 ${s.skill>=4?'붙잡음':'보내 줌'}`,`${m}\n맡기신 대로 운영팀이 처리했습니다(능력 4 이상은 상대 조건에 맞춰 붙잡고 그 아래는 보냅니다).`,{kind:'스태프'}); } }

/* ===== 비서에게 넘기기: 알림마다 '비서에게 넘기기' 버튼. 누르면 그 업무를 앞으로 비서·팀장이 맡고, 지금 걸린 일도 바로 처리한다.
   설정 · 권한 탭에서 언제든 다시 가져올 수 있다 ===== */
const AUTO_WHO={sal:'운영팀',fre:'운영팀',ev:'비서',mgr:'비서',scout:'스카우트팀장',tro:'부단장',raid:'운영팀'};
function autoNow(k){ const C=G.contract; const out=[];
  if(k==='sal'&&C&&!C.done){ autoSalRound(true); out.push('연봉 협상 1차 제시를 마쳤습니다'); }
  if(k==='fre'&&C&&!C.done){ autoFre(); out.push('외국인 재계약을 처리했습니다'); }
  if(k==='tro'){ for(const o of [...(G.offers||[])])autoTradeOffer(o); out.push('받은 트레이드 제안을 정리했습니다'); }
  if(k==='raid'){ autoRaid(); out.push('스태프 영입 제안에 대응했습니다'); }
  if(k==='scout'){ out.push('스카우트 배치를 맡았습니다'); }
  if(k==='ev'||k==='mgr'){ for(const e of [...(G.evs||[])]){ if(e.done)continue; if((k==='ev'&&!EV_KEY.has(e.k)&&EV_NAME[e.k])||(k==='mgr'&&(e.k==='mreq'||e.k==='mpick'))){ e.deleg=true; evPick(e.id,e.def,true); } } out.push('걸려 있던 결정을 기본안으로 처리했습니다'); }
  if(C&&!C.done&&autoOn('sal')&&(!C.foreignEnd.length||autoOn('fre'))&&G.day>=KD(1,5)&&dobj(G.day).m<=2)autoConfirm();
  return out.join('. '); }
function handOff(k){ autoSet(k,true); const r=autoNow(k); const a=AUTO_AREAS.find(x=>x[0]===k); return `${a?a[1]:'이 업무'}을(를) ${AUTO_WHO[k]||'비서'}에게 넘겼습니다.${r?' '+r+'.':''} 설정 · 권한에서 다시 가져올 수 있습니다.`; }
function takeBack(k){ autoSet(k,false); const a=AUTO_AREAS.find(x=>x[0]===k); return `${a?a[1]:'이 업무'}을(를) 다시 직접 합니다.`; }
/* 결정 한 건만 넘기기(핵심 결정 포함): 비서가 기본안으로 처리 */
function handOffEv(id){ const e=(G.evs||[]).find(x=>x.id===id); if(!e||e.done)return '이미 정한 일입니다.'; e.deleg=true; const r=evPick(e.id,e.def,true); return `비서가 "${e.opts[e.def].l}"(으)로 처리했습니다.${r?' '+r:''}`; }
/* 스카우트: 맡기지 않았으면 팀장이 달마다 배치 제안을 보낸다(적용은 단장이) */
function scoutSuggest(){ if(G.scoutAuto||G.unemp)return; let P=[]; try{ P=scoutPlan().filter(x=>x.move); }catch(e){ return; } if(!P.length)return; const sig=P.map(x=>x.s.id+x.role+x.key).join('|'); if(G.scSugSig===sig)return; G.scSugSig=sig;
  const c=scoutChief(); mail('스카우트팀',`스카우트팀장 배치 제안 ${P.length}명`,`${c?`${c.name} 팀장`:'스카우트팀장'}의 이번 달 배치 제안입니다.\n${P.map(x=>`${x.s.name}: ${scoutSlotTxt(x.role,x.key)} (${x.why})`).join('\n')}\n바꾼 스카우트는 30일 동안 적응 기간입니다.`,{kind:'스카우트',acts:[{l:'제안대로 배치',a:'scoutPlanGo',v:''}]}); if(G.mail[0])G.mail[0].auto=['scout']; }
