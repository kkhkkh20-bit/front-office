/* ===== 시상·통산 기록·명예의 전당 ===== */
const careerPlayed=h=>!!h&&['g','pa','ab','outs','bf','er','h','hr','r','rbi','sb','w','l','sv','hld','bb','so'].some(k=>(h[k]||0)>0);
function careerOf(p){ const c={seasons:new Set(),teams:new Set(),pa:0,h:0,hr:0,rbi:0,sb:0,outs:0,w:0,sv:0,hld:0,so:0,war:0,byTeam:{}};
  for(const h of p.hist||[]){ if(h.lvl!=='1군'||!careerPlayed(h))continue; c.seasons.add(h.y); c.teams.add(h.t); const w=warOf(h,p); c.war+=w; c.byTeam[h.t]=c.byTeam[h.t]||{war:0,ys:new Set()}; c.byTeam[h.t].war+=w; c.byTeam[h.t].ys.add(h.y);
    if(p.isP){ c.outs+=h.outs||0; c.w+=h.w||0; c.sv+=h.sv||0; c.hld+=h.hld||0; c.so+=h.so||0; } else { c.pa+=h.pa||0; c.h+=h.h||0; c.hr+=h.hr||0; c.rbi+=h.rbi||0; c.sb+=h.sb||0; } }
  return c; }
/* 통산 순위 대상은 한곳에서: 기록이 있는 모든 선수(현역·FA 협상·무적·해외·은퇴, 외국인 포함). 리그에 있으면 선수 기록, 떠났으면 보관 기록(G.arch)의 실제 1군 기록만.
 보관 기록이 없는 옛 은퇴 기록은 추정치를 뺀 값을 쓰고, 뺄 수 없으면 '추정 포함'으로 밝힌다(검수 11-09zp) */
function careerBoard(){ const L=[], seen=new Set(), A=G.arch||{};
  for(const p of Object.values(G.players)){ if(p.fdPool)continue; const c=careerOf(p);if(!c.seasons.size)continue;seen.add(String(p.id));
    L.push({name:p.name,id:p.id,t:p.team,isP:!!p.isP,war:c.war,h:c.h,hr:c.hr,w:c.w,sv:c.sv,act:p.team!=null,lab:p.team!=null?'':p.retY!=null?`${p.retY} 은퇴`:p.faFrom!=null?'FA':'무적'}); }
  for(const id in A){ const a=A[id]; if(seen.has(id)||!a||!a.rows)continue;const rows=a.rows.filter(careerPlayed);if(!rows.length)continue; seen.add(id); const s=k=>rows.reduce((t,r)=>t+(r[k]||0),0),ry=retiredYearOf(a);
    L.push({name:a.name,id:a.id,isP:!!a.isP,war:s('war'),h:s('h'),hr:s('hr'),w:s('w'),sv:s('sv'),act:false,lab:ry!=null?`${ry} 은퇴`:(G.abroad||[]).some(r=>r.id===a.id&&!r.back&&r.end==null)?'해외':'소속 미확인'}); }
  for(const r of (G.legends||[]).concat(G.hof||[])){ const id=String(r.pid??r.id); if(seen.has(id))continue; /* 옛 저장의 G.hof에만 남은 헌액자도(hofList와 같은 대상, 검수 11-09zz) */ seen.add(id); const est=!!r.est&&r.warA==null;
    L.push({name:r.name,id:r.pid??r.id,isP:!!r.isP,war:r.warA??r.war,h:r.h,hr:r.hr,w:r.w,sv:r.sv,act:false,lab:`${r.y} 은퇴${est?' · 추정 포함':''}`}); }
  return L; }
/* 명예의 전당은 은퇴 기록(G.legends)에서 읽는다: 따로 둔 사본은 저장·불러오기 뒤 갈라져 마지막 수상이 빠졌다(검수 11-09zp). 옛 저장의 G.hof에만 남은 헌액자도 보탠다 */
const retiredKey=r=>String(r.pid??r.id??('name:'+r.name+':'+r.y));
function hofList(){ const L=[],ids=new Set();for(const r of [...(G.legends||[]).filter(r=>r.hof),...(G.hof||[]).filter(r=>r.hof!==false)]){const k=retiredKey(r);if(ids.has(k))continue;ids.add(k);L.push(r);}return L; }
function retiredYearOf(a){if(a.retY!=null)return a.retY;const id=String(a.id),r=(G.legends||[]).find(r=>retiredKey(r)===id),o=(G.ob||[]).find(o=>String(o.fid)===id);if(r)return r.y;if(o?.retY!=null)return o.retY;for(const x of [...(G.chron||[]),...Object.values(G.clubHist||{}).flat()])if(x&&x.k==='retire'&&String(x.ref)===id)return x.y;if(/은퇴/.test(a.why||''))return a.y;return null;}
const hofAwardCounts=aw=>{const L=[...new Set(aw||[])];return {mvp:L.filter(a=>/MVP/.test(a)&&!/한국시리즈|KS|올스타|포스트시즌|WBC|프리미어|올림픽|아시안|월드시리즈|챔피언십/.test(a)).length,gg:L.filter(a=>/골든/.test(a)).length};};
const hofQual=(war,mvp,gg)=>war>=38||mvp>=2||gg>=6||(war>=30&&mvp>=1);
function awardListFix(){let n=0;const fix=p=>{if(!p||!Array.isArray(p.aw))return;const a=[...new Set(p.aw)];if(a.length!==p.aw.length){n+=p.aw.length-a.length;p.aw=a;}};for(const p of Object.values(G.players||{}))fix(p);for(const a of Object.values(G.arch||{}))fix(a);for(const r of [...(G.legends||[]),...(G.hof||[])])fix(r);for(const a of G.abroad||[]){fix(a);if(!a.pj)continue;try{const p=JSON.parse(a.pj),old=n;fix(p);if(n!==old)a.pj=JSON.stringify(p);}catch(e){}}return n;}
function addAward(p,label,tid){const aw=p.aw=p.aw||[],added=!aw.includes(label);if(added){aw.push(label);story(p,label,'award');}const t=tid===undefined?p.team:tid;if(t!=null)chron('award',`${p.name} ${label}`,p.id,t,{source:'award:'+label+':'+p.id});return added;}
/* ===== 구단 연대기: 구단마다 해마다 일어난 일을 쌓는다 ===== */
/* 최근 소식과 영구 연대기를 분리한다. 화면 조회는 게임·난수·저장 상태를 바꾸지 않는다. */
let _chronGame=null,_chronIds=null,_chronSources=null;
const chronIdentity=x=>x.source?'s:'+x.tid+':'+x.source+(x.k==='rebrand'&&/^rebrand:\d+:\d+$/.test(x.source)?':'+JSON.stringify([x.d,x.t]):''):x.id?'i:'+x.id:'l:'+JSON.stringify([x.tid,x.y,x.d,x.k,x.t,x.ref??null]);
function clubSeasonResult(h,tid){if(h.champ===tid)return '한국시리즈 우승';if(h.runner===tid)return '한국시리즈 준우승';let known=false;for(const [k,l] of [['ks','한국시리즈'],['po','플레이오프'],['spo','준플레이오프'],['wc','와일드카드']]){const r=h.ps&&h.ps[k];if(!Array.isArray(r))continue;known=true;if(r.slice(0,2).includes(tid))return l+' 진출';}return known?'정규시즌 종료':'포스트시즌 기록 없음';}
/* 이름 전이는 같은 시즌에도 여러 번 생긴다. 보존된 실제 일자와 전이만 복원하고 알 수 없는 날짜는 만들지 않는다. */
function legacyClubIdentityChron(tid,existing=[]){ const H=(G.tnames||{})[tid]||[],L=[]; for(let i=1;i<H.length;i++){ const a=H[i-1],b=H[i]; if(!Number.isFinite(b.d0)||a.city===b.city&&a.nick===b.nick)continue;
  const transition=tfull(a)+' → '+tfull(b); if([...existing,...L].some(x=>x.k==='rebrand'&&x.d===b.d0&&(x.t===transition||String(x.t||'').startsWith(transition+' · '))))continue;
  L.push({tid,y:dobj(b.d0).y,d:b.d0,k:'rebrand',t:transition+(a.city!==b.city?' · 연고 이전':'')+(b.why?' · '+b.why:''),ref:null,source:'legacy-rebrand:'+JSON.stringify([tid,i,b.d0,a.city,a.nick,b.city,b.nick]),basis:'구단 이름 변경 이력',gm:0,imported:true}); } return L; }
function legacyClubRescueChron(tid,existing=[]){const L=[];for(const r of G.rescues||[]){if(r.tid!==tid||!Number.isInteger(r.y))continue;const d=Number.isFinite(r.d)?r.d:null,oldTitle=tfull(team(tid))+' '+(r.k==='re'?'재창단':'매각')+'(누적 적자 ',oldRows=existing.filter(e=>e.k==='lg'&&e.y===r.y&&(d==null||e.d===d)&&typeof e.t==='string'&&e.t.startsWith(oldTitle)&&e.t.endsWith(')'));if(oldRows.length===1&&(G.rescues||[]).filter(x=>x.tid===tid&&x.y===r.y&&(d==null||x.d===d)).length===1)continue;const source='legacy-rescue:'+JSON.stringify([tid,r.y,d,r.k,r.old??null,r.nw??null]);if([...existing,...L].some(e=>e.source===source||e.k==='owner'&&e.y===r.y&&(d==null||e.d===d)&&r.old&&r.nw&&e.t.includes(r.old)&&e.t.includes(r.nw)))continue;L.push({tid,y:r.y,d,dateUnknown:d==null,k:'owner',t:`${r.k==='re'?'운영 법인 변경':'구단 매각'} · ${r.old||'전임 이름 기록 없음'} → ${r.nw||'후임 이름 기록 없음'}${d==null?' (일자 기록 없음)':''}`,ref:null,source,basis:'구단 매각 장부',gm:0,imported:true});}return L;}
function legacyClubChron(tid,existing=[]){const L=[...legacyClubRescueChron(tid,existing),...legacyClubIdentityChron(tid,existing)],add=x=>{if(!existing.some(e=>e.y===x.y&&e.k===x.k&&e.t===x.t&&e.d===x.d))L.push({...x,tid,gm:0,imported:true});};
  for(const h of G.history||[]){const i=(h.order||[]).findIndex(x=>x.tid===tid);if(i<0||existing.some(x=>x.k==='season'&&x.y===h.y))continue;const r=h.order[i];if(!Number.isFinite(r.w)||!Number.isFinite(r.l)||!Number.isInteger(h.y))continue;const result=' · '+clubSeasonResult(h,tid);add({y:h.y,d:h.d??null,dateUnknown:h.d==null,k:'season',t:`${r.w||0}승 ${r.l||0}패${r.t?` ${r.t}무`:''} ${i+1}위${result}`,ref:null,source:'season:'+h.y,basis:'시즌 결산'});}
  const books=new Map((G.history||[]).filter(h=>h.fins&&h.fins[tid]).map(h=>[h.y,{y:h.y,d:h.d,f:h.fins[tid]}]));if(G.last?.fins?.[tid]&&!books.has(G.last.y))books.set(G.last.y,{y:G.last.y,d:G.last.d,f:G.last.fins[tid]});for(const {y,d,f} of books.values()){if(existing.some(x=>x.k==='finance'&&x.y===y)||!Array.isArray(f.inc)||!Array.isArray(f.exp)||!Number.isFinite(f.net))continue;add({y,d:d??null,dateUnknown:d==null,k:'finance',t:`${y} 결산 · 수입 ${money(sum(f.inc.map(x=>x[1])))} · 지출 ${money(sum(f.exp.map(x=>x[1])))} · 손익 ${money(f.net)}${Number.isFinite(f.cash)?` · 기말 현금 ${money(f.cash)}`:''}`,ref:null,source:'finance:'+y,basis:'보존된 결산 장부'});}
  for(const m of G.moves||[]){if(m.from!==tid&&m.to!==tid)continue;if(existing.some(x=>x.d===m.d&&x.ref===m.pid&&['move','trade','fa','draft'].includes(x.k)))continue;const from=m.from==null?(/해외 복귀/.test(m.t)?'해외 구단':m.t==='외국인'?'외국인 선수 시장':'무소속'):tnameOn(m.from,m.d),to=m.to==null?(/해외 진출|포스팅/.test(m.t)?'해외 구단':'무소속'):tnameOn(m.to,m.d); /* 거래 날의 이름(검수 11-17 #206) */add({y:m.y??dobj(m.d).y,d:m.d,k:'move',t:`${m.n} · ${m.t} · ${from} → ${to}${m.note?' · '+m.note:''}`,ref:m.pid,source:'legacy-move:'+JSON.stringify([m.d,m.pid,m.t,m.from,m.to,m.note]),basis:'이적 장부'});}
  const kinds={단장:'gm',감독:'mgr',코치:'coach',스카우트:'scout',분석원:'analyst',전력분석:'analyst',은퇴:'retire',영구결번:'retNo'};
  for(const w of G.wire||[]){const k=kinds[w.k];if(w.tid!==tid||!k||existing.some(x=>x.d===w.d&&x.k===k&&(x.ref??null)===(w.ref??null)))continue;add({y:dobj(w.d).y,d:w.d,k,t:w.t,ref:w.ref??null,source:'legacy-wire:'+JSON.stringify([w.d,w.k,w.t,w.ref]),basis:'보존된 리그 소식'});}
  for(const r of retNosOf(tid)){if(!Number.isInteger(r.y))continue;if(existing.some(x=>x.k==='retNo'&&x.y===r.y&&(x.ref===r.pid||x.t.includes(r.name))))continue;add({y:r.y,d:null,k:'retNo',t:`${r.name} ${r.no}번 영구결번 · 지정 연도 ${r.y}년 (지정일 기록 없음)`,ref:r.pid??null,source:'retNo:'+r.y+':'+r.no,basis:'영구결번 장부',dateUnknown:true});}
  return L; }
