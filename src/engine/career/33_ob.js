/* ===== OB: 은퇴 선수의 두 번째 인생 (코치·스카우트·프런트·해설 → 감독·단장) ===== */
const OBPATH={coach:'지도자',scout:'스카우트',front:'프런트',media:'해설위원'};
function obInit(){ if(G.ob)return; G.ob=[]; G.obFace=G.obFace||{}; G.obSeq=G.obSeq||0;
  // 리그 초창기 레전드: 구단마다 2명, 일부는 이미 지도자·프런트로 일하고 있다
  for(const t of G.teams)for(let i=0;i<2;i++){ const war=+(i===0?rnd(18,72):rnd(8,30)).toFixed(1); const retY=G.year-ri(1,12); const isP=R()<.45;
    const ob=obMake({fid:'obs'+t.id+'_'+i,name:genName(),isP,pos:isP?(R()<.6?'선발':'불펜'):pick(['포수','1루수','2루수','3루수','유격수','좌익수','중견수','우익수']),team:t.id,ys:i===0?ri(10,17):ri(6,12),war,seasons:ri(10,18),age:retY>0?G.year-retY+ri(34,39):40,retY,awards:war>=26?ri(1,4):0,cat:!isP&&R()<.15});
    ob.cy=ob.path==='coach'?Math.max(0,G.year-retY-1):0; ob.sy=ob.path==='scout'?G.year-retY:0; ob.fy=ob.path==='front'?G.year-retY:0; ob.my=ob.path==='media'?G.year-retY:0;
    ob.sk=clamp(ob.sk+Math.min(8,ob.cy),30,82); ob.dv=clamp(ob.dv+Math.min(8,ob.cy),30,82); }
  // 이미 일자리가 있는 OB: 다른 구단 코치·프런트
  for(const ob of G.ob){ if(G.year<ob.readyY)continue;
    if(ob.path==='coach'&&G.coach&&R()<.65){ const tids=G.teams.filter(t=>t.id!==G.user).map(t=>t.id); const tid=R()<.5&&ob.team!==G.user?ob.team:pick(tids); const c=obCoach(ob); c.yrs=ri(1,3); G.coach[tid][c.role]=c; }
    else if(ob.path==='front'||ob.path==='scout'){ const tid=ob.team!==G.user?ob.team:pick(G.teams.filter(t=>t.id!==G.user)).id; ob.alt={k:'front',tid,t:`${tshort(tid)} ${ob.path==='scout'?'스카우트':'프런트'}`}; } }
  // 우리 구단 첫 레전드에게는 영구결번이 있을 수도 있다
  const mineOB=G.ob.filter(o=>o.team===G.user).sort((a,b)=>b.war-a.war)[0];
  if(mineOB&&mineOB.war>=retWarT()&&mineOB.ys>=10&&!(G.retNos||[]).length){ mineOB.no=1+Math.floor(u01('jno',mineOB.fid)*99); (G.retNos=G.retNos||[]).push({name:mineOB.name,no:mineOB.no,y:mineOB.retY,ob:mineOB.id}); mineOB.retNo=true; } }
function obMake(o){ G.obSeq=(G.obSeq||0)+1; const pers=o.pers||{pro:ri(4,20),amb:ri(4,20),loy:ri(4,20),temp:ri(4,20)};
  const fame=Math.round(clamp((o.hof?86:o.war>=24||o.awards>=2?72:30)+o.war*.6+N(0,4),25,95));
  const w=[['coach',4+(o.cat?3:0)+pers.pro/5],['scout',2+(pers.pro<10?1:0)],['front',1.5+pers.amb/8],['media',2+(fame>=70?2:0)]]; let x=R()*sum(w.map(a=>a[1])), path='coach'; for(const [k,v] of w){ x-=v; if(x<=0){ path=k; break; } }
  const aim=pers.amb>=13?(path==='coach'||path==='media'?'mgr':'gm'):null;
  const ob={id:'ob'+G.obSeq,fid:o.fid,name:o.name,isP:o.isP,pos:o.pos,team:o.team,ys:o.ys||0,mine:o.team===G.user,war:o.war||0,seasons:o.seasons||0,awards:o.awards||0,hof:!!o.hof,
    retY:o.retY,age:o.age,pers,fame,path,aim,sk:Math.round(clamp(44+Math.min(10,o.war*.3)+(o.cat?4:0)+pers.pro*.35+N(0,4),32,72)),dv:Math.round(clamp(44+pers.pro*.5+pers.loy*.15+N(0,5),32,72)),
    sc:clamp(Math.round(1.5+pers.pro/8+R()),1,5),readyY:o.retY+(path==='media'?ri(2,5):path==='coach'?(R()<.5?0:1):0),cy:0,sy:0,fy:0,my:0,bond:o.team===G.user?10:0,log:[],pr:o.pr||null};
  G.ob.push(ob); return ob; }
