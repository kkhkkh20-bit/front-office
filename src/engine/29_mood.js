/* ===== 선수 기분과 성향 ===== */
function initPers(p){ if(p.mor==null)p.mor=clamp(Math.round(N(62,8)),35,85); if(!p.pers)p.pers={pro:ri(4,20),amb:ri(4,20),loy:ri(4,20),temp:ri(4,20)}; }
const moodLabel=m=>m>=80?'매우 좋음':m>=65?'좋음':m>=45?'보통':m>=30?'불만':'매우 불만';
const moodClass=m=>m>=65?'good':m>=45?'':m>=30?'warn':'bad';
function persText(p){ const s=p.pers; const t=[]; if(s.pro>=15)t.push('프로의식이 강함'); if(s.pro<=7)t.push('훈련 태도가 들쭉날쭉'); if(s.amb>=15)t.push('야망이 큼'); if(s.loy>=15)t.push('구단 충성심이 높음'); if(s.loy<=6)t.push('시장 평가를 중시'); if(s.temp>=15)t.push('예민한 편'); if(s.temp<=6)t.push('무던한 편'); return t.length?t.join(' · '):'평범한 성향'; }
function isRegular(p){ if(p.team==null)return false; const d=depth(p.team); return [...d.start,...d.sp,...d.pen.slice(0,4)].some(x=>x.id===p.id); }
function playedReg(p){ if(p.team==null)return false; const r=G.sea&&G.sea.rec[p.team]; const g=r?r.w+r.l+(r.t||0):0; if(g<10)return false; const h=seasonTotal(p,G.year,'1군'); if(!h)return false;
  return p.isP?((h.gs||0)>=g/7||(h.g||0)>=g/3):(h.pa||0)>=g*2.5; }
function moraleWhy(p){
  const per=period(); const live=per==='season'||per==='post';
  const reg=!live||isRegular(p)||playedReg(p); const star=ovr(p)>=55||p.sal>=500;
  if(p.promise)return '건의해 주신 출전 기회를 기다리고 있습니다.';
  if(star&&!reg&&healthy(p))return '주전으로 뛰지 못해 답답합니다.';
  if(!reg&&p.age>=27&&healthy(p))return '나이가 있어서 더 많은 기회가 필요합니다.';
  const r=G.sea.rec[p.team]; if(r&&r.w+r.l>20&&r.w/(r.w+r.l)<.44)return '팀 성적이 좋지 않아 분위기가 무겁습니다.';
  if(!p.foreign&&!p.faC&&p.svc>=faSvc(p)-1)return 'FA를 앞두고 미래가 신경 쓰입니다.';
  if(p.mor>=65)return '요즘 야구가 즐겁습니다.';
  return '특별한 고민은 없습니다.';
}
/* 감독의 투수 보직 결정: 부진한 선발은 불펜으로, 잘 던지는 불펜은 선발 기회. 매주 다시 본다 */
function roleWeek(){ if(period()!=='season')return; const y=G.year;
  for(const t of G.teams){ const m=mgrOf(t.id); const thr=rpThr(t.id); const before=new Set(playersOf(t.id).filter(p=>p.isP&&p.role==='SP').map(p=>p.id));
    for(const p of playersOf(t.id)){ if(!p.isP)continue; p.rAdj=(p.rAdj||0)*.85; const h=seasonTotal(p,y,'1군'); if(!h||!h.outs)continue; const era=h.er*27/h.outs;
      if(p.role==='SP'&&(h.gs||0)>=5&&era>=6.2)p.rAdj=Math.min(p.rAdj,-7);
      else if(p.role==='RP'&&(h.g||0)>=12&&h.outs>=60&&era<=2.6&&p.r.sta>=thr-9)p.rAdj=Math.max(p.rAdj,6); }
    if(t.id!==G.user||G.unemp||!m)continue; depth(t.id); const after=playersOf(t.id).filter(p=>p.isP&&p.role==='SP'); const up=after.filter(p=>!before.has(p.id)&&before.size), down=[...before].map(id=>G.players[id]).filter(p=>p&&p.team===t.id&&p.role==='RP'&&healthy(p));
    if(up.length||down.length){ const ln=[...up.map(p=>`${p.name}: 불펜 → 선발`),...down.map(p=>`${p.name}: 선발 → 불펜`)];
      mail('감독실',`투수 보직 변경 (${ln.length}명)`,`${m.name} 감독: 이번 주부터 선발진을 바꿉니다.\n\n${ln.join('\n')}\n\n체력과 최근 투구 내용을 보고 정했습니다. 내용이 바뀌면 다시 조정합니다.`,{kind:'감독'}); } } }
