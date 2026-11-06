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
const ntProY=p=>p.draft&&p.draft.y?Math.max(1,G.year-p.draft.y):Math.max(1,p.age-19); /* 프로 몇 년 차(지명 이듬해가 1년 차) */
const ntU25=p=>p.age<=25||ntProY(p)<=4; /* 아시안게임 자격: 둘 중 하나만 맞으면 된다(2026: 2001년 이후 출생 또는 2023년 이후 입단) */
function ntMgr(){ if(!G.ntMgr)G.ntMgr={name:genName(),since:G.year}; return G.ntMgr; }
/* 다음 대회들(올해부터 몇 년 안) */
function ntUpcoming(n){ const L=[]; for(let y=G.year;y<=G.year+4&&L.length<(n||4);y++)for(const k of ['wbc','oly','ag','p12']){ const e=NT_EV[k]; if(!e.yr(y))continue; const end=dnum(y,e.to[0],e.to[1]); if(y===G.year&&end<G.day)continue; L.push({k,y,n:e.n,from:dnum(y,e.from[0],e.from[1]),to:end}); } return L.slice(0,n||4); }
function ntPool(){ return Object.values(G.players).filter(p=>p.team!=null&&!p.foreign&&!p.prospect&&!isAway(p)&&healthy(p)&&!(p.joinY>G.year)&&!(p.mil&&p.mil.until&&p.mil.until>G.day)); } /* 복무 중·입대 예정 선수는 뽑지 않는다 */
/* 대표 명단: 감독 눈(능력 + 감독마다 다른 선호 약간). 아시안게임은 나이 제한·와일드카드·구단당 3명 */
/* 병역 특례가 걸린 대회(올림픽·아시안게임)는 같은 실력이면 미필 선수를 먼저 뽑는다: 미필 중심에 군필 몇 명이 섞이는 실제 구성 */
function ntMilB(k){ const e=NT_EV[k]; return e&&e.ex?(k==='ag'?8:7):0; }
function ntSquad(k,excl,o){ o=o||{}; const e=NT_EV[k]; const M=ntMgr(); const ex=new Set(excl||[]); const mb=ntMilB(k); const v=p=>ovr(p)+hn('nt'+M.name+G.year+k,p.id)*2.5+(mb&&milFree(p)&&p.age<=30?mb:0); const mul=o.mul||1, cap=e.cap?e.cap*mul:0, only=o.only?new Set(o.only):null;
  const base=ntPool().filter(p=>!ex.has(p.id)).map(p=>({p,v:v(p),b:ntBucket(p),ok:!e.u25||ntU25(p)})).sort((a,b)=>b.v-a.v);
  const pool=only?base.filter(x=>only.has(x.p.id)).concat(base.filter(x=>!only.has(x.p.id))):base; /* 최종 명단은 예비 명단 안에서 먼저 뽑고, 모자라면 밖에서 채운다 */
  const per={}, cnt={P:0,C:0,IF:0,OF:0}, S=[]; const capOk=x=>!cap||(per[x.p.team]||0)<cap; const put=x=>{ S.push(x); cnt[x.b]++; per[x.p.team]=(per[x.p.team]||0)+1; }; const drop=x=>{ S.splice(S.indexOf(x),1); cnt[x.b]--; per[x.p.team]--; };
  for(const x of pool){ if(!x.ok||cnt[x.b]>=NT_SLOTS[x.b]*mul||!capOk(x))continue; put(x); }
  if(e.u25){ let w=0; for(const x of pool){ if(w>=NT_WILD*mul)break; if(x.ok||S.includes(x)||x.p.age>NT_WILD_AGE)continue; const out=S.filter(s=>s.b===x.b&&!s.wild).sort((a,b)=>a.v-b.v)[0]; if(!out||x.v<=out.v+1)continue;
      drop(out); if(!capOk(x)){ put(out); continue; } x.wild=true; put(x); w++; } }
  /* 구단당 제한 때문에 빈 포지션: 그 구단에서 다른 묶음으로 뽑힌 선수를 다른 구단 선수로 바꾸고 자리를 채운다(검수 11-06: 포수 6명이 있어도 0명으로 확정) */
  for(let g=0;g<30;g++){ const short=Object.keys(NT_SLOTS).find(b=>cnt[b]<NT_SLOTS[b]*mul&&pool.some(x=>x.b===b&&x.ok&&!S.includes(x))); if(!short)break; let done=false;
    for(const c of pool){ if(c.b!==short||!c.ok||S.includes(c))continue; if(capOk(c)){ put(c); done=true; break; }
      const outs=S.filter(s=>s.p.team===c.p.team&&s.b!==short&&!s.wild).sort((a,b)=>a.v-b.v); for(const s of outs){ const r=pool.find(x=>x.b===s.b&&x.ok&&!S.includes(x)&&x!==c&&x.p.team!==c.p.team&&capOk(x)); if(!r)continue; drop(s); put(c); put(r); done=true; break; } if(done)break; }
    if(!done)break; }
  if(e.u25){ let w=S.filter(x=>x.wild).length; for(const x of pool){ if(w>=NT_WILD*mul)break; if(x.ok||S.includes(x)||x.p.age>NT_WILD_AGE||cnt[x.b]>=NT_SLOTS[x.b]*mul||!capOk(x))continue; x.wild=true; put(x); w++; } } /* 일반 자격자로 못 채운 자리는 와일드카드로 */
  /* 구단당 최소 인원: 한 명도 없는 구단은 그 구단 최고 선수를 넣고, 여러 명 뽑힌 구단의 같은 묶음 하위 선수를 뺀다 */
  if(e.min&&mul===1)for(const t of G.teams){ if((per[t.id]||0)>=e.min)continue; const c=pool.find(x=>x.p.team===t.id&&x.ok&&!S.includes(x)&&S.some(s=>s.b===x.b&&!s.wild&&(per[s.p.team]||0)>e.min)); if(!c)continue;
    const out=S.filter(s=>s.b===c.b&&!s.wild&&(per[s.p.team]||0)>e.min).sort((a,b)=>a.v-b.v)[0]; drop(out); put(c); }
  return S.map(x=>({id:x.p.id,wild:!!x.wild})); }
