/* ===== 도전과제 =====
 단장으로 이룬 일을 기록한다. 깬 과제는 두 곳에 남는다.
 - 이 저장(G.ach): 이 게임에서 언제 깼는지.
 - 모든 저장 공통(브라우저 저장소 'danjang-ach'): 게임을 새로 시작해도 남고, 보상(새 게임 시작 혜택·칭호)이 여기서 나온다.
 보상은 새 게임을 시작할 때만 적용된다(진행 중인 게임의 균형은 건드리지 않는다). 합계에 상한을 둔다.
 노드 시뮬레이션에서도 돌도록 저장소가 없으면 메모리에만 둔다. */
const ACH_KEY='danjang-ach';
const ACH_CAP={rep:15,trust:8,cash:2000}; /* 새 게임 혜택 상한: 시작 명성 +15, 첫 시즌 구단주 신뢰 +8, 창단 자금 +20억 */
let _achMem=null, _achChamp0={};
function achMetaFix(m){ m=(m&&typeof m==='object')?m:{}; m.u=m.u||{}; m.champ=m.champ||{}; if(m.title===undefined)m.title=null; return m; }
function achMetaRead(){ let m=null; try{ if(typeof localStorage!=='undefined')m=JSON.parse(localStorage.getItem(ACH_KEY)||'null'); }catch(e){} return achMetaFix(m); }
function achMeta(){ if(_achMem)return _achMem; _achMem=achMetaRead(); _achChamp0={..._achMem.champ}; return _achMem; }
/* 저장 직전에 저장소를 다시 읽어 합친다: 다른 탭이 그사이 깬 과제를 지우지 않는다(검수 130). 과제는 합집합, 구단별 우승 수는 이 탭에서 늘어난 만큼만 더한다 */
function achMetaSave(){ try{ if(typeof localStorage==='undefined')return; const M=achMeta(), S=achMetaRead();
  for(const id in M.u)if(!S.u[id])S.u[id]=M.u[id]; for(const k of new Set([...Object.keys(S.champ),...Object.keys(M.champ)]))S.champ[k]=(S.champ[k]||0)+Math.max(0,(M.champ[k]||0)-(_achChamp0[k]||0)); S.title=M.title;
  localStorage.setItem(ACH_KEY,JSON.stringify(S)); M.u=S.u; M.champ=S.champ; _achChamp0={...S.champ}; }catch(e){} }

/* 이 저장의 단장 경력 기록 */
function achT(){ if(!G.achT){ G.achT={seasons:0,teams:[],titles:{},profit:0,taxed:false,fired:false,ggMine:0,psRun:0,psBest:0,own:{}}; achBackfill(G.achT); } const T=G.achT;
  if(G.user!=null&&!T.teams.length)T.teams.push(G.user); return T; }
/* 도전과제가 생기기 전 저장: 연대기(취임·경질·우승)로 경력을 되살린다. 시즌 수는 첫 취임 뒤 치른 시즌에서 야인으로 보낸 해를 대략 뺀다 */
function achBackfill(T){ const C=(G.chron||[]).filter(c=>c.gm!==0); const J=C.filter(c=>c.k==='join'&&c.gm!==0); for(const c of J)if(!T.teams.includes(c.tid))T.teams.push(c.tid);
  for(const c of C.filter(c=>c.k==='champ'&&/한국시리즈.*우승/.test(c.t||''))){const a=T.titles[c.tid]=T.titles[c.tid]||[];if(!a.includes(c.y))a.push(c.y);}
  T.fired=C.some(c=>c.k==='fired'&&/^(?:.+? 단장 · )?단장 경질:/.test(c.t||'')); /* 사임·고사·만료는 경질이 아니다 */ const y0=J.length?Math.min(...J.map(c=>c.y)):G.year; T.seasons=Math.max(0,(G.history||[]).filter(h=>h.user&&h.y>=y0).length-C.filter(c=>c.k==='fired').length); }
