/* ===== 언론사 · 기자 친분 · 언론 플레이 =====
 언론사마다 논조·분야·영향력이 있고, 기자는 한 언론사에 속한다(언론사당 2명). 기사는 그 언론사 기자 이름으로 나가고,
 같은 사건도 어느 매체가 쓰느냐에 따라 여론 효과가 달라진다(비판 매체는 나쁜 소식을 키우고, 우호 매체는 좋은 소식을 키운다).
 단장은 기자와 먼저 친분을 쌓고(전화·식사), 친한 기자를 통해 언론 플레이를 할 수 있다.
 - 영입 의지 공개: "○○를 데려오겠다". 팬은 기대하고, 지목된 선수는 우리에게 호감이 생긴다(FA 때 우리 구단 매력).
   다른 구단 소속 선수를 공개적으로 원하면 그 구단 단장은 불쾌해하고, 우리와 트레이드할 때 값을 더 부른다.
   기한 안에 데려오면 '약속 지킨 단장', 못 데려오면 '말만 앞선 단장'으로 팬과 언론이 돌아선다.
 - 투자 선언: "올해 투자하겠다". 팬 여론이 오르지만, 돈 이야기를 먼저 꺼낸 단장을 구단주가 지적하기도 한다(수익형 구단주는 크게).
   다음 개막까지 연봉 규모를 5% 이상 늘리지 못하면 팬이 실망하고 구단주 신뢰도 깎인다.
 기자가 써 주는 방식(호의적/그대로/비꼬아서)은 친분·기자 성향·언론사 논조에 따라 다르다. 언론 플레이는 30일에 한 번. */
const OUTLET_DEF={
  '스포츠한빛':{lean:1,field:'현장 취재',reach:4,d:'현장 소식을 가장 빨리 전합니다. 구단에 대체로 우호적입니다.'},
  '데일리 베이스볼':{lean:0,field:'데이터 분석',reach:3,d:'기록과 데이터로 씁니다. 논조는 중립입니다.'},
  '야구일보':{lean:-1,field:'구단 경영·이적 시장',reach:5,d:'가장 영향력이 큰 매체입니다. 프런트를 날카롭게 봅니다.'},
  '더그아웃 매거진':{lean:1,field:'인물 기획',reach:2,d:'선수·인물 이야기를 깊게 다룹니다. 우호적이지만 영향력은 작습니다.'}};
const OUTLET_LEAN={1:'우호적',0:'중립',[-1]:'비판적'};
function outletOf(name){ return OUTLET_DEF[name]||{lean:0,field:'',reach:3,d:''}; }
/* 일반 기사: 영향력이 큰 매체가 더 자주 쓴다. 기사 효과 배율(논조·영향력) */
function outletPick(seed){ const K=Object.keys(OUTLET_DEF); const w=K.map(k=>OUTLET_DEF[k].reach); let x=u01('out'+seed,G.day)*sum(w); for(let i=0;i<K.length;i++){ x-=w[i]; if(x<0)return K[i]; } return K[0]; }
function outletMul(name,tone){ const O=outletOf(name); if(!tone)return 1; let m=.8+O.reach*.08; if(tone<0&&O.lean<0)m*=1.3; else if(tone>0&&O.lean>0)m*=1.2; else if(O.lean&&Math.sign(tone)!==O.lean)m*=.8; return m; }
function outletRep(name){ const L=pressInit().filter(r=>r.outlet===name); return L.length?L[Math.floor(u01('rp'+name,G.day)*L.length)]:null; }

/* ---------- 기자 친분 쌓기 ---------- */
function repContact(id,kind){ const r=repById(id); if(!r)return '기자를 찾을 수 없습니다.'; G.repc=G.repc||{}; const c=G.repc[id]=G.repc[id]||{};
  const dim=r.rel>60?Math.max(.3,1-(r.rel-60)/40):1; const sty=r.style==='cr'?.7:r.style==='fr'?1.2:1;
  if(kind==='call'){ if(c.call!=null&&c.call>G.day-14)return `${r.name} 기자와는 ${dmd(c.call+14)}부터 다시 통화할 수 있습니다.`; c.call=G.day; const d=Math.max(1,Math.round(ri(1,3)*dim*sty)); repRel(r,d,'단장 전화'); return `${r.outlet} ${r.name} 기자와 통화했습니다. 친분 +${d}(${r.rel}).`; }
  if(kind==='meal'){ if(c.meal!=null&&c.meal>G.day-30)return `${r.name} 기자와 식사는 ${dmd(c.meal+30)}부터 가능합니다.`; c.meal=G.day; G.spend.etc=(G.spend.etc||0)+10; const d=Math.max(1,Math.round(ri(3,6)*dim*sty)); repRel(r,d,'단장과 식사'); return `${r.outlet} ${r.name} 기자와 저녁을 먹었습니다(1천만 원). 친분 +${d}(${r.rel}).${r.style==='cr'?' 비판적인 기자라 쉽게 가까워지지는 않습니다.':''}`; }
  return ''; }

