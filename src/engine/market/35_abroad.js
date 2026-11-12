/* ===== 해외 진출: 외국인 역수출 · 국내 선수 포스팅/해외 FA · 해외파 추적 ===== */
const MLBT=['뉴욕','LA','시카고','보스턴','시애틀','샌디에이고','텍사스','토론토','애리조나','디트로이트'], NPBT=['도쿄','오사카','후쿠오카','요코하마','나고야','센다이','삿포로','히로시마'];
const usd=m=>Math.round(m*USD); // 만 달러 → 게임 금액
function seasonWar(p,y){ const h=seasonTotal(p,y??G.year,'1군'); return h?warOf(h,p):0; }
/* 외국인: 잘하면 MLB·NPB가 데려간다 */
function fOverseas(){ for(const p of Object.values(G.players)){ if(!p.foreign||p.team==null||p.joinY>G.year)continue; const w=seasonWar(p); if(w<3.5||p.age>=35)continue;
    const mlb=p.foreign==='용병'&&p.age<=32&&w>=5.5&&R()<.35+Math.min(.25,(w-5.5)*.08), npb=!mlb&&R()<(p.foreign==='아시아'?.45:.22)+(w>=5?.2:0); if(!mlb&&!npb)continue;
    const lg=mlb?'MLB':'NPB'; const yrs=mlb?ri(1,2):ri(1,3); const amt=Math.round(mlb?clamp(150+(w-5)*120+N(0,60),120,900):clamp(120+(w-3.5)*90+N(0,40),100,500)); const club=pick(lg==='MLB'?MLBT:NPBT);
    p.ovsOffer={lg,club,yrs,amt,y:G.year};
    if(p.team!==G.user){ let stay=R()<(lg==='MLB'?.12:.3); if(stay&&p.foreign!=='아시아'){ const oth=sum(foreignOf(p.team).filter(x=>x.foreign==='용병'&&x.id!==p.id).map(fCommit)); const ns=round5(Math.min(Math.max(p.sal*1.35,usd(amt)*.9),fCap(p.team)-oth-(fCommit(p)-p.sal),Math.max(p.sal,200*USD)) /* 본인 인센티브까지 총액 한도에(검수 11-08) */); stay=ns>p.sal; if(stay){ p.sal=ns; p.kept={y:G.year,sal:ns}; } } else if(stay){ p.sal=round5(p.sal+10*USD); p.kept={y:G.year,sal:p.sal}; } if(stay){ wire('외국인',`${tname(p.team)} ${p.name}, ${lg} 제안 뿌리치고 잔류`,{tid:p.team,ref:p.id}); delete p.ovsOffer; }
      else { ovsLeave(p,lg,club,yrs,amt,'외국인'); } continue; }
    evNew('fovs',`${p.name}에게 ${lg} 제안`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) 올 시즌 WAR ${w.toFixed(1)}을 기록하자 ${club} 구단(${lg})이 ${yrs}년 총 ${amt*yrs}만 달러 수준을 제시했습니다. 에이전트는 국내 잔류도 열어 두었지만 ${lg==='MLB'?'메이저리그 복귀를 원합니다':'조건이 맞으면 일본으로 가겠다고 합니다'}.`,
      [{l:`잔류 설득 (연봉 ${Math.round(fovsKeepSal(p,{amt})/USD)}만 달러)`,fx:`${lg==='MLB'?'성공 확률이 낮습니다(약 20%)':'성공 확률은 절반 정도입니다'}. 실패하면 연봉 부담 없이 떠납니다. 재계약 선수는 개인 연봉 상한이 없지만 3명 총액 한도는 지켜야 합니다.`},
       {l:'축하하며 보내 준다',fx:'떠납니다. 대체 외국인을 찾아야 합니다.'}],{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id,ks:fovsKeepSal(p,{amt})},def:1,exp:12}); } } /* ks: 버튼에 적은 금액을 그대로 계약한다(그사이 연봉이 바뀌어도: 검수 11-06) */
/* 해외 제안을 받은 외국인 잔류 연봉: 버튼 안내와 실제 계약이 같은 계산 */
function fovsKeepSal(p,o){ return p.foreign==='아시아'?Math.min(asiaReCap(p),round5(p.sal+10*USD)) /* 아시아쿼터 상한(검수 11-07) */:round5(usd(Math.max(p.sal/USD*1.5,o.amt*.85))); }
EVH.fovs={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||!p.ovsOffer)return ''; const o=p.ovsOffer;
    if(i===0){ const asia=p.foreign==='아시아'; const ns=e.data.ks??fovsKeepSal(p,o); /* 버튼에 적은 금액 그대로 */ const yb=foreignOf(G.user).filter(x=>x.foreign==='용병'&&x.id!==p.id); const own=p.opt&&p.ctT===p.team&&p.opt.until>=ctSeason()?(p.opt.a||0):0; const capOk=asia?ns<=asiaReCap(p):sum(yb.map(fCommit))+ns+own<=fCap(G.user); /* 본인 인센티브도 총액에(검수 11-07) */
      if(!capOk)return `외국인 연봉 총액 한도(${money(fCap(G.user))})를 넘어 설득할 수 없습니다. ${ovsLeave(p,o.lg,o.club,o.yrs,o.amt,'외국인')}`;
      const ok=R()<((o.lg==='MLB'?.2:.5)+((p.mor??60)-60)/200)*(asia?.5:1); if(ok){ p.kept={y:G.year,sal:ns,base:p.sal}; p.sal=ns; delete p.ovsOffer; news('선수',`${p.name}, ${o.lg} 제안 뿌리치고 잔류`,`${tshort(G.user)}이(가) 연봉 ${money(ns)}에 붙잡았습니다.`,2,{ref:p.id}); return `설득 성공. 연봉 ${money(ns)}.`; }
      return `설득에 실패했습니다. ${ovsLeave(p,o.lg,o.club,o.yrs,o.amt,'외국인')}`; }
    return ovsLeave(p,o.lg,o.club,o.yrs,o.amt,'외국인'); } };
/* 떠나는 선수를 해외파 명단으로 옮긴다 (국내 선수는 나중에 돌아올 수 있다) */
function ovsLeave(p,lg,club,yrs,amt,how,fee){ const from=p.team??p.faFrom; G.abroad=G.abroad||[]; termsClear(p); delete p.newSal; delete p.hold; delete p.extNext; /* 출국 전 맺어 둔 다음 시즌 계약도 끝(복귀 계약과 겹치지 않게, 검수 11-07) */ mvLog('해외 진출',p,from,null,`${how} · ${club}(${lg}) ${yrs}년 총 ${amt*yrs}만 달러${fee?' · 포스팅 비용 '+money(fee):''}`); /* 이적 기록을 먼저: 복귀용 보관본에 출국일이 남게(검수 11-07) */ /* 출국 전 미확정 연봉 산정안은 보관본에 남기지 않는다(검수 11-06: 복귀 계약 뒤 옛 산정안이 되살아났다) */ if(!p.foreign)p.ovsY=G.year; p.e1=false; /* 해외로 가면 국내 1군 등록도 끝난다(복귀 계약에 따라오지 않게, 검수 11-06) */ /* 해외 진출 이력: 돌아온 뒤 다시 포스팅 대상이 되지 않게 */ /* 해외로 가면 국내 계약 조건은 끝난다(돌아와도 되살아나지 않게) */
  const rec={id:p.id,name:p.name,isP:p.isP,pos:posLabel(p),foreign:p.foreign||null,from,lg,club,how,yrs,amt,y:G.year,y1:dobj(G.day).m>=9||(how==='고교 직행'||how==='대졸 직행')?G.year+1:G.year, /* 고교 직행은 졸업 뒤 다음 해부터(검수 11-09c) */age:p.age,lines:[],fee:fee||0,back:false,d:G.day, /* y1: 첫 해외 시즌(국내 시즌을 마치고 가을·겨울에 떠나면 다음 해부터) */pj:p.foreign?null:JSON.stringify(p)};
  G.abroad.unshift(rec); while(G.abroad.length>120){ let i=-1; for(let j=G.abroad.length-1;j>=0;j--)if(G.abroad[j].back||G.abroad[j].foreign){ i=j; break; } G.abroad.splice(i>=0?i:G.abroad.length-1,1); } /* 넘치면 이미 돌아온 기록부터 지운다(아직 해외에 있는 선수가 사라지지 않게) */
  for(const k in G.lineup)if(G.lineup[k]===p.id)delete G.lineup[k]; if(G.fa&&G.fa.pool)G.fa.pool=G.fa.pool.filter(x=>x!==p.id); dropP(p.id);
  const t=`${p.name}, ${club} 구단(${lg})과 ${yrs}년 계약${how==='포스팅'?` · 포스팅 비용 ${money(fee)}`:''}`; wire(lg==='MLB'?'해외':'해외',t,{tid:from});
  try{ featAdd('ovs',null,`${p.name} ${how==='외국인'?'역수출':'해외 진출'} · ${club}(${lg}) ${yrs}년 ${amt*yrs}만 달러`,{tid:from,name:p.name,maj:lg==='MLB'}); }catch(e){}
  if(from===G.user&&how==='포스팅'){ try{ story(p,`${club}(${lg}) 입단 · 포스팅`,'move'); G.pr.fan=clamp(G.pr.fan+1,0,100); news('선수',`${p.name} 고별 기자회견 "이 유니폼이 나를 키웠다"`,`${p.name}이(가) ${tshort(from)} 팬들에게 작별 인사를 했습니다. "언젠가 다시 이 구장에 서겠다"는 말에 박수가 쏟아졌습니다. 구단은 꿈을 응원한 구단으로 남습니다.`,2,{}); }catch(e){} }
  if(from===G.user){ news('선수',`${p.name}, ${lg} 진출 확정`,`${club} 구단과 ${yrs}년 총 ${amt*yrs}만 달러에 계약했습니다.${fee?` 구단은 포스팅 비용 ${money(fee)}을 받습니다.`:''}`,1,{fanW:.5}); }
  return `${p.name}이(가) ${club}(${lg})로 떠납니다.`; }
/* 국내 선수의 메이저리그 꿈: 야망 + 활약 + 언론 */
function mlbOf(p){ if(p.mlb==null){ initPers(p); p.mlb=clamp(Math.round((p.pers.amb-4)*3+N(0,10)),0,70); } return p.mlb; }
function mlbHype(){ if(period()!=='season'||G.day<G.cal.open+30)return; const cands=[]; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||milServing(p)||p.age>31||ovr(p)<60)continue; const h=seasonTotal(p,G.year,'1군'); if(!h||(p.isP?h.outs<120:h.pa<150))continue; const w=warOf(h,p); if(w<2.5)continue; cands.push({p,w}); }
  if(!cands.length||R()>.45)return; cands.sort((a,b)=>b.w-a.w); const mine=cands.filter(x=>x.p.team===G.user); const x=mine.length&&R()<.5?mine[0]:pick(cands.slice(0,5)); const p=x.p; mlbOf(p);
  if(p.hyp&&p.hyp>G.day-30)return; p.hyp=G.day; const d=ri(4,9); p.mlb=clamp(p.mlb+d,0,100);
  const T=[`메이저리그 스카우트 ${ri(4,12)}명, ${p.name} 경기에 집결`,`"${p.name}, 지금 당장 메이저리그 통한다" 현지 전문가 평가`,`${p.name} 측 "해외 진출, 언젠가는 도전하고 싶다"`,`${p.name}, 일본 구단도 영입 리스트에`];
  news('언론',pick(T),`${posLabel(p)} ${p.name}의 활약에 해외 구단들의 관심이 커지고 있습니다. 서비스 연차 ${p.svc}년${ovsBeen(p)?'이지만 해외 진출 이력이 있어 포스팅 대상이 아닙니다':p.svc>=7?(postDone(p)?'이고 FA 계약 이력이 있어 선수가 먼저 포스팅을 요청할 수는 없지만, 구단이 동의하면 포스팅할 수 있습니다':'으로 포스팅 자격이 있습니다'):`, 포스팅 자격(7년)까지 ${7-p.svc}년 남았습니다`}.`,p.team===G.user?0:0,{ref:p.id});
  if(p.team===G.user)p.mor=clamp((p.mor??60)+1,0,100); }
/* 비시즌: 포스팅 요청 */
const ovsBeen=p=>p.ovsY!=null||p.retFrom!=null||(G.abroad||[]).some(a=>a.id===p.id); /* 해외 이력: 구단 주도 포스팅도 막힌다(postGMWhy) */
const postDone=p=>!!((p.faC&&!p.ext)||p.faN||p.lastFA!=null||p.ovsY!=null||p.retFrom!=null||(G.abroad||[]).some(a=>a.id===p.id));
function postingSeason(){ G.posting=G.posting||[]; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.joinY>G.year||milServing(p))continue; /* 군 복무 중에는 해외에 나갈 수 없다(검수 11-06) */ if(p.postPromise&&p.postPromiseT!=null&&p.postPromiseT!==p.team){ delete p.postPromise; delete p.postPromiseT; } /* 약속은 약속한 구단만 지킨다(이적하면 끝). 자격 검사보다 먼저 지운다(검수 11-06) */ if(postDone(p))continue; /* KBO 포스팅은 FA 자격 전 보류 선수만: FA 계약을 한 적 있거나 해외에 다녀온 선수는 대상 아님(비FA 다년계약 ext는 FA 이력이 아님) */ if(p.faC&&p.yrs>1&&p.postPromise!==G.year)continue; /* 포스팅을 약속한 해에는 다년계약을 맺었어도 약속을 확인한다(조용히 넘어가지 않게) */ if(p.postPromise!==G.year&&(p.svc<7||p.age>32||ovr(p)<60))continue; mlbOf(p);
    const want=p.mlb>=55||(p.postPromise===G.year); if(!want)continue; if(G.posting.some(x=>x.pid===p.id&&x.y===G.year&&!x.void))continue;
    if(p.team!==G.user||G.unemp){ const t=team(p.team); const allow=R()<(t.mode==='rebuild'?.75:.5); if(allow)postStart(p); else { p.mlb=clamp(p.mlb+5,0,100); } continue; }
    const promised=p.postPromise===G.year; const asked=(p.postAsk||0);
    evNew('post',`${p.name} 포스팅 요청`,`${p.name}(${posLabel(p)}, ${p.age}세, 서비스 ${p.svc}년)이(가) 메이저리그 도전을 위해 포스팅을 요청했습니다.${promised?' 지난해 "1년 뒤 보내 주겠다"고 약속했습니다.':asked?` 작년에도 요청했다가 거절당했습니다(${asked}회).`:''} 언론은 연일 해외 진출 가능성을 다루고 있습니다.`,
      [{l:'포스팅 허락',fx:`${dmd(postDay())}에 결과가 나옵니다.`+' 계약이 성사되면 포스팅 비용(계약 보장액의 약 20%)을 받고 선수는 떠납니다. 무산되면 남습니다.'},
       {l:'1년 뒤 보내 주겠다고 약속',fx:'기분이 조금 오르고 올해는 남습니다. 내년에 약속을 어기면 크게 실망하고 팬·언론도 비판합니다.'},
       {l:'거절',fx:`기분이 크게 떨어집니다${asked?' (두 번째 거절이라 더 크게)':''}. 팬 여론은 갈리고 언론은 비판적입니다.`}],{ref:p.id,face:p.id,from:p.name,data:{pid:p.id,promised,day:postDay()} /* 안내한 발표일 그대로(검수 11-07) */,def:promised?0:2,exp:12}); } }
EVH.post={ pick(e,i){ const p=G.players[e.data.pid]; if(!p)return ''; if(p.team!==G.user||G.unemp)return `${p.name}은(는) 이제 우리 선수가 아닙니다.`; prInit(); if((G.posting||[]).some(x=>x.pid===p.id&&x.y===G.year&&!x.void))return `${p.name}은(는) 이미 포스팅을 신청했습니다. 이 요청은 정리합니다.`; /* 같은 시즌 이중 신청·신청 뒤 거절 페널티 방지(검수 11-08) */
    if(i===0&&milServing(p))return `${p.name}은(는) 군 복무 중이라 포스팅할 수 없습니다.`;
    if(i===0){ const x=postStart(p,e.data.day); return `${p.name} 포스팅을 신청했습니다. ${dmd(x.day)}에 결과가 나옵니다.`; }
    if(i===1){ if(e.data.promised){ p.mor=clamp((p.mor??60)-25,0,100); G.pr.fan=clamp(G.pr.fan-3,0,100); G.pr.press=clamp(G.pr.press-4,0,100); news('언론',`${tshort(G.user)}, ${p.name}과의 약속 또 미뤄`,'약속을 어겼다는 비판이 나옵니다.',-3,{ref:p.id}); p.postPromise=G.year+1; p.postPromiseT=p.team; return '약속을 또 미뤘습니다(내년으로 다시 약속). 기분 -25, 팬 여론 -3, 언론 -4.'; } /* 약속 연도도 갱신(검수 11-08) */
      p.postPromise=G.year+1; p.postPromiseT=p.team; p.mor=clamp((p.mor??60)+3,0,100); return `${p.name}에게 내년 포스팅을 약속했습니다. 기분 +3.`; }
    p.postAsk=(p.postAsk||0)+1; const d=e.data.promised?28:p.postAsk>=2?20:14; p.mor=clamp((p.mor??60)-d,0,100); G.pr.press=clamp(G.pr.press-(e.data.promised?5:2),0,100); G.pr.fan=clamp(G.pr.fan-(e.data.promised?3:0),0,100);
    news('언론',`${tshort(G.user)}, ${p.name} 포스팅 불허`,e.data.promised?'약속을 뒤집었다는 비판이 거셉니다.':'구단은 전력 유지를 택했습니다.',e.data.promised?-3:-1,{ref:p.id}); return `포스팅을 거절했습니다. 기분 -${d}.`; } };
function postDay(){ return Math.max(G.day+20,KD(12,12)); } /* 결과 발표일: 안내 문구와 실제 처리일이 같은 계산 */
function postStart(p,day){ G.posting=G.posting||[]; const x={pid:p.id,y:G.year,tid:p.team,day:day!=null&&day>G.day?day:postDay(), /* 요청 때 안내한 발표일(검수 11-07) */done:false}; G.posting.push(x); wire('해외',`${tname(p.team)} ${p.name}, 포스팅 신청`,{tid:p.team,ref:p.id}); if(p.team===G.user&&!G.unemp)news('선수',`${p.name}, 메이저리그 도전 공식화 · 포스팅 공시`,`${tname(p.team)}이(가) ${p.name}의 포스팅을 신청했습니다. 공시 뒤 협상 기간이 열리고 ${dmd(x.day)}에 결과가 나옵니다. 팬들은 아쉬움과 응원을 함께 보내고 있습니다.`,1,{ref:p.id}); delete p.postPromise; delete p.postPromiseT; return x; }
/* 포스팅 결과: 능력이 높을수록 MLB 계약 가능성이 크다 */
function postFee(amtTot){ const a=amtTot; const f=Math.min(a,2500)*.2+Math.max(0,Math.min(a,5000)-2500)*.175+Math.max(0,a-5000)*.15; return Math.round(f); }
/* 해외 복귀 협상 정리: 우리 구단 몫이 아니거나(이직·야인) 결정할 이벤트가 없이 기한이 지난 선수는 원소속 구단(AI) 판단으로 끝낸다(예전에 꼬여 저장된 선수 복구 포함) */
function ovsBackSweep(){ for(const p of Object.values(G.players)){ if(!p.retAsk)continue; if(p.retFrom!==G.user||G.unemp){ ovsBackAI(p); continue; } const live=(G.evs||[]).some(e=>!e.done&&e.k==='ovsback'&&e.data&&e.data.pid===p.id); if(!live&&G.day>(p.retAsk.exp||0))ovsBackFree(p,'해외 복귀 우선협상 기한 만료'); } }
function ovsDaily(){ try{ ovsBackSweep(); }catch(e){} for(const x of G.posting||[]){ if(x.done||G.day<x.day)continue; x.done=true; const p=G.players[x.pid]; if(!p||p.team!==x.tid||milServing(p)){ x.res='취소'; x.void=true; if(p&&x.tid===G.user&&!G.unemp)note('운영팀',`${p.name}의 포스팅 신청이 ${p.team!==x.tid?`${tname(p.team)}(으)로 옮겨`:'군 복무로'} 무효가 됐습니다.`,p.id); continue; } /* 신청 뒤 이적·이탈: 신청 무효(새 구단이 다시 신청할 수 있게) */ const o=ovr(p);
    const pm=o>=68?.9:o>=64?.6:o>=61?.3:.1;
    /* 제안 목록: MLB·NPB 구단별 기간·연봉(만 달러). 선수는 MLB 꿈(mlb)과 금액을 보고 고르거나 모두 거절한다(커뮤니티 요청 11-07: 금액·거절 사유·리그를 보여 달라) */
    const A=ovsAgeT(p.age); const offs=[]; { const nM=R()<pm*A.m?1+(R()<pm*.6?1:0)+(R()<pm*.3?1:0):0, nN=R()<(o>=60?.45:.15)*A.n?1+(R()<.3?1:0):0; const used=new Set(); const club=L=>{ let c; do c=pick(L); while(used.has(c)&&used.size<L.length); used.add(c); return c; };
      for(let i=0;i<nM;i++){ const yrs=Math.min(A.y,o>=70?ri(4,6):o>=66?ri(2,4):ri(1,2)); offs.push({lg:'MLB',club:club(MLBT),yrs,amt:Math.round(clamp(((o-58)*90+N(0,80))*A.f,100,2500)),minor:(o<62||p.age>=34)&&R()<.5}); }
      for(let i=0;i<nN;i++)offs.push({lg:'NPB',club:club(NPBT),yrs:Math.min(A.y,ri(2,3)),amt:Math.round(clamp(((o-55)*45+N(0,30))*(p.age>=34?.8:1),80,600))}); }
    const want=mlbOf(p); const ask=Math.round(clamp((o-58)*60*A.f,100,1500)); /* MLB 최소 기대 연봉(나이만큼 눈높이도 낮다) */
    const score=f=>f.amt*f.yrs*(f.lg==='MLB'?1+want/50:1)*(f.minor?.5:1);
    const okF=offs.filter(f=>f.lg==='MLB'?(!f.minor||want>=45)&&f.amt>=ask*(want>=50?.5:.8):want<45).sort((a,b)=>score(b)-score(a)); const best=okF[0]||null;
    const offTxt=offs.length?offs.map(f=>`${f.lg} ${f.club}: ${f.yrs}년 연 ${f.amt}만 달러${f.minor?'(스플릿·마이너 계약)':''}`).join('\n'):'제안 없음';
    const why=!offs.length?'계약을 제시한 구단이 없었습니다.':best?'':offs.every(f=>f.lg==='NPB')?`MLB 제안이 없었고, 선수가 일본행은 원하지 않아(메이저리그 의지 ${want}) NPB 제안을 거절했습니다.`:offs.some(f=>f.lg==='MLB'&&f.minor)&&!offs.some(f=>f.lg==='MLB'&&!f.minor)?'MLB 제안이 마이너 계약(스플릿)뿐이라 선수가 거절했습니다.':`제안 금액이 선수 기대(연 ${ask}만 달러 이상)에 못 미쳐 선수가 거절했습니다.`;
    x.offs=offs; x.why=why;
    if(!best){ x.res=offs.length?'선수 거절':'무산'; p.mor=clamp((p.mor??60)-(offs.length?2:5),0,100); p.mlb=clamp(p.mlb-15,0,100); wire('해외',`${p.name} 포스팅 ${offs.length?'선수가 제안 거절':'무산'}, ${tshort(x.tid)} 잔류`,{tid:x.tid,ref:p.id}); if(x.tid===G.user)mail('운영팀',`${p.name} 포스팅 ${offs.length?'결과: 선수가 제안을 모두 거절':'무산'}`,`${why}\n\n받은 제안:\n${offTxt}\n\n선수는 우리 구단에 남습니다(기분 ${offs.length?-2:-5}).`,{kind:'해외',ref:p.id}); continue; }
    const lg=best.lg, yrs=best.yrs, amt=best.amt; const fee=usd(postFee(amt*yrs)); x.res=lg; x.club=best.club;
    if(x.tid===G.user&&!G.unemp)mail('운영팀',`${p.name} 포스팅 결과: ${lg} ${best.club} 선택`,`받은 제안:\n${offTxt}\n\n${p.name}은(는) ${best.club}(${lg})의 ${yrs}년 연 ${amt}만 달러 제안을 골랐습니다${lg==='MLB'&&want>=50?'(메이저리그 의지가 강해 금액보다 리그를 먼저 봤습니다)':''}. 구단은 포스팅 비용 ${money(fee)}을 받습니다.`,{kind:'해외',ref:p.id});
    if(x.tid===G.user&&!G.unemp){ G.ovsIncome=(G.ovsIncome||0)+fee; G.spend.postIn=(G.spend.postIn||0)+fee; note('재정',`${p.name} 포스팅 비용 ${money(fee)}은 이번 결산 때 '포스팅 수입'으로 들어옵니다(지금 현금에는 바로 더해지지 않음). 재정 > 예산에서 확인할 수 있습니다.`,p.id); } /* 카페 문의: 안내가 없어 안 들어온 줄 앎 */ else team(x.tid).cash+=fee; /* 우리 구단 포스팅 수입은 그 시즌 결산(재정 화면 '포스팅 수입' 줄)으로 들어간다 */
    ovsLeave(p,lg,best.club,yrs,amt,'포스팅',fee); } }
/* 나이별 해외 계약(카페 11-09c: 38세가 MLB 4년 3천만 달러). 실제 사례 기준: 20대 중반 최대 6년, 29세 4년, 31세 2년, 33~34세 1년(스플릿 포함), 35세 1년. 37세 넘어 국내에서 해외로 간 사례는 없다.
   y: 최대 연수, f: MLB 연봉 배율, m·n: MLB·NPB 응찰 확률 배율 */
function ovsAgeT(age){ return age<=27?{y:6,f:1,m:1,n:1}:age<=29?{y:5,f:.95,m:1,n:1}:age<=31?{y:3,f:.85,m:.9,n:1}:age<=33?{y:2,f:.65,m:.6,n:.9}:age<=36?{y:1,f:.45,m:.3,n:.5}:{y:1,f:.4,m:0,n:0}; }
/* 해외 FA: 9시즌을 채운 FA 선수는 해외로 갈 수 있다 */
function ovsFA(pool){ for(const id of [...pool]){ const p=G.players[id]; if(!p||p.foreign||p.svc<9||p.age>33||milServing(p))continue; const o=ovr(p); if(o<61)continue; mlbOf(p);
    if(R()<p.mlb/100*(o>=66?.8:.45)){ const lg=o>=65&&R()<.7?'MLB':'NPB'; const A=ovsAgeT(p.age); const yrs=Math.min(A.y,ri(1,3)); const amt=Math.round(lg==='MLB'?clamp((o-58)*80*A.f,100,2000):clamp((o-55)*40,80,500)); ovsLeave(p,lg,pick(lg==='MLB'?MLBT:NPBT),yrs,amt,'해외 FA'); const i=pool.indexOf(id); if(i>=0)pool.splice(i,1); } } }
/* 해외파의 한 해: 그 리그 수준으로 기록을 만들고, 계약이 끝나면 일부는 돌아온다 */
function abroadYear(){ for(const a of G.abroad||[]){ if(a.back||a.foreign)continue; const y1=a.y1??a.y+1; if(G.year<y1)continue; /* 아직 해외 시즌을 보내지 않았다(이번 겨울에 떠남) */ if((a.lines||[]).some(l=>l.y===G.year))continue; /* 같은 시즌 기록 두 번 만들지 않기 */ let p; try{ p=JSON.parse(a.pj); }catch(e){ continue; } if(!p)continue;
    const b=a.lg==='MLB'?-6:-2; const ok=ovr(p)>=(a.lg==='MLB'?62:57); const inj=a.d!=null&&!(a.lines||[]).length?Math.max(0,(p.injOut||0)-Math.max(0,dnum(G.year,3,22)-a.d)):(p.injOut||0); const av=clamp(1-inj/365,0,1); /* 첫 시즌은 개막 전까지 지난 재활 기간을 빼고(검수 11-08) */ /* 재활 중인 기간만큼 못 뛴다(검수 11-06) */ const line=p.isP?simPit(p,Math.round((ok?ri(200,500):ri(30,150))*av),b):simBat(p,Math.round((ok?ri(250,560):ri(40,160))*av),b); line.y=G.year; line.lvl=ok?a.lg:(a.lg==='MLB'?'트리플A':'NPB 2군'); a.lines.push(line);
    if(p.injOut>0){ p.injOut=Math.max(0,p.injOut-365); if(!p.injOut)delete p.injK; } delete p.reInj;
    { const t0=p.team; p.team=null; injRecover(p,p.isP?line.outs:line.pa); /* 해외 실전으로 후유증 회복. 아직 해외 소속이라 옛 국내 구단에 알리지 않는다(검수 11-06) */ p.team=t0; } /* 성장·나이는 새해에 국내 선수와 함께(abroadDev) */ a.pj=JSON.stringify(p); const yrsIn=G.year-y1+1;
    const thr=a.lg==='MLB'?62:57, stayP=clamp(.55+(ovr(p)-thr)*.025,.55,.9), early=yrsIn<a.yrs&&!ok&&yrsIn>=1&&R()<.35; /* 계약을 마쳐도 잘하는 선수일수록 더 남고(최대 90%), 자리를 못 잡은 선수는 계약 중에도 방출돼 일찍 돌아온다(커뮤니티 제안 11-11) */
    if(early||(yrsIn>=a.yrs&&(!ok||p.age>=33||R()>=stayP))){ if(early)a.early=1; a.back=true; a.backY=G.year; a.age=p.age; a.pj=null; /* 돌아온 선수는 새해에 국내 선수와 같이 나이를 먹는다 */ p.svc=(p.svc||0)+(a.lines||[]).filter(l=>l.y>=y1&&((l.pa||0)+(l.outs||0))>0).length; /* 해외에서 실제로 뛴 시즌만 연차(검수 11-07: 0타석 시즌도 더함) */ G.players[p.id]=p; if(p.mil&&!p.mil.done&&p.mil.until&&p.mil.until<=G.day)p.mil={done:true,unit:p.mil.unit,pf:p.mil.from,pu:p.mil.until}; /* 해외에 있는 동안 지난 전역일: 복귀 때 전역 처리(검수 11-06) */ p.joinY=undefined; p.mor=70; delete p.ovsOffer;
      /* 복귀 권리와 계약은 나눈다: 원소속 구단이 우선협상(요구 연봉·기간을 보고 계약하거나 거절), 거절하면 자유계약 선수 */
      if(a.from==null){ p.team=null; p.faC=false; p.ext=false; p.ovsWait=G.year+2; story(p,`${a.lg} ${yrsIn}년 마치고 귀국 · ${G.year+2}년 신인 드래프트 도전 예정`,'move'); wire('해외',`${p.name}, ${a.lg} ${yrsIn}년 마치고 귀국 · 2년 유예 뒤 국내 드래프트 도전`,{ref:p.id}); continue; } /* KBO 규약 107조: 국내 구단을 거치지 않고 해외 구단과 계약한 선수는 계약이 끝나고 2년 뒤에 신인 드래프트로만 들어온다(2026 최지만 사례) */
      p.team=null; p.faC=false; p.ext=false; p.retFrom=a.from; p.retAsk={sal:round5(Math.max(marketSal(ovr(p)),p.sal)),yrs:ri(1,3),lg:a.lg,n:yrsIn,exp:G.day+14};
      wire('해외',`${p.name}, ${a.lg} ${yrsIn}년 마치고 국내 복귀 추진 · 원소속 ${tshort(a.from)} 우선협상`,{tid:a.from,ref:p.id});
      if(a.from===G.user&&!G.unemp)ovsBackAsk(p); else ovsBackAI(p); } } }
/* 새해: 해외파도 국내 선수와 같은 날 성장·나이(카페 11-09c: 전에는 가을 해외 시즌 뒤에 먹어 떠난 해 겨울 한 살을 건너뛰고, 31세에 나가 2년 뒤 31세로 돌아왔다).
   해외 리그 환경으로 성장(옛 국내 구단의 시설·감독·코치를 쓰지 않는다) */
function abroadDev(){ for(const a of G.abroad||[]){ if(a.back||a.foreign||!a.pj)continue; let p; try{ p=JSON.parse(a.pj); }catch(e){ continue; } if(!p)continue;
    const t0=p.team; p.team=null; p.ovsEnv=a.lg; try{ develop(p); }catch(e){} p.team=t0; delete p.ovsEnv; a.age=p.age; a.pj=JSON.stringify(p); } }
/* 해외 복귀 선수: 원소속 구단 우선협상 */
function ovsBackSign(p){ const q=p.retAsk; if(!q||p.retFrom==null)return ''; const tid=p.retFrom; p.team=tid; p.sal=q.sal; p.yrs=q.yrs; p.cyrs=q.yrs; p.faC=true; p.ext=false; p.relT=null; p.ctT=tid; p.e1=false; /* 예전 저장본 보관 데이터의 1군 등록 상태도 지운다: 복귀 뒤 등록은 엔트리 조정이 정한다 */ story(p,`${q.lg} 생활을 마치고 ${tname(tid)} 복귀(${q.yrs}년 연 ${money(q.sal)})`,'move');
  mvLog('해외 복귀',p,null,tid,`${q.lg} ${q.n}년 뒤 복귀 · ${q.yrs}년 연 ${money(q.sal)}`,q.sal*q.yrs); wire('해외',`${p.name}, ${tshort(tid)}와 ${q.yrs}년 연 ${money(q.sal)} 복귀 계약`,{tid,ref:p.id}); if(tid===G.user)news('선수',`${p.name}, 친정 복귀`,`${q.lg}에서 ${q.n}년을 뛰고 돌아왔습니다. 연봉 ${money(q.sal)} · ${q.yrs}년 계약.`,2,{ref:p.id,fanW:1.5});
  delete p.retAsk; delete p.retFrom; return `${p.name}과(와) ${q.yrs}년 연 ${money(q.sal)}에 복귀 계약을 했습니다.`; }
function ovsBackFree(p,why){ const tid=p.retFrom; p._retQ=p.retAsk; delete p.retAsk; delete p.retFrom; p.team=null; if(tid!=null){ const B=p.relBan=Object.assign({},p.relBan||{}); B[tid]=G.day+365; } /* 우선협상을 거절한 원소속 구단은 1년 동안 헐값 재계약 불가(우선협상 우회 방지) */ if(p.isP==null)return; const q0=p._retQ; wire('해외',`${p.name}, ${tshort(tid)}와 복귀 계약 불발 · 자유계약 선수로`,{tid,ref:p.id}); try{ toFree(p,why||'해외 복귀 우선협상 불발'); }catch(e){} if(q0){ p.sal=Math.max(p.sal||0,Math.round(q0.sal*.85)); p.retMin={sal:Math.round(q0.sal*.85),until:G.day+120}; } delete p._retQ; } /* 다른 구단도 복귀 요구액에 가깝게 줘야 한다(검수 11-07: 최저연봉 근처 영입) */
function ovsBackAI(p){ const tid=p.retFrom, t=team(tid), q=p.retAsk; const ok=t&&rosterN(tid)<ROSTER_MAX&&(t.cash||0)>-3000&&aiVal(t,p)>=Math.max(.6,q.sal/450)&&(()=>{ const s0=p.sal; p.sal=q.sal; const v=capPayAs(tid,[p.id],[]); p.sal=s0; return v; })()<=capOf(sponSeason())*aiCapMul(t); /* 복귀 연봉으로 상위 40명을 다시 센다(옛 연봉을 빼면 40명 밖 선수도 빠졌다, 검수 11-08) */ if(ok)ovsBackSign(p); else ovsBackFree(p); }
function ovsBackAsk(p){ const q=p.retAsk; const n=rosterN(G.user); let room=''; try{ room=` · 지금 예산 여유 ${money(budget().roomGoal)}`; }catch(e){}
  evNew('ovsback',`${p.name} 해외 복귀: 우선협상`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) ${q.lg} ${q.n}년을 마치고 국내 복귀를 원합니다. 우리 구단이 원소속이라 먼저 협상합니다. 요구: ${q.yrs}년 연 ${money(q.sal)}(현재 능력 ${dv(Math.round(ovr(p)))}). 계약하지 않으면 자유계약 선수가 되어 다른 구단도 데려갈 수 있습니다.`,
    [{l:`계약: ${q.yrs}년 연 ${money(q.sal)}`,fx:`선수단 ${n}/${ROSTER_MAX}명${n>=ROSTER_MAX?' · 정원을 넘어 진행 전에 한 명을 정리해야 합니다':''}${room}`},{l:'계약하지 않음',fx:'자유계약 선수로 풀립니다. 비용은 없습니다.'}],{ref:p.id,face:p.id,from:p.name,data:{pid:p.id},def:1,exp:14}); }
