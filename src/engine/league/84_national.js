/* ===== 국가대표: 아시안게임 · 올림픽 · WBC · 프리미어12 =====
   실제 규정과 주기:
   - 아시안게임(9월, 2026 아이치·나고야 이후 4년마다): 만 25세 이하 또는 입단 4년 차 이하 + 와일드카드 3명(29세 이하), 구단당 최소 1명·최대 3명, 24명(투수 11·포수 2·내야 7·외야 4).
     4월에 사전 등록 명단(예비 명단)을 내고, 6월에 그 안에서 최종 24명을 뽑는다.
     KBO는 2022년 대회 이후 리그를 멈추지 않는다 → 뽑힌 선수는 대회 기간 소속 팀에서 뛰지 못한다. 금메달이면 미필 선수 병역 특례.
   - 올림픽(7~8월, 2028 LA 이후 4년마다로 가정): 리그 중. 3위 이상이면 병역 특례.
   - WBC(3월, 시범경기 무렵, 게임 가정 2030년부터 4년마다) · 프리미어12(11월, 2027년부터 4년마다): 병역 특례 없음(2007년 폐지).
   흐름: 국가대표 감독이 명단을 발표 → 우리 선수는 차출 거부 가능(팬·언론 여론 하락, 미필 선수는 특례 기회를 잃어 크게 반발) →
         대회 기간 이탈(isAway) → 결과(메달·성적) → 대회에서 활약한 선수는 '대표팀 영웅'으로 스타가 된다 */
