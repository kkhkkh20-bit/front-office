/* 날짜 계산은 UTC 기준이며 게임 상태와 독립적이다. */
export const D0=Date.UTC(2024,0,1);
export const dnum=(y,m,d)=>Math.round((Date.UTC(y,m-1,d)-D0)/864e5);
export function dobj(n){const t=new Date(D0+n*864e5);return {y:t.getUTCFullYear(),m:t.getUTCMonth()+1,d:t.getUTCDate(),w:t.getUTCDay()};}
export const WD='일월화수목금토';
export const dstr=n=>{const o=dobj(n);return `${o.y}년 ${o.m}월 ${o.d}일 ${WD[o.w]}요일`;};
export const dmd=n=>{const o=dobj(n);return `${o.m}월 ${o.d}일`;};
export const dsh=n=>{const o=dobj(n);return `${o.m}/${o.d}`;};
export function onOrAfter(y,m,d,w){ let n=dnum(y,m,d); while(dobj(n).w!==w)n++; return n; }
