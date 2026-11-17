/* ===== 사람을 따라 움직이는 스태프(사용자 11-16: 좋아하는 감독·단장이 떠나면 같이 나가고, 새 자리로 따라가기도 한다) =====
 1) 감독 사단은 자라고 줄어든다(겨울마다 clanYear, 우리·AI 같음):
    - 같은 감독 밑에서 2시즌 넘게 일하고 감독과의 사이가 CLAN_JOIN(12, '좋아하는 인물' 기준) 이상이면 해마다 30%(고집 센 감독은 20%)로 사단에 든다. 사단 크기는 감독 명성에 따라 2~5명.
    - 사이가 CLAN_DROP(-5) 이하로 나빠지면 50%로 사단에서 빠진다. 감독과 떨어져 2시즌이 지나면 사단 표시가 없어진다.
    - 감독과의 사이 = 인물 관계(84b_person_rels, 함께 일하면 해마다 +3, 사단이면 +5) + 두 사람 궁합(±10, 고정) + 감독 관계(staffRel 'mgr', 50 기준).
 2) 감독이 떠나면(경질·사퇴·계약 만료·은퇴·AI 교체) 사단 코치는 사이·구단 애착에 따라 20~85%로 함께 사임한다(잔여 연봉 절반 정산, 예전과 같음).
    68세 미만 감독을 따라 나간 코치는 코치 시장에 남아(다른 구단도 영입 가능, 시장 정리에서는 빠지지 않음) 2시즌까지 그 감독을 기다린다.
    그 감독이 새 구단에 부임하면 아직 시장에 있는 사람이 사단으로 함께 간다(AI는 mgrNew·계약 만료 교체, 우리는 '사단과 계약').
 3) 단장이 떠나면 그 단장을 크게 좋아하는 코치·스카우트·분석원이 구단당 LOY_N(2)명까지 사임한다. 감독 사단 코치·합류 전 코치는 남는다.
    AI 단장(경질·교체): 인물 관계 12(좋아하는 인물 기준) 이상, 확률 (관계-8)/60, 최대 30%. 우리 단장(이직·경질·사임·계약 만료): 단장 관계 72 이상, 확률 (관계-65)/100, 최대 35%.
    그 단장이 400일 안에 새 구단을 맡으면 아직 시장에 있는 사람 LOY_N명까지 따라온다. AI는 같은 영입 규칙(자리·연봉 여력·정원)으로 바로, 우리 단장은 결정 메일로 묻는다.
 능력치는 바꾸지 않는다(사단 보정은 원래 있던 +6). 무작위는 겨울·인사 때만 R()로 쓴다 */
