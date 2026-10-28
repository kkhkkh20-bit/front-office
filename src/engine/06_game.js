/* ===== 경기: 타석·주자·투수 교체 ===== */
const LGP={bb:.083,k:.198,hr:.024,babip:.312};
const comb=(pb,pp,pl)=>{ const x=pb*pp/pl, y=(1-pb)*(1-pp)/(1-pl); return x/(x+y); };
const bz=()=>({pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,r:0,rbi:0,sb:0,cs:0});
const pz=()=>({outs:0,h:0,hr:0,bb:0,so:0,er:0,pc:0,bf:0});
function relAvail(p,day){ const ae=mgrPush(p.team); if(!healthy(p)||p.lastApp===day||(p.fat||0)>72+(ae-50)*.4)return false;
  const cd=consecDays(p,day); /* 연투: 이틀은 보통, 3연투는 밀어붙이는 감독만, 4연투는 강행군 감독만 */
  if(cd>=1&&(p.lastPc||0)>25+(ae-50)*.4)return false; if(cd>=2&&(ae<55||(p.lastPc||0)>22))return false; if(cd>=3&&ae<72)return false; if(cd>=4)return false;
  if(ae<=38&&pc7(p,day)>60)return false; return true; }
function pickStarter(tid,d,day){
  const t=team(tid); const sp=d.sp;
  if(!sp.length) return d.pen[0]||playersOf(tid).find(p=>p.isP&&healthy(p))||playersOf(tid).find(p=>p.isP)||null;
  for(let k=0;k<sp.length;k++){ const i=((t.rot||0)+k)%sp.length; const p=sp[i]; if(p.lastStart==null||day-p.lastStart>=5){ t.rot=(i+1)%sp.length; return p; } }
  return [...sp].sort((a,b)=>(a.lastStart||0)-(b.lastStart||0))[0];
}
function orderList(start,tid){
  const s=[...start]; const by=f=>s.sort((a,b)=>f(b)-f(a)); const m=tid!=null?mgrOf(tid):null; const sm=m&&!m.interim?m.small:50;
  if(sm<=38){ /* 빅볼: 출루 좋은 1번 뒤에 팀 최고 타자를 2번에 두고 장타자를 몰아 놓는다 */
    by(p=>p.r.eye*1.2+p.r.con+p.r.spd*.3); const lead=s.splice(0,1); by(offV); const two=s.splice(0,1); by(p=>p.r.pow+p.r.con*.4); const mid=s.splice(0,3); by(offV); return [...lead,...two,...mid,...s]; }
  if(sm>=62){ /* 스몰볼: 빠른 1번, 번트·밀어치기가 되는 2번 */
    by(p=>p.r.spd*1.2+p.r.con+p.r.eye*.6); const lead=s.splice(0,1); by(p=>p.r.con*1.3+p.r.eye*.5-p.r.pow*.4+p.r.spd*.3); const two=s.splice(0,1); by(p=>p.r.pow+p.r.con*.5); const mid=s.splice(0,3); by(offV); return [...lead,...two,...mid,...s]; }
  by(p=>p.r.con+p.r.eye+p.r.spd*.7); const top=s.splice(0,2);
  by(p=>p.r.pow+p.r.con*.5); const mid=s.splice(0,3);
  by(offV); return [...top,...mid,...s];
}
function gameSide(tid,day){
  const d=depth(tid); const ln=Object.assign({},d.ln); const bench=[...d.bench];
  const ov={};
  for(const pos of ORDER){ const p=ln[pos]; if(!p||ov[pos]===p.id||!bench.length)continue;
    const m=mgrOf(tid), re=m.interim?50:mgrRestEff(m); const fat=p.fat||0, thr=(pos==='C'?55:66)+(50-re)*.35; if(R()<.004+re/4000||(fat>thr&&R()<clamp((fat-thr)/30+(re-50)/150,.12,.95))){ let best=null,bs=-1e9; for(const q of bench){const s=posScore(q,pos); if(s>bs){bs=s;best=q}} ln[pos]=best; bench.splice(bench.indexOf(best),1); } }
  const posOf={}; for(const k in ln)posOf[ln[k].id]=k;
  const order=orderList(ORDER.filter(k=>ln[k]).map(k=>ln[k]),tid);
  const sp=pickStarter(tid,d,day);
  const s={tid,order,posOf,bench,out:[],defv:teamDefV(ln),pen:d.pen.filter(p=>p!==sp),used:new Set(sp?[sp.id]:[]),cur:sp,sp,curIsSP:true,idx:0,box:new Map(),pitchers:sp?[sp.id]:[],entry:{},exit:{}};
  if(sp)s.box.set(sp.id,pz()); order.forEach(p=>s.box.set(p.id,bz())); sideTraits(s);
  return s;
}
function boostOf(p){ let b=(p.team!=null&&G.coach)?coachBoost(p):0; if(p.team===G.user)b+=mgrRelBoost(p); const f=G.form; if(f&&p.team===G.user&&G.day<=f.until)b+=f.b; if(p.form&&G.day<=p.form.until)b+=p.form.b; if(p.mor!=null)b+=clamp((p.mor-60)/25,-1.6,1.2); if(p.team!=null){ b+=(mgrOf(p.team).tac-50)/60; b+=climateOf(p.team).boost; } if(p.foreign&&p.fy===G.year&&p.adapt!=null)b+=(p.adapt-50)/22;
  if(p.sf&&p.sf.y===G.year)b+=p.sf.v+(p.sf.m||0);
  if(p.fat>45)b-=(p.fat-45)/18;
  if(p.wear){ const cap=p.isP?60+p.r.sta*1.3:70+(p.r.vit||52)*1.0; if(p.wear>cap)b-=Math.min(3,(p.wear-cap)/25); }
  return b; }
