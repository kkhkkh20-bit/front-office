/* ===== 선수 면담: 고민 묻기에서 꺼내는 실제 고민 + 단장 말·인사말 변주 (29c_player_voice.js의 말투를 쓴다) =====
   고민은 지금 게임 상태에서만 나온다: 약속 대기·재활·트레이드 명단·주전 밀림(막고 있는 주전 이름, 해 본 다른 포지션)·출전 부족·
   받은 트레이드 제안에 이름이 있음(다른 구단 관심)·군 문제(입대 기한)·FA·이적 적응·외국인 첫 시즌 적응·부상 복귀·피로·최근 부진·팀 연패.
   친분이 낮은 과묵형·베테랑·예민형은 같은 고민을 두루뭉술하게(v) 말하고, 친분이 높으면 두 번째 고민까지 털어놓는다 */
const PV_CONCERN={
  prom_wait:{all:[c=>`출전 기회 얘기는 ${c.promUntil}까지 지켜보겠습니다. 준비는 다 돼 있습니다.`,c=>`건의해 주신 출전 기회를 기다리고 있습니다. ${c.promUntil}까지라고 하셨죠.`,c=>`감독님께 말씀해 주신 건 어떻게 됐을까요? ${c.promUntil}까지는 기다려 보겠습니다.`],touchy:['약속해 주신 출전 기회가 아직이라... 솔직히 매일 라인업부터 봅니다.'],v:['지난번 말씀하신 건... 기다리고 있습니다.','...아직 기다리는 중입니다.']},
  inj:{all:['재활이 지루하긴 합니다. 빨리 돌아가고 싶어요.','트레이너 선생님 말씀대로 하고 있습니다. 서두르지는 않겠습니다.'],touchy:['다친 데가 또 아플까 봐 겁이 납니다.'],bold:['재활 일정보다 빨리 돌아갈 자신 있습니다.'],foreign:['몸이 빨리 나았으면 좋겠어요. 팀에 미안해요.'],rookie:['다쳐서 죄송합니다... 빨리 돌아가겠습니다.']},
  listed:{all:['트레이드 명단에 제 이름이 올랐다는 얘기를 들었습니다. 그렇다면 미리 알려 주셨으면 합니다.'],touchy:['트레이드 얘기가 돈다던데... 요즘 그 생각만 하게 됩니다.'],leader:['제 이름이 트레이드 얘기에 나온다고 들었어요. 구단 뜻이면 따르겠지만, 미리 말씀은 해 주세요.'],v:['...요즘 이런저런 얘기가 들려서 마음이 좀 그렇습니다.','...이런저런 소문이 들려서요.']},
  star_bench:{all:['주전으로 뛰지 못해 답답합니다.',pvS(c=>c.block?`${c.block} 선수가 잘하는 건 알지만, 저도 주전으로 뛰고 싶습니다.`:''),pvS(c=>c.subs?`${c.subs} 쪽도 해 봤습니다. 그쪽이라도 나갈 수 있으면 좋겠습니다.`:'')],
    bold:['솔직히 제가 벤치에 있을 선수는 아니라고 생각합니다. 기회만 주시면 됩니다.'],vet:['이 나이에 벤치는 좀 답답하네요. 아직 주전으로 할 수 있습니다.'],v:['...출전 쪽이 조금 답답합니다.','...좀 더 뛰고 싶긴 합니다.']},
  pt_age:{all:['나이가 있어서 더 많은 기회가 필요합니다.',pvS(c=>c.e2?'2군에서 시간 보내기엔 나이가 아깝습니다. 1군 기회가 필요합니다.':''),pvS(c=>c.subs?`${c.subs} 자리도 해 봤습니다. 어디든 나갈 수 있으면 좋겠습니다.`:''),pvS(c=>c.block?`${c.block} 선수 뒤에서 기다리기만 하기엔 시간이 없습니다.`:'')],
    vet:['저한테 남은 시간이 많지 않습니다. 뛰는 시간이 더 필요해요.'],v:['...뛰는 시간이 좀 더 있으면 좋겠습니다.','...기회가 좀 아쉽습니다.']},
  wanted:{all:['다른 구단에서 저를 묻는다는 얘기를 들었습니다. 저는 일단 여기 일에 집중하겠습니다.','에이전트 쪽에서 다른 팀 얘기가 들린다고 하던데, 신경은 안 쓰려고 합니다.',pvS(c=>c.loyal?'다른 데서 찾는다는 얘기가 들리던데, 저는 여기 남고 싶습니다.':'')],touchy:['다른 팀에서 저를 원한다는 얘기가 있던데... 혹시 보내실 생각이신가요?']},
  mil:{all:[c=>`군 문제를 슬슬 정해야 해서 신경이 쓰입니다. ${c.milBy}년까지는 가야 하거든요.`,'입대 시기를 언제로 할지 고민입니다. 상무에 지원해 볼 수 있을지 여쭙고 싶었습니다.'],bold:['군대 가기 전에 1군에서 확실히 자리를 잡아 놓고 싶습니다. 상무도 생각하고 있습니다.'],v:['...군 문제가 좀 걸립니다.','입대 문제가... 좀 그렇습니다.']},
  fa:{all:[c=>c.faY<=1?'이번 시즌이 끝나면 FA라 미래가 신경 쓰입니다.':'FA를 앞두고 미래가 신경 쓰입니다.',pvS(c=>c.loyal?'FA가 가까워지니 구단이 저를 어떻게 보는지 궁금합니다. 저는 남고 싶은 쪽이고요.':''),pvS(c=>c.market?'FA가 다가오니 시장에서 어떻게 볼지도 궁금합니다. 솔직히 말씀드리면요.':'')],v:['...계약 쪽이 좀 신경 쓰입니다.','...앞으로 어떻게 될지 좀 궁금합니다.']},
  trade_new:{all:[c=>`${c.trade||'전 팀'}에서 온 지 얼마 안 돼서 아직 사인이랑 동료 이름이 헷갈립니다.`,'새 팀에 적응하는 중입니다. 선배들이 잘 챙겨 줘서 생각보다 빨리 익숙해지고 있습니다.'],quiet:['아직 적응 중입니다.'],bold:['팀 옮긴 건 신경 안 씁니다. 여기서도 제 야구 하면 됩니다.']},
  homesick:{foreign:['가족이 많이 보고 싶어요. 그래도 동료들이 잘해 줘서 괜찮아요.','한국 생활은 아직 적응 중이에요. 원정 이동이 생각보다 길어요.','통역 친구가 많이 도와줘요. 음식은 이제 거의 다 먹어요.']},
  injBack:{all:['복귀한 지 얼마 안 돼서 아직 경기 감각이 덜 올라왔습니다.','몸은 다 나았습니다. 경기 감각만 찾으면 됩니다.'],touchy:['복귀는 했는데 다친 데가 자꾸 신경 쓰입니다.']},
  fatigue:{all:['솔직히 몸이 좀 무겁습니다. 하루쯤 쉬면 좋겠습니다.','요즘 회복이 더딥니다. 쉬는 날 하루만 있으면 다시 괜찮아질 것 같습니다.'],bold:['피곤하긴 한데 빠질 정도는 아닙니다. ...아마도요.'],v:['좀 지치긴 했습니다.','...몸이 좀 무겁습니다.']},
  cold:{all:[c=>`${c.form.t}(이)라 머리가 복잡합니다. 코치님이랑 영상 보면서 고치는 중입니다.`,c=>`${c.form.t}... ${c.isP?'제구가':'타이밍이'} 안 맞습니다. 정리할 시간이 좀 필요합니다.`],bold:[c=>`${c.form.t}라도 걱정 안 합니다. 한 번 맞기 시작하면 금방입니다.`],v:['요즘 잘 안 풀립니다.','...요즘 좀 안 맞습니다.']},
  team_bad:{all:['팀 성적이 좋지 않아 분위기가 무겁습니다.','팀이 이기질 못하니 다들 웃음이 줄었습니다.','요즘은 이기는 경기가 그립습니다. 덕아웃이 너무 조용해요.',pvS(c=>c.team.st<=-3?`${-c.team.st}연패라 라커룸이 조용합니다. 다들 말을 아낍니다.`:'')],leader:['팀 분위기가 무겁습니다. 고참들끼리 후배들 밥이라도 한번 사려고요.'],foreign:['팀이 많이 져서 마음이 안 좋아요.']},
  happy:{all:['요즘 야구가 즐겁습니다.',pvS(c=>c.team.st>=3?`${c.team.st}연승이라 다들 신났습니다. 특별한 고민은 없습니다.`:''),pvS(c=>c.form.k==='hot'?`${c.form.t}(이)라 요즘은 야구장 오는 게 즐겁습니다.`:'')],rookie:['요즘 하루하루가 신기합니다. 1군 덕아웃에 앉아 있는 것만으로도요.'],vet:['요즘은 몸도 괜찮고, 야구할 맛이 납니다.'],foreign:['요즘 즐거워요. 팀 분위기가 좋아요.'],quiet:['요즘 괜찮습니다.']},
  none:{all:['특별한 고민은 없습니다.','딱히 없습니다. 하던 대로 하고 있습니다.'],quiet:['없습니다.'],rookie:['아, 아직은 그냥 정신없습니다. 고민할 틈도 없습니다.'],vet:['이 나이 되면 고민도 줄어요. 몸 관리가 제일이죠.'],foreign:['지금은 괜찮아요. 고마워요.']}};