const CLAN_JOIN=12, CLAN_DROP=-5, CLAN_SEP=2, CLAN_WAIT=2, LOY_N=2, LOY_DAYS=400;
const clanMgrOk=m=>!!(m&&m.id&&!m.interim&&!m.act);
function clanCap(m){ const f=(m&&m.fame)||0; return f>=80?5:f>=70?4:f>=55?3:2; }
/* 코치와 감독 사이(-100~100 안팎). 조회만 한다 */
/* 궁합: 두 사람마다 정해진 값(±10, 난수 흐름을 쓰지 않는다) */
function clanChem(a,b){ return a&&b?Math.round((relU('clanchem',a+'|'+b)-.5)*20):0; }
function clanBond(c,m,tid){ if(!c||!clanMgrOk(m))return 0; let v=0, s=50; try{ const a=relKeyOf(m,'mgr'), b=relKeyOf(c,'coach'); v=a&&b?relVal(a,b)+(c.clan===m.id?Math.max(0,clanChem(a,b)):clanChem(a,b)):0; }catch(e){} try{ s=G.mgr[tid]===m?staffRel(c,tid,'mgr'):50; }catch(e){} return Math.round((v||0)+((s??50)-50)); }
function clanBondWord(v){ return v>=30?'감독과 아주 가깝습니다':v>=CLAN_JOIN?'감독과 사이가 좋습니다':v>CLAN_DROP?'감독과 무난한 사이입니다':v>=-20?'감독과 서먹합니다':'감독과 껄끄럽습니다'; }
function mgrNameOf(id){ if(!id)return ''; const m=Object.values(G.mgr||{}).find(x=>x&&x.id===id)||(G.exMgr||[]).find(x=>x.id===id)||(G.mmarket||[]).find(x=>x.id===id); return m?m.name:''; }
/* 코치 카드 한 줄: [말, 설명] */
function clanCoachWord(c,tid){ const m=G.mgr&&G.mgr[tid]; if(!c)return null;
  if(!clanMgrOk(m)){ const n=c.clan&&mgrNameOf(c.clan); return n?[`${n} 사단 출신`,'지금 감독과는 아직 함께 일한 시간이 없습니다.']:null; }
  const v=clanBond(c,m,tid), n=c.um&&c.um.id===m.id&&c.um.tid===tid?c.um.n:0;
  if(c.clan===m.id)return [`${m.name} 감독 사단`,`${clanBondWord(v)}. 감독이 떠나면 함께 떠날 수 있습니다.`];
  const other=c.clan&&mgrNameOf(c.clan); const hint=v>=CLAN_JOIN?(n>=2?'사단에 들 수 있습니다':'조금 더 함께하면 사단에 들 수 있습니다'):v<=CLAN_DROP?'사단과는 거리가 있습니다':'';
  return [clanBondWord(v).replace('감독과 ',''),`${n?`${m.name} 감독과 ${n}시즌 함께했습니다. `:''}${other?`${other} 사단 출신입니다. `:''}${hint?hint+'.':''}`.trim()]; }
/* 감독 카드 줄: 사단 크기와 변화 */
function clanMgrRows(m,tid){ const R0=[]; if(!m||!G.coach)return R0;
  if(tid!=null&&G.mgr[tid]===m&&clanMgrOk(m)){ const C=coachesOf(tid), L=CKEYS.map(k=>C[k]).filter(Boolean); const n=L.filter(c=>c.clan===m.id).length; const near=L.filter(c=>c.clan!==m.id&&clanBond(c,m,tid)>=CLAN_JOIN).map(c=>c.name).slice(0,3);
    R0.push(['사단 규모',`${n}명 · 많으면 ${clanCap(m)}명까지`]); if(near.length)R0.push(['가까워진 코치',near.join(', ')]); }
  const F=clanFol(m); if(F.length)R0.push(['따라 나온 코치',`${F.map(c=>c.name).join(', ')} · 감독이 부임하면 함께 갑니다`]);
  return R0; }

/* ----- 겨울: 사단이 자라고 줄어든다 ----- */
function clanYear(){ if(!G.coach||!G.teams)return; const mineJ=[], mineD=[];
  for(const t of G.teams){ const C=G.coach[t.id]; if(!C)continue; const m=G.mgr&&G.mgr[t.id]; const ok=clanMgrOk(m)&&!(m.cs!=null&&m.cs>G.year); const mk=ok?relKeyOf(m,'mgr'):null; const mine=t.id===ME();
    let size=ok?CKEYS.filter(k=>C[k]&&C[k].clan===m.id).length:0;
    for(const k of CKEYS){ const c=C[k]; if(!c)continue;
      if(c.clan&&!(ok&&c.clan===m.id)){ c.clanSep=(c.clanSep||0)+1; if(c.clanSep>=CLAN_SEP){ c.clan=null; delete c.clanSep; } } else delete c.clanSep; /* 감독과 떨어져 지낸 시즌 */
      if(!ok||staffPending(c))continue;
      if(c.um&&c.um.id===m.id&&c.um.tid===t.id)c.um.n++;
      else c.um={id:m.id,tid:t.id,n:1};
      const v=clanBond(c,m,t.id);
      if(c.clan===m.id){ if(v<=CLAN_DROP&&R()<.5){ c.clan=null; if(mine)mineD.push(c); } continue; }
      if(c.um.n>=2&&v>=CLAN_JOIN&&size<clanCap(m)&&R()<((m.ego||0)>=70?.2:.3)){ c.clan=m.id; delete c.clanSep; size++; const ck=relKeyOf(c,'coach'); if(mk&&ck)try{ relAdd(mk,ck,6,'clan',mk); }catch(e){} if(mine)mineJ.push(c); } } }
  const m=G.mgr&&G.mgr[G.user];
  if(!G.unemp&&m&&(mineJ.length||mineD.length))mail('코칭스태프','감독 사단 변화',[mineJ.length?`${mineJ.map(c=>`${CROLE[c.role].l} ${c.name}`).join(', ')} 코치가 ${m.name} 감독 사단에 들었습니다. 사단 코치는 감독과 손발이 맞아 지도 능력이 조금 더 나오지만, 감독이 떠나면 함께 떠날 수 있습니다.`:'',mineD.length?`${mineD.map(c=>c.name).join(', ')} 코치는 감독과 사이가 틀어져 사단에서 빠졌습니다.`:''].filter(Boolean).join('\n'),{kind:'감독',acts:[{l:'코치진 보기',a:'go',v:'staff:coach'}]});
  return mineJ.length+mineD.length; }

