/* ===== 내가 꾸린 팀: 선수가 어떻게 우리 팀에 왔는지, 그 선수가 자란 순간 =====
 - 선수가 우리 팀에 온 길(창단 지명·신인 지명·트레이드·FA·외국인·보상선수…)을 그때 능력과 함께 남긴다.
 - '내가 꾸린 선수': 지금 단장이 재임하는 동안 데려온 선수. 그 전부터 있던 선수는 '물려받은 선수'.
 - 시즌 중: 내가 꾸린 선수가 10승·20홈런·20세이브에 닿으면 소식이 온다(데뷔 첫 기록이면 따로 표시).
 - 시즌 뒤 회고: 내가 꾸린 선수 WAR 순위와 이번 시즌 처음 주전이 된 선수.
 - 구단 > 연대기 > 내가 꾸린 팀: 순위 변화, 지금 선수단이 어디서 왔는지, 핵심 선수, 기록 연표 */
const ACQ_K={fd:'창단 지명',draft:'신인 지명','트레이드':'트레이드','FA':'외부 FA','외국인':'외국인','보상선수':'보상선수','무적 영입':'무적 선수','해외 복귀':'해외 복귀'};
function acqStamp(p,k,tid,o){ if(!p||tid==null)return; p.acq=Object.assign({k,y:G.year,d:G.day,tid,o0:Math.round(ovr(p)),age0:p.age},o||{}); }
/* 예전 저장: 이야기 기록에서 온 길을 찾는다 */
function acqFromStory(p){ const nm=tname(p.team); const L=(p.story||[]).slice().reverse();
  for(const s of L){ const t=s.t||''; if(!t.includes(nm)&&!/트레이드|FA 이적|보상선수|입단 \(|무적 선수/.test(t))continue;
    if(/창단 드래프트/.test(t)){ const m=t.match(/(\d+)라운드/); return {k:'fd',y:s.y,rd:m?+m[1]:null,tid:p.team}; }
    if(/신인 드래프트/.test(t)){ const m=t.match(/(\d+)라운드/); return {k:'draft',y:s.y,rd:m?+m[1]:null,tid:p.team}; }
    if(/트레이드/.test(t))return {k:'트레이드',y:s.y,tid:p.team}; if(/^FA 이적/.test(t))return {k:'FA',y:s.y,tid:p.team};
    if(/보상선수/.test(t))return {k:'보상선수',y:s.y,tid:p.team}; if(/입단 \((외국인|아시아쿼터)/.test(t))return {k:'외국인',y:s.y,tid:p.team}; if(/무적 선수/.test(t))return {k:'무적 영입',y:s.y,tid:p.team}; }
  return null; }
function tbOrigin(p){ if(!p||p.team==null)return null; const A=p.acq; if(A&&A.tid===p.team)return A; if(p.draft&&p.draft.tid===p.team)return {k:'draft',y:p.draft.y,rd:p.draft.rd,no:p.draft.no,tid:p.team}; return acqFromStory(p); }
function meSince(){ const C=G.myC; if(C&&C.tid===G.user&&C.y0!=null)return C.y0; return G.gmSince??G.startY??G.year; }
/* 지금 단장이 데려온 선수인가: 창단 지명은 창단 해, 그 밖은 재임 시작 해 이후(지명은 그해 가을에 하므로 한 해 앞까지) */
function mineOf(p){ const o=tbOrigin(p); if(!o||o.tid!==G.user)return false; if(o.d!=null&&G.gmSinceD!=null)return o.d>=G.gmSinceD; /* 취임한 날 이후 데려온 선수만(전임 단장의 영입 제외) */ return o.y>=meSince(); }
function originLabel(o){ if(!o)return '물려받은 선수'; const k=o.k; return k==='fd'?(o.auto?`${o.y} 창단 배분`:`${o.y} 창단 드래프트${o.rd?` ${o.rd}라운드`:''}`):k==='draft'?`${o.y} 신인 드래프트${o.rd?` ${o.rd}라운드`:''}`:k==='트레이드'?`${o.y} 트레이드${o.from!=null?`(${tshort(o.from)})`:''}`:`${o.y} ${ACQ_K[k]||k}`; }
function originCat(p){ const o=tbOrigin(p); if(!o||!mineOf(p))return '물려받음'; return ACQ_K[o.k]||'기타'; }
/* 우리 팀에서 쌓은 WAR(데려온 해부터) */
function warWithUs(p){ const o=tbOrigin(p); const y0=o?o.y:G.year-10; let s=0, best=null; for(let y=y0;y<=G.year;y++){ const h=seasonTotalT(p,y,'1군',G.user); if(!h)continue; const w=warOf(h,p); s+=w; if(!best||w>best.w)best={y,w}; } return {sum:s,best}; }
function tbLogAdd(pid,t){ const L=G.tbLog=G.tbLog||[]; L.unshift({y:G.year,d:G.day,pid,t}); if(L.length>120)L.length=120; }
const TB_MS=[{k:'w10',isP:true,v:h=>h.w||0,n:10,t:'10승'},{k:'sv20',isP:true,v:h=>h.sv||0,n:20,t:'20세이브'},{k:'hr20',isP:false,v:h=>h.hr||0,n:20,t:'20홈런'},{k:'hld20',isP:true,v:h=>h.hld||0,n:20,t:'20홀드'}];
function tbPrev(p,ms){ for(let y=G.year-1;y>=G.year-25;y--){ const h=seasonTotal(p,y,'1군'); if(h&&ms.v(h)>=ms.n)return true; } return false; }
/* 매주(시즌 중): 내가 꾸린 선수의 기록 달성 */
function tbWeek(){ if(G.unemp||period()!=='season')return; const out=[];
  for(const p of playersOf(G.user)){ if(!mineOf(p))continue; const h=seasonTotal(p,G.year,'1군'); if(!h)continue; const M=p.msY&&p.msY.y===G.year?p.msY:(p.msY={y:G.year,k:[]});
    for(const ms of TB_MS){ if(ms.isP!==!!p.isP||M.k.includes(ms.k)||ms.v(h)<ms.n)continue; M.k.push(ms.k); const first=!tbPrev(p,ms); out.push({p,ms,first}); } }
  if(!out.length)return; const o=tbOrigin;
  for(const x of out.slice(0,2)){ const p=x.p, O=o(p); const now=Math.round(ovr(p)); const t=`${p.name}, ${x.first?'데뷔 첫 ':'시즌 '}${x.ms.t}`;
    tbLogAdd(p.id,`${t} (${originLabel(O)})`);
    mail('전력분석팀',`[내 팀] ${t}`,`${originLabel(O)}로 데려온 ${p.name}(${posLabel(p)}, ${p.age}세)이(가) ${x.first?'프로 데뷔 첫':'올 시즌'} ${x.ms.t}을(를) 달성했습니다.${O&&O.o0!=null?`\n데려올 때 능력 ${dv(O.o0)} → 지금 ${dv(now)}.`:''}\n\n단장님이 꾸린 선수입니다. 구단 > 연대기 > 내가 꾸린 팀에서 모아 볼 수 있습니다.`,{kind:'선수',ref:p.id,face:p.id,acts:[{l:'선수 정보',a:'player',v:p.id},{l:'내가 꾸린 팀',a:'go',v:'club:build'}]}); }
  if(out.length>2)tbLogAdd(null,`그 밖에 ${out.slice(2).map(x=>`${x.p.name} ${x.ms.t}`).join(', ')}`); }
/* 시즌 회고에 붙일 줄: 내가 꾸린 선수 WAR, 처음 주전이 된 선수 */
function tbReviewLines(y){ const ps=playersOf(G.user); const W=p=>{ const h=seasonTotalT(p,y,'1군',G.user); return h?warOf(h,p):0; }; const L=[];
  const mine=ps.filter(mineOf).map(p=>({p,w:W(p)})).filter(x=>x.w>=.5).sort((a,b)=>b.w-a.w);
  const all=ps.map(W).reduce((a,b)=>a+Math.max(0,b),0), mw=mine.reduce((a,x)=>a+Math.max(0,x.w),0);
  if(mine.length)L.push(`[내가 꾸린 선수] 팀 WAR의 ${all>0?Math.round(mw/all*100):0}%. `+mine.slice(0,6).map(x=>`${x.p.name}(${originLabel(tbOrigin(x.p))}) WAR ${x.w.toFixed(1)}`).join(' / '));
  const reg=p=>{ const h=seasonTotal(p,y,'1군'); if(!h)return false; return p.isP?(h.outs>=330||(h.g||0)>=50):h.pa>=400; };
  const prevReg=p=>{ for(let k=y-1;k>=y-20;k--){ const h=seasonTotal(p,k,'1군'); if(h&&(p.isP?(h.outs>=330||(h.g||0)>=50):h.pa>=400))return true; } return false; };
  const nr=ps.filter(p=>reg(p)&&!prevReg(p));
  if(nr.length){ L.push('[처음 주전이 된 선수] '+nr.slice(0,6).map(p=>`${p.name}(${posLabel(p)}, ${p.age}세${mineOf(p)?` · ${originLabel(tbOrigin(p))}`:''})`).join(', ')); for(const p of nr.slice(0,6))if(mineOf(p))tbLogAdd(p.id,`${p.name}, 처음 주전 시즌 (${originLabel(tbOrigin(p))})`); }
  return L; }
