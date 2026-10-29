/* ===== 외국인 선수 ===== */
function fAsk(p){ const o=ovr(p); if(p.foreign==='아시아')return clamp(round5(100+(o-44)*16),100,ASIA_CAP); return clamp(round5(300+(o-46)*46),300,F_NEW_CAP); }
function wpick(ws){ let tot=0; for(const k in ws)tot+=ws[k]; let x=R()*tot; for(const k in ws){ x-=ws[k]; if(x<=0)return k; } return Object.keys(ws)[0]; }
/* 외국인 후보는 두 경로로 나온다.
   에이전트 제안: 리그 전체에 돌리는 공용 후보. 대부분 트리플A·더블A·독립리그 출신이고, 이름값 있는 선수는 이유(부상·나이·적응)가 있다.
   스카우트 발굴: 구단 스카우트가 직접 찾은 선수. 처음엔 찾은 구단만 알고, 시간이 지나면 소문이 나서 다른 구단도 알게 된다.
   해외 스카우트망과 파견 스카우트 수준이 높을수록 더 자주, 더 좋은 선수를 찾는다 */
const FFLAW={inj:'부상 이력',age:'나이 많음',adapt:'적응 우려'};
/* 직전 리그 수준 보정(KBO=0). [타자, 투수]: 양수면 KBO보다 쉬운 리그라 같은 선수도 성적이 좋게 나온다.
   KBO는 대략 트리플A 수준. 기준(능력 60): 타자 OPS 트리플A .85 · 더블A .92 · MLB .72(MLE 더블A→MLB 약 0.78배),
   투수 ERA 트리플A 3.6 · 더블A 2.9 · MLB 5.2 안팎. 멕시코리그·CPBL은 타고투저, NPB 2군은 투고타저 */
const LG_ADJ={'MLB':[-12,-26],'트리플A':[1,1],'더블A':[7,13],'독립리그':[8,15],'멕시코리그':[8,-4],'도미니카 윈터리그':[3,5],'베네수엘라 윈터리그':[3,5],
  'NPB 1군':[-7,-12],'NPB 2군':[-1,6],'일본 독립리그':[8,14],'CPBL':[7,2],'ABL':[9,11]};
/* 화면에 보여 줄 리그 수준(KBO 기준). 같은 성적이라도 위쪽 리그 선수가 더 좋은 선수다 */
const LG_LV={'MLB':['우리 리그보다 훨씬 높음','같은 성적이면 훨씬 좋은 선수입니다. 다만 출전이 적어 표본이 작습니다.'],'트리플A':['우리 리그와 비슷','성적을 거의 그대로 믿어도 됩니다.'],
  'NPB 1군':['우리 리그보다 높음','같은 성적이면 더 좋은 선수입니다. 투고타저 리그라 투수 성적은 조금 깎아서 보세요.'],'NPB 2군':['우리 리그와 비슷(투고타저)','타자 성적은 조금 얹어서, 투수 성적은 깎아서 보세요.'],
  '도미니카 윈터리그':['우리 리그보다 조금 낮음','성적을 조금 깎아서 보세요.'],'베네수엘라 윈터리그':['우리 리그보다 조금 낮음','성적을 조금 깎아서 보세요.'],
  'CPBL':['우리 리그보다 낮음(타고투저)','타자 성적은 크게 깎아서 보세요. 투수 성적은 리그 타고 탓에 덜 깎아도 됩니다.'],
  '더블A':['우리 리그보다 낮음','성적을 꽤 깎아서 보세요. 같은 성적이라도 트리플A·MLB 선수보다 약합니다.'],'멕시코리그':['우리 리그보다 낮음(극단적 타고투저)','타자 성적은 크게 깎아서 보세요. 투수는 ERA가 높아도 실력이 나쁘지 않을 수 있습니다.'],
  '독립리그':['우리 리그보다 많이 낮음','성적을 크게 깎아서 보세요.'],'일본 독립리그':['우리 리그보다 많이 낮음','성적을 크게 깎아서 보세요.'],'ABL':['우리 리그보다 많이 낮음','성적을 크게 깎아서 보세요.']};
