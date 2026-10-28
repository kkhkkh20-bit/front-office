/* ===== 병역: 상무·현역 입대, 올림픽 특례 =====
 KBO 실제: 상무(국군체육부대) 복무 1년 6개월, 복무 중 퓨처스리그 출전 가능. 올림픽 동메달 이상은 체육요원 편입.
 게임 규칙: 만 28세가 되는 해까지 입대하지 않으면 현역으로 입대한다. 상무 지원은 9~10월(12월 입대)과 3~4월(6월 입대) 두 번. 올림픽은 2028 LA 이후 4년마다 열린다고 가정. */
const MIL_DAYS=548, SANGMU_SLOTS=14;
const isAway=p=>!!((p.mil&&p.mil.until&&p.mil.until>G.day)||(p.ntAway&&p.ntAway>G.day&&p.ntFrom<=G.day));
const milFree=p=>!p.foreign&&!(p.mil&&(p.mil.done||p.mil.exempt||p.mil.until));
function milInit(p){ if(p.mil!==undefined||p.foreign)return; const a=p.age; const u=u01('mil',p.id);
  p.mil=a>=28?(u<.9?{done:true}:u<.95?{exempt:true}:null):a>=25?(u<.55?{done:true}:u<.6?{exempt:true}:null):a>=22?(u<.2?{done:true}:null):null; }
function milText(p){ if(p.foreign)return '해당 없음'; const m=p.mil; if(!m)return `미필 · ${G.year+Math.max(0,27-p.age)}년까지 입대`; if(m.exempt)return '면제(체육요원)'; if(m.done)return '군필';
  if(m.until>G.day)return `${m.unit} 복무 중 · ${dmd(m.until)} 전역`; if(m.until)return `${m.unit} 입대 예정 · ${dmd(m.from)}`; if(m.app)return `상무 지원 중(${m.app==='dec'?'12월':'6월'} 입대)`; return '미필'; }
function enlist(p,unit,from){ p.mil={unit,from,until:from+MIL_DAYS}; const cn=G.contract&&G.contract.neg&&G.contract.neg[p.id]; if(cn&&cn.st!=='ok'){ cn.st='ok'; cn.mil=true; p.newSal=p.sal; } story(p,`${unit} 입대 (${dmd(from)})`,'mil'); p.e1=false; if(p.team===G.user)addLog(`${p.name} ${unit} 입대 확정 (${dmd(from)} 입대, ${dmd(from+MIL_DAYS)} 전역 예정).`); }
function sangmuApply(id){ const p=G.players[id]; if(!p||p.team!==G.user||!milFree(p))return '대상이 아닙니다.'; if(p.mil&&p.mil.app)return '이미 지원했습니다.'; const w=sangmuWave(); if(!w)return '상무 지원 기간이 아닙니다(3~4월, 9~10월).'; if(p.age>27)return '상무 지원은 27세까지입니다(게임 규칙).';
  p.mil={app:w}; addLog(`${p.name}이(가) 상무에 지원했습니다.`); return ''; }
