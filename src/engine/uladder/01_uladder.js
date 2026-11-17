/* ===== 유저 래더(덱 리그): 내 덱 + 같은 단계 덱 9개로 10팀 리그를 이 기기에서 돌린다 =====
   규칙·승강·상대 고르기는 공용 모듈(src/core/uladder.mjs). 덱은 프런트컵 엔트리 형식, 경기는 cupMatch(3연전, 무승부 허용, 선발 순번 이어 가기) 그대로.
   난수는 평범한 난수(같은 덱이라도 리그마다 결과가 다르다). 커리어 G는 G.uld(단계·기록·지금 리그)만 쓴다: 리그 경기는 커리어 세계를 건드리지 않는다.
   리그 중간(연전 사이)에 내 덱을 고치면 다음 연전부터 그 덱으로 나간다. 상대 덱은 리그를 시작할 때 받은 사본으로 고정한다 */
function uld(){ if(!G)return null; const U=G.uld||(G.uld={v:2,tier:0,hist:[],deck:null,league:null,last:null,dn:0,ps:{},opp:{}}); if((U.v|0)<2)FrontOfficeCore.ulMigrate(U); return U; } /* v2: 예전 저장은 처음 열 때 옮긴다(선수·상대 기록 칸, 사용자 11-17) */
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
/* 리그 만들기: 서버에서 받은 덱(fetched) → 가져온 우승 덱(cup, 최대 2) → 모자라면 단계 기준 AI. 상대는 사본으로 잠근다.
   fetched는 엔트리 그대로 또는 서버 v1 모양 {e, pid, nick}(사용자 11-17: 상대 플레이어 id·닉네임을 리그 팀에 붙여 두고 리그가 끝나면 맞대결로 보낸다) */
function ulMakeLeague(o){ o=o||{}; const C=FrontOfficeCore, U=uld(); if(!U||!U.deck)return {ok:false,msg:'먼저 내 덱을 등록해 주세요.'};
  const tier=U.tier|0, mine=U.deck.e, seen=new Set([mine.h]), T=[{key:UL_ME,kind:'me',name:mine.name,e:JSON.parse(JSON.stringify(mine))}];
  const add=(e,kind,m)=>{ if(T.length>=C.UL_TEAMS||!e||!Array.isArray(e.P))return; const x=C.ulSlim(e); x.h=C.cupEntryHash(x); if(seen.has(x.h)||!C.cupValidate(x,{}).ok)return; x.ovr=x.ovr||cupOvr(x); seen.add(x.h); const t={key:'t'+T.length,kind,name:x.name,e:x}; if(m&&m.pid){ t.pid=String(m.pid); t.nick=String(m.nick||''); } T.push(t); };
  for(const d of o.fetched||[]){ if(d&&d.e&&!Array.isArray(d.P))add(d.e,'user',d); else add(d,'user'); } let nc=0; for(const e of o.cup||[]){ if(nc>=2)break; const k=T.length; add(e,'cup'); if(T.length>k)nc++; }
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
  const x={id:s.id,r:s.r,a:s.a,b:s.b,ha:res.a.h,hb:res.b.h,g:res.games.map(g=>[g.sa,g.sb,g.inn||9,g.walk?1:0]),mvp:res.games.map(g=>g.mvp&&g.mvp.name||'')};
  if(s.a===0||s.b===0)ulKeep(L,s,res.games); L.series.push(x); L.next++; return x; }
