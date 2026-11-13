/* ===== 코치 시장 경쟁 (사용자 11-08c: 스태프 경쟁과 뺏고 뺏기는 시장) =====
   1) AI 구단도 매달 1일 코치 시장에서 사람을 데려간다. 구단 위상(명성)과 돈(재정·시장 규모)이 좋은 구단이 좋은 코치를 먼저 잡는다.
      그래서 좋은 후보에는 '노리는 구단'이 붙고, 다음 달 1일 전에 잡지 않으면 그쪽으로 갈 수 있다.
   2) 비시즌(11~1월)에는 부유한 AI 구단이 다른 AI 구단 코치를 승격 조건으로 빼 간다.
   3) 11월 20일·12월 20일, 다른 구단이 우리 좋은 코치에게 영입 제안을 한다. 7일 안에 붙잡을지(연봉 맞추기·설득) 보낼지 정한다.
   4) 우리가 다른 구단 코치를 빼 오려 할 때 원 소속 구단이 역제안으로 붙잡을 수 있다. 며칠 안에 더 높은 조건으로 다시 제의하면 데려온다.
   눈에 띄는 이동은 리그 소식(wire)에 남는다 */
const CM_TIER={hc:4,pc:3,bc:3,fm:3,bp:2,ab:2,cc:2,rc:2,dc:2,cn:2,fp:1,fb:1,fd:1,fc:1};
const cmVal=c=>c?(c.sk||45)+(c.dv||45):80;
/* 코치가 어느 구단·보직 제안을 더 좋게 보는가: 스태프 공통 점수(연봉·구단 위상·야망·충성도) + 보직 승격 */
function cmScore(c,tid,sal,role,cur){ if(!c||typeof c!=='object'||!CKEYS.includes(c.role))return -Infinity; stAttr(c); return stScore(c,tid,sal,cur,coachLoyalty(c,tid))+((CM_TIER[role]||2)-(CM_TIER[c.role]||2))*14; }
/* AI 구단이 이 코치를 원할까: 그 자리 현직보다 확실히 낫고, 연봉을 감당할 수 있어야 한다 */
function cmCanPay(t,c,cur){ const P=stAiPlan(t); return (c.sal||0)<=Math.max(140,170+P.rich*90+(cur?cur.sal*.5:0)); }
function cmRivals(c){ if(!c||c.res===G.user||c.age>=66)return []; const out=[]; for(const t of G.teams){ if(t.id===ME()||(c.from===t.id&&c.fromY===G.year))continue; const C=G.coach&&G.coach[t.id]; if(!C)continue; const cur=C[c.role]; /* 월간 AI 영입(cmAiMonthly)이 실제로 데려갈 수 있는 구단만(검수 11-09zw #23) */
    if(cmVal(c)<cmVal(cur)+8||!cmCanPay(t,c,cur))continue; out.push({tid:t.id,v:cmScore(c,t.id,c.sal,c.role,false)}); }
  return out.sort((a,b)=>b.v-a.v).slice(0,3); }
