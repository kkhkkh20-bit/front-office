/* ===== 팀 분위기(더그아웃)와 선수 기분 이유(사용자 11-14: "팀 분위기 좋고", "선수 사기 목록은 FM에도 있는데 넣어주고") =====
 모든 구단이 같은 식이다(AI도 같다). 숫자는 화면에 나오지 않고 말(아주 좋음·좋음·보통·어수선함·험악함)로만 보인다.
 팀 분위기 목표값 = 50 + 아래 몫(매주 다시 보고, 실제 값은 목표 쪽으로 25%씩 천천히 옮겨 간다)
  - 리더: 주장·고참 리더(teamLeaders)의 프로의식·충성심·연차·기분. 좋은 고참이 있으면 오르고, 불만 가득한 고참이면 내려간다
  - 말썽: 예민하고 자기 관리가 안 되는 주축, 기분이 바닥인 스타, 훈련 거부 중인 선수. 프로의식 강한 주장은 반쯤 눌러 준다
  - 성적: 시즌 승률과 최근 5경기 연승·연패(작게)
  - 선수단 변화: 45일 안에 새로 온 선수가 많으면(시즌 3명, 비시즌 5명 넘게) 어색해진다
  - 감독·기강: 감독 공석·대행, 기강(climateOf)이 알맞음/느슨함/너무 엄격함
  - 출전 불만: 쌓인 불만(grvHeat)이 큰 선수
  - 선수들 기분: 주축 선수 기분 평균(작게)
 효과(작게): 매주 그 구단 선수 기분이 최대 ±0.5(비시즌 절반). 기분이 평소로 돌아오는 힘(moraleWeek)과 맞물려 오래 이어지면 기분 몇 점 차이가 난다.
 AI 단장은 트레이드 값(tval)에서 분위기를 잡아 주는 고참 리더를 조금 더 아끼고, 말썽 선수는 조금 덜 쳐준다(chemTradeMul). 사람 단장은 화면의 팀 분위기·리더 표시로 같은 정보를 본다.
 기분 이유 목록: 매주 실제로 더한 몫(p.morP)과 기분을 움직인 일(p.morL: 면담·결정·연봉·부상·대표팀 등, 실제 변화량을 잰다)만 보여 준다. 없는 요인은 보이지 않는다 */
const CHEM_B=[[72,'아주 좋음','good','아주 좋습니다'],[58,'좋음','good','좋습니다'],[42,'보통','','보통입니다'],[28,'어수선함','warn','어수선합니다'],[-1e9,'험악함','bad','험악합니다']];
const chemBand=v=>CHEM_B.findIndex(x=>v>=x[0]);
const chemWord=v=>CHEM_B[chemBand(v)][1];
const chemCls=v=>CHEM_B[chemBand(v)][2];
const chemPred=v=>CHEM_B[chemBand(v)][3];
const chR1=x=>Math.round(x*10)/10;
function chemCalc(tid){ const t=team(tid), f={}; if(!t)return {T:50,f}; const per=period(), live=per==='season'||per==='post';
  const L=playersOf(tid).filter(p=>!p.ys&&!(p.joinY>G.year)); if(!L.length)return {T:50,f};
  let reg=new Set(); try{ const d=depth(tid); reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); }catch(e){}
  const core=L.filter(p=>reg.has(p.id)||p.e1||ovr(p)>=55);
  let ld=[]; try{ ld=teamLeaders(tid); }catch(e){}
  let a=0; ld.forEach((p,i)=>{ initPers(p); let n=0; try{ n=teamTenure(p,tid).n; }catch(e){} a+=((p.pers.pro-11)*.35+(p.pers.loy-10)*.15+Math.min(n,8)*.15+((p.mor??60)-60)/8)*(i===0?1:.6); });
  f.lead=chR1(clamp(a,-7,7));
  const cap=ld[0]||null, damp=cap&&cap.pers&&cap.pers.pro>=14&&(cap.mor??60)>=45?.6:1; const tr=[];
  for(const p of core){ initPers(p); let x=0; if(p.boy>G.day)x=4; else { if(p.pers.temp>=14&&p.pers.pro<=8)x+=1.5; if(ovr(p)>=55&&(p.mor??60)<35)x+=2; } if(x)tr.push([p.id,x]); }
  tr.sort((x,y)=>y[1]-x[1]); f.trb=-chR1(clamp(sum(tr.map(x=>x[1]))*damp,0,12)); if(tr.length)f.trbP=tr.slice(0,2).map(x=>x[0]);
  if(live&&G.sea&&G.sea.rec){ const r=G.sea.rec[tid], g=r?r.w+r.l:0; let x=g>=10?(r.w/g-.5)*18:0; const l5=(((G.sea.tl)||[])[tid]||[]).slice(-5); if(l5.length===5){ if(l5.every(z=>z[0]>0))x+=1.5; else if(l5.every(z=>z[0]<0))x-=1.5; } f.res=chR1(clamp(x,-5,5)); }
  const nw=L.filter(p=>p.mvD!=null&&G.day-p.mvD<=45).length; f.chn=-chR1(clamp((nw-(live?3:5))*.8,0,6));
  const m=G.mgr&&G.mgr[tid]; if(!m||m.interim)f.mgr=-2; else { let b='ok'; try{ b=climateOf(tid).band; }catch(e){} f.mgr={good:2.5,ok:0,loose:-3,rigid:-2}[b]||0; f.cl=b; }
  let ds=0; for(const p of L){ const h=p.grv?grvHeat(p):0; ds+=h>=12?2:h>=6?1:0; } f.dsp=-clamp(ds,0,5);
  const M=core.length?sum(core.map(p=>p.mor??60))/core.length:60; f.mood=chR1(clamp((M-65)*.15,-3,3)); /* 리그 평균 기분(65 안팎)을 기준으로 */
  const T=clamp(50+f.lead+f.trb+(f.res||0)+f.chn+f.mgr+f.dsp+f.mood,5,95); return {T:chR1(T),f}; }
