/* ===== 선수도 인격체(사용자 11-12: "다 착하고 합리적이면 안 된다", "단장·감독·선수·코치·구단주 다 다른 인격체") =====
   선수는 자기 동기(출전·콜업·약속·체면·연봉)로 움직이고, 겪은 일을 기억한다(p.grv: 불만 종류별 누적, 매주 조금씩 잊음).
   불만이 성격(야망·다혈질·충성·프로의식, 에이전트 유무)만큼 끓어오르면 스스로 움직인다:
     1단계 언론 플레이(측근·SNS·인터뷰 보도) → 2단계 공식 트레이드 요구 → 3단계 시위(훈련 불참·1군 이탈).
   단장이 무엇을 고르든 선수·감독·구단주·팬이 각자 반응한다. 감독은 성향에 따라 선수 편을 들거나 구단 편을 든다.
   다른 구단 선수도 같은 규칙: AI 단장은 핵심 선수면 달래거나 제값에, 아니면 싸게 매물로 내놓는다.
   주장·프로의식이 강한 고참은 불만이 번지는 것을 막고, 불만 가득한 주장은 오히려 선수단을 흔든다.
   2군 선수도 1군을 원한다(playerWantsUp): 오래 묵히면 불만이 쌓이고, 감독 면담 안건(다른 작업)에서 이 목록을 쓴다. */
const GRV_L={pt:'출전 기회',up:'1군 콜업',prom:'지켜지지 않은 약속',demo:'2군 강등',crit:'공개 비판',sal:'연봉'};
function grvOf(p){ return p.grv||(p.grv={}); }
function grvAdd(p,k,v){ if(!p||!GRV_L[k])return; const g=grvOf(p); g[k]=clamp(Math.round(((g[k]||0)+v)*10)/10,0,30); if(v>=2){ (p.grvL=p.grvL||[]).unshift({d:G.day,k,v:Math.round(v*10)/10}); if(p.grvL.length>8)p.grvL.length=8; } }
function grvCut(p,f,k){ const g=p.grv; if(!g)return; for(const x in g)if(!k||x===k)g[x]=Math.round(g[x]*f*10)/10; }
/* 성격이 불만을 키운다: 야망·다혈질은 키우고, 충성·프로의식은 누른다. 에이전트가 있으면 조금 더 시끄럽다 */
function grvHeat(p){ if(!p||!p.grv)return 0; initPers(p); const s=sum(Object.values(p.grv)); const P=p.pers; let agt=false; try{ agt=hasAgent(p); }catch(e){}
  const k=1+(P.amb-10)*.06+(P.temp-10)*.05-(P.loy-10)*.05-(P.pro-10)*.03+(agt?.1:0); return Math.round(s*clamp(k,.4,1.8)*10)/10; }
function grvTop(p){ const g=p.grv||{}; let b=null; for(const k in g)if(g[k]>0&&(!b||g[k]>g[b]))b=k; return b; }
/* 2군에서 1군을 원하는 선수(팀 공통 규칙): 2군에서 잘하고, 1군 같은 자리와 견줄 만하고, 욕심이 있거나 나이가 찼거나 1군에서 뛰던 선수 */
function wantUp(p){ if(!p||p.team==null||p.e1||p.prospect||p.ys||p.foreign||period()!=='season')return null; if(!healthy(p)||isAway(p)||(p.joinY>G.year)||(p.boy>G.day))return null; if(p.downDay!=null&&G.day-p.downDay<10)return null; initPers(p);
  const h=seasonTotal(p,G.year,'퓨처스'); const was=(()=>{ const a=seasonTotal(p,G.year-1,'1군'); return !!a&&(p.isP?(a.outs||0)>=150:(a.pa||0)>=250); })();
  const good=!!h&&(p.isP?(h.outs>=45&&pRate(h).era<=3.4):(h.pa>=50&&bRate(h).ops>=.8)); if(!good&&!(was&&h&&(p.isP?h.outs>=30:h.pa>=40)))return null;
  if(!(p.pers.amb>=11||p.age>=24||was))return null; let gap=0; try{ const sl=slotRanks(p.team)[pSlot(p)]; const worst=sl&&sl.ps&&sl.ps.length?Math.min(...sl.ps.map(q=>ovr(q))):0; gap=ovr(p)-worst; }catch(e){} if(gap<-5)return null;
  const t=h?(p.isP?`2군 ERA ${pRate(h).era.toFixed(2)}, ${ipStr(h.outs)}이닝`:`2군 OPS ${fmt3(bRate(h).ops)}, ${h.pa}타석`):'2군 기록 적음';
  return {t,gap:Math.round(gap*10)/10,why:was?'작년 1군 주축':p.age>=26?'나이가 찬 선수':'2군 성적'}; }
