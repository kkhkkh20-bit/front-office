/* 능력치 반영 점검: 한 구단 선수 전원의 능력치 하나를 +10(원래 능력 단위) 올리고 같은 난수로 경기를 돌려,
   그 능력치가 맡은 기록이 실제로 움직이는지 본다(컨택→타율·삼진, 파워→홈런·장타, 선구→볼넷, 주력→도루,
   수비→상대 BABIP, 구위→탈삼진·실점, 제구→볼넷 허용, 체력→선발 이닝). 사용: node tools/check-sens.js  (N=경기 수, 기본 1200) */
const fs=require('fs'), path=require('path'); const N=+process.env.N||1200; /* 체력·제구처럼 효과가 작은 항목은 경기 수가 적으면 흔들린다 */
let seed=7; const rnd=()=>{ let a=seed|0; a=a+0x6D2B79F5|0; seed=a; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; Math.random=rnd;
const out=new Function('NG','setSeed',fs.readFileSync(path.join(__dirname,'..','dist','engine.js'),'utf8')+`
DEMO.on=false; newGame(6); fdStart(); fdAdvance(false); let g0=0; while(G.fd&&!G.fd.done&&g0++<500)fdAdvance(true); G.tut={done:true,step:99}; hireMgr(G.mmarket[0].id,3); G.medSet=true;
const day=G.cal.open+20; const T=G.teams.find(t=>t.id!==G.user).id; const opp=G.teams.filter(t=>t.id!==T).map(t=>t.id);
const run=(k,dv)=>{ const ps=Object.values(G.players).filter(p=>p.team===T); const keep=ps.map(p=>p.r[k]); if(dv)ps.forEach(p=>{ p.r[k]=Math.min(90,p.r[k]+dv); }); setSeed(globalThis.__SEED||12345);
  const B={pa:0,ab:0,h:0,d:0,tr:0,hr:0,bb:0,so:0,sb:0,cs:0,r:0}, P={outs:0,h:0,hr:0,bb:0,so:0,er:0,bf:0,spOuts:0,gs:0,pc:0}, O={ab:0,h:0,hr:0,so:0,sf:0,xb:0}; let W=0;
  for(let i=0;i<NG;i++){ const o=opp[i%opp.length]; const home=i%2===0; for(const p of Object.values(G.players))p.fat=0; const g=simGame(day+(i%3),home?T:o,home?o:T,false); const me=home?'h':'a', op=home?'a':'h';
    const S=g.S[me], Q=g.S[op]; for(const [id,x] of S.box){ if(S.pitchers.includes(id))continue; B.ab+=x.ab||0; B.h+=x.h||0; B.d+=x.d||0; B.tr+=x.tr||0; B.hr+=x.hr||0; B.bb+=x.bb||0; B.so+=x.so||0; B.sb+=x.sb||0; B.cs+=x.cs||0; B.r+=x.r||0; B.pa+=(x.ab||0)+(x.bb||0)+(x.hbp||0)+(x.sf||0); }
    S.pitchers.forEach((id,j)=>{ const x=S.box.get(id); P.outs+=x.outs||0; P.h+=x.h||0; P.hr+=x.hr||0; P.bb+=x.bb||0; P.so+=x.so||0; P.er+=x.er||0; P.pc+=x.pc||0; P.bf+=x.bf||0; if(j===0){ P.spOuts+=x.outs||0; P.gs++; } });
    for(const [id,x] of Q.box){ if(Q.pitchers.includes(id))continue; O.ab+=x.ab||0; O.h+=x.h||0; O.hr+=x.hr||0; O.so+=x.so||0; O.sf+=x.sf||0; O.xb+=(x.d||0)+(x.tr||0); }
    if(g.score[me]>g.score[op])W++; }
  ps.forEach((p,i)=>p.r[k]=keep[i]);
  const avg=B.h/B.ab, obp=(B.h+B.bb)/B.pa, slg=(B.h+B.d+2*B.tr+3*B.hr)/B.ab, ip=P.outs/3;
  return {AVG:avg,OBP:obp,SLG:slg,'HR%':B.hr/B.pa*100,'BB%':B.bb/B.pa*100,'K%':B.so/B.pa*100,'SB/G':B.sb/NG,'3B/G':B.tr/NG,'R/G':B.r/NG,
    '실점ERA':P.er*9/ip,'탈삼진K9':P.so*9/ip,'볼넷BB9':P.bb*9/ip,'피홈런HR9':P.hr*9/ip,'선발이닝':P.spOuts/3/P.gs,'상대BABIP':(O.h-O.hr)/(O.ab-O.so-O.hr+O.sf),'피장타XBH9':O.xb*9/ip,'P/PA':P.pc/P.bf,'승률':W/NG}; };
const base=run('con',0); const res={base}; res.noise=(()=>{ const r0=run; return null; })();
for(const k of ['con','pow','eye','spd','def','stf','ctl','sta'])res[k]=run(k,10); 
return res;`)(N,s=>{seed=s;});
const keys=Object.keys(out.base); const f=(k,v)=>['AVG','OBP','SLG','상대BABIP'].includes(k)?v.toFixed(3):k==='승률'?v.toFixed(3):v.toFixed(2);
console.log('기준 '+keys.map(k=>k+' '+f(k,out.base[k])).join(' · '));
const L={con:'컨택',pow:'파워',eye:'선구',spd:'주력',def:'수비',stf:'구위',ctl:'제구',sta:'체력'};
for(const t of Object.keys(L)){ const r=out[t]; console.log(L[t]+' +10: '+keys.map(k=>{ const d=r[k]-out.base[k]; return Math.abs(d)<1e-9?null:k+' '+(d>0?'+':'')+(['AVG','OBP','SLG','상대BABIP','승률'].includes(k)?d.toFixed(3):d.toFixed(2)); }).filter(Boolean).join(' · ')); }

const D=(t,k)=>out[t][k]-out.base[k]; const bad=[];
const need=[['con','AVG',.015,'타율'],['con','K%',-2,'삼진%'],['pow','HR%',.7,'홈런%'],['pow','SLG',.025,'장타율'],['eye','BB%',1.5,'볼넷%'],['spd','SB/G',.25,'도루'],
  ['def','상대BABIP',-.008,'상대 BABIP'],['stf','탈삼진K9',1,'탈삼진/9'],['stf','실점ERA',-.5,'평균자책'],['ctl','볼넷BB9',-.7,'볼넷/9'],['sta','선발이닝',.15,'선발 이닝'],
  /* 투수 역할 분담: 구위=삼진·강한 타구(홈런·2루타·3루타) 억제, 제구=볼넷·맞춰 잡기(BABIP·홈런)·투구 수 절약, 체력=후반 유지·이닝 */
  ['stf','피장타XBH9',-.15,'2루타·3루타 허용/9'],['stf','피홈런HR9',-.15,'피홈런/9'],['ctl','상대BABIP',-.008,'맞춰 잡기(상대 BABIP)'],['ctl','피홈런HR9',-.15,'피홈런/9'],['ctl','P/PA',-.08,'타석당 투구 수'],['ctl','실점ERA',-.6,'평균자책'],['sta','선발이닝',.3,'선발 이닝']];
for(const [t,k,th,lab] of need){ const d=D(t,k); if(th>0?d<th:d>th)bad.push(`${L[t]} +10인데 ${lab} 변화 ${d.toFixed(3)}(기대 ${th>0?'+':''}${th} 이상)`); }
for(const t of ['con','pow','eye','spd','stf','ctl'])if(D(t,'승률')<.02)bad.push(`${L[t]} +10인데 승률 변화 ${D(t,'승률').toFixed(3)}`);
console.log(bad.length?'능력치 반영 점검: 문제 '+bad.length+'건\n  '+bad.join('\n  '):'능력치 반영 점검: 문제 없음 ('+N+'경기씩)'); process.exit(bad.length?1:0);
