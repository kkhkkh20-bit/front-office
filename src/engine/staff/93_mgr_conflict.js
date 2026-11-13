/* ===== 감독·구단주는 단장과 다른 인격체(11-12) =====
   단순한 선택 몇 개 안에서, 각자 목표·기억을 가진 사람처럼 움직인다.
   - 감독은 성적이 먼저다: 검증된 선수를 쓰고, 당장 유망주는 잘 안 쓴다(계약이 짧을수록·우승 경쟁 중일수록 더). 육성형 감독이거나 가을야구가 멀어지면 기회를 준다.
   - 시즌 구상(시범경기 직전): 감독이 목표·핵심·유망주 생각·보강 요구를 말한다. 단장이 수정을 요구하면 성향·관계에 따라 받거나, 마지못해 받거나, 거절한다.
     받은 약속은 기용(mcfB)에 들어가고, 지키는지 나중에 안건으로 돌아온다(말로만 받고 안 쓰기도 한다).
   - 주간 회의는 안건이 있을 때만 열린다: 주전 부진·2군 콜업 요구·불펜 과부하(투수코치와 감독 의견 충돌)·선발 공백·구상 약속 점검.
     같은 안건은 상황이 더 나빠지지 않으면 다시 올리지 않는다. 안건이 없으면 회의도 없다.
   - 감독 언론 플레이: 강요·거절당한 기억, 지키지 않은 보강, 연패, 구단주 지원 거절이 쌓이면 기자 앞에서 말한다. 단장의 대응이 관계·여론·구단주 신뢰에 남는다.
   - 감독 해임은 구단주 동의가 있어야 한다(조건부 승인 포함).
   - 구단주: 성적이 나쁘고 신뢰가 낮으면 비용 절감을 요구하고, 홍보형 구단주는 아끼는 선수 기용을 요구한다. 자주·크게 요청하면 더 자주 거절한다(36_relations ownerAsk) */
function mcf(){ const m=G.mgr&&G.mgr[G.user]; const mid=m&&!m.interim?m.id:null; let S=G.mcf; if(!S||S.mid!==mid)S=G.mcf={mid,fav:{},ag:{},plan:null,media:{},fire:null}; S.fav=S.fav||{}; S.ag=S.ag||{}; S.media=S.media||{}; return S; }
function mmem(m){ return m.mem=m.mem||{forced:0,slight:0,kept:0,broke:0,ign:0,warn:0}; }
const mcfOn=()=>!G.unemp&&!G.gameOver&&G.mgr&&G.mgr[G.user]&&!G.mgr[G.user].interim;
/* 감독의 고집: 단장 요구를 받아들이는 정도. 고집(ego)·관계·쌓인 강요·영입 면담 약속(경청)으로 정해진다 */
function mcfReact(m,push){ mgrFix(m); const M=mmem(m); let a=.62-(m.ego-50)/70+(m.rel-60)/90-M.forced*.04-push*.12+(typeof mplOn==='function'&&mplOn('listen')?.25:0); a=clamp(a,.08,.95);
  const u=u01('mcfr'+G.day+':'+(M.forced+M.slight),m.id||m.name); return u<a?'ok':u<a+(1-a)*.55?'half':'no'; }
/* 감독의 당장 성적 압박(하루 한 번 계산): 계약 마지막 해·우승 경쟁·연패면 유망주를 덜 쓴다. 육성형이거나 가을야구가 멀어지면 압박이 없다 */
function mcfStake(){ const S=mcf(); if(S.stk&&S.stk.d===G.day)return S.stk.v; const m=G.mgr[G.user]; let v=0;
  if(m&&!m.interim){ mgrAttr(m); const youthT=(m.youth||50)>=62; let out=false, ct=false; try{ const r=uRank(), g=teamGP(G.user); out=g>=60&&r>=8; ct=teamCtx(team(G.user)).contend; }catch(e){} if(!youthT&&!out)v=(m.yrs<=1?1:0)+(ct?1:0)+(team(G.user).trust<35?.5:0); }
  S.stk={d:G.day,v}; return v; }
/* 기용 가산(우리 구단만): 단장과 합의한 기용(fav, 마지못해 받았으면 절반) + 감독의 '검증된 선수' 선호 */
function mcfB(tid,p){ if(tid!==G.user||!p||G.unemp||!G.mcf)return 0; const S=G.mcf; let v=0; const f=S.fav&&S.fav[p.id]; if(f&&f.until>=G.day)v+=f.v*(f.half?.5:1);
  if(p.age<=23&&(p.svc||0)<=2&&!p.foreign){ const st=mcfStake(); if(st>0)v-=.6*st; } return v; }

