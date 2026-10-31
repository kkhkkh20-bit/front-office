/* ===== 전력 슬롯 비교와 추천 트레이드 ===== */
const PSLOTS=['C','1B','2B','3B','SS','LF','CF','RF','DH','SP','RP'];
const SLOTK={C:'포수','1B':'1루수','2B':'2루수','3B':'3루수',SS:'유격수',LF:'좌익수',CF:'중견수',RF:'우익수',DH:'지명타자',SP:'선발진',RP:'불펜',P:'투수'};
function slotOf(tid){ const d=depth(tid); const o={}; for(const k of PSLOTS.slice(0,9)){ const p=d.ln[k]; o[k]={ps:p?[p]:[],v:p?posScore(p,k):30}; }
  const sp=d.sp.slice(0,5), rp=d.pen.slice(0,4); o.SP={ps:sp,v:sp.length?avg(sp.map(spV))*(Math.min(5,sp.length)/5):30}; o.RP={ps:rp,v:rp.length?avg(rp.map(penV)):30}; return o; }
let _slC={k:null};
function leagueSlots(){ const k=G.year+':'+G.day+':'+(G.trades||[]).length+':'+Object.values(G.players).filter(p=>p.team===G.user).length; if(_slC.k===k)return _slC.v; const v=G.teams.map(t=>slotOf(t.id)); _slC={k,v}; return v; }
/* 트레이드 마감 주간: 사는 구단(상위권의 약한 자리)과 파는 구단(하위권의 베테랑) 루머 */
function deadlineRumors(quiet){ const st=standingsNow(); const buyers=st.slice(0,5).map(x=>x.tid).filter(t=>t!==G.user); const sellers=st.slice(6).map(x=>x.tid).filter(t=>t!==G.user);
  const L=[]; for(const t of buyers.slice(0,3)){ const rk=slotRanks(t); const weak=PSLOTS.filter(k=>k!=='DH').sort((a,b)=>rk[b].rank-rk[a].rank)[0]; if(weak&&rk[weak].rank>=6)L.push(`${tshort(t)}(${st.findIndex(x=>x.tid===t)+1}위)은(는) ${SLOTK[weak]} 보강을 노립니다`); }
  for(const t of sellers.slice(0,3)){ const v=domestic(t).filter(p=>p.age>=29&&ovr(p)>=54&&!p.ys).sort((a,b)=>ovr(b)-ovr(a))[0]; if(v){ v.aiListed=true; L.push(`${tshort(t)}은(는) ${v.name}(${posLabel(v)}, ${v.age}세)을(를) 시장에 내놓을 수 있습니다`); } }
  if(!L.length)return; news('트레이드',`트레이드 마감 앞두고 시장 꿈틀`,L.join('. ')+'.',0); if(!quiet)note('트레이드',`마감 주간 시장 소식: ${L.join('. ')}. 트레이드 → 추천·선수 찾기에서 해당 구단을 살펴보세요.`); }
/* 마감 2주 전: 단장이 올해 방향(보강·유지·정리)을 정한다. 순위와 남은 경기로 부단장이 상황을 정리해 준다 */
function deadlineDecision(){ if(G.dline&&G.dline.y===G.year)return; const st=standingsNow(); const rk=st.findIndex(x=>x.tid===G.user)+1; const r=G.sea.rec[G.user]; const gb5=(()=>{ const f=st[4]; return ((f.w-f.l)-(r.w-r.l))/2; })();
  const vets=domestic(G.user).filter(p=>p.age>=30&&ctrlYears(p)<=1&&ovr(p)>=52&&!p.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,3);
  const sit=`${r.w}승 ${r.l}패로 ${rk}위입니다. ${rk<=5?`가을야구 안쪽입니다(6위와 ${(((r.w-r.l)-(st[5].w-st[5].l))/2).toFixed(1)}경기 차).`:`5위와 ${gb5.toFixed(1)}경기 차입니다.`} 7월 31일 트레이드 마감 전에 올해 방향을 정해 주세요. ${vets.length?`계약이 올해로 끝나는 베테랑: ${vets.map(p=>`${p.name}(${posLabel(p)}, ${p.age}세)`).join(', ')}.`:''}`;
  evNew('dline',`트레이드 마감 방향: ${rk}위`,sit,[
    {l:'보강한다',fx:'부단장이 약한 자리 보강안을 바로 올립니다. 팬 여론 +2. 성적 우선 구단주는 반기지만, 유망주를 내줄 각오가 필요합니다.'},
    {l:'지금 전력으로 간다',fx:'변화 없이 시즌을 이어갑니다.'},
    {l:'정리한다',fx:`올해 계약이 끝나는 베테랑을 급매물로 내놓습니다. 팬 여론 -3. 수익 우선 구단주는 반깁니다.`}],{from:'부단장',data:{rk,vets:vets.map(p=>p.id)},def:1,exp:7}); }
