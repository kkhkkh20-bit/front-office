/* ===== 스카우트 1단계: 관찰은 하나로, 1학년부터 (2026-11-17) =====
   - 관찰 횟수는 구단마다 하나(x.amObs[구단]). 스카우트 학교 방문, 경기장 관찰(amWatchDaily), 단장 대회 관전이 모두 여기에 쌓인다.
     저학년(G.amU) 때 쌓인 관찰은 졸업 학년 후보가 되어도 그대로 이어진다(amMat). 화면의 '관찰 n회'는 모두 obsCount 하나를 쓴다.
   - 관심 선수 우선순위: 집중·보통·참고. 집중은 학교 방문이 가능한 아마추어 담당 수 × 4명까지. 다른 구단도 같은 상한, 같은 규칙.
   - 아마추어 스카우트는 매주 수요일 담당 지역 학교 한 곳을 찾는다(모든 구단). 집중 선수가 많은 학교, 관심 학교, 후원 학교를 먼저 간다.
     시즌(3~8월)에는 한 주 두 곳. 최근 4주 안에 간 학교는 제외한다. 방문하면 그 학교 1~3학년이 모두 1회씩 보이고, 관심 선수는 우선순위만큼 더 본다(집중 +0.5, 보통 +0.25). 한 학교는 4주에 한 번만 찾는다.
   - 우리 구단은 방문마다 짧은 보고 한 줄(날짜·스카우트·본 것)을 남긴다(선수당 최근 6줄). 평가 등급이 바뀌면 그 줄에 적는다(검수).
   - 좋아하는 툴 버릇: 우리와 AI 구단 모두, 그 후보 지역을 맡은 스카우트의 버릇이 같은 식으로 붙는다(clubLean). */
const OBS_MAX=60, OBS_W=[.5,1,1.5], OBS_SP=[.1,.2,.3], OBS_VB=[0,.25,.5], OBS_PRI_L=['참고','보통','집중'], OBS_CAP_K=4, OBS_GAP=28;
const obsRaw=(x,tid)=>(x&&x.amObs&&x.amObs[tid??G.user])||0;
/* 화면·판단이 함께 쓰는 관찰 횟수: 방문·경기장 관찰 + (우리 구단이면) 단장 직접 관전 */
function obsCount(x,tid){ tid=tid??G.user; return Math.round((obsRaw(x,tid)+(tid===G.user&&x&&x.prospect?gmObsCount(x):0))*100)/100; }
function obsAdd(x,tid,w){ if(!x||!(w>0))return; if(!G.obsLogV)obsLogMigrate(); x.amObs=x.amObs||{}; x.amObs[tid]=Math.min(OBS_MAX,Math.round(((x.amObs[tid]||0)+w)*100)/100); (x.obsDT=x.obsDT||{})[tid]=G.day; if(tid===G.user){x.obsD=G.day;x.obsDTid=tid;} }
/* 관찰 횟수가 오차에 주는 배수(모든 구단 같은 식): 0회 1.2배 → 6회 이상 0.9배 */
const obsF=n=>1.2-.3*Math.min(1,(n||0)/6);
/* 마지막으로 본 날(우리 구단): 방문 보고 줄 또는 관찰 기록 날짜 */
function obsLegacyOwner(x){if(x?.obsDTid!=null)return x.obsDTid;const T=Object.keys(x?.amObs||{}).filter(k=>x.amObs[k]>0);return T.length===1?+T[0]:null;}
function obsLogList(x,tid=G.user){const id=typeof x==='object'?x?.id:x,L=G.obsLogT?.[tid]?.[id];if(L)return L;if(G.obsLogV)return [];const o=typeof x==='object'?x:G.players?.[id]||G.amU?.L?.[id];return ((G.obsLog||{})[id]||[]).filter(r=>r[4]!=null?r[4]===tid:(G.obsLogTid??obsLegacyOwner(o))===tid);}
function obsLast(x,tid=G.user){if(!x)return null;const L=obsLogList(x,tid),D=L.map(r=>r[0]).filter(Number.isFinite),b=x.obsDT?.[tid]??(!G.obsLogV&&obsLegacyOwner(x)===tid?x.obsD:null);if(Number.isFinite(b))D.push(b);return D.length?Math.max(...D):null;}
/* 옛 단일 보고는 구단 근거가 명확할 때만 배분한다. 불명확한 원본은 별도 보관하고 다른 구단에 보여 주지 않는다. */
function obsLogMigrate(){const B=G.obsLogT=G.obsLogT||{},U=G.amU?.L||{},find=id=>G.players?.[id]||U[id],oldOwner=G.obsLogV?null:G.obsLogTid;
  if(!G.obsLogV){for(const [id,L] of Object.entries(G.obsLog||{}))for(const r of L){const x=find(id),tid=r[4]??oldOwner??obsLegacyOwner(x),R=tid==null?(G.obsLogUnknown=G.obsLogUnknown||{}):(B[tid]=B[tid]||{}),A=R[id]=R[id]||[],q=r.slice();if(tid!=null)q[4]=tid;if(!A.some(z=>JSON.stringify(z)===JSON.stringify(q)))A.push(q);A.sort((a,b)=>a[0]-b[0]);if(A.length>6)A.splice(0,A.length-6);}G.obsLogV=1;}
  for(const x of [...Object.values(G.players||{}),...Object.values(U)])if(x.obsD!=null){const tid=x.obsDTid??oldOwner??obsLegacyOwner(x);if(tid!=null)(x.obsDT=x.obsDT||{})[tid]=Math.max(x.obsDT?.[tid]??-Infinity,x.obsD);}
  for(const [tid,Lg] of Object.entries(B))for(const [id,L] of Object.entries(Lg)){const x=find(id);if(!x)continue;const D=L.map(r=>r[0]).filter(Number.isFinite);if(D.length)(x.obsDT=x.obsDT||{})[tid]=Math.max(x.obsDT?.[tid]??-Infinity,...D);}
  G.obsLog=B[G.user]=B[G.user]||{};G.obsLogTid=G.user;return B;}
