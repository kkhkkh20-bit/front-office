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
    sc:clamp(Math.round(1.5+pers.pro/8+R()),1,5),readyY:o.retY+(path==='media'?ri(2,5):path==='coach'?(R()<.5?0:1):0),cy:0,sy:0,fy:0,my:0,bond:o.team===G.user?10:0,log:[]};
  G.ob.push(ob); return ob; }
function obFromPlayer(p,rec){ if(!G.ob)obInit(); const c=careerOf(p); let war=rec?rec.war:+c.war.toFixed(1); let seasons=rec?rec.seasons:c.seasons.size; const by=c.byTeam[p.team]; let ys=by?by.ys.size:0;
  const fm=p.team===G.user&&G.fd?fdMine(p):undefined; if(fm!==undefined)ys=fm?fm.ys:0; /* 창단 게임: 창단 이후만 우리 구단 경력 */
  if(rec&&rec.mine&&p.team===G.user)ys=Math.max(ys,rec.mine.ys);
  const miss=Math.max(0,(p.svc||0)-seasons); if(miss){ seasons+=miss; war=+(war+miss*clamp((p.pot-45)/5,0,4.5)).toFixed(1); if(c.teams.size<=1&&fm===undefined)ys+=miss; } /* 기록이 남기 전(게임 시작 전) 경력은 연차와 잠재력으로 추정 */
  if(seasons<5&&war<5&&!(p.team===G.user&&ys>=3))return null; initPers(p);
  const ob=obMake({fid:p.id,name:p.name,isP:p.isP,pos:posLabel(p),team:p.team,ys,war,seasons,age:p.age,retY:G.year,awards:(p.aw||[]).length,hof:rec&&rec.hof,cat:!p.isP&&p.pos==='C',pers:{...p.pers}});
  ob.mineWar=fm!==undefined?(fm?fm.war:0):rec&&rec.mine?rec.mine.war:p.team===G.user?+(war*(ys/Math.max(1,seasons))).toFixed(1):c.byTeam[G.user]?+c.byTeam[G.user].war.toFixed(1):0; ob.no=jno(p); if(rec&&rec.canRetNo)ob.canRetNo=G.legends.length-1; return ob; }
/* 지금 어디서 무엇을 하는가 */
function obWhere(ob){ for(const t of G.teams){ const m=G.mgr[t.id]; if(m&&m.ob===ob.id)return {k:'mgr',tid:t.id,t:`${t.city} ${t.nick} 감독`}; if(t.gm&&t.gm.ob===ob.id)return {k:'gm',tid:t.id,t:`${t.city} ${t.nick} 단장`};
    const C=G.coach&&G.coach[t.id]; if(C)for(const r of CKEYS)if(C[r]&&C[r].ob===ob.id)return {k:'coach',tid:t.id,role:r,t:`${t.city} ${t.nick} ${CROLE[r].l}`}; }
  if((G.scouts||[]).some(s=>s.ob===ob.id))return {k:'scout',tid:G.user,t:`${tshort(G.user)} 스카우트`};
  if(G.year<ob.readyY)return {k:'wait',t:ob.path==='media'?'해설위원':ob.path==='coach'?'지도자 연수 중':'휴식 중'};
  if(ob.alt)return {k:ob.alt.k,tid:ob.alt.tid,t:ob.alt.t};
  return {k:'free',t:ob.path==='media'?'해설위원':`${OBPATH[ob.path]} 자리를 찾는 중`}; }
function obRole(ob){ if(ob.isP)return ob.cy>=6?'hc':ob.cy<2&&R()<.5?'fp':'pc'; if(ob.pos==='포수')return 'cc'; const r=pick(['bc','bc','dc','rc','fb']); return ob.cy>=6&&R()<.4?'hc':r; }
function obCoach(ob){ const role=obRole(ob); const c={id:'c'+ob.id,name:ob.name,age:ob.age,role,sk:ob.sk,dv:ob.dv,car:`${tshort(ob.team)} ${ob.hof?'명예의 전당 ':ob.fame>=70?'레전드 ':''}출신 · 통산 WAR ${ob.war}`,sal:round5(clamp(55+(Math.max(ob.sk,ob.dv)-50)*4.5+(ob.fame>=70?40:0),45,340)),yrs:0,clan:null,ob:ob.id,star:ob.fame>=70};
  G.obFace[c.id]=ob.fid; return c; }