EVH.lead=EVH_LEAD;
EVH.dline={ pick(e,i){ const t=team(G.user); G.dline={y:G.year,mode:['buy','hold','sell'][i]};
  if(i===0){ G.pr.fan=clamp(G.pr.fan+2,0,100); if(t.owner==='win')t.trust=clamp(t.trust+2,0,100); let L=[]; try{ L=tradeSuggest(true).slice(0,3); }catch(err){}
    if(L.length)mail('부단장','마감 보강안',`보강 방향으로 정리했습니다. 상대가 받아들일 만한 조건입니다.\n\n${L.map(x=>{ const q=G.players[x.id]; return q?`${SLOTK[x.k]||''} 보강: ${q.name}(${tshort(x.tid)}, ${posLabel(q)}) 영입 · 내줄 선수 ${x.give.map(id=>G.players[id]?G.players[id].name:'').join(', ')}`:''; }).filter(Boolean).join('\n')}\n\n홈의 전력 요약나 트레이드 센터에서 바로 제안할 수 있습니다.`,{kind:'트레이드',imp:true,acts:[{l:'트레이드 센터',a:'go',v:'trade:market'}]});
    return `팬 여론 +2.${t.owner==='win'?' 구단주 신뢰 +2.':''} 부단장이 보강안을 올렸습니다.`; }
  if(i===1)return '현재 전력으로 시즌을 이어갑니다.';
  const ids=(e.data.vets||[]).filter(id=>G.players[id]&&G.players[id].team===G.user); for(const id of ids){ const p=G.players[id]; p.listed=true; p.urgent=true; }
  G.pr.fan=clamp(G.pr.fan-3,0,100); if(t.owner==='profit')t.trust=clamp(t.trust+2,0,100);
  return `${ids.length?ids.map(id=>G.players[id].name).join(', ')+'을(를) 급매물로 내놓았습니다. ':''}팬 여론 -3.${t.owner==='profit'?' 구단주 신뢰 +2.':''}`; } };
function slotRanks(tid){ const L=leagueSlots(); const out={}; for(const k of PSLOTS){ const vs=L.map((s,i)=>({i,v:s[k].v})).sort((a,b)=>b.v-a.v); out[k]={rank:vs.findIndex(x=>x.i===tid)+1,v:L[tid][k].v,ps:L[tid][k].ps}; } return out; }
function rankWith(k,v){ return leagueSlots().filter((s,i)=>i!==G.user&&s[k].v>v).length+1; }
function myCoreIds(){ const d=depth(G.user); return new Set([...d.start,...d.sp.slice(0,3),...d.pen.slice(0,1)].map(p=>p.id)); }
function buildPackage(t,p,core){ const v=tval(t,p,'out'); const need=tradeNeed(t,v)-(p.aiListed?1.5:0); const target=v+need+.3;
  const pool=domestic(G.user).filter(q=>!q.ys&&!core.has(q.id)&&healthy(q)&&!(q.joinY>G.year)).map(q=>({q,v:tval(t,q,'in')})).filter(x=>x.v>.2).sort((a,b)=>a.v-b.v);
  let best=null,bo=1e9; for(let i=0;i<pool.length;i++){ if(pool[i].v>=target&&pool[i].v-target<bo){ bo=pool[i].v-target; best=[pool[i].q.id]; } for(let j=i+1;j<pool.length;j++){ const sm=Math.max(pool[i].v,pool[j].v)+.72*Math.min(pool[i].v,pool[j].v); if(sm>=target&&sm-target<bo-.6){ bo=sm-target+.6; best=[pool[i].q.id,pool[j].q.id]; } } }
  if(!best)return null; const e=evalTrade(t.id,best,[p.id]); if(!e.ok||e.theirN>ROSTER_MAX||e.theirN<ROSTER_MIN)return null; if(e.theirPay>capOf(G.year)&&e.theirPay>capPay(t.id))return null;
  if(rosterN(G.user)-best.length+1>ROSTER_MAX)return null; return best; }