function obFromPlayer(p,rec){ if(!G.ob)obInit(); const c=careerOf(p); let war=rec?rec.war:+c.war.toFixed(1); let seasons=rec?rec.seasons:c.seasons.size; const by=c.byTeam[p.team]; let ys=by?by.ys.size:0;
  const fm=p.team===G.user&&G.fd?fdMine(p):undefined; if(fm!==undefined)ys=fm?fm.ys:0; /* 창단 게임: 창단 이후만 우리 구단 경력 */
  if(rec&&rec.mine&&p.team===G.user)ys=Math.max(ys,rec.mine.ys);
  const miss=Math.max(0,(p.svc||0)-seasons); if(miss){ seasons+=miss; war=+(war+miss*clamp((p.pot-45)/5,0,4.5)).toFixed(1); if(c.teams.size<=1&&fm===undefined)ys+=miss; } /* 기록이 남기 전(게임 시작 전) 경력은 연차와 잠재력으로 추정 */
  if(seasons<5&&war<5&&!(p.team===G.user&&ys>=3)&&!obMinorOk(p))return null; /* 짧은 경력도 일부는 야구계에 남는다(33b_ob_cycle) */ initPers(p);
  const ob=obMake({fid:p.id,name:p.name,isP:p.isP,pos:posLabel(p),team:p.team,ys,war,seasons,age:p.age,retY:G.year,awards:(p.aw||[]).length,hof:rec&&rec.hof,cat:!p.isP&&p.pos==='C',pers:{...p.pers},pr:{...p.r}});
  /* 은퇴 심사 때 먼저 지정된 AI 구단 결번을 새 OB 인물에 연결한다. */
  for(const r of (rec&&rec.retNos)||[]){ const row=retNosOf(r.tid).find(n=>n.pid===p.id&&n.no===r.no); if(row)row.ob=ob.id; ob.retNo=true; (ob.retNos=ob.retNos||[]).push({...r}); }
  ob.mineWar=fm!==undefined?(fm?fm.war:0):rec&&rec.mine?rec.mine.war:p.team===G.user?+(war*(ys/Math.max(1,seasons))).toFixed(1):c.byTeam[G.user]?+c.byTeam[G.user].war.toFixed(1):0; ob.school=p.school||null; ob.area=p.area||null; /* 모교로 돌아가 고교 감독이 되기도 한다(11-08c) */ ob.no=rec&&rec.canRetNo?rec.no:jno(p); if(rec&&rec.canRetNo)ob.canRetNo='p'+p.id;
  ob.hb=(p.th||'')+(p.bt||''); try{ bodyOf(p); ob.ht=p.ht; }catch(e){} /* 아들에게 물려줄 투타·키(2대 선수, 11-09r) */
  ob.tys={}; for(const t in c.byTeam)ob.tys[t]={ys:c.byTeam[t].ys.size,war:+c.byTeam[t].war.toFixed(1)}; if(ob.mine||ob.mineWar)ob.tys[G.user]={ys:ob.mine?ys:(ob.tys[G.user]||{}).ys||0,war:ob.mineWar}; /* 실제로 뛴 구단별 경력: 이직해도 '우리 구단 출신'이 맞게(검수 11-09zp) */ const result=obCycle(ob,p);if(result)personNetworkTrace('ob',result,'은퇴',p.team);return result; }
/* 지금 맡은 구단 출신인가·그 구단 경력: 뛴 구단 기록(tys)으로. 옛 저장은 은퇴 때 소속 */
function obMine(o){ return o.tys?!!(o.tys[G.user]&&o.tys[G.user].ys):o.team===G.user; }
function obMineC(o){ return o.tys?(o.tys[G.user]||{ys:0,war:0}):o.team===G.user?{ys:o.ys,war:o.mineWar||0}:{ys:0,war:0}; }
/* 지금 어디서 무엇을 하는가 */
function obWhere(ob){ for(const t of G.teams){ const m=G.mgr[t.id]; if(m&&m.ob===ob.id)return {k:'mgr',tid:t.id,t:`${t.city} ${t.nick} 감독`}; if(t.gm&&t.gm.ob===ob.id)return {k:'gm',tid:t.id,t:`${t.city} ${t.nick} 단장`};
    const C=G.coach&&G.coach[t.id]; if(C)for(const r of CKEYS)if(C[r]&&C[r].ob===ob.id)return {k:'coach',tid:t.id,role:r,t:`${t.city} ${t.nick} ${CROLE[r].l}`}; }
  if((G.scouts||[]).some(s=>s.ob===ob.id))return {k:'scout',tid:G.user,t:`${tshort(G.user)} 스카우트`};
  for(const [tid,X] of [[G.user,G.coachX],...Object.entries(G.orgT||{}).map(([k,o])=>[+k,o&&o.coachX])]){ const c=(X||[]).find(x=>x.ob===ob.id); if(c)return {k:'coach',tid,ax:c,t:`${tshort(tid)} 보조 코치`}; } /* 떠난 구단에 남긴 보조 코치도 재직(검수 11-09zv #2). ax: 보조 코치 본인(정식 보직 role이 없다) */
  for(const tid in (G.lgStaff||{}))if((G.lgStaff[tid].sc||[]).some(s=>s.ob===ob.id))return {k:'scout',tid:+tid,t:`${tshort(+tid)} 스카우트`}; /* 다른 구단 스카우트도 재직으로 본다(검수 11-09e #15) */
  if(G.year<ob.readyY)return {k:'wait',t:ob.path==='media'?'해설위원':ob.path==='coach'?'지도자 연수 중':'휴식 중'};
  if(ob.alt)return {k:ob.alt.k,tid:ob.alt.tid,t:ob.alt.t};
  return {k:'free',t:ob.am||(ob.path==='media'?'해설위원':`${OBPATH[ob.path]} 자리를 찾는 중`)}; } /* am: 아마추어 지도자(프로 자리는 비어 있어 후보로 남는다) */
