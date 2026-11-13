/* Short, original caster calls. Facts come from pregame snapshots and revealed plays. */
function pcVoice(g,k,key,lines,all=false){let previous=-1;const type=row=>typeof row?.[1]==='number'?row[3]:row?.[1],wanted=type(g.pbp[k]);for(let i=0;i<=k;i++){if(all?typeof g.pbp[i]?.[1]!=='number':type(g.pbp[i])!==wanted)continue;let index=Math.floor(pcH(g,i,'voice:'+key)*lines.length);if(index===previous)index=(index+1)%lines.length;previous=index;}return lines[Math.max(0,previous)]||'';}
function pcName(g,id){ for(const sd of ['h','a'])for(const k of ['bat','pit']){ const q=(g.box?.[sd]?.[k]||[]).find(p=>p.id===id); if(q&&q.n)return q.n; } if(G.players[id])return G.players[id].name; return (typeof pNmAny==='function'&&pNmAny(id))||'선수'; } /* 투수 목록·보관 기록까지(검수 11-06) */
function pcMoment(g,k){const x=g.pbp[k],pre=pcBefore(g,k),top=x[0]%2===0,before=top?pre.sa-pre.sh:pre.sh-pre.sa,after=top?x[7]-x[8]:x[8]-x[7],inn=Math.floor(x[0]/2)+1;return {x,pre,top,inn,before,after,runs:x[6]||0,risp:!!(pre.bases[1]||pre.bases[2]),loaded:pre.bases.every(Boolean),walkoff:!top&&inn>=9&&before<=0&&after>0,team:top?g.away:g.home};}
function pcScoreFinish(g,k){const m=pcMoment(g,k);if(!m.runs)return '';if(m.walkoff)return ` 끝내기! ${tshort(m.team)}, 승부를 끝냅니다!`;if(m.before<0&&m.after>0)return ` 역전입니다! ${m.x[7]}:${m.x[8]}!`;if(m.before<0&&m.after===0)return ` 다시 동점! ${m.x[7]}:${m.x[8]}!`;return ` ${m.x[7]}:${m.x[8]}.`;}
function pcKnownTotals(g,k,id,key,pitcher=false){
 const base=g.broadcast?.players?.[id];if(!base)return null;
 let add=0;for(const x of (g.broadcast?.regular?g.pbp.slice(0,k):[]))if(typeof x[1]==='number'&&x[pitcher?2:1]===id){if(key==='hr'&&x[3]==='HR'||key==='h'&&['1B','2B','3B','HR'].includes(x[3])||key==='so'&&x[3]==='K')add++;}
 return {season:(base.season?.[key]||0)+add,career:(base.career?.[key]||0)+add};
}
function pcPitchingRun(g,k,attack){
 let outs=0,bf=0,hits=0,runs=0,reached=false,half=-1,previous=0;const pitchers=new Set();
 for(const x of g.pbp.slice(0,k+1)){if(x[0]%2!==attack)continue;if(half!==x[0]){half=x[0];previous=0;}if(x[1]==='PC'||x[1]==='SB')continue;
  const next=x[1]==='CS'?x[3]:x[4];outs+=Math.max(0,next-previous);previous=next;
  if(typeof x[1]!=='number')continue;bf++;pitchers.add(x[2]);runs+=x[6]||0;
  if(['1B','2B','3B','HR'].includes(x[3]))hits++;
  if(x[3]==='BB'||x[3]==='HBP'||x[9]||x[5]?.includes(x[1]))reached=true;
 }
 return {outs,bf,hits,runs,reached,pitchers:[...pitchers]};
}
function pcNoHitRecords(g,k){
 const x=g.pbp[k];if(!x||(typeof x[1]!=='number'&&x[1]!=='CS'))return [];
 const out=[],add=(kind,text,priority)=>out.push({kind,text,priority});
 if(k===g.pbp.length-1&&x[0]%2===1){ const r2=pcPitchingRun(g,k,0); if(r2.outs>=27&&!r2.hits&&!r2.runs){ const pf=r2.pitchers.length===1&&!r2.reached&&r2.bf===r2.outs, pn=r2.pitchers.length===1?pcName(g,r2.pitchers[0]):tshort(g.home)+' 투수진'; const wk=x[8]>x[7]; /* 무승부로 끝나면 끝내기가 아니고, 원정 투수 기록도 함께 본다(검수 11-07) */ add(pf?'perfect':'nohit',`${wk?'끝내기로 경기가 끝나면서':'무승부로 경기가 끝나면서'} ${pn}, ${pf?'퍼펙트게임':r2.pitchers.length>1?'팀 합작 노히트 노런':'노히트 노런'}을 완성합니다!`,110); if(wk)return out; } } /* 홈 투수 대기록은 9회말 끝내기로 확정된다(검수 11-06) */
 const attack=x[0]%2,run=pcPitchingRun(g,k,attack),pitcher=run.pitchers.length===1?pcName(g,run.pitchers[0]):tshort(attack?g.away:g.home)+' 투수진';
 if(!run.hits&&!run.runs){
  if(k===g.pbp.length-1&&run.outs>=27){const perfect=run.pitchers.length===1&&!run.reached&&run.bf===run.outs;add(perfect?'perfect':'nohit',`${pitcher}, ${perfect?'퍼펙트게임':run.pitchers.length>1?'팀 합작 노히트 노런':'노히트 노런'}! 대기록을 완성합니다!`,110);}
  else if((x[1]==='CS'?x[3]:x[4])===3&&[18,21,24].includes(run.outs))add('challenge',`${pitcher}, ${run.outs/3}이닝 무안타! ${run.pitchers.length===1&&!run.reached&&run.bf===run.outs?'퍼펙트게임':'노히트 노런'}에 도전합니다!`,80);
 }
 return out;
}
function pcRecords(g,k){
 const x=g.pbp[k];if(!x)return [];if(typeof x[1]!=='number')return pcNoHitRecords(g,k);
 const name=pcName(g,x[1]),o=x[3],hit=['1B','2B','3B','HR'].includes(o),prior=g.pbp.slice(0,k).filter(r=>r[1]===x[1]),out=[];
 const add=(kind,text,priority=50)=>out.push({kind,text,priority});
 if(hit){const types=new Set(prior.map(r=>r[3]));if(['1B','2B','3B','HR'].every(t=>types.has(t)||t===o)&&!['1B','2B','3B','HR'].every(t=>types.has(t)))add('cycle',`${name}, 사이클링 히트 달성!`,100);
  const hits=prior.filter(r=>['1B','2B','3B','HR'].includes(r[3])).length+1;if(hits>=5)add('hits',`${name}, 오늘만 ${hits}안타! 방망이가 멈추지 않습니다!`,60);
  const form=g.broadcast?.regular&&g.broadcast.players?.[x[1]],todayHit=prior.some(r=>['1B','2B','3B','HR'].includes(r[3]));
  if(!todayHit&&form?.streak>=19&&(form.streak+1)%5===0)add('streak',`${name}, ${form.streak+1}경기 연속 안타! 오늘도 이어갑니다!`,75);
 }
 if(o==='HR'){const n=prior.filter(r=>r[3]==='HR').length+1;if(n>=2)add('multihr',`${name}, 오늘 ${n}홈런! ${n>=3?'엄청납니다!':'멀티홈런!'}`,65);}
 const milestones=(id,key,pitcher,label,seasonMarks,step)=>{const n=pcKnownTotals(g,k,id,key,pitcher);if(!n||!g.broadcast?.regular)return;const who=pcName(g,id);if(seasonMarks.includes(n.season+1))add('season',`${who}, 시즌 ${n.season+1}${label}!`,70);if(n.career+1>=step&&(n.career+1)%step===0)add('career',`${who}, 통산 ${n.career+1}${label}!`,85);};
 if(hit)milestones(x[1],'h',false,'안타',[100,150,200,250],500);
 if(o==='HR')milestones(x[1],'hr',false,'호 홈런',[10,20,30,40,50,60],100);
 if(o==='K'){const n=g.pbp.slice(0,k+1).filter(r=>typeof r[1]==='number'&&r[2]===x[2]&&r[3]==='K').length;if([15,18,20].includes(n))add('strikeouts',`${pcName(g,x[2])}, 한 경기 ${n}탈삼진! 타선을 압도합니다!`,75);milestones(x[2],'so',true,'탈삼진',[100,150,200,250],500);}
 out.push(...pcNoHitRecords(g,k));
 return out.sort((a,b)=>b.priority-a.priority);
}
function pbpCall(g,k){
 const x=g.pbp[k];if(!x)return {c:'',a:''};const raw=pbpCallBase(g,k),pick=(key,lines)=>pcVoice(g,k,key,lines);
 if(x[1]==='PC')return {c:`${pcName(g,x[2])}, 마운드를 이어받습니다!`,a:''};
 if(x[1]==='SB'||x[1]==='CS'){const from=pcBefore(g,k).bases.indexOf(x[2]),base=from>=0?['2루','3루','홈'][from]:'다음 베이스',name=pcName(g,x[2]);return {c:x[1]==='SB'?`${name}, 공보다 먼저 들어갑니다! ${base} 도루 성공!`:`아, 잡혔어요! ${name}, ${base}에서 도루자!`,a:'',records:pcRecords(g,k)};}
 if(typeof x[1]!=='number')return {c:raw.c,a:''};
 const name=pcName(g,x[1]),o=x[3],m=pcMoment(g,k),today=pcToday(g,k,x[1]),form=g.broadcast?.players?.[x[1]],hit=['1B','2B','3B','HR'].includes(o);let c='';
 switch(o){
  case 'HR':{const kind=m.runs===4?'만루 홈런':m.runs>1?m.runs+'점 홈런':'솔로 홈런';c=today.hr?`또 홈런을 쳤어요! ${today.hr===1?'멀티홈런':`오늘 ${today.hr+1}홈런`}, ${name}!`:pick('homer-result',[`${name}, 넘어갑니다! ${kind}!`,`아, 이게 뭔가요! ${name}의 ${kind}!`,`담장 밖으로! ${name}, ${kind}!`,`이 한 방에 구장이 들썩입니다! ${name}, ${kind}!`,`제대로 후렸어요! ${name}, ${kind}!`,`잡을 수 없는 곳으로! ${name}, ${kind}!`]);break;}
  case '2B':c=pick('double',[`${name}, 쭉쭉 뻗었어요! 2루타!`,`${name}, 2루까지! 귀중한 2루타입니다!`,`한 방에 득점권! ${name}, 2루타!`,`외야를 흔들어 놓습니다! ${name}의 2루타!`,`이번에는 장타예요! ${name}, 2루타!`,`시원하게 돌렸어요! ${name}의 2루타!`]);break;
  case '3B':c=pick('triple',[`멈추지 않아요! ${name}, 3루타!`,`${name}, 달리고 또 달립니다! 3루타!`,`2루를 돌아 3루까지! ${name}, 3루타!`,`발까지 뜨겁습니다! ${name}의 3루타!`]);break;
  case '1B':c=pick('single',[`${name}, 안타! 방망이가 답합니다!`,`${name}, 안타를 만들어 냅니다!`,`살아 나갑니다! ${name}의 안타!`,`${name}, 공격을 잇는 안타!`,`좋아요, 안타입니다! ${name}!`,`${name}, 안타! 기회가 이어집니다!`]);break;
  case 'HBP':c=m.loaded?`아, 몸에 맞았어요! ${name}, 밀어내기 사구!`:`아, 몸에 맞았습니다! ${name}, 사구로 1루에 나갑니다.`;break;
  case 'BB':c=m.loaded?`${name}, 밀어내기 볼넷! ${storedPitchSequence(x)?.length===4?'공 네 개로 한 점!':'한 점을 거저 얻습니다!'}`:`${name}, 볼넷! 기다림 끝에 1루를 얻습니다.`;break;
  case 'K':{const q=storedPitchSequence(x)?.at(-1);c=q?`${name}, ${q.t}에 ${q.res==='루킹 삼진'?'루킹':'헛스윙'} 삼진!`:`${name}, 삼진! 마운드가 웃습니다!`;break;}
  case 'DP':c=`아, 이게 뭔가요! ${name}, 병살타! ${x[4]===3?'이닝이 끝납니다!':'아웃 두 개를 내줍니다!'}`;break;
  case 'SAC':c=`${name}, 짧게 댔습니다! 희생번트로 주자를 보냅니다.`;break;
  default:c=x[16]?`${name}, 번트 실패! 앞선 주자가 포스아웃됩니다!`:x[9]?`아, 이게 뭔가요! 수비 실책! ${name}, 살아 나갑니다!`:x[5].includes(x[1])?`${name}, 1루에서 살아남습니다!`:raw.c.replace('몸을 날려 잡고','잡아내고').replace('워닝 트랙에서','수비 위치에서');
 }
 if(hit&&!today.h&&g.broadcast?.regular&&form?.hitless>=3)c=`${name}, ${form.hitless+1}경기 만의 안타! 긴 침묵을 깹니다!${o==='HR'?' 홈런이에요!':o==='2B'?' 2루타!':o==='3B'?' 3루타!':''}`;
 if(hit&&m.runs&&m.pre.outs===2&&o!=='HR')c+=` 2아웃 적시타!`;
 if(hit){const before=pcPitchingRun(g,k-1,x[0]%2);if(before.outs>=18&&!before.hits)c=`아, 여기서 안타가 나옵니다! ${name}, 노히트 행진을 멈춥니다!`;}
 if(m.runs&&o!=='HR'&&o!=='BB'&&o!=='HBP'&&o!=='OUT')c+=` ${m.runs}점!`;
 if(o!=='OUT'||x[9]||x[5].includes(x[1]))c+=pcScoreFinish(g,k);
 if(Array.isArray(x[14])&&(o!=='OUT'||x[9]||x[5].includes(x[1])))c+=' '+x[14].map(r=>`${pcName(g,r.id)}, ${r.to===4?'홈':r.to+'루'}${r.result==='out'?'에서 아웃.':'까지 진루.'}`).join(' ');
 const beats=[c.trim()];
 if(o==='HR'&&form?.power){const team=g.broadcast?.teams?.[m.top?'a':'h']||tshort(m.team);beats.push(`역시 ${team}의 거포입니다! ${name}의 한 방!`);}
 return {c:c.trim(),a:'',beats,records:pcRecords(g,k)};
}
function pcAtBatIntro(g,k){const x=g.pbp[k],m=pcMoment(g,k),name=pcName(g,x[1]),pick=(key,lines)=>pcVoice(g,k,key,lines,true);return {c:m.loaded?`${m.pre.outs}아웃 만루! ${name}, 주인공이 될 기회입니다!`:m.risp?`${name}, 득점권 타석! 한 방이면 달라집니다!`:pick('at-bat',[`${name}, 타석에 섭니다. 승부를 보죠!`,`${pcName(g,x[2])} 대 ${name}! 이번에는 누가 웃을까요?`,`${name}, 배트를 고쳐 쥡니다!`,`${name}의 타석입니다. 공 하나에 집중합니다!`]),a:''};}
function pcPitchCall(g,k,q,index){if(/타격|번트/.test(q.res))return null;const name=pcName(g,g.pbp[k][1]),pick=(key,lines)=>{const first=pcVoice(g,k,'pitch:'+key,lines,true);return lines[(lines.indexOf(first)+index)%lines.length];};let c='';
 if(q.res==='몸에 맞는 공')c=`아, 몸에 맞았어요! ${name}, 사구입니다!`;
 else if(q.res==='파울')c=pick('foul',[`${name}, 커트! 승부가 길어집니다!`,`파울이에요! ${name}, 쉽게 물러서지 않아요!`,`또 파울! 이 타석, 끈질깁니다!`]);
 else if(q.res==='볼'||q.res==='볼넷')c=q.res==='볼넷'?`${name}, 볼넷! 1루로 나갑니다!`:q.b===2?`${q.t}, 볼! 이제 쓰리 볼입니다!`:pick('ball',[`${q.t}, 빠졌습니다! 볼!`,`지켜봅니다, ${q.t}! 볼입니다.`,`${q.t}, 존 밖! 타자가 참았어요!`]);
 else if(/삼진/.test(q.res))c=`${q.t}, ${q.res}! 이 승부는 투수의 것입니다!`;
 else c=/헛스윙/.test(q.res)?`${q.t}, 헛스윙!${q.s===1?' 두 스트라이크!':''}`:`${q.t}, 스트라이크!${q.s===1?' 이제 두 스트라이크입니다!':''}`;
 return {c,a:''};}
