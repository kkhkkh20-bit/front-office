/* ---------- 리그 탭 ---------- */
/* 예전 하위 탭 이름 → 지금 자리 */
function lsegFix(s){ if(s==='board'||!s)return 'stand'; if(s==='sched'){ UI.it=UI.it||{}; UI.it.sres='cal'; return 'score'; } if(s==='games')return 'score'; if(s==='lead')return 'rec'; return s; }
function leagueView(){ UI.lseg=lsegFix(UI.lseg); UI.lseg=ALIAS.league[UI.lseg]||UI.lseg; if(!SUBS.league.some(x=>x[0]===UI.lseg))UI.lseg='stand';
  const s=UI.lseg;
  return subTabs('league')+mergedBody('league',s,{feat:featView,abroad:abroadView,hist:histView,stand:standView,score:scoreHub,wire:wireView,teams:teamsView,rec:recView,dist:distView,tdata:teamDataView,assoc:assocView,nt:ntView});
}
/* 리그 분포(FM식 산점도): 같은 시즌·같은 군 기록으로 두 지표를 함께. 리그 선수는 회색, 우리 선수는 강조와 이름. 기록에 있는 지표만 쓰고 숨은 능력은 쓰지 않는다 */
const DS_AX={B:[['obp_slg','출루율 × 장타율'],['bb_k','볼넷% × 삼진%'],['sal_war','연봉 × WAR']],P:[['bb9_k9','BB/9 × K/9'],['era_whip','ERA × WHIP'],['sal_war','연봉 × WAR']]};
function dsVal(p,h,k){ if(k==='sal')return p.sal; if(k==='war')return wOf(h,p); if(p.isP){ const r=pRate(h); return {bb9:r.bb9,k9:r.k9,era:r.era,whip:r.whip}[k]; } const r=bRate(h); return {obp:r.obp,slg:r.slg,bb:h.pa?h.bb/h.pa*100:null,k:h.pa?h.so/h.pa*100:null}[k]; }
const DS_L={obp:'출루율',slg:'장타율',bb:'볼넷%',k:'삼진%',sal:'연봉',war:'WAR',bb9:'BB/9',k9:'K/9',era:'ERA',whip:'WHIP'};
function distView(){ const g=UI.dsG==='P'?'P':'B'; const ax=(DS_AX[g].find(x=>x[0]===UI.dsAx)||DS_AX[g][0])[0]; const [kx,ky]=ax.split('_'); const lv=UI.dsLv==='퓨처스'?'퓨처스':'1군'; const y=UI.dsY==='prev'?statY()-1:statY();
  const mins=g==='P'?[10,30,60]:[50,100,200]; const mn=+(UI.dsMin||mins[1]); const watch=new Set([...(G.shortlist||[]),...((G.pwatch||[]).map(x=>x&&x.id!=null?x.id:x))]);
  const pts=[]; for(const p of Object.values(G.players)){ if(!!p.isP!==(g==='P'))continue; const h=seasonTotal(p,y,lv); if(!h)continue; const n=g==='P'?(h.outs||0)/3:(h.pa||0); if(n<mn)continue; const vx=dsVal(p,h,kx), vy=dsVal(p,h,ky); if(vx==null||vy==null||!isFinite(vx)||!isFinite(vy))continue; pts.push({p,vx,vy,n,me:p.team===G.user,w:watch.has(p.id)}); }
  const ctl=`<div class="row wrapr ds-ctl"><div class="seg sm"><button data-a="dsSet" data-v="G:B" class="${g==='B'?'on':''}">타자</button><button data-a="dsSet" data-v="G:P" class="${g==='P'?'on':''}">투수</button></div><select data-a="dsAx" aria-label="축">${DS_AX[g].map(([k,l])=>`<option value="${k}" ${k===ax?'selected':''}>${l}</option>`).join('')}</select><div class="seg sm"><button data-a="dsSet" data-v="Y:cur" class="${UI.dsY!=='prev'?'on':''}">${statY()} 시즌</button><button data-a="dsSet" data-v="Y:prev" class="${UI.dsY==='prev'?'on':''}">${statY()-1} 시즌</button></div><div class="seg sm"><button data-a="dsSet" data-v="L:1군" class="${lv==='1군'?'on':''}">1군</button><button data-a="dsSet" data-v="L:퓨처스" class="${lv==='퓨처스'?'on':''}">2군</button></div><div class="seg sm">${mins.map(v=>`<button data-a="dsSet" data-v="M:${v}" class="${mn===v?'on':''}">${g==='P'?v+'이닝':v+'타석'}+</button>`).join('')}</div></div>`;
  if(pts.length<5)return csec('리그 분포',ctl+`<p class="small muted">조건에 맞는 기록이 ${pts.length}명뿐입니다. 시즌·최소 기준을 바꿔 보세요.</p>`);
  const W=560,H=380,ml=48,mr=14,mt=12,mb=40; const ext=a=>{ const s=[...a].sort((x,y)=>x-y); const lo=s[Math.floor(s.length*.01)], hi=s[Math.ceil(s.length*.99)-1]; const pad=(hi-lo)*.06||1; return [lo-pad,hi+pad]; };
  const [x0,x1]=ext(pts.map(d=>d.vx)), [y0,y1]=ext(pts.map(d=>d.vy)); const X=v=>ml+(clamp(v,x0,x1)-x0)/(x1-x0)*(W-ml-mr), Yp=v=>H-mb-(clamp(v,y0,y1)-y0)/(y1-y0)*(H-mt-mb);
  const fmt=(k,v)=>k==='sal'?money(v):['obp','slg'].includes(k)?fmt3(v):k==='bb'||k==='k'?v.toFixed(1)+'%':k==='war'?v.toFixed(1):v.toFixed(2);
  const ticks=(a,b)=>{ const st=(b-a)/4; return [0,1,2,3,4].map(i=>a+st*i); }; const med=a=>{ const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; }; const mx=med(pts.map(d=>d.vx)), my=med(pts.map(d=>d.vy));
  const dot=d=>`<g class="ds-p${d.me?' me':d.w?' w':''}" data-a="player" data-v="${d.p.id}"><title>${esc(d.p.name)} · ${esc(tshort(d.p.team!=null?d.p.team:G.user))} · ${DS_L[kx]} ${fmt(kx,d.vx)} · ${DS_L[ky]} ${fmt(ky,d.vy)} · ${g==='P'?Math.round(d.n)+'이닝':d.n+'타석'}</title><circle cx="${X(d.vx).toFixed(1)}" cy="${Yp(d.vy).toFixed(1)}" r="${d.me||d.w?5:4}"></circle><circle class="hit" cx="${X(d.vx).toFixed(1)}" cy="${Yp(d.vy).toFixed(1)}" r="9"></circle>${d.me||d.w?`<text x="${(X(d.vx)+7).toFixed(1)}" y="${(Yp(d.vy)+4).toFixed(1)}">${esc(d.p.name)}</text>`:''}</g>`;
  const order=[...pts.filter(d=>!d.me&&!d.w),...pts.filter(d=>d.w&&!d.me),...pts.filter(d=>d.me)];
  const svg=`<svg class="ds" viewBox="0 0 ${W} ${H}" role="img" aria-label="${DS_L[kx]}와 ${DS_L[ky]} 분포">
    ${ticks(x0,x1).map(v=>`<line class="gr" x1="${X(v)}" x2="${X(v)}" y1="${mt}" y2="${H-mb}"></line><text class="tk" x="${X(v)}" y="${H-mb+14}" text-anchor="middle">${fmt(kx,v)}</text>`).join('')}
    ${ticks(y0,y1).map(v=>`<line class="gr" x1="${ml}" x2="${W-mr}" y1="${Yp(v)}" y2="${Yp(v)}"></line><text class="tk" x="${ml-6}" y="${Yp(v)+4}" text-anchor="end">${fmt(ky,v)}</text>`).join('')}
    <line class="md" x1="${X(mx)}" x2="${X(mx)}" y1="${mt}" y2="${H-mb}"></line><line class="md" x1="${ml}" x2="${W-mr}" y1="${Yp(my)}" y2="${Yp(my)}"></line>
    <text class="al" x="${(ml+W-mr)/2}" y="${H-6}" text-anchor="middle">${DS_L[kx]} →</text><text class="al" x="12" y="${(mt+H-mb)/2}" text-anchor="middle" transform="rotate(-90 12 ${(mt+H-mb)/2})">${DS_L[ky]} →</text>
    ${order.map(dot).join('')}</svg>`;
  const mine=pts.filter(d=>d.me).sort((a,b)=>b.vy-a.vy);
  return csec('리그 분포',ctl+`<div class="ds-w">${svg}</div><p class="small"><span class="ds-k"><i class="lg"></i>리그 선수 ${pts.length-mine.length}명</span> <span class="ds-k"><i class="me"></i>우리 선수 ${mine.length}명</span> <span class="ds-k"><i class="w"></i>관심 선수</span> · 점선은 리그 중앙값</p>
    <details class="small"><summary>표로 보기(우리 선수)</summary><div class="tw"><table class="sqt"><thead><tr><th>선수</th><th>${DS_L[kx]}</th><th>${DS_L[ky]}</th><th>${g==='P'?'이닝':'타석'}</th></tr></thead><tbody>${mine.map(d=>`<tr class="click" data-a="player" data-v="${d.p.id}"><td>${esc(d.p.name)}</td><td>${fmt(kx,d.vx)}</td><td>${fmt(ky,d.vy)}</td><td>${g==='P'?Math.round(d.n):d.n}</td></tr>`).join('')}</tbody></table></div></details>
    <p class="small muted">${y} 시즌 ${lv==='1군'?'1군':'2군'} 기록만, ${g==='P'?mn+'이닝':mn+'타석'} 이상인 선수입니다. 기록에 남은 지표만 쓰고 순위·추천은 매기지 않습니다. 점을 누르면 선수 정보가 열립니다.</p>`); }
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

