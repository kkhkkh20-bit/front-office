/* ===== 인물 이력부 (장기 기획 11-11) =====
   선수→코치→감독→단장으로 이어지는 한 사람의 경력을 한곳에 남긴다. 기존 기록(선수 시즌 기록·은퇴 보관·OB·역대 단장)은 그대로 쓰고,
   빠져 있던 것만 G.plog에 영구히 쌓는다: 이적(이적 기록 p.tLog는 2년만 남는다), 감독·코치·단장 부임/퇴임, 은퇴 뒤 진로.
   - 사람 키: 선수 출신은 'pl:선수ID'(코치가 OB면 OB의 fid), 감독 'mgr:ID', 코치 'staff:ID', AI 단장 'gm:ID', 내 단장 'me:계보'.
   - 부임/퇴임은 날마다 각 구단 자리 주인을 비교해 바뀐 것만 적는다(채용·경질 경로가 많아 함수마다 걸지 않는다) */
const PL_MAX=60; /* 한 사람당 줄 상한 */
function plogInit(){ return G.plog=G.plog||{p:{},n:{},seat:null}; }
function plogAdd(key,e){ if(!key)return; const L=plogInit(); const A=L.p[key]=L.p[key]||[]; A.push({y:G.year,d:G.day,...e}); if(A.length>PL_MAX)A.splice(0,A.length-PL_MAX); }
function plogName(key,n){ if(key&&n)plogInit().n[key]=n; }
function plKeyCoach(c){ if(!c)return null; const ob=c.ob!=null?(G.ob||[]).find(o=>o.id===c.ob):null; return ob&&typeof ob.fid==='number'?'pl:'+ob.fid:'staff:'+c.id; }
function plKeyMgr(m){ if(!m)return null; return m.fid!=null?'pl:'+m.fid:'mgr:'+m.id; }
/* 지금 자리 주인: {구단:자리 → {key,name}} */
function plSeats(){ const S={}; for(const t of G.teams){ const m=G.mgr&&G.mgr[t.id]; if(m&&!m.interim)S[t.id+':mgr']={key:plKeyMgr(m),name:m.name};
    const C=G.coach&&G.coach[t.id]; if(C)for(const r in C){ const c=C[r]; if(c&&typeof c==='object'&&c.id!=null)S[t.id+':c:'+r]={key:plKeyCoach(c),name:c.name}; }
    if(t.id===G.user&&!G.unemp){ try{ S[t.id+':gm']={key:'me:'+legMeK(),name:legMeName()}; }catch(e){} } else if(t.gm&&!t.gm.interim)S[t.id+':gm']={key:'gm:'+t.gm.id,name:t.gm.name}; }
  return S; }
function plRoleL(seat){ const r=seat.split(':').slice(1); return r[0]==='mgr'?'감독':r[0]==='gm'?'단장':(CROLE[r[1]]||{}).l||'코치'; }
function plogDaily(){ const L=plogInit(); const now=plSeats(); if(!L.seat){ L.seat={}; for(const s in now){ L.seat[s]=now[s]; plogName(now[s].key,now[s].name); } return; } /* 처음: 지금 상태만 기억(이전 이력은 모른다) */
  const seen=new Set([...Object.keys(L.seat),...Object.keys(now)]);
  for(const s of seen){ const a=L.seat[s], b=now[s]; if(a&&b&&a.key===b.key)continue; const tid=+s.split(':')[0], role=plRoleL(s);
    if(a)plogAdd(a.key,{k:'end',role,tid}); if(b){ plogAdd(b.key,{k:'start',role,tid}); plogName(b.key,b.name); } if(b)L.seat[s]=b; else delete L.seat[s]; } }
/* 선수 이동·은퇴 진로(영구) */
function plogMove(p,from,to,type){ if(!p||p.foreign||from===to)return; plogName('pl:'+p.id,p.name); plogAdd('pl:'+p.id,{k:'move',f:from??null,t:to??null,why:type||''}); }
function plogRetire(p,path){ if(!p)return; plogName('pl:'+p.id,p.name); plogAdd('pl:'+p.id,{k:'retire',tid:p.team??p.relT??null,path:path||null}); }
/* 한 사람의 이력 줄(오래된 순): 선수 시즌(구단별로 묶음)·이적·은퇴·지도자/프런트 */
function personTimeline(key){ const out=[]; const L=plogInit(); const A=L.p[key]||[];
  if(key&&key.startsWith('pl:')){ const id=+key.slice(3), p=G.players[id]||(G.arch&&G.arch[id]?archP(G.arch[id]):null);
    if(p){ const rows=(p.hist||[]).filter(h=>h.lvl==='1군'&&!h.y2).sort((a,b)=>a.y-b.y); let cur=null; for(const h of rows){ if(cur&&cur.tid===h.t&&h.y<=cur.y1+1){ cur.y1=h.y; cur.war+=warOf(h,p)||0; continue; } cur={y0:h.y,y1:h.y,tid:h.t,war:warOf(h,p)||0}; out.push({y:h.y,k:'play',ref:cur}); }
      for(const x of out)if(x.k==='play'){ const c=x.ref; x.t=`선수 · ${tshort(c.tid,c.y0)} ${c.y0===c.y1?c.y0:c.y0+'~'+c.y1} (1군 WAR ${c.war.toFixed(1)})`; }
      for(const a of (p.aw||[]).slice(-12))out.push({y:+String(a).slice(0,4)||null,k:'award',t:`수상 · ${a}`}); } }
  for(const e of A){ if(e.k==='move')out.push({y:e.y,k:'move',t:`${e.why||'이동'} · ${e.f!=null?tshort(e.f,e.y):'무소속'} → ${e.t!=null?tshort(e.t,e.y):'무소속'}`});
    else if(e.k==='retire')out.push({y:e.y,k:'retire',t:`현역 은퇴${e.tid!=null?' · '+tshort(e.tid,e.y):''}${e.path?' · 진로: '+({coach:'지도자',scout:'스카우트',media:'해설위원',front:'프런트'}[e.path]||e.path):''}`});
    else if(e.k==='start')out.push({y:e.y,k:'start',t:`${tshort(e.tid,e.y)} ${e.role} 부임`});
    else if(e.k==='end')out.push({y:e.y,k:'end',t:`${tshort(e.tid,e.y)} ${e.role} 퇴임`}); }
  return out.filter(x=>x.y!=null).sort((a,b)=>a.y-b.y||(a.k==='play'?-1:0)); }
