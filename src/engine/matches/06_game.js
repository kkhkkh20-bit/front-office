/* ===== 경기: 타석·주자·투수 교체 ===== */
const LGP={bb:.083,k:.198,hr:.024,babip:.312};
const comb=(pb,pp,pl)=>{ const x=pb*pp/pl, y=(1-pb)*(1-pp)/(1-pl); return x/(x+y); };
const bz=()=>({pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,hbp:0,so:0,r:0,rbi:0,sb:0,cs:0,e:0});
/* 실책을 범한 야수: 타구가 많이 가는 자리(유격수·3루·2루)일수록, 그 자리 수비력이 낮을수록 잦다 */
/* 병살: 1루 주자가 있는 땅볼 아웃 가운데 병살이 되는 기본 확률, 병살이 아닌 포스 땅볼에서 야수 선택(앞 주자 아웃·타자 1루)의 비율.
   11-15 수비 감사(세계 16개): 예전 .225로 팀당 시즌 병살 57개(KBO·MLB 실제 팀당 100~120개), 땅볼 아웃 때 1루 주자가 진루하지 않아 포스 진루가 빠져 있었다. 둘을 함께 고쳐 경기당 득점은 그대로 */
const DP_GB=.38, FC_GB=.3;
const ERRW={SS:1.5,'3B':1.2,'2B':1,'1B':.5,C:.5,LF:.35,CF:.35,RF:.35}, ERRN={SS:60,'2B':60,CF:63,C:56,'3B':52,'1B':49,LF:47,RF:46}; /* 실제 KBO 자리별 실책 비율에 맞춘 무게, 자리별 보통 수비력 */
/* 실책: 먼저 공이 어느 자리로 갔는지(자리별 실책 비율 무게) 고르고, 그 자리 수비수의 실력으로 실책 확률을 정한다. 수비가 약한 유격수는 실책이 크게 는다 */
function errLoc(fs){ const L=[]; let t=0; for(const p of fs.order){ const k=fs.posOf[p.id]; if(!k||!ERRW[k])continue; L.push([p,k,ERRW[k]]); t+=ERRW[k]; } if(!t)return null; let x=R()*t; for(const e of L){ x-=e[2]; if(x<=0)return e; } return L[L.length-1]; }
/* 자리별 실책 배수(타구 하나당): 강한 타구가 많은 3루가 가장 높고 1루가 가장 낮다(MLB 수비율 3루 .955 · 유격 .970 · 2루 .983 · 1루 .994).
   11-15 전에는 모든 자리가 같아 3루 실책이 시즌 5개로 2루(13개)의 절반도 안 됐다. 땅볼 기회 수로 가중한 평균이 1이라 리그 실책 수는 그대로 */
const EPOS={'3B':1.6,SS:1.15,'2B':.75,'1B':.6};
const errChance=(e,gb)=>.022*(e&&EPOS[e[1]]||1)*(e&&(ERRN[e[1]]||e[1]==='P')?clamp(1+((ERRN[e[1]]||DEF0)-errV(e[0],e[1],gb))/20,.4,2.2):1); /* 그 자리 보통 수비력(ERRN)보다 20 낮으면 실책 2배. 투수는 수비 능력치가 없어 기본 확률 */
const pz=()=>({outs:0,h:0,hr:0,bb:0,hbp:0,so:0,r:0,er:0,pc:0,bf:0,e:0});
/* 체력 배수: 체력 45를 1로, 높을수록 피로가 덜 쌓이고 부상 위험이 낮다(0.8~1.2) */
const staF=p=>clamp(1+(45-(p.r.sta||45))*.006,.8,1.2);
const staI=p=>clamp(1+(40-(p.r.sta||40))*.006,.8,1.2); /* 부상 배수: 리그 투수 평균 체력(약 40)을 1로 둬 전체 부상 빈도는 그대로 */
function pitFatGain(p,pc,isSP){ return (pc*(isSP?.55:.9)+(isSP?0:6))*staF(p); } /* 한 경기 등판 피로(원정 이동 피로는 따로 곱한다) */
function relAvail(p,day,ps){ const ae=mgrPush(p.team)+(ps?18:0); /* 가을야구: 연투·혹사를 더 감수한다 */ if(mcfPitchRest(p,day)||!healthy(p)||p.lastApp===day||(p.fat||0)>72+(ae-50)*.4+((p.r.sta||45)-45)*.4)return false; /* 체력이 좋은 불펜은 연투를 더 버틴다 */
  const cd=consecDays(p,day); /* 연투: 이틀은 보통, 3연투는 밀어붙이는 감독만, 4연투는 강행군 감독만 */
  if(cd>=1&&(p.lastPc||0)>25+(ae-50)*.4)return false; if(cd>=2&&(ae<55||(p.lastPc||0)>22))return false; if(cd>=3&&ae<72)return false; if(cd>=4)return false;
  if(ae<=38&&pc7(p,day)>60)return false;
  { let n7=0; for(const x of (p.ld||[]))if(x[0]>=day-7&&x[0]<day)n7++; if(n7>=4+(ae>=68?1:0))return false; } /* 지난 7일에 네 번 던졌으면 쉰다(강행군 감독·가을야구 총력전은 다섯 번). 11-15 투수 감사: 불펜 등판 1위가 해마다 81~92경기, 70경기 이상이 시즌마다 12명(KBO는 1위가 대개 70~80경기) */
  return true; }
/* 가을야구 총력전: 좋은 선발 셋으로 돌리고(4일 휴식이면 등판), 탈락 위기면 에이스가 3일만 쉬고도 나온다 */
function psStarter(tid,d,day,ps){ const rest=p=>p.lastStart==null?99:day-p.lastStart; const top=[...d.sp].filter(p=>healthy(p)&&!mcfPitchRest(p,day)).sort((a,b)=>spV(b)-spV(a)); const need=(ps.elimT?ps.elimT.includes(tid):ps.elim)?3:4;
  const ok=p=>p.lastApp!==day&&!(p.lastApp!=null&&p.lastApp!==p.lastStart&&day-p.lastApp<2); /* 어제 불펜으로 던진 투수는 쉬어 온 선발 뒤로(정규시즌과 같은 기준, 검수 11-08) */ return top.slice(0,3).find(p=>ok(p)&&rest(p)>=need)||top.find(p=>ok(p)&&rest(p)>=4)||null; }
/* 최종전 접전 7회 이후: 오늘 선발이 아닌 에이스(선발 상위 2명, 2일 이상 쉼)를 불펜으로 */
function psAceRelief(fs,inn,lead,day,ps){ if(!ps||!(ps.fin||(ps.elimT?ps.elimT.includes(fs.tid):ps.elim))||inn<7||Math.abs(lead)>3||!fs.spAll)return null; const top=[...fs.spAll].filter(p=>p!==fs.sp&&!fs.used.has(p.id)&&relAvail(p,day,ps)).sort((a,b)=>spV(b)-spV(a)).slice(0,2);
  return top.find(p=>p.lastApp==null||day-p.lastApp>=2)||null; } /* '2일 이상 쉼'은 구원 등판까지 센 마지막 등판일 기준(검수 11-09zh) */
function pickStarter(tid,d,day,ps,o){
  const t=team(tid); const sp=d.sp.filter(p=>!mcfPitchRest(p,day)); if(ps&&sp.length){ const c=psStarter(tid,d,day,ps); if(c)return c; }
  const fresh=p=>!mcfPitchRest(p,day)&&p.lastApp!==day&&!(p.lastApp!=null&&p.lastApp!==p.lastStart&&day-p.lastApp<2); /* 오늘 던졌거나 어제·그제 불펜으로 던진 투수는 선발 순번을 넘긴다(새로 들어온 선발 포함, 검수 11-07) */
  if(!sp.length){ const el=playersOf(tid).filter(p=>p.isP&&!mcfPitchRest(p,day)&&psOk(p)&&!(p.susp>day)&&!isAway(p)&&(!entryOn()||p.e1||canUp(p))), td=p=>!mcfPitchRest(p,day)&&p.lastApp!==day; const c=d.pen.find(fresh)||el.find(p=>healthy(p)&&fresh(p))||d.pen.find(td)||el.find(p=>healthy(p)&&td(p))||null; /* 오늘 던진 투수는 비상 선발로도 쓰지 않는다(검수 11-09zh) */
    if(c&&entryOn()&&!c.e1){ const ent=playersOf(tid).filter(p=>p.e1); if(ent.length>=entryLimit()){ const lean=teamLean(tid), out=ent.filter(p=>!d.start.includes(p)&&!cProt(p,c,ent)).sort((a,b)=>(healthy(a)-healthy(b))||(entryVal(tid,a,lean)-entryVal(tid,b,lean)))[0]; if(!out)return null; out.e1=false; out.downDay=G.day; } } /* 1군 정원이 차 있으면 다친 선수부터 한 명 말소하고 올린다(검수 11-09zh) */ /* 재활 선수 명단·연봉 미계약 투수는 마지막 수단으로도 쓰지 않는다. 아무도 없으면 null: 경기를 미루는 기존 처리(playDay)로(검수 11-09t) */ if(c&&entryOn()&&!c.e1){ c.e1=true; c.upDay=G.day; } return c; } /* 마지막 후보도 출장정지·재등록 제한·2군 선발 수업은 빼고, 2군에서 올리면 등록한다(검수 11-08) */ /* 건강한 투수가 없으면 기존 경기 연기 경로로 보낸다. 부상자를 강제로 선발 등판시키지 않는다. */
  for(let k=0;k<sp.length;k++){ const i=((t.rot||0)+k)%sp.length; const p=sp[i]; if((p.lastStart==null||day-p.lastStart>=5)&&fresh(p)){ if(o)o.rot=(i+1)%sp.length; return p; } } /* 순번은 경기를 저장할 때(applyGame) 넘긴다: 실패·재시도로 두 칸 넘지 않게(검수 11-09zh) */
  const pool=[...sp].sort((a,b)=>(a.lastStart||0)-(b.lastStart||0)); return pool.find(fresh)||d.pen.find(fresh)||pool.find(p=>!mcfPitchRest(p,day)&&p.lastApp!==day)||d.pen.find(p=>!mcfPitchRest(p,day)&&p.lastApp!==day)||null; /* 당일 등판은 모든 선발 경로의 하드 제외 조건이다. 오늘 던진 투수만 남으면 후보 없음: gameSide의 경기 연기 경로로 보낸다. */
}
/* 타순(카페 11-14: 외국인 거포·최고 타자가 1번에 몰림. 감독마다 달라야 한다). 실제로 쓰이는 짜임새를 감독 성향으로 고른다(같은 감독은 늘 같은 짜임새).
   - 클래식(KBO 전통): 1번 출루·발, 2번 맞히기·번트, 3번 최고 타자, 4번 최고 거포, 5번 다음 거포, 6~9번은 잘 치는 순
   - 세이버(The Book): 가장 좋은 타자 셋을 1·2·4번에(1번 출루 최고, 2번 팀 최고 타자, 4번 장타 최고), 다음 둘을 3·5번
   - OPS 순: 출루+장타가 높은 순서대로 1번부터
   - 스몰볼: 발 빠른 출루형 1번, 번트·밀어치기 2번, 장타 3~5번 / 빅볼: 출루형 1번, 최고 타자 2번, 장타자 몰아 놓기
   출루율·OPS는 능력치에 올해 1군 성적(100타석 이상)을 섞는다. 어느 짜임새든 출루가 좋은 타자가 위쪽에 온다 */
