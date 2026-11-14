/* ---------- 면담 화면: 구단주 집무실 · 감독실 · 선수 면담 ----------
   상대 얼굴과 대화 말풍선, 아래에 꺼낼 이야기(화제)를 고른다. 결과(승인·반려, 관계·기분 변화)는 대화 속에 한 줄로 남는다 */
const MEET_PL={praise:'요즘 정말 잘해 주고 있어. 고맙다.',push:'솔직히 지금보다 더 해 줘야 한다.',promise:'감독님께 출전 기회를 건의해 보겠네.',futreq:'2군 감독님께 자네를 꾸준히 써 달라고 하겠네.',contract:'계약 이야기를 좀 해 볼까.',ask:'요즘 고민 있나? 편하게 말해 봐.'};
function meetWho(M){ const t=team(G.user);
  if(M.k==='own'){ const B=bossOf(G.user); if((M.tid!=null&&M.tid!==G.user)||(M.person!=null&&M.person!==B.own.id)||(M.log&&M.person==null))return null; return {name:B.own.name,role:'구단주 · 모기업 회장',place:'구단주 집무실',av:avImg({persona:'own',pid:B.own.id,team:G.user,age:B.own.age,expr:relEx(t.trust),name:B.own.name}),rel:`신뢰 ${Math.round(t.trust)} · 친밀도 ${cwRapLbl(cwRap('own'))}`}; }
  if(M.k==='gm'){const t=team(M.id),m=gmOf(M.id);if(!t||M.id===G.user)return null;return {name:m?.name||t.nick+' 단장',role:tname(M.id)+' 단장',place:'단장 간 면담',av:avImg({persona:'gm',pid:m?.id||M.id,team:M.id,age:m?.age||50,name:m?.name||'단장'}),rel:'양 구단 관계 '+Math.round(t.rel??50)+' · 개인 친밀도 '+relLabel(Math.round(personalGMContact(M.id)?.bond??30))};}
  if(M.k==='mgr'){ const m=G.mgr[G.user]; if(!m||(M.mid&&M.mid!==m.id))return null; return {name:`${m.name} 감독`,role:`${mgrType(m).n} · ${MTSTY[mgrTalkSty(m)].l}`,place:M.visit?'단장실':'감독실',av:avImg({persona:'mgr',pid:m.id,team:G.user,age:m.age,expr:relEx(m.rel),name:m.name}),rel:`관계 ${relLabel(m.rel)}`}; }
  const p=G.players[M.id]; if(!p)return null; return {name:p.name,role:`${posLabel(p)} · ${p.age}세`,place:'선수 면담실',av:avImg(p),rel:`기분 ${Math.round(p.mor??60)} · ${friendshipLabel(p)}`}; }
function meetGreet(M){ const t=team(G.user);
  if(M.k==='own'){ const tr=t.trust; return tr>=70?'단장, 잘 왔소. 요즘 분위기가 좋더군. 앉으시오.':tr>=45?'앉으시오. 무슨 일로 왔소?':tr>=25?'바쁘니 용건만 간단히 합시다.':'...할 말이 있으면 해 보시오. 내 인내심도 한계가 있소.'; }
  if(M.k==='gm')return gmPersonalReply(M.id,'check');
  if(M.k==='mgr')return mvGreeting(G.mgr[G.user],M);
  const p=G.players[M.id]; const mo=p.mor??60; return mo>=70?'단장님! 무슨 일이세요?':mo>=45?'아, 단장님. 안녕하세요.':'...네. 부르셨어요?'; }
