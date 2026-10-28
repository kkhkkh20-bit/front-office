/* ===== 게임 시작 전 경력: 2023·2024 시즌 기록 =====
   2025 시즌은 실제 경기로 치르고, 그 앞 두 해는 같은 확률식으로 타석·이닝을 하나하나 시뮬해 만든다.
   해마다 컨디션(커리어 하이·부진)과 타구 운이 다르게 걸리므로, 한 해 기록만 보면 거품이나 저평가가 섞이고
   여러 해를 보면 실력이 드러난다. 나이에 따라 그때의 능력은 지금과 다르다(젊으면 낮고, 노장은 높았다) */
function pastShift(p,ago){ const a=p.age; return a<=23?-3*ago:a<=26?-1.8*ago:a<=29?-.6*ago:a>=34?1.6*ago:a>=31?.7*ago:0; }
function genPastSeasons(){ const Y=2025; G.lg=G.lg||{}; for(const y of [Y-2,Y-1])if(!G.lg[y]&&G.lg[Y])G.lg[y]=Object.assign({},G.lg[Y]);
  const sf0={};
  for(const p of Object.values(G.players)){ if(p.foreign||p.prospect||p.team==null)continue; const svc=p.svc||0; const base=p.hist.filter(h=>h.y===Y);
    const h1=base.find(h=>h.lvl==='1군'), h2=base.find(h=>h.lvl==='퓨처스'); const ref=p.isP?((h1&&h1.outs>=30)?h1:h2||h1):((h1&&h1.pa>=30)?h1:h2||h1); if(!ref)continue;
    sf0[p.id]=p.sf; const r0=Object.assign({},p.r);
    for(const ago of [1,2]){ if(svc<ago||p.age-ago<19)continue; const y=Y-ago;
      const sh=pastShift(p,ago); for(const k in p.r)p.r[k]=clamp(r0[k]+sh,20,80);
      /* 그해 컨디션과 타구 운 */ const x=R(); const v=x<.09?N(-4.2,1.1):x<.15?N(3.4,1):N(0,p.age-ago>=33?2.4:2); p.sf={y:G.year,v:clamp(v,-6.5,6),m:0,lk:clamp(N(0,.012),-.03,.03)};
      const lvl=ref.lvl==='1군'&&(sh>-4||ovr(p)>=58)?'1군':'퓨처스'; const scale=clamp(1+sh*.06,.35,1.15)*rnd(.75,1.1);
      if(p.isP){ const outs=Math.max(9,Math.round((ref.outs||0)*scale)); const o=simPit(p,outs,p.sf.v); const g=Math.max(1,Math.round((ref.g||1)*outs/Math.max(1,ref.outs||1))); const gs=Math.min(g,Math.round((ref.gs||0)*outs/Math.max(1,ref.outs||1)));
        const wr=(ref.w||0)/Math.max(1,ref.outs||1)*outs; const h=Object.assign({y,t:p.team,lvl,pre:1},ZP,o,{g,gs,w:Math.round(wr*rnd(.6,1.4)),l:Math.round((ref.l||0)/Math.max(1,ref.outs||1)*outs*rnd(.6,1.4)),sv:Math.round((ref.sv||0)*scale),hld:Math.round((ref.hld||0)*scale)}); p.hist.push(h); }
      else { const pa=Math.max(10,Math.round((ref.pa||0)*scale)); const o=simBat(p,pa,p.sf.v); const h=Object.assign({y,t:p.team,lvl,pre:1},ZB,o,{g:Math.max(1,Math.round(pa/4.1)),pos:ref.pos||p.pos}); p.hist.push(h); } }
    p.r=r0; p.sf=sf0[p.id]; }
  p0sort(); }
function p0sort(){ for(const p of Object.values(G.players))if(p.hist&&p.hist.length>1)p.hist.sort((a,b)=>a.y-b.y); }
/* 최근 몇 해 기록 요약(드래프트 표·선수 카드용): 해마다 한 줄, 그리고 합계 */
function recentLines(p,y,n){ const out=[]; for(let i=n-1;i>=0;i--){ const yy=y-i; const h1=seasonTotal(p,yy,'1군'), h2=seasonTotal(p,yy,'퓨처스'); const h=p.isP?((h1&&h1.outs>=15)?h1:h2||h1):((h1&&h1.pa>=30)?h1:h2||h1); if(h)out.push({y:yy,lvl:h===h1?1:2,h}); } return out; }
