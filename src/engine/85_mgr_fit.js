/* ===== 감독이 추구하는 야구 → 원하는 역할 → 기용·요청·영입 판단을 같은 기준으로 =====
 감독 유형(mgrType)마다 원하는 선수 역할이 있다(뛰는 야구: 발 빠른 타자·출루형 테이블세터, 빅볼: 장타형 중심 타자, 수비 중시: 센터라인 수비수,
 불펜 총력: 구위형 필승조, 선발 관리: 긴 이닝 선발).
 - 기용: 감독은 그 역할에 맞는 선수를 주전·보직 선정에서 조금 더 쳐준다(polBonus). AI 감독도 같다.
 - 요청: 주전 중 그 역할이 모자라면 역할 조건(필요한 능력·감수할 약점·예상 역할·내부 대안)으로 보강을 요청한다. 추천 선수가 아니어도 조건을 채우면 들어준 것.
 - 영입 판단: AI 구단은 자기 감독 야구에 맞고 모자란 역할의 선수를 더 비싸게 본다(tval). 그래서 AI 제안도 감독 요청에서 나온다.
 - 시너지는 따로 숫자를 얹지 않는다. 뛰는 야구 감독은 원래 도루·번트를 많이 시도하고(경기 엔진), 그 성공은 주자 주력에 달려 있어서 맞는 선수가 있어야 득이 된다 */
const MROLE={
  runSPD:{l:'발 빠른 타자',need:'주력',acc:'장타 부족',role:'1·2번·9번 타자, 대주자',bat:1,tgt:3,ok:p=>p.r.spd>=62&&p.r.eye>=46,f:p=>(p.r.spd-52)*.65+(p.r.eye-52)*.35},
  runOB:{l:'출루형 테이블세터',need:'선구(출루)·컨택',acc:'장타 부족',role:'1·2번 타자',bat:1,tgt:3,ok:p=>p.r.eye>=58&&p.r.con>=52,f:p=>(p.r.eye-52)*.6+(p.r.con-52)*.3+(p.r.spd-52)*.2},
  pow:{l:'장타형 중심 타자',need:'파워',acc:'수비 약점 일부',role:'3~5번 타자',bat:1,tgt:3,ok:p=>p.r.pow>=62&&p.r.con>=45,f:p=>(p.r.pow-52)*.7+(p.r.con-52)*.3},
  defC:{l:'센터라인 수비수',need:'수비 범위',acc:'타격 부족',role:'주전 포수·유격수·2루수·중견수',bat:1,tgt:3,ok:p=>p.r.def>=63&&['SS','2B','CF','C'].includes(p.pos),f:p=>p.r.def-52},
  penS:{l:'구위형 필승조',need:'구위',acc:'긴 이닝 소화 부족',role:'필승조',bat:0,tgt:2,ok:p=>p.r.stf>=63,f:p=>(p.r.stf-52)*.8+(p.r.ctl-52)*.2},
  spK:{l:'삼진형 선발',need:'구위(헛스윙)',acc:'볼넷·투구 수',role:'선발 로테이션',bat:0,tgt:2,ok:p=>p.r.stf>=63&&p.r.sta>=50,f:p=>(p.r.stf-52)*.8+(p.r.sta-52)*.2},
  spL:{l:'긴 이닝 선발',need:'체력·제구',acc:'탈삼진 부족',role:'선발 로테이션',bat:0,tgt:3,ok:p=>p.r.sta>=60&&p.r.ctl>=53,f:p=>(p.r.sta-52)*.5+(p.r.ctl-52)*.3+(p.r.stf-52)*.2}};
/* 수비가 약해도 치는 쪽(빅볼·타격 중시)은 수비에 맡기는 타구를 줄이는 삼진형 선발을, 수비 중시는 맞혀 잡아도 되는 이닝형 선발을 찾는다 */
const MT_ROLES={small:['runSPD','runOB'],combo_d:['defC','runSPD','runOB'],big:['pow','spK'],combo_o:['pow','spK'],bat:['pow','spK'],dfn:['defC','spL'],pen_all:['penS'],gamble:['penS','spK'],sp_care:['spL'],care:['spL']};
function mgrRolesOf(m){ if(!m||m.interim)return []; return MT_ROLES[mgrType(m).k]||[]; }
function roleOk(p,k){ const R=MROLE[k]; if(!p||!R||!p.r)return false; if(R.bat?p.isP:!p.isP)return false; try{ return !!R.ok(p); }catch(e){ return false; } }
function roleTags(p,k){ const R=MROLE[k]; if(!R||!p)return ''; const g=v=>v>=62?'강점':v<=45?'약함':'보통'; const T=R.bat?{runSPD:[['주력','spd'],['선구','eye']],runOB:[['선구','eye'],['컨택','con'],['주력','spd']],pow:[['파워','pow'],['컨택','con'],['수비','def']],defC:[['수비','def'],['컨택','con']]}[k]:{penS:[['구위','stf'],['제구','ctl']],spL:[['체력','sta'],['제구','ctl'],['구위','stf']],spK:[['구위','stf'],['제구','ctl'],['체력','sta']]}[k];
  return (T||[]).map(([l,key])=>`${l} ${g(p.r[key])}`).join(' · '); }
