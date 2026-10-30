/* ===== 투수 보직: 선발과 계투는 나누되 언제든 바뀐다 =====
 - 기본은 감독이 정한다. 선발로 쓸 체력 기준은 감독 성향에 따라 다르다:
   불펜 의존(pen)이 높을수록 기준이 높고, 스몰볼(small) 감독은 짧게 끊어 가는 운영이라 체력이 낮아도 선발을 맡긴다.
 - 신인 투수는 곧바로 선발 자리를 얻기 어렵다. 감독이 1군 계투로 시작할지, 2군에서 선발 수업(선발 등판하며 체력을 키움)을 받게 할지 정한다.
   육성을 중시하는 감독일수록, 어리고 체력이 더 클 여지가 있을수록 2군 선발 수업을 고르고, 당장 불펜에서 쓸 만하면 1군 계투로 쓴다.
   신인이라도 이미 선발감이면 경쟁에 바로 넣는다.
 - 2군 선발 수업은 체력이 감독의 선발 기준에 닿거나 두 시즌을 채우면 끝나고, 그때부터 선발 경쟁에 들어간다.
 - 단장은 선수마다 선발·계투·2군 선발 수업을 요청할 수 있다. 감독과 함께 정하는 일이지만 단장의 의중이 무겁다:
   대개 받아들이고, 고집 센 감독은 관계가 조금 상하며, 관계가 나쁘면 가끔 거절한다(7일 뒤 다시 요청 가능).
 - 다른 구단도 같은 규칙으로 감독이 정한다. */
const PROLE={auto:'감독에게 맡김',sp:'선발',rp:'계투',sp2:'2군 선발 수업'};
function rpThr(tid){ const m=tid!=null?mgrOf(tid):null; const pen=m&&m.pen!=null?m.pen:50, sm=m&&m.small!=null?m.small:50; return 46+(pen-50)/10-(sm-50)/8; }
const isNewP=p=>p.isP&&!p.foreign&&((p.draft&&p.draft.y>=G.year-1)||(p.joinY!=null&&p.joinY>=G.year&&p.draft));
/* 구단별 비교 기준: 5선발 선발 가치, 불펜 중간(7번째) 계투 가치. 신인은 빼고 본다 */
function rpCtx(tid){ const ps=playersOf(tid).filter(p=>p.isP&&healthy(p)&&!isNewP(p)&&!p.ys); const s=ps.map(spV).sort((a,b)=>b-a), r=ps.map(penV).sort((a,b)=>b-a);
  return {fifth:s[4]??s[s.length-1]??40, penMid:r[6]??r[r.length-1]??40}; }
/* 감독의 계획: 'sp2'(2군 선발 수업)·'rp'(계투로 시작)·null(경쟁으로 정함) */
function mgrRolePlan(p,tid,ctx){ const m=mgrOf(tid); const thr=rpThr(tid); const youth=m&&m.youth!=null?m.youth:50;
  if(p.r.sta>=thr+3&&spV(p)>=ctx.fifth-1)return null; /* 신인이라도 이미 선발감이면 경쟁에 바로 넣는다 */
  const useful=penV(p)>=ctx.penMid; const room=trnRoom(p,'sta');
  if(p.age<=23&&room>=2&&p.r.stf>=40&&(youth>=60||!useful))return 'sp2'; /* 당장 불펜에서 쓸 만하지 않거나 육성을 중시하는 감독이면 2군 선발 수업 */
  return 'rp'; }
function rpPlanOf(tid,p){ if(!p||!p.isP)return null; if(tid===G.user&&G.prole&&G.prole[p.id])return G.prole[p.id].k; const x=G.rplan&&G.rplan[p.id]; return x&&x.tid===tid?x.k:null; }
function rpBias(tid,p){ const k=rpPlanOf(tid,p); return k==='sp'?12:k==='rp'?-25:0; }
function rpWhy(p,tid){ const thr=rpThr(tid), m=mgrOf(tid); const sm=m&&m.small!=null?m.small:50; const gap=p.r.sta-thr;
  const st=gap>=3?'선발로 버틸 체력이 됩니다':gap>=-3?'선발 체력 기준에 거의 닿았습니다':gap>=-9?'선발로 던지기에는 체력이 조금 모자랍니다':'선발로 던지기에는 체력이 많이 모자랍니다';
  return st+(sm>=65?' (짧게 끊어 가는 운영이라 체력 기준이 낮은 편)':(m&&m.pen>=65)?' (불펜 비중이 커서 선발 체력 기준이 높은 편)':''); }
