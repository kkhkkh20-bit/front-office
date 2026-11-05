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
  p.wv={from,d:G.day,end:G.day+WV_DAYS,ok:wvClaimable(),paid:paid||0,cl:[],c:{sal:p.sal,yrs:p.yrs,faC:!!p.faC,ext:!!p.ext,cyrs:p.cyrs,extNext:p.extNext}};
  if(ovr(p)>=40)wire('웨이버',`${tname(from)}, ${p.name}(${posLabel(p)}) 웨이버 공시`,{tid:from,ref:p.id});
  if(from!==G.user&&p.wv.ok&&!G.unemp&&ovr(p)>=wvBar(G.user))mail('운영팀',`웨이버 공시: ${tshort(from)} ${p.name}`,`${tname(from)}이(가) ${p.name}(${posLabel(p)}, ${p.age}세, 연 ${money(p.sal)})을(를) 웨이버 공시했습니다. ${dmd(p.wv.end)}까지 양수를 신청하면, 신청한 구단 중 성적이 낮은 구단이 남은 계약을 이어받아 데려갑니다.`,{kind:'트레이드',ref:p.id,acts:[{l:'웨이버 보기',a:'go',v:'transfer:kbo'}]}); }
/* 우선순위: 지금 순위의 역순(standingsNow가 동률을 전년도 순위로 가른다). 새해 뒤 경기가 없으면 지난 시즌 순위 역순 */
function wvOrder(){ return standingsNow().map(x=>x.tid).reverse(); }
function wvBar(tid){ const own=domestic(tid).filter(q=>!q.ys).map(ovr).sort((a,b)=>b-a); return (own[Math.min(own.length-1,30)]||35)+2; }
function wvWants(tid,p,w){ if(tid===w.from||rosterN(tid)>=ROSTER_MAX-1)return false; return ovr(p)>=wvBar(tid)&&p.age<=34&&aiVal(team(tid),p)>=1&&capPayAs(tid,[p.id],[])<=capOf(sponSeason()); } /* 상위 40명 기준(안 들어가면 합계 그대로) */
function wvList(){ return Object.values(G.players).filter(p=>p.wv&&p.team==null); }
function wvClaim(id){ const p=G.players[id]; const w=p&&p.wv; if(!w||p.team!=null)return '웨이버 공시 중인 선수가 아닙니다.'; if(w.from===G.user)return '우리 구단이 공시한 선수는 신청할 수 없습니다.';
  if(!w.ok)return '양도 가능 기간 밖(7월 25일 이후~포스트시즌)에 공시된 선수라 양수 신청을 받지 않습니다.';
  const i=w.cl.indexOf(G.user); if(i>=0){ w.cl.splice(i,1); return `${p.name} 양수 신청을 취소했습니다.`; }
  if(rosterN(G.user)>=ROSTER_MAX)return `정식 선수가 ${ROSTER_MAX}명으로 꽉 찼습니다. 먼저 한 명을 정리하세요.`;
  w.cl.push(G.user); return `${p.name} 양수를 신청했습니다. ${dmd(w.end)}에 성적 역순으로 우선권을 정합니다.`; }
function wvDaily(){ for(const p of wvList()){ const w=p.wv; if(G.day<w.end)continue; delete p.wv; let to=null;
    if(w.ok&&tradeOpen()){ const want=new Set(w.cl.filter(t=>t!==w.from&&rosterN(t)<ROSTER_MAX)); /* 신청한 구단 기준(단장이 이직해도 전 구단 신청은 유효) */ for(const t of G.teams)if(t.id!==ME()&&wvWants(t.id,p,w))want.add(t.id); to=wvOrder().find(t=>want.has(t)); if(to===undefined)to=null; }
    const row={d:G.day,pid:p.id,n:p.name,from:w.from,to}; (G.wvLog=G.wvLog||[]).unshift(row); if(G.wvLog.length>30)G.wvLog.length=30;
    if(to!=null){ p.team=to; p.sal=w.c.sal; p.yrs=w.c.yrs; p.faC=w.c.faC; p.ext=w.c.ext; if(w.c.cyrs)p.cyrs=w.c.cyrs; if(w.c.extNext)p.extNext=w.c.extNext; delete p.freeSince; delete p.freeDay;
      if(w.paid)payOut(w.from,-w.paid,'rel'); /* 계약을 넘겼으니 방출 정산금은 돌려받는다 */
      mvLog('웨이버 양수',p,w.from,to,`계약 승계 연 ${money(p.sal)}`,p.sal); story(p,`웨이버로 ${tname(to)} 이적(계약 승계)`,'move'); acqStamp(p,'웨이버',to); wire('웨이버',`${tname(to)}, 웨이버 공시된 ${p.name} 영입(전 소속 ${tshort(w.from)})`,{tid:to,ref:p.id});
      if(to===G.user)note('트레이드',`웨이버로 ${p.name}을(를) 데려왔습니다. 남은 계약(연 ${money(p.sal)})을 이어받습니다.`,p.id);
      else if(w.from===G.user)note('트레이드',`${tname(to)}이(가) 웨이버로 ${p.name}을(를) 데려갔습니다. 계약을 넘겨 방출 정산금${w.paid?` ${money(w.paid)}`:''}을(를) 돌려받습니다.`,p.id);
      else if(w.cl.includes(G.user))note('트레이드',`${p.name} 양수 신청은 우선순위에서 밀렸습니다. 성적이 더 낮은 ${tname(to)}이(가) 데려갔습니다.`,p.id); }
    else { if(w.from===G.user)note('트레이드',`웨이버 공시 7일 동안 ${p.name}을(를) 데려간 구단이 없어 자유계약 선수가 됐습니다.`,p.id); else if(w.cl.includes(G.user))note('트레이드',`${p.name} 양수가 성사되지 않았습니다(정식 선수 자리 부족 또는 양도 기간 종료). 자유계약 선수가 됐습니다.`,p.id); } } }
