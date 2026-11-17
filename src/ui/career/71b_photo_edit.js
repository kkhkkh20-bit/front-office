/* ===== 사진 고치기·자르기(사용자 11-16: "사진 적용할 때 그 화면에서 크롭해서 적용", "사진 옆에서 수정") =====
 - 얼굴 사진 모서리의 연필 버튼(phPen)이 고르기 창을 연다: 갤러리 사진 · 자르기 다시 · 원래대로 · (비서) 템플릿 사진
 - 갤러리에서 고른 사진은 바로 저장하지 않고 자르기 단계를 거친다: 정사각형 틀, 끌어서 옮기기, 두 손가락·휠·막대로 확대, 둥근·네모 미리보기
 - 결과는 예전과 같은 384px WebP(못 만들면 JPEG, 71_gm_me.js IMG_OUT·imgEnc). 단장 사진(data-meimg)·새 단장 만들기(data-gpimg)도 같은 단계
 - '자르기 다시'용 원본은 긴 변 960px로 줄여 G.cimgO에 둔다. 한 장 350KB를 넘거나 4장이 넘으면(오래된 것부터) 두지 않는다 → 그때는 파일을 다시 고른다
 - 창은 #app·#sheet 밖(body 끝) 한 개만 쓴다: 화면을 다시 그려도 사라지지 않고, 고르기 → 자르기는 같은 창의 내용만 바꾼다(창이 겹쳐 쌓이지 않음). Esc로 닫는다 */
const PH={k:null,mode:null,c:null,back:null};
const PH_KEEP=960, PH_KEEP_MAX=350000, PH_KEEP_N=4;
const PH_PEN='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M11.3 1.9a1.6 1.6 0 0 1 2.3 0l.5.5a1.6 1.6 0 0 1 0 2.3L5.4 13.4 1.8 14.2l.8-3.6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.8 3.4l2.8 2.8" stroke="currentColor" stroke-width="1.6"/></svg>';
function phPen(k){ if(!k||!G)return ''; return `<button type="button" class="ph-pen" data-a="phMenu" data-v="${esc(k)}" title="사진 바꾸기" aria-label="사진 바꾸기">${PH_PEN}</button>`; }
/* 얼굴 사진과 연필 버튼을 한 덩어리로(버튼이 사진 오른쪽 아래 모서리에 붙는다) */
function phWrap(av,k){ const b=phPen(k); return b?`<span class="ph-w">${av}${b}</span>`:av; }
function phEl(){ let d=document.getElementById('phdlg'); if(!d){ d=document.createElement('div'); d.id='phdlg'; d.className='ph-scrim'; d.addEventListener('click',e=>{ if(e.target===d)phClose(); }); document.body.appendChild(d); PH.back=document.activeElement; } return d; }
function phClose(){ const d=document.getElementById('phdlg'); if(d)d.remove(); clearTimeout(PH.t); PH.k=null; PH.mode=null; PH.c=null; const b=PH.back; PH.back=null; try{ if(b&&b.isConnected)b.focus({preventScroll:true}); }catch(e){} }
/* 지금 화면에 보이는 그 사람 사진(연필 버튼 옆 사진) */
function phCurSrc(k){ const b=[...document.querySelectorAll('#app .ph-pen,#sheet .ph-pen')].find(x=>x.dataset.v===k), im=b&&b.parentElement&&b.parentElement.querySelector('img'); return (G.cimg&&G.cimg[k])||(im&&im.getAttribute('src'))||''; }
function phMenuHtml(k){ const cur=phCurSrc(k), own=!!(G.cimg&&G.cimg[k]), orig=!!(G.cimgO&&G.cimgO[k]&&own), tpl=(typeof secPickHtml==='function'?secPickHtml(k).replace('<details class="pe-sec sec-pick">','<details class="pe-sec sec-pick" open>'):'')||(typeof cosmPhTpl==='function'?cosmPhTpl(k):''); /* 선수(p:id): 템플릿 얼굴 고르기(72_cosmetic.js) */
  return `<div class="ph-box" role="dialog" aria-modal="true" aria-label="사진 바꾸기"><div class="ph-head"><b>사진 바꾸기</b><button type="button" class="x" data-a="phClose" aria-label="닫기">×</button></div>
    <div class="ph-cur">${cur?`<img class="av big" src="${cur}" alt="">`:'<span class="av big ini">?</span>'}<p class="small muted">${own?'갤러리에서 넣은 사진입니다.':'기본 사진입니다.'} 고른 사진은 이 기기 저장에만 넣습니다.</p></div>
    <div class="ph-acts"><label class="btn primary">갤러리에서 고르기<input type="file" accept="image/*" data-cimg="${esc(k)}" hidden></label>${orig?`<button type="button" class="btn" data-a="phRecrop" data-v="${esc(k)}">자르기 다시</button>`:''}${own?`<button type="button" class="btn" data-a="cimgDel" data-v="${esc(k)}">원래대로</button>`:''}</div>
    ${tpl?`<div class="ph-tpl">${tpl}</div>`:''}</div>`; }
