/* ===== 다른 구단 단장: 인물·성격·친분 ===== */
const GMT={hard:{l:'강경 협상가',d:'쉽게 양보하지 않고 조건을 높게 부릅니다.'},prospect:{l:'유망주 수집가',d:'젊은 선수를 아끼고, 받을 때도 유망주를 원합니다.'},data:{l:'데이터 신봉자',d:'요즘 컨디션보다 계약과 기록을 봅니다. 싼 계약을 좋아합니다.'},
  loyal:{l:'의리파',d:'친한 단장에게는 조건을 너그럽게 봐줍니다.'},gambler:{l:'승부사',d:'스타라면 비싸도 데려가려 합니다.'},miser:{l:'짠돌이',d:'연봉 부담을 가장 싫어합니다.'}};
const GMCAR=['스카우트 출신','전력분석원 출신','구단 프런트 공채','선수 출신','모기업 기획실 출신','에이전트 출신'];
const GMTALK=['요즘 어떻게 지내십니까. 시즌 길게 보고 갑시다.','좋은 선수 있으면 저희 먼저 생각해 주십시오.','다음에 식사 한번 하시죠.','우리 감독이 요즘 불펜 걱정이 많습니다.','시장 분위기가 조용하네요. 큰 거래 하나 나올 때가 됐는데.','작년 트레이드 얘기는 이제 그만합시다. 하하.'];
function mkGM(tid){ return {id:'m'+Math.floor(R()*1e9),name:genName(),age:ri(38,60),trait:pick(Object.keys(GMT)),car:pick(GMCAR),since:G.year,tid,f:R()<.12}; }
/* 다른 구단 단장 계약: 연봉·계약 기간. 능력·재임·구단 규모로 정하고 예전 저장은 단장 id로 같은 값을 만든다(난수 흐름을 건드리지 않는다).
   재계약은 시즌 뒤 단장 교체 판정(gmTurnover)에서 성적에 따라 인상한다. 결산에서는 구단 운영비 안의 '단장 연봉'으로 따로 적는다 */
function gmCon(g,tid){ if(!g||g.interim)return null; if(!g.c){ const id=tid??g.tid, t=id!=null?team(id):null; const A=gmAbil(g)||{eye:50,neg:50,plan:50,money:50}; const ab=(A.eye+A.neg+A.plan+A.money)/4;
    let s=(180+(ab-55)*3+Math.min(10,Math.max(0,G.year-g.since))*8)*clamp(t&&t.market||1,.8,1.25); if(t&&t.indie)s*=.75; const yrs=2+Math.floor(u01('gmcy',g.id)*2); let y1=g.since+yrs-1; while(y1<G.year)y1+=yrs;
    g.c={sal:Math.round(clamp(s,150,450)/10)*10,y1}; } return g.c; }
function gmConRenew(g,rk,champ){ const c=gmCon(g); if(!c||c.y1>G.year)return; const up=(champ?.15:0)+(rk<=1?.12:rk<=3?.08:rk<=5?.04:0); c.sal=Math.round(clamp(c.sal*(1+up),150,500)/10)*10; c.y1=G.year+(champ||rk<=3?3:2); }
/* ===== 단장 말투: 내 단장(G.gmP.voice)과 다른 구단 단장(g.v)이 말할 때의 색깔 =====
   말투는 효과 없이 대사만 바꾼다. 다른 구단 단장은 성향(GMT)에 맞춘 말투가 기본이고 셋 중 하나꼴로 성향과 다른 말투를 쓴다(단장 id로 고정) */
const GMV={ana:{l:'냉철한 분석가',d:'숫자로 말하고 감정은 뺍니다.'},bro:{l:'정 많은 맏형',d:'사람부터 챙기고 말끝이 따뜻합니다.'},gam:{l:'승부사',d:'판을 키우고 지는 걸 못 참습니다.'},fox:{l:'능구렁이 협상가',d:'웃으며 돌려 말하고 끝까지 계산합니다.'},blunt:{l:'직설파',d:'돌려 말하지 않습니다. 짧고 셉니다.'}};
const GMVL={
  ana:{hello:['요즘 리그 득실차 보셨습니까. 재미있는 숫자가 많더군요.','감보다 표본입니다. 이번 달도 표본을 쌓는 중입니다.','우리 불펜 피OPS가 좀 거슬려서요. 그쪽은 어떻습니까.'],
    pitch:['기대 승리로 따지면 양쪽 다 남는 거래입니다. 계산서는 붙여 두었습니다.','감정은 빼고 숫자만 보시면 답이 나올 겁니다.'],
    yes:['계산이 맞습니다. 도장 찍죠.','기대값이 플러스입니다. 진행하겠습니다.'],short:['격차가 아직 남습니다. 조금만 좁혀 주시죠.','모형상 저희가 손해입니다. 몇 점만 더 얹어 주십시오.'],no:['이건 계산이 안 나옵니다. 다시 뽑아 오시죠.','표준편차 밖의 제안입니다.'],
    up:['근거는 이미 숫자에 있습니다.','확률은 저희 편입니다.'],flat:['표본이 더 쌓이면 분명해질 겁니다.','데이터가 말해 줄 겁니다.'],down:['감정 섞인 해석은 사양하겠습니다.','숫자 밖의 이야기는 하지 않겠습니다.'],
    ask:'회장님, 근거 자료부터 보시죠.',renew:'조건 확인했습니다. 합리적입니다.',raise:'시장 가격으로 보면 15%가 맞습니다.',leave:'제 계산으로는 여기까지가 최선입니다.',treat:'오늘은 기록 얘기 금지입니다. 저도 노력해 보겠습니다.'},
  bro:{hello:['밥은 잘 챙겨 드시죠? 시즌 길어요, 몸부터 챙깁시다.','우리 애들이 요즘 고생이 많습니다. 그쪽 애들도 그렇죠?','언제 소주 한잔해요. 이번엔 제가 사겠습니다.'],
    pitch:['우리 애 하나 보내는 거라 마음이 쓰입니다. 그쪽에서 잘 좀 써 주세요.','서로 좋자고 하는 얘기입니다. 한번 봐 주십시오.'],
    yes:['좋습니다. 보내는 녀석 잘 부탁드립니다.','하하, 이렇게 또 한 식구가 됐네요.'],short:['마음은 알겠는데 조금만 더 써 주시죠. 저도 애들 볼 면목은 있어야죠.','형님 동생 하는 사이에 조금만 더 봐 주십시오.'],no:['이건 좀 서운합니다. 우리 애들 그렇게 싸지 않아요.','정으로 넘어가기엔 차이가 너무 큽니다.'],
    up:['선수들이 다 해 준 겁니다.','우리 애들 믿고 갑니다.'],flat:['다 같이 가는 겁니다.','선수들한테 먼저 고맙다고 하고 싶습니다.'],down:['선수들 탓은 아닙니다. 제 몫입니다.','애들 마음 다치지 않게 따로 얘기하겠습니다.'],
    ask:'회장님, 선수들 생각해서 한 번만 도와주십시오.',renew:'믿어 주셔서 감사합니다. 애들이랑 더 해 보겠습니다.',raise:'저보다 식구들 생각해서 조금만 더 써 주십시오.',leave:'정들었는데 여기까지인가 봅니다.',treat:'오늘은 다 내려놓고 먹자. 고기는 내가 굽는다.'},
  gam:{hello:['요즘 판이 너무 조용하네요. 하나 크게 터뜨릴 때가 됐는데.','올해는 무조건 위에서 끝냅니다. 그쪽은 어떠세요?','마감 전에 한 판 붙어 보시겠습니까?'],
    pitch:['지금 타이밍 놓치면 후회합니다. 크게 한번 갑시다.','판을 키워 보죠. 이 정도는 걸어야 재미있지 않습니까.'],
    yes:['좋습니다, 질러 봅시다!','콜. 승부는 지금입니다.'],short:['배팅이 조금 짭니다. 한 장만 더 올리시죠.','이 판에 그 정도로는 안 됩니다. 조금 더 거시죠.'],no:['이걸로 판을 엎자는 겁니까? 다음엔 제대로 들고 오시죠.','패가 너무 약합니다.'],
    up:['지는 건 계획에 없습니다.','이번엔 판을 끝까지 갑니다.'],flat:['승부는 9회 말부터입니다.','끝날 때까지 끝난 게 아닙니다.'],down:['진 경기는 갚아 주면 됩니다.','다음 판에서 돌려받겠습니다.'],
    ask:'회장님, 지금이 승부처입니다.',renew:'좋습니다. 이번엔 반지까지 갑니다.',raise:'우승할 단장 값은 따로 있습니다.',leave:'새 판에서 다시 붙어 보겠습니다.',treat:'오늘 먹고 내일부터 연승이다. 알겠지?'},
  fox:{hello:['아이고 단장님, 마침 생각나서 연락드렸습니다. 별일은 아니고요, 허허.','요즘 그쪽 불펜이 고생한다던데, 혹시 도와드릴 일 없나 해서요.','바쁘시죠? 저야 늘 한가합니다, 허허.'],
    pitch:['단장님이니까 먼저 말씀드리는 겁니다. 다른 데는 아직 모릅니다, 허허.','서로 웃자고 하는 거래입니다. 천천히 보시죠.'],
    yes:['허허, 역시 말이 통하십니다.','좋습니다. 이건 우리끼리 얘기로 해 두죠.'],short:['아이고, 거의 다 왔는데 말입니다. 요만큼만 더 보태 주시면…','제가 위에 보고하기가 좀 그렇네요. 조금만 더 얹어 주시죠.'],no:['허허, 농담이시죠? 차 한잔하고 다시 얘기합시다.','이건 제가 못 들은 걸로 하겠습니다.'],
    up:['자세한 건 결과를 보시면 아실 겁니다, 허허.','좋은 일은 조용히 오는 법입니다.'],flat:['뭐, 두고 보시면 압니다.','말씀드릴 수 있는 건 여기까지입니다, 허허.'],down:['그 부분은 다들 사정이 있으니까요.','오해가 있으신 것 같은데, 천천히 풀겠습니다.'],
    ask:'회장님, 요즘 안색이 좋으십니다. 다름이 아니라…',renew:'허허, 회장님 마음 다 압니다. 잘 부탁드립니다.',raise:'다른 데서도 연락이 오긴 하던데요, 허허.',leave:'좋은 인연이었습니다. 또 뵙겠죠, 허허.',treat:'자, 오늘은 제가 쏩니다. 대신 내일 훈련은 아시죠? 허허.'},
  blunt:{hello:['용건만 하죠. 지금 내놓을 선수 있습니까?','돌려 말 안 합니다. 우리 내야가 급합니다.','통화 짧게 합시다. 시장에 뭐 있습니까?'],
    pitch:['이 조건입니다. 길게 말 안 하겠습니다.','필요한 거 주고 필요한 거 받읍시다. 끝.'],
    yes:['됐습니다. 진행하죠.','좋습니다. 끝.'],short:['모자랍니다. 하나 더.','거의 됐습니다. 조금만 더 얹으세요.'],no:['안 됩니다. 다음.','이건 제안이 아닙니다.'],
    up:['이상입니다.','결과로 보여 드리겠습니다.'],flat:['할 말은 다 했습니다.','그게 답니다.'],down:['변명 안 하겠습니다.','못한 건 못한 겁니다.'],
    ask:'회장님, 돈이 필요합니다.',renew:'하겠습니다.',raise:'15% 올려 주십시오.',leave:'여기까지 하겠습니다.',treat:'먹어. 잘했다. 이상.'}};
