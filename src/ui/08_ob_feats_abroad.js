/* ---------- OB·레전드 ---------- */
function obOf(id){ return id&&G.ob?G.ob.find(o=>o.id===id):null; }
function obTag(id){ const o=obOf(id); if(!o)return ''; return o.mine?` <span class="pill good">우리 구단 출신</span>`:` <span class="pill">${esc(tshort(o.team))} 출신</span>`; }
function obAv(ob,w,big){ const per=w.k==='mgr'?'mgr':w.k==='coach'?'coach':w.k==='gm'?'gm':w.k==='scout'||w.k==='front'?'staff':ob.path==='media'?'agent':'staff'; const pid='obv'+ob.id+per; G.obFace=G.obFace||{}; G.obFace[pid]=ob.fid;
  return avImg({persona:per,pid,team:w.tid??null,age:ob.age,name:ob.name},big); }
function obView(){ obInit(); const t=team(G.user); const RN=G.retNos||[];
  const wall=RN.length?`<div class="rnw">${RN.map(r=>`<div class="rn"><b>${r.no}</b><span>${esc(r.name)}</span><i>${r.y}년 지정</i></div>`).join('')}</div>`:`<p class="small muted">아직 영구결번이 없습니다. 우리 구단에서 ${retWarT()>=60?10:8}시즌 이상 뛰고 WAR ${retWarT()} 이상을 남긴 선수가 은퇴하면 지정할 수 있습니다.</p>`;
  const cand=(G.legends||[]).map((r,i)=>({r,i})).filter(x=>x.r.canRetNo&&!x.r.retNo);
  const candH=cand.length?`<div class="eyebrow" style="margin-top:10px">영구결번 후보</div>${cand.map(({r,i})=>`<div class="obr"><b class="num">${r.no}</b><span><b>${esc(r.name)}</b><i>${r.pos} · ${r.y}년 은퇴 · 우리 구단 ${r.mine.ys}시즌 WAR ${r.mine.war}</i></span><button class="btn small primary" data-a="retNo" data-v="${i}">영구결번 지정</button></div>`).join('')}`:'';
  const mine=G.ob.filter(o=>o.mine).map(o=>({o,w:obWhere(o)})).sort((a,b)=>(b.o.retNo?1:0)-(a.o.retNo?1:0)||b.o.mineWar-a.o.mineWar||b.o.war-a.o.war);
  const mgrC=new Set(obMgrCands().map(o=>o.id));
  const act=(o,w)=>{ if(w.k==='free'||w.k==='wait'&&o.path==='media'){ if(mgrC.has(o.id))return `<button class="btn small primary" data-a="obAct" data-v="${o.id}:mgr">감독 후보로</button>`;
      if(w.k==='free'&&(o.path==='coach'||o.path==='media'&&o.my>=3))return `<button class="btn small primary" data-a="obAct" data-v="${o.id}:coach">코치로 영입</button>`;
      if(w.k==='free'&&o.path==='scout')return `<button class="btn small primary" data-a="obAct" data-v="${o.id}:scout" ${G.scouts.length>=SCOUT_MAX?'disabled':''}>스카우트로 영입</button>`;
      if(w.k==='free'&&o.path==='front')return `<button class="btn small" data-a="obAct" data-v="${o.id}:front">프런트로 채용</button>`; }
    if(w.k==='front'&&w.tid!==G.user&&o.path!=='media')return `<button class="btn small" data-a="obAct" data-v="${o.id}:front">우리 프런트로</button>`; return ''; };
  const row=({o,w})=>`<div class="obc">${obAv(o,w)}<div class="obc-t"><b>${esc(o.name)}${o.retNo?` <span class="pill acc">${o.no||''}번 영구결번</span>`:''}${o.hof?' <span class="pill warn">명예의 전당</span>':''}</b>
      <i>${esc(o.pos)} · ${o.retY}년 은퇴 · ${o.age}세 · 우리 구단 ${o.ys}시즌${o.mineWar?` · WAR ${o.mineWar}`:''}</i>
      <span class="obc-w ${w.k}">${esc(w.t)}${w.k==='coach'||w.k==='mgr'?` · 지도자 ${o.cy}년차`:w.k==='scout'||w.k==='front'?` · ${o.sy+o.fy}년차`:''}</span>
      <em>${OBPATH[o.path]}의 길${o.aim?` · ${o.aim==='mgr'?'감독':'단장'}을 꿈꿈`:''}${o.bond>=20?' · 구단과 각별함':''}</em></div><div class="obc-a">${act(o,w)}</div></div>`;
  const league=G.ob.map(o=>({o,w:obWhere(o)})).filter(x=>(x.w.k==='mgr'||x.w.k==='gm'||x.w.k==='coach')&&x.w.tid!==G.user).sort((a,b)=>({gm:0,mgr:1,coach:2}[a.w.k]-{gm:0,mgr:1,coach:2}[b.w.k])||(b.o.mine?1:0)-(a.o.mine?1:0));
  return csec('영구결번',wall+candH)
    +csec(`${t.city} ${t.nick} 출신 OB ${mine.length}명`,(mine.length?`<div class="obg">${mine.map(row).join('')}</div>`:'<p class="small muted">아직 기록된 OB가 없습니다.</p>')+`<p class="small muted">은퇴한 선수는 지도자, 스카우트, 프런트, 해설위원의 길을 갑니다. 지도자 경력이 쌓이면 감독 후보가 되고, 프런트·스카우트 경력이 쌓이면 다른 구단 단장이 되기도 합니다. 우리 구단 출신이 다른 구단 단장이 되면 첫 친분이 높게 시작합니다. 은퇴식을 열어 주거나 구단에 남겨 둔 선수는 훗날 돌아올 가능성이 커집니다.</p>`)
    +csec('리그의 OB 출신 지도자·단장',league.length?`<div class="obg">${league.slice(0,24).map(({o,w})=>`<div class="obc">${obAv(o,w)}<div class="obc-t"><b>${esc(o.name)}${o.mine?' <span class="pill good">우리 구단 출신</span>':''}</b><i>${esc(tshort(o.team))} ${esc(o.pos)} 출신 · 통산 WAR ${o.war}</i><span class="obc-w ${w.k}">${esc(w.t)}</span></div></div>`).join('')}</div>`:'<p class="small muted">아직 없습니다.</p>'); }

