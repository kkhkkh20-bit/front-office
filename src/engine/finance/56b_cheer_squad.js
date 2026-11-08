/* ===== 치어리더 단원 카드(사용자 11-09: "인기·팬서비스·체력 이런 거 해서 잘 굴리게", "보통 외주라고 하더라") =====
   - 응원단은 대행사(가상 3곳)와 계약한다. 단원은 대행사 소속이라 대행사를 바꾸면 단원이 통째로 바뀐다(시즌 중에는 못 바꾼다)
   - 단원 수는 응원단 단계(기본 8·확대 12·대폭 확대 16명), 한 홈경기 무대 인원은 5·8·12명
   - 능력(1~20): 비주얼·인기·팬서비스·댄스·체력·성실성. SNS 팔로워는 무대·화제·팬서비스로 는다
   - 홈경기마다 무대에 선 단원은 피로가 쌓이고, 쉬면 풀린다. 피로가 높은데 무대에 서면 부상·슬럼프(성실성이 높을수록 덜하다)
   - 순환: 자동(덜 지친 단원 먼저) 또는 직접(선발·휴식 버튼)
   - 효과(작게): 홈 관중(cheerAtt, -2%~+3%), 팬 여론(매달 팬서비스), 상품 수입(인기 단원), 화제 기사
   - 1월 1일: 나이·연차, 은퇴, 인기 단원을 다른 구단 대행사가 데려감, 신인 합류, 대행사 재계약 안내
   저장: G.fanOps.cs = {ag, L:[단원], nid, auto, ev, last}. 옛 저장은 처음 볼 때 만든다.
   shortcut: AI 구단 응원단은 만들지 않는다(다른 구단 영입은 확률로만). 리그 경쟁이 필요해지면 붙인다 */
const CHEER_AG={
  sky:{l:'하늘빛 엔터테인먼트',fee:1.4,q:2,d:'인기 단원이 많고 비쌉니다. 신인도 실력이 좋습니다.'},
  han:{l:'한결 응원기획',fee:1,q:0,d:'가격과 실력이 무난합니다.'},
  sae:{l:'새봄 스포츠',fee:.7,q:-2,d:'싸지만 신인이 많아 실력이 들쭉날쭉합니다.'}};
const CHEER_N=[8,12,16], CHEER_STAGE=[5,8,12];
const CHEER_AT=[['vis','비주얼'],['pop','인기'],['svc','팬서비스'],['dance','댄스'],['sta','체력'],['dil','성실성']];
const CHEER_FN=['서연','지민','예린','하은','수아','다인','유나','채원','시은','가윤','나연','민지','소율','지우','하린','예서','아린','서아','윤서','다은','세은','유진','보람','혜원'];
function cheerMk(S,rook){ const q=CHEER_AG[S.ag].q, g=(b)=>clamp(Math.round(N(b+q,3)),3,20);
  const L=S.L||[]; let name=''; for(let i=0;i<30&&(!name||L.some(m=>m.name===name));i++)name=surAt(R())+pick(CHEER_FN);
  const yrs=rook?0:ri(1,7), m={id:(S.nid=(S.nid||0)+1),name,age:rook?ri(20,23):clamp(21+yrs+ri(0,3),21,31),yrs,vis:g(11),pop:g(rook?7:10),svc:g(10),dance:g(rook?9:11),sta:g(11),dil:g(11),fat:0,on:true,inj:0,sl:0,app:0};
  m.fol=Math.round(m.pop*m.pop*rnd(300,700)); return m; }
function cheerFee(m,ag){ return Math.max(1,Math.round(CHEER_AG[ag||'han'].fee*(.5+(m.pop+m.dance)/20))); } /* 월 수수료(100만 원 단위, 대행사에 낸다) */
function cheerNeed(){ return CHEER_STAGE[(G.fanOps&&G.fanOps.cheer)||0]; }
/* 단원 수를 응원단 단계에 맞춘다: 모자라면 대행사가 보내고(신인 위주), 넘치면 인기·댄스가 낮은 단원부터 계약 종료 */
function cheerFill(S,pr){ const n=CHEER_N[(G.fanOps&&G.fanOps.cheer)||0], add=[], out=[];
  while(S.L.length<n){ const m=cheerMk(S,R()<(pr??.6)); S.L.push(m); add.push(m.name); }
  if(S.L.length>n){ const L=[...S.L].sort((a,b)=>(a.pop+a.dance)-(b.pop+b.dance)); for(const m of L.slice(0,S.L.length-n))out.push(m.name); S.L=S.L.filter(m=>!out.includes(m.name)); }
  return {add,out}; }
