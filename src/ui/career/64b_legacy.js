/* ---------- 구단 > 연대기 > 단장 레거시: 역대 단장 · 단장 명예의 전당 · 왕조 비교 · 연대기 한 장 (피드백 11-09p) ---------- */
const lgPct=x=>x.w+x.l?(x.w/(x.w+x.l)).toFixed(3).replace(/^0/,''):'-';
/* 배출 스타: 그 구단이 그 단장 재임 중 지명한 선수 가운데 MVP·골든글러브·프랜차이즈 스타·명예의 전당 */
function lgStars(){ const L=[], seen=new Set(), hof=new Set(); try{ for(const r of hofList())hof.add(String(r.pid??r.id)); }catch(e){}
  const add=(p,aw,fr)=>{ const d=p&&p.draft; if(!d||d.tid==null||d.y==null||seen.has(String(p.id)))return; seen.add(String(p.id)); if(fr||hof.has(String(p.id))||(aw||[]).some(a=>/MVP|골든/.test(a)))L.push({id:p.id,name:p.name,t:d.tid,y:d.y}); };
  for(const p of Object.values(G.players))add(p,p.aw,p.fr&&p.fr.tid===(p.draft&&p.draft.tid));
  for(const id in (G.arch||{})){ const a=G.arch[id]; if(a&&a.dy!=null&&a.dt!=null)add({id:a.id,name:a.name,draft:{y:a.dy,tid:a.dt}},a.aw,a.fr&&a.fr.tid===a.dt); }
  return L; }
const lgStarsOf=(S,x)=>S.filter(s=>s.t===x.t&&s.y>=x.y0&&s.y<=x.y1);
function legacyView(){ const it=inTabs('lgv',[['club','역대 단장'],['hof','단장 전당'],['dyn','왕조 비교'],['tl','연대기 한 장']],'club');
  const body=it.cur==='hof'?lgHofView():it.cur==='dyn'?lgDynView():it.cur==='tl'?lgTimeline():lgClubView(); return it.bar+body; }
function lgClubView(){ const tid=UI.lgT!=null&&team(UI.lgT)?UI.lgT:(G.user??0); const D=legRec(), S=lgStars(); const L=D.L.filter(x=>x.t===tid).sort((a,b)=>b.y0-a.y0);
  const pick=`<div class="chips lg-tm">${G.teams.map(t=>`<button data-a="lgT" data-v="${t.id}" class="${t.id===tid?'on':''}">${esc(t.nick)}</button>`).join('')}</div>`;
  const row=x=>{ const a=legAt(x.k,x.t), cur=legCur(x), hon=!cur&&legHonQ(a), st=lgStarsOf(S,x);
    return `<div class="item wa${x.u?' lg-me':''}" style="cursor:default">${badge(x.t,22)}<span class="nm">${esc(x.n)}${x.u&&x.k===legMeK()?' <span class="pill acc">나</span>':x.u?' <span class="pill">내 계보</span>':''}${cur?' <span class="pill">재임 중</span>':''}${hon?' <span class="pill warn">구단 공로자</span>':''}</span>
      <span class="sub">${x.y0}~${cur?'':x.y1} · ${x.s}시즌 · 승률 ${lgPct(x)} · 배출 스타 ${st.length}${st.length?` (${st.slice(0,3).map(s=>esc(s.name)).join(', ')}${st.length>3?' 외':''})`:''}</span><span class="rt">${x.c?`<b>우승 ${x.c}</b>`:'<span class="muted">우승 없음</span>'}</span></div>`; };
  const P=G.gmLeg&&G.gmLeg.pres;
  return csec(`${esc(tname(tid))} 역대 단장`,pick+(L.length?`<div class="list">${L.map(row).join('')}</div>`:'<p class="small muted">아직 기록이 없습니다. 시즌을 마치면 그해 단장이 쌓입니다.</p>')
    +`<p class="small muted">기록은 ${D.L.length?Math.min(...D.L.map(x=>x.y0)):G.year}년부터 남아 있습니다. 배출 스타는 그 단장 재임 중 지명한 선수 가운데 MVP·골든글러브·프랜차이즈 스타·명예의 전당 선수입니다.</p>`)
   +csec('구단이 공로를 기리는 방법',`<p class="small tipme">한 구단에서 ${LEG_HON.s}시즌 이상 일하며 우승 ${LEG_HON.c}회 이상, 또는 그 구단 우승 ${LEG_HON.c5}회를 이룬 단장이 구단을 떠나거나 물러나면 '구단 공로자'로 구단 역사에 이름이 남고 기사가 납니다.</p>
    <p class="small tipme">한 구단을 ${LEG_PRES.s}시즌 이상 연속해서 맡고 구단주 신뢰가 ${LEG_PRES.trust} 이상이면 모기업이 있는 구단의 구단주가 대표이사(사장)나 고문 자리를 한 번 제안합니다. 답은 기록으로만 남고 단장 업무는 그대로 이어집니다.${P?` <b>${P.y}년 ${esc(P.role)} 제안 · ${P.ans==null?'답하지 않음':P.ans?'수락':'사양'}</b>`:''}</p>
    ${(G.gmLeg&&G.gmLeg.hon||[]).length?`<p class="small">내 계보의 구단 공로자: ${G.gmLeg.hon.map(h=>`${esc(h.n)}(${esc(tshort(h.t))} ${h.y0}~${h.y1}, 우승 ${h.c}회)`).join(', ')}</p>`:''}`); }
