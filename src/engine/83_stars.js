/* ===== 스타 만들기: 능력치 변화 표시 · 개인 타이틀 · 타이틀 경쟁 기사 =====
   애지중지 키운 유망주가 구단 레전드가 되는 과정을 눈에 보이게 한다.
   - 능력치 변화(FM의 화살표): 우리 선수는 매달 1일 능력치를 남겨 두고, 약 6개월 전과 비교해 오른 항목·떨어진 항목을 보여 준다
   - 개인 타이틀: 정규시즌이 끝나면 홈런왕·타격왕 등 8개 부문 1위를 정해 수상 경력에 남긴다(스타성에도 반영)
   - 타이틀 경쟁: 6~9월 매달 1일, 부문별 선두 다툼 기사. 우리 선수가 선두권이면 홍보팀이 따로 알린다 */
const RS_KEEP=8; /* 매달 하나씩, 8개월 치 */
function rSnapAll(){ if(G.user==null)return; for(const p of playersOf(G.user)){ if(!p.r)continue; const s=p.rS=p.rS||[]; if(s.length&&s[s.length-1].d===G.day)continue; s.push({d:G.day,r:{...p.r}}); while(s.length>RS_KEEP)s.shift(); } }
/* 비교 기준: 150일 이상 지난 기록 중 가장 최근 것(없으면 가장 오래된 것) */
function rRef(p){ const s=p&&p.rS; if(!s||!s.length)return null; const old=s.filter(x=>G.day-x.d>=150); return old.length?old[old.length-1]:s[0]; }
function rDelta(p){ const ref=rRef(p); if(!ref||ref.d===G.day)return null; const d={}; for(const k in p.r){ if(ref.r[k]==null)continue; d[k]=p.r[k]-ref.r[k]; } return {d,from:ref.d}; }

/* 개인 타이틀 8개: [이름, 기록, 투수 여부, 낮을수록 좋은가] */
const TITLES=[['홈런왕','hr',0],['타점왕','rbi',0],['도루왕','sb',0],['타격왕','avg',0],['다승왕','w',1],['탈삼진왕','so',1],['세이브왕','sv',1],['평균자책점왕','era',1,1]];
function tgp(tid){ const r=G.sea&&G.sea.rec&&G.sea.rec[tid]; return r?r.w+r.l+(r.t||0):0; } /* 소속 팀 경기 수: 규정 타석(×3.1)·규정 이닝(×1) */
function ttVal(h,k){ if(k==='avg')return h.ab?h.h/h.ab:0; if(k==='era')return h.outs?h.er*27/h.outs:99; return h[k]||0; }
function tfmt(k,v){ return k==='avg'?fmt3(v):k==='era'?v.toFixed(2):String(v); }
function titleBoard(y,k,isP,low){ const L=[]; for(const p of Object.values(G.players)){ if(!!p.isP!==!!isP)continue; const h=seasonTotal(p,y,'1군'); if(!h)continue; const g=tgp(h.t??p.team);
    if(k==='avg'&&(h.pa||0)<g*3.1)continue; if(k==='era'&&(h.outs||0)<g*3)continue; const v=ttVal(h,k); if(!low&&!(v>0))continue; L.push({p,v,t:h.t??p.team}); }
  return L.sort((a,b)=>low?a.v-b.v:b.v-a.v); }
function seasonTitles(y){ const out=[];
  for(const [lab,k,isP,low] of TITLES){ const B=titleBoard(y,k,isP,low); if(!B.length)continue; const top=B[0].v; const W=B.filter(x=>Math.abs(x.v-top)<1e-9); /* 같으면 공동 수상 */
    out.push({k:lab,stat:k,v:top,ids:W.map(x=>x.p.id),names:W.map(x=>x.p.name),tids:W.map(x=>x.t)});
    for(const x of W){ addAward(x.p,`${y} ${lab}`); if(x.p.team===G.user&&!G.unemp)x.p.mor=clamp((x.p.mor??60)+3,0,100); } }
  (G.titles=G.titles||{})[y]=out;
  const mine=out.filter(t=>t.tids.includes(G.user)&&!G.unemp);
  news('기록',`${y} 개인 타이틀${mine.length?`: ${tshort(G.user)} ${mine.length}개 부문`:''}`,out.map(t=>`${t.k} ${t.names.join('·')}(${t.tids.map(tshort).join('·')}) ${tfmt(t.stat,t.v)}`).join(' / '),mine.length?Math.min(3,mine.length):0,mine.length?{ref:mine[0].ids[0],fanW:Math.min(2,mine.length)}:undefined);
  return out; }
