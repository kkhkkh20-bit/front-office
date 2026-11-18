/* ===== 래더 3연전 리그(사용자 11-18 "맞대결 3연전", docs/design/ladder-series-2026-11-18.md) =====
   정규: 9라운드, 라운드마다 10팀이 모두 다른 상대와 3연전(팀당 27경기). 화면은 라운드 하나씩('다음 3연전') 또는 '끝까지'로 보여 준다.
   경기는 리그 씨앗(L.seed, 리그를 만들 때 crypto로 한 번)과 연전 id로 정한 따로 난수(withRng)로 돈다: 같은 씨앗·같은 덱이면 같은 결과이고,
   본게임 난수 흐름(Math.random)은 한 번도 쓰지 않는다. 연전 사이에 덱을 고칠 수 있어서 미리 다 돌려 두지 않고, 라운드를 열 때 돌린다(결과는 씨앗으로 정해져 있다).
   정규가 끝나면 상위 4팀 포스트시즌: 준결승 1-4위·2-3위 3전 2선승 → 결승 5전 3선승(시리즈 하나씩 공개). 승강은 정규 순위 그대로, 다만 우승팀은 순위와 무관하게 승격(래더 v4).
   기록: 경기마다 작은 박스(줄 점수·R/H/E·승패세·홈런, 우리 경기와 포스트시즌은 타자·투수 줄까지) · 팀 실책 · 라운드 소식 · 끝난 뒤 시상.
   예전 리그(씨앗 없음, v1)는 처음 열 때 빈 칸만 더해(난수 없음, 여러 번 해도 같음) 예전처럼 평범한 난수로 이어 간다 */
function ulSeed32(){ try{ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]>>>0; }catch(e){ return ((Date.now()>>>0)^0x9e3779b9)>>>0; } } /* 씨앗은 본게임 난수가 아니라 기기 난수(crypto)에서 */
function ulRng(L,k,f){ return L&&L.seed!=null?withRng(rngHash('ul',L.seed,k),f):f(); }
const ulOvrOf=t=>(t&&(t.ovr||(t.e&&t.e.ovr)))||{t:0,p:0,b:0};
/* 예전 리그 옮기기(난수 없음, 여러 번 해도 같음): 실책 칸(옮긴 뒤부터 셈, teP = 그때까지 연전 수) · 소식 · 포스트시즌 자리 · 예상 성적 */
function ulLgMig(L){ if(!L||!Array.isArray(L.teams))return L; if(!Array.isArray(L.te)){ L.te=L.teams.map(()=>0); if(L.next>0)L.teP=L.next; } if(!Array.isArray(L.news))L.news=[];
  if(L.post===undefined)L.post=null; if(!L.exp)L.exp=FrontOfficeCore.ulExpect(L.teams.map(t=>ulOvrOf(t).t||0)); return L; }
/* 줄 점수 글(cupGameOut line: 머리·원정·홈) → A(연전 a팀)·B 줄 {inn:[점수|-1], r, h, e} */
function ulLineOf(g){ const R=String(g.line||'').split('\n'), row=x=>{ const c=String(x||'').split('\t'), n=c.length; return {inn:c.slice(1,Math.max(1,n-3)).map(v=>v===''||v==='-'?-1:+v||0),r:+c[n-3]||0,h:+c[n-2]||0,e:+c[n-1]||0}; };
  const aw=row(R[1]), hm=row(R[2]); return g.home==='A'?{A:hm,B:aw}:{A:aw,B:hm}; }
const ulPid=k=>{ const s=String(k).split(':')[1]; return /^\d+$/.test(s)?+s:s; };
/* 경기 박스(작게): h(홈 = 0 a팀 · 1 b팀) · l 줄 점수 · r 점수 · hh 안타 · e 실책 · d 승·패·세 [쪽, 선수] · hr [쪽, 선수, 개수] · mv 경기 MVP.
   full이면 b(타자: [선수, 타수, 안타, 2루타, 3루타, 홈런, 타점, 득점, 볼넷+사구, 삼진, 도루])·p(투수: [선수, 아웃, 피안타, 자책, 볼넷+사구, 삼진, 피홈런, 결정 1승 2패 3세])까지 */