function clubChron(tid){const A=[...((G.clubHist||{})[tid]||[]),...(G.chron||[]).filter(x=>x.tid===tid)],M=new Map();A.push(...(G.clubHistV?[...legacyClubRescueChron(tid,A),...legacyClubIdentityChron(tid,A)]:legacyClubChron(tid,A)));for(const x of A)M.set(chronIdentity(x),x);return [...M.values()].sort((a,b)=>(a.y-b.y)||((a.d??Infinity)-(b.d??Infinity))||String(a.id||'').localeCompare(String(b.id||''),undefined,{numeric:true}));}
function chronArchiveInit(){if(_chronGame===G)return;const B=G.clubHist=G.clubHist||{};_chronIds=new Set();_chronSources=new Map();let seq=G.chronN||0;
  for(const [tid,L] of Object.entries(B))for(const x of L){if(x.id){_chronIds.add(x.id);const n=+String(x.id).replace(/^ch/,'');if(Number.isFinite(n))seq=Math.max(seq,n);}if(x.source)_chronSources.set(tid+':'+x.source,x);}
  const put=x=>{if(!x.id)x.id='ch'+(++seq);if(!_chronIds.has(x.id)){(B[x.tid]=B[x.tid]||[]).push(x);_chronIds.add(x.id);}if(x.source)_chronSources.set(x.tid+':'+x.source,x);};
  for(const x of G.chron||[])put(x);
  if(!G.clubHistV){for(const t of G.teams||[]){const A=B[t.id]||[];for(const x of legacyClubChron(t.id,A))put(x);}G.clubHistV=1;}
  for(const t of G.teams||[])for(const x of [...legacyClubRescueChron(t.id,B[t.id]||[]),...legacyClubIdentityChron(t.id,B[t.id]||[])])put(x);
  G.chronN=seq;_chronGame=G; }
function chron(k,t,ref,tid,opts={}){tid=tid??G.user;if(tid==null)return null;chronArchiveInit();const source=opts.source||(k==='season'?'season:'+G.year:null),old=source&&_chronSources.get(tid+':'+source);if(old)return old;
  const x={id:'ch'+(++G.chronN),y:G.year,d:G.day,tid,k,t,ref:ref??null,gm:opts.gm??(!G.unemp&&tid===G.user?1:0),...(source?{source}:{})};(G.clubHist[tid]=G.clubHist[tid]||[]).push(x);_chronIds.add(x.id);if(source)_chronSources.set(tid+':'+source,x);(G.chron=G.chron||[]).push(x);
  if(G.chron.length>900){const KEEP=new Set(['found','champ','join','fired','season']);let n=0;G.chron=G.chron.filter(e=>{if(n>=100||KEEP.has(e.k))return true;n++;return false;});}return x; }

/* ===== 프랜차이즈 스타: 한 구단에서 5시즌 이상 1군을 뛰고 그 구단 통산 WAR 12 이상(또는 7시즌·WAR 8) ===== */
function teamTenure(p,tid){ const ys=new Set(); let war=0; const y0=G.fd&&G.startY?G.startY:-Infinity; /* 창단 드래프트 게임: 창단 이전 기록은 그 구단 기록이 아니다(fdMine과 같게, 검수 11-09zz) */ for(const h of p.hist){ if(h.lvl!=='1군'||h.t!==tid||h.y<y0)continue; if((h.pa||0)>=100||(h.outs||0)>=120)ys.add(h.y); war+=warOf(h,p); } return {n:ys.size,war}; }
function isFranchise(p){ if(!p||p.team==null||p.foreign)return false; if(p.fr&&p.fr.tid===p.team)return true; return frQual(p,p.team); }
function frQual(p,tid){ const T=teamTenure(p,tid); return (T.n>=5&&T.war>=12)||(T.n>=7&&T.war>=8); }
function franchiseCheck(){ for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||(p.fr&&p.fr.tid===p.team))continue; if(isFranchise(p)){ p.fr={tid:p.team,y:G.year};chron('star',`${p.name} 프랜차이즈 스타 등극`,p.id,p.team,{source:'franchise:'+p.id}); if(p.team===G.user){ news('선수',`${p.name}, ${tshort(G.user)}의 프랜차이즈 스타로`,`${teamTenure(p,p.team).n}시즌 동안 한 팀에서 뛰며 통산 WAR ${teamTenure(p,p.team).war.toFixed(1)}을 쌓았습니다. 팬들이 가장 아끼는 선수가 됐습니다.`,2,{ref:p.id}); } } } }
/* 프랜차이즈 스타를 트레이드로 보내면 팬이 크게 반발한다(구단·재정 화면 설명). 트레이드 처리 뒤 부른다(p.fr은 원래 구단 기록) */
function frBacklash(ids){ if(G.unemp)return; const L=(ids||[]).map(id=>G.players[id]).filter(p=>p&&p.team!==G.user&&!p.foreign&&((p.fr&&p.fr.tid===G.user)||frQual(p,G.user))); /* 시즌 말 등록 전이라도 기준을 채운 선수(검수 11-09zz) */ if(!L.length)return; prInit();
  const d=Math.min(12,6+3*(L.length-1)); G.pr.fan=clamp(G.pr.fan-d,0,100); G.pr.press=clamp(G.pr.press-2,0,100); const nm=L.map(p=>p.name).join('·');
  news('팬',`프랜차이즈 스타 ${nm} 트레이드… 팬들 거센 반발`,`${tshort(G.user)}에서 오래 뛴 ${nm}을(를) 내보냈습니다. "구단의 얼굴을 보냈다"는 비판이 쏟아집니다.`,-3,{fanW:2});
  mail('홍보팀',`팬 반발: ${nm} 트레이드`,`프랜차이즈 스타를 트레이드한 데 대한 팬 반발이 큽니다. 팬 여론 악화, 언론 논조 조금 악화.`,{kind:'언론'}); }
/* 은퇴하는 프랜차이즈 스타: 은퇴식, 통산 WAR 25 이상이면 영구결번 */
function legendRetire(p){const tids=new Set([p.team,p.fr&&p.fr.tid,...(p.hist||[]).filter(h=>h.lvl==='1군').map(h=>h.t)].filter(t=>t!=null&&team(t)));for(const tid of tids){if(p.foreign||!(frQual(p,tid)||(p.fr&&p.fr.tid===tid)))continue; /* 이미 프랜차이즈 스타로 인정된 선수: 오래된 기록이 보관 한도로 지워져도 그 구단 프랜차이즈 은퇴 */G.frLeg=G.frLeg||[];if(G.frLeg.some(x=>x.tid===tid&&(x.pid===p.id||(x.pid==null&&x.name===p.name&&x.y===G.year))))continue;const T=teamTenure(p,tid);G.frLeg.push({pid:p.id,tid,name:p.name,pos:posLabel(p),y:G.year,n:T.n,war:+T.war.toFixed(1)});wire('은퇴',`${tname(tid)} 프랜차이즈 스타 ${p.name} 은퇴`,{tid,ref:p.id});chron('legend',`${p.name} 은퇴 (${T.n}시즌, WAR ${T.war.toFixed(1)})`,p.id,tid,{source:'legend:'+p.id+':'+G.year});if(tid===G.user&&p.team===tid&&!G.unemp){stop('선수',`${p.name}이(가) 은퇴합니다. ${T.n}시즌 동안 우리 팀에서 통산 WAR ${T.war.toFixed(1)}. 은퇴식은 따로 정합니다.`);news('선수',`${p.name} 은퇴… ${tshort(tid)} 팬들 눈물`,`${T.n}시즌 동안 ${tshort(tid)}을(를) 지킨 ${p.name}이(가) 유니폼을 벗습니다.`,2);}}}
/* ===== 선수단 리더십: 선수들이 투표로 주장을 뽑는다. 주장의 엄격함(기강)과 영향력이 선수단 분위기를 정한다 =====
   기강 지수 S(0~100) = 주장 엄격함 60% + 감독 규율 40% (+단장 요청 보정). 45~65가 알맞고,
   너무 느슨하면(40 미만) 집중력이 떨어지고 기행이 잦아지며, 너무 세면(70 초과) 경직된 플레이와 젊은 선수 불만이 생긴다 */
function leadOf(p){ initPers(p); if(!p.lead){ const pr=p.pers.pro, tp=p.pers.temp; p.lead={str:clamp(Math.round(pr*.55+tp*.35+hn('lead:str',p.id)*2.5),1,20),cha:clamp(Math.round(p.pers.loy*.3+(p.age-22)*.45+ovr(p)/8+hn('lead:cha',p.id)*2),1,20)}; } return p.lead; } /* 처음 읽을 때 정하되 난수 대신 선수 번호 잡음: 리더 조회 순서가 세계를 바꾸지 않게(안정화 11-14) */
const LEADSTY=s=>s>=15?'엄격한 원칙주의':s>=11?'단호한 편':s>=7?'부드러운 형님형':'자유방임형';
/* 현장 리더는 예상 전력 보기(PROJ_LENS)와 무관하게 오늘 실제로 구단에 있는 선수여야 한다. */
function captainAvailable(p,tid){return !!(p&&p.team===tid&&!p.foreign&&!p.prospect&&!p.ys&&!(p.joinY>G.year)&&!(p.injOut>0)&&!(p.susp>G.day)&&!p.frehab&&!p.hold&&!(p.fLeave>G.day)&&!(p.boy>G.day)&&!milServing(p)&&!(p.ntAway>G.day&&p.ntFrom<=G.day)&&!(typeof sisFlAwayOn==='function'&&sisFlAwayOn(p)));}
function captainPool(tid,why,deputy){ const all=domestic(tid).filter(p=>captainAvailable(p,tid)&&p.age>=25); if(!all.length)return [];
  /* 주장은 적어도 주전급에서: 주전(라인업·선발·필승조) 또는 팀 국내 선수 상위 12명 안. 현장 대행 조회는 라인업을 다시 계산하지 않는다. */ let reg=new Set(); if(!deputy)try{ const d=depth(tid); reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); }catch(e){} const top=new Set([...domestic(tid)].filter(p=>captainAvailable(p,tid)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,12).map(p=>p.id));
  const ps0=all.filter(p=>reg.has(p.id)||top.has(p.id)); const ps=ps0.length>=3?ps0:all;
  /* 선수들은 자기 관리가 되는(프로의식) 고참을 주장으로 뽑는다: 프로의식·연차·나이(29~34세가 가장 많이 뽑힘)·영향력·실력 */
  const ageB=a=>a>=29&&a<=34?6:a>=27?3:a>=35?3:0;
  const sc=p=>teamTenure(p,tid).n*2+ovr(p)*.3+leadOf(p).cha*1.1+((p.pers&&p.pers.loy)||10)*.3+((p.pers&&p.pers.pro)||10)*1.3+(((p.pers&&p.pers.pro)||10)<=7?-(8-((p.pers&&p.pers.pro)||10))*3:0)+ageB(p.age)+ /* 자기 관리가 안 되는 선수(프로의식 7 이하)는 주장 표를 거의 못 받는다 */hn('el'+G.year+(why||''),p.id)*4;
  return ps.map(p=>({p,v:Math.max(1,sc(p))})).sort((a,b)=>b.v-a.v||a.p.id-b.p.id).slice(0,3); }
function captainVotes(L,n){const w=L.map(x=>Math.pow(x.v,4)),tot=sum(w),raw=w.map(x=>n*x/tot),v=raw.map(Math.floor);raw.map((x,i)=>({i,r:x-v[i]})).sort((a,b)=>b.r-a.r||L[a.i].p.id-L[b.i].p.id).slice(0,n-sum(v)).forEach(x=>v[x.i]++);return v;}
function electCaptain(tid,why,quiet){ const L=captainPool(tid,why);if(!L.length)return null;const c=L[0].p; const t=team(tid); const old=t.cap; let S0=null, S1=null; try{ G._cl=null; S0=climateOf(tid).S; }catch(e){} t.cap=c.id;t.capName=c.name; try{ G._cl=null; S1=climateOf(tid).S; }catch(e){}
  if(!quiet&&tid===G.user&&!G.unemp){ const n=domestic(tid).filter(p=>captainAvailable(p,tid)).length; const votes=captainVotes(L,n); const ld=leadOf(c);

    mail('선수단','주장 선출 결과',`선수단 투표로 ${c.name}(${posLabel(c)}, ${c.age}세)이(가) 주장이 됐습니다${why?`(${why})`:''}.\n\n${L.map((x,i)=>`${x.p.name} ${votes[i]}표`).join(' · ')}\n\n리더십 성향: ${LEADSTY(ld.str)} · 선수단 영향력 ${ld.cha>=14?'큼':ld.cha>=9?'보통':'작음'}.${(()=>{ const c=teamCulture(tid); const L=c.L.slice(1).map(x=>x.name); return `\n고참 리더: ${L.join(', ')||'없음'} · 선수단 문화(리더들의 자기 관리) ${c.pro>=14?'좋음 — 젊은 선수들이 따라 배웁니다':c.pro<=8?'느슨함 — 젊은 선수들이 나쁜 습관을 배울 수 있습니다':'보통'}`; })()} ${old!=null&&old!==c.id&&G.players[old]&&G.players[old].team===tid?`전임 ${G.players[old].name}은(는) 주장에서 물러났습니다.`:''}\n\n주장은 선수들이 직접 뽑습니다. 기강이 지나치게 느슨하거나 세면 주장과 면담해 방향을 바꿔 달라고 요청할 수 있습니다.`,{kind:'선수',ref:c.id,face:c.id,acts:[{l:'선수단 리더십',a:'go',v:'train:lead'}]}); }
  if(!quiet&&old!==c.id){const op=old!=null&&G.players[old];chron('cap',`선수단 투표로 ${c.name} 주장 선출${why?` (${why})`:''}${op?` · 전임 ${op.name}`:''}${S0!=null&&S1!=null?` · 기강 ${S0}→${S1}`:''}`,c.id,tid,{source:'captain:'+G.day+':'+c.id});}
  return c; }
