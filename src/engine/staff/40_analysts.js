/* ===== 전력분석팀: 분석원 고용·역할·효과·월간 보고 ===== */
/* 전력분석·데이터팀: 분석원을 사람으로 뽑아 배치한다(스카우트처럼). 역할 3가지
   상대 전력분석: 상대 타자별 수비 위치·투구 계획 → 실점 억제 / 트래킹 데이터: 장비 운용 → 선수 평가 정확도·랩 성장 / 영상 분석: 상대 투수 공략 → 타격 */
const AROLE={opp:{l:'상대 전력분석',d:'상대 타자별 수비 위치와 투구 계획을 짭니다. 실점이 줄어듭니다.'},trk:{l:'트래킹 데이터',d:'PTS·트랙맨·랩소도 자료를 다룹니다. 우리·다른 구단 선수의 잠재력 추정이 정확해지고 피칭·타격 랩 효과가 커집니다.'},vid:{l:'영상 분석',d:'상대 투수의 버릇과 볼 배합을 분석합니다. 타자들의 공략이 좋아집니다.'}};
/* 역할별 상위 3명의 100/60/30% 가중치는 그대로, 세 역할을 갖출 수 있는 총 정원. */
const ANA_SAL=[0,30,50,80,120,170], ANA_MAX=9;
const ANA_CAR={opp:['전 프로 포수','전력분석팀 10년차','전 불펜 코치','기록원 출신'],trk:['통계학 석사','데이터 엔지니어 출신','트래킹 장비 회사 출신','바이오메카닉스 연구원'],vid:['방송 중계 PD 출신','전 프로 타자','영상 편집 전문','전 타격 코치']};
function mkAnalyst(skill,role){ role=role||pick(Object.keys(AROLE)); return staffAttach({id:'a'+Math.floor(R()*1e9),name:genName(),age:ri(26,55),skill,role,sal:ANA_SAL[skill],since:G.day,car:pick(ANA_CAR[role])},'analyst'); }
function anaList(){ if(!G.analysts){ const lv=G.data&&G.data.lv!=null?G.data.lv:1; G.analysts=[]; const add=(r,k)=>G.analysts.push(Object.assign(mkAnalyst(k,r),{since:-999})); if(lv>=1){ add('opp',lv>=3?4:lv>=2?3:2); add('trk',lv>=3?4:lv>=2?3:2); add('vid',lv>=3?3:2); } } return G.analysts; }
const anaNow=a=>a.skill*(G.day-(a.since??-999)<30?.5:1); /* 새로 온 분석원은 30일 적응 기간(사람에게 붙는 상태: AI·유저 구단 같은 계산, 이직해도 재직 기간 인정) */
function anaPow(role,tid){ if(tid==null)tid=G.user; if(tid!==G.user||G.unemp){ const v=G.lgStaff?stAnaPow(tid,role):null; return v!=null?v:2+(hn('ap'+role+(G.year>>1),tid)>.4?1:0); }
  const L=anaList().filter(a=>a.role===role).map(anaNow).sort((a,b)=>b-a); return (L[0]||0)+(L[1]||0)*.6+(L[2]||0)*.3; } /* 새로 온 분석원은 30일 적응 기간 */
