/* ===== 동석 관람: 구단주·사장과 홈경기를 함께 보며 가까워진다 =====
   정기 업무가 되지 않게 한 시즌 2~4번, 의미 있는 때만 초대가 온다(홈 개막전, 긴 연패, 트레이드 마감 직전, 순위 경쟁, 시즌 마지막 홈경기).
   - 초대: 소식함의 선택 이벤트(핵심 결정 아님, 진행을 막지 않음). '함께 보겠습니다' / '이번에는 어렵습니다'. 기한이 지나면 사양, 사양해도 불이익 없음
   - 경기: 결과는 바꾸지 않는다. 끝나면 경기 보고 하나(라인스코어·주요 장면·구단주 한두 마디·결과에 따른 신뢰 소폭 변화)
   - 좋은 경기(끝내기, 대승, 연패 탈출, 같은 지역 라이벌전, 가을야구 확정권)는 일정 확률로 구단주 선물: 선수단 격려금 · 소액 운영비 · 공사비 일부
   - 보고 뒤 (a) 단장 건의: 한 가지(안 해도 된다). 승인은 기존 규칙(ownerAsk·capexAsk)에 경기 결과 보정만 얹는다
             (b) 구단주 지시: 성향·관심사·현재 상황에 맞는 짧은 목표 하나. 기한 뒤 실제 기록으로 판정. 한 번에 하나만
   - 친밀도(rap): 구단주·사장 각각 0~100, 시작 30. 신뢰와 별개. 동석하면 오르고 오래 못 보면 아주 천천히 내려간다.
     모든 예산 요청·투자·감독 교체 승인 확률에 상시 보정(최대 +10%p, 최저 -4%p)
   단장이 직접 잡은 구단주·사장 동행 직관도 같은 흐름을 탄다. 사용자 구단 전용, 실업 중에는 쓰지 않는다 */
const CW_MAX=4, CW_GAP=21;
const CW_WHY={open:'홈 개막전',streak:'연패',dl:'트레이드 마감 직전',race:'순위 경쟁',last:'시즌 마지막 홈경기',self:'단장이 잡은 직관'};
const CW_SECL={youth:'육성',star:'스타',crowd:'관중',money:'돈'};
/* 구단주 한마디 화제 가중치: 성향(win·profit·pr) × 2차 관심사(구단주마다 고정) */
const CW_W={win:{slump:1.3,hook:1.3,rookie:.6,crowd:.4,star:.9,foreign:1.2,money:.4},profit:{slump:1.3,hook:.5,rookie:.6,crowd:1,star:.6,foreign:1,money:1.8},
  pr:{slump:.9,hook:.6,rookie:1,crowd:1.6,star:1.5,foreign:.8,money:.4},ceo:{money:2,crowd:1.4,foreign:.8,slump:.8,star:.5}};
const CW_SECW={youth:{rookie:1.8},star:{star:1.8,slump:1.3},crowd:{crowd:1.8},money:{money:1.8,slump:1.2,foreign:1.2}};
function cwH(s){ let h=2166136261>>>0; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } h^=h>>>13; h=Math.imul(h,1274126177)>>>0; h^=h>>>16; return (h>>>0)/4294967296; }
/* 구단주 2차 관심사: 기존 3성향(성적·수익·홍보)은 그대로 두고, 구단주마다 정해진 관심사를 하나 더 붙인다 */
function cwSec(){ const B=bossOf(G.user); return ['youth','star','crowd','money'][Math.floor(cwH('cwsec:'+B.own.id+':'+B.own.name)*4)]; }
function cwSt(){ const c=G.cw||(G.cw={}); if(c.y!==G.year){ c.y=G.year; c.n=0; c.last={}; c.lastD=-99; c.gift=0; } c.hist=c.hist||[]; return c; }
function cwOn(){ return !!(G&&!G.unemp&&!G.gameOver&&G.user!=null&&!team(G.user).indie); }
function cwNm(who){ const B=bossOf(G.user); return who==='ceo'?`${B.ceo.name} 사장`:`${B.own.name} 회장`; }
function cwFrom(who){ return who==='ceo'?'사장실':'구단주실'; }
const cwPct=x=>Math.round(x*100)+'%';

/* ---------- 친밀도 ---------- */
function cwRapP(who){ const B=bossOf(G.user); const x=who==='ceo'?B.ceo:B.own; if(x.rap==null){ x.rap=30; x.rapD=G.day; } return x; }
function cwRap(who){ return Math.round(cwRapP(who).rap); }
function cwRapAdd(who,d){ const x=cwRapP(who); x.rap=clamp(Math.round((x.rap+d)*10)/10,0,100); x.rapD=G.day; return d; }
/* 승인 확률 보정: 구단주 친밀도 70%, 사장 30%를 섞어 30을 기준으로 4.5점에 1%p. 최대 +10%p(구단주 70·사장 60 무렵), 최저 -4%p */
function cwRapMod(){ try{ if(G.user==null||G.unemp||team(G.user).indie)return 0; return clamp(((cwRapP('own').rap-30)*.7+(cwRapP('ceo').rap-30)*.3)/450,-.04,.1); }catch(e){ return 0; } }
function cwRapLbl(r){ return r>=70?'각별함':r>=50?'가까움':r>=30?'보통':'서먹함'; }
/* 오래 함께 보지 않으면 주마다 0.5씩 내려간다(마지막 동석 뒤 60일부터). 처음 값 30 아래로는 내려가지 않는다(사양·무관심에 따른 불이익 없음) */
function cwRapWeek(){ for(const w of ['own','ceo']){ const x=cwRapP(w); if(G.day-(x.rapD??G.day)>=60&&x.rap>30)x.rap=Math.max(30,x.rap-.5); } }