function achTitlesN(T){ return sum(Object.values(T.titles).map(a=>a.length)); }
function achTeamsWon(T){ return Object.keys(T.titles).filter(k=>T.titles[k].length).map(Number); }
/* 단장 통산 정규시즌 승수(지금 단장): 개인 시즌 기록, 없는 옛 저장은 부임 뒤 재임 기록 */
function achWins(){ let w=0; try{ const S=myCStats(); w=S?S.w:0; }catch(e){} if(!w&&!((G.myC&&G.myC.seas)||[]).length)w=sum((G.history||[]).filter(h=>h.user&&h.y>=(G.gmSince??9999)).map(h=>h.user.w||0)); return w; }
/* 우리 구단에서 뛰었거나 우리가 지명한 명예의 전당 헌액자 */
function achHofMine(){ const U=G.user; if(U==null)return 0; let L=[]; try{ L=hofList(); }catch(e){}
  return L.filter(r=>{ if((r.teams||[]).includes(U)||(r.tid===U&&r.mine&&r.mine.ys))return true; const id=r.pid??r.id; const p=G.players[id]||(G.arch&&G.arch[id]&&archP(G.arch[id])); return !!(p&&p.draft&&p.draft.tid===U); }).length; }
/* 지금 맡은 구단에서 재임 중 연 신구장 수. shortcut: 구단을 옮기면 새로 센다(여러 구단 합산이 필요하면 achT에 쌓을 것) */
function achStadN(){ const S=G.user!=null&&!G.unemp&&G.teams[G.user]&&G.teams[G.user].stad; if(!S)return 0; return achStadOpens(S).filter(d=>d>=achJoinD()).length; }
/* 신구장 개장일: 옛 구장 이름이 끝난 날(names.until). 이름 기록이 없는 옛 저장은 개장 해 1월 1일로 본다 */
function achStadOpens(S){ const L=(S.names||[]).map(x=>x.until).filter(d=>d!=null); if(!L.length&&S.built!=null&&!S.proj&&S.built>(G.startY??0))L.push(dnum(S.built,1,1)); return L; }
/* 지금 구단 부임일(재임 중 일만 내 업적으로, 검수 126~157) */
function achJoinD(){ return G.gmSinceD??dnum(G.gmSince??G.year,1,1); }
/* 올해 지금 구단에서 내가 치른 승패: 부임 전 승패는 전임 몫(검수 133·134) */
function achOwnRec(U){ const r=G.sea&&G.sea.rec&&G.sea.rec[U]; if(!r)return null; const J=G.gmJoin&&G.gmJoin.y===G.year&&G.gmJoin.tid===U?G.gmJoin:null; const w=Math.max(0,(r.w||0)-(J?J.w:0)), l=Math.max(0,(r.l||0)-(J?J.l:0)), t=Math.max(0,(r.t||0)-(J?J.t||0:0)); return {w,l,t,g:w+l+t}; }
/* 그해 시즌을 마친 내 재임: 결산·시상 업적의 주인. 결산일·시상식 날 현직이 아니라, 경력 기록에 완주한 시즌으로 남은 구단(검수 126~129) */
function achSeasonOwner(y){ const S=((G.myC&&G.myC.seas)||[]).filter(s=>s.y===y&&!s.part); if(S.length){ const s=S[S.length-1]; return {tid:s.tid,w:s.w||0,first:s.first}; }
  if(!(G.myC&&(G.myC.seas||[]).length)&&!G.unemp&&G.user!=null){ const J=G.gmJoin; if(J&&J.y===y&&J.tid===G.user&&J.psDone)return null; return {tid:G.user,w:null,first:undefined}; } /* 경력 기록이 없던 옛 저장 */
  return null; }
/* 이 재임의 첫 시즌: 정규시즌이 끝난 뒤 부임하면 다음 시즌(검수 136) */
function achFirstY(){ const c=G.cal; return c&&G.day>c.end&&dobj(G.day).y===G.year?G.year+1:G.year; }
function achMetaTeamsWon(){ const M=achMeta(); return Object.keys(M.champ).filter(k=>(M.champ[k]||0)>0).map(Number); }

