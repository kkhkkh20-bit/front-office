/* ---------- 단장 프로필: 새 게임에서 이름·나이·출신·얼굴을 정하고, 사이드바 '단장 프로필'에서 본다 ---------- */
function gpDefault(){ let n='김단장'; try{ n=genName(); }catch(e){} return {name:n,age:38,bg:'corp',voice:null,female:false,face:'gm'+Math.floor(Math.random()*1e6)}; }
function meAv(){ const P=(G&&G.gmP)||UI.gp||{}; return {persona:'staff',pid:P.face||'gm0',age:(G&&G.gmP===P?meAge():null)||P.age||42,female:!!P.female,name:P.name||'단장',mod:P.mod||null,img:P.img||null}; }
/* 얼굴 꾸미기: 후보 12개 중에서 고르고, 부위(머리·머리색·수염·안경·표정)를 하나씩 바꾼다 */
const GP_PART={hair:{l:'머리',m:['short','short2','short3','crop','crop-fade','crop-fade2','short-fade','short-fade-2','middle-part','parted','messy','messy-short','spike','spike2','juice','high','tall-fade','faux-hawk','shortBangs','short-bald','curly','curly2','afro'],f:['female1','female2','female3','female4','female5','female6','female7','female8','female9','female10','female11','female12','longHair','shortBangs','middle-part','parted']},
  hc:{l:'머리색',m:['#1a1a1a','#2b1d14','#4a3121','#6b4a2b','#8a6a43','#6e6e6e','#a7a7a7','#d0d0d0']},
  fh:{l:'수염',m:['mustache-thin','mustache1','soul','goatee-thin','goatee1','fullgoatee','chin-strap','beard1','beard2','beard3','none'],f:['none']},
  gl:{l:'안경',m:['glasses2-black','glasses1-secondary','glasses2-secondary','none']},
  mouth:{l:'표정',m:['smile-closed','smile','smile2','closed','straight','side']}};