/* ---------- 기록 도우미 ---------- */
function cwRecentB(p,n){ const o={g:0,pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,sf:0}; for(const g of (G.games||[])){ if(o.g>=n)break; if(!g.box||dobj(g.day).y!==G.year)continue; const s=g.box[g.home===G.user?'h':'a']; const b=s&&s.bat.find(x=>x.id===p.id); if(!b||!(b.ab+b.bb+(b.sf||0)))continue; o.g++; for(const k of ['ab','h','d','tr','hr','bb','so','sf'])o[k]+=b[k]||0; o.pa+=b.ab+b.bb+(b.sf||0); }
  const obp=obpOf(o), slg=o.ab?(o.h+o.d+2*o.tr+3*o.hr)/o.ab:0; return Object.assign(o,{avg:o.ab?o.h/o.ab:0,ops:obp+slg}); }
function cwUlog(){ return ((G.sea&&G.sea.ulog)||[]).filter(x=>dobj(x.d).y===G.year); }
function cwStreak(L){ L=L||cwUlog(); let n=0; for(let i=L.length-1;i>=0;i--){ if(L[i].res==='패')n++; else break; } return n; }
function cwBadF(){ return foreignOf(G.user).filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=60&&pRate(h).era>5):(h.pa>=100&&bRate(h).ops<.700)); }); }
function cwHomeAtt(){ const A=G.sea&&G.sea.att&&G.sea.att[G.user]; const cap=stadCap(G.user); if(!A||!A.n)return {n:0,avg:0,ratio:0,so:0,cap}; const a=Math.round(A.sum/A.n); return {n:A.n,avg:a,ratio:a/cap,so:A.so||0,cap}; }
function cwNextHome(from,to){ for(let d=from;d<=to;d++){ const gs=G.cal.sched[d]; if(gs&&gs.some(m=>m[0]===G.user))return d; } return null; }
function cwGb(a,b){ return ((a.w-b.w)+(b.l-a.l))/2; }
function cwRaceOn(){ const st=standingsNow(); const i=st.findIndex(x=>x.tid===G.user); if(i<0)return false; const me=st[i];
  if(i<=4&&st[5]&&cwGb(me,st[5])<=2)return true; if(i>4&&cwGb(st[4],me)<=2)return true; if(i<=2&&Math.abs(cwGb(st[0],me))<=2)return true; return false; }

/* ---------- 초대: 하루 처리에서 ---------- */
function cwDaily(){ if(!cwOn()||!G.cal)return; try{ cwInvite(); }catch(e){} try{ cwOrdDaily(); }catch(e){} if(dobj(G.day).w===1)try{ cwRapWeek(); }catch(e){}
  const S=G.cwS; if(S&&!S.done&&G.day>S.until)S.done=true; /* 건의 기회는 사흘 뒤 사라진다 */ }
function cwInvOpen(){ return (G.evs||[]).some(e=>e.k==='cwInv'&&!e.done)||Object.keys(gmPlans()).some(d=>{ const q=G.gmPlan[d]; return +d>G.day&&q.k==='attend'&&q.cw&&!q.done; }); }
function cwInvite(){ const c=cwSt(); const per=period(); const C=G.cal; if(!(per==='season'||(per==='pre'&&G.day>=C.open-6)))return; if(G.day>C.end||c.n>=CW_MAX||cwInvOpen())return;
  const nh=cwNextHome(Math.max(G.day+2,C.open),Math.min(G.day+5,C.end)); if(nh==null)return; const ex=gmPlans()[nh]; if(ex&&ex.k==='attend'&&ex.x)return; /* 이미 동행 일정이 있다 */
  const homes=homeGames(G.user,C.open,C.end).map(x=>x[0]); const gap=G.day-c.lastD>=CW_GAP; let why=null;
  if(!c.last.open&&nh===homes[0])why='open';
  else if(!c.last.last&&nh===homes[homes.length-1])why='last';
  else if(!gap)return;
  else if(!c.last.dl&&G.day>=KD(7,20)&&nh<=tradeDL()&&R()<.7)why='dl';
  else if(cwStreak()>=5&&(c.last.streak==null||G.day-c.last.streak>=40)&&R()<.6)why='streak';
  else if(!c.last.race&&G.day>=KD(8,10)&&cwRaceOn()&&R()<.35)why='race';
  if(!why)return; c.last[why]=G.day;
  let who='own'; try{ const b=budget(); const iss=b.roomGoal<0||(G.fac&&G.fac.bld&&Object.keys(G.fac.bld).length); if(why!=='open'&&R()<(iss?.45:.2))who='ceo'; /* 사장은 예산·시설 이슈가 있으면 더 자주, 없어도 가끔 */ }catch(e){}
  c.n++; c.lastD=G.day; const g=(C.sched[nh]||[]).find(m=>m[0]===G.user); const op=g?tname(g[1]):'상대';
  const ev=evNew('cwInv',`${who==='ceo'?'사장':'구단주'}의 초대: ${dmd(nh)} ${op}전 함께 보기`,`${cwNm(who)}: "${cwInvLine(why,who,nh,op)}"\n\n${dmd(nh)} 홈경기입니다(사유: ${CW_WHY[why]}). 함께 보면 친밀도가 오르고, 경기 뒤에 보고를 나누며 한 가지를 건의할 수 있습니다. 사양해도 불이익은 없습니다.`,
    [{l:'함께 보겠습니다',fx:'그날 직관 일정에 동석으로 잡힘 · 친밀도 상승 · 경기 뒤 보고와 건의 기회'},{l:'이번에는 어렵습니다',fx:'변화 없음'}],{exp:Math.max(1,nh-1-G.day),def:1,from:cwFrom(who),data:{d:nh,who,why}});
  G.stops=(G.stops||[]).filter(x=>x.id!==ev.mid); /* 진행을 막지 않는다 */ }