const lgLv=l=>(LG_LV[l]||['',''])[0];
function newForeign(kind,opts){
  opts=opts||{};
  const asia=kind==='아시아'; const src=opts.src||(opts.market?'agent':null); const flv=opts.flv||0; const mineFind=src==='scout'&&opts.finder===G.user;
  const reg=opts.reg||(asia?(mineFind?wpick({jp:.4+2*intlLv('jp'),tw:.3+2*intlLv('tw'),au:.3+2*intlLv('au')}):pick(['jp','jp','tw','au'])):(mineFind?wpick({us:.6+2*intlLv('us'),la:.4+2*intlLv('la')}):pick(['us','us','us','la'])));
  const nk=reg==='la'?pick(['la','la','ve']):reg;
  const isP=opts.isP??(R()<.65);
  let base=asia?clamp(N(48.5,4),40,60):reg==='la'?clamp(N(53,6),43,69):clamp(N(54,5),44,69);
  if(src==='scout')base=clamp(base+flv*1.3+(R()<.07*flv?ri(3,6):0),40,72);
  /* 리그 수준 보정은 LG_ADJ(타자·투수 따로). 일본은 1군·2군·독립리그로 나눈다 */
  const lvl=[asia?{jp:wpick({'NPB 1군':.1,'NPB 2군':.55,'일본 독립리그':.35}),tw:'CPBL',au:'ABL'}[reg]:reg==='la'?pick(['멕시코리그','도미니카 윈터리그','베네수엘라 윈터리그']):{AAA:'트리플A',AA:'더블A',IND:'독립리그',MLB:'MLB'}[wpick({AAA:5,AA:2,IND:1,MLB:src==='scout'?.15:.3})]];
  lvl.push(...LG_ADJ[lvl[0]]);
  if(lvl[0]==='NPB 1군')base=clamp(base+5,40,66); if(lvl[0]==='일본 독립리그')base=clamp(base-1.5,40,60);
  if(lvl[0]==='더블A'||lvl[0]==='독립리그')base=clamp(base-1.5,40,72);
  /* 좋아 보이는 선수일수록 이유가 있다 */
  const fp=lvl[0]==='MLB'||base>=63?.7:base>=58?.28:.1; const flaw=R()<fp?pick(['inj','inj','age','adapt']):null;
  const age=flaw==='age'?ri(33,35):ri(25,32);
  const p=newPlayer({age,isP,base,pot:base+(age<28?ri(0,3):0),team:opts.team??null,foreign:asia?'아시아':'용병',nat:FN[nk].nat,name:genFName(nk)});
  /* 실전 감각(숨은 값): 툴(능력치 측정)로는 안 보이고 경기 기록에만 묻어나는 부분. 스카우트는 툴을 보고, 기록은 실전을 보여 준다.
     그래서 스카우트 평가만 믿으면 '툴은 좋은데 실전에서 약한 선수'를 고르기도 하고, 기록을 잘 읽으면 스카우트가 낮게 본 진짜를 건진다 */
  { const sx=Math.round(clamp(N(0,3.2),-6,6)*10)/10; if(sx){ for(const k in p.r)p.r[k]=clamp(p.r[k]+sx,20,80); p.pot=clamp(p.pot+sx,20,80); roundR(p); } p.sx=sx; }
  p.orig=reg; p.adapt=Math.round(clamp(N(50,13),20,80)); if(flaw==='adapt')p.adapt=ri(16,30); if(flaw==='inj')p.inj=clamp(.3+R()*.12,.3,.42); if(flaw)p.flaw=flaw;
  p.prevLvl=lvl[0];
  /* MLB 출신은 대부분 백업·콜업 선수라 출전이 적다(경기 수와 타석·이닝을 맞춘다) */
  const mlb=lvl[0]==='MLB'; const mg=mlb?(isP?ri(10,32):ri(25,80)):0;
  p.prev=isP?Object.assign({lvl:lvl[0]},simPit(p,mlb?Math.round(mg*rnd(2.6,4.2)):ri(150,420),lvl[2])):Object.assign({lvl:lvl[0]},simBat(p,mlb?Math.round(mg*rnd(2.4,3.6)):ri(280,520),lvl[1]));
  p.prev.g=mlb?mg:isP?ri(18,40):Math.round(p.prev.pa/4.1);
  p.ask=fAsk(p); if(reg==='la')p.ask=round5(p.ask*.8); if(lvl[0]==='MLB')p.ask=round5(Math.min(F_NEW_CAP,p.ask*1.2)); if(flaw)p.ask=round5(p.ask*.88); p.sal=p.ask;
  if(src){ p.fsrc=src; p.fday=G.day; if(src==='scout'){ p.fknow=[opts.finder]; p.fpub=G.day+ri(14,45)-(base>=60?10:0); } else p.fpub=G.day; }
  return p;
}
/* 이 구단이 이 후보를 아는가 */
function fKnows(tid,p){ return !p||p.fsrc!=='scout'||G.day>=(p.fpub||0)||(p.fknow||[]).includes(tid); }
function fScoutLv(tid){ if(tid===G.user)return null; const sd=team(tid).scoutSd||6; return clamp((9-sd)/1.6,0,3); }
/* 매주 스카우트 발굴: 우리는 스카우트망 지역에서, 다른 구단은 스카우트 수준에 따라 */
function scoutFindWeek(silent){ const o=dobj(G.day); if(!(foreignOpen()||o.m===10||o.m===11))return; G.fmarket=G.fmarket||[]; if(G.fmarket.length>=46)return; const found=[];
  if(!G.unemp){ for(const r of Object.keys(IREG)){ const lv=intlLv(r); const isc=(G.scouts||[]).find(s=>s.role==='intl'&&s.region===r); const ch=lv>=1?.13*lv+(isc?isc.skill*.04:0):.03; if(R()<ch){ const asia=IREG[r].asia; const q=newForeign(asia?'아시아':'용병',{src:'scout',finder:G.user,flv:lv+(isc?isc.skill/3:0),reg:r}); G.fmarket.push(q.id); found.push(q); } } }
  for(const t of G.teams){ if(t.id===G.user)continue; const lv=fScoutLv(t.id); if(R()<.12+lv*.05){ const q=newForeign(R()<.25?'아시아':'용병',{src:'scout',finder:t.id,flv:lv}); G.fmarket.push(q.id); } }
  if(found.length&&!silent)mail('해외 스카우트',`발굴 보고: 새 후보 ${found.length}명`,`${found.map(q=>`${q.name}(${q.nat} · ${posLabel(q)} · ${q.age}세 · ${q.prevLvl})`).join('\n')}\n\n우리 스카우트가 직접 찾은 선수라 아직 다른 구단은 모릅니다. 소문이 나기 전에 판단하세요.`,{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]});
  return found; }
