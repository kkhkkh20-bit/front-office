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
  ag:{n:'아시안게임',yr:y=>y>=2026&&(y-2026)%4===0,pre:[4,15],ann:[6,11],from:[9,16],to:[9,28],res:[9,27],get ex(){ return agExOff()?null:'gold'; },u25:true,cap:3,min:1}, /* 병역법이 바뀌면(G.agExOff) 그 뒤 대회부터 특례 없음 */
  p12:{n:'프리미어12',yr:y=>y>=2027&&(y-2027)%4===0,ann:[10,8],from:[11,6],to:[11,20],res:[11,18],ex:null}
};
/* 아시안게임 금메달 병역 특례 폐지(병역법 개정): 2026년 10월 'AG 금 → 체육요원' 기준을 빼고 올림픽 3위 이내만 남기는 개정안이 발의됐고(국방부: 단계적 축소 뒤 폐지), 아직 통과 전.
   2027년부터 해마다 정기국회가 끝난 뒤(12월 10일) 통과 여부를 굴린다. 해마다 p, 늦어도 by년에는 통과. 통과하면 G.agExOff=그해 → 다음 아시안게임부터 금메달 특례 없음.
   이미 특례를 받은 선수는 그대로. 플래그가 없는 예전 저장은 지금처럼 특례가 있다. 모든 구단에 똑같다 */
const AG_EX_LAW={from:2027,p:.3,by:2032,d:[12,10]};
function agExOff(){ return typeof G!=='undefined'&&!!G&&!!G.agExOff; }
function agExLawCheck(force){ if(G.agExOff||G.year<AG_EX_LAW.from||G.agExY===G.year&&!force)return false; G.agExY=G.year;
  if(!(force||G.year>=AG_EX_LAW.by||R()<AG_EX_LAW.p))return false; G.agExOff=G.year;
  news('리그',`병역법 개정안 국회 통과: 아시안게임 금메달 병역 특례 폐지`,`국회가 아시안게임 금메달 입상자를 예술·체육요원 편입 대상에서 빼는 병역법 개정안을 통과시켰습니다. ${G.year+1}년부터 열리는 아시안게임은 금메달을 따도 병역 특례가 없습니다. 올림픽 3위 이내 특례는 그대로이고, 이미 특례를 받은 선수는 그대로 인정됩니다.`,0,{});
  return true; }
