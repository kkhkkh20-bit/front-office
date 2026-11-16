/* ===== 단장 대전: 구단 만들기 화면 =====
   숨김 플래그 LADDER_ON(엔진 01_ladder_pool)이 켜졌을 때만 처음 화면에 버튼이 보인다. 서버가 붙기 전(1단계)에는 구단을 이 기기에만 저장한다.
   이번 시즌 선수 풀에서 연봉 한도 안으로 26명을 고르고, 감독·타순·선발·불펜 역할을 정한다. 규칙 검사는 공용 모듈(FrontOfficeCore.ladderValidate) 그대로 */
const LAD_KEY='fo-ladder-v1', LAD_HUES=[210,0,24,45,140,175,265,300,330];
const LAD_F=[['all','전체'],['SP','선발'],['RP','불펜'],['C','포수'],['1B','1루'],['2B','2루'],['3B','3루'],['SS','유격'],['OF','외야']];
const LAD_S=[['ovr','능력'],['val','가성비'],['sal','연봉'],['age','나이']];
function ladStore(){ try{ return JSON.parse(localStorage.getItem(LAD_KEY)||'null')||{}; }catch(e){ return {}; } }
function ladKeep(){ const L=UI.lad; if(!L)return; try{ localStorage.setItem(LAD_KEY,JSON.stringify({nick:L.nick,dev:L.dev,snap:L.snap,saved:L.saved||null})); }catch(e){} }
function ladDevId(){ try{ const a=new Uint8Array(8); crypto.getRandomValues(a); return [...a].map(x=>x.toString(16).padStart(2,'0')).join(''); }catch(e){ return Math.random().toString(16).slice(2,18).padEnd(16,'0'); } }
function ladEmpty(season){ return {v:FrontOfficeCore.LADDER_V,season,name:'',hue:210,mgr:'',roster:[],lineup:[],rot:[],cl:null,su:[]}; }
function ladInit(){ if(UI.lad&&UI.lad.season===ladderSeasonId())return UI.lad; const season=ladderSeasonId(), s=ladStore();
  const snap=s.snap&&s.snap.season===season?s.snap:ladEmpty(season);
  UI.lad={season,snap,nick:s.nick||'',dev:s.dev||ladDevId(),saved:s.snap&&s.snap.season===season?s.saved||null:null,f:'all',sort:'ovr',msg:'',test:null}; ladKeep(); return UI.lad; }
const ladPool=()=>ladderPool(ladInit().season);
const ladP=id=>ladPool().players.find(p=>p.id===+id);
const ladRole=(s,id)=>s.rot.includes(id)?'rot':s.cl===id?'cl':s.su.includes(id)?'su':'pen';
/* 선수 넣기: 야수는 빈 타순(제 포지션 우선)이나 벤치, 투수는 선발형이면 빈 선발 자리, 아니면 마무리 → 필승조 → 불펜 */
function ladPut(s,p){ if(s.roster.includes(p.id))return ''; if(s.roster.length>=ladPool().rules.roster)return `1군 ${ladPool().rules.roster}명이 다 찼습니다. 먼저 한 명을 빼 주세요.`;
  s.roster.push(p.id); const R=ladPool().rules;
  if(!p.isP){ if(s.lineup.length<9){ const used=new Set(s.lineup.map(x=>x[1])); const pos=!used.has(p.pos)?p.pos:p.pos!=='C'&&!used.has('DH')?'DH':R.slots.find(k=>!used.has(k)&&(k!=='C'||p.pos==='C')); if(pos)s.lineup.push([p.id,pos]); } }
  else if(p.role==='SP'&&s.rot.length<R.rot)s.rot.push(p.id); else if(s.cl==null)s.cl=p.id; else if(s.su.length<R.setup)s.su.push(p.id);
  return ''; }
