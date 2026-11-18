/* ===== 관리자 › 래더 현황 대시보드(구단주 11-18 "관리자에 래더를 좀 더 앞의 탭으로 … 여러 통계 등 데이터를 볼 수 있게. 발전시켜 줘") =====
   설계: docs/design/ladder-admin-dashboard-2026-11-18.md. 구조·문체는 구단주의 GA4 대시보드(탭 · 큰 숫자 + 한 줄 설명 카드 · 먼저 확인할 것 · 평소와 다른 것 · 패치 표시선)를 따른다.
   서버: GET /api/v1/admin/lstats?range= (집계) · lplayers(표) · lplayer(한 명). 모두 관리자 키(CUP_ADMIN) 뒤 읽기 전용.
   탭: 개요 · 참여·유지 · 단계·메타 · 경쟁 균형 · 플레이어 · 운영(예전 래더 현황 화면 그대로: 등록·이상 감지·진행 중 리그·덱 숨김/삭제·CSV) · 상태.
   PC는 칸마다 안에서 스크롤(한 화면), 휴대폰 390은 위에서 아래로 쌓고 표·그림은 칸 안에서 가로 스크롤. 그림은 인라인 SVG(외부 라이브러리 없음) */
const LDX={tab:'ov',range:'7d',st:'',d:null,err:'',pl:null,plSt:'',plQ:{q:'',tier:'all',sort:'seen',desc:1,off:0},one:null,oneSt:''};
const LDX_TABS=[['ov','개요'],['eng','참여·유지'],['tier','단계·메타'],['bal','경쟁 균형'],['pl','플레이어'],['ops','운영'],['hl','상태']];
const LDX_RANGES=[['today','오늘'],['7d','7일'],['30d','30일'],['season','이번 시즌']];
const LDX_REJ={edited:'편집된 저장',bad_rating:'능력치 범위 밖(20~80)',bad_ovr:'정상급 과다(프런트컵만)',bad_pay:'연봉 합 불일치(프런트컵만)'};
async function ldxLoad(){ LDX.st='loading'; LDX.err=''; try{ render(); }catch(e){}
  try{ const {r,j}=await ldaApi('/api/v1/admin/lstats?range='+encodeURIComponent(LDX.range)); if(r.ok){ LDX.d=j; LDX.st='ok'; } else { LDX.st='err'; LDX.err=j.message||('서버 응답 '+r.status); } }
  catch(e){ LDX.st='err'; LDX.err='서버에 연결할 수 없습니다.'; }
  try{ render(); }catch(e){} }
async function ldxPlayers(){ const Q=LDX.plQ, q=new URLSearchParams({sort:Q.sort,desc:Q.desc?'1':'0',n:'50',off:String(Q.off|0)}); if(Q.q)q.set('q',Q.q); if(Q.tier!=='all')q.set('tier',Q.tier);
  LDX.plSt='loading'; try{ render(); }catch(e){}
  try{ const {r,j}=await ldaApi('/api/v1/admin/lplayers?'+q); LDX.pl=r.ok?j:null; LDX.plSt=r.ok?'ok':'err'; }catch(e){ LDX.plSt='err'; } try{ render(); }catch(e){} }
const ldxPct=(v,d)=>v==null?'-':(v*100).toFixed(d==null?1:d)+'%';
const ldxT=t=>FrontOfficeCore.ulTierName(t);
const ldxMD=d=>String(d||'').slice(5).replace('-','/');
/* 직전 같은 기간 대비 */
function ldxDelta(c,p,lowerGood){ if(p==null||c==null)return ''; const d=c-p; if(!p&&!c)return '<span class="ldx-dl">변화 없음</span>'; const pct=p?Math.round(d/p*100):null, good=lowerGood?d<0:d>0;
  return `<span class="ldx-dl ${d===0?'':good?'up':'dn'}">${d>0?'▲':d<0?'▼':'='} ${ldaN(Math.abs(d))}${pct!=null&&d?` (${pct>0?'+':''}${pct}%)`:''} <small>직전 ${ldaN(p)}</small></span>`; }
function ldxCard(lab,val,unit,note,delta,cls){ return `<div class="ldx-kpi${cls?' '+cls:''}"><span class="ldx-kl">${lab}</span><b class="ldx-kv num">${val}<small>${unit||''}</small></b>${delta||''}<p class="ldx-kn">${note}</p></div>`; }
/* ---- 그림: 선 그래프(패치 표시선) ---- */
function ldxPatches(days){ const out=[]; try{ if(typeof PATCH==='undefined')return out; const set=new Set(days); const by={}; for(const p of PATCH){ const d=String(p.id||'').slice(0,10); if(!set.has(d))continue; (by[d]=by[d]||[]).push(p.t); } for(const d in by)out.push({day:d,t:by[d]}); }catch(e){} return out; }
function ldxLine(T,series,o){ o=o||{}; const W=640,H=o.h||150,L=34,R=8,Tp=10,B=20, n=T.length; if(!n)return '<p class="small muted">자료가 없습니다.</p>';
  const mx=Math.max(1,...series.flatMap(s=>T.map(x=>+x[s[0]]||0))), x=i=>L+(n<2?0:i*(W-L-R)/(n-1)), y=v=>Tp+(H-Tp-B)*(1-v/mx);
  const grid=[0,.5,1].map(f=>`<line x1="${L}" x2="${W-R}" y1="${y(mx*f).toFixed(1)}" y2="${y(mx*f).toFixed(1)}" class="ldx-gr"/><text x="${L-4}" y="${(y(mx*f)+3).toFixed(1)}" text-anchor="end" class="ldx-ax">${ldaN(Math.round(mx*f))}</text>`).join('');
  const days=T.map(t=>t.day), pt=ldxPatches(days).map(p=>{ const i=days.indexOf(p.day), xx=x(i).toFixed(1); return `<g class="ldx-patch"><line x1="${xx}" x2="${xx}" y1="${Tp}" y2="${H-B}"/><circle cx="${xx}" cy="${Tp+2}" r="3"/><title>${esc(ldxMD(p.day))} 패치: ${esc(p.t.join(' / '))}</title></g>`; }).join('');
  const lines=series.map(([k,lab,cls])=>`<polyline class="ldx-ln ${cls}" points="${T.map((t,i)=>`${x(i).toFixed(1)},${y(+t[k]||0).toFixed(1)}`).join(' ')}"/>${T.map((t,i)=>`<circle class="ldx-pt ${cls}" cx="${x(i).toFixed(1)}" cy="${y(+t[k]||0).toFixed(1)}" r="2.4"><title>${esc(ldxMD(t.day))} ${lab} ${ldaN(t[k]||0)}</title></circle>`).join('')}`).join('');
  const ticks=T.map((t,i)=>i%Math.max(1,Math.ceil(n/8))===0||i===n-1?`<text x="${x(i).toFixed(1)}" y="${H-5}" text-anchor="${i===n-1?'end':i===0?'start':'middle'}" class="ldx-ax">${ldxMD(t.day)}</text>`:'').join('');
  return `<div class="ldx-lg">${series.map(([k,lab,cls])=>`<span class="${cls}"><i></i>${lab}</span>`).join('')}${pt?'<span class="ldx-pk"><i></i>패치(눌러 보기)</span>':''}</div><div class="ldx-svg"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label||'추이')}">${grid}${pt}${lines}${ticks}</svg></div>`; }