function gpPartList(k,g){ const P=GP_PART[k]; return (g.female&&P.f)?P.f:P.m; }
function gpSync(){ const g=UI.gp=UI.gp||gpDefault(); const n=document.getElementById('gp-name'), a=null; if(n)g.name=n.value.trim().slice(0,10); return g; }
function gpForm(go,goL){ const g=UI.gp=UI.gp||gpDefault(); const av={persona:'staff',pid:g.face,age:g.age,female:g.female,name:g.name,mod:g.mod||null,img:g.img||null}; const M=g.mod||{};
  void M; const ph=gp7Seeds(g); if(!g.img&&!/^p[78]:/.test(g.face||'')&&ph.length){ g.face=ph[0]; av.pid=g.face; } /* 얼굴은 내 사진 또는 사진 얼굴만(그림 얼굴·부위 꾸미기 없음, 사용자 결정 11-07) */
  return `<div class="gpf"><div class="gpf-face">${avImg(av,true)}<div class="row gp-up"><label class="btn small">내 사진 넣기<input type="file" accept="image/*" data-gpimg hidden></label>${g.img?'<button class="btn small" data-a="gpImgDel">사진 지우기</button>':''}</div></div><div class="gpf-in">
    <label class="small">이름<input id="gp-name" type="text" maxlength="10" value="${esc(g.name||'')}" placeholder="단장 이름" autocomplete="off"></label>
    ${go==='gpSave'&&G&&G.gmP?`<div class="small gp-age">나이 <b>${g.age}세</b> <span class="muted">취임 뒤에는 고칠 수 없습니다</span></div>`:`<div class="small gp-age">나이 <button class="btn small" data-a="gpAge" data-v="-5">−5</button><button class="btn small" data-a="gpAge" data-v="-1">−1</button><b>${g.age}세</b><button class="btn small" data-a="gpAge" data-v="1">+1</button><button class="btn small" data-a="gpAge" data-v="5">+5</button></div>`}
    <div class="small">성별</div><div class="chips"><button data-a="gpSex" data-v="m" class="${g.female?'':'on'}">남</button><button data-a="gpSex" data-v="f" class="${g.female?'on':''}">여</button></div>
    <div class="small">출신</div><div class="chips">${Object.entries(GM_BG).map(([k,l])=>`<button data-a="gpBg" data-v="${k}" class="${g.bg===k?'on':''}">${l}</button>`).join('')}</div>
    <p class="small">${esc(GM_BG[g.bg]||'')}: ${esc(GM_BGD[g.bg]||'')}.</p>
    ${go==='gpStart'?'':`<div class="small">말투</div><div class="chips gp-voice">${Object.entries(GMV).map(([k,V])=>`<button data-a="gpVoice" data-v="${k}" class="${g.voice===k?'on':''}">${V.l}</button>`).join('')}</div>
    <p class="small">${GMV[g.voice]?`${esc(GMV[g.voice].d)} 예: "${esc(GMVL[g.voice].yes[0])}" · "${esc(GMVL[g.voice].ask)}"`:'말투를 고르면 인터뷰·구단주 요청·재계약 같은 단장 대사가 그 색으로 바뀝니다(효과 차이는 없습니다).'}</p>`}<p class="small muted">출신 효과는 처음 취임할 때 한 번 들어갑니다(나중에 출신을 고쳐도 다시 들어가지 않습니다). 이름과 출신은 기사와 경력에도 쓰입니다. 나이는 해마다 한 살씩 듭니다.</p>
    ${UI.gpMsg?`<div class="note">${esc(UI.gpMsg)}</div>`:''}<button class="btn primary block" data-a="${go}">${goL}</button></div></div>
  ${typeof FACE7!=='undefined'?`<div class="gpg-h"><span class="small">얼굴: 마음에 드는 사진을 누르거나 위에서 내 사진을 넣으세요</span><button class="btn small" data-a="gpFace7">다른 사진</button></div><div class="gpg">${ph.map(c=>`<button class="gpg-c${g.face===c?' on':''}" data-a="gpPick" data-v="${c}">${avImg({persona:'staff',pid:c,age:g.age,female:g.female,name:g.name})}</button>`).join('')}</div>`:''}
`; }
/* 새 게임: 구단을 고르면 단장 정보부터 */
function gpStartView(){ const v=UI.pickT; const d=TEAM_DEF[v];
  return `<div class="gut"><div class="wrap" style="max-width:640px"><button class="lnk tsback" data-a="tsGo" data-v="team">← 구단 다시 고르기</button>
    <h2 class="ts-h">${d?`${badge(v,28)} ${esc(d.city)} ${esc(d.nick)} · `:''}단장 소개</h2><section class="card">${gpForm('gpStart','이 단장으로 시작')}</section></div></div>`; }
