/* 성장 점검 묶음: tools/audit-growth.js 결과 JSON 여러 개를 합쳐 표로 낸다(측정만, 게임 코드와 무관)
 사용: node tools/audit-growth-report.js s1.json s2.json ...
 정의
 - 시즌 능력: 그해 겨울 성장 직전(newYear 첫머리) 종합 능력. 없으면(그 사이 은퇴·방출) 정규시즌 다음 날 값
 - 나이: 그 시즌 나이(게임 p.age, 겨울 성장 때 한 살 오른다)
 - 1군 주전 시즌: 1군 400타석 이상, 또는 100이닝(300아웃) 이상, 또는 선발 비중 20% 이하로 50이닝(150아웃) 이상
 - 표시 능력: 화면 100점 척도(FrontOfficeCore.dv와 같은 꺾은선) */
const fs=require('fs');
const DV_PTS=[[20,30],[24,42],[35,52],[45,58],[51,63],[58,73],[65,84],[72,95],[78,100]];
const dv=x=>{ if(x<=DV_PTS[0][0])return DV_PTS[0][1]; for(let i=1;i<DV_PTS.length;i++){ const [a,b]=DV_PTS[i-1],[c,d]=DV_PTS[i]; if(x<=c)return b+(x-a)*(d-b)/(c-a); } return 100; };
const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:NaN, sd=a=>{ const m=avg(a); return a.length>1?Math.sqrt(avg(a.map(v=>(v-m)**2))):NaN; };
const q=(a,p)=>{ if(!a.length)return NaN; const s=[...a].sort((x,y)=>x-y); return s[Math.min(s.length-1,Math.floor(s.length*p))]; };
const f1=x=>Number.isFinite(x)?x.toFixed(1):'-', f2=x=>Number.isFinite(x)?x.toFixed(2):'-', pc=x=>Number.isFinite(x)?(100*x).toFixed(0)+'%':'-';
const tbl=(h,rows)=>{ console.log('| '+h.join(' | ')+' |'); console.log('|'+h.map(()=>'---').join('|')+'|'); for(const r of rows)console.log('| '+r.join(' | ')+' |'); console.log(''); };
const files=process.argv.slice(2); if(!files.length){ console.error('결과 JSON을 주세요'); process.exit(2); }
const W=[]; for(const f of files){ const D=JSON.parse(fs.readFileSync(f,'utf8')); W.push(D); }
/* 세계별 정리 */
const ALL=[]; /* {w,id,info,S:Map(y→row)} */
for(const [wi,D] of W.entries()){ const S={};
  for(const s of D.snaps){ const [id,y,age,o,pot,team,pa,outs,g,gs,war,fut,mil,ys,pros,tag]=s; const k=id; const M=S[k]=S[k]||new Map(); const prev=M.get(y);
    const row={y,age,o,pot,team,pa,outs,g,gs,war,fut,mil,ys,pros,tag};
    if(!prev||tag===1){ if(prev){ row.pa=Math.max(row.pa,prev.pa); row.outs=Math.max(row.outs,prev.outs); row.g=Math.max(row.g,prev.g); row.gs=Math.max(row.gs,prev.gs); if(!row.war&&prev.war)row.war=prev.war; row.mil=row.mil||prev.mil; } M.set(y,row); } }
  for(const id in S){ const info=D.players[id]||{}; for(const r of S[id].values())if(info.cls!=null&&r.y<=info.cls)r.pros=1; /* 지명된 해(합류 전) */ ALL.push({w:wi,id:+id,info,S:S[id],D}); } }
const LASTY=Math.min(...W.map(D=>Math.max(...D.snaps.map(s=>s[1])))); const FIRSTY=Math.min(...W.map(D=>D.startY));
const regular=r=>r&&(r.pa>=400||r.outs>=300||(r.outs>=150&&r.g>0&&r.gs/r.g<=.2));
const inFirst=r=>r&&(r.pa>0||r.outs>0);
console.log(`세계 ${W.length}개(SEED ${W.map(D=>D.seed).join('·')}), 시즌 ${FIRSTY}–${LASTY}, 오류 ${W.map(D=>D.errs.length).join('·')}\n`);

