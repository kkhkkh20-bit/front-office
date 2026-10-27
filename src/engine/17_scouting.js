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
function scoutReport(p){ // KBO 소속 선수는 현재 능력(오버롤)을 정확히 보여 준다. 잠재력은 우리 선수, 또는 프로 담당 스카우트가 있는 지역 구단 선수만
  const r=scoutReport0(p); if(p.prospect||(p.foreign&&p.team==null))return r;
  const ref=p.team!=null?p.team:p.faFrom; if(ref==null)return r;
  const own=ref===G.user; const cur=Math.round(ovr(p)); let ofp=own?r.ofp:null, who=r.who, sc=r.sc;
  if(!own){ const cv=coverOf(ref); if(cv.sc){ const sd=SCOUT_SD[cv.sc.skill]; ofp=clamp(r5(p.pot+hn('pf'+cv.sc.id+G.year,p.id)*sd),20,80); who=`${cv.sc.name} 스카우트(${cv.reg} 프로 담당)`; sc=cv.sc; } else who=`${cv.reg} 프로 담당 스카우트 없음`; }
  if(ofp!=null)ofp=Math.max(ofp,cur);
  /* 성장기가 끝난 선수는 잠재 능력이 현재를 크게 넘지 않는다(29세 +4, 30세 +2, 31세 이상 현재 그대로) */
  if(ofp!=null&&p.age>=29)ofp=Math.min(ofp,cur+Math.max(0,31-p.age)*2);
  const tools=Object.keys(p.r).map(k=>{ const c=Math.round(p.r[k]); const f=ofp!=null&&p.age<=26?clamp(Math.round(c+(ofp-cur)*.9),c,80):c; return {k,cur:c,fut:f}; });
  const tv={}; tools.forEach(t=>tv[t.k]=t.cur);
  const notes=r.cur!=null&&r.notes&&r.notes.length?r.notes.slice():[GOOD[[...tools].sort((a,b)=>b.cur-a.cur)[0].k]];
  if(!own&&ofp==null)notes.push('잠재력은 그 지역 프로 담당 스카우트가 있어야 알 수 있습니다.');
  return Object.assign({},r,{who,sc,cur,ofp,tools,arch:archetype(tv,p),role:ofp!=null?roleOf(ofp,p):null,notes,risk:r.risk||'판단 불가',conf:own?r.conf:ofp!=null?r.conf||'보통':'현재 능력만',exact:true});
}
function scoutReport0(p){
  const own=p.team===G.user&&!p.prospect; let sc=null, sd, who, futKnown=true;
  if(p.prospect){ sc=bestScout(p.region); const mo=dobj(G.day).m; sd=(sc?SCOUT_SD[sc.skill]:SCOUT_SD[0])*(mo<=5?1.35:mo<=8?1.12:1); futKnown=!!sc; who=sc?`${sc.name} 스카우트(${p.region})`:'담당 스카우트 없음'; }
  else if(own){ sc=bestScout(); sd=sc?Math.min(3,SCOUT_SD[sc.skill]):3.5; who='코치진·스카우트 합동'; }
  else if(p.foreign&&p.team==null){ const r=origOf(p), lv=intlLv(r); sd=INET[lv].sd*(1-fwatchK(p.id)/100*.7); futKnown=lv>=1||fwatchK(p.id)>=40; const isc=G.scouts.find(s=>s.role==='intl'&&s.region===r); who=`${IREG[r].l} ${INET[lv].l}${isc?` · ${isc.name} 스카우트 파견`:''}`; sc={id:'intl'+r+lv,skill:lv+1,name:IREG[r].l}; }
  else if(p.team!=null){ const cv=coverOf(p.team); const pub=publicP(p);
    if(!cv.sc||(!pub&&cv.sc.skill<3))return {who:cv.sc?`${cv.sc.name} 스카우트(${cv.reg})`:`${cv.reg} 담당 스카우트 없음`,sc:null,sd:99,conf:'없음',cur:null,ofp:null,tools:[],arch:'평가 없음',role:null,notes:[cv.sc?'1군 기록이 없는 2군 선수라 능력 3 이상 스카우트만 파악할 수 있습니다.':`${cv.reg} 지역을 맡은 스카우트가 없어 이 구단 선수는 평가하지 못했습니다. 기록만 볼 수 있습니다.`],risk:'판단 불가',eta:null,unseen:true};
    sc=cv.sc; sd=SCOUT_SD[sc.skill]*.8*anaEff(G.user).sdm; futKnown=false; who=`${sc.name} 스카우트(${cv.reg} 프로 담당)`; }
  else { sc=bestScout(); sd=(sc?SCOUT_SD[sc.skill]*.8:SCOUT_SD[0])*anaEff(G.user).sdm; futKnown=!!sc; who=sc?`${sc.name} 스카우트(프로 담당)`:'스카우트 없음'; }
  const key=(sc?sc.id:'none')+(own?'own':'')+G.year;
  const gap=Math.max(0,p.pot-ovr(p));
  const tools=Object.keys(p.r).map(k=>{ const n=hn('t'+k+key,p.id)*sd*.8; const cur=clamp(r5(p.r[k]+n),20,80); const fut=clamp(r5(p.r[k]+gap*(p.age<=26?1:0)+n+hn('u'+k+key,p.id)*sd*.4),20,80); return {k,cur,fut:futKnown?Math.max(cur,fut):cur}; });
  const cur=clamp(r5(ovr(p)+hn('c'+key,p.id)*sd*.55),20,80);
  let ofp=futKnown?clamp(Math.max(cur,r5(p.pot+hn('f'+key,p.id)*sd)),20,80):null;
  if(ofp!=null&&!p.prospect&&p.age>=29)ofp=Math.min(ofp,cur+Math.max(0,31-p.age)*2);
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
    if(p.foreign&&p.prev&&!p.team){ notes.push(`${p.prevLvl} 기록은 리그 수준 차이를 감안해야 합니다.`); const lv=intlLv(origOf(p)); if(lv>=2&&p.adapt!=null){ if(p.adapt>=62)notes.push('성격이 밝고 생활 적응력이 좋아 첫해부터 제 실력을 낼 것으로 봅니다.'); else if(p.adapt<=38)notes.push('낯선 환경에 예민한 편입니다. 첫 시즌 적응에 애를 먹을 수 있습니다.'); else notes.push('적응력은 평범한 수준입니다.'); } }
    if(p.inj>.24&&sd<=7.5)notes.push('잔부상이 잦은 체질입니다. 부상 위험이 높습니다.');
    if(p.prospect&&p.amLevel&&sc&&sc.skill>=4)notes.push(`아마추어 기록은 ${p.amLevel}니다.`);
  } else notes.push(p.foreign&&!p.team?'에이전트가 보낸 영상과 기록뿐이라 실제 기량과 잠재력은 불확실합니다. 해외 스카우트망을 넓히면 정확해집니다.':p.prospect?'이 지역을 맡은 스카우트가 없어 잠재력은 판단하지 못했습니다.':'스카우트가 없어 잠재력은 판단하지 못했습니다.');
  const risk=!futKnown?'판단 불가':(gap>14||p.inj>.26)&&p.age<=24?'높음':gap>8||p.inj>.22?'보통':'낮음';
  const eta=p.prospect&&futKnown?Math.max(1,Math.ceil((48-cur)/4)):null;
  const conf=sd<=3.5?'매우 높음':sd<=5.5?'높음':sd<=8?'보통':'낮음';
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


