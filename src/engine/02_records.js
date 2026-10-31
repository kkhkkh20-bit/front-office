/* ===== 기록: 타석 단위로 만든다 ===== */
const cc=(x,b)=>clamp((x+b-20)/60,0,1.25);
function seasonLuck(p){ return p.sf&&p.sf.y===G.year?(p.sf.lk||0):0; }
function batProbs(p,b){ const r=p.r; const be=b*.4, bc=b*.3, bh=b*.55; /* 기세(b)는 인플레이 타구에 주로 실리고 삼진·홈런은 실력대로(한 시즌에도 빨리 안정됨) */
  return {bb:.01+cc(r.eye,be)*.145, k:clamp(.311-cc(r.con,bc)*.17-cc(r.eye,be)*.04-trt(p,'k')*.002,.06,.36), hr:.003+Math.pow(cc(r.pow,bh),1.6)*.06,
    babip:clamp(.268+cc(r.con,b)*.07+cc(r.spd,b)*.035+seasonLuck(p),.22,.39), d2:clamp(.16+cc(r.pow,b)*.08+trt(p,'gap')*.004,.1,.3), d3:.004+cc(r.spd,b)*.025};
}
function simBat(p,pa,b,slot){
  const q=shrinkQ(batProbs(p,b||0),TWB,QCB); /* 경기를 돌리지 않는 기록(아마추어·2군·해외·외국인 이전 리그·옛 시즌)도 1군 경기와 같은 폭으로 능력이 드러나게 */ const o={pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,r:0,rbi:0,sb:0,cs:0};
  for(let i=0;i<pa;i++){ o.pa++; const x=R();
    if(x<q.bb){o.bb++;continue} o.ab++;
    if(x<q.bb+q.k){o.so++;continue}
    if(x<q.bb+q.k+q.hr){o.h++;o.hr++;continue}
    if(R()<q.babip){ o.h++; const y=R(); if(y<q.d3)o.tr++; else if(y<q.d3+q.d2)o.d++; }
  }
  const on=o.h-o.hr-o.d-o.tr+o.bb; const att=rr(on*clamp((p.r.spd-40)/60,0,.6)*.25*rnd(.7,1.3)); const sr=clamp(.55+(p.r.spd-50)*.008,.4,.9);
  o.sb=rr(att*sr); o.cs=Math.max(0,att-o.sb);
  const sf=slot||{r:1,rbi:1};
  o.r=rr((on+o.d+o.tr)*.3*sf.r+o.hr); o.rbi=rr(o.hr*1.5+(o.h-o.hr)*.26*sf.rbi+o.bb*.02);
  return o;
}
/* 투수 능력치의 역할(레퍼런스: OOTP는 구위=삼진, 무브먼트=피홈런, 제구=볼넷. 우리는 무브먼트가 없어 강한 타구 억제를 구위·제구가 나눠 맡는다)
   - 구위: 삼진, 강한 타구 억제(피홈런·2루타·3루타)
   - 제구: 볼넷, 맞춰 잡기(몰린 공이 줄어 피홈런·인플레이 안타 감소), 투구 수 절약(06_game 투구 수)
   - 체력: 투구 수가 늘수록 떨어지는 구위·제구를 늦게·덜 떨어지게(06_game 경기 중 피로), 선발 투구 수 한도
   +10 실험(1,500경기): 평균자책점 구위 -1.26 · 제구 -1.32 · 체력 -0.47(선발 +0.5이닝). 리그 평균(타율·평균자책점·득점)은 예전과 같게 맞췄다 */
