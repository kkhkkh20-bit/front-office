/* ===== 감독의 목소리 =====
   감독마다 말투가 다르다. 성향(전술·고집·명성·육성·규율·나이)으로 다섯 유형 중 하나가 정해지고,
   지도자 이력(투수코치·타격코치·스타 출신 등)에 따라 꺼내는 경험담이 달라진다.
   대답은 [첫마디] → [지금 상황 정리] → [걸리는 점] → [경험에서 나온 생각] → [단장에게 바라는 것] 순서로 이어진다.
   관계가 나쁘면 짧고 건조하게, 좋으면 속내까지 말한다 */
const MV={
  data:{l:'데이터형',d:'숫자로 말하고 감정을 잘 드러내지 않습니다.'},
  fire:{l:'승부사형',d:'자신감이 넘치고 말이 셉니다. 지는 걸 못 참습니다.'},
  warm:{l:'형님 리더십',d:'선수를 감싸고 분위기를 먼저 챙깁니다.'},
  old:{l:'원칙주의 노장',d:'기본과 규율을 강조합니다. 말이 짧고 단호합니다.'},
  calm:{l:'신중형',d:'차분하게 상황을 정리하고 말을 아낍니다.'}};
function mgrVoice(m){ if(!m)return 'calm'; mgrFix(m); if(m.voice&&MV[m.voice])return m.voice;
  m.voice=m.tac>=72?'data':(m.ego>=72&&m.fame>=55)?'fire':(m.youth>=66&&m.disc<55)?'warm':(m.disc>=72||m.age>=59)?'old':'calm'; return m.voice; }
/* 같은 날 같은 질문에는 같은 대답(새로 고침해도 바뀌지 않게) */
function mvPick(m,key,arr){ return arr[Math.floor(u01('mv'+key+G.day,(m.id||'x').length+G.day)*arr.length)%arr.length]; }
/* 최근에 한 말은 되도록 다시 하지 않는다(최근 30문장 기억) */
function mvFresh(m,key,arr){ const S0=G.mgrSaid||[]; const said=new Set(S0); const f=arr.filter(x=>!said.has(x)); const x=f.length?mvPick(m,key,f):arr.slice().sort((a,b)=>S0.lastIndexOf(a)-S0.lastIndexOf(b))[0]; /* 다 한 말이면 가장 오래전에 한 말 */ (G.mgrSaid=G.mgrSaid||[]).push(x); if(G.mgrSaid.length>30)G.mgrSaid.shift(); return x; }
function mgrBack(m){ const c=m.career||''; return /투수/.test(c)?'pit':/타격|타자/.test(c)?'bat':/배터리|포수/.test(c)?'cat':/수비|주루|작전/.test(c)?'def':/2군/.test(c)?'farm':/스타|레전드|국가대표|우승/.test(c)?'star':'gen'; }
/* 지금 상황을 숫자로 정리 */
function mgrSit(){ const tid=G.user; const per=period(); const r=G.sea&&G.sea.rec?G.sea.rec[tid]:null; const S={per,g:r?r.w+r.l+(r.t||0):0};
  if(r&&S.g>0&&(per==='season'||per==='post')){ const st=standingsNow(); const i=st.findIndex(x=>x.tid===tid); const me=st[i]; const lead=st[0], fifth=st[4], sixth=st[5];
    const gb=(a,b)=>((a.w-a.l)-(b.w-b.l))/2; S.w=r.w; S.l=r.l; S.t=r.t||0; S.rank=i+1; S.gb1=gb(lead,me); S.gb5=i<5?gb(me,sixth):gb(fifth,me);
    const L=((G.sea.tl&&G.sea.tl[tid])||[]); const l10=L.slice(-10); S.l10w=l10.filter(x=>x[0]>0).length; S.l10l=l10.filter(x=>x[0]<0).length;
    let k=0; const s0=L.length?L[L.length-1][0]:0; for(let j=L.length-1;j>=0&&L[j][0]===s0&&s0!==0;j--)k++; S.streak=s0>0?k:s0<0?-k:0;
    S.rd=sum(L.map(x=>x[1]-x[2])); S.left=144-S.g; }
  const d=depth(tid); const R=slotRanks(tid); S.weak=PSLOTS.filter(k=>k!=='DH').sort((x,y)=>R[y].rank-R[x].rank).slice(0,2).map(k=>({k,rank:R[k].rank})); S.strong=PSLOTS.filter(k=>k!=='DH').sort((x,y)=>R[x].rank-R[y].rank)[0]; S.strongRank=R[S.strong].rank;
  S.inj=playersOf(tid).filter(p=>p.injOut>0&&ovr(p)>=48).sort((a,b)=>ovr(b)-ovr(a)).slice(0,3);
  S.tired=per==='season'?playersOf(tid).filter(p=>(p.fat||0)>=60).slice(0,3):[];
  const reg=d.start.map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h&&x.h.pa>=60);
  S.cold=reg.filter(x=>bRate(x.h).ops<.64).sort((a,b)=>bRate(a.h).ops-bRate(b.h).ops).slice(0,2); S.hot=reg.filter(x=>bRate(x.h).ops>=.88).sort((a,b)=>bRate(b.h).ops-bRate(a.h).ops)[0]||null;
  S.spBad=d.sp.map(p=>({p,h:seasonTotal(p,G.year,'1군')})).filter(x=>x.h&&x.h.outs>=60&&pRate(x.h).era>=5.8)[0]||null;
  S.down=playersOf(tid).filter(p=>condOf(p)<=-2&&d.start.concat(d.sp).some(q=>q.id===p.id)).slice(0,2);
  return S; }
