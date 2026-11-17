/* ===== 플레잉코치: 베테랑 선수가 뛰면서 보조 코치 한 자리를 맡는다 =====
 자격: 33세 이상 국내 선수, 지금 구단에서 3시즌 이상(obCareer: OB와 같은 구단 경력 셈), 지도자 의향(프로의식·충성심)이 있는 선수. 제안은 비시즌(스토브리그·시즌 준비)에만.
 수락: 의향이 클수록, 감독과 사이(선수-감독 관계)가 좋을수록 받고, 팀 연봉 비중이 큰 선수는 경기에 집중하겠다며 거절하기 쉽다.
 능력: 은퇴 OB와 같은 식(obSkDv: 통산 WAR·포수 출신·프로의식·충성심). 선수 능력치는 그대로다.
 효과: 같은 육성력 보조 코치(axBoost)의 절반, 자기 쪽(투수/야수) 선수만, 그해 주전(400타석·100이닝)이면 ×0.7. 본인 성장·경기에는 영향이 없다.
 자리: 보조 코치 자리(axSlots) 하나를 쓰고 한 구단에 한 명까지(겹쳐 쌓기 방지). 수당(연 1,000~2,000만)은 코치진 연봉에만 들어가고 선수 연봉은 그대로다.
 끝: 은퇴하면 그 구단 코치로 바로 전환(빈 정식 보직 → 보조 코치 자리 → 자리가 없으면 OB 후보), 방출·이적·FA로 떠나면 역할이 끝난다.
 AI 구단도 같은 규칙(12월 10일, 같은 수락 식). 기록: G.pcoach[pid]={tid,isP,sk,dv,sal,y,d,name} */