/* ===== 1. 나이별 능력 ===== */
console.log('## 1. 나이별 종합 능력(표시 척도, 국내 소속 선수, 합류 전 신인 제외)\n');
for(const isP of [false,true]){ const rows=[]; for(let a=18;a<=37;a++){ const V=[]; for(const P of ALL){ if(!!P.info.isP!==isP)continue; for(const r of P.S.values()){ if(r.age===a&&!r.pros&&r.team!=null)V.push(dv(r.o)); } }
    if(V.length<5)continue; rows.push([a,V.length,f1(avg(V)),f1(sd(V)),f1(q(V,.1)),f1(q(V,.5)),f1(q(V,.9))]); }
  console.log(isP?'### 투수':'### 타자'); tbl(['나이','선수-시즌','평균','표준편차','하위10%','중앙','상위10%'],rows); }
/* 주전(1군 주전 시즌)만 */
console.log('### 1군 주전 시즌만(정의 위) 나이 분포\n'); { const rows=[]; const C={}; let n=0; for(const P of ALL)for(const r of P.S.values())if(regular(r)){ C[r.age]=(C[r.age]||0)+1; n++; }
  const L=[]; for(const P of ALL)for(const r of P.S.values())if(regular(r))L.push(r.age);
  for(let a=19;a<=40;a++)if(C[a])rows.push([a,C[a],pc(C[a]/n)]); tbl(['나이','주전 시즌','비중'],rows); console.log(`주전 평균 나이 ${f1(avg(L))}, 중앙 ${q(L,.5)}\n`); }

/* ===== 1b. 해마다 변화 ===== */
console.log('## 1b. 해마다 종합 능력 변화(그 시즌 끝 − 지난 시즌 끝, 표시 척도). 나이 = 변화가 일어난 시즌의 나이\n');
const yoy=[]; for(const P of ALL){ for(const r of P.S.values()){ const p=P.S.get(r.y-1); if(!p||r.tag!==1||p.tag!==1||p.pros&&r.pros)continue; if(p.pros){ /* 신인 첫해: 지명 직후 → 1년차 끝 */ } yoy.push({isP:!!P.info.isP,age:r.age,d:dv(r.o)-dv(p.o),draw:r.o-p.o,mil:r.mil,pros:p.pros,o0:p.o,gap:p.pot-p.o,team:r.team,P,r,p}); } }
for(const isP of [false,true]){ const rows=[]; for(let a=19;a<=37;a++){ const V=yoy.filter(x=>x.isP===isP&&x.age===a&&!x.mil).map(x=>x.d); const M=yoy.filter(x=>x.isP===isP&&x.age===a&&x.mil).map(x=>x.d); if(V.length<5)continue;
    rows.push([a,V.length,f2(avg(V)),f2(sd(V)),pc(V.filter(v=>v>=3).length/V.length),pc(V.filter(v=>v<=-3).length/V.length),pc(V.filter(v=>v<0).length/V.length),M.length?`${f2(avg(M))} (${M.length})`:'-']); }
  console.log(isP?'### 투수':'### 타자'); tbl(['나이','표본','평균 변화','표준편차','+3 이상','−3 이하','하락 비율','군 복무 중 평균(표본)'],rows); }
/* 누적: 19세 → n세 평균 표시 상승(같은 선수 추적) */
console.log('### 같은 선수 추적: 시작 나이별 3·5·7년 뒤 평균 표시 변화(군 복무 포함)\n'); { const rows=[]; for(const a0 of [19,20,21,22,23,24,25,26,28,30,32]){ const c=[]; for(const k of [3,5,7]){ const V=[]; for(const P of ALL){ for(const r of P.S.values()){ if(r.age!==a0||r.pros||r.tag!==1)continue; const z=P.S.get(r.y+k); if(z&&z.tag===1&&z.team!=null)V.push(dv(z.o)-dv(r.o)); } } c.push(V.length>=10?`${f1(avg(V))} (${V.length})`:'-'); } rows.push([a0,...c]); } tbl(['시작 나이','+3년','+5년','+7년'],rows); }

