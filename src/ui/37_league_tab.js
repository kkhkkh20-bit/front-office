/* ---------- 리그 탭 ---------- */
/* 예전 하위 탭 이름 → 지금 자리 */
function lsegFix(s){ if(s==='board'||!s)return 'stand'; if(s==='sched'){ UI.it=UI.it||{}; UI.it.sres='cal'; return 'score'; } if(s==='games')return 'score'; if(s==='lead')return 'rec'; return s; }
function leagueView(){ UI.lseg=lsegFix(UI.lseg); UI.lseg=ALIAS.league[UI.lseg]||UI.lseg; if(!SUBS.league.some(x=>x[0]===UI.lseg))UI.lseg='stand';
  const s=UI.lseg;
  return subTabs('league')+mergedBody('league',s,{feat:featView,abroad:abroadView,hist:histView,stand:standView,score:scoreHub,wire:wireView,teams:teamsView,rec:recView,dist:distView,tdata:teamDataView,park:parkView,assoc:assocView,nt:ntView});
}
/* 리그 분포(FM식 산점도): 같은 시즌·같은 군 기록으로 두 지표를 함께. 리그 선수는 회색, 우리 선수는 강조와 이름. 기록에 있는 지표만 쓰고 숨은 능력은 쓰지 않는다 */
/* ===== 리그 분포(선수 산점도): 가로·세로 지표를 따로 고르고(같은 지표 금지), 포지션·최소 표본으로 비교 집단을 좁힌다.
   기본 차트(DS_AX)는 자주 쓰는 조합을 한 번에 고르는 바로가기. 점선은 표시된 선수의 산술 평균(리그 공식 합산 기록과 다름).
   축은 실제 최소~최대(이상치 포함)로 잡아 점을 가장자리로 붙이지 않는다. 연봉은 그 시즌 연봉(salOfY), 기록 없는 선수는 0으로 채우지 않고 빼고 안내한다 */
const DS_AX={B:[['obp_slg','출루와 장타'],['bb_k','볼넷과 삼진'],['sal_war','연봉과 성과']],P:[['bb9_k9','삼진과 볼넷'],['era_whip','실점과 출루 허용'],['sal_war','연봉과 성과']]};
const DS_M={B:['avg','obp','slg','ops','hr','sb','bb','k','pa','sal','war'],P:['era','whip','k9','bb9','hr9','ip','sal','war']};
const DS_L={avg:'타율',obp:'출루율',slg:'장타율',ops:'OPS',hr:'홈런',sb:'도루',bb:'볼넷%',k:'삼진%',pa:'타석',sal:'연봉',war:'WAR',bb9:'BB/9',k9:'K/9',era:'ERA',whip:'WHIP',hr9:'HR/9',ip:'이닝'};
const DS_LOW={era:1,whip:1,bb9:1,hr9:1,k:1}; /* 낮을수록 좋은 지표(축 방향은 그대로, 설명만 붙인다) */
function dsVal(p,h,k,y){ if(k==='sal')return salOfY(p,y==null?statY():y); if(k==='war')return wOf(h,p);
  if(p.isP){ if(!h.outs)return k==='ip'?0:null; const r=pRate(h); return {bb9:r.bb9,k9:r.k9,era:r.era,whip:r.whip,hr9:h.hr*27/h.outs,ip:h.outs/3}[k]; }
  if(k==='pa')return h.pa||0; if(k==='hr')return h.hr||0; if(k==='sb')return h.sb||0; if(!h.pa)return null; const r=bRate(h); return {avg:r.avg,obp:r.obp,slg:r.slg,ops:r.ops,bb:h.bb/h.pa*100,k:h.so/h.pa*100}[k]; }
function dsFmt(k,v){ return v==null?'-':k==='sal'?money(v):['avg','obp','slg','ops'].includes(k)?fmt3(v):k==='bb'||k==='k'?v.toFixed(1)+'%':k==='war'?(Math.abs(v)<.05?0:v).toFixed(1):k==='ip'?ipStr(Math.round(v*3)):['hr','sb','pa'].includes(k)?String(Math.round(v)):v.toFixed(2); }
function dsAxes(g){ const pre=(DS_AX[g].find(x=>x[0]===UI.dsAx)||DS_AX[g][0])[0].split('_'); const M=DS_M[g]; let kx=M.includes(UI.dsX)?UI.dsX:pre[0], ky=M.includes(UI.dsYk)?UI.dsYk:pre[1];
  if(kx===ky)ky=pre[1]!==kx?pre[1]:M.find(k=>k!==kx); return [kx,ky]; }