const GMV_TRAIT={data:'ana',loyal:'bro',gambler:'gam',miser:'fox',hard:'blunt',prospect:'ana'};
function gmVoice(g){ if(!g||g.interim)return null; if(!g.v){ const K=Object.keys(GMV), u=u01('gmv',g.id); g.v=u<.33?K[Math.floor(u/.33*K.length)%K.length]:(GMV_TRAIT[g.trait]||'fox'); } return g.v; }
/* 내 단장 말투(정하지 않은 예전 저장은 null: 대사를 바꾸지 않는다) */
function myVoice(){ const v=G&&G.gmP&&G.gmP.voice; return GMV[v]?v:null; }
/* 상황별 한 줄: 같은 날 같은 상황이면 같은 대사(난수 흐름을 건드리지 않는다) */
function vLine(v,k,salt){ const L=GMVL[v]&&GMVL[v][k]; if(!L)return ''; if(typeof L==='string')return L; return L[Math.floor(u01('gv'+k+(salt??''),G.day)*L.length)]; }
function aiSay(tid,k){ const g=tid===G.user?null:team(tid).gm; const v=gmVoice(g); return v?vLine(v,k,tid):''; }
function mySay(k,salt){ const v=myVoice(); return v?vLine(v,k,salt):''; }
const aiQ=(tid,k)=>{ const x=aiSay(tid,k); return x?` "${x}"`:''; }; /* 다른 구단 단장 대사 끝에 붙이는 말투 한마디 */
const myQ=k=>{ const x=mySay(k); return x?` · "${x}"`:''; }; /* 선택 버튼에 붙이는 내 한마디 */
/* 인터뷰 답변 끝에 내 말투 한마디: 답의 결(자신감·담담·방어)에 맞춰 따옴표 안에 붙인다 */
const VTONE_UP=['자신감','고수','영입','기대','지지','감사','육성'], VTONE_DN=['비판','냉정','압박','정면','회피','노코멘트','한발 물러섬','공 넘기기'];
function mySayTail(t,tone){ const k=VTONE_UP.includes(tone)?'up':VTONE_DN.includes(tone)?'down':'flat'; const x=mySay(k,tone); if(!x||typeof t!=='string'||!t.endsWith('"'))return t; return t.slice(0,-1)+' '+x+'"'; }
/* 단장 능력(20~95): 선수 보는 눈(성적 운에 덜 속음), 협상력(트레이드 요구 수준), 구단 설계(감독 야구에 맞는 역할을 얼마나 일관되게 찾나), 재정 운영(노장 FA에 덜 씀).
   성향(GMT)과 따로 정해지고, 성향이 한쪽을 조금 끌어올린다. 예전 저장은 단장 id로 같은 값을 만든다 */
function gmAbil(g){ if(!g||g.interim)return null; if(!g.ab){ const u=k=>u01('gma'+k,g.id); const v=x=>Math.round(clamp(30+x*60,25,92)); g.ab={eye:v(u('e')),neg:v(u('n')),plan:v(u('p')),money:v(u('m'))};
    const up=(k,d)=>{ g.ab[k]=Math.min(95,g.ab[k]+d); }; if(g.trait==='data')up('eye',10); if(g.trait==='hard')up('neg',12); if(g.trait==='miser')up('money',12); if(g.trait==='prospect')up('plan',6); if(g.trait==='gambler')g.ab.money=Math.max(25,g.ab.money-8); } return g.ab; }
const gmAbOf=tid=>{ if(tid==null||tid===G.user)return null; const t=team(tid); return t&&t.gm?gmAbil(t.gm):null; };
/* 재임 성적: 이 단장이 맡은 뒤 시즌별 순위(지난 시즌까지) */
function gmRecord(tid){ const g=team(tid).gm; if(!g||g.interim)return null; const H=(G.history||[]).filter(h=>h.y>=g.since&&h.order); const rk=H.map(h=>h.order.findIndex(o=>o.tid===tid)+1).filter(x=>x>0); return {n:rk.length,avg:rk.length?rk.reduce((a,x)=>a+x,0)/rk.length:null,best:rk.length?Math.min(...rk):null,ch:H.filter(h=>h.champ===tid).length,ps:rk.filter(x=>x<=5).length}; }
function gmOf(tid){ if(tid===ME())return null; /* 야인이면 전 구단도 그 구단 단장(검수 11-07) */ const t=team(tid); if(!t.gm)t.gm=mkGM(tid); return t.gm; }
function gmTrait(tid){ const g=tid===G.user?null:team(tid).gm; return g&&!g.interim?g.trait:null; }
function gmInit(){ for(const t of G.teams){ if(t.id!==G.user&&!t.gm)t.gm=mkGM(t.id); } if(G.rep==null)G.rep=50; G.gmc=G.gmc||{}; G.jobs=G.jobs||[]; G.lgTrades=G.lgTrades||[]; }
function relLabel(r){ return r>=80?'막역한 사이':r>=65?'친한 편':r>=45?'무난한 사이':r>=30?'서먹한 사이':'껄끄러운 사이'; }
function teamNeeds(tid){ const rk=slotRanks(tid); const weak=PSLOTS.filter(k=>k!=='DH').map(k=>({k,r:rk[k].rank})).sort((a,b)=>b.r-a.r).filter(x=>x.r>=6).slice(0,2).map(x=>x.k);
  const t=team(tid); const c=teamCtx(t); const ci=capInfo(tid); const money=t.indie||ci.over>0||t.owner==='profit'?'tight':ci.cap-ci.pay>2500?'rich':'normal';
  return {weak,contend:c.contend,money,rk}; }
function needText(tid){ const n=teamNeeds(tid); return `${n.contend?'우승 경쟁':'리빌딩'} · ${n.weak.length?n.weak.map(k=>SLOTK[k]).join('·')+' 보강 원함':'급한 자리 없음'} · 연봉 ${n.money==='tight'?'여유 없음':n.money==='rich'?'여유 많음':'보통'}`; }
/* 친분은 높을수록 더 쌓기 어렵고(60 넘으면 줄어듦), 해마다 50 쪽으로 조금씩 돌아간다(gmRelYear) */
function gmRelDim(t){ return t.rel>60?Math.max(.25,1-(t.rel-60)/40):1; }
function gmRelYear(){ for(const t of G.teams){ if(t.id===G.user||t.rel==null)continue; t.rel=Math.round(50+(t.rel-50)*.75); } }
function gmContact(tid,kind){ const t=team(tid), g=gmOf(tid); if(!g)return {msg:''}; G.gmc=G.gmc||{}; const c=G.gmc[tid]||(G.gmc[tid]={});
  if(kind==='call'){ if(c.call!=null&&c.call>G.day-14)return {msg:`${g.name} 단장과는 ${dmd(c.call+14)}부터 다시 연락할 수 있습니다.`};
    c.call=G.day; const d=Math.round(Math.max(0,(g.trait==='loyal'?2:1)*ri(1,2)-(g.trait==='hard'?1:0))*gmRelDim(t)); t.rel=clamp(t.rel+d,0,100);
    return {msg:`${g.name} 단장: "${aiSay(tid,'hello')||pick(GMTALK)}" (친분 +${d}) 들어 보니 ${needText(tid)}입니다.`,ok:true}; }
  if(kind==='meal'){ if(c.meal!=null&&c.meal>G.day-30)return {msg:`식사 자리는 한 달에 한 번입니다(${dmd(c.meal+30)}부터).`};
    c.meal=G.day; G.spend.etc=(G.spend.etc||0)+10; const d=Math.round(ri(3,5)*(g.trait==='loyal'?1.5:g.trait==='hard'?.6:1)*gmRelDim(t)); t.rel=clamp(t.rel+d,0,100);
    return {msg:`${g.name} 단장과 저녁 식사를 했습니다(1천만 원). 친분 +${d}. ${g.trait==='hard'?'식사는 즐겁게 했지만 협상은 별개라고 선을 긋습니다.':'다음 거래 때 잘 봐 달라는 말이 오갔습니다.'}${(()=>{ /* 식사 자리에서 속내를 조금 듣는다: 우리 선수 중 누구를 탐내는지 */ try{ const L=aiInterest(tid).map(x=>typeof x==='object'?x:G.players[x]).filter(Boolean); return L.length?` 술잔이 돌자 ${L[0].name}(${posLabel(L[0])}) 이야기를 슬쩍 꺼냈습니다.`:' 지금은 우리 선수에게 특별히 눈독 들이는 사람은 없어 보입니다.'; }catch(e){ return ''; } })()}`,ok:true}; }
  return {msg:''}; }
/* 역제안: 조금 모자랄 때 상대가 조건을 바꿔 다시 제시 */
function counterOffer(tid,give,get,cash,pk){ cash=cash||0; const ev=(g,t)=>evalTrade(tid,g,t,cash,pk); /* 지명권도 넣어 계산(검수 11-06) */ const e=ev(give,get); const gap=e.need-e.gain; if(gap<=0||gap>9)return [];
  const out=[]; const U=team(G.user);
  const add=domestic(G.user).filter(p=>!give.includes(p.id)&&!(p.joinY>G.year)&&!p.ys&&healthy(p)&&!ntcOf([p.id])) /* 거부권 선수는 역제안에 넣지 않는다(제출 검사와 같게) */.map(p=>({p,ng:give.concat(p.id)})).filter(x=>{ const e2=ev(x.ng,get); return e2.ok&&e2.theirN<=ROSTER_MAX; }).map(x=>({...x,c:tval(U,x.p,'out')})).sort((a,b)=>a.c-b.c)[0];
  if(add)out.push({give:add.ng,get:[...get],why:`${add.p.name}을(를) 더 얹어 주시면 하겠습니다.`});
  if(get.length>1){ for(const id of [...get].sort((a,b)=>tval(team(tid),G.players[b],'out')-tval(team(tid),G.players[a],'out'))){ const ng=get.filter(x=>x!==id); if(ev(give,ng).ok){ out.push({give:[...give],get:ng,why:`${G.players[id].name}은(는) 못 드립니다. 나머지로 하시죠.`}); break; } } }
  if(out.length<2&&get.length===1){ const p=G.players[get[0]]; const k=pSlot(p); const alt=domestic(tid).filter(q=>q.id!==p.id&&!q.ys&&healthy(q)&&pSlot(q)===k&&!ntcOf([q.id])).map(q=>({q,e:ev(give,[q.id])})).filter(x=>x.e.ok).sort((a,b)=>ovr(b.q)-ovr(a.q))[0];
    if(alt&&ovr(alt.q)>=ovr(p)-8)out.push({give:[...give],get:[alt.q.id],why:`${p.name} 대신 ${alt.q.name}(${posLabel(alt.q)})이면 됩니다.`}); }
  for(const c of out){ c.cash=cash; c.pk=pkNorm(pk); } /* 역제안은 그때 현금·지명권 조건으로 고정 */
  return gmTrait(tid)==='hard'?out.slice(0,1):out.slice(0,2); }
