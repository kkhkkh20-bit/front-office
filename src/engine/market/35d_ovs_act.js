/* ===== 해외 활성화 5차(사용자 11-18 "해외 리그 활성화도 시도해 보자"): 해외 리그 화면에서 직접 움직인다 =====
   - 해외 관찰(G.ovw): 해외 리그 화면의 KBO 출신 외국인·관찰했던 후보·해외 후보군 선수를 관찰 명단에 올린다. 외국인 시장에 나오면 시장 관찰 명단(G.fwatch)으로 옮긴다.
     관찰 날짜는 옮긴 날부터 센다(해외 관찰로 '다른 구단 관심' 소문이 앞당겨지지 않게). 몸값·AI 판단에는 쓰지 않고 소식 우선순위에만 쓴다.
   - 영입 문의(ovsInquire): 트리플A·NPB·CPBL·멕시코리그 등에서 뛰는 KBO 출신 외국인·관찰했던 후보·해외 후보군 선수를 외국인 시장으로 불러낸다.
     같은 사람(같은 번호)으로 나오고 KBO 기록·해외 기록이 공개 기록이 된다. 계약은 기존 외국인 영입 협상(정원·구성·총액 한도·보류권·교체 횟수)을 그대로 거친다.
     우리 구단과 AI 구단이 같은 함수·같은 조건(기간·횟수·대상)이다. AI는 영입이 필요한 자리(fNeed)에 공개 기록(KBO WAR·해외 기록 가치)이 좋은 옛 외국인을 가끔 문의한다.
   - 본게임 난수(R)는 쓰지 않는다: 문의로 만드는 사람은 사람·날짜로 씨앗을 둔 난수(withRng), AI 판단은 해시(rngHash). 선수 번호 흐름(G.nextId)도 그대로 둔다. */
const OVQ={per:3,ageMax:35,aiP:.22,aiMin:1.8,keep:30,wMax:10};
const OVQ_LV=new Set(['트리플A','더블A','NPB','NPB 1군','NPB 2군','CPBL','멕시코리그','ABL']); /* 문의할 수 있는 리그(빅리그 MLB만 뺀다) */
const ovqH=(...a)=>rngHash(...a)/4294967296;
/* 해외 관찰 명단 */
function ovwOn(id){ return (G.ovw||[]).some(w=>String(w.id)===String(id)); }
function ovwToggle(id){ const t=ovqTarget(id); if(t&&t.k==='mkt')return fwatchToggle(t.p.id); G.ovw=G.ovw||[]; if(ovwOn(id)){ G.ovw=G.ovw.filter(w=>String(w.id)!==String(id)); return '해외 관찰 명단에서 뺐습니다.'; }
  if(!t)return '지금 해외에서 뛰는 선수가 아니라 관찰할 수 없습니다.'; if(G.ovw.length>=OVQ.wMax)return `해외 관찰 명단은 ${OVQ.wMax}명까지입니다.`;
  G.ovw.push({id:t.id,since:G.day}); return '해외 관찰 명단에 올렸습니다. 해외 소식에 먼저 오르고, 외국인 시장에 나오면 시장 관찰 명단으로 옮깁니다.'; }
/* 시장에 나온 해외 관찰 선수는 시장 관찰로 옮기고, 은퇴·빅리그 정착으로 사라진 선수는 뺀다. 난수 없음 */
function ovwSync(){ const W=G.ovw; if(!W||!W.length)return 0; let n=0; const keep=[], msg=[];
  for(const w of W){ const t=ovqTarget(w.id); if(t&&t.k==='mkt'){ const p=t.p; G.fwatch=G.fwatch||[]; if(!fwatchOn(p.id)&&G.fwatch.length<8&&!G.unemp){ G.fwatch.push({id:p.id,since:G.day,k:0}); msg.push(`${p.name}이(가) 외국인 시장에 나와 관찰 명단으로 옮겼습니다`); } else if(!fwatchOn(p.id))msg.push(`${p.name}이(가) 외국인 시장에 나왔습니다(관찰 명단이 가득 차 옮기지 못했습니다)`); n++; continue; }
    if(!t){ n++; continue; } keep.push(w); }
  G.ovw=keep; if(msg.length&&!G.unemp)mail('스카우트팀장','해외 관찰 선수 시장 등장',msg.join('.\n')+'.',{kind:'외국인',acts:[{l:'외국인 시장',a:'go',v:'transfer:foreign'}]}); return n; }