/* ----- 감독이 떠날 때: 사단 코치 동반 사임 ----- */
/* 기다리는 사람(시장 정리에서 빠지지 않는다): 감독을 따라 나와 2시즌 안, 단장을 따라 나와 400일 안 */
function loyWait(s){ return !!s&&((s.folM&&G.year-s.folM.y<=CLAN_WAIT)||(s.gmFol&&G.day-s.gmFol.d<=LOY_DAYS)); }
/* 감독을 기다리는 사단 코치(코치 시장에 남은 사람만) */
function clanFol(m){ if(!m||!m.id)return []; return (G.cmarket||[]).filter(c=>c.folM&&c.folM.id===m.id&&G.year-c.folM.y<=CLAN_WAIT&&(c.age||0)<STAFF_RET_AGE&&c.res!==G.user); }
/* 선임 때 데려올 사단: 기다리는 사람이 있으면 그 사람들, 없으면 예전처럼(이름난 감독은 새 사단) */
function mgrClanFor(n){ const F=clanFol(n); if(F.length)return F; return n.ob||n.inner?[]:mkClan(n); }
/* 후보 카드·선임 직전: 시장을 떠난 사람은 빼고 기다리는 사람을 더한다 */
function clanNow(m){ const F=clanFol(m); return F.concat((m.clan||[]).filter(c=>!c.folM&&!F.some(f=>f.role===c.role))); }
const CLAN_WHY={fire:'경질된',resign:'물러난',expire:'계약이 끝난',retire:'은퇴한',move:'떠난'};
function clanLeave(m,tid,why){ tid=tid??G.user; if(!m||!m.id||!G.coach||!G.coach[tid])return []; const C=G.coach[tid], out=[], L=[]; const wait=!m.interim&&!m.act&&(m.age||0)<STAFF_RET_AGE-2&&why!=='retire';
  for(const k of CKEYS){ const c=C[k]; if(!c||c.clan!==m.id)continue; stAttr(c); const v=clanBond(c,m,tid); let loy=20; try{ loy=coachLoyalty(c,tid); }catch(e){}
    const p=clamp(.45+v/100-(loy-20)/250,.2,.85); if(R()>=p)continue;
    C[k]=null; const pay=coachPaySev(tid,c); c.yrs=0; c.from=tid; c.fromY=G.year; delete c.um; delete c.clanSep;
    if(wait&&R()<clamp(.6+v/200,.3,.9))c.folM={id:m.id,y:G.year}; else { c.clan=null; delete c.folM; }
    (G.cmarket=G.cmarket||[]).push(c); staffHistory('coach',c,'계약 종료',tid,`${m.name} 감독 퇴임에 따른 사단 동반 퇴임`); if(tid===ME())try{ interimLeft(c); }catch(e){}
    out.push(`${CROLE[k].l} ${c.name}(정산 ${money(pay)})`); L.push(c); }
  if(L.length)try{ clanLeaveNews(m,tid,L,why); }catch(e){}
  return out; } /* 함께 떠나는 사단 코치도 경질처럼 잔여 연봉 절반을 정산하고 코치 시장에 나온다(검수 11-07) */
