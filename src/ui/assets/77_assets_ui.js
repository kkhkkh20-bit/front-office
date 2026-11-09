/* ===== 에셋 패키지 v2.1·v3 화면 연결(00b_assets_data.js의 ASSET) =====
 - 유니폼·모자(v3, 번호 없는 앞면): 구단 소개(구단 선택 자세히·구단 연대기)·국가대표 화면에만. 선수 얼굴 위에 합성하지 않는다(기존 얼굴 그대로)
 - 대회 마크·트로피: 포스트시즌·한국시리즈·우승 화면에만. 리그 이름(가칭 '프런트리그')과 리그 마크는 쓰지 않는다(기존 이름 유지)
 - 구장 배경: 공용 분위기 이미지. 특정 구장 외형·구장 효과와 연결하지 않고, 글자 뒤에는 어두운 겹침
 - 모든 숫자(진출 순위·시리즈 전적·우승 팀)는 엔진 상태(G.ps)에서 읽는다 */
function hasAsset(){ return typeof ASSET!=='undefined'&&ASSET; }
function uniRow(tid,opt){ if(!hasAsset())return ''; const U=tid==='kr'?ASSET.nat:ASSET.uni[tid]; if(!U)return ''; const sz=(opt&&opt.sz)||84; const nm=tid==='kr'?'국가대표':(G&&G.teams&&G.teams[tid]?tname(tid):U.n); /* 구단 선택(게임 전)은 G가 없다 */
  return `<div class="uni-row" aria-label="${esc(nm)} 유니폼과 모자">${[['h','홈 유니폼'],['a','원정 유니폼'],['c','모자']].map(([k,l])=>`<figure><img src="${U[k]}" width="${sz}" height="${sz}" alt="" loading="lazy" decoding="async"><figcaption>${l}</figcaption></figure>`).join('')}</div>`; }
function compMark(k,sz){ if(!hasAsset()||!ASSET.comp[k])return ''; return `<img class="cmark" src="${ASSET.comp[k]}" width="${sz}" height="${sz}" alt="" decoding="async">`; }
/* 에셋 v3(ASSET.v3): 시상식 무대·대진표 배경. v4(ASSET.v4): 트로피·상·대기록 실사 렌더(v3와 같은 manifest ID). 없으면 '' 또는 예전 그림으로 */
const v3=k=>hasAsset()&&ASSET.v3?ASSET.v3[k]:null, v4=k=>hasAsset()&&ASSET.v4?ASSET.v4[k]:null;
/* 트로피·대기록 그림 한 장(v4). txt가 있으면 manifest text_slots 자리(512 기준 비율)에 HTML 글자를 겹치고, 명판의 3/4 투시 기울기만큼 세로로 민다. 글자가 너무 작아지는 크기에서는 생략 */
function v3Img(id,sz,cls,alt,txt,slot){ const S=v4('img'), u=S&&S[id]; if(!u)return '';
  const img=`<img class="v3 ${cls||''}" src="${u}" width="${sz}" height="${sz}" alt="${esc(alt||'')}" decoding="async">`;
  const R=txt!=null&&(v4('slot')||{})[id], r=R&&R[slot||Object.keys(R)[0]]; if(!r)return img;
  const [x,y,w,h,f,c,vb,sk]=r, k=sz/vb, t=String(txt), em=[...t].reduce((a,ch)=>a+(/[가-힣]/.test(ch)?1:.6),0), fs=Math.min(f*k,h*k*.95,w*k/Math.max(1,em));
  if(fs<5)return img;
  return `<span class="v3w" style="width:${sz}px;height:${sz}px">${img}<b class="v3t" style="left:${x/vb*100}%;top:${y/vb*100}%;width:${w/vb*100}%;height:${h/vb*100}%;font-size:${fs.toFixed(1)}px;color:${c}${sk?`;transform:skewY(${sk}deg);transform-origin:0 0`:''}">${esc(t)}</b></span>`; }
