/* ---------- 중계 2: 타석 패널 · 승리 확률 · 오늘의 선수 ---------- */
const RE24={'000':[.48,.25,.10],'100':[.85,.50,.22],'010':[1.10,.65,.32],'001':[1.35,.95,.35],'110':[1.45,.90,.44],'101':[1.75,1.15,.48],'011':[1.95,1.35,.57],'111':[2.25,1.55,.75]};
function cErf(x){ const t=1/(1+.3275911*Math.abs(x)); const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x); return x>=0?y:-y; }
/* 홈팀 승리 확률: 점수 차 + 지금 주자·아웃으로 기대되는 득점 + 남은 이닝의 불확실성 */
function wpHome(st){ const D0=st.sh-st.sa; const half=st.half; const outs=Math.min(2,st.outs); const key=st.bases.map(b=>b?1:0).join(''); const re=st.outs>=3?0:(RE24[key]||RE24['000'])[outs];
  const bot=half%2===1; if(half>=17&&bot&&D0>0)return 1; let D=D0+(bot?re:.48-re); /* 초 공격 중이면 홈팀은 아직 말 공격이 남아 있음 */ const remHalf=Math.max(0,17-half)+(st.outs>=3?0:(3-outs)/3); const v=Math.max(.25,remHalf*.95);
  return clamp(.5+.5*cErf((D+.08)/Math.sqrt(2*v)),.005,.995); }
function cOrderNo(g,half,id){ const s=g.box[half%2?'h':'a']; const i=s.bat.findIndex(b=>b.id===id); return i<0?null:(s.bat[i].o!=null?s.bat[i].o:i%9)+1; }
function cNext(g,half,id){ const s=g.box[half%2?'h':'a']; const B=s.bat.slice(0,9); const i=B.findIndex(b=>b.id===id); if(i<0)return []; return [B[(i+1)%9],B[(i+2)%9]].filter(Boolean); }
const PAK={'1B':['안타','h'],'2B':['2루타','h'],'3B':['3루타','h'],HR:['홈런','hr'],BB:['볼넷','bb'],K:['삼진','k'],OUT:['범타','o'],DP:['병살','o'],SAC:['희생번트','o']};
function cChips(g,k,id){ const L=g.pbp; const out=[]; for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(x[1]===id){ const r=PAK[x[3]]||['?','o']; out.push(`<i class="pk ${r[1]}">${cHalfTxt(x[0]).replace('회초','').replace('회말','')}${r[0]}</i>`); } } return out.join('')||'<i class="pk n">첫 타석</i>'; }
function abPanel(g,k){ const L=g.pbp; const x=L[Math.min(k,L.length-1)]; const bid=k<L.length&&typeof x[1]==='number'?x[1]:null; const pid=cPit(g,Math.min(k,L.length-1));
  const b=bid&&G.players[bid], p=pid&&G.players[pid]; if(!b||!p)return '';
  const st=cBefore(g,k); const no=cOrderNo(g,x[0],bid); const r=batAt(g,k,bid); const h=r; const ov=scoutReport(b).cur, pv=scoutReport(p).cur;
  let pitch=''; try{ const d=detailOf(p,scoutReport(p)); const ars=d.groups.find(gx=>gx[0]==='구종'); const best=ars?[...ars[1]].sort((a,c)=>c[1]-a[1])[0]:null; pitch=`직구 평균 ${veloOf(p)}·최고 ${veloMax(p)}km${best?` · ${best[0].replace(' · 결정구','')}`:''}`; }catch(e){}
  const nx=cNext(g,x[0],bid).map(n=>{ const q=G.players[n.id]; return q?`${cOrderNo(g,x[0],n.id)}번 ${esc(fname(q))}`:''; }).filter(Boolean).join(' · ');
  const risp=!!(st.bases[1]||st.bases[2]); const late=st.half>=14&&Math.abs(st.sa-st.sh)<=2;
  return `<div class="ab ${risp?'risp':''}${late?' late':''}"><button class="ab-b" data-a="castPlayer" data-v="${bid}"><span class="ab-f">${avImg(b,true)}<b class="ab-o" style="--c:${rcol(ov)}">${dv(ov??'-')}</b><span class="ab-res" id="cs-abr"></span></span>
      <span class="ab-t"><em>${no?no+'번 타자':'타자'} · ${posLabel(b)} · ${hand(b)} ${acqTag(b)}</em><b>${esc(b.name)}</b><span class="ab-s">${r?`타율 <strong>${fmt3(r.avg)}</strong> · ${h.hr}홈런 · OPS ${fmt3(r.ops)}`:'시즌 기록 없음'}</span><span class="ab-pk">${cChips(g,k,bid)}</span></span></button>
    <button class="ab-p" data-a="castPlayer" data-v="${pid}">${avImg(p)}<span><em>투수 · ${p.th==='좌'?'좌완':'우완'} ${acqTag(p)}</em><b>${esc(fname(p))}</b><span>${rchip(pv)} ERA ${eraAt(g,k,pid)}</span><span>${esc(pitch)}</span><span>오늘 ${cToday(g,k,pid,true)}</span></span></button>
    ${nx?`<div class="ab-nx">대기 ${nx}</div>`:''}</div>`; }
