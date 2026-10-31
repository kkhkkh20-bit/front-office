/* ---------- FM식 메뉴: 섹션과 하위 탭 ---------- */
const ICO2={dumbbell:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',home:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',swap:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>',
 search:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
 clip:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
 club:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/></svg>',
 cog:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>',
 menu:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>'};
const NAV=[['inbox','소식함','mail'],['home','홈','home'],['roster','선수단','users'],['trade','트레이드','swap'],['transfer','영입·계약','brief'],['staff','스태프·육성','clip'],['league','리그','trophy'],['club','구단·재정','club']];
const BNAV=['inbox','home','roster','trade','transfer'];
const SUBS={
  trade:[['block','트레이드 매물'],['table','트레이드 협상'],['market','추천·선수 찾기'],['gms','단장']],
  transfer:[['fa','FA 시장'],['foreign','외국인'],['draft','신인 드래프트'],['contract','계약'],['moves','이적 현황']],
  train:[['camp','훈련장'],['dev','육성'],['lead','리더십']],
  staff:[['mgr','감독'],['coach','코치진'],['train','훈련·육성'],['scouts','스카우트'],['data','전력분석'],['med','부상 관리']],
  cfg:[['set','게임 설정'],['auth','업무 권한']],
  league:[['stand','순위'],['score','일정·결과'],['rec','기록'],['wire','리그 소식'],['assoc','협회'],['nt','국가대표'],['hist','역사']],
  club:[['owner','구단주·목표'],['fans','팬·언론'],['fin','재정'],['spon','스폰서'],['inv','시설 투자'],['chron','연대기']]};
/* 탭 정리: 보이는 탭 하나가 예전 화면 여러 개를 이어서 보여 준다 */
const MERGE={trade:{block:['block'],gms:['gms','report']},staff:{train:['camp','dev','lead']}, /* 예전 '훈련' 메뉴는 스태프·육성 > 훈련·육성 안쪽 탭 */
  league:{rec:['rec','feat']},club:{owner:['owner','rel'],fans:['fans','news','media'],chron:['build','chron','result','ob','log']}};
const ALIAS={}; for(const t in MERGE){ ALIAS[t]={}; for(const v in MERGE[t])for(const k of MERGE[t][v])ALIAS[t][k]=v; } ALIAS.trade.offers='block';
/* 합친 탭에서 부가 화면은 접어 둔다(제목만 보이고 누르면 펼침) */
const MFOLD={'trade:find':'선수 찾기','trade:report':'트레이드 성적표','league:teams':'구단 둘러보기','league:feat':'진기록','league:abroad':'해외파','club:rel':'관계도','club:ob':'OB·레전드','club:log':'구단 일지','club:result':'지난 시즌 결산','staff:mil':'병역','staff:coach':'코치진'};
/* 합쳐진 메뉴는 세로로 쌓지 않고 안쪽 탭으로 나눈다: 한 화면에 한 주제 */
const MLBL={'staff:camp':'훈련장','staff:lead':'리더십','club:media':'여론·기자','club:fans':'팬 게시판','club:build':'내가 꾸린 팀','club:news':'우리 구단 기사','club:mkt':'마케팅','trade:market':'추천·영입 요청','trade:gms':'단장들','staff:mgr':'감독','staff:dev':'육성','staff:med':'부상 관리','league:stand':'순위','league:rec':'기록','league:hist':'역사','club:owner':'구단주·목표','club:fin':'재정','club:chron':'연대기'};
function mergedBody(tab,s,H){ const ks=((MERGE[tab]&&MERGE[tab][s])||[s]).filter(k=>H[k]); if(!ks.length)return H[SUBS[tab][0][0]]?H[SUBS[tab][0][0]]():'';
  const why=ks.map(k=>{ try{ return alertWhy(tab,k); }catch(e){ return ''; } }).join('');
  if(ks.length===1)return why+H[ks[0]]();
  const lab=k=>MLBL[tab+':'+k]||MFOLD[tab+':'+k]||((SUBS[tab].find(x=>x[0]===k)||[])[1])||k;
  const it=inTabs(`mg_${tab}_${s}`,ks.map(k=>[k,lab(k)]),s); return why+it.bar+H[it.cur](); }
const GW={구장:['club','stad'],감독:['staff','mgr'],코치진:['staff','coach'],외국인선수:['transfer','foreign'],'부상방지·병원':['staff','med'],'2군연수':['staff','dev'],트레이드:['trade','block'],병역:['staff','mil'],비FA다년계약:['transfer','contract'],드래프트후보:['transfer','draft'],스카우트팀:['staff','scouts'],해외스카우트망:['scout','intl'],전력분석:['staff','data'],마케팅:['club','mkt'],일지:['club','log'],연봉협상:['transfer','contract'],신인드래프트:['transfer','draft'],FA시장:['transfer','fa'],시즌결산:['club','result'],스프링캠프:['train','dev'],순위:['league','stand']};
function curSub(tab){ if(tab==='league')return (ALIAS.league[UI.lseg]||UI.lseg); UI.sub=UI.sub||{}; const raw=UI.sub[tab]||SUBS[tab][0][0]; return (ALIAS[tab]&&ALIAS[tab][raw])||raw; }
function faLive(){ return !!(G.fa&&!G.fa.closed&&G.day>=KD(11,1)); }
function subAlert(tab,k){
  const f=foreignOf(G.user);
  const A2={
    'trade:block':!!(G.offers&&G.offers.length),
    'transfer:foreign':foreignOpen()&&f.length<4&&period()!=='season',
    'transfer:fa':faLive(),
    'transfer:contract':!!(G.contract&&!G.contract.done),
    'transfer:draft':!!(G.draft&&!G.draft.done),
    'staff:scouts':new Set(G.scouts.filter(s=>(s.role||'am')==='am').map(s=>s.region)).size<3,
    'staff:mgr':!G.mgr[G.user],
    'staff:coach':!!G.coach&&CKEYS.some(k=>!coachesOf(G.user)[k]),
    'train:dev':!!(G.camp&&!G.camp.done&&!G.camp.seen),
    'staff:dev':!!(G.camp&&!G.camp.done&&!G.camp.seen),
    'staff:med':!G.medSet,
    'staff:mil':!!sangmuWave()&&domestic(G.user).some(p=>milFree(p)&&p.age>=27&&!(p.mil&&p.mil.app))};
  return !!A2[tab+':'+k];
}
function tabAlert(tab){ return (SUBS[tab]||[]).some(([k])=>((MERGE[tab]&&MERGE[tab][k])||[k]).some(x=>subAlert(tab,x))); }
function subTabs(tab){
  const cur=curSub(tab);
  return `<nav class="subtabs" aria-label="${TITLE[tab]} 하위 메뉴">${SUBS[tab].map(([k,l])=>`<button data-a="${tab==='league'?'lseg':'sub'}" data-v="${tab==='league'?k:tab+':'+k}" class="${cur===k?'on':''}">${l}${((MERGE[tab]&&MERGE[tab][k])||[k]).some(x=>subAlert(tab,x))?'<i class="sdot"></i>':''}</button>`).join('')}</nav>`;
}
const csec=(title,body,extra)=>`<section class="card"><div class="row between"><h2 class="sec">${title}</h2>${extra||''}</div>${body}</section>`;
function menuSheet(){
  return `<div class="scrim" data-a="closeSheet"><div class="sheet gut" data-stop="1" role="dialog" aria-label="전체 메뉴"><div class="sheet-head"><h2 class="sec">전체 메뉴</h2><button class="x" data-a="closeSheet" aria-label="닫기">×</button></div>
  <div class="menu-grid">${NAV.map(([k,l,i])=>`<div class="menu-sec"><button class="menu-h ${UI.tab===k?'on':''}" data-a="tab" data-v="${k}">${ICO[i]||ICO2[i]}<b>${l}</b>${tabAlert(k)?'<i class="sdot"></i>':''}</button>${SUBS[k]?`<div class="menu-subs">${SUBS[k].map(([s,sl])=>`<button data-a="go" data-v="${k}:${s}">${sl}${subAlert(k,s)?'<i class="sdot"></i>':''}</button>`).join('')}</div>`:''}</div>`).join('')}</div><button class="btn block" data-a="tab" data-v="me" style="margin-top:8px">${avImg(meAv())} 단장 프로필 · 경력 · 사임</button><button class="btn block" data-a="go" data-v="cfg:set" style="margin-top:8px">${ICO2.cog} 설정 · 권한 (새 게임·저장·업무 맡기기)</button></div></div>`;
}

