/* ===== 치어리더 단원 카드(구단·재정 > 팬·언론 > 응원단, 엔진 56b_cheer_squad.js) =====
   사진: v14 치어리더 단원 12명 + v12 치어리더 팀장 사진(팀장 자리에 쓰인 사진은 빼고). 단원 수가 더 많으면 겹쳐 쓴다(같은 단원은 늘 같은 사진) */
const shash=s=>[...String(s)].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7)>>>0;
const F8R=(r,f)=>typeof FACE8==='undefined'?[]:FACE8.ids.map((x,i)=>x.r===r&&(f==null||x.f===f)?i:-1).filter(i=>i>=0);
/* 응원단장·치어리더 팀장 사진(v12): 팀장은 여성 팀장 사진, 응원단장은 남성 응원단장 사진에서 이름·번호로 고정. 갤러리 사진(G.cimg)이 있으면 그쪽이 먼저 */
function crewPh(c){ const P=c.job==='cap'?F8R('ccap'):F8R('clead',0); /* 응원단장 이름은 남성 이름(genName)이라 남성 사진 */ return P.length?P[shash('cr'+c.id+c.name)%P.length]:null; }
/* 단원 사진: 처음 볼 때 정해 저장(m.ph = FACE8 번호). shortcut: FACE8 앞쪽에 새 묶음을 끼워 넣으면 번호가 밀린다, 그때는 m.ph를 지우고 다시 배정 */
function cheerPh(S,m){ const P=[...F8R('cheer'),...F8R('ccap')], cap=(G.fanOps.crew||{}).cap, cp=cap?crewPh(cap):null, Q=P.filter(i=>i!==cp); if(!Q.length)return null;
  if(m.ph!=null&&Q.includes(m.ph))return m.ph; const used=new Set(S.L.map(x=>x.ph)), free=Q.filter(i=>!used.has(i)), L=free.length?free:Q; m.ph=L[shash(m.id+':'+m.name)%L.length]; return m.ph; }
function phImg(c,alt){ const u=c!=null&&typeof face8Src==='function'?face8Src(c):null; return u?`<img src="${u}" alt="${esc(alt||'')}">`:''; }
const fatCol=v=>v>=80?'var(--bad)':v>=60?'var(--warn)':'var(--good)';
function cheerCard(S,m,up){ const st=m.inj?`<span class="pill bad">부상 ${m.inj}일</span>`:m.sl?`<span class="pill warn">슬럼프 ${m.sl}일</span>`:up?'<span class="pill good">다음 무대</span>':'<span class="pill">대기</span>';
  const fol=m.fol>=10000?(m.fol/10000).toFixed(m.fol>=100000?0:1)+'만':m.fol.toLocaleString('ko-KR');
  return `<div class="chm${up?' up':''}${m.inj?' inj':''}"><div class="crew-h"><span class="crew-av">${phImg(cheerPh(S,m),m.name)}</span><div><b>${esc(m.name)}</b><span class="small muted">${m.age}세 · ${m.yrs?m.yrs+'년 차':'신인'} · 월 ${money(cheerFee(m,S.ag))}</span><span class="small">SNS 팔로워 ${fol}</span></div></div>
    <div class="crew-at chm-at">${CHEER_AT.map(([k,l])=>`<span><i>${l}</i><b style="color:${m[k]>=15?'var(--good)':m[k]<=7?'var(--bad)':'var(--ink)'}">${m[k]}</b></span>`).join('')}</div>
    <div class="chm-f"><span class="small">피로 <b style="color:${fatCol(m.fat)}">${m.fat}</b></span><i><u style="width:${m.fat}%;background:${fatCol(m.fat)}"></u></i>${st}</div>
    <div class="row" style="gap:4px"><button class="btn small${!S.auto&&m.on?' primary':''}" data-a="cheerOn" data-v="${m.id}"${m.inj?' disabled':''}>${S.auto?(up?'휴식 주기':'선발로'):m.on?'선발':'휴식'}</button><span class="small muted">출연 ${m.app}회</span></div></div>`; }