/* 정점 나이 */
console.log('## 1c. 정점 나이\n');
{ const pk=[]; for(const P of ALL){ const R=[...P.S.values()].filter(r=>r.tag===1&&!r.pros&&r.team!=null).sort((a,b)=>a.y-b.y); if(R.length<9)continue; const a0=R[0].age, a1=R[R.length-1].age; if(a0>24||a1<31)continue; let b=R[0]; for(const r of R)if(r.o>b.o)b=r; if(dv(b.o)<60)continue; pk.push({age:b.age,isP:!!P.info.isP,o:dv(b.o)}); }
  const C={}; for(const x of pk)C[x.age]=(C[x.age]||0)+1; tbl(['정점 나이','선수','비중'],Object.keys(C).sort((a,b)=>a-b).map(a=>[a,C[a],pc(C[a]/pk.length)]));
  console.log(`대상: 24세 이하에서 31세 이상까지 9시즌 이상 관찰된 선수 중 정점 표시 60 이상 ${pk.length}명. 평균 정점 나이 ${f1(avg(pk.map(x=>x.age)))}, 중앙 ${q(pk.map(x=>x.age),.5)}(타자 ${f1(avg(pk.filter(x=>!x.isP).map(x=>x.age)))} · 투수 ${f1(avg(pk.filter(x=>x.isP).map(x=>x.age)))})\n`); }

/* ===== 2. 드래프트 결과 ===== */
console.log('## 2. 드래프트 결과(창단 드래프트 제외, 정규 신인 드래프트)\n');
const picks=[]; for(const [wi,D] of W.entries()){ for(const dr of D.drafts){ if(dr.y<D.startY)continue; const got=new Set(); for(const [pid,rd,no,tid] of dr.picks){ got.add(pid); picks.push({w:wi,id:pid,y:dr.y,rd,no,tid,info:D.players[pid]||{}}); } for(const id of dr.cls)if(!got.has(id))picks.push({w:wi,id,y:dr.y,rd:0,no:0,info:D.players[id]||{}}); } }
const byKey=new Map(ALL.map(P=>[P.w+':'+P.id,P]));
const band=x=>x.rd===0?'미지명':x.rd===1?(x.no<=3?'1R 1–3':'1R 4–10'):x.rd===2?'2R':x.rd<=5?'3–5R':'6R+';
const BANDS=['1R 1–3','1R 4–10','2R','3–5R','6R+','미지명'];
const out=(x,k)=>{ const P=byKey.get(x.w+':'+x.id); const R=P?[...P.S.values()].filter(r=>r.y>x.y&&r.y<=x.y+k):[]; const reg=R.some(regular), any=R.some(inFirst); const nReg=R.filter(regular).length; const war=R.reduce((s,r)=>s+(r.war||0),0);
  let pk=null; for(const r of R)if(r.tag===1&&!r.pros&&(!pk||r.o>pk.o))pk=r; const first=R.filter(regular).map(r=>r.y-x.y)[0]??null; const signed=R.some(r=>r.team!=null&&!r.pros); return {reg,any,nReg,war,pk:pk?dv(pk.o):null,pkAge:pk?pk.age:null,first,signed}; };
for(const k of [3,5,7]){ const L=picks.filter(x=>x.y+k<=LASTY); const rows=[];
  for(const grp of [...BANDS.map(b=>['band',b]),['col','고졸'],['col','대졸']]){ const S=L.filter(x=>grp[0]==='band'?band(x)===grp[1]:(grp[1]==='대졸')===!!x.info.college&&x.rd>0); if(!S.length)continue; const O=S.map(x=>out(x,k));
    rows.push([grp[1],S.length,pc(O.filter(o=>o.reg).length/S.length),pc(O.filter(o=>o.nReg>=Math.min(3,k-1)).length/S.length),pc(O.filter(o=>!o.any).length/S.length),f1(avg(O.filter(o=>o.pk!=null).map(o=>o.pk))),f1(avg(O.filter(o=>o.pk!=null).map(o=>o.pkAge))),f2(avg(O.map(o=>o.war))),f1(avg(O.filter(o=>o.first!=null).map(o=>o.first)))]); }
  console.log(`### 지명 뒤 ${k}년(드래프트 ${FIRSTY}–${LASTY-k}, 첫 시즌 = 지명 다음 해)`); tbl(['구간','인원','주전 1시즌+',`주전 ${Math.min(3,k-1)}시즌+`,'1군 출전 없음','창 안 정점 표시','정점 나이','창 안 WAR 합','첫 주전까지(년)'],rows); }