const NT_EV={
  wbc:{n:'WBC',yr:y=>y>=2030&&(y-2030)%4===0,ann:[1,20],from:[2,24],to:[3,22],res:[3,20],ex:null},
  oly:{n:'올림픽',yr:y=>olyYear(y),pre:[4,15],ann:[6,10],from:[7,13],to:[7,22],res:[7,21],ex:'top3'},
  ag:{n:'아시안게임',yr:y=>y>=2026&&(y-2026)%4===0,pre:[4,15],ann:[6,11],from:[9,16],to:[9,28],res:[9,27],ex:'gold',u25:true,cap:3,min:1},
  p12:{n:'프리미어12',yr:y=>y>=2027&&(y-2027)%4===0,ann:[10,8],from:[11,6],to:[11,20],res:[11,18],ex:null}
};
const NT_SLOTS={P:11,C:2,IF:7,OF:4}, NT_WILD=3, NT_WILD_AGE=29;
const ntBucket=p=>p.isP?'P':p.pos==='C'?'C':['LF','CF','RF'].includes(p.pos)?'OF':'IF';
const ntProY=(p,y)=>{ y=y||G.year; return p.draft&&p.draft.y?Math.max(1,y-p.draft.y):Math.max(1,p.age+y-G.year-19); }; /* 프로 몇 년 차(지명 이듬해가 1년 차). y: 대회 연도(미래 대회 예상은 그해 기준, 검수 11-09u) */
const ntU25=(p,y)=>p.age+(y||G.year)-G.year<=25||ntProY(p,y)<=4; /* 아시안게임 자격: 둘 중 하나만 맞으면 된다(2026: 2001년 이후 출생 또는 2023년 이후 입단) */
function ntMgr(){ if(!G.ntMgr)G.ntMgr={name:genName(),since:G.year}; return G.ntMgr; }
/* 다음 대회들(올해부터 몇 년 안) */
function ntUpcoming(n){ const L=[]; for(let y=G.year;y<=G.year+4&&L.length<(n||4);y++)for(const k of ['wbc','oly','ag','p12']){ const e=NT_EV[k]; if(!e.yr(y))continue; const end=dnum(y,e.to[0],e.to[1]); if(y===G.year&&end<G.day)continue; L.push({k,y,n:e.n,from:dnum(y,e.from[0],e.from[1]),to:end}); } return L.slice(0,n||4); }
function ntPool(d1){ return Object.values(G.players).filter(p=>p.team!=null&&!p.foreign&&!p.prospect&&!(p.ntAway&&p.ntAway>G.day&&p.ntFrom<=G.day)&&(healthy(p)||d1&&p.injOut===1&&!(p.susp>G.day)&&!p.frehab&&!p.hold)&&!(p.joinY>G.year)&&!(milServing(p)&&p.mil.unit!=='상무')); } /* 실제처럼 상무 복무·입대 예정 선수는 뽑을 수 있고, 현역 복무 중인 선수는 뽑지 않는다. 특례를 받으면 복무가 면제된다 */
/* 대표 명단: 감독 눈(능력 + 감독마다 다른 선호 약간). 아시안게임은 나이 제한·와일드카드·구단당 3명 */
/* 병역 특례가 걸린 대회(올림픽·아시안게임)는 같은 실력이면 미필 선수를 먼저 뽑는다: 미필 중심에 군필 몇 명이 섞이는 실제 구성 */
function ntMilB(k){ const e=NT_EV[k]; return e&&e.ex?(k==='ag'?8:7):0; }
/* 감독 평가 점수: 최초 선발과 대체 발탁이 같이 쓴다(검수 11-09u: 대체 발탁에 미필 가산이 빠짐). dy: 대회까지 남은 해 */
function ntVal(k,dy){ const M=ntMgr(), mb=ntMilB(k), rec=ntRecIds(k); dy=dy||0; return p=>ovr(p)+hn('nt'+M.name+G.year+k,p.id)*2.5+(mb&&!p.foreign&&!(p.mil&&(p.mil.done||p.mil.exempt))&&p.age+dy<=30?mb:0) /* 특례 대상(ntResult와 같은 기준): 입대 예약만으로 가산이 사라지지 않게(검수 11-09zj) */+(rec.has(p.id)&&p.team===G.user?5:0); } /* 구단 추천 +5(커뮤니티 요청 11-07) */
function ntSquad(k,excl,o){ o=o||{}; const e=NT_EV[k]; const ex=new Set(excl||[]); const Y=o.y||G.year, dy=Y-G.year; const v=ntVal(k,dy); const mul=o.mul||1, cap=e.cap?e.cap*mul:0, only=o.only?new Set(o.only):null;
  const base=ntPool().filter(p=>!ex.has(p.id)).map(p=>({p,v:v(p),b:ntBucket(p),ok:!e.u25||ntU25(p,Y)})).sort((a,b)=>b.v-a.v);
  const pool=only?base.filter(x=>only.has(x.p.id)).concat(base.filter(x=>!only.has(x.p.id))):base; /* 최종 명단은 예비 명단 안에서 먼저 뽑고, 모자라면 밖에서 채운다 */
  const per={}, cnt={P:0,C:0,IF:0,OF:0}, S=[]; const capOk=x=>!cap||(per[x.p.team]||0)<cap; const put=x=>{ S.push(x); cnt[x.b]++; per[x.p.team]=(per[x.p.team]||0)+1; }; const drop=x=>{ S.splice(S.indexOf(x),1); cnt[x.b]--; per[x.p.team]--; };
  for(const x of pool){ if(!x.ok||cnt[x.b]>=NT_SLOTS[x.b]*mul||!capOk(x))continue; put(x); }
  if(e.u25){ let w=0; for(const x of pool){ if(w>=NT_WILD*mul)break; if(x.ok||S.includes(x)||x.p.age+dy>NT_WILD_AGE)continue; const outs=S.filter(s=>s.b===x.b&&!s.wild).sort((a,b)=>a.v-b.v);
      const out=capOk(x)?outs[0]:outs.find(s=>s.p.team===x.p.team); /* 구단 인원이 찼으면 같은 구단 선수와 바꾼다(검수 11-09u) */ if(!out||x.v<=out.v+1)continue; drop(out); x.wild=true; put(x); w++; } }
  /* 구단당 제한 때문에 빈 포지션: 그 구단에서 다른 묶음으로 뽑힌 선수를 다른 구단 선수로 바꾸고 자리를 채운다(검수 11-06: 포수 6명이 있어도 0명으로 확정) */
  for(let g=0;g<30;g++){ const short=Object.keys(NT_SLOTS).find(b=>cnt[b]<NT_SLOTS[b]*mul&&pool.some(x=>x.b===b&&x.ok&&!S.includes(x))); if(!short)break; let done=false;
    for(const c of pool){ if(c.b!==short||!c.ok||S.includes(c))continue; if(capOk(c)){ put(c); done=true; break; }
      const outs=S.filter(s=>s.p.team===c.p.team&&s.b!==short&&!s.wild).sort((a,b)=>a.v-b.v); for(const s of outs){ const r=pool.find(x=>x.b===s.b&&x.ok&&!S.includes(x)&&x!==c&&x.p.team!==c.p.team&&capOk(x)); if(!r)continue; drop(s); put(c); put(r); done=true; break; } if(done)break; }
    if(!done)break; }
  if(e.u25){ let w=S.filter(x=>x.wild).length; for(const x of pool){ if(w>=NT_WILD*mul)break; if(x.ok||S.includes(x)||x.p.age+dy>NT_WILD_AGE||cnt[x.b]>=NT_SLOTS[x.b]*mul||!capOk(x))continue; x.wild=true; put(x); w++; } } /* 일반 자격자로 못 채운 자리는 와일드카드로 */
  /* 구단당 최소 인원: 한 명도 없는 구단은 그 구단 최고 선수를 넣고, 여러 명 뽑힌 구단의 같은 묶음 하위 선수를 뺀다 */
  if(e.min&&mul===1)for(const t of G.teams){ if((per[t.id]||0)>=e.min)continue; const c=pool.find(x=>x.p.team===t.id&&(x.ok||x.p.age+dy<=NT_WILD_AGE&&S.filter(s=>s.wild).length<NT_WILD)&&!S.includes(x)&&S.some(s=>s.b===x.b&&!s.wild&&(per[s.p.team]||0)>e.min)); if(!c)continue; /* 남은 와일드카드 자리로도 채운다(검수 11-09zj) */
    const out=S.filter(s=>s.b===c.b&&!s.wild&&(per[s.p.team]||0)>e.min).sort((a,b)=>a.v-b.v)[0]; drop(out); if(!c.ok)c.wild=true; put(c); }
  return S.map(x=>({id:x.p.id,wild:!!x.wild})); }
