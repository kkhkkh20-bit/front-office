/* ===== 시상 레이스·시상 전 예상·포스트시즌 MVP =====
   - 시즌 중 'MVP 레이스'(6~9월 매달 1일, 9월은 매주 월요일)와 '신인왕 경쟁'(매달 1일) 기사: 상위 3명과 기록.
   - 시상식 전날 'MVP·신인왕 예상'·'골든글러브 예상' 기사: 실제 선정과 같은 기록 점수(MVP·신인왕 awBase, 골든글러브 ggCandidate.s)로 그때 계산한 예상 수상자.
     발표 기사 끝에 예상과 결과를 비교한 한 줄을 붙인다.
   - 포스트시즌 경기마다 경기 MVP(이긴 팀에서 박스스코어 점수가 가장 높은 선수), 와일드카드·준플레이오프·플레이오프 시리즈 MVP(한국시리즈 MVP와 같은 식).
   모든 구단에 같은 식을 쓰고, 기록만 보고 정한다(주 난수 R()·N()을 쓰지 않는다. 기사도 withRng 안에서 내 주 난수 순서를 바꾸지 않는다). */

/* 시즌 중 후보: 지금까지 치른 팀 경기 수로 규정타석·규정이닝을 비례 적용(시상 자격과 같은 기준) */
function awRaceRows(y){ const rows=[]; for(const p of Object.values(G.players)){ if(p.team==null||p.arch)continue; const h=seasonTotal(p,y,'1군'); if(!h)continue; rows.push({p,h,w:warOf(h,p)}); } return rows; }
function awRaceRank(){ const r={}; try{ standingsNow().forEach((x,i)=>{ r[x.tid]=i; }); }catch(e){} return r; }
function awRaceQual(x,y){ const g=tgp(awTeamOf(x.p,x.h,y),y)||0; if(g<=0)return false; const f=g/144;
  return x.p.isP?((x.h.outs||0)>=g*3||(x.h.w||0)>=10*f||(x.h.sv||0)>=30*f||(x.h.hld||0)>=30*f):(x.h.pa||0)>=Math.round(g*3.1); }
function awRaceScore(x,y,rk){ return awBase(x,rk[awTeamOf(x.p,x.h,y)]??9); }
function awRaceRow(x,y,rk){ return {id:x.p.id,name:x.p.name,t:x.p.team,pos:(()=>{ try{ return posLabel(x.p); }catch(e){ return ''; } })(),line:statLine(x.h,x.p),w:+x.w.toFixed(1),b:+awRaceScore(x,y,rk).toFixed(3)}; }
/* 순서: 기록 점수 → WAR → 선수 번호(동점도 늘 같은 순서) */
const awRaceSort=(a,b)=>b.b-a.b||b.w-a.w||a.id-b.id;
function awRaceTop(y,kind,n=3){ const rk=awRaceRank(), R=awRaceRows(y);
  const L=kind==='roy'?R.filter(x=>awRookieOK(x,y)&&((x.h.pa||0)>=30||(x.h.outs||0)>=45)):R.filter(x=>awRaceQual(x,y));
  return L.map(x=>awRaceRow(x,y,rk)).sort(awRaceSort).slice(0,n); }
function awRaceLine(c,i){ return `${i+1}. ${awN(c)}(${tshort(c.t)}${c.pos?' · '+c.pos:''}) ${c.line}`; }
function awRaceNote(y,k,top){ const H=(G.awRace=G.awRace||{}), L=(H[y]=H[y]||[]); L.push({d:G.day,k,ids:top.map(c=>c.id)}); if(L.length>40)L.splice(0,L.length-40); const ys=Object.keys(H).map(Number).sort((a,b)=>a-b); while(ys.length>5)delete H[ys.shift()]; }
function awRaceNews(weekly){ if(period()!=='season'||!G.sea||G.sea.y!==G.year)return; const y=G.year, o=dobj(G.day);
  const top=awRaceTop(y,'mvp'); if(top.length<3)return; const gap=top[0].b-top[1].b;
  const head=weekly?`${o.m}월 ${Math.floor((o.d-1)/7)+1}주 MVP 레이스`:`${o.m}월 MVP 레이스`;
  const lead=gap<.4?`${awN(top[0])}·${awN(top[1])} 접전`:`${awN(top[0])} 선두`;
  const mine=top.filter(c=>c.t===G.user&&!G.unemp);
  withRng(y*7919+G.day*13+1,()=>news('분석',`${head}: ${lead}`,`${top.map(awRaceLine).join('\n')}\n\nWAR에 홈런·타점·승리·세이브 같은 눈에 띄는 기록과 팀 순위(3위 이내)를 더한 기자단 기준 점수로 줄 세웠습니다. 실제 투표는 시즌이 끝난 뒤 기자 125명이 합니다.`,mine.length?1:0,{ref:top[0].id,act:{l:'레이스 보기',a:'awOpen',v:String(y)}}));
  awRaceNote(y,'mvp',top);
  if(weekly)return;
  const R=awRaceTop(y,'roy'); if(R.length<2)return;
  withRng(y*7919+G.day*13+2,()=>news('분석',`${o.m}월 신인왕 경쟁: ${awN(R[0])} 앞서가`,`${R.map(awRaceLine).join('\n')}\n\n신인왕 자격(입단 5년 이내, 이전 시즌까지 1군 30이닝·60타석 이하, 외국인·해외 프로 경력 제외)을 갖춘 선수 가운데 MVP와 같은 기자단 기준 점수 순입니다.`,R.some(c=>c.t===G.user&&!G.unemp)?1:0,{ref:R[0].id,act:{l:'레이스 보기',a:'awOpen',v:String(y)}}));
  awRaceNote(y,'roy',R); }