function clanLeaveNews(m,tid,L,why){ const w=CLAN_WHY[why]||'떠난', head=L.find(c=>c.role==='hc')||L[0], more=L.length>1?` 등 ${L.length}명`:'';
  const title=`${head.name} ${CROLE[head.role].l}${more}, ${w} ${m.name} 감독 따라 사임`, body=`${tname(tid)}의 ${L.map(c=>`${CROLE[c.role].l} ${c.name}`).join(', ')} 코치가 ${m.name} 감독과 함께 팀을 떠났습니다.${L.some(c=>c.folM)?' 감독이 새 팀을 맡으면 다시 뭉칠 것이라는 이야기가 나옵니다.':''}`;
  if(tid===ME()){ mail('코칭스태프',title,`${body}\n빈 자리는 코치진 화면에서 채워 주세요.`,{imp:true,kind:'감독',acts:[{l:'코치진 보기',a:'go',v:'staff:coach'}]}); return; }
  if(L.length>=2||head.role==='hc'||(m.fame||0)>=70)news('리그',`${tshort(tid)} ${title}`,body,0,{tid}); }
/* 새 감독 사단을 AI 구단 코치진에 앉힌다(mgrNew·계약 만료 교체 공통). start가 없으면 예전처럼 계약 연수만(바로 일함) */
function aiClanInstall(n,tid,start,why){ const C=G.coach&&G.coach[tid]; if(!C)return []; const got=[];
  for(const c of n.clan||[]){ if(!CKEYS.includes(c.role))continue; const old=C[c.role]; if(old&&old!==c)coachRelease(tid,old,why||'신임 감독 사단 합류에 따른 교체'); /* 밀려난 코치도 잔여 연봉 절반을 정산하고 시장으로(우리 hireClan과 같게, 검수 11-17 #259) */
    const fol=!!c.folM; G.cmarket=(G.cmarket||[]).filter(x=>x!==c); delete c.folM; delete c.res; c.clan=n.id; const y=Math.min(4,n.yrs||2);
    if(fol||start!=null)staffCt(c,y,start??undefined); else c.yrs=y; C[c.role]=c; staffHistory('coach',c,'영입',tid,`${n.name} 감독 사단 합류`); if(fol)got.push(c); }
  if(got.length)try{ news('리그',`${got.map(c=>c.name).join('·')} 코치, ${n.name} 감독 따라 ${tshort(tid)}행`,`${n.name} 감독이 ${tname(tid)} 지휘봉을 잡으면서, 전 팀에서 함께 물러났던 ${got.map(c=>`${c.name}(${CROLE[c.role].l})`).join(', ')} 코치도 합류했습니다.`,0,{tid}); }catch(e){}
  return got; }
/* AI 구단 코치 빈자리 채우기(동반 사임 뒤). roles를 주면 그 자리만 */
const coachHeld=tid=>CKEYS.filter(k=>G.coach&&G.coach[tid]&&G.coach[tid][k]);
function aiCoachFill(tid,why,roles){ if(tid===ME()||!G.coach||!G.coach[tid])return 0; return coachVacFill(tid,why||'코치진 공백 보강',roles).length; } /* 시장에서 우리와 같은 규칙으로(89c_coach_vacancy, 구단주 승인 11-17). 전에는 시장을 거치지 않은 새 코치 */