/* 매달 1일: AI 구단 코치 영입. 비시즌에 활발하고, 리그 전체에서 한 달에 스타급(지도+육성 128 이상)은 두 명까지만 */
function cmAiMonthly(){ if(!G.coach||!G.cmarket)return []; const m=dobj(G.day).m, off=m>=11||m<=2; const moved=[]; let top=0;
  const ids=G.teams.map(t=>t.id).filter(id=>id!==ME()).sort(()=>R()-.5); /* 사임했으면 전 구단도 후임 단장이 채용(검수 11-09zw #20) */
  for(const tid of ids){ const t=team(tid), C=G.coach[tid]; if(!C||R()>(off?.55:.12))continue;
    let best=null; for(const c of G.cmarket){ if((typeof schMarketWhy==='function'&&schMarketWhy(c))||c.res===G.user||c.age>=66||(c.from===tid&&c.fromY===G.year)||(c.bid&&c.bid.exp>=G.day))continue; const cur=C[c.role]; const gain=cmVal(c)-cmVal(cur);
      if(gain<8||!cmCanPay(t,c,cur)||(top>=2&&cmVal(c)>=128))continue; const sc=gain*2+cmScore(c,tid,c.sal,c.role,false)*.3; if(!best||sc>best.sc)best={c,cur,sc}; }
    if(!best)continue; const {c,cur}=best; G.cmarket=G.cmarket.filter(x=>x!==c); if(cmVal(c)>=128)top++;
    if(cur){ staffHistory('coach',cur,'계약 종료',tid,'후임 코치 영입'); coachPaySev(tid,cur); /* 계약 중인 코치를 바꾸면 AI도 잔여 연봉 절반을 정산한다(검수 11-09zv #11) */ cur.yrs=0; cur.clan=null; cur.from=tid; cur.fromY=G.year; if(cur.age<64&&!cur.ob)G.cmarket.push(cur); }
    c.clan=null; delete c.res; staffCt(c,ri(1,3),off&&m>=11?G.year+1:G.year); C[c.role]=c; staffHistory('coach',c,'영입',tid,`${c.yrs}년 · 연 ${money(c.sal)}`); stAttr(c); c.loy=20; if(typeof schStaffJoined==='function')schStaffJoined(c,tid); try{ if(c.ob)obTaken(c.ob,c); }catch(e){}
    const txt=`${tshort(tid)}, ${CROLE[c.role].l}(으)로 ${c.name} 영입${c.star?' (스타 코치)':''}`; moved.push(txt); if(c.star||cmVal(c)>=122)try{ wire('코치',txt,{tid}); }catch(e){} }
  /* 비시즌: 부유한 구단이 다른 AI 구단 코치를 한 단계 높은 자리로 빼 간다 */
  if(m>=11||m<=1)for(const tid of ids){ const t=team(tid), P=stAiPlan(t); if(P.rich<.4||R()>.1)continue; const C=G.coach[tid]; const pool=[];
    for(const o of ids){ if(o===tid)continue; const OC=G.coach[o]; if(!OC)continue; for(const k in OC){ const c=OC[k]; const to=PROMO[k]; if(!c||!to||staffPending(c)||(c.clan&&G.mgr[o]&&c.clan===G.mgr[o].id))continue; /* 막 계약해 아직 합류 전인 코치는 빼 가지 않는다 */ if(cmVal(c)>=cmVal(C[to])+6)pool.push([o,k,to,c]); } }
    const tg=pool.sort((a,b)=>cmVal(b[3])-cmVal(a[3]))[0]; if(!tg)continue; const [o,k,to,c]=tg; const sal=round5(c.sal*1.2);
    if(cmScore(c,tid,sal,to,false)<=cmScore(c,o,c.sal*1.05,k,true))continue;
    const cur=C[to]; if(cur&&staffPending(cur))continue; /* 그 자리에 막 계약해 합류를 기다리는 코치가 있으면(같은 달 시장 영입 포함) 바로 밀어내지 않는다 */ if(cur){ staffHistory('coach',cur,'계약 종료',tid,'후임 코치 영입'); coachPaySev(tid,cur); cur.yrs=0; cur.clan=null; cur.from=tid; cur.fromY=G.year; if(cur.age<64&&!cur.ob)G.cmarket.push(cur); }
    G.coach[o][k]=obAiCoach(o,k,c.ob)||mkCoach(k); staffCt(G.coach[o][k],ri(1,3),G.year+1); c.role=to; coachSync(c); c.sal=sal; c.clan=null; c.from=o; c.loy=15; staffCt(c,2,G.year+1); C[to]=c; staffHistory('coach',{...c,role:k},'이적',o,`${tshort(tid)} ${CROLE[to].l}(으)로 승격 영입`); staffHistory('coach',c,'영입',tid,`${tshort(o)}에서 ${CROLE[to].l}(으)로 승격 · 연 ${money(sal)}`); staffHistory('coach',G.coach[o][k],'영입',o,`${c.name} 코치 이적에 따른 후임 선임`);
    const txt=`${tshort(tid)}, ${tshort(o)} ${CROLE[k].l} ${c.name}을(를) ${CROLE[to].l}(으)로 영입`; moved.push(txt); try{ wire('코치',txt,{tid}); }catch(e){} }
  return moved; }
