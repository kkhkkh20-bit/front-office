/* ===== 단장 일정: 경기 직관·스카우팅 출장·2군 방문 =====
   단장은 모든 경기를 보지 않는다. 결과는 보고로 받고, 볼 경기를 골라 경기장에 간다(혼자, 구단주와, 사장과).
   경기가 없는 날이나 시즌 중 다른 날에는 고교 대회를 보러 가거나 2군을 찾는다.
   - 직관: 혼자면 선수단 기분·감독 관계가 조금 오르고, 구단주와 보면 이기면 신뢰가 오르고 크게 지면 떨어진다. 사장과 보면 예산 이야기를 나눌 수 있다
   - 스카우팅 출장: 그 지역 드래프트 후보를 단장이 직접 본다. 평가 오차가 줄고(스카우트가 없어도 잠재력 판단 가능), 가끔 숨은 원석을 찾는다
   - 2군 방문: 2군 선수 기분이 오르고 유망주 성장 보고를 받는다
   카페 11-14 '고교 방문, 2군 경기 관전 등이 강화돼야': 현장 활동을 늘렸다(수치는 보고에 드러내지 않는다)
   - 고교 방문(school): 고교 시즌 아무 날, 올해 후보가 있는 학교 하나. 그 학교 후보만 평가 오차가 크게 준다(지역 출장보다 좁고 깊게).
     면담 인상(성실함·야망·기질)을 말로 듣고, 학교 감독과 가까워진다. 가장 좋은 후보가 방문을 기억하면 지명 뒤 기분·미국 직행 설득에 조금 낫다.
     같은 학교를 다시 가면 효과가 준다. 학교 방문은 한 주에 한 번
   - 2군 경기 관전(fut): 우리 2군 경기가 있는 날. 그날 잘한 선수·젊은 선수 흐름·코치 평을 실제 능력·성장으로 전한다. 직접 본 선수는 잠재력 추정이 조금 정확해진다.
     뛴 선수 기분·2군 감독 관계는 한 달에 두 번까지만 오른다(훈련장 방문과 함께 센다). 같은 자리 1군 선수만 한 선수가 있으면 콜업 건의를 붙인다
   - 2군 훈련장 방문(farm): 경기 없는 날의 가벼운 방문. 같은 횟수 제한
   - AI 단장도 매달 고교 권역을 돈다(권역 정보망·학교 감독 친분). 우리와 같은 상한 */