/* 거부한 자리 채우기: 같은 포지션 묶음에서 규정에 맞는 다음 선수 */
function ntFill(N,b,tid){ const e=NT_EV[N.k]; const have=new Set(N.ids.concat(N.ref||[])); const per={}; for(const id of N.ids){ const q=G.players[id]; if(q)per[q.team]=(per[q.team]||0)+1; }
  const wild=(N.wild||[]).length; const v=ntVal(N.k);
  const c=ntPool(true).filter(p=>!have.has(p.id)&&ntBucket(p)===b&&(!e.cap||(per[p.team]||0)<e.cap)&&(!e.u25||ntU25(p)||(wild<NT_WILD&&p.age<=NT_WILD_AGE))).sort((a,b2)=>v(b2)-v(a)); if(e.min&&tid!=null&&(per[tid]||0)<e.min){ const m=c.find(p=>p.team===tid); if(m)return m; } /* 구단당 최소 인원: 빠진 선수 구단에서 먼저 */ return c[0]||null; }
/* 사전 등록(예비) 명단: 최종 인원의 두 배쯤. 여기서 빠지면 최종 명단에 들기 어렵다 */
function ntPreAnnounce(k){ const e=NT_EV[k]; const M=ntMgr(); const S=ntSquad(k,null,{mul:2}); G.ntPre={k,y:G.year,ids:S.map(x=>x.id)};
  const mine=S.map(x=>G.players[x.id]).filter(p=>p&&p.team===G.user);
  mail('운영팀',`${G.year} ${e.n} 예비 명단`,`${M.name} 대표팀 감독이 예비 명단 ${S.length}명을 냈습니다. 최종 24명은 ${dmd(KD(e.ann[0],e.ann[1]))}에 주로 이 안에서 뽑히고, 부상 등으로 자리를 못 채우면 명단 밖에서도 뽑습니다.\n\n우리 구단: ${mine.map(p=>`${p.name}(${posLabel(p)}${milFree(p)?', 미필':''})`).join(', ')||'없음'}`,{kind:e.ex?'병역':'선수',acts:[{l:'국가대표',a:'go',v:'league:nt'}]}); }
function ntState(){ /* 예전 저장의 올림픽(G.oly)을 국가대표 상태로 옮긴다 */
  if(G.oly&&G.oly.y===G.year&&!(G.nt&&G.nt.y===G.year))G.nt={k:'oly',y:G.oly.y,ids:G.oly.ids.slice(),wild:[],ref:[],res:G.oly.res||null};
  return G.nt; }
function ntTxt(N){ const e=NT_EV[N.k]; return `${N.y} ${e.n}`; }
function ntDaily(d){ ntState(); for(const k of Object.keys(NT_EV)){ const e=NT_EV[k]; if(!e.yr(G.year))continue; const D=a=>KD(a[0],a[1]);
    if(e.pre&&d===D(e.pre))ntPreAnnounce(k);
    if(d===D(e.ann))ntAnnounce(k);
    const N=G.nt; if(!N||N.k!==k||N.y!==G.year)continue;
    if(d===D(e.from)){ let mo=[]; try{ mo=ntMedCheck(N); }catch(err){} try{ const dp=depth(G.user); N.role={}; N.rpos={}; for(const id of N.ids){ const p=G.players[id]; if(p&&p.team===G.user)N.rpos[id]=posLabel(p); if(p&&p.team===G.user)N.role[id]=dp.sp.some(x=>x.id===id)?'sp':p.isP?'pen':dp.start.some(x=>x.id===id)?'start':'bench'; } }catch(err){} /* 소집 직전 역할(대표팀 화면 영향 표시용) */ for(const id of N.ids){ const p=G.players[id]; if(p){ p.ntFrom=d; p.ntAway=D(e.to); p.e1=false; } } const mine=N.ids.map(id=>G.players[id]).filter(p=>p&&p.team===G.user);
      if(mo.some(x=>x.r&&x.r.team===G.user))try{ ntShortGuard(d); }catch(err){}
      if(mine.length)addLog(`${e.n} 대표 소집: ${mine.map(p=>p.name).join(', ')} (${dmd(D(e.to))} 복귀)`); }
    if(d===D(e.res)&&!N.res)ntResult(k);
    if(d===D(e.to)){ const back=N.ids.map(id=>G.players[id]).filter(p=>p&&p.team===G.user); for(const t of G.teams){ try{ entryUpgrade(t.id,N.ids.map(id=>G.players[id]).filter(p=>p&&p.team===t.id),'대표팀 복귀'); }catch(err){} }
      if(back.length){ const off=back.filter(p=>!p.e1); mail('운영팀',`${e.n} 대표 선수 복귀`,`${back.map(p=>p.name).join(', ')}이(가) 돌아왔습니다.${back.some(p=>p.e1)?` 감독이 ${back.filter(p=>p.e1).map(p=>p.name).join(', ')}을(를) 1군에 다시 등록했습니다.`:''}${off.length?(entryOn()?`\n${off.map(p=>p.name).join(', ')}은(는) 아직 2군입니다(부상·기용 순위). 필요하면 선수 화면에서 감독에게 콜업을 요청하세요.`:`\n${off.map(p=>p.name).join(', ')}은(는) 개막 엔트리 결정 때 감독이 함께 판단합니다(개막 전에는 엔트리를 바꿀 수 없습니다).`):''}`,{kind:'선수',imp:off.length>0}); } } } }