function obsLogWrite(x){if(!G.obsLogV)obsLogMigrate();const B=G.obsLogT=G.obsLogT||{};G.obsLog=B[G.user]=B[G.user]||{};G.obsLogTid=G.user;return G.obsLog[x.id]=G.obsLog[x.id]||[];}
/* ---------- 우선순위 ---------- */
function obsPriL(tid){ G.amPr=G.amPr||{}; return G.amPr[tid]=G.amPr[tid]||{}; }
/* 관심 집합: 아마추어 관심 명단 + (우리 구단) 드래프트 보드 */
function obsFollowSet(tid){ return new Set(amFollowIds(tid)); }
function obsFocusIds(tid){ const P=G.amPr?.[tid]||{}; return [...obsFollowSet(tid)].filter(id=>P[id]===2); }
function obsPri(id,tid){ tid=tid??G.user; const F=obsFollowSet(tid),P=G.amPr?.[tid]||{}; if(!F.has(id))return -1;
  if(P[id]===2){ const L=obsFocusIds(tid),cap=obsCap(tid); if(L.length>cap)return tid===G.user&&!G.unemp?1:(L.indexOf(id)<cap?2:1); } return P[id]??1; }
function obsScN(tid){ return clubAmScouts(tid).filter(s=>obsSchoolsOf(s.region).length>0).length; }
function obsCap(tid){ return obsScN(tid??G.user)*OBS_CAP_K; }
function obsFocusN(tid){ tid=tid??G.user; const n=obsFocusIds(tid).length,cap=obsCap(tid); return n>cap&&tid===G.user&&!G.unemp?0:Math.min(n,cap); }
function obsFocusPending(tid){ const saved=G.obsFocusPick?.[tid]; if(saved)return saved; const ids=obsFocusIds(tid),cap=obsCap(tid); return tid===G.user&&!G.unemp&&ids.length>cap?{ids,cap}:null; }
/* 담당 감소 때 우리 구단의 선택을 대신하지 않는다. 모두 보통으로 두고 다시 고르게 한다. */
function obsFocusFix(tid){ const L=obsFocusIds(tid),cap=obsCap(tid); if(L.length<=cap)return; const P=obsPriL(tid),human=tid===G.user&&!G.unemp;
  L.forEach((id,i)=>{if(human||i>=cap)P[id]=1;}); if(human)(G.obsFocusPick=G.obsFocusPick||{})[tid]={ids:L,cap}; }
