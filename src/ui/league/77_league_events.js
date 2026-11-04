/* 선정 명단과 맞대결 이력은 뉴스에서 다시 찾아볼 수 있는 같은 표로 제공한다. */
function leagueEventsView(){
  const years=Object.keys(G.allStars||{}).map(Number).sort((a,b)=>b-a),y=years.includes(+UI.asgY)?+UI.asgY:years[0];
  const A=y?G.allStars[y]:null;
  const who=x=>`<button class="candidate-name" ${G.players[x.id]?`data-a="player" data-v="${x.id}"`:''}>${G.players[x.id]?avImg(G.players[x.id]):''}<span>${esc(x.name)}</span></button>`;
  const list=(side,L)=>`<section class="card candidate-list"><div class="row between"><h2 class="sec">${side} 올스타</h2><span class="small muted">${L.length}명 · 베스트12와 추천</span></div><div class="tw"><table class="sqt candidate-table"><thead><tr><th>선수</th><th>구단</th><th>역할</th><th>선정</th><th>발표 당시 기록</th></tr></thead><tbody>${L.map(x=>`<tr><td>${who(x)}</td><td>${esc(tshort(x.t))}</td><td>${({SP:'선발',MR:'중간',CP:'마무리',OF:'외야'})[x.slot]||POSS[x.slot]||x.slot}</td><td>${x.starter?'베스트12':'추천'}${/대체/.test(x.reason)?' · 대체':''}</td><td class="candidate-note">${esc(x.line)}</td></tr>`).join('')}</tbody></table></div></section>`;
  const fld=UI.asgV!=='list';
  const stars=A?`<div class="row wrapr"><span class="chips">${years.map(y=>`<button data-a="asgY" data-v="${y}" class="${y===A.y?'on':''}">${y}</button>`).join('')}</span><span class="chips">${[['field','라인업 그림'],['list','전체 명단']].map(([v,l])=>`<button data-a="asgV" data-v="${v}" class="${(fld?'field':'list')===v?'on':''}">${l}</button>`).join('')}</span></div><p class="small muted">${dmd(A.event-2)}~${dmd(A.event+1)} 올스타 휴식기 · 발표 당시 소속·기록입니다. ${A.played?'행사 종료':'행사 예정'}</p><div class="league-event-grid">${['나눔','드림'].map(k=>fld?asgField(k,A.teams[k]||[]):list(k,A.teams[k]||[])).join('')}</div>${A.withdrawn.length?`<p class="small muted">출전 취소·대체: ${A.withdrawn.map(x=>`${esc(x.name)} → ${G.players[x.replacement]?esc(G.players[x.replacement].name):'대체 선수'}`).join(', ')}</p>`:''}`:'<section class="card"><h2 class="sec">나눔·드림 올스타</h2><p class="small muted">올스타 행사 2주 전에 전반기 실제 기록과 팬·선수 평가를 바탕으로 명단을 발표합니다. 휴식기에는 정규시즌 경기가 없습니다.</p></section>';
  const rivals=Object.values((G.rivalries||{}).pairs||{}).filter(r=>r.label).sort((a,b)=>b.last-a.last);
  return '<div class="asg-page ws-own">'+stars+csec('라이벌 맞대결',rivals.length?`<div class="tw"><table class="sqt"><thead><tr><th>이야기</th><th>구단</th><th>경기</th><th>접전</th><th>가을 맞대결</th><th>시작</th></tr></thead><tbody>${rivals.map(r=>`<tr><td><b>${esc(r.label)}</b></td><td>${esc(tshort(r.a))} · ${esc(tshort(r.b))}</td><td>${r.games}</td><td>${r.close}</td><td>${r.post}</td><td>${r.emerged?dstr(r.emerged):'연고지·팬 문화'}</td></tr>`).join('')}</tbody></table></div><p class="small muted">이 게임에서 치른 경기만 집계합니다. 접전은 두 점 차 이내 승부입니다. 라이벌 뉴스는 경기 능력·징계에 영향을 주지 않습니다.</p>`:'<p class="small muted">시즌 맞대결이 쌓이면 여기서 이력을 볼 수 있습니다. 달빛대전·엘롯기 맞대결과 게임 속에서 생긴 새 라이벌을 함께 기록합니다.</p>')+'</div>';
}
function ggVotingView(A){
  if(!A||!A.ggVote||awShown(A,'gg'))return '';
  const V=A.ggVote,start=dnum(A.y,11,25),end=dnum(A.y,12,5),stage=G.day<start?'투표 준비':G.day<=end?'기자단 투표 중':'투표 마감 · 발표 대기';
  return `<section class="card candidate-list"><div class="row between"><h2 class="sec">골든글러브 · ${stage}</h2><span class="small muted">${dmd(start)}~${dmd(end)}</span></div><p class="small muted">WAR·주요 기록·이정표·팀 성적을 함께 보는 가상 기자 ${V.voters}명의 투표입니다. 아래는 유력 후보 전망이며 비공개 득표나 확정 수상자가 아닙니다.</p><div class="tw"><table class="sqt candidate-table"><thead><tr><th>포지션</th><th>유력 후보 전망</th><th>발표 당시 기록</th></tr></thead><tbody>${ggPublicRace(A).map(x=>x.candidates.map(c=>`<tr><td>${x.pos==='P'?'투수':x.pos==='OF'?'외야수':POSS[x.pos]||x.pos}</td><td><button class="lnk" ${G.players[c.id]?`data-a="player" data-v="${c.id}"`:''}>${esc(c.name)}</button> <span class="small muted">${esc(tshort(c.t))}</span>${c.milestones.length?` <span class="pill warn">${esc(c.milestones.join(' · '))}</span>`:''}</td><td class="candidate-note">${esc(c.line)}</td></tr>`).join('')).join('')}</tbody></table></div></section>`;
}
Object.assign(A,{
  leagueEvents(){UI.it=UI.it||{};UI.it.histv='events';A.go('league:hist');},
  asgY(v){UI.asgY=+v;render();},
  asgV(v){UI.asgV=v;render();},
  trophyGo(){UI.it=UI.it||{};UI.it.histv='tro';closeSheets();A.go('league:hist');}
});
/* 올스타 베스트12를 야구장 그림 위 선발 라인업으로 보여 준다. 드림(두산·SSG·KT·삼성·롯데 연고)·나눔 배정은 엔진 ALL_STAR_DREAM을 따른다.
   선정 명단의 외야는 OF로 묶여 있어, 선수 주 포지션(좌·중·우)을 먼저 맞추고 남는 자리를 순서대로 채운다. 좌표는 야구장 그림(200x200) 기준 백분율 */