/* ---------- 1. 시즌 구상 ---------- */
function mcfPlan(){ if(!mcfOn())return; const m=G.mgr[G.user], S=mcf(); if(S.plan&&S.plan.y===G.year)return; mgrAttr(m); const d=depth(G.user);
  const rk=(()=>{ try{ const L=G.teams.map(t=>({t:t.id,v:teamRating(t.id)})).sort((a,b)=>b.v-a.v); return L.findIndex(x=>x.t===G.user)+1; }catch(e){ return 5; } })();
  const goal=rk<=2?'우승':rk<=5?'가을야구':rk<=7?'5할 승률 이상':'젊은 선수와 함께 버티는 시즌';
  const core=[...d.start].sort((a,b)=>ovr(b)-ovr(a)).slice(0,3), ace=d.sp[0];
  const yng=domestic(G.user).filter(p=>p.age<=23&&!p.ys&&!(p.joinY>G.year)&&!d.start.includes(p)&&!d.sp.includes(p)&&(p.pot||0)>=ovr(p)+6).sort((a,b)=>(b.pot||0)-(a.pot||0))[0]||null;
  const vet=d.start.filter(p=>p.age>=33).sort((a,b)=>ovr(a)-ovr(b))[0]||null;
  const youthT=(m.youth||50)>=62; let need=null; try{ need=mgrNeedRole(G.user); }catch(e){}
  const ask=need?{k:need.k,l:MROLE[need.k].l}:null;
  const prev=S.plan&&S.plan.y===G.year-1?S.plan:null; /* 작년 구상을 기억한다: 같은 유망주·같은 문장을 되풀이하지 않게(플레이 테스트 11-13) */
  S.plan={y:G.year,day:G.day,goal,yng:yng?yng.id:null,vet:vet?vet.id:null,youthT,ask,st:'open',items:[]};
  const V=(k,arr)=>arr[Math.floor(u01('mplan'+G.year+k,m.id||0)*arr.length)%arr.length];
  const again=yng&&prev&&prev.yng===yng.id;
  const nm=`${m.name} 감독`; const lines=[V('g',[`목표는 ${goal}입니다.`,`올해는 ${goal}을(를) 보고 갑니다.`,`솔직히 말씀드리면 ${goal}이(가) 현실적인 목표입니다.`]),
    core.length?V('c',[`타선은 ${core.map(p=>p.name).join('·')} 중심으로 갑니다.`,`${core[0].name}을(를) 축으로 ${core.slice(1).map(p=>p.name).join('·')}이(가) 받쳐 줘야 합니다.`,`방망이는 ${core.map(p=>p.name).join('·')}에게 달렸습니다.`]):'',
    ace?V('a',[`마운드는 ${ace.name}이(가) 앞에서 끌어 줘야 합니다.`,`${ace.name}이(가) 30경기 가까이 버텨 주면 계산이 섭니다.`,`선발은 ${ace.name}부터 시작합니다.`]):'',
    yng?(youthT?V('y',[`${yng.name}(${yng.age}세)은 올해 1군에서 기회를 주겠습니다.`,`${yng.name}(${yng.age}세)을(를) 올해는 써 보겠습니다. 실패해도 경험입니다.`]):again?`${yng.name}은(는) 작년에도 말씀드렸지만, 아직 제 기준에는 못 미칩니다. 올해도 2군에서 시작합니다.`:V('y',[`${yng.name}(${yng.age}세)은 아직입니다. 2군에서 더 만들고, 1군은 검증된 선수로 시작하겠습니다.`,`${yng.name}(${yng.age}세)은 재능은 있는데 아직 1군 투수 공을 못 따라갑니다. 좀 더 보겠습니다.`])):'',
    vet?V('v',[`${vet.name}은(는) 경험을 믿고 쓰겠습니다.`,`${vet.name}은(는) 나이가 있지만 큰 경기에서 필요합니다.`]):'', ask?V('k',[`단장님께 부탁드릴 건 ${ask.l} 한 명입니다. 개막 한 달 반 안에 있으면 시즌이 달라집니다.`,`${ask.l}이(가) 하나 더 있으면 좋겠습니다. 시즌 초에 구해 주시면 감사하겠습니다.`]):'보강 요청은 따로 없습니다.'].filter(Boolean);
  const opts=[{l:'구상대로 갑시다',fx:'관계가 조금 오르고, 보강 요청을 지켜보게 됩니다'}];
  if(yng&&!youthT)opts.push({l:`${yng.name}에게 기회를 주십시오`,fx:'감독 성향·관계에 따라 받거나 마지못해 받거나 거절합니다'});
  if(vet)opts.push({l:`${vet.name} 의존도를 줄이십시오`,fx:'베테랑 기용을 줄여 달라는 요구. 고집 센 감독은 반발합니다'});
  opts.push({l:'감독님께 맡기겠습니다',fx:'간섭하지 않습니다. 관계 소폭 상승'});
  evNew('mplan',`${nm} 시즌 구상`,`${nm}: "${lines.join(' ')}"`,opts,{from:'감독실',def:opts.length-1,exp:6,data:{y:G.year}});}
