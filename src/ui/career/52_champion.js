/* ---------- 우승 순간 카드(홈 맨 위). 확인을 누를 때까지 남는다 ---------- */
function trophySvg(){ return `<svg class="trophy" viewBox="0 0 64 64" aria-hidden="true"><path d="M20 8h24v10c0 9-5 16-12 16S20 27 20 18z" fill="#f2c14e"/><path d="M20 12H10c0 9 5 13 11 13M44 12h10c0 9-5 13-11 13" fill="none" stroke="#f2c14e" stroke-width="3"/><rect x="29" y="33" width="6" height="11" fill="#d9a630"/><rect x="21" y="44" width="22" height="6" rx="1" fill="#d9a630"/><rect x="17" y="50" width="30" height="6" rx="1" fill="#b8871f"/></svg>`; }
function champHomeCard(){ const c=G.champNew; if(!c||c.seen||G.unemp||(c.tid!=null&&c.tid!==G.user))return ''; const t=team(G.user); const ev=(G.evs||[]).find(e=>e.k==='champGift'&&!e.done);
  const heads=(G.news||[]).filter(n=>n.d>=G.day-5&&(n.v||0)>=3).slice(0,3);
  const FAN=['평생 응원한 보람이 있다 오늘은 그냥 울자','단장님 그동안 욕해서 죄송합니다','퍼레이드 어디서 하냐 연차 쓴다','이 멤버 그대로 내년에도 가자','MVP 유니폼 품절이다 벌써'];
  const fans=FAN.map((x,i)=>[x,hn('cf'+c.y+i,G.user)]).sort((a,b)=>a[1]-b[1]).slice(0,3).map(x=>x[0]);
  sceneProbe(); const ban=SCENE_OK===true?champPic('banner',c.y):''; /* 배너·장면 사진은 사이트에서만(한 파일 앱은 예전 카드) */
  return `<section class="card champ${ban?' ch16':''}"><div class="ch-top"${ban?` style="background-image:linear-gradient(90deg,rgba(6,9,14,.92),rgba(6,9,14,.68) 55%,rgba(6,9,14,.1) 88%),url('${ban}')"`:''}>${trophyImg(112)}<div><div class="eyebrow">${c.y} 한국시리즈</div><h2>${esc(tname(G.user))} 우승</h2><p class="ch-tag">${esc(c.tag)}${c.ks?` · ${esc(tshort(c.opp))}에 ${c.ks[0]}승 ${c.ks[1]}패`:''}</p></div></div>
    ${c.mvp?`<button class="ch-mvp" data-a="player" data-v="${c.mvp.id}">${G.players[c.mvp.id]?avImg(G.players[c.mvp.id]):''}<span><i>시리즈 최우수선수</i><b>${esc(c.mvp.n)}</b><em>${esc(c.mvp.line)}</em></span></button>`:''}
    ${heads.length?`<div class="ch-news">${heads.map(n=>`<div><span class="pill">${esc(n.o||'')}</span> ${esc(n.t||'')}</div>`).join('')}</div>`:''}
    <div class="ch-fans"><span class="eyebrow">팬 커뮤니티</span>${fans.map(x=>`<p>"${esc(x)}"</p>`).join('')}</div>
    <p class="small">선수단 기분이 크게 올랐고(+8), 팬 여론 크게 호전 · 언론 논조 크게 호전 · 구단주 신뢰 상승. 구단 인기가 올라 다음 시즌 관중·유니폼·굿즈 판매가 늘고, 우승 기록은 몇 년 동안 구단 명성을 끌어올려 FA와 스태프가 우리 구단을 더 원하게 됩니다. 사흘 뒤 도심 퍼레이드, 다음 시즌 홈 개막전에는 우승 반지 수여식이 열립니다.</p>
    <div class="btns">${ev?`<button class="btn primary" data-a="openMail" data-v="${ev.mid||''}">구단주 포상 고르기</button>`:''}${ban?`<button class="btn" data-a="champMoment" data-v="${c.y}">우승 순간 다시 보기</button>`:''}<button class="btn" data-a="champSeen">확인</button></div></section>`; }
/* ---------- 우승 순간(v16 사진, 11-09): A 마지막 아웃 → B 시상식 → C 라커룸 파티 → D 퍼레이드. 시즌마다 정해진 한 장씩.
   사진은 사이트에서만 받는다(SCENE_OK). 한 파일 앱에서는 열지 않고, 사진 하나가 안 받아지면 그 자리만 숨긴다 ---------- */
const CH16S={moment:['moment_01_final_out','moment_02_battery_hug','moment_03_dugout_rush','moment_04_stands_confetti','moment_05_day_mound','moment_06_day_dugout'],
  ceremony:['ceremony_01_lift','ceremony_02_captain_kiss','ceremony_03_manager_toss','ceremony_04_team_photo'],party:['party_01_champagne','party_02_goggles','party_03_front_office'],
  parade:['parade_01_open_bus','parade_02_city_square','parade_03_confetti'],banner:['banner_01','banner_02','banner_03']};
