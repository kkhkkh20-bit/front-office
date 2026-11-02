/* 선수 분석: 관측 기록으로 계산한다. 기대값은 MLB 트래킹 모형이 아닌 게임의 타구 유형 모형 추정이다.
   투구 위치·발사각·타구별 속도·수비 기회는 기록하지 않으므로 배럴과 OAA를 생성하지 않는다. */
function analysisSpr(p,y){ return [p.spr,p.sprP].find(s=>s&&s.y===y)||null; }
function playerAnalysis(p,y){
  const h=seasonTotal(p,y,'1군'), s=analysisSpr(p,y), runs={bat:null,run:null,field:null};
  if(!p.isP&&h&&h.pa){ const w=wobaOf(h), l=lgBat(y,'1군'); if(w!=null)runs.bat=(w-l.woba)/l.scale*h.pa; runs.run=(h.sb||0)*.2-(h.cs||0)*.4; }
  let expected=null, zones=[];
  if(!p.isP&&s){
    const t=s.t||{}, n=Object.values(t).reduce((v,x)=>v+(x[0]||0),0), hr=Object.values(s.z||{}).reduce((v,x)=>v+(x[3]||0),0);
    if(n>0){
      const norm=.43*BIP_TF.GB+.21*BIP_TF.LD+.27*BIP_TF.FB+.09*BIP_TF.PU;
      let hits=hr, tb=hr*4, weighted=hr*2.1;
      for(const k of ['GB','LD','FB','PU']){ const count=Math.max(0,((t[k]||[])[0]||0)-(k==='FB'?hr:0)); const eh=count*Math.min(.95,.31*BIP_TF[k]/norm), doubles=eh*BIP_XB[k]; hits+=eh; tb+=eh+doubles; weighted+=eh*.89+doubles*(1.27-.89); }
      const so=h?(h.so||0):0, bb=h?(h.bb||0):0, den=n+so;
      expected={xba:hits/den,xslg:tb/den,xwoba:(weighted+.69*bb)/(den+bb),contacts:n};
      /* 투구 위치의 실측값이 아니다. 시즌 기대 타율에 공통 존 가중치를 적용한 도식이다. */
      zones=[.85,.93,.85,1.07,1.18,1.07,1.10,1.15,1.10,.55,.55,.65,.65].map(w=>clamp(expected.xba*w,0,1));
    }
  }
  return {y,h,s,expected,zones,runs};
}