function obRole(ob){ if(ob.isP)return ob.cy>=6?'hc':ob.cy<2&&R()<.5?'fp':'pc'; if(ob.pos==='포수')return 'cc'; const r=pick(['bc','bc','dc','rc','fb']); return ob.cy>=6&&R()<.4?'hc':r; }
/* 은퇴 선수 코치의 세부 능력: 지도자 수준(ob.sk·dv, 경력으로 오름)에 선수 시절 강점의 모양을 얹는다. 제구가 좋던 투수는 제구 지도, 포수 출신은 포수 지도.
   소통은 충성심·성격(무던할수록), 데이터는 프로의식, 유망주 육성은 육성력 */
function obAb(ob,role){ const P=ob.pers||{pro:10,amb:10,loy:10,temp:10}; const h=k=>hn('oab'+k,String(ob.id)); const a={}; for(const k in CAB)a[k]=44+h(k)*6;
  const pr=ob.pr; const keys=ob.isP?['stf','ctl','sta']:['con','pow','eye','spd','def'];
  if(pr){ const m=avg(keys.map(k=>pr[k]||50)); for(const k of keys)a[k]=ob.sk+((pr[k]||50)-m)*.6+h('s'+k)*3; } else for(const k of keys)a[k]=ob.sk+h('s'+k)*5;
  if(ob.cat||ob.pos==='포수')a.cat=ob.sk+5+h('cat')*3;
  a.com=40+P.loy*.4+(20-P.temp)*.6+h('com')*4; a.ana=38+P.pro*.8+h('ana')*5;
  for(const k of CDOM[role])if(!keys.includes(k)&&k!=='cat'&&k!=='com')a[k]=Math.max(a[k],ob.sk+h('r'+k)*4);
  const D=CDOM[role]; const dom=avg(D.map(k=>a[k])); a.yng=ob.dv*2-dom+h('y')*2;
  for(const k in a)a[k]=clamp(Math.round(a[k]),25,88); return a; }
function obCoach(ob){ const role=obRole(ob); const c={id:'c'+ob.id,name:ob.name,age:ob.age,role,sk:ob.sk,dv:ob.dv,car:`${tshort(ob.team)} ${ob.hof?'명예의 전당 ':ob.fame>=70?'레전드 ':''}출신 · 통산 WAR ${ob.war}`,sal:round5(clamp(55+(Math.max(ob.sk,ob.dv)-50)*4.5+(ob.fame>=70?40:0),45,340)),yrs:0,clan:null,ob:ob.id,star:ob.fame>=70};
  c.ab=obAb(ob,role); coachSync(c); G.obFace[c.id]=ob.fid; return applyPersonRelation(c,'coach'); }
function obCands(kind,minor){ obInit(); return G.ob.filter(o=>{ const w=obWhere(o); return w.k==='free'&&o.age<=66&&(kind==='coach'?(minor||!o.minor)&&(o.path==='coach'||o.path==='media'&&o.my>=3):kind==='scout'?(o.path==='scout'||o.path==='front'&&o.fy<3):false); }); }
function obMgrCands(){ obInit(); return G.ob.filter(o=>{ const w=obWhere(o); if(w.k==='mgr'||w.k==='gm'||o.age>66||o.age<42)return false; return (o.cy>=5&&(o.sk>=58||o.aim==='mgr'))||(o.fame>=72&&(o.cy>=2||o.my>=4))||(obMine(o)&&obMineC(o).ys>=8&&o.cy>=3); }); } /* 우리 구단 레전드(8시즌 이상)는 지도자 3년이면 감독 후보(사용자 11-08) */
function obMgr(ob){ const m=mkMgr(); m.name=ob.name; m.age=ob.age; m.fame=clamp(ob.fame+Math.min(10,ob.cy),20,95); m.tac=clamp(Math.round(ob.sk+N(0,4)),30,90); m.youth=clamp(Math.round(ob.dv+N(0,8)),15,88); m.ego=clamp(Math.round(ob.pers.temp*3.5+20+(ob.fame>=70?10:0)),20,95);
  m.career=`${tshort(ob.team)} ${ob.fame>=70?'레전드':''} 출신 · 지도자 경력 ${ob.cy}년${ob.my?` · 해설 ${ob.my}년`:''}`; m.ob=ob.id; m.id='g'+ob.id; G.obFace[m.id]=ob.fid; m.sal=round5(clamp(220+(m.tac-50)*9+Math.max(0,m.fame-55)*9,180,1200)); m.clan=[]; return applyPersonRelation(m,'mgr'); }