function ulBox(g,full){ const LN=ulLineOf(g), S=g.stats||{bat:[],pit:[]}, side=k=>k==='A'?0:1;
  const x={h:g.home==='A'?0:1,l:[LN.A.inn,LN.B.inn],r:[g.sa,g.sb],hh:[LN.A.h,LN.B.h],e:[LN.A.e,LN.B.e],d:[null,null,null],hr:[],mv:g.mvp?`${g.mvp.name} ${g.mvp.txt}`:''};
  for(const p of S.pit){ const i=p.w?0:p.l?1:p.sv?2:-1; if(i>=0)x.d[i]=[side(p.k),ulPid(p.key)]; }
  for(const b of S.bat)if(b.hr)x.hr.push([side(b.k),ulPid(b.key),b.hr]);
  if(full){ x.b=[[],[]]; x.p=[[],[]];
    for(const b of S.bat)x.b[side(b.k)].push([ulPid(b.key),b.ab|0,b.h|0,b.d|0,b.tr|0,b.hr|0,b.rbi|0,b.r|0,(b.bb|0)+(b.hbp|0),b.so|0,b.sb|0]);
    for(const p of S.pit)x.p[side(p.k)].push([ulPid(p.key),p.outs|0,p.h|0,p.er|0,(p.bb|0)+(p.hbp|0),p.so|0,p.hr|0,p.w?1:p.l?2:p.sv?3:0]); }
  return x; }
/* 경기 기록 더하기(정규 L.bat·L.pit, 포스트시즌 L.pbat·L.ppit): 팀 키:선수 id 줄. 처음 만들 때 포지션·나이를 그 팀 덱에서 적는다(개인 순위·신인상·팀 표) */
function ulStatAdd(L,BM,PM,res,a,b){ const key={A:L.teams[a].key,B:L.teams[b].key}, mi={A:a,B:b}, PP={A:new Map(L.teams[a].e.P.map(p=>[String(p.id),p])),B:new Map(L.teams[b].e.P.map(p=>[String(p.id),p]))};
  const snap=(t,kk,id)=>{ const p=PP[kk].get(String(id)); if(!p)return; if(mi[kk]===0||!t.pos){ t.pos=p.pos||''; if(p.age!=null)t.age=p.age; if(p.isP)t.isP=1; if(p.foreign)t.fr=1; } }; /* 우리 선수는 기록할 때의 포지션·나이(검수 11-17 #182), 상대는 처음 값 */
  for(const g of res.games){ for(const x of g.stats.bat){ const id=String(x.key).split(':')[1], k=key[x.k]+':'+id, t=BM[k]||(BM[k]={key:k,team:L.teams[mi[x.k]].name,name:x.name,g:0}); t.g++; snap(t,x.k,id); for(const f of ['pa','ab','h','d','tr','hr','bb','hbp','sf','rbi','r','sb','so'])t[f]=(t[f]||0)+(x[f]||0); }
    for(const p of g.stats.pit){ const id=String(p.key).split(':')[1], k=key[p.k]+':'+id, t=PM[k]||(PM[k]={key:k,team:L.teams[mi[p.k]].name,name:p.name,g:0}); if(t.g&&t.hbp==null||p.hbp==null||p.bbMixed)t.bbMixed=true; t.g++; snap(t,p.k,id); for(const f of ['outs','h','bb','hbp','so','r','er','hr','w','l','sv','gs'])t[f]=(t[f]||0)+(p[f]||0); } } }