/* 지명 때 능력·잠재력 */
{ const rows=BANDS.map(b=>{ const S=picks.filter(x=>band(x)===b&&x.info.pot0!=null); return [b,S.length,f1(avg(S.map(x=>dv(x.info.o0)))),f1(avg(S.map(x=>dv(x.info.pot0)))),f1(sd(S.map(x=>dv(x.info.pot0)))),pc(S.filter(x=>x.info.college).length/S.length),pc(S.filter(x=>x.info.ready).length/S.length)]; });
  console.log('### 지명 때 능력·잠재력(표시 척도, 참가 시점 실제 값)'); tbl(['구간','인원','현재 능력','잠재력','잠재력 표준편차','대졸 비중','즉시 전력(ready)'],rows); }
/* 첫해 주전 */
{ const L=picks.filter(x=>x.y+1<=LASTY); const rows=BANDS.map(b=>{ const S=L.filter(x=>band(x)===b); const O=S.map(x=>out(x,1)); return [b,S.length,pc(O.filter(o=>o.reg).length/S.length),f2(avg(O.map(o=>o.war)))]; }); console.log('### 1년차(지명 다음 시즌) 주전'); tbl(['구간','인원','1년차 주전','1년차 WAR'],rows); }
/* 지명 순위별 창 안 WAR(1~10순위 세부) */
{ const k=5; const L=picks.filter(x=>x.y+k<=LASTY&&x.rd===1); const rows=[]; for(let n=1;n<=10;n++){ const S=L.filter(x=>x.no===n); const O=S.map(x=>out(x,k)); rows.push([n,S.length,pc(O.filter(o=>o.reg).length/S.length),f2(avg(O.map(o=>o.war))),f1(avg(O.filter(o=>o.pk!=null).map(o=>o.pk)))]); } console.log('### 1라운드 순위별(5년 창)'); tbl(['순위','인원','주전 1시즌+','5년 WAR 합','정점 표시'],rows); }

/* ===== 3. 잠재력과 결과 ===== */
console.log('## 3. 잠재력과 결과\n');
{ /* 지명 때 잠재력(pot0) 대비 창 안 정점(원래 척도) */
  for(const k of [5,7]){ const L=picks.filter(x=>x.y+k<=LASTY&&x.rd>0&&x.info.pot0!=null); const rows=[]; for(const grp of ['전체','고졸','대졸','1R','2–5R','6R+']){ const S=L.filter(x=>grp==='전체'||grp==='고졸'&&!x.info.college||grp==='대졸'&&x.info.college||grp==='1R'&&x.rd===1||grp==='2–5R'&&x.rd>=2&&x.rd<=5||grp==='6R+'&&x.rd>=6);
      const O=S.map(x=>{ const P=byKey.get(x.w+':'+x.id); const R=P?[...P.S.values()].filter(r=>r.y>x.y&&r.y<=x.y+k&&r.tag===1&&!r.pros):[]; if(!R.length)return null; const pk=Math.max(...R.map(r=>r.o)); return pk-x.info.pot0; }).filter(v=>v!=null);
      rows.push([grp,O.length,f1(avg(O)),pc(O.filter(v=>Math.abs(v)<=3).length/O.length),pc(O.filter(v=>v>3).length/O.length),pc(O.filter(v=>v<-10).length/O.length)]); }
    console.log(`### 지명 때 잠재력 대비 ${k}년 창 안 정점(원래 척도, 남아 있는 선수만)`); tbl(['구간','인원','정점−잠재력 평균','±3 안','+3 초과','−10 미만'],rows); }
  /* 처음 세계 어린 선수: 20~22세 시작, 끝까지(최대 12시즌) */
  const L=ALL.filter(P=>{ const r=P.S.get(FIRSTY); return r&&r.tag===1&&r.age>=19&&r.age<=22&&!r.pros; }); const O=L.map(P=>{ const r0=P.S.get(FIRSTY); const R=[...P.S.values()].filter(r=>r.tag===1); return Math.max(...R.map(r=>r.o))-r0.pot; });
  console.log(`### 처음 세계 19~22세(${FIRSTY} 잠재력) 대비 ${FIRSTY}–${LASTY} 정점: ${O.length}명, 평균 ${f1(avg(O))}, ±3 안 ${pc(O.filter(v=>Math.abs(v)<=3).length/O.length)}, +3 초과 ${pc(O.filter(v=>v>3).length/O.length)}, −10 미만 ${pc(O.filter(v=>v<-10).length/O.length)}\n`); }