/* 과제 목록. c: 분류, r: 보상({rep,trust,cash,title}), p: 진행도(현재, 목표) */
const ACH=[
  {id:'champ1',c:'우승',n:'첫 우승',d:'단장으로 한국시리즈 우승을 차지합니다.',r:{rep:2}},
  {id:'firstYr',c:'우승',n:'부임 첫해 우승',d:'구단을 맡은 첫 시즌에 우승합니다(이직한 구단도 인정, 정규시즌 뒤 부임하면 다음 시즌).',r:{title:'첫해의 기적'}},
  {id:'double',c:'우승',n:'통합 우승',d:'정규시즌 1위와 한국시리즈 우승을 같은 해에 해냅니다.',r:{trust:2}},
  {id:'dynasty',c:'우승',n:'왕조',d:'같은 구단으로 3년 연속 우승합니다.',r:{rep:3,title:'왕조 설계자'}},
  {id:'champ5',c:'우승',n:'우승 5회',d:'단장 통산 우승 5회.',r:{rep:3},p:T=>[achTitlesN(T),5]},
  {id:'under',c:'우승',n:'언더독',d:'시즌 전 예상 순위(1월 1일 또는 개막 전망) 8위 이하였던 해에 우승합니다.',r:{title:'기적의 단장'}},
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
  {id:'sea50',c:'선수',n:'대기록의 해',d:'우리 선수가 시즌 50홈런·200안타·20승·40세이브 가운데 하나를 해냅니다.',r:null},
  {id:'youth5',c:'선수',n:'우리가 키운 주전',d:'우리가 지명한 선수 5명 이상이 한 시즌 주전 라인업에 섭니다.',r:{trust:2,title:'육성의 명가'}},
  {id:'post1',c:'선수',n:'해외로 보낸 꿈',d:'우리 선수를 포스팅으로 해외 리그에 보냅니다.',r:{rep:1}},
  {id:'legendMgr',c:'경력',n:'레전드의 귀환',d:'우리 구단 레전드 출신이 우리 구단 감독으로 시즌을 치릅니다.',r:{title:'레전드를 부른 단장'}},
  {id:'turn',c:'경력',n:'구원투수',d:'직전 시즌 8위 이하였던 구단을 맡아 두 시즌 안에 가을야구에 나갑니다.',r:{rep:2,title:'구원투수'}},
  {id:'gm1000',c:'경력',n:'1000경기',d:'한 구단에서 단장으로 1000경기를 치릅니다.',r:{trust:2},p:()=>[G.gmTen&&G.gmTen.tid===G.user?G.gmTen.g:0,1000]},
  {id:'stadNew',c:'재정',n:'새 집',d:'신구장을 지어 문을 엽니다.',r:{cash:500}},
  {id:'profit5',c:'재정',n:'흑자 경영',d:'흑자 시즌 5번.',r:{cash:500},p:T=>[T.profit,5]},
  {id:'cash200',c:'재정',n:'곳간',d:'시즌을 마칠 때 구단 현금 200억 원 이상.',r:null},
  {id:'trade10',c:'트레이드',n:'협상가',d:'트레이드 10건.',r:null,p:()=>[(G.trades||[]).filter(t=>t.gi).length,10]},
  {id:'steal',c:'트레이드',n:'도둑 트레이드',d:'트레이드 뒤 받은 선수의 WAR이 준 선수보다 8 이상 많습니다.',r:{rep:2}},
  {id:'asWin',c:'협회',n:'킹메이커',d:'지지를 밝힌 후보가 협회장에 당선됩니다.',r:null},
  {id:'cmtWin',c:'협회',n:'내 안대로',d:'상한 표결에서 우리 구단이 던진 안이 최종안이 됩니다.',r:null},
  /* 장기 플레이(40~60시즌) 보상(피드백 11-09p) */
  {id:'s40',c:'경력',n:'40시즌',d:'단장으로 40시즌을 보냅니다.',r:{trust:2},p:T=>[T.seasons,40]},
  {id:'s50',c:'경력',n:'50시즌',d:'단장으로 50시즌을 보냅니다.',r:{rep:2},p:T=>[T.seasons,50]},
  {id:'s60',c:'경력',n:'60시즌',d:'단장으로 60시즌을 보냅니다.',r:{rep:3,title:'야구계의 큰어른'},p:T=>[T.seasons,60],big:true},
  {id:'w1000',c:'경력',n:'1,000승',d:'단장 통산 정규시즌 1,000승.',r:{rep:2},p:()=>[achWins(),1000]},
  {id:'w2000',c:'경력',n:'2,000승',d:'단장 통산 정규시즌 2,000승.',r:{title:'2,000승 단장'},p:()=>[achWins(),2000]},
  {id:'gm3000',c:'경력',n:'3000경기',d:'한 구단에서 단장으로 3000경기를 치릅니다.',r:{trust:2,title:'구단의 얼굴'},p:()=>[G.gmTen&&G.gmTen.tid===G.user?G.gmTen.g:0,3000]},
  {id:'champ10',c:'우승',n:'우승 10회',d:'단장 통산 우승 10회.',r:{rep:3},p:T=>[achTitlesN(T),10]},
  {id:'champ15',c:'우승',n:'우승 15회',d:'단장 통산 우승 15회.',r:{cash:500,title:'우승 제조기'},p:T=>[achTitlesN(T),15],big:true},
  {id:'pupilMgr',c:'선수',n:'제자가 감독으로',d:'우리가 지명한 선수가 은퇴 뒤 우리 구단 감독이 되어 우승합니다.',r:{title:'야구 가문의 어른'}},
  {id:'gen2',c:'선수',n:'2대에 걸친 인연',d:'우리가 지명했던 선수의 아들을 우리가 지명합니다.',r:{rep:1}},
  {id:'retNo5',c:'선수',n:'결번의 벽',d:'우리 구단 영구결번 5개.',r:{trust:2},p:()=>[(G.retNos||[]).length,5]},
  {id:'hof10',c:'선수',n:'명예의 전당 사관학교',d:'우리가 지명했거나 우리 구단에서 뛴 명예의 전당 헌액자 10명.',r:{rep:2,title:'명예의 전당 사관학교장'},p:()=>[achHofMine(),10]},
  {id:'stad2',c:'재정',n:'두 번의 개장',d:'단장 재임 중 신구장을 두 번 엽니다(지금 맡은 구단).',r:{cash:500},p:()=>[achStadN(),2]},
  {id:'fWin',c:'첫걸음',n:'첫 승',d:'단장으로 맡은 구단이 정규시즌 첫 승을 거둡니다.',r:null},
  {id:'fDebut',c:'첫걸음',n:'첫 데뷔',d:'1군 기록이 없던 선수가 우리 유니폼을 입고 1군 경기에 나섭니다.',r:null},
  {id:'fLead',c:'첫걸음',n:'첫 선두',d:'정규시즌 10경기 이상 치른 뒤 1위로 하루를 마칩니다.',r:null},
  {id:'fTrade',c:'첫걸음',n:'첫 거래',d:'첫 트레이드를 성사시킵니다.',r:null},
  {id:'fFac',c:'첫걸음',n:'첫 완공',d:'구단 시설 공사를 처음 마칩니다.',r:null},
];
const ACH_BY=Object.fromEntries(ACH.map(a=>[a.id,a]));
const achHas=id=>!!(G&&G.ach&&G.ach[id]);
const achHasMeta=id=>!!achMeta().u[id];
function achRewardTxt(r){ if(!r)return '기록만 남습니다'; const L=[]; if(r.rep)L.push(`새 게임 시작 명성 +${r.rep}`); if(r.trust)L.push(`새 게임 첫 시즌 구단주 신뢰 +${r.trust}`); if(r.cash)L.push(`새 게임 창단 자금 +${money(r.cash)}`); if(r.title)L.push(`칭호 '${r.title}'`); return L.join(' · '); }

