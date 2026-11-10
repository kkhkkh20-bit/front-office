/* ===== 드래프트 후보 설명: 확인된 기록 · 관찰 의견 · 성장 전망 / 위험 원인 =====
 - 최고 구속은 아마추어 대회 측정값(amVelo) 하나로 모든 화면에 같은 숫자를 쓴다.
 - 관찰 의견(스카우트가 지금 좋게 본 툴)이 기록과 반대면, 그 사실과 근거가 부족하다는 점을 그대로 적는다.
 - 미래는 단정하지 않고 '성장 상한 전망 · 확신도'로, 1군까지 기간도 예상으로 적는다. */
function amVmax(p){ return p.amVelo||veloOf(p); }
function amConflict(p,k){ const h=p.am; if(!h)return null;
  if(p.isP){ const o=h.outs||0; if(o<45)return null; const b9=h.bb*27/o, k9=h.so*27/o;
    if(k==='ctl'&&b9>=5)return `기록은 반대로 볼넷이 많았습니다(9이닝당 ${b9.toFixed(1)}개)`; if(k==='stf'&&k9<6)return `기록은 반대로 삼진이 적었습니다(9이닝당 ${k9.toFixed(1)}개)`; return null; }
  const pa=h.pa||0; if(pa<60)return null; const bk=h.so?h.bb/h.so:h.bb; const avg=h.ab?h.h/h.ab:0;
  if(k==='eye'&&bk<.4)return `기록은 반대로 볼넷이 적었습니다(볼삼비 ${bk.toFixed(2)})`; if(k==='con'&&(avg<.27||h.so/pa>.25))return `기록은 반대로 타율 ${fmt3(avg)} · 삼진 ${h.so}개(${pa}타석)입니다`;
  if(k==='pow'&&h.hr/pa<.012)return `기록은 반대로 홈런이 ${h.hr}개(${pa}타석)뿐입니다`; return null; }
function draftView(p,rp){ rp=rp||scoutReport(p); const cl=draftClaim(p); const obsN=dcObs(p,rp.sc); const conf=DC_CONF(rp.sd||9);
  const h=p.am; let rec='기록 없음';
  if(h){ const nt=amNotes(p)[0]; if(p.isP){ const o=h.outs||0; rec=o?`${ipStr(o)}이닝 ERA ${((h.er||0)*27/o).toFixed(2)} · 탈삼진 ${h.so} · 볼넷 ${h.bb}`:'등판 기록 없음'; } else { const r=bRate(h); rec=`${h.pa}타석 타율 ${fmt3(r.avg)} · OPS ${fmt3(r.ops)} · ${h.hr}홈런 · 볼삼비 ${h.so?(h.bb/h.so).toFixed(2):'-'}`; } if(nt)rec+=`. ${nt}`; }
  let obs; if(!rp.sc&&p.gmSeen!==G.year)obs='담당 스카우트가 없어 직접 본 의견이 없습니다.';
  else if(!obsN)obs='담당 스카우트가 아직 이 선수를 보지 못했습니다(관찰 0회).'; /* 배치 첫날(검수 11-09ze) */
  else { const top=[...(rp.tools||[])].sort((a,b)=>b.cur-a.cur)[0]; const c=top&&amConflict(p,top.k);
    obs=top?(c?`관찰에서는 ${TOOLK[top.k]}이(가) 좋아 보였다는 의견이지만, ${c}. 관찰 ${obsN}회로는 이 차이를 설명할 근거가 부족합니다.`:`${GOOD[top.k]} (관찰 ${obsN}회)`):'관찰 의견 없음'; }
  let fut; if(rp.ofp==null)fut=!obsN?'관찰 전 임시 현재능력 추정입니다. 잠재력은 첫 관찰 이후 판단합니다.':'잠재력은 판단하지 못했습니다(담당 스카우트 없음).';
  else { const grow=(rp.notes||[]).find(n=>/자랄 여지/.test(n)); fut=`성장 상한 전망: ${rp.role} · 확신 ${conf}${rp.eta?` · 1군까지 약 ${rp.eta}년(예상)`:''}${grow?`. ${grow}`:''}${conf==='낮음'?'. 관찰이 적어 이 상한까지 크지 못할 가능성도 큽니다.':''}`; }
  return {rec,obs,fut,conf}; }
/* 위험 원인: 건강 · 평가 불확실 · 긴 육성 · 기술 약점 */
function riskWhy(p,rp){ rp=rp||scoutReport(p); const L=[];
  if(p.amInj||p.inj>.24)L.push(p.amInj?'건강 위험(수술·부상 이력)':'건강 위험(잔부상 체질)');
  if((rp.sd||9)>7)L.push('평가 확신 낮음'); /* 확신도 구간(sdConf: 7 이하 보통)과 같은 경계(검수 11-07) */
  if(rp.eta>=5)L.push('긴 육성 기간');
  const low=[...(rp.tools||[])].filter(t=>!(p.isP?['vit','con','pow','eye','spd','def']:['stf','ctl','sta']).includes(t.k)).sort((a,b)=>a.cur-b.cur)[0]; if(low&&low.cur<40)L.push(`기술 약점(${TOOLK[low.k]})`);
  return L; }