function meetOpen(k,id,o){ if(k==='gm'){ const w=personalAway(); if(w){ toast(`${w} 다른 구단 단장 면담은 귀국한 뒤에 할 수 있습니다.`); return; } } /* 출장 중에는 사람을 만나는 활동이 쉰다(검수 154) */ if(k==='pl'||k==='gm')peopleCapture((k==='pl'?'p:':'gm:')+id);o=o||{}; const M={k,...(k==='own'?{tid:G.user,person:bossOf(G.user).own.id}:{}),id:id??null,log:[],first:!!o.first,visit:!!o.visit,returnY:document.documentElement.classList.contains('detail-page-open')?sheetScrollY():scrollY,returnDetail:document.documentElement.classList.contains('detail-page-open'),mid:k==='mgr'?G.mgr[G.user]?.id:null,bs:UI.sheet??null,bp:UI.person??null}; const W=meetWho(M); if(!W){ toast(k==='mgr'?'감독이 없습니다.':'면담할 수 없습니다.'); return; }
  meetKeep(); UI.sheet=null; UI.person=null; /* 면담 전에 보던 상세는 M.bs·M.bp에 두었다가 면담을 마치면 다시 연다 */
  const H=meetHeld(k); if(H&&!o.ask&&H.mid===M.mid){ UI.meetHold=null; Object.assign(H,{returnY:M.returnY,returnDetail:M.returnDetail,bs:M.bs,bp:M.bp,logCount:-1}); H.log.push({w:'sys',t:'하던 이야기를 이어 합니다'}); UI.meet=H; render(); return; }
  /* 같은 날 다시 들어오면 앞서 나눈 이야기를 그대로 이어 보여 준다(사용자 11-13: 다음 화제를 고르거나 다시 열면 지난 대화가 사라짐) */
  const D=meetDayLog(M); if(D){ M.log=D.log; M.answers=D.answers; M.log.push({w:'sys',t:'여기까지 앞서 나눈 이야기'}); UI.meet=M; if(o.ask)meetDo(o.ask); render(); return; }
  if(k==='pl'){ const p=G.players[M.id]; const TL=(p&&p.talkLog)||[]; if(TL.length)M.log.push({w:'sys',t:`최근 면담 · ${TL.slice(0,3).map(x=>`${dmd(x.d)} ${TALK[x.k]||x.k}: "${x.a}"`).join(' / ')}`}); if(futReqOn(p))M.log.push({w:'sys',t:`2군 주전 기용 요청: ${dmd(p.futReq.until)}까지`}); if(p&&p.promise)M.log.push({w:'sys',t:`약속: 출전 기회 건의 · ${dmd(p.promise.until)}까지 감독이 기회를 주는지 확인`}); }
  M.log.push({w:'them',t:meetGreet(M)}); UI.meet=M; if(o.ask)meetDo(o.ask); render(); }
/* 대화 중 이름 링크로 연 선수·인물 창은 면담 위에 그리고, 닫으면 같은 마디·같은 선택지로 돌아온다(카페 11-09d) */
const meetOver=()=>!!UI.meet&&(UI.sheet!=null||UI.person!=null);
/* 끝나지 않은 장면(감독·구단주 대화)은 다른 화면에 다녀와도 같은 날 안에는 이어 한다. shortcut: 화면 상태라 새로고침하면 사라진다, 필요하면 G로 옮긴다 */
function meetKeep(){ const M=UI.meet; if(M&&M.sc&&M.sc.node)UI.meetHold=Object.assign(M,{g:G,day:G.day}); meetDaySave(M); }
/* 그날의 대화 기록: 화면을 떠나도 같은 날에는 남는다. 감독 답변은 저장에도 남아(G.mgrChat) 새로고침 뒤에도 그날 대화를 되살린다 */
const MEET_LOG_MAX=40;
function meetDayKey(M){ return M.k+':'+(M.k==='mgr'?(M.mid??''):M.k==='own'?(M.person??''):(M.id??'')); }
function meetDaySave(M){ if(!M||!M.log||!M.log.some(x=>x.w==='me'))return; const log=M.log.filter(x=>!(x.w==='sys'&&/^(여기까지 앞서 나눈 이야기|앞서 나눈 이야기|하던 이야기를 이어 합니다)$/.test(x.t))).slice(-MEET_LOG_MAX); (UI.meetDay=UI.meetDay||{})[meetDayKey(M)]={g:G,day:G.day,log,answers:M.answers}; }
function meetDayLog(M){ const D=UI.meetDay&&UI.meetDay[meetDayKey(M)]; if(D&&D.g===G&&D.day===G.day&&D.log.length)return {log:D.log.slice(),answers:D.answers};
  if(M.k==='mgr'){ const C=(G.mgrChat||[]).filter(c=>c.d===G.day).reverse(); if(!C.length)return null; const T=meetTopics({k:'mgr'}), log=[]; for(const c of C){ const q=T.find(x=>x[0]===c.t); if(q)log.push({w:'me',t:q[1]}); log.push({w:'them',t:c.a}); } return {log,answers:undefined}; }
  return null; }
