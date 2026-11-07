/* The choice is a normal content page under the existing navigation. No result is computed yet. */
function matchEntrySheet(){const x=nextGames(1)[0];return `<div class="scrim"><section class="sheet gut match-entry" role="dialog" aria-label="경기 중계 선택"><div class="sheet-head"><div><span class="eyebrow">경기 시작 전</span><h2 class="sec">이번 경기를 어떻게 볼까요?</h2></div></div>${x?`<div class="match-entry-teams">${badge(G.user,64)}<b>${esc(tshort(G.user))}<span>vs</span>${esc(tshort(x.op))}</b>${badge(x.op,64)}</div><p>${dstr(x.d)} · ${x.home?'홈':'원정'}${x.ps?' · '+esc(x.ps):''}</p><p class="muted">결과를 미리 보여주지 않고 1회부터 중계합니다.</p><div class="match-entry-choices"><button class="btn primary" data-a="matchWatch"><b>3D 중계로 보기</b><span>결과를 숨긴 채 1회부터 · 하이라이트/전체 선택</span></button><button class="btn" data-a="matchSim"><b>결과만 보기</b><span>이 경기 한 경기만 빠르게 진행</span></button></div>`:'<p>예정된 우리 경기가 없습니다.</p>'}<button class="btn" data-a="matchLater">나중에 결정</button></section></div>`;}

/* 경기 전 라인업(FM 경기 전 화면처럼): 흐린 경기장 위에 포지션 그림 카드 + 오른쪽 구단색 타순 패널. 원정·홈은 위 버튼으로 바꿔 본다(기본: 우리 팀) */
const PREP_XY={C:[60,95],P:[60,73],'1B':[81,69],'2B':[71,54],SS:[49,54],'3B':[39,69],LF:[24,38],CF:[60,23],RF:[96,38],DH:[104,90]}; /* 120x100 도식 좌표(홈 60,92) */
/* 경기 전 기준 시즌 기록(중계 라인업 그래픽처럼): 결과가 미리 계산돼 있어 올 시즌 1군 합계에서 이 경기 기록을 뺀다 */
function prepSeason(g,id,line,isP){const p=G.players[id];const ps=/차전/.test(g.kind||'');if(ps)line=null; /* 포스트시즌 경기는 정규시즌 합계에 없으니 빼지 않는다(검수 11-07) */const t=p&&seasonTotal(p,dobj(g.day).y,'1군');const v=k=>Math.max(0,((t&&t[k])||0)-((line&&line[k])||0));
 if(isP){const outs=v('outs'),er=v('er'),w=Math.max(0,((t&&t.w)||0)-(line?.d==='승'?1:0)),l=Math.max(0,((t&&t.l)||0)-(line?.d==='패'?1:0)),gs=Math.max(0,((t&&t.gs)||0)-(ps?0:1));return outs?{rec:`${w}승 ${l}패`,era:(er*27/outs).toFixed(2),ip:ipStr(outs),gs}:null;}
 const ab=v('ab'),h=v('h');return v('pa')?{avg:(h/Math.max(1,ab)).toFixed(3).replace(/^0/,''),hr:v('hr'),rbi:v('rbi')}:null;}
