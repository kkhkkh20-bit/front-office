/* ===== 창단 드래프트 지명 평가 =====
   지명하는 순간에는 정답(실제 능력)을 알려 주지 않는다. 지명 직후에는 우리 스카우트 추정(범위)과 예상 역할만 있고,
   캠프와 우리 유니폼을 입고 쌓은 실전 표본(타석·이닝)이 늘수록 코치진 평가 범위가 좁혀진다.
   '좋은 지명이었나'는 7월 1일 중간 평가와 정규시즌 종료 뒤 평가에서, 같은 순번대 지명자들의 실제 WAR과 비교해 말한다 */
const FDE_PA=150, FDE_OUTS=120; /* 150타석 · 40이닝이면 코치진 평가가 확정된다 */
/* 우리 구단의 창단 드래프트 지명 기록 */
function fdPickOf(pid){ const F=G.fd; if(!F||!F.picks)return null; return F.picks.find(x=>x.pid===pid&&x.tid===G.user)||null; }
/* 우리 스카우트 추정의 평균 오차(원래 능력 단위). 후보 전원에 대해 한 번 계산해 둔다 */
function fdEsd(){ const F=G.fd; if(!F)return 6; if(F.esd)return F.esd; let s=0,n=0;
  for(const id of (F.all||F.pool||[])){ const p=G.players[id]; if(!p)continue; try{ const v=fdSeenBy(G.user,p).sc-ovr(p); s+=v*v; n++; }catch(e){} }
  F.esd=n>=10?Math.round(clamp(Math.sqrt(s/n),3,12)*10)/10:6; return F.esd; }
/* 지명 순간의 우리 스카우트 추정. 저장된 값이 없으면(예전 저장) 지금 계산한다 */
function fdE0(p,pk){ if(pk&&pk.e0!=null)return pk.e0; try{ return fdSeenBy(G.user,p).sc; }catch(e){ return ovr(p); } }
/* 우리 유니폼을 입고 쌓은 표본(창단 첫해) */
function fdSample(p){ const F=G.fd; let pa=0,outs=0,pa1=0,outs1=0; for(const h of p.hist||[]){ if(h.y!==F.y||h.y2||h.t!==G.user)continue; const w=h.lvl==='1군'?1:.6; pa+=(h.pa||0)*w; outs+=(h.outs||0)*w; if(h.lvl==='1군'){ pa1+=h.pa||0; outs1+=h.outs||0; } } return {pa,outs,pa1,outs1}; }
/* 코치진이 얼마나 알게 됐나: 0(지명 직후) ~ 1(확정) */
function fdKnow(p){ const F=G.fd; if(!F||!F.done)return {k:0,camp:false,exact:false,s:{pa:0,outs:0,pa1:0,outs1:0}};
  if(G.year>F.y)return {k:1,camp:true,exact:true,s:fdSample(p)};
  const camp=!!(G.cal&&G.day>=G.cal.campEnd); const s=fdSample(p); const f=Math.min(1,p.isP?s.outs/FDE_OUTS:s.pa/FDE_PA);
  const mid=G.day>=KD(7,1); const exact=(camp&&f>=1)||mid; return {k:exact?1:clamp((camp?.3:0)+.7*f,0,1),camp,exact,s,f}; }
/* 우리 창단 지명 선수의 능력: 확정 전에는 범위(원래 능력 단위). 우리 지명 선수가 아니면 null */
function fdRange(p){ const pk=p&&fdPickOf(p.id); if(!pk)return null; const o=ovr(p); const K=fdKnow(p);
  if(K.exact||p.team===G.user)return {exact:true,lo:o,hi:o,mid:o,k:1,K,stage:'확정'};
  const e0=fdE0(p,pk); const mid=e0+(o-e0)*K.k; const w=Math.max(1.2,fdEsd()*1.15*(1-K.k)+.8);
  const smp=p.isP?(K.s.outs>=3?`실전 ${ipStr(Math.round(K.s.outs))}이닝`:''):(K.s.pa>=1?`실전 ${Math.round(K.s.pa)}타석`:'');
  const stage=!G.fd.done?'지명 직후 · 스카우트 추정':[K.camp?'캠프 관찰':'',smp].filter(Boolean).join(' · ')||'지명 직후 · 스카우트 추정';
  return {exact:false,lo:mid-w,hi:mid+w,mid,k:K.k,K,stage}; }
