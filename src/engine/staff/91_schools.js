/* ===== 고교 야구부와 고교 감독 (사용자 11-08c: 고등학교도 데이터로, 고교 감독과 친해져 스카우팅을 편하게, 은퇴 선수가 고교 감독으로) =====
   AREA(12_scout_area.js)의 고교마다 학교 객체(G.schools[이름])를 둔다: 권역·전력(lv)·감독(사람)·구단별 친분(rel).
   감독은 우리 풀에서 온다: 은퇴 선수(OB) 중 모교 > 같은 권역 > 그 밖의 순서. 새 게임 첫 세계와 OB가 모자랄 때만 선수 출신처럼 만든 사람을 앉힌다.
   친분은 스카우트 방문(매달)·단장 대회 관전·그 학교 선수 지명·후원으로 오른다. 친분이 높을수록 그 학교 후보 평가 오차가 줄고(최대 8%),
   감독이 "우리 애 하나 좋은 놈 있습니다" 귀띔 메일을 보낸다(귀띔받은 선수는 오차가 15% 더 준다).
   이름난 고교 감독은 겨울에 스태프 시장(2군·잔류군 코치, 스카우트)에 나오고, 프로로 가면 학교는 새 감독을 맞는다.
   우리 구단 출신이 감독인 학교는 처음부터 친분이 높다 */
const HS_STY=['엄격형','자율형','데이터형','육성형'];
function schList(){ if(!G.schools)schInit(); return G.schools; }
function schInit(){ G.schools={}; G.schOut=G.schOut||[]; for(const a of AREA)for(const n of a.hs){ const S={n,area:a.k,lv:Math.round(clamp(N(55,10),30,85)),coach:null,rel:{},gy:0}; G.schools[n]=S; S.coach=schNewCoach(S,true); } return G.schools; }
const schOf=p=>p&&p.school?schList()[p.school]||null:null;
function schRel0(S,tid){ return Math.round(clamp(20+(teamArea(tid)===S.area?15:0)+(S.coach&&S.coach.from===tid?20:0),0,100)); }
function schRel(S,tid){ tid=tid??G.user; if(S.rel[tid]==null)S.rel[tid]=schRel0(S,tid); return S.rel[tid]; }
function schAdd(S,d,tid){ if(!S)return; tid=tid??G.user; S.rel[tid]=Math.round(clamp(schRel(S,tid)+d,0,100)); }
const schRelLbl=v=>v>=75?'형님 동생':v>=60?'가까움':v>=40?'안면 있음':v>=25?'데면데면':'모르는 사이';
/* 새 감독: 은퇴 선수(OB) 우선. seed(첫 세계)면 모교·같은 권역 연고가 있는 OB만 쓰고 나머지는 선수 출신처럼 만든다 */
function schNewCoach(S,seed,skip){ let ob=null;
  try{ const L=G.ob?G.ob.filter(o=>o.id!==skip&&o.age>=33&&o.age<=64&&o.path!=='media'&&obWhere(o).k==='free'&&!Object.values(G.schools||{}).some(x=>x.coach&&x.coach.ob===o.id)):[]; ob=L.find(o=>o.school===S.n)||L.find(o=>o.area===S.area)||(!seed&&L.length&&R()<.85?pick(L):null); }catch(e){}
  if(ob){ ob.alt={k:'hs',t:`${S.n} 감독`}; (ob.log=ob.log||[]).push({y:G.year,t:`${S.n} 감독 부임`});
    return {id:'h'+ob.id,name:ob.name,age:ob.age,sty:HS_STY[Math.floor(u01('hsty',ob.id)*4)],rep:Math.round(clamp(40+ob.fame/3+N(0,6),30,92)),ob:ob.id,from:ob.team,car:`전 ${tshort(ob.team)} ${ob.pos} · 통산 ${ob.seasons}시즌 WAR ${ob.war}`,alma:ob.school===S.n,y0:G.year}; }
  let from=null; try{ from=pick(G.teams).id; }catch(e){}
  return {id:'h'+Math.floor(R()*1e9),name:genName(),age:ri(38,62),sty:pick(HS_STY),rep:Math.round(clamp(N(50,12),25,85)),ob:null,from,car:`${exCareer('bc')} · 고교 지도자`,alma:R()<.3,y0:G.year-ri(0,12)}; }