/* ----- 단장이 떠날 때: 단장을 좋아하는 직원 동반 사임 ----- */
const loyRoles=L=>(L||[]).filter(x=>x.kind==='coach').map(x=>x.k);
const LOY_KN={coach:'코치',scout:'스카우트',analyst:'전력분석원'};
const loyRole=x=>x.kind==='coach'?(CROLE[x.s.role]?.l||'코치'):LOY_KN[x.kind];
function gmFolKey(g){ if(g==='me')return 'me'; if(!g||g.interim)return null; try{ return relKeyOf(g,'gm'); }catch(e){ return null; } }
/* 동반 사임 확률. 우리 단장은 단장 관계(0~100), AI 단장은 인물 관계(-100~100) */
function gmLoyP(s,kind,tid,gk){ if(gk==='me'){ let r=50; try{ r=staffRel(s,tid,'gm'); }catch(e){} return r>=72?clamp((r-65)/100,0,.35):0; } let v=0; try{ const k=relKeyOf(s,kind); v=k?relVal(k,gk):0; }catch(e){} return v>=REL_LIKE?clamp((v-8)/60,0,.3):0; } /* 단장이 '좋아하는 인물'에 드는 사이(REL_LIKE)부터 */
function gmStaffOf(tid,me){ const L=[], m=G.mgr&&G.mgr[tid], C=G.coach&&G.coach[tid];
  if(C)for(const k of CKEYS){ const c=C[k]; if(!c||staffPending(c)||(m&&c.clan&&c.clan===m.id)||(c.age||0)>=STAFF_RET_AGE)continue; L.push({kind:'coach',s:c,k}); }
  const S=me?{sc:G.scouts||[],an:anaList()}:(G.lgStaff&&G.lgStaff[tid])||{};
  for(const s of S.sc||[])L.push({kind:'scout',s}); for(const s of S.an||[])L.push({kind:'analyst',s}); return L; }
/* g: 떠나는 단장(AI 단장 객체 또는 'me'). 사임한 사람 목록 */
function gmLoyalLeave(tid,g,why){ const gk=gmFolKey(g); if(!gk||!team(tid))return []; const me=gk==='me';
  const go=gmStaffOf(tid,me).map(x=>({...x,p:gmLoyP(x.s,x.kind,tid,gk)})).filter(x=>x.p>0&&R()<x.p).sort((a,b)=>b.p-a.p).slice(0,LOY_N);
  const nm=me?(meName()||'단장'):g.name; const S=me?null:G.lgStaff&&G.lgStaff[tid];
  for(const x of go){ const s=x.s; s.gmFol={k:gk,y:G.year,d:G.day,from:tid,nm};
    if(x.kind==='coach'){ G.coach[tid][x.k]=null; s.yrs=0; s.from=tid; s.fromY=G.year; delete s.um; (G.cmarket=G.cmarket||[]).push(s); if(me)try{ interimLeft(s); }catch(e){} }
    else if(x.kind==='scout'){ if(me)G.scouts=(G.scouts||[]).filter(y=>y!==s); else S.sc=S.sc.filter(y=>y!==s); delete s.bid; (G.scoutMarket=G.scoutMarket||[]).push(s); }
    else { if(me)G.analysts=anaList().filter(y=>y!==s); else S.an=S.an.filter(y=>y!==s); delete s.bid; (G.amarket=G.amarket||[]).push(s); }
    staffHistory(x.kind,s,'사임',tid,`${nm} 단장 ${why==='move'?'이직':why==='fire'?'경질':'퇴임'}에 따른 동반 사임`); }
  if(go.length&&!me)try{ stSync(tid); }catch(e){} return go; }
const GM_WHY={retire:'물러난',fire:'경질된',move:'구단을 옮긴',resign:'사임한',expire:'계약이 끝난',leave:'계약이 끝난'};
/* AI 단장 교체 공통 훅: 사임 → 코치 빈자리 보강 → 소식 */
function gmLoyalAI(tid,g,why){ if(tid===ME()||!g||g.interim)return []; const L=gmLoyalLeave(tid,g,why||'fire'); if(!L.length)return L; aiCoachFill(tid,`${g.name} 단장을 따라 떠난 코치 후임`,loyRoles(L));
  const head=L[0], more=L.length>1?` 등 ${L.length}명`:'';
  try{ news('리그',`${tshort(tid)} ${head.s.name} ${loyRole(head)}${more}, ${GM_WHY[why]||'경질된'} ${g.name} 단장 따라 사임`,`${tname(tid)}의 ${L.map(x=>`${loyRole(x)} ${x.s.name}`).join(', ')}이(가) ${g.name} 단장과 함께 구단을 떠났습니다. ${g.name} 단장이 새 자리를 얻으면 다시 함께할 것이라는 말이 나옵니다.`,0,{tid}); }catch(e){}
  return L; }
