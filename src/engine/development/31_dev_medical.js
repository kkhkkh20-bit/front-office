/* ===== 일반 훈련과 해외 연수 =====
 일반 훈련: 모든 구단 28세 이하 국내 선수가 시즌 준비~정규시즌 동안 매주 조금씩 큰다. 속도를 정하는 것:
   1군 출장(주전은 훈련 시간이 적어 절반, 대신 겨울 성장에서 출전량으로 보상), 잠재력 여지와 성장 의지(프로의식·야망), 훈련 시설, 코치 수준, 감독의 육성 성향.
   어디에 주안점을 둘지는 감독·코치진이 정하고, 단장이 바꿔 달라고 요청할 수 있다(76_dev_plan.js).
 해외 연수(프로젝트): 돈이 들고, 모든 구단이 보내지는 않는다. 결과가 크게 갈린다(크게 늘어 오는 선수, 그대로인 선수, 다치거나 폼이 흐트러지는 선수).
   실제 운영을 따라 나눴다.
   · 가을 교육리그(구단 단위, 10월 중순~11월 중순): 일본 미야자키 피닉스 교육리그 또는 국내 울산 교육리그. 실전 위주, 결과 차이가 작다.
   · 호주리그 파견(개인, 11월 중순부터 약 10주): 코치·트레이너 동행. 실전이 많고 부상 위험이 조금 있다.
   · 미국 피칭·타격 랩 단기 연수(개인, 12월 약 한 달): 크게 느는 경우가 가장 많지만, 강한 훈련으로 다치는 경우도 가장 많다. 어린 선수일수록 효과가 크다.
   · 일본 대학·연구소 연수(개인, 12월): 투구·타격 메커니즘. 제구·컨택 쪽. */
const DEVP={bat:{l:'타격 집중',k:['con','eye'],P:false,to:'con'},pow:{l:'장타력 강화',k:['pow'],P:false,to:'pow'},run:{l:'주루·수비',k:['spd','def'],P:false,to:'def'},stf:{l:'구위 강화',k:['stf'],P:true,to:'stf'},ctl:{l:'제구 교정',k:['ctl'],P:true,to:'ctl'},sta:{l:'체력·선발 전환',k:['sta'],P:true,to:'sta'}}; /* 예전 2군 연수(저장 호환용): 훈련 방향으로 옮긴다 */
const FALL={jp:{l:'일본 미야자키 교육리그',c:300,d:'일본 프로 구단 2·3군과 한 달 실전. 상대 수준이 높아 효과가 조금 더 큽니다.',g:1.25},ul:{l:'국내 울산 교육리그',c:60,d:'국내에서 여는 가을 리그. 비용이 적고 이동 부담이 없습니다.',g:1}};
const OVS={abl:{l:'호주리그 파견',c:30,fix:100,lim:6,P:['stf','sta'],B:['con','pow'],big:.10,good:.45,inj:.06,form:.05,close:[11,10],go:[11,15],end:[2,1],d:'11월 중순부터 약 10주 호주 프로리그에서 뜁니다. 실전 경기가 많고, 코치·트레이너가 함께 갑니다.'},
  us:{l:'미국 피칭·타격 랩 연수',c:50,fix:100,lim:5,P:['stf','ctl'],B:['pow'],big:.18,good:.30,inj:.11,form:.08,close:[11,30],go:[12,1],end:[1,5],d:'12월 한 달 미국 훈련 시설에서 데이터 기반 훈련을 받습니다. 크게 느는 경우가 가장 많지만 강한 훈련으로 다치는 경우도 가장 많습니다. 어릴수록 효과가 큽니다.'},
  jpl:{l:'일본 대학·연구소 연수',c:30,fix:50,lim:4,P:['ctl'],B:['con','eye'],big:.13,good:.36,inj:.02,form:.10,close:[11,30],go:[12,1],end:[1,5],d:'12월 일본 대학·스포츠과학 연구소에서 투구·타격 메커니즘을 다듬습니다. 다치는 경우는 드물지만 폼을 바꾸다 흐트러지기도 합니다.'}};