/* 감독 교체: 친분은 새 감독 기준으로 다시 시작한다(전 감독과 쌓은 정은 조금만 남는다) */
function schSetCoach(S,c,why){ const old=S.coach; if(old&&old.id!==c.id)schDropMarket(old.id); if(old&&old.ob&&G.ob){ const o=G.ob.find(x=>x.id===old.ob); if(o&&o.alt&&o.alt.k==='hs')o.alt=null; } S.coach=c;
  for(const t in S.rel){ const r0=schRel0(S,+t); S.rel[t]=Math.round(r0+(S.rel[t]-r0)*.25); }
  if(c.ob){ const o=G.ob&&G.ob.find(x=>x.id===c.ob); if(o&&(o.fame>=60||o.team===G.user))try{ wire('아마',`${tshort(o.team)} 출신 ${c.name}, ${c.alma?'모교 ':''}${S.n} 감독 부임`,{tid:o.team}); }catch(e){}
    if(o&&o.team===G.user)try{ mail('스카우트팀',`우리 구단 출신 ${c.name}, ${S.n} 감독으로`,`${c.name}(${c.car})이(가) ${S.n} 감독을 맡았습니다. 우리 구단 출신이라 처음부터 ${schRelLbl(schRel(S))} 사이입니다. 그 학교 선수 정보가 더 잘 들어옵니다.`,{kind:'스카우트'}); }catch(e){} }
  return why; }
/* 겨울: 감독 나이·은퇴·교체, 학교 전력 변화, 이름난 감독은 스태프 시장으로 */
function schYear(){ const L=Object.values(schList()); let out=0;
  for(const S of L){ const c=S.coach; c.age++; for(const x of [...(G.cmarket||[]),...(G.scoutMarket||[])])if(schPerson(x)===c.id)x.age=c.age; S.lv=Math.round(clamp(S.lv+N(0,3)+(c.sty==='육성형'?.6:0),25,90));
    if(c.age>=66||R()<.05){ if(c.ob&&G.ob){ const o=G.ob.find(x=>x.id===c.ob); if(o)o.log.push({y:G.year,t:`${S.n} 감독에서 물러남`}); } schSetCoach(S,schNewCoach(S,false)); continue; }
    if(out<3&&c.rep>=62&&c.age<=60&&R()<.15){ out++; schToMarket(S); } }
  for(const S of L)for(const t in S.rel)if(S.rel[t]>35)S.rel[t]=Math.round(S.rel[t]-(S.rel[t]-35)*.08); /* 안 챙기면 조금씩 식는다 */
  for(const t in G.areaVisitT||{})for(const k in G.areaVisitT[t])G.areaVisitT[t][k]=Math.floor(G.areaVisitT[t][k]/2); /* 단장 관전 실적은 해가 바뀌면 절반으로(검수 11-09e #17) */ }
/* 고교 감독이 프로 스태프 후보로: 절반은 2군·잔류군 코치, 절반은 스카우트(그 권역 인맥) */
function schToMarket(S){ const c=S&&S.coach; if(!c||c.age>=66)return null; const listed=[...(G.cmarket||[]),...(G.scoutMarket||[])].filter(x=>schPerson(x)===c.id); if(listed.length){const keep=listed[0];schDropMarket(c.id,keep);return keep;} const sk=Math.round(clamp(40+c.rep*.3+N(0,4),35,75)), dv=Math.round(clamp(46+c.rep*.3+(c.sty==='육성형'?5:0)+N(0,4),35,80));
  if(R()<.5){ const x=mkCoach(pick(['fm','fp','fb','fd','rs','rb'])); x.id='c'+c.id; x.name=c.name; x.age=c.age; x.car=`${S.n} 감독 ${G.year-c.y0+1}년 · ${c.car}`; x.hs=S.n; x.hsCoach=c.id; if(c.ob)x.ob=c.ob; for(const k of CDOM[x.role])x.ab[k]=clamp(sk+ri(-3,3),25,85); x.ab.yng=clamp(dv,25,88); coachSync(x); x.sal=round5(clamp(60+(Math.max(x.sk,x.dv)-50)*4,45,200));
    (G.cmarket=G.cmarket||[]).push(x); G.schOut.push({id:x.id,k:'c',n:S.n}); return x; }
  const s=stAttr(mkScout(clamp(Math.round(c.rep/22),2,4))); s.id='s'+c.id; s.name=c.name; s.age=c.age; s.area=S.area; s.region=areaDef(S.area).reg; s.hs=S.n; s.hsCoach=c.id; s.car=`${S.n} 감독 출신 · ${S.area} 고교 인맥`; if(c.ob)s.ob=c.ob;
  (G.scoutMarket=G.scoutMarket||[]).push(s); G.schOut.push({id:s.id,k:'s',n:S.n}); return s; }