/* 타이틀 경쟁 기사(6~9월 1일): 가장 접전인 부문을 제목으로, 주요 4부문 선두 3명. 우리 선수가 1~2위면 홍보팀 알림 */
function titleRaceNews(){ const y=G.year; const R=[]; const hot=[];
  for(const [lab,k,isP,low] of TITLES.filter(t=>['hr','avg','w','so'].includes(t[1]))){ const B=titleBoard(y,k,isP,low).slice(0,3); if(B.length<2)continue; const gap=low?B[1].v-B[0].v:B[0].v-B[1].v; const rel=gap/Math.max(1e-6,Math.abs(B[0].v)); R.push({lab,k,B,rel});
    B.slice(0,2).forEach((x,i)=>{ if(x.t===G.user&&!G.unemp)hot.push(`${lab} ${i+1}위 ${x.p.name}(${tfmt(k,x.v)})${i===1?`, 1위 ${B[0].p.name}과 ${tfmt(k,Math.abs(B[0].v-x.v))} 차`:''}`); }); }
  if(!R.length)return; const head=[...R].sort((a,b)=>a.rel-b.rel)[0];
  news('기록',`${head.lab} 경쟁: ${head.B[0].p.name} ${tfmt(head.k,head.B[0].v)} vs ${head.B[1].p.name} ${tfmt(head.k,head.B[1].v)}`,R.map(r=>`${r.lab}: ${r.B.map(x=>`${x.p.name}(${tshort(x.t)}) ${tfmt(r.k,x.v)}`).join(', ')}`).join(' / '),hot.length?1:0);
  if(hot.length)mail('홍보팀',`우리 선수 타이틀 경쟁: ${hot[0].split(' ')[0]}`,`${hot.join('\n')}\n\n타이틀 경쟁은 선수의 스타성(관중·상품 수입)과 기분을 끌어올립니다. 언론 플레이로 더 띄울 수도 있습니다(구단 → 언론·여론 → 기자).`,{kind:'기록',acts:[{l:'기록 순위',a:'go',v:'league:rec'}]}); }

/* ===== 스타 마케팅 캠페인: 스타가 된 선수를 구단이 돈을 들여 밀어 준다 =====
   유니폼·광고 수입(스타 마케팅 수입)은 스타 파워에 비례한다. 진짜 스타에게 쓰면 비용보다 많이 벌고, 이름값이 약한 선수에게 쓰면 손해다.
   결산 연도 남은 기간만큼만 수입이 붙는다(f). 캠페인 동안 매달 기사가 나고, 팬 관심과 선수 기분이 오른다 */