/* 따라온 사람 후보: 시장에 남은 사람만 */
function loyPool(gk,tid){ return [...(G.cmarket||[]).map(s=>({kind:'coach',s})),...(G.scoutMarket||[]).map(s=>({kind:'scout',s})),...(G.amarket||[]).map(s=>({kind:'analyst',s}))]
  .filter(x=>{ const f=x.s.gmFol; return f&&f.k===gk&&f.from!==tid&&G.day-f.d<=LOY_DAYS&&!x.s.acc&&x.s.res!==G.user&&(x.s.age||0)<STAFF_RET_AGE; }); }
/* AI 단장이 새 구단에 부임: 같은 영입 규칙으로 최대 LOY_N명 */
function gmLoyalJoin(tid,g){ if(tid===ME()||!g||g.interim)return []; const gk=gmFolKey(g); if(!gk)return []; const t=team(tid); const got=[];
  for(const x of loyPool(gk,tid).sort((a,b)=>gmLoyP(b.s,b.kind,tid,gk)-gmLoyP(a.s,a.kind,tid,gk))){ if(got.length>=LOY_N)break; const s=x.s;
    if(x.kind==='coach'){ const C=G.coach&&G.coach[tid]; if(!C||!CKEYS.includes(s.role))continue; const cur=C[s.role], m=G.mgr[tid];
      if(cur&&(staffPending(cur)||(m&&cur.clan===m.id)||cmVal(s)<cmVal(cur)-6))continue; if(!cmCanPay(t,s,cur))continue;
      G.cmarket=G.cmarket.filter(y=>y!==s); if(cur){ staffHistory('coach',cur,'계약 종료',tid,'후임 코치 영입'); coachPaySev(tid,cur); cur.yrs=0; cur.clan=null; cur.from=tid; cur.fromY=G.year; if(cur.age<64&&!cur.ob)G.cmarket.push(cur); }
      s.clan=null; delete s.res; delete s.gmFol; staffCt(s,ri(1,3)); C[s.role]=s; stAttr(s); s.loy=20; staffHistory('coach',s,'영입',tid,`${g.name} 단장을 따라 합류`); got.push(x); continue; }
    const k=x.kind==='scout'?'sc':'an', f=s.gmFol; delete s.gmFol; let ok=false; try{ ok=stJoin(k,s,tid,s.sal,true); }catch(e){ ok=false; } if(ok)got.push(x); else s.gmFol=f; }
  if(got.length)try{ news('리그',`${got.map(x=>x.s.name).join('·')}, ${g.name} 단장 따라 ${tshort(tid)}행`,`${tname(tid)} 새 단장 ${g.name}과(와) 전 구단에서 함께 일했던 ${got.map(x=>`${loyRole(x)} ${x.s.name}`).join(', ')}이(가) 합류했습니다.`,0,{tid}); }catch(e){}
  return got; }

/* ----- 우리 단장 ----- */
/* 구단을 떠날 때(G.user가 아직 옛 구단일 때 부른다). 코치 빈자리는 구단이 AI 손에 넘어간 뒤 aiCoachFill로 */
function meLoyalLeave(old,why){ if(G.unemp||old!==G.user)return []; const L=gmLoyalLeave(old,'me',why); if(!L.length)return L;
  const nm=meName()||'단장';
  try{ news('리그',`${tshort(old)} ${L[0].s.name} ${loyRole(L[0])}${L.length>1?` 등 ${L.length}명`:''}, ${GM_WHY[why]||'떠난'} ${nm} 단장 따라 사임`,`${tname(old)}의 ${L.map(x=>`${loyRole(x)} ${x.s.name}`).join(', ')}이(가) ${nm} 단장과 함께 구단을 떠났습니다.`,0,{tid:old}); }catch(e){}
  mail('운영팀','단장님을 따라 떠난 직원',`${L.map(x=>`${loyRole(x)} ${x.s.name}`).join(', ')}이(가) "단장님이 안 계신 구단에는 남지 않겠습니다"라며 ${tname(old)}을(를) 떠났습니다.\n새 구단을 맡으면 함께 일하자는 연락이 올 수 있습니다. 데려올지는 그때 정합니다.`,{kind:'경력'});
  return L; }
