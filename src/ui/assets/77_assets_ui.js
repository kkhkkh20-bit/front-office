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
/* v16 트로피(11-09): 우승 series·정규 1위 season·우승 반지 ring. 128px은 한 파일 앱에도 들어 있고(TRO16), 큰 자리는 사이트에서 256px을 받는다 */
function tro16(k,sz,alt){ if(typeof TRO16==='undefined'||!TRO16[k])return ''; sceneProbe(); const src=sz>100&&SCENE_OK===true?`assets/v16/champ/trophy/app/trophy_${k}_256.webp`:TRO16[k]; return `<img class="trophy-img tro16" src="${src}" width="${sz}" height="${sz}" alt="${alt||''}" decoding="async">`; }
function trophyImg(sz){ return tro16('series',sz,'우승 트로피')||v3Img('championship_trophy',sz,'trophy-img','우승 트로피')||(hasAsset()?`<img class="trophy-img" src="${ASSET.comp.trophy}" width="${sz}" height="${sz}" alt="우승 트로피" decoding="async">`:trophySvg()); }
const champTrophyImg=trophyImg;
function ggTrophyImg(sz){ return v3Img('golden_glove',sz,'gg-tro-img')||ART.glove(sz); }
/* 진열장 트로피: c 한국시리즈 우승 · r 준우승 · f 정규시즌 1위(v16 정규시즌 트로피). 없으면 예전 그림 */
function cupImg(k,sz){ return k==='c'?trophyImg(sz):(k==='f'&&tro16('season',sz,'정규시즌 1위 트로피'))||v3Img(k==='r'?'runner_up_trophy':'regular_season_pennant',sz,'trophy-img',k==='r'?'준우승 트로피':'정규시즌 1위 페넌트')||ART.trophy(sz); }
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
const F6IMG={}, F6C=new Map(), F6B=new Map(); const F6WAIT='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2b3442"/><circle cx="32" cy="25" r="11" fill="#4d5a6c"/><path d="M11 64c2-14 10-22 21-22s19 8 21 22z" fill="#4d5a6c"/></svg>'); /* 사진을 받는 동안: 빈 칸 대신 실루엣(UI 3단계 3-6). 다른 얼굴이 잠깐 보였다 바뀌지 않게 그림 얼굴은 쓰지 않는다 */
/* 사진 시트를 받다가 실패하면(통신 끊김·배포 순간) 세 번까지 다시 받고, 그래도 안 되면 빈 칸 대신 그림 얼굴로 보여 준다(펨코 11-13: 선수 사진이 전부 빈 화면).
   예전에는 한 번 실패하면 새로 고칠 때까지 계속 빈 칸이었다 */
function f6Retry(im){ im.onerror=()=>{ im._n=(im._n||0)+1; if(im._n<=3){ const base=im._src||(im._src=im.getAttribute('src')); setTimeout(()=>{ try{ im.src=!base||base.startsWith('data:')?base:base+(base.includes('?')?'&':'?')+'r='+im._n; }catch(e){} },1200*im._n); } else { im.bad=true; const redraw=()=>{ if(typeof CT!=='undefined'&&CT.run&&UI.cast){ setTimeout(redraw,1500); return; } /* 중계가 재생 중이면 끝난 뒤에 다시 그린다: 사진 한 장이 안 읽혔다고 화면 전체를 다시 그리면 재생 중인 장면이 끊겼다(11-13) */ try{ render(); renderSheet&&UI.sheet!=null&&renderSheet(); }catch(e){} }; redraw(); } }; return im; }
function face6Pool(p){ return FACE6.ids.map((x,i)=>i).filter(i=>{ const x=FACE6.ids[i]; if(x.x)return false; /* x: 새 배정에서 뺀 얼굴(v18 흰 배경 4명, tools/gen-faces-v18.py SKIP) */ if(!p.foreign)return !x.f; if(!x.f)return false; const asia=/Japanese|Taiwanese|Filipino|Australian/.test(x.e); /* 아시아쿼터: 아시아 국가·호주(v13 필리핀·호주 포함) */ return p.foreign==='아시아'?asia:!asia; }); }
/* 모든 구단 선수(사용자 11-05): 얼굴 100명을 구단마다 겹치지 않게 나눠 쓴다(리그 전체에서는 같은 얼굴이 여러 구단에 있을 수 있음). G.f6 선수→칸, G.f6r '구단:칸'→선수 */
/* 얼굴 재사용 쉬는 기간(사용자 11-17): 은퇴하거나 KBO를 떠난 선수의 얼굴(구단:칸)은 그 구단 새 선수에게 20시즌 동안 주지 않는다.
   G.f6cd['구단:칸']=떠난 해. 떠날 때 dropP가 f6Gone을 부르고, 그 전 저장(기록 없이 주인이 사라진 칸)은 처음 볼 때 그해를 떠난 해로 적는다(지금 배정은 그대로).
   새 얼굴을 고를 때 쉬는 칸을 빼고, 남은 칸이 없으면 가장 오래 쉰 칸부터. 같은 조건이면 리그 전체에서 가장 오래전에 놓인 얼굴부터.
   선수 출신 지도자가 쓰는 얼굴(G.f6s)은 리그에 있는 동안 잡아 둔다: 화면에 나온 해(G.f6sY)를 적고, F6OB시즌 넘게 안 보이면 떠난 것으로 보고 그 해부터 쉰다 */