function tsugValid(s){ const p=G.players[s.id]; if(!(p&&p.team===s.tid&&s.give.every(id=>G.players[id]&&G.players[id].team===G.user)))return false; return evalTrade(s.tid,s.give,[s.id]).ok; }
/* 조건부 영입 요청: 자리·유형·나이·연봉 조건으로 스카우트가 후보를 추린다. 능력 순이 아니라 조건과 팀 사정으로 설명한다 */
const RTYPE={now:'즉시 전력',cheap:'저비용',grow:'성장형'};
function recruitReport(c){ const k=c.k; const rk=slotRanks(G.user)[k]; const d=depth(G.user); const core=myCoreIds();
  const base=k==='SP'?(d.sp.slice(0,5).length<5?30:Math.min(...d.sp.slice(0,5).map(spV))):k==='RP'?(d.pen.slice(0,4).length<4?30:Math.min(...d.pen.slice(0,4).map(penV))):rk.v;
  const fits=p=>k==='SP'?p.isP&&isSPr(p):k==='RP'?p.isP:!p.isP&&(p.pos===k||subsOf(p).includes(k));
  const C=[]; for(const t of G.teams){ if(t.id===G.user)continue; for(const p of domestic(t.id)){ if(p.ys||(p.joinY>G.year)||!fits(p))continue; if(c.age&&p.age>c.age)continue; if(c.sal&&p.sal>c.sal)continue;
      const now=slotGain(k,p)-base; const rp=scoutReport(p); const fut=(rp.ofp??rp.cur)-(rk.v||40);
      let sc=c.type==='now'?now:c.type==='cheap'?now-p.sal/150:(p.age<=25?fut*1.2+(25-p.age)*.6:-99);
      if(c.type!=='grow'&&now<1)continue; if(c.type==='grow'&&(p.age>25||fut<2))continue; C.push({p,t,now,fut,rp,sc}); } }
  C.sort((a,b)=>b.sc-a.sc); const out=[]; const open=tradeOpen();
  const fl=[]; for(const x of C.slice(0,30)){ if(out.length>=3)break; const give=open?buildPackage(x.t,x.p,core):null; if(open&&!give){ fl.push(x); continue; }
    const why=[]; const r1=k==='SP'||k==='RP'?null:rankWith(k,slotGain(k,x.p));
    if(c.type==='now')why.push(`지금 우리 ${SLOTK[k]}보다 ${Math.round(x.now)}만큼 낫습니다${r1?`(리그 ${rk.rank}위 → ${r1}위)`:''}.`);
    if(c.type==='cheap')why.push(`연봉 ${money(x.p.sal)}으로 우리 ${SLOTK[k]}보다 ${Math.round(x.now)}만큼 낫습니다.`);
    if(c.type==='grow')why.push(`${x.p.age}세, ${x.rp.ofp!=null?`${potTier(potVal(x.rp),x.rp.cur).l}(${x.rp.who||'스카우트'} 전망)`:'잠재력은 아직 관찰이 부족합니다'}. 지금 능력 ${dv(x.rp.cur)}.`);
    const h=curLine(x.p); if(h)why.push(x.p.isP?(h.outs?`${yrTag(h)} ${ipStr(h.outs)}이닝 ERA ${pRate(h).era.toFixed(2)}`:''):(h.pa?`${yrTag(h)} ${h.pa}타석 OPS ${fmt3(bRate(h).ops)}`:''));
    if(x.p.listed||x.p.aiListed)why.push(`${tshort(x.t.id)}이(가) 트레이드 매물로 내놓은 선수입니다.`);
    const cost=`연봉 ${money(x.p.sal)} · ${ctText(x.p)}`;
    const cur=k==='SP'?d.sp[4]:k==='RP'?d.pen[3]:d.ln?d.ln[k]:null; const push=cur&&cur.id!==x.p.id?cur:null;
    const blk=playersOf(G.user).filter(q=>!q.foreign&&q.age<=24&&fits(q)&&(scoutReport(q).ofp||0)>=52).sort((a,b)=>(scoutReport(b).ofp||0)-(scoutReport(a).ofp||0))[0]||null;
    out.push({id:x.p.id,tid:x.t.id,give:give||[],why:why.filter(Boolean),cost,push:push?push.id:null,blk:blk?blk.id:null,k}); }
  let hint=''; if(!out.length){ const TN=RTYPE[c.type]||'요청'; const lim=[c.age?`${c.age}세 이하`:'',c.sal?`연봉 ${money(c.sal)} 이하`:''].filter(Boolean).join('·');
    if(!C.length){ hint=c.type==='grow'?`25세 이하이면서 우리 ${SLOTK[k]}보다 크게 자랄 것으로 보이는 선수가 다른 구단에 없습니다${lim?`(${lim} 조건 포함)`:''}. 관찰을 이어가며 겨울에 다시 보겠습니다.`
        :`지금 우리 ${SLOTK[k]}(리그 ${rk.rank}위)보다 나은 선수가 다른 구단에 없습니다${lim?`(${lim} 조건 포함)`:''}.${rk.rank<=3?' 이미 리그 상위권 자리라 보강 여지가 작습니다.':lim?' 조건을 하나 풀면 후보가 생길 수 있습니다.':''}`; }
    else if(!open){ hint=`${TN} 후보 ${C.length}명은 있지만 지금은 트레이드 기간이 아닙니다.`; }
    else { const x=fl[0]; const nmx=`${x.p.name}(${tshort(x.t.id)})`; const g2=buildPackage(x.t,x.p,new Set()); const coreIn=g2?g2.filter(id=>core.has(id)).map(id=>G.players[id]&&G.players[id].name).filter(Boolean):[];
      hint=`${TN} 후보 ${C.length}명은 있습니다(예: ${nmx}). 하지만 우리 핵심 선수를 빼고는 상대 요구를 맞출 수 없습니다.${coreIn.length?` ${coreIn.join(', ')}을(를) 넣으면 ${tshort(x.t.id)}이(가) 검토합니다.`:' 핵심 선수를 넣어도 맞추기 어렵습니다.'}${C.length>1?` 다른 후보 ${Math.min(C.length,30)-1}명도 같은 이유로 묶음이 맞지 않았습니다.`:''}`; } }
  return {list:out,hint,open,rank:rk.rank}; }