/* ===== 리더의 프로의식이 선수단에 퍼진다 =====
   리더 = 주장 + 고참 리더 2명(프로의식·연차·영향력이 높은 27세 이상). 리더들의 프로의식(영향력만큼 가중)이 선수단 문화가 된다.
   젊은 선수일수록 문화를 따라간다: 성장 의지·사고 확률은 '문화가 반영된 프로의식'으로 보고, 해마다 실제 프로의식도 조금씩 문화 쪽으로 옮겨 간다.
   프로의식이 낮은 고참이 리더면 반대로 끌어내린다 */
const _ldC=new Map();
function teamLeaders(tid){const ps=domestic(tid).filter(p=>captainAvailable(p,tid)&&p.age>=27),cap=captainOf(tid),sig=ps.map(p=>{initPers(p);return [p.id,p.age,p.pers.pro,leadOf(p).cha,p.hist?.length,p.draft?.y,p.acq?.d];}),k=JSON.stringify([G.day,G.mvN||0,cap?.id,sig]),c=_ldC.get(tid);if(c&&c.g===G&&c.k===k&&c.L.every(p=>captainAvailable(p,tid)&&G.players[p.id]===p))return c.L;
  const vs=p=>p.pers.pro*1.2+Math.min(teamTenure(p,tid).n,8)*1.2+leadOf(p).cha*.8+(p.age>=30?3:0),V=new Map(ps.map(p=>[p,vs(p)])),L=[cap,...ps.filter(p=>p!==cap).sort((a,b)=>V.get(b)-V.get(a)||a.id-b.id).slice(0,2)].filter(Boolean);_ldC.set(tid,{g:G,k,L});return L;}
function teamCulture(tid){ const L=teamLeaders(tid); if(!L.length)return {pro:10,w:0,L}; let s=0,ws=0; L.forEach((p,i)=>{ const w=(i===0?1:.5)*clamp(leadOf(p).cha/12,.4,1.5); s+=p.pers.pro*w; ws+=w; }); return {pro:s/ws,w:clamp(ws/1.6,.25,1.2),L}; }
function effPro(p){ initPers(p); if(p.team==null||p.foreign||p.prospect)return p.pers.pro; const c=teamCulture(p.team); if(c.L.includes(p))return p.pers.pro; const sus=p.age<=24?.4:p.age<=28?.25:.12; return clamp(p.pers.pro+(c.pro-p.pers.pro)*sus*c.w,1,20); }
/* 해마다(1월 1일 성장 때): 27세 이하는 실제 프로의식이 문화 쪽으로 한 칸씩 옮겨 갈 수 있다 */
function proDrift(p){ if(p.team==null||p.foreign||p.age>27)return 0; initPers(p); const c=teamCulture(p.team); if(c.L.includes(p))return 0; const d=c.pro-p.pers.pro;
  if(d>=3&&R()<.3*c.w){ p.pers.pro++; return 1; } if(d<=-3&&R()<.22*c.w){ p.pers.pro--; return -1; } return 0; }
function climateOf(tid){ if(!G._cl||G._cl.d!==G.day)G._cl={d:G.day,v:{}}; const C=G._cl.v;
  const t=team(tid); const c=captainOf(tid); const m=G.mgr[tid]; const md=m&&m.disc!=null?m.disc:45;
  const L=c?leadOf(c):{str:9,cha:6}; const adj=(leadAdjOf(tid)||{v:0}).v; /* 구단 징계로 잡힌 기강: 모든 구단 같은 식(AI는 G.leadAdjT) */
  const tc=t&&t.cap, mid=m&&m.id; { const x=C[tid]; if(x&&x.cap===c&&x.k&&x.k[0]===tc&&x.k[1]===(c&&c.team)&&x.k[2]===L.str&&x.k[3]===L.cha&&x.k[4]===mid&&x.k[5]===md&&x.k[6]===adj)return x; } /* 성능: 타석마다 불리므로 열쇠 문자열을 만들지 않고 값을 그대로 견준다(조건은 예전 열쇠와 같다) */
  const key=[tc,c&&c.id,c&&c.team,L.str,L.cha,mid,md,adj].join(':');
  const S=clamp(Math.round(L.str*5*.6+md*.4+adj),0,100); const w=clamp(L.cha/14,.35,1.3);
  const boost=(S>=45&&S<=65?.4:0)*w-(S<40?1.2*(40-S)/40:0)*w-(S>70?.8*(S-70)/30:0)*w;
  const o={S,w,boost,cap:c,band:S<40?'loose':S>70?'rigid':S>=45&&S<=65?'good':'ok',key}; Object.defineProperty(o,'k',{value:[tc,c&&c.team,L.str,L.cha,mid,md,adj]}); /* 비교용 값은 저장하지 않는다 */ return C[tid]=o; }
/* 주간: 느슨하면 기행, 너무 세면 젊은 선수 불만. 모든 구단 같은 규칙(사용자 11-14 "AI도 공평하게").
   우리 구단 사고는 단장 결정으로 오고, 다른 구단은 AI 단장이 같은 세 가지 징계 가운데 고른다(aiLeadPick) */
function leadAdjOf(tid){const owner=G.leadAdjTid??G.user,A=tid===owner&&G.leadAdj?G.leadAdj:(G.leadAdjT||{})[tid];return A&&A.until>G.day?A:null;}
function leadAdjSet(tid,a){(G.leadAdjT=G.leadAdjT||{})[tid]=a;if(tid===G.user&&!G.unemp){G.leadAdj=a;G.leadAdjTid=tid;}G._cl=null;}
function leadAdjMigrate(){const T=G.leadAdjT=G.leadAdjT||{},owner=G.leadAdjTid??G.user;if(G.leadAdj&&owner!=null)T[owner]=G.leadAdj;G.leadAdjTid=G.user;G.leadAdj=G.unemp?null:T[G.user]||null;G._cl=null;}
function leadAdjLeave(old){const T=G.leadAdjT=G.leadAdjT||{},owner=G.leadAdjTid??old;if(G.leadAdj&&owner===old)T[old]=G.leadAdj;G.leadAdjTid=G.user;G.leadAdj=G.unemp?null:T[G.user]||null;G._cl=null;}
function leadAdjBoost(tid,v,days){const a=leadAdjOf(tid);leadAdjSet(tid,{v:Math.min(12,Math.max(0,a?.v||0)+v),until:Math.max(a?.until||0,G.day+days)});}
function climateWeek(){ if(period()==='off'||!G.teams)return; if(G.leadAdjT)for(const k of Object.keys(G.leadAdjT))if(!(G.leadAdjT[k]&&G.leadAdjT[k].until>G.day))delete G.leadAdjT[k];
  for(const t of G.teams){ try{ climateWeekT(t.id); }catch(e){} } }
function climateWeekT(tid){ const me=tid===ME(); const cl=climateOf(tid); const ps=domestic(tid).filter(p=>!p.ys&&healthy(p)&&!isAway(p)); if(!ps.length)return;
  if(cl.band==='rigid'){ for(const p of ps)if(p.age<=25||((p.pers&&p.pers.temp)||10)>=14)p.mor=clamp((p.mor??60)-.8,0,100); }
  if(cl.band==='good'){ for(const p of ps)if((p.mor??60)<70)p.mor=clamp((p.mor??60)+.4,0,100); }
  const ch=cl.band==='loose'?.05+.18*(40-cl.S)/40:cl.band==='ok'&&cl.S<45?.03:.01; if(R()>=ch)return;
  const cand=ps.filter(p=>((p.pers&&p.pers.pro)||10)<=11).sort(()=>R()-.5); const p=cand[0]||pick(ps); const kinds=[['늦은 귀가','원정 숙소 통금 시간을 넘겨 들어왔습니다'],['SNS 논란','개인 SNS에 올린 글이 팬들 사이에서 논란이 됐습니다'],['훈련 지각','팀 훈련에 늦게 나왔습니다'],['더그아웃 언쟁','경기 중 더그아웃에서 동료와 언성을 높였습니다']]; const [k,d]=pick(kinds);
  if(me)prInit(); const pr=prOf(tid); if(pr)pr.fan=clamp(pr.fan-(k==='SNS 논란'?3:1),0,100);
  if(!me){ const i=aiLeadPick(tid,p,cl); leadDisc(tid,p,i); (G.leadLogT=G.leadLogT||[]).push([G.day,tid,p.id,i]); if(G.leadLogT.length>60)G.leadLogT.shift(); if(i===0)try{ wire('구단',`${tshort(tid)}, ${p.name} 출장 정지 5일 자체 징계`,{tid,ref:p.id}); }catch(e){} return; }
  const m=G.mgr[tid]; const mr=m&&!m.interim?(m.disc>=65?`${m.name} 감독은 엄하게 다스려야 한다는 입장입니다.`:m.disc<40?`${m.name} 감독은 선수를 감싸고 싶어 합니다.`:`${m.name} 감독은 구단 판단에 따르겠다고 합니다.`):'';
  evNew('lead',`${p.name} ${k}`,`${p.name}(${posLabel(p)})이(가) ${d}. 선수단 기강이 느슨하다는 말이 나옵니다(기강 지수 ${cl.S}). ${mr} 구단 차원의 징계를 정해 주세요.`,[{l:'구단 징계: 출장 정지 5일',fx:'선수 기분이 크게 내려가고 그 기간 못 뜁니다. 선수단이 한동안 바짝 긴장합니다.'},{l:'구단 징계: 벌금',fx:'선수 기분이 내려가고 한동안 기강이 조금 잡힙니다.'},{l:'선처하고 감독에게 맡기기',fx:'선수 기분은 지킵니다. 감독이 엄한 편이면 감독이 직접 다잡습니다.'}],{ref:p.id,data:{pid:p.id},from:'운영팀',def:1}); }
/* 징계 효과(우리·다른 구단 같은 값). 0 출장 정지 5일, 1 벌금, 2 선처(감독 규율 60 이상이면 감독이 다잡는다) */
function leadDisc(tid,p,i){const m=G.mgr[tid];
  if(i===0){ p.mor=clamp((p.mor??60)-12,0,100);p.susp=Math.max(p.susp||0,G.day+5);leadAdjBoost(tid,6,45);return 'susp'; }
  if(i===1){ p.mor=clamp((p.mor??60)-6,0,100);leadAdjBoost(tid,3,30);pdDiscipline(p,'lead:'+G.day+':'+p.id,{fine:true});return 'fine'; }
  p.mor=clamp((p.mor??60)+2,0,100);if(m&&!m.interim&&m.disc>=60){leadAdjBoost(tid,3,30);return 'mgr';}return 'free';}
/* AI 단장의 징계 선택: 사람 단장이 화면에서 보는 것(기강 지수·감독 규율 성향·주전 여부)만으로.
   감독이 엄하면 선처해도 기강이 잡히니 선처, 기강이 많이 무너졌고 주전이 아니면 출장 정지, 그 밖에는 벌금 */
function aiLeadPick(tid,p,cl){ const m=G.mgr[tid]; if(m&&!m.interim&&m.disc>=60)return 2; let reg=false; try{ reg=isRegular(p); }catch(e){}
  return cl.S<30&&!reg?0:1; }
const EVH_LEAD={ pick(e,i){ const p=G.players[e.data.pid]; if(!p)return ''; const r=leadDisc(G.user,p,i);
    if(r==='susp'){news('구단',`${tshort(G.user)}, ${p.name} 출장 정지 자체 징계`,`구단이 ${p.name}에게 자체 징계를 내렸습니다. 출장 정지는 ${dmd(p.susp)}까지입니다.`,0,{ref:p.id});return `${p.name}에게 자체 징계를 내렸습니다. 출장 정지는 ${dmd(p.susp)}까지이며 기존의 더 긴 정지 기간은 유지합니다. 선수단이 바짝 긴장했습니다.`;}
    if(r==='fine')return `${p.name}에게 벌금 ${money(pdDiscFine(p))}을 물렸습니다. 기강이 조금 잡혔습니다.`;
    const m=G.mgr[G.user]; if(r==='mgr')return `구단은 선처했고, ${m.name} 감독이 선수단 미팅을 열어 직접 다잡았습니다.`; return `${p.name}을(를) 선처했습니다. 감독도 크게 문제 삼지 않았습니다.`; } };