function phMenu(k){ if(!k||!G)return; const d=phEl(); PH.k=k; PH.mode='menu'; PH.c=null; d.innerHTML=phMenuHtml(k); phFocus(d); phTplWait(); }
/* 템플릿 사진을 받는 중이면 잠시 뒤 템플릿 칸만 다시 그린다(파일 고르기 입력칸은 그대로 둔다) */
function phTplWait(n){ clearTimeout(PH.t); const d=document.getElementById('phdlg'); if(!d||PH.mode!=='menu')return; const w=d.querySelector('.ph-tpl .av.ini'); if(!w||(n||0)>8)return; PH.t=setTimeout(()=>{ const box=d.querySelector('.ph-tpl'); if(box&&PH.mode==='menu'&&typeof secPickHtml==='function')box.innerHTML=secPickHtml(PH.k).replace('<details class="pe-sec sec-pick">','<details class="pe-sec sec-pick" open>'); phTplWait((n||0)+1); },600); }
/* 사진을 바꾼 뒤(원래대로·템플릿) 창 안의 현재 사진과 버튼을 새로 */
function phRefresh(){ if(PH.mode!=='menu'||!PH.k)return; const d=document.getElementById('phdlg'); if(d){ d.innerHTML=phMenuHtml(PH.k); phTplWait(); } }
function phFocus(d){ setTimeout(()=>{ const f=d.querySelector('.ph-acts .btn,.phc-acts .primary,button'); try{ f&&f.focus({preventScroll:true}); }catch(e){} },0); }
Object.assign(A,{ phMenu(v){ phMenu(String(v)); }, phClose(){ phClose(); },
  phRecrop(v){ const k=String(v), u=G.cimgO&&G.cimgO[k]; if(!u){ toast('원본이 남아 있지 않습니다. 사진을 다시 골라 주세요.'); return; } phCrop(u,{k,keep:false}); },
  phCropNo(){ if(PH.c&&PH.c.to&&PH.c.to.k&&PH.c.fromMenu)phMenu(PH.c.to.k); else phClose(); },
  phCropOk(){ phApply(); } });
/* Esc는 이 창만 닫는다. 창이 떠 있는 동안 다른 단축키(스페이스 진행 등)는 뒤 화면으로 보내지 않는다. Tab은 창 안에서만 돈다 */
if(typeof window!=='undefined')window.addEventListener('keydown',e=>{ const d=document.getElementById('phdlg'); if(!d)return; e.stopImmediatePropagation();
  if(e.key==='Escape'){ e.preventDefault(); if(PH.mode==='crop')A.phCropNo(); else phClose(); return; }
  if(e.key==='Tab'){ const F=[...d.querySelectorAll('button,label.btn,input[type=range],summary,[tabindex="0"]')].filter(x=>x.offsetParent!==null); if(!F.length)return; const i=F.indexOf(document.activeElement); if(e.shiftKey&&i<=0){ e.preventDefault(); F[F.length-1].focus(); } else if(!e.shiftKey&&i===F.length-1){ e.preventDefault(); F[0].focus(); } else if(i<0){ e.preventDefault(); F[0].focus(); } return; }
  if(PH.mode==='crop'&&e.target&&e.target.closest&&e.target.closest('.phc-stage')){ const c=PH.c; if(!c)return; const st=12; if(/^Arrow/.test(e.key)){ e.preventDefault(); c.x+=e.key==='ArrowLeft'?st:e.key==='ArrowRight'?-st:0; c.y+=e.key==='ArrowUp'?st:e.key==='ArrowDown'?-st:0; phClamp(); phDraw(); } else if(e.key==='+'||e.key==='='||e.key==='-'){ e.preventDefault(); phZoomAt(c.s*(e.key==='-'?1/1.1:1.1),c.V/2,c.V/2); } }
  if(!d.contains(e.target))e.preventDefault(); },true);
