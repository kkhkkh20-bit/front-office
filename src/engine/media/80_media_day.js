/* ===== 미디어데이: 감독과 선수가 나간다 =====
 실제 KBO처럼 개막 미디어데이에는 구단마다 감독·주장·대표 선수 1명, 포스트시즌 미디어데이에는 감독·선수 2명이 나간다. 단장은 나가지 않는다.
 - 개막 9일 전: 감독이 참석 선수를 추천한다. 단장은 대표 선수를 다른 선수로 건의할 수 있다(감독이 받아들이거나 거절).
 - 개막 2일 전: 미디어데이. 감독은 예상 전력과 성향대로 목표를 말하고, 선수는 성격대로 말한다. 다음 날 기사와 소식이 온다.
 - 감독이 '우승'이나 '가을야구'를 공언하면 시즌 뒤 지켰는지 다시 기사가 난다.
 - 포스트시즌(준플레이오프부터): 1차전 하루 전. 감독이 선수 2명을 고른다.
 단장이 직접 질문에 답하는 일은 FA 영입·이탈, 트레이드, 감독 선임·경질 직후, 시즌 결산 인터뷰로 따로 온다. */
/* 미디어데이 주장 = 선수단 투표로 뽑은 주장(t.cap). 없거나 떠났으면 그때 선출한다 */
function mdAvailable(p,tid){ return !!(p&&p.team===tid&&healthy(p)&&!isAway(p)&&!(p.joinY>G.year)); }
function mdCaptain(tid){ const t=team(tid); delete t.capt; let c=t.cap!=null?G.players[t.cap]:null; if(c&&c.team===tid&&!c.foreign){ if(mdAvailable(c,tid))return c; return domestic(tid).filter(p=>!p.prospect&&mdAvailable(p,tid)).sort((a,b)=>b.age-a.age)[0]||null; }
  try{ c=electCaptain(tid,'미디어데이를 앞두고'); }catch(e){ c=null; } return c||domestic(tid).filter(p=>!p.prospect&&mdAvailable(p,tid)).sort((a,b)=>b.age-a.age)[0]||null; }
function mdScore(tid,p){ const m=mgrOf(tid); return ovr(p)+Math.min(starPower(p),20)*.5+(p.age<=25?((m.youth??50)-50)*.12:0)+(p.e1?2:0); }
function mdRepPool(tid){ const cap=mdCaptain(tid); return domestic(tid).filter(p=>p!==cap&&!p.prospect&&mdAvailable(p,tid)&&(p.e1||ovr(p)>=50||p.age<=24)).sort((a,b)=>mdScore(tid,b)-mdScore(tid,a)); }
function mdWhy(p){ const h=seasonTotal(p,G.year-1,'1군'); if(!h)return p.age<=24?'기대주':'주축 선수';
  if(p.isP){ const r=pRate(h); return h.outs>=300?`지난해 ${ipStr(h.outs)}이닝 ERA ${r.era.toFixed(2)}`:`지난해 ${h.g||0}경기 ERA ${r.era.toFixed(2)}`; }
  return `지난해 타율 ${fmt3(bRate(h).avg)}${h.hr?` ${h.hr}홈런`:''}`; }
