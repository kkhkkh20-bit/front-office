/* ===== 시상·통산 기록·명예의 전당 ===== */
function careerOf(p){ const c={seasons:new Set(),teams:new Set(),pa:0,h:0,hr:0,rbi:0,sb:0,outs:0,w:0,sv:0,hld:0,so:0,war:0,byTeam:{}};
  for(const h of p.hist){ if(h.lvl!=='1군')continue; c.seasons.add(h.y); c.teams.add(h.t); const w=warOf(h,p); c.war+=w; c.byTeam[h.t]=c.byTeam[h.t]||{war:0,ys:new Set()}; c.byTeam[h.t].war+=w; c.byTeam[h.t].ys.add(h.y);
    if(p.isP){ c.outs+=h.outs||0; c.w+=h.w||0; c.sv+=h.sv||0; c.hld+=h.hld||0; c.so+=h.so||0; } else { c.pa+=h.pa||0; c.h+=h.h||0; c.hr+=h.hr||0; c.rbi+=h.rbi||0; c.sb+=h.sb||0; } }
  return c; }
/* 통산 순위 대상은 한곳에서: 기록이 있는 모든 선수(현역·FA 협상·무적·해외·은퇴, 외국인 포함). 리그에 있으면 선수 기록, 떠났으면 보관 기록(G.arch)의 실제 1군 기록만.
 보관 기록이 없는 옛 은퇴 기록은 추정치를 뺀 값을 쓰고, 뺄 수 없으면 '추정 포함'으로 밝힌다(검수 11-09zp) */
function careerBoard(){ const L=[], seen=new Set(), A=G.arch||{};
  for(const p of Object.values(G.players)){ if(p.fdPool||!p.hist.some(h=>h.lvl==='1군'))continue; seen.add(String(p.id)); const c=careerOf(p);
    L.push({name:p.name,id:p.id,t:p.team,isP:!!p.isP,war:c.war,h:c.h,hr:c.hr,w:c.w,sv:c.sv,act:p.team!=null,lab:p.team!=null?'':p.retY!=null?`${p.retY} 은퇴`:p.faFrom!=null?'FA':'무적'}); }
  for(const id in A){ const a=A[id]; if(seen.has(id)||!a||!a.rows)continue; seen.add(id); const s=k=>a.rows.reduce((t,r)=>t+(r[k]||0),0);
    L.push({name:a.name,id:a.id,isP:!!a.isP,war:s('war'),h:s('h'),hr:s('hr'),w:s('w'),sv:s('sv'),act:false,lab:(G.abroad||[]).some(r=>r.id===a.id&&!r.back)?'해외':`${a.y} 은퇴`}); }
  for(const r of (G.legends||[]).concat(G.hof||[])){ const id=String(r.pid??r.id); if(seen.has(id))continue; /* 옛 저장의 G.hof에만 남은 헌액자도(hofList와 같은 대상, 검수 11-09zz) */ seen.add(id); const est=!!r.est&&r.warA==null;
    L.push({name:r.name,id:r.pid??r.id,isP:!!r.isP,war:r.warA??r.war,h:r.h,hr:r.hr,w:r.w,sv:r.sv,act:false,lab:`${r.y} 은퇴${est?' · 추정 포함':''}`}); }
  return L; }
/* 명예의 전당은 은퇴 기록(G.legends)에서 읽는다: 따로 둔 사본은 저장·불러오기 뒤 갈라져 마지막 수상이 빠졌다(검수 11-09zp). 옛 저장의 G.hof에만 남은 헌액자도 보탠다 */
function hofList(){ const L=(G.legends||[]).filter(r=>r.hof), ids=new Set(L.map(r=>String(r.pid??r.id))); for(const r of (G.hof||[]))if(!ids.has(String(r.pid??r.id)))L.push(r); return L; }
function addAward(p,label,tid){ (p.aw=p.aw||[]).push(label); story(p,label,'award'); if((tid===undefined?p.team:tid)===G.user&&!G.unemp)chron('award',`${p.name} ${label}`,p.id); } /* tid: 그 시즌 성적을 낸 구단(시상 전 이적해도 그 구단 연혁에, 검수 11-09zf) */
/* ===== 구단 연대기: 구단마다 해마다 일어난 일을 쌓는다 ===== */
function chron(k,t,ref,tid){ tid=tid??G.user; if(tid==null)return; G.chron=G.chron||[]; G.chron.push({y:G.year,d:G.day,tid,k,t,ref:ref??null,gm:G.unemp?0:1}); if(G.chron.length>900){ const KEEP=new Set(['found','champ','join','fired','season']); let n=0; G.chron=G.chron.filter(x=>{ if(n>=100||KEEP.has(x.k))return true; n++; return false; }); } } /* 창단·우승·취임·경질 같은 핵심 기록은 남긴다 */
/* ===== 프랜차이즈 스타: 한 구단에서 5시즌 이상 1군을 뛰고 그 구단 통산 WAR 12 이상(또는 7시즌·WAR 8) ===== */
function teamTenure(p,tid){ const ys=new Set(); let war=0; const y0=G.fd&&G.startY?G.startY:-Infinity; /* 창단 드래프트 게임: 창단 이전 기록은 그 구단 기록이 아니다(fdMine과 같게, 검수 11-09zz) */ for(const h of p.hist){ if(h.lvl!=='1군'||h.t!==tid||h.y<y0)continue; if((h.pa||0)>=100||(h.outs||0)>=120)ys.add(h.y); war+=warOf(h,p); } return {n:ys.size,war}; }
function isFranchise(p){ if(!p||p.team==null||p.foreign)return false; if(p.fr&&p.fr.tid===p.team)return true; return frQual(p,p.team); }
function frQual(p,tid){ const T=teamTenure(p,tid); return (T.n>=5&&T.war>=12)||(T.n>=7&&T.war>=8); }
function franchiseCheck(){ for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||(p.fr&&p.fr.tid===p.team))continue; if(isFranchise(p)){ p.fr={tid:p.team,y:G.year}; if(p.team===G.user){ news('선수',`${p.name}, ${tshort(G.user)}의 프랜차이즈 스타로`,`${teamTenure(p,p.team).n}시즌 동안 한 팀에서 뛰며 통산 WAR ${teamTenure(p,p.team).war.toFixed(1)}을 쌓았습니다. 팬들이 가장 아끼는 선수가 됐습니다.`,2,{ref:p.id}); chron('star',`${p.name} 프랜차이즈 스타 등극`,p.id); } } } }
/* 프랜차이즈 스타를 트레이드로 보내면 팬이 크게 반발한다(구단·재정 화면 설명). 트레이드 처리 뒤 부른다(p.fr은 원래 구단 기록) */
function frBacklash(ids){ if(G.unemp)return; const L=(ids||[]).map(id=>G.players[id]).filter(p=>p&&p.team!==G.user&&!p.foreign&&((p.fr&&p.fr.tid===G.user)||frQual(p,G.user))); /* 시즌 말 등록 전이라도 기준을 채운 선수(검수 11-09zz) */ if(!L.length)return; prInit();
  const d=Math.min(12,6+3*(L.length-1)); G.pr.fan=clamp(G.pr.fan-d,0,100); G.pr.press=clamp(G.pr.press-2,0,100); const nm=L.map(p=>p.name).join('·');
  news('팬',`프랜차이즈 스타 ${nm} 트레이드… 팬들 거센 반발`,`${tshort(G.user)}에서 오래 뛴 ${nm}을(를) 내보냈습니다. "구단의 얼굴을 보냈다"는 비판이 쏟아집니다.`,-3,{fanW:2});
  mail('홍보팀',`팬 반발: ${nm} 트레이드`,`프랜차이즈 스타를 트레이드한 데 대한 팬 반발이 큽니다. 팬 여론 -${d}, 언론 논조 -2.`,{kind:'언론'}); }