function cwInvLine(why,who,d,op){ const ow=team(G.user).owner;
  if(who==='ceo')return `단장님, ${dmd(d)} 홈경기에 가려고 합니다. 올해 예산 이야기도 할 겸 같이 보시겠습니까?`;
  if(why==='open')return ow==='pr'?'홈 개막전은 그룹 행사나 다름없소. 관중석에서 같이 보겠소?':ow==='profit'?'개막전 관중이 얼마나 오는지 직접 보고 싶소. 같이 가겠소?':'올해 첫 홈경기요. 같이 보면서 올해 구상을 들어 보고 싶소.';
  if(why==='streak')return `요즘 경기가 답답하오. ${dmd(d)} ${op}전은 직접 보려는데, 시간 되면 같이 봅시다.`;
  if(why==='dl')return '트레이드 마감이 코앞이오. 경기 보면서 이야기 좀 나눕시다.';
  if(why==='race')return '순위 싸움이 한창이라던데, 직접 보고 싶소. 같이 가겠소?';
  if(why==='last')return '올해 마지막 홈경기요. 한 해를 같이 마무리합시다.';
  return '같이 경기 봅시다.'; }
EVH.cwInv={ pick(e,i){ const d=e.data; if(i!==0)return `${d.who==='ceo'?'사장':'구단주'}에게 사정을 전했습니다. "다음에 봅시다." 변화는 없습니다.`;
  const P=gmPlans(); if(d.d<=G.day)return '경기 날짜가 지났습니다.'; P[d.d]={k:'attend',x:d.who==='ceo'?'ceo':'owner',cw:d.why,done:false};
  return `${dmd(d.d)} 홈경기 직관 일정을 ${d.who==='ceo'?'사장':'구단주'} 동석으로 잡았습니다. 전날 다시 알려 드립니다.`; } };

/* ---------- 경기 뒤 보고 (gmAttendResult에서 부른다) ---------- */
function cwStart(rec,plan){ if(!cwOn()||!rec||!rec.box)return false; const who=plan.x==='ceo'?'ceo':'own'; const why=plan.cw||'self'; plan.done=true;
  const t=team(G.user); const me=rec.home===G.user?'h':'a'; const ms=me==='h'?rec.hs-rec.as:rec.as-rec.hs; const tr0=t.trust;
  const L=cwUlog(); const tags=cwTags(rec,me,ms,cwStreak(L.slice(0,-1)));
  const S={tid:G.user,id:'cw'+rec.day+':'+rec.home+':'+rec.away,day:rec.day,gk:{d:rec.day,h:rec.home,a:rec.away},who,why,ms,res:rec.res,tags,tr0,until:G.day+3,done:false,sugg:null,gift:null};
  S.lines=cwRemarks(rec,me,who,ms,tags);
  /* 결과에 따른 신뢰 소폭 변화: 이기면 +1(5점 차 이상 +1.5), 5점 차 이상 지면 -1. 사장과 보면 절반이 구단주에게 전해진다 */
  const d0=ms>=5?1.5:ms>0?1:ms<=-5?-1:0; const dv=who==='ceo'?d0/2:d0; t.trust=clamp(Math.round((t.trust+dv)*10)/10,0,100); S.trD=Math.round((t.trust-tr0)*10)/10;
  /* 친밀도: 같이 보면 +4, 이기면 +2 더 */ const r0=cwRap(who); cwRapAdd(who,ms>0?6:4); S.rapD=cwRap(who)-r0;
  const m=G.mgr[G.user]; if(m&&!m.interim)m.rel=clamp(m.rel+1,0,100); for(const q of playersOf(G.user).filter(q=>q.e1))q.mor=clamp((q.mor??60)+1,0,100); /* 단장 직관 효과(기존과 같음) */
  if(ms>0)S.gift=cwGift(tags);
  S.ord=cwOrdIssue(who); /* 구단주 지시(이미 진행 중이면 새로 내리지 않는다) */
  G.cwS=S; const c=cwSt(); c.hist.push({d:S.day,y:G.year,why,who,res:rec.res,ms,trD:S.trD,rapD:S.rapD,gift:S.gift?S.gift.k:null,tags,ord:S.ord?S.ord.k:null}); if(c.hist.length>40)c.hist.splice(0,c.hist.length-40);
  const O=cwOrd(); mail(cwFrom(who),`${who==='ceo'?'사장':'구단주'}과 함께 본 경기: ${rec.res==='승'?'승리':rec.res==='패'?'패배':'무승부'}${S.gift?' · 구단주 선물':''}`,`${cwNm(who)}와(과) ${dmd(rec.day)} 홈경기를 함께 봤습니다(${CW_WHY[why]}).\n\n${S.lines.map(x=>'"'+x+'"').join('\n')}\n\n구단주 신뢰 ${S.trD>=0?'+':''}${S.trD} · ${who==='ceo'?'사장':'구단주'} 친밀도 +${S.rapD}(${cwRap(who)})${S.gift?`\n${S.gift.t}`:''}\n감독 관계 +1 · 1군 선수단 기분 +1(단장 직관)${O?`\n\n구단주 지시: ${O.t} (${dmd(O.until)}까지, ${O.crit})`:''}\n\n${dmd(S.until)}까지 경기 보고 화면에서 한 가지를 건의할 수 있습니다.`,{kind:'구단주',acts:[{l:'경기 보고 · 건의',a:'cwOpen'}]});
  return true; }
