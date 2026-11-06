/* 투구 동작은 선수 고정 속성이다. 기존 저장은 식별자 기반으로 복원하며 경기 난수를 소비하지 않는다. */
const DELIVERY_LABEL={overhand:'오버핸드',three_quarter:'스리쿼터',sidearm:'사이드암',submarine:'언더핸드'};
function pitchDelivery(p){if(p&&DELIVERY_LABEL[p.delivery])return p.delivery;const n=seededRand('delivery:'+(p?.id||0))();return n<.055?'submarine':n<.19?'sidearm':n<.52?'three_quarter':'overhand';}
/* ===== 세부 능력: 화면에 보이는 세부 능력과 경기 시뮬레이션이 같은 값을 쓴다 =====
   선수 상세의 세부 능력(좌·우 상대, 삼진 회피, 갭 파워, 도루, 주루 센스, 수비 범위, 포구, 송구, 병살·중계, 도루 저지,
   무브먼트, 구종, 견제, 땅볼·뜬공 성향)은 모두 같은 고정 성향 값(trt)에서 나오고, 1군·퓨처스 경기 결과에 똑같이 반영된다 */
const trt=(p,k,s)=>hn('dt'+k,p.id)*(s||4);
const PITCHES=['슬라이더','커브','체인지업','포크','커터','투심','스위퍼'];
function gbT(p){ return clamp(hn('gb',p.id),-1.6,1.6); } /* +면 땅볼형 */
/* 삼진 회피(세부 능력): 경기 계산의 삼진 확률과 같은 비중(컨택 .8·선구 .2)과 삼진 성향 */
function kAvoidV(p){ return p.r.con*.8+p.r.eye*.2+trt(p,'k'); }
/* 구종: 상세 화면과 같은 규칙으로 고른다 */
/* 구종: 선수마다 보유 구종(직구 + 변화구 3~4개)과 완성도는 고정이고, 보직은 '쓰는 구종'만 정한다.
   선발은 보유 구종을 모두 쓰고, 계투는 주로 쓰는 1~2개만 던진다(나머지는 보유로 남아 선발로 돌아가면 다시 쓴다). 쓰는 구종 수가 경기 계산(타순 세 바퀴째)에 들어간다 */
function pitchOwnK(p){ const id=p.id; return [...PITCHES].sort((a,b)=>hn('pt'+a,id)-hn('pt'+b,id)).slice(0,3+(u01('np',id)>.5?1:0)); }
function pitchUseN(p){ return isSPr(p)?99:1+(u01('np',p.id)>.4?1:0); }
function arsenalAll(p,stfV){ const velo=veloSim(p); const own=pitchOwnK(p); const add=(p.addP||[]).filter(x=>!own.includes(x.k)).map(x=>[x.k,stfV+x.q]); return [['직구',stfV+(velo-145)*.8+trt(p,'fb',3)],...own.map(k=>[k,stfV+trt(p,'p'+k,6)]),...add]; } /* 보유 구종 전체 */
function arsenal(p,stfV){ const id=p.id; const velo=veloSim(p); const n=pitchUseN(p);
  const pool=pitchOwnK(p).slice(0,n);
  const add=(p.addP||[]).filter(x=>!pool.includes(x.k)).map(x=>[x.k,stfV+x.q]); /* 캠프에서 새로 익힌 구종 */
  return [['직구',stfV+(velo-145)*.8+trt(p,'fb',3)],...pool.map(k=>[k,stfV+trt(p,'p'+k,6)]),...add]; }
const _ak=new Map();
function arsenalK(p){ const key=p.r.stf+':'+isSPr(p)+':'+(p.velo||0)+':'+JSON.stringify(p.addP||[]); const c=_ak.get(p.id); if(c&&c.k===key)return c.v;
  const best=Math.max(...arsenal(p,p.r.stf).map(x=>x[1])); const v=clamp((best-p.r.stf-4)*.0016,-.012,.025); _ak.set(p.id,{k:key,v}); return v; }
