/* 경쟁 모드(같은 시드 챌린지·비동기 단장 대전) 기획용 측정. 게임 코드는 바꾸지 않는다.
 사용(dist/engine.js 필요: bash build.sh, 또는 ENGINE=경로):
   node tools/measure-ladder.cjs season [시드=7] [시즌 수=3]   같은 시드·기본 결정으로 진행, 단계별 상태 해시·저장 크기·시간
   node tools/measure-ladder.cjs series [시드=7] [경기 수=400]  두 구단 맞대결 반복: 경기당 시간·승률
   CHAOS=k node tools/measure-ladder.cjs season 7 1            결정은 같고 10일째에 난수 k개만 더 쓴 세계: 한 번의 다른 클릭이 시즌 결과를 얼마나 흔드는가
   node tools/measure-ladder.cjs probe [시드=7]                 화면이 부르는 조회 함수가 엔진 난수를 쓰는가(쓰면 '보기만 해도 결과가 바뀜')
   node tools/measure-ladder.cjs reload [시드=7] [개막 뒤 일수=20]  저장(JSON)·불러오기를 새 엔진 인스턴스(다른 Math.random)에서 한 뒤 20일 더: 이어서 한 것과 해시가 같은가(브라우저 새로고침)
 RNG=seeded|legacy(기본 seeded): 엔진 난수 방식(00_base). legacy는 예전처럼 Math.random 한 흐름(시드형 엔진 이전과 같음)
 결정성 확인: season을 같은 시드로 두 번 돌려 해시를 비교한다. */
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const ENGINE=process.env.ENGINE||path.join(__dirname,'..','dist','engine.js');
if(!fs.existsSync(ENGINE)){ console.error('엔진 파일이 없습니다: '+ENGINE); process.exit(2); }
const [mode='season', a1, a2]=process.argv.slice(2); const SEED=+a1||7;
let CALLS=0; globalThis.__calls=()=>CALLS;
{ let a=SEED; Math.random=()=>{ CALLS++; a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
globalThis.FO_RNG_MODE=process.env.RNG||'seeded';
const LZ=new Function(fs.readFileSync(path.join(__dirname,'..','vendor','lz-string.min.js'),'utf8')+';return LZString;')();
console.error=()=>{};
const H=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
const out={mode,seed:SEED,node:process.version};
const run=new Function('out','H','LZ','mode','A2','SNAP',fs.readFileSync(ENGINE,'utf8')+`
const t0=Date.now();
DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); let g0=0; while(G.fd&&!G.fd.done&&g0++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true;
for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; try{ if(p&&!foreignCheck(G.user,p))signForeign(G.user,id); }catch(e){} }
out.newGameMs=Date.now()-t0;
const snap=label=>{ const j=JSON.stringify(G); const k=JSON.parse(j); delete k.amBootMs; const j2=JSON.stringify(k);
  const t=Date.now(); const b64=LZ.compressToBase64(j); const lzMs=Date.now()-t;
  (out.stages=out.stages||[]).push({label,year:G.year,day:G.day,hash:H(j2),hashRaw:H(j),jsonKB:Math.round(j.length/1024),lzB64KB:Math.round(b64.length/1024),lzMs,players:Object.keys(G.players).length}); };
const step=()=>{ G.live=null; G.res=null; G.stops=[]; for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(x){ e.done=true; }
  if(G.iv&&!G.iv.done){ let k=0; while(!G.iv.done&&k++<9)ivAnswer(0); } if(G.offers&&G.offers.length)try{ answerOffer(G.offers[0].id,false); }catch(x){} if(G.draft&&!G.draft.done)try{ advanceDraft(false); }catch(x){}
  (G.comp||[]).forEach(c=>{ try{ if(c.stage!=='done')compAuto(c); }catch(x){} }); try{ if(rosterN(G.user)>ROSTER_MAX)trimRoster(G.user,ROSTER_MAX); }catch(x){} advance('day'); };
if(mode==='season'){
  snap('시작');
  const N=+A2||3, Y0=G.year;
  for(let s=1;s<=N;s++){ const t=Date.now(); let n=0, games=0; const sg=simGame; simGame=function(){ games++; return sg.apply(this,arguments); };
    let rec=null, rank=null; const chaos=+(typeof process!=='undefined'&&process.env.CHAOS||0);
    while(G.year<Y0+s&&n++<500){ if(s===1&&n===10)for(let k=0;k<chaos;k++)R(); step();
      if(period()==='season'||period()==='post'){ const r=G.sea&&G.sea.rec&&G.sea.rec[G.user]; if(r&&r.w+r.l>0){ rec={w:r.w,l:r.l,t:r.t||0}; try{ rank=standingsNow().findIndex(x=>x.tid===G.user)+1; }catch(e){} } } }
    simGame=sg; const h=(G.history||[]).filter(x=>x.y===Y0+s-1).pop();
    (out.seasons=out.seasons||[]).push({s,ms:Date.now()-t,days:n,games,chaos,user:rec,rank,champ:h?h.champ:null,cash:Math.round(team(G.user).cash||0)}); snap(s+'년 뒤'); }
  /* 저장·불러오기 왕복이 결과를 바꾸는가: 같은 프로세스에서 G를 JSON 왕복한 뒤 30일 더 진행 */
}
if(mode==='series'){
  while(period()!=='season')step(); for(let i=0;i<10;i++)step(); /* 개막 10일 뒤의 실제 로스터 */
  const T=G.teams.map(t=>({tid:t.id,r:+teamRating(t.id).toFixed(2)})).sort((a,b)=>b.r-a.r); out.ratings=T;
  const base=JSON.stringify(G); const NG=+A2||400;
  const duel=(A,B)=>{ G=JSON.parse(base); let day=G.day, w=0, l=0, t=0, ms=0; for(let i=0;i<NG;i++){ const home=i%2?A:B, away=i%2?B:A; const c=Date.now(); let g; try{ g=simGame(day,home,away,false); applyGame(day,home,away,g,false); }catch(e){ continue; } ms+=Date.now()-c;
      const aS=home===A?g.score.h:g.score.a, bS=home===A?g.score.a:g.score.h; if(aS>bS)w++; else if(aS<bS)l++; else t++;
      day++; for(const q of [...playersOf(A),...playersOf(B)]){ q.fat=Math.max(0,(q.fat||0)*.6); } if(i%30===29)G=JSON.parse(base); }
    return {A,B,rA:T.find(x=>x.tid===A).r,rB:T.find(x=>x.tid===B).r,w,l,t,msPerGame:+(ms/NG).toFixed(1)}; };
  const top=T[0].tid, sec=T[1].tid, mid=T[Math.floor(T.length/2)].tid, bot=T[T.length-1].tid;
  out.duels=[duel(top,bot),duel(top,mid),duel(top,sec)];
  { const tid=G.user, P=playersOf(tid), slim=P.map(p=>{ const q=Object.assign({},p); for(const k of ['hist','spr','vs','spl','ld','feats','news','log','mail'])delete q[k]; return q; });
    const pack=o=>Math.round(LZ.compressToBase64(JSON.stringify(o)).length/1024);
    out.snapshot={players:P.length,fullKB:Math.round(JSON.stringify(P).length/1024),fullLzKB:pack(P),slimKB:Math.round(JSON.stringify(slim).length/1024),slimLzKB:pack(slim),mgrKB:Math.round(JSON.stringify(G.mgr[tid]||{}).length/1024),coachKB:Math.round(JSON.stringify((G.coach||{})[tid]||{}).length/1024)}; }
}
if(mode==='probe'){
  while(period()!=='season')step(); for(let i=0;i<10;i++)step();
  const me=G.user, op=G.teams.find(t=>t.id!==me).id, mine=playersOf(me), theirs=playersOf(op);
  const F={teamRating:()=>teamRating(me),depth:()=>depth(me),makeLineup:()=>makeLineup(me),standingsNow:()=>standingsNow(),
    faAsk:()=>mine.slice(0,20).forEach(p=>faAsk(p)),faDemand:()=>mine.slice(0,20).forEach(p=>faDemand(p)),scoutReport:()=>theirs.slice(0,20).forEach(p=>scoutReport(p)),
    evalTrade:()=>evalTrade(op,[mine[3].id],[theirs[3].id],0)};
  out.probe={}; for(const k in F){ const c0=__calls(), s0=G.rng?G.rng.s:null, j0=JSON.stringify(G).length; let e=''; try{ F[k](); }catch(x){ e=String(x.message).slice(0,60); } out.probe[k]={rngCalls:__calls()-c0,engineRngMoved:G.rng?G.rng.s!==s0:null,stateChanged:JSON.stringify(G).length!==j0,err:e}; }
  out.rngMode=typeof rngMode==='function'?rngMode():'(없음)';
}
const strip=()=>{ const k=JSON.parse(JSON.stringify(G)); delete k.amBootMs; return H(JSON.stringify(k)); };
if(mode==='reload'){ while(period()!=='season')step(); for(let i=0;i<(+A2||20);i++)step();
  G=JSON.parse(JSON.stringify(G)); try{ migrateDraft(); }catch(e){} const j=JSON.stringify(G); out.reload={year:G.year,day:G.day,rngMode:typeof rngMode==='function'?rngMode():'(없음)',saveKB:Math.round(j.length/1024)};
  for(let i=0;i<20;i++)step(); out.reload.continued=strip(); out.__snap=j; }
if(mode==='reload2'){ G=JSON.parse(SNAP); try{ migrateDraft(); }catch(e){} for(let i=0;i<20;i++)step(); out.reload.reloaded=strip(); }
`);
run(out,H,LZ,mode,a2);
if(mode==='reload'){ const snap=out.__snap; delete out.__snap; { let a=SEED*7919+13; Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  run(out,H,LZ,'reload2',a2,snap); out.reload.same=out.reload.continued===out.reload.reloaded; }
console.log(JSON.stringify(out,null,1));