function moraleWeek(){
  const per=period();
  for(const t of G.teams){
    const d=depth(t.id); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id));
    const st=G.sea.rec[t.id]; const wp=(st.w+st.l)?st.w/(st.w+st.l):.5; const m=G.mgr[t.id]; const disc=m?m.disc:45;
    const cap=t.id===G.user?captainOf(t.id):null; const capB=cap&&healthy(cap)?((cap.pers&&cap.pers.pro)||10)>=14?.4:.2:0;
    for(const p of playersOf(t.id)){ initPers(p); let dd=capB; const star=ovr(p)>=55||p.sal>=500; const r=reg.has(p.id)||(per==='season'&&playedReg(p));
      if(per==='season'){ if(star&&!r&&healthy(p))dd-=3*(p.pers.temp>=14?1.3:1); else if(!r&&healthy(p)&&p.age>=27&&ovr(p)>=46)dd-=1; else if(r)dd+=1; if(wp>.56)dd+=1; if(wp<.44)dd-=1; }
      if(p.promise&&G.day>=p.promise.until){
        if(r){ dd+=5; if(t.id===G.user)note('면담',`${p.name}: 감독님께 말씀해 주셔서 기회를 얻었습니다. 감사합니다.`,p.id); }
        else { dd-=12; if(t.id===G.user)stop('면담',`${p.name}이(가) 한 달이 지나도 기회를 얻지 못해 실망했습니다. 감독은 다른 선수를 기용하고 있습니다.`,p.id); }
        delete p.promise; }
      const tgt=60+(disc-50)/8; p.mor=clamp(p.mor+dd+(tgt-p.mor)*.08,0,100);
      if(t.id===G.user)requestCheck(p);
    }
  }
}
/* 출전 시간 때문에 생긴 불만인가(주전에서 밀린 스타·고참) */
function ptWhyP(p){ const per=period(); if(per!=='season'&&per!=='post')return false; if(p.promise)return false; const reg=isRegular(p)||playedReg(p); if(reg||!healthy(p))return false; return ovr(p)>=55||p.sal>=500||p.age>=27; }
const teamGP=tid=>{ const r=G.sea&&G.sea.rec&&G.sea.rec[tid]; return r?r.w+r.l+(r.t||0):0; };
function requestCheck(p){
  if(p.mor>=34||(p.reqDay!=null&&p.reqDay>G.day-45))return;
  /* 출전 시간 불만은 시즌 100경기가 지나야 말이 나오고, 단장이 아니라 감독에게 먼저 간다(25_gm_events의 pt: 감독과 갈등 기사 → 단장 후속 조치) */
  if(ptWhyP(p)){ if(G.unemp||teamGP(p.team)<100||(p.ptDay>G.day-60)||(G.ptLast!=null&&G.day-G.ptLast<30))return; p.reqDay=G.day; G.ptLast=G.day; if(!evOpen().some(e=>e.k==='pt'))try{ EVH.pt.make(p); }catch(e){} return; } /* 팀 전체로도 한 달에 한 번까지 */
  p.reqDay=G.day; const why=moraleWhy(p);
  if(p.mor<22&&p.pers.amb>=13&&!p.listed&&!p.foreign&&p.pers.temp>=13&&R()<.5)prLeak('p',p);
  if(p.mor<22&&p.pers.amb>=13&&!p.listed&&!p.foreign){ p.treq={day:G.day}; } if(p.mor<22&&p.pers.amb>=13&&!p.listed&&!p.foreign) mail(p.name,'트레이드 요청',`${why} 이대로라면 다른 팀에서 뛰고 싶습니다. 트레이드를 요청드립니다.`,{imp:true,ref:p.id,face:p.id,kind:'선수',acts:[{l:'트레이드 명단에 올리기',a:'listP',v:p.id},{l:'남아 달라고 설득',a:'keepP',v:p.id},{l:'선수 보기',a:'player',v:p.id}]});
  else mail(p.name,'면담 요청',`${why} 단장님과 이야기하고 싶습니다.`,{imp:true,ref:p.id,face:p.id,kind:'선수',acts:[{l:'면담하기',a:'player',v:p.id}]});
}
const TALK={praise:'칭찬하기',push:'분발 촉구',promise:'출전 기회 건의',contract:'계약 이야기',ask:'고민 묻기'};
/* 감독과의 대화: 단장이 자주 묻고, 감독이 현황과 원하는 보강을 말한다 */
function mgrWantForeign(){ const m=G.mgr[G.user]; if(!m)return null; const rk=slotRanks(G.user); const f=foreignOf(G.user).filter(p=>p.foreign==='용병'); const fp=f.filter(p=>p.isP).length, fb=f.length-fp;
  const fieldW=PSLOTS.filter(k=>k!=='SP'&&k!=='RP').sort((a,b)=>rk[b].rank-rk[a].rank)[0];
  let want; if(f.length>=3)want=null; else if(fp<2&&(rk.SP.rank>=4||fp===0))want={isP:true,k:'SP'}; else if(fb<1||rk[fieldW].rank>=6)want={isP:false,k:fieldW}; else want={isP:true,k:rk.RP.rank>rk.SP.rank?'RP':'SP'};
  if(!want)return {want:null,txt:'외국인 세 자리는 다 찼습니다. 지금 선수들로 가겠습니다.'};
  const style=want.isP?(m.pen>=60&&want.k==='RP'?'구위로 윽박지르는 불펜':m.arm>=60?'이닝을 길게 먹어 주는 선발':'제구가 되는 선발'):(m.small>=60?'출루와 주루가 되는 타자':'담장을 넘길 수 있는 거포');
  want.style=style; return {want,txt:want.isP?`${SLOTK[want.k]}이(가) 급합니다. ${style}이면 좋겠습니다. 우리 ${SLOTK[want.k]}은(는) 리그 ${rk[want.k].rank}위입니다.`:`${SLOTK[want.k]} 쪽 타자를 원합니다. ${style}이면 좋겠습니다. 지금 우리 ${SLOTK[want.k]}은(는) 리그 ${rk[want.k].rank}위입니다.`}; }