function ovsOpen(k){ const d=dobj(G.day); if(d.m<9)return false; if(!k)return Object.keys(OVS).some(x=>ovsOpen(x)); const c=OVS[k].close; return d.m<c[0]||(d.m===c[0]&&d.d<=c[1]); }
function fallOpen(){ const d=dobj(G.day); return d.m===9||(d.m===10&&d.d<=10); }
function ovsElig(p){ return !!p&&!p.foreign&&!p.prospect&&p.age<=30&&!(p.injOut>0)&&!(p.mil&&p.mil.from<=G.day+60&&(p.mil.until||0)>G.day); }
/* 예전 2군 연수 배정은 훈련 방향 요청으로 바꾼다 */
function setDev(id,prog){ if(!prog)return ''; const D=DEVP[prog]; if(!D)return ''; trnSet(id,D.to); return ''; }
/* 연수 참가비 돌려받기: 예약 때 낸 회계연도가 아직 결산 전이면 예정 지출에서 빼고, 이미 결산한 비용이면 환급 수입으로 넣는다 */
function ovsRefund(x){ const o=OVS[x.prog]; if(!o)return 0; const c=x.c??o.c; G.spend=G.spend||{}; if(x.fy==null||x.fy===fyNow())G.spend.dev=Math.max(0,(G.spend.dev||0)-c); else G.spend.devRef=(G.spend.devRef||0)+c; return c; }
const ovsEndD=k=>{ const o=OVS[k]; return dnum(G.year+(o.end[0]<o.go[0]?1:0),o.end[0],o.end[1]); };
function setOvs(id,prog){ const prev=(G.ovs||[]).find(x=>x.pid===id); if(prev&&prev.go)return '이미 떠났습니다.';
  const refund=()=>{ if(prev&&OVS[prev.prog]){ const c=ovsRefund(prev); if(!prog&&c)addLog(`${(G.players[id]||{}).name||'선수'} ${OVS[prev.prog].l} 예약을 취소했습니다. 참가비 ${money(c)}${prev.fy!=null&&prev.fy!==fyNow()?'은 지난 결산에 이미 지출로 잡혀 이번 회계연도 환급 수입으로 돌려받습니다':'은 예정 지출에서 뺐습니다'}.`); } G.ovs=(G.ovs||[]).filter(x=>x.pid!==id); }; /* 떠나기 전에 바꾸거나 취소하면 돌려받는다 */
  if(!prog){ refund(); return ''; } if(prev&&prev.prog===prog)return '';
  /* 새 신청이 되는지 먼저 확인: 안 되면 기존 예약과 비용은 그대로 둔다 */
  const keep=prev?' 기존 예약은 그대로 둡니다.':'';
  const o=OVS[prog], p=G.players[id]; if(!o||!p)return '없는 프로그램입니다.'; if(!ovsOpen(prog))return `${o.l} 신청 기간이 아닙니다(9월 1일~${o.close[0]}월 ${o.close[1]}일).${keep}`; if(!ovsElig(p))return `보낼 수 없는 선수입니다(30세 이하 국내 선수, 부상·입대 예정 제외).${keep}`;
  if((G.ovs||[]).filter(x=>x.prog===prog&&x.pid!==id).length>=o.lim)return `${o.l}은(는) ${o.lim}명까지입니다.${keep}`;
  refund();
  G.ovs.push({pid:id,prog,c:o.c,fy:fyNow()}); G.spend.dev=(G.spend.dev||0)+o.c; addLog(`${p.name}을(를) ${o.l}에 보냅니다(1인 ${money(o.c)}, 동행 코치·직원 비용 ${money(o.fix)}은 출발 때 한 번).`); return ''; }