const PC_AGE=33, PC_YS=3, PC_WILL=12.5, PC_MAX=1, PC_FX=.5, PC_REG=.7;
function pcMap(){ return G.pcoach=G.pcoach||{}; }
/* 지금 그 구단 플레잉코치인가(떠났으면 기록이 남아 있어도 아니다) */
function pcLive(p){ const r=p&&G.pcoach&&G.pcoach[p.id]; if(!(r&&p.team===r.tid))return null; r.isP=!!p.isP; return r; } /* 맡는 쪽(투수/야수)은 지금 포지션을 따른다: 투수로 바꾼 야수 플레잉코치는 투수를 맡는다(검수 11-17 #276). 기록도 지금 포지션으로 맞춘다(같은 값이면 그대로) */
/* 지금 코치로 일하는가: 계약 시즌(r.y)이 왔고 군 복무 중이 아니다. 다음 시즌부터 맡는 계약은 수당·성장 효과가 그 시즌부터(검수 11-17 #273·#274), 복무 중이면 멈춘다(#275). 자리는 계속 차지한다 */
function pcWorking(p,r){ return !!(p&&r)&&!((r.y||0)>G.year)&&!(typeof milServing==='function'&&milServing(p)); }
function pcIdleTxt(p,r){ if(!p||!r)return ''; if((r.y||0)>G.year)return `${r.y} 시즌부터`; if(typeof milServing==='function'&&milServing(p))return '군 복무 중 · 지도 쉼'; return ''; }
function pcOf(tid){ const out=[]; for(const id in (G.pcoach||{})){ const r=G.pcoach[id], p=G.players[id]; if(p&&r.tid===tid&&p.team===tid){ r.isP=!!p.isP; out.push({p,r}); } } return out; }
function pcN(tid){ return pcOf(tid).length; }
function pcSalOf(tid,now){ return sum(pcOf(tid).filter(x=>!now||pcWorking(x.p,x.r)).map(x=>x.r.sal||0)); } /* now: 오늘 실제로 나가는 수당(계약 시즌 전·군 복무 중 제외) */
/* 남은 보조 코치 자리: 정원 - 보조 코치 - 플레잉코치 */
function axRoom(tid){ return axSlots(tid)-axOf(tid).length-pcN(tid); }
/* 지도자 의향: 프로의식이 중심, 충성심이 조금. 같은 선수면 같은 값 */
function pcWill(p){ initPers(p); const P=p.pers; return P.pro+(P.loy-10)*.25+hn('pcw',String(p.id))*1.5; }
function pcAbility(p){ initPers(p); const O=obCareer(p,null); return obSkDv(O.war,!p.isP&&p.pos==='C',p.pers,(sd,k)=>hn('pc'+k,String(p.id))*sd); }
function pcSal(d){ return clamp(Math.round((10+Math.max(0,d-50)*.5)/5)*5,10,20); }
/* 그해 주전인가: 시즌 준비 기간(1~3월)은 지난 시즌, 그 밖에는 올해 1군 기록 */
function pcRegular(p){ const y=period()==='pre'?G.year-1:G.year; let h=null; try{ h=seasonTotal(p,y,'1군'); }catch(e){} return !!h&&(p.isP?(h.outs||0)>=300:(h.pa||0)>=400); }
function pcOffWin(){ const k=period(); return k==='off'||k==='pre'; }
function pcSeason(){ return period()==='off'?G.year+1:G.year; }
/* 제안할 수 없는 이유(없으면 '') */
function pcWhy(p,tid){ if(!p||p.team==null)return '소속 선수가 아닙니다.'; tid=tid??p.team; if(p.team!==tid)return '그 구단 선수가 아닙니다.';
  if(p.foreign)return '외국인 선수는 맡을 수 없습니다.'; if(typeof milServing==='function'&&milServing(p))return `${p.name}은(는) 군 복무 중이라 맡을 수 없습니다.`; if(p.joinY>G.year||p.prospect)return '아직 입단 전입니다.'; if(pcLive(p))return `${p.name}은(는) 이미 플레잉코치입니다.`;
  if(p.age<PC_AGE)return `${PC_AGE}세 이상만 맡을 수 있습니다.`; if(!pcOffWin())return '비시즌에만 제안할 수 있습니다.';
  if(p.pcNo===pcSeason())return '이번 겨울에는 이미 거절했습니다.';
  if(pcN(tid)>=PC_MAX)return '플레잉코치는 한 구단에 한 명까지입니다.';
  if(axRoom(tid)<=0)return axSlots(tid)?'보조 코치 자리가 모두 찼습니다.':'보조 코치 자리가 없습니다(세부 훈련 시설 4단계부터).';
  if(obCareer(p,null).ys<PC_YS)return `이 구단에서 ${PC_YS}시즌 이상 뛴 선수만 맡을 수 있습니다.`; return ''; }
/* 선수의 대답: 의향·감독과 사이·연봉 비중 */
function pcAnswer(p,tid){ const why=pcWhy(p,tid); if(why)return {ok:false,why,hard:true};
  const will=pcWill(p); if(will<PC_WILL)return {ok:false,why:'"아직 지도자 생각은 없습니다. 선수로만 뛰겠습니다."',k:'will'};
  const m=G.mgr&&G.mgr[tid], mk=m&&!m.interim?relKeyOf(m,'mgr'):null; let rel=0; try{ rel=mk?relVal('pl:'+p.id,mk):0; }catch(e){}
  let pay=0; try{ pay=capPay(tid); }catch(e){} const share=pay>0?(p.sal||0)/pay:0;
  const fW=(will-PC_WILL)*.5, fR=clamp(rel/20,-5,2), fS=-Math.max(0,share-.06)*30, s=.5+fW+fR+fS;
  if(s>=0)return {ok:true,s};
  return fR<fS?{ok:false,s,k:'mgr',why:'"감독님과 생각이 달라 코치 일은 어렵겠습니다."'}:{ok:false,s,k:'sal',why:'"연봉 받는 만큼 지금은 경기에만 집중하겠습니다."'}; }