/* ---------- 언론 플레이 ---------- */
const PP_COOL=30, PP_MIN_REL=40; /* 내가 먼저 연락할 때: 친분 40 미만이면 거절, 60 이상이면 호의적으로 써 줄 가능성이 크다. 친분은 인터뷰 응답과 단독 정보 제공으로 쌓인다 */
function ppReady(){ return G.ppLast==null||G.day-G.ppLast>=PP_COOL; }
/* 기자가 어떻게 써 주나: 친분·성향·언론사 논조 */
function ppFrame(r){ const O=outletOf(r.outlet); const s=r.rel+O.lean*8+(r.style==='fr'?10:r.style==='cr'?-12:0)+N(0,8); return s>=62?'good':s>=45?'flat':'bad'; }
function ppTargets(){ const L=[]; const add=p=>{ if(p&&p.team!==G.user&&!p.foreign&&!p.prospect&&!L.includes(p))L.push(p); };
  for(const id of (G.shortlist||[]))add(G.players[id]); if(G.fa&&!G.fa.closed)for(const id of (G.fa.pool||[]).slice(0,15))add(G.players[id]);
  Object.values(G.players).filter(p=>p.team!=null&&p.team!==G.user&&!p.foreign&&!p.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,12).forEach(add); return L.slice(0,24); }