/* 화면·판단용: 저장된 값이 없으면(옛 저장·창단 직후) 지금 목표값으로 시작한다. 난수를 쓰지 않는다 */
function clubChem(tid){ const C=G.chem=G.chem||{}; let c=C[tid]; if(!c||c.v==null){ const x=chemCalc(tid); c=C[tid]={v:x.T,T:x.T,f:x.f,d:G.day,wb:chemBand(x.T)}; } return c; }
/* 분위기가 선수 기분에 주는 몫(한 주): 비시즌 절반 */
function chemMoodD(tid){ const c=clubChem(tid), live=period()==='season'||period()==='post'; return clamp((c.v-50)/50,-1,1)*.5*(live?1:.5); }
function chemWeek(){ if(!G||!G.teams)return; for(const t of G.teams){ const x=chemCalc(t.id), c=clubChem(t.id), b0=chemBand(c.v); c.v=chR1(c.v+(x.T-c.v)*.25); c.T=x.T; c.f=x.f; c.d=G.day;
    const d=chemMoodD(t.id); for(const p of playersOf(t.id)){ if(p.morL&&p.morL.some(x=>G.day-x[0]>MOR_KEEP)){ p.morL=p.morL.filter(x=>G.day-x[0]<=MOR_KEEP); if(!p.morL.length)delete p.morL; } if(Math.abs(d)<.05||p.ys||p.mor==null)continue; p.mor=clamp(p.mor+d,0,100); (p.morP=p.morP||{}).chem=Math.round(d*100)/100; }
    chemNews(t.id,c,b0); } }
/* 분위기가 크게 바뀌면 가끔 알린다: 우리 구단은 마지막으로 알린 단계에서 두 칸 움직이거나 양 끝에 닿을 때(35일에 한 번까지), 다른 구단은 양 끝에 닿을 때만 소식 한 줄(120일에 한 번까지) */
function chemNews(tid,c,b0){ const b=chemBand(c.v); if(c.wb==null)c.wb=b0; if(b===b0||b===c.wb)return; const me=tid===G.user&&!G.unemp, edge=b===0||b===4;
  if(me){ if(!(edge||Math.abs(b-c.wb)>=2)||G.day-(c.md??-999)<35)return; c.md=G.day; c.wb=b; const top=chemWhy(tid,true)[0];
    mail('선수단',`팀 분위기: ${CHEM_B[b][1]}`,`더그아웃 분위기가 ${CHEM_B[b][3]}.${top?` ${top.t}.`:''}\n\n분위기는 선수 기분에 조금씩 영향을 줍니다. 자세한 이유는 스태프·육성 > 리더십에서 볼 수 있습니다.`,{kind:'선수'}); return; }
  if(!edge||G.day-(c.md??-999)<120)return; c.md=G.day; c.wb=b; try{ wire('구단',b===4?`${tshort(tid)} 더그아웃 분위기가 험악하다는 소문`:`${tshort(tid)} 더그아웃 분위기가 최고라는 평`,{tid}); }catch(e){} }
