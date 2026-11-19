/* ===== 내부 승격(사용자 11-14: 타 구단도 수석코치·2군 감독이 감독으로, 프런트 실무자가 단장으로 올라간다) =====
   AI 구단 감독을 새로 뽑을 때 그 구단 수석코치·2군 감독도 후보에 넣는다(지도력·육성력·나이로 감독 능력을 만든다).
   단장이 바뀔 때도 일정 확률로 구단 안에서(스카우트 팀장·운영팀장) 올린다. 우리 구단은 감독 화면 '채용 후보'에서 같은 기준의 내부 승격 후보를 직접 고른다(ipMyMgrRows) */
const IP_ROLES=['hc','fm'];
function coachToMgr(c,tid){ const m=mkMgr(); m.name=c.name; m.age=c.age||50; /* 코치 나이 그대로(후보는 38~66세라 40세로 끌어올릴 일이 없다, 검수 11-14) */ m.tac=clamp(Math.round((c.sk||50)+N(0,4)),30,88); m.youth=clamp(Math.round((c.dv||50)+N(0,6)),15,88);
  m.fame=clamp(Math.round(30+((c.sk||50)-50)*.6+N(0,6)),18,70); m.ego=clamp(Math.round(N(45,12)),20,85); m.career=`${tshort(tid)} ${CROLE[c.role]?CROLE[c.role].l:'코치'} 출신 · 내부 승격`; m.inner={tid,coach:c.id,role:c.role,y:G.year};
  m.sal=round5(clamp(180+(m.tac-50)*8+Math.max(0,m.fame-55)*8,160,900)); m.clan=[]; m.personKey=personNetworkKey(c,'coach'); /* 코치 시절 관계를 이어 간다(84b_person_rels) */ return typeof applyPersonRelation==='function'?applyPersonRelation(m,'mgr'):m; }
/* 감독 후보에 더할 내부 인물: 수석코치·2군 감독 중 지도력이나 육성력이 쓸 만한 사람(38~66세). 다음 시즌 합류 예정이거나 교육·연수로 떠나 있는 코치는 뺀다(coachActiveNow, 검수 11-17 #271) */
/* 감독 후보가 될 수 없는 까닭(쉬운 말). 빈 문자열이면 후보가 된다. AI(ipMgrCands)와 우리 구단(ipMyMgrRows)이 같은 기준을 쓴다 */
function ipMgrWhy(c){ if(!c)return '자리가 비어 있음'; if(c.interim)return '감독대행 중'; if(!coachActiveNow(c))return c.sisAway>G.day?'교육·연수로 자리를 비움':'아직 합류 전'; const a=c.age||50; if(a>66||a<38)return '나이 38~66세 아님'; if(Math.max(c.sk||0,c.dv||0)<48)return '지도력·육성력 48 미만'; return ''; }
function ipMgrCands(t){ if(!t||t.id===ME())return []; const C=coachesOf(t.id); const L=[]; for(const r of IP_ROLES){ const c=C[r]; if(ipMgrWhy(c))continue; const m=coachToMgr(c,t.id); m._ipFrom=c; L.push(m); } return L; }
/* 우리 구단 내부 승격 후보(카페 제보 11-19: 수석코치 희망 보직이 1군 감독인데 올릴 방법이 없었다). AI와 같은 기준·같은 변환(coachToMgr)이지만
   따로 씨앗을 둔 난수(withRng)로 한 번 만들어 G.ipMy에 둔다: 본 난수를 한 번도 쓰지 않고, 화면을 다시 그리거나 저장을 불러와도 같은 후보다.
   같은 코치라도 해가 바뀌거나 나이·지도력·육성력이 바뀌면 새로 만든다. 코치 원본(_ipFrom)은 저장에 넣지 않는다(열거되지 않는 속성) */
function ipMyMgr(c){ const k=rngHash('ipMgr',G.year,G.user,c.id,c.role,c.age,c.sk,c.dv), S=G.ipMy=G.ipMy||{}; let m=S[c.id]&&S[c.id].k===k?S[c.id].m:null;
  if(!m){ const ns=_nmSet, nd=_nmDay; _nmSet=new Set(); _nmDay=G.day; /* 이름은 코치 이름으로 바꾸므로, 버릴 이름을 뽑느라 그날 이름 목록(본 경로의 genName이 쓰는)을 바꾸거나 세상 상태에 따라 뽑기 횟수가 달라지지 않게 */
    try{ m=withRng(k,()=>coachToMgr(c,G.user)); }finally{ _nmSet=ns; _nmDay=nd; } m.id='ip'+String(c.id).replace(/\W/g,''); m.ipMine=c.role; S[c.id]={k,m}; }
  m.ipPref=typeof staffProfile==='function'&&staffProfile(c,'coach').pref==='mgr'; Object.defineProperty(m,'_ipFrom',{value:c,configurable:true,writable:true,enumerable:false}); return m; }
/* 화면용: 우리 수석코치·2군 감독마다 후보(m) 또는 안 되는 까닭(why) */
function ipMyMgrRows(){ if(G.unemp||!G.coach)return []; const C=coachesOf(G.user), L=[]; for(const r of IP_ROLES){ const c=C[r]; if(!c)continue; const why=ipMgrWhy(c); L.push({r,c,why,m:why?null:ipMyMgr(c)}); }
  if(G.ipMy)for(const id in G.ipMy)if(!L.some(x=>x.m&&String(x.c.id)===id))delete G.ipMy[id]; /* 자리를 떠났거나 후보가 아니게 된 코치 몫은 지운다 */ return L; }
const ipMyMgrCands=()=>ipMyMgrRows().filter(x=>x.m).map(x=>x.m);
/* 감독 선임 화면·결재·실행이 함께 쓰는 후보 찾기: 외부 시장 + 우리 내부 승격 후보 */
function mgrCandOf(id){ return (G.mmarket||[]).find(x=>x.id===id)||ipMyMgrCands().find(x=>x.id===id)||null; }
/* 내부 인물이 감독이 되면 코치 자리를 비우고(다음 코치 충원 때 채운다) 소식을 낸다 */
function ipMgrTaken(t,m){ const c=m&&m._ipFrom; if(!c)return; delete m._ipFrom; const C=coachesOf(t.id); for(const r in C)if(C[r]&&C[r].id===c.id){ try{ staffHistory('coach',C[r],'감독 승격',t.id,`${CROLE[r]?CROLE[r].l:'코치'} → 감독 내부 승격`); }catch(e){} C[r]=null; } /* 코치 이력에도 자리를 비운 까닭을 남긴다 */
  try{ wire('감독',`${tfull(t)}, ${CROLE[c.role]?CROLE[c.role].l:'코치'} ${m.name} 내부 승격으로 새 감독`,{tid:t.id}); }catch(e){} try{ chron('join',`${m.name} 감독 취임 · ${CROLE[c.role]?CROLE[c.role].l:'코치'}에서 내부 승격`,null,t.id); }catch(e){} }
/* 단장 내부 승격: 새 단장의 이력만 바꾼다(능력·성향은 새 사람과 같은 방식). 구단을 잘 아는 만큼 구단주와의 관계는 조금 높게 시작한다 */
function ipGM(t,g){ if(!g||g.interim||R()>=.35)return g; const who=R()<.5?'스카우트 팀장':'운영팀장'; g.car=`${tshort(t.id)} ${who} 출신 · 내부 승격`; g.inner=true; return g; }
