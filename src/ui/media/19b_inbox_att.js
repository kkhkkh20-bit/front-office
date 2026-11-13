/* 소식 첨부 자료(PC·FM식): 소식 내용에 맞는 자료 상자를 본문 아래에 붙인다.
   소식 종류(m.kind)와 본문에 나온 구단·선수 이름으로 고르고, 모두 지금 게임 데이터에서 만든다. */
const ibdRow=(l,v)=>`<div class="pf-fact"><span>${l}</span><b>${v}</b></div>`;
const ibdSec=(t,body,cls='')=>`<section class="ibd-sec ${cls}"><h3>${t}</h3>${body}</section>`;
const ibdTxt=m=>(m.subj||'')+'\n'+(m.body||'');
const ibdRec=tid=>{ const r=(G.sea&&G.sea.rec&&G.sea.rec[tid])||{w:0,l:0,t:0}; return `${r.w}승 ${r.l}패${r.t?' '+r.t+'무':''}`; };
const ibdRank=tid=>{ const S=standOrder(), o=S.order||[]; const i=o.findIndex(x=>(x.tid??x)===tid); if(i<0)return null; try{ if(S.live&&period()==='season')return tieRank(o,tid); }catch(e){} return i+1; }; /* 시즌 중 동률은 순위표·상단과 같은 공동 순위(검수 11-08) */
/* 남의 선수는 스카우트가 아는 만큼만(모르면 '?') */
function ibdOvr(p){ if(!p||hideOvr(p))return null; if(p.team===G.user)return ovr(p); const r=scoutReport(p); return r&&r.cur!=null?r.cur:null; }
function ibdTeamsIn(m){ const s=ibdTxt(m); const at=id=>{ const a=[s.indexOf(tshort(id)),s.indexOf(team(id).nick)].filter(i=>i>=0); return a.length?Math.min(...a):-1; }; return G.teams.map(t=>t.id).filter(id=>id!==G.user&&at(id)>=0).sort((a,b)=>at(a)-at(b)); } /* 본문에 먼저 나온 구단부터(플레이 테스트 11-13: 구단 번호순이라 엉뚱한 구단이 '소식 속 구단'으로 나왔다) */
/* 본문에 이름이 나온 선수: 우리 선수 먼저, 같은 이름은 한 번만 */
function ibdPlayersIn(m,skip){ const s=ibdTxt(m), seen=new Set(), L=[];
  const all=Object.values(G.players).filter(p=>p.name&&p.name.length>=2&&p.id!==skip&&(p.team!=null||p.foreign||p.watch)).sort((a,b)=>(b.team===G.user)-(a.team===G.user));
  for(const p of all){ if(seen.has(p.name)||!s.includes(p.name))continue; seen.add(p.name); L.push(p); if(L.length>=8)break; }
  return L; }
function ibdPlayers(L){ const sy=period()!=='season'&&period()!=='post'&&dobj(G.day).m<=3?G.year-1:G.year; /* 겨울(1~3월)에는 지난 시즌 기록: 연봉조정 근거(사용자 피드백 11-05) */ return ibdSec(`소식에 나온 선수 <em>${L.length}명</em>`,`<table class="ibd-t"><thead><tr><th>선수</th><th>소속</th><th>포지션</th><th>나이</th><th>종합</th><th>${sy===G.year?'올해':sy+'년'} 1군</th></tr></thead><tbody>${L.map(p=>{ const o=ibdOvr(p);
    return `<tr><td><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button></td><td>${p.team!=null?badge(p.team,14)+' '+esc(team(p.team).nick):'-'}</td><td>${esc(posLabel(p))}</td><td>${p.age}</td><td><b style="color:${o!=null?rcol(o):'var(--muted)'}">${o!=null?dv(o):'?'}</b></td><td class="small">${esc(statLine(seasonTotal(p,sy,'1군'),p))}</td></tr>`; }).join('')}</tbody></table>`,'ibd-wide'); }
