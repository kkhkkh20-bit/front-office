/* ===== 스카우트 > 관찰 명단 (스카우트 1단계: '타구단 관심 선수' 탭을 합침) =====
   한 표에 저학년·드래프트 후보·외국인 후보·해외파·KBO 타구단 선수. 줄마다 우선순위(집중·보통·참고)를 바로 누른다.
   오른쪽은 고른 선수 리포트: 기록 대 평가, 학년 흐름, 대회별 기록, 방문 보고(날짜·스카우트·본 것). PC는 칸 안에서만 스크롤한다 */
const OBS_F=[['all','전체'],['am','저학년'],['dr','드래프트 후보'],['fo','외국인'],['ov','해외파'],['kbo','KBO']];
const obsConf=sd=>sd==null||sd>=8?'낮음':sd>=5?'보통':'높음';
/* 저학년 선수를 화면용 얼굴 객체로(같은 번호라 졸업 학년 뒤에도 같은 얼굴) */
const amFaceObj=e=>({id:e.id,name:e.n,prospect:true,team:null,isP:!!e.P,college:!!e.c,age:(e.c?18:15)+amGrade(e,G.year)});
function obsRowsAll(){ const out=[], F=obsFollowSet(G.user), U=amPipe().L;
  for(const id of F){ if(typeof id!=='number')continue; const e=U[id]; if(e){ const est=amEstU(e,G.user), T=amTier(est); out.push({k:'am',id,av:amFaceObj(e),n:e.n,sub:`${e.s} ${e.c?'대':'고'}${amGrade(e,G.year)} · ${e.P?'투수':POSK[e.pos]||e.pos}`,pri:obsPri(id),obs:obsCount(e),last:obsLast(e),conf:obsConf(est.sd),ev:T.t,x:e,vm:amVmTxt(e)}); continue; }
    const p=G.players[id]; if(p&&p.prospect&&p.team==null){ const rp=scoutReport(p); out.push({k:'dr',id,av:p,n:p.name,sub:`${p.school||''} ${p.college?'대4':'고3'} · ${posLabel(p)}`,pri:obsPri(id),obs:obsCount(p),last:obsLast(p),conf:rp.ofp==null?'낮음':obsConf(rp.sd),ev:rp.ofp!=null?potTier(potVal(rp),rp.cur).s:'잠재력 ?',x:p,vm:p.isP?amVmTxt(p):''}); } }
  for(const w of G.fwatch||[]){ const p=G.players[w.id]; if(!p)continue; const rp=scoutReport(p); let f=null; try{ f=fScout(p,rp); }catch(e){} out.push({k:'fo',id:p.id,av:p,n:p.name,sub:`${p.nat||''} · ${posLabel(p)} · ${p.age}세`,pri:-1,obs:null,know:w.k,dk:w.dk||0,eta:fwatchEta(w),conf:f?fRel(f):'-',ev:rp.role||'-',x:p,w}); }
  for(const a of (G.abroad||[]).filter(a=>!a.back&&!a.foreign&&a.end==null)){ const end=(a.y1||a.y)+(a.yrs||1)-1; out.push({k:'ov',id:a.id,av:G.players[a.id]||{id:a.id,name:a.name},n:a.name,sub:`${a.lg} ${a.club||''} · ${a.pos||''}`,pri:-1,obs:null,conf:'-',ev:a.from===G.user?'우리 구단 출신':a.from!=null?tshort(a.from)+' 출신':'국내 출신',ret:`${end}시즌 뒤 계약 만료`,a}); }
  for(const id of G.pwatch||[]){ const p=G.players[id]; if(!p||p.team===G.user||p.team==null)continue; const rp=scoutReport(p); out.push({k:'kbo',id,av:p,n:p.name,sub:`${tshort(p.team)} · ${posLabel(p)} · ${p.age}세`,pri:-1,obs:null,conf:rp.unseen?'낮음':obsConf(rp.sd),ev:rp.role||(rp.cur!=null?`현재 ${dv(rp.cur)}`:'-'),x:p}); }
  return out; }
