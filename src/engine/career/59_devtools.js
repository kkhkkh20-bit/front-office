/* ===== 테스트 도구: 가을야구 직전으로 이동 =====
   남은 정규시즌을 실제 경기로 끝까지 치르고, 정규시즌이 끝난 직후(와일드카드 결정전 전)에 멈춘다.
   그사이 결정은 기본값으로 자동 처리한다(트레이드 제안 거절, 이벤트 기본 선택, 인터뷰 첫 답변 등). */
function devAutoStep(){ G.live=null; G.res=null;
  if(G.fdWait){ G.fdWait=false; fdStart(); } if(G.fd&&!G.fd.done){ G.fd.open=true; fdAdvance(false); }
  if(G.draft&&!G.draft.done)advanceDraft(false);
  for(const o of [...(G.offers||[])])try{ answerOffer(o.id,false); }catch(e){}
  for(const e of (G.evs||[]))if(!e.done)try{ evPick(e.id,e.def??0,true); }catch(err){}
  for(const j of (G.jobs||[]))if(!j.done)try{ jobAnswer(j.tid,false); }catch(e){}
  if(G.iv&&!G.iv.done){ let g=0; while(!G.iv.done&&g++<10)ivAnswer(0); }
  const b=blocker()||'';
  if(b.includes('보상'))(G.comp||[]).forEach(c=>{ try{ compAuto(c); }catch(e){} });
  else if(b.includes('로스터'))trimCands(rosterN(G.user)-ROSTER_MAX).forEach(p=>releasePlayer(p.id));
  else if(b.includes('연봉'))try{ salOfferAll(); }catch(e){}
  else if(b.includes('감독')){ if(!G.mmarket||!G.mmarket.length)refreshMgrMarket(); hireMgr(G.mmarket[0].id,2); }
  else if(b.includes('외국인')){ for(const id of [...(G.fmarket||[])]){ const p=G.players[id]; if(p&&!foreignCheck(G.user,p))signForeign(G.user,id); } }
  return b; }
function devToPostseason(){ const y=G.year; const stuck={}; let g=0, last='';
  while(g++<600){ if(G.ps&&G.ps.seeds&&!G.ps.done&&G.sea&&G.sea.y===y)break; if(G.gameOver||G.unemp)return '경질 또는 야인 상태라 이동할 수 없습니다.'; if(G.ps&&G.ps.done&&G.sea.y===y)return '올해 가을야구는 이미 끝났습니다.';
    const b=devAutoStep(); if(b&&blocker()){ stuck[b]=(stuck[b]||0)+1; if(stuck[b]>5)return `진행이 멈췄습니다: ${b}`; }
    last=dstr(G.day); advance('day'); }
  G.live=null; G.res=null; G.stops=[]; const st=G.ps&&G.ps.order; const rk=st?st.findIndex(x=>x.tid===G.user)+1:0;
  return `정규시즌을 끝까지 치렀습니다(${dstr(G.day)}). 우리 구단 ${rk}위${G.ps&&G.ps.seeds.includes(G.user)?' · 가을야구 진출':' · 가을야구 탈락'}.`; }
/* 테스트용: 우리 구단을 1번 시드로(한국시리즈 직행). 순위표는 그대로 두고 대진만 바꾼다 */
function devSeedUser(){ const P=G.ps; if(!P||P.done||!P.seeds)return '가을야구 직전에만 쓸 수 있습니다.'; if(P.round!=='wc'||(P.cur&&P.cur.gi>0))return '이미 가을야구가 시작됐습니다.';
  const s=P.seeds.filter(t=>t!==G.user); s.unshift(G.user); P.seeds=s.slice(0,5); P.cur=mkSeries('wc',P.seeds[3],P.seeds[4],G.day+2); G.devSeed=G.year;
  return '테스트: 우리 구단을 1번 시드(한국시리즈 직행)로 바꿨습니다.'; }