function obCands(kind){ obInit(); return G.ob.filter(o=>{ const w=obWhere(o); return w.k==='free'&&o.age<=66&&(kind==='coach'?(o.path==='coach'||o.path==='media'&&o.my>=3):kind==='scout'?(o.path==='scout'||o.path==='front'&&o.fy<3):false); }); }
function obMgrCands(){ obInit(); return G.ob.filter(o=>{ const w=obWhere(o); if(w.k==='mgr'||w.k==='gm'||o.age>66||o.age<42)return false; return (o.cy>=5&&(o.sk>=58||o.aim==='mgr'))||(o.fame>=72&&(o.cy>=2||o.my>=4)); }); }
function obMgr(ob){ const m=mkMgr(); m.name=ob.name; m.age=ob.age; m.fame=clamp(ob.fame+Math.min(10,ob.cy),20,95); m.tac=clamp(Math.round(ob.sk+N(0,4)),30,90); m.youth=clamp(Math.round(ob.dv+N(0,8)),15,88); m.ego=clamp(Math.round(ob.pers.temp*3.5+20+(ob.fame>=70?10:0)),20,95);
  m.career=`${tshort(ob.team)} ${ob.fame>=70?'레전드':''} 출신 · 지도자 경력 ${ob.cy}년${ob.my?` · 해설 ${ob.my}년`:''}`; m.ob=ob.id; m.id='g'+ob.id; G.obFace[m.id]=ob.fid; m.sal=round5(clamp(220+(m.tac-50)*9+Math.max(0,m.fame-55)*9,180,1200)); m.clan=[]; return m; }
function obGMCands(){ obInit(); return G.ob.filter(o=>{ const w=obWhere(o); if(w.k==='gm'||w.k==='mgr'||o.age>64||o.age<40)return false; return (o.fy+o.sy>=6&&(o.aim==='gm'||o.pers.amb>=11))||(o.fy>=4&&o.fame>=70); }); }
function obGM(ob,tid){ const g=mkGM(tid); g.name=ob.name; g.age=ob.age; const P=ob.pers; g.trait=P.loy>=15?'loyal':P.temp>=15?'hard':P.pro>=15?'data':P.amb>=16?'gambler':ob.sy>=ob.fy?'prospect':g.trait;
  g.car=`${tshort(ob.team)} ${ob.pos} 출신 · ${ob.sy?`스카우트 ${ob.sy}년`:''}${ob.sy&&ob.fy?' · ':''}${ob.fy?`프런트 ${ob.fy}년`:''}`; g.ob=ob.id; g.id='m'+ob.id; G.obFace[g.id]=ob.fid; return g; }
/* 겨울마다: 경력 연차가 쌓이고, 능력이 자라고, 일부는 자리를 옮긴다 */
function obYear(){ obInit(); for(const ob of G.ob){ ob.age++; const w=obWhere(ob);
    if(w.k==='coach'){ ob.cy++; const c=G.coach[w.tid][w.role]; if(ob.age<=56){ c.sk=clamp(c.sk+ri(0,2),30,90); c.dv=clamp(c.dv+ri(0,2),30,90); } ob.sk=c.sk; ob.dv=c.dv; c.age=ob.age; }
    else if(w.k==='mgr'){ ob.cy++; } else if(w.k==='scout'){ ob.sy++; const s=G.scouts.find(x=>x.ob===ob.id); if(s&&ob.sy%3===0&&s.skill<5)s.skill++; ob.sc=s?s.skill:ob.sc; }
    else if(w.k==='front'||ob.alt&&ob.alt.k==='front'){ ob.fy++; } else if(ob.path==='media'&&G.year>=ob.retY){ ob.my++; }
    else if(w.k==='free'&&G.year>=ob.readyY){ // 자리를 못 찾으면 일부는 다른 구단 프런트·2군으로 간다
      if(ob.path==='front'||ob.path==='scout'){ if(R()<.6){ const tid=R()<.5?ob.team:pick(G.teams).id; if(tid!==G.user)ob.alt={k:'front',tid,t:`${tshort(tid)} ${ob.path==='scout'?'스카우트':'프런트'}`}; } }
      if(ob.alt&&ob.alt.k==='front'){ ob.fy++; if(ob.path==='scout'){ ob.sy++; ob.fy--; } } }
    if(ob.path==='media'&&ob.my>=3&&R()<.25){ ob.path='coach'; ob.log.push({y:G.year,t:'해설을 접고 지도자의 길을 택했습니다'}); } } }