function cheerView(){ if(G.unemp)return ''; if(!(G.fanOps&&G.fanOps.cs))return `<p class="small muted">아직 응원단 대행사와 계약하지 않았습니다. 대행사를 고르면 단원 ${CHEER_N[(G.fanOps&&G.fanOps.cheer)||0]}명이 오고, 그때부터 월 수수료가 나가고 홈 관중 효과가 생깁니다.</p><div class="chips">${Object.entries(CHEER_AG).map(([k,a])=>`<button data-a="cheerAg" data-v="${k}">${esc(a.l)} · 수수료 ${Math.round(a.fee*100)}%</button>`).join('')}</div>${UI.cheerMsg?`<div class="note">${esc(UI.cheerMsg)}</div>`:''}`; /* 보기만 해서는 응원단을 만들지 않는다(검수 11-09j) */ const S=G.fanOps.cs, F=G.fanOps, lv=F.cheer||0, up=new Set(cheerStage(S).map(m=>m.id)), pw=cheerPower(S), att=cheerAtt();
  const ag=Object.entries(CHEER_AG).map(([k,a])=>`<button data-a="cheerAg" data-v="${k}" class="${S.ag===k?'on':''}">${esc(a.l)} · 수수료 ${Math.round(a.fee*100)}%</button>`).join('');
  const L=[...S.L].sort((a,b)=>up.has(b.id)-up.has(a.id)||b.pop-a.pop);
  const ml=cheerMeetLeft();
  return `${sceneImg(sceneOf(['cheer_basic','cheer_expanded','cheer_large'][lv],G.user+':'+G.year),'응원 무대')}
    <p class="small muted">응원단은 대행사와 계약합니다(실제 구단들도 외주). 대행사마다 수수료와 단원 실력이 다르고, 바꾸면 단원이 모두 바뀝니다(시즌 중에는 못 바꿈). 홈경기마다 ${CHEER_STAGE[lv]}명이 무대에 서고, 무대에 서면 피로가 쌓입니다. 지친 단원을 계속 세우면 부상·슬럼프가 옵니다(체력·성실성이 높으면 덜함). 무대 힘(댄스·팬서비스·인기)이 홈 관중을 조금 늘리고, 팬서비스는 팬 여론, 인기 단원은 상품 수입과 화제 기사를 만듭니다. 응원단 단계를 올리면 단원이 늘어납니다.</p>
    <div class="chips">${ag}</div><p class="small muted">${esc(CHEER_AG[S.ag].d)}</p>
    <div class="fo-sum small"><span>단원 <b>${S.L.length}명</b></span><span>무대 <b>${up.size}/${CHEER_STAGE[lv]}명</b></span><span>무대 힘 <b>${pw.toFixed(1)}</b></span><span>홈 관중 <b style="color:${att>=0?'var(--good)':'var(--bad)'}">${att>=0?'+':''}${(att*100).toFixed(1)}%</b></span><span>월 수수료 <b>${money(cheerPay())}</b></span></div>
    <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn small${S.auto?' primary':''}" data-a="cheerAuto">${S.auto?'자동 순환 중':'직접 정하는 중'}</button><button class="btn small" data-a="cheerMeet"${ml?' disabled':''}>${ml?esc(ml):'치어리더 팬 사인회 '+money(5)}</button></div>
    <p class="small muted">${S.auto?'자동 순환: 덜 지친 단원부터 무대에 섭니다. 단원 버튼을 누르면 직접 정하기로 바뀝니다.':'직접 정하기: 선발로 둔 단원 중 덜 지친 순서로 무대에 섭니다. 선발이 모자라면 무대 힘이 줄어듭니다.'}</p>
    ${UI.cheerMsg?`<div class="note">${esc(UI.cheerMsg)}</div>`:''}
    <div class="chm-g">${L.map(m=>cheerCard(S,m,up.has(m.id))).join('')}</div>`; }
Object.assign(A,{ cheerOn(v){ UI.cheerMsg=cheerOn(v); save(); render(); }, cheerAuto(){ UI.cheerMsg=cheerAuto(); save(); render(); }, cheerAg(v){ UI.cheerMsg=cheerAg(v); save(); render(); }, cheerMeet(){ UI.cheerMsg=cheerMeet(); save(); render(); } });