const phBadType=f=>!/^image\//.test(f.type)&&!/\.(jpe?g|jfif|png|webp|gif|bmp|avif|heic|heif)$/i.test(f.name||''); /* PC에서 종류를 비워 넘기는 파일도 확장자로 받는다(카페 11-14) */
const phReadErr=f=>toast(f&&/\.(heic|heif)$/i.test(f.name||'')?'이 브라우저는 HEIC 사진을 읽지 못합니다. JPG나 PNG로 바꿔 넣어 주세요.':'사진을 읽지 못했습니다. JPG나 PNG로 다시 넣어 주세요.');
/* 자르기 단계 열기. src: File 또는 data URL. to: {k}(인물·선수 사진) | {me:1}(단장 프로필) | {gp:1}(새 단장 만들기) */
function phCrop(src,to){ const isF=typeof src!=='string', url=isF?URL.createObjectURL(src):src, im=new Image(), fromMenu=PH.mode==='menu';
  im.onload=()=>{ try{ const W0=im.naturalWidth, H0=im.naturalHeight; if(!W0||!H0)throw Error('size'); const L=1600, r=Math.min(1,L/Math.max(W0,H0)), w=Math.max(1,Math.round(W0*r)), h=Math.max(1,Math.round(H0*r)); /* 화면용 작업본: 큰 휴대폰 사진도 끌기가 매끄럽게 */
      const wc=document.createElement('canvas'); wc.width=w; wc.height=h; { const d=imgDown(im,0,0,W0,H0,Math.max(w,h)), g=wc.getContext('2d'); g.imageSmoothingQuality='high'; g.drawImage(d.src,d.x,d.y,d.w,d.h,0,0,w,h); }
      let keep=null; if(to.k&&to.keep!==false){ try{ const kr=Math.min(1,PH_KEEP/Math.max(W0,H0)), kc=document.createElement('canvas'); kc.width=Math.max(1,Math.round(W0*kr)); kc.height=Math.max(1,Math.round(H0*kr)); const d=imgDown(im,0,0,W0,H0,Math.max(kc.width,kc.height)), g=kc.getContext('2d'); g.imageSmoothingQuality='high'; g.drawImage(d.src,d.x,d.y,d.w,d.h,0,0,kc.width,kc.height); let u=''; try{ u=kc.toDataURL('image/webp',.82); }catch(e){} if(!/^data:image\/webp/.test(u))u=kc.toDataURL('image/jpeg',.82); if(u.length<=PH_KEEP_MAX)keep=u; }catch(e){} }
      phCropOpen({im,wc,w,h,W0,H0,to,keep,fromMenu}); }catch(err){ phReadErr(isF?src:null); } if(isF)URL.revokeObjectURL(url); };
  im.onerror=()=>{ if(isF)URL.revokeObjectURL(url); phReadErr(isF?src:null); }; im.src=url; }
