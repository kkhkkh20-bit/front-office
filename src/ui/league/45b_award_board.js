/* ---------- 시즌 시상 보드: MVP·신인왕·골든글러브(포지션별 얼굴·구단·기록·득표·2위와 표 차·시상 전 예상) + 포스트시즌 MVP ----------
   시상식 '결과' 화면, 리그 → 역사 → 시상, 시상·레이스 기사의 바로 가기 버튼이 모두 이 보드를 쓴다. 우리 구단 수상자는 구단색 테두리 */
const AWB_GG=['P','C','1B','2B','3B','SS','OF0','OF1','OF2','DH'];
const awbTeam=(t,z)=>t!=null&&G.teams[t]?`${badge(t,z)} ${esc(tshort(t))}`:'무소속';
function awbCands(A,k){ const c=A&&A.cand; if(!c)return []; return k==='mvp'?c.mvp||[]:k==='roy'?c.roy||[]:(c.gg||{})[k.startsWith('OF')?'OF':k]||[]; }
/* 다음 순위와 표 차: '+33표 · 2위 김종현'(외야수는 4위와), 같은 표면 기록 점수로 갈렸다고 밝힌다. short면 이름 없이 */
function awbMargin(A,k,w,short){ const C=awbCands(A,k), seats=k.startsWith('OF')?3:1, nx=C[seats]; if(w.v==null)return ''; if(!nx)return C.length<=seats?'단독 후보':''; const d=Math.max(0,w.v-(nx.v||0)), r=seats>1?'4위':'2위';
  return short?(d?`${r}와 ${d}표 차`:`${r}와 동표 · 기록 점수 우위`):`${d?`+${d}표`:'동표'} · ${r} ${nx.name}`; }
/* 시상식 전날 기록 점수 예상과 비교 */
function awbPred(A,k,id){ const P=A&&A.pred; if(!P)return ''; const pr=k==='mvp'||k==='roy'?P.mvp&&P.mvp[k]:P.gg&&P.gg.g&&P.gg.g[k.startsWith('OF')?'OF':k]; if(pr==null)return '';
  const L=Array.isArray(pr)?pr:[pr]; if(L.includes(id))return '<span class="pill good awb-p">예상 적중</span>';
  const won=new Set(Object.values(A.gg||{}).map(x=>x&&x.id)); const c=awbCands(A,k).find(c=>L.includes(c.id)&&!(k.startsWith('OF')&&won.has(c.id))); return c?`<span class="pill awb-p" title="시상식 전 기록 점수 예상">예상 ${esc(c.name)}</span>`:''; }
function awbRow(A,k,lab,w,tot){ const p=awP(w.id), pct=Math.round((w.v||0)/tot*100), mg=awbMargin(A,k,w);
  return `<${p?`button data-a="player" data-v="${w.id}"`:'div'} class="awb-r${w.t===G.user?' me':''}"><i>${esc(lab)}</i>${cerFace(w)}<span class="awb-n"><b>${esc(w.name)}</b><em>${awbTeam(w.t,14)}</em></span><span class="awb-l">${esc(w.line||'')}</span><span class="awb-v">${w.v!=null?`<span class="cer-bar"><i style="--w:${pct}%"></i></span><b class="num">${w.v}표</b>`:''}${mg?`<em>${esc(mg)}</em>`:''}</span>${awbPred(A,k,w.id)}</${p?'button':'div'}>`; }
function awbHero(A,k,lab,w){ if(!w)return ''; const C=awbCands(A,k), pct=Math.round((w.v||0)/125*100), p=awP(w.id);
  return `<div class="awb-h${w.t===G.user?' me':''}"><${p?`button data-a="player" data-v="${w.id}"`:'div'} class="awb-hm">${cerFace(w)}<span class="awb-hi"><span class="eyebrow">${esc(lab)}</span><b>${esc(w.name)}</b><span>${w.t!=null&&G.teams[w.t]?`${badge(w.t,18)} ${esc(tname(w.t))}`:'무소속'}</span><em>${esc(w.line||'')}</em></span></${p?'button':'div'}>
    <div class="cer-sv"><span class="cer-bar"><i style="--w:${pct}%"></i></span><b class="num">${w.v}표 · ${pct}%</b></div><p class="small muted awb-mg">${esc(awbMargin(A,k,w,true))} ${awbPred(A,k,w.id)}</p>
    ${C.length>1?`<div class="awb-ru">${C.slice(1,3).map((c,i)=>`<span>${i+2}위 <b>${esc(c.name)}</b> <em>${esc(c.t!=null&&G.teams[c.t]?tshort(c.t):'')} · ${c.v}표</em></span>`).join('')}</div>`:''}</div>`; }