function lgHofView(){ const L=legPeople(), me=L.findIndex(p=>p.u&&p.k===legMeK());
  const row=(p,i)=>`<div class="item${p.u?' lg-me':''}" style="cursor:default"><span class="nm"><b class="num">${i+1}</b> ${esc(p.n)}${p.u&&p.k===legMeK()?' <span class="pill acc">나</span>':p.u?' <span class="pill">내 계보</span>':''}${p.cur?' <span class="pill">재임 중</span>':''}</span>
    <span class="sub">${p.ts.map(t=>esc(tshort(t))).join('·')} · ${p.y0}~${p.cur?'':p.y1} · ${p.s}시즌 · 승률 ${lgPct(p)}</span><span class="rt"><b>우승 ${p.c}</b><br><span class="small muted">${p.sc}점</span></span></div>`;
  const top=L.slice(0,20);
  return csec('단장 명예의 전당',(me>=0?`<div class="tiles"><div class="tile"><span class="g">${me+1}위</span><span class="l">내 순위 / ${L.length}명</span></div><div class="tile"><span class="g">${L[me].c}</span><span class="l">우승</span></div><div class="tile"><span class="g">${L[me].s}</span><span class="l">시즌</span></div></div>`:'')
    +(top.length?`<div class="list">${top.map(row).join('')}${me>=20?row(L[me],me):''}</div>`:'<p class="small muted">시즌을 마치면 순위가 생깁니다.</p>')
    +`<p class="small muted">점수 = 우승 ×10 + 재임 시즌 + (승률 − .500) ×100(5시즌 미만은 그만큼 줄임). 리그의 AI 단장도 함께 셉니다. 예전 저장 파일은 지금 재임 중인 단장과 내 경력부터 셉니다. 기록은 최대 ${LEG_MAX}줄까지 남깁니다.</p>`); }
function lgDynView(){ const W=legWins5(), me=W.me; const row=(x,mine)=>`<div class="item wa${mine?' lg-me':''}" style="cursor:default">${badge(x.t,22)}<span class="nm">${x.y0}~${x.y1} ${esc(tshort(x.t))}${x.gm?` <span class="small muted">${esc(x.gm)} 단장</span>`:''}</span><span class="sub">${x.w}승 ${x.l}패 · 승률 ${lgPct(x)}</span><span class="rt"><b>우승 ${x.c}</b></span></div>`;
  const mineTop=x=>me&&x.t===me.t&&x.y0===me.y0;
  return csec('내 최고 5년',me?`<div class="list">${row(me,true)}</div><p class="small">리그 역대 5년 구간 가운데 ${me.rk}위입니다(우승 수, 같으면 승률 순).</p>`:'<p class="small muted">한 구단에서 다섯 시즌을 이어서 치르면 비교할 수 있습니다.</p>')
   +csec('리그 역대 최고 5년',W.top.length?`<div class="list">${W.top.slice(0,10).map((x,i)=>row(x,mineTop(x))).join('')}</div><p class="small muted">한 구단의 겹치는 구간은 가장 좋은 하나만 보여 줍니다. 표시한 단장은 구간 가운데 해의 단장입니다.</p>`:'<p class="small muted">다섯 시즌이 쌓이면 보여 줍니다.</p>'); }