/* AI 구단이 OB를 쓰는 곳 */
function obAiCoach(tid,role){ const L=obCands('coach').filter(o=>!(G.cmarket||[]).some(c=>c.ob===o.id&&c.role!==role)); const ob=L.length&&R()<.4?pick(L):null; if(!ob)return null; const c=obCoach(ob); c.role=role; c.yrs=ri(1,3);
  if(ob.mine)wire('코치',`${tshort(ob.team)} 출신 ${ob.name}, ${tshort(tid)} ${CROLE[role].l}로 합류`,{tid}); G.cmarket=(G.cmarket||[]).filter(x=>x.ob!==ob.id); return c; }
function obAiMgr(tid){ const L=obMgrCands(); if(!L.length||R()>.35)return null; const ob=L.sort((a,b)=>b.fame-a.fame)[0]; const m=obMgr(ob); m.yrs=ri(2,3); ob.log.push({y:G.year,t:`${tshort(tid)} 감독 취임`});
  wire('감독',`${tshort(tid)}, ${tshort(ob.team)} 출신 ${ob.name} 감독 선임`,{tid}); if(ob.mine)mail('홍보팀',`우리 구단 출신 ${ob.name}, ${tshort(tid)} 감독으로`,`${ob.name}이(가) ${tshort(tid)}의 새 감독이 됐습니다. ${ob.ys}시즌을 우리 유니폼을 입고 뛰었던 선수입니다.`,{kind:'OB'}); return m; }
function obAiGM(tid){ const L=obGMCands(); if(!L.length||R()>.45)return null; const ob=L.sort((a,b)=>(b.fy+b.sy+b.fame/10)-(a.fy+a.sy+a.fame/10))[0]; const g=obGM(ob,tid); ob.alt=null; ob.log.push({y:G.year,t:`${tshort(tid)} 단장 취임`});
  if(ob.mine){ team(tid).rel=clamp(66+Math.round(ob.bond/2),0,100); mail('홍보팀',`우리 구단 출신 ${ob.name}, ${tshort(tid)} 단장으로`,`${ob.name}이(가) ${tshort(tid)} 단장에 올랐습니다. 우리 구단 출신이라 첫 친분은 높게 시작합니다.`,{kind:'OB'}); } return g; }