/* ---- 그림: 날짜 × 시간(한국시간) 열지도 ---- */
function ldxHeat(Hm){ const mx=Math.max(1,...Hm.flatMap(r=>r.h)); return `<div class="ldx-svg"><table class="ldx-heat" aria-label="날짜 × 시간 리그 완료"><thead><tr><th></th>${Array.from({length:24},(_,h)=>`<th>${h%3?'':h}</th>`).join('')}</tr></thead><tbody>${Hm.map(r=>`<tr><th>${ldxMD(r.day)}</th>${r.h.map((v,h)=>`<td style="--a:${(v/mx).toFixed(2)}" title="${ldxMD(r.day)} ${h}시 · 리그 ${v}">${v?'':''}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">칸 = 그 시간에 끝난 리그 수(진할수록 많음). 한국시간.</p>`; }
/* ---- 깔때기: 가장 크게 빠지는 단계를 빨강 ---- */
function ldxFunnel(F){ if(!F||!F.length||!F[0].n)return '<p class="small muted">등록 덱이 없습니다.</p>'; let worst=-1, wv=2; F.forEach((x,i)=>{ if(i&&x.step!=null&&x.step<wv){ wv=x.step; worst=i; } });
  return `<div class="ldx-fun">${F.map((x,i)=>`<div class="${i===worst?'bad':''}"><span>${esc(x.k)}</span><span class="ldx-fb"><i style="width:${Math.max(1,x.pct*100)}%"></i></span><b class="num">${ldaN(x.n)}</b><small class="num">${ldxPct(x.pct,0)}${i?` · 앞 단계의 ${ldxPct(x.step,0)}`:''}</small></div>`).join('')}</div><p class="small muted">${worst>0?`가장 크게 빠지는 곳: <b class="ldx-bad">${esc(F[worst-1].k)} → ${esc(F[worst].k)}</b>(${ldxPct(1-wv,0)}가 멈춤).`:''} 처음부터 지금까지 등록 덱 기준. 단계마다 앞 조건을 모두 채운 덱만 셉니다.</p>`; }
/* ---- 코호트: 처음 등록한 날 × 며칠 뒤에도 왔나 · 오른 단계 ---- */
function ldxCohort(C){ const cell=(v,n)=>{ if(v==null)return '<td class="na" title="아직 그날이 오지 않음">·</td>'; const p=n?v/n:0; return `<td class="${n<5?'thin':''}" style="--a:${p.toFixed(2)}" title="${v}/${n}${n<5?' (표본 적음)':''}">${n?Math.round(p*100)+'%':'-'}</td>`; };
  const rows=C.filter(x=>x.n); if(!rows.length)return '<p class="small muted">최근 14일에 처음 등록한 덱이 없습니다.</p>';
  return `<div class="ldx-svg"><table class="ldx-coh"><thead><tr><th>처음 등록</th><th>덱</th><th>1일 뒤</th><th>3일 뒤</th><th>7일 뒤</th><th>마이너+</th><th>1부+</th><th>챔피언스+</th><th>레전드</th></tr></thead><tbody>${rows.map(x=>`<tr><th>${ldxMD(x.day)}</th><td class="num n">${x.n}</td>${cell(x.r1,x.n)}${cell(x.r3,x.n)}${cell(x.r7,x.n)}${[1,2,3,4].map(t=>cell(x.tier[t],x.n)).join('')}</tr>`).join('')}</tbody></table></div><p class="small muted">N일 뒤 = 처음 등록하고 N일이 지난 뒤에도 접속·덱 갱신이 있었던 비율. 단계 = 지금까지 올라가 본 단계. 흐린 칸은 그날 덱이 5개 미만(표본 적음).</p>`; }
/* ---- OVR ↔ 승률 산점도 ---- */
function ldxScatter(S){ const P=(S||[]).filter(x=>x.ovr>0); if(P.length<2)return '<p class="small muted">이번 시즌 리그를 마친 덱이 2개 이상이면 그려집니다.</p>';
  const W=420,H=220,L=34,B=24,lo=Math.min(...P.map(x=>x.ovr))-1,hi=Math.max(...P.map(x=>x.ovr))+1, x=v=>L+(W-L-8)*(v-lo)/Math.max(1,hi-lo), y=v=>8+(H-8-B)*(1-v);
  return `<div class="ldx-svg"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="덱 OVR과 승률"><line x1="${L}" x2="${W-8}" y1="${y(.5)}" y2="${y(.5)}" class="ldx-ref"/>${[0,.5,1].map(v=>`<text x="${L-4}" y="${y(v)+3}" text-anchor="end" class="ldx-ax">${v.toFixed(1)}</text>`).join('')}
    ${[lo,Math.round((lo+hi)/2),hi].map(v=>`<text x="${x(v).toFixed(1)}" y="${H-6}" text-anchor="middle" class="ldx-ax">${v}</text>`).join('')}${P.map(p=>`<circle class="ldx-dot ldx-t${p.tier|0}${p.n<2?' thin':''}" cx="${x(p.ovr).toFixed(1)}" cy="${y(p.wp).toFixed(1)}" r="${Math.min(7,3+p.n/2).toFixed(1)}"><title>OVR ${p.ovr} · 승률 ${p.wp.toFixed(3)} · 리그 ${p.n} · ${esc(ldxT(p.tier))}</title></circle>`).join('')}</svg></div>
    <div class="ldx-lg">${FrontOfficeCore.UL_TIERS.map((n,t)=>`<span class="ldx-t${t}"><i></i>${n}</span>`).join('')}</div><p class="small muted">가로 = 덱 OVR, 세로 = 이번 시즌 승률(무승부 절반). 점 크기 = 리그 수, 흐린 점 = 리그 1개(표본 적음).</p>`; }
/* ---- 판정: 먼저 확인할 것(빨강 문제 · 노랑 확인) · 평소와 다른 것(7일 기준) ---- */
function ldxFindings(d){ const F=[], P=d.people, H=d.health, T=d.trend, td=T[T.length-1]||{}, base=k=>{ const v=T.slice(-8,-1).map(x=>x[k]||0); return v.reduce((a,b)=>a+b,0)/Math.max(1,v.length); };
  const wp=H.free&&H.free.d1_w?H.d1_w/H.free.d1_w:0; if(wp>=.8)F.push(['bad',`D1 쓰기가 무료 한도의 ${ldxPct(wp,0)}입니다. 오늘 안에 한도를 넘을 수 있습니다.`]); else if(wp>=.5)F.push(['warn',`D1 쓰기가 무료 한도의 ${ldxPct(wp,0)}입니다.`]);
  const rb=base('rej'); if((td.rej||0)>=5&&(td.rej||0)>=3*Math.max(1,rb))F.push(['bad',`오늘 거절된 덱이 ${td.rej}개로 평소(하루 ${rb.toFixed(1)}개)보다 많습니다. '상태' 탭에서 사유를 보세요.`]);
  if(H.err5_today>=5)F.push(['bad',`오늘 서버 오류(500)가 ${H.err5_today}번 났습니다.`]); else if(H.err5_today)F.push(['warn',`오늘 서버 오류(500) ${H.err5_today}번.`]);
  if(P.active.d1>0&&H.last_league&&d.at-H.last_league>86400e3)F.push(['bad',`활성 플레이어가 있는데 ${ldaAgo(H.last_league)} 뒤로 끝난 리그가 없습니다(리그 진행이 멈췄을 수 있음).`]);
  if(H.live_stale)F.push(['warn',`진행 중 리그 ${H.live}개 가운데 ${H.live_stale}개가 하루 넘게 소식이 없습니다.`]);
  for(const t of d.tiers)if(t.n>=3&&t.leagues>=3&&!t.up&&!t.down)F.push(['warn',`${t.name}: 이 기간 리그 ${t.leagues}개가 끝났는데 승격·강등이 한 번도 없습니다.`]);
  const B=d.balance; if(B.n>=10&&B.corr!=null&&B.corr<.1)F.push(['warn',`덱 OVR과 승률의 상관이 ${B.corr}로 낮습니다(전력이 결과를 거의 못 가름).`]); if(B.titles>=5&&B.top10_share>=.5)F.push(['warn',`우승의 ${ldxPct(B.top10_share,0)}를 상위 10% 플레이어가 가져갔습니다(쏠림).`]);
  const fun=d.funnel||[]; if(fun[0]&&fun[0].n>=10&&fun[1]&&fun[1].step<.3)F.push(['warn',`등록 덱의 ${ldxPct(fun[1].step,0)}만 첫 리그를 마쳤습니다.`]);
  if(P.decks<30)F.push(['info',`등록 덱이 ${P.decks}개라 비율·순위가 크게 흔들립니다(표본 적음).`]);
  return F; }
function ldxAnoms(d){ const T=d.trend, td=T[T.length-1]||{}, out=[]; for(const [k,lab] of [['active','활성 플레이어'],['decks_new','새 덱'],['leagues','완료 리그'],['promos','승격'],['demos','강등'],['rej','거절 덱'],['err5','서버 오류']]){
    const v=T.slice(-8,-1).map(x=>x[k]||0), b=v.reduce((a,x)=>a+x,0)/Math.max(1,v.length), c=td[k]||0; if(b<2&&c<4)continue; const r=b?c/b:9;
    if(r>=1.5||r<=.5)out.push({lab,c,b,r}); }
  return out; }
/* ---- 탭 본문 ---- */
function ldxOv(d){ const P=d.people, c=d.cur, p=d.prev, R=d.range, rj=d.rej.reduce((a,x)=>a+x.n,0), rjp=d.rej.reduce((a,x)=>a+x.prev,0), H=d.health, wp=H.free.d1_w?H.d1_w/H.free.d1_w:0;
  const per=`${LDX_RANGES.find(x=>x[0]===R.key)[1]}`;
  const cards=`<div class="ldx-kpis">${[
    ldxCard('등록 덱',ldaN(P.decks),'개',`서버에 올라 있는 래더 덱. 이 기간 새로 ${ldaN(P.new_range)}개.`,ldxDelta(P.new_range,P.new_prev)),
    ldxCard('실제 플레이어',ldaN(P.players),'명',`덱을 가진 익명 플레이어 id 수. 기기 묶음으로 보면 약 ${ldaN(P.dev_groups)}명.`,''),
    ldxCard('활성 1일',ldaN(P.active.d1),'명','오늘 접속했거나 덱이 갱신된 플레이어.',ldxDelta(P.active.d1,P.active_prev.d1)),
    ldxCard('활성 7일',ldaN(P.active.d7),'명','최근 7일 안에 접속·갱신.',ldxDelta(P.active.d7,P.active_prev.d7)),
    ldxCard('활성 30일',ldaN(P.active.d30),'명',`전체 플레이어 ${ldaN(P.all_players)}명 가운데.`,''),
    ldxCard('완료 리그',ldaN(c.leagues),'개',`${per} 동안 끝난 리그(정규+포스트시즌).`,ldxDelta(c.leagues,p.leagues)),
    ldxCard('승격 · 강등',`${ldaN(c.promos)} · ${ldaN(c.demos)}`,'',`${per} 동안. 승격률 ${c.leagues?ldxPct(c.promos/c.leagues,0):'-'}.`,ldxDelta(c.promos,p.promos)),
    ldxCard('거절 덱',ldaN(rj),'개','편집된 저장·능력치 범위 밖으로 받지 않은 등록.',ldxDelta(rj,rjp,true),rj?'warn':''),
    ldxCard('자동 · 직접 · 끔',`${ldaN(P.auto)} · ${ldaN(P.manual)} · ${ldaN(P.off)}`,'','자동 등록 덱 · 직접 등록 덱 · 자동 참가를 끈 플레이어.',''),
    ldxCard('D1 쓰기(오늘)',ldxPct(wp,0),'',`${ldaN(H.d1_w)}줄 / 무료 ${ldaN(H.free.d1_w)}줄(추정).`,'',wp>=.8?'bad':wp>=.5?'warn':''),
  ].join('')}</div>`;
  const F=ldxFindings(d), A=ldxAnoms(d), N=Math.max(14,Math.min(30,R.days)), T=d.trend.slice(-N);
  const find=`<section class="card ldx-find"><h2 class="sec">먼저 확인할 것</h2>${F.length?`<ul>${F.map(([k,t])=>`<li class="${k}">${esc(t)}</li>`).join('')}</ul>`:'<p class="small">지금 눈에 띄는 문제는 없습니다.</p>'}<p class="small muted">빨강 = 문제로 보이는 것, 노랑 = 확인이 필요한 것, 파랑 = 참고. 받을 때마다 다시 계산합니다.</p></section>`;
  const anom=`<section class="card ldx-anom"><h2 class="sec">평소와 다른 것 <small>오늘 vs 직전 7일 평균</small></h2>${A.length?`<ul>${A.map(x=>`<li><b>${x.lab}</b> 오늘 <b class="num">${ldaN(x.c)}</b> · 평소 <span class="num">${x.b.toFixed(1)}</span> <span class="${x.r>=1.5?'up':'dn'}">${x.r>=1.5?'▲':'▼'} ${x.b?Math.round(x.r*100)+'%':'새로'}</span></li>`).join('')}</ul>`:'<p class="small">평소와 크게 다른 숫자가 없습니다.</p>'}<p class="small muted">평소의 1.5배 이상 또는 절반 이하만 적습니다(오늘은 진행 중이라 낮게 보일 수 있음).</p></section>`;
  const trend=`<section class="card ldx-wide"><h2 class="sec">날마다 <small>최근 ${N}일 · 점선 = 패치</small></h2>${ldxLine(T,[['active','활성 플레이어','s1'],['decks_new','새 덱','s2'],['leagues','완료 리그','s3']],{label:'활성·새 덱·완료 리그 추이'})}
    ${(()=>{ const pk=T.reduce((a,x)=>x.leagues>(a?a.leagues:-1)?x:a,null); return pk&&pk.leagues?`<p class="small muted">완료 리그가 가장 많았던 날은 <b>${ldxMD(pk.day)}</b>(${ldaN(pk.leagues)}개)입니다. 오늘 숫자는 하루가 끝나지 않아 낮게 보입니다.</p>`:''; })()}</section>`;
  return [cards+trend, find+anom+ldxPeople(d)]; }
function ldxPeople(d){ const P=d.people, D=P.devices; return `<section class="card"><h2 class="sec">플레이어 수 보는 법</h2><table class="lda-t"><tbody>
    <tr><th>등록 덱</th><td class="num">${ldaN(P.decks)}</td></tr><tr><th>실제 플레이어(익명 id)</th><td class="num">${ldaN(P.players)}</td></tr><tr><th>기기 묶음 추정</th><td class="num">${ldaN(P.dev_groups)}</td></tr>
    <tr><th>기기 연결한 플레이어</th><td class="num">${ldaN(P.linked)}</td></tr><tr><th>기기 1대 · 2대 · 3대+</th><td class="num">${ldaN(D[1])} · ${ldaN(D[2])} · ${ldaN(D[3])}</td></tr><tr><th>숨긴 덱</th><td class="num">${ldaN(P.hidden)}</td></tr></tbody></table>
    <p class="small muted">덱은 플레이어 id(브라우저마다 만드는 익명 토큰)로 묶습니다. 한 사람이 기기 두 대에서 연결 없이 하면 두 명으로 셉니다. '기기 묶음'은 같은 기기 표식(해시)으로 올라온 덱을 하나로 본 추정입니다.</p></section>`; }
function ldxEng(d){ const P=d.people;
  return [`<section class="card ldx-wide"><h2 class="sec">깔때기 <small>등록 → 첫 리그 → 3리그 → 승격 → 우승</small></h2>${ldxFunnel(d.funnel)}</section>
    <section class="card ldx-wide"><h2 class="sec">코호트 <small>처음 등록한 날별 · 최근 14일</small></h2>${ldxCohort(d.cohort)}</section>
    <section class="card ldx-wide"><h2 class="sec">날짜 × 시간 <small>최근 14일 리그 완료(한국시간)</small></h2>${ldxHeat(d.heat)}</section>`,
    `<section class="card"><h2 class="sec">등록 방식</h2><div class="ldx-kpis ldx-k2">${ldxCard('자동 등록',ldaN(P.auto),'덱','하루 한 번·시즌 끝에 1군을 자동으로 올림.','')}${ldxCard('직접 등록',ldaN(P.manual),'덱','래더 › 덱에서 직접(하루 1회).','')}${ldxCard('자동 참가 끔',ldaN(P.off),'명','끄면 서버 덱을 지움.','')}${ldxCard('기기 연결',ldaN(P.linked),'명','다른 기기와 연결한 플레이어.','')}</div></section>`+ldxPeople(d)]; }
function ldxTier(d){ const T=d.tiers, mx=Math.max(1,...T.map(t=>t.n));
  const dist=`<section class="card ldx-wide"><h2 class="sec">단계 분포 <small>등록 덱 · 7일 활성 · 평균 OVR</small></h2><div class="lda-tiers">${T.slice().reverse().map(t=>`<div><span>${esc(t.name)}</span><span class="lda-hb"><i style="width:${t.n/mx*100}%"></i><i class="d" style="width:${t.active7/mx*100}%"></i></span><span class="num small">${t.n}덱 · 활성 ${t.active7} · OVR ${t.avg||'-'}</span></div>`).join('')}</div><p class="small muted">막대: 등록 덱(진한 색) · 그중 7일 활성(옅은 색).</p></section>`;
  const flow=`<section class="card ldx-wide"><h2 class="sec">승강 흐름 <small>${esc(LDX_RANGES.find(x=>x[0]===d.range.key)[1])} 동안 끝난 리그</small></h2><div class="ldx-svg"><table class="lda-t ldx-flow"><thead><tr><th>단계</th><th>리그</th><th>승격</th><th>잔류</th><th>강등</th><th>흐름</th></tr></thead><tbody>${T.slice().reverse().map(t=>{ const n=Math.max(1,t.leagues); return `<tr><th>${esc(t.name)}</th><td class="num">${t.leagues}</td><td class="num">${t.up} <small>${t.leagues?ldxPct(t.up/n,0):''}</small></td><td class="num">${t.stay}</td><td class="num">${t.down} <small>${t.leagues?ldxPct(t.down/n,0):''}</small></td><td><span class="ldx-stk">${t.leagues?`<i class="up" style="width:${t.up/n*100}%"></i><i class="st" style="width:${t.stay/n*100}%"></i><i class="dn" style="width:${t.down/n*100}%"></i>`:''}</span></td></tr>`; }).join('')}</tbody></table></div><p class="small muted">정규 1·2위 승격(우승팀도), 9·10위 강등. 루키는 강등 없음, 레전드는 승격 없음.</p></section>`;
  const C=FrontOfficeCore, meta=`<section class="card ldx-wide"><h2 class="sec">덱 구성 <small>단계별 평균</small></h2><div class="ldx-svg"><table class="lda-t"><thead><tr><th>단계</th><th>덱 OVR</th><th>타자</th><th>투수</th><th>선발 5</th><th>불펜 5</th><th>많은 성향</th></tr></thead><tbody>${T.slice().reverse().map(t=>{ const a=t.arch?Object.entries(t.arch).sort((x,y)=>y[1]-x[1])[0]:null; return `<tr><th>${esc(t.name)}</th><td class="num">${t.avg||'-'}</td><td class="num">${t.b||'-'}</td><td class="num">${t.p||'-'}</td><td class="num">${t.sp??'-'}</td><td class="num">${t.rp??'-'}</td><td>${a&&a[1]?`${esc(C.UL_ARCH[a[0]]||a[0])} <small class="muted">${Math.round(a[1]/Math.max(1,t.meta_n)*100)}%</small>`:'-'}</td></tr>`; }).join('')}</tbody></table></div><p class="small muted">타자·투수 = 덱 OVR의 타자·투수 쪽. 선발·불펜 = 덱 구성 요약(덱 등록 때 서버가 만든 것) 평균.</p></section>`;
  const tb=(rows,cols)=>`<div class="ldx-svg"><table class="lda-t"><tbody>${rows.map((x,i)=>`<tr><th>${i+1}. ${esc(x.nickname||'')}</th>${cols.map(f=>`<td class="num">${f(x)}</td>`).join('')}</tr>`).join('')||'<tr><td class="muted">없음</td></tr>'}</tbody></table></div>`;
  const top=`<section class="card"><h2 class="sec">상위 덱 · OVR</h2>${tb(d.top.ovr,[x=>esc(x.name),x=>esc(ldxT(x.tier)),x=>x.ovr])}<div class="btns"><button class="btn small" data-a="ldxCsv" data-v="top">CSV</button></div></section>
    <section class="card"><h2 class="sec">상위 덱 · 성적 <small>이번 시즌</small></h2>${tb(d.top.res,[x=>esc(x.name||''),x=>esc(ldxT(x.tier)),x=>`${x.points}점`,x=>`리그 ${x.leagues}`,x=>`OVR ${x.ovr||'-'}`])}</section>`;
  return [dist+flow+meta, top]; }
function ldxBal(d){ const B=d.balance;
  const k=`<div class="ldx-kpis">${ldxCard('승률 흩어짐',B.wp_sd!=null?B.wp_sd.toFixed(3):'-','',`덱별 이번 시즌 승률의 표준편차(평균 ${B.wp_mean!=null?B.wp_mean.toFixed(3):'-'}, ${B.n}덱). 클수록 강약 차가 큼.`,'')}
    ${ldxCard('OVR ↔ 승률 상관',B.corr!=null?B.corr.toFixed(2):'-','','1에 가까우면 전력대로, 0에 가까우면 운이 큼.','')}
    ${ldxCard('우승 쏠림',ldxPct(B.top10_share,0),'',`이 기간 우승 ${B.titles}번을 상위 10% 플레이어가 가져간 몫(우승자 ${B.champs}명).`,'')}
    ${ldxCard('이변 비율',ldxPct(B.upset,0),'',`맞대결 ${B.upset_n}쌍 가운데 OVR이 낮은 덱이 이긴 비율(지금 덱 OVR 기준 근사).`,'')}</div>`;
  const L=(typeof LDB!=='undefined'&&LDB.dash&&LDB.dash.leaders)||{}, lab={hr:'홈런',avg:'타율',ops:'OPS',rbi:'타점',sb:'도루',era:'평균자책점',so:'탈삼진',sv:'세이브',w:'승리'};
  const rec=`<section class="card"><h2 class="sec">서버 기록 1위 <small>이번 시즌</small></h2>${Object.keys(lab).some(x=>L[x])?`<table class="lda-t"><tbody>${Object.keys(lab).filter(x=>L[x]).map(x=>`<tr><th>${lab[x]}</th><td>${esc(L[x].name||'')} <small class="muted">${esc(L[x].nick||'')}</small></td><td class="num">${L[x].v}</td></tr>`).join('')}</tbody></table>`:'<p class="small muted">아직 기록이 없습니다.</p>'}<p class="small muted">자세한 순위는 게임의 래더 › 기록실(시즌 합계·한 리그 최고·통산).</p></section>`;
  return [`<section class="card ldx-wide"><h2 class="sec">경쟁 균형</h2>${k}</section><section class="card ldx-wide"><h2 class="sec">덱 OVR ↔ 승률</h2>${ldxScatter(d.scatter)}</section>`, rec]; }
const LDX_PCOLS=[['nickname','닉네임'],['name','덱'],['tier','단계'],['ovr','OVR'],['seen','마지막'],['leagues','리그'],['wp','승률'],['titles','우승'],['auto','등록'],['devs','기기']];
function ldxPl(){ const Q=LDX.plQ, J=LDX.pl; if(!LDX.plSt)setTimeout(ldxPlayers,0); const srt=new Set(['seen','leagues','titles','ovr','tier','wp','devs']);
  const head=`<div class="ldx-pf"><input id="ldxQ" placeholder="닉네임·덱 이름·id" value="${esc(Q.q)}" maxlength="20"><select id="ldxTier">${[['all','전체 단계'],...FrontOfficeCore.UL_TIERS.map((n,i)=>[String(i),n])].map(([v,l])=>`<option value="${v}"${Q.tier===v?' selected':''}>${l}</option>`).join('')}</select><button class="btn small" data-a="ldxFind">찾기</button><button class="btn small" data-a="ldxCsv" data-v="pl">CSV</button></div>`;
  const rows=J?J.players:[], cell=(x,k)=>k==='tier'?esc(ldxT(x.tier)):k==='seen'?ldaAgo(x.seen):k==='wp'?(x.wp==null?'-':x.wp.toFixed(3)):k==='auto'?(x.off?'끔':x.auto?'자동':'직접'):k==='devs'?`${x.devs}${x.same_dev>1?` <small class="ldx-warn" title="같은 기기 표식 덱 ${x.same_dev}개">같은 기기 ${x.same_dev}</small>`:''}`:k==='nickname'?`<b>${esc(x.nickname)}</b>${x.hidden?' <span class="pill">숨김</span>':''}`:esc(x[k]??'');
  const tbl=`<div class="ldx-svg"><table class="lda-t ldx-pt"><thead><tr>${LDX_PCOLS.map(([k,l])=>`<th>${srt.has(k)?`<button class="lnk${Q.sort===k?' on':''}" data-a="ldxSort" data-v="${k}">${l}${Q.sort===k?(Q.desc?' ▼':' ▲'):''}</button>`:l}</th>`).join('')}</tr></thead><tbody>${rows.map(x=>`<tr class="${LDX.one&&LDX.one.player&&LDX.one.player.id===x.pid?'on':''}" data-a="ldxOne" data-v="${esc(x.pid)}">${LDX_PCOLS.map(([k])=>`<td class="${['ovr','leagues','wp','titles','devs'].includes(k)?'num':''}">${cell(x,k)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${LDX_PCOLS.length}" class="muted">${LDX.plSt==='loading'?'받는 중입니다.':'없습니다.'}</td></tr>`}</tbody></table></div>`;
  const pg=J?`<p class="small">${ldaN(J.total)}명 가운데 ${J.total?(J.off+1)+'~'+(J.off+J.returned):0} <button class="btn small" data-a="ldxPg" data-v="-1"${J.off?'':' disabled'}>이전</button> <button class="btn small" data-a="ldxPg" data-v="1"${J.off+J.returned<J.total?'':' disabled'}>다음</button></p>`:'';
  return [`<section class="card ldx-wide"><h2 class="sec">플레이어</h2>${head}${tbl}${pg}<p class="small muted">줄을 누르면 오른쪽에 자세히. 이름·닉네임 말고 개인 정보는 없습니다. 기기 = 연결된 기기 수, 같은 기기 = 같은 기기 표식으로 올라온 덱 수.</p></section>`, ldxOneHtml()]; }
function ldxOneHtml(){ const O=LDX.one; if(LDX.oneSt==='loading')return '<section class="card"><p class="small muted">받는 중입니다.</p></section>'; if(!O)return '<section class="card"><h2 class="sec">플레이어 자세히</h2><p class="small muted">왼쪽 표에서 줄을 누르세요.</p></section>';
  const p=O.player, k=O.deck, C=FrontOfficeCore;
  return `<section class="card ldx-one"><h2 class="sec">${esc(p.nickname)} <small class="muted">${esc(p.id)}</small></h2><p class="small">가입 ${ldaDay(p.created)} · 마지막 ${ldaAgo(p.last_seen)} · ${esc(p.platform)} · 기기 ${O.devices}${O.linked?' · 연결함':''}${O.same_dev>1?` · <span class="ldx-warn">같은 기기 덱 ${O.same_dev}</span>`:''}${p.hidden?' · <span class="pill">숨김</span>':''}</p>
    ${k?`<p class="dk-t">덱</p><p class="small"><b>${esc(k.name)}</b> ${esc(k.year||'')} · ${esc(ldxT(k.tier))} · OVR <b class="num">${k.ovr_j?esc(C.cupOvrTxt(k.ovr_j)):k.ovr}</b>${k.meta?` · ${esc(C.UL_ARCH[k.meta.a]||'')} · 외국인 ${k.meta.fr} · 평균 ${k.meta.aa}세 · 선발 ${k.meta.sp} · 불펜 ${k.meta.rp}`:''} · ${ldaAgo(k.at)} 갱신 · ${O.reg?(O.reg.off?'자동 참가 끔':O.reg.auto?'자동 등록':'직접 등록'):'예전 등록'}</p>`:'<p class="small muted">서버 덱 없음</p>'}
    <p class="dk-t">최근 리그</p><div class="ldx-svg"><table class="lda-t"><thead><tr><th>시즌</th><th>단계</th><th>순위</th><th>승-패-무</th><th>PS</th><th>표시</th></tr></thead><tbody>${O.recent.map(r=>`<tr><th>S${r.season}</th><td>${esc(ldxT(r.tier))}${r.to_tier!==r.tier?` → ${esc(ldxT(r.to_tier))}`:''}</td><td class="num">${r.rank}/${r.teams}</td><td class="num">${r.w}-${r.l}-${r.d}</td><td>${r.ps?esc(C.UL_PS_NAME[r.ps]||r.ps):''}</td><td class="ldx-warn">${r.flag?esc(ldbFlagTxt(r.flag)):''}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">없음</td></tr>'}</tbody></table></div>
    <p class="dk-t">시즌</p><p class="small">${O.seasons.map(s=>`S${s.season} ${esc(ldxT(s.best_tier))} · ${s.points}점 · 리그 ${s.leagues}`).join(' / ')||'없음'}</p>
    <p class="dk-t">많이 만난 상대</p><p class="small">${O.h2h.map(h=>`${esc(h.nickname||'?')} ${h.w}-${h.l}-${h.d}`).join(' · ')||'없음'}</p>
    <div class="btns"><button class="btn small" data-a="ldaDkHide" data-v="${esc(p.id)}" data-u="${p.hidden?1:0}">${p.hidden?'보이기':'숨기기'}</button>${k?`<button class="btn small" data-a="ldaDkDel" data-v="${esc(p.id)}">덱 삭제</button>`:''}</div></section>`; }
function ldxHl(d){ const H=d.health, F=H.free, T=d.trend.slice(-14);
  const rej=`<section class="card ldx-wide"><h2 class="sec">거절된 덱 <small>사유별</small></h2>${d.rej.length?`<table class="lda-t"><thead><tr><th>사유</th><th>이 기간</th><th>직전 기간</th><th>7일</th></tr></thead><tbody>${d.rej.map(x=>`<tr><th>${esc(LDX_REJ[x.code]||x.code)}</th><td class="num">${ldaN(x.n)}</td><td class="num">${ldaN(x.prev)}</td><td class="num">${ldaN(x.d7)}</td></tr>`).join('')}</tbody></table><div class="btns"><button class="btn small" data-a="ldxCsv" data-v="rej">CSV</button></div>`:'<p class="small">아직 거절된 덱이 없습니다.</p>'}
    <p class="small muted">래더는 연봉 상한이 없습니다(구단주 11-18). 래더에서 거절하는 것은 편집된 저장과 능력치 범위(20~80) 밖뿐이고, 정상급 과다·연봉 합 불일치는 프런트컵 신청에만 남아 있습니다.</p></section>`;
  const use=`<section class="card ldx-wide"><h2 class="sec">서버 사용량 <small>오늘 추정</small></h2>${ldaMeter('D1 읽기',H.d1_r,F.d1_r)}${ldaMeter('D1 쓰기',H.d1_w,F.d1_w)}${ldaMeter('KV 쓰기',H.kv_w,F.kv_w)}${ldxLine(T,[['d1_w','D1 쓰기','s2'],['err5','서버 오류','s4']],{h:120,label:'D1 쓰기·오류 추이'})}<p class="small muted">이 서버 인스턴스가 센 추정치입니다. 정확한 값은 Cloudflare 대시보드 › D1.</p></section>`;
  const st=`<section class="card"><h2 class="sec">상태</h2><table class="lda-t"><tbody><tr><th>서버 오류(500) 오늘 · 7일</th><td class="num">${H.err5_today} · ${H.err5_7d}</td></tr><tr><th>진행 중 리그 · 하루 넘게 멈춤</th><td class="num">${H.live} · ${H.live_stale}</td></tr><tr><th>마지막 끝난 리그</th><td>${H.last_league?ldaAgo(H.last_league):'-'}</td></tr><tr><th>시즌</th><td>S${H.season.id} · ${H.season.days_left}일 남음</td></tr></tbody></table><p class="small muted">시즌 교체는 매일 Cron(설정했다면) 또는 첫 요청 때 확인합니다.</p></section>`;
  return [rej+use, st]; }
const LDX_GLOSS=[['등록 덱','서버에 올라 있는 래더 덱(플레이어 id마다 1개).'],['실제 플레이어','덱을 가진 익명 플레이어 id 수. 기기를 연결하지 않고 두 기기에서 하면 두 명으로 셉니다.'],['기기 묶음','같은 기기 표식(기기 번호의 해시)으로 올라온 덱을 한 명으로 본 추정.'],
  ['활성','기간 안에 접속했거나 덱이 갱신된 플레이어(1일=오늘 0시부터, 한국시간).'],['완료 리그','결과가 서버에 올라온 리그(한 플레이어의 리그 하나).'],['승격률','끝난 리그 가운데 단계가 오른 비율.'],['자동·직접·끔','자동 등록 덱 · 직접 등록 덱 · 자동 참가를 끈 플레이어.'],
  ['이변 비율','맞대결에서 OVR이 낮은 덱이 이긴 비율(지금 덱 OVR 기준이라 근사).'],['우승 쏠림','상위 10% 플레이어가 가져간 우승 몫.'],['직전 기간','고른 기간과 같은 길이의 바로 앞 기간.'],['표본','덱·리그가 적으면 비율이 크게 흔들립니다. 흐린 칸·점은 표본이 적은 것.']];
function ldxGloss(){ return `<details class="card ldx-gl"><summary>용어 설명</summary><dl>${LDX_GLOSS.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl></details>`; }
/* 래더 현황 화면(02_cup_admin.js의 cupAdminView가 부른다): 맨 위 줄(새로고침·범위·탭) + 칸 */
function ladderAdminView(){
  if(!LDA.st)setTimeout(ldaLoad,0); if(!LDX.st&&LDX.tab!=='ops')setTimeout(ldxLoad,0);
  const tab=LDX.tab, top=`<div class="ldx-top"><div class="row"><h2 class="sec">래더 현황</h2><span class="small muted" data-lda-at>${LDX.st==='loading'||LDA.ref?'받는 중 · ':''}${LDX.d?ldaAgo(LDX.d.at)+' 받음':LDA.at?ldaAgo(LDA.at)+' 받음':''}${LDA.st==='kv'?' · KV 기본 정보':''}</span>
      <span class="chips ldx-rg">${LDX_RANGES.map(([k,l])=>`<button data-a="ldxRange" data-v="${k}" class="${LDX.range===k?'on':''}" aria-pressed="${LDX.range===k}">${l}</button>`).join('')}</span><button class="btn small" data-a="ldxRefresh"${LDX.st==='loading'||LDA.st==='loading'?' disabled':''}>새로고침</button></div>
    <nav class="ldx-tabs" role="tablist">${LDX_TABS.map(([k,l])=>`<button role="tab" aria-selected="${tab===k}" class="${tab===k?'on':''}" data-a="ldxTab" data-v="${k}">${l}</button>`).join('')}</nav>${LDA.msg?`<div class="note${LDA.bad?' bad':''}">${esc(LDA.msg)}</div>`:''}${LDX.err?`<div class="note bad">${esc(LDX.err)}</div>`:''}</div>`;
  let cols; if(tab==='ops'||LDA.st==='kv'){ cols=LDA.st==='d1'&&LDA.d?ldaD1():LDA.st==='kv'?ldaKV():[LDA.st==='err'?'':'<section class="card"><p class="small muted">불러오는 중입니다.</p></section>','','']; cols[2]=(cols[2]||'')+ldxGloss(); return `${top}<div class="setc">${cols[0]}</div><div class="setc">${cols[1]}</div><div class="setc">${cols[2]}</div>`; }
  const d=LDX.d; if(!d)return `${top}<div class="setc ldx-c2"><section class="card"><p class="small muted">${LDX.st==='err'?'집계를 받지 못했습니다.':'불러오는 중입니다.'}</p></section></div><div class="setc">${ldxGloss()}</div>`;
  cols=tab==='eng'?ldxEng(d):tab==='tier'?ldxTier(d):tab==='bal'?ldxBal(d):tab==='pl'?ldxPl():tab==='hl'?ldxHl(d):ldxOv(d);
  return `${top}<div class="setc ldx-c2">${cols[0]}</div><div class="setc">${cols[1]}${ldxGloss()}</div>`; }
function ldxCsvOf(v){ const C=FrontOfficeCore, d=LDX.d, day=ms=>ms?new Date(ms+9*3600e3).toISOString().slice(0,16).replace('T',' '):'';
  if(v==='pl'&&LDX.pl)return ['ladder-players',C.ulCsv(LDX.pl.players,[['nickname','닉네임'],['pid','플레이어'],['name','덱'],[x=>ldxT(x.tier),'단계'],['ovr','OVR'],[x=>day(x.seen),'마지막(KST)'],['leagues','리그'],['w','승'],['l','패'],['d','무'],['wp','승률'],['titles','우승'],[x=>x.off?'끔':x.auto?'자동':'직접','등록'],['devs','기기'],['same_dev','같은 기기 덱']])];
  if(v==='rej'&&d)return ['ladder-rejections',C.ulCsv(d.rej,[[x=>LDX_REJ[x.code]||x.code,'사유'],['code','코드'],['n','이 기간'],['prev','직전 기간'],['d7','7일']])];
  if(v==='top'&&d)return ['ladder-top-decks',C.ulCsv(d.top.ovr,[['nickname','닉네임'],['name','덱'],[x=>ldxT(x.tier),'단계'],['ovr','OVR']])];
  return null; }
Object.assign(A,{
  ldxTab(v){ LDX.tab=LDX_TABS.some(x=>x[0]===v)?v:'ov'; if(LDX.tab==='ops'&&LDA.st!=='loading')ldaLoad(true,true); render(); },
  ldxRange(v){ LDX.range=LDX_RANGES.some(x=>x[0]===v)?v:'7d'; ldxLoad(); },
  ldxRefresh(){ ldxLoad(); ldaLoad(true,true); if(LDX.tab==='pl')ldxPlayers(); },
  ldxFind(){ LDX.plQ.q=String((document.getElementById('ldxQ')||{}).value||'').trim().slice(0,20); LDX.plQ.tier=String((document.getElementById('ldxTier')||{}).value||'all'); LDX.plQ.off=0; ldxPlayers(); },
  ldxSort(v){ const Q=LDX.plQ; if(Q.sort===v)Q.desc=Q.desc?0:1; else { Q.sort=v; Q.desc=1; } Q.off=0; ldxPlayers(); },
  ldxPg(v){ const Q=LDX.plQ; Q.off=Math.max(0,(Q.off|0)+(+v)*50); ldxPlayers(); },
  ldxOne(v){ LDX.oneSt='loading'; render(); ldaApi('/api/v1/admin/lplayer?pid='+encodeURIComponent(v)).then(({r,j})=>{ LDX.one=r.ok?j:null; LDX.oneSt=''; render(); },()=>{ LDX.oneSt=''; render(); }); },
  ldxCsv(v){ const f=ldxCsvOf(v); if(!f)return; LDA.msg=ulDownload(f[0],f[1])?`${f[0]}.csv 파일을 받았습니다.`:'이 브라우저에서는 파일을 받을 수 없습니다.'; LDA.bad=false; render(); },
});