const NEG_MONTH=4;
function negTurn(tid){ G.gmc=G.gmc||{}; const c=G.gmc[tid]||(G.gmc[tid]={}); const o=dobj(G.day); const mk=o.y*100+o.m; if(c.negM!==mk){ c.negM=mk; c.neg=0; } delete c.negDay; c.seen=c.seen||{}; for(const k in c.seen)if(c.seen[k]<G.day-30)delete c.seen[k]; return c; }
/* 맞대결: 오늘(쉬는 날이면 내일) 우리와 경기하는 구단은 경기장에서 만나므로 횟수 제한이 없다 */
function seriesOpp(){ const c=G.cal; if(!c||!c.sched)return null; for(const d of [G.day,G.day+1]){ const m=(c.sched[d]||[]).find(x=>x.includes(G.user)); if(m)return m[0]===G.user?m[1]:m[0]; if(d===G.day){ const k=(G.makeup||[]).find(x=>x.y===G.year&&(x.h===G.user||x.a===G.user)); if(k)return k.h===G.user?k.a:k.h; } } return null; } /* 다음 경기일에 치를 우리 연기 경기 상대도 맞대결(검수 11-09w) */ /* 오늘 다른 구단만 경기해도 우리 일정 기준으로 내일을 본다(검수 11-08c) */
function negInfo(tid){ const c=negTurn(tid); const free=seriesOpp()===tid; const o=dobj(G.day); const nx=o.m===12?1:o.m+1; const cap=negCap(tid); return {used:c.neg,cap,left:free?99:Math.max(0,cap-c.neg),free,next:`${nx}월 1일`}; }
const tsig=(give,get,cash)=>[...give].sort((a,b)=>a-b).join(',')+'|'+[...get].sort((a,b)=>a-b).join(',')+(cash?'|c'+cash:''); /* 받는 현금(음수)도 조건으로 구분(검수 11-06) */
/* 트레이드 기록과 성적표 */
const warSoFar=(p,y)=>{ const h=seasonTotal(p,y,'1군'); return h?warOf(h,p):0; };
/* 우리 구단 기여: 그 구단 소속으로 낸 1군 기록만(시즌 중 이적하면 이전 구단 기록은 빼고) */
function clubWar(p,tid,y0){ const ys=[...new Set(p.hist.filter(h=>h.lvl==='1군'&&!h.y2&&h.t===tid&&h.y>=(y0||0)).map(h=>h.y))]; let w=0; for(const y of ys){ const h=seasonTotalT(p,y,'1군',tid); if(h)w+=warOf(h,p); } return {ys,w}; }
function tradeSnap(ids){ const o={}; for(const id of ids){ const p=G.players[id]; if(p)o[id]=warSoFar(p,G.year); } return o; }
/* 트레이드 이후 WAR: 은퇴 등으로 목록에서 빠진 선수는 보관 기록(G.arch)으로 계속 센다(은퇴했다고 지난 거래 평가가 바뀌지 않게) */
/* tid가 있으면 그 구단 소속으로 낸 기록만(거래 뒤 제3 구단으로 옮겨 낸 성적은 그 거래 몫이 아니다, 검수 11-09w) */
function warSince(id,y,snap,tid){ const p=G.players[id]; if(!p){ const a=G.arch&&G.arch[id]; if(!a)return 0; let w=0; for(const r of a.rows)if(r.y>=y&&r.y<=G.year&&(tid==null||r.t===tid))w+=r.war||0; return w-(tid==null&&snap&&snap[id]||0); } if(tid!=null){ let w=0; for(let yy=y;yy<=G.year;yy++){ const h=seasonTotalT(p,yy,'1군',tid); if(h)w+=warOf(h,p); } return w; } let w=0; for(let yy=y;yy<=G.year;yy++)w+=warSoFar(p,yy); return w-(snap&&snap[id]||0); }
/* 거래한 지명권('라운드:원래 구단')으로 실제 뽑은 선수. shortcut: 은퇴해 목록에서 빠진 신인은 찾지 못한다(보관 기록에 지명 정보가 생기면 그쪽도 볼 것) */
function pkDrafted(y,k){ const [rd,o]=k.split(':').map(Number); const p=Object.values(G.players).find(q=>q.draft&&q.draft.y===y&&q.draft.rd===rd&&(q.draft.from??q.draft.tid)===o); return p?p.id:null; }
function tradeReport(tr){ if(!tr.gi)return null; const me=tr.me??G.user; const K=tr.pkk||{}; const dp=L=>(L||[]).map(k=>pkDrafted(K.y,k)).filter(id=>id!=null);
  const got=sum([...tr.gi,...dp(K.get)].map(id=>warSince(id,tr.y,tr.snap,me))), gave=sum([...tr.go,...dp(K.give)].map(id=>warSince(id,tr.y,tr.snap,tr.with))); return {got,gave,net:got-gave}; } /* 받은·준 지명권으로 뽑은 신인도 성과에(검수 11-09w) */
function tradeValueDiff(give,get,cash,pk){ const U=team(G.user); pk=pkNorm(pk); return stackIn(get.filter(id=>G.players[id]).map(id=>tval(U,G.players[id],'in')))-sum(give.filter(id=>G.players[id]).map(id=>tval(U,G.players[id],'out')))-(cash||0)/250+sum(pk.get.map(k=>pkVal(U,k)))-sum(pk.give.map(k=>pkVal(U,k))); /* 지명권도 등급에(검수 11-06) */ /* cash: 우리가 낸 현금(+) 받은 현금(-). 10억이면 4점 */ }
function tradeGrade(tid,give,get,cash,pk){ const d=tradeValueDiff(give,get,cash,pk); return d>=8?'A':d>=3?'B':d>=-3?'C':d>=-8?'D':'F'; }
/* 다른 구단끼리 트레이드 */
function aiTradeTry(aid){ const tc={}; (G.lgTrades||[]).filter(t=>t.y===G.year).forEach(t=>{ tc[t.a]=(tc[t.a]||0)+1; tc[t.b]=(tc[t.b]||0)+1; }); const teams=G.teams.filter(t=>t.id!==ME()&&(tc[t.id]||0)<5); const buyers=teams.filter(t=>teamCtx(t).contend); const A=aid!=null?teams.find(t=>t.id===aid):pick(buyers.length?buyers:teams); if(!A)return null;
  const rk=slotRanks(A.id); const nd=PSLOTS.filter(k=>k!=='DH').map(k=>({k,r:rk[k].rank})).sort((a,b)=>b.r-a.r)[0]; if(!nd||nd.r<(gmHeat(A.id)>=.4?5:6))return null;
  const k=nd.k; const L=leagueSlots()[A.id]; const base=k==='SP'?(L.SP.ps.length<5?30:Math.min(...L.SP.ps.map(spV))):k==='RP'?(L.RP.ps.length<4?30:Math.min(...L.RP.ps.map(penV))):L[k].v;
  const cands=[]; for(const B of teams){ if(B.id===A.id)continue; for(const p of domestic(B.id)){ if(p.ys||!healthy(p)||hasNtc(p))continue; if(k==='SP'||k==='RP'){ if(pSlot(p)!==k)continue; } else if(p.isP||(p.pos!==k&&!subsOf(p).includes(k)))continue;
      const up=slotGain(k,p)-base+(p.aiListed?(p.aiUrg?4:2.5):0); if(up>=3)cands.push({B,p,up}); } }
  cands.sort((a,b)=>b.up-a.up);
  for(const c of cands.slice(0,8)){ const B=c.B, p=c.p; const vOut=tval(B,p,'out'), vInA=tval(A,p,'in'); if(vInA<=0)continue; const needB=tradeNeed(B,vOut);
    /* 2대2: B의 블록 선수 한 명을 끼워 함께 받는 경우 */
    const extra=R()<.3?domestic(B.id).find(q=>q.aiListed&&q.id!==p.id&&healthy(q)&&!q.ys&&!hasNtc(q)):null; const gets=extra?[p,extra]:[p];
    const vOutAll=sum(gets.map(q=>tval(B,q,'out'))), vInAAll=stackIn(gets.map(q=>tval(A,q,'in')));
    const pool=corePool(A.id).filter(q=>healthy(q)&&!q.ys).map(q=>({q,b:tval(B,q,'in')*(q.aiListed?1.1:1),a:tval(A,q,'out')})).filter(x=>x.b>.3).sort((x,y)=>x.b-y.b).slice(0,22);
    let best=null,bo=1e9; const tryS=arr=>{ const bv=stackIn(arr.map(x=>x.b)); if(bv<vOutAll+needB)return; if(arr.length>gets.length&&((vOut>=2&&Math.max(...arr.map(x=>x.b))<vOut*.75)||(ovr(p)>=56&&Math.max(...arr.map(x=>ovr(x.q)))<ovr(p)-5)))return; const av=sum(arr.map(x=>x.a)); if(vInAAll-av<tradeNeed(A,av))return; const o=bv-vOutAll-needB+arr.length*.5; if(o<bo){ bo=o; best=arr; } };
    for(let i=0;i<pool.length;i++){ tryS([pool[i]]); for(let j=i+1;j<pool.length;j++)tryS([pool[i],pool[j]]); }
    if(!best)continue;
    if(rosterN(B.id)+best.length-gets.length>ROSTER_MAX)continue;
    { const gs=sum(best.map(x=>x.q.sal)), ps=sum(gets.map(q=>q.sal)); const capY=capOf(G.year); const gI=gets.map(q=>q.id), bI=best.map(x=>x.q.id); if((ps>gs&&capPayAs(A.id,gI,bI)>capY)||(gs>ps&&capPayAs(B.id,bI,gI)>capY))continue; }
    const give=best.map(x=>x.q.id); const snap=tradeSnap([...gets.map(q=>q.id),...give]);
    gets.forEach(q=>{ tradeTerms(q); q.team=A.id; story(q,`트레이드로 ${tname(A.id)} 이적`,'move'); delete q.aiListed; delete q.aiWhy; delete q.aiUrg; }); give.forEach(id=>{ tradeTerms(G.players[id]); /* 달성한 옵션은 원소속 구단이 지급(양쪽 같게, 검수 11-09v) */ G.players[id].team=B.id; story(G.players[id],`트레이드로 ${tname(B.id)} 이적`,'move'); delete G.players[id].aiListed; });
    G.lgTrades.unshift({y:G.year,d:G.day,a:A.id,b:B.id,ga:(A.gm||{}).id,gb:(B.gm||{}).id,ag:gets.map(q=>q.id),bg:give,an:gets.map(q=>q.name),bn:give.map(id=>G.players[id].name),snap}); /* an·bn: 은퇴 뒤에도 이름을 보이게(검수 11-08d) */ { const tr=mvTr(); gets.forEach(q=>mvLog('트레이드',q,B.id,A.id,'',0,tr)); give.forEach(id=>mvLog('트레이드',G.players[id],A.id,B.id,'',0,tr)); } if(G.lgTrades.length>60)G.lgTrades.length=60;
    wire('트레이드',`${tshort(A.id)}–${tshort(B.id)} ${gets.length}대${give.length} 트레이드. ${tshort(A.id)}은(는) ${gets.map(q=>`${q.name}(${posLabel(q)})`).join(', ')}을(를) 얻고 ${give.map(id=>G.players[id].name).join(', ')}을(를) 내줬습니다.${gets.some(q=>q.aiWhy)?' 매물로 나와 있던 선수입니다.':''}`,{tid:A.id,ref:p.id});
    return true; }
  return null; }