function setFall(k){ if(!fallOpen())return '가을 교육리그 참가 신청 기간이 아닙니다(9월 1일~10월 10일).'; const y=G.year; const prev=G.fall&&G.fall.y===y?G.fall.k:null; if(prev)G.spend.dev=Math.max(0,(G.spend.dev||0)-FALL[prev].c);
  G.fall={y,k:k||null}; if(!k)return ''; G.spend.dev=(G.spend.dev||0)+FALL[k].c; addLog(`가을 교육리그: ${FALL[k].l} 참가(${money(FALL[k].c)}).`); return ''; }
function devWeek(){ if((G.devProg||[]).length){ for(const x of G.devProg){ const p=G.players[x.pid]; if(p&&p.team===G.user&&DEVP[x.prog])try{ trnSet(p.id,DEVP[x.prog].to); }catch(e){} } G.devProg=[]; } }
/* 일반 훈련(모든 구단): 해마다 한 선수당 능력치 합 +4까지 */
/* 능력치는 0.1 단위로 반올림되므로 아주 작은 주간 성장은 확률로 0.1씩 붙인다(기댓값은 같다) */
function addR(p,k,a){ const t=a*10, f=Math.floor(t); const n=f+(R()<t-f?1:0); const v=clamp(Math.round(p.r[k]*10+n)/10,20,80); const d=v-p.r[k]; p.r[k]=v; return d; }
const TB_YCAP=2, TB_K=.0035; /* 시즌 중 훈련은 몸을 유지하는 정도. 크게 바뀌는 건 스프링·마무리캠프(79_camps.js) */
function tbFactors(p,regSet){ const room=Math.max(0,p.pot-ovr(p)); initPers(p); const m=p.team!=null?mgrOf(p.team):null;
  return {play:regSet&&regSet.has(p.id)?.5:1, room:room>0?clamp(room/8,.2,1):.1, will:persGrowF(p), fac:p.team!=null?facEff(p).g:1, coach:G.coach?coachDevMult(p):1, mgr:m?1+((m.youth||50)-50)/150:1, age:p.age<=23?1:p.age<=25?.8:.5}; }
function trnBase(){ const per=period(); if(per!=='pre'&&per!=='season')return; const regs={};
  for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.prospect||p.joinY>G.year||p.hold||p.age>28||p.injOut>0|| /* 내년 합류·연봉 미계약 선수는 훈련하지 않는다(검수 11-05) */(p.mil&&p.mil.from<=G.day&&p.mil.until>G.day))continue;
    if(!regs[p.team]){ const d=depth(p.team); regs[p.team]=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); }
    if(!p.tg||p.tg.y!==G.year)p.tg={y:G.year,s:0}; if(p.tg.s>=TB_YCAP)continue;
    const f=tbFactors(p,regs[p.team]); const amt=TB_K*f.play*f.room*f.will*f.fac*f.coach*f.mgr*f.age*rnd(.6,1.4); const ks=TRN_TOOLS[trnG(p)]; const cap=Math.max(p.pot,ovr(p))+2;
    const o0=ovr(p); for(const k of ks){ if(p.r[k]>=cap)continue; p.tg.s+=addR(p,k,amt*(ks.length===3?1.6:1)); } if(ovr(p)>Math.max(p.pot,o0)+.05)setOvr(p,Math.max(p.pot,o0)); } } /* 잠재력은 넘을 수 없다 */