function refreshFMarket(n,drop){
  /* 에이전트 공용 후보를 최소 인원으로 유지하고, 오래 팔리지 않은 후보는 시장을 떠난다(관찰 중이면 남김) */
  G.fmarket=(G.fmarket||[]).filter(id=>G.players[id]&&G.players[id].team==null); const W=new Set((G.fwatch||[]).map(w=>w.id));
  for(const id of [...G.fmarket]){ const q=G.players[id]; if(q.fday==null)q.fday=G.day; if(!W.has(id)&&G.day-q.fday>80){ G.fmarket=G.fmarket.filter(x=>x!==id); delete G.players[id]; } }
  const ag=()=>G.fmarket.map(id=>G.players[id]).filter(q=>q&&q.fsrc!=='scout');
  for(let i=0;i<(drop||0);i++){ const old=ag().filter(q=>!W.has(q.id)).sort((a,b)=>a.fday-b.fday)[0]; if(!old)break; G.fmarket=G.fmarket.filter(x=>x!==old.id); delete G.players[old.id]; }
  /* 비시즌에는 후보가 넉넉해야 고르는 재미가 있다. 창단 첫해 겨울은 10개 구단이 한꺼번에 찾으므로 더 많이 */
  const fd0=G.startY===G.year&&period()!=='season'; const min=period()==='season'?9:fd0?34:22; let g=0;
  while(ag().length<min&&g++<40){ const ps=ag(); const asiaN=ps.filter(p=>p.foreign==='아시아').length; const yb=ps.filter(p=>p.foreign==='용병'); const batN=yb.filter(p=>!p.isP).length, pitN=yb.filter(p=>p.isP).length;
    const aMin=Math.round(min*.2), bMin=Math.round(min*.3), pMin=Math.round(min*.42);
    if(asiaN<aMin)G.fmarket.push(newForeign('아시아',{market:true}).id); else if(pitN<pMin)G.fmarket.push(newForeign('용병',{isP:true,market:true}).id); else if(batN<bMin)G.fmarket.push(newForeign('용병',{isP:false,market:true}).id); else G.fmarket.push(newForeign('용병',{market:true}).id); }
}
function foreignOpen(){ const per=period(); if(per==='post')return false; if(per==='season')return G.day<=foreignDL(); return G.day>=KD(12,1)||per==='pre'; }
function foreignCheck(tid,p,excludeId){
  const fs=foreignOf(tid).filter(x=>x.id!==excludeId);
  if(p.foreign==='아시아'){ if(fs.filter(x=>x.foreign==='아시아').length>=1)return '아시아쿼터는 1명까지입니다. 먼저 한 명을 방출하세요.'; return ''; }
  const yb=fs.filter(x=>x.foreign==='용병');
  if(yb.length>=3)return '외국인 선수(아시아쿼터 제외)는 3명까지입니다. 먼저 한 명을 방출하세요.';
  if(yb.length===2&&yb.every(x=>x.isP===p.isP))return `외국인 3명을 모두 ${p.isP?'투수':'타자'}로 채울 수 없습니다.`;
  const cap=fCap(tid); const tot=sum(yb.map(x=>x.sal))+p.ask; if(tot>cap)return `외국인 3명 연봉 총액이 한도 ${Math.round(cap/USD)}만 달러(약 ${money(cap)})를 넘습니다.`;
  return '';
}
function remainFrac(){ const c=G.cal; if(G.day<c.open)return 1; if(G.day>c.end)return 0; const left=Object.keys(c.sched).filter(d=>+d>G.day).length; return left/144; }
function signForeign(tid,id){
  const p=G.players[id];
  const mid=period()==='season';
  story(p,`${tname(tid)} 입단 (${p.foreign==='아시아'?'아시아쿼터':'외국인 선수'}, ${money(p.ask)})`,'move'); p.team=tid; p.sal=p.ask; p.yrs=1; if(G.formY===G.year&&!(p.sf&&p.sf.y===G.year))p.sf={y:G.year,v:clamp(N(0,3),-5,5),m:0}; p.fy=dobj(G.day).m>=10?G.year+1:G.year; if(p.adapt==null)p.adapt=Math.round(clamp(N(50,13),20,80));
  const cost=Math.round(p.ask*remainFrac());
  if(mid||G.day>=G.cal.open){ G.sea.fspend[tid]=(G.sea.fspend[tid]||0)+cost; }
  if(mid){ G.sea.repl[tid]=(G.sea.repl[tid]||0)+1; try{ gmInc(tid,'fRep'); }catch(e){} }
  G.fmarket=(G.fmarket||[]).filter(x=>x!==id); mvLog('외국인',p,null,tid,`${p.nat||''} ${money(p.ask)}${mid?' · 시즌 중 교체':''}`,p.ask);
  if(tid===G.user)addLog(`외국인 선수 ${p.name}(${p.nat}·${posLabel(p)})와(과) 연 ${money(p.ask)}에 계약했습니다.${mid?` 남은 기간분 ${money(cost)} 지급.`:''}`);
}
function releaseForeign(id){ const p=G.players[id]; if(!p)return; mvLog('방출',p,p.team,null,'외국인 선수'); if(p.team===G.user)addLog(`외국인 선수 ${p.name}을(를) 방출했습니다. 남은 연봉은 그대로 지급합니다.`); for(const k in G.lineup)if(G.lineup[k]===id)delete G.lineup[k]; delete G.players[id]; }
/* 외국인 시장은 10개 구단이 함께 쓴다. 구단마다 스카우트 오차를 안고 후보를 평가한다 */
function fNeed(tid){ const fs=foreignOf(tid); const yb=fs.filter(x=>x.foreign==='용병'); if(yb.length<3){ const needP=yb.filter(x=>x.isP).length<2, needB=yb.filter(x=>!x.isP).length<1; return {kind:'용병',isP:needP?true:needB?false:null}; } if(!fs.some(x=>x.foreign==='아시아'))return {kind:'아시아',isP:null}; return null; }
function fScoreBy(tid,q){ const t=team(tid); return ovr(q)-(q.team==null?(q.sx||0)*.9:0)+hn('fv'+tid,q.id)*(t.scoutSd||6)*.6-q.ask/600; }
function aiForeignPick(tid){ const nd=fNeed(tid); if(!nd)return null; const L=(G.fmarket||[]).map(id=>G.players[id]).filter(q=>q&&q.team==null&&!foHeld(q)&&fKnows(tid,q)&&q.foreign===nd.kind&&(nd.isP==null||q.isP===nd.isP)&&!foreignCheck(tid,q)); return L.sort((a,b)=>fScoreBy(tid,b)-fScoreBy(tid,a))[0]||null; }
function fInterest(q){ if(!q||q.team!=null)return 0; let n=0; for(const t of G.teams){ if(t.id===G.user)continue; const nd=fNeed(t.id); if(!nd||!fKnows(t.id,q)||nd.kind!==q.foreign||(nd.isP!=null&&nd.isP!==q.isP))continue;
    const L=(G.fmarket||[]).map(id=>G.players[id]).filter(x=>x&&x.team==null&&fKnows(t.id,x)&&x.foreign===nd.kind&&(nd.isP==null||x.isP===nd.isP)).sort((a,b)=>fScoreBy(t.id,b)-fScoreBy(t.id,a)).slice(0,3); if(L.includes(q))n++; } return n; }
