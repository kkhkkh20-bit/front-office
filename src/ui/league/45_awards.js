/* ---------- 시상식 연출: 후보 소개 → 수상자 발표(득표 막대) → 소감 → 전체 결과 ---------- */
function cerStages(A,k){ if(k==='mvp')return [['MVP',A.cand.mvp||[],1],['신인왕',A.cand.roy||[],1]].filter(s=>s[1].length);
  const P=[['투수','P'],['포수','C'],['1루수','1B'],['2루수','2B'],['3루수','3B'],['유격수','SS'],['외야수','OF'],['지명타자','DH']];
  return P.filter(([,c])=>A.cand.gg[c]&&A.cand.gg[c].length).map(([l,c])=>[l,A.cand.gg[c],c==='OF'?3:1]); }
function cerQuote(c,lab,k){ const p=G.players[c.id]; const mine=c.t===G.user; const m=mgrOf(c.t);
  const L=[`"${lab}은(는) 혼자 받는 상이 아닙니다. 함께 뛴 동료들 덕분입니다."`,`"${m&&!m.interim?m.name+' 감독님이 믿고 기회를 주셨습니다. ':''}더 잘하라는 뜻으로 알겠습니다."`,`"응원해 주신 ${tshort(c.t)} 팬들께 이 상을 바칩니다."`];
  if(mine&&!G.unemp)L.push(`"단장님과 프런트가 뒤에서 많이 챙겨 주셨습니다. 감사합니다."`); if(p&&p.age<=23)L.push('"어릴 때 꿈꾸던 무대입니다. 아직 실감이 안 납니다."'); if(p&&p.age>=33)L.push('"이 나이에 이 상을 받을 줄 몰랐습니다. 후배들에게 길을 보여 주고 싶습니다."');
  return L[Math.floor(u01('cq'+c.id,lab)*L.length)]; }
/* 후보 카드: 발표 전에는 모두 같은 밝기(이름순), 발표 뒤에는 득표순 목록과 수상자 무대 */
/* 시상식 전에 해외로 떠나거나 은퇴한 선수도 보관 기록으로 같은 얼굴을 그린다(글자 한 자로 나오던 문제) */
function awP(id){ const a=G.arch&&G.arch[id]; return G.players[id]||(a?{...a,team:a.t}:null); }
function cerFace(c){ const p=awP(c.id); return p?avImg(p,true):`<span class="av ini big">${esc(c.name.slice(0,1))}</span>`; }
function cerCard(c){ const p=G.players[c.id];
  return `<div class="cer-c${c.t===G.user?' me':''}">${cerFace(c)}<div class="cer-i"><b>${esc(c.name)}</b><span>${badge(c.t,18)} ${esc(tshort(c.t))}${p?` · ${esc(posLabel(p))}`:''}</span><em>${esc(c.line)}</em></div></div>`; }
function cerRow(c,i,win,tot){ const pct=Math.round(c.v/tot*100);
  return `<div class="cer-r${win?' win':''}${c.t===G.user?' me':''}"><i>${i+1}</i>${cerFace(c)}<span class="cer-rn"><b>${esc(c.name)}</b><em>${badge(c.t,14)} ${esc(tshort(c.t))}</em></span><span class="cer-bar"><i style="--w:${pct}%"></i></span><b class="num">${c.v}표</b></div>`; }
function cerStar(c,lab,k,tot,q){ const pct=Math.round(c.v/tot*100);
  return `<div class="cer-star${c.t===G.user?' me':''}"><span class="cer-tro${v3('svg')?' v3t-on':''}" aria-hidden="true">${v3Img(lab==='MVP'?'mvp_trophy':lab==='신인왕'?'rookie_trophy':'golden_glove',40)}</span>${cerFace(c)}<div class="cer-si"><span class="eyebrow">${esc(lab)} 수상</span><b>${esc(c.name)}</b><span>${badge(c.t,22)} ${esc(tname(c.t))}</span><em>${esc(c.line)}</em><div class="cer-sv"><span class="cer-bar"><i style="--w:${pct}%"></i></span><b class="num">${c.v}표 · ${pct}%</b></div></div>${q?`<p class="cer-q">${esc(cerQuote(c,lab,k))}</p>`:''}</div>`; }