const DS_POS=['C','1B','2B','3B','SS','LF','CF','RF','DH'];
/* 내 차트: 설정만 저장 슬롯(G.dsCharts)에 남긴다(선수 목록·좌표·성적은 저장하지 않고 열 때마다 최신 기록으로 다시 그림). 최대 20개, 최근 사용 순 */
function dsCfg(){ const g=UI.dsG==='P'?'P':'B'; const [x,y]=dsAxes(g); const mins=g==='P'?[0,10,30,60,100]:[0,50,100,200,400]; const min=UI.dsMin!=null&&mins.includes(+UI.dsMin)?+UI.dsMin:(g==='P'?30:100);
  return {g,x,y,pos:UI.dsPos||null,min,lv:UI.dsLv==='퓨처스'?'퓨처스':'1군'}; }
function dsSame(a,b){ return a&&b&&['g','x','y','pos','min','lv'].every(k=>(a[k]??null)===(b[k]??null)); }
function dsMine(){ const L=(G.dsCharts||[]).slice().sort((a,b)=>(b.used||0)-(a.used||0)); const cur=L.find(c=>c.id===UI.dsCur); const mod=cur&&!dsSame(cur,dsCfg());
  return `<div class="ds-mine"><div class="row wrapr" style="gap:6px"><span class="small muted">내 차트</span>${L.length?L.map(c=>`<span class="chip-x"><button data-a="dsLoad" data-v="${esc(c.id)}" class="tc-i${c.id===UI.dsCur?' on':''}">${esc(c.name)}${c.id===UI.dsCur&&mod?' · 변경됨':''}</button><button class="tc-i" data-a="dsDel" data-v="${esc(c.id)}" aria-label="${esc(c.name)} 삭제">×</button></span>`).join(''):'<span class="small muted">아직 없음</span>'}</div>
    ${UI.dsOver?`<p class="small warn">'${esc(UI.dsOver)}' 이름이 이미 있습니다. <button class="tc-i go" data-a="dsSave" data-v="over">덮어쓰기</button> <button class="tc-i" data-a="dsOverNo">다른 이름으로</button></p>`:''}
    <div class="row" style="gap:6px;margin-top:6px"><input type="text" id="dsName" maxlength="30" placeholder="지금 설정을 내 차트로 저장(이름)" aria-label="차트 이름" style="flex:1;min-width:120px"><button class="tc-i go" data-a="dsSave">저장</button></div></div>`; }