function achUnlock(id,why){ const a=ACH_BY[id]; if(!a)return false; if(G&&G.edited)return false; /* 에디터로 능력을 고친 저장은 도전과제를 열지 않는다 */ G.ach=G.ach||{}; const M=achMeta(); const newHere=!G.ach[id], newMeta=!M.u[id];
  if(!newHere&&!newMeta)return false;
  if(newHere)G.ach[id]={y:G.year,d:G.day};
  if(newMeta){ M.u[id]={at:Date.now(),y:G.year,team:G.user!=null&&G.teams&&G.teams[G.user]?tshort(G.user):''}; achMetaSave(); }
  if(newHere&&a.c==='첫걸음'){ try{ addLog(`도전과제 달성: ${a.n}${why?` (${why})`:''}`); }catch(e){} return true; } /* 작은 첫 성과는 소식함 대신 활동 기록에만 */
  if(newHere){ try{ mail('도전과제',`도전과제 달성: ${a.n}`,`${a.d}${why?`\n${why}`:''}\n\n보상: ${achRewardTxt(a.r)}${newMeta?'':'\n(다른 게임에서 이미 깬 과제라 보상은 그대로입니다.)'}\n구단 > 연대기 > 도전과제에서 볼 수 있습니다.`,{kind:'경력'}); }catch(e){} }
  return true; }