function anaEff(tid){if(tid==null)tid=G.user; const o=anaPow('opp',tid)*anaRoleQuality(tid,'opp'), t=anaPow('trk',tid)*anaRoleQuality(tid,'trk'), v=anaPow('vid',tid)*anaRoleQuality(tid,'vid'); return {sdm:1-Math.min(.35,t*.045+v*.012),bab:Math.min(.007,o*.0008),bat:Math.min(.005,v*.0006),rep:clamp(Math.floor((anaPow('opp',tid)+anaPow('trk',tid)+anaPow('vid',tid))/3),0,3)}; }
function dataLv(tid){ return anaEff(tid).rep; }
function anaSal(){ return sum(anaList().map(a=>a.sal)); }
function anaMarket(){ const mk=G.year*100+dobj(G.day).m; if(!G.amarket||G.amarketM!==mk){ const keep=(G.amarket||[]).filter(s=>(s.bid&&s.bid.exp>=G.day)||R()<.4); /* 재제안 기한이 남은 후보는 월초 교체에서 빼지 않는다 */ G.amarket=keep; while(G.amarket.length<12){ const sk=R()<.05?5:R()<.17?4:R()<.42?3:R()<.75?2:1; G.amarket.push(mkAnalyst(sk)); } G.amarketM=mk; } return G.amarket; }
function hireAna(id){ const a=anaMarket().find(x=>x.id===id); if(!a)return '후보가 없습니다.'; if(anaList().length>ANA_MAX)return `분석원 정원(${ANA_MAX}명)을 넘었습니다. 먼저 한 명을 내보내세요.`; a.since=G.day; G.analysts.push(a); G.amarket=G.amarket.filter(x=>x.id!==id); staffHistory('analyst',a,'영입',G.user,`연 ${money(a.sal)}`); addLog(`${AROLE[a.role].l} 분석원 ${a.name}(능력 ${a.skill})을(를) 연 ${money(a.sal)}에 채용했습니다.`); return ''; }
function fireAna(id){ const a=anaList().find(x=>x.id===id); if(!a)return ''; G.analysts=G.analysts.filter(x=>x.id!==id); staffHistory('analyst',a,'계약 종료',G.user,'단장 결정'); addLog(`분석원 ${a.name}과(와) 계약을 정리했습니다.`); return ''; }
function setAnaRole(id,role){ const a=anaList().find(x=>x.id===id); if(!a||!AROLE[role])return ''; if(a.role!==role){staffAttach(a,'analyst'); a.role=role; a.since=G.day; } return ''; } /* 역할을 바꾸면 다시 30일 적응 */
function dataReport(m){ if(G.unemp||!anaList().length)return; const lv=dataLv(G.user); const T=G.teams.map(t=>({tid:t.id,b:Object.assign({},ZB),p:Object.assign({},ZP,{roe:0})}));
  for(const z of y1Rows(G.year)){ const h=z.h; if(h.t==null||!T[h.t])continue; const X=z.isP?T[h.t].p:T[h.t].b; for(const k in X)X[k]+=h[k]||0; } /* 떠난 선수가 이미 쌓은 기록도 그 구단 기록으로 */
  for(const t of T){ t.ops=bRate(t.b).ops; t.era=t.p.outs?t.p.er*27/t.p.outs:null; if(!t.b.pa)t.ops=null; /* 기록이 없으면 0으로 채우지 않고 순위에서 뺀다(검수 11-06) */ const bip=(t.p.bf||0)-(t.p.bb||0)-(t.p.hbp||0)-(t.p.so||0)-(t.p.hr||0); /* 인플레이 타구 수는 상대 타자 수에서 센다(도루 실패 같은 주루 아웃을 처리 타구로 세지 않게, 검수 11-08) */ t.der=bip>0?1-((t.p.h-(t.p.hr||0))+(t.p.roe||0))/bip:null; /* 실책 출루도 처리 못 한 타구(검수 11-07) */ } const me=T.find(x=>x.tid===G.user); if(!me)return;
  const rk=(k,asc)=>{ const v=me[k], E=1e-9; return 1+T.filter(x=>x[k]!=null&&(asc?x[k]<v-E:x[k]>v+E)).length; }; /* 완전 동률은 같은 순위(검수 11-08) */
  const lines=[`팀 타격 OPS ${me.ops==null?'기록 없음':`${fmt3(me.ops)} (리그 ${rk('ops')}위)`} · 팀 평균자책점 ${me.era==null?'기록 없음':`${me.era.toFixed(2)} (${rk('era',true)}위)`}`];
  if(me.der!=null)lines.push(`수비 타구 처리율 ${fmt3(me.der)} (${rk('der')}위)`);
  try{ const SR=slotRanks(G.user); const ks=PSLOTS.filter(k=>k!=='DH'); const w=[...ks].sort((a,b)=>SR[b].rank-SR[a].rank).slice(0,lv>=2?2:1), st=[...ks].sort((a,b)=>SR[a].rank-SR[b].rank)[0]; lines.push(`가장 약한 자리: ${w.map(k=>`${SLOTK[k]}(리그 ${SR[k].rank}위)`).join(', ')} · 가장 강한 자리: ${SLOTK[st]}(${SR[st].rank}위)`); }catch(e){}
  if(lv>=2){ const ps=domestic(G.user).concat(foreignOf(G.user)).map(p=>({p,h:seasonTotalT(p,G.year,'1군',G.user)})) /* 우리 팀에서 쌓은 기록만(검수 11-08: 영입 직후 이전 구단 기록으로 호평) */.filter(x=>x.h&&(x.p.isP?x.h.outs>=45:x.h.pa>=60));
    const unl=ps.filter(x=>!x.p.isP).map(x=>({p:x.p,d:bRate(x.h).ops-(.62+ (ovr(x.p)-40)*.006)})).sort((a,b)=>a.d-b.d);
    { const a=unl[0]&&unl[0].d<-.03?unl[0]:null, b=unl.length&&unl[unl.length-1].d>.03?unl[unl.length-1]:null; /* 한 선수가 양쪽에 동시에 들어가지 않게: 기대치보다 확실히 낮거나 높은 선수만(검수 11-07) */ const t=[a?`능력에 비해 기록이 낮은 타자: ${a.p.name}(OPS ${fmt3(bRate(seasonTotalT(a.p,G.year,'1군',G.user)).ops)})`:'',b&&b!==a?`능력 이상으로 잘하는 타자: ${b.p.name}`:''].filter(Boolean); if(t.length)lines.push(t.join(' · ')); } }
  if(lv>=3){ const d=G.sea&&G.sea.rec&&G.sea.rec[G.user]; if(d){ const st=standingsNow(); const i=st.findIndex(x=>x.tid===G.user); const po=(()=>{ try{ const o=playoffOdds(); const q=o&&o.find(x=>x.tid===G.user); return q?Math.round(q.ps*100):null; }catch(e){ return null; } })(); if(po!=null)lines.push(`데이터 랩 시뮬레이션: 가을야구 진출 확률 ${po}%`); } }
  try{ const D=dataLines(); if(D.length)lines.push('',...D); }catch(e){}
  const rm=mail('전력분석팀',`${m}월 전력 분석 보고`,lines.join('\n')+`\n\n분석원 ${anaList().length}명 기준 보고입니다. 상대 전력분석·영상 분석 인력이 늘수록 보고가 자세해집니다.`,{kind:'분석',acts:[{l:'통계에서 보기',a:'go',v:'league:stat'},{l:'전력분석',a:'go',v:'staff:data'}]}); if(rm&&rm.id&&!rm.rep)try{ rm.rep=trpSnap(rm.day); }catch(e){} }

