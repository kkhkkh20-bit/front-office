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
/* 부상 결정은 선수뿐 아니라 진단 기록에 묶는다. 옛 저장의 ID도 난수 없이 한 번만 복원한다. */
function injRecords(p){ const H=p.injHist=p.injHist||[]; H.forEach((h,i)=>{ if(!h.id)h.id='inj:'+p.id+':'+(h.d??h.y)+':'+i; }); return H; }
function injEpisode(p){ const H=injRecords(p),last=H[H.length-1],active=H.find(h=>h.id===p.injId);if(active&&last!==active&&last.ret==null&&last.bk==null&&p.injOut>0){p.injId=last.id;delete p.injB;return last;}return active||last||null; }
function injSetRemaining(p,n){ const h=injEpisode(p);if(h)h.ret=G.day+n;let best=h;for(const q of injRecords(p))if(q.bk==null&&q.ret>G.day&&(!best||q.ret>best.ret))best=q;if(best){p.injOut=Math.max(0,best.ret-G.day);p.injId=best.id;if(best.k)p.injK=best.k;else delete p.injK;}else p.injOut=n; }
function injToken(p){ const H=injRecords(p); return H.length?H[H.length-1].id:null; }
function injGameRisk(p,day){ const o=p.fPlayInj;if(!o)return false;delete p.fPlayInj;return day<=o.until&&o.injId===injToken(p)&&!(p.injOut>0); }
function injMatches(p,d){ const H=injRecords(p); return d.injId!=null?injToken(p)===d.injId:(d.n!=null?H.length===d.n:!H.some(h=>h.d!=null&&h.d>d.day)&&H.filter(h=>h.d===d.day).length<=1); }
function injStart(p,o){ const day=o.day??G.day, days=Math.max(1,o.days), H=injRecords(p), old=injEpisode(p), left=p.injOut||0, n=Math.max(0,days-(G.day-day));
  if(old&&left>0)old.ret=G.day+left;
  const h={y:dobj(day).y,days,d:day,k:o.k??null,t:o.t??p.team,...(o.extra||{}),hosp:o.hosp??'none',ret:day+days}; h.id='inj:'+p.id+':'+day+':'+H.length;
  h.hospB={n:n/hospF(h.hosp,{injK:h.k}),h:h.hosp,o:n,d:G.day,c:milServing(p)?null:p.team,id:h.id,changed:false};
  /* 겹친 작은 부상은 확정된 긴 재활을 줄이지 않는다. 기록은 남겨 결장일 합집합에 포함한다. */
  if(n>=left||!left){ p.injOut=n; if(o.k)p.injK=o.k;else delete p.injK;p.injId=h.id;p.injB=h.hospB;p.injC=milServing(p)?null:p.team; }
  H.push(h); delete p.rush;delete p.rushRet;delete p.rushId;delete p.reInj;p.injTick=G.day; return h;
}
/* 하루 처리는 중복 호출해도 같은 부상을 두 번 회복시키지 않는다. */
function injRecoveryTick(p){ if(!(p.injOut>0)||p.injTick===G.day)return false;p.injTick=G.day;const active=injEpisode(p);if(active)active.ret=G.day+p.injOut-1;p.injOut--;if(p.injOut!==0)return false;
  for(const h of injRecords(p))if(h.bk==null&&h.ret!=null)h.bk=Math.min(G.day,h.ret);const h=injEpisode(p);if(h&&h.bk==null)h.bk=G.day;if(p.rushRet&&(!p.rushId||p.rushId===injToken(p))){p.rush=G.day+30;delete p.rushRet;}else if(p.rushRet){delete p.rushRet;delete p.rush;}return true;
}
function injSync(p){ const token=injToken(p), active=injEpisode(p), ret=injRetTxt(p);for(const e of (G.evs||[])){ if(e.k!=='inj'||e.data.pid!==p.id||!injMatches(p,e.data))continue;const prev=e.sit;e.sit=e.sit.replace(/부상으로 약 \d+일/,`부상으로 약 ${p.injOut}일`).replace(/ 예상 복귀 [^.]+\./,'')+` 예상 복귀 ${ret}.`;const m=(G.mail||[]).find(m=>m.id===e.mid);if(m)m.body=m.body.replace(prev,e.sit); }
  const open=new Set(injRecords(p).filter(h=>h.ret>G.day&&h.bk==null).map(h=>h.id));for(const m of (G.mail||[]))if(m.injId===token||active&&m.injId===active.id||open.has(m.injId))m.body=m.body.replace(/예상 복귀 [^.]+\./,`예상 복귀 ${ret}.`);
}
/* 열린 겹부상도 각 진단의 병원 기준으로 바꾼 뒤 가장 늦은 복귀일을 지킨다. */
function injHospital(p,k,o,acquire,tid=p.team){ const active=injEpisode(p), records=injRecords(p);if(active){active.ret=G.day+p.injOut;if(p.injB&&(!p.injB.id||p.injB.id===active.id))active.hospB=p.injB;}const open=records.filter(h=>h.ret>G.day&&h.bk==null);let best=null;
  for(const h of open){const q={injK:h.k??(h===active?p.injK:null)},left=h.ret-G.day,b=h.hospB,own=(b?b.c:p.injC!==undefined?p.injC:h.t??G.user)===p.team;let base=left;if(left<14&&!(b&&(b.changed||b.id==null)&&b.h===o)){if(!best||h.ret>best.ret)best=h;continue;}
    if(!acquire&&own){if(b&&b.h===o&&left===b.o-(G.day-b.d))base=Math.max(0,b.n-(G.day-b.d)/hospF(o,q));else base=left/hospF(h.hosp??(h.ovs||h.train||(!h.k&&!p.injK)?'none':o),q);}
    const n=Math.max(1,Math.round(base*hospF(k,q)));h.ret=G.day+n;h.hosp=k;h.hospB={n:base,h:k,o:n,d:G.day,c:tid,id:h.id,changed:1};if(!best||h.ret>best.ret)best=h;
  }
  if(best){p.injOut=best.ret-G.day;p.injId=best.id;if(best.k)p.injK=best.k;else delete p.injK;p.injB=best.hospB;p.injC=tid;}return !!best;
}
/* 어떤 부상인지 고른다. 선발은 팔, 타자는 하체·손 부상이 많고, 포수는 무릎·머리, 많이 던진 날은 팔 부상 비중이 커진다 */
function injPick(p,ctx){ ctx=ctx||{}; const col=!p.isP?2:ctx.sp?0:1;
  const re=p.reInj&&p.reInj.left>0?p.reInj:null;
  if(re&&R()<.6){ const b=INJ[re.k], k=b&&b.up&&R()<.5?b.up:re.k; if(k!=='contus'||ctx.hbp!==0)return k; } /* 같은 부위 재발, 절반은 한 단계 더 심하게. 사구 없는 날의 타박상은 재발 후보에서도 제외한다. */
  const L=[]; for(const k in INJ){ const I=INJ[k]; let w=I.w[col]; if(!w||k==='contus'&&ctx.hbp===0)continue; /* 사구가 없는 경기에서는 사구 타박상도 없다(검수 11-18 #443). */
    if(p.pos==='C'&&(k==='knee'||k==='concus'))w*=2.2;
    if(p.isP&&(I.part==='팔꿈치'||I.part==='어깨')&&ctx.pc>100)w*=1+(ctx.pc-100)/40;
    if(p.isP&&(I.part==='팔꿈치'||I.part==='어깨')&&ctx.load>1)w*=ctx.load*(I.d[0]>=56?1.4:1); /* 혹사당한 팔은 큰 부상으로 이어진다 */
    if(p.isP&&I.tj&&p.ucl)w*=4; /* 인대를 한 번 다친 투수는 수술로 이어지기 쉽다 */
    if(p.age>=33&&(k==='calf'||k==='achil'||k==='plantar'||k==='back'))w*=1.5;
    L.push([k,w]); }
  let s=sum(L.map(x=>x[1])), r=R()*s; for(const [k,w] of L){ r-=w; if(r<=0)return k; } return L[0][0]; }
