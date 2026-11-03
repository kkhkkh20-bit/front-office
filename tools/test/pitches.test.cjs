const test=require('node:test'),assert=require('node:assert/strict');
const core=import('../../src/core/index.mjs');
const profile={velo:148,max:154,pitches:[{name:'직구',value:60,active:true},{name:'슬라이더',value:66,active:true},{name:'커브',value:58,active:false}]};
test('공별 기록: 모든 타석 결과에서 합법적인 카운트·최종 공·투구 수를 구성한다',async()=>{
  const {buildPitchSequence,createSeededRandom}=await core;
  for(const outcome of ['BB','K','HR','1B','2B','3B','OUT','DP','SAC'])for(let n=1;n<=15;n++)for(let seed=0;seed<30;seed++){
    const seq=buildPitchSequence({outcome,target:n,profile},createSeededRandom(seed));let b=0,s=0;
    assert.equal(seq.length,Math.max(n,outcome==='BB'?4:outcome==='K'?3:1));
    seq.forEach((q,i)=>{assert.equal(q.b,b);assert.equal(q.s,s);assert.ok(['직구','슬라이더'].includes(q.t));assert.ok(q.v<=154&&q.v>=130);assert.ok(Number.isFinite(q.x)&&Number.isFinite(q.y));
      if(q.res==='볼'||q.res==='볼넷')b++;else if(q.res==='파울')s=Math.min(2,s+1);else if(/스트라이크|헛스윙|삼진/.test(q.res))s++;
      if(i<seq.length-1)assert.ok(b<=3&&s<=2,'타석이 끝난 뒤 공을 추가함');
    });
    assert.equal(b===4,outcome==='BB');assert.equal(s===3,outcome==='K');
    assert.equal(seq.at(-1).res,outcome==='BB'?'볼넷':outcome==='K'?seq.at(-1).res:outcome==='SAC'?'번트':'타격');
  }
});
test('공별 기록: 볼은 존 밖, 루킹 스트라이크는 존 안이며 같은 시드·능력은 같은 기록이다',async()=>{
  const {buildPitchSequence,createSeededRandom,pitchInZone}=await core;const before=JSON.stringify(profile);
  for(let seed=0;seed<200;seed++)for(const outcome of ['BB','K','1B']){
    const args={outcome,target:8,profile},a=buildPitchSequence(args,createSeededRandom(seed)),b=buildPitchSequence(args,createSeededRandom(seed));
    assert.deepEqual(a,b);
    for(const q of a){if(q.res==='볼'||q.res==='볼넷')assert.equal(pitchInZone(q),false);if(q.res==='스트라이크'||q.res==='루킹 삼진')assert.equal(pitchInZone(q),true);}
  }
  assert.equal(JSON.stringify(profile),before);
});