/* ---------- 진기록 ---------- */
const FEATI={cyc:'◎',hr4:'4',hr3:'3',h6:'6',h5:'5',rbi8:'타',pg:'P',nh:'N',tnh:'N',k15:'K',cg0:'완',r20:'20',hs:'연',mile:'★',s3030:'30',s4040:'40',hr50:'50',h200:'200',avg400:'.4',tcB:'3',tcP:'3',w20:'20',sv40:'40',k200:'K',era1:'1',srec:'신',ovs:'해'};
function featView(){ const F=G.feats||[]; const f=UI.ftf||'all'; const yr=UI.fy||'all';
  const ys=[...new Set(F.map(x=>x.y))].sort((a,b)=>b-a);
  const L=F.filter(x=>(yr==='all'||x.y===+yr)&&(f==='all'||f==='mine'&&x.tid===G.user||f==='maj'&&x.maj||f==='g'&&FEATG[x.k]==='g'||f==='s'&&!FEATG[x.k]||f==='m'&&x.k==='mile'));
  const SB=G.sbest||{}; const sbl=[['hr','홈런',v=>v],['rbi','타점',v=>v],['h','안타',v=>v],['sb','도루',v=>v],['avg','타율',v=>fmt3(v)],['w','승',v=>v],['sv','세이브',v=>v],['so','탈삼진',v=>v],['era','평균자책점',v=>(+v).toFixed(2)]];
  const best=`<div class="sbbest">${sbl.filter(([k])=>SB[k]).map(([k,l,fm])=>{ const b=SB[k]; const p=G.players[b.pid]; return `<div class="sb"${p?` data-a="player" data-v="${b.pid}" role="button" tabindex="0"`:''}><i>시즌 최다 ${l}${k==='era'?'(최저)':k==='avg'?'(최고)':''}</i><b class="num">${fm(b.v)}</b><span>${b.tid!=null?badge(b.tid,13):''} ${esc(b.name)} · ${b.y}</span></div>`; }).join('')}</div>`;
  const cnt={}; for(const x of F.filter(x=>x.y===G.year))cnt[x.k]=(cnt[x.k]||0)+1;
  const row=x=>{ const p=x.pid!=null?G.players[x.pid]:null; const ob=!p&&x.pid!=null&&G.ob?G.ob.find(o=>o.fid===x.pid):null;
    return `<div class="ft ${x.maj?'maj':''} ${x.tid===G.user?'me':''}"${p?` data-a="player" data-v="${x.pid}" role="button" tabindex="0"`:''}><span class="ft-i k-${x.k}">${FEATI[x.k]||'·'}</span>${p?avImg(p):x.tid!=null?badge(x.tid,30):''}<div><b>${esc(x.name)}${x.tid!=null&&p?` <span class="small muted">${esc(tshort(x.tid))}</span>`:''}${!p&&x.pid!=null?` <span class="small muted">${ob?'은퇴':'리그 떠남'}</span>`:''}</b><span><em class="pill ${x.maj?'acc':''}">${FEATK[x.k]}</em> ${esc(x.txt.startsWith(FEATK[x.k])?x.txt.slice(FEATK[x.k].length).trim():x.txt)}</span></div><i>${x.y}<br>${x.vs?esc(x.vs.split(' vs ')[0]):'시즌'}</i></div>`; };
  return csec('리그 단일 시즌 최고 기록',best+'<p class="small muted">2025시즌부터 이 리그에서 나온 기록입니다. 깨지면 "시즌 신기록"으로 남습니다.</p>')
   +csec(`진기록 · ${F.length}건`,`<div class="chips">${[['all','전체'],['maj','대기록'],['mine','우리 팀'],['g','경기'],['s','시즌'],['m','통산 이정표']].map(([k,l])=>`<button data-a="featF" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div>
      <div class="chips">${['all',...ys].map(y=>`<button data-a="featY" data-v="${y}" class="${String(yr)===String(y)?'on':''}">${y==='all'?'전 시즌':y}</button>`).join('')}</div>
      ${Object.keys(cnt).length?`<p class="small muted">${G.year}시즌: ${Object.entries(cnt).map(([k,n])=>`${FEATK[k]} ${n}`).join(' · ')}</p>`:''}
      <div class="ftl">${L.slice(0,150).map(row).join('')||'<p class="small muted">조건에 맞는 기록이 없습니다.</p>'}</div>`); }

/* ---------- 해외파 · 대체 외국인 관찰 ---------- */
function lineTxt(h,isP){ if(!h)return '-'; if(isP){ const e=h.outs?h.er*27/h.outs:0; return `${ipStr(h.outs)}이닝 · ERA ${e.toFixed(2)} · ${h.so}K`; } const r=bRate(h); return `${h.pa}타석 · 타율 ${fmt3(r.avg)} · ${h.hr}홈런 · OPS ${fmt3(r.ops)}`; }
function fwatchBox(asia){ const W=(G.fwatch||[]).map(w=>({w,p:G.players[w.id]})).filter(x=>x.p&&(x.p.foreign==='아시아')===asia);
  const n=(G.fwatch||[]).length;
  return `<section class="card fwbox"><div class="row between"><h2 class="sec">대체 후보 관찰 명단</h2><span class="small muted">${n}/8명</span></div>
    ${W.length?`<div class="fwl">${W.map(({w,p})=>{ const rp=scoutReport(p); return `<div class="fw" data-a="player" data-v="${p.id}" role="button" tabindex="0">${avImg(p)}<div><b>${esc(p.name)} <span class="small muted">${esc(p.nat)} · ${p.age}세 · ${posLabel(p)}</span>${w.auto?' <span class="pill">스카우트 추천</span>':''}</b>
      <span class="small">${p.now&&p.now.y===G.year?`올해 ${esc(p.now.lvl||'')} ${lineTxt(p.now,p.isP)}`:`지난 시즌 ${esc(p.prevLvl||'')} ${lineTxt(p.prev,p.isP)}`}</span>
      <span class="fwk"><i style="width:${w.k}%"></i></span><em>스카우트 파악도 ${w.k}% · 평가 ${dv(rp.cur??'-')}${(()=>{ const pj=rp.cur!=null?projKBO(p,rp.cur,rp.sd):null; return pj?` · 올해 예상 ${pj.k==='era'?'ERA':'OPS'} ${pj.mid}`:''; })()} (오차 약 ±${Math.max(1,Math.round(rp.sd||0))}) · ${money(p.ask)}</em>${(()=>{ const same=foreignOf(G.user).filter(q=>q.foreign===p.foreign&&(asia||q.isP===p.isP)).sort((a,b)=>ovr(a)-ovr(b))[0]; const n=fInterest(p); const bits=[]; if(same&&rp.cur!=null){ const d=rp.cur-Math.round(ovr(same)); bits.push(`우리 ${esc(same.name)}(${dvo(same)})보다 ${d>0?'+':''}${d}`); } if(n)bits.push(`<b class="${n>=2?'bad':''}">${n}개 구단 관심</b>`); return bits.length?`<span class="small fw-cmp">${bits.join(' · ')}</span>`:''; })()}</div><button class="tc-i" data-a="fwatch" data-v="${p.id}">빼기</button></div>`; }).join('')}</div>`
      :`<p class="small muted">아래 후보의 "관찰"을 누르면 명단에 올라갑니다.</p>`}
    <p class="small muted">관찰 중인 후보는 매주 스카우트 보고가 쌓여 평가 오차가 줄어듭니다(해외 스카우트망 단계와 파견 스카우트 능력이 높을수록 빠름). 시장 후보가 바뀔 때도 사라지지 않습니다. 외국인 시장은 10개 구단이 함께 씁니다. 다른 구단이 먼저 계약하면 사라지고, 여러 구단이 노리는 선수는 몸값이 오릅니다. 시즌 중에는 MLB 콜업이나 일본 계약으로도 빠질 수 있습니다. 우리 외국인이 부상이나 부진에 빠지면 스카우트팀장이 같은 유형의 관찰 후보를 올려 줍니다.</p></section>`; }
function abroadView(){ const A=G.abroad||[]; const f=UI.abf||'all';
  const L=A.filter(a=>f==='all'||f==='mine'&&a.from===G.user||f==='kr'&&!a.foreign||f==='fo'&&a.foreign);
  const mine=domestic(G.user).map(p=>({p,m:mlbOf(p)})).filter(x=>x.p.age<=33&&ovr(x.p)>=56&&x.m>=35).sort((a,b)=>b.m-a.m).slice(0,8);
  const row=a=>{ const last=a.lines[a.lines.length-1]; const yrs=(a.back?a.backY:G.year)-a.y;
    return `<div class="abr">${a.from!=null?badge(a.from,26):''}<div><b>${esc(a.name)} <span class="small muted">${esc(a.pos)}${a.foreign?` · 외국인`:''}</span></b>
      <span class="small">${a.y}년 ${a.how} → <b>${esc(a.club)}(${a.lg})</b> ${a.yrs}년 ${a.amt*a.yrs}만 달러${a.fee?` · 포스팅 비용 ${money(a.fee)}`:''}</span>
      ${a.lines.length?`<span class="small muted">${a.lines.slice(-3).map(l=>`${l.y} ${esc(l.lvl)}: ${lineTxt(l,a.isP)}`).join('<br>')}</span>`:''}</div>
      <span class="pill ${a.back?'good':a.foreign?'':'acc'}">${a.back?`${a.backY} 복귀`:a.foreign?'역수출':`해외 ${Math.max(0,yrs)}년차`}</span></div>`; };
  return csec('우리 선수의 해외 진출 의지',mine.length?`<div class="mlbl">${mine.map(({p,m})=>`<div class="mlb" data-a="player" data-v="${p.id}" role="button" tabindex="0">${avImg(p)}<div><b>${esc(p.name)} <span class="small muted">${posLabel(p)} · ${p.age}세 · 서비스 ${p.svc}년</span></b>
      <span class="fwk"><i style="width:${m}%;background:${m>=55?'#ff8a5b':'#e6b93b'}"></i></span><em>의지 ${m}${m>=55?' · 비시즌에 포스팅을 요청할 수 있음':''} · ${p.svc>=9?'해외 FA 가능':p.svc>=7?'포스팅 자격 있음':`포스팅까지 ${7-p.svc}년`}${p.postPromise?` · ${p.postPromise}년 포스팅 약속`:''}</em></div></div>`).join('')}</div>`:'<p class="small muted">해외 진출 의지가 눈에 띄는 선수가 없습니다.</p>')
    +`<p class="small muted">야망이 큰 선수일수록 의지가 높고, 활약할 때 언론이 "메이저리그 스카우트 집결" 같은 기사를 내면 더 오릅니다. 서비스 7년부터 구단 동의로 포스팅, 9년부터 해외 FA가 가능합니다. 포스팅이 성사되면 계약 보장액에 따라 포스팅 비용(2,500만 달러까지 20%, 다음 2,500만 달러 17.5%, 그 이상 15%)을 받습니다.</p>`
    +csec(`해외파 · 역수출 ${A.length}명`,`<div class="chips">${[['all','전체'],['mine','우리 구단 출신'],['kr','국내 선수'],['fo','외국인 역수출']].map(([k,l])=>`<button data-a="abf" data-v="${k}" class="${f===k?'on':''}">${l}</button>`).join('')}</div>
      <div class="abl">${L.map(row).join('')||'<p class="small muted">아직 해외로 나간 선수가 없습니다.</p>'}</div>`); }