/* 조회는 현재 현장 대표만 반환한다. 선출·이탈 처리는 이적/복무/하루 진행의 변경 경로에서 한다. */
const _capC=new Map();
function captainOf(tid){const t=team(tid);if(!t||t.cap==null)return null;const p=G.players[t.cap];if(captainAvailable(p,tid))return p;const old=_capC.get(tid),mv=G.mvN||0;if(old&&old.g===G&&old.d===G.day&&old.cap===t.cap&&old.mv===mv){if(old.p&&captainAvailable(old.p,tid))return old.p;if(!old.p&&!domestic(tid).some(p=>p.age>=25&&captainAvailable(p,tid)))return null;}const acting=captainPool(tid,'현장 주장 대행',true)[0]?.p||null;_capC.set(tid,{g:G,d:G.day,cap:t.cap,mv,p:acting});return acting;}
function captainTitle(tid,p=captainOf(tid)){const t=team(tid);return p&&t&&t.cap!=null&&t.cap!==p.id?'주장 대행':'주장';}
function captainReconcile(tid,quiet){if(tid==null)return null;const t=team(tid);if(!t||t.cap==null)return null;const old=G.players[t.cap],gone=!old||old.team!==tid||old.foreign;if(!gone&&!milServing(old))return captainOf(tid);const name=old?.name||t.capName||'전임 주장';
  if(gone&&!quiet){for(const p of playersOf(tid))p.mor=clamp((p.mor??60)-2,0,100);if(tid===G.user&&!G.unemp)news('구단',`${tshort(tid)} 주장 ${name} 떠나… 선수단 술렁`,'주장이 팀을 떠나 더그아웃 분위기가 가라앉았습니다.',-1);}
  const next=electCaptain(tid,gone?'전임 주장 이탈':'주장 군 복무',quiet);if(!next)t.cap=null;G._cl=null;_ldC.delete(tid);return next;}
function captainReconcileAll(quiet,fill){for(const t of G.teams||[])if(fill&&t.cap==null)electCaptain(t.id,'선수단 주장 선출',quiet);else captainReconcile(t.id,quiet);}
function captainMigrate(){captainReconcileAll(true,true);for(const t of G.teams||[]){const p=G.players[t.cap];if(p&&p.team===t.id)t.capName=p.name;delete t.capt;}}

/* ===== 시상: 정규시즌이 끝나면 후보와 투표를 정하고, 발표는 실제 일정대로 한다
   MVP·신인왕은 11월 24일 KBO 시상식(기자단 125명 투표), 골든글러브는 12월 9일(288명 투표).
   투표는 WAR에 홈런·승수 같은 눈에 띄는 기록, 팀 성적, 기자 표심의 흔들림이 섞여 WAR 1위가 지는 '수상 논란'도 나온다 */
function awVote(cands,voters,seed){ if(!cands.length)return []; const sc=cands.map(c=>c.s); const mx=Math.max(...sc); const ex=sc.map(v=>Math.exp((v-mx)*1.6)); const tot=sum(ex);
  const raw=ex.map(e=>voters*e/tot); const fl=raw.map(Math.floor); let left=voters-sum(fl); raw.map((r,i)=>[r-fl[i],i]).sort((p,q)=>q[0]-p[0]).slice(0,left).forEach(([,i])=>fl[i]++);
  cands.forEach((c,i)=>c.v=fl[i]); return cands.sort((p,q)=>q.v-p.v); }
/* 시상 소속: 그해 가장 많이 뛴 구단(이적 뒤 안 뛴 구단으로 가지 않게, 현역·보관 기록 같은 결과, 검수 11-08) */
function awTeamOf(p,h,y){ const yy=y??h.y; let R=(p.hist||[]).filter(r=>r.y===yy&&!r.y2&&r.lvl==='1군'); if(!R.length&&p.arch&&p.arch.rows)R=p.arch.rows.filter(r=>r.y===yy&&r.t!=null); if(!R.length)return h.t??p.team; const by={}; for(const r of R)by[r.t]=(by[r.t]||0)+(r.pa||0)+(r.outs||0); let b=R[R.length-1].t, n=-1; for(const k in by)if(by[k]>n){ n=by[k]; b=+k; } return b; }
/* 시상 표기 소속: KBO 관행은 수상 당시 소속. 소속이 없으면(방출·은퇴) 그해 가장 많이 뛴 구단 */
function awClub(p,h,y){ return p.team!=null&&!p.arch?p.team:awTeamOf(p,h,y); }
/* MVP·신인왕 기자단 점수의 기록 부분(WAR + 눈에 띄는 누적 기록 + 팀 순위 3위 이내). 시즌 중 레이스 기사·시상 전 예상도 이 식을 쓴다(93_award_race) */
function awBase(x,rk){ const big=x.p.isP?(x.h.w||0)*.06+(x.h.sv||0)*.03+(x.h.hld||0)*.015+(x.h.so||0)*.002:(x.h.hr||0)*.045+(x.h.rbi||0)*.008+(x.h.sb||0)*.005; return x.w+big+(rk>=0&&rk<=2?.35:0); }
function awCand(x,extra){ const tt=awTeamOf(x.p,x.h); /* 성적을 낸 구단(검수 11-07: 지금 소속으로 팀 성적 가산) */ const rk=(()=>{ try{ return G.ps.order.findIndex(o=>o.tid===tt); }catch(e){ return 5; } })();
  const b=awBase(x,rk);
  return {id:x.p.id,name:x.p.name,t:awClub(x.p,x.h),pos:(()=>{ try{ return posLabel(x.p); }catch(e){ return ''; } })(), /* 후보에 오른 때의 포지션(나중에 바꿔도 과거 시상은 그대로, 검수 11-09zz) */line:statLine(x.h,x.p),w:+x.w.toFixed(1),b:+b.toFixed(3) /* 기록 점수(시상 전 예상) */,s:b+N(0,.25)+(extra||0)}; }
/* 신인상 자격(KBO 표창규정 제7조) — 시상과 시즌 중 신인왕 경쟁 기사가 같이 쓴다 */
function awRookieOK(x,y){ const joinY=p=>p.draft&&p.draft.y!=null?p.draft.y+1:Math.min(...p.hist.map(h=>h.y).concat([p.joinY??y,y,y-Math.max(0,(p.svc||0)-1)])); /* 드래프트 다음 해가 입단 첫 시즌이다. 기록이 짧은 옛 선수는 등록 연차도 함께 본다. */
  return !x.p.foreign&&!x.p.ovsExp&&!(G.abroad||[]).some(a=>a.id===x.p.id)&&joinY(x.p)>=y-4&&((x.h.pa||0)+(x.h.outs||0))>0&&(()=>{ const H=x.p.hist.filter(h=>h.lvl==='1군'&&h.y<y&&!h.y2); return sum(H.map(h=>h.pa||0))<=60&&sum(H.map(h=>h.outs||0))<=90; })(); } /* 카페 11-11(알중식): 홀드도 누적 기록으로 치고, 기자 표심의 흔들림(표준편차)을 0.45→0.25로 줄여 WAR 1 이상 앞선 후보가 밀리는 일을 줄인다 */
/* GG 수비 출전은 실제 경기 장부 우선. 옛 저장의 확인된 선발·대표포지션 근거는 유지한다. */
function ggPositionGames(p,h,y,pos){ const u=p&&p.use, P=u&&u.y===y&&(u.fpos||u.pos); if(P){ if(pos==='OF')return u.fpos&&u.fOf!=null?u.fOf:['LF','CF','RF'].reduce((n,k)=>n+(P[k]||0),0); return P[pos]||0; } return ((['LF','CF','RF'].includes(h.pos)?'OF':h.pos)===pos)?h.g||0:0; }
function seasonAwards(y){ const rows=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(h)rows.push({p,h,w:warOf(h,p)}); }
  for(const id in (G.arch||{})){ if(G.players[id])continue; const a=G.arch[id]; const R=(a.rows||[]).filter(r=>r.y===y); if(!R.length)continue; const q=archP(a); const h=seasonTotal(q,y,'1군'); if(!h)continue; q.team=h.t;
    rows.push({p:q,h,w:sum(R.map(r=>r.war||0))}); } /* 이전 시즌 보관 기록도 이력으로 읽어 신인 자격을 현역과 같게 판정하고, 수비 포지션도 넘긴다(검수 11-06) */ /* 시즌 중 리그를 떠난 선수도 같은 성적이면 같은 후보(타이틀과 같은 기준) */
  /* 후보 자격은 KBO 규정대로(2025 KBO 표창규정·골든글러브 기준):
     투수 = 규정이닝(팀 경기 수×1이닝) 또는 10승·30세이브·30홀드 중 하나 / 야수 = 규정타석(팀 경기 수×3.1) / 각 부문 1위(타이틀 홀더)는 자동 후보.
     MVP 후보는 타이틀 홀더와 성적 상위로 투수 8명·야수 10명(실제 2025년 18명) */
  const tg=x=>tgp(awTeamOf(x.p,x.h,y),y)||144; /* 규정 기준 팀 경기 수도 수상 소속 구단으로(검수 11-09zq) */ const tit=new Set(); try{ for(const [,k,isP,low] of TITLES){ const B=titleBoard(y,k,isP,low); if(B[0])B.filter(z=>Math.abs(z.v-B[0].v)<1e-9).forEach(z=>tit.add(z.p.id)); /* 1위는 떠난 선수까지 포함한 실제 순위, 혜택도 그 1위(공동)만 */ } }catch(e){}
  const qB=x=>!x.p.isP&&((x.h.pa||0)>=Math.round(tg(x)*3.1)||tit.has(x.p.id)), qP=x=>x.p.isP&&((x.h.outs||0)>=tg(x)*3||(x.h.w||0)>=10||(x.h.sv||0)>=30||(x.h.hld||0)>=30||tit.has(x.p.id));
  const start=Math.max(dnum(y,11,25),G.day+1),end=Math.max(dnum(y,12,5),start+1);
  const A={y,created:G.day,gmT:G.unemp?null:G.user,gg:{},cand:{gg:{}},pend:{mvp:true,gg:true},days:{mvp:Math.max(dnum(y,11,24),G.day+1),gg:Math.max(dnum(y,12,9),end+1)},ggVote:{voters:288,start,end,ballots:{},news:{}}}; /* 후보 발표 뒤 최소 이틀 투표하고, 마감 다음 날 이후 시상한다. 연말이면 다음 해로 이어진다. */
  { const pick=(L,n)=>{ const t=L.filter(x=>tit.has(x.p.id)); const rest=L.filter(x=>!tit.has(x.p.id)).sort((a,b)=>b.w-a.w); return t.concat(rest).slice(0,Math.max(n,t.length)); };
    A.cand.mvp=awVote(pick(rows.filter(qP),8).concat(pick(rows.filter(qB),10)).map(x=>awCand(x)),125); }
  /* 신인상(KBO 표창규정 제7조): 그해 입단 또는 최근 5년 이내 입단, 이전 시즌까지 1군 누적 투수 30이닝·타자 60타석 이하, 해외 프로리그 소속 경험 없음(외국인 제외) */
  A.cand.roy=awVote(rows.filter(x=>awRookieOK(x,y)).sort((a,b)=>b.w-a.w).slice(0,8).map(x=>awCand(x)),125);
  const gpos=x=>{ const u=x.p.use, F=u&&u.y===y&&(u.fpos||u.pos); if(F){ const P={}; for(const k in F){ const kk=['LF','CF','RF'].includes(k)?'OF':k; P[kk]=ggPositionGames(x.p,x.h,y,kk); } let b=null,n=-1; for(const k in P)if(P[k]>n){n=P[k];b=k;} if(b)return b; } const pos=x.h.pos||x.p.pos;return ['LF','CF','RF'].includes(pos)?'OF':pos; };
  const ggQ=(x,pos)=>{ if(tit.has(x.p.id))return true; if(pos==='DH')return ((x.h.pp&&x.h.pp.DH)||0)>=Math.floor(Math.round(tg(x)*3.1)*2/3); /* 규정타석 446의 2/3 = 297 */ const gAt=ggPositionGames(x.p,x.h,y,pos); return gAt>=Math.round(tg(x)*5/9); }; /* 포지션별 출장 정보가 없으면 그 시즌 주 포지션만 전체 출장 수로 본다(지명타자가 포수 후보가 되지 않게, 검수 11-06) */ /* KBO: 그 포지션 수비 720이닝(팀 경기 수×5이닝) 이상 = 9이닝 경기로 80경기 */
  const gposQ=x=>{ const g=gpos(x); if(ggQ(x,g))return g; const n=k=>ggPositionGames(x.p,x.h,y,k); return ['C','1B','2B','3B','SS','DH','OF'].filter(k=>ggQ(x,k)).sort((a,b)=>n(b)-n(a))[0]||null; }; /* 가장 많이 선 자리가 기준 미달이면 기준을 채운 다른 자리로(한 선수 한 자리) */
  const voteGG=(pos,L,seats)=>{if(!L.length)return;const C=L.map(x=>ggCandidate(x,pos));A.ggVote.ballots[pos]=ggReporterVote(C,288,seats,y).length; /* 투표지 원본은 읽는 곳이 없어 수만 남긴다(저장 크기) */A.cand.gg[pos]=C;};
  for(const pos of ['C','1B','2B','3B','SS','DH'])voteGG(pos,rows.filter(x=>!x.p.isP&&gposQ(x)===pos),1);
  voteGG('OF',rows.filter(x=>!x.p.isP&&gposQ(x)==='OF'),3);
  voteGG('P',rows.filter(qP),1);
  /* 수상자(발표 전까지 비공개) */
  const pick=c=>c&&c[0]?{id:c[0].id,name:c[0].name,t:c[0].t,line:c[0].line,v:c[0].v}:null;
  A.mvp=pick(A.cand.mvp); A.roy=pick(A.cand.roy);
  for(const k of ['C','1B','2B','3B','SS','DH','P'])if(A.cand.gg[k])A.gg[k]=pick(A.cand.gg[k]);
  if(A.cand.gg.OF)A.cand.gg.OF.slice(0,3).forEach((c,i)=>{ A.gg['OF'+i]={id:c.id,name:c.name,t:c.t,line:c.line,v:c.v}; });
  (G.awards=G.awards||{})[y]=A;
  const mineC=[...(A.cand.mvp||[]),...(A.cand.roy||[])].filter(c=>c.t===G.user); /* 후보 전원: 득표 상위만 고르면 발표 전 결과가 드러난다(검수 11-09zf) */
  mail('홍보팀',`${y} ${ASSOC.s} 시상식 후보 발표`,`MVP 후보 ${(A.cand.mvp||[]).length}명: ${[...(A.cand.mvp||[])].sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(c=>`${awN(c)}(${tshort(c.t)})`).join(', ')||'-'}\n신인왕 후보 ${(A.cand.roy||[]).length}명: ${[...(A.cand.roy||[])].sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(c=>`${awN(c)}(${tshort(c.t)})`).join(', ')||'-'} (이름순)\n\nMVP·신인왕은 ${awDateText(A.days.mvp,y)} ${ASSOC.s} 시상식, 골든글러브는 ${awDateText(A.days.gg,y)}에 발표됩니다.${mineC.length?`\n우리 구단 후보: ${[...new Set(mineC.map(c=>c.name))].join(', ')}`:''}`,{kind:'기록'});
  return A; }