/* 기용 가산: 감독이 원하는 역할에 맞으면 +1.2(능력 단위). 주전·선발·불펜 순서 정할 때만 쓰고 경기력에는 더하지 않는다 */
function mgrFitB(tid,p){ if(tid==null||!p)return 0; const m=mgrOf(tid); const L=mgrRolesOf(m); for(const k of L)if(roleOk(p,k))return 1.2; return 0; }
/* 주전 중 그 역할을 하는 선수(타자: 라인업, 필승조: 불펜 앞 5명, 선발: 로테이션 5명) */
function roleHave(tid,k){ const R=MROLE[k]; let d=null; try{ d=depth(tid); }catch(e){ return []; } const L=R.bat?d.start:k==='penS'?d.pen.slice(0,5):d.sp; return L.filter(p=>roleOk(p,k)); }
function roleGap(tid,k){ const c=G._rg&&G._rg.d===G.day?G._rg:(G._rg={d:G.day,v:{}}); const key=tid+':'+k; if(c.v[key]==null)c.v[key]=Math.max(0,MROLE[k].tgt-roleHave(tid,k).length); return c.v[key]; }
/* 지금 가장 모자란 역할: 같은 감독이라도 선수단에 따라 달라진다(뛰는 야구 감독이어도 빠른 선수가 충분하면 출루형을 찾는다) */
function mgrNeedRole(tid){ const L=mgrRolesOf(mgrOf(tid)); let best=null; for(const k of L){ const g=roleGap(tid,k); if(g>0&&(!best||g>best.gap))best={k,gap:g,have:MROLE[k].tgt-g}; } return best; }
/* 영입 가치 배수: 감독 야구에 맞으면 1.05, 그 역할이 모자라면 1.15(들여올 때) */
function mgrFitMul(tid,p,dir){ const m=G.mgr[tid]; if(!m||m.interim||!p)return 1; const L=mgrRolesOf(m); const k=L.find(x=>roleOk(p,x)); if(!k)return 1; return dir==='in'&&roleGap(tid,k)>0?1.15:1.05; }
function mgrFitWhy(tid,p){ const m=G.mgr[tid]; if(!m||m.interim)return ''; const k=mgrRolesOf(m).find(x=>roleOk(p,x)); return k&&roleGap(tid,k)>0?`${m.name} 감독이 원하는 ${MROLE[k].l}(${roleTags(p,k)})`:''; }
/* 역할 후보: 다른 구단 선수와 FA. 1군에서 쓸 만한 선수만(우리 주전 평균보다 크게 낮지 않게) */
function roleCands(tid,k,n){ const R=MROLE[k]; let d=null; try{ d=depth(tid); }catch(e){} const base=R.bat?(d&&d.start.length?d.start.reduce((a,p)=>a+ovr(p),0)/d.start.length:50):(d&&d.sp.length?d.sp.reduce((a,p)=>a+ovr(p),0)/d.sp.length:50);
  const fa=new Set(G.fa&&G.fa.open&&!G.fa.closed?(G.fa.pool||[]):[]);
  return Object.values(G.players).filter(p=>((p.team!=null&&p.team!==tid)||fa.has(p.id))&&!p.foreign&&!p.ys&&!p.prospect&&!(p.joinY>G.year)&&healthy(p)&&roleOk(p,k)&&ovr(p)>=base-6)
    .sort((a,b)=>(R.f(b)+ovr(b)*.6)-(R.f(a)+ovr(a)*.6)).slice(0,n||3); }
function roleInside(tid,k){ let d=null; try{ d=depth(tid); }catch(e){ return null; } const R=MROLE[k]; const cur=new Set((R.bat?d.start:k==='penS'?d.pen.slice(0,5):d.sp).map(p=>p.id)); return playersOf(tid).filter(p=>!cur.has(p.id)&&!p.prospect&&roleOk(p,k)).sort((a,b)=>ovr(b)-ovr(a))[0]||null; }
/* 감독 화면: 원하는 역할별 주전 현황 + 그 야구가 먹히는지 보여 주는 기록 */
function mgrPlayStat(tid,m){ const y=G.year; let sb=0,cs=0,hr=0,pa=0; for(const p of playersOf(tid)){ const h=seasonTotalT(p,y,'1군',tid); if(!h||p.isP)continue; sb+=h.sb||0; cs+=h.cs||0; hr+=h.hr||0; pa+=h.pa||0; } if(!pa)return '';
  const L=mgrRolesOf(m); if(L.includes('runSPD'))return `올 시즌 도루 ${sb}개 · 실패 ${cs}개(성공률 ${sb+cs?Math.round(sb/(sb+cs)*100):0}%)`; if(L.includes('pow'))return `올 시즌 팀 홈런 ${hr}개`; return ''; }
