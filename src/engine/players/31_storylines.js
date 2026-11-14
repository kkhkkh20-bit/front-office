/* ===== 선수 스토리라인(사용자 11-14: "선수 스토리라인 넣자", "너무 반복되면 지루하니 잘 계산해서") =====
   몇 주~몇 달에 걸쳐 이어지는 선수 이야기. 실제 상태(나이·포지션·성향·부상·계약·이적·기록)가 조건을 채울 때만 시작하고,
   단계(비트)마다 소식이 나오며 끝이 있다. 모든 구단 같은 규칙: 다른 구단 이야기는 리그 소식으로, 우리 이야기는 필요할 때만 단장 결정으로 온다.
   종류: 멘토와 제자(mentor) · 주전 경쟁 신경전(feud) · 부상 복귀(cb) · FA 앞둔 시즌(cy) · 결혼·출산(fam) · 신인 돌풍(rk) · 친정 상대(rev) · 고향 팀(home) · 늦깎이 데뷔(deb)
   빈도 제한: 리그 동시 진행·구단 동시 진행·한 해 시작 수·구단별 한 해 시작 수, 선수별·구단별 같은 종류 재시작 대기, 구단 최근 종류 기억(같은 종류 연달아 금지),
   한 해 소식·단장 결정 상한. 문장은 종류·단계마다 여러 갈래이고 성향·상황에 따라 고르며, 바로 전에 쓴 문장은 다시 쓰지 않는다.
   효과는 작게: 기분 ±몇, 멘토 제자의 다음 겨울 성장 배율 3%, 휴식(피로 조금). 경기 난수는 쓰지 않는다(해시 난수). */
const SL={act:16,actT:2,yAll:30,yT:4,wk:3,newsU:14,newsA:22,wire:40,decU:2};
const SL_T={
  mentor:{l:'멘토와 제자',cdP:730,cdT:200,pick:1},
  feud:{l:'주전 경쟁 신경전',cdP:540,cdT:240,pick:1},
  cb:{l:'부상 복귀',cdP:240,cdT:45},
  cy:{l:'FA 앞둔 시즌',cdP:700,cdT:0,bg:1},
  fam:{l:'결혼·출산',cdP:400,cdT:50,pick:1},
  rk:{l:'신인 돌풍',cdP:99999,cdT:0},
  rev:{l:'친정 상대',cdP:300,cdT:0,bg:1},
  home:{l:'고향 팀',cdP:99999,cdT:30},
  deb:{l:'늦깎이 데뷔',cdP:99999,cdT:20}};
function slInit(){ const S=G.sl||(G.sl={v:1,seq:0,act:[],log:[],cd:{},mem:{},lk:{}}); for(const k of ['act','log'])if(!Array.isArray(S[k]))S[k]=[]; for(const k of ['cd','mem','lk'])if(!S[k]||typeof S[k]!=='object')S[k]={};
  if(S.t0==null)S.t0=G.day; /* 이 기능이 처음 돈 날 이전 이적(창단 드래프트 등)은 이야기로 삼지 않는다 */
  if(S.salt==null){ try{ S.salt=G.teams.map(t=>t.name).join('')+':'+(G.startY||G.year); }catch(e){ S.salt='sl'; } }
  if(!S.yr||S.yr.y!==G.year)S.yr={y:G.year,n:0,nT:{},newsU:0,newsA:0,wire:0,decU:0,wk:-1,wkN:0};
  return S; }
/* 해시 난수(0~1): 경기 난수 흐름을 건드리지 않는다 */
function slU(k,id){ let h=2166136261>>>0; const s=(G.sl&&G.sl.salt||'')+'|'+k+'|'+id; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } h=Math.imul(h^(h>>>13),2246822507)>>>0; h^=h>>>16; return (h>>>0)/4294967296; }
const slB=w=>{ w=String(w); const c=w.charCodeAt(w.length-1)-0xAC00; return c>=0&&c<11172?(c%28>0?1:0):-1; };
const slJ=(w,a,b)=>{ const k=slB(w); return w+(k<0?`${a}(${b})`:k?a:b); };
const slIp=(w,x)=>w+x+slJ(w,'이','가').slice(w.length), slLp=(w,x)=>w+x+slJ(w,'을','를').slice(w.length);
const slI=w=>slJ(w,'이','가'), slE=w=>slJ(w,'은','는'), slL=w=>slJ(w,'을','를'), slW=w=>slJ(w,'과','와');
const slR=w=>{ w=String(w); const c=w.charCodeAt(w.length-1)-0xAC00; return c>=0&&c<11172&&c%28===8?w+'로':slJ(w,'으로','로'); }; /* ㄹ 받침은 '로' */
/* 문장 고르기: 같은 자리에서 바로 전에 쓴 문장은 피한다(리그 전체 기억) */
function slPick(key,arr,id){ const C=arr.map((t,i)=>[t,i]).filter(x=>x[0]); if(!C.length)return ''; const M=G.sl.mem; const used=Array.isArray(M[key])?M[key]:[]; /* 자리(목록 순번)를 기억한다: 성향에 따라 후보가 달라도, 이름만 바뀐 같은 틀도 피한다 */
  const fresh=C.filter(x=>!used.includes(x[1])); const L=fresh.length?fresh:C; const c=L[Math.floor(slU(key+':'+G.day,id)*L.length)];
  M[key]=[c[1],...used.filter(h=>h!==c[1])].slice(0,Math.max(1,Math.min(3,arr.length-2))); return c[0]; }
const slMe=tid=>tid!=null&&tid===ME();
const slNotable=p=>!!p&&(ovr(p)>=54||(p.pop||0)>=60);
function slMor(p,d,cap){ if(!p)return; const m=p.mor??60; p.mor=d>0?clamp(m+d,0,Math.max(m,cap??85)):clamp(m+d,0,100); }
const slPos=p=>p.isP?(p.role==='SP'?'선발 투수':p.role?'불펜 투수':'투수'):(POSK[p.pos]||'야수');
function slVs(day,opp){ return `${dmd(day)} ${tshort(opp)}전`; }
function slPerf(p,x){ if(p.isP)return `${ipStr(x.outs||0)}이닝 ${x.er||0}실점${x.so?` ${x.so}탈삼진`:''}`; const t=[`${x.ab||0}타수 ${x.h||0}안타`]; if(x.hr)t.push(`${x.hr}홈런`); if(x.rbi)t.push(`${x.rbi}타점`); return t.join(' '); }
function slBig(p,x,dec){ if(p.isP)return ((x.outs||0)>=18&&(x.er||0)<=1)||(dec&&dec.w===p.id&&(x.outs||0)>=15&&(x.er||0)<=2); return (x.hr||0)>=1||(x.h||0)>=3||(x.rbi||0)>=3; }
function slHome(p,day,opp){ const L=(G.cal&&G.cal.sched&&G.cal.sched[day])||[]; const m=L.find(x=>x.includes(p.team)&&x.includes(opp)); return m?m[0]===p.team:false; }
/* 소식 내기: 우리 이야기는 기사(한 해 상한), 다른 구단은 이름난 선수만 기사·나머지는 리그 단신 */
function slNews(s,p,title,body,tone,force){ const Y=G.sl.yr; const me=slMe(s.t);
  if(me){ if(Y.newsU>=SL.newsU)return null; Y.newsU++; return news('선수',title,body,tone||0,{ref:p&&p.id,tid:s.t}); }
  if((force||slNotable(p))&&Y.newsA<SL.newsA){ Y.newsA++; return news('선수',title,body,0,{ref:p&&p.id,tid:s.t}); }
  if(Y.wire<SL.wire){ Y.wire++; wire('선수',title,{tid:s.t,ref:p&&p.id}); } return null; }