/* 첫마디: 성적·연승연패·관계에 따라 */
function mvOpen(m,S){ const v=mgrVoice(m); const cold=m.rel<35; const st=S.streak||0;
  if(cold)return mvPick(m,'oc',['짧게 말씀드리겠습니다.','보고는 드리겠습니다.','물어보시니 답은 하겠습니다.']);
  const B={
    data:st<=-3?['연패 중이라 숫자부터 보시죠.','감정 빼고 숫자로 말씀드리겠습니다.']:st>=3?['흐름은 좋지만 숫자는 냉정하게 보겠습니다.']:['정리해서 말씀드리겠습니다.','수치로 보면 이렇습니다.'],
    fire:st<=-3?['솔직히 속이 뒤집힙니다.','이렇게 지는 건 제 야구가 아닙니다.']:st>=3?['보셨죠? 이게 우리 팀입니다.','지금 기세면 누구도 안 무섭습니다.']:['단장님, 우리 할 만합니다.','돌려 말 안 하겠습니다.'],
    warm:st<=-3?['애들이 많이 처져 있습니다.','선수들 표정부터 말씀드려야겠네요.']:st>=3?['덕아웃 분위기가 정말 좋습니다.','요즘 애들 웃는 얼굴 보는 맛에 삽니다.']:['애들 얘기부터 하겠습니다.','선수들은 열심히 하고 있습니다.'],
    old:st<=-3?['지는 데는 이유가 있습니다.','핑계는 대지 않겠습니다.']:st>=3?['이길 때 더 조심해야 합니다.','들뜨면 안 됩니다.']:['간단히 말씀드리죠.','야구는 결국 기본입니다.'],
    calm:st<=-3?['어려운 시기인 건 맞습니다.','차분하게 보고 있습니다.']:st>=3?['좋은 흐름이지만 길게 보겠습니다.']:['지금 상황을 정리해 보겠습니다.','큰 틀에서 말씀드리겠습니다.']};
  return mvFresh(m,'o',B[v]); }