/* 개막 9일 전: 참석 선수 추천 */
function mdPlan(){ const open=G.cal.open; const m=G.mgr[G.user]; const who=m&&!m.interim?`${m.name} 감독`:'감독대행';
  const cap=mdCaptain(G.user); const pool=mdRepPool(G.user); const rec=pool[0]; if(!cap||!rec)return;
  const young=pool.filter(p=>p.age<=24&&p!==rec).sort((a,b)=>(b.pot||0)-(a.pot||0))[0];
  const alts=pool.slice(1,3).concat(young&&!pool.slice(1,3).includes(young)?[young]:[]).slice(0,3);
  G.md={y:G.year,tid:G.user,day:open-2,cap:cap.id,rep:rec.id,rec:rec.id,res:null,alts:alts.map(p=>p.id)};
  mail('감독실',`[미디어데이] 참석 선수 확인 (${dmd(open-2)})`,`${dmd(open-2)} 개막 미디어데이에는 구단마다 감독, 주장, 대표 선수 1명이 나갑니다. 단장은 나가지 않습니다.\n\n${who} 추천\n주장: ${cap.name} (${posLabel(cap)}, ${cap.age}세)\n대표 선수: ${rec.name} (${posLabel(rec)}, ${rec.age}세) · ${mdWhy(rec)}\n\n대표 선수를 다른 선수로 바꾸고 싶으면 감독에게 건의할 수 있습니다. 미디어데이에 나가는 선수는 기분이 오르고 팬 관심을 받습니다. 감독과 선수가 한 말은 다음 날 기사로 나옵니다. 답하지 않으면 감독 추천대로 갑니다.`,
    {imp:true,kind:'감독',acts:[{l:'감독 추천대로',a:'mdRep',v:'ok'}].concat(alts.map(p=>({l:`건의: ${p.name} (${posLabel(p)}, ${p.age}세)`,a:'mdRep',v:String(p.id)})))});
  /* 단장의 몫: 감독이 미디어데이에서 밝힐 목표 수위를 미리 맞춘다(플레이테스트 4 #20) */
  if(m&&!m.interim)mail('홍보팀',`[미디어데이] 감독 출사표 방향 (${dmd(open-2)})`,`미디어데이에서 ${who}이(가) 올 시즌 목표를 밝힙니다. 단장이 미리 방향을 맞춰 둘 수 있습니다.\n\n1. 감독에게 맡기기: 감독 성향과 예상 순위대로 말합니다.\n2. 목표를 크게: 우승 또는 가을야구를 공언합니다. 팬 여론이 더 오르지만(+1~2) 못 지키면 시즌 뒤 실망이 큽니다. 감독 관계 조금 개선.\n3. 신중하게: 공약 없이 한 계단씩을 말합니다. 팬 여론은 덜 오르고 부담도 없습니다. 감독이 큰소리를 좋아하는 성향이면 관계 조금 악화.\n\n답하지 않으면 감독에게 맡깁니다.`,{kind:'감독',acts:[{l:'감독에게 맡기기',a:'mdGoal',v:'auto'},{l:'목표를 크게',a:'mdGoal',v:'bold'},{l:'신중하게',a:'mdGoal',v:'calm'}]}); }
function mdGoalPick(v){ const D=G.md; if(!D||D.y!==G.year||(D.tid!=null&&D.tid!==G.user)||G.unemp||G.day>=D.day)return '이미 지난 일입니다.'; if(D.gp)return '이미 정했습니다.'; if(!['auto','bold','calm'].includes(v))return '';
  const m=G.mgr[G.user]; D.gp=v; if(m&&!m.interim){ mgrFix(m); const bold=m.ego>=65||mgrVoice(m)==='fire'; if(v==='bold')m.rel=clamp(m.rel+1,0,100); else if(v==='calm'&&bold)m.rel=clamp(m.rel-1,0,100); }
  return v==='auto'?'감독에게 맡겼습니다.':v==='bold'?'감독이 목표를 크게 밝히기로 했습니다. 지키지 못하면 시즌 뒤 실망이 큽니다.':'감독이 공약 없이 신중하게 말하기로 했습니다.'; }