function orderList(start,tid){
  const s=[...start]; const by=f=>s.sort((a,b)=>f(b)-f(a)); const take=(f,n)=>{ by(f); return s.splice(0,n); };
  const m=tid!=null?mgrOf(tid):null; const ok=m&&!m.interim; const sm=ok?m.small:50, tac=ok?(m.tac??50):50;
  const h=ok?[...String(m.id||m.name||'')].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%100:50; /* 감독마다 고정된 버릇 */
  const C=new Map(); const st=p=>{ if(C.has(p.id))return C.get(p.id); let o=null; try{ const t=seasonTotal(p,G.year,'1군'); if(t&&t.pa>=100){ const r=bRate(t); o={obp:r.obp,ops:r.ops,w:Math.min(.6,t.pa/500)}; } }catch(e){} C.set(p.id,o); return o; };
  const obpR=p=>.24+(p.r.eye-20)*.0022+(p.r.con-20)*.0018, opsR=p=>obpR(p)+.25+(p.r.pow-20)*.0055+(p.r.con-20)*.002;
  const obp=p=>{ const o=st(p); return o?obpR(p)*(1-o.w)+o.obp*o.w:obpR(p); }, ops=p=>{ const o=st(p); return o?opsR(p)*(1-o.w)+o.ops*o.w:opsR(p); };
  const lead=p=>obp(p)*100+p.r.spd*.25-p.r.pow*.18, two=p=>p.r.con*1.2+p.r.eye*.4+p.r.spd*.3-p.r.pow*.25, slug=p=>p.r.pow+p.r.con*.45;
  if(sm>=62){ const a=take(p=>obp(p)*80+p.r.spd*.6-p.r.pow*.2,1), b=take(p=>p.r.con*1.3+p.r.eye*.3+p.r.spd*.3-p.r.pow*.5,1), mid=take(slug,3); by(ops); return [...a,...b,...mid,...s]; }
  if(sm<=38){ const a=take(lead,1), b=take(ops,1), mid=take(slug,3); by(ops); return [...a,...b,...mid,...s]; }
  if(tac>=64&&h<50){ const top3=take(ops,3); const one=top3.sort((x,y)=>obp(y)-obp(x)).shift(); const four=top3.sort((x,y)=>slug(y)-slug(x)).shift(); const twoP=top3[0]; const nx=take(ops,2).sort((x,y)=>slug(x)-slug(y)); by(ops); return [one,twoP,nx[0],four,nx[1],...s]; }
  if(h>=82){ by(ops); return [...s]; }
  const four=take(slug,1), three=take(ops,1), five=take(slug,1); const a=take(lead,1), b=take(two,1); by(ops);
  return [...a,...b,...three,...four,...five,...s]; }
function gameSide(tid,day,ps){
  const d=depth(tid); const ln=Object.assign({},d.ln); const bench=[...d.bench];
  const ov={}, rest=new Set();
  for(const pos of ORDER){ const p=ln[pos]; if(!p||ov[pos]===p.id||!bench.length)continue;
    const m=mgrOf(tid), re=m.interim?50:mgrRestEff(m); const dh2=!ps&&rainDh2(tid,day); /* 더블헤더 2경기: 주전 포수는 대개 쉬고, 지친 주전도 더 쉽게 뺀다(93_rain, 모든 구단 같은 규칙) */ const fat=p.fat||0, thr=(pos==='C'?55:66)+(50-re)*.35-(dh2?12:0); if(R()<.004+re/4000+(re>=60?(re-55)/500:0)||(dh2&&pos==='C'&&R()<clamp(.72+(re-50)/250,.5,.92))||(fat>thr&&R()<clamp((fat-thr)/30+(re-50)/150,.12,.95))){ const bc=pos==='C'?bench.filter(q=>isC(q)&&!rest.has(q.id)):null; if(bc&&!bc.length)continue; /* 주전 포수 휴식은 백업 포수로만(외야수를 포수로 넣지 않는다, 검수 11-09t) */ let best=null,bs=-1e9; for(const q of (bc||bench)){ if(rest.has(q.id)||(!bc&&isC(q)&&bench.filter(isC).length<=1))continue; /* 하나뿐인 백업 포수는 다른 자리에 쓰지 않는다(검수 11-09zh) */ const s=posScore(q,pos); if(s>bs){bs=s;best=q}} if(!best)continue; rest.add(p.id); ln[pos]=best; bench.splice(bench.indexOf(best),1,p); } } /* 쉬는 주전은 벤치에 남아 대타·대수비로 나갈 수 있다(검수 11-08) */
  const posOf={}; for(const k in ln)posOf[ln[k].id]=k;
  const order=orderList(ORDER.filter(k=>ln[k]).map(k=>ln[k]),tid); if(order.length<9)throw new Error('건강한 야수 9명 미만'); /* 8인 타순으로 경기하지 않는다: 감독이 엔트리를 고친 뒤 다시, 안 되면 연기(검수 11-09zh) */
  const ro={}, sp=pickStarter(tid,d,day,ps,ro);
  if(!sp){ if(tid===ME()&&!playersOf(tid).some(p=>p.isP&&canUp(p))&&!(G.pitchShortNotice?.tid===tid&&G.pitchShortNotice?.y===G.year)){ G.pitchShortNotice={tid,y:G.year,d:day}; stop('엔트리',`${tname(tid)}에 등판 가능한 건강한 투수가 없어 경기를 미룹니다. 부상자를 강제 투입하지 않습니다. 건강한 투수를 영입하거나, 출장·등록 조건을 확인해 투수 엔트리를 보충해 주세요.`); } throw new Error('등판 가능한 건강한 투수가 없습니다. 투수 엔트리 보충이 필요합니다.'); }
  if(G.pitchShortNotice?.tid===tid)delete G.pitchShortNotice;
  const s={tid,rot:ro.rot,order,posOf,bench,out:[],defv:teamDefV(ln),spAll:d.sp,short:!!(ps&&sp&&sp.lastStart!=null&&day-sp.lastStart<5),pen:(ps?[...d.pen,...[...d.sp].filter(healthy).sort((a,b)=>spV(b)-spV(a)).slice(3).filter(p=>!d.pen.includes(p))]:d.pen).filter(p=>p!==sp), /* 가을야구: 선발 3명만 돌리므로 4·5선발은 불펜 뒤쪽(롱릴리프)에 넣는다(커뮤니티 11-12) */used:new Set(sp?[sp.id]:[]),cur:sp,sp,curIsSP:true,idx:0,box:new Map(),pitchers:sp?[sp.id]:[],entry:{},exit:{}};
  s.start=order.map((p,o)=>({id:p.id,n:p.name,o,pos:posOf[p.id]}));s.changes=[];
  if(sp)s.box.set(sp.id,pz()); order.forEach(p=>s.box.set(p.id,bz())); sideTraits(s);
  return s;
}
function boostOf(p){ const tm=milServing(p)?null:p.team; /* 상무 복무 중에는 원소속 구단 코치·감독·분위기를 받지 않는다(검수 11-09zk) */ let b=(tm!=null&&G.coach)?coachBoost(p):0; if(SIMDAY!=null&&p.gcD===SIMDAY)b+=p.gc||0; if(tm!=null)b+=mgrRelBoost(p); const f=G.form; if(f&&tm!=null&&tm===G.user&&!G.unemp&&G.day<=f.until)b+=f.b; else if(tm!=null&&tm!==ME()){ const tf=G.teams[tm]&&G.teams[tm].form; if(tf&&G.day<=tf.until)b+=tf.b; } /* 다른 구단도 캠프 실전 감각 효과(사용자 11-13) */ if(tm!=null&&p.form&&G.day<=p.form.until)b+=p.form.b; if(p.mor!=null)b+=clamp((p.mor-60)/36,-1.1,.8); /* 사기: 이기는 팀일수록 오르므로 효과가 크면 강팀이 더 강해진다(되먹임). 폭을 줄였다 */ if(tm!=null){ b+=(mgrOf(tm).tac-50)/60; b+=climateOf(tm).boost; } if(p.foreign&&p.fy===G.year&&p.adapt!=null)b+=(p.adapt-50)/22; if(p.foreign)b+=fBoost(p); /* 숨은 KBO 적합도·태업(73_foreign_drama) */
  if(p.sf&&p.sf.y===G.year)b+=p.sf.v+(p.sf.m||0);
  if(p.fat>45)b-=(p.fat-45)/18;
  if(p.wear){ const cap=p.isP?40+p.r.sta*1.7:70+(p.r.vit||52)*1.0; if(p.wear>cap)b-=Math.min(3,(p.wear-cap)/25); }
  return b; }
/* 선수 능력 차이가 타석 결과에 반영되는 폭. 1이면 능력 그대로, 낮을수록 운의 비중이 커진다.
   능력치 게임이라 능력 그대로(1) 반영한다. 0.75일 때는 한 시즌 OPS를 능력치가 45~58%밖에 설명하지 못해,
   파워가 평균인 타자가 장타율 .514를 치는 식으로 기록과 능력이 어긋났다. 1과 시즌 운 0.4(FORM_K)에서 66~71%(실제 야구의 실력 설명력 수준).
   리그 평균(타율·장타율·평균자책점)은 그대로이고, 팀 승률 편차는 약 0.07 → 0.077로 조금 커진다 */
const TALENT_W=1;
/* 능력별 결과 폭: 실제 KBO 기록 분포에 맞춘다(사용자 2026-11-01 "실제 kbo 성적의 비율을 체크해서 매칭").
   KBO 2026 규정 타석 wRC+(FanGraphs, 64명): 1위 175·5위 149·10위 140·20위 125·30위 110. 평균자책점 1위는 해마다 1.9~2.7 안팎.
   예전 폭(타자 k2.0·bb1.3·hr1.25·babip2.0, 투수 k1.5·bb1.5·hr2.3·babip1.4)은 MLB 안정화 지점에 맞춘 값이라 KBO보다 실력 차가 커서
   5위 wRC+ 172~213, 1위 200~300, 평균자책점 1위 0.9~1.7이 흔했다. 지금 폭에서 측정(세계 3개 × 2~6시즌): wRC+ 1위 152~189·5위 138~161·10위 124~140·20위 114~125·30위 104~114,
   평균자책점 1위 2.0~2.6·5위 2.8~3.2·10위 3.2~3.4. 한 시즌 OPS를 능력 기대치가 설명하는 정도는 약 60%(실력 폭 wRC+ 약 24, 600타석 운 약 18 — KBO 실력 폭에서 나올 수 있는 수준).
   타자·투수 결합(log5)이 극단 대결에서 안타를 늘리는 만큼 QOF로 되돌려 리그 평균(타율 .265 안팎·경기당 득점 4.6 안팎)은 그대로 둔다 */