/* 분위기 이유를 말로(크기 순). me=true면 우리 구단: 이름까지 */
function chemWhy(tid,me){ const c=clubChem(tid), f=c.f||{}, L=[]; const add=(k,v,good,bad)=>{ if(Math.abs(v||0)>=1)L.push({k,v,t:v>0?good:bad}); };
  add('lead',f.lead,'주장·고참이 선수단을 잘 잡아 줍니다','고참들이 중심을 잡지 못합니다');
  if(f.trb<=-1){ const nm=me&&(f.trbP||[]).map(id=>G.players[id]).filter(p=>p&&p.team===tid).map(p=>p.name); L.push({k:'trb',v:f.trb,t:`분위기를 흐리는 선수가 있습니다${nm&&nm.length?`(${nm.join(', ')})`:''}`}); }
  add('res',f.res,'최근 성적이 좋습니다','최근 성적이 나쁩니다');
  if(f.chn<=-1)L.push({k:'chn',v:f.chn,t:'새 얼굴이 많아 아직 어색합니다'});
  if(f.mgr)L.push({k:'mgr',v:f.mgr,t:f.cl==null?'감독 자리가 비어 있습니다':f.cl==='good'?'기강이 알맞습니다':f.cl==='loose'?'기강이 느슨합니다':'기강이 너무 엄격합니다'});
  if(f.dsp<=-1)L.push({k:'dsp',v:f.dsp,t:'출전 시간 불만이 쌓여 있습니다'});
  add('mood',f.mood,'주축 선수들 기분이 좋습니다','주축 선수들 기분이 처져 있습니다');
  return L.sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)); }
/* 이 구단에서 분위기를 잡아 주는 선수인가(트레이드 판단·화면 표시용) */
function chemLeader(p){ if(!p||p.team==null)return false; let L=[]; try{ L=teamLeaders(p.team); }catch(e){} if(!L.includes(p))return false; initPers(p); return p.pers.pro>=12&&(p.mor??60)>=45; }
function chemTrouble(p){ if(!p||!p.pers)return false; return p.boy>G.day||(p.pers.temp>=14&&p.pers.pro<=7); }
/* AI 단장 트레이드 값: 분위기를 잡는 리더는 내줄 때 조금 더 받고, 말썽 선수는 데려올 때 조금 덜 쳐준다(사람 단장이 화면을 보고 하는 판단과 같은 크기) */
function chemTradeMul(t,p,dir){ if(!p||!t)return 1; if(dir==='out'&&p.team===t.id&&chemLeader(p))return (team(t.id).cap===p.id?1.08:1.05);
  if(dir==='in'&&chemTrouble(p))return .95; return 1; }

/* ===== 기분 일지: 기분을 움직인 일을 실제 변화량으로 남긴다 =====
 p.morL=[[날, 종류, 변화량, 이름표]] 최근 5주, 최대 8개. 같은 주 같은 종류는 합친다.
 기존 함수(면담·결정·연봉·부상·대표팀…)를 고치지 않고 감싸서, 부르기 전후 기분 차이를 잰다(겹쳐 부르면 바깥 것만 잰다) */
const MOR_KEEP=35;
const MOR_WK=new Set(['clim','dorm','pdw']); /* 매주 되풀이되는 몫: 일지에 쌓지 않고 지난주 값만(p.morW) */
function morLog(p,k,v,lab){ if(!p||!(Math.abs(v)>=.05))return; if(MOR_WK.has(k)){ const W=p.morW=p.morW||{}, w=W[k]; if(w&&Math.floor(w[0]/7)===Math.floor(G.day/7))w[1]=chR1(w[1]+v); else W[k]=[G.day,chR1(v)]; return; } const L=p.morL=(p.morL||[]).filter(x=>G.day-x[0]<=MOR_KEEP); const wk=Math.floor(G.day/7);
  const x=L.find(y=>y[1]===k&&(y[3]||'')===(lab||'')&&Math.floor(y[0]/7)===wk); if(x){ x[2]=chR1(x[2]+v); x[0]=G.day; if(!x[2])L.splice(L.indexOf(x),1); }
  else { L.unshift(lab?[G.day,k,chR1(v),lab]:[G.day,k,chR1(v)]); if(L.length>8)L.length=8; } if(!L.length)delete p.morL; }
