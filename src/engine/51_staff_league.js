/* ===== 리그 공용 스태프 시장: 스카우트·전력분석원 =====
   10개 구단이 같은 후보 풀을 두고 경쟁한다. 다른 구단도 실제 스카우트·분석원을 두고, 그 실력이 그 구단의 드래프트·외국인 판단과 전력분석에 반영된다.
   후보는 연봉, 구단 위상(시장 규모·인기·최근 성적·단장 평판), 연고 지역, 야망을 보고 행선지를 고른다.
   비시즌(11~1월)에는 다른 구단 스태프를 데려올 수 있고, 다른 구단도 우리 스태프에게 손을 뻗는다.
   스태프는 해마다 경험이 쌓여 성장하고(젊을수록), 오래 일하면 충성도가 올라 잘 떠나지 않는다 */
const ST_SC_N=[3,5], ST_AN_N=[2,4];
function stAttr(s){ if(s.amb==null)s.amb=Math.round(clamp(N(50,20),5,95)); if(s.loy==null)s.loy=20; if(s.age==null)s.age=ri(30,58); return s; }
function stInit(){ if(G.lgStaff)return G.lgStaff; const L=G.lgStaff={}; for(const t of G.teams){ if(t.id===G.user)continue; L[t.id]=stMakeTeam(t); stSync(t.id); }
  for(const s of G.scouts||[]){ stAttr(s); s.loy=Math.max(s.loy,ri(30,55)); } for(const a of anaList()){ stAttr(a); a.loy=Math.max(a.loy,ri(30,55)); } return L; }
/* AI 구단 스태프 목록(없으면 만든다). 우리 구단은 G.scouts/G.analysts를 쓰므로 null */
function stTeamL(tid){ if(tid===G.user)return null; const L=stInit(); return L[tid]=L[tid]||stMakeTeam(team(tid)); }
/* 창단 리그라 모든 구단이 우리와 같은 조건(스카우트 3명: 능력 2~3·2·2, 분석원 3명: 능력 2)에서 시작한다.
   그 뒤 해마다 비시즌에 구단 재정·시장 규모에 따라 스태프를 늘리고 바꾼다(stAiHire) */
function stMakeTeam(t){ const sc=[], an=[];
  [ri(2,3),2,2].forEach(k=>{ const s=stAttr(mkScout(k)); s.loy=ri(20,70); sc.push(s); });
  ['opp','trk','vid'].forEach(r=>{ const a=stAttr(mkAnalyst(2,r)); a.loy=ri(20,70); an.push(a); });
  return {sc,an}; }
/* AI 구단의 스카우트 오차(scoutSd)를 실제 스카우트 실력에서 계산 */
function stSync(tid){ const L=G.lgStaff&&G.lgStaff[tid]; if(!L)return; const sk=L.sc.map(s=>s.skill).sort((a,b)=>b-a); const v=(sk[0]||1)*.55+(sk[1]||1)*.3+(sk[2]||1)*.15; const i=Math.floor(v), f=v-i;
  team(tid).scoutSd=Math.round((SCOUT_SD[clamp(i,0,5)]*(1-f)+SCOUT_SD[clamp(i+1,0,5)]*f)*10)/10; }