/* 상황 정리: 같은 숫자라도 유형마다 말하는 방식이 다르다 */
function mvSummary(m,S){ const v=mgrVoice(m);
  if(S.rank==null){ const a=`${SLOTK[S.strong]}(리그 ${S.strongRank}위)`, w=S.weak.map(x=>`${SLOTK[x.k]}(${x.rank}위)`).join('·');
    if(S.per==='pre')return {data:`개막 전 전력 순위로 보면 ${a}이(가) 강점이고 ${w}이(가) 약점입니다.`,fire:`우리 ${a} 보셨습니까? 약한 데는 ${w}뿐입니다.`,warm:`${a} 쪽은 든든하고, ${w} 쪽 애들이 부담을 좀 느끼고 있습니다.`,old:`강점 ${a}, 약점 ${w}.`,calm:`개막 전입니다. 강점은 ${a}, 걱정은 ${w}입니다.`}[v];
    return `시즌은 끝났습니다. 지금 전력으로는 ${a}이(가) 가장 좋고 ${w}이(가) 약합니다.`; }
  const pos=S.rank<=5?(S.gb5>=3?`6위와 ${S.gb5}경기 차`:`6위와 ${Math.max(0,S.gb5)}경기 차밖에 안 되는 상황`):`5위와 ${S.gb5}경기 차`;
  const rec=`${S.w}승 ${S.l}패${S.t?` ${S.t}무`:''}`; const l10=`최근 10경기 ${S.l10w}승 ${S.l10l}패`; const sk=S.streak>=3?`${S.streak}연승`:S.streak<=-3?`${-S.streak}연패`:'';
  const rs=S.rd; const px=S.w+S.l>0?(()=>{ const L=(G.sea.tl&&G.sea.tl[G.user])||[]; const r=sum(L.map(x=>x[1])), a=sum(L.map(x=>x[2])); return r+a>0?Math.pow(r,1.83)/(Math.pow(r,1.83)+Math.pow(a,1.83)):.5; })():.5; const act=S.w/Math.max(1,S.w+S.l);
  return {
    data:`${rec}, ${S.rank}위. 선두와 ${S.gb1}경기, ${pos}입니다. ${l10}${sk?`(${sk})`:''}, 득실차 ${rs>=0?'+':''}${rs}. 득실로 계산한 기대 승률은 ${px.toFixed(3).replace(/^0/,'')}인데 실제는 ${act.toFixed(3).replace(/^0/,'')}라 ${act-px>.025?'운이 따른 편입니다':act-px<-.025?'운이 없었던 편입니다':'실력대로 가고 있습니다'}.`,
    fire:`${S.rank}위${S.rank===1?', 선두입니다':`, 선두와 ${S.gb1}경기`}. ${S.rank<=5?(S.gb5>=3?'가을야구는 당연하고 더 위를 봅니다.':'아직 안심 못 합니다. 더 이겨야 합니다.'):`5위까지 ${S.gb5}경기, 충분히 뒤집습니다.`}${sk?` 지금 ${sk}입니다.`:''}`,
    warm:`${rec}로 ${S.rank}위입니다. ${S.rank<=5?'애들이 정말 잘 버텨 주고 있습니다.':'성적은 아쉽지만 애들이 포기하지 않고 있습니다.'} ${l10}${sk?`, ${sk} 중`:''}입니다.`,
    old:`${S.rank}위, ${pos}. ${l10}.`,
    calm:`${rec}, ${S.rank}위입니다. ${S.rank===1?'선두이고':`선두와 ${S.gb1}경기 차이고`} ${pos}입니다. ${l10}${sk?`, ${sk} 중`:''}이고 득실차는 ${rs>=0?'+':''}${rs}입니다.${S.left>0?` 남은 경기는 ${S.left}경기입니다.`:''}`}[v]; }