const GM_TOURN=[[3,25,4,10,'이마트배 전국고교야구'],[4,25,5,15,'황금사자기 전국고교야구'],[6,5,6,20,'대통령배 전국고교야구'],[7,5,7,22,'청룡기 전국고교야구'],[8,5,8,25,'봉황대기 전국고교야구']];
function gmTourn(d){ const o=dobj(d); for(const t of GM_TOURN){ const a=dnum(o.y,t[0],t[1]), b=dnum(o.y,t[2],t[3]); if(d>=a&&d<=b)return t[4]; } const w=o.w; if(o.m>=3&&o.m<=10&&(w===0||w===6))return '고교야구 주말리그'; return null; }
function gmPlans(){ return G.gmPlan=G.gmPlan||{}; }
function gmPlanAt(d){ return gmPlans()[d]||null; }
/* 독립 구단에도 개인 구단주는 있다. 모기업 유무 대신 실제 동행 인물을 확인한다. */
function gmCompanion(x,tid=G.user){return ['owner','ceo'].includes(x)?bossOf(tid)[x==='ceo'?'ceo':'own']||null:null;}
function gmPlanLeave(tid){const text='소속 구단을 떠나 직관 일정을 종료했습니다.';const mids=new Set(Object.values(G.gmPlan||{}).filter(p=>p.tid==null||p.tid===tid).map(p=>p.mid).filter(Boolean));for(const m of G.mail||[])if(mids.has(m.id)||m.ctx?.tid===tid&&(m.acts||[]).some(a=>a.a==='watchPlan')){m.ctx={...m.ctx,tid};m.read=true;m.imp=false;m.closed={label:'기한 종료',text,expired:true};if(!(m.body||'').includes('[종료] '+text))m.body=(m.body||'')+'\n\n[종료] '+text;m.acts=[];mids.add(m.id);}G.stops=(G.stops||[]).filter(m=>!mids.has(m.id));}
/* 그날 우리 경기 상대(엔진이 치를 순서: 미룬 경기·정규 편성·포스트시즌 차전) */
function gmOpsOn(d){ const L=dayGames(d).filter(m=>m.includes(G.user)).map(m=>m[0]===G.user?m[1]:m[0]); const q=psOursAt(d); if(q)L.push(q.op); return L; }
/* 직관 예약은 잡은 경기(상대)에 붙는다: 그 상대 경기가 그날 열려야 유효(옛 저장은 상대 없이 그날 경기만, 검수 11-09zo) */
function gmPlanLive(d,q){ const L=gmOpsOn(+d); return q.op==null?L.length>0:L.includes(q.op); }
function gmPlanSet(d,k,x){ if(d<=G.day)return '지난 날짜입니다.'; const P=gmPlans(); const drop=()=>{ const o=P[d]; if(o&&o.mid){ G.mail=G.mail.filter(m=>m.id!==o.mid); G.stops=(G.stops||[]).filter(m=>m.id!==o.mid); } }; /* 정지 목록의 알림도 함께(검수 11-09zzc #25) */ /* 같은 날 일정을 바꾸거나 지우면 옛 '내일 직관' 알림은 지운다. 변경이 거절되면 그대로 둔다(검수 11-06) */ if(!k){ drop(); delete P[d]; return '일정을 지웠습니다.'; }
  const ops=gmOpsOn(d);
  if(k==='attend'&&!ops.length)return '그날은 우리 경기가 없습니다.';
  if(k==='attend'&&['owner','ceo'].includes(x)&&!gmCompanion(x))return '현재 동행할 '+(x==='owner'?'구단주':'사장')+'가 없습니다.';
  if(k==='scout'&&!gmTourn(d))return '그날은 고교 대회가 없습니다.';
  if(k==='scout'&&!REG.includes(x))return '지역을 고르세요.';
  if(k==='farm'&&!(dobj(d).m>=4&&dobj(d).m<=9))return '2군 경기가 없는 시기입니다.';
  if(k==='school'){ const w=gmSchWhy(d,x); if(w)return w; }
  const fg=k==='fut'||k==='farm'?flGameOn(G.user,d):null; if(k==='fut'&&!fg)return '그날은 우리 2군 경기가 없습니다.'; if(k==='farm'&&fg)k='fut'; /* 2군 경기가 있는 날 방문은 경기 관전으로 */
  if(k==='attend'&&x==='owner'){ const n=Object.entries(P).filter(([dd,p])=>p.k==='attend'&&p.x==='owner'&&!p.done&&+dd>G.day&&+dd!==+d&&gmPlanLive(dd,p)).length; /* 열리지 않을 경기(일찍 끝난 시리즈의 남은 차전) 예약은 세지 않는다(검수 11-09zo) */ /* 같은 날을 다시 잡는 것은 새 예약이 아니다 */ /* 앞으로 유효한 일정만 센다 */ if(n>=2)return '구단주와의 직관은 한 번에 두 경기까지만 잡을 수 있습니다.'; }
  drop(); P[d]={k,x:k==='fut'?null:x||null,done:false,...(k==='fut'?{op:fg.op,home:fg.home}:{}),...(k==='attend'?{op:ops[0],tid:G.user,...(['owner','ceo'].includes(x)?{person:bossOf(G.user)[x==='ceo'?'ceo':'own'].id}:{})}:{})};
  if(k==='attend'&&+d===G.day+1)gmAttendWarn(P[d]); /* 내일 경기를 오늘 잡으면 전날 알림을 바로 보낸다(검수 11-06) */
  return k==='attend'?`${dmd(d)} 경기 직관을 잡았습니다${x==='owner'?'(구단주 동행)':x==='ceo'?'(사장 동행)':''}. 전날 알려 드립니다.`:k==='scout'?`${dmd(d)} ${x} ${gmTourn(d)} 관전 출장을 잡았습니다.`:k==='school'?`${dmd(d)} ${x} 방문을 잡았습니다.`:k==='fut'?`${dmd(d)} 2군 ${flName(fg.op)}전 관전을 잡았습니다.`:`${dmd(d)} 2군 훈련장 방문을 잡았습니다.`; }