/* 은퇴하는 프랜차이즈 스타: 은퇴식, 통산 WAR 25 이상이면 영구결번 */
function legendRetire(p){ if(!isFranchise(p))return; const tid=p.team; const T=teamTenure(p,tid); G.frLeg=G.frLeg||[]; G.frLeg.push({tid,name:p.name,pos:posLabel(p),y:G.year,n:T.n,war:+T.war.toFixed(1)});
  wire('은퇴',`${tname(tid)} 프랜차이즈 스타 ${p.name} 은퇴`,{tid}); if(tid===G.user){ stop('선수',`${p.name}이(가) 은퇴합니다. ${T.n}시즌 동안 우리 팀에서 통산 WAR ${T.war.toFixed(1)}. 은퇴식은 따로 정합니다.`); chron('legend',`${p.name} 은퇴 (${T.n}시즌, WAR ${T.war.toFixed(1)})`); news('선수',`${p.name} 은퇴… ${tshort(tid)} 팬들 눈물`,`${T.n}시즌 동안 ${tshort(tid)}을(를) 지킨 ${p.name}이(가) 유니폼을 벗습니다.`,2); } }
/* ===== 선수단 리더십: 선수들이 투표로 주장을 뽑는다. 주장의 엄격함(기강)과 영향력이 선수단 분위기를 정한다 =====
   기강 지수 S(0~100) = 주장 엄격함 60% + 감독 규율 40% (+단장 요청 보정). 45~65가 알맞고,
   너무 느슨하면(40 미만) 집중력이 떨어지고 기행이 잦아지며, 너무 세면(70 초과) 경직된 플레이와 젊은 선수 불만이 생긴다 */
function leadOf(p){ initPers(p); if(!p.lead){ const pr=p.pers.pro, tp=p.pers.temp; p.lead={str:clamp(Math.round(pr*.55+tp*.35+N(0,2.5)),1,20),cha:clamp(Math.round(p.pers.loy*.3+(p.age-22)*.45+ovr(p)/8+N(0,2)),1,20)}; } return p.lead; }
const LEADSTY=s=>s>=15?'엄격한 원칙주의':s>=11?'단호한 편':s>=7?'부드러운 형님형':'자유방임형';
function electCaptain(tid,why){ const all=domestic(tid).filter(p=>!p.ys&&healthy(p)&&!(p.joinY>G.year)&&p.age>=25); if(!all.length)return null;
  /* 주장은 적어도 주전급에서: 주전(라인업·선발·필승조) 또는 팀 국내 선수 상위 12명 안 */ let reg=new Set(); try{ const d=depth(tid); reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(x=>x.id)); }catch(e){} const top=new Set([...domestic(tid)].filter(p=>!p.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,12).map(p=>p.id));
  const ps0=all.filter(p=>reg.has(p.id)||top.has(p.id)); const ps=ps0.length>=3?ps0:all;
  /* 선수들은 자기 관리가 되는(프로의식) 고참을 주장으로 뽑는다: 프로의식·연차·나이(29~34세가 가장 많이 뽑힘)·영향력·실력 */
  const ageB=a=>a>=29&&a<=34?6:a>=27?3:a>=35?3:0;
  const sc=p=>teamTenure(p,tid).n*2+ovr(p)*.3+leadOf(p).cha*1.1+((p.pers&&p.pers.loy)||10)*.3+((p.pers&&p.pers.pro)||10)*1.3+(((p.pers&&p.pers.pro)||10)<=7?-(8-((p.pers&&p.pers.pro)||10))*3:0)+ageB(p.age)+ /* 자기 관리가 안 되는 선수(프로의식 7 이하)는 주장 표를 거의 못 받는다 */hn('el'+G.year+(why||''),p.id)*4;
  const L=ps.map(p=>({p,v:Math.max(1,sc(p))})).sort((a,b)=>b.v-a.v).slice(0,3); const c=L[0].p; const t=team(tid); const old=t.cap; let S0=null, S1=null; try{ G._cl=null; S0=climateOf(tid).S; }catch(e){} t.cap=c.id; try{ G._cl=null; S1=climateOf(tid).S; }catch(e){}
  if(tid===G.user&&!G.unemp){ const n=domestic(tid).filter(p=>!p.ys).length; const w=L.map(x=>Math.pow(x.v,4)); const tot=sum(w); const votes=w.map(x=>Math.round(n*x/tot)); const ld=leadOf(c);
    if(old!==c.id){ const op=old!=null&&G.players[old]; chron('cap',`선수단 투표로 ${c.name} 주장 선출${why?` (${why})`:''}${op?` · 전임 ${op.name}`:''}${S0!=null&&S1!=null?` · 기강 ${S0}→${S1}`:''}`,c.id); }
    mail('선수단','주장 선출 결과',`선수단 투표로 ${c.name}(${posLabel(c)}, ${c.age}세)이(가) 주장이 됐습니다${why?`(${why})`:''}.\n\n${L.map((x,i)=>`${x.p.name} ${votes[i]}표`).join(' · ')}\n\n리더십 성향: ${LEADSTY(ld.str)} · 선수단 영향력 ${ld.cha>=14?'큼':ld.cha>=9?'보통':'작음'}.${(()=>{ const c=teamCulture(tid); const L=c.L.slice(1).map(x=>x.name); return `\n고참 리더: ${L.join(', ')||'없음'} · 선수단 문화(리더들의 자기 관리) ${c.pro>=14?'좋음 — 젊은 선수들이 따라 배웁니다':c.pro<=8?'느슨함 — 젊은 선수들이 나쁜 습관을 배울 수 있습니다':'보통'}`; })()} ${old!=null&&old!==c.id&&G.players[old]&&G.players[old].team===tid?`전임 ${G.players[old].name}은(는) 주장에서 물러났습니다.`:''}\n\n주장은 선수들이 직접 뽑습니다. 기강이 지나치게 느슨하거나 세면 주장과 면담해 방향을 바꿔 달라고 요청할 수 있습니다.`,{kind:'선수',ref:c.id,face:c.id,acts:[{l:'선수단 리더십',a:'go',v:'train:lead'}]}); }
  return c; }
