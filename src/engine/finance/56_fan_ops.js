/* ===== 팬 마케팅 · 구단 이벤트 (가벼운 버전, 유저 요청 11-07) =====
   실제 KBO 사례를 본떴다:
   - 응원단·치어리더: 모든 구단이 응원단장·치어리더를 둔다. 응원 문화가 관중을 부른다.
   - 구단 유튜브: KIA '갸티비', 한화 'Eagles TV'처럼 구단 채널이 팬을 모으고 광고 수입을 낸다.
   - 서포터즈: 시즌 회원·팬클럽 모집(시즌 단위).
   - 이벤트: 연예인 시구, 테마 데이(어린이날·밀리터리 데이), 팬 사인회, 캐릭터·브랜드 콜라보 유니폼(롯데×짱구, SSG×스타벅스, KIA×LAP 등), 창단 기념 레트로 유니폼.
   비용은 G.spend.fan(결산 '팬 마케팅·구단 이벤트'), 수입은 G.spend.fanIn(결산 '구단 이벤트·채널 수입')으로 잡는다.
   운영 단계·이벤트 기록은 그 구단 것이라 이직·사임하면 끝난다(leaveTeamState).
   shortcut: AI 구단은 이 기능을 쓰지 않는다. 리그 전체 경쟁이 필요해지면 AI 운영을 붙인다 */
const FAN_OPS={
  cheer:{l:'응원단·치어리더',lv:['기본 응원단','응원단 확대','응원단 대폭 확대'],m:[0,25,55],att:[0,.025,.05],fan:[0,.3,.6],d:'응원 문화가 관중을 부릅니다. 홈 관중이 늘고 팬 여론이 매달 조금 오릅니다.'},
  yt:{l:'구단 유튜브 채널',lv:['운영 안 함','채널 운영','전담 제작팀'],m:[0,15,40],d:'경기 뒤 이야기·선수 일상 영상으로 구독자를 모읍니다. 구독자가 늘면 광고 수입과 팬 여론이 오릅니다. 성적이 좋으면 빨리 늘어납니다.'}
};
const FAN_EV={
  pitch:{l:'연예인 시구',c:30,cd:20,d:'인기 연예인·스포츠 스타를 시구자로 초청합니다. 팬 관심이 오르고 기사가 납니다.'},
  theme:{l:'테마 데이',c:50,cd:30,d:'어린이날·밀리터리 데이·레트로 데이처럼 주제를 정해 홈경기를 꾸밉니다. 7일 동안 홈 관중이 늘어납니다.'},
  meet:{l:'팬 사인회·팬미팅',c:20,cd:20,d:'선수들이 팬을 만납니다. 팬 여론과 참가 선수 기분이 오릅니다.'},
  collab:{l:'콜라보 유니폼',c:300,yr:1,d:'캐릭터·브랜드와 함께 한정판 유니폼·굿즈를 냅니다(실제: 롯데×짱구, SSG×스타벅스, KIA×LAP). 인기가 높을수록 완판 가능성이 커지고, 실패하면 재고가 남습니다.'},
  retro:{l:'창단 기념 레트로 유니폼',c:150,yr:1,d:'옛 유니폼을 복각해 특정 경기에 입고 판매합니다. 오래된 팬들이 반깁니다.'},
  sup:{l:'서포터즈 모집',c:100,yr:1,d:'시즌 회원·서포터즈를 모집합니다. 시즌 동안 홈 관중과 팬 여론이 받쳐 줍니다.'}
};
function fanOps(){ if(!G.fanOps){ const T=G.fanYrT||{}, Y=T[G.user]||{}; if(Y.log){ G.fanOps=Y; delete T[G.user]; return Y; } /* 돌아온 구단: 단계·구독자·응원단·쿨다운·미청구 월 요금을 그대로 이어받는다(검수 11-09j) */ G.fanOps={cheer:0,yt:0,sub:Math.round(30000*team(G.user).pop),last:{},yr:{...(Y.yr||{})},boost:null,sup:Y.sup??null,log:[],crew:Y.crew||{}}; } return G.fanOps; } /* 시즌 1회 행사·서포터즈 기록은 구단에 남는다: 떠났다 돌아와도 같은 시즌에 다시 열 수 없다(검수 11-08) */
/* 홈 관중 배율(우리 구단 홈경기): 응원단·테마 데이·서포터즈 */
function fanAttM(day){ if(G.unemp||!G.fanOps)return 1; const F=G.fanOps; const nx=typeof _stY!=='undefined'&&_stY!=null; /* 다음 시즌 전망: 지난 테마 데이는 빼고 그 시즌 서포터즈만(검수 11-08) */ return (1+FAN_OPS.cheer.att[F.cheer||0]+crewAtt()+cheerAtt(day))*(!nx&&F.boost&&day>=(F.boost.from??0)&&day<=F.boost.until?1.08:1)*(F.sup===(nx?_stY:G.year)?1.03:1); }
function fanLog(t){ const F=fanOps(); F.log.unshift({d:G.day,t}); F.log.length=Math.min(F.log.length,12); }
function fanSet(k,lv){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; const O=FAN_OPS[k]; lv=+lv; if(!O||!(lv>=0&&lv<O.lv.length))return '고를 수 없는 단계입니다.'; const F=fanOps(); if(F[k]===lv)return `이미 ${O.lv[lv]}입니다.`;
  F.mx=F.mx||{}; F.mx[k]=Math.max(F.mx[k]||0,F[k]||0,lv); F[k]=lv; if(k==='cheer'&&F.cs)cheerFill(F.cs); /* 단원 수를 새 단계에 맞춘다 */ fanLog(`${O.l}: ${O.lv[lv]}`); return `${O.l}을(를) '${O.lv[lv]}'(으)로 바꿨습니다.${O.m[lv]?` 매달 ${money(O.m[lv])}이 듭니다.`:' 추가 비용은 없습니다.'}`; }