/* 명경기: 우리 경기 가운데 끝내기·연장·역전·접전 점수(공용 cupDrama)가 높은 3경기만 중계·박스·줄 점수를 남긴다('이 경기 보기') */
const UL_KEEP=3;
function ulGameTag(sa,sb,g){ const w=sa>sb, d=Math.abs(sa-sb); return g.walk?(w?'끝내기 승':'끝내기 패'):sa===sb?`${g.inn}회 무승부`:g.lc&&w?'역전승':g.lc?'역전패':g.inn>9?`${g.inn}회 연장 ${w?'승':'패'}`:d>=7?(w?'대승':'대패'):d<=1?(w?'1점 차 승':'1점 차 패'):w?'승':'패'; }
function ulKeep(L,s,games){ const me=s.a===0?'A':'B', op=L.teams[s.a===0?s.b:s.a]; const K=L.keys||(L.keys=[]);
  games.forEach((g,i)=>{ const sa=me==='A'?g.sa:g.sb, sb=me==='A'?g.sb:g.sa, dr=FrontOfficeCore.cupDrama(g)+(sa>sb?.5:0);
    K.push({r:s.r,i,opp:op.name,sa,sb,inn:g.inn||9,walk:g.walk?1:0,dr:Math.round(dr*10)/10,tag:ulGameTag(sa,sb,g),mvp:g.mvp?`${g.mvp.name} ${g.mvp.txt}`:'',log:g.log,bat:g.bat,pit:g.pit,line:g.line}); });
  K.sort((a,b)=>b.dr-a.dr||a.r-b.r||a.i-b.i); K.length=Math.min(K.length,UL_KEEP); }
/* 덱 성향(상대 덱 미리보기): 타격·장타·컨택·수비·선발·불펜을 표시 척도(dv)로 */
const UL_PROF=[['off','타격'],['pow','장타'],['con','컨택'],['def','수비'],['sp','선발'],['pen','불펜']];
function ulProfile(e){ if(!e||!Array.isArray(e.P))return null; const D=FrontOfficeCore.dv, P=new Map(e.P.map(p=>[p.id,p])), ok=p=>p&&!(p.injOut>0);
  const L=(e.ln||[]).map(([id,pos])=>[P.get(id),pos]).filter(x=>x[0]), bats=L.map(x=>x[0]);
  const rot=(e.rot||[]).map(id=>P.get(id)).filter(ok), pen=(e.pen||[]).map(id=>P.get(id)).filter(ok).map(penV).sort((a,b)=>b-a).slice(0,5);
  return {off:D(avg(bats.map(offV))),pow:D(avg(bats.map(p=>p.r.pow))),con:D(avg(bats.map(p=>p.r.con))),def:D(avg(L.filter(x=>x[1]!=='DH').map(x=>defAt(x[0],x[1])))),sp:D(avg(rot.map(spV))),pen:D(pen.length?avg(pen):0)}; }
/* 두 덱 비교: 상대가 앞선 곳·우리가 앞선 곳(3 이상 차이) */
function ulVs(me,op){ const a=ulProfile(me), b=ulProfile(op); if(!a||!b)return null; const rows=UL_PROF.map(([k,n])=>({k,n,me:a[k],op:b[k],d:b[k]-a[k]}));
  const by=rows.slice().sort((x,y)=>y.d-x.d); return {rows,opBest:by.filter(x=>x.d>=3).slice(0,2),meBest:by.slice().reverse().filter(x=>x.d<=-3).slice(0,2)}; }
