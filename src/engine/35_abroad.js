/* ===== 해외 진출: 외국인 역수출 · 국내 선수 포스팅/해외 FA · 해외파 추적 ===== */
const MLBT=['뉴욕','LA','시카고','보스턴','시애틀','샌디에이고','텍사스','토론토','애리조나','디트로이트'], NPBT=['도쿄','오사카','후쿠오카','요코하마','나고야','센다이','삿포로','히로시마'];
const usd=m=>Math.round(m*USD); // 만 달러 → 게임 금액
function seasonWar(p,y){ const h=seasonTotal(p,y??G.year,'1군'); return h?warOf(h,p):0; }
/* 외국인: 잘하면 MLB·NPB가 데려간다 */
function fOverseas(){ for(const p of Object.values(G.players)){ if(!p.foreign||p.team==null||p.joinY>G.year)continue; const w=seasonWar(p); if(w<3.5||p.age>=35)continue;
    const mlb=p.foreign==='용병'&&p.age<=32&&w>=5.5&&R()<.35+Math.min(.25,(w-5.5)*.08), npb=!mlb&&R()<(p.foreign==='아시아'?.45:.22)+(w>=5?.2:0); if(!mlb&&!npb)continue;
    const lg=mlb?'MLB':'NPB'; const yrs=mlb?ri(1,2):ri(1,3); const amt=Math.round(mlb?clamp(150+(w-5)*120+N(0,60),120,900):clamp(120+(w-3.5)*90+N(0,40),100,500)); const club=pick(lg==='MLB'?MLBT:NPBT);
    p.ovsOffer={lg,club,yrs,amt,y:G.year};
    if(p.team!==G.user){ let stay=R()<(lg==='MLB'?.12:.3); if(stay&&p.foreign!=='아시아'){ const oth=sum(foreignOf(p.team).filter(x=>x.foreign==='용병'&&x.id!==p.id).map(fCommit)); const ns=round5(Math.min(Math.max(p.sal*1.35,usd(amt)*.9),fCap(p.team)-oth,Math.max(p.sal,200*USD))); stay=ns>p.sal; if(stay){ p.sal=ns; p.kept={y:G.year,sal:ns}; } } else if(stay){ p.sal=round5(p.sal+10*USD); p.kept={y:G.year,sal:p.sal}; } if(stay){ wire('외국인',`${tname(p.team)} ${p.name}, ${lg} 제안 뿌리치고 잔류`,{tid:p.team,ref:p.id}); delete p.ovsOffer; }
      else { ovsLeave(p,lg,club,yrs,amt,'외국인'); } continue; }
    evNew('fovs',`${p.name}에게 ${lg} 제안`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) 올 시즌 WAR ${w.toFixed(1)}을 기록하자 ${club} 구단(${lg})이 ${yrs}년 총 ${amt*yrs}만 달러 수준을 제시했습니다. 에이전트는 국내 잔류도 열어 두었지만 ${lg==='MLB'?'메이저리그 복귀를 원합니다':'조건이 맞으면 일본으로 가겠다고 합니다'}.`,
      [{l:`잔류 설득 (연봉 ${Math.round(Math.max(p.sal/USD*1.5,amt*.85))}만 달러)`,fx:`${lg==='MLB'?'성공 확률이 낮습니다(약 20%)':'성공 확률은 절반 정도입니다'}. 실패하면 연봉 부담 없이 떠납니다. 재계약 선수는 개인 연봉 상한이 없지만 3명 총액 한도는 지켜야 합니다.`},
       {l:'축하하며 보내 준다',fx:'떠납니다. 대체 외국인을 찾아야 합니다.'}],{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id},def:1,exp:12}); } }
EVH.fovs={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||!p.ovsOffer)return ''; const o=p.ovsOffer;
    if(i===0){ const asia=p.foreign==='아시아'; const ns=asia?round5(p.sal+10*USD):round5(Math.min(usd(Math.max(p.sal/USD*1.5,o.amt*.85)),Math.max(p.sal,200*USD))); const yb=foreignOf(G.user).filter(x=>x.foreign==='용병'&&x.id!==p.id); const capOk=asia||sum(yb.map(fCommit))+ns<=fCap(G.user);
      if(!capOk)return `외국인 연봉 총액 한도(${money(fCap(G.user))})를 넘어 설득할 수 없습니다. ${ovsLeave(p,o.lg,o.club,o.yrs,o.amt,'외국인')}`;
      const ok=R()<((o.lg==='MLB'?.2:.5)+((p.mor??60)-60)/200)*(asia?.5:1); if(ok){ p.sal=ns; p.kept={y:G.year,sal:ns}; delete p.ovsOffer; news('선수',`${p.name}, ${o.lg} 제안 뿌리치고 잔류`,`${tshort(G.user)}이(가) 연봉 ${money(ns)}에 붙잡았습니다.`,2,{ref:p.id}); return `설득 성공. 연봉 ${money(ns)}.`; }
      return `설득에 실패했습니다. ${ovsLeave(p,o.lg,o.club,o.yrs,o.amt,'외국인')}`; }
    return ovsLeave(p,o.lg,o.club,o.yrs,o.amt,'외국인'); } };
/* 떠나는 선수를 해외파 명단으로 옮긴다 (국내 선수는 나중에 돌아올 수 있다) */
function ovsLeave(p,lg,club,yrs,amt,how,fee){ const from=p.team??p.faFrom; G.abroad=G.abroad||[]; termsClear(p); /* 해외로 가면 국내 계약 조건은 끝난다(돌아와도 되살아나지 않게) */
  const rec={id:p.id,name:p.name,isP:p.isP,pos:posLabel(p),foreign:p.foreign||null,from,lg,club,how,yrs,amt,y:G.year,age:p.age,lines:[],fee:fee||0,back:false,pj:p.foreign?null:JSON.stringify(p)};
  G.abroad.unshift(rec); while(G.abroad.length>120){ let i=-1; for(let j=G.abroad.length-1;j>=0;j--)if(G.abroad[j].back||G.abroad[j].foreign){ i=j; break; } G.abroad.splice(i>=0?i:G.abroad.length-1,1); } /* 넘치면 이미 돌아온 기록부터 지운다(아직 해외에 있는 선수가 사라지지 않게) */ mvLog('해외 진출',p,from,null,`${club}(${lg}) ${yrs}년`);
  for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; if(G.fa&&G.fa.pool)G.fa.pool=G.fa.pool.filter(x=>x!==p.id); delete G.players[p.id];
  const t=`${p.name}, ${club} 구단(${lg})과 ${yrs}년 계약${how==='포스팅'?` · 포스팅 비용 ${money(fee)}`:''}`; wire(lg==='MLB'?'해외':'해외',t,{tid:from});
  try{ featAdd('ovs',null,`${p.name} ${how==='외국인'?'역수출':'해외 진출'} · ${club}(${lg}) ${yrs}년 ${amt*yrs}만 달러`,{tid:from,name:p.name,maj:lg==='MLB'}); }catch(e){}
  if(from===G.user){ news('선수',`${p.name}, ${lg} 진출 확정`,`${club} 구단과 ${yrs}년 총 ${amt*yrs}만 달러에 계약했습니다.${fee?` 구단은 포스팅 비용 ${money(fee)}을 받습니다.`:''}`,1,{fanW:.5}); }
  return `${p.name}이(가) ${club}(${lg})로 떠납니다.`; }
/* 국내 선수의 메이저리그 꿈: 야망 + 활약 + 언론 */
function mlbOf(p){ if(p.mlb==null){ initPers(p); p.mlb=clamp(Math.round((p.pers.amb-4)*3+N(0,10)),0,70); } return p.mlb; }
function mlbHype(){ if(period()!=='season'||G.day<G.cal.open+30)return; const cands=[]; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.age>31||ovr(p)<60)continue; const h=seasonTotal(p,G.year,'1군'); if(!h||(p.isP?h.outs<120:h.pa<150))continue; const w=warOf(h,p); if(w<2.5)continue; cands.push({p,w}); }
  if(!cands.length||R()>.45)return; cands.sort((a,b)=>b.w-a.w); const mine=cands.filter(x=>x.p.team===G.user); const x=mine.length&&R()<.5?mine[0]:pick(cands.slice(0,5)); const p=x.p; mlbOf(p);
  if(p.hyp&&p.hyp>G.day-30)return; p.hyp=G.day; const d=ri(4,9); p.mlb=clamp(p.mlb+d,0,100);
  const T=[`메이저리그 스카우트 ${ri(4,12)}명, ${p.name} 경기에 집결`,`"${p.name}, 지금 당장 메이저리그 통한다" 현지 전문가 평가`,`${p.name} 측 "해외 진출, 언젠가는 도전하고 싶다"`,`${p.name}, 일본 구단도 영입 리스트에`];
  news('언론',pick(T),`${posLabel(p)} ${p.name}의 활약에 해외 구단들의 관심이 커지고 있습니다. 서비스 연차 ${p.svc}년${p.svc>=7?'으로 포스팅 자격이 있습니다':`, 포스팅 자격(7년)까지 ${7-p.svc}년 남았습니다`}.`,p.team===G.user?0:0,{ref:p.id});
  if(p.team===G.user)p.mor=clamp((p.mor??60)+1,0,100); }
/* 비시즌: 포스팅 요청 */
function postingSeason(){ G.posting=G.posting||[]; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.joinY>G.year||p.faC&&p.yrs>1)continue; if(p.svc<7||p.age>32||ovr(p)<60)continue; mlbOf(p);
    const want=p.mlb>=55||(p.postPromise===G.year); if(!want)continue; if(G.posting.some(x=>x.pid===p.id&&x.y===G.year))continue;
    if(p.team!==G.user){ const t=team(p.team); const allow=R()<(t.mode==='rebuild'?.75:.5); if(allow)postStart(p); else { p.mlb=clamp(p.mlb+5,0,100); } continue; }
    const promised=p.postPromise===G.year; const asked=(p.postAsk||0);
    evNew('post',`${p.name} 포스팅 요청`,`${p.name}(${posLabel(p)}, ${p.age}세, 서비스 ${p.svc}년)이(가) 메이저리그 도전을 위해 포스팅을 요청했습니다.${promised?' 지난해 "1년 뒤 보내 주겠다"고 약속했습니다.':asked?` 작년에도 요청했다가 거절당했습니다(${asked}회).`:''} 언론은 연일 해외 진출 가능성을 다루고 있습니다.`,
      [{l:'포스팅 허락',fx:'12월 중순 결과가 나옵니다. 계약이 성사되면 포스팅 비용(계약 보장액의 약 20%)을 받고 선수는 떠납니다. 무산되면 남습니다.'},
       {l:'1년 뒤 보내 주겠다고 약속',fx:'기분이 조금 오르고 올해는 남습니다. 내년에 약속을 어기면 크게 실망하고 팬·언론도 비판합니다.'},
       {l:'거절',fx:`기분이 크게 떨어집니다${asked?' (두 번째 거절이라 더 크게)':''}. 팬 여론은 갈리고 언론은 비판적입니다.`}],{ref:p.id,face:p.id,from:p.name,data:{pid:p.id,promised},def:promised?0:2,exp:12}); } }
EVH.post={ pick(e,i){ const p=G.players[e.data.pid]; if(!p)return ''; if(p.team!==G.user||G.unemp)return `${p.name}은(는) 이제 우리 선수가 아닙니다.`; prInit();
    if(i===0){ postStart(p); return `${p.name} 포스팅을 신청했습니다. 12월 중순에 결과가 나옵니다.`; }
    if(i===1){ if(e.data.promised){ p.mor=clamp((p.mor??60)-25,0,100); G.pr.fan=clamp(G.pr.fan-3,0,100); G.pr.press=clamp(G.pr.press-4,0,100); news('언론',`${tshort(G.user)}, ${p.name}과의 약속 또 미뤄`,'약속을 어겼다는 비판이 나옵니다.',-3,{ref:p.id}); return '약속을 또 미뤘습니다. 기분 -25, 팬 여론 -3, 언론 -4.'; }
      p.postPromise=G.year+1; p.mor=clamp((p.mor??60)+3,0,100); return `${p.name}에게 내년 포스팅을 약속했습니다. 기분 +3.`; }
    p.postAsk=(p.postAsk||0)+1; const d=e.data.promised?28:p.postAsk>=2?20:14; p.mor=clamp((p.mor??60)-d,0,100); G.pr.press=clamp(G.pr.press-(e.data.promised?5:2),0,100); G.pr.fan=clamp(G.pr.fan-(e.data.promised?3:0),0,100);
    news('언론',`${tshort(G.user)}, ${p.name} 포스팅 불허`,e.data.promised?'약속을 뒤집었다는 비판이 거셉니다.':'구단은 전력 유지를 택했습니다.',e.data.promised?-3:-1,{ref:p.id}); return `포스팅을 거절했습니다. 기분 -${d}.`; } };
function postStart(p){ G.posting=G.posting||[]; G.posting.push({pid:p.id,y:G.year,tid:p.team,day:Math.max(G.day+20,KD(12,12)),done:false}); wire('해외',`${tname(p.team)} ${p.name}, 포스팅 신청`,{tid:p.team,ref:p.id}); delete p.postPromise; }
/* 포스팅 결과: 능력이 높을수록 MLB 계약 가능성이 크다 */
function postFee(amtTot){ const a=amtTot; const f=Math.min(a,2500)*.2+Math.max(0,Math.min(a,5000)-2500)*.175+Math.max(0,a-5000)*.15; return Math.round(f); }
function ovsDaily(){ for(const x of G.posting||[]){ if(x.done||G.day<x.day)continue; x.done=true; const p=G.players[x.pid]; if(!p||p.team!==x.tid)continue; const o=ovr(p);
    const pm=o>=68?.9:o>=64?.6:o>=61?.3:.1; let lg=null; if(R()<pm)lg='MLB'; else if(R()<(o>=60?.35:.1))lg='NPB';
    if(!lg){ x.res='무산'; p.mor=clamp((p.mor??60)-5,0,100); p.mlb=clamp(p.mlb-15,0,100); wire('해외',`${p.name} 포스팅 무산, ${tshort(x.tid)} 잔류`,{tid:x.tid,ref:p.id}); if(x.tid===G.user)note('선수',`${p.name}의 포스팅이 무산됐습니다. 계약을 제시한 구단이 없었습니다. 선수는 남습니다(기분 -5).`,p.id); continue; }
    const yrs=lg==='MLB'?(o>=70?ri(4,6):o>=66?ri(2,4):ri(1,2)):ri(2,3); const amt=Math.round(lg==='MLB'?clamp((o-58)*90+N(0,80),100,2500):clamp((o-55)*45+N(0,30),80,600)); const fee=usd(postFee(amt*yrs)); x.res=lg;
    team(x.tid).cash+=fee; if(x.tid===G.user){ G.ovsIncome=(G.ovsIncome||0)+fee; }
    ovsLeave(p,lg,pick(lg==='MLB'?MLBT:NPBT),yrs,amt,'포스팅',fee); } }
/* 해외 FA: 9시즌을 채운 FA 선수는 해외로 갈 수 있다 */
function ovsFA(pool){ for(const id of [...pool]){ const p=G.players[id]; if(!p||p.foreign||p.svc<9||p.age>33)continue; const o=ovr(p); if(o<61)continue; mlbOf(p);
    if(R()<p.mlb/100*(o>=66?.8:.45)){ const lg=o>=65&&R()<.7?'MLB':'NPB'; const yrs=ri(1,3); const amt=Math.round(lg==='MLB'?clamp((o-58)*80,100,2000):clamp((o-55)*40,80,500)); ovsLeave(p,lg,pick(lg==='MLB'?MLBT:NPBT),yrs,amt,'해외 FA'); const i=pool.indexOf(id); if(i>=0)pool.splice(i,1); } } }
/* 해외파의 한 해: 그 리그 수준으로 기록을 만들고, 계약이 끝나면 일부는 돌아온다 */
function abroadYear(){ for(const a of G.abroad||[]){ if(a.back||a.foreign)continue; let p; try{ p=JSON.parse(a.pj); }catch(e){ continue; } if(!p)continue;
    const b=a.lg==='MLB'?-6:-2; const ok=ovr(p)>=(a.lg==='MLB'?62:57); const line=p.isP?simPit(p,ok?ri(200,500):ri(30,150),b):simBat(p,ok?ri(250,560):ri(40,160),b); line.y=G.year; line.lvl=ok?a.lg:(a.lg==='MLB'?'트리플A':'NPB 2군'); a.lines.push(line);
    try{ develop(p); }catch(e){} a.age=p.age; /* develop가 나이를 올린다(전에는 한 번 더 올려 해외에서 1년에 두 살씩 먹었다) */ a.pj=JSON.stringify(p); const yrsIn=G.year-a.y;
    if(yrsIn>=a.yrs&&(!ok||p.age>=33||R()<.45)){ a.back=true; a.backY=G.year; a.pj=null; p.devY=G.year; /* 올해 성장·나이는 해외에서 이미 적용: 새해에 한 번 더 하지 않는다 */ p.svc=(p.svc||0)+yrsIn; G.players[p.id]=p; p.team=a.from; p.sal=round5(Math.max(marketSal(ovr(p)),p.sal)); p.yrs=ri(1,3); p.cyrs=p.yrs; p.faC=true; p.ext=false; p.joinY=undefined; p.mor=70; delete p.ovsOffer; story(p,`${a.lg} 생활을 마치고 ${tname(a.from)} 복귀`,'move');
      wire('해외',`${p.name}, ${a.lg} ${yrsIn}년 마치고 ${tshort(a.from)} 복귀`,{tid:a.from,ref:p.id}); mvLog('해외 복귀',p,null,a.from,`${a.lg} ${yrsIn}년 · 연 ${money(p.sal)}`,p.sal*p.yrs); if(a.from===G.user)news('선수',`${p.name}, 친정 복귀`,`${a.lg}에서 ${yrsIn}년을 뛰고 돌아왔습니다. 연봉 ${money(p.sal)} · ${p.yrs}년 계약.`,2,{ref:p.id,fanW:1.5}); } } }
/* 대체 외국인 관찰 명단 */
function fwatchOn(id){ G.fwatch=G.fwatch||[]; return G.fwatch.some(w=>w.id===id); }
function fwatchToggle(id){ G.fwatch=G.fwatch||[]; if(fwatchOn(id)){ const w=G.fwatch.find(x=>x.id===id); if(w&&w.auto)(G.fwNo=G.fwNo||[]).push(id); G.fwatch=G.fwatch.filter(x=>x.id!==id); return '관찰 명단에서 뺐습니다.'; } if(G.fwatch.length>=8)return '관찰 명단은 8명까지입니다.'; G.fwatch.push({id,since:G.day,k:0}); return '관찰 명단에 올렸습니다. 매주 스카우트 보고가 쌓여 평가가 정확해집니다.'; }
function fwatchK(id){ const w=(G.fwatch||[]).find(x=>x.id===id); return w?w.k:0; }
function fwatchWeek(){ G.fwatch=G.fwatch||[]; const out=[];
  for(const w of G.fwatch){ const p=G.players[w.id]; if(!p||p.team!=null){ if(p&&p.team!=null&&p.team!==G.user)out.push(`${p.name}은(는) ${tshort(p.team)}와(과) 계약했습니다`); w.gone=true; continue; }
    const r=origOf(p); const isc=G.scouts.find(s=>s.role==='intl'&&s.region===r); w.k=clamp(w.k+3+intlLv(r)*3+(isc?isc.skill*2:0),0,100);
    if(period()==='season'){ const gone=R()<(p.age<=29&&ovr(p)>=60?.03:.015); if(gone){ const lg=R()<.6?'MLB 콜업':'NPB 계약'; out.push(`${p.name}이(가) ${lg}(으)로 후보에서 빠졌습니다`); w.gone=true; G.fmarket=(G.fmarket||[]).filter(x=>x!==p.id); delete G.players[p.id]; continue; }
      const LA=LG_ADJ[p.prevLvl]||[r==='jp'?-1:r==='la'?4:2,r==='jp'?-1:r==='la'?4:2]; const add=p.isP?simPit(p,ri(9,21),LA[1]):simBat(p,ri(14,26),LA[0]); /* 올해 기록도 그 리그 수준대로 */ const n=p.now&&p.now.y===G.year?p.now:(p.now={y:G.year,lvl:p.prevLvl}); for(const k in add)if(typeof add[k]==='number')n[k]=(n[k]||0)+add[k]; } }
  G.fwatch=G.fwatch.filter(w=>!w.gone);
  /* 스카우트 자동 관찰: 빈자리가 있으면 감독이 원하는 유형(없으면 우리 팀에 필요한 유형) 후보를 주 1~2명씩 올린다(자동 3명까지) */
  try{ if(!G.unemp&&(foreignOpen()||period()==='season')&&G.fwatch.length<8&&G.fwatch.filter(w=>w.auto).length<3){ const W=mgrWantForeign(); const need=fNeed(G.user); const on=new Set(G.fwatch.map(w=>w.id).concat(G.fwNo||[]));
    const C=(G.fmarket||[]).map(id=>G.players[id]).filter(q=>q&&q.team==null&&!on.has(q.id)&&fKnows(G.user,q)&&(q.foreign==='용병'||(need&&need.kind==='아시아')));
    const fit=q=>(W&&mgrFitF(q,W)?2:0)+(need&&need.isP!=null&&q.isP===need.isP?1:0)+(need&&need.kind==='아시아'&&q.foreign==='아시아'?1:0); const val=q=>{ const r=scoutReport(q); return (r.ofp??((r.cur??40)+3))+(r.cur??40)*.3; };
    const pickL=C.filter(q=>fit(q)>0).sort((a,b)=>fit(b)-fit(a)||val(b)-val(a)).slice(0,Math.min(2,3-G.fwatch.filter(w=>w.auto).length,8-G.fwatch.length));
    if(pickL.length){ for(const q of pickL)G.fwatch.push({id:q.id,since:G.day,k:0,auto:true}); mail('스카우트팀장','관찰 명단에 후보를 올렸습니다',`${pickL.map(q=>`${q.name}(${posLabel(q)}, ${q.nat||''}, ${q.age}세 · 요구 ${Math.round(q.ask/USD)}만 달러)`).join('\n')}\n\n${W&&W.want?'감독이 원하는 유형':'우리 팀에 필요한 유형'}이라 지켜보겠습니다. 매주 보고가 쌓이면 평가가 정확해집니다. 필요 없으면 관찰 명단에서 빼 주세요(스카우트가 올린 후보는 3명까지).`,{kind:'외국인',acts:[{l:'관찰 명단',a:'go',v:'transfer:watch'}]}); } } }catch(e){}
  if(out.length)mail('스카우트팀장','관찰 명단 변동',out.join('.\n')+'.',{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]});
  // 우리 외국인이 흔들리면 대체 후보를 올린다
  if(period()!=='season'||G.day>foreignDL()||G.day<G.cal.open+30||fReplLeft(G.user)<=0)return; for(const p of foreignOf(G.user)){ const h=seasonTotal(p,G.year,'1군'); const bad=p.injOut>=30||(h&&(p.isP?(h.outs>=90&&pRate(h).era>5.6):(h.pa>=120&&bRate(h).ops<.680)));
    if(!bad||p.fwarn===G.year*100+dobj(G.day).m)continue; p.fwarn=G.year*100+dobj(G.day).m; const alt=(G.fwatch||[]).map(w=>G.players[w.id]).filter(q=>q&&q.isP===p.isP&&q.foreign===p.foreign);
    mail('스카우트팀장',`${p.name} 교체 검토`,`${p.name}이(가) ${p.injOut>=30?`부상으로 약 ${p.injOut}일 빠집니다`:'부진합니다'}. ${alt.length?`관찰 명단의 ${p.isP?'투수':'타자'} 후보: ${alt.map(q=>q.name).join(', ')}.`:'관찰 명단에 같은 유형 후보가 없습니다. 외국인 시장에서 후보를 관찰 명단에 올려 두세요.'}`,{imp:!!alt.length,kind:'외국인',ref:p.id,acts:[...alt.slice(0,2).map(q=>({l:`${q.name} 보기`,a:'player',v:q.id})),{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); } }

/* 상대 구단이 눈여겨보는 우리 선수: 그 팀 약한 자리에 맞고 그 팀 눈에 값어치가 큰 선수 3명. 매주 바뀐다 */
let _intC={};
function aiInterest(tid){ if(tid===G.user||!G.teams[tid])return []; const wk=G.year*100+Math.floor(G.day/7); const n=Object.values(G.players).filter(p=>p.team===G.user).length; const k=wk+':'+n+':'+(G.trades||[]).length;
  if(_intC[tid]&&_intC[tid].k===k)return _intC[tid].v; const t=team(tid); let weak=[]; try{ weak=teamNeeds(tid).weak||[]; }catch(e){}
  const v=domestic(G.user).filter(p=>!p.ys&&!(p.joinY>G.year)&&healthy(p)).map(p=>{ const val=tval(t,p,'in'); const fit=weak.includes(pSlot(p))?1.35:1; return {id:p.id,s:val*fit+hn('int'+tid+':'+wk,p.id)*.6}; }).filter(x=>x.s>.6).sort((a,b)=>b.s-a.s).slice(0,3).map(x=>x.id);
  _intC[tid]={k,v}; return v; }
function interestKnown(tid){ return team(tid).rel>=35; }

function interestWhy(tid,p){ const w=[]; let weak=[]; try{ weak=teamNeeds(tid).weak||[]; }catch(e){} if(weak.includes(pSlot(p)))w.push(`${SLOTK[pSlot(p)]} 보강`); const tr=gmTrait(tid);
  if(tr==='prospect'&&p.age<=24)w.push('유망주 선호'); if(tr==='miser'&&p.sal<=150)w.push('싼 연봉'); if(tr==='gambler'&&ovr(p)>=60)w.push('즉시 전력'); if(teamCtx(team(tid)).contend&&ovr(p)>=55)w.push('우승 경쟁용'); if(!teamCtx(team(tid)).contend&&p.age<=25)w.push('리빌딩 자원'); return w.slice(0,2).join(' · ')||'전력 보강'; }