/* 매주(시즌 준비·정규시즌): 신인 계획을 세우고, 선발 수업을 마친 선수를 올리고, 2군 선발 수업 중인 투수는 2군에서 선발로 던지게 한다 */
function rpWeek(){ const per=period(); if(per!=='pre'&&per!=='season')return; G.rplan=G.rplan||{}; const y=G.year; const myNew=[], grad=[];
  for(const t of G.teams){ const ctx=rpCtx(t.id); const thr=rpThr(t.id);
    for(const p of playersOf(t.id)){ if(!p.isP||p.foreign)continue; let x=G.rplan[p.id]; if(x&&x.tid!==t.id){ delete G.rplan[p.id]; x=null; }
      if(!x&&isNewP(p)&&!(p.joinY>G.year)){ const k=mgrRolePlan(p,t.id,ctx); G.rplan[p.id]={k:k||'auto',tid:t.id,y}; if(t.id===G.user&&!G.unemp)myNew.push(p); continue; }
      if(!x)continue;
      if(x.k==='rp'&&x.y<y)delete G.rplan[p.id]; /* 계투 시작은 첫해만: 다음 해부터는 체력과 투구 내용으로 경쟁 */
      else if(x.k==='sp2'){ if(p.r.sta>=thr||y-x.y>=2){ delete G.rplan[p.id]; if(t.id===G.user)grad.push(p); } else if(p.age>25){ delete G.rplan[p.id]; } } /* 체력이 선발 기준에 닿거나 두 시즌을 채우면 수업을 마치고 선발 경쟁에 들어간다 */
      else if(x.k==='auto'&&x.y<y)delete G.rplan[p.id]; } }
  /* 2군 선발 수업 중이면 2군에서 선발로 나간다 */
  for(const p of Object.values(G.players)){ if(!p.isP||p.team==null||p.e1)continue; if(rpPlanOf(p.team,p)==='sp2'){ p.role='SP'; if(per==='season'&&healthy(p)&&!milServing(p))addR(p,'sta',.05*clamp(trnRoom(p,'sta')/8,.2,1)); } } /* 선발로 길게 던지며 체력이 붙는다 */
  if(myNew.length){ const m=G.mgr[G.user]; const L=myNew.map(p=>{ const k=G.rplan[p.id].k; return `${p.name}(${p.age}세): ${k==='sp2'?'2군 선발 수업':k==='rp'?'계투로 시작':'선발 경쟁'} · ${rpWhy(p,G.user)}`; });
    mail('감독실',`신인 투수 보직 계획 (${myNew.length}명)`,`${m?m.name+' 감독':'코치진'}: 신인 투수들은 이렇게 시작하려 합니다.\n\n${L.join('\n')}\n\n체력이 붙고 내용이 좋아지면 언제든 바꿉니다. 다르게 쓰고 싶으시면 선수 정보 육성 탭의 '보직'에서 말씀해 주십시오.`,{kind:'감독',acts:myNew.slice(0,4).map(p=>({l:p.name,a:'player',v:p.id}))}); }
  if(grad.length){ const m=G.mgr[G.user]; mail('감독실',`2군 선발 수업 마침 (${grad.length}명)`,`${m?m.name+' 감독':'코치진'}: ${grad.map(p=>`${p.name}(${p.r.sta>=rpThr(G.user)?'선발 체력 기준 도달':'두 시즌 수업 완료'})`).join(', ')}의 2군 선발 수업을 마칩니다. 이제부터 체력과 투구 내용으로 다른 투수들과 선발 자리를 다툽니다. 선발 5명에 들지 못하면 불펜에서 기회를 봅니다.`,{kind:'감독',acts:grad.slice(0,4).map(p=>({l:p.name,a:'player',v:p.id}))}); }
  /* 단장이 2군 선발 수업을 요청한 선수가 기준에 닿으면 알린다(한 번) */
  for(const id in (G.prole||{})){ const x=G.prole[id], p=G.players[id]; if(!p||p.team!==G.user){ delete G.prole[id]; continue; } if(x.k==='sp2'&&!x.told&&p.r.sta>=rpThr(G.user)){ x.told=true; const m=G.mgr[G.user]; mail('감독실',`${p.name} 선발 수업 성과`,`${m?m.name+' 감독':'코치진'}: ${p.name}이(가) 선발로 쓸 만큼 체력이 붙었습니다. 1군 선발 경쟁에 넣어도 되겠습니까?`,{kind:'감독',acts:[{l:'1군 선발 경쟁으로',a:'proleSet',v:`${p.id}:auto`},{l:'선수 보기',a:'player',v:p.id}]}); } } }