/* ===== 리더의 프로의식이 선수단에 퍼진다 =====
   리더 = 주장 + 고참 리더 2명(프로의식·연차·영향력이 높은 27세 이상). 리더들의 프로의식(영향력만큼 가중)이 선수단 문화가 된다.
   젊은 선수일수록 문화를 따라간다: 성장 의지·사고 확률은 '문화가 반영된 프로의식'으로 보고, 해마다 실제 프로의식도 조금씩 문화 쪽으로 옮겨 간다.
   프로의식이 낮은 고참이 리더면 반대로 끌어내린다 */
const _ldC=new Map();
function teamLeaders(tid){ const k=G.day+':'+(team(tid)||{}).cap; const c=_ldC.get(tid); if(c&&c.k===k&&c.L.every(p=>p.team===tid&&G.players[p.id]===p))return c.L; /* 같은 날 방출·이적한 리더는 다시 계산 */ const t=team(tid); const ps=domestic(tid).filter(p=>!p.ys&&!(p.joinY>G.year)&&p.age>=27);
  const cap=t&&t.cap!=null&&G.players[t.cap]&&G.players[t.cap].team===tid?G.players[t.cap]:null; const vs=p=>{ initPers(p); return p.pers.pro*1.2+Math.min(teamTenure(p,tid).n,8)*1.2+leadOf(p).cha*.8+(p.age>=30?3:0); };
  const L=[cap,...ps.filter(p=>p!==cap).sort((a,b)=>vs(b)-vs(a)).slice(0,2)].filter(Boolean); _ldC.set(tid,{k,L}); return L; }
function teamCulture(tid){ const L=teamLeaders(tid); if(!L.length)return {pro:10,w:0,L}; let s=0,ws=0; L.forEach((p,i)=>{ const w=(i===0?1:.5)*clamp(leadOf(p).cha/12,.4,1.5); s+=p.pers.pro*w; ws+=w; }); return {pro:s/ws,w:clamp(ws/1.6,.25,1.2),L}; }
function effPro(p){ initPers(p); if(p.team==null||p.foreign||p.prospect)return p.pers.pro; const c=teamCulture(p.team); if(c.L.includes(p))return p.pers.pro; const sus=p.age<=24?.4:p.age<=28?.25:.12; return clamp(p.pers.pro+(c.pro-p.pers.pro)*sus*c.w,1,20); }
/* 해마다(1월 1일 성장 때): 27세 이하는 실제 프로의식이 문화 쪽으로 한 칸씩 옮겨 갈 수 있다 */
function proDrift(p){ if(p.team==null||p.foreign||p.age>27)return 0; initPers(p); const c=teamCulture(p.team); if(c.L.includes(p))return 0; const d=c.pro-p.pers.pro;
  if(d>=3&&R()<.3*c.w){ p.pers.pro++; return 1; } if(d<=-3&&R()<.22*c.w){ p.pers.pro--; return -1; } return 0; }
function climateOf(tid){ if(!G._cl||G._cl.d!==G.day)G._cl={d:G.day,v:{}}; const C=G._cl.v; if(C[tid])return C[tid];
  const t=team(tid); const c=t.cap!=null&&G.players[t.cap]&&G.players[t.cap].team===tid?G.players[t.cap]:null; const m=G.mgr[tid]; const md=m&&m.disc!=null?m.disc:45;
  const L=c?leadOf(c):{str:9,cha:6}; const adj=tid===G.user&&G.leadAdj&&G.leadAdj.until>G.day?G.leadAdj.v:0;
  const S=clamp(Math.round(L.str*5*.6+md*.4+adj),0,100); const w=clamp(L.cha/14,.35,1.3);
  const boost=(S>=45&&S<=65?.4:0)*w-(S<40?1.2*(40-S)/40:0)*w-(S>70?.8*(S-70)/30:0)*w;
  return C[tid]={S,w,boost,cap:c,band:S<40?'loose':S>70?'rigid':S>=45&&S<=65?'good':'ok'}; }
/* 주간: 느슨하면 기행, 너무 세면 젊은 선수 불만 */
function climateWeek(){ if(G.unemp||period()==='off')return; const cl=climateOf(G.user); const ps=domestic(G.user).filter(p=>!p.ys&&healthy(p)&&!isAway(p)); if(!ps.length)return;
  if(cl.band==='rigid'){ for(const p of ps)if(p.age<=25||((p.pers&&p.pers.temp)||10)>=14)p.mor=clamp((p.mor??60)-.8,0,100); }
  if(cl.band==='good'){ for(const p of ps)if((p.mor??60)<70)p.mor=clamp((p.mor??60)+.4,0,100); }
  const ch=cl.band==='loose'?.05+.18*(40-cl.S)/40:cl.band==='ok'&&cl.S<45?.03:.01; if(R()>=ch)return;
  const cand=ps.filter(p=>((p.pers&&p.pers.pro)||10)<=11).sort(()=>R()-.5); const p=cand[0]||pick(ps); const kinds=[['늦은 귀가','원정 숙소 통금 시간을 넘겨 들어왔습니다'],['SNS 논란','개인 SNS에 올린 글이 팬들 사이에서 논란이 됐습니다'],['훈련 지각','팀 훈련에 늦게 나왔습니다'],['더그아웃 언쟁','경기 중 더그아웃에서 동료와 언성을 높였습니다']]; const [k,d]=pick(kinds);
  prInit(); G.pr.fan=clamp(G.pr.fan-(k==='SNS 논란'?3:1),0,100);
  const m=G.mgr[G.user]; const mr=m&&!m.interim?(m.disc>=65?`${m.name} 감독은 엄하게 다스려야 한다는 입장입니다.`:m.disc<40?`${m.name} 감독은 선수를 감싸고 싶어 합니다.`:`${m.name} 감독은 구단 판단에 따르겠다고 합니다.`):'';
  evNew('lead',`${p.name} ${k}`,`${p.name}(${posLabel(p)})이(가) ${d}. 선수단 기강이 느슨하다는 말이 나옵니다(기강 지수 ${cl.S}). ${mr} 구단 차원의 징계를 정해 주세요.`,[{l:'구단 징계: 출장 정지 5일',fx:'선수 기분이 크게 내려가고 그 기간 못 뜁니다. 선수단이 긴장합니다(기강 +6, 45일).'},{l:'구단 징계: 벌금',fx:'선수 기분이 내려가고 기강이 조금 잡힙니다(+3, 30일).'},{l:'선처하고 감독에게 맡기기',fx:'선수 기분은 지킵니다. 감독이 엄한 편이면 감독이 직접 다잡습니다.'}],{ref:p.id,data:{pid:p.id},from:'운영팀',def:1}); }
