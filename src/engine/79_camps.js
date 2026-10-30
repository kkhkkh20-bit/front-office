/* ===== 캠프: 선수가 크게 바뀌는 때 =====
 스프링캠프(1월 25일~3월 5일)와 마무리캠프(11월 5일~25일)는 모든 구단에서 열린다. 시즌 중 주간 훈련은 몸을 유지하는 정도로 줄였다.
 - 성장: 젊고 잠재력 여지가 있는 선수 위주. 훈련 방향, 코치진 육성력, 훈련 시설, 성장 의지(프로의식·야망), 감독 육성 성향을 따른다(시즌 중 훈련과 같은 계수).
 - 확 늘어나는 선수: 드물게 한 해 성장을 캠프에서 몰아서 한다(25세 이하).
 - 구종 추가(투수): 새 구종을 익혀 온다. 잘 들면 결정구가 되고, 안 들면 그냥 하나 늘었을 뿐이다.
 - 폼 수정(타격폼·투구폼): 크게 좋아지기도, 한동안 흔들리기도 한다.
 - 마무리캠프는 26세 이하와 주전이 아닌 30세 이하만 간다. 주전 고참은 쉰다. 방향은 기술 훈련·구종 개발·포지션 전환 */
/* 프로의식이 낮은 선수는 사고를 친다(매달, 모든 구단): 늦은 귀가·훈련 지각·SNS 논란·음주 소동. 그해 성장이 깎이고 기분·감독 관계가 흔들린다.
   우리 구단은 징계를 정하는 결정이 오고(한 달에 한 번까지), 다른 구단은 기사로 나온다 */
