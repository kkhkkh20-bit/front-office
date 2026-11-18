/* ===== 단장 대전: 시리즈 실행 =====
   두 구단 스냅샷(풀 선수 id + 타순·선발·불펜·감독)과 시즌 풀, 시리즈 시드로 N경기를 치른다. 같은 입력 → 같은 결과.
   기준 세계: 시즌 id에서 정해지는 가벼운 세계(지난 시즌 경기를 치르지 않음). 구단은 0번부터 자리에 들어가고, 모든 자리의 구장 규격·인기를 같게 맞춘다(홈·원정 번갈아).
   경기 엔진은 본게임 simGame 그대로(options.sides로 명단을 넘김). 시리즈 안에서만 피로·부상이 쌓이고, 끝나면 세계를 버린다 */
const LADDER_B_OFF=50000; /* 두 구단이 같은 풀 선수를 골라도 겹치지 않게 B 구단 선수 id에 더한다 */
let LADDER_WORLD=null;
function ladderWorldJson(pool){ const key=pool.season+':'+LADDER_POOL_V; if(LADDER_WORLD&&LADDER_WORLD.key===key)return LADDER_WORLD.json;
  let json;
  ladderSwap(null,()=>{ buildWorld({lite:true});
    G.user=G.teams.length-1; G.year=2026; G.cal=G.cal||buildCalendar(2026); G.day=G.cal.open+10; G.entryY=null; G.coach=null; G.stops=[]; G.mail=[]; G.log=[];
    for(const p of Object.values(G.players))if(p.team!=null)delete G.players[p.id]; for(const t of G.teams)G.mgr[t.id]=null; /* 원래 선수는 모두 뺀다: 리그 팩은 구단 자리 10개를 쓴다 */
    try{ const t0=team(0); stadOf(0); t0.stad.dim=JSON.parse(JSON.stringify(stadDim(0))); for(const t of G.teams){ if(t.id===0)continue; t.stad=JSON.parse(JSON.stringify(t0.stad)); for(const k of ['pop','fac','trust','rel','market'])t[k]=t0[k]; } }catch(e){} /* 모든 자리 구장 규격·인기를 같게: 홈 구장 운이 없게 */
    json=JSON.stringify(G); });
  LADDER_WORLD={key,json}; return json; }
/* 구단 하나를 세계의 tid 자리에 넣고, 경기용 명단 묶음을 돌려준다 */
function ladderInstall(tid,snap,pool){ const off=tid*LADDER_B_OFF; /* 자리마다 id를 띄워 같은 풀 선수를 여러 구단이 골라도 겹치지 않게 */ const P=new Map(pool.players.map(p=>[p.id,p]));
  const get=id=>G.players[id+off];
  for(const id of snap.roster){ const q=JSON.parse(JSON.stringify(P.get(id))); q.id=id+off; q.team=tid; q.fat=0; q.injOut=0; q.mor=60; delete q.lastApp; delete q.lastStart; delete q.prevApp; G.players[q.id]=q; }
  const m=pool.mgrs.find(x=>x.id===snap.mgr); G.mgr[tid]=Object.assign(JSON.parse(JSON.stringify(m)),{interim:false});
  const T=team(tid); T.city=''; T.nick=snap.name; T.lname=snap.name;
  const lineup=snap.lineup.map(([id,pos])=>[get(id),pos]);
  const inLn=new Set(snap.lineup.map(x=>x[0]));
  const bench=snap.roster.filter(id=>!inLn.has(id)&&!P.get(id).isP).map(get);
  const rot=snap.rot.map(get);
  const roles=[snap.cl,...snap.su].filter(x=>x!=null);
  const rest=snap.roster.filter(id=>P.get(id).isP&&!snap.rot.includes(id)&&!roles.includes(id)).map(get).sort((a,b)=>penV(b)-penV(a)||(a.id-b.id));
  return {tid,snap,lineup,bench,rot,pen:[...roles.map(get),...rest],ri:0}; }
