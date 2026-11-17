/* ===== 업무 맡기기: 반복 업무를 직접 할지 비서·팀장에게 맡길지 고른다 =====
 맡기면 스태프가 '무난한' 선택을 한다. 직접 하면 더 좋은 결과를 낼 수 있다(예: 맡긴 연봉 협상은 요구액과 산정안의 중간쯤에서 합의, 맡긴 외국인 재계약은 기준선보다 4% 더 주고 잡음).
 큰 결정(드래프트·트레이드 협상·FA·외국인 영입·단장 계약·협회 표결)은 맡기지 않는다. */
const AUTO_AREAS=[
  ['sal','국내 연봉 협상','운영팀이 산정안과 요구액의 중간쯤을 제시하고 1월 5일에 확정합니다. 직접 하면 산정안에 더 가깝게 맞출 수 있습니다.'],
  ['fre','외국인 재계약','운영팀이 지난 시즌 WAR 1.5 이상이거나 종합 능력 {55} 이상(선수 화면과 같은 척도)인 선수만 잡습니다. 제시액은 선수가 받아들이는 재계약 하한보다 4% 더(보통 수만 달러)이고, 나머지는 보류권을 쥔 채 결별합니다. 외국인 총액 한도를 넘으면 능력이 낮은 선수부터 정리합니다.'],
  ['ev','일상 결정','기강·면담·콜업 여론·팬 행사 같은 일상 결정을 비서가 기본안으로 처리합니다(감독 갈등·징계 같은 핵심 결정은 계속 직접).'],
  ['mgr','감독 요청','감독이 올리는 영입·기용·드래프트 방향 요청에 비서가 기본안으로 답합니다. 직접 답하면 감독과의 관계를 더 잘 챙길 수 있습니다.'],
  ['scout','스카우트 배치','스카우트팀장이 시기에 맞게 배치하고, 매주 월요일 출장(주말리그·전국대회·학교 방문)도 정해 보냅니다. 출장 안 메일은 오지 않고 일요일 현장 보고만 옵니다.'], /* 출장도 함께(사용자 11-17) */
  ['tro','받은 트레이드 제안','부단장이 검토해 정중히 거절합니다. 모두 거절하거나, 우리 평가로 공정에 가까운 제안(손해 1 이내)만 올립니다. 주간 요약에 남깁니다.'],
  ['raid','스태프 빼가기 대응','별 4개 이상(★★★★, 5개 만점) 스카우트·분석원은 상대 제시액에 맞춰 붙잡고, 그 아래는 보내 줍니다. 상대 제시액이 지금 연봉의 1.5배를 넘으면 붙잡기 전에 단장 승인을 받습니다.'],
  ['schg','고교 야구부 후원','고른 권역에서 올해 후원하지 않은 학교를 매주 월요일 후원합니다. 학교마다 한 해 한 번, 곳당 1,000만 원으로 직접 할 때와 같습니다. 권역은 스카우트 > 지역 정보망에서 고릅니다.'],
  ['sisv','자매구단 교류 방문단','고른 나라에서 다시 보낼 수 있는 구단에 매주 월요일 방문단을 보냅니다. 구단마다 60일에 한 번, 곳당 2,000만 원으로 직접 할 때와 같습니다. 나라는 스카우트 > 해외 네트워크에서 고릅니다.'],
  ['stalk','직원 희망 보직 면담','면담할 수 있는 우리 코치·스카우트·데이터팀 직원과 매주 월요일 업무·희망 보직 면담을 합니다. 한 사람에 14일에 한 번이고, 관계가 오르는 폭도 직접 할 때와 같습니다.'],
  ['ovsb','해외 연수 일괄 신청','고른 연수가 신청 기간이면 월요일에 기본 선택(25세 이하·더 클 여지가 큰 순, 입대 예정·상무 지원·부상 제외)으로 남은 자리를 채웁니다. 프로그램마다 한 해 한 번이고 비용은 직접 할 때와 같습니다. 프로그램은 육성 > 해외연수에서 고릅니다.']];