function fanEvLeft(k){ const E=FAN_EV[k], F=fanOps(); if(E.yr)return F.yr[k]===sponSeason()||(k!=='sup'&&F.yr[k]===G.year&&sponSeason()===G.year)?(k==='sup'?`${sponSeason()} 시즌 서포터즈는 이미 모집했습니다.`:`${sponSeason()} 시즌에는 이미 했습니다.`):''; /* 시즌 1회: 결산 시즌 기준(결산 뒤 11월과 1월에 두 번 안 되게, 검수 11-08) */ const l=F.last[k]; return l!=null&&G.day-l<E.cd?`${E.cd-(G.day-l)}일 뒤 다시 할 수 있습니다.`:''; }
function fanEvent(k){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; const E=FAN_EV[k]; if(!E)return '없는 이벤트입니다.'; const left=fanEvLeft(k); if(left)return `${E.l}: ${left}`;
  const per=period(); if(['pitch','theme','meet'].includes(k)&&per!=='season')return `${E.l}은(는) 정규시즌 홈경기 기간에만 열 수 있습니다.`;
  if(k==='pitch'&&!homeGames(G.user,G.day+1,G.day+1).length)return `${E.l}: 내일 우리 홈경기가 없습니다. 홈경기 전날 준비하세요.`; /* 시구는 다음 홈경기에서(검수 11-08) */
  if(k==='theme'&&!homeGames(G.user,G.day+1,G.day+7).length)return `${E.l}: 앞으로 7일 동안 우리 홈경기가 없습니다. 홈경기 주간에 여세요.`; /* 효과를 받을 경기가 없으면 비용을 받지 않는다(검수 11-08) */
  const F=fanOps(), t=team(G.user); prInit(); G.spend.fan=(G.spend.fan||0)+E.c; if(E.yr)F.yr[k]=sponSeason(); else F.last[k]=G.day; const pop=clamp(t.pop,.4,1.6); let msg='';
  if(k==='pitch'){ const up=R()<.25*pop?3:R()<.6?2:1; G.pr.fan=clamp(G.pr.fan+up,0,100); news('구단',`${tshort(G.user)} 홈경기 시구, 화제의 스타 등장`,`초청 스타의 시구 영상이 온라인에서 화제가 됐습니다.`,1,{fanW:1}); msg=`시구 행사를 열었습니다. 팬 여론 +${up}.`; }
  if(k==='theme'){ F.boost={from:G.day,until:G.day+7}; G.pr.fan=clamp(G.pr.fan+1,0,100); msg=`테마 데이를 열었습니다. ${dmd(G.day+7)}까지 홈 관중이 늘어납니다. 팬 여론 +1.`; }
  if(k==='meet'){ G.pr.fan=clamp(G.pr.fan+2,0,100); const L=playersOf(G.user).filter(p=>!p.foreign).sort(()=>R()-.5).slice(0,3); L.forEach(p=>{ p.mor=clamp((p.mor??60)+2,0,100); }); msg=`팬 사인회를 열었습니다(${L.map(p=>p.name).join(', ')} 참가). 팬 여론 +2, 참가 선수 기분 상승.`; }
  if(k==='collab'){ const ok=R()<clamp(.3+.3*(pop-.8)+(G.pr.fan-55)/200,.15,.8); const inc=Math.round((ok?rnd(600,1200):rnd(100,220))*ecoIdx()); G.spend.fanIn=(G.spend.fanIn||0)+inc; if(ok)G.pr.fan=clamp(G.pr.fan+3,0,100);
    news('구단',ok?`${tshort(G.user)} 콜라보 유니폼 하루 만에 완판`:`${tshort(G.user)} 콜라보 굿즈, 반응 미지근`,ok?'한정판 유니폼과 굿즈가 출시 첫날 다 팔렸습니다. 추가 생산 요청이 이어집니다.':'출시 초반 관심에 비해 판매가 더딥니다. 재고가 남았습니다.',ok?2:0,{fanW:1}); msg=ok?`완판입니다. 상품 수입 ${money(inc)}, 팬 여론 +3.`:`판매가 부진했습니다. 상품 수입 ${money(inc)}(비용 ${money(E.c)}).`; }
  if(k==='retro'){ const inc=Math.round(rnd(200,480)*pop*ecoIdx()); G.spend.fanIn=(G.spend.fanIn||0)+inc; G.pr.fan=clamp(G.pr.fan+2,0,100); news('구단',`${tshort(G.user)}, 창단 기념 레트로 유니폼 공개`,`옛 유니폼을 복각한 기념 유니폼에 오랜 팬들이 반가워했습니다.`,1,{fanW:1}); msg=`레트로 유니폼을 냈습니다. 상품 수입 ${money(inc)}, 팬 여론 +2.`; }
  if(k==='sup'){ const y=sponSeason(); F.sup=y; G.pr.fan=clamp(G.pr.fan+2,0,100); msg=`${y} 서포터즈를 모집했습니다. ${y===G.year?'올':y+'년'} 시즌 홈 관중이 늘고 팬 여론 +2.`; } /* 결산 뒤 모집은 다음 시즌 회원(검수 11-08) */
  fanLog(`${E.l}: ${msg}`); return msg; }