function cAbRes(t,cls){ const el=document.getElementById('cs-abr'); if(!el)return; el.className='ab-res'; void el.offsetWidth; el.textContent=t; el.className='ab-res on '+(cls||''); }
function cWp(g,st,prev){ const bar=document.getElementById('cs-wpa'); const tx=document.getElementById('cs-wpt'); if(!bar)return; const w=wpHome(st); bar.style.width=(w*100).toFixed(1)+'%';
  const mine=g.home===G.user||g.away===G.user; const fav=mine?G.user:(w>=.5?g.home:g.away); const wf=fav===g.home?w:1-w; const pct=Math.round(wf*100); let d=''; if(prev!=null){ const dd=Math.round((w-prev)*100); if(Math.abs(dd)>=8){ const who=dd>0?g.home:g.away; d=` <b class="wpd">${esc(tshort(who))} +${Math.abs(dd)}%</b>`; } }
  tx.innerHTML=`${esc(tshort(fav))} 승리 확률 ${pct}%${d}`; return w; }
/* 오늘의 선수: 승리 확률을 가장 많이 끌어올린 선수 */
function gameMvp(g){ const S=wpaMap(g); if(g.hs===g.as)return null; const win=g.hs>g.as?g.home:g.away; const pool=Object.entries(S).map(([id,v])=>({p:G.players[+id],v})).filter(o=>o.p&&o.p.team===win).sort((a,b)=>b.v-a.v); return pool[0]||null; }

/* ---------- 중계 3: 단장의 눈 — 내가 짠 선수단이 어떻게 굴러가는지 ---------- */
/* 영입 경로 꼬리표: 우리 구단으로 들어온 최근(4시즌 안) 결정만 */
function acqOf(p){ if(!p||p.team!==G.user)return null; const nm=tname(G.user); const S=p.story||[];
  for(let i=S.length-1;i>=0;i--){ const s=S[i]; if(s.k!=='move'&&s.k!=='draft')continue; if(!s.t.includes(nm))continue; if(s.y<G.year-3||(G.gmSince!=null&&s.y<G.gmSince))return null;
    const t=s.t; const k=/트레이드/.test(t)?'트레이드':/보상선수/.test(t)?'보상선수':/FA 이적/.test(t)?'FA 영입':/FA 잔류/.test(t)?'FA 잔류':/입단/.test(t)?'외국인':/지명/.test(t)?'지명':/복귀/.test(t)?'복귀':null;
    if(k)return {k,y:s.y,t}; }
  return null; }