/* 은퇴 진로: OB가 만들어질 때(obFromPlayer) 이력부에 남긴다 */
(function(){ try{ const f=obFromPlayer; obFromPlayer=function(p,rec){ const r=f.apply(this,arguments); try{ const ob=(G.ob||[]).find(o=>o.fid===p.id); plogRetire(p,ob&&ob.path); }catch(e){} return r; }; }catch(e){} })();

/* 은퇴 투어 결정(09_stoveleague retireNotice) */
EVH.retTour={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||p.team!==G.user)return '이제 우리 선수가 아닙니다.'; (G.evlog=G.evlog||[]).push({k:'retTour',y:G.year}); if(i!==0)return '시즌 뒤 은퇴식만 준비합니다.';
  G.spend.etc=(G.spend.etc||0)+e.data.c; if(G.pr)G.pr.fan=clamp(G.pr.fan+3,0,100); p.mor=clamp((p.mor??60)+10,0,100); p.retTour=G.year; story(p,`${G.year} 은퇴 투어`,'award'); news('구단',`${tshort(G.user)} ${p.name}, 은퇴 투어 시작`,`마지막 시즌 원정 경기마다 상대 구단 팬들과 작별 인사를 나눕니다.`,1,{tid:G.user,ref:p.id}); return '은퇴 투어를 시작했습니다.'; } };

/* 관심 선수 소식(커뮤니티 건의 11-11): 날마다 관심 명단 선수의 상태를 비교해, FA 시장·포스팅·트레이드 매물·이적·은퇴로 바뀌면 알린다 */
function pwatchDaily(){ if(G.unemp||!G.pwatch||!G.pwatch.length)return; const S=G.pwSt=G.pwSt||{}; const msgs=[];
  for(const id of G.pwatch){ const p=G.players[id]; const prev=S[id]||{}; if(!p){ if(!prev.gone){ S[id]={gone:1}; } continue; }
    const cur={t:p.team,fa:!!(p.team==null&&G.fa&&!G.fa.closed&&(G.fa.pool||[]).includes(id)),post:(G.posting||[]).some(x=>x.pid===id&&x.y===G.year),blk:!!p.aiListed};
    if(S[id]){ if(cur.fa&&!prev.fa)msgs.push(`${p.name}: FA 시장에 나왔습니다.`); if(cur.post&&!prev.post)msgs.push(`${p.name}: 해외 포스팅을 신청했습니다.`); if(cur.blk&&!prev.blk)msgs.push(`${p.name}: ${tshort(p.team)}이(가) ${p.aiUrg?'급매':'트레이드 매물'}로 내놓았습니다.`);
      if(cur.t!=null&&prev.t!=null&&cur.t!==prev.t&&cur.t!==G.user)msgs.push(`${p.name}: ${tshort(prev.t)}에서 ${tshort(cur.t)}(으)로 옮겼습니다.`); }
    S[id]=cur; }
  if(msgs.length)mail('스카우트팀',`관심 선수 소식 ${msgs.length}건`,msgs.join('\n'),{kind:'선수',imp:true}); }

/* 은퇴 면담 결정 */
EVH.retTalk={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||p.team!==G.user)return '이제 우리 선수가 아닙니다.'; (G.evlog=G.evlog||[]).push({k:'retTalk',y:G.year});
  if(i!==0){ p.mor=clamp((p.mor??60)+5,0,100); story(p,`${G.year} 은퇴 의사를 밝혀 구단이 뜻을 존중`,'move'); return `${p.name}의 뜻을 존중하기로 했습니다. 시즌 뒤 은퇴식 여부를 다시 여쭙겠습니다.`; }
  if(R()<retTalkP(p)){ p.retDelay=G.year; p.mor=clamp((p.mor??60)+3,0,100); story(p,`${G.year} 은퇴 면담: 한 해 더 뛰기로`,'move'); news('구단',`${tshort(G.user)} ${p.name}, 은퇴 미루고 한 시즌 더`,`단장과 면담한 뒤 다음 시즌에도 뛰기로 했습니다.`,1,{tid:G.user,ref:p.id}); return `${p.name}이(가) 한 시즌 더 뛰기로 했습니다.`; }
  p.mor=clamp((p.mor??60)-5,0,100); return `${p.name}은(는) 마음을 바꾸지 않았습니다. 시즌 뒤 은퇴합니다.`; } };
