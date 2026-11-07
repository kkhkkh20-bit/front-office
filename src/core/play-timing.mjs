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