function ntAnnounce(k){ const e=NT_EV[k]; const M=ntMgr(); const pre=G.ntPre&&G.ntPre.k===k&&G.ntPre.y===G.year?G.ntPre.ids:null; const S=ntSquad(k,null,{only:pre}); G.nt={k,y:G.year,ids:S.map(x=>x.id),wild:S.filter(x=>x.wild).map(x=>x.id),ref:[],res:null,ovs:k==='wbc'?ntAbroad():[], /* 해외파는 실제처럼 WBC만(아시안게임·올림픽·프리미어12는 메이저리그 구단이 보내지 않는다) */bk:Object.fromEntries(S.map(x=>[x.id,ntBucket(G.players[x.id])]))}; /* bk: 발표 뒤 은퇴·해외로 기록이 지워져도 대체 자리를 알 수 있게 */
  const mine=S.map(x=>G.players[x.id]).filter(p=>p.team===G.user); const D=a=>KD(a[0],a[1]);
  for(const p of mine)p.mor=clamp((p.mor??60)+6,0,100);
  const exTxt=e.ex==='gold'?'금메달이면 미필 선수는 병역 특례(체육요원)를 받습니다.':e.ex==='top3'?'3위 이상이면 미필 선수는 병역 특례(체육요원)를 받습니다.':'병역 특례는 없습니다.';
  mail('운영팀',`${G.year} ${e.n} 대표팀 명단 발표`,`${M.name} 대표팀 감독이 ${G.nt.ids.length}명을 뽑았습니다.${G.nt.ids.length<24?` (24명을 다 채우지 못했습니다)`:''}${G.nt.ovs.length?` 해외파 합류: ${G.nt.ovs.map(x=>`${x.name}(${x.lg} ${x.club})`).join(', ')}.`:''}${e.u25?' (만 25세 이하 또는 입단 4년 차 이하 + 와일드카드 3명, 구단당 1~3명)':''}\n\n우리 구단: ${mine.map(p=>`${p.name}(${posLabel(p)}${milFree(p)?', 미필':''}${G.nt.wild.includes(p.id)?', 와일드카드':''})`).join(', ')||'없음'}\n\n소집 ${dmd(D(e.from))} ~ ${dmd(D(e.to))}. 이 기간에는 우리 경기에 쓸 수 없습니다. ${exTxt}${mine.length?'\n\n차출을 거부할 수 있지만(리그 > 국가대표) 팬·언론 여론이 나빠지고, 미필 선수는 특례 기회를 잃어 크게 반발합니다.':''}`,{imp:mine.length>0,kind:e.ex?'병역':'선수',acts:[{l:'국가대표',a:'go',v:'league:nt'}]});
  if(mine.length)news('선수',`${tshort(G.user)} ${mine.map(p=>p.name).join('·')}, ${e.n} 대표 발탁`,`${M.name} 감독의 부름을 받았습니다.`,1); }
/* 소집일 재검사: 발탁 뒤 다쳤거나(재활·출장 정지) 리그를 떠난(해외·입대·은퇴) 선수는 의료·사유 제외로 빼고 같은 자리 대체 선수를 뽑는다.
   구단의 차출 거부(ntRefuse)와 달리 여론·선수 사기 불이익은 없다. 대회 성과·특례는 최종 명단(N.ids)만 받는다 */
