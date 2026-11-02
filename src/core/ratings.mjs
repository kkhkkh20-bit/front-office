/* 내부 능력과 화면 척도의 순수 변환. 게임 상태를 참조하지 않는다. */
export const DV_PTS=[[20,30],[24,42],[35,52],[45,58],[51,63],[58,73],[65,84],[72,95],[78,100]];
export function dvRaw(x){ if(x<=DV_PTS[0][0])return DV_PTS[0][1]; for(let i=1;i<DV_PTS.length;i++){ const [a,b]=DV_PTS[i-1],[c,d]=DV_PTS[i]; if(x<=c)return b+(x-a)*(d-b)/(c-a); } return 100; }
export function dv(x){ return typeof x==='number'&&isFinite(x)?Math.round(dvRaw(x)):x; }
/* 평가 오차를 화면 점수(100점 척도)로: 내부 척도 ±sd가 화면에서 몇 점인지 */
export function dvSd(c,sd){ if(!(sd>0)||typeof c!=='number')return Math.max(1,Math.round(sd||0)); return Math.max(1,Math.round((dvRaw(c+sd)-dvRaw(c-sd))/2)); }