/* 11-12 재조정(커뮤니티: 파워 98인데 홈런 20개대·0점대 평균자책점): 타자 홈런 폭 .69→.85, 투수 폭 축소. 측정 홈런 1위 37~42·평균자책점 1위 2.15~2.35(KBO 실제 홈런왕 30 후반~40대, 평균자책점 1위 1.9~2.7) */
const TWB={k:1.1,bb:.8,hr:.82,babip:.9}, TWP={k:.7,bb:.85,hr:.9,babip:.4}; /* 11-15 타자 균형: 볼넷 .72→.80·홈런 .85→.82(02_records batProbs, 홈런 1위가 30 중후반에 남게) */ /* 플레이 테스트 3차: 타율·안타 1위가 .390·210안타까지, 평균자책점 1위가 1점대로 자주 나와 인플레이 안타율 폭만 조금 좁혔다(홈런 폭은 그대로) */ /* 11-15 밸런스(KBO 2015~2025 기준: 타격왕 중앙값 .355·보통 .335~.380, 평균자책점 1위 중앙값 2.4·보통 2.0~3.0, 1점대 1위는 5~10년에 한 번).
   예전 측정(AI만, 세계 4개 × 16시즌): 평균자책점 1위 중앙값 1.98, 1점대 1위 23/44시즌, 규정 2.50 미만 시즌당 3.2명, 1~5위 평균 1.95·2.24·2.41·2.57·2.70.
   같은 능력대 선발끼리 평균자책점 운 폭(표준편차 약 0.8)은 실제와 비슷했고, 상위 능력대가 리그 평균보다 1.6~2.0 낮아 폭이 컸다.
   투수 폭: 인플레이 안타 .7→.4(실제 투수가 다스리는 인플레이 안타율 차이는 작다), 홈런 1.1→.9, 삼진 .85→.7, 볼넷 .85 그대로(구위·제구 WAR 기여 비율을 맞추려고 삼진을 더 줄였다).
   국내 선수층이 커진 뒤(10_draft LV_UP) 타격왕 .380+가 잦아져 타자 인플레이 안타 폭도 1.0→.9 */
const QCB={k:.207,bb:.0825,hr:.0248,babip:.320}, QCP={k:.204,bb:.0818,hr:.025,babip:.310}, QOF={babip:-.003,hr:-.0004,bb:.001,k:-.001};
function shrinkQ(q,W,C,F){ const o=Object.assign({},q); for(const k of ['bb','k','hr','babip']){ const c=C?C[k]:LGP[k]; o[k]=clamp(c+(q[k]-c)*TALENT_W*(W?W[k]:1)+(F&&F[k]||0),.002,.6); } return o; }
/* 홈 어드밴티지 크기(능력 보정 단위). 같은 전력이면 홈 승률 약 53~54%(MLB 장기 평균 약 .54, KBO도 비슷한 수준)에 맞춘 값 */
let HOME_ADV=1.5;
let RSP0=false;
/* 타석의 의미는 엔진이 한 번 정해 둔다. 18번 칸이 없는 옛 기록은 저장된 번트 공·주자 아웃만 읽는다. */
function gamePA(row){const o=row?.[3],m=row?.[18]&&typeof row[18]==='object'?row[18]:{},pitch=row?.[15]?.pitches?.slice(-1)[0],bip=typeof row?.[17]==='string'?row[17].split(':'):[],error=m.error??!!row?.[9],out=(row?.[14]||[]).find(x=>x.result==='out'),fc=m.fc??(!error&&o==='OUT'&&(!!row?.[16]||row?.[5]?.[0]===row?.[1]));let bunt=m.bunt||null;if(!bunt&&(o==='SAC'||row?.[16]||pitch?.res==='번트'))bunt=o==='SAC'?'sac':o==='1B'?'hit':fc?'fc':'out';
  const outBase=m.outBase??(fc?(out?.to??null):bunt&&bunt!=='hit'?1:null),outRunner=m.outRunner??(fc?(row?.[16]??out?.id??null):bunt&&bunt!=='hit'?row?.[1]:null),sf=row?.[13]||0;return {...m,bunt,kind:bunt?'bunt':error?'error':fc?'fc':'ordinary',outcome:bunt?({sac:'sac',hit:'hit',out:'batterOut',fc:'force'})[bunt]:null,fc,error,fielder:m.fielder??bip[1]??null,bipType:m.bipType??bip[0]??null,outBase,outRunner,ab:m.ab??(['BB','HBP','SAC'].includes(o)||sf?0:1),bb:o==='BB'?1:0,hbp:o==='HBP'?1:0,sf};}
/* 실책을 아웃으로 바꾼 이닝의 주자 진행. 실제 주루 판단만 재사용하며 가상의 주루 난수를 새로 뽑지 않는다.
   key는 같은 선수가 한 이닝에 다시 타석에 서도 서로 다른 주자임을 구별한다. */
function earnedBasesStep(previous,play){const B=previous.slice(),scored=[],score=r=>{if(r)scored.push(r);},move=(r,from,to)=>r&&(play.moves||[]).find(m=>m.id===r.id&&m.from===from&&m.to===to),forced=()=>{if(B[0]){if(B[1]){score(B[2]);B[2]=B[1];}B[1]=B[0];}B[0]=play.b;};
  if(play.error)return {base:B,scored};
  if(play.o==='CS'){for(let i=0;i<3;i++)if(B[i]?.key===play.runner.key)B[i]=null;return {base:B,scored};}
  if(play.o==='SB'){const i=B.findIndex(r=>r?.key===play.runner.key);if(i===play.from-1&&!B[play.to-1]){B[play.to-1]=B[i];B[i]=null;}return {base:B,scored};}
  if(play.bunt){if(play.bunt==='hit')forced();else if(play.bunt==='sac'){if(B[1]&&!B[2]){B[2]=B[1];B[1]=null;}if(B[0]&&!B[1]){B[1]=B[0];B[0]=null;}}else if(play.bunt==='fc'){const i=play.outBase===3?1:0;if(B[i]){B[i]=null;if(i===1){B[1]=B[0];B[0]=null;}B[0]=play.b;}}return {base:B,scored};}
  if(play.o==='BB'||play.o==='HBP'){forced();return {base:B,scored};}
  if(play.o==='K')return {base:B,scored};
  if(play.o==='HR'){B.forEach(score);score(play.b);return {base:[null,null,null],scored};}
  if(play.o==='3B'){B.forEach(score);return {base:[null,null,play.b],scored};}
  if(play.o==='2B'){score(B[2]);score(B[1]);const r=B[0],m=move(r,1,4);if(m?.result==='safe')score(r);return {base:[null,play.b,r&&m?.result!=='out'&&m?.result!=='safe'?r:null],scored};}
  if(play.o==='1B'){score(B[2]);B[2]=null;const r2=B[1],m2=move(r2,2,4);if(m2?.result==='safe')score(r2);else if(r2&&m2?.result!=='out')B[2]=r2;B[1]=null;const r1=B[0],m1=move(r1,1,3);if(r1){if(!B[2]&&m1?.result==='safe')B[2]=r1;else if(m1?.result!=='out')B[1]=r1;}B[0]=play.b;return {base:B,scored};}
  if(play.o==='OUT'){if(play.dp){if((play.actualScored||[]).length)score(B[2]);B[2]=B[1];B[0]=B[1]=null;}
    else if(play.bipType==='GB'&&B[0]){const full=!!(B[1]&&B[2]),r1=B[0];if(full||move(B[2],3,4)?.result==='safe'){score(B[2]);B[2]=null;}if(B[1]&&!B[2]){B[2]=B[1];B[1]=null;}if(play.fc)B[0]=play.b;else{B[1]=r1;B[0]=null;}}
    else{if(play.sf||move(B[2],3,4)?.result==='safe'){score(B[2]);B[2]=null;}else if(move(B[2],3,4)?.result==='out')B[2]=null;if(B[1]&&!B[2]){const m=move(B[1],2,3);if(m){if(m.result==='safe')B[2]=B[1];B[1]=null;}}}}
  return {base:B,scored};}