/* 창단 직후 보강 시장(AI끼리): 우승을 노리는 상위 4개 구단이 리빌딩 구단의 베테랑(29세 이상, 1군 주전감)을 유망주로 사 온다.
   창단 드래프트로 전력이 고르게 나뉜 리그에 실제처럼 강팀·약팀 차이를 만든다. 구단당 두 건까지 */
/* 운영 방향별 보강(o 없으면 창단 직후): 우승 도전 구단은 상한 95%까지 리빌딩 구단의 29세 이상 베테랑을, 내년 도전 구단은 26~30세 주전급을 사 온다.
   해마다 겨울(1월)과 트레이드 마감 전(6~7월)에 aiStanceBuy가 부른다. o.per: 구단당 건수, o.wantF: 파는 쪽이 받으려는 남은 가치 비율 */
function fdStrengthen(o){ o=o||{}; gmInit(); const U=ME(); const ai=G.teams.filter(t=>t.id!==U); const Rb=ai.filter(t=>t.mode==='rebuild'); if(!Rb.length)return 0;
  const C=o.buyers||ai.filter(t=>t.mode!=='rebuild').sort((a,b)=>teamRating(b.id)-teamRating(a.id)).slice(0,4); let n=0;
  for(const A of C)for(let k=0;k<(o.per||2);k++){ const base=teamRating(A.id); const cands=[]; const nx=stanceOf(A)==='next'&&o.buyers;
    if(o.buyers&&(capPay(A.id)>capOf(sponSeason())*.98||lgTradeN(A.id)>=5||lgTradeN()>=20))break; /* 일반 AI 거래와 같은 한도: 구단당 5건, 리그 20건(검수 11-09w) */
    for(const B of Rb)for(const p of domestic(B.id)){ if(o.buyers&&lgTradeN(B.id)>=5)break; if(p.ys||!healthy(p)||hasNtc(p)||(nx?p.age<26||p.age>30||ovr(p)<56:p.age<29||ovr(p)<54))continue; p.team=A.id; const d=teamRating(A.id)-base; p.team=B.id; if(d>=.15)cands.push({B,p,d}); }
    cands.sort((x,y)=>y.d-x.d); let done=false;
    for(const best of cands.slice(0,6)){ /* 가장 도움 되는 선수부터, 값이 안 맞으면 다음 후보 */
    const B=best.B, p=best.p; const vOut=tval(B,p,'out'), vin=tval(A,p,'in'); const core=new Set(domestic(A.id).filter(q=>!q.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,6).map(q=>q.id));
    /* 리빌딩 구단은 서른 안팎 베테랑의 남은 계약 가치보다 젊은 선수를 받는 것을 앞세운다: 남은 가치의 30%만 채워도 판다(AI끼리만. 우리 구단과의 트레이드는 평소 기준) */
    const want=vOut*(nx?.6:o.wantF||.3)+1; const pool=domestic(A.id).filter(q=>!q.ys&&healthy(q)&&!hasNtc(q)&&q.age<=27&&!core.has(q.id)).map(q=>({q,b:tval(B,q,'in'),a:tval(A,q,'out')})).filter(x=>x.b>.3).sort((x,y)=>x.b-y.b);
    let pay=null; for(let i=0;i<pool.length&&!pay;i++)for(const arr of [[pool[i]],...pool.slice(i+1).map(y=>[pool[i],y])]){ if(stackIn(arr.map(x=>x.b))<want)continue; if(vin-sum(arr.map(x=>x.a))<0)continue; pay=arr; break; }
    if(!pay)continue; const give=pay.map(x=>x.q.id); if(rosterN(B.id)+give.length-1>ROSTER_MAX||capPayAs(A.id,[p.id],give)>capOf(G.year))continue;
    const snap=tradeSnap([p.id,...give]); tradeTerms(p); p.team=A.id; story(p,`트레이드로 ${tname(A.id)} 이적`,'move'); delete p.aiListed; delete p.aiWhy; delete p.aiUrg;
    give.forEach(id=>{ const q=G.players[id]; tradeTerms(q); q.team=B.id; story(q,`트레이드로 ${tname(B.id)} 이적`,'move'); delete q.aiListed; });
    G.lgTrades.unshift({y:G.year,d:G.day,a:A.id,b:B.id,ga:(A.gm||{}).id,gb:(B.gm||{}).id,ag:[p.id],bg:give,an:[p.name],bn:give.map(id=>G.players[id].name),snap,...(o.buyers?{}:{fd:1})}); { const tr=mvTr(); mvLog('트레이드',p,B.id,A.id,'',0,tr); give.forEach(id=>mvLog('트레이드',G.players[id],A.id,B.id,'',0,tr)); } if(G.lgTrades.length>60)G.lgTrades.length=60;
    wire('트레이드',`${tshort(A.id)}, 리빌딩 ${tshort(B.id)}에서 ${p.name}(${posLabel(p)}, ${p.age}세) 영입: ${give.map(id=>G.players[id].name).join(', ')} 내줌`,{tid:A.id,ref:p.id}); n++; done=true; break; }
    if(!done)break; }
  return n; }
/* 해마다 한 번씩(겨울 1월, 시즌 6월 15일~마감): 상한 여유가 있는 우승 도전·내년 도전 구단이 리빌딩 구단에서 전력을 사 온다. 리그 트레이드 한도(20건) 안에서 */
function aiStanceBuy(){ const per=period(), o=dobj(G.day); const win=per==='season'?G.day>=KD(6,15)&&G.day<=tradeDL():(per==='off'||per==='pre')&&o.m===1; if(!win)return 0;
  const key=G.year+(per==='season'?'s':'w'); if(G.aiBuyK===key)return 0; if((G.lgTrades||[]).filter(t=>t.y===G.year).length>=18)return 0; G.aiBuyK=key;
  const cap=capOf(sponSeason()); const B=G.teams.filter(t=>t.id!==ME()&&t.mode!=='rebuild'&&(t.cash||0)>-3000&&capPay(t.id)<cap*.96).sort((a,b)=>(stanceOf(a)==='win'?0:1)-(stanceOf(b)==='win'?0:1)||capPay(a.id)-capPay(b.id)).slice(0,4);
  return B.length?fdStrengthen({buyers:B,per:1,wantF:.45}):0; }
/* 올해 AI끼리 거래 건수(tid 없으면 리그 전체) */
const lgTradeN=tid=>(G.lgTrades||[]).filter(t=>t.y===G.year&&(tid==null||t.a===tid||t.b===tid)).length;
function marketWeek(){ if(!tradeOpen()||G.gameOver)return; gmInit(); const per=period(); const dl=per==='season'&&G.day>=KD(7,1);
  /* 다른 구단끼리 트레이드: 단장 게임답게 시장이 살아 있도록 한 해 15건 안팎(상한 20건, 구단당 5건). 필요한 구단, 압박받는 단장이 먼저 움직이고 마감 직전에 몰린다.
     한 구단이 몰아서 빨아들이지 않게 구단당 횟수는 묶어 둔다. 사용자와의 트레이드(aiOffer)는 따로 돈다 */
  { const n=(G.lgTrades||[]).filter(t=>t.y===G.year).length; if(n<20){ for(const t of G.teams){ if(t.id===ME())continue; if(lgTradeN()>=20)break; /* 한 주에 여러 건이 나도 리그 상한을 넘지 않게(검수 11-09w) */ const rk=slotRanks(t.id); const weak=PSLOTS.filter(k=>k!=='DH'&&rk[k].rank>=8).length;
      let pr=.07+gmHeat(t.id)*.1+Math.min(2,weak)*.03+(dl?.16:0); if(per!=='season')pr*=.75; if(R()<pr&&!aiTradeTry(t.id)&&R()<.06){ const B=pick(G.teams.filter(x=>x.id!==ME()&&x.id!==t.id)); wire('루머',`${tshort(t.id)}, ${tshort(B.id)}에 트레이드를 제안했지만 조건이 맞지 않았다는 소식입니다.`,{tid:t.id}); } } } }
  try{ aiStanceBuy(); }catch(e){}
  if(G.unemp)return;
  const teams=G.teams.filter(t=>t.id!==ME()); const t=pick(teams); const n=teamNeeds(t.id);
  if(n.weak.length&&R()<.6)wire('루머',`${t.city} ${t.nick} ${gmOf(t.id).name} 단장, ${SLOTK[n.weak[0]]} 보강을 추진 중이라는 소문입니다.`,{tid:t.id});
  if(R()<.25){ let best=null; for(const T of teams){ for(const p of domestic(G.user)){ if(p.ys||(p.joinY>G.year))continue; const v=tval(T,p,'in')-tradeNeed(T,0); if(v>=3&&(!best||v>best.v))best={T,p,v}; } }
    if(best)mail('운영팀',`${best.T.city} ${best.T.nick}, ${best.p.name}에 관심`,`${best.T.city} ${best.T.nick} ${gmOf(best.T.id).name} 단장이 ${best.p.name}(${posLabel(best.p)})에 관심을 보인다는 이야기가 들립니다. 시장 가치를 확인해 보세요.`,{kind:'트레이드',ref:best.p.id,face:best.p.id,acts:[{l:'시장 가치 보기',a:'findMine',v:best.p.id}]}); }
}
function marketDaily(){ if(G.gameOver)return; gmInit(); const per=period(); try{ foDaily(); }catch(err){} try{ aiForeignDaily(); }catch(err){} /* 기다려 준 기한이 지난 선수를 먼저 정리해야 약속(가장 적극적인 구단)과 결과가 맞는다 */
  if(per==='season'&&G.day===tradeDL()){ for(let i=0;i<2;i++){ try{ if((G.offers||[]).length<4)aiOffer(); }catch(e){} } for(let i=0;i<3;i++)if((G.lgTrades||[]).filter(t=>t.y===G.year).length<20)aiTradeTry(); /* 마감일 막판 거래 */  }
  jobsDaily(); }