/* 시작 가능 여부: 동시 진행·한 해 시작·대기·최근 종류 */
/* 배경 이야기(FA 앞둔 시즌·친정 상대)는 조용히 진행되다 활약할 때만 기사가 나므로 동시 진행·한 해 시작 상한에서 빼고, 같은 층끼리만 겹치지 않게 한다 */
const slFg=s=>!SL_T[s.k].bg;
function slCan(k,tid,ids){ const S=G.sl, Y=S.yr, T=SL_T[k]; if(!T||tid==null)return false; const bg=!!T.bg, same=s=>!!SL_T[s.k].bg===bg;
  if(!bg){ if(S.act.filter(slFg).length>=SL.act||Y.n>=SL.yAll||(Y.nT[tid]||0)>=SL.yT)return false; if(S.act.filter(s=>slFg(s)&&s.t===tid).length>=SL.actT)return false;
    if(Y.wk===Math.floor(G.day/7)&&Y.wkN>=SL.wk)return false; }
  for(const id of ids){ if(S.act.some(s=>same(s)&&s.p.includes(id)))return false; if((S.cd[k+':'+id]??-1e9)>G.day-T.cdP)return false; }
  if(T.cdT&&(S.cd[k+'@'+tid]??-1e9)>G.day-T.cdT)return false;
  if(T.pick&&(S.lk[tid]||[]).includes(k))return false; /* 무작위로 생기는 종류는 같은 구단에서 연달아 나오지 않는다 */
  return true; }
function slStart(k,tid,ids,st,x){ const S=G.sl, Y=S.yr; const s={id:'sl'+(S.seq=(S.seq||0)+1),k,t:tid,p:ids.slice(),st,d:G.day,y:G.year,x:x||{}};
  S.act.push(s); if(slFg(s)){ Y.n++; Y.nT[tid]=(Y.nT[tid]||0)+1; const w=Math.floor(G.day/7); if(Y.wk!==w){ Y.wk=w; Y.wkN=0; } Y.wkN++; }
  for(const id of ids)S.cd[k+':'+id]=G.day; S.cd[k+'@'+tid]=G.day; const L=S.lk[tid]=(S.lk[tid]||[]).filter(z=>z!==k); L.unshift(k); if(L.length>2)L.length=2; return s; }
function slEnd(s,why){ const S=G.sl; const i=S.act.indexOf(s); if(i<0)return; S.act.splice(i,1); for(const id of s.p)S.cd[s.k+':'+id]=G.day;
  S.log.unshift({k:s.k,p:s.p.slice(),t:s.t,y:s.y,d0:s.d,d1:G.day,end:why||'',...(s.x&&s.x.b?{b:s.x.b}:{})}); if(S.log.length>80)S.log.length=80; }
const slOf=pid=>(G.sl&&G.sl.act||[]).filter(s=>s.p.includes(pid));
const slP=id=>G.players[id];

/* ---------- 하루·한 주 진행 ---------- */
function slDaily(){ if(!G||!G.teams||G.gameOver)return; const S=slInit(); const o=dobj(G.day);
  if(o.w===1)slWeek();
  if(G.cal&&period()!=='season'&&G.day>G.cal.open&&S.seY!==G.year){ S.seY=G.year; slSeasonEnd(); }
  if(G.day===KD(12,1))for(const s of S.act.slice())if(s.k==='rk'||s.k==='cy')slEnd(s,'season'); }
function slWeek(){ const S=G.sl, per=period(); const byT={}; for(const p of Object.values(G.players)){ if(p.team==null||p.prospect||(p.joinY>G.year))continue; (byT[p.team]=byT[p.team]||[]).push(p); }
  for(const s of S.act.slice()){ const h=SLH[s.k]; let ok=true; for(const id of s.p){ const p=slP(id); if(!p||p.team!==s.t){ ok=false; break; } } if(!ok){ try{ h.gone&&h.gone(s); }catch(e){} if(S.act.includes(s))slEnd(s,'left'); continue; } try{ h.week&&h.week(s,per); }catch(e){} }
  const order=['cb','home','rev','cy','rk','mentor','feud','fam']; for(const k of order){ try{ SLH[k].scan&&SLH[k].scan(byT,per); }catch(e){} } }
function slSeasonEnd(){ const S=G.sl; for(const s of S.act.slice()){ try{ SLH[s.k].season&&SLH[s.k].season(s); }catch(e){} }
  /* 올 시즌 최고의 재기: 올해 복귀전을 치른 선수 가운데 시즌 WAR 1위(리그 기사 한 번) */
  try{ const C=(S.yr.cbBack||[]).map(id=>{ const p=slP(id); if(!p||p.team==null)return null; const h=seasonTotal(p,G.year,'1군'); if(!h||(p.isP?(h.outs||0)<150:(h.pa||0)<250))return null; return {p,h,w:warOf(h,p)}; }).filter(Boolean).sort((a,b)=>b.w-a.w);
    const c=C[0]; if(c&&c.w>=2&&S.cbY!==G.year){ S.cbY=G.year; const p=c.p; story(p,`${G.year} 부상을 딛고 재기`,'award'); news('분석',`올 시즌 최고의 재기, ${p.name}`,`긴 재활을 마치고 돌아온 ${tshort(p.team)} ${slE(p.name)} 부상 전 모습을 되찾았다는 평가를 받으며 시즌을 마쳤습니다(${statLine(c.h,p)}).`,slMe(p.team)?1:0,{ref:p.id,tid:p.team}); } }catch(e){} }

/* ---------- 경기 하나가 끝난 뒤(storyGame을 감싼다) ---------- */
function slGamePre(p){ if(!G.sl||!p||p.team==null)return null; cumInit(p); return {deb:!p.fl.deb,hr1:!!p.fl.hr1,w1:!!p.fl.w1,sv1:!!p.fl.sv1}; }
function slGame(p,x,day,opp,dec,pre){ if(!G.sl||!pre||period()!=='season')return; const L=slOf(p.id);
  for(const s of L){ const h=SLH[s.k]; try{ h.game&&h.game(s,p,x,day,opp,dec,pre); }catch(e){} }
  if(pre.deb&&!L.some(s=>!SL_T[s.k].bg))try{ SLH.deb.debut(p,x,day,opp,dec); }catch(e){} }
(function(){ try{ const f=storyGame; storyGame=function(p,x,day,opp,dec,game){ let pre=null; try{ pre=slGamePre(p); }catch(e){} const r=f.apply(this,arguments); try{ slGame(p,x,day,opp,dec||{},pre); }catch(e){} return r; }; }catch(e){} })();
/* 멘토 제자: 함께한 시즌 다음 겨울 성장이 조금 빠르다(1.03배) */
(function(){ try{ const f=coachDevMult; coachDevMult=function(p){ const v=f.apply(this,arguments); return p&&p.slGrow!=null&&p.slGrow>=G.year-1&&p.age<=25?v*1.03:v; }; }catch(e){} })();

