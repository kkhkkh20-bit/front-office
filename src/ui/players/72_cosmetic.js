/* ===== 이름·얼굴 바꾸기 화면(구단주 결정 11-17: 선수 에디터는 없고, 이름·얼굴은 바꿀 수 있게 + 대량 수정) =====
 - 선수 한 명: 선수 화면 '고치기'(이름 옆)·⋯ 메뉴 '이름·얼굴 바꾸기'·사진 연필(사진 바꾸기 창)에서 이름·등번호·얼굴 템플릿 사진·직접 넣은 사진
 - 여러 명: 설정 › 게임 설정 › 표시 '이름·얼굴 일괄 수정' 창. 구단·드래프트 대상·소속 없음·은퇴 선수 묶음, 표 안에서 이름 고치기, 얼굴 고르기, CSV/텍스트 내보내기·가져오기(미리보기 뒤 적용)
 - 얼굴 번호: 그 선수가 지금 쓰는 사진 묶음의 번호. 구단 소속 = FACE6 칸(국내·외국인·아시아쿼터 묶음은 face6Pool이 가른다, 구단 유니폼), 소속 없는 외국인 = FACE17 훈련복 칸,
   드래프트 대상(아마추어) = FACE21 칸(그 사진 묶음이 들어왔을 때만). 소속 없는 국내 선수·은퇴 선수는 템플릿 사진이 없다(직접 넣은 사진은 가능, 은퇴 선수는 이름만)
 - 배정은 얼굴 코드(77_assets_ui.js)의 저장 칸을 그대로 쓴다: G.f6(선수→칸)·G.f6r('구단:칸'→선수) · G.f17 · G.fam. 같은 구단에서 그 얼굴을 쓰던 선수는 다음 그리기에서 face6Idx가 다른 얼굴을 준다(20시즌 쉬는 얼굴 G.f6cd 규칙 그대로). 작은 그림은 faceCut(얼굴 주소)
 - 직접 넣은 사진(G.cimg 'p:id')은 이 기기 저장에만 있다. 대회 엔트리는 템플릿 얼굴(face6Src)만, 래더 덱은 사진 없이 올라가므로 서버로 가지 않는다
 - 능력·잠재력·나이·계약을 고치는 길은 없다 */
const COSM_PG=40, COSM_FACE_N=36;
/* 그 선수가 고를 수 있는 템플릿 사진 묶음: {k:'6'|'17'|'21', tid, L:[번호]} 또는 null */
function cosmFace(p){ if(!p||p.persona||p.id==null||!G||G.f6off||!G.players[p.id]||typeof FACE6==='undefined'||typeof face6Pool!=='function')return null;
  if(p.team!=null){ if(!FACE6.sheet||typeof f6T!=='function'||f6T(p.team)==null)return null; const res=new Set(); for(const k in G.f6s||{}){ const [t,i]=k.split(':'); if(G.f6s[k]&&t===String(p.team))res.add(+i); } /* 선수 출신 지도자가 쓰는 얼굴은 뺀다 */
    return {k:'6',tid:f6T(p.team),L:face6Pool(p).filter(i=>!res.has(i))}; }
  if(p.foreign){ if(typeof FACE17==='undefined'||!FACE17.ids)return null; const q=p.foreign==='아시아'?1:0; return {k:'17',L:FACE17.ids.map((x,i)=>i).filter(i=>FACE17.ids[i].q===q)}; }
  if(typeof FACE21!=='undefined'&&FACE21.ids&&FACE21.ids.length&&typeof amFaceOn==='function'&&amFaceOn(p))return {k:'21',L:FACE21.ids.map((x,i)=>i)};
  return null; }
const cosmIds=F=>F.k==='6'?FACE6.ids:F.k==='17'?FACE17.ids:FACE21.ids;
/* 지금 쓰는 얼굴 번호(그 묶음 기준). 아마추어 시절 사진·소속 없을 때 사진을 이어 쓰는 중이면 null */
function cosmFaceCur(p){ const F=cosmFace(p); if(!F)return null; try{
  if(F.k==='6'){ if(typeof FACE21!=='undefined'&&G.fam&&G.fam[p.id])return null; if(p.foreign&&G.f17&&G.f17[p.id]!=null)return null; return face6Idx(p); }
  if(F.k==='17')return face17Idx(p); const a=amIdx(p); return a?a.c:null; }catch(e){ return null; } }
