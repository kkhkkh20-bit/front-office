/* ---------- 중계 멘트: 캐스터(상황 묘사)와 해설(분석) ----------
   타구 방향, 수비수 이름, 상황(선두 타자·득점권·만루·역전·동점·끝내기), 오늘 기록, 시즌 기록, 결정구, 좌우 대결,
   감독 성향을 섞어 같은 결과도 매번 다르게 말한다. 같은 경기·같은 타석이면 항상 같은 멘트가 나온다 */
function pcH(g,k,s){ const t='pc'+g.day+':'+g.home+':'+k+':'+s; let h=2166136261; for(let i=0;i<t.length;i++){ h^=t.charCodeAt(i); h=Math.imul(h,16777619); } h^=h>>>13; h=Math.imul(h,1274126177); h^=h>>>16; return (h>>>0)/4294967296; } /* 고르게 퍼진 고정 난수 */
function pcPick(g,k,s,arr){ return arr[Math.floor(pcH(g,k,s)*arr.length)]; }
const PC_POS={P:'투수','C':'포수','1B':'1루수','2B':'2루수','3B':'3루수',SS:'유격수',LF:'좌익수',CF:'중견수',RF:'우익수'};
function pcFielder(g,half,pos){ const def=g.box[half%2?'a':'h']; if(!def)return ''; const b=def.bat.find(x=>x.pos===pos); return b?b.n:''; }
/* k번째 기록 직전 상태 */
function pcBefore(g,k){ const L=g.pbp, x=L[k]; if(k<=0)return {outs:0,bases:[0,0,0],sa:0,sh:0};
  const p=L[k-1]; const s=pbpState(g,k-1); if(p[0]!==x[0])return {outs:0,bases:[0,0,0],sa:s.sa,sh:s.sh}; return {outs:s.outs>=3?0:s.outs,bases:s.outs>=3?[0,0,0]:s.bases.slice(),sa:s.sa,sh:s.sh}; }