function distView(){ const g=UI.dsG==='P'?'P':'B'; const [kx,ky]=dsAxes(g); const lv=UI.dsLv==='퓨처스'?'퓨처스':'1군'; const y=UI.dsY==='prev'?statY()-1:statY();
  const mins=g==='P'?[0,10,30,60,100]:[0,50,100,200,400]; const mn=UI.dsMin!=null&&mins.includes(+UI.dsMin)?+UI.dsMin:(g==='P'?30:100); const watch=new Set([...(G.shortlist||[]),...((G.pwatch||[]).map(x=>x&&x.id!=null?x.id:x))]);
  const posF=g==='B'&&DS_POS.includes(UI.dsPos)?UI.dsPos:null, roleF=g==='P'&&(UI.dsPos==='SP'||UI.dsPos==='RP')?UI.dsPos:null;
  const pts=[]; let miss=0; for(const p of Object.values(G.players)){ if(!!p.isP!==(g==='P'))continue; const h=seasonTotal(p,y,lv); if(!h)continue; const n=g==='P'?(h.outs||0)/3:(h.pa||0); if(n<mn)continue;
    if(posF&&p.pos!==posF)continue; if(roleF&&(roleF==='SP')!==isSPr(p))continue;
    const vx=dsVal(p,h,kx,y), vy=dsVal(p,h,ky,y); if(vx==null||vy==null||!isFinite(vx)||!isFinite(vy)){ miss++; continue; } pts.push({p,vx,vy,n,me:p.team===G.user,w:watch.has(p.id)}); }
  const opt=(k,cur)=>`<option value="${k}" ${k===cur?'selected':''}>${DS_L[k]}</option>`;
  const pre=DS_AX[g].find(x=>{ const [a,b]=x[0].split('_'); return a===kx&&b===ky; });
  const ctl=`<div class="row wrapr ds-ctl"><div class="seg sm"><button data-a="dsSet" data-v="G:B" class="${g==='B'?'on':''}">타자</button><button data-a="dsSet" data-v="G:P" class="${g==='P'?'on':''}">투수</button></div>
</div><div class="chips ds-pre" role="group" aria-label="기본 차트"><span class="small muted">기본 차트</span>${DS_AX[g].map(([k,l])=>{ const [a,b]=k.split('_'); return `<button data-a="dsAx" data-v="${k}" class="${pre&&pre[0]===k?'on':''}" title="${DS_L[a]} × ${DS_L[b]}">${l}</button>`; }).join('')}${pre?'':'<span class="small muted">· 직접 고른 축</span>'}</div><div class="row wrapr ds-ctl">
    <label class="ds-f"><span>가로축</span><select data-a="dsX" aria-label="가로축">${DS_M[g].filter(k=>k!==ky).map(k=>opt(k,kx)).join('')}</select></label>
    <label class="ds-f"><span>세로축</span><select data-a="dsYk" aria-label="세로축">${DS_M[g].filter(k=>k!==kx).map(k=>opt(k,ky)).join('')}</select></label>
    <label class="ds-f"><span>${g==='P'?'보직':'포지션'}</span><select data-a="dsPos" aria-label="포지션"><option value="">전체</option>${g==='P'?`<option value="SP" ${roleF==='SP'?'selected':''}>선발</option><option value="RP" ${roleF==='RP'?'selected':''}>불펜</option>`:DS_POS.map(k=>`<option value="${k}" ${posF===k?'selected':''}>${POSK[k]||k}</option>`).join('')}</select></label>
    <label class="ds-f"><span>최소 ${g==='P'?'이닝':'타석'}</span><select data-a="dsMinS" aria-label="최소 표본">${mins.map(v=>`<option value="${v}" ${mn===v?'selected':''}>${v}${g==='P'?'이닝':'타석'}+</option>`).join('')}</select></label>
    <div class="seg sm"><button data-a="dsSet" data-v="Y:cur" class="${UI.dsY!=='prev'?'on':''}">${statY()} 시즌</button><button data-a="dsSet" data-v="Y:prev" class="${UI.dsY==='prev'?'on':''}">${statY()-1} 시즌</button></div><div class="seg sm"><button data-a="dsSet" data-v="L:1군" class="${lv==='1군'?'on':''}">1군</button><button data-a="dsSet" data-v="L:퓨처스" class="${lv==='퓨처스'?'on':''}">2군</button></div></div>`;
  const missTxt=miss?` 두 지표 중 기록이 없는 ${miss}명은 빼고 그렸습니다${kx==='sal'||ky==='sal'?'(그 시즌 연봉 기록이 없는 선수 포함 — 연봉은 2026-11-01 업데이트부터 시즌마다 남깁니다)':''}.`:'';
  if(pts.length<2)return csec('리그 분포',ctl+dsMine()+`<p class="small muted">조건에 맞는 선수가 ${pts.length}명입니다.${missTxt}</p><button class="btn small" data-a="dsLoosen">조건 넓히기</button>`);
  const nar=typeof innerWidth==='number'&&innerWidth<600; const W=nar?400:560,H=nar?340:380,ml=nar?44:52,mr=nar?10:16,mt=14,mb=40; /* 휴대폰은 좌표 폭을 줄여 글자·점이 작아지지 않게 */ const ext=a=>{ let lo=Math.min(...a), hi=Math.max(...a); if(hi-lo<1e-9){ const d=Math.abs(lo)*.1||1; lo-=d; hi+=d; } const pad=(hi-lo)*.05; return [lo-pad,hi+pad]; };
  const [x0,x1]=ext(pts.map(d=>d.vx)), [y0,y1]=ext(pts.map(d=>d.vy)); const X=v=>ml+(v-x0)/(x1-x0)*(W-ml-mr), Yp=v=>H-mb-(v-y0)/(y1-y0)*(H-mt-mb);
  const ticks=(a,b)=>{ const st=(b-a)/4; return [0,1,2,3,4].map(i=>a+st*i); }; const avg=a=>a.reduce((s,v)=>s+v,0)/a.length; const mx=avg(pts.map(d=>d.vx)), my=avg(pts.map(d=>d.vy));
  const sel=pts.find(d=>d.p.id===UI.dsSel)||null;
  const mark=(d,cx,cy)=>d.w&&!d.me?(()=>{ const x=+cx, y=+cy, f=v=>v.toFixed(1); return `<path d="M${f(x)} ${f(y-6)} L${f(x+6)} ${f(y)} L${f(x)} ${f(y+6)} L${f(x-6)} ${f(y)} Z"></path>`; })():`<circle cx="${cx}" cy="${cy}" r="${d.me?5:4}"></circle>`;
  const dot=d=>{ const cx=X(d.vx).toFixed(1), cy=Yp(d.vy).toFixed(1); return `<g class="ds-p${d.me?' me':d.w?' w':''}${sel===d?' sel':''}" data-a="dsPick" data-v="${d.p.id}" data-x="${d.vx}" data-y="${d.vy}"><title>${esc(d.p.name)} · ${esc(d.p.team!=null?tshort(d.p.team):'소속 없음')} · ${DS_L[kx]} ${dsFmt(kx,d.vx)} · ${DS_L[ky]} ${dsFmt(ky,d.vy)} · ${g==='P'?Math.round(d.n)+'이닝':d.n+'타석'}</title><circle cx="${cx}" cy="${cy}" r="${d.me?5:4}" class="pt"></circle>${d.w&&!d.me?mark(d,cx,cy):''}<circle class="hit" cx="${cx}" cy="${cy}" r="11"></circle>${d.me||sel===d?`<text x="${(+cx+8).toFixed(1)}" y="${(+cy+4).toFixed(1)}">${esc(d.p.name)}</text>`:''}</g>`; };
  const order=[...pts.filter(d=>!d.me&&!d.w&&d!==sel),...pts.filter(d=>d.w&&!d.me&&d!==sel),...pts.filter(d=>d.me&&d!==sel),...(sel?[sel]:[])];
  const low=k=>DS_LOW[k]?' (낮을수록 좋음)':'';
  const svg=`<svg class="ds" viewBox="0 0 ${W} ${H}" role="img" aria-label="${DS_L[kx]}와 ${DS_L[ky]} 분포">
    ${ticks(x0,x1).map(v=>`<line class="gr" x1="${X(v)}" x2="${X(v)}" y1="${mt}" y2="${H-mb}"></line><text class="tk" x="${X(v)}" y="${H-mb+14}" text-anchor="middle">${dsFmt(kx,v)}</text>`).join('')}
    ${ticks(y0,y1).map(v=>`<line class="gr" x1="${ml}" x2="${W-mr}" y1="${Yp(v)}" y2="${Yp(v)}"></line><text class="tk" x="${ml-6}" y="${Yp(v)+4}" text-anchor="end">${dsFmt(ky,v)}</text>`).join('')}
    <line class="md" x1="${X(mx)}" x2="${X(mx)}" y1="${mt}" y2="${H-mb}"></line><line class="md" x1="${ml}" x2="${W-mr}" y1="${Yp(my)}" y2="${Yp(my)}"></line>
    <text class="al" x="${(ml+W-mr)/2}" y="${H-6}" text-anchor="middle">${DS_L[kx]}${low(kx)} →</text><text class="al" x="12" y="${(mt+H-mb)/2}" text-anchor="middle" transform="rotate(-90 12 ${(mt+H-mb)/2})">${DS_L[ky]}${low(ky)} →</text>
    ${order.map(dot).join('')}</svg>`;
  const mine=pts.filter(d=>d.me).sort((a,b)=>b.vy-a.vy);
  const near=sel?pts.filter(d=>d!==sel&&Math.hypot(X(d.vx)-X(sel.vx),Yp(d.vy)-Yp(sel.vy))<12).slice(0,8):[]; /* 터치 영역 안에 겹친 선수: 좌표를 흩뜨리지 않고 목록으로 고른다 */
  const nearBox=near.length?`<div class="ds-near small"><span class="muted">가까운 선수 ${near.length}명</span> ${near.map(d=>`<button class="tc-i" data-a="dsPick" data-v="${d.p.id}">${esc(d.p.name)} · ${esc(d.p.team!=null?tshort(d.p.team):'-')} · ${dsFmt(kx,d.vx)} / ${dsFmt(ky,d.vy)}</button>`).join('')}</div>`:'';
  const cmp=UI.pcmp||[]; const selBox=sel?`<div class="ds-sel"><div class="row between"><b>${esc(sel.p.name)}</b><button class="tc-i" data-a="dsPick" data-v="${sel.p.id}" aria-label="선택 해제">×</button></div><p class="small">${esc(sel.p.team!=null?tshort(sel.p.team):'소속 없음')} · ${posLabel(sel.p)} · ${sel.p.age}세 · ${DS_L[kx]} <b>${dsFmt(kx,sel.vx)}</b> · ${DS_L[ky]} <b>${dsFmt(ky,sel.vy)}</b> · ${g==='P'?ipStr(Math.round(sel.n*3))+'이닝':sel.n+'타석'}</p><div class="row wrapr"><button class="btn small" data-a="player" data-v="${sel.p.id}">선수 정보</button><button class="btn small" data-a="dsCmp" data-v="${sel.p.id}">${cmp.includes(sel.p.id)?'비교에서 빼기':'비교에 담기'}</button>${cmp.length>=2?`<button class="btn small primary" data-a="pcmpOpen">비교 보기(${cmp.length}명)</button>`:`<span class="small muted">${cmp.length?'한 명 더 담으면 비교할 수 있습니다':''}</span>`}</div>${nearBox}</div>`:`<p class="small muted">점을 누르면 아래에 기록 요약이 나옵니다.</p>`;
  return csec('리그 분포',ctl+dsMine()+`<div class="ds-w">${svg}</div><p class="small"><span class="ds-k"><i class="lg"></i>리그 선수 ${pts.length-mine.length}명</span> <span class="ds-k"><i class="me"></i>우리 선수 ${mine.length}명</span> <span class="ds-k"><i class="w dia"></i>관심 선수(마름모)</span> · 점선은 표시 선수 평균(${DS_L[kx]} ${dsFmt(kx,mx)} · ${DS_L[ky]} ${dsFmt(ky,my)})</p>${selBox}
    <details class="small"><summary>표로 보기(우리 선수)</summary><div class="tw"><table class="sqt"><thead><tr><th>선수</th><th>${DS_L[kx]}</th><th>${DS_L[ky]}</th><th>${g==='P'?'이닝':'타석'}</th></tr></thead><tbody>${mine.map(d=>`<tr class="click" data-a="player" data-v="${d.p.id}"><td>${esc(d.p.name)}</td><td>${dsFmt(kx,d.vx)}</td><td>${dsFmt(ky,d.vy)}</td><td>${g==='P'?Math.round(d.n):d.n}</td></tr>`).join('')}</tbody></table></div></details>
    <p class="small muted">${y} 시즌 ${lv==='1군'?'1군':'2군'} 기록, ${mn?(g==='P'?mn+'이닝':mn+'타석')+' 이상':'표본 제한 없음'}${posF?` · ${POSK[posF]||posF}`:roleF?` · ${roleF==='SP'?'선발':'불펜'}`:''}. 시즌 중 이적한 선수는 그 시즌 기록을 합친 점 하나, 포지션·보직은 지금 기준입니다. 축은 실제 최소~최대 값이라 이상치도 그대로 보입니다. 기록에 남은 지표만 쓰고 순위·추천은 매기지 않습니다.${missTxt}</p>`); }