/* 팀마다 경기 결과 줄(1 승 · −1 패 · 0 무, 정규만, 오래된 것부터) */
function ulTeamRes(D){ const R=D.teams.map(()=>[]); for(const s of D.series||[])for(const g of s.g){ R[s.a].push(Math.sign(g[0]-g[1])); R[s.b].push(Math.sign(g[1]-g[0])); } return R; }
/* 순위표(실제 리그 화면처럼): 공용 순위 + 최근 5경기·연속·득실·피타고리안 기대 승률·예상(OVR) 승수 */
function ulStandX(D){ const C=FrontOfficeCore, flat=[]; for(const s of D.series||[])for(const g of s.g)flat.push({a:s.a,b:s.b,sa:g[0],sb:g[1]});
  const st=C.cupStandings(D.teams.map((t,i)=>i),flat), RS=ulTeamRes(D), ex=D.exp||C.ulExpect(D.teams.map(t=>ulOvrOf(t).t||0)), done=(D.series||[]).length, all=(D.sched&&D.sched.length)||45;
  return st.map(x=>{ const f=C.ulForm(RS[x.key]), g=x.w+x.l+x.t; return Object.assign(x,{l5:f.l5,strk:f.strk,run:f.run,py:C.ulPyth(x.rs,x.ra),pyw:Math.round(C.ulPyth(x.rs,x.ra)*g*10)/10,exw:Math.round(ex.w[x.key]*done/all*10)/10,exr:ex.rank[x.key]}); }); }
/* 팀 기록(타격·투구·수비) + 리그 평균. 정규 L.bat·L.pit 합, 실책은 박스(L.te) */
function ulTeamStats(D){ const C=FrontOfficeCore, B=Object.values(D.bat||{}), P=Object.values(D.pit||{});
  const T=D.teams.map((t,i)=>{ const pre=t.key+':', b={}, p={}; for(const x of B)if(String(x.key).startsWith(pre))for(const f of C.UL_BF)b[f]=(b[f]||0)+(x[f]||0); for(const x of P)if(String(x.key).startsWith(pre)){ for(const f of C.UL_PF)p[f]=(p[f]||0)+(x[f]||0); if(x.bbMixed)p.bbMixed=true; }
    const br=C.ulBatRates(b), pr=C.ulPitRates(p), ip=(p.outs||0)/3; return {i,key:t.key,name:t.name,kind:t.kind,avg:br.avg,obp:br.obp,slg:br.slg,ops:br.ops,hr:b.hr||0,sb:b.sb||0,r:b.r||0,h:b.h||0,pa:b.pa||0,
      era:pr.era,whip:ip?Math.round(((p.h||0)+(p.bb||0)+(p.hbp||0))/ip*100)/100:null,so:p.so||0,bb:(p.bb||0)+(p.hbp||0),hra:p.hr||0,e:(D.te||[])[i]||0,outs:p.outs||0}; });
  const avgOf=k=>{ const v=T.map(x=>x[k]).filter(x=>x!=null); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; }, lg={}; for(const k of ['avg','obp','slg','ops','hr','sb','era','whip','so','bb','e'])lg[k]=avgOf(k);
  const lower=new Set(['era','whip','bb','e']), rank={}; for(const k of Object.keys(lg)){ const v=T.map(x=>x[k]); rank[k]=T.map(x=>x[k]==null?null:1+v.filter(y=>y!=null&&(lower.has(k)?y<x[k]:y>x[k])).length); }
  return {T,lg,rank,partialE:!!D.teP}; }
/* 개인 순위(규정: 경기 × 3.1 타석, 경기 × 1 이닝). top n */
function ulLeaders(D,n){ const C=FrontOfficeCore, gp=Math.max(1,...D.teams.map((t,i)=>(D.series||[]).reduce((a,s)=>a+(s.a===i||s.b===i?s.g.length:0),0))), qpa=C.ulQualPa(gp), qo=C.ulQualOuts(gp); n=n||5;
  const B=Object.values(D.bat||{}).map(x=>Object.assign({},x,C.ulBatRates(x))), P=Object.values(D.pit||{}).map(x=>Object.assign({},x,C.ulPitRates(x)));
  const top=(L,f,q,asc)=>L.filter(x=>(!q||q(x))&&f(x)!=null&&(asc||f(x)>0)).sort((a,b)=>(asc?f(a)-f(b):f(b)-f(a))||String(a.key).localeCompare(String(b.key))).slice(0,n);
  const qb=x=>(x.pa||0)>=qpa, qp=x=>(x.outs||0)>=qo;
  return {gp,qpa,qo,cats:[['타율',top(B,x=>x.avg,qb),x=>ulR3(x.avg)],['홈런',top(B,x=>x.hr||0),x=>x.hr],['타점',top(B,x=>x.rbi||0),x=>x.rbi],['OPS',top(B,x=>x.ops,qb),x=>ulR3(x.ops)],['도루',top(B,x=>x.sb||0),x=>x.sb],
    ['평균자책점',top(P,x=>x.era,qp,true),x=>x.era.toFixed(2)],['승리',top(P,x=>x.w||0),x=>x.w],['세이브',top(P,x=>x.sv||0),x=>x.sv],['탈삼진',top(P,x=>x.so||0),x=>x.so],['WHIP',top(P,x=>x.whip,x=>qp(x)&&x.whip!=null,true),x=>x.whip.toFixed(2)]]}; }
