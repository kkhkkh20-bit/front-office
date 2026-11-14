/* ===== 감독·구단주 대화 속 쓸모 있는 귀띔(사용자 11-14: "대화를 좀 도움 되는 정보를 주게") =====
   감독: 최근 10경기 부진한 주전·벤치에서 뜨거운 타자·연투가 쌓인 불펜·2군에서 잘하는 선수(퓨처스 기록)·전력 하위권 자리·다음 상대 흐름·처진 선수·곧 돌아올 부상자.
   구단주: 지원 요청을 꺼낼 만한 분위기(ownOdds·올해 요청 여부)·예산 여유·시즌 목표와 지금 순위·팬/언론 여론과 스폰서 위험·만료되는 스폰서 계약·들어온 스폰서 제안·단장에 대한 신뢰.
   모두 지금 게임 상태에서만 만든다(보이는 기록만 숫자로, 숨은 값은 말로). 감독이 그 선수를 덜 봤으면(mgrKnow) 판단을 조심스럽게 말하고,
   관계가 서먹하면(35 미만) 사실만 짧게 말한다. 같은 귀띔은 10일 안에 다시 하지 않는다. 경기 난수(R)는 쓰지 않는다 */
const TI_OP={
  cold:{data:'시즌 기록과 차이가 커서 일시적인지 보고 있습니다. 하루 이틀 빼 주는 것도 방법입니다.',fire:'본인이 제일 답답할 겁니다. 그래도 계속 내보내서 스스로 깨게 하고 싶습니다.',warm:'표정이 많이 굳었어요. 단장님이 한번 불러서 얘기 들어 주시면 좋겠습니다.',old:'쉬게 할 생각은 없습니다. 특타로 풀어야죠.',calm:'조금 더 지켜보겠습니다. 다음 주에도 이러면 타순을 내리겠습니다.'},
  coldP:{data:'구속이나 제구 어느 쪽 문제인지 분석팀과 나눠 보고 있습니다.',fire:'한 번만 더 믿어 보겠습니다. 거기서도 안 되면 저도 결단하겠습니다.',warm:'본인이 많이 위축돼 있습니다. 단장님이 한마디 해 주시면 좋겠어요.',old:'불펜 피칭부터 다시 시키겠습니다. 기본이 흔들린 겁니다.',calm:'등판 간격을 하루 더 주고 지켜보겠습니다.'},
  benchHot:{data:'표본은 작지만 타구 질이 좋습니다. 선발로 몇 경기 써 볼 만합니다.',fire:'이런 선수는 기세 탈 때 써야죠. 선발로 넣어 보겠습니다.',warm:'본인도 기회를 기다리고 있어요. 한번 밀어주고 싶습니다.',old:'아직 더 봐야겠지만, 방망이는 인정합니다.',calm:'몇 경기 더 보고 선발로 넣을지 정하겠습니다.'},
  pen:{data:'이 이상 쓰면 다음 주가 위험합니다. 당분간 다른 투수로 돌리겠습니다.',fire:'이기려면 써야 하는데, 솔직히 불펜 한 명이 더 있었으면 합니다.',warm:'본인들은 괜찮다는데 팔이 걱정입니다.',old:'불펜은 원래 힘든 자리지만 이건 좀 많습니다.',calm:'당분간 다른 투수들로 돌려 막겠습니다.'},
  callup:{data:'2군 기록이라 할인해서 봐야 하지만, 1군에서 한번 확인해 볼 가치는 있습니다.',fire:'올려 주시면 바로 써 보겠습니다.',warm:'그 친구 1군 한번 밟게 해 주고 싶습니다.',old:'2군 기록은 2군 기록입니다. 그래도 한번은 직접 보고 싶네요.',calm:'1군 자리가 나면 먼저 올려 볼 생각입니다.'},
  hole:{data:'내부 대안과 비교해 보면 보강 효과가 제일 큰 자리입니다.',fire:'여기 하나만 메워 주시면 해 볼 만합니다.',warm:'지금 맡은 선수도 부담이 클 겁니다.',old:'그 자리는 기본부터 다시 잡아야 합니다.',calm:'시장에 쓸 만한 선수가 있는지 봐 주시면 좋겠습니다.'}};