/* 걸리는 점 */
function mvIssues(m,S){ const v=mgrVoice(m); const out=[];
  if(S.inj.length)out.push(v==='warm'?`${S.inj.map(p=>p.name).join(', ')}이(가) 다쳐서 빠져 있는 게 제일 마음 아픕니다(${S.inj.map(p=>`${p.name} ${p.injOut}일`).join(', ')}).`:`부상자는 ${S.inj.map(p=>`${p.name}(${p.injOut}일)`).join(', ')}입니다.`);
  if(S.cold.length)out.push(v==='data'?`${S.cold.map(x=>`${x.p.name} OPS ${fmt3(bRate(x.h).ops)}`).join(', ')}. 타구 질은 나쁘지 않아서 운도 섞였다고 봅니다.`:v==='fire'?`${S.cold.map(x=>x.p.name).join(', ')}은(는) 이대로면 라인업에서 뺍니다.`:v==='warm'?`${S.cold.map(x=>x.p.name).join(', ')}이(가) 방망이가 안 맞아서 혼자 남아 연습하더군요. 믿고 기다려 보겠습니다.`:`타격이 안 풀리는 주전은 ${S.cold.map(x=>`${x.p.name}(OPS ${fmt3(bRate(x.h).ops)})`).join(', ')}입니다.`);
  if(S.spBad)out.push(`선발 ${S.spBad.p.name}의 평균자책점이 ${pRate(S.spBad.h).era.toFixed(2)}입니다. ${v==='old'?'로테이션에서 뺄지 고민 중입니다.':'계속 지켜보고 있습니다.'}`);
  if(S.tired.length)out.push(`${S.tired.map(p=>p.name).join(', ')}은(는) 지쳐 있어서 쉬게 해 줄 생각입니다.`);
  const dn=S.down.filter(p=>!S.tired.includes(p)); if(dn.length&&!S.cold.length)out.push(`${dn.map(p=>p.name).join(', ')}은(는) 컨디션이 바닥입니다.`);
  if(S.hot&&out.length<3)out.push(v==='fire'?`그래도 ${S.hot.p.name}은(는) 지금 리그에서 제일 무서운 타자입니다.`:`${S.hot.p.name}은(는) OPS ${fmt3(bRate(S.hot.h).ops)}로 팀을 끌고 가고 있습니다.`);
  if(!out.length&&S.rank!=null)out.push(`가장 약한 자리는 ${S.weak.map(x=>`${SLOTK[x.k]}(리그 ${x.rank}위)`).join(', ')}입니다.`);
  return out.slice(0,3).join(' '); }
/* 경험에서 나온 생각: 이력(투수코치·타격코치·스타 출신 등)·성향·지금 상황을 섞어 후보를 모으고 하나(관계가 좋으면 둘)를 꺼낸다 */
const MV_BACK={
  pit:['투수코치를 오래 해서 압니다. 투수는 한 번 무리하면 그 시즌이 아니라 2~3년이 날아갑니다.','불펜 투수는 3연투가 넘어가면 다음 주에 꼭 탈이 납니다.','좋은 선발 한 명이 연패를 끊고, 좋은 불펜 세 명이 시즌을 지킵니다.'],
  bat:['타격코치 시절 배운 건, 타자는 자신감이 반이라는 겁니다. 한 경기 3안타가 한 달 슬럼프를 끝내기도 합니다.','타순은 생각보다 덜 중요합니다. 출루하는 선수가 몇 명이냐가 중요합니다.','슬럼프 때 폼을 건드리면 더 길어집니다. 저는 기다리는 쪽입니다.','삼진 많은 타자도 볼넷을 고르면 쓸모가 있습니다. 출루율을 같이 봅니다.','좌투수 상대로 약한 타자는 플래툰으로 살릴 수 있습니다.'],
  cat:['포수 출신이라 그런지 투수 리드부터 봅니다. 볼 배합만 바꿔도 실점이 줄어듭니다.','포수가 지치면 실점이 확 늘어납니다. 여름엔 백업 포수를 더 쓰겠습니다.'],
  def:['수비 하나가 경기 흐름을 바꿉니다. 에러 하나에 3점씩 줬던 경기가 몇 번 있었습니다.','주루는 연습한 만큼 늡니다. 한 베이스 더 가는 야구가 결국 순위를 바꿉니다.'],
  farm:['2군 감독을 해서 압니다. 2군에서 올라온 애들은 첫 일주일만 버티면 1군 선수가 됩니다.','2군에는 기회만 기다리는 애들이 많습니다. 그 눈빛을 잊으면 안 됩니다.'],
  star:['선수 시절 큰 경기를 많이 해 봐서 압니다. 가을엔 이름값보다 그날 컨디션입니다.','스타 출신 감독은 선수를 몰아붙이기 쉽다는 말을 듣습니다. 그래서 일부러 한 발 물러서려고 합니다.','제가 뛸 때도 10연패를 해 봤습니다. 그때 감독님은 아무 말 없이 밥만 사 주셨죠.'],
  gen:['지도자 생활을 오래 하면서 느낀 건, 시즌은 결국 부상 관리 싸움이라는 겁니다.','이길 때 조심하고 질 때 담담해야 한다는 걸 배우는 데 10년 걸렸습니다.']};
