/* ===== 단장 대전: 시즌 선수 풀 =====
   시즌 id(예: 'L2026W47')만으로 같은 선수 풀이 나온다(rngForce). 커리어 저장과 무관하다: 순위전 구단은 이 풀에서만 만든다.
   선수는 본게임 선수 생성(newPlayer: 능력치·포지션·투타·성격·투구 폼)을 그대로 쓰고, 얼굴은 선수 id로 정해진다.
   규칙·검증(26명, 연봉 한도, 포지션 최소 인원)은 공용 모듈 src/core/ladder.mjs(FrontOfficeCore.ladderValidate) */
let LADDER_ON=false; /* 숨김 플래그: 서버(2단계)가 붙기 전에는 처음 화면에 버튼을 보이지 않는다 */
const LADDER_POOL_V=1, LADDER_ID0=900000;
const LADDER_POOL_C={}, LADDER_STUB={};
/* 커리어 G를 잠시 내려놓고 대전용 세계에서 fn을 돌린다. 앞뒤로 계산 캐시를 비운다(캐시 열쇠가 선수 id·날짜라 두 세계가 서로의 값을 쓰지 않게). 관전 직전 사본(SPOIL_SNAP)은 지킨다 */
function ladderSwap(G1,fn){ const G0=G, sp=typeof SPOIL_SNAP!=='undefined'?SPOIL_SNAP:null; worldReset(); G=G1; try{ return fn(); } finally{ G=G0; worldReset(); try{ SPOIL_SNAP=sp; }catch(e){} } }
/* 시즌 id: 한국 시간 기준 ISO 주차 */
function ladderSeasonId(ms){ const d=new Date((ms==null?Date.now():ms)+9*3600e3); const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())); const wd=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-wd);
  const y=t.getUTCFullYear(), w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7); return 'L'+y+'W'+String(w).padStart(2,'0'); }
const LADDER_MIX={C:28,'1B':22,'2B':24,'3B':24,SS:26,LF:22,CF:26,RF:22}, LADDER_PIT=186, LADDER_SP=84, LADDER_MGRS=12;
/* 풀 만들기(같은 시즌 id → 같은 결과). 화면이 쓰는 가벼운 세계(LADDER_STUB)에 선수를 넣어 둔다: 능력·연봉 표시 함수가 G를 읽기 때문 */
function ladderPool(season){ season=String(season||ladderSeasonId()); if(LADDER_POOL_C[season])return LADDER_POOL_C[season];
  const pool=ladderSwap(null,()=>rngForce(rngHash('ladder-pool',LADDER_POOL_V,season),()=>{
    G={ver:4,rng:rngNew(rngHash('ladder-stub',season)),year:2026,day:dnum(2026,3,1),user:-1,players:{},teams:[],nextId:LADDER_ID0+1,cfg:{},lg:{},mgr:{},history:[],log:[],mail:[],stops:[],games:[],offers:[],lineup:{}};
    const tier=()=>{ const u=R(); return u<.12?['star',N(61,3.5)]:u<.5?['reg',N(52.5,3.5)]:u<.86?['bench',N(46,3.5)]:['young',N(41,4.5)]; };
    const mk=(isP,pos)=>{ const [k,b]=tier(); const young=k==='young'; const age=young?ri(19,23):clamp(Math.round(N(28.5,3.6)),21,37);
      const base=clamp(b-(age>=34?rnd(0,3):0),28,76), pot=young?base+rnd(4,12):base;
      const p=newPlayer({age,isP,pos,base,pot,svc:clamp(age-20,0,15)});
      const sf=age<=23?.4:age<=26?.65:age<=29?.9:1.05; /* 어린 선수는 싸다(보류권 연봉): 가성비를 찾는 재미 */
      p.sal=round5(clamp(marketSal(ovr(p)+pvShift(p))*sf*rnd(.8,1.25),MIN_SAL,2500)); p.fat=0; p.mor=60; return p; };
    const P=[]; for(let i=0;i<LADDER_PIT;i++)P.push(mk(true));
    for(const [pos,n] of Object.entries(LADDER_MIX))for(let i=0;i<n;i++)P.push(mk(false,pos));
    const sp=new Set(P.filter(p=>p.isP).sort((a,b)=>(b.r.sta-a.r.sta)||(a.id-b.id)).slice(0,LADDER_SP).map(p=>p.id));
    for(const p of P)if(p.isP)p.lrole=sp.has(p.id)?'SP':'RP';
    const M=[]; for(let i=0;i<LADDER_MGRS;i++){ const m=mkMgr(); m.id='LM'+(i+1); try{ mgrFix(m); }catch(e){} m.yrs=1; M.push(m); G.mgr['m'+i]=m; }
    /* 연봉 한도: 능력 상위 260명(10구단 × 26명)의 평균 연봉 × 26명의 80% + 감독 평균 연봉. 스타만 모으면 넘고, 싼 젊은 선수로 메우면 들어간다 */
    const top=[...P].sort((a,b)=>ovr(b)-ovr(a)).slice(0,260), cap=Math.round((avg(top.map(p=>p.sal))*26*.8+avg(M.map(m=>m.sal)))/50)*50;
    const players=P.map(p=>Object.assign(JSON.parse(JSON.stringify(p)),{role:p.isP?p.lrole:null}));
    LADDER_STUB[season]=G;
    return {v:LADDER_POOL_V,season,cap,rules:FrontOfficeCore.LADDER_RULES,players,mgrs:M.map(m=>JSON.parse(JSON.stringify(m)))};
  }));
  LADDER_POOL_C[season]=pool; return pool; }