function pcStart(p,tid){ const a=pcAbility(p); const r={tid,isP:!!p.isP,sk:a.sk,dv:a.dv,sal:pcSal(a.dv),y:pcSeason(),d:G.day,name:p.name}; pcMap()[p.id]=r;
  try{ story(p,`${tshort(tid)} 플레잉코치(${r.isP?'투수':'야수'}) 겸임`,'move'); }catch(e){}
  if(tid!==G.user||G.unemp)wire('코치',`${tshort(tid)} ${p.name}, 플레잉코치 겸임`,{tid,ref:p.id}); return r; }
/* 우리 구단: 선수 화면 '플레잉코치 제안' */
function pcOffer(pid){ if(G.unemp)return {ok:false,msg:'구단을 맡고 있지 않습니다.'}; const p=G.players[pid]; if(!p||p.team!==G.user)return {ok:false,msg:'우리 선수가 아닙니다.'};
  const A=pcAnswer(p,G.user); if(!A.ok){ if(!A.hard)p.pcNo=pcSeason(); return {ok:false,msg:A.hard?A.why:`${p.name}: ${A.why}`}; }
  const r=pcStart(p,G.user); addLog(`${p.name}이(가) 플레잉코치(${r.isP?'투수':'야수'})를 맡았습니다.`);
  return {ok:true,msg:`${p.name}이(가) 플레잉코치(${r.isP?'투수':'야수'})를 맡습니다. 지도 ${dv(r.sk)} · 육성 ${dv(r.dv)} · 수당 연 ${money(r.sal)}.`}; }
/* 역할 끝: why(이름)는 '○○이(가) 방출돼'처럼 이유 앞말. quiet면 소식 없이 */
function pcEnd(pid,why,quiet){ const M=G.pcoach, r=M&&M[pid]; if(!r)return ''; delete M[pid]; const p=G.players[pid], nm=p?p.name:(r.name||'선수');
  if(!quiet&&r.tid===G.user&&!G.unemp)mail('운영팀',`${nm} 플레잉코치 역할 종료`,`${typeof why==='function'?why(nm):why} 플레잉코치 역할이 끝났습니다. 보조 코치 자리 하나가 비었습니다.`,{kind:'코치'}); return nm; }
function pcStop(pid){ const p=G.players[pid]; if(!p||!pcLive(p)||p.team!==G.user||G.unemp)return '플레잉코치가 아닙니다.'; pcEnd(pid,'',true); addLog(`${p.name}의 플레잉코치 역할을 끝냈습니다.`); return ''; }
/* 매일: 떠난 선수(방출·FA·이적·해외)의 역할을 끝낸다 */
function pcSweep(){ const M=G.pcoach; if(!M)return; for(const id of Object.keys(M)){ const r=M[id], p=G.players[id]; if(p&&p.team===r.tid)continue;
    const how=!p?'리그를 떠나':p.team==null?(p.relT===r.tid&&G.day-(p.relD??-1e9)<=30?'방출돼':'팀을 떠나'):`${tshort(p.team)}(으)로 이적해`; pcEnd(id,nm=>`${nm}이(가) ${how}`); } }
