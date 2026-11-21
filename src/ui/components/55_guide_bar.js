/* ---------- 첫 시즌 가이드(UI 3단계 3-7, 사용자 11-17 '첫 시즌 안내') ----------
   1) 홈 첫 카드 '이번 시즌 할 일'(homeStartPanel) 한 곳에 지금 단계(시즌 준비 → 정규시즌 → 포스트시즌 → 스토브리그)의 할 일을 모은다.
      지금 할 일 하나는 왜 하는지 한 줄과 '하기'(그 화면으로)·'비서에게 맡기기'(반복 업무 위임, 72_delegate.js handOff)를 펼쳐 보인다.
   2) 카드의 '하기'로 간 화면 맨 위에 한 줄 띠(이 화면에서 할 일 · 다음 ›)를 둔다. 덮개·결재창이 아니고 진행을 막지 않는다.
   3) 단계가 바뀌는 때(개막·드래프트 준비·연봉 협상)에 비서가 소식 한 통을 보낸다. 소식의 '위임하기' 버튼으로 그 업무를 맡길 수 있다(m.auto).
   4) '쉬운 진행': 맡길 수 있는 반복 업무를 한 번에 비서·팀장에게(autoAll). 새 게임 화면과 이 카드에서 켠다. 큰 결정(드래프트·FA·외국인 영입)은 계속 단장이 한다.
   5) 경험자를 붙잡지 않는다: 카드 '숨기기'·설정 '첫 시즌 안내'로 끄고(G.cfg.guideOff), 첫 시즌의 스토브리그(다음 해 캠프 전)가 끝나면 저절로 꺼진다. 홍보·카페 안내는 넣지 않는다. */
