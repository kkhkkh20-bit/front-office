/* ---------- 플레이 통계(익명) ----------
 테스트 배포 때 '단장을 만들고 몇 년 차까지 하는지'를 보기 위한 기록.
 - TELE_GA에 Google Analytics 4 측정 ID(G-XXXX)를 넣어야 켜진다. 비어 있으면 아무것도 보내지 않는다.
 - 이름·얼굴 같은 개인 정보는 보내지 않는다. 기기마다 무작위 익명 번호만 쓴다.
 - 설정 > 게임 설정에서 언제든 끌 수 있다.
 보내는 이벤트: game_start(구단·출신·시작 방식), season_end(몇 년 차, 순위, 우승), gm_out(경질·사임·만료), session(이어하기·진행 일수) */
const TELE_GA=''; /* 예: 'G-ABCD123456' */
function teleOn(){ if(!TELE_GA)return false; const m=meta(); return m.tele!==false; }
function teleUid(){ try{ let u=localStorage.getItem('dsj_uid'); if(!u){ u='u'+Math.random().toString(36).slice(2,10)+Date.now().toString(36); localStorage.setItem('dsj_uid',u); } return u; }catch(e){ return 'anon'; } }
function teleLoad(){ if(window._teleL||!teleOn())return; window._teleL=1; try{ window.dataLayer=window.dataLayer||[]; window.gtag=function(){ dataLayer.push(arguments); }; gtag('js',new Date()); gtag('config',TELE_GA,{user_id:teleUid(),send_page_view:false,cookie_flags:'SameSite=None;Secure'});
  const s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(TELE_GA); s.onerror=()=>{}; document.head.appendChild(s); }catch(e){} }
function teleEv(name,p){ try{ if(!teleOn())return; teleLoad(); const base=G?{gm_year:(G.year-((G.gmP&&G.gmP.y0)||G.startY||G.year))+1,game_year:G.year,team:G.user}:{}; window.gtag&&gtag('event',name,Object.assign(base,p||{})); }catch(e){} }
function teleCard(){ if(!TELE_GA)return ''; const on=teleOn();
  return `<section class="card"><div class="row between"><h2 class="sec">익명 플레이 통계</h2><button class="btn small" data-a="teleTog">${on?'끄기':'켜기'}</button></div><p class="small muted">게임을 다듬기 위해 시작한 구단, 몇 년 차까지 플레이했는지, 시즌 순위 같은 기록을 익명으로 보냅니다. 이름·얼굴·저장 내용은 보내지 않습니다. 지금: <b>${on?'켜짐':'꺼짐'}</b></p></section>`; }
Object.assign(A,{ teleTog(){ const m=meta(); m.tele=!teleOn(); setMeta(m); render(); } });