const EVH_LEAD={ pick(e,i){ const p=G.players[e.data.pid]; if(!p)return ''; const cur=G.leadAdj&&G.leadAdj.until>G.day?Math.max(0,G.leadAdj.v):0; G._cl=null;
    if(i===0){ p.mor=clamp((p.mor??60)-12,0,100); p.susp=G.day+5; G.leadAdj={v:Math.min(12,cur+6),until:G.day+45}; news('구단',`${tshort(G.user)}, ${p.name} 출장 정지 5일 징계`,`구단이 ${p.name}에게 자체 징계를 내렸습니다.`,0,{ref:p.id}); return `${p.name}에게 출장 정지 5일 징계를 내렸습니다. 선수단이 긴장했습니다(기강 +6, 45일).`; }
    if(i===1){ p.mor=clamp((p.mor??60)-6,0,100); G.leadAdj={v:Math.min(12,cur+3),until:G.day+30}; return `${p.name}에게 벌금을 물렸습니다(기강 +3, 30일).`; }
    p.mor=clamp((p.mor??60)+2,0,100); const m=G.mgr[G.user]; if(m&&!m.interim&&m.disc>=60){ G.leadAdj={v:Math.min(12,cur+3),until:G.day+30}; return `구단은 선처했고, ${m.name} 감독이 선수단 미팅을 열어 직접 다잡았습니다(기강 +3, 30일).`; } return `${p.name}을(를) 선처했습니다. 감독도 크게 문제 삼지 않았습니다.`; } };
function captainOf(tid){ const t=team(tid); const p=t.cap!=null?G.players[t.cap]:null; if(p&&p.team===tid)return p;
  if(t.cap!=null&&tid===G.user&&!G.unemp){ const was=G.players[t.cap]; if(was)news('구단',`${tshort(tid)} 주장 ${was.name} 떠나… 선수단 술렁`,'주장이 팀을 떠나 더그아웃 분위기가 가라앉았습니다.',-1); for(const q of playersOf(tid))q.mor=clamp((q.mor??60)-2,0,100); t.cap=null; } const a=electCaptain(tid,tid===G.user&&!G.unemp?'전임 주장 이탈':''); return a; }

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
function awCand(x,extra){ const tt=awTeamOf(x.p,x.h); /* 성적을 낸 구단(검수 11-07: 지금 소속으로 팀 성적 가산) */ const rk=(()=>{ try{ return G.ps.order.findIndex(o=>o.tid===tt); }catch(e){ return 5; } })();
  const big=x.p.isP?(x.h.w||0)*.06+(x.h.sv||0)*.03+(x.h.so||0)*.002:(x.h.hr||0)*.045+(x.h.rbi||0)*.008+(x.h.sb||0)*.005;
  return {id:x.p.id,name:x.p.name,t:awClub(x.p,x.h),pos:(()=>{ try{ return posLabel(x.p); }catch(e){ return ''; } })(), /* 후보에 오른 때의 포지션(나중에 바꿔도 과거 시상은 그대로, 검수 11-09zz) */line:statLine(x.h,x.p),w:+x.w.toFixed(1),s:x.w+big+(rk>=0&&rk<=2?.35:0)+N(0,.45)+(extra||0)}; }