/* 기록이 지워진 선수의 자리: 발표 때 저장한 묶음, 없으면(예전 저장) 정원보다 가장 모자란 묶음 */
function ntGoneB(N,id){ if(N.bk&&N.bk[id])return N.bk[id]; const c={P:0,C:0,IF:0,OF:0}; for(const x of N.ids){ const q=G.players[x]; if(q)c[ntBucket(q)]++; } return Object.keys(c).sort((a,b)=>(c[a]-NT_SLOTS[a])-(c[b]-NT_SLOTS[b]))[0]; }
function ntMedCheck(N,quiet){ const e=NT_EV[N.k]; const out=[]; const st=quiet?()=>{}:story; /* 예측(ntCallIds)은 이력을 남기지 않는다 */
  for(const id of N.ids.slice()){ const p=G.players[id]; const gone=!p||p.team==null||(milServing(p)&&p.mil.unit!=='상무'); const hurt=!gone&&!healthy(p)&&!(p.injOut===1&&!(p.susp>G.day)&&!p.frehab&&!p.hold); /* 재활이 하루 남은 선수는 오늘 회복하므로 남긴다(검수 11-07) */ if(!gone&&!hurt)continue;
    N.ids=N.ids.filter(x=>x!==id); N.wild=(N.wild||[]).filter(x=>x!==id); (N.ref=N.ref||[]).push(id); const why=hurt?(p.injOut>0?`부상(재활 ${p.injOut}일)`:p.hold?'연봉 미계약':p.frehab?'재활 명단':'출장 정지'):'리그 이탈';
    (N.med=N.med||[]).push({id,why,d:G.day}); const r=ntFill(N,(N.bk&&N.bk[id])||(p?ntBucket(p):ntGoneB(N,id)),p?p.team:null); /* 뽑힌 때의 자리로 대체(포지션이 바뀌었어도) */ if(r){ N.ids.push(r.id); if(N.bk)N.bk[r.id]=ntBucket(r); if(e.u25&&!ntU25(r))N.wild.push(r.id); N.med[N.med.length-1].rep=r.id; }
    if(p)st(p,`${N.y} ${e.n} 대표 제외(${hurt&&p.injOut>0?'의료 사유':'사유'}: ${why})`,'mil'); out.push({p,id,why,r}); }
  /* 구단당 인원 제한 재검사: 발표 뒤 트레이드로 한 구단에 몰리면 능력 낮은 선수부터 빼고 다른 구단에서 채운다(검수 11-07) */
  if(e.cap){ const per={}; for(const id of N.ids){ const q=G.players[id]; if(q)(per[q.team]=per[q.team]||[]).push(q); }
    for(const L of Object.values(per)){ if(L.length<=e.cap)continue; for(const p of L.sort((a,b)=>ovr(a)-ovr(b)).slice(0,L.length-e.cap)){ const id=p.id; N.ids=N.ids.filter(x=>x!==id); N.wild=(N.wild||[]).filter(x=>x!==id); (N.ref=N.ref||[]).push(id); const why='구단당 인원 초과(이적)';
      (N.med=N.med||[]).push({id,why,d:G.day}); const r=ntFill(N,(N.bk&&N.bk[id])||ntBucket(p),null); if(r){ N.ids.push(r.id); if(N.bk)N.bk[r.id]=ntBucket(r); if(e.u25&&!ntU25(r))N.wild.push(r.id); N.med[N.med.length-1].rep=r.id; } st(p,`${N.y} ${e.n} 대표 제외(사유: ${why})`,'mil'); out.push({p,why,r}); } } }
  /* 구단당 최소 인원 재검사: 대체 발탁으로 0명이 된 구단은 그 구단 선수를 넣고, 여러 명 뽑힌 구단의 같은 묶음 하위 선수를 뺀다(검수 11-08) */
  if(e.min){ const cntT=tid=>N.ids.filter(id=>G.players[id]&&G.players[id].team===tid).length; const have=new Set(N.ids.concat(N.ref||[]));
    for(const t of G.teams){ if(cntT(t.id)>=e.min)continue; const c=ntPool(true).filter(p=>p.team===t.id&&!have.has(p.id)&&(!e.u25||ntU25(p)||(N.wild||[]).length<NT_WILD&&p.age<=NT_WILD_AGE)).sort((a,b)=>ovr(b)-ovr(a)).find(c=>N.ids.some(id=>{ const q=G.players[id]; return q&&ntBucket(q)===ntBucket(c)&&cntT(q.team)>e.min&&!(N.wild||[]).includes(id); })); if(!c)continue;
      const o=N.ids.map(id=>G.players[id]).filter(q=>q&&ntBucket(q)===ntBucket(c)&&cntT(q.team)>e.min&&!(N.wild||[]).includes(q.id)).sort((a,b)=>ovr(a)-ovr(b))[0]; N.ids=N.ids.filter(x=>x!==o.id); (N.ref=N.ref||[]).push(o.id); N.ids.push(c.id); have.add(c.id); if(e.u25&&!ntU25(c))(N.wild=N.wild||[]).push(c.id); if(N.bk)N.bk[c.id]=ntBucket(c); (N.med=N.med||[]).push({id:o.id,why:'구단당 최소 인원 조정',d:G.day,rep:c.id}); st(o,`${N.y} ${e.n} 대표 제외(사유: 구단당 최소 인원 조정)`,'mil'); out.push({p:o,why:'구단당 최소 인원 조정',r:c}); } }
  if(quiet)return out; const mine=out.filter(x=>x.p&&x.p.team===G.user), rIn=out.filter(x=>x.r&&x.r.team===G.user);
  if(mine.length||rIn.length)mail('운영팀',`${e.n} 대표 명단 변경(소집일 검사)`,`${mine.length?`소집일 검사에서 우리 선수 ${mine.map(x=>`${x.p.name}(${x.why})`).join(', ')}이(가) 대표팀에서 빠졌습니다. 구단의 차출 거부가 아니라서 여론·선수 사기 불이익은 없고, 대회 성적·병역 특례도 받지 않습니다.`:''}${rIn.length?`${mine.length?'\n\n':''}대체 발탁: ${rIn.map(x=>x.r.name).join(', ')}(${dmd(KD(e.to[0],e.to[1]))}까지 차출).`:''}`,{kind:'선수'});
  if(out.length)addLog(`${e.n} 대표 소집일 검사: ${out.map(x=>`${x.p?x.p.name:((G.arch||{})[x.id]||{}).name||'?'} 제외(${x.why})${x.r?` → ${x.r.name}`:''}`).join(', ')}`);
  return out; }