/* 선수 능력 차이가 타석 결과에 반영되는 폭. 1이면 능력 그대로, 낮을수록 운의 비중이 커진다.
   실제 KBO 시즌 승률 표준편차(약 0.06, 1위 0.60~0.61)에 맞춰 0.84로 둔다 */
const TALENT_W=.84;
function shrinkQ(q){ const o=Object.assign({},q); for(const k of ['bb','k','hr','babip'])o[k]=LGP[k]+(q[k]-LGP[k])*TALENT_W; return o; }
function outcome(b,p,dv){
  const qb=shrinkQ(batProbs(b,boostOf(b)+platB(b,p)*.5)), qp=shrinkQ(pitProbs(p,boostOf(p)+platP(p,b)*.5));
  const bb=comb(qb.bb,qp.bb,LGP.bb), k=comb(qb.k,qp.k,LGP.k), hr=comb(qb.hr,qp.hr,LGP.hr), babip=comb(qb.babip,qp.babip,LGP.babip)-(G.coach&&p.team!=null?(effC(coachesOf(p.team).dc,p.team)-55)*.0006:0)-(p.team!=null?anaEff(p.team).bab-.0016:0)+(b.team!=null?anaEff(b.team).bat-.0012:0)-((dv??DEF0)-DEF0)*.0016; /* 전력분석: 수비 위치·투구 계획. 야수 수비력이 인플레이 타구 안타 확률을 바꾼다 */
  const x=R(); if(x<bb)return 'BB'; if(x<bb+k)return 'K'; if(x<bb+k+hr)return 'HR';
  if(R()<babip){ const y=R(); if(y<qb.d3)return '3B'; if(y<qb.d3+qb.d2)return '2B'; return '1B'; }
  return 'OUT';
}
function simGame(day,hid,aid,ps){
  const S={h:gameSide(hid,day),a:gameSide(aid,day)};
  const score={h:0,a:0}, line={h:[],a:[]}, hits={h:[],a:[]}, ev=[], pbp=[];
  const wc={}, lc={}; let walk=false;
  const opp=k=>k==='h'?'a':'h';
  const lim=(fs)=>{ const mm=mgrOf(fs.tid); const ae=mgrPush(fs.tid); return fs.curIsSP?72+fs.cur.r.sta*.55+(50-mm.pen)/4+(ae-50)/3:18+fs.cur.r.sta*.3+(ae-50)/8+(fs.multi&&fs.multi[fs.cur.id]?12:0); };
  function needChange(fs){ const x=fs.box.get(fs.cur.id); const mm=mgrOf(fs.tid);
    if(fs.curIsSP){ const hook=!mm.interim&&(mm.pen>=62||mgrPush(fs.tid)>=72)&&x.bf>=18&&x.er>=3; /* 선발 쪼개기: 세 번째 타순에 흔들리면 바로 내린다 */ return x.pc>=lim(fs)||x.er>=6||(x.er>=4&&x.pc>=lim(fs)-25)||hook; }
    return x.outs>=(fs.multi&&fs.multi[fs.cur.id]?6:3)||x.pc>=lim(fs); }
  function bringIn(fs,inn,lead,half){
    const av=fs.pen.filter(p=>!fs.used.has(p.id)&&relAvail(p,day)); if(!av.length)return;
    const closer=fs.pen[0], setup=fs.pen.slice(1,4), mid=fs.pen.slice(4);
    let nxt=null;
    if(inn>=9&&lead>=1&&lead<=3) nxt=av.find(p=>p===closer);
    if(!nxt&&inn>=7&&lead>=0&&lead<=3) nxt=av.find(p=>setup.includes(p));
    if(!nxt&&(lead<-3||lead>4)) nxt=[...av].reverse().find(p=>p!==closer);
    if(!nxt) nxt=av.find(p=>mid.includes(p))||av.find(p=>p!==closer)||av[0];
    fs.exit[fs.cur.id]=lead; fs.cur=nxt; fs.curIsSP=false; fs.used.add(nxt.id); { const pu=mgrPush(fs.tid); if(nxt!==closer&&inn<=7&&R()<clamp((pu-52)/45,0,.6)*(Math.abs(lead)<=3?1:.5))(fs.multi=fs.multi||{})[nxt.id]=1; } /* 멀티이닝 */ fs.box.set(nxt.id,pz()); fs.entry[nxt.id]=lead; fs.pitchers.push(nxt.id);
    if(ev.length<400)ev.push({h:half,t:`투수 교체: ${nxt.name}`}); if(pbp.length<260)pbp.push([half,'PC',nxt.id]);
  }
  function half(bk,inn){
    const bs=S[bk], fs=S[opp(bk)], isBot=bk==='h', half=(inn-1)*2+(isBot?1:0);
    const lead=()=>score[bk]-score[opp(bk)];
    if(fs.cur&&needChange(fs))bringIn(fs,inn,-lead(),half);
    if(inn>=8&&-lead()>=1&&-lead()<=3&&!fs.dsub){ fs.dsub=1; const n=defSub(fs); if(n&&ev.length<400)ev.push({h:half,t:`수비 강화: ${n}`}); }
    let outs=0, runs=0, hh=0; const base=[null,null,null];
    while(outs<3){
      /* 도루: KBO 2024~25 구단 평균 시즌 120~140개, 성공률 72~75%, 1위 50~65개 수준에 맞춘다. 2루 도루가 대부분이고 빠른 주자는 3루도 노린다 */
      if(base[1]&&!base[2]&&outs<2&&base[1].r.spd>=60&&R()<(base[1].r.spd-57)*.0045*(.65+mgrOf(bs.tid).small/100*.9)*stealTry(fs)){
        const r=base[1], rb=bs.box.get(r.id); if(R()<clamp(.6+(r.r.spd-60)*.008+(G.coach?(effC(coachesOf(bs.tid).rc,bs.tid)-55)*.003:0)+stealAdj(r,fs),.4,.92)){rb.sb++;base[2]=r;base[1]=null; if(pbp.length<260)pbp.push([half,'SB',r.id,outs,base.map(x=>x?x.id:0)]);} else {rb.cs++;base[1]=null;outs++; if(pbp.length<260)pbp.push([half,'CS',r.id,outs,base.map(x=>x?x.id:0)]); continue;} }
      if(base[0]&&!base[1]&&outs<2&&base[0].r.spd>=45&&R()<Math.min(.36,(base[0].r.spd-41)*.0105)*(.65+mgrOf(bs.tid).small/100*.9)*stealTry(fs)){
        const r=base[0], rb=bs.box.get(r.id); if(R()<clamp(.65+(r.r.spd-50)*.007+(G.coach?(effC(coachesOf(bs.tid).rc,bs.tid)-55)*.003:0)+stealAdj(r,fs),.35,.92)){rb.sb++;base[1]=r;base[0]=null; if(pbp.length<260)pbp.push([half,'SB',r.id,outs,base.map(x=>x?x.id:0)]);} else {rb.cs++;base[0]=null;outs++; if(pbp.length<260)pbp.push([half,'CS',r.id,outs,base.map(x=>x?x.id:0)]); continue;} }
      const b=bs.order[bs.idx%bs.order.length]; bs.idx++;
      const p=fs.cur; const xb=bs.box.get(b.id), xp=fs.box.get(p.id);
      xb.pa++; xp.bf++; xp.pc+=Math.max(1,Math.round(N(3.9,1.3)));
      const before=lead(); const sc=[]; let dp=false; let o=null;
      /* 희생번트: 스몰볼 감독이 무사 1루(1·2루) 접전에서 하위 타선에게 시킨다. 빅볼 감독은 거의 대지 않는다 */
      if(outs===0&&base[0]&&!base[2]&&inn<=10){ const mm=mgrOf(bs.tid), sm=mm.interim?50:mm.small, slot=(bs.idx-1)%9; const close=before>=-2&&before<=1;
        const pr=sm<=40?0:(sm-40)/60*(close?(inn>=7?.85:.36):.07)*(slot>=6||offV(b)<45?1:.25)*(base[1]?.7:1);
        if(R()<pr){ const r=R();
          if(r<.7){ o='SAC'; outs++; xp.outs++; base[2]=base[1]; base[1]=base[0]; base[0]=null; }
          else if(r<.8){ o='1B'; xb.ab++; xb.h++; xp.h++; hh++; base[2]=base[1]; base[1]=base[0]; base[0]=b; }
          else if(r<.9){ o='OUT'; xb.ab++; outs++; xp.outs++; }
          else { o='OUT'; xb.ab++; outs++; xp.outs++; if(base[1]){ base[1]=base[0]; } base[0]=b; } } }
      if(o){ if(pbp.length<260)pbp.push([half,b.id,p.id,o,outs,base.map(x=>x?x.id:0),0,score.a,score.h]); if(ev.length<400&&o==='SAC')ev.push({h:half,t:`${b.name} 희생번트`}); if(outs<3&&fs.box.get(fs.cur.id).pc>lim(fs)+12)bringIn(fs,inn,-lead(),half); continue; }
      o=outcome(b,p,fs.defv);
      const PB=()=>{ if(pbp.length<260)pbp.push([half,b.id,p.id,dp?'DP':o,outs,base.map(x=>x?x.id:0),sc.length,score.a,score.h]); };
      if(o==='BB'){ xb.bb++; xp.bb++; if(base[0]){ if(base[1]){ if(base[2])sc.push(base[2]); base[2]=base[1]; } base[1]=base[0]; } base[0]=b; }
      else { xb.ab++;
        if(o==='K'){ xb.so++; xp.so++; outs++; xp.outs++; }
        else if(o==='OUT'){
          if(R()<.018*clamp(1+(DEF0-fs.defv)/22,.4,2.2)){ xp.h+=0; if(base[2])sc.push(base[2]); base[2]=base[1]; base[1]=base[0]; base[0]=b; }
          else if(base[0]&&outs<2&&R()<.11*dpF(b,p,fs)){ dp=true; outs+=2; xp.outs+=2; base[0]=null; }
          else { outs++; xp.outs++; if(outs<3&&base[2]&&R()<.4+runAdj(base[2],fs)){ sc.push(base[2]); base[2]=null; } if(outs<3&&base[1]&&!base[2]&&R()<.3){ base[2]=base[1]; base[1]=null; } }
        } else { xb.h++; xp.h++; hh++;
          if(o==='HR'){ xb.hr++; xp.hr++; sc.push(...base.filter(Boolean),b); base[0]=base[1]=base[2]=null; }
          else if(o==='3B'){ xb.tr++; sc.push(...base.filter(Boolean)); base[0]=base[1]=null; base[2]=b; }
          else if(o==='2B'){ xb.d++; if(base[2])sc.push(base[2]); if(base[1])sc.push(base[1]); const r1=base[0]; base[0]=base[1]=base[2]=null; if(r1){ if(R()<.46+(r1.r.spd-50)*.006+runAdj(r1,fs))sc.push(r1); else base[2]=r1; } base[1]=b; }
          else { if(base[2])sc.push(base[2]); base[2]=null;
            if(base[1]){ if(R()<.66+(base[1].r.spd-50)*.006+runAdj(base[1],fs))sc.push(base[1]); else base[2]=base[1]; base[1]=null; }
            if(base[0]){ if(!base[2]&&R()<.31+(base[0].r.spd-50)*.005+runAdj(base[0],fs))base[2]=base[0]; else base[1]=base[0]; base[0]=null; }
            base[0]=b; }
        }
      }
      if(sc.length){
        const n=sc.length; sc.forEach(r=>bs.box.get(r.id).r++); if(!dp)xb.rbi+=n; xp.er+=n; score[bk]+=n; runs+=n; PB();
        const after=lead(); if(before<=0&&after>0){ wc[bk]=bs.cur; lc[opp(bk)]=fs.cur; }
        const kind={HR:n===4?'만루 홈런':`${n}점 홈런`,'3B':'3루타','2B':'2루타','1B':'적시타',BB:'밀어내기 볼넷',OUT:'희생타',K:''}[o];
        if(ev.length<400)ev.push({h:half,t:`${b.name} ${kind}${o!=='HR'?` (${n}점)`:''} · ${score.a}:${score.h}`,run:true});
        if(isBot&&inn>=9&&score.h>score.a){ walk=true; break; }
      } else PB();
      if(outs<3&&fs.box.get(fs.cur.id).pc>lim(fs)+12)bringIn(fs,inn,-lead(),half);
    }
    line[bk].push(runs); hits[bk].push(hh);
  }
  const maxInn=ps?15:11; let inn=1;
  while(true){
    half('a',inn);
    if(inn>=9&&score.h>score.a){ line.h.push('X'); break; }
    half('h',inn);
    if(walk)break;
    if(inn>=9&&score.h!==score.a)break;
    if(inn>=maxInn)break;
    inn++;
  }
  // 승패·세이브·홀드
  const winK=score.h>score.a?'h':score.a>score.h?'a':null; const dec={};
  for(const k of ['h','a']){ const fs=S[k]; if(!(fs.cur.id in fs.exit))fs.exit[fs.cur.id]=score[k]-score[opp(k)]; }
  if(winK){ const loseK=opp(winK); const ws=S[winK]; let w=wc[winK]||ws.sp; let l=lc[loseK]||S[loseK].sp;
    if(w===ws.sp&&ws.box.get(w.id).outs<15&&ws.pitchers.length>1){ const rel=ws.pitchers.slice(1).map(id=>G.players[id]).filter(Boolean).sort((a,b)=>ws.box.get(b.id).outs-ws.box.get(a.id).outs)[0]; if(rel)w=rel; }
    dec.w=w.id; dec.l=l.id;
    const fin=G.players[ws.pitchers[ws.pitchers.length-1]];
    if(fin&&fin.id!==w.id&&fin!==ws.sp){ const el=ws.entry[fin.id]; if(el!=null&&el>=1&&el<=3)dec.sv=fin.id; }
    dec.hld=[]; for(const k of ['h','a']){ const s=S[k]; s.pitchers.slice(1).forEach(id=>{ if(id===dec.w||id===dec.sv||id===s.pitchers[s.pitchers.length-1])return; const el=s.entry[id], xl=s.exit[id]; if(el!=null&&el>=1&&el<=3&&xl!=null&&xl>=1)dec.hld.push(id); }); }
  }
  return {S,score,line,hits,ev,dec,inn,walk,pbp};
}
function applyGame(day,hid,aid,g,ps){
  let turfM=1; try{ turfM=stadTurfM(hid); }catch(e){}
  const y=G.year;
  for(const k of ['h','a']){ const s=g.S[k]; const bm=k==='a'?1+BUS[busLv(s.tid)].f:1; /* 원정 이동 피로 */
    for(const [id,x] of s.box){ const p=G.players[id]; if(!p)continue;
      if(!ps)storyGame(p,x,day,g.S[k==='h'?'a':'h'].tid,g.dec);
      if(p.isP){ const cd=loadLog(p,day,x.pc,id===s.sp?.id); p.prevApp=p.lastApp; p.lastApp=day; p.lastPc=x.pc; if(id===s.sp?.id)p.lastStart=day; const lm=loadMult(p,cd,day);
        p.fat=clamp((p.fat||0)+(x.pc*(id===s.sp?.id?.55:.9)+(id===s.sp?.id?0:6))*bm,0,100); if(!ps)p.wear=(p.wear||0)+x.pc/15; if(!ps){ (p.l10=p.l10||[]).push([x.outs,x.er,x.h,x.bb,x.so]); if(p.l10.length>10)p.l10.shift(); }
        if(!ps){ const h=lineFor(p,y,s.tid,'1군'); const o={g:1,gs:id===s.sp?.id?1:0,outs:x.outs,h:x.h,hr:x.hr,bb:x.bb,so:x.so,er:x.er,w:g.dec.w===id?1:0,l:g.dec.l===id?1:0,sv:g.dec.sv===id?1:0,hld:(g.dec.hld||[]).includes(id)?1:0}; addTo(h,o); }
        /* 부상 빈도: KBO 구단당 시즌 부상 이탈 7~10건 수준. 부상 병동(체질 .3 이상)은 해마다 한두 번 빠진다 */ const risk=p.inj*(id===s.sp?.id?.075*(x.pc||0)/95:.026*(x.pc||0)/17)*injMult(p)*turfM*(1+Math.max(0,(p.fat||0)-60)/50)*(id===s.sp?.id?1+Math.max(0,(x.pc||0)-100)/60:1)*lm/LOAD_NORM; if(R()<risk)injure(p,day,{sp:id===s.sp?.id,pc:x.pc||0,load:lm}); if(!ps&&p.injFx&&!(p.injOut>0)){ p.injPlay=day; injRecover(p,x.outs||0); }
      } else {
        if(!ps){ const h=lineFor(p,y,s.tid,'1군'); addTo(h,Object.assign({g:1},x)); h.pos=s.posOf[id]||h.pos||p.pos; }
        if(!ps){ const i=s.order.findIndex(q=>q.id===id); if(i>=0){ const u=(p.use&&p.use.y===y)?p.use:(p.use={y,g:0,pos:{},slot:{}}); u.g++; const ps_=s.posOf[id]||'DH'; u.pos[ps_]=(u.pos[ps_]||0)+1; u.slot[i+1]=(u.slot[i+1]||0)+1; } }
        if(s.order.some(q=>q.id===id)){ p.fat=clamp((p.fat||0)+((s.posOf[id]==='C'?15:s.posOf[id]==='DH'?6:10)-(p.r.vit||52)*.04)*bm,0,100); if(!ps){ p.wear=(p.wear||0)+1; (p.l10=p.l10||[]).push([x.ab,x.h,x.hr,x.bb,x.rbi,x.d+x.tr*2+x.hr*3]); if(p.l10.length>10)p.l10.shift(); } }
        if(R()<p.inj*.026*injMult(p)*turfM*(1+Math.max(0,(p.fat||0)-60)/60))injure(p,day);
        else if(!ps&&p.injFx){ p.injPlay=day; injRecover(p,(x.ab||0)+(x.bb||0)); }
      }
    }
  }
  if(!ps){ try{ featGame(day,g); }catch(e){} }
  if(!ps){ const r=G.sea.rec; if(g.score.h>g.score.a){r[hid].w++;r[aid].l++;} else if(g.score.a>g.score.h){r[aid].w++;r[hid].l++;} else {r[hid].t++;r[aid].t++;}
    const tl=G.sea.tl||(G.sea.tl=G.teams.map(()=>[])); const sg=Math.sign(g.score.h-g.score.a); tl[hid].push([sg,g.score.h,g.score.a,1,aid,day]); tl[aid].push([-sg,g.score.a,g.score.h,0,hid,day]); }
}
function injure(p,day,ctx){ ctx=ctx||{};
  const k=injPick(p,ctx); const I=INJ[k]; let days=ri(I.d[0],I.d[1]); days=Math.max(3,Math.round(days*(I.d[0]>=240?Math.sqrt(recMult(p)):recMult(p))));
  p.injOut=days; p.injK=k; p.injHist.push({y:G.year,days,d:G.day,k}); if(days>=40)p.inj=Math.min(.45,p.inj+.02); /* 큰 부상은 재발 위험을 남긴다 */
  if(I.ucl)p.ucl=1; if(I.tj)delete p.ucl; delete p.reInj;
  const fx=injApply(p,k,days);
  const ret=injRetTxt(p), seasonOut=period()==='season'&&G.day+days>(G.cal.end||KD(10,5));
  if(days>=30)story(p,`${I.n}(으)로 약 ${days>=300?Math.round(days/30)+'개월':days+'일'} 이탈`,'inj');
  if(p.team===G.user&&days>=30&&period()==='season'&&(ovr(p)>=55||p.sal>=800))news('선수',`${tshort(G.user)} 악재, ${p.name} ${I.surg?'수술':'장기 이탈'}`,`${p.name}이(가) ${I.n}(으)로 ${days>=300?Math.round(days/30)+'개월':'약 '+days+'일'} 빠집니다.${seasonOut?' 사실상 시즌 아웃입니다.':''}`,-1,{ref:p.id});
  else if(p.team!==G.user&&I.surg&&days>=200&&ovr(p)>=55)wire('부상',`${tshort(p.team)} ${p.name}, ${I.n}`,{tid:p.team,ref:p.id});
  if(p.team===G.user){ const H=HOSP[G.med.hosp]; const len=days>=300?`약 ${Math.round(days/30)}개월`:`${H.dx?'':'약 '}${days}일`;
    const fxT=I.tj?' 복귀까지 보통 12~16개월이 걸리고, 복귀 첫해에는 제구가 흔들리는 경우가 많습니다. 구속은 떨어지는 선수가 더 많지만 젊으면 오히려 오르기도 합니다.':I.perm&&I.d[0]>=90?' 수술 뒤 예전 몸 상태를 완전히 되찾지 못할 수도 있습니다.':I.re?' 복귀 직후 재발이 잦은 부위입니다.':'';
    const msg=`${p.name}(${posLabel(p)})이(가) ${I.n}(으)로 ${len} 이탈합니다. 예상 복귀 ${ret}.${seasonOut?' 올 시즌은 사실상 끝났습니다.':''}${fxT}${H.c?` ${H.name}에서 치료합니다.`:''}${H.dx?` 정밀 검진 결과 재발 위험은 ${p.inj>.24?'높은':p.inj>.15?'보통':'낮은'} 편입니다.`:''}`;
    p.mor=clamp((p.mor||60)-4,0,100); days>=10&&!ctx.farm?stop('부상',msg,p.id):note('부상',(ctx.farm?'[퓨처스] ':'')+msg,p.id); }
  if(!I.surg)try{ evInjury(p,days); }catch(e){}
}
function gameRecord(day,hid,aid,g,kind){
  const side=k=>{ const s=g.S[k]; return {tid:s.tid,bat:[...s.order,...(s.out||[])].map(p=>{const x=s.box.get(p.id);return {id:p.id,n:p.name,pos:(s.out||[]).includes(p)?null:s.posOf[p.id],ab:x.ab,h:x.h,d:x.d,tr:x.tr,hr:x.hr,rbi:x.rbi,bb:x.bb,so:x.so,r:x.r,sb:x.sb}}),
    pit:s.pitchers.map(id=>{const x=s.box.get(id);const p=G.players[id];return {id,n:p?p.name:'',outs:x.outs,h:x.h,hr:x.hr,er:x.er,bb:x.bb,so:x.so,pc:x.pc,d:g.dec.w===id?'승':g.dec.l===id?'패':g.dec.sv===id?'세':(g.dec.hld||[]).includes(id)?'홀':''}})}; };
  const me=hid===G.user?'h':'a'; const ms=g.score[me], os=g.score[me==='h'?'a':'h'];
  return {day,kind,home:hid,away:aid,hs:g.score.h,as:g.score.a,line:g.line,hits:g.hits,ev:g.ev,pbp:g.pbp,box:{h:side('h'),a:side('a')},res:ms>os?'승':ms<os?'패':'무',inn:g.inn};
}
function keepGame(rec){ G.games.unshift(rec); G.games=G.games.slice(0,25); G.games.forEach((g,i)=>{ if(i>=8&&g.pbp)delete g.pbp; }); }
function ulog(r){ (G.sea.ulog=G.sea.ulog||[]).push({d:r.day,h:r.home,a:r.away,hs:r.hs,as:r.as,res:r.res,k:r.kind||''}); }