/* 화면용 범위 글: "62~74" (표시 능력 단위) */
function fdRangeTxt(r){ if(!r)return '-'; const a=dv(r.lo), b=dv(r.hi); return r.exact||a===b?`${dv(r.mid)}`:`${a}~${b}`; }
/* 예상 역할: 우리 스카우트 추정 능력으로 말한다(정답 아님) */
function fdRole(p,v){
  if(p.isP){ if(isSPr(p))return v>=57?'선발 로테이션 후보':v>=51?'5선발 경쟁 · 롱릴리프':v>=45?'불펜':'2군 투수 자원'; return v>=56?'필승조 불펜 후보':v>=48?'불펜':'2군 투수 자원'; }
  const pos={C:'포수',DH:'지명타자'}[p.pos]||(POSS[p.pos]?POSS[p.pos]+'수':posLabel(p)); const grp=p.pos==='C'?'포수':['LF','CF','RF'].includes(p.pos)?'외야수':p.pos==='DH'?'타자':'내야수';
  return v>=57?`주전 ${pos}`:v>=51?`주전 ${pos} 후보`:v>=45?`백업 ${grp}`:'2군 육성 자원'; }

/* ---------- 지명 평가: 같은 순번대(앞뒤 8명) 지명자들의 실제 WAR과 비교 ---------- */
function fdOverall(x){ return (x.rd-1)*10+x.no; }
function fdWarY(p,y,tid){ return (p.hist||[]).filter(h=>h.y===y&&!h.y2&&h.lvl==='1군'&&(tid==null||h.t===tid)).reduce((a,h)=>a+warOf(h,p),0); }
function fdEvalRows(stage){ const F=G.fd; const y=F.y;
  const all=F.picks.filter(x=>x.pid&&G.players[x.pid]).map(x=>{ const p=G.players[x.pid]; return {x,p,n:fdOverall(x),w:fdWarY(p,y)}; });
  const mine=all.filter(z=>z.x.tid===G.user);
  return mine.map(z=>{ const peers=all.filter(q=>q!==z&&Math.abs(q.n-z.n)<=8); const ws=peers.map(q=>q.w).sort((a,b)=>a-b);
    const lt=peers.filter(q=>q.w<z.w-.05).length, eq=peers.filter(q=>Math.abs(q.w-z.w)<=.05).length; const pct=peers.length?(lt+eq*.5)/peers.length:.5;
    const med=ws.length?ws[ws.length>>1]:0; const s=fdSample(z.p); const few=z.p.isP?s.outs1<30:s.pa1<40; const ours=fdWarY(z.p,y,G.user);
    const m=stage==='mid';
    let k, t;
    if(pct>=.75&&z.w>=(m?.3:.6)){ k='good'; t=m?'지금까지는 좋은 지명입니다':'좋은 지명이었습니다'; }
    else if(pct<=.25&&!(few&&z.n>=60)){ k='bad'; t=m?'지금까지는 기대 이하입니다':'기대 이하였습니다'; }
    else if(few&&z.n<60){ k='bad'; t=m?'1군 출전이 적어 아직 기대 이하입니다':'1군에서 자리를 잡지 못했습니다'; }
    else { k='ok'; t=m?'지명 순번만큼 하고 있습니다':'지명 순번만큼 했습니다'; }
    const g0=GRD(fdE0(z.p,z.x)); const gNow=GRD(ovr(z.p)); /* 종합 능력 등급(게임 공통) */
    return {pid:z.p.id,nm:z.p.name,pos:posLabel(z.p),rd:z.x.rd,no:z.x.no,n:z.n,auto:!!z.x.auto,w:Math.round(z.w*10)/10,ours:Math.round(ours*10)/10,med:Math.round(med*10)/10,pct:Math.round(pct*100),k,t,g0,gNow,role:z.x.role||fdRole(z.p,fdE0(z.p,z.x)),pa:Math.round(s.pa1),outs:Math.round(s.outs1),gone:z.p.team!==G.user}; }); }