/* 감독이 이 투수를 어떻게 보는지(단장 요청과 별개) */
function rpMgrView(p){ const tid=p.team; const x=G.rplan&&G.rplan[p.id]; const k=x&&x.tid===tid?x.k:null; const thr=rpThr(tid);
  if(k==='sp2')return {k:'sp2',t:`2군에서 선발로 던지며 체력을 키우게 하겠습니다. ${rpWhy(p,tid)}.`};
  if(k==='rp')return {k:'rp',t:`신인이라 계투로 시작하겠습니다(1군 불펜 자리가 나면 올립니다). ${rpWhy(p,tid)}.`};
  return {k:p.r.sta+(p.rAdj||0)/.9>=thr?'sp':'rp',t:`체력과 투구 내용으로 선발 5명을 정합니다. ${rpWhy(p,tid)}.`}; }
function rpNow(p){ if(!p.isP)return ''; if(rpPlanOf(p.team,p)==='sp2')return '2군 선발 수업'; if(!p.e1&&entryOn())return '2군'; return p.role==='SP'?'1군 선발':'1군 계투'; }
/* 단장 요청 */
function proleSet(pid,k){ const p=G.players[pid]; if(!p||p.team!==G.user||!p.isP||G.unemp)return '우리 투수만 정할 수 있습니다.'; if(!PROLE[k])return ''; G.prole=G.prole||{};
  if(k==='auto'){ delete G.prole[pid]; return `${p.name}의 보직을 감독에게 맡겼습니다.`; }
  if(k==='sp2'&&p.age>27)return '2군 선발 수업은 27세 이하만 요청할 수 있습니다.';
  const m=G.mgr[G.user]; const cur=G.prole[pid]; if(cur&&cur.k===k)return '';
  if(G.proleNo&&G.proleNo[pid]>G.day)return `${m?m.name+' 감독':'감독'}이 얼마 전 거절했습니다. ${dmd(G.proleNo[pid])}부터 다시 요청할 수 있습니다.`;
  const view=m&&!m.interim?rpMgrView(p):null; const same=!view||view.k===k;
  if(!same){ const br=mplBreakListen(`${p.name} ${PROLE[k]}`); if(br)return br; mgrFix(m); const far=k==='sp'&&p.r.sta<rpThr(G.user)-8; const s=.9-(m.ego-50)/80+(m.rel-60)/100-(far?.2:0)+(mplOn('listen')?.3:0); const ok=R()<clamp(s,.3,.97);
    if(!ok){ m.rel=clamp(m.rel-2,0,100); (G.proleNo=G.proleNo||{})[pid]=G.day+7; return `${m.name} 감독: "${k==='sp'?`${p.name}은(는) 아직 선발로 길게 던질 몸이 아닙니다`:k==='sp2'?`${p.name}은(는) 지금 1군 불펜에 필요합니다`:`${p.name}은(는) 선발로 키울 선수입니다`}. 조금 더 지켜봐 주십시오." 요청을 받아들이지 않았습니다(관계 -2). 7일 뒤 다시 요청할 수 있습니다.`; }
    if(m.ego>=65&&!mplOn('listen'))m.rel=clamp(m.rel-1,0,100); }
  G.prole[pid]={k,d:G.day}; if(k==='sp2'){ p.role='SP'; if(p.e1){ p.e1=false; p.downDay=G.day; entryManage(G.user,false,true); } } else if(k==='rp'){ p.role='RP'; } else if(k==='sp'){ try{ depth(G.user); }catch(e){} }
  const tail=same?'감독도 같은 생각입니다.':m&&mplOn('listen')?`${m.name} 감독이 약속대로 단장 건의를 받아들였습니다.`:m&&m.ego>=65?`${m.name} 감독이 썩 내켜하지 않지만 받아들였습니다(관계 -1).`:`${m?m.name+' 감독이':'코치진이'} 받아들였습니다.`;
  return `${p.name}: ${PROLE[k]}. ${tail}${k==='sp'&&!p.e1&&entryOn()?' 지금 2군이라 1군에 올라와야 선발로 나갑니다.':''}`; }