/* 면담 안건용: 1군을 원하는 2군 선수 목록(사유·기다린 주 수·불만 정도) */
function playerWantsUp(tid){ tid=tid??G.user; return playersOf(tid).map(p=>{ const w=wantUp(p); return w?{p,...w,weeks:p.upW||0,heat:grvHeat(p)}:null; }).filter(Boolean).sort((a,b)=>b.weeks-a.weeks||b.gap-a.gap); }
/* 감독은 성향대로 편을 든다: 규율·고집이 센 감독은 구단(자기) 편, 선수 친화형은 선수 편 */
function pdMgrSide(m){ if(!m||m.interim)return 0; try{ mgrAttr(m); }catch(e){} let sty=''; try{ sty=mgrTalkSty(m); }catch(e){} if(sty==='warm'||sty==='fun')return 1; if((m.disc||50)>=65||(m.ego||50)>=70||sty==='old'||sty==='fire')return -1; return 0; }
function pdCnt(tid){ const C=G.pdc=G.pdc||{}; const c=C[tid]; if(!c||c.y!==G.year)C[tid]={y:G.year,st:0,dm:0,bo:0}; return C[tid]; }
function pdCore(p){ try{ return isRegular(p)&&ovr(p)>=54; }catch(e){ return false; } }
const PD_SAY={
  pt:['"몸은 준비돼 있습니다. 그런데 기회가 오지 않습니다."','"벤치에서 시즌을 보낼 생각으로 계약한 건 아닙니다."','"뛸 수 있는 곳이라면 어디든 가고 싶다는 마음이 드는 건 사실입니다."'],
  up:['"2군에서 보여 줄 만큼 보여 줬다고 생각합니다. 이제 1군에서 증명하고 싶습니다."','"언제까지 기다려야 하는지 아무도 말해 주지 않습니다."'],
  prom:['"구단이 약속한 게 있었습니다. 지켜지지 않았습니다."','"말뿐이었다는 걸 알게 됐습니다."'],
  demo:['"왜 내려왔는지 설명을 들은 적이 없습니다."','"한 번 부진했다고 이렇게 되는 건 이해하기 어렵습니다."'],
  crit:['"공개적으로 그렇게 말씀하시는 건 선수로서 상처입니다."','"안에서 얘기하면 될 일을 밖에서 하셨습니다."'],
  sal:['"연봉 협상 과정에서 구단에 많이 실망했습니다."','"제 가치를 인정받지 못한다고 느낍니다."']};
const pdSay=(p,k)=>{ const L=PD_SAY[k]||PD_SAY.pt; return L[Math.floor(u01('pds'+G.day,p.id)*L.length)]; };
/* 매주: 기억 갱신과 단계 판단(모든 구단 같은 규칙) */
function pdWeek(){ if(G.gameOver)return; const per=period(); if(per!=='season'&&per!=='post')return;
  for(const t of G.teams){ let d=null; try{ d=depth(t.id); }catch(e){ continue; } const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); const cap=(()=>{ try{ return captainOf(t.id); }catch(e){ return null; } })();
    const capPro=cap&&cap.pers?cap.pers.pro:10, capHeat=cap?grvHeat(cap):0; const damp=cap&&capPro>=14&&capHeat<8?.5:1; /* 프로의식 강한 주장은 동요를 반으로 */
    const L=playersOf(t.id); let boy=null;
    for(const p of L){ if(p.ys||p.foreign&&p.foreign!=='용병'&&p.foreign!=='아시아')continue; initPers(p); grvCut(p,.88); const g=grvOf(p);
      if(per==='season'){ const r=reg.has(p.id); const star=ovr(p)>=55||p.sal>=500;
        if(r){ if(g.pt)g.pt=Math.max(0,g.pt-1.5); if(g.demo)g.demo=Math.max(0,g.demo-1); }
        else if(healthy(p)&&!isAway(p)&&!(p.joinY>G.year)){ if(star)grvAdd(p,'pt',1.8); else if(p.e1&&p.age>=26&&ovr(p)>=46&&p.pers.amb>=11)grvAdd(p,'pt',.6); }
        const w=wantUp(p); if(w){ p.upW=(p.upW||0)+1; if(p.upW>=3)grvAdd(p,'up',1+(p.upW>=6?.6:0)); if(t.id===G.user&&!G.unemp)pdUpVoice(p,w); } else if(p.e1&&p.upW){ p.upW=0; if(g.up)g.up=Math.round(g.up*.4*10)/10; }
        if(p._e1w&&!p.e1&&healthy(p)&&p.downDay!=null&&G.day-p.downDay<=7&&ovr(p)>=50&&!(p.boy>G.day))grvAdd(p,'demo',2.5+(star?1.5:0));
        p._e1w=!!p.e1; }
      if(p.boy>G.day)boy=p; }
    /* 번지는 불만: 시위 중인 선수, 불만 가득한 주장 */
    if(boy||capHeat>=12){ for(const q of L){ if(q===boy||q===cap||!q.pers||q.pers.amb<12)continue; q.mor=clamp((q.mor??60)-(boy?.7:.4)*damp,0,100); } }
    /* 2군 동요: 1군을 원하는데 오래 묵힌 선수가 있으면 2군 선수단 분위기도 처진다 */
    const longUp=L.filter(p=>!p.e1&&(p.upW||0)>=6).length; if(longUp)for(const q of L)if(!q.e1&&!q.ys&&q.pers&&q.pers.amb>=12&&!(q.upW>=6))q.mor=clamp((q.mor??60)-.3*Math.min(2,longUp)*damp,0,100);
    if(per==='season')pdEscalate(t,L); }
  pdBoyDaily(true); }