function seasonAwards(y){ const rows=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(h)rows.push({p,h,w:warOf(h,p)}); }
  for(const id in (G.arch||{})){ if(G.players[id])continue; const a=G.arch[id]; const R=(a.rows||[]).filter(r=>r.y===y); if(!R.length)continue; const q=archP(a); const h=seasonTotal(q,y,'1군'); if(!h)continue; q.team=h.t;
    rows.push({p:q,h,w:sum(R.map(r=>r.war||0))}); } /* 이전 시즌 보관 기록도 이력으로 읽어 신인 자격을 현역과 같게 판정하고, 수비 포지션도 넘긴다(검수 11-06) */ /* 시즌 중 리그를 떠난 선수도 같은 성적이면 같은 후보(타이틀과 같은 기준) */
  /* 후보 자격은 KBO 규정대로(2025 KBO 표창규정·골든글러브 기준):
     투수 = 규정이닝(팀 경기 수×1이닝) 또는 10승·30세이브·30홀드 중 하나 / 야수 = 규정타석(팀 경기 수×3.1) / 각 부문 1위(타이틀 홀더)는 자동 후보.
     MVP 후보는 타이틀 홀더와 성적 상위로 투수 8명·야수 10명(실제 2025년 18명) */
  const tg=x=>tgp(awTeamOf(x.p,x.h,y),y)||144; /* 규정 기준 팀 경기 수도 수상 소속 구단으로(검수 11-09zq) */ const tit=new Set(); try{ for(const [,k,isP,low] of TITLES){ const B=titleBoard(y,k,isP,low); if(B[0])B.filter(z=>Math.abs(z.v-B[0].v)<1e-9).forEach(z=>tit.add(z.p.id)); /* 1위는 떠난 선수까지 포함한 실제 순위, 혜택도 그 1위(공동)만 */ } }catch(e){}
  const qB=x=>!x.p.isP&&((x.h.pa||0)>=Math.round(tg(x)*3.1)||tit.has(x.p.id)), qP=x=>x.p.isP&&((x.h.outs||0)>=tg(x)*3||(x.h.w||0)>=10||(x.h.sv||0)>=30||(x.h.hld||0)>=30||tit.has(x.p.id));
  const A={y,gmT:G.unemp?null:G.user,gg:{},cand:{gg:{}},pend:{mvp:true,gg:true},ggVote:{voters:288,start:Math.max(dnum(y,11,25),G.day),end:Math.max(dnum(y,12,5),G.day+1),ballots:{},news:{}}}; /* 결산이 늦어 후보 발표가 밀리면 투표도 발표일부터(검수 11-09zz) */
  { const pick=(L,n)=>{ const t=L.filter(x=>tit.has(x.p.id)); const rest=L.filter(x=>!tit.has(x.p.id)).sort((a,b)=>b.w-a.w); return t.concat(rest).slice(0,Math.max(n,t.length)); };
    A.cand.mvp=awVote(pick(rows.filter(qP),8).concat(pick(rows.filter(qB),10)).map(x=>awCand(x)),125); }
  /* 신인상(KBO 표창규정 제7조): 그해 입단 또는 최근 5년 이내 입단, 이전 시즌까지 1군 누적 투수 30이닝·타자 60타석 이하, 해외 프로리그 소속 경험 없음(외국인 제외) */
  const joinY=p=>p.draft&&p.draft.y!=null?p.draft.y+1:Math.min(...p.hist.map(h=>h.y).concat([y,y-Math.max(0,(p.svc||0)-1)])); /* 기록은 최근 3년치만 있어 등록 연차로도 입단 연도를 잡는다 */
  A.cand.roy=awVote(rows.filter(x=>!x.p.foreign&&!x.p.ovsExp&&!(G.abroad||[]).some(a=>a.id===x.p.id)&&joinY(x.p)>=y-5&&((x.h.pa||0)+(x.h.outs||0))>0&&(()=>{ const H=x.p.hist.filter(h=>h.lvl==='1군'&&h.y<y&&!h.y2); return sum(H.map(h=>h.pa||0))<=60&&sum(H.map(h=>h.outs||0))<=90; })()).sort((a,b)=>b.w-a.w).slice(0,8).map(x=>awCand(x)),125);
  const gpos=x=>{ const u=x.p.use; if(u&&u.y===y&&u.pos){ const P={}; for(const k in u.pos){ const kk=['LF','CF','RF'].includes(k)?'OF':k; P[kk]=(P[kk]||0)+u.pos[k]; } let b=null,n=-1; for(const k in P)if(P[k]>n){ n=P[k]; b=k; } if(b)return b; } return ['LF','CF','RF'].includes(x.h.pos)?'OF':x.h.pos; }; /* 외야 세 자리는 합쳐서 비교 */ /* 마지막 경기 포지션이 아니라 가장 많이 선 자리 */
  const ggQ=(x,pos)=>{ if(tit.has(x.p.id))return true; if(pos==='DH')return ((x.h.pp&&x.h.pp.DH)||0)>=Math.floor(Math.round(tg(x)*3.1)*2/3); /* 규정타석 446의 2/3 = 297 */ const u=x.p.use; const gAt=u&&u.y===y&&u.pos?(pos==='OF'?['LF','CF','RF'].reduce((s2,k)=>s2+(u.pos[k]||0),0):(u.pos[pos]||0)):((['LF','CF','RF'].includes(x.h.pos)?'OF':x.h.pos)===pos?(x.h.g||0):0); return gAt>=Math.round(tg(x)*5/9); }; /* 포지션별 출장 정보가 없으면 그 시즌 주 포지션만 전체 출장 수로 본다(지명타자가 포수 후보가 되지 않게, 검수 11-06) */ /* KBO: 그 포지션 수비 720이닝(팀 경기 수×5이닝) 이상 = 9이닝 경기로 80경기 */
  const gposQ=x=>{ const g=gpos(x); if(ggQ(x,g))return g; const u=x.p.use, n=k=>!u||u.y!==y||!u.pos?0:k==='OF'?['LF','CF','RF'].reduce((s2,q)=>s2+(u.pos[q]||0),0):(u.pos[k]||0); return ['C','1B','2B','3B','SS','DH','OF'].filter(k=>ggQ(x,k)).sort((a,b)=>n(b)-n(a))[0]||null; }; /* 가장 많이 선 자리가 기준 미달이면 기준을 채운 다른 자리로(한 선수 한 자리) */
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
  mail('홍보팀',`${y} ${ASSOC.s} 시상식 후보 발표`,`MVP 후보 ${(A.cand.mvp||[]).length}명: ${[...(A.cand.mvp||[])].sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(c=>`${c.name}(${tshort(c.t)})`).join(', ')||'-'}\n신인왕 후보 ${(A.cand.roy||[]).length}명: ${[...(A.cand.roy||[])].sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(c=>`${c.name}(${tshort(c.t)})`).join(', ')||'-'} (이름순)\n\nMVP·신인왕은 ${cerDay(KD(11,24))} ${ASSOC.s} 시상식, 골든글러브는 ${cerDay(KD(12,9))}에 발표됩니다.${mineC.length?`\n우리 구단 후보: ${[...new Set(mineC.map(c=>c.name))].join(', ')}`:''}`,{kind:'기록'});
  return A; }