/* 국사왕 제안 자동화: 따로 켜야만 돈다(모두 맡기기에 넣지 않는다). 비용·횟수 제한·효과는 손으로 할 때와 같은 함수를 쓴다 */
const AUTO_OPTIN=new Set(['schg','sisv','stalk','ovsb']);
const AUTO_SCOPE={schg:()=>[...new Set(Object.values(schList()).map(S=>S.area))],sisv:()=>Object.keys(OCN),ovsb:()=>OVSK};
function autoScope(k){ const v=G&&G.auto&&G.auto[k]; return Array.isArray(v)?v.filter(x=>AUTO_SCOPE[k]().includes(x)):[]; }
function autoScopeToggle(k,x){ if(!AUTO_SCOPE[k]||!AUTO_SCOPE[k]().includes(x))return ''; const L=autoScope(k), on=!L.includes(x); G.auto=G.auto||{}; G.auto[k]=on?L.concat([x]):L.filter(y=>y!==x); const nm=k==='schg'?`${x} 고교 후원`:k==='ovsb'?`${OVS[x].l} 일괄 신청`:`${OCN[x]} 교류 방문단`;
  if(!on)return `${nm} 자동 처리를 껐습니다.`; const r=autoRoutine([k],[x]); return `${nm}을(를) 매주 월요일 자동으로 합니다.${r?' 오늘 '+r+'.':' 오늘은 처리할 곳이 없습니다.'}`; }
/* 매주 월요일(또는 켠 날 바로): 직접 할 때와 같은 일괄 함수로 처리하고 받은편지함 한 통·자동 처리 기록에 남긴다 */
function autoRoutine(keys,only){ if(G.unemp)return ''; const L=[], D=[];
  if(keys.includes('schg')&&autoOn('schg'))for(const a of only||autoScope('schg')){ const n=schGiftTargets(a).length; if(!n)continue; schGiftMany(a); L.push(`${a} 고교 ${n}곳 후원 ${money(10*n)}`); }
  if(keys.includes('sisv')&&autoOn('sisv'))for(const c of only||autoScope('sisv')){ const T=sisVisitTargets(c); if(!T.length)continue; sisVisitMany(c); L.push(`${OCN[c]} 구단 ${T.length}곳 방문단 ${money(SIS_VIS*T.length)}`); D.push(...T.map(x=>x.n)); }
  if(keys.includes('ovsb')&&autoOn('ovsb'))for(const k of only||autoScope('ovsb')){ const Y=G.ovsAutoY=G.ovsAutoY||{}; if(Y[k]===G.year)continue; const V=ovsBulkView(k); const ids=V.ok?V.rows.filter(r=>r.on).map(r=>r.id):[]; if(!ids.length)continue; const r=ovsBulk(k,ids); if(r.n){ Y[k]=G.year; L.push(`${OVS[k].l} ${r.n}명 신청 ${money(r.cost)}`); D.push(...r.names); } } /* 한 해 한 번: 단장이 뺀 선수 자리를 다시 채우지 않는다 */
  if(keys.includes('stalk')&&autoOn('stalk')){ const T=[...Object.values(G.coach?.[G.user]||{}),...(G.coachX||[])].filter(Boolean).map(s=>({kind:'coach',id:s.id})).concat((G.scouts||[]).filter(Boolean).map(s=>({kind:'scout',id:s.id})),(G.analysts||[]).filter(Boolean).map(s=>({kind:'analyst',id:s.id}))).filter(t=>t.id!=null&&!staffTalkCheck(t.kind,t.id,'listen'));
    if(T.length){ const r=staffTalkBulk(T,'listen'); if(r.success.length){ L.push(`직원 ${r.success.length}명 희망 보직 면담`); D.push(...r.success.map(x=>x.name)); } } }
  if(!L.length)return ''; const t=L.join(' · '); autoLogAdd('정기 업무(운영팀)',t);
  mail('운영팀',`자동 처리: ${L.length===1?L[0]:L.length+'건'}`,`맡기신 정기 업무를 처리했습니다.\n${L.join('\n')}${D.length?`\n\n대상: ${D.join(', ')}`:''}\n\n비용과 횟수 제한은 직접 할 때와 같습니다. 설정 > 권한에서 끌 수 있습니다.`,{kind:'운영',acts:[{l:'권한 설정',a:'go',v:'cfg:auth'}]});
  return t; }