/* 대상 찾기: 시장 후보(mkt) · 해외파 기록(abr: KBO 출신 외국인·관찰했던 후보) · 해외 후보군(pool) */
function ovqTarget(id){ const s=String(id); const p=G.players[id]; if(p&&p.foreign&&p.team==null&&(G.fmarket||[]).includes(p.id))return {k:'mkt',p,id:p.id,name:p.name,kind:p.foreign};
  const a=(G.abroad||[]).find(x=>String(x.id)===s&&(x.foreign||x.cand)&&!x.back&&x.end==null&&x.fr); if(a)return {k:'abr',a,id:a.id,name:a.name,kind:a.foreign||'용병'};
  const e=((G.ovp&&G.ovp.L)||[]).find(x=>String(x.i)===s); if(e)return {k:'pool',e,id:e.i,name:e.n,kind:e.k?'아시아':'용병'}; return null; }
/* 지금 뛰는 수준(시즌 중이면 진행 중 기록, 아니면 지난 시즌 줄) */
function ovqLine(a){ const f=ovlFrac(G.year); if(a.cur&&a.cur.y===G.year&&f>0)return ovsCurPart(a,f); return (a.lines||[]).slice(-1)[0]||null; }
function ovqLvl(t){ if(!t)return ''; if(t.k==='pool')return t.e.l||''; if(t.k==='mkt')return t.p.prevLvl||''; const l=ovqLine(t.a); return l?l.lvl:t.a.lg==='NPB'?'NPB':t.a.lg; }
const ovqKey=()=>`${ovpWk()}${period()==='season'?'s':'w'}`; /* 문의 횟수: 겨울 시장·시즌 중 교체 기간마다 따로 센다 */
function ovqUsed(tid){ const Q=G.ovsInq; return Q&&Q.k===ovqKey()?(Q.n[tid]||0):0; }
/* 영입 기간: 겨울 시장(12월 1일~) 또는 시즌 중 교체(8월 15일까지, 교체 횟수가 남았을 때). 우리와 AI 구단이 같은 식 */
function ovqWindowWhy(tid,kind){ const per=period();
  if(per==='season'){ if(G.day>foreignDL())return '8월 15일 외국인 등록 마감이 지났습니다. 12월 1일 겨울 시장이 열리면 다시 문의할 수 있습니다.'; if(fReplLeft(tid,kind)<=0)return `이번 시즌 ${kind==='아시아'?'아시아쿼터':'일반 외국인'} 교체 ${fReplMax(kind)}회를 다 썼습니다. 12월 1일 겨울 시장이 열리면 다시 문의할 수 있습니다.`; return ''; }
  if(!foreignOpen())return per==='post'?'포스트시즌 중에는 외국인 영입 기간이 아닙니다. 12월 1일 겨울 시장이 열리면 문의할 수 있습니다.':'지금은 외국인 영입 기간이 아닙니다. 12월 1일 겨울 시장이 열리면 문의할 수 있습니다.'; return ''; }
/* 문의할 수 있는가: '' 이면 가능, 아니면 까닭(언제 열리는지 포함) */
function ovqWhy(tid,id){ const t=ovqTarget(id); if(!t)return '지금 해외에서 뛰는 문의 대상 선수가 아닙니다.'; if(tid==null||!G.teams[tid])return '구단 단장만 문의할 수 있습니다.'; if(tid===G.user&&G.unemp)return '구단 단장만 문의할 수 있습니다.';
  const w=ovqWindowWhy(tid,t.kind); if(w)return w; if(t.k==='mkt')return '';
  const lv=ovqLvl(t); if(lv==='MLB')return `${t.name}은(는) 지금 MLB에서 뛰고 있어 한국행을 생각하지 않습니다. 트리플A로 내려가거나 다른 리그로 옮기면 문의할 수 있습니다.`; if(!OVQ_LV.has(lv))return `${t.name}이(가) 뛰는 리그(${lv||'미정'})는 문의 대상이 아닙니다.`;
  if(t.k==='abr'){ const a=t.a, y1=a.y1??a.y+1, age=a.fr.age;
    if(G.year<y1||!(a.lines||[]).length&&!(a.cur&&a.cur.y===G.year&&ovlFrac(G.year)>0))return `${t.name}은(는) 해외 구단과 막 계약해 아직 해외 시즌을 치르지 않았습니다. ${Math.max(y1,G.year)} 시즌을 마친 뒤 겨울(12월 1일)부터 문의할 수 있습니다.`;
    if(a.rv!=null&&G.year-a.rv<2)return `${t.name}은(는) 지난겨울 한국행을 알아봤다가 계약하지 못해 올해는 해외에 남습니다. ${a.rv+2}년부터 다시 문의할 수 있습니다.`;
    if(age>OVQ.ageMax)return `${t.name}은(는) ${age}세라 한국행을 생각하지 않습니다.`;
    const l=(a.lines||[]).slice(-1)[0]; if(l&&ovsParts(l).some(q=>q.lvl==='MLB'&&((q.pa||0)>=300||(q.outs||0)>=(q.rp?150:300))))return `${t.name}은(는) 지난 시즌 MLB 주전으로 뛰어 한국행을 생각하지 않습니다.`;
    const h=foResFor({id:a.id,name:a.name,nat:a.fr.nat}); if(h&&h.tid!==tid)return `${tname(h.tid)}의 보류권이 ${h.until}년까지 남아 다른 구단은 계약할 수 없습니다.`; }
  else { const e=t.e; if(e.a>OVQ.ageMax)return `${t.name}은(는) ${e.a}세라 한국행을 생각하지 않습니다.`; if(e.cy===ovpWk())return `${t.name}은(는) 이번 겨울 한국행을 알아봤다가 계약하지 못했습니다. 다음 겨울(12월 1일)에 다시 문의할 수 있습니다.`; }
  if(ovqUsed(tid)>=OVQ.per)return `이번 ${period()==='season'?'시즌 교체 기간':'겨울 시장'}에는 해외 영입 문의를 ${OVQ.per}번 모두 했습니다. ${period()==='season'?'12월 1일 겨울 시장':'시즌 중 교체 기간(개막 뒤)'}에 다시 문의할 수 있습니다.`;
  return ''; }
