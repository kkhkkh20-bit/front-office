/* ===== 세부 수비 능력(2026-11-17): 수비 범위·송구(어깨)·포구 =====
   - 종합 수비(p.r.def)는 그대로 두고, 선수마다 세 가지 세부 능력의 '모양'(종합 대비 얼마나 높고 낮은지)을 따로 가진다.
     세부 능력 = 종합 수비 + 그 선수의 차이. 차이를 종합 무게(범위 .4 · 송구 .3 · 포구 .3)로 평균하면 항상 0이라
     세 세부 능력의 무게 평균이 곧 종합 수비다. 그래서 종합 능력(ovr)과 기존 성장·훈련·노화는 바뀌지 않는다.
   - 처음 값(p.dsb)은 선수 번호로 정해지는 고정 잡음 + 주 포지션의 전형(포수는 어깨, 1루는 포구, 중견은 범위)으로 정한다.
     주 난수(R)를 쓰지 않으므로 기존 저장도 불러올 때마다 같은 값이 나온다(만들 때 또는 처음 볼 때 한 번 저장).
   - 나이: 수비 범위는 종합 수비의 노화(성장 유형의 하락 나이 - 1)보다 먼저, 성장 유형 하락 나이 5년 전부터 떨어지고
     그만큼 송구·포구가 상대적으로 버틴다(종합은 그대로). 22세 이하는 범위가 앞서고 포구·송구가 조금 거칠다.
   - 경기: 수비 범위는 인플레이 타구 아웃(46b_bip), 포구는 실책(내야 땅볼은 송구 40%), 송구는 외야 주자 진루 억제·병살·포수 도루 저지.
     각 세부 능력은 '그 자리 보통 수준'(자리별 전형 + 리그 평균 나이 몫)과 비교하므로 리그 평균 기록은 그대로다.
   - 포지션 적합(defAt): 자리마다 중요한 세부 능력이 다르다(유격 범위·어깨, 1루 포구, 우익 어깨). AI의 주전 선택·선수 가치도 같은 값을 쓴다.
   DEF_SPLIT=0이면 경기와 포지션 적합이 예전 식(종합 수비 + 고정 성향)으로 돌아간다 */
let DEF_SPLIT=1;
const DSUB_K=['rng','arm','fld'];
const DSUB_W={rng:.4,arm:.3,fld:.3}; /* 종합 수비 = 세부 능력 무게 평균 */
const DSUB_L={rng:'수비 범위',arm:'송구(어깨)',fld:'포구'};
/* 자리별 전형(무게 평균 0): 같은 종합 수비라도 포수는 어깨, 1루는 포구, 중견은 범위가 앞선다 */
const DSUB_ARCH={C:{rng:-4,arm:4,fld:4/3},SS:{rng:1.5,arm:1,fld:-3},'2B':{rng:1,arm:-3,fld:5/3},'3B':{rng:-2,arm:3,fld:-1/3},'1B':{rng:-1.5,arm:-3,fld:5},LF:{rng:0,arm:-3,fld:3},CF:{rng:3,arm:-1,fld:-3},RF:{rng:-1,arm:4,fld:-8/3},DH:{rng:-1.5,arm:-1,fld:3}};
/* 자리별 세부 능력 중요도(포지션 적합): 경기에서 그 자리 타구·실책·송구가 차지하는 몫에 맞춘 무게 */
const DSUB_PW={SS:{rng:.45,arm:.3,fld:.25},'2B':{rng:.45,arm:.15,fld:.4},'3B':{rng:.3,arm:.35,fld:.35},'1B':{rng:.25,arm:.1,fld:.65},CF:{rng:.6,arm:.25,fld:.15},LF:{rng:.5,arm:.2,fld:.3},RF:{rng:.4,arm:.4,fld:.2},C:{rng:.1,arm:.55,fld:.35}};
/* 리그 주전의 나이 몫 평균(새 리그 측정): 경기의 '그 자리 보통 수준'에 더해 리그 평균 기록을 그대로 둔다 */
const DSUB_CAL={rng:-1.1,arm:.73,fld:.75}; /* 11-17 측정: 새 리그 4개 주전(실책 무게 가중, 평균 27.6세) */
const DSUB_SD=4;
const _dsbM=new WeakMap(); /* 리그 밖 선수 사본(대회·래더 덱 등)은 저장 객체를 바꾸지 않고 여기에만 둔다 */
function dsubBase(p){ if(!p||p.isP)return null; if(p.dsb&&p.dsb.rng!=null)return p.dsb; { const m=_dsbM.get(p); if(m)return m; }
  const A=DSUB_ARCH[p.pos]||DSUB_ARCH.DH; const h={}; for(const k of DSUB_K)h[k]=hn('dt'+k,p.id)*DSUB_SD; /* 예전 고정 성향(trt)과 같은 잡음: 범위가 좋던 선수는 그대로 범위가 좋다 */
  let m=0; for(const k of DSUB_K)m+=DSUB_W[k]*h[k]; const o={}; for(const k of DSUB_K)o[k]=Math.round((A[k]+h[k]-m)*10)/10;
  if(typeof G!=='undefined'&&G&&G.players&&G.players[p.id]===p)p.dsb=o; else _dsbM.set(p,o); return o; }