function awRaceDaily(){ const o=dobj(G.day); if(o.m<6||o.m>9)return; if(o.d===1)awRaceNews(false); else if(o.m===9&&o.w===1)awRaceNews(true); }

/* ---- 시상 전 예상: 실제 선정과 같은 기록 점수로 ---- */
const GG_PK=['P','C','1B','2B','3B','SS','OF','DH'];
const ggPosName=k=>k==='P'?'투수':k==='OF'?'외야수':POSK[k]||k;
function awPredMvp(A){ const top=L=>[...(L||[])].sort((a,b)=>(b.b??b.s)-(a.b??a.s)||b.w-a.w||a.id-b.id)[0]||null; const m=top(A.cand.mvp), r=top(A.cand.roy); return {mvp:m?m.id:null,roy:r?r.id:null}; }
function awPredGG(A){ const o={}; for(const k of GG_PK){ const C=A.cand.gg&&A.cand.gg[k]; if(!C||!C.length)continue; const L=[...C].sort((a,b)=>b.s-a.s||a.id-b.id).slice(0,k==='OF'?3:1).map(c=>c.id); o[k]=k==='OF'?L:L[0]; } return o; }
function awPredict(k,y){ const A=G.awards&&G.awards[y]; if(!A||!A.pend||!A.pend[k]||!A.cand)return null; const P=A.pred=A.pred||{}; if(P[k])return P[k];
  const nm=id=>{ const L=[...(A.cand.mvp||[]),...(A.cand.roy||[]),...Object.values(A.cand.gg||{}).flat()]; const c=L.find(c=>c.id===id); return c?`${awN(c)}(${tshort(c.t)})`:'-'; };
  if(k==='mvp'){ const p=P.mvp={...awPredMvp(A),d:G.day}; if(p.mvp==null&&p.roy==null)return p;
    withRng(y*1009+41,()=>news('분석',`${y} MVP·신인왕 예상: ${p.mvp!=null?nm(p.mvp).replace(/\(.*$/,''):'-'} 유력`,`내일 ${ASSOC.s} 시상식을 앞둔 기록 점수 예상입니다.\nMVP: ${nm(p.mvp)}\n신인왕: ${nm(p.roy)}\n\nWAR와 눈에 띄는 기록, 팀 순위로 본 기자단 기준 점수 1위입니다. 실제 투표에는 기자 표심의 흔들림이 섞여 결과가 다를 수 있습니다.`,0,{act:{l:'후보 보기',a:'awOpen',v:String(y)}}));
    return p; }
  const g=awPredGG(A), p=P.gg={g,d:G.day};
  withRng(y*1009+43,()=>news('분석',`${y} 골든글러브 예상: 포지션별 유력 수상자`,`${GG_PK.filter(x=>g[x]!=null).map(x=>`${ggPosName(x)}: ${(Array.isArray(g[x])?g[x]:[g[x]]).map(nm).join(', ')}`).join('\n')}\n\n투표 기준과 같은 점수(WAR, 주요 기록, 200안타·20승 같은 이정표, 팀 성적)로 계산한 예상입니다. 기자 288명의 실제 득표와 다를 수 있습니다.`,0,{act:{l:'후보 보기',a:'awOpen',v:String(y)}}));
  return p; }