function meetHeld(k){ const H=UI.meetHold; return H&&H.g===G&&H.day===G.day&&H.k===k&&H.sc&&H.sc.node&&(k!=='own'||meetWho(H))?H:null; }
/* 장면 대답 한 번: 내 말 → 상대 반응 → 결과 한 줄 → 상대의 다음 말(질문) 순서로 남긴다(11-09e) */
function meetScn(M,r){ if(r.me)M.log.push({w:'me',t:r.me}); if(r.say[0])M.log.push({w:'them',t:r.say[0]}); if(r.sys.length)M.log.push({w:'sys',t:r.sys.join(' · ')}); r.say.slice(1).forEach(t=>M.log.push({w:'them',t})); M.sc=r.st; }
function meetBadF(){ return foreignOf(G.user).filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=60&&pRate(h).era>5):(h.pa>=100&&bRate(h).ops<.700)); }); }
function frepAmt(p){ return round5(Math.max(500,p.sal*.6)); }
/* 꺼낼 수 있는 이야기 */
function meetTopics(M){ const t=team(G.user);
  if(M.k==='own'){ if(t.indie)return [['rep','근황 보고']]; if(M.sc){ const C=talkChoices(M.sc); return talkOrder(M.sc).map(i=>['sc:'+i,C[i]]); } /* 대답 순서는 장면·마디마다 섞는다(11-12) */ const left=ownAskLeft(), od=G.day-ownScnMem().d<7; const L=[['talk','회장님과 이야기 나누기',od?'이번 주에는 이미 나눴습니다':`${OWNER[t.owner].label} · 일주일에 한 번`],['rep','근황 보고']]; /* 주고받는 대화(11-09e) */
    for(const a of [1000,2000,3000])L.push([`gen:${a}`,`운영비 ${money(a)} 증액 요청`,oddsTxt(ownOdds(a,null)),!left]);
    const faL=G.fa&&G.fa.open&&!G.fa.closed?G.fa.pool.map(id=>G.players[id]).filter(p=>p&&p.team==null).sort((a,c)=>ovr(c)-ovr(a)).slice(0,3):[]; for(const p of faL)L.push([`fa:${p.id}`,`FA ${p.name} 영입 자금 요청`,`${money(p.ask.annual)} · ${oddsTxt(ownOdds(p.ask.annual,{k:'fa',pid:p.id}))}`,!left]);
    for(const p of meetBadF())L.push([`frep:${p.id}`,`외국인 ${p.name} 교체 자금 요청`,`${money(frepAmt(p))} · ${oddsTxt(ownOdds(frepAmt(p),{k:'frep',pid:p.id}))}`,!left]);
    return L; }
  if(M.k==='gm')return [['plan','앞으로의 운영 계획은?'],['trade','선수 거래에서 무엇을 봅니까?'],['check','양 구단 관계를 이야기합시다']];
  if(M.k==='mgr'){ if(M.sc){ const C=mgrTalkChoices(M.sc); return talkOrder(M.sc).map(i=>['sc:'+i,C[i]]); } const mm=G.mgr[G.user], done=mm&&mm.scn&&mm.scn.d===G.day; /* 장면 중에는 대답 2~3개만 */
    if(M.use!=null){ const p=G.players[M.use], r=p&&rpLive(p); if(p){ const {c,gap}=useComp(p,useKind(p)); const vs=c?`마지막 자리 ${c.name}보다 ${gap>0?`${gap} 처짐`:gap<0?`${-gap} 앞섬`:'비슷함'}`:'자리에 여유'; return [...(r&&!rpromK(G.user,p)?[['uz:role',`계약 때 약속한 역할(${r.l.replace(' 보장','')})대로 써 달라고 건의`,vs]]:[]),['uz:alt',r?`대신 다른 기회(${p.isP?'롱릴리프·스윙맨':'대타·선발 몇 경기'})라도`:'출전 기회를 더 달라고 건의','30일 안에 출전 기회 · 감독이 받아들이기 쉬움'],...(!p.isP?subsOf(p).slice(0,3).map(k=>{ const at=depth(G.user).ln[k]; return ['uz:pos:'+k,`${POSK[k]||k}로도 써 달라고 건의`,at&&at.id!==p.id?`지금 ${POSK[k]||k} ${at.name}`:'그 자리 숙련도 '+(pexpOf(p)[k]||0)]; }):[]),['uz:respect','성적이 안 되면 감독님 판단을 존중하겠다'],['uz:back','다른 이야기를 하겠습니다']]; } }
    const UC=useCands(), ud=depth(G.user); /* 선수 기용 건의: 약속 위반 선수 먼저 */
    return [...(UC.length?UC.map(p=>['use:'+p.id,`${p.name} 기용 건의`,rpLive(p)&&!promKept(p,p.roleProm,ud)?`계약 약속 ${p.roleProm.l} · 지금 ${roleNowTxt(p,ud)}`:`지금 ${roleNowTxt(p,ud)} · 기분 ${moodLabel(p.mor??60)}`]):[['use','선수 기용 건의','출전·역할 불만인 선수가 없습니다',true]]),['talk','감독과 이야기 나누기',done?'오늘은 이미 나눴습니다':`${MTSTY[mgrTalkSty(mm)].l} · 하루 한 번`],['now','지금 팀 상황은 어떻습니까?'],['foreign','외국인은 어떤 선수가 필요합니까?'],['cand','시장에 나온 외국인 후보들 어떻게 보세요?'],['need','가장 급한 자리는 어디입니까?'],['young','눈여겨보는 젊은 선수 있습니까?'],['pitch','선발과 불펜은 어떻게 보고 있습니까?'],['bat','타선의 흐름은 어떻습니까?'],['defense','수비에서 챙길 부분은 무엇입니까?'],['run','도루와 추가 진루는 어떻게 가져갈까요?'],['workload','지친 선수와 휴식 계획을 봅시다'],['clubhouse','선수단 분위기는 어떻습니까?'],['plan','보강과 육성의 우선순위를 맞춰 봅시다']]; }
  const p=G.players[M.id]; return Object.entries(TALK).filter(([k])=>k!=='futreq'||(p&&!p.e1)).map(([k,l])=>[k,l,k==='ask'?'언제든 물어볼 수 있습니다':talkUsed(p,k)?'이번 주에는 했습니다':null,talkUsed(p,k)]); }