/* 좋은 경기 표시: 끝내기, 대승, 연패 탈출, 같은 지역 라이벌전, 가을야구 확정권 */
function cwTags(rec,me,ms,prevStreak){ const T=[]; if(ms<=0)return T; const op=team(me==='h'?rec.away:rec.home), mine=team(G.user);
  if(me==='h'){ const L=rec.line.h; const last=L.length-1; const before=rec.hs-(L[last]||0); if(last>=8&&(L[last]||0)>0&&before<=rec.as)T.push('walkoff'); }
  if(ms>=6)T.push('rout'); if(prevStreak>=3)T.push('snap');
  if(op.city===mine.city||op.region===mine.region)T.push('rival');
  try{ if(period()==='season'&&rec.day>=KD(9,1)){ const od=playoffOdds(); const x=od&&od.find(z=>z.tid===G.user); if(x&&x.ps>=.995)T.push('clinch'); } }catch(e){}
  return T; }
const CW_TAGL={walkoff:'끝내기 승리',rout:'대승',snap:'연패 탈출',rival:'라이벌전 승리',clinch:'가을야구 확정권'};
/* 구단주 선물: 좋은 경기면 40%(홍보 성향 +10%p, 신뢰 60 이상 +10%p), 평범한 승리면 6%. 한 시즌 2번까지 */
function cwGift(tags){ const c=cwSt(); if(c.gift>=2)return null; const t=team(G.user); const B=bossOf(G.user);
  const p=tags.length?.4+(t.owner==='pr'?.1:0)+(t.trust>=60?.1:0):.12; if(R()>=p)return null; c.gift++;
  const bld=G.fac&&G.fac.bld?Object.keys(G.fac.bld).filter(k=>G.fac.bld[k].c&&!G.fac.bld[k].cap):[]; const why=tags.length?CW_TAGL[tags[0]]:'승리';
  const r=R(); const k=bld.length&&r<.35?'fac':t.owner==='win'?(r<.6?'ops':'bonus'):t.owner==='profit'?(r<.7?'bonus':'ops'):(r<.6?'bonus':'ops');
  if(k==='fac'){ const b=G.fac.bld[bld[0]]; const amt=Math.round(b.c*.3); t.cash+=amt; const nm=(typeof FACI!=='undefined'&&FACI[bld[0]]&&FACI[bld[0]].l)||'시설'; return {k,t:`구단주 선물(${why}): 진행 중인 ${nm} 공사비의 30%인 ${money(amt)}을(를) 모기업이 대신 냈습니다. 구단 보유 현금 +${money(amt)}.`}; }
  if(k==='ops'){ const amt=300; const o=dobj(G.day); grantAdd({y:G.year,mk:o.y*100+o.m,d:G.day,amt,pur:null,ok:true,by:'own',kind:'gift',st:'done',until:null}); grantApply(amt); return {k,t:`구단주 선물(${why}): 운영비 ${money(amt)} 추가 지원. 올해 모기업 지원 한도와 지원 목표가 그만큼 늘었습니다.`}; }
  for(const q of playersOf(G.user).filter(q=>q.e1))q.mor=clamp((q.mor??60)+3,0,100); return {k:'bonus',t:`구단주 선물(${why}): ${B.own.name} 회장이 선수단 격려금을 개인적으로 냈습니다(구단 예산과 별개). 1군 선수단 기분 +3.`}; }

/* 구단주 한두 마디: 결과 한 줄 + 실제 기록에서 고른 한 줄(겉으로 보이는 것만, 성향에 따라 다르게) */
function cwRemarks(rec,me,who,ms,tags){ const ow=team(G.user).owner; const ceo=who==='ceo'; const out=[];
  out.push(ceo?(ms>0?'좋은 경기였습니다. 회장님께도 좋게 말씀드리겠습니다.':ms<=-5?'오늘은 보고드리기가 민망하네요.':ms<0?'아쉽습니다. 다음 경기는 이기겠죠.':'비겼네요. 쉽지 않은 경기였습니다.')
    :tags.includes('walkoff')?'끝내기라니! 이런 맛에 야구장에 오는 거요.':tags.includes('snap')?'드디어 연패를 끊었군. 오늘 오길 잘했소.':ms>=6?'시원하게 이겼군. 오늘 같은 경기를 자주 보고 싶소.':ms>0?(ow==='profit'?'이겼으니 됐소. 관중들 표정도 좋더군.':'수고했소. 이기는 경기는 늘 좋군.'):ms<=-5?(ow==='win'?'이런 경기를 보려고 온 건 아니오.':'관중들 보기 민망한 경기였소.'):ms<0?'아쉽군. 다음엔 이기는 걸 봅시다.':'비겼군. 쉽지 않은 경기였소.');
  const W=ceo?CW_W.ceo:CW_W[ow]||CW_W.win; const SW=ceo?{}:(CW_SECW[cwSec()]||{}); const C=[];
  for(const k of Object.keys(CW_RM)){ if(W[k]==null)continue; let x=null; try{ x=CW_RM[k](rec,me,ceo); }catch(e){} if(x)C.push([W[k]*(SW[k]||1)*(.7+R()*.6),x]); }
  C.sort((a,b)=>b[0]-a[0]); if(C[0])out.push(C[0][1]); return out; }