/* 나이 몫: 범위 하락은 성장 유형 하락 나이 5년 전부터(정상형 28세), 1년에 .8, 하락 나이 - 1부터 1.1. 그만큼 송구 40%·포구 60%가 버틴다 */
function dsubAge(p){ const a=p.age||27; const T=typeof DT!=='undefined'&&DT[p.dt]||{fall:33}; const s=T.fall-5;
  const r=a<=22?1.5:a<26?1.5*(26-a)/4:a<=s?0:-(Math.min(a,T.fall-1)-s)*.8-Math.max(0,a-(T.fall-1))*1.1;
  const C=-DSUB_W.rng*r, sa=r>0?.5:.4; return {rng:r,arm:sa*C/DSUB_W.arm,fld:(1-sa)*C/DSUB_W.fld}; }
/* 종합 수비 대비 차이(전형 + 고정 잡음 + 나이 몫) */
function dsubOf(p){ const b=dsubBase(p); if(!b)return {rng:0,arm:0,fld:0}; const g=dsubAge(p); return {rng:b.rng+g.rng,arm:b.arm+g.arm,fld:b.fld+g.fld}; }
/* 화면·평가용 세부 능력(내부 척도). def를 주면 그 값(스카우트 추정 등)을 종합 수비로 쓴다 */
function dsubVals(p,def){ const d=def??p.r.def, o=dsubOf(p); const v={}; for(const k of DSUB_K)v[k]=clamp(d+o[k],20,80); return v; }
/* 경기·적합용: 그 자리 보통 수준 대비 차이(그 자리 전형과 리그 나이 몫을 뺀 값) */
function dsubRel(p,pos,k){ const o=dsubOf(p); const A=DSUB_ARCH[pos]||DSUB_ARCH.DH; return o[k]-A[k]-DSUB_CAL[k]; }
/* 포지션 적합 보정: 그 자리 중요도로 본 세부 능력 평균 - 종합 수비. 자리 보통 선수는 0 */
function dsubFit(p,pos){ if(!DEF_SPLIT||!p||p.isP||pos==='DH')return 0; const W=DSUB_PW[pos]; if(!W)return 0; let s=0; for(const k of DSUB_K)s+=(W[k]-DSUB_W[k])*dsubRel(p,pos,k); return s; }
/* 불러온 저장: 세부 수비 모양을 한 번 정해 둔다(난수 없음) */
function dsubMigrate(){ if(!G||!G.players)return; for(const p of Object.values(G.players))if(!p.isP)dsubBase(p); }