function stAnaPow(tid,role){ const L=G.lgStaff&&G.lgStaff[tid]; if(!L)return null; const v=L.an.filter(a=>a.role===role).map(a=>a.skill).sort((a,b)=>b-a); return (v[0]||0)+(v[1]||0)*.6+(v[2]||0)*.3; }
/* 구단 위상: 큰 시장·인기·최근 성적·단장 평판 */
/* 구단 명성(FM의 평판): 시장·인기·최근 성적·최근 10년 우승·시설·단장 평판. FA·외국인·스태프가 행선지를 고를 때 본다 */
function clubPrestigeParts(tid){ const t=team(tid); const P=[]; P.push(['기본',50]); P.push(['시장 규모',(t.market-1)*45]); P.push(['구단 인기',(clamp(t.pop,0,1.6)-1)*25]); if(t.indie)P.push(['모기업 없음',-8]);
  let rs=0; const H=(G.history||[]).slice(-2); H.forEach((h,j)=>{ const i=h.order.findIndex(o=>o.tid===tid); if(i>=0)rs+=(4.5-i)*(j===H.length-1?2.2:1.2); if(h.champ===tid)rs+=j===H.length-1?8:4; }); P.push(['최근 2년 성적',rs]);
  const old=(G.history||[]).filter(h=>h.champ===tid&&h.y>=G.year-10&&!H.includes(h)).length; if(old)P.push([`최근 10년 우승 ${old}회`,old*2.5]);
  if(tid===G.user&&!G.unemp)P.push(['단장 평판',((G.rep??50)-50)*.3]); P.push(['시설',((t.fac||3)-3)*3]); return P; }
function clubPrestige(tid){ const v=sum(clubPrestigeParts(tid).map(x=>x[1])); return Math.round(clamp(v,10,99)); }
const prestigeStars=v=>v>=80?5:v>=67?4:v>=54?3:v>=40?2:1;
const starTxt=n=>'★'.repeat(n)+'☆'.repeat(5-n);
/* 후보가 제안을 비교하는 점수 */
function stScore(s,tid,sal,cur){ const pr=clubPrestige(tid); let v=(sal/Math.max(1,s.sal)-1)*120+pr*(.35+s.amb/200);
  if(s.region&&team(tid).region===s.region)v+=10; if(cur)v+=s.loy*.45+8; return v+hn('stc'+G.year+':'+tid,s.id)*6; }
/* 후보 관심 구단: 매달 정한다(능력이 높을수록 여러 구단이 노린다) */
function stInterest(s){ const mk=G.year*100+dobj(G.day).m; if(s._im===mk)return s.int||[]; s._im=mk; const n=s.skill>=5?ri(2,3):s.skill>=4?ri(1,2):s.skill>=3?(R()<.5?1:0):0;
  s.int=G.teams.filter(t=>t.id!==G.user).sort(()=>R()-.5).slice(0,n).map(t=>t.id); return s.int; }
