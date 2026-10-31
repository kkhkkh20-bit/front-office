/* ---------- 면담 화면: 구단주 집무실 · 감독실 · 선수 면담 ----------
   상대 얼굴과 대화 말풍선, 아래에 꺼낼 이야기(화제)를 고른다. 결과(승인·반려, 관계·기분 변화)는 대화 속에 한 줄로 남는다 */
const MEET_PL={praise:'요즘 정말 잘해 주고 있어. 고맙다.',push:'솔직히 지금보다 더 해 줘야 한다.',promise:'감독님께 출전 기회를 건의해 보겠네.',contract:'계약 이야기를 좀 해 볼까.',ask:'요즘 고민 있나? 편하게 말해 봐.'};
function meetWho(M){ const t=team(G.user);
  if(M.k==='own'){ const B=bossOf(G.user); return {name:B.own.name,role:'구단주 · 모기업 회장',place:'구단주 집무실',av:avImg({persona:'own',pid:B.own.id,team:G.user,age:B.own.age,expr:relEx(t.trust),name:B.own.name}),rel:`신뢰 ${Math.round(t.trust)} · 친밀도 ${cwRap('own')}(${cwRapLbl(cwRap('own'))})`}; }
  if(M.k==='mgr'){ const m=G.mgr[G.user]; if(!m)return null; return {name:`${m.name} 감독`,role:`${mgrType(m).n} · 말투 ${MV[mgrVoice(m)].l}`,place:'감독실',av:avImg({persona:'mgr',pid:m.id,team:G.user,age:m.age,expr:relEx(m.rel),name:m.name}),rel:`관계 ${m.rel}`}; }
  const p=G.players[M.id]; if(!p)return null; return {name:p.name,role:`${posLabel(p)} · ${p.age}세`,place:'선수 면담실',av:avImg(p),rel:`기분 ${Math.round(p.mor??60)}`}; }
function meetGreet(M){ const t=team(G.user);
  if(M.k==='own'){ const tr=t.trust; return tr>=70?'단장, 잘 왔소. 요즘 분위기가 좋더군. 앉으시오.':tr>=45?'앉으시오. 무슨 일로 왔소?':tr>=25?'바쁘니 용건만 간단히 합시다.':'...할 말이 있으면 해 보시오. 내 인내심도 한계가 있소.'; }
  if(M.k==='mgr'){ const m=G.mgr[G.user]; const v=mgrVoice(m); return M.first?`${m.name}입니다. 믿고 맡겨 주셔서 감사합니다. ${v==='data'?'자료부터 같이 보시죠.':v==='fire'?'바로 이기는 팀 만들겠습니다.':v==='warm'?'선수들 잘 챙기겠습니다.':v==='old'?'기본부터 다시 세우겠습니다.':'차근차근 맞춰 가겠습니다.'} ${foreignOf(G.user).filter(p=>p.foreign==='용병').length<3?'외국인 선수 구성부터 상의드릴까요?':'선수들부터 직접 보겠습니다.'}`:m.rel>=60?'단장님, 들어오세요. 편하게 말씀하시죠.':m.rel>=35?'오셨습니까. 무슨 일로?':'...네, 말씀하시죠.'; }
  const p=G.players[M.id]; const mo=p.mor??60; return mo>=70?'단장님! 무슨 일이세요?':mo>=45?'아, 단장님. 안녕하세요.':'...네. 부르셨어요?'; }
function meetOpen(k,id,o){ o=o||{}; const M={k,id:id??null,log:[],first:!!o.first}; const W=meetWho(M); if(!W){ toast(k==='mgr'?'감독이 없습니다.':'면담할 수 없습니다.'); return; }
  M.log.push({w:'them',t:meetGreet(M)}); UI.meet=M; if(o.ask)meetDo(o.ask); renderSheet(); }