/* 성능: 경기 한 판 동안 변하지 않는 값(배터리 코치 계획, 구단별 전력분석 효과)은 수비 쪽 객체마다 한 번만 계산한다. 저장되지 않게 WeakMap에 둔다 */
const _sideMemo=new WeakMap();
function sideMemo(fs){ let M=_sideMemo.get(fs); if(!M){ M={cbp:coachBatteryPlan(fs.tid),ana:new Map()}; _sideMemo.set(fs,M); } return M; }
function sideAna(M,tid){ if(!M)return anaEff(tid); let v=M.ana.get(tid); if(!v){ v=anaEff(tid); M.ana.set(tid,v); } return v; }
function outcome(b,p,dv,fp,fs){ /* fp: 경기 중 피로(투구 수와 체력, 평균만큼 뺀 값) */
  const SM=fs?sideMemo(fs):null; const lead=fs?((fs.cLead??CL0)-CL0)*CLW+chemOf(p,fs.cId)+SM.cbp:0; /* 포수 리드·블로킹·배터리 호흡 */ const cb=CLUTCH?CLUTCH*2.0*mentalOf(b):0, cp=CLUTCH?CLUTCH*2.0*mentalOf(p):0; /* 승부처: 멘탈 */ const ha=fs&&PARK!=null&&HOME_ADV?(fs.tid===PARK?-HOME_ADV:HOME_ADV):0; /* 홈 어드밴티지(사용자 11-11): 수비 쪽이 홈이면 투수에, 아니면 타자에 */
  const qb=shrinkQ(batProbs(b,boostOf(b)+platB(b,p)*.5+cb+Math.max(0,ha)),TWB,QCB,QOF), qp=shrinkQ(pitProbs(p,boostOf(p)+platP(p,b)*.5-(fp||0)+lead+cp+Math.max(0,-ha)),TWP,QCP,QOF);
  const bb=comb(qb.bb,qp.bb,LGP.bb)*(1-LRULE.zone*.06), k=comb(qb.k,qp.k,LGP.k)*(1+LRULE.zone*.04), /* ABS 존(88_league_rules) */ hr=comb(qb.hr,qp.hr,LGP.hr), babip=comb(qb.babip,qp.babip,LGP.babip)-(G.coach&&p.team!=null?(effC(coachesOf(p.team).dc,p.team)-55)*.0006:0)-(p.team!=null?sideAna(SM,p.team).bab-.0016:0)+(b.team!=null?sideAna(SM,b.team).bat-.0012:0); /* 전력분석: 수비 위치·투구 계획. 야수 수비력이 인플레이 타구 안타 확률을 바꾼다 */
  LBIP=null; const pm=parkHRM(PARK,bipSide(b,p))*LRULE.ball, hrA=hr*pm; /* 공인구 반발계수(88_league_rules)도 홈런 지수에 곱한다 */ /* 구장: 담장 거리·높이에 따른 홈런 지수 */ const x=R(); if(x<bb)return 'BB'; if(x<bb+k)return 'K'; if(x<bb+k+hrA){ LBIP=bipHR(b,p); return 'HR'; }
  const hbp=clamp(.0085+(50-(p.r.ctl||50))*.00010+(fp||0)*.00008,.004,.014);
  if(x>=bb+k+Math.max(hr,hrA)&&x<bb+k+Math.max(hr,hrA)+hbp)return 'HBP'; /* 제구·피로에 따른 사구. 볼넷/삼진/홈런 구간과 분리 */
  if(pm<1&&x<bb+k+hr){ const side=bipSide(b,p); LBIP={t:'FB',pos:bipPos('FB',parkHRDir(PARK,side),side),side,wall:true}; return '2B'; } /* 담장에 막힌 타구는 2루타 */
  return bipResolve(b,p,babip,qb,qp,fs); /* 인플레이: 타구 유형·방향 → 그 자리 야수 수비(46b_bip) */
}
let PARK=null; /* 지금 경기 구장(홈 팀) */
let LRULE={ball:1,zone:0};
function simGame(day,hid,aid,ps,options){ try{ LRULE=lgRuleNow(); }catch(e){ LRULE={ball:1,zone:0}; } PARK=hid; SIMDAY=day; if(options&&options.sides){ for(const k of ['h','a']){ const s=options.sides[k]; for(const q of [...s.order,...s.bench,...s.pen,...(s.sp?[s.sp]:[])]){ q.gc=N(0,.55*volF(q)); q.gcD=day; } } } else for(const tid of [hid,aid])for(const q of playersOf(tid)){ q.gc=N(0,.55*volF(q)); q.gcD=day; } /* 그날 컨디션: 기복이 큰 선수일수록 흔들림이 크다 */
  const S=options&&options.sides?options.sides:{h:gameSide(hid,day,ps),a:gameSide(aid,day,ps)}; /* 퓨처스리그: 2군 라인업을 넘겨받는다(92_futures_league) */
  const broadcast=options?.pitchRecords===false?null:gameBroadcastContext(day,S,!ps);
  const psx=ps&&typeof ps==='object'?ps:null;
  const score={h:0,a:0}, line={h:[],a:[]}, hits={h:[],a:[]}, ev=[], pbp=[];
  for(const k of ['a','h']){ const s0=S[k]; if(s0.short&&s0.sp)ev.push({h:0,t:`${s0.sp.name}, ${day-s0.sp.lastStart}일 휴식 후 선발 등판(총력전)`}); }
  const wc={}, lc={},pitchProfiles=new Map(), W=[]; let walk=false; /* 선수 기록(좌우·타구)은 경기 반영(applyGame)에서 쓴다: 실패·연기된 경기의 타구가 남지 않게(검수 11-09zh, 11-09zt) */
  const trace=(half,b,p,o,n)=>{if(options?.pitchRecords===false)return null;if(!pitchProfiles.has(p.id))pitchProfiles.set(p.id,pitchProfile(p));return gamePitchRecord(day,hid,aid,half,pbp.length,b.id,p.id,o,n,{...pitchProfiles.get(p.id),batterHand:b.bt==='양'?(p.th==='좌'?'우':'좌'):b.bt});};
  const opp=k=>k==='h'?'a':'h';
  /* 혹사 금지의 선발 목표는 95구. 교체 가능한 건강한 등록 투수가 소진되면 실제 경기 완료를 위해 명시된 비상 계속 투구로 전환한다. */
  const lim=(fs)=>{ const mm=mgrOf(fs.tid); const ae=mgrPush(fs.tid); if(fs.curIsSP){ let v=PW.l0+fs.cur.r.sta*PW.ls+(50-mm.pen)/6+(ae-50)/5-(fs.short?15:0); /* 감독 성향 폭: KBO 구단별 선발 평균 80~91구 수준 */ if(!ps){ const rc=spRampCap(fs.cur,day); if(rc!=null)v=Math.min(v,rc); } /* 선발 빌드업 */ return armDirOn(fs.tid)?Math.min(v,95):v; } return 18+fs.cur.r.sta*.3+(ae-50)/8+(fs.multi&&fs.multi[fs.cur.id]?12:0); };
  /* 교체 판단 여유: 보통은 한계에서 6구까지 더 본다. 혹사 금지(95구)면 다음 타자를 맞기 전 88구에서 끊어 타석이 길어져도 95구를 넘지 않게(검수 11-08) */
  const armM=fs=>fs.curIsSP&&armDirOn(fs.tid)?-8:6;
  function needChange(fs){ const x=fs.box.get(fs.cur.id); const mm=mgrOf(fs.tid);
    if(fs.curIsSP){ const hook=!mm.interim&&(mm.pen>=62||mgrPush(fs.tid)>=72)&&x.bf>=18&&x.er>=3; /* 선발 쪼개기: 세 번째 타순에 흔들리면 바로 내린다 */ return x.pc>=lim(fs)+Math.min(0,armM(fs))||x.er>=6||(x.er>=4&&x.pc>=lim(fs)-25)||hook; }
    return x.outs>=(fs.multi&&fs.multi[fs.cur.id]?6:3)||x.pc>=lim(fs); }
  /* 경기 후반 불 끄기(카페 11-20 요청: '9회 리드가 따라잡히는데 한 이닝을 그냥 맡긴다'): 8회부터 수비 쪽 구원 투수가 흔들리면 타석 사이에 바꾼다.
     sv: 큰 리드로 올라왔다가 세이브 상황(리드 1~3점 또는 동점 주자가 누상·타석·대기 타석)이 됐거나, 세이브 상황에 올라와 2점 이상 줬다 → 마무리(없으면 필승조)
     run: 2점 이상 줘서 동점~4점 리드로 좁혀졌다 → 필승조 · cl: 마무리가 동점을 허용했거나 3점 이상 줬다 → 필승조
     게임 상태로만 정한다(난수 없음). 바꿀 필승조·마무리가 없으면(이미 던졌거나 연투·피로 한도) 그대로 둔다. 모든 구단 같은 규칙, 퓨처스 제외 */
  function lateFire(fs,L,nr){ const c=fs.cur, x=c&&fs.box.get(c.id); if(!x||fs.farm||fs.curIsSP)return null; const e0=fs.entry[c.id]??L, r0=(fs.entryR||{})[c.id]||0, drop=e0-L, svs=(l,n)=>l>=1&&(l<=3||l<=n+2);
    if(c===fs.pen[0])return (e0>=1&&L<=0)||drop>=3?'cl':null;
    if(svs(L,nr)&&(!svs(e0,r0)||drop>=2))return 'sv';
    if(drop>=2&&L>=0&&L<=4)return 'run';
    return null; }
  function bringIn(fs,inn,lead,half,nr,fire){
    const registered=fs.farm?[]:actOf(fs.tid).filter(p=>p.isP),roster=fs.farm?(fs.pitchPool||new Set([fs.sp,...fs.pen,...(fs.spAll||[])].filter(Boolean).map(p=>p.id))):new Set(registered.map(p=>p.id));
    const eligible=p=>p&&p.isP&&!mcfPitchRest(p,day)&&roster.has(p.id)&&p!==fs.cur&&!fs.used.has(p.id)&&p.lastApp!==day&&healthy(p)&&!(p.susp>day)&&!(p.boy>day)&&(fs.farm||psOk(p));
    { const ace=psAceRelief(fs,inn,lead,day,psx); if(ace&&eligible(ace)){ fs.exit[fs.cur.id]=lead; fs.cur=ace; fs.curIsSP=false; fs.used.add(ace.id); (fs.multi=fs.multi||{})[ace.id]=1; fs.box.set(ace.id,pz()); fs.entry[ace.id]=lead; (fs.entryR=fs.entryR||{})[ace.id]=nr||0; fs.pitchers.push(ace.id); if(ev.length<400)ev.push({h:half,t:`총력전: 선발 ${ace.name} 불펜 등판`}); if(pbp.length<1000)pbp.push([half,'PC',ace.id]); return; } }
    let av=fs.pen.filter(p=>eligible(p)&&relAvail(p,day,ps));
    if(fire&&!av.length)return false; /* 불 끄기는 쉬어 있는 불펜이 있을 때만(비상 계속 투구·선발 대체로 넓히지 않는다) */
    if(!av.length&&armDirOn(fs.tid))av=[...new Map([...fs.pen,...(fs.spAll||[]),...registered].map(p=>[p.id,p])).values()].filter(eligible); /* 퓨처스는 전달받은 명단 안에서만, 1군은 실제 등록 명단 안에서만 확인한다. */
    else if(!av.length&&fs.curIsSP){ const x0=fs.box.get(fs.cur.id); if(x0&&x0.pc>=lim(fs)+25)av=fs.pen.filter(eligible); }
    if(!av.length){ if(!(fs.armEmergency||[]).some(x=>x.id===fs.cur.id)){ const x=fs.box.get(fs.cur.id), e={id:fs.cur.id,half,startPc:x.pc,reason:'noHealthyReplacement'}; (fs.armEmergency=fs.armEmergency||[]).push(e); if(ev.length<400)ev.push({h:half,t:`비상 계속 투구: ${fs.cur.name} · ${fs.farm?'이번 퓨처스 명단에서':'등록 명단에서'} 등판 가능한 대체 투수가 없어${armDirOn(fs.tid)?' 95구 관리 목표의 예외로':''} 경기를 이어갑니다.`}); } return; }

    const closer=fs.pen[0], setup=fs.pen.slice(1,4), mid=fs.pen.slice(4);
    let nxt=null;
    if(fire){ const svs=lead>=1&&(lead<=3||lead<=(nr||0)+2); nxt=(fire==='sv'||fire==='run'&&svs)&&av.find(p=>p===closer)||av.find(p=>setup.includes(p))||(fire!=='cl'&&lead===0&&inn>=9?av.find(p=>p===closer):null); if(!nxt)return false; } /* 불 끄기(lateFire): 마무리·필승조만, 없으면 바꾸지 않는다 */
    if(inn>=9&&lead>=1&&lead<=3) nxt=av.find(p=>p===closer);
    if(!nxt&&inn>=7&&lead>=0&&lead<=3) nxt=av.find(p=>setup.includes(p));
    /* 가을야구 접전(3점 차 이내)은 총력전(커뮤니티 11-13 하꼼: 접전인데 추격조·롱릴리프만 썼다): 6회부터 지고 있어도 필승조, 선발이 일찍 무너지면 롱릴리프보다 4·5선발을 먼저 길게 */
    const psClose=ps&&Math.abs(lead)<=3;
    if(!nxt&&psClose&&inn>=6) nxt=av.find(p=>setup.includes(p))||(inn>=8?av.find(p=>p===closer):null);
    if(!nxt&&psClose&&inn<=5&&fs.curIsSP){ const S=av.filter(p=>(fs.spAll||[]).includes(p)).sort((a,b)=>spV(b)-spV(a))[0]; if(S){ nxt=S; (fs.multi=fs.multi||{})[S.id]=1; } }
    if(!nxt&&!ps&&inn>=8&&lead>=-1&&lead<0) nxt=av.find(p=>setup.includes(p)); /* 정규시즌도 8회 이후 1점 차로 지고 있으면 필승조 */
    if(!nxt&&inn<=5&&fs.curIsSP){ const L=av.find(p=>bproleOf(fs.tid,p)==='lr'); if(L){ nxt=L; (fs.multi=fs.multi||{})[L.id]=1; } } /* 롱릴리프: 선발이 일찍 내려가면 먼저, 여러 이닝 */
    if(!nxt&&lead<0&&lead>=-3&&!psClose){ const M=av.find(p=>bproleOf(fs.tid,p)==='mr'); if(M)nxt=M; } /* 추격조: 따라가는 경기(가을야구 접전은 제외) */
    if(!nxt&&(lead<-3||lead>4)) nxt=[...av].reverse().find(p=>p!==closer);
    if(!nxt) nxt=av.find(p=>mid.includes(p))||av.find(p=>p!==closer)||av[0];
    fs.exit[fs.cur.id]=lead; fs.cur=nxt; fs.curIsSP=false; fs.used.add(nxt.id); { const pu=mgrPush(fs.tid); if(nxt!==closer&&inn<=7&&R()<clamp((pu-52)/45,0,.6)*(Math.abs(lead)<=3?1:.5))(fs.multi=fs.multi||{})[nxt.id]=1; } /* 멀티이닝 */ fs.box.set(nxt.id,pz()); fs.entry[nxt.id]=lead; (fs.entryR=fs.entryR||{})[nxt.id]=nr||0; fs.pitchers.push(nxt.id);
    if(ev.length<400)ev.push({h:half,t:`투수 교체: ${nxt.name}`}); if(pbp.length<1000)pbp.push([half,'PC',nxt.id]);
  }
  function half(bk,inn){
    const bs=S[bk], fs=S[opp(bk)], isBot=bk==='h', half=(inn-1)*2+(isBot?1:0);
    const lead=()=>score[bk]-score[opp(bk)];
    if(fs.cur&&needChange(fs))bringIn(fs,inn,-lead(),half);
    if(inn>=8&&-lead()>=1&&-lead()<=3&&!fs.dsub){ fs.dsub=1; const n=defSub(fs); if(n){fs.changes.push({at:pbp.length,half,lineup:fs.order.map((p,o)=>({id:p.id,n:p.name,o,pos:fs.posOf[p.id]}))});if(ev.length<400)ev.push({h:half,t:`수비 강화: ${n}`});} }
    if(inn>=7&&Math.abs(lead())>=7&&!fs.bsub){ fs.bsub=1; const n=blowSub(fs); if(n){fs.changes.push({at:pbp.length,half,lineup:fs.order.map((p,o)=>({id:p.id,n:p.name,o,pos:fs.posOf[p.id]}))});if(ev.length<400)ev.push({h:half,t:`주전 휴식 교체: ${n}`});} }
    let outs=0,runs=0,hh=0,runnerSeq=0;const ueR=new Set(),base=[null,null,null],resp=new Map(),runnerRefs=new Map(),earnedViews=new Map(),pendingRuns=new Map();
    const earnedBase=()=>base.map(r=>r?runnerRefs.get(r.id):null);
    /* 각 책임 투수의 가상 이닝을 별도로 잇는다. 구원투수는 실제 등판 당시의 아웃·주자로 시작한다. */
    function earnedPlay(play){for(const v of earnedViews.values()){
      if(!v.error&&!play.error){v.base=earnedBase();v.outs=outs;for(const r of play.actualScored||[])v.scored.add(r.key);continue;}
      if(v.outs>=3)continue;v.error=true;const before=v.base;
      const batOut=play.error||play.o==='K'||play.o==='SAC'?1:play.o==='OUT'?(play.dp&&before[0]?2:1):play.o==='CS'&&before.some(r=>r?.key===play.runner.key)?1:0;
      const z=earnedBasesStep(before,play);v.outs+=batOut;if(v.outs<3)for(const r of z.scored)v.scored.add(r.key);
      for(const m of play.moves||[])if(m.result==='out'&&!(play.fc&&m.id===play.outRunner)&&before[m.from-1]?.id===m.id)v.outs++;
      v.base=z.base;
    }}
    function awardEarned(){const q=[];for(const [key,r] of pendingRuns){if(!earnedViews.get(r.q)?.scored.has(key))continue;const box=fs.box.get(r.q);if(box){box.er++;q.push(r.q);}pendingRuns.delete(key);}return q;}
    while(outs<3){
      /* 도루: KBO 2024~25 구단 평균 시즌 120~140개, 성공률 72~75%, 1위 50~65개 수준에 맞춘다. 2루 도루가 대부분이고 빠른 주자는 3루도 노린다 */
      if(base[1]&&!base[2]&&base[1].r.spd>=60&&R()<(base[1].r.spd-57)*.0045*(.65+mgrOf(bs.tid).small/100*.9)*stealTry(fs)*(outs<2?1:.3)){ /* 2아웃 3루 도루는 드물다(안타 하나면 2루에서도 홈인), 검수 11-09zt */
        const r=base[1],rb=bs.box.get(r.id);if(R()<clamp(.6+(r.r.spd-60)*.008+coachRunAdj(bs.tid)+stealAdj(r,fs),.4,.92)){rb.sb++;base[2]=r;base[1]=null;earnedPlay({o:'SB',runner:runnerRefs.get(r.id),from:2,to:3});if(pbp.length<1000)pbp.push([half,'SB',r.id,outs,base.map(x=>x?x.id:0)]);}else{rb.cs++;base[1]=null;outs++;fs.box.get(fs.cur.id).outs++;earnedPlay({o:'CS',runner:runnerRefs.get(r.id),from:2,to:3});if(pbp.length<1000)pbp.push([half,'CS',r.id,outs,base.map(x=>x?x.id:0)]);continue;}}
      if(base[0]&&!base[1]&&base[0].r.spd>=45&&R()<Math.min(.36,(base[0].r.spd-41)*.0105)*(.65+mgrOf(bs.tid).small/100*.9)*stealTry(fs)*(outs<2?.85:.45) /* 2아웃 도루도 시도(검수 11-09zt). 시즌 도루 수는 전과 같게 무게를 나눴다 */){
        const r=base[0],rb=bs.box.get(r.id);if(R()<clamp(.65+(r.r.spd-50)*.007+coachRunAdj(bs.tid)+stealAdj(r,fs),.35,.92)){rb.sb++;base[1]=r;base[0]=null;earnedPlay({o:'SB',runner:runnerRefs.get(r.id),from:1,to:2});if(pbp.length<1000)pbp.push([half,'SB',r.id,outs,base.map(x=>x?x.id:0)]);}else{rb.cs++;base[0]=null;outs++;fs.box.get(fs.cur.id).outs++;earnedPlay({o:'CS',runner:runnerRefs.get(r.id),from:1,to:2});if(pbp.length<1000)pbp.push([half,'CS',r.id,outs,base.map(x=>x?x.id:0)]);continue;}}
      const b=bs.order[bs.idx%bs.order.length]; bs.idx++;
      const p=fs.cur; const xb=bs.box.get(b.id), xp=fs.box.get(p.id);
      const pc0=xp.pc;xb.pa++;xp.bf++;xp.pc+=Math.min(Math.max(1,Math.round(N(3.9-(cc(p.r.ctl,0)-.5)*PW.eff,1.3))),fs.curIsSP&&armDirOn(fs.tid)&&!(fs.armEmergency||[]).some(x=>x.id===p.id)?Math.max(1,95-pc0):99);resp.set(b.id,p.id);let eRun=false;ueR.delete(b.id);const batterRef={id:b.id,key:++runnerSeq,q:p.id};runnerRefs.set(b.id,batterRef);if(!earnedViews.has(p.id))earnedViews.set(p.id,{base:earnedBase(),outs,error:false,scored:new Set()});
      const before=lead();const sc=[];let dp=false,o=null,xFO=null,xFB=0,bunt=null;RSP0=!!(base[1]||base[2]);/* 모든 타석의 시작 상황. 번트도 직전 타석의 값을 쓰지 않는다. */
      /* 희생번트: 스몰볼 감독이 무사 1루(1·2루) 접전에서 하위 타선에게 시킨다. 빅볼 감독은 거의 대지 않는다 */
      if(outs===0&&base[0]&&!base[2]&&inn<=10){ const mm=mgrOf(bs.tid), sm=mm.interim?50:mm.small, slot=(bs.idx-1)%9; const close=before>=-2&&before<=1;
        const pr=sm<=40?0:(sm-40)/60*(close?(inn>=7?.85:.36):.07)*(slot>=6||offV(b)<45?1:.25)*(base[1]?.7:1);
        if(R()<pr){ const r=R();
          if(r<.7){o='SAC';bunt='sac';outs++;xp.outs++;xb.sh=(xb.sh||0)+1;base[2]=base[1];base[1]=base[0];base[0]=null;}
          else if(r<.8){o='1B';bunt='hit';xb.ab++;xb.h++;xp.h++;hh++;base[2]=base[1];base[1]=base[0];base[0]=b;}
          else if(r<.9){o='OUT';bunt='out';xb.ab++;outs++;xp.outs++;}
          else{o='OUT';bunt='fc';xb.ab++;outs++;xp.outs++;const fo=base[1]||base[0],fb=base[1]?3:2;if(base[1])base[1]=base[0];base[0]=b;if(fo){resp.set(b.id,resp.get(fo.id)??p.id);if(ueR.has(fo.id)){ueR.delete(fo.id);ueR.add(b.id);}xFO=fo;xFB=fb;if(ev.length<400)ev.push({h:half,t:`${b.name} 번트 실패 · ${fo.name} ${fb}루 포스아웃`});}}}}
      if(o){batterRef.q=resp.get(b.id)??p.id;earnedPlay({o,b:batterRef,bunt,fc:bunt==='fc',outBase:xFB||1,outRunner:xFO?.id});const correction=awardEarned();if(!ps){W.push([splAdd,b,p,o==='SAC'?'SAC':o,null,RSP0,b.team===PARK],[sprAdd,b,p,o==='1B'?'1B':'OUT',{pos:'3B',t:'GB'}]);}const rec=trace(half,b,p,'SAC',xp.pc-pc0);if(rec)xp.pc=pc0+rec.pitches.length;if(pbp.length<1000){const row=[half,b.id,p.id,o,outs,base.map(x=>x?x.id:0),0,score.a,score.h];if(correction.length){row[9]=0;row[10]=[];row[11]=correction;row[12]=row[13]=0;}if(rec)row[15]=rec;if(xFO){row[16]=xFO.id;row[14]=[{id:xFO.id,from:xFB-1,to:xFB,result:'out'}];}row[18]={bunt,fc:bunt==='fc',error:false,fielder:'3B',bipType:'GB',outBase:bunt==='hit'?null:xFB||1,outRunner:bunt==='hit'?null:xFO?.id??b.id,ab:o==='SAC'?0:1};pbp.push(row);}if(ev.length<400&&o==='SAC')ev.push({h:half,t:`${b.name} 희생번트`});if(outs<3&&fs.box.get(fs.cur.id).pc>lim(fs)+armM(fs))bringIn(fs,inn,-lead(),half,base.filter(Boolean).length);continue;}
      CLUTCH=Math.min(1.1,((base[1]||base[2])?.5:0)+(inn>=7&&Math.abs(before)<=2?.4:0)+(ps?.4:0)); /* 득점권 · 7회 이후 2점 차 이내 · 포스트시즌 */
      o=outcome(b,p,fs.defv,Math.max(0,xp.pc-(PW.ft0+p.r.sta*PW.fts))/PW.ftd-PW.fm+ttoPen(p,xp.bf),fs);let eFld=0,ePos=null,paFC=false,paOutBase=null,paOutRunner=null;
      const rec=trace(half,b,p,o,xp.pc-pc0);xp.pc=pc0+(rec?rec.pitches.length:Math.max(o==='BB'?4:o==='K'?3:1,xp.pc-pc0)); /* 공별 기록을 꺼도 볼넷 4구·삼진 3구 최소 투구 수는 같게(buildPitchSequence와 같은 규칙): 기록 옵션이 경기 결과를 바꾸지 않게(검수 11-09zt) */
      let chg=null,chgE=null,rbiN=0,sfN=0;const moves=[];const PB=()=>{if(pbp.length<1000){const r=[half,b.id,p.id,dp?'DP':o,outs,base.map(x=>x?x.id:0),sc.length,score.a,score.h];if(eFld||chg)r.push(eFld||0);if(chg)r.push(chg,chgE,rbiN,sfN);if(moves.length)r[14]=moves;if(rec)r[15]=rec;if(options&&options.bipLog&&LBIP&&o!=='K'&&o!=='BB'&&o!=='HBP')r[17]=LBIP.t+':'+LBIP.pos;if(o==='OUT')r[18]={fc:paFC,error:eRun,fielder:ePos||LBIP?.pos||null,bipType:LBIP?.t||null,outBase:paFC?paOutBase:!eRun&&!dp?1:null,outRunner:paFC?paOutRunner:!eRun&&!dp?b.id:null,ab:sfN?0:1};pbp.push(r);}};
      const b0=base.slice(); /* 타석 전 주자 위치: 끝내기 결승 주자가 몇 루에서 출발했는지 */ const advanceRunner=(r,from,to,chance,spd)=>{if(isBot&&inn>=9&&score[bk]+sc.length>score[opp(bk)])return 'hold'; /* 결승점이 들어오면 경기 끝: 뒤 주자의 추가 진루·아웃은 없다(검수 11-09k) */const z=runAdvance(r,fs,{base:chance,from,to,spd,outs});if(!z.send)return 'hold';const result=z.safe?'safe':'out';moves.push({id:r.id,from,to,result});if(!z.safe){outs++;xp.outs++;}if(ev.length<400)ev.push({h:half,t:`주루 판단: ${r.name} ${from}루 → ${to===4?'홈':to+'루'} ${z.safe?'진루':'아웃'}`});return result;};
      if(o==='BB'||o==='HBP'){ const key=o==='HBP'?'hbp':'bb';xb[key]++; xp[key]++; if(base[0]){ if(base[1]){ if(base[2])sc.push(base[2]); base[2]=base[1]; } base[1]=base[0]; } base[0]=b; }
      else { xb.ab++;
        if(o==='K'){ xb.so++; xp.so++; outs++; xp.outs++; }
        else if(o==='OUT'){
          const BT=LBIP&&LBIP.t; const eL=LBIP&&(ERRW[LBIP.pos]||LBIP.pos==='P')&&fielderAt(fs,LBIP.pos)?[fielderAt(fs,LBIP.pos),LBIP.pos]:errLoc(fs); if(R()<errChance(eL,BT==='GB')*(BT?({GB:1.75,LD:.27,FB:.44,PU:.27})[BT]:1)){ xp.roe=(xp.roe||0)+1;eRun=true;ueR.add(b.id);{ const ef=eL; if(ef){eFld=ef[0].id;ePos=ef[1]; const eb=fs.box.get(ef[0].id); if(eb)eb.e=(eb.e||0)+1; if(ev.length<400)ev.push({h:half,t:`실책: ${POSK[ef[1]]||(ef[1]==='P'?'투수':ef[1])} ${ef[0].name}`}); } } if(base[2])sc.push(base[2]); base[2]=base[1]; base[1]=base[0]; base[0]=b; }
          else if(base[0]&&outs<2&&(!BT||BT==='GB')&&R()<(BT?DP_GB:.11)*dpF(b,p,fs)){ dp=true; outs+=2; xp.outs+=2; base[0]=null; if(outs<3){ if(base[2])sc.push(base[2]); base[2]=base[1]; base[1]=null; } } /* 2루·1루 병살(6-4-3): 3루 주자는 홈인, 2루 주자는 3루로(병살 득점은 타점 아님, 9.04(b)) */
          else if(outs<2&&BT==='GB'&&base[0]){ outs++; xp.outs++; const r1=base[0]; /* 땅볼 아웃의 1루 주자는 포스: 2루로 가거나(타자 1루 아웃), 2루에서 잡히고 타자가 1루에 남는다(야수 선택). 11-15 전에는 1루에 그대로 서 있었다 */
            if(base[1]){ if(base[2]){ sc.push(base[2]); moves.push({id:base[2].id,from:3,to:4,result:'safe'}); } moves.push({id:base[1].id,from:2,to:3,result:'safe'}); base[2]=base[1]; base[1]=null; } /* 1·2루(만루)면 앞 주자도 밀려 간다 */
            else if(base[2]){ const z=advanceRunner(base[2],3,4,.22,.003); if(z==='safe')sc.push(base[2]); if(z!=='hold')base[2]=null; } /* 1·3루: 3루 주자는 포스가 아니라 예전처럼 판단 */
            if(R()<FC_GB){paFC=true;paOutBase=2;paOutRunner=r1.id;resp.set(b.id,resp.get(r1.id)??p.id);if(ueR.has(r1.id)){ueR.delete(r1.id);ueR.add(b.id);}moves.push({id:r1.id,from:1,to:2,result:'out'});base[0]=b;}
            else { moves.push({id:r1.id,from:1,to:2,result:'safe'}); base[1]=r1; base[0]=null; } }
          else { outs++; xp.outs++; if(outs<3&&base[2]&&(BT!=='PU'||!G.coach)){const z=advanceRunner(base[2],3,4,BT==='PU'?0:BT==='GB'?.22:BT==='LD'?.6:BT?.9:.4,.003);if(z==='safe'){sc.push(base[2]);if(BT!=='GB'){xb.ab--;xb.sf=(xb.sf||0)+1;sfN=1;}}if(z!=='hold')base[2]=null;} /* 희생플라이는 실제 득점한 때만 기록한다. 태그업 아웃은 추가 수비 아웃 */ if(outs<3&&base[1]&&!base[2]&&(BT!=='PU'||!G.coach)){const z=advanceRunner(base[1],2,3,.3,.003);if(z==='safe')base[2]=base[1];if(z!=='hold')base[1]=null;} }
        } else { xb.h++; xp.h++; hh++;
          if(o==='HR'){ xb.hr++; xp.hr++; sc.push(...[base[2],base[1],base[0]].filter(Boolean),b); /* 앞 주자부터 홈인: 결승 주자·패전 판정 */ base[0]=base[1]=base[2]=null; }
          else if(o==='3B'){ xb.tr++; sc.push(...[base[2],base[1],base[0]].filter(Boolean)); /* 앞 주자부터 홈인(끝내기 결승 주자 판정) */ base[0]=base[1]=null; base[2]=b; }
          else if(o==='2B'){ xb.d++; if(base[2])sc.push(base[2]); if(base[1])sc.push(base[1]); const r1=base[0]; base[0]=base[1]=base[2]=null; if(r1){const z=advanceRunner(r1,1,4,.46,.006);if(z==='safe')sc.push(r1);else if(z==='hold')base[2]=r1;} base[1]=b; }
          else { if(base[2])sc.push(base[2]); base[2]=null;
            if(base[1]){const z=advanceRunner(base[1],2,4,.66,.006);if(z==='safe')sc.push(base[1]);else if(z==='hold')base[2]=base[1];base[1]=null;}
            if(base[0]){if(outs<3&&!base[2]){const z=advanceRunner(base[0],1,3,.31,.005);if(z==='safe')base[2]=base[0];else if(z==='hold')base[1]=base[0];}else base[1]=base[0];base[0]=null;}
            base[0]=b; }
        }
      }
      if(sc.length&&isBot&&inn>=9&&o!=='HR'){ const need=score[opp(bk)]-score[bk]+1; { const hb={'1B':1,'2B':2,'3B':3}[o], wr=need>=1&&sc[need-1], adv=wr?3-b0.indexOf(wr):9; if(hb>adv){ if(o==='2B')xb.d--; else xb.tr--; o=adv>=2?'2B':'1B'; if(o==='2B')xb.d++; const k=adv>=2?2:1, home=sc.slice(0,need); base[0]=base[1]=base[2]=null; b0.forEach((r,i)=>{ if(r&&!home.includes(r))base[Math.min(2,i+k)]=r; }); base[k-1]=b; for(const m of moves)if(m.to===4&&!home.includes(G.players[m.id]))m.to=Math.min(3,m.from+k); } } /* 타자는 정정한 루타의 베이스에, 뒤 주자는 같은 만큼만 진루(검수 11-09zt) */ /* 끝내기 안타: 결승 주자가 전진한 베이스 수까지만 타자 루타(KBO·MLB 기록규칙 9.06(f), 검수 11-09k) */ if(need>=1&&sc.length>need){ sc.length=need; const kept=new Set(sc.map(r=>r.id)); for(let i=moves.length-1;i>=0;i--){ const m=moves[i]; if(m.to===4&&m.result==='safe'&&!kept.has(m.id)){ m.to=Math.min(3,m.from+1); if(m.to<=m.from)moves.splice(i,1); } } } } /* 결승점 뒤 주자의 홈 질주 기록도 정리: 문자·그래픽 중계가 같은 경로(검수 11-08) */ /* 홈런이 아닌 끝내기는 결승점까지만 인정 */
      if(!ps){ if(LBIP)W.push([sprAdd,b,p,o,LBIP]); W.push([splAdd,b,p,o,sfN?'SF':null,RSP0,b.team===PARK]); } /* 타구 지도도 끝내기 루타 조정 뒤(검수 11-09zf) */ /* 박스스코어와 같은 기준으로 좌우 기록(끝내기 루타 조정 뒤) */
      batterRef.q=resp.get(b.id)??p.id;earnedPlay({o,b:batterRef,error:eRun,dp,fc:paFC,outBase:paOutBase,outRunner:paOutRunner,sf:sfN,bipType:LBIP?.t,moves,actualScored:sc.map(r=>runnerRefs.get(r.id))});
      if(sc.length){
        const n=sc.length;sc.forEach(r=>bs.box.get(r.id).r++);chg=sc.map(r=>resp.get(r.id)??p.id);rbiN=!dp&&!eRun?n:0;if(!dp&&!eRun)xb.rbi+=n;for(const r of sc){const q=resp.get(r.id)??p.id,pb=fs.box.get(q)||xp;pb.r=(pb.r||0)+1;if(!ueR.has(r.id)){const ref=runnerRefs.get(r.id);pendingRuns.set(ref.key,{q});}ueR.delete(r.id);}chgE=awardEarned();score[bk]+=n;runs+=n;PB();
        const after=lead(); if(after>=0){ const B=fs.blown=fs.blown||{}; B[fs.cur.id]=1; if(-before>=1)B[chg[-before-1]]=1; } /* 동점 주자를 내보낸 앞 투수도 홀드 없음(검수 11-09zt) */ /* 마운드에 있는 동안 리드(동점 포함)를 잃은 투수: 뒤에 타선이 재역전해도 홀드가 없다(검수 11-06) */ if(before<=0&&after>0){ wc[bk]=bs.cur; const gr=sc[-before]; const lp=gr&&resp.has(gr.id)?G.players[resp.get(gr.id)]:null; lc[opp(bk)]=lp&&fs.pitchers.includes(lp.id)?lp:fs.cur; } /* 패전은 결승 주자를 내보낸 투수 */
        const kind={HR:n===4?'만루 홈런':`${n}점 홈런`,'3B':'3루타','2B':'2루타','1B':'적시타',BB:'밀어내기 볼넷',HBP:'밀어내기 사구',OUT:eRun?'상대 실책':sfN?'희생플라이':'내야 땅볼',K:''}[o]; /* 득점한 땅볼은 희생플라이가 아니다 */
        if(ev.length<400)ev.push({h:half,t:`${b.name} ${kind}${o!=='HR'?` (${n}점)`:''} · ${score.a}:${score.h}`,run:true});
        if(isBot&&inn>=9&&score.h>score.a){ walk=true; break; }
      }else{const correction=awardEarned();if(correction.length){chg=[];chgE=correction;}PB();}
      if(outs<3&&fs.box.get(fs.cur.id).pc>lim(fs)+armM(fs))bringIn(fs,inn,-lead(),half,base.filter(Boolean).length);
      else if(outs<3&&inn>=8){ const nr=base.filter(Boolean).length, k=lateFire(fs,-lead(),nr); if(k&&bringIn(fs,inn,-lead(),half,nr,k)!==false&&ev.length<400)ev.push({h:half,t:k==='cl'?'마무리 강판: 리드를 지키지 못했습니다':'흔들리는 불펜을 내리고 필승조 투입'}); } /* 경기 후반 불 끄기(lateFire) */
    }
    line[bk].push(runs); hits[bk].push(hh);
  }
  const maxInn=ps?(ps.noTie?99:15):11; let inn=1; /* noTie: 무승부가 쌓인 포스트시즌 시리즈의 남은 경기는 승부가 날 때까지(검수 11-09zo) */
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
  /* 세이브·홀드 조건(KBO 기록규칙 9.19·홀드 준용): 리드 1~3점에 등판해 1이닝 이상, 또는 동점 주자가 누상·타석·대기 타석일 때 등판해 아웃 1개 이상, 또는 리드한 채 3이닝 이상 효과적으로(3이닝 2실점 이하 비율) */
  const svQ=(s,id)=>{ const el=s.entry[id], x=s.box.get(id)||{}, o=x.outs||0; return el!=null&&el>=1&&((el<=3&&o>=3)||(el<=((s.entryR||{})[id]||0)+2&&o>=1)||(o>=9&&(x.r||0)*9<=o*2)); };
  if(winK){ const loseK=opp(winK); const ws=S[winK]; let w=wc[winK]||ws.sp; let l=lc[loseK]||S[loseK].sp;
    if(w===ws.sp&&ws.box.get(w.id).outs<15&&ws.pitchers.length>1){ const ef=q=>{ const x=ws.box.get(q.id); return x.outs-3*(x.r||0); }, rel=ws.pitchers.slice(1).map(id=>G.players[id]).filter(Boolean).sort((a,b)=>ef(b)-ef(a))[0]; /* 선발이 5이닝 미만: 가장 효과적인 구원(아웃 수에서 실점마다 1이닝을 뺀 값, 야구규칙 9.17(b), 검수 11-09zt) */ if(rel)w=rel; }
    dec.w=w.id; dec.l=l.id;
    const fin=G.players[ws.pitchers[ws.pitchers.length-1]];
    if(fin&&fin.id!==w.id&&fin!==ws.sp&&svQ(ws,fin.id))dec.sv=fin.id; /* 세이브: 끝까지 리드를 지킨 마무리 */
  }
  /* 홀드: 세이브 조건을 채우고 리드를 지킨 채 내려간 중간 투수. 무승부 경기에도 기록한다(KBO 사례) */
  { dec.hld=[]; for(const k of ['h','a']){ const s=S[k]; s.pitchers.slice(1).forEach(id=>{ if(id===dec.w||id===dec.l||id===dec.sv||id===s.pitchers[s.pitchers.length-1])return; /* 패전투수는 홀드 없음 */ const xl=s.exit[id]; if(svQ(s,id)&&xl!=null&&xl>=1&&!(s.blown&&s.blown[id]))dec.hld.push(id); }); } }
  CLUTCH=0; return {S,score,line,hits,ev,dec,inn,walk,pbp,broadcast,W}; /* W(좌우·타구 기록)는 applyGame에서 쓴다 */
}
/* 실제 수비 위치는 선발·교체표 전체에서 경기당 한 번씩 센다. 선발 g/pos/slot 장부는 그대로 둔다. */
function gameFieldPositions(s){ const M=new Map(),add=(id,pos)=>{ const p=G.players[id]; if(!p||p.isP||!s.box.has(id)||!ORDER.includes(pos))return; if(!M.has(id))M.set(id,new Set()); M.get(id).add(pos); }; for(const x of s.start||[])add(x.id,x.pos); for(const c of s.changes||[])for(const x of c.lineup||[])add(x.id,x.pos); for(const p of s.order||[])add(p.id,s.posOf[p.id]); return M; }
function gameFieldRecord(s,y){ for(const [id,positions] of gameFieldPositions(s)){ const p=G.players[id],u=p.use&&p.use.y===y?p.use:(p.use={y,g:0,pos:{},slot:{}}); if(!u.fpos){ u.fpos=Object.assign({},u.pos); u.fOf=['LF','CF','RF'].reduce((n,k)=>n+(u.pos[k]||0),0); } for(const pos of positions)u.fpos[pos]=(u.fpos[pos]||0)+1; if(['LF','CF','RF'].some(k=>positions.has(k)))u.fOf=(u.fOf||0)+1; } }
function applyGame(day,hid,aid,g,ps){
  if(!ps)relPlayGame(g,day); /* 실제 정규시즌 기용은 당시 감독 개인에게만 귀속(검수 #933). */
  let turfM=1; try{ turfM=stadTurfM(hid); }catch(e){}
  const y=G.year;
  for(const k of ['h','a']){ const s=g.S[k]; if(!ps)gameFieldRecord(s,y); const bm=k==='a'?1+BUS[busLv(s.tid)].f:1; /* 원정 이동 피로 */
    for(const [id,x] of s.box){ const p=G.players[id]; if(!p)continue;
      if(!ps){if(!p.isP)broadcastFormUpdate(p,x);storyGame(p,x,day,g.S[k==='h'?'a':'h'].tid,g.dec,{runsAllowed:g.score[k==='h'?'a':'h'],solo:s.pitchers.length===1});}
      if(p.isP){ const cid=s.cId; if(cid!=null&&cid!==p.id){ const C=p.chem=p.chem||{}; C[cid]=(C[cid]||0)+1; const ks=Object.keys(C); if(ks.length>6){ ks.sort((a,b2)=>C[a]-C[b2]); delete C[ks[0]]; } } /* 배터리 호흡 기록 */ const cd=pitchApp(p,day,x.pc,id===s.sp?.id); const lm=loadMult(p,cd,day);
        p.fat=clamp((p.fat||0)+pitFatGain(p,x.pc,id===s.sp?.id)*bm,0,100); /* 체력이 좋으면 같은 투구 수에도 덜 지친다 */ if(!ps)p.wear=(p.wear||0)+x.pc/15; if(!ps){ (p.l10=p.l10||[]).push([x.outs,x.er,x.h,x.bb,x.so]); if(p.l10.length>10)p.l10.shift(); }
        if(!ps){ const h=lineFor(p,y,s.tid,'1군'); const o={g:1,gs:id===s.sp?.id?1:0,outs:x.outs,h:x.h,hr:x.hr,bb:x.bb,hbp:x.hbp||0,so:x.so,er:x.er,w:g.dec.w===id?1:0,l:g.dec.l===id?1:0,sv:g.dec.sv===id?1:0,hld:(g.dec.hld||[]).includes(id)?1:0,bf:x.bf||0,roe:x.roe||0,e:x.e||0}; addTo(h,o); /* 실책 출루도 시즌 기록에(수비 타구 처리율, 검수 11-08) */ glAdd(p,day,x); }
        /* 부상 빈도: KBO 구단당 시즌 부상 이탈 7~10건 수준. 부상 병동(체질 .3 이상)은 해마다 한두 번 빠진다 */ const risk=p.inj*(id===s.sp?.id?.075*(x.pc||0)/95:.026*(x.pc||0)/17)*injMult(p)*staI(p)*turfM*(1+Math.max(0,(p.fat||0)-60)/50)*(id===s.sp?.id?1+Math.max(0,(x.pc||0)-100)/60:1)*lm/LOAD_NORM, hit=R()<risk; if(injGameRisk(p,day)||hit)injure(p,day,{sp:id===s.sp?.id,pc:x.pc||0,load:lm}); if(p.injFx&&!(p.injOut>0)){ p.injPlay=day; injRecover(p,x.outs||0); } /* 포스트시즌도 실전량이다. 결장 요청 강행 위험은 실제 등판 때만 적용하고 기존 난수 호출은 보존한다. */
      } else {
        if(!ps){ const h=lineFor(p,y,s.tid,'1군'); addTo(h,Object.assign({g:1},x)); { const ps0=s.posOf[id]||p.pos; h.pp=h.pp||{}; h.pp[ps0]=(h.pp[ps0]||0)+(x.pa||0); h.pos=ppTop(h.pp)||ps0; } /* 포지션별 타석을 쌓고 대표 포지션은 가장 많이 뛴 자리 */ glAdd(p,day,x); }
        /* 선발 출장: 수비 강화로 빠진 선수는 선발로 치고, 교체로 들어온 선수는 선발이 아니다 */
        const sIn=s.subIn&&s.subIn[id]!=null, sOut=s.outI&&s.outI[id]!=null;
        if(!ps){ const i=sIn?-1:sOut?s.outI[id]:s.order.findIndex(q=>q.id===id); if(i>=0){ const u=(p.use&&p.use.y===y)?p.use:(p.use={y,g:0,pos:{},slot:{}}); u.g++; const ps_=s.posOf[id]||'DH'; u.pos[ps_]=(u.pos[ps_]||0)+1; u.slot[i+1]=(u.slot[i+1]||0)+1; } }
        if(sOut||s.order.some(q=>q.id===id)){ p.fat=clamp((p.fat||0)+((s.posOf[id]==='C'?15:s.posOf[id]==='DH'?6:10)-(p.r.vit||52)*.04)*bm*(sIn?.3:sOut?.85:1),0,100); if(!ps&&!sIn)p.wear=(p.wear||0)+1; if(!ps&&(!sIn||(x.pa||0)>0)){ (p.l10=p.l10||[]).push([x.ab,x.h,x.hr,x.bb,x.rbi,x.d+x.tr*2+x.hr*3,x.sf||0,x.hbp||0]); if(p.l10.length>10)p.l10.shift(); } } /* 교체 출전도 타석에 섰으면 최근 경기에 넣는다 */
        const injured=R()<p.inj*.026*injMult(p)*turfM*(1+Math.max(0,(p.fat||0)-60)/60)*(sIn?.3:sOut?.85:1); if(injGameRisk(p,day)||injured)injure(p,day,{hbp:x.hbp||0});
        else if(p.injFx){ p.injPlay=day; injRecover(p,x.pa??((x.ab||0)+(x.bb||0))); } /* 사구·희생타도 실전 타석(검수 11-06) */
      }
    }
  }
  if(ps)hypePostGame(g); /* 공개 띄우기 평가는 포스트시즌 실전 기록도 포함 */
  for(const [f,...a] of g.W||[])f(...a); for(const k of ['h','a'])if(g.S[k].rot!=null)team(g.S[k].tid).rot=g.S[k].rot; /* 좌우·타구 기록과 선발 순번은 선수 반영이 끝난 뒤: 반영 중 오류로 미룬 경기(boxSnap 되돌림)에 남지 않게(검수 11-09zt) */
  if(!ps){ try{ featGame(day,g); }catch(e){} }
  if(!ps){ const r=G.sea.rec; if(g.score.h>g.score.a){r[hid].w++;r[aid].l++;} else if(g.score.a>g.score.h){r[aid].w++;r[hid].l++;} else {r[hid].t++;r[aid].t++;}
    const tl=G.sea.tl||(G.sea.tl=G.teams.map(()=>[])); const sg=Math.sign(g.score.h-g.score.a); const hrOf=k=>{ let n=0; for(const [id,x] of g.S[k].box)if(!g.S[k].pitchers.includes(id))n+=x.hr||0; return n; }; const hh=hrOf('h'), ha=hrOf('a');
    tl[hid].push([sg,g.score.h,g.score.a,1,aid,day,hh,ha]); tl[aid].push([-sg,g.score.a,g.score.h,0,hid,day,ha,hh]); }
}
function injure(p,day,ctx){ ctx=ctx||{}; day=day??G.day;
  const reg=p.team===G.user&&(period()==='season'||period()==='post')&&!(p.injOut>0)&&isRegular(p); /* 경고와 결정 모두 진단 전에 본 주전 여부를 쓴다. */
  const k=injPick(p,ctx); const I=INJ[k]; let days=ri(I.d[0],I.d[1]); days=Math.max(3,Math.round(days*(I.d[0]>=240?Math.sqrt(recMult(p)):recMult(p))));
  const episode=injStart(p,{days,day,k,hosp:p.team!=null&&!milServing(p)?medOf(p.team).hosp:'none',extra:{farm:!!ctx.farm}}); if(days>=40)p.inj=Math.min(.45,p.inj+.02); /* 퓨처스 소급 진단도 실제 다친 날을 쓴다. */
  if(I.ucl)p.ucl=1; if(I.tj)delete p.ucl; delete p.reInj;
  const fx=injApply(p,k,days);fx.injId=episode.id;
  const ret=injRetTxt(p), seasonOut=period()==='season'&&G.day+p.injOut>(G.cal.end||KD(10,5));
  if(days>=30)story(p,`${I.n}(으)로 약 ${days>=300?Math.round(days/30)+'개월':days+'일'} 이탈`,'inj');
  if(p.team===G.user&&days>=30&&period()==='season'&&(ovr(p)>=55||p.sal>=800))news('선수',`${tshort(G.user)} 악재, ${p.name} ${I.surg?'수술':'장기 이탈'}`,`${p.name}이(가) ${I.n}(으)로 ${days>=300?Math.round(days/30)+'개월':'약 '+days+'일'} 빠집니다.${seasonOut?' 사실상 시즌 아웃입니다.':''}`,-1,{ref:p.id});
  else if(p.team!==G.user&&I.surg&&days>=200&&ovr(p)>=55)wire('부상',`${tshort(p.team)} ${p.name}, ${I.n}`,{tid:p.team,ref:p.id});
  if(p.team!=null)p.mor=clamp((p.mor??60)-4,0,100); /* 부상 기분 하락은 모든 구단 같은 값(전에는 우리 선수만) */
  if(p.team===G.user){ const H=HOSP[milServing(p)?'none':G.med.hosp]; const len=days>=300?`약 ${Math.round(days/30)}개월`:`${H.dx?'':'약 '}${days}일`;
    const fxT=I.tj?' 복귀까지 보통 12~16개월이 걸리고, 복귀 첫해에는 제구가 흔들리는 경우가 많습니다. 구속은 떨어지는 선수가 더 많지만 젊으면 오히려 오르기도 합니다.':I.perm&&I.d[0]>=90?' 수술 뒤 예전 몸 상태를 완전히 되찾지 못할 수도 있습니다.':I.re?' 복귀 직후 재발이 잦은 부위입니다.':'';
    const msg=`${p.name}(${posLabel(p)})이(가) ${I.n}(으)로 ${len} 이탈합니다. 예상 복귀 ${ret}.${seasonOut?' 올 시즌은 사실상 끝났습니다.':''}${fxT}${H.c?` ${H.name}에서 치료합니다.`:''}${H.dx?` 정밀 검진 결과 재발 위험은 ${p.inj>.24?'높은':p.inj>.15?'보통':'낮은'} 편입니다.`:''}`;
    const m=!ctx.farm&&((days>=10&&reg)||days>=30)?stop('부상',msg,p.id):note('부상',(ctx.farm?'[퓨처스] ':'')+msg,p.id); if(m)m.injId=episode.id; }
  if(!I.surg)try{ evInjury(p,days,reg); }catch(e){}
  if(p.team===G.user&&days>=30&&!ctx.farm&&ovr(p)>=58)try{ ivRequest('injury',{pid:p.id,days}); }catch(e){}
}
const PRE_B=['pa','ab','h','d','tr','hr','bb','hbp','so','sf'], PRE_P=['outs','er','h','bb','hbp','so','hr'];
function gameRecord(day,hid,aid,g,kind){
  const side=k=>{ const s=g.S[k]; return {tid:s.tid,lineup:s.start,changes:s.changes||[],armEmergency:(s.armEmergency||[]).map(x=>({...x,finalPc:s.box.get(x.id)?.pc||0})),bat:[...s.order,...(s.out||[])].map((p,i)=>{const x=s.box.get(p.id);return {id:p.id,n:p.name,bt:p.bt,o:s.outI&&s.outI[p.id]!=null?s.outI[p.id]:i,pos:(s.out||[]).includes(p)?null:s.posOf[p.id],pa:x.pa,ab:x.ab,h:x.h,d:x.d,tr:x.tr,hr:x.hr,rbi:x.rbi,bb:x.bb,hbp:x.hbp||0,so:x.so,r:x.r,sb:x.sb,cs:x.cs||0,sf:x.sf||0,sh:x.sh||0,e:x.e||0,pre:preOf(p.id,PRE_B,x)}}),
    pit:s.pitchers.map(id=>{const x=s.box.get(id);const p=G.players[id];return {id,n:p?p.name:'',th:p?p.th:undefined,outs:x.outs,h:x.h,hr:x.hr,r:x.r||0,er:x.er,bb:x.bb,hbp:x.hbp||0,so:x.so,pc:x.pc,e:x.e||0,d:g.dec.w===id?'승':g.dec.l===id?'패':g.dec.sv===id?'세':(g.dec.hld||[]).includes(id)?'홀':'',pre:preOf(id,PRE_P,x)}})}; };
  /* 중계 시점 기록용: 이 경기 직전 시즌 누계를 함께 남긴다(나중에 다른 구단 상대로 쌓은 기록이 옛 경기 중계에 섞이지 않게, 검수 11-08) */
  function preOf(id,K,x){ if(/차전/.test(kind||''))return undefined; const p=G.players[id], t=p&&seasonTotal(p,dobj(day).y,'1군'); if(!t)return undefined; return K.map(k=>Math.max(0,(t[k]||0)-(x[k]||0))); }
  const me=hid===G.user?'h':'a'; const ms=g.score[me], os=g.score[me==='h'?'a':'h'];
  const rec={gid:G.gSeq=(G.gSeq||0)+1,day,kind,home:hid,away:aid,hs:g.score.h,as:g.score.a,line:g.line,hits:g.hits,ev:g.ev,pbp:g.pbp,broadcast:g.broadcast,incidents:gameIncidents(day,hid,aid,g),box:{h:side('h'),a:side('a')},res:ms>os?'승':ms<os?'패':'무',inn:g.inn,min:gameMin(g)}; /* 경기 시간(95_game_rules: 피치 클락) */
  try{ rec.pg=pgSum(rec,true); }catch(e){} /* 경기 후 전광판: 홈런 순서·결승타·승패 투수 시즌 성적을 기록 시점에 남긴다(문자 기록이 지워진 옛 경기도, 사용자 11-18) */
  return rec;
}
/* 경기 후 전광판 요약(사용자 11-18): 이미 남은 타석 기록(pbp)·박스스코어만 읽는다. 난수·경기 진행과 무관.
   hr: [반이닝, 타자, 득점, 시즌 n호|null] · gw: [반이닝, 타자, 결과, 타석 순번] 이긴 팀이 다시는 따라잡히지 않은 리드를 만든 타석(실책·병살 득점은 결승타 아님) · rec: 결정 투수 시즌 [승,패,세,홀](live: 기록 직후 1군 누계) */