function ppFA(p){ return !!(G.fa&&!G.fa.closed&&(G.fa.pool||[]).includes(p.id)); }
function pressPlay(repId,kind,pid,via){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; const r=repById(repId); if(!r)return '기자를 고르세요.'; if(!ppReady())return `언론 플레이는 30일에 한 번입니다. ${dmd(G.ppLast+PP_COOL)}부터 다시 할 수 있습니다.`;
  if(via!=='iv'&&r.rel<PP_MIN_REL)return `${r.name} 기자가 "그런 얘기는 기사로 쓰기 어렵습니다"라며 거절했습니다. 친분이 ${PP_MIN_REL} 이상이어야 먼저 연락한 이야기를 받아 줍니다(지금 ${r.rel}). 이 기자의 인터뷰 요청에 성실히 응하거나 단독 정보를 주면 가까워집니다.`;
  const O=outletOf(r.outlet); const fr=ppFrame(r); const k=.7+O.reach*.12; const t=team(G.user); const B=bossOf(G.user); G.ppLast=G.day; try{ meInc('pp'); }catch(e){} G.pledges=G.pledges||[]; prInit();
  const fanD=(b)=>{ const v=Math.round(b*k*(fr==='good'?1.2:fr==='bad'?.5:1)); G.pr.fan=clamp(G.pr.fan+v,0,100); return v; };
  if(kind==='sign'){ const p=G.players[pid]; if(!p||p.team===G.user)return '대상 선수를 고르세요.'; const fa=ppFA(p); const star=ovr(p)>=60;
    const v=fr==='good'?12:fr==='flat'?8:5; p.fond={tid:G.user,v,until:G.day+150};
    const fd=fanD(star?4:2); let other='';
    if(!fa&&p.team!=null){ const ot=team(p.team); ot.rel=clamp((ot.rel??50)-6,0,100); p.pledged={tid:G.user,until:G.day+60}; other=` ${tshort(p.team)} ${gmOf(p.team)?gmOf(p.team).name+' 단장':'구단'}은 "남의 선수를 공개적으로 거론하는 건 결례"라며 불쾌해합니다(친분 -6). 60일 동안 우리와의 트레이드에서 이 선수 값을 더 부릅니다.`; }
    const until=fa?(KD(1,24)>G.day?KD(1,24):G.day+60):G.day+120; G.pledges.unshift({k:'sign',pid,day:G.day,until,rep:r.id,done:false,tid:G.user});
    const title=fr==='bad'?`${meCall()}, "${p.name} 데려온다" 큰소리…현실성은?`:`${meCall()} "${p.name}, 꼭 데려오겠다"`;
    news('언론',title,`${r.outlet} ${r.name} 기자 단독. ${tname(G.user)} 단장이 ${p.team!=null?`${tshort(p.team)} `:'FA '}${p.name}(${posLabel(p)}, ${p.age}세) 영입 의지를 밝혔습니다.${fr==='bad'?' 다만 기사 논조는 회의적입니다.':''}`,fr==='bad'?-1:fr==='good'?2:1,{outlet:r.outlet,by:r.name,ref:p.id});
    if(fr==='bad')G.pr.press=clamp(G.pr.press-2,0,100);
    return `${r.outlet} ${r.name} 기자를 통해 ${p.name} 영입 의지를 밝혔습니다(${fr==='good'?'호의적으로 실림':fr==='flat'?'그대로 실림':'비꼬듯 실림'}). 팬 여론 ${fd>=0?'+':''}${fd}. ${p.name}이(가) 우리 구단에 호감을 갖습니다(+${v}).${other} ${dmd(until)}까지 데려오지 못하면 '말만 앞선 단장'이 됩니다.`; }
  if(kind==='invest'){ const base=capPay(G.user); const fd=fanD(5); G.pr.press=clamp(G.pr.press+(fr==='bad'?-1:1),0,100);
    const open=G.cal&&G.cal.open>G.day?G.cal.open:G.day+150; G.pledges.unshift({k:'invest',base,day:G.day,until:open,rep:r.id,done:false,tid:G.user});
    let own=''; if(!t.indie){ if(t.owner==='profit'){ t.trust=clamp(t.trust-4,0,100); own=`구단주 신뢰 -4. ${B.own.name} 회장: "돈 이야기는 내가 먼저 합니다. 지갑은 단장 것이 아닙니다."`; }
      else if(t.owner==='pr'){ t.trust=clamp(t.trust+1,0,100); own=`구단주 신뢰 +1. ${B.own.name} 회장: "화제가 되는 건 좋습니다. 말한 만큼 보여 주세요."`; }
      else { own=`${B.own.name} 회장: "성적으로 돌려받겠다는 뜻이라면 좋습니다. 그 말 책임지세요."`; }
      mail('구단주실',`투자 선언 기사에 대한 구단주 반응`,own,{kind:'구단주'}); }
    news('언론',fr==='bad'?`${meCall()} '투자 선언'…구단주 지갑은 열릴까`:`${meCall()} "올해 과감히 투자하겠다"`,`${r.outlet} ${r.name} 기자. ${tname(G.user)} 단장이 전력 보강을 위한 투자를 예고했습니다.`,fr==='bad'?-1:1,{outlet:r.outlet,by:r.name});
    return `${r.outlet} ${r.name} 기자를 통해 투자를 선언했습니다. 팬 여론 +${fd}. ${own} ${dmd(open)}까지 연봉 규모를 5% 이상 늘리지 못하면 팬이 실망합니다.`; }
  return ''; }