function sangmuWave(){ const d=G.day; if(d>=KD(9,1)&&d<KD(10,15))return 'dec'; if(d>=KD(3,1)&&d<KD(4,15))return 'jun'; return null; }
function enlistNow(id){ const p=G.players[id]; if(!p||p.team!==G.user||!milFree(p))return '대상이 아닙니다.'; enlist(p,'현역',G.day+14); return ''; }
function milDaily(){ const d=G.day;
  if(d===KD(9,1)||d===KD(3,1)){ const w=d===KD(9,1)?'dec':'jun';
    for(const p of Object.values(G.players)){ if(p.team==null||p.team===G.user||!milFree(p)||p.mil&&p.mil.app)continue; if(p.age>=24&&p.age<=27&&R()<(p.age>=26?.7:.25))p.mil={app:w}; }
    const mine=domestic(G.user).filter(p=>milFree(p)&&p.age>=23&&p.age<=27);
    if(mine.length)mail('운영팀',`상무 지원 기간입니다 (${w==='dec'?'12월':'6월'} 입대)`,`상무(국군체육부대) 야구단 지원을 받습니다. 복무는 1년 6개월이고, 복무 중에도 퓨처스리그에서 뛰며 기량을 유지할 수 있습니다. 현역으로 가면 1년 6개월 동안 야구를 거의 못 해 기량이 떨어집니다.\n\n우리 구단 미필 선수: ${mine.map(p=>`${p.name}(${p.age}세)`).join(', ')}\n\n${p28(mine)}지원은 ${dmd(d+44)}까지입니다.`,{imp:true,kind:'병역',acts:[{l:'병역 관리',a:'go',v:'staff:mil'}]}); }
  if(d===KD(10,15)||d===KD(4,15)){ const w=d===KD(10,15)?'dec':'jun'; const apps=Object.values(G.players).filter(p=>p.mil&&p.mil.app===w);
    const ranked=apps.map(p=>({p,s:ovr(p)+hn('sm'+G.year,p.id)*4+(p.injOut>30?-10:0)})).sort((a,b)=>b.s-a.s); const from=w==='dec'?KD(12,10):KD(6,10);
    const ok=[],no=[]; ranked.forEach((x,i)=>{ if(i<SANGMU_SLOTS){ enlist(x.p,'상무',from); ok.push(x.p);} else { x.p.mil=null; no.push(x.p);} });
    const mo=ok.filter(p=>p.team===G.user), mn=no.filter(p=>p.team===G.user);
    if(mo.length||mn.length)mail('운영팀','상무 합격자 발표',`${mo.length?`합격: ${mo.map(p=>p.name).join(', ')} (${dmd(from)} 입대)`:'합격자 없음'}${mn.length?`\n불합격: ${mn.map(p=>p.name).join(', ')}. 다음 지원 기간에 다시 지원하거나 현역으로 입대해야 합니다.`:''}`,{imp:true,kind:'병역'});
    if(mo.some(p=>ovr(p)>=52))news('선수',`${tshort(G.user)} 주축 ${mo.find(p=>ovr(p)>=52).name} 상무 합격`,`전력 공백은 불가피하지만 1년 6개월 뒤 돌아올 자원입니다.`,-1); }
  for(const p of Object.values(G.players)){ const m=p.mil; if(m&&m.until===d){ p.mil={done:true,unit:m.unit}; story(p,`${m.unit} 전역`,'mil'); if(p.team===G.user)mail('운영팀',`${p.name} 전역`,`${p.name}이(가) ${m.unit} 복무를 마치고 돌아왔습니다. 정식 로스터 인원을 확인해 주세요.`,{kind:'병역',ref:p.id}); } }
  for(const t of G.teams){ if(t.id!==ME()&&rosterN(t.id)>ROSTER_MAX)try{ trimRoster(t.id,ROSTER_MAX); }catch(e){} }
  oly(d); }
function p28(ms){ const u=ms.filter(p=>p.age>=27); return u.length?`올해 안에 입대해야 하는 선수(27세 이상): ${u.map(p=>p.name).join(', ')}. 해를 넘기면 현역으로 입대합니다.\n\n`:''; }
function milNewYear(){ // 해가 바뀌면 28세 이상 미필은 현역 입대
  for(const p of Object.values(G.players)){ milInit(p); if(p.team==null||!milFree(p)||p.mil&&p.mil.app)continue; if(p.team!==G.user&&p.age>=20&&p.age<=24&&ovr(p)<40&&R()<.22){ enlist(p,'현역',dnum(G.year,1,20)); continue; } if(p.age>=28){ enlist(p,'현역',dnum(G.year,1,20)); if(p.team===G.user)mail('운영팀',`${p.name} 현역 입대`,`${p.name}이(가) 입대 연기 한도를 넘겨 현역으로 입대합니다(게임 규칙: 28세). 1년 6개월 뒤 돌아오지만 기량이 떨어질 수 있습니다.`,{imp:true,kind:'병역',ref:p.id}); } } }