function matchPrepLineups(g){UI.prepAt=Date.now();if(UI.prepSideG!==g.day){UI.prepManual=false;UI.prepSide=null;}const me=G.user,def=g.home===me?'h':'a',cur=UI.prepSide&&UI.prepSideG===g.day?UI.prepSide:def;
 const card=side=>{const tid=side==='a'?g.away:g.home,rows=castLineup(g,side,0).slice(0,9),pit=g.box[side].pit[0],col=cTeamCol(tid);
  const chip=(p,label,pos,n)=>{const xy=PREP_XY[pos]||PREP_XY.DH;return `<div class="cs-pc" style="left:${xy[0]/1.2}%;top:${xy[1]}%">${p?avImg(p):'<span class="av ini">?</span>'}<b><em>${label}</em>${esc(p?.name||n||'')}</b></div>`;};
  const bl=id=>g.box[side].bat.find(b=>b.id===id),ps=pit?prepSeason(g,pit.id,pit,true):null,pp=pit&&G.players[pit.id];
  const recT=(()=>{const L=tlOf(tid).filter(x=>x[5]<g.day),r=wlOf(L);return r.w+r.l+r.t?recStr(r):'시즌 첫 경기';})();
  const list=`<div class="cs-pl" style="--tc:${col}"><header>${badge(tid,40)}<div><b>${esc(tname(tid))}</b><small>${side==='a'?'원정':'홈'} · ${esc(recT)}</small></div></header><div class="cs-pl-h"><span>#</span><span>선수</span><span>포지션</span><span>타율</span><span>홈런</span><span>타점</span></div><ol>${rows.map((r,i)=>{const st=prepSeason(g,r.id,bl(r.id));const q=G.players[r.id];return `<li><i>${i+1}</i><b>${esc(q?.name||r.n||'')}<small>${q?esc(q.bt+'타'):''}</small></b><span>${esc(POSK[r.pos]||r.pos)}</span><em>${st?st.avg:'-'}</em><em>${st?st.hr:'-'}</em><em>${st?st.rbi:'-'}</em></li>`;}).join('')}</ol>${pit?`<div class="cs-pl-sp"><span>선발투수</span><b>${esc(pp?.name||pit.n||'')}<small>${pp?esc(pp.th+'투'):''}</small></b><em>${ps?`${ps.rec} · 평균자책점 ${ps.era} · ${ps.ip}이닝`:'시즌 첫 등판'}</em></div>`:''}</div>`;

  const field=`<div class="cs-pf" style="--tc:${col}"><div class="cs-pfi"><svg viewBox="0 0 120 100" aria-hidden="true"><defs><pattern id="pfs" width="10" height="100" patternUnits="userSpaceOnUse"><rect width="5" height="100" fill="#ffffff0d"/></pattern></defs><path d="M60 92 L7.7 39.7 A74 74 0 0 1 112.3 39.7 Z" class="gr"/><path d="M60 92 L7.7 39.7 A74 74 0 0 1 112.3 39.7 Z" fill="url(#pfs)"/><path d="M60 95 L35.5 68.5 A34.6 34.6 0 0 1 84.5 68.5 Z" class="dt"/><path d="M60 88 L76 72 L60 56.5 L44 72 Z" class="ig"/><path d="M60 92 L7.7 39.7 M60 92 L112.3 39.7" class="ln"/><circle cx="60" cy="73.5" r="3.2" class="md"/><rect x="58.9" y="72.4" width="2.2" height=".6" class="bs"/>${[[77,75],[60,58],[43,75]].map(([x,y])=>`<rect x="${x-1.3}" y="${y-1.3}" width="2.6" height="2.6" transform="rotate(45 ${x} ${y})" class="bs"/>`).join('')}<path d="M58.6 91.2 h2.8 v1.3 l-1.4 1.3 l-1.4 -1.3 z" class="bs"/></svg><div class="cs-pfx tl"><b>${esc(tshort(tid))}</b><span>${esc(recT)}</span></div>${pit?`<div class="cs-pfx bl"><span>선발</span><b>${esc(pp?.name||'')}</b><span>${ps?`${ps.rec} · ${ps.era}`:'시즌 첫 등판'}</span></div>`:''}${rows.map((r,i)=>chip(G.players[r.id],i+1,r.pos,r.n)).join('')}${pit?chip(G.players[pit.id],'P','P'):''}</div></div>`;
  return `<section class="cs-pcard" data-side="${side}"${side===cur?'':' hidden'}>${field}${list}</section>`;};
 return `<div class="cs-prep"><div class="cs-prep-heading"><b>선발 라인업</b><span>${esc(stadName(g.home))} · ${dstr(g.day)} · ${[0,6].includes(dobj(g.day).w)?'주간':'야간'} 경기</span><span class="chips optrow cs-prep-side" role="group">${['a','h'].map(sd=>`<button type="button" data-a="prepSide" data-v="${sd}:${g.day}" class="${sd===cur?'on':''}" aria-pressed="${sd===cur}">${badge(sd==='a'?g.away:g.home,14)} ${esc(tshort(sd==='a'?g.away:g.home))}</button>`).join('')}</span></div><div class="cs-prep-teams">${card('a')}${card('h')}</div><div class="cs-prep-foot"><div class="cs-prep-talk"><span>해설</span>${matchPrepTalk(g).map(t=>`<p>${esc(t)}</p>`).join('')}</div><div class="cs-prep-go"><span class="cs-prep-stage">선수들이 경기장에 도착하고 있습니다</span><span class="cs-prep-bar"><i></i></span><button class="btn primary cs-prep-start" data-a="castStart" disabled>경기 시작</button></div></div></div>`;}
