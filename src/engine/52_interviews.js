/* ===== 기자 인터뷰·인터뷰 기사 =====
   단장 인터뷰: FA 영입·이탈, 트레이드, 주축 부상, 미디어데이, 트레이드 마감, 시즌 결산, 연승 때 기자가 인터뷰를 요청한다.
   소식함에서 '인터뷰 참여하기'를 누르면 질문 3개에 답한다. 답변은 팬 여론·언론 논조·선수 기분·감독 관계를 움직이고,
   공약(가을야구·우승·FA 큰손)을 하면 시즌 뒤 지켰는지에 따라 다시 평가받는다. 거절하면 '단장 침묵' 기사가 난다.
   감독·선수 인터뷰 기사: 경기·부상 복귀·불만·수상 등으로 감독과 선수가 한 말을 기사로 낸다(감독 말투 유형을 따른다) */
const REPORTERS=['김도윤','박서진','이하람','정우성','최가은','한지후','윤세라','오태민'];
function ivFx(fan,press,o){ return Object.assign({fan,press},o||{}); }
/* 질문 묶음: 상황별 3문항. tone은 화면 표시용 */
function ivBuild(k,d){ const P=d.pid!=null?G.players[d.pid]:null; const nm=P?P.name:''; const m=G.mgr[G.user]; const mn=m&&!m.interim?m.name+' 감독':'감독';
  const goal=[`올 시즌 목표를 말씀해 주시죠.`,[
    ['자신감','"우승에 도전합니다. 그만한 전력을 만들었습니다."',ivFx(3,1,{prom:'champ'})],
    ['자신감','"가을야구는 반드시 갑니다."',ivFx(2,1,{prom:'ps'})],
    ['신중','"한 경기씩 이기다 보면 결과가 따라올 겁니다."',ivFx(0,1)],
    ['현실','"아직 만들어 가는 팀입니다. 성장하는 과정을 봐 주십시오."',ivFx(-1,1)]]];
  const mgrQ=[`${mn}에 대한 신뢰는 변함없습니까?`,[
    ['지지','"전적으로 믿습니다. 현장은 감독이 맡는 겁니다."',ivFx(0,1,{mgr:5})],
    ['압박','"결과로 보여 줘야 합니다. 모든 건 성적이 말해 줄 겁니다."',ivFx(0,1,{mgr:-6})],
    ['회피','"그 얘기는 시즌 끝나고 하겠습니다."',ivFx(0,-1,{mgr:-2})]]];
  const Q={
    fa_sign:[[`${nm} 선수를 영입한 배경이 궁금합니다.`,[
        ['자신감','"우리 팀에 가장 필요한 선수였습니다. 전력의 마지막 조각입니다."',ivFx(2,0,{mor:[d.pid,4]})],
        ['신중','"오래 지켜본 선수입니다. 데이터로 충분히 검증했습니다."',ivFx(1,2)],
        ['공 넘기기',`"${mn}이 강하게 원했습니다."`,ivFx(0,-1,{mgr:3})]]],
      [`계약 규모가 크다는 지적이 있습니다.`,[
        ['자신감','"몸값은 실력으로 증명할 겁니다."',ivFx(1,-1,{mor:[d.pid,2]})],
        ['신중','"시장 가격을 반영한 합리적인 계약입니다."',ivFx(0,1)],
        ['회피','"금액 얘기는 하지 않겠습니다."',ivFx(-1,-2)]]], goal],
    fa_lost:[[`${nm} 선수를 놓쳤습니다. 이유가 무엇입니까?`,[
        ['솔직','"끝까지 최선을 다했지만 조건 차이가 컸습니다."',ivFx(0,1)],
        ['원칙','"정해 둔 기준을 넘는 계약은 하지 않습니다."',ivFx(-1,2)],
        ['비판','"선수가 돈을 택한 겁니다."',ivFx(-2,-3,{team:-2})]]],
      [`빈자리는 어떻게 메웁니까?`,[
        ['육성','"내부에 준비된 선수가 있습니다. 기회를 주겠습니다."',ivFx(0,1,{young:3})],
        ['영입','"시장에서 대안을 찾고 있습니다. 곧 소식을 드리겠습니다."',ivFx(2,0,{prom:'fa'})],
        ['회피','"지켜봐 주십시오."',ivFx(-1,-1)]]], goal],
    trade:[[`이번 트레이드, 팬들 사이에서 의견이 갈립니다.`,[
        ['자신감','"지금 우리에게 필요한 거래였습니다. 결과로 말하겠습니다."',ivFx(1,0)],
        ['설명','"양 팀 모두 필요한 걸 얻은 거래라고 봅니다."',ivFx(0,2)],
        ['미래','"당장보다 2~3년 뒤를 본 결정입니다."',ivFx(-1,1,{young:2})]]],
      [`떠난 선수에게 한마디 해 주시죠.`,[
        ['감사','"팀을 위해 헌신해 준 선수입니다. 진심으로 고맙습니다."',ivFx(2,1,{team:1})],
        ['담담','"프로의 세계입니다. 새 팀에서 잘하길 바랍니다."',ivFx(0,0)],
        ['냉정','"우리 계획에 맞지 않았을 뿐입니다."',ivFx(-2,-1,{team:-2})]]], mgrQ],
    injury:[[`${nm} 선수의 부상 공백이 큽니다.`,[
        ['육성','"그 자리는 젊은 선수들에게 기회입니다."',ivFx(0,1,{young:3})],
        ['영입','"외부 보강도 검토하고 있습니다."',ivFx(2,0,{prom:'fa'})],
        ['담담','"부상도 시즌의 일부입니다. 있는 선수로 버팁니다."',ivFx(-1,1)]]],
      [`복귀를 서두를 계획입니까?`,[
        ['보호','"절대 서두르지 않습니다. 선수 몸이 먼저입니다."',ivFx(0,2,{mor:[d.pid,4]})],
        ['기대','"빨리 돌아와 주길 바랍니다. 팀에 꼭 필요한 선수입니다."',ivFx(1,0,{mor:[d.pid,-2]})],
        ['의무팀','"의무팀 판단에 맡기겠습니다."',ivFx(0,1)]]], mgrQ],
    preseason:[goal,[`올 시즌 가장 기대하는 선수는 누구입니까?`,(d.cand||[]).slice(0,3).map(id=>{ const q=G.players[id]; return ['칭찬',`"${q?q.name:''} 선수입니다. 올해 일을 낼 겁니다."`,ivFx(1,0,{mor:[id,6]})]; }).concat([['단합','"한 명을 꼽을 수 없습니다. 모두가 주인공입니다."',ivFx(0,1,{team:1})]])], mgrQ],
    deadline:[[`트레이드 마감이 지났습니다. 만족하십니까?`,[
        ['자신감','"필요한 건 다 했습니다. 이제 선수들이 보여 줄 차례입니다."',ivFx(1,0)],
        ['아쉬움','"아쉬움이 남습니다. 원하던 조건이 나오지 않았습니다."',ivFx(-1,2)],
        ['다음','"무리한 거래보다 시즌 뒤를 준비하는 게 맞다고 봤습니다."',ivFx(-1,1,{young:1})]]], goal.map((x,i)=>i===0?'남은 시즌 목표는 무엇입니까?':x), mgrQ],
    season_end:[[`올 시즌을 평가해 주시죠.`,[
        ['만족','"선수들이 정말 잘해 줬습니다. 고맙다는 말밖에 없습니다."',ivFx(2,0,{team:3})],
        ['반성','"제 책임입니다. 겨울에 바로잡겠습니다."',ivFx(1,2)],
        ['비판','"기대에 못 미친 선수들이 있었습니다."',ivFx(-1,-1,{team:-3})]]],
      [`${mn}의 거취는요?`,[
        ['재신임','"내년에도 함께 갑니다."',ivFx(0,1,{mgr:6})],
        ['검토','"모든 걸 원점에서 검토하겠습니다."',ivFx(0,1,{mgr:-6})],
        ['노코멘트','"지금 드릴 말씀은 없습니다."',ivFx(0,-1,{mgr:-2})]]],
      [`겨울 FA 시장, 움직일 계획입니까?`,[
        ['큰손','"필요하면 과감하게 쓰겠습니다. 기대하셔도 좋습니다."',ivFx(3,0,{prom:'fa'})],
        ['신중','"꼭 필요한 자리만 보겠습니다."',ivFx(0,1)],
        ['육성','"외부 영입보다 내부 육성에 집중합니다."',ivFx(-2,1,{young:3})]]]],
    streak_win:[[`${d.n}연승입니다. 비결이 뭡니까?`,[
        ['공 돌리기','"선수들과 코칭스태프 덕분입니다."',ivFx(1,1,{team:2,mgr:2})],
        ['자신감','"겨울에 준비한 대로 되고 있습니다."',ivFx(1,0)],
        ['경계','"아직 시즌은 깁니다. 들뜨지 않겠습니다."',ivFx(0,2)]]], goal.map((x,i)=>i===0?'이 기세라면 목표를 높여도 되겠습니까?':x), mgrQ]};
  return (Q[k]||Q.preseason).map(([q,opts])=>({q,opts:opts.map(([tone,t,fx])=>({tone,t,fx}))})); }
