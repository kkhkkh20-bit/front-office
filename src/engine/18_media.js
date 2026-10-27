/* ===== 언론·여론·구단주 압박 =====
 팬 여론(fan)과 언론 논조(press)는 0~100. 기사 하나하나가 두 지수를 움직이고, 지수는 관중·광고 수입과 구단주 평가로 이어진다. */
const OUTLETS=['스포츠한빛','데일리 베이스볼','야구일보','더그아웃 매거진','팬 커뮤니티'];
function prInit(){ if(!G.pr)G.pr={fan:55,press:50,hist:[]}; if(!G.news)G.news=[]; if(!G.ownerLog)G.ownerLog=[]; }
function news(kind,title,body,tone,o){ prInit(); o=o||{};
  const outlet=o.outlet||(kind==='팬'?'팬 커뮤니티':OUTLETS[Math.floor(u01('out'+title,G.day)*4)]);
  if((G.news||[]).some(x=>x.t===title&&G.day-x.d<30))return null; /* 같은 제목 기사는 한 달 안에 다시 내지 않는다 */
  const it={d:G.day,o:outlet,t:title,b:body,v:tone,k:kind,ref:o.ref??null,id:(G.newsSeq=(G.newsSeq||0)+1)};
  G.news.unshift(it); if(G.news.length>80)G.news.length=80;
  G.pr.press=clamp(G.pr.press+tone*1.7,0,100); G.pr.fan=clamp(G.pr.fan+tone*(o.fanW??1),0,100);
  if(o.mail)mail('홍보팀',`[${outlet}] ${title}`,`${body}\n\n홍보팀 의견: ${tone>=2?'구단에 우호적인 기사입니다. 팬 반응도 좋습니다.':tone<=-2?'부정적인 기사입니다. 여론이 나빠지고 구단주실도 이 기사를 봤을 것입니다.':'참고하실 기사입니다.'}`,{kind:'언론',ref:o.ref??null});
  return it; }
function prDaily(won,lost){ prInit(); const P=G.pr;
  if(won)P.fan=clamp(P.fan+.32,0,100); if(lost)P.fan=clamp(P.fan-.32,0,100);
  P.press+=(50-P.press)*.012; P.fan+=(50+(team(G.user).pop-1)*30-P.fan)*.004; }
