/* ===== 이적 기록: 리그 모든 선수 이동을 구조화해 남긴다(이적시장 요약·주간 정리·구단별 영입/이탈) ===== */
function mvLog(type,p,from,to,note,amt,tr){ if(!p)return; G.mvN=(G.mvN||0)+1; if((from!=null||to!=null)&&from!==to&&!p.foreign){ /* 방출·무적 영입도 남긴다: 시즌 마지막 날 방출해도 그해 연봉은 그날까지 낸다 */ const L=p.tLog=(p.tLog||[]).filter(x=>x.y>=G.year-1); L.push({y:G.year,d:G.day,f:from,t:to,s:p.sal}); } /* s: 떠나기 전 연봉(옛 구단 몫은 그 연봉으로, 검수 11-08) */ /* 구단 사이 이동: 그해 연봉을 소속 기간대로 나눈다(payYear) */ /* 선수 이동 횟수: 전력표 캐시를 다시 계산하는 기준 */
  { const C=G.contract; if(to!==from&&C&&!C.done&&from!=null&&from===(C.tid??G.user)&&(C.ended||[]).includes(p.id)){ const n=C.neg&&C.neg[p.id]; const v=n?(n.st==='ok'?p.newSal:(n.cur??n.off)):p.newSal; if(v!=null){ p.sal=Math.max(MIN_SAL,v); } delete p.newSal; if(C.neg)delete C.neg[p.id]; C.ended=C.ended.filter(x=>x!==p.id); } } /* 연봉 협상 중 떠나는 선수: 그때까지의 구단 제시액(합의했으면 합의액)으로 새 연봉을 확정 */ if(to!==from){ p.e1=false; delete p.downDay; /* 1군 등록은 새 구단이 다시 정한다(엔트리 한도 초과 방지). 말소 10일 규정은 같은 구단 재등록이라 새 구단은 바로 올릴 수 있다 */
    delete p.listed; delete p.lw; delete p.urgent; delete p.promise; delete p.pconv; delete p.treq; delete p.aiListed; /* 옛 구단·단장이 건 표시는 끝난다 */
    if(p.extNext&&p.extNext.terms&&type!=='방출'){ /* 방출은 toFree가 웨이버 기록에 계약을 복사한 뒤 지운다(검수 11-08b: 승계할 조항이 먼저 사라짐) */ if(type==='2차 드래프트'||type==='웨이버 양수')delete p.extNext.terms.role; else p.extNext.terms=null; } /* 트레이드·방출이면 미리 맺은 다년계약의 구단 한정 조건은 끝난다. 계약을 통째로 승계하는 2차 드래프트·웨이버는 옵션·거부권을 잇고 주전 약속만 끝(검수 11-07) */
    if(from===G.user&&(G.ovs||[]).some(x=>x.pid===p.id&&!x.go))try{ setOvs(p.id,null); }catch(e){} } try{ if(to!=null&&to!==from&&ACQ_K[type]&&type!=='2차 드래프트')acqStamp(p,type,to,{from:from??null}); /* 2차 드래프트는 지명 때 라운드와 함께 한 번 남긴다(검수 11-07: 두 번 기록·라운드 덮어씀) */ }catch(e){} const L=G.moves=G.moves||[], m={seq:G.mvN,y:G.year,d:G.day,t:type,pid:p.id,n:p.name,pos:posLabel(p),age:p.age,o:Math.round(ovr(p)),sal:p.sal??null,yrs:p.yrs||0,from:from??null,to:to??null,note:note||'',amt:amt||0,...(tr?{tr}:{})}; L.unshift(m); mvChron(m); if(L.length>600)L.length=600; }
