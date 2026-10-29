/* ===== 도전과제 =====
 단장으로 이룬 일을 기록한다. 깬 과제는 두 곳에 남는다.
 - 이 저장(G.ach): 이 게임에서 언제 깼는지.
 - 모든 저장 공통(브라우저 저장소 'danjang-ach'): 게임을 새로 시작해도 남고, 보상(새 게임 시작 혜택·칭호)이 여기서 나온다.
 보상은 새 게임을 시작할 때만 적용된다(진행 중인 게임의 균형은 건드리지 않는다). 합계에 상한을 둔다.
 노드 시뮬레이션에서도 돌도록 저장소가 없으면 메모리에만 둔다. */
const ACH_KEY='danjang-ach';
const ACH_CAP={rep:15,trust:8,cash:2000}; /* 새 게임 혜택 상한: 시작 명성 +15, 첫 시즌 구단주 신뢰 +8, 창단 자금 +20억 */
let _achMem=null;
function achMeta(){ if(_achMem)return _achMem; let m=null; try{ if(typeof localStorage!=='undefined')m=JSON.parse(localStorage.getItem(ACH_KEY)||'null'); }catch(e){}
  _achMem=(m&&typeof m==='object')?m:{}; _achMem.u=_achMem.u||{}; _achMem.champ=_achMem.champ||{}; if(_achMem.title===undefined)_achMem.title=null; return _achMem; }
function achMetaSave(){ try{ if(typeof localStorage!=='undefined')localStorage.setItem(ACH_KEY,JSON.stringify(achMeta())); }catch(e){} }

/* 이 저장의 단장 경력 기록 */
function achT(){ if(!G.achT){ G.achT={seasons:0,teams:[],titles:{},profit:0,taxed:false,fired:false,ggMine:0,psRun:0,psBest:0}; achBackfill(G.achT); } const T=G.achT;
  if(G.user!=null&&!T.teams.length)T.teams.push(G.user); return T; }
/* 도전과제가 생기기 전 저장: 연대기(취임·경질·우승)로 경력을 되살린다. 시즌 수는 첫 취임 뒤 치른 시즌에서 야인으로 보낸 해를 대략 뺀다 */
function achBackfill(T){ const C=G.chron||[]; const J=C.filter(c=>c.k==='join'); for(const c of J)if(!T.teams.includes(c.tid))T.teams.push(c.tid);
  for(const c of C.filter(c=>c.k==='champ'&&c.gm!==0))(T.titles[c.tid]=T.titles[c.tid]||[]).push(c.y);
  T.fired=C.some(c=>c.k==='fired'); const y0=J.length?Math.min(...J.map(c=>c.y)):G.year; T.seasons=Math.max(0,(G.history||[]).filter(h=>h.user&&h.y>=y0).length-C.filter(c=>c.k==='fired').length); }
function achTitlesN(T){ return sum(Object.values(T.titles).map(a=>a.length)); }
function achTeamsWon(T){ return Object.keys(T.titles).filter(k=>T.titles[k].length).map(Number); }
function achMetaTeamsWon(){ const M=achMeta(); return Object.keys(M.champ).filter(k=>(M.champ[k]||0)>0).map(Number); }