function mcfPlanPick(e,i){ const m=G.mgr[G.user]; const S=mcf(), P=S.plan; if(!m||m.interim||!P||P.y!==e.data.y)return '감독이 바뀌어 구상이 무효가 됐습니다.'; const l=e.opts[i].l, M=mmem(m);
  if(/구상대로/.test(l)){ m.rel=clamp(m.rel+2,0,100); P.st='agree'; return `${m.name} 감독: "든든합니다. 보강 얘기는 잊지 말아 주십시오." 감독 관계 조금 개선`; }
  if(/맡기겠/.test(l)){ m.rel=clamp(m.rel+1,0,100); P.st='deleg'; return `${m.name} 감독: "믿어 주신 만큼 하겠습니다." 감독 관계 조금 개선`; }
  const yng=/기회를/.test(l), pid=yng?P.yng:P.vet, p=G.players[pid]; if(!p)return '';
  const r=mcfReact(m,1), until=dnum(G.year,12,31);
  if(r==='no'){ m.rel=clamp(m.rel-3,0,100); M.slight++; P.items.push({k:yng?'yng':'vet',pid,st:'no',day:G.day}); return `${m.name} 감독: "${yng?`${p.name}은(는) 아직 1군 감이 아닙니다.`:`${p.name} 같은 선수가 있어야 이깁니다.`} 기용은 제가 책임지겠습니다." 요구를 거절했습니다. 감독 관계 악화`; }
  S.fav[pid]={v:yng?3:-3,until,half:r==='half',why:'plan'}; P.items.push({k:yng?'yng':'vet',pid,st:r,day:G.day,h0:mcfUse(p)});
  if(r==='half'){ m.rel=clamp(m.rel-1,0,100); return `${m.name} 감독: "...알겠습니다. 다만 성적이 떨어지면 다시 이야기하겠습니다." 마지못해 받아들였습니다(기용 반영 절반). 감독 관계 조금 악화`; }
  return `${m.name} 감독: "그렇게 해 보죠. 대신 결과는 같이 책임지시는 겁니다." 받아들였습니다.`; }
/* 출전량(타석·아웃카운트) */
function mcfUse(p){ const h=seasonTotal(p,G.year,'1군'); return h?(p.isP?(h.outs||0):(h.pa||0)):0; }

/* ---------- 2. 안건이 있을 때만 여는 주간 회의 ---------- */
/* 2군에서 올라가고 싶어 하는 선수: 선수 쪽 기능(playerWantsUp)이 있으면 그것을, 없으면 2군 호성적·1군 자리 막힘으로 본다 */
function mcfWantsUp(){ const L=playersOf(G.user).filter(p=>!p.e1&&(typeof canUp!=='function'||canUp(p)));
  if(typeof playerWantsUp==='function'){ let W=[]; try{ W=(playerWantsUp(G.user)||[]).map(x=>x&&x.p).filter(Boolean); }catch(e){} const ids=new Set(W.map(p=>p.id)); return L.filter(p=>ids.has(p.id)&&seasonTotal(p,G.year,'퓨처스')); } /* 선수 쪽 훅: playerWantsUp(tid) → [{p,t,gap,why,weeks,heat}] */
  return L.filter(p=>{ const h=seasonTotal(p,G.year,'퓨처스'); return h&&(p.isP?h.outs>=60&&pRate(h).era<=3.0:h.pa>=60&&bRate(h).ops>=.85); }); }