function mgrFitF(p,W){ if(!W||!W.want||!p)return false; if(W.want.isP!==!!p.isP)return false; if(p.isP)return W.want.k==='SP'?isSPr(p):true; return p.pos===W.want.k||(W.want.k==='DH'&&['1B','LF','RF'].includes(p.pos))||subsOf(p).includes(W.want.k); }
/* 감독은 직접 본 만큼만 안다. 우리 선수는 함께 지낸 날·1군 출장으로 알아 가고, 외국인 후보는 영상과 스카우트 보고서뿐이다.
   안목이 낮거나 아직 못 본 선수일수록 판단이 빗나가고, 스카우트와 다르게 볼 때도 있다 */
function mgrKnow(m,p){ if(!m||!p)return 0; if(p.team==null)return 0; if(p.team!==G.user)return .35; const days=m.hD==null?999:G.day-m.hD; const h=seasonTotal(p,G.year,'1군'), h0=seasonTotal(p,G.year-1,'1군');
  const g=(h?(p.isP?h.outs/90:h.pa/150):0)+(m.hD==null&&h0?(p.isP?h0.outs/120:h0.pa/200):0); return clamp(.15+clamp(days/120,0,1)*.45+g*.4,0,1); }
function mgrEst(m,p){ const k=mgrKnow(m,p); const sd=(2+(85-(m.eye||50))/6)*(1.1-k*.7); const base=p.foreign&&p.team==null?(()=>{ const f=fScout(p); return f.raw??ovr(p); })():ovr(p); return base+hn('me'+(m.id||'')+halfK(),p.id)*sd; }
const mgrFresh=m=>m&&m.hD!=null&&G.day-m.hD<45&&!(period()==='season'||period()==='post'); /* 부임한 지 얼마 안 됐고 아직 경기를 못 봤다 */
function mgrTalk(topic){ const m=G.mgr[G.user]; if(!m||m.interim)return {a:'감독이 없습니다.'}; mgrAttr(m); const nm=m.name; let a='';
  if(topic==='now'){ a=mgrNowTalk(m); }
  else if(topic==='foreign'){ const W=mgrWantForeign(); a=W?W.txt:''; G.mgrWant=W&&W.want?{y:G.year,day:G.day,...W.want}:null;
    const L=(G.fmarket||[]).map(id=>G.players[id]).filter(p=>p&&p.team==null&&p.foreign==='용병'&&fKnows(G.user,p)&&mgrFitF(p,W)).sort((x,y)=>{ const v=r=>(r.ofp??r.cur+6)+r.cur*.2; return v(scoutReport(y))-v(scoutReport(x)); }).slice(0,3);
    if(L.length)a+=` 시장에서 눈에 띄는 건 ${L.map(p=>`${p.name}(${posLabel(p)}, ${p.nat||''})`).join(', ')} 정도입니다.`; }
  else if(topic==='need'){ const R=slotRanks(G.user); const k=PSLOTS.filter(x=>x!=='DH').sort((x,y)=>R[y].rank-R[x].rank)[0]; const d=depth(G.user); const cur=k==='SP'?d.sp[4]:k==='RP'?d.pen[3]:d.ln[k];
    const ce=cur?mgrEst(m,cur):null; const cv=ce==null?'':ce>=ovr(cur)+3?' 그래도 저는 좀 더 해 줄 선수라고 봅니다':ce<=ovr(cur)-3?' 제가 보기엔 그 이상은 어렵습니다':'';
    a=`${mgrFresh(m)?'아직 선수들을 다 보지는 못했지만 기록상으로는 ':''}${SLOTK[k]}입니다. 리그 ${R[k].rank}위${cur?`이고 지금은 ${cur.name}이(가) 맡고 있습니다${cv?'.'+cv:''}`:''}. ${m.youth>=60?'내부에서 키울 선수가 있으면 기회를 주겠지만, ':''}트레이드든 외국인이든 한 명 있으면 확 달라집니다.`; }
  else if(topic==='young'){ /* 감독 눈으로 본 지금 실력 + 2군 보고서의 성장 여지. 성향(젊은 선수 선호)에 따라 고르는 기준도 다르다 */ const ys=playersOf(G.user).filter(p=>!p.foreign&&p.age<=24).map(p=>{ const rp=scoutReport(p); const e=mgrEst(m,p); return {p,rp,s:e+((rp.ofp||e)-e)*(m.youth>=60?.6:.3)}; }).sort((x,y)=>y.s-x.s).slice(0,3);
    const up=x=>{ const h=seasonTotal(x.p,G.year,'1군'); return !!(h&&(x.p.isP?h.outs>=45:h.pa>=60)); }; const inU=ys.filter(up), outU=ys.filter(x=>!up(x));
    a=mgrFresh(m)&&ys.length?`아직 캠프 전이라 어린 선수들을 직접 보지 못했습니다. 2군 감독 보고로는 ${ys.slice(0,2).map(x=>x.p.name).join(', ')}이(가) 좋다고 합니다. 캠프에서 보고 다시 말씀드리겠습니다.`:ys.length?`눈여겨보는 선수는 ${ys.map(x=>`${x.p.name}(${posLabel(x.p)}, ${x.p.age}세)`).join(', ')}입니다.${inU.length?` ${inU.map(x=>x.p.name).join(', ')}은(는) 이미 1군에서 자리를 잡아 가고 있습니다.`:''}${outU.length?` ${outU.map(x=>x.p.name).join(', ')}은(는) ${m.youth>=60?'기회를 더 주고 싶습니다.':'아직 1군에서 쓰기엔 이릅니다.'}`:''}`:'당장 1군에 올릴 만한 젊은 선수는 안 보입니다.'; }
  if(topic!=='now'){ a=mvWrap(m,topic,a); const LT=(G.mgrLast=G.mgrLast||{})[topic]; if(LT&&LT.a===a&&G.day-LT.d<=14)a=`${dmd(LT.d)}에 말씀드린 것과 같습니다. 그사이 달라진 게 없습니다. 요약하면, ${a}`; G.mgrLast[topic]={d:G.day,a:LT&&LT.a===a?LT.a:a}; } /* 같은 질문을 또 하면 지난번 답과 같다고 짧게 말한다 */
  const wk=Math.floor(G.day/7); let rel=''; if(G.mgrTalkW!==wk){ G.mgrTalkW=wk; m.rel=clamp(m.rel+1,0,100); rel=' (자주 의논해 주셔서 감독 관계 +1)'; }
  (G.mgrChat=G.mgrChat||[]).unshift({d:G.day,t:topic,a:a.replace(/^/,'')}); if(G.mgrChat.length>8)G.mgrChat.length=8; return {a:`${nm} 감독: "${a}"${rel}`}; }