const ulR3=x=>x==null?'-':(+x).toFixed(3).replace(/^0/,'');
/* 라운드 소식(라운드마다 1~3줄, 난수 없음): 1위 바뀜·지킴, 연승·연패, 싹쓸이, 우리 순위 변동, 팀 ERA·홈런 선두 */
function ulNewsRound(L,r){ const st=ulStandX(L), nm=k=>L.teams[k].name, out=[], top=st[0], me=st.find(x=>x.key===0);
  const lead=L.lead; if(lead==null||lead===top.key)out.push(r===1?`${nm(top.key)}, 첫 3연전을 마치고 1위입니다.`:`${nm(top.key)}, ${r}라운드에도 1위를 지켰습니다(2위와 ${Math.max(0,st[1].gb||0).toFixed(1)}경기 차).`); else out.push(`${nm(top.key)}, ${nm(lead)}을(를) 끌어내리고 1위에 올랐습니다(${top.w}승 ${top.l}패).`);
  const rs=L.series.filter(s=>s.r===r), sw=rs.filter(s=>s.g.every(g=>g[0]>g[1])||s.g.every(g=>g[1]>g[0])).sort((a,b)=>((b.a===0||b.b===0)-(a.a===0||a.b===0)))[0];
  if(sw){ const aw=sw.g.every(g=>g[0]>g[1]); out.push(`${nm(aw?sw.a:sw.b)}, ${nm(aw?sw.b:sw.a)}에 3연전 싹쓸이.`); }
  const hot=st.slice().sort((a,b)=>b.run-a.run)[0], cold=st.slice().sort((a,b)=>a.run-b.run)[0];
  if(hot&&hot.run>=4)out.push(`${nm(hot.key)} ${hot.run}연승 중입니다.`); else if(cold&&cold.run<=-5)out.push(`${nm(cold.key)} ${-cold.run}연패에 빠졌습니다.`);
  const pr=L.rk0&&L.rk0[0]; if(pr&&Math.abs(pr-me.rank)>=2)out.push(`우리 덱 ${pr}위 → ${me.rank}위${me.rank<pr?'로 뛰어올랐습니다':'로 내려앉았습니다'}.`);
  if(out.length<3&&r%3===0){ const TS=ulTeamStats(L), b=TS.T.filter(x=>x.era!=null).sort((a,b)=>a.era-b.era)[0]; if(b)out.push(`팀 평균자책점 1위 ${b.name}(${b.era.toFixed(2)}).`); }
  else if(out.length<3&&(r===4||r===7)){ const h=Object.values(L.bat).sort((a,b)=>(b.hr||0)-(a.hr||0)||String(a.key).localeCompare(String(b.key)))[0]; if(h&&h.hr)out.push(`홈런 선두 ${h.name}(${h.team}) ${h.hr}개.`); }
  L.lead=top.key; L.rk0={}; for(const x of st)L.rk0[x.key]=x.rank; L.news.push({r,t:out.slice(0,3)}); }
/* ---- 포스트시즌 ---- */
function ulPostInit(L){ if(L.post||L.next<L.sched.length)return L.post||null; const C=FrontOfficeCore, seeds=ulStand(L).slice(0,C.UL_PS_SEEDS).map(x=>x.key), B=C.ulPsBracket(seeds); if(!B)return null;
  L.post={seeds,S:B.map(x=>Object.assign(x,{g:[],bx:[],w:null})),next:0,champ:null,runner:null}; if(!L.pbat){ L.pbat={}; L.ppit={}; } return L.post; }
