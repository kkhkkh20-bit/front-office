/* 개인 지갑은 구단 재정과 분리한다. 월급 선지급은 결산 때 중복 지급하지 않는다. */
/* fx: 활동 효과 수치. 엔진 계산과 화면 효과 칩이 함께 읽는다(이름은 PL_FX_L) */
const PL_FX_L={bond:'친밀도',mor:'선수 기분',mgr:'감독 관계',fan:'팬 여론',loy:'스카우트 충성도',press:'언론 논조',ob:'OB 친분',rep:'명성',rel:'거래 관계',study:'실무 교육',sch:'고교 감독 친분',own:'구단주 친밀도',trust:'구단주 신뢰'};
const PERSONAL_ACT={chat:{l:'차 한잔·안부',cost:0,days:7,bond:1,fx:{mor:.5}},meal:{l:'선수와 식사',cost:2,days:7,bond:4,fx:{mor:1}},rehab:{l:'재활 선수 방문',cost:1,days:7,bond:3,fx:{mor:1}},study:{l:'단장 실무 교육',cost:15,days:30,fx:{study:1}},community:{l:'지역 야구 봉사·기부',cost:5,days:60,fx:{rep:1}},network:{l:'다른 단장과 식사',cost:4,days:14,bond:3,fx:{rel:1}},
  team:{l:'선수단 회식(사비)',cost:8,days:45,fx:{mor:2,mgr:1}},fan:{l:'팬 이벤트 사비 후원',cost:15,days:90,fx:{fan:2}},scout:{l:'스카우트 출장비 보태기',cost:5,days:30,fx:{loy:3}}}; /* 봉사 60일·회식 45일·팬 후원 90일(11-13 조절) */
/* 생활 등급(집·차): 한 번 올리면 내려가지 않는다. 효과는 체면뿐(구단주와 친밀도 +1, 단장 카드 표시). 매달 유지비·야인 생활비는 LIVE_UP·LIVE_UNEMP(11-09) */
const LIFE_FX={own:1};
const PERSONAL_LIFE=[{l:'원룸 · 대중교통'},{l:'전세 아파트 · 중형차',cost:30},{l:'신축 아파트 · 대형 세단',cost:100},{l:'한강뷰 아파트 · 수입차',cost:300}];
function personalLifeUp(){ if(G.unemp)return '지금은 할 수 없습니다.'; const S=personalState(), lv=S.life||0, N=PERSONAL_LIFE[lv+1]; if(!N)return '이미 가장 높은 생활 등급입니다.'; if(S.cash<N.cost)return `개인 잔액이 부족합니다(${money(N.cost)} 필요). 구단 돈은 사용하지 않습니다.`;
  S.cash-=N.cost; S.spent+=N.cost; S.life=lv+1; const ind=team(G.user).indie; if(!ind)cwRapAdd('own',LIFE_FX.own); const text=`생활 등급: ${N.l}.${ind?' 모기업이 없는 구단이라 구단주 친밀도는 그대로입니다.':` 구단주가 "단장이 체면은 서야지" 합니다. 구단주 친밀도 상승.`}`; /* 독립구단은 친밀도를 올리지 않으므로 안내도 빼기(검수 11-09zc) */ S.history.unshift({day:G.day,text,amount:-N.cost}); S.history.length=Math.min(S.history.length,40); return text; }
