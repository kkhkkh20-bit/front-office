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
/* 명시 구단이 있는 요청은 그 구단 운영 계획이다. 이직 뒤에도 남고, 선수 이적에는 따라가지 않는다. */
function rpClubRequest(tid,p){if(!p||p.team!==tid)return null;const direct=G.prole&&G.prole[p.id],saved=G.clubT&&G.clubT[tid]&&G.clubT[tid].prole&&G.clubT[tid].prole[p.id];if(direct&&(direct.tid===tid||direct.tid==null&&tid===G.user))return direct;return saved&&(saved.tid??tid)===tid?saved:null;}
function rpPlanOf(tid,p){ if(!p||!p.isP||p.team!==tid)return null;const request=rpClubRequest(tid,p);if(request)return request.k;const x=G.rplan&&G.rplan[p.id];return x&&x.tid===tid?x.k:null; }
function rpBias(tid,p){ const k=rpPlanOf(tid,p); return k==='sp'?12:k==='rp'?-25:0; }
/* ===== 선발 순번(카페 11-19: 선발 요청한 유망주 둘이 1·2선발이 되고 기존 선발이 3~5선발로 밀렸다) =====
 단장의 선발 요청·선발 보직 약속은 '선발 5명에 넣을지'에만 가산한다. 다섯 명 안의 순번은 감독이 자기 기준(구위·제구·체력, 체력 기준, 최근 내용, 맡겨 온 보직, 운영 방침)으로 매긴다.
 순번은 쉽게 바뀌지 않는다: 어제 순번을 그대로 두고, 아래 순번 투수의 평가가 SP_ORD_GAP 넘게 앞설 때만 자리를 바꾼다. 새로 들어온 투수는 평가에 맞는 자리에 끼운다. 새 시즌에는 처음부터 다시 매긴다.
 순번 기억(t.spO)은 하루 한 번 roleSync에서만 저장한다(화면 조회는 저장하지 않는다). 모든 구단 같은 규칙. 주 난수를 쓰지 않는다 */
const SP_ORD_GAP=3;
function spAskB(tid,p){ return (rpPlanOf(tid,p)==='sp'?rpBias(tid,p)-staGate0(p):0)+rpB(tid,p,'SP'); } /* 단장 요청·보직 약속이 선발 고르기에 준 가산: 순번에서는 뺀다 */
function spOrder(tid,five,nat){ const t=team(tid), V=new Map(five.map(p=>[p.id,nat(p)])), v=p=>V.get(p.id); const byV=[...five].sort((a,b)=>v(b)-v(a));
  const o=t&&t.spO&&t.spO.y===G.year?t.spO.ids:null; if(!o)return byV;
  const L=o.map(id=>five.find(p=>p.id===id)).filter(Boolean); if(!L.length)return byV;
  for(const p of byV){ if(L.includes(p))continue; const i=L.findIndex(q=>v(q)<v(p)); if(i<0)L.push(p); else L.splice(i,0,p); }
  for(let n=0;n<5;n++){ let sw=false; for(let i=0;i+1<L.length;i++)if(v(L[i+1])>v(L[i])+SP_ORD_GAP){ const x=L[i]; L[i]=L[i+1]; L[i+1]=x; sw=true; } if(!sw)break; }
  return L; }
const rpFitGap=(p,tid)=>p.r.sta+(p.rAdj||0)/.9-rpThr(tid);
function rpWhy(p,tid){ const thr=rpThr(tid), m=mgrOf(tid); const sm=m&&m.small!=null?m.small:50; const gap=rpFitGap(p,tid);
  const st=gap>=3?'선발로 버틸 체력이 됩니다':gap>=-3?'선발 체력 기준에 거의 닿았습니다':gap>=-9?'선발로 던지기에는 체력이 조금 모자랍니다':'선발로 던지기에는 체력이 많이 모자랍니다';
  return ((p.rAdj||0)?'선발 적성을 반영하면 ':'')+st+(sm>=65?' (짧게 끊어 가는 운영이라 체력 기준이 낮은 편)':(m&&m.pen>=65)?' (불펜 비중이 커서 선발 체력 기준이 높은 편)':''); }