function cosmFaceErr(p,n){ const F=cosmFace(p); if(!F)return '이 선수는 고를 수 있는 템플릿 사진이 없습니다(직접 사진은 넣을 수 있음).'; n=+n; if(!Number.isInteger(n)||!F.L.includes(n))return `얼굴 번호 ${n}은(는) 이 선수에게 쓸 수 없습니다(이 선수 묶음 ${F.L.length}장: ${F.L[0]}~${F.L[F.L.length-1]} 중).`; return ''; }
/* 얼굴 번호 정하기(검사는 cosmFaceErr) */
function cosmSetFace(p,n){ const F=cosmFace(p); if(!F||cosmFaceErr(p,n))return false; n=+n;
  if(F.k==='6'){ G.f6=G.f6||{}; G.f6r=G.f6r||{}; const t=p.team, k=t+':'+n, prev=G.f6r[k]; if(prev!=null&&prev!==p.id)delete G.f6[prev]; /* 같은 구단에서 이 얼굴을 쓰던 선수는 다른 얼굴을 받는다 */
    const cur=G.f6[p.id]; if(cur!=null&&G.f6r[t+':'+cur]===p.id)delete G.f6r[t+':'+cur]; G.f6[p.id]=n; G.f6r[k]=p.id; if(G.f6cd)delete G.f6cd[k]; /* 사용자가 고르면 쉬는 중인 얼굴도 쓴다(배정과 같이 그 칸의 쉬는 기록을 지움). 밀려난 선수는 face6Idx가 쉬는 기간 규칙대로 새 얼굴을 고른다 */ if(G.fam)delete G.fam[p.id]; if(G.f17)delete G.f17[p.id]; }
  else if(F.k==='17')(G.f17=G.f17||{})[p.id]=n;
  else (G.fam=G.fam||{})[p.id]={k:'21',c:n};
  return true; }
const COSM_F={cur:cosmFaceCur,err:cosmFaceErr,set:cosmSetFace};
/* 템플릿 사진 작은 그림(번호로). 못 그리면 null(번호만 보인다) */
function cosmThumb(F,n,p){ if(typeof faceCut!=='function')return null; try{ if(F.k==='6')return faceCut({s:'p',t:F.tid,c:n}); if(F.k==='17')return faceCut({s:'f17',c:n}); const vk=p&&typeof amVar==='function'?amVar(p):null; return vk?faceCut({s:'am',t:vk,c:n}):null; }catch(e){ return null; } } /* 얼굴 주소 → 77_assets_ui.js faceCut(같은 자르기·캐시) */
function cosmOwn(p){ return !!(G.cimg&&G.cimg['p:'+p.id]); }
/* 얼굴 고르기 칸(선수 화면 고치기 상자·사진 바꾸기 창·일괄 창 공용) */
function cosmFacePick(p,o){ o=o||{}; const F=cosmFace(p), own=cosmOwn(p), k='p:'+p.id;
  const up=o.noUp?'':`<div class="row cosm-up"><button type="button" class="btn small" data-a="phMenu" data-v="${k}">직접 사진 넣기</button>${own?`<button type="button" class="btn small" data-a="cimgDel" data-v="${k}">직접 넣은 사진 지우기</button>`:''}</div>`;
  if(!F)return `<div class="cosm-face"><p class="small muted">${p.team==null&&!p.prospect&&!p.foreign?'소속 구단이 없는 국내 선수는 템플릿 사진이 없습니다.':'이 선수가 고를 수 있는 템플릿 사진이 아직 없습니다.'}${own?' 지금은 직접 넣은 사진을 씁니다.':''}</p>${up}</div>`;
  const ids=cosmIds(F), cur=cosmFaceCur(p), age=p.age||25, more=(UI.cosmMore||{})[p.id]||COSM_FACE_N;
  const L=F.L.slice().sort((a,b)=>(a===cur?-1:b===cur?1:0)||Math.abs((ids[a].a||age)-age)-Math.abs((ids[b].a||age)-age)||a-b), show=L.slice(0,more);
  const tiles=show.map(i=>{ const src=cosmThumb(F,i,p); return `<button type="button" class="pe-face${i===cur?' on':''}" data-a="cosmFace" data-v="${p.id}:${i}" title="얼굴 ${i}번 · 사진 나이 ${ids[i].a??'-'}세" aria-label="얼굴 ${i}번"${i===cur?' aria-pressed="true"':''}>${src&&src!==F6WAIT?`<img src="${src}" alt="" loading="lazy">`:`<span class="av ini">${i}</span>`}<i>${i}</i></button>`; }).join('');
  return `<div class="cosm-face"><p class="small"><b>얼굴 템플릿</b> <span class="muted">${L.length}장 · 나이 가까운 순 · 지금 ${cur!=null?cur+'번':'아마추어·이전 사진'}${own?' · <b>직접 넣은 사진 사용 중</b>(템플릿을 고르면 지웁니다)':''}</span></p><div class="pe-faces">${tiles}</div>${L.length>show.length?`<button type="button" class="btn small" data-a="cosmMore" data-v="${p.id}">사진 더 보기 (${L.length-show.length}장 남음)</button>`:''}${up}${F.k==='6'?'<p class="small muted">같은 구단에서 그 얼굴을 쓰던 선수는 다른 얼굴로 바뀝니다.</p>':''}</div>`; }