function autoOn(k){ if(!G)return false; if(k==='scout')return !!G.scoutAuto; if(AUTO_SCOPE[k])return autoScope(k).length>0; if(k==='ev')return !!(G.deleg&&Object.keys(EV_NAME).every(e=>G.deleg[e])); return !!(G.auto&&G.auto[k]); }
function autoSet(k,v){ G.auto=G.auto||{}; if(AUTO_SCOPE[k]){ G.auto[k]=v===true?AUTO_SCOPE[k]():Array.isArray(v)?v:[]; return; } const prev=G.auto[k]; G.auto[k]=k==='tro'&&v==='good'?'good':!!v; if(k==='tro'&&G.auto.tro&&prev!==G.auto.tro)for(const o of [...(G.offers||[])])try{ autoTradeOffer(o); }catch(e){} /* 새 필터는 이미 받은 제안에도 적용한다. */
  if(k==='ev'){ G.deleg=G.deleg||{}; for(const e in EV_NAME)G.deleg[e]=!!v; }
  if(k==='scout'){ G.scoutAuto=!!v; G._scErr=null; if(v)try{ scoutPlanApply(true); }catch(e){ G._scErr=String(e&&e.message||e); }
    G.tripAuto=!!v; if(v)try{ const w0=tripPendNow()?G.tripPend.w0:tripWk0(G.day); tripApply(G.user,tripPlanWeek(G.user,w0),w0); delete G.tripPend; }catch(e){ console.error(e); } } } /* 출장도 함께: 맡기면 걸린 출장 안을 (바뀐 배치로 다시 짜서) 바로 보내고, 가져오면 출장 안 메일로 직접 정한다(사용자 11-17). 해시만 써서 난수 소비 없음 */
function autoAll(v){ for(const [k] of AUTO_AREAS)if(!AUTO_OPTIN.has(k)||!v)autoSet(k,v); G.autoMode=v?'easy':'self'; }
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
function delegStatus(k){ if(AUTO_OPTIN.has(k)&&autoOn(k)){ const L=(G.autoLog||[]).find(x=>x.t==='정기 업무(운영팀)'); return (AUTO_SCOPE[k]?`처리 범위: ${autoScope(k).map(x=>k==='sisv'?OCN[x]:k==='ovsb'?OVS[x].l:x).join(', ')}`:'처리 범위: 면담할 수 있는 모든 직원')+(L?` · 최근 처리 ${dmd(L.d)}`:' · 다음 월요일에 처리합니다'); } if(k!=='sal'||!autoOn('sal'))return ''; const C=G.contract; if(!C)return '';
  if(C.done)return C.autoDone?`처리 완료: ${dmd(C.autoDone.d)} 국내 ${C.autoDone.n}명·외국인 ${C.autoDone.f}명 계약 확정${C.autoDone.h?` · 미계약 ${C.autoDone.h}명`:''}`:'처리 완료: 올해 연봉 계약 확정';
  if(C.autoWait){ if(C.autoWait.f){ const pend=fRePending(); if(!pend.length||autoOn('fre'))return `처리 예정: 외국인 결정이 끝나 ${G.day<dnum(C.y+1,1,5)?'1월 5일':'다음 날'} 운영팀이 확정`; return `대기: 외국인 ${pend.length}명(${pend.map(id=>G.players[id]?G.players[id].name:'?').join(', ')}) 재계약 미결정 — 재계약 합의 또는 결별을 정하면 다음 날 확정합니다`; } return `대기: ${C.autoWait.why}`; } /* 지난 사유가 아니라 지금 남은 사유 */ return `처리 예정: ${G.day<dnum(C.y+1,1,5)?'1월 5일':'다음 날'} 운영팀이 확정`; } /* 12월에는 KD(1,5)가 지난 1월이라 '다음 날'로 나왔다(검수 11-06) */
