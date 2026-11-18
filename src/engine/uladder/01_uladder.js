/* ===== 유저 래더(덱 리그): 내 덱 + 같은 단계 덱 9개로 10팀 리그를 이 기기에서 돌린다 =====
   규칙·승강·상대 고르기는 공용 모듈(src/core/uladder.mjs). 덱은 프런트컵 엔트리 형식, 경기는 cupMatch(3연전, 무승부 허용, 선발 순번 이어 가기) 그대로.
   난수는 평범한 난수(같은 덱이라도 리그마다 결과가 다르다). 커리어 G는 G.uld(단계·기록·지금 리그)만 쓴다: 리그 경기는 커리어 세계를 건드리지 않는다.
   리그 중간(연전 사이)에 내 덱을 고치면 다음 연전부터 그 덱으로 나간다. 상대 덱은 리그를 시작할 때 받은 사본으로 고정한다 */
function uld(){ if(!G)return null; const U=G.uld||(G.uld={v:2,tier:0,hist:[],deck:null,league:null,last:null,dn:0,ps:{},opp:{}}); if((U.v|0)<2)FrontOfficeCore.ulMigrate(U); if(!U.car)U.car=FrontOfficeCore.ulCareerInit(U.hist,U.best); if(typeof U.seenS==='number'){ if(Number.isFinite(U.seenS))U.seenS='S'+U.seenS; else delete U.seenS; } if(U.league)ulLgMig(U.league); /* 3연전 리그(사용자 11-18): 예전 리그는 빈 칸만 더해 이어 간다(난수 없음) */ /* 예전 저장: 숫자로 남긴 시즌 확인 표시(NaN은 버린다 → 결산 카드가 한 번 더 보임, 외부 검수 11-17) */ return U; } /* 통산 칸(외부 검수 11-17): 없으면 남은 기록 줄로 한 번 만든다 */ /* v2: 예전 저장은 처음 열 때 옮긴다(선수·상대 기록 칸, 사용자 11-17) */
const UL_ME='me';
/* 덱 등록(이 저장의 내 덱). src: 'now'(지금 1군) | 'alb:번호'(앨범 시즌). 가져온 남의 덱(ro)은 등록할 수 없다 */
function ulSetDeck(e,src){ const C=FrontOfficeCore; if(!e||e.ro)return '가져온 덱은 내 덱으로 등록할 수 없습니다.'; const x=C.ulSlim(e); x.h=C.cupEntryHash(x); x.ovr=cupOvr(x);
  const v=C.cupValidate(x,{}); if(!v.ok)return v.errors[0].msg; const U=uld(); const cg=C.ulCapGate(x,U.tier|0,Date.now()); if(!cg.ok||cg.grace)return cg.known?cg.msg+' 덱에서 선수를 빼 상한에 맞춰 주세요.':'연봉 기록이 없는 로스터입니다(게임을 새로 고친 뒤 다시 골라 주세요).'; /* 연봉 상한(사용자 11-17 "공평하게"): 새로 등록하는 덱은 유예 없이 지금 단계 상한 안이어야 한다 */ U.dn=(U.dn||0)+1; U.deck={id:U.dn,src:String(src||'now'),at:G.day,y:G.year,e:x}; return ''; }
/* 단계 기준 AI 덱: 리그 평균 AI 구단을 만들고 능력치를 올리거나 내려 기준 OVR(총)에 맞춘다.
   타자·투수를 따로 맞춘다(사용자 11-17 "고 오버롤", 포지션 균형): 타자 OVR을 기준−1로 먼저 맞추고, 투수로 총 OVR을 맞춘다. 실제 등록 덱(투수 ≈ 총+1.5, 타자 ≈ 총−1)과 비슷한 모양.
   예전처럼 모두 같이 올리면 레전드 AI가 투수만 98인 덱이 됐다(선발 98·타자 74). 능력치는 20~85 안 */
