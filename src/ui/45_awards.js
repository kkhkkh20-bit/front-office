/* ---------- 시상식 연출: 후보 소개 → 수상자 발표(득표 막대) → 소감 → 전체 결과 ---------- */
function cerStages(A,k){ if(k==='mvp')return [['MVP',A.cand.mvp||[],1],['신인왕',A.cand.roy||[],1]].filter(s=>s[1].length);
  const P=[['투수','P'],['포수','C'],['1루수','1B'],['2루수','2B'],['3루수','3B'],['유격수','SS'],['외야수','OF'],['지명타자','DH']];
  return P.filter(([,c])=>A.cand.gg[c]&&A.cand.gg[c].length).map(([l,c])=>[l,A.cand.gg[c],c==='OF'?3:1]); }
function cerQuote(c,lab,k){ const p=G.players[c.id]; const mine=c.t===G.user; const m=mgrOf(c.t);
  const L=[`"${lab}은(는) 혼자 받는 상이 아닙니다. 함께 뛴 동료들 덕분입니다."`,`"${m&&!m.interim?m.name+' 감독님이 믿고 기회를 주셨습니다. ':''}더 잘하라는 뜻으로 알겠습니다."`,`"응원해 주신 ${tshort(c.t)} 팬들께 이 상을 바칩니다."`];
  if(mine&&!G.unemp)L.push(`"단장님과 프런트가 뒤에서 많이 챙겨 주셨습니다. 감사합니다."`); if(p&&p.age<=23)L.push('"어릴 때 꿈꾸던 무대입니다. 아직 실감이 안 납니다."'); if(p&&p.age>=33)L.push('"이 나이에 이 상을 받을 줄 몰랐습니다. 후배들에게 길을 보여 주고 싶습니다."');
  return L[Math.floor(u01('cq'+c.id,lab)*L.length)]; }
function cerCard(c,i,st,rev,tot){ const p=G.players[c.id]; const win=rev&&i<st[2]; const pct=Math.round(c.v/tot*100);
  return `<div class="cer-c${win?' win':''}${rev&&!win?' lose':''}${c.t===G.user?' me':''}" style="--d:${i*120}ms">${p?avImg(p):'<span class="av ini">?</span>'}<div class="cer-i"><b>${esc(c.name)}</b><span class="small">${badge(c.t,14)} ${esc(tshort(c.t))}</span><span class="small muted">${esc(c.line)}</span>
    ${rev?`<div class="cer-bar"><i style="--w:${pct}%"></i><em>${c.v}표</em></div>`:''}</div>${win?'<span class="cer-tro" aria-hidden="true"></span>':''}</div>`; }
function cerSheet(){ const C=UI.cer; const A=G.awards&&G.awards[C.y]; if(!A)return ''; const S=cerStages(A,C.k); const title=C.k==='mvp'?`${C.y} ${ASSOC.s} 시상식`:`${C.y} 골든글러브 시상식`;
  let body;
  if(C.i>=S.length){ /* 전체 결과 */
    body=`<div class="cer-sum">${S.map(st=>`<div class="cer-sr"><span class="eyebrow">${st[0]}</span>${st[1].slice(0,st[2]).map(c=>`<span class="cer-w${c.t===G.user?' me':''}">${esc(c.name)} <i>${esc(tshort(c.t))} · ${c.v}표</i></span>`).join('')}</div>`).join('')}</div>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" data-a="closeSheet">닫기</button></div>`; }
  else { const st=S[C.i]; const tot=st[2]>1?288:(C.k==='mvp'?125:288); const rev=!!C.rev; const L=rev?st[1]:[...st[1]].sort((a,b)=>a.name.localeCompare(b.name));
    const w=st[1][0];
    body=`<div class="cer-stage"><div class="cer-lab"><span>${C.i+1} / ${S.length}</span><h3>${st[0]}${st[2]>1?` (${st[2]}명)`:''}</h3><span class="small muted">${rev?`투표 결과 · 유효표 ${tot}표`:'후보'}</span></div>
      <div class="cer-list${rev?' rev':''}">${L.map((c,i)=>cerCard(c,i,st,rev,tot)).join('')}</div>
      ${rev&&w?`<div class="cer-q"><span class="pill warn">수상 소감</span> ${esc(w.name)}: ${esc(cerQuote(w,st[0],C.k))}</div>`:''}
      <div class="row" style="justify-content:space-between"><button class="btn small" data-a="cerAll">결과 한눈에</button>${rev?`<button class="btn primary" data-a="cerNext">${C.i+1<S.length?'다음 부문':'전체 결과'}</button>`:`<button class="btn primary cer-go" data-a="cerRev">수상자 발표</button>`}</div></div>`; }
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut cer" data-stop="1" role="dialog" aria-label="${esc(title)}"><div class="sheet-head"><div><div class="eyebrow">${C.k==='mvp'?'MVP · 신인왕':'포지션별 최고 선수'}</div><h2 class="sec">${esc(title)}</h2></div><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>${body}</div></div>`; }
function cerHomeCard(){ const c=G.cerNew; if(!c||c.seen||!G.awards||!G.awards[c.y])return ''; if(c.d!=null?G.day-c.d>7:(dobj(G.day).m>=2&&dobj(G.day).m<=10))return ''; /* 지난 행사는 홈에서 내리고 시상 기록·소식함에서 본다 */ return `<section class="card cer-home"><div class="row between"><div><div class="eyebrow">오늘의 행사</div><b>${c.y} ${c.k==='mvp'?`${ASSOC.s} 시상식`:'골든글러브 시상식'}</b></div><button class="btn primary" data-a="cerOpen" data-v="${c.y}:${c.k}">시상식 보기</button></div></section>`; }