/* 잠재력 안정성 */
{ const rows=[]; for(const [a0,a1] of [[18,20],[21,23],[24,26],[27,29],[30,33]]){ const V=[]; for(const P of ALL)for(const r of P.S.values()){ const p=P.S.get(r.y-1); if(!p||r.tag!==1||p.tag!==1||r.age<a0||r.age>a1)continue; V.push(r.pot-p.pot); }
    if(V.length)rows.push([`${a0}–${a1}`,V.length,f2(avg(V)),f2(sd(V)),pc(V.filter(v=>v<=-3).length/V.length),pc(V.filter(v=>v>=3).length/V.length)]); }
  console.log('### 잠재력(원래 척도) 해마다 변화'); tbl(['나이','표본','평균','표준편차','−3 이하','+3 이상'],rows);
  const L=picks.filter(x=>x.rd>0&&x.info.pot0!=null); const rows2=[]; for(const k of [1,3,5]){ const V=[]; for(const x of L){ const P=byKey.get(x.w+':'+x.id); const r=P&&P.S.get(x.y+k); if(r&&r.tag===1)V.push(r.pot-x.info.pot0); } rows2.push([k,V.length,f2(avg(V)),f2(sd(V)),pc(V.filter(v=>v<=-5).length/V.length)]); }
  console.log('### 지명 때 잠재력 → k년 뒤 잠재력'); tbl(['k년','표본','평균 변화','표준편차','−5 이하'],rows2); }
/* 실현율(realK) 분포 */
{ const K=[]; for(const D of W)for(const id in D.players){ const x=D.players[id]; if(x.cls!=null&&x.realK!=null)K.push(x.realK); } console.log(`### 숨은 잠재력 실현율(realK, 지명 클래스) ${K.length}명: 평균 ${f2(avg(K))}, <0.6 ${pc(K.filter(v=>v<.6).length/K.length)}, 0.6–0.9 ${pc(K.filter(v=>v>=.6&&v<.9).length/K.length)}, ≥0.9 ${pc(K.filter(v=>v>=.9).length/K.length)}\n`); }
/* 환경: 겨울 성장 기록(develop) */
{ const R=[]; for(const D of W)for(const d of D.dev){ const [id,y,age,o0,p0,team,facg,coach,play,youth,svc,ti,o1,p1,rk]=d; if(age<19||age>25||svc)continue; R.push({age,o0,gap:Math.max(0,p0-o0),facg,coach,play,youth,ti,d:o1-o0}); }
  const qs=(k)=>{ const s=R.map(x=>x[k]).sort((a,b)=>a-b); return [q(s,.25),q(s,.5),q(s,.75)]; };
  const rows=[]; for(const k of ['facg','coach','play','ti','youth']){ const [a,b,c]=qs(k); const lo=R.filter(x=>x[k]<=a), hi=R.filter(x=>x[k]>=c); rows.push([k,`${f2(a)} / ${f2(c)}`,`${f2(avg(lo.map(x=>x.d)))} (${lo.length})`,`${f2(avg(hi.map(x=>x.d)))} (${hi.length})`,f2(avg(lo.map(x=>x.gap))),f2(avg(hi.map(x=>x.gap)))]); }
  console.log('### 19–25세 겨울 성장(원래 척도, 군 복무 제외): 계수 하위 25% vs 상위 25%'); tbl(['계수','경계(하위/상위)','하위 평균 성장','상위 평균 성장','하위 남은 여지','상위 남은 여지'],rows);
  /* 최소제곱: d ~ gap + age + facg + coach + play + ti */
  const X=R.map(x=>[1,x.gap,x.age,x.facg,x.coach,x.play,x.ti]), Y=R.map(x=>x.d); const n=X[0].length; const A=Array.from({length:n},()=>Array(n).fill(0)), b=Array(n).fill(0);
  for(let i=0;i<X.length;i++)for(let j=0;j<n;j++){ b[j]+=X[i][j]*Y[i]; for(let k=0;k<n;k++)A[j][k]+=X[i][j]*X[i][k]; }
  for(let i=0;i<n;i++){ let m=i; for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[m][i]))m=r; [A[i],A[m]]=[A[m],A[i]]; [b[i],b[m]]=[b[m],b[i]]; for(let r=0;r<n;r++){ if(r===i)continue; const f=A[r][i]/A[i][i]; for(let k=i;k<n;k++)A[r][k]-=f*A[i][k]; b[r]-=f*b[i]; } }
  const beta=b.map((v,i)=>v/A[i][i]); const nm=['상수','남은 여지(1점)','나이(1세)','시설 계수(+0.1)','코치 배율(+0.1)','출전 배율(+0.1)','훈련 강도(+0.1)']; const sc=[1,1,1,.1,.1,.1,.1];
  const sds=['gap','age','facg','coach','play','ti'].map(k=>sd(R.map(x=>x[k])));
  console.log(`### 겨울 성장 회귀(${R.length}건, 19–25세): 계수`); tbl(['항목','효과(원래 척도)','표본 표준편차'],nm.map((v,i)=>[v,f2(beta[i]*sc[i]),i?f2(sds[i-1]):'-'])); }