/* 문의: 대상을 외국인 시장 후보로 불러낸다. 반환 {p, why}. p가 있으면 기존 외국인 영입 협상으로 이어진다 */
function ovsInquire(tid,id){ const t=ovqTarget(id), why=ovqWhy(tid,id); if(!t)return {why}; if(t.k==='mkt')return {p:t.p,why};
  if(why)return {why}; const lv=ovqLvl(t), sea=period()==='season', f=ovlFrac(G.year), n0=G.nextId;
  const cur=t.k==='abr'&&sea&&t.a.cur&&t.a.cur.y===G.year&&f>0?ovsCurPart(t.a,f):null;
  const p=withRng(rngHash('ovsInq',String(t.id),G.year,G.day),()=>t.k==='abr'?ovsRevive(t.a):ovpP(t.e)); G.nextId=n0; /* 누가 문의해도 같은 사람·같은 요구액(씨앗에 구단을 넣지 않는다) */
  if(!p)return {why:'지금은 시장에 부를 수 없는 선수입니다.'};
  if(!(G.fmarket||[]).includes(p.id))(G.fmarket=G.fmarket||[]).push(p.id);
  if(t.k==='abr'&&t.a.cand)delete p.fkbo; /* 관찰했던 후보는 KBO 경력이 없다 */
  if(cur){ const {y,c,o,live,x,aw,...h}=cur; h.g=ovsGamesPlayed(cur,p.isP); p.now=ovpFill(Object.assign({y:G.year,lvl:ovsCandLvlOf(cur.lvl)},h),p.isP); } /* 시즌 중 문의: 올해 해외 기록이 공개 기록(우리·AI 추정이 같은 값) */
  if(p.story&&p.story.length){ const s=p.story[p.story.length-1]; if(s&&s.y===G.year&&/KBO 복귀 추진/.test(s.t||''))s.t=`${G.year} ${sea?'시즌 중':'겨울'} ${t.a&&t.a.cand?'한국행':'KBO 복귀'} 추진(${ovsLvlL(lv)} · ${tshort(tid)} 영입 문의)`; }
  if(t.k==='pool')story(p,`${G.year} ${sea?'시즌 중':'겨울'} 한국행 추진(${ovsLvlL(lv)} · ${tshort(tid)} 영입 문의)`,'move');
  p.fday=G.day; p.fpub=G.day; p.inq={tid,d:G.day};
  const Q=G.ovsInq=G.ovsInq&&G.ovsInq.k===ovqKey()?G.ovsInq:{k:ovqKey(),n:{},L:(G.ovsInq&&G.ovsInq.L)||[]}; Q.n[tid]=(Q.n[tid]||0)+1; Q.L.unshift({y:G.year,d:G.day,tid,id:p.id,nm:p.name,lv}); if(Q.L.length>OVQ.keep)Q.L.length=OVQ.keep;
  const tag=p.fkbo?'KBO 출신 ':t.a&&t.a.cand?'관찰했던 후보 ':'';
  wire('외국인',`${tshort(tid)}, ${tag}${p.name}(${ovsLvlL(lv)}) 영입 문의 · 외국인 시장에 나와`,{tid,ref:p.id});
  try{ ovfPush({id:p.id,from:p.fkbo?p.fkbo.from:null},`${tag}${p.name}, ${ovsLvlL(lv)}에서 한국행 추진 · ${tshort(tid)} 영입 문의`,5); }catch(e){}
  if(tid===G.user&&ovwOn(t.id)){ G.ovw=G.ovw.filter(w=>String(w.id)!==String(t.id)); if(!fwatchOn(p.id)&&(G.fwatch||[]).length<8)(G.fwatch=G.fwatch||[]).push({id:p.id,since:G.day,k:0}); }
  return {p,why:''}; }
