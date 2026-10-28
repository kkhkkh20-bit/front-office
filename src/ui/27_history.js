/* ---------- 역사·시상 ---------- */
function histView(){
  const ys=Object.keys(G.awards||{}).map(Number).sort((a,b)=>b-a); const y=UI.hy&&G.awards&&G.awards[UI.hy]?UI.hy:ys[0];
  const A=y?G.awards[y]:null;
  const who=x=>x?`<button class="lnk" ${G.players[x.id]?`data-a="player" data-v="${x.id}"`:''}>${esc(x.name)}</button> <span class="small muted">${tshort(x.t)} · ${esc(x.line)}</span>`:'-';
  const ggName=k=>k.startsWith('OF')?'외야수':k==='P'?'투수':POSK[k];
  const aw=A?`<div class="chips">${ys.map(v=>`<button data-a="hy" data-v="${v}" class="${v===y?'on':''}">${v}</button>`).join('')}</div>
    <div class="awd"><div><span class="pill warn">MVP</span> ${awShown(A,'mvp')?who(A.mvp):`<span class="muted">${dmd(KD(11,24))} 시상식에서 발표</span>`}</div><div><span class="pill acc">신인왕</span> ${awShown(A,'mvp')?who(A.roy):'<span class="muted">발표 전</span>'}</div>${A.cand&&awShown(A,'mvp')?`<button class="btn small" data-a="cerOpen" data-v="${y}:mvp">시상식 다시 보기</button>`:''}</div>
    <div class="eyebrow">골든글러브</div>${awShown(A,'gg')?`<div class="list">${['P','C','1B','2B','3B','SS','OF0','OF1','OF2','DH'].filter(k=>A.gg[k]).map(k=>`<div class="item" style="cursor:default"><span class="nm">${ggName(k)}</span><span class="sub">${who(A.gg[k])}</span></div>`).join('')}</div>${A.cand?`<button class="btn small" data-a="cerOpen" data-v="${y}:gg">골든글러브 시상식 다시 보기</button>`:''}`:`<p class="small muted">${dmd(KD(12,9))} 골든글러브 시상식에서 발표합니다.</p>`}`
    :'<p class="small muted">첫 시즌이 끝나면 시상 결과가 쌓입니다.</p>';
  const actives=Object.values(G.players).filter(p=>p.team!=null&&p.hist.some(h=>h.lvl==='1군')).map(p=>{ const c=careerOf(p); return {name:p.name,id:p.id,t:p.team,isP:p.isP,war:c.war,h:c.h,hr:c.hr,w:c.w,sv:c.sv,act:true}; });
  const all=actives.concat((G.legends||[]).map(r=>({name:r.name,isP:r.isP,war:r.war,h:r.h,hr:r.hr,w:r.w,sv:r.sv,act:false,y:r.y})));
  const board=(label,f,fmt,flt)=>`<div class="ldr"><div class="eyebrow">${label}</div>${all.filter(flt||(()=>true)).sort((a,b)=>f(b)-f(a)).slice(0,8).map((x,i)=>`<div class="ldr-r"><i>${i+1}</i><span>${x.act&&G.players[x.id]?`<button class="lnk" data-a="player" data-v="${x.id}">${esc(x.name)}</button>`:esc(x.name)} <span class="small muted">${x.act?tshort(x.t):`${x.y} 은퇴`}</span></span><b class="num">${fmt(f(x))}</b></div>`).join('')}</div>`;
  const hof=(G.hof||[]);
  const champs=G.history.filter(h=>h.champ===G.user).map(h=>h.y);
  const hv=inTabs('histv',[['sum','지난 시즌'],['aw','시상'],['ldr','통산 순위'],['hof','명예의 전당'],['abroad','해외파']],'sum');
  if(hv.cur==='abroad')return hv.bar+abroadView();
  if(hv.cur==='sum')return hv.bar+seasonSummary();
  if(hv.cur==='aw')return hv.bar+csec('시즌 시상',aw);
  if(hv.cur==='ldr')return hv.bar+csec('통산 기록 순위',`<p class="small muted">현역과 은퇴 선수를 함께 비교합니다(1군 기록, 이 리그 기준).</p><div class="ldrs">${board('WAR',x=>x.war,v=>v.toFixed(1))}${board('안타',x=>x.h||0,v=>v,x=>!x.isP)}${board('홈런',x=>x.hr||0,v=>v,x=>!x.isP)}${board('승',x=>x.w||0,v=>v,x=>x.isP)}${board('세이브',x=>x.sv||0,v=>v,x=>x.isP)}</div>`);
  return hv.bar+csec(`명예의 전당 ${hof.length}명`,hof.length?`<div class="list">${hof.map(r=>`<div class="item" style="cursor:default"><span class="nm"><b>${esc(r.name)}</b> <span class="small muted">${r.pos} · ${r.y} 은퇴 · ${r.seasons}시즌</span></span><span class="sub">WAR ${r.war}${r.isP?` · ${r.w}승 ${r.sv}세이브 ${r.so}탈삼진`:` · ${r.h}안타 ${r.hr}홈런 ${r.rbi}타점`}${r.mvp?` · MVP ${r.mvp}회`:''}${r.gg?` · 골든글러브 ${r.gg}회`:''}</span></div>`).join('')}</div>`:'<p class="small muted">아직 헌액자가 없습니다. 통산 WAR 38 이상, MVP 2회, 골든글러브 6회 등을 남기고 은퇴한 선수가 오릅니다(게임 기준).</p>')
   +`<section class="card"><div class="row between"><span class="small">우리 구단 우승 ${champs.length}회 · 영구결번 ${(G.retNos||[]).length}명</span><button class="btn small" data-a="go" data-v="club:chron">우리 구단 연대기</button></div></section>`;
}