const ACQC={'트레이드':'tr','보상선수':'tr','FA 영입':'fa','FA 잔류':'fa','외국인':'fo','지명':'dr','복귀':'fa'};
function acqTag(p){ const a=acqOf(p); return a?`<i class="acq ${ACQC[a.k]||''}" title="${esc(a.t)}">${a.k==='지명'?`${String(a.y).slice(2)}년 지명`:`${a.k} ${String(a.y).slice(2)}`}</i>`:''; }
/* 타석별 승리 확률 기여 */
function wpaMap(g){ const L=g.pbp||[]; const S={}; for(let k=0;k<L.length;k++){ const x=L[k]; if(typeof x[1]!=='number')continue; const b=cBefore(g,k); const a={sa:x[7],sh:x[8],outs:x[4],bases:x[4]>=3?[0,0,0]:x[5],half:x[0]};
    if(x[4]>=3){ a.half=x[0]+1; a.outs=0; a.bases=[0,0,0]; } let d=(k===L.length-1?(g.hs>g.as?1:g.hs<g.as?0:.5):wpHome(a))-wpHome(b); if(x[0]%2===0)d=-d; S[x[1]]=(S[x[1]]||0)+d; S[x[2]]=(S[x[2]]||0)-d; }
  return S; }
function batToday(b){ return `${b.ab}타수 ${b.h}안타${b.hr?` ${b.hr}홈런`:''}${b.rbi?` ${b.rbi}타점`:''}${b.bb?` ${b.bb}볼넷`:''}${b.so?` ${b.so}삼진`:''}`; }
function pitToday(q){ return `${Math.floor(q.outs/3)}${q.outs%3?'.'+q.outs%3:''}이닝 ${q.pc||0}구 ${q.er}자책${q.so?` ${q.so}K`:''}${q.d?` · ${q.d}`:''}`; }
/* 경기 중: 우리 타선 띠 */
function ourStrip(g,k){ const me=g.home===G.user?'h':g.away===G.user?'a':null; if(!me||!g.box)return ''; const L=g.pbp; const cur=k<L.length&&typeof L[k][1]==='number'?L[k][1]:null;
  const R={}; for(let i=0;i<k&&i<L.length;i++){ const x=L[i]; if(typeof x[1]!=='number')continue; (R[x[1]]=R[x[1]]||[]).push((PAK[x[3]]||['','o'])[1]); }
  const B=g.box[me].bat.slice(0,12); if(!B.length)return '';
  return `<div class="ostrip"><span class="ost-l">우리<br>타선</span>${B.map(b=>{ const p=G.players[b.id]; if(!p)return ''; const a=acqOf(p);
    return `<button class="ost${b.id===cur?' on':''}" data-a="castPlayer" data-v="${b.id}">${avImg(p)}${a?`<i class="ost-a ${ACQC[a.k]||''}"></i>`:''}<b>${esc(fname(p))}</b><span class="od">${(R[b.id]||[]).map(c=>`<i class="${c}"></i>`).join('')||'<em>-</em>'}</span></button>`; }).join('')}</div>`; }
/* 최근 10경기: 어디가 문제인가 */
function gmTrend(){ const G10=(G.games||[]).filter(x=>x.box&&(x.home===G.user||x.away===G.user)).slice(0,10); if(G10.length<3)return null;
  const pos={}, all={ab:0,h:0,tb:0,bb:0}; let spO=0,spE=0,rpO=0,rpE=0,spN=0;
  for(const x of G10){ const s=x.box[x.home===G.user?'h':'a'];
    for(const b of s.bat){ const k=b.pos||'?'; const o=pos[k]=pos[k]||{ab:0,h:0,tb:0,bb:0}; const tb=b.h+(b.d||0)+2*(b.tr||0)+3*(b.hr||0); for(const t of [o,all]){ t.ab+=b.ab; t.h+=b.h; t.tb+=tb; t.bb+=b.bb||0; } }
    s.pit.forEach((q,i)=>{ if(i===0){ spO+=q.outs; spE+=q.er; spN++; } else { rpO+=q.outs; rpE+=q.er; } }); }
  const ops=o=>o.ab+o.bb?(o.h+o.bb)/(o.ab+o.bb)+(o.ab?o.tb/o.ab:0):0;
  const P=Object.entries(pos).filter(([k,o])=>SLOTS_S[k]&&o.ab+o.bb>=18).map(([k,o])=>({k,ops:ops(o),pa:o.ab+o.bb})).sort((a,b)=>a.ops-b.ops);
  return {n:G10.length,tops:ops(all),weak:P[0]||null,best:P[P.length-1]||null,spEra:spO?spE*27/spO:0,rpEra:rpO?rpE*27/rpO:0,spIp:spN?spO/3/spN:0}; }