/* 단계 오르기: 언론 플레이(열기 10) → 트레이드 요구(열기 16, 발언 3주 뒤) → 시위(요구가 묵살되면) */
function pdEscalate(t,L){ const me=t.id===G.user&&!G.unemp; if(me&&!G.mgr[G.user])return; /* 야인일 때 옛 구단은 AI 규칙으로(코드 리뷰 11-13) */ const c=pdCnt(t.id);
  const C=L.filter(p=>!p.ys&&healthy(p)&&!(p.boy>G.day)&&!(p.joinY>G.year)).map(p=>({p,h:grvHeat(p)})).filter(x=>x.h>=10).sort((a,b)=>b.h-a.h);
  for(const {p,h} of C){ const D=p.pd||(p.pd={st:0,d:-999}); if(G.day-D.d<21)continue; if(p.listed||p.aiListed&&p.aiWhy==='mood')continue;
    if(D.st>=1&&h>=16&&G.day-D.d>=21&&c.dm<(me?2:1)){ if(me&&evOpen().some(e=>e.k==='pdem'||e.k==='pboy'))continue; c.dm++; D.st=2; D.d=G.day; pdDemand(p); return; }
    if(D.st===0&&c.st<(me?4:3)&&R()<.55){ if(me&&evOpen().some(e=>e.k==='pmed'||e.k==='pdem'||e.k==='pboy'))continue; c.st++; D.st=1; D.d=G.day; pdStatement(p); return; } } }