function mdSuggest(v){ const D=G.md; if(!D||D.y!==G.year||(D.tid!=null&&D.tid!==G.user)||G.unemp||G.day>=D.day)return '이미 지난 일입니다.'; if(D.res)return D.res==='rej'?'감독이 이미 거절했습니다.':'이미 정했습니다.';
  const m=G.mgr[G.user]; const who=m&&!m.interim?`${m.name} 감독`:'감독대행';
  mdRefresh(D); const cap=G.players[D.cap], rep=G.players[D.rep]; if(!cap||!rep)return '참석 가능한 선수가 부족합니다.';
  if(v==='ok'){ D.res='ok'; return `${who} 추천대로 ${G.players[D.cap].name}, ${G.players[D.rep].name}이(가) 나갑니다.`; }
  const p=G.players[+v]; if(!p||p.team!==G.user)return '우리 선수가 아닙니다.'; if(!mdRepPool(G.user).some(x=>x.id===p.id))return '현재 상태로는 대표 선수로 참석할 수 없습니다.';
  const pr=!m||m.interim?.9:mplOn('listen')?.95:clamp(.9-((m.ego??50)-50)/80,.45,.9);
  if(R()<pr){ D.rep=p.id; D.accepted=p.id; D.res='acc'; return `${who}: "좋습니다. ${p.name}이(가) 나가는 것도 의미가 있겠네요." ${p.name}이(가) 대표 선수로 나갑니다.`; }
  D.res='rej'; if(m&&!m.interim)m.rel=clamp(m.rel-1,0,100); return `${who}: "미디어데이는 팀 얼굴이 나가는 자리입니다. ${G.players[D.rec].name}으로 가겠습니다." 건의가 받아들여지지 않았습니다. 관계 조금 악화.`; }
/* 추천 이후 상태 변화는 건의 시점과 행사 당일에 함께 확인한다. */
function mdRefresh(D){ const cap=mdCaptain(G.user); D.cap=cap?cap.id:null; if(!mdAvailable(G.players[D.rep],G.user)||D.rep===D.cap){ const rep=mdRepPool(G.user).find(p=>p.id!==D.cap); D.rep=rep?rep.id:null; D.rec=D.rep; if(D.res==='acc'&&D.accepted==null)D.res='ok'; } }
/* 예상 순위(개막 전 전문가 예상과 같은 방식) */
function mdProj(){ return G.teams.map(x=>({id:x.id,r:projRating(x.id)+hn('proj'+G.year,x.id)*.7})).sort((p,q)=>q.r-p.r).map(x=>x.id); }
const MD_STYLE={data:'"준비한 대로 숫자가 나오면 결과는 따라옵니다."',fire:'"올해는 독하게 붙겠습니다. 지는 데 익숙해지지 않겠습니다."',warm:'"선수들이 겨울 내내 정말 고생했습니다. 그 땀이 보답받았으면 합니다."',old:'"기본에 충실한 야구로 한 시즌 버티겠습니다."',calm:'"한 경기 한 경기 차분하게 쌓아 가겠습니다."'};
/* 감독 목표 발언: 예상 순위 r, 성향 */
function mdMgrGoal(tid,r){ const m=G.mgr[tid]; if(!m||m.interim)return {k:null,t:'"주어진 상황에서 최선을 다하겠습니다."',w:'최선'};
  mgrFix(m); const bold=m.ego>=65||mgrVoice(m)==='fire';
  if(r<=2)return bold?{k:'champ',t:'"목표는 우승입니다. 그 외에는 생각하지 않습니다."',w:'우승'}:{k:'ps',t:'"정상에 도전하겠습니다. 가을야구는 기본으로 생각합니다."',w:'정상 도전'};
  if(r<=5)return bold?{k:'champ',t:'"우리도 우승 후보라고 생각합니다. 끝까지 가겠습니다."',w:'우승'}:{k:'ps',t:'"가을야구가 첫 목표입니다."',w:'가을야구'};
  return bold?{k:'ps',t:'"평가가 낮은 건 압니다. 가을야구로 증명하겠습니다."',w:'가을야구'}:{k:null,t:'"한 계단씩 올라가는 시즌을 만들겠습니다."',w:'한 계단씩'}; }