function slotGain(k,p){ return k==='SP'?spV(p):k==='RP'?penV(p):posScore(p,k); }
function tradeSuggest(force,only){ if(!tradeOpen())return [];
  const key='v5:'+(G.trades||[]).length+':'+(only||'')+':'+playersOf(G.user).map(p=>p.id).reduce((a,b)=>(a*31+b)%1000003,7);
  if(!force&&G.tsug&&G.tsug.key===key&&G.tsug.day>G.day-7){ const L=G.tsug.list.filter(tsugValid); if(L.length||G.tsug.day===G.day)return L; }
  const rk=slotRanks(G.user); const d=depth(G.user); const core=myCoreIds(); const seed=(G.tsugN=(G.tsugN||0)+(force?1:0));
  const needs=(only?[only]:PSLOTS.filter(k=>k!=='DH')).map(k=>({k,...rk[k]})).filter(x=>only||x.rank>=5).sort((a,b)=>b.rank-a.rank).slice(0,3);
  let out=[];
  for(const nd of needs){ const k=nd.k; const cands=[];
    const base=k==='SP'?(d.sp.slice(0,5).length<5?30:Math.min(...d.sp.slice(0,5).map(spV))):k==='RP'?(d.pen.slice(0,4).length<4?30:Math.min(...d.pen.slice(0,4).map(penV))):nd.v;
    for(const t of G.teams){ if(t.id===G.user)continue; for(const p of domestic(t.id)){ if(p.ys||!healthy(p))continue;
      if(k==='SP'){ if(!p.isP||!isSPr(p))continue; } else if(k==='RP'){ if(!p.isP)continue; } else { if(p.isP||(p.pos!==k&&!subsOf(p).includes(k)))continue; }
      const up=slotGain(k,p)-base; if(up<3)continue; cands.push({p,t,up:up+hn('ts'+seed,p.id)*1.5}); } }
    cands.sort((a,b)=>b.up-a.up); let n=0;
    for(const c of cands.slice(0,24)){ if(n>=(only?3:1))break; if(out.some(x=>x.id===c.p.id))continue; const pk=buildPackage(c.t,c.p,core); if(!pk)continue;
      const U=team(G.user); const ud=stackIn([tval(U,c.p,'in')])-sum(pk.map(id=>tval(U,G.players[id],'out'))); if(ud<-4)continue;
      const nv=k==='SP'||k==='RP'?null:slotGain(k,c.p); out.push({k,id:c.p.id,tid:c.t.id,give:pk,rank0:nd.rank,rank1:nv!=null?rankWith(k,nv):null}); n++; } }
  /* 최근 1군 성적이 바닥인 선수는 추천하지 않는다(표본 100타석·30이닝 이상) */
  const badRecent=q=>{ const y=G.year; const h=seasonTotal(q,y,'1군'); const h0=seasonTotal(q,y-1,'1군'); const x=h&&(q.isP?h.outs>=90:h.pa>=100)?h:h0&&(q.isP?h0.outs>=90:h0.pa>=100)?h0:null; if(!x)return false; return q.isP?pRate(x).era>=6.5:bRate(x).ops<.6; };
  out=out.filter(s=>{ const q=G.players[s.id]; return q&&!badRecent(q); });
  G.tsug={day:G.day,key,list:out}; return out; }