/* 같은 학교 감독의 코치·스카우트 카드는 하나의 사람이다. 구 저장의 역할 접두사 ID도 읽는다. */
function schPerson(k){return k&&k.hs?(k.hsCoach||(/^[cs]h/.test(String(k.id))?String(k.id).slice(1):null)):null;}
function schDropMarket(person,keep){
  for(const key of ['cmarket','scoutMarket'])if(G[key])G[key]=G[key].filter(x=>schPerson(x)!==person||x===keep);
  G.schOut=(G.schOut||[]).filter(x=>(x.person||String(x.id).slice(1))!==person||(keep&&x.id===keep.id));
  if(keep){let seen=false;G.schOut=G.schOut.filter(x=>{if(x.id!==keep.id)return true;if(seen)return false;seen=true;return true;});}
}
function schStaffAt(k){const person=schPerson(k);if(!person)return null;const same=x=>x&&schPerson(x)===person;
  for(const t of G.teams||[]){const c=Object.values(G.coach?.[t.id]||{}).find(same);if(c)return {tid:t.id,k:c};}
  const mine=[...(G.coachX||[]),...(G.scouts||[])].find(same);if(mine)return {tid:G.user,k:mine};
  for(const [tid,L]of Object.entries(G.lgStaff||{})){const c=(L.sc||[]).find(same);if(c)return {tid:+tid,k:c};}
  for(const [tid,L]of Object.entries(G.orgT||{})){const c=(L.coachX||[]).find(same);if(c)return {tid:+tid,k:c};}return null;
}
/* 후보 조회/실행 전에 검사한다. 프로 입성 뒤 계약 종료로 돌아온 사람은 학교가 바뀌어도 재취업할 수 있다. */
function schMarketWhy(k){const person=schPerson(k);if(!person)return '';if(schStaffAt(k))return '이미 프로 구단에 재직 중인 학교 출신 지도자입니다.';
  if(k.schPro||k.since>=0||k.cs!=null)return '';const S=schList()[k.hs];
  if(!S||S.coach?.id!==person)return '학교 감독이 은퇴하거나 교체되어 이 후보는 더 이상 유효하지 않습니다.';
  return S.coach.age>=66?'학교 감독이 은퇴 연령에 도달해 이 후보는 더 이상 유효하지 않습니다.':'';
}
/* 실제 영입 성공 시점의 구단을 받는다. 단장 이직이나 다음 날 처리에 친분·소식 귀속을 맡기지 않는다. */
function schStaffJoined(k,tid){const person=schPerson(k);if(!person||k.schPro||tid==null||!team(tid))return false;const S=schList()[k.hs];
  if(!S||S.coach?.id!==person)return false;const name=S.coach.name,r=schRel(S,tid),ob=S.coach.ob;
  k.hsCoach=person;k.schPro=true;k.schJoined={tid,d:G.day,school:S.n,person,name};
  schDropMarket(person);schSetCoach(S,schNewCoach(S,false,ob));S.rel[tid]=Math.max(schRel(S,tid),Math.max(r,40)-10);
  try{wire('아마',`${S.n} ${name} 감독, ${tshort(tid)} ${String(k.id).startsWith('c')?'코치':'스카우트'}로 프로 입성`,{tid});}catch(e){}return true;
}
/* obTaken의 호환 경로: 현재 실제 명단에서 소속을 찾을 수 있을 때만 처리한다. */
function schLeave(k,tid){if(tid==null)tid=schStaffAt(k)?.tid;return tid==null?false:schStaffJoined(k,tid);}
function schHiredBy(o){const k=[...Object.values(G.coach||{}).flatMap(C=>Object.values(C||{})),...(G.coachX||[]),...(G.scouts||[]),...Object.values(G.lgStaff||{}).flatMap(L=>L.sc||[]),...Object.values(G.orgT||{}).flatMap(L=>L.coachX||[])].find(k=>k&&k.id===o.id);return k?schStaffAt(k)?.tid??null:null;}
function schDaily(){ if(!G.teams)return; const SL=schList(), o=dobj(G.day);
  for(const x of [...(G.schOut||[])]){const tid=schHiredBy(x),S=SL[x.n],mk=x.k==='c'?(G.cmarket||[]):(G.scoutMarket||[]);
    if(tid!=null&&S){const person=x.person||String(x.id).slice(1),k=[...Object.values(G.coach?.[tid]||{}),...(tid===G.user?G.scouts||[]:G.lgStaff?.[tid]?.sc||[]),...(tid===G.user?G.coachX||[]:G.orgT?.[tid]?.coachX||[])].find(k=>k&&k.id===x.id);
      if(k&&schStaffJoined(k,tid))continue;
      /* 구 저장에서 이미 학교를 떠난 뒤 후속 소식만 대기한 건은 실제 영입 구단에 정산한다. */
      if(k&&x.nm){k.schPro=true;k.hsCoach=person;schDropMarket(person);if(x.r!=null)S.rel[tid]=Math.max(schRel(S,tid),Math.max(x.r,40)-10);try{wire('아마',`${S.n} ${x.nm} 감독, ${tshort(tid)} ${x.k==='c'?'코치':'스카우트'}로 프로 입성`,{tid});}catch(e){}continue;}
    }
    if(!mk.some(k=>k.id===x.id))G.schOut=G.schOut.filter(y=>y!==x);
  }
  if(o.d===1)for(const p of Object.values(G.players)){ if(p.schR||p.prospect||!p.draft||p.draft.y<G.year-1)continue; p.schR=1; const S=schOf(p); if(S&&team(p.draft.tid))schAdd(S,5,p.draft.tid); } /* 지명 친분은 지금 소속이 아니라 지명한 구단이 받는다(검수 11-09e #14) */
  if(G.unemp)return;
  if(o.d===1){ /* 스카우트 방문: 담당 지역 학교 두 곳씩 */ for(const s of (G.scouts||[]).filter(s=>(s.role||'am')==='am')){ const L=Object.values(SL).filter(S=>areaDef(S.area).reg===s.region); for(let i=0;i<2&&L.length;i++)schAdd(L.splice(Math.floor(R()*L.length),1)[0],1+(s.skill||2)*.4); }
 }
  if(o.d===15&&o.m>=3&&o.m<=8)schTip(); }