/* 실제 시상일: 결산이 늦으면 다음 날(07_daily 시상은 결산보다 먼저 돈다), 연말을 넘기면 미정(검수 11-09zq) */
/* 수상 소식 속 이름: 보이지 않는 선수 번호를 붙여 동명이인이 아니라 그 선수로 링크한다(플레이 테스트 3차) */
const awN=x=>x?(x.id!=null?pidName({id:x.id,name:x.name}):x.name||''):'';
function awDateText(d,y=G.year){return (dobj(d).y!==y?dobj(d).y+'년 ':'')+dmd(d);}
function cerDay(b){return awDateText(G.day<b?b:G.day+1,dobj(b).y);}
/* 확정된 시상 날짜는 저장한다. 옛 미결 시상도 새해로 이어 가되 투표 과정을 건너뛰지 않는다. */
function awardScheduleFix(A,y=A?.y){if(!A)return null;y=y??G.year;if(A.y==null)A.y=y;if(A.days)return A.days;const base=dnum(y,11,25),V=A.ggVote,made=A.created??(V&&V.start>base?V.start:Math.min(G.day-1,dnum(y,11,23)));A.created=made;
  if(A.pend?.gg){if(!A.ggVote)A.ggVote={voters:288,start:Math.max(base,G.day+1),end:Math.max(dnum(y,12,5),G.day+2),ballots:{},news:{}};const v=A.ggVote;v.news=v.news||{};if(!(v.received>0)&&!Object.keys(v.news).length&&G.day>=v.end){v.start=G.day+1;v.end=Math.max(v.end,v.start+1);}}
  A.days={mvp:Math.max(dnum(y,11,24),made+1),gg:Math.max(dnum(y,12,9),(A.ggVote?.end??made)+1,made+1)};return A.days;}
function awardsDaily(){for(const y of Object.keys(G.awards||{}).map(Number).sort((a,b)=>a-b)){const A=G.awards[y],D=awardScheduleFix(A,y);if(!D)continue;for(const k of ['mvp','gg'])if(A.pend?.[k]&&G.day>=D[k]){if(k==='gg'&&A.ggVote)ggVotingDaily();if(dobj(G.day).y>y)withRng(y*1009+(k==='gg'?29:17),()=>awardCeremony(k,y));else awardCeremony(k,y);}}}
function awardChronMigrate(){let n=0;const clean=L=>{const seen=new Set();return (L||[]).filter(x=>{if(x.k!=='award'||x.ref==null)return true;const m=String(x.t||'').match(/\s(\d{4} (?:MVP|신인왕|골든글러브\([^)]*\)))$/);if(!m)return true;const s='award:'+m[1]+':'+x.ref;if(x.source!==s){x.source=s;n++;}const key=x.tid+':'+s;if(seen.has(key)){n++;return false;}seen.add(key);return true;});};G.chron=clean(G.chron);for(const tid in G.clubHist||{})G.clubHist[tid]=clean(G.clubHist[tid]);if(n){_chronGame=null;_chronIds=null;_chronSources=null;}return n;}
function awardHistoryMigrate(){let n=histChampionFix()+histManagerFix()+awardChronMigrate()+awardResumeMigrate();for(const y in G.awards||{}){const A=G.awards[y];if(A?.pend&&(A.pend.mvp||A.pend.gg)&&!A.days){awardScheduleFix(A,+y);n++;}}return n;}
/* 발표 시점에만 수상자를 공개한다 */
function awShown(A,k){ return A&&!(A.pend&&A.pend[k]); }
/* 시상식 전에 은퇴한 선수의 아직 발표되지 않은 수상(은퇴 기록에 넣어 두었다가 시상식 때 반영) */
function awLabels(A,k,y){ if(!A)return []; return k==='mvp'?[['MVP',A.mvp],['신인왕',A.roy]].filter(x=>x[1]).map(([l,x])=>[`${y} ${l}`,x]):Object.entries(A.gg||{}).filter(x=>x[1]).map(([pos,x])=>[`${y} 골든글러브(${pos.startsWith('OF')?'외야수':pos==='P'?'투수':POSS[pos]})`,x]); }
function awPendFor(p){const L=[];for(const y of Object.keys(G.awards||{}).map(Number)){const A=G.awards[y];if(!A?.pend)continue;for(const k of ['mvp','gg'])if(A.pend[k])for(const [l,x] of awLabels(A,k,y))if(x.id===p.id)L.push(l);}return L;}
/* 해외에 나가 있는 국내 선수의 보관 정보(pj)에 수상 이력을 더한다. 돌아오면 그 정보로 선수가 되살아나 이력이 이어진다 */
function awAbroad(id,label,tid){ const a=(G.abroad||[]).find(r=>r.id===id&&!r.back&&r.pj); if(!a)return false; let q; try{ q=JSON.parse(a.pj); }catch(e){ return false; }
  if(!(q.aw=q.aw||[]).includes(label)){q.aw.push(label);try{story(q,label,'award');}catch(e){}} a.pj=JSON.stringify(q); (a.aw=a.aw||[]).includes(label)||a.aw.push(label); { const ar=G.arch&&G.arch[id]; if(ar){ (ar.aw=ar.aw||[]).includes(label)||ar.aw.push(label); } } /* 시상 화면에서 여는 보관 선수 카드에도(검수 11-08) */ const t=tid===undefined?a.from:tid;if(t!=null)chron('award',`${a.name} ${label}`,id,t,{source:'award:'+label+':'+id}); return true; }
function awNowClub(x,y){const p=G.players[x.id];if(p&&p.team!=null&&!p.arch)return p.team;let q=p;try{if(!q&&G.arch?.[x.id])q=archP(G.arch[x.id]);if(!q){const a=(G.abroad||[]).find(a=>a.id===x.id&&a.pj&&!a.back);if(a)q=JSON.parse(a.pj);}const h=q&&seasonTotal(q,y,'1군');if(h)return awTeamOf(q,h,y);}catch(e){}return x.t??null;}
/* 시상은 선수별 전달과 행사 발표를 따로 완료한다. label/지급 원장은 반복 실행의 영수증이다. */
function awReceipt(id,label){if((G.players[id]?.aw||[]).includes(label)||(G.arch?.[id]?.aw||[]).includes(label)||(G.legends||[]).some(r=>(r.pid??r.id)===id&&(r.aw||[]).includes(label)))return true;for(const a of G.abroad||[])if(a.id===id){if((a.aw||[]).includes(label))return true;try{if((JSON.parse(a.pj).aw||[]).includes(label))return true;}catch(e){}}return false;}
function awardCopySync(A,y){const L=G.last;if(!L||L.y!==y||!L.awards||L.awards===A||JSON.stringify(L.awards)===JSON.stringify(A))return 0;L.awards=JSON.parse(JSON.stringify(A));return 1;}
function awOptionPending(id,y){const p=G.players[id],o=p&&p.opt;return !!((G.optLed||[]).some(x=>x.pid===id&&x.y===y&&!x.paid)||o&&o.c==='gg'&&o.a>0&&!(o.from>y)&&!(o.until<y)&&o.paidY!==y&&p.ctT!=null);}
function awardResumeMigrate(){let n=0;for(const ys in G.awards||{}){const y=+ys,A=G.awards[ys];if(!A?.pend)continue;for(const k of ['mvp','gg']){const P=A.delivery?.[k];if(P?.done){if(A.pend[k]){A.pend[k]=false;n++;}continue;}if(A.pend[k]||P||!Number.isFinite(A.cd?.[k]))continue;const L=awLabels(A,k,y),has=L.some(([l,x])=>awReceipt(x.id,l)),missing=L.some(([l,x])=>!awReceipt(x.id,l)),unpaid=k==='gg'&&L.some(([l,x])=>awReceipt(x.id,l)&&awOptionPending(x.id,y));if(!has||!missing&&!unpaid)continue;
  const published=(G.cerNew?.y===y&&G.cerNew.k===k)||(G.mail||[]).some(m=>(m.acts||[]).some(a=>a.a==='cerOpen'&&a.v===y+':'+k)),D={d:A.cd[k],prepared:true,delivered:{},errors:{},news:published?{mvp:true,roy:true,gg:true}:{},mail:published};for(const[l,x]of L)if(awReceipt(x.id,l)&&!(k==='gg'&&awOptionPending(x.id,y)))D.delivered[l+':'+x.id]=true;(A.delivery=A.delivery||{})[k]=D;A.pend[k]=true;A.days=A.days||{mvp:A.cd.mvp??dnum(y,11,24),gg:A.cd.gg??dnum(y,12,9)};n++;}n+=awardCopySync(A,y);}return n;}
function awardCeremony(k,y=G.year){const A=G.awards&&G.awards[y];if(!A||!A.pend)return;let D=A.delivery&&A.delivery[k];if(D&&D.done){A.pend[k]=false;awardCopySync(A,y);return;}if(!A.pend[k])return;
  D=(A.delivery=A.delivery||{})[k]=D||{d:G.day,delivered:{},errors:{},news:{}};D.delivered=D.delivered||{};D.errors=D.errors||{};D.news=D.news||{};(A.cd=A.cd||{})[k]=D.d;
  const lst=k==='mvp'?[['MVP',A.mvp,A.cand.mvp],['신인왕',A.roy,A.cand.roy]]:Object.entries(A.gg).map(([pos,x])=>[`골든글러브(${pos.startsWith('OF')?'외야수':pos==='P'?'투수':POSS[pos]})`,x,pos.startsWith('OF')?A.cand.gg.OF:A.cand.gg[pos]]);
  if(!D.prepared){for(const[lab,x,C]of lst){if(!x)continue;for(const c of C||[]){c.t=awNowClub(c,y);if(c.mg===undefined){const m=mgrOf(c.t);c.mg=m&&!m.interim?m.name:'';}}x.t=awNowClub(x,y);}D.prepared=true;}
  const me=ME(),ours=tid=>me!=null&&tid===me,mine=lst.filter(([lab,x])=>x&&ours(x.t)).map(([lab,x])=>x.name+' '+lab);
  for(const[lab,x,C]of lst){if(!x)continue;const key=y+' '+lab+':'+x.id;if(D.delivered[key])continue;try{const p=G.players[x.id],tt=x.t;if(k==='gg')optLedPay(x.id,y,x.name);if(p){const added=addAward(p,`${y} ${lab}`,tt);if(added!==false&&ours(tt))p.mor=clamp((p.mor??60)+6,0,100);if(k==='gg')optAward(p,y);}
    else if(awAbroad(x.id,`${y} ${lab}`,tt)){} /* 시상식 전에 해외로 떠난 선수: 해외 보관 정보(복귀 때 되살아나는 선수 정보)에 넣는다 */
    else { const ar=G.arch&&G.arch[x.id]; if(ar){ (ar.aw=ar.aw||[]).includes(`${y} ${lab}`)||ar.aw.push(`${y} ${lab}`); } /* 시상식 전에 방출·은퇴로 지워진 선수: 보관 기록에 */
      const r=(G.legends||[]).find(r=>(r.pid??r.id)===x.id); if(r&&!(r.aw||[]).includes(`${y} ${lab}`)){ r.awP=(r.awP||[]).filter(l=>l!==`${y} ${lab}`); (r.aw=r.aw||[]).push(`${y} ${lab}`); /* 후보 발표 전에 은퇴한 선수도(awP 없음, 검수 11-09zp) */ if(lab==='MVP')r.mvp++; if(lab.includes('골든'))r.gg++; { const o=(G.ob||[]).find(o=>o.fid===x.id||o.pid===x.id); if(o){ o.awards=(o.awards||0)+1; } }
      if(!r.hof&&hofQual(r.warExact??r.warA??r.war,r.mvp,r.gg)){ r.hof=true; { const o=(G.ob||[]).find(o=>o.fid===x.id||o.pid===x.id); if(o)o.hof=true; } /* OB 카드도 헌액·수상 반영(검수 11-08) */ news('기록',`${r.name}, 명예의 전당 헌액`,`은퇴한 ${r.name}이(가) 마지막 시즌 ${lab} 수상으로 명예의 전당 기준을 채웠습니다.`,0); } } }
    if(tt!=null)chron('award',`${p?p.name:x.name} ${y} ${lab}`,x.id,tt,{source:'award:'+y+' '+lab+':'+x.id});
    /* WAR 1위가 표에서 졌으면 논란 기사 */
    if(C&&C.length>1&&k==='mvp'){ const top=[...C].sort((a,b)=>b.w-a.w)[0]; if(top.id!==x.id&&top.w-C[0].w>=.8)news('기록',`${lab} 수상 논란: WAR 1위 ${awN(top)} 대신 ${awN(x)}`,`WAR ${top.w}의 ${awN(top)}이(가) ${C.find(c=>c.id===top.id).v}표에 그쳤습니다. 기자단 표심이 눈에 띄는 기록 쪽으로 기울었다는 분석입니다.`,0); }
    D.delivered[key]=true;delete D.errors[key];}catch(e){D.errors[key]=String(e&&e.message||e);}}
  if(Object.keys(D.errors).length){awardCopySync(A,y);return;}
  A.pend[k]=false;try{
  if(k==='mvp'){if(A.mvp&&!D.news.mvp){news('선수',`${awN(A.mvp)}, ${y} 정규시즌 MVP`,`${tname(A.mvp.t)}의 ${awN(A.mvp)}이(가) 1위표 ${A.mvp.v}표를 받아 MVP를 차지했습니다. ${A.mvp.line}.${awPredLine(A,'mvp')}`,ours(A.mvp.t)?3:0,{ref:A.mvp.id,fanW:ours(A.mvp.t)?2:0,act:{l:'시상 결과',a:'awOpen',v:String(y)}});D.news.mvp=true;}if(A.roy&&!D.news.roy){news('선수',`${awN(A.roy)}, ${y} 신인왕`,`${tname(A.roy.t)}의 ${awN(A.roy)}이(가) ${A.roy.v}표로 신인왕에 올랐습니다.`,ours(A.roy.t)?2:0,{ref:A.roy.id,act:{l:'시상 결과',a:'awOpen',v:String(y)}});D.news.roy=true;}}
  else if(!D.news.gg){const gg=Object.values(A.gg).filter(x=>ours(x.t));news('선수',me==null?`${y} 골든글러브 수상자 발표`:gg.length?`${y} 골든글러브: ${tshort(me)} ${gg.length}명 수상`:`${y} 골든글러브, ${tshort(me)} 수상자 없어`,(me==null?Object.values(A.gg).filter(Boolean).map(awN).join(', '):gg.length?`${gg.map(awN).join(', ')}이(가) 황금장갑을 꼈습니다.`:'우리 구단은 수상자를 내지 못했습니다.')+awPredLine(A,'gg'),me==null?0:gg.length>=3?2:gg.length?1:-1,{act:{l:'시상 결과',a:'awOpen',v:String(y)}});try{starAwardsNews(y);}catch(e){}D.news.gg=true;}
  if(k==='gg')optLedDone(y);
  if(!D.mail){G.cerNew={y,k,d:D.d};mail('홍보팀',`${y} ${k==='mvp'?`${ASSOC.s} 시상식(MVP·신인왕)`:'골든글러브 시상식'}`,`오늘 ${k==='mvp'?`${ASSOC.s} 시상식`:'골든글러브 시상식'}이 열렸습니다.${mine.length?` 우리 구단 수상: ${mine.join(', ')}.`:me==null?' 시상 결과를 기록했습니다.':' 우리 구단 수상자는 없습니다.'}\n\n시상식 화면에서 후보와 투표 결과를 확인할 수 있습니다.`,{imp:true,kind:'기록',...(mine.length?{cat:'must'}:{}),acts:[{l:'시상식 보기',a:'cerOpen',v:`${y}:${k}`}]});D.mail=true;}D.done=true;delete D.publishError;awardCopySync(A,y);}
  catch(e){A.pend[k]=true;D.publishError=String(e&&e.message||e);awardCopySync(A,y);throw e;}}