/* 다른 구단이 우리 코치를 노린다(11월 20일·12월 20일). 감독 사단 코치는 감독 곁에 남는다 */
function cmRaid(){ if(G.unemp||!G.coach||!G.coach[G.user])return []; const C=G.coach[G.user], um=G.mgr[G.user]; G.cmRaid=G.cmRaid||[]; const out=[];
  const L=CKEYS.map(k=>[k,C[k]]).filter(([k,c])=>c&&cmVal(c)>=112&&!(um&&c.clan&&c.clan===um.id)&&!G.cmRaid.some(r=>r.id===c.id)).filter(([k,c])=>{ stAttr(c); return R()<clamp((cmVal(c)-105)/90,0,.5)*(c.amb/55)*(1-coachLoyalty(c,G.user)/150); });
  for(const [k,c] of L.slice(0,2)){ const opts=[]; for(const t of G.teams){ if(t.id===G.user)continue; const TC=G.coach[t.id]; if(!TC)continue; const to=PROMO[k]&&cmVal(TC[PROMO[k]])<cmVal(c)?PROMO[k]:k; if(to===k&&cmVal(TC[k])>=cmVal(c))continue; if(clubPrestige(t.id)<clubPrestige(G.user)-12&&to===k)continue; opts.push({t,to}); }
    if(!opts.length)continue; const {t,to}=pick(opts); const sal=round5(c.sal*(to!==k?1.2:rnd(1.25,1.4))); const r={id:c.id,role:k,tid:t.id,to,sal,exp:G.day+7,from:G.user}; G.cmRaid.push(r); out.push(r);
    mail('운영팀',`${tshort(t.id)}, 우리 ${CROLE[k].l} ${c.name}에게 영입 제안`,`${tname(t.id)}이(가) ${c.name}(기본 지도 ${dv(c.sk)} · 기본 육성 ${dv(c.dv)})에게 ${to!==k?`${CROLE[to].l} 자리(승격)와 `:''}연 ${money(sal)}을 제시했습니다(현재 ${money(c.sal)}).\n구단 위상: 우리 ${clubPrestige(G.user)} · ${tshort(t.id)} ${clubPrestige(t.id)}. ${staffLoyWord(coachLoyalty(c,G.user))}${coachSupportView(c,G.user).bonus>0?', 구단 연수 지원 인연도 있습니다':''}.\n\n7일 안에 답하지 않으면 본인이 결정합니다.`,
      {imp:true,kind:'코치',acts:[{l:`연봉 맞춰 붙잡기(연 ${money(sal)})`,a:'cmKeep',v:`${c.id}:1:${r.exp}`},{l:'조금 올려 설득(+10%)',a:'cmKeep',v:`${c.id}:0:${r.exp}`},{l:'보내 주기',a:'cmLet',v:`${c.id}::${r.exp}`}]}); }
  return out; }