/* 감독이 그 선수를 덜 봤을 때 붙이는 말 */
const TI_UNSURE=['제가 아직 그 선수를 많이 보지는 못해서, 원인은 좀 더 봐야 알 것 같습니다.','직접 본 경기가 많지 않아서 단정하기는 이른 것 같습니다.'];
function tiRecentPen(p){ const L=p.gl&&p.gl.y===G.year?p.gl.g||[]:[]; return L.filter(x=>G.day-x[0]<=3&&x[0]<=G.day).length; }
function tiNextOpp(){ try{ for(let d=G.day+1;d<=G.day+3;d++){ const L=(G.cal&&G.cal.sched&&G.cal.sched[d])||[]; const g=L.find(x=>x.includes(G.user)); if(g)return g[0]===G.user?g[1]:g[0]; } }catch(e){} return null; }
/* 감독 귀띔 후보: {k,id,t} */
function tiMgrFacts(m){ const out=[]; if(!m||G.unemp)return out; let d,P; try{ d=depth(G.user); P=playersOf(G.user); }catch(e){ return out; } const v=mgrVoice(m), cold=(m.rel??50)<35;
  const per=period(), live=per==='season'||per==='post'; const op=(k,p)=>cold?'':p&&mgrKnow(m,p)<.45?mvPick(m,'tiu'+k+p.id,TI_UNSURE):(TI_OP[k]&&TI_OP[k][v])||'';
  const add=(k,id,a,b)=>out.push({k,id:k+':'+(id??''),t:[a,b].filter(Boolean).join(' ')});
  if(live){
    for(const p of d.start){ const f=pvForm(p); if(f.k==='cold'){ add('cold',p.id,`${p.name}이(가) ${f.t}입니다.`,op('cold',p)); break; } }
    for(const p of d.sp){ const f=pvForm(p); if(f.k==='cold'){ add('coldP',p.id,`선발 ${p.name}이(가) ${f.t}입니다.`,op('coldP',p)); break; } }
    for(const p of (d.bench||[])){ const f=pvForm(p); if(f.k==='hot'){ add('benchHot',p.id,`벤치에 있는 ${p.name}이(가) ${f.t}입니다. 나갈 때마다 칩니다.`,op('benchHot',p)); break; } }
    const pn=(d.pen||[]).slice(0,6), pen=pn.filter(p=>tiRecentPen(p)>=3), tir=pn.filter(p=>!pen.includes(p)&&(p.fat||0)>=60);
    if(pen.length)add('pen',pen.map(p=>p.id).join(','),`불펜 ${pen.slice(0,2).map(p=>p.name).join(', ')}이(가) 최근 나흘 동안 세 번 이상 던졌습니다.`,op('pen')); else if(tir.length)add('pen',tir.map(p=>p.id).join(','),`불펜 ${tir.slice(0,2).map(p=>p.name).join(', ')}이(가) 많이 지쳐 있습니다.`,op('pen'));
    const opp=tiNextOpp(); const tl=opp!=null&&G.sea&&G.sea.tl?(G.sea.tl[opp]||[]).slice(-10):[]; if(tl.length>=10){ const w=tl.filter(x=>x[0]>0).length, l=tl.filter(x=>x[0]<0).length;
      if(w>=7)add('opp',opp,`다음 상대 ${tshort(opp)}은(는) 최근 10경기 ${w}승 ${l}패입니다.`,cold?'':'타선이 올라온 팀이라 선발 싸움이 중요합니다.'); else if(w<=3)add('opp',opp,`다음 상대 ${tshort(opp)}은(는) 최근 10경기 ${w}승 ${l}패입니다.`,cold?'':'흐름이 안 좋은 팀입니다. 이럴 때 확실히 잡아야죠.'); }
    const back=P.filter(p=>p.injOut>0&&p.injOut<=5&&ovr(p)>=48).sort((a,b)=>ovr(b)-ovr(a))[0]; if(back)add('back',back.id,`${back.name}이(가) 며칠 안에 돌아옵니다.`,cold?'':'돌아오면 바로 쓸지, 2군에서 한두 경기 보고 올릴지 정해야 합니다.');
    const low=P.filter(p=>(p.mor??60)<35&&!(p.injOut>0)).sort((a,b)=>(a.mor??60)-(b.mor??60))[0]; if(low)add('mood',low.id,mgrKnow(m,low)<.45?`${low.name}이(가) 요즘 좀 처져 보이는데, 이유는 잘 모르겠습니다.`:`${low.name}이(가) 요즘 많이 처져 있습니다.`,cold?'':'단장님이 한번 면담해 주시죠.'); }
  if(entryOn()){ const fut=P.filter(p=>!p.e1&&(typeof canUp!=='function'||canUp(p))).map(p=>({p,h:seasonTotal(p,G.year,'퓨처스')})).filter(x=>x.h&&(x.p.isP?x.h.outs>=60&&pRate(x.h).era<=3.2:x.h.pa>=60&&bRate(x.h).ops>=.88))
      .sort((a,b)=>(a.p.isP?pRate(a.h).era-3:.9-bRate(a.h).ops)-(b.p.isP?pRate(b.h).era-3:.9-bRate(b.h).ops))[0];
    if(fut){ const q=fut.p, st=q.isP?`퓨처스 평균자책점 ${pRate(fut.h).era.toFixed(2)}`:`퓨처스 OPS ${fmt3(bRate(fut.h).ops)}`; add('callup',q.id,`2군 감독 말로는 ${q.name}(${posLabel(q)}, ${q.age}세)이(가) ${st}로 잘하고 있답니다.`,op('callup')); } }
  try{ const R=slotRanks(G.user); const k=PSLOTS.filter(x=>x!=='DH').sort((x,y)=>R[y].rank-R[x].rank)[0]; if(R[k].rank>=G.teams.length-2)add('hole',k,`솔직히 ${SLOTK[k]}이(가) 제일 걱정입니다. 리그 하위권이에요.`,op('hole')); }catch(e){}
  return out; }