let UL_AI_BASE=null;
function ulScale(e,target){ const base=JSON.parse(JSON.stringify(e)); const at=(db,dp)=>{ const x=JSON.parse(JSON.stringify(base)); for(const p of x.P){ const d=p.isP?dp:db; for(const k in p.r)if(k!=='vit')p.r[k]=Math.round(clamp(p.r[k]+d,20,85)*10)/10; } x.ovr=cupOvr(x); return x; };
  const fit=(f,key,goal)=>{ let lo=-25, hi=25, bd=0, bv=null; for(let i=0;i<16;i++){ const mid=(lo+hi)/2, v=f(mid).ovr[key]; if(bv==null||Math.abs(v-goal)<Math.abs(bv-goal)){ bv=v; bd=mid; } if(v===goal){ bd=mid; break; } if(v<goal)lo=mid; else hi=mid; } return bd; };
  const db=fit(d=>at(d,0),'b',target-1), dp=fit(d=>at(db,d),'t',target), best=at(db,dp);
  best.h=FrontOfficeCore.cupEntryHash(best); return best; }
function ulAiDecks(n,target,tag){ if(n<=0)return []; if(!UL_AI_BASE||UL_AI_BASE.length<n)UL_AI_BASE=cupAiEntries(Math.max(9,n),'ul');
  const nick=['하운즈','파이터스','스톰','로열스','마린스','레이븐스','타이탄스','팬서스','블레이즈','코메츠'], SP=FrontOfficeCore.UL_AI_SPREAD;
  return UL_AI_BASE.slice(0,n).map((e,i)=>{ const x=ulScale(e,target+(n>=3?SP[i%SP.length]:0)); /* 한 리그 AI끼리 ±2 벌림(사용자 11-17) */ x.name=FrontOfficeCore.cupName(`AI ${nick[i%nick.length]}`); x.ai=1; x.h=FrontOfficeCore.cupEntryHash(x); return x; }); }
/* 리그 만들기: 서버에서 받은 덱(fetched) → 가져온 우승 덱(cup, 최대 2) → 모자라면 단계 기준 AI. 상대는 사본으로 잠근다.
   fetched는 엔트리 그대로 또는 서버 v1 모양 {e, pid, nick}(사용자 11-17: 상대 플레이어 id·닉네임을 리그 팀에 붙여 두고 리그가 끝나면 맞대결로 보낸다) */
function ulMakeLeague(o){ o=o||{}; const C=FrontOfficeCore, U=uld(); if(!U||!U.deck)return {ok:false,msg:'먼저 내 덱을 등록해 주세요.'};
  const now=o.now??Date.now(), cg=C.ulCapGate(U.deck.e,U.tier|0,now); if(!cg.ok)return {ok:false,msg:cg.msg+" '덱'에서 다시 등록해 주세요.",cap:1}; /* 연봉 상한(사용자 11-17): 승격으로 상한이 바뀌었거나 유예가 끝난 예전 덱 */
  const tier=U.tier|0, mine=U.deck.e, seen=new Set([mine.h]), T=[{key:UL_ME,kind:'me',name:mine.name,e:JSON.parse(JSON.stringify(mine))}];
  const add=(e,kind,m)=>{ if(T.length>=C.UL_TEAMS||!e||!Array.isArray(e.P))return; const x=C.ulSlim(e); x.h=C.cupEntryHash(x); if(seen.has(x.h)||!C.cupValidate(x,{}).ok)return; if((kind==='user'||kind==='cup')&&!C.ulCapGate(x,tier,now).ok)return; /* 검수 11-17 #183: 가져온 우승 덱도 같은 상한(286억 우승 덱이 상대로 나오던 것). 빠진 자리는 단계 기준 AI가 채운다 */ /* 상한을 넘는 유저 덱은 상대로 쓰지 않는다(서버도 거른다) */ x.ovr=x.ovr||cupOvr(x); seen.add(x.h); const t={key:'t'+T.length,kind,name:x.name,e:x}; if(m&&m.pid){ t.pid=String(m.pid); t.nick=String(m.nick||''); } T.push(t); };
  for(const d of o.fetched||[]){ if(d&&d.e&&!Array.isArray(d.P))add(d.e,'user',d); else add(d,'user'); } let nc=0; for(const e of o.cup||[]){ if(nc>=2)break; const k=T.length; add(e,'cup'); if(T.length>k)nc++; }
  const need=C.UL_TEAMS-T.length, avg=C.ulAiTarget(tier,o.avg,o.count); for(const e of ulAiDecks(need,avg))add(e,'ai');
  const sched=C.cupLeagueSched(T.length,3); /* 9라운드 × 연전 5개: 라운드마다 모든 덱이 다른 상대와 3연전(팀당 27경기) */
  U.league={v:2,id:(U.lid=(U.lid||0)+1),tier,deck:U.deck.id,at:G.day,y:G.year,teams:T,sched,next:0,series:[],cnt:T.map(()=>0),bat:{},pit:{},edits:[],src:{user:T.filter(t=>t.kind==='user').length,cup:T.filter(t=>t.kind==='cup').length,ai:T.filter(t=>t.kind==='ai').length},avg,
    seed:o.seed!=null?(o.seed>>>0):ulSeed32(),te:T.map(()=>0),news:[],post:null,pbat:{},ppit:{},exp:C.ulExpect(T.map(t=>(t.e.ovr&&t.e.ovr.t)||0))}; /* 3연전 리그(사용자 11-18): 리그 씨앗·실책·소식·포스트시즌·예상 성적 */
  return {ok:true,league:U.league}; }