const obsDay=d=>d==null?'-':(G.day-d<=0?'오늘':G.day-d<7?`${G.day-d}일 전`:dmd(d));
/* 명단 줄의 능력·잠재력(카페 11-18): 선수 화면 맨 위 '현재'·'잠재력'과 같은 값만 보인다(스카우트 평가가 없으면 '-', 외국인 후보는 종합 추정). 저학년·해외파는 선수 화면이 없어 '-' */
function obsRate(x){ const p=x.k==='am'||x.k==='ov'?null:x.x; if(!p||p.fdPool)return {cur:'<span class="muted">-</span>',pot:'<span class="muted">-</span>'};
  const rp=scoutReport(p); let c=rp.cur; if(p.foreign&&p.team==null){ try{ const f=fScout(p,rp); if(f&&f.raw!=null)c=f.raw; }catch(e){} }
  return {cur:c==null?'<span class="muted">-</span>':rchip(c),pot:rp.ofp==null?'<span class="muted">-</span>':potChip(rp,p)}; }
/* 관심 해제(카페 11-18): 담긴 곳(관심 목록·드래프트 보드·외국인 관찰·KBO 관심)에서 뺀다. 해외파는 자동으로 보이는 목록이라 뺄 수 없다 */
const obsDropBtn=(x,short)=>x.k==='ov'?'':`<button class="btn small obs-drop" data-a="obsDrop" data-v="${x.k}:${x.id}" title="관찰 명단에서 뺍니다"${short?' aria-label="관심 해제"':''}>${short?'해제':'관심 해제'}</button>`;
function obsPriBtns(x){ if(x.pri<0)return ''; return `<span class="chips obs-pri" role="group" aria-label="관찰 우선순위">${[2,1,0].map(v=>`<button data-a="obsPri" data-v="${x.id}:${v}" class="${x.pri===v?'on':''}${v===2?' f':''}">${OBS_PRI_L[v]}</button>`).join('')}</span>`; }
/* 기록 대 평가: 같은 학력·투타(저학년은 같은 학년) 안 백분위 */
function obsRecVsEval(x){ try{ const has=(isP,h)=>!!h&&(isP?(h.outs||0)>0:(h.pa||h.ab||0)>0); if(x.k==='dr'){ const p=x.x; if(!has(p.isP,amAmW(p))||!Number.isFinite(amRaw(p)))return '공식 기록이 없어 기록과 평가를 비교하지 않습니다.'; const L=draftPool().filter(q=>!!q.isP===!!p.isP&&!!q.college===!!p.college&&has(q.isP,amAmW(q))&&Number.isFinite(amRaw(q))); if(L.length<8)return '같은 분류의 공식 기록 표본이 부족합니다.';
      const pct=(arr,v)=>Math.max(1,Math.round(arr.filter(a=>a>v).length/arr.length*100)); const rs=L.map(amScore), ev=L.map(q=>draftVal(scoutReport(q),q));
      const a=pct(rs,amScore(p)), b=pct(ev,draftVal(scoutReport(p),p)); return `기록 상위 ${a}% · 우리 평가 상위 ${b}%${Math.abs(a-b)>=20?` → ${a<b?'기록이 평가보다 좋습니다':'평가가 기록보다 좋습니다'}`:' → 기록과 평가가 비슷합니다'}`; }
    if(x.k==='am'){ const e=x.x, gk=(e.c?'c':'h')+amGrade(e,G.year), yy=amRecYear(), all=amProspectRows(gk).filter(r=>r.isP===!!e.P&&r.kind==='e'), own=all.find(r=>r.id===e.id); if(!own||!has(own.isP,own.h)||!Number.isFinite(amRecScore(own.isP,own.h)))return '공식 기록이 없어 기록과 평가를 비교하지 않습니다.'; const L=all.filter(r=>has(r.isP,r.h)&&Number.isFinite(amRecScore(r.isP,r.h))); if(L.length<8)return '같은 분류의 공식 기록 표본이 부족합니다.';
      const pct=(arr,v)=>Math.max(1,Math.round(arr.filter(a=>a>v).length/arr.length*100)); const me=L.find(r=>r.id===e.id); if(!me)return ''; const rs=L.map(r=>amRecScore(r.isP,r.h)), ev=L.map(r=>amEstU(r.e,G.user).v);
      return `${yy} 기록 상위 ${pct(rs,amRecScore(me.isP,me.h))}% · 우리 평가 상위 ${pct(ev,amEstU(e,G.user).v)}% (같은 학년 ${e.P?'투수':'야수'})`; } }catch(e){} return ''; }