function obGMCands(){ obInit(); return G.ob.filter(o=>{ const w=obWhere(o); if(w.k==='gm'||w.k==='mgr'||o.age>64||o.age<40)return false; return (o.fy+o.sy>=(o.minor?10:6)&&(o.aim==='gm'||o.pers.amb>=11))||(o.fy>=4&&o.fame>=70); }); }
function obGM(ob,tid){ const g=mkGM(tid); g.name=ob.name; g.age=ob.age; const P=ob.pers; g.trait=P.loy>=15?'loyal':P.temp>=15?'hard':P.pro>=15?'data':P.amb>=16?'gambler':ob.sy>=ob.fy?'prospect':g.trait;
  g.car=`${tshort(ob.team)} ${ob.pos} 출신 · ${ob.sy?`스카우트 ${ob.sy}년`:''}${ob.sy&&ob.fy?' · ':''}${ob.fy?`프런트 ${ob.fy}년`:''}`; g.ob=ob.id; g.id='m'+ob.id; G.obFace[g.id]=ob.fid; return g; }
/* 겨울마다: 경력 연차가 쌓이고, 능력이 자라고, 일부는 자리를 옮긴다 */
function obYear(){ obInit(); for(const ob of G.ob)try{ if(ob.retY!==G.year)ob.age++; /* 올해 은퇴한 사람은 은퇴 소식의 나이 그대로(사용자 피드백 11-05: 은퇴 38세·코치 시장 39세) */ const w=obWhere(ob);
    if(w.k==='coach'){ ob.cy++; const c=w.ax||G.coach[w.tid][w.role]; if(ob.age<=56)cGrow(c,ri(0,2)); else if(ob.age>=61)cGrow(c,-ri(0,2)); /* 60대부터는 현장 감각이 떨어진다 */ ob.sk=c.sk; ob.dv=c.dv; c.age=ob.age; }
    else if(w.k==='mgr'){ ob.cy++; } else if(w.k==='scout'){ ob.sy++; const s=G.scouts.find(x=>x.ob===ob.id); if(s&&ob.sy%3===0&&s.skill<5)s.skill++; ob.sc=s?s.skill:ob.sc; }
    else if(w.k==='front'||ob.alt&&ob.alt.k==='front'){ ob.fy++; } else if(ob.path==='media'&&G.year>=ob.retY){ ob.my++; }
    else if(w.k==='free'&&G.year>=ob.readyY){ // 자리를 못 찾으면 일부는 다른 구단 프런트·2군으로 간다
      if(ob.path==='front'||ob.path==='scout'){ if(R()<.6){ const tid=R()<.5?ob.team:pick(G.teams).id; if(tid!==G.user)ob.alt={k:'front',tid,t:`${tshort(tid)} ${ob.path==='scout'?'스카우트':'프런트'}`}; } }
      if(ob.alt&&ob.alt.k==='front'){ ob.fy++; if(ob.path==='scout'){ ob.sy++; ob.fy--; } } }
    if(ob.path==='media'&&ob.my>=3&&R()<.25){ ob.path='coach'; ob.log.push({y:G.year,t:'해설을 접고 지도자의 길을 택했습니다'}); } }catch(e){} /* 한 사람의 오류가 뒤 사람의 연간 처리를 멈추지 않게(검수 11-09zv #1) */
  /* OB 명단 정리: 75세 이상, 또는 66세 이상이면서 지금 자리가 없고 우리 구단 출신·명예의 전당이 아니면 명단에서 내린다(명단이 끝없이 커지지 않게) */
  const fathers=new Set(Object.values(G.players).map(p=>p.father).filter(Boolean)); /* 현역·신인과 연결된 아버지는 인물 링크를 보존한다 */
  const keep=ob=>{ if(fathers.has(ob.id))return true; if(ob.age>=75)return false; if(ob.age<66)return true; const w=obWhere(ob); if(w.k==='coach'||w.k==='mgr'||w.k==='scout')return true; if(obMine(ob)||ob.hof||ob.retNo)return true; return false; };
  G.ob=G.ob.filter(keep); }
