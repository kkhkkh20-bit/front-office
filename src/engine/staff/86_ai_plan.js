/* ===== AI 단장의 계획: 우승 도전 · 전력 정비 · 재건 =====
 1월 10일(새 시즌 전력 기준)과 7월 1일(실제 순위 기준)에 다시 정한다. 계획은 t.mode로 이어져 이미 있는 판단이 따른다:
 트레이드 가치(우승 도전은 베테랑을 더, 재건은 덜 쳐줌), FA 지출, 드래프트, 로스터 정리, 매물 등록(재건이면 비싼 베테랑), 마감 거래의 구매자.
 구단 설계 능력이 낮은 단장은 형편과 다른 계획을 고를 수 있다(무리한 우승 도전·늦은 재건). 바뀌면 리그 소식으로 알린다(시장이 열리는 순간) */
function aiPlanBase(rk,age,owner,cash){ if(cash<-5000)return 'rebuild'; if(rk<=3||(rk<=5&&owner==='win'))return 'contend'; if(rk>=8&&(age>=29.5||cash<-2000))return 'rebuild'; return 'mid'; }
function aiPlanRank(t,mid){ if(mid){ const st=standingsNow(); return st.findIndex(x=>x.tid===t.id)+1; } const L=G.teams.map(x=>({id:x.id,r:teamRating(x.id)})).sort((a,b)=>b.r-a.r); return L.findIndex(x=>x.id===t.id)+1; }
function aiPlanApply(t,nw,why){ const old=t.mode; t.mode=nw; t.modeY=G.year; t.modeD=G.day; if(old===nw)return;
  const L=nw==='rebuild'?domestic(t.id).filter(p=>p.age>=29&&!p.ys&&ovr(p)>=50&&!hasNtc(p)&&!mvRecent(p)).sort((a,b)=>b.sal-a.sal).slice(0,2):[]; for(const p of L){ p.aiListed=true; p.aiWhy='reb'; p.aiLd=G.day; }
  const lab={contend:'우승 도전',rebuild:'재건',mid:'전력 정비'}[nw]; const g=t.gm&&!t.gm.interim?t.gm.name:'단장대행';
  try{ news('리그',`${tshort(t.id)}, ${lab}(으)로 방향 전환`,`${tname(t.id)} ${g} 단장이 ${lab} 쪽으로 방향을 잡았습니다${why?`(${why})`:''}.${L.length?` ${L.map(p=>`${p.name}(${posLabel(p)}, ${p.age}세)`).join(', ')}이(가) 시장에 나올 수 있습니다.`:nw==='contend'?' 마감 전 보강에 나설 전망입니다.':''}`,0); }catch(e){} }
function aiPlanYear(mid){ for(const t of G.teams){ if(t.id===ME())continue; const rk=aiPlanRank(t,mid); const top=domestic(t.id).filter(p=>!p.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,12); const age=top.length?top.reduce((a,p)=>a+p.age,0)/top.length:28;
    let nw=aiPlanBase(rk,age,t.owner,t.cash||0);
    if(mid){ /* 시즌 중에는 크게 어긋날 때만 바꾼다 */ if(t.mode==='contend'&&rk>=8)nw='rebuild'; else if(t.mode!=='contend'&&rk<=3)nw='contend'; else nw=t.mode||nw; }
    const ab=t.gm?gmAbil(t.gm):null; if(ab&&nw!=='contend'&&R()<(1-ab.plan/100)*.35)nw='contend'; /* 서툰 단장은 형편보다 무리하게 우승을 노린다 */
    aiPlanApply(t,nw,mid?`${rk}위`:`전력 ${rk}위 예상`); } }
function aiPlanDaily(){ const o=dobj(G.day); if(o.m===1&&o.d===10&&G.aiPlanY!==G.year){ G.aiPlanY=G.year; aiPlanYear(false); } if(o.m===7&&o.d===1&&G.aiPlanM!==G.year){ G.aiPlanM=G.year; aiPlanYear(true); } }
/* AI 감독 선임: 후보 여럿 중 지금 선수단과 맞는 감독(원하는 역할을 이미 갖춘 정도)을 구단 설계 능력만큼 더 본다 */
function aiMgrFit(tid,m){ const L=mgrRolesOf(m); if(!L.length)return .4; return L.reduce((a,k)=>a+Math.min(1,roleHaveAs(tid,k)/MROLE[k].tgt),0)/L.length; }
function roleHaveAs(tid,k){ const R0=MROLE[k]; return playersOf(tid).filter(p=>!p.prospect&&!p.ys&&roleOk(p,k)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,R0.bat?9:5).filter(p=>ovr(p)>=45).length; }
/* 다른 구단도 우리와 같은 감독 시장(G.mmarket)에서 고른다(사용자 11-05: 상대 단장도 같은 일을 겪게). 시장 후보를 데려가면 목록에서 빠져 우리도 놓친다 */
function aiMgrHire(t){ const M=(G.mmarket||[]).filter(m=>!m.ob); const C=M.concat([mkMgr(),mkMgr()]); const n=aiMgrPick(t,C); if(M.includes(n)){ G.mmarket=G.mmarket.filter(x=>x!==n); if(!G.unemp)note('감독',`감독 후보 ${n.name}이(가) ${tname(t.id)} 감독이 됐습니다.`); } return n; }
function aiMgrPick(t,C){ const ab=t.gm?gmAbil(t.gm):null; const w=ab?ab.plan/100:.5; let best=C[0], bs=-1e9; for(const m of C){ const s=(m.fame||50)*.05+((m.tac||50)-50)*.08+aiMgrFit(t.id,m)*10*w+R()*1.5; /* 경기 운영(tac)도 본다: 우리가 고르는 기준과 같게(검수 11-05) */ if(s>bs){ bs=s; best=m; } } return best; }
