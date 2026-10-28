/* ===== 전력분석팀: 분석원 고용·역할·효과·월간 보고 ===== */
/* 전력분석·데이터팀: 분석원을 사람으로 뽑아 배치한다(스카우트처럼). 역할 3가지
   상대 전력분석: 상대 타자별 수비 위치·투구 계획 → 실점 억제 / 트래킹 데이터: 장비 운용 → 선수 평가 정확도·랩 성장 / 영상 분석: 상대 투수 공략 → 타격 */
const AROLE={opp:{l:'상대 전력분석',d:'상대 타자별 수비 위치와 투구 계획을 짭니다. 실점이 줄어듭니다.'},trk:{l:'트래킹 데이터',d:'PTS·트랙맨·랩소도 자료를 다룹니다. 다른 구단 선수 평가가 정확해지고 피칭·타격 랩 효과가 커집니다.'},vid:{l:'영상 분석',d:'상대 투수의 버릇과 볼 배합을 분석합니다. 타자들의 공략이 좋아집니다.'}};
const ANA_SAL=[0,30,50,80,120,170], ANA_MAX=6;
const ANA_CAR={opp:['전 프로 포수','전력분석팀 10년차','전 불펜 코치','기록원 출신'],trk:['통계학 석사','데이터 엔지니어 출신','트래킹 장비 회사 출신','바이오메카닉스 연구원'],vid:['방송 중계 PD 출신','전 프로 타자','영상 편집 전문','전 타격 코치']};
function mkAnalyst(skill,role){ role=role||pick(Object.keys(AROLE)); return {id:'a'+Math.floor(R()*1e9),name:genName(),age:ri(26,55),skill,role,sal:ANA_SAL[skill],since:G.day,car:pick(ANA_CAR[role])}; }
function anaList(){ if(!G.analysts){ const lv=G.data&&G.data.lv!=null?G.data.lv:1; G.analysts=[]; const add=(r,k)=>G.analysts.push(Object.assign(mkAnalyst(k,r),{since:-999})); if(lv>=1){ add('opp',lv>=3?4:lv>=2?3:2); add('trk',lv>=3?4:lv>=2?3:2); add('vid',lv>=3?3:2); } } return G.analysts; }
function anaPow(role,tid){ if(tid==null)tid=G.user; if(tid!==G.user||G.unemp){ const v=G.lgStaff?stAnaPow(tid,role):null; return v!=null?v:2+(hn('ap'+role+(G.year>>1),tid)>.4?1:0); }
  const L=anaList().filter(a=>a.role===role).map(a=>a.skill*(G.day-a.since<30?.5:1)).sort((a,b)=>b-a); return (L[0]||0)+(L[1]||0)*.6+(L[2]||0)*.3; } /* 새로 온 분석원은 30일 적응 기간 */