function pcToday(g,k,id){ let pa=0,h=0,hr=0,so=0; for(let i=0;i<k;i++){ const y=g.pbp[i]; if(y[1]!==id)continue; pa++; if(['1B','2B','3B','HR'].includes(y[3]))h++; if(y[3]==='HR')hr++; if(y[3]==='K')so++; } return {pa,h,hr,so}; }
function pcPitToday(g,k,id){ let so=0,bf=0; for(let i=0;i<k;i++){ const y=g.pbp[i]; if(typeof y[1]!=='number'||y[2]!==id)continue; bf++; if(y[3]==='K')so++; } return {so,bf}; }
function pcBest(p){ try{ const a=arsenal(p,p.r.stf).filter(x=>x[0]!=='직구').sort((x,z)=>z[1]-x[1])[0]; return a?a[0]:''; }catch(e){ return ''; } }
function pcHand(b,p){ if(!b||!p||b.bt==='양')return ''; return b.bt===p.th?(b.bt==='좌'?'좌 대 좌':'우 대 우'):''; }
function pcNum(n){ return n>0?n:0; }
/* 메인: {c:캐스터, a:해설} */
function pbpCall(g,k){ const L=g.pbp, x=L[k]; if(!x)return {c:'',a:''}; const nm=id=>{ const p=G.players[id]; return p?p.name:'?'; };
  const half=x[0], inn=Math.floor(half/2)+1, top=half%2===0, atT=top?g.away:g.home, dfT=top?g.home:g.away; const pk=(s,a)=>pcPick(g,k,s,a);
  if(x[1]==='PC'){ const p=G.players[x[2]]; const st=pbpState(g,k); const diff=top?st.sh-st.sa:st.sa-st.sh; /* 수비 팀 기준 */
    const c=`${tshort(dfT)} 마운드 교체. ${nm(x[2])} 투수가 올라옵니다.${p?` 시즌 평균자책점 ${eraAt(g,k,x[2])}.`:''}`;
    let a=''; if(p){ const cd=p.ld?consecDays(p,g.day):0; const role=posLabel(p);
      if(cd>=2)a=`${p.name}은(는) ${cd+1}일 연속 등판입니다. ${mgrOf(dfT).name} 감독이 이 경기를 꼭 잡겠다는 뜻이지만 팔 부담이 큽니다.`;
      else if(inn>=8&&Math.abs(diff)<=2)a=pk('pa',[`승부처에 ${role} ${p.name}을(를) 올립니다. 여기서 막아야 합니다.`,`${inn}회 접전, 벤치가 아껴 둔 카드를 꺼냅니다.`]);
      else if(inn<=5)a=pk('pb',['선발이 일찍 내려갑니다. 불펜 소모가 커지겠네요.','예상보다 빠른 교체입니다. 벤치가 흐름을 끊으려 합니다.']); }
    return {c,a}; }
  const pre=pcBefore(g,k);
  if(x[1]==='SB'||x[1]==='CS'){ const r=G.players[x[2]]; const from=pre.bases.indexOf(x[2]); const to=from>=0?['2루','3루','홈'][from]:'다음 베이스'; const cat=pcFielder(g,half,'C');
    if(x[1]==='SB')return {c:`${nm(x[2])}, ${to} 도루 성공!${cat?` 포수 ${cat}의 송구가 늦었습니다.`:''}`,a:r&&r.r.spd>=68?pk('sb',[`${r.name}의 발은 리그에서도 손꼽힙니다.`,'투수가 견제를 더 신경 써야 했습니다.']):''};
    const c0=G.players[(g.box[half%2?'a':'h'].bat.find(b=>b.pos==='C')||{}).id]; return {c:`${nm(x[2])}, ${to} 도루 실패!${cat?` 포수 ${cat}의 정확한 송구에 걸렸습니다.`:''}`,a:c0&&catArm(c0)>=60?`${c0.name} 포수 어깨가 좋습니다. 함부로 뛸 수 없는 포수입니다.`:pk('cs',['무리한 주루였습니다. 흐름이 끊깁니다.','타이밍을 빼앗겼습니다.'])}; }
  const b=G.players[x[1]], p=G.players[x[2]], o=x[3], runs=x[6]||0, outsA=x[4];
  const sa=x[7], sh=x[8], befA=pre.sa, befH=pre.sh; const myB=top?sa:sh, opB=top?sh:sa, myB0=top?befA:befH, opB0=top?befH:befA;
  const lead0=myB0-opB0, lead1=myB-opB; const walkoff=!top&&inn>=9&&lead0<=0&&lead1>0;
  const risp=!!(pre.bases[1]||pre.bases[2]), loaded=pre.bases.every(Boolean), leadoff=pre.outs===0&&!pre.bases.some(Boolean)&&(k===0||L[k-1][0]!==half||L.slice(0,k).filter(y=>y[0]===half&&typeof y[1]==='number').length===0);
  const BN=b?b.name:'?', PN=p?p.name:'?'; const fld=pos=>{ const n=pcFielder(g,half,pos); return n?`${PC_POS[pos]} ${n}`:PC_POS[pos]; };
  const batAfter=x[5].includes(x[1]); const today=pcToday(g,k,x[1]);
  let c='', a='';
  switch(o){
    case 'HR':{ const dist=Math.round(105+pcH(g,k,'d')*28); const dir=pk('hd',['좌측 담장','좌중간 담장','가운데 담장','우중간 담장','우측 담장']); const big=dist>=125?'큼지막한 ':dist<=108?'담장을 살짝 넘기는 ':'';
      c=`${BN}, 쳤습니다! ${dir}을 넘어갑니다! ${big}${runs===4?'만루 홈런!':runs>1?`${runs}점 홈런!`:'솔로 홈런!'} 비거리 ${dist}m.`;
      const sea=seasonAt(g,k,x[1],false); const n=sea?sea.hr+1:0; a=n?`시즌 ${n}호 홈런입니다.`:''; if(today.hr>=1)a+=` 오늘만 ${today.hr+1}번째 홈런, 멀티 홈런 경기입니다.`; else if(b&&b.r.pow>=68&&pcH(g,k,'hp')<.5)a+=' 힘으로 넘긴 타구입니다.'; break; }
    case '3B': c=`${BN}, ${pk('t3',['우중간 깊숙한 곳','좌중간을 완전히 가르는 타구','우익선상 끝까지 굴러가는 타구'])}! 3루까지 달립니다. 3루타!`; a=b&&b.r.spd>=62?'발이 빠르니까 3루까지 가능한 타구였습니다.':''; break;
    case '2B': c=`${BN}, ${pk('t2',['좌중간을 가르는','우중간을 가르는','좌익선상','우익선상','펜스를 직접 맞히는'])} 타구! 2루타.`; break;
    case '1B':{ const inf=b&&b.r.spd>=64&&pcH(g,k,'if')<.25; c=inf?`${BN}, ${fld(pk('ip',['SS','3B','2B']))} 쪽 느린 땅볼, 1루 세이프! 내야 안타.`:`${BN}, ${pk('t1',['좌전','중전','우전','3유간을 빠지는','1·2루간을 꿰뚫는','유격수 키를 넘기는'])} 안타.`; break; }
    case 'BB': c=loaded?`${BN}, 볼넷! 밀어내기로 1점이 들어옵니다.`:`${BN}, ${pk('bb',['볼넷으로 걸어 나갑니다.','풀카운트 끝에 볼넷.','공 네 개가 모두 빠집니다. 스트레이트 볼넷.','끈질기게 커트하더니 볼넷을 얻어 냅니다.'])}`; if(loaded)a='투수에게 가장 뼈아픈 실점입니다.'; break;
    case 'K':{ const best=p?pcBest(p):''; const look=pcH(g,k,'kl')<.28; c=look?`${BN}, ${pk('kl2',['바깥쪽 꽉 찬 공에 그대로 서서 삼진!','몸쪽 꽉 찬 직구에 루킹 삼진!'])}`:`${BN}, ${best&&pcH(g,k,'kb')<.6?`결정구 ${best}에 `:''}헛스윙 삼진!`;
      const pt=pcPitToday(g,k,x[2]); if(pt.so+1>=6)a=`${PN}, 오늘 벌써 ${pt.so+1}번째 탈삼진입니다.`; else if(pcHand(b,p)&&pcH(g,k,'hh')<.5)a=`${pcHand(b,p)} 승부, 타자가 불리한 싸움이었습니다.`; break; }
    case 'DP':{ const pat=pk('dp',[['SS','2B','6-4-3'],['2B','SS','4-6-3'],['3B','2B','5-4-3']]); c=`${BN}, ${fld(pat[0])} 정면 땅볼! ${pcFielder(g,half,pat[1])||PC_POS[pat[1]]}에서 1루까지, ${pat[2]} 병살!`; a=p&&gbT(p)>.6?`${PN}은(는) 땅볼 유도형 투수입니다. 원하던 그림이 나왔습니다.`:pk('dpa',['한 번에 불이 꺼집니다.','공격 흐름이 완전히 끊겼습니다.']); break; }
    case 'SAC':{ c=`${BN}, 희생번트! 주자를 ${pre.bases[1]?'2·3루':'2루'}로 보냅니다.`; const m=mgrOf(atT); if(m&&!m.interim&&m.small>=62)a=`${m.name} 감독다운 작전입니다. 한 점을 짜내겠다는 뜻입니다.`; break; }
    case 'OUT':{ if(batAfter){ c=`${BN}, ${fld(pk('ep',['SS','3B','2B']))}의 실책! 타자 주자 1루에 살아 나갑니다.`; a='수비에서 나온 실수가 아쉽습니다.'; break; }
      if(runs>0){ c=`${BN}, ${fld(pk('sf',['LF','CF','RF']))} 쪽 뜬공, 3루 주자 홈인! 희생플라이로 ${runs}점.`; break; }
      const r=pcH(g,k,'ot'), gb=p?gbT(p)*.08:0; if(r<.45+gb){ const pos=pk('gp',['SS','2B','3B','1B','SS','2B','P']); const f=G.players[(g.box[half%2?'a':'h'].bat.find(z=>z.pos===pos)||{}).id]; const nice=f&&pos!=='P'&&fieldV(f,pos)>=63&&pcH(g,k,'gn')<.35;
        c=nice?`${BN}, ${fld(pos)} 옆으로 빠지는 땅볼! 몸을 날려 잡고 1루 송구, 아웃!`:pos==='1B'?`${BN}, ${fld(pos)} 앞 땅볼, 직접 베이스를 밟습니다. 아웃.`:`${BN}, ${fld(pos)} ${pk('gt',['앞 땅볼. 1루에서 아웃.','정면 땅볼, 가볍게 처리합니다.','쪽 평범한 땅볼. 아웃.','앞 느린 땅볼, 달려 나와 1루로. 아웃.'])}`; if(nice)a=`${f.name}의 수비가 안타 하나를 지웠습니다.`; }
      else if(r<.85){ const pos=pk('fp',['LF','CF','RF','CF']); c=`${BN}, ${fld(pos)} ${pk('ft',['쪽 높이 뜬 공. 잡아냅니다.','쪽 뜬공, 여유 있게 잡습니다.','쪽으로 뻗어 가는 타구... 워닝 트랙에서 잡힙니다!','앞 얕은 뜬공, 달려 나와 잡습니다.'])}`; const f=G.players[(g.box[half%2?'a':'h'].bat.find(z=>z.pos===pos)||{}).id]; if(f&&fieldV(f,pos)>=64&&pcH(g,k,'fr')<.4)a=`${f.name}, 수비 범위가 넓습니다. 쉽게 잡았습니다.`; }
      else c=`${BN}, 잘 맞은 타구! 그러나 ${fld(pk('lp',['SS','2B','3B','1B']))} 정면 직선타.`; break; }
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
  return {c,a}; }