/* 구종 수: 타순이 세 바퀴째(타자 18명 상대 뒤)부터 타자가 공에 익숙해진다. 구종이 많을수록 덜하다(2구종 능력 -1.6 → 6구종 -0.4, 네 바퀴째는 2배) */
const _pn=new Map();
function pitchN(p){ const k=(p.addP||[]).length+':'+isSPr(p); /* 구종 수는 isSPr(선발형) 기준이라 캐시 키도 같게(검수 11-07) */ const c=_pn.get(p.id); if(c&&c.k===k)return c.v; const v=arsenal(p,p.r.stf).length; _pn.set(p.id,{k,v}); return v; }
function ttoPen(p,bf){ if(!(bf>=18))return 0; return (bf>=27?2:1)*clamp(1.6-.3*(pitchN(p)-2),.4,1.6); }
/* 좌우 상대: 타자 쪽 절반, 투수 쪽 절반을 반영해 같은 손 대결이 불리해진다 */
function platB(b,p){ const vsL=p.th==='좌'; const L=b.bt==='좌'?-4:b.bt==='양'?0:2, Rr=b.bt==='좌'?2:b.bt==='양'?0:-1; return vsL?L+trt(b,'vl',3):Rr+trt(b,'vr',3); }
function platP(p,b){ const side=b.bt==='양'?(p.th==='좌'?'우':'좌'):b.bt; const Lp=p.th==='좌'?3:-2; return side==='좌'?Lp+trt(p,'vl',3):-Lp/2+trt(p,'vr',3); }
/* 수비 쪽 세부 값 */
const holdOf=p=>50+trt(p,'hold',8);
function catArm(c){ return c?c.r.def+trt(c,'cat'):50; }
const OF0=50, CA0=55, IF0=52;
/* ===== 멘탈·기복·포수 리드 (2026-11-02) — 모두 리그 평균이 0이라 리그 전체 성적은 그대로 두고 선수 사이 차이만 만든다 =====
   멘탈(승부처 집중): 득점권·경기 후반 접전·포스트시즌에서만 능력에 더해진다. 해결사 타자·위기에 강한 투수. 프로의식이 높고 기질이 안정될수록 조금 높다.
   기복(일관성): 경기마다의 컨디션 흔들림과 몇 주 단위 슬럼프·상승세의 폭. 프로의식이 높을수록 기복이 적다.
   포수 리드: 포수 수비·리드 감각·블로킹이 투수 전원의 안정감(투구 결과)에 더해진다. 같은 투수와 많이 호흡을 맞출수록 조금 더 좋아진다(배터리 호흡) */
const persV=(p,k)=>p.pers&&p.pers[k]!=null?p.pers[k]:12;
function mentalOf(p){ return clamp(hn('dtmen',p.id)*.8+(persV(p,'pro')-12)/8*.35-(persV(p,'temp')-12)/8*.25,-2.2,2.2); }
function consOf(p){ return clamp(hn('dtcons',p.id)*.7+(persV(p,'pro')-12)/8*.6,-2,2); }
const volF=p=>clamp(1-.22*consOf(p),.55,1.5);
const mentalRt=p=>Math.round(clamp(50+mentalOf(p)*12,20,85)), consRt=p=>Math.round(clamp(50+consOf(p)*12,20,85)); /* 화면용 0~100 */
function catLead(c){ return c?c.r.def*.55+(50+trt(c,'lead',7))*.3+(50+trt(c,'cat',6))*.15+Math.min(4,Math.max(0,(c.age||25)-24)*.4):50; } /* 수비 55% · 리드 감각 30% · 블로킹 15% · 경험(나이) */
const CL0=60; /* 주전 포수 평균 리드(리그 평균 성적을 그대로 두는 기준점, 측정 59.6) */
function chemOf(p,cid){ if(!p||cid==null||!p.chem)return 0; const n=p.chem[cid]||0; if(!n)return 0; return (Math.min(1,n/40)-.5)*1.2; } /* 배터리 호흡: 같이 몇 경기 안 맞췄으면 -0.6 쪽, 40경기 넘게 맞추면 +0.6(처음 만나는 짝은 0). 한 시즌 평균은 0 안팎 */
let CLUTCH=0, SIMDAY=null; /* 지금 타석의 승부처 정도(0~1.1), 지금 시뮬 중인 경기 날짜 */
function sideTraits(fs){ let c=null, of=[], inf=[]; for(const q of fs.order){ const k=fs.posOf[q.id]; if(k==='C')c=q; else if(k==='LF'||k==='CF'||k==='RF')of.push(defAt(q,k)+(k==='RF'?3:0)+trt(q,'arm')); else if(k==='SS'||k==='2B')inf.push(defAt(q,k)+trt(q,'dp')); }
  fs.cArm=catArm(c); fs.cLead=catLead(c); fs.cId=c?c.id:null; fs.ofArm=of.length?sum(of)/of.length:OF0; fs.ifD=inf.length?sum(inf)/inf.length:IF0; }
function stealTry(fs){ return clamp(1-((fs.cArm??CA0)-CA0)*.012,.6,1.4); }
function stealAdj(r,fs){ return trt(r,'sb')*.004-((fs.cArm??CA0)-CA0)*.006-(holdOf(fs.cur)-50)*.003; }
function runAdj(r,fs){ return trt(r,'br')*.004-((fs.ofArm??OF0)-OF0)*.005; }
function dpF(b,p,fs){ return clamp(1+(50-b.r.spd)*.012+gbT(p)*.18+((fs.ifD??IF0)-IF0)*.008,.35,2); }
/* 수비 범위·포구까지 넣은 개인 수비 값 */
function fieldV(p,pos){ return defAt(p,pos)+(trt(p,'rng')+trt(p,'fld'))*.5; }
/* ===== 퓨처스(2군) 주간 경기: 같은 확률식에 부상·투구 부하·후유증 회복까지 적용 ===== */
function futBoost(p){ try{ return boostOf(p)*.6; }catch(e){ return 0; } }
function futBat(p,t,pos,games){ games=games||3; const pa=games>=3?ri(9,14):ri(3,6); const o=simBat(p,pa,7+futBoost(p)); const h=lineFor(p,G.year,t,'퓨처스'); addTo(h,Object.assign({g:games},o)); futUse(p,pos||null,games); /* 지명타자 출장도 포지션별로 센다(검수 11-06) */ { const u=p.fuse; const top=Object.entries(u.pos).sort((a,b)=>b[1]-a[1])[0]; h.pos=top?top[0]:(pos||p.pos); }
  if(p.injFx)injRecover(p,pa);
  if(R()<1-Math.pow(1-p.inj*.026*injMult(p),games))injure(p,G.day,{farm:1}); }
