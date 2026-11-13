/* ===== 외국인 선수 현실화: KBO 적합도(숨김) · 적응 곡선 · 향수병·불화·태업·꾀병 (사용자 11-12) =====
   "용병이야말로 멘탈이 진짜 어렵다. 적응 문제, 불화, 돌아가겠다. 능력치 대비 부진도 많아야 한다. 태업도, 아프다고 하는 것도."
   - KBO 적합도(p.kfit, 능력 단위): 구종 구성·스트라이크존·변화구 대처처럼 능력치에 안 잡히는 한국 무대 궁합. 평균 -1.1, 폭이 넓다(최대 +3.5)(약 35~40%는 능력보다 확실히 부진, 20%는 기대 이상).
     스카우트·분석원이 좋으면 영입 전에 '전망'을 들을 수 있지만 오차가 남는다. 적응이 오를수록 부진 폭이 줄고, 시즌을 치르며 조금씩 배운다.
   - 적응(p.adapt): 매달 성격·기분·같은 나라 동료·사건에 따라 움직인다. 첫해 적응은 경기력에 들어간다(boostOf).
   - 사건: 선수마다 한 시즌 한 번까지, 우리 구단은 한 해 두 번까지. 다른 구단도 같은 규칙으로 겪고, AI 단장이 알아서 처리한 뒤 소식으로 나온다.
   외국인은 성격이 조금 더 예민하고 구단 충성심이 낮은 쪽으로 기운다(fPers). */
function fPers(p){ if(!p||!p.foreign||p.fPsk)return; initPers(p); p.pers.temp=clamp(p.pers.temp+ri(0,3),3,20); p.pers.loy=clamp(p.pers.loy-ri(0,3),3,20); p.fPsk=1; }
function fKfit(p){ if(!p||!p.foreign)return 0; if(p.kfit==null)p.kfit=Math.round(clamp(N(-1.1,3),-7,3.5)*10)/10; return p.kfit; }
/* 경기력 보정(능력 단위, boostOf에서 더한다): 적합도(적응이 높을수록 부진 폭 축소) + 태업 */
function fBoost(p){ if(!p||!p.foreign||p.team==null)return 0; let k=fKfit(p); const ad=p.adapt??50; if(k<0)k*=1-clamp((ad-50)/70,0,.5); if(p.fslk&&p.fslk.until>G.day)k+=p.fslk.b; return k*4; } /* boostOf 값은 능력치에 .35~.55만 실려서(기세용 단위) 4배로 넣는다: 적합도 -3이면 평균자책점 약 +0.9, -6이면 +1.8 안팎 */
/* 영입 전 전망(시장 후보): 우리 해외 스카우트·분석원 수준이 좋을수록 정확하다. 끝내 확신할 수는 없다 */
function fFitHint(p,sd){ if(!p||!p.foreign)return ''; const k=fKfit(p); const e=k+hn('kf'+G.year,p.id)*Math.max(1.4,(sd??7)*.45);
  return e>=1.5?'한국 무대 궁합: 구종·스타일이 KBO 타자(투수)에 잘 통할 것으로 봅니다. 확신은 어렵습니다.':e<=-2?'한국 무대 궁합: 우려가 있습니다. 능력치만큼 성적이 안 나올 수 있습니다.':'한국 무대 궁합: 뚜렷한 신호가 없습니다. 뛰어 봐야 압니다.'; }
/* 매달 1일: 적응 변화와 적합도 학습 */
function fAdaptMonthly(){ const per=period(); if(per!=='season'&&per!=='pre')return;
  for(const p of Object.values(G.players)){ if(!p.foreign||p.team==null||p.adapt==null)continue; fPers(p);
    const mates=foreignOf(p.team).filter(q=>q!==p&&q.orig&&q.orig===p.orig).length;
    let d=N(.8,1.6)+(p.pers.temp<=8?.6:p.pers.temp>=14?-.9:0)+(mates?.5:0)+clamp(((p.mor??60)-60)/25,-1.2,.6)-(p.fhome&&p.fhome>G.day?1.5:0);
    p.adapt=Math.round(clamp(p.adapt+d,15,85)); fKfit(p); if(p.kfit<0)p.kfit=Math.round((p.kfit+Math.min(.2,-p.kfit*.04)*(p.adapt/60))*10)/10; } }