const GUIDE_HINT={mgr:'감독 후보를 비교하고 한 명을 고릅니다.',foreign:'외국인 3명과 아시아쿼터 1명을 채웁니다.',med:'부상 방지 단계와 병원 제휴를 정합니다.',dev:'훈련 방향과 해외 연수를 확인합니다.',scout:'빈 지역에 스카우트를 배치합니다.',lineup:'감독이 정한 배치를 확인합니다.',camp:'1차·2차 캠프 장소를 고릅니다.'};
const GUIDE_PH={pre:'시즌 준비',season:'정규시즌',post:'포스트시즌',off:'스토브리그'};
/* 첫 시즌 해: 창단 드래프트는 G.startY, 단장 취임은 새 게임 때 G.guideY. 둘 다 없는 예전 저장은 첫해 업무 안내가 진행 중일 때만 그해 */
function guideY(){ if(!G)return null; if(G.startY!=null)return G.startY; if(G.guideY==null)G.guideY=G.tut&&!G.tut.done?G.year:-1; return G.guideY; }
function guidePhase(){ const y=guideY(); if(y==null||y<0||!G.cal)return null; if(G.year===y)return period(); if(G.year===y+1&&G.day<G.cal.camp)return 'off'; return null; } /* 1월 연봉 확정까지는 첫 스토브리그 */
function guideOn(){ return !!(G&&!G.unemp&&!(G.cfg&&G.cfg.guideOff)&&G.tut&&G.cal&&guidePhase()); }
const guideAuto=k=>typeof autoOn==='function'&&autoOn(k);
const guideEasy=()=>typeof AUTO_AREAS!=='undefined'&&AUTO_AREAS.filter(([k])=>!AUTO_OPTIN.has(k)).every(([k])=>guideAuto(k));
/* 지금 단계의 할 일(홈 카드와 띠가 같이 쓴다). k·t(제목)·why(왜, 한 줄)·ok(끝)·go(하기)·prog(진행 정도·마감)·deleg(맡길 수 있는 권한) */
function guideItems(){ const ph=guidePhase(); let L=[];
  if(ph==='pre'||ph==null){ try{ L=TUT.filter(s=>s.k!=='welcome'&&s.k!=='go').map(s=>({k:s.k,t:s.title,why:GUIDE_HINT[s.k]||'',ok:!!s.check(),go:s.go,prog:s.prog?s.prog():''})); }catch(e){ return []; }
    try{ const P=G.scp&&G.scp.t&&G.scp.t[G.user]; L.push({k:'camp',t:'스프링캠프 계획',why:GUIDE_HINT.camp,ok:!!(P&&P.s1&&P.s2),go:['go','staff:sc'],prog:P&&P.s1&&P.s2?'':'1차·2차 장소'}); }catch(e){}
    for(const x of L)if(x.k==='scout'&&!x.ok)x.deleg=['scout']; return L; }
  const c=G.cal, C=G.contract, gy=guideY(), d=G.day;
  if(ph==='season'){ const dr=(G.dlog&&G.dlog[G.year])||(G.draft&&G.draft.done&&G.draft.y===G.year);
    L=[{k:'ev',t:'결정·요청에 답하기',why:'감독·선수 요청과 결정은 소식함으로 옵니다. 답하지 않으면 기한이 지나 기본안으로 정해집니다.',ok:(guideAuto('ev')&&guideAuto('mgr'))||d>=c.open+21,go:['tab','inbox'],deleg:['ev','mgr']},
       {k:'trade',t:'트레이드 마감 전 보강',why:'7월 31일이 지나면 시즌이 끝날 때까지 트레이드를 할 수 없습니다.',ok:d>KD(7,31),go:['goWork','트레이드'],prog:'7월 31일까지',deleg:['tro']},
       {k:'fdl',t:'외국인 교체 마감',why:'다쳤거나 부진한 외국인은 8월 15일 마감 전에 바꿉니다.',ok:d>KD(8,15),go:['goWork','외국인선수'],prog:'8월 15일까지'},
       {k:'draft',t:'신인 드래프트',why:'지명은 단장이 직접 합니다. 스카우트 배치를 팀장에게 맡기면 후보 보고가 알아서 쌓입니다.',ok:!!dr||d>c.draft+3,go:['goWork','신인드래프트'],prog:dmd(c.draft),deleg:['scout']}]; }
  else if(ph==='post'){ const inPs=!!(G.ps&&(G.ps.seeds||G.ps.teams||[]).some(x=>(x&&x.tid!=null?x.tid:x)===G.user));
    L=[{k:'ps',t:inPs?'포스트시즌 치르기':'포스트시즌 지켜보기',why:inPs?'진행하기로 한 경기씩 치릅니다. 엔트리와 기용은 감독이 정합니다.':'다른 구단의 가을 야구가 끝나면 스토브리그가 시작됩니다.',ok:!!(G.ps&&G.ps.done),go:['goWork','순위']},
       {k:'review',t:'시즌 결산 보기',why:'구단주 목표와 재정 결과를 확인하고 다음 시즌 보강 방향을 잡습니다.',ok:!!(G.tutFlags&&G.tutFlags.review),go:['goWork','시즌결산']}]; }
  else if(ph==='off'){ const Cy=C&&(C.y===gy||C.y==null)?C:null, fp=Cy&&typeof fRePending==='function'?fRePending().length:1;
    L=[{k:'fa',t:'FA 시장',why:'FA 영입과 우리 FA 잔류 협상은 단장이 직접 합니다. 관심 없는 선수는 지나쳐도 됩니다.',ok:G.year>gy||!!(G.fa&&G.fa.closed)||(!G.fa&&d>=KD(12,1)),go:['goWork','FA시장'],prog:G.fa&&G.fa.openDay&&!G.fa.closed?`${dmd(G.fa.openDay)}부터`:''},
       {k:'fre',t:'외국인 재계약',why:'남길 외국인을 정합니다. 맡기면 운영팀이 기준(WAR·능력)대로 재계약하거나 보류권을 쥔 채 결별합니다.',ok:guideAuto('fre')||!!(Cy&&(Cy.done||!fp)),go:['goWork','연봉협상'],prog:Cy?'':'12월 1일 시작',deleg:['fre']},
       {k:'sal',t:'국내 연봉 협상',why:'1월 5일에 확정됩니다. 맡기면 운영팀이 산정안과 요구액 중간쯤에서 합의합니다.',ok:guideAuto('sal')||!!(Cy&&Cy.done),go:['goWork','연봉협상'],prog:Cy?'1월 5일 확정':'12월 1일 시작',deleg:['sal']}]; }
  for(const x of L)if(x.deleg)x.deleg=x.deleg.filter(k=>!guideAuto(k)); return L; }
