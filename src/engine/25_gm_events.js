/* ===== 단장 결정 사건 =====
 시즌 중 1~2주에 한 번, 단장이 직접 정해야 하는 일이 생긴다. 선택지마다 대가가 있고, 일부는 몇 주 뒤 결과가 돌아온다.
 기한 안에 정하지 않으면 기본 선택으로 처리된다. */
function evInit(){ G.evs=G.evs||[]; G.evf=G.evf||[]; G.evlog=G.evlog||[]; }
function evOpen(){ evInit(); return G.evs.filter(e=>!e.done); }
/* 핵심 결정: 나타나면 진행을 멈추고, 기한 하루 전에 한 번 더 멈춘다. 나머지 일상 결정은 알림 뒤 기한이 지나면 기본안으로 처리하고 결과를 보고한다 */
const EV_KEY=new Set(['scandal','reinf','clash','agent','fx','dline','fovs','post','mreq','mpick','inj']);
const EV_NAME={lead:'기강 문제',pt:'출전 기회 면담',call:'콜업 여론',press:'연패 기자회견',vet:'베테랑 제안',fan:'팬 행사',slump:'부진 선수 면담',ret:'은퇴 행사'};
function evNew(k,title,sit,opts,o){ evInit(); o=o||{};
  const e={id:'e'+(G.evSeq=(G.evSeq||0)+1),k,day:G.day,exp:G.day+(o.exp||5),title,sit,opts:opts.map(x=>({l:x.l,fx:x.fx})),def:o.def??opts.length-1,data:o.data||{},ref:o.ref??null,from:o.from||'운영팀',done:false};
  G.evs.push(e); if(G.evs.length>40)G.evs.splice(0,G.evs.length-40); { const rid=e.ref!=null?e.ref:(e.data&&e.data.pid); if(rid!=null){ G.evRecent=G.evRecent||{}; G.evRecent[k+':'+rid]=G.day; G.evRecent['p:'+rid]=G.day; } }
  const lines=opts.map((x,i)=>`${i+1}. ${x.l}: ${x.fx}`).join('\n');
  const m=mail(e.from,title,`${sit}\n\n${lines}\n\n${dmd(e.exp)}까지 정하지 않으면 "${opts[e.def].l}"(으)로 처리됩니다.`,{imp:true,kind:'결정',ref:e.ref,face:o.face??null,acts:opts.map((x,i)=>({l:x.l,a:'evPick',v:e.id+':'+i}))});
  e.mid=m.id; if((!EV_KEY.has(k)&&G.deleg&&G.deleg[k])||((k==='mreq'||k==='mpick')&&typeof autoOn==='function'&&autoOn('mgr'))){ e.deleg=true; evPick(e.id,e.def,true); } return e; }
function evPick(id,i,auto){ const e=(G.evs||[]).find(x=>x.id===id); if(!e||e.done)return '이미 정한 일입니다.'; e.done=true; e.pick=i;
  let r=''; try{ r=(EVH[e.k]&&EVH[e.k].pick(e,i))||''; }catch(err){ r=''; }
  e.res=r; const m=G.mail.find(x=>x.id===e.mid); if(m){ m.acts=[]; m.read=true; m.imp=false; m.body+=`\n\n[결정] ${e.opts[i].l}${e.deleg?' (비서가 맡은 일)':auto?' (기한이 지나 자동 처리)':''}${r?`\n${r}`:''}`; }
  if(auto&&!G.unemp){ (G.autoLog=G.autoLog||[]).unshift({d:G.day,t:e.title,c:e.opts[i].l,r:r||'',k:e.k,why:e.deleg?'deleg':'exp'}); if(G.autoLog.length>20)G.autoLog.length=20; } /* 자동 처리 결과는 따로 메일을 보내지 않고 주간 요약에 한 줄로 모은다 */
  G.stops=(G.stops||[]).filter(x=>x.id!==e.mid);
  G.evlog.unshift({d:G.day,y:G.year,t:e.title,c:e.opts[i].l,r,k:e.k,id:e.id,auto:!!auto}); if(G.evlog.length>80)G.evlog.length=80;
  return r; }
function evFollow(days,k,data){ evInit(); G.evf.push({day:G.day+days,k,data}); }
function evResult(evId,txt){ const L=(G.evlog||[]).find(x=>x.id===evId); if(L)L.f=txt; }
function evDaily(){ if(!G.evs)return;
  for(const e of G.evs)if(!e.done&&G.day>=e.exp)evPick(e.id,e.def,true);
  const due=(G.evf||[]).filter(f=>f.day<=G.day); if(due.length){ G.evf=G.evf.filter(f=>f.day>G.day); for(const f of due){ try{ EVH[f.k]&&EVH[f.k].follow&&EVH[f.k].follow(f.data); }catch(err){} } } }
