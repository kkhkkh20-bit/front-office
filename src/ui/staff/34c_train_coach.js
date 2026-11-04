/* 훈련 > 코치 배정(FM '훈련 - 코치진'처럼): 훈련 항목마다 지도하는 코치·그 항목 지도 능력(별)·
   그 항목에 집중하는 선수·코치 부담을 한 장씩. 선수 집중 항목은 trnPlan(p)(76_dev_plan.js), 담당 코치는 TRN의 c 역할 */
const TC_GROUPS=[['타격',[['con','B','bc'],['pow','B','bc'],['eye','B','bc']]],['투구',[['stf','P','pc'],['ctl','P','cc'],['sta','P','pc']]],['수비·주루',[['def','B','dc'],['spd','B','rc'],['cat','C','cc']]],['2군',[['f:B','F','fb'],['f:P','F','fp'],['f:all','F','fm']]]];
const tcStars=v=>{ const n=clamp(Math.round((v-20)/12),0,5); return `<span class="tc-st" title="지도 능력 ${Math.round(v)}">${'★'.repeat(n)}<i>${'★'.repeat(5-n)}</i></span>`; };
function trainCoachView(){ const C=coachesOf(G.user), ps=playersOf(G.user).filter(p=>!p.ys), on=ps.filter(p=>p.e1), off=ps.filter(p=>!p.e1);
  const who=(k,g)=>g==='C'?on.filter(p=>p.pos==='C'):g==='F'?off.filter(p=>k==='f:all'||(k==='f:P')===!!p.isP):on.filter(p=>(g==='P')===!!p.isP&&trnPlan(p)===k);
  const load={}; for(const [,L] of TC_GROUPS)for(const [k,g,r] of L)load[r]=(load[r]||0)+(r==='fm'?0:who(k,g).length);
  const card=([k,g,r])=>{ const c=C[r], L=who(k,g), lab=g==='F'?{'f:B':'2군 타격','f:P':'2군 투구','f:all':'2군 전체 육성'}[k]:CAB[k].replace(' 지도',''), ab=c?(g==='F'?effC(c,G.user,'dv'):cAb(c)[k]):null;
    const ld=r==='fm'?L.length:load[r], lv=r==='fm'?(ld<=20?0:ld<=30?1:2):(ld<=6?0:ld<=12?1:2);
    return `<section class="tc-card${c?'':' miss'}"><div class="tc-h"><b>${lab}</b>${c?tcStars(ab):'<span class="pill warn">담당 없음</span>'}</div>
      <div class="tc-ppl" title="${g==='F'?'2군 선수':'이 항목에 집중하는 선수'} ${L.length}명">${L.slice(0,14).map(p=>`<i class="${p.isP?'p':'b'}"></i>`).join('')}${L.length>14?`<em>+${L.length-14}</em>`:''}${L.length?'':'<em>집중하는 선수 없음</em>'}</div>
      <p>${c?`<button class="lnk" data-a="sfCoach" data-v="${r}">${esc(c.name)}</button> (${CROLE[r].l})이(가) 훈련을 지도합니다`:`${CROLE[r].l} 자리가 비어 기본 훈련만 합니다 <button class="btn small" data-a="smkGo" data-v="coach">채용</button>`}</p>
      <div class="tc-f"><span>코치 부담</span><b class="${['good','warn','bad'][lv]}">● ${['적음','보통','많음'][lv]}</b><span class="muted">${g==='F'?`2군 ${L.length}명`:`${L.length}명 집중`}</span></div>
      ${L.length?`<table class="tc-t"><tbody>${[...L].sort((a,b)=>g==='F'?ovr(b)-ovr(a):0).slice(0,12).map(p=>{ const v=g==='F'?ovr(p):g==='C'?defAt(p,'C'):p.r[k]; return `<tr><td><button class="lnk" data-a="player" data-v="${p.id}">${esc(p.name)}</button></td><td class="muted">${esc(posLabel(p))} · ${p.age}세</td><td>${g==='F'?'종합 ':g==='C'?'포수 수비 ':''}<b style="color:${rcol(v)}">${dv(v)}</b></td></tr>`; }).join('')}</tbody></table>`:''}</section>`; };
  const nC=CKEYS.filter(k=>C[k]).length;
  return `<div class="tc ws-own"><section class="tc-top"><div><span class="small muted">코치진</span><h2>코치 ${nC}/${CKEYS.length}명</h2></div><div class="sf-dots">${CKEYS.map(k=>`<i style="background:${C[k]?rcol(effC(C[k],G.user,'sk')):'transparent'}" class="${C[k]?'':'emp'}" title="${CROLE[k].l}${C[k]?' '+esc(C[k].name):' 빈자리'}"></i>`).join('')}</div>
    <p class="small muted">선수마다 집중 항목 하나를 정하면 그 항목 담당 코치가 지도합니다. 코치 한 명이 맡는 선수가 많을수록 효과가 나뉩니다. 집중 항목은 선수 정보의 훈련 탭이나 '육성' 탭에서 바꿉니다.</p>
    <div class="tc-btns"><button class="btn small" data-a="go" data-v="staff:coach">스태프 개요</button><button class="btn small" data-a="itab" data-v="mg_staff_train:dev">선수별 훈련 방향</button></div></section>
    <div class="tc-groups">${TC_GROUPS.map(([t,L])=>`<div class="tc-g"><h3>${t}</h3>${L.map(card).join('')}</div>`).join('')}</div></div>`; }