/* 연수 결과: 크게 늘거나, 조금 늘거나, 그대로거나, 다치거나 폼이 흐트러진다 */
const jB=w=>{ const c=w.charCodeAt(w.length-1)-0xAC00; return c>=0&&c<11172&&c%28>0; }; const jIGa=w=>w+(jB(w)?'이':'가'), jEulReul=w=>w+(jB(w)?'을':'를');
const OVS_TOOLN={stf:'구위',ctl:'제구',sta:'체력',con:'컨택',pow:'장타',eye:'선구',def:'수비',spd:'주루'};
function ovsForecast(p,o,coachDv){const room=Math.max(0,p.pot-ovr(p)),ag=p.age<=22?1.3:p.age<=25?1:p.age<=27?.75:.5;const inj=clamp(o.inj*clamp((p.inj||.15)/.15,.6,2),0,1),form=Math.min(o.form,1-inj),big=Math.min(o.big*ag*trnLearn(p)*clamp(room/6,.3,1.3)*(1+((coachDv||50)-50)/150),1-inj-form),good=Math.min(o.good,Math.max(0,1-inj-form-big));return {inj,form,big,good,flat:Math.max(0,1-inj-form-big-good)};}
function ovsRoll(p,o,coachDv){const room=Math.max(0,p.pot-ovr(p)),before=Object.fromEntries(o[p.isP?'P':'B'].map(k=>[k,p.r[k]]));const {big,inj,form,good}=ovsForecast(p,o,coachDv);
  const ks=o[p.isP?'P':'B']; const k=ks[Math.floor(R()*ks.length)]; const sc=Math.min(1,room/6+.4); const v0=p.isP?veloOf(p):null; const x=R(); let r;
  if(x<inj){ p.injOut=ri(14,60); delete p.injK; r={t:'inj',k,txt:`훈련 강도를 이기지 못하고 다쳤습니다. 약 ${p.injOut}일 재활이 필요합니다.`}; }
  else if(x<inj+form){ p.r[k]=clamp(p.r[k]-rnd(1,3),20,80); r={t:'form',k,txt:`${jEulReul(OVS_TOOLN[k])} 손보다 폼이 흐트러졌습니다. 다시 잡는 데 시간이 걸립니다.`}; }
  else if(x<inj+form+big){ p.r[k]=clamp(p.r[k]+rnd(4,8)*sc,20,80); p.pot=Math.min(80,p.pot+rnd(1,4)); const v1=p.isP?veloOf(p):null; r={t:'big',k,txt:k==='stf'&&v1>v0?`직구 평균 ${v0}km/h에서 ${v1}km/h로 올라 돌아왔습니다.`:`${jIGa(OVS_TOOLN[k])} 확실히 달라져 돌아왔습니다.`}; }
  else if(x<inj+form+big+good){ for(const kk of ks)p.r[kk]=clamp(p.r[kk]+rnd(1,2.5)*sc*1.4/ks.length,20,80); r={t:'good',k,txt:`${ks.map(z=>OVS_TOOLN[z]).join('·')}에서 성장이 확인됐습니다.`}; }
  else r={t:'flat',k,txt:'큰 변화는 없었습니다.'};
  roundR(p);const after=Object.fromEntries(Object.keys(before).map(k=>[k,p.r[k]]));const changes=Object.keys(before).map(k=>OVS_TOOLN[k]+' '+dv(before[k])+'→'+dv(after[k])).join(' · ');r.txt+=' '+changes+'.';(p.ovsH=p.ovsH||[]).push({y:G.year,k:o.l,t:r.t,before,after,text:r.txt});if(p.ovsH.length>20)p.ovsH.shift();return r; }
function fallRoll(tid,k){ const F=FALL[k]; const L=[]; const ps=domestic(tid).filter(p=>p.age<=25&&!(p.injOut>0)&&!(p.mil&&p.mil.from<=G.day&&p.mil.until>G.day)).sort((a,b)=>ovr(a)-ovr(b)).slice(0,22);
  for(const p of ps){ const ks=TRN_TOOLS[trnG(p)]; const g=rnd(0,.7)*F.g*Math.min(1,Math.max(0,p.pot-ovr(p))/6+.3); for(const kk of ks)p.r[kk]=clamp(p.r[kk]+g*rnd(.5,1.2),20,80);
    if(R()<.04*F.g){ const kk=ks[Math.floor(R()*ks.length)]; p.r[kk]=clamp(p.r[kk]+rnd(2,4),20,80); L.push(`${p.name}(${OVS_TOOLN[kk]})`); } roundR(p); }
  return {n:ps.length,hot:L}; }
