/* ===== 스카우트 리포트: 숨은 능력을 오차를 섞어 보여준다 ===== */
const TOOLK={con:'컨택',pow:'파워',eye:'선구안',spd:'주루',def:'수비',vit:'체력',stf:'구위',ctl:'제구',sta:'체력'};
const GOOD={vit:'체력이 좋아 연속 출장에도 지치지 않습니다.',con:'배트 컨트롤이 좋아 삼진을 잘 당하지 않습니다.',pow:'타구에 힘이 실려 장타를 기대할 수 있습니다.',eye:'공을 오래 보고 볼넷을 골라냅니다.',spd:'발이 빨라 내야안타와 도루가 됩니다.',def:'수비 범위와 송구가 안정적입니다.',stf:'구위로 타자를 압도합니다.',ctl:'원하는 곳에 던지는 제구가 됩니다.',sta:'긴 이닝을 버틸 체력이 있습니다.'};
const BAD={vit:'체력이 약해 연속 출장이 이어지면 성적이 떨어집니다.',con:'변화구 대처가 약해 삼진이 많습니다.',pow:'장타력이 부족합니다.',eye:'유인구에 방망이가 쉽게 나갑니다.',spd:'주력이 느립니다.',def:'수비에서 실수가 잦습니다.',stf:'구위가 평범해 정타를 자주 허용합니다.',ctl:'제구가 흔들려 볼넷이 많습니다.',sta:'투구 수가 늘면 구위가 떨어집니다.'};
/* 숨은 재능을 못 알아본 만큼 잠재력에서 뺀다: 1군 기록이 쌓여 드러나면(hidR) 0. 스카우트 능력 3부터 알아볼 수 있고(능력 5면 45%), 우리 팀에서 지켜본 시즌만큼 줄어든다 */
function hidPen(p,sc,own){ if(!p||!p.hidT||p.hidR)return 0; const ak=sc&&p.prospect?areaOf(p):null, nb=ak?(areaNet(G.user,ak)-50)*.003:0; /* 권역 정보망이 촘촘할수록 더 알아본다(정보망 100이면 +15%p, 검수 11-09e #18) */ if(sc&&(sc.skill||1)>=3&&u01('hid'+sc.id,p.id)<((sc.skill||1)-2)*.15+nb)return 0; return own?p.hidT*Math.max(0,1-ownObs(p)*.5):p.hidT; }
/* 구단의 스카우트 담당 지역(수도권·영남·호남·충청): 창단·연고 이전 구단은 '강원·충청·호남'처럼 세부 지역으로 저장돼 프로 담당 스카우트와 이어지지 않았다(카페 11-13 dddddd: 원주 신생 구단 선수가 '미확인') */
function teamScoutReg(tid){ const t=team(tid); const r=t&&t.region; if(REG.includes(r))return r; const a=t&&typeof AREA!=='undefined'?AREA.find(x=>x.city.includes(t.city)):null; if(a)return a.reg; return r==='강원'||r==='경기'||r==='인천'?'수도권':r==='영남'||r==='경남'||r==='경북'?'영남':'호남·충청'; }
function coverOf(tid){ const reg=teamScoutReg(tid); return {reg,sc:scoutOf('pro',reg)}; }
function publicP(p){ return p.hist.some(h=>h.lvl==='1군'&&h.y>=G.year-1&&(h.pa>=10||h.outs>=9)); }
/* 아마추어 후보 오차: 스카우트 실력·특기·정보망에 실제로 본 횟수까지 */
const prosSd=(sc,p)=>scSd(sc,p)*(1.35-.35*Math.min(1,dcEvalObs(p,sc)/6));
/* 담당 고르기: 후보를 주면 그 후보 오차가 가장 작은 사람(검수 11-09e #20). 지역 없이 부르면 국내(아마추어·프로) 담당 중 최고, 해외 파견자는 국내 선수를 보지 않는다(#26) */
function bestScout(region,p){ if(region){ if(!p)return scoutOf('am',region); return G.scouts.filter(x=>(x.role||'am')==='am'&&x.region===region).map(s=>Object.assign({},s,{skill:effSkill(s)})).sort((a,b)=>prosSd(a,p)-prosSd(b,p))[0]||null; } const s=G.scouts.filter(x=>x.role!=='intl').sort((a,b)=>effSkill(b)-effSkill(a))[0]; return s?Object.assign({},s,{skill:effSkill(s)}):null; }
function archetype(t,p){ // t: 평가된 도구 점수
  if(p.isP){
    if(t.stf>=62&&t.ctl<50)return '강속구 투수(제구 불안)'; if(t.stf>=60&&t.ctl>=57)return '에이스형'; if(t.ctl>=60&&t.stf<53)return '제구형 기교파';
    if(isSP(p)&&t.sta>=60)return '이닝이터'; if(!isSP(p)&&t.stf>=58)return '파워 불펜'; return isSP(p)?'선발 자원':'불펜 자원'; }
  if(t.pow>=62&&t.con<50)return '거포형'; if(t.pow>=57&&t.con>=55)return '중장거리 강타자'; if(t.con>=58&&t.spd>=58)return '교타형 리드오프';
  if(t.con>=60)return '교타자'; if(t.spd>=62)return '준족형'; if(t.def>=62&&t.con+t.pow<100)return '수비형'; if(t.eye>=62)return '선구안형'; return '밸런스형';
}
function roleOf(ofp,p){
  const pos=p.isP?(isSP(p)?'선발':'불펜'):POSS[p.pos];
  if(ofp>=70)return '리그 최정상급'; if(ofp>=65)return '올스타급 '+pos; if(ofp>=60)return '상위권 주전 '+pos; if(ofp>=55)return '주전 '+pos;
  if(ofp>=50)return p.isP?(isSP(p)?'4~5선발':'필승조급 불펜'):'평균 주전·핵심 백업'; if(ofp>=45)return '1군 백업'; if(ofp>=40)return '1.5군'; return '1군 전력 외';
}
/* 잠재력은 끝까지 추정이다. 우리 선수도 스카우트 능력·트래킹 분석원·함께한 시즌 수만큼만 정확해지고, 오차가 0이 되지는 않는다.
   추정은 반년마다(1월·7월) 새 관찰로 다시 매긴다 */
