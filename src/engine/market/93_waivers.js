/* ===== 웨이버 공시 (KBO 규약 제10장 선수계약의 양도) =====
   출처: KBO 규약 웨이버 조항(공시 기간 7일, 7월 24일 공시 마감·7월 31일 이후 양도 불가: 스포츠경향 2013.7.24), 2017년 규약 개정(정규시즌 성적 역순, 동률이면 전년도 역순: 경북매일 2017.1.18).
   - 등록 선수를 방출하면 7일 동안 웨이버 공시된다. 그동안 다른 구단이 양수를 신청할 수 있고, 여럿이면 지금 성적의 역순(하위 구단 우선)으로 데려간다.
   - 데려간 구단은 남은 계약(연봉·기간)을 그대로 이어받고, 방출한 구단은 낸 방출 정산금을 돌려받는다.
   - 아무도 신청하지 않으면 자유계약(무적) 선수가 된다.
   - 양도 가능 기간 밖(7월 25일 이후 공시~포스트시즌)이면 7일 동안 양수 신청을 받지 않는다.
   - 시즌 뒤 11월 보류선수 명단 정리(재계약 포기)는 웨이버 없이 바로 자유계약이다. 육성선수는 등록 선수가 아니라 대상이 아니다 */
const WV_DAYS=7;
function wvNeed(p){ return !!p&&p.team!=null&&!p.foreign&&!p.ys&&!p.prospect&&!(period()==='off'&&G.day<=KD(11,30)); }
function wvClaimable(){ const per=period(); if(per==='post'||preSettle())return false; return per==='season'?G.day+WV_DAYS<=tradeDL():true; }
/* toFree가 계약을 지우기 전에 부른다: 양수 구단이 이어받을 계약을 남겨 둔다 */
function wvStart(p,paid){ if(!wvNeed(p))return; const from=p.team;
  p.wv={from,d:G.day,end:G.day+WV_DAYS,ok:wvClaimable(),paid:paid||0,cl:[],c:{role:p.role,sal:p.sal,yrs:p.yrs,faC:!!p.faC,ext:!!p.ext,cyrs:p.cyrs,extNext:p.extNext?JSON.parse(JSON.stringify(p.extNext)):undefined, /* 방출 기록이 원본을 바꾸기 전에 복사(검수 11-07) */...(p.ctT===p.team?{opt:p.opt,cOpt:p.cOpt,pOut:p.pOut,cOptAdd:p.cOptAdd,ntc:p.ntc,capB:p.capB}:{})}}; /* 남은 계약 승계: 성과 옵션·구단 옵션·옵트아웃도 함께 */
  if(ovr(p)>=40)wire('웨이버',`${tname(from)}, ${p.name}(${posLabel(p)}) 웨이버 공시`,{tid:from,ref:p.id});
  if(from!==G.user&&p.wv.ok&&!G.unemp&&ovr(p)>=wvBar(G.user))mail('운영팀',`웨이버 공시: ${tshort(from)} ${p.name}`,`${tname(from)}이(가) ${p.name}(${posLabel(p)}, ${p.age}세, 연 ${money(p.sal)})을(를) 웨이버 공시했습니다. ${dmd(p.wv.end-1)}까지 양수를 신청하면 ${dmd(p.wv.end)}에 정하며, 신청한 구단 중 성적이 낮은 구단이 남은 계약을 이어받아 데려갑니다.`,{kind:'트레이드',ref:p.id,acts:[{l:'웨이버 보기',a:'go',v:'transfer:kbo'}]}); }
/* 우선순위: 지금 순위의 역순(standingsNow가 동률을 전년도 순위로 가른다). 새해 뒤 경기가 없으면 지난 시즌 순위 역순 */
/* 우선권: 지금 성적 역순, 승률이 같으면(개막 직후·겨울 포함) 직전 시즌 순위 역순(검수 11-06) */
function wvOrder(){ const ord=(G.last&&G.last.order)||[]; const prv=id=>{ const i=ord.findIndex(o=>(o.tid??o)===id); return i<0?-1:i; }; const rec=(G.sea&&G.sea.rec)||{}; const pct=id=>{ const r=rec[id]; const n=r?r.w+r.l:0; return n?r.w/n:.5; };
  return G.teams.map(t=>t.id).sort((a,b)=>pct(a)-pct(b)||prv(b)-prv(a)); }
