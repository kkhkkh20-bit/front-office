/* 팀 성적 보고서: 월간 소식(비서 '월간', 전력분석팀 월간 전력 분석 보고)에 붙는 문서.
   정규시즌 경기 기록(G.sea.tl: [승패 부호, 득점, 실점, 홈, 상대, 날짜, …])을 소식 날짜까지 잘라 계산한다.
   차트는 두 지표를 함께 봐야 뜻이 생기는 것만: 득점·실점 이동평균, 구단별 득점×실점, (분석원이 있으면) 팀 OPS×평균자책점, 월별 성적 */
function trpData(r){ const T=r.T.map(([tid,w,l,g,rs,ra])=>({tid,L:tid===r.tid?r.L:[],g,w,l,t:g-w-l,rs,ra,rd:rs-ra,wp:w+l?w/(w+l):0,rpg:g?rs/g:0,rapg:g?ra/g:0}));
  return {T,me:T.find(x=>x.tid===r.tid)}; }
/* 그날까지의 승률 순위(승률, 같으면 승수) */
function trpRankAt(T,tid){ return [...T].sort((a,b)=>b.wp-a.wp||b.w-a.w).findIndex(s=>s.tid===tid)+1; }
/* 보낼 때 고정한 수치(m.rep, trpSnap)로 그린다. 고정본이 없는 옛 소식만 같은 시즌일 때 소식의 발송 구단(ctx.tid)으로 다시 계산한다 */
function teamReport(m){ const d=m.day, r=m.rep||(dobj(d).y===(G.sea&&G.sea.y)?trpSnap(d,(m.ctx||{}).tid??G.user):null); if(!r)return ''; const {T,me}=trpData(r), tid=r.tid; if(!me)return '';
  const full=r.by!=null, n=me.g, mo=dobj(d).m;
  const sg=v=>(v>0?'+':'')+v, f2=v=>v.toFixed(2), d2=v=>(v>=.005?'+':'')+v.toFixed(2), rk=(k,low)=>[...T].sort((a,b)=>low?a[k]-b[k]:b[k]-a[k]).findIndex(x=>x.tid===tid)+1;
  const by=full?`전력분석팀 · 분석원 ${esc(r.by)}`:'기록 담당 · 기본 수치 정리';
  const head=`<header class="trp-h"><div><span class="trp-k">${full?'전력분석팀 보고':'기록 정리'}</span><h3>${mo}월 팀 성적 보고서</h3></div><dl><div><dt>작성</dt><dd>${by}</dd></div><div><dt>기준일</dt><dd>${dmd(d)} · 정규시즌 ${n}경기</dd></div><div><dt>받는 사람</dt><dd>단장</dd></div></dl></header>`;
  if(n<3)return `<section class="ibd-sec trp">${head}<p class="trp-none">정규시즌 경기가 3경기 이상 쌓이면 보고서를 작성합니다.</p></section>`;
  const L=me.L, L10=L.slice(-10), w10=L10.filter(x=>x[0]>0).length, l10=L10.filter(x=>x[0]<0).length, r10=avg(L10.map(x=>x[1])), a10=avg(L10.map(x=>x[2]));
  const rkNow=trpRankAt(T,tid), pick=a=>{ const st=Math.max(1,Math.ceil((n-a+1)/9)), o=[]; for(let i=n;i>=a;i-=st)o.unshift(i); return o; };
  const lab=(I,j)=>(I.length-1-j)%4===0?I[j]+'경기':''; /* 마지막부터 네 칸마다 경기 수 */
  /* 1. 득점·실점 10경기 이동평균 */
  const mv=(i,k)=>avg(L.slice(Math.max(0,i-10),i).map(x=>x[k])), im=pick(n>=15?10:1); /* 열 경기가 차기 전 평균은 크게 흔들려 10경기째부터 */
  const leg=(a,b)=>`<p class="sf-leg"><span><u style="background:#4fa3ff"></u>${a}</span>${b?`<span><u style="background:var(--bad)"></u>${b}</span>`:''}</p>`;
  const C=[];
  const box=(t,chart,say)=>`<div class="trp-c"><h4>${t}</h4>${chart}<p class="trp-say">${say}</p></div>`;
  C.push(box('득점·실점 추이 <em>직전 10경기 평균</em>',fmArea(im.map((i,j)=>({l:lab(im,j),v:mv(i,1)})),'#4fa3ff',f2,im.map(i=>({l:'',v:mv(i,2)})),'var(--bad)',{nodot:1})+leg('경기당 득점','경기당 실점'),
    `최근 10경기 경기당 득점 ${f2(r10)}, 실점 ${f2(a10)}. 시즌 평균(득점 ${f2(me.rpg)} · 실점 ${f2(me.rapg)})보다 득점 ${d2(r10-me.rpg)}, 실점 ${d2(a10-me.rapg)}.`));
  /* 2. 구단별 득점×실점: 우리 위치를 리그 평균 십자선과 함께 */
  const ax=avg(T.map(x=>x.rpg)), ay=avg(T.map(x=>x.rapg)), side=(v,a,hi,lo)=>v>=a?hi:lo;
  C.push(box('구단별 득점 × 실점 <em>오른쪽 위일수록 좋음</em>',`<div class="ds-w">${tdScatter(T.map(x=>({tid:x.tid,x:x.rpg,y:x.rapg})),{xl:'경기당 득점',yl:'경기당 실점',avg:1,W:420,H:320,mr:64,nick:1,me:tid})}</div>`,
    `우리 경기당 득점 ${f2(me.rpg)}(리그 ${rk('rpg')}위) · 실점 ${f2(me.rapg)}(${rk('rapg',true)}위). 리그 평균(득점 ${f2(ax)} · 실점 ${f2(ay)})보다 ${side(me.rpg,ax,'많이 내고','적게 내고')} ${side(me.rapg,ay,'많이 줍니다','적게 줍니다')}.`));
  /* 3. 팀 OPS×평균자책점(분석원 있을 때): 타격과 투수진이 리그 어디쯤인지 */
  const S=full?(r.S||[]).map(([tid,ops,era,sb,cs,e])=>({tid,ops,era,sbp:sb+cs?sb/(sb+cs):0,e,att:sb+cs})):null;
  if(full){ const mS=S.find(x=>x.tid===tid), so=avg(S.map(x=>x.ops)), se=avg(S.map(x=>x.era)), rS=(k,low)=>[...S].sort((a,b)=>low?a[k]-b[k]:b[k]-a[k]).findIndex(x=>x.tid===tid)+1;
    C.push(box(`팀 OPS × 평균자책점 <em>${dmd(d)}까지 시즌 기록</em>`,`<div class="ds-w">${tdScatter(S.map(x=>({tid:x.tid,x:x.ops,y:x.era})),{xl:'팀 OPS',yl:'팀 평균자책점',fx:fmt3,avg:1,W:420,H:320,mr:64,nick:1,me:tid})}</div>`,
      `우리 팀 OPS ${fmt3(mS.ops)}(리그 ${rS('ops')}위) · 평균자책점 ${f2(mS.era)}(${rS('era',true)}위). 리그 평균(OPS ${fmt3(so)} · 평균자책점 ${f2(se)})보다 타격은 ${side(mS.ops,so,'높고','낮고')}, 평균자책점은 ${side(mS.era,se,'높습니다','낮습니다')}.`)); }
  /* 월별 성적(경기 날짜로 나눔) */
  const M=[]; for(const x of L){ const k=dobj(x[3]??d).m; let o=M.find(z=>z.m===k); if(!o)M.push(o={m:k,w:0,l:0,t:0,rs:0,ra:0,g:0}); o.g++; o.rs+=x[1]; o.ra+=x[2]; if(x[0]>0)o.w++; else if(x[0]<0)o.l++; else o.t++; }
  M.forEach(o=>o.p=o.w+o.l?o.w/(o.w+o.l):0); const Ms=[...M].filter(o=>o.g>=5).sort((a,b)=>b.p-a.p);
  C.push(box('월별 성적',`<table class="ibd-t trp-mt"><thead><tr><th>월</th><th>승-패-무</th><th>승률</th><th></th><th>득점/경기</th><th>실점/경기</th></tr></thead><tbody>${M.map(o=>`<tr><td>${o.m}월</td><td>${o.w}-${o.l}-${o.t}</td><td>${fmt3(o.p)}</td><td class="trp-bar">${fmBar(o.p*1000,1000,o.p<.5)}</td><td>${f2(o.rs/o.g)}</td><td>${f2(o.ra/o.g)}</td></tr>`).join('')}</tbody></table>`,
    Ms.length>=2?`가장 좋은 달 ${Ms[0].m}월(승률 ${fmt3(Ms[0].p)}), 가장 나쁜 달 ${Ms[Ms.length-1].m}월(${fmt3(Ms[Ms.length-1].p)}). 5경기 미만인 달은 비교에서 뺐습니다.`:'비교할 만큼 경기를 치른 달이 아직 하나뿐입니다.'));
  /* 리그 순위 항목(요약·확인할 점에만 씀): 득실은 기준일까지, 타격·투구는 시즌 기록 */
  const R=(l,k,f,low,S=T)=>({l,v:S.find(x=>x.tid===tid)[k],all:S.map(x=>x[k]),f,low});
  const rows=[R('승률','wp',fmt3),R('경기당 득점','rpg',f2),R('경기당 실점','rapg',f2,true),R('득실차','rd',sg)];
  if(full){ rows.push(R('팀 OPS','ops',fmt3,false,S),R('팀 평균자책점','era',f2,true,S)); if(sum(S.map(x=>x.att)))rows.push(R('도루 성공률','sbp',v=>Math.round(v*100)+'%',false,S)); if(sum(S.map(x=>x.e)))rows.push(R('수비 실책','e',null,true,S)); }
  const K=rows.map(r=>({l:r.l,k:sfRk(r,r.low),r})).sort((a,b)=>a.k-b.k);
  /* 핵심 요약: 기록에서 바로 나온 문장만 */
  const sum3=[`정규시즌 ${n}경기 ${me.w}승 ${me.l}패${me.t?` ${me.t}무`:''}, ${rkNow}위(승률 ${fmt3(me.wp)}). 득실차 ${sg(me.rd)}(리그 ${rk('rd')}위).`,
    `최근 10경기 ${w10}승 ${l10}패, 경기당 득점 ${f2(r10)} · 실점 ${f2(a10)}.`];
  if(full)sum3.push(`리그 비교에서 가장 좋은 항목은 ${K[0].l}(${K[0].k}위), 가장 약한 항목은 ${K[K.length-1].l}(${K[K.length-1].k}위)입니다.`);
  /* 확인할 점: 근거 수치가 기준을 넘을 때만 */
  const chk=[];
  if(L10.length>=10&&a10-me.rapg>=.5)chk.push(`최근 10경기 실점 ${f2(a10)}로 시즌 평균 ${f2(me.rapg)}보다 ${f2(a10-me.rapg)} 많습니다.`);
  if(L10.length>=10&&me.rpg-r10>=.5)chk.push(`최근 10경기 득점 ${f2(r10)}로 시즌 평균 ${f2(me.rpg)}보다 ${f2(me.rpg-r10)} 적습니다.`);
  if(full&&n>=20){ const py=me.rs+me.ra?Math.pow(me.rs,1.83)/(Math.pow(me.rs,1.83)+Math.pow(me.ra,1.83)):.5, xw=py*(me.w+me.l), dw=me.w-xw;
    if(Math.abs(dw)>=1.5)chk.push(`득점·실점으로 본 기대 승수 ${xw.toFixed(1)}승, 실제 ${me.w}승으로 ${Math.abs(dw).toFixed(1)}승 ${dw>0?'많습니다':'적습니다'}.`); }
  const lo=K.filter(x=>x.k>=G.teams.length-2).reverse().slice(0,3); if(lo.length)chk.push(`리그 하위권 항목: ${lo.map(x=>`${x.l} ${x.r.f?x.r.f(x.r.v):x.r.v}(${x.k}위)`).join(', ')}.`);
  const ft=`<p class="trp-src">${full?'정규시즌 경기 기록과 선수 시즌 기록으로 계산했습니다. 순위는 기준일까지의 승률 순입니다.':'분석원이 없어 기록 담당이 경기 결과로 낸 기본 수치만 담았습니다. 분석원을 두면 팀 OPS·평균자책점 비교와 리그 순위 항목이 함께 옵니다.'}</p>`;
  return `<section class="ibd-sec trp">${head}<div class="trp-sum"><h4>핵심 요약</h4><ul>${sum3.map(s=>`<li>${s}</li>`).join('')}</ul></div><div class="trp-g trp-n${C.length}">${C.join('')}<div class="trp-c trp-chk"><h4>확인할 점</h4>${chk.length?`<ul>${chk.map(s=>`<li>${s}</li>`).join('')}</ul>`:'<p>기준(최근 10경기 득점·실점이 시즌 평균과 0.5점 이상 차이, 리그 비교 하위 3위 이내)에 걸리는 수치는 없습니다.</p>'}</div></div>${ft}</section>`; }