/* ===== 사건 ===== */
const FD_T={home:'향수병',clash:'불화',slack:'태업 의혹',fake:'몸 상태 호소'};
function fOutOfRace(tid){ try{ const st=standingsNow(); const i=st.findIndex(x=>x.tid===tid); const r5=st[4]; const me=st[i]; if(!me||!r5||G.day<KD(7,1))return false; return ((r5.w-me.w)+(me.l-r5.l))/2>=8; }catch(e){ return false; } }
function fDramaRisk(p){ initPers(p); fPers(p); const ad=p.adapt??50; return .009+Math.max(0,50-ad)*.0006+Math.max(0,p.pers.temp-11)*.0012+Math.max(0,10-p.pers.loy)*.0006+Math.max(0,55-(p.mor??60))*.0006+(fOutOfRace(p.team)?.004:0); }
function fDramaType(p){ const ad=p.adapt??50, mor=p.mor??60, out=fOutOfRace(p.team);
  const W={home:(ad<45?3:1)+(G.day>KD(8,1)?.8:0),clash:(mor<55?2:.5)+(p.pers.temp>=13?1.5:0),slack:(mor<50?2:.4)+(out?2:0)+(p.sal>=800?.6:0),fake:(p.pers.pro<=8?2:.5)+(p.pers.temp>=13?.8:0)};
  let x=R()*sum(Object.values(W)); for(const k in W){ x-=W[k]; if(x<=0)return k; } return 'clash'; }
/* 매주(월요일) 리그 전체 외국인 선수 점검 */
function fDramaWeekly(){ if(period()!=='season')return; const y=G.year; G.fdN=G.fdN&&G.fdN.y===y?G.fdN:{y,u:0};
  for(const p of Object.values(G.players)){ if(!p.foreign||p.team==null||p.fdY===y||!healthy(p)||isAway(p))continue; if(R()>=fDramaRisk(p))continue;
    const me=p.team===G.user&&!G.unemp; if(me&&G.fdN.u>=2)continue; const k=fDramaType(p); p.fdY=y;
    if(k==='slack')p.fslk={until:G.day+28,b:-Math.round(rnd(1.5,3.5)*10)/10};
    if(k==='home')p.fhome=G.day+30;
    if(me){ G.fdN.u++; fDramaUser(p,k); } else fDramaAI(p,k); } }
/* 다른 구단: AI 단장이 성향대로 처리하고 소식으로 */
function fDramaAI(p,k){ const t=team(p.team), nm=p.name, tn=tshort(p.team); const bad=(()=>{ const h=seasonTotal(p,G.year,'1군'); return h&&(p.isP?(h.outs>=90&&pRate(h).era>4.8):(h.pa>=120&&bRate(h).ops<.72)); })();
  if(k==='home'){ if(bad&&R()<.5){ try{ releaseForeign(p.id); }catch(e){} wire('외국인',`${tn} 외국인 선수 ${nm}, 가족 문제로 시즌 중 귀국. 구단은 방출로 정리했습니다.`,{tid:t.id}); try{ aiForeignFill(t.id); }catch(e){} return; }
    p.fLeave=G.day+ri(7,10); p.adapt=clamp((p.adapt??50)+5,15,85); wire('외국인',`${tn} ${nm}, 향수병으로 짧은 귀국 휴가. 구단은 "곧 돌아온다"는 입장입니다.`,{tid:t.id}); return; }
  if(k==='clash'){ p.mor=clamp((p.mor??60)-8,0,100); wire('외국인',`${tn} ${nm}, 감독과의 기용 갈등설. 더그아웃 분위기에 물음표가 붙었습니다.`,{tid:t.id}); return; }
  if(k==='slack'){ if(bad){ p.fBad=1; } wire('외국인',`${tn} ${nm} 태업 논란. 전력 질주를 하지 않는다는 지적이 나옵니다.`,{tid:t.id}); return; }
  if(k==='fake'){ p.fLeave=G.day+ri(3,6); wire('외국인',`${tn} ${nm}, 몸 상태를 이유로 며칠 결장. 정밀 검진에서는 큰 이상이 없었다는 소식입니다.`,{tid:t.id}); } }