/* 한 경기 명단(06_game gameSide와 같은 모양). 다친 선수는 그 자리에 가장 맞는 벤치 선수로, 선발은 순번대로(지친 선발은 건너뜀) */
function ladderSide(C,day){ const ok=p=>p&&!(p.injOut>0);
  const ln={}, order=[], used=new Set(), bench=C.bench.filter(ok);
  for(const [p,pos] of C.lineup){ let q=ok(p)?p:null;
    if(!q){ const L=bench.filter(b=>!used.has(b.id)&&(pos!=='C'||b.pos==='C')); q=L.sort((a,b)=>posScore(b,pos)-posScore(a,pos)||(a.id-b.id))[0]||bench.filter(b=>!used.has(b.id))[0]||null; }
    if(!q)throw new Error('건강한 야수 9명 미만'); ln[pos]=q; used.add(q.id); order.push(q); }
  const posOf={}; for(const k in ln)posOf[ln[k].id]=k;
  let sp=null; for(let i=0;i<C.rot.length&&!sp;i++){ const p=C.rot[(C.ri+i)%C.rot.length]; if(ok(p)&&(p.lastStart==null||day-p.lastStart>=4)&&(p.fat||0)<70){ sp=p; C.ri=(C.ri+i+1)%C.rot.length; } }
  if(!sp)sp=[...C.rot,...C.pen].filter(ok).sort((a,b)=>(a.fat||0)-(b.fat||0)||(a.id-b.id))[0];
  const pen=C.pen.filter(p=>p!==sp&&ok(p));
  const s={tid:C.tid,rot:null,order,posOf,bench:bench.filter(b=>!used.has(b.id)),out:[],defv:teamDefV(ln),spAll:C.rot,short:false,pen,used:new Set([sp.id]),cur:sp,sp,curIsSP:true,idx:0,box:new Map(),pitchers:[sp.id],entry:{},exit:{}};
  s.start=order.map((p,o)=>({id:p.id,n:p.name,o,pos:posOf[p.id]})); s.changes=[]; s.box.set(sp.id,pz()); order.forEach(p=>s.box.set(p.id,bz())); sideTraits(s); return s; }
/* 경기 뒤: 투수 피로·등판일, 야수 피로, 드문 부상(시리즈 안에서만). 하루가 지나면 피로가 풀린다 */
function ladderAfter(g,day){ for(const k of ['h','a']){ const s=g.S[k];
    for(const [id,x] of s.box){ const p=G.players[id]; if(!p)continue;
      if(p.isP){ const st=id===s.sp.id; p.fat=clamp((p.fat||0)+pitFatGain(p,x.pc||0,st),0,100); p.lastApp=day; if(st)p.lastStart=day; if(R()<(p.inj||.15)*(st?.02:.006))p.injOut=ri(3,12); }
      else { const inLn=s.order.some(q=>q.id===id); if(inLn)p.fat=clamp((p.fat||0)+(s.posOf[id]==='C'?12:6),0,100); if(R()<(p.inj||.15)*.004)p.injOut=ri(2,10); } } } }
