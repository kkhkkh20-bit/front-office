/* ===== 스카우트 리포트: 숨은 능력을 오차를 섞어 보여준다 ===== */
const TOOLK={con:'컨택',pow:'파워',eye:'선구안',spd:'주루',def:'수비',vit:'체력',stf:'구위',ctl:'제구',sta:'체력'};
const GOOD={vit:'체력이 좋아 연속 출장에도 지치지 않습니다.',con:'배트 컨트롤이 좋아 삼진을 잘 당하지 않습니다.',pow:'타구에 힘이 실려 장타를 기대할 수 있습니다.',eye:'공을 오래 보고 볼넷을 골라냅니다.',spd:'발이 빨라 내야안타와 도루가 됩니다.',def:'수비 범위와 송구가 안정적입니다.',stf:'구위로 타자를 압도합니다.',ctl:'원하는 곳에 던지는 제구가 됩니다.',sta:'긴 이닝을 버틸 체력이 있습니다.'};
const BAD={vit:'체력이 약해 연속 출장이 이어지면 성적이 떨어집니다.',con:'변화구 대처가 약해 삼진이 많습니다.',pow:'장타력이 부족합니다.',eye:'유인구에 방망이가 쉽게 나갑니다.',spd:'주력이 느립니다.',def:'수비에서 실수가 잦습니다.',stf:'구위가 평범해 정타를 자주 허용합니다.',ctl:'제구가 흔들려 볼넷이 많습니다.',sta:'투구 수가 늘면 구위가 떨어집니다.'};
function coverOf(tid){ const reg=team(tid).region; return {reg,sc:scoutOf('pro',reg)}; }
function publicP(p){ return p.hist.some(h=>h.lvl==='1군'&&h.y>=G.year-1&&(h.pa>=10||h.outs>=9)); }
function bestScout(region){ if(region)return scoutOf('am',region); const s=[...G.scouts].sort((a,b)=>effSkill(b)-effSkill(a))[0]; return s?Object.assign({},s,{skill:effSkill(s)}):null; }
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
function ownSd(p,sc){ const b=sc?scSd(sc,p):SCOUT_SD[0]; return clamp(b*anaEff(G.user).sdm*(1-Math.min(.45,ownObs(p)*.15)),1.5,8); }
/* 겉 포장: 외국인은 1년 보고 뽑으므로 '장래'를 말하지 않고 올해 기량만 말한다. 갓 지명한 우리 신인은 첫 실전 전까지 지명 당시 스카우트 평가를 유지한다 */
function scoutReport(p){ let r=scoutReport1(p); if(!r)return r;
  if(p.foreign){ const c=r.cur; r=Object.assign({},r,{ofp:c,role:c!=null?roleOf(c,p):null,tools:(r.tools||[]).map(t=>({...t,fut:t.cur})),notes:(r.notes||[]).filter(n=>!/다 자라지|더 자랄 여지|잠재력/.test(n)),eta:null,now1:true}); }
  else if(p.team===G.user&&p.dEst&&ownObs(p)===0){ const d=p.dEst; const o=Math.max(r.cur??0,d.ofp); r=Object.assign({},r,{ofp:o,sd:d.sd,conf:sdConf(d.sd),who:`${d.who} · 지명 당시 평가(실전 기록이 쌓이면 코치진이 다시 봅니다)`,role:roleOf(o,p)}); }
  return r; }