function cmRaidFind(id){ return (G.cmRaid||[]).find(r=>r.id===id); }
/* 제안받은 코치: 제안받은 구단(from)에서 찾는다. 단장이 옮겨도 그 구단 코치의 일이고, 승격으로 보직이 바뀌어도 같은 사람이다(검수 11-09zv #13·14) */
function cmMine(r){ const C=G.coach&&G.coach[r.from??G.user]; const k=C&&CKEYS.find(k=>C[k]&&C[k].id===r.id); if(!k)return null; r.role=k; return C[k]; }
const cmOurs=r=>(r.from??G.user)===ME();
function cmLeave(r){ G.cmRaid=(G.cmRaid||[]).filter(x=>x!==r); const c=cmMine(r); if(!c)return ''; const TC=G.coach[r.tid]; if(!TC)return '';
  const fr=r.from??G.user; G.coach[fr][r.role]=null; const old=TC[r.to]; if(old){ coachPaySev(r.tid,old); staffHistory('coach',old,'계약 종료',r.tid,'후임 코치 영입'); old.yrs=0; old.clan=null; old.from=r.tid; old.fromY=G.year; if(old.age<64&&!old.ob)G.cmarket.push(old); }
  c.role=r.to; coachSync(c); c.sal=r.sal; c.clan=null; c.from=fr; c.loy=15; staffCt(c,2); TC[r.to]=c; staffHistory('coach',{...c,role:r.role},'이적',fr,`${tshort(r.tid)} ${CROLE[r.to].l}(으)로 영입`); staffHistory('coach',c,'영입',r.tid,`${tshort(fr)}에서 이적 · 연 ${money(r.sal)}`);
  try{ wire('코치',`${tshort(r.tid)}, ${tshort(fr)} ${CROLE[r.role].l} ${c.name} 영입${r.to!==r.role?` (${CROLE[r.to].l} 승격)`:''}`,{tid:r.tid}); }catch(e){} if(fr!==ME())return ''; addLog(`${CROLE[r.role].l} ${c.name}이(가) ${tname(r.tid)} ${CROLE[r.to].l}(으)로 떠났습니다.`); interimLeft(c); /* 감독대행이던 수석코치가 떠나면 대행을 다시 정한다(검수 11-09zv #7) */
  return `${c.name} 코치가 ${tshort(r.tid)} ${CROLE[r.to].l}(으)로 떠났습니다. ${CROLE[r.role].l} 자리가 비었습니다.`; }
/* full: 상대 연봉에 맞춘다(단장이 직접 붙잡아 +12). 아니면 10%만 올려 설득 */
function cmKeep(id,full){ const r=cmRaidFind(id); if(!r||G.unemp||!cmOurs(r))return '이미 끝난 일입니다.'; const c=cmMine(r); if(!c){ G.cmRaid=G.cmRaid.filter(x=>x!==r); return '이미 끝난 일입니다.'; }
  const sal=full?Math.max(c.sal,r.sal):round5(c.sal*1.1); const stay=cmScore(c,G.user,sal,r.role,true)+(full?12:0), go=cmScore(c,r.tid,r.sal,r.to,false);
  if(stay>=go){ c.sal=sal; staffHistory('coach',c,'잔류 계약',G.user,`타 구단 영입 제안 대응 · 연 ${money(sal)}`); c.loy=clamp((c.loy||20)+10,0,100); G.cmRaid=G.cmRaid.filter(x=>x!==r); addLog(`${CROLE[r.role].l} ${c.name}을(를) 연 ${money(sal)}에 붙잡았습니다.`); return `${c.name}: "믿어 주셔서 감사합니다. 남겠습니다." 연 ${money(sal)}.`; }
  return `${c.name}: "${r.to!==r.role?`${CROLE[r.to].l} 자리는 쉽게 오지 않는 기회라서요.`:'죄송합니다. 마음이 이미 기울었습니다.'}" `+cmLeave(r); }
function cmLet(id){ const r=cmRaidFind(id); return r&&cmOurs(r)?cmLeave(r):'이미 끝난 일입니다.'; }
/* 우리가 다른 구단 코치를 빼 올 때의 역제안: poachCoach가 성공 판정을 받은 뒤 원 소속 구단이 붙잡으려 할 수 있다 */
function cmCounter(tid,c,T){ const t=team(tid), P=stAiPlan(t); stAttr(c); if(T.ctr||cmVal(c)<110||P.rich<-.3)return null; if(R()>clamp(.25+P.rich*.1+(coachLoyalty(c,tid)-20)/200,.1,.5))return null;
  const keep=round5(c.sal*1.12); c.sal=keep; const need=round5(T.sal*1.15); (G.poachCtr=G.poachCtr||{})[c.id]={tid,need,exp:G.day+5,by:G.user,to:T.toRole}; /* 역제안은 그 구단·그 보직 제의에만(검수 11-09zv #15·16) */ t.rel=clamp((t.rel??50)-1,0,100);
  return `${tshort(tid)}이(가) ${c.name} 코치에게 연 ${money(keep)}로 역제안해 붙잡으려 합니다. ${dmd(G.day+5)}까지 연 ${money(need)}로 다시 제의하면 우리 쪽으로 옵니다.`; }