const SMK=[{k:'s',l:'기본',c:100,m:.5,fan:1},{k:'m',l:'집중',c:300,m:1,fan:3},{k:'l',l:'대대적',c:600,m:1.6,fan:5}];
const fyNow=()=>(G.last&&G.last.y>=G.year)?G.year+1:G.year; /* 지금 장부가 잡히는 결산 연도(finYearEnd와 같은 기준) */
function smActive(p){ return !!(p&&p.smk&&p.smk.fy===fyNow()&&p.team===G.user&&!G.unemp); } /* 결산일이 예상보다 늦어져도 그 결산까지는 유효 */
function smEst(p,k){ const T=SMK.find(x=>x.k===k); return T&&p?Math.round(starPower(p)*14*team(G.user).market*T.m):0; } /* 1년 내내 했을 때 추가 수입 */
function smBonus(tid){ if(tid!==G.user||G.unemp)return 0; return sum(playersOf(G.user).filter(smActive).map(p=>Math.round(smEst(p,p.smk.k)*(p.smk.f??1)))); }
function smStart(pid,k){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; const p=G.players[pid]; const T=SMK.find(x=>x.k===k); if(!p||p.team!==G.user||!T)return '우리 선수를 고르세요.';
  if(smActive(p))return `${p.name}은(는) 이미 스타 마케팅 중입니다(${dmd(p.smk.until)}까지).`;
  const until=finYearEnd(); const f=clamp((until-G.day)/365,0,1); const est=Math.round(smEst(p,k)*f); prInit(); G.spend.etc=(G.spend.etc||0)+T.c; p.smk={k,d:G.day,until,f,fy:fyNow()}; G.pr.fan=clamp(G.pr.fan+T.fan,0,100); p.mor=clamp((p.mor??60)+2,0,100);
  news('구단',k==='l'?`${tshort(G.user)}, '${p.name}' 대대적 마케팅…도시 곳곳에 대형 광고`:k==='m'?`${tshort(G.user)}, ${p.name} 앞세운 마케팅 본격화`:`${tshort(G.user)}, ${p.name} 유니폼·굿즈 출시`,`구단이 ${p.name}(${posLabel(p)}, ${p.age}세)을(를) 얼굴로 내세운 마케팅을 시작했습니다.`,1,{ref:p.id,fanW:1});
  return `${p.name} 스타 마케팅(${T.l})을 시작했습니다. 비용 ${money(T.c)}, 이번 결산까지 추가 수입 예상 ${money(est)}${est<T.c?` (비용보다 적습니다. 스타 파워 ${starPower(p)}로는 아직 이름값이 약합니다)`:''}. 팬 관심 +${T.fan}.`; }
/* 캠페인 기간 매달(15일) 기사 */
const SM_NEWS=[p=>[`${p.name} 유니폼, 리그 판매 상위권`,`${p.name}의 이름을 단 유니폼이 구단 매장에서 가장 많이 팔렸습니다.`],p=>[`${p.name}, 스포츠음료 광고 모델 발탁`,`${p.name}이(가) 한 스포츠음료 브랜드의 새 광고 모델이 됐습니다.`],p=>[`'${p.name} 데이' 팬 사인회 매진`,`홈경기 전 열린 ${p.name} 팬 사인회 표가 하루 만에 다 팔렸습니다.`],p=>[`${p.name} 다큐멘터리 공개`,`${p.name}의 한 시즌을 따라간 구단 제작 다큐멘터리가 공개됐습니다.`]];
function smNews(){ if(G.unemp)return; prInit(); for(const p of playersOf(G.user).filter(smActive)){ const n=p.smk.n=(p.smk.n||0); const [t,b]=SM_NEWS[n%SM_NEWS.length](p); p.smk.n++; news('구단',t,b,1,{ref:p.id,fanW:1}); G.pr.fan=clamp(G.pr.fan+1,0,100); } }
/* 스타 탄생: 스타 파워 25 이상이 된 우리 선수를 그해 한 번 알린다 */
function starCheck(){ if(G.unemp||G.user==null)return; for(const p of playersOf(G.user)){ if(p.starY===G.year)continue; const s=starPower(p); if(s<25)continue; p.starY=G.year;
  news('선수',`'대세' ${p.name}…${tshort(G.user)}의 새 얼굴`,`활약과 화제성이 쌓인 ${p.name}(${posLabel(p)}, ${p.age}세)을(를) 찾는 팬과 광고주가 늘고 있습니다.`,1,{ref:p.id,fanW:1});
  if(!smActive(p))mail('마케팅팀',`${p.name}, 스타로 떠올랐습니다`,`${p.name}의 스타 파워가 ${s}입니다. 지금 스타 마케팅을 하면 이번 결산까지 추가 수입이 이 정도로 예상됩니다.\n${SMK.map(T=>`${T.l}(비용 ${money(T.c)}): 약 ${money(Math.round(smEst(p,T.k)*clamp((finYearEnd()-G.day)/365,0,1)))}`).join('\n')}\n\n구단 → 구단주 화면의 '스타 파워와 마케팅'에서 정할 수 있습니다.`,{kind:'구단',ref:p.id,acts:[{l:'스타 마케팅 보기',a:'go',v:'club:owner'}]}); } }
