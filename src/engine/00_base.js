'use strict';
/* ===== 기본 도구 ===== */
const R=Math.random;
const rnd=(a,b)=>a+R()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const gauss=()=>{let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
const N=(m,s)=>m+gauss()*s;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pick=a=>a[Math.floor(R()*a.length)];
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const sum=a=>a.reduce((s,x)=>s+x,0);
const r5=x=>Math.round(x/5)*5;
const rr=x=>Math.floor(x)+(R()<x-Math.floor(x)?1:0);
/* 능력치 화면 표시: 내부 계산은 20~80 스카우트 척도 그대로 두고, 보여 줄 때만 100점 척도로 바꾼다.
   1군 평균(51)=63, 상급(58)=73, 대박(65)=84, 초대형(72)=95, 유망주 평균(24)=42 */
const DV_PTS=[[20,30],[24,42],[35,52],[45,58],[51,63],[58,73],[65,84],[72,95],[78,100]];
function dvRaw(x){ if(x<=DV_PTS[0][0])return DV_PTS[0][1]; for(let i=1;i<DV_PTS.length;i++){ const [a,b]=DV_PTS[i-1],[c,d]=DV_PTS[i]; if(x<=c)return b+(x-a)*(d-b)/(c-a); } return 100; }
function dv(x){ return typeof x==='number'&&isFinite(x)?Math.round(dvRaw(x)):x; }
/* 평가 오차를 화면 점수(100점 척도)로: 내부 척도 ±sd가 화면에서 몇 점인지 */
function dvSd(c,sd){ if(!(sd>0)||typeof c!=='number')return Math.max(1,Math.round(sd||0)); return Math.max(1,Math.round((dvRaw(c+sd)-dvRaw(c-sd))/2)); }
function dvo(p){ return p?dv(ovr(p)):'-'; }
function hn(a,b){ // 고정된 정규 잡음: 같은 평가자·같은 선수면 같은 오차
  let h=2166136261>>>0;const s=a+'|'+b;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
  const u1=(h%9973+1)/9974; h=Math.imul(h^(h>>>15),2246822507)>>>0; const u2=(h%9967+1)/9968;
  return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
}


/* 종합 능력 등급(게임 공통, 원래 능력 단위): 화면과 엔진(창단 지명 평가) 모두 쓴다 */
const GRD=v=>v>=75?'S':v>=65?'A':v>=55?'B':v>=50?'C':v>=45?'D':v>=35?'E':'F';