function ladderRest(){ for(const p of Object.values(G.players)){ if(p.team==null)continue; p.fat=Math.max(0,(p.fat||0)*.55-4); if(p.injOut>0)p.injOut--; } }
/* 시리즈: A·B 스냅샷(같은 시즌), 시리즈 시드, 경기 수(기본 30). 반환은 JSON으로 그대로 쓸 수 있는 결과 */
function ladderSeries(snapA,snapB,o){ o=o||{}; const Core=FrontOfficeCore; const pool=o.pool||ladderPool(snapA&&snapA.season);
  const n=Math.max(1,Math.min(200,Math.round(o.games||30))), seed=String(o.seed??'0');
  for(const [k,s] of [['A',snapA],['B',snapB]]){ const v=Core.ladderValidate(s,pool); if(!v.ok)return {ok:false,side:k,errors:v.errors}; }
  const hA=Core.ladderSnapHash(snapA), hB=Core.ladderSnapHash(snapB);
  const json=ladderWorldJson(pool); const LG0=LRULE, PK0=PARK, SD0=SIMDAY;
  try{ return ladderSwap(JSON.parse(json),()=>{
    const CA=ladderInstall(0,snapA,pool), CB=ladderInstall(1,snapB,pool);
    const st={A:{w:0,l:0,t:0,r:0,ra:0},B:{w:0,l:0,t:0,r:0,ra:0}}, list=[], box={}; let day=G.day;
    const add=(id,x)=>{ const b=box[id]||(box[id]={}); for(const k in x)if(typeof x[k]==='number')b[k]=(b[k]||0)+x[k]; return b; };
    for(let i=0;i<n;i++){ const aHome=i%2===0, H=aHome?CA:CB, W=aHome?CB:CA; G.day=day;
      const g=simGame(day,H.tid,W.tid,false,{sides:{h:ladderSide(H,day),a:ladderSide(W,day)},pitchRecords:false});
      const a=aHome?g.score.h:g.score.a, b=aHome?g.score.a:g.score.h; st.A.r+=a; st.A.ra+=b; st.B.r+=b; st.B.ra+=a;
      if(a>b){ st.A.w++; st.B.l++; } else if(b>a){ st.B.w++; st.A.l++; } else { st.A.t++; st.B.t++; }
      for(const k of ['h','a'])for(const [id,x] of g.S[k].box){ const p=G.players[id]; if(!p)continue; const b=add(id,x); b.g=(b.g||0)+1; if(p.isP){ if(g.dec.w===id)b.w=(b.w||0)+1; if(g.dec.l===id)b.l=(b.l||0)+1; if(g.dec.sv===id)b.sv=(b.sv||0)+1; if(id===g.S[k].sp.id)b.gs=(b.gs||0)+1; } }
      list.push([a,b,aHome?'A':'B',g.inn||9]); ladderAfter(g,day); day++; ladderRest(); }
    const top=(tid,off)=>{ const ps=Object.values(G.players).filter(p=>p.team===tid); const pid=p=>p.id-off;
      const bat=ps.filter(p=>!p.isP&&box[p.id]&&box[p.id].ab).map(p=>{ const b=box[p.id]; const tb=b.h+b.d+2*b.tr+3*b.hr, pa=b.ab+b.bb+b.hbp+(b.sf||0); return {id:pid(p),name:p.name,g:b.g,ab:b.ab,h:b.h,hr:b.hr,rbi:b.rbi,bb:b.bb,hbp:b.hbp||0,sf:b.sf||0,so:b.so,avg:+(b.h/b.ab).toFixed(3),ops:+((pa?(b.h+b.bb+b.hbp)/pa:0)+tb/b.ab).toFixed(3)}; }).sort((x,y)=>y.ops*Math.min(1,y.ab/40)-x.ops*Math.min(1,x.ab/40)||x.id-y.id);
      const pit=ps.filter(p=>p.isP&&box[p.id]&&box[p.id].outs).map(p=>{ const b=box[p.id]; return {id:pid(p),name:p.name,g:b.g,gs:b.gs||0,ip:Math.floor(b.outs/3)+(b.outs%3)/10,w:b.w||0,l:b.l||0,sv:b.sv||0,so:b.so,era:+(b.er*27/b.outs).toFixed(2)}; }).sort((x,y)=>(y.gs-x.gs)||(x.era-y.era)||x.id-y.id);
      return {bat:bat.slice(0,5),pit:pit.slice(0,5)}; };
    const side=(k,s,h,tid,off)=>({name:s.name,hash:h,w:st[k].w,l:st[k].l,t:st[k].t,runs:st[k].r,allowed:st[k].ra,diff:st[k].r-st[k].ra,...top(tid,off)});
    return {ok:true,v:FrontOfficeCore.LADDER_V,season:pool.season,seed,games:n,a:side('A',snapA,hA,0,0),b:side('B',snapB,hB,1,LADDER_B_OFF),winner:st.A.w>st.B.w?'A':st.B.w>st.A.w?'B':st.A.r>st.B.r?'A':st.B.r>st.A.r?'B':'-',scores:list}; }); }
  finally{ LRULE=LG0; PARK=PK0; SIMDAY=SD0; } }