/* 선수 화면의 고치기 상자: 이름·등번호·얼굴(능력·나이·계약은 바꾸지 않음) */
/* 고치기 상자 입력 중인 값(저장 전): 얼굴 고르기·오류 표시 등으로 다시 그려도 입력이 남게(외부 검수 11-17). 상자의 모든 입력칸(id)을 그대로 옮긴다 */
function pEditGrab(){ if(typeof document==='undefined')return; const b=document.querySelector('.pe-box[data-pid]'); if(!b||UI.pEdit==null||+b.dataset.pid!==UI.pEdit)return; const v={}; b.querySelectorAll('input[id],select[id],textarea[id]').forEach(i=>{ v[i.id]=i.value; }); UI.pEditD={id:UI.pEdit,v}; }
function pEditBox(p){ const e=UI.pEditErr, arch=!G.players[p.id]; pEditGrab(); const D=UI.pEditD&&UI.pEditD.id===p.id?UI.pEditD.v:{};
  return `<div class="pe-box cosm-box" data-pid="${p.id}"><label>이름<input id="pe-nm" maxlength="${COSM_NAME_MAX}" value="${esc(D['pe-nm']??p.name)}" autocomplete="off"></label>${!arch&&p.team!=null?`<label>등번호<input id="pe-no" inputmode="numeric" maxlength="2" value="${esc(D['pe-no']??String(jno(p)))}" autocomplete="off"></label>`:''}<div class="row"><button class="btn small primary" data-a="pEditSave" data-v="${p.id}">저장</button><button class="btn small" data-a="pEditOpen" data-v="">닫기</button></div>${e?`<p class="small bad">${esc(e)}</p>`:''}
    ${arch?'':cosmFacePick(p)}${p.renamed&&p.renamed.length?`<p class="small muted">이전 이름: ${p.renamed.map(r=>esc(r.from)).join(', ')}</p>`:''}<p class="small muted">이름은 ${COSM_NAME_MAX}자까지. 기록·명단은 새 이름으로 보이고, 이미 나온 기사·소식 문장은 그대로 남습니다. 능력·나이·계약은 바꿀 수 없습니다. 여러 명은 설정 › 게임 설정 › 표시 › 이름·얼굴 일괄 수정에서 바꿉니다.</p></div>`; }