const F6CD=20, F6OB=3;
function f6Gone(id){ if(typeof G==='undefined'||!G||!G.f6r)return; const R=G.f6r; let cd=null; for(const k in R)if(R[k]===id){ (cd=cd||(G.f6cd=G.f6cd||{}))[k]=G.year; delete R[k]; } }
function face6Idx(p){ if(!G||G.f6off||!p||p.persona||p.id==null||p.team==null||typeof FACE6==='undefined'||!FACE6.sheet[String(p.team)])return null;
  const fv=FACE6.v==='6c'?3:2; if(G.f6v!==fv){ G.f6={}; G.f6r={}; G.f6s={}; G.f6cd={}; G.f6v=fv; } /* 얼굴 세트가 바뀌면(v6b→v6c) 배정을 새로 */
  const M=G.f6, Rv=G.f6r, t=p.team, key=i=>t+':'+i; const cur=M[p.id]; if(cur!=null&&Rv[key(cur)]===p.id)return cur;
  const Y=G.year||0;
  const free=i=>{ if(G.f6s&&G.f6s[key(i)]){ const sy=G.f6sY=G.f6sY||{}, y=sy[key(i)]; if(y==null)sy[key(i)]=Y; if(y==null||Y-y<=F6OB)return false; (G.f6cd=G.f6cd||{})[key(i)]=y; delete G.f6s[key(i)]; delete sy[key(i)]; return true; } /* 선수 출신 지도자가 쓰는 얼굴: 화면에 나온 지 F6OB시즌 안이면 잡아 두고, 그보다 오래 안 보이면(리그를 떠남) 그때부터 쉰다 */ const o=Rv[key(i)]; if(o==null||o===p.id)return true; const q=G.players[o]; if(!q||q.team==null&&q.retY!=null){ (G.f6cd=G.f6cd||{})[key(i)]=q?Math.min(q.retY,Y):Y; delete Rv[key(i)]; return true; } /* 기록 없이 떠난 선수(예전 저장)는 지금을, 은퇴했지만 기록만 남은 선수(외국인 은퇴)는 은퇴한 해를 떠난 해로 적고 쉬게 한다 */ return q.team!==t; };
  const own=k=>{ Rv[k]=p.id; if(G.f6cd)delete G.f6cd[k]; };
  if(cur!=null&&face6Pool(p).includes(cur)){ if(free(cur))own(key(cur)); return cur; } /* 이적해도 같은 얼굴(유니폼만 바뀜). 새 구단에 같은 얼굴이 있어도 바꾸지 않는다(사용자 11-14: 트레이드되면 얼굴이 바뀜) */
  const B=face6Pool(p).filter(free); if(!B.length)return null;
  const cdY=i=>{ const y=G.f6cd&&G.f6cd[key(i)]; return y!=null&&Y-y<F6CD?y:-Infinity; };
  let C=B.filter(i=>cdY(i)===-Infinity); if(!C.length){ const m=Math.min(...B.map(cdY)); C=B.filter(i=>cdY(i)===m); } /* 모두 쉬는 중이면 가장 오래 쉰 칸 */
  /* 리그 전체에서 덜 쓰인 얼굴부터(사용자 11-08: 외국인 얼굴이 늘 같다) — 같은 구단 안 중복은 위 free가 막는다 */
  const U={}; for(const k in Rv){ const q=G.players[Rv[k]]; if(q&&q.team!=null&&q.id!==p.id&&String(q.team)===k.split(':')[0]){ const i=+k.split(':')[1]; U[i]=(U[i]||0)+1; } }
  const L={}; for(const k in (G.f6cd||{})){ const i=+k.split(':')[1]; L[i]=Math.max(L[i]??-Infinity,G.f6cd[k]); } const ly=i=>L[i]??-Infinity; /* 리그 어디서든 가장 최근에 놓인 해(놓인 적 없으면 가장 오래) */
  const fu=p.foreign?1:0, ad=i=>Math.round(Math.abs(FACE6.ids[i].a-p.age)/4); /* 외국인은 덜 쓰인 얼굴 먼저, 국내는 나이대(4살 단위) 안에서 덜 쓰인 얼굴 */
  C.sort((a,b)=>fu*((U[a]||0)-(U[b]||0))||ad(a)-ad(b)||(U[a]||0)-(U[b]||0)||(ly(a)-ly(b)||0)||Math.abs(FACE6.ids[a].a-p.age)-Math.abs(FACE6.ids[b].a-p.age)||hn('f6'+a,p.id)-hn('f6'+b,p.id)); const i=C[0]; M[p.id]=i; own(key(i)); return i; }