const _mtS=[]; /* 겹쳐 부를 때: 안쪽 함수가 잰 몫은 바깥 함수 기준값에 더해 두 번 세지 않는다 */
function morSnap(list){ const S=new Map(); if(list){ for(const p of list)if(p&&p.mor!=null)S.set(p,p.mor); return S; } for(const id in G.players){ const p=G.players[id]; if(p.team!=null&&p.mor!=null)S.set(p,p.mor); } return S; }
function morTrack(fn,key,scope){ if(typeof fn!=='function'||fn._mt)return fn;
  const w=function(...a){ if(typeof G==='undefined'||!G||!G.players)return fn.apply(this,a); let S=null,k=null; try{ k=typeof key==='function'?key(a):key; if(k)S=morSnap(scope?scope(a):null); }catch(e){ S=null; }
    if(!S)return fn.apply(this,a); _mtS.push(S); try{ return fn.apply(this,a); } finally{ _mtS.pop(); try{ const [kk,lab]=Array.isArray(k)?k:[k]; for(const [p,m0] of S){ const d=(p.mor??m0)-m0; if(!(Math.abs(d)>=.05))continue; morLog(p,kk,d,lab); for(const O of _mtS)if(O.has(p))O.set(p,O.get(p)+d); } }catch(e){} } };
  w._mt=1; return w; }
/* 감싸는 곳: 하루·한 주에 여러 번 불리지 않는 입구만(경기 중 타석마다 불리는 함수는 감싸지 않는다) */
talk=morTrack(talk,a=>'talk:'+a[1],a=>[G.players[a[0]]]);
listPlayer=morTrack(listPlayer,'list',a=>[G.players[a[0]]]);
keepPlayer=morTrack(keepPlayer,'keep',a=>[G.players[a[0]]]);
evPick=morTrack(evPick,a=>{ const e=(G.evs||[]).find(x=>x.id===a[0]); return e&&!e.done?['ev',String(e.title||'').slice(0,40)]:null; });
ivAnswer=morTrack(ivAnswer,'iv');
injure=morTrack(injure,'inj',a=>[a[0]]);
salOffer=morTrack(salOffer,'sal'); salArbDecide=morTrack(salArbDecide,'sal'); arbLeftDecide=morTrack(arbLeftDecide,'sal'); salTalkClose=morTrack(salTalkClose,'sal'); holdMid=morTrack(holdMid,'sal');
holdDaily=morTrack(holdDaily,'hold'); hireMgr=morTrack(hireMgr,'mgr'); fireMgr=morTrack(fireMgr,'mgr'); ntAnnounce=morTrack(ntAnnounce,'nt'); ntRefuse=morTrack(ntRefuse,'nt'); ntResult=morTrack(ntResult,'nt');
champCelebrate=morTrack(champCelebrate,'champ'); posReqAnswer=morTrack(posReqAnswer,'pos'); rolePromCheck=morTrack(rolePromCheck,'role'); mgrUseAsk=morTrack(mgrUseAsk,'use'); mgrPosAsk=morTrack(mgrPosAsk,'use');
mpickPlan=morTrack(mpickPlan,'mpick'); aiMpickPlan=morTrack(aiMpickPlan,'mpick'); aiMentorPick=morTrack(aiMentorPick,'mentor'); churnCheck=morTrack(churnCheck,'churn'); proposeTrade=morTrack(proposeTrade,'rumor');
climateWeek=morTrack(climateWeek,'clim'); pdWeek=morTrack(pdWeek,'pdw'); fDramaUser=morTrack(fDramaUser,'fdr'); fDramaAI=morTrack(fDramaAI,'fdr'); seasonTitles=morTrack(seasonTitles,'title'); aiPreFA=morTrack(aiPreFA,'ext');
postingSeason=morTrack(postingSeason,'abroad'); mlbHype=morTrack(mlbHype,'abroad'); facWeek=morTrack(facWeek,'dorm'); mreqCloseOld=morTrack(mreqCloseOld,'mreq');

