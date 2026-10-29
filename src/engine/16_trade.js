/* ===== 트레이드 ===== */
function aiVal(t,p){
  const o=ovr(p)+hn('o'+t.id,p.id)*3, pt=p.pot+hn('q'+t.id,p.id)*5;
  let eff=p.age<=25?o+Math.max(0,pt-o)*(t.mode==='rebuild'?.75:.5):p.age>=32?o-(p.age-31)*1.3:o;
  let v=Math.pow(Math.max(0,eff-36),1.7)/10;
  v-=(p.sal/100)*(t.owner==='profit'?.45:.3)*(p.faC?Math.max(1,p.yrs)*.6:.6);
  if(milFree(p)&&p.age>=26)v*=.82;
  if(t.mode==='contend'&&p.age>=29)v*=1.1; if(t.mode==='rebuild'&&p.age>=30)v*=.75;
  if(G.cal&&period()==='season'&&G.day>G.cal.open+40){ // 시즌 중: 순위 경쟁 팀은 즉시 전력을 더 원한다
    const st=standingsNow(); const rk=st.findIndex(x=>x.tid===t.id); if(rk<5&&p.age>=27)v*=1.12; if(rk>=7&&p.age>=30)v*=.8; }
  return v;
}
/* ===== 트레이드 가치 (단위: 억 원 상당) =====
 능력(현재·잠재력·나이), 연봉과 남은 계약, 구단 형편(돈·우승 경쟁·리빌딩), 자리 필요도(주전을 내주면 비싸게), 감독 성향, 선수 불만, 컨디션을 함께 본다. */
function condOf(p){ const f=p.sf&&p.sf.y===G.year?p.sf.v*.5+(p.sf.m||0):0; return clamp(Math.round(f*.9+((p.mor??60)-60)/25-(p.fat||0)/40),-5,5); }
function seasonWorth(o){ return Math.pow(Math.max(0,o-40),1.6)/6; }
function projO(p,i){ const o=ovr(p)+(i===0?condOf(p)*.3:0); const a=p.age+i; if(a<=25){ const g=Math.max(0,p.pot-ovr(p)); return o+g*Math.min(1,(i+1)*.28); } if(a>=31)return o-(a-30)*1.3; return o; }
function ctrlYears(p){ if(p.foreign)return 1; if(p.faC)return Math.max(1,p.yrs||1); return clamp(faSvc(p)-(p.svc||0),1,6); }
let _tcC={k:null,m:{}};
function teamCtx(t){ const k=G.year+':'+G.day; if(_tcC.k!==k)_tcC={k,m:{}}; if(_tcC.m[t.id])return _tcC.m[t.id];
  const per=period(); const st=per==='season'&&G.day>G.cal.open+20?standingsNow():null; const rk=st?st.findIndex(x=>x.tid===t.id)+1:null;
  const contend=rk?rk<=4||(t.mode==='contend'&&rk<=6):t.mode==='contend'; const ci=capInfo(t.id);
  const tr=gmTrait(t.id); const money=(t.indie?1.5:t.owner==='profit'?1.25:t.owner==='win'?.85:1)*(ci.over>0?1.25:1)*(contend?.9:1.1)*(tr==='miser'?1.3:tr==='data'?1.15:tr==='gambler'?.9:1);
  const v={contend,money,H:contend?2:4,now:contend?1.15:.8,rk}; _tcC.m[t.id]=v; return v; }
function pSlot(p){ return p.isP?(isSPr(p)?'SP':'RP'):p.pos; }
/* 트레이드 평가 중 상대가 내주는 주전 자리: 같은 자리 선수를 받으면 그 빈자리를 메우므로 '쓸모없는 영입'으로 깎지 않는다 */
let _evOut=null;
function roleFactor(t,p,dir){ const L=leagueSlots()[t.id]; const k=pSlot(p); const sl=L&&L[k]; if(!sl)return 1;
  if(dir==='out'){ const starter=sl.ps.some(q=>q.id===p.id); if(!starter)return 1; return teamCtx(t).contend?1.38:1.22; }
  if(_evOut&&_evOut.has(k))return 1.05;
  const base=k==='SP'?(sl.ps.length<5?30:Math.min(...sl.ps.map(spV))):k==='RP'?(sl.ps.length<4?30:Math.min(...sl.ps.map(penV))):sl.v;
  const up=slotGain(k,p)-base; if(up>0)return 1+Math.min(.35,up/20); return p.age<=23?.85:.6; }