/* 다른 구단 포함 이 시점 최고 성과(5라운드 이후 스틸) */
function fdEvalSteal(){ const F=G.fd; const L=F.picks.filter(x=>x.pid&&x.rd>=5&&G.players[x.pid]).map(x=>({x,p:G.players[x.pid],w:fdWarY(G.players[x.pid],F.y)})).sort((a,b)=>b.w-a.w); return L[0]&&L[0].w>=1?L[0]:null; }
function fdEvalRun(stage){ const F=G.fd; if(!F||!F.done||!F.picks||G.unemp)return; G.fdEval=G.fdEval||{}; if(G.fdEval[stage])return;
  const rows=fdEvalRows(stage).sort((a,b)=>a.n-b.n); if(!rows.length)return; const st=fdEvalSteal();
  const tot=rows.reduce((a,r)=>a+r.ours,0); const byT={}; for(const x of F.picks){ const p=x.pid&&G.players[x.pid]; if(!p)continue; byT[x.tid]=(byT[x.tid]||0)+fdWarY(p,F.y,x.tid); }
  const rk=Object.entries(byT).sort((a,b)=>b[1]-a[1]).findIndex(e=>+e[0]===G.user)+1;
  G.fdEval[stage]={d:G.day,y:F.y,rows,tot:Math.round(tot*10)/10,rk,steal:st?{pid:st.p.id,nm:st.p.name,tid:st.x.tid,rd:st.x.rd,no:st.x.no,w:Math.round(st.w*10)/10}:null};
  const good=rows.filter(r=>r.k==='good'), bad=rows.filter(r=>r.k==='bad'&&r.n<=60);
  const line=r=>`${r.rd}라운드 ${r.nm}(${r.pos}) WAR ${r.w.toFixed(1)} · 같은 순번대 중앙값 ${r.med.toFixed(1)} → ${r.t}${r.gone?' (지금은 다른 구단)':''}`;
  const m=stage==='mid';
  const body=`${m?'시즌 절반이 지났습니다. 창단 드래프트 지명 선수들의 중간 평가입니다. 표본이 반 시즌이라 시즌이 끝나면 바뀔 수 있습니다.':'정규시즌이 끝났습니다. 창단 드래프트 지명 선수들의 첫해 평가입니다.'} 같은 순번대(앞뒤 8순번) 지명자들이 올해 1군에서 낸 WAR과 비교했습니다.\n\n`
    +`우리 지명 선수가 우리 팀에서 낸 WAR 합계 ${tot.toFixed(1)} · 10개 구단 중 ${rk||'-'}위\n\n`
    +(good.length?`[기대 이상]\n${good.map(line).join('\n')}\n\n`:'')+(bad.length?`[기대 이하]\n${bad.slice(0,5).map(line).join('\n')}\n\n`:'')
    +(st?`다른 구단 포함 최고의 스틸: ${st.p.name}(${tshort(st.x.tid)} ${st.x.rd}라운드) WAR ${st.w.toFixed(1)}\n\n`:'')
    +`선수별 평가는 영입·계약 → 신인 드래프트 → 창단 지명 평가에 있습니다.${m?'':' 3시즌 뒤 다시 돌아봅니다.'}`;
  mail('스카우트팀장',m?'창단 드래프트 중간 평가':'창단 드래프트 첫해 평가',body,{kind:'업무',imp:!m,acts:[{l:'창단 지명 평가',a:'fdEvalGo'}]}); }
function fdEvalDaily(){ const F=G.fd; if(!F||!F.done||G.year!==F.y||G.unemp)return; if(G.day===KD(7,1))fdEvalRun('mid'); else if(G.cal&&G.day===G.cal.end+1)fdEvalRun('end'); }
