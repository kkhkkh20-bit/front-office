/* ---------- 단장 프로필: 새 게임에서 이름·나이·출신·얼굴을 정하고, 사이드바 '단장 프로필'에서 본다 ---------- */
function gpDefault(){ let n='김단장'; try{ n=genName(); }catch(e){} return {name:n,age:42,bg:'corp',female:false,face:'gm'+Math.floor(Math.random()*1e6)}; }
function meAv(){ const P=(G&&G.gmP)||UI.gp||{}; return {persona:'staff',pid:P.face||'gm0',age:P.age||42,female:!!P.female,name:P.name||'단장',mod:P.mod||null}; }
/* 얼굴 꾸미기: 후보 12개 중에서 고르고, 부위(머리·머리색·수염·안경·표정)를 하나씩 바꾼다 */
const GP_PART={hair:{l:'머리',m:['short','short2','short3','crop','crop-fade','crop-fade2','short-fade','short-fade-2','middle-part','parted','messy','messy-short','spike','spike2','juice','high','tall-fade','faux-hawk','shortBangs','short-bald','curly','curly2','afro'],f:['female1','female2','female3','female4','female5','female6','female7','female8','female9','female10','female11','female12','longHair','shortBangs','middle-part','parted']},
  hc:{l:'머리색',m:['#1a1a1a','#2b1d14','#4a3121','#6b4a2b','#8a6a43','#6e6e6e','#a7a7a7','#d0d0d0']},
  fh:{l:'수염',m:['mustache-thin','mustache1','soul','goatee-thin','goatee1','fullgoatee','chin-strap','beard1','beard2','beard3','none'],f:['none']},
  gl:{l:'안경',m:['glasses2-black','glasses1-secondary','glasses2-secondary','none']},
  mouth:{l:'표정',m:['smile-closed','smile','smile2','closed','straight','side']}};
function gpPartList(k,g){ const P=GP_PART[k]; return (g.female&&P.f)?P.f:P.m; }
function gpSync(){ const g=UI.gp=UI.gp||gpDefault(); const n=document.getElementById('gp-name'), a=document.getElementById('gp-age'); if(n)g.name=n.value.trim().slice(0,10); if(a)g.age=+a.value||g.age; return g; }
function gpForm(go,goL){ const g=UI.gp=UI.gp||gpDefault(); const av={persona:'staff',pid:g.face,age:g.age,female:g.female,name:g.name,mod:g.mod||null}; const M=g.mod||{};
  const seeds=UI.gpSeeds&&UI.gpSeeds.f===!!g.female?UI.gpSeeds.L:(UI.gpSeeds={f:!!g.female,L:Array.from({length:12},()=>'gm'+Math.floor(Math.random()*1e6))}).L;
  const parts=Object.keys(GP_PART).filter(k=>gpPartList(k,g).length>1).map(k=>{ const L=gpPartList(k,g); const i=M[k]!=null?L.indexOf(M[k]):-1; return `<div class="gpp"><span>${GP_PART[k].l}</span><button class="btn small" data-a="gpPart" data-v="${k}:-1" aria-label="이전">◀</button><b>${i<0?'기본':`${i+1}/${L.length}`}</b><button class="btn small" data-a="gpPart" data-v="${k}:1" aria-label="다음">▶</button></div>`; }).join('');
  const ages=[]; for(let a=30;a<=65;a++)ages.push(a);
  return `<div class="gpf"><div class="gpf-face">${avImg(av,true)}<div class="gpps">${parts}</div>${g.mod?'<button class="lnk small" data-a="gpPartReset">꾸민 것 되돌리기</button>':''}</div><div class="gpf-in">
    <label class="small">이름<input id="gp-name" type="text" maxlength="10" value="${esc(g.name||'')}" placeholder="단장 이름" autocomplete="off"></label>
    <label class="small">나이<select id="gp-age">${ages.map(a=>`<option value="${a}" ${a===g.age?'selected':''}>${a}세</option>`).join('')}</select></label>
    <div class="small">성별</div><div class="chips"><button data-a="gpSex" data-v="m" class="${g.female?'':'on'}">남</button><button data-a="gpSex" data-v="f" class="${g.female?'on':''}">여</button></div>
    <div class="small">출신</div><div class="chips">${Object.entries(GM_BG).map(([k,l])=>`<button data-a="gpBg" data-v="${k}" class="${g.bg===k?'on':''}">${l}</button>`).join('')}</div>
    <p class="small muted">이름과 출신은 기사와 경력에 쓰입니다. 능력치 차이는 없습니다. 나이는 해마다 한 살씩 듭니다.</p>
    ${UI.gpMsg?`<div class="note">${esc(UI.gpMsg)}</div>`:''}<button class="btn primary block" data-a="${go}">${goL}</button></div></div>
  <div class="gpg-h"><span class="small">얼굴 후보: 마음에 드는 얼굴을 누르세요</span><button class="btn small" data-a="gpFace">다른 후보 12개</button></div>
  <div class="gpg">${seeds.map(sd=>`<button class="gpg-c${sd===g.face?' on':''}" data-a="gpPick" data-v="${sd}">${avImg({persona:'staff',pid:sd,age:g.age,female:g.female,name:g.name})}</button>`).join('')}</div>`; }
/* 새 게임: 구단을 고르면 단장 정보부터 */
function gpStartView(){ const v=UI.pickT; const d=TEAM_DEF[v];
  return `<div class="gut"><div class="wrap" style="max-width:640px"><button class="lnk tsback" data-a="tsGo" data-v="team">← 구단 다시 고르기</button>
    <h2 class="ts-h">${d?`${badge(v,28)} ${esc(d.city)} ${esc(d.nick)} · `:''}단장 소개</h2><section class="card">${gpForm('gpStart','이 단장으로 시작')}</section></div></div>`; }