/* 1단계: 언론 플레이 */
function pdStatement(p){ const k=grvTop(p)||'pt', me=p.team===G.user, tn=tshort(p.team); initPers(p); let agt=false; try{ agt=hasAgent(p)&&p.pers.amb>=13&&R()<.4; }catch(e){}
  const via=agt?'에이전트 측':p.pers.temp>=14?'개인 SNS':'측근';
  const title=`${tn} ${p.name}, ${via==='개인 SNS'?'SNS에 의미심장한 글':`${via} 통해 ${GRV_L[k]} 불만`}`;
  news('선수',title,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) ${via}을(를) 통해 불만을 드러냈습니다. ${pdSay(p,k)} 구단 대응이 주목됩니다.`,me?-2:0,{ref:p.id,tid:p.team});
  if(!me){ pdAiReact(p,1); return; }
  const m=G.mgr[G.user], side=pdMgrSide(m); const mL=!m||m.interim?'':side<0?`\n\n${m.name} 감독은 "선수가 할 말이 있으면 안에서 하라"며 언짢아합니다.`:side>0?`\n\n${m.name} 감독은 "선수 마음도 이해한다"며 선수 쪽에 서는 분위기입니다.`:'';
  const O=[['talk','따로 불러 면담한다','성격·관계에 따라 풀릴 수도, 같은 말만 되풀이할 수도 있습니다.'],['rebut','구단 입장을 공개적으로 밝힌다','언론에는 단호해 보이지만 선수는 체면을 구깁니다. 기억에 남습니다.'],['disc','벌금 등 내부 징계','기강은 서지만 선수 불만이 커지고, 구단주 성향에 따라 반응이 다릅니다.'],['list','트레이드 명단에 올린다','선수는 누그러지지만 다른 구단이 약점으로 봅니다.'],['ignore','대응하지 않는다','시간이 해결할 수도, 더 큰 요구로 이어질 수도 있습니다.']];
  evNew('pmed',`${p.name}의 공개 불만`,`${title}.\n\n${pdSay(p,k)}\n\n${p.name}(${posLabel(p)}, ${p.age}세, ${squadRole(p)||'선수'}) · ${evLine(p)}${mL}`,O.map(o=>({l:o[1],fx:o[2]})),{ref:p.id,face:p.id,from:'홍보팀',data:{pid:p.id,ks:O.map(o=>o[0]),k,side},def:O.length-1,exp:4}); }
/* 단장 선택과 감독 편: 감독과 같은 편이면 관계 +, 반대면 - */
function pdMgrAgree(e,stance){ const m=G.mgr[G.user]; if(!m||m.interim||!e.data.side)return ''; const ok=e.data.side===stance; m.rel=clamp(m.rel+(ok?2:-2),0,100); return ok?` 감독 관계 +2(같은 편)`:` 감독 관계 -2(감독은 다른 생각)`; }
function pdTalkOk(p){ initPers(p); let fr=30; try{ fr=friendshipScore(p); }catch(e){} const cap=(()=>{ try{ return captainOf(p.team); }catch(e){ return null; } })(); const cb=cap&&cap!==p&&cap.pers&&cap.pers.pro>=14?.08:0;
  return clamp(.42+(p.pers.loy-10)*.03+(p.pers.pro-10)*.015-(p.pers.temp-10)*.02+(fr-30)/200+cb-(p.pd&&p.pd.talkN?p.pd.talkN*.12:0),.08,.85); } /* 같은 말로 거듭 달래면 덜 먹힌다 */
function ownReact(kind,star){ const t=team(G.user); const ow=t.owner; let d=0; if(kind==='disc')d=ow==='profit'?1:ow==='pr'?-1:star?-1:0; if(kind==='boyGive')d=ow==='win'?1:ow==='pr'?0:-1; if(!d)return ''; t.trust=clamp(t.trust+d,0,100); return ` 구단주 신뢰 ${d>0?'+':''}${d}`; }
EVH.pmed={ pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '이미 팀을 떠난 선수입니다.'; const k=e.data.ks[i]; const D=p.pd||(p.pd={st:1,d:G.day}); initPers(p); prInit();
    if(k==='talk'){ D.talkN=(D.talkN||0)+1; if(R()<pdTalkOk(p)){ grvCut(p,.45); p.mor=clamp(p.mor+5,0,100); D.st=0; return `${p.name}: "제 마음을 알아주셔서 감사합니다. 경기로 보여 드리겠습니다." (기분 +5, 불만 크게 줄어듦)${pdMgrAgree(e,1)}`; }
      p.mor=clamp(p.mor-2,0,100); return `${p.name}: "말씀은 알겠습니다. 그런데 달라지는 게 없으면 저도 생각이 있습니다." (기분 -2, 불만 그대로)`; }
    if(k==='rebut'){ grvAdd(p,'crit',4); p.mor=clamp(p.mor-8,0,100); G.pr.press=clamp(G.pr.press+1,0,100); news('구단',`${tshort(G.user)}, ${p.name} 발언에 "구단 방침은 변함없다"`,`구단이 ${p.name}의 공개 발언에 대해 공식 입장을 냈습니다. 선수와 구단의 온도 차가 드러났다는 평가입니다.`,0,{ref:p.id}); return `구단 입장을 밝혔습니다. ${p.name}은(는) 체면을 구겼다고 느낍니다. (기분 -8, 언론 +1)${pdMgrAgree(e,-1)}`; }
    if(k==='disc'){ const star=ovr(p)>=55; grvAdd(p,'crit',5); p.mor=clamp(p.mor-10,0,100); G.pr.fan=clamp(G.pr.fan+(star?-1:1),0,100); let n=0; for(const q of playersOf(G.user))if(q!==p&&q.pers&&q.pers.pro>=14){ q.mor=clamp((q.mor??60)+1,0,100); n++; } return `${p.name}에게 벌금을 물렸습니다. (기분 -10${n?`, 프로의식 강한 선수 ${n}명 기분 +1`:''}, 팬 ${star?'-1':'+1'})${ownReact('disc',star)}${pdMgrAgree(e,-1)}`; }
    if(k==='list'){ listPlayer(p.id); grvCut(p,.6); p.mor=clamp(p.mor+3,0,100); D.st=0; return `${p.name}을(를) 트레이드 명단에 올렸습니다. (기분 +3) 다른 구단은 급한 매물로 봅니다.`; }
    evFollow(10,'pmed',{pid:p.id,ev:e.id}); return `대응하지 않았습니다. ${p.name}의 다음 행동을 지켜봐야 합니다.`; },
  follow(d,tid){ if(G.unemp||tid!==G.user)return; const p=evP(d.pid); if(!p||p.team!==G.user)return; if(grvHeat(p)>=12&&R()<.5){ news('선수',`${p.name}, 계속되는 불만… "구단 대답이 없다"`,`${p.name}이(가) 구단이 아무 답을 주지 않는다며 재차 불만을 드러냈다는 소식입니다.`,-1,{ref:p.id}); grvAdd(p,'crit',1.5); evResult(d.ev,`${p.name}이(가) 다시 불만을 드러냈습니다.`); } else evResult(d.ev,`${p.name}은(는) 일단 말을 아끼고 있습니다.`); } };
/* 2단계: 공식 트레이드 요구 */
function pdDemand(p){ const me=p.team===G.user, k=grvTop(p)||'pt'; news('선수',`${tshort(p.team)} ${p.name}, 공식 트레이드 요구`,`${p.name}이(가) 구단에 트레이드를 공식 요청했습니다. ${pdSay(p,k)}`,me?-3:0,{ref:p.id,tid:p.team});
  if(!me){ pdAiReact(p,2); return; } pdIvAsk(p);
  const O=[['list','요구를 받아들여 트레이드를 추진한다','선수는 일단 돌아서지만 다른 구단은 급매로 봅니다.'],['promise','한 달 안에 출전을 보장하겠다고 약속한다','감독을 설득해야 합니다. 약속이 깨지면 시위로 번집니다.'],['talk','직접 만나 남으라고 설득한다','충성심·관계·주장의 영향에 따라 성패가 갈립니다.'],['disc','벌금·출장 정지로 다스린다','기강은 서지만 다혈질 선수는 더 크게 반발할 수 있습니다.'],['wait','못 들은 척 기다린다','열흘 뒤에도 불만이 크면 훈련에 나오지 않을 수 있습니다.']];
  evNew('pdem',`${p.name}의 트레이드 요구`,`${p.name}(${posLabel(p)}, ${p.age}세, ${squadRole(p)||'선수'})이(가) 에이전트를 통해 트레이드를 공식 요구했습니다.\n\n${pdSay(p,k)}\n\n쌓인 불만: ${pdGrvTxt(p)} · ${evLine(p)}`,O.map(o=>({l:o[1],fx:o[2]})),{ref:p.id,face:p.id,from:p.name,data:{pid:p.id,ks:O.map(o=>o[0])},def:O.length-1,exp:5}); }
function pdGrvTxt(p){ const g=p.grv||{}; return Object.keys(g).filter(k=>g[k]>=2).sort((a,b)=>g[b]-g[a]).map(k=>GRV_L[k]).join(', ')||'여러 가지'; }
EVH.pdem={ pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '이미 팀을 떠난 선수입니다.'; const k=e.data.ks[i]; const D=p.pd||(p.pd={st:2,d:G.day}); initPers(p); const m=G.mgr[G.user];
    if(k==='list'){ listPlayer(p.id); grvCut(p,.5); D.st=1; return `${p.name}: "결정해 주셔서 감사합니다. 떠나기 전까지 최선을 다하겠습니다." (트레이드 명단 등록)`; }
    if(k==='promise'){ p.promise=mkPromise(p,30); p.pdProm=true; grvCut(p,.7); p.mor=clamp(p.mor+3,0,100); if(m&&!m.interim)m.rel=clamp(m.rel-2,0,100); return `${p.name}: "한 달만 지켜보겠습니다." (기분 +3, 감독 관계 -2: 감독은 기용 간섭으로 받아들임)`; }
    if(k==='talk'){ D.talkN=(D.talkN||0)+1; if(R()<pdTalkOk(p)*.85){ grvCut(p,.5); p.mor=clamp(p.mor+4,0,100); D.st=1; return `${p.name}: "단장님 말씀을 믿어 보겠습니다. 요구는 거두겠습니다." (기분 +4)`; } p.mor=clamp(p.mor-4,0,100); evFollow(7,'pdem',{pid:p.id,ev:e.id}); return `${p.name}: "제 뜻은 변함없습니다." (기분 -4, 설득 실패)`; }
    if(k==='disc'){ const star=ovr(p)>=55; p.susp=Math.max(p.susp||0,G.day+5); grvAdd(p,'crit',6); p.mor=clamp(p.mor-12,0,100); let x=''; if(p.pers.temp>=14&&R()<.5){ evFollow(6,'pdem',{pid:p.id,ev:e.id,hot:1}); x=' 선수 측이 강하게 반발하고 있습니다.'; } return `${p.name}에게 벌금과 출장 정지 5일을 내렸습니다. (기분 -12)${ownReact('disc',star)}${x}`; }
    evFollow(10,'pdem',{pid:p.id,ev:e.id}); return `답을 미뤘습니다. ${p.name} 측은 구단의 침묵을 거절로 받아들입니다.`; },
  follow(d,tid){ if(G.unemp||tid!==G.user)return; const p=evP(d.pid); if(!p||p.team!==G.user||p.listed)return; if(d.hot||grvHeat(p)>=12){ pdBoycott(p); evResult(d.ev,`${p.name}이(가) 훈련에 나오지 않고 있습니다.`); } else evResult(d.ev,`${p.name}은(는) 불만을 안은 채 훈련하고 있습니다.`); } };
/* 3단계: 시위(훈련 불참). 1군에서 빠지고 훈련 효과가 없으며, 욕심 많은 동료들이 동요한다 */
function pdBoycott(p){ if(!p||p.team==null||p.boy>G.day)return; const c=pdCnt(p.team); if(c.bo>=1){ grvAdd(p,'crit',1); news('선수',`${tshort(p.team)} ${p.name}, 냉랭한 분위기 속 훈련`,`${p.name}이(가) 구단과 말을 섞지 않은 채 훈련만 하고 있다는 소식입니다.`,p.team===G.user?-1:0,{ref:p.id,tid:p.team}); return; } /* 시위는 한 구단에 한 해 한 번까지 */ c.bo++; const n=7+Math.floor(u01('boy'+G.day,p.id)*8); p.boy=G.day+n; if(p.e1){ p.e1=false; p.downDay=G.day; } (p.pd=p.pd||{}).st=3; p.pd.d=G.day; story(p,`${G.year} 트레이드 요구하며 훈련 불참`,'move');
  const me=p.team===G.user&&!G.unemp; news('선수',`${tshort(p.team)} ${p.name}, 훈련 불참… 트레이드 요구 시위`,`${p.name}이(가) 트레이드를 요구하며 훈련에 나오지 않고 있습니다. 구단과 선수의 갈등이 극으로 치닫고 있습니다.`,me?-4:0,{ref:p.id,tid:p.team});
  if(!me){ pdAiReact(p,3); return; }
  try{ G.pr.fan=clamp(G.pr.fan-1,0,100); }catch(e){} pdIvAsk(p);
  const O=[['give','요구를 들어준다(트레이드 명단, 즉시 복귀)','선수는 돌아오지만 구단이 끌려갔다는 말이 나옵니다.'],['promise','출전을 약속하고 복귀시킨다','약속이 또 깨지면 더 크게 터집니다.'],['hard','중징계(벌금, 시위 기간 무급)','기강은 서지만 선수와의 관계는 회복하기 어렵습니다.'],['wait','버틴다','시위가 끝날 때까지 선수단 분위기가 흔들립니다.']];
  evNew('pboy',`${p.name} 훈련 불참`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) 트레이드를 요구하며 ${n}일째까지 훈련에 나오지 않겠다고 통보했습니다. 시위 기간에는 1군에 등록할 수 없고 훈련 효과도 없습니다.\n\n쌓인 불만: ${pdGrvTxt(p)}`,O.map(o=>({l:o[1],fx:o[2]})),{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id,ks:O.map(o=>o[0])},def:O.length-1,exp:4}); }