function aiForeignSign(tid,q,why){ signForeign(tid,q.id); if(fwatchOn(q.id))mail('스카우트팀장',`관찰 후보 ${q.name}, ${tshort(tid)}와(과) 계약`,`관찰 명단에 있던 ${q.name}(${posLabel(q)})을(를) ${tname(tid)}이(가) 연 ${money(q.ask)}에 먼저 데려갔습니다.${why||''}`,{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); else if(ovr(q)>=60)wire('외국인',`${tshort(tid)}, 외국인 ${posLabel(q)} ${q.name} 영입 (${money(q.ask)})`,{tid,ref:q.id}); }
/* 스토브리그·캠프 기간: 구단들이 하루하루 시장에서 데려간다. 인기 선수는 몸값이 오른다 */
function aiForeignDaily(){ if(!foreignOpen()||period()==='season')return; const o=dobj(G.day); const pr=o.m===1||o.m===2?.12:.06;
  for(const t of G.teams){ if(t.id===ME()||!fNeed(t.id))continue; if(R()<pr){ const q=aiForeignPick(t.id); if(q)aiForeignSign(t.id,q); } } }
function fBidWeek(){ try{ scoutFindWeek(); }catch(err){} if(!foreignOpen())return; { const n=R()<.5?1:R()<.5?2:0; for(let i=0;i<n;i++){ const q=newForeign(R()<.22?'아시아':'용병',{market:true}); G.fmarket.push(q.id); } } for(const id of (G.fmarket||[])){ const q=G.players[id]; if(!q||q.team!=null)continue; const n=fInterest(q); q.fint=n; if(q.ask0==null)q.ask0=q.ask; if(n>=2&&q.ask<q.ask0*1.3)q.ask=round5(Math.min(q.ask*1.04,q.foreign==='아시아'?ASIA_CAP:F_NEW_CAP)); } }
function aiForeignFill(tid){
  { const q=aiForeignPick(tid); if(q){ aiForeignSign(tid,q); return; } }
  const fs=foreignOf(tid); const yb=fs.filter(x=>x.foreign==='용병');
  if(yb.length<3){ const needP=yb.filter(x=>x.isP).length<2, needB=yb.filter(x=>!x.isP).length<1;
    const want=needP?true:needB?false:R()<.6;
    const p=newForeign('용병',{isP:want}); while(foreignCheck(tid,p)&&p.ask>300)p.ask=round5(p.ask*.85);
    if(!foreignCheck(tid,p))signForeign(tid,p.id); else delete G.players[p.id]; return; }
  if(!fs.some(x=>x.foreign==='아시아')){ const p=newForeign('아시아'); signForeign(tid,p.id); }
}
function aiForeignReview(tid){
  if((G.sea.repl[tid]||0)>=F_REPL_MAX)return;
  for(const p of foreignOf(tid).filter(x=>x.foreign==='용병')){
    const h=seasonTotal(p,G.year,'1군');
    const bad=p.injOut>45||(G.day>G.cal.open+40&&h&&(p.isP?(h.outs>=120&&pRate(h).era>5.4):(h.pa>=160&&bRate(h).ops<.690)));
    if(bad&&R()<.5){ const nm=p.name; releaseForeign(p.id); aiForeignFill(tid); wire('외국인',`${tname(tid)}이(가) 외국인 선수 ${nm}을(를) 교체했습니다.`,{tid}); return; }
  }
}