/* 고교 시즌: 3~10월, 그해 드래프트 전까지 */
function gmSchSeason(d){ const o=dobj(d); if(o.m<3||o.m>10)return false; const dr=G.cal&&G.cal.draft; return !(dr!=null&&d>=dr&&dobj(dr).y===o.y); }
/* 올해 드래프트 후보가 있는 고교(대학 제외): [{n,reg,L}] */
function gmSchools(reg){ const m={}; for(const id of G.draftClass||[]){ const p=G.players[id]; if(!p||!p.prospect||p.college||!p.school||reg&&p.region!==reg)continue; (m[p.school]=m[p.school]||{n:p.school,reg:p.region,L:[]}).L.push(p); } return Object.values(m).sort((a,b)=>a.n<b.n?-1:1); }
function gmSchWhy(d,x){ if(!gmSchSeason(d))return '고교 시즌이 아닙니다.'; if(!gmSchools().some(s=>s.n===x))return '올해 드래프트 후보가 있는 학교를 고르세요.';
  const near=Object.entries(gmPlans()).find(([dd,p])=>p.k==='school'&&+dd!==+d&&Math.abs(+dd-d)<7); if(near)return `학교 방문은 한 주에 한 번입니다. ${dmd(+near[0])}에 ${near[1].x} 방문이 있습니다.`; return ''; }
/* 올해 현장 활동 기록(구단·연도가 바뀌면 새로): mon 월별 2군 방문·관전 횟수, sch 학교별 방문 횟수 */
function gmFld(){ let F=G.gmFld; if(!F||F.t!==G.user||F.y!==G.year)F=G.gmFld={t:G.user,y:G.year,mon:{},sch:{}}; return F; }
/* 2군 기분·관계 효과는 한 달에 두 번까지(관전·훈련장 방문 합산) */
function gmFarmFull(){ const F=gmFld(), m=dobj(G.day).m, n=F.mon[m]||0; F.mon[m]=n+1; return n<2; }
/* 한꺼번에 잡기(카페 11-14: 하루하루 말고 기간·대회 단위로). 출장만: 오늘 다음 날부터 고른 날까지, 또는 그 대회 기간 전체. 이미 잡은 직관·방문은 그대로 둔다 */
function gmTournSpan(d){ const o=dobj(d); for(const t of GM_TOURN){ const a=dnum(o.y,t[0],t[1]), b=dnum(o.y,t[2],t[3]); if(d>=a&&d<=b)return [a,b,t[4]]; } return null; }
function gmPlanBulk(d,x,mode){ if(mode==='fut')return gmPlanBulkFut(+d,x); if(mode==='school')return gmPlanBulkSch(+d,x); if(!REG.includes(x))return '지역을 고르세요.'; d=+d; let a=G.day+1, b=d; if(mode==='tourn'){ const S=gmTournSpan(d); if(!S)return '대회 기간이 아닙니다.'; a=Math.max(a,S[0]); b=S[1]; }
  const P=gmPlans(); let n=0, kept=0; for(let i=a;i<=b;i++){ if(!gmTourn(i))continue; const o=P[i]; if(o&&o.k!=='scout'){ kept++; continue; } if(gmPlanSet(i,'scout',x).includes('출장을 잡았습니다'))n++; }
  return n?`${dmd(a)}~${dmd(b)} 고교 대회 ${n}일을 ${x} 출장으로 잡았습니다.${kept?` 직관·2군 방문을 잡은 ${kept}일은 그대로 둡니다.`:''}`:'그 기간에 잡을 고교 대회 날이 없습니다.'; }
/* 우리 2군 경기를 오늘 다음 날부터 고른 날까지 관전으로(x='home'이면 홈 경기만). 다른 일정은 그대로 둔다. 효과는 한 달 두 번 상한이라 많이 잡아도 쌓이지 않는다 */
function gmPlanBulkFut(d,x){ const P=gmPlans(); let n=0, kept=0; for(let i=G.day+1;i<=d;i++){ const g=flGameOn(G.user,i); if(!g||x==='home'&&!g.home)continue; const o=P[i]; if(o&&o.k!=='fut'&&o.k!=='farm'){ kept++; continue; } gmPlanSet(i,'fut'); if(P[i]&&P[i].k==='fut')n++; }
  return n?`${dmd(G.day+1)}~${dmd(d)} 우리 2군 ${x==='home'?'홈 ':''}경기 ${n}경기를 관전으로 잡았습니다.${kept?` 다른 일정이 있는 ${kept}일은 그대로 둡니다.`:''} 선수단 기분은 한 달에 두 번까지만 오릅니다.`:'그 기간에 잡을 우리 2군 경기가 없습니다.'; }
