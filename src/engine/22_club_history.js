/* ===== 시상·통산 기록·명예의 전당 ===== */
function careerOf(p){ const c={seasons:new Set(),teams:new Set(),pa:0,h:0,hr:0,rbi:0,sb:0,outs:0,w:0,sv:0,hld:0,so:0,war:0,byTeam:{}};
  for(const h of p.hist){ if(h.lvl!=='1군')continue; c.seasons.add(h.y); c.teams.add(h.t); const w=warOf(h,p); c.war+=w; c.byTeam[h.t]=c.byTeam[h.t]||{war:0,ys:new Set()}; c.byTeam[h.t].war+=w; c.byTeam[h.t].ys.add(h.y);
    if(p.isP){ c.outs+=h.outs||0; c.w+=h.w||0; c.sv+=h.sv||0; c.hld+=h.hld||0; c.so+=h.so||0; } else { c.pa+=h.pa||0; c.h+=h.h||0; c.hr+=h.hr||0; c.rbi+=h.rbi||0; c.sb+=h.sb||0; } }
  return c; }
function addAward(p,label){ (p.aw=p.aw||[]).push(label); story(p,label,'award'); if(p.team===G.user&&!G.unemp)chron('award',`${p.name} ${label}`,p.id); }
/* ===== 구단 연대기: 구단마다 해마다 일어난 일을 쌓는다 ===== */
function chron(k,t,ref,tid){ tid=tid??G.user; if(tid==null)return; G.chron=G.chron||[]; G.chron.push({y:G.year,d:G.day,tid,k,t,ref:ref??null,gm:G.unemp?0:1}); if(G.chron.length>900)G.chron.splice(0,100); }
/* ===== 프랜차이즈 스타: 한 구단에서 5시즌 이상 1군을 뛰고 그 구단 통산 WAR 12 이상(또는 7시즌·WAR 8) ===== */
function teamTenure(p,tid){ const ys=new Set(); let war=0; for(const h of p.hist){ if(h.lvl!=='1군'||h.t!==tid)continue; if((h.pa||0)>=100||(h.outs||0)>=120)ys.add(h.y); war+=warOf(h,p); } return {n:ys.size,war}; }
function isFranchise(p){ if(!p||p.team==null||p.foreign)return false; if(p.fr&&p.fr.tid===p.team)return true; const T=teamTenure(p,p.team); return (T.n>=5&&T.war>=12)||(T.n>=7&&T.war>=8); }
function franchiseCheck(){ for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||(p.fr&&p.fr.tid===p.team))continue; if(isFranchise(p)){ p.fr={tid:p.team,y:G.year}; if(p.team===G.user){ news('선수',`${p.name}, ${tshort(G.user)}의 프랜차이즈 스타로`,`${teamTenure(p,p.team).n}시즌 동안 한 팀에서 뛰며 통산 WAR ${teamTenure(p,p.team).war.toFixed(1)}을 쌓았습니다. 팬들이 가장 아끼는 선수가 됐습니다.`,2,{ref:p.id}); chron('star',`${p.name} 프랜차이즈 스타 등극`,p.id); } } } }
/* 은퇴하는 프랜차이즈 스타: 은퇴식, 통산 WAR 25 이상이면 영구결번 */
function legendRetire(p){ if(!isFranchise(p))return; const tid=p.team; const T=teamTenure(p,tid); G.frLeg=G.frLeg||[]; G.frLeg.push({tid,name:p.name,pos:posLabel(p),y:G.year,n:T.n,war:+T.war.toFixed(1)});
  wire('은퇴',`${tname(tid)} 프랜차이즈 스타 ${p.name} 은퇴`,{tid}); if(tid===G.user){ stop('선수',`${p.name}이(가) 은퇴합니다. ${T.n}시즌 동안 우리 팀에서 통산 WAR ${T.war.toFixed(1)}. 은퇴식을 열었습니다.`); chron('legend',`${p.name} 은퇴식 (${T.n}시즌, WAR ${T.war.toFixed(1)})`); news('선수',`${p.name} 은퇴식… ${tshort(tid)} 팬들 눈물`,`${T.n}시즌 동안 ${tshort(tid)}을(를) 지킨 ${p.name}이(가) 유니폼을 벗습니다.`,2); } }