function ulPostLeft(L){ const P=L&&ulPostInit(L); return !!P&&P.next<P.S.length; }
function ulRunPost(L){ const C=FrontOfficeCore, P=ulPostInit(L); if(!P||P.next>=P.S.length)return null; const s=P.S[P.next];
  if(s.k==='f'&&s.a==null){ const [a,b]=C.ulPsFinal(P.seeds,P.S[0].w,P.S[1].w); s.a=a; s.b=b; }
  const A=L.teams[s.a], B=L.teams[s.b], res=ulRng(L,'P'+s.id,()=>cupMatch(A.e,B.e,{cup:'ul',round:'PS',match:s.id,best:s.best,ri:[L.cnt[s.a],L.cnt[s.b]]}));
  if(!res.ok)throw new Error('경기 실패: '+((res.errors&&res.errors[0]&&res.errors[0].msg)||''));
  ulStatAdd(L,L.pbat||(L.pbat={}),L.ppit||(L.ppit={}),res,s.a,s.b);
  s.g=res.games.map(g=>[g.sa,g.sb,g.inn||9,g.walk?1:0]); s.bx=res.games.map(g=>ulBox(g,true)); const wa=C.ulPsWin(s.g,s.best)||(res.win==='B'?'b':'a'); s.w=wa==='a'?s.a:s.b;
  L.cnt[s.a]+=res.games.length; L.cnt[s.b]+=res.games.length; ulInjTick(L,s.a,res.games.length); ulInjTick(L,s.b,res.games.length);
  const wn=s.g.filter(g=>wa==='a'?g[0]>g[1]:g[1]>g[0]).length, ln=s.g.length-wn, nm=k=>L.teams[k].name;
  if(s.k==='f'){ P.champ=s.w; P.runner=s.w===s.a?s.b:s.a; const wk=wa==='a'?'A':'B', bat=[], pit=[]; for(const g of res.games){ bat.push(...g.stats.bat.filter(x=>x.k===wk)); pit.push(...g.stats.pit.filter(x=>x.k===wk)); }
    const agg=(L0,F)=>{ const m=new Map(); for(const x of L0){ const o=m.get(x.key)||Object.assign({},x,Object.fromEntries(F.map(f=>[f,0]))); for(const f of F)o[f]+=x[f]||0; o.team=nm(s.w); m.set(x.key,o); } return [...m.values()]; };
    const mv=C.cupMvp(agg(bat,['pa','ab','h','d','tr','hr','bb','hbp','sf','rbi','r','sb','so']),agg(pit,['outs','h','bb','hbp','so','r','er','hr','w','l','sv']),[]); P.fmvp=mv?{name:mv.name,team:mv.team,txt:mv.txt}:null;
    L.news.push({r:'F',t:[`${nm(s.w)}, 결승에서 ${nm(P.runner)}을(를) ${wn}승 ${ln}패로 꺾고 우승했습니다!`,...(P.fmvp?[`결승 MVP ${P.fmvp.name}: ${P.fmvp.txt}`]:[])]}); }
  else L.news.push({r:s.id,t:[`준결승 ${nm(s.w)}, ${nm(s.w===s.a?s.b:s.a)}을(를) ${wn}승 ${ln}패로 누르고 결승에 올랐습니다.`]});
  P.next++; return s; }