const IV_TOPIC={fa_sign:'FA 영입',fa_lost:'FA 이탈',trade:'트레이드',injury:'주축 부상',preseason:'미디어데이',deadline:'트레이드 마감',season_end:'시즌 결산',streak_win:'연승'};
function ivRequest(k,d){ if(G.unemp)return; d=d||{}; const cur=G.iv; if(cur&&!cur.done&&cur.exp>=G.day)return; if(cur&&G.day-cur.day<8&&!['preseason','season_end','deadline'].includes(k))return;
  const R0=repPick(); const outlet=R0.outlet, rep=R0.name; const qs=ivBuild(k,d); if(!qs.length||qs.some(q=>!q.opts.length))return; { const pq=ivPPQ(); if(pq)qs.push(pq); } /* 마지막 질문: 언론 플레이 기회 */
  G.iv={id:(G.ivSeq=(G.ivSeq||0)+1),k,d,outlet,rep,repId:R0.id,qs,i:0,ans:[],exp:G.day+5,done:false,day:G.day};
  mail('홍보팀',`[인터뷰 요청] ${outlet}: ${IV_TOPIC[k]||'현안'}`,`${outlet} ${rep} 기자가 ${IV_TOPIC[k]||'현안'} 관련 단장 인터뷰를 요청했습니다. 질문은 ${qs.length}개입니다.\n\n답변에 따라 팬 여론·언론 논조·선수 기분·감독과의 관계가 달라집니다. 5일 안에 응하지 않으면 '단장 침묵' 기사가 나갑니다.`,{imp:true,kind:'언론',acts:[{l:'인터뷰 참여하기',a:'ivOpen',v:G.iv.id},{l:'정중히 거절',a:'ivSkip',v:G.iv.id}]}); }