/* 사이드바 '단장 프로필' */
/* 야인이어도 돌아보는 경력: 시즌별 재임 구단·순위·성적, 퇴임 시점 마지막 시즌 결산 */
function meCareerSeasons(C){ const S=(C&&C.seas||[]).slice().reverse(); if(!S.length)return ''; return csec('시즌별 경력',`<div class="tw"><table><thead><tr><th>시즌</th><th>구단</th><th>순위</th><th>성적</th><th></th></tr></thead><tbody>${S.map(x=>`<tr><td>${x.y}</td><td>${badge(x.tid,14)} ${esc(tshort(x.tid))}</td><td>${x.rank!=null?`${x.rank}위`:'-'}${x.part?` <span class="muted">(시즌 중 ${esc(x.how||'이직')})</span>`:''}</td><td>${x.w}승 ${x.l}패${x.t?` ${x.t}무`:''}</td><td>${x.ch===1?'<span class="pill good">우승</span>':x.ch===2?'<span class="pill">준우승</span>':''}</td></tr>`).join('')}</tbody></table></div>`); }
function meLastFin(C){ const st=(C&&C.stints||[]).find(x=>x.fin); if(!st)return ''; const F=st.fin; return csec(`${F.y} ${tshort(st.tid)} 결산(물러나기 전 마지막 시즌)`,`<p class="small muted">${F.rank?`${F.rank}위`:''}${F.w!=null?` · ${F.w}승 ${F.l}패${F.t?` ${F.t}무`:''}`:''} · ${esc(st.how)}</p>${finTable(F.f)}`); }
function meView(){ const P=G.gmP; let C=G.myC; try{ if(!G.unemp)C=myCInit(); }catch(e){} const nick=meNick(); const age=meAge();
  const head=UI.gpEdit||!P?`<section class="card"><h2 class="sec">${P?'단장 정보 고치기':'단장 정보를 정해 주세요'}</h2>${gpForm('gpSave',P?'저장':'정하기')}${P?'<button class="btn block" data-a="gpEdit" style="margin-top:6px">취소</button>':''}</section>`
    :`<section class="card mehead">${avImg(meAv(),true)}<div class="mehead-t"><div class="eyebrow">${G.unemp?'야인':`${esc(tname(G.user))} 단장`}${C&&C.y0&&!G.unemp?` · ${C.y0}년부터`:''}</div><h2 class="sec">${esc(P.name)} <span class="small muted">${age}세 · ${esc(GM_BG[P.bg]||'')}</span></h2>
      <div class="chips"><span class="pill">단장 명성 ${G.rep??50} · ${esc(repLabel(G.rep??50))}</span>${nick?`<span class="pill acc">별명: ${esc(nick)}</span>`:''}${GMV[P.voice]?`<span class="pill">말투 · ${esc(GMV[P.voice].l)}</span>`:''}${!G.unemp&&G.user!=null?`<span class="pill">구단주 신뢰 ${team(G.user).trust}</span>`:''}</div></div><button class="btn small" data-a="gpEdit">고치기</button></section>`;
  const card=G.unemp?gmProfileView():gmCardView();
  const stints=G.unemp&&C&&C.stints&&C.stints.length?csec('지난 경력',C.stints.map(x=>`<div class="row between small"><span>${badge(x.tid,16)} ${esc(tshort(x.tid))} · ${x.y0}~${x.y1}</span><span class="muted">${esc(x.how)}</span></div>`).join(''))+meCareerSeasons(C)+meLastFin(C):'';
  const left=C&&C.tid!=null?Math.max(0,C.y1-G.year):0; const mid=period()==='season'||period()==='post'; const pen=(left>0?2:0)+(mid?3:0);
  const quit=G.unemp||G.gameOver||!C||C.tid==null?'':csec('사임',`<p class="small">스스로 물러나면 야인이 됩니다. 시간은 계속 흐르고, 다른 구단이 단장을 바꿀 때 명성을 보고 제의가 옵니다.</p>
    <ul class="small muted"><li>남은 계약 ${left}년 치 연봉은 받지 않습니다. 경질과 다른 점입니다.</li><li>${pen?`단장 명성이 ${pen>=4?'크게 ':''}떨어집니다${mid?'. 시즌 도중 사임이라 타격이 더 큽니다':''}`:'단장 명성은 그대로입니다'}.</li><li>구단은 새 단장이 맡습니다. 진행 중인 협상·약속은 넘어가지 않습니다.</li></ul>
    ${UI.rsAsk?`<div class="note bad">${esc(tname(G.user))} 단장직에서 물러납니다. 되돌릴 수 없습니다.</div><div class="row"><button class="btn danger" data-a="resignGo">사임합니다</button><button class="btn" data-a="resignAsk">취소</button></div>`:'<button class="btn" data-a="resignAsk">단장직 사임</button>'}`);
  const tb=G.unemp?'':`<section class="card"><div class="row between"><div><h2 class="sec">내가 꾸린 팀</h2><p class="small muted">순위 변화, 지금 선수단이 어디서 왔는지, 내가 데려온 핵심 선수</p></div><button class="btn small primary" data-a="go" data-v="club:build">보기</button></div></section>`;
  return head+tb+personalLifeView()+card+stints+lgMeCard()+gmSuccView()+quit; }