/* ===== 선수단 리더십: 선수들이 투표로 주장을 뽑는다. 주장의 엄격함(기강)과 영향력이 선수단 분위기를 정한다 =====
   기강 지수 S(0~100) = 주장 엄격함 60% + 감독 규율 40% (+단장 요청 보정). 45~65가 알맞고,
   너무 느슨하면(40 미만) 집중력이 떨어지고 기행이 잦아지며, 너무 세면(70 초과) 경직된 플레이와 젊은 선수 불만이 생긴다 */
function leadOf(p){ initPers(p); if(!p.lead){ const pr=p.pers.pro, tp=p.pers.temp; p.lead={str:clamp(Math.round(pr*.55+tp*.35+N(0,2.5)),1,20),cha:clamp(Math.round(p.pers.loy*.3+(p.age-22)*.45+ovr(p)/8+N(0,2)),1,20)}; } return p.lead; }
const LEADSTY=s=>s>=15?'엄격한 원칙주의':s>=11?'단호한 편':s>=7?'부드러운 형님형':'자유방임형';
function electCaptain(tid,why){ const ps=domestic(tid).filter(p=>!p.ys&&healthy(p)&&!(p.joinY>G.year)&&p.age>=25); if(!ps.length)return null;
  const sc=p=>teamTenure(p,tid).n*2.5+ovr(p)*.35+leadOf(p).cha*1.2+((p.pers&&p.pers.loy)||10)*.4+hn('el'+G.year+(why||''),p.id)*4;
  const L=ps.map(p=>({p,v:Math.max(1,sc(p))})).sort((a,b)=>b.v-a.v).slice(0,3); const c=L[0].p; const t=team(tid); const old=t.cap; t.cap=c.id;
  if(tid===G.user&&!G.unemp){ const n=domestic(tid).filter(p=>!p.ys).length; const w=L.map(x=>Math.pow(x.v,4)); const tot=sum(w); const votes=w.map(x=>Math.round(n*x/tot)); const ld=leadOf(c);
    if(old!==c.id)chron('cap',`선수단 투표로 ${c.name} 주장 선출`,c.id);
    mail('선수단','주장 선출 결과',`선수단 투표로 ${c.name}(${posLabel(c)}, ${c.age}세)이(가) 주장이 됐습니다${why?`(${why})`:''}.\n\n${L.map((x,i)=>`${x.p.name} ${votes[i]}표`).join(' · ')}\n\n리더십 성향: ${LEADSTY(ld.str)} · 선수단 영향력 ${ld.cha>=14?'큼':ld.cha>=9?'보통':'작음'}. ${old!=null&&old!==c.id&&G.players[old]&&G.players[old].team===tid?`전임 ${G.players[old].name}은(는) 주장에서 물러났습니다.`:''}\n\n주장은 선수들이 직접 뽑습니다. 기강이 지나치게 느슨하거나 세면 주장과 면담해 방향을 바꿔 달라고 요청할 수 있습니다.`,{kind:'선수',ref:c.id,face:c.id,acts:[{l:'선수단 리더십',a:'go',v:'train:lead'}]}); }
  return c; }
function climateOf(tid){ if(!G._cl||G._cl.d!==G.day)G._cl={d:G.day,v:{}}; const C=G._cl.v; if(C[tid])return C[tid];
  const t=team(tid); const c=t.cap!=null&&G.players[t.cap]&&G.players[t.cap].team===tid?G.players[t.cap]:null; const m=G.mgr[tid]; const md=m&&m.disc!=null?m.disc:45;
  const L=c?leadOf(c):{str:9,cha:6}; const adj=tid===G.user&&G.leadAdj&&G.leadAdj.until>G.day?G.leadAdj.v:0;
  const S=clamp(Math.round(L.str*5*.6+md*.4+adj),0,100); const w=clamp(L.cha/14,.35,1.3);
  const boost=(S>=45&&S<=65?.4:0)*w-(S<40?1.2*(40-S)/40:0)*w-(S>70?.8*(S-70)/30:0)*w;
  return C[tid]={S,w,boost,cap:c,band:S<40?'loose':S>70?'rigid':S>=45&&S<=65?'good':'ok'}; }
