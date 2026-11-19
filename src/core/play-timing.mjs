// Presentation timing in metres and milliseconds. Recorded play results remain authoritative.
const bound=(v,a,b)=>Math.max(a,Math.min(b,v));
export function baseRunTime(speed=50,distance=27.43){return Math.round(distance/bound(7.6+(speed-50)*.04,6.6,9.4)*1000);} /* 전력 질주 평균 약 7.6m/s(사용자 피드백 11-07: 달리기가 느려 어색) */
export function throwTime(distance,arm=50){return Math.round(Math.max(.16,distance/bound(34+(arm-50)*.16,27,42))*1000);} /* 송구 평균 약 34m/s(120km/h), 강견은 150km/h 근처 */
export function contactTiming({distance,fieldDistance,speed=50,arc=false,airOut=false,homer=false}){
 const reaction=160,run=Math.round(Math.max(0,fieldDistance)/bound(7.4+(speed-50)*.035,6.2,9)*1000);
 const flight=Math.round(homer?bound(distance/26,3.1,5.5)*1000:arc?bound(distance/25,2.1,4.8)*1000:bound(distance/32,.65,2.5)*1000);
 const arrival=reaction+run,pickup=airOut?0:240,actualFlight=airOut?Math.max(flight,arrival+180):flight;
 return {reaction,run,flight:actualFlight,catchAt:Math.max(actualFlight,arrival)+pickup,pickup};
}
/* 중계 화면 좌표(칸) ↔ 3D 경기장 좌표(m, x는 3루 쪽이 +, z는 홈에서 중견수 쪽). src/scene3d/scene.mjs의 point와 같은 표·같은 식이다(tools/test/play-timing.test.cjs가 맞춰 본다).
   칸 좌표는 2루 베이스 줄(y=56)을 경계로 축척이 달라, 내야수 기본 자리(2루수·유격수는 y=50인데 3D에서는 2루 베이스 높이인 z=38m)에서 한 칸만 벗어나도 3D에서는 15m 뒤 외야 잔디가 된다.
   내야 타구 자리는 야수가 실제로 서 있는 m 좌표에서 정한 뒤 fieldCoord로 칸 좌표로 되돌려 쓴다. */
export const FIELD_CONTROLS=[[[50,89],[0,0]],[[68,73],[-19.3975,19.3975]],[[50,56],[0,38.795]],[[32,73],[19.3975,19.3975]],[[50,72],[0,18.44]],[[50,97],[0,-1.45]],[[40,89],[.95,0]],[[60,89],[-.95,0]],[[74,66],[-25,25]],[[62,50],[-12,38]],[[38,50],[12,38]],[[26,66],[25,25]],[[18,31],[48,75]],[[50,17],[0,98]],[[82,31],[-48,75]]];
const FIELD_IN=[19.3975/18,38.795/33],FIELD_OUT=[1.5,98/72];
export function fieldMetres(pt){const exact=FIELD_CONTROLS.find(([a])=>Math.hypot(a[0]-pt[0],a[1]-pt[1])<.02);if(exact)return exact[1].slice();const k=pt[1]>56?FIELD_IN:FIELD_OUT;return [-(pt[0]-50)*k[0],(89-pt[1])*k[1]];}
/* m → 칸. 2루 베이스 높이(38.8m)와 그 뒤 외야 시작(44.9m) 사이는 칸 좌표가 없어 가까운 쪽으로 붙인다 */
export function fieldCoord(x,z){const edge=33*FIELD_IN[1]-.005,far=33*FIELD_OUT[1]+.005;if(z<(edge+far)/2){z=Math.min(z,edge);return [50-x/FIELD_IN[0],89-z/FIELD_IN[1]];}z=Math.max(z,far);return [50-x/FIELD_OUT[0],89-z/FIELD_OUT[1]];}
