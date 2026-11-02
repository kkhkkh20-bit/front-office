export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
export const sum=a=>a.reduce((s,x)=>s+x,0);
export const r5=x=>Math.round(x/5)*5;
export function hn(a,b){ // 고정된 정규 잡음: 같은 평가자·같은 선수면 같은 오차
  let h=2166136261>>>0;const s=a+'|'+b;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
  const u1=(h%9973+1)/9974; h=Math.imul(h^(h>>>15),2246822507)>>>0; const u2=(h%9967+1)/9968;
  return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
}