/* 이달 이미 쓴 더 높은 단계 몫(다음 달 1일 청구 예정): 단계를 내려도 예산에서 빠지지 않게(검수 11-09j) */
function fanPeakExtra(){ const F=G.fanOps; if(!F||G.unemp)return 0; const mx=F.mx||{}; return sum(['cheer','yt'].map(k=>FAN_OPS[k].m[Math.max(F[k]||0,mx[k]||0)]-FAN_OPS[k].m[F[k]||0])); }
function fanMonthCost(){ const F=G.fanOps; return F&&!G.unemp?FAN_OPS.cheer.m[F.cheer||0]+FAN_OPS.yt.m[F.yt||0]+crewPay()+cheerPay():0; }
/* 매달 1일: 운영비, 유튜브 구독자·광고 수입, 응원단 효과 */
function fanMonthly(){ if(G.unemp||!G.fanOps)return; const F=G.fanOps, t=team(G.user); prInit();
  const mx=F.mx||{}; const cost=FAN_OPS.cheer.m[Math.max(F.cheer||0,mx.cheer||0)]+FAN_OPS.yt.m[Math.max(F.yt||0,mx.yt||0)]; F.mx={}; /* 지난 한 달 중 가장 높았던 단계로 청구: 월초에 잠깐 꺼서 비용을 피하지 못하게(검수 11-08) */ if(cost)G.spend.fan=(G.spend.fan||0)+cost;
  if(F.cheer)G.pr.fan=clamp(G.pr.fan+FAN_OPS.cheer.fan[F.cheer],0,100);
  try{ crewMonthly(); }catch(e){}
  try{ cheerMonthly(); }catch(e){} /* 치어리더 단원(56b) */
  if(F.yt){ const r=G.sea&&G.sea.rec&&G.sea.rec[G.user], wp=r&&r.w+r.l>=10?r.w/(r.w+r.l):.5, on=period()==='season'||period()==='post'; const add=Math.round(F.yt*clamp(t.pop,.4,1.6)*(on?rnd(3000,7000):rnd(800,2000))*(wp>=.55?1.4:wp<.45?.7:1)); F.sub=(F.sub||0)+add;
    const ad=Math.round(F.sub/10000*1.6); if(ad>0)G.spend.fanIn=(G.spend.fanIn||0)+ad; if(F.sub>=100000&&F.yt>=1)G.pr.fan=clamp(G.pr.fan+.3*F.yt,0,100); } }