/* 매주(시즌 준비·정규시즌): 신인 계획을 세우고, 선발 수업을 마친 선수를 올리고, 2군 선발 수업 중인 투수는 2군에서 선발로 던지게 한다 */
function rpWeek(){ if(G.bprole)for(const id in G.bprole){ const x=G.bprole[id], p=G.players[id]; if(!p||p.team!==x.tid||!p.isP)delete G.bprole[id]; } /* 떠난 선수의 불펜 역할 요청은 지운다 */ const per=period(); if(per!=='pre'&&per!=='season')return; G.rplan=G.rplan||{}; const y=G.year; const myNew=[], grad=[];
  for(const t of G.teams){ const ctx=rpCtx(t.id); const thr=rpThr(t.id);
    for(const p of playersOf(t.id)){ if(!p.isP||p.foreign)continue; let x=G.rplan[p.id]; if(x&&x.tid!==t.id){ delete G.rplan[p.id]; x=null; }
      if(!x&&isNewP(p)&&!(p.joinY>G.year)){ const k=mgrRolePlan(p,t.id,ctx); G.rplan[p.id]={k:k||'auto',tid:t.id,y}; if(t.id===G.user&&!G.unemp)myNew.push(p); continue; }
      if(!x)continue;
      if(x.k==='rp'&&x.y<y)delete G.rplan[p.id]; /* 계투 시작은 첫해만: 다음 해부터는 체력과 투구 내용으로 경쟁 */
      else if(x.k==='sp2'){ if(p.r.sta>=thr||y-x.y>=2){ G.rplan[p.id]={k:'done',tid:t.id,y}; /* 마친 기록을 남겨 다음 주 신인 배정에서 다시 수업으로 보내지 않는다(검수 11-08) */ if(t.id===G.user&&!(G.prole&&G.prole[p.id]&&G.prole[p.id].k==='sp2'))grad.push(p); } /* 단장 요청이 남아 있으면 실제 보직은 그대로라 '마침' 메일을 보내지 않는다. 그 선수는 아래 '선발 수업 성과' 메일로 전환을 묻는다(검수 11-06) */ else if(p.age>25){ G.rplan[p.id]={k:'done',tid:t.id,y}; } } /* 체력이 선발 기준에 닿거나 두 시즌을 채우면 수업을 마치고 선발 경쟁에 들어간다 */
      else if(x.k==='auto'&&x.y<y)delete G.rplan[p.id]; } }
  /* 2군 선발 수업 중이면 2군에서 선발로 나간다 */
  for(const p of Object.values(G.players)){ if(!p.isP||p.team==null||p.e1)continue; if(rpPlanOf(p.team,p)==='sp2'){ p.role='SP'; if(per==='season'&&healthy(p)&&!isAway(p)){ /* 대표팀 차출 중에도 구단 수업 효과 없음(검수 11-08) */ const rm=trnRoom(p,'sta'); if(rm>0){ growYearBase(p); const gr0={...p.r}; addR(p,'sta',.05*clamp(rm/8,.2,1)); growYearCap(p,gr0); /* 한 해 육성 상한(04_growth) */ } } } /* 체력 성장 여력이 없으면 오르지 않는다(검수 11-06) */ } /* 선발로 길게 던지며 체력이 붙는다 */
  if(myNew.length){ const m=G.mgr[G.user]; const fm=(coachesOf(G.user)||{}).fm; const row=p=>{ const k=G.rplan[p.id].k; return `${p.name}(${p.age}세): ${k==='sp2'?'2군 선발 수업':k==='rp'?'계투로 시작':'선발 경쟁'} · ${rpWhy(p,G.user)}`; };
    /* 1군에서 쓸 투수는 1군 감독이, 2군 선발 수업은 2군 감독이 맡아 말한다(커뮤니티 11-12: 1군 감독이 2군 보직을 정하는 것처럼 보였다) */
    const L1=myNew.filter(p=>G.rplan[p.id].k!=='sp2').map(row), L2=myNew.filter(p=>G.rplan[p.id].k==='sp2').map(row);
    const L=[...(L1.length?[`${m?m.name+' 감독':'1군 코치진'}(1군):`,...L1]:[]),...(L2.length?[`${L1.length?'\n':''}${fm?fm.name+' 2군 감독':'2군 코치진'}(2군에서 선발로 키움):`,...L2]:[])];
    mail('감독실',`신인 투수 보직 계획 (${myNew.length}명)`,`신인 투수들은 이렇게 시작하려 합니다.\n\n${L.join('\n')}\n\n체력이 붙고 내용이 좋아지면 언제든 바꿉니다. 다르게 쓰고 싶으시면 선수 정보 육성 탭의 '보직'에서 말씀해 주십시오.`,{kind:'감독',acts:myNew.slice(0,4).map(p=>({l:p.name,a:'player',v:p.id}))}); }
  if(grad.length){ const fm=(coachesOf(G.user)||{}).fm; mail('감독실',`2군 선발 수업 마침 (${grad.length}명)`,`${fm?fm.name+' 2군 감독':'2군 코치진'}: ${grad.map(p=>`${p.name}(${p.r.sta>=rpThr(G.user)?'선발 체력 기준 도달':'두 시즌 수업 완료'})`).join(', ')}의 2군 선발 수업을 마칩니다. 이제부터 체력과 투구 내용으로 다른 투수들과 선발 자리를 다툽니다. 선발 5명에 들지 못하면 불펜에서 기회를 봅니다.`,{kind:'감독',acts:grad.slice(0,4).map(p=>({l:p.name,a:'player',v:p.id}))}); }
  /* 단장이 2군 선발 수업을 요청한 선수가 기준에 닿으면 알린다(한 번) */
  for(const id in (G.prole||{})){ const x=G.prole[id], p=G.players[id], xt=x.tid??G.user; if(!p||p.team!==xt){ delete G.prole[id]; continue; } if(xt!==G.user)continue; /* 다른 구단으로 옮겨도 그 구단 요청은 남겨 둔다(돌아오면 그대로) */ if(x.k==='sp2'&&!x.told&&p.r.sta>=rpThr(G.user)){ x.told=true; const m=G.mgr[G.user]; mail('감독실',`${p.name} 선발 수업 성과`,`${m?m.name+' 감독':'코치진'}: ${p.name}이(가) 선발로 쓸 만큼 체력이 붙었습니다. 1군 선발 경쟁에 넣어도 되겠습니까?`,{kind:'감독',acts:[{l:'1군 선발 경쟁으로',a:'proleSet',v:`${p.id}:auto`},{l:'선수 보기',a:'player',v:p.id}]}); } } }