function mcfAgenda(){ const m=G.mgr[G.user]; const S=mcf(); const X=mgrSit(); const d=depth(G.user); const A=[]; const nm=`${m.name} 감독`; mgrAttr(m);
  /* 주전 부진 */ { const c=X.cold&&X.cold[0]; if(c&&c.h.pa>=80&&bRate(c.h).ops<.6){ const p=c.p, ops=bRate(c.h).ops; const keep=p.age>=30||m.ego>=60; A.push({k:'slump:'+p.id,sc:(.64-ops)*25+1,pid:p.id,t:`${p.name} 부진(OPS ${fmt3(ops)}, ${c.h.pa}타석)`,
      s:`${nm}: "${keep?`${p.name}은(는) 해 온 선수입니다. 곧 올라옵니다. 빼면 더 무너집니다.`:`${p.name} 고민입니다. 단장님 생각은 어떻습니까?`}"`,o:[{l:'2군에서 재정비시키십시오',fx:'말소 지시. 감독이 반발할 수 있습니다',a:'down'},{l:'선발 출전을 줄이십시오',fx:'2주간 기용 순위를 낮춥니다',a:'less'},{l:'감독님 판단대로',fx:'그대로 기용',a:'none'}]}); } }
  /* 2군 콜업 요구 */ { const W=mcfWantsUp().sort((a,b)=>ovr(b)-ovr(a))[0]; if(W){ const h=seasonTotal(W,G.year,'퓨처스'); const want=(m.youth||50)>=62||mcfStake()===0; const line=W.isP?`2군 ${ipStr(h.outs)}이닝 ERA ${pRate(h).era.toFixed(2)}`:`2군 ${h.pa}타석 OPS ${fmt3(bRate(h).ops)}`;
      A.push({k:'up:'+W.id,sc:1.2+(W.age<=24?.4:0),pid:W.id,t:`${W.name} 콜업 요구(${line})`,s:`${W.name} 측이 1군 기회를 원합니다. ${nm}: "${want?'저도 한번 보고 싶습니다.':'지금 1군 자리는 성적 내는 선수 몫입니다. 2군 성적만으로는 모릅니다.'}"`,
        o:[{l:'콜업하십시오',fx:want?'감독도 원하던 일':'감독 뜻을 꺾는 지시. 관계가 떨어질 수 있습니다',a:'up'},{l:'한 주 더 지켜봅시다',fx:'선수 기분이 조금 떨어집니다',a:'wait'},{l:'감독님 판단대로',fx:'감독이 정합니다',a:'none'}]}); } }
  /* 불펜 과부하: 투수코치와 감독 의견 충돌 */ { const P=d.pen.slice(0,4).filter(p=>{ try{ return armRatio(p)>=1.25; }catch(e){ return false; } }).sort((a,b)=>armRatio(b)-armRatio(a))[0]; if(P){ const C=(coachesOf(G.user)||{}); const pc=C.bp||C.pc; const push=(m.pen||50)>=58||(m.arm||50)>=58;
      A.push({k:'pen:'+P.id,sc:1+(armRatio(P)-1.25)*4,pid:P.id,t:`${P.name} 과부하(누적 부하 ${Math.round(armRatio(P)*100)}%)`,s:`${pc?`${CROLE[C.bp?'bp':'pc'].l} ${pc.name}: "${P.name}은(는) 쉬어야 합니다. 이대로면 팔이 탈 납니다."`:''} ${nm}: "${push?`지금 ${P.name} 빼면 경기를 못 잡습니다.`:'저도 걱정입니다만, 대안이 마땅치 않습니다.'}"`,
        o:[{l:pc?'투수코치 의견대로 쉬게 하십시오':'사흘 쉬게 하십시오',fx:push?'감독 관계 조금 악화, 부상 위험 감소':'부상 위험 감소',a:'rest',coach:pc?pc.name:null},{l:'감독님 판단대로',fx:'계속 쓰입니다. 부상 위험이 남습니다',a:'none',coach:pc?pc.name:null}]}); } }
  /* 선발 공백 */ { const inj=(X.inj||[]).find(p=>p.isP&&isSPr(p)); if(inj){ const cand=playersOf(G.user).filter(p=>p.isP&&!p.e1&&(typeof canUp!=='function'||canUp(p))).sort((a,b)=>spV(b)-spV(a))[0];
      A.push({k:'rot:'+inj.id,sc:1.3,pid:inj.id,t:`선발 공백(${inj.name} 부상)`,s:`${nm}: "${inj.name} 자리가 비었습니다. ${cand?`2군에서 ${cand.name}을(를) 올리든지, `:''}불펜으로 버티든지 정해야 합니다."`,
        o:[...(cand?[{l:`${cand.name}을(를) 올리십시오`,fx:'2군 선발 콜업',a:'upsp',cid:cand.id}]:[]),{l:'불펜으로 버티십시오',fx:'불펜 부하가 늘어납니다',a:'none'},{l:'트레이드로 메우겠습니다',fx:'시장에 나온 선발을 알아봅니다',a:'shop'}]}); } }
  /* 구상 약속 점검: 받아 놓고 안 쓰는지 */ { const P=S.plan; if(P&&P.y===G.year&&G.cal&&G.day>=G.cal.open+21)for(const it of P.items){ if(it.st==='no'||it.done)continue; const p=G.players[it.pid]; if(!p||p.team!==G.user){ it.done=true; continue; }
      if(it.k==='yng'){ const u=mcfUse(p)-(it.h0||0); if(u<(p.isP?30:25)){ A.push({k:'plan:'+p.id,sc:1.5+(it.esc||0)*.5,pid:p.id,it,t:`구상 약속 점검: ${p.name} 기용`,s:`개막 전 ${nm}은 ${p.name}에게 기회를 주기로 했지만 지금까지 ${p.isP?ipStr(u)+'이닝':u+'타석'}뿐입니다. ${nm}: "${mcfStake()>0?'지금은 이겨야 할 때입니다.':'기회를 보고 있었습니다.'}"`,
        o:[{l:'약속을 지키십시오',fx:'강하게 요구. 감독 관계 악화, 기용이 확실히 늘어납니다',a:'force'},{l:'성적이 우선입니다. 넘어가죠',fx:'약속을 접습니다',a:'drop'}]}); } } } }
  return A; }
function mcfWeek(){ if(!mcfOn()||period()!=='season'||!G.cal||G.day<G.cal.open+6)return; const S=mcf(); try{ mcfMedia(); }catch(e){} try{ ownMeddle(); }catch(e){}
  if((G.evs||[]).some(e=>!e.done&&e.k==='magd'))return;
  const A0=mcfAgenda().filter(a=>{ const o=S.ag[a.k]; return a.sc>=1&&(!o||G.day-o.d>=35||a.sc>=o.sc*1.3); }).sort((a,b)=>b.sc-a.sc); /* 같은 안건은 4주 안에, 더 나빠지지 않으면 다시 올리지 않는다 */
  if(!A0.length)return; if(S.agLast&&G.day-S.agLast<=7&&A0[0].sc<1.8)return; /* 지난주에 회의했으면 급한 안건만 */ const A=A0.slice(0,A0[1]&&A0[1].sc>=2?2:1); S.agLast=G.day;
  for(const a of A){ S.ag[a.k]={d:G.day,sc:a.sc}; evNew('magd',`주간 회의 안건: ${a.t}`,a.s,a.o.map(x=>({l:x.l,fx:x.fx})),{from:'감독실',def:a.o.length-1,exp:3,data:{a:a.o.map(x=>({a:x.a,cid:x.cid,coach:x.coach})),pid:a.pid,k:a.k,mid:S.mid}}); } }