/* 구단 시설 상·하위 */
{ const rows=[]; for(const [wi,D] of W.entries()){ }
  const T=[]; for(const [wi,D] of W.entries()){ const by={}; for(const [y,tid,g,lv] of D.fac){ (by[tid]=by[tid]||[]).push(g); } const L=Object.entries(by).map(([tid,v])=>({wi,tid:+tid,g:avg(v)})).sort((a,b)=>b.g-a.g); L.forEach((x,i)=>x.rank=i); T.push(...L); }
  const grow=(sel)=>{ const V=[]; for(const x of yoy){ if(x.age<19||x.age>25||x.mil||x.pros)continue; const t=T.find(z=>z.wi===x.P.w&&z.tid===x.p.team); if(t&&sel(t))V.push(x.d); } return V; };
  const top=grow(t=>t.rank<=2), bot=grow(t=>t.rank>=7), mid=grow(t=>t.rank>2&&t.rank<7);
  const gt=T.filter(t=>t.rank<=2).map(t=>t.g), gb=T.filter(t=>t.rank>=7).map(t=>t.g);
  console.log(`### 구단 시설(19–24세 평균 시설 계수) 상위 3구단 vs 하위 3구단, 19–25세 한 해 표시 변화(군 복무 제외)`); tbl(['구단','시설 계수 평균','표본','평균 한 해 변화'],[['상위 3',f2(avg(gt)),top.length,f2(avg(top))],['중간 4','-',mid.length,f2(avg(mid))],['하위 3',f2(avg(gb)),bot.length,f2(avg(bot))]]); }

/* ===== 4. 실패·늦깎이 ===== */
console.log('## 4. 실패와 늦깎이\n');
{ const rows=[]; for(const k of [5,7]){ const L=picks.filter(x=>x.y+k<=LASTY); const r1=L.filter(x=>x.rd===1).map(x=>out(x,k)), lo=L.filter(x=>x.rd>=6).map(x=>out(x,k)), un=L.filter(x=>x.rd===0).map(x=>out(x,k));
    rows.push([k,`${pc(r1.filter(o=>!o.reg).length/r1.length)} (${r1.length})`,`${pc(r1.filter(o=>!o.any).length/r1.length)}`,`${pc(lo.filter(o=>o.reg).length/lo.length)} (${lo.length})`,`${pc(un.filter(o=>o.reg).length/un.length)} (${un.length})`,`${pc(un.filter(o=>o.signed).length/un.length)}`]); }
  tbl(['창(년)','1R 주전 못 됨','1R 1군 출전 없음','6R+ 주전 됨','미지명 주전 됨','미지명 프로 입단'],rows); }