/* 2군 월간 리포트: 5~9월 1일 육성팀 보고 */
function futuresReport(){ if(G.unemp)return; const y=G.year; const ps=playersOf(G.user).filter(p=>!p.foreign&&!p.e1); if(!ps.length)return;
  const B=ps.filter(p=>!p.isP).map(p=>({p,h:seasonTotal(p,y,'퓨처스')})).filter(x=>x.h&&x.h.pa>=40).map(x=>({...x,v:bRate(x.h).ops})).sort((a,b)=>b.v-a.v).slice(0,3);
  const P=ps.filter(p=>p.isP).map(p=>({p,h:seasonTotal(p,y,'퓨처스')})).filter(x=>x.h&&x.h.outs>=45).map(x=>({...x,v:pRate(x.h).era})).sort((a,b)=>a.v-b.v).slice(0,3);
  const base=G.fut0&&G.fut0.y===y?G.fut0.m:{}; const up=ps.filter(p=>base[p.id]!=null).map(p=>({p,d:ovr(p)-base[p.id]})).filter(x=>x.d>=1).sort((a,b)=>b.d-a.d).slice(0,3);
  const rk=slotRanks(G.user); const call=ps.filter(p=>healthy(p)&&!p.ys&&!(p.joinY>y)).map(p=>{ const k=pSlot(p); const sl=rk[k]; const worst=sl&&sl.ps&&sl.ps.length?Math.min(...sl.ps.map(q=>ovr(q))):0; return {p,k,gap:ovr(p)-worst}; }).filter(x=>x.gap>=-1).sort((a,b)=>b.gap-a.gap).slice(0,2);
  if(!B.length&&!P.length&&!up.length)return;
  const L=[]; if(B.length)L.push('2군 타격: '+B.map(x=>`${x.p.name}(${posLabel(x.p)}, OPS ${fmt3(x.v)}, ${x.h.pa}타석)`).join(', '));
  if(P.length)L.push('2군 투구: '+P.map(x=>`${x.p.name}(${posLabel(x.p)}, ERA ${x.v.toFixed(2)}, ${ipStr(x.h.outs)}이닝)`).join(', '));
  if(up.length)L.push('올해 눈에 띄게 성장: '+up.map(x=>`${x.p.name}(+${x.d.toFixed(1)})`).join(', '));
  if(call.length)L.push('1군 콜업 후보: '+call.map(x=>`${x.p.name}(${posLabel(x.p)}) — 1군 같은 자리 선수와 비슷하거나 낫습니다`).join(', '));
  mail('육성팀',`${dobj(G.day).m}월 2군 리포트`,`육성팀입니다. 이번 달 2군 현황을 보고드립니다.\n\n${L.join('\n\n')}\n\n1군 기용은 감독 권한입니다. 콜업 후보는 감독에게 건의하거나 출전 기회를 약속하는 면담으로 밀어줄 수 있습니다.`,{kind:'육성',acts:[{l:'2군 연수 관리',a:'goWork',v:'2군연수'}]}); }
/* 올해 시작 시점 능력(성장 표시용)과 매달 팀 성장 기록 */
function ovrSnap(){ if(G.unemp)return; G.ovr0={y:G.year,m:Object.fromEntries(playersOf(G.user).concat(Object.values(G.players).filter(p=>p.team===G.user&&p.joinY>G.year)).map(p=>[p.id,ovr(p)]))}; }
function growSnap(){ if(G.unemp)return; const tid=G.user; const pr=playersOf(tid).filter(p=>p.age<=24&&!p.foreign).map(p=>{ try{ const r=scoutReport(p); return r.ofp??r.cur??ovr(p); }catch(e){ return ovr(p); } }).sort((a,b)=>b-a).slice(0,10); const o=dobj(G.day);
  (G.tgrow=G.tgrow||[]).push({y:o.y,m:o.m,r1:+teamRating(tid).toFixed(2),pot:pr.length?+(pr.reduce((a,b)=>a+b,0)/pr.length).toFixed(2):0,tid}); G.tgrow=G.tgrow.filter(x=>x.tid===tid).slice(-60); }