function ladDrop(s,id){ s.roster=s.roster.filter(x=>x!==id); s.lineup=s.lineup.filter(x=>x[0]!==id); s.rot=s.rot.filter(x=>x!==id); s.su=s.su.filter(x=>x!==id); if(s.cl===id)s.cl=null; }
function ladTouch(msg){ const L=UI.lad; L.msg=msg||''; L.test=null; ladKeep(); render(); }
/* 동작 */
Object.assign(A,{
  ladOpen(){ ladInit(); UI.sstep='ladder'; render(); window.scrollTo(0,0); },
  ladF(v){ UI.lad.f=v; render(); }, ladSort(v){ UI.lad.sort=v; render(); },
  ladAdd(v){ const p=ladP(v); if(!p)return; ladTouch(ladPut(UI.lad.snap,p)); },
  ladDel(v){ ladDrop(UI.lad.snap,+v); ladTouch(); },
  ladUp(v){ const L=UI.lad.snap.lineup, i=L.findIndex(x=>x[0]===+v); if(i>0){ [L[i-1],L[i]]=[L[i],L[i-1]]; ladTouch(); } },
  ladDown(v){ const L=UI.lad.snap.lineup, i=L.findIndex(x=>x[0]===+v); if(i>=0&&i<L.length-1){ [L[i+1],L[i]]=[L[i],L[i+1]]; ladTouch(); } },
  ladBench(v){ const s=UI.lad.snap; s.lineup=s.lineup.filter(x=>x[0]!==+v); ladTouch(); },
  /* 타순 자리의 수비 위치: 이미 그 자리에 있던 선수와 맞바꾼다 */
  ladPos(v,el){ const s=UI.lad.snap, id=+el.dataset.id, me=s.lineup.find(x=>x[0]===id); if(!me)return; const o=s.lineup.find(x=>x[1]===v&&x[0]!==id); if(o)o[1]=me[1]; me[1]=v; ladTouch(); },
  /* 벤치 선수를 타순 n번에: 그 자리 선수는 벤치로, 수비 위치는 이어받는다 */
  ladSlot(v,el){ const s=UI.lad.snap, id=+el.dataset.id; if(v==='')return; const i=+v; if(i>=s.lineup.length){ const used=new Set(s.lineup.map(x=>x[1])); const p=ladP(id); const pos=!used.has(p.pos)?p.pos:ladPool().rules.slots.find(k=>!used.has(k)&&k!=='C')||'DH'; s.lineup.push([id,pos]); } else s.lineup[i]=[id,s.lineup[i][1]]; ladTouch(); },
  ladRoleSet(v,el){ const s=UI.lad.snap, id=+el.dataset.id, R=ladPool().rules, p=ladP(id); s.rot=s.rot.filter(x=>x!==id); s.su=s.su.filter(x=>x!==id); if(s.cl===id)s.cl=null;
    let msg=''; if(v==='rot'){ if(p.role!=='SP')msg=`${p.name}는 선발형 투수가 아니라 선발로 쓸 수 없습니다.`; else { if(s.rot.length>=R.rot)s.rot.pop(); s.rot.push(id); } }
    else if(v==='cl')s.cl=id; else if(v==='su'){ if(s.su.length>=R.setup)s.su.shift(); s.su.push(id); }
    ladTouch(msg); },
  ladName(v){ UI.lad.snap.name=String(v||'').trim().slice(0,ladPool().rules.nameMax); ladTouch(); },
  ladHue(v){ UI.lad.snap.hue=+v; ladTouch(); },
  ladMgr(v){ UI.lad.snap.mgr=v; ladTouch(); },
  ladAuto(){ const s=UI.lad.snap; const a=ladderAuto(UI.lad.season,{name:s.name||'',hue:s.hue,mgr:s.mgr||undefined}); a.name=s.name; UI.lad.snap=a; ladTouch('연봉 한도 안에서 가성비가 좋은 선수로 26명을 채웠습니다. 마음에 들지 않는 선수를 바꿔 보세요.'); },
  ladClear(){ const s=UI.lad.snap; UI.lad.snap=Object.assign(ladEmpty(UI.lad.season),{name:s.name,hue:s.hue,mgr:s.mgr}); ladTouch('명단을 비웠습니다.'); },
  ladSaveClub(){ const L=UI.lad, v=FrontOfficeCore.ladderValidate(L.snap,ladPool()); if(!v.ok){ ladTouch('고칠 점이 남아 있어 저장하지 않았습니다.'); return; } L.saved={hash:FrontOfficeCore.ladderSnapHash(L.snap),at:Date.now()}; ladTouch('구단을 이 기기에 저장했습니다. 대전 서버가 열리면 이 구단으로 등록합니다.'); },
  ladTest(){ const L=UI.lad, pool=ladPool(); const opp=ladderAuto(L.season,{name:'연습 상대',hue:24,bias:1,mgr:'LM5'});
    const r=ladderSeries(L.snap,opp,{seed:'practice:'+L.dev,games:30,pool}); L.msg=r.ok?'':'고칠 점이 남아 연습 경기를 할 수 없습니다.'; L.test=r.ok?r:null; render(); },
  /* 연습 리그: 내 구단 + 자동 편성 7개로 리그 팩을 만들어 이 기기에서 돌린다(서버가 내려 줄 팩과 같은 실행 경로) */
  ladLeague(){ const L=UI.lad; const pk=ladderPackDemo(L.season,8,{mine:Object.assign({},L.snap,{name:L.snap.name||'내 구단'}),seed:'practice:'+L.dev,meet:4,leagueId:'practice'}); const r=ladderPackRun(pk); L.msg=r.ok?'':'고칠 점이 남아 연습 리그를 할 수 없습니다.'; L.test=r.ok?Object.assign(r,{league:true}):null; render(); },
});
/* 화면 */
function ladScreen(){ const L=ladInit(), pool=ladPool(); return ladderView(L.season,()=>ladScreen0(L,pool)); }
function ladScreen0(L,pool){ const s=L.snap, R=pool.rules, V=FrontOfficeCore.ladderValidate(s,pool), mine=new Set(s.roster);
  const P=new Map(pool.players.map(p=>[p.id,p])), mg=pool.mgrs.find(m=>m.id===s.mgr);
  const pay=V.pay, cap=pool.cap, nP=s.roster.filter(id=>P.get(id).isP).length, nB=s.roster.length-nP;
  const col=`hsl(${s.hue} 62% 46%)`;
  /* 선수 풀 목록 */
  const fOk=p=>{ const f=L.f; return f==='all'||(f==='SP'||f==='RP'?p.isP&&p.role===f:f==='OF'?['LF','CF','RF'].includes(p.pos):p.pos===f); };
  const val=p=>(ovr(p)+(p.isP?0:pvShift(p))-38)/Math.pow(Math.max(p.sal,MIN_SAL),.42);
  const key={ovr:p=>-ovr(p),val:p=>-val(p),sal:p=>-p.sal,age:p=>p.age}[L.sort]||(p=>-ovr(p));
  const list=pool.players.filter(fOk).sort((a,b)=>key(a)-key(b)||a.id-b.id);
  const rat=p=>p.isP?`구위 ${dv(p.r.stf)} · 제구 ${dv(p.r.ctl)} · 체력 ${dv(p.r.sta)}`:`컨택 ${dv(p.r.con)} · 파워 ${dv(p.r.pow)} · 수비 ${dv(p.r.def)}`;
  const posT=p=>p.isP?`${p.role==='SP'?'선발':'불펜'} · ${p.th}투`:`${POSS[p.pos]} · ${p.bt}타`;
  const prow=p=>{ const on=mine.has(p.id); return `<tr class="${on?'on':''}"><td class="lad-nm"><b>${esc(p.name)}</b><span>${p.age}세 · ${posT(p)}</span></td><td>${rchip(ovr(p))}</td><td class="lad-rt">${rat(p)}</td><td class="num">${money(p.sal)}</td>
    <td>${on?`<button class="btn small" data-a="ladDel" data-v="${p.id}" aria-label="${esc(p.name)} 빼기">빼기</button>`:`<button class="btn small go" data-a="ladAdd" data-v="${p.id}" aria-label="${esc(p.name)} 넣기"${s.roster.length>=R.roster?' disabled':''}>넣기</button>`}</td></tr>`; };
  const poolPanel=`<section class="lad-panel lad-pool" aria-label="선수 풀"><header><h2 class="sec">선수 풀 <small>${pool.players.length}명</small></h2>
      <div class="chips" role="group" aria-label="포지션">${LAD_F.map(([k,l])=>`<button data-a="ladF" data-v="${k}" class="${L.f===k?'on':''}">${l}</button>`).join('')}</div>
      <div class="chips" role="group" aria-label="정렬"><span class="small muted">정렬</span>${LAD_S.map(([k,l])=>`<button data-a="ladSort" data-v="${k}" class="${L.sort===k?'on':''}">${l}</button>`).join('')}</div></header>
    <div class="lad-scroll"><table class="lad-tbl"><thead><tr><th>선수</th><th>능력</th><th>주요 능력</th><th>연봉</th><th></th></tr></thead><tbody>${list.map(prow).join('')}</tbody></table></div></section>`;
  /* 내 1군 */
  const nm=id=>{ const p=P.get(id); return p?esc(p.name):'-'; };
  const posSel=(id,cur)=>`<select data-a="ladPos" data-id="${id}" aria-label="수비 위치">${R.slots.map(k=>`<option value="${k}"${k===cur?' selected':''}>${POSS[k]}</option>`).join('')}</select>`;
  const fit=(p,pos)=>pos==='DH'||p.pos===pos?'':`<span class="pill warn" title="제 포지션이 아닙니다">${POSS[p.pos]}</span>`;
  const lnRows=s.lineup.map(([id,pos],i)=>{ const p=P.get(id); return `<li><b class="lad-no">${i+1}</b>${avImg(p)}<span class="lad-who"><b>${esc(p.name)}</b><span>${rat(p)}</span></span>${fit(p,pos)}${posSel(id,pos)}${rchip(ovr(p))}
      <span class="lad-mv"><button class="btn small" data-a="ladUp" data-v="${id}" aria-label="위로"${i?'':' disabled'}>▲</button><button class="btn small" data-a="ladDown" data-v="${id}" aria-label="아래로"${i<s.lineup.length-1?'':' disabled'}>▼</button><button class="btn small" data-a="ladBench" data-v="${id}">벤치로</button></span></li>`; }).join('');
  const inLn=new Set(s.lineup.map(x=>x[0]));
  const bench=s.roster.filter(id=>!P.get(id).isP&&!inLn.has(id));
  const slotSel=id=>`<select data-a="ladSlot" data-id="${id}" aria-label="타순에 넣기"><option value="">타순에 넣기</option>${s.lineup.map((x,i)=>`<option value="${i}">${i+1}번 ${nm(x[0])} 대신</option>`).join('')}${s.lineup.length<9?`<option value="${s.lineup.length}">${s.lineup.length+1}번(빈 자리)</option>`:''}</select>`;
  const bRows=bench.map(id=>{ const p=P.get(id); return `<li>${avImg(p)}<span class="lad-who"><b>${esc(p.name)}</b><span>${POSS[p.pos]} · ${rat(p)}</span></span>${rchip(ovr(p))}${slotSel(id)}<button class="btn small" data-a="ladDel" data-v="${id}">빼기</button></li>`; }).join('');
  const roleL={rot:'선발',cl:'마무리',su:'필승조',pen:'불펜'};
  const pits=s.roster.filter(id=>P.get(id).isP).sort((a,b)=>{ const o=id=>{ const r=ladRole(s,id); return r==='rot'?s.rot.indexOf(id):r==='cl'?10:r==='su'?11+s.su.indexOf(id):20; }; return o(a)-o(b)||a-b; });
  const pRows=pits.map(id=>{ const p=P.get(id), r=ladRole(s,id); return `<li class="lad-${r}">${avImg(p)}<span class="lad-who"><b>${esc(p.name)}</b><span>${p.role==='SP'?'선발형':'불펜형'} · ${rat(p)}</span></span>${rchip(ovr(p))}
      <select data-a="ladRoleSet" data-id="${id}" aria-label="역할">${Object.entries(roleL).map(([k,l])=>`<option value="${k}"${k===r?' selected':''}${k==='rot'&&p.role!=='SP'?' disabled':''}>${k==='rot'&&r==='rot'?`${s.rot.indexOf(id)+1}선발`:l}</option>`).join('')}</select><button class="btn small" data-a="ladDel" data-v="${id}">빼기</button></li>`; }).join('');
  const clubPanel=`<section class="lad-panel lad-club" aria-label="내 1군"><header><h2 class="sec">내 1군 <small>${s.roster.length}/${R.roster}명 · 투수 ${nP} · 야수 ${nB}</small></h2>
      <div class="row"><button class="btn" data-a="ladAuto">자동 편성</button><button class="btn" data-a="ladClear"${s.roster.length?'':' disabled'}>비우기</button></div></header>
    <div class="lad-scroll lad-cols"><div><h3 class="lad-h">타순 <small>${s.lineup.length}/9</small></h3><ol class="lad-list">${lnRows||'<li class="lad-none">야수를 넣으면 타순이 채워집니다.</li>'}</ol>
      <h3 class="lad-h">벤치 <small>${bench.length}명</small></h3><ul class="lad-list">${bRows||'<li class="lad-none">벤치 야수가 없습니다.</li>'}</ul></div>
      <div><h3 class="lad-h">투수진 <small>선발 ${s.rot.length}/${R.rot} · 필승조 ${s.su.length}/${R.setup}</small></h3><ul class="lad-list">${pRows||'<li class="lad-none">투수를 넣으면 선발·불펜이 채워집니다.</li>'}</ul></div></div></section>`;
  /* 구단·감독·점검 */
  const lv=v=>v>=65?'높음':v>=45?'보통':'낮음';
  const mRow=m=>`<button class="lad-mgr${m.id===s.mgr?' on':''}" data-a="ladMgr" data-v="${m.id}" aria-pressed="${m.id===s.mgr}"><b>${esc(m.name)}</b><span>작전 ${lv(m.tac)} · 작은 야구 ${lv(m.small)} · 불펜 운용 ${lv(m.pen)}</span><em>${money(m.sal)}</em></button>`;
  const T=L.test; const test=T&&T.league?`<div class="lad-test"><b>연습 리그 ${T.gamesTotal*2/T.clubs}경기 · 결과 ${esc(T.hash)}</b><table class="lad-tbl lad-st"><thead><tr><th>순위</th><th>구단</th><th>승</th><th>패</th><th>무</th><th>승차</th></tr></thead><tbody>${T.standings.map(x=>`<tr class="${x.club===0?'on':''}"><td>${x.rank}</td><td>${esc(x.name)}</td><td>${x.w}</td><td>${x.l}</td><td>${x.t}</td><td>${x.gb}</td></tr>`).join('')}</tbody></table></div>`:T?`<div class="lad-test"><b>연습 30경기: ${T.a.w}승 ${T.a.l}패${T.a.t?` ${T.a.t}무`:''}</b><span>득점 ${T.a.runs} · 실점 ${T.a.allowed} · 상대 ${esc(T.b.name)}</span>${T.a.bat[0]?`<span>타선 중심 ${esc(T.a.bat[0].name)} 타율 ${T.a.bat[0].avg.toFixed(3).replace(/^0/,'')} · ${T.a.bat[0].hr}홈런</span>`:''}</div>`:'';
  const sidePanel=`<section class="lad-panel lad-side" aria-label="구단과 감독"><div class="lad-scroll">
      <h3 class="lad-h">구단</h3><label class="lad-lab">구단 이름<input type="text" data-a="ladName" maxlength="${R.nameMax}" value="${esc(s.name)}" placeholder="${R.nameMax}자 이하"></label>
      <div class="lad-hues" role="group" aria-label="구단 색">${LAD_HUES.map(h=>`<button data-a="ladHue" data-v="${h}" class="${h===s.hue?'on':''}" style="--h:hsl(${h} 62% 46%)" aria-label="색 ${h}" aria-pressed="${h===s.hue}"></button>`).join('')}</div>
      <h3 class="lad-h">감독 <small>${mg?esc(mg.name):'고르세요'}</small></h3><div class="lad-mgrs">${pool.mgrs.map(mRow).join('')}</div>
      <h3 class="lad-h">점검</h3>${V.ok?'<p class="lad-ok">대전에 나갈 수 있는 구단입니다.</p>':`<ul class="lad-err">${V.errors.slice(0,6).map(e=>`<li>${esc(e.msg)}</li>`).join('')}${V.errors.length>6?`<li>그 밖에 ${V.errors.length-6}가지</li>`:''}</ul>`}
      ${L.msg?`<p class="note">${esc(L.msg)}</p>`:''}${test}
      <div class="row lad-acts"><button class="btn go" data-a="ladSaveClub"${V.ok?'':' disabled'}>구단 저장</button><button class="btn" data-a="ladTest"${V.ok?'':' disabled'}>연습 30경기</button><button class="btn" data-a="ladLeague"${V.ok?'':' disabled'}>연습 리그</button></div>
      <p class="small muted">${L.saved?`저장한 구단 ${esc(L.saved.hash)} · `:''}대전 서버는 준비 중입니다. 지금은 이 기기에만 저장합니다. 보상은 칭호와 배지뿐이며 본게임에는 영향이 없습니다.</p></div></section>`;
  const capPct=Math.min(100,Math.round(pay/cap*100));
  return `<main class="lad" style="--club:${col}" aria-label="단장 대전 구단 만들기"><header class="lad-top"><button class="lnk tsback" data-a="tsGo" data-v="main">← 처음 화면</button>
      <h1><span class="lad-dot"></span>단장 대전 · 구단 만들기 <small>${esc(L.season)} 시즌</small></h1>
      <div class="lad-cap${pay>cap?' over':''}" role="meter" aria-valuemin="0" aria-valuemax="${cap}" aria-valuenow="${pay}" aria-label="연봉 합"><span>연봉 합 <b>${money(pay)}</b> / 한도 ${money(cap)}</span><i style="width:${capPct}%"></i><em>${pay>cap?`${money(pay-cap)} 넘음`:`${money(cap-pay)} 남음`}</em></div></header>
    <div class="lad-body">${poolPanel}${clubPanel}${sidePanel}</div></main>`; }
