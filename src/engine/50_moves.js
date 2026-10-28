/* ===== 이적 기록: 리그 모든 선수 이동을 구조화해 남긴다(이적시장 요약·주간 정리·구단별 영입/이탈) ===== */
function mvLog(type,p,from,to,note,amt){ if(!p)return; const L=G.moves=G.moves||[]; L.unshift({y:G.year,d:G.day,t:type,pid:p.id,n:p.name,pos:posLabel(p),age:p.age,o:Math.round(ovr(p)),from:from??null,to:to??null,note:note||'',amt:amt||0}); if(L.length>600)L.length=600; }
/* 지금 이적시장 구간의 시작일: 시즌 중이면 개막일, 아니면 11월 1일 */
function mvWinStart(){ const per=period(); if(per==='season'||per==='post')return G.cal.open; return G.day>=KD(11,1)?KD(11,1):dnum(G.year-1,11,1); }
function mvWindow(){ const s=mvWinStart(); return (G.moves||[]).filter(m=>m.d>=s); }
function mvWinLabel(){ const per=period(); return per==='season'?`${G.year} 시즌 중`:per==='post'?`${G.year} 포스트시즌`:`${G.day>=KD(11,1)?G.year:G.year-1}~${G.day>=KD(11,1)?G.year+1:G.year} 스토브리그`; }
/* 매주 월요일: 지난 7일 이동이 많으면 주간 정리 기사 */
function mvWeekly(){ const w=(G.moves||[]).filter(m=>m.d>G.day-7&&m.d<=G.day); if(w.length<4)return;
  const c=k=>w.filter(m=>m.t===k).length; const big=w.filter(m=>m.amt>0).sort((a,b)=>b.amt-a.amt)[0];
  const parts=[['FA',c('FA')],['트레이드',new Set(w.filter(m=>m.t==='트레이드').map(m=>m.d+':'+Math.min(m.from,m.to))).size],['외국인',c('외국인')],['방출',c('방출')],['무적 영입',c('무적 영입')],['보상선수',c('보상선수')]].filter(x=>x[1]);
  const mine=w.filter(m=>m.to===G.user||m.from===G.user);
  news('이적',`이적시장 주간 정리: ${parts.map(([k,n])=>`${k} ${n}건`).join(', ')}`,`${big?`이번 주 최대 계약: ${big.n}(${big.pos}) → ${big.to!=null?tshort(big.to):''}, ${big.note}. `:''}${mine.length?`우리 구단 관련 이동 ${mine.length}건: ${mine.slice(0,4).map(m=>`${m.n}(${m.to===G.user?'영입':'이탈'})`).join(', ')}.`:''}`,0); }