/* 창단 드래프트 게임: 같은 구단 번호라도 창단 이전 기록은 우리 구단 기록이 아니다 */
/* 사람의 소속과 무관한 같은 결번 기준. 추정 경력과 창단 이전 타 구단 기록은 제외한다. */
function retNoRule(){const war=retWarT();return {war,seasons:war>=60?10:8};}
function retNoStats(p,tid){const years=new Set();let war=0;const first=G.fd&&G.startY?G.startY:-Infinity;for(const h of p.hist||[]){if(h.lvl!=='1군'||h.y2||h.t!==tid||h.y<first||!careerPlayed(h))continue;war+=warOf(h,p);years.add(h.y);}const kwar=war,ovs=ovsWarFrom(p,tid);war+=ovs;return {war,kwar,ovs,ys:years.size,years:[...years].sort((a,b)=>a-b)};}
/* 이 구단에서 해외로 나가 1군(MLB·NPB)에서 쌓은 WAR: 영구결번 판단에 더한다(커뮤니티 건의 11-11). NPB는 리그 수준을 감안해 70%만. 마이너·2군 기록과 시즌 수는 넣지 않는다 */
function ovsWarFrom(p,tid){ let w=0; for(const a of G.abroad||[]){ if(a.id!==p.id||a.foreign||a.from!==tid)continue; for(const line of a.lines||[])for(const l of ovsParts(line)){ if(l.lvl!=='MLB'&&l.lvl!=='NPB')continue; let v=0; try{ const {x,...row}=l;v=warOf({...row,y:row.y??line.y},p); }catch(e){} if(Number.isFinite(v))w+=v*(l.lvl==='MLB'?1:.7); } } return w; }
function recordRetirement(p,c){const ids=new Set([p.team,p.faFrom,p.relT,...Object.keys(c.byTeam).map(Number)].filter(t=>t!=null&&team(t)));for(const tid of ids){const T=retNoStats(p,tid),where=p.team===tid?'현역 은퇴':'출신 선수 현역 은퇴';chron('retire',`${p.name} ${where} · 통산 1군 WAR ${c.war.toFixed(1)}${T.ys?` · ${tshort(tid)} ${T.ys}시즌 WAR ${T.war.toFixed(1)}`:''}`,p.id,tid,{source:'retire:'+p.id+':'+G.year});}}

function fdMine(p){ if(!G.fd||!G.startY)return null; let war=0; const ys=new Set(); for(const h of p.hist){ if(h.lvl!=='1군'||h.t!==G.user||h.y<G.startY||!careerPlayed(h))continue; war+=warOf(h,p); ys.add(h.y); } return ys.size?{war:+war.toFixed(1),ys:ys.size}:null; }
function retireRecord(p){ const c=careerOf(p);p.retY=G.year;legendRetire(p);recordRetirement(p,c); const aw=p.aw||[]; const awP=awPendFor(p),counts=hofAwardCounts(aw);
  const rec={name:p.name,isP:p.isP,pos:p.isP?posLabel(p):POSK[p.pos],y:G.year,age:p.age,seasons:c.seasons.size,teams:[...c.teams],war:+c.war.toFixed(1),warExact:c.war,pa:c.pa,h:c.h,hr:c.hr,rbi:c.rbi,sb:c.sb,outs:c.outs,ip:c.outs/3,w:c.w,sv:c.sv,so:c.so,id:p.id,awP,aw:aw.slice(-12),mvp:counts.mvp,gg:counts.gg,awRegV:1,no:jno(p),mineTid:G.user,
    mine:fdMine(p)||(G.fd?null:c.byTeam[G.user]?{war:+c.byTeam[G.user].war.toFixed(1),ys:c.byTeam[G.user].ys.size}:null)}; { const nu=noAt(p,G.user); if(nu!=null&&rec.mine)rec.noU=nu; } /* 나중에 영구결번으로 지정할 때 쓸 우리 구단 등번호 */
  { const miss=Math.max(0,(p.svc||0)-rec.seasons); if(miss){ const add=miss*clamp((p.pot-45)/5,0,4.5); rec.warA=rec.war; /* 실제 기록(통산 순위용) */ rec.seasons+=miss; rec.war=+(rec.war+add).toFixed(1); rec.est=true;
      if(p.team===G.user&&c.teams.size<=1&&!G.fd){ rec.mine=rec.mine||{war:0,ys:0}; rec.mine.war=+(rec.mine.war+add).toFixed(1); rec.mine.ys+=miss; } } } /* 게임 시작 전 경력은 연차와 잠재력으로 추정 */
  if(rec.war>=8||rec.aw.length||awP.length){ rec.pid=rec.pid??p.id; (G.legends=G.legends||[]).push(rec); if(G.legends.length>300){ const i=G.legends.findIndex(x=>!x.hof&&!x.retNo&&!x.canRetNo&&!(x.mine&&x.mine.ys)); if(i>=0)G.legends.splice(i,1); } } /* 넘치면 명예의 전당·결번·우리 구단 기록이 아닌 오래된 것부터 지운다 */
  rec.retByTeamFull=!rec.est&&!(p.hist||[]).some(h=>h.lvl==='1군'&&h.y2);rec.retByTeam={};for(const tid of new Set([...c.teams,...(G.abroad||[]).filter(a=>a.id===p.id&&!a.foreign).map(a=>a.from)].filter(t=>t!=null&&team(t))))rec.retByTeam[tid]={...retNoStats(p,tid),no:noAt(p,tid)};
  const hof=hofQual(rec.warExact,rec.mvp,rec.gg);
  if(hof){ rec.hof=true; mail('홍보팀',`${rec.name}, 명예의 전당 헌액`,`${rec.name}이(가) 은퇴와 함께 명예의 전당에 올랐습니다. 통산 ${rec.seasons}시즌 · WAR ${rec.war}${rec.isP?` · ${rec.w}승 ${rec.sv}세이브`:` · ${rec.h}안타 ${rec.hr}홈런`}${rec.mvp?` · MVP ${rec.mvp}회`:''}${rec.gg?` · 골든글러브 ${rec.gg}회`:''}.`,{kind:'기록'}); if(rec.mine&&rec.mine.ys>=5)news('선수',`${tshort(G.user)} 레전드 ${rec.name}, 명예의 전당으로`,`구단 역사에 남을 선수가 명예의 전당에 올랐습니다.`,2,{fanW:2}); }
  const basis=retNoStats(p,G.user),rule=retNoRule(),ownNo=noAt(p,G.user);if(basis.ys>=rule.seasons&&basis.war>=rule.war&&Number.isInteger(ownNo)&&ownNo>=0&&ownNo<=99){rec.retNoBasis={war:+basis.war.toFixed(1),ys:basis.ys,...(basis.ovs?{ovs:+basis.ovs.toFixed(1)}:{})};rec.retNoRule={...rule};rec.mine={...rec.retNoBasis}; rec.canRetNo=true; rec.tid=G.user; rec.pid=rec.pid??p.id; rec.no=ownNo; /* 결번은 그 구단에서 단 번호(검수 11-09zp) */ if(!G.ob){ mail('홍보팀',`${rec.name} 영구결번 검토`,`${rec.name}이(가) 우리 구단에서 ${rec.mine.ys}시즌 동안 WAR ${rec.mine.war}를 남기고 은퇴합니다. 등번호 ${rec.no}번을 영구결번으로 지정하면 팬들이 크게 반길 것입니다.`,{imp:true,kind:'기록',acts:[{l:`${rec.no}번 영구결번 지정`,a:'retNo',v:'p'+rec.pid}]}); }  }
  aiRetireNumbers(p,c,rec);
  return rec; }
/* AI도 실제 구단별 공헌으로만 결번을 지정한다. 통산 추정 WAR·귀속 불명 번호는 심사에 쓰지 않는다. */
function aiRetireNumbers(p,c,rec){
  const wins=new Map(); const win=(tid,y)=>{ if(tid==null||!Number.isInteger(y))return; if(!wins.has(tid))wins.set(tid,new Set()); wins.get(tid).add(y); };
  for(const h of G.history||[])win(h.champ,h.y);
  for(const h of Object.values(G.champEvents||{}))win(h.tid,h.y); /* 구단·연도가 명시된 우승만 */
  if(G.ps&&G.ps.champ!=null)win(G.ps.champ,G.year);
  const rule=retNoRule();for(const key in c.byTeam){ const tid=+key, T=retNoStats(p,tid);
    if(!Number.isInteger(tid)||!team(tid)||tid===ME()||!Number.isFinite(T.war)||T.war<rule.war||T.ys<rule.seasons)continue;
    const years=new Set(T.years);
    const cy=[...(wins.get(tid)||[])].filter(y=>years.has(y)).sort((a,b)=>a-b);
    const no=noAt(p,tid); if(!Number.isInteger(no)||no<0||no>99)continue;
    const O=G.orgT=G.orgT||{}, state=O[tid]=O[tid]||{};
    const L=tid===G.user?(G.retNos=G.retNos||[]):(state.retNos=state.retNos||[]);
    if(L.some(r=>r.no===no||r.pid===p.id))continue; /* 동일 번호의 중복 결번·동일 인물 재지정 금지 */
    if(tid===G.user)state.retNos=L; /* 야인일 때도 옛 구단 목록과 같은 장부 */
    const ob=(G.ob||[]).find(o=>o.fid===p.id), row={tid,no,name:p.name,pid:p.id,ob:ob?ob.id:null,y:G.year,war:+T.war.toFixed(1),ys:years.size,champYears:cy,rule:{...rule},auto:true}; L.push(row);
    (rec.retNos=rec.retNos||[]).push({tid,no,y:G.year});
    if(ob){ ob.retNo=true; (ob.retNos=ob.retNos||[]).push({tid,no,y:G.year}); }
    for(const q of Object.values(G.players))if(q.team===tid&&q.id!==p.id&&q.no===no){ q.noT=null; jno(q); }
    const title=`${tshort(tid)}, ${p.name}의 ${no}번 영구결번`;
    wire('영구결번',title,{tid,ref:p.id});
    chron('retNo',`${title} (${years.size}시즌 · WAR ${T.war.toFixed(1)} ${cy.length?` · 한국시리즈 우승 ${cy.join('·')}년`:''})`,p.id,tid,{source:'retNo:'+G.year+':'+no});
    const event=G.chron[G.chron.length-1]; if(event&&event.ref===p.id&&event.tid===tid)event.gm=0;
  }
}
/* 등번호: 선수마다 하나(p.no). 처음 볼 때 정해 두고, 같은 구단 안에서는 겹치지 않으며 우리 구단 영구결번은 쓰지 않는다. 팀을 옮겨 겹치면 새 구단에서 다시 고른다 */
function teamNos(tid,exc){ const S=new Set(); if(tid==null)return S; for(const q of Object.values(G.players))if(q.team===tid&&q!==exc&&q.no!=null)S.add(q.no); for(const r of retNosOf(tid))S.add(r.no); return S; }
/* 구단의 영구결번: 맡고 있으면 G.retNos, 떠난 구단은 G.orgT에 둔 것. 누가 맡든 그 구단 번호는 쓰지 않는다(검수 11-09zp) */
function retNosOf(tid){ return tid===G.user?(G.retNos||[]):((G.orgT||{})[tid]||{}).retNos||[]; }
/* 그 구단에서 단 등번호: 지금 구단이면 p.no, 떠난 구단이면 옮길 때 남긴 p.noBy */
function noAt(p,tid){ return p.noT===tid&&p.no!=null?p.no:p.noBy&&p.noBy[tid]!=null?p.noBy[tid]:null; }
function jno(p){ if(!p)return null; if(p.no!=null&&(p.noT===p.team||p.team==null))return p.no;
  const used=teamNos(p.team,p); let n=p.no!=null&&!used.has(p.no)?p.no:1+Math.floor(u01('jno',p.id)*99); let g=0; while(used.has(n)&&g++<100)n=(n+1)%100; /* 0번까지 돌아본다(KBO 0~99, 검수 11-09zz) */ if(p.team!=null){ if(p.noT!=null&&p.no!=null)(p.noBy=p.noBy||{})[p.noT]=p.no; p.no=n; p.noT=p.team; } return n; }
