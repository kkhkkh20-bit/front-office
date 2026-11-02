/* ---------- 스카우트팀장: 시기에 맞게 스카우트 배치를 제안하고, 맡기면 매달 1일 직접 배치한다 ----------
   3~9월(드래프트 시즌): 아마추어 3개 지역이 먼저. 10~2월(외국인·FA 시즌): 해외(미국·중남미)와 프로 담당이 먼저.
   프로 담당은 그 지역 다른 구단 수만큼 무게를 준다. 업무를 바꾸면 30일 적응 기간이 있어, 지금 자리도 필요한 자리면 그대로 둔다 */
function scoutChief(){ const L=G.scouts||[]; if(!L.length)return null; return [...L].sort((a,b)=>effSkill(b)-effSkill(a)||(b.since??0)-(a.since??0))[0]; }
/* 드래프트 시즌: 3월부터 그해 신인 드래프트가 끝날 때까지 */
function scoutDraftSea(){ const m=dobj(G.day).m; if(m<3||m>9)return false; return !(G.draft&&G.draft.done&&(G.draft.y||G.year)===G.year); }
function scoutSlots(){ const draftSea=scoutDraftSea(); const S=[];
  const proN=r=>G.teams.filter(t=>t.id!==G.user&&t.region===r).length;
  const asiaNeed=(()=>{ try{ return foreignOf(G.user).filter(p=>p.foreign==='아시아').length<1; }catch(e){ return false; } })();
  REG.forEach((r,i)=>S.push({role:'am',key:r,w:(draftSea?10:5.5)-i*.3,why:draftSea?'드래프트 시즌 아마추어 관찰':'내년 드래프트 후보 미리 관찰'}));
  REG.forEach(r=>{ const n=proN(r); if(n)S.push({role:'pro',key:r,w:(draftSea?3.5:6.5)+n*.6,why:`${r} 구단 ${n}곳 선수 평가(트레이드·FA)`}); });
  S.push({role:'intl',key:'us',w:draftSea?4.5:10,why:draftSea?'시즌 중 대체 외국인 후보':'외국인 시장(미국)'});
  S.push({role:'intl',key:'la',w:draftSea?4:9.5,why:draftSea?'시즌 중 대체 외국인 후보':'외국인 시장(중남미)'});
  S.push({role:'intl',key:'jp',w:(draftSea?2.5:5)+(asiaNeed?3:0),why:asiaNeed?'아시아쿼터 자리가 비어 있음':'아시아쿼터 시장(일본)'});
  return S.sort((a,b)=>b.w-a.w); }
/* 배치안: 우선순위 높은 자리부터 가장 나은 스카우트를 넣는다. 이미 그 자리에 있는 사람은 가산점(바꾸면 30일 적응) */
function scoutPlan(){ const sc=[...(G.scouts||[])]; if(!sc.length)return []; const slots=scoutSlots().slice(0,sc.length); const used=new Set(); const out=[];
  for(const sl of slots){ let best=null,bs=-1e9; for(const s of sc){ if(used.has(s.id))continue; const here=(s.role||'am')===sl.role&&s.region===sl.key; const sp=sl.role==='am'&&s.spec?.2:0; const v=effSkill(s)+(here?1.5:0)+sp; if(v>bs){bs=v;best=s;} }
    if(!best)break; used.add(best.id); out.push({s:best,role:sl.role,key:sl.key,why:sl.why,move:!((best.role||'am')===sl.role&&best.region===sl.key)}); }
  return out; }
function scoutSlotTxt(role,key){ return `${SROLE[role]} · ${role==='intl'?IREG[key].l:key}`; }
function scoutPlanApply(quiet){ const P=scoutPlan().filter(x=>x.move); for(const x of P)assignScout(x.s.id,x.role,x.key);
  if(P.length&&quiet){ const c=scoutChief(); mail('스카우트팀',`스카우트 배치 조정 ${P.length}명`,`${c?`${c.name} 스카우트팀장`:'스카우트팀장'}이 이번 달 배치를 바꿨습니다.\n\n${P.map(x=>`${x.s.name}: ${scoutSlotTxt(x.role,x.key)} (${x.why})`).join('\n')}\n\n바꾼 스카우트는 30일 동안 적응 기간입니다. 직접 배치하려면 스카우트팀 화면에서 '팀장에게 맡기기'를 끄세요.`,{kind:'스카우트'}); }
  return P.length; }
function scoutAutoMonthly(){ if(G.unemp)return; if(!G.scoutAuto){ try{ scoutSuggest(); }catch(e){} return; } try{ scoutPlanApply(true); }catch(e){} }
