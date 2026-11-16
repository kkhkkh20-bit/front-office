/* ---------- 첫 시즌 가이드 틀(UI 3단계 3-7) ----------
   1) 홈 첫 카드 '이번 시즌 할 일'(homeStartPanel) 한 곳에 할 일을 모은다.
   2) 카드의 '하기'로 간 화면 맨 위에 한 줄 띠(이 화면에서 할 일 · 다음 ›)를 둔다. 덮개·결재창이 아니고 진행을 막지 않는다.
   3) 더 긴 설명은 화면 '?' 시트에 둔다(1단계 원칙). 홍보·카페 안내는 이 틀에 넣지 않는다.
   4) 설정 '첫 시즌 안내'와 카드의 '숨기기'로 끌 수 있다(G.cfg.guideOff). */
const GUIDE_HINT={mgr:'감독 후보를 비교하고 한 명을 고릅니다.',foreign:'외국인 3명과 아시아쿼터 1명을 채웁니다.',med:'부상 방지 단계와 병원 제휴를 정합니다.',dev:'훈련 방향과 해외 연수를 확인합니다.',scout:'빈 지역에 스카우트를 배치합니다.',lineup:'감독이 정한 배치를 확인합니다.',camp:'1차·2차 캠프 장소를 고릅니다.'};
function guideOn(){ return !!(G&&!G.unemp&&!(G.cfg&&G.cfg.guideOff)&&G.tut&&G.cal&&G.day<G.cal.open&&G.year===(G.startY??G.year)); }
/* 첫 시즌 할 일 목록(홈 카드와 띠가 같이 쓴다) */
function guideItems(){ let L=[]; try{ L=TUT.filter(s=>s.k!=='welcome'&&s.k!=='go').map(s=>({k:s.k,t:s.title,ok:!!s.check(),go:s.go,prog:s.prog?s.prog():''})); }catch(e){ return []; }
  try{ const P=G.scp&&G.scp.t&&G.scp.t[G.user]; L.push({k:'camp',t:'스프링캠프 계획',ok:!!(P&&P.s1&&P.s2),go:['go','staff:sc'],prog:P&&P.s1&&P.s2?'':'1차·2차 장소'}); }catch(e){}
  return L; }
function guideRoute(){ try{ return UI.tab+':'+(typeof curSub==='function'?curSub(UI.tab)||'':''); }catch(e){ return UI.tab; } }
/* '하기'로 간 화면 맨 위 한 줄 띠 */
function guideBar(){ const g=UI.guide; if(!g||!guideOn()||UI.sheet!=null||UI.person||UI.teamSh!=null)return ''; if(g.route!==guideRoute())return '';
  const L=guideItems(), x=L.find(i=>i.k===g.k); if(!x)return ''; const next=L.find(i=>!i.ok&&i.k!==x.k);
  return `<div class="guide-bar" role="status" aria-label="이번 시즌 할 일"><b>이번 시즌 할 일</b><span>${x.ok?`<i class="good">✓</i> ${esc(x.t)} 끝`:`${esc(x.t)} · ${esc(GUIDE_HINT[x.k]||'')}`}</span>${next?`<button type="button" class="btn text" data-a="guideGo" data-v="${esc(next.k)}">다음: ${esc(next.t)} ›</button>`:`<button type="button" class="btn text" data-a="tab" data-v="home">홈으로 ›</button>`}<button type="button" class="guide-x" data-a="guideClose" aria-label="안내 닫기">×</button></div>`; }
function guideMount(){ if(typeof document==='undefined')return; document.querySelectorAll('#app .guide-bar').forEach(e=>e.remove()); const h=guideBar(); if(!h)return; const main=document.querySelector('#app main.content'); if(!main)return; main.insertAdjacentHTML('afterbegin',h); }
/* 설정 카드 */
function guideCfgCard(){ const off=!!(G.cfg&&G.cfg.guideOff); return `<section class="card"><h2 class="sec">첫 시즌 안내</h2><div class="chips">${[['0','보기'],['1','숨기기']].map(([v,l])=>`<button data-a="guideOff" data-v="${v}" class="${(off?'1':'0')===v?'on':''}">${l}</button>`).join('')}</div><p class="small muted">홈 맨 위 '이번 시즌 할 일' 카드와 할 일 화면의 안내 띠를 보이거나 숨깁니다.</p></section>`; }
Object.assign(A,{
  guideGo(v){ const x=guideItems().find(i=>i.k===v); if(!x||!x.go)return; UI.guide={k:x.k}; A[x.go[0]]?.(x.go[1]); UI.guide={k:x.k,route:guideRoute()}; render(); },
  guideClose(){ UI.guide=null; render(); },
  guideOff(v){ G.cfg=G.cfg||{}; G.cfg.guideOff=v==='1'; if(G.cfg.guideOff)UI.guide=null; save(); render(); },
});