function wvBar(tid){ const own=domestic(tid).filter(q=>!q.ys).map(ovr).sort((a,b)=>b-a); return (own[Math.min(own.length-1,30)]||35)+2; }
function wvWants(tid,p,w){ if(tid===w.from||rosterN(tid)>=ROSTER_MAX)return false; /* 한 자리만 있어도 신청(우리와 같은 기준, 검수 11-07) */ if(!(ovr(p)>=wvBar(tid)&&p.age<=34&&aiVal(team(tid),p)>=1))return false; const ks=Object.keys(w.c||{}), sv=ks.map(k=>[k,p[k]]); try{ for(const k of ks)if(w.c[k]!==undefined)p[k]=w.c[k]; return capPayAs(tid,[p.id],[])<=capOf(sponSeason())*aiCapMul(team(tid)); } finally{ for(const [k,v] of sv)p[k]=v; } } /* 상한은 이어받을 계약으로 계산(검수 11-07: 방출로 지워진 싼 연봉으로 계산해 상한을 넘겨 영입) */ /* 상위 40명 기준(안 들어가면 합계 그대로) */
function wvList(){ return Object.values(G.players).filter(p=>p.wv&&p.team==null); }
function wvClaim(id){ const p=G.players[id]; const w=p&&p.wv; if(!w||p.team!=null)return '웨이버 공시 중인 선수가 아닙니다.'; if(w.from===G.user)return '우리 구단이 공시한 선수는 신청할 수 없습니다.';
  if(G.day>=w.end)return `신청 기한(${dmd(w.end-1)})이 지났습니다. 오늘 우선권을 정합니다.`; /* 마감일(공시+7일)에는 결정만(검수 11-07) */
  if(!w.ok)return '양도 가능 기간 밖(7월 25일 이후~포스트시즌)에 공시된 선수라 양수 신청을 받지 않습니다.';
  const i=w.cl.indexOf(G.user); if(i>=0){ w.cl.splice(i,1); return `${p.name} 양수 신청을 취소했습니다.`; }
  if(rosterN(G.user)>=ROSTER_MAX)return `정식 선수가 ${ROSTER_MAX}명으로 꽉 찼습니다. 먼저 한 명을 정리하세요.`;
  w.cl.push(G.user); const ov=capPayAs(G.user,[p.id],[])-capOf(sponSeason()); return `${p.name} 양수를 신청했습니다. ${dmd(w.end)}에 성적 역순으로 우선권을 정합니다.${ov>0?` 받으면 상위 40명 연봉이 상한을 ${money(ov)} 넘습니다(다른 구단은 상한을 넘기면 신청하지 않습니다. 시즌 끝까지 넘으면 경쟁균형세).`:''}`; }
function wvDaily(){ for(const p of wvList()){ const w=p.wv; if(G.day<w.end)continue; delete p.wv; let to=null;
    if(w.ok&&tradeOpen()){ const want=new Set(w.cl.filter(t=>t!==w.from&&rosterN(t)<ROSTER_MAX)); /* 신청한 구단 기준(단장이 이직해도 전 구단 신청은 유효) */ for(const t of G.teams)if(t.id!==ME()&&wvWants(t.id,p,w))want.add(t.id); to=wvOrder().find(t=>want.has(t)); if(to===undefined)to=null; }
    const row={d:G.day,pid:p.id,n:p.name,from:w.from,to}; (G.wvLog=G.wvLog||[]).unshift(row); if(G.wvLog.length>30)G.wvLog.length=30;
    if(to!=null){ p.team=to; if(w.c.role)p.role=w.c.role; /* 보직도 승계(양수만으로 선발·불펜이 바뀌지 않게, 검수 11-06) */ p.sal=w.c.sal; p.yrs=w.c.yrs; p.faC=w.c.faC; p.ext=w.c.ext; if(w.c.cyrs)p.cyrs=w.c.cyrs; if(w.c.extNext)p.extNext=w.c.extNext; for(const k of ['opt','cOpt','pOut','cOptAdd','ntc','capB'])if(w.c[k]!=null){ p[k]=JSON.parse(JSON.stringify(w.c[k])); p.ctT=to; } delete p.freeSince; delete p.freeDay;
      if(w.paid)payOut(w.from,-w.paid,'rel'); /* 계약을 넘겼으니 방출 정산금은 돌려받는다 */
      mvLog('웨이버 양수',p,w.from,to,`계약 승계 연 ${money(p.sal)}`,p.sal); story(p,`웨이버로 ${tname(to)} 이적(계약 승계)`,'move'); acqStamp(p,'웨이버',to); wire('웨이버',`${tname(to)}, 웨이버 공시된 ${p.name} 영입(전 소속 ${tshort(w.from)})`,{tid:to,ref:p.id});
      if(to===G.user)note('트레이드',`웨이버로 ${p.name}을(를) 데려왔습니다. 남은 계약(연 ${money(p.sal)})을 이어받습니다.`,p.id);
      else if(w.from===G.user)note('트레이드',`${tname(to)}이(가) 웨이버로 ${p.name}을(를) 데려갔습니다. 계약을 넘겨 방출 정산금${w.paid?` ${money(w.paid)}`:''}을(를) 돌려받습니다.`,p.id);
      else if(w.cl.includes(G.user))note('트레이드',rosterN(G.user)>=ROSTER_MAX?`${p.name} 양수 신청은 정식 선수 정원(${ROSTER_MAX}명)이 차서 빠졌습니다. ${tname(to)}이(가) 데려갔습니다.`:`${p.name} 양수 신청은 우선순위에서 밀렸습니다. 성적이 더 낮은 ${tname(to)}이(가) 데려갔습니다.`,p.id); } /* 실제 빠진 이유대로(검수 11-06) */
    else { if(w.from===G.user)note('트레이드',`웨이버 공시 7일 동안 ${p.name}을(를) 데려간 구단이 없어 자유계약 선수가 됐습니다.`,p.id); else if(w.cl.includes(G.user))note('트레이드',`${p.name} 양수가 성사되지 않았습니다(정식 선수 자리 부족 또는 양도 기간 종료). 자유계약 선수가 됐습니다.`,p.id); } } }