/* 보조 코치 자리가 줄면(시설 단계 하락) 돈이 드는 보조 코치보다 플레잉코치를 먼저 푼다 */
function pcTrim(tid){ for(const x of pcOf(tid)){ if(axOf(tid).length+pcN(tid)<=axSlots(tid))break; pcEnd(x.p.id,nm=>`보조 코치 자리가 줄어 ${nm}의`); } }
/* 성장 보탬(axBoost에 더한다): 같은 쪽 선수만, 본인은 빼고 */
function pcAxBoost(p){ if(p.team==null||!G.pcoach)return 0; let b=0; for(const {p:q,r} of pcOf(p.team)){ if(q.id===p.id||!!q.isP!==!!p.isP||!pcWorking(q,r))continue; b+=clamp((r.dv-50)/800,0,.025)*PC_FX*(pcRegular(q)?PC_REG:1); } return b; }
/* 은퇴: OB 길은 지도자로 정해져 있고, 그 구단 코치로 바로 간다(능력 그대로) */
function pcRetire(ob,p,r){ const tid=r.tid; if(G.pcoach)delete G.pcoach[p.id]; ob.sk=r.sk; ob.dv=r.dv; ob.path='coach'; ob.readyY=G.year; ob.log.push({y:G.year,t:`${tshort(tid)} 플레잉코치에서 코치로`});
  if(!G.coach||!G.coach[tid])return null; const mine=tid===G.user&&!G.unemp, C=G.coach[tid];
  const mk=role=>{ const c=obCoach(ob); c.role=role; c.ab=obAb(ob,role); coachSync(c); c.sk=r.sk; c.dv=r.dv; c.car=`${tshort(tid)} 플레잉코치 출신 · 통산 WAR ${ob.war}`; return c; };
  const told=(t,b)=>{ if(mine)mail('운영팀',t,b,{kind:'코치'}); };
  r.isP=!!p.isP; const roles=r.isP?['pc','bp','fp','rs']:ob.pos==='포수'?['cc','fc']:['bc','ab','fb','rb'], k=roles.find(x=>C[x]===null);
  if(k){ const c=mk(k); staffCt(c,2,ctStartS()); C[k]=c; try{ obTaken(ob.id,c); }catch(e){} staffHistory('coach',c,'선임',tid,`플레잉코치에서 ${CROLE[k].l}`);
    told(`${ob.name}, 은퇴 후 ${CROLE[k].l}로`,`플레잉코치 ${ob.name}이(가) 은퇴하고 비어 있던 ${CROLE[k].l} 자리를 맡습니다. 지도 ${dv(c.sk)} · 육성 ${dv(c.dv)} · ${c.yrs}년 연 ${money(c.sal)}.`); return c; }
  const X=mine?(G.coachX=G.coachX||[]):(orgOf(tid).coachX=orgOf(tid).coachX||[]);
  if(X.length<axSlots(tid)){ const c=mk(r.isP?'pc':ob.pos==='포수'?'cc':'bc'); staffCt(c,2,ctStartS()); c.ax=true; X.push(c); try{ obTaken(ob.id,c); }catch(e){} staffHistory('coach',c,'보조 코치 영입',tid,'플레잉코치에서 전환');
    told(`${ob.name}, 은퇴 후 보조 코치로`,`플레잉코치 ${ob.name}이(가) 은퇴하고 보조 ${r.isP?'투수':'타격'}코치로 남습니다. 지도 ${dv(c.sk)} · 육성 ${dv(c.dv)} · ${c.yrs}년 연 ${money(c.sal)}.`); return c; }
  if(mine){ const c=mk(r.isP?'pc':ob.pos==='포수'?'cc':'bc'); c.sal=round5(c.sal*.8); c.res=G.user; G.cmarket=(G.cmarket||[]).filter(x=>x.ob!==ob.id); G.cmarket.unshift(c);
    told(`${ob.name}, 은퇴 후 코치 후보로`,`플레잉코치 ${ob.name}이(가) 은퇴했지만 비어 있는 코치 자리가 없습니다. 코치 후보 맨 앞(우선 협상, 연 ${money(c.sal)})에 올렸습니다.`); }
  return null; }
/* AI 구단: 12월 10일, 보조 코치 자리가 비면 자격 있는 베테랑에게 같은 식으로 제안 */
function pcAiYear(){ if(!G.teams||!G.coach||G.pcAiY===G.year)return; G.pcAiY=G.year; const me=ME();
  for(const t of G.teams){ if(t.id===me||pcN(t.id)>=PC_MAX||axRoom(t.id)<=0||R()>.6)continue;
    const L=playersOf(t.id).filter(p=>p.age>=PC_AGE&&!p.foreign&&!pcWhy(p,t.id)).map(p=>({p,a:pcAbility(p)})).sort((x,y)=>y.a.dv-x.a.dv).slice(0,3);
    for(const x of L){ if(pcAnswer(x.p,t.id).ok){ pcStart(x.p,t.id); break; } x.p.pcNo=pcSeason(); } } }
function pcDaily(){ try{ pcSweep(); }catch(e){} const o=dobj(G.day); if(o.m===12&&o.d===10)try{ pcAiYear(); }catch(e){} }