const MV_VOICE={data:['한 시즌은 길고 표본은 계속 쌓입니다. 3주 단위로 보고 판단하겠습니다.','감으로 하는 야구는 한계가 있습니다. 숫자가 틀린 적은 별로 없었습니다.'],
  fire:['저는 이 팀이 위로 올라갈 거라고 확신합니다.','지는 데 익숙해지는 게 제일 무섭습니다. 매 경기 이기려고 합니다.','덕아웃에서 고개 숙이는 선수는 바로 뺍니다. 기 싸움에서 지면 끝입니다.','작전은 과감하게 걸겠습니다. 실패해도 제가 책임집니다.'],
  warm:['선수들이 감독을 믿어야 이깁니다. 그 믿음은 지키겠습니다.','야구는 사람이 하는 겁니다. 마음이 편해야 몸이 따라옵니다.','2군에서 올라온 애들한테 먼저 말을 걸어 주라고 고참들한테 부탁했습니다.','실수한 선수는 다음 날 꼭 다시 내보냅니다. 그래야 겁을 안 먹습니다.'],
  old:['기본기 훈련은 줄이지 않겠습니다.','요즘 야구가 많이 바뀌었다지만, 공 잡고 던지고 치는 건 그대로입니다.','훈련 시간에 늦는 선수는 이름값과 상관없이 뺍니다.','번트 하나, 주루 하나가 모여서 1승이 됩니다.'],
  calm:['조급해하지 않겠습니다. 계획대로 가겠습니다.','좋을 때도 나쁠 때도 같은 얼굴로 있으려고 합니다.','144경기는 마라톤입니다. 한 주 성적으로 판단하지 않겠습니다.','선수들 몸 상태를 매일 보고받고 있습니다. 무리시키지 않겠습니다.']};