/* AI 구단이 OB를 쓰는 곳 */
function obAiCoach(tid,role){ const L=obCands('coach',CROLE[role].g===2) /* 짧은 경력 OB는 2군·잔류군 자리만 */.filter(o=>!(G.cmarket||[]).some(c=>c.ob===o.id&&(c.role!==role||c.res===G.user||(c.from===ME()&&c.fromY===G.year)))); /* 우리 우선 협상 후보는 데려가지 않는다(검수 11-09zw #22) */ /* 이번 겨울 우리와 계약이 끝난 코치는 단장이 먼저 볼 수 있게 AI가 같은 날 바로 데려가지 않는다 */ const own=L.filter(o=>o.team===tid&&o.ys>=5); const ob=own.length&&R()<.7?own.sort((a,b)=>b.fame-a.fame)[0]:L.length&&R()<.85?pick(L):null; /* 빈자리는 대부분 은퇴 선수로 채운다(사용자 11-08c: 우리 풀 안에서) */ if(!ob)return null; const c=obCoach(ob); /* 자기 구단 출신을 먼저 부른다(레전드의 친정 복귀, 사용자 11-08) */ c.role=role; try{ coachSync(c); }catch(e){} c.yrs=ri(1,3);
  if(obMine(ob))wire('코치',`${tshort(ob.team)} 출신 ${ob.name}, ${tshort(tid)} ${CROLE[role].l}로 합류`,{tid}); G.cmarket=(G.cmarket||[]).filter(x=>x.ob!==ob.id); return c; }
function obAiMgr(tid){ const L=obMgrCands(); if(!L.length||R()>.35)return null; const ob=L.sort((a,b)=>(b.team===tid)-(a.team===tid)||b.fame-a.fame)[0]; const m=obMgr(ob); m.yrs=ri(2,3); /* 친정 출신 우선 */ ob.log.push({y:G.year,t:`${tshort(tid)} 감독 취임`}); obTaken(ob.id,m);
  wire('감독',`${tshort(tid)}, ${tshort(ob.team)} 출신 ${ob.name} 감독 선임`,{tid}); if(obMine(ob))mail('홍보팀',`우리 구단 출신 ${ob.name}, ${tshort(tid)} 감독으로`,`${ob.name}이(가) ${tshort(tid)}의 새 감독이 됐습니다. ${ob.ys}시즌을 우리 유니폼을 입고 뛰었던 선수입니다.`,{kind:'OB'}); return m; }
function obAiGM(tid){ const L=obGMCands(); if(!L.length||R()>.45)return null; const ob=L.sort((a,b)=>(b.fy+b.sy+b.fame/10)-(a.fy+a.sy+a.fame/10))[0]; const g=obGM(ob,tid); ob.alt=null; obTaken(ob.id,g); ob.log.push({y:G.year,t:`${tshort(tid)} 단장 취임`});
  if(obMine(ob)){ team(tid).rel=clamp(66+Math.round(ob.bond/2),0,100); mail('홍보팀',`우리 구단 출신 ${ob.name}, ${tshort(tid)} 단장으로`,`${ob.name}이(가) ${tshort(tid)} 단장에 올랐습니다. 우리 구단 출신이라 첫 친분은 높게 시작합니다.`,{kind:'OB'}); } return g; }
/* 우리 선수 은퇴: 은퇴식·영구결번·구단에 남기기 */
function obRetireEvents(list){ const L=list.filter(o=>o&&o.mine&&(o.ys>=3)).sort((a,b)=>b.mineWar-a.mineWar).slice(0,3);
  for(const ob of L){ const leg=ob.mineWar>=12||ob.ys>=8; const rn=ob.canRetNo!=null; const stay=ob.path==='media'?null:ob.path==='coach'?'코치 우선 협상 후보로 등록':ob.path==='scout'?'스카우트로 채용':'프런트 직원으로 채용';
    const opts=[{l:rn?'레전드 은퇴식과 영구결번 (1억)':leg?'레전드 은퇴식 (5천만)':'은퇴식 열어 주기 (2천만)',fx:rn?`${ob.no}번 영구결번. 팬 여론이 크게 오르고, 훗날 구단으로 돌아올 가능성이 커집니다.`:'팬 여론이 오르고, 훗날 구단으로 돌아올 가능성이 커집니다.'}];
    if(stay)opts.push({l:`은퇴식 + ${stay}`,fx:`은퇴식을 열어 주고(비용 같음) 구단에 남깁니다.${ob.path==='scout'?' 스카우트 자리가 꽉 차 있으면 한 자리를 비워 둘 때까지 후보 맨 앞에 둡니다.':''}`}); /* 둘 다(커뮤니티 요청 11-07) */
    if(stay)opts.push({l:stay,fx:ob.path==='coach'?'코치 후보에 우선 협상 대상으로 올라옵니다(연봉 20% 할인).':ob.path==='scout'?'빈자리가 있으면 바로 스카우트로 합류합니다.':'우리 프런트에서 일하며 경력을 쌓습니다. 언젠가 다른 구단 단장이 될 수도 있습니다.'});
    opts.push({l:'조용히 보내 주기',fx:`${OBPATH[ob.path]}의 길을 스스로 찾습니다.`});
    evNew('ret',`${ob.name} 은퇴`,`${ob.name}(${ob.pos}, ${ob.age}세)이(가) 은퇴합니다. 우리 구단에서 ${ob.ys}시즌 · WAR ${ob.mineWar}. 은퇴 후 ${ob.path==='media'?'해설위원 제안을 받았다고 합니다':`${OBPATH[ob.path]}의 길을 생각하고 있습니다`}${ob.aim?` (${ob.aim==='mgr'?'언젠가 감독':'언젠가 단장'}을 꿈꿉니다)`:''}.`,opts,{from:ob.name,face:'ob:'+ob.id,data:{ob:ob.id,rn:ob.canRetNo,leg,stay:!!stay,combo:!!stay},def:opts.length-1,exp:10}); } }