/* ---------- 종류별 규칙 ---------- */
const slGrp=p=>p.isP?'P':p.pos==='C'?'C':['1B','2B','3B','SS'].includes(p.pos)?'IF':['LF','CF','RF'].includes(p.pos)?'OF':'DH';
const slHealthy=p=>healthy(p)&&!isAway(p)&&!p.ys;
const SLH={
/* 멘토와 제자: 같은 자리 베테랑(31세 이상·프로의식·충성심)과 어린 선수(23세 이하). 제자 기분이 조금씩 오르고, 첫 홈런·첫 승 때 스승 이야기가 나온다. 한쪽이 떠나거나 두 시즌이 지나면 끝 */
mentor:{
  scan(byT,per){ if(per!=='season'||G.day<KD(4,15)||G.day>KD(7,31))return; for(const t of G.teams){ const L=byT[t.id]||[]; if(slU('mt'+Math.floor(G.day/7),t.id)>.1)continue;
      const V=L.filter(p=>{ if(p.foreign||p.age<31||!slHealthy(p)||ovr(p)<42)return false; initPers(p); return p.pers.pro>=13&&p.pers.loy>=11; }); if(!V.length)continue;
      const Y=L.filter(p=>!p.foreign&&p.age<=23&&!p.ys&&(p.svc||0)<=3&&healthy(p)); let best=null;
      for(const v of V)for(const y of Y){ if(slGrp(v)!==slGrp(y))continue; const sc=(v.pers.pro+v.pers.loy)/2+(y.e1?3:0)+(ovr(y)-40)/4; if(!best||sc>best.sc)best={v,y,sc}; }
      if(!best||!slCan('mentor',t.id,[best.v.id,best.y.id]))continue; const v=best.v, y=best.y;
      const s=slStart('mentor',t.id,[v.id,y.id],'on',{y0:G.year}); initPers(y);
      const q=slPick('mentor.q',[v.pers.pro>=15&&'"제가 겪은 시행착오를 후배는 덜 겪었으면 합니다."',v.pers.loy>=14&&'"이 팀에서 받은 걸 돌려줄 때가 됐습니다."','"가르친다기보다 같이 고민하는 겁니다."','"저도 어릴 때 선배들에게 그렇게 배웠습니다."',y.pers.amb>=13&&'"욕심이 많은 친구라 하나를 알려 주면 둘을 물어봅니다."'],v.id);
      const ti=slPick('mentor.t',[`${tshort(t.id)} ${v.name}의 '특별 과외'… 후배 ${y.name} 곁을 지킨다`,`${tshort(t.id)} 베테랑 ${v.name}, 같은 자리 후배 ${y.name}의 길잡이로`,`"${v.name} 선배 덕분에 많이 배웁니다" ${tshort(t.id)} ${y.name}`],v.id);
      story(y,`${G.year} ${v.name} 선배에게 배우기 시작`,'sl'); story(v,`${G.year} 후배 ${y.name}의 멘토`,'sl');
      slNews(s,v,ti,`${slIp(v.name,`(${v.age}세)`)} 같은 ${slPos(y).replace(/ 투수$/,'')} 후배 ${slLp(y.name,`(${y.age}세)`)} 따로 챙기고 있습니다. 훈련이 끝나도 둘이 남아 이야기를 나누는 모습이 자주 보입니다. ${q}`,1); } },
  week(s,per){ const v=slP(s.p[0]), y=slP(s.p[1]); if(per==='season'){ slMor(y,.5,82); slMor(v,.3,82); s.x.w=(s.x.w||0)+1; } if(y.age>25)slEnd(s,'grown'); },
  season(s){ const y=slP(s.p[1]); if(y&&(s.x.w||0)>=6)y.slGrow=G.year; if(G.year>=s.x.y0+1){ const v=slP(s.p[0]); if(v&&y)story(y,`${v.name} 선배와 보낸 두 시즌`,'sl'); slEnd(s,'done'); } },
  game(s,p,x,day,opp,dec,pre){ if(p.id!==s.p[1]||s.x.f)return; const v=slP(s.p[0]); if(!v)return; let k=null; if(!p.isP&&!pre.hr1&&(x.hr||0)>0)k='hr'; else if(p.isP&&!pre.w1&&dec.w===p.id)k='w'; else if(p.isP&&!pre.sv1&&dec.sv===p.id)k='sv'; if(!k)return; s.x.f=1; slMor(p,2,85);
    const L=k==='hr'?[`"홈런을 치고 제일 먼저 ${v.name} 선배 얼굴이 떠올랐습니다."`,`"${v.name} 선배가 타이밍 얘기를 해 줬는데 그대로 들어갔습니다."`]:[`"마운드에 오르기 전에 ${v.name} 선배가 해 준 말 덕분에 버텼습니다."`,`"${v.name} 선배가 '네 공을 믿으라'고 했습니다. 그 말만 생각했습니다."`];
    const w=k==='hr'?'1군 첫 홈런':k==='w'?'1군 첫 승':'1군 첫 세이브'; slNews(s,p,`${p.name}, ${w}… "${v.name} 선배 덕분"`,`${slVs(day,opp)}에서 ${slL(w)} 기록한 ${slE(p.name)} 경기 뒤 스승을 먼저 찾았습니다. ${slPick('mentor.f',L,p.id)}`,1); },
  gone(s){ const v=slP(s.p[0]), y=slP(s.p[1]); const vGone=!v||v.team!==s.t; const stay=vGone?y:v; const left=vGone?v:y; if(!stay||stay.team!==s.t)return; if(vGone){ const nm=v?v.name:'선배'; story(stay,`스승 ${slW(nm)} 작별`,'sl'); if((s.x.w||0)>=4)slNews(s,stay,`${stay.name}, 떠나는 스승 ${nm}에게 "배운 걸 잊지 않겠습니다"`,`함께 훈련하던 ${slI(nm)} 팀을 떠났습니다. ${slE(stay.name)} "이제는 제가 혼자 해내야 합니다. 선배가 보고 있을 거라고 생각하고 뛰겠습니다"라고 말했습니다.`,0); } else if(left){ story(stay,`제자 ${slW(left.name)} 헤어짐`,'sl'); } } },
/* 주전 경쟁 신경전: 같은 자리 비슷한 실력의 두 선수, 한 명은 주전·한 명은 벤치, 적어도 한 명이 예민하거나 욕심이 크다. 진행 중에는 둘 다 기분이 조금씩 처진다.
   우리 구단: 단장 결정(중재·기용 원칙·2군으로 떼어 놓기·지켜보기). 다른 구단: AI 단장이 같은 선택지에서 고른다 */
feud:{
  scan(byT,per){ if(per!=='season'||G.day<KD(5,1)||G.day>KD(8,31))return; for(const t of G.teams){ if(slU('fd'+Math.floor(G.day/7),t.id)>.06)continue; if(G.sl.log.concat(G.sl.act).some(s=>s.k==='feud'&&s.t===t.id&&s.y===G.year))continue;
      const L=(byT[t.id]||[]).filter(p=>slHealthy(p)&&ovr(p)>=45); L.forEach(initPers); let best=null; const cap=(()=>{ try{ return captainOf(t.id); }catch(e){ return null; } })(); if(cap&&cap.pers&&cap.pers.pro>=15&&slU('fdc'+G.day,t.id)<.5)continue; /* 프로의식 강한 주장은 신경전을 미리 누른다 */
      let reg=null; try{ const d=depth(t.id); reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); }catch(e){ continue; }
      for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){ const a=L[i], b=L[j]; if(a.isP!==b.isP||(a.isP?(a.role==='SP')!==(b.role==='SP'):a.pos!==b.pos))continue; if(reg.has(a.id)===reg.has(b.id))continue; if(Math.abs(ovr(a)-ovr(b))>5)continue;
        const hot=Math.max(a.pers.temp,b.pers.temp), amb=Math.max(a.pers.amb,b.pers.amb); if(!(hot>=14&&(Math.min(a.pers.temp,b.pers.temp)>=11||amb>=13))&&!(amb>=16&&hot>=12))continue; const sc=hot+amb/2; if(!best||sc>best.sc)best={a:reg.has(a.id)?b:a,b:reg.has(a.id)?a:b,sc}; }
      if(!best||!slCan('feud',t.id,[best.a.id,best.b.id]))continue; slFeudStart(t.id,best.a,best.b); } },
  week(s,per){ const a=slP(s.p[0]), b=slP(s.p[1]); if(['rumor','cold','clash'].includes(s.st)){ slMor(a,-.6); slMor(b,-.6); }
    if(s.nx!=null&&G.day>=s.nx){ if(s.st==='clash'||s.st==='cool'||s.st==='quiet'){ slFeudFade(s); return; } if(s.st==='cold'){ slFeudClash(s); return; } }
    if(s.st==='rumor'&&!slMe(s.t)&&G.day-s.d>=7)slFeudAct(s,slFeudAi(s),false); },
  season(s){ slFeudFade(s,'season'); },
  gone(s){ const a=slP(s.p[0]), b=slP(s.p[1]); const st=a&&a.team===s.t?a:b&&b.team===s.t?b:null; if(st)slMor(st,1); } },
