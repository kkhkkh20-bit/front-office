/* ===== 기록: 타석 단위로 만든다 ===== */
const cc=(x,b)=>clamp((x+b-20)/60,0,1.25);
function seasonLuck(p){ return p.sf&&p.sf.y===G.year?(p.sf.lk||0):0; }
function batProbs(p,b){ const r=p.r; const be=b*.4, bc=b*.7;
  return {bb:.01+cc(r.eye,be)*.145, k:clamp(.31-cc(r.con,bc)*.17-cc(r.eye,be)*.04-trt(p,'k')*.002,.06,.36), hr:.003+Math.pow(cc(r.pow,b),1.6)*.06,
    babip:clamp(.268+cc(r.con,b)*.07+cc(r.spd,b)*.035+seasonLuck(p),.22,.39), d2:clamp(.16+cc(r.pow,b)*.08+trt(p,'gap')*.004,.1,.3), d3:.004+cc(r.spd,b)*.025};
}
function simBat(p,pa,b,slot){
  const q=batProbs(p,b||0); const o={pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,r:0,rbi:0,sb:0,cs:0};
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
function pitProbs(p,b){ const r=p.r; const be=b*.4, bk=b*.7;
  return {k:.10+cc(r.stf,bk)*.19+arsenalK(p), bb:clamp(.15-cc(r.ctl,be)*.13,.025,.16), hr:clamp((.036-cc(r.stf,b)*.012-cc(r.ctl,be)*.01-trt(p,'mv')*.0008)*(1-gbT(p)*.08),.008,.05), babip:clamp(.335-cc(r.stf,b)*.04-trt(p,'mv')*.0008-seasonLuck(p),.25,.36)};
}
function simPit(p,outs,b){
  const q=pitProbs(p,b||0); const o={outs:0,h:0,hr:0,bb:0,so:0,tb:0};
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
const POS_ADJ={C:9,SS:7,'2B':3,CF:3,'3B':2,LF:-6,RF:-6,'1B':-10,DH:-15};
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
  const bat=(ops/lg.ops-1)*h.pa*.16, rep=20*h.pa/600, adj=(POS_ADJ[pos]||0)*h.pa/600, def=pos==='DH'?0:(p.r.def-50)*.3*h.pa/600;
  return (bat+rep+adj+def)/10;
}
function updateLg(y){
  const bl=[],pl=[];
  for(const p of Object.values(G.players)) for(const h of p.hist) if(h.y===y&&h.lvl==='1군'){ (p.isP?pl:bl).push(h); }
  const s=(a,k)=>sum(a.map(h=>h[k]||0));
  const ab=s(bl,'ab'),H=s(bl,'h'),bb=s(bl,'bb'),pa=ab+bb+s(bl,'sf'),tb=s(bl,'h')+s(bl,'d')+2*s(bl,'tr')+3*s(bl,'hr');
  const outs=s(pl,'outs'),er=s(pl,'er');
  if(!G.lg)G.lg={};
  G.lg[y]={ops:pa&&ab?(H+bb)/pa+tb/ab:.72, era:outs?er*27/outs:4.5};
}