function phCropOpen(o){ const d=phEl(); PH.mode='crop'; if(o.to.k)PH.k=o.to.k;
  d.innerHTML=`<div class="ph-box ph-crop" role="dialog" aria-modal="true" aria-label="사진 자르기"><div class="ph-head"><b>사진 자르기</b><button type="button" class="x" data-a="phCropNo" aria-label="취소">×</button></div>
    <p class="small muted">사진을 끌어서 옮기고, 두 손가락·마우스 휠·아래 막대로 크기를 바꿉니다.</p>
    <div class="phc-stage" tabindex="0" aria-label="자를 자리. 화살표로 옮기고 +, -로 크기를 바꿉니다"><canvas></canvas><span class="phc-ring" aria-hidden="true"></span></div>
    <label class="phc-zoom"><span aria-hidden="true">−</span><input type="range" min="0" max="1000" step="1" aria-label="확대"><span aria-hidden="true">＋</span></label>
    <div class="phc-prev"><span><canvas class="phc-r" width="112" height="112"></canvas>둥근 자리</span><span><canvas class="phc-s" width="144" height="144"></canvas>네모 자리</span></div>
    <div class="phc-acts"><button type="button" class="btn" data-a="phCropNo">취소</button><button type="button" class="btn primary" data-a="phCropOk">적용</button></div></div>`;
  const st=d.querySelector('.phc-stage'), V=Math.round(st.getBoundingClientRect().width)||300, c=PH.c={...o,V,s:1,x:0,y:0,min:V/Math.max(o.w,o.h),cov:V/Math.min(o.w,o.h),P:new Map()};
  c.max=Math.max(c.cov*4,c.min*4); c.s=c.cov; c.x=(V-o.w*c.s)/2; c.y=o.h>o.w?-(o.h*c.s-V)*.3:(V-o.h*c.s)/2; /* 세로 사진은 얼굴이 있는 위쪽을 조금 더(예전 자동 자르기와 같게) */ phClamp();
  const cv=st.querySelector('canvas'), dpr=Math.min(3,window.devicePixelRatio||1); cv.width=cv.height=Math.round(V*dpr); c.dpr=dpr; c.cv=cv; c.rg=d.querySelector('.phc-zoom input'); phSync(); phDraw();
  c.rg.addEventListener('input',()=>{ const t=+c.rg.value/1000; phZoomAt(c.min*Math.pow(c.max/c.min,t),V/2,V/2,true); });
  const pt=e=>{ const b=st.getBoundingClientRect(); return {x:(e.clientX-b.left)*V/b.width,y:(e.clientY-b.top)*V/b.height}; };
  st.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ st.setPointerCapture(e.pointerId); }catch(err){} c.P.set(e.pointerId,pt(e)); st.focus({preventScroll:true}); });
  st.addEventListener('pointermove',e=>{ if(!c.P.has(e.pointerId))return; e.preventDefault(); const q=pt(e), P=c.P;
    if(P.size===1){ const o0=P.get(e.pointerId); c.x+=q.x-o0.x; c.y+=q.y-o0.y; P.set(e.pointerId,q); phClamp(); phDraw(); return; }
    const ids=[...P.keys()].slice(0,2); if(!ids.includes(e.pointerId))return; const a=P.get(ids[0]), b=P.get(ids[1]), d0=Math.hypot(a.x-b.x,a.y-b.y), m0={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    P.set(e.pointerId,q); const a1=P.get(ids[0]), b1=P.get(ids[1]), d1=Math.hypot(a1.x-b1.x,a1.y-b1.y), m1={x:(a1.x+b1.x)/2,y:(a1.y+b1.y)/2};
    c.x+=m1.x-m0.x; c.y+=m1.y-m0.y; if(d0>4)phZoomAt(c.s*d1/d0,m1.x,m1.y); else { phClamp(); phDraw(); } });
  const up=e=>{ c.P.delete(e.pointerId); }; st.addEventListener('pointerup',up); st.addEventListener('pointercancel',up); st.addEventListener('lostpointercapture',up);
  st.addEventListener('wheel',e=>{ e.preventDefault(); const q=pt(e); phZoomAt(c.s*Math.exp(-Math.max(-120,Math.min(120,e.deltaY))*.0018),q.x,q.y); },{passive:false});
  phFocus(d); }