/* 사진 바꾸기 창(연필)에 넣는 템플릿 칸: 선수 키(p:id)일 때만 */
function cosmPhTpl(k){ const m=/^p:(\d+)$/.exec(String(k||'')); const p=m&&G&&G.players[+m[1]]; if(!p)return ''; const F=cosmFace(p); if(!F)return ''; return `<details class="pe-sec" open><summary>템플릿 사진 고르기</summary>${cosmFacePick(p,{noUp:true})}</details>`; }

/* ----- 일괄 창 ----- */
/* 구단 묶음은 리그 모든 구단(독립구단 고양 스톰·확장·이름 바꾼 구단 포함). 예전에는 독립구단(indie)을 빼 고양 스톰 선수를 고를 수 없었다(검수 11-17 #211) */
function cosmScopes(){ return [...G.teams.map(t=>['t:'+t.id,tshort(t.id)]),['pro','드래프트 대상'],['fa','소속 없음'],['arch','은퇴'],['all','전체']]; }
function cosmTeamTxt(p,arch){ return arch?'은퇴':p.prospect?'드래프트 대상':p.team!=null?tshort(p.team):p.foreign?'외국인 후보':'소속 없음'; }
function cosmList(sc,q){ const P=Object.values(G.players).filter(p=>!p.persona); let L;
  if(sc==='arch')L=Object.values(G.arch||{}).filter(a=>a&&a.id!=null&&!G.players[a.id]);
  else if(sc==='pro')L=P.filter(p=>p.prospect); else if(sc==='fa')L=P.filter(p=>p.team==null&&!p.prospect); else if(sc==='all')L=P;
  else { const tid=+String(sc).slice(2); L=P.filter(p=>p.team===tid); }
  const grp=p=>p.isP?0:p.pos==='C'?1:['1B','2B','3B','SS'].includes(p.pos)?2:3;
  L.sort((a,b)=>sc==='all'||sc==='arch'?String(a.name).localeCompare(String(b.name),'ko'):grp(a)-grp(b)||String(a.name).localeCompare(String(b.name),'ko'));
  const s=String(q||'').trim(); return s?L.filter(p=>String(p.name).includes(s)||String(p.id)===s):L; }