/* ===== 단장 경력: 명성과 다른 구단 제의 ===== */
function repSeason(y,rank,champ,runner,trustD){ G.rep=G.rep??50; { const J=G.gmJoin; if(J&&J.y===y&&J.tid===G.user&&J.psDone)return 0; } /* 시즌이 끝난 뒤 부임: 그해 성적은 전임 몫(검수 11-09zb) */ let d=0; if(champ)d+=10; else if(runner)d+=6; else if(rank<=5)d+=3; else if(rank>=8)d-=4; d+=clamp(trustD/3,-3,3);
  const net=sum((G.trades||[]).filter(t=>t.y===y&&t.gi&&(t.me==null||t.me===G.user)).map(t=>{ const r=tradeReport(t); return r?r.net:0; })); d+=clamp(net,-4,4);
  G.rep=clamp(Math.round(G.rep+d),0,100); return d; }
function repLabel(r){ return r>=80?'리그 최고의 단장':r>=65?'유능한 단장':r>=45?'평범한 단장':r>=30?'흔들리는 단장':'평판이 나쁜 단장'; }
function gmTurnover(){ gmInit(); const st=G.last&&G.last.order?G.last.order:null;
  for(const t of G.teams){ if(t.id===ME())continue; /* 야인일 때 전 소속 구단도 새 단장이 성적으로 평가받는다 */ const g=gmOf(t.id); if(!g)continue; g.age++; const rk=st?st.findIndex(o=>o.tid===t.id)+1:5; const ten=G.year-g.since;
    const fire=(rk>=8&&ten>=2&&R()<.4)||(rk>=6&&ten>=4&&R()<.2)||(g.age>=64&&R()<.35); if(!fire){ gmConRenew(g,rk,!!(G.last&&G.last.ps&&G.last.ps.champ===t.id)); continue; }
    const old=g.name; const want=G.unemp?R()<clamp((G.rep-10)/60,.15,.85):(G.rep>=45&&R()<clamp((G.rep-35)/50,.2,.7)); /* 현직이어도 명성 45부터 다른 구단이 빼 오려 한다 */ if(want&&!G.gameOver&&!(G.unemp&&G.unemp.from===t.id)&&!G.jobs.some(j=>!j.done)){ t.gm={...mkGM(t.id),name:'단장대행',interim:true}; jobOffer(t.id,false); wire('단장',`${t.city} ${t.nick}, ${old} 단장 경질. 후임을 물색 중입니다.`,{tid:t.id}); try{ gmFireNews(t,old,rk,ten,g.age,null); }catch(e){} }
    else { const og=(()=>{ try{ return obAiGM(t.id); }catch(e){ return null; } })(); t.gm=og||mkGM(t.id); if(!og)t.rel=clamp(Math.round(N(50,6)),35,65); wire('단장',`${t.city} ${t.nick}, ${old} 단장 후임으로 ${t.gm.name} 단장 선임 (${GMT[t.gm.trait].l})`,{tid:t.id}); try{ gmFireNews(t,old,rk,ten,g.age,t.gm); }catch(e){} } } }
function jobOffer(tid,fired,terms,exp0){ const t=team(tid); terms=terms||myCOffer(tid,fired); if(personalBroke()){ const s=Math.max(GMC_MIN,Math.round(terms.sal*.9/10)*10); if(s<terms.sal)terms={...terms,sal:s,broke:terms.sal}; } /* 하한에 걸려 그대로면 낮췄다고 하지 않는다(검수 11-09zc). broke=원래 금액 */ /* 야인 생활비가 바닥나면 구단이 사정을 알고 10% 낮춰 부른다(11-09) */ G.jobs.push({tid,exp:G.day+(fired?20:exp0?20:12),fired:!!fired,done:false,terms,exp0:!!exp0});
  mail(`${t.city} ${t.nick} 구단주실`,`${t.city} ${t.nick} 단장직 제의`,`${t.city} ${t.nick} 구단주실입니다. 단장님의 운영을 지켜봐 왔습니다. 저희 구단의 새 단장을 맡아 주실 수 있겠습니까?${exp0?' 계약이 끝나는 때라 미리 연락드립니다.':''}\n제시 조건: 연봉 ${money(terms.sal)}, ${terms.yrs}년${terms.broke?` (생활비가 바닥난 사정을 알고 평소 ${money(terms.broke)}보다 낮게 불렀습니다)`:''}${!G.unemp&&G.myC&&G.myC.tid!=null&&G.myC.sal?` (지금 연봉 ${money(G.myC.sal)})`:''}\n${tname(tid)} · 지난 시즌 ${G.last&&G.last.order?G.last.order.findIndex(o=>o.tid===tid)+1:'-'}위 · ${needText(tid)}\n${G.unemp?`수락하면 바로 ${t.city} ${t.nick}를 맡아 단장 경력을 다시 시작합니다.`:`수락하면 바로 ${t.city} ${t.nick}를 맡게 되고, 지금 구단과는 작별합니다.`}\n${jobBrief(tid).join(' · ')}`,
    {imp:true,kind:'경력',acts:[{l:`수락: ${t.city} ${t.nick}로 이동`,a:'jobYes',v:tid},{l:'거절',a:'jobNo',v:tid}]}); }
function jobsDaily(){ for(const j of G.jobs||[]){ if(j.done||G.day<j.exp)continue; jobAnswer(j.tid,false,true); } }
function jobAnswer(tid,yes,auto){ const j=(G.jobs||[]).find(x=>x.tid===tid&&!x.done); if(!j)return '제의가 없습니다.'; if(yes&&G.day>=j.exp){ jobAnswer(tid,false,true); return '제의 기한이 지났습니다.'; } /* 일일 처리 전에 눌러도 만료 제의는 받지 않는다(검수 11-06) */ j.done=true; const t=team(tid);
  if(yes){ const wasU=!!G.unemp; if(!G.unemp&&G.myC&&G.myC.tid!=null){ myCEnd('이직'); myCRenewClose(); }
    G.gmSince=G.year; G.gmSinceD=G.day; switchTeam(tid); try{ myCStart(tid,j.terms,wasU?'':'이직'); }catch(e){} for(const o of [...G.jobs])if(!o.done&&o.tid!==tid)jobAnswer(o.tid,false,true); return `${tname(tid)} 단장으로 취임했습니다. 연봉 ${money(G.myC.sal)}, ${G.myC.y0}~${G.myC.y1}년.`; }
  if(t.gm&&t.gm.interim){ t.gm=mkGM(tid); t.rel=50; wire('단장',`${t.city} ${t.nick}, ${t.gm.name} 단장 선임 (${GMT[t.gm.trait].l})`,{tid}); }
  return auto?'':`${t.city} ${t.nick}의 제의를 거절했습니다.`; }
/* 경질되면 야인이 된다. 시간은 계속 흐르고, 다른 구단에서 단장이 바뀔 때 명성에 따라 제의가 온다 */
/* 단장이 구단을 떠날 때(이직·경질·사임): 단장 개인에게 걸린 진행 중인 일은 끝내고, 그 구단 선수에게 단장이 건 표시는 지운다.
   구단에 남는 것(시설·신구장·계약)은 그 구단 몫으로 둔다 */
function leaveTeamState(old){
  for(const m of (G.mail||[]))if(m.acts)m.acts=m.acts.filter(a=>a.a!=='renewMgr'); /* 소속을 떠나면 옛 재계약 요청의 실행 권한도 끝난다 */
  if(G.fa){ G.fa.offers={}; G.fa.neg={}; G.fa.warned={}; } /* 옛 구단 이름으로 낸 FA 제안·협상 */
  if(G.faFund&&!G.faFund.done)G.faFund.tid=G.faFund.tid??old; else G.faFund=null; /* 우승 FA 특별자금 상환 의무는 구단에 남는다(검수 11-09zn) */ for(const g of (G.grants||[]))if(g.st==='open'){ g.st='void'; g.vd=1; } /* vd: 이직으로 멈춘 건. 같은 시즌 복귀하면 다시 연다(검수 11-09zzd) */ for(const r of (G.mreq||[]))if(r.st==='open'||r.st==='ask'){ r.st='void'; }
  G.ownOrder=null; G.watchPlanned=null; G.simPlanned=null; G.matchAwait=null; G.pitchCommit=[]; G.ivNewsQ=[]; G.ivFollowQ=[]; G.evf=(G.evf||[]).filter(f=>f.k==='scandal'&&f.data&&f.data.c>=2); /* 후원사 복귀는 구단 몫이라 남긴다(검수 11-09za) */ G.cwS=null; for(const g of (G.pledges||[]))if(!g.done){ g.done=true; g.void=true; }
  G.trn={}; G.trnI={}; /* 훈련 지시는 그 구단 선수에게 내린 것 */
  for(const c of Object.values(G.gmc||{}))c.neg=0; if(G.fa&&G.fa.mk)for(const mk of Object.values(G.fa.mk))if(mk&&mk.ll){ delete mk.ll; mk.done=true; } /* 전 구단 라스트 룩은 새 구단에서 쓸 수 없다(검수 11-08) */ /* 월 협상 횟수는 구단끼리의 것: 새 구단 이름으로는 다시 센다(검수 11-08) */ for(const id of (G.fmarket||[])){ const q=G.players[id]; if(q&&q.team==null)delete q.fneg; } /* 전 구단의 외국인 협상 횟수·대기 기한·경쟁 보류도 끝(검수 11-08) */
  G.supPlan=null; if(G.fanOps){ (G.fanYrT=G.fanYrT||{})[old]=G.fanOps; } /* 팬 운영 상태 전체(응원단·채널·쿨다운·미청구 요금)를 그 구단에 남긴다(검수 11-09j) */ G.fanOps=null; /* 응원단·채널·이벤트는 그 구단 것 */ G.campInj=1; G.form=null; G.leadAdj=null; G.pact=null; G.mpick=null;
  for(const p of Object.values(G.players)){ if(p.team!==old)continue; delete p.listed; delete p.urgent; delete p.promise; delete p.treq; } } /* 포지션 전환 훈련은 구단 훈련 지시라 구단에 남는다(검수 11-09zs) */
/* 떠난 구단이 걸려 있는 FA 보상 절차는 그 구단(이제 AI)이 마무리한다 */
function compHandOff(old){ for(const c of (G.comp||[])){ if(c.stage==='done')continue; if(c.to!==old&&c.from!==old)continue;
  try{ if(c.stage==='protect'&&c.to!==G.user){ c.prot=aiProtect(c.to,COMP[c.grade].prot); c.away0=awayOf(c.to).map(q=>q.id); c.pool0=compPool(c.to).map(q=>q.id); /* 제출 시점 후보 고정(검수 11-06) */ c.stage='pick'; c.exp=Math.max(c.exp,G.day+3); } /* 지명 단계는 평소처럼 3일 */ if(c.stage==='pick'&&c.from!==G.user)compAiPick(c); }catch(e){} } }