/* 성장 예측은 불확실하다: 지금 능력보다 높게 잡힌 몫은 깎아서 본다(유망주 한 명에 주전을 내주지 않도록).
   보류 기간이 끝난 뒤에도 KBO는 원 소속 구단 잔류가 많아 그 뒤 가치도 일부 인정한다 */
function tval(t,p,dir){ if(!p)return 0; const c=teamCtx(t); const ny=ctrlYears(p); let v=0; const cur=ovr(p);
  for(let i=0;i<c.H;i++){ let o=projO(p,i); if(o>cur)o=cur+(o-cur)*(i===0?.75:i<=1?.55:.45); /* 먼 미래 성장일수록 더 불확실하다 */ const d=Math.pow(.8,i); const w=seasonWorth(o)*(i===0?c.now:1)*d; /* KBO 구단은 먼 미래보다 지금을 더 친다 */
    if(i>=ny){ v+=w*.55; continue; }
    const sal=p.faC||p.foreign?p.sal/100:Math.min(seasonWorth(o),p.sal/100*Math.pow(1.3,i)); v+=w-sal*c.money*d; }
  if(v>0)v*=roleFactor(t,p,dir);
  const gt=gmTrait(t.id); if(v>0){ if(gt==='prospect'&&p.age<=24)v*=1.22; if(gt==='gambler'&&dir==='in'&&ovr(p)>=60)v*=1.15; if(gt==='data'){ const cd=condOf(p); v*=1-cd*.02; } }
  const m=G.mgr[t.id]; if(m&&v>0){ if(m.youth>=65&&p.age<=25)v*=1.1; if(m.small>=65&&!p.isP&&p.r.spd>=60)v*=1.06; if(m.pen>=65&&p.isP&&!isSP(p))v*=1.08; mgrAttr(m); if(m.dfn>=65&&!p.isP&&p.r.def>=60)v*=1.07; if(m.dfn<=35&&!p.isP&&p.r.pow>=60)v*=1.06; }
  if(v>0&&p.mor!=null&&p.mor<30)v*=dir==='in'?.92:.85;
  if(v>0&&dir==='in'&&ovr(p)<40&&p.age<=24)v*=.8; /* 아직 1군 근처에도 못 온 유망주는 불확실하다 */
  if(v>0&&dir==='out'&&(p.listed||p.aiListed))v*=p.aiListed?(p.aiUrg?.45:.55):(p.urgent?.75:.85); /* 매물로 내놓은 선수는 정리하고 싶은 선수다 */
  if(v>0&&milFree(p)&&p.age>=26)v*=.85;
  if(v>0)v*=medTradeF(p); /* 부상 체질·최근 부상·후유증·인대 이력·팔 부하 */
  if(v>0&&dir==='out'&&p.pledged&&p.pledged.tid===G.user&&G.day<=p.pledged.until&&p.team===t.id)v*=1.12; /* 우리 단장이 공개적으로 원한 선수: 값을 더 부른다 */
  if(p.injOut>20)v-=Math.abs(v)*(p.injOut>150?.55:p.injOut>60?.32:.2); /* 수술·장기 재활 선수는 값이 크게 깎인다 */
  if(dir==='out'){ const L=leagueSlots()[t.id]; const sl=L&&L[pSlot(p)]; const starter=sl&&sl.ps.some(q=>q.id===p.id)&&!p.aiListed; const fl=p.aiListed?(t.mode==='rebuild'?0:.6):starter?(c.contend?seasonWorth(projO(p,0))*.7:seasonWorth(projO(p,0))*.25):.4; v=Math.max(v,fl); }
  /* 연봉이 부담스러워도 주전급은 공짜로 내주지 않는다(다른 구단에 팔 수 있으므로) */
  if(dir==='out'){ const core=domestic(t.id).filter(q=>!q.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,6).some(q=>q.id===p.id); const w0=seasonWorth(projO(p,0));
    /* 팀 핵심(상위 6명)은 연봉과 상관없이 쉽게 내주지 않는다. 젊으면 더 비싸다 */
    if(p.aiListed){} else if(core)v=Math.max(v,w0*(c.contend?1:.8)*(p.age<=28?1.25:1)); else if(ovr(p)>=50)v=Math.max(v,w0*(c.contend?.45:.3)); } /* 매물로 내놓은 선수는 핵심 보호 하한을 두지 않는다 */
  return v; }