/* 능력 손실을 실제로 적용하고, 되찾을 수 있는 몫을 기록한다 */
function injApply(p,k,days){ const I=INJ[k]; const hosp=p.team!=null&&!milServing(p)?( /* 상무 복무 중에는 원소속 병원 몫 없음(검수 11-09zy) */{a:.6,b:.8,c:.9}[medOf(p.team).hosp]||1):1; /* 모든 구단: 그 구단 제휴 병원 */
  const fx={k,n:I.n,y:G.year,L:{},P:{},need:I.need||0,got:0,v:0,...(p.isP?{preVel:veloOf(p)}:{})};
  const hit=(s,a,permF)=>{ if(p.r[s]==null||a<=0)return; const b=p.r[s]; p.r[s]=clamp(b-a,20,80); const real=b-p.r[s]; const pm=real*permF; fx.L[s]=(fx.L[s]||0)+real-pm; fx.P[s]=(fx.P[s]||0)+pm; };
  if(I.tj){ /* 토미존: 구속은 새 기준선이 되고, 제구·구위는 복귀 첫해에 실전을 던지며 되찾는다 */
    const young=p.age<=28, gain=R()<(young?.46:.3); const dv=gain?rnd(.4,2):-rnd(.4,2.8); /* km/h */
    p.velo+=dv*.5; const ds=dv*.5/VELO_K; p.r.stf=clamp(p.r.stf+ds,20,80); fx.v=Math.round(dv*10)/10;
    hit('stf',rnd(1.5,3),0); hit("ctl",rnd(3,6),0); fx.need=360;
    const fail=.08+Math.max(0,p.age-30)*.03; if(R()<fail*hosp){ hit('stf',rnd(4,8),1); hit('ctl',rnd(1,3),1); fx.fail=true; }
  } else if(I.fx){ const long=days>=365; let pf=(I.perm||0)+(long?rnd(.15,.35):0); pf=clamp(pf*hosp,0,1);
    for(const s in I.fx){ if(p.isP!==(s==='stf'||s==='ctl'||s==='sta'))continue; hit(s,rnd(I.fx[s][0],I.fx[s][1]),pf); }
  }
  roundR(p);
  if(p.isP){ fx.returnVel=veloOf(p); fx.v=fx.returnVel-fx.preVel; fx.finalVel=veloOf({...p,r:{...p.r,stf:Math.round(clamp(p.r.stf+(fx.L.stf||0),20,80)*10)/10}}); } /* 구속은 제구 손실을 섞지 않고 프로필과 같은 실제 식으로 잰다. 복귀 첫 측정과 실전 회복 뒤 예상치를 구분한다(검수 11-18 #444~445). */
  for(const s in fx.P)if(fx.P[s]>0)p.pot=Math.max(ovr(p),p.pot-fx.P[s]*.5);
  const has=Object.values(fx.L).some(x=>x>.05), perm=Object.values(fx.P).some(x=>x>.05);
  if(has||perm||fx.v||fx.fail){ /* 되찾을 수 없는 손실만 있어도 기록(검수 11-07) */ (p.injFx=p.injFx||[]).push(fx); if(!has)fx.need=0; }
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
function injFxText(p){ const out=[], h=injEpisode(p), F=p.injFx||[]; const fx0=p.injOut>0?(F.find(fx=>h&&fx.injId===h.id)||[...F].reverse().find(fx=>fx.k===p.injK)):null;
  for(const fx of (p.injFx||[])){ const a=[];
    if(fx===fx0&&p.injK&&fx.k===p.injK){ const I=INJ[fx.k]; out.push({n:fx.n,y:fx.y,t:`재활 중입니다. 복귀 뒤에는 ${Object.keys(fx.L).filter(s=>fx.L[s]>.3).map(s=>INJ_STAT[s]).join('·')||'몸 상태'}이(가) 떨어진 채 시작해 실전을 뛰며 되찾습니다.${I.tj?' 구속이 어떻게 변할지는 복귀해 봐야 압니다.':''}${I.perm||I.d[0]>=240?' 일부는 돌아오지 않을 수 있습니다.':''}`,open:true}); continue; }
    const open=fx.need&&fx.got<fx.need; if(open){ const ls=Object.entries(fx.L).filter(x=>x[1]>.3).map(x=>`${INJ_STAT[x[0]]||x[0]} -${Math.round(dv(50)-dv(50-x[1]))||1}`); if(ls.length)a.push(`${ls.join(', ')} 회복 중 ${Math.round(fx.got/fx.need*100)}%`); }
    if(Number.isFinite(fx.preVel)){ const v=fx.returnVel??fx.preVel+fx.v; a.push(`수술·부상 전 ${fx.preVel} → 복귀 시 ${v}km/h${open&&Number.isFinite(fx.finalVel)?` · 실전 회복 후 예상 ${fx.finalVel}km/h`:''}`); }
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
  for(const p of Object.values(G.players)){ if(p.reInj&&p.injOut<=0&&p.reInj.d!==G.day&&p.reInj.tick!==G.day){ p.reInj.tick=G.day;p.reInj.left--; /* 복귀한 날과 같은 날 중복 호출은 빼지 않는다 */ if(p.reInj.left<=0)delete p.reInj; }
  } void inSea; } /* 퓨처스 실전 회복은 futBat·futPit에서 실제 타석·아웃카운트로 처리한다 */