/* 소집일(d)에 실제로 빠질 선수: 소집일 검사(의료 제외·대체 발탁·구단당 1~3명)를 사본에 그대로 돌린 결과. 전날 진행 검사가 같은 규칙을 쓰게(검수 11-09u) */
function ntCallIds(N,d){ const C=JSON.parse(JSON.stringify(N)), d0=G.day; G.day=d; /* 소집일 처리(processDay)와 같은 날짜로 판정 */ try{ ntMedCheck(C,true); }catch(e){} finally{ G.day=d0; } return new Set(C.ids); }
/* 소집일 재검사: 예측 못 한 대체 발탁으로 오늘 우리 경기 인원이 모자라면 경기를 미루고 멈춘다(8명 출전 방지, 검수 11-09u). 다음 경기 전날 진행 검사가 다시 막는다 */
function ntShortGuard(d){ if(G.unemp||period()!=='season'||!(G.cal.sched[d]||[]).some(x=>x.includes(G.user)))return;
  const can=Object.values(G.players).filter(p=>p.team===G.user&&!p.ys&&!(p.joinY>G.year)&&!isAway(p)&&!(p.injOut>1)&&!(p.susp>d)&&!p.frehab&&!p.hold&&psOk(p)&&(!entryOn()||p.e1||p.downDay==null||d-p.downDay>=10)); /* 진행 검사(blocker)의 '뛸 수 있는 선수'와 같은 기준 */
  const nb=can.filter(p=>!p.isP).length, np=can.length-nb; if(nb>=9&&np>=8)return;
  const L=G.cal.sched[d].filter(x=>x.includes(G.user)); G.cal.sched[d]=G.cal.sched[d].filter(x=>!x.includes(G.user)); for(const [h,a] of L)(G.makeup=G.makeup||[]).push({y:G.year,h,a,d});
  stop('대표팀',`대표 소집일 대체 발탁으로 오늘 경기에 낼 ${nb<9?`야수가 ${nb}명`:`투수가 ${np}명`}뿐이라 오늘 경기를 다음 경기일로 미뤘습니다. 선수를 영입하거나 육성선수를 등록해 인원을 채운 뒤 진행하세요.`); }
/* 차출 거부: 소집 전까지 가능. 다음 선수로 채우고, 여론과 선수 마음이 나빠진다 */
function ntRefuse(id){ if(G.unemp)return '단장직이 없어 차출을 거부할 수 없습니다.'; const N=ntState(); const p=G.players[id]; if(!N||N.res||!p||p.team!==G.user||!N.ids.includes(id))return '대상이 아닙니다.'; const e=NT_EV[N.k]; if(G.day>=KD(e.from[0],e.from[1]))return '이미 소집됐습니다.';
  N.ids=N.ids.filter(x=>x!==id); N.wild=(N.wild||[]).filter(x=>x!==id); (N.ref=N.ref||[]).push(id); const r=ntFill(N,(N.bk&&N.bk[id])||ntBucket(p),p.team); if(r){ N.ids.push(r.id); if(N.bk)N.bk[r.id]=ntBucket(r); if(NT_EV[N.k].u25&&!ntU25(r))N.wild.push(r.id); }
  prInit(); const big=ovr(p)>=58; G.pr.fan=clamp(G.pr.fan-(big?5:2),0,100); G.pr.press=clamp(G.pr.press-(big?5:2),0,100); /* 기사(-2)로도 한 번 더 깎인다 */
  const lost=!!e.ex&&!p.foreign&&!(p.mil&&(p.mil.done||p.mil.exempt)); /* 입대 예정·상무 복무 중 선수도 메달이면 특례를 받으므로 기회 상실(검수 11-07) */ p.mor=clamp((p.mor??60)-(lost?25:6),0,100); story(p,`${N.y} ${e.n} 대표 차출 거부(구단 결정)${lost?' · 병역 특례 기회를 놓침':''}`,'mil');
  news('구단',`${tshort(G.user)}, ${p.name} ${e.n} 대표 차출 거부`,`${lost?'병역 특례가 걸린 대회라 선수 쪽 불만이 크다는 후문입니다. ':''}"구단 이기주의"라는 비판이 나옵니다.${r?` 대체 선수로 ${r.name}(${tshort(r.team)})이(가) 뽑혔습니다.`:''}`,-2);
  return `${p.name} 차출을 거부했습니다. 팬·언론 여론이 나빠졌습니다${lost?'. 병역 특례 기회를 잃은 선수가 크게 반발합니다':''}.`; }
/* 대회 결과: 대표팀 전력(상위 20명 평균)과 대회 난이도로 정한다 */
function ntOdds(k,str){ const z=str-58;
  /* 누적 확률: g=1위 이내, s=2위 이내, b=3위(4강) 이내 */
  if(k==='ag'){ const g=clamp(.62+z*.05,.35,.9); return {g,s:Math.min(.97,g+.2),b:Math.min(.99,g+.28)}; } /* 실제: 2010~2026 다섯 대회 연속 금 */
  if(k==='oly'){ const pm=clamp(.32+z*.05,.12,.75); return {g:pm*.3,s:pm*.62,b:pm}; }
  const g=clamp(.12+z*.03,.04,.4); return {g,s:Math.max(g+.08,clamp(.28+z*.04,.1,.6)),b:Math.max(g+.2,clamp(.5+z*.05,.25,.8))}; } /* WBC·프리미어12: 우승/결승/4강 */