/* 부상 복귀: 45일 이상 다친 주요 선수. 재활 막바지 소식 → 복귀전 → 한 달 뒤 평가. 시즌 끝에 '최고의 재기' 기사 */
cb:{
  scan(byT){ for(const t of G.teams)for(const p of byT[t.id]||[]){ if(!(p.injOut>=45)||p.ys||ovr(p)<46)continue; if(!slCan('cb',t.id,[p.id]))continue; const h=(p.injHist||[]).slice(-1)[0]; const tot=Math.max(p.injOut,h&&h.days||0);
      slStart('cb',t.id,[p.id],'rehab',{tot,d0:G.day-Math.max(0,tot-p.injOut),ik:p.injK||h&&h.k||null}); story(p,`${G.year} 긴 재활 시작`,'sl'); } },
  week(s){ const p=slP(s.p[0]); const nm=injName(s.x.ik);
    if(s.st==='rehab'&&p.injOut>0&&p.injOut<=Math.max(7,s.x.tot*.3)&&G.day-s.d>=14){ s.st='late'; initPers(p);
      const q=slPick('cb.q',[p.pers.pro>=14&&'"하루도 빼먹지 않고 재활했습니다. 몸은 준비됐습니다."',p.pers.amb>=14&&'"빨리 돌아가서 제 자리를 되찾고 싶습니다."','"동료들이 뛰는 걸 TV로만 보는 게 제일 힘들었습니다."','"조급해하지 않으려고 합니다. 완전히 나아서 돌아가겠습니다."'],p.id);
      if(slMe(s.t)||ovr(p)>=56)slNews(s,p,slPick('cb.t',[`${tshort(s.t)} ${p.name}, 긴 재활 끝 보인다`,`${p.name}, 재활 막바지… 복귀 시계 빨라진다`,`'${nm}' 이겨 낸 ${p.name}, 실전 감각 끌어올리는 중`],p.id),`${slR(nm)} 빠졌던 ${slI(p.name)} 재활 마지막 단계에 들어갔습니다. ${q}`,0); }
    if((s.st==='rehab'||s.st==='late')&&!(p.injOut>0)){ s.st='wait'; s.x.r=G.day; }
    if(s.st==='wait'&&G.day-(s.x.r||G.day)>45)slEnd(s,'quiet');
    if(s.st==='back'&&G.day-s.x.bd>=28){ const h=seasonTotal(p,G.year,'1군')||{}, b=s.x.sn||{}; const d=k=>(h[k]||0)-(b[k]||0);
      const good=p.isP?d('outs')>=45&&d('er')*27/Math.max(1,d('outs'))<=3.5:d('pa')>=40&&(()=>{ const ab=d('ab'), hh=d('h'), bb=d('bb'), tb=hh+d('d')+2*d('tr')+3*d('hr'); return ab>0&&(hh+bb)/(ab+bb)+tb/ab>=.8; })();
      if(good){ const t=p.isP?`복귀 뒤 ${ipStr(d('outs'))}이닝 평균자책점 ${(d('er')*27/Math.max(1,d('outs'))).toFixed(2)}`:`복귀 뒤 ${d('pa')}타석 ${d('hr')}홈런`; story(p,`부상 공백을 지운 한 달 · ${t}`,'sl'); s.x.b='good'; slNews(s,p,slPick('cb.r',[`${p.name}, 부상 공백 지운 한 달`,`돌아온 ${p.name}, 완벽한 부활 신호`,`${tshort(s.t)} ${p.name} "아픈 건 다 잊었습니다"`],p.id),`${slE(p.name)} 제 모습을 되찾았습니다(${t}).`,1); }
      slEnd(s,good?'reborn':'back'); } },
  game(s,p,x,day,opp,dec){ if(s.st!=='wait'&&s.st!=='late'&&s.st!=='rehab')return; if(p.injOut>0)return; s.st='back'; s.x.bd=G.day; s.x.b=s.x.b||'back'; { const Y=G.sl.yr; (Y.cbBack=Y.cbBack||[]).push(p.id); } const h=seasonTotal(p,G.year,'1군')||{}; s.x.sn={pa:h.pa||0,ab:h.ab||0,h:h.h||0,bb:h.bb||0,d:h.d||0,tr:h.tr||0,hr:h.hr||0,outs:h.outs||0,er:h.er||0}; /* 이 경기 기록은 아직 들어가기 전: 복귀전도 한 달 평가에 넣는다 */
    const days=Math.max(1,G.day-s.x.d0), big=slBig(p,x,dec); slMor(p,3,85); initPers(p); story(p,`${days}일 만의 1군 복귀전 · ${slVs(day,opp)}`,'sl');
    const q=slPick('cb.bq',[big&&'"오래 기다린 만큼 하나라도 보여 주고 싶었습니다."',big&&'"재활 도와주신 트레이너분들께 이 경기를 바칩니다."',!big&&'"결과보다 아프지 않고 뛰었다는 게 중요합니다."',!big&&'"감각은 금방 돌아올 겁니다. 이제 시작입니다."','"관중석 함성이 이렇게 그리웠는지 몰랐습니다."'],p.id);
    slNews(s,p,big?slPick('cb.bt',[`${p.name}, ${days}일 만의 복귀전서 존재감`,`돌아온 ${p.name}, 복귀전부터 펄펄`],p.id):`${tshort(s.t)} ${p.name}, ${days}일 만에 1군 복귀전`,`${slR(injName(s.x.ik))} ${days}일을 쉰 ${slI(p.name)} ${slVs(day,opp)}에서 돌아왔습니다. ${slPerf(p,x)}. ${q}`,big?1:0); },
  season(s){ if(s.st==='back')slEnd(s,'back'); } },
