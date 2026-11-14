/* ===== 다른 구단 단장도 선수단을 돌본다(사용자 11-14: "무슨 기능이 추가되든 AI도 공평하게 잘 쓰고 이득 봐야 함") =====
 - 면담: 매주 시즌·캠프 중에 한 구단 최대 AI_TALK_N번. 우리와 같은 talk() 결과 규칙(확률·효과·주간 횟수·면담 감쇠·기분 상한·출전 약속 판정과 불이행 벌점)을 그대로 쓴다.
   AI 단장이 아는 것은 사람 단장이 화면에서 보는 것과 같다: 올해 성적(폼), 기분, 주전 여부, 감독·코치진이 본 성향(우리 구단 mentalRead와 같은 크기 오차).
   칭찬: 폼이 좋은 선수, 기분이 처진 선수(예민한 선수가 부진할 때는 하지 않는다). 분발 촉구: 부진하고 프로의식이 강해 보이는 선수만.
   출전 기회 건의: 주전 바로 아래(감독 가산으로 실제로 뛸 수 있는) 선수만. 지킬 수 없는 약속은 하지 않는다.
 - 팀 분위기: 분위기가 어수선하거나 험악하면 분위기를 흐리는 비주축 선수를 트레이드 매물로 내놓는다(우리 단장이 명단에 올리는 것과 같은 표시).
   리더를 아끼는 것은 트레이드 값(chemTradeMul, 30_chemistry)에 이미 있다. 주장은 모든 구단 선수단 투표로 뽑는다(electCaptain). */
const AI_TALK_N=6;
/* 감독·코치진이 아는 정도: 우리 구단 mgrKnow와 같은 식(함께한 날·올해 출전) */
function aiKnow(m,p){ if(!m||!p||p.team==null)return 0; const days=m.hD==null?999:G.day-m.hD; const h=seasonTotal(p,G.year,'1군'), h0=seasonTotal(p,G.year-1,'1군');
  const g=(h?(p.isP?h.outs/90:h.pa/150):0)+(m.hD==null&&h0?(p.isP?h0.outs/120:h0.pa/200):0); return clamp(.15+clamp(days/120,0,1)*.45+g*.4,0,1); }
function aiPersEst(tid,p,k){ initPers(p); const m=G.mgr[tid]; const kn=m?aiKnow(m,p):0; const sd=(1.6+(1-kn)*4.5)*(m?1-((m.eye||50)-50)/160:1.3); return p.pers[k]+hn('mr'+k+'ai'+halfK(),p.id)*sd; }
function aiTalkForm(p){ const pf=perfOf(curLine(p),p.isP); return pf==null?null:pf>=ovr(p)+1.5?true:pf<=ovr(p)-3?false:null; }
/* 출전 약속을 지킬 수 있나: 같은 자리 가장 약한 주전과 실력 차이가 감독 가산(promB)보다 작고, 1군에 있거나 올라갈 수 있다 */
function aiPromOk(tid,p,d){ if(!healthy(p)||isAway(p)||p.hold||p.susp>G.day)return false; const m=G.mgr[tid]; if(!m)return false; const add=!m.interim&&m.disc>=62?4:7;
  let L=[]; if(p.isP)L=p.role==='SP'?d.sp.slice(0,5):d.pen.slice(0,4); else L=[d.ln&&d.ln[p.pos]].filter(Boolean); if(!L.length)return false;
  const w=Math.min(...L.map(q=>ovr(q))); return ovr(p)+add-2>=w; }
function aiTalkPlan(tid){ const d=depth(tid); const reg=new Set([...d.start,...d.sp,...d.pen.slice(0,4)].map(p=>p.id)); const out=[];
  for(const p of playersOf(tid)){ if(p.ys||p.joinY>G.year||p.mor==null)continue; initPers(p); const mor=p.mor, imp=reg.has(p.id)?1.4:ovr(p)>=50?1:.6; const n=(p.tkH||[]).filter(x=>G.day-x<28).length, f=[1,.6,.35,.2][Math.min(n,3)];
    if(!talkUsed(p,'praise')&&mor<TALK_MOR_CAP-1){ const g=aiTalkForm(p);
      if(g===true)out.push({p,k:'praise',v:8*f*imp});
      else if(g===false){ if(aiPersEst(tid,p,'pro')>=13)out.push({p,k:'push',v:5*imp}); else if(mor<55&&aiPersEst(tid,p,'temp')<=12)out.push({p,k:'praise',v:2*f*imp}); }
      else if(mor<52)out.push({p,k:'praise',v:3*f*imp}); }
    if(!talkUsed(p,'promise')&&!p.promise&&!reg.has(p.id)&&period()==='season'&&mor<58&&p.age>=21&&ovr(p)>=45&&aiPromOk(tid,p,d))out.push({p,k:'promise',v:(8+5)*imp}); }
  return out.sort((a,b)=>b.v-a.v).filter(x=>x.v>=1); }
function aiTalkWeek(){ const per=period(); if(per==='off'||!G.teams)return 0; let n=0; const Lg=G.aiTalkLog=G.aiTalkLog&&G.aiTalkLog.y===G.year?G.aiTalkLog:{y:G.year,n:{},d:{}};
  for(const t of G.teams){ if(t.id===ME()||!G.mgr[t.id])continue; const P=aiTalkPlan(t.id), seen=new Set(); let k=0;
    for(const x of P){ if(k>=AI_TALK_N)break; const key=x.p.id+x.k; if(seen.has(key))continue; seen.add(key); const m0=x.p.mor; const r=talk(x.p.id,x.k,{ai:true}); if(!r||r.d==null)continue; k++; n++;
      const L=Lg.n[t.id]=Lg.n[t.id]||{}; L[x.k]=(L[x.k]||0)+1; Lg.d[t.id]=(Lg.d[t.id]||0)+(x.p.mor-m0); } }
  return n; }
/* 팀 분위기가 나쁠 때: 분위기를 흐리는 선수 가운데 주축이 아닌 선수를 매물로(국내 선수·거부권 없음·최근 이적 아님) */
function aiChemWeek(){ if(!G.teams||!G.chem)return 0; let n=0; for(const t of G.teams){ if(t.id===ME())continue; const c=G.chem[t.id]; if(!c||chemBand(c.v)<3)continue;
    const top=new Set(domestic(t.id).filter(p=>!p.ys).sort((a,b)=>ovr(b)-ovr(a)).slice(0,5).map(p=>p.id));
    for(const id of (c.f&&c.f.trbP)||[]){ const p=G.players[id]; if(!p||p.team!==t.id||p.foreign||p.aiListed||top.has(p.id)||hasNtc(p)||mvRecent(p,60)||!chemTrouble(p))continue; p.aiListed=true; p.aiWhy='chem'; p.aiLd=G.day; p.aiUrg=!isRegular(p); n++; } }
  return n; }
