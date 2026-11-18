/* ---------- 중계 멘트: 캐스터(상황 묘사)와 해설(분석) ----------
   타구 방향, 수비수 이름, 상황(선두 타자·득점권·만루·역전·동점·끝내기), 오늘 기록, 시즌 기록, 결정구, 좌우 대결,
   감독 성향을 섞어 같은 결과도 매번 다르게 말한다. 같은 경기·같은 타석이면 항상 같은 멘트가 나온다 */
function pcH(g,k,s){ const t='pc'+g.day+':'+g.home+':'+k+':'+s; let h=2166136261; for(let i=0;i<t.length;i++){ h^=t.charCodeAt(i); h=Math.imul(h,16777619); } h^=h>>>13; h=Math.imul(h,1274126177); h^=h>>>16; return (h>>>0)/4294967296; } /* 고르게 퍼진 고정 난수 */
/* 병살 경로(사용자 11-17: 여러 병살 코스). [잡은 수비수, 2루 중계(없으면 직접 밟음), 표기, 1루 받는 선수]. 같은 항목을 여러 번 넣어 흔한 경로를 자주 */
function dpPats(){ return [['SS','2B','6-4-3','1B'],['SS','2B','6-4-3','1B'],['SS','2B','6-4-3','1B'],['SS',null,'6-3','1B'],['2B','SS','4-6-3','1B'],['2B','SS','4-6-3','1B'],['2B',null,'4-3','1B'],['3B','2B','5-4-3','1B'],['3B','2B','5-4-3','1B'],['1B','SS','3-6-3','1B'],['1B','SS','3-6-1','P'],['P','SS','1-6-3','1B']]; }
/* 기록된 최초 처리 야수에 맞춘 표준 경로. 야수 기록도 없으면 숫자 경로를 사실처럼 읽지 않는다. */
function pcDpPat(g,k){const f=gamePA(g.pbp[k]).fielder,p=dpPats().find(p=>p[0]===f);return p?{start:p[0],pivot:p[1],label:p[2],first:p[3],known:true}:{start:'SS',pivot:'2B',label:'',first:'1B',known:false};}
/* 안타 타구 모양(사용자 11-17: 라디오 중계처럼 정확하게). 해설 문장과 3D 화면이 같은 결정을 쓴다: 각도 th(음수=왼쪽), 거리 r(cPolar 칸), 뜬공 arc, 땅볼 gb, 해설 구절 */
function hitShape(g,k,o){ const h=t=>pcH(g,k,t), j=h('hsj')*2-1;
  const fact=gamePA(g.pbp[k]);if(fact.bunt==='hit')return {th:fact.fielder==='1B'?35:-35,r:13,arc:false,gb:true,c:'짧게 댄 번트, 1루 세이프! 번트 안타'};
  if(['1B','2B','3B'].includes(o)&&PC_POS[fact.fielder]&&fact.bipType){const th=({P:0,C:0,'1B':37,'2B':17,SS:-17,'3B':-37,LF:-29,CF:0,RF:29})[fact.fielder],gb=fact.bipType==='GB',arc=['FB','PU'].includes(fact.bipType),how=gb?'땅볼':fact.bipType==='LD'?'직선 타구':'뜬 타구';return {th,r:o==='3B'?87:o==='2B'?78:58,arc,gb,c:`${PC_POS[fact.fielder]} 쪽 ${how}${o==='1B'?' 안타':''}`};}
  if(o==='2B'){ const where=pcPick(g,k,'t2',['lc','rc','lc','rc','ll','rl','wall']), kind=h('t2a');
    if(where==='lc'||where==='rc'){ const sd=where==='lc'?-1:1, side=where==='lc'?'좌중간':'우중간'; return kind<.5?{th:sd*(15+j*4),r:78+h('t2r')*8,arc:false,gb:false,c:pcPick(g,k,'t2l',[`빨랫줄 같은 타구가 ${side}을 가릅니다`,`쭉 뻗는 라인드라이브, ${side}을 꿰뚫습니다`])}:{th:sd*(15+j*4),r:80+h('t2r')*8,arc:true,gb:false,c:`높이 뜬 타구, ${side} 깊숙한 곳에 떨어집니다`}; }
    if(where==='ll'||where==='rl'){ const sd=where==='ll'?-1:1, base=where==='ll'?'3루':'1루', line=where==='ll'?'좌익선상':'우익선상'; return kind<.55?{th:sd*(41+j*2),r:66+h('t2r')*8,arc:false,gb:true,c:`${base} 선상을 타고 빠지는 타구, ${line} 끝까지 굴러갑니다`}:{th:sd*(40+j*2),r:66+h('t2r')*8,arc:false,gb:false,c:`${line}에 떨어지는 날카로운 타구`}; }
    return {th:j*14,r:90,arc:true,gb:false,c:'펜스를 직접 맞히는 큰 타구'}; }
  if(o==='3B'){ const where=pcPick(g,k,'t3',['rc','lc','rl']), kind=h('t3a');
    if(where==='rl')return {th:41+j*2,r:78+h('t3r')*6,arc:false,gb:kind<.6,c:'우익선상을 타고 끝까지 굴러가는 타구'};
    const sd=where==='lc'?-1:1, side=where==='lc'?'좌중간':'우중간'; return kind<.5?{th:sd*(14+j*4),r:86+h('t3r')*6,arc:false,gb:false,c:`${side}을 완전히 가르는 총알 같은 타구`}:{th:sd*(14+j*4),r:86+h('t3r')*6,arc:true,gb:false,c:`${side} 가장 깊은 곳으로 날아가는 타구`}; }
  if(o==='1B'){ const t=pcPick(g,k,'t1',['좌전','중전','우전','3유간을 빠지는','1·2루간을 꿰뚫는','유격수 키를 넘기는']), jj=h('t1j')*2-1, rr=56+h('t1r')*6, arc=h('t1a')<.5, gb=!arc&&h('t1g')<.6, how=arc?'살짝 떠서 떨어지는':gb?'땅볼로 빠져나가는':'라인드라이브로 뻗는';
    if(t==='좌전')return {th:-26+jj*8,r:rr,arc,gb,c:`${how} 좌전 안타`}; if(t==='중전')return {th:jj*8,r:rr,arc,gb,c:`${how} 중전 안타`}; if(t==='우전')return {th:26+jj*8,r:rr,arc,gb,c:`${how} 우전 안타`};
    if(t==='3유간을 빠지는')return {th:-31+jj*3,r:55,arc:false,gb:true,c:'3유간을 빠지는 땅볼 안타'}; if(t==='1·2루간을 꿰뚫는')return {th:31+jj*3,r:55,arc:false,gb:true,c:'1·2루간을 꿰뚫는 땅볼 안타'};
    return {th:-17+jj*4,r:52+h('t1r')*4,arc:true,gb:false,c:'유격수 키를 살짝 넘기는 안타'}; }
  return null; }
