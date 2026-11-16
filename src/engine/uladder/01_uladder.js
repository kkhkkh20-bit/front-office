/* ===== 유저 래더(덱 리그): 내 덱 + 같은 단계 덱 9개로 10팀 리그를 이 기기에서 돌린다 =====
   규칙·승강·상대 고르기는 공용 모듈(src/core/uladder.mjs). 덱은 프런트컵 엔트리 형식, 경기는 cupMatch(3연전, 무승부 허용, 선발 순번 이어 가기) 그대로.
   난수는 평범한 난수(같은 덱이라도 리그마다 결과가 다르다). 커리어 G는 G.uld(단계·기록·지금 리그)만 쓴다: 리그 경기는 커리어 세계를 건드리지 않는다.
   리그 중간(연전 사이)에 내 덱을 고치면 다음 연전부터 그 덱으로 나간다. 상대 덱은 리그를 시작할 때 받은 사본으로 고정한다 */
function uld(){ if(!G)return null; const U=G.uld||(G.uld={v:1,tier:0,hist:[],deck:null,league:null,last:null,dn:0}); return U; }
const UL_ME='me';
/* 덱 등록(이 저장의 내 덱). src: 'now'(지금 1군) | 'alb:번호'(앨범 시즌). 가져온 남의 덱(ro)은 등록할 수 없다 */
function ulSetDeck(e,src){ const C=FrontOfficeCore; if(!e||e.ro)return '가져온 덱은 내 덱으로 등록할 수 없습니다.'; const x=C.ulSlim(e); x.h=C.cupEntryHash(x); x.ovr=cupOvr(x);
  const v=C.cupValidate(x,{}); if(!v.ok)return v.errors[0].msg; const U=uld(); U.dn=(U.dn||0)+1; U.deck={id:U.dn,src:String(src||'now'),at:G.day,y:G.year,e:x}; return ''; }
/* 단계 기준 AI 덱: 리그 평균 AI 구단을 만들고 능력치를 고르게 올리거나 내려 기준 OVR(총)에 맞춘다 */
let UL_AI_BASE=null;
function ulScale(e,target){ const base=JSON.parse(JSON.stringify(e)); const at=d=>{ const x=JSON.parse(JSON.stringify(base)); for(const p of x.P)for(const k in p.r)if(k!=='vit')p.r[k]=Math.round(clamp(p.r[k]+d,20,85)*10)/10; x.ovr=cupOvr(x); return x; };
  let lo=-25, hi=25, best=at(0); for(let i=0;i<14;i++){ const mid=(lo+hi)/2, x=at(mid); if(Math.abs(x.ovr.t-target)<Math.abs(best.ovr.t-target))best=x; if(x.ovr.t<target)lo=mid; else hi=mid; if(x.ovr.t===target){ best=x; break; } }
  best.h=FrontOfficeCore.cupEntryHash(best); return best; }
function ulAiDecks(n,target,tag){ if(n<=0)return []; if(!UL_AI_BASE||UL_AI_BASE.length<n)UL_AI_BASE=cupAiEntries(Math.max(9,n),'ul');
  const nick=['하운즈','파이터스','스톰','로열스','마린스','레이븐스','타이탄스','팬서스','블레이즈','코메츠'];
  return UL_AI_BASE.slice(0,n).map((e,i)=>{ const x=ulScale(e,target); x.name=FrontOfficeCore.cupName(`AI ${nick[i%nick.length]}`); x.ai=1; x.h=FrontOfficeCore.cupEntryHash(x); return x; }); }
/* 리그 만들기: 서버에서 받은 덱(fetched) → 가져온 우승 덱(cup, 최대 2) → 모자라면 단계 기준 AI. 상대는 사본으로 잠근다 */
function ulMakeLeague(o){ o=o||{}; const C=FrontOfficeCore, U=uld(); if(!U||!U.deck)return {ok:false,msg:'먼저 내 덱을 등록해 주세요.'};
  const tier=U.tier|0, mine=U.deck.e, seen=new Set([mine.h]), T=[{key:UL_ME,kind:'me',name:mine.name,e:JSON.parse(JSON.stringify(mine))}];
  const add=(e,kind)=>{ if(T.length>=C.UL_TEAMS||!e||!Array.isArray(e.P))return; const x=C.ulSlim(e); x.h=C.cupEntryHash(x); if(seen.has(x.h)||!C.cupValidate(x,{}).ok)return; x.ovr=x.ovr||cupOvr(x); seen.add(x.h); T.push({key:'t'+T.length,kind,name:x.name,e:x}); };
  for(const e of o.fetched||[])add(e,'user'); let nc=0; for(const e of o.cup||[]){ if(nc>=2)break; const k=T.length; add(e,'cup'); if(T.length>k)nc++; }
  const need=C.UL_TEAMS-T.length, avg=o.avg&&o.count>=3?Math.round(o.avg):C.UL_TIER_OVR[tier]; for(const e of ulAiDecks(need,avg))add(e,'ai');
  const sched=C.cupLeagueSched(T.length,3);
  U.league={v:1,id:(U.lid=(U.lid||0)+1),tier,deck:U.deck.id,at:G.day,y:G.year,teams:T,sched,next:0,series:[],cnt:T.map(()=>0),bat:{},pit:{},edits:[],src:{user:T.filter(t=>t.kind==='user').length,cup:T.filter(t=>t.kind==='cup').length,ai:T.filter(t=>t.kind==='ai').length},avg};
  return {ok:true,league:U.league}; }