function ivAnswer(j){ const v=G.iv; if(!v||v.done)return null; const q=v.qs[v.i]; const o=q&&q.opts[j]; if(!o)return null; const R0=repById(v.repId); const fx=Object.assign({},o.fx,{fan:repMul(R0,o.fx.fan),press:repMul(R0,o.fx.press)}); prInit();
  repRel(R0,['회피','비판','압박','냉정','노코멘트'].includes(o.tone)?-2:['솔직','설명','신중','감사','반성'].includes(o.tone)?2:1,`인터뷰 답변(${o.tone})`);
  G.pr.fan=clamp(G.pr.fan+fx.fan,0,100); G.pr.press=clamp(G.pr.press+fx.press,0,100);
  if(fx.mor){ const p=G.players[fx.mor[0]]; if(p)p.mor=clamp((p.mor??60)+fx.mor[1],0,100); }
  if(fx.mgr){ const m=G.mgr[G.user]; if(m&&!m.interim)m.rel=clamp(m.rel+fx.mgr,0,100); }
  if(fx.team)for(const p of playersOf(G.user))p.mor=clamp((p.mor??60)+fx.team,0,100);
  if(fx.young)for(const p of playersOf(G.user).filter(p=>p.age<=24))p.mor=clamp((p.mor??60)+fx.young,0,100);
  if(fx.prom){ const Y=sponSeason(); (G.ivProm=G.ivProm||[]).push({k:fx.prom,y:Y,d:G.day}); }
  if(o.fx.pp){ try{ const msg=pressPlay(v.repId,o.fx.pp,o.fx.pid,'iv'); if(msg)mail('홍보팀','인터뷰에서 한 말이 기사로 나갑니다',msg,{kind:'언론'}); }catch(e){} }
  v.ans.push({q:q.q,a:o.t,tone:o.tone,fx}); v.i++;
  if(v.i>=v.qs.length){ v.done=true; const big=v.ans.slice().sort((a,b)=>Math.abs(b.fx.fan)+Math.abs(b.fx.press)-Math.abs(a.fx.fan)-Math.abs(a.fx.press))[0];
    news('언론',`${tshort(G.user)} 단장 "${big.a.replace(/^"|"$/g,'').slice(0,30)}${big.a.length>32?'…':''}"`,`${v.outlet} ${v.rep} 기자와의 인터뷰에서 ${IV_TOPIC[v.k]} 관련 질문에 답했습니다. ${v.ans.map(x=>x.a).join(' ')}`,0,{outlet:v.outlet}); }
  return o; }