EVH.ret={ pick(e,i){ const ob=(G.ob||[]).find(o=>o.id===e.data.ob); if(!ob)return ''; if(e.data.combo){ if(i===1){ const a=EVH.ret.pick({...e,data:{...e.data,combo:false}},0), b=EVH.ret.pick({...e,data:{...e.data,combo:false}},1); return a+' '+b; } if(i>=2)i--; } const t=team(G.user); const L=e.opts.length;
    if(i===0){ let r=''; const n0=(G.retNos||[]).length; if(e.data.rn!=null)r=retireNumber(e.data.rn); const rn=(G.retNos||[]).length>n0; /* 지정이 거절되면(이미 쓰인 번호 등) 일반 은퇴식 비용만, 결번 표시 없이(검수 11-09zz) */ const cost=rn?100:e.data.leg?50:20; G.spend.etc=(G.spend.etc||0)+cost; ob.bond+=rn?30:20; ob.ceremony=G.year;
      if(rn)ob.retNo=true; const f=rn?5:e.data.leg?3:1; G.pr.fan=clamp(G.pr.fan+f,0,100);
      const lg=rn||e.data.leg; news('선수',`${t.city} ${t.nick} ${ob.name} ${lg?'레전드 ':''}은퇴식${rn?`, ${ob.no}번 영구결번`:''}`,lg?`만원 관중이 홈구장을 채운 가운데 ${ob.ys}시즌 동안 뛴 ${ob.name}의 레전드 은퇴식이 열렸습니다. 동료들의 헹가래와 은퇴 기념 영상, 가족과 함께한 시구 속에 마지막 인사를 했습니다.`:`${ob.ys}시즌 동안 뛴 ${ob.name}이(가) 팬들 앞에서 마지막 인사를 했습니다.`,rn?3:2,{fanW:1}); if(lg)try{ chron('honor',`${ob.name} 레전드 은퇴식${rn?` · ${ob.no}번 영구결번`:''}`,null,G.user,{source:'legcer:'+ob.id}); }catch(x){} /* 레전드 급은 제대로(사용자 11-11) */
      return `${r?r+' ':''}은퇴식 비용 ${money(cost)}. 팬 여론 +${f}.`; }
    if(i===1&&e.data.stay){ ob.bond+=15; ob.readyY=G.year;
      if(ob.path==='coach'){ const c=obCoach(ob); c.sal=round5(c.sal*.8); c.res=G.user; G.cmarket=(G.cmarket||[]).filter(x=>x.ob!==ob.id); G.cmarket.unshift(c); return `${ob.name}이(가) 코치 후보 맨 앞에 올라왔습니다(${CROLE[c.role].l}, 연 ${money(c.sal)}).`; }
      if(ob.path==='scout'){ const s=obScout(ob); if(G.scouts.length<scoutMax()){ s.since=G.day; G.scouts.push(s); return `${ob.name}이(가) 스카우트로 합류했습니다.`; } G.scoutMarket.unshift(s); return '스카우트 자리가 꽉 차서 후보 명단에 올렸습니다.'; }
      ob.alt={k:'front',tid:G.user,t:`${t.city} ${t.nick} 프런트`}; return `${ob.name}이(가) 우리 프런트에서 일을 시작합니다.`; }
    return ''; } };
function obScout(ob){ const s=mkScout(ob.sc); s.name=ob.name; s.ob=ob.id; s.spec=ob.isP?'P':'B'; s.car=`${tshort(ob.team)} ${ob.pos} 출신 · ${ob.isP?'투수':'타자'}를 더 정확히 봄`; /* 선수 출신 스카우트: 자기 쪽(투수·타자)을 더 잘 본다 */ s.fid=ob.fid; s.id='s'+ob.id; G.obFace[s.id]=ob.fid;if(ob.age!=null)s.age=ob.age;return applyPersonRelation(staffAttach(s,'scout'),'scout'); }

/* ===== 2대 선수(사용자 11-09r): 은퇴한 국내 선수(OB)의 아들이 커서 신인 드래프트에 나온다 =====
 실제 KBO 부자 선수는 40여 년에 수십 쌍 정도로 드물다. 정확한 비율 통계는 없어 추정:
 1군 5시즌 이상 또는 통산 WAR 8 이상인 OB 중 4%만 프로를 노리는 아들을 두고, 은퇴 15~25년 뒤(대부분 18~22년, 아들 고졸 18세·대졸 22세) 드래프트에 나온다. 한 해 최대 2명.
 아들에게는 아버지 OB id(p.father) 하나만 저장한다 */