function cosmRowsCsv(L){ return cosmCsv(L.map(p=>{ const arch=!G.players[p.id]; return {id:p.id,team:cosmTeamTxt(p,arch),name:p.name,face:arch?'':cosmFaceCur(p)??''}; })); }
function cosmSt(){ return UI.cosm=UI.cosm||{sc:'t:'+(G.user??(G.teams[0]||{}).id),q:'',pg:0,d:{}}; }
function cosmSheet(){ const S=cosmSt(), L=cosmList(S.sc,S.q), np=Math.max(1,Math.ceil(L.length/COSM_PG)); S.pg=Math.min(S.pg,np-1); const pageL=L.slice(S.pg*COSM_PG,(S.pg+1)*COSM_PG);
  const nCh=Object.keys(S.d).filter(id=>{ const t=cosmTarget(+id); return t&&cosmNameClean(S.d[id])!==t.o.name; }).length;
  const fp=S.face!=null&&G.players[S.face]?G.players[S.face]:null;
  const sel=`<label class="cosm-sel">묶음 <select data-cosm="sc">${cosmScopes().map(([v,l])=>`<option value="${v}"${S.sc===v?' selected':''}>${esc(l)}</option>`).join('')}</select></label><label class="cosm-q">찾기 <input data-cosm="q" value="${esc(S.q)}" placeholder="이름 또는 id" autocomplete="off"></label><span class="small muted">${L.length}명</span>`;
  const row=p=>{ const arch=!G.players[p.id], v=S.d[p.id]!=null?S.d[p.id]:p.name, ch=cosmNameClean(v)!==p.name, F=arch?null:cosmFace(p), fc=arch?null:cosmFaceCur(p);
    const av=arch?'<span class="av ini">-</span>':avImg(p);
    return `<tr class="${ch?'ch':''}${fp&&fp.id===p.id?' on':''}"><td class="cosm-av">${arch?av:`<button type="button" class="cosm-avb" data-a="cosmPick" data-v="${p.id}" title="얼굴 고르기">${av}</button>`}</td><td><input class="cosm-nm" data-id="${p.id}" maxlength="${COSM_NAME_MAX}" value="${esc(v)}" aria-label="${esc(p.name)} 새 이름" autocomplete="off">${ch?`<span class="small muted cosm-was">지금 ${esc(p.name)}</span>`:''}</td><td class="small">${esc(cosmTeamTxt(p,arch))}${!arch&&p.team!=null?` · ${jno(p)}번`:''}<br><span class="muted">${esc(arch?(p.isP?'투수':POSK[p.pos]||p.pos||''):posLabel(p))}${p.age?` · ${p.age}세`:''}</span></td><td class="num small">${arch?'-':cosmOwn(p)?'직접 사진':fc!=null?fc+'번':F?'-':'없음'}</td><td class="num small muted">${p.id}</td></tr>`; };
  const pick=fp?`<div class="cosm-pick"><div class="row between"><b>${esc(fp.name)} 얼굴 고르기</b><button type="button" class="btn small" data-a="cosmPick" data-v="">닫기</button></div>${cosmFacePick(fp)}</div>`:'';
  const io=S.io?cosmIoHtml(S,L):'';
  return `<div class="scrim" data-a="cosmClose"><div class="sheet gut cosm-sheet" data-stop="1" role="dialog" aria-label="이름·얼굴 일괄 수정"><div class="sheet-head"><div><div class="eyebrow">설정 · 표시</div><h2 class="sec">이름·얼굴 일괄 수정</h2></div><button class="x" data-a="cosmClose" aria-label="닫기">×</button></div>
    <p class="small muted">이름과 얼굴 사진만 바꿉니다. 능력·나이·계약은 그대로이고, 래더·대회 덱에도 바꾼 이름이 실립니다. 직접 넣은 사진은 이 기기 저장에만 남고 서버로 보내지 않습니다.</p>
    <div class="row cosm-bar">${sel}<span class="cosm-sp"></span><button type="button" class="btn small${S.io?' primary':''}" data-a="cosmIo">내보내기·가져오기</button></div>
    ${S.msg?`<p class="small ${S.msgBad?'bad':'good'}" role="status" style="white-space:pre-line">${esc(S.msg)}</p>`:''}${io}${pick}
    <div class="tw cosm-tw"><table class="sqt cosm-t"><thead><tr><th>얼굴</th><th>이름</th><th>소속</th><th class="num">얼굴 번호</th><th class="num">id</th></tr></thead><tbody>${pageL.map(row).join('')||'<tr><td colspan="5" class="small muted">선수가 없습니다.</td></tr>'}</tbody></table></div>
    <div class="row cosm-foot">${np>1?`<button type="button" class="btn small" data-a="cosmPg" data-v="${S.pg-1}"${S.pg<=0?' disabled':''}>이전</button><span class="small">${S.pg+1} / ${np}</span><button type="button" class="btn small" data-a="cosmPg" data-v="${S.pg+1}"${S.pg>=np-1?' disabled':''}>다음</button>`:''}<span class="cosm-sp"></span><button type="button" class="btn small" data-a="cosmClose">닫기</button><button type="button" class="btn small primary" data-a="cosmSave"${nCh?'':' disabled'}>바꾼 이름 ${nCh}명 저장</button></div></div></div>`; }