function personalState(){if(!G.personal)G.personal={cash:Math.max(0,G.myC?.earn||0),spent:0,advance:{},settled:{},months:{},last:{},contacts:{},history:[],study:0};const S=G.personal;for(const k of ['advance','settled','months','last','contacts'])S[k]=S[k]||{};S.history=S.history||[];return S;}
function personalSalary(amount,why){const S=personalState();S.cash+=amount;S.history.unshift({day:G.day,text:why,amount});S.history.length=Math.min(S.history.length,40);}
function personalMonthlyPay(){if(G.unemp)return;const C=myCInit();if(!C||C.tid!==G.user)return;const S=personalState(),o=dobj(G.day),key=o.y+':'+o.m;if(S.months[key])return;S.months[key]=true;const year=fyNow(),ak=year+':'+C.tid;if(S.settled[year]||year<C.y0||year>C.y1)return;/* 계약이 덮지 않는 회계연도(만료 뒤·시작 전)는 월급이 없다(검수 11-09zb) */const paid=S.advance[ak]??S.advance[year]??0,amount=Math.max(0,Math.min(Math.round(C.sal/12),C.sal-paid));if(amount){S.advance[ak]=paid+amount;delete S.advance[year];/* 선지급은 계약(구단)별로 센다: 이직 전 구단에서 받은 월급이 새 구단 연봉 정산에서 빠지지 않게(검수 11-06). 옛 저장의 연도 키는 지금 계약 것으로 본다 */personalSalary(amount,'단장 월급');}}
function personalSettle(amount){const S=personalState(),year=fyNow();if(S.settled[year])return;const ak=year+':'+(myCInit()||{}).tid,advance=S.advance[ak]??S.advance[year]??0;S.settled[year]=true;personalSalary(Math.max(0,amount-advance),'단장 연봉 잔액 정산');for(const k in S.advance)if(k===String(year)||k.startsWith(year+':'))delete S.advance[k];}
function friendshipScore(p){return G.personal?.contacts?.['pl:'+p.id]?.bond??30;}
function friendshipLabel(p){const n=friendshipScore(p);return n>=75?'각별한 사이':n>=55?'마음을 여는 사이':n>=40?'친근한 사이':n>=25?'알아가는 중':'거리를 두는 사이';}
function personalAdvice(p,kind){const lv=G.personal?.study||0;if(!lv||p.team!==G.user)return [];const lines=[];
 if(kind==='contract'){lines.push(`현재 연봉은 ${money(p.sal)}입니다. 연장 계약은 한 시즌 성적과 남은 보유 기간을 함께 보세요.`);if(lv>=2){const peers=Object.values(G.players).filter(q=>q.team!=null&&!q.prospect&&q.isP===p.isP&&Math.abs(q.age-p.age)<=2&&q.sal>0).map(q=>q.sal).sort((a,b)=>a-b);const n=peers.length,med=n%2?peers[(n-1)/2]:(peers[n/2-1]+peers[n/2])/2;/* 짝수면 가운데 두 값의 평균(검수 11-09zc) */if(n)lines.push(`같은 투타 구분·비슷한 나이 선수 ${n}명의 연봉 중앙값은 ${money(med)}입니다. 성적과 역할이 같다는 뜻은 아닙니다.`);}if(lv>=3)lines.push(p.age>=31?'장기 계약은 후반부 기량 하락과 방출 비용까지 검토하세요.':'주전 기회가 제한되면 보유 기간이 길어도 육성 계획을 먼저 세우세요.');if(lv>=4)lines.push(p.injOut>0?`현재 ${p.injOut}일 재활이 남았습니다. 복귀 이후 상태를 보고 계약 규모를 판단하세요.`:'부상 이력과 최근 출장량을 계약 화면에서 함께 확인하세요.');if(lv>=5)lines.push('같은 포지션의 대체 선수와 다음 시즌 고정 지출을 비교한 뒤, 필요한 역할에 맞는 기간과 연봉을 제안하세요.');}
 else {lines.push('해외연수는 프로그램마다 목표 능력이 다릅니다. 현재 약점과 다음 시즌 맡길 역할에 맞춰 고르세요.');if(lv>=2)lines.push('선수당 비용에 프로그램 공통 비용이 더해집니다. 여러 명을 보낼 때도 공통 비용은 프로그램별로 계산합니다.');if(lv>=3)lines.push('개별 연수 화면의 성장·부상 확률은 이 선수와 담당 코치 기준입니다. 높은 확률도 성공을 보장하지는 않습니다.');if(lv>=4)lines.push(p.injOut>0?'현재 부상 중이므로 연수 신청보다 재활을 먼저 마쳐야 합니다.':'연수 출발·귀국 날짜와 시즌 준비 일정을 함께 확인하세요.');if(lv>=5)lines.push('귀국 기록의 전후 능력과 비용을 비교하세요. 다음 연수는 이전 결과를 보고 계속할지 결정할 수 있습니다.');}
 return lines;}
function contactRecord(key){const S=personalState();return S.contacts[key]||(S.contacts[key]={bond:30,history:[],talk:{}});}
function personalOwnerContact(tid=G.user){const person=bossOf(tid).own.id,S=personalState(),key='own:'+tid,old=S.contacts[key];if(old&&(!old.person||old.person===person)){old.person=person;return old;}if(old?.person)S.contacts['own-person:'+old.person]=old;const C=S.contacts['own-person:'+person]||{bond:30,history:[],talk:{}};C.person=person;S.contacts[key]=C;return C;}
function personalGMContact(tid){if(!team(tid)||tid===G.user)return null;const g=gmOf(tid);if(!g)return null;const S=personalState(),key='gm:'+tid,old=S.contacts[key];if(old&&(!old.person||old.person===g.id)){old.person=g.id;return old;}if(old?.person)S.contacts['gm-person:'+old.person]=old;const C=S.contacts['gm-person:'+g.id]||{bond:30,history:[],talk:{}};C.person=g.id;S.contacts[key]=C;return C;}
/* 출장(해외 견학) 중이면 그 안내, 아니면 '': 사람을 만나는 활동(식사·단장 면담)이 함께 쉰다(검수 154) */
function personalAway(){const S=G.personal;return S&&S.trip&&G.day<S.trip.to?`${S.trip.l} 출장 중입니다(${dmd(S.trip.to)} 귀국).`:'';}
/* 화면용 단장 친밀도: 단장이 바뀌었으면 새 단장 기록(처음이면 30). 기록을 만들거나 옮기지 않는다(검수 155) */
function personalGMBond(tid){const S=personalState(),g=gmOf(tid);if(!g)return 30;const old=S.contacts['gm:'+tid];if(old&&(!old.person||old.person===g.id))return old.bond;return S.contacts['gm-person:'+g.id]?.bond??30;}
/* ===== 단장 사비 조절(사용자 11-13: 사비로 사는 이득이 너무 쉬웠다) =====
   돈은 맛과 작은 우위만 산다. 1) 한 해에 같은 활동을 거듭할수록 효과가 줄고(PL_DIM) 2) 같은 사람을 자주 만나도 줄며 3) 한 주에 잡을 수 있는 유료 개인 일정은 PL_WEEK개
   4) 사비로 올리는 명성은 한 해 PL_REP_CAP까지 5) 접대성 활동은 '뒷말'(heat)이 쌓여 구설·구단주 경고로 돌아올 수 있고 6) 친분은 만나지 않으면 천천히 식는다 */