function ntResult(k,force){ const N=G.nt; const e=NT_EV[k]; const sq=N.ids.map(id=>G.players[id]).filter(Boolean); const ov=N.ovs||[]; const top=[...sq.map(ovr),...ov.map(x=>x.o)].sort((a,b)=>b-a).slice(0,20); /* 해외파도 전력에 넣는다 */
  const cnt={P:0,C:0,IF:0,OF:0}; [...sq,...ov].forEach(p=>cnt[ntBucket(p)]++); const holes=Object.keys(NT_SLOTS).reduce((s,b)=>s+Math.max(0,NT_SLOTS[b]-cnt[b]),0), thin=cnt.P<5||cnt.C+cnt.IF+cnt.OF<9;
  const str=sq.length?(top.reduce((s,v)=>s+v,0)+30*(20-top.length))/20-holes*.5:30; /* 명단 규모·빈 포지션 반영: 모자란 자리는 30, 빈 자리마다 -0.5, 경기를 꾸릴 수 없으면 입상 없음(검수 11-09zj) */ /* 빈 명단도 결과·이력을 남긴다(검수 11-06) */
  const O=ntOdds(k,str); const x=force!=null?force:R(); const lv=!sq.length||thin?4:x<O.g?1:x<O.s?2:x<O.b?3:4; /* 빈 명단은 입상 없음(검수 11-07) */ /* 1 금·우승 2 은·준우승 3 동·4강 4 그 밖 */
  const medal=k==='ag'||k==='oly'; const res=medal?['','금메달','은메달','동메달','노메달'][lv]:['','우승','준우승','4강','조별 탈락'][lv]; N.res=res; N.lv=lv;
  if(k==='oly'&&G.oly&&G.oly.y===N.y)G.oly.res=res;
  const exOk=e.ex==='gold'?lv===1:e.ex==='top3'?lv<=3:false; const ex=exOk?sq.filter(p=>!p.foreign&&!(p.mil&&(p.mil.done||p.mil.exempt))):[]; /* 입대 예정(상무 합격 등)은 입대 취소, 소집 뒤 입대해 복무 중인 선수는 남은 복무를 면제(조기 전역, 검수 11-07) */ ex.forEach(p=>{ const sv=milServing(p); if(p.mil&&p.mil.until&&!sv)try{ milNegBack(p); }catch(err){} p.mil=sv?{exempt:true,unit:p.mil.unit,pf:p.mil.from,pu:G.day}:{exempt:true}; story(p,`${N.y} ${e.n} ${res} · 병역 특례(체육요원)`,'mil'); });
  { const back=ex.filter(p=>p.team===G.user&&p.mil.pu===G.day&&!p.ys); const n=rosterN(G.user); if(back.length&&!G.unemp&&n>ROSTER_MAX)mail('운영팀',`조기 전역 ${back.length}명 · 로스터 ${n-ROSTER_MAX}자리 초과`,`${back.map(p=>p.name).join(', ')}이(가) 병역 특례로 바로 전역해 정식 로스터로 돌아왔습니다. 지금 ${n}명으로 한도 ${ROSTER_MAX}명을 ${n-ROSTER_MAX}명 넘습니다. 방출하거나 연봉 1억 원 이하 선수를 육성선수로 돌려 정리하세요.`,{imp:true,kind:'병역',acts:[{l:'로스터 정리',a:'tab',v:'roster'}]}); } /* 특례 조기 전역으로 정원 초과(검수 11-09g) */
  if(lv<=3)for(const p of sq)addAward(p,`${N.y} ${e.n} ${res}`);
  /* 대표팀 영웅: 능력 + 대회 운. 좋은 성적일수록 영웅이 나오기 쉽다 */
  const hb=sq.length&&(lv<=3||R()<.35)?[...sq.map(p=>({p,s:ovr(p)+R()*10})),...ov.map(x=>({x,s:x.o+R()*10}))].sort((a,b)=>b.s-a.s)[0]:null; const hero=hb&&hb.p, hx=hb&&hb.x; /* WBC 해외파도 영웅 후보(검수 11-09zj) */ if(hx)N.hero=hx.id; if(hero){ addAward(hero,`${N.y} ${e.n} 대표팀 영웅`); hero.hype={v:15,until:G.day+120}; N.hero=hero.id; if(hero.team===G.user)hero.mor=clamp((hero.mor??60)+8,0,100); }
  const mine=sq.filter(p=>p.team===G.user), mex=ex.filter(p=>p.team===G.user);
  (G.ntHist=G.ntHist||[]).push({k,y:N.y,res,hero:hero?hero.id:hx?hx.id:null,hn:hero?hero.name:hx?hx.name:null,ht:hero?hero.team:null}); /* 은퇴·이적 뒤에도 당시 이름·구단(검수 11-07) */ if(G.ntHist.length>20)G.ntHist.shift();
  mail('운영팀',`${N.y} ${e.n} 대표팀 ${res}`,`한국 대표팀이 ${res}${medal?(lv<=3?'을 땄습니다':'에 그쳤습니다'):'의 성적을 냈습니다'}.${hero?` 대회 최고 스타는 ${hero.name}(${tshort(hero.team)})입니다.`:hx?` 대회 최고 스타는 해외파 ${hx.name}(${`${hx.lg||''} ${hx.club||''}`.trim()})입니다.`:''}${ex.length?` 미필 선수 ${ex.length}명이 병역 특례를 받습니다.`:''}${mex.length?` 우리 구단: ${mex.map(p=>p.name).join(', ')}.`:''}${mine.length&&!mex.length?` 우리 구단 대표: ${mine.map(p=>p.name).join(', ')}.`:''}`,{imp:true,kind:e.ex?'병역':'선수'});
  if(mex.length)news('선수',`${mex.map(p=>p.name).join('·')}, ${e.n} ${res}로 병역 특례`,`${tshort(G.user)}이(가) 군 공백 걱정을 덜었습니다.`,2,{fanW:1.5});
  if(hero&&hero.team===G.user)news('선수',`${e.n} 영웅 ${hero.name}, 우리 구단의 새 스타`,`대표팀에서의 활약으로 인기가 치솟았습니다.`,2,{fanW:1.5});
  /* 성적이 나쁘면 국가대표 감독 교체 */
  if(lv===4&&(k==='ag'||k==='oly'||R()<.5)){ const old=ntMgr().name; G.ntMgr={name:genName(),since:G.year}; news('리그',`국가대표 ${old} 감독 사퇴`,`${e.n} 부진의 책임을 졌습니다. 새 감독은 ${G.ntMgr.name}.`,0); }
  return res; }