/* 감독이 이 투수를 어떻게 보는지(단장 요청과 별개) */
function rpMgrView(p){ const tid=p.team; const x=G.rplan&&G.rplan[p.id]; const k=x&&x.tid===tid?x.k:null; const thr=rpThr(tid);
  if(k==='sp2')return {k:'sp2',t:`2군에서 선발로 던지며 체력을 키우게 하겠습니다. ${rpWhy(p,tid)}.`};
  if(k==='rp')return {k:'rp',t:`신인이라 계투로 시작하겠습니다(1군 불펜 자리가 나면 올립니다). ${rpWhy(p,tid)}.`};
  return {k:rpFitGap(p,tid)>=0?'sp':'rp',t:`체력과 투구 내용으로 선발 5명을 정합니다. ${rpWhy(p,tid)}.`}; }
function rpNow(p){ if(!p.isP)return ''; if(rpPlanOf(p.team,p)==='sp2')return '2군 선발 수업'; if(!p.e1&&entryOn())return '2군'; return p.role==='SP'?'1군 선발':'1군 계투'; }
/* 단장 요청 */
function proleSet(pid,k){ const p=G.players[pid]; if(!p||p.team!==G.user||!p.isP||G.unemp)return '우리 투수만 정할 수 있습니다.'; if(!PROLE[k])return ''; if(p.joinY>G.year)return `${p.name}은(는) ${p.joinY}년 합류 예정이라 아직 보직을 정할 수 없습니다.`; /* 훈련·포지션 전환과 같게(검수 11-06) */ G.prole=G.prole||{};
  if(k==='auto'){ delete G.prole[pid]; return `${p.name}의 보직을 감독에게 맡겼습니다.`; }
  if(k==='sp2'&&p.age>27)return '2군 선발 수업은 27세 이하만 요청할 수 있습니다.';
  const m=G.mgr[G.user]; const cur=G.prole[pid]; if(cur&&cur.k===k)return '';
  { const x=G.proleNo&&G.proleNo[pid]; const u=x&&(typeof x==='object'?x.u:x); if(u>G.day&&!(typeof x==='object'&&m&&x.mid!==m.id))return `${m?m.name+' 감독':'감독'}이 얼마 전 거절했습니다. ${dmd(u)}부터 다시 요청할 수 있습니다.`; } /* 거절한 감독이 바뀌었으면 새 감독이 다시 검토 */
  const view=m&&!m.interim?rpMgrView(p):null; const same=!view||view.k===k;
  if(!same){ const br=mplBreakListen(`${p.name} ${PROLE[k]}`); if(br)return br; mgrFix(m); const far=k==='sp'&&p.r.sta<rpThr(G.user)-8; const s=.9-(m.ego-50)/80+(m.rel-60)/100-(far?.2:0)+(mplOn('listen')?.3:0); const ok=R()<clamp(s,.3,.97);
    if(!ok){ m.rel=clamp(m.rel-2,0,100); (G.proleNo=G.proleNo||{})[pid]={u:G.day+7,mid:m.id}; return `${m.name} 감독: "${k==='sp'?`${p.name}은(는) 아직 선발로 길게 던질 몸이 아닙니다`:k==='sp2'?`${p.name}은(는) 지금 1군 불펜에 필요합니다`:`${p.name}은(는) 선발로 키울 선수입니다`}. 조금 더 지켜봐 주십시오." 요청을 받아들이지 않았습니다. 관계 조금 악화. 7일 뒤 다시 요청할 수 있습니다.`; }
    if(m.ego>=65&&!mplOn('listen'))m.rel=clamp(m.rel-1,0,100); }
  G.prole[pid]={k,d:G.day,tid:G.user}; if(k==='sp2'){ p.role='SP'; if(p.e1){ p.e1=false; p.downDay=G.day; entryManage(G.user,false,true); } } else if(k==='rp'){ p.role='RP'; } else if(k==='sp'){ try{ roleSync(G.user); }catch(e){} }
  const tail=same?'감독도 같은 생각입니다.':m&&mplOn('listen')?`${m.name} 감독이 약속대로 단장 건의를 받아들였습니다.`:m&&m.ego>=65?`${m.name} 감독이 썩 내켜 하지 않지만 받아들였습니다. 관계 조금 악화.`:`${m?m.name+' 감독이':'코치진이'} 받아들였습니다.`;
  return `${p.name}: ${PROLE[k]}. ${tail}${k==='sp'&&!p.e1&&entryOn()?' 지금 2군이라 1군에 올라와야 선발로 나갑니다.':k==='sp'&&p.role!=='SP'?' 선발 경쟁에 가산점을 받지만 아직 선발 5명에 들지 못해 당분간 계투로 나갑니다.':''}`; }