/* 귀띔 메일: 친분 60 이상 학교 감독이 올해 후보 중 좋은 선수를 알려 준다(한 달 한 통) */
function schTipKnown(p,tid=G.user){return !!p&&(p.schTips?.[tid]===G.year||(p.schTip===G.year&&p.schTipT!=null&&p.schTipT===tid));}
function schTip(){ const C=(G.draftClass||[]).map(id=>G.players[id]).filter(p=>p&&p.prospect&&p.school&&!schTipKnown(p));
  const L=Object.values(schList()).filter(S=>schRel(S)>=60&&C.some(p=>p.school===S.n)).sort((a,b)=>schRel(b)-schRel(a));
  for(const S of L){ if(R()>.35+(schRel(S)-60)*.01)continue; const p=C.filter(q=>q.school===S.n).sort((a,b)=>(b.pot||0)-(a.pot||0))[0]; if(p.schTip!=null&&!p.schTips){p.schTips={};if(p.schTipT!=null)p.schTips[p.schTipT]=p.schTip;else p.schTipLegacy=p.schTip;} (p.schTips=p.schTips||{})[G.user]=G.year; p.schTip=G.year; p.schTipT=G.user; /* 귀띔은 받은 구단만 쓴다(검수 11-09e #13) */ const c=S.coach;
    const line={엄격형:`성실함은 제가 보증합니다. ${pidName(p)}, 새벽 훈련 한 번을 안 빠졌어요.`,자율형:`${pidName(p)}은(는) 시키지 않아도 알아서 하는 놈입니다. 프로 가면 더 클 겁니다.`,데이터형:`${pidName(p)} 지난달 기록표 보내 드릴게요. 숫자보다 내용이 더 좋습니다.`,육성형:`${pidName(p)}, 아직 덜 컸습니다. 그래서 더 기대가 돼요. 2~3년 뒤를 보세요.`}[c.sty]||'';
    mail('스카우트팀',`${S.n} ${c.name} 감독: "우리 애 하나 좋은 놈 있습니다"`,`${S.n} ${c.name} 감독(${c.sty})이 전화를 걸어왔습니다.\n"단장님 구단이니까 먼저 말씀드리는 겁니다. ${line}"\n\n${pidName(p)}(${posLabel(p)}) 평가 오차가 줄어듭니다. 친분 ${schRelLbl(schRel(S))}.`,{kind:'스카우트',acts:[{l:'선수 보기',a:'player',v:p.id}]}); return p; }
  return null; }
/* 학교 후원(야구부 장비·전지훈련 지원): 구단마다 한 해 한 번, 1천만 원, 친분 +8 */
const schGave=(S,tid)=>!!S&&!!S.gy&&typeof S.gy==='object'&&S.gy[tid??G.user]===G.year;
function schGift(n){ if(G.unemp)return '구단을 맡고 있지 않습니다.'; const S=schList()[n]; if(!S)return '학교가 없습니다.'; if(schGave(S))return `${n}에는 올해 이미 후원했습니다.`;
  if(!S.gy||typeof S.gy!=='object')S.gy={}; S.gy[G.user]=G.year; try{ _dcc=null; }catch(e){} /* 스카우트 주장 캐시도 새로(검수 11-09e #24) */ G.spend=G.spend||{}; G.spend.etc=(G.spend.etc||0)+10; schAdd(S,8); return `${n} 야구부에 장비를 후원했습니다(${money(10)}). ${S.coach.name} 감독과 친분 ${schRelLbl(schRel(S))}.`; }
/* 학교 친분이 평가 오차에 주는 배수(우리 구단만): 친분 0이면 1.08배, 100이면 0.92배, 귀띔받은 선수는 0.85배 더 */
function schSdM(p){ const S=p&&p.prospect?schOf(p):null; if(!S)return 1; return clamp((1.08-schRel(S)*.0016)*(schTipKnown(p)?.85:1),.75,1.08); }