/* 연대기 한 장: 카페에 올릴 수 있게 한 화면에 연도순으로 */
function lgTimeline(){ const C=G.myC||{}, S=(C.seas||[]).slice().sort((a,b)=>a.y-b.y); const ev={}; const add=(y,k,t)=>{ if(y==null)return; (ev[y]=ev[y]||[]).push({k,t}); };
  let prev=null; for(const s of S){ if(s.tid!==prev)add(s.y,'구단',`${tname(s.tid)} 단장 취임`); prev=s.tid; if(s.ch===1)add(s.y,'우승',`${tshort(s.tid)} 한국시리즈 우승 (${s.w}승 ${s.l}패)`); else if(s.ch===2)add(s.y,'가을',`${tshort(s.tid)} 준우승`); }
  for(const st of (C.stints||[]))if(st.how&&!/재계약/.test(st.how))add(st.y1,'구단',`${tshort(st.tid)} ${st.how}`);
  const H=G.teams.flatMap(t=>clubChron(t.id)); const yT=new Map(S.map(s=>[s.y,s.tid])); const mineAt=(tid,y)=>yT.get(y)===tid;
  for(const [tid,R] of [[G.user,G.retNos||[]],...Object.entries(G.orgT||{}).map(([k,o])=>[+k,(o&&o.retNos)||[]])])for(const r of R)if(mineAt(tid,r.y))add(r.y,'결번',`${tshort(tid)} ${r.no}번 ${r.name} 영구결번`);
  for(const f of (G.feats||[]))if(mineAt(f.tid,f.y))add(f.y,'대기록',`${f.name} ${f.txt}`);
  for(const c of H)if(c.gm&&mineAt(c.tid,c.y)&&(c.k==='star'||(c.k==='award'&&/MVP/.test(c.t))))add(c.y,'스타',c.t);
  for(const c of H)if(c.gm!==0&&c.k==='gm'&&/공로자|제안을/.test(c.t))add(c.y,'레거시',c.t);
  for(const a of ACH)if(a.r&&a.r.title&&G.ach&&G.ach[a.id])add(G.ach[a.id].y,'칭호',`도전과제 '${a.n}' · 칭호 ${a.r.title}`);
  const ys=Object.keys(ev).map(Number).sort((a,b)=>a-b); let st=null; try{ st=myCStats(); }catch(e){} const P=legPeople(), rk=P.findIndex(p=>p.u&&p.k===legMeK());
  const head=`<div class="lgtl-h">${typeof avImg==='function'&&typeof meAv==='function'?avImg(meAv(),true):''}<div><div class="eyebrow">단장 연대기</div><h2 class="sec">${esc(legMeName())}</h2><p class="small muted keep">${S.length?`${S[0].y}~${S[S.length-1].y}`:G.year} · ${G.unemp?'야인':esc(tname(G.user))+' 단장'}${achTitle()?` · ${esc(achTitle())}`:''}${rk>=0?` · 단장 명예의 전당 ${rk+1}위`:''}</p></div></div>
    <div class="tiles"><div class="tile"><span class="g">${st?st.n:0}</span><span class="l">시즌</span></div><div class="tile"><span class="g">${st?st.w:0}</span><span class="l">승</span></div><div class="tile"><span class="g">${st?lgPct(st):'-'}</span><span class="l">승률</span></div><div class="tile"><span class="g">${st?st.ch:0}</span><span class="l">우승</span></div></div>`;
  return `<section class="card lgtl">${head}${ys.length?ys.map(y=>`<div class="lgtl-y"><b class="num">${y}</b><ul>${ev[y].map(e=>`<li class="${e.k==='우승'?'c':''}"><i>${e.k}</i>${esc(e.t)}</li>`).join('')}</ul></div>`).join(''):'<p class="small muted">첫 시즌을 마치면 연표가 쌓입니다.</p>'}<p class="small muted lgtl-f">프런트야구 · ${G.year}년 기준</p></section>`; }
Object.assign(A,{ lgT(v){ UI.lgT=+v; render(); }, legPres(v){ const r=legPresAns(v==='1'); if(r){ toast(r); return; } save(); render(); toast(v==='1'?'제안을 수락했습니다. 단장 업무는 그대로 이어집니다.':'제안을 사양했습니다.'); } });
try{ if(!MERGE.club.chron.includes('legacy'))MERGE.club.chron.push('legacy'); ALIAS.club.legacy='chron'; MLBL['club:legacy']='단장 레거시'; CHK.gm=CHK.gm||'단장'; }catch(e){}
/* 단장 프로필 카드: 레거시 요약과 바로 가기 */
function lgMeCard(){ let P=[]; try{ P=legPeople(); }catch(e){ return ''; } const i=P.findIndex(p=>p.u&&p.k===legMeK()); const H=(G.gmLeg&&G.gmLeg.hon)||[];
  return `<section class="card"><div class="row between"><div><h2 class="sec">단장 레거시</h2><p class="small muted keep">단장 명예의 전당 ${i>=0?`${i+1}위 / ${P.length}명`:'순위 없음'}${H.length?` · 구단 공로자 ${H.length}곳`:''}. 역대 단장, 왕조 비교, 연대기 한 장</p></div><button class="btn small primary" data-a="go" data-v="club:legacy">보기</button></div></section>`; }