/* 떠나는 구단의 일회성 지출·수입(FA 보상금·계약금·방출 정산금·단장 결정 지출, 보상금 수령)은 그 구단 현금에서 바로 정산한다.
   스태프 연봉·프로그램 비용은 AI 구단처럼 운영비 안에서 처리한다 */
/* 그 구단 팬·언론 여론: 맡은 구단(야인이면 전 구단)은 G.pr, 이직으로 떠난 구단은 그 시즌 남긴 여론(돌아오면 이어받는 것과 같은 기준, 검수 11-09zza) */
function prOf(tid){ if(tid===G.user)return G.pr||null; const K=G.clubT&&G.clubT[tid]; return K&&K.fy===sponSeason()&&K.pr||null; }
function spendHandOff(old){ const S=G.spend||{}; const t=team(old); try{ const fy=fyNow(); let sm=0; for(const e of (G.smkL||[]))if(e.fy===fy&&e.tid===old){ const end=e.end??G.day; sm+=Math.round((e.a||0)*Math.max(0,end-e.d)/365); if(e.end==null){ e.end=G.day; const p=G.players[e.pid]; if(p&&p.smk&&p.smk.d===e.d)delete p.smk; } e.paid=1; } G.smkL=(G.smkL||[]).filter(e=>!e.paid); if(t&&sm>0){ t.cash+=sm; hoBook(old,[['스타 마케팅',sm]],[]); } }catch(e){} /* 이미 진행한 스타 마케팅 몫은 옛 구단 수입으로(검수 11-08: 이직하면 사라짐) */ if(t){ const out=(S.comp||0)+(S.rel||0)+(S.faB||0)+(S.etc||0)+(S.dev||0)+(S.fan||0)+(S.sev||0)+(S.coach||0), /* 감독 경질 정산금(sev)·코치 해지 정산금(coach)도 옛 구단 몫(검수 11-08) */ inn=(S.compIn||0)+(S.tradeIn||0)+(S.postIn||0)+(S.devRef||0)+(S.fanIn||0); /* 연수는 옛 구단 소속으로 계속되므로 연수비·환급도 옛 구단 몫 */ t.cash+=Math.round(inn-out);  hoBook(old,[['보상금·양도금 수령',S.compIn],['트레이드 현금 수령',S.tradeIn],['포스팅 수입',S.postIn],['연수비 환급',S.devRef],['기념 유니폼 판매',Math.min(S.fanIn||0,S.goods||0)],['구단 이벤트·채널 수입',Math.max(0,(S.fanIn||0)-(S.goods||0))]],[['FA 보상금·양도금',S.comp],['방출 정산금',S.rel],['FA·다년 계약금',S.faB],['단장 결정 지출',S.etc],['해외 연수',S.dev],['팬 마케팅·구단 이벤트',S.fan],['감독 경질 정산금',S.sev],['코치진 연봉',S.coach]]);
    if(!G.unemp0){ const st=[['감독 연봉',(S.mgr||0)-(S.sev||0)],['부상 방지 프로그램',S.med],['병원 제휴',S.hosp],['해외 스카우트망',S.intl],['전력분석원 연봉',S.data],['훈련 시설 유지비',S.fac],['스카우트 운영',scoutSpent()]]; t.cash-=Math.round(sum(st.map(x=>Math.max(0,x[1]||0)))); hoBook(old,[],st); if(G.fac)G.fac.hoD=G.day; /* 이날까지 시설 유지비는 냈다: AI 결산 증설분은 이 뒤부터(검수 11-09zza) */ } } /* 이미 쌓인 감독·스태프·시설 비용도 옛 구단 몫(검수 11-09x: 떠났다 돌아오면 결산에서 빠짐). 야인 기간에 쌓인 몫은 AI 운영비 안이라 넣지 않는다 */
  G.spend={mgr:0,coach:0,med:0,hosp:0,dev:0,intl:0,fac:0,etc:0,faB:0,scout:0}; G.spEp=(G.spEp||0)+1; /* 장부 회차: 웨이버 환급이 넘긴 장부 몫이면 현금으로(검수 11-09g) */ }
/* 이직 때 현금으로 먼저 정산한 항목도 그해 그 구단 결산 명세에 총액으로 남긴다(검수 11-09h). net은 이미 현금에 넣은 몫: 결산이 되돌린 뒤 명세대로 다시 넣는다 */
function hoBook(tid,inc,exp){ const k=fyNow()+':'+tid, H=G.hoL=G.hoL||{}, E=H[k]=H[k]||{inc:{},exp:{},net:0}; for(const [l,v] of inc)if(v>0){ E.inc[l]=(E.inc[l]||0)+Math.round(v); E.net+=Math.round(v); } for(const [l,v] of exp)if(v>0){ E.exp[l]=(E.exp[l]||0)+Math.round(v); E.net-=Math.round(v); } }
function firedFlow(y,msg,kind){ try{ if(typeof teleEv==='function')teleEv('gm_out',{kind:kind||'fired',rep:G.rep}); }catch(e){} gmInit(); const old=G.user; const ot=team(old);
  let pay=''; try{ if(kind){ if(G.myC&&G.myC.tid!=null)myCEnd(kind==='leave'?'재계약 고사':kind==='resign'?'자진 사임':'계약 만료',y); } else pay=myCFired(y); }catch(e){}
  chron('fired',`${kind==='leave'?'재계약 고사':kind==='expire'?'계약 만료':kind==='resign'?'자진 사임':'단장 경질'}: ${msg}`,null,old); G.unemp={y,msg,since:G.day,from:old,k:kind||'fired'}; (G.mktT=G.mktT||{})[old]={fy:sponSeason(),v:G.marketing}; /* 시즌 중 물러나도 그해 마케팅 설정은 그 구단 결산에(검수 11-09h). 결산 뒤면 다음 시즌 설정으로 남긴다(검수 11-09x) */ { const O=G.orgT=G.orgT||{}; O[old]=Object.assign(O[old]||{},{coachX:G.coachX||[]}); G.coachX=[]; } try{ const L=stInit(); L[old]={sc:G.scouts||[],an:anaList()}; stSync(old); G.scouts=[]; G.analysts=[]; }catch(e){} { const W=G.fwatchT=G.fwatchT||{}; W[old]=G.fwatch||[]; G.fwatch=[]; const X=G.fwNoT=G.fwNoT||{}; X[old]=G.fwNo||[]; G.fwNo=[]; } /* 스카우트·분석원도 구단에 남겨 후임 AI가 운영 */ /* 보조 코치는 구단 계약: 구단에 남긴다(돌아오면 이어받음, 새해엔 나이·계약이 흐름). 이직 때 새 구단 코치를 풀어 버리던 순서 문제도 없앤다(검수 11-08) */ ot.gm=mkGM(old); ot.rel=55; try{ contractHandOff(old); }catch(e){} /* 합의한 연봉은 후임이 바로 반영(이직과 같게, 검수 11-09zzb) */ try{ spendHandOff(old); }catch(e){} try{ leaveTeamState(old); compHandOff(old); }catch(e){}
  wire('단장',`${tname(old)}, ${kind==='leave'?'단장 재계약 불발':kind==='expire'?'단장과 계약 만료로 결별':kind==='resign'?`${meName()?meName()+' ':''}단장 자진 사임`:'단장 경질'}. 후임에 ${ot.gm.name} 단장`,{tid:old});
  mail('야인','단장직에서 물러났습니다',`${msg}${pay}\n\n이제 야인입니다. 시간은 그대로 흐르고, 다른 구단이 단장을 바꿀 때 단장 명성(${G.rep})을 보고 제의가 올 수 있습니다. 명성이 높을수록 제의가 자주 옵니다. 제의는 소식함과 홈에 뜹니다.\n\n그동안 리그 탭에서 판도를 지켜보세요. 단장 경력을 끝내려면 홈의 '단장 경력 마치기'를 누르면 됩니다.`,{imp:true,kind:'경력'});
  /* 명성이 높으면 곧바로 연락이 오기도 한다 */
  const cands=G.teams.filter(t=>t.id!==old&&!(G.jobs||[]).some(j=>!j.done&&j.tid===t.id)).map(t=>({t,rk:G.last&&G.last.order?G.last.order.findIndex(o=>o.tid===t.id)+1:5})).sort((a,b)=>b.rk-a.rk);
  const n=G.rep>=70?2:G.rep>=55?1:0; for(const c of cands.slice(0,n)){ const og=gmOf(c.t.id).name; c.t.gm={...mkGM(c.t.id),name:'단장대행',interim:true}; wire('단장',`${c.t.city} ${c.t.nick}, ${og} 단장과 결별`,{tid:c.t.id}); jobOffer(c.t.id,true); } }
/* 야인 기간: 전 소속 구단은 새 단장(AI)이 운영한다 */
function unempAuto(){ if(!G.unemp)return; if(G._unD===G.day)return; G._unD=G.day; /* 하루 한 번 */ const u=G.user;
  for(const e of (G.evs||[]))if(!e.done){ try{ evPick(e.id,e.def,true); }catch(x){ e.done=true; } }
  if(G.offers&&G.offers.length){ for(const o of [...G.offers])try{ answerOffer(o.id,false); }catch(x){} }
  if(!G.mgr[u])try{ const n=mgrNew(u,false); wire('감독',`${tname(u)}이(가) ${n.name} 감독을 새로 선임했습니다.`,{tid:u,x:{mid:n.id,hire:1}}); }catch(x){} /* 야인은 hireMgr을 쓸 수 없다: 전 구단(AI)이 직접 선임(검수 11-09z) */
  if(G.contract&&!G.contract.done&&G.day>=KD(12,10))try{ { let g=0; while(fReCapInfo().over>0&&g++<4){ const C=G.contract; const k=C.foreignEnd.map(id=>G.players[id]).filter(p=>p&&p.foreign==='용병'&&!C.foreignDrop.includes(p.id)).sort((a,b)=>b.newSal-a.newSal)[0]; if(!k)break; C.foreignDrop.push(k.id); } } confirmContracts(true); }catch(x){}
  (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(x){} });
  if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(x){}
  if(G.camp&&!G.camp.done&&!G.camp.focus)G.camp.focus='balance';
  if(foreignOpen()&&foreignOf(u).length<4&&dobj(G.day).w===2)try{ aiForeignFill(u); }catch(x){}
  if(rosterN(u)>ROSTER_MAX)try{ trimRoster(u,ROSTER_MAX); }catch(x){}
  G.medSet=true; G.res=null; G.live=null;
  const o=dobj(G.day); if(o.d===1){ G.rep=clamp((G.rep??40)+(G.rep<50?1:0),0,100); }
  /* 7월 1일: 하위권 구단이 단장을 바꾸며 연락해 오기도 한다 */
  if(o.m===7&&o.d===1&&!(G.jobs||[]).some(j=>!j.done)){ const st=standingsNow(); const t=team(st[st.length-1-ri(0,2)].tid); if(t.id!==u&&R()<clamp((G.rep-15)/80,.08,.6)){ const og=gmOf(t.id).name; t.gm={...mkGM(t.id),name:'단장대행',interim:true}; wire('단장',`${t.city} ${t.nick}, ${og} 단장 시즌 중 경질`,{tid:t.id}); try{ news('리그',`${tshort(t.id)}, ${og} 단장 시즌 중 경질`,`최하위권으로 처진 ${tname(t.id)}이(가) 시즌 도중 ${og} 단장을 경질했습니다. 후임을 물색 중입니다.`,0); }catch(e){} jobOffer(t.id,true); } } }