/* 출전 기회가 없고 야망이 큰 선수가 많이 처졌으면, 트레이드 요청으로 갈 수 있다는 실제 신호를 말한다(requestCheck: 기분 22 미만·야망 13 이상) */
const PV_LEAVE=['솔직히 여기서 기회가 없으면 다른 길도 생각하게 됩니다.','이대로라면 저도 다른 팀을 생각할 수밖에 없습니다.'];
/* 지금 실제 상태에서 고민 목록(앞이 급함). 숨은 값은 쓰지 않는다 */
function pvConcerns(p,c){ const per=period(), live=per==='season'||per==='post'; const L=[]; const ok=healthy(p)&&!isAway(p);
  if(p.promise&&c.prom==='wait')L.push('prom_wait');
  if(p.injOut>0)L.push('inj');
  if(p.listed)L.push('listed');
  if(pvWanted(p))L.push('wanted'); /* 받은 제안은 곧 끝나는 정보라 출전 불만보다 먼저 */
  if(live&&!c.reg&&ok&&(ovr(p)>=55||(p.sal||0)>=500))L.push('star_bench'); else if(live&&!c.reg&&ok&&p.age>=27)L.push('pt_age');
  try{ if(!p.foreign&&p.mil!==undefined){ if(milFree(p)&&p.age>=26&&!(p.mil&&(p.mil.app||p.mil.until)))L.push('mil'); } }catch(e){}
  if(!p.foreign&&!p.faC&&(p.svc||0)>=faSvc(p)-1)L.push('fa');
  if(c.trade!=null)L.push('trade_new');
  if(p.foreign&&!(p.hist||[]).some(h=>h.y<G.year&&h.lvl==='1군'))L.push('homesick');
  if(c.injBack)L.push('injBack');
  if(live&&(p.fat||0)>=60)L.push('fatigue');
  if(c.form.k==='cold')L.push('cold');
  if(c.team.bad||c.team.st<=-4)L.push('team_bad');
  if((p.mor??60)>=65)L.push('happy');
  L.push('none'); return L; }