/* 거부한 자리 채우기: 같은 포지션 묶음에서 규정에 맞는 다음 선수 */
function ntFill(N,b,tid){ const e=NT_EV[N.k]; const M=ntMgr(); const have=new Set(N.ids.concat(N.ref||[])); const per={}; for(const id of N.ids){ const q=G.players[id]; if(q)per[q.team]=(per[q.team]||0)+1; }
  const wild=(N.wild||[]).length; const v=p=>ovr(p)+hn('nt'+M.name+G.year+N.k,p.id)*2.5;
  const c=ntPool().filter(p=>!have.has(p.id)&&ntBucket(p)===b&&(!e.cap||(per[p.team]||0)<e.cap)&&(!e.u25||ntU25(p)||(wild<NT_WILD&&p.age<=NT_WILD_AGE))).sort((a,b2)=>v(b2)-v(a)); if(e.min&&tid!=null&&(per[tid]||0)<e.min){ const m=c.find(p=>p.team===tid); if(m)return m; } /* 구단당 최소 인원: 빠진 선수 구단에서 먼저 */ return c[0]||null; }
/* 사전 등록(예비) 명단: 최종 인원의 두 배쯤. 여기서 빠지면 최종 명단에 들기 어렵다 */
function ntPreAnnounce(k){ const e=NT_EV[k]; const M=ntMgr(); const S=ntSquad(k,null,{mul:2}); G.ntPre={k,y:G.year,ids:S.map(x=>x.id)};
  const mine=S.map(x=>G.players[x.id]).filter(p=>p&&p.team===G.user);
  mail('운영팀',`${G.year} ${e.n} 예비 명단`,`${M.name} 대표팀 감독이 예비 명단 ${S.length}명을 냈습니다. 최종 24명은 ${dmd(KD(e.ann[0],e.ann[1]))}에 이 안에서 뽑힙니다.\n\n우리 구단: ${mine.map(p=>`${p.name}(${posLabel(p)}${milFree(p)?', 미필':''})`).join(', ')||'없음'}`,{kind:e.ex?'병역':'선수',acts:[{l:'국가대표',a:'go',v:'league:nt'}]}); }