function autoDaily(day){ if(!G.auto||G.unemp)return; if(dobj(day).w===1&&G.autoWk!==day){ G.autoWk=day; try{ autoRoutine(['schg','sisv','stalk','ovsb']); }catch(e){} }
  if(autoOn('fre')&&G.contract&&!G.contract.done&&!G.contract.freAuto&&G.contract.freTry!==day&&(day>=KD(12,3)||dobj(day).m<=2))try{ autoFre(); }catch(e){} /* 12월 3일이 지난 뒤 맡겨도 다음 날 처리한다(검수 11-06) */
  { const C=G.contract; if(autoOn('sal')&&C&&!C.done){ const y=C.y; /* 1차 12월 5일, 2차 12월 19일. 늦게 맡겨 1차가 늦었으면 1차 7일 뒤(확정 하루 전까지)에 2차(검수 11-07) */
    if(!C.salR1&&day>=dnum(y,12,5))try{ autoSalRound(true); }catch(e){}
    else if(C.salR1&&!C.salR2&&C.salR1!==day&&(day>=dnum(y,12,19)&&day-C.salR1>=7||day>=dnum(y+1,1,4)))try{ autoSalRound(false); }catch(e){} } }
  if(dobj(day).m<=2&&day>=KD(1,5))try{ autoConfirm(); }catch(e){} } /* 확정일이 지난 뒤 위임하거나 대기 사유가 풀려도 다음 날부터 다시 확인 */
/* 받은 트레이드 제안: 맡겼으면 부단장이 바로 거절한다 */
/* 우리 평가(부단장 의견과 같은 기준)로 받는 쪽 가치 - 주는 쪽 가치 */
/* 현금은 트레이드 값 계산과 같은 식(cashVal·cashCost, 16_trade): 받는 현금(cash<0)은 체감 가치, 주는 현금은 그만큼 손해(점검 11-17: 예전 /250로 따로 셈) */
const troCash=(U,c)=>c<0?cashVal(U,-c):-cashCost(U,-c);
function troDiff(off){ const U=team(G.user); const P=id=>G.players[id]; const pk=pkNorm(off.pk); return stackIn(off.give.map(P).filter(Boolean).map(p=>tval(U,p,'in')))-sum(off.get.map(P).filter(Boolean).map(p=>tval(U,p,'out')))+troCash(U,off.cash||0)+sum(pk.get.map(k=>pkVal(U,k)))-sum(pk.give.map(k=>pkVal(U,k))); }
function autoTradeOffer(off){ if(!autoOn('tro'))return false;
  if(G.auto.tro==='good'){ let df=-99; try{ df=troDiff(off); }catch(e){} if(df>=-1){ off.asst=`부단장 1차 검토: 우리 평가로 ${df>=0?'공정 이상':'공정에 가까운(손해 1 이내)'} 제안이라 직접 보시도록 올립니다.`; autoLogAdd(`${tshort(off.from)} 트레이드 제안`,'부단장이 올림','유망한 제안'); return false; } } G.offers=(G.offers||[]).filter(x=>x.id!==off.id); try{ offerMailDone(off.id); }catch(e){} /* 부단장이 거절한 제안의 메일은 미결로 남기지 않는다(PR #4 검수) */ const d=`${off.give.map(id=>G.players[id]?G.players[id].name:'?').join(', ')}을(를) 주고 ${off.get.map(id=>G.players[id]?G.players[id].name:'?').join(', ')}을(를) 원한 제안`; autoLogAdd(`${tshort(off.from)} 트레이드 제안`,'부단장 거절',d); if(!off.blk)mail('부단장',`${tshort(off.from)} 트레이드 제안: 부단장이 거절`,`${tname(off.from)}이(가) ${d}을 보냈고, 맡기신 대로 부단장이 정중히 거절했습니다. 직접 검토하려면 설정 · 권한에서 '받은 트레이드 제안'을 가져오세요.`,{kind:'트레이드'}); /* 매물 제안은 매일 올 수 있어 메일 없이 위임 기록만 */ return true; }