/* 정원 초과(먼저 영입, 나중에 정리): 7일 안에 내보낼 사람을 고르지 않으면 실력이 가장 낮은 사람과 계약을 끝낸다(커뮤니티 11-12) */
function stOverCheck(){ if(G.unemp)return; G.stOver=G.stOver||{};
  for(const k of ['sc','an']){ const L=k==='sc'?(G.scouts||[]):anaList(), cap=k==='sc'?scoutMax():ANA_MAX, nm=k==='sc'?'스카우트':'전력분석원';
    if(L.length<=cap){ delete G.stOver[k]; continue; }
    if(G.stOver[k]==null){ G.stOver[k]=G.day; mail('운영팀',`${nm} 정원 초과`,`${nm}이(가) ${L.length}명으로 정원 ${cap}명을 넘었습니다. 7일 안에 스태프 화면에서 내보낼 사람을 고르세요. 고르지 않으면 실력이 가장 낮은 사람과 계약을 끝냅니다.`,{kind:'스태프',imp:true}); continue; }
    if(G.day>=G.stOver[k]+7){ const lo=[...L].sort((a,b)=>(a.skill||0)-(b.skill||0)||(a.since||0)-(b.since||0)).slice(0,L.length-cap); for(const x of lo){ try{ k==='sc'?scoutFire(x.id):fireAna(x.id); }catch(e){} } delete G.stOver[k]; if(lo.length)note('스태프',`${nm} 정원 정리: ${lo.map(x=>x.name).join(', ')}와(과) 계약을 끝냈습니다.`); } } }