/* 리그 중 내 덱 고치기: 다음 연전부터 */
function ulEditDeck(e){ const C=FrontOfficeCore, U=uld(), L=U&&U.league; if(!L)return '진행 중인 리그가 없습니다.'; if(e&&e.ro)return '가져온 덱은 쓸 수 없습니다.';
  const x=C.ulSlim(e); { const cur=new Map(L.teams[0].e.P.map(p=>[String(p.id),p])), reg=new Map(((U.deck&&U.deck.e&&U.deck.e.P)||[]).map(p=>[String(p.id),p]));
    for(const p of x.P||[]){ const c=cur.get(String(p.id)), r=reg.get(String(p.id)); if(c&&r&&(p.injOut||0)===(r.injOut||0)&&(c.injOut||0)<(p.injOut||0))p.injOut=c.injOut||0; } } /* 검수 11-17 #186: 등록 덱 그대로인 선수의 부상은 리그에서 지난 날만큼 줄어든 값으로(덱을 고쳐도 부상이 되살아나지 않게) */
  x.h=C.cupEntryHash(x); x.ovr=cupOvr(x); const v=C.cupValidate(x,{}); if(!v.ok)return v.errors[0].msg;
  if(C.cupPay(x).pay!==C.cupPay(L.teams[0].e).pay){ const cg=C.ulCapGate(x,L.tier,Date.now()); if(!cg.ok)return cg.msg; } /* 리그 중 통째로 바꾸면(연봉이 달라지면) 그 단계 상한을 다시 본다(사용자 11-17) */
  L.teams[0].e=x; L.teams[0].name=x.name; L.edits.push({at:L.next,h:x.h}); if(U.deck){ U.deck.e=JSON.parse(JSON.stringify(x)); } return ''; }
/* 연전 하나 */
function ulRunSeries(L){ const s=L.sched[L.next]; if(!s)return null; const A=L.teams[s.a], B=L.teams[s.b];
  const res=ulRng(L,s.id,()=>cupMatch(A.e,B.e,{cup:'ul',round:'L'+s.r,match:s.id,best:3,all:1,tie:1,home:s.home,ri:[L.cnt[s.a],L.cnt[s.b]]})); if(!res.ok)throw new Error('경기 실패: '+((res.errors&&res.errors[0]&&res.errors[0].msg)||'')); /* 씨앗 난수(3연전 리그, 사용자 11-18): 본게임 난수 흐름을 쓰지 않는다 */
  ulStatAdd(L,L.bat,L.pit,res,s.a,s.b); /* 검수 11-17 #182: 우리 선수는 기록할 때의 포지션·나이를 같이 남긴다(02_uladder_series.js) */
  L.cnt[s.a]+=res.games.length; L.cnt[s.b]+=res.games.length;
  ulInjTick(L,s.a,res.games.length); ulInjTick(L,s.b,res.games.length);
  const mine=s.a===0||s.b===0, bx=res.games.map(g=>ulBox(g,mine)); if(Array.isArray(L.te))for(const b of bx){ L.te[s.a]+=b.e[0]; L.te[s.b]+=b.e[1]; } /* 경기마다 박스(우리 경기는 타자·투수 줄까지) · 팀 실책 */
  const x={id:s.id,r:s.r,a:s.a,b:s.b,ha:res.a.h,hb:res.b.h,g:res.games.map(g=>[g.sa,g.sb,g.inn||9,g.walk?1:0]),mvp:res.games.map(g=>g.mvp&&g.mvp.name||''),bx};
  if(mine)ulKeep(L,s,res.games); L.series.push(x); L.next++; if(Array.isArray(L.news)&&(!L.sched[L.next]||L.sched[L.next].r!==s.r))ulNewsRound(L,s.r); return x; }