function guideRoute(){ try{ return UI.tab+':'+(typeof curSub==='function'?curSub(UI.tab)||'':''); }catch(e){ return UI.tab; } }
/* 홈 카드 아랫줄: 쉬운 진행 켜기·끄기 */ /* 강조(primary) 버튼은 화면당 하나: 홈은 경기 버튼이 맡는다(디자인 점검) */
function guideEasyLine(){ if(typeof AUTO_AREAS==='undefined')return ''; const on=guideEasy(), areas=AUTO_AREAS.filter(([k])=>!AUTO_OPTIN.has(k)), n=areas.filter(([k])=>guideAuto(k)).length;
  return `<div class="hw-easy${on?' on':''}"><span><b>반복 업무 위임</b> · ${on?'켜짐':n?'일부 위임':'꺼짐'}</span><button class="btn small" data-a="easyMode" data-v="${on?'0':'1'}" title="${on?'맡긴 업무를 모두 다시 직접 합니다.':'비서·팀장에게 반복 업무를 맡깁니다.'}">${on?'직접 하기':'모두 맡기기'}</button><details style="flex-basis:100%"><summary>위임 범위 · 주요 결정은 직접</summary><div>드래프트·FA·외국인 영입·트레이드 협상은 직접</div><div>${areas.map(([,label])=>esc(label)).join(' · ')}</div><div>설정 › 권한에서 개별 업무를 바꿀 수 있습니다. ‘직접 하기’를 누르면 맡긴 업무를 모두 가져옵니다.</div></details></div>`; }
/* '하기'로 간 화면 맨 위 한 줄 띠 */
function guideBar(){ const g=UI.guide; if(!g||!guideOn()||UI.sheet!=null||UI.person||UI.teamSh!=null)return ''; if(typeof draftFocusOn==='function'&&draftFocusOn())return ''; /* 드래프트 집중 모드(카페 11-19) */ if(g.route!==guideRoute())return '';
  const L=guideItems(), x=L.find(i=>i.k===g.k); if(!x)return ''; const next=L.find(i=>!i.ok&&i.k!==x.k);
  return `<div class="guide-bar" role="status" aria-label="이번 시즌 할 일"><b>이번 시즌 할 일</b><span>${x.ok?`<i class="good">✓</i> ${esc(x.t)} 끝`:`${esc(x.t)} · ${esc(x.why||'')}`}</span>${next?`<button type="button" class="btn text" data-a="guideGo" data-v="${esc(next.k)}">다음: ${esc(next.t)} ›</button>`:`<button type="button" class="btn text" data-a="tab" data-v="home">홈으로 ›</button>`}<button type="button" class="guide-x" data-a="guideClose" aria-label="안내 닫기">×</button></div>`; }
function guideMount(){ if(typeof document==='undefined')return; document.querySelectorAll('#app .guide-bar').forEach(e=>e.remove()); const h=guideBar(); if(!h)return; const main=document.querySelector('#app main.content'); if(!main)return; main.insertAdjacentHTML('afterbegin',h); }
/* 비서 소식: 단계가 바뀌는 때 한 번씩(첫 시즌, 안내를 켰을 때만). m.auto로 소식함의 '위임하기' 버튼이 붙는다(72_delegate.js mailDelegOpts) */
const GUIDE_MAIL=[
  {k:'season',when:()=>guidePhase()==='season',subj:'정규시즌은 이렇게 보내시면 됩니다',auto:['ev','mgr','tro'],body:()=>`개막했습니다. 시즌 중 단장님 일은 세 가지입니다.\n\n1. 소식함의 결정·요청에 답합니다. 답하지 않으면 기한이 지나 기본안으로 정해집니다. 매번 고르기 번거로우시면 아래 '위임하기'로 저에게 맡겨 주세요. 감독 갈등·징계 같은 큰 결정은 계속 여쭙니다.\n2. 마감을 챙깁니다. 트레이드는 7월 31일, 외국인 교체는 8월 15일, 신인 드래프트는 ${dmd(G.cal.draft)}입니다.\n3. 나머지는 '진행하기'로 넘기시면 됩니다. 주전 기용과 타순은 감독 권한입니다.\n\n홈 '이번 시즌 할 일'에 지금 할 일을 정리해 두었습니다.`},
  {k:'draft',when:()=>guidePhase()==='season'&&G.day>=G.cal.draft-24,subj:'신인 드래프트 준비',auto:['scout'],body:()=>`${dmd(G.cal.draft)}에 신인 지명 회의가 열립니다. 지명은 단장님이 직접 하십니다.\n\n후보를 알려면 스카우트가 고교·대학 현장을 다녀야 합니다. 배치와 주말 출장이 어려우시면 스카우트팀장에게 맡겨 주세요. 시기에 맞춰 배치를 바꾸고 현장 보고만 올립니다.`},
  {k:'off',when:()=>guidePhase()==='off'&&!!G.contract&&!G.contract.done,subj:'연봉 협상과 재계약은 맡기셔도 됩니다',auto:['sal','fre'],body:()=>`스토브리그 일정입니다. FA 영입은 단장님이 직접 하시고, 아래 두 가지는 맡기실 수 있습니다.\n\n· 국내 연봉 협상: 1월 5일에 확정됩니다. 맡기시면 운영팀이 산정안과 요구액 중간쯤에서 합의합니다.\n· 외국인 재계약: 맡기시면 운영팀이 성적이 괜찮은 선수만 잡고 나머지는 보류권을 쥔 채 결별합니다.\n\n직접 하시면 더 아낄 수 있지만, 처음이시면 맡기셔도 시즌 운영에 지장이 없습니다.`}];