/* 우리 제안: 관심 구단과 경쟁. raise=연봉 인상률 */
function stOffer(kind,id,raise){ stInit(); const mkt=kind==='sc'?scoutMkt():anaMarket(); const s=mkt.find(x=>x.id===id); if(!s)return {ok:false,msg:'후보가 없습니다.'}; stAttr(s);
  if(kind==='sc'&&G.scouts.length>=SCOUT_MAX)return {ok:false,msg:`스카우트는 ${SCOUT_MAX}명까지입니다.`}; if(kind==='an'&&anaList().length>=ANA_MAX)return {ok:false,msg:`분석원은 ${ANA_MAX}명까지입니다.`};
  const sal=round5(s.sal*(1+raise)); const me=stScore(s,G.user,sal,false);
  /* 경쟁 제안이 이미 걸려 있으면(우리가 한 번 밀린 뒤) 그 조건과 다시 겨룬다. 두 번째에도 밀리면 그쪽으로 간다 */
  const B=s.bid&&s.bid.exp>=G.day?s.bid:null;
  if(B){ if(me>B.v){ delete s.bid; } else { delete s.bid; stJoin(kind,s,B.t); return {ok:false,msg:`${s.name}은(는) 고민 끝에 ${tname(B.t)}을(를) 택했습니다(상대 연 ${money(B.sal)}). ${clubPrestige(B.t)>clubPrestige(G.user)?'구단 위상 차이를 조건으로 메우지 못했습니다.':'조건이 조금 모자랐습니다.'}`}; } }
  const rivals=B?[]:stInterest(s).map(t=>{ const rs=round5(s.sal*rnd(1,1.15)); return {t,sal:rs,v:stScore(s,t,rs,false)}; }).sort((a,b)=>b.v-a.v);
  if(rivals.length&&rivals[0].v>me){ const r=rivals[0]; /* 바로 뺏기지 않는다: 상대 조건을 알려 주고 3일 안에 다시 제안할 기회를 준다 */
    s.bid={t:r.t,sal:r.sal,v:r.v,k:kind,exp:G.day+3};
    let need=null; for(let x=Math.max(raise,0)+.05;x<=1.0001;x+=.05){ const ns=round5(s.sal*(1+x)); if(stScore(s,G.user,ns,false)>r.v){ need={x:+x.toFixed(2),sal:ns}; break; } }
    const head=`${tname(r.t)}이(가) ${s.name}에게 연 ${money(r.sal)}을 제시해 그쪽으로 기울었습니다. ${clubPrestige(r.t)>clubPrestige(G.user)?'구단 위상도 그쪽이 높습니다.':''}`;
    const tail=need?`${dmd(s.bid.exp)}까지 연 ${money(need.sal)} 이상으로 다시 제안하면 우리 쪽으로 돌릴 수 있습니다.`:'연봉을 두 배로 올려도 마음을 돌리기 어렵습니다. 구단 위상 차이가 큽니다.';
    mail('운영팀',`${s.name} 영입 경쟁: ${tshort(r.t)}이(가) 더 높은 조건`,`${head}\n${tail}\n\n답하지 않으면 ${dmd(s.bid.exp)} 뒤 ${tshort(r.t)}로 갑니다.`,{imp:true,kind:'스태프',acts:(need?[{l:`다시 제안(연 ${money(need.sal)})`,a:kind==='sc'?'hireScout':'anaHire',v:s.id+':'+need.x}]:[]).concat([{l:'포기',a:'stBidDrop',v:s.id}])});
    return {ok:false,bid:true,msg:head+' '+tail}; }
  s.sal=sal; s.since=G.day; s.loy=20; if(kind==='sc')G.scoutMarket=G.scoutMarket.filter(x=>x.id!==id); else G.amarket=G.amarket.filter(x=>x.id!==id);
  return {ok:true,s,msg:`${s.name}이(가) 연 ${money(sal)}에 합류합니다.${rivals.length?` ${rivals.map(r=>tshort(r.t)).join('·')}도 노렸지만 우리를 택했습니다.`:''}`}; }
function stJoin(kind,s,tid){ const L=stTeamL(tid); if(!L)return; s.since=G.day; s.loy=20; if(kind==='sc'){ G.scoutMarket=(G.scoutMarket||[]).filter(x=>x.id!==s.id); L.sc.push(s); if(L.sc.length>ST_SC_N[1]+1)L.sc.sort((a,b)=>a.skill-b.skill).shift(); stSync(tid); }
  else { G.amarket=(G.amarket||[]).filter(x=>x.id!==s.id); L.an.push(s); if(L.an.length>ST_AN_N[1]+1)L.an.sort((a,b)=>a.skill-b.skill).shift(); }
  if(s.skill>=4)wire('스태프',`${tshort(tid)}, ${kind==='sc'?'스카우트':'전력분석원'} ${s.name}(능력 ${s.skill}) 영입`,{tid}); }
/* 매달 1일: AI 구단이 시장에서 사람을 데려간다(좋은 후보부터 사라진다) */
function stAiMonthly(){ stInit(); const off=period()!=='season'; for(const t of G.teams){ if(t.id===G.user)continue; if(R()>(off?.35:.12)*clamp(t.market,.7,1.3))continue; const L=G.lgStaff[t.id];
    for(const [kind,list,mkt] of [['sc',L.sc,scoutMkt()],['an',L.an,anaMarket()]]){ const worst=[...list].sort((a,b)=>a.skill-b.skill)[0]; const room=list.length<(kind==='sc'?ST_SC_N[1]:ST_AN_N[1]);
      const c=mkt.filter(s=>!s.ob&&(room||(worst&&s.skill>=worst.skill+2))&&(s.skill<5||t.market>=1.05||R()<.4)).sort((a,b)=>stScore(b,t.id,b.sal,false)-stScore(a,t.id,a.sal,false)+(b.skill-a.skill)*20)[0];
      if(c&&R()<.6){ stAttr(c); if(!room&&worst){ const i=list.indexOf(worst); list.splice(i,1); (kind==='sc'?G.scoutMarket:G.amarket).push(worst); } stJoin(kind,c,t.id); break; } } } }