/* 스태프 빼가기: 맡겼으면 바로 정한다 */
function autoRaid(){ if(!autoOn('raid'))return; for(const r of [...(G.stRaid||[])]){ const s=(r.k==='sc'?G.scouts:anaList()).find(x=>x.id===r.id); if(!s)continue;
    if(s.skill>=4&&r.sal>s.sal*1.5){ if(!r.ask){ r.ask=true; autoLogAdd(`${s.name} 영입 제안 대응`,'단장 승인 요청',`상대 제시 연 ${money(r.sal)}(지금 ${money(s.sal)}의 ${Math.round(r.sal/s.sal*100)}%)`); mail('운영팀',`${s.name} 붙잡기: 단장 승인이 필요합니다`,`${tshort(r.tid)}이(가) 연 ${money(r.sal)}을(를) 제시했습니다. 지금 연봉 ${money(s.sal)}의 1.5배를 넘어 운영팀이 바로 맞추지 않았습니다. ${dmd(r.exp)}까지 정해 주세요.`,{kind:'스태프',imp:true,acts:[{l:`맞춰서 붙잡기(연 ${money(r.sal)})`,a:'stKeep',v:s.id+':1'},{l:'조금 올려 설득(+10%)',a:'stKeep',v:s.id+':0'},{l:'보내 주기',a:'stLet',v:s.id}]}); } /* 승인 요청에도 바로 답할 버튼과 기한(검수 11-09za) */ continue; } /* 비용 한도를 넘는 인상은 단장 승인 */
    const m=(s.skill>=4?stKeep(r.id,true):stLeave(r)); const still=(r.k==='sc'?G.scouts:anaList()).some(x=>x.id===r.id), open=(G.stRaid||[]).includes(r); const res=s.skill>=4?(still&&!open?'붙잡음':'붙잡기 실패'):(!still?'보내 줌':'보내기 실패'); /* 실제 결과로 기록(검수 11-07) */ autoLogAdd(`${s.name} 영입 제안 대응`,res,m); mail('운영팀',`${tshort(r.tid)}의 ${s.name} 영입 제안: 운영팀이 ${res}`,`${m}\n맡기신 대로 운영팀이 처리했습니다. 별 4개 이상은 붙잡고, 그 아래는 보냅니다. 지금 연봉의 1.5배를 넘으면 단장 승인을 받습니다.`,{kind:'스태프'}); } }

/* ===== 비서에게 넘기기: 알림마다 '비서에게 넘기기' 버튼. 누르면 그 업무를 앞으로 비서·팀장이 맡고, 지금 걸린 일도 바로 처리한다.
   설정 · 권한 탭에서 언제든 다시 가져올 수 있다 ===== */
const AUTO_WHO={sal:'운영팀',fre:'운영팀',ev:'비서',mgr:'비서',scout:'스카우트팀장',tro:'부단장',raid:'운영팀',schg:'운영팀',sisv:'운영팀',stalk:'운영팀'};
function autoNow(k){ const C=G.contract; const out=[];
  if(k==='sal'&&C&&!C.done&&!C.salR1&&G.day>=dnum(C.y,12,5)){ autoSalRound(true); out.push('연봉 협상 1차 제시를 마쳤습니다'); } /* 1차는 한 번만(예약 처리와 겹치지 않게). 12월 5일 전에 맡기면 그날 제시 */ /* 맡기기를 반복해도 강제 제시는 주 1회 */
  if(k==='fre'&&C&&!C.done){ const d0=C.foreignDrop.length; if(C.freTry!==G.day)autoFre(); /* 하루 한 번만 제시(가져왔다 다시 넘겨도 같은 날 재시도를 다 쓰지 않게, 검수 11-07) */ const cut=C.foreignDrop.slice(d0).map(id=>G.players[id]).filter(Boolean); out.push(`외국인 재계약을 처리했습니다${cut.length?`(결별: ${cut.map(p=>p.name).join(', ')})`:''}`); }
  if(k==='tro'){ for(const o of [...(G.offers||[])])autoTradeOffer(o); out.push('받은 트레이드 제안을 정리했습니다'); }
  if(k==='raid'){ autoRaid(); out.push('스태프 영입 제안에 대응했습니다'); }
  if(AUTO_OPTIN.has(k)){ const r=autoRoutine([k]); out.push(r?'오늘 '+r:'오늘은 처리할 대상이 없습니다'); }
  if(k==='scout'){ out.push(G._scErr?`스카우트 배치는 맡았지만 지금 배치 조정에 실패했습니다(${G._scErr.slice(0,40)}). 다음 달 다시 시도합니다`:'스카우트 배치와 출장을 맡았습니다. 이번 주 출장은 팀장 안대로 보냈고, 다음 주부터 출장 안 메일 없이 팀장이 정합니다'); } /* 실제 결과대로 안내(검수 11-07) */
  if(k==='ev'||k==='mgr'){ let nd=0,nv=0; for(const e of [...(G.evs||[])]){ if(e.done)continue; if((k==='ev'&&!EV_KEY.has(e.k)&&EV_NAME[e.k])||(k==='mgr'&&(e.k==='mreq'||e.k==='mpick'))){ e.deleg=true; evPick(e.id,e.def,true); if(e.void)nv++; else if(e.done)nd++; } } out.push(nd||!nv?`걸려 있던 결정 ${nd}건을 기본안으로 처리했습니다`:''); if(nv)out.push(`${nv}건은 대상이 떠나 효력을 잃어 처리하지 않았습니다`); }
  if(C&&!C.done&&autoOn('sal')&&G.day>=KD(1,5)&&dobj(G.day).m<=2)autoConfirm();
  return out.filter(Boolean).join('. '); }
