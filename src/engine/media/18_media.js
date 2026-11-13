/* ===== 언론·여론·구단주 압박 =====
 팬 여론(fan)과 언론 논조(press)는 0~100. 기사 하나하나가 두 지수를 움직이고, 지수는 관중·광고 수입과 구단주 평가로 이어진다. */
const OUTLETS=['스포츠한빛','데일리 베이스볼','야구일보','더그아웃 매거진','팬 커뮤니티'];
function prInit(){ if(!G.pr)G.pr={fan:55,press:50,hist:[]}; if(!G.news)G.news=[]; if(!G.ownerLog)G.ownerLog=[]; }
function news(kind,title,body,tone,o){ if(G._away)return null; /* 떠난 구단 대리 처리 중(fanAway) */ prInit(); o=o||{};
  const outlet=o.outlet||(kind==='팬'?'팬 커뮤니티':outletPick(title)); /* 영향력이 큰 매체가 더 자주 쓴다 */
  if((G.news||[]).some(x=>x.t===title&&G.day-x.d<30))return null; /* 같은 제목 기사는 한 달 안에 다시 내지 않는다 */
  const it={d:G.day,o:outlet,t:title,b:body,v:tone,k:kind,ref:o.ref??null,id:(G.newsSeq=(G.newsSeq||0)+1)};
  try{ const ut=tshort(G.user); if(o.tid!=null&&o.tid!==G.user)it.oth=true; else if(!title.includes(ut)&&!title.includes(team(G.user).nick)&&G.teams.some(x=>x.id!==G.user&&title.includes(tshort(x.id))))it.oth=true; }catch(e){} /* 다른 구단 기사: 우리 구단 기사 묶음에서 뺀다 */
  /* 기사 댓글은 발행 당시 주체·본문에 고정한다. 현재 단장/선수/리그 상태로 재해석하지 않는다. */
  if(o.tid!=null)it.tid=o.tid; const fc=newsContext(it,true); it.tid=fc.tid; it.fanCtx={...fc,source:newsContextStamp(it)}; if(it.tid!=null)it.oth=it.tid!==G.user;
  if(o.img)it.img=o.img; /* 기사 사진 대신 그림(예: 트럭 시위 LED 전광판) */
  if(o.by)it.by=o.by; else { const rp0=kind==='팬'?null:outletRep(outlet); if(rp0)it.by=rp0.name; }
  G.news.unshift(it); if(G.news.length>80)G.news.length=80;
  const om=kind==='팬'?1:outletMul(outlet,tone); /* 비판 매체는 나쁜 소식을, 우호 매체는 좋은 소식을 키운다. 영향력이 클수록 크게 */
  if(!it.oth){ G.pr.press=clamp(G.pr.press+tone*1.7*om,0,100); G.pr.fan=clamp(G.pr.fan+tone*(o.fanW??1)*om,0,100); } /* 다른 구단 기사는 우리 여론을 바꾸지 않는다 */
  if(o.mail)mail('홍보팀',`[${outlet}] ${title}`,`${body}\n\n홍보팀 의견: ${tone>=2?'구단에 우호적인 기사입니다. 팬 반응도 좋습니다.':tone<=-2?'부정적인 기사입니다. 여론이 나빠지고 구단주실도 이 기사를 봤을 것입니다.':'참고하실 기사입니다.'}`,{kind:'언론',ref:o.ref??null});
  return it; }
function prDaily(won,lost){ prInit(); const P=G.pr;
  if(won)P.fan=clamp(P.fan+.32,0,100); if(lost)P.fan=clamp(P.fan-.32,0,100);
  P.press+=(50-P.press)*.012; P.fan+=(50+(team(G.user).pop-1)*30-P.fan)*.004; }