/* 비시즌: 다른 구단 스태프 빼오기(연봉 인상 필요). 구단당 한 번, 비시즌 3번까지 */
function stPoachOpen(){ const o=dobj(G.day); return o.m>=11||o.m<=1; }
function stPoach(kind,tid,id,raise){ stInit(); if(!stPoachOpen())return '다른 구단 스태프는 11월~1월에만 데려올 수 있습니다.'; const P=G.stPo=G.stPo&&G.stPo.y===sponSeason()?G.stPo:{y:sponSeason(),n:0,t:[]};
  if(P.n>=3)return '이번 비시즌에는 더 이상 영입 시도를 할 수 없습니다(3번).'; if(P.t.includes(tid))return `${tshort(tid)} 스태프에게는 이미 한 번 접촉했습니다.`;
  const L=G.lgStaff[tid]; const list=kind==='sc'?L.sc:L.an; const s=list.find(x=>x.id===id); if(!s)return '대상이 없습니다.';
  if(kind==='sc'&&G.scouts.length>=SCOUT_MAX)return `스카우트는 ${SCOUT_MAX}명까지입니다.`; if(kind==='an'&&anaList().length>=ANA_MAX)return `분석원은 ${ANA_MAX}명까지입니다.`;
  P.n++; P.t.push(tid); const sal=round5(s.sal*(1+raise)); const go=stScore(s,G.user,sal,false), stay=stScore(s,tid,s.sal*1.05,true);
  const t=team(tid); t.rel=clamp((t.rel||50)-3,0,100);
  if(go<=stay)return `${s.name}: "제안은 감사하지만 ${tshort(tid)}에 남겠습니다." ${s.loy>=60?'오래 몸담은 구단이라 마음이 쉽게 움직이지 않습니다.':'조건이나 구단 위상이 부족했습니다.'} (${tshort(tid)} 관계 -3)`;
  list.splice(list.indexOf(s),1); if(kind==='sc')stSync(tid); s.sal=sal; s.since=G.day; s.loy=15; if(kind==='sc'){ s.role=s.role||'am'; G.scouts.push(s); } else G.analysts.push(s);
  wire('스태프',`${tshort(G.user)}, ${tshort(tid)} ${kind==='sc'?'스카우트':'전력분석원'} ${s.name} 영입`,{tid:G.user}); addLog(`${tshort(tid)}의 ${kind==='sc'?'스카우트':'분석원'} ${s.name}(능력 ${s.skill})을(를) 연 ${money(sal)}에 데려왔습니다.`);
  return `${s.name}이(가) 우리 구단으로 옵니다. 연 ${money(sal)}. (${tshort(tid)} 관계 -3)`; }