function guideMailTick(){ if(!guideOn()||G.fdWait||(G.fd&&!G.fd.done))return; const S=G.guideMail=G.guideMail||{};
  for(const x of GUIDE_MAIL){ if(S[x.k]||!x.when())continue; S[x.k]=G.day; const need=x.auto.filter(k=>!guideAuto(k)); if(!need.length)continue;
    const m=mail(`비서 ${SEC}`,x.subj,x.body(),{kind:'업무',face:'sec',acts:guideEasy()?[]:[{l:'반복 업무 모두 맡기기',a:'easyMode',v:'1'}]}); m.auto=need; } }
/* 설정 카드 */
/* 생일 알림(구단주 11-19 생년월일): 소식함 위 줄에 우리 선수 생일을 보일지. 화면 표시만 바꾼다(G.cfg.bdayOff) */
function bdayCfgCard(){ const off=!!(G.cfg&&G.cfg.bdayOff); return `<section class="card"><h2 class="sec">선수 생일 알림</h2><div class="chips">${[['0','보기'],['1','숨기기']].map(([v,l])=>`<button data-a="bdayOff" data-v="${v}" class="${(off?'1':'0')===v?'on':''}">${l}</button>`).join('')}</div><p class="small muted">우리 구단 선수의 생일이면 소식함 위 줄에 짧게 알려 줍니다(지난 사흘 안). 경기·성장에는 영향이 없습니다.</p></section>`; }
function guideCfgCard(){ const off=!!(G.cfg&&G.cfg.guideOff); return `<section class="card"><h2 class="sec">첫 시즌 안내</h2><div class="chips">${[['0','보기'],['1','숨기기']].map(([v,l])=>`<button data-a="guideOff" data-v="${v}" class="${(off?'1':'0')===v?'on':''}">${l}</button>`).join('')}</div><p class="small muted">홈 맨 위 '이번 시즌 할 일' 카드, 할 일 화면의 안내 띠, 단계마다 오는 비서 안내 소식을 보이거나 숨깁니다. 첫 시즌의 스토브리그가 끝나면 저절로 꺼집니다.</p></section>`; }
Object.assign(A,{
  guideGo(v){ const x=guideItems().find(i=>i.k===v); if(!x||!x.go)return; if(x.k==='review'){ G.tutFlags=G.tutFlags||{}; G.tutFlags.review=true; } UI.guide={k:x.k}; A[x.go[0]]?.(x.go[1]); UI.guide={k:x.k,route:guideRoute()}; render(); },
  guideDeleg(v){ const x=guideItems().find(i=>i.k===v); if(!x||!x.deleg||!x.deleg.length)return; const L=x.deleg.map(k=>handOff(k)); toast(L.length>1?`${x.t}: ${x.deleg.length}가지 업무를 맡겼습니다. 설정 · 권한에서 다시 가져올 수 있습니다.`:L[0]); save(); render(); },
  easyMode(v){ const on=v==='1'; autoAll(on); toast(on?'반복 업무를 비서·팀장에게 맡겼습니다. 설정 › 권한에서 바꿀 수 있습니다.':'맡긴 업무를 모두 다시 직접 합니다.'); save(); render(); },
  guideClose(){ UI.guide=null; render(); },
  bdayOff(v){ G.cfg=G.cfg||{}; G.cfg.bdayOff=v==='1'; save(); render(); },
  guideOff(v){ G.cfg=G.cfg||{}; G.cfg.guideOff=v==='1'; if(G.cfg.guideOff)UI.guide=null; save(); render(); },
});