/* 실제 시상일: 결산이 늦으면 다음 날(07_daily 시상은 결산보다 먼저 돈다), 연말을 넘기면 미정(검수 11-09zq) */
function cerDay(b){ const d=G.day<b?b:G.day+1; return d<=KD(12,31)?dmd(d):'추후 정해지는 날'; }
/* 발표 시점에만 수상자를 공개한다 */
function awShown(A,k){ return A&&!(A.pend&&A.pend[k]); }
/* 시상식 전에 은퇴한 선수의 아직 발표되지 않은 수상(은퇴 기록에 넣어 두었다가 시상식 때 반영) */
function awLabels(A,k,y){ if(!A)return []; return k==='mvp'?[['MVP',A.mvp],['신인왕',A.roy]].filter(x=>x[1]).map(([l,x])=>[`${y} ${l}`,x]):Object.entries(A.gg||{}).filter(x=>x[1]).map(([pos,x])=>[`${y} 골든글러브(${pos.startsWith('OF')?'외야수':pos==='P'?'투수':POSS[pos]})`,x]); }
function awPendFor(p){ const y=G.year, A=G.awards&&G.awards[y]; if(!A||!A.pend)return []; const L=[]; for(const k of ['mvp','gg'])if(A.pend[k])for(const [l,x] of awLabels(A,k,y))if(x.id===p.id)L.push(l); return L; }
/* 해외에 나가 있는 국내 선수의 보관 정보(pj)에 수상 이력을 더한다. 돌아오면 그 정보로 선수가 되살아나 이력이 이어진다 */
function awAbroad(id,label,tid){ const a=(G.abroad||[]).find(r=>r.id===id&&!r.back&&r.pj); if(!a)return false; let q; try{ q=JSON.parse(a.pj); }catch(e){ return false; }
  (q.aw=q.aw||[]).includes(label)||q.aw.push(label); try{ story(q,label,'award'); }catch(e){} a.pj=JSON.stringify(q); (a.aw=a.aw||[]).includes(label)||a.aw.push(label); { const ar=G.arch&&G.arch[id]; if(ar){ (ar.aw=ar.aw||[]).includes(label)||ar.aw.push(label); } } /* 시상 화면에서 여는 보관 선수 카드에도(검수 11-08) */ if((tid===undefined?a.from:tid)===G.user&&!G.unemp)chron('award',`${a.name} ${label}`,id); return true; }
function awardCeremony(k){ const y=G.year; const A=G.awards&&G.awards[y]; if(!A||!A.pend||!A.pend[k])return; A.pend[k]=false; (A.cd=A.cd||{})[k]=G.day; /* 실제로 연 날(달력, 검수 11-09l) */
  const lst=k==='mvp'?[['MVP',A.mvp,A.cand.mvp],['신인왕',A.roy,A.cand.roy]]:Object.entries(A.gg).map(([pos,x])=>[`골든글러브(${pos.startsWith('OF')?'외야수':pos==='P'?'투수':POSS[pos]})`,x,pos.startsWith('OF')?A.cand.gg.OF:A.cand.gg[pos]]);
  const mine=[];
  for(const [lab,x,C] of lst){ if(!x)continue; for(const c of (C||[]).slice(0,3))if(c.mg===undefined){ const m=mgrOf(c.t); c.mg=m&&!m.interim?m.name:''; } /* 소감 속 감독은 시상 당시(검수 11-09zq) */ const p=G.players[x.id]; const tt=x.t??(p?p.team:null); if(tt===G.user)mine.push(x.name+' '+lab); /* 성적을 낸 구단 기준: 시상 전 이적·해외·은퇴해도(검수 11-08, 11-09zf) */ if(A.gmT!=null&&tt===A.gmT&&(tt!==G.user||G.unemp))chron('award',`${x.name} ${y} ${lab}`,x.id,tt); /* 후보 발표 뒤 단장이 떠나도 그 시즌을 맡았던 구단 연대기에(검수 11-09zz) */ if(p){ addAward(p,`${y} ${lab}`,tt); if(tt===G.user)p.mor=clamp((p.mor??60)+6,0,100); }
    else if(awAbroad(x.id,`${y} ${lab}`,tt)){} /* 시상식 전에 해외로 떠난 선수: 해외 보관 정보(복귀 때 되살아나는 선수 정보)에 넣는다 */
    else { const ar=G.arch&&G.arch[x.id]; if(ar){ (ar.aw=ar.aw||[]).includes(`${y} ${lab}`)||ar.aw.push(`${y} ${lab}`); } /* 시상식 전에 방출·은퇴로 지워진 선수: 보관 기록에 */ if(tt===G.user&&!G.unemp)chron('award',`${x.name} ${y} ${lab}`,x.id);
      const r=(G.legends||[]).find(r=>(r.pid??r.id)===x.id); if(r&&!(r.aw||[]).includes(`${y} ${lab}`)){ r.awP=(r.awP||[]).filter(l=>l!==`${y} ${lab}`); (r.aw=r.aw||[]).push(`${y} ${lab}`); /* 후보 발표 전에 은퇴한 선수도(awP 없음, 검수 11-09zp) */ if(lab==='MVP')r.mvp++; if(lab.includes('골든'))r.gg++; { const o=(G.ob||[]).find(o=>o.fid===x.id||o.pid===x.id); if(o){ o.awards=(o.awards||0)+1; } }
      if(!r.hof&&(r.war>=38||r.mvp>=2||r.gg>=6||(r.war>=30&&r.mvp>=1))){ r.hof=true; { const o=(G.ob||[]).find(o=>o.fid===x.id||o.pid===x.id); if(o)o.hof=true; } /* OB 카드도 헌액·수상 반영(검수 11-08) */ news('기록',`${r.name}, 명예의 전당 헌액`,`은퇴한 ${r.name}이(가) 마지막 시즌 ${lab} 수상으로 명예의 전당 기준을 채웠습니다.`,0); } } }
    /* WAR 1위가 표에서 졌으면 논란 기사 */
    if(C&&C.length>1&&k==='mvp'){ const top=[...C].sort((a,b)=>b.w-a.w)[0]; if(top.id!==x.id&&top.w-C[0].w>=.8)news('기록',`${lab} 수상 논란: WAR 1위 ${top.name} 대신 ${x.name}`,`WAR ${top.w}의 ${top.name}이(가) ${C.find(c=>c.id===top.id).v}표에 그쳤습니다. 기자단 표심이 눈에 띄는 기록 쪽으로 기울었다는 분석입니다.`,0); } }
  if(k==='mvp'){ if(A.mvp)news('선수',`${A.mvp.name}, ${y} 정규시즌 MVP`,`${tname(A.mvp.t)}의 ${A.mvp.name}이(가) 1위표 ${A.mvp.v}표를 받아 MVP를 차지했습니다. ${A.mvp.line}.`,A.mvp.t===G.user?3:0,{ref:A.mvp.id,fanW:A.mvp.t===G.user?2:0});
    if(A.roy)news('선수',`${A.roy.name}, ${y} 신인왕`,`${tname(A.roy.t)}의 ${A.roy.name}이(가) ${A.roy.v}표로 신인왕에 올랐습니다.`,A.roy.t===G.user?2:0,{ref:A.roy.id}); }
  else { const gg=Object.values(A.gg).filter(x=>x.t===G.user); news('선수',gg.length?`${y} 골든글러브: ${tshort(G.user)} ${gg.length}명 수상`:`${y} 골든글러브, ${tshort(G.user)} 수상자 없어`,gg.length?`${gg.map(x=>x.name).join(', ')}이(가) 황금장갑을 꼈습니다.`:'우리 구단은 수상자를 내지 못했습니다.',gg.length>=3?2:gg.length?1:-1); try{ starAwardsNews(); }catch(e){} }
  if(G.last&&G.last.y===y&&G.last.awards&&G.last.awards!==A&&G.last.awards.pend)G.last.awards.pend[k]=false; /* 저장·불러오기로 사본이 갈라진 경우 */
  G.cerNew={y,k,d:G.day}; mail('홍보팀',`${y} ${k==='mvp'?`${ASSOC.s} 시상식(MVP·신인왕)`:'골든글러브 시상식'}`,`오늘 ${k==='mvp'?`${ASSOC.s} 시상식`:'골든글러브 시상식'}이 열렸습니다.${mine.length?` 우리 구단 수상: ${mine.join(', ')}.`:' 우리 구단 수상자는 없습니다.'}\n\n시상식 화면에서 후보와 투표 결과를 확인할 수 있습니다.`,{imp:true,kind:'기록',acts:[{l:'시상식 보기',a:'cerOpen',v:`${y}:${k}`}]}); }