function mcfOrder(m,push){ const r=mcfReact(m,push), M=mmem(m); if(r==='no'){ m.rel=clamp(m.rel-3,0,100); M.slight++; } else if(r==='half'){ m.rel=clamp(m.rel-1,0,100); M.forced++; } else M.kept++; return r; }
function mcfAgdPick(e,i){ const m=G.mgr[G.user]; const S=mcf(); if(!m||m.interim||S.mid!==e.data.mid)return '감독이 바뀌어 안건이 무효가 됐습니다.'; const o=e.data.a[i]||{}; const p=G.players[e.data.pid]; const nm=`${m.name} 감독`; mgrAttr(m);
  if(o.a==='none'||o.a==='wait'){ if(o.a==='wait'&&p){ p.mor=clamp((p.mor??60)-2,0,100); } if(o.coach){ return `${nm}이 그대로 씁니다. 투수코치 ${o.coach}은(는) 말을 아꼈습니다.`; } m.rel=clamp(m.rel+.5,0,100); return o.a==='wait'?`${p?p.name+' ':''}기분 조금 하락. 다음 주에 다시 봅니다.`:`${nm}: "맡겨 주십시오."`; }
  if(o.a==='shop'){ const L=Object.values(G.players).filter(q=>q.team!=null&&q.team!==G.user&&q.aiListed&&q.isP&&isSPr(q)).sort((a,b)=>spV(b)-spV(a)).slice(0,3); return L.length?`시장에 나온 선발: ${L.map(q=>`${q.name}(${tshort(q.team)})`).join(', ')}. 트레이드 화면에서 확인하세요.`:'지금 매물로 나온 선발은 없습니다. 직접 문의해야 합니다.'; }
  if(!p||p.team!==G.user)return '선수가 우리 구단에 없습니다.';
  const push=o.a==='force'?2:o.a==='rest'&&((m.pen||50)>=58||(m.arm||50)>=58)?1.2:o.a==='up'&&!((m.youth||50)>=62||mcfStake()===0)?1:o.a==='down'&&(p.age>=30||m.ego>=60)?1:.5;
  const r=mcfOrder(m,push); const tag=r==='no'?'거절':r==='half'?'마지못해 수용':'수용';
  if(r==='no'){ if(o.a==='force'){ const it=e.data.k&&S.plan&&S.plan.items.find(x=>'plan:'+x.pid===e.data.k); if(it)it.esc=(it.esc||0)+1; } return `${nm}: "${o.a==='rest'?'선수 상태는 제가 봅니다.':o.a==='up'?'지금 올릴 선수는 없습니다.':'제 판단은 다릅니다.'}" 지시를 거절했습니다. 감독 관계 악화. 이런 일이 쌓이면 밖에서 말이 나옵니다.`; }
  const h=r==='half';
  if(o.a==='down'){ p.e1=false; p.downDay=G.day; try{ entryManage(G.user,false,true); }catch(x){} return `${p.name} 말소(${tag}).`; }
  if(o.a==='less'){ S.fav[p.id]={v:-3,until:G.day+14,half:h,why:'agd'}; return `${p.name} 2주간 선발 출전 축소(${tag}).`; }
  if(o.a==='rest'){ S.fav[p.id]={v:-8,until:G.day+4,half:h,why:'rest'}; if((m.pen||50)>=58||(m.arm||50)>=58)m.rel=clamp(m.rel-2,0,100); return `${p.name} 휴식(${tag}).${o.coach?` 투수코치 ${o.coach}의 의견을 따랐습니다.`:''}`; }
  if(o.a==='up'||o.a==='upsp'){ const q=o.a==='upsp'?G.players[o.cid]:p; if(!q||q.team!==G.user)return ''; if(typeof canUp==='function'&&!canUp(q))return `${q.name}은(는) 지금 올릴 수 없습니다.`; const ent=playersOf(G.user).filter(x=>x.e1); if(ent.length>=entryLimit()){ const d=depth(G.user); const core=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); const out=ent.filter(x=>x.isP===q.isP&&!core.has(x.id)).sort((a,b)=>ovr(a)-ovr(b))[0]; if(out){ out.e1=false; out.downDay=G.day; } else return `1군 엔트리에 자리가 없어 ${q.name}을(를) 올리지 못했습니다(내릴 비핵심 선수가 없음).`; }
    q.e1=true; q.upDay=G.day; S.fav[q.id]=h?{v:-1.5,until:G.day+14,half:false,why:'grudge'}:{v:2.5,until:G.day+21,half:false,why:'up'}; /* 받아들였으면 3주는 1군에서 기회, 마지못해면 조용히 다시 내린다 */ return `${q.name} 콜업(${tag}).${h?' 감독은 올리긴 했지만 중요한 순간에는 잘 쓰지 않을 것 같습니다.':''}`; }
  if(o.a==='force'){ S.fav[p.id]={v:5,until:dnum(G.year,12,31),half:h,why:'force'}; m.rel=clamp(m.rel-4,0,100); mmem(m).forced++; const it=S.plan&&S.plan.items.find(x=>x.pid===p.id); if(it){ it.h0=mcfUse(p); it.esc=(it.esc||0)+1; } return `${nm}: "${h?'...알겠습니다.':'약속은 약속이죠.'}" ${p.name} 기용을 늘립니다(${tag}). 감독 관계 악화.`; }
  if(o.a==='drop'){ const it=S.plan&&S.plan.items.find(x=>x.pid===p.id); if(it)it.done=true; delete S.fav[p.id]; mmem(m).ign++; return `약속을 접었습니다. ${nm}은 단장이 물러섰다고 기억합니다.`; }
  return ''; }