const PL_WEEK=2, PL_REP_CAP=2, PL_DIM=.5;
const PL_HEAT={press:3,network:2,fan:1,ob:1,team:.5};
function plDim(L){ return 1/(1+PL_DIM*(L||[]).filter(d=>G.day-d<365).length); }
function plUse(o,k){ o.uses=o.uses||{}; o.uses[k]=[G.day,...(o.uses[k]||[]).filter(d=>G.day-d<365)].slice(0,12); }
const plRound=x=>{ const f=Math.floor(x); return f+(R()<x-f?1:0); };
/* 사비로 올리는 명성: 한 해 상한을 넘으면 더 오르지 않는다. 실제로 오른 만큼 돌려준다 */
function plRepAdd(S,x){ const y=G.year; if(!S.repY||S.repY.y!==y)S.repY={y,n:0}; const v=Math.max(0,Math.min(PL_REP_CAP-S.repY.n,x)); if(v>0){ S.repY.n+=v; G.rep=clamp((G.rep??50)+v,0,100); } return v; }
/* 효과 크기를 말로만(수치는 보여 주지 않는다) */
const plWord=(d,full)=>d<=0?'그대로입니다':d<full*.45?'조금 올랐습니다':d<full*1.1?'올랐습니다':'크게 올랐습니다';
function plWeek(S){ const w=Math.floor(G.day/7); if(!S.wk||S.wk.w!==w)S.wk={w,n:0}; return S.wk; }
function plHeat(S,k,x){ S.heat=Math.round(((S.heat||0)+(x??PL_HEAT[k]??0))*10)/10; }
function personalActivity(kind,target){const A=PERSONAL_ACT[kind];if(!A||G.unemp)return '지금 할 수 없는 활동입니다.';const S=personalState(),last=S.last[kind];if(last!=null&&G.day-last<A.days)return `${A.l}: ${A.days-(G.day-last)}일 뒤 다시 할 수 있습니다.`;if(S.cash<A.cost)return `개인 잔액이 부족합니다(${money(A.cost)} 필요). 구단 돈은 사용하지 않습니다.`;
 if(S.trip&&G.day<S.trip.to)return `${S.trip.l} 출장 중입니다(${dmd(S.trip.to)} 귀국).`;
 if(A.cost>0&&plWeek(S).n>=PL_WEEK)return '이번 주 개인 일정이 꽉 찼습니다. 구단 일이 먼저입니다. 다음 주에 다시 잡으세요.';
 if(kind==='study'&&(S.study||0)>=5)return '실무 교육을 모두 마쳤습니다.';let text='',contact=null,p=null;const m=plDim(S.uses&&S.uses[kind]);
 if(kind==='press')text=pressDinner(S,m);
 if(kind==='ob'){text=obSupport(S,m);if(!text)return '우리 구단 출신 OB가 아직 없습니다.';}
 if(['chat','meal','rehab'].includes(kind)){p=G.players[+target];if(!p||p.team!==G.user)return '우리 구단 선수를 골라 주세요.';if(kind==='rehab'&&!(p.injOut>0))return '현재 재활 중인 선수가 아닙니다.';contact=contactRecord('pl:'+p.id);const mc=plDim(contact.uses&&contact.uses.meet);plUse(contact,'meet');contact.bond=clamp(contact.bond+A.bond*mc,0,100);p.mor=clamp((p.mor??60)+A.fx.mor*mc,0,100);text=`${p.name} · ${A.l}: ${friendshipLabel(p)}.${mc<.6?' 자주 만나 새로운 이야기는 줄었습니다.':''} 능력치·출전은 바꾸지 않습니다.`;}
 if(kind==='network'){const t=G.teams.find(t=>t.id===+target&&t.id!==G.user);if(!t)return '다른 구단 단장을 골라 주세요.';contact=personalGMContact(t.id);if(contact.meal!=null&&G.day-contact.meal<45)return `${gmOf(t.id).name} 단장과는 ${dmd(contact.meal+45)}부터 다시 식사할 수 있습니다.`;
  const mc=plDim(contact.uses&&contact.uses.meal);plUse(contact,'meal');contact.meal=G.day;contact.bond=clamp(contact.bond+A.bond*mc,0,100);const r0=t.rel??50;t.rel=gmTalkRel(r0,plRound(A.fx.rel*mc));
  /* 최근 거래한 구단 단장과 잦은 식사는 뒷말이 더 붙는다 */ const traded=(G.trades||[]).some(x=>x.with===t.id&&x.d!=null&&G.day-x.d<90);plHeat(S,'network',PL_HEAT.network+(traded?2:0));
  const N=teamNeeds(t.id),rumor=N.weak.length?`식사 자리에서 ${SLOTK[N.weak[0]]} 보강을 고민한다는 이야기를 들었습니다.`:N.money==='tight'?'연봉 부담을 덜고 싶어 한다는 눈치입니다.':'급한 자리는 없다며 말을 아꼈습니다.';
  text=`${tname(t.id)} ${gmOf(t.id).name} 단장과 식사했습니다. ${rumor} 관계는 ${plWord(t.rel-r0,1)}.`;}
 if(kind==='study'){S.study=Math.min(5,(S.study||0)+A.fx.study);text=`실무 교육 ${S.study}/5: 선수 정보의 관리(계약)·육성(연수) 탭에서 판단 참고를 확인할 수 있습니다.`;}
 if(kind==='team'){const P=playersOf(G.user);if(!P.length)return '선수단이 없습니다.';for(const q of P)q.mor=clamp((q.mor??60)+A.fx.mor*m,0,100);const mg=G.mgr[G.user];let md=0;if(mg&&!mg.interim){md=plRound(A.fx.mgr*m);mg.rel=clamp(mg.rel+md,0,100);}const say=mySay('treat');text=`${say?`"${say}" `:''}선수단 회식: 분위기가 ${m<.6?'조금 풀렸습니다. 회식이 잦아 예전만큼 반기지는 않습니다':'좋아졌습니다'}${md?'. 감독도 고마워합니다':''}. 구단 예산은 쓰지 않았습니다.`;}
 if(kind==='fan'){prInit();const f0=G.pr.fan;G.pr.fan=clamp(G.pr.fan+A.fx.fan*m,0,100);text=`팬 이벤트 사비 후원: 팬 여론이 ${plWord(G.pr.fan-f0,A.fx.fan)}. "단장이 자기 돈으로 쐈다"는 글이 커뮤니티에 올라옵니다.`;}
 if(kind==='scout'){const L=(G.scouts||[]);if(!L.length)return '우리 구단 스카우트가 없습니다.';for(const s of L)s.loy=clamp((s.loy??50)+A.fx.loy*m,0,100);text=`스카우트 ${L.length}명 출장비 보태기: 다른 구단 제안에 ${m<.6?'조금 덜':'덜'} 흔들립니다.`;}
 if(kind==='community'){const v=plRepAdd(S,plRound(A.fx.rep*m));cityRelAdd(G.user,1.5*m);if(!team(G.user).indie)cwRapAdd('own',m>=.6?1:0);text=`지역 야구 봉사·기부: 지역에서 좋게 봅니다${v?'. 단장 평판도 조금 올랐습니다':''}. 구단 예산은 사용하지 않았습니다.`;}
 plUse(S,kind);if(A.cost>0)plWeek(S).n++;if(PL_HEAT[kind]&&kind!=='network'&&kind!=='press')plHeat(S,kind);
 S.cash-=A.cost;S.spent+=A.cost;S.last[kind]=G.day;S.history.unshift({day:G.day,text,amount:-A.cost});S.history.length=Math.min(S.history.length,40);if(contact){personNetworkNote(contact,{day:G.day,kind,text});contact.history.unshift({day:G.day,kind,text});contact.history.length=Math.min(contact.history.length,12);}return text;
}
/* 뒷말이 쌓이면 구설: 매달 1일 확인(구단주 경고·평판 하락). 뒷말은 매달 20%씩 사그라든다 */
function plHeatMonth(S){ const h=S.heat||0; if(h<=0)return; if(!G.unemp&&h>=6&&R()<(h-5)*.08){ const t=team(G.user); t.trust=clamp(t.trust-2,0,100); G.rep=clamp((G.rep??50)-1,0,100); if(!t.indie)cwRapAdd('own',-1);
   news('언론',`${meCall()} 사적 모임 잦다는 뒷말`,`기자·다른 구단 관계자와의 잦은 사적 자리를 두고 "구단 일을 개인 인맥으로 푼다"는 말이 나옵니다. 구단주실도 자제를 당부했습니다.`,-1,{fanW:1});
   personalLog(S,'사적 모임이 잦다는 뒷말에 구단주가 자제를 당부했습니다.',0); S.heat=Math.round(h*.4*10)/10; return; }
  S.heat=Math.round(h*.8*10)/10; }