/* 다른 구단: 구단마다 육성 투자 성향이 있고, 그해 형편(현금·리빌딩)에 따라 정한다. 안 보내는 구단도 있다 */
function ovsAiPlan(){ const out={fall:{},abl:{},us:{},jpl:{}};
  for(const t of G.teams){ if(t.id===ME())continue; const lean=hn('ovsL',t.id)*.6+(t.mode==='rebuild'?.25:0)+(t.cash>3000?.15:t.cash<0?-.35:0)+N(0,.15);
    const fk=lean>.15?(hn('ovsF',t.id)>0?'jp':'ul'):lean>-.25?'ul':null; if(fk){ out.fall[t.id]=fk; t.cash-=FALL[fk].c; }
    const used=new Set(); const young=domestic(t.id).filter(p=>p.age<=25&&ovsElig(p)).sort((a,b)=>(b.pot-ovr(b))-(a.pot-ovr(a)));
    const pickN=(k,n)=>{ if(n<=0)return; const o=OVS[k]; const L=young.filter(p=>!used.has(p.id)&&(k!=='us'||p.isP||R()<.3)).slice(0,n).map(p=>p.id); if(L.length){ L.forEach(i=>used.add(i)); out[k][t.id]=L; t.cash-=o.c*L.length+o.fix; } };
    pickN('abl',lean>-.1?ri(2,6):0); pickN('us',lean>.25?ri(2,5):0); pickN('jpl',lean>.35&&R()<.5?ri(2,3):0); }
  return out; }
const md=(d,a)=>d.m===a[0]&&d.d===a[1];
/* 이직: 이미 떠난 연수는 그 구단에서 마무리(옛 구단 AI 목록으로 넘김), 출발 전 예약은 옛 구단이 정리. 새 구단이 보낸 연수는 우리 목록으로 이어받는다 */
function ovsHandOff(old,tid){ const A=G.ovsAi=G.ovsAi||{y:G.year,fall:{},abl:{},us:{},jpl:{}}; for(const k of ['abl','us','jpl'])A[k]=A[k]||{};
  for(const x of (G.ovs||[]))if(x.go&&A[x.prog]){ (A[x.prog][old]=A[x.prog][old]||[]).push(x.pid); }
  const N=[]; for(const k of ['abl','us','jpl']){ const L=A[k][tid]||[]; for(const id of L)if(G.players[id]&&G.players[id].team===tid)N.push({pid:id,prog:k,go:true,inh:1}); delete A[k][tid]; } G.ovs=N; }
/* 출발일 재확인: 여전히 우리 소속이고 복무·부상으로 못 가는 상황이 아닌 선수만 떠난다. 못 가는 선수는 예약을 풀고 참가비를 돌려받으며, 남은 선수가 없으면 동행 비용도 없다 */
function ovsGoCheck(k){ const L=(G.ovs||[]).filter(x=>x.prog===k&&!x.go); const out=[]; for(const x of L){ const p=G.players[x.pid]; const enl=p&&p.mil&&p.mil.from!=null&&p.mil.until>G.day&&!p.mil.done&&!p.mil.exempt&&p.mil.from<=ovsEndD(k); const why=!p?'리그를 떠남':p.team!==G.user?`${tshort(p.team)}(으)로 이적`:isAway(p)?'군 복무·대표팀':enl?`연수 기간 중 입대(${dmd(p.mil.from)})`:(p.injOut||0)>14?'부상':null; if(why){ out.push(`${p?p.name:'선수'}: ${why}`); ovsRefund(x); G.ovs=G.ovs.filter(y=>y!==x); } } /* 프로그램 끝나는 날까지의 입대 일정도 본다 */
  if(out.length&&!G.unemp)mail('육성팀',`${OVS[k].l} 출발 전 확인: ${out.length}명 취소`,`${out.join('\n')}\n\n참가할 수 없어 예약을 취소하고 1인 참가비를 돌려받았습니다.`,{kind:'연수'}); return out; }