function cheerSq(){ const F=fanOps(); if(!F.cs){ F.cs={ag:'han',L:[],nid:0,auto:true,ev:null,last:null}; cheerFill(F.cs); } return F.cs; }
function cheerPay(){ const S=!G.unemp&&G.fanOps&&G.fanOps.cs; return S?sum(S.L.map(m=>cheerFee(m,S.ag))):0; }
/* 오늘(다음) 홈경기 무대: 자동이면 덜 지친 단원부터, 직접이면 선발로 둔 단원 중 덜 지친 순 */
function cheerStage(S){ const L=S.L.filter(m=>!m.inj&&(S.auto||m.on)); return L.sort((a,b)=>a.fat-b.fat||b.pop-a.pop).slice(0,cheerNeed()); }
/* 무대 힘(10 안팎): 댄스·팬서비스·인기, 피로·슬럼프만큼 깎이고 인원이 모자라면 줄어든다. 치어리더 팀장 호응 유도가 조금 보탠다 */
function cheerPower(S){ const U=cheerStage(S); if(!U.length)return 0; const need=cheerNeed();
  const v=avg(U.map(m=>(m.dance*.4+m.svc*.3+m.pop*.3)*(1-Math.max(0,m.fat-60)/100)*(m.sl?.75:1))); const cap=(G.fanOps.crew||{}).cap;
  return (v+(cap?(cap.hype-10)*.1:0))*Math.min(1,U.length/need); }
function cheerAtt(){ if(G.unemp||!G.fanOps||!G.fanOps.cs)return 0; return clamp((cheerPower(G.fanOps.cs)-10)*.004,-.02,.03); } /* 무대 힘 17이면 홈 관중 +3% */
/* 매일: 홈경기 날 무대·피로·화제, 그 밖의 날 회복 */
function cheerDaily(){ if(G.unemp||!G.fanOps)return; const S=cheerSq(); const hg=period()==='season'&&homeGames(G.user,G.day,G.day).length>0;
  for(const m of S.L){ if(m.inj>0){ m.inj--; m.fat=Math.max(0,m.fat-12); } else if(m.sl>0)m.sl--; }
  const U=hg?cheerStage(S):[], on=new Set(U.map(m=>m.id)); let viral=null;
  for(const m of S.L){ if(m.inj)continue; if(!on.has(m.id)){ m.fat=Math.max(0,Math.round(m.fat-(hg?6:10)-m.sta*.3)); continue; }
    m.fat=clamp(Math.round(m.fat+14-m.sta*.4),0,100); m.app++; m.fol+=Math.round(m.pop*rnd(20,60)*(1+(m.svc-10)/20));
    if(R()<(m.dance+m.svc)/800)m.pop=Math.min(20,m.pop+1);
    const risk=m.fat>=70?(m.fat-65)/250*(1.3-m.dil/30):0;
    if(R()<risk*.4){ m.inj=ri(7,20); m.fat=Math.max(m.fat,60); mail('마케팅팀',`치어리더 ${m.name} 부상`,`연속 무대로 지친 ${m.name}이(가) 공연 중 발목을 다쳤습니다. ${m.inj}일 동안 무대에 서지 못합니다. 피로가 높은 단원은 휴식을 주세요.`,{kind:'구단'}); fanLog(`치어리더 ${m.name} 부상(${m.inj}일)`); }
    else if(R()<risk)m.sl=ri(5,12);
    else if(!viral&&!m.sl&&R()<.004*(1+(m.vis+m.dance+m.pop-30)/30))viral=m; }
  if(viral){ const m=viral; m.pop=Math.min(20,m.pop+ri(1,2)); m.fol=Math.round(m.fol*rnd(1.2,1.5)); G.pr.fan=clamp(G.pr.fan+1,0,100);
    news('구단',`${tshort(G.user)} 치어리더 ${m.name}, 응원 영상 SNS 화제`,`${m.name}이(가) 홈경기에서 선보인 응원 동작 영상이 SNS에서 빠르게 퍼졌습니다. 팔로워가 ${Math.round(m.fol/1000)}천 명을 넘었습니다.`,1,{fanW:1}); fanLog(`치어리더 ${m.name} 응원 영상 화제`); }
  if(hg)S.last={d:G.day,n:U.length,need:cheerNeed()}; }
/* 매달 1일: 대행사 수수료, 팬서비스 → 팬 여론, 인기 단원 → 상품 수입, 팔로워 기사. 1월에는 한 해 정리 */
function cheerMonthly(){ if(G.unemp||!G.fanOps)return; const S=cheerSq(); prInit(); cheerFill(S);
  const pay=cheerPay(); G.spend.fan=(G.spend.fan||0)+pay;
  if(period()==='season')G.pr.fan=clamp(G.pr.fan+(avg(S.L.map(m=>m.svc))-10)*.03,0,100);
  const inc=Math.round(sum(S.L.map(m=>Math.max(0,m.pop-12)))*.6); if(inc)G.spend.fanIn=(G.spend.fanIn||0)+inc;
  for(const m of S.L){ const k=m.fol>=300000?3:m.fol>=100000?1:0; if(k>(m.fm||0)){ m.fm=k; news('구단',`${tshort(G.user)} 치어리더 ${m.name}, SNS 팔로워 ${k===3?'30만':'10만'} 돌파`,`${m.name}의 응원 영상과 팬서비스가 꾸준히 사랑받고 있습니다. 구단 상품 매장에서도 관련 굿즈 문의가 늘었습니다.`,1,{fanW:1}); } }
  if(dobj(G.day).m===1)cheerYear(S); }