function pcPick(g,k,s,arr){ return arr[Math.floor(pcH(g,k,s)*arr.length)]; }
const PC_POS={P:'투수','C':'포수','1B':'1루수','2B':'2루수','3B':'3루수',SS:'유격수',LF:'좌익수',CF:'중견수',RF:'우익수'};
function pcFielder(g,half,pos,k){const side=half%2?'a':'h',def=g.box[side];if(!def)return '';k=k??g.pbp.length;if(pos==='P'){const id=typeof cPit==='function'?cPit(g,k):def.pit?.[0]?.id;return def.pit?.find(p=>p.id===id)?.n||G.players[id]?.name||'';}const rows=typeof castLineup==='function'?castLineup(g,side,k):def.bat;const player=rows.find(p=>p.pos===pos);return player?(player.n||G.players[player.id]?.name||''):'';} /* 경기 당시 이름 먼저(개명, 검수 11-09zu) */
/* k번째 기록 직전 상태 */
function pcBefore(g,k){ const L=g.pbp, x=L[k]; if(k<=0)return {outs:0,bases:[0,0,0],sa:0,sh:0};
  const p=L[k-1]; const s=pbpState(g,k-1); if(p[0]!==x[0])return {outs:0,bases:[0,0,0],sa:s.sa,sh:s.sh}; return {outs:s.outs>=3?0:s.outs,bases:s.outs>=3?[0,0,0]:s.bases.slice(),sa:s.sa,sh:s.sh}; }
