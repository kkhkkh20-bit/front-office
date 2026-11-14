/* ===== 내부 승격(사용자 11-14: 타 구단도 수석코치·2군 감독이 감독으로, 프런트 실무자가 단장으로 올라간다) =====
   AI 구단 감독을 새로 뽑을 때 그 구단 수석코치·2군 감독도 후보에 넣는다(지도력·육성력·나이로 감독 능력을 만든다).
   단장이 바뀔 때도 일정 확률로 구단 안에서(스카우트 팀장·운영팀장) 올린다. 우리 구단은 감독 화면에서 직접 고른다 */
const IP_ROLES=['hc','fm'];
function coachToMgr(c,tid){ const m=mkMgr(); m.name=c.name; m.age=c.age||50; /* 코치 나이 그대로(후보는 38~66세라 40세로 끌어올릴 일이 없다, 검수 11-14) */ m.tac=clamp(Math.round((c.sk||50)+N(0,4)),30,88); m.youth=clamp(Math.round((c.dv||50)+N(0,6)),15,88);
  m.fame=clamp(Math.round(30+((c.sk||50)-50)*.6+N(0,6)),18,70); m.ego=clamp(Math.round(N(45,12)),20,85); m.career=`${tshort(tid)} ${CROLE[c.role]?CROLE[c.role].l:'코치'} 출신 · 내부 승격`; m.inner={tid,coach:c.id,role:c.role,y:G.year};
  m.sal=round5(clamp(180+(m.tac-50)*8+Math.max(0,m.fame-55)*8,160,900)); m.clan=[]; m.personKey=personNetworkKey(c,'coach'); /* 코치 시절 관계를 이어 간다(84b_person_rels) */ return typeof applyPersonRelation==='function'?applyPersonRelation(m,'mgr'):m; }
/* 감독 후보에 더할 내부 인물: 수석코치·2군 감독 중 지도력이나 육성력이 쓸 만한 사람(38~66세) */
function ipMgrCands(t){ if(!t||t.id===ME())return []; const C=coachesOf(t.id); const L=[]; for(const r of IP_ROLES){ const c=C[r]; if(!c||c.interim||(c.age||50)>66||(c.age||50)<38)continue; if(Math.max(c.sk||0,c.dv||0)<48)continue; const m=coachToMgr(c,t.id); m._ipFrom=c; L.push(m); } return L; }
/* 내부 인물이 감독이 되면 코치 자리를 비우고(다음 코치 충원 때 채운다) 소식을 낸다 */
function ipMgrTaken(t,m){ const c=m&&m._ipFrom; if(!c)return; delete m._ipFrom; const C=coachesOf(t.id); for(const r in C)if(C[r]&&C[r].id===c.id){ try{ staffHistory('coach',C[r],'감독 승격',t.id,`${CROLE[r]?CROLE[r].l:'코치'} → 감독 내부 승격`); }catch(e){} C[r]=null; } /* 코치 이력에도 자리를 비운 까닭을 남긴다 */
  try{ wire('감독',`${t.city} ${t.nick}, ${CROLE[c.role]?CROLE[c.role].l:'코치'} ${m.name} 내부 승격으로 새 감독`,{tid:t.id}); }catch(e){} try{ chron('join',`${m.name} 감독 취임 · ${CROLE[c.role]?CROLE[c.role].l:'코치'}에서 내부 승격`,null,t.id); }catch(e){} }
/* 단장 내부 승격: 새 단장의 이력만 바꾼다(능력·성향은 새 사람과 같은 방식). 구단을 잘 아는 만큼 구단주와의 관계는 조금 높게 시작한다 */
function ipGM(t,g){ if(!g||g.interim||R()>=.35)return g; const who=R()<.5?'스카우트 팀장':'운영팀장'; g.car=`${tshort(t.id)} ${who} 출신 · 내부 승격`; g.inner=true; return g; }