/* 선수 발언: 성격(욕심·충성·프로의식)과 지난 기록 */
function mdPlayerLine(p,role){ initPers(p); const h=seasonTotal(p,G.year-1,'1군'); const P=p.pers;
  const pk=L=>L[Math.floor(u01('mdl'+G.year+role,p.id)*L.length)];
  if(role==='cap'||role==='cap2'){ return pk(P.loy>=13?[`"팬들께 받은 응원, 올해는 꼭 돌려드리겠습니다. 마지막까지 이 팀에서 웃고 싶습니다."`,`"이 유니폼을 입고 우승하는 게 꿈입니다. 올해가 그해였으면 합니다."`,`"원정 경기장에서도 우리 팬 목소리가 제일 큽니다. 그 응원에 답하겠습니다."`]
      :P.pro>=13?[`"캠프에서 선수들 몸을 잘 만들었습니다. 부상 없이 끝까지 가는 게 주장으로서 목표입니다."`,`"작년에 부족했던 걸 겨울 내내 고쳤습니다. 숫자로 보여 드리겠습니다."`,`"주장은 말보다 행동입니다. 제일 먼저 나와서 제일 늦게 들어가겠습니다."`]
      :P.amb>=13?[`"목표는 높게 잡았습니다. 가을 끝까지 야구하겠습니다."`,`"올해는 우리가 주인공이 될 차례입니다."`]
      :[`"선수들끼리 분위기가 정말 좋습니다. 그 분위기를 시즌 끝까지 가져가겠습니다."`,`"고참과 어린 선수들이 잘 섞였습니다. 끈끈한 야구를 보여 드리겠습니다."`,`"한 경기 한 경기 즐기면서 하겠습니다. 결과는 따라올 겁니다."`]); }
  if(P.amb>=14){ if(p.isP)return (p.role==='SP'||(h&&h.outs>=300))?`"개인 목표는 두 자릿수 승리와 규정이닝입니다. 숨기지 않겠습니다."`:`"뒤에서 문을 잠그는 투수가 되겠습니다. 블론세이브는 없습니다."`;
    const hr=h&&h.hr||0; return hr>=15?`"${Math.ceil((hr+5)/5)*5}홈런이 목표입니다. 작년보다 더 넘기겠습니다."`:`"올해는 제 이름을 확실히 알리는 시즌으로 만들겠습니다."`; }
  if(p.age<=24)return `"형들 따라가면서 많이 배우겠습니다. 기회가 오면 놓치지 않겠습니다."`;
  return `"개인 기록보다 팀이 먼저입니다. 이기는 경기에 보탬이 되겠습니다."`; }