/* 새 구단 부임 뒤: 따라 나온 사람 최대 LOY_N명에게 결정 메일 */
function meLoyalOffer(tid){ if(G.unemp||tid!==G.user)return 0; const L=loyPool('me',tid).filter(x=>!x.s.gmFol.ask).sort((a,b)=>staffRel(b.s,G.user,'gm')-staffRel(a.s,G.user,'gm')).slice(0,LOY_N); let n=0;
  for(const x of L){ const s=x.s; s.gmFol.ask=G.day; const role=loyRole(x), C=x.kind==='coach'?coachesOf(G.user):null, cur=C?C[s.role]:null, k=x.kind==='scout'?'sc':'an';
    const fx=x.kind==='coach'?`${CROLE[s.role].l}(으)로 2년, 연 ${money(s.sal)}에 계약합니다.${cur?` 지금 ${cur.name} 코치와는 계약을 정리합니다(잔여 연봉 절반 정산).`:' 비어 있는 자리입니다.'}`:`${role}(으)로 연 ${money(s.sal)}에 채용합니다. 정원이 차 있으면 먼저 자리를 비워야 합니다.`;
    evNew('loyFol',`${s.name} ${role}, 함께 일하고 싶다는 연락`,`${tname(s.gmFol.from)}에서 단장님과 일하다 함께 떠난 ${s.name} ${role}이(가) 연락해 왔습니다. "단장님이 계신 곳이라면 가겠습니다." 아직 다른 구단과 계약하지 않았습니다.`,
      [{l:'함께 일한다',fx},{l:'정중히 사양한다',fx:'시장에 남아 다른 구단을 찾습니다.'}],{from:`${s.name} ${role}`,data:{kind:x.kind,id:s.id,tid:G.user,k},def:1,exp:10}); n++; }
  return n; }
function loyFolFind(D){ const L=D.kind==='coach'?G.cmarket:D.kind==='scout'?G.scoutMarket:G.amarket; return (L||[]).find(s=>s.id===D.id)||null; }
function loyFolWhy(D){ if(G.unemp||D.tid!==G.user)return '그때 맡은 구단을 떠나 이 제안은 끝났습니다.'; const s=loyFolFind(D); if(!s)return '이미 다른 구단과 계약했습니다.';
  if(D.kind==='coach')return ''; if(stOwnList(D.k).length>=stOwnCap(D.k))return `${stKindNm(D.k)} 정원이 찼습니다(${stOwnList(D.k).length}/${stOwnCap(D.k)}명). 먼저 자리를 비워 주세요.`; if(G.stAcc&&stAccBlock())return stAccBlock(); return ''; }
EVH.loyFol={ can(e,i){ return i===0?loyFolWhy(e.data||{}):''; },
  pick(e,i){ const D=e.data||{}, s=loyFolFind(D); if(i!==0){ if(s&&s.gmFol)s.gmFol.no=1; return s?`${s.name}의 제안을 사양했습니다.`:''; }
    const why=loyFolWhy(D); if(why){ e.pick=1; return why; }
    if(D.kind==='coach'){ const r=hireCoach(s.id,2); if(r){ e.pick=1; return r; } delete s.gmFol; return `${s.name} 코치가 ${CROLE[s.role].l}(으)로 합류합니다.`; }
    delete s.gmFol; stSignOwn(D.k,s,s.sal); return `${s.name}이(가) 연 ${money(s.sal)}에 합류합니다.`; } };