function anaEff(tid){ const o=anaPow('opp',tid), t=anaPow('trk',tid), v=anaPow('vid',tid); return {sdm:1-Math.min(.35,t*.045+v*.012),bab:Math.min(.007,o*.0008),bat:Math.min(.005,v*.0006),rep:clamp(Math.floor((o+v+t)/3),0,3)}; }
function dataLv(tid){ return anaEff(tid).rep; }
function anaSal(){ return sum(anaList().map(a=>a.sal)); }
function anaMarket(){ const mk=G.year*100+dobj(G.day).m; if(!G.amarket||G.amarketM!==mk){ const keep=(G.amarket||[]).filter(()=>R()<.4); G.amarket=keep; while(G.amarket.length<12){ const sk=R()<.05?5:R()<.17?4:R()<.42?3:R()<.75?2:1; G.amarket.push(mkAnalyst(sk)); } G.amarketM=mk; } return G.amarket; }
function hireAna(id){ const a=anaMarket().find(x=>x.id===id); if(!a)return '후보가 없습니다.'; if(anaList().length>=ANA_MAX)return `분석원은 ${ANA_MAX}명까지입니다.`; a.since=G.day; G.analysts.push(a); G.amarket=G.amarket.filter(x=>x.id!==id); addLog(`${AROLE[a.role].l} 분석원 ${a.name}(능력 ${a.skill})을(를) 연 ${money(a.sal)}에 채용했습니다.`); return ''; }
function fireAna(id){ const a=anaList().find(x=>x.id===id); if(!a)return ''; G.analysts=G.analysts.filter(x=>x.id!==id); addLog(`분석원 ${a.name}과(와) 계약을 정리했습니다.`); return ''; }
function setAnaRole(id,role){ const a=anaList().find(x=>x.id===id); if(!a||!AROLE[role])return ''; if(a.role!==role){ a.role=role; a.since=G.day; } return ''; } /* 역할을 바꾸면 다시 30일 적응 */
function dataReport(m){ if(G.unemp||!anaList().length)return; const lv=dataLv(G.user); const T=G.teams.map(t=>({tid:t.id,b:Object.assign({},ZB),p:Object.assign({},ZP)}));
  for(const p of Object.values(G.players)) for(const h of p.hist){ if(h.y!==G.year||h.lvl!=='1군'||h.t==null||!T[h.t])continue; const X=p.isP?T[h.t].p:T[h.t].b; for(const k in X)X[k]+=h[k]||0; }
  for(const t of T){ t.ops=bRate(t.b).ops; t.era=t.p.outs?t.p.er*27/t.p.outs:0; const bip=(t.p.outs-(t.p.so||0))+(t.p.h-(t.p.hr||0)); t.der=bip>0?(t.p.outs-(t.p.so||0))/bip:null; } const me=T.find(x=>x.tid===G.user); if(!me)return;
  const rk=(k,asc)=>{ const L=[...T].sort((a,b)=>asc?a[k]-b[k]:b[k]-a[k]); return L.findIndex(x=>x.tid===G.user)+1; };
  const lines=[`팀 타격 OPS ${fmt3(me.ops)} (리그 ${rk('ops')}위) · 팀 평균자책점 ${me.era.toFixed(2)} (${rk('era',true)}위)`];
  if(me.der!=null)lines.push(`수비 타구 처리율 ${fmt3(me.der)} (${rk('der')}위)`);
  try{ const SR=slotRanks(G.user); const ks=PSLOTS.filter(k=>k!=='DH'); const w=[...ks].sort((a,b)=>SR[b].rank-SR[a].rank).slice(0,lv>=2?2:1), st=[...ks].sort((a,b)=>SR[a].rank-SR[b].rank)[0]; lines.push(`가장 약한 자리: ${w.map(k=>`${SLOTK[k]}(리그 ${SR[k].rank}위)`).join(', ')} · 가장 강한 자리: ${SLOTK[st]}(${SR[st].rank}위)`); }catch(e){}
  if(lv>=2){ const ps=domestic(G.user).concat(foreignOf(G.user)).map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h&&(x.p.isP?x.h.outs>=45:x.h.pa>=60));
    const unl=ps.filter(x=>!x.p.isP).map(x=>({p:x.p,d:bRate(x.h).ops-(.62+ (ovr(x.p)-40)*.006)})).sort((a,b)=>a.d-b.d);
    if(unl.length){ const a=unl[0], b=unl[unl.length-1]; lines.push(`능력에 비해 기록이 낮은 타자: ${a.p.name}(OPS ${fmt3(bRate(seasonTotal(a.p,G.year,'1군')).ops)}) · 능력 이상으로 잘하는 타자: ${b.p.name}`); } }
  if(lv>=3){ const d=G.sea&&G.sea.rec&&G.sea.rec[G.user]; if(d){ const st=standingsNow(); const i=st.findIndex(x=>x.tid===G.user); const po=(()=>{ try{ const o=playoffOdds(); const q=o&&o.find(x=>x.tid===G.user); return q?Math.round(q.ps*100):null; }catch(e){ return null; } })(); if(po!=null)lines.push(`데이터 랩 시뮬레이션: 가을야구 진출 확률 ${po}%`); } }
  mail('전력분석팀',`${m}월 전력 분석 보고`,lines.join('\n')+`\n\n분석원 ${anaList().length}명 기준 보고입니다. 상대 전력분석·영상 분석 인력이 늘수록 보고가 자세해집니다.`,{kind:'분석',acts:[{l:'전력분석',a:'go',v:'staff:data'}]}); }