/* 자진 사임: 남은 계약 연봉은 받지 않는다. 계약 기간 중이면 명성이 조금 깎인다(시즌 중이면 더). 야인이 되어 다른 구단 제의를 기다린다 */
function resignGM(){ if(G.unemp)return '지금은 맡은 구단이 없습니다.'; const C=myCInit(); if(!C||C.tid==null)return '지금은 맡은 구단이 없습니다.'; const left=Math.max(0,C.y1-G.year); const mid=period()==='season'||period()==='post';
  const pen=(left>0?2:0)+(mid?3:0); G.rep=clamp((G.rep??50)-pen,0,100); try{ meInc('resign'); }catch(e){}
  const t=team(G.user); news('언론',`${tshort(G.user)} ${meName()?meName()+' ':''}단장 자진 사임`,`${mid?'시즌 도중 ':''}${tname(G.user)} 단장이 스스로 물러났습니다.${left>0?` 계약은 ${left}년 남아 있었습니다.`:''}`,-1);
  firedFlow(G.year,`${tname(G.user)} 단장직에서 스스로 물러났습니다.${left>0?` 남은 계약 ${left}년 치 연봉은 받지 않습니다.`:''}${pen?` 명성 -${pen}${mid?'(시즌 도중 사임)':''}.`:''}`,'resign'); void t; return ''; }
function retireGM(){ if(!G.unemp)return; G.gameOver={y:G.year,msg:`${G.unemp.y}시즌 뒤 야인으로 지내다 단장 경력을 마쳤습니다.`}; }
/* 구단을 옮기면 '우리 경기' 기록(최근 경기·월별 성적·상세 경기)을 새 구단 것으로 다시 만든다. 리그 경기 기록(tl)에서 새 구단 경기만 꺼낸다(옛 구단 경기가 섞여 '승 1:2'처럼 보이던 문제) */
function userLogRebuild(tid){ const S=G.sea; if(!S)return; const L=((S.tl||[])[tid])||[];
  S.ulog=L.filter(z=>z[5]!=null).map(z=>({d:z[5],h:z[3]?tid:z[4],a:z[3]?z[4]:tid,hs:z[3]?z[1]:z[2],as:z[3]?z[2]:z[1],res:z[0]>0?'승':z[0]<0?'패':'무',k:''}));
  { const P=G.ps; if(P&&P.order&&dobj((P.cur&&P.cur.days[0])||Object.values(P.resD||{})[0]||G.day).y===G.year){ const add=(k,hi,lo,v)=>{ if(!v||!v.p||(hi!==tid&&lo!==tid))return; v.d.forEach((d,i)=>{ const sc=v.p[i]; if(!sc||i>=v.p.length)return; const h=v.h[i], a=h===hi?lo:hi, hs=sc[0], as=sc[1], my=h===tid?hs-as:as-hs; S.ulog.push({d,h,a,hs,as,res:my>0?'승':my<0?'패':'무',k:`${ROUNDK[k.replace(/\d+$/,'')]||ROUNDK[k]} ${i+1}차전`}); }); };
    for(const [k,r] of Object.entries(P.res||{}))if(r)add(k,r[0],r[1],(P.days||{})[k]); for(const T of (P.tbRes||[]))add('tb',T.w,T.l,(P.days||{})['tb'+(T.pos-1)]); /* 순위 결정전도(검수 11-08) */ if(P.cur&&P.cur.pts)add(P.cur.round,P.cur.hi,P.cur.lo,{d:P.cur.days,h:P.cur.homes,p:P.cur.pts}); S.ulog.sort((x,y)=>x.d-y.d); } } /* 새 구단이 이미 치른 포스트시즌 경기도 달력·최근 경기에(검수 11-07) */
  const cm=dobj(G.day).m, cy=dobj(G.day).y; const by={}; for(const x of S.ulog){ const o=dobj(x.d); if(x.k||o.y!==cy||o.m>=cm)continue; /* 월별은 정규시즌만(검수 11-07) */ const b=by[o.m]=by[o.m]||{w:0,l:0,t:0}; b[x.res==='승'?'w':x.res==='패'?'l':'t']++; }
  S.months=Object.keys(by).map(Number).sort((a,b)=>a-b).map(m=>Object.assign({m:m+'월'},by[m])); const mk={w:0,l:0,t:0}; for(const o of S.months){ mk.w+=o.w; mk.l+=o.l; mk.t+=o.t; } S.mark=mk;
  { const mine=g=>g.home===tid||g.away===tid; const all=(G.games||[]).concat(G.gamesOff||[]); const seen=new Set(); const uniq=all.filter(g=>{ const k=g.gid??(g.day+':'+g.home+':'+g.away); /* 같은 날 같은 상대 두 경기(밀린 경기·더블헤더)는 경기 번호로 가른다(검수 11-09zs) */ if(seen.has(k))return false; seen.add(k); return true; }); G.games=uniq.filter(mine).sort((a,b)=>(b.day??0)-(a.day??0)).slice(0,25); G.gamesOff=uniq.filter(g=>!mine(g)&&g.day!=null&&dobj(g.day).y>=G.year-1).sort((a,b)=>a.day-b.day).slice(-300); /* 최근 경기 목록에 남은 지난 시즌 경기도 보관(검수 11-09zs) */ } /* 다른 구단 경기 상세는 버리지 않고 보관: 돌아오면 박스스코어가 되살아난다(검수 11-08) */ for(const g of G.games){ if(g.hs==null||g.as==null)continue; const my=g.home===tid?g.hs-g.as:g.as-g.hs; g.res=my>0?'승':my<0?'패':'무'; } /* 승패를 새 구단 기준으로(검수 11-07) */ G.res=null; }
/* 단장직 제의 요약: 맡기 전에 얼마나 어려운 팀인지(지금 순위·연봉 상한 대비·장기 부상·내년 연봉·구단주 성향) */
function jobBrief(tid){ const t=team(tid); const L=[]; const per=period(); const r=G.sea&&G.sea.rec&&G.sea.rec[tid];
  if((per==='season'||per==='post')&&r&&r.w+r.l>0){ const st=standingsNow(); L.push(`지금 ${tieRank(st,tid)}위(${r.w}승 ${r.l}패${r.t?` ${r.t}무`:''})`); } else L.push(`지난 시즌 ${G.last&&G.last.order?G.last.order.findIndex(o=>o.tid===tid)+1:'-'}위`);
  try{ const cap=capOf(sponSeason()), pay=capPay(tid); L.push(`선수 연봉 ${money(pay)} / 상한 ${money(cap)}(${pay>cap?'초과 '+money(pay-cap):'여유 '+money(cap-pay)})`); }catch(e){}
  const inj=playersOf(tid).filter(p=>(p.injOut||0)>=30).sort((a,b)=>b.injOut-a.injOut); L.push(inj.length?`장기 부상 ${inj.length}명(${inj.slice(0,3).map(p=>`${p.name} ${p.injOut}일`).join(', ')})`:'장기 부상 없음');
  try{ L.push(`내년 예상 연봉 총액 ${money(capPayNext(tid))}`); }catch(e){}
  L.push(`구단주 ${OWNER[t.owner]?OWNER[t.owner].label:''}${t.indie?' · 모기업 없음':''}`); return L; }
