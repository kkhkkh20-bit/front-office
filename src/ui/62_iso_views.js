/* ---------- 아이소메트릭 그림(시안 B)을 화면에 붙이는 곳: 구장 외관·구단 버스·시설 카드 썸네일 ----------
   그림 함수는 gfx/iso.js(순수 함수). 여기서는 게임 상태를 읽어 옵션만 만든다. 시설 데이터는 facOf·G.fac·busLv로 읽기만 한다 */
const STAD_SHORT={seat:'관람석',fnb:'매장',prem:'프리미엄석',vis:'전광판',turf:'그라운드'};
/* 구장 그림 옵션: 실제 세부 시설 단계, 진행 중인 공사(진행률), 돔, 신구장 사업 */
function stadIsoOpts(tid){ const S=stadOf(tid);
  const build=(S.build||[]).map(b=>({k:b.k,lv:b.lv,done:b.done,pct:clamp(1-(b.done-G.day)/(STAD_DAYS[b.lv]||90),0,1)}));
  let proj=null; const N=S.proj;
  if(N&&tid===G.user){ if(N.stage==='build'){ const t0=N.res||N.start||G.day; const pct=clamp((G.day-t0)/Math.max(1,N.done-t0),0,1); const o=NEWSTAD.find(x=>x.k===N.k);
      proj={stage:'build',pct,label:`${o?o.l+' ':''}신구장 공사 ${Math.round(pct*100)}% · ${dobj(N.done).y}년 개장`}; }
    else proj={stage:N.stage,label:N.stage==='talk'?'신구장 부지 · 시와 협상 중':'신구장 부지 · 규모 선택 대기'}; }
  return {lv:Object.assign({},S.lv),build,dome:!!S.dome,proj}; }
function stadIsoPic(tid){ const S=stadOf(tid); const o=stadIsoOpts(tid); o.col=cTeamCol(tid);
  const cap=STAD_ITEMS.map(it=>{ const b=o.build.find(x=>x.k===it.k); return `<span>${STAD_SHORT[it.k]} <b>${S.lv[it.k]}</b>/5${b?` <em class="bld">${b.lv}단계 공사 ${Math.round(b.pct*100)}%</em>`:''}</span>`; }).join('');
  return `<figure class="isostad">${isoStadiumSvg(o)}<figcaption class="isocap">${cap}${o.dome?'<span><b>돔구장</b></span>':''}${o.proj&&o.proj.stage==='build'?`<span><em class="bld">${esc(o.proj.label)}</em></span>`:''}</figcaption></figure>`; }
/* 구단 버스 그림: 지금 버스 크게 + 세 등급 비교 띠(같은 축척이라 길이 차이가 보인다) */
function busIsoPic(){ const bl=busLv(), col=cTeamCol(G.user); const vb=isoBusVB(2).join(' ');
  return `<div class="isobus"><svg class="isosvg" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(BUS[bl].l)}">${isoBus(bl,{col})}</svg></div>
    <div class="isobusl">${BUS.map((B,i)=>`<div class="${i===bl?'on':''}"><svg class="isosvg" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${isoBus(i,{col})}</svg><span>${esc(B.l)}${i===bl?' · 지금':''}</span></div>`).join('')}</div>`; }
/* 시설 카드 썸네일: 단계와 공사 진행을 반영 */
function facThumb(k){ const b=cpBuilds()[k]; return isoThumb(k,facOf(k),cTeamCol(G.user),b?b.pct:null); }