function ivSkip(){ const v=G.iv; if(!v||v.done)return; v.done=true; v.skip=true; repRel(repById(v.repId),-4,'인터뷰 거절'); news('언론',`${tshort(G.user)} 단장, ${IV_TOPIC[v.k]} 질문에 침묵`,'구단은 공식 입장을 내지 않았습니다. 팬들 사이에서 답답하다는 반응이 나옵니다.',-1,{outlet:v.outlet}); }
/* 공약 점검: 결산 때(가을야구·우승), 2월 1일(FA 큰손) */
function ivPromCheck(when){ const L=G.ivProm||[]; if(!L.length)return; const y=when==='season'?G.year:G.year-1; const keep=[];
  for(const p of L){ if(when==='season'&&(p.k==='ps'||p.k==='champ')&&p.y===y){ const ok=p.k==='ps'?!!(G.ps&&G.ps.seeds&&G.ps.seeds.includes(G.user)):!!(G.ps&&G.ps.champ===G.user);
      news('언론',ok?`${tshort(G.user)} 단장, '${p.k==='ps'?'가을야구':'우승'}' 약속 지켰다`:`${tshort(G.user)} 단장의 '${p.k==='ps'?'가을야구':'우승'}' 공언, 공수표로`,ok?'시즌 전 공언한 목표를 이뤄 냈습니다. 말에 무게가 실린다는 평가입니다.':'시즌 전 큰소리와 달리 목표에 닿지 못했습니다. 단장의 말을 믿기 어렵다는 반응입니다.',ok?3:-3,{fanW:ok?1:1.5}); continue; }
    if(when==='feb'&&p.k==='fa'&&G.year-p.y<=1){ const got=((G.fa&&G.fa.results)||[]).some(r=>r.to===G.user&&r.from!==G.user&&r.annual>=500&&r.day>=p.d); news('언론',got?`${tshort(G.user)}, 예고대로 FA 시장 큰손`:`${tshort(G.user)} 단장의 'FA 큰손' 예고, 말뿐이었다`,got?'겨울 전 예고한 대로 외부 영입에 나섰습니다.':'과감하게 쓰겠다던 겨울, 이렇다 할 외부 영입이 없었습니다.',got?2:-2); continue; }
    keep.push(p); }
  G.ivProm=keep.filter(p=>G.year-p.y<=1); }
/* ===== 감독·선수 인터뷰 기사 ===== */
const MQ={data:{w:['"숫자대로 갔고, 숫자대로 나왔습니다."','"상대 타자별 수비 위치가 잘 맞았습니다."'],l:['"내용은 나쁘지 않았습니다. 표본이 쌓이면 결과도 따라옵니다."','"타구 질은 우리가 더 좋았습니다. 운이 없었습니다."']},
  fire:{w:['"이게 우리 야구입니다! 끝까지 물고 늘어졌습니다."','"선수들이 미쳤습니다. 오늘 같은 날이 계속돼야 합니다."'],l:['"이런 경기는 용납 못 합니다. 내일 다시 정신 차리겠습니다."','"변명하지 않겠습니다. 다 제 책임입니다."']},
  warm:{w:['"애들이 너무 고생했습니다. 오늘은 칭찬만 하고 싶습니다."','"서로 믿고 했더니 결과가 나왔습니다."'],l:['"선수들 탓하지 마십시오. 제가 더 잘했어야 합니다."','"오늘 힘들었을 텐데 끝까지 잘 버텨 줬습니다."']},
  old:{w:['"야구는 기본입니다. 기본을 지키니 이겼습니다."','"오래 하다 보면 이런 날도 옵니다. 들뜨지 않겠습니다."'],l:['"기본이 안 됐습니다. 수비, 주루부터 다시 하겠습니다."','"한두 경기로 시즌이 끝나지 않습니다."']},
  calm:{w:['"계획한 대로 됐습니다. 다음 경기 준비하겠습니다."','"선수들이 각자 할 일을 했습니다."'],l:['"이런 날도 있습니다. 차분하게 다시 하겠습니다."','"잘못된 부분은 정리하고 넘어가겠습니다."']}};