function mvExp(m,S){ const b=mgrBack(m), v=mgrVoice(m); const st=S.streak||0; const lt=S.rank!=null&&S.left<=30; const mo=dobj(G.day).m; const L=[];
  if(st<=-4)L.push({pit:'연패는 투수가 먼저 무너지고 타자가 따라 무너집니다. 투수부터 쉬게 하겠습니다.',bat:'연패 중엔 타자들이 공을 너무 오래 봅니다. 초구부터 치라고 하겠습니다.',star:'선수 때 10연패도 해 봤습니다. 그때 감독님이 아무 말 없이 밥만 사 주셨는데, 그게 제일 고마웠습니다.',farm:'2군에서는 연패가 일상이었습니다. 지는 데 익숙해지면 안 된다는 것만 확실히 압니다.'}[b]||'오래 야구해 보니 연패는 꼭 사소한 실수 하나에서 시작합니다.');
  if(st>=4)L.push({data:'연승 중엔 운이 따른 경기도 섞여 있습니다. 득실차를 같이 봐야 합니다.',fire:'이럴 때 밀어붙여야 합니다. 기세는 돈으로 못 삽니다.',old:'연승 때 생긴 나쁜 습관이 연패 때 터집니다. 지금 잡겠습니다.',warm:'이럴 때일수록 덜 뛴 선수들을 챙겨야 합니다. 벤치가 지치면 팀이 깨집니다.',calm:'좋을 때 다음 위기를 준비하겠습니다.'}[v]);
  if(lt&&Math.abs(S.gb5)<=3)L.push({pit:'막판 순위 싸움은 불펜이 결정합니다. 남은 경기는 필승조를 아끼지 않겠습니다.',star:'큰 경기 경험 있는 선수가 이 시기에 차이를 만듭니다. 베테랑을 앞에 세우겠습니다.',bat:'이 시기엔 한 방보다 한 베이스입니다. 작전 야구로 가겠습니다.'}[b]||'마지막 한 달은 실력보다 버티는 힘입니다.');
  if(mo>=7&&mo<=8&&S.rank!=null)L.push({pit:'여름엔 선발들 구속이 2~3km 빠집니다. 투구 수를 줄여 주겠습니다.',cat:'여름에 포수가 지치면 실점이 확 늡니다. 백업 포수를 더 쓰겠습니다.'}[b]||'여름을 어떻게 버티느냐로 가을이 정해집니다.');
  if(S.cold.length&&b==='bat')L.push('타격은 사이클이 있습니다. 슬럼프 때 폼을 건드리면 더 길어집니다.');
  if(S.inj.length>=2)L.push(v==='old'?'부상은 핑계가 안 됩니다. 있는 선수로 이기는 게 감독 일입니다.':'부상자가 많을 땐 백업이 해 주는 경기 하나가 시즌을 살립니다.');
  if(m.youth>=65&&S.rank!=null&&S.rank>=7)L.push('순위가 이럴 때 젊은 선수들한테 경험을 주는 게 내년을 사는 길이라고 봅니다.');
  if(S.per==='pre')L.push(G.startY===G.year?(v==='fire'?'새로 모인 팀이지만 캠프 보니 해볼 만합니다.':v==='warm'?'처음 모인 애들이라 서로 이름 외우는 것부터 시작했습니다. 그래도 분위기는 좋습니다.':'창단 첫해라 아직 손발을 맞추는 중입니다. 4월 한 달은 시행착오가 있을 겁니다.'):(v==='fire'?'캠프에서 본 걸로는 작년보다 확실히 좋아졌습니다.':v==='data'?'캠프 트래킹 수치는 작년보다 좋습니다. 다만 실전은 다릅니다.':'캠프는 다치지 않고 끝내는 게 제일입니다.'));
  const sit=L.slice(); const gen=[...(MV_BACK[b]||MV_BACK.gen),...MV_VOICE[v]]; if(m.dfn>=68)gen.push('수비가 흔들리면 투수도 무너집니다. 실책 하나가 3점이 됩니다. 수비 되는 선수를 먼저 쓰겠습니다.'); if(m.dfn<=32)gen.push('수비 실책 하나보다 홈런 하나가 더 큽니다. 잘 치는 선수를 빼지 않겠습니다.'); if(m.small>=68)gen.push('우리 같은 팀은 한 점을 짜내는 야구를 해야 합니다. 번트와 도루로 흔들겠습니다.'); if(m.pen>=68)gen.push('경기는 7회부터라고 생각합니다. 필승조만 버텨 주면 이깁니다.');
  const said=new Set(G.mgrSaid||[]); const sitF=sit.filter(x=>!said.has(x)); const one=sitF.length?mvFresh(m,'es',sitF):mvFresh(m,'eg',gen); const two=m.rel>=70?mvFresh(m,'eg2',gen.filter(x=>x!==one&&!one.includes(x.slice(0,12))&&!x.includes(one.slice(0,12)))):''; /* 상황 이야기도 최근에 했으면 다른 이야기로 */ return [one,two].filter(Boolean).join(' '); }
/* 단장에게 바라는 것 */
function mvAsk(m,S){ const v=mgrVoice(m); const k=S.weak[0]; if(!k)return '';
  const B={data:[`${SLOTK[k.k]} 쪽 기대 득점 손실이 가장 큽니다. 보강하면 승수가 바로 보일 겁니다.`],fire:[`${SLOTK[k.k]} 한 명만 구해 주십시오. 나머지는 제가 책임지겠습니다.`],warm:[`${SLOTK[k.k]} 자리가 비어서 애들이 무리하고 있습니다. 한 명만 도와주십시오.`],old:[`${SLOTK[k.k]}이(가) 약합니다. 필요한 건 그것뿐입니다.`],calm:[`여유가 되시면 ${SLOTK[k.k]} 보강을 검토해 주십시오.`]};
  return m.rel<35?'':mvFresh(m,'a',B[v]); }