/* 첫걸음: 작은 첫 성과(하루 처리에서 확인) */
function achFirstDaily(){ if(!G||G.user==null||G.unemp)return; const U=G.user; const miss=id=>!achHas(id); const r=G.sea&&G.sea.rec&&G.sea.rec[U], own=achOwnRec(U), d0=achJoinD();
  if(miss('fWin')&&own&&own.w>=1)achUnlock('fWin'); /* 부임 뒤 승리만(검수 133) */
  if(miss('fLead')&&r&&own&&own.g>=1&&period()==='season'&&r.w+r.l+(r.t||0)>=10){ const st=standingsNow(); if(st[0]&&st[0].tid===U)achUnlock('fLead',`${r.w}승 ${r.l}패${r.t?` ${r.t}무`:''}`); } /* 무승부도 치른 경기, 부임 뒤 한 경기 이상(검수 134·135) */
  if(miss('fFac')&&G.fac&&G.fac.dn&&Object.values(G.fac.dn).some(d=>d>=d0))achUnlock('fFac'); /* 부임 전에 끝난 공사는 전임 몫(검수 138) */
  if(miss('fTrade')&&(G.trades||[]).some(t=>t.gi))achUnlock('fTrade');
  if(miss('post1')){ const a=(G.abroad||[]).find(x=>x.from===U&&!x.foreign&&/포스팅/.test(x.how||'')&&x.y>=(G.gmSince??0)); if(a)achUnlock('post1',`${a.name} → ${a.club||a.lg}`); }
  if(miss('stadNew')){ const S=G.teams[U]&&G.teams[U].stad; const D=S?achStadOpens(S).filter(d=>d>=d0):[]; if(D.length)achUnlock('stadNew',`${dobj(D[D.length-1]).y}년 개장`); } /* 부임 전에 연 구장은 전임 몫(검수 139) */
  if(miss('fDebut')&&period()==='season'){ const B=G.achDebB&&G.achDebB.y===G.year&&G.achDebB.tid===U?G.achDebB.ids:[]; const on=h=>!!h&&((h.pa||0)+(h.outs||0)+(h.bf||0)+(h.g||0))>0; /* 아웃 없이 내려간 구원투수도 출전(검수 142) */
    const p=playersOf(U).find(q=>{ if(B.includes(q.id))return false; /* 부임 전에 이미 1군에 나선 선수(검수 144) */ const h=seasonTotalT(q,G.year,'1군',U); if(!on(h))return false; return !q.hist.some(x=>x.lvl==='1군'&&(x.y<G.year||x.t!==U)&&on(x)); }); /* 같은 해 다른 팀 1군 기록도 데뷔로 본다 */ if(p)achUnlock('fDebut',`${p.name}, ${posLabel(p)}`); }
  if(miss('rep80')&&(G.rep??0)>=80)achUnlock('rep80'); /* 명성은 언제 올라도 그날(검수 145) */
  achProg(); }