/* ===== 구단 지표: 득점×실점, 피타고리안 기대 승률, 경기별 득실차와 최근 10경기 승률 (정규시즌 경기 기록 G.sea.tl) ===== */
function teamDataView(){ const T=G.teams.map(t=>({t,s:teamRuns(t.id)})); const g=Math.max(0,...T.map(x=>x.s.g)); if(g<3)return csec('구단 지표','<p class="small muted">정규시즌 경기가 3경기 이상 쌓이면 보입니다.</p>');
  const W=560,H=360,ml=46,mr=16,mt=14,mb=40; const xs=T.map(x=>x.s.rs/x.s.g), ys=T.map(x=>x.s.ra/x.s.g); const lo=Math.min(...xs,...ys)*.94, hi=Math.max(...xs,...ys)*1.04;
  const X=v=>ml+(v-lo)/(hi-lo)*(W-ml-mr), Y=v=>mt+(v-lo)/(hi-lo)*(H-mt-mb); /* 실점은 위쪽이 적다(위로 갈수록 좋음) */
  const tk=[0,1,2,3,4].map(i=>lo+(hi-lo)*i/4);
  const sc=`<svg class="ds" viewBox="0 0 ${W} ${H}" role="img" aria-label="구단별 경기당 득점과 실점">
    ${tk.map(v=>`<line class="gr" x1="${X(v)}" x2="${X(v)}" y1="${mt}" y2="${H-mb}"></line><text class="tk" x="${X(v)}" y="${H-mb+14}" text-anchor="middle">${v.toFixed(1)}</text><line class="gr" x1="${ml}" x2="${W-mr}" y1="${Y(v)}" y2="${Y(v)}"></line><text class="tk" x="${ml-6}" y="${Y(v)+4}" text-anchor="end">${v.toFixed(1)}</text>`).join('')}
    <line class="md" x1="${X(lo)}" y1="${Y(lo)}" x2="${X(hi)}" y2="${Y(hi)}"></line><text class="tk" x="${X(hi)-4}" y="${Y(hi)-6}" text-anchor="end">득점 = 실점</text>
    <text class="al" x="${(ml+W-mr)/2}" y="${H-6}" text-anchor="middle">경기당 득점 →</text><text class="al" x="12" y="${(mt+H-mb)/2}" text-anchor="middle" transform="rotate(-90 12 ${(mt+H-mb)/2})">← 경기당 실점(위가 적음)</text>
    ${T.map((x,i)=>`<g class="ds-p${x.t.id===G.user?' me':''}" data-a="lteamGo" data-v="${x.t.id}"><title>${esc(tshort(x.t.id))} · 경기당 득점 ${xs[i].toFixed(2)} · 실점 ${ys[i].toFixed(2)}</title><circle cx="${X(xs[i]).toFixed(1)}" cy="${Y(ys[i]).toFixed(1)}" r="6" style="${x.t.id===G.user?'':'opacity:.75'}"></circle><text x="${(X(xs[i])+8).toFixed(1)}" y="${(Y(ys[i])+4).toFixed(1)}">${esc(tshort(x.t.id))}</text></g>`).join('')}</svg>`;
  const rows=[...T].sort((a,b)=>(b.s.rs-b.s.ra)-(a.s.rs-a.s.ra)).map(x=>{ const s=x.s; const d=s.w-s.exW; return `<tr class="${x.t.id===G.user?'me':''}"><td>${badge(x.t.id,16)} ${esc(tshort(x.t.id))}</td><td class="num">${s.w}-${s.l}${s.t?`-${s.t}`:''}</td><td class="num">${s.rs}</td><td class="num">${s.ra}</td><td class="num"><b class="${s.rs-s.ra>0?'good-t':s.rs-s.ra<0?'bad-t':''}">${s.rs-s.ra>0?'+':''}${s.rs-s.ra}</b></td><td class="num">${fmt3(s.py)}</td><td class="num">${s.exW.toFixed(1)}</td><td class="num">${d>0?'+':''}${d.toFixed(1)}</td></tr>`; }).join('');
  const tid=UI.tdT??G.user; const s=teamRuns(tid); const n=s.L.length;
  const gw=560,gh=150,gl=36,gr=10,gt=10,gb=22; const md=Math.max(3,...s.L.map(x=>Math.abs(x[1]-x[2]))); const bx=i=>gl+(gw-gl-gr)*(i+.5)/n, bw=Math.max(1.5,(gw-gl-gr)/n-2), by=v=>gt+(gh-gt-gb)*(md-v)/(2*md);
  const bars=`<svg class="ds" viewBox="0 0 ${gw} ${gh}" role="img" aria-label="경기별 득실차"><line class="gr" x1="${gl}" x2="${gw-gr}" y1="${by(0)}" y2="${by(0)}"></line>${[md,-md].map(v=>`<text class="tk" x="${gl-4}" y="${by(v)+4}" text-anchor="end">${v>0?'+':''}${v}</text>`).join('')}
    ${s.L.map((x,i)=>{ const d=x[1]-x[2]; const y0=by(Math.max(0,d)), h=Math.max(1,Math.abs(by(d)-by(0))); return `<rect class="gl-b ${d>0?'w':d<0?'l':'t'}" x="${(bx(i)-bw/2).toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1"><title>${i+1}번째 경기 · ${dmd(x[5])} ${x[3]?'홈':'원정'} ${esc(tshort(x[4]))}전 ${x[1]}:${x[2]}</title></rect>`; }).join('')}
    <text class="tk" x="${gl}" y="${gh-6}">1경기</text><text class="tk" x="${gw-gr}" y="${gh-6}" text-anchor="end">${n}경기</text></svg>`;
  const roll=s.L.map((x,i)=>{ const w=s.L.slice(Math.max(0,i-9),i+1); const a=w.filter(z=>z[0]>0).length, b=w.filter(z=>z[0]<0).length; return a+b?a/(a+b):.5; });
  const ry=v=>gt+(gh-gt-gb)*(1-v); const line=`<svg class="ds" viewBox="0 0 ${gw} ${gh}" role="img" aria-label="최근 10경기 승률"><line class="md" x1="${gl}" x2="${gw-gr}" y1="${ry(.5)}" y2="${ry(.5)}"></line>${[0,.5,1].map(v=>`<text class="tk" x="${gl-4}" y="${ry(v)+4}" text-anchor="end">${v===.5?'.500':v?'1.000':'0'}</text>`).join('')}
    <polyline class="gl-l" points="${roll.map((v,i)=>`${bx(i).toFixed(1)},${ry(v).toFixed(1)}`).join(' ')}"></polyline>${roll.length?`<circle class="gl-d" cx="${bx(n-1).toFixed(1)}" cy="${ry(roll[n-1]).toFixed(1)}" r="4"><title>지금 최근 10경기 승률 ${fmt3(roll[n-1])}</title></circle>`:''}</svg>`;
  return csec('구단 지표',`<div class="eyebrow">경기당 득점 × 실점</div><div class="ds-w">${sc}</div><p class="small muted">오른쪽 위로 갈수록 점수를 많이 내고 적게 줍니다. 대각선 오른쪽 위는 득실차가 플러스인 구단입니다. 점을 누르면 그 구단을 봅니다.</p>
    <div class="tw"><table class="sqt"><thead><tr><th>구단</th><th>승-패</th><th>득점</th><th>실점</th><th>득실차</th><th>피타고리안 승률</th><th>기대 승수</th><th>실제-기대</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted">피타고리안 승률 = 득점^1.83 ÷ (득점^1.83 + 실점^1.83). 득실점으로 본 '실력만큼의' 승률이고, 실제 승수가 기대 승수보다 많으면 접전 운·불펜 운용이 따랐다고 봅니다(반대면 그만큼 덜 따름). 시즌이 길어질수록 둘이 가까워집니다.</p>
    <div class="row between" style="margin-top:10px"><span class="eyebrow">경기 흐름</span><select data-a="tdT" aria-label="구단">${G.teams.map(t=>`<option value="${t.id}" ${t.id===tid?'selected':''}>${esc(tshort(t.id))}</option>`).join('')}</select></div>
    <p class="small">경기별 득실차 <span class="ds-k"><i class="me"></i>승</span><span class="ds-k"><i class="lsq"></i>패</span></p><div class="ds-w">${bars}</div><p class="small">최근 10경기 승률(점선 .500)</p><div class="ds-w">${line}</div>
    <p class="small muted">정규시즌 경기만 셉니다. 막대에 마우스를 올리면 그 경기 상대와 점수가 보입니다.</p>`); }