const CW_RM={
  slump(rec,me,ceo){ const side=rec.box[me]; for(const b of side.bat){ if(!b.pos||b.o>4)continue; const p=G.players[b.id]; if(!p||p.team!==G.user)continue; const r=cwRecentB(p,10); if(r.pa<25||r.avg>.230)continue;
    return ceo?`${p.name} 선수 연봉이 ${money(p.sal)}인데, 최근 ${r.g}경기 타율이 ${fmt3(r.avg)}네요.`:`${b.o+1}번 타자 ${p.name}, 요즘 왜 저러오? 최근 ${r.g}경기 타율이 ${fmt3(r.avg)}이던데.`; } return null; },
  hook(rec,me,ceo){ const sp=rec.box[me].pit[0]; const m=G.mgr[G.user]; if(ceo||!sp||!m||m.interim||!((sp.er>=5&&sp.outs>=12)||(sp.er>=4&&sp.outs>=18)))return null; const p=G.players[sp.id];
    return `${m.name} 감독은 투수를 너무 늦게 바꾸는 것 같은데. ${p?p.name:'선발'}이(가) ${sp.er}점이나 줬는데 ${ipStr(sp.outs)}이닝까지 던지게 하오?`; },
  rookie(rec,me,ceo){ if(ceo)return null; for(const b of rec.box[me].bat){ const p=G.players[b.id]; if(!p||p.team!==G.user||p.foreign||!(p.age<=23)||!(b.h>=1))continue; const s=seasonTotal(p,G.year,'1군'); if(s&&s.pa>=200)continue;
    return `저 ${p.age<=21?'신인':'젊은 친구'} ${p.name} 괜찮던데. 오늘 ${b.hr?'홈런까지 쳤잖소':b.h+'안타를 쳤잖소'}. 1군에서 더 쓰지 그러오?`; } return null; },
  crowd(rec,me,ceo){ if(!rec.att)return null; const r=rec.att/stadCap(G.user); const n=rec.att.toLocaleString('ko-KR');
    if(r>=.95)return ceo?`오늘 ${n}명, 거의 매진입니다. 입장 수입이 괜찮겠네요.`:`관중석이 꽉 찼군. ${n}명이라니 보기 좋소.`; if(r<.6)return ceo?`오늘 관중이 ${n}명, 좌석의 ${cwPct(r)}입니다. 입장 수입이 걱정입니다.`:`오늘 관중석이 왜 이렇게 비었소? ${n}명이라니.`; return null; },
  star(rec,me,ceo){ const L=rec.pbp||[]; const half0=me==='h'?1:0; for(const x of L){ if(x[0]%2!==half0||x[3]!=='HR')continue; const p=G.players[x[1]]; if(!p||p.team!==G.user)continue; return ceo?`${p.name} 선수 홈런 때 관중 반응이 좋더군요. 저런 선수가 표를 팝니다.`:`${p.name}, 시원하게 넘기는구먼. 저런 장면을 보러 오는 거요.`; } return null; },
  foreign(rec,me,ceo){ const p=cwBadF().sort((a,b)=>b.sal-a.sal)[0]; if(!p)return null; return ceo?`외국인 ${p.name} 선수 연봉이 ${money(p.sal)}인데 기록이 좋지 않네요.`:`외국인 ${p.name}, 돈값을 못 하는 것 같은데.`; },
  money(rec,me,ceo){ let b=null; try{ b=budget(); }catch(e){ return null; } if(!b||b.roomGoal>=0)return null; return ceo?`올해 예산 여유가 ${money(b.roomGoal)}입니다. 남은 시즌은 아껴 써야 합니다.`:`올해 적자가 ${money(-b.roomGoal)}라던데, 돈 관리는 잘하고 있는 거요?`; },
};

/* ---------- (a) 단장 건의: 기존 규칙 + 경기 결과 보정 (친밀도 보정은 기존 규칙 안에 상시 들어가 있다) ---------- */
/* 경기 결과 보정: 이긴 날 +8%p(끝내기·대승·연패 탈출이면 +12%p), 5점 차 이상 진 날 -10%p */
function cwMod(S){ S=S||G.cwS; if(!S)return 0; return S.ms>0?(S.tags.some(x=>x==='walkoff'||x==='rout'||x==='snap')?.12:.08):S.ms<=-5?-.1:0; }
/* 기존 승인 규칙은 신뢰에 선형으로 비례한다(ownOdds: 신뢰 80당 100%p, capexOdds: 70당 100%p). 보정만큼 신뢰를 잠깐 얹어 기존 함수를 그대로 부르고,
   함수가 바꾼 신뢰(반려 -1 등)만 남긴다 */