/* 단장 세대 교체와 단장 계보(100년 플레이) */
/* 전임 단장 상세: 시즌별 성적과 거친 구단(계보에 남긴 기록). 예전 저장의 계보는 요약만 있다 */
function gmLineDetail(x){ const S=(x.seasL||[]).filter(r=>!r.part).slice().sort((a,b)=>a.y-b.y), T=(x.stintL||[]);
  if(!S.length&&!T.length)return x.w!=null?`<div class="small muted">${x.w}승 ${x.l}패${x.n?` · ${x.n}시즌`:''}</div>`:'';
  const w=S.reduce((a,r)=>a+(r.w||0),0), l=S.reduce((a,r)=>a+(r.l||0),0);
  return `<details class="gml-d"><summary class="small">통산 ${w}승 ${l}패${w+l?` (승률 ${(w/(w+l)).toFixed(3).replace(/^0/,'')})`:''} · 시즌별 기록</summary>${S.length?`<div class="tw"><table class="sqt"><thead><tr><th>연도</th><th>구단</th><th>승-패</th><th>순위</th><th>가을</th></tr></thead><tbody>${S.map(r=>`<tr><td class="num">${r.y}</td><td>${team(r.tid)?badge(r.tid,12)+' '+esc(tshort(r.tid)):'-'}</td><td class="num">${r.w||0}-${r.l||0}${r.t?`-${r.t}`:''}</td><td class="num">${r.rank??'-'}</td><td>${r.ch===1?'<b>우승</b>':r.ch===2?'준우승':''}</td></tr>`).join('')}</tbody></table></div>`:''}${T.length?`<p class="small muted">거친 구단: ${T.map(t=>`${team(t.tid)?esc(tshort(t.tid)):'-'} ${t.y0}~${t.y1}${t.how?` (${esc(t.how)})`:''}`).join(' · ')}</p>`:''}${x.earn?`<p class="small muted">단장 연봉 누적 ${money(x.earn)}</p>`:''}</details>`; }
function gmSuccView(){ const L=(G.gmLine||[]).slice().reverse(); const a=meAge(); const can=!G.unemp&&!G.gameOver&&G.gmP&&G.user!=null;
  const line=L.length?`<div class="tw"><table><thead><tr><th>대</th><th>단장</th><th>구단</th><th>재임</th><th>우승</th></tr></thead><tbody>${L.map((x,i)=>`<tr><td>${L.length-i}대</td><td>${esc(x.name)}${x.age?` <span class="muted">(퇴임 ${x.age}세)</span>`:''}${gmLineDetail(x)}</td><td>${badge(x.tid,14)} ${esc(tshort(x.tid))}</td><td>${x.from}~${x.to}</td><td>${x.champ?`<b>${x.champ}회</b>`:'-'}</td></tr>`).join('')}<tr class="me"><td>${L.length+1}대</td><td><b>${esc(G.gmP?.name||'')}</b> <span class="muted">(지금)</span></td><td>${G.user!=null?badge(G.user,14)+' '+esc(tshort(G.user)):'-'}</td><td>${G.gmSince??''}~</td><td></td></tr></tbody></table></div>`:'';
  if(!can)return line?csec('단장 계보',line):'';
  const off=period()!=='season'&&period()!=='post';
  const body=UI.gsucc?`<p class="small">후임 단장을 정합니다. 선수단·시설·재정·코치진은 그대로 이어지고, 명성은 새로 쌓습니다.</p>${gpForm('gmSuccGo','이 사람에게 넘기기')}<button class="btn block" data-a="gmSuccAsk" style="margin-top:6px">취소</button>`
    :`<div class="row between"><p class="small muted">${a!=null?`지금 ${a}세. `:''}${GM_SUCC_FORCE}세가 되는 해에는 구단이 정한 후임에게 넘어갑니다.${off?'':' 시즌이 끝난 뒤 넘길 수 있습니다.'}</p><button class="btn small${a>=GM_SUCC_ASK?' primary':''}" data-a="gmSuccAsk"${off?'':' disabled'}>후임에게 넘기기</button></div>`;
  return csec('세대 교체 · 단장 계보',body+line); }