function awbGG(A){ const nm=k=>k.startsWith('OF')?'외야수':k==='P'?'투수':POSK[k];
  return `<div class="awb-gg"><div class="awb-fld">${ggField(A,false)}</div><div class="awb-list">${AWB_GG.filter(k=>A.gg&&A.gg[k]).map(k=>awbRow(A,k,nm(k),A.gg[k],288)).join('')}</div></div>`; }
/* 포스트시즌 MVP: 시리즈 MVP(와일드카드→한국시리즈) + 경기 MVP 목록 */
function awbPS(y){ const M=psMvpOf(y)||{g:[],s:{}}; const S={...M.s}; if(!S.ks){ const h=(G.history||[]).find(h=>h.y===y&&h.champ!=null); const r=h&&psSeriesMvp(y,'ks',h.champ); if(r)S.ks={id:r.id,n:r.n,t:h.champ,line:r.line}; } /* 이 업데이트 전 시즌도 한국시리즈 기록이 남아 있으면 같은 식으로 */
  const RD=['wc','spo','po','ks'], rd=RD.filter(r=>S[r]); if(!rd.length&&!M.g.length)return '';
  const card=r=>{ const m=S[r], p=awP(m.id); return `<${p?`button data-a="player" data-v="${m.id}"`:'div'} class="awb-ps${m.t===G.user?' me':''}"><i>${esc(ROUNDK[r])}</i>${cerFace({id:m.id,name:m.n})}<span class="awb-n"><b>${esc(m.n)}</b><em>${m.t!=null&&G.teams[m.t]?awbTeam(m.t,14):''}</em></span><span class="awb-l">${esc(m.line)}</span></${p?'button':'div'}>`; };
  const G0=[...M.g].sort((a,b)=>RD.indexOf(a.rd)-RD.indexOf(b.rd)||a.n-b.n);
  return `<div class="awb-sec"><h3 class="awb-t">${y} 포스트시즌 MVP</h3>${rd.length?`<div class="awb-pss">${rd.map(card).join('')}</div>`:''}${G0.length?`<details class="awb-gm"><summary class="eyebrow">경기 MVP ${G0.length}경기</summary><div class="awb-gml">${G0.map(g=>`<div class="awb-g${g.t===G.user?' me':''}"><i>${esc(ROUNDK[g.rd])} ${g.n}차전</i>${G.players[g.id]?`<button class="lnk" data-a="player" data-v="${g.id}">${esc(g.name)}</button>`:`<b>${esc(g.name)}</b>`}<em>${g.t!=null&&G.teams[g.t]?esc(tshort(g.t)):''} · ${esc(g.line)}</em></div>`).join('')}</div></details>`:''}</div>`; }
/* 시즌 중: MVP 레이스·신인왕 경쟁 실시간(기사와 같은 점수) */
function awbRace(y){ if(period()!=='season'||!G.sea||G.sea.y!==y)return ''; let M=[],R=[]; try{ M=awRaceTop(y,'mvp',5); R=awRaceTop(y,'roy',5); }catch(e){ return ''; }
  const row=(c,i)=>{ const p=G.players[c.id]; return `<button class="awb-r awb-rc${c.t===G.user?' me':''}" data-a="player" data-v="${c.id}"><i>${i+1}위</i>${p?avImg(p,true):''}<span class="awb-n"><b>${esc(c.name)}</b><em>${awbTeam(c.t,14)}${c.pos?' · '+esc(c.pos):''}</em></span><span class="awb-l">${esc(c.line)}</span><span class="awb-v"><b class="num">${c.b.toFixed(1)}점</b><em>WAR ${c.w.toFixed(1)}</em></span></button>`; };
  return `<div class="awb-sec"><h3 class="awb-t">${y} 시상 레이스 <small class="muted">${dmd(G.day)} 기준</small></h3><div class="awb-race"><div><div class="eyebrow">MVP 레이스</div>${M.map(row).join('')||'<p class="small muted">규정 기록을 채운 선수가 아직 없습니다.</p>'}</div><div><div class="eyebrow">신인왕 경쟁</div>${R.map(row).join('')||'<p class="small muted">자격을 갖춘 신인이 아직 없습니다.</p>'}</div></div><p class="small muted">점수 = WAR + 홈런·타점·승리·세이브 같은 눈에 띄는 기록 + 팀 순위 3위 이내 가산(기자단 투표와 같은 기록 점수). 시즌이 끝나면 기자단이 투표합니다.</p></div>`; }
