/* 타석 확률 모형이 정한 결과에 맞춰 투구 사건을 구성한다.
   위치는 시뮬레이션 좌표(포수 시점), 실제 경기 추적 자료가 아니다.
   난수원을 주입하므로 화면 조회가 경기 난수를 소비하지 않는다. */
export function buildPitchSequence({outcome,target=4,profile},random){
  const pitches=profile.pitches.filter(p=>p.active!==false);
  const best=[...pitches].sort((a,b)=>b.value-a.value)[0];
  const off={'직구':0,'투심':-3,'커터':-5,'슬라이더':-12,'스위퍼':-14,'체인지업':-15,'포크':-13,'커브':-22};
  const n=Math.max(outcome==='BB'?4:outcome==='K'?3:1,Math.round(target));
  const candidates=[];
  for(let b=0;b<=3;b++)for(let s=0;s<=2;s++){
    if(outcome==='BB'&&b!==3||outcome==='K'&&s!==2)continue;
    const fouls=n-1-b-s;if(fouls<0||fouls>0&&s!==2)continue;
    candidates.push({b,s,fouls});
  }
  const choice=candidates[Math.floor(random()*candidates.length)];
  const pre=[...Array(choice.b).fill('볼'),...Array(choice.s).fill('스트라이크')];
  for(let i=pre.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pre[i],pre[j]]=[pre[j],pre[i]];}
  const calls=pre.map(t=>t==='스트라이크'&&random()<.45?'헛스윙':t);
  calls.push(...Array(choice.fouls).fill('파울'));
  calls.push(outcome==='BB'?'볼넷':outcome==='K'?(random()<.28?'루킹 삼진':'헛스윙 삼진'):outcome==='SAC'?'번트':'타격');
  let b=0,s=0;
  return calls.map((res,i)=>{
    const pitch=i===calls.length-1&&outcome==='K'&&random()<.6?best:pitches[Math.floor(random()*pitches.length)];
    const t=pitch.name,v=Math.min(profile.max,Math.round(profile.velo+(off[t]??-10)+(random()-.5)*4));
    const q={t,v,...pitchLocation(res,random),res,b,s};
    const after=pitchCountAfter(q);b=after.b;s=after.s;return q;
  });
}
export function pitchCountAfter(q){
  let {b,s}=q;
  if(q.res==='볼'||q.res==='볼넷')b++;
  else if(q.res==='파울')s=Math.min(2,s+1);
  else if(/스트라이크|헛스윙|삼진/.test(q.res))s++;
  return {b,s};
}
export function pitchInZone(q){return q.x>=0&&q.x<=1&&q.y>=0&&q.y<=1;}
export function pitchLocation(res,random){
  let x=.04+random()*.92,y=.04+random()*.92;
  const ball=res==='볼'||res==='볼넷',chase=/헛스윙|파울/.test(res)&&random()<.4;
  if(ball||chase){const side=Math.floor(random()*4),edge=-.08-random()*.16;if(side===0)x=edge;else if(side===1)x=1-edge;else if(side===2)y=edge;else y=1-edge;}
  return {x:+x.toFixed(3),y:+y.toFixed(3)};
}
