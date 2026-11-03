/* 난수원을 주입해 저장·검사와 같은 호출 순서를 유지한다. */
export function createSeededRandom(seed){
  let a=seed|0;
  return ()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
}
export function createRandom(random){
  const R=random;
  const rnd=(a,b)=>a+R()*(b-a);
  const ri=(a,b)=>Math.floor(rnd(a,b+1));
  const gauss=()=>{let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
  const N=(m,s)=>m+gauss()*s;
  const pick=a=>a[Math.floor(R()*a.length)];
  const rr=x=>Math.floor(x)+(R()<x-Math.floor(x)?1:0);
  return {R,rnd,ri,gauss,N,pick,rr};
}