/* AI 구단: 영입이 필요한 자리에 공개 기록이 좋은 KBO 출신 옛 외국인을 가끔 문의한다(해시, 주 1회). 계약은 시장에서 다른 후보와 같은 점수(fScoreBy)로 고른다 */
function ovqAiScore(a){ const l=(a.lines||[]).slice(-1)[0]; return ovsKboWar(a.id)+(l?Math.max(0,ovsVal(l,!!a.isP))*.5:0); } /* 모두가 보는 공개 기록: KBO 시즌당 WAR + 지난 해외 시즌 가치 */
function ovqAiWeek(){ const me=ME(); let n=0; for(const t of G.teams){ if(t.id===me)continue; const nd=fNeed(t.id); if(!nd||nd.up)continue; if(ovqWindowWhy(t.id,nd.kind))continue; if(ovqH('ovqAi',t.id,G.day)>=OVQ.aiP)continue;
    const C=(G.abroad||[]).filter(a=>a.foreign===nd.kind&&!a.cand&&!a.back&&a.end==null&&a.fr&&(nd.isP==null||!!a.isP===nd.isP)&&!ovqWhy(t.id,a.id)).map(a=>({a,s:ovqAiScore(a)})).filter(x=>x.s>=OVQ.aiMin).sort((x,y)=>y.s-x.s||String(x.a.id).localeCompare(String(y.a.id)));
    if(!C.length)continue; const r=ovsInquire(t.id,C[0].a.id); if(r.p&&!r.why)n++; } return n; }
function ovqWeek(){ try{ ovwSync(); }catch(e){} try{ ovqAiWeek(); }catch(e){} }
/* ===== 저장 정리(해외 활성화 8-7): G.abroad가 시즌마다 커진다. 난수 없이 몇 번 불러도 같은 결과 =====
   - 돌아오거나(back) 은퇴한(end) 기록의 보관본(pj)·능력 사본(fr)·진행 중 줄(cur)은 다시 쓰지 않는다(돌아온 선수는 G.players에 있다).
   - 끝난 외국인·후보 기록은 최근 3시즌 줄만 남긴다(주목 선수·인물 카드는 최근 시즌만 본다). 국내 선수 기록 줄은 모두 남긴다(선수 기록 표).
   - 해외 보관본(pj): 국내 경기 단위 기록과 아마추어 관찰 사본(obsView·obsBy, 직행 선수 한 명 약 12KB)을 빼고, 이야기 기록은 첫 줄과 최근 29개만 남긴다. */
function ovsSlimFix(){ if(!G||!Array.isArray(G.abroad))return 0; let n=0;
  for(const a of G.abroad){ if(!a)continue; const done=a.back||a.end!=null;
    if(done){ if(a.pj!=null){ a.pj=null; n++; } if(a.cur){ delete a.cur; n++; } if(a.fr&&a.end!=null){ delete a.fr; n++; } }
    if(done&&(a.foreign||a.cand)&&(a.lines||[]).length>3){ a.lines.splice(0,a.lines.length-3); n++; }
    if(!done&&a.pj&&!a.foreign){ let p=null; try{ p=JSON.parse(a.pj); }catch(e){} if(p){ let ch=0; if(Array.isArray(p.story)&&p.story.length>30){ p.story.splice(1,p.story.length-30); ch=1; } for(const k of OVS_PJ_DROP)if(k in p){ delete p[k]; ch=1; } if(ch){ a.pj=JSON.stringify(p); n++; } } } }
  if(G.ovsInq&&Array.isArray(G.ovsInq.L)&&G.ovsInq.L.length>OVQ.keep){ G.ovsInq.L.length=OVQ.keep; n++; }
  for(const p of Object.values(G.players||{}))if(p.postRetry!=null&&p.postRetry<G.year-1){ delete p.postRetry; n++; }
  return n; }