/* 사이드바 '단장 프로필' */
function meView(){ const P=G.gmP; let C=G.myC; try{ if(!G.unemp)C=myCInit(); }catch(e){} const nick=meNick(); const age=meAge();
  const head=UI.gpEdit||!P?`<section class="card"><h2 class="sec">${P?'단장 정보 고치기':'단장 정보를 정해 주세요'}</h2>${gpForm('gpSave',P?'저장':'정하기')}${P?'<button class="btn block" data-a="gpEdit" style="margin-top:6px">취소</button>':''}</section>`
    :`<section class="card mehead">${avImg(meAv(),true)}<div class="mehead-t"><div class="eyebrow">${G.unemp?'야인':`${esc(tname(G.user))} 단장`}${C&&C.y0&&!G.unemp?` · ${C.y0}년부터`:''}</div><h2 class="sec">${esc(P.name)} <span class="small muted">${age}세 · ${esc(GM_BG[P.bg]||'')}</span></h2>
      <div class="chips"><span class="pill">명성 ${G.rep??50} · ${esc(repLabel(G.rep??50))}</span>${nick?`<span class="pill acc">별명: ${esc(nick)}</span>`:''}${!G.unemp&&G.user!=null?`<span class="pill">구단주 신뢰 ${team(G.user).trust}</span>`:''}</div></div><button class="btn small" data-a="gpEdit">고치기</button></section>`;
  const card=G.unemp?gmProfileView():gmCardView();
  const stints=G.unemp&&C&&C.stints&&C.stints.length?csec('지난 경력',C.stints.map(x=>`<div class="row between small"><span>${badge(x.tid,16)} ${esc(tshort(x.tid))} · ${x.y0}~${x.y1}</span><span class="muted">${esc(x.how)}</span></div>`).join('')):'';
  const left=C&&C.tid!=null?Math.max(0,C.y1-G.year):0; const mid=period()==='season'||period()==='post'; const pen=(left>0?2:0)+(mid?3:0);
  const quit=G.unemp||G.gameOver||!C||C.tid==null?'':csec('사임',`<p class="small">스스로 물러나면 야인이 됩니다. 시간은 계속 흐르고, 다른 구단이 단장을 바꿀 때 명성을 보고 제의가 옵니다.</p>
    <ul class="small muted"><li>남은 계약 ${left}년 치 연봉은 받지 않습니다(경질과 다릅니다).</li><li>명성 ${pen?`-${pen}`:'변화 없음'}${mid?' (시즌 도중 사임은 -3 더)':''}${left>0?' (계약 기간 중 -2)':''}. 지금 명성 ${G.rep??50}.</li><li>구단은 새 단장(AI)이 맡습니다. 진행 중인 협상·약속은 넘어가지 않습니다.</li></ul>
    ${UI.rsAsk?`<div class="note bad">${esc(tname(G.user))} 단장직에서 물러납니다. 되돌릴 수 없습니다.</div><div class="row"><button class="btn danger" data-a="resignGo">사임합니다</button><button class="btn" data-a="resignAsk">취소</button></div>`:'<button class="btn" data-a="resignAsk">단장직 사임</button>'}`);
  return head+card+stints+quit; }
Object.assign(A,{
  start(v){ UI.pickT=+v; UI.gp=UI.gp||gpDefault(); UI.gpMsg=''; UI.sstep='prof'; render(); window.scrollTo(0,0); },
  gpFace(){ const g=gpSync(); UI.gpSeeds=null; render(); },
  gpPick(v){ const g=gpSync(); g.face=v; delete g.mod; render(); },
  gpPart(v){ const g=gpSync(); const [k,d]=String(v).split(':'); const L=gpPartList(k,g); g.mod=g.mod||{}; const i=g.mod[k]!=null?L.indexOf(g.mod[k]):-1; g.mod[k]=L[((i<0?(+d>0?-1:0):i)+ +d+L.length)%L.length]; render(); },
  gpPartReset(){ const g=gpSync(); delete g.mod; render(); },
  gpSex(v){ const g=gpSync(); g.female=v==='f'; g.face='gm'+Math.floor(Math.random()*1e6); delete g.mod; UI.gpSeeds=null; render(); },
  gpBg(v){ const g=gpSync(); g.bg=v; render(); },
  gpStart(){ const g=gpSync(); if(!g.name||g.name.length<2){ UI.gpMsg='이름을 두 글자 이상 적어 주세요.'; render(); return; } UI.gpMsg=''; const P={...g}; UI.gp=null; A.startGo(UI.pickT); if(G){ G.gmP={...P,y0:G.year}; save(); render(); } },
  gpEdit(){ UI.gpEdit=!UI.gpEdit; if(UI.gpEdit)UI.gp=G.gmP?{...G.gmP,age:meAge()||G.gmP.age}:gpDefault(); UI.gpMsg=''; render(); },
  gpSave(){ const g=gpSync(); if(!g.name||g.name.length<2){ UI.gpMsg='이름을 두 글자 이상 적어 주세요.'; render(); return; } const y0=G.gmP&&G.gmP.y0!=null?G.gmP.y0:G.year; const age=G.gmP?g.age-(G.year-y0):g.age; G.gmP={name:g.name,age:Math.max(25,age),bg:g.bg,female:g.female,face:g.face,mod:g.mod||null,y0}; UI.gp=null; UI.gpEdit=false; UI.gpMsg=''; save(); render(); toast('단장 정보를 저장했습니다.'); },
  resignAsk(){ UI.rsAsk=!UI.rsAsk; render(); },
  resignGo(){ UI.rsAsk=false; const r=resignGM(); if(r){ toast(r); return; } save(); UI.tab='inbox'; UI.mf='all'; UI._ibFirst=true; render(); }
});
