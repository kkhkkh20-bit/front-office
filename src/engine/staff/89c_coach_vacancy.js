/* ===== 코치 빈자리 보강: AI 구단과 맡긴 우리 구단이 같은 시장·같은 규칙으로 (구단주 승인 2026-11-17, 검수 11-17 §5) =====
 전에는 AI 빈자리를 시장을 거치지 않은 새 코치(obAiCoach·mkCoach)로 바로 채웠다. 이제는 둘 다 이 함수 하나를 쓴다.
 - 후보: 코치 시장(G.cmarket)에서 그 자리 후보. 조건은 월간 AI 영입(cmAiMonthly)과 같다: 학교 재직 중·66세 이상·그 구단이 올해 내보낸 코치·다른 구단과 협상 중인 후보는 빼고,
   다른 구단의 '우선 협상' 후보도 뺀다(우리 우선 협상 후보는 우리만 본다).
 - 연봉: 시장 영입과 같은 연봉 여력 검사(cmCanPay). 연봉은 후보가 시장에 내건 그대로, 계약 1~3년, 합류 시즌 규칙도 같다(ctStartS 또는 겨울 정리의 다음 시즌).
 - 고르기: 코치 시장 화면의 '종합순'과 같은 값(우리 팀에서 일할 때의 지도+육성, effC plan). 같으면 연봉이 낮은 쪽.
 - 시장에 맞는 후보가 없으면 시장과 같은 생성(mkCandCoach)으로 새 후보를 데려온다. 시장보다 좋은 공짜 코치는 없다.
 - 난수: 계약 연수·새 후보·구단 순서는 따로 씨앗을 둔 난수(withRng)라 본 난수 흐름을 쓰지 않는다. */
const cvacVal=(c,tid)=>{ const x={...c,clan:null}; return effC(x,tid,'sk',1)+effC(x,tid,'dv',1); }; /* 코치 시장 '종합순'(34_staff coachMarket)과 같은 값 */
function cvacOk(c,tid,k,win){ if(!c||c.role!==k)return false; if(typeof schMarketWhy==='function'&&schMarketWhy(c))return false;
  if(c.age>=66||(c.from===tid&&c.fromY===G.year)||(c.bid&&c.bid.exp>=G.day))return false;
  if(win&&c.fromY===G.year)return false; /* 겨울 정리 때는 이번 겨울 계약이 끝난 코치를 바로 데려가지 않는다(예전 겨울 후임 규칙 x.fromY!==G.year와 같게): 원소속 구단(우리 포함)이 다음 달 시장까지 다시 데려올 수 있게. 우리·AI 같음 */
  return coachCanHire(tid,c,{auto:true,cur:null})&&cmCanPay(team(tid),c,null); }
const cvacSeed=(...a)=>rngHash('cvac',G.year,G.day,G.nextId,...a);
/* tid 구단의 k 자리에 데려올 코치(시장 후보, 없으면 새 후보를 시장에 올려서). 고르기만 하고 계약은 cvacHire */
function cvacPick(tid,k,win){ const L=(G.cmarket||[]).filter(c=>cvacOk(c,tid,k,win)).map(c=>[c,cvacVal(c,tid)]).sort((a,b)=>b[1]-a[1]||(a[0].sal||0)-(b[0].sal||0)).map(x=>x[0]); /* 값은 후보마다 한 번만(정렬 비교마다 effC 두 번을 다시 계산하던 것, 카페 11-17 렉). 순서는 같다 */
  if(L.length)return L[0];
  let c=null; withRng(cvacSeed('new',tid,k),()=>{ for(let i=0;i<6&&!c;i++){ const x=mkCandCoach(k); if(x&&x.role===k&&cmCanPay(team(tid),x,null))c=x; } if(!c){ c=mkCoach(k,{boost:-ri(2,6)}); c.sal=round5(Math.min(c.sal,140)); } }); /* 형편 안 새 후보가 끝내 없으면 젊은 지도자 수준(시장의 낮은 쪽) */
  (G.cmarket=G.cmarket||[]).push(c); return c; }