function prAfterGame(rec){ prInit(); const S=G.sea; const won=rec.res==='승', lost=rec.res==='패';
  prDaily(won,lost);
  S.streak=won?(S.streak>0?S.streak+1:1):lost?(S.streak<0?S.streak-1:-1):0;
  const st=S.streak, nm=tshort(G.user);
  if(st===5||st===8||st===12)news('경기',`${nm}, ${st}연승 질주`,`${tname(G.user)}이(가) ${st}연승을 달렸습니다. 마운드와 타선이 고르게 터지면서 분위기가 살아났다는 평가입니다.`,st>=8?3:2);
  if(st===-5||st===-8||st===-12){ const n=-st; const T=[[`${nm} ${n}연패 수렁… 프런트 책임론`,`전력 보강 실패와 운영 방향을 두고 프런트를 향한 비판이 나오고 있습니다.`],[`${nm}, 끝 모를 ${n}연패`,`타선 침묵과 마운드 붕괴가 겹쳤습니다. 분위기 반전 카드가 필요하다는 목소리가 큽니다.`],[`${n}연패 ${nm}, 해법이 안 보인다`,`벤치와 프런트 모두 답을 찾지 못하고 있습니다. 팬들의 인내심도 바닥나고 있습니다.`],[`${nm} 또 졌다… ${n}연패`,`경기력 기복이 심합니다. 선수단 구성을 다시 봐야 한다는 지적이 나옵니다.`]];
    const k=Math.floor(u01('ls'+G.year,G.day)*T.length); news('경기',T[k][0],`${tname(G.user)}이(가) ${n}연패에 빠졌습니다. ${T[k][1]}`,n>=8?-3:-2); }
  const ms=rec.home===G.user?rec.hs-rec.as:rec.as-rec.hs; if(Math.abs(ms)>=10&&R()<.6)news('경기',ms>0?`${nm} 타선 대폭발, ${Math.abs(ms)}점 차 대승`:`${nm} 마운드 붕괴, ${Math.abs(ms)}점 차 대패`,ms>0?`${tname(G.user)}이(가) 상대 마운드를 두들기며 크게 이겼습니다.`:`${tname(G.user)} 마운드가 무너지며 크게 졌습니다. 투수진 운용에 물음표가 붙었습니다.`,ms>0?1:-1);
  if(period()==='season'&&G.day>dnum(G.year,6,1)){ const rk=standingsNow().findIndex(x=>x.tid===G.user)+1; const inn=rk<=5; if(S.inPS!=null&&inn!==S.inPS&&G.day-(S.psNewsDay||0)>=12&&(S.psNewsDay=G.day))news('분석',inn?`${nm}, 5위권 진입… 가을야구 보인다`:`${nm}, 5위권 밖으로 밀려나`,inn?`${tname(G.user)}이(가) ${rk}위로 올라서며 포스트시즌 진출권에 들어왔습니다.`:`${tname(G.user)}이(가) ${rk}위로 내려앉았습니다. 가을야구 경쟁이 험난해졌습니다.`,inn?2:-2); S.inPS=inn; }
  if(/한국시리즈/.test(rec.kind||'')&&won&&G.ps&&G.ps.done&&G.ps.res.ks&&G.ps.res.ks[0]===G.user)news('경기',`${nm} 한국시리즈 우승`,`${tname(G.user)}이(가) 한국시리즈 정상에 올랐습니다. 단장의 선수단 구성이 결실을 맺었다는 평가가 나옵니다.`,4,{fanW:3});
}
function prMonth(m){ prInit(); if(G.unemp)return; const st=standingsNow(); const rk=st.findIndex(x=>x.tid===G.user)+1; const g=G.goals; const nm=tshort(G.user);
  G.pr.hist.push({m:`${G.year}.${m}`,fan:Math.round(G.pr.fan),press:Math.round(G.pr.press)}); if(G.pr.hist.length>24)G.pr.hist.shift();
  if(g&&rk<=g.rank-2)news('분석',`${m}월 결산: ${nm}, 예상 밖 선전`,`시즌 전 예상보다 높은 ${rk}위를 달리고 있습니다. 프런트의 겨울 준비가 통했다는 분석입니다.`,2);
  else if(g&&rk>=g.rank+3)news('분석',`${m}월 결산: ${nm}, 목표와 거리 멀어져`,`구단 목표였던 ${g.rank}위 이내와 달리 ${rk}위에 머물고 있습니다. 반등 카드가 필요하다는 지적입니다.`,-2);
  // 젊은 선수 활약
  const y=domestic(G.user).filter(p=>p.age<=23).map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h&&((!x.p.isP&&x.h.pa>=60&&bRate(x.h).ops>=.85)||(x.p.isP&&x.h.outs>=60&&pRate(x.h).era<=3.2)))[0];
  if(y&&!(G.sea.youthNews||[]).includes(y.p.id)){ (G.sea.youthNews=G.sea.youthNews||[]).push(y.p.id); news('선수',`${nm}의 새 얼굴 ${y.p.name}`,`${y.p.age}세 ${y.p.name}이(가) ${statLine(y.h,y.p)}(으)로 활약 중입니다. 구단 육성의 성과라는 평가입니다.`,2,{ref:y.p.id,fanW:1.5}); }
  // 외국인 부진
  for(const p of foreignOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); if(!h)continue; const bad=p.isP?(h.outs>=90&&pRate(h).era>=6):(h.pa>=120&&bRate(h).ops<.66);
    if(bad&&!(G.sea.fbad||[]).includes(p.id)){ (G.sea.fbad=G.sea.fbad||[]).push(p.id); news('선수',`${nm} 외국인 ${p.name}, 계속되는 부진`,`${p.name}이(가) ${statLine(h,p)}에 그치고 있습니다. 교체 여부를 두고 프런트의 결단이 필요하다는 목소리가 큽니다.`,-2,{ref:p.id}); } }
  // 육성 기조와 성적
  if(G.policy&&G.policy.k==='youth'&&rk>=8)news('분석',`'육성'이냐 '포기'냐… ${nm} 리빌딩 논란`,`하위권에서 유망주 기용을 늘리는 ${nm}의 운영을 두고 팬들 사이에서 의견이 갈립니다.`,-1,{fanW:1.5});
  // 이달의 선수
  const best=domestic(G.user).concat(foreignOf(G.user)).map(p=>{ const L=p.l10||[]; return {p,v:(seasonTotal(p,G.year,'1군')?warOf(seasonTotal(p,G.year,'1군'),p):0)}; }).sort((a,b)=>b.v-a.v)[0];
  if(best&&best.v>=1.2&&R()<.6){ const h=seasonTotal(best.p,G.year,'1군'); news('선수',`${nm}의 기둥 ${best.p.name}`,`${best.p.name}이(가) ${statLine(h,best.p)}(으)로 팀을 이끌고 있습니다.`,1,{ref:best.p.id}); }
  // 티켓 가격과 구장 관중
  { const S=stadOf(G.user); const pf=PRICE[S.price].fan+(S.lv.seat-2)*.25; if(pf)G.pr.fan=clamp(G.pr.fan+pf*2,0,100); const A=G.sea.att&&G.sea.att[G.user];
    if(A&&A.n>=8){ const occ=A.sum/A.n/stadCap(G.user); if(occ>=.95&&R()<.5)news('구단',`${nm} 홈경기 표 구하기 전쟁`,`${stadName(G.user)} 좌석 점유율이 ${Math.round(occ*100)}%입니다. 올해 매진 ${A.so}회.`,1); else if(occ<.6&&R()<.5)news('구단',`${nm} 홈 관중석 썰렁`,`${stadName(G.user)} 경기당 평균 ${Math.round(A.sum/A.n).toLocaleString('ko-KR')}명으로 좌석 점유율 ${Math.round(occ*100)}%에 그쳤습니다.`,-1); } }
  ownerMonth(m,rk); try{ staffReport(`${m}월`); }catch(err){}
}
function prTrade(give,get,partner){ prInit(); const v=ids=>sum(ids.map(id=>{const p=G.players[id]; if(!p)return 0; const h=seasonTotal(p,G.year,'1군')||seasonTotal(p,G.year-1,'1군'); return h?Math.max(-1,warOf(h,p)):0;}));
  const d=v(get)-v(give); const gn=give.map(id=>G.players[id]&&G.players[id].name).filter(Boolean).join(', '), tn=get.map(id=>G.players[id]&&G.players[id].name).filter(Boolean).join(', ');
  const tone=d>=2?2:d>=.7?1:d<=-2?-2:d<=-.7?-1:0;
  news('트레이드',tone>=1?`${tshort(G.user)}, 트레이드로 전력 보강`:tone<=-1?`${tshort(G.user)} 트레이드에 물음표`:`${tshort(G.user)}-${tshort(partner)} 트레이드 단행`,
    `${tname(G.user)}이(가) ${tname(partner)}와(과) 트레이드했습니다. ${gn||'없음'}을(를) 보내고 ${tn||'없음'}을(를) 받았습니다. ${tone>=1?'당장 전력에 도움이 되는 거래라는 평가입니다.':tone<=-1?'기록상으로는 손해라는 시각이 많습니다. 숨은 의도가 있는지 지켜봐야 합니다.':'득실은 시간이 지나야 알 수 있다는 평가입니다.'}`,tone,{mail:true});
}
function prFA(rec){ if(rec.to!==G.user||rec.from===G.user)return; const big=rec.annual>=1500; news('FA',`${tshort(G.user)}, FA ${rec.name} 영입`,`${tname(G.user)}이(가) FA ${rec.name}와(과) ${rec.years}년 연 ${money(rec.annual)}에 계약했습니다.${big?' 대형 계약으로 팬들의 기대가 큽니다.':''}`,big?3:1,{fanW:big?2:1}); }
function prLeak(kind,p,txt){ news('선수',kind==='mgr'?`${txt}`:`${tshort(G.user)} ${p.name}, 출전 기회 불만 토로`,kind==='mgr'?`감독과 프런트 사이 엇박자가 감지됩니다. 구단 내부 소통에 문제가 있다는 지적입니다.`:`${p.name}이(가) 측근을 통해 현재 상황에 대한 불만을 드러냈다는 소식입니다. 구단 분위기가 흔들릴 수 있다는 우려가 나옵니다.`,-2,{ref:p?p.id:null}); }
/* 구단주: 시즌 목표와 월간 평가 */
function setGoals(intro,first){ prInit(); const t=team(G.user); const proj=G.proj?G.proj.indexOf(G.user)+1:5; const ow=t.owner;
  /* 창단 첫해는 구단주도 기대를 낮춘다: 예상 순위 기준으로 성적 우선 그대로, 홍보 우선 1계단 아래, 수익 우선 2계단 아래(최대 8위) */
  const rank=first?Math.min(8,ow==='win'?proj:ow==='profit'?proj+2:proj+1):ow==='win'?Math.max(1,Math.min(5,proj-1)):ow==='profit'?Math.min(8,proj+1):Math.min(7,proj);
  const base=projSupport(); const sup=G.supPlan&&G.supPlan.y===G.year?Math.round(G.supPlan.gf*100)/100:Math.round(clamp(base*(ow==='profit'?.85:ow==='pr'?1:1.15)+.05,.2,1)*100)/100; /* 1월에 정한 지원 목표를 그대로 쓴다 */ const fan=ow==='pr'?60:ow==='win'?45:50;
  const youth=t.mode==='rebuild'||ow==='profit'?1:0;
  G.goals={y:G.year,rank,sup,fan,youth,v:2};
  const lines=[`정규시즌 ${rank}위 이내`,`모기업 적자 보전을 한도의 ${Math.round(sup*100)}% 이하로`,`팬 여론 ${fan} 이상 유지`]; if(youth)lines.push('24세 이하 선수 1명 이상을 1군 주전급(규정 타석 절반 또는 80이닝)으로');
  mail('구단주실',`${G.year} 시즌 구단 목표`,`${intro?intro+'\n\n':''}구단주께서 올 시즌 목표를 정하셨습니다.\n\n${lines.map((l,i)=>`${i+1}. ${l}`).join('\n')}\n\n전력분석팀 예상 순위는 ${proj}위입니다. ${OWNER[ow].msg} 매달 말 구단주께서 진행 상황을 보고받으십니다.`,{imp:true,kind:'구단주',acts:[{l:'목표 보기',a:'go',v:'club:owner'}]});
}
function goalStatus(){ const g=G.goals; if(!g||g.y!==G.year)return null; const t=team(G.user); const per=period();
  const st=per==='season'||per==='post'?standingsNow():null; const rk=st?st.findIndex(x=>x.tid===G.user)+1:null;
  const proj=projSupport(); const yc=domestic(G.user).filter(p=>p.age<=24).filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?h.outs>=240:h.pa>=223); }).length;
  return {rank:{t:g.rank,cur:rk,ok:rk!=null&&rk<=g.rank},sup:{t:g.sup,cur:proj,ok:proj<=g.sup},fan:{t:g.fan,cur:Math.round(G.pr.fan),ok:G.pr.fan>=g.fan},youth:g.youth?{t:1,cur:yc,ok:yc>=1}:null}; }