const NT_SLOTS={P:11,C:2,IF:7,OF:4}, NT_WILD=3, NT_WILD_AGE=29;
const ntBucket=p=>p.isP?'P':p.pos==='C'?'C':['LF','CF','RF'].includes(p.pos)?'OF':'IF';
const ntProY=(p,y)=>{ y=y||G.year; return p.draft&&p.draft.y?Math.max(1,y-p.draft.y):Math.max(1,p.age+y-G.year-19); }; /* 프로 몇 년 차(지명 이듬해가 1년 차). y: 대회 연도(미래 대회 예상은 그해 기준, 검수 11-09u) */
const ntU25=(p,y)=>p.age+(y||G.year)-G.year<=25||ntProY(p,y)<=4; /* 아시안게임 자격: 둘 중 하나만 맞으면 된다(2026: 2001년 이후 출생 또는 2023년 이후 입단) */
function ntMgr(){ if(!G.ntMgr)G.ntMgr={name:genName(),since:G.year}; return G.ntMgr; }
/* 다음 대회들(올해부터 몇 년 안) */
function ntUpcoming(n){ const L=[]; for(let y=G.year;y<=G.year+4&&L.length<(n||4);y++)for(const k of ['wbc','oly','ag','p12']){ const e=NT_EV[k]; if(!e.yr(y))continue; const end=dnum(y,e.to[0],e.to[1]); if(y===G.year&&end<G.day)continue; L.push({k,y,n:e.n,from:dnum(y,e.from[0],e.from[1]),to:end}); } return L.slice(0,n||4); }
function ntPool(d1){ return Object.values(G.players).filter(p=>p.team!=null&&!p.foreign&&!p.prospect&&!(p.ntAway&&p.ntAway>G.day&&p.ntFrom<=G.day)&&(healthy(p)||d1&&p.injOut===1&&!(p.susp>G.day)&&!p.frehab&&!p.hold)&&!(p.joinY>G.year)&&!(milServing(p)&&p.mil.unit!=='상무')&&!ntDisp(p)); } /* 실제처럼 상무 복무·입대 예정 선수는 뽑을 수 있고, 현역 복무 중인 선수는 뽑지 않는다. 특례를 받으면 복무가 면제된다 */
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
    if(d===D(e.from)){ let mo=[]; if(k==='wbc')try{ ntOvsRecheck(N); }catch(err){} /* 해외파도 소집일에 다시 본다(검수 11-17 #224) */ try{ mo=ntMedCheck(N); }catch(err){} try{ const dp=depth(G.user); N.role={}; N.rpos={}; for(const id of N.ids){ const p=G.players[id]; if(p&&p.team===G.user)N.rpos[id]=posLabel(p); if(p&&p.team===G.user)N.role[id]=dp.sp.some(x=>x.id===id)?'sp':p.isP?'pen':dp.start.some(x=>x.id===id)?'start':'bench'; } }catch(err){} /* 소집 직전 역할(대표팀 화면 영향 표시용) */ for(const id of N.ids){ const p=G.players[id]; if(p){ p.ntFrom=d; p.ntAway=D(e.to); p.e1=false; } } const mine=N.ids.map(id=>G.players[id]).filter(p=>p&&p.team===G.user);
      if(mo.some(x=>x.r&&x.r.team===G.user))try{ ntShortGuard(d); }catch(err){}
      if(mine.length)addLog(`${e.n} 대표 소집: ${mine.map(p=>p.name).join(', ')} (${dmd(D(e.to))} 복귀)`); }
    /* 실제 대회(84b_nt_tour): 소집일에 대진·상대국 명단을 만들고, 대회 기간 하루씩 경기. 예전 저장에서 대회 중이던 대회는 대진 없이 예전 방식(전력 확률)으로 끝난다 */
    if(d===D(e.from)&&!N.tour&&!N.res)try{ ntTourInit(N); }catch(err){ (G.flErr=(G.flErr||[]).slice(-9)).push('ntInit:'+String(err&&err.message).slice(0,80)); }
    if(d>D(e.from)&&d<D(e.to)&&!(N.tour&&N.tour.done))try{ ntDayCheck(N,d); }catch(err){ (G.flErr=(G.flErr||[]).slice(-9)).push('ntChk:'+String(err&&err.message).slice(0,80)); } /* 소집 기간 매일(경기 전): 현역 입대·방출·교육리그 파견 선수는 빼고 대체(검수 11-17 #225~227) */
    if(N.tour&&!N.tour.done)try{ ntTourDay(N,d); }catch(err){ (G.flErr=(G.flErr||[]).slice(-9)).push('ntDay:'+String(err&&err.message).slice(0,80)); }
    if(d===D(e.res)&&!N.res)ntResult(k);
    if(d===D(e.to)){ const sv=p=>milServing(p); const back=N.ids.map(id=>G.players[id]).filter(p=>p&&p.team===G.user&&!sv(p)), inMil=N.ids.map(id=>G.players[id]).filter(p=>p&&p.team===G.user&&sv(p)); for(const t of G.teams){ try{ entryUpgrade(t.id,N.ids.map(id=>G.players[id]).filter(p=>p&&p.team===t.id&&!sv(p)),'대표팀 복귀'); }catch(err){} }
      if(inMil.length&&!G.unemp)mail('운영팀',`${e.n} 대표 소집 해제 · 군 복무 ${inMil.length}명`,`${inMil.map(p=>`${p.name}(${p.mil.unit}, ${dmdY(p.mil.until)} 전역 예정)`).join(', ')}은(는) 대표팀 소집이 끝났지만 군 복무 중이라 구단에 돌아오지 않습니다. 전역할 때까지 우리 경기에 쓸 수 없고, 엔트리 등록도 전역 뒤에 합니다.`,{kind:'병역'}); /* 소집 중 입대한 선수에게 '돌아왔다'·엔트리 안내를 보내지 않는다(검수 11-17 #242) */
      if(back.length){ const off=back.filter(p=>!p.e1); mail('운영팀',`${e.n} 대표 선수 복귀`,`${back.map(p=>p.name).join(', ')}이(가) 돌아왔습니다.${back.some(p=>p.e1)?` 감독이 ${back.filter(p=>p.e1).map(p=>p.name).join(', ')}을(를) 1군에 다시 등록했습니다.`:''}${off.length?(entryOn()?`\n${off.map(p=>p.name).join(', ')}은(는) 아직 2군입니다(부상·기용 순위). 필요하면 선수 화면에서 감독에게 콜업을 요청하세요.`:`\n${off.map(p=>p.name).join(', ')}은(는) 개막 엔트리 결정 때 감독이 함께 판단합니다(개막 전에는 엔트리를 바꿀 수 없습니다).`):''}`,{kind:'선수',imp:off.length>0}); } } } }