/* 이동 기록 600건과 별개로 양쪽 구단 연대기에 당시 이름·구단·조건을 보관한다. */
function mvChron(m){
  if(m.from==null&&m.to==null)return;
  const abroad=m.t==='해외 진출'||m.t==='해외 복귀', label=tid=>tid!=null?tname(tid):abroad?'해외 구단':'무소속';
  const route=m.from===m.to?`${label(m.to)} 잔류`:`${label(m.from)} → ${label(m.to)}`;
  const inherited=['트레이드','웨이버 양수','보상선수','2차 드래프트'].includes(m.t)&&m.sal!=null?` · 승계 연봉 ${money(m.sal)}${m.yrs>0?' · 잔여 '+m.yrs+'년':''}`:'';
  const text=`${m.n}(${m.pos}, ${m.age}세) · ${m.t} · ${route}${m.note?' · '+m.note:''}${inherited}`;
  const ids=[...new Set([m.from,m.to].filter(tid=>tid!=null))];
  for(const tid of ids)chron('move',text,m.pid,tid,{source:'mv:'+m.seq+':'+(tid===m.from?'out':'in')});
}
/* 호출 시점에 지급 방향과 지명권 이름을 고정한다(나중의 단장·구단·지명자와 무관). */
function mvTradeNote(from,to,cash,pk){ const a=[]; if(cash)a.push(`${tname(cash>0?from:to)} → ${tname(cash>0?to:from)} 현금 ${money(Math.abs(cash))}`); if(pk)for(const [k,tid] of [['give',to],['get',from]])if(pk[k]&&pk[k].length)a.push(`${pk[k].map(pkName).join('·')} → ${tname(tid)}`); return a.join(' · '); }
/* 트레이드 한 건의 번호: 같은 날 같은 상대와 한 별도 거래도 따로 센다(검수 11-08d) */
const mvTr=()=>G.trSeq=(G.trSeq||0)+1;
const mvTrN=W=>new Set(W.filter(m=>m.t==='트레이드').map(m=>m.tr??m.d+':'+Math.min(m.from,m.to)+':'+Math.max(m.from,m.to))).size; /* 번호 없는 옛 기록은 날짜·두 구단으로 */
/* 지금 이적시장 구간의 시작일: 시즌 중이면 개막일, 아니면 11월 1일. 포스트시즌이 끝난 뒤 11월 전에도 올해 스토브리그(검수 11-08d: 지난겨울로 돌아가 여름 거래까지 셈) */
function mvWinStart(){ const per=period(); if(per==='season'||per==='post')return G.cal.open; const y=per==='off'||G.day>=KD(11,1)?G.year:G.year-1, n1=dnum(y,11,1); return G.last&&G.last.y===y&&G.last.d!=null?Math.min(G.last.d,n1):n1; } /* 결산(한국시리즈 이틀 뒤)에 시장이 열리면 그날부터 스토브리그(10월 거래 누락, 검수 11-09w) */
function mvWindow(){ const s=mvWinStart(); return (G.moves||[]).filter(m=>m.d>=s); }
function mvWinLabel(){ const per=period(); return per==='season'?`${G.year} 시즌 중`:per==='post'?`${G.year} 포스트시즌`:`${per==='off'||G.day>=KD(11,1)?G.year:G.year-1}~${per==='off'||G.day>=KD(11,1)?G.year+1:G.year} 스토브리그`; }
/* 매주 월요일: 지난 7일 이동이 많으면 주간 정리 기사 */
function mvWeekly(){ const w=(G.moves||[]).filter(m=>m.d>G.day-7&&m.d<=G.day); if(w.length<4)return;
  const c=k=>w.filter(m=>m.t===k&&m.from!==m.to).length; const big=w.filter(m=>m.amt>0&&m.to!=null&&['FA','외국인','무적 영입'].includes(m.t)).sort((a,b)=>b.amt-a.amt)[0];
  const parts=[['FA',c('FA')],['트레이드',mvTrN(w)],['외국인',c('외국인')],['방출',c('방출')],['무적 영입',c('무적 영입')],['보상선수',c('보상선수')],['웨이버',c('웨이버 양수')],['2차 드래프트',c('2차 드래프트')],['계약 전환',w.filter(m=>m.from!=null&&m.from===m.to).length]].filter(x=>x[1]);
  const mine=w.filter(m=>m.to===G.user||m.from===G.user);
  news('이적',`이적시장 주간 정리: ${parts.map(([k,n])=>`${k} ${n}건`).join(', ')||`기타 이동 ${w.length}건`}`,`${big?`이번 주 최대 계약: ${big.n}(${big.pos}) → ${big.to!=null?tshort(big.to):''}, ${big.note}. `:''}${mine.length?`우리 구단 관련 이동 ${mine.length}건: ${mine.slice(0,4).map(m=>`${m.n}(${m.from===m.to?'계약 전환':m.to===G.user?'영입':'이탈'})`).join(', ')}.`:''}`,0); }