function cosmIoHtml(S,L){ const pv=S.pv;
  const pvH=pv?`<div class="cosm-pv"><p class="small"><b>미리보기</b> · 바뀜 ${pv.chg.length}명 · 그대로 ${pv.same}줄 · 문제 ${pv.bad.length}줄</p>${pv.chg.length?`<div class="tw"><table class="sqt cosm-pvt"><thead><tr><th class="num">줄</th><th class="num">id</th><th>이름</th><th class="num">얼굴</th></tr></thead><tbody>${pv.chg.slice(0,200).map(x=>`<tr><td class="num">${x.line}</td><td class="num">${x.id}</td><td>${x.to!==x.from?`${esc(x.from)} → <b>${esc(x.to)}</b>`:esc(x.from)}</td><td class="num">${x.faceTo!=null?`${x.faceFrom??'-'} → <b>${x.faceTo}</b>`:'-'}</td></tr>`).join('')}</tbody></table></div>${pv.chg.length>200?`<p class="small muted">… 외 ${pv.chg.length-200}명</p>`:''}`:''}${pv.bad.length?`<details class="cosm-bad" open><summary class="small bad">적용하지 않는 줄 ${pv.bad.length}개</summary><ul class="small">${pv.bad.slice(0,100).map(b=>`<li>${b.line}줄: ${esc(b.why)}</li>`).join('')}</ul></details>`:''}<div class="row"><button type="button" class="btn small" data-a="cosmPvX">취소</button><button type="button" class="btn small primary" data-a="cosmApply"${pv.chg.length?'':' disabled'}>${pv.chg.length}명 적용</button></div></div>`:'';
  return `<div class="cosm-io"><div class="row"><b class="small">내보내기</b><button type="button" class="btn small" data-a="cosmExp" data-v="scope">지금 묶음 CSV 받기 (${L.length}명)</button><button type="button" class="btn small" data-a="cosmExp" data-v="all">전체 선수 CSV 받기</button><button type="button" class="btn small" data-a="cosmExp" data-v="text">지금 묶음을 아래 칸에</button></div>
    <p class="small muted">형식: id, 구단, 현재 이름, 새 이름, 얼굴 번호 (쉼표 또는 탭). '새 이름'과 '얼굴 번호'만 읽습니다. 비운 칸은 그대로 둡니다. 두 칸(id, 새 이름)이나 세 칸(id, 새 이름, 얼굴 번호)만 적어도 됩니다.</p>
    <textarea class="cosm-txt" data-cosm="txt" rows="5" placeholder="id,구단,현재 이름,새 이름,얼굴 번호">${esc(S.txt||'')}</textarea>
    <div class="row"><button type="button" class="btn small" data-a="cosmFile">파일 불러오기</button><input type="file" accept=".csv,.txt,.tsv,text/*" data-cosmfile="1" hidden tabindex="-1" aria-hidden="true"><button type="button" class="btn small primary" data-a="cosmPv">미리보기</button></div>${pvH}</div>`; }
function cosmCard(){ if(!G||!G.players)return ''; return `<section class="card"><h2 class="sec">이름·얼굴 일괄 수정</h2><p class="small muted">모든 구단·드래프트 대상·은퇴 선수 이름과 얼굴 사진을 한꺼번에 바꿉니다. CSV로 내보내 고친 뒤 다시 가져올 수 있습니다(미리보기 뒤 적용). 능력·나이·계약은 바꾸지 않습니다.</p><button class="btn small" data-a="cosmOpen">일괄 수정 열기</button></section>`; }
function cosmDl(name,text){ try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['﻿'+text],{type:'text/csv;charset=utf-8'})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); return true; }catch(e){ return false; } }
function cosmDraftGrab(){ const S=UI.cosm; if(!S)return; document.querySelectorAll('#sheet .cosm-nm').forEach(el=>{ const id=el.dataset.id, t=cosmTarget(+id); if(!t)return; if(el.value===t.o.name)delete S.d[id]; else S.d[id]=el.value; }); const tx=document.querySelector('#sheet .cosm-txt'); if(tx)S.txt=tx.value;
  cosmQGrab(); }
