/* ===== 단장 대전: 리그 팩 시즌 =====
   서버가 내려 준 리그 팩(공용 모듈 ladderPackMake 형식)을 기기에서 직접 돌린다. (숨김) 난수는 평범한 난수라 돌릴 때마다 결과가 다르다.
   구단 i는 기준 세계의 i번 자리에 들어간다(모든 자리 구장 규격 같음). 경기 키 = 팩 시드·리그 id·경기 순번이라 다른 팩·다른 경기와 섞이지 않는다 */
function ladderPackRun(pack,o){ o=o||{}; const Core=FrontOfficeCore; const pool=o.pool||ladderPool(pack&&pack.season);
  const v=Core.ladderPackValidate(pack,pool); if(!v.ok)return {ok:false,errors:v.errors};
  const hs=pack.clubs.map(c=>Core.ladderSnapHash(c)), json=ladderWorldJson(pool); const LG0=LRULE, PK0=PARK, SD0=SIMDAY;
  try{ return ladderSwap(JSON.parse(json),()=>{
    const C=pack.clubs.map((c,i)=>ladderInstall(i,Object.assign({},c,{v:Core.LADDER_V}),pool));
    const rec=C.map(()=>({w:0,l:0,t:0,r:0,ra:0})), games=[], box={}; const d0=G.day; let day=-1;
    const add=(id,x)=>{ const b=box[id]||(box[id]={}); for(const k in x)if(typeof x[k]==='number')b[k]=(b[k]||0)+x[k]; return b; };
    pack.sched.forEach(([d,h,a],gi)=>{ if(d!==day){ if(day>=0)for(let k=day;k<d;k++)ladderRest(); day=d; } G.day=d0+d;
      const g=simGame(G.day,h,a,false,{sides:{h:ladderSide(C[h],G.day),a:ladderSide(C[a],G.day)},pitchRecords:false});
      const x=g.score.h, y=g.score.a; rec[h].r+=x; rec[h].ra+=y; rec[a].r+=y; rec[a].ra+=x;
      if(x>y){ rec[h].w++; rec[a].l++; } else if(y>x){ rec[a].w++; rec[h].l++; } else { rec[h].t++; rec[a].t++; }
      for(const k of ['h','a'])for(const [id,b0] of g.S[k].box){ const p=G.players[id]; if(!p)continue; const b=add(id,b0); b.g=(b.g||0)+1; if(p.isP){ if(g.dec.w===id)b.w=(b.w||0)+1; if(g.dec.l===id)b.l=(b.l||0)+1; if(g.dec.sv===id)b.sv=(b.sv||0)+1; if(id===g.S[k].sp.id)b.gs=(b.gs||0)+1; } }
      games.push([d,h,a,x,y]); ladderAfter(g,G.day); if(o.onGame)o.onGame(gi,pack.sched.length); });
    const pct=r=>r.w+r.l?r.w/(r.w+r.l):.5;
    const order=rec.map((r,i)=>i).sort((i,j)=>pct(rec[j])-pct(rec[i])||(rec[j].r-rec[j].ra)-(rec[i].r-rec[i].ra)||i-j);
    const top=order[0], gb=i=>((rec[top].w-rec[i].w)+(rec[i].l-rec[top].l))/2;
    const standings=order.map((i,k)=>({rank:k+1,club:i,name:pack.clubs[i].name,hash:hs[i],w:rec[i].w,l:rec[i].l,t:rec[i].t,pct:+pct(rec[i]).toFixed(3),gb:gb(i),runs:rec[i].r,allowed:rec[i].ra}));
    const ps=Object.values(G.players).filter(p=>p.team!=null&&box[p.id]), cl=p=>p.team, pid=p=>p.id-p.team*LADDER_B_OFF;
    const gpc=pack.sched.length*2/pack.clubs.length, qualAB=Math.round(gpc*3.1), qualO=Math.round(gpc*3); /* 규정 타석·이닝: 경기당 3.1타석·1이닝 */
    const bat=ps.filter(p=>!p.isP&&box[p.id].ab).map(p=>{ const b=box[p.id], pa=b.ab+b.bb+(b.hbp||0), tb=b.h+b.d+2*b.tr+3*b.hr; return {club:cl(p),id:pid(p),name:p.name,pa,ab:b.ab,h:b.h,hr:b.hr,rbi:b.rbi,sb:b.sb||0,avg:+(b.h/b.ab).toFixed(3),ops:+((pa?(b.h+b.bb+(b.hbp||0))/pa:0)+tb/b.ab).toFixed(3)}; });
    const pit=ps.filter(p=>p.isP&&box[p.id].outs).map(p=>{ const b=box[p.id]; return {club:cl(p),id:pid(p),name:p.name,g:b.g,gs:b.gs||0,outs:b.outs,w:b.w||0,l:b.l||0,sv:b.sv||0,so:b.so,era:+(b.er*27/b.outs).toFixed(2)}; });
    const lead=(L,k,dir,q)=>L.filter(q||(()=>true)).sort((x,y)=>dir*(y[k]-x[k])||x.club-y.club||x.id-y.id).slice(0,5);
    const leaders={avg:lead(bat,'avg',1,x=>x.pa>=qualAB),hr:lead(bat,'hr',1),rbi:lead(bat,'rbi',1),ops:lead(bat,'ops',1,x=>x.pa>=qualAB),era:lead(pit,'era',-1,x=>x.outs>=qualO),w:lead(pit,'w',1),sv:lead(pit,'sv',1),so:lead(pit,'so',1)};
    const res={ok:true,v:Core.LADDER_PACK_V,leagueId:pack.leagueId,season:pack.season,seed:pack.seed,clubs:pack.clubs.length,gamesTotal:games.length,standings,leaders,games};
    res.hash=rngHash(JSON.stringify(res)).toString(16).padStart(8,'0'); return res; }); }
  finally{ LRULE=LG0; PARK=PK0; SIMDAY=SD0; } }
/* 시험·연습용 팩: 내 구단(있으면) + 자동 편성 구단으로 n개 */
function ladderPackDemo(season,n,o){ o=o||{}; const pool=ladderPool(season); const names=['서울 단장회','부산 갈매기단','인천 등대','대전 별빛','광주 무등','대구 사자굴','수원 성곽','창원 공룡알','고양 숲','포항 바다'];
  const clubs=[]; if(o.mine)clubs.push(o.mine);
  for(let i=0;clubs.length<n;i++)clubs.push(ladderAuto(season,{name:names[i%names.length],hue:(i*37)%360,bias:i%5,mgr:pool.mgrs[i%pool.mgrs.length].id}));
  return FrontOfficeCore.ladderPackMake(clubs,{leagueId:o.leagueId||'demo',season,seed:o.seed??'demo',meet:o.meet??6}); }