/* 군 복무 */
{ const C={}; for(const P of ALL)for(const r of P.S.values()){ if(r.pros||r.team==null&&!r.mil)continue; const a=r.age; if(a<19||a>29)continue; const c=C[a]=C[a]||[0,0,0]; c[0]++; if(r.mil===1)c[1]++; if(r.mil===2)c[2]++; }
  console.log('### 군 복무(그 시즌 중 복무 기간에 걸친 선수 비중)'); tbl(['나이','표본','상무','현역'],Object.keys(C).map(a=>[a,C[a][0],pc(C[a][1]/C[a][0]),pc(C[a][2]/C[a][0])])); }
/* 리그 수준 흐름 */
{ const rows=[]; for(let y=FIRSTY;y<=LASTY;y++){ const V=[]; for(const P of ALL){ const r=P.S.get(y); if(r&&r.tag===1&&r.team!=null&&!r.pros)V.push(dv(r.o)); } V.sort((a,b)=>b-a); rows.push([y,V.length,f1(avg(V.slice(0,300*W.length).length?V:V)),f1(avg(V.slice(0,30*W.length*10/10))),V.filter(v=>v>=80).length/W.length]); }
  console.log('### 연도별 국내 선수(세계 평균)'); tbl(['연도','선수(합)','평균 표시','상위 30×세계 평균','표시 80+ (세계당)'],rows); }

/* ===== 5. 드래프트 보정 요약(11-17) =====
 - 1군 도달: 창 안에 1군 출전(타석 또는 아웃 1 이상)이 한 번이라도 있음
 - 주전: 위 '1군 주전 시즌' 정의. 실패(bust): 창 안에 주전 시즌이 한 번도 없음
 - 특급(a): 창 안 어느 시즌에 리그 WAR 상위 10명(외국인 포함, 타자·투수 함께) 또는 골든글러브. 수집 JSON에 top10·gg가 있어야 한다
 - 특급(b): 창 안 정점 표시 능력 80 이상
 - 미지명: 그해 드래프트 참가자 중 지명받지 못한 선수(트라이아웃·육성 계약으로 입단한 선수 포함) */
