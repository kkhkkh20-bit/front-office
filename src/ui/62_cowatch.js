/* ---------- 동석 관람 경기 보고: 구단주·사장과 함께 본 홈경기 ----------
   한 화면: 라인스코어, 주요 장면 몇 줄, 구단주 한두 마디(면담 화면 말풍선), 신뢰·친밀도 변화와 선물,
   (a) 단장 건의 한 가지(안 해도 됨) → (b) 구단주 지시 */
function cwWho(S){ const B=bossOf(G.user); const t=team(G.user);
  if(S.who==='ceo')return {name:`${B.ceo.name} 사장`,role:`대표이사 사장 · 친밀도 ${cwRap('ceo')}`,av:avImg({persona:'staff',pid:B.ceo.id,team:G.user,age:B.ceo.age,name:B.ceo.name})};
  return {name:`${B.own.name} 회장`,role:`${OWNER[t.owner]?OWNER[t.owner].label+' ':''}구단주 · 관심사 ${CW_SECL[cwSec()]} · 친밀도 ${cwRap('own')}`,av:avImg({persona:'own',pid:B.own.id,team:G.user,age:B.own.age,expr:relEx(t.trust),name:B.own.name})}; }
/* 주요 장면: 우리 득점·홈런을 앞에, 상대 큰 득점을 뒤에. 최대 5줄 */
function cwKeys(g){ const L=g.pbp||[]; const myTop=g.away===G.user; const K=[];
  L.forEach((x,i)=>{ if(typeof x[1]!=='number')return; const runs=x[6]||0; if(!(runs>0||x[3]==='HR'))return; const mine=(x[0]%2===0)===myTop; K.push({i,h:x[0],mine,w:(mine?2:1)*(runs+(x[3]==='HR'?1:0))}); });
  const pick=K.slice().sort((a,b)=>b.w-a.w).slice(0,5).sort((a,b)=>a.i-b.i);
  return pick.map(k=>{ let t=''; try{ t=pbpCall(g,k.i).c; }catch(e){ t=pbpText(L[k.i]); } return {h:k.h,mine:k.mine,t}; }); }