function ovsFin(k){ const y=G.year; const out=[]; const C=G.coach&&G.coach[G.user]; const cd=C?(k==='abl'?(C.fm||C.fp||{}).dv:(C.pc||{}).dv):50;
  for(const x of (G.ovs||[]).filter(x=>x.prog===k)){ const p=G.players[x.pid]; if(!p||p.team!==G.user)continue; if(milServing(p)||isAway(p)){ out.push(`${p.name}: 연수 도중 입대·차출로 귀국해 결과 없음`); continue; } /* 결과 때도 실제로 참가 중인지 다시 본다 */ const r=ovsRoll(p,OVS[k],cd); out.push(`${p.name}: ${r.txt}`); }
  G.ovs=(G.ovs||[]).filter(x=>x.prog!==k);
  if(out.length&&!G.unemp)mail('육성팀',`${OVS[k].l} 결과`,out.join('\n')+'\n\n연수 결과는 선수마다 크게 갈립니다. 어린 선수, 배우는 속도가 빠른 선수, 더 클 여지가 큰 선수일수록 크게 늘 가능성이 높고, 부상 체질이면 다칠 위험이 큽니다.',{kind:'연수'});
  const A=G.ovsAi&&(G.ovsAi.y===y||G.ovsAi.y===y-1)?G.ovsAi:null; const hot=[];
  if(A&&A[k]){ for(const t in A[k])for(const id of A[k][t]){ const p=G.players[id]; if(!p||p.team!==+t||milServing(p)||isAway(p))continue; /* AI도 복무·차출 중이면 결과 없음 */ const r=ovsRoll(p,OVS[k],50); if(r.t==='big')hot.push(`${tshort(+t)} ${p.name}: ${r.txt}`); else if(r.t==='inj')hot.push(`${tshort(+t)} ${p.name}: 연수 중 부상(약 ${p.injOut}일)`); } A[k]={}; }
  if(hot.length)news('리그',`${OVS[k].l}에서 돌아온 선수들`,hot.slice(0,5).join('\n'),0); }
/* 날짜: 10/11 교육리그 개막 · 11/15 교육리그 결과·호주 출국 · 12/1 미국·일본 연수 출발 · 1/5 미국·일본 결과 · 2/1 호주 결과 */
function tabDaily(day){ const d=dobj(day); const y=G.year;
  if(md(d,[10,11])){ G.ovsAi=ovsAiPlan(); G.ovsAi.y=y; const f=G.ovsAi.fall; const jp=Object.keys(f).filter(t=>f[t]==='jp').map(t=>tshort(+t)), ul=Object.keys(f).filter(t=>f[t]==='ul').map(t=>tshort(+t));
    const me=!G.unemp&&G.fall&&G.fall.y===y&&G.fall.k; if(me==='jp')jp.push(tshort(G.user)); if(me==='ul')ul.push(tshort(G.user)); const rest=G.teams.length-jp.length-ul.length;
    news('리그','가을 교육리그 개막',[jp.length?`일본 미야자키 피닉스 교육리그: ${jp.join(', ')}.`:'',ul.length?`국내 울산 교육리그: ${ul.join(', ')}.`:'',rest>0?`나머지 ${rest}개 구단은 자체 마무리 훈련을 합니다.`:''].filter(Boolean).join(' '),0); }
  if(md(d,[11,15])){ const A=G.ovsAi&&G.ovsAi.y===y?G.ovsAi:null;
    if(A)for(const t in A.fall){ try{ fallRoll(+t,A.fall[t]); }catch(e){} }
    const me=!G.unemp&&G.fall&&G.fall.y===y&&G.fall.k; if(me){ const r=fallRoll(G.user,me); mail('육성팀',`${FALL[me].l} 결과`,`${r.n}명이 ${FALL[me].l}를 마쳤습니다. 대부분 실전 감각을 이어 가는 정도의 작은 성장입니다.${r.hot.length?`\n눈에 띄게 좋아진 선수: ${r.hot.join(', ')}.`:''}`,{kind:'연수'}); }
    const L=A?Object.entries(A.abl).map(([t,ids])=>`${tshort(+t)} ${ids.length}명`):[]; const mine=(G.ovs||[]).filter(x=>x.prog==='abl'); if(mine.length)L.push(`${tshort(G.user)} ${mine.length}명`);
    if(L.length)news('리그','호주리그 파견 선수단 출국',`${L.join(', ')}이(가) 호주 프로리그로 떠났습니다. 약 10주 동안 실전을 치르고 돌아옵니다.`,0); }
  for(const k in OVS)if(md(d,OVS[k].go)){ try{ ovsGoCheck(k); }catch(e){} const mine=(G.ovs||[]).filter(x=>x.prog===k); mine.forEach(x=>x.go=true); if(mine.length)G.spend.dev=(G.spend.dev||0)+OVS[k].fix; }
  if(md(d,[1,5])){ ovsFin('us'); ovsFin('jpl'); }
  if(md(d,[2,1]))ovsFin('abl'); }