/* ===== 응원단장·치어리더 팀장(커뮤니티 제안 11-08): 스태프처럼 인물을 영입한다 =====
   능력치(1~20, 에펨처럼): 호응 유도(홈 관중), 영향력(팬 여론), 구단 충성도(재계약·이적 제의 버티기), 스타성(화제성·상품 수입·관중 조금).
   월급은 매달 1일 팬 마케팅 비용으로. 계약이 끝나는 해 1월에 충성도에 따라 재계약하거나 떠난다. 사진은 갤러리에서 바꿀 수 있다(G.cimg).
   shortcut: AI 구단은 응원단장을 두지 않는다(리그 경쟁이 필요해지면 붙인다) */
const CREW_JOB={lead:{l:'응원단장',b:6},cap:{l:'치어리더 팀장',b:4}};
const CREW_AT=[['hype','호응 유도'],['infl','영향력'],['loy','구단 충성도'],['star','스타성']];
function crewOf(){ const F=fanOps(); return F.crew=F.crew||{}; }
function crewSal(c){ const s=c.hype+c.infl+c.star+c.loy*.5; return Math.max(2,Math.round(CREW_JOB[c.job].b*(.45+s/70))); } /* 월급(100만 원 단위) */
function crewMk(job){ const g=()=>clamp(Math.round(N(10.5,3.6)),3,20); const c={id:(G.crewNid=(G.crewNid||0)+1),job,name:job==='cap'?surAt(R())+pick(CHEER_FN):genName(), /* 치어리더 팀장은 여성 이름(사진도 여성, 11-09c) */age:ri(23,39),hype:g(),infl:g(),loy:g(),star:g()}; if(R()<.15){ const k=pick(['hype','infl','star']); c[k]=clamp(c[k]+ri(4,7),3,20); } c.sal=crewSal(c); return c; }
function crewMkt(){ const M=G.crewMkt; if(M&&M.L&&M.L.length&&G.day-M.d<75)return M.L; const L=[]; for(const j of Object.keys(CREW_JOB))for(let i=0;i<3;i++)L.push(crewMk(j)); G.crewMkt={d:G.day,L}; return L; }
function crewHire(id,yrs){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; yrs=clamp(Math.round(+yrs||2),1,3); const L=crewMkt(); const c=L.find(x=>x.id===+id); if(!c)return '후보가 없습니다.'; const C=crewOf(); const old=C[c.job]; const fire=old?crewFire(c.job):''; /* 바로 교체해도 전임 해지 정산금은 낸다(검수 11-09j) */
  C[c.job]={...c,y1:sponSeason()+yrs-1,d0:G.day}; G.crewMkt.L=L.filter(x=>x.id!==c.id); if(old)G.crewMkt.L.push({...old,sal:crewSal(old)});
  fanLog(`${CREW_JOB[c.job].l} ${c.name} 영입(${yrs}년, 월 ${money(c.sal)})`); return `${CREW_JOB[c.job].l}으로 ${c.name}을(를) 영입했습니다. ${yrs}년 계약, 월 ${money(c.sal)}.${old?` ${fire} 전임은 시장으로 나갔습니다.`:''}`; }