function futPit(p,t){ const sp=isSPr(p); const outs=sp?ri(12,18):ri(4,8); const o=simPit(p,outs,7+futBoost(p)); o.g=sp?1:2; o.gs=sp?1:0; addTo(lineFor(p,G.year,t,'퓨처스'),o);
  /* 투구 수 = 상대 타자 수 × 타석당 3.9구(KBO 평균 수준). 예전 식(아웃당 5.4구 + 출루당 4구)은 출루를 두 번 세어 퓨처스 선발이 130~200구를 던진 것으로 잡혔다 */
  const pc=Math.min(sp?110:45,Math.round((outs+(o.h||0)+(o.bb||0)+(o.hbp||0))*3.9)); if(p.injFx)injRecover(p,outs);
  const had=d=>(p.ld||[]).some(x=>x[0]===d); /* 그날 이미(1군 등) 던졌으면 퓨처스 등판을 겹쳐 넣지 않는다(검수 11-07) */
  if(sp){ if(had(G.day))return; const cd=pitchApp(p,G.day,pc,true); p.fat=clamp((p.fat||0)+pitFatGain(p,pc,true),0,100); if(R()<p.inj*.075*pc/95*injMult(p)*loadMult(p,cd,G.day)/LOAD_NORM)injure(p,G.day,{sp:true,pc,farm:1}); }
  else for(const [d,q] of ((p.downDay!=null&&p.downDay>G.day-2)?[[G.day,pc]]:[[G.day-2,Math.round(pc/2)],[G.day,pc-Math.round(pc/2)]])){ /* 이틀 전에 아직 1군이었으면 그날 퓨처스 등판은 넣지 않는다 */ if(had(d))continue; const cd=pitchApp(p,d,q,false); p.fat=clamp((p.fat||0)+pitFatGain(p,q,false)*(d===G.day?1:.5),0,100); /* 이틀 전 등판 피로도 절반 남는다(검수 11-07) */ if(!(p.injOut>0)&&R()<p.inj*.026*q/17*injMult(p)*loadMult(p,cd,d)/LOAD_NORM){ injure(p,G.day,{pc:q,farm:1}); break; } } }
const arsenal_=arsenal;

/* 화면과 경기가 공유하는 구종 자료. 추정 구위로 볼 때는 원본 선수를 변경하지 않는다. */
function pitchProfile(p,stf){
  if(!p||!p.isP)return null; const v={...p,r:{...p.r,stf:stf??p.r.stf}}, a=arsenal(v,v.r.stf), used=new Map(a);
  const all=arsenalAll(v,v.r.stf), best=Math.max(...a.map(x=>x[1]));
  return {velo:veloOf(v),max:veloMax(v),activeCount:a.length,third:clamp(1.6-.3*(a.length-2),.4,1.6),bonus:clamp((best-v.r.stf-4)*.0016,-.012,.025),
    pitches:all.map(([name,value])=>({name,value:used.has(name)?used.get(name):value,active:used.has(name)})),tendency:gbT(v)};
}
/* 저장된 현재 상태만 읽는다. depth()를 호출해 보직을 새로 배정하지 않는다. */
function playerState(p){
  const labels=[]; if(p.joinY>G.year)labels.push(p.joinY+'시즌 합류 예정'); if(p.injOut>0)labels.push('부상 · 복귀까지 '+p.injOut+'일');
  if(milServing(p))labels.push('군 복무 중'); else if(isAway(p))labels.push('국가대표 차출 중'); if(p.susp>G.day)labels.push('출장정지 · '+(p.susp-G.day)+'일 남음'); if(p.hold)labels.push('연봉 미계약 · 계약 전까지 훈련·경기 불가'); if(p.frehab)labels.push('재활 선수 명단');
  const blocked=labels.length>0; labels.push(p.team==null?'미소속':p.e1?'1군 등록':p.ys?'육성선수':entryOn()?'1군 미등록':'등록 준비');
  if(p.isP)labels.push(p.role?(p.role==='SP'?'현재 선발':'현재 계투'):(isSPr(p)?'선발 자원 · 보직 미배정':'계투 자원 · 보직 미배정'));
  const rest=p.lastApp==null?null:Math.max(0,G.day-p.lastApp);
  return {labels,blocked,rest,lastPc:p.lastPc??null,fat:p.fat||0,morale:p.mor??null,arm:p.isP?armRatio(p):null};
}