function obsWatchFix(){ const ids=new Set([...(G.teams||[]).map(t=>t.id),...Object.keys(G.amFw||{}).map(Number),...Object.keys(G.amPr||{}).map(Number),G.user]); for(const tid of ids)if(tid!=null){amFollowFix(tid);obsFocusFix(tid);} }
function obsSetPri(id,v,tid){ tid=tid??G.user; amFollowFix(tid); obsFocusFix(tid); v=clamp(+v,0,2); if(v===2&&obsPri(id,tid)!==2&&obsFocusN(tid)>=obsCap(tid))return `집중 관찰은 ${obsCap(tid)}명까지입니다(아마추어 담당 ${obsScN(tid)}명 × ${OBS_CAP_K}). 다른 선수를 보통으로 내리세요.`;
  if(!amFollowing(tid,id))amFollow(id,true,tid); obsPriL(tid)[id]=v; if(G.obsFocusPick?.[tid]&&obsFocusN(tid)>=obsCap(tid))delete G.obsFocusPick[tid]; return ''; }
/* ---------- 학교 방문(매주 수요일, 모든 구단 같은 규칙) ---------- */
function obsSchoolsOf(reg){ return AREA.filter(a=>a.reg===reg).flatMap(a=>a.hs.concat(a.un)); }
function obsBySchool(){ const by={}; for(const e of Object.values(amPipe().L))(by[e.s]=by[e.s]||[]).push(e);
  for(const id of G.draftClass||[]){ const p=G.players[id]; if(p&&p.prospect&&p.team==null&&p.school&&!p.ovsRet)(by[p.school]=by[p.school]||[]).push(p); } return by; }