/* 지난번 이야기 이후 달라진 것: 성적·순위·부상·복귀 */
function mvSince(m,S){ const L=(G.mgrLast||{}).now; if(!L)return null; const dd=G.day-L.d; if(dd>21)return null; const out=[];
  if(S.rank!=null&&L.rank!=null){ const w=S.w-L.w, l=S.l-L.l; if(w+l>0)out.push(`${w}승 ${l}패`); if(S.rank!==L.rank)out.push(`순위는 ${L.rank}위에서 ${S.rank}위로 ${S.rank<L.rank?'올라왔습니다':'내려갔습니다'}`); else if(w+l>0)out.push(`순위는 ${S.rank}위 그대로입니다`); }
  const now=new Set(S.inj.map(p=>p.id)); const back=(L.inj||[]).map(id=>G.players[id]).filter(p=>p&&p.team===G.user&&!(p.injOut>0)); const fresh=S.inj.filter(p=>!(L.inj||[]).includes(p.id));
  if(back.length)out.push(`${back.map(p=>p.name).join(', ')}이(가) 돌아왔습니다`); if(fresh.length)out.push(`${fresh.map(p=>p.name).join(', ')}이(가) 새로 다쳤습니다`);
  return {dd,L,txt:out.length?`지난번(${dmd(L.d)}) 이후 ${out.join(', ')}.`:''}; }
function mgrNowTalk(m){ const S=mgrSit(); const sc=mvSince(m,S); (G.mgrLast=G.mgrLast||{}).now={d:G.day,rank:S.rank,w:S.w,l:S.l,inj:S.inj.map(p=>p.id)};
  if(sc&&sc.dd<=1&&!sc.txt)return mvFresh(m,'same',['어제 말씀드린 그대로입니다. 그사이 달라진 건 없습니다.','하루 만에 바뀐 건 없습니다. 지켜보고 있습니다.','어제와 같습니다. 내일 경기 보고 다시 말씀드리겠습니다.'])+' '+mvExp(m,S);
  if(sc&&sc.dd<=10){ const parts=[sc.txt||'지난번 이후 큰 변화는 없습니다.',mvIssues(m,S)]; if(m.rel>=35){ parts.push(mvExp(m,S)); parts.push(mvAsk(m,S)); } return parts.filter(Boolean).join(' '); } /* 최근에 이미 들은 상황 정리는 건너뛰고 달라진 것부터 */ const cold=m.rel<35; const parts=[mvOpen(m,S),mvSummary(m,S),mvIssues(m,S)]; if(!cold){ parts.push(mvExp(m,S)); parts.push(mvAsk(m,S)); } return parts.filter(Boolean).join(' '); }
/* 다른 질문에도 말투를 입힌다: 첫마디와 끝맺음만 바꾼다 */
function mvWrap(m,topic,a){ const v=mgrVoice(m); if(m.rel<35)return a;
  const pre={data:{foreign:'시장 자료를 봤습니다. ',need:'숫자로 보면 답은 하나입니다. ',young:'트래킹 수치까지 보고 말씀드립니다. '},fire:{foreign:'이기려면 외국인이 터져야 합니다. ',need:'돌려 말 안 하겠습니다. ',young:'저는 실력 있으면 나이 안 봅니다. '},warm:{foreign:'새로 오는 선수도 우리 식구가 되는 거니까요. ',need:'애들이 버티고는 있지만, ',young:'제가 제일 아끼는 얘기네요. '},old:{foreign:'',need:'',young:'어린 선수는 기본부터입니다. '},calm:{foreign:'',need:'',young:''}}[v]||{};
  const post={data:{young:' 다만 2군 기록은 표본이 작아서 조심해서 봐야 합니다.'},fire:{need:' 이번 주 안에 답 주십시오.'},warm:{young:' 기회만 받으면 해낼 녀석들입니다.'},old:{young:' 서두르면 망칩니다.'},calm:{}}[v]||{};
  return (pre[topic]||'')+a+(post[topic]||''); }
