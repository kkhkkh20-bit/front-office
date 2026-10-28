/* ===== 자유계약(무적) 선수 =====
   방출되거나 FA 시장에서 팀을 찾지 못한 선수는 바로 은퇴하지 않고 무적 선수로 남는다.
   어느 구단이든 연봉을 낮춰 데려갈 수 있고(외국인 등록 마감 8월 15일 이후 시즌 중에는 등록 불가),
   마지막 계약이 끝난 뒤 2년 동안 계약하지 못하거나 38세가 되면 은퇴한다 */
const FREE_YEARS=2;
function toFree(p,why){ if(!p)return; p.team=null; if(p.freeSince==null)p.freeSince=G.year; p.freeDay=G.day; p.faC=false; p.ext=false; p.yrs=0;
  delete p.cyrs; delete p.extNext; delete p.ys; delete p.role; delete p.faFrom; delete p.ask; delete p.listed; delete p.aiListed; p.injOut=Math.min(p.injOut||0,60);
  if(why)story(p,why,'move'); }
function isFree(p){ return !!p&&p.team==null&&p.freeSince!=null&&!p.foreign&&!p.prospect&&!(G.fa&&!G.fa.closed&&(G.fa.pool||[]).includes(p.id)); }
function freeList(){ return Object.values(G.players).filter(isFree); }
/* 무적 선수의 요구 연봉: 시장가의 35%와 직전 연봉의 60% 중 낮은 쪽, 최저연봉 이상 */
function freeAsk(p){ return round5(Math.max(MIN_SAL,Math.min(marketSal(ovr(p))*.35,(p.sal||MIN_SAL)*.6))); }
function freeOpen(){ const per=period(); return !(per==='season'&&G.day>foreignDL()); }
function signFree(id,tid){ tid=tid??G.user; const p=G.players[id]; if(!isFree(p))return '계약할 수 없는 선수입니다.'; if(!freeOpen())return '8월 15일 이후에는 시즌이 끝날 때까지 새 선수를 등록할 수 없습니다.';
  if(rosterN(tid)>=ROSTER_MAX)return `정식 선수가 ${ROSTER_MAX}명으로 꽉 찼습니다. 먼저 한 명을 정리하세요.`;
  const sal=freeAsk(p); p.team=tid; p.sal=sal; p.yrs=1; p.joinY=undefined; const yrs=G.year-p.freeSince; delete p.freeSince; delete p.freeDay; p.mor=clamp((p.mor??55)+8,0,100);
  story(p,`${tname(tid)}와(과) 계약 (무적 선수, 연 ${money(sal)})`,'move');
  if(tid===G.user)addLog(`무적 선수 ${p.name}(${posLabel(p)}, ${p.age}세)과(와) 연 ${money(sal)}에 계약했습니다.`); else if(ovr(p)>=50)wire('이적',`${tname(tid)}, 무적 선수 ${p.name} 영입`,{tid,ref:p.id});
  void yrs; return ''; }
/* 새해: 2년 동안 계약하지 못한 선수, 38세 이상은 은퇴 */
function freeYear(){ let n=0; for(const p of freeList()){ if(G.year-p.freeSince>=FREE_YEARS||p.age>=38||ovr(p)<26){ story(p,'무적 선수로 지내다 은퇴','move'); try{ obFromPlayer(p,null); }catch(e){} delete G.players[p.id]; n++; } } return n; }
/* 매달 1일: 부상자가 많거나 자리가 빈 AI 구단은 쓸 만한 무적 선수를 데려간다 */
function freeAiMonthly(){ if(!freeOpen())return; const L=freeList().sort((a,b)=>ovr(b)-ovr(a)); if(!L.length)return;
  for(const t of G.teams){ if(t.id===G.user)continue; const n=rosterN(t.id); if(n>=ROSTER_MAX-1)continue; const hurt=playersOf(t.id).filter(p=>p.injOut>14).length;
    if(n>=ROSTER_MAX-4&&hurt<3)continue; const own=domestic(t.id).map(ovr).sort((a,b)=>b-a); const bar=own[Math.min(own.length-1,35)]||35;
    const c=L.find(p=>p.team==null&&ovr(p)>=bar&&p.age<=35); if(c&&R()<.5)signFree(c.id,t.id); } }