/* 찾기 칸: 입력이 멈추면(쉼) 거른다. blur(change)로 다시 그리지 않는다 — 다시 그리면 막 누른 단추가 사라져 첫 클릭이 먹히지 않았다(외부 검수 11-17). 다른 단추를 누르면 cosmDraftGrab이 찾기 값을 먼저 반영한다 */
let _cosmQT=0, _cosmPtr=false;
function cosmQGrab(){ const S=UI.cosm; if(_cosmQT){ clearTimeout(_cosmQT); _cosmQT=0; } if(!S)return false; const q=document.querySelector('#sheet [data-cosm="q"]'); if(!q)return false; const v=q.value.trim(); if(v===S.q)return false; S.q=v; S.pg=0; return true; }
function cosmQLater(ms){ if(_cosmQT)clearTimeout(_cosmQT); _cosmQT=setTimeout(()=>{ _cosmQT=0; if(_cosmPtr)return cosmQLater(150); /* 누르는 중이면 클릭이 끝난 뒤 */ if(!UI.cosm||!cosmQGrab())return; cosmRedraw(); /* 초점·커서는 renderSheet가 되돌린다(Tab으로 옮긴 칸 포함) */ },ms??300); }
function cosmRedraw(){ try{ renderSheet(); }catch(e){} }
Object.assign(A,{
  cosmOpen(v){ UI.cosm=null; const S=cosmSt(); if(v)S.sc=String(v); S.msg=''; closeSheets(); UI.cosm=S; renderSheet(); },
  cosmClose(v,el,e){ if(e&&el&&el.classList&&el.classList.contains('scrim')&&e.target&&e.target.closest&&e.target.closest('[data-stop]'))return; /* 창 안(입력칸·글자)을 누른 것은 닫지 않는다 */ UI.cosm=null; renderSheet(); render(); },
  cosmPg(v){ cosmDraftGrab(); UI.cosm.pg=Math.max(0,+v||0); cosmRedraw(); },
  cosmPick(v){ cosmDraftGrab(); UI.cosm.face=v===''||v==null?null:+v; cosmRedraw(); },
  cosmIo(){ cosmDraftGrab(); const S=UI.cosm; S.io=!S.io; S.pv=null; cosmRedraw(); },
  cosmMore(v){ UI.cosmMore=UI.cosmMore||{}; UI.cosmMore[v]=((UI.cosmMore[v])||COSM_FACE_N)+COSM_FACE_N*2; if(UI.cosm)cosmDraftGrab(); if(document.getElementById('phdlg')&&typeof phRefresh==='function')phRefresh(); cosmRedraw(); },
  cosmFace(v){ const [id,n]=String(v).split(':').map(Number), p=G.players[id]; if(!p)return; const e=cosmFaceErr(p,n); if(e){ toast(e); return; } if(UI.cosm)cosmDraftGrab(); pEditGrab(); /* 고치기 상자에 적던 이름·등번호는 남긴다 */
    if(G.cimg&&G.cimg['p:'+id]){ delete G.cimg['p:'+id]; if(G.cimgO)delete G.cimgO['p:'+id]; } cosmSetFace(p,n); save(); render(); cosmRedraw(); if(typeof phRefresh==='function')phRefresh(); },
  cosmSave(){ cosmDraftGrab(); const S=UI.cosm, L=Object.entries(S.d).map(([id,name])=>({id:+id,name})); const r=cosmRenameMany(L); S.msgBad=!!r.errs.length; S.msg=(r.n?`이름 ${r.n}명을 바꿨습니다.`:'바뀐 이름이 없습니다.')+(r.errs.length?'\n저장하지 못한 이름:\n'+r.errs.join('\n'):'');
    for(const x of L){ const t=cosmTarget(x.id); if(t&&cosmNameClean(x.name)===t.o.name)delete S.d[x.id]; } if(r.n){ note('선수',`선수 이름 ${r.n}명을 바꿨습니다.`); save(); render(); } cosmRedraw(); },
  cosmExp(v){ cosmDraftGrab(); const S=UI.cosm, L=v==='all'?[...cosmList('all',''),...cosmList('arch','')]:cosmList(S.sc,S.q), csv=cosmRowsCsv(L);
    if(v==='text'){ S.txt=csv; S.pv=null; cosmRedraw(); return; } const ok=cosmDl(`프런트야구_선수이름_${v==='all'?'전체':S.sc.replace(':','')}_${G.year}.csv`,csv); if(!ok){ S.txt=csv; } S.msg=ok?`${L.length}명 CSV를 내려받았습니다.`:'파일을 만들지 못해 아래 칸에 넣었습니다. 복사해 쓰세요.'; S.msgBad=!ok; cosmRedraw(); },
  cosmPv(){ cosmDraftGrab(); const S=UI.cosm, rows=cosmParse(S.txt||''); S.pv=rows.length?cosmPreview(rows,COSM_F):{chg:[],bad:[{line:0,why:'읽을 줄이 없습니다. id,새 이름 형식으로 적어 주세요.'}],same:0}; cosmRedraw(); },
  cosmFile(){ const f=document.querySelector('#sheet [data-cosmfile]'); if(f)f.click(); }, /* 파일 고르기: 키보드(Enter·Space)로도 열린다(외부 검수 11-17) */
  cosmPvX(){ cosmDraftGrab(); UI.cosm.pv=null; cosmRedraw(); },
  cosmApply(){ cosmDraftGrab(); const S=UI.cosm; if(!S.pv)return; const pv=cosmPreview(cosmParse(S.txt||''),COSM_F); /* 미리보기 뒤 화면에서 바꾼 것까지 다시 확인 */ const r=cosmApply(pv,COSM_F);
    S.pv=null; S.msgBad=!!r.errs.length; S.msg=`가져오기: 이름 ${r.names}명 · 얼굴 ${r.faces}명을 바꿨습니다.`+(pv.bad.length?` 적용하지 않은 줄 ${pv.bad.length}개.`:'')+(r.errs.length?'\n'+r.errs.join('\n'):''); if(r.names||r.faces){ note('선수',`이름·얼굴 가져오기: 이름 ${r.names}명 · 얼굴 ${r.faces}명`); save(); render(); } cosmRedraw(); } });