function ntState(){ /* 예전 저장의 올림픽(G.oly)을 국가대표 상태로 옮긴다 */
  if(G.oly&&G.oly.y===G.year&&!(G.nt&&G.nt.y===G.year))G.nt={k:'oly',y:G.oly.y,ids:G.oly.ids.slice(),wild:[],ref:[],res:G.oly.res||null};
  return G.nt; }
function ntTxt(N){ const e=NT_EV[N.k]; return `${N.y} ${e.n}`; }
function ntDaily(d){ ntState(); for(const k of Object.keys(NT_EV)){ const e=NT_EV[k]; if(!e.yr(G.year))continue; const D=a=>KD(a[0],a[1]);
    if(e.pre&&d===D(e.pre))ntPreAnnounce(k);
    if(d===D(e.ann))ntAnnounce(k);
    const N=G.nt; if(!N||N.k!==k||N.y!==G.year)continue;
    if(d===D(e.from)){ try{ ntMedCheck(N); }catch(err){} for(const id of N.ids){ const p=G.players[id]; if(p){ p.ntFrom=d; p.ntAway=D(e.to); p.e1=false; } } const mine=N.ids.map(id=>G.players[id]).filter(p=>p&&p.team===G.user);
      if(mine.length)addLog(`${e.n} 대표 소집: ${mine.map(p=>p.name).join(', ')} (${dmd(D(e.to))} 복귀)`); }
    if(d===D(e.res)&&!N.res)ntResult(k);
    if(d===D(e.to)){ const back=N.ids.map(id=>G.players[id]).filter(p=>p&&p.team===G.user); for(const t of G.teams){ try{ entryUpgrade(t.id,N.ids.map(id=>G.players[id]).filter(p=>p&&p.team===t.id),'대표팀 복귀'); }catch(err){} }
      if(back.length){ const off=back.filter(p=>!p.e1); mail('운영팀',`${e.n} 대표 선수 복귀`,`${back.map(p=>p.name).join(', ')}이(가) 돌아왔습니다.${back.some(p=>p.e1)?` 감독이 ${back.filter(p=>p.e1).map(p=>p.name).join(', ')}을(를) 1군에 다시 등록했습니다.`:''}${off.length?`\n${off.map(p=>p.name).join(', ')}은(는) 아직 2군입니다(부상·기용 순위). 필요하면 선수 화면에서 감독에게 콜업을 요청하세요.`:''}`,{kind:'선수',imp:off.length>0}); } } } }