const MD_FANQ=[['캠프에서 가장 웃겼던 동료는?','"말하면 큰일 납니다. 시즌 끝나고 알려 드리겠습니다."'],['홈런 치면 어떤 세리머니를 할 건가요?','"아직 비밀입니다. 첫 홈런 때 보여 드리겠습니다."'],['쉬는 날에는 뭘 하나요?','"잠만 잡니다. 정말입니다."'],['감독님께 바라는 점은?','"지금처럼만 믿어 주시면 됩니다."']];
/* 개막 2일 전: 미디어데이 */
function mdRun(){ const open=G.cal.open; let D=G.md; if(!D||D.y!==G.year||(D.tid!=null&&D.tid!==G.user)){ const cap=mdCaptain(G.user), rec=mdRepPool(G.user)[0]; if(!cap||!rec)return; D=G.md={y:G.year,tid:G.user,day:G.day,cap:cap.id,rep:rec.id,rec:rec.id,res:'ok',alts:[]}; }
  if(D.ran)return; D.tid=G.user; D.ran=true; const proj=mdProj(); const r=proj.indexOf(G.user)+1; const m=G.mgr[G.user]; const who=m&&!m.interim?`${m.name} 감독`:'감독대행';
  mdRefresh(D);
  const cap=G.players[D.cap], rep0=G.players[D.rep], rep=rep0&&rep0!==cap&&mdAvailable(rep0,G.user)?rep0:null; let g=mdMgrGoal(G.user,r); if(D.gp==='bold'&&m&&!m.interim&&g.k!=='champ')g=r<=4?{k:'champ',t:'"목표는 우승입니다. 단장님과도 그렇게 이야기했습니다."',w:'우승'}:{k:'ps',t:'"가을야구는 반드시 갑니다. 팬들께 약속드립니다."',w:'가을야구'}; else if(D.gp==='calm'&&m&&!m.interim)g={k:null,t:'"숫자로 된 목표는 말씀드리지 않겠습니다. 한 계단씩 올라가겠습니다."',w:'한 계단씩'}; const sty=m&&!m.interim?MD_STYLE[mgrVoice(m)]:'';
  const fq=pick(MD_FANQ); const L=[[who,g.t+(sty?' '+sty:'')]];
  if(cap&&cap.team===G.user)L.push([`${team(G.user).cap===cap.id?'주장':'주장 대행'} ${cap.name}`,mdPlayerLine(cap,'cap')]); if(rep&&rep.team===G.user)L.push([`${rep.name}`,mdPlayerLine(rep,'rep')]);
  prInit(); let fan=1; if(g.k==='champ')fan+=2; else if(g.k==='ps')fan+=1; G.pr.fan=clamp(G.pr.fan+fan,0,100);
  if(cap&&cap.team===G.user)cap.mor=clamp((cap.mor??60)+2,0,100); if(rep&&rep.team===G.user){ rep.mor=clamp((rep.mor??60)+(D.res==='acc'&&(D.accepted??D.rep)===rep.id&&rep.age<=24?6:4),0,100); }
  if(g.k&&m&&!m.interim)G.mdProm={y:G.year,k:g.k,mid:m.id,name:m.name,tid:G.user};
  const others=G.teams.filter(t=>t.id!==G.user).map(t=>{ const x=mdMgrGoal(t.id,proj.indexOf(t.id)+1); return `${tshort(t.id)} ${x.w}`; });
  /* 다른 구단: 우승 후보와 몇 팀의 주장 발언, 우리를 겨냥한 한마디 */
  const riv=[], champ=G.last&&G.last.ps?G.last.ps.champ:null; const nk=team(G.user).nick;
  const pickT=[proj[0],proj[1],champ].filter((x,i,a)=>x!=null&&x!==G.user&&a.indexOf(x)===i).slice(0,2);
  const said=new Set(L.map(x=>x[1])); for(const tid of pickT){ const c=mdCaptain(tid); if(!c)continue; let t=mdPlayerLine(c,'cap'); if(said.has(t))t=mdPlayerLine(c,'cap2'); if(said.has(t))continue; said.add(t); riv.push([`${tshort(tid)} ${team(tid).cap===c.id?'주장':'주장 대행'} ${c.name}`,t]); } /* 같은 발언이 두 번 나오지 않게(리뷰 11-08) */
  let jab=null; for(const t of G.teams){ if(t.id===G.user||jab)continue; const m=G.mgr[t.id]; if(!m||m.interim)continue; mgrFix(m); const bold=m.ego>=68||mgrVoice(m)==='fire'; if(!bold)continue;
    if(champ===G.user)jab={tid:t.id,t:`"지난해 챔피언 ${nk}을(를) 끌어내리겠습니다. 그게 올해 목표입니다."`};
    else if(r<=3&&proj.indexOf(t.id)+1>r)jab={tid:t.id,t:`"${nk}이(가) 우승 후보라던데, 붙어 보면 알 겁니다."`};
    else if(r>=8)jab={tid:t.id,t:`"${nk} 말씀입니까? 솔직히 신경 쓰지 않습니다."`}; }
  if(jab){ for(const p of playersOf(G.user))p.mor=clamp((p.mor??60)+1,0,100); riv.push([`${tshort(jab.tid)} ${G.mgr[jab.tid].name} 감독`,jab.t]); }
  D.out={L,fan,g:g.w,prom:g.k,fq,r,others,riv,jab:jab?{tid:jab.tid,t:jab.t}:null,rep:rep&&rep.id,cap:cap&&cap.id}; D.pub=G.day+1; }