Object.assign(A,{
  fdPk(v){ UI.fdPk=+v; UI.fdNeed=false; render(); },
  dr1Pk(v){ UI.dr1Pk=+v||0; render(); },
  fdStr(v){ UI.fdStr=+v?1:0; render(); },
  scHomeAuto(){ toast(scHomeAuto()); save(); render(); },
  facRefurb(v){ const e=facRefurb(v); toast(e||'보수 공사를 마쳤습니다. 연식을 새로 셉니다.'); if(!e)save(); render(); },
  fenceD(v){ const [k,x]=String(v).split(':'); UI.fenceD=UI.fenceD||{}; UI.fenceD[k]=+x; UI.fenceMsg=''; render(); },
  fenceReset(){ UI.fenceD={}; UI.fenceMsg=''; render(); },
  fenceGo(){ const e=fenceSet(fenceTarget(G.user)); UI.fenceMsg=e||'담장 공사를 마쳤습니다. 다음 경기부터 반영됩니다.'; UI.fenceOk=!e; if(!e){ UI.fenceD={}; save(); } render(); },
  start(v){ if(UI.smode!=='take'&&UI.world&&UI.world.fdOrd&&!UI.fdPk){ UI.fdNeed=true; render(); document.querySelector('.fdpk')?.scrollIntoView({block:'start'}); return; } UI.pickT=+v; UI.gp=UI.gp||gpDefault(); UI.gpMsg=''; UI.sstep='prof'; render(); window.scrollTo(0,0); },
  gpFace(){ const g=gpSync(); UI.gpSeeds=null; render(); },
  gpPick(v){ const g=gpSync(); g.face=v; delete g.mod; delete g.img; render(); },
  gpPart(v){ const g=gpSync(); const [k,d]=String(v).split(':'); const L=gpPartList(k,g); g.mod=g.mod||{}; const i=g.mod[k]!=null?L.indexOf(g.mod[k]):-1; g.mod[k]=L[((i<0?(+d>0?-1:0):i)+ +d+L.length)%L.length]; render(); },
  gpPartReset(){ const g=gpSync(); delete g.mod; render(); },
  gpSex(v){ const g=gpSync(); g.female=v==='f'; g.face='gm'+Math.floor(Math.random()*1e6); delete g.mod; UI.gpSeeds=null; render(); },
  gpAge(v){ const g=gpSync(); g.age=clamp((g.age||40)+(+v),30,65); render(); },
  gpBg(v){ const g=gpSync(); g.bg=v; render(); },
  gpVoice(v){ const g=gpSync(); g.voice=g.voice===v?null:v; render(); },
  gpStart(){ const g=gpSync(); if(!g.name||g.name.length<2){ UI.gpMsg='이름을 두 글자 이상 적어 주세요.'; render(); return; } UI.gpMsg=''; const P={...g}; if(!UI.newSlot&&!SLOT_IDS.some(n=>!meta().slots[n])){ UI.gpMsg=`저장 슬롯 ${SLOTS}개가 모두 찼습니다. 처음 화면 → 불러오기에서 덮어쓸 슬롯의 '덮어쓰고 새 게임'을 누르거나 슬롯 하나를 지운 뒤 다시 시작하세요. 정한 단장 정보는 그대로 남겨 둡니다.`; render(); return; } /* 슬롯이 없으면 얼굴·이름을 지우지 않고 알린다(전에는 조용히 멈추고 얼굴만 새로 뽑혔다) */
    UI.gp=null; const ok=A.startGo(UI.pickT); if(ok&&G){ G.gmP={...P,y0:G.year}; gmBgApply(); save(); render(); try{ teleEv('gm_created',{bg:P.bg,start_team:G.user,female:!!P.female,age:P.age}); }catch(e){} } },
  gpEdit(){ UI.gpEdit=!UI.gpEdit; if(UI.gpEdit)UI.gp=G.gmP?{...G.gmP,age:meAge()||G.gmP.age}:gpDefault(); UI.gpMsg=''; render(); },
  gpSave(){ const g=gpSync(); if(!g.name||g.name.length<2){ UI.gpMsg='이름을 두 글자 이상 적어 주세요.'; render(); return; } const y0=G.gmP&&G.gmP.y0!=null?G.gmP.y0:G.year; const age=G.gmP?G.gmP.age:g.age; /* 취임한 단장은 나이를 못 고친다: 고치면 정년을 피할 수 있었다(검수 11-09zc) */ const done=!!(G.gmP&&G.gmP.bgDone); G.gmP={name:g.name,age:Math.max(25,age),bg:g.bg,voice:GMV[g.voice]?g.voice:null,female:g.female,face:g.face,mod:g.mod||null,img:g.img||null,y0,bgDone:done}; if(!done)gmBgApply(); UI.gp=null; UI.gpEdit=false; UI.gpMsg=''; save(); render(); toast('단장 정보를 저장했습니다.'); },
  gmSuccAsk(){ UI.gsucc=!UI.gsucc; UI.gp=UI.gsucc?gpDefault():null; UI.gpMsg=''; render(); },
  gmSuccGo(){ const g=gpSync(); const r=gmSucceed({...g}); if(r){ UI.gpMsg=r; render(); return; } UI.gsucc=false; UI.gp=null; save(); render(); toast(`${G.gmP.name} 단장이 취임했습니다.`); },
  resignAsk(){ UI.rsAsk=!UI.rsAsk; render(); },
  resignGo(){ UI.rsAsk=false; const r=resignGM(); if(r){ toast(r); return; } save(); UI.tab='inbox'; UI.mf='all'; UI._ibFirst=true; render(); }
});