/* 친분은 만나지 않으면 천천히 식는다: 60일 넘게 만나지 않은 사람은 매달 기본(30) 쪽으로 6%씩 */
function plBondDecay(S){ for(const k in S.contacts){ const C=S.contacts[k]; if(!C||typeof C.bond!=='number')continue; const last=(C.history&&C.history[0]&&C.history[0].day)??-1e9; if(G.day-last>60)C.bond=Math.round((C.bond+(30-C.bond)*.06)*10)/10; } }
function playerTalkContext(p){return JSON.stringify([squadRole(p),p.injOut||0,p.promise?.until,p.promise?playPromKept(p):null,p.sal,p.yrs,p.listed,Math.floor((p.mor??60)/20),talkEvent(p)?.t]);}
function personalTalkReply(p,kind,line){const C=contactRecord('pl:'+p.id),last=C.talk[kind],key=playerTalkContext(p);if(last&&last.key===key&&last.day===G.day)return `앞서 말씀드린 상황은 그대로입니다. ${last.line}`;
 const warm=C.bond>=55?'단장님께는 편하게 말씀드릴 수 있겠네요. ':p.pers?.temp>=15?'솔직하게 말씀드리겠습니다. ':p.pers?.pro>=15?'제 역할부터 제대로 해내겠습니다. ':'';
 const promise=p.promise?playPromKept(p)?' 지난번 출전 기회 약속을 챙겨주신 건 기억하고 있습니다.':` ${dmd(p.promise.until)}까지 기회를 건의해 주신 약속은 기다리고 있습니다.`:'';
 const context=kind==='ask'?p.injOut>0?` 지금은 ${p.injOut}일 남은 재활을 마치는 게 먼저입니다.`:` 지금 맡은 역할은 ${squadRole(p)}입니다.`:'';
 const answer=warm+line+promise+context;C.talk[kind]={day:G.day,key,line};personNetworkNote(C,{day:G.day,kind,text:answer});C.history.unshift({day:G.day,kind,text:answer});C.history.length=Math.min(C.history.length,12);return answer;
}
function ownerPersonalReport(){const t=team(G.user),goal=goalStatus(),C=personalOwnerContact(),rank=goal?.rank.cur;const focus=t.owner==='profit'?`현금 ${money(t.cash)}과 다음 시즌 고정 지출부터 관리하시오.`:t.owner==='pr'?`팬 여론 ${Math.round(G.pr?.fan??50)}을 지켜보고 있소. 지역 팬들과도 만나시오.`:rank?`현재 ${rank}위요. 목표 ${goal.rank.t}위까지 선수단의 부족한 자리를 메워 주시오.`:'개막 전에 약한 포지션과 예산 계획부터 보고하시오.';const prior=C.talk.report;const key=JSON.stringify([G.year,rank,Math.round(t.cash/100),t.owner,Math.round(t.trust/10)]);const result=(prior?.key===key?'지난 보고 이후 큰 변화는 없군. ':t.trust>=70?'계속 맡겨 볼 만하군. ':'상황을 구체적으로 봅시다. ')+focus;C.talk.report={day:G.day,key,line:result};return result;}
function gmPersonalReply(tid,topic){const t=team(tid);if(!t||tid===G.user)return '지금은 면담할 수 없습니다.';if(!['plan','trade','check'].includes(topic))return '현재 구단 계획이나 선수 거래에 관해 이야기합시다.';
 const m=gmOf(tid),C=personalGMContact(tid),N=teamNeeds(tid),mode=['contend','mid','rebuild'].includes(t.mode)?t.mode:N.contend?'contend':'mid';
 const strategy={contend:'우승 도전 단계입니다. 당장 주전과 불펜의 빈자리를 채우는 쪽을 보겠습니다.',mid:'전력 정비 단계입니다. 필요한 자리만 보강하고 어린 주전의 자리는 지키겠습니다.',rebuild:'재건 단계입니다. 두세 시즌 뒤를 보고 젊고 오래 보유할 선수를 모으겠습니다.'}[mode];
 const need=N.weak.length?'우선 보강할 자리는 '+N.weak.map(k=>SLOTK[k]).join('·')+'입니다.':'지금은 뚜렷하게 급한 포지션이 없어 조건을 더 따져보겠습니다.';
 const budget=N.money==='tight'?'연봉 여유가 적어 보장 금액과 남은 계약을 먼저 봅니다.':N.money==='rich'?'연봉을 감당할 여유는 있지만 그만한 역할이 있는 선수를 찾습니다.':'연봉과 남은 계약을 선수의 역할에 맞춰 보겠습니다.';
 const styles={hard:'선수값에서는 쉽게 물러서지 않겠습니다.',prospect:'어린 선수의 성장 여지와 남은 보유 기간을 높게 봅니다.',data:'한동안의 컨디션보다 여러 시즌의 기록과 계약을 비교합니다.',loyal:C.bond>=55?'서로 약속을 지켜 온 관계는 협상에서도 생각하겠습니다.':'한 번의 좋은 말보다 거래를 지키는 모습을 보고 관계를 쌓겠습니다.',gambler:'우승 경쟁에 필요한 확실한 전력이라면 큰 거래도 검토하겠습니다.',miser:'같은 역할이면 연봉 부담이 적은 선수가 먼저입니다.'};
 const listed=domestic(tid).filter(p=>p.aiListed&&!p.ys).sort((a,b)=>b.sal-a.sal||a.id-b.id)[0],market=listed?`공개 매물에는 ${listed.name}(${posLabel(listed)}, ${listed.age}세)이 있습니다.`:'현재 공개한 매물은 없습니다.';
 const key=JSON.stringify([m.id,m.trait,mode,N.weak,N.money,listed?.id,Math.floor(C.bond/15),Math.floor((t.rel??50)/5)]),old=C.talk[topic],repeat=old?.day===G.day&&old.key===key;
 const line=topic==='plan'?strategy+' '+need+' '+budget:topic==='trade'?need+' '+market+' '+budget+' '+(styles[m.trait]||styles.hard):(C.bond>=55?'편하게 이야기할 사이가 됐네요. ':'인사는 나눴지만 관계는 차근차근 쌓아갑시다. ')+`개인 친밀도는 ${relLabel(C.bond)}, 양 구단 관계는 ${relLabel(t.rel??50)}입니다. `+(styles[m.trait]||'');
 C.talk[topic]={day:G.day,key,line};if(!repeat){C.history.unshift({day:G.day,kind:'talk:'+topic,text:line});C.history.length=Math.min(C.history.length,12);}
 return `${m.name}: ${repeat?'오늘 말씀드린 기준은 같습니다. '+(topic==='plan'?strategy:topic==='trade'?need:'양 구단 관계와 개인 친분은 따로 쌓아가겠습니다.'):line}`;}