const sdConf=sd=>sd<=2.5?'매우 높음':sd<=4.5?'높음':sd<=7?'보통':'낮음';
function halfK(){ return dobj(G.day).m>=7?'h':''; }
function ownObs(p){ const y0=G.startY??G.year; return new Set((p.hist||[]).filter(h=>h.t===G.user&&h.y>=y0&&(h.pa||h.outs)).map(h=>h.y)).size; }
/* 우리 팀을 떠난 지 며칠(2년 안이면), 아니면 null. 이적 기록(tLog)의 마지막 '우리 팀에서 나감' 기준 */
function exOwnD(p){ const x=[...(p.tLog||[])].reverse().find(z=>z.f===G.user); if(!x||x.d==null)return null; const d=G.day-x.d; return d>=0&&d<=730?d:null; }
function ownSd(p,sc){ const b=sc?scSd(sc,p):SCOUT_SD[0]; const fw=p.gmFw&&p.gmFw.y===G.year&&p.gmFw.t===G.user?1-.06*Math.min(3,p.gmFw.n||0):1; /* 단장이 2군 경기에서 직접 본 선수 */ return clamp(b*anaEff(G.user).sdm*(1-Math.min(.45,ownObs(p)*.15))*fw,1.5,8); }
/* 겉 포장: 외국인은 1년 보고 뽑으므로 '장래'를 말하지 않고 올해 기량만 말한다. 갓 지명한 우리 신인은 첫 실전 전까지 지명 당시 스카우트 평가를 유지한다 */
function scoutReport(p){ let r=scoutReport1(p); if(!r)return r;
  if(p.foreign){ let c=r.cur; /* 계약 전 후보: 잠재력 칸이 현재 능력 추정보다 정확해 보이지 않게, 기록과 합치고 조사 전 흐림을 얹은 종합 추정을 쓴다(사용자 11-13: 잠재력만 봐도 실력이 드러나 관찰 명단을 쓸 이유가 없었다) */ if(p.team==null&&c!=null&&typeof fScout==='function'){ try{ const f=fScout(p,r); if(f&&f.raw!=null)c=clamp(Math.round(f.raw),20,80); }catch(e){} } r=Object.assign({},r,{ofp:c,role:c!=null?roleOf(c,p):null,tools:(r.tools||[]).map(t=>({...t,fut:t.cur})),notes:(r.notes||[]).filter(n=>!/다 자라지|더 자랄 여지|잠재력/.test(n)),eta:null,now1:true}); }
  else if(p.dEst){const d={...p.dEst,tid:p.dEst.tid??p.draft?.tid,y:p.dEst.y??p.draft?.y},date=d.d!=null?dstr(d.d):d.y!=null?`${d.y}년 지명 당시`:'지명 시점 미상',source=d.tid!=null?tname(d.tid):'지명 구단 미상';r={...r,draftEstimate:d};
    const original=p.team===G.user&&d.tid===G.user&&ownObs(p)===0&&(!p.acq||p.acq.k==='draft'||p.acq.k==='fd');
    if(original){const o=Math.max(r.cur??0,d.ofp),c0=r.cur??Math.round(ovr(p));r={...r,ofp:o,sd:d.sd,conf:sdConf(d.sd),who:`${d.who} · ${source} ${date} 평가(현재 관찰과 구분)`,role:roleOf(o,p),tools:(r.tools||[]).map(t=>({...t,fut:p.age<=26?clamp(Math.round(t.cur+(o-c0)*.9),t.cur,80):t.cur})),notes:[...(r.notes||[]).filter(n=>!/다 자라지|자랄 여지/.test(n)),...(p.age<=26&&o-c0>=10?[`지명 당시에는 ${roleOf(o,p)}까지 기대했습니다. 실전 기록이 쌓이면 코치진이 다시 평가합니다.`]:[])]};}
    else r={...r,notes:[...(r.notes||[]),`과거 지명 평가 · ${source} · ${date} · ${d.who||'평가자 미상'} · 잠재력 추정 ${dv(d.ofp)}점. 당시 자료이며 현재 구단의 관찰 판단과 다릅니다.`]};
  }
  return r; }