function pvAskCtx(p,c){ const s=p.pers||{}; const b=pvBlocker(p); c.block=b?b.name:''; let subs=[]; try{ subs=subsOf(p).filter(k=>{ const q=depth(G.user).ln[k]; return !q||ovr(q)<ovr(p)+2; }).slice(0,2); }catch(e){} c.subs=subs.map(k=>POSK[k]||k).join('·');
  c.loyal=(s.loy||0)>=13; c.market=!c.loyal&&(s.amb||0)>=13; c.milBy=G.year+Math.max(0,27-p.age); return c; }
/* 고민 묻기 한 번: 방금 경기 반응(있으면) + 고민(친분이 높으면 둘) */
function pvAsk(p,ev,bond){ const c=pvAskCtx(p,pvCtx(p,ev)), s=p.pers||{}, v=pvVoice(p); const out=[];
  if(ev){ const k=ev.k==='bad'?((s.temp||0)>=15?'ev_bad_t':(s.amb||0)>=15?'ev_bad_b':(s.temp||10)<=7?'ev_bad_c':'ev_bad'):((s.temp||0)>=15?'ev_good_t':'ev_good'); const t=pvFrom(p,PV_BANK[k],k,c); if(t)out.push(t); }
  const C=pvConcerns(p,c); const real=C.filter(k=>k!=='happy'&&k!=='none'); const guard=bond<35&&['quiet','vet','touchy'].includes(v);
  const say=k=>{ const B=PV_CONCERN[k]; if(!B)return ''; if(guard&&B.v)return pvPick(p,k+'.v',B.v.map((f,i)=>({id:k+'.v.'+i,s:0,f})),c)||''; return pvFrom(p,B,'c_'+k,c)||''; };
  if(ev&&!real.length){ /* 방금 경기 얘기에 덧붙일 고민이 없으면 그것으로 끝 */ }
  else { const k1=real[0]||C[0]; out.push(say(k1)); if(real.length>1&&bond>=55&&!guard){ const t2=say(real[1]); if(t2)out.push('그리고 '+t2); }
    if((k1==='pt_age'||k1==='star_bench')&&(s.amb||0)>=13&&(p.mor??60)<35&&!p.foreign&&!guard)out.push(pvPick(p,'leave',PV_LEAVE.map((f,i)=>({id:'leave.'+i,s:0,f})),c)); }
  return out.filter(Boolean).join(' '); }
