// Presentation timing in metres and milliseconds. Recorded play results remain authoritative.
const bound=(v,a,b)=>Math.max(a,Math.min(b,v));
export function baseRunTime(speed=50,distance=27.43){return Math.round(distance/bound(6.5+(speed-50)*.035,5.6,8.8)*1000);}
export function throwTime(distance,arm=50){return Math.round(Math.max(.18,distance/bound(29+(arm-50)*.13,23,36))*1000);}
export function contactTiming({distance,fieldDistance,speed=50,arc=false,airOut=false,homer=false}){
 const reaction=180,run=Math.round(Math.max(0,fieldDistance)/bound(6.8+(speed-50)*.03,5.5,8.4)*1000);
 const flight=Math.round(homer?bound(distance/26,3.1,5.5)*1000:arc?bound(distance/25,2.1,4.8)*1000:bound(distance/32,.65,2.5)*1000);
 const arrival=reaction+run,pickup=airOut?0:240,actualFlight=airOut?Math.max(flight,arrival+180):flight;
 return {reaction,run,flight:actualFlight,catchAt:Math.max(actualFlight,arrival)+pickup,pickup};
}
