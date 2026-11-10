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
const TITLES=[['홈런왕','hr',0],['타점왕','rbi',0],['도루왕','sb',0],['타격왕','avg',0],['득점왕','r',0],['최다안타','h',0],['출루율왕','obp',0],['장타율왕','slg',0],['다승왕','w',1],['탈삼진왕','so',1],['세이브왕','sv',1],['평균자책점왕','era',1,1],['승률왕','wpct',1],['홀드왕','hld',1]]; /* KBO 개인 타이틀 14개 부문 */
function tgp(tid,y){ if(y!=null&&y!==G.year){ const a=G.tsArch&&G.tsArch[y]&&G.tsArch[y][tid]; return a&&a.g||0; } /* 지난 시즌은 그해 보관한 팀 경기 수(검수 11-09zz) */ const r=G.sea&&G.sea.rec&&G.sea.rec[tid]; return r?r.w+r.l+(r.t||0):0; } /* 소속 팀 경기 수: 규정 타석(×3.1)·규정 이닝(×1) */
/* KBO 규정타석(팀 경기 수×3.1, 반올림)·규정이닝(팀 경기 수×1): 그해 가장 많이 뛴 구단 경기 수 기준(시즌이 짧아지거나 늘어도 맞게) */
function qualPA(p,h,y){ return (h.pa||0)>=Math.round((tgp(awTeamOf(p,h,y),y)||144)*3.1); }
function qualIP(p,h,y){ return (h.outs||0)>=(tgp(awTeamOf(p,h,y),y)||144)*3; }
function ttVal(h,k){ if(k==='avg')return h.ab?h.h/h.ab:0; if(k==='era')return h.outs?h.er*27/h.outs:99; if(k==='obp'){ const d=(h.ab||0)+(h.bb||0)+(h.hbp||0)+(h.sf||0); return d?((h.h||0)+(h.bb||0)+(h.hbp||0))/d:0; } if(k==='slg')return h.ab?((h.h||0)+(h.d||0)+2*(h.tr||0)+3*(h.hr||0))/h.ab:0; if(k==='wpct'){ const n=(h.w||0)+(h.l||0); return n?(h.w||0)/n:0; } return h[k]||0; }
function tfmt(k,v){ return k==='avg'||k==='obp'||k==='slg'||k==='wpct'?fmt3(v):k==='era'?v.toFixed(2):String(v); }
/* 리그를 떠난 선수(방출·은퇴·해외)의 보관 기록도 그해 타이틀 경쟁에 넣는다(이미 낸 성적의 자격은 남는다). 현역 목록에 있는 선수는 보관 기록을 다시 세지 않는다 */
/* 보관 기록을 선수처럼 읽는 얼굴: 모든 보관 시즌을 1군 이력으로 두어 시즌 합계·신인 자격·수비 포지션을 현역과 같은 함수로 판정한다 */
function archP(a){ const pos0=a.isP?'P':a.pos; return {id:a.id,name:a.name,isP:!!a.isP,team:null,pos:pos0,role:a.pos==='선발'?'SP':'RP',foreign:a.foreign||null,age:a.age,...(a.dy!=null?{draft:{y:a.dy,...(a.dt!=null?{tid:a.dt}:{})}}:{}),svc:a.svc||0,...(a.ovsExp?{ovsExp:a.ovsExp}:{}),arch:a,...(()=>{ const u=(a.rows||[]).filter(r=>r.up).pop(); return u?{use:{y:u.y,pos:Object.assign({},u.up)}}:{}; })(),hist:(a.fy!=null&&!(a.rows||[]).some(r=>r.y<=a.fy)?[{y:a.fy,lvl:'2군',pa:0}]:[]).concat((a.rows||[]).map(r=>Object.assign({lvl:'1군',pos:pos0},archFull(r)))) /* 저장 때 뺀 0인 칸을 되살린다(검수 11-09zf) */,r:new Proxy({},{get:()=>50})}; }
function archSeason(a,y){ const R=(a.rows||[]).filter(r=>r.y===y); if(!R.length)return null; const h={y,lvl:'1군'}; for(const k of ARCH_K)h[k]=sum(R.map(r=>r[k]||0)); h.war=sum(R.map(r=>r.war||0)); /* 보관 WAR(능력값 없이 다시 계산하면 NaN, 검수 11-09zf) */ h.t=R[R.length-1].t; return h; }
function titleBoard(y,k,isP,low){ const L=[]; const src=Object.values(G.players).map(p=>[p,null]); for(const id in (G.arch||{})){ if(G.players[id])continue; const a=G.arch[id]; if(!a||!!a.isP!==!!isP)continue; const h=archSeason(a,y); if(h)src.push([{id:a.id,name:a.name,isP:a.isP,team:null,arch:a},h]); }
  for(const [p,h0] of src){ if(!!p.isP!==!!isP)continue; const h=h0||seasonTotal(p,y,'1군'); if(!h)continue; const t=awTeamOf(p,h,y), g=tgp(t,y); /* 소속·규정 기준 팀: MVP·골든글러브와 같은 '가장 많이 뛴 구단'(검수 11-09zq) */
    if(['avg','obp','slg'].includes(k)&&(h.pa||0)<Math.round(g*3.1))continue; if(k==='era'&&(h.outs||0)<g*3)continue; if(k==='wpct'&&(h.w||0)<10)continue; /* 규정타석 144경기 446(반올림), 승률왕은 10승 이상 */ const v=ttVal(h,k); if(!low&&!(v>0))continue; L.push({p,v,t:awClub(p,h,y)}); } /* 규정 기준 팀 경기 수는 뛴 구단, 표기 소속은 수상 당시 구단 */
  return L.sort((a,b)=>low?a.v-b.v:b.v-a.v); }