/* 수비 배치: 세로로 본 구장 위에 선발 야수(타순 번호), 옆에 선발진·불펜 */
function ibdForm(tid,title){ const d=depth(tid), ord=new Map(d.start.map((p,i)=>[p.id,i+1]));
  const dot=(p,x,y,lab)=>{ if(!p)return ''; const o=ibdOvr(p), r=11;
    return `<g class="pfd ok"><title>${esc(p.name)} · ${lab}${o!=null?' · 종합 '+dv(o):''}</title><circle cx="${x}" cy="${y}" r="${r}" fill="${o!=null?rcol(o):'#5b6b79'}" stroke="#0b1014" stroke-width="1.2"/><text x="${x}" y="${y+3.6}" text-anchor="middle" class="pfd-v">${ord.get(p.id)||''}</text>${y+r+10>214?`<text x="${x+r+4}" y="${y+4}" class="pfd-l">${esc(p.name)}</text>`:`<text x="${x}" y="${y+r+10}" text-anchor="middle" class="pfd-l">${esc(p.name)}</text>`}</g>`; }; /* 포수는 구장 아래 끝이라 이름을 오른쪽에 */
  const dots=FIELD.map(k=>dot(d.ln[k],POS_XY[k][0],POS_XY[k][1],POSK[k])).join('')+(d.ln.DH?`<text x="38" y="178" text-anchor="middle" class="pfd-l">지명타자</text>${dot(d.ln.DH,38,194,'지명타자')}`:'');
  const pl=(p,i,lab)=>`<div><span>${lab||i+1}</span><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button><b style="color:${ibdOvr(p)!=null?rcol(ibdOvr(p)):'var(--muted)'}">${ibdOvr(p)!=null?dv(ibdOvr(p)):'?'}</b></div>`;
  return ibdSec(`${title} <em>${badge(tid,14)} ${esc(tshort(tid))}</em>`,`<div class="ibd-form"><svg viewBox="0 0 300 222" class="pf-field" role="img" aria-label="${esc(tshort(tid))} 수비 배치" preserveAspectRatio="xMidYMid meet">${POS_FIELD}${dots}</svg><div class="ibd-plist"><h4>선발진</h4>${d.sp.slice(0,5).map((p,i)=>pl(p,i)).join('')||'<p class="small muted">없음</p>'}<h4>불펜 핵심</h4>${d.pen.slice(0,3).map((p,i)=>pl(p,i,i?'':'마무리')).join('')||'<p class="small muted">없음</p>'}</div></div><p class="small muted">숫자는 타순 · 색은 종합 능력(모르면 회색)</p>`,'ibd-wide ibd-formsec'); }
/* 상대 구단 요약: 순위·전적·최근 흐름·팀 기록 순위·맞대결 */
function ibdOpp(tid,label){ const T=teamStats(G.year), me=T.find(x=>x.tid===tid), l10=l10Of(tid), h=h2hOf(G.user,tid), rk=ibdRank(tid);
  const nx=nextGames(40).filter(x=>x.op===tid).slice(0,3), gp=me&&me.g>0;
  return ibdSec(`${label} <em>${badge(tid,14)} ${esc(tshort(tid))}</em>`,`${ibdRow('순위',rk?(standOrder().live?rk+'위':`지난 시즌 ${rk}위`)+' · '+ibdRec(tid):ibdRec(tid))}${ibdRow('최근 10경기',l10.n?`${l10.w}승 ${l10.l}패${l10.t?' '+l10.t+'무':''}`:'경기 전')}${gp?ibdRow('팀 OPS',`${fmt3(me.ops)} (${rankIn(T,tid,'ops')}위)`)+ibdRow('팀 평균자책점',`${me.era.toFixed(2)} (${rankIn(T,tid,'era',true)}위)`)+ibdRow('홈런',`${me.hr}개 (${rankIn(T,tid,'hr')}위)`):''}${ibdRow('올해 맞대결',h.w+h.l+h.t?`우리 ${h.w}승 ${h.l}패${h.t?' '+h.t+'무':''}`:'아직 없음')}${ibdRow('다음 맞대결',nx.length?nx.map(x=>dmd(x.d)+(x.home?'(홈)':'(원정)')).join(', '):'일정 없음')}<button class="btn small" data-a="lteam" data-v="${tid}">구단 선수단 보기 ›</button>`); }
function ibdStand(){ const {order}=standOrder(); if(!order||!order.length)return ''; const top=order[0], gb=x=>((top.w-x.w)+(x.l-top.l))/2;
  return ibdSec('순위',`<table class="ibd-t ibd-st"><thead><tr><th></th><th>구단</th><th>승</th><th>패</th><th>무</th><th>승차</th><th>최근 10</th></tr></thead><tbody>${order.map((x,i)=>{ const t=x.tid??x, r=x.w!=null?x:(G.sea.rec[t]||{w:0,l:0}), L=l10Of(t);
    return `<tr class="${t===G.user?'me':''}${i===4?' cut':''}"><td>${i+1}</td><td>${badge(t,14)} ${esc(team(t).nick)}</td><td>${r.w}</td><td>${r.l}</td><td>${r.t||0}</td><td>${i?gb(r).toFixed(1):'-'}</td><td>${L.n?L.w+'-'+L.l:'-'}</td></tr>`; }).join('')}</tbody></table>`,'ibd-wide'); }
function ibdNext(n){ const L=nextGames(n); if(!L.length)return '';
  return ibdSec('다가오는 경기',L.map(x=>`<div class="ibd-gm"><span>${dmd(x.d)} ${WD[dobj(x.d).w]}</span><span class="pill">${x.ps?esc(x.ps):x.home?'홈':'원정'}</span><b>${badge(x.op,14)} ${esc(tshort(x.op))}</b><em>${ibdRank(x.op)?ibdRank(x.op)+'위':''}</em></div>`).join('')); }
/* 자리별 리그 순위: 1위가 가장 긴 막대 */
function ibdSlots(tid){ const R=slotRanks(tid), n=G.teams.length;
  return ibdSec('자리별 전력 순위',`<div class="ibd-bars ibd-slot">${PSLOTS.map(k=>{ const r=R[k].rank; return `<div><span>${SLOTK[k]}</span><i class="${r<=3?'good':r>=n-2?'bad':''}" style="width:${Math.round((n+1-r)/n*100)}%"></i><b>${r}위</b></div>`; }).join('')}</div><p class="small muted">리그 ${n}개 구단 중 같은 자리 주전 비교</p>`); }