const obsSpon=(n,tid)=>{ const S=(G.schools||{})[n]; return !!S&&schGave(S,tid); };
function clubAmScouts(tid){ return ((tid===G.user&&!G.unemp?G.scouts:G.lgStaff&&G.lgStaff[tid]&&G.lgStaff[tid].sc)||[]).filter(s=>(s.role||'am')==='am'&&s.region); }
function obsVisitWeek(day){ if(!amOn()||!G.amU||!G.teams)return 0; const by=obsBySchool(); const win=(m=>m===12||m<=2)(dobj(day).m); let n=0; G.obsVis=G.obsVis||{};
  for(const t of G.teams){ const tid=t.id; if(tid===G.user&&G.unemp)continue; const scs=clubAmScouts(tid).filter(s=>{ const k=tripOf(s); return k==='sch'||k==='camp'; }); if(!scs.length)continue; /* 대회 출장 중인 스카우트는 학교 방문을 쉰다(스카우트 2단계) */
    obsFocusFix(tid); const F=obsFollowSet(tid), P=obsPriL(tid), V=G.obsVis[tid]=G.obsVis[tid]||{}, used=new Set();
    const mo=dobj(day).m, nV=mo>=3&&mo<=8?2:1; /* 시즌(3~8월)에는 한 주에 두 곳, 겨울 전지훈련 출장도 두 곳 */
    for(let v=0;v<2;v++)for(const s of scs){ if(v>=nV&&tripOf(s)!=='camp')continue; const L=obsSchoolsOf(s.region).filter(x=>!used.has(x)&&(V[x]==null||day-V[x]>=OBS_GAP)); if(!L.length)continue;
      const sc=x=>{ let v=0; for(const y of by[x]||[])v+=F.has(y.id)?OBS_W[P[y.id]??1]*1.2:.04; for(const id of F)if(typeof id==='string'&&id.startsWith('f'+x+'#'))v+=OBS_W[P[id]??1]*1.2; /* 관심 부원(13b_am_depth) */ if(F.has('s:'+x))v+=1; if(obsSpon(x,tid))v+=.8; if(V[x]!=null&&day-V[x]<OBS_GAP)v-=50; return v+u01('scv'+day+':'+tid+':'+s.id,x)*1.5; };
      const best=L.map(x=>[x,sc(x)]).sort((a,b)=>b[1]-a[1])[0][0]; used.add(best); V[best]=day; n++;
      const k=obsSpon(best,tid)?1.25:1; /* 후원 학교는 훈련장 문이 더 열려 있다 */
      amFVisit(tid,best,k); for(const id of F)if(typeof id==='string'&&id.startsWith('f'+best+'#')){ const O=amFS().ob[id]||(amFS().ob[id]={}); O[tid]=Math.round(((O[tid]||0)+OBS_VB[P[id]??1]*k)*100)/100; } /* 부원: 학교 방문 수로 관찰(모든 구단 같은 규칙) */
      for(const y of by[best]||[]){ const f=F.has(y.id); obsAdd(y,tid,(1+(f?OBS_VB[P[y.id]??1]:0))*k); obsByAdd(y,tid,s.id); if(tid===G.user&&(f||y.prospect))obsLogAdd(y,s,best,win,day); }
      const S=(G.schools||{})[best]; if(S)schAdd(S,.5+(effSkill(s)||1)*.15,tid); } }
  try{ _dcc=null; }catch(e){} return n; }
/* ---------- 방문 보고 한 줄(우리 구단) ---------- */
const OBS_UP={con:'맞히는 능력이 좋습니다',pow:'타구에 힘이 있습니다',eye:'공을 잘 고릅니다',spd:'발이 빠릅니다',def:'수비가 안정적입니다',stf:'공에 힘이 있습니다',ctl:'제구가 됩니다',sta:'오래 던집니다'};
const OBS_DN={con:'변화구 대처가 약합니다',pow:'장타력은 아직입니다',eye:'유인구에 쉽게 나갑니다',spd:'발은 느린 편입니다',def:'수비가 불안합니다',stf:'구위는 평범합니다',ctl:'제구가 흔들립니다',sta:'투구 수가 늘면 힘이 떨어집니다'};
function obsEst(x,s,tid=G.user){ if(s)return obsPersonEst(x,tid,s); if(x.prospect){ const r=scoutReport(x); return {v:r.ofp??(r.cur+6),sd:r.sd>=50?SCOUT_SD[0]:r.sd}; } return amEstU(x,tid); }
function obsTierI(v){ return AM_TIERS.findIndex(t=>v>=t[0]); }
function obsSeenTxt(x,win,day,s){ const isP=!!(x.prospect?x.isP:x.P), R0=x.prospect?(x.amR||x.r):x.r, est=obsEst(x,s), gr=x.prospect?(x.college?4:3):amGrade(x,G.year);
  const ks=isP?['stf','ctl','sta']:['con','pow','eye','spd','def']; const seen=ks.map(k=>({k,v:(R0[k]||0)+hn('obt'+k+day,x.id)*est.sd*.6})).sort((a,b)=>b.v-a.v);
  const L=[`${x.prospect&&x.college||x.c?'대':'고'}${gr} ${win?'동계훈련':'훈련·연습경기'}`];
  if(isP){ const v=amVeloTop(x); if(v!=null)L.push(`직구 최고 ${Math.round(v-Math.abs(hn('obv'+day,x.id))*2.2)}km 측정`); }
  L.push(OBS_UP[seen[0].k]); if(seen[seen.length-1].v<seen[0].v-6)L.push(OBS_DN[seen[seen.length-1].k]);
  return {t:L.join(' · '),ti:obsTierI(est.v)}; }