/* 끝내기 우승: 마운드·배터리 장면 대신 더그아웃에서 쏟아져 나오는 장면과 관중석 장면만 쓴다(카페 11-11 안토) */
const CH16WO=['moment_03_dugout_rush','moment_04_stands_confetti','moment_06_day_dugout'];
const champWo=y=>!!(G.champWo&&G.champWo[y]);
const champPic=(g,y)=>{ const L=g==='moment'&&champWo(y)?CH16WO:CH16S[g]; return `assets/v16/champ/${g}/${L[Math.abs(y|0)%L.length]}.webp`; };
const CM_STEP=[['moment','마지막 아웃','마지막 아웃이 잡히자 선수들이 마운드로 달려 나왔습니다.'],['ceremony','시상식','우승 트로피를 높이 들어 올렸습니다.'],
  ['party','라커룸','라커룸이 샴페인과 함성으로 가득 찼습니다.'],['parade','우승 퍼레이드','도심을 가득 메운 팬들과 함께 우승을 축하했습니다.']];
const CM_WO=['moment','끝내기','타석에서 방망이가 결승점을 뽑아낸 순간, 더그아웃의 선수들이 그라운드로 쏟아져 나왔습니다.'];
function champMomentDraw(){ document.getElementById('champMoment')?.remove(); const M=UI.cm; if(!M)return; const [g,h,cap]=M.i===0&&champWo(M.y)?CM_WO:CM_STEP[M.i], last=M.i===CM_STEP.length-1;
  const el=document.createElement('div'); el.id='champMoment'; el.className='champ-moment'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','우승 순간');
  el.innerHTML=`<div class="cm-box"><span class="cm-eye">${M.y} 한국시리즈 우승 · ${esc(tname(G.user))}</span><img src="${champPic(g,M.y)}" width="1600" height="900" alt="${esc(h)}" decoding="async">
    <div class="cm-cap"><b>${esc(h)}</b><p>${esc(cap)}</p></div><div class="cm-nav"><span class="cm-dots">${CM_STEP.map((_,i)=>`<i class="${i===M.i?'on':''}"></i>`).join('')}</span>
    <button class="btn" data-a="champMomClose">닫기</button><button class="btn primary" data-a="champMomNext">${last?'마치기':'다음'}</button></div></div>`;
  el.querySelector('img').onerror=function(){ this.style.display='none'; }; document.body.appendChild(el); }
Object.assign(A,{ champMoment(v){ sceneProbe(); if(SCENE_OK!==true)return; UI.cm={y:+v||G.year,i:0}; champMomentDraw(); },
  champMomNext(){ if(UI.cm&&++UI.cm.i>=CM_STEP.length)UI.cm=null; champMomentDraw(); }, champMomClose(){ UI.cm=null; champMomentDraw(); } });
/* 구단 명성 카드(구단·재정 → 구단주 탭 맨 위) */
function prestigeCard(){ const v=clubPrestige(G.user); const L=G.teams.map(t=>({t:t.id,v:clubPrestige(t.id)})).sort((a,b)=>b.v-a.v); const i=L.findIndex(x=>x.t===G.user); const P=clubPrestigeParts(G.user).filter(x=>x[0]!=='기본'&&Math.abs(x[1])>=.5);
  return `<section class="card"><div class="row between"><h2 class="sec">구단 명성</h2><span class="stars-t big">${starTxt(prestigeStars(v))}</span></div>
    <p class="small">${v}점 · 리그 ${i+1}위 (1위 ${esc(tshort(L[0].t))} ${L[0].v}점) ${hiI('명성이 높을수록 FA·외국인 선수·스카우트와 분석원이 우리 구단을 더 원하고, 스폰서 가치도 오릅니다.')}</p>
    <div class="pres-parts">${P.map(([l,x])=>`<span class="pill ${x>0?'good':'bad'}">${esc(l)} ${x>0?'+':''}${Math.round(x)}</span>`).join('')}</div>
    <p class="small muted">우승은 2년 동안 크게, 그 뒤 10년 동안 조금씩 명성에 남고, 그보다 오래된 우승도 '명문 구단'으로 조금 남습니다. 성적이 나쁘면 해마다 깎입니다.</p></section>`; }
/* 테스트 도구 카드(구단·재정 → 설정) */
function devCard(){ const P=G.ps; const ready=P&&P.seeds&&!P.done&&P.round==='wc'&&!(P.cur&&P.cur.gi>0);
  return `<section class="card"><details class="devd"${UI.devMsg?' open':''}><summary><b>테스트 도구</b> <span class="small muted">개발·점검용</span></summary>
    <p class="small muted tipme">남은 정규시즌을 실제 경기로 끝까지 치르고 가을야구 직전에 멈춥니다. 그사이 결정은 기본값으로 자동 처리됩니다(트레이드 제안 거절, 이벤트 기본 선택 등). 되돌릴 수 없으니 필요하면 먼저 저장 슬롯을 복사해 두세요.</p>
    ${UI.devMsg?`<div class="note">${esc(UI.devMsg)}</div>`:''}
    <div class="btns"><button class="btn" data-a="devPS" ${ready?'disabled':''}>가을야구 직전으로 이동</button><button class="btn" data-a="devSeed" ${ready&&G.ps.seeds[0]!==G.user?'':'disabled'} title="순위표는 그대로 두고 가을야구 대진만 바꿉니다">우리 구단 1번 시드로(테스트)</button></div></details></section>`; }