EV_KEY.add('pdem'); EV_KEY.add('pboy');
EVH.pboy={ pick(e,i){ const p=evP(e.data.pid); if(!p||p.team!==G.user)return '이미 팀을 떠난 선수입니다.'; const k=e.data.ks[i]; initPers(p); const star=ovr(p)>=55;
    if(k==='give'){ p.boy=G.day; listPlayer(p.id); grvCut(p,.5); G.pr.press=clamp(G.pr.press-1,0,100); return `${p.name}이(가) 훈련에 복귀했습니다. 트레이드 명단에 올렸습니다. (언론 -1: 선수에게 끌려갔다는 평가)${ownReact('boyGive',star)}`; }
    if(k==='promise'){ p.boy=G.day; p.promise=mkPromise(p,30); p.pdProm=true; grvCut(p,.6); p.mor=clamp(p.mor+3,0,100); const m=G.mgr[G.user]; if(m&&!m.interim)m.rel=clamp(m.rel-2,0,100); return `${p.name}이(가) 복귀했습니다. 한 달 안에 출전 약속을 지켜야 합니다. (감독 관계 -2)`; }
    if(k==='hard'){ grvAdd(p,'crit',6); p.mor=clamp(p.mor-15,0,100); let n=0; for(const q of playersOf(G.user))if(q!==p&&q.pers&&q.pers.pro>=14){ q.mor=clamp((q.mor??60)+1,0,100); n++; } return `${p.name}에게 중징계를 내렸습니다. (기분 -15${n?`, 프로의식 강한 선수 ${n}명 기분 +1`:''})${ownReact('disc',star)}`; }
    return `버티기로 했습니다. 시위는 ${dmd(p.boy)}까지 이어질 수 있습니다.`; } };