/* 감독이 보는 외국인 후보 한 명: 원하는 유형과 맞는지 + 감독 눈으로 본 실력 + 감독 성향 */
function mgrOnForeign(p,short){ const m=G.mgr[G.user]; if(!m||!p)return '...'; mgrAttr(m); const W=mgrWantForeign(); const fit=mgrFitF(p,W);
  const f=fScout(p); const est=mgrEst(m,p); const scv=f.raw??est; const dif=est-scv; /* 감독은 외국인 후보를 직접 본 적이 없다: 영상과 스카우트 보고서(종합 추정)에 자기 눈을 얹는다 */
  const src=f.n<=0?'영상 몇 개와 에이전트 자료만 봐서 장담은 못 합니다. ':f.n===1?'영상과 스카우트 보고서로만 봤습니다. ':''; const opin=Math.abs(dif)>=3?(dif>0?' 스카우트 평가보다 저는 좀 더 높게 봅니다.':' 스카우트 평가만큼 좋아 보이지는 않습니다.'):''; const lv=est>=63?'1군에서 바로 통할 실력입니다':est>=57?'쓸 만한 선수입니다':est>=52?'우리 리그에서 버틸지 반반입니다':'우리 팀에 큰 도움은 안 될 것 같습니다';
  const tyk=mgrType(m).k; const sty=!p.isP&&(tyk==='dfn'||tyk==='combo_d')?(p.r.def>=58?' 수비가 돼서 좋습니다.':' 수비가 불안해서 걱정입니다.'):!p.isP&&(tyk==='big'||tyk==='bat'||tyk==='combo_o')?(p.r.pow>=60?' 한 방이 있어서 마음에 듭니다.':''):p.isP&&tyk==='pen_all'&&!isSPr(p)?' 불펜이 두꺼워지는 건 환영입니다.':p.isP&&(tyk==='sp_care')&&isSPr(p)?' 긴 이닝 막아 줄 선발이면 좋겠습니다.':'';
  const good=est>=57, bad=est<52; const need=W&&W.want?(W.want.isP?(W.want.k==='SP'?'선발':'불펜'):SLOTK[W.want.k]||W.want.k):'';
  /* 원하는 유형인지(자리)와 실력 판단을 한 문장으로 잇는다: 둘이 엇갈리면 '그런데'로 이유를 붙인다 */
  const head=!need?lv+'.':fit?(good?`딱 제가 원하던 ${need} 유형이고, ${lv}.`:bad?`${need} 유형이라 자리는 맞는데, 실력이 아쉽습니다. ${lv}.`:`${need} 유형이라 자리는 맞습니다. 다만 ${lv}.`)
    :(good?`제가 급하다고 보는 자리는 ${need} 쪽이라 우선순위는 아닙니다. 그래도 ${lv}.`:`제가 급하다고 보는 자리는 ${need} 쪽입니다. 이 선수는 자리도 안 맞고, ${lv}.`);
  const age=p.age>=34?' 다만 나이가 있어서 한 시즌을 버틸지 걱정입니다.':p.age<=26?' 젊어서 적응만 하면 더 좋아질 수 있습니다.':'';
  return short?`${fit?'원하던 유형, ':''}${lv}`:`${src}${head}${sty}${opin}${age}`; }