/* 구장 효과(Savant식 평균 100): 설정(담장 치수로 계산한 홈런 지수)과 관측(이번 시즌 홈 경기 vs 원정 경기의 경기당 득점·홈런)을 나눠 보여 준다 */
function parkView(){ const L=G.teams.map(t=>{ const D=stadDim(t.id); const tl=((G.sea&&G.sea.tl)||[])[t.id]||[]; const H=tl.filter(x=>x[3]), A=tl.filter(x=>!x[3]); const pg=(a,f)=>a.length?a.reduce((s,x)=>s+f(x),0)/a.length:null;
    const rH=pg(H,x=>x[1]+x[2]), rA=pg(A,x=>x[1]+x[2]); const hH=pg(H.filter(x=>x.length>=8),x=>x[6]+x[7]), hA=pg(A.filter(x=>x.length>=8),x=>x[6]+x[7]);
    return {t,D,set:Math.round((parkHRM(t.id,'R')+parkHRM(t.id,'L'))/2*100),setR:Math.round(parkHRM(t.id,'R')*100),setL:Math.round(parkHRM(t.id,'L')*100),nH:H.length,nA:A.length,run:rH&&rA?Math.round(rH/rA*100):null,hr:hH&&hA?Math.round(hH/hA*100):null}; }).sort((a,b)=>b.set-a.set);
  const bar=(v,sub)=>{ const s=sub?`<span class="pk-s">${sub}</span>`:''; if(v==null)return `<span class="pk-v"><span class="pk-b"><em></em></span><b class="mu">경기 없음</b></span>${s}`; const d=clamp(v-100,-40,40); return `<span class="pk-v"><span class="pk-b"><i class="${d>=0?'up':'dn'}" style="${d>=0?'left:50%':`left:${50+d/80*100}%`};width:${Math.abs(d)/80*100}%"></i><em></em></span><b>${v}</b></span>${s}`; };
  return csec('구장 효과',`<div class="tw"><table class="sqt pk"><thead><tr><th>구장</th><th>좌·중·우(m)</th><th>담장 높이(m)</th><th>설정 홈런 지수</th><th>관측 득점 지수</th><th>관측 홈런 지수</th></tr></thead><tbody>${L.map(x=>`<tr class="${x.t.id===G.user?'me':''}"><td>${badge(x.t.id,16)} ${esc(stadName(x.t.id))}</td><td class="num">${x.D.lf}·${x.D.cf}·${x.D.rf}</td><td class="num">${x.D.wl===x.D.wr&&x.D.wl===x.D.wc?x.D.wl:`${x.D.wl}·${x.D.wc}·${x.D.wr}`}</td><td>${bar(x.set,`우타 ${x.setR} · 좌타 ${x.setL}`)}</td><td>${bar(x.run,`홈 ${x.nH} · 원정 ${x.nA}경기`)}</td><td>${bar(x.hr)}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">평균 100. 설정 홈런 지수는 담장 거리·높이로 엔진이 쓰는 값입니다(오른쪽 타석은 당기면 좌익, 왼쪽 타석은 우익). 관측 지수는 이번 시즌 그 구단의 홈 경기와 원정 경기의 경기당 득점·홈런(양 팀 합) 비율이라, 타자 구성·상대·표본의 영향이 섞입니다. 경기가 적을 때는 크게 흔들립니다. 구장을 고친 해는 그 전후를 나눠 보세요.</p>`); }
function teamsView(){
  const sel=UI.leagueTeam;
  const list=`<section class="card"><div class="row between"><h2 class="sec">10개 구단</h2><span class="small muted">구단을 누르면 선수단을 봅니다</span></div><div class="tgrid">${[...G.teams].sort((a,b)=>(a.id===G.user?-1:b.id===G.user?1:0)).map(teamCard).join('')}</div></section>`;
  if(sel==null)return list;
  const t=team(sel); const d=depth(sel);
  const grp=(title,arr)=>arr.length?`<div class="grp-h"><span>${title}</span><i>${arr.length}명</i></div>${cgrid(arr)}`:'';
  return `<section class="card"><div class="row between"><h2 class="sec">${tname(sel)}</h2><button class="x" data-a="lteam" data-v="" aria-label="닫기">×</button></div>
    <p class="small muted">${t.mode==='contend'?'우승 경쟁':'리빌딩'} · 구단주 ${OWNER[t.owner].label} · 관계 ${t.rel} · 캡 산정액 ${money(capPay(sel))}</p>
    ${(()=>{ const tt=inTabs('team',[['field','배치·라인업'],['cards','선수 목록']]); return tt.bar+(tt.cur==='field'?fieldSVG(sel,false)+lineupCard(sel):`${grp('주전',d.start)}${grp('선발 로테이션',d.sp)}${grp('불펜',d.pen)}${grp('백업',d.bench)}${grp('2군',d.futB.concat(d.futP))}${grp('부상',d.inj)}`); })()}
  </section>`+list;
}