/* 매일·매주: 시위가 끝나면 돌아온다(불만은 남는다) */
function pdBoyDaily(){ for(const p of Object.values(G.players)){ if(p.boy==null||p.boy>G.day)continue; delete p.boy; if(p.team===G.user&&!G.unemp)note('선수',`${p.name}이(가) 훈련에 복귀했습니다. 불만은 아직 남아 있습니다.`,p.id); } }
/* 다른 구단 선수: AI 단장은 핵심이면 달래거나 제값 매물, 아니면 싸게 정리한다 */
function pdAiReact(p,st){ const t=team(p.team); if(!t)return; const core=pdCore(p); let gmEye=50; try{ const ab=gmAbOf(t.id); if(ab)gmEye=ab.plan; }catch(e){}
  if(st===1){ if(core&&R()<.5){ grvCut(p,.6); p.mor=clamp((p.mor??60)+3,0,100); } return; }
  if(core&&st===2&&R()<.35+(gmEye-50)/200){ p.promise=mkPromise(p,30); grvCut(p,.6); news('구단',`${tshort(t.id)}, ${p.name} 달래기… "팀의 미래"`,`${tshort(t.id)} 구단이 ${p.name}에게 출전을 약속하며 잔류를 설득했다는 소식입니다.`,0,{ref:p.id,tid:t.id}); return; }
  if(hasNtc(p))return; p.aiListed=true; p.aiWhy='mood'; p.aiLd=G.day; p.aiUrg=!core; if(st===3)p.boy=Math.min(p.boy||G.day,G.day+3);
  wire('트레이드',`${tshort(t.id)}, 트레이드 요구한 ${p.name}을(를) 매물로 내놨다는 소식입니다.${core?' 핵심 선수라 제값을 원합니다.':' 서둘러 정리하려는 분위기입니다.'}`,{tid:t.id,ref:p.id}); }