function cwWithMod(scale,mod,fn){ const t=team(G.user); const b=t.trust, sh=mod*scale; t.trust=b+sh; let r; try{ r=fn(); }finally{ t.trust=clamp(b+(t.trust-(b+sh)),0,100); } return r; }
function cwFireOdds(S){ const m=G.mgr[G.user]; const t=team(G.user); const rk=uRank(); return clamp(.3+(t.trust-50)/100+(rk>=7?.2:rk>=6?.1:0)+({win:.08,pr:0,profit:-.1}[t.owner]||0)-(m&&m.yrs>=2?.08:0)+cwMod(S)+cwRapMod(),.05,.9); }
function cwFacPick(){ if(typeof FACI==='undefined'||!G.fac||!G.fac.it)return null; if(Object.keys(G.fac.bld||{}).length>=2)return null; const L=Object.keys(FACI).filter(k=>G.fac.it[k]<3&&!(G.fac.bld||{})[k]).map(k=>({k,c:FACI[k].c[G.fac.it[k]+1]})); return L.sort((a,b)=>b.c-a.c)[0]||null; }
function cwCapexLeft(){ const S=capexState(); return S.last.fac==null||G.day-S.last.fac>=60; }
/* 건의할 수 있는 일: [키, 제목, 설명(승인 가능성 포함), 막힘 사유] */
function cwSuggOpts(S){ S=S||G.cwS; if(!S)return []; const mod=cwMod(S); const left=ownAskLeft(); const L=[]; const od=p=>oddsTxt(clamp(p+mod,.03,.92)); const fac=cwFacPick(); const noL=left?'':'이번 달 지원 요청은 이미 했습니다';
  if(S.who==='ceo'){ L.push(['ops:500','운영비 5억 지원 요청',`사장이 구단주께 결재를 올림 · ${od(ownOdds(500,null))} · 반려되면 신뢰 -1`,noL]);
    L.push(['pay:1500','연봉 재원 15억 요청(다년계약·연봉 인상분)',`모기업 지원 한도에 더해짐 · ${od(ownOdds(1500,null))} · 반려되면 신뢰 -1`,noL]);
    if(fac)L.push(['fac:'+fac.k,`${FACI[fac.k].l} 시설 투자 결재 요청`,`공사비 ${money(fac.c)} 모기업 부담 · ${oddsTxt(clamp(capexOdds('fac',fac.c)+mod,.05,.9))} · 보류되면 신뢰 -1`,cwCapexLeft()?'':'시설 투자 요청은 60일에 한 번입니다']); }
  else { L.push(['ops:1000','운영비 10억 증액 요청',`${od(ownOdds(1000,null))} · 반려되면 신뢰 -1`,noL]);
    const fa=G.fa&&G.fa.open&&!G.fa.closed?G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null).sort((a,b)=>ovr(b)-ovr(a))[0]:null;
    if(fa)L.push(['fa:'+fa.id,`FA ${fa.name} 영입 자금 요청`,`${money(fa.ask.annual)} · ${od(ownOdds(fa.ask.annual,{k:'fa',pid:fa.id}))} · 목적대로 못 쓰면 신뢰 -3`,noL]);
    const m=G.mgr[G.user]; if(m&&!m.interim)L.push(['fire',`${m.name} 감독 교체 건의`,`승인되면 바로 경질하고 구단주가 잔여 연봉 절반을 지원 · ${oddsTxt(cwFireOdds(S))} · 반려되면 신뢰 -2, 감독 관계 -5`,'']);
    if(fac)L.push(['fac:'+fac.k,`대형 투자: ${FACI[fac.k].l} 모기업 투자 요청`,`공사비 ${money(fac.c)} · ${oddsTxt(clamp(capexOdds('fac',fac.c)+mod,.05,.9))} · 보류되면 신뢰 -1`,cwCapexLeft()?'':'시설 투자 요청은 60일에 한 번입니다']); }
  return L; }
function cwSuggest(v){ const S=G.cwS; if(!S||S.done||S.sugg||(S.tid!=null&&S.tid!==G.user))return '건의할 수 있는 때가 아닙니다.'; const o=cwSuggOpts(S).find(x=>x[0]===v); if(!o)return '지금은 건의할 수 없는 일입니다.'; if(o[3])return o[3];
  const t=team(G.user); const tr0=t.trust; const mod=cwMod(S); const [k,x]=v.split(':'); let ok=false, txt='';
  if(k==='ops'||k==='pay'){ const r=cwWithMod(80,mod,()=>ownerAsk(+x,null)); ok=/^승인/.test(r); txt=r; }
  else if(k==='fa'){ const r=cwWithMod(80,mod,()=>ownerAsk(G.players[+x].ask.annual,{k:'fa',pid:+x})); ok=/^승인/.test(r); txt=r; }
  else if(k==='fac'){ const r=cwWithMod(70,mod,()=>capexAsk('fac',x)); ok=r===''; txt=ok?'승인됐습니다. 모기업이 공사비를 냅니다.':r; }
  else if(k==='fire'){ const m=G.mgr[G.user]; const p=cwFireOdds(S); ok=R()<p;
    if(ok){ const pay=Math.round(m.sal*Math.max(0,m.yrs-.5)); const help=pay>0?round5(pay/2):0; fireMgr(); if(help>0)grantApply(help); txt=`승인됐습니다. ${m.name} 감독을 경질했고, 구단주가 잔여 연봉의 절반 ${money(help)}을(를) 지원합니다. 새 감독은 스태프·육성 → 감독에서 선임하세요.`; }
    else { t.trust=clamp(t.trust-2,0,100); m.rel=clamp(m.rel-5,0,100); txt='반려됐습니다. 구단주 신뢰 -2, 건의 소문에 감독 관계 -5.'; } }
  const ow=t.owner; const say=S.who==='ceo'?(ok?'회장님 결재가 났습니다. 쓰임새는 분명히 해 주세요.':'이번에는 어렵다고 하십니다.'):ok?(ow==='win'?'좋소. 대신 결과로 보여 주시오.':ow==='profit'?'...이번만이오. 돈 쓴 만큼 해내시오.':'알겠소. 팬들을 실망시키지 마시오.'):(ow==='profit'?'지금은 돈을 더 쓸 때가 아니오.':ow==='win'?'성적으로 먼저 증명하시오.':'지금은 때가 아니오.');
  S.sugg={k:v,l:o[1],ok,txt,say,dT:Math.round((t.trust-tr0)*10)/10,mod}; S.done=true; const h=cwSt().hist.find(z=>z.d===S.day); if(h)h.sugg={k,ok}; return ''; }