function obsLogAdd(x,s,n,win,day){ const L=obsLogWrite(x); const o=obsSeenTxt(x,win,day,s);
  const prev=L.length?L[L.length-1][3]:null; const ch=prev!=null&&prev!==o.ti?` · 평가 ${prev>o.ti?'상향':'하향'}(${AM_TIERS[prev][1]} → ${AM_TIERS[o.ti][1]})`:'';
  L.push([day,s.name,o.t+ch,o.ti,G.user,s.id]); if(L.length>6)L.splice(0,L.length-6); }
/* 졸업·지명으로 사라진 선수의 보고는 지운다(저장 크기) */
function obsLogClean(){obsLogMigrate();const U=G.amU?.L||{};for(const Lg of [...Object.values(G.obsLogT||{}),G.obsLogUnknown||{}])for(const k in Lg){const p=G.players[k];if(!U[k]&&!(p&&p.prospect))delete Lg[k];}}
/* ---------- 공개 측정 구속(대회 중계·스피드건): 모든 구단이 같은 숫자를 본다 ---------- */
/* 아마 척도 구위로 정한 그 선수의 최고 구속 근처. 고교 상위 투수 150 안팎, 보통 투수 130대 후반 */
function amVeloTop(x){ const R0=x.prospect?(x.amR||x.r):x.r; if(!R0||R0.stf==null)return null; return Math.min(158,Math.round(147+(R0.stf-41.5)*.5+((x.prospect?x.velo:x.v)||0))); }
/* 올해(없으면 지난해) 대회에서 잰 최고 구속 */
function amVm(x){ const v=x&&x.vm; return v&&v[0]>=G.year-1?{y:v[0],v:v[1]}:null; }
const amVmTxt=x=>{ const v=amVm(x); return v?`최고 ${v.v}km(${v.y===G.year?'올해':v.y+'년'} 대회 측정)`:''; };
/* ---------- 좋아하는 툴 버릇(우리·AI 같은 식) ---------- */
function clubScoutFor(tid,p){ if(!p)return null; if(tid===G.user)return bestScout(p.region,p); return clubAmScouts(tid).filter(s=>s.region===p.region).sort((a,b)=>(b.skill||0)-(a.skill||0))[0]||null; }
function clubLean(sc,p,fut){ if(!sc||!p||!p.prospect)return 0; const pk=scoutPet(sc,p.isP); return (fut(pk)>=55?DC_PET_ADD:0)+hn('lk'+sc.id,p.id)*DC_LIKE_SD; }
/* ---------- 빅보드 '재확인' 요청(드래프트 후보): 담당 스카우트가 1~2주 뒤 답한다 ----------
   동시에 아마추어 스카우트 수만큼. 답이 오면 그 항목 답과 함께 관찰 +2회(평가 오차 감소). AI 구단은 7·8월 1·15일에 자기 집중 후보에게 같은 수만큼 같은 효과 */
const DCHK_TOOL={타격:['con','pow'],제구:['ctl'],구위:['stf'],수비:['def'],주루:['spd']};
const rchkQ=()=>G.rchk=G.rchk||[];
const rchkCap=()=>clubAmScouts(G.user).length;
/* 옛 요청도 구단·담당자에 한 번 귀속한다. 난수 없이 반복해도 같다. */
function rchkInit(){ for(const x of G.rchk||[]){ if(x.tid==null)x.tid=(G.unemp&&G.unemp.from)??G.user;
    if(x.sid==null){ const sc=clubAmScouts(x.tid).find(s=>s.name===x.who); if(sc)x.sid=sc.id; } }
  for(const p of Object.values(G.players))for(const a of Object.values(p.rchkA||{}))if(a.tid==null)a.tid=G.user; }