/* ---------- 4. 감독 언론 플레이 ---------- */
function mcfMedia(){ const m=G.mgr[G.user]; if(!m||m.interim)return; const S=mcf(), M=mmem(m); if(S.media.d&&G.day-S.media.d<21)return; const X=mgrSit(); const st=X.streak||0;
  const P=S.plan, askOpen=P&&P.ask&&G.cal&&G.day>G.cal.open+45&&!P.askDone&&!mcfAskMet(P); const refused=grants().filter(g=>g.by==='gm'&&!g.ok&&G.day-(g.d||0)<=60).length;
  const sty=typeof mgrTalkSty==='function'?mgrTalkSty(m):'calm'; const loud=(m.ego-50)/500+(sty==='media'?.05:sty==='fire'?.03:0)-(S.media.hush&&S.media.hush>G.day?.06:0);
  const why=M.forced>=2&&m.rel<55?'meddle':askOpen?'ask':refused&&st<=-3?'support':st<=-5?'thin':m.rel>=78&&st>=4?'praise':null; if(!why)return;
  const p=clamp(.04+loud+(why==='praise'?.03:0)+M.slight*.015+(m.rel<35?.05:0),0,.45); if(R()>=p)return; S.media={d:G.day,why,hush:S.media.hush};
  const nm=`${m.name} 감독`, T={meddle:`"현장 일은 현장에 맡겨 줬으면 한다. 라인업까지 위에서 정하면 감독이 왜 있나."`,ask:`"시즌 전에 ${P&&P.ask?P.ask.l:'보강'}이(가) 필요하다고 말했다. 아직 아무도 오지 않았다."`,support:`"구단 지원이 아쉽다. 있는 선수로 버티는 데도 한계가 있다."`,thin:`"선수층이 얇다. 내가 할 수 있는 건 다 하고 있다."`,praise:`"단장님이 원하는 걸 다 해 주셨다. 이제 우리가 보답할 차례다."`}[why];
  const tone=why==='praise'?2:-3; news('언론',`${nm} ${why==='praise'?'"프런트에 감사"':'작심 발언'}`,`${nm} ${T}`,tone); wire('감독',`${tshort(G.user)} ${nm} ${T}`,{tid:G.user});
  if(why==='praise')return;
  evNew('mmedia',`${nm} 언론 발언 대응`,`${nm}이 기자들 앞에서 말했습니다. ${T} 기자들이 단장의 답을 기다립니다.`,[{l:'공개 반박',fx:'구단 입장은 지킵니다. 감독 관계 크게 하락, 불화설'},{l:'무시',fx:'말이 커지지 않으면 묻힙니다. 여론 소폭 하락'},{l:'공개 지지',fx:'감독 관계 상승. 성적이 계속 나쁘면 구단주가 책임을 묻습니다'},{l:'비공개 경고',fx:'감독 관계 소폭 하락. 고집 센 감독은 오히려 더 시끄러워집니다'}],{from:'홍보팀',def:1,exp:3,data:{why,mid:S.mid}});
  try{ ivRequest('mgr_media',{say:T,why}); }catch(e){} }
function mcfAskMet(P){ if(!P||!P.ask)return true; return playersOf(G.user).some(q=>q.acq&&q.acq.d>=P.day&&roleOk(q,P.ask.k)); }
function mcfMediaPick(e,i){ const m=G.mgr[G.user]; const S=mcf(); if(!m||m.interim||S.mid!==e.data.mid)return ''; prInit(); const t=team(G.user), M=mmem(m); const nm=`${m.name} 감독`;
  if(i===0){ m.rel=clamp(m.rel-7,0,100); G.pr.press=clamp(G.pr.press-2,0,100); t.trust=clamp(t.trust-1,0,100); news('언론',`${tshort(G.user)} 단장, ${nm} 발언 정면 반박`,'프런트와 현장의 불화가 수면 위로 올라왔습니다.',-2); return `집안싸움이 밖으로 새어 나갔습니다. 감독과 사이가 크게 틀어졌고, 언론과 구단주 시선도 조금 차가워졌습니다.`; }
  if(i===1){ G.pr.fan=clamp(G.pr.fan-1,0,100); return `팬 여론 조금 악화. ${nm}은 단장이 답하지 않았다고 기억합니다.`; }
  if(i===2){ m.rel=clamp(m.rel+5,0,100); G.pr.fan=clamp(G.pr.fan+1,0,100); M.slight=Math.max(0,M.slight-1); S.backed={d:G.day,w0:(G.sea.rec[G.user]||{}).w||0,l0:(G.sea.rec[G.user]||{}).l||0}; return `감독 관계 개선, 팬 여론 조금 호전. 단장이 감독과 한배를 탔습니다. 이후 성적은 구단주가 함께 봅니다.`; }
  const loud=m.ego>=68; m.rel=clamp(m.rel-2,0,100); M.warn++; S.media.hush=G.day+(loud?0:45); if(loud){ S.media.d=G.day-14; return `${nm}은 경고를 듣고도 굽히지 않을 기세입니다. 감독 관계 조금 악화.`; } return `${nm}이 당분간 말을 아끼기로 했습니다. 감독 관계 조금 악화.`; }