if(typeof document!=='undefined'){
  document.addEventListener('change',e=>{ const el=e.target; if(!el||!el.dataset||!UI.cosm)return;
    if(el.dataset.cosm==='sc'){ cosmDraftGrab(); UI.cosm.sc=el.value; UI.cosm.pg=0; UI.cosm.face=null; cosmRedraw(); }
    else if(el.dataset.cosm==='q'){ /* blur로 오는 change에서는 다시 그리지 않는다(cosmQLater·cosmDraftGrab) */ if(el.value.trim()!==UI.cosm.q)cosmQLater(0); }
    else if(el.dataset.cosmfile){ const f=el.files&&el.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{ if(!UI.cosm)return; const t=String(r.result||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'); UI.cosm.txt=t; const tx=document.querySelector('#sheet .cosm-txt'); if(tx)tx.value=t; /* 칸에 먼저 넣는다: cosmPv의 cosmDraftGrab이 칸 값을 읽어 파일 내용을 옛 칸 값으로 덮던 문제(외부 검수 11-17) */ el.value=''; A.cosmPv(); }; r.onerror=()=>{ UI.cosm.msg='파일을 읽지 못했습니다.'; UI.cosm.msgBad=true; cosmRedraw(); }; r.readAsText(f); } });
  document.addEventListener('input',e=>{ const el=e.target; if(!UI.cosm||!el||!el.classList)return; if(el.classList.contains('cosm-nm')){ const t=cosmTarget(+el.dataset.id); if(t){ if(el.value===t.o.name)delete UI.cosm.d[el.dataset.id]; else UI.cosm.d[el.dataset.id]=el.value; } const tr=el.closest('tr'); if(tr&&t)tr.classList.toggle('ch',cosmNameClean(el.value)!==t.o.name); const b=document.querySelector('#sheet [data-a="cosmSave"]'); if(b){ const n=Object.keys(UI.cosm.d).filter(id=>{ const q=cosmTarget(+id); return q&&cosmNameClean(UI.cosm.d[id])!==q.o.name; }).length; b.disabled=!n; b.textContent=`바꾼 이름 ${n}명 저장`; } } else if(el.classList.contains('cosm-txt'))UI.cosm.txt=el.value; else if(el.dataset&&el.dataset.cosm==='q'&&!e.isComposing)cosmQLater(); });
  document.addEventListener('compositionend',e=>{ const el=e.target; if(UI.cosm&&el&&el.dataset&&el.dataset.cosm==='q')cosmQLater(); });
  document.addEventListener('pointerdown',()=>{ _cosmPtr=true; },true); document.addEventListener('pointerup',()=>{ setTimeout(()=>{ _cosmPtr=false; },0); },true); document.addEventListener('pointercancel',()=>{ _cosmPtr=false; },true);
}