/* 우리 구단: 결정 사건 */
function fDramaUser(p,k){ const m=G.mgr[G.user], mn=m&&!m.interim?`${m.name} 감독`:'감독', cn=p.orig||'고향';
  const sit=k==='home'?`${p.name}(${posLabel(p)})이(가) 통역을 통해 면담을 요청했습니다. "가족이 많이 힘들어합니다. 솔직히 집에 가고 싶습니다." ${cn} 생활이 그립다며 표정이 어둡습니다. 최근 경기 집중력도 떨어졌다는 코치진 보고가 함께 왔습니다.`
    :k==='clash'?(R()<.6?`${mn}과(와) ${p.name}이(가) 더그아웃에서 언성을 높였습니다. ${p.isP?'등판 간격과 교체 시점':'타순과 수비 위치'}에 대한 불만이 쌓였다고 합니다. 선수는 "존중받지 못한다"고, 감독은 "팀 규율이 먼저"라고 말합니다.`:`${p.name}이(가) 국내 선수들과 어울리지 못하고 따로 지낸다는 보고입니다. 훈련 방식 차이로 몇몇 고참과 마찰이 있었습니다.`)
    :k==='slack'?`코치진 보고: "${p.name}의 훈련 태도가 성의 없어 보입니다. 경기에서도 전력 질주가 줄었습니다." 몸에는 이상이 없다고 합니다. 기록도 조금씩 떨어지고 있습니다.`
    :`${p.name}이(가) "몸이 좋지 않다"며 결장을 요청했습니다. 의무팀은 뚜렷한 이상을 찾지 못했지만 선수는 통증을 호소합니다.`;
  const O=k==='home'?[['leave','짧은 귀국 휴가를 준다','7~10일 빠지지만 적응과 기분이 오릅니다. 예민한 선수는 복귀가 늦어질 수 있습니다.'],['family','가족 초청·생활 지원(약 1억)','비용이 들지만 적응이 크게 오를 가능성이 큽니다.'],['release','방출 요청을 받아들인다','남은 연봉은 그대로 지급하고 새 외국인 선수를 찾아야 합니다.'],['hold','설득만 하고 버틴다','기분과 적응이 떨어지고, 태업으로 번질 수 있습니다.']]
    :k==='clash'?[['club','팀 규율이 먼저라고 선을 긋는다','감독 관계가 좋아지지만 선수 기분이 크게 떨어집니다.'],['player','감독에게 배려를 요청한다','선수 기분이 오르지만 감독 관계가 내려갑니다.'],['mediate','통역·멘토를 붙여 중재(약 3천만)','비용이 들지만 대부분 갈등이 가라앉고 적응이 오릅니다.'],['watch','지켜본다','저절로 풀리기도 하지만 태업으로 번질 수 있습니다.']]
    :k==='slack'?[['talk','면담으로 동기를 다시 심어 준다','성격에 따라 효과가 갈립니다.'],['fine','벌금을 매긴다','태업이 멈출 가능성이 크지만 기분이 크게 떨어집니다. 예민한 선수는 귀국을 말할 수 있습니다.'],['release','방출한다','남은 연봉은 그대로 지급하고 새 외국인 선수를 찾아야 합니다.'],['ignore','모른 척한다','태업이 한 달 더 이어집니다.']]
    :[['exam','정밀 검진(약 1천만)','진짜 부상인지 확인합니다. 의료진이 좋을수록 정확합니다.'],['rest','며칠 쉬게 한다','3~6일 빠지고 기분이 조금 오릅니다.'],['play','출전을 지시한다','기분이 떨어지고, 실제로 아팠다면 다칠 수 있습니다.']];
  const def=k==='fake'?1:O.length-1;
  evNew('fdrama',`외국인 선수 ${FD_T[k]}: ${p.name}`,sit,O.map(o=>({l:o[1],fx:o[2]})),{def,data:{pid:p.id,t:k,keys:O.map(o=>o[0])},ref:p.id,face:p.id,from:k==='slack'?'코치진':k==='fake'?'의무팀':'운영팀',exp:4});
  if(R()<.5)try{ ivRequest('fdrama',{pid:p.id,t:k}); }catch(e){} }