function switchTeam(tid){ champEventsInit(); const old=G.user; G.unemp0=!!G.unemp; /* 야인에서 부임: 사임 때 옛 구단에 남긴 스태프를 덮어쓰지 않는다 */ if(G.spon)G.spon.press=G.pr?G.pr.press:50; /* 떠나는 구단 언론 지수를 초기화 전에 계약서에 남긴다(검수 11-07) */ const ot=team(old), nt=team(tid), prev=nt.gm; try{ contractHandOff(old); }catch(e){} spendHandOff(old); /* 옛 구단에서 쓴 돈은 옛 구단이 내고, 새 구단 결산에 섞이지 않게 */
  facMoveTeam(old,tid); /* 시설·공사·버스는 구단에 남는다: 떠나는 구단은 그대로 갖고, 가는 구단 것을 그대로 이어받는다 */
  /* 부상 방지 프로그램·병원 제휴·해외 스카우트망·전력분석 수준·영구결번도 구단 것이다: 옛 구단에 두고, 새 구단 것(처음이면 기본 수준)을 이어받는다 */
  { const O=G.orgT=G.orgT||{}; O[old]={med:G.med,intl:G.intl,data:G.data,acad:G.acad||null,retNos:G.retNos||[],capex:G.capex||null,truck:G.truck||null,trnPol:G.trnPol,coachX:G.unemp&&O[old]&&O[old].coachX?O[old].coachX:(G.coachX||[])}; /* 야인이면 사임 때 남겨 둔 보조 코치 */ const n=O[tid]; delete O[tid]; G.coachX=n&&n.coachX?n.coachX:[]; /* 보조 코치도 구단 것(검수 11-07) */ G.retNos=n&&n.retNos?n.retNos:[]; G._capexN=n?n.capex:null; G.truck=n&&n.truck?n.truck:null; G.trnPol=n?.trnPol??'bal'; /* 시설 투자 요청 제한·트럭 시위 이력도 구단 것 */ /* 영구결번도 그 구단 것 */
    { const W=G.fwatchT=G.fwatchT||{}; if(!(G.unemp&&W[old]))W[old]=G.fwatch||[]; G.fwatch=W[tid]||[]; delete W[tid]; const X=G.fwNoT=G.fwNoT||{}; if(!(G.unemp&&X[old]))X[old]=G.fwNo||[]; G.fwNo=X[tid]||[]; delete X[tid]; } /* 자동 관찰 제외 기록도 구단별(검수 11-09b) */ /* 외국인 관찰 명단·파악도는 구단 스카우트의 것(검수 11-08) */ G.med=n&&n.med?n.med:{prev:1,hosp:'none'}; G.acad=n&&n.acad?n.acad:null; /* 아카데미 제휴도 비용을 낸 구단 것(검수 11-09zza) */ G.intl=n&&n.intl?n.intl:{us:1,la:0,jp:0,tw:0,au:0}; G.data=n&&n.data?n.data:{lv:1}; }
  { const m=G.mgr[tid]; if(m&&m.act){ m.interim=true; m.sal=m.sal||150; } } /* AI 구단 감독대행은 부임하면 우리 대행과 같은 대행으로(정식 감독처럼 면담·경질되지 않게, 검수 11-07) */
  if(!G.unemp||!ot.gm||ot.gm.interim){ ot.gm=mkGM(old); ot.rel=60; } /* 야인이던 때 전 구단은 이미 후임이 있다(검수 11-07) */ try{ stRaidSettle(); }catch(e){} /* 다른 구단이 낸 우리 스태프 영입 제안은 아직 옛 구단 단장일 때 정리: 그 구단으로 이직해도 스태프가 시장으로 새지 않게(검수 11-08) */ nt.gm=null; const tr0=nt.trust; G.user=tid; try{ rmSnap(true); }catch(e){} /* 새 구단 선수 능력치 기록 시작 */ champAdopt(tid); nt.trust=55; nt.rel=50;
  { const K=G.clubT=G.clubT||{}; K[old]={goals:G.goals,mentor:G.mentor,pr:G.pr,fy:sponSeason()}; } /* 구단주 시즌 목표·멘토 지정·팬/언론 여론은 그 구단 것: 같은 시즌에 돌아오면 이어받는다(검수 11-09zs) */ G.goals=null; G.policy=null; G.devProg=[]; try{ ovsHandOff(old,tid); }catch(e){ G.ovs=[]; } G.lineup={}; G.offers=[]; G.offerContact={}; if(G.md&&G.md.tid==null)G.md.tid=old; for(const q of G.mdPsQ||[])if(q.tid==null)q.tid=old; /* 제안 연락 제한도 전 구단 것(검수 11-08c) */ G.shortlist=[]; G.tsug=null; const KB=G.clubT[tid]; delete G.clubT[tid]; const back=KB&&KB.fy===sponSeason()?KB:null; if(back&&tr0!=null)nt.trust=tr0; /* 같은 시즌에 돌아오면 그 구단 구단주 신뢰도 그대로(진행 중인 신구장 협상 결과가 바뀌지 않게, 검수 11-09zza) */ G.mentor=back&&back.mentor&&back.mentor.y===G.year?back.mentor:null;
  /* 캠프: 옛 구단 훈련 방향·시작 기록은 두고, 새 구단 캠프를 합류 시점 기준으로 이어받는다(방향은 기본 '균형', 결산 비교는 합류일부터) */
  G.camp=G.camp&&!G.camp.done?(B=>{ const f=B[tid]||'balance'; delete B[tid]; const S=Object.assign({},G.camp.snT||{},{[old]:{snap:G.camp.snap,join:G.camp.join}}), r=S[tid]; delete S[tid]; return {focus:f,done:false,snap:r?r.snap:campSnap(),join:r?r.join:G.day,byT:B,snT:S}; })(Object.assign({},G.camp.byT||{},G.camp.focus?{[old]:G.camp.focus}:{})):null; /* 같은 캠프 중 돌아온 구단은 그 구단에 남긴 방향을 되살린다(검수 11-09o) */
  /* 마무리캠프도 같은 방식: 옛 구단은 정해 둔 방향으로 캠프를 마치고(byT), 새 구단은 기본 방향·합류일 기준 시작 기록으로 이어받는다 */
  if(G.fcamp&&!G.fcamp.done&&G.fcamp.y===G.year){ const F=G.fcamp; const B=Object.assign({},F.byT||{},{[old]:F.focus}), fk=FCAMP[B[tid]]?B[tid]:'skill'; delete B[tid]; const S=Object.assign({},F.snT||{},{[old]:{snap:F.snap,join:F.join}}), r=S[tid]; delete S[tid]; G.fcamp={y:F.y,focus:fk,done:false,snap:r?r.snap:campSnap(),join:r?r.join:G.day,byT:B,snT:S}; /* 캠프 중 돌아오면 비교 기준은 처음 캠프 시작 기록(검수 11-09zs) */
    mail('코칭스태프',`마무리캠프 합류 (${dmd(KD(11,25))}까지)`,`${tname(tid)} 마무리캠프는 이미 진행 중입니다. 훈련 방향은 ${fk==='skill'?'기본(기술 훈련)으로':`전에 정해 둔 ${FCAMP[fk]}(으)로`} 이어지며, 성장 결산은 오늘(${dmd(G.day)}) 기준으로 비교합니다. 방향을 바꾸려면 아래에서 고르세요.`,{kind:'캠프',acts:Object.entries(FCAMP).map(([k,l])=>({l,a:'fcampSet',v:k}))}); }
  for(const e of (G.evs||[]))if(!e.done){ if(e.k==='ovsback'){ const q=G.players[e.data&&e.data.pid]; if(q&&q.retAsk)try{ ovsBackAI(q); }catch(x){} } if(e.k==='sd2back'){ const q=G.players[e.data&&e.data.pid], o=e.data&&e.data.o; if(q&&o&&q.team===o.to)try{ sdBackDo(q,o,rosterN(o.from)<ROSTER_MAX&&aiVal(team(o.from),q)>=0); }catch(x){} } /* 2차 드래프트 복귀 결정 대기 중 이직: 옛 구단(이제 AI)이 한 번 정한다(검수 11-06) */ e.done=true; } /* 미결 해외 복귀 협상은 옛 구단(이제 AI)이 계약하거나 거절하고 닫는다 */ { const MK=G.mktT=G.mktT||{}, fy=sponSeason(); if(!G.unemp)MK[old]={fy,v:G.marketing}; const n=MK[tid]; G.marketing=n&&n.fy===fy?n.v:2000; delete MK[tid]; } /* 결산 뒤 겨울에 떠났다 돌아와도 다음 시즌 마케팅 설정을 이어받는다(검수 11-09x) */ /* 마케팅 예산도 그 구단 그해 설정: 떠난 구단 결산에 남고, 같은 해 돌아오면 이어받는다(검수 11-09h) */ G.pr=back&&back.pr?back.pr:{fan:55,press:50,hist:[]};
  for(const p of Object.values(G.players)){ if(p.team===old){ delete p.listed; delete p.promise; } }
  G.unemp=null; G.gameOver=null; G.stops=[]; if(G.contract&&G.contract.done)G.contract.tid=tid; if(G.day>G.cal.end&&G.rolled!==G.year)try{ cOptAsk(); }catch(e){} /* 정규시즌 뒤 부임: 새 구단(돌아온 구단 포함)의 아직 안 정한 구단 옵션을 다시 묻는다(검수 11-09zzb) */
  { const r=G.sea&&G.sea.rec&&G.sea.rec[tid], per=period(); G.gmJoin=r&&(per==='season'||per==='post'||G.rolled!==G.year)?{y:G.year,tid,w:r.w||0,l:r.l||0,t:r.t||0,prev:prev?{k:prev.id,n:prev.name}:null,psDone:!!(G.ps&&G.ps.done&&G.ps.finDay!=null&&dobj(G.ps.finDay).y===G.year)}:null; } /* 결산 전이면(한국시리즈 뒤 포함) 부임 시점 승패를 빼고, 가을야구가 끝난 뒤 부임했으면 그해 우승·준우승도 남의 것(검수 11-08) */ /* 부임 시점 승패: 단장 통산에서 뺀다 */
  /* 스태프는 구단에 남는다: 우리 스카우트·분석원은 옛 구단 몫으로, 새 구단의 스태프를 이어받는다 */
  try{ const L=stInit(); if(!(G.unemp0&&L[old]))L[old]={sc:G.scouts||[],an:anaList()}; stSync(old); const nl=L[tid]||stMakeTeam(nt); delete L[tid]; G.scouts=nl.sc; G.analysts=nl.an; }catch(e){} delete G.unemp0;
  /* 옛 구단에 묶인 계약·약속·진행 중인 일은 넘어오지 않는다 */
  { const O=G.sponT=G.sponT||{}; /* shortcut: 떠날 때 언론 지수로 이미지 조항 판단(AI 구단엔 언론 지수가 없음) */ O[old]=G.spon||null; G.spon=O[tid]||null; delete O[tid]; if(G.spon){ if(G.spon.press!=null&&G.pr)G.pr.press=G.spon.press; /* 돌아온 구단은 떠날 때 언론 논조를 이어받는다(이미지 조항 회피 방지, 검수 11-09i) */ G.spon.off=(G.spon.off||[]).filter(x=>x.exp>=G.day); /* 떠난 사이 만료된 제안은 버린다(검수 11-09i) */ } } /* 스폰서 계약도 구단 것: 떠나도 금액·기간·만료일 그대로 두고, 돌아오면 이어받는다 */
  G.capex=G._capexN||null; delete G._capexN; G.ivProm=[]; G.iv=null; G.stRaid=[]; G.stPo=null; G.gmPlan={}; if(G.fa&&G.fa.pitch)G.fa.pitch={}; /* 전 구단에 온 FA 우선 제안은 이직하면 끝 */
  try{ leaveTeamState(old); compHandOff(old); }catch(e){} if(back)for(const g of (G.grants||[]))if(g.vd&&g.st==='void'&&g.tid===tid){ g.st='open'; delete g.vd; } /* 지원금과 그 목적은 구단에 남는다: 같은 시즌 돌아오면 점검을 이어 간다(검수 11-09zzd) */ if((G.fanYrT||{})[tid])try{ fanOps(); }catch(e){} /* 돌아온 구단 팬 운영은 바로 이어서 청구·효과(검수 11-09j) */ /* 인터뷰 기사 대기열·동석 관람 건의 기회·공개 약속도 옛 구단 몫이다 */
  { const keep=G.bLocks&&G.bLocks[tid]; if(back&&back.goals&&back.goals.y===G.year)G.goals=back.goals; else try{ if(period()!=='off')setGoals(); }catch(e){} if(keep&&keep.fy===sponSeason())G.bLocks[tid]=keep; } /* 같은 시즌 같은 구단에 돌아오면 그때 확정한 예산 기준 그대로(검수 11-09h) */
  try{ userLogRebuild(tid); }catch(e){} try{ tbTakeSnap(); }catch(e){} G.relHist=[]; try{ relSnap(); }catch(e){} /* 최근 관계 변화는 새 구단 기준에서 다시 잰다(검수 11-09zs) */
  addLog(`${tname(old)}을(를) 떠나 ${tname(tid)} 단장으로 취임했습니다.`); chron('join',`새 단장 취임`,null,tid); try{ G.tgrow=[]; ovrSnap(); growSnap(); }catch(e){}
  mail('구단주실',`${nt.city} ${nt.nick} 단장 취임`,`${tname(tid)} 단장으로 취임하셨습니다. 선수단과 코치진, 감독은 그대로 이어받습니다. 재정과 목표는 이 구단 기준으로 새로 시작합니다.\n${needText(tid)}`,{kind:'경력'}); }