/* 등번호 고치기(유저 편집). 0~99, 같은 구단 선수와 겹치면 안 되고 그 구단 영구결번은 쓸 수 없다. 이름은 22c_cosmetic.js(setPlayerName). 능력·잠재력·나이 에디터는 없앴다(구단주 결정 11-17) */
function playerNoPermit(p,r){ const a=p.retNoPermit; return !!(a&&a.tid===p.team&&a.no===r.no&&a.ob===p.father&&sonRetOwn(r,fatherOf(p))); }
/* 등번호 검사만(바꾸지 않는다). 쓸 수 있으면 '' — 여러 칸을 한꺼번에 저장할 때 먼저 검사(외부 검수 11-17) */
function playerNoErr(id,v){ const p=G.players[id]; if(!p)return '선수를 찾을 수 없습니다.'; const s=String(v??'').trim(); if(!/^\d{1,2}$/.test(s))return '등번호는 0~99 숫자로 입력하세요.'; const n=+s; if(p.team==null)return '소속 구단이 있는 선수만 등번호를 정할 수 있습니다.'; if(retNosOf(p.team).some(r=>r.no===n&&!playerNoPermit(p,r)))return `${n}번은 ${p.team===G.user?'우리 구단':tshort(p.team)} 영구결번입니다.`;
  const o=Object.values(G.players).find(q=>q!==p&&q.team===p.team&&jno(q)===n); if(o)return `${n}번은 ${o.name} 선수가 쓰고 있습니다.`; return ''; }
function setPlayerNo(id,v){ const e=playerNoErr(id,v); if(e)return e; const p=G.players[id], n=+String(v??'').trim(); jno(p); /* 옛 구단 번호를 noBy에 남긴 뒤 바꾼다 */ p.no=n; p.noT=p.team; return ''; }
/* 등번호 한 번에 바꾸기(커뮤니티 피드백 11-11): 바꿀 번호를 모두 받아, 바꾼 뒤 모습 전체로 겹침·영구결번을 확인하고 한꺼번에 적용한다(서로 맞바꾸기 가능) */
function setPlayerNos(M){ const tid=G.user; if(G.unemp||tid==null)return {err:'맡은 구단이 없습니다.'}; const L=playersOf(tid); const fin=new Map(L.map(p=>[p.id,jno(p)])); const errs=[]; let n=0;
  for(const k in M){ const p=G.players[k]; if(!p||p.team!==tid)continue; const s=String(M[k]??'').trim(); if(s==='')continue; if(!/^\d{1,2}$/.test(s)){ errs.push(`${p.name}: 0~99 숫자로 입력하세요.`); continue; } const v=+s; if(v===jno(p))continue;
    if(retNosOf(tid).some(r=>r.no===v&&!playerNoPermit(p,r))){ errs.push(`${p.name}: ${v}번은 영구결번입니다.`); continue; } fin.set(p.id,v); n++; }
  const by=new Map(); for(const [id,v] of fin){ if(!by.has(v))by.set(v,[]); by.get(v).push(id); } for(const [v,ids] of by)if(ids.length>1)errs.push(`${v}번이 겹칩니다: ${ids.map(id=>G.players[id].name).join(', ')}`);
  if(errs.length)return {err:errs.join('\n')}; if(!n)return {err:'바뀐 번호가 없습니다.'};
  for(const p of L){ const v=fin.get(p.id); if(v!==jno(p)){ p.no=v; p.noT=tid; } } return {n}; }
/* 영구결번 후보: 지금 맡은 구단 후보만(이직하면 옛 구단 후보는 그 구단 것, 검수 11-09zp) */
/* 이미 은퇴한 선수도 지금 기준으로 다시 본다(전영준 11-17 '영구결번 나중에 지정'): 은퇴 때 남긴 우리 구단 기록(mine: 시즌·WAR)이 지금 영구결번 기준을 채우면 후보가 된다.
   기준을 낮추면 예전에 못 미쳤던 선수도 후보로 올라온다. 이미 후보이거나 지정된 선수, 다른 구단 후보는 그대로 */
function retNoMineTid(r){if(r.mineTid!=null)return r.mineTid;if(r.tid!=null)return r.tid;return (r.teams||[]).length===1?r.teams[0]:null;}
function retNoBasisAt(r,tid){if(r.retByTeam)return r.retByTeam[tid]||null;const a=G.arch?.[r.pid??r.id];if(a?.rows){const p=archP(a);return {...retNoStats(p,tid),no:retNoMineTid(r)===tid?r.noU??r.no:null};}if(r.mine&&retNoMineTid(r)===tid&&!r.est)return {...r.mine,no:r.noU??r.no};return null;}
function retNoRecheck(){ const rule=retNoRule(); for(const r of G.legends||[]){if(r.retNo)continue;if(r.canRetNo){if(r.tid==null){const t=retNoMineTid(r);if(t!=null)r.tid=t;else r.canRetNo=false;}if(r.canRetNo)continue;}if(r.tid!=null&&r.tid!==G.user)continue;const basis=retNoBasisAt(r,G.user);if(!basis||!(basis.ys>0))continue;
    if(basis.ys>=rule.seasons&&basis.war>=rule.war&&basis.no!=null){r.canRetNo=true;r.tid=G.user;r.retNoBasis={war:basis.war,ys:basis.ys};r.retNoRule={...rule};r.late=true;r.no=basis.no;} } }
function retNoCands(){ try{ retNoRecheck(); }catch(e){} return (G.legends||[]).map((r,i)=>({r,i})).filter(x=>x.r.canRetNo&&!x.r.retNo&&(x.r.tid==null||x.r.tid===G.user)); }
function retireNumber(i){retNoRecheck(); const L=G.legends||[]; const r=typeof i==='string'&&i[0]==='p'?L.find(x=>'p'+x.pid===i):L[+i]; /* 위치 대신 선수 id로 찾는다(목록이 잘려 위치가 밀려도 맞는 선수) */ if(!r||!r.canRetNo||r.retNo||r.tid!==G.user||G.unemp)return '대상이 아닙니다.'; { const d=(G.retNos||[]).find(x=>x.no===r.no); if(d)return `${r.no}번은 이미 ${d.name}의 영구결번입니다. 같은 번호는 한 번만 지정할 수 있습니다.`; } /* 검수 11-08 */ r.retNo=true; (G.retNos=G.retNos||[]).push({name:r.name,no:r.no,y:G.year,pid:r.pid,...(()=>{const o=(G.ob||[]).find(o=>o.fid===r.pid);return o?{ob:o.id}:{};})()}); { const o=(G.ob||[]).find(o=>o.fid===r.pid); if(o){ o.retNo=true; o.no=r.no; } } /* OB 카드도 같은 결번(검수 11-09zp) */ const mv=[]; for(const q of Object.values(G.players))if(q.team===G.user&&q.id!==r.pid&&q.no===r.no){ q.noT=null; jno(q); mv.push(`${q.name} ${q.no}번`); } /* 그 번호를 쓰던 현역은 새 번호로 */ chron('retNo',`${r.name} ${r.no}번 영구결번 지정`,r.pid??null,G.user,{source:'retNo:'+G.year+':'+r.no});news('선수',`${tshort(G.user)}, ${r.name}의 ${r.no}번 영구결번`,`구단 역사에 길이 남을 이름이 됐습니다.`,3,{fanW:3}); return `${r.no}번을 영구결번으로 지정했습니다.${mv.length?` 그 번호를 쓰던 선수는 바꿨습니다: ${mv.join(', ')}.`:''}`; }

/* 원본이 남은 은퇴 요약만 복원한다. 반올림된 표시값으로 정밀 기록이나 구단 귀속을 추정하지 않는다. */
function retirementMigrate(){if(!G)return;const invalid=new Set(),knownKeys=new Set(),records=[...(G.legends||[]),...(G.hof||[])];for(const r of records){const id=r.pid??r.id,a=G.arch?.[id],rows=(a?.rows||[]).filter(careerPlayed);let known=false;
    if(rows.length){if(!Number.isFinite(r.warExact)&&rows.every(h=>Number.isFinite(h.war))){r.warExact=sum(rows.map(h=>h.war));known=true;}if(r.isP&&!Number.isFinite(r.outs)){r.outs=sum(rows.map(h=>h.outs||0));r.ip=r.outs/3;}if(!r.retByTeam){const p=archP(a),owner=r.mineTid??((r.teams||[]).length===1?r.teams[0]:null);r.retByTeam={};for(const tid of new Set(rows.map(h=>h.t).filter(t=>t!=null&&team(t))))r.retByTeam[tid]={...retNoStats(p,tid),no:owner===tid?r.noU??r.no:null};}if(!r.est&&Number.isFinite(r.seasons)&&r.seasons===new Set(rows.map(h=>h.y)).size&&(r.teams||[]).every(t=>rows.some(h=>h.t===t)))r.retByTeamFull=true;}
    if(r.mineTid==null){const t=(r.teams||[]).length===1?r.teams[0]:null;if(t!=null)r.mineTid=t;}
    if(!r.awRegV){const full=Array.isArray(a?.aw)?a.aw:null,C=hofAwardCounts(full||r.aw),all=[...new Set(r.aw||[])],bad=all.filter(x=>/MVP/.test(x)).length-hofAwardCounts(all).mvp;r.mvp=full?C.mvp:Math.max(C.mvp,(r.mvp||0)-bad);if(full)r.gg=C.gg;r.awRegV=1;if(bad||full)known=true;}
    if(Number.isFinite(r.warExact))known=true;if(known)knownKeys.add(retiredKey(r));
    if(r.canRetNo&&!r.retNo&&r.tid!=null&&r.retByTeam){const b=r.retByTeam[r.tid],rule=r.retNoRule||retNoRule();if(!b||b.ys<rule.seasons||b.war<rule.war){r.canRetNo=false;delete r.tid;delete r.retNoBasis;}}
  }const groups=new Map();for(const r of records){const k=retiredKey(r);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}for(const [k,L] of groups){const exact=L.find(r=>Number.isFinite(r.warExact))?.warExact,detail=L.find(r=>Array.isArray(G.arch?.[r.pid??r.id]?.aw))||L.find(r=>(G.legends||[]).includes(r)&&Array.isArray(r.aw)&&r.aw.some(x=>/MVP/.test(x))),mvp=detail?detail.mvp||0:Math.max(0,...L.map(r=>r.mvp||0)),gg=Math.max(0,...L.map(r=>r.gg||0));for(const r of L){if(exact!=null)r.warExact=exact;r.mvp=mvp;r.gg=gg;}const ref=L.find(r=>r.warA!=null)||L.find(r=>r.war!=null)||L[0],war=exact??ref.warA??ref.war;if(knownKeys.has(k)&&!hofQual(war,mvp,gg)){for(const r of L)if(r.hof||(G.hof||[]).includes(r))r.hof=false;invalid.add(k);const o=(G.ob||[]).find(o=>String(o.fid)===k);if(o)o.hof=false;}}
  if(Array.isArray(G.hof))G.hof=hofList().filter(r=>!invalid.has(retiredKey(r)));for(const a of Object.values(G.arch||{}))if(a.retY==null){const y=retiredYearOf(a);if(y!=null)a.retY=y;}retNoWrongClubFix();retNoRecheck();}
