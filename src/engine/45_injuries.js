/* ===== 부상 종류와 후유증 =====
   실제 야구선수가 겪는 부상을 이름과 정도로 나눈다. 회복 기간은 MLB 부상자 명단 집계(FanGraphs MASH)와
   토미존 연구(Sports Info Solutions: 복귀 중앙값 16개월, 복귀 후 1년 구속 중앙값 약 1마일 하락, 28세 이하 46%는 오히려 상승,
   20% 이상은 빅리그에 돌아오지 못함)를 기준으로 잡았다.
   w: [선발, 불펜, 타자] 발생 비중, d: 이탈 일수 범위,
   fx: 능력 손실 범위(20~80 내부 척도), need: 손실을 되찾는 데 필요한 실전량(투수는 아웃카운트, 타자는 타석),
   perm: 되찾지 못하는 비율, re: 복귀 직후 같은 부위 재발 위험 배수와 기간 */
const INJ={
  blister:{n:'손가락 물집',part:'손가락',w:[6,6,0],d:[7,15]},
  elbowInf:{n:'팔꿈치 염증',part:'팔꿈치',w:[12,12,0],d:[10,25],fx:{stf:[.5,1.5]},need:30,elbow:1},
  shInf:{n:'어깨 염증',part:'어깨',w:[11,11,0],d:[15,40],fx:{stf:[1,2]},need:45},
  flexor:{n:'팔꿈치 굴곡근 염좌',part:'팔꿈치',w:[8,8,0],d:[21,60],fx:{stf:[1,2.5]},need:60,elbow:1},
  lat:{n:'광배근 부상',part:'등',w:[5,4,0],d:[35,80],fx:{stf:[1,3]},need:75},
  chips:{n:'팔꿈치 뼛조각 제거 수술',part:'팔꿈치',w:[5,5,0],d:[60,100],fx:{ctl:[1,2]},need:60,surg:1},
  uclP:{n:'팔꿈치 인대 부분 손상(주사 재활)',part:'팔꿈치',w:[4,4,0],d:[56,120],fx:{stf:[1,3]},need:90,elbow:1,ucl:1},
  tj:{n:'팔꿈치 인대 재건(토미존) 수술',part:'팔꿈치',w:[5,5,0],d:[365,480],surg:1,tj:1},
  cuff:{n:'회전근개 손상',part:'어깨',w:[3,3,0],d:[40,100],fx:{stf:[2,4]},need:120,perm:.2},
  cuffS:{n:'회전근개 파열 수술',part:'어깨',w:[.8,.8,0],d:[240,365],fx:{stf:[4,8],ctl:[1,3]},need:240,perm:.55,surg:1},
  labrum:{n:'어깨 관절와순 파열 수술',part:'어깨',w:[1,1,0],d:[300,420],fx:{stf:[5,9],ctl:[1,3]},need:270,perm:.7,surg:1},
  tos:{n:'흉곽출구증후군 수술',part:'어깨',w:[.4,.4,0],d:[150,240],fx:{stf:[2,4],ctl:[1,2]},need:150,perm:.3,surg:1},
  oblique:{n:'옆구리 근육(복사근) 부상',part:'옆구리',w:[6,5,9],d:[21,45],fx:{stf:[.5,1.5],pow:[1,2]},need:60,re:[2,30]},
  ham1:{n:'햄스트링 1도 손상',part:'햄스트링',w:[2,2,10],d:[10,21],fx:{spd:[.5,1.5]},need:40,re:[2.5,45],up:'ham2'},
  ham2:{n:'햄스트링 2도 손상',part:'햄스트링',w:[1,1,5],d:[28,56],fx:{spd:[1.5,3]},need:100,re:[3,60],up:'ham3'},
  ham3:{n:'햄스트링 완전 파열(3도) 수술',part:'햄스트링',w:[.2,.2,.8],d:[90,150],fx:{spd:[3,5],def:[0,1.5]},need:200,perm:.35,surg:1,re:[2,60]},
  calf:{n:'종아리 근육 부상',part:'종아리',w:[1,1,5],d:[14,35],fx:{spd:[.5,1.5]},need:50,re:[2,30]},
  groin:{n:'내전근(사타구니) 부상',part:'사타구니',w:[1,1,4],d:[14,35],fx:{spd:[.5,1],def:[.5,1]},need:50,re:[2,30]},
  quad:{n:'대퇴사두근 부상',part:'허벅지',w:[.5,.5,3],d:[14,35],fx:{spd:[.5,1.5]},need:50},
  ankle:{n:'발목 염좌',part:'발목',w:[1,1,6],d:[7,28],fx:{spd:[.5,1]},need:30},
  back:{n:'허리 염좌',part:'허리',w:[3,3,6],d:[10,30],fx:{stf:[.5,1.5],pow:[.5,1.5]},need:45,re:[1.6,30]},
  disc:{n:'허리 디스크',part:'허리',w:[1,1,2],d:[45,120],fx:{stf:[1,3],pow:[2,3]},need:150,perm:.2},
  contus:{n:'사구 타박상',part:'몸',w:[0,0,8],d:[5,12]},
  finger:{n:'손가락 골절',part:'손가락',w:[0,0,4],d:[28,50],fx:{con:[1,2]},need:60},
  hamate:{n:'손바닥 유구골 골절 수술',part:'손바닥',w:[0,0,2],d:[42,60],fx:{pow:[3,5]},need:220,surg:1},
  wrist:{n:'손목 골절',part:'손목',w:[0,0,2],d:[60,80],fx:{con:[1.5,3],pow:[1.5,3]},need:200},
  plantar:{n:'족저근막염',part:'발바닥',w:[.5,.5,2],d:[30,55],fx:{spd:[.5,1.5]},need:60,re:[1.6,45]},
  concus:{n:'뇌진탕',part:'머리',w:[0,0,2],d:[7,21],fx:{con:[1,2],eye:[1,2]},need:50},
  knee:{n:'무릎 반월판 손상 수술',part:'무릎',w:[.4,.4,2],d:[40,80],fx:{spd:[1,2],def:[.5,1.5]},need:120,perm:.25,surg:1},
  acl:{n:'무릎 전방십자인대 파열 수술',part:'무릎',w:[.1,.1,.6],d:[270,365],fx:{spd:[3,6],def:[2,4]},need:300,perm:.6,surg:1},
  achil:{n:'아킬레스건 파열 수술',part:'발목',w:[.1,.1,.3],d:[270,365],fx:{spd:[5,8],def:[1,3]},need:300,perm:.7,surg:1},
  shDis:{n:'어깨 탈구',part:'어깨',w:[0,0,1],d:[45,120],fx:{def:[1,2],pow:[1,2]},need:120,perm:.2},
  shB:{n:'어깨 관절와순 수술',part:'어깨',w:[0,0,.4],d:[150,240],fx:{pow:[2,4],def:[1,3]},need:200,perm:.4,surg:1}
};
const INJ_STAT={stf:'구위',ctl:'제구',sta:'스태미나',con:'컨택',pow:'파워',eye:'선구안',spd:'주력',def:'수비',vit:'체력'};
const injName=k=>INJ[k]?INJ[k].n:'부상';
/* 어떤 부상인지 고른다. 선발은 팔, 타자는 하체·손 부상이 많고, 포수는 무릎·머리, 많이 던진 날은 팔 부상 비중이 커진다 */
function injPick(p,ctx){ ctx=ctx||{}; const col=!p.isP?2:ctx.sp?0:1;
  const re=p.reInj&&p.reInj.left>0?p.reInj:null;
  if(re&&R()<.6){ const b=INJ[re.k]; return b&&b.up&&R()<.5?b.up:re.k; } /* 같은 부위 재발, 절반은 한 단계 더 심하게 */
  const L=[]; for(const k in INJ){ const I=INJ[k]; let w=I.w[col]; if(!w)continue;
    if(p.pos==='C'&&(k==='knee'||k==='concus'))w*=2.2;
    if(p.isP&&(I.part==='팔꿈치'||I.part==='어깨')&&ctx.pc>100)w*=1+(ctx.pc-100)/40;
    if(p.isP&&(I.part==='팔꿈치'||I.part==='어깨')&&ctx.load>1)w*=ctx.load*(I.d[0]>=56?1.4:1); /* 혹사당한 팔은 큰 부상으로 이어진다 */
    if(p.isP&&I.tj&&p.ucl)w*=4; /* 인대를 한 번 다친 투수는 수술로 이어지기 쉽다 */
    if(p.age>=33&&(k==='calf'||k==='achil'||k==='plantar'||k==='back'))w*=1.5;
    L.push([k,w]); }
  let s=sum(L.map(x=>x[1])), r=R()*s; for(const [k,w] of L){ r-=w; if(r<=0)return k; } return L[0][0]; }