function crewSettle(c){ const left=Math.max(0,c.y1-sponSeason()+1); return Math.round(c.sal*Math.min(12,left*12)*.3); }
function crewFire(job){ const C=crewOf(); const c=C[job]; if(!c)return '그 자리는 비어 있습니다.'; const pay=crewSettle(c); G.spend.fan=(G.spend.fan||0)+pay; delete C[job]; fanLog(`${CREW_JOB[job].l} ${c.name} 계약 해지(정산 ${money(pay)})`); return `${c.name}과(와) 계약을 해지했습니다. 남은 기간 정산금 ${money(pay)}.`; } /* 남은 계약의 30%(최대 1년 치 기준) */
function crewPay(){ if(G.unemp||!G.fanOps)return 0; return sum(Object.values(G.fanOps.crew||{}).map(c=>c.sal)); }
function crewAtt(){ if(G.unemp||!G.fanOps)return 0; return sum(Object.values(G.fanOps.crew||{}).map(c=>(c.hype-10)*.003+(c.star-10)*.001)); } /* 응원단장 20/20이면 홈 관중 +4% 안팎 */
function crewMonthly(){ const C=crewOf(), t=team(G.user); const L=Object.values(C); if(!L.length)return; const pay=crewPay(); G.spend.fan=(G.spend.fan||0)+pay;
  for(const c of L){ G.pr.fan=clamp(G.pr.fan+(c.infl-10)*.04,0,100); t.pop=clamp(t.pop+(c.star-11)*.0004,.4,1.6); const g=Math.max(0,Math.round((c.star-8)*.6)); if(g)G.spend.fanIn=(G.spend.fanIn||0)+g; }
  try{ crewSongAsk(); }catch(e){}
  if(dobj(G.day).m!==1)return; const y=sponSeason();
  for(const j of Object.keys(C)){ const c=C[j]; c.age++; const end=c.y1<y; const poach=!end&&c.star>=15&&c.loy<=8&&R()<.25;
    if(end){ if(R()<.35+c.loy*.03){ const n=ri(1,2); c.y1=y+n-1; c.sal=Math.round(c.sal*1.06); mail('마케팅팀',`${CREW_JOB[j].l} ${c.name} 재계약`,`${c.name}이(가) ${n}년 더 남기로 했습니다(월 ${money(c.sal)}). 구단 충성도 ${c.loy}.`,{kind:'구단'}); } else { delete C[j]; mail('마케팅팀',`${CREW_JOB[j].l} ${c.name} 계약 만료`,`${c.name}이(가) 재계약하지 않고 떠났습니다. 팬 마케팅에서 새 ${CREW_JOB[j].l}을(를) 영입할 수 있습니다.`,{kind:'구단',imp:true,acts:[{l:'팬 마케팅',a:'go',v:'club:fans'}]}); } }
    else if(poach){ const buy=crewSettle(c); G.spend.fanIn=(G.spend.fanIn||0)+buy; /* 영입 구단이 내는 위약금(해지 정산금과 같은 기준, 검수 11-09j) */ delete C[j]; mail('마케팅팀',`${CREW_JOB[j].l} ${c.name}, 다른 구단으로`,`스타성이 높은 ${c.name}에게 다른 구단이 더 좋은 조건을 냈고, 구단 충성도(${c.loy})가 낮아 옮겼습니다. 위약금 ${money(buy)}은 그 구단이 냈습니다(구단 이벤트 수입).`,{kind:'구단',imp:true}); } } }