function seasonTitles(y){ const out=[];
  for(const [lab,k,isP,low] of TITLES){ const B=titleBoard(y,k,isP,low); if(!B.length)continue; const top=B[0].v; const W=B.filter(x=>Math.abs(x.v-top)<1e-9); /* 같으면 공동 수상 */
    out.push({k:lab,stat:k,v:top,ids:W.map(x=>x.p.id),names:W.map(x=>x.p.name),tids:W.map(x=>x.t)});
    for(const x of W){ const lb=`${y} ${lab}`; if(x.p.arch){ if(!awAbroad(x.p.id,lb,x.t)){ const a=x.p.arch; (a.aw=a.aw||[]).includes(lb)||a.aw.push(lb); const r=(G.legends||[]).find(r=>r.id===x.p.id); if(r&&!(r.aw||[]).includes(lb))(r.aw=r.aw||[]).push(lb); if(x.t===G.user&&!G.unemp)chron('award',`${x.p.name} ${lb}`,x.p.id); } continue; } /* 떠난 선수: 해외면 복귀 때 되살아나는 정보에, 은퇴면 보관 기록·레전드 이력에(검수 11-09zf) */ addAward(x.p,lb,x.t); if(x.p.team===G.user&&!G.unemp)x.p.mor=clamp((x.p.mor??60)+3,0,100); } }
  (G.titles=G.titles||{})[y]=out;
  const mine=out.filter(t=>t.tids.includes(G.user)&&!G.unemp);
  news('기록',`${y} 개인 타이틀${mine.length?`: ${tshort(G.user)} ${mine.length}개 부문`:''}`,out.map(t=>`${t.k} ${t.names.join('·')}(${t.tids.map(tshort).join('·')}) ${tfmt(t.stat,t.v)}`).join(' / '),mine.length?Math.min(3,mine.length):0,mine.length?{ref:mine[0].ids[0],fanW:Math.min(2,mine.length)}:undefined);
  return out; }