/* 능력 손실을 실제로 적용하고, 되찾을 수 있는 몫을 기록한다 */
function injApply(p,k,days){ const I=INJ[k]; const hosp=p.team===G.user?({a:.6,b:.8,c:.9}[G.med.hosp]||1):1;
  const fx={k,n:I.n,y:G.year,L:{},P:{},need:I.need||0,got:0,v:0};
  const hit=(s,a,permF)=>{ if(p.r[s]==null||a<=0)return; const b=p.r[s]; p.r[s]=clamp(b-a,20,80); const real=b-p.r[s]; const pm=real*permF; fx.L[s]=(fx.L[s]||0)+real-pm; fx.P[s]=(fx.P[s]||0)+pm; };
  if(I.tj){ /* 토미존: 구속은 새 기준선이 되고, 제구·구위는 복귀 첫해에 실전을 던지며 되찾는다 */
    const young=p.age<=28, gain=R()<(young?.46:.3); const dv=gain?rnd(.4,2):-rnd(.4,2.8); /* km/h */
    p.velo+=dv*.5; const ds=dv*.5*60/17; p.r.stf=clamp(p.r.stf+ds,20,80); fx.v=Math.round(dv*10)/10;
    hit('stf',rnd(1.5,3),0); hit("ctl",rnd(3,6),0); fx.need=360;
    const fail=.08+Math.max(0,p.age-30)*.03; if(R()<fail*hosp){ hit('stf',rnd(4,8),1); hit('ctl',rnd(1,3),1); fx.fail=true; }
  } else if(I.fx){ const long=days>=365; let pf=(I.perm||0)+(long?rnd(.15,.35):0); pf=clamp(pf*hosp,0,1);
    for(const s in I.fx){ if(p.isP!==(s==='stf'||s==='ctl'||s==='sta'))continue; hit(s,rnd(I.fx[s][0],I.fx[s][1]),pf); }
    if(p.isP&&I.fx.stf&&(I.part==='어깨')&&pf>0){ fx.v=-Math.round(sum(Object.values(fx.P))*17/60*10)/10; } }
  roundR(p);
  for(const s in fx.P)if(fx.P[s]>0)p.pot=Math.max(ovr(p),p.pot-fx.P[s]*.5);
  const has=Object.values(fx.L).some(x=>x>.05);
  if(has||fx.v||fx.fail){ (p.injFx=p.injFx||[]).push(fx); if(!has)fx.need=0; }
  return fx; }