function handOff(k){ autoSet(k,true); const r=autoNow(k); const a=AUTO_AREAS.find(x=>x[0]===k); return `${a?a[1]:'이 업무'}을(를) ${AUTO_WHO[k]||'비서'}에게 넘겼습니다.${r?' '+r+'.':''} 설정 · 권한에서 다시 가져올 수 있습니다.`; }
function takeBack(k){ autoSet(k,false); const a=AUTO_AREAS.find(x=>x[0]===k); return `${a?a[1]:'이 업무'}을(를) 다시 직접 합니다.`; }
/* 소식함에서 바로 위임(사용자 11-17: '수신함에서 즉석해서 위임하기 버튼', 어려운 사람은 비서를 통해 쉽게).
   소식 하나가 속한 업무 권한을 찾는다: m.auto(연봉·외국인 재계약·트레이드 제안·스태프 빼가기·스카우트 배치) + 결정 종류(감독 요청 → mgr, 일상 결정 → 그 종류만 G.deleg[k]).
   단장 계약·협회 표결(EV_GM)·드래프트·FA·외국인 영입은 넣지 않는다. 핵심 결정(EV_KEY)은 이번 건만 넘길 수 있다 */
const autoFirst=k=>{ const a=AUTO_AREAS.find(x=>x[0]===k); return a?a[2].replace('{55}',typeof dv==='function'?dv(55):'55').split(/(?<=[.다])\s/)[0]:''; };
function mailDelegOpts(m){ if(!m||G.unemp)return []; const L=[]; const acts=m.acts||[];
  for(const k of (m.auto||[])){ if(!AUTO_AREAS.some(x=>x[0]===k)||autoOn(k)||acts.some(a=>a.a==='handOff'&&a.v===k))continue; if(k==='tro'&&m.oid&&!(G.offers||[]).some(o=>o.id===m.oid))continue; const a=AUTO_AREAS.find(x=>x[0]===k); L.push({a:'handOff',v:k,l:`위임하기 · ${a[1]}`,d:(f=>f.startsWith(AUTO_WHO[k]||'비서')?`위임하면 ${f}`:`${AUTO_WHO[k]||'비서'}: ${f}`)(autoFirst(k))}); }
  if(m.kind==='결정'){ const e=(G.evs||[]).find(x=>x.mid===m.id&&!x.done); if(e&&!EV_GM.has(e.k)&&e.opts&&e.opts[e.def]){ const df=`"${e.opts[e.def].l}"`;
      /* 권한 줄에 있는 결정(감독 요청·일상 결정 종류)은 '위임하기' 하나, 권한 줄이 없는 핵심 결정은 '비서에게 맡기기'(이번 건만)(사용자 11-17) */
      if(e.k==='mreq'||e.k==='mpick'){ if(!autoOn('mgr'))L.push({a:'handOff',v:'mgr',l:'위임하기 · 감독 요청',d:`비서: 이번 건은 ${df}(으)로 답하고, 앞으로 감독 요청도 기본안으로 답합니다`}); }
      else if(EV_NAME[e.k]&&!EV_KEY.has(e.k)){ if(!(G.deleg&&G.deleg[e.k]))L.push({a:'evDeleg',v:e.id,l:`위임하기 · ${EV_NAME[e.k]}`,d:`비서: 이번 건은 ${df}(으)로 정하고, 앞으로 ${EV_NAME[e.k]}도 기본안으로 처리합니다`}); }
      if(!L.length)L.push({a:'evHand',v:e.id,l:'비서에게 맡기기',d:`비서: 이번 건만 추천안 ${df}(으)로 정합니다. 같은 종류는 앞으로도 직접 정합니다`}); } }
  return L; }