/* 리그 기록 카드: 리그 1위 기록(홈런·타율·타점·승·탈삼진·세이브), 상대별 전적·천적·최다 연승·최다 점수 차 승 */
function ulRecords(L){ const B=Object.values(L.bat), Pt=Object.values(L.pit), gpc=27, me=x=>String(x.key).startsWith(UL_ME+':');
  const top=(A,f,k,q)=>{ const x=A.filter(q||(()=>true)).sort((a,b)=>f(b)-f(a)||String(a.key).localeCompare(String(b.key)))[0]; return x&&f(x)>0?{k,name:x.name,team:x.team,me:me(x),v:f(x)}:null; };
  const avgOf=x=>x.ab?x.h/x.ab:0, qual=x=>(x.pa||0)>=Math.round(gpc*3.1);
  const lead=[top(B,x=>x.hr,'홈런'),top(B,avgOf,'타율',qual),top(B,x=>x.rbi,'타점'),top(Pt,x=>x.w||0,'승리'),top(Pt,x=>x.so,'탈삼진'),top(Pt,x=>x.sv||0,'세이브')].filter(Boolean)
    .map(x=>Object.assign(x,{v:x.k==='타율'?x.v.toFixed(3).replace(/^0/,''):x.v}));
  const h2h=new Map(); let run=0, best=0, big=null;
  for(const s of L.series){ if(s.a!==0&&s.b!==0)continue; const oi=s.a===0?s.b:s.a, mine=s.a===0; const o=h2h.get(oi)||{i:oi,name:L.teams[oi].name,w:0,l:0,t:0};
    for(const g of s.g){ const a=mine?g[0]:g[1], b=mine?g[1]:g[0]; if(a>b){ o.w++; run++; best=Math.max(best,run); if(!big||a-b>big.d)big={d:a-b,sa:a,sb:b,opp:o.name,r:s.r}; } else { if(a<b)o.l++; else o.t++; run=0; } }
    h2h.set(oi,o); }
  const H=[...h2h.values()], nem=H.filter(x=>x.l>=2&&x.w===0).sort((a,b)=>b.l-a.l)[0]||null, prey=H.filter(x=>x.w>=3&&x.l===0)[0]||null;
  return {lead,h2h:H,nem,prey,streak:best,big}; }
/* 다음 라운드(연전 5개: 우리 연전 포함)까지 */
function ulRunRound(L){ L=L||(uld()||{}).league; if(!L||L.next>=L.sched.length)return []; const r=L.sched[L.next].r, out=[]; while(L.next<L.sched.length&&L.sched[L.next].r===r)out.push(ulRunSeries(L)); return out; }
function ulStand(L){ const keys=L.teams.map((t,i)=>i), flat=[]; for(const s of L.series)for(const g of s.g)flat.push({a:s.a,b:s.b,sa:g[0],sb:g[1]}); return FrontOfficeCore.cupStandings(keys,flat); }
/* 리그 끝: 순위·승강·MVP·기록 남기기 */
function ulFinish(){ const C=FrontOfficeCore, U=uld(), L=U&&U.league; if(!L||L.next<L.sched.length)return null;
  const st=ulStand(L), me=st.find(x=>x.key===0), mv=C.ulTierAfter(L.tier,me.rank,L.teams.length);
  const no=L.teams.filter(t=>t.kind==='ai').map(t=>t.key), mvp=C.cupMvp(Object.values(L.bat),Object.values(L.pit),no);
  const myMvp=C.cupMvp(Object.values(L.bat).filter(x=>x.key.startsWith(UL_ME+':')),Object.values(L.pit).filter(x=>x.key.startsWith(UL_ME+':')),[]);
  const pts=C.ulPts(L.tier,me.rank,L.teams.length), se=C.ulSeason(Date.now());
  if(U.seas&&U.seas.id!==se.id){ (U.seasons=U.seasons||[]).push(U.seas); if(U.seasons.length>26)U.seasons.shift(); }
  U.seas=C.ulSeasonAdd2(U.seas,se.id,se.label,{tier:L.tier,rank:me.rank,to:mv.tier,move:mv.move,w:me.w,l:me.l,t:me.t,rs:me.rs,ra:me.ra});
  const res={id:L.id,tier:L.tier,to:mv.tier,move:mv.move,rank:me.rank,w:me.w,l:me.l,t:me.t,d:L.deck,name:L.teams[0].name,at:G.day,y:G.year,mvp,myMvp,pts,season:se.id,rec:ulRecords(L),keys:L.keys||[],
    stand:st.map(x=>({rank:x.rank,name:L.teams[x.key].name,kind:L.teams[x.key].kind,w:x.w,l:x.l,t:x.t,pct:x.pct,gb:x.gb,diff:x.diff,ovr:L.teams[x.key].e.ovr})),edits:L.edits.length,src:L.src};
  res.teams=L.teams.map(t=>({name:t.name,kind:t.kind,nick:t.nick||'',ovr:t.e.ovr})); res.ser=L.series.map(x=>[x.r,x.a,x.b,x.g]); res.rs=me.rs; res.ra=me.ra; /* 끝난 리그 일정·결과(사용자 11-17) */
  ulAccum(U,L,st,se); U.hist.push({tier:L.tier,rank:me.rank,to:mv.tier,move:mv.move,d:L.deck,name:res.name,at:G.day,y:G.year,s:se.id,w:me.w,l:me.l,t:me.t,rd:me.diff,pts}); if(U.hist.length>200)U.hist.splice(0,U.hist.length-200);
  U.tier=mv.tier; U.best=Math.max(U.best|0,mv.tier,L.tier); U.last=res; U.league=null; return res; }