/* 구단주 귀띔 후보 */
function tiOwnFacts(X){ const out=[]; const t=team(G.user); if(!t||t.indie||G.unemp)return out; const s=t.owner; const add=(k,a)=>out.push({k,id:k,t:a});
  try{ if(!ownAskLeft())add('ask','올해 지원 요청은 이미 한 번 들어줬죠. 올해 안에 또 오면 곤란해요.'); else { const o=ownOdds(1000,null); if(o>=.6)add('ask',s==='profit'?'요즘 같으면 운영비 얘기도 들어 볼 만해요. 쓸 데가 분명하다면요.':'요즘 같으면 지원 얘기를 꺼내도 들어 줄 만해요. 꼭 필요한 데라면요.'); else if(o<=.3)add('ask',s==='win'?'지금은 돈 얘기 꺼낼 때가 아니에요. 성적부터 보여 주세요.':s==='profit'?'지금은 지원 얘기는 꺼내지 마세요. 그룹 분위기가 안 좋아요.':'지금은 돈 얘기 꺼낼 때가 아니에요. 여론부터 돌려놓으세요.'); } }catch(e){}
  const room=X&&X.room!=null?X.room:0; if(room<0)add('room','재무팀 보고로는 올해 지출이 목표보다 많아요. 남은 기간엔 아껴 써요.'); else if(room>=3000)add('room','재무팀 말로는 올해 예산에 아직 여유가 있대요. 쓸 데가 분명하면 써도 돼요.');
  try{ const g=goalStatus(); if(g&&g.rank.cur&&(period()==='season'||period()==='post')&&g.rank.t<G.teams.length){ if(g.rank.cur<=g.rank.t)add('goal',`목표가 ${g.rank.t}위였죠. 지금 순위면 그룹에서도 말이 없어요.`); else if(g.rank.cur>=g.rank.t+3)add('goal',`목표가 ${g.rank.t}위였죠. 지금 ${g.rank.cur}위로는 연말 보고 때 할 말이 없어요.`); }
    if(g&&g.youth&&!g.youth.ok&&period()==='season')add('youth','젊은 선수 하나는 1군 주전으로 키워 보라고 했던 것, 잊지 않았죠?'); }catch(e){}
  const pr=G.pr||{fan:50,press:50}; const S=G.spon; const live=S?Object.values(S.c||{}).filter(c=>c&&c.until>=sponSeason()):[];
  if(pr.fan<30&&live.length)add('fan','팬 여론이 이렇게 가라앉으면 스폰서 쪽에서도 말이 나와요. 마케팅팀이 걱정하더군요.'); else if(pr.fan<35)add('fan','팬 게시판 분위기가 험하다고 홍보실이 걱정하더군요.'); else if(pr.fan>=75)add('fan',s==='pr'?'요즘 팬들 반응이 아주 좋대요. 이럴 때 지역 행사도 챙겨요.':'요즘 팬들 반응이 좋다고 홍보실이 그러더군요.');
  if((pr.press??50)<30)add('press','기자들이 요즘 우리 구단을 곱게 안 봐요. 인터뷰 때 말조심해요.');
  if(S){ const off=(S.off||[]).filter(o=>o.exp>=G.day); if(off.length)add('spoff','마케팅팀에 스폰서 제안이 들어와 있다던데, 검토는 했어요?'); const end=live.find(c=>c.until===sponSeason()); if(end&&end.co)add('spend',`${end.co} 후원 계약이 올해로 끝나요. 재계약하려면 성적이나 여론이 받쳐 줘야 해요.`); }
  if(t.trust<35)add('trust','솔직히 요즘 단장에 대한 믿음이 많이 줄었어요. 결과로 바꿔 놓으세요.'); else if(t.trust>=75)add('trust','요즘은 단장한테 맡겨 두면 되겠다 싶어요.');
  return out; }