/* 다른 구단이 우리 스태프를 노린다: 11월 15일·12월 15일 */
function stRaid(){ stInit(); const mine=[...G.scouts.map(s=>['sc',s]),...anaList().map(a=>['an',a])].map(([k,s])=>[k,stAttr(s)]).filter(([,s])=>s.skill>=3&&R()<(s.skill-2)*.09*(s.amb/60)*(1-s.loy/150));
  for(const [k,s] of mine.slice(0,2)){ const cands=G.teams.filter(t=>t.id!==G.user&&clubPrestige(t.id)>=clubPrestige(G.user)-5); const t=pick(cands.length?cands:G.teams.filter(x=>x.id!==G.user)); if(!t)continue;
    const offer=round5(s.sal*rnd(1.15,1.4)); (G.stRaid=G.stRaid||[]).push({k,id:s.id,tid:t.id,sal:offer,exp:G.day+7});
    if(!autoOn('raid'))mail('운영팀',`${tshort(t.id)}, 우리 ${k==='sc'?'스카우트':'분석원'} ${s.name}에게 영입 제안`,`${tname(t.id)}이(가) ${s.name}(능력 ${s.skill})에게 연 ${money(offer)}을 제시했습니다(현재 ${money(s.sal)}). 구단 위상: 우리 ${clubPrestige(G.user)} · ${tshort(t.id)} ${clubPrestige(t.id)}. 충성도 ${Math.round(s.loy)}.\n\n7일 안에 답하지 않으면 본인이 결정합니다.`,{imp:true,kind:'스태프',acts:[{l:`맞춰서 붙잡기(연 ${money(offer)})`,a:'stKeep',v:s.id+':1'},{l:'조금 올려 설득(+10%)',a:'stKeep',v:s.id+':0'},{l:'보내 주기',a:'stLet',v:s.id}]}); if(!autoOn('raid')&&G.mail[0])G.mail[0].auto=['raid']; } }
function stRaidAuto(){ try{ autoRaid(); }catch(e){} }
function stRaidFind(id){ return (G.stRaid||[]).find(r=>r.id===id); }
function stLeave(r){ const s=(r.k==='sc'?G.scouts:anaList()).find(x=>x.id===r.id); G.stRaid=(G.stRaid||[]).filter(x=>x!==r); if(!s)return ''; if(r.k==='sc')G.scouts=G.scouts.filter(x=>x!==s); else G.analysts=G.analysts.filter(x=>x!==s);
  s.sal=r.sal; s.loy=15; s.since=G.day; const L=stTeamL(r.tid); if(L)(r.k==='sc'?L.sc:L.an).push(s); if(r.k==='sc')stSync(r.tid); wire('스태프',`${tshort(r.tid)}, ${tshort(G.user)} ${r.k==='sc'?'스카우트':'분석원'} ${s.name} 영입`,{tid:r.tid}); addLog(`${s.name}이(가) ${tname(r.tid)}로 떠났습니다.`); return `${s.name}이(가) ${tshort(r.tid)}로 떠났습니다.`; }
function stKeep(id,full){ const r=stRaidFind(id); if(!r)return '이미 끝난 일입니다.'; const s=(r.k==='sc'?G.scouts:anaList()).find(x=>x.id===id); if(!s){ G.stRaid=G.stRaid.filter(x=>x!==r); return ''; }
  const sal=full?r.sal:round5(s.sal*1.1); const stay=stScore(s,G.user,sal,true), go=stScore(s,r.tid,r.sal,false);
  if(full||stay>=go){ s.sal=sal; s.loy=clamp(s.loy+10,0,100); G.stRaid=G.stRaid.filter(x=>x!==r); addLog(`${s.name}을(를) 연 ${money(sal)}에 붙잡았습니다.`); return `${s.name}: "믿어 주셔서 감사합니다. 남겠습니다." 연 ${money(sal)}.`; }
  return stLeave(r); }
/* 영입 경쟁: 기한이 지나면 경쟁 구단으로 간다 */
function stBidExpire(){ for(const [kind,mkt] of [['sc',G.scoutMarket||[]],['an',G.amarket||[]]]){ for(const s of [...mkt]){ if(!s.bid||s.bid.exp>=G.day)continue; const t=s.bid.t; delete s.bid; stJoin(kind,s,t); note('스태프',`${s.name}이(가) ${tname(t)}과(와) 계약했습니다. 다시 제안하지 않아 영입 경쟁이 끝났습니다.`); } } }
function stBidDrop(id){ for(const [kind,mkt] of [['sc',G.scoutMarket||[]],['an',G.amarket||[]]]){ const s=mkt.find(x=>x.id===id); if(s&&s.bid){ const t=s.bid.t; delete s.bid; stJoin(kind,s,t); return `${s.name} 영입을 포기했습니다. ${tshort(t)}로 갑니다.`; } } return '이미 끝난 일입니다.'; }
function stDaily(){ try{ stBidExpire(); }catch(e){} const o=dobj(G.day); if(o.d===1)try{ stAiMonthly(); }catch(e){} if((o.m===11||o.m===12)&&o.d===15){ try{ stRaid(); }catch(e){} stRaidAuto(); }
  for(const r of (G.stRaid||[]).filter(r=>r.exp<G.day)){ const s=(r.k==='sc'?G.scouts:anaList()).find(x=>x.id===r.id); if(s&&stScore(s,G.user,s.sal,true)>=stScore(s,r.tid,r.sal,false)){ G.stRaid=G.stRaid.filter(x=>x!==r); note('스태프',`${s.name}은(는) 고민 끝에 남기로 했습니다.`); } else note('스태프',stLeave(r)); } }