function pcToday(g,k,id){ let pa=0,h=0,hr=0,so=0; for(let i=0;i<k;i++){ const y=g.pbp[i]; if(y[1]!==id)continue; pa++; if(['1B','2B','3B','HR'].includes(y[3]))h++; if(y[3]==='HR')hr++; if(y[3]==='K')so++; } return {pa,h,hr,so}; }
function pcPitToday(g,k,id){ let so=0,bf=0; for(let i=0;i<k;i++){ const y=g.pbp[i]; if(typeof y[1]!=='number'||y[2]!==id)continue; bf++; if(y[3]==='K')so++; } return {so,bf}; }
function pcBest(p){ try{ const a=arsenal(p,p.r.stf).filter(x=>x[0]!=='직구').sort((x,z)=>z[1]-x[1])[0]; return a?a[0]:''; }catch(e){ return ''; } }
function pcHand(b,p){ if(!b||!p||b.bt==='양')return ''; return b.bt===p.th?(b.bt==='좌'?'좌 대 좌':'우 대 우'):''; }
/* 메인: {c:캐스터, a:해설} */
/* 실책한 야수의 자리(기록에 남은 경우) */
function pcFAt(g,half,pos,k){ const r=castLineup(g,half%2?'a':'h',k??g.pbp.length).find(z=>z.pos===pos); return r?G.players[r.id]:null; } /* 그 타석 시점의 수비수(경기 끝 배치가 아니라, 검수 11-08) */
function pcErrPos(g,k){ const x=g.pbp[k]; if(!x||!x[9])return null; const sd=x[0]%2?'a':'h'; const f=castLineup(g,sd,k).find(z=>z.id===x[9])||(g.box[sd].bat||[]).find(z=>z.id===x[9]); if(f&&f.pos&&f.pos!=='DH')return f.pos; if(x[9]===cPit(g,k))return 'P'; return null; } /* 실책 당시 위치: 나중에 교체돼도(검수 11-08) */
function pbpCallBase(g,k){ const L=g.pbp, x=L[k]; if(!x)return {c:'',a:''}; const nm=id=>pNmAny(id,g);
  const half=x[0], inn=Math.floor(half/2)+1, top=half%2===0, atT=top?g.away:g.home, dfT=top?g.home:g.away; const pk=(s,a)=>pcPick(g,k,s,a);
  if(x[1]==='PC'){ const p=G.players[x[2]]; const st=pbpState(g,k); const diff=top?st.sh-st.sa:st.sa-st.sh; /* 수비 팀 기준 */
    const c=`${tshort(dfT)} 마운드 교체. ${nm(x[2])} 투수가 올라옵니다.${p?` 시즌 평균자책점 ${eraAt(g,k,x[2])}.`:''}`;
    let a=''; if(p){ const cd=p.ld?consecDays(p,g.day):0; const role=posLabel(p);
      if(cd>=2)a=`${nm(p.id)}은(는) ${cd+1}일 연속 등판입니다. ${mgrOf(dfT).name} 감독이 이 경기를 꼭 잡겠다는 뜻이지만 팔 부담이 큽니다.`;
      else if(inn>=8&&Math.abs(diff)<=2)a=pk('pa',[`승부처에 ${role} ${nm(p.id)}을(를) 올립니다. 여기서 막아야 합니다.`,`${inn}회 접전, 벤치가 아껴 둔 카드를 꺼냅니다.`]);
      else if(inn<=5)a=pk('pb',['선발이 일찍 내려갑니다. 불펜 소모가 커지겠네요.','예상보다 빠른 교체입니다. 벤치가 흐름을 끊으려 합니다.']); }
    return {c,a}; }
  const pre=pcBefore(g,k);
  if(x[1]==='SB'||x[1]==='CS'){ const r=G.players[x[2]]; const from=pre.bases.indexOf(x[2]); const to=from>=0?['2루','3루','홈'][from]:'다음 베이스'; const cat=pcFielder(g,half,'C',k);
    if(x[1]==='SB')return {c:`${nm(x[2])}, ${to} 도루 성공!${cat?` 포수 ${cat}의 송구가 늦었습니다.`:''}`,a:r&&r.r.spd>=68?pk('sb',[`${nm(r.id)}의 발은 리그에서도 손꼽힙니다.`,'투수가 견제를 더 신경 써야 했습니다.']):''};
    const c0=pcFAt(g,half,'C',k); return {c:`${nm(x[2])}, ${to} 도루 실패!${cat?` 포수 ${cat}의 정확한 송구에 걸렸습니다.`:''}`,a:c0&&catArm(c0)>=60?`${nm(c0.id)} 포수 어깨가 좋습니다. 함부로 뛸 수 없는 포수입니다.`:pk('cs',['무리한 주루였습니다. 흐름이 끊깁니다.','타이밍을 빼앗겼습니다.'])}; }
  const pitches=storedPitchSequence(x),lastPitch=pitches?.at(-1);
  const b=G.players[x[1]], p=G.players[x[2]], o=x[3], runs=x[6]||0, outsA=x[4];
  const sa=x[7], sh=x[8], befA=pre.sa, befH=pre.sh; const myB=top?sa:sh, opB=top?sh:sa, myB0=top?befA:befH, opB0=top?befH:befA;
  const lead0=myB0-opB0, lead1=myB-opB; const walkoff=!top&&inn>=9&&lead0<=0&&lead1>0;
  const risp=!!(pre.bases[1]||pre.bases[2]), loaded=pre.bases.every(Boolean), leadoff=pre.outs===0&&!pre.bases.some(Boolean)&&(k===0||L[k-1][0]!==half||L.slice(0,k).filter(y=>y[0]===half&&typeof y[1]==='number').length===0);
  const BN=pcName(g,x[1]), PN=pcName(g,x[2]); /* 경기 당시 이름(검수 11-08) */ const fld=pos=>{ const n=pcFielder(g,half,pos,k); return n?`${PC_POS[pos]} ${n}`:PC_POS[pos]; };
  const batAfter=x[5].includes(x[1]); const today=pcToday(g,k,x[1]);
  let c='', a='';
  switch(o){
    case 'HR':{ c=`${BN}, ${runs===4?'만루 홈런':runs>1?runs+'점 홈런':'솔로 홈런'}!`;
      const sea=seasonAt(g,k,x[1],false),n=sea?sea.hr+1:0;a=n?`시즌 ${n}호 홈런입니다.`:'';if(today.hr>=1)a+=` 오늘만 ${today.hr+1}번째 홈런, 멀티 홈런 경기입니다.`;break; }
    case '3B': c=`${BN}, ${hitShape(g,k,'3B').c}! 3루까지 달립니다. 3루타!`; a=b&&b.r.spd>=62?'발이 빠르니까 3루까지 가능한 타구였습니다.':''; break;
    case '2B': c=`${BN}, ${hitShape(g,k,'2B').c}! 2루타.`; break;
    case '1B':{const fact=gamePA(x);const inf=!fact.bunt&&!fact.bipType&&b&&b.r.spd>=64&&pcH(g,k,'if')<.25; c=inf?`${BN}, ${fld(pk('ip',['SS','3B','2B']))} 쪽 느린 땅볼, 1루 세이프! 내야 안타.`:`${BN}, ${hitShape(g,k,'1B').c}.`; break; }
    case 'BB': if(lastPitch){c=loaded?`${BN}, 볼넷! 밀어내기로 1점이 들어옵니다.`:`${BN}, ${pitches.length===4?'스트레이트 볼넷.':lastPitch.s===2?'풀카운트 끝에 볼넷.':'볼넷으로 걸어 나갑니다.'}`;if(loaded)a='투수에게 가장 뼈아픈 실점입니다.';break;}c=loaded?`${BN}, 볼넷! 밀어내기로 1점이 들어옵니다.`:`${BN}, ${pk('bb',['볼넷으로 걸어 나갑니다.','풀카운트 끝에 볼넷.','공 네 개가 모두 빠집니다. 스트레이트 볼넷.','끈질기게 커트하더니 볼넷을 얻어 냅니다.'])}`; if(loaded)a='투수에게 가장 뼈아픈 실점입니다.'; break;
    case 'K':{ const best=p?pcBest(p):''; const look=lastPitch?lastPitch.res==='루킹 삼진':pcH(g,k,'kl')<.28; c=lastPitch?`${BN}, ${lastPitch.t}에 ${look?'루킹':'헛스윙'} 삼진!`:look?`${BN}, ${pk('kl2',['바깥쪽 꽉 찬 공에 그대로 서서 삼진!','몸쪽 꽉 찬 직구에 루킹 삼진!'])}`:`${BN}, ${best&&pcH(g,k,'kb')<.6?`결정구 ${best}에 `:''}헛스윙 삼진!`;
      const pt=pcPitToday(g,k,x[2]); if(pt.so+1>=6)a=`${PN}, 오늘 벌써 ${pt.so+1}번째 탈삼진입니다.`; else if(pcHand(b,p)&&pcH(g,k,'hh')<.5)a=`${pcHand(b,p)} 승부, 타자가 불리한 싸움이었습니다.`; break; }
    case 'DP':{const pat=pcDpPat(g,k);c=pat.known?`${BN}, ${fld(pat.start)} 정면 땅볼! 2루와 1루에서 아웃, ${pat.label} 병살!`:`${BN}, 땅볼 병살! 선행 주자와 타자가 모두 아웃됩니다.`; a=p&&gbT(p)>.6?`${PN}은(는) 땅볼 유도형 투수입니다. 원하던 그림이 나왔습니다.`:pk('dpa',['한 번에 불이 꺼집니다.','공격 흐름이 완전히 끊겼습니다.']); break; }
    case 'SAC':{ c=`${BN}, 희생번트! 주자를 ${pre.bases[1]?'2·3루':'2루'}로 보냅니다.`; const m=mgrOf(atT); if(m&&!m.interim&&m.small>=62)a=`${m.name} 감독다운 작전입니다. 한 점을 짜내겠다는 뜻입니다.`; break; }
    case 'OUT':{const fact=gamePA(x),target=cOutTarget(g,k);if(fact.bunt==='fc'){c=`${BN}, 번트 실패! ${target?`${nm(target.id)}, ${target.base}루에서 포스아웃.`:'앞선 주자가 포스아웃됩니다.'} 타자는 1루에 살아남습니다.`;a='작전이 어긋났습니다.';break;}
      if(fact.bunt==='out'){c=`${BN}, 번트 실패. 타자가 1루에서 아웃됩니다.${pre.bases.every((id,i)=>!id||x[5][i]===id)?' 주자는 그대로입니다.':''}`;break;}
      if(fact.error&&batAfter){const ep=pcErrPos(g,k)||fact.fielder;c=`${BN}, ${ep?fld(ep)+'의':'수비'} 실책! 타자 주자 1루에 살아 나갑니다.`;a='수비에서 나온 실수가 아쉽습니다.';break;}
      if(fact.fc){c=`${BN}, 야수선택! ${target?`${nm(target.id)}, ${target.base}루에서 포스아웃.`:'선행 주자가 아웃됩니다.'} 타자는 1루에 살아남습니다.`;break;}
      if(fact.sf){c=`${BN}, ${fact.fielder?fld(fact.fielder)+' 쪽':'외야'} 뜬공. 3루 주자 홈인! 희생플라이로 ${runs}점.`;break;}
      const pos=PC_POS[fact.fielder]?fact.fielder:null,t=fact.bipType;
      if(t==='GB')c=`${BN}, ${pos?fld(pos)+' 앞 ':''}땅볼. 1루에서 아웃${runs?`되는 사이 주자 홈인, ${runs}점.`:'.'}`;
      else if(t==='LD')c=`${BN}, ${pos?fld(pos)+' 정면 ':''}직선타, 잡아냅니다. 아웃.`;
      else if(t==='FB'||t==='PU')c=`${BN}, ${pos?fld(pos)+' 쪽 ':''}뜬공, 잡아냅니다. 아웃.`;
      else c=`${BN}, ${pos?fld(pos)+' 쪽 ':''}타구를 처리합니다. 아웃${runs?`, 그 사이 주자 홈인, ${runs}점.`:'.'}`;break; }
    default: c=`${BN} ${OUTK[o]||o}`; }
  /* 득점 상황 */
  if(runs>0&&o!=='HR'&&o!=='BB'&&!(o==='OUT'&&!batAfter))c+=` ${runs}점!`;
  if(runs>0){ if(walkoff)c+=` 끝내기! ${tshort(atT)}가 경기를 끝냅니다!`; else if(lead0<0&&lead1>0)c+=` 역전! ${myB}:${opB}.`; else if(lead0<0&&lead1===0)c+=` 동점! ${myB}:${opB}.`; else c+=` 스코어 ${sa}:${sh}.`; }
  /* 해설: 큰 장면 우선, 없으면 기록·상황 */
  if(!a){ if(['1B','2B','3B'].includes(o)&&risp&&pre.outs===2&&runs>0)a='2아웃 이후 나온 적시타. 이게 정말 값집니다.';
    else if(['1B','2B','3B','HR'].includes(o)&&today.h>=2)a=`오늘만 ${today.h+1}안타째, 감이 아주 좋습니다.`;
    else if(['1B','2B','3B','HR'].includes(o)&&today.pa>=3&&today.h===0)a='앞선 타석들의 침묵을 깨는 안타입니다.';
    else if(['1B','2B','3B','BB'].includes(o)&&leadoff)a=pk('lo',['선두 타자 출루. 이번 이닝 기회가 옵니다.','선두 타자가 살아 나갔습니다. 벤치가 바빠지겠네요.']);
    else if(o==='K'&&risp&&outsA===3)a='위기를 삼진으로 넘깁니다. 투수가 주먹을 불끈 쥡니다.';
    else if(outsA===3&&risp&&runs===0)a=`득점권 주자를 두고 이닝이 끝납니다. ${tshort(atT)}로선 아쉬운 공격.`;
    else if(inn>=8&&Math.abs(lead1)<=1&&typeof x[1]==='number'&&pcH(g,k,'lt')<.35)a='한 타석 한 타석이 승부처입니다.'; }
  if(outsA===3&&!walkoff)c+=` 이닝 종료.`;
  if(Array.isArray(x[14])&&x[14].length&&!x[16])c+=' '+x[14].map(m=>`${nm(m.id)}, ${m.to===4?'홈':m.to+'루'}${m.result==='out'?'에서 아웃.':'까지 진루.'}`).join(' ');
  return {c,a}; }