/* 완전한 구단별 원본이 그 구단 출장·공헌이 없음을 증명할 때만 잘못 귀속된 결번을 걷는다. */
function retNoWrongClubFix(){const proof=new Map();for(const r of [...(G.legends||[]),...(G.hof||[])])if(r.retByTeamFull&&r.retByTeam)proof.set(retiredKey(r),r);const removed=[],pid=r=>r.pid??(G.ob||[]).find(o=>o.id===r.ob)?.fid,books=[{tid:G.user,L:G.retNos},...Object.entries(G.orgT||{}).map(([tid,o])=>({tid:+tid,L:o?.retNos}))];
  for(const {tid,L} of books){if(!Array.isArray(L))continue;for(let i=L.length-1;i>=0;i--){const row=L[i],id=pid(row),r=proof.get(String(id));if(!r)continue;const b=r.retByTeam[tid];if(b&&((b.ys||0)>0||(b.kwar??b.war??0)!==0||(b.ovs||0)!==0))continue;removed.push({tid,row,id});L.splice(i,1);}}
  if(!removed.length)return;const notes=G.retNoCorrections=G.retNoCorrections||[];for(const {tid,row,id} of removed){if(!notes.some(x=>x.tid===tid&&x.pid===id&&x.no===row.no&&x.y===row.y))notes.push({tid,pid:id,no:row.no,y:row.y,why:'구단 공헌 없는 결번 귀속 정정'});const match=e=>e.k==='retNo'&&e.tid===tid&&String(e.ref)===String(id)&&(e.source==='retNo:'+row.y+':'+row.no||e.y===row.y&&String(e.t||'').includes(row.no+'번'));for(const L of [G.chron,G.clubHist?.[tid]])if(Array.isArray(L))for(let i=L.length-1;i>=0;i--)if(match(L[i]))L.splice(i,1);}
  for(const id of new Set(removed.map(x=>String(x.id)))){const M=new Map();for(const {tid,L} of books)for(const r of L||[])if(String(pid(r))===id)M.set(tid+':'+r.no+':'+r.y,{tid,no:r.no,y:r.y});const live=[...M.values()];for(const r of [...(G.legends||[]),...(G.hof||[])])if(retiredKey(r)===id){r.retNo=live.length>0;r.retNos=live;if(removed.some(x=>String(x.id)===id&&x.tid===r.tid)){r.canRetNo=false;if(live.length)r.tid=live[0].tid;else delete r.tid;delete r.retNoBasis;}}const o=(G.ob||[]).find(o=>String(o.fid)===id);if(o){o.retNo=live.length>0;o.retNos=live;}}
  _chronGame=null;_chronIds=null;_chronSources=null;
}

/* 100년 저장 크기(사용자 11-05 "100년은 즐기기 좋게"): 3년 지난 시상은 후보 명단을 상위권만 남긴다.
 30시즌 시뮬에서 시상 기록이 한 해 약 30KB씩 늘었고 대부분이 골든글러브 후보 전원의 세부 점수였다. 수상자·상위 후보·한 줄 기록은 그대로 */
function awardsCompact(){ const A=G.awards; if(!A)return; for(const y in A){ if(+y>G.year-3)continue; const a=A[y]; if(!a||a.cmp||!a.cand)continue;
  const slim=(L,n)=>(L||[]).slice(0,n).map(c=>{ const o={id:c.id,name:c.name,t:c.t,line:c.line,w:c.w,v:c.v}; if(c.pos)o.pos=c.pos; if(c.mg!=null)o.mg=c.mg; return o; });
  a.cn={mvp:(a.cand.mvp||[]).length,roy:(a.cand.roy||[]).length,gg:{}}; for(const k in (a.cand.gg||{}))a.cn.gg[k]=a.cand.gg[k].length; /* 정리 전 후보 수: 생략한 후보를 화면에 밝힌다(검수 11-09zf) */
  a.cand.mvp=slim(a.cand.mvp,5); a.cand.roy=slim(a.cand.roy,3); for(const k in (a.cand.gg||{}))a.cand.gg[k]=slim(a.cand.gg[k],k==='OF'?5:3);
  if(a.ggVote){ delete a.ggVote.ballots; delete a.ggVote.news; } a.cmp=1; } }

/* 구단 역대 기록·기록 도전 데이터(화면은 27_history) */
function teamAllTime(){ const H=(G.history||[]).filter(h=>Array.isArray(h.order)&&h.order.length&&h.order[0].w!=null); const R={};
  for(const h of H)h.order.forEach((o,i)=>{ const r=R[o.tid]=R[o.tid]||{tid:o.tid,ys:0,w:0,l:0,t:0,ps:0,ch:[],ru:0,best:null,first:h.y,last:h.y};
    r.ys++; r.w+=o.w||0; r.l+=o.l||0; r.t+=o.t||0; if(i<5)r.ps++; if(h.champ===o.tid)r.ch.push(h.y); if(h.runner===o.tid)r.ru++; r.last=h.y;
    const pct=(o.w||0)/Math.max(1,(o.w||0)+(o.l||0)); if(!r.best||pct>r.best.pct)r.best={pct,y:h.y,w:o.w,l:o.l,t:o.t||0,rk:i+1}; });
  return {n:H.length,rows:Object.values(R).filter(r=>G.teams[r.tid]).sort((a,b)=>b.ch.length-a.ch.length||b.w/Math.max(1,b.w+b.l)-a.w/Math.max(1,a.w+a.l))}; }
const MILE_W=[['h','안타',[1000,1500,2000,2500,3000],120,false],['hr','홈런',[100,200,300,400,500],25,false],['rbi','타점',[500,1000,1500],80,false],['sb','도루',[200,300,400,500],30,false],
  ['w','승',[100,150,200],15,true],['sv','세이브',[100,200,300,400],30,true],['hld','홀드',[100,150,200],25,true],['so','탈삼진',[1000,1500,2000],150,true]];
function mileWatch(){ const out=[]; for(const p of Object.values(G.players)){ if(p.team==null||p.fdPool||!(p.hist||[]).some(h=>h.lvl==='1군'))continue; const c=careerOf(p);
    for(const [k,l,goals,near,isP] of MILE_W){ if(!!p.isP!==isP)continue; const v=c[k]||0, g=goals.find(x=>x>v); if(g==null||g-v>near)continue; out.push({p,k,l,v,g,left:g-v,near}); } }
  return out.sort((a,b)=>a.left/a.near-b.left/b.near); }
/* ===== 시즌 결산 때 남기는 역사(OOTP Playoff History·Managers 참고) =====
   우승팀: 그해 1군 WAR 상위 타자 9명·투수 6명과 주요 기록, 정규시즌 성적, 한국시리즈 MVP.
   감독: 시즌을 마친 감독에게 그 시즌 성적을 붙인다(시즌 중 교체되면 마친 감독 기준, 대행 표시). 구단별 재임 구간으로 묶는다 */
function histChampionRows(y,tid){const L=[],seen=new Set();const add=p=>{if(!p||seen.has(p.id))return;seen.add(p.id);const s=seasonTotalT(p,y,'1군',tid);if(s&&((s.pa||0)+(s.outs||0)+(s.bf||0)+(s.g||0))>0)L.push({p,s});};for(const p of Object.values(G.players||{}))add(p);for(const id in G.arch||{})if(!G.players[id])try{add(archP(G.arch[id]));}catch(e){}return L;}
/* 시즌이 실제 끝난 구단의 감독만 보관한다. 결산 전 교체나 같은 종료 사건 재처리로 바꾸지 않는다. */
function histManagerFinish(tids,day,y=G.year){ const F=G.mgrFinish?.y===y?G.mgrFinish:(G.mgrFinish={y,by:{}}); for(const tid of tids||[]){ if(F.by[tid])continue; const m=G.mgr?.[tid]; if(m)F.by[tid]={id:m.id,name:m.name,interim:!!m.interim,d:day}; } return F; }
function histManagerSnapshot(h,tid){ const m=h.mgrFinish?.[tid]||(G.mgrFinish?.y===h.y?G.mgrFinish.by?.[tid]:null); if(m)return m; /* 과거 또는 이미 끝난 옛 시리즈에 현재 감독을 대입하지 않는다. */ if(h.y!==G.year||G.ps?.done&&(G.ps.y??G.year)===h.y)return null; return G.mgr?.[tid]||null; }
function histChampionSnap(h,L=histChampionRows(h.y,h.champ)){const y=h.y,old=h.cr;const W=x=>{ try{ return warOf(x.s,x.p); }catch(e){ return 0; } };
    const line=x=>x.p.isP?`${x.s.w||0}승 ${x.s.l||0}패${x.s.sv?` ${x.s.sv}세`:''}${x.s.hld?` ${x.s.hld}홀`:''} · ${ipStr(x.s.outs||0)}이닝 ERA ${((x.s.er||0)*27/Math.max(1,x.s.outs||0)).toFixed(2)}`:`${(x.s.ab?(x.s.h||0)/x.s.ab:0).toFixed(3).replace(/^0/,'')} ${x.s.hr||0}홈런 ${x.s.rbi||0}타점`;
    const pick=(isP,n)=>L.filter(x=>!!x.p.isP===isP).map(x=>({x,w:W(x)})).sort((a,b)=>b.w-a.w).slice(0,n).map(({x,w})=>({id:x.p.id,name:x.p.name,pos:posLabel(x.p),w:Math.round(w*10)/10,l:line(x)}));
    const o=(h.order||[]).find(o=>o.tid===h.champ), m=histManagerSnapshot(h,h.champ); let mvp=null; try{ mvp=champSeriesMvp(y,h.champ); }catch(e){}
    return {v:2,b:pick(false,9),p:pick(true,6),w:o?o.w:null,l:o?o.l:null,t:o?o.t||0:null,rk:(h.order||[]).findIndex(o=>o.tid===h.champ)+1,mg:old?.mg??(m?m.name:''),mvp:old?.mvp??(mvp?{id:mvp.id,n:mvp.n,line:mvp.line}:null)};}
/* 최근 시즌은 구단별 원기록으로 잘못된 우승 명단을 수리한다. 원기록이 없는 오래된 요약은 보존한다. */
function histChampionFix(){let n=0;for(const h of G.history||[]){if(!h||h.champ==null||!h.cr||h.cr.v===2||h.y<G.year-2)continue;const L=histChampionRows(h.y,h.champ);if(!L.length)continue;h.cr=histChampionSnap(h,L);n++;}return n;}
function histManagerFix(){let n=0;for(const tid in G.mgrH||{}){const seen=new Set(),out=[];for(const st of G.mgrH[tid]){const ys=st.ys||Array.from({length:Math.max(0,(st.y1??st.y0)-st.y0+1)},(_,i)=>st.y0+i),keep=ys.filter(y=>!seen.has(y));if(!keep.length&&ys.length){n++;continue;}let row=st;
    if(keep.length<ys.length){const H=keep.map(y=>(G.history||[]).find(h=>h.y===y&&h.order?.some(o=>o.tid===+tid)));if(H.every(Boolean)){row={...st,ys:keep,y0:Math.min(...keep),y1:Math.max(...keep),w:0,l:0,t:0,ps:0,ch:0,ru:0,best:null};for(const h of H){const i=h.order.findIndex(o=>o.tid===+tid),o=h.order[i];row.w+=o.w||0;row.l+=o.l||0;row.t+=o.t||0;if(i<5)row.ps++;if(h.champ===+tid)row.ch++;if(h.runner===+tid)row.ru++;if(!row.best||i+1<row.best.rk)row.best={y:h.y,rk:i+1};}n++;}}for(const y of row.ys||ys)seen.add(y);out.push(row);}G.mgrH[tid]=out;}return n;}
function histSnapSeason(h){ if(!h||h.y==null)return; const y=h.y; if(!h.mgrFinish&&G.mgrFinish?.y===y)h.mgrFinish=Object.fromEntries(Object.entries(G.mgrFinish.by).map(([tid,m])=>[tid,{...m}]));
  if(h.champ!=null&&!h.cr)h.cr=histChampionSnap(h);
  G.mgrH=G.mgrH||{}; for(const t of G.teams){ const m=histManagerSnapshot(h,t.id); if(!m)continue; const i=(h.order||[]).findIndex(o=>o.tid===t.id), o=h.order[i]; if(!o)continue; const H=G.mgrH[t.id]=G.mgrH[t.id]||[];
    if(H.some(st=>Array.isArray(st.ys)?st.ys.includes(y):st.y0<=y&&st.y1>=y))continue; /* 한 구단의 완료 시즌은 이미 그해를 마친 감독에게 귀속되어 있다. */
    let st=H[H.length-1]; if(!st||st.id!==m.id||st.y1!==y-1){ st={id:m.id,name:m.name,y0:y,y1:y,w:0,l:0,t:0,ps:0,ch:0,ru:0,best:null,act:!!m.interim}; H.push(st); }
    if(st.y1===y&&st.ys&&st.ys.includes(y))continue; st.y1=y; (st.ys=st.ys||[]).push(y); st.w+=o.w||0; st.l+=o.l||0; st.t+=o.t||0; if(i<5)st.ps++; if(h.champ===t.id)st.ch++; if(h.runner===t.id)st.ru++; if(!st.best||i+1<st.best.rk)st.best={y,rk:i+1}; if(!m.interim)st.act=false; } }
/* 명예의 전당 예정(OOTP Upcoming Eligible 참고): 이 게임은 은퇴하면 기준(통산 WAR 38, MVP 2회, 골든글러브 6회, WAR 30+MVP 1회)으로 바로 헌액한다.
   현역 중 이미 기준을 채운 선수와 가까운 선수(WAR 30 이상, 또는 MVP·골든글러브 1개 차) */
function hofWatch(){ const out=[]; for(const p of Object.values(G.players)){ if(p.team==null||p.fdPool)continue; const c=careerOf(p);if(!c.seasons.size)continue;const {mvp,gg}=hofAwardCounts(p.aw),war=c.war;
    const met=hofQual(war,mvp,gg); const near=!met&&(war>=30||mvp===1&&war>=20||gg>=5);
    if(met||near)out.push({p,war:Math.round(war*10)/10,mvp,gg,met,age:p.age,seasons:c.seasons.size}); }
  return out.sort((a,b)=>(b.met-a.met)||b.war-a.war); }