/* 과제 목록. c: 분류, r: 보상({rep,trust,cash,title}), p: 진행도(현재, 목표) */
const ACH=[
  {id:'champ1',c:'우승',n:'첫 우승',d:'단장으로 한국시리즈 우승을 차지합니다.',r:{rep:2}},
  {id:'firstYr',c:'우승',n:'부임 첫해 우승',d:'단장을 맡은 첫 시즌에 우승합니다.',r:{title:'첫해의 기적'}},
  {id:'double',c:'우승',n:'통합 우승',d:'정규시즌 1위와 한국시리즈 우승을 같은 해에 해냅니다.',r:{trust:2}},
  {id:'dynasty',c:'우승',n:'왕조',d:'같은 구단으로 3년 연속 우승합니다.',r:{rep:3,title:'왕조 설계자'}},
  {id:'champ5',c:'우승',n:'우승 5회',d:'단장 통산 우승 5회.',r:{rep:3},p:T=>[achTitlesN(T),5]},
  {id:'under',c:'우승',n:'언더독',d:'시즌 전 예상 순위 8위 이하였던 해에 우승합니다.',r:{title:'기적의 단장'}},
  {id:'indie',c:'우승',n:'모기업 없이',d:'모기업이 없는 구단으로 우승합니다.',r:{cash:500,title:'독립 구단의 영웅'}},
  {id:'noTax',c:'우승',n:'상한을 지키며',d:'이 게임에서 경쟁균형세를 한 번도 내지 않고 우승합니다.',r:{trust:2}},
  {id:'two',c:'경력',n:'두 구단 우승',d:'서로 다른 두 구단에서 우승합니다.',r:{rep:2},p:T=>[achTeamsWon(T).length,2]},
  {id:'allTeams',c:'경력',n:'전 구단 우승',d:'한 게임 안에서 여러 구단을 옮겨 다니며 10개 구단 모두 우승시킵니다.',r:{rep:5,cash:1000,title:'전 구단 우승 단장'},p:T=>[achTeamsWon(T).length,10],big:true},
  {id:'allMeta',c:'경력',n:'리그 정복',d:'여러 게임에 걸쳐 10개 구단 모두로 한 번씩 우승합니다.',r:{cash:500,title:'리그 정복자'},p:()=>[achMetaTeamsWon().length,10],meta:true},
  {id:'s10',c:'경력',n:'10시즌',d:'단장으로 10시즌을 보냅니다.',r:{trust:2},p:T=>[T.seasons,10]},
  {id:'s20',c:'경력',n:'20시즌',d:'단장으로 20시즌을 보냅니다.',r:{trust:2},p:T=>[T.seasons,20]},
  {id:'s30',c:'경력',n:'30시즌',d:'단장으로 30시즌을 보냅니다.',r:{title:'종신 단장'},p:T=>[T.seasons,30]},
  {id:'teams3',c:'경력',n:'저니맨',d:'세 구단의 단장을 맡습니다.',r:{title:'저니맨 단장'},p:T=>[T.teams.length,3]},
  {id:'comeback',c:'경력',n:'재기',d:'경질된 뒤 다른 구단 단장으로 돌아옵니다.',r:{rep:2}},
  {id:'rep80',c:'경력',n:'리그 최고의 단장',d:'단장 명성 80 이상.',r:{rep:3}},
  {id:'ps5',c:'경력',n:'가을의 단골',d:'5년 연속 포스트시즌에 나갑니다.',r:{trust:2},p:T=>[T.psBest,5]},
  {id:'w90',c:'경력',n:'90승',d:'정규시즌 90승 이상.',r:null},
  {id:'draftMvp',c:'선수',n:'안목',d:'우리가 지명한 선수가 우리 유니폼을 입고 MVP를 받습니다.',r:{rep:2,title:'안목의 단장'}},
  {id:'draftRoy',c:'선수',n:'될성부른 떡잎',d:'우리가 지명한 선수가 신인왕을 받습니다.',r:null},
  {id:'gg3',c:'선수',n:'골든글러브 군단',d:'한 해에 우리 선수 3명 이상이 골든글러브를 받습니다.',r:null},
  {id:'gg5',c:'선수',n:'우리가 키운 별',d:'우리가 지명한 선수의 골든글러브가 통산 5개.',r:{trust:2},p:T=>[T.ggMine,5]},
  {id:'retNo',c:'선수',n:'영구결번',d:'우리 구단의 등번호를 영구결번합니다.',r:null},
  {id:'profit5',c:'재정',n:'흑자 경영',d:'흑자 시즌 5번.',r:{cash:500},p:T=>[T.profit,5]},
  {id:'cash200',c:'재정',n:'곳간',d:'시즌을 마칠 때 구단 현금 200억 원 이상.',r:null},
  {id:'trade10',c:'트레이드',n:'협상가',d:'트레이드 10건.',r:null,p:()=>[(G.trades||[]).filter(t=>t.gi).length,10]},
  {id:'steal',c:'트레이드',n:'도둑 트레이드',d:'트레이드 뒤 받은 선수의 WAR이 준 선수보다 8 이상 많습니다.',r:{rep:2}},
  {id:'asWin',c:'협회',n:'킹메이커',d:'지지를 밝힌 후보가 협회장에 당선됩니다.',r:null},
  {id:'cmtWin',c:'협회',n:'내 안대로',d:'상한 표결에서 우리 구단이 던진 안이 최종안이 됩니다.',r:null},
];
const ACH_BY=Object.fromEntries(ACH.map(a=>[a.id,a]));
const achHas=id=>!!(G&&G.ach&&G.ach[id]);
const achHasMeta=id=>!!achMeta().u[id];
function achRewardTxt(r){ if(!r)return '기록만 남습니다'; const L=[]; if(r.rep)L.push(`새 게임 시작 명성 +${r.rep}`); if(r.trust)L.push(`새 게임 첫 시즌 구단주 신뢰 +${r.trust}`); if(r.cash)L.push(`새 게임 창단 자금 +${money(r.cash)}`); if(r.title)L.push(`칭호 '${r.title}'`); return L.join(' · '); }