/* 예상 대비 결과: [맞힌 수, 전체 수, 놓친 부문 글] */
function awPredHit(A,k){ const P=A&&A.pred&&A.pred[k]; if(!P)return null;
  if(k==='mvp'){ const L=[['MVP',P.mvp,A.mvp],['신인왕',P.roy,A.roy]].filter(x=>x[1]!=null&&x[2]); return {hit:L.filter(x=>x[1]===x[2].id).length,n:L.length,miss:L.filter(x=>x[1]!==x[2].id).map(x=>x[0])}; }
  let hit=0,n=0; const miss=[]; for(const pk of GG_PK){ const pr=P.g[pk]; if(pr==null)continue; const real=pk==='OF'?[0,1,2].map(i=>A.gg['OF'+i]&&A.gg['OF'+i].id).filter(v=>v!=null):A.gg[pk]?[A.gg[pk].id]:[]; const L=Array.isArray(pr)?pr:[pr]; for(const id of L){ n++; if(real.includes(id))hit++; else if(!miss.includes(ggPosName(pk)))miss.push(ggPosName(pk)); } }
  return {hit,n,miss}; }
function awPredLine(A,k){ const h=awPredHit(A,k); if(!h||!h.n)return ''; return h.hit===h.n?`\n\n시상식 전 기록 점수 예상이 모두 맞았습니다(${h.hit}/${h.n}).`:`\n\n시상식 전 예상 ${h.n}명 중 ${h.hit}명 적중. 예상과 달랐던 부문: ${h.miss.join(', ')}.`; }
/* 시상식 전날(투표 마감 뒤) 예상 기사. 발표 당일에 처음 계산하게 된 경우(저장을 늦게 연 경우)는 건너뛴다 */
function awPredDaily(){ for(const y of Object.keys(G.awards||{}).map(Number)){ const A=G.awards[y]; if(!A||!A.pend)continue; const D=A.days; if(!D)continue; for(const k of ['mvp','gg'])if(A.pend[k]&&!(A.pred&&A.pred[k])&&G.day===D[k]-1)try{ awPredict(k,y); }catch(e){ console.error(e); } } }

/* ---- 포스트시즌 MVP ---- */
/* 박스스코어 한 줄 점수(경기 MVP): 타자 = 안타·장타·타점·득점·출루·도루, 범타는 감점 / 투수 = 이닝·탈삼진, 자책·출루 허용 감점, 승·세이브·홀드 가산 */
function psBoxV(r,isP){ if(isP){ const d=r.d||''; return (r.outs||0)/3*.7-(r.er||0)*1.3-((r.h||0)+(r.bb||0))*.1+(r.so||0)*.2+(d==='승'?1.5:d==='세'?1:d==='홀'?.5:0); }
  return (r.h||0)+(r.d||0)*.5+(r.tr||0)+(r.hr||0)*2+(r.rbi||0)*.8+(r.r||0)*.3+((r.bb||0)+(r.hbp||0))*.3+(r.sb||0)*.3-Math.max(0,(r.ab||0)-(r.h||0))*.15; }
function psBoxLine(r,isP){ return isP?`${ipStr(r.outs||0)}이닝 ${r.er||0}자책 ${r.so||0}탈삼진${r.d?` (${r.d==='세'?'세이브':r.d==='홀'?'홀드':r.d})`:''}`:`${r.ab||0}타수 ${r.h||0}안타${r.hr?` ${r.hr}홈런`:''}${r.rbi?` ${r.rbi}타점`:''}${r.sb?` ${r.sb}도루`:''}`; }
/* box = 경기 기록 형식 {h:{tid,bat,pit},a:{…}}, 이긴 쪽 'h'|'a'|null(무승부면 양 팀) */
function psGameMvpBox(box,win){ const L=[]; for(const k of win?[win]:['h','a']){ const s=box&&box[k]; if(!s)continue; const P=new Set((s.pit||[]).map(r=>r.id));
    for(const r of s.pit||[])L.push({r,isP:true,t:s.tid}); for(const r of s.bat||[])if(!P.has(r.id))L.push({r,isP:false,t:s.tid}); }
  const sc=L.map(x=>({...x,v:psBoxV(x.r,x.isP)})).sort((a,b)=>b.v-a.v||(b.isP?1:0)-(a.isP?1:0)||a.r.id-b.r.id); const b=sc[0]; if(!b)return null;
  return {id:b.r.id,n:b.r.n||(G.players[b.r.id]||{}).name||'',t:b.t,line:psBoxLine(b.r,b.isP),v:+b.v.toFixed(2)}; }