/* 설정 > 진행 방식 (A는 40_actions에서 만들어지므로 그 뒤 파일에서 붙인다) */
Object.assign(A,{ advAskTog(){ G.advAsk=!G.advAsk; save(); render(); } });

/* 드래프트 상황판(휴대폰): 맡기기 메뉴 열기·상황판 접기 */
Object.assign(A,{ tkDel(){ UI.tkDel=!(UI.tkDel??true); /* 휴대폰도 처음엔 맡기기 펼침: 지명 이탈이 휴대폰에서 더 컸다(GA 11-08) */ render(); }, tkMin(){ UI.tkMin=!(UI.tkMin??false); render(); }, tkMenu(){ UI.tkMenu=!UI.tkMenu; render(); } });

/* 단장 사진을 갤러리에서(사용자 요청 11-05): 가운데를 정사각형으로 잘라 256px JPEG로 줄여 저장에 넣는다(약 20KB). 서버로 보내지 않는다 */
Object.assign(A,{ gpImgDel(){ const g=gpSync(); delete g.img; render(); } });
document.addEventListener('change',e=>{ const el=e.target; if(!el||!el.matches||!el.matches('[data-gpimg]')||!el.files||!el.files[0])return; const f=el.files[0]; if(!/^image\//.test(f.type)&&!/\.(jpe?g|jfif|png|webp|gif|bmp|avif|heic|heif)$/i.test(f.name||'')){ toast('사진 파일만 넣을 수 있습니다.'); return; } /* PC에서 종류를 비워 넘기는 파일도 확장자로 받는다(카페 11-14) */
  const url=URL.createObjectURL(f), im=new Image(); im.onload=()=>{ try{ const s=Math.min(im.naturalWidth,im.naturalHeight), c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.imageSmoothingQuality='high'; x.drawImage(im,(im.naturalWidth-s)/2,Math.max(0,(im.naturalHeight-s)*.3),s,s,0,0,256,256); /* 세로 사진은 얼굴이 있는 위쪽을 조금 더 */
      const g=gpSync(); g.img=c.toDataURL('image/jpeg',.85); render(); }catch(err){ toast('사진을 읽지 못했습니다.'); } URL.revokeObjectURL(url); }; im.onerror=()=>{ URL.revokeObjectURL(url); toast(/\.(heic|heif)$/i.test(f.name||'')?'이 브라우저는 HEIC 사진을 읽지 못합니다. JPG나 PNG로 바꿔 넣어 주세요.':'사진을 읽지 못했습니다. JPG나 PNG로 다시 넣어 주세요.'); }; im.src=url; });

/* 모든 선수·인물 사진을 갤러리 사진으로(사용자 요청 11-06). 이 기기의 저장에만 넣는다(256px JPEG 약 15KB) */
function cimgBtns(k){ if(!k||!G)return ''; return `<span class="cimg-b"><label class="btn small" title="갤러리 사진으로 바꾸기">사진<input type="file" accept="image/*" data-cimg="${esc(k)}" hidden></label>${G.cimg&&G.cimg[k]?`<button class="btn small" data-a="cimgDel" data-v="${esc(k)}">원래대로</button>`:''}</span>`; }
Object.assign(A,{ cimgDel(v){ if(G&&G.cimg){ delete G.cimg[v]; save(); render(); try{ renderSheet(); }catch(e){} } } });
/* 파일 선택 대리(카페 11-14 PC 사진 무반응): 파일 창이 열린 동안 화면이 다시 그려지면 원래 입력칸이 문서에서 빠져 change가 document까지 오지 않는다.
   앱 화면 밖(body 끝)에 복제한 입력칸으로 파일을 받아 같은 처리로 넘긴다 */
if(typeof document!=='undefined'&&!window._fileProxy){ window._fileProxy=1; document.addEventListener('click',e=>{ const el=e.target; if(!el||!el.matches||!el.matches('input[type=file]')||el.dataset.proxy||!el.closest('#app,#sheet'))return;
  e.preventDefault(); let box=document.getElementById('file-proxy'); if(!box){ box=document.createElement('div'); box.id='file-proxy'; box.hidden=true; document.body.appendChild(box); } box.textContent='';
  const c=el.cloneNode(false); c.dataset.proxy='1'; c.value=''; box.appendChild(c); c.click(); },true); }
function imgSquare(f,cb){ const url=URL.createObjectURL(f), im=new Image(); im.onload=()=>{ try{ const s=Math.min(im.naturalWidth,im.naturalHeight), c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.imageSmoothingQuality='high'; const scale=256/Math.max(im.naturalWidth,im.naturalHeight), w=im.naturalWidth*scale,h=im.naturalHeight*scale; x.fillStyle='#0d1217'; x.fillRect(0,0,256,256); x.drawImage(im,(256-w)/2,(256-h)/2,w,h); cb(c.toDataURL('image/jpeg',.82)); }catch(err){ toast('사진을 읽지 못했습니다.'); } URL.revokeObjectURL(url); }; im.onerror=()=>{ URL.revokeObjectURL(url); toast(/\.(heic|heif)$/i.test(f.name||'')?'이 브라우저는 HEIC 사진을 읽지 못합니다. JPG나 PNG로 바꿔 넣어 주세요.':'사진을 읽지 못했습니다. JPG나 PNG로 다시 넣어 주세요.'); }; im.src=url; }
document.addEventListener('change',e=>{ const el=e.target; if(!el||!el.matches||!el.matches('[data-cimg]')||!el.files||!el.files[0]||!G)return; const f=el.files[0]; if(!/^image\//.test(f.type)&&!/\.(jpe?g|jfif|png|webp|gif|bmp|avif|heic|heif)$/i.test(f.name||'')){ toast('사진 파일만 넣을 수 있습니다.'); return; } /* PC에서 종류를 비워 넘기는 파일도 확장자로 받는다(카페 11-14) */
  const k=el.dataset.cimg; try{ el.value=''; }catch(err){} /* 같은 파일을 다시 골라도 바뀌게 */ imgSquare(f,u=>{ (G.cimg=G.cimg||{})[k]=u; save(); render(); try{ renderSheet(); }catch(err){} toast('사진을 바꿨습니다.'); }); });