/* 래더 v2 누적(사용자 11-17 "디테일한 데이터 뽑아보게해"): 우리 선수 리그 기록(시즌·단계 칸) + 상대 덱별 전적·성향. 한도는 공용 규칙(UL_PS_MAX·UL_OPP_MAX) */
function ulAccum(U,L,st,se){ const C=FrontOfficeCore; U.ps=U.ps||{}; U.opp=U.opp||{}; const pre=UL_ME+':', idOf=k=>String(k).slice(pre.length);
  const B=Object.values(L.bat).filter(x=>String(x.key).startsWith(pre)), Pt=Object.values(L.pit).filter(x=>String(x.key).startsWith(pre));
  const info=new Map(L.teams[0].e.P.map(p=>[String(p.id),{id:p.id,name:p.name,pos:p.pos,isP:p.isP,age:p.age,foreign:p.foreign?1:0}])); for(const x of [...B,...Pt])if(!info.has(idOf(x.key)))info.set(idOf(x.key),{id:idOf(x.key),name:x.name});
  C.ulPsAdd(U.ps,{sid:se.id,tier:L.tier,lid:L.id,P:[...info.values()],bat:B.map(x=>Object.assign({},x,{id:idOf(x.key)})),pit:Pt.map(x=>Object.assign({},x,{id:idOf(x.key)}))});
  const rd=new Map(); for(const s of L.series){ if(s.a!==0&&s.b!==0)continue; const oi=s.a===0?s.b:s.a, o=rd.get(oi)||{w:0,l:0,t:0,rs:0,ra:0}; for(const g of s.g){ const a=s.a===0?g[0]:g[1], b=s.a===0?g[1]:g[0]; o.rs+=a; o.ra+=b; if(a>b)o.w++; else if(a<b)o.l++; else o.t++; } rd.set(oi,o); }
  const now=Date.now(), mp=ulProfile(L.teams[0].e);
  L.teams.forEach((t,i)=>{ if(!i)return; const k=t.pid?'p:'+t.pid:t.kind+':'+t.name, r=rd.get(i)||{w:0,l:0,t:0,rs:0,ra:0}, o=U.opp[k]||(U.opp[k]={k,name:t.name,kind:t.kind,n:0,w:0,l:0,t:0,rs:0,ra:0});
    Object.assign(o,{name:t.name,nick:t.nick||o.nick||'',pid:t.pid||null,kind:t.kind,ovr:t.e.ovr,tier:L.tier,at:now,rank:(st.find(x=>x.key===i)||{}).rank,prof:ulProfile(t.e),mine:mp,m:C.ulDeckMeta(t.e)}); o.n++; for(const f of ['w','l','t','rs','ra'])o[f]+=r[f]; });
  const ks=Object.keys(U.opp); if(ks.length>C.UL_OPP_MAX)ks.sort((a,b)=>(U.opp[a].at||0)-(U.opp[b].at||0)).slice(0,ks.length-C.UL_OPP_MAX).forEach(k=>delete U.opp[k]); }