function ntAnnounce(k){ const e=NT_EV[k]; const M=ntMgr(); const pre=G.ntPre&&G.ntPre.k===k&&G.ntPre.y===G.year?G.ntPre.ids:null; const S=ntSquad(k,null,{only:pre}); G.nt={k,y:G.year,ids:S.map(x=>x.id),wild:S.filter(x=>x.wild).map(x=>x.id),ref:[],res:null,bk:Object.fromEntries(S.map(x=>[x.id,ntBucket(G.players[x.id])]))}; /* bk: 발표 뒤 은퇴·해외로 기록이 지워져도 대체 자리를 알 수 있게 */
  const mine=S.map(x=>G.players[x.id]).filter(p=>p.team===G.user); const D=a=>KD(a[0],a[1]);
  for(const p of mine)p.mor=clamp((p.mor??60)+6,0,100);
  const exTxt=e.ex==='gold'?'금메달이면 미필 선수는 병역 특례(체육요원)를 받습니다.':e.ex==='top3'?'3위 이상이면 미필 선수는 병역 특례(체육요원)를 받습니다.':'병역 특례는 없습니다.';
  mail('운영팀',`${G.year} ${e.n} 대표팀 명단 발표`,`${M.name} 대표팀 감독이 ${G.nt.ids.length}명을 뽑았습니다.${G.nt.ids.length<24?` (24명을 다 채우지 못했습니다)`:''}${e.u25?' (만 25세 이하 또는 입단 4년 차 이하 + 와일드카드 3명, 구단당 1~3명)':''}\n\n우리 구단: ${mine.map(p=>`${p.name}(${posLabel(p)}${milFree(p)?', 미필':''}${G.nt.wild.includes(p.id)?', 와일드카드':''})`).join(', ')||'없음'}\n\n소집 ${dmd(D(e.from))} ~ ${dmd(D(e.to))}. 이 기간에는 우리 경기에 쓸 수 없습니다. ${exTxt}${mine.length?'\n\n차출을 거부할 수 있지만(리그 > 국가대표) 팬·언론 여론이 나빠지고, 미필 선수는 특례 기회를 잃어 크게 반발합니다.':''}`,{imp:mine.length>0,kind:e.ex?'병역':'선수',acts:[{l:'국가대표',a:'go',v:'league:nt'}]});
  if(mine.length)news('선수',`${tshort(G.user)} ${mine.map(p=>p.name).join('·')}, ${e.n} 대표 발탁`,`${M.name} 감독의 부름을 받았습니다.`,1); }
/* 소집일 재검사: 발탁 뒤 다쳤거나(재활·출장 정지) 리그를 떠난(해외·입대·은퇴) 선수는 의료·사유 제외로 빼고 같은 자리 대체 선수를 뽑는다.
   구단의 차출 거부(ntRefuse)와 달리 여론·선수 사기 불이익은 없다. 대회 성과·특례는 최종 명단(N.ids)만 받는다 */
/* 기록이 지워진 선수의 자리: 발표 때 저장한 묶음, 없으면(예전 저장) 정원보다 가장 모자란 묶음 */
function ntGoneB(N,id){ if(N.bk&&N.bk[id])return N.bk[id]; const c={P:0,C:0,IF:0,OF:0}; for(const x of N.ids){ const q=G.players[x]; if(q)c[ntBucket(q)]++; } return Object.keys(c).sort((a,b)=>(c[a]-NT_SLOTS[a])-(c[b]-NT_SLOTS[b]))[0]; }
function ntMedCheck(N){ const e=NT_EV[N.k]; const out=[];
  for(const id of N.ids.slice()){ const p=G.players[id]; const gone=!p||p.team==null||milServing(p)||(p.mil&&p.mil.until&&p.mil.from<=G.day&&p.mil.until>G.day); const hurt=!gone&&!healthy(p); if(!gone&&!hurt)continue;
    N.ids=N.ids.filter(x=>x!==id); N.wild=(N.wild||[]).filter(x=>x!==id); (N.ref=N.ref||[]).push(id); const why=hurt?(p.injOut>0?`부상(재활 ${p.injOut}일)`:'출장 정지'):'리그 이탈';
    (N.med=N.med||[]).push({id,why,d:G.day}); const r=ntFill(N,(N.bk&&N.bk[id])||(p?ntBucket(p):ntGoneB(N,id)),p?p.team:null); /* 뽑힌 때의 자리로 대체(포지션이 바뀌었어도) */ if(r){ N.ids.push(r.id); if(N.bk)N.bk[r.id]=ntBucket(r); if(e.u25&&!ntU25(r))N.wild.push(r.id); N.med[N.med.length-1].rep=r.id; }
    if(p)story(p,`${N.y} ${e.n} 대표 제외(${hurt?'의료 사유':'사유'}: ${why})`,'mil'); out.push({p,why,r}); }
  const mine=out.filter(x=>x.p&&x.p.team===G.user), rIn=out.filter(x=>x.r&&x.r.team===G.user);
  if(mine.length||rIn.length)mail('운영팀',`${e.n} 대표 명단 변경(소집일 검사)`,`${mine.length?`소집일 검사에서 우리 선수 ${mine.map(x=>`${x.p.name}(${x.why})`).join(', ')}이(가) 대표팀에서 빠졌습니다. 구단의 차출 거부가 아니라서 여론·선수 사기 불이익은 없고, 대회 성적·병역 특례도 받지 않습니다.`:''}${rIn.length?`${mine.length?'\n\n':''}대체 발탁: ${rIn.map(x=>x.r.name).join(', ')}(${dmd(KD(e.to[0],e.to[1]))}까지 차출).`:''}`,{kind:'선수'});
  if(out.length)addLog(`${e.n} 대표 소집일 검사: ${out.map(x=>`${x.p?x.p.name:'?'} 제외(${x.why})${x.r?` → ${x.r.name}`:''}`).join(', ')}`);
  return out; }
