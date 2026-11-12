/* ===== 기록: 타석 단위로 만든다 ===== */
const cc=(x,b)=>clamp((x+b-20)/60,0,1.25);
function seasonLuck(p){ return p.sf&&p.sf.y===G.year?(p.sf.lk||0):0; }
function batProbs(p,b){ const r=p.r; const be=b*.4, bc=b*.3, bh=b*.55; /* 기세(b)는 인플레이 타구에 주로 실리고 삼진·홈런은 실력대로(한 시즌에도 빨리 안정됨) */
  return {bb:.01+cc(r.eye,be)*.145, k:clamp(.311-cc(r.con,bc)*.17-cc(r.eye,be)*.04-trt(p,'k')*.002,.06,.36), hr:.003+Math.pow(cc(r.pow,bh),1.6)*.06,
    babip:clamp(.268+cc(r.con,b)*.07+cc(r.spd,b)*.035+seasonLuck(p),.22,.39), d2:clamp(.16+cc(r.pow,b)*.08+trt(p,'gap')*.004,.1,.3), d3:.004+cc(r.spd,b)*.025};
}
function simBat(p,pa,b,slot){
  const q=shrinkQ(batProbs(p,b||0),TWB,QCB); /* 경기를 돌리지 않는 기록(아마추어·2군·해외·외국인 이전 리그·옛 시즌)도 1군 경기와 같은 폭으로 능력이 드러나게 */ const o={pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,hbp:0,so:0,r:0,rbi:0,sb:0,cs:0};
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
  const q=shrinkQ(pitProbs(p,b||0),TWP,QCP); /* 1군 경기와 같은 폭 */ const o={outs:0,h:0,hr:0,bb:0,hbp:0,so:0,tb:0};
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
const ZB={pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,hbp:0,so:0,r:0,rbi:0,sb:0,cs:0,g:0,e:0,sf:0};
const ZP={g:0,gs:0,outs:0,h:0,hr:0,bb:0,hbp:0,so:0,er:0,w:0,l:0,sv:0,hld:0,bf:0};
/* 좌우 상대 기록(정규시즌 1군): 타자는 상대 투수 손, 투수는 상대 타자 쪽(양타는 투수 반대편). [타석, 타수, 안타, 루타, 볼넷, 삼진, 홈런] */
function splAdd(b,p,o,f,rsp){ const y=G.year; const tb={'1B':1,'2B':2,'3B':3,HR:4}[o]||0; const noAB=o==='BB'||o==='HBP'||o==='SAC'||f==='SF'; /* 볼넷·희생번트·희생플라이는 타수가 아니다(박스스코어와 같게) */ const row=(x,k)=>{ if(!x.spl||x.spl.y!==y){ if(x.spl&&x.spl.y===y-1)x.splP=x.spl; x.spl={y}; } const a=x.spl[k]||(x.spl[k]=[0,0,0,0,0,0,0,0]); a[0]++; if(!noAB)a[1]++; if(tb){ a[2]++; a[3]+=tb; } if(o==='HBP')a[7]=(a[7]||0)+1; if(o==='SAC')a[8]=(a[8]||0)+1; /* 희생번트는 출루율 분모에서 뺀다 */ if(o==='BB')a[4]++; if(o==='K')a[5]++; if(o==='HR')a[6]++; };
  row(b,p.th==='좌'?'L':'R'); const side=b.bt==='양'?(p.th==='좌'?'R':'L'):(b.bt==='좌'?'L':'R'); row(p,side);
  if(rsp){ row(b,'RS'); row(p,'RS'); } /* 득점권(타석 시작 때 2·3루 주자) */ try{ vsAdd(b,p,o,noAB,tb); }catch(e){} }
/* 투수별 맞대결(이번 시즌, 타자 쪽에 저장): [타석, 타수, 안타, 홈런, 볼넷·사구, 삼진]. 많아지면 타석 적은 상대부터 지운다 */
function vsAdd(b,p,o,noAB,tb){ const y=G.year; if(!b.vs||b.vs.y!==y)b.vs={y,m:{}}; const M=b.vs.m; const a=M[p.id]||(M[p.id]=[0,0,0,0,0,0]); a[0]++; if(!noAB)a[1]++; if(tb)a[2]++; if(o==='HR')a[3]++; if(o==='BB'||o==='HBP')a[4]++; if(o==='K')a[5]++;
  const ks=Object.keys(M); if(ks.length>80){ ks.sort((x,z)=>M[x][0]-M[z][0]); for(const k of ks.slice(0,ks.length-70))delete M[k]; } }
/* 우리 선수 경기별 기록(이동 구간 추세용, 이번 시즌만): 타자 [날짜, 타석, 타수, 안타, 루타, 볼넷, 삼진, 홈런], 투수 [날짜, 상대 타자, 아웃, 삼진, 볼넷, 피안타, 피홈런, 자책] */
function glAdd(p,day,x){ const y=G.year; if(!p.gl||p.gl.y!==y)p.gl={y,g:[]}; p.gl.g.push(p.isP?[day,x.bf||0,x.outs||0,x.so||0,x.bb||0,x.h||0,x.hr||0,x.er||0,x.r??null]:[day,x.pa||0,x.ab||0,x.h||0,(x.h||0)+(x.d||0)+2*(x.tr||0)+3*(x.hr||0),x.bb||0,x.so||0,x.hr||0,x.hbp||0,x.sf||0,x.sh||0]); } /* 타자 끝 칸: 사구 */
function lineFor(p,y,t,lvl){ let h=p.hist.find(x=>x.y===y&&x.t===t&&x.lvl===lvl); const j=p.hist.indexOf(h); if(h&&p.hist.some((x,i)=>i>j&&x.y===y&&x.lvl===lvl)){ p.hist.splice(j,1); p.hist.push(h); } /* A→B→A로 돌아와 뛰면 그 줄을 맨 뒤로: 시즌 합계 소속은 마지막으로 뛴 팀(검수 11-09l) */ if(!h){ h=Object.assign({y,t,lvl},p.isP?ZP:ZB); p.hist.push(h); if(!p.salYr)p.salYr={}; if(p.salYr[y]==null)p.salYr[y]=p.sal||0; } return h; }
/* 그 시즌 연봉: 그해 첫 기록이 생길 때 남긴 값. 기록이 없는 해는 비운다(지금 연봉을 지난 성적에 붙이지 않는다). 기록 전인 이번 시즌만 지금 연봉 */
function salOfY(p,y){ if(!p)return null; const v=p.salYr?p.salYr[y]:null; if(v!=null)return v; const o=Array.isArray(p.salH)?p.salH.find(x=>x.y===y):null; if(o)return o.s; /* 스토브리그 연봉 기록(국내 선수, 4년) */ return y===G.year?(p.sal||0):null; }
function addTo(h,o){ for(const k in o) if(k!=='y'&&k!=='t'&&typeof o[k]==='number') h[k]=(h[k]||0)+o[k]; }
// 비율 기록
/* 출루율 = (안타+볼넷+사구)/(타수+볼넷+사구+희생플라이). 희생번트는 분모에 넣지 않는다 */
function obpOf(h){ const d=(h.ab||0)+(h.bb||0)+(h.hbp||0)+(h.sf||0); return d?((h.h||0)+(h.bb||0)+(h.hbp||0))/d:0; }
function bRate(h){ const avg=h.ab?h.h/h.ab:0, obp=obpOf(h), slg=h.ab?(h.h+h.d+2*h.tr+3*h.hr)/h.ab:0; return {avg,obp,slg,ops:obp+slg}; }
function pRate(h){ const ip=h.outs/3; return {ip,era:h.outs?h.er*27/h.outs:0,whip:h.outs?(h.h+h.bb)*3/h.outs:0,k9:h.outs?h.so*27/h.outs:0,bb9:h.outs?h.bb*27/h.outs:0}; }
const ipStr=outs=>Math.floor(outs/3)+(outs%3?'.'+outs%3:'');
const POS_ADJ={C:10,SS:8,'2B':5,CF:4,'3B':2,LF:-6,RF:-6,'1B':-10,DH:-15}; /* 자리 희소성(600타석당 득점): 포수·유격·2루가 귀하고 1루·지명은 누구나 간다 */
function lgOf(y){ return (G.lg&&G.lg[y])||{ops:.72,era:4.5}; }
/* WAR: 끝난 시즌의 타자 WAR은 처음 계산한 값으로 고정한다(수비 능력치가 나중에 바뀌어도 과거 기록은 그대로).
   창단 전 시즌은 공개 기록용 수비 추정치(fdWar)를 쓴다. 화면마다 같은 시즌 WAR이 달라 보이던 문제를 막는다 */
function warKey(h){ return h.y+':'+(h.lvl||'')+':'+(h.t??'')+':'+(h.pa||0); }
/* 포지션별 타석(pp)에서 가장 많이 뛴 자리 */
function ppTop(pp){ let k=null,v=-1; for(const x in pp||{})if(pp[x]>v){ v=pp[x]; k=x; } return k; }
function ppMerge(a,b){ if(!a&&!b)return undefined; const o=Object.assign({},a||{}); for(const k in b||{})o[k]=(o[k]||0)+b[k]; return o; }
function warOf(h,p){ if(!h||!p)return 0; if(p.arch&&h.war!=null)return h.war; /* 보관 선수는 보관할 때 저장한 WAR(기본 능력으로 다시 계산하지 않는다, 검수 11-07) */ if(h.parts)return sum(h.parts.map(x=>warOf(x,p))); if(p.isP||!h.pa||h.y==null||h.y2)return warRaw(h,p);
  const pre=h.y<(G.startY??-1); if(!pre&&h.y>=G.year&&G.warFz!==h.y)return warRaw(h,p); /* 정규시즌이 끝나 고정한 해는 고정값(마무리캠프로 바뀌지 않게, 검수 11-08) */
  p.pw=p.pw||{}; const k=warKey(h); if(p.pw[k]==null){ const old=pre?p.pw[h.y+':'+(h.lvl||'')]:null; /* 이전 저장 형식 */ p.pw[k]=old!=null?old:Math.round((pre?fdWar(p,h):warRaw(h,p))*100)/100; } return p.pw[k]; }
function warFreeze(y){ G.warFz=y; for(const p of Object.values(G.players)){ if(p.isP||!p.hist)continue; const L=p.hist.filter(h=>h.y===y&&!h.y2&&h.pa); if(!L.length)continue; p.pw=p.pw||{};
  const lv=[...new Set(L.map(h=>h.lvl))]; for(const h of L.concat(lv.map(l=>seasonTotal(p,y,l)).filter(Boolean))){ const k=warKey(h); if(p.pw[k]==null)p.pw[k]=Math.round(warRaw(h,p)*100)/100; } } }
function warBat(h,lg){ return h.pa?(bRate(h).ops/lg.ops-1)*h.pa*.016:0; } /* 타자 WAR 중 리그 평균에 따라 바뀌는 몫 */
/* 보관 선수 올해 WAR: 리그 평균이 바뀔 때 현역과 같은 기준으로 다시 계산(투수는 기록만으로, 타자는 보관 때 남긴 수비·자리 몫 wn에 타격 몫을 더해, 검수 11-09zf) */
function archWarSync(y){ const A=G.arch||{}, lg=lgOf(y); for(const id in A){ const a=A[id], R=(a.rows||[]).filter(r=>r.y===y); if(!R.length)continue; const q=a.isP?archP(a):null; for(const r of R){ if(q)r.war=warRaw(Object.assign(archFull(r),{lvl:'1군'}),q); else if(r.wn!=null)r.war=r.wn+warBat(archFull(r),lg); } } }
function warRaw(h,p){
  if(!h)return 0; const lg=lgOf(h.y);
  if(p.isP){ const ip=(h.outs||0)/3; const svS=(h.y!=null&&!h.y2&&p.hist)?p.hist.reduce((s,r)=>r.y===h.y&&!r.y2&&r.lvl===h.lvl?s+(r.sv||0):s,0):0; const lev=Math.max(h.sv||0,svS)>5?1.3:1; /* 마무리 보정은 그 선수의 시즌 전체 세이브로 정하고 구단별 기록에도 같은 배수를 쓴다(구단별 합 = 시즌 전체) */ return ((lg.era+.9)*ip/9-(h.er||0))/10*lev; } /* 아웃 없이 낸 자책도 깎는다(검수 11-09zf) */
  if(!h.pa)return 0; const pos=h.pos||p.pos;
  const bat=warBat(h,lg)*10, rep=20*h.pa/600; const dOf=k=>k==='DH'||!DWR[k]?0:(defAt(p,k)-DAVG[k])*DWR[k];
  let adj=(POS_ADJ[pos]||0)*h.pa/600, def=dOf(pos)*h.pa/600; { const pp=h.pp, tot=pp?Object.values(pp).reduce((s,v)=>s+v,0):0; if(tot>0){ adj=0; def=0; for(const k in pp){ const w=pp[k]/tot*h.pa/600; adj+=(POS_ADJ[k]||0)*w; def+=dOf(k)*w; } } } /* 여러 자리를 뛰었으면 자리별 타석 비율로(마지막 출전 자리 하나로 시즌 전체를 보지 않는다) */ /* 그 자리 수비가 실제로 막은 실점(유격이 1루의 약 3배) */
  return (bat+rep+adj+def)/10;
}
/* ===== wRC+ (조정 득점 창출력) =====
   wOBA(가중출루율) = (0.69×볼넷 + 0.89×단타 + 1.27×2루타 + 1.62×3루타 + 2.10×홈런) / (타수 + 볼넷 + 희생플라이). 가중치는 FanGraphs 표준 근삿값.
   wRC+ = 100 × ((wOBA - 리그 wOBA) / wOBA 스케일 + 리그 타석당 득점) / 리그 타석당 득점. 스케일 = 리그 wOBA / 리그 출루율.
   구장 보정은 넣지 않았다. 100이 리그 평균, 150이면 평균보다 득점 기여가 50% 많다 */
function wobaOf(h){ const ab=h.ab||0, bb=h.bb||0, sf=h.sf||0,hbp=h.hbp||0, den=ab+bb+hbp+sf; if(!den)return null; const s1=(h.h||0)-(h.d||0)-(h.tr||0)-(h.hr||0); return (.69*bb+.72*hbp+.89*s1+1.27*(h.d||0)+1.62*(h.tr||0)+2.10*(h.hr||0))/den; }
/* 개인 기록을 압축하거나 리그에서 떠날 때 빠지는 연도별 퓨처스 타격 합계를 보존한다.
   호출자는 실제로 없애는 원본 연도 행만 넘긴다. 여러 해 합산(y2)은 연도별로 추정 배분하지 않는다. */
const FUT_LEAGUE_K=['ab','bb','hbp','sf','h','d','tr','hr','r'];
function futLeagueCarry(p,rows){if(!p||p.isP)return;for(const x of rows||[]){if(x.lvl!=='퓨처스'||x.y2||!Number.isInteger(x.y))continue;const F=G.futGone=G.futGone||{},o=F[x.y]=F[x.y]||{};for(const k of FUT_LEAGUE_K)o[k]=(o[k]||0)+(x[k]||0);}_lgbC={k:'',m:{}};}
let _lgbC={k:'',m:{}};
function lgBat(y,lvl){ lvl=lvl||'1군'; const L0=G.lg&&G.lg[y]; if(lvl==='1군'&&L0&&L0.woba&&y<G.year)return L0; const k=G.year+':'+G.day+':'+(G.games?G.games.length:0); if(_lgbC.k!==k||_lgbC.g!==G)_lgbC={k,m:{},g:G}; /* 세이브가 바뀌면 다시 계산(검수 11-07) */ const ck=y+':'+lvl; if(_lgbC.m[ck])return _lgbC.m[ck];
  let ab=0,bb=0,hbp=0,sf=0,h=0,d=0,tr=0,hr=0,r=0; const add=x=>{ ab+=x.ab||0; bb+=x.bb||0;hbp+=x.hbp||0; sf+=x.sf||0; h+=x.h||0; d+=x.d||0; tr+=x.tr||0; hr+=x.hr||0; r+=x.r||0; }; if(lvl==='1군'){ for(const z of y1Rows(y))if(!z.isP)add(z.h); } else { for(const p of Object.values(G.players)){ if(p.isP||!p.hist)continue; for(const x of p.hist){ if(x.y!==y||x.lvl!==lvl||x.y2)continue; add(x); } } const g=lvl==='퓨처스'&&G.futGone&&G.futGone[y]; if(g)add(g); } /* 떠난 선수와 개인 기록 압축으로 빠진 연도 행도 리그 합계에 남긴다. */
  const T={ab,bb,hbp,sf,h,d,tr,hr}; const pa=ab+bb+hbp+sf; const woba=pa?wobaOf(T):.32, obp=pa?(h+bb+hbp)/pa:.33; const o={woba,scale:Math.max(.8,woba/Math.max(.2,obp)),rpa:pa?r/pa:.12}; /* 표본이 없을 때만 기본값, 실제 0은 0(검수 11-07) */ _lgbC.m[ck]=o; return o; }
function wrcPlus(h,y){ if(!h||!h.pa)return null; const yy=y??h.y; if(typeof yy!=='number')return null; const w=wobaOf(h); if(w==null)return null; const L=lgBat(yy,h.lvl==='퓨처스'?'퓨처스':'1군'); if(!(L.rpa>0))return null; return Math.round(100*((w-L.woba)/L.scale+L.rpa)/L.rpa); } /* 퓨처스 기록은 퓨처스 리그 기준 */
/* 여러 시즌 wRC+: 시즌별 값을 타석으로 가중 평균(통산·최근 3년 합계용) */
function wrcMulti(L){ let a=0,n=0; for(const h of L){ const w=wrcPlus(h,h.y); if(w==null)continue; a+=w*h.pa; n+=h.pa; } return n?Math.round(a/n):null; }
/* 한 시즌 1군 기록 줄 전부: 지금 선수 목록 + 리그를 떠난 선수의 보관 기록(시즌 중 교체된 외국인 등). 팀·리그 합계는 이걸로 센다(이미 치른 경기 기록은 선수가 떠나도 그대로) */
function y1Rows(y){ const L=[]; for(const p of Object.values(G.players)) for(const h of p.hist) if(h.y===y&&h.lvl==='1군'&&!h.y2)L.push({isP:!!p.isP,h}); const A=G.arch||{}; for(const id in A){ if(G.players[id])continue; const a=A[id]; for(const r of a.rows||[])if(r.y===y)L.push({isP:!!a.isP,h:archFull(r)}); } for(const k in (G.archRest||{})){ const r=G.archRest[k]; if(r.y===y)L.push({isP:!!r.isP,h:archFull(r)}); } /* 보관 한도로 이름이 지워진 선수의 몫(검수 11-09zz) */ return L; }
function updateLg(y){
  const bl=[],pl=[];
  for(const x of y1Rows(y))(x.isP?pl:bl).push(x.h);
  const s=(a,k)=>sum(a.map(h=>h[k]||0));
  const ab=s(bl,'ab'),H=s(bl,'h'),bb=s(bl,'bb'),hbp=s(bl,'hbp'),pa=ab+bb+hbp+s(bl,'sf'),tb=s(bl,'h')+s(bl,'d')+2*s(bl,'tr')+3*s(bl,'hr');
  const outs=s(pl,'outs'),er=s(pl,'er');
  if(!G.lg)G.lg={};
  G.lg[y]={ops:pa&&ab?(H+bb+hbp)/pa+tb/ab:.72, era:outs?er*27/outs:4.5}; try{ _lgbC={k:'',m:{}}; const W=lgBat(y); Object.assign(G.lg[y],{woba:W.woba,scale:W.scale,rpa:W.rpa}); }catch(e){} /* wRC+ 기준(시즌이 끝나면 고정) */ try{ archWarSync(y); }catch(e){}
}

/* ===== 주간 파워랭킹(OOTP Power Rankings 참고): 정규시즌 매주 월요일. 시즌 승률·피타고리안 기대 승률(득실점)·최근 10경기·현재 전력(teamRating)을 섞고,
   시즌 초(10경기 전)에는 전력 비중을 높인다. 지난주 순위와 비교해 변동을 남긴다 */
function pwrWeek(){ if(period()!=='season'||!G.sea||!G.sea.rec)return; const TL=(G.sea.tl)||[]; const P=G.pwr&&G.pwr.y===G.year?G.pwr:null; const prev={}; if(P)for(const r of P.rows)prev[r.tid]=r.rk;
  const rat=G.teams.map(t=>{ try{ return teamRating(t.id); }catch(e){ return 0; } }), lo=Math.min(...rat), hi=Math.max(...rat);
  const rows=G.teams.map((t,i)=>{ const r=G.sea.rec[t.id]||{w:0,l:0}, gp=(r.w||0)+(r.l||0), L=TL[t.id]||[]; const rs=sum(L.map(x=>x[1]||0)), ra=sum(L.map(x=>x[2]||0));
    const pct=gp?r.w/gp:.5, py=rs+ra>0?Math.pow(rs,1.83)/(Math.pow(rs,1.83)+Math.pow(ra,1.83)):.5, l10=L.slice(-10), r10=l10.length?l10.filter(x=>x[0]>0).length/Math.max(1,l10.filter(x=>x[0]!==0).length||1):.5, rn=hi>lo?(rat[i]-lo)/(hi-lo):.5;
    const wr=gp<10?.55:gp<40?.25:.12; const s=(pct*.42+py*.28+r10*.18)*(1-wr)/.88+rn*wr;
    return {tid:t.id,s:Math.round(s*1000)/10,w:r.w||0,l:r.l||0,t:r.t||0,rd:rs-ra,r10:l10.length?`${l10.filter(x=>x[0]>0).length}-${l10.filter(x=>x[0]<0).length}`:'-',py:Math.round(py*1000)/1000}; });
  rows.sort((a,b)=>b.s-a.s).forEach((r,i)=>{ r.rk=i+1; r.prev=prev[r.tid]??null; });
  G.pwr={y:G.year,d:G.day,rows}; }