function cwSkipSugg(){ const S=G.cwS; if(S&&!S.done){ S.done=true; S.sugg={k:'none'}; } }
function cwGame(S){ S=S||G.cwS; if(!S)return null; return (G.games||[]).find(g=>g.day===S.gk.d&&g.home===S.gk.h&&g.away===S.gk.a)||null; }

/* ---------- (b) 구단주 지시: 짧은 목표 하나, 기한 뒤 실제 기록으로 판정 ----------
   시즌 목표(G.goals: 순위·지원·여론·유망주 출전)와 같은 방식으로, 기간을 3~4주로 줄인 판정. 달성: 신뢰 +2·친밀도 +3, 미달: 신뢰 -1 */
function cwOrd(){ const o=G.ownOrder; return o&&o.st==='open'?o:null; }
function cwOrdCands(){ const t=team(G.user); const sec=cwSec(); const C=G.cal; const end=Math.min(G.day+21,C.end); const L=[]; const left=homeGames(G.user,G.day+1,end).length; const games=(()=>{ let n=0; for(let d=G.day+1;d<=end;d++){ const gs=C.sched[d]; if(gs&&gs.some(m=>m.includes(G.user)))n++; } return n; })();
  if(period()!=='season')return L;
  if(games>=10)L.push({k:'win',w:t.owner==='win'?3:1,t:'앞으로 3주 5할 이상',crit:`${dmd(end)}까지 우리 경기 승률 5할 이상(무승부 제외)`,until:end,base:{}});
  if(left>=5){ const A=cwHomeAtt(); const full=A.ratio>=.97; const tg=full?.95:Math.min(1,A.ratio+.03); L.push({k:'att',w:(t.owner==='pr'?3:.8)*(sec==='crowd'?2:1),t:full?'매진 행진 이어 가게':'홈 관중 늘려 보게',crit:`${dmd(end)}까지 홈경기 평균 좌석 점유율 ${cwPct(tg)} 이상${full?' 유지':''}(지금까지 ${cwPct(A.ratio)})`,until:end,base:{ratio:A.ratio,tg}}); } /* 이미 꽉 찬 구장에 '더 늘리라'는 목표는 이룰 수 없다 */
  let b=null; try{ b=budget(); }catch(e){} if(b){ const e2=Math.min(G.day+28,C.end+30); if(b.roomGoal<0)L.push({k:'cut',w:(t.owner==='profit'?3:.8)*(sec==='money'?2:1),t:'이번 분기 적자 줄이게',crit:`${dmd(e2)}까지 예산 여유를 3억 이상 개선(지금 ${money(b.roomGoal)})`,until:e2,base:{room:b.roomGoal}});
    else L.push({k:'keep',w:(t.owner==='profit'?1.5:.4)*(sec==='money'?1.5:1),t:'예산 여유 지키게',crit:`${dmd(e2)}까지 예산 여유를 0원 이상으로 유지(지금 ${money(b.roomGoal)})`,until:e2,base:{room:b.roomGoal}}); }
  if(games>=10&&playersOf(G.user).some(p=>!p.foreign&&p.age<=23))L.push({k:'young',w:(sec==='youth'?3:.6)*(t.owner==='pr'?1.2:1),t:'유망주 한 명 1군에서 써 보게',crit:`${dmd(end)}까지 23세 이하 선수 한 명이 1군 30타석 또는 8이닝 이상(지시 이후 기록)`,until:end,base:{snap:cwYoungSnap()}});
  const st=playersOf(G.user).filter(p=>!p.foreign&&canExtend(p)&&!p.extNext&&(p.faC?p.yrs<=1:Math.max(0,faSvc(p)-(p.svc||0))<=1)).filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&warOf(h,p)>=1.5; }).sort((a,b)=>ovr(b)-ovr(a))[0];
  if(st)L.push({k:'ext',w:(sec==='star'?3:.6)*(t.owner==='pr'?1.3:1),t:`${st.name} 붙잡게`,crit:`${dmd(Math.min(G.day+28,C.end+30))}까지 ${st.name}와(과) 다년계약 합의`,until:Math.min(G.day+28,C.end+30),base:{pid:st.id}});
  return L; }