/* talk()가 정한 결과(out)에 맞는 말투 문장. rep: 칭찬 효과가 줄어든 이유(cap·rep2·rep1) */
function pvTalk(p,kind,out,rep,line,x){ try{ const c=pvCtx(p,null); Object.assign(c,x||{});
    if(rep==='cap'||rep==='rep2'){ const k='pr_'+rep; return pvFrom(p,PV_BANK[k],k,c)||line; }
    const t=PV_BANK[out]?pvFrom(p,PV_BANK[out],out,c):null; if(!t)return line;
    if(rep==='rep1'){ const r=pvFrom(p,PV_BANK.pr_rep1,'pr_rep1',c); return r?t+' '+r:t; }
    return t; }catch(e){ return line; } }
/* 단장이 먼저 꺼내는 말(반말): 상황에 따라 바뀐다. 같은 선수에게 바로 앞 말은 피한다 */
const PV_GM={praise:['요즘 정말 잘해 주고 있어. 고맙다.','늘 고생 많다. 고맙게 생각하고 있어.',pvS(c=>c.reg&&!c.e2&&c.team.good?'요즘 네 덕분에 이긴 경기가 많다. 고맙다.':''),pvS(c=>c.form.k==='hot'?(c.isP?'요즘 공 정말 좋더라. 고맙다.':'요즘 방망이 불붙었더라. 고맙다.'):''),pvS(c=>c.e2?'2군 보고서 계속 보고 있다. 잘하고 있더라.':''),pvS(c=>c.trade!=null?'와서 금방 자리 잡아 줘서 고맙다.':'')],
  push:['솔직히 지금보다 더 해 줘야 한다.','네가 할 수 있는 게 이것보다 많다고 본다.',pvS(c=>c.form.k==='cold'?`${c.form.t}. 이대로는 안 된다.`:'')],
  promise:['감독님께 출전 기회를 건의해 볼게.','감독님한테 너 좀 써 달라고 말해 볼게.',pvS(c=>c.e2?'1군에서 한번 볼 수 있게 감독님께 말해 볼게.':'')],
  futreq:['2군 감독님께 너를 꾸준히 써 달라고 할게.','2군에서라도 매일 나가게 해 달라고 부탁해 볼게.'],
  contract:['계약 이야기를 좀 해 볼까.','앞으로 계약은 어떻게 생각하고 있어?',pvS(c=>c.faY!=null&&c.faY<=1?'FA가 얼마 안 남았지. 생각 좀 들어 보자.':'')],
  ask:['요즘 고민 있나? 편하게 말해 봐.','요즘 어때? 하고 싶은 말 있으면 해 봐.',pvS(c=>c.injOut?'몸은 좀 어때? 재활은 할 만해?':''),pvS(c=>c.mor<45?'얼굴이 좀 어둡다. 무슨 일 있어?':''),pvS(c=>c.trade!=null?'새 팀 적응은 좀 어때?':''),pvS(c=>c.team.st<=-3?'요즘 팀이 계속 지는데, 너는 괜찮아?':'')]};
