/* ---------- 우승 순간 카드(홈 맨 위). 확인을 누를 때까지 남는다 ---------- */
function trophySvg(){ return `<svg class="trophy" viewBox="0 0 64 64" aria-hidden="true"><path d="M20 8h24v10c0 9-5 16-12 16S20 27 20 18z" fill="#f2c14e"/><path d="M20 12H10c0 9 5 13 11 13M44 12h10c0 9-5 13-11 13" fill="none" stroke="#f2c14e" stroke-width="3"/><rect x="29" y="33" width="6" height="11" fill="#d9a630"/><rect x="21" y="44" width="22" height="6" rx="1" fill="#d9a630"/><rect x="17" y="50" width="30" height="6" rx="1" fill="#b8871f"/></svg>`; }
function champHomeCard(){ const c=G.champNew; if(!c||c.seen)return ''; const t=team(G.user); const ev=(G.evs||[]).find(e=>e.k==='champGift'&&!e.done);
  const heads=(G.news||[]).filter(n=>n.d>=G.day-5&&(n.v||0)>=3).slice(0,3);
  const FAN=['평생 응원한 보람이 있다 오늘은 그냥 울자','단장님 그동안 욕해서 죄송합니다','퍼레이드 어디서 하냐 연차 쓴다','이 멤버 그대로 내년에도 가자','MVP 유니폼 품절이다 벌써'];
  const fans=FAN.map((x,i)=>[x,hn('cf'+c.y+i,G.user)]).sort((a,b)=>a[1]-b[1]).slice(0,3).map(x=>x[0]);
  return `<section class="card champ"><div class="ch-top">${trophySvg()}<div><div class="eyebrow">${c.y} 한국시리즈</div><h2>${esc(tname(G.user))} 우승</h2><p class="ch-tag">${esc(c.tag)}${c.ks?` · ${esc(tshort(c.opp))}에 ${c.ks[0]}승 ${c.ks[1]}패`:''}</p></div></div>
    ${c.mvp?`<button class="ch-mvp" data-a="player" data-v="${c.mvp.id}">${G.players[c.mvp.id]?avImg(G.players[c.mvp.id]):''}<span><i>시리즈 최우수선수</i><b>${esc(c.mvp.n)}</b><em>${esc(c.mvp.line)}</em></span></button>`:''}
    ${heads.length?`<div class="ch-news">${heads.map(n=>`<div><span class="pill">${esc(n.o||'')}</span> ${esc(n.t||'')}</div>`).join('')}</div>`:''}
    <div class="ch-fans"><span class="eyebrow">팬 커뮤니티</span>${fans.map(x=>`<p>"${esc(x)}"</p>`).join('')}</div>
    <p class="small">선수단 기분이 크게 올랐고(+8), 팬 여론 +12 · 언론 논조 +8 · 구단주 신뢰 +3. 우승 기록은 몇 년 동안 구단 명성을 끌어올려 FA와 스태프가 우리 구단을 더 원하게 됩니다.</p>
    <div class="btns">${ev?`<button class="btn primary" data-a="openMail" data-v="${ev.mid||''}">구단주 포상 고르기</button>`:''}<button class="btn" data-a="champSeen">확인</button></div></section>`; }
/* 구단 명성 카드(구단·재정 → 구단주 탭 맨 위) */
function prestigeCard(){ const v=clubPrestige(G.user); const L=G.teams.map(t=>({t:t.id,v:clubPrestige(t.id)})).sort((a,b)=>b.v-a.v); const i=L.findIndex(x=>x.t===G.user); const P=clubPrestigeParts(G.user).filter(x=>x[0]!=='기본'&&Math.abs(x[1])>=.5);
  return `<section class="card"><div class="row between"><h2 class="sec">구단 명성</h2><span class="stars-t big">${starTxt(prestigeStars(v))}</span></div>
    <p class="small">${v}점 · 리그 ${i+1}위 (1위 ${esc(tshort(L[0].t))} ${L[0].v}점). 명성이 높을수록 FA·외국인 선수·스카우트와 분석원이 우리 구단을 더 원하고, 스폰서 가치도 오릅니다.</p>
    <div class="pres-parts">${P.map(([l,x])=>`<span class="pill ${x>0?'good':'bad'}">${esc(l)} ${x>0?'+':''}${Math.round(x)}</span>`).join('')}</div>
    <p class="small muted">우승은 2년 동안 크게, 그 뒤 10년 동안 조금씩 명성에 남습니다. 성적이 나쁘면 해마다 깎입니다.</p></section>`; }