/* 그 지역 학교를 한 주에 한 곳씩: 덜 가 본 학교부터. 주 1회 제한은 gmPlanSet이 그대로 지킨다 */
function gmPlanBulkSch(d,reg){ if(!REG.includes(reg))return '지역을 고르세요.'; const S=gmSchools(reg); if(!S.length)return '그 지역에는 올해 후보가 있는 학교가 없습니다.'; const P=gmPlans(), F=gmFld();
  const cnt=n=>(F.sch[n]||0)+Object.entries(P).filter(([dd,p])=>p.k==='school'&&p.x===n&&+dd>G.day).length; let n=0;
  for(let i=G.day+1;i<=d;i++){ if(P[i]||!gmSchSeason(i))continue; const s=[...S].sort((a,b)=>cnt(a.n)-cnt(b.n)||(a.n<b.n?-1:1))[0]; gmPlanSet(i,'school',s.n); if(P[i]&&P[i].k==='school')n++; }
  return n?`${dmd(G.day+1)}~${dmd(d)} ${reg} 학교 방문 ${n}곳을 한 주에 한 번씩 잡았습니다.`:'그 기간에는 더 잡을 수 있는 학교 방문이 없습니다. 학교 방문은 한 주에 한 번입니다.'; }
/* 전날: 직관 알림(진행을 멈춘다). 당일: 출장·방문 결과 */
function gmPlanDaily(){ if(G.unemp)return; try{ const o=dobj(G.day); if(o.m===3&&o.d>=1&&G.gmPlanTip!==o.y&&!G.gmPlanTipSeen){ G.gmPlanTip=o.y; G.gmPlanTipSeen=1; mail('스카우트팀장','달력에서 단장 일정을 잡을 수 있습니다','일정 화면의 달력에서 앞으로의 날짜를 누르면 고교 대회 출장, 고교 방문, 경기 직관, 2군 경기 관전을 잡을 수 있습니다. 출장은 그 지역 후보를 넓게, 고교 방문은 한 학교 후보를 깊게 봅니다. 2군 경기를 보면 선수들 흐름을 직접 확인합니다. 출장과 2군 관전은 기간을 정해 한꺼번에 잡을 수도 있습니다.',{kind:'운영',acts:[{l:'일정 열기',a:'go',v:'league:score'}]}); } }catch(e){} /* 카페 11-14: 60시즌을 해도 몰랐다는 기능을 한 번 알린다 */ const P=gmPlans(); const tm=P[G.day+1];
  if(tm&&!tm.done&&tm.k==='attend'&&!tm.warned)gmAttendWarn(tm);
  /* 우천 순연 등으로 열리지 않은 직관 일정은 취소한다(구단주 동행 한도를 계속 차지하지 않게). 오늘 할 일이 없어도 먼저 정리한다 */
  for(const d in P){ const q=P[d]; if(+d<G.day&&!q.done&&q.k==='attend'){ q.done=true; q.miss=true; if(q.mid){G.mail=G.mail.filter(m=>m.id!==q.mid);G.stops=(G.stops||[]).filter(m=>m.id!==q.mid);} note('일정',`${dmd(+d)} 직관하려던 경기가 열리지 않아 일정을 취소했습니다.`); } }
  /* 앞으로의 직관 중 그 경기가 사라졌거나(시리즈가 일찍 끝남) 상대가 바뀐 예약은 바로 취소(검수 11-09zo) */
  for(const d in P){ const q=P[d]; if(+d>=G.day&&!q.done&&q.k==='attend'&&!gmPlanLive(d,q)){ const L=gmOpsOn(+d); q.done=true; q.miss=true; if(q.mid){G.mail=G.mail.filter(m=>m.id!==q.mid);G.stops=(G.stops||[]).filter(m=>m.id!==q.mid);} note('일정',L.length?`${dmd(+d)} 직관하려던 ${tshort(q.op)}전이 그날 열리지 않고 상대가 ${L.map(tshort).join('·')}(으)로 바뀌어 직관 일정을 취소했습니다. 다시 잡을 수 있습니다.`:`${dmd(+d)} 직관하려던 경기가 열리지 않아(시리즈 종료 등) 직관 일정을 취소했습니다.`); } }
  for(const d in P)if(+d<G.day-40)delete P[d];
  const p=P[G.day]; if(!p||p.done)return;
  if(p.k==='scout'){ p.done=true; gmScoutTrip(p.x); }
  else if(p.k==='school'){ p.done=true; gmSchoolVisit(p.x); } }