var PW={k0:.074,h0:.046,hs:.020,hc:.020,b0:.361,bs:.035,bc:.06,xs:.35,xc:.15,eff:.9,ft0:-5,fts:1,ftd:9,fm:1,l0:30,ls:.95};
function pitProbs(p,b){ const r=p.r; const be=b*.4, bk=b*.35;
  return {k:PW.k0+cc(r.stf,bk)*.24+arsenalK(p), bb:clamp(.15-cc(r.ctl,be)*.13,.025,.16), hr:clamp((PW.h0-cc(r.stf,b)*PW.hs-cc(r.ctl,be)*PW.hc-trt(p,'mv')*.0008)*(1-gbT(p)*.13),.006,.06), babip:clamp(PW.b0-cc(r.stf,b)*PW.bs-cc(r.ctl,be)*PW.bc-trt(p,'mv')*.0008+gbT(p)*.003-seasonLuck(p),.25,.36),
    x2:clamp(1-(cc(r.stf,b)-.5)*PW.xs-(cc(r.ctl,be)-.5)*PW.xc-gbT(p)*.05,.6,1.4)}; /* 땅볼형: 피홈런·장타가 줄고 땅볼 안타는 조금 는다 */ /* x2: 인플레이 안타 중 2루타·3루타가 되는 비율에 곱한다 */
}
function simPit(p,outs,b){
  const q=shrinkQ(pitProbs(p,b||0),TWP,QCP); /* 1군 경기와 같은 폭 */ const o={outs:0,h:0,hr:0,bb:0,so:0,tb:0};
  let guard=0;
  while(o.outs<outs&&guard++<5000){ const x=R();
    if(x<q.bb){o.bb++;continue}
    if(x<q.bb+q.k){o.so++;o.outs++;continue}
    if(x<q.bb+q.k+q.hr){o.h++;o.hr++;o.tb+=4;continue}
    if(R()<q.babip){ o.h++; const y=R(); o.tb+=y<.03?3:y<.23?2:1; } else o.outs++;
  }
  const A=o.h+o.bb-o.hr, B=(1.4*o.tb-.6*o.h-3*o.hr+.1*o.bb)*1.02, C=o.outs;
  const runs=(B+C>0?A*B/(B+C):0)+o.hr;
  o.er=Math.max(0,Math.round(runs*.92+N(0,Math.sqrt(runs+.5)*.35)));
  delete o.tb; return o;
}
const ZB={pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,r:0,rbi:0,sb:0,cs:0,g:0,e:0,sf:0};
const ZP={g:0,gs:0,outs:0,h:0,hr:0,bb:0,so:0,er:0,w:0,l:0,sv:0,hld:0};
function lineFor(p,y,t,lvl){ let h=p.hist.find(x=>x.y===y&&x.t===t&&x.lvl===lvl); if(!h){ h=Object.assign({y,t,lvl},p.isP?ZP:ZB); p.hist.push(h);} return h; }
function addTo(h,o){ for(const k in o) if(k!=='y'&&k!=='t'&&typeof o[k]==='number') h[k]=(h[k]||0)+o[k]; }
// 비율 기록
/* 출루율 = (안타+볼넷)/(타수+볼넷+희생플라이). 희생번트는 분모에 넣지 않는다 */
function obpOf(h){ const d=(h.ab||0)+(h.bb||0)+(h.sf||0); return d?((h.h||0)+(h.bb||0))/d:0; }
function bRate(h){ const avg=h.ab?h.h/h.ab:0, obp=obpOf(h), slg=h.ab?(h.h+h.d+2*h.tr+3*h.hr)/h.ab:0; return {avg,obp,slg,ops:obp+slg}; }
function pRate(h){ const ip=h.outs/3; return {ip,era:h.outs?h.er*27/h.outs:0,whip:h.outs?(h.h+h.bb)*3/h.outs:0,k9:h.outs?h.so*27/h.outs:0,bb9:h.outs?h.bb*27/h.outs:0}; }
const ipStr=outs=>Math.floor(outs/3)+(outs%3?'.'+outs%3:'');
const POS_ADJ={C:10,SS:8,'2B':5,CF:4,'3B':2,LF:-6,RF:-6,'1B':-10,DH:-15}; /* 자리 희소성(600타석당 득점): 포수·유격·2루가 귀하고 1루·지명은 누구나 간다 */
function lgOf(y){ return (G.lg&&G.lg[y])||{ops:.72,era:4.5}; }
/* WAR: 끝난 시즌의 타자 WAR은 처음 계산한 값으로 고정한다(수비 능력치가 나중에 바뀌어도 과거 기록은 그대로).
   창단 전 시즌은 공개 기록용 수비 추정치(fdWar)를 쓴다. 화면마다 같은 시즌 WAR이 달라 보이던 문제를 막는다 */
function warKey(h){ return h.y+':'+(h.lvl||'')+':'+(h.t??'')+':'+(h.pa||0); }
function warOf(h,p){ if(!h||!p)return 0; if(p.isP||!h.pa||h.y==null||h.y2)return warRaw(h,p);
  const pre=h.y<(G.startY??-1); if(!pre&&h.y>=G.year)return warRaw(h,p);
  p.pw=p.pw||{}; const k=warKey(h); if(p.pw[k]==null){ const old=pre?p.pw[h.y+':'+(h.lvl||'')]:null; /* 이전 저장 형식 */ p.pw[k]=old!=null?old:Math.round((pre?fdWar(p,h):warRaw(h,p))*100)/100; } return p.pw[k]; }
function warFreeze(y){ for(const p of Object.values(G.players)){ if(p.isP||!p.hist)continue; const L=p.hist.filter(h=>h.y===y&&!h.y2&&h.pa); if(!L.length)continue; p.pw=p.pw||{};
  const lv=[...new Set(L.map(h=>h.lvl))]; for(const h of L.concat(lv.map(l=>seasonTotal(p,y,l)).filter(Boolean))){ const k=warKey(h); if(p.pw[k]==null)p.pw[k]=Math.round(warRaw(h,p)*100)/100; } } }