/* ===== 기분 이유 목록(FM '행복도'처럼): 한 줄에 한 가지, 방향(좋게/나쁘게)과 크기(크게/조금)만 =====
 매주 몫(p.morP)은 지난주에 실제로 더한 값, 일지(p.morL)는 실제로 움직인 양. 크기: 매주 몫 2 이상·일 5 이상이면 '크게' */
const MOR_EV={'talk:praise':['칭찬 면담이 힘이 됐습니다','칭찬이 빈말처럼 들렸습니다'],'talk:push':['분발 촉구에 자극을 받았습니다','분발 촉구 면담에 서운했습니다'],'talk:promise':['출전 기회를 건의해 줬습니다','출전 건의 면담이 실망스러웠습니다'],
  'talk:futreq':['2군 기용을 챙겨 줬습니다','2군 기용 이야기가 아쉬웠습니다'],'talk:contract':['계약 이야기를 나눴습니다','계약 이야기가 아쉬웠습니다'],'talk:ask':['단장이 고민을 들어 줬습니다','고민 상담이 아쉬웠습니다'],
  prom:['약속한 출전 기회를 받았습니다','출전 약속이 지켜지지 않았습니다'],list:['트레이드 요청을 들어줬습니다','트레이드 명단에 올랐습니다'],keep:['남아 달라는 설득에 마음을 돌렸습니다','남으라는 설득이 마음에 안 듭니다'],
  iv:['단장의 인터뷰 발언이 고마웠습니다','단장의 인터뷰 발언에 서운했습니다'],inj:['부상에서 돌아와 안도했습니다','부상으로 빠져 속상합니다'],sal:['연봉 협상 결과에 만족합니다','연봉 협상에 실망했습니다'],hold:['연봉 계약이 정리됐습니다','연봉 미계약이 길어져 답답합니다'],
  mgr:['새 감독 부임을 반깁니다','감독 교체로 마음이 어수선합니다'],nt:['국가대표 일로 기분이 좋습니다','국가대표 일로 실망했습니다'],champ:['우승의 기쁨이 남아 있습니다','우승 뒤 대우가 아쉽습니다'],pos:['포지션 요청을 들어줬습니다','포지션 요청이 거절됐습니다'],
  role:['계약 때 약속한 역할을 받았습니다','계약 때 약속한 역할을 받지 못했습니다'],use:['감독에게 기용을 건의해 줬습니다','기용 건의가 받아들여지지 않았습니다'],mpick:['감독이 밀어 주는 선수가 됐습니다','경쟁자가 감독의 신임을 받습니다'],mentor:['후배 멘토를 맡아 보람을 느낍니다','멘토 일이 부담스럽습니다'],
  churn:['선수단 이동이 정리됐습니다','잇단 트레이드로 어수선합니다'],rumor:['트레이드 소문이 가라앉았습니다','트레이드 소문에 흔들립니다'],clim:['선수단 기강이 알맞습니다','선수단 기강이 너무 엄격합니다'],pdw:['구단이 불만을 달래 줬습니다','동료의 불만이 번지고 있습니다'],
  fdr:['구단이 사정을 챙겨 줬습니다','한국 생활과 팀 적응이 힘듭니다'],title:['개인 타이틀을 받았습니다','개인 타이틀을 놓쳤습니다'],ext:['다년계약으로 마음이 놓입니다','계약 문제로 마음이 쓰입니다'],abroad:['해외 진출 기대가 커졌습니다','해외 진출이 막혀 실망했습니다'],
  dorm:['숙소 생활이 편합니다','숙소 생활이 불편합니다'],mreq:['감독 요청이 정리됐습니다','감독 요청 건으로 마음이 쓰입니다'],ev:['구단 결정이 마음에 듭니다','구단 결정에 서운합니다']};