const SON_Z=-1.75; /* hn은 표준정규 해시라 이보다 작을 확률이 약 4%(u01은 고르지 않아 쓰지 않는다) */
function sonDue(o){ return !o.minor&&(o.seasons>=5||o.war>=8)&&hn('son',o.id)<SON_Z&&o.retY+15+Math.floor(u01('sonY',o.id)*11)===G.year; }
function fatherOf(p){ return p&&p.father&&(G.ob||[]).find(o=>o.id===p.father)||null; }
/* 드래프트 풀에서 아버지와 같은 투수·야수(야수는 60%가 같은 포지션)인 신인 하나를 아들로 삼는다: 신인 생성(makeDraftClass)을 그대로 쓰고 성·투타·체격·잠재력만 손본다 */
function sonMake(cls){ for(const o of (G.ob||[]).filter(sonDue).slice(0,2)){ const L=cls.map(id=>G.players[id]).filter(q=>q&&!q.father&&!!q.isP===!!o.isP); const same=L.filter(q=>posLabel(q)===o.pos); const b=pick(same.length&&R()<.6?same:L); if(!b)continue;
    b.father=o.id; for(let i=0;i<40;i++){ const n=o.name[0]+pick(GN); if(n!==o.name&&!BLOCK.has(n)&&!nameBad(n)){ b.name=n; if(!nameTaken(n))break; } }
    b.pot=clamp(b.pot+rnd(-1,5),20,80); /* 조금 위로 치우칠 뿐 보장하지 않는다(2세가 다 성공하지는 않는다) */
    if(o.hb&&R()<.5&&(b.isP||!['C','2B','3B','SS'].includes(b.pos))){ b.th=o.hb[0]; b.bt=b.isP?b.th:o.hb[1]||b.bt; } /* 포수·내야는 우투만 */
    if(o.ht){ const d=Math.round((o.ht-b.ht)/2+N(0,2)); b.ht=clamp(b.ht+d,168,198); b.wt=clamp(b.wt+d,62,112); } } }
/* 우리가 아들을 지명했을 때: 기사·팬 여론, 업적, 아버지 등번호 */
function sonRetOwn(r,o){ return !!(r&&o&&(r.ob!=null?r.ob===o.id:r.pid!=null?r.pid===o.fid:r.name===o.name)); } /* 예전 저장의 이름만 있는 결번만 이름으로 호환 */
function sonDrafted(p){ const o=fatherOf(p); if(!o)return; const home=obMine(o); /* 팬 여론은 기사 논조로 소폭 오른다(우리 출신이면 조금 더) */
  news('드래프트',`${o.name}의 아들 ${p.name}, ${tshort(G.user)} 지명`,`${home?`우리 유니폼을 입고 ${obMineC(o).ys}시즌을 뛴`:`${tshort(o.team)} 출신`} ${o.name}의 아들 ${p.name}(${posLabel(p)})이(가) ${p.draft.rd}라운드 ${p.draft.no}순위로 ${tname(G.user)}에 지명됐습니다. 팬들이 대를 잇는 인연을 반깁니다.`,home?2:1,{fanW:1,ref:p.id});
  const fp=G.players[o.fid]||(G.arch&&G.arch[o.fid]&&archP(G.arch[o.fid])); if(fp&&fp.draft&&fp.draft.tid===G.user)achUnlock('gen2',`${o.name}${fp.draft.y!=null?`(${fp.draft.y}년 지명)`:''} → ${p.name}(${G.year}년 지명).`);
  const n=o.no; if(n==null)return; const rn=(G.retNos||[]).find(r=>r.no===n); const own=!!rn&&sonRetOwn(rn,o); if(rn&&!own)return; if(!rn&&teamNos(G.user,p).has(n))return; /* 다른 사람 결번이거나 지금 누가 쓰면 묻지 않는다 */
  evNew('son2',`${p.name}, 아버지 등번호 ${n}번`,`${p.name}이(가) 아버지 ${o.name}의 ${n}번을 달고 싶어 합니다.${own?` ${n}번은 아버지의 영구결번이라 구단이 허락해야 쓸 수 있습니다.`:''}`,[{l:own?`아버지 결번 ${n}번 허락`:`${n}번 물려주기`,fx:own?'결번은 그대로 두고, 아들에게만 이 번호를 허락합니다. 팬 여론이 조금 오릅니다.':'아버지의 번호를 이어 답니다.'},{l:'새 번호로 시작',fx:'아들은 자기 번호로 시작합니다.'}],{data:{pid:p.id,no:n,rn:own},def:1,exp:7}); }