function cvacYears(tid,c){ return withRng(cvacSeed('yrs',tid,c.id),()=>coachContractYears(c,ri(1,3))); }
/* 계약: 우리 구단은 단장이 누르는 영입과 같은 hireCoach, AI는 월간 시장 영입과 같은 처리 */
function cvacHire(tid,c,why,start){ const yrs=cvacYears(tid,c), k=c.role;
  if(!coachCanHire(tid,c,{years:yrs,auto:true,cur:null})||!cmCanPay(team(tid),c,null))return null;
  if(tid===ME()){ const e=hireCoach(c.id,yrs,{vac:true}); if(e)return null; if(start!=null&&start!==c.cs)staffCt(c,yrs,start); return c; }
  const C=G.coach[tid]; G.cmarket=G.cmarket.filter(x=>x!==c); c.clan=null; delete c.res; delete c.folM; delete c.gmFol;
  staffCt(c,yrs,start??ctStartS()); C[k]=c; staffHistory('coach',c,'영입',tid,`${why||'코치진 공백 보강'} · ${yrs}년 · 연 ${money(c.sal)}`); stAttr(c); c.loy=20;
  if(typeof schStaffJoined==='function')schStaffJoined(c,tid); try{ if(c.ob)obTaken(c.ob,c); }catch(e){}
  if(c.star)try{ wire('코치',`${tshort(tid)}, ${CROLE[k].l}(으)로 ${c.name} 영입 (스타 코치)`,{tid}); }catch(e){} return c; }
/* 한 구단의 빈자리 채우기. why: 문자열 또는 자리별 {k:문자열}. start: 합류 시즌(겨울 정리 때 다음 시즌). 채운 코치 목록 */
function coachVacFill(tid,why,roles,start){ if(!G.coach||!G.coach[tid]||!team(tid))return []; if(tid===ME()&&G.unemp)return []; const C=G.coach[tid], got=[];
  for(const k of roles||CKEYS){ if(C[k])continue; const w=why&&typeof why==='object'?why[k]:why; const c=cvacPick(tid,k,start!=null); const h=c&&cvacHire(tid,c,w,start); if(h)got.push(h); }
  return got; }
/* 리그 한 바퀴: AI 구단과 (맡겼으면) 우리 구단을 따로 씨앗을 둔 무작위 순서로. 매달 1일·겨울 정리 뒤 */
function coachVacRound(why,start){ if(!G.coach)return []; const ids=G.teams.map(t=>t.id).filter(id=>id!==ME()||autoOn('cvac'));
  const ord=withRng(cvacSeed('ord'),()=>ids.map(id=>[id,R()]).sort((a,b)=>a[1]-b[1]).map(x=>x[0])); const out=[];
  for(const tid of ord){ const w=typeof why==='function'?why(tid):why; const L=tid===ME()?coachVacUser(w,start):coachVacFill(tid,w,null,start); out.push(...L.map(c=>({tid,c}))); } return out; }
/* 맡긴 우리 구단: 같은 함수로 채우고 '위임에 따라 처리한 일'·소식함에 남긴다 */
function coachVacUser(why,start){ if(G.unemp||!G.coach||!G.coach[G.user])return []; const got=coachVacFill(G.user,why,null,start); if(!got.length)return got;
  const t=got.map(c=>`${CROLE[c.role].l} ${c.name}(지도 ${dv(effC(c,G.user,'sk',1))} · 육성 ${dv(effC(c,G.user,'dv',1))} · ${c.yrs}년 · 연 ${money(c.sal)})`);
  autoLogAdd('코치 빈자리 보강(운영팀)',`${got.length}명 영입`,t.join(', '));
  mail('운영팀',`코치 빈자리 보강: ${got.length}명 영입`,`맡기신 대로 빈 코치 자리를 코치 시장에서 채웠습니다.\n${t.join('\n')}\n\nAI 구단과 같은 기준입니다. 그 자리 후보 가운데 연봉 여력 안에서 종합(지도+육성)이 가장 높은 코치를 골랐고, 후보가 없으면 새 후보를 데려왔습니다. 설정 › 업무 권한 또는 스태프 화면에서 되돌릴 수 있습니다.`,{kind:'코치',acts:[{l:'코치진 보기',a:'go',v:'staff:coach'}]});
  return got; }
/* 코치 빈자리 소식: 받은편지함 '위임하기' 버튼(mailDelegOpts)이 이 업무로 이어지게 */
function cvacMail(m){ if(m&&typeof m==='object'&&m.id)m.auto=[...new Set([...(m.auto||[]),'cvac'])]; return m; }