/* ---------- 5. 감독 해임: 구단주 동의 ---------- */
function mgrFireAsk(){ const m=G.mgr[G.user]; if(!m||m.interim)return {k:'no',msg:'경질할 감독이 없습니다.'}; const S=mcf(); const t=team(G.user); const per=period();
  if(S.fire&&S.fire.k==='ok'&&G.day<=S.fire.until)return S.fire; if(S.fire&&S.fire.k==='cond'&&!S.fire.done&&S.fire.y===G.year&&period()==='season')return S.fire; if(S.fire&&S.fire.k==='cond'&&!S.fire.done){ S.fire.done=true; } /* 시즌이 끝나면 조건부 승인은 만료(코드 리뷰 11-13: 해를 넘겨 영구히 걸림) */
  const tries=(S.fireN&&S.fireN.y===G.year)?S.fireN.n:0; S.fireN={y:G.year,n:tries+1};
  const r=(G.sea&&G.sea.rec&&G.sea.rec[G.user])||{w:0,l:0}; const g=r.w+r.l, wp=g?r.w/g:.5; const rk=uRank(); const hd=m.hD!=null?G.day-m.hD:999; const ow=t.owner;
  let s=(t.trust-50)/100+(per!=='season'?.25:0)+(g>=20&&wp<.45?.3:0)+(g>=20&&rk>=8?.2:0)-(g>=20&&rk<=3?.45:0)-((m.fame||0)>=70?.2:0)-(hd<150?.3:0)-tries*.15-((m.yrs||0)*(m.sal||0)>=3000&&ow==='profit'?.2:0)+(ow==='win'&&wp<.45?.1:0)+((mmem(m).slight+mmem(m).forced)>=4?.1:0);
  if(t.indie)s+=.1; const B=bossOf(G.user);
  if(s>=.35){ S.fire={k:'ok',day:G.day,until:G.day+14,msg:`${B.own.name} 회장이 경질에 동의했습니다. 14일 안에 결정하세요.`}; return S.fire; }
  if(s>=.05&&per==='season'&&(G.cal?(144-g)>=10:true)){ S.fire={k:'cond',y:G.year,day:G.day,g0:g,w0:r.w,n:10,maxW:4,msg:`${B.own.name} 회장: "앞으로 10경기를 보겠소. 그 사이 4승 이하면 동의하겠소." 조건부 승인입니다.`}; return S.fire; }
  t.trust=clamp(t.trust-(tries?2:1),0,100); S.fire={k:'no',day:G.day,done:true,msg:`${B.own.name} 회장이 반대했습니다. "${hd<150?'데려온 지 얼마나 됐다고 또 바꾸자는 거요.':(m.fame||0)>=70?'팬들이 좋아하는 감독이오. 명분이 없소.':rk<=3?'이기고 있는 감독을 왜 자르오.':'지금 바꾼다고 달라질 게 없소.'}" 구단주 신뢰 하락.`}; return S.fire; }
function mgrFireOk(){ const S=G.mcf; return !!(S&&S.fire&&S.fire.k==='ok'&&G.day<=S.fire.until); }
function mcfDaily(){ const S=G.mcf; if(!S||!S.fire||S.fire.k!=='cond'||S.fire.done)return; const F=S.fire; if(F.y!=null&&F.y!==G.year||period()!=='season'){ F.done=true; return; } const r=(G.sea&&G.sea.rec&&G.sea.rec[G.user])||{w:0,l:0}; const g=r.w+r.l; if(g-F.g0<F.n)return; F.done=true; const w=r.w-F.w0; const B=bossOf(G.user);
  if(w<=F.maxW){ S.fire={k:'ok',day:G.day,until:G.day+14,msg:`조건(10경기 4승 이하)이 채워져 ${B.own.name} 회장이 경질에 동의했습니다. 14일 안에 결정하세요.`}; mail('구단주실','감독 경질 동의',S.fire.msg,{imp:true,kind:'구단주',acts:[{l:'감독 화면',a:'go',v:'staff:mgr'}]}); }
  else mail('구단주실','감독 경질 보류',`10경기 ${w}승. ${B.own.name} 회장: "그 정도면 감독을 바꿀 이유가 없소." 경질 요청이 보류됐습니다.`,{kind:'구단주'}); }