/* ===== 불펜 역할(일고회장 11-12): 단장이 마무리·필승조·추격조·롱릴리프를 요청한다 =====
 - 기본은 감독이 정한 불펜 순서다(첫째 마무리, 둘째~넷째 필승조, 나머지 추격조).
 - 요청은 선발·계투 요청과 같은 규칙으로 감독이 받아들이거나(대개) 거절한다(7일 뒤 다시). 마무리는 한 명만.
 - 경기: 마무리는 9회 3점 차 이내 리드, 필승조는 7회 이후 박빙, 추격조는 지고 있거나 크게 벌어진 경기,
   롱릴리프는 선발이 5회 이전에 내려가면 먼저 나와 여러 이닝을 던진다. */
const BROLE={auto:'감독에게 맡김',cl:'마무리',su:'필승조',mr:'추격조',lr:'롱릴리프'};
function bproleOf(tid,p){ const x=G.bprole&&p&&G.bprole[p.id]; return x&&x.tid===tid&&p.team===tid?x.k:null; }
function penArrange(tid,rest){ if(!G.bprole||!rest.some(p=>bproleOf(tid,p)))return rest; const k=p=>bproleOf(tid,p);
  const cl=rest.filter(p=>k(p)==='cl'), su=rest.filter(p=>k(p)==='su'), au=rest.filter(p=>!k(p)), mr=rest.filter(p=>k(p)==='mr'), lr=rest.filter(p=>k(p)==='lr');
  const closer=cl[0]||au.shift()||su.shift(); const setup=[...cl.slice(1),...su]; while(setup.length<3&&au.length)setup.push(au.shift());
  return [closer,...setup,...au,...lr,...mr].filter(Boolean); } /* 끝에서부터 고르는 큰 점수 차 경기는 추격조가 먼저, 롱릴리프는 선발 조기 강판 때 */