/* 창단 드래프트 게임: 같은 구단 번호라도 창단 이전 기록은 우리 구단 기록이 아니다 */
function fdMine(p){ if(!G.fd||!G.startY)return null; let war=0; const ys=new Set(); for(const h of p.hist){ if(h.lvl!=='1군'||h.t!==G.user||h.y<G.startY)continue; war+=warOf(h,p); ys.add(h.y); } return ys.size?{war:+war.toFixed(1),ys:ys.size}:null; }
function retireRecord(p){ const c=careerOf(p); const aw=p.aw||[]; const awP=awPendFor(p);
  const rec={name:p.name,isP:p.isP,pos:p.isP?posLabel(p):POSK[p.pos],y:G.year,age:p.age,seasons:c.seasons.size,teams:[...c.teams],war:+c.war.toFixed(1),pa:c.pa,h:c.h,hr:c.hr,rbi:c.rbi,sb:c.sb,ip:Math.round(c.outs/3),w:c.w,sv:c.sv,so:c.so,id:p.id,awP,aw:aw.slice(-12),mvp:aw.filter(a=>a.includes('MVP')).length,gg:aw.filter(a=>a.includes('골든')).length,no:jno(p),
    mine:fdMine(p)||(G.fd?null:c.byTeam[G.user]?{war:+c.byTeam[G.user].war.toFixed(1),ys:c.byTeam[G.user].ys.size}:null)};
  { const miss=Math.max(0,(p.svc||0)-rec.seasons); if(miss){ const add=miss*clamp((p.pot-45)/5,0,4.5); rec.warA=rec.war; /* 실제 기록(통산 순위용) */ rec.seasons+=miss; rec.war=+(rec.war+add).toFixed(1); rec.est=true;
      if(p.team===G.user&&c.teams.size<=1&&!G.fd){ rec.mine=rec.mine||{war:0,ys:0}; rec.mine.war=+(rec.mine.war+add).toFixed(1); rec.mine.ys+=miss; } } } /* 게임 시작 전 경력은 연차와 잠재력으로 추정 */
  if(rec.war>=8||rec.aw.length||awP.length){ rec.pid=rec.pid??p.id; (G.legends=G.legends||[]).push(rec); if(G.legends.length>300){ const i=G.legends.findIndex(x=>!x.hof&&!x.retNo&&!x.canRetNo&&!(x.mine&&x.mine.ys)); if(i>=0)G.legends.splice(i,1); } } /* 넘치면 명예의 전당·결번·우리 구단 기록이 아닌 오래된 것부터 지운다 */
  const hof=rec.war>=38||rec.mvp>=2||rec.gg>=6||(rec.war>=30&&rec.mvp>=1);
  if(hof){ rec.hof=true; mail('홍보팀',`${rec.name}, 명예의 전당 헌액`,`${rec.name}이(가) 은퇴와 함께 명예의 전당에 올랐습니다. 통산 ${rec.seasons}시즌 · WAR ${rec.war}${rec.isP?` · ${rec.w}승 ${rec.sv}세이브`:` · ${rec.h}안타 ${rec.hr}홈런`}${rec.mvp?` · MVP ${rec.mvp}회`:''}${rec.gg?` · 골든글러브 ${rec.gg}회`:''}.`,{kind:'기록'}); if(rec.mine&&rec.mine.ys>=5)news('선수',`${tshort(G.user)} 레전드 ${rec.name}, 명예의 전당으로`,`구단 역사에 남을 선수가 명예의 전당에 올랐습니다.`,2,{fanW:2}); }
  if(rec.mine&&rec.mine.ys>=(retWarT()>=60?10:8)&&rec.mine.war>=retWarT()){ rec.canRetNo=true; rec.tid=G.user; rec.pid=rec.pid??p.id; rec.no=noAt(p,G.user)??rec.no; /* 결번은 그 구단에서 단 번호(검수 11-09zp) */ if(!G.ob){ mail('홍보팀',`${rec.name} 영구결번 검토`,`${rec.name}이(가) 우리 구단에서 ${rec.mine.ys}시즌 동안 WAR ${rec.mine.war}를 남기고 은퇴합니다. 등번호 ${rec.no}번을 영구결번으로 지정하면 팬들이 크게 반길 것입니다.`,{imp:true,kind:'기록',acts:[{l:`${rec.no}번 영구결번 지정`,a:'retNo',v:'p'+rec.pid}]}); }  }
  return rec; }
/* 등번호: 선수마다 하나(p.no). 처음 볼 때 정해 두고, 같은 구단 안에서는 겹치지 않으며 우리 구단 영구결번은 쓰지 않는다. 팀을 옮겨 겹치면 새 구단에서 다시 고른다 */
function teamNos(tid,exc){ const S=new Set(); if(tid==null)return S; for(const q of Object.values(G.players))if(q.team===tid&&q!==exc&&q.no!=null)S.add(q.no); for(const r of retNosOf(tid))S.add(r.no); return S; }
/* 구단의 영구결번: 맡고 있으면 G.retNos, 떠난 구단은 G.orgT에 둔 것. 누가 맡든 그 구단 번호는 쓰지 않는다(검수 11-09zp) */
function retNosOf(tid){ return tid===G.user?(G.retNos||[]):((G.orgT||{})[tid]||{}).retNos||[]; }
/* 그 구단에서 단 등번호: 지금 구단이면 p.no, 떠난 구단이면 옮길 때 남긴 p.noBy */
function noAt(p,tid){ return p.noT===tid&&p.no!=null?p.no:p.noBy&&p.noBy[tid]!=null?p.noBy[tid]:null; }
function jno(p){ if(!p)return null; if(p.no!=null&&(p.noT===p.team||p.team==null))return p.no;
  const used=teamNos(p.team,p); let n=p.no!=null&&!used.has(p.no)?p.no:1+Math.floor(u01('jno',p.id)*99); let g=0; while(used.has(n)&&g++<100)n=(n+1)%100; /* 0번까지 돌아본다(KBO 0~99, 검수 11-09zz) */ if(p.team!=null){ if(p.noT!=null&&p.no!=null)(p.noBy=p.noBy||{})[p.noT]=p.no; p.no=n; p.noT=p.team; } return n; }