function pgSum(g,live){ const L=g.pbp||[], W=g.hs>g.as?'h':g.as>g.hs?'a':null, hi=PRE_B.indexOf('hr'), cnt={}, hr=[]; let prev=0, gw=null;
  const preHr=id=>{ for(const sd of ['h','a']){ const q=((g.box&&g.box[sd]||{}).bat||[]).find(x=>x.id===id); if(q&&q.pre!=null){ const v=Array.isArray(q.pre)?q.pre[hi]:q.pre.hr; if(v!=null)return v; } } return null; };
  L.forEach((x,k)=>{ if(!x||typeof x[1]!=='number')return; if(x[3]==='HR'){ cnt[x[1]]=(cnt[x[1]]||0)+1; const b=preHr(x[1]); hr.push([x[0],x[1],x[6]||1,b!=null?b+cnt[x[1]]:null]); }
    if(W&&typeof x[7]==='number'){ const ld=W==='h'?x[8]-x[7]:x[7]-x[8]; if(prev<=0&&ld>0){ const sp=x[18]&&typeof x[18]==='object'?x[18]:{}; const ok=x[3]!=='DP'&&!x[9]&&!sp.error&&(x[12]==null||x[12]>0); gw=ok?[x[0],x[1],x[3]==='OUT'?(x[13]?'SF':sp.bipType||'OUT'):x[3],k]:null; } prev=ld; } });
  const o={hr,gw}; if(live&&!/차전/.test(g.kind||'')&&g.box){ const y=dobj(g.day).y; o.rec={}; for(const sd of ['h','a'])for(const q of g.box[sd].pit||[])if(q.d){ const p=G.players[q.id], t=p&&seasonTotal(p,y,'1군'); if(t)o.rec[q.id]=[t.w||0,t.l||0,t.sv||0,t.hld||0]; } }
  return o; }
function keepGame(rec){ G.games.unshift(rec); G.games=G.games.slice(0,25); G.games.forEach((g,i)=>{ if(i>=8&&g.pbp)delete g.pbp; }); }
function ulog(r){ (G.sea.ulog=G.sea.ulog||[]).push({gid:r.gid,d:r.day,h:r.home,a:r.away,hs:r.hs,as:r.as,res:r.res,k:r.kind||'',...(r.dh?{dh:r.dh}:{})});if(r.gid!=null&&!/차전/.test(r.kind||''))for(const tid of [r.home,r.away]){const L=G.sea.tl?.[tid]||[],home=tid===r.home,z=L.find(z=>z[8]===r.gid)||L.find(z=>z[8]==null&&z[5]===r.day&&!!z[3]===home&&z[4]===(home?r.away:r.home)&&z[1]===(home?r.hs:r.as)&&z[2]===(home?r.as:r.hs));if(z){z[8]=r.gid;z[9]=r.dh||0;}} } /* tl 8·9: 이직 뒤에도 경기ID·더블헤더 차전을 복원할 수 있게 남긴다. */