function achUnlock(id,why){ const a=ACH_BY[id]; if(!a)return false; G.ach=G.ach||{}; const M=achMeta(); const newHere=!G.ach[id], newMeta=!M.u[id];
  if(!newHere&&!newMeta)return false;
  if(newHere)G.ach[id]={y:G.year,d:G.day};
  if(newMeta){ M.u[id]={at:Date.now(),y:G.year,team:G.user!=null&&G.teams&&G.teams[G.user]?tshort(G.user):''}; achMetaSave(); }
  if(newHere){ try{ mail('도전과제',`도전과제 달성: ${a.n}`,`${a.d}${why?`\n${why}`:''}\n\n보상: ${achRewardTxt(a.r)}${newMeta?'':'\n(다른 게임에서 이미 깬 과제라 보상은 그대로입니다.)'}\n구단 > 연대기 > 도전과제에서 볼 수 있습니다.`,{kind:'경력'}); }catch(e){} }
  return true; }

/* ctx.k: season(결산 직후), award(시상식), retNo(영구결번), switch(구단 이동), assoc(협회 결과) */
function achCheck(ctx){ if(!G||G.user==null)return; ctx=ctx||{}; const T=achT(); const U=G.user;
  if(ctx.k==='switch'){ if(G.unemp)T.fired=true; if(ctx.to!=null&&!T.teams.includes(ctx.to))T.teams.push(ctx.to); if(T.teams.length>=3)achUnlock('teams3'); if(T.fired||ctx.wasU)achUnlock('comeback'); return; }
  if(G.unemp)return;
  if(ctx.k==='season'){ const L=G.last; if(!L||!L.ps)return; const y=L.y; const ps=L.ps; const t=team(U); const fin=L.fins&&L.fins[U];
    T.seasons++; if(fin&&fin.net>0)T.profit++; if(fin&&fin.tax>0)T.taxed=true;
    const inPs=!!(G.ps&&G.ps.seeds&&G.ps.seeds.includes(U)); T.psRun=inPs?T.psRun+1:0; T.psBest=Math.max(T.psBest,T.psRun);
    const rec=L.order.find(o=>o.tid===U);
    if(ps.champ===U){ (T.titles[U]=T.titles[U]||[]).push(y); const M=achMeta(); M.champ[U]=(M.champ[U]||0)+1; achMetaSave();
      achUnlock('champ1'); if(G.gmSince===y)achUnlock('firstYr'); if(ps.first===U)achUnlock('double');
      const ys=T.titles[U]; if(ys.includes(y-1)&&ys.includes(y-2))achUnlock('dynasty');
      const pr=G.proj?G.proj.indexOf(U)+1:0; if(pr>=8)achUnlock('under',`시즌 전 예상 ${pr}위.`);
      if(t.indie)achUnlock('indie'); if(!T.taxed)achUnlock('noTax'); }
    if(rec&&rec.w>=90)achUnlock('w90',`${rec.w}승.`);
    if(fin&&t.cash>=20000)achUnlock('cash200');
    if((G.rep??0)>=80)achUnlock('rep80');
    for(const tr of (G.trades||[]).filter(x=>x.gi&&x.y<y)){ let r=null; try{ r=tradeReport(tr); }catch(e){} if(r&&r.net>=8){ achUnlock('steal',`${tr.y}년 ${tshort(tr.with)}와의 트레이드: 받은 쪽 WAR ${r.got.toFixed(1)}, 준 쪽 ${r.gave.toFixed(1)}.`); break; } } }
  if(ctx.k==='award'){ const y=G.year, A=G.awards&&G.awards[y]; if(!A)return; const mine=x=>x&&x.t===U; const drafted=x=>{ const p=x&&G.players[x.id]; return !!(p&&p.draft&&p.draft.tid===U); };
    if(ctx.a==='mvp'){ if(mine(A.mvp)&&drafted(A.mvp))achUnlock('draftMvp',`${y} MVP ${A.mvp.name}.`); if(mine(A.roy)&&drafted(A.roy))achUnlock('draftRoy',`${y} 신인왕 ${A.roy.name}.`); }
    if(ctx.a==='gg'){ const L=Object.values(A.gg||{}).filter(mine); if(L.length>=3)achUnlock('gg3',`${y} 골든글러브 ${L.map(x=>x.name).join(', ')}.`); T.ggMine+=L.filter(drafted).length; } }
  if(ctx.k==='retNo')achUnlock('retNo');
  if(ctx.k==='assoc'){ const A=G.assoc; if(!A)return; const E=A.els&&A.els[0]; if(E&&E.uv!=null&&E.win===E.uv&&E.y===G.year)achUnlock('asWin',`${E.c[E.win].name} 협회장 당선.`);
    const C=A.cmt&&A.cmt[0]; if(C&&C.held&&C.uv!=null&&C.uv===C.fin&&C.y===G.year+1)achUnlock('cmtWin'); }
  /* 진행도형 과제는 언제 확인해도 된다 */
  for(const a of ACH){ if(!a.p||achHas(a.id))continue; let v=null; try{ v=a.p(T); }catch(e){} if(v&&v[0]>=v[1])achUnlock(a.id); } }

