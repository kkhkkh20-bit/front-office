/* 선수 분석: 관측 기록으로 계산한다. 경기에서 기록하지 않는 기대값과 코스별 분포는 생성하지 않는다.
   투구 위치·발사각·타구별 속도·수비 기회는 기록하지 않으므로 배럴과 OAA를 생성하지 않는다. */
function analysisSpr(p,y){ return [p.spr,p.sprP].find(s=>s&&s.y===y)||null; }
function playerAnalysis(p,y){
  const h=seasonTotal(p,y,'1군'), s=analysisSpr(p,y), runs={bat:null,run:null,field:null};
  if(!p.isP&&h&&h.pa){ const w=wobaOf(h), l=lgBat(y,'1군'); if(w!=null)runs.bat=(w-l.woba)/l.scale*h.pa; runs.run=(h.sb||0)*.2-(h.cs||0)*.4; }
  const observed=!p.isP&&h&&h.pa?{...bRate(h),woba:wobaOf(h)}:null;
  return {y,h,s,expected:null,zones:[],observed,runs};
}