function obsDetail(x){ if(!x)return `<section class="card obs-det"><p class="small muted">왼쪽에서 선수를 고르면 리포트가 여기에 나옵니다.</p></section>`;
  const go=x.k==='am'?`<button class="btn small" data-a="amP" data-v="${x.id}">선수 기록</button>`:x.k==='ov'?'':`<button class="btn small" data-a="player" data-v="${x.id}">선수 화면</button>`;
  const head=`<div class="obs-dh">${avImg(x.av,true)}<div><h3 class="sec">${esc(x.n)}</h3><p class="small">${esc(x.sub)}</p>${x.vm?`<p class="small"><b>${esc(x.vm)}</b></p>`:''}<div class="row">${obsPriBtns(x)}${go}${obsDropBtn(x)}</div></div></div>`;
  const L=[];
  if(x.k==='am'||x.k==='dr'){ const rv=obsRecVsEval(x); if(rv)L.push(`<p class="small"><b>기록 대 평가</b> ${esc(rv)}</p>`);
    L.push(`<p class="small"><b>학년 흐름</b> ${amTrendHtml(x.x,!!(x.k==='am'?x.x.P:x.x.isP),!!(x.k==='am'?x.x.c:x.x.college))}${x.k==='dr'?amSlTag(x.x):''}</p>`);
    const yy=amRecYear(), sp=amSplitLines(x.x,yy).concat(yy===G.year?[]:[]); if(sp.length)L.push(`<div class="small"><b>${yy} 대회별 기록</b>${sp.map(s=>`<div class="obs-sp"><span>${esc(s.n)}</span><span>${esc(s.t)}</span></div>`).join('')}</div>`);
    { const op=obsOpinions(x.x); if(op)L.push(`<p class="small"><b>두 의견</b> ${op.map(z=>`${esc(z.s.name)} 스카우트 ${esc(z.t)}`).join(' · ')}</p>`); }
    L.push(`<p class="small"><b>평가</b> ${esc(x.ev)} · 신뢰도 ${esc(x.conf)} · 관찰 ${x.obs}회${x.last!=null?` · 마지막 ${obsDay(x.last)}`:''}</p>`);
    const lg=obsLogList(x).slice().reverse(); L.push(`<div class="obs-log"><b class="small">방문 보고</b>${lg.length?lg.map(r=>`<p class="small"><span class="muted">${dmd(r[0])} · ${esc(r[1])}</span> ${esc(r[2])}</p>`).join(''):'<p class="small muted">아직 방문 보고가 없습니다. 집중으로 두면 담당 스카우트가 그 학교를 먼저 찾습니다.</p>'}</div>`); }
  else if(x.k==='fo'){ let f=null; try{ f=fScout(x.x); }catch(e){} const rp=scoutReport(x.x);
    L.push(`<p class="small"><b>기록</b> ${esc(f&&f.rec||'지난 리그 기록 없음')}</p><p class="small"><b>스카우트 추정</b> ${esc(rp.role||'-')}${f&&f.mid!=null?` · 예상 ${esc(String(f.mid))}`:''} · 신뢰도 ${esc(x.conf)}</p>`);
    L.push(`<p class="small"><b>파악도</b> ${x.know}%${x.dk?` · 이번 주 +${x.dk}%`:''}${x.eta?` · 파악 완료까지 약 ${x.eta}주`:x.know>=100?' · 파악 완료':''}</p>`);
    const un=f?fUnknown(x.x,f):[]; if(un.length)L.push(`<p class="small"><b>아직 모르는 것</b> ${esc(un.join(' · '))}</p>`); }
  else if(x.k==='ov'){ const a=x.a; L.push(`<p class="small">${esc(a.how||'')} · ${a.y}년 출국 · ${esc(x.ret)}</p><p class="small muted">${a.from===G.user?'계약이 끝나 돌아오면 우리 구단이 먼저 협상합니다.':'국내로 돌아오면 원소속 구단이 먼저 협상합니다.'}</p>`); }
  else { const rp=scoutReport(x.x); L.push(`<p class="small"><b>스카우트</b> ${esc(rp.who||'')}</p><p class="small">${esc((rp.notes||[]).slice(0,2).join(' '))}</p><p class="small">평가 ${esc(x.ev)} · 신뢰도 ${esc(x.conf)}</p><p class="small obs-pot"><b>잠재력</b> ${potChip(rp,x.x)}</p>`); } /* 관찰 명단 합치기(11-16)에서 빠졌던 KBO 관심 선수 잠재력(스카우트 추정, 다른 목록과 같은 potChip)을 되살림 */
  return `<section class="card obs-det">${head}${L.join('')}</section>`; }