function meetBadF(){ return foreignOf(G.user).filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=60&&pRate(h).era>5):(h.pa>=100&&bRate(h).ops<.700)); }); }
function frepAmt(p){ return round5(Math.max(500,p.sal*.6)); }
/* 꺼낼 수 있는 이야기 */
function meetTopics(M){ const t=team(G.user);
  if(M.k==='own'){ if(t.indie)return [['rep','근황 보고']]; const left=ownAskLeft(); const L=[['rep','근황 보고']];
    for(const a of [1000,2000,3000])L.push([`gen:${a}`,`운영비 ${money(a)} 증액 요청`,oddsTxt(ownOdds(a,null)),!left]);
    const faL=G.fa&&G.fa.open&&!G.fa.closed?G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null).sort((a,c)=>ovr(c)-ovr(a)).slice(0,3):[]; for(const p of faL)L.push([`fa:${p.id}`,`FA ${p.name} 영입 자금 요청`,`${money(p.ask.annual)} · ${oddsTxt(ownOdds(p.ask.annual,{k:'fa',pid:p.id}))}`,!left]);
    for(const p of meetBadF())L.push([`frep:${p.id}`,`외국인 ${p.name} 교체 자금 요청`,`${money(frepAmt(p))} · ${oddsTxt(ownOdds(frepAmt(p),{k:'frep',pid:p.id}))}`,!left]);
    return L; }
  if(M.k==='mgr')return [['now','지금 팀 상황은 어떻습니까?'],['foreign','외국인은 어떤 선수가 필요합니까?'],['cand','시장에 나온 외국인 후보들 어떻게 보세요?'],['need','가장 급한 자리는 어디입니까?'],['young','눈여겨보는 젊은 선수 있습니까?']];
  const used=G.players[M.id]&&G.players[M.id].talkWk===Math.floor(G.day/7); return Object.entries(TALK).map(([k,l])=>[k,l,null,used]); }
function meetDo(v){ const M=UI.meet; if(!M)return; const t=team(G.user); const say=(w,x)=>M.log.push({w,t:x});
  if(M.k==='own'){ if(v==='rep'){ const g=goalStatus(); say('me','회장님, 요즘 상황을 보고드리러 왔습니다.'); say('them',g?`${g.rank.cur?`지금 ${g.rank.cur}위군. `:''}올해 목표는 ${g.rank.t}위 안이오. ${g.rank.cur&&g.rank.cur<=g.rank.t?'지금처럼만 하시오.':'더 분발해야 하오.'}${t.owner==='profit'?' 그리고 적자는 꼭 줄이시오.':t.owner==='pr'?' 팬들 반응도 늘 보고 있소.':''}`:'시즌이 시작되면 다시 이야기합시다.'); return; }
    const [k,x]=v.split(':'); const p=k==='gen'?null:G.players[+x]; const amt=k==='gen'?+x:k==='fa'?p.ask.annual:frepAmt(p); const tr0=t.trust;
    say('me',k==='gen'?`회장님, 운영비 ${money(amt)} 증액을 요청드립니다. 전력 보강과 운영에 꼭 필요합니다.`:k==='fa'?`FA ${p.name} 선수를 잡으려면 ${money(amt)}이(가) 필요합니다. 도와주십시오.`:`외국인 ${p.name}이(가) 기대에 못 미칩니다. 교체할 선수를 데려오려면 ${money(amt)}이(가) 필요합니다.`);
    const r=k==='gen'?ownerAsk(amt,null):ownerAsk(amt,{k,pid:+x}); if(!/^(승인|반려)/.test(r)){ say('sys',r); return; } const ok=/^승인/.test(r);
    say('them',ok?(t.owner==='win'?'좋소. 대신 결과로 보여 주시오.':t.owner==='profit'?'...이번만이오. 돈 쓴 만큼 벌어 오시오.':'알겠소. 팬들을 실망시키지 마시오.'):(t.owner==='profit'?'지금 적자부터 줄이세요.':t.owner==='win'?'성적으로 먼저 증명하시오.':'지금은 때가 아니오.'));
    say('sys',ok?`승인: ${money(amt)} 지원${k==='fa'?' (목적대로 쓰지 않으면 신뢰가 깎입니다)':''}`:`반려 · 구단주 신뢰 ${Math.round(t.trust-tr0)}`); save(); return; }
  if(M.k==='mgr'){ const q=meetTopics(M).find(x=>x[0]===v); if(v.startsWith('fp:')){ const p=G.players[+v.slice(3)]; say('me',`${p?p.name:'이 선수'} 어떻게 보세요?`); say('them',mgrOnForeign(p)); save(); return; }
    say('me',q?q[1]:'');
    if(v==='cand'){ const W=mgrWantForeign(); const mm=G.mgr[G.user]; const sc=x=>mgrEst(mm,x)+(mgrFitF(x,W)?4:0); /* 감독 눈(보고서 + 자기 판단)과 원하는 유형 */
      const M0=(G.fmarket||[]).map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.foreign==='용병'&&fKnows(G.user,p)).sort((a,b)=>sc(b)-sc(a)); const fit=M0.filter(p=>mgrFitF(p,W)); const L=W&&W.want?[...fit.slice(0,2),...M0.filter(p=>!fit.slice(0,2).includes(p))].slice(0,3):M0.slice(0,3); /* 원하는 유형을 먼저, 그다음 눈에 띄는 다른 선수 */
      if(!L.length){ say('them','지금 시장에 마음에 드는 후보가 없습니다. 스카우트에게 더 찾아보라고 하시죠.'); save(); return; }
      say('them',`직접 본 선수는 없어서 영상과 스카우트 보고서로 골랐습니다. 제 눈에 들어온 후보 ${L.length}명입니다.`); for(const p of L)say('them',`${p.name} (${posLabel(p)}, ${p.age}세, ${p.prevLvl||p.nat||''}): ${mgrOnForeign(p)}`); save(); return; }
    const r=mgrTalk(v); const ch=G.mgrChat&&G.mgrChat[0]; say('them',ch&&ch.d===G.day&&ch.t===v?ch.a:r.a||'...'); if(/관계 \+1/.test(r.a||''))say('sys','자주 의논해 주셔서 감독 관계 +1'); save(); return; }
  const p=G.players[M.id]; say('me',MEET_PL[v]||TALK[v]); const r=talk(M.id,v); say('them',(r.msg||'').replace(/^[^:]+: "(.*)"$/,'$1')); if(r.d)say('sys',`${p.name} 기분 ${r.d>0?'+':''}${Math.round(r.d)}`); save(); }