/* 이름·등번호 고치기(유저 편집). 등번호 0~99, 같은 구단 선수와 겹치면 안 되고 우리 구단 영구결번은 쓸 수 없다 */
function setPlayerName(id,v){ const p=G.players[id]; if(!p)return '선수를 찾을 수 없습니다.'; const nm=String(v??'').replace(/[<>&"'`]/g,'').replace(/\s+/g,' ').trim(); if(!nm)return '이름을 입력하세요.'; if(nm.length>12)return '이름은 12자까지 쓸 수 있습니다.'; if(nm===p.name)return ''; const old=p.name; p.name=nm; (p.renamed=p.renamed||[]).push({y:G.year,from:old}); if(p.renamed.length>5)p.renamed.shift(); return ''; }
function playerNoPermit(p,r){ const a=p.retNoPermit; return !!(a&&a.tid===p.team&&a.no===r.no&&a.ob===p.father&&sonRetOwn(r,fatherOf(p))); }
function setPlayerNo(id,v){ const p=G.players[id]; if(!p)return '선수를 찾을 수 없습니다.'; const s=String(v??'').trim(); if(!/^\d{1,2}$/.test(s))return '등번호는 0~99 숫자로 입력하세요.'; const n=+s; if(p.team==null)return '소속 구단이 있는 선수만 등번호를 정할 수 있습니다.'; if(retNosOf(p.team).some(r=>r.no===n&&!playerNoPermit(p,r)))return `${n}번은 ${p.team===G.user?'우리 구단':tshort(p.team)} 영구결번입니다.`;
  const o=Object.values(G.players).find(q=>q!==p&&q.team===p.team&&jno(q)===n); if(o)return `${n}번은 ${o.name} 선수가 쓰고 있습니다.`; jno(p); /* 옛 구단 번호를 noBy에 남긴 뒤 바꾼다 */ p.no=n; p.noT=p.team; return ''; }
/* 영구결번 후보: 지금 맡은 구단 후보만(이직하면 옛 구단 후보는 그 구단 것, 검수 11-09zp) */
function retNoCands(){ return (G.legends||[]).map((r,i)=>({r,i})).filter(x=>x.r.canRetNo&&!x.r.retNo&&(x.r.tid==null||x.r.tid===G.user)); }
function retireNumber(i){ const L=G.legends||[]; const r=typeof i==='string'&&i[0]==='p'?L.find(x=>'p'+x.pid===i):L[+i]; /* 위치 대신 선수 id로 찾는다(목록이 잘려 위치가 밀려도 맞는 선수) */ if(!r||!r.canRetNo||r.retNo||(r.tid!=null&&r.tid!==G.user)||G.unemp)return '대상이 아닙니다.'; { const d=(G.retNos||[]).find(x=>x.no===r.no); if(d)return `${r.no}번은 이미 ${d.name}의 영구결번입니다. 같은 번호는 한 번만 지정할 수 있습니다.`; } /* 검수 11-08 */ r.retNo=true; (G.retNos=G.retNos||[]).push({name:r.name,no:r.no,y:G.year,pid:r.pid,...(()=>{const o=(G.ob||[]).find(o=>o.fid===r.pid);return o?{ob:o.id}:{};})()}); { const o=(G.ob||[]).find(o=>o.fid===r.pid); if(o){ o.retNo=true; o.no=r.no; } } /* OB 카드도 같은 결번(검수 11-09zp) */ const mv=[]; for(const q of Object.values(G.players))if(q.team===G.user&&q.id!==r.pid&&q.no===r.no){ q.noT=null; jno(q); mv.push(`${q.name} ${q.no}번`); } /* 그 번호를 쓰던 현역은 새 번호로 */ news('선수',`${tshort(G.user)}, ${r.name}의 ${r.no}번 영구결번`,`구단 역사에 길이 남을 이름이 됐습니다.`,3,{fanW:3}); return `${r.no}번을 영구결번으로 지정했습니다.${mv.length?` 그 번호를 쓰던 선수는 바꿨습니다: ${mv.join(', ')}.`:''}`; }

/* 100년 저장 크기(사용자 11-05 "100년은 즐기기 좋게"): 3년 지난 시상은 후보 명단을 상위권만 남긴다.
 30시즌 시뮬에서 시상 기록이 한 해 약 30KB씩 늘었고 대부분이 골든글러브 후보 전원의 세부 점수였다. 수상자·상위 후보·한 줄 기록은 그대로 */
function awardsCompact(){ const A=G.awards; if(!A)return; for(const y in A){ if(+y>G.year-3)continue; const a=A[y]; if(!a||a.cmp||!a.cand)continue;
  const slim=(L,n)=>(L||[]).slice(0,n).map(c=>{ const o={id:c.id,name:c.name,t:c.t,line:c.line,w:c.w,v:c.v}; if(c.pos)o.pos=c.pos; if(c.mg!=null)o.mg=c.mg; return o; });
  a.cn={mvp:(a.cand.mvp||[]).length,roy:(a.cand.roy||[]).length,gg:{}}; for(const k in (a.cand.gg||{}))a.cn.gg[k]=a.cand.gg[k].length; /* 정리 전 후보 수: 생략한 후보를 화면에 밝힌다(검수 11-09zf) */
  a.cand.mvp=slim(a.cand.mvp,5); a.cand.roy=slim(a.cand.roy,3); for(const k in (a.cand.gg||{}))a.cand.gg[k]=slim(a.cand.gg[k],k==='OF'?5:3);
  if(a.ggVote){ delete a.ggVote.ballots; delete a.ggVote.news; } a.cmp=1; } }