/* 구단 추천(아시안게임·올림픽 같은 병역 특례 대회): 최종 발표 전까지 우리 선수 3명까지 대표팀에 추천한다. 감독 평가에 +5(실력 차가 크면 뒤집지 못함) */
const NT_REC_MAX=3;
function ntRecIds(k){ const R=G.ntRec; return new Set(R&&R.y===G.year&&R.k===k?R.ids.filter(id=>G.players[id]&&G.players[id].team===G.user&&!ntRecBlock(k,G.players[id])):[]); } /* 팀을 떠난 선수는 추천에서 빠진다(검수 11-07). 뽑힐 수 없게 된 선수(장기 부상 등)도 자리를 비운다(검수 11-09zj) */
function ntRecToggle(k,id){ const e=NT_EV[k]; if(!e||!e.ex)return '병역 특례가 걸린 대회(아시안게임·올림픽)만 구단 추천을 받습니다.'; if(G.unemp)return '구단을 맡고 있지 않습니다.'; const p=G.players[id]; if(!p||p.team!==G.user||p.foreign)return '우리 국내 선수만 추천할 수 있습니다.';
  if(G.nt&&G.nt.k===k&&G.nt.y===G.year)return '이미 최종 명단이 발표됐습니다.'; if(e.u25&&!ntU25(p))return `${p.name}은(는) 이 대회 나이 제한(만 25세 이하·입단 4년 차 이하)에 걸립니다. 와일드카드는 감독이 직접 고릅니다.`;
  const R=G.ntRec=G.ntRec&&G.ntRec.y===G.year&&G.ntRec.k===k?G.ntRec:{k,y:G.year,ids:[]}; R.ids=[...ntRecIds(k)]; if(R.ids.includes(id)){ R.ids=R.ids.filter(x=>x!==id); return `${p.name} 추천을 거뒀습니다.`; }
  const why=ntRecBlock(k,p); if(why)return why; if(R.ids.length>=NT_REC_MAX)return `구단 추천은 ${NT_REC_MAX}명까지입니다.`; R.ids.push(id); return `${p.name}을(를) 대표팀에 추천했습니다${milFree(p)?'(미필)':''}.`; }

/* 추천해도 뽑힐 수 없는 선수: 최종 발표일 후보군(ntPool)은 그날 건강한 선수만 본다(검수 11-09u: 재활 300일 선수에 추천 자리를 씀) */
function ntRecBlock(k,p){ const e=NT_EV[k], ann=KD(e.ann[0],e.ann[1]);
  if(p.mil&&p.mil.until&&p.mil.unit!=='상무'&&p.mil.from<=ann&&p.mil.until>ann)return `${p.name}은(는) 최종 발표(${dmd(ann)}) 때 현역 복무 중이라 대표팀에 뽑힐 수 없습니다.`; /* 발표일 기준(ntPool과 같게): 입대 예약도(검수 11-09zj) */
  if(p.hold)return `${p.name}은(는) 연봉 미계약 상태라 대표팀에 뽑힐 수 없습니다.`;
  if(p.injOut>0&&G.day+p.injOut>=ann)return `${p.name}은(는) 재활 ${p.injOut}일이 남아 최종 발표(${dmd(ann)}) 전에 회복하지 못합니다.`;
  if(p.susp>ann)return `${p.name}은(는) 최종 발표(${dmd(ann)}) 뒤까지 출장 정지입니다.`;
  return ''; }
/* 해외파 차출(커뮤니티 요청 11-07): 해외에서 뛰는 국내 선수 중 능력 상위 최대 3명이 대표팀에 합류해 전력에 더해진다(소속 구단 허락을 받은 것으로 본다). 국내 명단 24명과 별도 */
function ntAbroad(){ const out=[]; for(const a of G.abroad||[]){ if(a.back||a.foreign||!a.pj||!(G.year>=(a.y1??a.y+1)))continue; let o=null; try{ const q=JSON.parse(a.pj); q.age=(a.age||q.age)+(G.year-a.y); o=Math.max(0,(q.injOut||0)-(a.d!=null&&!(a.lines||[]).length?G.day-a.d:0))>0?null:ovr(q); /* 재활 중인 해외파는 뽑지 않는다(검수 11-08) */ }catch(e){} if(o!=null&&o>=55)out.push({id:a.id,name:a.name,club:a.club,lg:a.lg,pos:a.pos,isP:!!a.isP,o}); } return out.sort((x,y)=>y.o-x.o).slice(0,3); }