function prAfterGame(rec){ prInit(); const S=G.sea; const won=rec.res==='승', lost=rec.res==='패'; try{ ivNewsAfterGame(rec); }catch(e){}
  prDaily(won,lost);
  const reg=period()==='season'; if(reg)S.streak=won?(S.streak>0?S.streak+1:1):lost?(S.streak<0?S.streak-1:-1):0; /* 포스트시즌은 정규시즌 연승·연패에 잇지 않는다 */
  const st=reg?S.streak:0, nm=tshort(G.user);
  if(st===8)try{ ivRequest('streak_win',{n:8}); }catch(e){}
  if(st===5||st===8||st===12)news('경기',`${nm}, ${st}연승 질주`,`${tname(G.user)}이(가) ${st}연승을 달렸습니다. 마운드와 타선이 고르게 터지면서 분위기가 살아났다는 평가입니다.`,st>=8?3:2);
  if(st===-5||st===-8||st===-12){ const n=-st; const T=[[`${nm} ${n}연패 수렁… 프런트 책임론`,`전력 보강 실패와 운영 방향을 두고 프런트를 향한 비판이 나오고 있습니다.`],[`${nm}, 끝 모를 ${n}연패`,`타선 침묵과 마운드 붕괴가 겹쳤습니다. 분위기 반전 카드가 필요하다는 목소리가 큽니다.`],[`${n}연패 ${nm}, 해법이 안 보인다`,`벤치와 프런트 모두 답을 찾지 못하고 있습니다. 팬들의 인내심도 바닥나고 있습니다.`],[`${nm} 또 졌다… ${n}연패`,`경기력 기복이 심합니다. 선수단 구성을 다시 봐야 한다는 지적이 나옵니다.`]];
    const k=Math.floor(u01('ls'+G.year,G.day)*T.length); news('경기',T[k][0],`${tname(G.user)}이(가) ${n}연패에 빠졌습니다. ${T[k][1]}`,n>=8?-3:-2); }
  const ms=rec.home===G.user?rec.hs-rec.as:rec.as-rec.hs; if(Math.abs(ms)>=10&&R()<.6)news('경기',ms>0?`${nm} 타선 대폭발, ${Math.abs(ms)}점 차 대승`:`${nm} 마운드 붕괴, ${Math.abs(ms)}점 차 대패`,ms>0?`${tname(G.user)}이(가) 상대 마운드를 두들기며 크게 이겼습니다.`:`${tname(G.user)} 마운드가 무너지며 크게 졌습니다. 투수진 운용에 물음표가 붙었습니다.`,ms>0?1:-1);
  if(period()==='season'&&G.day>dnum(G.year,6,1)){ const rk=standingsNow().findIndex(x=>x.tid===G.user)+1; const inn=rk<=5; if(S.inPS!=null&&inn!==S.inPS&&G.day-(S.psNewsDay||0)>=12&&(S.psNewsDay=G.day))news('분석',inn?`${nm}, 5위권 진입… 가을야구 보인다`:`${nm}, 5위권 밖으로 밀려나`,inn?`${tname(G.user)}이(가) ${rk}위로 올라서며 포스트시즌 진출권에 들어왔습니다.`:`${tname(G.user)}이(가) ${rk}위로 내려앉았습니다. 가을야구 경쟁이 험난해졌습니다.`,inn?2:-2); S.inPS=inn; }
  if(/한국시리즈/.test(rec.kind||'')&&won&&G.ps&&G.ps.done&&G.ps.res.ks&&G.ps.res.ks[0]===G.user)news('경기',`${nm} 한국시리즈 우승`,`${tname(G.user)}이(가) 한국시리즈 정상에 올랐습니다. 단장의 선수단 구성이 결실을 맺었다는 평가가 나옵니다.`,4,{fanW:3});
}
function prMonth(m){ prInit(); if(G.unemp)return; const st=standingsNow(); const rk=tieRank(st,G.user); const g=G.goals; const nm=tshort(G.user);
  G.pr.hist.push({m:`${G.year}.${m}`,fan:Math.round(G.pr.fan),press:Math.round(G.pr.press)}); if(G.pr.hist.length>24)G.pr.hist.shift();
  if(g&&rk<=g.rank-2)news('분석',`${m}월 결산: ${nm}, 예상 밖 선전`,`시즌 전 예상보다 높은 ${rk}위를 달리고 있습니다. 프런트의 겨울 준비가 통했다는 분석입니다.`,2);
  else if(g&&rk>=g.rank+3)news('분석',`${m}월 결산: ${nm}, 목표와 거리 멀어져`,`구단 목표였던 ${g.rank}위 이내와 달리 ${rk}위에 머물고 있습니다. 반등 카드가 필요하다는 지적입니다.`,-2);
  // 젊은 선수 활약
  const y=domestic(G.user).filter(p=>p.age<=23).map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h&&((!x.p.isP&&x.h.pa>=60&&bRate(x.h).ops>=.85)||(x.p.isP&&x.h.outs>=60&&pRate(x.h).era<=3.2)))[0];
  if(y&&!(G.sea.youthNews||[]).includes(y.p.id)){ (G.sea.youthNews=G.sea.youthNews||[]).push(y.p.id); news('선수',`${nm}의 새 얼굴 ${y.p.name}`,`${y.p.age}세 ${y.p.name}이(가) ${statLine(y.h,y.p)}(으)로 활약 중입니다. 구단 육성의 성과라는 평가입니다.`,2,{ref:y.p.id,fanW:1.5}); }
  // 외국인 부진
  for(const p of foreignOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); if(!h)continue; const bad=p.isP?(h.outs>=90&&pRate(h).era>=6):(h.pa>=120&&bRate(h).ops<.66);
    if(bad&&!(G.sea.fbad||[]).includes(p.id)){ (G.sea.fbad=G.sea.fbad||[]).push(p.id); news('선수',`${nm} 외국인 ${p.name}, 계속되는 부진`,`${p.name}이(가) ${statLine(h,p)}에 그치고 있습니다. ${fReplLeft(G.user,p.foreign)>0&&G.day<=foreignDL()?'교체 여부를 두고 프런트의 결단이 필요하다는 목소리가 큽니다.':'교체 카드를 모두 써서 남은 시즌을 함께 갈 수밖에 없습니다. 반등이 절실합니다.'}`,-2,{ref:p.id}); } }
  // 육성 기조와 성적
  if(G.policy&&G.policy.k==='youth'&&rk>=8)news('분석',`'육성'이냐 '포기'냐… ${nm} 리빌딩 논란`,`하위권에서 유망주 기용을 늘리는 ${nm}의 운영을 두고 팬들 사이에서 의견이 갈립니다.`,-1,{fanW:1.5});
  // 이달의 선수
  const best=domestic(G.user).concat(foreignOf(G.user)).map(p=>{ const L=p.l10||[]; return {p,v:(seasonTotal(p,G.year,'1군')?warOf(seasonTotal(p,G.year,'1군'),p):0)}; }).sort((a,b)=>b.v-a.v)[0];
  if(best&&best.v>=1.2&&R()<.6){ const h=seasonTotal(best.p,G.year,'1군'); news('선수',`${nm}의 기둥 ${best.p.name}`,`${best.p.name}이(가) ${statLine(h,best.p)}(으)로 팀을 이끌고 있습니다.`,1,{ref:best.p.id}); }
  // 티켓 가격과 구장 관중
  { const S=stadOf(G.user); const pf=PRICE[S.price].fan+(stadPower(S.lv.seat)-2)*.25; if(pf)G.pr.fan=clamp(G.pr.fan+pf*2,0,100); const A=G.sea.att&&G.sea.att[G.user];
    if(A&&A.n>=8){ const occ=A.sum/(A.cap||A.n*stadCap(G.user)); if(occ>=.95&&R()<.5)news('구단',`${nm} 홈경기 표 구하기 전쟁`,`${stadName(G.user)} 좌석 점유율이 ${Math.round(occ*100)}%입니다. 올해 매진 ${A.so}회.`,1); else if(occ<.6&&R()<.5)news('구단',`${nm} 홈 관중석 썰렁`,`${stadName(G.user)} 경기당 평균 ${Math.round(A.sum/A.n).toLocaleString('ko-KR')}명으로 좌석 점유율 ${Math.round(occ*100)}%에 그쳤습니다.`,-1); } }
  ownerMonth(m,rk); try{ staffReport(`${m}월`); }catch(err){}
}
function prTrade(give,get,partner){ prInit(); const v=ids=>sum(ids.map(id=>{const p=G.players[id]; if(!p)return 0; const h=seasonTotal(p,G.year,'1군')||seasonTotal(p,G.year-1,'1군'); return h?Math.max(-1,warOf(h,p)):0;}));
  const d=v(get)-v(give); const gn=give.map(id=>G.players[id]&&G.players[id].name).filter(Boolean).join(', '), tn=get.map(id=>G.players[id]&&G.players[id].name).filter(Boolean).join(', ');
  const tone=d>=2?2:d>=.7?1:d<=-2?-2:d<=-.7?-1:0;
  news('트레이드',tone>=1?`${meCall()}, 트레이드로 전력 보강`:tone<=-1?`${meCall()}의 트레이드에 물음표`:`${tshort(G.user)}-${tshort(partner)} 트레이드 단행`,
    `${tname(G.user)}이(가) ${tname(partner)}와(과) 트레이드했습니다. ${gn||'없음'}을(를) 보내고 ${tn||'없음'}을(를) 받았습니다. ${tone>=1?'당장 전력에 도움이 되는 거래라는 평가입니다.':tone<=-1?'기록상으로는 손해라는 시각이 많습니다. 숨은 의도가 있는지 지켜봐야 합니다.':'득실은 시간이 지나야 알 수 있다는 평가입니다.'}`,tone,{mail:true});
}
function prFA(rec){ if(rec.to!==G.user||rec.from===G.user)return; const big=rec.annual>=1500; news('FA',`${tshort(G.user)}, FA ${rec.name} 영입`,`${tname(G.user)}이(가) FA ${rec.name}와(과) ${rec.years}년 연 ${money(rec.annual)}에 계약했습니다.${big?' 대형 계약으로 팬들의 기대가 큽니다.':''}`,big?3:1,{fanW:big?2:1}); }
function prLeak(kind,p,txt){ news('선수',kind==='mgr'?`${txt}`:`${tshort(G.user)} ${p.name}, 출전 기회 불만 토로`,kind==='mgr'?`감독과 프런트 사이 엇박자가 감지됩니다. 구단 내부 소통에 문제가 있다는 지적입니다.`:`${p.name}이(가) 측근을 통해 지금 처지에 불만을 드러냈다는 소식입니다. 구단 분위기가 흔들릴 수 있다는 우려가 나옵니다.`,-2,{ref:p?p.id:null}); }
/* 구단주: 시즌 목표와 월간 평가 */
/* 구단주의 시즌 순위 목표: 예상 순위에서 성적 우선은 한 계단 위(최대 5위), 수익 우선은 한 계단 아래, 홍보 우선은 그대로. 다른 구단 보기에도 같은 기준 */
function goalRankOf(tid){ const ow=team(tid).owner; const proj=G.proj?G.proj.indexOf(tid)+1:5; return ow==='win'?Math.max(1,Math.min(5,proj-1)):ow==='profit'?Math.min(8,proj+1):Math.min(7,proj); }
/* 시범경기 시작 날 구단주가 올 시즌 목표를 먼저 제시한다(커뮤니티 11-12: 개막일에 정해져 준비할 시간이 없었다). 그때 전력으로 예상 순위를 매기고, 개막 전까지 순위 목표를 한 번 상의할 수 있다 */
function goalsPreseason(){ if(G.unemp||G.user==null)return; if(G.goals&&G.goals.y===G.year)return; G.proj=G.teams.map(x=>({id:x.id,r:projRating(x.id)+hn('proj'+G.year,x.id)*.7})).sort((p,q)=>q.r-p.r).map(x=>x.id); setGoals('시범경기를 앞두고 구단주께서 올 시즌 목표를 먼저 제시하셨습니다.',false,true); }
/* 목표 상의: ok 수락, up 한 계단 높여 제안, down 한 계단 낮춰 요청. 한 해 한 번, 개막 전까지. 하향 수락 여부는 그해·구단으로 고정(다시 불러와도 같은 답) */
function goalTalk(k){ const g=G.goals, t=team(G.user); if(!g||g.y!==G.year||!g.pre)return '지금은 목표를 상의할 수 없습니다.'; if(g.talk)return '올해 목표는 이미 구단주와 상의를 마쳤습니다.'; if(period()!=='pre')return '개막 뒤에는 목표를 바꿀 수 없습니다.';
  if(k==='ok'){ g.talk='ok'; return `구단주 목표(${g.rank}위 이내)를 그대로 받아들였습니다.`; }
  if(k==='up'){ if(g.rank<=1)return '이미 1위 목표입니다.'; g.rank--; g.talk='up'; t.trust=clamp((t.trust??55)+2,0,100); return `순위 목표를 ${g.rank}위 이내로 높여 제안했습니다. 구단주가 의욕을 높이 삽니다(신뢰 +2). 대신 그만큼 평가 기준이 올라갑니다.`; }
  if(k==='down'){ if(g.rank>=8)return '더 낮출 수 없습니다.'; g.talk='down'; const p=clamp(.35+((t.trust??55)-50)/100+((G.rep??50)-50)/200,.15,.85); if(u01('goalTalk'+G.year,G.user)<p){ g.rank++; t.trust=clamp((t.trust??55)-1,0,100); return `구단주가 받아들였습니다. 순위 목표 ${g.rank}위 이내(신뢰 -1).`; } t.trust=clamp((t.trust??55)-2,0,100); return `구단주가 "${g.rank}위는 해야 합니다"라며 받아들이지 않았습니다(신뢰 -2).`; }
  return ''; }