function cwBubble(w,t,av){ return w==='sys'?`<div class="mt-sys">${esc(t)}</div>`:`<div class="mt-l ${w}">${w==='them'?`<span class="mt-av">${av}</span>`:''}<p>${esc(t)}</p></div>`; }
function cwSheet(){ const S=G.cwS; if(!S)return ''; const g=cwGame(S); const W=cwWho(S); const t=team(G.user);
  const F=[]; const res=S.res==='승'?'승리':S.res==='패'?'패배':'무승부';
  if(g&&g.pbp){ const K=cwKeys(g); if(K.length)F.push(`<div class="cw-keys"><span class="eyebrow">주요 장면</span>${K.map(k=>`<p class="${k.mine?'me':''}"><span class="ticker">${Math.floor(k.h/2)+1}회${k.h%2?'말':'초'}</span> ${esc(k.t)}</p>`).join('')}</div>`); }
  for(const l of S.lines)F.push(cwBubble('them',l,W.av));
  F.push(cwBubble('sys',`구단주 신뢰 ${S.trD?(S.trD>0?'+':'')+S.trD:'변화 없음'} · ${S.who==='ceo'?'사장':'구단주'} 친밀도 +${S.rapD} · 감독 관계 +1 · 1군 선수단 기분 +1`));
  if(S.gift)F.push(`<div class="cw-gift"><b>구단주 선물</b><p>${esc(S.gift.t)}</p></div>`);
  /* (a) 건의 결과 */
  if(S.sugg&&S.sugg.k!=='none'){ F.push(cwBubble('me',`${S.sugg.l}을(를) 건의드립니다.`)); F.push(cwBubble('them',S.sugg.say,W.av)); F.push(cwBubble('sys',`${S.sugg.txt}${S.sugg.mod?` (오늘 경기 보정 ${S.sugg.mod>0?'+':''}${Math.round(S.sugg.mod*100)}%p 반영)`:''}`)); }
  /* (b) 구단주 지시: 건의를 마친 뒤 보여 준다 */
  const O=S.ord; if(S.done&&O){ F.push(cwBubble('them',O.say,W.av)); F.push(`<div class="cw-ord"><span class="eyebrow">구단주 지시</span><b>${esc(O.t)}</b><p>${esc(O.crit)}</p><p class="cw-note">달성하면 신뢰 +2 · 친밀도 +3, 못 하면 신뢰 -1${O.k==='young'?' · 감독과의 유망주 기회 합의(스태프 → 감독)나 콜업 요청으로 도울 수 있습니다':O.k==='att'?' · 입장료는 구장 화면에서 바꿀 수 있습니다':O.k==='ext'?' · 선수 정보의 관리 탭에서 다년계약을 제안합니다':''}</p></div>`); }
  else if(S.done&&!O&&cwOrd()){ F.push(cwBubble('them',`지난번에 말한 것(${cwOrd().t})부터 잘 챙기시오.`,W.av)); }
  let ctl='';
  if(!S.done){ const L=cwSuggOpts(S); const mod=cwMod(S);
    ctl=`<span class="eyebrow">건의할 일 한 가지 · 안 해도 됩니다${mod?` · 오늘 경기 보정 ${mod>0?'+':''}${Math.round(mod*100)}%p`:''}${cwRapMod()?` · 친밀도 보정 ${cwRapMod()>0?'+':''}${Math.round(cwRapMod()*100)}%p`:''}</span>${L.map(([k,l,sub,dis])=>`<button class="mt-o cw-o" data-a="cwSugg" data-v="${k}" ${dis?'disabled':''}><span class="cw-tag t-sg">건의</span><b>${esc(l)}</b><i>${esc(dis||sub)}</i></button>`).join('')}<button class="mt-o end" data-a="cwSkip"><b>건의하지 않고 마치기</b></button>`; }
  else ctl=`<div class="cw-ctl"><button class="btn primary" data-a="cwClose">닫기</button></div>`;
  return `<div class="scrim" data-a="cwClose"><div class="sheet gut meet cw" data-stop="1" role="dialog" aria-label="동석 관람 경기 보고">
    <div class="sheet-head"><div class="mt-h">${W.av}<div><span class="eyebrow">동석 관람 · ${esc(CW_WHY[S.why]||'')} · ${dmd(S.day)}</span><h2 class="sec">${esc(W.name)}</h2><span class="small muted">${esc(W.role)} · 신뢰 ${Math.round(t.trust)}</span></div></div><button class="x" data-a="cwClose" aria-label="닫기">×</button></div>
    ${g?`<div class="cw-board"><div class="row between"><span class="small"><b>${esc(tshort(g.away))}</b> 대 <b>${esc(tshort(g.home))}</b>${g.att?` · 관중 ${g.att.toLocaleString('ko-KR')}명`:''}</span><span class="pill ${S.res==='승'?'good':S.res==='패'?'bad':''}">${res}${S.tags&&S.tags.length?' · '+S.tags.map(x=>CW_TAGL[x]).join(' · '):''}</span></div>${lineScore(g,null)}</div>`:''}
    <div class="mt-log" id="mt-log">${F.join('')}</div>
    <div class="mt-opts">${ctl}</div></div></div>`; }
/* 동석 보고가 막 생겼으면 한 번 자동으로 연다 */
function cwSheetOn(){ const S=G&&G.cwS; if(!S)return false; if(!UI.cw&&!S.done&&UI.cwAuto!==S.id&&G.day<=S.day+1&&UI.sheet==null&&!UI.cast&&!UI.meet&&!UI.menu&&!UI.cfm){ UI.cwAuto=S.id; UI.cw={}; } return !!UI.cw&&!UI.menu; }
Object.assign(A,{
  cwOpen(){ if(!G.cwS){ toast('함께 본 경기가 없습니다.'); return; } closeSheets(); UI.cw={}; UI.cwAuto=G.cwS.id; renderSheet(); },
  cwClose(v,el,e){ if(el&&el.classList.contains('scrim')&&e&&e.target.closest('[data-stop]'))return; UI.cw=null; save(); renderSheet(); render(); },
  cwSugg(v){ const S=G.cwS; if(!S)return; if(v==='fire'){ const m=G.mgr[G.user]; UI.cfm={k:'cwSuggGo',v,doc:{subj:`${m?m.name:''} 감독 교체 건의`,kind:'감독',lines:['구단주가 승인하면 그 자리에서 바로 경질됩니다(되돌릴 수 없음).','승인되면 구단주가 잔여 연봉의 절반을 지원합니다.','반려되면 구단주 신뢰 -2, 건의 소문에 감독 관계 -5.'],warn:'그래도 건의하려면 결재하세요.',noMail:true}}; cfmRender(); return; } A.cwSuggGo(v); },
  cwSuggGo(v){ const r=cwSuggest(v); if(r)toast(r); save(); renderSheet(); },
  cwSkip(){ cwSkipSugg(); save(); renderSheet(); }
});