/* 얼굴 칸별 머리 가로 중심(00j2_face_centers_data.js, 칸 너비 비율). 원본 그림에서 사람이 한쪽으로 밀린 칸만 있다(v18 4명 묶음 자르기 밀림 등) */
function fcAt(set,key,c){ const v=typeof FACECTR!=='undefined'&&FACECTR[set]&&FACECTR[set][key], q=v&&v[c]; return q?q/1000:null; }
/* 자르는 창(칸 안 x,y,w)을 머리 중심 fc 쪽으로 옮긴다. 칸 밖(검은 테두리·옆 칸)으로 나가야 하면 창을 줄여(최대 1.39배 확대) 칸 안에서 최대한 가운데로. 위가 0이면(모자 끝 맞춤) 위는 그대로 */
function fcWin(cs,x,y,w,fc){ if(fc==null)return [x,y,w]; const c0=fc*cs; if(c0-w/2<0||c0-w/2>cs-w){ const w2=Math.max(w*.72,Math.min(w,2*Math.min(c0,cs-c0))); if(w2<w){ if(y>0)y+=(w-w2)/2; w=w2; } } return [Math.min(Math.max(c0-w/2,0),cs-w),y,w]; }
function face6Cut(im,cs,i,x,y,w,o,pad,big,fc){ [x,y,w]=fcWin(cs,x,y,w,fc);
  const c=document.createElement('canvas'); c.width=c.height=o; const g=c.getContext('2d'); g.imageSmoothingQuality='high'; const P=im.pitch||(im.f6&&FACE6.pitch?FACE6.pitch[cs]:0), O=P?(im.off??FACE6.off):0, sx=(i%10)*(P||cs)+O, sy=Math.floor(i/10)*(P||cs)+O; /* v6c 시트는 칸 사이 여백이 있다. im.pitch: 시트마다 칸 간격을 따로 가진 경우(v18 384·v19 비서) */
  /* 머리 위 여백: 원본 칸에는 모자 위가 거의 없어서, 배경(칸 위 양쪽 모서리 평균색, 왼→오 그라데이션)으로 채운 뒤 사진을 pad 비율만큼 내려 그린다(사용자 11-05) */
  const pd=Math.round(o*(pad||0)), sh=w*(o-pd)/o; if(pd){ const px=(ax)=>{ const t=document.createElement('canvas'); t.width=t.height=1; const tg=t.getContext('2d'); tg.drawImage(im,ax,sy+2,Math.round(cs*.08),Math.round(cs*.08),0,0,1,1); const d=tg.getImageData(0,0,1,1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };
    const gr=g.createLinearGradient(0,0,o,0); gr.addColorStop(0,px(sx+2)); gr.addColorStop(1,px(sx+cs-2-Math.round(cs*.08))); g.fillStyle=gr; g.fillRect(0,0,o,pd+2);
    g.drawImage(im,sx+x,sy+y,w,sh,0,pd,o,o-pd); const fd=g.createLinearGradient(0,pd,0,pd+Math.round(o*.05)); fd.addColorStop(0,'rgba(0,0,0,1)'); fd.addColorStop(1,'rgba(0,0,0,0)'); /* 이음새를 부드럽게: 배경색 띠를 사진 위쪽으로 살짝 번지게 */
    const m=document.createElement('canvas'); m.width=o; m.height=Math.round(o*.05)+1; const mg=m.getContext('2d'); mg.fillStyle=gr; mg.fillRect(0,0,o,m.height); mg.globalCompositeOperation='destination-in'; const f2=mg.createLinearGradient(0,0,0,m.height); f2.addColorStop(0,'rgba(0,0,0,1)'); f2.addColorStop(1,'rgba(0,0,0,0)'); mg.fillStyle=f2; mg.fillRect(0,0,o,m.height); g.drawImage(m,0,pd); void fd; }
  else g.drawImage(im,sx+x,sy+y,w,w,0,0,o,o);
  return big?c.toDataURL('image/webp',.92):c.toDataURL('image/jpeg',.9); }
/* 소속 없는 외국인(시장 후보·방출·FA): v17 무지 훈련복 60명. 같은 국적 → 덜 쓰인 얼굴 → 나이 순으로 고르고, 고른 번호는 G.f17에 남겨 다시 열어도 같은 얼굴(사용자 11-09 "용병 사진 다 빠졌는데?") */
const F17N={'미국':['US','CA','DE','IT','ZA','NL-CW'],'도미니카공화국':['DO','PR','CU','MX'],'베네수엘라':['VE','CU','MX','PR'],'일본':['JP'],'대만':['TW'],'호주':['AU','PH']};
function face17Idx(p){ if(typeof FACE17==='undefined'||typeof FACE6==='undefined'||!G||G.f6off||!p||p.persona||!p.foreign||p.id==null)return null; const M=G.f17||(G.f17={}); if(p.team!=null&&M[p.id]==null)return null; /* 소속 구단이 있으면 예전에 배정한 얼굴만 쓴다 */ if(M[p.id]!=null&&FACE17.ids[M[p.id]])return M[p.id];
  const q=p.foreign==='아시아'?1:0, N=F17N[p.nat]||[]; let C=FACE17.ids.map((x,i)=>i).filter(i=>FACE17.ids[i].q===q); const C2=C.filter(i=>N.includes(FACE17.ids[i].n)); if(C2.length)C=C2;
  const U={}; for(const id of Object.keys(M)){ const o=G.players[id]; if(o&&o.team==null)U[M[id]]=(U[M[id]]||0)+1; else delete M[id]; } /* 구단과 계약했거나 사라진 선수는 배정을 지운다(계약하면 구단 유니폼 사진) */
  const ad=i=>Math.round(Math.abs(FACE17.ids[i].a-(p.age||28))/4); C.sort((a,b)=>(U[a]||0)-(U[b]||0)||ad(a)-ad(b)||hn('f17'+a,p.id)-hn('f17'+b,p.id)); return M[p.id]=C[0]; }
/* ===== 고교·대학 선수(드래프트 대상) 사진 연결부: v21 납품을 기다린다(사용자 결정 11-17) =====
 - 선수 사진 시트는 모두 프로 구단 유니폼이라 소속 없는 국내 아마추어는 예전 그림 얼굴로 보인다. 임시 사진은 쓰지 않는다
 - FACE21 번호표 모듈(v21 아마추어 200명, docs/asset-requests/2026-11-17-codex-v21-amateur-faces.md: base·pitch·h·ids[{a,g}])을 더하면 아래가 켜진다. 그 전에는 아무것도 하지 않는다
 - 배정 G.fam[선수]={k:'21',c:칸}: 같은 아마추어는 늘 같은 얼굴. 지금 드래프트 대상끼리 덜 쓰인 얼굴부터, 나이 가까운 얼굴. 고교 hs_home·대학 univ
 - 지명되면 같은 신원의 구단 홈 유니폼 시트(FACE21 팀 변형, 구단 열쇠는 FACE21.teams 또는 v18과 같은 표)로 잇는다 */
function amFaceOn(p){ return !!p&&!!p.prospect&&!p.foreign&&p.team==null&&p.id!=null&&!p.persona; }
function amIdx(p){ if(typeof FACE21==='undefined'||!FACE21.ids||!FACE21.ids.length||!G||G.f6off||!p||p.id==null)return null; const M=G.fam||(G.fam={}), cur=M[p.id];
  if(cur&&cur.k==='21'&&FACE21.ids[cur.c])return cur; if(!amFaceOn(p))return null; /* 지명된 선수는 받은 얼굴 그대로, 아마추어 때 배정이 없으면 새로 주지 않는다 */
  const U={}; for(const id of Object.keys(M)){ const q=G.players[id]||(G.amU&&G.amU.L&&G.amU.L[id]); if(!q){ delete M[id]; continue; } if((q.prospect||q.gy)&&M[id].k==='21')U[M[id].c]=(U[M[id].c]||0)+1; } /* 저학년(G.amU)도 같은 얼굴을 지켜 졸업 학년까지 이어 간다(스카우트 1단계 관찰 명단) */ /* 사라진 선수 배정은 지운다 */
  const ad=c=>Math.round(Math.abs(FACE21.ids[c].a-(p.age||19))/3); const C=FACE21.ids.map((x,i)=>i).sort((a,b)=>(U[a]||0)-(U[b]||0)||ad(a)-ad(b)||hn('fam'+a,p.id)-hn('fam'+b,p.id));
  return M[p.id]={k:'21',c:C[0]}; }
/* 시트 한 장: A·B × 128·256·384 × 변형(고교 hs_home, 대학 univ, 구단 열쇠) */
function amVar(p){ if(p.team==null)return p.college?'univ':'hs_home'; const T=FACE21.teams||FACE6.v18&&FACE6.v18.teams||{}; return T[String(p.team)]||null; }
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
/* 단장 나이 변화(v14): v9 단장 사진 20명은 사진 나이보다 8살 이상 많아지면 +10, 18살 이상이면 +20 사진(요청서 기준). 사진이 없는 사람은 그대로 */
function gmAgeC(c,age){ if(typeof FACE8==='undefined'||age==null)return c; const b=FACE8.ids[c]; if(!b||b.r!=='gm'||b.v!=='9')return c; const d=age-b.a, s=d>=18?20:d>=8?10:0; if(!s)return c; const j=FACE8.ids.findIndex(x=>x.r==='gmage'&&x.b===c&&x.s===s); return j<0?c:j; }
/* ===== v19 비서 20명(00k_people_v19_data.js, 여 16·남 4): 비서 사진은 v19에서 배정한다(사용자 요청 11-16) =====
 - 배정 G.f19s['staff:st:비서:구단']={c:칸,t:구단}: 한 구단 안에서는 겹치지 않게, 리그 전체에서는 덜 쓰인 사진부터. 비서 이름(서하린)이 여성이라 자동 배정은 성별을 맞춘다
 - 소식함 발신자의 사진 버튼 옆 '템플릿'에서 v19 20명 + 예전 v8 비서 8명 중 고를 수 있다(G.secPh[같은 열쇠]='19:칸'|'8:FACE8 번호'). 고른 사진은 그대로 둔다
 - 옛 저장의 v8 비서 배정(G.f7)은 쓰지 않고 v19로 바꾼다(사용자가 새 사진을 원함). 갤러리 사진(G.cimg)은 faceSVG가 먼저 쓴다
 - 파일을 못 받으면(내려받은 HTML) 예전 v8 비서 사진으로 돌아간다(face7Src 아래 경로) */
const SEC8=()=>typeof FACE8==='undefined'?[]:FACE8.ids.map((x,i)=>x.r==='sec'?i:-1).filter(i=>i>=0);
function secCands(){ return [...(typeof FACE19==='undefined'?[]:FACE19.ids.map((x,i)=>'19:'+i)),...SEC8().map(i=>'8:'+i)]; }
function secIdx(o){ if(typeof FACE19==='undefined'||!G||G.f6off||!o||o.pid==null)return null; const key=o.persona+':'+o.pid, P=G.secPh&&G.secPh[key];
  if(P&&secCands().includes(P)){ const [k,c]=P.split(':'); return {k,c:+c,pick:true}; }
  const M=G.f19s=G.f19s||{}, cur=M[key]; if(cur&&FACE19.ids[cur.c])return {k:'19',c:cur.c};
  const t=String(o.team??G.user), U={}, T=new Set(); for(const k in M){ if(k===key||!M[k])continue; const c=M[k].c; U[c]=(U[c]||0)+1; if(String(M[k].t)===t)T.add(c); }
  for(const k in (G.secPh||{})){ const v=String(G.secPh[k]); if(v.startsWith('19:')&&M[k]&&String(M[k].t)===t)T.add(+v.slice(3)); } /* 같은 구단 비서가 고른 사진도 겹치지 않게 */
  const f=o.female==null?1:o.female?1:0, all=FACE19.ids.map((x,i)=>i); let C=all.filter(i=>FACE19.ids[i].f===f&&!T.has(i)); if(!C.length)C=all.filter(i=>!T.has(i)); if(!C.length)C=all;
  C.sort((a,b)=>(U[a]||0)-(U[b]||0)||hn('f19'+a,key)-hn('f19'+b,key)); const c=C[0]; M[key]={c,t}; return {k:'19',c}; }
/* 소식함·인물 화면 사진 버튼 옆 '템플릿': v19 20명 + v8 비서 8명. k = cimgKey('P:staff:st:비서:구단') */
function secPickHtml(k){ if(typeof FACE19==='undefined'||!G||G.f6off||!/^P:staff:st:비서:/.test(String(k)))return ''; const key=String(k).slice(2), cur=(G.secPh&&G.secPh[key])||(G.f19s&&G.f19s[key]?'19:'+G.f19s[key].c:'');
  const th=v=>{ const [g,c]=v.split(':'), u=g==='8'?face8Src(+c):face19Src(+c); return u&&u!==F6WAIT?`<img src="${u}" alt="">`:'<span class="av ini">?</span>'; };
  return `<details class="pe-sec sec-pick"><summary>템플릿 사진 <span class="muted">(${secCands().length}장)</span></summary><div class="pe-faces">${secCands().map(v=>`<button class="pe-face${v===cur?' on':''}" data-a="secPh" data-v="${esc(key+'|'+v)}" title="${v.startsWith('8:')?'예전 비서 사진':'비서 사진'}">${th(v)}</button>`).join('')}</div>${G.secPh&&G.secPh[key]?`<button class="btn small" data-a="secPh" data-v="${esc(key+'|')}">자동 배정으로</button>`:''}</details>`; }
Object.assign(A,{ secPh(v){ if(!G)return; const s=String(v), i=s.lastIndexOf('|'), key=s.slice(0,i), val=s.slice(i+1); if(!/^staff:st:비서:/.test(key))return; G.secPh=G.secPh||{}; if(!val)delete G.secPh[key]; else if(secCands().includes(val))G.secPh[key]=val; else return; save(); render(); try{ renderSheet(); }catch(e){} if(typeof phRefresh==='function')phRefresh(); } });
/* 은퇴 선수 출신 코치·감독·단장·스카우트(사용자 11-17 "선수시절 사진쓰게하자"): 선수 때 실사 사진(G.f6)을 그대로, 유니폼은 지금 구단(무소속이면 마지막 구단).
   나이 단계 사진이 없어 지도자도 선수 시절 얼굴이다. 고른 칸은 G.f6s[구단:칸]에 남겨 같은 구단 새 선수에게 같은 얼굴을 주지 않는다(face6Idx free) */
function obPhotoSrc(o){ if(!G||G.f6off||!o||o.pid==null||typeof FACE6==='undefined'||!/^(coach|mgr|gm|staff|agent)$/.test(o.persona||''))return null; const fid=G.obFace&&G.obFace[o.pid]; if(fid==null||typeof fid==='string'&&!/^\d+$/.test(fid))return null;
  const i=G.f6&&G.f6[fid]; if(i==null)return null; const p=G.players[fid], h=p&&(p.hist||[]).filter(x=>x.t!=null), ob=(G.ob||[]).find(x=>String(x.fid)===String(fid));
  const ok=t=>t!=null&&FACE6.sheet[String(t)]; const tid=ok(o.team)?o.team:ok(p&&p.team)?p.team:ok(ob&&ob.team)?ob.team:h&&h.length&&ok(h[h.length-1].t)?h[h.length-1].t:null; if(tid==null)return null;
  const S=G.f6s=G.f6s||{}, mk=o.persona+':'+o.pid; for(const k in S)if(S[k]===mk&&k!==tid+':'+i)delete S[k]; S[tid+':'+i]=mk; (G.f6sY=G.f6sY||{})[tid+':'+i]=G.year; if(G.f6cd)delete G.f6cd[tid+':'+i]; return face6At(tid,i); }
/* ===== 얼굴 사진 한 길: 주소 → 시트 → 자르기 → 캐시 (사용자 11-17 얼굴 처리 통합) =====
 - 얼굴 주소 {s:묶음, t:시트 열쇠(구단·변형), c:묶음 안 번호, v:'a' 원정 유니폼}. 배정(누가 어느 얼굴)은 위 함수들(G.f6·G.f7·G.f17·G.f19s·G.fam·G.obFace·G.f6s)이 정하고, 여기서는 그림만 만든다
   p: 선수 FACE6(t 구단, c 0~99 v6c·100~159 v13·160~ v18) · f17: 소속 없는 외국인 · am: 고교·대학(t 유니폼 변형) · f7v: v7 단장·구단주·직원 · f7c: v7 감독·코치(t 구단) · f8: FACE8 인물 · f19: v19 비서
 - faceSheets(주소, 큰 자리)가 쓸 수 있는 시트를 선명한 순서로(칸 번호·자르는 창 포함) 주고, faceCut이 받아진 시트 중 가장 선명한 것으로 자른다.
   더 선명한 시트를 아직 받는 중이면 결과를 캐시하지 않고, 받으면 다시 그린다(소식함 큰 사진이 128px를 늘린 채로 남지 않게). 아무 시트도 아직 없으면 작은 자리는 실루엣(F6WAIT), 큰 자리는 null(작은 사진을 그대로)
 - 작은 자리 결과는 F6B(그림 → 주소)에 남겨, 큰 자리(faceBust: 32_people.js)가 같은 주소의 흉상을 찾는다 */
function faceImg(k,src,o){ if(F6IMG[k])return F6IMG[k]; if(!src)return null; const im=new Image(); F6IMG[k]=im; f6Retry(im); if(o&&o.f6)im.f6=true; if(o&&o.pitch){ im.pitch=o.pitch; im.off=8; }
  im.onload=()=>{ im.ok=true; if(o&&o.big)F6C.clear(); clearTimeout(faceImg.t); faceImg.t=setTimeout(()=>{ try{ render(); renderSheet&&UI.sheet!=null&&renderSheet(); }catch(e){} },30); }; im.src=src; return im; }
function faceSheets(a,b){ const L=[], add=(im,cs,cell,x,y,w,o,pad,fc)=>{ if(im)L.push({im,cs,cell,cr:[x,y,w,o,pad||0],fc:fc??null}); }, s=a.s, c=a.c;
  if(s==='p'){ const tid=a.t, T=String(tid);
    if(c>=160){ const V=FACE6.v18; if(!V||!V.teams[T])return L; const r=c-V.o, sh=r<100?'A':'B', cc=r%100, fc=fcAt('v18',sh+tid,cc), ld=cs=>{ const h=V.h&&V.h[sh+cs]; return faceImg('18'+sh+cs+':'+tid,V.base+sh+'/'+cs+'/'+V.teams[T]+'.webp'+(h?'?v='+h:''),{f6:1,pitch:V.pitch&&V.pitch[cs],big:cs>128}); };
      /* v18: 머리가 칸 위쪽까지 차 있어 작은 자리는 모자~턱을 넓게, 큰 자리는 칸 위부터 거의 전부(모자 끝이 칸 가장자리에 붙어 있음). 큰 자리는 384(v18b) → 256 → 128 */
      if(b){ if(V.pitch&&V.pitch['384'])add(ld(384),384,cc,6,0,372,576,0,fc); add(ld(256),256,cc,4,0,248,464,0,fc); add(ld(128),128,cc,2,0,124,232,0,fc); } else add(ld(128),128,cc,19,9,90,128,0,fc); return L; }
    if(c>=100){ const S2=FACE6.sheet2, cc=c-100, fc=fcAt('v13',tid,cc), hd=S2&&S2[T]?faceImg('2b'+tid,`assets/v13/face256/${tid}.webp`,{f6:1,big:1}):null, lo=S2?faceImg('2'+tid,S2[T],{f6:1,big:1}):null; /* v13 60명: 256px는 사이트에만(내려받은 HTML은 128px) */
      if(b){ add(hd,256,cc,14,14,228,464,0,fc); add(lo,128,cc,7,7,114,232,0,fc); } else { add(hd,256,cc,52,50,152,256,0,fc); add(lo,128,cc,26,25,76,128,0,fc); } return L; }
    const c6=FACE6.v==='6c', hd=FACE6.big&&FACE6.big[T]?faceImg('b'+tid,FACE6.big[T],{f6:1,big:1}):null; /* v6c: 완성 사진이라 머리 위 여백을 덧대지 않는다(v6b는 pad .1) */
    if(b){ if(c6){ add(hd,256,c,14,14,228,464,0); add(faceImg(T,FACE6.sheet[T],{f6:1}),128,c,7,7,114,232,0); } else { add(hd,256,c,40,0,176,464,.1); add(faceImg(T,FACE6.sheet[T],{f6:1}),128,c,20,0,88,232,.1); } return L; }
    const aw=a.v==='a'; if(!aw&&c6)add(hd,256,c,52,50,152,256,0); /* 256px 시트가 있으면 작은 자리도 선명하게(사용자 11-06) */
    const lo=aw?faceImg('a'+tid,FACE6.away&&FACE6.away[T],{f6:1,big:1}):faceImg(T,FACE6.sheet[T],{f6:1}); if(c6)add(lo,128,c,26,25,76,128,0); else add(lo,128,c,26,0,76,128,.1); /* 작은 자리는 모자~턱 확대(턱이 잘리지 않게 모자 위쪽을 조금 자른다, 11-08) */ return L; }
  if(s==='f17'){ const im=typeof FACE17==='undefined'?null:faceImg('f17',FACE17.s256,{f6:1}); if(b)add(im,256,c,14,14,228,464,0); else add(im,256,c,52,50,152,256,0); return L; }
  if(s==='am'){ if(typeof FACE21==='undefined')return L; const sh=c<100?'A':'B', cc=c%100, ld=cs=>{ if(!FACE21.pitch||!FACE21.pitch[cs])return null; const h=FACE21.h&&FACE21.h[sh+cs+'/'+a.t]; return faceImg('am21'+sh+cs+a.t,FACE21.base+sh+'/'+cs+'/'+a.t+'.webp'+(h?'?v='+h:''),{f6:1,pitch:FACE21.pitch[cs],big:cs>128}); };
    if(b){ add(ld(384),384,cc,6,0,372,576,0); add(ld(256),256,cc,4,0,248,464,0); } else add(ld(256),256,cc,38,18,180,128,0); /* 작은 자리 이마~턱, 큰 자리 머리~가슴 */ return L; }
  if(s==='f7v'){ if(typeof FACE7==='undefined')return L; const hd=faceImg('v7b',FACE7.civ.s256,{big:1}), lo=faceImg('v7s',FACE7.civ.s128);
    if(b){ add(hd,256,c,36,0,184,464,0); add(lo,128,c,18,0,92,232,0); } else { add(hd,256,c,52,0,152,256,0); add(lo,128,c,26,0,76,128,0); } return L; }
  if(s==='f7c'){ if(typeof FACE7==='undefined')return L; const im=faceImg('c7'+a.t,FACE7.coach.sheet[String(a.t)]); if(b)add(im,128,c,18,0,92,232,0); else add(im,128,c,26,0,76,128,0); return L; }
  if(s==='f8'){ const e=typeof FACE8!=='undefined'&&FACE8.ids[c]; if(!e)return L; const im=faceImg('v8_'+e.p,FACE8.s128[e.p]), z=e.z||128; /* z: 칸 크기(v15 단원은 256px, 얼굴이 커서 어깨까지 넓게) */
    if(b)add(im,z,e.c,18*z/128,0,92*z/128,232,0); else if(e.v==='15')add(im,z,e.c,z/16,0,z*7/8,z,0); else add(im,128,e.c,26,0,76,128,0); return L; }
  if(s==='f19'){ if(typeof FACE19==='undefined')return L; const ld=cs=>faceImg('19s'+cs,FACE19.base+cs+'.webp?v='+FACE19.h[cs],{f6:1,pitch:FACE19.pitch[cs],big:cs>128});
    if(b){ add(ld(256),256,c,8,0,240,464,0); add(ld(128),128,c,4,0,120,232,0); } else add(ld(128),128,c,20,2,88,128,0); /* 작은 자리 머리~어깨 위, 큰 자리 거의 칸 전체 */ return L; }
  return L; }
const faceKeyOf=a=>a.s+(a.v||'')+':'+(a.t??'')+':'+a.c;
function faceCut(a,b){ if(!a)return null; b=!!b; const k=(b?'B':'S')+faceKeyOf(a); if(F6C.has(k))return F6C.get(k); let L; try{ L=faceSheets(a,b); }catch(e){ return null; }
  let wait=false; for(const x of L){ const im=x.im; if(!im.ok){ if(!im.bad)wait=true; continue; } /* 더 선명한 시트를 받는 중: 지금 것으로 그리고 캐시하지 않는다(받으면 다시 그림) */
    try{ const u=face6Cut(im,x.cs,x.cell,...x.cr,b,x.fc); if(!wait)F6C.set(k,u); if(!b)F6B.set(u,a); return u; }catch(e){ return null; } }
  return wait&&!b?F6WAIT:null; }
/* 큰 자리(흉상): 작은 자리에서 만든 그림의 주소로 같은 사람을 다시 자른다(32_people.js faceBust) */
function face6Bust(a){ return faceCut(a,true); }
/* 선수: 소속 없는 외국인은 v17 무지 훈련복, 고교·대학 선수는 v21(FACE21이 있을 때만, 지명 뒤에도 같은 신원의 구단 유니폼), 나머지는 구단 유니폼 FACE6 */
function face6Src(o){ if(o&&o.foreign&&o.id!=null&&(o.team==null||(G&&G.f17&&G.f17[o.id]!=null))){ const c=face17Idx(o); return c==null?null:faceCut({s:'f17',c}); } /* 후보 때 본 얼굴(훈련복 사진)은 계약한 뒤에도 그대로(사용자 제보 11-15) */
  if(typeof FACE21!=='undefined'&&o&&o.id!=null&&!o.foreign&&!o.persona&&(amFaceOn(o)||G&&G.fam&&G.fam[o.id])){ const x=amIdx(o), vk=x&&amVar(o); const u=vk?faceCut({s:'am',t:vk,c:x.c}):null; if(u)return u; }
  const i=face6Idx(o); if(i==null)return null; return face6At(o.team,i); }
/* 구단 tid 유니폼의 FACE6 칸 i(선수 사진, 은퇴 후 지도자 사진도 같은 길). 원정 경기 중계 중에는 원정 유니폼(v6c 100명만) */
function face6At(tid,i){ let aw=false; if(i<100)try{ const c=UI.cast, g=c&&G.games[c.g]; aw=!!(g&&g.away===tid&&g.home!==tid&&FACE6.away); }catch(e){} return faceCut(aw?{s:'p',t:tid,c:i,v:'a'}:{s:'p',t:tid,c:i}); }
function face8Src(c){ return faceCut({s:'f8',c}); }
/* 비서 v19 작은 자리. undefined = 시트를 못 받음(v8 비서 사진으로 돌아감) */
function face19Src(c){ if(typeof FACE19==='undefined')return undefined; const u=faceCut({s:'f19',c}); return u==null?undefined:u; }
function secSrc(o){ const x=secIdx(o); if(!x)return undefined; if(x.k==='8')return face8Src(x.c); return face19Src(x.c); }
/* 인물: 선수 출신이면 선수 시절 사진, 비서는 v19(못 받으면 v8), 나머지는 v7·v8 배정 */
function face7Src(o){ { const u=obPhotoSrc(o); if(u)return u; } if(face8Role(o)==='sec'){ const u=secSrc(o); if(u!==undefined)return u; }
  let x=face7Idx(o); if(!x)return null; if(x.k==='8'&&(o.persona==='gm'||String(o.pid??'').startsWith('p8:')))x={...x,c:gmAgeC(x.c,o.age)};
  return faceCut(x.k==='8'?{s:'f8',c:x.c}:x.k==='c'?{s:'f7c',t:x.team,c:x.c}:{s:'f7v',c:x.c}); }
Object.assign(A,{ f6Tog(){ G.f6off=!G.f6off; try{ FACEC.clear(); }catch(e){} save(); render(); } });
/* 카페 버그 제보용 게임 정보(이름·저장 내용은 넣지 않는다) */
function fbInfoText(){ let d=''; try{ if(G)d=`${G.year}년 ${dmd(G.day)} · ${period()} · ${tname(G.user)}`; }catch(e){} return `[게임 정보] 버전 ${GAME_VER} · ${d||'게임 시작 전'} · 화면 ${UI.tab||''}${UI.tab&&UI.sub&&UI.sub[UI.tab]?'/'+UI.sub[UI.tab]:''} · ${innerWidth<=1000?'휴대폰':'PC'} ${innerWidth}x${innerHeight} · ${(navigator.userAgent.match(/(Edg|Chrome|Firefox|Safari)\/[\d.]+/)||[''])[0]}${/iPhone|iPad/.test(navigator.userAgent)?' · iOS':/Android/.test(navigator.userAgent)?' · Android':''}${(()=>{ const f=globalThis.__fo3d; return f||globalThis.__fo3dGpu?` · 3D ${f?`${f.t||'-'} ${f.p!=null?Math.round(f.p*100)+'%':''} (${f.at}초)`:'-'} · GPU ${globalThis.__fo3dGpu||'-'}`:''; })()}`; }
Object.assign(A,{ fbInfo(){ const t=fbInfoText(); const ok=()=>{ try{ toast('게임 정보를 복사했습니다. 카페 글에 붙여 넣어 주세요.'); }catch(e){} UI.fbOk=1; try{ render(); }catch(e){} }; /* 복사 뒤 설정 카드에 '카페에 붙여 넣기' 버튼을 띄운다 */ try{ navigator.clipboard.writeText(t).then(ok,()=>{ prompt('아래 내용을 복사해 카페 글에 붙여 넣어 주세요.',t); }); }catch(e){ prompt('아래 내용을 복사해 카페 글에 붙여 넣어 주세요.',t); } } });
/* 마우스로 끌 때 글자가 선택되거나 사진이 끌려 나오지 않게(사용자 11-05, 전체화면 포함). 입력칸은 그대로 */
try{ document.addEventListener('dragstart',e=>{ const t=e.target; if(t&&(t.tagName==='IMG'||t.tagName==='A'||(t.closest&&t.closest('img,a'))))e.preventDefault(); },true); }catch(e){}
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

/* 운영·육성 실사 장면: 같은 경로를 사이트 패키지에 포함한다. 단일 HTML에 폴더가 없으면 사진만 생략한다. */
const OPS_ART={"ovs_abl_game":{"title":"호주리그 실전 파견","v":{"480":"f2bb83fc1f9c","960":"0b76f5d573dc"}},"ovs_us_lab":{"title":"미국 피칭·타격 랩","v":{"480":"c9a98fa9ce3e","960":"04e2e427487c"}},"ovs_jpl_mechanics":{"title":"일본 대학·연구소 메커니즘","v":{"480":"e8a25d415f68","960":"885e611aaba6"}},"ovs_cnd_performance":{"title":"미국 컨디셔닝 센터","v":{"480":"6c675551ec92","960":"5f0b4cf8330e"}},"ovs_kac_academy":{"title":"국내 피칭·타격 아카데미","v":{"480":"c716a423f8fe","960":"c705d3f20517"}},"med_screening":{"title":"상태 평가·부하 점검","v":{"480":"70973390416b","960":"e393c6cc7738"}},"med_rehab":{"title":"재활·회복 훈련","v":{"480":"be535b329237","960":"c46aac7f473a"}},"med_return_bullpen":{"title":"복귀 전 실전 점검","v":{"480":"96ce02d839ed","960":"b5707ed8d6b8"}}};
const OPS_OVS_ART={abl:'ovs_abl_game',us:'ovs_us_lab',jpl:'ovs_jpl_mechanics',cnd:'ovs_cnd_performance',kac:'ovs_kac_academy'};
function opsPhoto(id,cls,small){ const a=OPS_ART[id]; if(!a)return ''; const n=small?480:960, path=w=>`assets/design-review/2026-11-10/photos/${w}/${id}.webp?v=${a.v[w]}`;
  return `<img class="ops-photo ${cls||''}" src="${path(n)}" ${small?'':`srcset="${path(480)} 480w, ${path(960)} 960w" sizes="(max-width:699px) calc(100vw - 50px), (max-width:1099px) 45vw, 38vw"`} width="${n}" height="${n*9/16}" alt="${esc(a.title)} 설명용 사진" loading="${small?'eager':'lazy'}" decoding="async" onerror="this.hidden=true">`; }