function mdPub(){ const D=G.md; if(!D||!D.out||D.pubd||G.day<D.pub)return; D.pubd=true; const O=D.out, tid=D.tid??G.user, own=!G.unemp&&tid===G.user;
  const n0=news('언론',`${tshort(tid)} ${O.L[0][0]} "${O.L[0][1].replace(/^"|"$/g,'').split('.')[0].slice(0,26)}"`,`개막 미디어데이에서 ${O.L.map(([w,t])=>`${w}: ${t}`).join(' ')}`,O.prom==='champ'?1:0,{tid});
  if(O.L[2])news('선수',`${O.L[2][0]} "${O.L[2][1].replace(/^"|"$/g,'').split('.')[0].slice(0,26)}"`,`개막 미디어데이 대표 선수로 나선 ${O.L[2][0]}: ${O.L[2][1]} 팬 질문 '${O.fq[0]}'에는 ${O.fq[1]}라고 답했습니다.`,1,{ref:O.rep,tid});
  if(O.jab)news('경기',`${tshort(O.jab.tid)} 감독, ${team(tid).nick} 겨냥 "${O.jab.t.replace(/^"|"$/g,'').split('.')[0].slice(0,24)}"`,`개막 미디어데이에서 ${tname(O.jab.tid)} 감독이 ${tname(tid)}을(를) 겨냥했습니다. ${O.jab.t} ${tshort(tid)} 선수단은 자극을 받았습니다.`,0,{tid});
  news('언론',`${G.teams.length}개 구단 사령탑 출사표`,`개막 미디어데이에서 각 구단 감독이 목표를 밝혔습니다. ${O.others.join(' · ')} · ${tshort(tid)} ${O.g}.`,0,{tid});
  if(own)mail('홍보팀','[기사] 개막 미디어데이 기사가 나왔습니다',`${O.L.map(([w,t])=>`${w}: ${t}`).join('\n')}\n\n팬 질문 '${O.fq[0]}' → ${O.fq[1]}\n\n반응: 팬 여론 호전. 나간 선수들은 기분이 올랐습니다.${(O.riv||[]).length?`\n\n다른 구단\n${O.riv.map(([w,t])=>`${w}: ${t}`).join('\n')}${O.jab?'\n상대 감독의 도발에 우리 선수단이 자극을 받았습니다. 기분 조금 상승.':''}`:''}${O.prom?`\n감독이 '${O.prom==='champ'?'우승':'가을야구'}'를 공언했습니다. 시즌 뒤 지켰는지 다시 기사가 납니다(전력분석팀 예상 ${O.r}위).`:''}${fpNewsReact(n0)}`,{kind:'언론',acts:[{l:'기사 보기',a:'go',v:'club:news'}]}); }
/* 포스트시즌 미디어데이: 준플레이오프부터, 1차전 하루 전 */
function mdPsRun(s){ if(!s||!['spo','po','ks'].includes(s.round)||!(s.hi===G.user||s.lo===G.user))return; const op=s.hi===G.user?s.lo:s.hi; const m=G.mgr[G.user]; const who=m&&!m.interim?`${m.name} 감독`:'감독대행';
  const key=playersOf(G.user).map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h&&mdAvailable(x.p,G.user)&&psOk(x.p)).sort((a,b)=>warOf(b.h,b.p)-warOf(a.h,a.p));
  const bat=key.find(x=>!x.p.isP), pit=key.find(x=>x.p.isP); const two=[bat,pit].filter(Boolean).map(x=>x.p);
  const n=s.need[0]; const bold=m&&!m.interim&&(m.ego>=65||mgrVoice(m)==='fire'); const fin=bold?n:n+1; const len=s.days.length;
  const mq=`"${Math.min(fin,len)}차전에서 끝내겠습니다." ${s.hi===G.user?(((s.homes||[])[Math.min(fin,len)-1]??s.hi)===G.user?'"정규시즌 순위가 높은 만큼 우리 홈에서 마무리하겠습니다."':'"정규시즌 순위가 높은 만큼 끝까지 주도권을 잡겠습니다."'):'"도전자 입장이라 잃을 게 없습니다."'}`; /* 끝내겠다는 경기가 실제로 우리 홈일 때만 '홈에서 마무리'(검수 11-06) */
  const pl=two.map(p=>{ initPers(p); return [p.name,p.pers.amb>=14?`"큰 경기에 강하다는 걸 보여 드리겠습니다."`:p.isP?`"제 공을 믿고 던지겠습니다. 한 이닝이라도 더 막겠습니다."`:`"한 타석 한 타석 집중하겠습니다. 팬들과 함께 이기고 싶습니다."`]; });
  const om=G.mgr[op]; const oq=om&&!om.interim?`${om.name} 감독(${tshort(op)}): "${s.hi===op?'우리 홈에서 시작하는 만큼 기선을 잡겠습니다.':'정규시즌과는 다를 겁니다.'}"`:'';
  for(const p of two)p.mor=clamp((p.mor??60)+3,0,100);
  news('언론',`${ROUNDK[s.round]} 미디어데이: ${tshort(G.user)} "${Math.min(fin,len)}차전에서 끝낸다"`,`${who}: ${mq} ${pl.map(([a,b])=>`${a}: ${b}`).join(' ')} ${oq}`,0);
  (G.mdPsQ=G.mdPsQ||[]).push({tid:G.user,players:two.length,day:G.day+1,t:`${ROUNDK[s.round]} 미디어데이`,L:[[who,mq]].concat(pl),oq}); }