/* 2군 관전·방문은 그날 퓨처스 경기가 끝난 뒤(flPlayDay 다음에 부른다). 경기가 열리지 않았으면 훈련장만 둘러본다 */
function gmPlanFarmDaily(){ if(G.unemp)return; const p=gmPlanAt(G.day); if(!p||p.done||(p.k!=='farm'&&p.k!=='fut'))return; p.done=true; const g=flOurGame(G.day); if(g)gmFutWatch(g); else gmFarmVisit(p.k==='fut'); }
/* 직관 경기가 끝난 뒤(applyGame 이후 호출) */
function gmAttendResult(rec){ const p=gmPlanAt(rec.day); if(!p||p.k!=='attend'||p.done)return; if(p.op!=null&&p.op!==(rec.home===G.user?rec.away:rec.home))return; /* 다른 상대 경기로 예약을 쓰지 않는다(검수 11-09zo) */ if(['owner','ceo'].includes(p.x)&&!cwActorMatches(p.x==='ceo'?'ceo':'own',p.tid,p.person)){p.done=true;p.cancelled=gmCompanion(p.x,p.tid??G.user)?'인물 교체':'동행 인물 부재';note('일정','동행할 인물이 자리를 떠나 직관 일정을 불이익 없이 종료했습니다.');return;} if((p.x==='owner'||p.x==='ceo')&&cwStart(rec,p))return; /* 구단주·사장 동석: 동석 관람 대화로 */ p.done=true; const t=team(G.user); const ms=rec.home===G.user?rec.hs-rec.as:rec.as-rec.hs; const L=[];
  const m=G.mgr[G.user]; if(m&&!m.interim){ m.rel=clamp(m.rel+1,0,100); L.push('감독 관계 조금 개선'); } for(const q of playersOf(G.user).filter(q=>q.e1))q.mor=clamp((q.mor??60)+1,0,100); L.push('1군 선수단 기분 조금 상승');
  if(p.x==='owner'){ const d=ms>0?1.5:ms<=-5?-1.5:0; t.trust=clamp(t.trust+d,0,100); L.push(d?`구단주 신뢰 ${d>0?'조금 상승':'조금 하락'}`:'구단주 신뢰 변화 없음');
    const B=bossOf(G.user); const cm=mail('구단주실',`구단주와 함께 본 경기: ${ms>0?'승리':ms<0?'패배':'무승부'}`,`${ms>0?'"오늘 같은 경기를 자주 보고 싶군요. 수고했습니다."':ms<=-5?'"이런 경기를 보여 주려고 날 부른 겁니까?"':'"쉽지 않은 경기였군요. 계속 지켜보겠습니다."'}\n\n${L.join(' · ')}`,{kind:'구단주'}); if(cm&&cm.id)cm.sgid=rec.gid; void B; } /* 중계를 마칠 때까지 감출 소식(검수 11-09zzc #11) */
  else if(p.x==='ceo'){ L.push('사장과 예산 이야기를 나눴습니다'); const b=budget(); if(b.roomGoal<0&&R()<.5){ t.trust=clamp(t.trust+.5,0,100); L.push('사장이 구단주에게 현장 사정을 잘 전해 주기로 했습니다. 신뢰 조금 상승'); } mail('사장실','사장과 함께 본 경기',L.join(' · '),{kind:'구단주'}); }
  else note('일정',`직관을 마쳤습니다. ${L.join(' · ')}.`); }
function gmScoutTrip(reg){ const tn=gmTourn(G.day)||'고교 대회'; const C=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&p.region===reg&&!p.college);
  if(!C.length){ note('스카우트',`${reg} ${tn}을(를) 보고 왔지만 올해 드래프트 후보가 눈에 띄지 않았습니다.`); return; }
  const seen=C.sort(()=>R()-.5).slice(0,Math.min(C.length,ri(5,9))); for(const p of seen)gmObserve(p); const vk=areaVisitAdd(seen); /* 다녀온 권역 정보망이 조금 오른다 */
  /* 단장 눈에 들어온 선수도 실제 잠재력이 아니라 직접 본 평가(오차 포함)로 고른다 */ const ev=new Map(seen.map(p=>{ const rp=scoutReport(p); return [p.id,rp.ofp??rp.cur]; })); const top=[...seen].sort((a,b)=>ev.get(b.id)-ev.get(a.id)).slice(0,3); const gem=seen.find(p=>ev.get(p.id)>=58&&(p.press==null||p.press>30)&&R()<.5);
  if(gem){ gem.gmGem=G.year; (G.shortlist=G.shortlist||[]); if(!G.shortlist.includes(gem.id))G.shortlist.push(gem.id); }
  mail('단장 노트',`${reg} ${tn} 관전`,`직접 본 후보 ${seen.length}명. 이 선수들은 평가 오차가 줄었습니다.\n눈에 들어온 선수: ${top.map(p=>`${p.name}(${posLabel(p)}, ${p.school||p.region})`).join(', ')}${gem?`\n\n눈여겨본 선수: ${gem.name}(${posLabel(gem)}) — 언론 순위는 낮지만 직접 보니 그릇이 커 보입니다. 한두 번 본 인상이라 틀릴 수 있습니다. 관심 명단에 넣었습니다.`:''}`,{kind:'스카우트',acts:[{l:'드래프트 후보',a:'go',v:'transfer:draft'}],ref:gem?gem.id:top[0]&&top[0].id}); }