/* ===== 사비 쓰기 2(사용자 11-09): 기자 접대·OB 후원·장학재단·해외 프런트 견학·재테크·야인 생활비. 모두 개인 지갑만 쓰고, 옛 저장은 필드가 없으면 처음 상태로 본다 ===== */
PERSONAL_ACT.press={l:'기자 접대',cost:3,days:21,fx:{press:5}}; PERSONAL_ACT.ob={l:'OB 후원',cost:10,days:90,fx:{ob:5,rep:1}};
/* 기자 접대가 들켰을 때 직접 효과(기사 영향은 따로 더해진다) */
const PRESS_CAUGHT={trust:-3,fan:-2};
const pmoney=v=>{const m=Math.round(Math.abs(v)*100);return m%100===0?money(v):(v<0?'-':'')+(m>=10000?Math.floor(m/10000)+'억 ':'')+(m%10000).toLocaleString('ko-KR')+'만';}; /* 개인 지갑은 만 원 단위까지: 2만 원이 0원으로 보이던 문제(검수 11-09zc) */
function personalLog(S,text,amount){S.history.unshift({day:G.day,text,amount});S.history.length=Math.min(S.history.length,40);}
/* 기자 접대: 1년 안에 접대한 횟수마다 들킬 확률이 8%p씩 오른다(첫 번째 8%, 최대 60%) */
function pressRisk(){const L=G.personal?.pressLog||[];return Math.min(.6,.08+.08*L.filter(d=>G.day-d<365).length);}
function pressRiskWord(){ const r=pressRisk(); return r<.15?'낮음':r<.3?'보통':'높음'; }
function pressDinner(S,m=1){prInit();const risk=pressRisk();(S.pressLog=S.pressLog||[]).unshift(G.day);S.pressLog.length=Math.min(S.pressLog.length,12);plHeat(S,'press');
 if(R()<risk){const t=team(G.user),say=mySay('down','press');t.trust=clamp((t.trust??50)+PRESS_CAUGHT.trust,0,100);G.pr.fan=clamp(G.pr.fan+PRESS_CAUGHT.fan,0,100);plHeat(S,'press',2);
  news('언론',`${meCall()}, 기자들과 사적 술자리 구설`,`${meCall()}이(가) 출입 기자들에게 사비로 식사를 대접했다는 이야기가 퍼졌습니다. "언론을 관리하려 한다"는 비판과 함께 팬들 사이에서도 말이 나옵니다.${say?` 단장은 "${say}"라고만 했습니다.`:''}`,-2,{fanW:1});
  return '기자 접대가 새어 나갔습니다. 구설 기사가 나 언론 논조와 팬 여론이 나빠졌고, 구단주도 불쾌해합니다.';}
 const p0=G.pr.press;G.pr.press=clamp(G.pr.press+PERSONAL_ACT.press.fx.press*m,0,100);
 return `기자 접대: 논조가 ${plWord(G.pr.press-p0,PERSONAL_ACT.press.fx.press)}${m<.6?' 자주 만나 예전만 못합니다':''}. 날마다 조금씩 원래대로 돌아갑니다. 다음 접대가 들킬 위험: ${pressRiskWord()}.`;}