function cmCtrOf(c){ const X=G.poachCtr&&c&&G.poachCtr[c.id]; return X&&X.exp>=G.day?X:null; }
/* 매일: 코치 시장 경쟁 */
/* 같은 은퇴 선수(OB)에서 나온 코치가 두 구단에 동시에 있으면(예전 빼 오기 버그로 생긴 저장본) 우리 쪽을 남기고 다른 구단 쪽은 새 코치로 바꾼다(사용자 11-11) */
function coachDedupe(){ if(!G.coach)return 0; const seen=new Map(); let n=0; const ids=[G.user,...G.teams.map(t=>t.id).filter(x=>x!==G.user)];
  for(const tid of ids){ const C=G.coach[tid]; if(!C)continue; for(const k of CKEYS){ const c=C[k]; if(!c||!c.ob)continue; if(!seen.has(c.ob)){ seen.set(c.ob,c); continue; } if(seen.get(c.ob)===c)continue; if(tid===G.user&&!G.unemp)continue;
    const r=mkCoach(k); staffCt(r,ri(1,2)); C[k]=r; n++; } } return n; }
function cmDaily(){ try{ coachDedupe(); }catch(e){} try{ mgrReqDaily(); }catch(e){} try{ ownReqDaily(); }catch(e){} try{ schDaily(); }catch(e){} if(!G.coach)return; const o=dobj(G.day);
  if(o.d===1)try{ cmAiMonthly(); }catch(e){}
  if((o.m===11||o.m===12)&&o.d===20)try{ cmRaid(); }catch(e){}
  for(const r of (G.cmRaid||[]).filter(r=>r.exp<G.day)){ const c=cmMine(r); if(!c){ G.cmRaid=G.cmRaid.filter(x=>x!==r); continue; } const mine=cmOurs(r); /* 단장이 떠나도 제안은 그 구단에서 기한에 본인이 정한다(검수 11-09zv #14) */
    if(cmScore(c,r.from??G.user,c.sal,r.role,true)>=cmScore(c,r.tid,r.sal,r.to,false)){ G.cmRaid=G.cmRaid.filter(x=>x!==r); if(mine)note('코치',`${c.name} 코치는 고민 끝에 남기로 했습니다.`); } else { const s=cmLeave(r); if(mine)note('코치',s); } }
  if(G.poachCtr)for(const k in G.poachCtr)if(G.poachCtr[k].exp<G.day)delete G.poachCtr[k]; }
/* 옛 저장: AI 구단 스카우트가 4명보다 적으면 채운다(스카우트 정원이 늘었다) */
function stFill(){ if(!G.lgStaff)return 0; let n=0; for(const tid in G.lgStaff){ const L=G.lgStaff[tid]; if(!L||!team(+tid))continue; while(L.sc.length<ST_SC_N[0]){ const s=stAttr(mkScout(ri(1,2))); s.loy=ri(20,50); L.sc.push(s); n++; } stSync(+tid); } return n; }
/* 효과: 컨디셔닝코치 지도력이 부상 위험을 조금 줄인다(±5% 안). 빈자리면 약간 늘어난다 */
function coachCondMult(tid){ if(tid==null||!G.coach)return 1; const C=coachesOf(tid); const v=k=>C[k]?effC(C[k],tid,'sk'):C[k]===undefined?55:45; return clamp(1-(v('cn')*.75+v('rh')*.25-55)/500,.95,1.04); } /* 재활군 코치가 25% 몫 */
/* 무작위로 만든 코치·감독도 선수 출신처럼 보이게(초기 세계·후보가 모자랄 때만 만든다) */
function exCareer(role){ const pos=['pc','fp','bp','rs'].includes(role)?pick(['투수','투수','불펜 투수']):['cc','fc'].includes(role)?'포수':pick(['내야수','외야수','내야수']); let t=''; try{ t=G&&G.teams&&G.teams.length?tshort(pick(G.teams).id)+' ':''; }catch(e){} return `전 ${t}${pos}(통산 ${ri(3,15)}시즌)`; }