function bproleNat(p){ const s=G.bprole; G.bprole=null; let d; try{ d=depth(G.user); }finally{ G.bprole=s; } const j=d.pen.findIndex(x=>x.id===p.id); return j<0?null:j===0?'cl':j<=3?'su':'mr'; }
function bproleSet(pid,k){ const p=G.players[pid]; if(!p||p.team!==G.user||!p.isP||G.unemp)return '우리 투수만 정할 수 있습니다.'; if(!BROLE[k])return ''; if(p.joinY>G.year)return `${p.name}은(는) ${p.joinY}년 합류 예정이라 아직 역할을 정할 수 없습니다.`; G.bprole=G.bprole||{};
  if(k==='auto'){ delete G.bprole[pid]; return `${p.name}의 불펜 역할을 감독에게 맡겼습니다.`; }
  const cur=bproleOf(G.user,p); if(cur===k)return ''; const m=G.mgr[G.user];
  { const x=G.bproleNo&&G.bproleNo[pid]; if(x&&x.u>G.day&&!(m&&x.mid!==m.id))return `${m?m.name+' 감독':'감독'}이 얼마 전 거절했습니다. ${dmd(x.u)}부터 다시 요청할 수 있습니다.`; }
  const nat=m&&!m.interim?bproleNat(p):null; const same=!m||m.interim||nat===k;
  if(!same){ const br=mplBreakListen(`${p.name} ${BROLE[k]}`); if(br)return br; mgrFix(m); const far=k==='cl'&&nat!=='su'&&nat!=='cl'; const s=.9-(m.ego-50)/80+(m.rel-60)/100-(far?.2:0)+(mplOn('listen')?.3:0); const ok=R()<clamp(s,.3,.97);
    if(!ok){ m.rel=clamp(m.rel-2,0,100); (G.bproleNo=G.bproleNo||{})[pid]={u:G.day+7,mid:m.id}; return `${m.name} 감독: "${k==='cl'||k==='su'?`${p.name}은(는) 아직 접전 막판을 맡길 공이 아닙니다`:`${p.name}은(는) 지금 접전에 필요한 투수입니다`}. 조금 더 지켜봐 주십시오." 요청을 받아들이지 않았습니다. 관계 조금 악화. 7일 뒤 다시 요청할 수 있습니다.`; }
    if(m.ego>=65&&!mplOn('listen'))m.rel=clamp(m.rel-1,0,100); }
  if(k==='cl')for(const id in G.bprole){ const x=G.bprole[id]; if(x.k==='cl'&&x.tid===G.user&&+id!==pid)x.k='su'; } /* 마무리는 한 명: 앞서 정한 마무리는 필승조로 */
  G.bprole[pid]={k,d:G.day,tid:G.user};
  const sp=p.role==='SP'||(G.prole&&G.prole[pid]&&G.prole[pid].k!=='rp'&&G.prole[pid].k!=='auto');
  const tail=same?'감독도 같은 생각입니다.':m&&mplOn('listen')?`${m.name} 감독이 약속대로 단장 건의를 받아들였습니다.`:m&&m.ego>=65?`${m.name} 감독이 썩 내켜 하지 않지만 받아들였습니다. 관계 조금 악화.`:`${m?m.name+' 감독이':'코치진이'} 받아들였습니다.`;
  return `${p.name}: 불펜 ${BROLE[k]}. ${tail}${sp?' 지금은 선발 보직이라 계투로 나갈 때부터 적용됩니다.':!p.e1&&entryOn()?' 지금 2군이라 1군에 올라오면 적용됩니다.':''}`; }