/* 주간: 느슨하면 기행, 너무 세면 젊은 선수 불만 */
function climateWeek(){ if(G.unemp||period()==='off')return; const cl=climateOf(G.user); const ps=domestic(G.user).filter(p=>!p.ys&&healthy(p)); if(!ps.length)return;
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

function seasonAwards(y){ const rows=[]; for(const p of Object.values(G.players)){ const h=seasonTotal(p,y,'1군'); if(h)rows.push({p,h,w:warOf(h,p)}); }
  const qB=x=>!x.p.isP&&x.h.pa>=300, qP=x=>x.p.isP&&x.h.outs>=270;
  const A={y,gg:{}};
  const mv=rows.filter(x=>qB(x)||qP(x)).sort((a,b)=>b.w-a.w)[0]; if(mv){ A.mvp={id:mv.p.id,name:mv.p.name,t:mv.p.team,line:statLine(mv.h,mv.p)}; addAward(mv.p,`${y} MVP`); }
  const rk=rows.filter(x=>x.p.age<=26&&!x.p.foreign&&(x.h.pa>=150||x.h.outs>=150)&&!x.p.hist.some(h=>h.lvl==='1군'&&h.y<y&&((h.pa||0)>=60||(h.outs||0)>=90))).sort((a,b)=>b.w-a.w)[0];
  if(rk){ A.roy={id:rk.p.id,name:rk.p.name,t:rk.p.team,line:statLine(rk.h,rk.p)}; addAward(rk.p,`${y} 신인왕`); }
  for(const pos of ['C','1B','2B','3B','SS','DH']){ const c=rows.filter(x=>!x.p.isP&&x.h.pos===pos&&(x.h.g||0)>=72).sort((a,b)=>b.w-a.w)[0]; if(c){ A.gg[pos]={id:c.p.id,name:c.p.name,t:c.p.team,line:statLine(c.h,c.p)}; addAward(c.p,`${y} 골든글러브(${POSS[pos]})`); } }
  rows.filter(x=>!x.p.isP&&['LF','CF','RF'].includes(x.h.pos)&&(x.h.g||0)>=72).sort((a,b)=>b.w-a.w).slice(0,3).forEach((c,i)=>{ A.gg['OF'+i]={id:c.p.id,name:c.p.name,t:c.p.team,line:statLine(c.h,c.p)}; addAward(c.p,`${y} 골든글러브(외야수)`); });
  const pg=rows.filter(qP).sort((a,b)=>b.w-a.w)[0]; if(pg){ A.gg.P={id:pg.p.id,name:pg.p.name,t:pg.p.team,line:statLine(pg.h,pg.p)}; addAward(pg.p,`${y} 골든글러브(투수)`); }
  (G.awards=G.awards||{})[y]=A;
  const mine=[A.mvp,A.roy,...Object.values(A.gg)].filter(x=>x&&x.t===G.user);
  for(const x of mine){ const p=G.players[x.id]; if(p)p.mor=clamp((p.mor??60)+6,0,100); }
  if(A.mvp&&A.mvp.t===G.user)news('선수',`${A.mvp.name}, ${y} 정규시즌 MVP`,`${tname(G.user)}의 ${A.mvp.name}이(가) ${A.mvp.line}(으)로 MVP를 차지했습니다.`,3,{ref:A.mvp.id,fanW:2});
  if(A.roy&&A.roy.t===G.user)news('선수',`${A.roy.name}, ${y} 신인왕`,`${tname(G.user)} 육성의 결실입니다.`,2,{ref:A.roy.id});
  const gg=Object.values(A.gg).filter(x=>x.t===G.user); if(gg.length)news('선수',`${tshort(G.user)} 골든글러브 ${gg.length}명 배출`,`${gg.map(x=>x.name).join(', ')}이(가) 수상했습니다.`,gg.length>=3?2:1);
  mail('홍보팀',`${y} KBO 시상 결과`,`MVP: ${A.mvp?`${A.mvp.name}(${tshort(A.mvp.t)})`:'-'}\n신인왕: ${A.roy?`${A.roy.name}(${tshort(A.roy.t)})`:'-'}\n골든글러브: ${Object.entries(A.gg).map(([k,x])=>`${k.startsWith('OF')?'외야':k==='P'?'투수':POSS[k]} ${x.name}(${tshort(x.t)})`).join(', ')}\n\n우리 구단 수상: ${mine.length?mine.map(x=>x.name).join(', '):'없음'}`,{kind:'기록',acts:[{l:'역사·시상 보기',a:'go',v:'league:hist'}]});
  return A; }
function retireRecord(p){ const c=careerOf(p); const aw=p.aw||[];
  const rec={name:p.name,isP:p.isP,pos:p.isP?posLabel(p):POSK[p.pos],y:G.year,age:p.age,seasons:c.seasons.size,teams:[...c.teams],war:+c.war.toFixed(1),pa:c.pa,h:c.h,hr:c.hr,rbi:c.rbi,sb:c.sb,ip:Math.round(c.outs/3),w:c.w,sv:c.sv,so:c.so,aw:aw.slice(-12),mvp:aw.filter(a=>a.includes('MVP')).length,gg:aw.filter(a=>a.includes('골든')).length,no:jno(p),
    mine:c.byTeam[G.user]?{war:+c.byTeam[G.user].war.toFixed(1),ys:c.byTeam[G.user].ys.size}:null};
  { const miss=Math.max(0,(p.svc||0)-rec.seasons); if(miss){ const add=miss*clamp((p.pot-45)/5,0,4.5); rec.seasons+=miss; rec.war=+(rec.war+add).toFixed(1); rec.est=true;
      if(p.team===G.user&&c.teams.size<=1){ rec.mine=rec.mine||{war:0,ys:0}; rec.mine.war=+(rec.mine.war+add).toFixed(1); rec.mine.ys+=miss; } } } /* 게임 시작 전 경력은 연차와 잠재력으로 추정 */
  if(rec.war>=8||rec.aw.length){ (G.legends=G.legends||[]).push(rec); if(G.legends.length>300)G.legends.shift(); }
  const hof=rec.war>=38||rec.mvp>=2||rec.gg>=6||(rec.war>=30&&rec.mvp>=1);
  if(hof){ rec.hof=true; (G.hof=G.hof||[]).push(rec); mail('홍보팀',`${rec.name}, 명예의 전당 헌액`,`${rec.name}이(가) 은퇴와 함께 명예의 전당에 올랐습니다. 통산 ${rec.seasons}시즌 · WAR ${rec.war}${rec.isP?` · ${rec.w}승 ${rec.sv}세이브`:` · ${rec.h}안타 ${rec.hr}홈런`}${rec.mvp?` · MVP ${rec.mvp}회`:''}${rec.gg?` · 골든글러브 ${rec.gg}회`:''}.`,{kind:'기록'}); if(rec.mine&&rec.mine.ys>=5)news('선수',`${tshort(G.user)} 레전드 ${rec.name}, 명예의 전당으로`,`구단 역사에 남을 선수가 명예의 전당에 올랐습니다.`,2,{fanW:2}); }
  if(rec.mine&&rec.mine.ys>=(retWarT()>=60?10:8)&&rec.mine.war>=retWarT()){ rec.canRetNo=true; if(!G.ob){ mail('홍보팀',`${rec.name} 영구결번 검토`,`${rec.name}이(가) 우리 구단에서 ${rec.mine.ys}시즌 동안 WAR ${rec.mine.war}를 남기고 은퇴합니다. 등번호 ${rec.no}번을 영구결번으로 지정하면 팬들이 크게 반길 것입니다.`,{imp:true,kind:'기록',acts:[{l:`${rec.no}번 영구결번 지정`,a:'retNo',v:String(G.legends.length-1)}]}); }  }
  return rec; }
function jno(p){ let n=1+Math.floor(u01('jno',p.id)*99); if(p.team===G.user&&G.retNos&&G.retNos.length){ const used=new Set(G.retNos.map(r=>r.no)); let g=0; while(used.has(n)&&g++<99)n=n%99+1; } return n; }
function retireNumber(i){ const r=(G.legends||[])[+i]; if(!r||!r.canRetNo||r.retNo)return '대상이 아닙니다.'; r.retNo=true; (G.retNos=G.retNos||[]).push({name:r.name,no:r.no,y:G.year}); news('선수',`${tshort(G.user)}, ${r.name}의 ${r.no}번 영구결번`,`구단 역사에 길이 남을 이름이 됐습니다.`,3,{fanW:3}); return `${r.no}번을 영구결번으로 지정했습니다.`; }