function awbPredText(A,k){ const P=A.pred&&A.pred[k]; if(!P)return ''; const nmOf=id=>{ const c=[...(A.cand.mvp||[]),...(A.cand.roy||[]),...Object.values(A.cand.gg||{}).flat()].find(c=>c.id===id); return c?`${esc(c.name)}(${esc(tshort(c.t))})`:'-'; };
  return k==='mvp'?`<p class="small">시상식 전 예상 · MVP ${nmOf(P.mvp)} · 신인왕 ${nmOf(P.roy)}</p>`:`<p class="small">골든글러브 예상 · ${GG_PK.filter(x=>P.g[x]!=null).map(x=>`${ggPosName(x)} ${(Array.isArray(P.g[x])?P.g[x]:[P.g[x]]).map(nmOf).join(', ')}`).join(' · ')}</p>`; }
function awbHit(A,k){ const h=A.pred&&A.pred[k]&&awPredHit(A,k); return h&&h.n?` <span class="pill ${h.hit===h.n?'good':''}">예상 ${h.hit}/${h.n} 적중</span>`:''; }
function awBoard(A,y){ if(!A)return awbRace(y);
  const mv=awShown(A,'mvp'), gg=awShown(A,'gg');
  return `<div class="awb">
    <div class="awb-sec"><h3 class="awb-t">${y} MVP · 신인왕${mv?awbHit(A,'mvp'):''}${mv&&A.cand?` <button class="btn small" data-a="cerOpen" data-v="${y}:mvp">시상식 다시 보기</button>`:''}</h3>${mv?`<div class="awb-hs">${awbHero(A,'mvp','MVP',A.mvp)}${awbHero(A,'roy','신인왕',A.roy)}</div>`:`<p class="small muted">${A.days?awDateText(A.days.mvp,y):dmd(KD(11,24))} ${ASSOC.s} 시상식에서 발표합니다.</p>${awbPredText(A,'mvp')}`}</div>
    <div class="awb-sec"><h3 class="awb-t">${y} 골든글러브${gg?awbHit(A,'gg'):''}${gg&&A.cand?` <button class="btn small" data-a="cerOpen" data-v="${y}:gg">시상식 다시 보기</button>`:''}</h3>${gg?awbGG(A):`<p class="small muted">${A.days?awDateText(A.days.gg,y):dmd(KD(12,9))} 골든글러브 시상식에서 발표합니다.</p>${awbPredText(A,'gg')}`}</div>
    ${awbPS(y)}</div>`; }
/* 포스트시즌 경기 기록의 경기 MVP(이 업데이트 전 경기는 박스스코어로 같은 식) */
function gameMvpOf(g){ if(!g||!/차전/.test(g.kind||'')||/결정전/.test(g.kind||'')&&!/와일드카드/.test(g.kind||''))return null; if(g.mvp)return g.mvp; try{ return g.box?psGameMvpBox(g.box,g.hs>g.as?'h':g.as>g.hs?'a':null):null; }catch(e){ return null; } }
Object.assign(A,{
  /* 시상·레이스 기사에서: 리그 → 역사 → 시상, 그 해 */
  awOpen(v){ const y=+v; closeSheets(); UI.hy=G.awards&&G.awards[y]?y:null; UI.it=UI.it||{}; UI.it.histv='aw'; A.go('league:hist'); }
});