function mdPsPub(){ const Q=G.mdPsQ||[]; const due=Q.filter(x=>x.day<=G.day); if(!due.length)return; G.mdPsQ=Q.filter(x=>x.day>G.day);
  for(const x of due)if(!G.unemp&&(x.tid==null||x.tid===G.user))mail('홍보팀',`[기사] ${x.t} 기사가 나왔습니다`,`${x.L.map(([w,t])=>`${w}: ${t}`).join('\n')}${x.oq?`\n\n상대: ${x.oq}`:''}${(x.players??Math.max(0,x.L.length-1))?'\n\n나간 선수들은 기분이 올랐습니다.':''}`,{kind:'언론',acts:[{l:'기사 보기',a:'go',v:'club:news'}]}); }
function mdDaily(){ try{ mdPub(); }catch(e){} try{ mdPsPub(); }catch(e){} if(G.unemp||!G.cal)return; const open=G.cal.open;
  if(G.day===open-9&&!(G.md&&G.md.y===G.year))try{ mdPlan(); }catch(e){ console.error(e); }
  if(G.day===open-2)try{ mdRun(); }catch(e){ console.error(e); }
  const s=G.ps&&!G.ps.done&&G.ps.cur; if(s&&['spo','po','ks'].includes(s.round)&&(s.hi===G.user||s.lo===G.user)&&G.day===s.days[0]-1&&G.psMD!==G.year+':'+s.round){ G.psMD=G.year+':'+s.round; try{ mdPsRun(s); }catch(e){ console.error(e); } }
 }
/* 시즌 뒤: 감독 공언 점검 */
function mdPromCheck(){ const P=G.mdProm; if(!P||P.y!==G.year)return; delete G.mdProm; const T=P.tid??G.user; /* 공언한 감독의 구단 성적으로(단장이 이직해도) */ const ok=P.k==='ps'?!!(G.ps&&G.ps.seeds&&G.ps.seeds.includes(T)):!!(G.ps&&G.ps.champ===T);
  const w=P.k==='ps'?'가을야구':'우승'; news('언론',ok?`${P.name} 감독, 미디어데이 '${w}' 약속 지켰다`:`${P.name} 감독의 '${w}' 출사표, 빈말로`,ok?'개막 미디어데이에서 밝힌 목표를 이뤘습니다.':'개막 미디어데이에서 밝힌 목표에 닿지 못했습니다. 감독의 말에 무게가 떨어졌다는 평가입니다.',ok?2:-2,{tid:T});
  const m=G.mgr[G.user]; if(m&&m.id===P.mid&&!ok&&P.k==='champ'){ prInit(); G.pr.fan=clamp(G.pr.fan-1,0,100); } }