/* 사진이 틀을 늘 덮게(틀보다 작게 줄이면 가운데에 두고 남는 자리는 어두운 배경) */
function phClamp(){ const c=PH.c; if(!c)return; const w=c.w*c.s, h=c.h*c.s, V=c.V; c.x=w>=V?Math.min(0,Math.max(V-w,c.x)):(V-w)/2; c.y=h>=V?Math.min(0,Math.max(V-h,c.y)):(V-h)/2; }
function phZoomAt(ns,px,py,fromRange){ const c=PH.c; if(!c)return; ns=Math.min(c.max,Math.max(c.min,ns)); c.x=px-(px-c.x)*ns/c.s; c.y=py-(py-c.y)*ns/c.s; c.s=ns; phClamp(); if(!fromRange)phSync(); phDraw(); }
function phSync(){ const c=PH.c; if(c&&c.rg)c.rg.value=String(Math.round(1000*Math.log(c.s/c.min)/Math.log(c.max/c.min))); }
function phPaint(cv,src){ const g=cv.getContext('2d'), c=PH.c, S=cv.width, k=S/c.V; g.imageSmoothingQuality='high'; g.fillStyle='#0d1217'; g.fillRect(0,0,S,S); g.drawImage(src,c.x*k,c.y*k,c.w*c.s*k,c.h*c.s*k); }
function phDraw(){ const c=PH.c; if(!c||c.raf)return; c.raf=requestAnimationFrame(()=>{ c.raf=0; if(PH.c!==c)return; phPaint(c.cv,c.wc); const d=document.getElementById('phdlg'); if(!d)return; for(const q of d.querySelectorAll('.phc-prev canvas'))phPaint(q,c.wc); }); }
/* 적용: 원본(작업본 말고)에서 같은 자리를 384px로. 크게 줄일 때는 반씩 줄인다(imgDown) */
function phApply(){ const c=PH.c; if(!c)return; try{ const O=IMG_OUT, out=document.createElement('canvas'); out.width=out.height=O; const g=out.getContext('2d'); g.imageSmoothingQuality='high'; g.fillStyle='#0d1217'; g.fillRect(0,0,O,O);
    const k=O/c.V, dw=c.w*c.s*k, dh=c.h*c.s*k, d=imgDown(c.im,0,0,c.W0,c.H0,Math.max(dw,dh)); g.drawImage(d.src,d.x,d.y,d.w,d.h,c.x*k,c.y*k,dw,dh); const u=imgEnc(out), to=c.to;
    if(to.k){ (G.cimg=G.cimg||{})[to.k]=u; if(c.keep){ const M=G.cimgO=G.cimgO||{}; delete M[to.k]; M[to.k]=c.keep; const ks=Object.keys(M); for(const x of ks.slice(0,Math.max(0,ks.length-PH_KEEP_N)))delete M[x]; } else if(to.keep!==false&&G.cimgO)delete G.cimgO[to.k]; save(); }
    else if(to.me){ if(G&&G.gmP){ G.gmP.img=u; save(); } } else if(to.gp){ const gp=gpSync(); gp.img=u; }
    phClose(); render(); try{ renderSheet(); }catch(err){} if(!to.gp)toast('사진을 바꿨습니다.'); }catch(err){ phClose(); toast('사진을 읽지 못했습니다.'); } }
/* 파일을 고르면 자르기로: 소식함·인물·선수 사진(data-cimg), 단장 프로필(data-meimg), 새 단장 만들기(data-gpimg) */
document.addEventListener('change',e=>{ const el=e.target; if(!el||!el.matches||!el.matches('[data-cimg],[data-meimg],[data-gpimg]')||!el.files||!el.files[0]||!G&&!el.hasAttribute('data-gpimg'))return; const f=el.files[0];
  const to=el.hasAttribute('data-cimg')?{k:el.dataset.cimg}:el.hasAttribute('data-meimg')?{me:1}:{gp:1}; try{ el.value=''; }catch(err){} /* 같은 파일을 다시 골라도 바뀌게 */
  if(phBadType(f)){ toast('사진 파일만 넣을 수 있습니다.'); return; } phCrop(f,to); });