function trophyImg(sz){ return v3Img('championship_trophy',sz,'trophy-img','우승 트로피')||(hasAsset()?`<img class="trophy-img" src="${ASSET.comp.trophy}" width="${sz}" height="${sz}" alt="우승 트로피" decoding="async">`:trophySvg()); }
const champTrophyImg=trophyImg;
function ggTrophyImg(sz){ return v3Img('golden_glove',sz,'gg-tro-img')||ART.glove(sz); }
/* 진열장 트로피: c 한국시리즈 우승 · r 준우승 · f 정규시즌 1위(페넌트). 없으면 예전 그림 */
function cupImg(k,sz){ return k==='c'?trophyImg(sz):v3Img(k==='r'?'runner_up_trophy':'regular_season_pennant',sz,'trophy-img',k==='r'?'준우승 트로피':'정규시즌 1위 페넌트')||ART.trophy(sz); }
/* 수상 이름 → v3 트로피 ID와 상패 글자(부문). 선수 수상(p.aw)·우승 반지·명예의 전당 문구 기준 */
function awV3(l){ const t=typeof TITLES!=='undefined'&&TITLES.find(t=>l===t[0]);
  if(t)return [t[2]?'pitching_title_blank':'batting_title_blank',t[0]];
  return [l.includes('골든글러브')?'golden_glove':l.includes('명예의 전당')?'hall_of_fame_plaque':l.includes('우승 반지')?'championship_ring':l.includes('감독상')?'manager_trophy'
    :l.includes('올스타')?(l.includes('MVP')?'all_star_mvp':l.includes('드림')?'all_star_dream_badge':'all_star_nanum_badge')
    :/WBC|올림픽|아시안게임|프리미어12/.test(l)?(/금메달|우승/.test(l)&&!l.includes('준우승')?'national_gold_medal':/은메달|준우승/.test(l)?'national_silver_medal':/동메달|4강/.test(l)?'national_bronze_medal':l.includes('영웅')?'mvp_trophy':null)
    :/(^|\s)MVP|최우수선수/.test(l)?'mvp_trophy':l.includes('신인')?'rookie_trophy':l.includes('준우승')?'runner_up_trophy':l.includes('우승')?'championship_trophy':null]; }
/* 대기록 배지: 경기 대기록은 전용 그림, 통산 이정표·시즌 기록은 공용 틀에 실제 기록값(문구 속 숫자). 전용 그림이 없는 기록은 예전 글자 아이콘 */
const FEAT_V3={cyc:'cycling_hit',nh:'no_hitter',tnh:'no_hitter',pg:'perfect_game',hr4:'four_home_runs',hrc:'consecutive_home_runs',wohr:'walk_off_home_run',gs:'grand_slam',k15:'fifteen_strikeouts',hs:'hitting_streak'};
const FEAT_SEASON=new Set(['s3030','s4040','hr40','hr50','h200','avg400','w20','sv40','k200','era0','era1','srec']);
function featIcon(x,sz){ const old=`<span class="ft-i k-${x.k}">${FEATI[x.k]||'·'}</span>`; sz=sz||40;
  const num=(String(x.txt||'').match(/\d*\.\d+|\d+/)||[])[0], v=x.k==='s3030'?'30-30':x.k==='s4040'?'40-40':num;
  const im=FEAT_V3[x.k]?v3Img(FEAT_V3[x.k],sz,'ft-v3',FEATK[x.k]):x.k==='mile'&&num?v3Img('career_milestone_frame',sz,'ft-v3',FEATK[x.k],num):FEAT_SEASON.has(x.k)&&v?v3Img('season_record_frame',sz,'ft-v3',FEATK[x.k],v):'';
  return im?`<span class="ft-i ft-im k-${x.k}">${im}</span>`:old; }
function bgHero(k,inner,cls){ const u=hasAsset()&&ASSET.stad[k]; if(!u)return inner; return `<div class="bg-hero ${cls||''}" style="background-image:linear-gradient(180deg,rgba(8,12,16,.55),rgba(8,12,16,.86)),url(${u})">${inner}</div>`; }
function natHead(){ if(!hasAsset())return ''; return `<div class="nt-id"><img src="${ASSET.nat.b128}" width="56" height="56" alt="" decoding="async"><div><b>대한민국 야구 국가대표</b><span class="small muted">국제대회 소집 명단·차출 현황</span></div>${uniRow('kr',{sz:64})}</div>`; }
/* ===== 실사 얼굴(00d_faces_data.js의 FACE6: v6c 완성본 100명, 예전 v6b 시범판과 같은 방식으로 씀) =====
 사용자 결정(2026-11-05): 검수 미통과지만 품질이 좋으니 먼저 연결. 처음엔 우리 구단만, 이후 모든 구단 선수(구단 안에서는 겹치지 않게). 무소속 선수는 그림 얼굴.
 - 국내 선수는 한국인 얼굴, 외국인은 출신에 맞춰(아시아쿼터: 일본·대만, 용병: 그 밖) 나이가 가까운 얼굴을 하나 정해 저장(G.f6 선수→칸, G.f6r 칸→선수)
 - 시트는 구단 홈 유니폼으로 미리 합성돼 있다(tools/gen-faces-v6b.py). 화면에서는 칸 하나를 잘라 작은 그림으로 캐시한다
 - 설정에서 끌 수 있다(G.f6off) */