/* 올해 초와 견준 실제 능력 변화를 말로 */
function gmDirWord(p){ const b=G.ovr0&&G.ovr0.y===G.year?G.ovr0.m[p.id]:null; if(b==null)return '아직 지켜보는 중'; const x=ovr(p)-b; return x>=1.5?'올라오는 중':x>=.5?'조금씩 늘고 있음':x>-.5?'정체':'주춤'; }
/* 코치 평: 실제 툴에서 가장 좋은 것과 가장 약한 것 */
function gmCoachSay(p){ const ks=(p.isP?['stf','ctl','sta']:['con','pow','eye','spd','def']).filter(k=>p.r&&p.r[k]!=null).sort((a,b)=>p.r[b]-p.r[a]); if(!ks.length)return ''; const t=ks[0], l=ks[ks.length-1];
  const g=p.r[t]>=53?GOOD[t]:p.r[t]>=48?`그나마 ${TOOLK[t]}이(가) 낫습니다.`:'아직 눈에 띄는 무기는 없습니다.'; return p.r[l]<47&&BAD[l]?`${g} 다만 ${BAD[l]}`:g; }
function gmFmRel(full){ const c=coachesOf(G.user).fm; if(c&&full)try{ staffRelAdd(c,'coach',G.user,'gm',1); }catch(e){} return c||null; }
function gmFarmVisit(miss){ const d=depth(G.user); const F=[...d.futB,...d.futP].filter(p=>!p.ys); const full=gmFarmFull(); if(full)for(const p of F)p.mor=clamp((p.mor??60)+2,0,100); const fm=gmFmRel(full);
  const best=F.filter(p=>p.age<=24).map(p=>({p,g:potGapEst(p)})).sort((a,b)=>b.g-a.g).slice(0,3).map(x=>x.p);
  const L=[]; if(miss)L.push('보려던 2군 경기가 열리지 않아 훈련장만 둘러봤습니다.'); L.push(full?'2군 선수단 분위기가 조금 밝아졌습니다.':'이달에 자주 와서 선수들이 크게 의식하지 않았습니다.');
  if(best.length)L.push('코치진이 크게 볼 만하다고 꼽은 선수\n'+best.map(p=>`${pidName(p)}: ${gmDirWord(p)}. "${gmCoachSay(p)}"`).join('\n'));
  L.push(`${fm?fm.name+' 2군 감독':'2군 감독'}: "${full?'단장님이 직접 오시니 선수들 눈빛이 다릅니다.':'오셨습니까. 오늘도 훈련은 평소대로 갑니다.'}"`);
  mail('단장 노트','2군 훈련장 방문',L.join('\n\n'),{kind:'육성',ref:best[0]&&best[0].id}); }