function cheerYear(S){ const L=[];
  for(const m of [...S.L]){ m.age++; m.yrs++; m.app=0; m.fat=0; m.inj=0; m.sl=0; m.dance=clamp(m.dance+(m.age<=24?ri(0,2):m.age>=28?-ri(0,1):ri(-1,1)),3,20);
    if(R()<(m.age>=27?(m.age-26)*.15:0)+(m.yrs>=8?.2:0)){ S.L=S.L.filter(x=>x!==m); L.push(`${m.name}(${m.age}세, ${m.yrs}년 차) 은퇴`); continue; }
    if(m.pop>=15&&R()<.35-(m.dil-10)*.02){ S.L=S.L.filter(x=>x!==m); L.push(`${m.name} 다른 구단 대행사로 이적(인기 ${m.pop})`); if(m.pop>=17)news('구단',`인기 치어리더 ${m.name}, 다른 구단 응원단으로`,`${tshort(G.user)} 응원단의 간판 ${m.name}이(가) 다른 구단 대행사와 계약했습니다. 팬들의 아쉬움이 큽니다.`,-1); } }
  const f=cheerFill(S); if(f.add.length)L.push(`신인·새 단원 합류: ${f.add.join(', ')}`);
  mail('마케팅팀',`${CHEER_AG[S.ag].l} 응원단 재계약`,`대행사와 ${G.year} 시즌 응원단 계약을 이어 갑니다. 단원 ${S.L.length}명, 월 수수료 ${money(cheerPay())}.\n${L.length?L.join('\n'):'떠난 단원은 없습니다.'}\n대행사를 바꾸려면 개막 전에 응원단 화면에서 고르세요(단원이 모두 바뀝니다).`,{kind:'구단',acts:[{l:'팬 마케팅',a:'go',v:'club:fans'}]}); }
function cheerAg(k){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; if(!CHEER_AG[k])return '없는 대행사입니다.'; const S=cheerSq(); if(S.ag===k)return `이미 ${CHEER_AG[k].l}과(와) 계약 중입니다.`;
  if(period()==='season'||period()==='post')return '시즌 중에는 대행사를 바꿀 수 없습니다. 시즌이 끝난 뒤 바꾸세요.';
  S.ag=k; S.L=[]; cheerFill(S,.3); /* 새 대행사 단원: 경력 단원 위주 */
  fanLog(`응원단 대행사 변경: ${CHEER_AG[k].l}`); return `${CHEER_AG[k].l}과(와) 계약했습니다. 단원 ${S.L.length}명이 새로 왔습니다. 월 수수료 ${money(cheerPay())}.`; }
function cheerOn(id){ const S=cheerSq(); const m=S.L.find(x=>x.id===+id); if(!m)return '없는 단원입니다.'; if(S.auto){ const U=new Set(cheerStage(S).map(x=>x.id)); for(const x of S.L)x.on=U.has(x.id); S.auto=false; } /* 자동에서 넘어오면 지금 무대 명단에서 시작 */ m.on=!m.on; return `${m.name}: ${m.on?'선발':'휴식'}.`; }
function cheerAuto(){ const S=cheerSq(); S.auto=!S.auto; if(!S.auto){ const U=new Set(cheerStage({...S,auto:true}).map(m=>m.id)); for(const m of S.L)m.on=U.has(m.id); } return S.auto?'자동 순환: 덜 지친 단원부터 무대에 섭니다.':'직접 정하기: 선발·휴식 버튼으로 무대 인원을 고르세요.'; }
/* 치어리더 팬 사인회: 인기 단원 4명이 팬을 만난다. 피로가 오르고 팬 여론·팔로워가 는다 */
function cheerMeetLeft(){ const S=cheerSq(); return S.ev!=null&&G.day-S.ev<14?`${14-(G.day-S.ev)}일 뒤 다시 열 수 있습니다.`:''; }
function cheerMeet(){ if(G.unemp)return '지금은 구단 단장이 아닙니다.'; const S=cheerSq(), left=cheerMeetLeft(); if(left)return '치어리더 팬 사인회: '+left;
  const U=S.L.filter(m=>!m.inj&&m.fat<85).sort((a,b)=>b.pop-a.pop).slice(0,4); if(U.length<2)return '나설 수 있는 단원이 모자랍니다(부상·피로).';
  prInit(); S.ev=G.day; G.spend.fan=(G.spend.fan||0)+5; const sv=avg(U.map(m=>m.svc)), up=sv>=13?2:1; G.pr.fan=clamp(G.pr.fan+up,0,100);
  for(const m of U){ m.fat=Math.min(100,m.fat+18); m.fol+=Math.round(m.pop*rnd(200,400)*(1+(m.svc-10)/20)); if(R()<m.svc/40)m.pop=Math.min(20,m.pop+1); }
  const msg=`치어리더 팬 사인회를 열었습니다(${U.map(m=>m.name).join(', ')}). 팬 여론 +${up}, 참가 단원 피로 +18.`; fanLog(msg); return msg; }
