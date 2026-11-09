/* ===== 사람 순환: 짧게 뛰고 떠난 선수·물러난 감독도 야구계에 남는다 =====
   KBO 관행: 1군 경력이 짧은 20대 후반~30대 초 은퇴·방출 선수 상당수가 아마추어(고교·대학·독립리그) 코치, 2군·잔류군 코치,
   스카우트, 전력분석원·운영팀으로 야구계에 남는다. 다만 근거 있는 비율이 없어 보수적으로 3명 중 1명(35%)만 남기고
   나머지는 레슨장·일반 직장 등 게임 밖으로 떠난 것으로 본다. 1군 지도자(정식 1군 보직)는 짧은 경력 OB에게 열지 않는다.
   미지명 신인은 기존처럼 대학·독립리그 진학으로 보고 지운다(고졸 미지명이 바로 지도자가 되는 경우는 드물다). */
const OB_MINOR_P=.35, OB_MINOR_MAX=150, OB_MINOR_WAIT=5;
/* 짧은 경력 은퇴 선수를 OB로 남길까: 국내 선수, 37세 이하만 */
function obMinorOk(p){ return !p.foreign&&(p.age||0)<=37&&R()<OB_MINOR_P; }
/* obFromPlayer 끝에서: 소속이 비어 있으면(무적 선수 은퇴) 마지막 구단으로 채우고, 짧은 경력 OB는 길을 다시 정한다 */
function obCycle(ob,p){ if(!ob)return ob;
  if(ob.team==null){ const h=(p.hist||[]).filter(x=>x.t!=null); const t=p.relT??p.faFrom??(h.length?h[h.length-1].t:null); if(t==null||!team(t)){ G.ob=G.ob.filter(o=>o!==ob); return null; } ob.team=t; ob.mine=t===G.user; } /* 무적 선수로 은퇴하면 소속이 비어 '- 출신'이 되던 문제 */
  if(!(ob.seasons<5&&ob.war<5&&!(ob.mine&&ob.ys>=3)))return ob;
  ob.minor=true; const yrs=new Set((p.hist||[]).filter(x=>x.t===ob.team).map(x=>x.y)).size; /* 2군만 뛰었어도 몸담은 해 */
  ob.tys=ob.tys||{}; if(!ob.tys[ob.team]||!ob.tys[ob.team].ys)ob.tys[ob.team]={ys:Math.max(1,yrs),war:(ob.tys[ob.team]||{}).war||0};
  ob.ys=Math.max(ob.ys,ob.tys[ob.team].ys); ob.mine=ob.team===G.user; if(ob.mine)ob.bond=10;
  const x=R(); ob.path=x<.4?'coach':x<.65?'scout':'front'; ob.aim=ob.path==='front'&&ob.pers.amb>=15?'gm':null; ob.sc=clamp(ob.sc-1,1,3); ob.fame=Math.min(ob.fame,40);
  ob.readyY=ob.retY+(ob.path==='coach'&&R()<.3?1:0);
  if(ob.path==='coach')ob.am=ob.school&&R()<.5?`모교 ${ob.school} 코치`:pick(['대학 야구부 코치','독립리그 코치','유소년 야구단 코치']);
  if(ob.path==='front'){ const L=G.teams.filter(t=>t.id!==G.user).map(t=>t.id); const tid=ob.team!==G.user&&R()<.6?ob.team:pick(L); ob.alt={k:'front',tid,t:`${tshort(tid)} ${R()<.65?'전력분석원':'운영팀'}`}; }
  ob.log.push({y:G.year,t:ob.alt?ob.alt.t:ob.am||'스카우트의 길'}); return ob; }
/* 코치 후보의 '젊은 지도자' 자리: 자리를 찾는 짧은 경력 OB가 있으면 그 사람을(우리 구단 출신 먼저) */
function obYoungCoach(k){ try{ if(!G.ob)return null; const L=obCands('coach',true).filter(o=>o.minor&&o.age>=27&&!(G.cmarket||[]).some(c=>c.ob===o.id)); if(!L.length)return null;
  const ob=L.find(obMine)||pick(L); const c=obCoach(ob); c.role=k; c.ab=obAb(ob,k); coachSync(c); c.car=`${tshort(ob.team)} ${ob.pos} 출신 · ${ob.am||'은퇴 뒤 지도자 연수'}`; c.sal=round5(Math.max(40,c.sal*.7)); return c; }catch(e){ return null; } }
/* 겨울 정리: 5년 넘게 자리를 못 찾은 짧은 경력 OB는 야구계를 떠난다. 그래도 150명을 넘으면 오래 쉰 사람부터 */
function obMinorPrune(){ if(!G.ob)return; const idle=o=>{ const k=obWhere(o).k; return k==='free'||k==='wait'; };
  const gone=new Set(G.ob.filter(o=>o.minor&&idle(o)&&G.year-o.retY>=OB_MINOR_WAIT&&!obMine(o)).map(o=>o.id));
  const M=G.ob.filter(o=>o.minor&&!gone.has(o.id)); if(M.length>OB_MINOR_MAX)M.filter(idle).sort((a,b)=>a.retY-b.retY).slice(0,M.length-OB_MINOR_MAX).forEach(o=>gone.add(o.id));
  if(!gone.size)return; G.ob=G.ob.filter(o=>!gone.has(o.id)); G.cmarket=(G.cmarket||[]).filter(c=>!gone.has(c.ob)); G.scoutMarket=(G.scoutMarket||[]).filter(s=>!gone.has(s.ob)); }
/* 물러난 감독: 1년 이상 쉬고 감독 시장에 다시 나온다(KBO에서 경질된 감독의 재기용은 흔하다). 12명·68세·5년까지만 기억한다 */
function exMgrAdd(m,tid){ if(!m||m.interim||m.act||m.ob||!m.name)return; const L=G.exMgr=(G.exMgr||[]).filter(x=>x.id!==m.id);
  const tag=`전 ${tshort(tid)} 감독`; if(!String(m.career||'').includes(tag))m.career=(m.career?m.career+' · ':'')+tag; m.exT=tid; m.exY=G.year; L.unshift(m); if(L.length>12)L.length=12; }
function exMgrMarket(){ if(!G.exMgr)return; const on=new Set(Object.values(G.mgr||{}).filter(Boolean).map(m=>m.id));
  G.exMgr=G.exMgr.filter(m=>!on.has(m.id)&&(m.age||0)<68&&G.year-m.exY<=5);
  for(const m of G.exMgr.filter(m=>G.year-m.exY>=1).slice(0,2)){ if(G.mmarket.some(x=>x.id===m.id))continue; for(const k of ['plv','pl','hD','rel','yrs','cs','ce','jy','extY'])delete m[k]; m.clan=mkClan(m); G.mmarket.push(m); } }