function setGoals(intro,first,pre){ prInit(); delete G.bLock; if(G.bLocks)delete G.bLocks[G.user]; /* 목표가 정해지면 시즌 예산을 다시 확정한다 */ const t=team(G.user); const proj=G.proj?G.proj.indexOf(G.user)+1:5; const ow=t.owner;
  /* 창단 첫해는 구단주도 기대를 낮춘다: 예상 순위 기준으로 성적 우선 그대로, 홍보 우선 1계단 아래, 수익 우선 2계단 아래(최대 8위) */
  const rank=first?Math.min(8,ow==='win'?proj:ow==='profit'?proj+2:proj+1):goalRankOf(G.user);
  const base=projSupport(); const sup=G.supPlan&&G.supPlan.y===G.year?Math.round(G.supPlan.gf*100)/100:Math.round(clamp(base*(ow==='profit'?.85:ow==='pr'?1:1.15)+.05,.2,1)*100)/100; /* 1월에 정한 지원 목표를 그대로 쓴다 */ const fan=ow==='pr'?60:ow==='win'?45:50;
  const youth=t.mode==='rebuild'||ow==='profit'?1:0;
  G.goals={y:G.year,owner:ow,rank,sup,fan,youth,v:2,...(first?{fd:true}:{}),...(pre?{pre:true}:{})}; /* 첫해 표시를 목표와 함께 저장(월간 평가 완화, 검수 11-09zzd) */
  /* FA 영입 자금을 받으며 약속한 목표가 있으면 올 시즌 목표에 얹는다 */
  { const P=(G.pitchCommit||[]).filter(c=>c.y===G.year); for(const c of P){ if(c.k==='rank')G.goals.rank=Math.max(1,G.goals.rank-c.v); if(c.k==='fan')G.goals.fan=Math.min(80,G.goals.fan+c.v); if(c.k==='sup')G.goals.sup=Math.max(.1,Math.round((G.goals.sup-c.v)*100)/100); } if(P.length)G.goals.pitch=P.map(c=>c.l); } { const LK=G.bLocks&&G.bLocks[G.user]; if(LK&&LK.fy===G.year)LK.gf=G.goals.sup; } /* 확정 예산 기준은 목표를 정하기 전에(projSupport) 잡히므로, 정한 목표(재정 약속 포함)로 맞춘다(예산 화면·여유가 구단주 메일과 같게, 검수 11-08·11-09x) */
  const lines=[`정규시즌 ${G.goals.rank}위 이내`,t.indie?'시즌 수지 적자 없이(독립구단: 모기업 보전 없음)':`모기업 적자 보전을 한도의 ${Math.round(G.goals.sup*100)}% 이하로`,`팬 여론 ${G.goals.fan} 이상 유지`]; if(G.goals.pitch)lines.push(`(FA 영입 때 약속: ${G.goals.pitch.join(', ')})`); if(youth)lines.push('24세 이하 선수 1명 이상을 1군 주전급(규정 타석 절반 또는 80이닝)으로');
  mail('구단주실',`${G.year} 시즌 구단 목표`,`${intro?intro+'\n\n':''}구단주께서 올 시즌 목표를 정하셨습니다.\n\n${lines.map((l,i)=>`${i+1}. ${l}`).join('\n')}\n\n전력분석팀 예상 순위는 ${proj}위입니다(시즌 전 발표 기준. 홈 화면 예상 순위는 지금 전력으로 다시 계산해 다를 수 있습니다). ${OWNER[ow].msg} 매달 말 구단주께서 진행 상황을 보고받으십니다.${G.goals.pre?`\n\n개막(${dmd(G.cal.open)}) 전까지 순위 목표를 한 번 상의할 수 있습니다. 높여 제안하면 구단주가 의욕을 높이 사고(신뢰 +2), 낮춰 요청하면 구단주 신뢰·단장 명성에 따라 받아들이거나 거절합니다.`:''}`,{imp:true,kind:'구단주',acts:[...(G.goals.pre&&!G.goals.talk?[{l:'그대로 수락',a:'goalTalk',v:'ok'},{l:`한 계단 높여 제안(${Math.max(1,G.goals.rank-1)}위)`,a:'goalTalk',v:'up'},...(G.goals.rank<8?[{l:`한 계단 낮춰 요청(${G.goals.rank+1}위)`,a:'goalTalk',v:'down'}]:[])]:[]),{l:'목표 보기',a:'go',v:'club:owner'}]});
}
function goalStatus(){ const g=G.goals; if(!g||g.y!==G.year)return null; const t=team(G.user); const per=period();
  const rk=per==='season'||per==='post'?rankOf(G.user)||null:(G.last&&G.last.y===G.year&&G.last.order?G.last.order.findIndex(o=>o.tid===G.user)+1||null:null); /* 시즌이 끝난 뒤에는 최종 순위 */
  const proj=projSupport(); const yc=Object.values(G.players).filter(p=>!p.foreign&&p.age<=24&&(p.hist||[]).some(h=>h.y===G.year&&h.t===G.user)).filter(p=>{ const h=seasonTotalT(p,G.year,'1군',G.user); /* 우리 팀에서 쌓은 기록: 트레이드로 떠나도 달성은 남는다(검수 11-06) */ return h&&(p.isP?h.outs>=240:h.pa>=223); }).length+Object.values(G.arch||{}).filter(a=>a&&!G.players[a.id]&&!a.foreign&&a.age<=24&&a.y===G.year).filter(a=>{ const R=(a.rows||[]).filter(r=>r.y===G.year&&r.t===G.user), s=k=>sum(R.map(r=>r[k]||0)); return a.isP?s('outs')>=240:s('pa')>=223; }).length; /* 올해 은퇴해 보관된 선수도 우리 팀 기록으로 센다(검수 11-09zzd) */
  return {rank:{t:g.rank,cur:rk,ok:rk!=null&&rk<=g.rank},sup:{t:g.sup,cur:proj,ok:proj<=g.sup},fan:{t:g.fan,cur:Math.round(G.pr.fan),ok:Math.round(G.pr.fan)>=g.fan} /* 화면에 보이는 정수와 같은 기준 */,youth:g.youth?{t:1,cur:yc,ok:yc>=1}:null}; }