/* 우리 선수 은퇴: 은퇴식·영구결번·구단에 남기기 */
function obRetireEvents(list){ const L=list.filter(o=>o&&o.mine&&(o.ys>=3)).sort((a,b)=>b.mineWar-a.mineWar).slice(0,3);
  for(const ob of L){ const leg=ob.mineWar>=12||ob.ys>=8; const rn=ob.canRetNo!=null; const stay=ob.path==='media'?null:ob.path==='coach'?'코치로 남기기':ob.path==='scout'?'스카우트로 채용':'프런트 직원으로 채용';
    const opts=[{l:rn?'은퇴식과 영구결번 (1억)':`은퇴식 열어 주기 (${leg?'5천만':'2천만'})`,fx:rn?`${ob.no}번 영구결번. 팬 여론이 크게 오르고, 훗날 구단으로 돌아올 가능성이 커집니다.`:'팬 여론이 오르고, 훗날 구단으로 돌아올 가능성이 커집니다.'}];
    if(stay)opts.push({l:stay,fx:ob.path==='coach'?'코치 후보에 우선 협상 대상으로 올라옵니다(연봉 20% 할인).':ob.path==='scout'?'빈자리가 있으면 바로 스카우트로 합류합니다.':'우리 프런트에서 일하며 경력을 쌓습니다. 언젠가 다른 구단 단장이 될 수도 있습니다.'});
    opts.push({l:'조용히 보내 주기',fx:`${OBPATH[ob.path]}의 길을 스스로 찾습니다.`});
    evNew('ret',`${ob.name} 은퇴`,`${ob.name}(${ob.pos}, ${ob.age}세)이(가) 은퇴합니다. 우리 구단에서 ${ob.ys}시즌 · WAR ${ob.mineWar}. 은퇴 후 ${ob.path==='media'?'해설위원 제안을 받았다고 합니다':`${OBPATH[ob.path]}의 길을 생각하고 있습니다`}${ob.aim?` (${ob.aim==='mgr'?'언젠가 감독':'언젠가 단장'}을 꿈꿉니다)`:''}.`,opts,{from:ob.name,face:'ob:'+ob.id,data:{ob:ob.id,rn:ob.canRetNo,leg,stay:!!stay},def:opts.length-1,exp:10}); } }
EVH.ret={ pick(e,i){ const ob=(G.ob||[]).find(o=>o.id===e.data.ob); if(!ob)return ''; const t=team(G.user); const L=e.opts.length;
    if(i===0){ const rn=e.data.rn!=null; const cost=rn?100:e.data.leg?50:20; G.spend.etc=(G.spend.etc||0)+cost; ob.bond+=rn?30:20; ob.ceremony=G.year; let r='';
      if(rn){ r=retireNumber(e.data.rn); ob.retNo=true; } const f=rn?5:e.data.leg?3:1; G.pr.fan=clamp(G.pr.fan+f,0,100);
      news('선수',`${t.city} ${t.nick} ${ob.name} 은퇴식${rn?`, ${ob.no}번 영구결번`:''}`,`${ob.ys}시즌 동안 뛴 ${ob.name}이(가) 팬들 앞에서 마지막 인사를 했습니다.`,rn?3:2,{fanW:1});
      return `${r?r+' ':''}은퇴식 비용 ${money(cost)}. 팬 여론 +${f}.`; }
    if(i===1&&e.data.stay){ ob.bond+=15; ob.readyY=G.year;
      if(ob.path==='coach'){ const c=obCoach(ob); c.sal=round5(c.sal*.8); c.res=G.user; G.cmarket=(G.cmarket||[]).filter(x=>x.ob!==ob.id); G.cmarket.unshift(c); return `${ob.name}이(가) 코치 후보 맨 앞에 올라왔습니다(${CROLE[c.role].l}, 연 ${money(c.sal)}).`; }
      if(ob.path==='scout'){ const s=obScout(ob); if(G.scouts.length<SCOUT_MAX){ s.since=G.day; G.scouts.push(s); return `${ob.name}이(가) 스카우트로 합류했습니다.`; } G.scoutMarket.unshift(s); return '스카우트 자리가 꽉 차서 후보 명단에 올렸습니다.'; }
      ob.alt={k:'front',tid:G.user,t:`${t.city} ${t.nick} 프런트`}; return `${ob.name}이(가) 우리 프런트에서 일을 시작합니다.`; }
    return ''; } };
function obScout(ob){ const s=mkScout(ob.sc); s.name=ob.name; s.ob=ob.id; s.fid=ob.fid; s.id='s'+ob.id; G.obFace[s.id]=ob.fid; return s; }

function obHireBonus(obid,role){ if(!obid||!G.ob)return; const ob=G.ob.find(o=>o.id===obid); if(!ob)return; ob.log.push({y:G.year,t:`${tshort(G.user)} ${role}`}); if(!ob.mine)return; prInit(); const f=ob.fame>=70?3:1; G.pr.fan=clamp(G.pr.fan+f,0,100);
  news('팬',`${ob.name}, 친정 ${tshort(G.user)}로 돌아왔다`,`${role}로 합류합니다. 팬들이 반깁니다.`,2,{fanW:1}); }

