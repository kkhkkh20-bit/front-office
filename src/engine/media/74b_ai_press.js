/* ===== 다른 구단 단장의 언론 플레이: 스타 띄우기(사용자 11-14 "AI도 같은 기능을 같은 규칙으로") =====
 우리 pressPlay('hype')와 같은 규칙: 30일에 한 번(PP_COOL), 서먹한 기자(PP_MIN_REL 미만)는 거절, 기자가 써 주는 방식은 같은 ppFrame 식,
 같은 띄우기 크기(호의 14·그대로 9·비꼼 4)·같은 선수 기분 변화·45일 뒤 같은 hypeForm 평가(잘하면 +6·기간 연장, 부진하면 거품 역풍).
 기자와의 친분은 구단마다 따로 쌓는다(G.aiRep). AI 단장도 우리처럼 2주에 한 번 기자에게 전화해 친분을 쌓는다(같은 repContact 'call' 식).
 AI 단장이 보는 것은 사람 단장과 같다: 올해 성적(폼)·주전 여부. 시즌 중에만, 평가할 시간이 남았을 때만 띄운다. */
const AI_PP_P=.25; /* 쉴 기간이 끝난 뒤 한 주에 띄울 확률: 대략 두 달에 한 번 */
function aiRepRel(tid,rid){ const A=(G.aiRep=G.aiRep||{})[tid]=G.aiRep[tid]||{}; return A[rid]??50; }
function aiRepAdd(tid,rid,d){ const A=(G.aiRep=G.aiRep||{})[tid]=G.aiRep[tid]||{}; A[rid]=clamp((A[rid]??50)+d,0,100); }
/* 우리 repContact('call')과 같은 식: 친분이 높을수록 덜 오르고, 비판 기자는 덜·우호 기자는 더 */
function aiRepCall(tid){ const S=(G.aiPP=G.aiPP||{})[tid]=G.aiPP[tid]||{}; if(S.call!=null&&S.call>G.day-14)return; const L=pressInit(); if(!L.length)return; S.call=G.day;
  const r=L.slice().sort((a,b)=>(aiRepRel(tid,b.id)+(b.style==='fr'?6:b.style==='cr'?-6:0))-(aiRepRel(tid,a.id)+(a.style==='fr'?6:a.style==='cr'?-6:0)))[Math.floor(R()*Math.min(3,L.length))];
  const rel=aiRepRel(tid,r.id), dim=rel>60?Math.max(.3,1-(rel-60)/40):1, sty=r.style==='cr'?.7:r.style==='fr'?1.2:1; aiRepAdd(tid,r.id,Math.max(1,Math.round(ri(1,3)*dim*sty))); }
/* 띄울 선수: 1군 주전·국내 선수·건강·폼이 좋은 선수 가운데 성적이 가장 좋은 선수 */
function aiHypePick(tid){ const d=depth(tid); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,2)].map(p=>p.id));
  return domestic(tid).filter(p=>!p.ys&&reg.has(p.id)&&healthy(p)&&!isAway(p)&&!(p.hype&&p.hype.until>=G.day&&p.hype.v>0)&&aiTalkForm(p)===true)
    .map(p=>({p,v:(perfOf(curLine(p),p.isP)||0)-ovr(p)*.3}))
    .sort((a,b)=>b.v-a.v).map(x=>x.p)[0]||null; }
function aiHype(tid,pid){ const p=G.players[pid]; if(!p||p.team!==tid||tid===ME()||p.foreign)return null; if(p.hype&&p.hype.until>=G.day&&p.hype.v>0)return null;
  const S=(G.aiPP=G.aiPP||{})[tid]=G.aiPP[tid]||{}; if(S.last!=null&&G.day-S.last<PP_COOL)return null;
  const L=pressInit().map(r=>({r,rel:aiRepRel(tid,r.id)})).filter(x=>x.rel>=PP_MIN_REL).sort((a,b)=>b.rel-a.rel); if(!L.length)return null;
  const r=L[0].r; const fr=ppFrame({...r,rel:L[0].rel}); S.last=G.day;
  const v=fr==='good'?14:fr==='flat'?9:4; p.hype={v,until:G.day+120,d:G.day,base:hypeSnap(p)}; p.mor=clamp((p.mor??60)+(fr==='bad'?-2:4),0,100);
  (G.aiPledges=G.aiPledges||[]).unshift({k:'hype',pid,day:G.day,until:G.day+45,rep:r.id,done:false,tid});
  const Lg=G.aiPPLog=G.aiPPLog&&G.aiPPLog.y===G.year?G.aiPPLog:{y:G.year,n:{},fr:{good:0,flat:0,bad:0},res:{good:0,flat:0,bad:0,few:0}}; Lg.n[tid]=(Lg.n[tid]||0)+1; Lg.fr[fr]++;
  wire('언론',`${r.outlet} — ${tshort(tid)} 단장 "${p.name}, 리그를 대표할 선수 된다"`,{tid,ref:p.id});
  return {fr,v}; }
function aiPressWeek(){ if(!G.teams||!G.cal)return 0; let n=0; const c=G.cal; const inSeason=G.day>=c.open&&G.day<=c.end-50;
  for(const t of G.teams){ if(t.id===ME()||!G.mgr[t.id])continue; aiRepCall(t.id); if(!inSeason)continue;
    const S=(G.aiPP=G.aiPP||{})[t.id]||{}; if(S.last!=null&&G.day-S.last<PP_COOL)continue; if(R()>=AI_PP_P)continue;
    const p=aiHypePick(t.id); if(p&&aiHype(t.id,p.id))n++; }
  return n; }
/* AI 띄우기 평가: 우리 ppDaily의 hype 판정과 같은 식(매일) */
function aiPressDaily(){ if(!G.aiPledges||!G.aiPledges.length)return; for(const g of G.aiPledges){ if(g.done||G.day<g.until)continue; const p=G.players[g.pid];
    if(!p||p.team!==g.tid||g.tid===ME()||!p.hype){ g.done=true; g.void=true; continue; } const f=hypeForm(p,p.hype);
    const Lg=G.aiPPLog&&G.aiPPLog.y===G.year?G.aiPPLog:null;
    if(f==='few'){ if(G.day<g.until+90&&G.day<=p.hype.until)continue; g.done=true; g.void=true; if(Lg)Lg.res.few++; continue; } g.done=true; g.ok=f!=='bad'; if(Lg)Lg.res[f]++;
    if(f==='good'){ p.hype.v+=6; p.hype.until=Math.max(p.hype.until,G.day+120); p.mor=clamp((p.mor??60)+3,0,100); aiRepAdd(g.tid,g.rep,2); wire('언론',`${p.name}, 기대를 증명했다`,{tid:g.tid,ref:p.id}); }
    else if(f==='bad'){ p.hype.v=0; p.hype.until=G.day-1; p.mor=clamp((p.mor??60)-5,0,100); aiRepAdd(g.tid,g.rep,-2); wire('언론',`'${p.name} 띄우기'는 거품이었나`,{tid:g.tid,ref:p.id}); } }
  G.aiPledges=G.aiPledges.filter(g=>!g.done||G.day-g.until<120).slice(0,60); }