function scoutReport1(p){ // KBO 소속 선수는 현재 능력(오버롤)을 정확히 보여 준다. 잠재력은 우리 선수, 또는 프로 담당 스카우트가 있는 지역 구단 선수만
  const r=scoutReport0(p); if(p.prospect||(p.foreign&&p.team==null)||r.unseen)return r; /* 관찰하지 못한 2군 선수는 목록과 같은 기준으로 상세에서도 평가 없음(검수 11-07) */
  const ref=p.team!=null?p.team:p.faFrom; if(ref==null)return r;
  const own=ref===G.user||exOwnD(p)!=null /* 떠난 지 2년 안의 우리 선수는 우리 팀 시절 자료 */; const cur=Math.round(ovr(p)); let ofp=own?r.ofp:null, who=r.who, sc=r.sc, psd=own?r.sd:99;
  if(!own){ const cv=coverOf(ref); if(cv.sc){ const sd=scSd(cv.sc,p)*anaEff(G.user).sdm; psd=sd; ofp=clamp(r5(p.pot-hidPen(p,cv.sc)+hn('pf'+cv.sc.id+G.year+halfK(),p.id)*sd),20,80); who=`${cv.sc.name} 스카우트(${cv.reg} 프로 담당)`; sc=cv.sc; }
    /* 그 지역 프로 스카우트가 없어도 트래킹 분석원이 1군 경기 데이터로 거칠게 추정한다(오차 큼) */
    else if(anaPow('trk',G.user)>=2&&publicP(p)){ const sd=9.5*anaEff(G.user).sdm; psd=sd; ofp=clamp(r5(p.pot-hidPen(p,null)+hn('pa'+G.year+halfK(),p.id)*sd),20,80); who=`전력분석팀 데이터 추정(${cv.reg} 프로 스카우트 없음)`; }
    else who=`${cv.reg} 프로 담당 스카우트 없음`; }
  if(ofp!=null)ofp=Math.max(ofp,cur);
  /* 성장기가 끝난 선수는 잠재 능력이 현재를 크게 넘지 않는다(29세 +4, 30세 +2, 31세 이상 현재 그대로) */
  if(ofp!=null&&p.age>=29)ofp=Math.min(ofp,cur+Math.max(0,31-p.age)*2);
  const tools=Object.keys(p.r).map(k=>{ const c=Math.round(p.r[k]); const f=ofp!=null&&p.age<=26?clamp(Math.round(c+(ofp-cur)*.9),c,80):c; return {k,cur:c,fut:f}; });
  const tv={}; tools.forEach(t=>tv[t.k]=t.cur);
  const gb=new Set([...Object.values(GOOD),...Object.values(typeof BAD!=='undefined'?BAD:{})]), srt=[...tools].sort((a,b)=>b.cur-a.cur), top=srt[0], low=srt[srt.length-1]; /* 강점·약점 문장은 실제 툴 숫자로 다시 고른다(오차 섞인 예전 평가 문장이 표와 어긋나지 않게, 검수 11-06) */
  const notes=[...(top&&top.cur>=53&&GOOD[top.k]?[GOOD[top.k]]:[]),...(low&&low.cur<47&&typeof BAD!=='undefined'&&BAD[low.k]?[BAD[low.k]]:[]),...((r.cur!=null&&r.notes)||[]).filter(n=>!gb.has(n)&&!(ofp!=null&&/판단하지 못했습니다/.test(n)))]; /* 잠재력을 매겼으면 '판단 못 함' 문구는 지운다(검수 11-07) */ if(!notes.length&&top&&GOOD[top.k])notes.push(GOOD[top.k]);
  if(!own&&ofp==null)notes.push('잠재력은 그 지역 프로 담당 스카우트가 있어야 알 수 있습니다.');
  return Object.assign({},r,{who,sc,cur,ofp,tools,arch:archetype(tv,p),role:ofp!=null?roleOf(ofp,p):null,notes,risk:r.risk||'판단 불가',sd:ofp!=null?psd:99,conf:ofp!=null?sdConf(psd):'현재 능력만',exact:true});
}
function scoutReport0(p){
  const own=p.team===G.user&&!p.prospect; let sc=null, sd, who, futKnown=true, bias=0;
  if(p.prospect){ sc=bestScout(p.region,p); sd=prosSd(sc,p); /* 달력 월이 아니라 그 스카우트가 실제로 본 횟수만큼 오차가 준다(검수 11-08) */ futKnown=!!sc&&dcObs(p,sc)>0; who=sc?`${sc.name} 스카우트(${p.region})${futKnown?'':' · 관찰 전 임시 현재능력 추정'}`:'담당 스카우트 없음 · 관찰 전 임시 현재능력 추정'; if(p.gmSeen===G.year){ sd=(sc?sd*.7:SCOUT_SD[2])*gmSchK(p); /* 고교 방문한 학교 후보는 더(53_gm_schedule) */ futKnown=true; who=sc&&dcScoutObs(p,sc)>0?`${sc.name} 스카우트(${p.region}) · 단장 직접 관찰`:`단장 직접 관찰(${sc?sc.name+' 스카우트는 아직 관찰 전':'담당 스카우트 없음'})`; } }
  else if(own){ sc=bestScout(); const o=ownObs(p); sd=ownSd(p,sc); who=`전력분석팀·${sc?`${sc.name} 스카우트`:'코치진'} 합동 · 우리 팀에서 ${o?`${o}시즌 관찰`:'관찰 시작'}`; }
  else if(p.foreign&&p.team==null){ const r=origOf(p), lv=intlLv(r); const mf=fMineFind(p); const isc0=G.scouts.filter(s=>s.role==='intl'&&s.region===r).sort((a,b)=>effSkill(b)-effSkill(a))[0]; /* 같은 나라에 여럿이면 가장 뛰어난 사람 기준(검수 11-08) */ sd=INET[lv].sd*(1-fwatchK(p.id)/100*.7)*(mf?.7:1)*(p.fsis?.8:1)*(isc0?1-(effSkill(isc0)-1)*.06:1); /* 파견 스카우트 능력도 즉시 평가에 반영(능력 5면 오차 24% 감소, 적응 기간엔 한 단계 낮게, 검수 11-07) */ futKnown=mf||lv>=1||fwatchK(p.id)>=40; const isc=isc0; who=`${IREG[r].l} ${INET[lv].l}${isc?` · ${isc.name} 스카우트 파견`:''}${mf?' · 우리 스카우트가 직접 찾아 관찰':''}`; sc={id:'intl'+r+lv,skill:lv+1,name:IREG[r].l};
    /* 툴 평가는 실전 감각(p.sx)을 못 본다. 현지 사무소와 오래 지켜본 관찰 명단 선수, 우리가 직접 찾은 선수만 일부 보인다 */ bias=-(p.sx||0)*(lv>=3?.6:1)*(1-fwatchK(p.id)/100*.6)*(mf?.6:1); }
  else if(exOwnD(p)!=null){ const dd=exOwnD(p); sc=bestScout(); sd=clamp(ownSd(p,sc)*(1+dd/365*.6),1.5,8); who=`우리 팀 시절 자료 · 떠난 지 ${dd<60?`${dd}일`:`${Math.round(dd/30)}개월`}(시간이 지날수록 오차가 커집니다)`; } /* 우리 팀에 있던 선수는 떠난 뒤에도 2년 동안 그때 자료로 본다(카페 11-09: 보상선수로 떠난 우리 선수가 바로 '평가 없음') */
  else if(p.team!=null){ const cv=coverOf(p.team); const pub=publicP(p);
    if(!pub&&(!cv.sc||cv.sc.skill<3))return {who:cv.sc?`${cv.sc.name} 스카우트(${cv.reg})`:`${cv.reg} 담당 스카우트 없음`,sc:null,sd:99,conf:'없음',cur:null,ofp:null,tools:[],arch:'평가 없음',role:null,notes:[cv.sc?'1군 기록이 없는 2군 선수라 능력 3 이상 스카우트만 파악할 수 있습니다.':`${cv.reg} 지역을 맡은 스카우트가 없어 이 구단 선수는 평가하지 못했습니다. 기록만 볼 수 있습니다.`],risk:'판단 불가',eta:null,unseen:true};
    sc=cv.sc; sd=(sc?scSd(sc,p)*.8:SCOUT_SD[0])*anaEff(G.user).sdm; futKnown=false; who=sc?`${sc.name} 스카우트(${cv.reg} 프로 담당)`:`${cv.reg} 프로 담당 스카우트 없음 · 1군 기록으로 현재 능력만`; } /* 1군 공개 선수는 담당이 없어도 평가를 지우지 않고, 잠재력은 분석원 추정 경로로 넘긴다(검수 11-08) */
  else { const ps=G.scouts.filter(s=>s.role==='pro').sort((a,b)=>effSkill(b)-effSkill(a))[0]; sc=ps?Object.assign({},ps,{skill:effSkill(ps)}):null; sd=(sc?scSd(sc,p)*.8:SCOUT_SD[0])*anaEff(G.user).sdm; futKnown=!!sc; who=sc?`${sc.name} 스카우트(프로 담당)`:'프로 담당 스카우트 없음'; } /* 아마추어·해외 담당을 프로 담당으로 붙이지 않는다(검수 11-08) */
  const key=(sc?sc.id:'none')+(own?'own':'')+G.year+(p.prospect?(p.gmSeen===G.year?'g':''):halfK());
  const hp=futKnown?hidPen(p,sc,own):0, pv=p.pot-hp; const gap=Math.max(0,pv-ovr(p));
  const tools=Object.keys(p.r).map(k=>{ const n=hn('t'+k+key,p.id)*sd*.8+bias; const cur=clamp(r5(p.r[k]+n),20,80); const fut=clamp(r5(p.r[k]+gap*(p.age<=26?1:0)+n+hn('u'+k+key,p.id)*sd*.4),20,80); return {k,cur,fut:futKnown?Math.max(cur,fut):cur}; });
  const cur=clamp(r5(ovr(p)+bias+hn('c'+key,p.id)*sd*.55),20,80);
  let ofp=futKnown?clamp(Math.max(cur,r5(pv+bias+hn('f'+key,p.id)*sd)),20,80):null;
  if(ofp!=null&&!p.prospect&&p.age>=29)ofp=Math.min(ofp,cur+Math.max(0,31-p.age)*2);
  /* 아마추어: 담당 스카우트마다 좋아하는 툴이 있어 그 툴이 좋아 보이면 잠재력을 후하게 보고, 선수마다 마음에 들고 안 드는 인상도 있다(관찰을 늘려도 줄지 않는 오차) */
  if(ofp!=null&&p.prospect&&sc&&p.gmSeen!==G.year){ const pk=scoutPet(sc,p.isP); const t=tools.find(x=>x.k===pk); ofp=clamp(Math.max(cur,ofp+(t&&t.fut>=55?DC_PET_ADD:0)+hn('lk'+sc.id,p.id)*DC_LIKE_SD),20,80); } /* 인상 보정 뒤에도 현재 능력 아래로 내려가지 않는다(검수 11-06) */
  const tv={}; tools.forEach(t=>tv[t.k]=t.cur);
  const arch=archetype(tv,p);
  const sorted=[...tools].sort((a,b)=>b.cur-a.cur);
  const notes=[GOOD[sorted[0].k]];
  if(futKnown){
    if(sorted[sorted.length-1].cur<45)notes.push(BAD[sorted[sorted.length-1].k]);
    if(p.age<=26&&ofp!=null&&ofp-cur>=10)notes.push(p.prospect?`체격과 기술이 더 자랄 여지가 큽니다. ${ofp>=60?'팀의 미래를 걸어 볼 만합니다.':'꾸준히 키우면 1군 자원이 됩니다.'}`:`아직 다 자라지 않았습니다. 2~3년 안에 ${roleOf(ofp,p)}까지 기대합니다.`);
    if(p.age>=32)notes.push('하락세가 시작될 나이입니다. 장기 계약은 신중해야 합니다.');
    { const dh=dtHint(p,sd); if(dh&&(p.age<=30||p.dt==='vet'))notes.push(dh); }
    if(!p.prospect&&!p.foreign){ const pf=perfOvr(p,2); if(pf!=null){ if(pf-cur>=8)notes.push('최근 기록이 우리 평가보다 좋습니다. 수비·타구 결과·표본의 영향이 섞였을 수 있어 기록만으로 값을 매기기는 어렵습니다.'); else if(cur-pf>=8)notes.push('우리 평가가 최근 기록보다 높습니다. 나아질 가능성은 있으나 지금 기록만으로 확정하기 어렵습니다.'); } }
    if(p.foreign&&p.prev&&p.team==null){ notes.push(LG_LV[p.prevLvl]?`${p.prevLvl}: ${LG_LV[p.prevLvl][0]}. ${LG_LV[p.prevLvl][1]}`:`${p.prevLvl} 기록은 리그 수준 차이를 감안해야 합니다.`); const lv=intlLv(origOf(p)); if(lv>=2&&p.adapt!=null){ if(p.adapt>=62)notes.push('성격이 밝고 생활 적응력이 좋아 첫해부터 제 실력을 낼 것으로 봅니다.'); else if(p.adapt<=38)notes.push('낯선 환경에 예민한 편입니다. 첫 시즌 적응에 애를 먹을 수 있습니다.'); else notes.push('적응력은 평범한 수준입니다.'); } }
    if(p.inj>.24&&sd<=7.5)notes.push('잔부상이 잦은 체질입니다. 부상 위험이 높습니다.');
    if(p.hidT&&!p.hidR&&!hp)notes.push('다른 구단 스카우트들이 놓치기 쉬운 재능으로 봅니다. 잠재력이 겉보기보다 큽니다.');
    if(p.prospect&&p.amLevel&&sc&&sc.skill>=4)notes.push(`아마추어 기록은 ${p.amLevel}니다.`);
  } else notes.push(p.foreign&&p.team==null?'에이전트가 보낸 영상과 기록뿐이라 실제 기량과 잠재력은 불확실합니다. 해외 스카우트망을 넓히면 정확해집니다.':p.prospect?(sc?'담당 스카우트가 아직 직접 보지 못했습니다. 현재 능력은 관찰 전 임시 추정이고, 잠재력은 첫 관찰 뒤에 나옵니다.':'이 지역을 맡은 스카우트가 없어 잠재력은 판단하지 못했습니다. 현재능력은 관찰 전 임시 추정입니다.'):'스카우트가 없어 잠재력은 판단하지 못했습니다.');
  const risk=!futKnown?'판단 불가':(gap>14||p.inj>.26)&&p.age<=24?'높음':gap>8||p.inj>.22?'보통':'낮음';
  const eta=p.prospect&&futKnown?Math.max(1,Math.ceil((48-cur)/4)):null;
  const conf=sdConf(sd);
  return {who,sc,sd,conf,cur,ofp,tools,arch,role:ofp!=null?roleOf(ofp,p):null,notes,risk,eta};
}