/* 다음 단위 하나(화면 '다음 3연전'): 정규 라운드 → 포스트시즌 시리즈 하나. 반환 {kind:'r'|'ps', list} 또는 null(다 끝남) */
function ulStep(L){ L=L||(uld()||{}).league; if(!L)return null; if(L.next<L.sched.length)return {kind:'r',list:ulRunRound(L)}; if(ulPostLeft(L))return {kind:'ps',list:[ulRunPost(L)]}; return null; }
/* 포스트시즌 자리: c 우승 · r 준우승 · s 4강 · '' */
function ulPsOf(P,k){ return !P?'':P.champ===k?'c':P.runner===k?'r':P.seeds.includes(k)?'s':''; }
/* 리그 시상(끝난 뒤): MVP(공용 cupMvp, AI 제외)·최고 투수·홈런왕·최고 신인(만 24세 이하 가운데 cupMvp 점수) */
function ulAwards(L){ const C=FrontOfficeCore, B=Object.values(L.bat), P=Object.values(L.pit), tm=x=>x.team;
  const hrk=B.filter(x=>x.hr>0).sort((a,b)=>b.hr-a.hr||(b.rbi||0)-(a.rbi||0)||String(a.key).localeCompare(String(b.key)))[0];
  const pv=p=>p.outs/3*1.2+p.so*.4-p.er*2-(p.h+p.bb)*.4+(p.w||0)*2+(p.sv||0)*1.5, bp=P.slice().sort((a,b)=>pv(b)-pv(a)||String(a.key).localeCompare(String(b.key)))[0];
  const yg=x=>x.age!=null&&x.age<=24, yv=C.cupMvp(B.filter(yg),P.filter(yg),[]);
  const ip=o=>`${Math.floor(o/3)}${o%3?'.'+o%3:''}`, era=p=>(p.outs?p.er*27/p.outs:0).toFixed(2);
  return {hr:hrk?{key:hrk.key,name:hrk.name,team:tm(hrk),txt:`${hrk.hr}홈런 ${hrk.rbi||0}타점 · 타율 ${ulR3(hrk.ab?hrk.h/hrk.ab:0)}`}:null,
    pit:bp?{key:bp.key,name:bp.name,team:tm(bp),txt:`${ip(bp.outs)}이닝 평균자책점 ${era(bp)} · ${bp.so}탈삼진${bp.w?` · ${bp.w}승`:''}${bp.sv?` · ${bp.sv}세이브`:''}`}:null,
    young:yv?{key:yv.key,name:yv.name,team:yv.team,txt:yv.txt,age:(B.concat(P).find(x=>x.key===yv.key)||{}).age}:null}; }
/* 끝난 리그를 다시 보는 자료(G.uld.last.lg): 팀(이름·종류·닉네임·OVR) · 연전(박스 포함) · 선수 기록 · 포스트시즌 · 소식 · 예상 */
function ulLgPack(L){ const slim=M=>{ const o={}; for(const k in M){ const x=Object.assign({},M[k]); delete x.team; o[k]=x; } return o; }, bat=slim(L.bat), pit=slim(L.pit), pn={}; /* 팀 이름은 키 앞부분으로 찾는다(줄마다 두지 않음) */
  for(const M of [L.pbat||{},L.ppit||{}])for(const k in M)if(!bat[k]&&!pit[k])pn[k]=M[k].name; /* 포스트시즌에만 나온 선수 이름(박스용) */
  return {v:2,teams:L.teams.map(t=>({key:t.key,kind:t.kind,name:t.name,nick:t.nick||'',ovr:t.e.ovr})),series:L.series.map(s=>({id:s.id,r:s.r,a:s.a,b:s.b,g:s.g,bx:s.bx})),bat,pit,pn,te:L.te,teP:L.teP||0,post:L.post,news:L.news,exp:L.exp,seed:L.seed??null}; }
/* 서버 기록실에 올릴 요약(worker/v1/records.js recParse 형식, 1~2KB): 우리 팀 + 타석 많은 타자 12명 · 아웃 많은 투수 10명 */
function ulRecUp(L,res){ const me=x=>String(x.key).startsWith(UL_ME+':'), B0=Object.values(L.bat).filter(me), tb=x=>(x.h||0)+(x.d||0)+2*(x.tr||0)+3*(x.hr||0);
  const B=B0.slice().sort((a,b)=>(b.pa||0)-(a.pa||0)).slice(0,12), P=Object.values(L.pit).filter(me).sort((a,b)=>(b.outs||0)-(a.outs||0)).slice(0,10);
  return {team:{n:L.teams[0].name,rs:res.rs|0,ra:res.ra|0,hr:B0.reduce((a,x)=>a+(x.hr||0),0)},b:B.filter(x=>x.g>0).map(x=>[x.name,x.g,x.pa||0,x.ab||0,x.h||0,tb(x),x.hr||0,x.rbi||0,x.sb||0,(x.bb||0)+(x.hbp||0),x.sf||0]),
    p:P.filter(x=>x.g>0).map(x=>[x.name,x.g,x.outs||0,x.er||0,x.so||0,x.sv||0,x.w||0,(x.h||0)+(x.bb||0)+(x.hbp||0)])}; }