/* 새 게임 혜택: 깬 과제(모든 게임 공통)의 보상 합. 상한을 넘지 않는다 */
function achPerks(){ const M=achMeta(); const P={rep:0,trust:0,cash:0}; for(const id in M.u){ const a=ACH_BY[id]; if(!a||!a.r)continue; for(const k of ['rep','trust','cash'])P[k]+=a.r[k]||0; } for(const k in P)P[k]=Math.min(P[k],ACH_CAP[k]); return P; }
function achTitles(){ const M=achMeta(); return ACH.filter(a=>a.r&&a.r.title&&M.u[a.id]).map(a=>a.r.title); }
function achTitle(){ const M=achMeta(); const L=achTitles(); return M.title&&L.includes(M.title)?M.title:null; }
function achSetTitle(t){ const M=achMeta(); M.title=t&&achTitles().includes(t)?t:null; achMetaSave(); }

/* ---------- 기존 흐름에 끼우는 곳(다른 파일을 고치지 않고 감싼다) ---------- */
(function(){
  const wrap=(name,after,before)=>{ try{ const f=eval(name); if(typeof f!=='function')return; const g=function(){ let b; if(before)try{ b=before.apply(this,arguments); }catch(e){} const r=f.apply(this,arguments); if(after)try{ after.call(this,r,arguments,b); }catch(e){} return r; }; eval(name+'=g'); }catch(e){} };
  /* 새 게임: 구단을 맡는 순간 혜택을 얹는다 */
  wrap('claimTeam',(r,args)=>{ const P=achPerks(); const t=team(args[0]); G.rep=(G.rep??50)+P.rep; t.trust=clamp((t.trust??55)+P.trust,0,100); t.cash=(t.cash||0)+P.cash; G.achPerk=P; G.ach={}; G.achT=null; achT(); });
  /* 결산 직후(우승·성적·재정) */
  wrap('settlement',()=>achCheck({k:'season'}));
  /* 시상식(MVP·신인왕, 골든글러브) */
  wrap('awardCeremony',(r,args,pend)=>{ if(pend)achCheck({k:'award',a:args[0]}); },(k)=>{ const A=G.awards&&G.awards[G.year]; return !!(A&&A.pend&&A.pend[k]); });
  /* 영구결번 */
  wrap('retireNumber',(r)=>{ if(typeof r==='string'&&r!=='대상이 아닙니다.')achCheck({k:'retNo'}); });
  /* 구단 이동: 옮기기 전에 기록한다(야인이었는지) */
  wrap('switchTeam',null,(tid)=>achCheck({k:'switch',to:tid,wasU:!!G.unemp}));
  /* 협회: 선거·상한 표결 결과 */
  wrap('asElect',()=>achCheck({k:'assoc'})); wrap('capCouncil',()=>achCheck({k:'assoc'}));
})();