/* 차출 거부: 소집 전까지 가능. 다음 선수로 채우고, 여론과 선수 마음이 나빠진다 */
function ntRefuse(id){ const N=ntState(); const p=G.players[id]; if(!N||N.res||!p||p.team!==G.user||!N.ids.includes(id))return '대상이 아닙니다.'; const e=NT_EV[N.k]; if(G.day>=KD(e.from[0],e.from[1]))return '이미 소집됐습니다.';
  N.ids=N.ids.filter(x=>x!==id); N.wild=(N.wild||[]).filter(x=>x!==id); (N.ref=N.ref||[]).push(id); const r=ntFill(N,(N.bk&&N.bk[id])||ntBucket(p),p.team); if(r){ N.ids.push(r.id); if(N.bk)N.bk[r.id]=ntBucket(r); if(NT_EV[N.k].u25&&!ntU25(r))N.wild.push(r.id); }
  prInit(); const big=ovr(p)>=58; G.pr.fan=clamp(G.pr.fan-(big?5:2),0,100); G.pr.press=clamp(G.pr.press-(big?5:2),0,100); /* 기사(-2)로도 한 번 더 깎인다 */
  const lost=!!e.ex&&milFree(p); p.mor=clamp((p.mor??60)-(lost?25:6),0,100); story(p,`${N.y} ${e.n} 대표 차출 거부(구단 결정)${lost?' · 병역 특례 기회를 놓침':''}`,'mil');
  news('구단',`${tshort(G.user)}, ${p.name} ${e.n} 대표 차출 거부`,`${lost?'병역 특례가 걸린 대회라 선수 쪽 불만이 크다는 후문입니다. ':''}"구단 이기주의"라는 비판이 나옵니다.${r?` 대체 선수로 ${r.name}(${tshort(r.team)})이(가) 뽑혔습니다.`:''}`,-2);
  return `${p.name} 차출을 거부했습니다. 팬·언론 여론이 나빠졌습니다${lost?'. 병역 특례 기회를 잃은 선수가 크게 반발합니다':''}.`; }
/* 대회 결과: 대표팀 전력(상위 20명 평균)과 대회 난이도로 정한다 */
function ntOdds(k,str){ const z=str-58;
  /* 누적 확률: g=1위 이내, s=2위 이내, b=3위(4강) 이내 */
  if(k==='ag'){ const g=clamp(.62+z*.05,.35,.9); return {g,s:Math.min(.97,g+.2),b:Math.min(.99,g+.28)}; } /* 실제: 2010~2026 다섯 대회 연속 금 */
  if(k==='oly'){ const pm=clamp(.32+z*.05,.12,.75); return {g:pm*.3,s:pm*.62,b:pm}; }
  const g=clamp(.12+z*.03,.04,.4); return {g,s:Math.max(g+.08,clamp(.28+z*.04,.1,.6)),b:Math.max(g+.2,clamp(.5+z*.05,.25,.8))}; } /* WBC·프리미어12: 우승/결승/4강 */