/* 연투: 같은 날짜 연속 등판 */
function relStreak(id,day){ const days=new Set((G.games||[]).filter(x=>x.box&&(x.home===G.user||x.away===G.user)&&[...x.box.h.pit,...x.box.a.pit].some(q=>q.id===id)).map(x=>x.day)); let n=0; while(days.has(day-n))n++; return n; }
function gmMemo(g){ const me=g.home===G.user?'h':g.away===G.user?'a':null; if(!me||!g.box)return ''; const op=me==='h'?'a':'h'; const S=g.pbp?wpaMap(g):{};
  const row=(p,main,sub,extra)=>`<div class="gm-r"><button class="gm-p" data-a="castPlayer" data-v="${p.id}">${avImg(p)}<span><b>${esc(p.name)} ${acqTag(p)}</b><em>${main}</em>${sub?`<i>${sub}</i>`:''}</span></button>${extra||''}</div>`;
  const ours=g.box[me].bat.map(b=>({b,p:G.players[b.id],v:S[b.id]||0})).filter(o=>o.p&&o.b.ab+(o.b.bb||0)>0);
  const best=[...ours].sort((a,c)=>c.v-a.v||c.b.h-a.b.h)[0]; const worst=[...ours].sort((a,c)=>a.v-c.v||(c.b.so-a.b.so))[0];
  let H='';
  const sec=(t,body)=>body?`<div class="gm-s"><div class="gm-h">${t}</div>${body}</div>`:'';
  /* 타선 */
  let bat=''; if(best&&(best.v>.04||best.b.h>=2||best.b.hr))bat+=row(best.p,`잘했다 · ${batToday(best.b)}`,l10Text(best.p));
  if(worst&&worst!==best&&(worst.v<-.06||(worst.b.h===0&&worst.b.ab>=3)))bat+=row(worst.p,`아쉬웠다 · ${batToday(worst.b)}`,l10Text(worst.p));
  H+=sec('우리 타선',bat);
  /* 마운드 */
  const pit=g.box[me].pit.map((q,i)=>({q,i,p:G.players[q.id]})).filter(o=>o.p); let mp='';
  if(pit[0]){ const s=pit[0]; mp+=row(s.p,`선발 · ${pitToday(s.q)}`,l10Text(s.p)); }
  const pen=pit.slice(1); if(pen.length){ const o=sum(pen.map(x=>x.q.outs)), e=sum(pen.map(x=>x.q.er)), pc=sum(pen.map(x=>x.q.pc||0));
    const bad=pen.filter(x=>x.q.er>=2).sort((a,c)=>c.q.er-a.q.er)[0];
    mp+=`<p class="gm-n">불펜 ${pen.length}명 ${Math.floor(o/3)}${o%3?'.'+o%3:''}이닝 ${pc}구 ${e}자책</p>`; if(bad)mp+=row(bad.p,`흔들렸다 · ${pitToday(bad.q)}`,l10Text(bad.p)); }
  H+=sec('마운드',mp);
  /* 내 결정 */
  const mine=[...g.box[me].bat.map(b=>({p:G.players[b.id],t:batToday(b)})),...g.box[me].pit.map(q=>({p:G.players[q.id],t:pitToday(q)}))].filter(o=>o.p&&acqOf(o.p)&&o.p!==best?.p&&o.p!==worst?.p);
  H+=sec('내가 데려온 선수',mine.slice(0,4).map(o=>row(o.p,o.t,o.p.isP?pLine(o.p):bLine(o.p))).join(''));
  /* 지친 선수 */
  const tired=[]; for(const q of g.box[me].pit.slice(1)){ const n=relStreak(q.id,g.day); const p=G.players[q.id]; if(p&&n>=3)tired.push(row(p,`${n}일 연속 등판`,`지금 상태: ${fatText(p)} ${fatBar(p)}`)); }
  const fatL=[...g.box[me].bat.map(b=>b.id),...g.box[me].pit.map(q=>q.id)].map(id=>G.players[id]).filter(p=>p&&p.team===G.user&&(p.fat||0)>=60&&!tired.some(t=>t.includes(`data-v="${p.id}"`))).sort((a,c)=>c.fat-a.fat).slice(0,2);
  for(const p of fatL)tired.push(row(p,`${fatText(p)} · 피로 ${Math.round(p.fat)} ${fatBar(p)}`,'감독이 곧 쉬게 할 가능성이 큽니다.'));
  H+=sec('지친 선수',tired.slice(0,3).join(''));
  /* 최근 10경기 흐름 */
  const T=gmTrend(); if(T){ let tr=''; const fix=(k,l)=>tradeOpen()?`<button class="tc-i go" data-a="gmFix" data-v="${k}">${l}</button>`:'';
    if(T.weak&&T.weak.ops<T.tops-.1)tr+=`<div class="gm-t bad"><span>${SLOTS_S[T.weak.k]} 자리 OPS <b>${fmt3(T.weak.ops)}</b> <i>팀 ${fmt3(T.tops)}</i></span>${fix(T.weak.k,'보강 후보')}</div>`;
    if(T.rpEra>=5.2||T.rpEra>=T.spEra+1.5)tr+=`<div class="gm-t bad"><span>불펜 평균자책 <b>${T.rpEra.toFixed(2)}</b> <i>선발 ${T.spEra.toFixed(2)}</i></span>${fix('RP','불펜 후보')}</div>`;
    if(T.spIp&&T.spIp<5)tr+=`<div class="gm-t bad"><span>선발 평균 <b>${ipStr(Math.round(T.spIp*3))}이닝</b> <i>불펜 부담</i></span>${fix('SP','선발 후보')}</div>`;
    if(!tr)tr=`<div class="gm-t"><span>팀 OPS <b>${fmt3(T.tops)}</b> · 선발 ${T.spEra.toFixed(2)} · 불펜 ${T.rpEra.toFixed(2)}</span><i class="small muted">눈에 띄는 구멍 없음</i></div>`;
    H+=sec(`최근 ${T.n}경기 흐름`,tr); }
  /* 상대 팀에서 눈에 띈 선수 */
  const opp=[...g.box[op].bat.map(b=>({id:b.id,t:batToday(b)})),...g.box[op].pit.map(q=>({id:q.id,t:pitToday(q)}))].map(o=>({...o,p:G.players[o.id],v:S[o.id]||0})).filter(o=>o.p&&o.p.team!=null&&o.p.team!==G.user&&!o.p.foreign).sort((a,c)=>c.v-a.v)[0];
  if(opp&&opp.v>.08){ const on=(G.pwatch||[]).includes(opp.p.id);
    H+=sec('상대 팀에서 눈에 띈 선수',row(opp.p,opp.t,`${opp.p.isP?pLine(opp.p):bLine(opp.p)}`,`<div class="gm-b"><button class="tc-i${on?' on':''}" data-a="pwatch" data-v="${opp.p.id}">${on?'관심 중':'관심'}</button>${tradeOpen()?`<button class="tc-i go" data-a="findT" data-v="${opp.p.id}">얻을 조건</button>`:''}</div>`)); }
  return H?`<div class="gm-memo"><div class="gm-ttl">단장 메모</div>${H}</div>`:''; }
/* 다른 구단 관심 선수 목록 */
function pwatchToggle(id){ G.pwatch=G.pwatch||[]; const i=G.pwatch.indexOf(id); if(i>=0){ G.pwatch.splice(i,1); return false; } G.pwatch.unshift(id); G.pwatch=G.pwatch.slice(0,12); return true; }
function pwatchBox(){ const L=(G.pwatch||[]).map(id=>G.players[id]).filter(p=>p&&p.team!=null&&p.team!==G.user); if(!L.length)return '';
  return `<section class="card"><div class="row between"><h2 class="sec">관심 선수</h2><span class="small muted">경기·선수 정보에서 표시</span></div><div class="pwl">${L.map(p=>`<div class="pwr"><div class="pwm">${pMini(p)}<span class="small muted">${badge(p.team,14)} ${tshort(p.team)} · ${l10Text(p)||'최근 기록 없음'}</span></div><span class="pwb"><button class="tc-i go" data-a="findT" data-v="${p.id}">조건 찾기</button><button class="tc-i" data-a="pwatch" data-v="${p.id}">빼기</button></span></div>`).join('')}</div></section>`; }