const F6IMG={}, F6C=new Map(), F6B=new Map(); const F6WAIT='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#2b3442"/></svg>');
function face6Load(tid,big){ const k=(big===true?'b':big||'')+tid, src=typeof FACE6==='undefined'?null:(big===true?FACE6.big:big==='a'?FACE6.away:big==='2'?FACE6.sheet2:FACE6.sheet)?.[String(tid)]; /* big: true=선수 상세 큰 사진, 'a'=원정 유니폼, '2'=v13 추가 60명(100번부터, 128px만) */ if(F6IMG[k]||!src)return F6IMG[k]; const im=new Image(); F6IMG[k]=im; im.onload=()=>{ im.ok=true; if(big)F6C.clear(); clearTimeout(face6Load.t); face6Load.t=setTimeout(()=>{ try{ render(); renderSheet&&UI.sheet!=null&&renderSheet(); }catch(e){} },30); }; im.f6=true; im.src=src; return im; }
function face6Pool(p){ return FACE6.ids.map((x,i)=>i).filter(i=>{ const x=FACE6.ids[i]; if(!p.foreign)return !x.f; if(!x.f)return false; const asia=/Japanese|Taiwanese|Filipino|Australian/.test(x.e); /* 아시아쿼터: 아시아 국가·호주(v13 필리핀·호주 포함) */ return p.foreign==='아시아'?asia:!asia; }); }
/* 모든 구단 선수(사용자 11-05): 얼굴 100명을 구단마다 겹치지 않게 나눠 쓴다(리그 전체에서는 같은 얼굴이 여러 구단에 있을 수 있음). G.f6 선수→칸, G.f6r '구단:칸'→선수 */
function face6Idx(p){ if(!G||G.f6off||!p||p.persona||p.id==null||p.team==null||typeof FACE6==='undefined'||!FACE6.sheet[String(p.team)])return null;
  const fv=FACE6.v==='6c'?3:2; if(G.f6v!==fv){ G.f6={}; G.f6r={}; G.f6v=fv; } /* 얼굴 세트가 바뀌면(v6b→v6c) 배정을 새로 */
  const M=G.f6, Rv=G.f6r, t=p.team, key=i=>t+':'+i; const cur=M[p.id]; if(cur!=null&&Rv[key(cur)]===p.id)return cur;
  const free=i=>{ const o=Rv[key(i)]; if(o==null||o===p.id)return true; const q=G.players[o]; return !q||q.team!==t; };
  if(cur!=null&&free(cur)&&face6Pool(p).includes(cur)){ Rv[key(cur)]=p.id; return cur; } /* 이적해도 새 구단에서 비어 있으면 같은 얼굴 */
  const C=face6Pool(p).filter(free); if(!C.length)return null;
  /* 리그 전체에서 덜 쓰인 얼굴부터(사용자 11-08: 외국인 얼굴이 늘 같다) — 같은 구단 안 중복은 위 free가 막는다 */
  const U={}; for(const k in Rv){ const q=G.players[Rv[k]]; if(q&&q.team!=null&&q.id!==p.id&&String(q.team)===k.split(':')[0]){ const i=+k.split(':')[1]; U[i]=(U[i]||0)+1; } }
  const fu=p.foreign?1:0, ad=i=>Math.round(Math.abs(FACE6.ids[i].a-p.age)/4); /* 외국인은 덜 쓰인 얼굴 먼저, 국내는 나이대(4살 단위) 안에서 덜 쓰인 얼굴 */
  C.sort((a,b)=>fu*((U[a]||0)-(U[b]||0))||ad(a)-ad(b)||(U[a]||0)-(U[b]||0)||Math.abs(FACE6.ids[a].a-p.age)-Math.abs(FACE6.ids[b].a-p.age)||hn('f6'+a,p.id)-hn('f6'+b,p.id)); const i=C[0]; M[p.id]=i; Rv[key(i)]=p.id; return i; }