/* 우리 2군 경기 관전: 박스스코어로 그날 잘한 선수, 젊은 선수 흐름, 코치 평, 콜업 건의 */
function gmFutWatch(g){ const k=g.h===G.user?'h':'a', S=g.box[k], op=k==='h'?g.a:g.h, my=k==='h'?g.hs:g.as, ot=k==='h'?g.as:g.hs; const P=id=>{ const p=G.players[id]; return p&&!p.flTemp&&p.team===G.user?p:null; };
  const bat=(S.bat||[]).filter(r=>P(r[0])), pit=(S.pit||[]).filter(r=>P(r[0])); const good=[], bad=[];
  for(const r of bat){ const [id,,,,h,rbi,hr,bb,so]=r; const w=hr>=2?'홈런 두 방':hr?'홈런':h>=3?'맹타':h===2?'멀티 히트':rbi>=3?'타점을 쓸어 담음':bb>=2&&h>=1?'출루를 잘 함':null; if(w)good.push({p:P(id),w,s:hr*3+h+rbi*.5}); if(so>=3)bad.push({p:P(id),w:'삼진이 많았음'}); }
  pit.forEach((r,i)=>{ const [id,outs,,rr,er,,so]=r; const sp=i===0; const w=sp?(outs>=18&&er<=2?'선발로 길게 잘 던짐':outs>=15&&er<=3?'선발로 제 몫을 함':null):(outs>=3&&rr===0?(so>=2?'삼진을 섞어 무실점':'무실점으로 막음'):null); if(w)good.push({p:P(id),w,s:outs/3+(sp?0:1)}); if(sp&&er>=5)bad.push({p:P(id),w:'선발로 많이 맞음'}); });
  good.sort((a,b)=>b.s-a.s);
  const ids=[...new Set([...bat.map(r=>r[0]),...pit.map(r=>r[0])])].map(P).filter(Boolean);
  const full=gmFarmFull(); if(full)for(const p of ids)p.mor=clamp((p.mor??60)+3,0,100);
  for(const p of ids){ const f=p.gmFw&&p.gmFw.y===G.year&&p.gmFw.t===G.user?p.gmFw:(p.gmFw={y:G.year,t:G.user,n:0}); f.n=Math.min(3,f.n+1); } /* 직접 본 선수: 잠재력 추정 오차가 조금 준다(ownSd) */
  const fm=gmFmRel(full), fmN=fm?fm.name+' 2군 감독':'2군 감독';
  const yg=ids.filter(p=>p.age<=24).sort((a,b)=>potGapEst(b)-potGapEst(a)).slice(0,3);
  let up=null; try{ const rk=slotRanks(G.user); up=good.map(x=>x.p).find(p=>{ if(!canUp(p))return false; const sl=rk[pSlot(p)]; const w=sl&&sl.ps&&sl.ps.length?Math.min(...sl.ps.map(q=>ovr(q))):0; return ovr(p)-w>=-1; })||null; }catch(e){}
  const res=my>ot?'승리':my<ot?'패배':'무승부'; const L=[`${k==='h'?'홈':'원정'}에서 ${flName(op)} 2군과의 경기를 직접 봤습니다. 결과는 ${res}.`];
  L.push(good.length?'잘한 선수\n'+good.slice(0,4).map(x=>`${pidName(x.p)}: ${x.w}`).join('\n'):'눈에 띄는 활약은 없었습니다.');
  if(bad.length)L.push('아쉬운 선수\n'+bad.slice(0,2).map(x=>`${pidName(x.p)}: ${x.w}`).join('\n'));
  if(yg.length)L.push('젊은 선수 흐름\n'+yg.map(p=>`${pidName(p)}: ${gmDirWord(p)}. 코치 "${gmCoachSay(p)}"`).join('\n'));
  L.push((full?'경기에 나선 선수들 기분이 조금 올랐습니다.':'이달에 자주 와서 선수들이 크게 의식하지 않았습니다.')+' 직접 본 선수들은 잠재력 판단이 조금 더 정확해졌습니다.');
  if(up)L.push(`${fmN}: "${pidName(up)}은(는) 지금 1군 같은 자리 선수와 견줘도 손색없습니다. 콜업을 건의드립니다."`); else L.push(`${fmN}: "${full?'단장님이 보고 계셔서 다들 힘이 났습니다.':'오늘 경기도 기록으로 정리해 올리겠습니다.'}"`);
  mail('단장 노트',`2군 경기 관전: ${flName(op)}전 ${res}`,L.join('\n\n'),{kind:'육성',ref:(up||good[0]&&good[0].p||{}).id,acts:up?[{l:'감독에게 콜업 건의',a:'meetOpen',v:`mgr|use:${up.id}`}]:[]}); }