/* 귀띔 한 줄 고르기: 10일 안에 한 귀띔은 빼고, 날짜·장면·마디로 정한 순서. 고른 것은 기억한다 */
function tiLine(D,st){ try{ const own=D.kind==='own'; const mem=mvMemory(D.mem); const I=mem.info=mem.info||{}; for(const k in I)if(G.day-I[k]>30)delete I[k];
    const L=(own?tiOwnFacts(st&&st.X):tiMgrFacts(D.mem)).filter(x=>!(I[x.id]>G.day-10)&&!(I['k:'+x.k]>G.day-3)); if(!L.length)return '';
    const x=L[Math.floor(u01('ti'+(own?'o':'m')+(st?st.id+':'+st.beat+':'+(st.il||0):''),G.day)*L.length)%L.length]; I[x.id]=G.day; I['k:'+x.k]=G.day; return x.t; }catch(e){ return ''; } }
/* 구단주 첫인사: 신뢰 구간마다 몇 가지(해요체) */
const TI_OWN_HI=[[70,['단장, 잘 왔어요. 요즘 분위기가 좋더군요. 앉으세요.','어서 와요. 요즘 표정이 밝아 보이네요.','왔어요? 차 한잔 내오라고 할게요.']],[45,['앉으세요. 무슨 일로 왔어요?','어서 와요. 할 얘기가 있나 보군요.','바쁜 데 왔네요. 앉아요.']],[25,['바쁘니 용건만 간단히 합시다.','무슨 일이에요? 짧게 해요.']],[-1,['...할 말이 있으면 해 보세요. 내 인내심도 한계가 있어요.','...앉으세요. 좋은 얘기는 아니겠죠.']]];
function tiOwnGreet(tr){ const L=TI_OWN_HI.find(x=>tr>=x[0])[1]; return L[Math.floor(u01('tiohi'+G.user,G.day)*L.length)%L.length]; }