/* 실전량만큼 손실을 되찾는다 */
function injRecover(p,u){ if(!p.injFx||!p.injFx.length||!(u>0))return; for(const fx of p.injFx){ if(!fx.need||fx.got>=fx.need)continue;
    fx.got+=Math.min(u,fx.need-fx.got);
    /* 누적 회복 목표와 이미 반영한 양의 차이만 0.1 단위로 반영한다(경기당 증분이 작아도 반올림에 사라지지 않고, 넘치지도 않는다) */
    fx.ap=fx.ap||{}; for(const s in fx.L){ const tgt=fx.L[s]*Math.min(1,fx.got/fx.need), d=Math.round((tgt-(fx.ap[s]||0))*10)/10; if(d){ p.r[s]=clamp(p.r[s]+d,20,80); fx.ap[s]=(fx.ap[s]||0)+d; } }
    if(fx.got>=fx.need){ fx.done=G.year; if(p.team===G.user&&Object.values(fx.L).some(x=>x>.3))note('회복',`${p.name}이(가) ${fx.n} 후유증을 털어냈습니다.${Object.values(fx.P).some(x=>x>.3)?' 다만 일부는 돌아오지 않았습니다.':''}`,p.id); } }
  roundR(p); p.injFx=p.injFx.filter(fx=>!(fx.done&&fx.done<G.year-1)); }