/* 선수 응원가(사용자 11-08): 응원단장이 있으면 시즌 중 매달 한 번쯤 응원가가 없는 주축 선수의 응원가를 만들자고 한다.
   만들면 비용이 들고, 응원단장 호응 유도·스타성이 높을수록 잘 만들어져 팬 여론·선수 기분·화제성이 오른다. 이적하면 응원가는 그 구단에 남는다 */
function crewSongAsk(){ const c=crewOf().lead; if(!c||G.unemp)return; const m=dobj(G.day).m; if(m<4||m>9||R()>.55)return; if((G.evs||[]).some(e=>!e.done&&e.k==='song'))return;
  const L=playersOf(G.user).filter(p=>p.e1&&!(p.songs&&p.songs[G.user])&&!p.ys).sort((a,b)=>(b.fr&&b.fr.tid===G.user)-(a.fr&&a.fr.tid===G.user)||ovr(b)-ovr(a)); const p=L[0]; if(!p)return;
  const cost=Math.round(8+c.star*.6), q=Math.round(clamp((c.hype+c.star)/2+N(0,2.5),3,20));
  evNew('song',`${p.name} 응원가 만들까요?`,`응원단장 ${c.name}: "${p.name} 선수 응원가가 아직 없습니다. ${p.fr&&p.fr.tid===G.user?'프랜차이즈 스타에게 어울리는 노래를 붙이고 싶습니다.':'팬들이 따라 부를 수 있는 노래를 만들어 보겠습니다.'}" (호응 유도 ${c.hype} · 스타성 ${c.star})`,
    [{l:'만든다',fx:`제작비 ${money(cost)}(팬 마케팅 비용). 응원단장 능력만큼 반응이 갈립니다. 선수 기분이 오르고 팬 여론·화제성이 오를 수 있습니다.`},{l:'다음에',fx:'만들지 않습니다.'}],{ref:p.id,face:p.id,from:'마케팅팀',data:{pid:p.id,cost,q,cid:c.id,by:c.name},def:1,exp:10}); }
EVH.song={ pick(e,i){ const p=G.players[e.data.pid]; if(!p||p.team!==G.user)return '이제 우리 선수가 아닙니다.'; if(i!==0)return '다음에 만들기로 했습니다.'; const {cost,q}=e.data; const c=crewOf().lead, by=e.data.by??(c?c.name:''); /* 제안한 단장이 만든다: 수락 전에 바뀌어도(검수 11-09j) */
  G.spend.fan=(G.spend.fan||0)+cost; (p.songs=p.songs||{})[G.user]={y:G.year,q,by}; const F=fanOps(); F.songs=(F.songs||0)+1;
  p.mor=clamp((p.mor??60)+3+Math.round(q/5),0,100); const hit=q>=15, flop=q<=7; G.pr.fan=clamp(G.pr.fan+(hit?2:flop?0:1),0,100); if(hit)team(G.user).pop=clamp(team(G.user).pop+.004,.4,1.6);
  story(p,`${tshort(G.user)} 응원가 생김${hit?' · 화제':''}`,'mile');
  if(hit)news('구단',`${p.name} 새 응원가, 구장 떼창에 SNS 화제`,`응원단장 ${by}이(가) 만든 ${p.name} 응원가가 첫날부터 관중석 떼창을 불렀습니다. 영상 조회수가 빠르게 오르고 있습니다.`,2,{ref:p.id});
  else if(flop)news('구단',`${p.name} 새 응원가, 팬 반응은 "글쎄"`,`가사가 입에 붙지 않는다는 반응이 많습니다. 몇 경기 더 불러 봐야 알 것 같다는 의견도 있습니다.`,0,{ref:p.id});
  return `${p.name} 응원가를 만들었습니다(완성도 ${q}/20${hit?' · 화제':flop?' · 반응 미지근':''}). 선수 기분이 올랐습니다.`; } };