/* 풀 선수의 표시용 계산(종합 능력·포지션 가치)은 풀 세계에서: 커리어 G가 없거나(처음 화면) 다른 해여도 같은 값 */
function ladderView(season,fn){ ladderPool(season); if(G===LADDER_STUB[season])return fn(G); return ladderSwap(LADDER_STUB[season],()=>fn(G)); }
/* 선수 요약(화면·결과용) */
function ladderBrief(p){ return {id:p.id,name:p.name,age:p.age,pos:p.pos,isP:p.isP,role:p.role||null,sal:p.sal,ovr:Math.round(ovr(p)),th:p.th,bt:p.bt}; }
/* 기본 구단(자동 편성): 한도 안에서 능력 대비 연봉이 좋은 선수부터. 화면의 '자동 편성'과 시험이 쓴다 */
function ladderAuto(season,o){ o=o||{}; const pool=ladderPool(season); const RU=pool.rules;
  return ladderView(season,()=>{ const mgr=o.mgr||pool.mgrs.slice().sort((a,b)=>a.sal-b.sal)[Math.floor(pool.mgrs.length/2)].id; const mg=pool.mgrs.find(m=>m.id===mgr); let left=pool.cap-(mg?mg.sal:0);
    const val=p=>(ovr(p)+(p.isP?0:pvShift(p))-38)/Math.pow(Math.max(p.sal,MIN_SAL),.42)*(1+((o.bias||0)*(p.id%7-3))/30);
    const by=pool.players.slice().sort((a,b)=>val(b)-val(a)||(a.id-b.id)); const sel=[], has=id=>sel.some(p=>p.id===id);
    const need=[['SP',RU.rot+1],['RP',6],['C',2],['SS',1],['2B',1],['3B',1],['CF',1],['1B',1],['LF',1],['RF',1]];
    const take=p=>{ sel.push(p); left-=p.sal; };
    const slotsLeft=()=>RU.roster-sel.length;
    for(const [k,n] of need){ const L=by.filter(p=>!has(p.id)&&(k==='SP'||k==='RP'?p.isP&&p.role===k:!p.isP&&p.pos===k)); for(let i=0;i<n&&L.length;i++){ const share=left/Math.max(1,slotsLeft()); const q=L.find(p=>!has(p.id)&&p.sal<=share*1.8)||L.filter(p=>!has(p.id)).sort((a,b)=>a.sal-b.sal)[0]; if(q)take(q); } }
    while(sel.length<RU.roster){ const nP=sel.filter(p=>p.isP).length; const wantP=nP<12; const L=by.filter(p=>!has(p.id)&&(wantP?p.isP:!p.isP)&&p.sal<=left-(slotsLeft()-1)*MIN_SAL); const q=L[0]||by.filter(p=>!has(p.id)).sort((a,b)=>a.sal-b.sal)[0]; take(q); }
    /* 남은 한도로 같은 종류(포지션·선발/불펜) 선수를 더 좋은 선수로 바꾼다: 능력 1당 연봉이 싼 교체부터 */
    const O=new Map(pool.players.map(p=>[p.id,ovr(p)])), kind=p=>p.isP?'P'+p.role:p.pos;
    for(let it=0;it<120;it++){ let best=null, bg=0; for(let i=0;i<sel.length;i++){ const x=sel[i]; for(const q of by){ if(kind(q)!==kind(x)||has(q.id))continue; const d=q.sal-x.sal; if(d>left)continue; const g=O.get(q.id)-O.get(x.id); if(g<=.5)continue; const sc=g/Math.max(20,d); if(sc>bg){ bg=sc; best=[i,q]; } } }
      if(!best)break; left-=best[1].sal-sel[best[0]].sal; sel[best[0]]=best[1]; }
    return ladderArrange({v:FrontOfficeCore.LADDER_V,season:pool.season,name:o.name||'단장 구단',hue:o.hue??210,mgr,roster:sel.map(p=>p.id)},pool); }); }