/* 결정 종류 하나를 앞으로 맡기고 이번 건도 기본안으로(권한 화면 '종류별로 넘긴 일상 결정'과 같은 G.deleg) */
function evDeleg(id){ const e=(G.evs||[]).find(x=>x.id===id); if(!e||e.done)return '이미 정한 일입니다.'; if(EV_GM.has(e.k)||EV_KEY.has(e.k)||!EV_NAME[e.k])return handOffEv(id); G.deleg=G.deleg||{}; G.deleg[e.k]=true; const r=handOffEv(id); return `${r} 앞으로 ${EV_NAME[e.k]}은(는) 비서가 기본안으로 처리합니다. 설정 · 권한에서 다시 가져올 수 있습니다.`; }
/* 확인할 소식을 한 번에: 넘길 수 있는 결정은 이번 건만 비서가 기본안으로(단장 전용 제외). 권한 설정은 바꾸지 않는다 */
function evHandAll(mails){ let n=0; for(const m of mails||[]){ if(m.kind!=='결정')continue; const e=(G.evs||[]).find(x=>x.mid===m.id&&!x.done); if(!e||EV_GM.has(e.k))continue; handOffEv(e.id); if(e.done&&!e.void)n++; } return n; }
/* 결정 한 건만 넘기기(핵심 결정 포함): 비서가 기본안으로 처리 */
function handOffEv(id){ const e=(G.evs||[]).find(x=>x.id===id); if(!e||e.done)return '이미 정한 일입니다.'; if(EV_GM.has(e.k))return '단장 계약과 협회 표결은 단장이 직접 정합니다.'; e.deleg=true; const r=evPick(e.id,e.def,true); if(e.void||!e.done)return r||'처리하지 못했습니다.'; /* 효력을 잃은 결정은 처리했다고 하지 않는다(검수 11-07) */ return `비서가 "${e.opts[e.pick??e.def].l}"(으)로 처리했습니다.${r?' '+r:''}`; /* 처리 중 바뀐 실제 선택으로(검수 11-09z) */ }
/* 스카우트: 맡기지 않았으면 팀장이 달마다 배치 제안을 보낸다(적용은 단장이) */
function scoutSuggest(){ if(G.scoutAuto||G.unemp)return; let P=[]; try{ P=scoutPlan().filter(x=>x.move); }catch(e){ return; } if(!P.length)return; const sig=P.map(x=>x.s.id+x.role+x.key).join('|'); if(G.scSugSig===sig||(G.scSugSig||'').replace(/^[0-9]+#/,'')===sig)return; /* 지난번과 같은 제안이면 다시 보내지 않는다(플레이 리뷰 11-12: 같은 배치 제안이 달마다 와서 시즌 10통). 바뀐 제안만 새 메일 */ G.scSugSig=sig;
  const c=scoutChief(); mail('스카우트팀',`스카우트팀장 배치 제안 ${P.length}명`,`${c?`${c.name} 팀장`:'스카우트팀장'}의 이번 달 배치 제안입니다.\n${P.map(x=>`${x.s.name}: ${scoutSlotTxt(x.role,x.key)} (${x.why})`).join('\n')}\n바꾼 스카우트는 30일 동안 적응 기간입니다.`,{kind:'스카우트',acts:[{l:'제안대로 배치',a:'scoutPlanGo',v:P.map(x=>x.s.id+':'+x.role+':'+x.key).join('|')}]}); if(G.mail[0])G.mail[0].auto=['scout']; }