/* FA 앞둔 시즌: 개막 무렵 구단마다 FA를 앞둔 대표 선수 한 명. 8월 초 성적에 따라 '대박 예감'이나 '고전' 기사. 시즌이 끝나면 끝 */
cy:{
  scan(byT,per){ if(per!=='season'||G.day<G.cal.open||G.day>G.cal.open+21)return; const C=[];
    for(const t of G.teams){ const L=(byT[t.id]||[]).filter(p=>!p.foreign&&!p.ys&&p.age<=35&&!p.extNext&&slCyOk(p)&&ovr(p)>=(slMe(t.id)?50:52)).sort((a,b)=>ovr(b)-ovr(a)); const p=L[0]; if(p&&slCan('cy',t.id,[p.id]))C.push(p); }
    C.sort((a,b)=>ovr(b)-ovr(a)); let n=0; for(const p of C){ if(!slCan('cy',p.team,[p.id]))continue; const s=slStart('cy',p.team,[p.id],'on',{}); initPers(p); slMor(p,p.pers.amb>=13?2:1,85);
      if(n<4||slMe(p.team)){ n++; const q=slPick('cy.q',[p.pers.amb>=14&&'"좋은 평가를 받고 싶은 건 당연합니다. 성적으로 보여 드리겠습니다."',p.pers.loy>=14&&'"계약보다 팀 성적이 먼저입니다. 여기서 오래 뛰고 싶습니다."','"FA는 시즌이 끝나고 생각하겠습니다. 지금은 한 경기에만 집중합니다."',p.pers.temp>=14&&'"주변에서 말이 많은 건 압니다. 신경 안 쓰려고 합니다."'],p.id);
        slNews(s,p,slPick('cy.t',[`FA 앞둔 ${tshort(p.team)} ${p.name}, "증명할 시즌"`,`${p.name}의 FA 시즌 개막… 몸값 경쟁 시작`,`계약 마지막 해 ${p.name}에게 쏠리는 시선`],p.id),`올 시즌을 마치면 FA 자격을 얻는 ${p.name}(${slPos(p)}, ${p.age}세)에게 관심이 쏠립니다. ${q}`,0); } } },
  week(s,per){ if(s.st!=='on'||per!=='season'||G.day<KD(8,1)||G.day>KD(8,7))return; const p=slP(s.p[0]); const h=seasonTotal(p,G.year,'1군'); if(!h)return; const w=warOf(h,p); const n=G.sl.yr;
    if(w>=(p.isP?2.4:2.8)){ s.st='hot'; s.x.b='hot'; n.cyH=(n.cyH||0)+1; if(n.cyH<=2||slMe(s.t))slNews(s,p,slPick('cy.h',[`'FA 대박' 예감 ${p.name}, 몸값 치솟는다`,`FA 앞두고 커리어 하이 페이스… ${p.name}의 여름`],p.id),`${slI(p.name)} FA를 앞두고 맹활약하고 있습니다(${statLine(h,p)}). 벌써 여러 구단이 지켜본다는 이야기가 나옵니다.`,1); }
    else if(w<.4&&(p.isP?(h.outs||0)>=150:(h.pa||0)>=200)){ s.st='cold'; s.x.b='cold'; n.cyC=(n.cyC||0)+1; if(n.cyC<=1||slMe(s.t))slNews(s,p,`FA 앞둔 ${p.name}, 길어지는 부진`,`FA를 앞둔 ${slI(p.name)} 기대에 못 미치고 있습니다(${statLine(h,p)}). 남은 두 달이 몸값을 가를 전망입니다.`,0); } },
  season(s){ const p=slP(s.p[0]); if(p&&s.st==='hot')story(p,`${G.year} FA 앞둔 시즌 맹활약`,'sl'); } },
/* 결혼(비시즌)·출산(시즌 중). 우리 선수 출산은 단장 결정(선물·휴식·축하 인사). 아이가 태어난 뒤 첫 경기에서 활약하면 '아빠의 힘' 기사 */
fam:{
  scan(byT,per){ const o=dobj(G.day); const wed=(per==='off'&&G.day>=KD(11,10))||(per==='pre'&&o.m===1&&o.d<=25); const bab=per==='season';
    if(!wed&&!bab)return; for(const t of G.teams){ for(const p of byT[t.id]||[]){ if(p.ys||p.foreign)continue; const F=slFam(p);
        if(wed&&!F.m&&p.age>=26&&p.age<=33&&slU('wed'+Math.floor(G.day/7),p.id)<.0065){ if(!slCan('fam',t.id,[p.id]))continue; slWed(p); break; }
        if(bab&&F.m&&F.m<G.year&&p.age>=26&&p.age<=37&&(F.b==null||G.day-F.b>540)&&slU('bab'+Math.floor(G.day/7),p.id)<.0028){ if(!slCan('fam',t.id,[p.id]))continue; slBaby(p); break; } } } },
  week(s){ if(G.day-s.d>=(s.st==='wed'?56:42))slEnd(s,'done'); },
  game(s,p,x,day,opp,dec){ if(s.st!=='baby'||s.x.g||G.day-s.d>12)return; s.x.g=1; if(!slBig(p,x,dec))return; const kid=s.x.boy?'아들':'딸';
    slNews(s,p,slPick('fam.g',[`'아빠의 힘' ${p.name}, ${kid}에게 바친 경기`,`${p.name}, 출산 뒤 첫 경기서 활약… "${kid}가 복덩이입니다"`],p.id),`최근 아빠가 된 ${slI(p.name)} ${slVs(day,opp)}에서 ${slR(slPerf(p,x))} 활약했습니다.`,1); } },
/* 신인 돌풍: 5월 중순~7월, 신인왕 자격 선수 가운데 성적이 두드러진 선수(리그 한 해 3명). 8월 중순 신인왕 레이스 기사. 시상식 뒤 끝 */
rk:{
  scan(byT,per){ if(per!=='season')return; const Y=G.sl.yr;
    if(G.day>=KD(5,10)&&G.day<=KD(7,20)&&(Y.rkN||0)<3){ const C=slRookies().filter(c=>c.hot); for(const c of C){ if((Y.rkN||0)>=3)break; const p=c.p; if(!slCan('rk',p.team,[p.id]))continue; Y.rkN=(Y.rkN||0)+1; const s=slStart('rk',p.team,[p.id],'hype',{}); slMor(p,3,88); initPers(p);
        const q=slPick('rk.q',[p.pers.amb>=14&&'"신인왕은 욕심납니다. 숨기지 않겠습니다."','"아직 보여 드릴 게 더 많습니다."','"형들이 편하게 해 줘서 겁 없이 하고 있습니다."',p.pers.pro>=14&&'"기록은 신경 안 씁니다. 매일 해야 할 걸 할 뿐입니다."'],p.id);
        slNews(s,p,slPick('rk.t',[`${tshort(p.team)} 신인 ${p.name} 돌풍… 신인왕 경쟁에 불`,`무서운 신인 ${p.name}, ${tshort(p.team)}의 새 얼굴`,`${p.name}, 신인답지 않은 배짱`],p.id),`신인왕 자격을 갖춘 ${slI(p.name)} 눈도장을 찍었습니다(${statLine(c.h,p)}). ${q}`,1,true); } }
    if(G.day>=KD(8,10)&&G.day<=KD(8,16)&&!Y.rkRace){ const C=slRookies().slice(0,3); if(C.length>=2){ Y.rkRace=1; const nm=C.map(c=>c.p.name).join('·');
        for(const c of C){ const s=slOf(c.p.id).find(z=>z.k==='rk'); if(s)s.st='race'; }
        const me=C.find(c=>slMe(c.p.team)); news('분석',`신인왕 레이스 ${C.length}파전… ${nm}`,C.map(c=>`${tshort(c.p.team)} ${c.p.name}: ${statLine(c.h,c.p)}`).join('\n')+`\n남은 경기에서 순위가 바뀔 수 있습니다.`,me?1:0,{tid:me?G.user:C[0].p.team,ref:C[0].p.id}); } } },
  week(){} },