/* 약속 점검: 매일 */
function ppDaily(){ if(!G.pledges||G.unemp)return; prInit(); for(const g of G.pledges){ if(g.done)continue; if(g.tid!=null&&g.tid!==G.user){ g.done=true; g.void=true; continue; } /* 다른 구단에서 한 약속은 이 구단과 상관없다 */ const r=repById(g.rep);
    if(g.k==='sign'){ const p=G.players[g.pid]; const ok=p&&p.team===G.user; if(!ok&&G.day<=g.until&&p)continue; g.done=true; g.ok=ok;
      if(ok){ G.pr.fan=clamp(G.pr.fan+3,0,100); G.rep=clamp((G.rep??50)+1,0,100); if(r)repRel(r,2,'약속 이행'); news('언론',`${meCall()}, ${p.name} 영입 약속 지켰다`,`공개적으로 원했던 ${p.name}을(를) 결국 데려왔습니다.`,2,{outlet:r?r.outlet:undefined,by:r?r.name:undefined,ref:p.id}); }
      else { G.pr.fan=clamp(G.pr.fan-5,0,100); G.pr.press=clamp(G.pr.press-2,0,100); if(r)repRel(r,-3,'약속 불이행'); news('언론',`'${p?p.name:'영입'} 데려온다'던 ${meCall()}, 결국 빈손`,`공개적으로 영입 의지를 밝혔지만 성사되지 않았습니다. 말만 앞선다는 비판이 나옵니다.`,-2,{outlet:r?r.outlet:undefined,by:r?r.name:undefined}); } }
    else if(g.k==='invest'){ if(G.day<g.until)continue; g.done=true; const now=capPay(G.user); g.ok=now>=g.base*1.05; const t=team(G.user);
      if(g.ok){ G.pr.fan=clamp(G.pr.fan+2,0,100); news('언론',`${tshort(G.user)}, 투자 선언 지켰다`,`연봉 규모를 ${Math.round((now/g.base-1)*100)}% 늘려 개막을 맞습니다.`,1,{outlet:r?r.outlet:undefined,by:r?r.name:undefined}); }
      else { G.pr.fan=clamp(G.pr.fan-7,0,100); t.trust=clamp(t.trust-2,0,100); news('언론',`'투자하겠다'던 ${tshort(G.user)}, 연봉 규모는 제자리`,`단장의 투자 선언과 달리 연봉 규모가 거의 늘지 않았습니다.`,-2,{outlet:r?r.outlet:undefined,by:r?r.name:undefined}); } } }
  G.pledges=G.pledges.filter(g=>!g.done||G.day-g.until<120).slice(0,12); }
/* 지목된 선수의 호감: FA 때 우리 구단 매력에 더해진다 */
function ppFond(p,tid){ return p&&p.fond&&p.fond.tid===tid&&G.day<=p.fond.until?p.fond.v:0; }

/* 단독 정보 주기: 내가 먼저 연락해 기자에게 특종거리를 준다. 그 기자와는 가까워지고, 다른 매체 기자들은 조금 서운해한다(기자마다 30일에 한 번) */
function repScoop(id){ if(G.unemp)return ''; const r=repById(id); if(!r)return '기자를 고르세요.'; G.repc=G.repc||{}; const c=G.repc[id]=G.repc[id]||{};
  if(c.scoop!=null&&c.scoop>G.day-30)return `${r.name} 기자에게는 ${dmd(c.scoop+30)}부터 다시 단독을 줄 수 있습니다.`; c.scoop=G.day;
  const dim=r.rel>60?Math.max(.35,1-(r.rel-60)/40):1; const d=Math.max(2,Math.round(ri(4,7)*dim*(r.style==='cr'?.75:1))); repRel(r,d,'단독 정보 제공');
  for(const o of pressInit())if(o.outlet!==r.outlet)repRel(o,-1,'다른 매체에 단독을 줌');
  news('구단',`[단독] ${tshort(G.user)}, 내부 운영 계획 공개`,`${r.outlet} ${r.name} 기자가 ${tname(G.user)} 프런트의 시즌 운영 계획을 단독으로 전했습니다.`,0,{outlet:r.outlet,by:r.name});
  return `${r.outlet} ${r.name} 기자에게 단독 정보를 줬습니다. 친분 +${d}(${r.rel}). 다른 매체 기자들은 조금 서운해합니다(-1).`; }
/* 인터뷰 마지막 질문: 하고 싶은 말(언론 플레이). 기자가 먼저 청한 자리라 친분 기준이 없다(30일 간격은 같다) */
function ivPPQ(){ if(G.unemp||!ppReady())return null; const opts=[{tone:'없음',t:'"오늘은 여기까지 하겠습니다."',fx:{fan:0,press:0}}];
  const tgt=(G.shortlist||[]).map(id=>G.players[id]).find(p=>p&&p.team!==G.user&&!p.foreign&&!p.prospect)||(G.fa&&!G.fa.closed?(G.fa.pool||[]).map(id=>G.players[id]).filter(Boolean).sort((a,b)=>ovr(b)-ovr(a))[0]:null);
  if(tgt)opts.push({tone:'영입 의지',t:`"${tgt.name} 선수, 꼭 데려오겠습니다."`,fx:{fan:0,press:0,pp:'sign',pid:tgt.id}});
  opts.push({tone:'투자 선언',t:'"올해는 과감하게 투자하겠습니다."',fx:{fan:0,press:0,pp:'invest'}});
  return {q:'끝으로 팬들께 따로 하실 말씀이 있습니까?',opts}; }
