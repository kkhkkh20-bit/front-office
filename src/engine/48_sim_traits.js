/* ===== 세부 능력: 화면에 보이는 세부 능력과 경기 시뮬레이션이 같은 값을 쓴다 =====
   선수 상세의 세부 능력(좌·우 상대, 삼진 회피, 갭 파워, 도루, 주루 센스, 수비 범위, 포구, 송구, 병살·중계, 도루 저지,
   무브먼트, 구종, 견제, 땅볼·뜬공 성향)은 모두 같은 고정 성향 값(trt)에서 나오고, 1군·퓨처스 경기 결과에 똑같이 반영된다 */
const trt=(p,k,s)=>hn('dt'+k,p.id)*(s||4);
const PITCHES=['슬라이더','커브','체인지업','포크','커터','투심','스위퍼'];
function gbT(p){ return clamp(hn('gb',p.id),-1.6,1.6); } /* +면 땅볼형 */
/* 구종: 상세 화면과 같은 규칙으로 고른다 */
function arsenal(p,stfV){ const id=p.id; const velo=veloSim(p); const sp=isSPr(p); const n=sp?3+(u01('np',id)>.5?1:0):1+(u01('np',id)>.4?1:0);
  const pool=[...PITCHES].sort((a,b)=>hn('pt'+a,id)-hn('pt'+b,id)).slice(0,n);
  const add=(p.addP||[]).filter(x=>!pool.includes(x.k)).map(x=>[x.k,stfV+x.q]); /* 캠프에서 새로 익힌 구종 */
  return [['직구',stfV+(velo-145)*.8+trt(p,'fb',3)],...pool.map(k=>[k,stfV+trt(p,'p'+k,6)]),...add]; }
const _ak=new Map();
function arsenalK(p){ const key=p.r.stf+':'+(p.role||'')+':'+(p.velo||0)+':'+((p.addP||[]).length); const c=_ak.get(p.id); if(c&&c.k===key)return c.v;
  const best=Math.max(...arsenal(p,p.r.stf).map(x=>x[1])); const v=clamp((best-p.r.stf-4)*.0016,-.012,.025); _ak.set(p.id,{k:key,v}); return v; }
/* 좌우 상대: 타자 쪽 절반, 투수 쪽 절반을 반영해 같은 손 대결이 불리해진다 */
function platB(b,p){ const vsL=p.th==='좌'; const L=b.bt==='좌'?-4:b.bt==='양'?0:2, Rr=b.bt==='좌'?2:b.bt==='양'?0:-1; return vsL?L+trt(b,'vl',3):Rr+trt(b,'vr',3); }
function platP(p,b){ const side=b.bt==='양'?(p.th==='좌'?'우':'좌'):b.bt; const Lp=p.th==='좌'?3:-2; return side==='좌'?Lp+trt(p,'vl',3):-Lp/2+trt(p,'vr',3); }
/* 수비 쪽 세부 값 */
const holdOf=p=>50+trt(p,'hold',8);
function catArm(c){ return c?c.r.def+trt(c,'cat'):50; }
const OF0=50, CA0=55, IF0=52;
function sideTraits(fs){ let c=null, of=[], inf=[]; for(const q of fs.order){ const k=fs.posOf[q.id]; if(k==='C')c=q; else if(k==='LF'||k==='CF'||k==='RF')of.push(defAt(q,k)+(k==='RF'?3:0)+trt(q,'arm')); else if(k==='SS'||k==='2B')inf.push(defAt(q,k)+trt(q,'dp')); }
  fs.cArm=catArm(c); fs.ofArm=of.length?sum(of)/of.length:OF0; fs.ifD=inf.length?sum(inf)/inf.length:IF0; }
function stealTry(fs){ return clamp(1-((fs.cArm??CA0)-CA0)*.012,.6,1.4); }
function stealAdj(r,fs){ return trt(r,'sb')*.004-((fs.cArm??CA0)-CA0)*.006-(holdOf(fs.cur)-50)*.003; }
function runAdj(r,fs){ return trt(r,'br')*.004-((fs.ofArm??OF0)-OF0)*.005; }
function dpF(b,p,fs){ return clamp(1+(50-b.r.spd)*.012+gbT(p)*.18+((fs.ifD??IF0)-IF0)*.008,.35,2); }
/* 수비 범위·포구까지 넣은 개인 수비 값 */
function fieldV(p,pos){ return defAt(p,pos)+(trt(p,'rng')+trt(p,'fld'))*.5; }
/* ===== 퓨처스(2군) 주간 경기: 같은 확률식에 부상·투구 부하·후유증 회복까지 적용 ===== */
function futBoost(p){ try{ return boostOf(p)*.6; }catch(e){ return 0; } }
function futBat(p,t,pos,games){ games=games||3; const pa=games>=3?ri(9,14):ri(3,6); const o=simBat(p,pa,7+futBoost(p)); const h=lineFor(p,G.year,t,'퓨처스'); addTo(h,Object.assign({g:games},o)); if(pos&&pos!=='DH')futUse(p,pos,games); else futUse(p,null,games); { const u=p.fuse; const top=Object.entries(u.pos).sort((a,b)=>b[1]-a[1])[0]; h.pos=top?top[0]:(pos||p.pos); }
  if(p.injFx)injRecover(p,pa);
  if(R()<1-Math.pow(1-p.inj*.026*injMult(p),games))injure(p,G.day,{farm:1}); }
function futPit(p,t){ const sp=isSPr(p); const outs=sp?ri(12,18):ri(4,8); const o=simPit(p,outs,7+futBoost(p)); o.g=sp?1:2; o.gs=sp?1:0; addTo(lineFor(p,G.year,t,'퓨처스'),o);
  /* 투구 수 = 상대 타자 수 × 타석당 3.9구(KBO 평균 수준). 예전 식(아웃당 5.4구 + 출루당 4구)은 출루를 두 번 세어 퓨처스 선발이 130~200구를 던진 것으로 잡혔다 */
  const pc=Math.min(sp?110:45,Math.round((outs+(o.h||0)+(o.bb||0)+(o.hbp||0))*3.9)); if(p.injFx)injRecover(p,outs);
  if(sp){ const cd=loadLog(p,G.day,pc,true); if(R()<p.inj*.075*pc/95*injMult(p)*loadMult(p,cd,G.day)/LOAD_NORM)injure(p,G.day,{sp:true,pc,farm:1}); }
  else for(const [d,q] of [[G.day-2,Math.round(pc/2)],[G.day,pc-Math.round(pc/2)]]){ const cd=loadLog(p,d,q,false); if(!(p.injOut>0)&&R()<p.inj*.026*q/17*injMult(p)*loadMult(p,cd,d)/LOAD_NORM){ injure(p,G.day,{pc:q,farm:1}); break; } } }
const arsenal_=arsenal;