/* 명단으로 타순·선발·불펜 기본값을 정한다(감독 판단과 같은 makeLineup) */
function ladderArrange(snap,pool){ return ladderView(pool.season,()=>{ const P=new Map(pool.players.map(p=>[p.id,p])); const ps=snap.roster.map(id=>P.get(id)).filter(Boolean);
  const bats=ps.filter(p=>!p.isP), pits=ps.filter(p=>p.isP);
  const ln=ladderLineup(bats); const order=ladderOrder(ORDER.filter(k=>ln[k]).map(k=>[ln[k],k]));
  const rot=pits.filter(p=>p.role==='SP').sort((a,b)=>spV(b)-spV(a)).slice(0,pool.rules.rot);
  const pen=pits.filter(p=>!rot.includes(p)).sort((a,b)=>penV(b)-penV(a));
  return Object.assign({},snap,{lineup:order.map(([p,k])=>[p.id,k]),rot:rot.map(p=>p.id),cl:pen[0]?pen[0].id:null,su:pen.slice(1,1+pool.rules.setup).map(p=>p.id)}); }); }
/* 풀 선수만으로 수비 배치(makeLineup은 구단 소속·감독을 보므로 단순판): 자리마다 posScore가 가장 큰 선수, 포수 자리는 포수만 */
function ladderLineup(bats){ const ln={}, used=new Set(); const open=['C','SS','CF','2B','3B','RF','LF','1B','DH'];
  for(const pos of open){ let best=null, bs=-1e9; for(const p of bats){ if(used.has(p.id))continue; if(pos==='C'&&p.pos!=='C')continue; const s=posScore(p,pos)-(pos!=='DH'&&p.pos!==pos?(p.pos==='C'?40:6):0); if(s>bs){ bs=s; best=p; } } if(best){ ln[pos]=best; used.add(best.id); } }
  return ln; }
/* 타순: 출루·장타 순(1번 출루, 3·4번 장타) */
function ladderOrder(L){ const sc=p=>offV(p); const s=[...L].sort((a,b)=>sc(b[0])-sc(a[0])||(a[0].id-b[0].id)); const o=[s[3],s[1],s[0],s[2],s[4],s[5],s[6],s[7],s[8]].filter(Boolean); return o; }