/* 친정 상대: 트레이드·FA로 다른 구단에서 직접 옮긴 선수. 친정과 첫 맞대결은 이력에 남고, 크게 활약하면 기사(두 번까지) */
rev:{
  scan(){} ,
  game(s,p,x,day,opp,dec){ if(opp!==s.x.f)return; const first=!s.x.m; s.x.m=(s.x.m||0)+1; if(first)story(p,`친정 ${slW(tshort(opp))} 첫 맞대결 · ${dmd(day)}`,'sl'); if(!slBig(p,x,dec)||(s.x.bn||0)>=(slMe(s.t)?2:1))return; const Y=G.sl.yr; if(!slMe(s.t)&&(Y.revN||0)>=6)return; s.x.bn=(s.x.bn||0)+1; if(!slMe(s.t))Y.revN=(Y.revN||0)+1; initPers(p);
    const q=slPick('rev.q',[(p.pers.temp>=13||p.pers.amb>=14)&&'"보여 주고 싶은 마음이 없었다면 거짓말입니다."',p.pers.loy>=13&&'"옛 동료들과 팬들께 인사드린다는 마음으로 뛰었습니다."','"그냥 한 경기일 뿐입니다. 이겨서 기쁩니다."','"상대 벤치가 낯익어서 묘했습니다."'],p.id);
    const fT=tshort(opp); slNews(s,p,slPick('rev.t',[`${p.name}, 친정 ${fT}에 비수`,`옛 동료 앞에서 웃은 ${p.name}`,`${fT} 울린 ${p.name}, "특별한 감정은 없었습니다"`].filter(t=>q.includes('특별')?true:!t.includes('특별한 감정')),p.id),`${s.x.why} ${slL(fT)} 떠난 ${slI(p.name)} 친정과의 경기에서 ${slR(slPerf(p,x))} 활약했습니다. ${q}`,1); },
  season(s){ if(G.year>=s.x.ey)slEnd(s,'season'); } },
/* 고향 팀: 연고 지역 출신 선수가 다른 구단에서 고향 구단으로 옮겼을 때. 합류 기사, 첫 홈경기 기사 */
home:{
  scan(byT){ for(const t of G.teams)for(const p of byT[t.id]||[]){ const L=(p.tLog||[]).slice(-1)[0]; if(!L||L.t!==p.team||L.f==null||L.f===L.t||G.day-L.d>200||L.d<G.sl.t0)continue; const key='mv:'+p.id; if(G.sl.cd[key]===L.d)continue; G.sl.cd[key]=L.d; if(p.ys)continue;
      const why=/트레이드/.test(((p.story||[]).slice(-3).reverse().find(x=>x.k==='move')||{}).t||'')?'트레이드로':'FA로';
      const tm=team(p.team); if(!p.foreign&&p.region&&tm&&tm.region===p.region&&slCan('home',t.id,[p.id])){ const s=slStart('home',t.id,[p.id],'in',{f:L.f}); slMor(p,4,88); initPers(p);
        const q=slPick('home.q',[p.pers.loy>=13&&'"어릴 때 관중석에서 응원하던 팀입니다. 꿈을 이뤘습니다."',p.pers.amb>=14&&'"고향 팬들 앞에서 우승하고 싶습니다."','"부모님이 경기장에 자주 오실 수 있게 됐습니다."','"익숙한 사투리가 들리니 벌써 마음이 편합니다."'],p.id);
        story(p,`${G.year} 고향 팀 ${tshort(p.team)} 합류`,'sl'); slNews(s,p,slPick('home.t',[`${p.name}, 고향 팀 ${tshort(p.team)} 유니폼 입는다`,`"어릴 때 보던 팀입니다" ${p.name}, ${tshort(p.team)}행`],p.id),`${p.region} 출신 ${slI(p.name)} ${why} ${tname(p.team)}에 합류했습니다. ${q}`,1); continue; }
      if(ovr(p)>=48&&slCan('rev',t.id,[p.id])){ const per=period(); slStart('rev',t.id,[p.id],'on',{f:L.f,why:why==='트레이드로'?'트레이드로':'FA 계약으로',ey:per==='season'||per==='post'||G.day<KD(11,1)?G.year:G.year+1}); } } },
  game(s,p,x,day,opp){ if(s.x.h||!slHome(p,day,opp))return; s.x.h=1; s.st='done'; const tone=slBig(p,x,{})?1:0;
    slNews(s,p,`고향 팬 앞에 선 ${p.name}`,`${slI(p.name)} 고향 구단 유니폼을 입고 처음으로 안방 경기에 나서 ${slL(slPerf(p,x))} 기록했습니다. 관중석에서 이름을 연호하는 소리가 컸습니다.`,tone); slEnd(s,'done'); },
  week(s){ if(G.day-s.d>240)slEnd(s,'done'); } },
/* 늦깎이 데뷔: 2군에서 오래 기다린 25세 이상 국내 선수의 1군 데뷔. 한 달 안에 첫 안타·첫 승이 나오면 한 번 더 */
deb:{
  debut(p,x,day,opp,dec){ if(p.foreign||p.age<25||p.team==null)return; const jy=p.draft&&p.draft.y!=null?p.draft.y+1:null; const n=jy!=null?G.year-jy+1:null; if(n!=null&&n<4)return; if(n==null&&p.age<27)return;
    if((G.sl.yr.debN||0)>=2&&!slMe(p.team))return; if(!slCan('deb',p.team,[p.id]))return; G.sl.yr.debN=(G.sl.yr.debN||0)+1; const s=slStart('deb',p.team,[p.id],'on',{}); slMor(p,4,88);
    if(p.isP?dec.w===p.id||dec.sv===p.id:(x.h||0)>0)s.x.f=1;
    const q=slPick('deb.q',['"전광판에 제 이름이 나오는데 실감이 안 났습니다."','"그만둘까 고민한 적도 있었습니다. 버티길 잘했습니다."','"부모님께 가장 먼저 전화드렸습니다."','"2군 동료들이 다 같이 봤다고 하더라고요. 그게 제일 고맙습니다."'],p.id);
    slNews(s,p,slPick('deb.t',[n?`프로 ${n}년 차 ${p.name}, 마침내 1군 무대`:`${p.age}세 ${p.name}, 마침내 1군 무대`,`기다림 끝 1군 데뷔… ${tshort(p.team)} ${p.name}`],p.id),`${p.age}세 ${slI(p.name)} ${slVs(day,opp)}에서 1군 데뷔전을 치렀습니다. ${slPerf(p,x)}. ${q}`,1,true); },
  game(s,p,x,day,opp,dec){ if(s.x.f)return; const k=p.isP?(dec.w===p.id?'승':dec.sv===p.id?'세이브':null):(x.hr?'홈런':(x.h||0)>0?'안타':null); if(!k)return; s.x.f=1; story(p,`1군 첫 ${k} · ${slVs(day,opp)}`,'sl');
    slNews(s,p,`늦깎이 ${p.name}, 감격의 1군 첫 ${k}`,`데뷔한 지 얼마 되지 않은 ${slI(p.name)} ${slVs(day,opp)}에서 1군 첫 ${slL(k)} 기록했습니다. "이 공은 평생 간직하겠습니다."`,1,true); slEnd(s,'done'); },
  week(s){ if(G.day-s.d>30)slEnd(s,'done'); } } };