EVH.ovsback={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||!p.retAsk)return '이미 정리된 일입니다.'; if(G.unemp||p.retFrom!==G.user){ ovsBackAI(p); return ''; } if(i===0)return ovsBackSign(p); ovsBackFree(p,'해외 복귀 우선협상: 구단이 계약하지 않음'); return `${p.name}과(와) 계약하지 않았습니다. 자유계약 선수로 풀립니다.`; } };
/* 대체 외국인 관찰 명단 */
function fwatchOn(id){ G.fwatch=G.fwatch||[]; return G.fwatch.some(w=>w.id===id); }
function fwatchToggle(id){ G.fwatch=G.fwatch||[]; if(fwatchOn(id)){ const w=G.fwatch.find(x=>x.id===id); if(w&&w.auto)(G.fwNo=G.fwNo||[]).push(id); G.fwatch=G.fwatch.filter(x=>x.id!==id); return '관찰 명단에서 뺐습니다.'; } if(G.fwatch.length>=8)return '관찰 명단은 8명까지입니다.'; G.fwatch.push({id,since:G.day,k:0}); return '관찰 명단에 올렸습니다. 매주 스카우트 보고가 쌓여 평가가 정확해집니다.'; }
function fwatchK(id){ const w=(G.fwatch||[]).find(x=>x.id===id); return w?w.k:0; }
function fwatchWeek(){ G.fwatch=G.fwatch||[]; const out=[];
  for(const w of G.fwatch){ const p=G.players[w.id]; if(!p||p.team!=null){ if(p&&p.team!=null&&p.team!==G.user)out.push(`${p.name}은(는) ${tshort(p.team)}와(과) 계약했습니다`); w.gone=true; continue; }
    const r=origOf(p); const isc=G.scouts.find(s=>s.role==='intl'&&s.region===r); w.k=clamp(w.k+3+intlLv(r)*3+(isc?isc.skill*2:0),0,100);
    if(period()==='season'){ const gone=!foHeld(p)&&R()<(p.age<=29&&ovr(p)>=60?.03:.015); /* 답을 기다려 주는 기한에는 해외로 빠지지 않는다(검수 11-09b) */ if(gone){ const lg=R()<.6?'MLB 콜업':'NPB 계약'; out.push(`${p.name}이(가) ${lg}(으)로 후보에서 빠졌습니다`); w.gone=true; G.fmarket=(G.fmarket||[]).filter(x=>x!==p.id); dropP(p.id); continue; }
      const LA=LG_ADJ[p.prevLvl]||[r==='jp'?-1:r==='la'?4:2,r==='jp'?-1:r==='la'?4:2]; const add=p.isP?simPit(p,ri(9,21),LA[1]):simBat(p,ri(14,26),LA[0]); /* 올해 기록도 그 리그 수준대로 */ const n=p.now&&p.now.y===G.year?p.now:(p.now={y:G.year,lvl:p.prevLvl}); for(const k in add)if(typeof add[k]==='number')n[k]=(n[k]||0)+add[k]; } }
  G.fwatch=G.fwatch.filter(w=>!w.gone);
  /* 스카우트 자동 관찰: 빈자리가 있으면 감독이 원하는 유형(없으면 우리 팀에 필요한 유형) 후보를 주 1~2명씩 올린다(자동 3명까지) */
  try{ if(!G.unemp&&(foreignOpen()||period()==='season')&&G.fwatch.length<8&&G.fwatch.filter(w=>w.auto).length<3){ const W=mgrWantForeign(); const need=fNeed(G.user); const on=new Set(G.fwatch.map(w=>w.id).concat(G.fwNo||[])); /* fwNo: 지금 구단에서 뺀 기록(이직하면 구단별로 바뀐다) */
    const C=(G.fmarket||[]).map(id=>G.players[id]).filter(q=>q&&q.team==null&&!on.has(q.id)&&fKnows(G.user,q)&&(q.foreign==='용병'||(need&&need.kind==='아시아')));
    const fit=q=>(W&&mgrFitF(q,W)?2:0)+(need&&need.isP!=null&&q.isP===need.isP?1:0)+(need&&need.kind==='아시아'&&q.foreign==='아시아'?1:0); const val=q=>{ const r=scoutReport(q); return (r.ofp??((r.cur??40)+3))+(r.cur??40)*.3; };
    const pickL=C.filter(q=>fit(q)>0).sort((a,b)=>fit(b)-fit(a)||val(b)-val(a)).slice(0,Math.min(2,3-G.fwatch.filter(w=>w.auto).length,8-G.fwatch.length));
    if(pickL.length){ for(const q of pickL)G.fwatch.push({id:q.id,since:G.day,k:0,auto:true}); const pkN=pickL.filter(fNewsOk); if(pkN.length)mail('스카우트팀장','관찰 명단에 후보를 올렸습니다',`${pkN.map(q=>`${q.name}(${posLabel(q)}, ${q.nat||''}, ${q.age}세 · 요구 ${Math.round(q.ask/USD)}만 달러)`).join('\n')}\n\n${W&&W.want?'감독이 원하는 유형':'우리 팀에 필요한 유형'}이라 지켜보겠습니다. 매주 보고가 쌓이면 평가가 정확해집니다. 필요 없으면 관찰 명단에서 빼 주세요(스카우트가 올린 후보는 3명까지).`,{kind:'외국인',acts:[{l:'관찰 명단',a:'go',v:'transfer:watch'}]}); } } }catch(e){}
  if(out.length)mail('스카우트팀장','관찰 명단 변동',out.join('.\n')+'.',{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]});
  // 우리 외국인이 흔들리면 대체 후보를 올린다
  if(period()!=='season'||G.day>foreignDL()||G.day<G.cal.open+30)return; for(const p of foreignOf(G.user)){ if(fReplLeft(G.user,p.foreign)<=0)continue; const h=seasonTotal(p,G.year,'1군'); const bad=p.injOut>=30||(h&&(p.isP?(h.outs>=90&&pRate(h).era>5.6):(h.pa>=120&&bRate(h).ops<.680)));
    if(!bad||p.fwarn===G.year*100+dobj(G.day).m)continue; p.fwarn=G.year*100+dobj(G.day).m; const alt=(G.fwatch||[]).map(w=>G.players[w.id]).filter(q=>q&&q.isP===p.isP&&q.foreign===p.foreign);
    mail('스카우트팀장',`${p.name} 교체 검토`,`${p.name}이(가) ${p.injOut>=30?`부상으로 약 ${p.injOut}일 빠집니다`:'부진합니다'}. ${alt.length?`관찰 명단의 ${p.isP?'투수':'타자'} 후보: ${alt.map(q=>q.name).join(', ')}.`:'관찰 명단에 같은 유형 후보가 없습니다. 외국인 시장에서 후보를 관찰 명단에 올려 두세요.'}`,{imp:!!alt.length,kind:'외국인',ref:p.id,acts:[...alt.slice(0,2).map(q=>({l:`${q.name} 보기`,a:'player',v:q.id})),{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); } }

/* 상대 구단이 눈여겨보는 우리 선수: 그 팀 약한 자리에 맞고 그 팀 눈에 값어치가 큰 선수 3명. 매주 바뀐다 */
let _intC={};
function aiInterest(tid){ if(tid===G.user||!G.teams[tid])return []; const wk=G.year*100+Math.floor(G.day/7); const n=Object.values(G.players).filter(p=>p.team===G.user).length; const k=wk+':'+n+':'+(G.trades||[]).length;
  if(_intC[tid]&&_intC[tid].k===k)return _intC[tid].v; const t=team(tid); let weak=[]; try{ weak=teamNeeds(tid).weak||[]; }catch(e){}
  const back=new Set((G.trades||[]).filter(r=>r.with===tid&&r.y===G.year).flatMap(r=>r.gi||[])); /* 올해 이 구단에서 받아 온 선수는 되찾으려 하지 않는다 */
  const v=domestic(G.user).filter(p=>!p.ys&&!p.noTrade&&!(p.joinY>G.year)&&healthy(p)&&!back.has(p.id)).map(p=>{ const val=tval(t,p,'in'); const fit=weak.includes(pSlot(p))?1.35:1; return {id:p.id,s:val*fit+hn('int'+tid+':'+wk,p.id)*.6}; }).filter(x=>x.s>.6).sort((a,b)=>b.s-a.s).slice(0,3).map(x=>x.id);
  _intC[tid]={k,v}; return v; }
function interestKnown(tid){ return team(tid).rel>=35; }

function interestWhy(tid,p){ const w=[]; let weak=[]; try{ weak=teamNeeds(tid).weak||[]; }catch(e){} if(weak.includes(pSlot(p)))w.push(`${SLOTK[pSlot(p)]} 보강`); const tr=gmTrait(tid);
  if(tr==='prospect'&&p.age<=24)w.push('유망주 선호'); if(tr==='miser'&&p.sal<=150)w.push('싼 연봉'); if(tr==='gambler'&&ovr(p)>=60)w.push('즉시 전력'); if(teamCtx(team(tid)).contend&&ovr(p)>=55)w.push('우승 경쟁용'); if(!teamCtx(team(tid)).contend&&p.age<=25)w.push('리빌딩 자원'); return w.slice(0,2).join(' · ')||'전력 보강'; }


/* 단장이 먼저 포스팅 신청(카페 문의 11-07): 11월 1일~12월 5일(KBO 포스팅 신청 기간), 서비스 7년 이상 보류 선수. 선수가 해외 진출을 원하지 않으면 거절한다 */
function postGMWhy(p){ if(!p||p.team!==G.user||G.unemp||p.foreign)return '우리 국내 선수만 신청할 수 있습니다.'; if(!(G.rolled===G.year&&G.day>=KD(11,1)&&G.day<=KD(12,5)))return '포스팅은 11월 1일부터 12월 5일까지 신청할 수 있습니다(리그 규약).'; if(milServing(p))return '군 복무 중에는 해외에 나갈 수 없습니다.'; if(ovsBeen(p))return '해외에 다녀온 선수는 포스팅 대상이 아닙니다.'; /* 서비스 7년이 지나면 FA 계약을 한 뒤에도 구단 동의로 포스팅할 수 있다(실제로 FA 계약 기간 중 포스팅한 사례가 있다). 리빌딩용(사용자 11-08) */ if((p.svc||0)<7)return `서비스 7년이 지나야 포스팅할 수 있습니다(지금 ${p.svc||0}년).`; if((G.posting||[]).some(x=>x.pid===p.id&&x.y===G.year&&!x.void))return '이미 포스팅을 신청했습니다.'; return ''; }
function postGM(id){ const p=G.players[id]; const why=postGMWhy(p); if(why)return why; if(mlbOf(p)<25){ return `${p.name}은(는) 지금 해외 진출을 원하지 않습니다(메이저리그 의지 ${p.mlb}).`; }
  const x=postStart(p); for(const e of (G.evs||[]))if(e.k==='post'&&!e.done&&e.data&&e.data.pid===p.id){ e.done=true; e.res='단장이 먼저 포스팅을 신청해 정리'; } /* 열려 있던 선수 요청은 닫는다(검수 11-08) */ story(p,`${G.year} 구단 주도 포스팅 신청`,'move'); return `${p.name} 포스팅을 신청했습니다. ${dmd(x.day)}에 MLB·NPB 구단 제안과 결과가 나옵니다.`; }

/* ===== 해외 진출 이야기(사용자 11-08): MLB 스카우트 방문 보도 · 포스팅 중간 보도 · 고교 선수 MLB 직행과 1순위 구단의 설득 =====
   실제 바탕: 해외 진출 후보 경기에는 메이저리그 스카우트가 몰려 보도되고, 포스팅은 공시 뒤 30일 협상 기간 동안 현지 보도가 이어진다.
   고교 최대어가 드래프트 전에 미국 구단과 계약하는 일이 있다(2023 심준석 등). 지명 순번이 앞선 구단은 계약금·면담으로 설득을 시도한다 */
function ovsStoryDaily(){ try{ ovsScoutVisit(); }catch(e){} try{ ovsPostRumor(); }catch(e){} try{ hsUsDaily(); }catch(e){} }
/* MLB 스카우트 방문: 정규시즌 화요일마다, 해외 진출을 바라볼 만한 국내 정상급 선수 경기 */
function ovsScoutVisit(){ if(period()!=='season'||dobj(G.day).w!==2||R()>.4)return;
  const L=Object.values(G.players).filter(p=>p.team!=null&&!p.foreign&&!p.prospect&&p.age<=31&&!milServing(p)&&!(p.injOut>0)&&!p.frehab&&ovr(p)>=59&&((p.svc||0)>=5||mlbOf(p)>=55)&&p.ovsY==null&&p.retFrom==null).sort((a,b)=>ovr(b)-ovr(a)); if(!L.length)return;
  const p=L[Math.floor(R()*Math.min(5,L.length))]; G.ovsVisit=G.ovsVisit||{}; if((G.ovsVisit[p.id]??-999)>=G.day-40)return; G.ovsVisit[p.id]=G.day;
  const n=ovr(p)>=63?ri(5,9):ri(2,5); const clubs=[...MLBT].sort(()=>R()-.5).slice(0,Math.min(3,n)).join('·');
  p.mlbSeen=p.mlbSeenY===G.year?(p.mlbSeen||0)+1:1; p.mlbSeenY=G.year; /* 올해 방문 횟수: 해가 바뀌면 새로 센다(검수 11-09c) */ p.mlb=clamp(mlbOf(p)+2,0,100);
  wire('해외',`${p.name}(${tshort(p.team)}) 경기에 MLB ${n}개 구단 스카우트 집결`,{tid:p.team,ref:p.id});
  if(p.team===G.user&&!G.unemp)news('선수',`MLB 스카우트, ${p.name} 보러 왔다`,`${clubs} 등 메이저리그 ${n}개 구단 스카우트가 ${p.name}의 경기를 지켜봤습니다. ${p.isP?'백네트 뒤에 스피드건이 줄지어 섰습니다.':'타석마다 스카우트들의 메모가 바빴습니다.'} 선수의 해외 진출 의지가 조금 커졌습니다(올해 ${p.mlbSeen}번째 방문).`,1,{ref:p.id}); }
/* 포스팅 중간 보도: 결과 8일 전 현지 보도(관심 구단 수는 실제 결과와 같은 기준으로 추정) */
function ovsPostRumor(){ for(const x of G.posting||[]){ if(x.done||x.rum||x.void||G.day<x.day-8)continue; x.rum=true; const p=G.players[x.pid]; if(!p||p.team!==x.tid)continue; const o=ovr(p);
    const n=o>=68?ri(4,8):o>=64?ri(2,4):o>=61?ri(0,2):ri(0,1); const cl=[...MLBT].sort(()=>R()-.5).slice(0,Math.min(3,n));
    const t=n?`현지 보도 "${cl.join('·')} 등 ${n}개 구단 관심"`:'현지 반응 미지근, 관심 구단 확인 안 돼';
    wire('해외',`${p.name} 포스팅 · ${t}`,{tid:x.tid,ref:p.id});
    if(x.tid===G.user&&!G.unemp)news('선수',`${p.name} 포스팅 협상 막바지 · ${n?`${n}개 구단 관심`:'관심 구단 없어'}`,n?`미국 현지 기자들이 ${cl.join('·')} 등을 유력 행선지로 꼽고 있습니다. ${dmd(x.day)}에 결과가 나옵니다. ${n>=4?'몸값이 예상보다 오를 수 있다는 전망입니다.':''}`:`아직 적극적인 구단이 보이지 않습니다. 일본 구단 제안이나 잔류 가능성도 거론됩니다. 결과는 ${dmd(x.day)}.`,n?1:0,{ref:p.id}); } }
/* 고교 선수 MLB 직행: 7월 10일 무렵 고교 최대어 일부에게 미국 구단 제안. 1라운드 1순위 구단이 우리면 설득을 시도할 수 있다. 8월 20일까지 남지 않으면 떠난다 */
function hsUsDaily(){ const D=G.draftClass; if(!D||!D.length||G.unemp&&false)return; const C=D.map(id=>G.players[id]).filter(p=>p&&p.prospect);
  if(G.day===KD(7,10)){ /* 대졸 최대어도 미국 구단이 본다(사용자 11-11: 대학 4년 최대어가 그대로 드래프트에 나옴). 미국 스카우트는 실제 능력을 본다: 잠재력과 지금 능력을 함께 */ const usV=p=>p.pot+(p.college?Math.max(0,ovr(p)-50)*.5:0); const top=C.filter(p=>p.college?p.pot>=62&&ovr(p)>=50:p.pot>=60).sort((a,b)=>usV(b)-usV(a)).slice(0,3); let k=0;
    for(const p of top){ if(k>=2||R()>.4)continue; k++; const bonus=Math.round(clamp((p.pot-56)*25+N(0,20),60,300)); p.usOff={club:pick(MLBT),bonus,y:G.year};
      wire('드래프트',`${p.college?'대학':'고교'} 최대어 ${p.name}(${p.school}), MLB 직행 검토 · ${p.usOff.club} 계약금 ${bonus}만 달러 제시설`,{ref:p.id});
      let first=null; try{ first=draftPickOrder()[0]; }catch(e){}
      if(first&&first.tid===G.user&&!G.unemp){ const mv=mlbOf(p);
        evNew('usHs',`${p.name}, 미국 직행이냐 우리 1순위냐`,`${p.school} ${posLabel(p)} ${p.name}에게 ${p.usOff.club} 구단이 계약금 ${bonus}만 달러를 제시했습니다. 우리 구단이 올해 1라운드 1순위입니다. 선수는 메이저리그 의지 ${mv}로 고민 중입니다.`,
          [{l:'최고 대우로 설득',fx:`계약금 외 추가 ${money(Math.round(bonus*1.3))}을 약속합니다(지금 구단 현금에서 나감). 성공 가능성이 큽니다.`},{l:'단장이 직접 찾아가 설득',fx:'돈은 들지 않습니다. 선수와 부모를 만나 1군 기회와 육성 계획을 설명합니다. 성공은 반반 아래입니다.'},{l:'보내 준다',fx:'설득하지 않습니다. 다른 후보를 1순위로 준비합니다.'}],{ref:p.id,from:'스카우트팀장',data:{pid:p.id},def:2,exp:20}); } } }
  if(G.day===KD(8,20))for(const p of C){ if(!p.usOff||p.usOff.y!==G.year||p.usStay)continue; if(R()<.3){ p.usStay=true; wire('드래프트',`${p.name}, 미국 대신 국내 드래프트 참가 결정`,{ref:p.id}); continue; }
    const club=p.usOff.club, bonus=p.usOff.bonus; G.draftClass=G.draftClass.filter(id=>id!==p.id); p.prospect=false; { const yrs=ri(3,6); ovsLeave(p,'MLB',club,yrs,Math.round(bonus/yrs),p.college?'대졸 직행':'고교 직행'); }
    if(!G.unemp)news('드래프트',`${p.name}, ${club}과 계약 · ${p.college?'대학':'고교'} 졸업 뒤 미국 직행`,`드래프트를 앞두고 ${p.college?'대학':'고교'} 최대어 한 명이 빠졌습니다. 계약금 ${bonus}만 달러. 드래프트 상위 지명 판도가 바뀝니다.`,0,{}); } }
/* 설득 자격·비용: 지금도 1순위를 쥐고 있고(검수 11-09c: 지명권을 넘긴 뒤에도 설득), 최고 대우는 보유 현금 안에서만(현금 0원에서 결제) */
function usHsWhy(e,i){ const p=G.players[e.data.pid]; if(i===2||!p||!p.usOff)return ''; let first=null; try{ first=draftPickOrder()[0]; }catch(x){} if(!first||first.tid!==G.user||G.unemp)return '1라운드 1순위 지명권이 이제 우리 구단에 없어 설득할 수 없습니다.';
  const cost=Math.round(p.usOff.bonus*1.3); if(i===0&&spendable(G.user)<cost)return `추가 약속 ${money(cost)}을 낼 수 없습니다(${spendTxt()}).`; return ''; }
EVH.usHs={ can:usHsWhy, pick(e,i){ const p=G.players[e.data.pid]; if(!p||!p.prospect||!p.usOff)return '이미 정리된 일입니다.'; const mv=mlbOf(p), b=p.usOff.bonus, t=team(G.user);
  if(i===2){ return `${p.name}의 선택을 존중하기로 했습니다.`; } { const why=usHsWhy(e,i); if(why){ e.pick=2; return why+' 설득하지 않았습니다.'; } } /* 자동 처리로 와도 같은 조건 */
  const ch=i===0?clamp(.92-(mv-50)/120,.55,.95):clamp(.55-(mv-50)/90,.15,.7); const cost=i===0?Math.round(b*1.3):0;
  if(R()<ch){ p.usStay=true; delete p.usOff; if(cost)spendPay(cost); p.usKeepT=G.user; news('드래프트',`${p.name}, 미국 대신 국내 잔류 · ${tshort(G.user)} 설득 통했다`,i===0?`${tshort(G.user)}이(가) 최고 대우를 약속했다는 후문입니다.`:`단장이 직접 집을 찾아가 육성 계획을 설명한 것이 마음을 돌렸다는 후문입니다.`,1,{ref:p.id}); return `설득에 성공했습니다. ${p.name}은(는) 국내 신인 드래프트에 나옵니다${cost?`(추가 약속 ${money(cost)} 지출)`:''}. 1순위로 지명하세요.`; }
  p.mlb=clamp(mv+5,0,100); return `설득에 실패했습니다. ${p.name}은(는) 미국행 쪽으로 기울었습니다. 8월 20일 전후로 결정합니다.`; } };