/* OB 후원: 우리 구단 출신 OB 친분 +5, 명성 +1. 아직 자리가 없는 우리 레전드가 친분에 따라 코치로 돕겠다고 나선다(은퇴식 '구단에 남기기'와 같은 우선 협상·20% 할인) */
function obSupport(S=personalState(),m=1){obInit();const L=G.ob.filter(o=>o.team===G.user);if(!L.length)return null;const X=PERSONAL_ACT.ob.fx;for(const o of L)o.bond=(o.bond||0)+X.ob*m;const rv=plRepAdd(S,plRound(X.rep*m));
 const C=obCands('coach').filter(o=>o.team===G.user&&!(G.cmarket||[]).some(c=>c.ob===o.id&&c.res===G.user)).sort((a,b)=>b.fame-a.fame)[0];let extra='';
 if(C&&R()<clamp(.15+C.bond/200,.15,.6)){const c=obCoach(C);c.sal=round5(c.sal*.8);c.res=G.user;G.cmarket=(G.cmarket||[]).filter(x=>x.ob!==C.id);G.cmarket.unshift(c);extra=` ${C.name}: "단장님이 이렇게까지 챙기시는데 저도 돕겠습니다." 코치 후보 맨 앞에 올라왔습니다(${CROLE[c.role].l}, 연 ${money(c.sal)}, 몸값을 낮춰 줌).`;}
 return `OB회 후원: 우리 구단 출신 OB ${L.length}명과 가까워졌습니다${rv?'. 단장 평판도 조금 올랐습니다':''}.${extra}`;}
/* 해외 프런트 견학: 스토브리그에 1년 한 번, 2주 출장. 실무 교육을 한 단계 올린다(이미 5단계면 명성 +2) */
/* 견학 공통 효과: 실무 교육 +study, 이미 5단계면 대신 명성 +done */
const TOUR_FX={study:1,done:2};
const TOUR={mlb:{l:'MLB 프런트 견학',cost:50,rep:1},npb:{l:'NPB 프런트 견학',cost:30,rep:0}};
function personalTour(k){const T=TOUR[k];if(!T||G.unemp)return '지금은 갈 수 없습니다.';const S=personalState();if(period()!=='off')return '프런트 견학은 스토브리그(포스트시즌이 끝난 뒤)에만 갈 수 있습니다.';if(S.tourY===G.year)return '올해는 이미 견학을 다녀왔습니다(1년 한 번).';if(S.cash<T.cost)return `개인 잔액이 부족합니다(${money(T.cost)} 필요). 구단 돈은 사용하지 않습니다.`;
 S.cash-=T.cost;S.spent+=T.cost;S.tourY=G.year;S.trip={to:G.day+14,l:T.l};S.tours=(S.tours||0)+1;let gain='';if((S.study||0)<5){S.study=Math.min(5,(S.study||0)+TOUR_FX.study);gain=`실무 교육 ${S.study}/5`;}const rep=plRepAdd(S,T.rep+(gain?0:TOUR_FX.done));
 /* 자리를 비우는 값(11-13): FA 시장이 열린 동안 떠나면 성적을 바라는 구단주가 못마땅해한다 */ let away='';{const t=team(G.user);if(G.fa&&G.fa.open&&!G.fa.closed&&!t.indie){if(t.owner==='win')t.trust=clamp(t.trust-1,0,100);cwRapAdd('own',-1);away=' FA 시장이 열린 때 자리를 비워 구단주실 눈치가 보입니다.';}}
 const say=mySay('up','tour'),text=`${say?`"${say}" `:''}${T.l}: ${dmd(S.trip.to)}까지 출장. ${[gain,rep?'단장 평판이 조금 올랐습니다':''].filter(Boolean).join(', ')}.${away}${sisTour(k)}`; /* 그 나라 구단들과 관계(98_sister_club.js) */personalLog(S,text,-T.cost);return text;}