/* FA를 앞둔 시즌인가: FA 계약 마지막 해, 또는 이번 시즌 뒤 FA 자격(등록 연수) */
function slCyOk(p){ try{ if(milServing(p))return false; if(p.faC){ const c=ctInfo(p); return !!c&&c.last&&!(p.cOpt&&!p.cOpt.used); } if(p.ext)return false; const n=Math.max(0,faSvc(p)-(p.svc||0)); if(n===0&&p.age>37)return false; return faLeft(p)<=1; }catch(e){ return false; } }
/* 신인왕 자격(시상식 후보 기준과 같다) 선수 가운데 성적 순 */
function slRookies(){ const y=G.year, out=[]; for(const p of Object.values(G.players)){ if(p.team==null||p.foreign||p.ovsExp||p.prospect)continue; const h=seasonTotal(p,y,'1군'); if(!h)continue;
    const jy=p.draft&&p.draft.y!=null?p.draft.y+1:Math.min(...p.hist.map(x=>x.y).concat([y,y-Math.max(0,(p.svc||0)-1)])); if(jy<y-5)continue; const H=p.hist.filter(x=>x.lvl==='1군'&&x.y<y&&!x.y2); if(sum(H.map(x=>x.pa||0))>60||sum(H.map(x=>x.outs||0))>90)continue;
    const w=warOf(h,p); let hot=false; if(p.isP)hot=((h.outs||0)>=120&&pRate(h).era<=3.2)||((h.outs||0)>=60&&(h.g||0)>=20&&pRate(h).era<=2.2); else hot=(h.pa||0)>=90&&bRate(h).ops>=.84; if(!hot&&w<.5)continue; out.push({p,h,w,hot:hot&&w>=1}); }
  return out.sort((a,b)=>b.w-a.w); }
/* 결혼 여부: 게임 시작 전 결혼은 나이로 정한 해시값(저장하지 않는다), 게임 중 결혼·출산은 p.fam */
function slFam(p){ if(p.fam)return p.fam; const a0=p.age-(G.year-(G.startY||G.year)); const f=a0>=33?.75:a0>=30?.55:a0>=28?.3:a0>=26?.12:0; return slU('m0',p.id)<f?{m:(G.startY||G.year)-1}:{}; }
function slWed(p){ const s=slStart('fam',p.team,[p.id],'wed',{}); p.fam={...slFam(p),m:G.year}; slMor(p,4,88); initPers(p); story(p,`${G.year} 결혼`,'sl');
  const q=slPick('fam.wq',[p.pers.loy>=13&&'"가정을 꾸린 만큼 더 책임감 있게 뛰겠습니다. 팬들께도 감사드립니다."',p.pers.amb>=14&&'"지켜야 할 사람이 생겼습니다. 다음 시즌이 더 중요해졌습니다."','"늘 곁에서 응원해 준 사람입니다. 좋은 모습으로 보답하겠습니다."','"야구장 밖에서는 평범한 남편이 되고 싶습니다."'],p.id);
  slNews(s,p,slPick('fam.wt',[`${tshort(p.team)} ${p.name}, 이번 겨울 결혼`,`${p.name}, 오랜 연인과 백년가약`,`${tshort(p.team)} ${p.name}, 비시즌 결혼 소식 전해`],p.id),`${slIp(p.name,`(${slPos(p)}, ${p.age}세)`)} 이번 겨울 결혼식을 올립니다. ${q}`,1); }
function slBaby(p){ const F=slFam(p); const n=(F.k||0)+1; const boy=slU('boy'+G.day,p.id)<.5; const s=slStart('fam',p.team,[p.id],'baby',{boy:boy?1:0,n}); p.fam={...F,b:G.day,k:n}; slMor(p,3,88); story(p,`${G.year} ${n===1?'첫':n===2?'둘째':'셋째'} 아이 출생`,'sl');
  const ord=n===1?'첫 아이':n===2?'둘째':'셋째'; const tt=slPick('fam.bt',[`${tshort(p.team)} ${p.name}, 아빠 됐다… "더 힘이 납니다"`,`${p.name}, 시즌 중 ${boy?'득남':'득녀'} 경사`,`${tshort(p.team)} ${p.name}, ${ord}를 품에 안다`],p.id);
  slNews(s,p,tt,`${slI(p.name)} ${boy?'아들':'딸'}을 얻었습니다. ${n===1?'첫 아이입니다. ':''}산모와 아이 모두 건강합니다.`,1);
  if(slMe(p.team)&&G.sl.yr.decU<SL.decU&&!evOpen().some(e=>e.k==='slFam'||e.k==='slFeud')){ G.sl.yr.decU++;
    const O=[['gift','구단 이름으로 축하 선물을 보낸다','300만 원. 선수 기분이 오릅니다.'],['rest','감독에게 하루 쉬게 해 달라고 건의한다','피로가 풀리고 기분이 조금 오릅니다.'],['msg','축하 인사만 전한다','비용은 없습니다.']];
    evNew('slFam',`${p.name}, ${boy?'득남':'득녀'}`,`${slIp(p.name,`(${slPos(p)})`)} ${ord}를 얻었습니다. 구단이 어떻게 축하할지 정해 주세요.`,O.map(o=>({l:o[1],fx:o[2]})),{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id,sid:s.id,ks:O.map(o=>o[0])},def:2,exp:3}); }
  else slFamAct(p,slMe(p.team)?'msg':(slU('famai',p.id)<.6?'gift':'msg')); }
function slFamAct(p,k){ if(k==='gift'){ slMor(p,5,90); if(slMe(p.team)){ G.spend=G.spend||{}; G.spend.etc=(G.spend.etc||0)+3; } else { const t=team(p.team); if(t&&t.cash!=null)t.cash-=3; } return `${p.name}: "구단에서 이렇게까지 챙겨 주실 줄 몰랐습니다. 감사합니다." 기분 상승.`; }
  if(k==='rest'){ slMor(p,3,88); p.fat=Math.max(0,(p.fat||0)-20); return `감독이 ${p.name}에게 하루 휴식을 줬습니다. 피로가 풀리고 기분이 조금 올랐습니다.`; }
  slMor(p,1,85); return `${p.name}에게 축하 인사를 전했습니다.`; }
EVH.slFam={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||p.team!==G.user)return '이제 우리 선수가 아닙니다.'; return slFamAct(p,e.data.ks[i]); } };
/* ---- 주전 경쟁 신경전 진행 ---- */
function slFeudStart(tid,a,b){ const s=slStart('feud',tid,[a.id,b.id],'rumor',{}); const tn=tshort(tid); const hot=a.pers.temp>=b.pers.temp?a:b; const pw=a.isP?(a.role==='SP'?'선발 자리':'불펜 자리'):`${POSK[a.pos]||'주전'} 자리`;
  const q=slPick('feud.q',[hot.pers.temp>=15&&`${slE(hot.name)} "기회는 실력으로 받는 겁니다. 저는 제 할 일만 하겠습니다"라며 말을 아꼈습니다.`,a.pers.amb>=14&&`${slE(a.name)} "벤치에 앉으려고 여기 온 게 아닙니다"라고 했습니다.`,`구단 관계자는 "경쟁은 좋은 일이지만 선을 넘으면 안 된다"고 말했습니다.`,`한 동료는 "둘이 같은 자리에 서 있으면 공기가 다르다"고 전했습니다.`],a.id);
  story(a,`${G.year} ${slW(b.name)} ${pw} 경쟁`,'sl'); story(b,`${G.year} ${slW(a.name)} ${pw} 경쟁`,'sl');
  slNews(s,a,slPick('feud.t',[`${tn} ${a.name}·${b.name}, ${pw} 두고 신경전`,`${tn} ${pw} 경쟁 과열… ${a.name}·${b.name} 사이 냉기류`,`${slW(a.name)} ${b.name}, ${tn} 더그아웃의 미묘한 기류`],a.id),`${pw}를 두고 경쟁하는 ${slW(a.name)} ${b.name}의 사이가 심상치 않다는 이야기가 나옵니다. ${q}`,-1);
  if(slMe(tid)&&G.sl.yr.decU<SL.decU&&!evOpen().some(e=>e.k==='slFeud'||e.k==='slFam')){ G.sl.yr.decU++;
    const O=[['mediate','둘을 함께 불러 중재한다','성향과 관계에 따라 풀릴 수도, 더 어색해질 수도 있습니다.'],['principle','감독에게 기용 원칙을 분명히 해 달라고 한다','벤치 쪽 선수는 서운해하지만 대개 가라앉습니다.'],['separate',`${slL(a.name)} 2군으로 보내 거리를 둔다`,'갈등은 끝나지만 본인은 실망합니다. 감독이 받아들여야 합니다.'],['watch','지켜본다','저절로 가라앉을 수도, 더 커질 수도 있습니다.']];
    evNew('slFeud',`${a.name}·${b.name} 신경전`,`${pw}를 두고 ${slW(a.name)} ${slI(b.name)} 날을 세우고 있습니다. 둘 다 기분이 처지고 있습니다.`,O.map(o=>({l:o[1],fx:o[2]})),{ref:a.id,face:a.id,from:'수석코치',data:{pid:a.id,sid:s.id,ks:O.map(o=>o[0])},def:3,exp:5}); }
  else if(slMe(tid))slFeudAct(s,'watch',true); /* 결정 상한이면 지켜보는 쪽으로 */
  return s; }