function warRaw(h,p){
  if(!h)return 0; const lg=lgOf(h.y);
  if(p.isP){ if(!h.outs)return 0; const ip=h.outs/3; const era=h.er*27/h.outs; const lev=(h.sv>5)?1.3:1; return ((lg.era+.9)-era)*ip/9/10*lev; }
  if(!h.pa)return 0; const ops=bRate(h).ops; const pos=h.pos||p.pos;
  const bat=(ops/lg.ops-1)*h.pa*.16, rep=20*h.pa/600, adj=(POS_ADJ[pos]||0)*h.pa/600, def=pos==='DH'||!DWR[pos]?0:(defAt(p,pos)-DAVG[pos])*DWR[pos]*h.pa/600; /* 그 자리 수비가 실제로 막은 실점(유격이 1루의 약 3배) */
  return (bat+rep+adj+def)/10;
}
/* ===== wRC+ (조정 득점 창출력) =====
   wOBA(가중출루율) = (0.69×볼넷 + 0.89×단타 + 1.27×2루타 + 1.62×3루타 + 2.10×홈런) / (타수 + 볼넷 + 희생플라이). 가중치는 FanGraphs 표준 근삿값.
   wRC+ = 100 × ((wOBA - 리그 wOBA) / wOBA 스케일 + 리그 타석당 득점) / 리그 타석당 득점. 스케일 = 리그 wOBA / 리그 출루율.
   구장 보정은 넣지 않았다. 100이 리그 평균, 150이면 평균보다 득점 기여가 50% 많다 */
function wobaOf(h){ const ab=h.ab||0, bb=h.bb||0, sf=h.sf||0, den=ab+bb+sf; if(!den)return null; const s1=(h.h||0)-(h.d||0)-(h.tr||0)-(h.hr||0); return (.69*bb+.89*s1+1.27*(h.d||0)+1.62*(h.tr||0)+2.10*(h.hr||0))/den; }
let _lgbC={k:'',m:{}};
function lgBat(y,lvl){ lvl=lvl||'1군'; const L0=G.lg&&G.lg[y]; if(lvl==='1군'&&L0&&L0.woba&&y<G.year)return L0; const k=G.year+':'+G.day+':'+(G.games?G.games.length:0); if(_lgbC.k!==k)_lgbC={k,m:{}}; const ck=y+':'+lvl; if(_lgbC.m[ck])return _lgbC.m[ck];
  let ab=0,bb=0,sf=0,h=0,d=0,tr=0,hr=0,r=0; for(const p of Object.values(G.players)){ if(p.isP||!p.hist)continue; for(const x of p.hist){ if(x.y!==y||x.lvl!==lvl||x.y2)continue; ab+=x.ab||0; bb+=x.bb||0; sf+=x.sf||0; h+=x.h||0; d+=x.d||0; tr+=x.tr||0; hr+=x.hr||0; r+=x.r||0; } }
  const T={ab,bb,sf,h,d,tr,hr}; const pa=ab+bb+sf; const woba=wobaOf(T)||.32, obp=pa?(h+bb)/pa:.33; const o={woba,scale:Math.max(.8,woba/Math.max(.2,obp)),rpa:pa&&r?r/pa:.12}; _lgbC.m[ck]=o; return o; }
function wrcPlus(h,y){ if(!h||!h.pa)return null; const yy=y??h.y; if(typeof yy!=='number')return null; const w=wobaOf(h); if(w==null)return null; const L=lgBat(yy,h.lvl==='퓨처스'?'퓨처스':'1군'); return Math.round(100*((w-L.woba)/L.scale+L.rpa)/L.rpa); } /* 퓨처스 기록은 퓨처스 리그 기준 */
/* 여러 시즌 wRC+: 시즌별 값을 타석으로 가중 평균(통산·최근 3년 합계용) */
function wrcMulti(L){ let a=0,n=0; for(const h of L){ const w=wrcPlus(h,h.y); if(w==null)continue; a+=w*h.pa; n+=h.pa; } return n?Math.round(a/n):null; }
function updateLg(y){
  const bl=[],pl=[];
  for(const p of Object.values(G.players)) for(const h of p.hist) if(h.y===y&&h.lvl==='1군'){ (p.isP?pl:bl).push(h); }
  const s=(a,k)=>sum(a.map(h=>h[k]||0));
  const ab=s(bl,'ab'),H=s(bl,'h'),bb=s(bl,'bb'),pa=ab+bb+s(bl,'sf'),tb=s(bl,'h')+s(bl,'d')+2*s(bl,'tr')+3*s(bl,'hr');
  const outs=s(pl,'outs'),er=s(pl,'er');
  if(!G.lg)G.lg={};
  G.lg[y]={ops:pa&&ab?(H+bb)/pa+tb/ab:.72, era:outs?er*27/outs:4.5}; try{ _lgbC={k:'',m:{}}; const W=lgBat(y); Object.assign(G.lg[y],{woba:W.woba,scale:W.scale,rpa:W.rpa}); }catch(e){} /* wRC+ 기준(시즌이 끝나면 고정) */
}