function injFxNow(p){ return (p.injFx||[]).filter(fx=>fx.need&&fx.got<fx.need); }
/* 화면용 후유증 설명 */
function injFxText(p){ const out=[]; const fx0=p.injOut>0&&p.injFx&&p.injFx.length?p.injFx[p.injFx.length-1]:null;
  for(const fx of (p.injFx||[])){ const a=[];
    if(fx===fx0&&p.injK&&fx.k===p.injK){ const I=INJ[fx.k]; out.push({n:fx.n,y:fx.y,t:`재활 중입니다. 복귀 뒤에는 ${Object.keys(fx.L).filter(s=>fx.L[s]>.3).map(s=>INJ_STAT[s]).join('·')||'몸 상태'}이(가) 떨어진 채 시작해 실전을 뛰며 되찾습니다.${I.tj?' 구속이 어떻게 변할지는 복귀해 봐야 압니다.':''}${I.perm||I.d[0]>=240?' 일부는 돌아오지 않을 수 있습니다.':''}`,open:true}); continue; }
    const open=fx.need&&fx.got<fx.need; if(open){ const ls=Object.entries(fx.L).filter(x=>x[1]>.3).map(x=>`${INJ_STAT[x[0]]||x[0]} -${Math.round(dv(50)-dv(50-x[1]))||1}`); if(ls.length)a.push(`${ls.join(', ')} 회복 중 ${Math.round(fx.got/fx.need*100)}%`); }
    if(fx.v)a.push(`구속 ${fx.v>0?'+':''}${fx.v}km/h`);
    const pm=Object.entries(fx.P).filter(x=>x[1]>.3).map(x=>`${INJ_STAT[x[0]]||x[0]} -${Math.round(dv(50)-dv(50-x[1]))||1}`); if(pm.length)a.push(`영구 손실 ${pm.join(', ')}`);
    if(fx.fail)a.push('예전 구위를 되찾지 못함');
    if(a.length&&(open||fx.y>=G.year-1))out.push({n:fx.n,y:fx.y,t:a.join(' · '),open}); }
  return out; }
/* 예상 복귀일 */
function injRet(p){ return p.injOut>0?G.day+p.injOut:null; }
function injRetTxt(p){ const d=injRet(p); if(d==null)return ''; const o=dobj(d); return o.y!==G.year?`${o.y}년 ${o.m}월 ${o.d}일`:dmd(d); }
function injNow(p){ return p.injOut>0?(p.injK?injName(p.injK):'부상'):''; }
/* 매일: 재발 위험 기간 감소, 시즌 중 1군에 없는 회복 중 선수는 2군 실전으로 조금씩 되찾는다 */
function injDaily(){ const inSea=period()==='season';
  for(const p of Object.values(G.players)){ if(p.reInj&&p.injOut<=0){ p.reInj.left--; if(p.reInj.left<=0)delete p.reInj; }
  } void inSea; } /* 퓨처스 실전 회복은 futBat·futPit에서 실제 타석·아웃카운트로 처리한다 */