EVH.fdrama={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||p.team!==G.user)return '이제 우리 선수가 아닙니다.'; const c=e.data.keys[i], t=team(G.user), m=G.mgr[G.user]; initPers(p);
  const mor=d=>{ p.mor=clamp((p.mor??60)+d,0,100); }, ad=d=>{ p.adapt=clamp((p.adapt??50)+d,15,85); }, pay=a=>{ G.spend.etc=(G.spend.etc||0)+a; }, rel=d=>{ if(m&&!m.interim)m.rel=clamp(m.rel+d,0,100); };
  const rel_=()=>{ try{ releaseForeign(p.id); }catch(err){} return `${p.name}을(를) 방출했습니다. 남은 연봉은 그대로 나갑니다. 외국인 시장에서 대체 선수를 찾아야 합니다.`; };
  switch(c){
    case 'leave': { const late=p.pers.temp>=14&&R()<.3; p.fLeave=G.day+ri(7,10)+(late?ri(3,6):0); ad(6); mor(8); delete p.fhome; return `${p.name}이(가) 귀국했습니다. ${dmd(p.fLeave)}에 돌아올 예정입니다.${late?' 다만 연락이 뜸해 복귀가 늦어질 수 있다는 말이 나옵니다.':''}`; }
    case 'family': pay(Math.round(100*ecoIdx())); if(R()<.7){ ad(12); mor(10); delete p.fhome; return `가족이 한국에 왔습니다. ${p.name}의 표정이 한결 밝아졌습니다.`; } ad(4); mor(3); return '가족이 다녀갔지만 마음을 다잡지는 못한 모습입니다.';
    case 'hold': mor(-8); ad(-3); if(R()<.35){ p.fslk={until:G.day+21,b:-2.5}; return `${p.name}이(가) 마지못해 남았습니다. 코치진은 "의욕이 없어 보인다"고 걱정합니다.`; } return `${p.name}이(가) 일단 남기로 했습니다. 기분은 좋지 않습니다.`;
    case 'release': return rel_();
    case 'club': mor(-12); rel(2); if(p.pers.temp>=14&&R()<.4){ p.fslk={until:G.day+21,b:-2}; return `${fMgrN(m)}은(는) 만족했지만 ${p.name}은(는) 마음의 문을 닫았습니다.`; } return `${fMgrN(m)}이(가) 구단의 지지에 고마워합니다. ${p.name}은(는) 불만이 남았습니다.`;
    case 'player': mor(7); rel(-3); return `${fMgrN(m)}이(가) "선수 눈치를 본다"며 언짢아합니다. ${p.name}은(는) 고마워합니다.`;
    case 'mediate': pay(Math.round(30*ecoIdx())); if(R()<.7){ mor(5); ad(5); return '중재가 통했습니다. 갈등이 가라앉았습니다.'; } mor(1); return '중재는 했지만 앙금이 남았습니다.';
    case 'watch': if(R()<.4){ p.fslk={until:G.day+21,b:-2}; mor(-4); return `갈등이 풀리지 않았습니다. ${p.name}의 훈련 태도가 눈에 띄게 느슨해졌습니다.`; } return '시간이 지나며 조금 가라앉았습니다.';
    case 'talk': if(R()<clamp(.35+(p.pers.pro-8)*.05+((p.adapt??50)-50)/100,.15,.85)){ delete p.fslk; mor(5); return `${p.name}이(가) "다시 집중하겠다"고 약속했습니다.`; } if(p.fslk)p.fslk.until=G.day+14; return `${p.name}은(는) 고개만 끄덕였습니다. 달라질지는 지켜봐야 합니다.`;
    case 'fine': mor(-14); if(R()<.65)delete p.fslk; if(p.pers.temp>=14&&R()<.35){ p.fhome=G.day+30; return `벌금을 매겼습니다. ${p.name}이(가) 크게 반발하며 "이럴 거면 집에 가겠다"고 했습니다.`; } return `벌금을 매겼습니다. ${p.name}은(는) 불만스럽지만 훈련에는 나옵니다.`;
    case 'ignore': if(p.fslk)p.fslk.until=G.day+30; return '모른 척하기로 했습니다. 코치진은 답답해합니다.';
    case 'exam': { pay(Math.round(10*ecoIdx())); const real=R()<.35; const sure=R()<(G.med&&G.med.hosp==='a'?.9:.7); if(real){ p.injOut=ri(5,12); p.injK='blister'; (p.injHist=p.injHist||[]).push({y:G.year,days:p.injOut,d:G.day,t:p.team,k:'blister'}); return `검진 결과 실제로 가벼운 부상이 있었습니다. ${p.injOut}일 쉽니다.`; } if(sure){ mor(-3); return `검진 결과 이상이 없었습니다. ${p.name}은(는) 머쓱해하며 경기에 나갑니다.`; } p.fLeave=G.day+ri(2,4); return '검진으로도 확실히 가리지 못했습니다. 며칠 쉬게 했습니다.'; }
    case 'rest': p.fLeave=G.day+ri(3,6); mor(4); return `${p.name}에게 휴식을 줬습니다. ${dmd(p.fLeave)}부터 다시 뜁니다.`;
    case 'play': mor(-8); p.fslk={until:G.day+14,b:-1.5}; if(R()<.12){ try{ injure(p,G.day); }catch(err){} return `출전을 지시했습니다. 그런데 ${p.name}이(가) 경기 중 다쳤습니다. 진짜 아팠던 것으로 보입니다.`; } return `출전을 지시했습니다. ${p.name}은(는) 마지못해 나섰습니다.`; }
  return ''; } };