function stackIn(vals){ const pos=vals.filter(x=>x>0).sort((a,b)=>b-a), neg=vals.filter(x=>x<=0); const w=[1,.62,.42,.3,.25]; return sum(pos.map((x,i)=>x*(w[i]??.25)))+sum(neg); }
function tradeNeed(t,outVal){ const tr=gmTrait(t.id); let n=.9+Math.max(0,outVal)*.075-(t.rel-50)/15*(tr==='loyal'?2:1); if(tr==='hard')n=n*1.35+.8; if(tr==='gambler')n-=.5; if(tr==='loyal'&&t.rel>=70)n-=1; return n; }
function trueVal(p){ const o=ovr(p); const eff=p.age<=25?o+Math.max(0,p.pot-o)*.6:p.age>=32?o-(p.age-31)*1.3:o; return Math.pow(Math.max(0,eff-36),1.7)/10-(p.sal/100)*.35; }
function tradeOpen(){ const per=period(); if(per==='post')return false; if(per==='season')return G.day<=tradeDL(); return true; }
/* 현금: 백만 원 단위. 돈을 중시하는 구단(독립·수익형 구단주·캡 초과·리빌딩)일수록 가치가 크다 */
function cashVal(t,cash){ return cash>0?cash/100*teamCtx(t).money*.9:0; }
/* 부족분을 메우는 데 필요한 현금(100만 원 단위, 1천만 원 단위로 올림) */
function cashFor(t,gap){ if(!(gap>0))return 0; return Math.ceil(gap/(teamCtx(t).money*.9)*100/10)*10; }
function evalTrade(tid,give,get,cash){ cash=cash||0;
  const t=team(tid); const P=id=>G.players[id];
  const I=aiInterest(tid); const hit=give.filter(id=>I.includes(id));
  _evOut=new Set(get.map(id=>P(id)).filter(q=>{ const L=leagueSlots()[t.id]; const sl=L&&L[pSlot(q)]; return sl&&sl.ps.some(x=>x.id===q.id); }).map(pSlot));
  let inV, outV; try{ inV=stackIn(give.map(id=>tval(t,P(id),'in')*(I.includes(id)?1.2:1)))+cashVal(t,cash); outV=sum(get.map(id=>tval(t,P(id),'out'))); } finally { _evOut=null; }
  const theirN=rosterN(tid)+give.length-get.filter(id=>!P(id).ys).length;
  let need=tradeNeed(t,outV)-(get.some(id=>P(id)&&P(id).aiListed)?1.5:0)-(hit.length?.6:0); /* 매물로 내놓은 선수는 비슷한 값이면 넘긴다(정리하고 싶은 선수다) */ if(get.length&&get.every(id=>P(id)&&P(id).aiListed))need=Math.min(need,get.every(id=>P(id).aiUrg)?-.9:-.3); /* 급매는 손해를 조금 보더라도 넘긴다 */ if(theirN>=ROSTER_MAX-1&&give.length>get.length)need+=.8*(give.length-get.length);
  const theirPay=capPay(tid)+sum(give.map(id=>P(id).sal))-sum(get.map(id=>P(id).sal));
  const c=(G.gmc||{})[tid]||{}; let anc=0; for(const id of get){ const a=c.ask&&c.ask[id]; if(a&&a.until>=G.day)anc+=a.m; } need+=Math.max(0,outV)*Math.min(.25,anc)+hn('gmday'+tid,G.day)*.06*Math.max(3,outV);
  /* 같은 구단과 올해 거래를 반복할수록, 상대 핵심 선수를 데려갈수록 웃돈을 요구한다 */
  if(tid!==G.user){ const nT=(G.trades||[]).filter(x=>x.y===G.year&&x.with===tid).length; if(nT)need+=Math.max(1.5,outV)*.25*nT;
    const core=new Set(domestic(tid).filter(q=>!q.ys&&!q.aiListed).sort((a,b)=>ovr(b)-ovr(a)).slice(0,3).map(q=>q.id)); if(get.some(id=>core.has(id)))need+=Math.max(1,outV)*.2; }
  /* 한 명의 주축을 여러 명의 B급과 바꾸지 않는다: 받는 선수 중 가장 좋은 선수가 내주는 주축의 75%는 돼야 한다 */
  { const outs=get.map(id=>tval(t,P(id),'out')).filter(x=>x>0); const ins=give.map(id=>tval(t,P(id),'in')); const topO=outs.length?Math.max(...outs):0, topI=ins.length?Math.max(...ins):0;
    if(topO>=3&&give.length>get.length&&topI<topO*.75)need+=(topO*.75-topI)*1.3; }
  const gain=inV-outV; return {gain,need,ok:gain>=need,theirN,theirPay,inV,outV,hit};
}
function proposeTrade(tid,give,get,cash){
  const t=team(tid); cash=Math.max(0,Math.round(cash||0));
  if(!tradeOpen())return {ok:false,msg:'트레이드 마감(7월 31일)이 지났습니다. 포스트시즌이 끝난 뒤 다시 할 수 있습니다.'};
  if(!give.length&&!get.length)return {ok:false,msg:'주고받을 선수를 골라 주세요.'};
  { const nt=ntcOf(give); if(nt)return {ok:false,msg:`${nt.name}은(는) 계약서에 트레이드 거부권이 있어 동의 없이 보낼 수 없습니다(${nt.ntc}년까지).`}; }
  if(cash>3000)return {ok:false,msg:'현금은 한 번에 30억 원까지 얹을 수 있습니다.'};
  if(cash>0&&!get.length)return {ok:false,msg:'현금만 주고 선수를 받지 않는 거래는 할 수 없습니다.'};
  if([...give,...get].some(id=>G.players[id].foreign))return {ok:false,msg:'외국인 선수는 트레이드 대상에서 뺐습니다(게임 단순화).'};
  const gmn=`${t.city} ${t.nick} ${gmOf(tid).name} 단장`; const nt=negTurn(tid); const ni=negInfo(tid); const sig=tsig(give,get,cash);
  const isCtr=nt.ctr&&nt.ctr[sig]===G.day; /* 상대가 직접 낸 역제안·보완안은 횟수·중복 제한 없이 받는다 */
  if(!isCtr&&nt.seen[sig]!=null)return {ok:false,msg:`${gmn}: 그 안은 ${dsh(nt.seen[sig])}에 이미 답을 드렸습니다. 조건을 바꿔서 오시죠.`,dup:true};
  if(!isCtr&&!ni.left)return {ok:false,msg:`${gmn}: 이번 달은 더 시간을 내기 어렵습니다. ${ni.next}에 다시 연락 주십시오.${ni.free?'':' (우리와 맞대결하는 기간에는 경기장에서 따로 만날 수 있습니다)'}`,closed:true};
  const e=evalTrade(tid,give,get,cash);
  if(e.theirN>ROSTER_MAX)return {ok:false,msg:`${t.city} ${t.nick} 로스터가 ${ROSTER_MAX}명을 넘게 됩니다. 받을 선수를 늘려 주세요.`};
  if(e.theirN<ROSTER_MIN)return {ok:false,msg:`${t.city} ${t.nick} 로스터가 ${ROSTER_MIN}명 아래로 내려갑니다.`};
  if(e.theirPay>capOf(G.year)&&e.theirPay>capPay(tid))return {ok:false,msg:`${t.city} ${t.nick} 단장: 샐러리캡 때문에 연봉을 더 떠안을 수 없습니다.`};
  if(e.ok){ const mv=mgrTradeView(tid,give,get); const grade=tradeGrade(tid,give,get); const snap=tradeSnap([...give,...get]);
    give.forEach(id=>{ G.players[id].team=tid; story(G.players[id],`트레이드로 ${tname(tid)} 이적`,'move'); }); get.forEach(id=>{ G.players[id].team=G.user; story(G.players[id],`트레이드로 ${tname(G.user)} 이적`,'move'); });
    for(const k in G.lineup) if(give.includes(G.lineup[k]))delete G.lineup[k];
    const diff=sum(get.map(id=>trueVal(G.players[id])))-sum(give.map(id=>trueVal(G.players[id])));
    try{ frBacklash(give); }catch(e){}
    chron('trade',`${tshort(tid)}와(과) 트레이드: ${give.map(id=>G.players[id]?G.players[id].name:'').join('·')} 보내고 ${get.map(id=>G.players[id]?G.players[id].name:'').join('·')} 받음`);
    G.trades.push({y:G.year,d:G.day,with:tid,give:give.map(id=>G.players[id].name),get:get.map(id=>G.players[id].name),diff,revealed:false,gi:[...get],go:[...give],snap,grade});
    t.rel=clamp(t.rel+2,0,100); prTrade(give,get,tid); give.forEach(id=>mvLog('트레이드',G.players[id],G.user,tid)); try{ if(give.some(id=>ovr(G.players[id])>=55))ivRequest('trade',{}); }catch(e){} get.forEach(id=>mvLog('트레이드',G.players[id],tid,G.user));
    if(cash>0){ payOut(G.user,cash,'etc'); payIn(tid,cash); }
    addLog(`${tname(tid)}와(과) 트레이드: ${give.map(id=>G.players[id].name).join(', ')||'없음'}${cash?` + 현금 ${money(cash)}`:''} ↔ ${get.map(id=>G.players[id].name).join(', ')||'없음'}`);
    mgrTradeApply(mv); churnCheck(); mpickTraded(give); return {ok:true,grade,msg:`${gmn}이 제안을 받아들였습니다.${mv&&mv.r?` ${mv.r>0?'감독은 반깁니다':'감독은 못마땅해합니다'}(관계 ${mv.r>0?'+':''}${mv.r}).`:''}`};
  }
  const gap=e.need-e.gain; if(!ni.free&&!isCtr)nt.neg++; nt.seen[sig]=G.day; nt.ask=nt.ask||{}; for(const id of get){ const a=nt.ask[id]||{m:0,until:0}; a.m=Math.min(.25,(a.until>=G.day?a.m:0)+.04); a.until=G.day+7; nt.ask[id]=a; }
  for(const id of give){ const q=G.players[id]; if(q&&R()<.12){ q.mor=clamp((q.mor??60)-4,0,100); if(R()<.5)wire('루머',`${q.name}, ${t.city} ${t.nick}와(과) 트레이드 대상으로 거론됐다는 소문`,{ref:q.id}); } } if(gmTrait(tid)==='hard'&&nt.neg>=3)t.rel=clamp(t.rel-1,0,100);
  const why=tradeWhyNot(t,give,get);
  if(gap>9){ t.rel=clamp(t.rel-2,0,100); return {ok:false,msg:`${gmn}: 진지한 제안으로 보기 어렵습니다.${why?` ${why}`:''} (친분 -2)`}; }
  const co=counterOffer(tid,give,get,cash); nt.ctr={}; for(const c of co)nt.ctr[tsig(c.give,c.get,cash)]=G.day; /* 현금은 그대로 두고 선수 구성만 바꾼 안 */ if(co.length)return {ok:false,msg:`${gmn}: 조금 모자랍니다.${why?` ${why}`:''} 이렇게 하시면 응하겠습니다.`,counters:co};
  const cand=domestic(G.user).filter(p=>!give.includes(p.id)&&!(p.joinY>G.year)).map(p=>({p,v:tval(t,p,'in')*.72})).filter(x=>x.v>=gap*.8).sort((a,b)=>a.v-b.v)[0];
  if(cand)nt.ctr[tsig([...give,cand.p.id],get,cash)]=G.day;
  const cashNeed=cashFor(t,gap); if(cashNeed&&cashNeed+cash<=3000)nt.ctr[tsig(give,get,cashNeed+cash)]=G.day; const cTxt=cashNeed&&cashNeed+cash<=3000?` 아니면 현금 ${money(cashNeed+cash)}을(를) 얹어도 됩니다.`:'';
  return {ok:false,msg:`${gmn}: 조금 부족합니다.${why?` ${why}`:''}${cand?` ${cand.p.name}(${posLabel(cand.p)})을(를) 얹어 주면 응하겠습니다.`:' 받는 선수를 줄여 주세요.'}${cTxt}`,want:cand?cand.p.id:null,cashAsk:cashNeed?cashNeed+cash:null};
}