/* 진행도형 과제: 경기 수·승수·결번 같은 누계는 바뀐 날 바로(검수 149) */
function achProg(){ if(!G||G.user==null)return; const T=achT(); for(const a of ACH){ if(!a.p||achHas(a.id))continue; let v=null; try{ v=a.p(T); }catch(e){} if(v&&v[0]>=v[1])achUnlock(a.id); } }
/* 부임 시점: 첫 시즌·데뷔 기준을 남긴다 */
function achJoinMark(tid){ const T=achT(); (T.fy=T.fy||{})[tid]=achFirstY(); G.achDebB={y:G.year,tid,ids:playersOf(tid).filter(q=>{ const h=seasonTotalT(q,G.year,'1군',tid); return !!h&&((h.pa||0)+(h.outs||0)+(h.bf||0)+(h.g||0))>0; }).map(q=>q.id)}; }
/* ctx.k: season(결산 직후), award(시상식), retNo(영구결번), switch(구단 이동), assoc(협회 결과) */
function achCheck(ctx){ if(!G||G.user==null)return; ctx=ctx||{}; const T=achT();
  if(ctx.k==='switch'){ if(G.unemp&&(G.unemp.k||'fired')==='fired')T.fired=true; /* 자진 사임·재계약 고사·계약 만료는 경질이 아니다(검수 11-06) */ if(ctx.to!=null&&!T.teams.includes(ctx.to))T.teams.push(ctx.to); return; } /* 구단 수 과제는 취임한 뒤(achSwitched)에 판정한다: 달성 구단이 새 구단으로 남게(검수 157) */
  if(ctx.k==='season'){ const L=G.last; if(!L||!L.ps)return; const y=L.y; if(T.seaY!=null&&y<=T.seaY)return; T.seaY=y; /* 이 해 결산을 판정했다: 시상은 아래 주인 기록만 본다 */ const O=achSeasonOwner(y); if(!O)return; /* 그해를 마친 재임이 없으면(시즌이 끝난 뒤 부임·시즌 도중 사임) 업적도 없다(검수 11-09zb·126~129) */ const U=O.tid; (T.own=T.own||{})[y]=U; const ps=L.ps; const t=team(U); const fin=L.fins&&L.fins[U];
    T.seasons++; if(fin&&fin.net>0)T.profit++; if(fin&&fin.tax>0)T.taxed=true;
    const inPs=!!(G.ps&&G.ps.seeds&&G.ps.seeds.includes(U)); T.psRun=inPs?T.psRun+1:0; T.psBest=Math.max(T.psBest,T.psRun);
    const rec=L.order.find(o=>o.tid===U); const fy=T.fy&&T.fy[U]!=null?T.fy[U]:U===G.user&&!G.unemp?(G.gmSinceD!=null&&G.gmSinceD>=dnum(G.gmSince,10,1)?G.gmSince+1:G.gmSince):null; /* 이 재임의 첫 시즌(부임 때 기록, 옛 저장은 부임일로) */
    if(ps.champ===U){ (T.titles[U]=T.titles[U]||[]).push(y); const M=achMeta(); M.champ[U]=(M.champ[U]||0)+1; achMetaSave();
      achUnlock('champ1'); if(fy===y)achUnlock('firstYr'); /* 정규시즌이 끝난 뒤 부임하면 다음 시즌이 첫 시즌(이직한 구단도 인정, 검수 136) */ if(ps.first===U)achUnlock('double');
      const ys=T.titles[U]; if(ys.includes(y-1)&&ys.includes(y-2))achUnlock('dynasty');
      const pr0=G.proj?G.proj.indexOf(U)+1:0, pj=G.projJan&&G.projJan.y===G.year?G.projJan.L.indexOf(U)+1:0, pr=Math.max(pr0,pj); if(pr>=8)achUnlock('under',`시즌 전 예상 ${pr}위${pj>pr0?'(1월 1일 전망)':''}.`); /* 1월 1일 전망도 인정: 겨울 보강으로 개막 전망이 올라가도 도전할 수 있게(커뮤니티 건의 11-11) */
      if(t.indie)achUnlock('indie'); if(!T.taxed)achUnlock('noTax');
      { const m=G.mgr[U], ob=m&&m.ob&&(G.ob||[]).find(o=>o.id===m.ob), id=ob&&ob.fid, p=id!=null&&(G.players[id]||(G.arch&&G.arch[id]&&archP(G.arch[id]))); if(p&&p.draft&&p.draft.tid===U)achUnlock('pupilMgr',`${m.name} 감독${p.draft.y!=null?`(${p.draft.y}년 지명)`:''}.`); } }
    { const w=O.w!=null?O.w:rec?rec.w:0; if(w>=90)achUnlock('w90',`${w}승.`); } /* 부임 뒤 내 승수만(검수 137) */
    { const big=achSeasonMine(U,y).find(x=>{ const h=x.h; return x.p.isP?((h.w||0)>=20||(h.sv||0)>=40):((h.hr||0)>=50||(h.h||0)>=200); }); if(big)achUnlock('sea50',`${y} ${big.p.name}`); } /* 공식 1군 시즌 기록으로(검수 141) */
    { let tg=144; try{ tg=tgp(U,y)||144; }catch(e){} const n=achSeasonMine(U,y).filter(x=>!x.p.isP&&x.p.draft&&x.p.draft.tid===U&&(achSeasonT(x.p,y,U).pa||0)>=Math.round(tg*3.1/2)).length; if(n>=5)achUnlock('youth5',`${y} 우리 지명 선수 ${n}명이 규정타석 절반 이상 출전.`); } /* 결산 날 라인업이 아니라 그 시즌 실제 출전(검수 140) */
    { const m=G.mgr[U], ob=m&&m.ob&&(G.ob||[]).find(o=>o.id===m.ob); if(ob&&ob.team===U)achUnlock('legendMgr',`${m.name} 감독.`); }
    if(inPs&&fy!=null&&y<=fy+1){ const H=(G.history||[]).find(h=>h.y===fy-1); const i=H&&H.order?H.order.findIndex(o=>(o.tid??o)===U):-1; if(i>=7)achUnlock('turn',`${fy-1}년 ${i+1}위 → ${y}년 가을야구.`); }
    if(fin&&t.cash>=20000)achUnlock('cash200');
    if((G.rep??0)>=80)achUnlock('rep80');
    for(const tr of (G.trades||[]).filter(x=>x.gi&&x.y<y)){ let r=null; try{ r=tradeReport(tr); }catch(e){} if(r&&r.net>=8){ achUnlock('steal',`${tr.y}년 ${tshort(tr.with)}와의 트레이드: 받은 쪽 WAR ${r.got.toFixed(1)}, 준 쪽 ${r.gave.toFixed(1)}.`); break; } } }
  if(ctx.k==='award'){ const y=G.year, A=G.awards&&G.awards[y]; if(!A)return; const U=(T.own||{})[y]??(T.seaY!=null&&T.seaY>=y||G.unemp?null:G.user); if(U==null)return; /* 결산 판정 기록이 없는 옛 저장만 지금 구단으로 본다 */ /* 그 시즌을 마친 구단 기준: 시상식 전에 떠나도 내 몫, 시즌이 끝난 뒤 맡은 구단의 수상은 전임 몫(검수 128·129) */ const mine=x=>x&&x.t===U; const drafted=x=>{ const p=x&&(G.players[x.id]||(G.arch&&G.arch[x.id]&&archP(G.arch[x.id]))); /* 보관 기록으로 옮겨진 수상자도(검수 11-06) */ return !!(p&&p.draft&&p.draft.tid===U); };
    if(ctx.a==='mvp'){ if(mine(A.mvp)&&drafted(A.mvp))achUnlock('draftMvp',`${y} MVP ${A.mvp.name}.`); if(mine(A.roy)&&drafted(A.roy))achUnlock('draftRoy',`${y} 신인왕 ${A.roy.name}.`); }
    if(ctx.a==='gg'){ const L=Object.values(A.gg||{}).filter(mine); if(L.length>=3)achUnlock('gg3',`${y} 골든글러브 ${L.map(x=>x.name).join(', ')}.`); T.ggMine+=L.filter(drafted).length; } }
  if(G.unemp){ achProg(); return; } /* 결산에서 물러나도 마친 시즌 누계(10시즌 등)는 그날(검수 126) */
  if(ctx.k==='retNo')achUnlock('retNo');
  if(ctx.k==='assoc'){ const A=G.assoc; if(!A)return; const E=A.els&&A.els[0]; if(E&&E.uv!=null&&E.win===E.uv&&E.y===G.year)achUnlock('asWin',`${E.c[E.win].name} 협회장 당선.`);
    const C=A.cmt&&A.cmt[0]; if(C&&C.held&&C.uv!=null&&C.uv===C.fin&&C.y===G.year+1)achUnlock('cmtWin'); }
  /* 진행도형 과제는 언제 확인해도 된다 */
  achProg(); }