function meetDo(v){ const M=UI.meet; if(!M)return; const t=team(G.user); const say=(w,x)=>M.log.push({w,t:x});
  if(M.k==='gm'){say('me',meetTopics(M).find(x=>x[0]===v)?.[1]||'근황이 어떻습니까?');say('them',gmPersonalReply(M.id,v));save();return;}
  if(M.k==='own'){ if(!meetWho(M)){say('sys','면담 상대가 자리를 떠나 이야기를 마칩니다.');M.sc=null;return;} if(v==='talk'){ say('me','회장님, 잠깐 말씀 나누시죠.'); const r=ownTalkStart(); r.say.forEach(x=>say('them',x)); M.sc=r.st; save(); return; }
    if(v.startsWith('sc:')){ const r=ownTalkPick(M.sc,+v.slice(3)); meetScn(M,r); save(); return; }
    if(v==='rep'){ const g=goalStatus(); say('me','회장님, 요즘 상황을 보고드리러 왔습니다.'); say('them',ownerPersonalReport()); return; }
    const [k,x]=v.split(':'); const p=k==='gen'?null:G.players[+x]; const amt=k==='gen'?+x:k==='fa'?p.ask.annual:frepAmt(p); const tr0=t.trust;
    say('me',k==='gen'?`회장님, 운영비를 ${money(amt)} 더 받고 싶습니다. 보강할 자리가 있습니다.`:k==='fa'?`FA ${p.name} 선수를 잡으려면 ${money(amt)}이(가) 더 듭니다. 도와주십시오.`:`외국인 ${p.name}을(를) 바꿔야겠습니다. 새 선수를 데려오려면 ${money(amt)}이(가) 듭니다.`);
    const r=k==='gen'?ownerAsk(amt,null):ownerAsk(amt,{k,pid:+x}); if(!/^(승인|반려)/.test(r)){ say('sys',r); return; } const ok=/^승인/.test(r);
    say('them',ok?(t.owner==='win'?'좋소. 대신 결과로 보여 주시오.':t.owner==='profit'?'...이번만이오. 돈 쓴 만큼 벌어 오시오.':'알겠소. 팬들을 실망시키지 마시오.'):(t.owner==='profit'?'적자부터 줄이시오.':t.owner==='win'?'성적부터 내 오시오.':'지금은 때가 아니오.'));
    say('sys',ok?`승인: ${money(amt)} 지원${k==='fa'?' · 이 선수 영입에만 써야 합니다':''}`:`반려${t.trust<tr0?' · '+fxSoft('tr',t.trust-tr0):''}`); save(); return; }
  if(M.k==='mgr'){const mm0=G.mgr[G.user];if(!meetWho(M)){say('sys','면담 상대가 자리를 떠났습니다.');return;}
    if(v==='talk'){ say('me','감독님, 잠깐 이야기 좀 하시죠.'); const r=mgrTalkStart(mm0); r.say.forEach(x=>say('them',x)); M.sc=r.st; save(); return; } /* 스타일 대화(11-08c) */
    if(v.startsWith('sc:')){ const r=mgrTalkPick(mm0,M.sc,+v.slice(3)); meetScn(M,r); save(); return; }
    if(v.startsWith('use:')){ const p=G.players[+v.slice(4)]; if(!p||p.team!==G.user){ say('sys','건의할 수 없는 선수입니다.'); return; } M.use=p.id; say('me',`${p.name} 기용 문제로 드릴 말씀이 있습니다.`); say('them',mgrUseView(p)); save(); return; } /* 선수 기용 건의(카페 11-09) */
    if(v.startsWith('uz:')){ const c=v.slice(3), id=M.use; M.use=null; if(c==='back'){ say('me','알겠습니다. 다른 이야기를 하시죠.'); return; } const r=mgrUseAsk(id,c); if(r.me)say('me',r.me); say('them',r.a); if(r.sys)say('sys',fxSoftText(r.sys)); save(); return; }
    const last=(M.answers||{})[v],key=mvDialogueKey(mm0,v);if(last&&last.d===G.day&&last.key===key){const q0=meetTopics(M).find(x=>x[0]===v);say('me',q0?q0[1]:'같은 선수에 대한 의견은 어떻습니까?');say('them',mvRepeat(mm0));return;}(M.answers=M.answers||{})[v]={d:G.day,key}; const q=meetTopics(M).find(x=>x[0]===v); if(v.startsWith('fp:')){ const p=G.players[+v.slice(3)]; say('me',`${p?p.name:'이 선수'} 어떻게 보세요?`); say('them',mgrOnForeign(p)); save(); return; }
    say('me',q?q[1]:'');
    if(v==='cand'){ const W=mgrWantForeign(); const mm=G.mgr[G.user]; const sc=x=>mgrEst(mm,x)+(mgrFitF(x,W)?4:0); /* 감독 눈(보고서 + 자기 판단)과 원하는 유형 */
      const M0=(G.fmarket||[]).map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.foreign==='용병'&&fKnows(G.user,p)).sort((a,b)=>sc(b)-sc(a)); const fit=M0.filter(p=>mgrFitF(p,W)); const L=W&&W.want?[...fit.slice(0,2),...M0.filter(p=>!fit.slice(0,2).includes(p))].slice(0,3):M0.slice(0,3); /* 원하는 유형을 먼저, 그다음 눈에 띄는 다른 선수 */
      if(!L.length){ say('them','지금 시장에 마음에 드는 후보가 없습니다. 스카우트에게 더 찾아보라고 하시죠.'); save(); return; }
      say('them',mvCandidateIntro(mm,L.length)); for(const p of L)say('them',`${p.name} (${posLabel(p)}, ${p.age}세, ${p.prevLvl||p.nat||''}): ${mgrOnForeign(p)}`); save(); return; }
    const r=mgrTalk(v); const ch=G.mgrChat&&G.mgrChat[0]; say('them',ch&&ch.d===G.day&&ch.t===v?ch.a:r.a||'...');M.answers[v]={d:G.day,key:mvDialogueKey(mm0,v)}; if(r.warm)say('sys','감독이 고마워합니다'); save(); return; }
  const p=G.players[M.id]; say('me',MEET_PL[v]||TALK[v]); const r=talk(M.id,v); say('them',(r.msg||'').replace(/^[^:]+: "(.*)"$/,'$1')); if(Math.abs(r.d)>=1)say('sys',fxSoft('pm',r.d,p.name)); save(); }