/* 경기 전 화면: 우리 팀 라인업을 보여 준 뒤 5초마다 상대 팀과 번갈아 띄운다(FM처럼). 단장이 버튼을 직접 누르면 멈춘다 */
setInterval(()=>{ try{ const c=UI.cast; if(!c||!c.pre||UI.prepManual||Date.now()-(UI.prepAt||0)<4800)return; const el=document.querySelector('#cs-3d[data-pre] .cs-pcard:not([hidden])'); const b=el&&document.querySelector(`.cs-prep-side button:not(.on)`); if(b)A.prepSide(b.dataset.v,null,null,true); }catch(e){} },500);
/* 경기 전 해설: 결과가 미리 계산돼 있으므로 이 경기 날짜 이전 기록만 쓴다(점수·결과·이날 성적 금지) */
function matchPrepTalk(g){const before=tid=>tlOf(tid).filter(x=>x[5]<g.day),rec=tid=>wlOf(before(tid)),pct=r=>r.w/Math.max(1,r.w+r.l),A=tshort(g.away),H=tshort(g.home),ra=rec(g.away),rh=rec(g.home),out=[];
 const order=G.teams.map(t=>({tid:t.id,r:rec(t.id)})).sort((a,b)=>pct(b.r)-pct(a.r)),rank=tid=>order.findIndex(x=>x.tid===tid)+1;
 const form=(tid,name)=>{const L=before(tid),r=wlOf(L.slice(-5)),s=L.length?Math.sign(L[L.length-1][0]):0;let n=0;for(let i=L.length-1;i>=0&&Math.sign(L[i][0])===s;i--)n++;return `${name} ${r.w}승 ${r.l}패${r.t?` ${r.t}무`:''}${s&&n>=2?`(${n}연${s>0?'승':'패'})`:''}`;};
 if(/차전/.test(g.kind||'')){ /* 가을야구: 정규시즌 상대 전적 대신 지금 시리즈 전적과 직전 경기 주인공(사용자 피드백 11-05) */
  const rn=g.kind.replace(/\s*\d+차전.*$/,''),both=x=>[x.home,x.away].includes(g.home)&&[x.home,x.away].includes(g.away);
  const prev=(G.games||[]).filter(x=>x!==g&&x.day<g.day&&x.kind&&x.kind.startsWith(rn)&&both(x)).sort((a,b)=>a.day-b.day);
  const win=x=>x.hs>x.as?x.home:x.as>x.hs?x.away:null,wa=prev.filter(x=>win(x)===g.away).length,wh=prev.filter(x=>win(x)===g.home).length;
  out.push(`${g.kind}입니다. ${prev.length?`시리즈 전적 ${A} ${wa}승, ${H} ${wh}승${wa===wh?'으로 맞서 있습니다':`으로 ${wa>wh?A:H}이(가) 앞서 있습니다`}.`:'시리즈 첫 경기입니다.'}`);
  const L=prev[prev.length-1]; if(L){ const w=win(L),wk=w===L.home?'h':'a',bat=(L.box[wk]?.bat||[]).slice().sort((a,b)=>((b.h||0)+(b.hr||0)*2+(b.rbi||0))-((a.h||0)+(a.hr||0)*2+(a.rbi||0)))[0],wp=(L.box[wk]?.pit||[]).find(p=>p.d==='승');
   out.push(`직전 경기는 ${tshort(L.away)} ${L.as} : ${L.hs} ${tshort(L.home)}${w?`, ${tshort(w)} 승리`:', 무승부'}.${bat&&(bat.h||bat.rbi)?` ${bat.n} ${bat.h}안타${bat.hr?` ${bat.hr}홈런`:''}${bat.rbi?` ${bat.rbi}타점`:''}`:''}${wp?`, 승리투수 ${wp.n}`:''}.`); }
  const sp=side=>{const p=G.players[g.box[side].pit[0]?.id];return p?`${tshort(side==='a'?g.away:g.home)} ${p.name}(${p.th}투)`:null;},pa=sp('a'),ph=sp('h');if(pa&&ph)out.push(`선발 투수는 ${pa}, ${ph}입니다.`);
  return out; }
 const gp=r=>r.w+r.l+r.t,who=(tid,name,r)=>gp(r)?`${rank(tid)}위 ${name}(${recStr(r)})`:`${name}(시즌 첫 경기)`;
 if(!gp(ra)&&!gp(rh))out.push(`${A}와(과) ${H}, 두 팀 모두 이번 시즌 첫 경기입니다.`);
 else{out.push(`${who(g.away,A,ra)}와(과) ${who(g.home,H,rh)}의 맞대결입니다.`);out.push(`최근 5경기 ${[[g.away,A,ra],[g.home,H,rh]].filter(x=>gp(x[2])).map(x=>form(x[0],x[1])).join(', ')}.`);}
 const h=wlOf(before(g.away).filter(x=>x[4]===g.home));out.push(h.w+h.l+h.t?`올 시즌 상대 전적은 ${A} 기준 ${recStr(h)}입니다.`:'올 시즌 두 팀의 첫 맞대결입니다.');
 const sp=side=>{const p=G.players[g.box[side].pit[0]?.id];return p?`${tshort(side==='a'?g.away:g.home)} ${p.name}(${p.th}투)`:null;},pa=sp('a'),ph=sp('h');if(pa&&ph)out.push(`선발 투수는 ${pa}, ${ph}입니다.`);
 return out;}