function talk(id,kind){
  const p=G.players[id]; if(!p||p.team!==G.user)return {msg:'우리 선수만 면담할 수 있습니다.'};
  initPers(p); const wk=Math.floor(G.day/7);
  if(p.talkWk===wk)return {msg:`${p.name}: 이번 주에는 이미 이야기를 나눴습니다.`};
  p.talkWk=wk; G.tutFlags.talk=true;
  const h=curLine(p); const pf=perfOf(h,p.isP); const good=pf==null?null:pf>=ovr(p)+1.5?true:pf<=ovr(p)-3?false:null;
  let d=0, line='';
  if(kind==='praise'){ if(good===true){d=rnd(6,10);line='고맙습니다. 계속 잘하겠습니다.';} else if(good===false){ if(p.pers.temp>=14){d=-3;line='요즘 못하는 건 저도 압니다. 빈말은 괜찮습니다.';} else {d=2;line='감사합니다. 분발하겠습니다.';} } else {d=3;line='감사합니다. 힘이 됩니다.';} }
  if(kind==='push'){ if(good===false){ if(p.pers.pro>=12){d=4;p.form={until:G.day+21,b:1};line='맞는 말씀입니다. 훈련량을 늘리겠습니다.';} else {d=-7;line='저도 최선을 다하고 있습니다.';} } else {d=-9;line='제가 뭘 더 해야 합니까? 납득하기 어렵습니다.';} }
  if(kind==='promise'){ if(isRegular(p)){d=0;line='이미 주전으로 뛰고 있습니다. 마음만 받겠습니다.';} else if(p.promise){d=-2;line='지난번 약속부터 지켜 주세요.';} else {d=8;p.promise={until:G.day+30};line='감독님께 말씀해 주신다니 감사합니다. 기회가 오면 보여 드리겠습니다.';} }
  if(kind==='contract'){ d=1;
    if(p.foreign)line='재계약은 성적으로 말씀드리겠습니다.';
    else if(p.faC&&p.yrs>1)line='계약 기간이 남았으니 야구에만 집중하겠습니다.';
    else if(p.svc>=faSvc(p)-2)line=`${Math.max(0,faSvc(p)-p.svc)<=1?'이번 시즌이 끝나면 FA입니다':`${Math.max(0,faSvc(p)-p.svc)}시즌 뒤에 FA입니다`}. ${p.pers.loy>=13?'가능하면 이 팀에서 오래 뛰고 싶습니다. 다년계약 제안이면 진지하게 듣겠습니다.':'솔직히 시장 평가도 받아 보고 싶습니다.'}`;
    else line=p.age<=24?'아직은 1군에서 자리 잡는 게 먼저입니다.':'좋은 대우를 받으려면 성적부터 내야죠.'; }
  if(kind==='ask'){ d=2; line=moraleWhy(p); }
  if(d<0&&p.pers.temp>=15)d*=1.4;
  p.mor=clamp(p.mor+d,0,100);
  return {msg:`${p.name}: "${line}"`,d};
}
function listPlayer(id){ const p=G.players[id]; if(!p||p.team!==G.user||G.unemp)return; p.listed=true; const req=p.treq&&!p.treq.done; if(req){ p.treq.done=true; p.mor=clamp(p.mor+6,0,100); } /* 기분은 트레이드 요청에 응했을 때 한 번만 */ note('면담',`${p.name}을(를) 트레이드 명단에 올렸습니다. 다른 구단이 관심을 보이면 제안이 올 수 있습니다.`,id); }
function keepPlayer(id){ const p=G.players[id]; if(!p||p.team!==G.user||G.unemp)return; if(!(p.treq&&!p.treq.done)){ note('면담',`${p.name}: "이미 말씀 나눴습니다."`,id); return; } p.treq.done=true; const ok=p.pers.loy>=11||R()<.35; p.mor=clamp(p.mor+(ok?8:-6),0,100); note('면담',ok?`${p.name}: "단장님 말씀을 믿고 한 번 더 해 보겠습니다."`:`${p.name}: "생각은 달라지지 않았습니다."`,id); }

