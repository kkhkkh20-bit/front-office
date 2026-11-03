/* 공별 기록은 타석이 끝나기 전에 저장한다. 당시 구종·구속·위치·카운트를 보존한다.
   결과 확률은 기존 outcome이 담당하고, 공별 사건은 그 결과에 조건부로 구성한다. */
function gamePitchRecord(day,hid,aid,half,k,bid,pid,outcome,target,profile){
  const seed=(Math.imul(day,613)^Math.imul(hid+1,193)^Math.imul(aid+1,997)^Math.imul(half+1,3191)^Math.imul(k+1,97)^bid^pid)|0;
  return {v:1,pitches:FrontOfficeCore.buildPitchSequence({outcome,target,profile},FrontOfficeCore.createSeededRandom(seed))};
}
function storedPitchSequence(row){
  const rec=row?.[15];if(rec?.v!==1||!Array.isArray(rec.pitches)||!rec.pitches.length)return null;
  const valid=q=>q&&typeof q.t==='string'&&Number.isFinite(q.v)&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&q.x>=-.3&&q.x<=1.3&&q.y>=-.3&&q.y<=1.3&&Number.isInteger(q.b)&&q.b>=0&&q.b<=3&&Number.isInteger(q.s)&&q.s>=0&&q.s<=2&&['볼','볼넷','스트라이크','헛스윙','파울','루킹 삼진','헛스윙 삼진','번트','타격'].includes(q.res);
  return rec.pitches.every(valid)?rec.pitches:null;
}