function cwYoungSnap(){ const o={}; for(const p of playersOf(G.user)){ if(p.foreign||p.age>23)continue; const h=seasonTotal(p,G.year,'1군'); o[p.id]=[(h&&h.pa)||0,(h&&h.outs)||0]; } return o; }
function cwOrdIssue(who){ if(cwOrd())return null; const L=cwOrdCands(); if(!L.length)return null; let x=R()*sum(L.map(c=>c.w)); let c=L[0]; for(const y of L){ x-=y.w; if(x<=0){ c=y; break; } }
  const O={k:c.k,t:c.t,crit:c.crit,until:c.until,base:c.base,d0:G.day,who,st:'open',say:cwOrdSay(c.k)}; G.ownOrder=O; return O; }
function cwOrdSay(k){ const ow=team(G.user).owner; return {win:ow==='win'?'이기는 게 먼저요. 앞으로 3주는 5할 밑으로 떨어지지 마시오.':'성적도 좀 챙기시오. 3주 동안 5할은 하시오.',att:'관중석이 차야 그룹 체면이 서오. 홈 관중을 늘려 보게.',cut:'적자는 줄이시오. 한 달 뒤에 숫자로 봅시다.',keep:'지금처럼 예산 안에서 운영하시오. 적자는 안 되오.',young:'젊은 선수 하나쯤은 1군에서 크는 걸 보고 싶소. 한 명 써 보게.',ext:'저런 선수는 놓치면 안 되오. 계약을 매듭지으시오.'}[k]||''; }
function cwOrdEval(O){ const end=G.day>=O.until; const C=G.cal;
  if(O.k==='win'){ const L=cwUlog().filter(u=>u.d>O.d0&&u.d<=O.until&&u.res!=='무'); const w=L.filter(u=>u.res==='승').length; const ok=L.length?w/L.length>=.5:false; return {done:end,ok,txt:`${w}승 ${L.length-w}패`}; }
  if(O.k==='att'){ const H=(G.games||[]).filter(g=>g.day>O.d0&&g.home===G.user&&g.att); const r=H.length?avg(H.map(g=>g.att))/stadCap(G.user):0; const tg=O.base.tg??Math.min(1,O.base.ratio+.03); return {done:end,ok:H.length>0&&r>=tg,txt:H.length?`홈 ${H.length}경기 점유율 ${cwPct(r)}(목표 ${cwPct(tg)})`:'아직 홈경기 없음'}; }
  if(O.k==='cut'||O.k==='keep'){ let b=null; try{ b=budget(); }catch(e){} const v=b?b.roomGoal:O.base.room; const ok=O.k==='cut'?(v>=O.base.room+300||v>=0):v>=0; return {done:end||(O.k==='cut'&&ok),ok,txt:`예산 여유 ${money(v)}`}; }
  if(O.k==='young'){ let best=null; for(const p of playersOf(G.user)){ const s=O.base.snap[p.id]; if(!s)continue; /* 지시 때 23세 이하였던 선수만 */ const h=seasonTotal(p,G.year,'1군'); const pa=((h&&h.pa)||0)-s[0], ou=((h&&h.outs)||0)-s[1]; const sc=Math.max(pa/30,ou/24); if(!best||sc>best.sc)best={p,pa,ou,sc}; }
    const ok=!!best&&best.sc>=1; return {done:ok||end,ok,txt:best&&best.sc>0?`${best.p.name} ${best.p.isP&&best.ou>=best.pa?`${ipStr(best.ou)}이닝`:`${best.pa}타석`}`:'아직 없음'}; }
  if(O.k==='ext'){ const p=G.players[O.base.pid]; const ok=!!(p&&p.extNext); const gone=!p||p.team!==G.user; return {done:ok||end||gone,ok,txt:ok?'다년계약 합의':gone?'팀을 떠났습니다':'아직 합의 전'}; }
  void C; return {done:true,ok:false,txt:''}; }
function cwOrdDaily(){ const O=cwOrd(); if(!O)return; const e=cwOrdEval(O); if(!e.done)return; const t=team(G.user); O.st=e.ok?'ok':'fail'; O.end=G.day; O.txt=e.txt;
  if(e.ok){ t.trust=clamp(t.trust+2,0,100); cwRapAdd('own',3); mail('구단주실',`구단주 지시 달성: ${O.t}`,`${cwNm('own')}: "말한 대로 해냈군. 그런 단장이 좋소."\n\n${e.txt}. 구단주 신뢰 +2 · 구단주 친밀도 +3.`,{kind:'구단주'}); }
  else { t.trust=clamp(t.trust-1,0,100); mail('구단주실',`구단주 지시 미달: ${O.t}`,`${cwNm('own')}: "지난번에 한 말, 잊지는 않았겠지요."\n\n${e.txt}. 구단주 신뢰 -1.`,{kind:'구단주'}); }
  const h=cwSt().hist.find(z=>z.d===O.d0); if(h)h.ordRes=O.st; }
/* 홈 신뢰 설명용 한 줄 */
function cwOrdLine(){ const O=cwOrd(); if(!O)return ''; let e=null; try{ e=cwOrdEval(O); }catch(err){ return ''; } return `구단주 지시: ${O.t}(${dmd(O.until)}까지, 지금 ${e.txt})`; }