/* 거절 이유를 한마디로: 상대 구단 사정(리빌딩·우승 경쟁·연봉)과 맞지 않는 선수를 내밀 때 */
function tradeWhyNot(t,give,get){ const P=id=>G.players[id]; const g=give.map(P).filter(Boolean), o=get.map(P).filter(Boolean); if(!g.length)return '';
  const ag=sum(g.map(p=>p.age))/g.length, gs=sum(g.map(p=>p.sal)), os=sum(o.map(p=>p.sal)); const ctx=teamCtx(t);
  if(t.mode==='rebuild'&&(ag>=29||gs>os*1.3+100))return '저희는 리빌딩 중이라 나이 많고 연봉 큰 선수는 부담입니다. 젊은 선수를 원합니다.';
  if(ctx.contend&&g.every(p=>ovr(p)<ovr(o[0]||p)-3))return '저희는 지금 순위 싸움 중이라 당장 뛸 선수가 필요합니다.';
  if(gs>os+300&&(t.owner==='profit'||capPay(t.id)+gs-os>capOf(G.year)*.95))return `연봉을 ${money(gs-os)} 더 떠안는 건 어렵습니다.`;
  { const bad=g.find(medRisky); if(bad)return `메디컬 검진에서 ${bad.name}의 몸 상태가 걸렸습니다. ${injDays2(bad)>=60?`최근 2년 동안 ${injDays2(bad)}일을 부상으로 빠졌습니다.`:'부상 위험이 크다는 소견입니다.'}`; }
  if(o.some(p=>p.aiListed&&p.aiWhy==='room')&&g.every(p=>p.age>=26))return '저희가 내놓은 건 자리가 없는 유망주라, 받는 쪽도 앞으로 클 선수였으면 합니다.';
  return ''; }