/* 약속이 깨지면 기억한다: 트레이드 요구 뒤 받은 약속이면 바로 시위로 번진다 */
function pdPromBroken(p){ grvAdd(p,'prom',6); if(p.pdProm){ delete p.pdProm; if(p.team!=null&&period()==='season'&&healthy(p))pdBoycott(p); } }
function pdPromKept(p){ grvCut(p,.5); delete p.pdProm; }
/* 감독과 선수의 갈등: 감독이 부진한 스타를 공개 비판하거나 벤치에 앉힌다. 단장은 누구 편을 들지 정해야 한다 */
EVH.mpcf={ w:.5, check(){ if(G.unemp)return null; const m=G.mgr[G.user]; if(!m||m.interim||pdMgrSide(m)>0)return null; const L=playersOf(G.user).filter(p=>!p.foreign&&ovr(p)>=55&&healthy(p)&&!(p.boy>G.day)&&(p.mor??60)<55); const cold=L.filter(p=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=60&&pRate(h).era>=5.2):(h.pa>=80&&bRate(h).ops<.62)); }); return cold[0]||null; },
  make(p){ const m=G.mgr[G.user]; initPers(p); const pub=(m.ego||50)>=60; if(pub){ news('감독',`${m.name} 감독, ${p.name} 공개 질타 "이름값으로 야구하는 거 아니다"`,`${m.name} 감독이 경기 뒤 ${p.name}의 부진을 공개적으로 지적했습니다.`,-1,{ref:p.id}); grvAdd(p,'crit',3); }
    const O=[['mgr','감독 편에 선다','감독 관계가 오르고 선수 불만이 커집니다.'],['pl','선수 편에 선다','선수는 고마워하지만 감독은 권위가 흔들렸다고 느낍니다.'],['meet','셋이 함께 만난다','관계에 따라 둘 다 풀리거나, 둘 다 서운해합니다.'],['out','끼어들지 않는다','둘 사이 문제로 남고, 선수단이 지켜봅니다.']];
    evNew('mpcf',`${m.name} 감독과 ${p.name}의 갈등`,`${pub?`${m.name} 감독이 ${p.name}을(를) 공개적으로 비판했습니다.`:`${m.name} 감독이 ${p.name}을(를) 벤치에 앉히겠다고 합니다.`} ${p.name}은(는) 억울하다는 입장입니다.\n\n${evLine(p)}`,O.map(o=>({l:o[1],fx:o[2]})),{ref:p.id,face:p.id,from:'운영팀',data:{pid:p.id,ks:O.map(o=>o[0])},def:O.length-1,exp:4}); },
  pick(e,i){ const p=evP(e.data.pid); const m=G.mgr[G.user]; if(!p||p.team!==G.user||!m)return '상황이 바뀌었습니다.'; const k=e.data.ks[i]; initPers(p);
    if(k==='mgr'){ m.rel=clamp(m.rel+4,0,100); p.mor=clamp(p.mor-6,0,100); grvAdd(p,'crit',3); return `감독 관계 +4, ${p.name} 기분 -6. ${p.name}은(는) 단장도 자기 편이 아니라고 느낍니다.`; }
    if(k==='pl'){ m.rel=clamp(m.rel-5,0,100); p.mor=clamp(p.mor+6,0,100); grvCut(p,.7,'crit'); let x=''; if((m.ego||50)>=70&&R()<.5){ try{ prLeak('mgr',p,`${m.name} 감독, 프런트 개입에 불편한 기색`); }catch(err){} x=' 감독 쪽에서 불편한 얘기가 기사로 새어 나갔습니다.'; } return `${p.name} 기분 +6, 감독 관계 -5.${x}`; }
    if(k==='meet'){ const ok=R()<clamp(.35+(m.rel-50)/120+(p.pers.pro-10)*.03,.1,.8); if(ok){ m.rel=clamp(m.rel+2,0,100); p.mor=clamp(p.mor+4,0,100); grvCut(p,.6); return `셋이 오해를 풀었습니다. (감독 관계 +2, ${p.name} 기분 +4)`; } m.rel=clamp(m.rel-2,0,100); p.mor=clamp(p.mor-3,0,100); return `자리를 만들었지만 서로 말만 길어졌습니다. (감독 관계 -2, ${p.name} 기분 -3)`; }
    for(const q of playersOf(G.user))if(q!==p&&q.pers&&q.pers.amb>=13)q.mor=clamp((q.mor??60)-1,0,100); return `끼어들지 않았습니다. 선수단이 단장의 침묵을 지켜봤습니다. (욕심 많은 선수들 기분 -1)`; } };
