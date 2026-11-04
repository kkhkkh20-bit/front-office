/* ---------- 시상식 연출: 후보 소개 → 수상자 발표(득표 막대) → 소감 → 전체 결과 ---------- */
function cerStages(A,k){ if(k==='mvp')return [['MVP',A.cand.mvp||[],1],['신인왕',A.cand.roy||[],1]].filter(s=>s[1].length);
  const P=[['투수','P'],['포수','C'],['1루수','1B'],['2루수','2B'],['3루수','3B'],['유격수','SS'],['외야수','OF'],['지명타자','DH']];
  return P.filter(([,c])=>A.cand.gg[c]&&A.cand.gg[c].length).map(([l,c])=>[l,A.cand.gg[c],c==='OF'?3:1]); }
function cerQuote(c,lab,k){ const p=G.players[c.id]; const mine=c.t===G.user; const m=mgrOf(c.t);
  const L=[`"${lab}은(는) 혼자 받는 상이 아닙니다. 함께 뛴 동료들 덕분입니다."`,`"${m&&!m.interim?m.name+' 감독님이 믿고 기회를 주셨습니다. ':''}더 잘하라는 뜻으로 알겠습니다."`,`"응원해 주신 ${tshort(c.t)} 팬들께 이 상을 바칩니다."`];
  if(mine&&!G.unemp)L.push(`"단장님과 프런트가 뒤에서 많이 챙겨 주셨습니다. 감사합니다."`); if(p&&p.age<=23)L.push('"어릴 때 꿈꾸던 무대입니다. 아직 실감이 안 납니다."'); if(p&&p.age>=33)L.push('"이 나이에 이 상을 받을 줄 몰랐습니다. 후배들에게 길을 보여 주고 싶습니다."');
  return L[Math.floor(u01('cq'+c.id,lab)*L.length)]; }
/* 후보 카드: 발표 전에는 모두 같은 밝기(이름순), 발표 뒤에는 득표순 목록과 수상자 무대 */
function cerFace(c){ const p=G.players[c.id]; return p?avImg(p,true):`<span class="av ini big">${esc(c.name.slice(0,1))}</span>`; }
function cerCard(c){ const p=G.players[c.id];
  return `<div class="cer-c${c.t===G.user?' me':''}">${cerFace(c)}<div class="cer-i"><b>${esc(c.name)}</b><span>${badge(c.t,18)} ${esc(tshort(c.t))}${p?` · ${esc(posLabel(p))}`:''}</span><em>${esc(c.line)}</em></div></div>`; }
function cerRow(c,i,win,tot){ const pct=Math.round(c.v/tot*100);
  return `<div class="cer-r${win?' win':''}${c.t===G.user?' me':''}"><i>${i+1}</i>${cerFace(c)}<span class="cer-rn"><b>${esc(c.name)}</b><em>${badge(c.t,14)} ${esc(tshort(c.t))}</em></span><span class="cer-bar"><i style="--w:${pct}%"></i></span><b class="num">${c.v}표</b></div>`; }
function cerStar(c,lab,k,tot,q){ const pct=Math.round(c.v/tot*100);
  return `<div class="cer-star${c.t===G.user?' me':''}"><span class="cer-tro" aria-hidden="true"></span>${cerFace(c)}<div class="cer-si"><span class="eyebrow">${esc(lab)} 수상</span><b>${esc(c.name)}</b><span>${badge(c.t,22)} ${esc(tname(c.t))}</span><em>${esc(c.line)}</em><div class="cer-sv"><span class="cer-bar"><i style="--w:${pct}%"></i></span><b class="num">${c.v}표 · ${pct}%</b></div></div>${q?`<p class="cer-q">${esc(cerQuote(c,lab,k))}</p>`:''}</div>`; }