function moraleList(p){ if(!p||p.team==null)return []; const P=p.morP||{}, out=[]; const add=(k,t,v,wk,o)=>out.push({k,t,v:chR1(v||0),big:Math.abs(v||0)>=(wk?2:5),...(o||{})});
  if(p.promise&&p.promise.until>=G.day)add('wait','출전 기회 약속을 기다리고 있습니다',0,1,{wait:true});
  if(P.pt){ let r=''; try{ r=squadRole(p); }catch(e){} add('pt',P.pt>0?`${r||'지금'} 역할에 만족합니다`:P.pt<=-2?'주전으로 뛰지 못해 답답합니다':'1군 기회가 더 필요합니다',P.pt,1); }
  if(P.res)add('res',P.res>0?'팀 성적이 좋아 즐겁습니다':'팀 성적이 나빠 마음이 무겁습니다',P.res,1);
  if(P.chem){ const v=clubChem(p.team).v; if(chemBand(v)!==2)add('chem',`팀 분위기가 ${chemPred(v)}`,P.chem,1); }
  if(P.cap){ let c=null; try{ c=captainOf(p.team); }catch(e){} add('cap',c===p?'주장으로서 책임감을 느낍니다':`주장${c?' '+c.name+'이(가)':'이'} 선수단을 잘 이끕니다`,P.cap,1); }
  if(Math.abs(P.hc||0)>=.15)add('hc',P.hc>0?'수석코치와 말이 잘 통합니다':'수석코치와 말이 잘 안 통합니다',P.hc,1); else if(P.hc&&P.hc<0&&!(G.coach&&coachesOf(p.team).hc))add('hc','기댈 수석코치가 없습니다',P.hc,1);
  for(const k in p.morW||{}){ const [d,v]=p.morW[k]; if(G.day-d<=8&&Math.abs(v)>=.05)add(k,MOR_EV[k][v>0?0:1],v,1); }
  const J=new Map(); for(const [d,k,v,lab] of p.morL||[]){ if(G.day-d>MOR_KEEP)continue; const id=k+'|'+(lab||''), x=J.get(id); if(x)x.v+=v; else J.set(id,{d,k,v,lab}); } /* 몇 주에 걸친 같은 일은 한 줄로 */
  for(const {d,k,v,lab} of J.values()){ if(!(Math.abs(v)>=.05))continue; const E=MOR_EV[k]||MOR_EV.ev; let t=v>0?E[0]:E[1]; if(k==='ev'&&lab)t=`‘${lab.length>22?lab.slice(0,21)+'…':lab}’ 결정${v>0?'이 마음에 듭니다':'에 서운합니다'}`; add(k,t,v,0,{d}); }
  const g=p.grv&&grvTop(p); if(g&&p.grv[g]>=4)add('grv',`쌓인 불만: ${GRV_L[g]}`,0,0,{grv:true});
  return out.sort((a,b)=>(b.wait?1:0)-(a.wait?1:0)||(b.grv?0:1)-(a.grv?0:1)||Math.abs(b.v)-Math.abs(a.v)).slice(0,8); }
/* 다른 구단 선수: 스카우트가 들을 수 있는 것만(출전 상황·팀 성적·팀 분위기·공개된 일), 세 줄까지, '~라는 이야기' */
function moraleScout(p){ if(!p||p.team==null||p.team===G.user)return []; let sc=null; try{ sc=coverOf(p.team).sc; }catch(e){} if(!sc)return [];
  const P=p.morP||{}, out=[]; const add=(t,v)=>out.push({t,v:v>0?1:-1});
  if(P.pt&&P.pt<0)add('주전 경쟁에서 밀려 답답해한다는 이야기',-1); else if(P.pt>0&&ovr(p)>=55)add('지금 역할에 만족한다는 이야기',1);
  if(p.pd&&p.pd.st>=1)add(p.boy>G.day?'훈련을 거부하고 있다는 이야기':'구단에 불만을 드러냈다는 이야기',-1);
  if(P.chem){ const b=chemBand(clubChem(p.team).v); if(b<=1)add('팀 분위기가 좋다는 이야기',1); else if(b>=3)add('더그아웃이 어수선하다는 이야기',-1); }
  if(P.res)add(P.res>0?'팀이 잘나가 분위기가 밝다는 이야기':'팀 성적 때문에 분위기가 무겁다는 이야기',P.res);
  for(const [d,k,v] of p.morL||[]){ if(G.day-d>21)continue; if(k==='inj'&&v<0)add('부상으로 속상해한다는 이야기',-1); else if(k==='nt')add(v>0?'대표팀 일로 들떠 있다는 이야기':'대표팀 일로 실망했다는 이야기',v); else if(k==='sal'&&v<0)add('연봉 협상에 실망했다는 이야기',-1); }
  const seen=new Set(); return out.filter(x=>!seen.has(x.t)&&seen.add(x.t)).slice(0,3); }