/* ===== 부상 방지와 병원 ===== */
const PREV=[{l:'없음',c:0,m:1},{l:'기본',c:500,m:.9},{l:'강화',c:1200,m:.8},{l:'최고 수준',c:2200,m:.7}];
const HOSP={none:{name:'제휴 없음',c:0,rec:0,dx:false,d:'부상 때마다 외부 병원을 이용합니다.'},c:{name:'다온재활병원',c:400,rec:.08,dx:false,d:'재활 위주. 재활 기간이 조금 줄어듭니다.'},b:{name:'청명정형외과',c:700,rec:.12,dx:false,d:'정형외과 전문. 재활 기간이 줄어듭니다.'},a:{name:'새봄스포츠의학센터',c:1500,rec:.25,dx:true,d:'종합 스포츠의학. 재활 기간이 크게 줄고, 정밀 검진으로 선수의 부상 체질을 알려 줍니다.'}};
/* 리그 전체 부상 빈도 보정: 1군·퓨처스를 합쳐 구단당 한 해 10~12건(그중 1군 이탈 7~10건)에 맞춘다. 부상 종류·체질 차이는 그대로 둔다 */
const INJ_RATE=.58;
function injMult(p){ return INJ_RATE*(p.team===G.user?(G.campInj||1)*PREV[G.med.prev].m*(1-facImpact(facOf('weight'))*.05):facAiInj(p.team))*(p.rush&&G.day<=p.rush?3:1)*(p.reInj&&p.reInj.left>0?p.reInj.m:1)*(p.trnF==='sta'?.92:p.trnF==='stf'?1.05:1); } /* 훈련 방향: 체력 집중은 부상이 조금 줄고, 구위 집중은 조금 는다 */
/* 제휴 병원 바꾸기: 새 부상의 재활 기간뿐 아니라, 지금 재활 중인 선수(남은 14일 이상)의 남은 기간에도 그날부터 새 병원 재활 효과를 적용한다(일괄 할인이 아니라 남은 재활 비율만큼). 짧은 부상(14일 미만)은 그대로 */
/* 병원 효과 기준: 병원 배수를 빼낸 '기준 재활 일수'(소수)를 선수에게 보관하고, 병원을 바꿀 때마다 그 기준에서 다시 계산한다.
   그래서 A→B→A로 돌아오면 원래 남은 기간으로 돌아온다(반올림·14일 문턱 때문에 단축이 남던 문제). 기준 이후 다른 일로 남은 기간이 바뀌었으면 지금 값에서 기준을 새로 잡는다 */