function milWarn(){ const L=domestic(G.user).filter(p=>{ milInit(p); return milFree(p)&&!(p.mil&&(p.mil.app||p.mil.until))&&p.age>=27; }); if(!L.length)return;
  stop('병역',`해가 바뀌면 현역으로 입대하는 선수(27세 미필): ${L.map(p=>`${p.name}(${posLabel(p)}, 능력 ${dvo(p)})`).join(', ')}. 1월 20일 입대해 1년 6개월 동안 빠집니다. 대체 선수를 미리 구하세요.`,L[0].id); }
/* 올림픽 */
const olyYear=y=>y>=2028&&(y-2028)%4===0;
function olySquad(){ const ps=Object.values(G.players).filter(p=>p.team!=null&&!p.foreign&&!isAway(p)&&healthy(p)&&!(p.joinY>G.year));
  const v=p=>ovr(p)+hn('oly'+G.year,p.id)*2.5; const P=ps.filter(p=>p.isP).sort((a,b)=>v(b)-v(a)).slice(0,12), B=ps.filter(p=>!p.isP).sort((a,b)=>v(b)-v(a)).slice(0,12); return P.concat(B); }
function oly(d){ if(!olyYear(G.year))return; const y=G.year;
  if(d===KD(6,10)){ const sq=olySquad(); G.oly={y,ids:sq.map(p=>p.id)}; const mine=sq.filter(p=>p.team===G.user);
    mail('운영팀',`${y} 올림픽 야구 대표팀 발표`,`KBO 선수 24명이 뽑혔습니다. 우리 구단: ${mine.map(p=>`${p.name}${milFree(p)?'(미필)':''}`).join(', ')||'없음'}.\n\n올림픽은 7월 15~20일 열립니다. 대표 선수는 7월 13일부터 22일까지 팀을 떠납니다. 동메달 이상이면 미필 선수는 체육요원으로 병역 특례를 받습니다.`,{imp:mine.length>0,kind:'병역'});
    for(const p of mine)p.mor=clamp((p.mor??60)+6,0,100); }
  if(G.oly&&G.oly.y===y&&d===KD(7,13))for(const id of G.oly.ids){ const p=G.players[id]; if(p){ p.ntFrom=d; p.ntAway=KD(7,22); p.e1=false; } }
  if(G.oly&&G.oly.y===y&&d===KD(7,21)&&!G.oly.res){ const sq=G.oly.ids.map(id=>G.players[id]).filter(Boolean); const str=avg(sq.map(ovr));
    const pm=clamp(.32+(str-58)*.05,.12,.75), x=R(); const res=x<pm*.3?'금메달':x<pm*.62?'은메달':x<pm?'동메달':'노메달'; G.oly.res=res;
    const ex=res!=='노메달'?sq.filter(p=>milFree(p)):[]; ex.forEach(p=>p.mil={exempt:true});
    const mine=ex.filter(p=>p.team===G.user);
    mail('운영팀',`올림픽 야구 대표팀 ${res}`,`한국 대표팀이 ${res==='노메달'?'메달을 따지 못했습니다':res+'을 땄습니다'}.${ex.length?` 미필 선수 ${ex.length}명이 체육요원으로 병역 특례를 받습니다.`:''}${mine.length?` 우리 구단: ${mine.map(p=>p.name).join(', ')}.`:''}`,{imp:true,kind:'병역'});
    if(mine.length)news('선수',`${mine.map(p=>p.name).join('·')}, 올림픽 메달로 병역 특례`,`${tshort(G.user)}이(가) 군 공백 걱정을 덜었습니다.`,2,{fanW:1.5}); } }