function pvGm(p,kind){ const B=PV_GM[kind]; if(!p||!B)return ''; try{ const c=pvCtx(p,null); c.injOut=p.injOut>0; c.mor=p.mor??60;
  const L=[]; B.forEach((x,i)=>{ const isS=!!(x&&x.s), f=isS?x.f:x, t=typeof f==='function'?f(c):f; if(t)L.push({id:kind+i,t,w:isS?2:1}); }); if(!L.length)return '';
  const M=p.pvG||[]; const P=L.filter(x=>!M.includes(x.id)&&x.id!==G.pvGmLast); const Q=P.length?P:L; let r=u01('pvgm:'+p.id+':'+kind+':'+(p.pvN||0),G.day)*sum(Q.map(x=>x.w)), x=Q[Q.length-1]; for(const y of Q){ r-=y.w; if(r<=0){ x=y; break; } }
  p.pvG=[x.id,...M.filter(i=>i!==x.id)].slice(0,3); G.pvGmLast=x.id; /* 단장 말 기억은 선수 말 기억과 따로 둔다 */ return x.t; }catch(e){ return ''; } }
/* 면담실 첫인사: 기분 + 말투 */
const PV_HI={good:{all:['단장님! 무슨 일이세요?','아, 단장님. 오셨어요?'],rookie:['아, 안녕하십니까! 부르셨습니까?'],vet:['오, 단장님. 커피라도 한잔하실래요?'],foreign:['안녕하세요, 단장님! 무슨 일이에요?'],quiet:['네, 단장님.']},
  mid:{all:['아, 단장님. 안녕하세요.','네, 단장님. 말씀하세요.'],rookie:['아, 네! 안녕하십니까.'],leader:['단장님, 오셨어요. 앉으시죠.'],foreign:['안녕하세요. 무슨 일이에요?'],quiet:['...네.']},
  bad:{all:['...네. 부르셨어요?','...무슨 일이세요?'],touchy:['...혹시 안 좋은 얘기인가요?'],bold:['...할 말 있으시면 하세요.'],foreign:['...네. 말씀하세요.']}};
function pvGreet(p){ const mo=p.mor??60; const k=mo>=70?'good':mo>=45?'mid':'bad'; try{ const v=pvVoice(p); const B=PV_HI[k]; const L=[...(B[v]||[]),...B.all]; return L[Math.floor(u01('pvhi'+p.id+':'+k,G.day)*L.length)%L.length]; }catch(e){ return mo>=70?'단장님! 무슨 일이세요?':mo>=45?'아, 단장님. 안녕하세요.':'...네. 부르셨어요?'; } }
/* 친분이 높을 때 붙는 첫마디(가끔만, 말투별): personalTalkReply가 쓴다 */
const PV_WARM={all:['단장님께는 편하게 말씀드릴 수 있겠네요. ','단장님이니까 말씀드리는 건데요, '],rookie:['단장님이 편하게 대해 주셔서 말씀드립니다. '],vet:['우리 사이니까 하는 말인데요, '],foreign:['단장님한테는 솔직하게 말할게요. '],quiet:[''],leader:['단장님이랑은 터놓고 얘기해도 되죠. ']};
function pvWarm(p){ if(u01('pvw'+p.id+':'+(p.pvN||0),G.day)>=.4)return ''; const v=pvVoice(p); const L=[...(PV_WARM[v]||[]),...PV_WARM.all]; return L[Math.floor(u01('pvw2'+p.id+':'+(p.pvN||0),G.day)*L.length)%L.length]; }