const rchkOf=(id,k)=>rchkQ().find(x=>x.id===id&&x.k===k&&(x.tid??G.user)===G.user)||null;
const rchkApplies=(p,k)=>!!p&&(k==='건강'||k==='성격'||(p.isP?['제구','구위']:['타격','수비','주루']).includes(k));
function rchkAsk(id,k){ const p=G.players[id]; if(G.unemp||!p||!p.prospect||p.team!=null)return '드래프트 후보만 다시 볼 수 있습니다.';
  if(!rchkApplies(p,k))return '이 후보에게 해당하지 않는 재확인 항목입니다.';
  rchkInit(); const Q=rchkQ(), i=Q.findIndex(x=>x.id===id&&x.k===k&&x.tid===G.user); if(i>=0){ Q.splice(i,1); return '재확인 요청을 거뒀습니다.'; }
  const sc=bestScout(p.region,p); if(!sc)return `${p.region} 담당 아마추어 스카우트가 없어 다시 볼 사람이 없습니다.`;
  if(Q.filter(x=>x.tid===G.user).length>=rchkCap())return `재확인은 한 번에 ${rchkCap()}건까지입니다(아마추어 스카우트 수). 답을 받은 뒤 다시 요청하세요.`;
  const due=G.day+7+Math.floor(u01('rck'+G.day+k,id)*8); Q.push({id,k,tid:G.user,sid:sc.id,d0:G.day,due,who:sc.name});
  return `${sc.name} 스카우트가 ${pidName(p)}의 ${k}을(를) 다시 봅니다. 약 ${due-G.day}일 뒤 답이 옵니다.`; }
function rchkAns(p,k,tid=G.user){ if(k==='건강'){ const v=p.inj+hn('rkh',p.id)*.03; return (v>.24?'잔부상이 잦은 체질로 봅니다.':v>.18?'평범한 체질입니다. 큰 걱정은 없습니다.':'몸이 튼튼합니다.')+(p.amInj?` ${p.amInj} 이력은 확인했습니다.`:''); }
  if(k==='성격')return `면담 인상: ${gmMakeup(p)}`;
  const ks=DCHK_TOOL[k]||[]; const rp=tid===G.user&&!G.unemp?scoutReport(p):{tools:ks.map(k=>{ const e=aiDraftEst(tid,p),cur=clamp((p.r[k]||35)+hn(k+tid,p.id)*e.sd,20,80); return {k,cur,fut:clamp(cur+Math.max(0,e.v-ovr(p)),20,80)}; })}; return ks.map(t=>{ const x=(rp.tools||[]).find(q=>q.k===t); return x?`${TOOLK[t]} 지금 ${FD_G(x.cur)}등급 · 장래 ${FD_G(x.fut)}등급`:''; }).filter(Boolean).join(' · ')||'이 후보에게는 해당하지 않는 항목입니다.'; }