const ASG_SPOT={P:[50,60,'투수'],C:[50,88,'포수'],'1B':[82,62,'1루수'],'2B':[67,42,'2루수'],'3B':[18,62,'3루수'],SS:[33,42,'유격수'],LF:[17,25,'좌익수'],CF:[50,12,'중견수'],RF:[83,25,'우익수'],DH:[84,89,'지명타자']};
function asgField(side,L){
  /* 베스트12는 선발·중간·마무리·포수…지명 순서로 뽑혔다. 자리가 비어 다른 포지션 선수로 채운 지명타자는 이미 찬 자리에 겹치지 않게 지명으로 보낸다 */
  const S=L.filter(x=>x.starter), at={}, of=[], left=[];
  for(const x of S){ if(x.slot==='SP'&&!at.P)at.P=x; else if(x.slot==='OF')of.push(x); else if(!x.isP&&ASG_SPOT[x.slot]&&!at[x.slot])at[x.slot]=x; else if(!x.isP)left.push(x); }
  for(const x of of){ const pp=(G.players[x.id]||{}).pos; if(['LF','CF','RF'].includes(pp)&&!at[pp])at[pp]=x; }
  for(const x of of)if(!Object.values(at).includes(x)){ const k=['LF','CF','RF'].find(k=>!at[k]); if(k)at[k]=x; else left.push(x); }
  if(!at.DH&&left.length)at.DH=left[0];
  if(!at.P)at.P=S.find(x=>x.isP);
  const chip=(k,x)=>{ const [l,t,nm]=ASG_SPOT[k], p=x&&G.players[x.id]; return `<button class="asf-p${x&&x.t===G.user?' me':''}" style="left:${l}%;top:${t}%"${p?` data-a="player" data-v="${x.id}"`:''}>${p?avImg(p):'<span class="av ini">-</span>'}<i>${nm}</i><b>${x?esc(x.name):'공석'}</b>${x?`<em>${esc(tshort(x.t))}</em>`:''}</button>`; };
  const pen=S.filter(x=>x.isP&&x!==at.P);
  return `<section class="card asf-card"><div class="row between"><h2 class="sec">${side} 올스타 선발 라인업</h2><span class="small muted">베스트12 · ${L.length}명 선정</span></div><div class="asf"><svg viewBox="0 0 200 200" aria-hidden="true"><rect width="200" height="200" fill="#1d3a26"/><path d="M100 184 L2 86 Q100 -36 198 86 Z" fill="#3f8a3f"/><path d="M100 184 L2 86 Q100 -36 198 86 Z" fill="none" stroke="#c9b48a" stroke-width="5" opacity=".55"/><path d="M100 184 L40 124 Q100 52 160 124 Z" fill="#b8814f"/><path d="M100 170 L134 136 L100 102 L66 136 Z" fill="#4c9a48"/><circle cx="100" cy="138" r="7" fill="#b8814f"/><path d="M100 184 L2 86 M100 184 L198 86" stroke="#fff" stroke-width=".8" opacity=".8"/><g fill="#fff"><rect x="96.5" y="176" width="7" height="7"/><rect x="133" y="132.5" width="6" height="6" transform="rotate(45 136 135.5)"/><rect x="97" y="99" width="6" height="6" transform="rotate(45 100 102)"/><rect x="61" y="132.5" width="6" height="6" transform="rotate(45 64 135.5)"/></g></svg>${Object.keys(ASG_SPOT).map(k=>chip(k,at[k])).join('')}</div>${pen.length?`<p class="asf-pen small"><b>불펜</b> ${pen.map(x=>`<button class="lnk" ${G.players[x.id]?`data-a="player" data-v="${x.id}"`:''}>${x.slot==='CP'?'마무리':x.slot==='SP'?'선발':'중간'} ${esc(x.name)}</button> <span class="muted">${esc(tshort(x.t))}</span>`).join(' · ')}</p>`:''}</section>`;
}