/* 리그 중 내 덱 고치기: 다음 연전부터 */
function ulEditDeck(e){ const C=FrontOfficeCore, U=uld(), L=U&&U.league; if(!L)return '진행 중인 리그가 없습니다.'; if(e&&e.ro)return '가져온 덱은 쓸 수 없습니다.';
  const x=C.ulSlim(e); x.h=C.cupEntryHash(x); x.ovr=cupOvr(x); const v=C.cupValidate(x,{}); if(!v.ok)return v.errors[0].msg;
  L.teams[0].e=x; L.teams[0].name=x.name; L.edits.push({at:L.next,h:x.h}); if(U.deck){ U.deck.e=JSON.parse(JSON.stringify(x)); } return ''; }
/* 연전 하나 */
function ulRunSeries(L){ const s=L.sched[L.next]; if(!s)return null; const A=L.teams[s.a], B=L.teams[s.b];
  const res=cupMatch(A.e,B.e,{cup:'ul',round:'L'+s.r,match:s.id,best:3,all:1,tie:1,home:s.home,ri:[L.cnt[s.a],L.cnt[s.b]]}); if(!res.ok)throw new Error('경기 실패: '+((res.errors&&res.errors[0]&&res.errors[0].msg)||''));
  const key={A:A.key,B:B.key};
  for(const g of res.games){ for(const b of g.stats.bat){ const k=key[b.k]+':'+String(b.key).split(':')[1], t=L.bat[k]||(L.bat[k]={key:k,team:L.teams[b.k==='A'?s.a:s.b].name,name:b.name,g:0}); t.g++; for(const f of ['pa','ab','h','d','tr','hr','bb','hbp','sf','rbi','r','sb','so'])t[f]=(t[f]||0)+(b[f]||0); }
    for(const p of g.stats.pit){ const k=key[p.k]+':'+String(p.key).split(':')[1], t=L.pit[k]||(L.pit[k]={key:k,team:L.teams[p.k==='A'?s.a:s.b].name,name:p.name,g:0}); t.g++; for(const f of ['outs','h','bb','so','r','er','hr','w','l','sv','gs'])t[f]=(t[f]||0)+(p[f]||0); } }
  L.cnt[s.a]+=res.games.length; L.cnt[s.b]+=res.games.length;
  const x={id:s.id,r:s.r,a:s.a,b:s.b,ha:res.a.h,hb:res.b.h,g:res.games.map(g=>[g.sa,g.sb,g.inn||9,g.walk?1:0]),mvp:res.games.map(g=>g.mvp&&g.mvp.name||'')}; L.series.push(x); L.next++; return x; }
/* 다음 라운드(연전 5개: 우리 연전 포함)까지 */
function ulRunRound(L){ L=L||(uld()||{}).league; if(!L||L.next>=L.sched.length)return []; const r=L.sched[L.next].r, out=[]; while(L.next<L.sched.length&&L.sched[L.next].r===r)out.push(ulRunSeries(L)); return out; }
function ulStand(L){ const keys=L.teams.map((t,i)=>i), flat=[]; for(const s of L.series)for(const g of s.g)flat.push({a:s.a,b:s.b,sa:g[0],sb:g[1]}); return FrontOfficeCore.cupStandings(keys,flat); }
/* 리그 끝: 순위·승강·MVP·기록 남기기 */
function ulFinish(){ const C=FrontOfficeCore, U=uld(), L=U&&U.league; if(!L||L.next<L.sched.length)return null;
  const st=ulStand(L), me=st.find(x=>x.key===0), mv=C.ulTierAfter(L.tier,me.rank,L.teams.length);
  const no=L.teams.filter(t=>t.kind==='ai').map(t=>t.key), mvp=C.cupMvp(Object.values(L.bat),Object.values(L.pit),no);
  const myMvp=C.cupMvp(Object.values(L.bat).filter(x=>x.key.startsWith(UL_ME+':')),Object.values(L.pit).filter(x=>x.key.startsWith(UL_ME+':')),[]);
  const res={id:L.id,tier:L.tier,to:mv.tier,move:mv.move,rank:me.rank,w:me.w,l:me.l,t:me.t,d:L.deck,name:L.teams[0].name,at:G.day,y:G.year,mvp,myMvp,
    stand:st.map(x=>({rank:x.rank,name:L.teams[x.key].name,kind:L.teams[x.key].kind,w:x.w,l:x.l,t:x.t,pct:x.pct,gb:x.gb,diff:x.diff,ovr:L.teams[x.key].e.ovr})),edits:L.edits.length,src:L.src};
  U.hist.push({tier:L.tier,rank:me.rank,to:mv.tier,move:mv.move,d:L.deck,name:res.name,at:G.day,y:G.year}); if(U.hist.length>200)U.hist.splice(0,U.hist.length-200);
  U.tier=mv.tier; U.best=Math.max(U.best|0,mv.tier,L.tier); U.last=res; U.league=null; return res; }