/* 고교 방문: 그 학교 후보만 깊게. 같은 학교를 다시 가면 효과가 준다 */
function gmSchK(p){ const v=p&&p.gmSchV; if(!v||v.y!==G.year||v.t!==G.user)return 1; return v.n>=3?.68:v.n===2?.72:.8; }
function gmMakeup(p){ initPers(p); const w=k=>mentalRead(p,k).t; return `성실함 ${w('pro')} · 야망 ${w('amb')} · 기질 ${w('temp')}`; }
function gmSchoolVisit(n){ const S=schList()[n]; const C=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&!p.college&&p.school===n);
  if(!S||!C.length){ note('스카우트',`${n}을(를) 찾았지만 올해 드래프트 후보가 남아 있지 않았습니다.`); return; }
  const F=gmFld(), k=F.sch[n]=(F.sch[n]||0)+1, mul=k===1?1:k===2?.5:.25;
  for(const p of C){ gmObserve(p); const v=p.gmSchV&&p.gmSchV.y===G.year&&p.gmSchV.t===G.user?p.gmSchV:(p.gmSchV={y:G.year,t:G.user,n:0}); v.n++; }
  try{ _dcc=null; }catch(e){} /* 스카우트 주장 캐시도 새로 */
  const l0=schRelLbl(schRel(S)); schAdd(S,Math.max(1,Math.round(6*mul))); const l1=schRelLbl(schRel(S)); const c=S.coach;
  const ev=new Map(C.map(p=>{ const rp=scoutReport(p); return [p.id,rp.ofp??rp.cur??0]; })); const L0=[...C].sort((a,b)=>ev.get(b.id)-ev.get(a.id)); const top=L0[0];
  let mem=false; if(top&&k===1&&!(top.gmVis&&top.gmVis.t===G.user&&top.gmVis.y===G.year)&&R()<.35){ top.gmVis={t:G.user,y:G.year}; mem=true; }
  const L=[`${n} 야구부를 찾아 훈련과 연습 경기를 봤습니다.${k===2?' 두 번째 방문이라 새로 알게 된 것은 많지 않았습니다.':k>=3?' 여러 번 와서 더 볼 것이 거의 없었습니다.':''}`];
  L.push('직접 본 후보\n'+L0.map(p=>`${pidName(p)} ${posLabel(p)}`).join(' · ')+'\n이 학교 후보들은 평가가 더 정확해졌습니다.');
  L.push('면담 인상\n'+L0.slice(0,4).map(p=>`${pidName(p)}: ${gmMakeup(p)}`).join('\n'));
  L.push(`${c?c.name+' 감독':'학교 감독'}과 이야기를 나눴습니다. ${l1!==l0?'사이가 한결 가까워졌습니다.':k===1?'조금 더 가까워졌습니다.':'반갑게 맞아 주었습니다.'}`);
  if(mem)L.push(`${pidName(top)}이(가) 단장이 직접 찾아온 것을 오래 기억할 것 같습니다.`);
  mail('단장 노트',`${n} 방문`,L.join('\n\n'),{kind:'스카우트',acts:[{l:'드래프트 후보',a:'go',v:'transfer:draft'}],ref:top&&top.id}); }
/* AI 단장 현장 활동(매달 1일, 4~9월): 고교 권역을 돌아 권역 정보망(areaNet)과 학교 감독 친분을 쌓는다. 우리 출장과 같은 기록·같은 상한. 경기 난수는 쓰지 않는다 */
function gmAiFieldDaily(){ const o=dobj(G.day); if(o.d!==1||o.m<4||o.m>9||!G.teams)return 0; const C=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&!p.college); if(!C.length)return 0; G.areaVisitT=G.areaVisitT||{}; let n=0;
  const by={}; for(const p of C){ const a=areaOf(p); if(a)by[a]=(by[a]||0)+1; } const top=Object.keys(by).sort((a,b)=>by[b]-by[a]);
  for(const t of G.teams){ if(t.id===ME()||!t.gm||t.gm.interim)continue; if(relU('aigf'+G.day,t.id)>=.6)continue; const home=teamArea(t.id); const k=relU('aigfa'+G.day,t.id)<.4&&by[home]?home:top[Math.floor(relU('aigfb'+G.day,t.id)*Math.min(3,top.length))]; if(!k)continue;
    const V=G.areaVisitT[t.id]=G.areaVisitT[t.id]||{}; V[k]=(V[k]||0)+1+(relU('aigfc'+G.day,t.id)<.5?1:0); n++;
    const sc={}; for(const p of C)if(areaOf(p)===k&&p.school)sc[p.school]=(sc[p.school]||0)+1; const sn=Object.keys(sc).sort((a,b)=>sc[b]-sc[a])[0]; if(sn)try{ schAdd(schList()[sn],3,t.id); }catch(e){} }
  return n; }

/* 직관 전날 알림. 구단주 동행은 '구단주 초대·행사' 멈춤 설정을 따른다(검수 11-06) */
function gmAttendWarn(tm){ const d=G.day+1; if(!gmPlanLive(d,tm))return; /* 열리지 않는 경기면 알리지 않는다(검수 11-06) */ tm.warned=true; tm.mid=mail('비서실',`내일 직관: ${(()=>{ const op=tm.op??gmOpsOn(d)[0], g=teamGames(G.user,d,4).find(x=>x.d===d&&x.op===op); return g?`${g.home?'vs':'@'} ${tname(op)}`:'우리 경기'; })()}`,`내일 경기장에 가는 일정입니다${tm.x==='owner'?'. 구단주께서 함께 보십니다':tm.x==='ceo'?'. 사장께서 함께 보십니다':''}. '경기장으로 가기'를 누르면 경기를 처음부터 봅니다.`,{imp:true,kind:'일정',...(tm.x==='owner'?{cat:'owner'}:{}),acts:[{l:'경기장으로 가기',a:'watchPlan',v:String(G.day+1)}]}).id; }