function ibdGauge(l,v,goal){ v=Math.round(v); return `<div class="ibd-gg"><span>${l}</span><div><i style="width:${clamp(v,0,100)}%" class="${goal!=null?(v>=goal?'good':'bad'):''}"></i>${goal!=null?`<u style="left:${clamp(goal,0,100)}%" title="목표 ${goal}"></u>`:''}</div><b>${v}${goal!=null?`<em>/${goal}</em>`:''}</b></div>`; }
function ibdPR(owner){ const g=G.goals||{}, t=team(G.user), rk=ibdRank(G.user), log=(G.ownerLog||[]).slice(0,5);
  const a=ibdSec('여론·신뢰',`${ibdGauge('팬 여론',G.pr.fan,g.fan)}${ibdGauge('언론 논조',G.pr.press,null)}${t.trust!=null?ibdGauge('구단주 신뢰',t.trust,null):''}${owner&&g.rank?ibdRow('목표 순위',`${g.rank}위 이내 · ${standOrder().live?`지금 ${rk||'-'}위`:`지난 시즌 ${rk||'-'}위`}`)+(g.sup!=null?ibdRow('적자 보전 목표',Math.round(g.sup*100)+'% 이하'):''):''}<p class="small muted">${g.fan!=null?'세로 선은 구단주 목표':''}</p>`);
  return owner&&log.length?a+ibdSec('구단주 평가 기록',log.map(x=>ibdRow(`${x.m}월`,`${esc(x.mood)} · 신뢰 ${x.trust} (${x.delta>=0?'+':''}${x.delta})`)).join('')):a; }
function ibdFin(){ let b; try{ b=budget(); }catch(e){ return ''; } const top=(L,n)=>[...L].filter(x=>x[1]>0).sort((x,y)=>y[1]-x[1]).slice(0,n), mx=Math.max(1,...b.inc.map(x=>x[1]),...b.exp.map(x=>x[1]));
  const bars=(L,c)=>`<div class="ibd-bars ibd-money">${L.map(x=>`<div><span>${esc(x[0])}</span><i class="${c}" style="width:${Math.round(x[1]/mx*100)}%"></i><b>${money(x[1])}</b></div>`).join('')}</div>`;
  return ibdSec('올해 예산',`${ibdRow('예상 수입',money(b.I))}${ibdRow('예상 지출',money(b.E))}${ibdRow('예산 여유',`<span class="${b.roomGoal<0?'bad':''}">${money(b.roomGoal)}</span>`)}${ibdRow('보유 현금',money(b.cash))}${b.support?ibdRow('구단주 보전',money(b.support)):''}`)
    +ibdSec('큰 수입',bars(top(b.inc,5),'good'))+ibdSec('큰 지출',bars(top(b.exp,5),'')); }
/* 소식 종류별 구성 */
function ibKindAtt(m,pid){ const k=m.kind, T=ibdTeamsIn(m), nx=(nextGames(1)||[])[0], S=[]; const add=h=>{ if(h)S.push(h); };
  const opp=T[0]!=null?T[0]:['분석','월간','감독'].includes(k)&&nx?nx.op:null, oppL=T[0]!=null?'소식 속 구단':'다음 상대';
  const per=period(), live=per==='season'||per==='post';
  if(k==='월간'||(k==='분석'&&m.from==='전력분석팀'&&/월 전력 분석 보고/.test(m.subj||'')))add(teamReport(m)); /* 월간 소식에는 팀 성적 보고서 문서를 맨 앞에 */
  if(k==='분석'){ add(ibdSlots(G.user)); add(ibdForm(G.user,'우리 수비 배치')); if(opp!=null){ add(ibdOpp(opp,oppL)); add(ibdForm(opp,oppL+' 수비 배치')); } }
  else if(k==='월간'){ add(ibdStand()); add(ibdNext(6)); if(opp!=null)add(ibdOpp(opp,oppL)); }
  else if(k==='감독'){ add(ibdForm(G.user,'우리 수비 배치')); add(ibdNext(5)); if(opp!=null)add(ibdOpp(opp,oppL)); }
  else if(k==='구단주'){ add(ibdPR(true)); if(live)add(ibdStand()); }
  else if(k==='언론'){ add(ibdPR(false)); if(live)add(ibdNext(4)); }
  else if(k==='재정'||k==='스폰서')add(ibdFin());
  else if(k==='일정'||k==='엔트리'){ add(ibdNext(6)); add(ibdForm(G.user,'우리 수비 배치')); }
  if(!['분석','월간','감독','언론'].includes(k)&&T.length){ add(ibdOpp(T[0],'소식 속 구단')); add(ibdForm(T[0],'소식 속 구단 수비 배치')); }
  const P=ibdPlayersIn(m,pid); if(P.length>=(pid!=null?2:1))add(ibdPlayers(P));
  return S; }
