/* 외국인 후보 기록 해석표(src/engine/12_foreign.js의 FREC)를 다시 맞춘다.
 후보 생성(newForeign: 리그 비중·능력 분포·리그 보정 LG_ADJ·리그 환경 편차 FENV·MLB 경력)을 바꾸면 이 표도 다시 맞춰야 한다.
 사용: bash build.sh && node tools/fit-frec.js   → 출력된 한 줄을 FREC 자리에 붙여 넣는다.
 방법: 리그·투타별로 실제 능력(ovr)을 기록 지표로 최소제곱 회귀한다. 타자 [1, OPS, ln(1+MLB 경기)], 투수 [1, WHIP, K-BB/9, HR/9, ln(1+MLB 경기)]. 마지막 값은 남는 오차(표준편차) */
const fs=require('fs'), path=require('path');
const ENGINE=path.join(__dirname,'..','dist','engine.js'); if(!fs.existsSync(ENGINE)){ console.error('dist/engine.js가 없습니다. bash build.sh를 먼저 실행하세요.'); process.exit(2); }
const oe=console.error; console.error=()=>{};
const rows=[];
for(let seed=1;seed<=3;seed++){ let a=seed*7919; Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  new Function('rows',fs.readFileSync(ENGINE,'utf8')+`
DEMO.on=false; newGame(6);
for(let i=0;i<9000;i++){ const p=newForeign(i%3===0?'아시아':'용병',{market:true}); const h=p.prev; const g=Math.log1p(p.mlbG||0);
  const x=p.isP?(h.outs?[1,(h.h+h.bb)*3/h.outs,(h.so-h.bb)*27/h.outs,h.hr*27/h.outs,g]:null):(h.pa?[1,bRate(h).ops,g]:null);
  if(x)rows.push({lg:p.prevLvl,P:p.isP?1:0,x,y:ovr(p)}); delete G.players[p.id]; }`)(rows); }
console.error=oe;
/* 정규방정식 (XᵀX)b = Xᵀy 를 가우스 소거로 푼다 */
function ols(X,y){ const k=X[0].length, A=Array.from({length:k},()=>Array(k+1).fill(0));
  X.forEach((r,n)=>{ for(let i=0;i<k;i++){ for(let j=0;j<k;j++)A[i][j]+=r[i]*r[j]; A[i][k]+=r[i]*y[n]; } });
  for(let i=0;i<k;i++){ let m=i; for(let r=i+1;r<k;r++)if(Math.abs(A[r][i])>Math.abs(A[m][i]))m=r; [A[i],A[m]]=[A[m],A[i]]; if(Math.abs(A[i][i])<1e-9){ A[i][i]=1; continue; }
    for(let r=0;r<k;r++)if(r!==i){ const f=A[r][i]/A[i][i]; for(let c=i;c<=k;c++)A[r][c]-=f*A[i][c]; } }
  return A.map((r,i)=>r[k]/r[i]); }
const G={}; for(const r of rows){ (G[r.lg]=G[r.lg]||[[],[]])[r.P].push(r); }
const out=[]; for(const lg of Object.keys(G).sort()){ const part=[0,1].map(P=>{ const L=G[lg][P]; if(L.length<50)return 'null'; const X=L.map(r=>r.x), y=L.map(r=>r.y);
    /* MLB 경력이 아예 없는 리그는 그 열을 빼고 맞춘다(계수 0) */ const noG=X.every(r=>r[r.length-1]===0); const Xf=noG?X.map(r=>r.slice(0,-1)):X;
    const b=ols(Xf,y); if(noG)b.push(0); const res=L.map((r,n)=>y[n]-r.x.reduce((s,v,i)=>s+v*b[i],0)); const sd=Math.sqrt(res.reduce((s,v)=>s+v*v,0)/res.length);
    return '['+b.map(v=>+v.toFixed(3)).concat(+sd.toFixed(2)).join(', ')+']'; });
  out.push(`'${lg}':[${part.join(',')}]`); }
console.log('const FREC={'+out.join(',')+'};');