/* 새해: 경험이 쌓여 성장(젊을수록), 노장은 감각이 떨어지고 은퇴, 충성도 상승, 연봉은 실력에 맞춰 재계약 */
function stYear(){ stInit(); const all=[...G.scouts.map(s=>['sc',s,G.user]),...anaList().map(a=>['an',a,G.user])]; for(const tid in G.lgStaff){ for(const s of G.lgStaff[tid].sc)all.push(['sc',s,+tid]); for(const a of G.lgStaff[tid].an)all.push(['an',a,+tid]); }
  const grew=[], gone=[];
  for(const [k,s,tid] of all){ stAttr(s); s.age++; s.loy=clamp(s.loy+12,0,100); const up=(s.age<=40?.2:s.age<=50?.1:.03)*(s.skill>=4?.5:1); if(s.skill<5&&R()<up){ s.skill++; if(tid===G.user)grew.push(s.name); } /* 4·5단계로 올라가기는 더 어렵다 */
    if(s.skill>1&&R()<(s.age>=58?.25:s.age>=52?.1:.03))s.skill--; /* 감이 떨어지거나 현장과 멀어진다 */ s.sal=Math.max(s.sal,(k==='sc'?SCOUT_SAL:ANA_SAL)[s.skill]);
    if(s.age>=66||(s.age>=60&&R()<.15)){ if(tid===G.user){ if(k==='sc')G.scouts=G.scouts.filter(x=>x!==s); else G.analysts=G.analysts.filter(x=>x!==s); gone.push(s.name); } else { const L=G.lgStaff[tid]; if(k==='sc')L.sc=L.sc.filter(x=>x!==s); else L.an=L.an.filter(x=>x!==s); } } }
  for(const tid in G.lgStaff)stSync(+tid);
  if(grew.length||gone.length)mail('운영팀','스태프 연간 변동',`${grew.length?`경험이 쌓여 실력이 오른 스태프: ${grew.join(', ')}`:''}${gone.length?`\n은퇴한 스태프: ${gone.join(', ')}`:''}\n\n오래 함께한 스태프일수록 충성도가 올라 다른 구단 제안에 잘 흔들리지 않습니다.`,{kind:'스태프'}); }

/* AI 구단 스태프 운영(매달 1일): 우리와 같은 시장(스카우트·분석원 영입 후보)에서 뽑는다. 좋은 후보를 먼저 데려가면 우리 몫이 줄어든다.
   목표 인원·수준은 구단 재정(보유 현금)·시장 규모·전략으로 정한다. 빈자리는 아무 달에나 채우고, 사람 바꾸기(약한 사람 내보내고 더 나은 사람)는 11~2월에.
   비시즌(11~1월)에는 다른 AI 구단 스태프를 연봉을 올려 빼 오기도 한다. 들어간 연봉은 시즌 결산 지출(스카우트 운영)에 실제로 잡힌다 */
