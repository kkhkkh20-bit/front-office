/* 선정 명단과 맞대결 이력은 뉴스에서 다시 찾아볼 수 있는 같은 표로 제공한다. */
function leagueEventsView(){
  const years=Object.keys(G.allStars||{}).map(Number).sort((a,b)=>b-a),y=years.includes(+UI.asgY)?+UI.asgY:years[0];
  const A=y?G.allStars[y]:null;
  const who=x=>`<button class="candidate-name" ${G.players[x.id]?`data-a="player" data-v="${x.id}"`:''}>${G.players[x.id]?avImg(G.players[x.id]):''}<span>${esc(x.name)}</span></button>`;
  const list=(side,L)=>`<section class="card candidate-list"><div class="row between"><h2 class="sec">${side} 올스타</h2><span class="small muted">${L.length}명 · 베스트12와 추천</span></div><div class="tw"><table class="sqt candidate-table"><thead><tr><th>선수</th><th>구단</th><th>역할</th><th>선정</th><th>발표 당시 기록</th></tr></thead><tbody>${L.map(x=>`<tr><td>${who(x)}</td><td>${esc(tshort(x.t))}</td><td>${({SP:'선발',MR:'중간',CP:'마무리',OF:'외야'})[x.slot]||POSS[x.slot]||x.slot}</td><td>${x.starter?'베스트12':'추천'}${/대체/.test(x.reason)?' · 대체':''}</td><td class="candidate-note">${esc(x.line)}</td></tr>`).join('')}</tbody></table></div></section>`;
  const stars=A?`<div class="chips">${years.map(y=>`<button data-a="asgY" data-v="${y}" class="${y===A.y?'on':''}">${y}</button>`).join('')}</div><p class="small muted">${dmd(A.event-2)}~${dmd(A.event+1)} 올스타 휴식기 · 발표 당시 소속·기록입니다. ${A.played?'행사 종료':'행사 예정'}</p><div class="league-event-grid">${['나눔','드림'].map(k=>list(k,A.teams[k]||[])).join('')}</div>${A.withdrawn.length?`<p class="small muted">출전 취소·대체: ${A.withdrawn.map(x=>`${esc(x.name)} → ${G.players[x.replacement]?esc(G.players[x.replacement].name):'대체 선수'}`).join(', ')}</p>`:''}`:'<section class="card"><h2 class="sec">나눔·드림 올스타</h2><p class="small muted">올스타 행사 2주 전에 전반기 실제 기록과 팬·선수 평가를 바탕으로 명단을 발표합니다. 휴식기에는 정규시즌 경기가 없습니다.</p></section>';
  const rivals=Object.values((G.rivalries||{}).pairs||{}).filter(r=>r.label).sort((a,b)=>b.last-a.last);
  return stars+csec('라이벌 맞대결',rivals.length?`<div class="tw"><table class="sqt"><thead><tr><th>이야기</th><th>구단</th><th>경기</th><th>접전</th><th>가을 맞대결</th><th>시작</th></tr></thead><tbody>${rivals.map(r=>`<tr><td><b>${esc(r.label)}</b></td><td>${esc(tshort(r.a))} · ${esc(tshort(r.b))}</td><td>${r.games}</td><td>${r.close}</td><td>${r.post}</td><td>${r.emerged?dstr(r.emerged):'연고지·팬 문화'}</td></tr>`).join('')}</tbody></table></div><p class="small muted">이 게임에서 치른 경기만 집계합니다. 접전은 두 점 차 이내 승부입니다. 라이벌 뉴스는 경기 능력·징계에 영향을 주지 않습니다.</p>`:'<p class="small muted">시즌 맞대결이 쌓이면 여기서 이력을 볼 수 있습니다. 달빛대전·엘롯기 맞대결과 게임 속에서 생긴 새 라이벌을 함께 기록합니다.</p>');
}
function ggVotingView(A){
  if(!A||!A.ggVote||awShown(A,'gg'))return '';
  const V=A.ggVote,start=dnum(A.y,11,25),end=dnum(A.y,12,5),stage=G.day<start?'투표 준비':G.day<=end?'기자단 투표 중':'투표 마감 · 발표 대기';
  return `<section class="card candidate-list"><div class="row between"><h2 class="sec">골든글러브 · ${stage}</h2><span class="small muted">${dmd(start)}~${dmd(end)}</span></div><p class="small muted">WAR·주요 기록·이정표·팀 성적을 함께 보는 가상 기자 ${V.voters}명의 투표입니다. 아래는 유력 후보 전망이며 비공개 득표나 확정 수상자가 아닙니다.</p><div class="tw"><table class="sqt candidate-table"><thead><tr><th>포지션</th><th>유력 후보 전망</th><th>발표 당시 기록</th></tr></thead><tbody>${ggPublicRace(A).map(x=>x.candidates.map(c=>`<tr><td>${x.pos==='P'?'투수':x.pos==='OF'?'외야수':POSS[x.pos]||x.pos}</td><td><button class="lnk" ${G.players[c.id]?`data-a="player" data-v="${c.id}"`:''}>${esc(c.name)}</button> <span class="small muted">${esc(tshort(c.t))}</span>${c.milestones.length?` <span class="pill warn">${esc(c.milestones.join(' · '))}</span>`:''}</td><td class="candidate-note">${esc(c.line)}</td></tr>`).join('')).join('')}</tbody></table></div></section>`;
}
Object.assign(A,{
  leagueEvents(){UI.it=UI.it||{};UI.it.histv='events';A.go('league:hist');},
  asgY(v){UI.asgY=+v;render();}
});