function ivNewsAfterGame(rec){ if(G.unemp||period()==='off')return; const m=G.mgr[G.user]; if(!m||m.interim)return; const ms=rec.home===G.user?rec.hs-rec.as:rec.as-rec.hs;
  const big=Math.abs(ms)>=6, close=Math.abs(ms)<=1; if(!(big||(close&&R()<.25)||R()<.06))return; const v=mgrVoice(m); const w=ms>0;
  const q=pick(MQ[v][w?'w':'l']); const op=rec.home===G.user?rec.away:rec.home;
  news('경기',`${m.name} 감독 "${q.replace(/^"|"$/g,'').slice(0,26)}${q.length>28?'…':''}"`,`${tshort(op)}전 ${w?'승리':'패배'}(${rec.home===G.user?rec.hs:rec.as}:${rec.home===G.user?rec.as:rec.hs}) 뒤 ${m.name} 감독: ${q}`,0);
  /* 오늘의 선수 인터뷰 */
  try{ if(w&&rec.box){ const me=rec.home===G.user?'h':'a'; const b=rec.box[me].bat.slice().sort((a,c)=>(c.hr*3+c.h+c.rbi)-(a.hr*3+a.h+a.rbi))[0]; const p=b&&G.players[b.id]; if(p&&(b.hr>=1||b.h>=3)&&R()<.5){ initPers(p);
      const L=p.pers.amb>=13?[`"더 큰 무대에서도 통한다는 걸 보여 주고 싶습니다."`,`"오늘이 끝이 아닙니다. 더 칠 겁니다."`]:p.pers.loy>=13?[`"${tshort(G.user)} 팬들 응원 덕분입니다. 이 팀에서 오래 뛰고 싶습니다."`]:[`"앞 타자들이 잘 만들어 줘서 편하게 쳤습니다."`,`"감독님이 믿어 주셔서 부담 없이 쳤습니다."`];
      news('선수',`${p.name} "${pick(L).replace(/^"|"$/g,'').slice(0,26)}…"`,`${b.h}안타${b.hr?` ${b.hr}홈런`:''} ${b.rbi}타점 활약 뒤 ${p.name}: ${pick(L)}`,1,{ref:p.id}); } } }catch(e){} }
/* 매주: 불만 선수 인터뷰, 다른 구단 감독 발언 */
function ivNewsWeekly(){ if(G.unemp)return; const sad=playersOf(G.user).filter(p=>(p.mor??60)<30&&ovr(p)>=50).sort((a,b)=>(a.mor??60)-(b.mor??60))[0];
  if(sad&&R()<.5){ initPers(sad); const t=sad.pers.amb>=12?'"뛸 수 있는 팀에서 뛰고 싶습니다."':'"요즘 마음이 편하지 않습니다. 구단과 얘기해 보겠습니다."'; news('선수',`${sad.name}, 공개 불만 "${t.replace(/^"|"$/g,'').slice(0,20)}…"`,`${sad.name}이(가) 인터뷰에서 ${t}라고 말했습니다. 구단 내부 분위기에 물음표가 붙습니다.`,-1,{ref:sad.id}); }
  if(period()==='season'&&R()<.35){ const t=pick(G.teams.filter(x=>x.id!==G.user)); const m=mgrOf(t.id); if(m&&!m.interim){ const ty=mgrType(m); news('경기',`${tshort(t.id)} ${m.name} 감독 "${ty.k==='small'||ty.k==='combo_d'?'한 점씩 짜내는 우리 야구를 하겠다':ty.k==='big'||ty.k==='combo_o'?'시원하게 치는 야구로 간다':'우리 페이스를 지키겠다'}"`,`${tname(t.id)}의 ${m.name} 감독(${ty.n})이 취재진에게 남은 시즌 운영 방향을 밝혔습니다.`,0); } } }
/* 정기 인터뷰 요청 일정 */
function ivDaily(){ const o=dobj(G.day); if(G.unemp)return;
  if(G.iv&&!G.iv.done&&G.iv.exp<G.day){ ivSkip(); G.iv.lapse=true; } /* 기한 안에 응하지 않으면 거절과 같게 처리(단장 침묵 기사) */
  if(G.cal&&G.day===G.cal.open-7)ivRequest('preseason',{cand:domestic(G.user).filter(p=>p.age<=27).sort((a,b)=>ovr(b)-ovr(a)).slice(0,3).map(p=>p.id)});
  if(o.m===8&&o.d===1)ivRequest('deadline',{});
  if(o.m===11&&o.d===3&&G.last&&G.last.y===G.year)ivRequest('season_end',{});
  if(o.m===2&&o.d===1)try{ ivPromCheck('feb'); }catch(e){}
  if(o.w===3)try{ ivNewsWeekly(); }catch(e){}
  if(o.w===5&&o.d%2===0)try{ pressTips(); }catch(e){} }