function aiScandalWeek(){ if(period()!=='season'||R()>.025)return; const t=pick(G.teams.filter(x=>x.id!==G.user)); const L=playersOf(t.id).filter(p=>!(p.susp>G.day)); if(!L.length)return; const p=pick(L); const ty=wpick({gamble:.3,drink:.35,sns:.35}); const S=SCAND[ty];
  if(S.kbo)p.susp=G.day+gDays(S.kbo+(R()<.5?S.club:0)); story(p,`${S.t}로 징계`,'inj'); wire('징계',`${tshort(t.id)} ${p.name}, ${S.t}로 ${S.kbo?`출장정지 ${S.kbo}경기`:'제재금'} 징계`,{tid:t.id,ref:p.id}); }
function evWeek(){ try{ aiScandalWeek(); }catch(err){} if(period()!=='season'||G.gameOver||!G.mgr[G.user])return; evInit(); if(evOpen().length)return; if(R()>.8)return;
  const recent=new Set(G.evlog.filter(x=>x.d>G.day-35&&x.y===G.year).map(x=>x.k));
  /* 같은 선수에게 같은 종류 일이 90일 안에 또 생기지 않게, 어떤 선수든 개인 일상 사건은 45일에 한 번 */
  const RC=G.evRecent||{}; const pidOf=d=>d&&(d.r&&d.name&&d.id!=null?d.id:d.p&&d.p.id!=null?d.p.id:d.a&&d.a.id!=null?d.a.id:null);
  const cands=[]; for(const k in EVH){ const h=EVH[k]; if(recent.has(k)||!h.check)continue; let d=null; try{ d=h.check(); }catch(err){} if(!d)continue; const pid=pidOf(d); if(pid!=null&&((RC[k+':'+pid]||-999)>G.day-90||(!EV_KEY.has(k)&&(RC['p:'+pid]||-999)>G.day-45)))continue; cands.push([k,d,h.w||1]); }
  if(!cands.length)return; let x=R()*sum(cands.map(c=>c[2])); for(const c of cands){ x-=c[2]; if(x<=0){ EVH[c[0]].make(c[1]); return; } } }
const evP=id=>G.players[id];
const evLine=p=>{ const h=curLine(p); return h?statLine(h,p):'기록 없음'; };
function evSince(day){ return playersOf(G.user).filter(p=>(p.story||[]).some(s=>s.k==='move'&&s.y===G.year&&s.d>=day&&/이적|입단/.test(s.t))); }
const SCAND={gamble:{t:'해외 원정 도박',kbo:30,club:20,sp:400,fan:9,press:12,d:'시즌 전 해외 전지훈련 기간에 원정 도박을 한 사실이 보도됐습니다.'},
  drink:{t:'음주 소란',kbo:10,club:10,sp:150,fan:6,press:8,d:'원정 숙소 근처 술집에서 시비 끝에 소란을 피워 경찰이 출동했습니다.'},
  sns:{t:'SNS 막말',kbo:0,club:5,sp:50,fan:5,press:5,d:'개인 SNS에 팬을 비하하는 글을 올렸다가 지웠지만 캡처가 퍼졌습니다.'}};