function meetPage(){ const M=UI.meet,W=meetWho(M); if(!W)return `<section class="card"><p>면담 상대가 자리를 떠났습니다.</p><button class="btn" data-a="meetClose">이전 화면으로</button></section>`;const T=meetTopics(M),own=M.k==='own'&&!team(G.user).indie,left=own?ownAskLeft():1;
  const log=M.log.map(x=>x.w==='sys'?`<div class="mt-sys">${esc(x.t)}</div>`:`<div class="mt-l ${x.w}">${x.w==='them'?`<span class="mt-av">${W.av}</span>`:''}<div><small>${x.w==='them'?esc(W.name):'단장'}</small><p>${esc(x.t)}</p></div></div>`).join('');
  return `<section class="meet-page" aria-label="${esc(W.place)} 면담"><header class="meet-heading"><div class="mt-h">${W.av}<div><span class="eyebrow">${esc(W.place)} · 면담</span><h2 class="sec">${esc(W.name)}</h2><span class="small muted">${esc(W.role)} · ${esc(W.rel)}</span></div></div><div class="meet-tools">${M.k==='pl'||M.k==='gm'?relNav((M.k==='pl'?'p:':'gm:')+M.id):''}<button class="btn small" data-a="meetClose">면담 마치기</button></div></header>
  <div class="meet-workspace"><div class="meet-conversation"><div class="meet-log-label">대화 기록<span>${dmd(G.day)}</span></div><div class="mt-log" id="mt-log" role="log" aria-live="polite">${log}</div></div>
  <aside class="mt-opts${M.sc?' scene':''}" aria-label="${M.sc?'단장 대답':'면담 화제'}"><span class="eyebrow">${M.sc?`대답 고르기 · ${M.sc.beat+1}번째`:'꺼낼 이야기'}${own&&!left?' · 이번 달 지원 요청 완료':''}${M.k==='pl'&&T.some(x=>x[3])?' · 이번 주 면담 제한 적용':''}</span>${T.map(([k,l,sub,dis])=>`<button class="mt-o${M.topic===k?' selected':''}" data-a="meetDo" data-v="${k}" ${dis?'disabled':''}><b>${esc(l)}</b>${sub?`<i>${esc(sub)}</i>`:''}</button>`).join('')}</aside></div></section>`; }