/* 시뮬 결과(g.S)를 경기 기록 형식으로(우리 경기가 아니면 기록을 남기지 않으므로) */
function psBoxOf(g){ const o={}; for(const k of ['h','a']){ const s=g.S[k], P=s.pitchers||[];
    o[k]={tid:s.tid,pit:P.map(id=>{ const x=s.box.get(id)||{}; return {id,n:(G.players[id]||{}).name||'',outs:x.outs,er:x.er,h:x.h,bb:x.bb,so:x.so,d:g.dec.w===id?'승':g.dec.l===id?'패':g.dec.sv===id?'세':(g.dec.hld||[]).includes(id)?'홀':''}; }),
      bat:[...s.box.entries()].filter(([id])=>!P.includes(id)).map(([id,x])=>({id,n:(G.players[id]||{}).name||'',ab:x.ab,h:x.h,d:x.d,tr:x.tr,hr:x.hr,rbi:x.rbi,r:x.r,bb:x.bb,hbp:x.hbp,sb:x.sb}))}; }
  return o; }
function psMvpY(y){ const M=G.psMvp=G.psMvp||{}; const o=M[y]=M[y]||{g:[],s:{}}; const ys=Object.keys(M).map(Number).sort((a,b)=>a-b); while(ys.length>25)delete M[ys.shift()]; return o; }
/* psDay에서: 경기 MVP를 정해 저장(우리 경기 기록에도 붙인다)하고 리그 소식에 한 줄 */
function psMvpGame(rd,n,g,day,rec){ if(!g||rd==='tb'||!ROUNDK[rd])return null; const box=rec&&rec.box?rec.box:psBoxOf(g); const win=g.score.h>g.score.a?'h':g.score.a>g.score.h?'a':null; const m=psGameMvpBox(box,win); if(!m)return null;
  const y=G.year, Y=psMvpY(y); if(!Y.g.some(r=>r[0]===rd&&r[1]===n))Y.g.push([rd,n,m.id,m.t,m.n,m.line,day]); if(rec)rec.mvp={id:m.id,n:m.n,t:m.t,line:m.line};
  try{ wire('포스트시즌',`${ROUNDK[rd]} ${n}차전 MVP ${m.n}(${tshort(m.t)}) · ${m.line}`,{tid:m.t,ref:m.id}); }catch(e){} return m; }
/* 시리즈 MVP: 이긴 구단 선수의 그 라운드 합계(G.psSer)로. 한국시리즈 MVP(champSeriesMvp)와 같은 식 */
function psSeriesMvp(y,rd,tid){ const K=G.psSer&&G.psSer[y]&&G.psSer[y][rd]; if(!K)return null;
  const L=Object.entries(K).filter(([,o])=>o.t===tid).map(([id,o])=>{ const v=o.isP?(o.outs||0)/3*.7-(o.er||0)*1.3+(o.so||0)*.2+(o.w||0)*1.5+(o.sv||0):(o.h||0)+(o.d||0)*.5+(o.hr||0)*2+(o.rbi||0)*.8+(o.bb||0)*.3; return {id:+id,o,v}; }).sort((a,b)=>b.v-a.v); const b=L[0]; if(!b)return null;
  const o=b.o; const line=o.isP?`${o.w||0}승${o.sv?` ${o.sv}세이브`:''} · ${ipStr(o.outs||0)}이닝 ${o.er||0}자책 · 탈삼진 ${o.so||0}`:`${o.ab||0}타수 ${o.h||0}안타 ${o.hr||0}홈런 ${o.rbi||0}타점`; return {id:b.id,n:o.n,line,games:Math.max(...L.map(x=>x.o.g))}; }
function psMvpSeries(rd,tid,m){ if(!ROUNDK[rd]||rd==='tb')return null; const y=G.year; m=m||psSeriesMvp(y,rd,tid); if(!m)return null; const Y=psMvpY(y); if(Y.s[rd])return Y.s[rd];
  Y.s[rd]={id:m.id,n:m.n,t:tid,line:m.line};
  if(rd!=='ks'){ const mine=tid===G.user&&!G.unemp; withRng(y*1009+({wc:51,spo:53,po:57})[rd],()=>news('선수',`${ROUNDK[rd]} 시리즈 MVP ${m.n}`,`${tname(tid)}의 ${m.n}이(가) ${m.line}(으)로 ${ROUNDK[rd]} 시리즈 MVP에 뽑혔습니다.`,mine?1:0,{ref:m.id,tid})); }
  return Y.s[rd]; }
/* 화면: 한 해 포스트시즌 MVP 정리(시리즈 순) */
function psMvpOf(y){ const Y=G.psMvp&&G.psMvp[y]; if(!Y)return null; return {g:Y.g.map(r=>({rd:r[0],n:r[1],id:r[2],t:r[3],name:r[4],line:r[5],d:r[6]})),s:Y.s}; }