const gDays=g=>Math.round(g*1.15);
const EVH={
  /* 선수 물의: KBO 징계는 자동, 구단 자체 징계는 단장이 정한다 */
  scandal:{ w:.5, check(){ if(R()>.3)return null; if((G.evlog||[]).some(x=>x.k==='scandal'&&x.y===G.year))return null;
      const L=playersOf(G.user).filter(p=>!(p.susp>G.day)&&!(p.joinY>G.year)); if(!L.length)return null; L.forEach(initPers);
      const w=L.map(p=>(p.pers.pro<8?3:1)*(p.pers.temp>=14?2:1)); let x=R()*sum(w), pk=L[0]; for(let i=0;i<L.length;i++){ x-=w[i]; if(x<=0){ pk=L[i]; break; } }
      return {p:pk,ty:wpick({gamble:.3,drink:.35,sns:.35})}; },
    make(d){ const p=d.p, S=SCAND[d.ty]; prInit(); G.pr.fan=clamp(G.pr.fan-S.fan,0,100); G.pr.press=clamp(G.pr.press-S.press,0,100); G.spend=G.spend||{}; G.spend.etc=(G.spend.etc||0)+S.sp;
      if(S.kbo)p.susp=G.day+gDays(S.kbo); story(p,`${S.t}로 ${ASSOC.s} 징계${S.kbo?` (출장정지 ${S.kbo}경기)`:' (제재금)'}`,'inj'); news('구단',`${tshort(G.user)} ${p.name}, ${S.t} 파문`,`${S.d} KBO 상벌위원회는 ${S.kbo?`출장정지 ${S.kbo}경기와 `:''}제재금을 부과했습니다. 후원사 일부가 광고를 중단해 약 ${money(S.sp)}의 손실이 예상됩니다.`,-3,{ref:p.id});
      evNew('scandal',`${p.name} ${S.t}: 구단 징계를 정해 주세요`,`${p.name}(${posLabel(p)}, ${p.age}세) ${S.d}\n${ASSOC.s} 징계: ${S.kbo?`출장정지 ${S.kbo}경기 + 제재금`:'제재금'}\n후원 손실 약 ${money(S.sp)}, 팬 여론 -${S.fan}, 언론 논조 -${S.press}가 이미 반영됐습니다. 구단 자체 징계 수위에 따라 여론과 후원사 반응이 달라집니다.`,
        [{l:'협회 징계만 따르기',fx:'선수 기분은 지키지만 "봐주기" 비판으로 팬 여론과 언론 논조가 더 떨어집니다.'},
         {l:`자체 징계 추가 (벌금·출장정지 ${S.club}경기)`,fx:'여론은 조금 더 떨어지고 선수 기분이 내려갑니다. 무난한 선택입니다.'},
         {l:'시즌 아웃 (무기한 출장정지)',fx:'올 시즌 더 쓸 수 없습니다. 여론이 회복되고, 후원사 일부가 돌아올 수 있습니다.'},
         {l:'방출',fx:'남은 연봉은 그대로 주고 팀을 떠납니다. 여론은 가장 빨리 회복됩니다.'}],{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id,ty:d.ty},def:1,exp:4}); },
    pick(e,i){ const p=evP(e.data.pid); const S=SCAND[e.data.ty]; if(!p||p.team!==G.user)return '이미 팀을 떠난 선수입니다.'; initPers(p); const base=Math.max(G.day,p.susp||0);
      if(i===0){ G.pr.fan=clamp(G.pr.fan-4,0,100); G.pr.press=clamp(G.pr.press-6,0,100); p.mor=clamp((p.mor??60)+4,0,100); evFollow(21,'scandal',{pid:p.id,ty:e.data.ty,c:0}); return '팬 여론 -4, 언론 논조 -6. 선수는 구단에 고마워합니다.'; }
      if(i===1){ p.susp=base+gDays(S.club); G.pr.fan=clamp(G.pr.fan-1,0,100); p.mor=clamp((p.mor??60)-8,0,100); evFollow(21,'scandal',{pid:p.id,ty:e.data.ty,c:1}); return `${p.name} 출장정지가 ${S.club}경기 늘었습니다. 선수 기분 -8.`; }
      if(i===2){ p.susp=Math.max(base,G.cal?G.cal.end+1:base+120); G.pr.fan=clamp(G.pr.fan+3,0,100); G.pr.press=clamp(G.pr.press+4,0,100); p.mor=clamp((p.mor??60)-20,0,100); evFollow(21,'scandal',{pid:p.id,ty:e.data.ty,c:2}); return `${p.name}은(는) 올 시즌 뛸 수 없습니다. 팬 여론 +3, 언론 논조 +4.`; }
      const nm=p.name; if(p.foreign)releaseForeign(p.id); else releasePlayer(p.id); G.pr.fan=clamp(G.pr.fan+4,0,100); G.pr.press=clamp(G.pr.press+5,0,100); evFollow(21,'scandal',{pid:null,ty:e.data.ty,c:3,nm}); return `${nm}을(를) 방출했습니다. 팬 여론 +4, 언론 논조 +5.`; },
    follow(d){ const S=SCAND[d.ty]; if(d.c>=2){ const back=Math.round(S.sp*.5); G.spend.etc=Math.max(0,(G.spend.etc||0)-back); mail('마케팅팀','후원사 일부 복귀',`강한 자체 징계 뒤 광고를 중단했던 후원사 일부가 돌아왔습니다. 손실 ${money(back)}을(를) 만회했습니다.`,{kind:'재정'}); }
      else if(d.c===0){ G.pr.fan=clamp(G.pr.fan-2,0,100); mail('마케팅팀','징계 논란이 이어집니다',`"구단이 감싼다"는 비판이 계속되고 있습니다. 팬 여론이 조금 더 떨어졌습니다.`,{kind:'재정'}); } } },
  /* 출전 시간 불만: 시즌 100경기가 지난 뒤에만 생긴다. 선수는 먼저 감독에게 따지고, 그게 기사로 나오면 단장이 후속 조치를 정한다.
     감독이 스스로 수습하면(자존심이 낮을수록) 단장에게 올라오지 않고 '기회 약속' 기사로 끝난다 */
  pt:{ w:1.2, check(){ const r=G.sea&&G.sea.rec&&G.sea.rec[G.user]; if(!r||r.w+r.l+(r.t||0)<100||!G.mgr[G.user])return null;
      const reg=new Set((()=>{ const d=depth(G.user); return [...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id); })());
      const regs=playersOf(G.user).filter(p=>reg.has(p.id)); const bar=regs.length?avg(regs.map(ovr))-4:50;
      const L=playersOf(G.user).filter(p=>{ initPers(p); return healthy(p)&&!reg.has(p.id)&&!p.ys&&(ovr(p)>=bar||p.sal>=400||(p.age>=27&&ovr(p)>=bar-3))&&p.mor<66&&!p.promise&&!p.listed&&p.age>=22&&!(p.ptDay>G.day-60); }).sort((a,b)=>ovr(b)-ovr(a)); return L[0]||null; },
    make(p){ p.ptDay=G.day; const m=G.mgr[G.user]; const tn=tshort(G.user);
      if(R()<clamp((70-m.ego)/100,.1,.45)){ p.promise={until:G.day+30}; p.mor=clamp(p.mor+5,0,100);
        news('선수',`${tn} ${p.name}, ${m.name} 감독과 면담 뒤 "기회 받겠다"`,`출전 시간 문제로 감독실을 찾은 ${p.name}에게 ${m.name} 감독이 남은 시즌 기회를 약속했습니다. 감독이 직접 수습한 일이라 프런트 개입은 없었습니다.`,0,{ref:p.id}); return; }
      const hot=m.ego>=65; news('선수',`${tn} ${p.name}, ${m.name} 감독과 출전 문제로 ${hot?'언쟁':'충돌'}`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) 출전 시간 문제로 ${m.name} 감독을 찾아갔다가 ${hot?'고성이 오갔다는 이야기가 나옵니다':'서로 입장 차이만 확인했습니다'}. 올해 기록: ${evLine(p)}.`,-1,{ref:p.id});
      evNew('pt',`${p.name}-${m.name} 감독 갈등: 후속 조치`,`[기사] ${tn} ${p.name}이(가) 출전 시간 문제로 ${m.name} 감독과 ${hot?'언쟁을 벌였다':'부딪쳤다'}는 기사가 났습니다.\n선수 말: "${moraleWhy(p)}"\n감독 쪽: "${hot?'기용은 감독이 정합니다. 선수가 감독실에 와서 따질 일은 아닙니다.':'팀 사정상 지금은 어렵다고 설명했습니다.'}"\n올해 기록: ${evLine(p)}`,
      [{l:'감독 편에 서기',fx:'감독 관계가 오르고 기강이 섭니다. 선수 기분은 크게 떨어집니다.'},
       {l:'선수 면담 뒤 감독에게 기용 건의',fx:'선수 기분이 오르고 감독 관계는 내려갑니다. 한 달 안에 기회를 못 얻으면 선수가 크게 실망합니다.'},
       {l:'트레이드 명단에 올리기',fx:tradeOpen()?'선수 기분이 조금 오르고, 다른 구단 제안이 올 수 있습니다.':'선수 기분이 조금 오릅니다. 트레이드는 포스트시즌 뒤에 다시 열립니다.'},
       {l:'지켜보기',fx:'둘이 알아서 풀게 둡니다. 선수 기분이 조금 떨어지고 언론은 프런트가 손 놓았다고 봅니다.'}],{ref:p.id,face:p.id,from:'홍보팀',data:{pid:p.id,hot},def:3}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '이미 팀을 떠난 선수입니다.'; const m=G.mgr[G.user];
      if(i===0){ if(m)m.rel=clamp(m.rel+4,0,100); p.mor=clamp(p.mor-9,0,100); return `감독 관계 +4. ${p.name} 기분 -9. 선수단에는 감독 권한을 존중한다는 메시지가 갔습니다.`; }
      if(i===1){ p.promise={until:G.day+30}; p.mor=clamp(p.mor+8,0,100); const d=m&&m.ego>=70?5:3; if(m)m.rel=clamp(m.rel-d,0,100); return `${p.name} 기분 +8, 감독 관계 -${d}. 한 달 뒤 기회를 얻었는지 알려 드립니다.`; }
      if(i===2){ listPlayer(p.id); p.mor=clamp(p.mor+3,0,100); return `${p.name}을(를) 트레이드 명단에 올렸습니다. 기분 +3.`; }
      p.mor=clamp(p.mor-4,0,100); prInit(); G.pr.press=clamp(G.pr.press-1,0,100); return `${p.name} 기분 -4, 언론 -1.`; } },
  /* 2군 유망주 콜업 여론 */
  call:{ w:1.1, check(){ if(!entryOn())return null;
      const L=playersOf(G.user).filter(p=>!p.e1&&!p.ys&&healthy(p)&&canUp(p)).map(p=>{ const h=seasonTotal(p,G.year,'퓨처스'); if(!h)return null;
        if(p.isP){ if(h.outs<75)return null; const era=h.er*27/h.outs; return era<=3.2?{p,h,s:3.2-era}:null; }
        if(h.pa<50)return null; const ops=bRate(h).ops; return ops>=.84?{p,h,s:ops-.84}:null; }).filter(Boolean).sort((a,b)=>b.s-a.s); return L[0]||null; },
    make(x){ const p=x.p; evNew('call',`${p.name} 콜업 여론`,`2군에서 ${p.name}(${posLabel(p)}, ${p.age}세)이(가) ${statLine(x.h,p)}로 활약 중입니다. 팬 커뮤니티에서 1군에 올리라는 목소리가 커지고 있습니다.`,
      [{l:'감독에게 콜업 요청',fx:'감독이 받아들이면 바로 1군에 등록됩니다. 거절하면 감독 관계가 조금 내려갑니다. 한 달 뒤 1군 성적을 보고합니다.'},
       {l:'2군에서 더 키운다',fx:'팬 여론이 조금 내려갑니다. 야망이 큰 선수는 실망합니다.'}],{ref:p.id,face:p.id,from:'스카우트팀장',data:{pid:p.id},def:1}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '이미 팀을 떠난 선수입니다.';
      if(i===0){ const r=reqEntry(p.id,true); if(p.e1){ G.pr.fan=clamp(G.pr.fan+2,0,100); const h=seasonTotal(p,G.year,'1군'); evFollow(30,'call',{pid:p.id,ev:e.id,pa:h?h.pa:0,outs:h?h.outs:0}); } return r; }
      G.pr.fan=clamp(G.pr.fan-2,0,100); initPers(p); if(p.pers.amb>=13){ p.mor=clamp(p.mor-6,0,100); return `팬 여론 -2. ${p.name}은(는) 실망한 기색입니다(기분 -6).`; } return '팬 여론 -2. 선수는 묵묵히 준비하겠다고 합니다.'; },
    follow(d){ const p=evP(d.pid); if(!p||p.team!==G.user)return; const h=seasonTotal(p,G.year,'1군');
      const t=h?`${p.name} 콜업 한 달: 1군 ${statLine(h,p)}${p.e1?'':' · 지금은 2군로 내려가 있습니다'}`:`${p.name} 콜업 한 달: 1군 기회를 거의 얻지 못했습니다.`; evResult(d.ev,t); note('엔트리',t,p.id); } },
  /* 감독의 보강 요청 */
  reinf:{ w:1, check(){ const m=G.mgr[G.user]; if(!m||G.day>KD(7,24))return null; if(G.day-(G.mgrReqD??-99)<45)return null; /* 감독 보강 요청(자리 요청)과 겹치지 않게 */
      const all=G.teams.map(t=>({t:t.id,d:depth(t.id)})); const rk=f=>{ const vs=all.map(x=>({t:x.t,v:f(x.d)})).sort((a,b)=>b.v-a.v); return vs.findIndex(x=>x.t===G.user)+1; };
      const L=[['선발진',rk(d=>avg(d.sp.slice(0,5).map(spV)))],['불펜',rk(d=>avg(d.pen.slice(0,5).map(penV)))],['타선',rk(d=>avg(d.start.map(offV)))]].sort((a,b)=>b[1]-a[1]);
      return L[0][1]>=8?{area:L[0][0],rank:L[0][1]}:null; },
    make(x){ const m=G.mgr[G.user]; G.mgrReqD=G.day; evNew('reinf',`감독의 ${x.area} 보강 요청`,`${m.name} 감독: "우리 ${x.area}이(가) 리그 ${x.rank}위입니다. 이대로는 버티기 어렵습니다. 보강을 부탁드립니다."`,
      [{l:'30일 안에 보강 약속',fx:'감독 관계가 오릅니다. 30일 안에 트레이드·외국인 교체 등으로 선수를 데려오지 못하면 크게 떨어집니다.'},
       {l:'지금 전력으로 버티자',fx:'감독 관계가 내려갑니다.'}],{from:'감독실',data:{area:x.area},def:1}); },
    pick(e,i){ const m=G.mgr[G.user]; if(!m)return ''; if(i===0){ m.rel=clamp(m.rel+4,0,100); evFollow(30,'reinf',{ev:e.id,day:G.day,area:e.data.area,mid:m.id}); return '감독 관계 +4. 30일 안에 선수를 데려와야 합니다.'; }
      m.rel=clamp(m.rel-5,0,100); return '감독 관계 -5. 감독은 아쉬운 표정입니다.'; },
    follow(d){ const m=G.mgr[G.user]; if(!m||m.id!==d.mid)return; const got=evSince(d.day);
      if(got.length){ m.rel=clamp(m.rel+6,0,100); if(!G.form||G.day>G.form.until)G.form={until:G.day+14,b:.6}; const t=`${m.name} 감독: "약속을 지켜 주셨습니다. ${got.slice(0,2).map(p=>p.name).join(', ')} 합류로 선수단 분위기가 살아났습니다." (감독 관계 +6, 2주간 팀 분위기 상승)`; evResult(d.ev,t); note('감독',t); }
      else { m.rel=clamp(m.rel-10,0,100); const t=`${m.name} 감독: "보강 약속은 어떻게 된 겁니까?" 30일이 지났지만 데려온 선수가 없습니다. (감독 관계 -10)`; evResult(d.ev,t); stop('감독',t); } } },
  /* 더그아웃 충돌 */
  clash:{ w:.8, check(){ if(R()>.4)return null; const ps=playersOf(G.user).filter(p=>{ initPers(p); return healthy(p)&&p.pers.temp>=15&&p.mor<70&&isRegular(p); }); if(!ps.length)return null;
      const a=ps[Math.floor(R()*ps.length)]; const others=playersOf(G.user).filter(p=>p.id!==a.id&&healthy(p)&&isRegular(p)); if(!others.length)return null; return {a,b:others[Math.floor(R()*others.length)]}; },
    make(x){ evNew('clash',`더그아웃 충돌: ${x.a.name}`,`${x.a.name}이(가) ${x.b.name}와(과) 더그아웃에서 언성을 높였습니다. 기사로 나가기 전에 정리해야 합니다.`,
      [{l:'경고로 끝낸다',fx:'조용히 넘어갑니다. 언론에 새어 나갈 수 있습니다.'},
       {l:'출장 정지 5일',fx:`${x.a.name}은(는) 5일간 못 뛰고 기분이 크게 떨어집니다. 기강이 서서 2주간 팀 분위기가 오릅니다.`},
       {l:'트레이드 명단에 올리기',fx:tradeOpen()?'갈등을 정리합니다. 다른 구단이 싸게 보려 할 수 있습니다.':'갈등을 정리합니다. 트레이드는 포스트시즌 뒤에 다시 열립니다.'}],{ref:x.a.id,face:x.a.id,from:'수석코치',data:{a:x.a.id,b:x.b.id},def:0}); },
    pick(e,i){ const a=evP(e.data.a); if(!a||a.team!==G.user)return '';
      if(i===0){ a.mor=clamp(a.mor-3,0,100); if(R()<.4){ news('선수',`${tshort(G.user)} 더그아웃 불화설`,`${a.name}이(가) 동료와 충돌했다는 이야기가 흘러나왔습니다. 구단은 "별일 아니다"라고 밝혔습니다.`,-2,{ref:a.id}); return '경고로 마무리했지만 이야기가 언론에 새어 나갔습니다(언론 논조 하락).'; } return '조용히 마무리했습니다.'; }
      if(i===1){ a.susp=G.day+5; a.mor=clamp(a.mor-12,0,100); G.form={until:G.day+14,b:.5}; for(const p of playersOf(G.user))if(p.id!==a.id&&p.pers&&p.pers.pro>=13)p.mor=clamp(p.mor+2,0,100); return `${a.name} 5일 출장 정지(기분 -12). 2주간 팀 분위기 상승.`; }
      listPlayer(a.id); return `${a.name}을(를) 트레이드 명단에 올렸습니다.`; } },
  /* 연패 기자회견 */
  press:{ w:1.3, check(){ const L=(G.sea.tl&&G.sea.tl[G.user])||[]; if(L.length<6)return null; const last=L.slice(-5); return last.every(x=>x[0]<0)?{n:(()=>{ let n=0; for(let i=L.length-1;i>=0&&L[i][0]<0;i--)n++; return n; })()}:null; },
    make(x){ const r=G.sea.rec[G.user]; evNew('press',`${x.n}연패, 기자회견`,`${x.n}연패로 시즌 ${r.w}승 ${r.l}패가 됐습니다. 기자들이 단장의 입장을 묻고 있습니다.`,
      [{l:'감독 신임 표명',fx:'감독 관계가 크게 오릅니다. 그래도 계속 지면 언론이 단장 책임론을 꺼냅니다.'},
       {l:'선수단 분발 촉구',fx:'프로의식이 높은 선수는 2주간 분발하고, 나머지는 기분이 내려갑니다.'},
       {l:'말을 아낀다',fx:'언론 논조가 조금 내려갑니다.'}],{from:'홍보팀',data:{n:x.n},def:2,exp:3}); },
    pick(e,i){ const m=G.mgr[G.user]; const r=G.sea.rec[G.user]; const base={w:r.w,l:r.l,ev:e.id,i};
      if(i===0){ if(m)m.rel=clamp(m.rel+8,0,100); news('언론',`단장 "${m?m.name:'감독'} 감독 믿는다"`,`연패 속에서도 단장은 감독에게 힘을 실어 줬습니다.`,1); evFollow(10,'press',base); return '감독 관계 +8. 10일 뒤 성적에 따라 여론이 갈립니다.'; }
      if(i===1){ let up=0,dn=0; for(const p of playersOf(G.user)){ initPers(p); if(p.pers.pro>=13){ p.form={until:G.day+14,b:.8}; up++; } else { p.mor=clamp(p.mor-5,0,100); dn++; } } evFollow(10,'press',base); return `${up}명은 분발(2주), ${dn}명은 기분 -5.`; }
      G.pr.press=clamp(G.pr.press-3,0,100); return '언론 논조 -3.'; },
    follow(d){ const r=G.sea.rec[G.user]; const w=r.w-d.w, l=r.l-d.l; const good=w>l;
      let t=`기자회견 뒤 10일: ${w}승 ${l}패.`; if(d.i===0&&!good){ news('언론',`연패 탈출 실패… 단장 책임론`,`단장이 감독을 공개적으로 신임했지만 반등은 없었습니다.`,-2); t+=' 반등이 없어 단장 책임론 기사가 나왔습니다.'; } else if(good)t+=' 분위기 반전에 성공했습니다.';
      evResult(d.ev,t); note('언론',t); } },
  /* 베테랑 멘토 */
  vet:{ w:.6, check(){ if((G.mentor&&G.mentor.y===G.year)||G.vetAsk===G.year)return null; const L=playersOf(G.user).filter(p=>{ initPers(p); return p.age>=33&&p.pers.pro>=13&&!p.foreign; }).sort((a,b)=>b.age-a.age); return L[0]||null; },
    make(p){ G.vetAsk=G.year; evNew('vet',`${p.name}의 제안`,`베테랑 ${p.name}(${p.age}세)이(가) 젊은 선수들을 따로 챙기고 싶다고 합니다. 코치진도 반기는 분위기입니다.`,
      [{l:'멘토 역할 맡기기 (수당 5천만)',fx:'올 시즌 24세 이하 선수 성장이 조금 빨라지고, 본인 기분이 오릅니다.'},
       {l:'선수로 집중해 달라',fx:'변화가 없습니다. 본인은 조금 서운해합니다.'}],{ref:p.id,face:p.id,from:p.name,data:{pid:p.id},def:1}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '';
      if(i===0){ G.mentor={id:p.id,y:G.year}; G.spend.etc=(G.spend.etc||0)+50; p.mor=clamp(p.mor+8,0,100); return `${p.name} 멘토 지정. 올 시즌 24세 이하 성장 +5%. 수당 5천만.`; }
      p.mor=clamp(p.mor-3,0,100); return `${p.name} 기분 -3.`; } },
  /* 마케팅 행사 */
  fan:{ w:.6, check(){ const n=(G.evlog||[]).filter(x=>x.k==='fan'&&x.y===G.year).length; return n<2&&G.pr.fan<56&&!team(G.user).indie?{fan:Math.round(G.pr.fan)}:null; },
    make(x){ evNew('fan','팬 행사 제안',`마케팅팀이 팬 행사를 제안했습니다. 현재 팬 여론은 ${x.fan}입니다.`,
      [{l:'팬 사인회·할인 주간 (2억)',fx:'팬 여론이 크게 오르고 구단 인기도 조금 오릅니다.'},
       {l:'유니폼 증정 경기 (8천만)',fx:'팬 여론이 조금 오릅니다.'},
       {l:'하지 않는다',fx:'변화가 없습니다.'}],{from:'마케팅팀',def:2}); },
    pick(e,i){ const t=team(G.user);
      if(i===0){ G.spend.etc=(G.spend.etc||0)+200; G.pr.fan=clamp(G.pr.fan+8,0,100); t.pop=clamp(t.pop+.01,0,1.5); return '2억 지출. 팬 여론 +8, 구단 인기 소폭 상승.'; }
      if(i===1){ G.spend.etc=(G.spend.etc||0)+80; G.pr.fan=clamp(G.pr.fan+3,0,100); return '8천만 지출. 팬 여론 +3.'; } return ''; } },
  /* FA 앞둔 주축의 다년계약 요구 */
  agent:{ w:.8, check(){ const top=playersOf(G.user).map(ovr).sort((a,b)=>b-a); const bar=top[11]||50; const L=playersOf(G.user).filter(p=>!p.foreign&&!p.faC&&!p.extNext&&p.svc===faSvc(p)-1&&ovr(p)>=bar&&!p.agentY); return L.sort((a,b)=>ovr(b)-ovr(a))[0]||null; },
    make(p){ p.agentY=G.year; evNew('agent',`${p.name} 측, 다년계약 요구`,`올 시즌 뒤 FA가 되는 ${p.name}(${posLabel(p)}, ${p.age}세)의 에이전트가 시즌 중 다년계약 협상을 원합니다.\n올해 기록: ${evLine(p)}`,
      [{l:'다년계약 협상하기',fx:'선수 관리 화면에서 조건을 제시합니다. 협상이 틀어지면 기분이 내려갈 수 있습니다.'},
       {l:'시즌 끝나고 이야기하자',fx:'선수 기분이 조금 내려가고, FA 시장에 나갈 가능성이 커집니다.'}],{ref:p.id,face:p.id,from:'에이전트',data:{pid:p.id},def:1}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p)return ''; if(i===0)return '선수 정보의 관리 탭에서 다년계약 조건을 제시하세요.'; p.mor=clamp(p.mor-5,0,100); return `${p.name} 기분 -5.`; } },
  /* 주전 슬럼프 */
  slump:{ w:1.1, check(){ const d=depth(G.user); const L=d.start.filter(p=>(p.l10||[]).length>=8).map(p=>{ const L=p.l10; const ab=sum(L.map(x=>x[0])),h=sum(L.map(x=>x[1])),bb=sum(L.map(x=>x[3])),xb=sum(L.map(x=>x[5]||0)); if(ab<25)return null; const ops=(h+bb)/(ab+bb)+(h+xb)/ab; return ops<.5?{p,ops,avg:h/ab}:null; }).filter(Boolean).sort((a,b)=>a.ops-b.ops); return L[0]||null; },
    make(x){ const p=x.p; evNew('slump',`${p.name}, 깊은 슬럼프`,`주전 ${p.name}(${posLabel(p)})이(가) 최근 10경기 타율 ${fmt3(x.avg)}, OPS ${fmt3(x.ops)}에 그치고 있습니다. 전력분석팀은 타격 밸런스가 무너졌다고 봅니다.\n시즌 기록: ${evLine(p)}`,
      [{l:'2군에서 조정 (말소 요청)',fx:'감독이 받아들이면 10일 이상 2군에서 조정합니다. 돌아오면 2주간 컨디션이 좋아집니다. 본인 기분은 내려갑니다.'},
       {l:'면담으로 다잡기',fx:'프로의식이 높은 선수는 2주간 분발합니다. 아니면 기분만 내려갑니다.'},
       {l:'믿고 기다린다',fx:'변화가 없습니다. 선수 기분이 조금 오릅니다.'}],{ref:p.id,face:p.id,from:'전력분석팀',data:{pid:p.id},def:2}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '';
      if(i===0){ const r=reqEntry(p.id,false); if(!p.e1){ p.mor=clamp(p.mor-6,0,100); p.form={until:G.day+24,b:.9}; evFollow(25,'slump',{pid:p.id,ev:e.id}); } return r; }
      if(i===1){ initPers(p); if(p.pers.pro>=12){ p.form={until:G.day+14,b:.9}; p.mor=clamp(p.mor+2,0,100); evFollow(15,'slump',{pid:p.id,ev:e.id}); return `${p.name}: "다시 준비하겠습니다." (2주간 분발)`; } p.mor=clamp(p.mor-6,0,100); return `${p.name}: "저도 답답합니다." (기분 -6)`; }
      p.mor=clamp(p.mor+3,0,100); return `${p.name} 기분 +3.`; },
    follow(d){ const p=evP(d.pid); if(!p)return; const L=p.l10||[]; const ab=sum(L.map(x=>x[0])),h=sum(L.map(x=>x[1])); const t=ab?`${p.name} 조정 이후 최근 10경기 타율 ${fmt3(h/ab)}.`:`${p.name}은(는) 아직 1군 경기에 나오지 않았습니다.`; evResult(d.ev,t); note('경기',t,p.id); } },
  /* 외국인 선수 부진 */
  fx:{ w:1, check(){ if(G.day>foreignDL()||fReplLeft(G.user)<=0)return null; const L=foreignOf(G.user).filter(p=>!p.fxAsk).map(p=>{ const h=seasonTotal(p,G.year,'1군'); if(!h)return null;
        if(p.isP){ if(h.outs<120)return null; const era=h.er*27/h.outs; return era>=5.4?{p,h,s:era}:null; } if(h.pa<120)return null; const ops=bRate(h).ops; return ops<.7?{p,h,s:1-ops}:null; }).filter(Boolean).sort((a,b)=>b.s-a.s); return L[0]||null; },
    make(x){ const p=x.p; p.fxAsk=G.year; evNew('fx',`외국인 ${p.name} 부진`,`${p.name}이(가) ${statLine(x.h,p)}에 머물고 있습니다. 교체 여론이 나옵니다. 교체 기한은 8월 15일입니다.`,
      [{l:'교체 후보 보기',fx:'외국인 시장으로 이동합니다. 교체하면 남은 연봉을 정산합니다.'},
       {l:'한 달 더 지켜본다',fx:'한 달 뒤 성적을 다시 보고합니다. 그사이 교체 기한이 지날 수 있습니다.'}],{ref:p.id,face:p.id,from:'전력분석팀',data:{pid:p.id},def:1}); },
    pick(e,i){ const p=evP(e.data.pid); if(!p)return ''; if(i===0)return '외국인 시장에서 교체 후보를 확인하세요.'; const h=seasonTotal(p,G.year,'1군'); evFollow(30,'fx',{pid:p.id,ev:e.id}); return '한 달 뒤 다시 보고합니다.'; },
    follow(d){ const p=evP(d.pid); if(!p||p.team!==G.user)return; const h=seasonTotal(p,G.year,'1군'); const t=`${p.name} 한 달 뒤: ${h?statLine(h,p):'기록 없음'}.`; evResult(d.ev,t); note('경기',t,p.id); } },
  /* 부상 조기 복귀 (부상 순간에 발생) */
  inj:{ pick(e,i){ const p=evP(e.data.pid); if(!p)return ''; if(i===0&&p.injOut>0){ const before=p.injOut; p.injOut=Math.max(2,Math.round(p.injOut*.6)); p.rush=G.day+p.injOut+30; evFollow(p.injOut+30,'inj',{pid:p.id,n:p.injHist.length,ev:e.id}); return `복귀 예정 ${before}일 → ${p.injOut}일. 복귀 후 한 달은 부상 위험 3배.`; } return '예정대로 재활합니다.'; },
    follow(d){ const p=evP(d.pid); if(!p)return; const t=p.injHist.length>d.n?`${p.name} 조기 복귀 뒤 다시 다쳤습니다.`:`${p.name} 조기 복귀 뒤 한 달 동안 탈 없이 뛰었습니다.`; evResult(d.ev,t); note('복귀',t,p.id); } }
};
function evInjury(p,days){ if(p.team!==G.user||period()!=='season'||days<12||days>70||evOpen().some(e=>e.k==='inj'))return; if(!isRegular(p))return;
  evNew('inj',`${p.name} 복귀 시점`,`${p.name}이(가) 부상으로 약 ${days}일 빠집니다. 의무팀은 무리하면 일찍 돌아올 수 있다고 합니다.`,
    [{l:'조기 복귀 (재활 약 40% 단축)',fx:'빨리 돌아오지만, 복귀 후 한 달 동안 부상 위험이 3배입니다.'},
     {l:'정상 재활',fx:'예정대로 복귀합니다.'}],{ref:p.id,face:p.id,from:'팀 닥터 · 의무팀',data:{pid:p.id},def:1,exp:2}); }