/* 검수 11-17 #186: 연전을 치른 만큼(경기 수 = 날 수) 리그 덱 사본의 부상 남은 날을 줄인다. 연전마다 덱을 새로 깔아서, 줄이지 않으면 3일 부상이 연전마다 3일로 돌아왔다. 난수 없음 */
function ulInjTick(L,i,n){ const T=L.teams[i]; if(!T||!T.e||!Array.isArray(T.e.P)||!(n>0))return; for(const p of T.e.P)if(p.injOut>0)p.injOut=Math.max(0,p.injOut-n); }
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
  while(ulPostLeft(L))ulRunPost(L); /* 남은 포스트시즌(3연전 리그, 사용자 11-18: '끝까지'·예전 호출)은 여기서 마저 돈다. 승강은 아래 정규 순위로 */
  const P=L.post, myPs=ulPsOf(P,0), st=ulStand(L), me=st.find(x=>x.key===0), mv=C.ulTierAfter(L.tier,me.rank,L.teams.length);
  const no=L.teams.filter(t=>t.kind==='ai').map(t=>t.key), mvp=C.cupMvp(Object.values(L.bat),Object.values(L.pit),no);
  const myMvp=C.cupMvp(Object.values(L.bat).filter(x=>x.key.startsWith(UL_ME+':')),Object.values(L.pit).filter(x=>x.key.startsWith(UL_ME+':')),[]);
  const pts=C.ulPts(L.tier,me.rank,L.teams.length), se=C.ulSeason(Date.now());
  const ms0=C.ulMissions(U.seas&&U.seas.id===se.id?U.seas:null,U.hist,se.id,L.tier).filter(m=>m.done).length; /* 래더 v3: 시즌 목표가 이번 리그로 몇 개 찼는지(결과 화면) */
  if(U.seas&&U.seas.id!==se.id){ (U.seasons=U.seasons||[]).push(U.seas); if(U.seasons.length>26)U.seasons.shift(); }
  U.seas=C.ulSeasonAdd2(U.seas,se.id,se.label,{tier:L.tier,rank:me.rank,to:mv.tier,move:mv.move,w:me.w,l:me.l,t:me.t,rs:me.rs,ra:me.ra,ps:myPs});
  const res={id:L.id,tier:L.tier,to:mv.tier,move:mv.move,rank:me.rank,w:me.w,l:me.l,t:me.t,d:L.deck,name:L.teams[0].name,at:G.day,y:G.year,mvp,myMvp,pts,season:se.id,rec:ulRecords(L),keys:L.keys||[],
    stand:st.map(x=>({rank:x.rank,name:L.teams[x.key].name,kind:L.teams[x.key].kind,w:x.w,l:x.l,t:x.t,pct:x.pct,gb:x.gb,diff:x.diff,ovr:L.teams[x.key].e.ovr})),edits:L.edits.length,src:L.src};
  res.teams=L.teams.map(t=>({name:t.name,kind:t.kind,nick:t.nick||'',ovr:t.e.ovr})); res.ser=L.series.map(x=>[x.r,x.a,x.b,x.g]); res.rs=me.rs; res.ra=me.ra; /* 끝난 리그 일정·결과(사용자 11-17) */
  /* 3연전 리그(사용자 11-18): 포스트시즌(정규 1위와 우승·준우승을 따로) · 시상 · 예상 대비 실제 · 다시 보는 전체 기록 */
  const ex=L.exp||C.ulExpect(L.teams.map(t=>(t.e.ovr&&t.e.ovr.t)||0));
  res.ps=P?{seeds:P.seeds,S:P.S.map(x=>({id:x.id,k:x.k,a:x.a,b:x.b,best:x.best,g:x.g,w:x.w})),champ:P.champ,runner:P.runner,my:myPs,fmvp:P.fmvp||null,champN:L.teams[P.champ].name,runnerN:L.teams[P.runner].name}:null;
  res.psb=C.UL_PS_PTS[myPs]||0; res.awards=ulAwards(L); res.exp={w:ex.w[0],rank:ex.rank[0],luck:Math.round((me.w+me.t/2-ex.w[0])*10)/10}; res.lg=ulLgPack(L);
  const now=Date.now();
  const bg0=C.ulBadges(U.hist,U.car).filter(x=>x.on).map(x=>x.k), hrow={tier:L.tier,rank:me.rank,to:mv.tier,move:mv.move,d:L.deck,name:res.name,at:G.day,y:G.year,s:se.id,w:me.w,l:me.l,t:me.t,rd:me.diff,pts,ts:now}; if(myPs)hrow.ps=myPs; /* 덱 기록: 우승 c · 준우승 r · 4강 s */
  ulAccum(U,L,st,se); U.hist.push(hrow); U.car=C.ulCareerAdd(U.car||C.ulCareerInit(U.hist.slice(0,-1),U.best),hrow); U.car.bg=C.ulBadges(U.hist,U.car).filter(x=>x.on).map(x=>x.k); res.nbg=U.car.bg.filter(k=>!bg0.includes(k)); if(U.hist.length>200)U.hist.splice(0,U.hist.length-200);
  /* 래더 v3(사용자 11-17 "컴프매처럼 좀 재미있게"): 매일·주간 목표 도장, 꾸미기(테두리·칭호)가 새로 생겼는지 결과에 적어 둔다 */
  const c0=C.ulCosmetic(U.gl), tk=C.ulGoalsTick(U.gl,U.hist,now,L.tier); U.gl=tk.gl; const c1=C.ulCosmetic(U.gl);
  res.gl={day:tk.day,week:tk.week,frame:c1.frame>c0.frame?c1.frameName:'',titles:c1.titles.filter((x,i)=>x.on&&!c0.titles[i].on).map(x=>x.n),ms0,ms1:C.ulMissions(U.seas,U.hist,se.id,L.tier).filter(m=>m.done).length};
  U.tier=mv.tier; U.best=Math.max(U.best|0,mv.tier,L.tier); U.last=res; U.league=null; return res; }