const hospF=(k,p)=>{ const f=1-HOSP[k].rec; const I=INJ[p.injK]; return I&&I.d[0]>=240?Math.sqrt(f):f; };
function hospBase(p,o){ const b=p.injB; if(b&&b.h===o&&p.injOut===b.o-(G.day-b.d))return Math.max(0,b.n-(G.day-b.d)/hospF(o,p)); return p.injOut/hospF(o,p); }
function setHospital(k){ if(!HOSP[k])return ''; const o=G.med.hosp||'none'; if(o===k){ G.medSet=true; return ''; } const L=[];
  for(const p of ownedOf(G.user)){ if(!(p.injOut>0))continue; const kept=p.injB&&p.injB.h===o&&p.injOut===p.injB.o-(G.day-p.injB.d); if(!kept&&p.injOut<14){ delete p.injB; continue; } /* 짧은 부상은 그대로(병원을 거쳐 바뀐 기간은 기준에서 되돌린다) */
    const n0=hospBase(p,o); const n=Math.max(1,Math.round(n0*hospF(k,p))); p.injB={n:n0,h:k,o:n,d:G.day}; if(n!==p.injOut){ L.push(`${p.name} ${p.injOut}일 → ${n}일`); p.injOut=n; } }
  G.med.hosp=k; G.medSet=true; addLog(`제휴 병원을 ${HOSP[k].name}(으)로 바꿨습니다.${L.length?` 재활 중인 선수 남은 기간: ${L.join(', ')}.`:''}`); return L; }
function recMult(p){ return p.team===G.user?(1-HOSP[G.med.hosp].rec)*(1-facImpact(facOf('rehab'))*.07):facAiRec(p.team); }
function facWeek(){ const dl=facImpact(facOf('dorm')); if(!dl||G.unemp)return; for(const p of domestic(G.user))if(p.age<=23&&(p.mor??60)<75)p.mor=clamp((p.mor??60)+dl*.3,0,75); }
/* 스카우트 연봉: 재직한 날만큼 쌓는다(결산 직전 해고해도 그해 일한 몫은 비용으로 남고, 막판 채용은 남은 기간만). 기록이 없는 예전 저장은 이번 회계연도 경과분을 지금 인원 기준으로 잡는다 */
function scoutSpent(){ const S=G.spend||{}; if(S.scout!=null)return S.scout; const el=clamp(G.day-(finYearEnd()-365),0,365)/365; return sum((G.scouts||[]).map(s=>s.sal||0))*el; }
function scoutFire(id){ const s=(G.scouts||[]).find(x=>x.id===id); if(!s)return ''; G.spend=G.spend||{}; G.spend.scout=scoutSpent(); G.scouts=G.scouts.filter(x=>x.id!==id); addLog(`스카우트 ${s.name}와(과) 계약을 끝냈습니다. 올해 일한 기간 연봉(${money(Math.round(s.sal*clamp(G.day-(finYearEnd()-365),0,365)/365))} 안팎)은 그대로 비용에 남습니다.`); return s.name; }
function dailyCost(){ try{ smCheck(); }catch(e){} const m=G.mgr[G.user]; if(m)G.spend.mgr+=m.sal/365; G.spend.scout=scoutSpent()+sum((G.scouts||[]).map(s=>s.sal||0))/365; if(G.coach)G.spend.coach=(G.spend.coach||0)+coachSal(G.user)/365; G.spend.med+=PREV[G.med.prev].c/365; G.spend.hosp+=HOSP[G.med.hosp].c/365; G.spend.intl=(G.spend.intl||0)+sum(Object.keys(IREG).map(r=>INET[intlLv(r)].c))/365; G.spend.fac=(G.spend.fac||0)+facUpkeep()/365; G.spend.data=(G.spend.data||0)+anaSal()/365;
  try{ facDaily(); }catch(e){} try{ aiFacDaily(); }catch(e){}
  if(G.fac&&G.fac.build&&G.day>=G.fac.build.done){ G.fac.lv=G.fac.build.lv; G.fac.build=null; mail('육성팀','훈련 시설 완공',`훈련 시설이 ${FAC[G.fac.lv].l}(${G.fac.lv}단계)로 완공되었습니다. 다음 겨울 성장부터 반영됩니다.`,{kind:'일반'}); } }