function cerSheet(){ const C=UI.cer; const A=G.awards&&G.awards[C.y]; if(!A)return ''; const S=cerStages(A,C.k); const title=C.k==='mvp'?`${C.y} ${ASSOC.s} 시상식`:`${C.y} 골든글러브 시상식`;
  const totOf=st=>st[2]>1?288:(C.k==='mvp'?125:288);
  const prog=`<div class="cer-prog">${S.map((st,i)=>`<span class="${i===C.i?'on':i<C.i?'done':''}">${st[0]}</span>`).join('')}<span class="${C.i>=S.length?'on':''}">결과</span></div>`;
  let body;
  if(C.i>=S.length){ /* 전체 결과: 골든글러브는 야구장 그림, MVP·신인왕은 두 수상자 무대 */
    body=`<div class="cer-stage cer-end">${C.k==='gg'?'':'<h3 class="cer-ttl">MVP · 신인왕</h3>'}${C.k==='gg'?ggField(A,true):`<div class="cer-stars">${S.map(st=>st[1][0]?cerStar(st[1][0],st[0],C.k,totOf(st),false):'').join('')}</div>`}
      <div class="cer-ft"><span></span><button class="btn primary" data-a="closeSheet">닫기</button></div></div>`; }
  else { const st=S[C.i], tot=totOf(st), rev=!!C.rev, n=st[1].length;
    const L=[...st[1]].sort((a,b)=>a.name.localeCompare(b.name)), W=st[1].slice(0,st[2]);
    const mid=rev?`<div class="cer-rv"><div class="cer-stars">${W.map((w,i)=>cerStar(w,st[0],C.k,tot,i===0)).join('')}</div><div class="cer-rank"><h4>투표 결과 · 기자 ${tot}명${st[2]>1?` · 1인 최대 ${st[2]}명 선택`:''}</h4>${st[1].map((c,i)=>cerRow(c,i,i<st[2],tot)).join('')}</div></div>`
      :`<div class="cer-grid${n>12?' many':''}" style="--cols:${n<=4?n:n<=6?3:n<=8?4:n<=12?4:6}">${L.map(cerCard).join('')}</div>`;
    body=`<div class="cer-stage"><div class="cer-lab"><span class="eyebrow">${C.i+1} / ${S.length} 부문</span><h3 class="cer-ttl">${st[0]}${st[2]>1?` <small>${st[2]}명</small>`:''}</h3><span class="muted">${rev?'수상자 발표':`후보 ${n}명 · 이름순`}</span></div>${mid}
      <div class="cer-ft"><button class="btn" data-a="cerAll">결과 한눈에</button>${rev?`<button class="btn primary" data-a="cerNext">${C.i+1<S.length?'다음 부문':'전체 결과'}</button>`:`<button class="btn primary cer-go" data-a="cerRev">수상자 발표</button>`}</div></div>`; }
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut cer" data-stop="1" role="dialog" aria-label="${esc(title)}"><div class="sheet-head"><div><div class="eyebrow">${C.k==='mvp'?'MVP · 신인왕':'포지션별 최고 선수'}</div><h2 class="sec">${esc(title)}</h2></div>${prog}<button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>${body}</div></div>`; }
function cerHomeCard(){ const c=G.cerNew; if(!c||c.seen||!G.awards||!G.awards[c.y])return ''; if(c.d!=null?G.day-c.d>7:(dobj(G.day).m>=2&&dobj(G.day).m<=10))return ''; /* 지난 행사는 홈에서 내리고 시상 기록·소식함에서 본다 */ return `<section class="card cer-home"><div class="row between"><div><div class="eyebrow">오늘의 행사</div><b>${c.y} ${c.k==='mvp'?`${ASSOC.s} 시상식`:'골든글러브 시상식'}</b></div><button class="btn primary" data-a="cerOpen" data-v="${c.y}:${c.k}">시상식 보기</button></div></section>`; }
/* 골든글러브 수상자 그림: 시상식 무대(에셋 v3) 위 야구장, 자리마다 금색 아치 카드(포지션·얼굴·구단 마크·이름·구단), 위 금색 리본 제목, 오른쪽 아래 황금 글러브 트로피.
   자리(%): 외야 3명 위, 내야, 투수 가운데, 포수 아래, 지명타자 왼쪽 아래. 오른쪽 아래는 트로피 자리로 비운다 */
const GG_SPOT={OF0:[19,31],OF1:[50,25],OF2:[81,31],SS:[34,47],'2B':[66,47],'3B':[16,63],'1B':[84,61],P:[50,62],C:[50,86],DH:[23,87]};
function ggField(A,votes){ const nm=k=>k.startsWith('OF')?'외야수':k==='P'?'투수':POSK[k], y=A.y||Object.keys(G.awards||{}).find(k=>G.awards[k]===A)||'', st=v3('stage');
  const fld=`<svg class="ggf-bg" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="ggfG" cx="50%" cy="85%" r="80%"><stop offset="0" stop-color="#3f9a4e"/><stop offset="1" stop-color="#1c4d2a"/></radialGradient><linearGradient id="ggfD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98450"/><stop offset="1" stop-color="#7e5229"/></linearGradient><pattern id="ggfS" width="8" height="80" patternUnits="userSpaceOnUse"><rect width="4" height="80" fill="#fff" opacity=".05"/></pattern><radialGradient id="ggfL" cx="50%" cy="0" r="70%"><stop offset="0" stop-color="#fff6d0" stop-opacity=".22"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></radialGradient></defs><path d="M50 76 L4 32 A64 64 0 0 1 96 32 Z" fill="#6b4a2a" opacity=".9"/><path d="M50 74 L6.5 32.5 A61 61 0 0 1 93.5 32.5 Z" fill="url(#ggfG)"/><path d="M50 74 L6.5 32.5 A61 61 0 0 1 93.5 32.5 Z" fill="url(#ggfS)"/><path d="M50 77 L27 53 Q50 30 73 53 Z" fill="url(#ggfD)"/><path d="M50 70 L38 57.5 L50 45 L62 57.5 Z" fill="#3a8a47"/><ellipse cx="50" cy="58" rx="2.6" ry="2" fill="#a9733f"/><path d="M50 74 L4 30 M50 74 L96 30" stroke="#f3f1e4" stroke-width=".45"/>${[[50,70],[62,57.5],[50,45],[38,57.5]].map(([x,y])=>`<rect x="${x-.9}" y="${y-.9}" width="1.8" height="1.8" fill="#fff" transform="rotate(45 ${x} ${y})"/>`).join('')}<rect width="100" height="80" fill="url(#ggfL)"/></svg>`;
  const mk=Object.entries(GG_SPOT).filter(([k])=>A.gg[k]).map(([k,[x,yy]])=>{ const w=A.gg[k], p=awP(w.id);
    return `<${p?`button data-a="player" data-v="${w.id}"`:'div'} class="ggf-m${w.t===G.user?' me':''}" style="left:${x}%;top:${yy}%" title="${esc(nm(k))} ${esc(w.name)} · ${esc(tshort(w.t))}${votes?` · ${w.v}표`:''}"><i>${nm(k)}</i><span class="ggf-ph">${p?avImg(p,true):`<span class="av ini big">${esc(w.name.slice(0,1))}</span>`}<span class="ggf-tb">${badge(w.t,18)}</span></span><span class="ggf-nb"><b>${esc(w.name)}</b><em>${esc(team(w.t).nick)}${votes?`<span class="ggf-v"> · ${w.v}표</span>`:''}</em></span></${p?'button':'div'}>`; }).join('');
  return `<div class="ggf"${st?` style="--ggf-bg:url(${st})"`:''}>${fld}<div class="ggf-rb"><span>${y?y+' ':''}골든글러브 수상자</span></div>${mk}<div class="ggf-tro" aria-hidden="true">${ggTrophyImg(160)}</div></div>`; }