/* 개인 장학재단: 설립 3,000만 + 매년 1월 500만. 해마다 명성 +1·팬 여론 +1, 연고 지역 고교 유망주 한 명에게 장학금(그 학교 감독 친분 +4) */
const FOUND={cost:30,year:5,fx:{rep:1,fan:1,sch:4}};
/* 장학재단 연고 인연: 재단을 오래 운영할수록 연고 출신 FA가 우리 구단을 조금 더 반긴다(해마다 조금, 상한 있음). 지역 관계(시설 지자체 협의)에도 보탬 */
const FOUND_FA={per:.005,max:.03};
function foundTie(p,tid){ const F=G.personal&&G.personal.found; if(!F||G.unemp||tid!==G.user||!p)return 0; if(F.area!=null&&teamArea(G.user)!==F.area)return 0; const yrs=Math.max(0,G.year-F.y); if(!yrs)return 0; const tie=homeTie(p,tid)||(p.area!=null&&p.area===F.area); return tie?Math.min(FOUND_FA.max,yrs*FOUND_FA.per):0; }
function foundAward(F){const P=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&!p.college&&p.school&&(!F.area||p.area===F.area)&&!F.list.some(x=>x.pid===p.id)).map(p=>{ const r=scoutReport(p); return {p,v:r?(r.ofp??r.cur??0):0}; }).sort((a,b)=>b.v-a.v).map(x=>x.p); /* 실제 잠재력이 아니라 우리 스카우트 추정(오차 포함)으로 고른다(검수 11-09e #30) */
 const p=P[0];let sc=p?schOf(p):null;if(!sc){const L=Object.values(schList()).filter(s=>!F.area||s.area===F.area);sc=L.length?L[Math.floor(R()*L.length)]:null;}if(!sc)return '';if(!G.unemp&&G.user!=null)schAdd(sc,FOUND.fx.sch); /* 고교 감독 친분은 구단 관계: 맡은 구단이 없으면 장학금만 전한다(검수 153) */
 F.list.unshift({y:G.year,pid:p&&sc.n===p.school?p.id:null,name:p&&sc.n===p.school?p.name:null,school:sc.n});F.list.length=Math.min(F.list.length,10);return F.list[0].name?`${sc.n} ${F.list[0].name}`:`${sc.n} 야구부`;}
function personalFound(){if(G.unemp)return '지금은 할 수 없습니다.';const S=personalState();if(S.found)return '이미 장학재단을 운영하고 있습니다.';if(S.cash<FOUND.cost)return `개인 잔액이 부족합니다(${money(FOUND.cost)} 필요). 구단 돈은 사용하지 않습니다.`;
 S.cash-=FOUND.cost;S.spent+=FOUND.cost;const F=S.found={y:G.year,paid:G.year,area:teamArea(G.user),list:[]};const who=foundAward(F);plRepAdd(S,FOUND.fx.rep);cityRelAdd(G.user,3);const say=mySay('up','found');
 news('구단',`${meCall()}, 사비로 고교 야구 장학재단 설립`,`${meName()||'단장'} 장학재단이 문을 열었습니다. 연고 지역 고교 야구 선수들을 해마다 돕겠다고 합니다.${who?` 첫 장학생은 ${who}.`:''}${say?` "${say}"`:''}`,2,{fanW:1});
 const text=`장학재단 설립${who?`: 첫 장학생 ${who}. 그 학교 감독과 가까워졌습니다`:''}. 오래 운영할수록 연고 지역에서 단장 이름이 알려집니다. 매년 1월 ${money(FOUND.year)}이 나갑니다.`;personalLog(S,text,-FOUND.cost);return text;}
function foundYear(S){const F=S.found;if(!F||F.paid>=G.year)return;F.paid=G.year;if(S.cash<FOUND.year){personalLog(S,'장학재단: 잔액이 부족해 올해 장학금을 내지 못했습니다.',0);return;}
 S.cash-=FOUND.year;S.spent+=FOUND.year;const who=foundAward(F);const rv=plRepAdd(S,FOUND.fx.rep);if(!G.unemp){prInit();G.pr.fan=clamp(G.pr.fan+FOUND.fx.fan,0,100);cityRelAdd(G.user,2);news('구단',`${meName()||'단장'} 장학재단, ${G.year}년 장학금 전달`,`올해 장학생은 ${who||'연고 지역 고교 야구부'}입니다.`,1);}
 personalLog(S,`장학재단 ${G.year}년 장학금${who?`: ${who}`:''}.${rv?' 단장 평판이 조금 올랐습니다.':''}${G.unemp?'':' 지역 팬들이 반깁니다.'}`,-FOUND.year);}
/* 재테크(11-13 조절): 매달 1일 시장 흐름(모든 상품 공통) 한 번 + 상품별 흔들림. 시장은 급락을 빼면 연 9% 안팎(급락 포함 5~6%)·변동 연 14% 안팎, 드물게 급락(한 달 -12% 안팎)이 온다.
   펀드는 시장을 절반쯤 따라가고 보수가 빠진다. 고위험 주식은 시장보다 크게 움직인다. 예금만 손실이 없다. 구단과 무관 */