function pcLiveCall(g,k,phase,ctx={}){const name=pcName(g,g.pbp[k][1]),pick=(key,lines)=>pcVoice(g,k,'live:'+key,lines,true),fielder=ctx.fielder||'수비수';switch(phase){
 case 'flight':return {c:ctx.arc?pick('air',[`${name}, 높이 띄웠어요! ${fielder}, 따라갑니다!`,`뻗어 가는 타구! ${fielder}, 끝까지 봅니다!`,`공이 올라갑니다! ${fielder}의 글러브를 보세요!`]):ctx.ground?`${name}, 땅볼! ${fielder}, 달려 나옵니다!`:`낮게 뻗었어요! ${fielder}, 타구를 쫓습니다!`,a:''};
 case 'homer':return {c:ctx.landing||pick('homer-impact',[`갔습니다! ${name}, 담장 밖으로!`,`넘어갔어요! ${name}, 홈런입니다!`,`아, 이게 뭔가요! ${name}의 홈런!`]),a:''};
 case 'throw':return {c:ctx.relay?`${fielder}, ${ctx.receiver}에게 중계합니다!`:`${fielder}, ${ctx.receiver}에게 송구합니다!`,a:''};
 case 'steal':return {c:`뜁니다! ${ctx.runner}, ${ctx.base}를 노립니다!`,a:''};
 case 'bench-start':return {c:'잠깐, 벤치가 움직입니다! 분위기가 뜨거워져요!',a:''};
 case 'bench-talk':return {c:'말려야 합니다! 동료들이 사이를 막아섭니다!',a:''};
 case 'bench-back':return {c:'됐어요! 각자의 자리로, 다시 야구로 승부합니다!',a:''};
 default:return {c:ctx.text||'',a:''};}}
function cSpeak(g,k,phase,ctx={},cls=''){cCap(pcLiveCall(g,k,phase,ctx).c,cls);}
/* Long calls become sequential single lines, including on phones. */
function pcCaptionParts(text,limit){const words=String(text).split(/\s+/),out=[];let line='';for(let word of words){if(line.length+word.length+1>limit&&line){out.push(line);line='';}while(word.length>limit){if(line){out.push(line);line='';}out.push(word.slice(0,limit));word=word.slice(limit);}line+=(line?' ':'')+word;}if(line)out.push(line);return out;}
async function cResultCall(call,cls=''){
 const box=document.getElementById('cs-cap'),limit=Math.max(12,Math.floor(((box?.clientWidth||innerWidth)-(innerWidth<700?65:95))/(innerWidth<700?12:15)));
 for(const beat of call.beats||[call.c])for(const line of pcCaptionParts(beat,limit)){cCap(line,cls);await cSleep(Math.max(1400,cSpd()*900,Math.min(2600,line.length*65)));}
 for(const record of call.records||[])for(const line of pcCaptionParts(record.text,limit)){cCap(line,'record '+(record.kind==='challenge'?'challenge':''));await cSleep(2200*cSpd());}
}