EVH.son2={ can(e,i){ if(i!==0)return ''; const p=G.players[e.data.pid], n=e.data.no, o=fatherOf(p), r=retNosOf(G.user).find(r=>r.no===n); if(!p||p.team!==G.user||G.unemp)return '지금 우리 선수가 아닙니다.'; if(e.data.rn&&!sonRetOwn(r,o))return '아버지의 영구결번이 아닙니다.'; const q=Object.values(G.players).find(q=>q!==p&&q.team===p.team&&jno(q)===n); return q?`${n}번은 ${q.name} 선수가 쓰고 있습니다.`:''; }, pick(e,i){ const p=G.players[e.data.pid]; if(!p||i!==0)return ''; const why=this.can(e,i); if(why)return why; const n=e.data.no;
    if(!e.data.rn){ const r=setPlayerNo(p.id,n); return r||`${p.name}이(가) ${n}번을 답니다.`; }
    const o=fatherOf(p); p.retNoPermit={tid:p.team,no:n,ob:o.id}; const whyNo=setPlayerNo(p.id,n); if(whyNo)return whyNo; /* 허락은 선수·구단·아버지·번호에 귀속 */
    news('구단',`${p.name}, 아버지의 영구결번 ${n}번 단다`,`구단이 영구결번 ${n}번을 아들 ${p.name}에게만 허락했습니다.`,1,{fanW:1,ref:p.id}); return `${p.name}이(가) 아버지의 결번 ${n}번을 답니다.`; } };

function obHireBonus(obid,role){ if(!obid||!G.ob)return; const ob=G.ob.find(o=>o.id===obid); if(!ob)return; ob.log.push({y:G.year,t:`${tshort(G.user)} ${role}`}); if(!obMine(ob))return; prInit(); const f=ob.fame>=70?3:1; G.pr.fan=clamp(G.pr.fan+f,0,100);
  news('팬',`${ob.name}, 친정 ${tshort(G.user)}로 돌아왔다`,`${role}로 합류합니다. 팬들이 반깁니다.`,2,{fanW:1}); }


/* 한 사람은 한 자리에만(검수 11-06: 다른 구단 현직 코치를 감독으로 데려와도 코치 자리가 남고, AI가 데려간 OB 감독이 시장에 남아 두 구단 감독이 됐다).
 OB 지도자가 새 자리에 앉으면 다른 구단 코치 자리와 감독·코치 시장 후보에서 같은 사람을 지운다 */
function obTaken(obid,keep){ try{ schLeave(keep); }catch(e){} if(!obid)return; for(const t of G.teams){ const C=G.coach&&G.coach[t.id]; if(C)for(const k of CKEYS){ const c=C[k]; if(c&&c.ob===obid&&c!==keep){ C[k]=t.id===G.user?null:mkCoach(k); if(C[k])staffCt(C[k],ri(1,2)); if(t.id===G.user)mail('운영팀',`${c.name} ${CROLE[k].l}, 감독으로 떠남`,`${c.name} 코치가 다른 자리의 감독을 맡게 돼 ${CROLE[k].l} 자리가 비었습니다. 스태프·육성 → 코치진에서 채워 주세요.`,{kind:'감독'}); } }
    const m=G.mgr&&G.mgr[t.id]; if(m&&m.ob===obid&&m!==keep&&t.id!==G.user){ const n=mkMgr(); staffCt(n,ri(2,3)); G.mgr[t.id]=n; } }
  G.mmarket=(G.mmarket||[]).filter(x=>x.ob!==obid||x===keep); G.cmarket=(G.cmarket||[]).filter(x=>x.ob!==obid||x===keep);
  /* 한 사람은 한 곳에만(검수 11-09e #15): 스카우트(우리·다른 구단)·보조 코치·고교 감독 자리도 비운다. 학교 감독을 바로 데려간 경우는 schLeave가 먼저 비우고 소식은 schDaily가 낸다 */
  const drop=L=>(L||[]).filter(x=>x.ob!==obid||x===keep); const gone=(G.scouts||[]).filter(s=>s.ob===obid&&s!==keep);
  if(gone.length){ G.scouts=drop(G.scouts); for(const s of gone)mail('스카우트팀',`${s.name} 스카우트, 다른 자리로 떠남`,`${s.name} 스카우트가 다른 자리를 맡게 돼 팀을 떠났습니다.`,{kind:'스카우트'}); }
  G.coachX=G.coachX&&drop(G.coachX); G.scoutMarket=G.scoutMarket&&drop(G.scoutMarket); for(const o of Object.values(G.orgT||{}))if(o&&o.coachX)o.coachX=drop(o.coachX); /* 떠난 구단 보조 코치 자리도(검수 11-09zv #2) */
  for(const tid in (G.lgStaff||{})){ const L=G.lgStaff[tid]; if(L.sc&&L.sc.some(s=>s.ob===obid&&s!==keep)){ L.sc=drop(L.sc); try{ stSync(+tid); }catch(e){} } }
  for(const S of Object.values(G.schools||{}))if(S.coach&&S.coach.ob===obid)schSetCoach(S,schNewCoach(S,false,obid)); }