const PL_INV={dep:{l:'예금',d:'연 3% · 손실 없음'},fund:{l:'펀드',beta:.7,sd:.012,fee:.0005,d:'시장을 따라 오르내림 · 보수'},stock:{l:'고위험 주식',beta:1.4,sd:.06,fee:0,d:'크게 오르내림 · 큰 손실 가능'}};
const PL_MKT={mu:.0075,sd:.04,crash:.025,cd:-.12};
function plMarket(){ const o=dobj(G.day),k=o.y*100+o.m; if(G.plMkt&&G.plMkt.k===k)return G.plMkt.x; let x=N(PL_MKT.mu,PL_MKT.sd); if(R()<PL_MKT.crash)x+=PL_MKT.cd; G.plMkt={k,x}; return x; }
function personalInvest(k,amt){const I=PL_INV[k];if(!I)return '없는 상품입니다.';const S=personalState();S.inv=S.inv||{};let text;
 if(amt>0){if(S.cash<amt)return `개인 잔액이 부족합니다(${money(amt)} 필요).`;S.cash-=amt;S.inv[k]=(S.inv[k]||0)+amt;text=`${I.l}에 ${money(amt)} 넣었습니다.`;personalLog(S,text,-amt);return text;}
 const v=S.inv[k]||0;if(v<=0)return `${I.l}에 찾을 돈이 없습니다.`;
 /* 일부 찾기(amt<0): 넣은 돈보다 많이 찾으면 있는 만큼만(커뮤니티 11-12) */
 if(amt<0){const w=Math.min(v,-amt);S.cash+=w;S.inv[k]=Math.round((v-w)*1e4)/1e4;text=`${I.l}에서 ${pmoney(w)} 찾았습니다.`;personalLog(S,text,w);return text;}
 S.cash+=v;S.inv[k]=0;text=`${I.l} ${pmoney(v)}을(를) 모두 찾았습니다.`;personalLog(S,text,v);return text;}
function invMonth(S){if(!S.inv)return;let tot=0;const r={};const mk=plMarket();for(const k in PL_INV){const v=S.inv[k]||0;if(v<=0)continue;const I=PL_INV[k],x=k==='dep'?.0025:clamp(I.beta*mk+N(0,I.sd)-I.fee,-.35,.3),d=Math.round(v*x*1e4)/1e4; /* 100원 단위(검수 11-09zc) */S.inv[k]=Math.max(0,v+d);tot+=d;r[k]=Math.round(x*1000)/10;}
 if(!Object.keys(r).length)return;(S.invLog=S.invLog||[]).unshift({day:G.day,r,d:Math.round(tot*1e4)/1e4});S.invLog.length=Math.min(S.invLog.length,12);}
/* 생활비: 야인이면 생활 등급별 월 생활비, 현직이면 등급 유지비(원룸은 0). 지갑이 바닥나면 0에서 멈추고(게임 오버 없음) 제의 연봉이 10% 낮게 들어온다 */
const LIVE_UNEMP=[1,2,4,6],LIVE_UP=[0,1,1,2];
const personalBroke=()=>!!G.unemp&&!!G.personal&&G.personal.cash<=0;
function personalMonth(){const S=personalState(),o=dobj(G.day);invMonth(S);if(o.m===1)foundYear(S);try{plHeatMonth(S);plBondDecay(S);}catch(e){}
 const c=(G.unemp?LIVE_UNEMP:LIVE_UP)[S.life||0]||0,pay=Math.min(c,Math.max(0,S.cash));if(c){S.cash-=pay;S.spent+=pay;/* 유지비·생활비도 누적 사용에(검수 11-09zc) */personalLog(S,(G.unemp?'야인 생활비':'생활 등급 유지비')+(pay<c?`(${money(c)} 중 잔액만큼만 냈습니다)`:''),-pay);}
 if(personalBroke()&&!S.brokeMail){S.brokeMail=1;mail('야인','생활비가 바닥났습니다','개인 잔액이 0원입니다. 게임이 끝나지는 않지만, 구단들이 사정을 알고 단장직 제의 연봉을 최대 10% 낮춰 부릅니다. 재테크에 넣어 둔 돈이 있으면 단장 프로필 > 개인 지갑에서 찾을 수 있습니다.',{kind:'경력'});}if(S.cash>0)S.brokeMail=0;}

/* 단체 안부는 기존 gmContact('call')의 무료 통화·인당 14일 조건을 그대로 쓴다. */
function gmContactBulkView(targets,expectedTid=G.user){const seen=new Set(),rows=(Array.isArray(targets)?targets:[]).map(t=>{const tid=t?.tid,id=t?.id,T=(G.teams||[]).find(T=>T.id===tid),g=T?.gm,c=G.gmc?.[tid],key='gm:'+tid+':'+id;let reason='';if(G.unemp)reason='구단을 맡고 있지 않습니다.';else if(expectedTid!==G.user)reason='선택한 뒤 소속 구단이 바뀌었습니다. 명단을 다시 선택하세요.';else if(!T||tid===G.user||id==null)reason='다른 구단의 현재 단장을 선택하세요.';else if(!g||g.id!==id)reason='선택한 단장이 바뀌었거나 더 이상 재직 중이 아닙니다.';else if(seen.has(id))reason='중복 선택한 단장에게는 한 번만 연락합니다.';else {seen.add(id);if(c?.call!=null&&c.call>G.day-14)reason=g.name+' 단장과는 '+dmd(c.call+14)+'부터 다시 연락할 수 있습니다.';}return {key,kind:'gm',id:id??null,tid:tid??null,name:g?.id===id?g.name:t?.name||'선택한 단장',topic:'call',ok:!reason,reason,msg:reason,cost:0,...(c?.call!=null&&c.call>G.day-14?{nextDay:c.call+14}:{})};});return bulkTalkResult('gm','call',expectedTid,rows);}
function gmContactBulk(targets,expectedTid=G.user){const rows=gmContactBulkView(targets,expectedTid).rows;for(const row of rows){if(!row.ok)continue;const check=gmContactBulkView([{tid:row.tid,id:row.id}],expectedTid).rows[0];if(!check.ok){Object.assign(row,check);continue;}try{const result=gmContact(row.tid,'call');row.ok=!!result.ok;row.msg=result.msg||'';row.reason=row.ok?'':row.msg||'안부 연락을 마치지 못했습니다.';}catch(e){row.ok=false;row.reason=row.msg='이 단장에게 연락하지 못했습니다. 다른 대상은 계속 처리했습니다.';}}return bulkTalkRecord(bulkTalkResult('gm','call',expectedTid,rows));}