function meetSheet(){ const M=UI.meet; const W=meetWho(M); if(!W)return ''; const T=meetTopics(M);
  const log=M.log.map(x=>x.w==='sys'?`<div class="mt-sys">${esc(x.t)}</div>`:`<div class="mt-l ${x.w}">${x.w==='them'?`<span class="mt-av">${W.av}</span>`:''}<p>${esc(x.t)}</p></div>`).join('');
  const own=M.k==='own'&&!team(G.user).indie; const left=own?ownAskLeft():1;
  return `<div class="scrim" data-a="meetClose"><div class="sheet gut meet" data-stop="1" role="dialog" aria-label="${esc(W.place)}">
    <div class="sheet-head"><div class="mt-h">${W.av}<div><span class="eyebrow">${esc(W.place)}</span><h2 class="sec">${esc(W.name)}</h2><span class="small muted">${esc(W.role)} · ${esc(W.rel)}</span></div></div><button class="x" data-a="meetClose" aria-label="닫기">×</button></div>
    <div class="mt-log" id="mt-log">${log}</div>
    <div class="mt-opts"><span class="eyebrow">꺼낼 이야기${own&&!left?' · 이번 달 지원 요청은 이미 했습니다':''}${M.k==='pl'&&T.every(x=>x[3])?' · 이번 주에는 이미 이야기를 나눴습니다. 다음 주에 다시 부르세요':''}</span>${T.map(([k,l,sub,dis])=>`<button class="mt-o" data-a="meetDo" data-v="${k}" ${dis?'disabled':''}><b>${esc(l)}</b>${sub?`<i>${esc(sub)}</i>`:''}</button>`).join('')}<button class="mt-o end" data-a="meetClose"><b>면담 마치기</b></button></div></div></div>`; }
/* 면담 입구: 상대 얼굴 + 들어가기 */
function meetDoor(k){ const W=meetWho({k}); if(!W)return ''; const t=team(G.user);
  const sub=k==='own'?(ownAskLeft()?'운영비 증액 · FA 영입 자금 · 외국인 교체 자금 · 근황 보고':'이번 달 지원 요청은 이미 했습니다 · 근황 보고는 가능'):'팀 상황 · 원하는 외국인 · 외국인 후보 의견 · 급한 자리 · 젊은 선수';
  return `<button class="mt-door" data-a="meetOpen" data-v="${k}">${W.av}<span><b>${k==='own'?'구단주 집무실로 가기':'감독실 들어가기'}</b><i>${esc(W.name)} · ${esc(W.rel)}</i><i>${sub}</i></span><em>›</em></button>`; }