/* 잦은 트레이드는 선수단을 흔든다 */
function churnCheck(){ const n=(G.trades||[]).filter(t=>t.y===G.year&&t.d!=null&&t.d>G.day-30).length; if(n<3)return;
  G.form={until:G.day+14,b:-.5}; const m=G.mgr[G.user]; if(m)m.rel=clamp(m.rel-3,0,100); for(const p of playersOf(G.user))p.mor=clamp((p.mor??60)-2,0,100);
  news('선수',`${tshort(G.user)}, 한 달 새 트레이드 ${n}건… 선수단 어수선`,`잇단 트레이드로 선수들 사이에 "다음은 누구냐"는 말이 나옵니다.`,-1);
  stop('감독',`한 달 사이 트레이드가 ${n}건입니다. 선수단이 어수선해 2주간 팀 분위기가 떨어지고, 감독 관계 -3, 선수 기분 -2입니다.`); }
function findPackages(pid){ const p=G.players[pid]; if(!p||p.team==null||p.team===G.user)return []; const t=team(p.team); const out=[]; const used=new Set(); let core=myCoreIds();
  for(let i=0;i<4&&out.length<3;i++){ const ex=new Set([...core,...used]); const pk=buildPackage(t,p,ex); if(!pk){ if(core.size){ core=new Set(); continue; } break; } out.push(pk); pk.forEach(id=>used.add(id)); }
  return out; }
function marketFor(pid){ const p=G.players[pid]; if(!p)return []; const out=[]; const U=team(G.user);
  for(const T of G.teams){ if(T.id===G.user)continue; const v=tval(T,p,'in'); const budget=v-tradeNeed(T,v*.6); if(budget<1)continue; const give=pickPackage(T.id,budget,'any'); if(!give)continue; if(!evalTrade(T.id,[pid],give).ok)continue;
    out.push({tid:T.id,give,u:stackIn(give.map(id=>tval(U,G.players[id],'in')))}); }
  return out.sort((a,b)=>b.u-a.u).slice(0,4); }
function sellSuggest(){ const core=myCoreIds(); const cont=G.teams.filter(t=>t.id!==G.user);
  return domestic(G.user).filter(p=>!p.ys&&!p.listed&&!core.has(p.id)&&healthy(p)&&!(p.joinY>G.year)&&p.age>=26).map(p=>{ let best=null; for(const t of cont){ const tv=tval(t,p,'in'); const v=tv-tradeNeed(t,0); if(!best||v>best.v)best={t,v}; } return {p,v:best?best.v:0,t:best&&best.t}; })
    .filter(x=>x.v>=1.5).sort((a,b)=>b.v-a.v).slice(0,3); }