function ntResult(k,force){ const N=G.nt; const e=NT_EV[k]; const sq=N.ids.map(id=>G.players[id]).filter(Boolean); const top=[...sq].sort((a,b)=>ovr(b)-ovr(a)).slice(0,20); const str=top.length?avg(top.map(ovr)):30; /* 빈 명단도 결과·이력을 남긴다(검수 11-06) */
  const O=ntOdds(k,str); const x=force!=null?force:R(); const lv=x<O.g?1:x<O.s?2:x<O.b?3:4; /* 1 금·우승 2 은·준우승 3 동·4강 4 그 밖 */
  const medal=k==='ag'||k==='oly'; const res=medal?['','금메달','은메달','동메달','노메달'][lv]:['','우승','준우승','4강','조별 탈락'][lv]; N.res=res; N.lv=lv;
  if(k==='oly'&&G.oly&&G.oly.y===N.y)G.oly.res=res;
  const exOk=e.ex==='gold'?lv===1:e.ex==='top3'?lv<=3:false; const ex=exOk?sq.filter(p=>!p.foreign&&!(p.mil&&(p.mil.done||p.mil.exempt))&&!(p.mil&&p.mil.until&&p.mil.from<=G.day)):[]; /* 입대 예정(상무 합격 등)인 선수도 특례를 받으면 입대가 취소된다 */ ex.forEach(p=>{ p.mil={exempt:true}; story(p,`${N.y} ${e.n} ${res} · 병역 특례(체육요원)`,'mil'); });
  if(lv<=3)for(const p of sq)addAward(p,`${N.y} ${e.n} ${res}`);
  /* 대표팀 영웅: 능력 + 대회 운. 좋은 성적일수록 영웅이 나오기 쉽다 */
  const hero=sq.length&&(lv<=3||R()<.35)?[...sq].map(p=>({p,s:ovr(p)+R()*10})).sort((a,b)=>b.s-a.s)[0].p:null; if(hero){ addAward(hero,`${N.y} ${e.n} 대표팀 영웅`); hero.hype={v:15,until:G.day+120}; N.hero=hero.id; if(hero.team===G.user)hero.mor=clamp((hero.mor??60)+8,0,100); }
  const mine=sq.filter(p=>p.team===G.user), mex=ex.filter(p=>p.team===G.user);
  (G.ntHist=G.ntHist||[]).push({k,y:N.y,res,hero:hero?hero.id:null}); if(G.ntHist.length>20)G.ntHist.shift();
  mail('운영팀',`${N.y} ${e.n} 대표팀 ${res}`,`한국 대표팀이 ${res}${medal?(lv<=3?'을 땄습니다':'에 그쳤습니다'):'의 성적을 냈습니다'}.${hero?` 대회 최고 스타는 ${hero.name}(${tshort(hero.team)})입니다.`:''}${ex.length?` 미필 선수 ${ex.length}명이 병역 특례를 받습니다.`:''}${mex.length?` 우리 구단: ${mex.map(p=>p.name).join(', ')}.`:''}${mine.length&&!mex.length?` 우리 구단 대표: ${mine.map(p=>p.name).join(', ')}.`:''}`,{imp:true,kind:e.ex?'병역':'선수'});
  if(mex.length)news('선수',`${mex.map(p=>p.name).join('·')}, ${e.n} ${res}로 병역 특례`,`${tshort(G.user)}이(가) 군 공백 걱정을 덜었습니다.`,2,{fanW:1.5});
  if(hero&&hero.team===G.user)news('선수',`${e.n} 영웅 ${hero.name}, 우리 구단의 새 스타`,`대표팀에서의 활약으로 인기가 치솟았습니다.`,2,{fanW:1.5});
  /* 성적이 나쁘면 국가대표 감독 교체 */
  if(lv===4&&(k==='ag'||k==='oly'||R()<.5)){ const old=ntMgr().name; G.ntMgr={name:genName(),since:G.year}; news('리그',`국가대표 ${old} 감독 사퇴`,`${e.n} 부진의 책임을 졌습니다. 새 감독은 ${G.ntMgr.name}.`,0); }
  return res; }