function meetWire(){const box=document.querySelector('.meet-page'),M=UI.meet;if(!box||!M)return;document.querySelector('#app main.content')?.classList.add('ws-frame','meeting-workspace');const nav=document.querySelector('.bnav'),nr=nav?.getBoundingClientRect(),bottom=nr&&nr.height&&getComputedStyle(nav).display!=='none'?Math.max(0,innerHeight-nr.top):0;box.style.height=Math.max(100,(innerHeight-box.getBoundingClientRect().top-bottom-12)/uiZ())+'px';
 const log=box.querySelector('.mt-log');if(log){const fresh=M.logCount!==M.log.length,bound=log.dataset.meetBound==='1';const toEnd=()=>{log.scrollTop=log.scrollHeight;M.logY=log.scrollTop;};
  /* 채팅처럼 끝에 붙어 있을 때만 끝을 따라간다: 새 답변이 오면 끝으로, 글꼴·사진 배치나 아래 칸 크기 변화로 높이가 바뀌어도 끝 유지(검수 11-11: 좁은 화면에서 20px 모자람). 읽으려고 위로 올렸으면 그대로 둔다 */
  if(fresh){M.logEnd=true;toEnd();}else if(!bound){if(M.logEnd)toEnd();else log.scrollTop=M.logY||0;}M.logCount=M.log.length;M.logY=log.scrollTop;
  if(!bound){log.dataset.meetBound='1';log.addEventListener('scroll',()=>{if(UI.meet===M){M.logY=log.scrollTop;M.logEnd=log.scrollHeight-log.clientHeight-log.scrollTop<=4;}},{passive:true});
   if(typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(()=>{if(!log.isConnected){ro.disconnect();return;}if(UI.meet===M&&M.logEnd)toEnd();});ro.observe(log);for(const c of log.children)ro.observe(c);}
   requestAnimationFrame(()=>{if(log.isConnected&&UI.meet===M&&M.logEnd)toEnd();});}}
 const opts=box.querySelector('.mt-opts');if(opts&&!opts.dataset.meetBound){opts.scrollTop=M.optsY||0;opts.dataset.meetBound='1';opts.addEventListener('scroll',()=>{if(UI.meet===M)M.optsY=opts.scrollTop;},{passive:true});}}

/* 면담 입구: 상대 얼굴 + 들어가기 */
function meetDoor(k){ const W=meetWho({k}); if(!W)return ''; const t=team(G.user);
  const sub=k==='own'?(ownAskLeft()?'회장님과 이야기 · 운영비 증액 · FA 영입 자금 · 외국인 교체 자금 · 근황 보고':'이번 달 지원 요청은 이미 했습니다 · 이야기와 근황 보고는 가능'):'감독 스타일 대화 · 팀 상황 · 원하는 외국인 · 외국인 후보 의견 · 급한 자리 · 젊은 선수';
  return `<button class="mt-door" data-a="meetOpen" data-v="${k}">${W.av}<span><b>${meetHeld(k)?'하던 이야기 이어 하기':k==='own'?'구단주 집무실로 가기':'감독실 들어가기'}</b><i>${esc(W.name)} · ${esc(W.rel)}</i><i>${sub}</i></span><em>›</em></button>`; }