/* 래더 v2 누적(사용자 11-17 "디테일한 데이터 뽑아보게해"): 우리 선수 리그 기록(시즌·단계 칸) + 상대 덱별 전적·성향. 한도는 공용 규칙(UL_PS_MAX·UL_OPP_MAX) */
function ulAccum(U,L,st,se){ const C=FrontOfficeCore; U.ps=U.ps||{}; U.opp=U.opp||{}; const pre=UL_ME+':', idOf=k=>String(k).slice(pre.length);
  const B=Object.values(L.bat).filter(x=>String(x.key).startsWith(pre)), Pt=Object.values(L.pit).filter(x=>String(x.key).startsWith(pre));
  const info=new Map(L.teams[0].e.P.map(p=>[String(p.id),{id:p.id,name:p.name,pos:p.pos,isP:p.isP,age:p.age,foreign:p.foreign?1:0}])); for(const x of [...B,...Pt]){ const id=idOf(x.key), q=info.get(id); if(!q){ info.set(id,{id,name:x.name,pos:x.pos||'',isP:x.isP?1:0,age:x.age,foreign:x.fr?1:0}); continue; } if(x.pos&&!q.pos)q.pos=x.pos; if(q.age==null&&x.age!=null)q.age=x.age; } /* 리그 중 덱에서 뺀 선수: 기록할 때 남긴 포지션·나이(검수 11-17 #182) */
  /* 옛 리그가 끝난 채 재독되면 새 경기 집계를 거치지 않는다. 당시 BB/HBP 합계였다는 근거를 마감에도 전달한다. */
  C.ulPsAdd(U.ps,{sid:se.id,tier:L.tier,lid:L.id,P:[...info.values()],bat:B.map(x=>Object.assign({},x,{id:idOf(x.key)})),pit:Pt.map(x=>Object.assign({},x,{id:idOf(x.key)},x.hbp==null?{bbMixed:true}:{}))});
  const rd=new Map(); for(const s of L.series){ if(s.a!==0&&s.b!==0)continue; const oi=s.a===0?s.b:s.a, o=rd.get(oi)||{w:0,l:0,t:0,rs:0,ra:0}; for(const g of s.g){ const a=s.a===0?g[0]:g[1], b=s.a===0?g[1]:g[0]; o.rs+=a; o.ra+=b; if(a>b)o.w++; else if(a<b)o.l++; else o.t++; } rd.set(oi,o); }
  const now=Date.now(), mp=ulProfile(L.teams[0].e);
  L.teams.forEach((t,i)=>{ if(!i)return; const k=t.pid?'p:'+t.pid:t.kind+':'+t.name, r=rd.get(i)||{w:0,l:0,t:0,rs:0,ra:0}, o=U.opp[k]||(U.opp[k]={k,name:t.name,kind:t.kind,n:0,w:0,l:0,t:0,rs:0,ra:0});
    Object.assign(o,{name:t.name,nick:t.nick||o.nick||'',pid:t.pid||null,kind:t.kind,ovr:t.e.ovr,tier:L.tier,at:now,rank:(st.find(x=>x.key===i)||{}).rank,prof:ulProfile(t.e),mine:mp,m:C.ulDeckMeta(t.e)}); o.n++; for(const f of ['w','l','t','rs','ra'])o[f]+=r[f]; });
  const ks=Object.keys(U.opp); if(ks.length>C.UL_OPP_MAX)ks.sort((a,b)=>(U.opp[a].at||0)-(U.opp[b].at||0)).slice(0,ks.length-C.UL_OPP_MAX).forEach(k=>delete U.opp[k]); }