/* 타이틀 경쟁 기사(6~9월 1일): 가장 접전인 부문을 제목으로, 주요 4부문 선두 3명. 우리 선수가 1~2위면 홍보팀 알림 */
function titleRaceNews(){ const y=G.year; const R=[]; const hot=[];
  for(const [lab,k,isP,low] of TITLES.filter(t=>['hr','avg','w','so'].includes(t[1]))){ const B=titleBoard(y,k,isP,low).slice(0,3); if(B.length<2)continue; const gap=low?B[1].v-B[0].v:B[0].v-B[1].v; const rel=gap/Math.max(1e-6,Math.abs(B[0].v)); R.push({lab,k,B,rel});
    B.slice(0,2).forEach(x=>{ if(x.t!==G.user||G.unemp)return; const same=z=>Math.abs(z.v-x.v)<1e-9, rk=1+B.filter(z=>!same(z)&&(low?z.v<x.v:z.v>x.v)).length, co=B.some(z=>z!==x&&same(z)); hot.push(`${lab} ${co?'공동 ':''}${rk}위 ${x.p.name}(${tfmt(k,x.v)})${rk>1?`, 1위 ${B[0].p.name}과 ${tfmt(k,Math.abs(B[0].v-x.v))} 차`:''}`); }); } /* 동률은 공동 순위(목록 순서를 순위로 쓰지 않는다, 검수 11-09zf) */
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
/* 캠페인 장부: 선수가 우리 구단을 떠나면(방출·트레이드·해외·은퇴) 그날 캠페인을 끝내고 진행한 기간 몫만 정산한다. 이후 예상 수입만 빠진다 */
function smCheck(){ const fy=fyNow(); G.smkL=(G.smkL||[]).filter(e=>e.fy===fy); for(const e of G.smkL){ if(e.end!=null)continue; const p=G.players[e.pid];
    if(p&&p.smk&&p.smk.d===e.d&&smActive(p)&&!milServing(p)&&G.user===e.tid){ e.a=smEst(p,e.k); continue; }
    e.end=G.day; if(p&&p.smk&&p.smk.d===e.d)delete p.smk; /* 입대도 이탈로 정산하고, 끝난 캠페인은 복귀해도 되살아나지 않게 */ const amt=Math.round((e.a||0)*Math.max(0,G.day-e.d)/365); if(e.tid===G.user&&!G.unemp)note('마케팅',`${e.name} 스타 마케팅이 선수 이탈로 끝났습니다. 진행한 ${G.day-e.d}일 몫 수입 ${money(amt)}은 이번 결산에 들어갑니다(이후 예상 수입은 빠짐).`); } }
function smBonus(tid){ if(tid!==G.user||G.unemp)return 0; const fy=fyNow(); const done=sum((G.smkL||[]).filter(e=>e.fy===fy&&e.end!=null&&e.tid===tid).map(e=>Math.round((e.a||0)*Math.max(0,e.end-e.d)/365)));
  return done+sum(playersOf(G.user).filter(smActive).map(p=>Math.round(smEst(p,p.smk.k)*clamp((finYearEnd()-p.smk.d)/365,0,1)))); } /* 진행 중 캠페인은 실제 결산일까지의 일수로(결산이 미뤄지면 늘어난다, 검수 11-09j) */
function smStart(pid,k){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; const p=G.players[pid]; const T=SMK.find(x=>x.k===k); if(!p||p.team!==G.user||!T)return '우리 선수를 고르세요.';
  if(smActive(p))return `${p.name}은(는) 이미 스타 마케팅 중입니다(${dmd(p.smk.until)}까지).`;
  const until=finYearEnd(); const f=clamp((until-G.day)/365,0,1); const est=Math.round(smEst(p,k)*f); prInit(); G.spend.etc=(G.spend.etc||0)+T.c; p.smk={k,d:G.day,until,f,fy:fyNow()}; (G.smkL=G.smkL||[]).push({pid:p.id,name:p.name,k,d:G.day,fy:fyNow(),a:smEst(p,k),tid:G.user}); G.pr.fan=clamp(G.pr.fan+T.fan,0,100); p.mor=clamp((p.mor??60)+2,0,100);
  news('구단',k==='l'?`${tshort(G.user)}, '${p.name}' 대대적 마케팅…도시 곳곳에 대형 광고`:k==='m'?`${tshort(G.user)}, ${p.name} 앞세운 마케팅 본격화`:`${tshort(G.user)}, ${p.name} 유니폼·굿즈 출시`,`구단이 ${p.name}(${posLabel(p)}, ${p.age}세)을(를) 얼굴로 내세운 마케팅을 시작했습니다.`,1,{ref:p.id,fanW:1});
  return `${p.name} 스타 마케팅(${T.l})을 시작했습니다. 비용 ${money(T.c)}, 이번 결산까지 추가 수입 예상 ${money(est)}${est<T.c?` (비용보다 적습니다. 스타 파워 ${starPower(p)}로는 아직 이름값이 약합니다)`:''}. 팬 관심 +${T.fan}.`; }
/* 캠페인 기간 매달(15일) 기사 */
const SM_NEWS=[p=>[`${p.name} 유니폼, 리그 판매 상위권`,`${p.name}의 이름을 단 유니폼이 구단 매장에서 가장 많이 팔렸습니다.`],p=>[`${p.name}, 스포츠음료 광고 모델 발탁`,`${p.name}이(가) 한 스포츠음료 브랜드의 새 광고 모델이 됐습니다.`],p=>[`'${p.name} 데이' 팬 사인회 매진`,`홈경기 전 열린 ${p.name} 팬 사인회 표가 하루 만에 다 팔렸습니다.`],p=>[`${p.name} 다큐멘터리 공개`,`${p.name}의 한 시즌을 따라간 구단 제작 다큐멘터리가 공개됐습니다.`]];
function smNews(){ if(G.unemp)return; prInit(); for(const p of playersOf(G.user).filter(smActive)){ const n=p.smk.n=(p.smk.n||0); const [t,b]=SM_NEWS[n%SM_NEWS.length](p); p.smk.n++; news('구단',t,b,1,{ref:p.id,fanW:1}); G.pr.fan=clamp(G.pr.fan+1,0,100); } }
/* 스타 탄생: 스타 파워 25 이상이 된 우리 선수를 그해 한 번 알린다 */
function starCheck(){ if(G.unemp||G.user==null)return; for(const p of playersOf(G.user)){ if(p.starY===G.year)continue; const s=starPower(p); if(s<25)continue; p.starY=G.year;
  news('선수',`'대세' ${p.name}…${tshort(G.user)}의 새 얼굴`,`활약과 화제성이 쌓인 ${p.name}(${posLabel(p)}, ${p.age}세)을(를) 찾는 팬과 광고주가 늘고 있습니다.`,1,{ref:p.id,fanW:1});
  if(!smActive(p))mail('마케팅팀',`${p.name}, 스타로 떠올랐습니다`,`${p.name}의 스타 파워가 ${s}입니다. 지금 스타 마케팅을 하면 이번 결산까지 추가 수입이 이 정도로 예상됩니다.\n${SMK.map(T=>`${T.l}(비용 ${money(T.c)}): 약 ${money(Math.round(smEst(p,T.k)*clamp((finYearEnd()-G.day)/365,0,1)))}`).join('\n')}\n\n아래 '스타 마케팅 보기'를 누르면 바로 정할 수 있습니다(PC는 구단 → 재정 → 선수 홍보, 휴대폰은 구단주 화면).`,{kind:'구단',ref:p.id,acts:[{l:'스타 마케팅 보기',a:'goStar',v:''}]}); } }

/* ===== 기념 유니폼(사용자 11-09: "50홈런 유니폼을 만들었더니 품절 대란") =====
   우리 선수가 대기록(시즌 50홈런·200안타·20승·40세이브, 큰 통산 이정표, 사이클링 히트 같은 리그 주요 기록)을 세우면 마케팅팀이 기념 유니폼 제작을 묻는다.
   근거: 실제 리그에서 스타 선수의 대기록 기념 유니폼이 출시 첫날 접속이 몰리고 예약만 수만 벌이 팔렸다는 보도가 있다(2024년 8~9월 언론 보도).
   게임 수치는 그보다 훨씬 보수적으로 잡은 설정값이다(실측 근거 없음): 구단 몫 한 벌 6만 원, 제작비 한 벌 4만 원 + 디자인·라이선스 2천만 원.
   다 팔아도 1만 벌이면 약 1.8억, 3만 벌이면 약 5.8억 남고(시즌 수입의 1~2% 안팎), 덜 팔리면 재고만큼 손해다.
   판매 수요는 선수 스타 파워·팬 여론·시장 규모로 정하고 운이 섞인다. 수입은 결산 '기념 유니폼 판매'(구단 이벤트 수입 G.spend.fanIn 안에서 G.spend.goods로 따로 보임), 제작비는 '팬 마케팅·구단 이벤트' */
const MEMO_Q=[1e4,3e4], MEMO_U=.06, MEMO_C=.04, MEMO_FIX=20;
const memoCost=q=>Math.round((MEMO_FIX+q*MEMO_C)*ecoIdx());
function memoDemand(p){ return Math.round((2000+starPower(p)*250)*Math.sqrt(team(G.user).market)*(.6+(G.pr.fan??50)/125)/100)*100; } /* 중앙값(벌) */
function memoAsk(f,p){ if(G.unemp||p.team!==G.user||!(f.maj||['w20','sv40'].includes(f.k))||f.k==='tnh')return; const R0=G.evRecent&&G.evRecent['memo:'+p.id]; if(R0!=null&&G.day-R0<120)return; /* 한 선수는 넉 달에 한 번 */
  const D=memoDemand(p), e=ecoIdx(); const nm=`${p.name} ${f.k==='mile'?f.txt:FEATK[f.k]||'대기록'}`;
  evNew('memo',`${nm} 기념 유니폼 만들까요?`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) ${f.txt} 기록을 세웠습니다. 마케팅팀은 기념 유니폼을 내자고 합니다.\n스타 파워 ${starPower(p)} · 팬 여론 ${Math.round(G.pr.fan)} 기준 예상 판매 약 ${D.toLocaleString('ko-KR')}벌(운에 따라 절반~1.5배). 다 팔리면 구단 몫 한 벌 ${Math.round(MEMO_U*e*100)}만 원, 남은 재고는 손해입니다.`,
    MEMO_Q.map(q=>{ const c=memoCost(q), s=Math.min(q,D); return {l:`${(q/1e4)}만 벌 제작`,fx:`제작비 ${money(c)}. 예상대로 팔리면 판매 수입 ${money(Math.round(s*MEMO_U*e))}(손익 ${money(Math.round(s*MEMO_U*e)-c)}).`}; }).concat([{l:'만들지 않는다',fx:'비용도 수입도 없습니다.'}]),{ref:p.id,face:p.id,from:'마케팅팀',data:{pid:p.id,nm},def:2,exp:7}); }
EVH.memo={
  can(e,i){ if(i<MEMO_Q.length&&team(G.user).indie&&spendable(G.user)<memoCost(MEMO_Q[i]))return '제작비를 낼 수 있는 현금이 부족합니다.'; return ''; },
  pick(e,i){ if(i>=MEMO_Q.length)return '기념 유니폼은 만들지 않았습니다.'; const p=G.players[e.data.pid]; if(!p||p.team!==G.user)return '이제 우리 선수가 아닙니다.';
  const q=MEMO_Q[i], ec=ecoIdx(), cost=memoCost(q), D=Math.round(memoDemand(p)*clamp(Math.exp(N(0,.35)),.5,1.5)), sold=Math.min(q,D), inc=Math.round(sold*MEMO_U*ec); const S=G.spend;
  if(team(G.user).indie)S.eventReserve=(S.eventReserve||0)+cost;
  S.fan=(S.fan||0)+cost; S.fanIn=(S.fanIn||0)+inc; S.goods=(S.goods||0)+inc; const L=G.memoL=G.memoL||[]; L.unshift({y:G.year,d:G.day,pid:p.id,name:p.name,nm:e.data.nm,q,sold,inc,cost}); if(L.length>20)L.length=20;
  const boom=D>=q*1.2, flop=sold<q*.6;
  if(boom){ G.pr.fan=clamp(G.pr.fan+3,0,100); team(G.user).pop=clamp(team(G.user).pop+.003,.4,1.6); p.mor=clamp((p.mor??60)+3,0,100); news('구단',`${e.data.nm} 기념 유니폼 품절 대란`,`출시 첫날 구단 온라인몰 접속이 몰렸고 ${q.toLocaleString('ko-KR')}벌이 금세 동났습니다. 추가 제작 요청이 이어집니다.`,2,{ref:p.id,fanW:2}); }
  else if(flop)news('구단',`${e.data.nm} 기념 유니폼, 재고 남아`,`관심에 비해 판매가 더뎌 ${(q-sold).toLocaleString('ko-KR')}벌이 남았습니다.`,0,{ref:p.id});
  else { G.pr.fan=clamp(G.pr.fan+1,0,100); news('구단',`${e.data.nm} 기념 유니폼 출시`,`기념 유니폼 ${sold.toLocaleString('ko-KR')}벌이 팔렸습니다.`,1,{ref:p.id,fanW:1}); }
  return `${q.toLocaleString('ko-KR')}벌을 만들어 ${sold.toLocaleString('ko-KR')}벌 팔았습니다${boom?'(품절 대란, 팬 여론 +3)':''}. 판매 수입 ${money(inc)}, 제작비 ${money(cost)}, 손익 ${money(inc-cost)}.`; } };