/* 그 구단에서 y시즌 1군 기록이 있는 선수(떠났거나 보관된 선수도) */
function achSeasonT(p,y,U){ return seasonTotalT(p,y,'1군',U)||{}; }
function achSeasonMine(U,y){ const L=[]; for(const p of Object.values(G.players)){ if(!(p.hist||[]).some(h=>h.y===y&&h.lvl==='1군'&&h.t===U))continue; const h=seasonTotal(p,y,'1군'); if(h)L.push({p,h}); }
  for(const id in (G.arch||{})){ if(G.players[id])continue; try{ const q=archP(G.arch[id]); if(!q||!(q.hist||[]).some(h=>h.y===y&&h.lvl==='1군'&&h.t===U))continue; const h=seasonTotal(q,y,'1군'); if(h)L.push({p:q,h}); }catch(e){} } return L; }
/* 취임한 뒤: 맡은 구단 수 과제는 새 구단에서 달성(검수 157) */
function achSwitched(tid,wasU){ const T=achT(); if(!T.teams.includes(tid))T.teams.push(tid); if(T.teams.length>=3)achUnlock('teams3'); if(T.fired&&wasU)achUnlock('comeback'); achJoinMark(tid); }


/* 새 게임 혜택: 깬 과제(모든 게임 공통)의 보상 합. 상한을 넘지 않는다 */
function achPerks(){ const M=achMeta(); const P={rep:0,trust:0,cash:0}; for(const id in M.u){ const a=ACH_BY[id]; if(!a||!a.r)continue; for(const k of ['rep','trust','cash'])P[k]+=a.r[k]||0; } for(const k in P)P[k]=Math.min(P[k],ACH_CAP[k]); return P; }
function achTitles(){ const M=achMeta(); return ACH.filter(a=>a.r&&a.r.title&&M.u[a.id]).map(a=>a.r.title); }
function achTitle(){ const M=achMeta(); const L=achTitles(); return M.title&&L.includes(M.title)?M.title:null; }
function achSetTitle(t){ const M=achMeta(); M.title=t&&achTitles().includes(t)?t:null; achMetaSave(); }