function obsWatchPage(){ if(G.unemp)return '<section class="card"><p class="small muted">구단을 맡고 있지 않습니다.</p></section>';
  const all=obsRowsAll(), f=UI.obsF||'all'; const L=all.filter(x=>f==='zero'?(x.k==='am'||x.k==='dr')&&!x.obs:f==='all'||x.k===f).sort((a,b)=>(b.pri-a.pri)||((b.obs??-1)-(a.obs??-1))||a.n.localeCompare(b.n));
  const cap=obsCap(G.user), fN=obsFocusN(G.user); const amL=all.filter(x=>x.k==='am'||x.k==='dr'); const zero=amL.filter(x=>!x.obs), low=amL.filter(x=>x.conf==='낮음');
  const sel=L.find(x=>String(x.id)===String(UI.obsSel))||L[0]||null;
  const cnt=k=>all.filter(x=>k==='all'||x.k===k).length;
  const kl={am:'저학년',dr:'후보',fo:'외국인',ov:'해외파',kbo:'KBO'}; const RC=new Map(), R=x=>{ if(!RC.has(x))RC.set(x,obsRate(x)); return RC.get(x); };
  const row=x=>`<tr class="${sel&&sel.id===x.id?'on':''}"><td><button class="candidate-name" data-a="obsSel" data-v="${x.id}">${avImg(x.av)}<span>${esc(x.n)}<small>${esc(x.sub)}</small></span></button></td><td><span class="pill">${kl[x.k]}</span></td><td class="obs-cur">${R(x).cur}</td><td class="obs-pot">${R(x).pot}</td><td>${x.pri>=0?obsPriBtns(x):x.k==='fo'?`<span class="small">파악 ${x.know}%${x.dk?` <i class="good">+${x.dk}</i>`:''}</span>`:x.k==='ov'?`<span class="small">${esc(x.ret)}</span>`:'<span class="small muted">-</span>'}</td><td class="num">${x.obs==null?'-':x.obs?`${x.obs}회`:'<b class="bad">0회</b>'}</td><td class="small">${x.last!=null?obsDay(x.last):'-'}</td><td class="small ${x.conf==='낮음'?'warn':''}">${esc(x.conf)}</td><td class="small">${esc(x.ev)}</td><td>${obsDropBtn(x,true)}</td></tr>`;
  const warn=zero.length||low.length?`<p class="note warn small obs-warn" role="status">관찰 0회 ${zero.length}명 · 신뢰도 낮음 ${low.length}명${zero.length?` <button class="btn small" data-a="obsF" data-v="zero">0회만 보기</button>`:''}</p>`:'';
  const rows=L, pick=obsFocusPending(G.user), focusWarn=pick?`<p class="note warn small obs-warn" role="status">아마추어 담당이 줄어 기존 집중 ${pick.ids.length}명은 보통으로 관찰합니다. 계속 집중할 선수를 최대 ${cap}명 다시 골라 주세요. <button class="btn small" data-a="obsFocusDone">선택 마침</button></p>`:'';
  const sp=schSponSum(G.user);
  const rowM=x=>`<div class="obs-m${sel&&sel.id===x.id?' on':''}"><button class="candidate-name" data-a="obsSel" data-v="${x.id}">${avImg(x.av)}<span>${esc(x.n)}<small>${esc(x.sub)} · ${kl[x.k]}</small></span></button><span class="small obs-mr">${R(x).cur}${R(x).pot} ${x.obs==null?'':x.obs?`관찰 ${x.obs}회 · `:'<b class="bad">관찰 0회</b> · '}${esc(x.ev)} · 신뢰도 ${esc(x.conf)}</span><div class="obs-mact">${x.pri>=0?obsPriBtns(x):x.k==='fo'?`<span class="small">파악 ${x.know}%${x.dk?` (+${x.dk})`:''}</span>`:x.k==='ov'?`<span class="small">${esc(x.ret)}</span>`:''}${obsDropBtn(x)}</div></div>`;
  const left=`<section class="card obs-list"><div class="row between wrapr"><h2 class="sec">관찰 명단 ${all.length}</h2><span class="small">집중 <b class="${fN>=cap?'warn':''}">${fN}/${cap}</b> <span class="muted">(아마추어 담당 ${obsScN(G.user)}명 × ${OBS_CAP_K})</span> · 연고 후원 ${sp.home}/${sp.homeAll}곳</span></div>
    <div class="chips">${OBS_F.map(([k,l])=>`<button data-a="obsF" data-v="${k}" class="${f===k?'on':''}">${l} ${cnt(k)}</button>`).join('')}</div>${focusWarn}${warn}
    ${!wide()?`<div class="obs-mlist">${rows.map(rowM).join('')||'<p class="small muted">명단이 비었습니다.</p>'}</div>`:''}<div class="tw obs-scroll${wide()?'':' hide'}"><table class="sqt candidate-table obs-tbl"><thead><tr><th>선수</th><th>구분</th><th>능력</th><th>잠재력</th><th>우선순위</th><th class="num">관찰</th><th>마지막</th><th>신뢰도</th><th>평가</th><th title="관심 해제">행동</th></tr></thead><tbody>${rows.map(row).join('')||`<tr><td colspan="10" class="small muted">명단이 비었습니다. 아마추어 야구 › 선수에서 ☆, 드래프트 후보 ☆, 외국인 시장 '관찰', 선수 화면 '관심 선수'로 담습니다.</td></tr>`}</tbody></table></div>
    <p class="small muted">집중은 담당 스카우트가 그 학교를 먼저 찾고 경기도 더 챙겨 봅니다. 관찰이 쌓일수록 평가 범위가 좁아집니다. 다른 구단도 같은 상한으로 봅니다.</p></section>`;
  return `<div class="obsw">${left}${obsDetail(sel)}</div>`; }
Object.assign(A,{ obsF(v){ UI.obsF=v; UI.obsSel=null; render(); }, obsSel(v){ UI.obsSel=v; render(); },
  obsFocusDone(){ obsFocusFix(G.user); if(G.obsFocusPick)delete G.obsFocusPick[G.user]; save(); render(); },
  obsDrop(v){ const i=String(v).indexOf(':'), k=String(v).slice(0,i), id=+String(v).slice(i+1); if(!Number.isFinite(id))return;
    if(k==='am'||k==='dr')amFollow(id,false);
    else if(k==='fo'){ if(fwatchOn(id))fwatchToggle(id); }
    else if(k==='kbo'){ if((G.pwatch||[]).includes(id))pwatchToggle(id); }
    if(String(UI.obsSel)===String(id))UI.obsSel=null; toast('관찰 명단에서 뺐습니다.'); save(); render(); },
  obsPri(v){ const [id,p]=String(v).split(':'); const e=obsSetPri(+id,+p); if(e)toast(e); save(); render(); } });