function face6Cut(im,cs,i,x,y,w,o,pad,big){ const c=document.createElement('canvas'); c.width=c.height=o; const g=c.getContext('2d'); g.imageSmoothingQuality='high'; const P=im.f6&&FACE6.pitch?FACE6.pitch[cs]:0, sx=(i%10)*(P||cs)+(P?FACE6.off:0), sy=Math.floor(i/10)*(P||cs)+(P?FACE6.off:0); /* v6c 시트는 칸 사이 여백이 있다 */
  /* 머리 위 여백: 원본 칸에는 모자 위가 거의 없어서, 배경(칸 위 양쪽 모서리 평균색, 왼→오 그라데이션)으로 채운 뒤 사진을 pad 비율만큼 내려 그린다(사용자 11-05) */
  const pd=Math.round(o*(pad||0)), sh=w*(o-pd)/o; if(pd){ const px=(ax)=>{ const t=document.createElement('canvas'); t.width=t.height=1; const tg=t.getContext('2d'); tg.drawImage(im,ax,sy+2,Math.round(cs*.08),Math.round(cs*.08),0,0,1,1); const d=tg.getImageData(0,0,1,1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };
    const gr=g.createLinearGradient(0,0,o,0); gr.addColorStop(0,px(sx+2)); gr.addColorStop(1,px(sx+cs-2-Math.round(cs*.08))); g.fillStyle=gr; g.fillRect(0,0,o,pd+2);
    g.drawImage(im,sx+x,sy+y,w,sh,0,pd,o,o-pd); const fd=g.createLinearGradient(0,pd,0,pd+Math.round(o*.05)); fd.addColorStop(0,'rgba(0,0,0,1)'); fd.addColorStop(1,'rgba(0,0,0,0)'); /* 이음새를 부드럽게: 배경색 띠를 사진 위쪽으로 살짝 번지게 */
    const m=document.createElement('canvas'); m.width=o; m.height=Math.round(o*.05)+1; const mg=m.getContext('2d'); mg.fillStyle=gr; mg.fillRect(0,0,o,m.height); mg.globalCompositeOperation='destination-in'; const f2=mg.createLinearGradient(0,0,0,m.height); f2.addColorStop(0,'rgba(0,0,0,1)'); f2.addColorStop(1,'rgba(0,0,0,0)'); mg.fillStyle=f2; mg.fillRect(0,0,o,m.height); g.drawImage(m,0,pd); void fd; }
  else g.drawImage(im,sx+x,sy+y,w,w,0,0,o,o);
  return big?c.toDataURL('image/webp',.92):c.toDataURL('image/jpeg',.9); }
function face6Src(o){ const i=face6Idx(o); if(i==null)return null; const tid=o.team; if(i>=100)return face6Src2(tid,i); let aw=''; try{ const c=UI.cast, g=c&&G.games[c.g]; if(g&&g.away===tid&&g.home!==tid&&FACE6.away)aw='a'; }catch(e){} /* 원정 경기 중계 중에는 원정 유니폼 */ const k=aw+tid+':'+i; if(F6C.has(k))return F6C.get(k);
  { const bg=!aw&&FACE6.v==='6c'&&FACE6.big&&FACE6.big[String(tid)]?face6Load(tid,true):null; if(bg&&bg.ok){ try{ const u=face6Cut(bg,256,i,52,50,152,256,0); F6C.set(k,u); F6B.set(u,{tid,i}); return u; }catch(e){} } } /* 256px 시트가 있으면(사이트) 작은 자리도 선명하게(사용자 11-06: 크게 보이는 자리 화질) */
  const im=face6Load(tid,aw); if(!im)return null; if(!im.ok)return F6WAIT; /* 사진을 푸는 동안 그림 얼굴이 잠깐 보였다가 바뀌지 않게 빈 칸(사용자 11-06) */ try{ const u=FACE6.v==='6c'?face6Cut(im,128,i,26,25,76,128,0):face6Cut(im,128,i,26,0,76,128,.1); if(!(FACE6.big&&FACE6.big[String(tid)]&&!aw))F6C.set(k,u); F6B.set(u,{tid,i}); return u; }catch(e){ return null; } } /* 작은 자리(목록·카드)는 모자~턱 확대. 턱이 잘리지 않게 모자 위쪽을 조금 자른다(사용자 11-08) */
/* v13 추가 얼굴(100번부터): 원정 유니폼·256px 시트가 없어 128px 홈 시트에서만 자른다 */
function face6Src2(tid,i){ const k='2'+tid+':'+i; if(F6C.has(k))return F6C.get(k); const im=face6Load(tid,'2'); if(!im)return null; if(!im.ok)return F6WAIT; try{ const u=face6Cut(im,128,i-100,26,25,76,128,0); F6C.set(k,u); F6B.set(u,{tid,i}); return u; }catch(e){ return null; } }
/* 큰 자리(선수 상세): 모자부터 가슴 심벌까지. 256px 시트가 있으면(사이트) 선명하게, 없으면(아티팩트) 128px 시트로 */
function face6Bust(x){ if(x.f7)return face7Bust(x.f7); const k='B'+x.tid+':'+x.i; if(F6C.has(k))return F6C.get(k); if(x.i>=100){ const im=face6Load(x.tid,'2'); if(!im||!im.ok)return null; try{ const u=face6Cut(im,128,x.i-100,7,7,114,232,0,true); F6C.set(k,u); return u; }catch(e){ return null; } } try{ const bg=face6Load(x.tid,true); let u; const c6=FACE6.v==='6c'; /* v6c: 완성 사진이라 머리 위 여백을 덧대지 않고 모자~쇄골 */ if(bg&&bg.ok)u=c6?face6Cut(bg,256,x.i,14,14,228,464,0,true):face6Cut(bg,256,x.i,40,0,176,464,.1,true); else { const im=face6Load(x.tid); if(!im||!im.ok)return null; u=c6?face6Cut(im,128,x.i,7,7,114,232,0,true):face6Cut(im,128,x.i,20,0,88,232,.1,true); if(bg)return u; } F6C.set(k,u); return u; }catch(e){ return null; } }
Object.assign(A,{ f6Tog(){ G.f6off=!G.f6off; try{ FACEC.clear(); }catch(e){} save(); render(); } });
/* 카페 버그 제보용 게임 정보(이름·저장 내용은 넣지 않는다) */
function fbInfoText(){ let d=''; try{ if(G)d=`${G.year}년 ${dmd(G.day)} · ${period()} · ${tname(G.user)}`; }catch(e){} return `[게임 정보] 버전 ${GAME_VER} · ${d||'게임 시작 전'} · 화면 ${UI.tab||''}${UI.tab&&UI.sub&&UI.sub[UI.tab]?'/'+UI.sub[UI.tab]:''} · ${innerWidth<=1000?'휴대폰':'PC'} ${innerWidth}x${innerHeight} · ${(navigator.userAgent.match(/(Edg|Chrome|Firefox|Safari)\/[\d.]+/)||[''])[0]}${/iPhone|iPad/.test(navigator.userAgent)?' · iOS':/Android/.test(navigator.userAgent)?' · Android':''}${(()=>{ const f=globalThis.__fo3d; return f||globalThis.__fo3dGpu?` · 3D ${f?`${f.t||'-'} ${f.p!=null?Math.round(f.p*100)+'%':''} (${f.at}초)`:'-'} · GPU ${globalThis.__fo3dGpu||'-'}`:''; })()}`; }
Object.assign(A,{ fbInfo(){ const t=fbInfoText(); const ok=()=>{ try{ toast('게임 정보를 복사했습니다. 카페 글에 붙여 넣어 주세요.'); }catch(e){} }; try{ navigator.clipboard.writeText(t).then(ok,()=>{ prompt('아래 내용을 복사해 카페 글에 붙여 넣어 주세요.',t); }); }catch(e){ prompt('아래 내용을 복사해 카페 글에 붙여 넣어 주세요.',t); } } });
/* 마우스로 끌 때 글자가 선택되거나 사진이 끌려 나오지 않게(사용자 11-05, 전체화면 포함). 입력칸은 그대로 */
try{ document.addEventListener('dragstart',e=>{ const t=e.target; if(t&&(t.tagName==='IMG'||t.tagName==='A'||(t.closest&&t.closest('img,a'))))e.preventDefault(); },true); }catch(e){}
/* ===== v7 감독·코치·단장·구단주·직원 실사 얼굴(시범 126명, 00e_staff_faces_data.js의 FACE7) =====
 - 감독·코치(mgr·coach): 구단 홈 유니폼 시트에서, 같은 구단 안에서는 겹치지 않게. 여성 인물은 그림 얼굴(사진 없음)
 - 다른 구단 단장(gm)·구단주(own)·직원(staff): 성별 맞춰 리그 전체에서 겹치지 않게. 우리 단장이 고른 사진(G.gmP.face='p7:칸')은 다른 단장에게 쓰지 않는다
 - 에이전트·팬은 그림 얼굴 */
/* v8(남은 인물 120명): 역할을 o.role로 받거나 pid로 알아낸다. 단장 소개 사진(p7:)·그림 단장 후보(gm)·감독·코치·단장·구단주는 v7 그대로 */
function face8Role(o){ if(typeof FACE8==='undefined'||!o)return null; if(o.role)return o.role; const pid=String(o.pid??''), P=o.persona;
  if(P==='agent')return /^press/.test(pid)?'press':/^agt/.test(pid)?'agent':'press'; /* 에이전트 외 agent 얼굴은 기자 */
  if(P!=='staff'||/^(p7:|gm)/.test(pid))return null; if(/^st:비서:/.test(pid))return 'sec'; if(/^doc/.test(pid))return 'doc'; if(/^fan/.test(pid))return 'fan'; if(/^ceo/.test(pid))return 'ceo'; return null; }
/* v9 젊은 단장·v10 여성 스태프(FACE8 뒤에 붙음): 단장은 52세 아래면 v9·v10, 여성 코치·분석원은 v10 staff, 여성 직원은 v10 front까지 */
const F8L=(r,f)=>typeof FACE8==='undefined'?[]:FACE8.ids.map((x,i)=>Object.assign({},x,{c:i})) /* c = FACE8 목록 번호(칸 번호 x.c가 덮지 않게, 11-07) */.filter(x=>x.r===r&&(f==null||!!x.f===f));
function face7Pool(o){ if(typeof FACE7==='undefined')return null; const P=o.persona, f=!!o.female; { const r8=face8Role(o); if(r8){ const L=FACE8.ids.map((x,i)=>Object.assign({},x,{c:i})) /* c = FACE8 목록 번호(칸 번호 x.c가 덮지 않게, 11-07) */.filter(x=>x.r===r8||(r8==='ana'&&f&&x.r==='staff')); const Lf=L.filter(x=>!!x.f===f); return {k:'8',ids:Lf.length?Lf:L}; } }
  if(P==='mgr'||P==='coach'){ if(!f)return {k:'c',ids:FACE7.coach.ids}; const L=F8L('staff',true); return L.length?{k:'8',ids:L}:null; }
  if(P==='gm'&&(o.age||50)<52){ const L=F8L('gm',f); if(L.length)return {k:'8',ids:L}; }
  if(P==='staff'&&!/^(p7:|p8:|gm)/.test(String(o.pid??''))&&(f||(o.age||50)<40)){ const L=F8L('front',f); if(L.length)return {k:'8',ids:L}; } /* 여성 직원은 v10, 40세 아래 남성 직원은 v12 젊은 프런트 */
  const r=P==='gm'?'gm':P==='own'?'owner':P==='staff'?'front':null; if(!r)return null; return {k:'v',ids:FACE7.civ.ids.filter(x=>x.r===r&&!!x.f===f)}; }
function face7Idx(o){ if(!o||o.pid==null||(G&&G.f6off))return null; const pid=String(o.pid);
  if(o.persona==='staff'&&pid.startsWith('p7:'))return typeof FACE7==='undefined'?null:{k:'v',c:+pid.slice(3)};
  if(o.persona==='staff'&&pid.startsWith('p8:'))return typeof FACE8==='undefined'||!FACE8.ids[+pid.slice(3)]?null:{k:'8',c:+pid.slice(3)}; /* v9·v10 단장 사진을 고른 경우 */ /* 우리 단장이 고른 사진(새 게임 전 단장 소개 화면에서도) */
  if(!G)return null;
  if(o.persona==='staff'&&/^gm/.test(pid))return null; /* 그림 얼굴 후보 */
  const pl=face7Pool(o); if(!pl||!pl.ids.length)return null; const team=pl.k==='c'?(o.team??G.user):'L'; const scope=pl.k+team+(pl.k==='8'?face8Role(o):'');
  const M=G.f7=G.f7||{}, Rv=G.f7r=G.f7r||{}, key=o.persona+':'+pid; const mf=String((G.gmP&&G.gmP.face)||''), mine=/^p[78]:/.test(mf)?+mf.slice(3):-1, mk=mf.startsWith('p8:')?'8':'v';
  const cur=M[key]; if(cur!=null&&Rv[scope+':'+cur]===key&&!(pl.k===mk&&cur===mine))return {k:pl.k,c:cur,team};
  const free=x=>{ const h=Rv[scope+':'+x.c]; return (h==null||h===key)&&!(pl.k===mk&&x.c===mine); };
  let C=pl.ids.filter(free); if(!C.length)C=pl.ids.filter(x=>!(pl.k===mk&&x.c===mine)); if(!C.length)return null; /* 다 쓰면 겹치는 것을 허용 */
  const age=o.age||50; C=[...C].sort((a,b)=>Math.abs(a.a-age)-Math.abs(b.a-age)||hn('f7'+a.c,pid)-hn('f7'+b.c,pid)); const c=C[0].c; M[key]=c; Rv[scope+':'+c]=key; return {k:pl.k,c,team}; }
function face7Img(x,big){ if(x.k==='8'){ const pg=FACE8.ids[x.c].p, k='v8_'+pg; if(!F6IMG[k]){ const im=new Image(); F6IMG[k]=im; im.onload=()=>{ im.ok=true; clearTimeout(face6Load.t); face6Load.t=setTimeout(()=>{ try{ render(); renderSheet&&UI.sheet!=null&&renderSheet(); }catch(e){} },30); }; im.src=FACE8.s128[pg]; } return [F6IMG[k],128]; }
  if(x.k==='c'){ const k='c7'+x.team; if(!F6IMG[k]&&FACE7.coach.sheet[String(x.team)]){ const im=new Image(); F6IMG[k]=im; im.onload=()=>{ im.ok=true; clearTimeout(face6Load.t); face6Load.t=setTimeout(()=>{ try{ render(); }catch(e){} },30); }; im.src=FACE7.coach.sheet[String(x.team)]; } return [F6IMG[k],128]; }
  const k=big?'v7b':'v7s'; if(!F6IMG[k]){ const im=new Image(); F6IMG[k]=im; im.onload=()=>{ im.ok=true; if(big)F6C.clear(); clearTimeout(face6Load.t); face6Load.t=setTimeout(()=>{ try{ render(); renderSheet&&UI.sheet!=null&&renderSheet(); }catch(e){} },30); }; im.src=big?FACE7.civ.s256:FACE7.civ.s128; } return [F6IMG[k],big?256:128]; }
/* 단장 나이 변화(v14): v9 단장 사진 20명은 사진 나이보다 8살 이상 많아지면 +10, 18살 이상이면 +20 사진(요청서 기준). 사진이 없는 사람은 그대로 */
function gmAgeC(c,age){ if(typeof FACE8==='undefined'||age==null)return c; const b=FACE8.ids[c]; if(!b||b.r!=='gm'||b.v!=='9')return c; const d=age-b.a, s=d>=18?20:d>=8?10:0; if(!s)return c; const j=FACE8.ids.findIndex(x=>x.r==='gmage'&&x.b===c&&x.s===s); return j<0?c:j; }
/* FACE8 칸 하나(작은 자리) */
function face8Src(c){ const x={k:'8',c}, k='78:'+c; if(F6C.has(k))return F6C.get(k); const [im]=face7Img(x,false); if(!im)return null; if(!im.ok)return F6WAIT; try{ const u=face6Cut(im,128,FACE8.ids[c].c,26,0,76,128,0); F6C.set(k,u); F6B.set(u,{f7:x}); return u; }catch(e){ return null; } }
function face7Src(o){ let x=face7Idx(o); if(!x)return null; if(x.k==='8'&&(o.persona==='gm'||String(o.pid??'').startsWith('p8:')))x={...x,c:gmAgeC(x.c,o.age)}; const k='7'+x.k+(x.team??'')+':'+x.c; if(F6C.has(k))return F6C.get(k); if(x.k==='8')return face8Src(x.c);
  if(x.k==='v'&&FACE7.civ.s256){ const [bg]=face7Img(x,true); if(bg&&bg.ok){ try{ const u=face6Cut(bg,256,x.c,52,0,152,256,0); F6C.set(k,u); F6B.set(u,{f7:x}); return u; }catch(e){} } } const [im]=face7Img(x,false); if(!im)return null; if(!im.ok)return F6WAIT;
  try{ const u=face6Cut(im,128,x.c,26,0,76,128,0); F6C.set(k,u); F6B.set(u,{f7:x}); return u; }catch(e){ return null; } }
function face7Bust(x){ const k='7B'+x.k+(x.team??'')+':'+x.c; if(F6C.has(k))return F6C.get(k); if(x.k==='8'){ try{ const [im]=face7Img(x,false); if(!im||!im.ok)return null; const u=face6Cut(im,128,FACE8.ids[x.c].c,18,0,92,232,0,true); F6C.set(k,u); return u; }catch(e){ return null; } } try{ let u; if(x.k==='v'){ const [bg]=face7Img(x,true); if(bg&&bg.ok)u=face6Cut(bg,256,x.c,36,0,184,464,0,true); }
  if(!u){ const [im]=face7Img(x,false); if(!im||!im.ok)return null; u=face6Cut(im,128,x.c,18,0,92,232,0,true); if(x.k==='v')return u; } F6C.set(k,u); return u; }catch(e){ return null; } }
/* 단장 소개: 성별·나이에 맞는 단장 사진 6장(가까운 나이 12명 중 무작위). '다른 사진 6명'은 방금 본 사진을 빼고 다시 */
/* 단장 소개 후보는 v9·v10 단장 사진만(옛 v7 중년 사진·외국인 얼굴 제외, 사용자 요청 11-09) */
const GP_SKIP=[123,124,133,137,140,152,144,145,148,179,208,212,218];
function gp7Seeds(g,re){ if(typeof FACE7==='undefined')return []; const f=!!g.female, prev=UI.gp7&&UI.gp7.f===f?UI.gp7.L:[];
  if(!re&&UI.gp7&&UI.gp7.f===f&&UI.gp7.a===g.age)return UI.gp7.L;
  let P=F8L('gm',f).filter(x=>!GP_SKIP.includes(x.c)).map(x=>({a:x.a,k:'p8:'+x.c})).sort((a,b)=>Math.abs(a.a-g.age)-Math.abs(b.a-g.age)); /* v7 단장 + v9·v10 젊은 단장 */ if(re&&P.length>6){ const q=P.filter(x=>!prev.includes(x.k)); if(q.length>=6)P=q; }
  const W=P.slice(0,Math.max(12,Math.min(18,P.length))).map(x=>x.k).sort(()=>Math.random()-.5).slice(0,12); /* 그림 얼굴을 없앤 대신 사진 후보 12장 */ UI.gp7={f,a:g.age,L:W}; return W; }
Object.assign(A,{ gpFace7(){ gp7Seeds(UI.gp||gpDefault(),true); render(); } });
/* ===== v14 장면 사진(응원 무대·팬 행사·스카우트 출장, 1280x720 WebP 22장) =====
 - 장면은 HTML에 넣지 않는다(용량). 사이트는 tools/build-site.cjs가 assets/v14/를 함께 올리고, 저장소에서 연 index.html도 옆 폴더에서 읽는다
 - 처음 한 장을 시험으로 받아 보고 되면 그린다. 못 받으면(아티팩트·파일 하나만 받은 경우) 그림 자리를 아예 만들지 않는다 */
const SCENE_N={cheer_basic:3,cheer_expanded:3,cheer_large:3,scout_weekend:3,scout_tournament:2,scout_dugout:2,scout_winter:2};
const scenePath=id=>'assets/v14/'+(id.startsWith('event_')?'cheer/events/':id.startsWith('cheer_')?'cheer/stage/':'scout/scenes/')+id+'.webp';
let SCENE_OK=null; /* null 아직 · 'wait' 시험 중 · true 됨 · false 안 됨 */
function sceneProbe(){ if(SCENE_OK!==null||typeof Image==='undefined')return; SCENE_OK='wait'; const im=new Image(); im.onload=()=>{ SCENE_OK=true; try{ render(); }catch(e){} }; im.onerror=()=>{ SCENE_OK=false; }; im.src=scenePath('event_first_pitch'); }
const sceneOf=(g,seed)=>SCENE_N[g]?g+'_'+(1+shash(seed)%SCENE_N[g]):g; /* shash: 44b_cheer_squad.js */
function sceneImg(id,alt,cls){ sceneProbe(); if(SCENE_OK!==true)return ''; return `<img class="scene-im ${cls||''}" src="${scenePath(id)}" width="1280" height="720" alt="${esc(alt||'')}" loading="lazy" decoding="async">`; }
/* 스카우트 소식: 내용에 맞는 출장 장면(드래프트 회의·겨울 전훈·전국대회·더그아웃 면담·주말리그) */
function mailScene(m){ if(!/스카우트/.test(m.from||''))return ''; const t=(m.subj||'')+' '+(m.body||'').slice(0,120), mo=dobj(m.day).m;
  const g=/드래프트|지명 회의|지명 순위/.test(t)?'scout_draft_meeting':/감독|면담|귀띔/.test(t)?'scout_dugout':mo===12||mo<=2?'scout_winter':/대회|봉황|청룡|황금사자|대통령배|협회장기/.test(t)?'scout_tournament':'scout_weekend';
  return sceneImg(sceneOf(g,m.id),'스카우트 출장','ibm-scene'); }