const MISB=[['늦은 귀가','원정 숙소 통금 시간을 넘겨 들어왔습니다'],['훈련 지각','팀 훈련에 늦게 나왔습니다'],['SNS 논란','개인 SNS에 올린 글이 팬들 사이에서 논란이 됐습니다'],['음주 소동','새벽까지 술자리를 이어 가다 다음 날 훈련을 제대로 소화하지 못했습니다'],['훈련 태만','개인 훈련 과제를 몇 주째 건너뛰고 있다는 말이 코치진에서 나옵니다']];
function misbehaveMonth(){ const per=period(); if(per==='off'&&dobj(G.day).m===12)return; let mine=false;
  for(const p of Object.values(G.players)){ if(p.team==null||p.prospect||p.foreign||p.injOut>0)continue; initPers(p); const pr=p.pers.pro; if(pr>8)continue; const ch=(9-pr)*.005*(p.age<=26?1.3:1); if(R()>=ch)continue;
    const [k,d]=pick(MISB); p.badY=p.badY&&p.badY.y===G.year?{y:G.year,n:p.badY.n+1}:{y:G.year,n:1}; p.mor=clamp((p.mor??60)-2,0,100); story(p,`${G.year} ${k}`);
    if(p.team===ME()&&!G.unemp&&!mine&&!(G.misbD!=null&&G.day-G.misbD<28)){ mine=true; G.misbD=G.day; const m=G.mgr[G.user]; const mr=m&&!m.interim?(m.disc>=65?`${m.name} 감독은 엄하게 다스려야 한다는 입장입니다.`:m.disc<40?`${m.name} 감독은 선수를 감싸고 싶어 합니다.`:`${m.name} 감독은 구단 판단에 따르겠다고 합니다.`):'';
      try{ evNew('lead',`${p.name} ${k}`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) ${d}. 코치진은 자기 관리가 안 되는 선수라고 봅니다. 이런 일이 쌓이면 성장도 더뎌집니다. ${mr} 구단 차원의 징계를 정해 주세요.`,[{l:'구단 징계: 출장 정지 5일',fx:'선수 기분이 크게 내려가고 그 기간 못 뜁니다. 선수단이 긴장합니다(기강 +6, 45일).'},{l:'구단 징계: 벌금',fx:'선수 기분이 내려가고 기강이 조금 잡힙니다(+3, 30일).'},{l:'선처하고 감독에게 맡기기',fx:'선수 기분은 지킵니다. 감독이 엄한 편이면 감독이 직접 다잡습니다.'}],{ref:p.id,data:{pid:p.id},from:'운영팀',def:1}); }catch(e){} }
    else if(p.team!==ME()&&(k==='음주 소동'||k==='SNS 논란')&&ovr(p)>=52&&R()<.5)wire('구단',`${tname(p.team)} ${p.name}, ${k}`,{tid:p.team,ref:p.id}); } }
const FCAMP={skill:'기술 훈련',pitch:'구종 개발',conv:'포지션 전환'};
const CAMP_AMT={spring:{balance:.4,skill:.65,fitness:.18,game:.18},fall:{skill:.55,pitch:.32,conv:.28}}, WINTER_F=.7; /* 겨울 성장의 4분의 1을 캠프로 옮겨 한 해 총성장은 예전과 비슷하게 */
function campFocusAi(tid,kind){ const m=mgrOf(tid); if(kind==='fall')return 'skill'; return m&&(m.youth||50)>=58?'skill':'balance'; }
function addPitch(p,q){ const have=new Set(arsenal(p,p.r.stf).map(x=>x[0])); const L=PITCHES.filter(k=>!have.has(k)); if(!L.length)return null; const k=L[Math.floor(u01('np'+G.year+(p.addP||[]).length,p.id)*L.length)];
  (p.addP=p.addP||[]).push({k,q:Math.round(q*10)/10,y:G.year}); return k; }
function campGrow(p,kind,focus){ const ev=[]; if(p.injOut>0||(p.mil&&p.mil.from<=G.day&&p.mil.until>G.day))return ev;
  const f=tbFactors(p,null); const ks=TRN_TOOLS[trnG(p)]; const o0=ovr(p), cap=Math.max(p.pot,o0)+4; const base=(CAMP_AMT[kind][focus]??1)*(p.age<=26?1:p.age<=30?.45:.15);
  let amt=base*f.room*f.will*f.fac*f.coach*f.mgr*rnd(.5,1.5); let tot=0;
  /* 확 늘어나는 선수 */ if(p.age<=25&&p.pot-ovr(p)>=4&&R()<(focus==='skill'?.05:.03)*f.will){ amt+=rnd(2,4); ev.push({t:'big'}); }
  if(amt>0){ const w=ks.map(()=>.3+R()); const ws=w.reduce((a,b)=>a+b,0); ks.forEach((k,i)=>{ if(p.r[k]<cap)tot+=addR(p,k,amt*w[i]/ws*(ks.length===3?1.6:1)); }); }
  /* 구종 추가 */ if(p.isP&&p.age<=31){ const pr=kind==='fall'?(focus==='pitch'?.2:.05):(focus==='skill'?.1:.06); const n=arsenal(p,p.r.stf).length; if(n<(isSPr(p)?6:4)&&R()<pr*clamp(f.will,.8,1.2)){ const q=N(-1.5,4)+(f.coach-1)*6; const k=addPitch(p,q); if(k)ev.push({t:'pitch',k,q}); } }
  /* 폼 수정 */ if(p.age<=32&&R()<.045){ const k=p.isP?(R()<.5?'stf':'ctl'):(R()<.5?'con':'pow'); const good=R()<.6; const d=good?rnd(1.5,3.5):-rnd(1,2.5); const v=clamp(p.r[k]+d,20,80); const dd=v-p.r[k]; p.r[k]=v; roundR(p); tot+=dd; ev.push({t:good?'form+':'form-',k,d:dd}); }
  /* 포지션 전환 캠프: 전환 훈련 중인 선수는 숙련이 크게 오른다 */ if(kind==='fall'&&focus==='conv'&&p.pconv)posGain(p,p.pconv.pos,18*posLearnRate(p)*(p.team!=null?posCoachF(p.team):1));
  if(ovr(p)>Math.max(p.pot,o0)+.05)setOvr(p,Math.max(p.pot,o0)); /* 잠재력은 넘을 수 없다 */
  for(const e of ev){ if(e.t==='pitch')story(p,`${G.year} ${kind==='fall'?'마무리':'스프링'}캠프에서 ${e.k} 장착`); if(e.t==='big')story(p,`${G.year} ${kind==='fall'?'마무리':'스프링'}캠프에서 한 단계 성장`); if(e.t==='form+'||e.t==='form-')story(p,`${G.year} ${p.isP?'투구폼':'타격폼'} 수정 ${e.t==='form+'?'— 효과를 봄':'— 한동안 흔들림'}`); }
  return ev; }
function campWho(tid,kind){ const ps=domestic(tid).filter(p=>!p.prospect); if(kind==='spring')return ps; const d=depth(tid); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); return ps.filter(p=>p.age<=26||(p.age<=30&&!reg.has(p.id))); }
/* 캠프 결과 문장(우리 구단 메일) */
function campEvLine(p,e){ if(e.t==='big')return `${p.name}: 한 단계 성장했습니다`; if(e.t==='pitch')return `${p.name}: ${e.k}을(를) 새로 장착${e.q>=3?' — 결정구로 쓸 만합니다':e.q<=-2?' — 아직 실전에서 쓰기는 어렵습니다':''}`; if(e.t==='form+')return `${p.name}: ${p.isP?'투구폼':'타격폼'} 수정 효과(${TOOLK[e.k]} +${e.d.toFixed(1)})`; return `${p.name}: ${p.isP?'투구폼':'타격폼'}을 고치다 흔들림(${TOOLK[e.k]} ${e.d.toFixed(1)})`; }
function campGrowAll(kind,userFocus){ const mine=[]; for(const t of G.teams){ const focus=t.id===ME()?userFocus:campFocusAi(t.id,kind); for(const p of campWho(t.id,kind)){ const ev=campGrow(p,kind,focus); if(t.id===ME())for(const e of ev)mine.push(campEvLine(p,e)); } } return mine; }
/* 마무리캠프 */
function fcampStart(){ if(G.fcamp&&G.fcamp.y===G.year)return; G.fcamp={y:G.year,focus:'skill',done:false,snap:campSnap()};
  if(!G.unemp)mail('코칭스태프','마무리캠프 시작 (11월 25일까지)',`시즌을 마친 젊은 선수들과 주전이 아닌 선수들이 마무리캠프에 들어갑니다. 주전 고참은 쉽니다.\n\n훈련 방향을 정해 주세요. 정하지 않으면 기술 훈련으로 합니다.\n- 기술 훈련: 젊은 선수 능력이 고르게 오릅니다.\n- 구종 개발: 투수들이 새 구종을 익혀 올 가능성이 크게 오릅니다.\n- 포지션 전환: 전환 훈련 중인 선수의 숙련이 크게 오릅니다.`,{kind:'캠프',acts:Object.entries(FCAMP).map(([k,l])=>({l,a:'fcampSet',v:k}))}); }
function fcampSet(k){ if(!G.fcamp||G.fcamp.done||!FCAMP[k])return '지금은 정할 수 없습니다.'; G.fcamp.focus=k; return `마무리캠프 훈련 방향: ${FCAMP[k]}.`; }
function fcampEnd(){ const F=G.fcamp; if(!F||F.done||F.y!==G.year)return; const ev=campGrowAll('fall',F.focus); F.done=true; if(G.unemp)return;
  const snap=F.snap||{}; const rows=domestic(G.user).filter(p=>snap[p.id]).map(p=>({p,a:snap[p.id].o,b:ovr(p)})).filter(x=>dv(x.b)!==dv(x.a)).sort((x,y)=>(y.b-y.a)-(x.b-x.a));
  mail('코칭스태프',`마무리캠프 결산: ${rows.filter(x=>x.b>x.a).length}명 능력 상승`,`훈련 방향: ${FCAMP[F.focus]}.\n\n${ev.length?`눈에 띈 일\n${ev.slice(0,12).join('\n')}\n\n`:''}${rows.length?`능력이 바뀐 선수\n${rows.slice(0,12).map(x=>`${x.p.name} (${posLabel(x.p)}, ${x.p.age}세) ${dv(x.a)} → ${dv(x.b)}`).join('\n')}`:'능력이 눈에 띄게 바뀐 선수는 없습니다.'}`,{kind:'캠프',imp:true,acts:[{l:'선수단 보기',a:'go',v:'roster:glance'}]}); }