console.log('## 5. 드래프트 보정 요약\n');
{ const elite=(x,k)=>{ const P=byKey.get(x.w+':'+x.id); const D=W[x.w]; let a=false,b=false,gg=false; if(!P)return {a,b,gg}; for(const r of P.S.values()){ if(r.y<=x.y||r.y>x.y+k)continue; if(!r.pros&&dv(r.o)>=80)b=true; const T=(D.top10||{})[r.y]||[], g=(D.gg||{})[r.y]||[]; if(T.includes(x.id)||g.includes(x.id))a=true; if(g.includes(x.id))gg=true; } return {a,b,gg}; };
  const k=7, L=picks.filter(x=>x.y+k<=LASTY); const rows=[];
  for(const b of [...BANDS,'지명 전체']){ const S=L.filter(x=>b==='지명 전체'?x.rd>0:band(x)===b); if(!S.length)continue; const O=S.map(x=>out(x,k)), Y1=S.map(x=>out(x,1));
    rows.push([b,S.length,pc(O.filter(o=>o.any).length/S.length),pc(O.filter(o=>o.reg).length/S.length),pc(O.filter(o=>o.nReg>=3).length/S.length),pc(Y1.filter(o=>o.reg).length/S.length),f2(avg(O.map(o=>o.war))),pc(O.filter(o=>!o.reg).length/S.length),pc(O.filter(o=>o.signed).length/S.length)]); }
  console.log(`### 지명 뒤 ${k}년(드래프트 ${FIRSTY}–${LASTY-k})`); tbl(['구간','인원','1군 도달','주전 1시즌+','주전 3시즌+','1년차 주전','7년 WAR 합','주전 못 됨(bust)','프로 입단'],rows);
  for(const kk of [7,10]){ const L2=picks.filter(x=>x.y+kk<=LASTY); if(!L2.length)continue; const rows2=[]; for(const b of BANDS){ const S=L2.filter(x=>band(x)===b); if(!S.length)continue; const E=S.map(x=>elite(x,kk)); rows2.push([b,S.length,pc(E.filter(e=>e.a).length/S.length)+` (${E.filter(e=>e.a).length})`,pc(E.filter(e=>e.b).length/S.length)+` (${E.filter(e=>e.b).length})`]); }
    console.log(`### 특급 비율: 지명 뒤 ${kk}년(드래프트 ${FIRSTY}–${LASTY-kk})`); tbl(['구간','인원','(a) WAR 상위 10·골든글러브','(b) 정점 표시 80+'],rows2); }
  /* 특급 출신 분포: KBO 골든글러브 국내 수상자 2011–2025(51명) 출신과 비교하려고 KBO와 같은 묶음(R1·R2·R3·R4–6·R7+·미지명)으로 센다.
     대상: 정규 드래프트(창단 드래프트 제외) 출신 중 지명 다음 해~관찰 끝 사이에 특급(a) 시즌이 한 번이라도 있는 선수(한 명은 한 번). 창이 짧아 젊은 특급만 잡힌다 */
  { const ob=x=>x.rd===0?'미지명':x.rd===1?'R1':x.rd===2?'R2':x.rd===3?'R3':x.rd<=6?'R4–6':'R7+'; const OB=['R1','R2','R3','R4–6','R7+','미지명']; const KBO={R1:27.5,R2:29.4,R3:5.9,'R4–6':21.6,'R7+':7.8,'미지명':7.8};
    for(const kk of [10,99]){ const L2=picks.filter(x=>kk===99||x.y+kk<=LASTY); const C={}, N={}, Gg={}; let tot=0, gt=0; for(const x of L2){ const b=ob(x); N[b]=(N[b]||0)+1; const e=elite(x,kk); if(e.a){ C[b]=(C[b]||0)+1; tot++; } if(e.gg){ Gg[b]=(Gg[b]||0)+1; gt++; } }
      console.log(`### 특급(a) 출신 분포: ${kk===99?'관찰 끝까지(드래프트 '+FIRSTY+'–'+(LASTY-1)+')':'지명 뒤 10년(드래프트 '+FIRSTY+'–'+(LASTY-10)+')'}, 특급 ${tot}명 · 골든글러브 ${gt}명`); tbl(['출신','인원','특급(a)','특급 비율','특급 중 비중','골든글러브','골든글러브 중 비중','KBO 골든글러브 출신 비중'],OB.map(b=>[b,N[b]||0,C[b]||0,pc((C[b]||0)/(N[b]||1)),pc((C[b]||0)/(tot||1)),Gg[b]||0,pc((Gg[b]||0)/(gt||1)),KBO[b]+'%'])); } }
  /* 리그 정상급: 해마다 WAR 상위 10명 중 국내 선수, 국내 표시 80+ (세계 평균) */
  const rows3=[]; for(let y=FIRSTY;y<=LASTY;y++){ let dom=0,n=0,e80=0; for(const D of W){ const T=(D.top10||{})[y]; if(T){ n++; dom+=T.filter(id=>D.players[id]).length; } } for(const P of ALL){ const r=P.S.get(y); if(r&&r.tag===1&&r.team!=null&&!r.pros&&dv(r.o)>=80)e80++; } rows3.push([y,n?f1(dom/n):'-',f1(e80/W.length)]); }
  console.log('### 리그 정상급(세계 평균)'); tbl(['연도','WAR 상위 10 중 국내','국내 표시 80+'],rows3);
  /* 해마다 1군 출전 국내 선수와 첫 1군 출전 인원(세계 평균) */
  const deb={}; for(const [wi,D] of W.entries()){ const seen=new Set(); for(let y=FIRSTY;y<=LASTY;y++){ let n=0,u=0; for(const P of ALL){ if(P.w!==wi)continue; const r=P.S.get(y); if(!inFirst(r))continue; u++; if(!seen.has(P.id)){ seen.add(P.id); n++; } } (deb[y]=deb[y]||[]).push([n,u]); } }
  console.log('### 1군 출전 국내 선수(세계 평균, 첫 해는 모두 첫 출전으로 잡혀 뺀다)'); tbl(['연도','1군 출전 인원','첫 1군 출전'],Object.keys(deb).filter(y=>+y>FIRSTY).map(y=>[y,f1(avg(deb[y].map(v=>v[1]))),f1(avg(deb[y].map(v=>v[0])))])); }