/* 언론 질문(52_interviews ivBuild의 'pdrama'): 선수 불만·트레이드 요구·시위에 대해 묻는다 */
IV_TOPIC.pdrama='선수 갈등';
function pdIvQs(d){ const p=d.pid!=null?G.players[d.pid]:null; if(!p)return []; const nm=p.name; const st=(p.pd&&p.pd.st)||1; const m=G.mgr[G.user]; const mn=m&&!m.interim?m.name+' 감독':'감독';
  const L=[[st>=3?`${nm} 선수가 훈련에 나오지 않고 있습니다. 어떻게 하실 겁니까?`:st>=2?`${nm} 선수가 트레이드를 공식 요구했습니다. 받아들이실 겁니까?`:`${nm} 선수가 공개적으로 불만을 드러냈습니다. 구단 입장은 무엇입니까?`,[
      ['감싸기','"우리 선수입니다. 안에서 충분히 대화하겠습니다."',ivFx(1,1,{mor:[p.id,4]})],['원칙','"개인보다 팀이 먼저입니다. 구단 방침대로 갑니다."',ivFx(0,1,{mor:[p.id,-6],team:1})],['압박','"프로 선수라면 경기장에서 말해야 합니다."',ivFx(-1,0,{mor:[p.id,-9]})]]],
    [`${mn}은(는) 이 상황을 어떻게 보고 있습니까?`,[
      ['한목소리','"감독과 생각이 같습니다. 이견은 없습니다."',ivFx(0,1,{mgr:2})],['단장 몫','"선수단 정리는 프런트 몫입니다. 감독은 경기에 집중하면 됩니다."',ivFx(0,0,{mgr:-3})],['노코멘트','"내부 얘기는 밖에서 하지 않겠습니다."',ivFx(0,-1)]]]];
  return L.map(([q,opts])=>({q,opts:opts.map(([tone,t,fx])=>({tone,t:mySayTail(t,tone),fx}))})); }
/* 큰 사건이 터지면 기자가 묻는다 */
function pdIvAsk(p){ try{ if(p&&p.team===G.user&&!G.unemp)ivRequest('pdrama',{pid:p.id}); }catch(e){} }
/* 1군을 원하는 2군 선수의 목소리: 3주째 2군 감독 보고, 5주째 에이전트 전화(있으면), 8주째부터는 불만이 공개될 수 있다(pdEscalate) */
function pdUpVoice(p,w){ const n=p.upW; if(n===3)mail('2군 감독',`${p.name}, 1군 콜업을 기다리는 중`,`${p.name}(${posLabel(p)}, ${p.age}세)이(가) 3주째 1군 소식을 기다리고 있습니다. ${w.t}. ${w.why}이라 본인도 답답해합니다. 감독님께 콜업을 건의해 보시겠습니까?`,{kind:'선수',ref:p.id,face:p.id});
  else if(n===5){ let agt=false; try{ agt=hasAgent(p); }catch(e){} if(agt){ let nm='에이전트'; try{ nm=agentOf(p).name||nm; }catch(e){} mail('에이전트',`${p.name} 에이전트의 전화`,`${nm}: "${p.name} 선수가 2군에서 이만큼 하는데도 계속 묶여 있습니다. 구단 계획을 알고 싶습니다. 기회를 못 줄 거라면 다른 길도 생각해 주셨으면 합니다."`,{kind:'선수',ref:p.id,face:p.id}); } } }