/* ---------- 구단주의 간섭 ---------- */
function ownMeddle(){ const t=team(G.user); if(t.indie||!G.cal||G.day<G.cal.open+40)return; const S=mcf(); const B=bossOf(G.user); if(S.own&&S.own.y===G.year)return; const rk=uRank();
  /* 비용 절감 요구: 성적 나쁘고 신뢰 낮을 때. 수익형·긴축 구단주가 더 잘한다 */
  if(rk>=7&&t.trust<48&&!expYr(G.user)&&R()<(t.owner==='profit'?.35:.15)){ S.own={y:G.year,k:'cut'}; evNew('owncut',`${B.own.name} 회장의 비용 절감 지시`,`${B.own.name} 회장: "성적도 안 나는데 돈은 돈대로 나가고 있소. 비용을 줄이시오."`,[{l:'고액 선수를 정리하겠습니다',fx:'30일 안에 상위 연봉 합계를 5% 이상 줄이면 신뢰가 오르고, 못 하면 크게 떨어집니다'},{l:'지원 삭감을 받아들이겠습니다',fx:'올해 모기업 지원 한도가 줄어듭니다'},{l:'지금 줄이면 시즌을 포기하는 겁니다',fx:'구단주 신뢰 하락. 회장이 물러설 수도 있습니다'}],{from:'구단주실',def:1,exp:5,data:{pay0:capPay(G.user)}}); return; }
  /* 아끼는 선수 기용 요구: 홍보형 구단주가 인기 선수·연고 선수를 밀어 달라고 한다 */
  if(t.owner==='pr'&&R()<.2){ const d=depth(G.user); const st=new Set(d.start.map(p=>p.id)); const p=domestic(G.user).filter(q=>!q.isP&&!st.has(q.id)&&healthy(q)&&(q.region===t.region||(q.pop||0)>=60)).sort((a,b)=>(b.pop||0)-(a.pop||0))[0]; if(!p)return; S.own={y:G.year,k:'fav'};
    evNew('ownfav',`${B.own.name} 회장의 기용 요구`,`${B.own.name} 회장: "${p.name} 선수, 팬들이 좋아하는 선수 아니오? 경기에 좀 나오게 하시오."`,[{l:'감독에게 전하겠습니다',fx:'감독에게 기용을 지시합니다. 감독이 반발할 수 있습니다'},{l:'기용은 감독 몫입니다',fx:'구단주 신뢰 조금 하락'}],{from:'구단주실',def:0,exp:5,data:{pid:p.id}}); } }
function ownCutPick(e,i){ const t=team(G.user); const B=bossOf(G.user);
  if(i===0){ evFollow(30,'owncut',{pay0:e.data.pay0}); return '30일 뒤 회장이 연봉 합계를 다시 봅니다.'; }
  if(i===1){ const amt=round5(800*ecoIdx(sponSeason())); t.ownCut={y:sponSeason(),amt}; return `올해 모기업 지원 한도 ${money(amt)} 삭감.`; }
  t.trust=clamp(t.trust-4,0,100); if(R()<.4)return `${B.own.name} 회장: "...그럼 결과로 보여 주시오." 회장이 물러섰습니다. 구단주 신뢰 하락.`; const amt=round5(500*ecoIdx(sponSeason())); t.ownCut={y:sponSeason(),amt}; return `회장이 물러서지 않았습니다. 지원 한도 ${money(amt)} 삭감, 구단주 신뢰 하락.`; }
function ownCutFollow(d,tid){ if(tid!==G.user||G.unemp)return; const t=team(G.user); const B=bossOf(G.user); const now=capPay(G.user); if(now<=d.pay0*.95){ t.trust=clamp(t.trust+3,0,100); mail('구단주실','비용 절감 확인',`${B.own.name} 회장: "약속을 지켰군." 구단주 신뢰 상승.`,{kind:'구단주'}); } else { t.trust=clamp(t.trust-6,0,100); mail('구단주실','비용 절감 약속 불이행',`${B.own.name} 회장: "말만 하고 줄인 게 없소." 구단주 신뢰 크게 하락.`,{imp:true,kind:'구단주'}); } }
function ownFavPick(e,i){ const t=team(G.user); const p=G.players[e.data.pid]; const m=G.mgr[G.user];
  if(i===1){ t.trust=clamp(t.trust-2,0,100); return '구단주 신뢰 조금 하락.'; }
  t.trust=clamp(t.trust+1,0,100); if(!p||!m||m.interim)return '구단주 신뢰 조금 상승.'; const S=mcf(); const r=mcfOrder(m,1); if(r==='no')return `구단주 신뢰 조금 상승. 그러나 ${m.name} 감독이 "위에서 선수를 정해 주는 건 받아들일 수 없다"며 거절했습니다. 감독 관계 악화.`;
  S.fav[p.id]={v:3,until:G.day+30,half:r==='half',why:'own'}; return `구단주 신뢰 조금 상승. ${m.name} 감독이 ${r==='half'?'마지못해 ':''}${p.name} 기용을 늘립니다.`; }

/* ---------- 6. 면담 관계 상승 체감: 자주 할수록·관계가 높을수록 덜 오른다 ---------- */
function mcfRelGain(m,v){ if(!(v>0))return v; const n=(m.tkD||[]).filter(d=>G.day-d<=21).length; const f=1/(1+Math.max(0,n-1)*.45), hi=m.rel>=80?.4:m.rel>=70?.65:1; return Math.round(v*f*hi*2)/2; }

/* 이벤트 처리 등록 */
if(typeof EVH!=='undefined'){ EVH.mplan={pick:(e,i)=>mcfPlanPick(e,i)}; EVH.magd={pick:(e,i)=>mcfAgdPick(e,i)}; EVH.mmedia={pick:(e,i)=>mcfMediaPick(e,i)}; EVH.owncut={pick:(e,i)=>ownCutPick(e,i),follow:(d,tid)=>ownCutFollow(d,tid)}; EVH.ownfav={pick:(e,i)=>ownFavPick(e,i)}; }
if(typeof EV_NAME!=='undefined'){ EV_NAME.magd='주간 회의 안건(감독에게 일임)'; EV_NAME.mplan='감독 시즌 구상'; EV_NAME.mmedia='감독 언론 발언 대응'; EV_NAME.ownfav='구단주 기용 요구'; }