/* ---------- 기존 흐름에 끼우는 곳(다른 파일을 고치지 않고 감싼다) ---------- */
(function(){
  const wrap=(name,after,before)=>{ try{ const f=eval(name); if(typeof f!=='function')return; const g=function(){ let b; if(before)try{ b=before.apply(this,arguments); }catch(e){} const r=f.apply(this,arguments); if(after)try{ after.call(this,r,arguments,b); }catch(e){} return r; }; eval(name+'=g'); }catch(e){} };
  /* 새 게임: 구단을 맡는 순간 혜택을 얹는다 */
  wrap('claimTeam',(r,args)=>{ const P=achPerks(); const t=team(args[0]); G.rep=clamp(Math.round((G.rep??50)+P.rep),0,100); t.trust=clamp((t.trust??55)+P.trust,0,100); t.cash=(t.cash||0)+P.cash; G.achPerk=P; G.ach={}; G.achT=null; achT(); });
  /* 결산 직후(우승·성적·재정) */
  wrap('settlement',()=>achCheck({k:'season'}));
  /* 시상식(MVP·신인왕, 골든글러브) */
  wrap('awardCeremony',(r,args,pend)=>{ if(pend)achCheck({k:'award',a:args[0]}); },(k)=>{ const A=G.awards&&G.awards[G.year]; return !!(A&&A.pend&&A.pend[k]); });
  /* 영구결번 */
  wrap('retireNumber',(r,a,n0)=>{ if((G.retNos||[]).length>n0)achCheck({k:'retNo'}); },()=>(G.retNos||[]).length); /* 실제로 결번이 늘었을 때만(거절 문구로는 열지 않는다, 검수 11-09zz) */
  /* 구단 이동: 옮기기 전에 기록한다(야인이었는지) */
  wrap('switchTeam',(r,args,wasU)=>achSwitched(args[0],wasU),(tid)=>{ const w=!!G.unemp; achCheck({k:'switch',to:tid}); return w; }); /* 옮기기 전에 경질 여부를, 취임한 뒤에 달성을 기록한다 */
  wrap('claimTeam',(r,args)=>achJoinMark(args[0]));
  /* 그날 경기를 치른 뒤에도 첫걸음을 본다: 정규시즌 마지막 날 데뷔·선두(검수 143) */
  wrap('playDay',()=>achFirstDaily());
  /* 협회: 선거·상한 표결 결과 */
  wrap('asElect',()=>achCheck({k:'assoc'})); wrap('capCouncil',()=>achCheck({k:'assoc'}));
})();