/* ===== 표시 도구 ===== */
function money(v){ const neg=v<0; v=Math.abs(Math.round(v)); if(v===0)return '0원'; let s; if(v>=100)s=(v/100).toFixed(2).replace(/\.?0+$/,'')+'억'; else s=(v*100).toLocaleString('ko-KR')+'만'; return (neg?'-':'')+s; }
const fmt3=x=>x.toFixed(3).replace(/^0/,'');
function curLine(p){ // 이번 시즌 합계(1군 우선), 없으면 지난 시즌
  const y=period()==='pre'?G.year-1:G.year;
  /* 시즌 초 1~2경기 표본은 보여 주지 않는다: 30타석·10이닝 전까지는 지난 시즌 기록 */
  const h=seasonTotal(p,y,'1군'); const fin=period()==='pre'||period()==='post'; const ok=h&&(fin||(p.isP?h.outs>=30:h.pa>=30)); /* 끝난 시즌은 표본이 작아도 그 시즌 기록(검수 11-08) */
  return (ok?h:null)||seasonTotal(p,y-1,'1군')||h||seasonTotal(p,y,'퓨처스')||seasonTotal(p,y-1,'퓨처스');
}
/* 기록 연도 표시: 화면마다 올해 기록인지 지난 기록인지 헷갈리지 않게 */
function yrTag(h){ return h?`${h.y}${h.lvl==='퓨처스'?' 2군':''}`:''; }
function statLine(h,p){ if(!h)return '기록 없음';
  const lv=h.lvl==='퓨처스'?'2군 ':'';
  if(p.isP){ const r=pRate(h); return `${lv}ERA ${h.outs?r.era.toFixed(2):'-'} · ${ipStr(h.outs)}이닝 · WAR ${warOf(h,p).toFixed(1)}${h.sv?` · ${h.sv}세이브`:h.hld?` · ${h.hld}홀드`:h.gs?` · ${h.w}승`:''}`; }
  const r=bRate(h); return `${lv}OPS ${h.pa?fmt3(r.ops):'-'} · ${h.hr}홈런 · WAR ${warOf(h,p).toFixed(1)}${h.e?` · 실책 ${h.e}`:''}`; }