function ntAnnounce(k){ const e=NT_EV[k]; const M=ntMgr(); const pre=G.ntPre&&G.ntPre.k===k&&G.ntPre.y===G.year?G.ntPre.ids:null; const S=ntSquad(k,null,{only:pre}); G.nt={k,y:G.year,ids:S.map(x=>x.id),wild:S.filter(x=>x.wild).map(x=>x.id),ref:[],res:null,ovs:k==='wbc'?ntAbroad():[], /* 해외파는 실제처럼 WBC만(아시안게임·올림픽·프리미어12는 메이저리그 구단이 보내지 않는다) */bk:Object.fromEntries(S.map(x=>[x.id,ntBucket(G.players[x.id])]))}; /* bk: 발표 뒤 은퇴·해외로 기록이 지워져도 대체 자리를 알 수 있게 */
  const mine=S.map(x=>G.players[x.id]).filter(p=>p.team===G.user); const D=a=>KD(a[0],a[1]);
  for(const p of mine)p.mor=clamp((p.mor??60)+6,0,100);
  const exTxt=e.ex==='gold'?'금메달이면 미필 선수는 병역 특례(체육요원)를 받습니다.':e.ex==='top3'?'3위 이상이면 미필 선수는 병역 특례(체육요원)를 받습니다.':k==='ag'&&G.agExOff?`${G.agExOff}년 병역법 개정으로 아시안게임 금메달 병역 특례는 없어졌습니다(올림픽 3위 이내 특례는 그대로).`:'병역 특례는 없습니다.';
  mail('운영팀',`${G.year} ${e.n} 대표팀 명단 발표`,`${M.name} 대표팀 감독이 ${G.nt.ids.length}명을 뽑았습니다.${G.nt.ids.length<24?` (24명을 다 채우지 못했습니다)`:''}${G.nt.ovs.length?` 해외파 합류: ${G.nt.ovs.map(x=>`${x.name}(${x.lg} ${x.club})`).join(', ')}.`:''}${e.u25?' (만 25세 이하 또는 입단 4년 차 이하 + 와일드카드 3명, 구단당 1~3명)':''}\n\n우리 구단: ${mine.map(p=>`${p.name}(${posLabel(p)}${milFree(p)?', 미필':''}${G.nt.wild.includes(p.id)?', 와일드카드':''})`).join(', ')||'없음'}\n\n소집 ${dmd(D(e.from))} ~ ${dmd(D(e.to))}. 이 기간에는 우리 경기에 쓸 수 없습니다. ${exTxt}${mine.length?`\n\n차출을 거부할 수 있지만(리그 > 국가대표) 팬·언론 여론이 나빠지고, ${e.ex&&mine.some(p=>!p.foreign&&!(p.mil&&(p.mil.done||p.mil.exempt)))?'미필 선수는 특례 기회를 잃어 크게 반발합니다.':'선수 사기도 떨어집니다.'}`:''}`,{imp:mine.length>0,kind:e.ex?'병역':'선수',acts:[{l:'국가대표',a:'go',v:'league:nt'}]});
  if(mine.length)news('선수',`${tshort(G.user)} ${mine.map(p=>p.name).join('·')}, ${e.n} 대표 발탁`,`${M.name} 감독의 부름을 받았습니다.`,1); }
/* 소집일 재검사: 발탁 뒤 다쳤거나(재활·출장 정지) 리그를 떠난(해외·입대·은퇴) 선수는 의료·사유 제외로 빼고 같은 자리 대체 선수를 뽑는다.
   구단의 차출 거부(ntRefuse)와 달리 여론·선수 사기 불이익은 없다. 대회 성과·특례는 최종 명단(N.ids)만 받는다 */