/* ===== 보직 유지(플레이어 제보 11-15, 34시즌 저장: 건강하고 잘 던지는 투수가 선발↔불펜, 마무리→선발로 너무 자주 바뀌어 승·세이브·홀드와 타이틀이 섞였다) =====
 감독은 맡긴 보직을 쉽게 바꾸지 않는다. 올해(올해 기록이 적으면 지난해) 주로 선발로 던졌고 내용이 괜찮으면 선발 고르기에 가산,
 주로 계투·마무리로 던졌고 내용이 괜찮으면 선발 고르기에 감산하고, 마무리는 불펜 첫째 자리에 가산한다.
 부진(평균자책점이 리그 평균+1.0 이상)하면 가산·감산이 없어 예전처럼 능력·체력으로 다시 정한다. 부상으로 빠지면 그동안은 다른 투수가 채우고, 돌아오면 원래 보직 쪽으로 돌아간다.
 모든 구단(사용자 구단 감독 포함) 같은 규칙. 단장 보직 요청(rpBias)이 더 크다. 숨김 값이며 화면에는 보직 결과만 보인다 */
const RK={sp:7,rp:-5,cl:-18,clPen:8};
let _rkC=new Map(), _rkD=null, _rkG=null;
/* 그날 치른 경기 수(리그 전체 승·패·무 합): 같은 날이라도 경기를 치러 기록이 바뀌면 보직 판단을 다시 한다. 예전에는 하루 한 번만 계산해, 경기 뒤 같은 날 저장·불러오기를 하면 불러온 쪽만 새 기록으로 계산돼 보직·기분 이유가 달라졌다(검사 [팀 분위기·사기]) */
function rkStatN(){ const R=G.sea&&G.sea.rec; if(!R)return 0; let n=0; for(const r of R)if(r)n+=(r.w||0)+(r.l||0)+(r.t||0); return n; }
function roleKeep(p){ if(!p||!p.isP||!p.hist)return null; const key=G.year*400+G.day+':'+rkStatN(); if(_rkD!==key||_rkG!==G){ _rkC=new Map(); _rkD=key; _rkG=G; } let v=_rkC.get(p.id); if(v!==undefined)return v; v=null;
  try{ const cur=seasonTotal(p,G.year,'1군'), prev=seasonTotal(p,G.year-1,'1군'); const curN=cur&&(cur.g||0)>=4; const h=curN?cur:prev&&(prev.g||0)>=12?prev:null;
    if(h){ const g=h.g||0, gs=h.gs||0, sv=h.sv||0; const lgE=lgOf(h.y).era||4.6; const era=(h.outs||0)>=30?h.er*27/h.outs:null; const ok=era==null||era<lgE+1;
      const k=gs>=g*.6?'sp':sv>=Math.max(curN?4:12,g*.22)?'cl':gs<=g*.2?'rp':null; v=ok&&k?k:null; } }catch(e){ v=null; }
  _rkC.set(p.id,v); return v; }
function roleKeepSP(p){ const k=roleKeep(p); return k==='sp'?RK.sp:k==='rp'?RK.rp:k==='cl'?RK.cl:0; }
function roleKeepPen(p){ return roleKeep(p)==='cl'?RK.clPen:0; }