function scoutReport1(p){ // KBO 소속 선수는 현재 능력(오버롤)을 정확히 보여 준다. 잠재력은 우리 선수, 또는 프로 담당 스카우트가 있는 지역 구단 선수만
  const r=scoutReport0(p); if(p.prospect||(p.foreign&&p.team==null))return r;
  const ref=p.team!=null?p.team:p.faFrom; if(ref==null)return r;
  const own=ref===G.user; const cur=Math.round(ovr(p)); let ofp=own?r.ofp:null, who=r.who, sc=r.sc, psd=own?r.sd:99;
  if(!own){ const cv=coverOf(ref); if(cv.sc){ const sd=scSd(cv.sc,p)*anaEff(G.user).sdm; psd=sd; ofp=clamp(r5(p.pot+hn('pf'+cv.sc.id+G.year+halfK(),p.id)*sd),20,80); who=`${cv.sc.name} 스카우트(${cv.reg} 프로 담당)`; sc=cv.sc; }
    /* 그 지역 프로 스카우트가 없어도 트래킹 분석원이 1군 경기 데이터로 거칠게 추정한다(오차 큼) */
    else if(anaPow('trk',G.user)>=2&&publicP(p)){ const sd=9.5*anaEff(G.user).sdm; psd=sd; ofp=clamp(r5(p.pot+hn('pa'+G.year+halfK(),p.id)*sd),20,80); who=`전력분석팀 데이터 추정(${cv.reg} 프로 스카우트 없음)`; }
    else who=`${cv.reg} 프로 담당 스카우트 없음`; }
  if(ofp!=null)ofp=Math.max(ofp,cur);
  /* 성장기가 끝난 선수는 잠재 능력이 현재를 크게 넘지 않는다(29세 +4, 30세 +2, 31세 이상 현재 그대로) */
  if(ofp!=null&&p.age>=29)ofp=Math.min(ofp,cur+Math.max(0,31-p.age)*2);
  const tools=Object.keys(p.r).map(k=>{ const c=Math.round(p.r[k]); const f=ofp!=null&&p.age<=26?clamp(Math.round(c+(ofp-cur)*.9),c,80):c; return {k,cur:c,fut:f}; });
  const tv={}; tools.forEach(t=>tv[t.k]=t.cur);
  const notes=r.cur!=null&&r.notes&&r.notes.length?r.notes.slice():[GOOD[[...tools].sort((a,b)=>b.cur-a.cur)[0].k]];
  if(!own&&ofp==null)notes.push('잠재력은 그 지역 프로 담당 스카우트가 있어야 알 수 있습니다.');
  return Object.assign({},r,{who,sc,cur,ofp,tools,arch:archetype(tv,p),role:ofp!=null?roleOf(ofp,p):null,notes,risk:r.risk||'판단 불가',sd:ofp!=null?psd:99,conf:ofp!=null?sdConf(psd):'현재 능력만',exact:true});
}
function scoutReport0(p){
  const own=p.team===G.user&&!p.prospect; let sc=null, sd, who, futKnown=true, bias=0;
  if(p.prospect){ sc=bestScout(p.region); const mo=dobj(G.day).m; sd=scSd(sc,p)*(mo<=5?1.35:mo<=8?1.12:1); futKnown=!!sc; who=sc?`${sc.name} 스카우트(${p.region})`:'담당 스카우트 없음'; if(p.gmSeen===G.year){ sd=sc?sd*.7:SCOUT_SD[2]; futKnown=true; who+=' · 단장 직접 관찰'; } }
  else if(own){ sc=bestScout(); const o=ownObs(p); sd=ownSd(p,sc); who=`전력분석팀·${sc?`${sc.name} 스카우트`:'코치진'} 합동 · 우리 팀에서 ${o?`${o}시즌 관찰`:'관찰 시작'}`; }
  else if(p.foreign&&p.team==null){ const r=origOf(p), lv=intlLv(r); sd=INET[lv].sd*(1-fwatchK(p.id)/100*.7); futKnown=lv>=1||fwatchK(p.id)>=40; const isc=G.scouts.find(s=>s.role==='intl'&&s.region===r); who=`${IREG[r].l} ${INET[lv].l}${isc?` · ${isc.name} 스카우트 파견`:''}`; sc={id:'intl'+r+lv,skill:lv+1,name:IREG[r].l};
    /* 툴 평가는 실전 감각(p.sx)을 못 본다. 현지 사무소와 오래 지켜본 관찰 명단 선수만 일부 보인다 */ bias=-(p.sx||0)*(lv>=3?.6:1)*(1-fwatchK(p.id)/100*.6); }
  else if(p.team!=null){ const cv=coverOf(p.team); const pub=publicP(p);
    if(!cv.sc||(!pub&&cv.sc.skill<3))return {who:cv.sc?`${cv.sc.name} 스카우트(${cv.reg})`:`${cv.reg} 담당 스카우트 없음`,sc:null,sd:99,conf:'없음',cur:null,ofp:null,tools:[],arch:'평가 없음',role:null,notes:[cv.sc?'1군 기록이 없는 2군 선수라 능력 3 이상 스카우트만 파악할 수 있습니다.':`${cv.reg} 지역을 맡은 스카우트가 없어 이 구단 선수는 평가하지 못했습니다. 기록만 볼 수 있습니다.`],risk:'판단 불가',eta:null,unseen:true};
    sc=cv.sc; sd=scSd(sc,p)*.8*anaEff(G.user).sdm; futKnown=false; who=`${sc.name} 스카우트(${cv.reg} 프로 담당)`; }
  else { sc=bestScout(); sd=(sc?scSd(sc,p)*.8:SCOUT_SD[0])*anaEff(G.user).sdm; futKnown=!!sc; who=sc?`${sc.name} 스카우트(프로 담당)`:'스카우트 없음'; }
  const key=(sc?sc.id:'none')+(own?'own':'')+G.year+(p.prospect?(p.gmSeen===G.year?'g':''):halfK());
  const gap=Math.max(0,p.pot-ovr(p));
  const tools=Object.keys(p.r).map(k=>{ const n=hn('t'+k+key,p.id)*sd*.8+bias; const cur=clamp(r5(p.r[k]+n),20,80); const fut=clamp(r5(p.r[k]+gap*(p.age<=26?1:0)+n+hn('u'+k+key,p.id)*sd*.4),20,80); return {k,cur,fut:futKnown?Math.max(cur,fut):cur}; });
  const cur=clamp(r5(ovr(p)+bias+hn('c'+key,p.id)*sd*.55),20,80);
  let ofp=futKnown?clamp(Math.max(cur,r5(p.pot+bias+hn('f'+key,p.id)*sd)),20,80):null;
  if(ofp!=null&&!p.prospect&&p.age>=29)ofp=Math.min(ofp,cur+Math.max(0,31-p.age)*2);
  /* 아마추어: 담당 스카우트마다 좋아하는 툴이 있어 그 툴이 좋아 보이면 잠재력을 후하게 보고, 선수마다 마음에 들고 안 드는 인상도 있다(관찰을 늘려도 줄지 않는 오차) */
  if(ofp!=null&&p.prospect&&sc&&p.gmSeen!==G.year){ const pk=scoutPet(sc,p.isP); const t=tools.find(x=>x.k===pk); ofp=clamp(ofp+(t&&t.fut>=55?DC_PET_ADD:0)+hn('lk'+sc.id,p.id)*DC_LIKE_SD,20,80); }
  const tv={}; tools.forEach(t=>tv[t.k]=t.cur);
  const arch=archetype(tv,p);
  const sorted=[...tools].sort((a,b)=>b.cur-a.cur);
  const notes=[GOOD[sorted[0].k]];
  if(futKnown){
    if(sorted[sorted.length-1].cur<45)notes.push(BAD[sorted[sorted.length-1].k]);
    if(p.age<=26&&ofp!=null&&ofp-cur>=10)notes.push(p.prospect?`체격과 기술이 더 자랄 여지가 큽니다. ${ofp>=60?'팀의 미래를 걸어 볼 만합니다.':'꾸준히 키우면 1군 자원이 됩니다.'}`:`아직 다 자라지 않았습니다. 2~3년 안에 ${roleOf(ofp,p)}까지 기대합니다.`);
    if(p.age>=32)notes.push('하락세가 시작될 나이입니다. 장기 계약은 신중해야 합니다.');
    { const dh=dtHint(p,sd); if(dh&&(p.age<=30||p.dt==='vet'))notes.push(dh); }
    if(!p.prospect&&!p.foreign){ const pf=perfOvr(p,2); if(pf!=null){ if(pf-cur>=8)notes.push('최근 기록은 실력보다 운이 따른 면이 있습니다. 기록만 보고 비싸게 사면 위험합니다.'); else if(cur-pf>=8)notes.push('기록보다 실력이 좋습니다. 반등을 기대할 만합니다.'); } }
    if(p.foreign&&p.prev&&p.team==null){ notes.push(LG_LV[p.prevLvl]?`${p.prevLvl}: ${LG_LV[p.prevLvl][0]}. ${LG_LV[p.prevLvl][1]}`:`${p.prevLvl} 기록은 리그 수준 차이를 감안해야 합니다.`); const lv=intlLv(origOf(p)); if(lv>=2&&p.adapt!=null){ if(p.adapt>=62)notes.push('성격이 밝고 생활 적응력이 좋아 첫해부터 제 실력을 낼 것으로 봅니다.'); else if(p.adapt<=38)notes.push('낯선 환경에 예민한 편입니다. 첫 시즌 적응에 애를 먹을 수 있습니다.'); else notes.push('적응력은 평범한 수준입니다.'); } }
    if(p.inj>.24&&sd<=7.5)notes.push('잔부상이 잦은 체질입니다. 부상 위험이 높습니다.');
    if(p.prospect&&p.amLevel&&sc&&sc.skill>=4)notes.push(`아마추어 기록은 ${p.amLevel}니다.`);
  } else notes.push(p.foreign&&p.team==null?'에이전트가 보낸 영상과 기록뿐이라 실제 기량과 잠재력은 불확실합니다. 해외 스카우트망을 넓히면 정확해집니다.':p.prospect?'이 지역을 맡은 스카우트가 없어 잠재력은 판단하지 못했습니다.':'스카우트가 없어 잠재력은 판단하지 못했습니다.');
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
  const h=seasonTotal(p,y,'1군'); const ok=h&&(p.isP?h.outs>=30:h.pa>=30);
  return (ok?h:null)||seasonTotal(p,y-1,'1군')||h||seasonTotal(p,y,'퓨처스')||seasonTotal(p,y-1,'퓨처스');
}
function statLine(h,p){ if(!h)return '기록 없음';
  const lv=h.lvl==='퓨처스'?'2군 ':'';
  if(p.isP){ const r=pRate(h); return `${lv}ERA ${h.outs?r.era.toFixed(2):'-'} · ${ipStr(h.outs)}이닝 · WAR ${warOf(h,p).toFixed(1)}${h.sv?` · ${h.sv}세이브`:h.hld?` · ${h.hld}홀드`:h.gs?` · ${h.w}승`:''}`; }
  const r=bRate(h); return `${lv}OPS ${h.pa?fmt3(r.ops):'-'} · ${h.hr}홈런 · WAR ${warOf(h,p).toFixed(1)}`; }