function rchkDaily(){ const o=dobj(G.day);
  if((o.m===7||o.m===8)&&(o.d===1||o.d===15))for(const t of G.teams||[]){ const tid=t.id; if(tid===G.user)continue; const n=clubAmScouts(tid).length, P=obsPriL(tid); const L=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&P[p.id]===2&&!(p.rchkT&&p.rchkT[tid]===G.year+'.'+o.m+'.'+o.d)).slice(0,n); for(const p of L){ obsAdd(p,tid,2); (p.rchkT=p.rchkT||{})[tid]=G.year+'.'+o.m+'.'+o.d; } }
  rchkInit(); const Q=G.rchk; if(!Q||!Q.length)return; const done=[];
  for(const x of [...Q]){ if(G.day<x.due)continue; Q.splice(Q.indexOf(x),1); const p=G.players[x.id], sc=clubAmScouts(x.tid).find(s=>s.id===x.sid&&s.region===p?.region);
    if(!p||!p.prospect||p.team!=null||!sc||!rchkApplies(p,x.k))continue;
    obsAdd(p,x.tid,2); obsByAdd(p,x.tid,sc.id,sc); const t=rchkAns(p,x.k,x.tid), ans={d:G.day,t,who:sc.name,tid:x.tid};
    if(x.tid===G.user&&!G.unemp){ (p.rchkA=p.rchkA||{})[x.k]=ans; done.push({p,x,t}); }
    else { const C=(G.dClub=G.dClub||{})[x.tid]; if(C){ C.rchkA=C.rchkA||{}; (C.rchkA[p.id]=C.rchkA[p.id]||{})[x.k]=ans; } } }
  if(done.length){ try{ _dcc=null; }catch(e){} mail('스카우트팀',done.length>1?`재확인 답 ${done.length}건`:`재확인 답: ${pidName(done[0].p)} ${done[0].x.k}`,done.map(z=>`${z.x.who} 스카우트 · ${pidName(z.p)}(${posLabel(z.p)}, ${z.p.school||''}) ${z.x.k}\n${z.t}`).join('\n\n')+'\n\n다시 본 만큼 평가 오차가 줄었습니다.',{kind:'스카우트',ref:done[0].p.id,acts:[{l:'드래프트 보드',a:'go',v:'transfer:draft'}]}); } }
/* ---------- 빅보드 구간·라운드 목표 ---------- */
const DTIER=[[1,'1R 목표'],[2,'2~3R'],[4,'중위'],[8,'보험']];
const dtierOf=rd=>!rd?0:rd===1?1:rd<=3?2:rd<=7?4:8;
const DPLAN_G=[['P','투수'],['C','포수'],['IF','내야'],['OF','외야']];
const dplanG=p=>p.isP?'P':p.pos==='C'?'C':['1B','2B','3B','SS','DH'].includes(p.pos)?'IF':'OF';
function dplanOf(){ const P=G.dplan; return P&&P.y===G.year?P:(G.dplan={y:G.year}); }
/* 목표 점검: 그 자리 후보가 보드에서 목표 라운드 안 구간에 하나라도 있나 */
function dplanCheck(){ const P=dplanOf(), SL=(G.shortlist||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect); return DPLAN_G.filter(([g])=>P[g]).map(([g,l])=>{ const L=SL.filter(p=>dplanG(p)===g&&(G.dmemo&&G.dmemo[p.id]&&G.dmemo[p.id].rd||99)<=P[g]); return {g,l,r:P[g],ok:L.length>0,n:L.length}; }); }
/* 자동 지명 가산: 목표 라운드 안이고 이번 드래프트에서 아직 그 자리를 못 뽑았으면 +4 */
function dplanBonus(p,rd,picked){ const d=G.draft; if(rd==null){ if(!d||d.done)return 0; rd=d.picks[d.cur]?.rd; }
  const P=dplanOf(), g=dplanG(p), r=P[g]; if(!r||!rd||rd>r)return 0;
  const L=picked??(d&&!d.done?d.picks.filter(k=>k.tid===G.user&&k.pid>0).map(k=>G.players[k.pid]).filter(Boolean):[]);
  return L.some(q=>dplanG(q)===g)?0:4; }
function draftUserScore(p,rd,picked,rp){ const pol=draftPolK(); return draftVal(rp||scoutReport(p),p)+(pol&&draftFit(p,pol)?4:0)+dplanBonus(p,rd,picked); }
/* 경기장에서 본 관심 선수(우리 구단): 그날 박스 한 줄을 보고에 남긴다 */
function obsLogGame(x,t,reg,day,who,ev){ const sc=typeof who==='object'?who:who?null:clubAmScouts(G.user).find(s=>s.region===reg),name=typeof who==='string'?who:sc?.name||'스카우트팀',L=obsLogWrite(x),prev=L.length?L[L.length-1][3]:null;
  L.push([day,name,`${ev?ev+' ':''}경기 관전 · ${t.b}`,prev,G.user,sc?.id??null]); if(L.length>6)L.splice(0,L.length-6); }