function cerSheet(){ const C=UI.cer; const A=G.awards&&G.awards[C.y]; if(!A)return ''; const S=cerStages(A,C.k); const title=C.k==='mvp'?`${C.y} ${ASSOC.s} 시상식`:`${C.y} 골든글러브 시상식`;
  const totOf=st=>st[2]>1?288:(C.k==='mvp'?125:288);
  const prog=`<div class="cer-prog">${S.map((st,i)=>`<span class="${i===C.i?'on':i<C.i?'done':''}">${st[0]}</span>`).join('')}<span class="${C.i>=S.length?'on':''}">결과</span></div>`;
  let body;
  if(C.i>=S.length){ /* 전체 결과: 골든글러브는 야구장 그림, MVP·신인왕은 두 수상자 무대 */
    body=`<div class="cer-stage cer-end"><h3 class="cer-ttl">${C.k==='gg'?'골든글러브 수상자':'MVP · 신인왕'}</h3>${C.k==='gg'?ggField(A,true):`<div class="cer-stars">${S.map(st=>st[1][0]?cerStar(st[1][0],st[0],C.k,totOf(st),false):'').join('')}</div>`}
      <div class="cer-ft"><span></span><button class="btn primary" data-a="closeSheet">닫기</button></div></div>`; }
  else { const st=S[C.i], tot=totOf(st), rev=!!C.rev, n=st[1].length;
    const L=[...st[1]].sort((a,b)=>a.name.localeCompare(b.name)), W=st[1].slice(0,st[2]);
    const mid=rev?`<div class="cer-rv"><div class="cer-stars">${W.map((w,i)=>cerStar(w,st[0],C.k,tot,i===0)).join('')}</div><div class="cer-rank"><h4>투표 결과 · 기자 ${tot}명${st[2]>1?` · 1인 최대 ${st[2]}명 선택`:''}</h4>${st[1].map((c,i)=>cerRow(c,i,i<st[2],tot)).join('')}</div></div>`
      :`<div class="cer-grid${n>12?' many':''}" style="--cols:${n<=4?n:n<=6?3:n<=8?4:n<=12?4:6}">${L.map(cerCard).join('')}</div>`;
    body=`<div class="cer-stage"><div class="cer-lab"><span class="eyebrow">${C.i+1} / ${S.length} 부문</span><h3 class="cer-ttl">${st[0]}${st[2]>1?` <small>${st[2]}명</small>`:''}</h3><span class="muted">${rev?'수상자 발표':`후보 ${n}명 · 이름순`}</span></div>${mid}
      <div class="cer-ft"><button class="btn" data-a="cerAll">결과 한눈에</button>${rev?`<button class="btn primary" data-a="cerNext">${C.i+1<S.length?'다음 부문':'전체 결과'}</button>`:`<button class="btn primary cer-go" data-a="cerRev">수상자 발표</button>`}</div></div>`; }
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut cer" data-stop="1" role="dialog" aria-label="${esc(title)}"><div class="sheet-head"><div><div class="eyebrow">${C.k==='mvp'?'MVP · 신인왕':'포지션별 최고 선수'}</div><h2 class="sec">${esc(title)}</h2></div>${prog}<button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>${body}</div></div>`; }
function cerHomeCard(){ const c=G.cerNew; if(!c||c.seen||!G.awards||!G.awards[c.y])return ''; if(c.d!=null?G.day-c.d>7:(dobj(G.day).m>=2&&dobj(G.day).m<=10))return ''; /* 지난 행사는 홈에서 내리고 시상 기록·소식함에서 본다 */ return `<section class="card cer-home"><div class="row between"><div><div class="eyebrow">오늘의 행사</div><b>${c.y} ${c.k==='mvp'?`${ASSOC.s} 시상식`:'골든글러브 시상식'}</b></div><button class="btn primary" data-a="cerOpen" data-v="${c.y}:${c.k}">시상식 보기</button></div></section>`; }
/* 골든글러브 수상자를 야구장 그림 위 각 자리에(외야 3명 위, 투수 가운데, 포수 아래, 지명타자 왼쪽 아래) */
const GG_SPOT={OF0:[18,27],OF1:[50,11],OF2:[82,27],SS:[35,44],'2B':[65,44],'3B':[15,58],'1B':[85,58],P:[50,54],C:[50,81],DH:[10,84]};
function ggField(A,votes){ const nm=k=>k.startsWith('OF')?'외야수':k==='P'?'투수':POSK[k];
  const fld=`<svg class="ggf-bg" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true"><path d="M50 74 L3 27 A67 67 0 0 1 97 27 Z" fill="#2c6a3a"/><path d="M50 74 L3 27 A67 67 0 0 1 97 27 Z" fill="none" stroke="#1d4a28" stroke-width="2.5"/><path d="M50 76 L26 51 Q50 27 74 51 Z" fill="#a8743f"/><path d="M50 69 L37 55 L50 41 L63 55 Z" fill="#37803f"/><circle cx="50" cy="55" r="2.6" fill="#a8743f"/><path d="M50 74 L3 27 M50 74 L97 27" stroke="#e9efe6" stroke-width=".5"/>${[[50,69],[63,55],[50,41],[37,55]].map(([x,y])=>`<rect x="${x-1}" y="${y-1}" width="2" height="2" fill="#fff" transform="rotate(45 ${x} ${y})"/>`).join('')}</svg>`;
  const mk=Object.entries(GG_SPOT).filter(([k])=>A.gg[k]).map(([k,[x,y]])=>{ const w=A.gg[k], p=G.players[w.id];
    return `<${p?`button data-a="player" data-v="${w.id}"`:'div'} class="ggf-m${w.t===G.user?' me':''}" style="left:${x}%;top:${y}%">${p?avImg(p,true):`<span class="av ini big">${esc(w.name.slice(0,1))}</span>`}<i>${nm(k)}</i><b>${esc(w.name)}</b><em>${badge(w.t,16)} ${esc(tshort(w.t))}${votes?`<span class="ggf-v"> · ${w.v}표</span>`:''}</em></${p?'button':'div'}>`; }).join('');
  return `<div class="ggf">${fld}${mk}</div>`; }