function stAiPlan(t){ const cash=t.cash||0; const rich=(t.market-1)*2+(t.indie?-.6:0)+clamp(cash/4000,-1,1.2);
  return {rich,tSc:clamp(3+Math.round(rich+(t.mode==='rebuild'?.6:0)),2,6),tAn:clamp(3+Math.round(rich*.8+(t.mode==='contend'?.6:0)),2,6),payMax:Math.round(clamp(400+rich*220,250,1300))}; }
function stAiPay(S){ return sum(S.sc.map(x=>x.sal||0))+sum(S.an.map(x=>x.sal||0)); }
function stAiStaff(){ if(G.unemp&&G.user==null)return; const L=stInit(); const m=dobj(G.day).m, off=m>=11||m<=2; const ids=Object.keys(L).map(Number).sort(()=>R()-.5); const moved=[]; let top=0; /* 능력 4 이상은 리그 전체에서 한 달에 한 명만 AI가 데려간다(우리에게도 기회가 남게) */
  for(const tid of ids){ const t=team(tid); if(!t||tid===G.user)continue; const S=L[tid]; const P=stAiPlan(t);
    const fill=(kind)=>{ const list=kind==='sc'?S.sc:S.an, tgt=kind==='sc'?P.tSc:P.tAn; const mk=kind==='sc'?scoutMkt():anaMarket(); if(!mk.length)return;
      const room=P.payMax-stAiPay(S); const pickC=mk.filter(c=>(c.sal||0)<=room&&!(top>=1&&c.skill>=4)).sort((a,b)=>b.skill-a.skill||(a.sal||0)-(b.sal||0));
      if(list.length<tgt&&pickC.length&&R()<(off?.75:.35)){ const c=pickC[R()<.7?0:Math.min(1,pickC.length-1)]; mk.splice(mk.indexOf(c),1); if(c.skill>=4)top++; stAttr(c); c.loy=ri(20,45); c.since=G.day; list.push(c); moved.push(`${tshort(tid)} ${kind==='sc'?'스카우트':'분석원'} ${c.name}(능력 ${c.skill}) 영입`); if(c.skill>=4)try{ wire('스태프',`${tshort(tid)}, ${kind==='sc'?'스카우트':'전력분석원'} ${c.name}(능력 ${c.skill}) 영입`,{tid}); }catch(e){} return; }
      if(off&&list.length&&R()<.2){ const w=[...list].sort((a,b)=>a.skill-b.skill)[0]; const up=pickC.find(c=>c.skill>=w.skill+2&&(c.sal||0)-(w.sal||0)<=room+(w.sal||0)); if(up){ list.splice(list.indexOf(w),1); mk.splice(mk.indexOf(up),1); if(up.skill>=4)top++; stAttr(up); up.loy=ri(20,45); up.since=G.day; list.push(up); moved.push(`${tshort(tid)} ${kind==='sc'?'스카우트':'분석원'} 교체: ${w.name} → ${up.name}(능력 ${up.skill})`); } } };
    fill('sc'); fill('an');
    /* 비시즌 빼 오기: 부유한 구단이 다른 AI 구단의 능력 4 이상을 노린다 */
    if((m>=11||m<=1)&&P.rich>.4&&R()<.12){ const pool=[]; for(const o in L){ if(+o===tid)continue; for(const x of L[o].sc)if(x.skill>=4)pool.push([+o,x]); } const tg=pick(pool);
      if(tg&&S.sc.length<6){ const [o,x]=tg; const sal=round5(x.sal*1.3); if(stAiPay(S)+sal<=P.payMax+200&&stScore(x,tid,sal,false)>stScore(x,o,x.sal*1.05,true)){ L[o].sc.splice(L[o].sc.indexOf(x),1); x.sal=sal; x.loy=15; x.since=G.day; S.sc.push(x); stSync(o); moved.push(`${tshort(tid)}, ${tshort(o)} 스카우트 ${x.name} 영입`); try{ wire('스태프',`${tshort(tid)}, ${tshort(o)} 스카우트 ${x.name} 영입`,{tid}); }catch(e){} } } }
    stSync(tid); }
  return moved; }