/* 3D 로딩 진행(fo3d-progress)을 경기 전 화면 막대·문구에 반영. 뒤로 가지 않게 최댓값만 */
function cPrepProgress(p){const c=UI.cast,el=document.querySelector('#cs-3d[data-pre] .cs-prep-go');if(!c||!el)return;c.preAt=c.preAt||Date.now();c.prog=Math.max(c.prog||0,p);el.querySelector('.cs-prep-bar i').style.width=Math.round(c.prog*100)+'%';el.querySelector('.cs-prep-stage').textContent=c.prog>=1?'경기 준비를 마쳤습니다':c.prog>=.85?'그라운드 정비를 마치고 있습니다':c.prog>=.3?'선수들이 몸을 풀고 있습니다':'선수들이 경기장에 도착하고 있습니다';}
document.addEventListener('fo3d-progress',e=>cPrepProgress(e.detail));
/* 3D 준비 결과: 성공이면 '경기 시작' 활성(FM처럼 눌러야 시작), 실패(2D 대체)면 경기 전 화면을 닫고 기존처럼 바로 재생 */
function cPrepDone(ok){const c=UI.cast;if(!c?.pre)return;if(!ok){cPrepClose(c);return;}cPrepProgress(1);const b=document.querySelector('.cs-prep-start');if(b)b.disabled=false;
 /* 준비가 끝나면 누르지 않아도 시작한다(사용자 11-05). 라인업을 읽을 시간으로 경기 전 화면을 연 뒤 최소 6초는 보여 준다 */
 const t0=c.preAt||Date.now();setTimeout(()=>{if(UI.cast===c&&c.pre)A.castStart();},Math.max(1200,6000-(Date.now()-t0)));}
function cPrepClose(c){c.pre=0;document.getElementById('cs-3d')?.removeAttribute('data-pre');}
/* 휴대폰 중계는 화면 세로에 딱 맞춘다(사용자 11-05: 드래그하지 않게): 중계 판 위쪽부터 아래 탭바 위까지 */
function castFit(){ try{ const el=document.querySelector('.cast.match-dashboard'); if(!el)return; if(innerWidth>1000){ if(el.style.height){ el.style.height=''; el.style.minHeight=''; } return; }
  const bn=document.querySelector('.bnav'), bh=bn&&getComputedStyle(bn).display!=='none'?bn.getBoundingClientRect().height:0; const top=el.getBoundingClientRect().top+scrollY;
  const h=Math.max(420,Math.floor(innerHeight-top-bh-4))+'px'; if(el.style.height!==h){ el.style.height=h; el.style.minHeight=h; } }catch(e){} }
addEventListener('resize',castFit); setInterval(castFit,400);

/* 3D가 늦으면 기다리지 않고 기본 중계로 먼저 시작한다(사용자 11-06: 재생을 누르지 않아도 재생). 3D 준비가 끝나면 그때부터 3D로 바뀐다 */
function castStart2D(c){ if(!c||UI.cast!==c||!c.pre)return; const host=document.getElementById('cs-3d'); if(host&&host.dataset.state!=='ready'){ host.dataset.state='fallback'; if(host.parentElement){ host.parentElement.dataset.renderer='fallback'; host.parentElement.classList.remove('has-3d'); } } A.castStart(); }