/* 붙어 보기(래더 v3, 사용자 11-17 "명예의 전당 … 우승 덱"): 내 덱과 고른 덱(대회 우승 덱·도전 덱)의 3경기 친선전. 단계·기록·시즌에 남지 않는다(화면에만).
   경기는 리그와 같은 cupMatch(가벼운 세계를 잠깐 바꿔 끼움)라 커리어 G·본게임 난수를 건드리지 않는다 */
function ulExhibit(me,op){ const C=FrontOfficeCore; if(!me||!op||!Array.isArray(me.P)||!Array.isArray(op.P))return {ok:false,msg:'덱이 없습니다.'};
  const a=C.ulSlim(me), b=C.ulSlim(op); a.h=C.cupEntryHash(a); b.h=C.cupEntryHash(b); if(a.h===b.h)return {ok:false,msg:'같은 덱끼리는 붙을 수 없습니다.'};
  const r=cupMatch(a,b,{cup:'ex',round:'EX',match:String(Date.now()%1e7),best:3,all:1,tie:1}); if(!r.ok)return {ok:false,msg:(r.errors&&r.errors[0]&&r.errors[0].msg)||'경기를 돌리지 못했습니다.'};
  return {ok:true,a:a.name,b:b.name,oa:a.ovr||cupOvr(a),ob:b.ovr||cupOvr(b),wa:r.wa,wb:r.wb,t:r.t,keys:r.games.map((g,i)=>({r:i+1,i,opp:b.name,sa:g.sa,sb:g.sb,inn:g.inn||9,walk:g.walk?1:0,tag:`${i+1}차전 ${ulGameTag(g.sa,g.sb,g)}`,mvp:g.mvp?`${g.mvp.name} ${g.mvp.txt}`:'',log:g.log,bat:g.bat,pit:g.pit,line:g.line}))}; }