const fMgrN=m=>m&&!m.interim?`${m.name} 감독`:'감독';
/* 기자 질문(52_interviews.js의 Q에 덧붙인다) */
function fdramaQ(nm,d){ const t=d&&d.t; const q=t==='home'?`${nm} 선수가 귀국을 원한다는 보도가 있습니다.`:t==='clash'?`${nm} 선수와 감독 사이 갈등설, 사실입니까?`:t==='slack'?`${nm} 선수의 태업 논란에 대해 한 말씀 해 주시죠.`:`${nm} 선수의 결장을 두고 꾀병 아니냐는 말이 나옵니다.`;
  return [[q,[['감싸기',`"${nm} 선수는 우리 팀에 꼭 필요한 선수입니다. 구단이 끝까지 돕겠습니다."`,ivFx(1,0,{mor:[d.pid,5]})],
    ['원칙',`"누구든 팀보다 앞설 수는 없습니다. 구단 원칙대로 처리합니다."`,ivFx(1,1,{mor:[d.pid,-6]})],
    ['신중','"내부 문제는 안에서 풀겠습니다. 지금은 말씀드릴 게 없습니다."',ivFx(0,-1)],
    ['직설',`"솔직히 실망스럽습니다. 계속 이러면 교체도 생각합니다."`,ivFx(2,-1,{mor:[d.pid,-12]})]]]]; }