function slFeudAi(s){ const u=slU('fdai'+s.d,s.t); return u<.5?'mediate':u<.75?'principle':u<.85?'separate':'watch'; }
function slFeudOk(a,b){ const cap=(()=>{ try{ return captainOf(a.team); }catch(e){ return null; } })(); const cb=cap&&cap!==a&&cap!==b&&cap.pers&&cap.pers.pro>=14?.1:0;
  return clamp(.38+((a.pers.pro+b.pers.pro)/2-10)*.04+((a.pers.loy+b.pers.loy)/2-10)*.02-(Math.max(a.pers.temp,b.pers.temp)-14)*.03+cb,.12,.82); }
function slFeudAct(s,k,me){ const a=slP(s.p[0]), b=slP(s.p[1]); if(!a||!b||a.team!==s.t||b.team!==s.t){ slEnd(s,'left'); return '상황이 바뀌었습니다.'; } const tn=tshort(s.t);
  if(k==='mediate'){ if(slU('fdok'+G.day,s.id)<slFeudOk(a,b)){ slMor(a,3); slMor(b,3); story(a,`${slW(b.name)} 화해`,'sl'); story(b,`${slW(a.name)} 화해`,'sl'); s.x.b='peace';
      if(!me)slNews(s,a,`${tn} ${a.name}·${b.name}, 오해 풀고 악수`,`신경전을 벌이던 두 선수가 구단 중재로 자리를 함께했습니다. "서로 도우면서 경쟁하겠습니다."`,0); slEnd(s,'peace'); return `두 선수가 악수했습니다. "서로 도우면서 경쟁하겠습니다." 두 선수 기분 상승.`; }
    slMor(a,-2); slMor(b,-2); s.st='cold'; s.nx=G.day+14+Math.floor(slU('fdn',s.id)*8); return `자리를 마련했지만 둘은 끝내 눈을 마주치지 않았습니다. 두 선수 기분 조금 하락.`; }
  if(k==='principle'){ slMor(a,-2); slMor(b,1); s.st=Math.max(a.pers.temp,b.pers.temp)>=16&&slU('fdp',s.id)<.4?'cold':'cool'; s.nx=G.day+21; return `"기록이 좋은 선수가 나간다"는 원칙을 선수단에 전했습니다. ${a.name} 기분 조금 하락.`; }
  if(k==='separate'){ let r=''; if(me){ try{ r=reqEntry(a.id,false)||''; }catch(e){} } else if(a.e1){ a.e1=false; a.downDay=G.day; } slMor(a,-4); slMor(b,1); try{ grvAdd(a,'demo',1.5); }catch(e){} s.x.b='apart'; slEnd(s,'apart'); return `${slL(a.name)} 2군으로 보내 거리를 두기로 했습니다.${r?` ${r}`:''} ${a.name} 기분 하락.`; }
  if(slU('fdw',s.id)<.5){ s.st='cold'; s.nx=G.day+14+Math.floor(slU('fdn2',s.id)*7); } else { s.st='quiet'; s.nx=G.day+21; } return '지켜보기로 했습니다.'; }
function slFeudClash(s){ const a=slP(s.p[0]), b=slP(s.p[1]); slMor(a,-3); slMor(b,-3); s.st='clash'; s.nx=G.day+28; s.x.b='clash'; const tn=tshort(s.t);
  story(a,`${slW(b.name)} 훈련 중 언쟁`,'sl'); slNews(s,a,slPick('feud.c',[`${tn} ${a.name}·${b.name}, 훈련 중 언쟁… 구단 "내부에서 정리"`,`끝내 터진 ${tn} 신경전, ${slW(a.name)} ${b.name} 언성 높여`],a.id),`${slW(a.name)} ${slI(b.name)} 훈련 도중 언성을 높였습니다. 동료들이 말려 자리는 정리됐지만 둘 사이 앙금은 남았다는 평가입니다.`,-1); }
function slFeudFade(s,why){ const a=slP(s.p[0]), b=slP(s.p[1]); if(a&&b&&s.st!=='rumor')story(a,`${slW(b.name)}의 신경전이 잠잠해짐`,'sl'); slEnd(s,why||'fade'); }
EVH.slFeud={ pick(e,i){ const s=G.sl&&G.sl.act.find(x=>x.id===e.data.sid); if(!s)return '신경전이 이미 정리됐습니다.'; return slFeudAct(s,e.data.ks[i],true); } };
EV_NAME.slFeud='선수 간 신경전'; EV_NAME.slFam='선수 경사';
/* ---- 선수 화면 한 줄(숫자 없이) ---- */
function slLine(s,p){ const o=s.p.find(id=>id!==p.id), q=o!=null?slP(o):null; const qn=q?q.name:'';
  switch(s.k){ case 'mentor': return p.id===s.p[0]?`후배 ${slL(qn)} 이끄는 중`:`${qn} 선배에게 배우는 중`;
    case 'feud': return s.st==='clash'?`${slW(qn)} 갈등이 깊어짐`:s.st==='cool'||s.st==='quiet'?`${slW(qn)} 신경전이 가라앉는 중`:`${slW(qn)} 주전 경쟁 신경전`;
    case 'cb': return s.st==='back'?'부상 복귀 뒤 감각을 되찾는 중':s.st==='wait'?'재활을 마치고 복귀를 기다리는 중':s.st==='late'?'재활 막바지':'긴 재활 중';
    case 'cy': return s.st==='hot'?'FA를 앞두고 맹활약 중':s.st==='cold'?'FA를 앞두고 고전 중':'FA를 앞둔 시즌';
    case 'fam': return s.st==='wed'?'최근 결혼':'최근 아빠가 됨';
    case 'rk': return s.st==='race'?'신인왕 레이스 한가운데':'신인 돌풍';
    case 'rev': return `친정 ${tshort(s.x.f)} 상대를 벼르는 중`;
    case 'home': return '고향 팀에서 새 출발';
    case 'deb': return '늦깎이 1군 데뷔'; }
  return SL_T[s.k]?SL_T[s.k].l:''; }
function slLines(p){ if(!p||!G.sl)return []; return slOf(p.id).map(s=>({k:s.k,l:SL_T[s.k].l,t:slLine(s,p)})).filter(x=>x.t); }
const slEsc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function slCard(p){ const L=slLines(p); if(!L.length)return ''; return `<section class="card pf-fm-box pf-story"><h3>진행 중인 이야기</h3>${L.map(x=>`<div class="pf-st"><span>${slEsc(x.l)}</span><p>${slEsc(x.t)}</p></div>`).join('')}</section>`; }