/* 기록이 지워진 선수의 자리: 발표 때 저장한 묶음, 없으면(예전 저장) 정원보다 가장 모자란 묶음 */
function ntGoneB(N,id){ if(N.bk&&N.bk[id])return N.bk[id]; const c={P:0,C:0,IF:0,OF:0}; for(const x of N.ids){ const q=G.players[x]; if(q)c[ntBucket(q)]++; } return Object.keys(c).sort((a,b)=>(c[a]-NT_SLOTS[a])-(c[b]-NT_SLOTS[b]))[0]; }
function ntMedCheck(N,quiet){ const e=NT_EV[N.k]; const out=[]; const st=quiet?()=>{}:story; /* 예측(ntCallIds)은 이력을 남기지 않는다 */
  for(const id of N.ids.slice()){ const p=G.players[id]; const ow=ntOutWhy(p), gone=!!ow; const hurt=!gone&&!healthy(p)&&!(p.injOut===1&&!(p.susp>G.day)&&!p.frehab&&!p.hold); /* 재활이 하루 남은 선수는 오늘 회복하므로 남긴다(검수 11-07) */ const shifted=!gone&&N.bk&&N.bk[id]&&N.bk[id]!==ntBucket(p); if(!gone&&!hurt&&!shifted)continue;
    N.ids=N.ids.filter(x=>x!==id); N.wild=(N.wild||[]).filter(x=>x!==id); (N.ref=N.ref||[]).push(id); const why=shifted?'포지션 변경':hurt?(p.injOut>0?`부상(재활 ${p.injOut}일)`:p.hold?'연봉 미계약':p.frehab?'재활 명단':'출장 정지'):ow;
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
  for(const p of new Set(rIn.map(x=>x.r).filter(p=>N.ids.includes(p.id))))p.mor=clamp((p.mor??60)+6,0,100);
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
  if(k==='ag'){ const za=str-(ntKRef()-4.8); const g=clamp(.78+za*.08,.35,.93); return {g,s:Math.min(.97,g+.14),b:Math.min(.99,g+.17)}; } /* 실제 대회(84b, NT_EPEN.ag)와 맞춘다: 아시안게임 대표(나이 제한)는 보통 리그 상위 24명 평균보다 4.8쯤 낮고, 그 전력이면 대회에서 금 78%쯤(시드 64회 측정 77%), 1점마다 8%p. 실제: 1998~2026 여덟 대회 중 금 일곱 */
  if(k==='oly'){ const pm=clamp(.32+z*.05,.12,.75); return {g:pm*.3,s:pm*.62,b:pm}; }
  const g=clamp(.12+z*.03,.04,.4); return {g,s:Math.max(g+.08,clamp(.28+z*.04,.1,.6)),b:Math.max(g+.2,clamp(.5+z*.05,.25,.8))}; } /* WBC·프리미어12: 우승/결승/4강 */
function ntResult(k,force){ const N=G.nt; (N.ovs||[]).forEach(ntOvsFix); const e=NT_EV[k]; const sq=N.ids.map(id=>G.players[id]).filter(Boolean); const ov=N.ovs||[]; const top=[...sq.map(ovr),...ov.map(x=>x.o)].sort((a,b)=>b-a).slice(0,20); /* 해외파도 전력에 넣는다 */
  const cnt={P:0,C:0,IF:0,OF:0}; [...sq,...ov].forEach(p=>cnt[ntBucket(p)]++); const holes=Object.keys(NT_SLOTS).reduce((s,b)=>s+Math.max(0,NT_SLOTS[b]-cnt[b]),0), thin=cnt.P<5||cnt.C+cnt.IF+cnt.OF<9;
  const str=sq.length?(top.reduce((s,v)=>s+v,0)+30*(20-top.length))/20-holes*.5:30; /* 명단 규모·빈 포지션 반영: 모자란 자리는 30, 빈 자리마다 -0.5, 경기를 꾸릴 수 없으면 입상 없음(검수 11-09zj) */ /* 빈 명단도 결과·이력을 남긴다(검수 11-06) */
  const TR=force==null&&N.tour&&N.tour.done?N.tour:null; /* 실제 대회를 치렀으면 대진 결과로 */ const O=ntOdds(k,str); const x=force!=null?force:R(); const lv=TR?TR.lv:!sq.length||thin?4:x<O.g?1:x<O.s?2:x<O.b?3:4; /* 빈 명단은 입상 없음(검수 11-07) */ /* 1 금·우승 2 은·준우승 3 동·4강 4 그 밖 */
  const medal=k==='ag'||k==='oly'; const res=TR?TR.res:medal?['','금메달','은메달','동메달','노메달'][lv]:['','우승','준우승','4강','조별 탈락'][lv]; N.res=res; N.lv=lv;
  if(k==='oly'&&G.oly&&G.oly.y===N.y)G.oly.res=res;
  const exOk=e.ex==='gold'?lv===1:e.ex==='top3'?lv<=3:false; const ex=exOk?sq.filter(p=>!p.foreign&&!(p.mil&&(p.mil.done||p.mil.exempt))):[]; /* 입대 예정(상무 합격 등)은 입대 취소, 소집 뒤 입대해 복무 중인 선수는 남은 복무를 면제(조기 전역, 검수 11-07) */ ex.forEach(p=>{ const sv=milServing(p); if(sv)milChron(p,'조기 전역',p.mil.unit,p.mil.from,G.day); if(p.mil&&p.mil.until&&!sv)try{ milNegBack(p,p.mil); }catch(err){} p.mil=sv?{exempt:true,unit:p.mil.unit,pf:p.mil.from,pu:G.day}:{exempt:true}; story(p,`${N.y} ${e.n} ${res} · 병역 특례(체육요원)`,'mil'); });
  { const back=ex.filter(p=>p.team===G.user&&p.mil.pu===G.day&&!p.ys); const n=rosterN(G.user); if(back.length&&!G.unemp&&n>ROSTER_MAX)mail('운영팀',`조기 전역 ${back.length}명 · 로스터 ${n-ROSTER_MAX}자리 초과`,`${back.map(p=>p.name).join(', ')}이(가) 병역 특례로 바로 전역해 정식 로스터로 돌아왔습니다. 지금 ${n}명으로 한도 ${ROSTER_MAX}명을 ${n-ROSTER_MAX}명 넘습니다. 방출하거나 연봉 1억 원 이하 선수를 육성선수로 돌려 정리하세요.`,{imp:true,kind:'병역',acts:[{l:'로스터 정리',a:'tab',v:'roster'}]}); } /* 특례 조기 전역으로 정원 초과(검수 11-09g) */
  if(lv<=3)for(const p of sq)addAward(p,`${N.y} ${e.n} ${res}`);
  /* 대표팀 영웅: 능력 + 대회 운. 좋은 성적일수록 영웅이 나오기 쉽다 */
  const hb=TR?(()=>{ const k0=TR.krMvp; if(!k0||(TR.sc[k0]||-99)<2)return null; if(/^\d+$/.test(k0)){ const p=G.players[+k0]; return p?{p}:null; } const x0=(N.ovs||[]).find(o=>'o'+o.id===k0); return x0?{x:x0}:null; })() /* 대회 기록으로 뽑은 한국 최고 활약 선수 */ :sq.length&&(lv<=3||R()<.35)?[...sq.map(p=>({p,s:ovr(p)+R()*10})),...ov.map(x=>({x,s:x.o+R()*10}))].sort((a,b)=>b.s-a.s)[0]:null; const hero=hb&&hb.p, hx=hb&&hb.x; /* WBC 해외파도 영웅 후보(검수 11-09zj) */ if(hx)N.hero=hx.id; if(hero){ addAward(hero,`${N.y} ${e.n} 대표팀 영웅`); hero.hype={...(hero.hype||{}),v:15,until:G.day+120}; /* 공개 약속의 시작일·기준 성적·PS 추가 성적은 보존 */ N.hero=hero.id; if(hero.team===G.user)hero.mor=clamp((hero.mor??60)+8,0,100); }
  const mine=sq.filter(p=>p.team===G.user), mex=ex.filter(p=>p.team===G.user);
  (G.ntHist=G.ntHist||[]).push({k,y:N.y,res,hero:hero?hero.id:hx?hx.id:null,hn:hero?hero.name:hx?hx.name:null,ht:hero?hero.team:null}); /* 은퇴·이적 뒤에도 당시 이름·구단(검수 11-07) */ if(G.ntHist.length>20)G.ntHist.shift(); if(TR){ try{ ntCareerAdd(TR); }catch(err){} try{ ntTourArchive(TR,N); }catch(err){} }
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
function ntAbroad(){ const out=[]; for(const a of G.abroad||[]){ if(a.back||a.foreign||!a.pj||!(G.year>=(a.y1??a.y+1)))continue; let o=null, q=null; try{ q=JSON.parse(a.pj); q.age=(a.age||q.age)+(G.year-a.y); o=Math.max(0,(q.injOut||0)-(a.d!=null&&!(a.lines||[]).length?G.day-a.d:0))>0?null:ovr(q); /* 재활 중인 해외파는 뽑지 않는다(검수 11-08) */ }catch(e){} if(o!=null&&o>=55)out.push(ntOvsFix({id:a.id,name:a.name,club:a.club,lg:a.lg,pos:a.pos,isP:!!a.isP,o,sn:ntOvsSnap(q)})); } return out.sort((x,y)=>y.o-x.o).slice(0,3); }
/* ===== 해외파 선수(검수 11-17 #221·#222) =====
   해외파 기록(G.abroad)의 pos는 화면용 한글('포수','중견수','선발')이라 그대로 쓰면 포수가 내야로 세어지고 경기에서 포수 수비가 0이었다.
   pos는 코드('C','CF','P')로, 화면용 한글은 pl에 둔다. 경기용 임시 선수는 발표 때 저장한 모습(sn: 능력·투타·구속·투구폼·세부 수비)으로 만든다.
   예전에는 경기마다 새로 뽑아 같은 선수의 투타·컨택·파워가 경기마다 달랐다. 저장한 모습이 없는(예전 저장) 선수는 id로 정해지는 값(rngHash)으로 만든다: 경기 난수를 쓰지 않는다 */
const NT_POSK=(()=>{ const M={'투수':'P','선발':'P','불펜':'P','지명':'DH'}; for(const k in POSK)M[POSK[k]]=k; for(const k in POSS)M[POSS[k]]=k; return M; })();
function ntPosCode(pos,isP){ if(isP)return 'P'; if(pos&&POSK[pos])return pos; return NT_POSK[pos]||'1B'; }
function ntOvsSnap(q){ if(!q||!q.r)return null; return {pos:q.isP?'P':q.pos,th:q.th,bt:q.bt,age:q.age,r:Object.assign({},q.r),v:q.velo,dl:q.delivery||null,dsb:q.dsb||null,role:q.role||null}; }
/* 예전 저장·옛 발표 명단의 해외파 한 줄을 고친다(두 번 불러도 같다) */
function ntOvsFix(x){ if(!x)return x; if(!x.pl&&x.pos&&!POSK[x.pos]&&x.pos!=='P')x.pl=x.pos; const c=ntPosCode(x.pos,x.isP); if(x.pos!==c){ if(!x.pl)x.pl=x.isP?'투수':POSK[c]; x.pos=c; }
  if(!x.sn){ const a=(G.abroad||[]).find(r=>r&&r.id===x.id&&r.pj&&!r.back); if(a)try{ const q=JSON.parse(a.pj); q.age=(a.age||q.age)+(G.year-a.y); x.sn=ntOvsSnap(q); }catch(e){} } return x; }
const ntOvsU=(x,k)=>rngHash('ntovs',x.id,x.name||'',k)/4294967296;
/* 경기용 해외파 임시 선수(84b ntRosterObjs가 부른다). 임시 선수 번호는 매번 새로 나오므로, 해외파 원래 번호가 비어 있으면 그 번호를 쓴다(번호로 정해지는 세부 성향도 경기마다 같게) */
function ntOvsTmp(x){ ntOvsFix(x); const sn=x.sn; const pos=x.isP?'P':(sn&&sn.pos&&sn.pos!=='P'?sn.pos:x.pos);
  const p=ntTmpP('o'+x.id,{isP:x.isP,pos,base:x.o,name:x.name,age:sn&&sn.age||28});
  if(sn){ p.r=Object.assign({},p.r,sn.r); if(sn.th)p.th=sn.th; if(sn.bt)p.bt=sn.bt; if(sn.v!=null)p.velo=sn.v; if(sn.dl)p.delivery=sn.dl; if(sn.dsb)p.dsb=Object.assign({},sn.dsb); if(sn.role)p.role=sn.role; }
  else { for(const k in p.r)if(typeof p.r[k]==='number')p.r[k]=clamp(Math.round(x.o+(ntOvsU(x,k)-.5)*8),20,80); setOvr(p,x.o);
    p.th=x.isP?(ntOvsU(x,'th')<.28?'좌':'우'):(['C','2B','3B','SS'].includes(pos)?'우':ntOvsU(x,'th')<.24?'좌':'우'); p.bt=x.isP?p.th:(p.th==='좌'?'좌':ntOvsU(x,'bt')<.3?'좌':'우'); p.velo=Math.round((ntOvsU(x,'v')-.5)*26)/10; }
  if(Number.isFinite(x.id)&&!G.players[x.id]){ const i=NT_TMP.indexOf(p.id); delete G.players[p.id]; p.id=x.id; G.players[p.id]=p; if(i>=0)NT_TMP[i]=p.id; else NT_TMP.push(p.id); }
  p.injOut=0; p.fat=0; return p; }
/* 대회 기록실 명단: 국내 선수 + WBC 해외파(검수 11-17 #223). 해외파 칸: ['o'+id, 이름, null(국내 구단 없음), 포지션, 소속] */
function ntArcRos(N){ const L=N.ids.map(id=>{ const p=G.players[id]; return p?[id,p.name,p.team,posLabel(p)]:null; }).filter(Boolean);
  for(const x of N.ovs||[]){ ntOvsFix(x); L.push(['o'+x.id,x.name,null,x.pl||(x.isP?'투수':POSK[x.pos]||''),`${x.lg||''} ${x.club||''}`.trim()]); } return L; }
/* WBC 해외파 소집일 재검사(검수 11-17 #224): 발표(1월 20일) 때 재활 중이라 빠졌다가 소집일(2월 24일)까지 나은 해외파도 합류한다.
   발표 때 뽑힌 해외파는 그대로 두고(국내 복귀·재활이면 뺀다), 빈자리(최대 3명)를 지금 뽑을 수 있는 해외파로 채운다 */
function ntOvsRecheck(N){ if(!N||N.k!=='wbc')return []; const now=ntAbroad(), ok=new Map(now.map(x=>[x.id,x])); const prev=(N.ovs||[]).map(ntOvsFix);
  const keep=prev.filter(x=>ok.has(x.id)), out=prev.filter(x=>!ok.has(x.id)); const add=now.filter(x=>!keep.some(k=>k.id===x.id)).slice(0,Math.max(0,3-keep.length));
  N.ovs=keep.concat(add); if(out.length||add.length){ const e=NT_EV[N.k]; addLog(`${e.n} 해외파 소집일 검사: ${out.length?`${out.map(x=>x.name).join(', ')} 제외(재활·국내 복귀)`:''}${out.length&&add.length?' · ':''}${add.length?`${add.map(x=>`${x.name}(${x.lg} ${x.club})`).join(', ')} 합류`:''}`);
    if(add.length)news('리그',`${e.n} 대표팀 해외파 ${add.map(x=>x.name).join('·')} 합류`,`소집일 검사에서 ${add.map(x=>`${x.name}(${x.lg} ${x.club})`).join(', ')}이(가) 대표팀에 합류했습니다.${out.length?` ${out.map(x=>x.name).join(', ')}은(는) 빠집니다.`:''}`,0,{}); }
  return add; }
/* 대표팀 자격(소집일 검사·소집 기간 매일 검사가 같이 쓴다, 검수 11-17 #225~227). 사람·AI 구단 같은 규칙:
   소속이 없으면(방출·은퇴·해외) '리그 이탈', 현역 복무 중이면 '현역 입대'(상무는 뽑을 수 있다), 자매 구단 교육리그 파견 중이면 '교육리그 파견'(파견 중에는 대표팀에 갈 수 없다) */
function ntDisp(p){ return typeof sisFlAwayOn==='function'&&!!p&&sisFlAwayOn(p); }
function ntOutWhy(p){ if(!p||p.team==null)return '리그 이탈'; if(milServing(p)&&p.mil.unit!=='상무')return '현역 입대'; if(ntDisp(p))return '교육리그 파견'; return ''; }
/* 소집 기간 매일 검사(경기 전): 자격을 잃은 선수는 최종 명단에서 빼고 같은 자리 대체 선수를 그날 소집한다. 부상은 규정대로 명단에 남고 경기에만 나오지 않는다(ntRosterObjs).
   84b(대회 경기)가 경기 직전에 다시 불러도 된다: 두 번 불러도 같다 */
function ntDayCheck(N,d){ N=N||G.nt; d=d==null?G.day:d; if(!N||!N.ids)return []; const e=NT_EV[N.k]; if(!e||N.y!==G.year)return []; const from=KD(e.from[0],e.from[1]), to=KD(e.to[0],e.to[1]); if(d<from||d>=to||N.tour&&N.tour.done)return [];
  const out=[];
  for(const id of N.ids.slice()){ const p=G.players[id]; const why=ntOutWhy(p); if(!why)continue;
    N.ids=N.ids.filter(x=>x!==id); N.wild=(N.wild||[]).filter(x=>x!==id); (N.ref=N.ref||[]).push(id); if(p&&p.ntAway>d)p.ntAway=d; /* 대표팀 이탈이 끝난다 */
    (N.med=N.med||[]).push({id,why,d}); const r=ntFill(N,(N.bk&&N.bk[id])||(p?ntBucket(p):ntGoneB(N,id)),p&&p.team!=null?p.team:null);
    if(r){ N.ids.push(r.id); if(N.bk)N.bk[r.id]=ntBucket(r); if(e.u25&&!ntU25(r))(N.wild=N.wild||[]).push(r.id); N.med[N.med.length-1].rep=r.id; r.ntFrom=d; r.ntAway=to; r.e1=false; }
    if(p)story(p,`${N.y} ${e.n} 대표 제외(사유: ${why})`,'mil'); out.push({p,id,why,r}); }
  if(!out.length)return out;
  addLog(`${e.n} 대표 명단 변경(${dmd(d)}): ${out.map(x=>`${x.p?x.p.name:((G.arch||{})[x.id]||{}).name||'?'} 제외(${x.why})${x.r?` → ${x.r.name}`:''}`).join(', ')}`);
  if(!G.unemp){ const mine=out.filter(x=>x.p&&x.p.team===G.user), rIn=out.filter(x=>x.r&&x.r.team===G.user);
    for(const x of mine.filter(x=>x.why==='현역 입대'))mail('운영팀',`${x.p.name} 현역 입대 · ${e.n} 대표팀 제외`,`${x.p.name}이(가) ${dmd(x.p.mil.from)} 현역으로 입대해 ${e.n} 대표팀에서 빠졌습니다. 전역 예정은 ${dmdY(x.p.mil.until)}이고, 그때까지 우리 경기에 쓸 수 없습니다. 대회 성적·병역 특례 대상도 아닙니다.`,{kind:'병역',ref:x.p.id}); /* 검수 11-17 #242 */
    const oth=mine.filter(x=>x.why!=='현역 입대');
    if(oth.length||rIn.length)mail('운영팀',`${e.n} 대표 명단 변경(소집 중)`,`${oth.length?`우리 선수 ${oth.map(x=>`${x.p.name}(${x.why})`).join(', ')}이(가) 대표팀에서 빠졌습니다. 대회 성적·병역 특례는 받지 않습니다.`:''}${rIn.length?`${oth.length?'\n\n':''}대체 발탁: ${rIn.map(x=>x.r.name).join(', ')}(${dmd(to)}까지 차출).`:''}`,{kind:'선수'});
    if(rIn.length)try{ ntShortGuard(d); }catch(err){} }
  return out; }
/* 불러오기 수리(두 번 불러도 같다): 해외파 포지션 코드·저장 모습, 지난 대회 기록실 명단의 해외파, 상무 안내 표시(구단·기수별 목록) */
function ntLoadFix(){ if(!G)return; const N=G.nt; if(N&&N.ovs)N.ovs.forEach(ntOvsFix);
  if(N&&N.ovs&&N.ovs.length&&N.tour&&N.tour.done)for(const A of G.ntArc||[]){ if(A.k!==N.k||A.y!==N.y||!A.ros)continue; for(const r of ntArcRos(N))if(String(r[0]).startsWith('o')&&!A.ros.some(x=>x[0]===r[0]))A.ros.push(r); }
  try{ smMailFix(); }catch(e){} }
